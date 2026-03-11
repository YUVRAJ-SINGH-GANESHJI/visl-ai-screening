from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models.candidate import Candidate, PipelineStage
from app.services.resume_processor import download_resume, extract_text_from_pdf
from app.services.github_analyzer import analyze_github_profile, compute_github_score
from app.services.ai_evaluator import evaluate_candidate
from app.services.ranking import compute_composite_score
from app.logger import get_logger

router = APIRouter()
log = get_logger("evaluation_router")


@router.post("/run")
async def run_evaluation(
    job_description: str = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Run AI evaluation on all candidates (uploaded or already evaluated)."""
    candidates = db.query(Candidate).filter(
        Candidate.stage.in_([PipelineStage.UPLOADED, PipelineStage.EVALUATED])
    ).all()

    if not candidates:
        return {"message": "No candidates to evaluate"}

    log.info("Starting evaluation pipeline", candidate_count=len(candidates))
    results = []

    for candidate in candidates:
        try:
            # 1. Download & process resume
            resume_text = ""
            if candidate.resume_url:
                pdf_bytes = await download_resume(candidate.resume_url)
                if pdf_bytes:
                    resume_text = extract_text_from_pdf(pdf_bytes)
                    candidate.resume_text = resume_text

            # 2. Analyze GitHub (scored deterministically, not by LLM)
            github_analysis = {}
            github_score_result = {"score": 0, "reasoning": "No GitHub URL provided in application."}
            if candidate.github_url:
                github_analysis = await analyze_github_profile(candidate.github_url)
                github_score_result = compute_github_score(github_analysis)
                log.info(
                    "GitHub profile analyzed",
                    name=candidate.name,
                    username=github_analysis.get("username"),
                    repos=github_analysis.get("public_repos"),
                    ai_repos=github_analysis.get("ai_related_repos"),
                    stars=github_analysis.get("total_stars"),
                    forks=github_analysis.get("total_forks"),
                    followers=github_analysis.get("followers"),
                    languages=github_analysis.get("languages"),
                    computed_score=github_score_result["score"],
                )

            # 3. AI Evaluation (resume, project, research - GitHub excluded)
            candidate_data = {
                "name": candidate.name,
                "college": candidate.college,
                "branch": candidate.branch,
                "cgpa": candidate.cgpa,
                "best_ai_project": candidate.best_ai_project,
                "research_work": candidate.research_work,
                "resume_text": resume_text,
            }
            ai_scores = evaluate_candidate(candidate_data, job_description)

            # 4. Inject deterministic GitHub score
            ai_scores["github_quality"] = github_score_result

            # 4. Compute composite score
            breakdown = compute_composite_score(ai_scores, candidate.cgpa)

            # 5. Save scores
            candidate.resume_jd_score = ai_scores.get("resume_jd_relevance", {}).get("score")
            candidate.github_score = ai_scores.get("github_quality", {}).get("score")
            candidate.project_score = ai_scores.get("project_quality", {}).get("score")
            candidate.research_score = ai_scores.get("research_quality", {}).get("score")
            candidate.composite_score = breakdown["composite_score"]
            candidate.score_explanation = json.dumps(breakdown)
            candidate.stage = PipelineStage.EVALUATED

            # Commit after each candidate so progress is never lost
            db.commit()

            results.append({
                "name": candidate.name,
                "composite_score": breakdown["composite_score"],
            })

            log.info("Candidate evaluated", name=candidate.name, score=breakdown["composite_score"])

        except Exception as e:
            db.rollback()
            log.error("Failed to evaluate candidate", name=candidate.name, error=str(e))
            results.append({"name": candidate.name, "error": str(e)})

    # Sort by score
    results.sort(key=lambda x: x.get("composite_score", 0), reverse=True)
    return {"evaluated": len(results), "rankings": results}


@router.post("/finalize")
async def finalize_evaluation(db: Session = Depends(get_db)):
    """Recompute composite scores including test results and return final rankings."""
    candidates = (
        db.query(Candidate)
        .filter(Candidate.composite_score.isnot(None))
        .all()
    )

    for c in candidates:
        # Rebuild AI scores dict from stored individual scores
        ai_scores = {
            "resume_jd_relevance": {"score": c.resume_jd_score or 0},
            "github_quality": {"score": c.github_score or 0},
            "project_quality": {"score": c.project_score or 0},
            "research_quality": {"score": c.research_score or 0},
        }
        # Recompute composite WITH test scores included
        breakdown = compute_composite_score(
            ai_scores, c.cgpa,
            test_la=c.test_la_score,
            test_code=c.test_code_score,
        )
        c.composite_score = breakdown["composite_score"]

        # Merge AI reasoning from existing explanation if available
        old_explanation = json.loads(c.score_explanation) if c.score_explanation else {}
        if old_explanation.get("explanations"):
            breakdown["explanations"] = old_explanation["explanations"]
        c.score_explanation = json.dumps(breakdown)

    db.commit()

    # Re-query ordered by updated composite score
    candidates = (
        db.query(Candidate)
        .filter(Candidate.composite_score.isnot(None))
        .order_by(Candidate.composite_score.desc())
        .all()
    )

    rankings = [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "college": c.college,
            "cgpa": c.cgpa,
            "resume_jd_score": c.resume_jd_score,
            "github_score": c.github_score,
            "project_score": c.project_score,
            "research_score": c.research_score,
            "test_la_score": c.test_la_score,
            "test_code_score": c.test_code_score,
            "composite_score": c.composite_score,
            "score_explanation": json.loads(c.score_explanation) if c.score_explanation else None,
            "stage": c.stage,
        }
        for c in candidates
    ]

    log.info("Final evaluation finalized", count=len(rankings))
    return {"finalized": len(rankings), "rankings": rankings}
