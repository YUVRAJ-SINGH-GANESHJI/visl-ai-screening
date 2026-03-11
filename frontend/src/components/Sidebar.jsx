const COMPANY_NAME = "Visl AI Screening";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: DashboardIcon },
  { id: "candidates", label: "Candidates", Icon: UsersIcon, requiresCsv: true },
  { id: "schedules", label: "Schedules", Icon: CalendarIcon },
];

export default function Sidebar({ activeTab, setActiveTab, csvUploaded }) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-30 select-none"
      style={{ background: "#0f172a" }}
    >
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shrink-0">
            AI
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">{COMPANY_NAME}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3 mt-1">
          Navigation
        </p>
        {NAV.map(({ id, label, Icon, requiresCsv }) => {
          const locked = requiresCsv && !csvUploaded;
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => !locked && setActiveTab(id)}
              title={locked ? "Upload a Response CSV first to unlock" : label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                locked
                  ? "text-slate-500 cursor-not-allowed"
                  : active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span
                className={`shrink-0 ${
                  locked ? "text-slate-600" : active ? "text-white" : "text-slate-400"
                }`}
              >
                <Icon />
              </span>
              <span className="flex-1 text-left">{label}</span>
              {locked ? (
                <span className="text-slate-600 shrink-0">
                  <LockIcon />
                </span>
              ) : active ? (
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-xs text-slate-500">© 2026 Visl</p>
      </div>
    </aside>
  );
}
