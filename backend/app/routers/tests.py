from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate, PipelineStage
from app.services.csv_parser import parse_test_results_csv
from app.services.ranking import compute_composite_score
from app.logger import get_logger
import json

router = APIRouter()
log = get_logger("tests_router")


@router.post("/upload")
async def upload_test_results(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload test results CSV and update candidate scores."""
    if not file.filename.endswith(".csv"):
        return {"error": "Only CSV files are accepted"}

    content = await file.read()
    test_results = parse_test_results_csv(content)

    updated = []
    not_found = []

    for result in test_results:
        email = result.get("email", "").strip()
        name = result.get("name", "").strip()

        # Match by name first (most specific), then email
        # Reason: multiple candidates can share a dummy/test email (e.g. during testing)
        # so matching by name avoids only the first shared-email candidate getting updated.
        candidate = None
        if name:
            candidate = db.query(Candidate).filter(Candidate.name == name).first()
        if not candidate and email:
            candidate = db.query(Candidate).filter(Candidate.email == email).first()
        if not candidate:
            not_found.append(name or email)
            continue

        test_la = float(result.get("test_la", 0)) if result.get("test_la") != "" else None
        test_code = float(result.get("test_code", 0)) if result.get("test_code") != "" else None

        candidate.test_la_score = test_la
        candidate.test_code_score = test_code
        candidate.stage = PipelineStage.TEST_COMPLETED

        # Recompute composite score with test scores
        if candidate.score_explanation:
            breakdown = json.loads(candidate.score_explanation)
            ai_scores = {}
            for key in ["resume_jd_relevance", "github_quality", "project_quality", "research_quality"]:
                score_val = breakdown.get("components", {}).get(key, {}).get("score", 0)
                reasoning = breakdown.get("explanations", {}).get(key, "")
                ai_scores[key] = {"score": score_val, "reasoning": reasoning}

            new_breakdown = compute_composite_score(
                ai_scores, candidate.cgpa, test_la=test_la, test_code=test_code
            )
            candidate.composite_score = new_breakdown["composite_score"]
            candidate.score_explanation = json.dumps(new_breakdown)

        updated.append({"name": candidate.name, "email": email, "test_la": test_la, "test_code": test_code})

    db.commit()
    log.info("Test results uploaded", updated=len(updated), not_found=len(not_found))

    return {
        "updated": len(updated),
        "not_found": not_found,
        "results": updated,
    }
