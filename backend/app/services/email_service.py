import smtplib
import base64
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.logger import get_logger

log = get_logger("email_service")


def _send_via_gmail_api(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send email via Gmail API using the same OAuth credentials as Google Calendar.
    Works on Render (HTTPS, not SMTP) and sends to any recipient.
    Requires GOOGLE_CREDENTIALS_JSON + GOOGLE_TOKEN_B64 env vars to be set.
    """
    try:
        from app.services.calendar_service import get_calendar_service
        from googleapiclient.discovery import build
        # Reuse the same OAuth credentials that Calendar uses
        from app.services.calendar_service import _bootstrap_credentials_from_env, TOKEN_FILE, CREDENTIALS_FILE, SCOPES
        import pickle
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request

        _bootstrap_credentials_from_env()

        creds = None
        if os.path.exists(TOKEN_FILE):
            with open(TOKEN_FILE, "rb") as f:
                creds = pickle.load(f)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                raise RuntimeError("Gmail OAuth token missing or expired — re-run local OAuth")

        service = build("gmail", "v1", credentials=creds)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
        log.info("Email sent via Gmail API", to=to_email)
        return True
    except Exception as e:
        log.error("Gmail API send failed", to=to_email, error=str(e))
        return False


def _send_via_smtp(to_email: str, subject: str, html_body: str) -> bool:
    """Send email via Gmail SMTP (local dev — blocked on Render free tier)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        log.info("Email sent via SMTP", to=to_email)
        return True
    except smtplib.SMTPAuthenticationError:
        log.error("SMTP authentication failed — check credentials")
        return False
    except smtplib.SMTPRecipientsRefused:
        log.error("Recipient refused", to=to_email)
        return False
    except Exception as e:
        log.error("Failed to send email via SMTP", to=to_email, error=str(e))
        return False


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send email — picks method automatically:
      • Gmail API  → when GOOGLE_CREDENTIALS_JSON env var is set (Render hosted)
      • Gmail SMTP → locally (when running on your PC)
    """
    log.info("Sending email", to=to_email, subject=subject)
    if os.environ.get("GOOGLE_CREDENTIALS_JSON"):
        return _send_via_gmail_api(to_email, subject, html_body)
    return _send_via_smtp(to_email, subject, html_body)


def send_test_link(candidate_name: str, to_email: str, test_url: str, custom_body: str = "") -> bool:
    """Send test link email to shortlisted candidate."""
    body_section = f"<p>{custom_body}</p>" if custom_body else (
        "<p>You have been shortlisted for the next round.</p>"
        "<p>Please complete the assessment using the link below:</p>"
    )
    html = f"""
    <h2>Congratulations {candidate_name}!</h2>
    {body_section}
    <p><a href="{test_url}">{test_url}</a></p>
    <br>
    <p>Best regards,<br>Visl AI Labs Recruitment Team</p>
    """
    return send_email(to_email, "Visl AI Labs — Assessment Invitation", html)


def send_interview_invite(
    candidate_name: str, to_email: str, datetime_str: str, meet_link: str
) -> bool:
    """Send interview invitation with Google Meet link."""
    html = f"""
    <h2>Interview Invitation — Visl AI Labs</h2>
    <p>Dear {candidate_name},</p>
    <p>We are pleased to invite you for an interview.</p>
    <p><strong>Date & Time:</strong> {datetime_str}</p>
    <p><strong>Google Meet Link:</strong> <a href="{meet_link}">{meet_link}</a></p>
    <br>
    <p>Best regards,<br>Visl AI Labs Recruitment Team</p>
    """
    return send_email(to_email, "Visl AI Labs — Interview Invitation", html)
