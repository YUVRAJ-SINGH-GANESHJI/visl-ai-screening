import re


def is_valid_email(email: str) -> bool:
    """Basic email format validation."""
    if not email:
        return False
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def is_valid_github_url(url: str) -> bool:
    """Validate GitHub profile URL."""
    if not url:
        return False
    return bool(re.match(r"^https?://(www\.)?github\.com/[a-zA-Z0-9_-]+/?$", url))


def is_valid_gdrive_url(url: str) -> bool:
    """Validate Google Drive URL."""
    if not url:
        return False
    return "drive.google.com" in url or "docs.google.com" in url


def clamp_score(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Clamp a score to valid range."""
    return max(min_val, min(max_val, float(value)))
