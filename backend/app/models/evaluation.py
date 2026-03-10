from pydantic import BaseModel
from typing import Optional


class ScoreComponent(BaseModel):
    score: float = 0
    reasoning: str = ""


class AIEvaluationResult(BaseModel):
    resume_jd_relevance: ScoreComponent = ScoreComponent()
    project_quality: ScoreComponent = ScoreComponent()
    research_quality: ScoreComponent = ScoreComponent()
    github_quality: ScoreComponent = ScoreComponent()
    overall_fit: ScoreComponent = ScoreComponent()


class CompositeBreakdown(BaseModel):
    composite_score: float
    components: dict
    explanations: dict


class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    college: Optional[str] = None
    branch: Optional[str] = None
    cgpa: Optional[float] = None
    composite_score: Optional[float] = None
    stage: str

    class Config:
        from_attributes = True
