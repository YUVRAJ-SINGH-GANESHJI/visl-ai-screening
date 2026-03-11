# Visl AI Screening Platform

**Author:** Yuvraj Singh  
**Assignment:** Founding AI Engineer - Visl AI Labs  
**Stack:** FastAPI · React/Vite · Neon PostgreSQL · Groq LLM · Google Calendar + Gmail API  
**Deployed:** Backend on Render · Frontend on Vercel

---

## What This Is

An end-to-end AI-powered recruitment automation platform. A recruiter uploads a CSV of candidates, provides a job description, and the system automatically evaluates every candidate (resume, GitHub, AI projects, research, CGPA), ranks them, sends assessment links, processes test results, and schedules interviews with Google Meet links - all without manual intervention.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Full Workflow](#2-full-workflow)
3. [Step 1 - CSV Upload & Parsing](#3-step-1--csv-upload--parsing)
4. [Step 2 - Resume Download & Extraction](#4-step-2--resume-download--extraction)
5. [Step 3 - GitHub Profile Analysis](#5-step-3--github-profile-analysis)
6. [Step 4 - AI / LLM Evaluation](#6-step-4--ai--llm-evaluation)
7. [Step 5 - Scoring Formula & Ranking](#7-step-5--scoring-formula--ranking)
8. [Step 6 - Sending Test Links](#8-step-6--sending-test-links)
9. [Step 7 - Test Result Upload](#9-step-7--test-result-upload)
10. [Step 8 - Final Re-ranking](#10-step-8--final-re-ranking)
11. [Step 9 - Interview Scheduling](#11-step-9--interview-scheduling)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Evaluation Strength](#13-evaluation-strength)
14. [Scalability Roadmap](#14-scalability-roadmap)

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND  (React + Vite - Vercel)             │
│                                                                  │
│  ┌─────────────┐   ┌──────────────────────────────────────────┐  │
│  │  Dark Side  │   │  Dashboard (5-step pipeline)             │  │
│  │  bar        │   │  Step 1: CSV Upload                      │  │
│  │  ─────────  │   │  Step 2: Job Description + AI Evaluate   │  │
│  │  Dashboard  │   │  Step 3: Send Test Links                 │  │
│  │  Candidates │   │  Step 4: Upload Test Results             │  │
│  │  Schedules  │   │  Step 5: Final Ranking + Schedule        │  │
│  └─────────────┘   └──────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────┘
                               │  REST API (Axios)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND  (FastAPI - Render)                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  CSV Parser  │  │   Resume     │  │  GitHub Analyzer     │    │
│  │  & Validator │  │   Downloader │  │  (live GitHub API)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘    │
│         │                 │                      │               │
│         └─────────────────┼──────────────────────┘               │
│                           ▼                                      │
│            ┌──────────────────────────────┐                      │
│            │   LLM Evaluation Engine      │                      │
│            │   (Groq - llama-3.3-70b)     │                      │
│            │   · Resume ↔ JD relevance    │                      │
│            │   · AI Project quality       │                      │
│            │   · Research assessment      │                      │
│            │   GitHub scored separately - │                      │
│            │   NOT passed to LLM          │                      │
│            └──────────────┬───────────────┘                      │
│                           ▼                                      │
│            ┌──────────────────────────────┐                      │
│            │   Composite Scorer & Ranker  │                      │
│            │  (deterministic, explainable)│                      │
│            └──────────────┬───────────────┘                      │
│                           │                                      │
│         ┌─────────────────┼──────────────────┐                   │
│         ▼                 ▼                  ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐          │
│  │  Gmail API  │  │ Test Result │  │ Google Calendar  │          │
│  │  (OAuth2)   │  │ Processor   │  │ + Meet Scheduler │          │
│  └─────────────┘  └─────────────┘  └──────────────────┘          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │           Neon PostgreSQL  (serverless, cloud)             │  │
│  │  pool_pre_ping · pool_recycle · persistent candidate state │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Technology choices:**

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend API | FastAPI | Async support, automatic OpenAPI docs |
| Frontend | React + Vite + Tailwind | Fast dev, component-based UI |
| Database | Neon PostgreSQL | Serverless PostgreSQL, free tier, survives Render sleep |
| LLM | Groq (llama-3.3-70b) | Free API, fast inference, OpenAI-compatible client |
| Email | Gmail API (OAuth2) | Works on Render (SMTP is blocked on free tier) |
| Calendar | Google Calendar API | Native Meet link generation per event |
| Hosting | Render (BE) + Vercel (FE) | Free tier, auto-deploy from GitHub |

---

## 2. Full Workflow

```
Recruiter uploads candidates.csv
         │
         ▼
 CSV parsed & validated → candidates stored in Neon DB
         │
         ▼
 Recruiter enters Job Description → clicks "Run AI Evaluation"
         │
         ├── For each candidate (parallel):
         │       ├── Download resume PDF from Google Drive link
         │       ├── Extract text from PDF (PyPDF2)
         │       ├── Fetch GitHub profile via GitHub API
         │       ├── Compute GitHub score (deterministic)
         │       └── Call LLM → score resume, project, research
         │
         ▼
 Composite scores computed → ranked table displayed with explanations
         │
         ▼
 Recruiter selects candidates → clicks "Send Test Links"
         │       (Gmail API sends personalized HTML email with test URL)
         │
         ▼
 Recruiter uploads test_results.csv (coding + logical aptitude scores)
         │
         ▼
 Recruiter clicks "Final Evaluation"
         │       (test scores weighted into composite → re-ranked)
         │
         ▼
 Final ranked table → Recruiter selects top candidates
         │
         ▼
 Recruiter sets date/time/duration → clicks "Schedule Interview"
         │       (Google Calendar event created with unique Meet link)
         │       (Interview invite email auto-sent via Gmail API)
         │
         ▼
 Schedules tab shows all upcoming interviews with Meet links
```

---

## 3. Step 1 - CSV Upload & Parsing

The recruiter uploads a CSV file through the UI. Each new upload **clears all existing candidates** from the database first - this guarantees a clean slate and prevents duplicate processing if the same file is re-uploaded.

**Expected candidate CSV columns:**

| Column | Required | Description |
|--------|----------|-------------|
| `name` | Yes | Candidate full name |
| `email` | Yes | Contact email (used for test + interview invites) |
| `college` | Yes | Institution name |
| `branch` | Yes | Engineering/science branch |
| `cgpa` | Yes | CGPA on a 10-point scale |
| `best_ai_project` | Optional | Description of candidate's best AI/ML project |
| `research_work` | Optional | Published papers, research experience description |
| `github_profile` | Optional | Full GitHub profile URL |
| `resume_link` | Optional | Google Drive link to PDF resume |

**Validation applied:**
- All required columns must be present (case-insensitive matching)
- Missing optional fields default to empty strings - they are never scored as non-zero
- Emails are deduplicated: if the same email appears twice, only the first row is kept
- CGPA values outside 0–10 are flagged with a warning in logs

**Test result CSV columns:**

| Column | Description |
|--------|-------------|
| `email` | Links test result back to candidate |
| `test_la` | Logical aptitude score (0–100) |
| `test_code` | Coding test score (0–100) |

Test results are matched to candidates by email. Candidates not found in the DB are skipped with a warning.

---

## 4. Step 2 - Resume Download & Extraction

For each candidate that has a `resume_link`, the backend attempts to download the PDF.

- Google Drive sharing URLs in any format (`/file/d/ID/view`, `/open?id=ID`, etc.) are parsed to extract the file ID and reconstructed as a direct download URL
- The PDF is downloaded via an async HTTP client with a 30-second timeout
- Text is extracted from all pages using PyPDF2
- If the download fails or the link is not a valid Drive URL, `resume_text` is set to `"N/A"` - the LLM is explicitly told to score conservatively from branch/CGPA only and cannot hallucinate resume content
- Extracted text is stored in the database so re-evaluation does not require re-downloading

---

## 5. Step 3 - GitHub Profile Analysis

GitHub is analyzed **entirely outside the LLM** using live GitHub API data. This makes the GitHub score fully transparent, reproducible, and not subject to LLM hallucination.

The username is extracted from the profile URL. Up to 100 repositories are fetched. The following signals are collected:

- Total public repository count
- Number of AI/ML-related repositories (detected by keywords in repo descriptions and topics: `ml`, `ai`, `deep-learning`, `machine-learning`, `nlp`, `neural`, `transformer`, `pytorch`, `tensorflow`, `llm`)
- Number of programming languages used across all repos
- Total stars + forks across all repos (engagement signal)
- Follower count

**GitHub scoring rubric (0–100):**

| Signal | Max Points | Tiers |
|--------|-----------|-------|
| Public repositories | 30 | 0 repos → 0 · 1–3 → 10 · 4–8 → 20 · 9–15 → 25 · 16+ → 30 |
| AI/ML repositories | 30 | 0 → 0 · 1 → 10 · 2–3 → 20 · 4+ → 30 |
| Language diversity | 15 | 0 → 0 · 1 → 5 · 2–3 → 10 · 4+ → 15 |
| Stars + Forks | 15 | 0 → 0 · 1–5 → 5 · 6–20 → 10 · 21+ → 15 |
| Followers | 10 | 0 → 0 · 1–5 → 5 · 6+ → 10 |

A human-readable reasoning string is generated from the actual profile numbers (e.g., *"15 public repos (25/30), 3 AI/ML repos (20/30), 4 languages (15/15), 8 stars+forks (10/15), 12 followers (10/10) → 80/100"*) and stored alongside the score for full explainability.

If the GitHub URL is missing or the API returns an error, the score is 0 with a logged explanation - no silent failures.

---

## 6. Step 4 - AI / LLM Evaluation

The LLM evaluates **three dimensions only**: resume–JD relevance, project quality, and research quality. GitHub is deliberately excluded from the LLM prompt to prevent hallucination and keep the most objective signal deterministic.

**Model:** `llama-3.3-70b-versatile` via Groq API (OpenAI-compatible client - switching to any other OpenAI-compatible endpoint requires only a `.env` change, no code change).

**What the LLM receives:**
- Full job description text
- Candidate name, college, branch, CGPA
- `best_ai_project` field text
- `research_work` field text
- Extracted resume text (or `"N/A"` if unavailable)

**Strict scoring rules enforced in the prompt:**
- If `best_ai_project` is empty or N/A → `project_quality` **must** be 0
- If `research_work` is empty or N/A → `research_quality` **must** be 0
- If resume text is unavailable → `resume_jd_relevance` must note this explicitly and score conservatively from branch/CGPA only

**Hard override in code (belt-and-suspenders):** After the LLM returns scores, the backend checks: if the source field was empty, the score is programmatically set to 0 regardless of what the LLM returned. The LLM cannot hallucinate a positive score for absent data.

**LLM output format** (JSON, validated before storing):
```json
{
  "resume_jd_relevance": { "score": 80, "reasoning": "...why..." },
  "project_quality":     { "score": 95, "reasoning": "...why..." },
  "research_quality":    { "score": 90, "reasoning": "...why..." },
  "overall_fit":         { "score": 85, "reasoning": "...overall..." }
}
```

Each reasoning string is displayed in the UI alongside the score so the recruiter can read exactly why a candidate received a particular score.

---

## 7. Step 5 - Scoring Formula & Ranking

All five AI-phase components and the optional test score are combined with fixed weights into a single composite score.

### Weights

| Component | Weight | Source |
|-----------|--------|--------|
| Resume–JD Relevance | **30%** | LLM |
| GitHub Profile Quality | **20%** | Deterministic (GitHub API) |
| AI Project Quality | **15%** | LLM |
| Research Work Quality | **10%** | LLM |
| CGPA (normalized to /100) | **10%** | Formula: `(cgpa / 10) × 100` |
| Test Score (coding + LA) | **15%** | Added at final evaluation only |
| **Total** | **100%** | - |

> During the initial AI evaluation (before test results), the test weight is excluded and scores are shown normalized to the 85% AI-only window. After test results are uploaded and final evaluation is run, the test score is folded in and the full composite is recomputed.

### Composite Score Formula

$$\text{AI Score (raw)} = \sum_{k \in \text{AI components}} \text{score}_k \times \text{weight}_k$$

$$\text{AI Score (displayed, /100)} = \frac{\text{AI Score raw}}{0.85}$$

$$\text{Test Score (normalized)} = \text{test\_code} \times 0.6 + \text{test\_la} \times 0.4$$

$$\text{Final Score} = \text{AI Score raw} + \text{Test Score (normalized)} \times 0.15$$

### Worked Example

A candidate with these raw scores:

| Component | Raw Score | Weight | Weighted |
|-----------|-----------|--------|---------|
| Resume–JD Relevance | 80 | 0.30 | 24.0 |
| GitHub Quality | 65 | 0.20 | 13.0 |
| Project Quality | 95 | 0.15 | 14.25 |
| Research Quality | 90 | 0.10 | 9.0 |
| CGPA (6.6 → 66) | 66 | 0.10 | 6.6 |
| **AI Score (raw)** | - | - | **66.85** |

- AI Score displayed: `66.85 / 0.85 = 78.6 → shown as 79`
- Test Score (code=80, LA=60): `80×0.6 + 60×0.4 = 48 + 24 = 72`
- Final Score: `66.85 + 72×0.15 = 66.85 + 10.8 = 77.65 → shown as 77.7`

The three columns shown in the final ranking table are:
- **AI Score** - normalized AI-only performance (/100)
- **Test Score** - combined coding + logical aptitude (/100)
- **Final Score** - true composite including test weight

---

## 8. Step 6 - Sending Test Links

After the AI evaluation, the recruiter selects which candidates to advance and enters a test URL (e.g., a Google Form, HackerRank link, or any URL).

For each selected candidate, an HTML email is sent via the **Gmail API** (OAuth2):

- Subject: *Visl AI Labs - Assessment Invitation*
- Body includes the candidate's name, a clickable test link button, and an optional custom message typed by the recruiter
- Emails are sent one at a time with individual per-candidate personalization
- The Gmail API is used (not SMTP) because Render's free tier blocks outbound SMTP connections; the Gmail API works over HTTPS

The candidate's pipeline stage is updated to `test_sent` in the database after the email is dispatched.

---

## 9. Step 7 - Test Result Upload

The recruiter uploads a CSV file containing test scores after candidates complete the assessment.

- Matched to existing candidates by email address
- Each matched candidate's `test_la` and `test_code` fields are updated in Neon DB
- Unmatched emails are logged as warnings and skipped - they do not cause the upload to fail
- A summary of matched vs. skipped is returned to the UI

---

## 10. Step 8 - Final Re-ranking

After test results are uploaded, the recruiter clicks "Run Final Evaluation." The backend:

1. Fetches all candidates with test scores
2. Calls `compute_composite_score()` with all five AI component scores **plus** the test scores
3. Recomputes the composite score: `Final = AI_raw + test_normalized × 0.15`
4. Updates `composite_score` in the DB for each candidate
5. Returns candidates sorted by final score descending

The final ranking table displays three separate columns with distinct values:
- AI Score (AI-only normalized)
- Test Score (coding + LA combined)
- Final Score (full composite)

Medal badges (1st / 2nd / 3rd) and color-coded progress bars (green ≥ 70, yellow ≥ 50, red < 50) highlight top performers at a glance.

---

## 11. Step 9 - Interview Scheduling

For each candidate the recruiter wants to invite for an interview:

1. Recruiter sets an interview date/time and optionally customizes duration (default 30 minutes)
2. The backend calls the **Google Calendar API** (OAuth2) to create a calendar event
3. Google automatically generates a unique **Google Meet link** for the event
4. The event is created on the recruiter's Google Calendar with the candidate's name and email as context in the event description
5. Immediately after calendar creation, an interview invitation email is sent to the candidate via Gmail API containing:
   - Interview date and time
   - Google Meet link as a clickable button
   - Duration
6. The `interview_scheduled`, `meet_link`, `interview_datetime`, and `calendar_event_id` fields are stored in the database

**OAuth bootstrap on Render:** Google credentials (`credentials.json`) and the OAuth token (`token.pickle`) are serialized to Base64 and stored as environment variables on Render. On startup, the backend writes them back to disk from env vars so Google API calls work without any local file system dependency.

The **Schedules tab** in the UI polls the backend and displays all scheduled interviews in a table with name, email, date/time, duration, and a direct Meet link.

---

## 12. Error Handling Strategy

**Structured logging with Loguru:** Every service logs structured JSON to rotating daily log files (`logs/app_YYYY-MM-DD.log`) and a separate error-only log (`logs/errors_YYYY-MM-DD.log`). Each log record includes a `module` field so errors can be traced to the exact service.

**Per-service failure isolation:** The evaluation pipeline processes candidates one by one. If any single candidate's resume download, GitHub fetch, or LLM call fails, that candidate is skipped with a warning - it does not abort evaluation for the remaining candidates. The UI receives a partial success response with a count of how many were processed.

**LLM JSON parsing:** If the LLM returns malformed JSON, the raw response is logged and a zero-score fallback is applied for that candidate rather than crashing the request.

**GitHub API errors:** HTTP 404 (user not found), 403 (rate limit), and network timeouts all return a structured `{"error": "reason", "score": 0}` object. The candidate's GitHub score is set to 0 with the error reason as the reasoning string - displayed transparently in the UI.

**Database connections (Neon):** `pool_pre_ping=True` validates connections before use (handles Neon's idle connection drops). `pool_recycle=300` prevents stale connections from accumulating on Render's long-running instances.

**Global exception handler in FastAPI:** Any unhandled exception returns a structured JSON error response with a request trace ID - never a raw Python traceback to the frontend.

**CSV validation errors:** Missing required columns or invalid data types return a 422 response with the specific column/row that failed, not a generic 500.

---

## 13. Evaluation Strength

This implementation goes significantly beyond a basic scoring system:

**Separation of concerns in scoring:**  
GitHub is scored deterministically from live API data - not by the LLM. This eliminates hallucination for the most objectively measurable signal. The LLM only evaluates signals that genuinely require language understanding (resume–JD semantic match, project depth, research quality).

**Hard overrides prevent LLM hallucination:**  
If a candidate has no AI project or research work, the system programmatically enforces a score of 0 for those dimensions - both in the prompt instructions and in post-processing code. The LLM cannot invent contributions the candidate did not list.

**Fully explainable scores:**  
Every dimension (all six components) has a human-readable reasoning string stored alongside its numeric score. The recruiter can expand any candidate's score breakdown and read exactly why each number was assigned. This satisfies explainable AI requirements and builds recruiter trust.

**Two-stage evaluation:**  
Initial AI ranking happens before test scores exist. Final ranking folds in test performance with the appropriate weight. This mirrors real hiring pipelines and prevents test scores from dominating candidates who haven't taken the test yet.

**Normalized display vs. raw computation:**  
Internal computation uses raw weighted sums (maintaining mathematical correctness). Display normalizes AI-only scores to /100 so recruiters see intuitive percentages without the underlying weight arithmetic affecting interpretation.

**Live GitHub data:**  
GitHub profiles are fetched at evaluation time from the live GitHub API - not from cached or self-reported data. Stars, forks, and AI/ML repo detection reflect the candidate's actual public work at the moment of evaluation.

**Provider-agnostic LLM client:**  
The OpenAI Python client is pointed at Groq's base URL. Switching to OpenAI, Anthropic (via proxy), Ollama (local), or any other OpenAI-compatible provider requires only `.env` changes - no code modifications.

---

## 14. Scalability Roadmap

The current deployment runs on free tiers (Render, Vercel, Neon, Groq free, Gmail API). Here is how the system scales to handle larger candidate pools and heavier production load:

### Immediate scaling (hundreds of candidates)

| Bottleneck | Current | Scaled solution |
|------------|---------|-----------------|
| Sequential candidate evaluation | One-by-one in a loop | Run `asyncio.gather()` over all candidates - already async, just needs concurrency limit (semaphore) |
| Groq free tier rate limits | 30 req/min | Add exponential backoff + retry; or upgrade to paid Groq / switch to OpenAI batch API |
| Render free tier sleeps after 15 min idle | Cold start delays | Upgrade to Render Starter ($7/mo) - always on |

### Medium scale (thousands of candidates, multiple recruiters)

- **Database:** Neon free tier → Neon Pro (or migrate to AWS RDS / Supabase). Add indexes on `email`, `stage`, `composite_score` columns for fast filtering.
- **LLM evaluation:** Move to a **background task queue** (Celery + Redis or FastAPI `BackgroundTasks`). Evaluation runs async - frontend polls for completion status instead of waiting on a single HTTP request.
- **Resume downloads:** Store PDFs in object storage (S3 / Cloudflare R2) after first download. Re-evaluation reuses stored text - no re-download.
- **Authentication:** Add JWT-based recruiter login so multiple recruiters can use the platform without sharing a single account.

### Large scale (enterprise, tens of thousands of candidates)

- **Containerize with Docker Compose:** Backend, Celery worker, Redis, and Postgres all run as separate services. Already has a `Dockerfile` - add `docker-compose.yml` for orchestration.
- **Deploy on Kubernetes (EKS / GKE):** Horizontal pod autoscaling on the FastAPI and Celery worker deployments based on queue depth.
- **LLM at scale:** Self-host an open-source model (LLaMA 3, Mistral) on GPU instances (AWS `g4dn.xlarge` ~$0.53/hr spot) instead of paying per-token API costs. Ollama already supported - just change `LLM_BASE_URL`.
- **Caching:** Cache GitHub analysis results per username with a TTL (Redis). Avoids hitting GitHub API repeatedly for the same candidate across evaluation runs.
- **Observability:** Replace Loguru file logs with a centralized logging stack (Loki + Grafana or Datadog). Add Prometheus metrics endpoints for API latency and evaluation throughput.
- **CDN for frontend:** Vercel already serves globally distributed static assets. No change needed.
- **Email at scale:** Replace Gmail API (daily send limits) with SendGrid or AWS SES (~$0.10 per 1,000 emails) for bulk test invitations.

### Architecture change summary (free → production)

```
Free tier now:                    Production path:
─────────────────                 ────────────────────────────────
Render (1 instance)          →    K8s deployment + HPA
Neon free (0.5 GB)           →    Neon Pro / RDS PostgreSQL
Groq free (rate limited)     →    Paid Groq / self-hosted LLaMA
Gmail API (500/day limit)    →    AWS SES / SendGrid
Vercel hobby                 →    Vercel Pro (or CloudFront + S3)
No queue                     →    Celery + Redis
No auth                      →    JWT + role-based access control
```

The core application architecture - FastAPI + async services + PostgreSQL + React - requires no structural changes to scale. The bottlenecks (LLM rate limits, sequential processing, single instance) are all addressed by infrastructure upgrades and adding a task queue, not by rewriting the application logic.

---

*Built by Yuvraj Singh for the Visl AI Labs Founding AI Engineer assignment.*
