import { useState } from "react";
import { uploadCandidates } from "../services/api";

export default function CsvUpload({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      setMessage("Please select a CSV file");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await uploadCandidates(file);
      setMessage(`✓ Uploaded ${res.data.count} candidates — previous list cleared.`);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setMessage(`✗ Upload failed: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  return (
    <div>
      <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50">
        {loading ? "⏳ Uploading..." : "📄 Choose Response CSV"}
        <input
          type="file"
          accept=".csv"
          onChange={handleUpload}
          disabled={loading}
          className="hidden"
        />
      </label>
      {message && (
        <p className={`mt-3 text-sm ${message.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
