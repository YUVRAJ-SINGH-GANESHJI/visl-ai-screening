import httpx
import re
from PyPDF2 import PdfReader
from io import BytesIO
from app.logger import get_logger

log = get_logger("resume_processor")

def extract_gdrive_file_id(url: str) -> str | None:
    """Extract Google Drive file ID from various URL formats."""
    patterns = [
        r"/d/([a-zA-Z0-9_-]+)",
        r"id=([a-zA-Z0-9_-]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def download_resume(url: str) -> bytes | None:
    """Download a resume PDF from Google Drive."""
    file_id = extract_gdrive_file_id(url)
    if not file_id:
        log.warning("Could not extract file ID from URL", url=url)
        return None

    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(download_url)
            response.raise_for_status()
            log.info("Resume downloaded", file_id=file_id, size=len(response.content))
            return response.content
    except httpx.HTTPError as e:
        log.error("Failed to download resume", file_id=file_id, error=str(e))
        return None


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        log.info("PDF text extracted", pages=len(reader.pages), chars=len(text))
        return text.strip()
    except Exception as e:
        log.error("Failed to extract PDF text", error=str(e))
        return ""
