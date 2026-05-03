import { useState, useEffect } from "react";
import { Upload, Eye, Trash2, FileImage, MapPin, Brain, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useFirebase } from "../Auth/firebase";
import { verifyEvidence, fileToBase64 } from "../services/aiService";
import { computeLoanStatus } from "./loanStatus";

export default function Documents() {
  const firebase = useFirebase();

  const [files, setFiles]         = useState([]);
  const [loans, setLoans]         = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gpsLocation, setGpsLocation]   = useState(null);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [aiLoadingId, setAiLoadingId]   = useState(null); // which doc is being AI-checked

  const CLOUD_NAME    = import.meta.env.VITE_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

  // ── Fetch documents + loans on mount ──────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      const [docs, loanData] = await Promise.all([
        firebase.getUserDocuments(),
        firebase.getUserLoans(),
      ]);
      setFiles(docs || []);
      setLoans(loanData || []);

      // Auto-select the first active/pending loan
      const active = (loanData || []).find(
        (l) => l.status === "pending" || l.status === "active"
      );
      if (active) setSelectedLoan(active);
    };
    fetchAll();
  }, []);

  // ── Get GPS from browser ──────────────────────────────────────
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        });
        setGpsLoading(false);
      },
      (err) => {
        console.error("GPS error:", err);
        alert("Could not get GPS location. Please allow location access.");
        setGpsLoading(false);
      }
    );
  };

  // ── Upload + AI verify ────────────────────────────────────────
  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter(
      (f) =>
        (f.type === "image/jpeg" || f.type === "image/png") &&
        f.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      alert("Only JPG/PNG under 5MB allowed.");
      return;
    }

    if (!selectedLoan) {
      alert("Please select a loan first so AI knows what to verify against.");
      return;
    }

    setUploading(true);

    for (let file of validFiles) {
      try {
        // ── Step 1: Upload to Cloudinary ──
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res  = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();

        if (!data.secure_url) {
          console.error("Cloudinary error:", data);
          alert("Upload failed. Check Cloudinary config.");
          continue;
        }

        // ── Step 2: Convert to base64 for AI ──
        const base64    = await fileToBase64(file);

        // ── Step 3: Call AI verification ──
        let aiResult = null;
        try {
          aiResult = await verifyEvidence({
            loanType:    selectedLoan.type,
            loanPurpose: selectedLoan.purpose,
            loanAmount:  selectedLoan.amount,
            imageBase64: base64,
            imageType:   file.type,
            gpsLocation: gpsLocation,
            loanAddress: selectedLoan.address || null,
          });
        } catch (aiErr) {
          console.error("AI verification failed:", aiErr);
          // Don't block upload if AI fails — save with pending status
        }

        // ── Step 4: Save to Firestore ──
        const docData = {
          name:           file.name,
          url:            data.secure_url,
          type:           file.type,
          date:           new Date().toISOString().split("T")[0],
          uploadedAt:     new Date().toISOString(),
          loanId:         selectedLoan.id,
          loanType:       selectedLoan.type,
          gpsVerified:    gpsLocation !== null,
          gpsLocation:    gpsLocation || null,

          // AI result fields
          aiVerified:     aiResult?.verified     ?? null,
          aiScore:        aiResult?.score        ?? null,
          aiReason:       aiResult?.reason       ?? null,
          aiRecommendation: aiResult?.recommendation ?? null,
          status:         aiResult
            ? (aiResult.verified ? "verified" : "flagged")
            : "pending",
        };

        const docRef = await firebase.addDocument(docData);

// ── After saving doc, update the parent loan status ──────────
if (aiResult) {
  const allDocs = await firebase.getUserDocuments();
  const loanDocs = allDocs.filter((d) => d.loanId === selectedLoan.id);

  const result = computeLoanStatus({
    documents: loanDocs,
    latestAI: aiResult,
  });

  await firebase.updateLoan(selectedLoan.id, result);
}

        setFiles((prev) => [{ id: docRef.id, ...docData }, ...prev]);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Something went wrong uploading " + file.name);
      }
    }

    setUploading(false);
  };

  // ── Re-run AI on an existing doc ─────────────────────────────
  const handleReVerify = async (doc) => {
    if (!selectedLoan) {
      alert("Please select a loan first.");
      return;
    }
    setAiLoadingId(doc.id);
    try {
      // Fetch image from URL and convert to base64
      const imgRes  = await fetch(doc.url);
      const blob    = await imgRes.blob();
      const base64  = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });

      const aiResult = await verifyEvidence({
        loanType:    selectedLoan.type,
        loanPurpose: selectedLoan.purpose,
        loanAmount:  selectedLoan.amount,
        imageBase64: base64,
        imageType:   doc.type || "image/jpeg",
        gpsLocation: doc.gpsLocation || null,
        loanAddress: selectedLoan.address || null,
      });

      const updates = {
        aiVerified:       aiResult.verified,
        aiScore:          aiResult.score,
        aiReason:         aiResult.reason,
        aiRecommendation: aiResult.recommendation,
        status: aiResult.verified ? "verified" : "flagged",
      };

      await firebase.updateDocument(doc.id, updates);

      const allDocs = await firebase.getUserDocuments();
