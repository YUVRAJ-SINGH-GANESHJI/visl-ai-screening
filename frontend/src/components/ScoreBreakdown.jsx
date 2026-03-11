export default function ScoreBreakdown({ breakdown, excludeKeys = [], title = "Score Breakdown" }) {
  if (!breakdown || !breakdown.components) return null;

  const components = breakdown.components;
  const explanations = breakdown.explanations || {};

  const labels = {
    resume_jd_relevance: "Resume–JD Match",
    github_quality: "GitHub Profile",
    project_quality: "AI Project",
    research_quality: "Research Work",
    cgpa: "Academic (CGPA)",
    test_score: "Test Scores",
  };

  const barColor = (score) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-400";
  };

  const visibleEntries = Object.entries(components).filter(
    ([key]) => !excludeKeys.includes(key)
  );

  const visibleSum = visibleEntries.reduce((sum, [, comp]) => sum + (comp.weighted ?? 0), 0);

  return (
    <div>
      <h4 className="font-semibold mb-3">
        {title} -{" "}
        <span className="text-blue-600">{visibleSum.toFixed(1)}</span> / 100
      </h4>
      <div className="space-y-3">
        {visibleEntries.map(([key, comp]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{labels[key] || key}</span>
              <span>
                {comp.score?.toFixed(0)} × {(comp.weight * 100).toFixed(0)}% ={" "}
                <strong>{comp.weighted?.toFixed(1)}</strong>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${barColor(comp.score)}`}
                style={{ width: `${Math.min(comp.score, 100)}%` }}
              />
            </div>
            {explanations[key] && (
              <p className="text-xs text-gray-500 mt-1 italic">{explanations[key]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
