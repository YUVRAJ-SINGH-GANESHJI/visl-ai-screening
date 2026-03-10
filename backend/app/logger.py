import sys
import os
from loguru import logger

# Remove loguru's default handler so we control all output
logger.remove()

# ── Console handler — human-readable coloured output ────────────────────────
logger.add(
    sys.stderr,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level> | "
        "{extra}"
    ),
    level="DEBUG",
    colorize=True,
)

# ── File handler — JSON structured logs, rotated daily / at 10 MB ───────────
os.makedirs("logs", exist_ok=True)

logger.add(
    "logs/app_{time:YYYY-MM-DD}.log",
    rotation="10 MB",
    retention="30 days",
    compression="zip",
    level="INFO",
    serialize=True,   # writes each record as a JSON object — easy to grep/parse
    enqueue=True,     # non-blocking writes
)

# ── Error-only log file — kept for 60 days ───────────────────────────────────
logger.add(
    "logs/errors_{time:YYYY-MM-DD}.log",
    rotation="10 MB",
    retention="60 days",
    level="ERROR",
    serialize=True,
    enqueue=True,
)


def get_logger(module: str):
    """
    Return a logger with a bound 'module' context key so every log line
    emitted by that module carries its name in the structured output.

    Usage:
        from app.logger import get_logger
        log = get_logger("csv_parser")
        log.info("Parsed file", rows=42)
    """
    return logger.bind(module=module)
