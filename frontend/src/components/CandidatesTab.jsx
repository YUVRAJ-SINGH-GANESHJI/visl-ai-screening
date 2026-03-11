import { useState, useEffect } from "react";
import { getCandidates } from "../services/api";

const STAGE_BADGE = {
  uploaded: "bg-gray-100 text-gray-600",
  evaluated: "bg-blue-100 text-blue-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  test_sent: "bg-amber-100 text-amber-700",
  test_completed: "bg-purple-100 text-purple-700",
  interview_scheduled: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-600",
};

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function ResumeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function ScorePill({ value, extraClass = "" }) {
  if (value == null) return <span className="text-gray-300 text-xs">—</span>;
  const cls =
    value >= 70
      ? "text-green-600"
      : value >= 45
      ? "text-amber-500"
      : "text-red-500";
  return (
    <span className={`font-mono font-semibold text-sm ${cls} ${extraClass}`}>
      {value.toFixed(1)}
    </span>
  );
}

function aiOnlyScore(c) {
  if (!c.score_explanation?.components) return null;
  const comp = c.score_explanation.components;
  const aiKeys = ["resume_jd_relevance", "github_quality", "project_quality", "research_quality", "cgpa"];
  return aiKeys.reduce((sum, k) => sum + (comp[k]?.weighted ?? 0), 0);
}

export default function CandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getCandidates()
      .then((res) => setCandidates(res.data))
      .catch((err) => setError(err.message || "Failed to load candidates"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)" }}
    >
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Candidates</h1>
            <p className="text-sm text-gray-500 mt-0.5">All candidates from uploaded CSV — read-only record</p>
          </div>
          <div className="flex items-center gap-3">
            {candidates.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-full">
                {candidates.length} total
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              <RefreshIcon />
              Refresh
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading candidates...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm">{error}</div>
          ) : candidates.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No candidates found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500 text-xs tracking-wider uppercase">
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3 min-w-[160px]">Candidate</th>
                    <th className="px-4 py-3 min-w-[140px]">College</th>
                    <th className="px-4 py-3 min-w-[110px]">Branch</th>
                    <th className="px-4 py-3 text-center w-16">CGPA</th>
                    <th className="px-4 py-3 text-center w-20">Links</th>
                    <th className="px-4 py-3 text-center w-24">AI Score</th>
                    <th className="px-4 py-3 text-center w-24">Test Score</th>
                    <th className="px-4 py-3 text-center w-28">Final Score</th>
                    <th className="px-4 py-3 min-w-[120px]">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => {
                    const testScore =
                      c.test_code_score != null || c.test_la_score != null
                        ? (c.test_code_score ?? 0) * 0.6 + (c.test_la_score ?? 0) * 0.4
                        : null;
                    const ai = aiOnlyScore(c);

                    return (
                      <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors align-top">
                        {/* # */}
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">{i + 1}</td>

                        {/* Name + Email */}
                        <td className="px-4 py-3">
                          <div
                            className="font-semibold text-gray-800 text-sm truncate max-w-[160px]"
                            title={c.name}
                          >
                            {c.name}
                          </div>
                          <div
                            className="text-xs text-gray-400 truncate max-w-[160px]"
                            title={c.email}
                          >
                            {c.email}
                          </div>
                        </td>

                        {/* College — scrollable if long */}
                        <td className="px-4 py-3">
                          <div
                            className="text-xs text-gray-500 w-[150px] max-h-[52px] overflow-y-auto leading-relaxed pr-1"
                            title={c.college}
                          >
                            {c.college || "—"}
                          </div>
                        </td>

                        {/* Branch */}
                        <td className="px-4 py-3">
                          <div
                            className="text-xs text-gray-500 max-w-[120px] truncate"
                            title={c.branch}
                          >
                            {c.branch || "—"}
                          </div>
                        </td>

                        {/* CGPA */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-sm font-medium text-gray-700">
                            {c.cgpa?.toFixed(1) ?? "—"}
                          </span>
                        </td>

                        {/* Links */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {c.github_url ? (
                              <a
                                href={c.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="GitHub Profile"
                                className="p-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition"
                              >
                                <GitHubIcon />
                              </a>
                            ) : (
                              <span className="w-7 h-7 inline-block" />
                            )}
                            {c.resume_url ? (
                              <a
                                href={c.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Resume / CV"
                                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                              >
                                <ResumeIcon />
                              </a>
                            ) : (
                              <span className="w-7 h-7 inline-block" />
                            )}
                          </div>
                        </td>

                        {/* AI Score */}
                        <td className="px-4 py-3 text-center">
                          <ScorePill value={ai} />
                        </td>

                        {/* Test Score */}
                        <td className="px-4 py-3 text-center">
                          <ScorePill value={testScore} />
                        </td>

                        {/* Final Score */}
                        <td className="px-4 py-3 text-center">
                          <ScorePill value={c.composite_score} extraClass="text-base" />
                        </td>

                        {/* Stage */}
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                              STAGE_BADGE[c.stage] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {c.stage?.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
