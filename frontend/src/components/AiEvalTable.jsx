import React, { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";

const STAGE_BADGE = {
  uploaded: "bg-gray-100 text-gray-700",
  evaluated: "bg-blue-100 text-blue-700",
  shortlisted: "bg-green-100 text-green-700",
  test_sent: "bg-yellow-100 text-yellow-700",
  test_completed: "bg-purple-100 text-purple-700",
  interview_scheduled: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AiEvalTable({ candidates }) {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = [...candidates].sort(
    (a, b) => (b.composite_score || 0) - (a.composite_score || 0)
  );

  if (!sorted.length) return null;

  return (
    <section className="mb-6 bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b bg-blue-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-blue-900">
          📊 Table 1 — AI Evaluation Results
        </h2>
        <span className="text-sm text-blue-600 font-medium">{sorted.length} candidates</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">CGPA</th>
              <th className="px-4 py-3">Resume–JD</th>
              <th className="px-4 py-3">GitHub</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Research</th>
              <th className="px-4 py-3 font-bold text-blue-700">AI Score</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <React.Fragment key={c.id}>
                <tr
                  className={`border-b transition ${expandedId === c.id ? "bg-blue-50" : "hover:bg-gray-50"} cursor-pointer`}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[180px] truncate">{c.college}</td>
                  <td className="px-4 py-3">{c.cgpa?.toFixed(1) ?? "—"}</td>
                  <td className="px-4 py-3">{c.resume_jd_score?.toFixed(0) ?? "—"}</td>
                  <td className="px-4 py-3">{c.github_score?.toFixed(0) ?? "—"}</td>
                  <td className="px-4 py-3">{c.project_score?.toFixed(0) ?? "—"}</td>
                  <td className="px-4 py-3">{c.research_score?.toFixed(0) ?? "—"}</td>
                  <td className="px-4 py-3 font-bold font-mono text-lg text-blue-700">
                    {c.composite_score?.toFixed(1) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STAGE_BADGE[c.stage] || "bg-gray-100 text-gray-700"}`}>
                      {c.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {c.score_explanation ? (expandedId === c.id ? "▲ hide" : "▼ breakdown") : ""}
                  </td>
                </tr>
                {expandedId === c.id && c.score_explanation && (
                  <tr key={`${c.id}-breakdown`}>
                    <td colSpan={12} className="px-6 py-4 bg-blue-50 border-b">
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
      <p className="px-6 py-2 text-xs text-gray-400 border-t">
        Click any row to expand Score Breakdown (excludes test scores — added after Step 3)
      </p>
    </section>
  );
}
