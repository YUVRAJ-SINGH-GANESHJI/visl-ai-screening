from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.csv_parser import parse_candidate_csv
from app.models.candidate import Candidate
from app.logger import get_logger

router = APIRouter()
log = get_logger("upload_router")


@router.post("/candidates")
async def upload_candidates(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload candidate CSV file."""
    if not file.filename.endswith(".csv"):
        log.warning("Invalid file type uploaded", filename=file.filename)
        return {"error": "Only CSV files are accepted"}

    content = await file.read()
    candidates = parse_candidate_csv(content, file.filename)

    # Clear all existing candidates on every new upload for a clean slate
    deleted = db.query(Candidate).delete()
    db.commit()
    log.info("Cleared existing candidates before fresh upload", deleted=deleted)

    db_candidates = []
    for c in candidates:
        candidate = Candidate(
            s_no=c.get("s_no"),
            name=c.get("name"),
            email=c.get("email"),
            college=c.get("college"),
            branch=c.get("branch"),
            cgpa=float(c.get("cgpa", 0)),
            best_ai_project=c.get("best_ai_project"),
            research_work=c.get("research_work"),
            github_url=c.get("github"),
            resume_url=c.get("resume"),
        )
        db.add(candidate)
        db_candidates.append(candidate)

    db.commit()
    log.info("Candidates uploaded to DB", count=len(db_candidates))
    return {"message": f"{len(db_candidates)} candidates uploaded", "count": len(db_candidates)}
