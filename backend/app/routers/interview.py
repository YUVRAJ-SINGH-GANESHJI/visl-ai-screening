from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.candidate import Candidate, PipelineStage
from app.services.calendar_service import schedule_interview
from app.services.email_service import send_interview_invite
from app.logger import get_logger

router = APIRouter()
log = get_logger("interview_router")


class InterviewEntry(BaseModel):
    candidate_id: int
    interview_date: str  # ISO format: 2026-03-15T10:00:00
    duration_minutes: int = 30


@router.post("/schedule")
async def schedule_interviews(
    interviews: List[InterviewEntry] = Body(...),
    db: Session = Depends(get_db),
):
    """Schedule Google Calendar interviews with unique Meet links per candidate."""
    candidate_ids = [i.candidate_id for i in interviews]
    candidates = db.query(Candidate).filter(Candidate.id.in_(candidate_ids)).all()
    candidate_map = {c.id: c for c in candidates}

    if not candidates:
        return {"error": "No candidates found with given IDs"}

    results = []
    for entry in interviews:
        c = candidate_map.get(entry.candidate_id)
        if not c:
            results.append({"name": f"ID {entry.candidate_id}", "status": "failed", "error": "Candidate not found"})
            continue

        try:
            interview_dt = datetime.fromisoformat(entry.interview_date)
            event = schedule_interview(
                candidate_name=c.name,
                candidate_email=c.email,
                interview_datetime=interview_dt,
                duration_minutes=entry.duration_minutes,
            )

            meet_link = event.get("meet_link", "")

            # Send email with meet link
            send_interview_invite(
                c.name, c.email,
                interview_dt.strftime("%B %d, %Y at %I:%M %p"),
                meet_link,
            )

            c.stage = PipelineStage.INTERVIEW_SCHEDULED
            c.interview_datetime = entry.interview_date
            c.meet_link = meet_link
            c.calendar_event_id = event.get("event_id")

            results.append({
                "name": c.name,
                "email": c.email,
                "meet_link": meet_link,
                "event_id": event.get("event_id"),
                "interview_date": entry.interview_date,
                "status": "scheduled",
            })

            log.info("Interview scheduled", candidate=c.name, meet_link=meet_link)

        except Exception as e:
            log.error("Failed to schedule interview", candidate=c.name, error=str(e))
            results.append({"name": c.name, "email": c.email, "status": "failed", "error": str(e)})

    db.commit()
    return {"scheduled": len([r for r in results if r["status"] == "scheduled"]), "results": results}
