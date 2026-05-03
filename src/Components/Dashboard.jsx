import React, { useEffect, useState } from "react";
import { useFirebase } from "../Auth/firebase";
import LoanApplications from "./LoanApplications";
import Documents from "./Documents";
import { useNavigate } from "react-router-dom";
import FraudDetection from "./Frauddetection";

export default function Dashboard() {
  const navigate = useNavigate();
  const { Logout, loading } = useFirebase();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => { await Logout(); navigate("/"); };

  const navItems = [
    { label: "Dashboard",       tab: "dashboard",    icon: "⊞" },
    { label: "Applications",    tab: "applications", icon: "📋" },
    { label: "Documents",       tab: "documents",    icon: "📄" },
    { label: "Fraud Detection", tab: "fraud",        icon: "🛡️" },
    { label: "Reports",         tab: "reports",      icon: "📊" },
    { label: "Settings",        tab: "settings",     icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm px-4 sm:px-6 md:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold">✓</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">LoanTrack Pro</h1>
              <p className="text-xs text-gray-500">Smart Loan Monitoring</p>
            </div>
          </div>

          <div className="hidden lg:flex gap-1 font-medium">
            {navItems.map((item) => (
              <NavItem key={item.tab} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="hidden md:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition text-sm font-medium">
              <span>↩</span> Logout
            </button>
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <div className="w-5 h-0.5 bg-gray-600 mb-1" />
              <div className="w-5 h-0.5 bg-gray-600 mb-1" />
              <div className="w-5 h-0.5 bg-gray-600" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 border-t pt-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button key={item.tab}
                onClick={() => { setActiveTab(item.tab); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === item.tab ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
                }`}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 mt-2 border-t pt-4">
              ↩ Logout
            </button>
          </div>
        )}
      </nav>

      {/* PAGE CONTENT */}
      <div className="p-4 sm:p-6 md:p-10">
        {activeTab === "dashboard"    && <DashboardHome setActiveTab={setActiveTab} />}
        {activeTab === "applications" && <LoanApplications />}
        {activeTab === "documents"    && <Documents />}
        {activeTab === "fraud"        && <FraudDetection />}
        {activeTab === "reports"      && <Reports />}
        {activeTab === "settings"     && <Settings />}
      </div>
    </div>
  );
}

/* ─── NAV ITEM ─── */
function NavItem({ label, icon, tab, activeTab, setActiveTab }) {
  const isActive = activeTab === tab;
  return (
    <button onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
        isActive ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
      }`}>
      <span style={{ fontSize: "14px" }}>{icon}</span>
      {label}
    </button>
  );
}

/* ─── DASHBOARD HOME ─── */
function DashboardHome({ setActiveTab }) {
  const firebase = useFirebase();
  const [loans, setLoans]         = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!firebase?.getUserLoans) return;
    const fetchData = async () => {
      try {
        const [loanData, docData] = await Promise.all([
          firebase.getUserLoans(),
          firebase.getUserDocuments(),
        ]);
        setLoans(loanData   || []);
        setDocuments(docData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [firebase]);

  // ── DYNAMIC COMPLIANCE SCORE ────────────────────────────────
  // Weighted formula:
  //   50% → ratio of AI-verified docs to total docs
  //   30% → average AI score across all documents
  //   20% → ratio of GPS-verified docs to total docs
  // Result: 0–100. Shows 0 if no documents uploaded yet.
  const verifiedDocs   = documents.filter((d) => d.status === "verified" || d.aiVerified);
  const aiScores       = documents.map((d) => d.aiScore).filter((s) => s != null);
  const avgAiScore     = aiScores.length > 0
    ? aiScores.reduce((a, b) => a + b, 0) / aiScores.length
    : 0;
  const gpsVerifiedDocs = documents.filter((d) => d.gpsVerified);
  const complianceScore = documents.length === 0 ? 0 : Math.round(
    (verifiedDocs.length  / documents.length) * 50 +
    (avgAiScore / 100)                         * 30 +
    (gpsVerifiedDocs.length / documents.length) * 20
  );

  const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const fraudAlerts   = loans.filter((l) => l.fraudFlag).length;
  const flaggedDocs   = documents.filter((d) => d.status === "flagged").length;

  // ── DYNAMIC RECENT ACTIVITY ─────────────────────────────────
  // Built from real documents + loans, sorted newest first.
  // Each event gets a type: success / warning / danger
  const recentActivity = [
    // Document events
    ...documents.map((d) => ({
      key:      "doc-" + d.id,
      sortDate: d.uploadedAt || d.date || "1970-01-01",
      type:     d.status === "verified" ? "success"
              : d.status === "flagged"  ? "danger"
              : "warning",
      title:    d.status === "verified" ? "Document AI verified"
              : d.status === "flagged"  ? "Document flagged by AI"
              : "Document pending review",
      subtitle: d.name || "Unnamed file",
      time:     d.uploadedAt
                  ? timeAgo(d.uploadedAt)
                  : d.date || "recently",
    })),
    // Loan events
    ...loans.map((l) => ({
      key:      "loan-" + l.id,
      sortDate: l.createdAt || "1970-01-01",
      type:     l.fraudFlag          ? "danger"
              : l.status === "approved" ? "success"
              : l.status === "rejected" ? "danger"
              : "warning",
      title:    l.fraudFlag             ? "🚨 Fraud alert on loan"
              : l.status === "approved"  ? "Loan approved"
              : l.status === "rejected"  ? "Loan rejected"
              : "Loan application submitted",
      subtitle: `${l.type} · ₹${Number(l.amount || 0).toLocaleString("en-IN")}`,
      time:     l.createdAt ? timeAgo(l.createdAt) : "recently",
    })),
  ]
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))
    .slice(0, 5); // show 5 most recent

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-1">Welcome Back!</h2>
      <p className="text-gray-500 mb-8 text-sm sm:text-base">Here's your loan utilization overview</p>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📋" iconBg="bg-green-100"  title="Active Loans"       value={loans.length} />
        <StatCard icon="💰" iconBg="bg-blue-100"   title="Total Borrowed"     value={`₹${totalBorrowed.toLocaleString("en-IN")}`} />
        <StatCard icon="📤" iconBg="bg-purple-100" title="Documents Uploaded" value={documents.length} />
        <StatCard
          icon="✅" iconBg="bg-emerald-100"
          title="Compliance Score"
          value={`${complianceScore}%`}
          valueColor={complianceScore >= 75 ? "text-green-600" : complianceScore >= 45 ? "text-yellow-600" : "text-red-600"}
        />
      </div>

      {/* FRAUD ALERT BANNER */}
      {(fraudAlerts > 0 || flaggedDocs > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold text-red-700 text-sm">
                {fraudAlerts > 0 && `${fraudAlerts} loan${fraudAlerts > 1 ? "s" : ""} flagged`}
                {fraudAlerts > 0 && flaggedDocs > 0 && " · "}
                {flaggedDocs > 0 && `${flaggedDocs} document${flaggedDocs > 1 ? "s" : ""} flagged by AI`}
              </p>
              <p className="text-red-500 text-xs">Immediate review required</p>
            </div>
          </div>
          <button onClick={() => setActiveTab("fraud")}
            className="bg-red-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-700 transition flex-shrink-0">
            Review Now
          </button>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* ACTIVE LOANS — 2/3 */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold">Active Loans</h3>
            <button onClick={() => setActiveTab("applications")} className="text-green-600 text-sm hover:underline">
              View All →
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-4xl mb-3">📭</p>
              <p className="text-gray-500 mb-4 text-sm">No loan applications found</p>
              <button onClick={() => setActiveTab("applications")}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                Create Loan Application
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.slice(0, 3).map((loan) => (
                <LoanCard key={loan.id} loan={loan} documents={documents} />
              ))}
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY — 1/3 — now fully dynamic */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold mb-5">Recent Activity</h3>
          {loadingData ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-400 text-xs">No activity yet. Upload a document or create a loan to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <ActivityItem key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionCard emoji="📤" title="Upload Documents"  desc="Submit evidence photos for AI verification"  button="Upload Now"   onClick={() => setActiveTab("documents")} gradient="from-green-500 to-green-600" />
        <ActionCard emoji="🛡️" title="Fraud Detection"   desc="Run AI-powered fraud analysis on your loans" button="View Alerts"  onClick={() => setActiveTab("fraud")}     gradient="from-red-500 to-red-600" />
        <ActionCard emoji="📊" title="View Reports"      desc="See compliance insights and analytics"       button="View Reports" onClick={() => setActiveTab("reports")}   gradient="from-blue-500 to-blue-600" />
      </div>
    </>
  );
}

/* ─── LOAN CARD — dynamic utilisation + AI badge ─── */
function LoanCard({ loan, documents = [] }) {
  const statusColors = {
    approved:       "bg-green-100 text-green-700",
    pending:        "bg-yellow-100 text-yellow-700",
    rejected:       "bg-red-100 text-red-700",
    active:         "bg-blue-100 text-blue-700",
    "under review": "bg-purple-100 text-purple-700",
  };
  const status = loan.status || "pending";

  // ── DYNAMIC UTILISATION ──────────────────────────────────────
  // verified docs for this loan ÷ total docs for this loan × 100
  const loanDocs    = documents.filter((d) => d.loanId === loan.id);
  const verifiedD   = loanDocs.filter((d) => d.status === "verified" || d.aiVerified === true);
  const utilization = loanDocs.length > 0
    ? Math.round((verifiedD.length / loanDocs.length) * 100)
    : 0;

  // ── DYNAMIC AI SCORE ─────────────────────────────────────────
  const scored   = loanDocs.filter((d) => d.aiScore != null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, d) => s + d.aiScore, 0) / scored.length)
    : null;

  const gpsCount = loanDocs.filter((d) => d.gpsVerified).length;

  const utilColor = utilization >= 75 ? "bg-green-500"
    : utilization >= 40 ? "bg-blue-400"
    : utilization > 0   ? "bg-yellow-400"
    : "bg-gray-200";

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-sm">{loan.type || loan.loanType || "Loan"}</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            ₹{Number(loan.amount || 0).toLocaleString("en-IN")}
            {loanDocs.length > 0 && ` · ${loanDocs.length} doc${loanDocs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loan.fraudFlag && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">🚨 Fraud</span>}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Dynamic utilisation bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Utilisation</span>
          <span>{utilization}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-1.5 rounded-full transition-all duration-700 ${utilColor}`} style={{ width: `${utilization}%` }} />
        </div>
        {loanDocs.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">Upload documents to track utilisation</p>
        )}
      </div>

      {/* AI verification + GPS badges */}
      <div className="flex items-center gap-2 flex-wrap mt-2">
        {avgScore !== null ? (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            avgScore >= 70 ? "bg-green-100 text-green-700"
            : avgScore >= 40 ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
          }`}>
            AI: {avgScore}/100
          </span>
        ) : (
          <span className="text-xs text-yellow-600 font-medium">⏳ Awaiting AI review</span>
        )}
        {gpsCount > 0 && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">📍 GPS ✓</span>
        )}
        {loan.fraudResult && (
          <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
            loan.fraudResult.fraudRisk === "low"    ? "bg-green-100 text-green-700"
            : loan.fraudResult.fraudRisk === "medium" ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
          }`}>
            Fraud: {loan.fraudResult.fraudRisk}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── ACTIVITY ITEM ─── */
function ActivityItem({ item }) {
  const colors = {
    success: { icon: "✓", ring: "bg-green-100", text: "#16a34a" },
    warning: { icon: "⏳", ring: "bg-yellow-100", text: "#ca8a04" },
    danger:  { icon: "!",  ring: "bg-red-100",    text: "#dc2626" },
  };
  const c = colors[item.type] || colors.success;
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${c.ring}`}>
        <span className="text-xs font-bold" style={{ color: c.text }}>{c.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-tight">{item.title}</p>
        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
      </div>
    </div>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ icon, iconBg, title, value, valueColor = "text-gray-900" }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{title}</p>
    </div>
  );
}

/* ─── ACTION CARD ─── */
function ActionCard({ emoji, title, desc, button, onClick, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white p-5 rounded-2xl`}>
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-white/80 text-xs mb-4">{desc}</p>
      <button onClick={onClick}
        className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition w-full border border-white/30">
        {button}
      </button>
    </div>
  );
}

