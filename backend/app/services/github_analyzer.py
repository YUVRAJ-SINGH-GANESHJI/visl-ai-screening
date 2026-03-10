import httpx
from app.config import settings
from app.logger import get_logger

log = get_logger("github_analyzer")

async def analyze_github_profile(github_url: str) -> dict:
    """Analyze a GitHub profile — repos, languages, contributions."""
    username = github_url.rstrip("/").split("/")[-1]
    if not username:
        log.warning("Invalid GitHub URL", url=github_url)
        return {"error": "Invalid GitHub URL", "score": 0}

    headers = {}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Fetch user info
            user_resp = await client.get(
                f"https://api.github.com/users/{username}", headers=headers
            )
            user_resp.raise_for_status()
            user = user_resp.json()

            # Fetch repos (up to 100)
            repos_resp = await client.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"per_page": 100, "sort": "updated"},
            )
            repos_resp.raise_for_status()
            repos = repos_resp.json()

        # Analyze repos
        total_stars = sum(r.get("stargazers_count", 0) for r in repos)
        total_forks = sum(r.get("forks_count", 0) for r in repos)
        languages = set()
        ai_related = 0
        for r in repos:
            if r.get("language"):
                languages.add(r["language"])
            desc = (r.get("description") or "").lower()
            topics = [t.lower() for t in r.get("topics", [])]
            ai_keywords = {"ml", "ai", "deep-learning", "machine-learning", "nlp",
                           "neural", "transformer", "pytorch", "tensorflow", "llm"}
            if any(kw in desc or kw in " ".join(topics) for kw in ai_keywords):
                ai_related += 1

        analysis = {
            "username": username,
            "public_repos": user.get("public_repos", 0),
            "followers": user.get("followers", 0),
            "total_stars": total_stars,
            "total_forks": total_forks,
            "languages": list(languages),
            "ai_related_repos": ai_related,
            "profile_created": user.get("created_at"),
            "bio": user.get("bio"),
        }

        log.info("GitHub analysis complete", username=username, repos=len(repos))
        return analysis

    except httpx.HTTPStatusError as e:
        log.error("GitHub API error", username=username, status=e.response.status_code)
        return {"error": f"GitHub API error: {e.response.status_code}"}
    except Exception as e:
        log.error("GitHub analysis failed", username=username, error=str(e))
        return {"error": str(e)}


def compute_github_score(analysis: dict) -> dict:
    """Compute a deterministic GitHub quality score from raw analysis data."""
    if not analysis or "error" in analysis:
        error_msg = analysis.get("error", "No data") if analysis else "No GitHub URL"
        return {"score": 0, "reasoning": f"GitHub profile unavailable — {error_msg}"}

    username = analysis.get("username", "unknown")
    repos = analysis.get("public_repos", 0)
    stars = analysis.get("total_stars", 0)
    forks = analysis.get("total_forks", 0)
    ai_repos = analysis.get("ai_related_repos", 0)
    languages = analysis.get("languages", [])
    followers = analysis.get("followers", 0)
    bio = analysis.get("bio") or "N/A"
    created = analysis.get("profile_created", "N/A")

    # ── Scoring rubric (0-100) ──
    # Repos (0-30)
    if repos == 0:      repos_pts = 0
    elif repos <= 3:    repos_pts = 10
    elif repos <= 8:    repos_pts = 20
    elif repos <= 15:   repos_pts = 25
    else:               repos_pts = 30

    # AI/ML related repos (0-30)
    if ai_repos == 0:   ai_pts = 0
    elif ai_repos == 1: ai_pts = 10
    elif ai_repos <= 3: ai_pts = 20
    else:               ai_pts = 30

    # Language diversity (0-15)
    lang_count = len(languages)
    if lang_count == 0:   lang_pts = 0
    elif lang_count == 1: lang_pts = 5
    elif lang_count <= 3: lang_pts = 10
    else:                 lang_pts = 15

    # Stars + Forks engagement (0-15)
    engagement = stars + forks
    if engagement == 0:    eng_pts = 0
    elif engagement <= 5:  eng_pts = 5
    elif engagement <= 20: eng_pts = 10
    else:                  eng_pts = 15

    # Followers (0-10)
    if followers == 0:    fol_pts = 0
    elif followers <= 5:  fol_pts = 5
    else:                 fol_pts = 10

    total = repos_pts + ai_pts + lang_pts + eng_pts + fol_pts

    reasoning = (
        f"GitHub @{username} — "
        f"Repos: {repos} ({repos_pts}/30) | "
        f"AI/ML repos: {ai_repos} ({ai_pts}/30) | "
        f"Languages: {', '.join(languages) if languages else 'None'} ({lang_pts}/15) | "
        f"Stars: {stars}, Forks: {forks} ({eng_pts}/15) | "
        f"Followers: {followers} ({fol_pts}/10) | "
        f"Bio: {bio} | "
        f"Profile created: {created}"
    )

    log.info(
        "GitHub score computed",
        username=username,
        repos=repos,
        ai_repos=ai_repos,
        stars=stars,
        forks=forks,
        followers=followers,
        languages=languages,
        score=total,
    )
    return {"score": total, "reasoning": reasoning}
