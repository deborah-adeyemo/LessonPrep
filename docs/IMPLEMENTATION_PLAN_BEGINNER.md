# LessonPrep — Beginner-Friendly Build Plan (Web-First)

**For:** someone building their first real app.
**Companion docs:** `docs/Lesson-Prep.md` (the full 80-section product description), `docs/IMPLEMENTATION_PLAN.md` (the advanced Flutter plan — kept unchanged, read it later when you are ready).
**Idea of this plan:** build LessonPrep as a **website that works like an app** (installable, works offline, prints nicely). One language to learn (JavaScript), everything free, no app-store complexity.

What you will end with: 5 simple pages (Home / Create / My Lessons / My Resources / Profile), a lesson editor with the Nigerian 18-section format, saved lessons, templates, schemes, question bank, reflections, timetable, search, PDF/print, and optional AI help. Private to the teacher, works offline for everything except AI.

> Rule from the product doc you must never break: AI suggests, teacher decides. Nothing auto-saves into a final lesson without Accept. No scores, no HOD approvals, no student tracking.

---

## Part A — Review of the previous plan (so you know what it says)

The file `docs/IMPLEMENTATION_PLAN.md` recommends:

- **Flutter + Dart** for one codebase (Android + iOS + Web), **Drift/SQLite + FTS5** for offline lessons + search, a thin **AI gateway** (Dart Frog / Supabase / Firebase) so API keys and costs stay server-side, **Figma** for prototypes, **GitHub Actions** for auto-testing, local PDF rendering for Nigerian print layouts.

- Strengths: correct for low-end Android + expensive data + power cuts; local-first matches "private by default"; 8 dated phases with exit checks tied to the product doc.

- Why it is hard for a beginner: Dart/Flutter + native builds + app signing + SQLite migrations + prompt gateways are 4–5 new skills at once. That is why this second plan exists — same product, gentler road, web-only first. You can graduate to the Flutter plan later and reuse the data design below.

---

## Part B — Every tool we will use, why, and the free alternative

Learn this table once and every stage below makes sense.

### 1. VS Code (code editor) — free
- **What:** where you type code, see errors, run the site.
- **Which features it builds:** all of them — it is your workshop.
- **Why this one:** free, huge beginner tutorials, extensions do the hard parts (formatting, error hints).
- **Free alternatives:** VSCodium (same, no Microsoft telemetry), Zed (fast, free), Notepad++ (too basic, not recommended).

### 2. Git + GitHub (save points + backup) — free
- **What:** Git saves snapshots of your work; GitHub stores them online.
- **Which features:** version history (§46 in product doc), recovery when you break something, showing your work.
- **Why:** every stage ends with a commit. One command (`git push`) backs up the whole app.
- **Free alternatives:** GitLab free, Codeberg free. Stay on GitHub — most tutorials assume it.

### 3. Figma (app drawing board) — free starter
- **What:** draw the 5 pages before coding, click through them like a fake app.
- **Which features:** Home / Create / My Lessons / My Resources / Profile layout, lesson card, print preview.
- **Why:** catching a confusing screen on paper costs minutes; fixing it in code costs days. Teacher testing happens here first.
- **Free alternatives:** Penpot (free + open-source, best swap), Excalidraw or paper sketches (fine for Stage 1).

### 4. HTML + CSS (page skeleton + clothing) — free, built into browsers
- **What:** HTML = the sections of a lesson note; CSS = colours, spacing, print layout.
- **Which features:** Nigerian lesson format display, 5 tabs, dashboard cards, print stylesheet (§58).
- **Why:** zero installs, instant feedback, and printing is just a CSS page — browsers already do PDF.
- **Free alternatives:** none needed (it is the web itself). Tailwind CDN later is optional, not required.

### 5. JavaScript (the brain, one language only) — free
- **What:** makes buttons work: add/remove/reorder sections, save lessons, search, reflections.
- **Which features:** manual lesson creation, templates, reusable components, timetable logic, quality checklist.
- **Why:** runs everywhere with no install; the same language later talks to AI and the database. Learn one language deeply.
- **Free alternatives:** TypeScript (same + type safety — adopt in Stage 6 if you like); Python/Flask would force you to learn two worlds at once, so not here.

