import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Response error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const uploadCandidates = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload/candidates", formData);
};

export const runEvaluation = (jobDescription) =>
  api.post("/evaluate/run", { job_description: jobDescription });

export const getCandidates = (stage) =>
  api.get("/candidates", { params: stage ? { stage } : {} });

export const getCandidate = (id) => api.get(`/candidates/${id}`);

export const shortlistCandidates = (threshold = 60) =>
  api.post("/candidates/shortlist", null, { params: { threshold } });

export const uploadTestResults = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/tests/upload", formData);
};

export const sendTestEmails = (candidateIds, testUrl, emailBody = "") =>
  api.post("/email/send-test", { candidate_ids: candidateIds, test_url: testUrl, email_body: emailBody });

// interviews: [{candidate_id, interview_date, duration_minutes}]
export const scheduleInterviews = (interviews) =>
  api.post("/interview/schedule", interviews);

export const runFinalEvaluation = () => api.post("/evaluate/finalize");

export default api;
