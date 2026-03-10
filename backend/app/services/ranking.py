from app.logger import get_logger

log = get_logger("ranking")

WEIGHTS = {
    "resume_jd_relevance": 0.30,
    "github_quality": 0.20,
    "project_quality": 0.15,
    "research_quality": 0.10,
    "cgpa": 0.10,
    "test_score": 0.15,
}


def compute_composite_score(
    ai_scores: dict,
    cgpa: float,
    test_la: float = None,
    test_code: float = None,
) -> dict:
    """Compute weighted composite score with explainable breakdown."""

    # Normalize CGPA to 0-100
    cgpa_normalized = (cgpa / 10.0) * 100 if cgpa else 0

    # Weighted test score (coding 60%, LA 40%)
    test_score = 0
    if test_la is not None and test_code is not None:
        test_score = (test_code * 0.6) + (test_la * 0.4)

    components = {
        "resume_jd_relevance": ai_scores.get("resume_jd_relevance", {}).get("score", 0),
        "github_quality": ai_scores.get("github_quality", {}).get("score", 0),
        "project_quality": ai_scores.get("project_quality", {}).get("score", 0),
        "research_quality": ai_scores.get("research_quality", {}).get("score", 0),
        "cgpa": cgpa_normalized,
        "test_score": test_score,
    }

    composite = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)

    breakdown = {
        "composite_score": round(composite, 2),
        "components": {
            k: {"score": round(v, 2), "weight": WEIGHTS[k], "weighted": round(v * WEIGHTS[k], 2)}
            for k, v in components.items()
        },
        "explanations": {
            k: ai_scores.get(k, {}).get("reasoning", "")
            for k in ["resume_jd_relevance", "github_quality", "project_quality", "research_quality"]
        },
    }

    log.info("Composite score computed", score=composite)
    return breakdown
