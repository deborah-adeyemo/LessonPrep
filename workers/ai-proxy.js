/* LessonPrep Stage 6 — Cloudflare Worker AI proxy (FREE tier).
 *
 * What it does: the browser NEVER holds your Google AI key. It POSTs to this
 * worker; the worker adds the secret key server-side and forwards to Gemini.
 *
 * Deploy (5 min, free, no card):
 *   1. dash.cloudflare.com → Workers & Pages → Create Worker (free plan).
 *   2. Paste this file as worker.js → Deploy.
 *   3. Worker → Settings → Variables → add secret GOOGLE_API_KEY
 *      (from aistudio.google.com → Get API key, free tier).
 *   4. Optional variable MODEL (default gemini-2.0-flash).
 *   5. Copy the worker URL into LessonPrep → Profile → AI settings.
 */
const SYSTEM = "You are LessonPrep, a lesson-preparation assistant for Nigerian primary/secondary teachers. " +
  "Use Nigerian examples and cheap, locally available teaching aids. " +
  "Never require a fixed number of objectives. Keep language plain and practical.";

function promptFor(mode, section, context, instruction) {
  const ctx = "Class: " + (context.className || "?") + ". Subject: " + (context.subject || "?") +
    ". Topic: " + (context.topic || "?") + ". Detail: " + (context.detail || "Standard") +
    ". Aids rule: " + (context.aids || "cheap/local only") + ".";
  const extra = instruction ? " Teacher instruction: " + instruction + "." : "";
  if (section) {
    const depth = mode === "deep" ? "Give a detailed version with an example and a common misconception." :
      mode === "quick" ? "Keep it to 2-3 sentences." : "Keep it practical and complete.";
    return SYSTEM + " " + ctx + extra + " Write ONLY the body text for the lesson-note section '" +
      section + "'. No heading, no commentary. " + depth;
  }
  const depth = mode === "deep" ? "Detailed content: examples, worked examples, misconceptions, alternative explanations, differentiated activities."
    : mode === "quick" ? "Essential sections only, concise (objectives, introduction, key content, one activity, evaluation)."
    : "A complete lesson note.";
  return SYSTEM + " " + ctx + extra + " Write a full lesson note. " + depth +
    " Return ONLY sections in this exact format, one per block: a line '## Section Title' followed by the body text. " +
    "Use these section titles where relevant: Previous Knowledge, Aims & Objectives, Introduction, Teacher Activities, " +
    "Student Activities, Teaching Methods, Teaching Aids, Teaching Content, Evaluation, Conclusion, Assignment, Summary.";
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return Response.json({ error: "POST only" }, { status: 405, headers: cors });
    if (!env.GOOGLE_API_KEY) return Response.json({ error: "Worker missing GOOGLE_API_KEY secret" }, { status: 500, headers: cors });

    let body;
    try { body = await request.json(); } catch (e) { return Response.json({ error: "Bad JSON" }, { status: 400, headers: cors }); }
    const prompt = promptFor(body.mode || "standard", body.section || null, body.context || {}, body.instruction || "");
    const model = env.MODEL || "gemini-2.0-flash";

    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GOOGLE_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!r.ok) {
      const t = await r.text();
      return Response.json({ error: "AI provider error " + r.status + ": " + t.slice(0, 200) }, { status: 502, headers: cors });
    }
    const data = await r.json();
    try {
      const text = data.candidates[0].content.parts.map(function (p) { return p.text || ""; }).join("");
      return Response.json({ text: text }, { headers: cors });
    } catch (e) {
      return Response.json({ error: "Unexpected AI response shape" }, { status: 502, headers: cors });
    }
  }
};
