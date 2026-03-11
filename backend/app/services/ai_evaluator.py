import json
from openai import OpenAI
from app.config import settings
from app.logger import get_logger

log = get_logger("ai_evaluator")

# The openai client works with any OpenAI-compatible LLM API.
# Change LLM_BASE_URL + LLM_API_KEY in .env to switch providers - no code change.
# Free options: Groq (https://console.groq.com) or Ollama (local)
client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)

EVALUATION_PROMPT = """You are an expert technical recruiter AI. Evaluate this candidate 
against the provided job description.

**Job Description:**
{job_description}

**Candidate Information:**
- Name: {name}
- College: {college}
- Branch: {branch}
- CGPA: {cgpa}
- Best AI Project: {best_ai_project}
- Research Work: {research_work}
- Resume Text: {resume_text}

**Scoring Instructions:**
Rate each dimension from 0 to 100 and provide a brief justification.

**IMPORTANT - Strict Scoring Rules (read carefully before scoring):**

1. `project_quality` - Score SOLELY from the `Best AI Project` field.
   - If that field is empty, "N/A", or missing → score MUST be 0, reasoning: "No AI project provided."
   - Do NOT infer projects from resume text or research work.

2. `research_quality` - Score SOLELY from the `Research Work` field.
   - If that field is empty, "N/A", or missing → score MUST be 0, reasoning: "No research work provided."
   - Do NOT infer research from project descriptions or resume text.

3. `resume_jd_relevance` - Based on resume text vs job description.
   - If `Resume Text` is empty or "N/A", note this explicitly and score conservatively based on branch, CGPA, and project descriptions only.

NOTE: GitHub quality is scored separately - do NOT include it in your response.

Return ONLY valid JSON in this exact format:
{{
    "resume_jd_relevance": {{
        "score": <0-100>,
        "reasoning": "<why this score>"
    }},
    "project_quality": {{
        "score": <0-100>,
        "reasoning": "<why this score>"
    }},
    "research_quality": {{
        "score": <0-100>,
        "reasoning": "<why this score>"
    }},
    "overall_fit": {{
        "score": <0-100>,
        "reasoning": "<overall assessment>"
    }}
}}
"""


def evaluate_candidate(candidate: dict, job_description: str) -> dict:
    """Use LLM to evaluate a candidate against a job description (excludes GitHub - scored separately)."""
    log.info("Evaluating candidate with AI", candidate_name=candidate.get("name"))

    has_project = bool(candidate.get("best_ai_project", "").strip() not in ("", "N/A", "None", "none"))
    has_research = bool(candidate.get("research_work", "").strip() not in ("", "N/A", "None", "none"))
    has_resume = bool(candidate.get("resume_text", "").strip() not in ("", "N/A", "None", "none"))

    prompt = EVALUATION_PROMPT.format(
        job_description=job_description,
        name=candidate.get("name", ""),
        college=candidate.get("college", ""),
        branch=candidate.get("branch", ""),
        cgpa=candidate.get("cgpa", ""),
        best_ai_project=candidate.get("best_ai_project", "N/A"),
        research_work=candidate.get("research_work", "N/A"),
        resume_text=candidate.get("resume_text", "N/A")[:3000],
    )

    try:
        response = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)

        # Hard overrides: force scores to 0 when source data was absent
        if not has_project:
            result["project_quality"] = {
                "score": 0,
                "reasoning": "No AI project provided.",
            }
        if not has_research:
            result["research_quality"] = {
                "score": 0,
                "reasoning": "No research work provided.",
            }
        if not has_resume and "resume_jd_relevance" in result:
            original = result["resume_jd_relevance"]
            result["resume_jd_relevance"] = {
                "score": original.get("score", 0),
                "reasoning": "[No resume available - scored from branch/CGPA/projects only] " + original.get("reasoning", ""),
            }

        log.info(
            "AI evaluation complete",
            candidate_name=candidate.get("name"),
            overall_score=result.get("overall_fit", {}).get("score"),
        )
        return result

    except json.JSONDecodeError as e:
        log.error("Failed to parse LLM response", error=str(e))
        return {"error": "Failed to parse AI response"}
    except Exception as e:
        log.error("AI evaluation failed", candidate_name=candidate.get("name"), error=str(e))
        return {"error": str(e)}
