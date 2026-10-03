/* LessonPrep Stage 6 — AI client (browser side).
   Rules: online only, never required, never auto-applies. Every suggestion
   returns as text the pages show in an amber box with Accept/Edit/Discard.
   Providers: "gemini" (via your free Worker proxy — key stays secret) or
   "ollama" (free, fully local: http://localhost:11434, model llama3.1). */
(function () {
  var KEY = "lp_ai_config";

  function getConfig() {
    try {
      return Object.assign({ provider: "gemini", endpoint: "" }, JSON.parse(localStorage.getItem(KEY)) || {});
    } catch (e) { return { provider: "gemini", endpoint: "" }; }
  }
  function saveConfig(c) { localStorage.setItem(KEY, JSON.stringify(c)); }
  function online() { return navigator.onLine; }
  function configured() {
    var c = getConfig();
    if (c.provider === "ollama") return !!(c.endpoint || "http://localhost:11434");
    return !!c.endpoint; // gemini needs the worker URL
  }

  async function generate(opts) {
    // opts: {mode quick|standard|deep, section|null, context, instruction}
    if (!online()) throw new Error("offline");
    var c = getConfig();
    if (!configured()) throw new Error("not-configured");
    var t0 = performance.now();

    if (c.provider === "ollama") {
      var base = (c.endpoint || "http://localhost:11434").replace(/\/$/, "");
      var prompt = "You are LessonPrep, a lesson-preparation assistant for Nigerian teachers. Use Nigerian examples and cheap local aids. " +
        "Class: " + (opts.context.className || "?") + ". Subject: " + (opts.context.subject || "?") + ". Topic: " + (opts.context.topic || "?") + ". " +
        (opts.instruction ? "Teacher instruction: " + opts.instruction + ". " : "") +
        (opts.section ? "Write ONLY the body text for lesson-note section '" + opts.section + "'. No heading." :
          "Write a full lesson note. Return ONLY blocks in the format: a line '## Section Title' followed by body text. Sections: Previous Knowledge, Aims & Objectives, Introduction, Teacher Activities, Student Activities, Teaching Methods, Teaching Aids, Teaching Content, Evaluation, Conclusion, Assignment, Summary.");
      var r = await fetch(base + "/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama3.1", prompt: prompt, stream: false })
      });
      if (!r.ok) throw new Error("ollama-http-" + r.status);
      var data = await r.json();
      return { text: data.response || "", ms: Math.round(performance.now() - t0) };
    }

    // gemini via proxy
    var r2 = await fetch(c.endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: opts.mode || "standard", section: opts.section || null, context: opts.context || {}, instruction: opts.instruction || "" })
    });
    var data2 = await r2.json().catch(function () { return {}; });
    if (!r2.ok || data2.error) throw new Error(data2.error || ("proxy-http-" + r2.status));
    return { text: data2.text || "", ms: Math.round(performance.now() - t0) };
  }

  // Parse "## Title\nbody" blocks from a full-lesson response.
  function parseSections(text) {
    var out = [], cur = null;
    text.split("\n").forEach(function (line) {
      var m = line.match(/^##\s+(.+)\s*$/);
      if (m) { cur = { title: m[1].trim(), body: "" }; out.push(cur); }
      else if (cur) cur.body += line + "\n";
    });
    out.forEach(function (s) { s.body = s.body.trim(); });
    return out.filter(function (s) { return s.body; });
  }
  function norm(t) { return t.toLowerCase().replace(/[^a-z ]/g, "").trim(); }

  window.AI = { getConfig: getConfig, saveConfig: saveConfig, online: online, configured: configured, generate: generate, parseSections: parseSections, norm: norm };
})();
