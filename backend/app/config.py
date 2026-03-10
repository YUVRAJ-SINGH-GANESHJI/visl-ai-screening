from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Visl AI Screening"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./screening.db"

    # ── LLM API (free public API — Groq by default) ──────────────────────────
    # Groq gives a free tier with fast Llama models, no credit card needed.
    # Sign up at https://console.groq.com → API Keys → Create key
    # Swap LLM_BASE_URL + LLM_MODEL to use any OpenAI-compatible provider:
    #   • Groq   → https://api.groq.com/openai/v1  | llama-3.3-70b-versatile
    #   • Ollama → http://localhost:11434/v1        | llama3  (fully local/free)
    #   • Together AI → https://api.together.xyz/v1 | (free tier available)
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # ── GitHub ────────────────────────────────────────────────────────────────
    # Optional but recommended to avoid 60 req/hr rate limit on unauthenticated calls.
    # Generate at https://github.com/settings/tokens (no scopes needed for public repos)
    GITHUB_TOKEN: str = ""

    # ── Email (Gmail SMTP) ────────────────────────────────────────────────────
    # Use a Gmail App Password, NOT your normal Gmail password.
    # Generate at: Google Account → Security → 2-Step Verification → App Passwords
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # ── Google Calendar ───────────────────────────────────────────────────────
    # Download credentials.json from Google Cloud Console → APIs & Services → Credentials
    GOOGLE_CREDENTIALS_FILE: str = "credentials.json"

    # ── Shortlisting threshold ─────────────────────────────────────────────────
    # Candidates scoring above this are auto-shortlisted after evaluation
    SHORTLIST_THRESHOLD: float = 60.0
    TEST_SCORE_THRESHOLD: float = 55.0

    class Config:
        env_file = ".env"


settings = Settings()
