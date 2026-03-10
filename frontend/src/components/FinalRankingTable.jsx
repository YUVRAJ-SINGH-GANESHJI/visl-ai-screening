import { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";
import { scheduleInterviews } from "../services/api";

export default function FinalRankingTable({ rankings }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Per-candidate date/time and duration
  const [interviewData, setInterviewData] = useState({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleResult, setScheduleResult] = useState(null);

  if (!rankings || !rankings.length) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === rankings.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rankings.map((r) => r.id)));
  };

  const updateInterviewField = (id, field, value) => {
    setInterviewData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSchedule = async () => {
    // Build array of interview entries for selected candidates
    const entries = Array.from(selectedIds)
      .map((id) => {
        const data = interviewData[id];
        if (!data?.dateTime) return null;
        return {
          candidate_id: id,
          interview_date: data.dateTime,
          duration_minutes: data.duration || 30,
        };
      })
      .filter(Boolean);

    if (!entries.length) return;

    setScheduleLoading(true);
    setScheduleResult(null);
    try {
      const res = await scheduleInterviews(entries);
      setScheduleResult(res.data);
    } catch (err) {
      setScheduleResult({ error: err.response?.data?.error || err.message });
    }
    setScheduleLoading(false);
  };

  const scoreBadge = (score) => {
    if (score == null) return "text-gray-400";
    if (score >= 75) return "text-green-600 font-bold";
    if (score >= 50) return "text-yellow-600 font-bold";
    return "text-red-500 font-bold";
  };

  // Count selected candidates that have a date/time set
  const readyCount = Array.from(selectedIds).filter(
    (id) => interviewData[id]?.dateTime
  ).length;

  return (
    <section className="mb-6 bg-white rounded-lg shadow overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b bg-indigo-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-indigo-900">
          🏆 Final Ranking — All Candidates
        </h2>
        <span className="text-sm text-indigo-600 font-medium">{rankings.length} candidates</span>
      </div>

      {/* Ranking Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <th className="px-4 py-3">
                <button
                  onClick={toggleAll}
                  className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                >
                  {selectedIds.size === rankings.length ? "Deselect All" : "Select All"}
                </button>
              </th>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">AI Score</th>
              <th className="px-4 py-3 text-center">Test Score</th>
              <th className="px-4 py-3 text-center font-bold text-indigo-700">Final Score</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((c, i) => {
              const aiScore = aiOnlyScore(c);
              const testScore = combinedTest(c);
              const isSelected = selectedIds.has(c.id);
              return (
                <>
                  <tr
                    key={c.id}
                    className={`border-b transition cursor-pointer ${
                      expandedId === c.id
                        ? "bg-indigo-50"
                        : isSelected
                        ? "bg-indigo-50/50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(c.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          i === 0
                            ? "bg-yellow-400 text-white"
                            : i === 1
                            ? "bg-gray-300 text-gray-800"
                            : i === 2
                            ? "bg-orange-300 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                    <td className={`px-4 py-3 text-center font-mono ${scoreBadge(aiScore)}`}>
                      {aiScore != null ? aiScore.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-purple-600 font-semibold">
                      {c.test_code_score != null || c.test_la_score != null
                        ? testScore.toFixed(1)
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-mono text-xl ${scoreBadge(c.composite_score)}`}>
                        {c.composite_score?.toFixed(1) ?? "—"}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">/ 100</span>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="datetime-local"
                        value={interviewData[c.id]?.dateTime || ""}
                        onChange={(e) => updateInterviewField(c.id, "dateTime", e.target.value)}
                        disabled={!isSelected}
                        className={`border rounded-lg px-2 py-1.5 text-xs w-44 outline-none ${
                          isSelected
                            ? "border-indigo-300 focus:ring-2 focus:ring-indigo-400 bg-white"
                            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      />
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        value={interviewData[c.id]?.duration || 30}
                        onChange={(e) => updateInterviewField(c.id, "duration", Number(e.target.value))}
                        min="15"
                        max="120"
                        disabled={!isSelected}
                        className={`border rounded-lg px-2 py-1.5 text-xs w-16 outline-none ${
                          isSelected
                            ? "border-indigo-300 focus:ring-2 focus:ring-indigo-400 bg-white"
                            : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={c.stage} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {c.score_explanation
                        ? expandedId === c.id
                          ? "▲ hide"
                          : "▼ details"
                        : ""}
                    </td>
                  </tr>
                  {expandedId === c.id && c.score_explanation && (
                    <tr key={`${c.id}-final-breakdown`}>
                      <td colSpan={11} className="px-6 py-4 bg-indigo-50 border-b">
                        <ScoreBreakdown
                          breakdown={c.score_explanation}
                          title="Final Score Breakdown"
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Schedule Button */}
      <div className="px-6 py-5 border-t bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-semibold text-sm shadow"
            onClick={handleSchedule}
            disabled={scheduleLoading || readyCount === 0}
          >
            {scheduleLoading
              ? "⏳ Scheduling..."
              : `📅 Schedule Interviews for ${readyCount} Candidate${readyCount !== 1 ? "s" : ""}`}
          </button>
          {selectedIds.size > 0 && readyCount < selectedIds.size && (
            <span className="text-xs text-amber-600">
              {selectedIds.size - readyCount} selected candidate{selectedIds.size - readyCount !== 1 ? "s" : ""} still need a date/time
            </span>
          )}
          {selectedIds.size === 0 && (
            <span className="text-xs text-gray-400">
              Select candidates and set date/time to schedule interviews
            </span>
          )}
        </div>

        {scheduleResult && (
          <div className="mt-4 rounded-lg border p-4 text-sm">
            {scheduleResult.error ? (
              <p className="text-red-600">Error: {scheduleResult.error}</p>
            ) : (
              <>
                <p className="font-semibold text-green-700 mb-2">
                  ✓ Scheduled {scheduleResult.scheduled} interview(s)
                </p>
                <div className="space-y-1">
                  {scheduleResult.results?.map((r, idx) => (
                    <p
                      key={idx}
                      className={r.status === "scheduled" ? "text-green-600" : "text-red-500"}
                    >
                      {r.status === "scheduled" ? "✅" : "❌"} {r.name}
                      {r.interview_date && (
                        <span className="text-gray-500 ml-2 text-xs">
                          {new Date(r.interview_date).toLocaleString()}
                        </span>
                      )}
                      {r.meet_link && (
                        <a
                          href={r.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 text-blue-600 underline text-xs"
                        >
                          Meet Link
                        </a>
                      )}
                      {r.error && (
                        <span className="text-red-400 ml-2 text-xs">— {r.error}</span>
                      )}
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function aiOnlyScore(c) {
  if (!c.score_explanation?.components) return null;
  const comp = c.score_explanation.components;
  const aiKeys = ["resume_jd_relevance", "github_quality", "project_quality", "research_quality", "cgpa"];
  const weightedSum = aiKeys.reduce((sum, k) => sum + (comp[k]?.weighted ?? 0), 0);
  const totalAiWeight = aiKeys.reduce((sum, k) => sum + (comp[k]?.weight ?? 0), 0);
  if (totalAiWeight === 0) return null;
  return (weightedSum / totalAiWeight) * 100;
}

function combinedTest(c) {
  const la = c.test_la_score ?? 0;
  const code = c.test_code_score ?? 0;
  return code * 0.6 + la * 0.4;
}

function StageBadge({ stage }) {
  const colors = {
    uploaded: "bg-gray-100 text-gray-700",
    evaluated: "bg-blue-100 text-blue-700",
    shortlisted: "bg-green-100 text-green-700",
    test_sent: "bg-yellow-100 text-yellow-700",
    test_completed: "bg-purple-100 text-purple-700",
    interview_scheduled: "bg-indigo-100 text-indigo-700",
    rejected: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[stage] || "bg-gray-100 text-gray-700"}`}>
      {stage}
    </span>
  );
}
