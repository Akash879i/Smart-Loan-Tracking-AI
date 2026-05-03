export function computeLoanStatus({ documents = [], latestAI = null }) {
  const totalDocs     = documents.length;
  const verifiedCount = documents.filter(d => d.status === "verified").length;
  const flaggedCount  = documents.filter(d => d.status === "flagged").length;

  // Include latest AI result (for real-time updates)
  if (latestAI) {
    if (latestAI.verified) verifiedCount++;
    else flaggedCount++;
  }

  let status = "pending";
  let fraudFlag = false;
  let aiVerified = false;

  // 🚨 Fraud detection (highest priority)
  if (flaggedCount >= 1 && latestAI?.recommendation === "flag") {
    status = "flagged";
    fraudFlag = true;
  }

  // ⚠️ Not enough data
  else if (totalDocs < 2) {
    status = "pending";
  }

  // 🟡 Medium confidence
  else if (verifiedCount >= 2) {
    status = "under review";
    aiVerified = true;
  }

  // 🟢 High confidence
  if (verifiedCount >= 3 && flaggedCount === 0) {
    status = "approved";
    aiVerified = true;
  }

  // 🔴 Poor quality evidence
  if (totalDocs >= 2 && verifiedCount === 0) {
    status = "rejected";
  }

  return {
    status,
    fraudFlag,
    aiVerified,
  };
}