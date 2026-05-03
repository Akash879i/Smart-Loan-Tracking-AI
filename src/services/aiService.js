// ─────────────────────────────────────────────────────────────
//  FALUMA — AI Service (FIXED VERSION)
// ─────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/responses";

// ─── Helper: call OpenAI API ───────────────────────────────────
async function callOpenAI({
  systemPrompt,
  userMessage,
  imageBase64 = null,
  imageType = "image/jpeg",
}) {
  if (!API_KEY) {
    throw new Error("Missing OpenAI API Key (VITE_OPENAI_API_KEY)");
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        max_output_tokens: 300,
        temperature: 0.2,

        // ✅ Correct JSON mode
        text: {
          format: { type: "json_object" },
        },

        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt,
              },
            ],
          },
          {
            role: "user",
            content: [
              ...(imageBase64
                ? [
                    {
                      type: "input_image",
                      image_url: `data:${imageType};base64,${imageBase64}`,
                    },
                  ]
                : []),
              {
                type: "input_text",
                text: userMessage,
              },
            ],
          },
        ],
      }),
    });

    // ── Handle API errors ──
    if (!response.ok) {
      let errMsg = "OpenAI request failed";
      try {
        const err = await response.json();
        console.error("OpenAI Error:", err);
        errMsg = err?.error?.message || JSON.stringify(err);
      } catch {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    console.log("OpenAI Raw:", data);

    // ── Extract output text (Responses API format) ──
    const text =
      data?.output?.[0]?.content?.find(c => c.type === "output_text")?.text ||
      "";

    if (!text) {
      throw new Error("Empty AI response");
    }

    const clean = text.replace(/```json|```/g, "").trim();

    try {
      return JSON.parse(clean);
    } catch (err) {
      console.warn("JSON parse failed:", clean);

      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }

      return {
        error: true,
        raw: clean,
      };
    }
  } catch (err) {
    console.error("callOpenAI failed:", err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
//  FEATURE 1 — Evidence Verification
//
//  Call this AFTER borrower uploads a photo in Documents.jsx
//  AI reads the loan purpose and checks if the photo matches
//
//  Returns:
//  {
//    verified: true/false,
//    score: 0–100,
//    reason: "string",
//    gpsMatch: true/false/null,
//    recommendation: "approve" | "request_more" | "flag"
//  }
// ─────────────────────────────────────────────────────────────
export async function verifyEvidence({
  loanType,
  loanPurpose,
  loanAmount,
  imageBase64,
  imageType = "image/jpeg",
  gpsLocation,
  loanAddress,
}) {
  const systemPrompt = `You are an AI loan evidence verifier for FALUMA (Framework for Automated Loan Utilization Tracking, Mobile Evidence, and AI).
Your job is to check whether the submitted photo evidence matches the declared loan purpose.
Always respond with ONLY a valid JSON object. No explanation, no markdown, no extra text outside the JSON.`;

  const gpsInfo = gpsLocation
    ? `Submitted GPS: lat ${gpsLocation.lat}, lng ${gpsLocation.lng}. Declared site: ${loanAddress || "not provided"}.`
    : "GPS was not submitted.";

  const userMessage = `
Loan Details:
- Type: ${loanType}
- Purpose: ${loanPurpose}
- Amount: ₹${loanAmount}
- ${gpsInfo}

The borrower submitted this photo as proof of fund utilization.
Analyze and respond ONLY with this JSON:
{
  "verified": true or false,
  "score": number 0-100,
  "reason": "one clear sentence explaining your decision",
  "gpsMatch": true or false or null,
  "recommendation": "approve" or "request_more" or "flag"
}`;

  return await callOpenAI({ systemPrompt, userMessage, imageBase64, imageType });
}

// ─────────────────────────────────────────────────────────────
//  FEATURE 2 — Fraud Detection
//
//  Call this after each new submission or on demand
//  AI looks for suspicious patterns across the whole loan
//
//  Returns:
//  {
//    fraudRisk: "low" | "medium" | "high",
//    score: 0–100,
//    flags: ["string", ...],
//    summary: "string"
//  }
// ─────────────────────────────────────────────────────────────
export async function detectFraud({ loan, submissions }) {
  const systemPrompt = `You are an AI fraud detection engine for FALUMA, a loan monitoring system.
Analyze loan and submission data for suspicious patterns.
Always respond with ONLY a valid JSON object. No extra text.`;

  const submissionSummary =
    submissions.length === 0
      ? "No submissions yet."
      : submissions
          .map(
            (s, i) =>
              `Submission ${i + 1}: at ${s.uploadedAt || "unknown"}, GPS: ${s.gpsVerified ? "yes" : "no"}, AI score: ${s.aiScore ?? "N/A"}`
          )
          .join("\n");

  const userMessage = `
Loan:
- Type: ${loan.type}
- Amount: ₹${loan.amount}
- Purpose: ${loan.purpose}
- Status: ${loan.status}
- Created: ${loan.createdAt || "unknown"}

Submissions (${submissions.length} total):
${submissionSummary}

Check for: rapid withdrawal, GPS mismatch, duplicate photos, consistently low AI scores, no submissions despite active loan, unusual timestamps.

Respond ONLY with this JSON:
{
  "fraudRisk": "low" or "medium" or "high",
  "score": number 0-100,
  "flags": ["specific issues found — empty array if none"],
  "summary": "one paragraph for the lender"
}`;

  return await callOpenAI({ systemPrompt, userMessage });
}

// ─────────────────────────────────────────────────────────────
//  FEATURE 3 — Compliance Report
//
//  Call when lender clicks "Generate Report" on a loan
//  AI produces a structured compliance summary
//
//  Returns:
//  {
//    overallStatus: "compliant" | "partial" | "non-compliant",
//    complianceScore: 0–100,
//    summary: "string",
//    positives: ["string", ...],
//    concerns: ["string", ...],
//    recommendation: "string"
//  }
// ─────────────────────────────────────────────────────────────
export async function generateComplianceReport({ loan, submissions, fraudResult }) {
  const systemPrompt = `You are a compliance reporting AI for FALUMA used by bank officers.
Generate a formal compliance report based on loan data.
Always respond with ONLY a valid JSON object. No extra text.`;

  const avgScore =
    submissions.length > 0
      ? Math.round(submissions.reduce((s, sub) => s + (sub.aiScore || 0), 0) / submissions.length)
      : null;

  const userMessage = `
Loan:
- Type: ${loan.type}, Purpose: ${loan.purpose}
- Amount: ₹${loan.amount}, Duration: ${loan.duration}
- Status: ${loan.status}, Created: ${loan.createdAt || "unknown"}

Evidence: ${submissions.length} submissions, avg AI score: ${avgScore ?? "N/A"}, GPS verified: ${submissions.filter((s) => s.gpsVerified).length}

Fraud: risk=${fraudResult?.fraudRisk || "N/A"}, flags=${fraudResult?.flags?.join(", ") || "none"}

Respond ONLY with this JSON:
{
  "overallStatus": "compliant" or "partial" or "non-compliant",
  "complianceScore": number 0-100,
  "summary": "2-3 sentence professional summary",
  "positives": ["things borrower did correctly"],
  "concerns": ["things needing attention — empty if none"],
  "recommendation": "one clear action for the lender"
}`;

  return await callOpenAI({ systemPrompt, userMessage });
}

// ─────────────────────────────────────────────────────────────
//  UTILITY — Convert a file input to base64
//  Use this in Documents.jsx before calling verifyEvidence()
//
//  Usage:
//    const base64 = await fileToBase64(file);
//    const result = await verifyEvidence({ ..., imageBase64: base64 });
// ─────────────────────────────────────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}