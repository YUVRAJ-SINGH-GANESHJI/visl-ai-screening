from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base


class PipelineStage:
    """Candidate pipeline stages - stored as plain strings in the DB."""
    UPLOADED = "uploaded"
    EVALUATED = "evaluated"
    SHORTLISTED = "shortlisted"
    TEST_SENT = "test_sent"
    TEST_COMPLETED = "test_completed"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    REJECTED = "rejected"


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    s_no = Column(Integer, nullable=True)

    # ── Basic Info ────────────────────────────────────────────────────────────
    name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    college = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    cgpa = Column(Float, nullable=True)

    # ── Application Content ───────────────────────────────────────────────────
    best_ai_project = Column(Text, nullable=True)
    research_work = Column(Text, nullable=True)
    github_url = Column(String, nullable=True)
    resume_url = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)   # extracted from PDF

    # ── AI Scores (0–100 each) ────────────────────────────────────────────────
    resume_jd_score = Column(Float, nullable=True)
    github_score = Column(Float, nullable=True)
    project_score = Column(Float, nullable=True)
    research_score = Column(Float, nullable=True)

    # ── Test Scores ───────────────────────────────────────────────────────────
    test_la_score = Column(Float, nullable=True)   # logical aptitude
    test_code_score = Column(Float, nullable=True)  # coding test

    # ── Final composite score & explainability ────────────────────────────────
    composite_score = Column(Float, nullable=True)
    score_explanation = Column(Text, nullable=True)  # JSON string with per-dimension breakdown

    # ── Pipeline tracking ─────────────────────────────────────────────────────
    stage = Column(String, default=PipelineStage.UPLOADED, nullable=False)

    # ── Interview details (set after scheduling) ──────────────────────────────
    interview_datetime = Column(String, nullable=True)
    meet_link = Column(String, nullable=True)
    calendar_event_id = Column(String, nullable=True)

    def __repr__(self) -> str:
        return f"<Candidate id={self.id} name={self.name!r} stage={self.stage!r} score={self.composite_score}>"
