import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from app.logger import get_logger

log = get_logger("email_service")


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP with error handling."""
    log.info("Sending email", to=to_email, subject=subject)

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
        log.info("Email sent successfully", to=to_email)
        return True
    except smtplib.SMTPAuthenticationError:
        log.error("SMTP authentication failed — check credentials")
        return False
    except smtplib.SMTPRecipientsRefused:
        log.error("Recipient refused", to=to_email)
        return False
    except Exception as e:
        log.error("Failed to send email", to=to_email, error=str(e))
        return False


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
