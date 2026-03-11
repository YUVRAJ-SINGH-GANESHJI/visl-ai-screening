import { useState } from "react";
import CsvUpload from "./CsvUpload";
import JobDescription from "./JobDescription";
import AiEvalTable from "./AiEvalTable";
import SendTestLinks from "./SendTestLinks";
import TestResultsTable from "./TestResultsTable";
import FinalRankingTable from "./FinalRankingTable";
import {
  getCandidates,
  runEvaluation,
  uploadTestResults,
  runFinalEvaluation,
} from "../services/api";

const STEPS = [
  { id: 1, label: "Upload Responses" },
  { id: 2, label: "AI Evaluation" },
  { id: 3, label: "Send Test Links" },
  { id: 4, label: "Test Results" },
  { id: 5, label: "Final Ranking" },
];

export default function Dashboard({ onCsvUploaded }) {
  const [candidates, setCandidates] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [aiEvalDone, setAiEvalDone] = useState(false);
  const [testLinksSent, setTestLinksSent] = useState(false);
  const [testsDone, setTestsDone] = useState(false);
  const [finalRankings, setFinalRankings] = useState([]);
  const [finalDone, setFinalDone] = useState(false);

  const fetchCandidates = async () => {
    try {
      const res = await getCandidates();
      setCandidates(res.data);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    }
  };

  const handleUploadSuccess = () => {
    // Reset all downstream states on fresh upload
    setAiEvalDone(false);
    setTestLinksSent(false);
    setTestsDone(false);
    setFinalDone(false);
    setFinalRankings([]);
    setCurrentStep(2);
    fetchCandidates();
    setStatus("✓ Candidates uploaded. Now enter the Job Description and run AI Evaluation.");
    if (onCsvUploaded) onCsvUploaded();
  };

  const handleEvaluate = async (jobDescription) => {
    setLoading(true);
    setStatus("Running AI evaluation...");
    try {
      const res = await runEvaluation(jobDescription);
      setStatus(`✓ Evaluated ${res.data.evaluated} candidates successfully.`);
      setAiEvalDone(true);
      setCurrentStep(3);
      fetchCandidates();
    } catch (err) {
      setStatus(`✗ Evaluation failed: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const handleTestLinksSent = () => {
    setTestLinksSent(true);
    setCurrentStep(4);
    setStatus("✓ Test links sent. Now upload Test Results CSV once candidates complete the test.");
  };

  const handleTestUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus("Uploading test results...");
    try {
      const res = await uploadTestResults(file);
      setStatus(`✓ Updated ${res.data.updated} candidate test scores.`);
      setTestsDone(true);
      setCurrentStep(5);
      fetchCandidates();
    } catch (err) {
      setStatus(`✗ Test upload failed: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const handleFinalEval = async () => {
    setLoading(true);
    setStatus("Computing final rankings...");
    try {
      const res = await runFinalEvaluation();
      setFinalRankings(res.data.rankings);
      setFinalDone(true);
      setStatus(`✓ Final rankings computed for ${res.data.finalized} candidates.`);
    } catch (err) {
      setStatus(`✗ Final evaluation failed: ${err.response?.data?.error || err.message}`);
    }
    setLoading(false);
  };

  const aiEvaluated = candidates.filter(
    (c) => c.stage !== "uploaded" && c.composite_score != null
  );
  const testCompleted = candidates.filter(
    (c) => c.test_code_score != null || c.test_la_score != null
  );

  const aiEvaluatedCount = candidates.filter((c) => c.composite_score != null).length;
  const testDoneCount = candidates.filter(
    (c) => c.test_code_score != null || c.test_la_score != null
  ).length;
  const shortlistedCount = candidates.filter(
    (c) => c.stage === "shortlisted" || c.stage === "test_sent" || c.stage === "interview_scheduled"
  ).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 100%)" }}>
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered candidate evaluation pipeline</p>
        </div>

        {/* Stats Cards */}
        {candidates.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Candidates" value={candidates.length} color="blue" icon="ALL" />
            <StatCard label="AI Evaluated" value={aiEvaluatedCount} color="purple" icon="AI" />
            <StatCard label="Tests Completed" value={testDoneCount} color="orange" icon="TST" />
            <StatCard label="Shortlisted" value={shortlistedCount} color="green" icon="OK" />
          </div>
        )}

        {/* Progress Stepper */}
        <Stepper steps={STEPS} currentStep={currentStep} />

        {/* Status Banner */}
        {status && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between shadow-sm ${
              status.startsWith("✓")
                ? "bg-green-50 text-green-800 border border-green-200"
                : status.startsWith("✗")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <span className="font-medium">{status}</span>
            <button
              className="text-xs underline opacity-60 hover:opacity-100 ml-4 shrink-0"
              onClick={() => setStatus("")}
            >
              dismiss
            </button>
          </div>
        )}

        {/* ── STEP 1: Upload Candidate Responses ── */}
        <StepSection
          number={1}
          title="Upload Candidate Responses CSV"
          subtitle="Upload the Response.csv file containing all candidate submissions."
          done={candidates.length > 0}
          active={currentStep === 1}
        >
          <CsvUpload onUploadSuccess={handleUploadSuccess} />
        </StepSection>

        {/* ── STEP 2: AI Evaluation ── */}
        {currentStep >= 2 && (
          <StepSection
            number={2}
            title="AI Evaluation - JD · GitHub · Resume"
            subtitle="Paste the job description below. AI will score each candidate against it using their resume, GitHub, and project details."
            done={aiEvalDone}
            active={currentStep === 2}
          >
            <JobDescription onSubmit={handleEvaluate} loading={loading} />
          </StepSection>
        )}

        {/* TABLE 1: AI Evaluation Results */}
        {aiEvalDone && aiEvaluated.length > 0 && (
          <AiEvalTable candidates={aiEvaluated} />
        )}

        {/* ── STEP 3: Send Test Links ── */}
        {currentStep >= 3 && aiEvalDone && (
          <StepSection
            number={3}
            title="Send Test Links to Selected Candidates"
            subtitle="Select candidates from the table below, enter the test URL and optional email body, then send."
            done={testLinksSent}
            active={currentStep === 3}
          >
            <SendTestLinks candidates={aiEvaluated} onSent={handleTestLinksSent} />
          </StepSection>
        )}

        {/* ── STEP 4: Upload Test Results - always visible once AI eval done ── */}
        {currentStep >= 3 && aiEvalDone && (
          <StepSection
            number={4}
            title="Upload Test Results CSV"
            subtitle="If tests are already completed, upload Test_Result.csv directly (no need to wait for Step 3)."
            done={testsDone}
            active={currentStep === 4}
          >
            <TestUpload loading={loading} onUpload={handleTestUpload} />
          </StepSection>
        )}

        {/* TABLE 2: Test Results */}
        {testsDone && testCompleted.length > 0 && (
          <TestResultsTable candidates={testCompleted} />
        )}

        {/* ── STEP 5: Final Evaluation ── */}
        {currentStep >= 5 && (
          <StepSection
            number={5}
            title="Final Evaluation & Ranking"
            subtitle="Combine AI scores + test scores to produce the final ranked list. Then schedule interviews directly from the table."
            done={finalDone}
            active={currentStep === 5}
          >
            <button
              className="px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition font-bold text-sm shadow-md"
              onClick={handleFinalEval}
              disabled={loading}
            >
              {loading ? "Computing..." : "Run Final Evaluation & Rank All Candidates"}
            </button>
          </StepSection>
        )}

        {/* TABLE 3: Final Ranking + Interview Scheduler */}
        {finalDone && finalRankings.length > 0 && (
          <FinalRankingTable rankings={finalRankings} />
        )}
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ label, value, color, icon }) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-400 to-orange-500",
    green: "from-green-500 to-green-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function Stepper({ steps, currentStep }) {
  return (
    <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
      <div className="flex items-start">
        {steps.map((step, i) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all duration-300 ${
                    done
                      ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-200"
                      : active
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-300 scale-110"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {done ? "✓" : step.id}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center leading-tight max-w-[80px] ${
                    active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 mt-[-20px] rounded-full transition-all duration-300 ${
                    done ? "bg-green-400" : "bg-gray-100"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepSection({ number, title, subtitle, done, active, children }) {
  return (
    <div
      className={`mb-6 bg-white rounded-2xl shadow-sm transition-all duration-200 overflow-hidden ${
        done
          ? "border border-green-200"
          : active
          ? "border-2 border-blue-400 shadow-blue-100 shadow-md"
          : "border border-gray-200 opacity-75"
      }`}
    >
      <div
        className={`px-6 py-3 flex items-center gap-3 ${
          done ? "bg-green-50" : active ? "bg-blue-50" : "bg-gray-50"
        }`}
      >
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            done
              ? "bg-green-200 text-green-800"
              : active
              ? "bg-blue-200 text-blue-800"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          STEP {number}
        </span>
        <h2 className="text-sm font-bold text-gray-800 flex-1">{title}</h2>
        {done && (
          <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-0.5 rounded-full">✓ Complete</span>
        )}
      </div>
      <div className="px-6 py-5">
        {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function TestUpload({ loading, onUpload }) {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition text-sm font-semibold shadow-sm">
      {loading ? "Uploading..." : "Upload Test Results CSV"}
      <input type="file" accept=".csv" onChange={handleChange} disabled={loading} className="hidden" />
    </label>
  );
}

