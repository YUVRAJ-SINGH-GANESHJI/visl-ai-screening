import { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";

export default function CandidateList({ candidates }) {
  const [selectedId, setSelectedId] = useState(null);

  const sorted = [...candidates].sort(
    (a, b) => (b.composite_score || 0) - (a.composite_score || 0)
  );

  const stageBadge = (stage) => {
    const colors = {
      uploaded: "bg-gray-100 text-gray-700",
      evaluated: "bg-blue-100 text-blue-700",
      shortlisted: "bg-green-100 text-green-700",
      test_sent: "bg-yellow-100 text-yellow-700",
      test_completed: "bg-purple-100 text-purple-700",
      interview_scheduled: "bg-indigo-100 text-indigo-700",
      rejected: "bg-red-100 text-red-700",
    };
    return colors[stage] || "bg-gray-100 text-gray-700";
  };

  if (candidates.length === 0) {
    return (
      <section className="mb-6 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📊 Candidate Rankings</h2>
        <p className="text-gray-500 text-sm">No candidates yet. Upload a CSV to get started.</p>
      </section>
    );
  }

  return (
    <section className="mb-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">📊 Candidate Rankings ({candidates.length})</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">College</th>
              <th className="p-3">CGPA</th>
              <th className="p-3">Resume-JD</th>
              <th className="p-3">GitHub</th>
              <th className="p-3">Project</th>
              <th className="p-3">Test</th>
              <th className="p-3 font-bold">Score</th>
              <th className="p-3">Stage</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <>
                <tr
                  key={c.id}
                  className="border-b hover:bg-blue-50 cursor-pointer transition"
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                >
                  <td className="p-3 font-mono text-gray-500">{i + 1}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-gray-600">{c.college}</td>
                  <td className="p-3">{c.cgpa?.toFixed(1) || "—"}</td>
                  <td className="p-3">{c.resume_jd_score?.toFixed(0) || "—"}</td>
                  <td className="p-3">{c.github_score?.toFixed(0) || "—"}</td>
                  <td className="p-3">{c.project_score?.toFixed(0) || "—"}</td>
                  <td className="p-3">
                    {c.test_code_score != null
                      ? `${c.test_code_score.toFixed(0)} / ${c.test_la_score?.toFixed(0) || "—"}`
                      : "—"}
                  </td>
                  <td className="p-3 font-bold font-mono text-lg">
                    {c.composite_score?.toFixed(1) || "—"}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageBadge(c.stage)}`}>
                      {c.stage}
                    </span>
                  </td>
                </tr>
                {selectedId === c.id && c.score_explanation && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan="10" className="p-4 bg-gray-50">
                      <ScoreBreakdown breakdown={c.score_explanation} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
