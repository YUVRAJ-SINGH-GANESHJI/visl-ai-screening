export default function TestResultsTable({ candidates }) {
  const sorted = [...candidates]
    .filter((c) => c.test_code_score != null || c.test_la_score != null)
    .sort((a, b) => {
      const scoreA = combinedTestScore(a);
      const scoreB = combinedTestScore(b);
      return scoreB - scoreA;
    });

  if (!sorted.length) return null;

  return (
    <section className="mb-6 bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b bg-purple-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-purple-900">
          📝 Table 2 - Test Results
        </h2>
        <span className="text-sm text-purple-600 font-medium">{sorted.length} candidates</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Test - LA (/100)</th>
              <th className="px-4 py-3 text-center">Test - Code (/100)</th>
              <th className="px-4 py-3 text-center font-bold text-purple-700">Combined Test Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => {
              const combined = combinedTestScore(c);
              return (
                <tr key={c.id} className="border-b hover:bg-purple-50 transition">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell value={c.test_la_score} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreCell value={c.test_code_score} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold font-mono text-lg text-purple-700">
                      {combined.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/ 100</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-6 py-2 text-xs text-gray-400 border-t">
        Combined = Code × 60% + LA × 40%
      </p>
    </section>
  );
}

function combinedTestScore(c) {
  const la = c.test_la_score ?? 0;
  const code = c.test_code_score ?? 0;
  if (c.test_code_score == null && c.test_la_score == null) return 0;
  return code * 0.6 + la * 0.4;
}

function ScoreCell({ value }) {
  if (value == null) return <span className="text-gray-300">-</span>;
  const color =
    value >= 75 ? "text-green-600" : value >= 50 ? "text-yellow-600" : "text-red-500";
  return <span className={`font-mono font-semibold ${color}`}>{value.toFixed(0)}</span>;
}
