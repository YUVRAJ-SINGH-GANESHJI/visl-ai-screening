from contextlib import asynccontextmanager
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.logger import get_logger
from app.routers import upload, candidates, evaluation, email, tests, interview

log = get_logger("main")


# ── Startup / Shutdown ────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info(
        "Starting application",
        app=settings.APP_NAME,
        llm_provider=settings.LLM_BASE_URL,
        llm_model=settings.LLM_MODEL,
        db=settings.DATABASE_URL,
    )
    # Auto-create all tables (SQLite creates the file if missing)
    Base.metadata.create_all(bind=engine)
    log.info("Database tables ready")
    yield
    log.info("Application shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered candidate screening platform. "
        "Uses a free public LLM API (Groq / Ollama) to evaluate candidates "
        "against a job description and automate the hiring pipeline."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ── CORS ──────────────────────────────────────────────────────────────────────
# In production, replace "*" with your Vercel frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Custom exception classes ──────────────────────────────────────────────────
class CSVValidationError(Exception):
    """Raised when an uploaded CSV fails schema or row-level validation."""

    def __init__(self, message: str, row: int = None, column: str = None):
        self.message = message
        self.row = row
        self.column = column


class LLMError(Exception):
    """Raised when the LLM API call fails or returns an unparsable response."""

    def __init__(self, message: str, provider: str = None):
        self.message = message
        self.provider = provider


# ── Exception handlers ────────────────────────────────────────────────────────
@app.exception_handler(CSVValidationError)
async def csv_validation_handler(request: Request, exc: CSVValidationError):
    log.warning(
        "CSV validation error",
        endpoint=str(request.url),
        message=exc.message,
        row=exc.row,
        column=exc.column,
    )
    return JSONResponse(
        status_code=422,
        content={
            "error": "CSV Validation Error",
            "message": exc.message,
            "row": exc.row,
            "column": exc.column,
        },
    )


@app.exception_handler(LLMError)
async def llm_error_handler(request: Request, exc: LLMError):
    log.error(
        "LLM API error",
        endpoint=str(request.url),
        message=exc.message,
        provider=exc.provider,
    )
    return JSONResponse(
        status_code=502,
        content={
            "error": "LLM API Error",
            "message": exc.message,
            "provider": exc.provider,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(
        "Unhandled exception",
        endpoint=str(request.url),
        method=request.method,
        error=str(exc),
        traceback=traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            # Show details in DEBUG mode only - never leak stack traces in production
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred.",
        },
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(upload.router,      prefix="/api/upload",     tags=["Upload"])
app.include_router(candidates.router,  prefix="/api/candidates", tags=["Candidates"])
app.include_router(evaluation.router,  prefix="/api/evaluate",   tags=["Evaluation"])
app.include_router(email.router,       prefix="/api/email",      tags=["Email"])
app.include_router(tests.router,       prefix="/api/tests",      tags=["Tests"])
app.include_router(interview.router,   prefix="/api/interview",  tags=["Interview"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Quick liveness probe used by Render / Railway."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "llm_model": settings.LLM_MODEL,
    }
