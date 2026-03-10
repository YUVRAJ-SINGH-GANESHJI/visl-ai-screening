from fastapi import Request
from fastapi.responses import JSONResponse
from app.logger import get_logger
import traceback

log = get_logger("error_handlers")


class AppError(Exception):
    """Base application error."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code


class CSVValidationError(AppError):
    """Raised when CSV data fails validation."""
    def __init__(self, message: str, row: int = None, column: str = None):
        super().__init__(message, status_code=422)
        self.row = row
        self.column = column


class LLMError(AppError):
    """Raised when LLM API call fails."""
    def __init__(self, message: str):
        super().__init__(message, status_code=502)


class ExternalAPIError(AppError):
    """Raised when an external API (GitHub, Google) fails."""
    def __init__(self, service: str, message: str):
        super().__init__(f"{service}: {message}", status_code=502)
        self.service = service


async def app_error_handler(request: Request, exc: AppError):
    """Handle known application errors."""
    log.warning(
        f"Application error: {exc.message}",
        endpoint=str(request.url),
        status_code=exc.status_code,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message},
    )


async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    log.error(
        f"Unhandled exception: {exc}",
        endpoint=str(request.url),
        method=request.method,
        traceback=traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred"},
    )