### 6. Dexie.js + IndexedDB (filing cabinet inside the browser) — free, offline
- **What:** a tiny free library + the browser's built-in database. Stores lessons, templates, schemes, questions, reflections on the device.
- **Which features:** My Lessons, history, versions, question bank, resource library, search index, auto-save.
- **Why for beginners:** no server, no password, no internet needed. Data survives closing the laptop. Upgrades to real databases later without relearning concepts (tables = stores, rows = records).
- **Free alternatives:** plain `localStorage` (Stage 3 only — too small for real use), Supabase free tier / Firebase Firestore free tier (needs internet; use only as backup in Stage 7), PocketBase (free, one file, great next step after this plan).

### 7. Vite (instant preview server) — free
- **What:** shows your site live and reloads on every save.
- **Which features:** speeds up all building; later turns the site into an installable PWA.
- **Why:** one command (`npm run dev`), near-zero config, official PWA plugin when you need offline.
- **Free alternatives:** plain Live Server extension (fine for Stages 1–3), Parcel (also simple).

### 8. PWA pieces: manifest + service worker via vite-plugin-pwa — free
- **What:** makes the website installable and available with no network.
- **Which features:** offline preparation, auto-save recovery, "Add to Home Screen".
- **Why:** gives teachers the offline superpower with no app store. Core lessons open in airplane mode.
- **Free alternatives:** hand-written service worker (more learning, more bugs — use the plugin).

### 9. Browser print → PDF (no library needed) — free
- **What:** a print stylesheet + `window.print()` produces the formal lesson note.
- **Which features:** section picker, Nigerian layout, share/export via system dialog.
- **Why:** zero cost, perfect fidelity, every device already has it. Add `pdfmake`/`jsPDF` (both free) only if you need custom headers/footers later.
- **Free alternatives:** jsPDF, pdfmake, browser "Save as PDF" (default — start here).

### 10. AI help: Google Gemini free tier (or Hugging Face free) through a tiny proxy — free tier
- **What:** generates objectives, introductions, activities, evaluations on request.
- **Which features:** Quick / Standard / Deep Prep, per-section rewrite, instruction box ("make it simpler, Nigerian examples").
- **Why this one for beginners:** generous free tier, plain HTTP calls, no credit card to start. The proxy (below) keeps your key secret and lets you cap costs.
- **Free alternatives:** Hugging Face Inference free, Groq free tier, Ollama running fully on your laptop (free + private, slower, great for practice). Never call AI straight from the page with your secret key inside — always via the proxy.

### 11. Tiny proxy: Cloudflare Workers free / Supabase Edge Functions free / Firebase Functions free — pick one
- **What:** a 30-line middleman: browser asks proxy, proxy adds the secret AI key, forwards, returns text.
- **Which features:** protects the key, enforces "teacher must press Accept", adds source labels (teacher / textbook / AI).
- **Why:** the single security habit that keeps you safe when you publish.
- **Free alternatives:** any of the three above (all have free tiers); local-only Ollama needs no proxy while practising.

### 12. Hosting: GitHub Pages / Netlify / Vercel — free
- **What:** puts your site on the internet with a link you can share with teachers.
- **Which features:** testing with real teachers, backup link.
- **Why:** free, deploys on every `git push`, HTTPS included (needed for PWA install).
- **Free alternatives:** Cloudflare Pages free (excellent), Render static free.

### 13. Vitest + Playwright (checking robots, optional but recommended) — free
- **What:** Vitest re-checks small logic (section reorder, template copy); Playwright clicks the real site like a teacher.
- **Which features:** guards history/restore, search, print flows from breaking.
- **Why:** beginners break things while learning — robots catch it in seconds.
- **Free alternatives:** skip to manual checklists in Stages 1–4, add robots in Stage 6.

---

## Part C — The build in stages (no dates, just order; each stage is usable)

Keep the old Flutter plan file untouched. Follow these stages top to bottom. Commit after each stage.

