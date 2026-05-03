import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Clock, Brain, MapPin, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useFirebase } from "../Auth/firebase";
import { detectFraud } from "../services/aiService";

export default function FraudDetection() {
  const firebase = useFirebase();

  const [loans, setLoans]             = useState([]);
  const [documents, setDocuments]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [analyzingId, setAnalyzingId] = useState(null); // loan id being analyzed
  const [expandedId, setExpandedId]   = useState(null); // loan id expanded in list
  const [fraudResults, setFraudResults] = useState({});  // { loanId: aiResult }

  // ── Fetch all loans + documents ───────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loanData, docData] = await Promise.all([
          firebase.getUserLoans(),
          firebase.getUserDocuments(),
        ]);
        setLoans(loanData   || []);
        setDocuments(docData || []);

        // Load any saved fraud results from Firestore
        const savedResults = {};
        (loanData || []).forEach((loan) => {
          if (loan.fraudResult) {
            savedResults[loan.id] = loan.fraudResult;
          }
        });
        setFraudResults(savedResults);
      } catch (err) {
        console.error("Fraud fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Run AI fraud detection on a specific loan ─────────────────
  const handleAnalyze = async (loan) => {
    setAnalyzingId(loan.id);
    try {
      // Get all documents belonging to this loan
      const loanDocs = documents.filter((d) => d.loanId === loan.id);

      const submissions = loanDocs.map((d) => ({
        uploadedAt:  d.uploadedAt  || d.date,
        gpsVerified: d.gpsVerified || false,
        aiScore:     d.aiScore     ?? null,
      }));

      const result = await detectFraud({ loan, submissions });

      // Save result to state
      setFraudResults((prev) => ({ ...prev, [loan.id]: result }));

      // Also persist to Firestore on the loan doc
      await firebase.updateLoan?.(loan.id, {
        fraudResult: result,
        fraudFlag:   result.fraudRisk === "high",
      });

      // Update local loan list too
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loan.id
            ? { ...l, fraudResult: result, fraudFlag: result.fraudRisk === "high" }
            : l
        )
      );

      setExpandedId(loan.id); // auto-expand result
    } catch (err) {
      console.error("Fraud analysis error:", err);
      alert("AI analysis failed. Please try again.");
    } finally {
      setAnalyzingId(null);
    }
  };

  // ── Derived counts from real AI results ──────────────────────
  const highCount   = Object.values(fraudResults).filter((r) => r.fraudRisk === "high").length;
  const mediumCount = Object.values(fraudResults).filter((r) => r.fraudRisk === "medium").length;
  const lowCount    = Object.values(fraudResults).filter((r) => r.fraudRisk === "low").length;
  const totalDocs   = documents.length;
  const gpsVerified = documents.filter((d) => d.gpsVerified).length;
  const flaggedDocs = documents.filter((d) => d.status === "flagged").length;

  // ── Styling helpers ───────────────────────────────────────────
  const riskStyle = {
    high:   { badge: "bg-red-100 text-red-700",      bar: "bg-red-500",    border: "border-red-200",   bg: "bg-red-50",    icon: "text-red-500",    label: "High Risk" },
    medium: { badge: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-500", border: "border-yellow-200", bg: "bg-yellow-50", icon: "text-yellow-500", label: "Medium Risk" },
    low:    { badge: "bg-green-100 text-green-700",   bar: "bg-green-500",  border: "border-green-200",  bg: "bg-green-50",  icon: "text-green-500",  label: "Low Risk" },
  };

  const getRisk = (r) => riskStyle[r] || riskStyle.low;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1">Fraud Detection</h2>
        <p className="text-gray-500 text-sm">
          AI analyzes your loan submissions for suspicious patterns. Click "Run AI Analysis" on any loan.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-red-600">{highCount}</p>
          <p className="text-red-500 text-xs mt-1">High risk loans</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-yellow-600">{mediumCount}</p>
          <p className="text-yellow-500 text-xs mt-1">Medium risk</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-green-600">{lowCount}</p>
          <p className="text-green-500 text-xs mt-1">Low / Clear</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-3xl font-bold text-blue-600">{gpsVerified}/{totalDocs}</p>
          <p className="text-blue-500 text-xs mt-1">GPS verified docs</p>
        </div>
      </div>

      {/* DOCUMENT HEALTH STRIP */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
        <p className="text-sm font-semibold mb-3">Evidence Health Overview</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-green-600">
              {documents.filter((d) => d.status === "verified").length}
            </p>
            <p className="text-xs text-gray-400">AI Verified</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{flaggedDocs}</p>
            <p className="text-xs text-gray-400">Flagged</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-600">
              {documents.filter((d) => d.status === "pending").length}
            </p>
            <p className="text-xs text-gray-400">Pending AI</p>
          </div>
        </div>

        {totalDocs > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Overall evidence quality</span>
              <span>
                {Math.round(
                  (documents.filter((d) => d.status === "verified").length / totalDocs) * 100
                )}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full flex overflow-hidden">
              <div
                className="h-2 bg-green-500"
                style={{
                  width: `${(documents.filter((d) => d.status === "verified").length / totalDocs) * 100}%`,
                }}
              />
              <div
                className="h-2 bg-red-400"
                style={{ width: `${(flaggedDocs / totalDocs) * 100}%` }}
              />
              <div
                className="h-2 bg-yellow-400"
                style={{
                  width: `${(documents.filter((d) => d.status === "pending").length / totalDocs) * 100}%`,
                }}
              />
            </div>
            <div className="flex gap-4 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Verified</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Flagged</span>
              <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Pending</span>
            </div>
          </div>
        )}
      </div>

      {/* LOAN FRAUD ANALYSIS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Loan-wise Fraud Analysis</h3>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Brain size={11} /> Powered by AI
          </span>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🛡️</p>
            <p className="text-gray-500 text-sm">No loan applications found</p>
            <p className="text-gray-400 text-xs mt-1">Create a loan application to start fraud monitoring</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {loans.map((loan) => {
              const result     = fraudResults[loan.id];
              const loanDocs   = documents.filter((d) => d.loanId === loan.id);
              const isAnalyzing = analyzingId === loan.id;
              const isExpanded  = expandedId  === loan.id;
              const risk        = result ? getRisk(result.fraudRisk) : null;

              return (
                <div key={loan.id} className="p-5">
                  {/* LOAN ROW */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-sm text-gray-800">{loan.type}</h4>
                        {result && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.badge}`}>
                            {risk.label}
                          </span>
                        )}
                        {loan.fraudFlag && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={10} /> Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{loan.purpose}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">₹{Number(loan.amount).toLocaleString("en-IN")}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{loanDocs.length} document{loanDocs.length !== 1 ? "s" : ""}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-500 capitalize">{loan.status}</span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {result && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                      <button
                        onClick={() => handleAnalyze(loan)}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          isAnalyzing
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : result
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                          </>
                        ) : result ? (
                          <>
                            <RefreshCw size={11} /> Re-analyze
                          </>
                        ) : (
                          <>
                            <Brain size={11} /> Run AI Analysis
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Fraud score bar (if result exists) */}
                  {result && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Fraud risk score</span>
                        <span className={`font-semibold ${risk.icon}`}>{result.score}/100</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div
                          className={`h-1.5 rounded-full transition-all ${risk.bar}`}
                          style={{ width: `${result.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Document mini-row */}
                  {loanDocs.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {loanDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                            doc.status === "verified"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : doc.status === "flagged"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-yellow-50 text-yellow-600 border-yellow-100"
                          }`}
                        >
                          {doc.status === "verified" ? (
                            <CheckCircle size={9} />
                          ) : doc.status === "flagged" ? (
                            <AlertTriangle size={9} />
                          ) : (
                            <Clock size={9} />
                          )}
                          {doc.name?.length > 15 ? doc.name.slice(0, 15) + "…" : doc.name}
                          {doc.gpsVerified && <MapPin size={9} className="text-blue-500 ml-0.5" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* EXPANDED AI RESULT */}
                  {result && isExpanded && (
                    <div className={`mt-4 rounded-xl border p-4 ${risk.border} ${risk.bg}`}>
                      {/* Summary */}
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Brain size={12} /> AI Analysis Summary
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">{result.summary}</p>

                      {/* Flags */}
                      {result.flags?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                            <AlertTriangle size={11} /> Issues detected
                          </p>
                          <ul className="space-y-1">
                            {result.flags.map((flag, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                                <span className="mt-0.5 flex-shrink-0">•</span>
                                {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.flags?.length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-green-700 mb-3">
                          <CheckCircle size={12} /> No suspicious patterns detected
                        </div>
                      )}

                      {/* GPS summary */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={11} />
                          {loanDocs.filter((d) => d.gpsVerified).length}/{loanDocs.length} docs GPS verified
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">
                          Avg AI score:{" "}
                          {loanDocs.length > 0
                            ? Math.round(
                                loanDocs.reduce((s, d) => s + (d.aiScore || 0), 0) / loanDocs.length
                              )
                            : "N/A"}
                          /100
                        </span>
                      </div>
                    </div>
                  )}

                  {/* No docs warning */}
                  {loanDocs.length === 0 && !result && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                      <p className="text-xs text-yellow-700">
                        ⚠️ No evidence uploaded for this loan yet. Upload documents first, then run analysis.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HOW IT WORKS INFO */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Shield size={14} /> How fraud detection works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: "1", title: "AI reads your loan", desc: "It learns your loan type, purpose, and amount as the baseline." },
            { step: "2", title: "Checks all evidence", desc: "Analyzes GPS data, AI scores, upload timing, and document patterns." },
            { step: "3", title: "Gives a risk score", desc: "Returns low / medium / high risk with specific flags and a summary." },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-800">{s.title}</p>
                <p className="text-xs text-blue-600 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}