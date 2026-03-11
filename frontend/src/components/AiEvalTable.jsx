import React, { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";

const STAGE_BADGE = {
  uploaded: "bg-gray-100 text-gray-600",
  evaluated: "bg-blue-100 text-blue-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  test_sent: "bg-amber-100 text-amber-700",
  test_completed: "bg-purple-100 text-purple-700",
  interview_scheduled: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-600",
};

function ScoreBar({ value }) {
  if (value == null) return <span className="text-gray-300 text-xs">—</span>;
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 70 ? "#22c55e" : pct >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-7 text-right">{Math.round(pct)}</span>
    </div>
  );
}

export default function AiEvalTable({ candidates }) {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = [...candidates].sort(
    (a, b) => (b.composite_score || 0) - (a.composite_score || 0)
  );

  if (!sorted.length) return null;

  return (
    <section className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: "linear-gradient(90deg, #eff6ff 0%, #eef2ff 100%)" }}>
        <div>
          <h2 className="text-base font-bold text-blue-900">AI Evaluation Results</h2>
          <p className="text-xs text-blue-500 mt-0.5">Click any row to see score breakdown</p>
        </div>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
          {sorted.length} candidates
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs tracking-wider uppercase">
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3 text-center">CGPA</th>
              <th className="px-4 py-3">Resume–JD</th>
              <th className="px-4 py-3">GitHub</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Research</th>
              <th className="px-4 py-3 text-blue-700 font-bold">AI Score</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <React.Fragment key={c.id}>
                <tr
                  className={`border-b transition-colors cursor-pointer ${
                    expandedId === c.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{c.college}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm font-medium text-gray-700">{c.cgpa?.toFixed(1) ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3"><ScoreBar value={c.resume_jd_score} /></td>
                  <td className="px-4 py-3"><ScoreBar value={c.github_score} /></td>
                  <td className="px-4 py-3"><ScoreBar value={c.project_score} /></td>
                  <td className="px-4 py-3"><ScoreBar value={c.research_score} /></td>
                  <td className="px-4 py-3">
                    {(() => {
                      const ai = aiOnlyScore(c);
                      return (
                        <span className={`font-bold font-mono text-lg ${
                          ai == null ? "text-gray-300" :
                          ai >= 70 ? "text-green-600" :
                          ai >= 45 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {ai != null ? ai.toFixed(1) : "—"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_BADGE[c.stage] || "bg-gray-100 text-gray-600"}`}>
                      {c.stage?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {c.score_explanation ? (expandedId === c.id ? "▲" : "▼") : ""}
                  </td>
                </tr>
                {expandedId === c.id && c.score_explanation && (
                  <tr key={`${c.id}-breakdown`}>
                    <td colSpan={11} className="px-6 py-4 bg-blue-50 border-b">
                      <ScoreBreakdown
                        breakdown={c.score_explanation}
                        title="Score Breakdown"
                        excludeKeys={["test_score"]}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-6 py-2 text-xs text-gray-400 border-t bg-gray-50">
        ↕ Click any row to expand score breakdown · Test scores added after Step 4
      </p>
    </section>
  );
}

function aiOnlyScore(c) {
  if (!c.score_explanation?.components) return null;
  const comp = c.score_explanation.components;
  const aiKeys = ["resume_jd_relevance", "github_quality", "project_quality", "research_quality", "cgpa"];
  // Raw weighted sum — matches what the breakdown rows visibly sum to
  return aiKeys.reduce((sum, k) => sum + (comp[k]?.weighted ?? 0), 0);
}