const loanDocs = allDocs.filter((d) => d.loanId === selectedLoan.id);

const result = computeLoanStatus({
  documents: loanDocs,
});

await firebase.updateLoan(selectedLoan.id, result);

      setFiles((prev) =>
        prev.map((f) => (f.id === doc.id ? { ...f, ...updates } : f))
      );
    } catch (err) {
      console.error("Re-verify failed:", err);
      alert("AI re-verification failed. Try again.");
    } finally {
      setAiLoadingId(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await firebase.deleteDocument(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const statusConfig = {
    verified: { color: "bg-green-100 text-green-700", icon: <CheckCircle size={12} />, label: "AI Verified" },
    flagged:  { color: "bg-red-100 text-red-700",     icon: <AlertTriangle size={12} />, label: "Flagged" },
    pending:  { color: "bg-yellow-100 text-yellow-700", icon: <Clock size={12} />, label: "Pending AI" },
  };

  const getStatus = (s) => statusConfig[s] || statusConfig.pending;

  const verifiedCount = files.filter((f) => f.status === "verified").length;
  const flaggedCount  = files.filter((f) => f.status === "flagged").length;
  const pendingCount  = files.filter((f) => f.status === "pending").length;

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Document Upload</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload evidence photos — AI automatically verifies them against your loan purpose
        </p>
      </div>

      {/* SUMMARY STRIP */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-600">{verifiedCount}</p>
            <p className="text-xs text-green-500 mt-0.5">AI Verified</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-600">{flaggedCount}</p>
            <p className="text-xs text-red-500 mt-0.5">Flagged</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-yellow-500 mt-0.5">Pending</p>
          </div>
        </div>
      )}

      {/* LOAN SELECTOR */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Which loan is this evidence for? <span className="text-red-500">*</span>
        </p>
        {loans.length === 0 ? (
          <p className="text-sm text-gray-400">
            No active loans found. Create a loan application first.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            {loans.map((loan) => (
              <button
                key={loan.id}
                onClick={() => setSelectedLoan(loan)}
                className={`flex-1 text-left px-4 py-3 rounded-xl border text-sm transition ${
                  selectedLoan?.id === loan.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-800">{loan.type}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{loan.purpose}</p>
                <p className="text-xs text-gray-400">₹{Number(loan.amount).toLocaleString("en-IN")}</p>
              </button>
            ))}
          </div>
        )}
        {selectedLoan && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <p className="text-xs text-blue-700">
              <span className="font-medium">AI will check:</span> Does the uploaded photo match "{selectedLoan.purpose}"?
            </p>
          </div>
        )}
      </div>

      {/* GPS CAPTURE */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">GPS Location proof</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Captures your current location to verify photos were taken at the loan site
            </p>
          </div>
          <button
            onClick={handleGetGPS}
            disabled={gpsLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${
              gpsLocation
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <MapPin size={14} />
            {gpsLoading
              ? "Getting GPS..."
              : gpsLocation
              ? `${gpsLocation.lat}, ${gpsLocation.lng}`
              : "Capture GPS"}
          </button>
        </div>
        {gpsLocation && (
          <p className="text-xs text-green-600 mt-2">
            ✓ GPS captured — will be submitted with your next upload
          </p>
        )}
      </div>

      {/* UPLOAD BOX */}
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center bg-white shadow-sm mb-8">
        <Upload size={44} className="mx-auto text-gray-400 mb-3" />
        <h2 className="text-lg font-semibold mb-1">Upload Evidence Photos</h2>
        <p className="text-gray-400 text-sm mb-2">JPG & PNG only · Max 5MB per file</p>
        <p className="text-xs text-blue-600 mb-5">
          AI will automatically verify each photo against your selected loan purpose
        </p>

        <label
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer transition font-medium text-sm ${
            uploading || !selectedLoan
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading & Verifying...
            </>
          ) : (
            <>
              <Upload size={16} />
              {selectedLoan ? "Choose Files" : "Select a loan first"}
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg"
            onChange={handleUpload}
            disabled={uploading || !selectedLoan}
            className="hidden"
          />
        </label>
      </div>

      {/* DOCUMENT LIST */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-base font-semibold mb-5">Uploaded Documents</h3>

        {files.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📂</p>
            <p className="text-gray-400 text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => {
              const s          = getStatus(file.status);
              const isChecking = aiLoadingId === file.id;

              return (
                <div key={file.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">

                  {/* TOP ROW */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                        <FileImage className="text-green-600" size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-800 leading-tight">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{file.date}</p>
                        {file.loanType && (
                          <p className="text-xs text-blue-500 mt-0.5">Loan: {file.loanType}</p>
                        )}
                      </div>
                    </div>

                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${s.color}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>

                  {/* IMAGE PREVIEW */}
                  {/* <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-40 object-cover rounded-xl mb-3"
                  /> */}

                  {/* AI RESULT PANEL */}
                  {file.aiScore !== null && file.aiScore !== undefined ? (
                    <div className={`rounded-xl p-3 mb-3 ${
                      file.aiVerified ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Brain size={13} className={file.aiVerified ? "text-green-600" : "text-red-600"} />
                          <span className={`text-xs font-semibold ${file.aiVerified ? "text-green-700" : "text-red-700"}`}>
                            AI Compliance Score: {file.aiScore}/100
                          </span>
                        </div>
                        {/* Score bar */}
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full ml-2">
                          <div
                            className={`h-1.5 rounded-full ${file.aiScore >= 70 ? "bg-green-500" : file.aiScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${file.aiScore}%` }}
                          />
                        </div>
                      </div>

                      {file.aiReason && (
                        <p className={`text-xs leading-relaxed ${file.aiVerified ? "text-green-700" : "text-red-700"}`}>
                          {file.aiReason}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        {file.gpsVerified && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MapPin size={10} /> GPS ✓
                          </span>
                        )}
                        {file.aiRecommendation && (
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                            file.aiRecommendation === "approve"
                              ? "bg-green-100 text-green-700"
                              : file.aiRecommendation === "flag"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            Recommendation: {file.aiRecommendation.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2 mb-3">
                      <p className="text-xs text-yellow-700">⏳ AI verification pending</p>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition text-xs font-medium"
                    >
                      <Eye size={13} /> View
                    </a>

                    <button
                      onClick={() => handleReVerify(file)}
                      disabled={isChecking}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition text-xs font-medium disabled:opacity-50"
                    >
                      {isChecking ? (
                        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Brain size={13} />
                      )}
                      {isChecking ? "Checking..." : "Re-verify"}
                    </button>

                    <button
                      onClick={() => handleDelete(file.id)}
                      className="px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}