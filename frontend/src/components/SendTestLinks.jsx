import { useState } from "react";
import { sendTestEmails } from "../services/api";

export default function SendTestLinks({ candidates, onSent }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [testUrl, setTestUrl] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sorted = [...candidates].sort(
    (a, b) => (b.composite_score || 0) - (a.composite_score || 0)
  );

  const allSelected = sorted.length > 0 && selectedIds.size === sorted.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sorted.map((c) => c.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0 || !testUrl.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await sendTestEmails(
        Array.from(selectedIds),
        testUrl.trim(),
        emailBody.trim()
      );
      const sent = res.data.results.filter((r) => r.status === "sent").length;
      const failed = res.data.results.filter((r) => r.status === "failed").length;
      setResult({ sent, failed, details: res.data.results });
      if (onSent) onSent();
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <section className="mb-6 bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b bg-orange-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-orange-900">
          📧 Send Test Links — Select Candidates
        </h2>
        <span className="text-sm text-orange-600 font-medium">
          {selectedIds.size} / {sorted.length} selected
        </span>
      </div>

      {/* Candidate Selection Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <th className="px-4 py-3 w-10">
                <button
                  onClick={toggleAll}
                  className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              </th>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">AI Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b transition cursor-pointer ${
                  selectedIds.has(c.id) ? "bg-orange-50" : "hover:bg-gray-50"
                }`}
                onClick={() => toggleOne(c.id)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleOne(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-gray-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[180px]">
                  {c.college}
                </td>
                <td className="px-4 py-3 font-bold font-mono text-blue-700">
                  {c.composite_score?.toFixed(1) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Test URL + Email Body + Send */}
      <div className="px-6 py-5 border-t bg-gray-50 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Test Link URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://forms.google.com/your-test-link"
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Email Body <span className="text-gray-400 font-normal">(optional — replaces default message)</span>
          </label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={3}
            placeholder="You have been shortlisted for the next round. Please complete the assessment using the link below."
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none resize-y"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSend}
            disabled={loading || selectedIds.size === 0 || !testUrl.trim()}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition font-semibold text-sm shadow"
          >
            {loading
              ? "⏳ Sending..."
              : `📤 Send Test Links to ${selectedIds.size} Candidate${selectedIds.size !== 1 ? "s" : ""}`}
          </button>
          {selectedIds.size === 0 && (
            <span className="text-xs text-gray-400">Select at least one candidate</span>
          )}
        </div>

        {/* Result feedback */}
        {result && !result.error && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <p className="font-semibold">
              ✓ {result.sent} email{result.sent !== 1 ? "s" : ""} sent successfully
              {result.failed > 0 && `, ${result.failed} failed`}
            </p>
            <ul className="mt-2 space-y-0.5 text-xs">
              {result.details.map((r, i) => (
                <li key={i}>
                  {r.status === "sent" ? "✅" : "❌"} {r.name} — {r.email} — {r.status}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ✗ Failed: {result.error}
          </div>
        )}
      </div>
    </section>
  );
}
