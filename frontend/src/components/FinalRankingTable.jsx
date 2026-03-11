import { useState } from "react";
import ScoreBreakdown from "./ScoreBreakdown";
import { scheduleInterviews } from "../services/api";

const RANK_LABELS = ["1st", "2nd", "3rd"];

const STAGE_COLOR = {
  uploaded: "bg-gray-100 text-gray-600",
  evaluated: "bg-blue-100 text-blue-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  test_sent: "bg-amber-100 text-amber-700",
  test_completed: "bg-purple-100 text-purple-700",
  interview_scheduled: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-600",
};

function ScoreBar({ value, big }) {
  if (value == null) return <span className="text-gray-300 text-xs">-</span>;
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? "#22c55e" : pct >= 45 ? "#f59e0b" : "#ef4444";
  if (big) {
    return (
      <div className="flex flex-col gap-1 min-w-[90px]">
        <div className="flex items-center justify-between">
          <span className="font-bold font-mono text-xl" style={{ color }}>{pct.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-7 text-right">{Math.round(pct)}</span>
    </div>
  );
}

export default function FinalRankingTable({ rankings }) {
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
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

  const readyCount = Array.from(selectedIds).filter(
    (id) => interviewData[id]?.dateTime
  ).length;

  return (
    <section className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: "linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%)" }}>
        <div>
          <h2 className="text-base font-bold text-indigo-900">Final Rankings</h2>
          <p className="text-xs text-indigo-400 mt-0.5">Select candidates + set date/time to schedule interviews</p>
        </div>
        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
          {rankings.length} candidates
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-xs tracking-wider uppercase">
              <th className="px-4 py-3">
                <button
                  onClick={toggleAll}
                  className="px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                >
                  {selectedIds.size === rankings.length ? "Deselect All" : "Select All"}
                </button>
              </th>
              <th className="px-4 py-3 text-center">Rank</th>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">AI Score</th>
              <th className="px-4 py-3">Test Score</th>
              <th className="px-4 py-3 text-indigo-700 font-bold">Final Score</th>
              <th className="px-4 py-3">Interview Date & Time</th>
              <th className="px-4 py-3">Duration (min)</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3 w-8"></th>
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
                    className={`border-b transition-colors cursor-pointer ${
                      expandedId === c.id
                        ? "bg-indigo-50"
                        : isSelected
                        ? "bg-indigo-50/40"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Rank */}
                    <td className="px-4 py-3 text-center">
                      {i < 3 ? (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          i === 0 ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                          : i === 1 ? "bg-gray-100 text-gray-600 border border-gray-300"
                          : "bg-orange-100 text-orange-600 border border-orange-300"
                        }`}>
                          {RANK_LABELS[i]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                          {i + 1}
                        </span>
                      )}
                    </td>

                    {/* Candidate */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </td>

                    {/* AI Score */}
                    <td className="px-4 py-3"><ScoreBar value={aiScore} /></td>

                    {/* Test Score */}
                    <td className="px-4 py-3">
                      {c.test_code_score != null || c.test_la_score != null
                        ? <ScoreBar value={testScore} />
                        : <span className="text-gray-300 text-xs">-</span>}
                    </td>

                    {/* Final Score */}
                    <td className="px-4 py-3">
                      <ScoreBar value={c.composite_score} big />
                    </td>

                    {/* Date/Time picker */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="datetime-local"
                        value={interviewData[c.id]?.dateTime || ""}
                        onChange={(e) => updateInterviewField(c.id, "dateTime", e.target.value)}
                        disabled={!isSelected}
                        className={`border rounded-lg px-2 py-1.5 text-xs w-44 outline-none transition ${
                          isSelected
                            ? "border-indigo-300 focus:ring-2 focus:ring-indigo-400 bg-white"
                            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      />
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        value={interviewData[c.id]?.duration || 30}
                        onChange={(e) => updateInterviewField(c.id, "duration", Number(e.target.value))}
                        min="15" max="120"
                        disabled={!isSelected}
                        className={`border rounded-lg px-2 py-1.5 text-xs w-16 outline-none transition ${
                          isSelected
                            ? "border-indigo-300 focus:ring-2 focus:ring-indigo-400 bg-white"
                            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      />
                    </td>

                    {/* Stage badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLOR[c.stage] || "bg-gray-100 text-gray-600"}`}>
                        {c.stage?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Expand toggle */}
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {c.score_explanation ? (expandedId === c.id ? "hide" : "more") : ""}
                    </td>
                  </tr>

                  {/* Expanded breakdown */}
                  {expandedId === c.id && c.score_explanation && (
                    <tr key={`${c.id}-final-breakdown`}>
                      <td colSpan={10} className="px-6 py-4 bg-indigo-50 border-b">
                        <ScoreBreakdown breakdown={c.score_explanation} title="Final Score Breakdown" />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Schedule section */}
      <div className="px-6 py-5 border-t bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition font-semibold text-sm shadow-sm"
            onClick={handleSchedule}
            disabled={scheduleLoading || readyCount === 0}
          >
            {scheduleLoading
              ? "Scheduling..."
              : `Schedule Interviews (${readyCount} ready)`}
          </button>
          {selectedIds.size > 0 && readyCount < selectedIds.size && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              Note: {selectedIds.size - readyCount} selected still need a date/time
            </span>
          )}
          {selectedIds.size === 0 && (
            <span className="text-xs text-gray-400">Select candidates and set date/time above to schedule interviews</span>
          )}
        </div>

        {scheduleResult && (
          <div className={`mt-4 rounded-xl border p-4 text-sm ${scheduleResult.error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            {scheduleResult.error ? (
              <p className="text-red-600 font-medium">Error: {scheduleResult.error}</p>
            ) : (
              <>
                <p className="font-bold text-green-700 mb-3">
                  Scheduled {scheduleResult.scheduled} interview(s) successfully
                </p>
                <div className="space-y-2">
                  {scheduleResult.results?.map((r, idx) => (
                    <div key={idx} className={`flex items-center gap-3 text-sm ${r.status === "scheduled" ? "text-green-700" : "text-red-600"}`}>
                      <span className="font-semibold text-xs">{r.status === "scheduled" ? "Done" : "Failed"}</span>
                      <span className="font-medium">{r.name}</span>
                      {r.interview_date && (
                        <span className="text-gray-500 text-xs">
                          {new Date(r.interview_date).toLocaleString()}
                        </span>
                      )}
                      {r.meet_link && (
                        <a href={r.meet_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs font-medium underline">
                          Meet Link
                        </a>
                      )}
                      {r.error && <span className="text-red-400 text-xs">- {r.error}</span>}
                    </div>
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
  // weighted = score * weight already, so divide by totalWeight to get 0-100 normalized
  return weightedSum / totalAiWeight;
}

function combinedTest(c) {
  const la = c.test_la_score ?? 0;
  const code = c.test_code_score ?? 0;
  return code * 0.6 + la * 0.4;
}
