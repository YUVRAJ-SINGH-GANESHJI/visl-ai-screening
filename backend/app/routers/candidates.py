from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models.candidate import Candidate, PipelineStage
from app.logger import get_logger

router = APIRouter()
log = get_logger("candidates_router")


@router.get("/")
async def list_candidates(stage: str = None, db: Session = Depends(get_db)):
    """List all candidates, optionally filtered by pipeline stage."""
    query = db.query(Candidate)
    if stage:
        query = query.filter(Candidate.stage == stage)

    candidates = query.order_by(Candidate.composite_score.desc().nullslast()).all()

    return [
        {
            "id": c.id,
            "s_no": c.s_no,
            "name": c.name,
            "email": c.email,
            "college": c.college,
            "branch": c.branch,
            "cgpa": c.cgpa,
            "github_url": c.github_url,
            "resume_url": c.resume_url,
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


@router.get("/{candidate_id}")
async def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Get a single candidate by ID."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {
        "id": candidate.id,
        "s_no": candidate.s_no,
        "name": candidate.name,
        "email": candidate.email,
        "college": candidate.college,
        "branch": candidate.branch,
        "cgpa": candidate.cgpa,
        "best_ai_project": candidate.best_ai_project,
        "research_work": candidate.research_work,
        "github_url": candidate.github_url,
        "resume_url": candidate.resume_url,
        "resume_text": candidate.resume_text,
        "resume_jd_score": candidate.resume_jd_score,
        "github_score": candidate.github_score,
        "project_score": candidate.project_score,
        "research_score": candidate.research_score,
        "test_la_score": candidate.test_la_score,
        "test_code_score": candidate.test_code_score,
        "composite_score": candidate.composite_score,
        "score_explanation": json.loads(candidate.score_explanation) if candidate.score_explanation else None,
        "stage": candidate.stage,
    }


@router.post("/shortlist")
async def shortlist_candidates(
    threshold: float = 60.0,
    db: Session = Depends(get_db),
):
    """Shortlist candidates above score threshold."""
    candidates = db.query(Candidate).filter(
        Candidate.stage == PipelineStage.EVALUATED,
        Candidate.composite_score >= threshold,
    ).all()

    for c in candidates:
        c.stage = PipelineStage.SHORTLISTED

    db.commit()
    log.info("Candidates shortlisted", count=len(candidates), threshold=threshold)
    return {
        "shortlisted": len(candidates),
        "threshold": threshold,
        "candidates": [{"id": c.id, "name": c.name, "score": c.composite_score} for c in candidates],
    }
