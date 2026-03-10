export default function CandidateCard({ candidate }) {
  if (!candidate) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-2">{candidate.name}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <p><span className="font-medium">Email:</span> {candidate.email}</p>
        <p><span className="font-medium">College:</span> {candidate.college}</p>
        <p><span className="font-medium">Branch:</span> {candidate.branch}</p>
        <p><span className="font-medium">CGPA:</span> {candidate.cgpa}</p>
        {candidate.github_url && (
          <p>
            <span className="font-medium">GitHub:</span>{" "}
            <a href={candidate.github_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              Profile
            </a>
          </p>
        )}
        {candidate.resume_url && (
          <p>
            <span className="font-medium">Resume:</span>{" "}
            <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
              View
            </a>
          </p>
        )}
      </div>
      {candidate.best_ai_project && (
        <div className="mt-3">
          <p className="font-medium text-sm">AI Project:</p>
          <p className="text-sm text-gray-600 mt-1">{candidate.best_ai_project}</p>
        </div>
      )}
      {candidate.composite_score != null && (
        <div className="mt-3 text-right">
          <span className="text-2xl font-bold text-blue-600">{candidate.composite_score.toFixed(1)}</span>
          <span className="text-sm text-gray-500"> / 100</span>
        </div>
      )}
    </div>
  );
}