/* ─── REPORTS PAGE — dynamic ─── */
function Reports() {
  const firebase = useFirebase();
  const [loans, setLoans]         = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!firebase?.getUserLoans) return;
    Promise.all([firebase.getUserLoans(), firebase.getUserDocuments?.()]).then(([l, d]) => {
      setLoans(l || []);
      setDocuments(d || []);
      setLoading(false);
    });
  }, [firebase]);

  const totalBorrowed    = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const approvedCount    = loans.filter((l) => l.status === "approved").length;
  const pendingCount     = loans.filter((l) => l.status === "pending").length;
  const aiScores         = documents.map((d) => d.aiScore).filter((s) => s != null);
  const avgAiScore       = aiScores.length > 0 ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 0;
  const gpsVerifiedCount = documents.filter((d) => d.gpsVerified).length;
  const verifiedDocCount = documents.filter((d) => d.status === "verified" || d.aiVerified).length;

  // Dynamic compliance checklist — all derived from real data
  const checklist = [
    { label: "Loan application submitted",      done: loans.length > 0 },
    { label: "Evidence documents uploaded",     done: documents.length > 0 },
    { label: "AI evidence verification passed", done: verifiedDocCount > 0 },
    { label: "GPS location validated",          done: gpsVerifiedCount > 0 },
    { label: "No fraud flags raised",           done: !loans.some((l) => l.fraudFlag) && !documents.some((d) => d.status === "flagged") },
    { label: "Avg AI score above 70",           done: aiScores.length > 0 && avgAiScore >= 70 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Reports & Analytics</h2>
        <p className="text-gray-500 text-sm">Compliance summary and loan utilisation insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="💸" iconBg="bg-blue-100"   title="Total Disbursed"  value={`₹${totalBorrowed.toLocaleString("en-IN")}`} />
        <StatCard icon="✅" iconBg="bg-green-100"  title="Approved Loans"   value={approvedCount} />
        <StatCard icon="⏳" iconBg="bg-yellow-100" title="Pending Loans"    value={pendingCount} />
        <StatCard icon="🤖" iconBg="bg-purple-100" title="Avg AI Score"     value={aiScores.length > 0 ? `${avgAiScore}/100` : "N/A"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-sm mb-4">Loan Status Breakdown</h3>
          {loans.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No loan data available</p>
          ) : (
            <div className="space-y-3">
              {["approved", "pending", "rejected", "active", "under review"].map((status) => {
                const count = loans.filter((l) => (l.status || "pending") === status).length;
                if (!count) return null;
                const pct = Math.round((count / loans.length) * 100);
                const colors = { approved: "bg-green-500", pending: "bg-yellow-400", rejected: "bg-red-500", active: "bg-blue-500", "under review": "bg-purple-500" };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="capitalize">{status}</span>
                      <span>{count} loan{count !== 1 ? "s" : ""} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic compliance checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-sm mb-4">Compliance Checklist</h3>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-green-100" : "bg-gray-100"}`}>
                  <span className={`text-xs font-bold ${item.done ? "text-green-600" : "text-gray-400"}`}>
                    {item.done ? "✓" : "–"}
                  </span>
                </div>
                <span className={`text-sm ${item.done ? "text-gray-700" : "text-gray-400"}`}>{item.label}</span>
              </div>
            ))}
          </div>
          {/* Overall compliance progress */}
          <div className="mt-5 pt-4 border-t border-gray-50">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Overall compliance</span>
              <span className="font-semibold">{checklist.filter((c) => c.done).length}/{checklist.length}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-700"
                style={{ width: `${(checklist.filter((c) => c.done).length / checklist.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI score distribution — only shows if docs exist */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <h3 className="font-semibold text-sm mb-4">AI Evidence Score Distribution</h3>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xl font-bold text-green-600">{documents.filter((d) => (d.aiScore || 0) >= 70).length}</p>
                <p className="text-xs text-green-500 mt-1">High (70–100)</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3">
                <p className="text-xl font-bold text-yellow-600">{documents.filter((d) => (d.aiScore || 0) >= 40 && (d.aiScore || 0) < 70).length}</p>
                <p className="text-xs text-yellow-500 mt-1">Medium (40–69)</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xl font-bold text-red-600">{documents.filter((d) => d.aiScore != null && (d.aiScore || 0) < 40).length}</p>
                <p className="text-xs text-red-500 mt-1">Low (0–39)</p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full flex overflow-hidden">
              <div className="h-3 bg-green-500"  style={{ width: `${(documents.filter((d) => (d.aiScore || 0) >= 70).length / documents.length) * 100}%` }} />
              <div className="h-3 bg-yellow-400" style={{ width: `${(documents.filter((d) => (d.aiScore || 0) >= 40 && (d.aiScore || 0) < 70).length / documents.length) * 100}%` }} />
              <div className="h-3 bg-red-400"    style={{ width: `${(documents.filter((d) => d.aiScore != null && (d.aiScore || 0) < 40).length / documents.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SETTINGS PAGE ─── */
function Settings() {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    emailAlerts: true, fraudAlerts: true, documentReminders: false, weeklyReport: true,
  });

  const Toggle = ({ id, label, desc }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => setNotifications((n) => ({ ...n, [id]: !n[id] }))}
        className={`relative w-11 h-6 rounded-full transition-colors ${notifications[id] ? "bg-green-500" : "bg-gray-200"}`}>
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[id] ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Settings</h2>
        <p className="text-gray-500 text-sm">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-sm mb-4">Profile</h3>
        <div className="space-y-4">
          {[
            { label: "Full name",     type: "text",  ph: "Your name" },
            { label: "Email address", type: "email", ph: "you@example.com" },
            { label: "Phone number",  type: "tel",   ph: "+91 00000 00000" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              <input type={f.type} placeholder={f.ph}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-sm mb-2">Notifications</h3>
        <Toggle id="emailAlerts"       label="Email alerts"          desc="Receive updates on loan status changes" />
        <Toggle id="fraudAlerts"       label="Fraud alerts"          desc="Immediate notification on suspicious activity" />
        <Toggle id="documentReminders" label="Document reminders"    desc="Reminders to upload pending documents" />
        <Toggle id="weeklyReport"      label="Weekly summary report" desc="Get a weekly compliance and utilisation report" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="font-semibold text-sm mb-4">Security</h3>
        <div className="space-y-3">
          {[
            { label: "Change password",           right: "→" },
            { label: "Two-factor authentication", right: <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Off</span> },
            { label: "Active sessions",           right: "→" },
          ].map((item) => (
            <button key={item.label}
              className="w-full text-left flex items-center justify-between py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition text-sm">
              <span>{item.label}</span>
              <span className="text-gray-400">{item.right}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium">
          Save changes
        </button>
        {saved && <span className="text-green-600 text-sm">✓ Saved successfully</span>}
      </div>
    </div>
  );
}

/* ─── UTILITY — human-readable time ago ─── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days  < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}