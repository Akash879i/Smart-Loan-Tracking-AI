import { useEffect, useState } from "react";
import { computeLoanStatus } from "./loanStatus";
import { useFirebase } from "../Auth/firebase";

export default function LoanApplications() {
  const firebase = useFirebase();

  const [loans, setLoans]           = useState([]);
  const [documents, setDocuments]   = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const [form, setForm] = useState({
    type: "", amount: "", purpose: "", duration: "", status: "pending",
  });

  useEffect(() => {
  if (!loans.length) return;

  const updateStatuses = async () => {
    for (const loan of loans) {
      const loanDocs = documents.filter(d => d.loanId === loan.id);

      const result = computeLoanStatus({
        documents: loanDocs,
      });

      if (result.status !== loan.status) {
        await firebase.updateLoan(loan.id, result);
      }
    }
  };

  updateStatuses();
}, [documents, loans]);

  // ── Fetch loans AND documents ────────────────────────────────
  // We need documents to compute utilisation + compliance per loan.
  //   Utilisation  = verified docs ÷ total docs × 100
  //   Compliance   = average aiScore of all docs for that loan
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [loanData, docData] = await Promise.all([
        firebase.getUserLoans(),
        firebase.getUserDocuments(),
      ]);
      setLoans(loanData || []);
      setDocuments(docData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Per-loan computed values ─────────────────────────────────

  // Utilisation: how many docs are AI-verified out of total docs uploaded
  const getUtilisation = (loanId) => {
    const loanDocs    = documents.filter((d) => d.loanId === loanId);
    if (!loanDocs.length) return 0;
    const verified    = loanDocs.filter((d) => d.status === "verified" || d.aiVerified === true);
    return Math.round((verified.length / loanDocs.length) * 100);
  };

  // Compliance: average of all aiScore values on docs for this loan
  const getCompliance = (loanId) => {
    const scored = documents.filter((d) => d.loanId === loanId && d.aiScore != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, d) => s + d.aiScore, 0) / scored.length);
  };

  const getDocCount = (loanId) => documents.filter((d) => d.loanId === loanId).length;
  const getGpsCount = (loanId) => documents.filter((d) => d.loanId === loanId && d.gpsVerified).length;
  const getVerifiedCount = (loanId) =>
    documents.filter((d) => d.loanId === loanId && (d.status === "verified" || d.aiVerified)).length;
  const getScoredCount = (loanId) =>
    documents.filter((d) => d.loanId === loanId && d.aiScore != null).length;

  // ── Limit check ──────────────────────────────────────────────
  const handleNewApplication = () => {
    const hasActive = loans.some((l) =>
      ["pending", "active", "under review"].includes(l.status)
    );
    if (hasActive) {
      setBlockReason(
        "You already have an active or pending loan application. You can only apply for a new loan after your current application is closed or repaid."
      );
      setShowModal(true);
      return;
    }
    setBlockReason("");
    setShowModal(true);
  };

  const handleChange  = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.type || !form.amount || !form.purpose || !form.duration) {
      alert("Please fill all required fields"); return;
    }
    if (Number(form.amount) <= 0) { alert("Amount must be > 0"); return; }
    setSubmitting(true);
    try {
      await firebase.addLoan({
        ...form,
        amount:      Number(form.amount),
        createdAt:   new Date().toISOString(),
        aiVerified:  false,
        gpsVerified: false,
        fraudFlag:   false,
        utilization: 0,
      });
      setShowModal(false);
      setForm({ type: "", amount: "", purpose: "", duration: "", status: "pending" });
      fetchAll();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setBlockReason("");
    setForm({ type: "", amount: "", purpose: "", duration: "", status: "pending" });
  };

  // ── Status config ────────────────────────────────────────────
  const statusConfig = {
    pending:        { badge: "bg-yellow-100 text-yellow-700",  label: "Pending" },
    active:         { badge: "bg-blue-100 text-blue-700",      label: "Active" },
    "under review": { badge: "bg-purple-100 text-purple-700",  label: "Under Review" },
    approved:       { badge: "bg-green-100 text-green-700",    label: "Approved" },
    rejected:       { badge: "bg-red-100 text-red-700",        label: "Rejected" },
    closed:         { badge: "bg-gray-100 text-gray-600",      label: "Closed" },
  };
  const getStatus = (s) => statusConfig[s] || { badge: "bg-gray-100 text-gray-600", label: s };

  // ── Compliance colour ────────────────────────────────────────
  const compColor = (score) => {
    if (score === null)  return { text: "text-gray-400", bar: "bg-gray-200", ring: "bg-gray-100", label: "No data yet" };
    if (score >= 75)     return { text: "text-green-600", bar: "bg-green-500", ring: "bg-green-50", label: "Good" };
    if (score >= 45)     return { text: "text-yellow-600", bar: "bg-yellow-500", ring: "bg-yellow-50", label: "Fair" };
    return                      { text: "text-red-600", bar: "bg-red-500", ring: "bg-red-50", label: "Low" };
  };

  // ── Utilisation colour ───────────────────────────────────────
  const utilColor = (pct) => {
    if (pct >= 75) return "bg-green-500";
    if (pct >= 40) return "bg-blue-500";
    if (pct > 0)   return "bg-yellow-500";
    return "bg-gray-200";
  };

  const activeCount   = loans.filter((l) => ["pending", "active", "under review"].includes(l.status)).length;
  const approvedCount = loans.filter((l) => l.status === "approved").length;

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Loan Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loans.length === 0
              ? "No applications yet"
              : `${loans.length} application${loans.length > 1 ? "s" : ""} · ${activeCount} active`}
          </p>
        </div>
        <button onClick={handleNewApplication}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition text-sm font-medium w-full sm:w-auto">
          + New Application
        </button>
      </div>

      {/* SUMMARY STRIP */}
      {loans.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-800">{loans.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-600">{activeCount}</p>
            <p className="text-xs text-yellow-500 mt-0.5">Active / Pending</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-green-500 mt-0.5">Approved</p>
          </div>
        </div>
      )}

      {/* LOAN LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-700 mb-1">No loan applications yet</p>
          <p className="text-gray-400 text-sm mb-5">Create your first application to get started</p>
          <button onClick={handleNewApplication}
            className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-green-700 transition">
            Create Application
          </button>
        </div>
      ) : (
        
        <div className="space-y-5">

          
          {loans.map((loan) => {
            // 🔥 AUTO STATUS UPDATE LOGIC

            const s          = getStatus(loan.status);
            const utilPct    = getUtilisation(loan.id);
            const compliance = getCompliance(loan.id);
            const cc         = compColor(compliance);
            const docCount   = getDocCount(loan.id);
            const gpsCount   = getGpsCount(loan.id);
            const verCount   = getVerifiedCount(loan.id);
            const scoredCount = getScoredCount(loan.id);
            

          
            return (
              <div key={loan.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition">

                {/* TOP ROW */}
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h2 className="font-semibold text-base">{loan.type}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {loan.createdAt
                        ? new Date(loan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Date unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {loan.fraudFlag && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚨 Fraud flagged</span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.badge}`}>{s.label}</span>
                  </div>
                </div>

                {/* AMOUNT + PURPOSE */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-4">
                  <p className="text-lg font-bold text-gray-800">₹{Number(loan.amount).toLocaleString("en-IN")}</p>
                  <p className="text-sm text-gray-500 leading-snug">{loan.purpose}</p>
                </div>

                {/* ─── DYNAMIC UTILISATION BAR ──────────────────────────
                    Source: verified docs ÷ total docs for this loan × 100
                    Color:  green ≥75%, blue ≥40%, yellow >0%, gray = 0%
                    Text:   "X of Y documents verified"
                ──────────────────────────────────────────────────────── */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-gray-500">Fund Utilisation</span>
                    <span className="text-xs font-bold text-gray-700">{utilPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${utilColor(utilPct)}`}
                      style={{ width: `${utilPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {docCount === 0
                      ? "📎 Upload evidence documents to start tracking utilisation"
                      : `${verCount} of ${docCount} document${docCount !== 1 ? "s" : ""} AI-verified`}
                  </p>
                </div>

                {/* ─── DYNAMIC COMPLIANCE SCORE ─────────────────────────
                    Source: average of aiScore on all docs for this loan
                    Range:  0–100 (null if no docs with AI score yet)
                    Color:  green ≥75 (Good), yellow ≥45 (Fair), red <45 (Low)
                    Text:   "Based on AI analysis of X documents"
                ──────────────────────────────────────────────────────── */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-gray-500">AI Compliance Score</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cc.ring} ${cc.text}`}>
                        {cc.label}
                      </span>
                      <span className={`text-xs font-bold ${cc.text}`}>
                        {compliance !== null ? `${compliance}/100` : "–"}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${cc.bar}`}
                      style={{ width: compliance !== null ? `${compliance}%` : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {compliance === null
                      ? "🤖 Score appears after AI verifies your first document"
                      : `Based on AI analysis of ${scoredCount} document${scoredCount !== 1 ? "s" : ""}`}
                  </p>
                </div>

                {/* FOOTER META */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 border-t border-gray-50 pt-3">
                  <span>Duration: {loan.duration || "N/A"}</span>

                  {gpsCount > 0 && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        📍 {gpsCount} GPS verified
                      </span>
                    </>
                  )}

                  <span className="ml-auto">
                    {loan.fraudResult ? (
                      <span className={`font-medium ${
                        loan.fraudResult.fraudRisk === "low"    ? "text-green-600"
                        : loan.fraudResult.fraudRisk === "medium" ? "text-yellow-600"
                        : "text-red-600"
                      }`}>
                        Fraud risk: {loan.fraudResult.fraudRisk}
                      </span>
                    ) : compliance !== null ? (
                      <span className="text-green-600 font-medium">✓ AI reviewed</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">⏳ Awaiting AI review</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6">

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold">
                {blockReason ? "Application blocked" : "New Loan Application"}
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {blockReason ? (
              /* BLOCKED */
              <div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-medium text-yellow-800 mb-1">You already have an active loan</p>
                  <p className="text-sm text-yellow-700">{blockReason}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs text-gray-500 font-medium mb-2">Your active applications</p>
                  {loans.filter((l) => ["pending","active","under review"].includes(l.status)).map((l) => (
                    <div key={l.id} className="flex justify-between items-center py-1.5">
                      <span className="text-sm text-gray-700">{l.type}</span>
                      <span className="text-xs text-gray-400">₹{Number(l.amount).toLocaleString("en-IN")} · {l.status}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mb-5">
                  To apply for a new loan, wait until your current application is approved, rejected, or fully repaid.
                </p>
                <button onClick={handleClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm transition">
                  OK, got it
                </button>
              </div>

            ) : (
              /* FORM */
              <>
                <div className="space-y-4">

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Loan type <span className="text-red-500">*</span>
                    </label>
                    <select name="type" value={form.type} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-500">
                      <option value="">Select loan type</option>
                      <option>Personal Loan</option>
                      <option>Business Loan</option>
                      <option>Home Loan</option>
                      <option>Education Loan</option>
                      <option>Agricultural Loan</option>
                      <option>Vehicle Loan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Loan amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input type="number" name="amount" value={form.amount} onChange={handleChange}
                      placeholder="e.g. 50000" min="1"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-500" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea name="purpose" value={form.purpose} onChange={handleChange} rows={3}
                      placeholder="e.g. 'To purchase construction materials and build a grocery shop in Delhi'"
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-500 resize-none" />
                    <p className="text-xs text-gray-400 mt-1">
                      The AI uses this description to verify your uploaded evidence later.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Repayment duration <span className="text-red-500">*</span>
                    </label>
                    <select name="duration" value={form.duration} onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-green-500">
                      <option value="">Select duration</option>
                      <option>3 months</option>
                      <option>6 months</option>
                      <option>12 months</option>
                      <option>24 months</option>
                      <option>36 months</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-700 font-medium mb-0.5">What happens next?</p>
                    <p className="text-xs text-blue-600">
                      After submitting, upload photos + GPS proof as evidence. The AI verifies each upload and automatically updates your utilisation and compliance scores.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button onClick={handleClose}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition w-full sm:w-auto">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-green-700 transition disabled:opacity-60 w-full sm:w-auto font-medium">
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}