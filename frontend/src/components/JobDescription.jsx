import { useState } from "react";

export default function JobDescription({ onSubmit, loading }) {
  const [jd, setJd] = useState("");

  const handleSubmit = () => {
    if (!jd.trim()) return;
    onSubmit(jd);
  };

  return (
    <div>
      <textarea
        className="w-full h-40 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-sm"
        placeholder="Paste the job description here..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />
      <button
        className="mt-3 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm"
        onClick={handleSubmit}
        disabled={loading || !jd.trim()}
      >
        {loading ? "⏳ Evaluating..." : "🚀 Run AI Evaluation"}
      </button>
    </div>
  );
}
