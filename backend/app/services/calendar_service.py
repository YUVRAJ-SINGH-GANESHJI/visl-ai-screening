from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
import pickle
import uuid
from app.logger import get_logger

log = get_logger("calendar_service")

SCOPES = ["https://www.googleapis.com/auth/calendar"]
TOKEN_FILE = "token.pickle"


def get_calendar_service():
    """Authenticate and return Google Calendar service."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=8090)
        with open(TOKEN_FILE, "wb") as token:
            pickle.dump(creds, token)

    return build("calendar", "v3", credentials=creds)


def schedule_interview(
    candidate_name: str,
    candidate_email: str,
    interview_datetime: datetime,
    duration_minutes: int = 30,
) -> dict:
    """Create a Google Calendar event with Google Meet link."""
    log.info("Scheduling interview", candidate=candidate_name, datetime=str(interview_datetime))

    try:
        service = get_calendar_service()

        event = {
            "summary": f"Interview — {candidate_name} | Visl AI Labs",
            "description": f"Technical interview with {candidate_name}",
            "start": {
                "dateTime": interview_datetime.isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "end": {
                "dateTime": (interview_datetime + timedelta(minutes=duration_minutes)).isoformat(),
                "timeZone": "Asia/Kolkata",
            },
            "attendees": [{"email": candidate_email}],
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 60},
                    {"method": "popup", "minutes": 10},
                ],
            },
        }

        created_event = service.events().insert(
            calendarId="primary",
            body=event,
            conferenceDataVersion=1,
            sendUpdates="all",
        ).execute()

        meet_link = created_event.get("hangoutLink", "")
        log.info("Interview scheduled", event_id=created_event["id"], meet_link=meet_link)

        return {
            "event_id": created_event["id"],
            "meet_link": meet_link,
            "html_link": created_event.get("htmlLink"),
            "start": created_event["start"],
        }

    except Exception as e:
        log.error("Failed to schedule interview", candidate=candidate_name, error=str(e))
        raise
