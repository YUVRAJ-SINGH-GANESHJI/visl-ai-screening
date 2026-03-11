from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.candidate import Candidate, PipelineStage
from app.services.email_service import send_test_link, send_interview_invite
from app.logger import get_logger

router = APIRouter()
log = get_logger("email_router")


@router.post("/send-test")
async def send_test_emails(
    candidate_ids: List[int] = Body(...),
    test_url: str = Body(...),
    email_body: str = Body(""),
    db: Session = Depends(get_db),
):
    """Send test link emails to selected candidates."""
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()

    if not candidates:
        return {"error": "No candidates found with given IDs"}

    results = []
    for c in candidates:
        try:
            success = send_test_link(c.name, c.email, test_url, email_body)
            if success:
                c.stage = PipelineStage.TEST_SENT
                results.append({"name": c.name, "email": c.email, "status": "sent"})
            else:
                results.append({
                    "name": c.name, "email": c.email, "status": "failed",
                    "reason": "Email service returned False - check Render logs for details",
                })
        except Exception as e:
            log.error("Exception sending test email", candidate=c.name, error=str(e))
            results.append({"name": c.name, "email": c.email, "status": "failed", "reason": str(e)})

    db.commit()
    log.info("Test emails sent", total=len(results))
    return {"results": results}


@router.post("/send-interview")
async def send_interview_emails(
    candidate_ids: List[int] = Body(...),
    datetime_str: str = Body(...),
    meet_link: str = Body(...),
    db: Session = Depends(get_db),
):
    """Send interview invitation emails."""
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()

    results = []
    for c in candidates:
        success = send_interview_invite(c.name, c.email, datetime_str, meet_link)
        results.append({
            "name": c.name,
            "email": c.email,
            "status": "sent" if success else "failed",
        })

    log.info("Interview emails sent", total=len(results))
    return {"results": results}
