import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CandidatesTab from "./components/CandidatesTab";
import SchedulesTab from "./components/SchedulesTab";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [csvUploaded, setCsvUploaded] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        csvUploaded={csvUploaded}
      />
      <div className="ml-56 flex-1 h-screen overflow-y-auto">
        {/* All tabs stay mounted so state is never lost on tab switch */}
        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <Dashboard onCsvUploaded={() => setCsvUploaded(true)} />
        </div>
        <div style={{ display: activeTab === "candidates" ? "block" : "none" }}>
          <CandidatesTab />
        </div>
        <div style={{ display: activeTab === "schedules" ? "block" : "none" }}>
          <SchedulesTab />
        </div>
      </div>
    </div>
  );
}

export default App;
