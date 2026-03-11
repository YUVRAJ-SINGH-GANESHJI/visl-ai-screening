import { useState, useEffect } from "react";
import { getCandidates } from "../services/api";

function MeetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
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

function CalendarEmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-gray-200">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function formatDateTime(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dt;
  }
}

export default function SchedulesTab() {
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getCandidates("interview_scheduled")
      .then((res) => setScheduled(res.data))
      .catch((err) => setError(err.message || "Failed to load schedules"))
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
            <h1 className="text-xl font-bold text-gray-900">Interview Schedules</h1>
            <p className="text-sm text-gray-500 mt-0.5">Candidates with scheduled interviews</p>
          </div>
          <div className="flex items-center gap-3">
            {scheduled.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-full">
                {scheduled.length} scheduled
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
            <div className="py-16 text-center text-gray-400 text-sm">Loading schedules...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm">{error}</div>
          ) : scheduled.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <CalendarEmptyIcon />
              <p className="text-gray-500 text-sm font-medium">No interviews scheduled yet</p>
              <p className="text-gray-400 text-xs text-center max-w-xs">
                Schedule interviews from the Final Rankings table in the Dashboard tab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500 text-xs tracking-wider uppercase">
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3 min-w-[160px]">Name</th>
                    <th className="px-4 py-3 min-w-[200px]">Email</th>
                    <th className="px-4 py-3 min-w-[180px]">Interview Date & Time</th>
                    <th className="px-4 py-3 text-center min-w-[140px]">Meet Link</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduled.map((c, i) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{c.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 font-medium">
                          {formatDateTime(c.interview_datetime)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.meet_link ? (
                          <a
                            href={c.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
                          >
                            <MeetIcon />
                            Join Meet
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
