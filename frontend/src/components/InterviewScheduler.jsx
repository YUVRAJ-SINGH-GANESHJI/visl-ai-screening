import { useState } from "react";
import { scheduleInterviews } from "../services/api";

export default function InterviewScheduler({ candidates }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateTime, setDateTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const eligible = candidates.filter(
    (c) => c.stage === "test_completed" || c.stage === "shortlisted" || c.stage === "evaluated"
  );

  const toggleCandidate = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSchedule = async () => {
    if (!selectedIds.length || !dateTime) return;
    setLoading(true);
    try {
      const res = await scheduleInterviews(selectedIds, dateTime, duration);
      setResults(res.data);
    } catch (err) {
      setResults({ error: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <section className="mb-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">📅 Schedule Interviews</h2>

      {eligible.length === 0 ? (
        <p className="text-gray-500 text-sm">No candidates eligible for interview scheduling.</p>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Select candidates:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {eligible.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleCandidate(c.id)}
                    className="rounded"
                  />
                  {c.name} — {c.composite_score?.toFixed(1) || "—"}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="15"
                max="120"
                className="border rounded px-3 py-2 text-sm w-20"
              />
            </div>
          </div>

          <button
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            onClick={handleSchedule}
            disabled={loading || !selectedIds.length || !dateTime}
          >
            {loading ? "Scheduling..." : `Schedule ${selectedIds.length} Interview(s)`}
          </button>
        </>
      )}

      {results && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          {results.error ? (
            <p className="text-red-600">Error: {results.error}</p>
          ) : (
            <>
              <p className="font-medium">Scheduled: {results.scheduled}</p>
              {results.results?.map((r, i) => (
                <p key={i} className={r.status === "scheduled" ? "text-green-600" : "text-red-600"}>
                  {r.name} — {r.status} {r.meet_link && `(${r.meet_link})`}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