### Stage 0 — Workshop ready (1 sitting)
Install VS Code + Git, confirm `node -v` works, clone this repo, open the folder, run a blank Vite page. Create branch `beginner-web`.
**You learn:** files, terminal basics, commit/push.
**Done when:** site opens at `localhost`, `git status` is clean.

### Stage 1 — Design on paper first
In Figma (or Penpot) draw: Home (next lesson, needs-prep, continue), Create (topic → mode → draft), one Lesson page with the 18 Nigerian sections, My Lessons list, Print preview. Test with 1–2 teachers using the clickable prototype.
**Done when:** a teacher can point at each screen and say what it does without your help.

### Stage 2 — Static skeleton (HTML + CSS only)
Build the 5 pages with fake text. Add the design tokens: deep-green primary, amber reserved for AI boxes, big touch targets, readable font (system font is fine). Add a print stylesheet that hides buttons and shows only the lesson.
**Done when:** pages link together, printing one fake lesson looks like a real Nigerian note.

### Stage 3 — First real interactivity (JavaScript, no database yet)
Teacher profile form (name, classes, subjects), blank lesson editor: type into sections, add/remove/rename/reorder, save to `localStorage`, duplicate, delete. Quality checklist as plain tick-boxes (objectives match evaluation? duration fits?).
**Done when:** you can create, close the tab, reopen, and your lesson is still there.

### Stage 4 — Real filing cabinet (Dexie.js + IndexedDB)
Move storage to Dexie stores: `lessons, versions, templates, schemes, questions, resources, reflections, timetable`. Add: personal templates, scheme paste box, resource list, question bank add/insert, versions (snapshot button + restore), annotations (private sticky notes), simple search box, collections (favourites).
**Done when:** 5+ lessons, search finds them, old versions restore, airplane-mode test passes for everything except AI.

### Stage 5 — Planning + Home that helps
Timetable entry (day/period/class/subject), weekly view, Home cards (Next / Needs prep / Continue / Recent). Reflection form after teaching ("we reached example 3", "struggled with subtraction") + "use in next lesson" button that copies it forward (continuity loop).
**Done when:** Home answers "what do I teach next?" without scrolling.

### Stage 6 — AI as an assistant (online only, never required)
Build the tiny proxy (pick Cloudflare Workers free), connect Gemini free tier. UI rules: AI text always appears in an amber box with Accept / Edit / Discard; per-section buttons ("generate only the introduction"); mode buttons Quick / Standard / Deep (they just change prompt length); instruction box ("use cheap local aids"); source chips (teacher / AI / textbook). Offline = friendly "AI needs internet — keep writing manually" banner.
**Done when:** you can generate a full lesson, regenerate one section, and discard everything without touching your saved draft.

### Stage 7 — Harden + share
PWA install, auto-save every few seconds + crash recovery, full offline test, export/import JSON backup, PDF via print, basic Vitest + one Playwright flow (create → reflect → next lesson). Deploy to Netlify/Vercel free, test on a real low-end Android phone, fix font sizes and button sizes.
**Done when:** a teacher installs it from a link, makes a lesson offline, prints a clean PDF.

### Stage 8 — Grow up (after this plan)
Add accounts + backup (Supabase free), photo uploads, voice input (browser Web Speech free), term summaries, sharing via link. When installs or AI bills grow, re-read `docs/IMPLEMENTATION_PLAN.md` and port the data model to Flutter — your Dexie stores map 1:1 to its SQLite tables.

---

## Quick glossary (plain words)

- **PWA:** a website you can install like an app. **IndexedDB:** a database living inside the browser. **Proxy:** a waiter that carries your AI request so your secret key never leaves the kitchen. **Template:** a saved section order you reuse. **Version:** a named snapshot (draft / final / used). **Source chip:** a label saying who wrote a paragraph (you, textbook, or AI).

## What to do today

1. Install VS Code + Node, get `npm run dev` showing something.
2. Sketch the 5 pages in Figma or Penpot.
3. Build Stage 2 static pages, then come back for Stage 3.

*Kept promise: the advanced plan in `docs/IMPLEMENTATION_PLAN.md` is untouched. This file is the gentle road; that file is the fast road later.*
