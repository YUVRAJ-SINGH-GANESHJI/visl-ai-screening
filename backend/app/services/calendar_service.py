from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
import pathlib
import pickle
import uuid
import base64
import tempfile
from app.logger import get_logger

log = get_logger("calendar_service")

# Absolute path to the backend/ folder — works regardless of where uvicorn is launched from
_BACKEND_DIR = pathlib.Path(__file__).resolve().parents[2]

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.send",
]
TOKEN_FILE = str(_BACKEND_DIR / "token.pickle")
CREDENTIALS_FILE = str(_BACKEND_DIR / "credentials.json")


def _bootstrap_credentials_from_env():
    """
    On Render (or any server without local files), recreate credentials.json
    and token.pickle from environment variables before OAuth runs.

    Set these on Render → Environment:
      GOOGLE_CREDENTIALS_JSON  — full contents of credentials.json (paste as-is)
      GOOGLE_TOKEN_B64         — base64-encoded token.pickle (see HOSTING.md §5)
    """
    # Always write credentials.json from env var if the env var is set
    # (env var takes precedence over any existing local file)
    creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON", "")
    if creds_json:
        with open(CREDENTIALS_FILE, "w") as f:
            f.write(creds_json)
        log.info("credentials.json written from GOOGLE_CREDENTIALS_JSON env var")
    elif not os.path.exists(CREDENTIALS_FILE):
        log.warning("credentials.json missing and GOOGLE_CREDENTIALS_JSON env var not set")

    # Always write token.pickle from env var if the env var is set
    # (env var takes precedence — ensures updated tokens are always applied)
    token_b64 = os.environ.get("GOOGLE_TOKEN_B64", "")
    if token_b64:
        with open(TOKEN_FILE, "wb") as f:
            f.write(base64.b64decode(token_b64))
        log.info("token.pickle written from GOOGLE_TOKEN_B64 env var")
    elif not os.path.exists(TOKEN_FILE):
        log.warning("token.pickle missing and GOOGLE_TOKEN_B64 env var not set — OAuth login will be required")


def get_calendar_service():
    """Authenticate and return Google Calendar service."""
    # Recreate credential files from env vars when running on Render
    _bootstrap_credentials_from_env()

    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "rb") as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(TOKEN_FILE, "wb") as token:
                pickle.dump(creds, token)
        else:
            # On a server there is no browser — never attempt interactive OAuth.
            # Fix: regenerate token.pickle locally with both scopes, re-encode as
            # base64, and update GOOGLE_TOKEN_B64 on Render.
            raise RuntimeError(
                "Google OAuth token missing or invalid. "
                "Re-run local OAuth (delete token.pickle, start backend, log in), "
                "then update GOOGLE_TOKEN_B64 on Render with the new base64 value."
            )

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
