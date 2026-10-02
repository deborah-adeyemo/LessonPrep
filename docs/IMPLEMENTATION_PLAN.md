# LessonPrep — Detailed Implementation Plan

**Source:** `docs/Lesson-Prep.md` (80-section PRD), `README.md`
**Repo state:** docs-only, no code yet. 2 commits on `main`.
**Goal:** take the teacher-owned PRD to a testable MVP that satisfies PRD §76–78, without building a school-management system (§75, §80).

North Star (PRD §79): *personal assistant that knows what / who / what was taught / preferences / history — and leaves every decision to the teacher.*

---

## 1. What we are building (and not building)

### MVP = PRD §76 core (35 items)

Onboarding, teacher profile, classes, subjects, Nigerian 18-section format (§8), personal templates, scheme of work, manual + AI creation, Quick / Standard / Deep Prep (§10), full section editing (§12), quality check (§48), history / continuity / reflection (§38–39, §45), reusable components (§44), question bank (§42), resource library (§43), timetable + weekly planning (§50–51), search (§55), auto-save + versions (§46, §60), export/print (§58).

### Explicitly out of MVP

Term planning / term-end review (§52–53, partial), assessments + marking guides (§40–41 — only basic evaluation/assignment in MVP), duplicate detection v1 (basic only, §57), dashboard analytics (§54 minimal only, §68–69 post-MVP), optional sharing (§70 — export PDF/text only), public library + attribution (§71–72), professional development (§73), student analytics (§74), voice (§64) / photo OCR (§65) / external research (§62) beyond typed/pasted input, advanced differentiation/inclusive (§35–36 — manual fields only).

### Non-negotiable principles

1. Teacher-first, private-by-default (§3–7). No login via school, no approvals, no roles in MVP. Single-teacher account.
2. AI never auto-applies (§4, §12). Every suggestion = Accept / Edit / Reject / Ignore.
3. No scores, ranks, or performance judgments (§49, §68, §75).
4. Offline-capable core (§59). Teacher must open, edit, and print a saved lesson with no network.
5. Nigerian formats first (§8, §29): affordable low-cost aids, local examples, correct print layout.

---

## 2. Architectural decision

### Recommended stack (default)

**Flutter (single codebase: Android + iOS + Web/PWA) + local-first data + thin AI gateway.**

Why:

- Primary users are Nigerian teachers on low-end Android with expensive data and intermittent power/network. Flutter gives one codebase, good offline story (SQLite via Drift), good print/PDF, and Play Store + PWA distribution.
- Local-first matches "private by default, no authority" (§7). No mandatory backend account to start.
- AI is the only hard online dependency, isolated behind a gateway so manual creation, history, and print all work offline.

**Alternative considered:** React Native + Expo (also viable if team already knows React). PWA-only with Next.js is cheaper but print fidelity and offline on low-end Android are weaker, and Play Store presence matters for trust. Decision: **start Flutter; keep all product logic in pure Dart packages so UI can be swapped later.**

### System shape

```
Teacher device (Flutter app, offline-first)
├── UI: 5 tabs (Home / Create / My Lessons / My Resources / Profile) — PRD §5
├── Local DB (Drift/SQLite): lessons, versions, templates, schemes,
│   resources, questions, timetable, reflections, preferences
├── File store: uploads / photos / PDFs (local, encrypted at rest if possible)
├── Sync (Phase 8+, optional): per-teacher backup to personal cloud
└── AI gateway (online only, never blocking)
    ├── Auth + rate limits + cost caps per teacher
    ├── Prompt service: Quick / Standard / Deep + per-section regen
    ├── Grounding: teacher profile + class + subject + scheme + textbook excerpt
    └── Guardrails: source labels, no auto-apply, conflict surfacing (§19, §61)
```

Backend (minimal, post-Phase-4): Dart Frog / Supabase / Firebase — only for AI proxy, backup, and metrics. **No multi-tenant school logic, no HOD roles, ever.**

### Key decisions (locked for MVP)

| Area | Decision | Rationale / PRD link |
|---|---|---|
| Identity | Device-local account + optional email/phone backup. No school SSO. | §3–7 private by default |
| Data | Local SQLite as source of truth. Cloud = backup only. | §59 offline, §7 privacy |
| Lesson model | Section-based JSON, orderable, renamable, add/remove (§8). Template = ordered section list + defaults. | §8 flexibility |
| Versioning | Explicit snapshots (draft / edited / final / used / revised), not every keystroke. Diff + restore. | §46 |
| AI | Server-side prompts with teacher/class/subject/scheme context. Per-section + full-lesson. Cost + latency budgets. | §10–13 |
| Search | Local FTS (SQLite FTS5) over lessons/resources/questions. Natural-language shortcuts as saved filters first. | §55 |
| Export/print | Local PDF render matching Nigerian format + section picker (§58). Share = system share sheet only. | §58, §70 minimal |
| Analytics | Local-only counts for MVP. No tracking without opt-in. Maps to §77 metrics via in-app surveys + opt-in events. | §68–69, §77 |
| Media | Typed/pasted upload in MVP. Camera/OCR deferred (structure DB for it now). | §21, §65 deferred |

### Data model (v1 tables)

- `teachers`: id, name, classes, subjects, preferences JSON, instructions (general/subject/class), templates
- `classes`: id, name (e.g. JSS2A), subject links, current/previous topics, pace, observations, differentiation needs (§15)
- `subjects`: id, name, preferences (practical vs worked-example bias, §16)
- `schemes`: id, class_id, subject_id, term, weeks JSON, source text/photo path
- `lessons`: id, class_id, subject_id, type (new/continuation/revision/remedial/assessment/test/exam/practical/activity, §37), mode (quick/standard/deep), status (not-started/draft/ready, §54), sections JSON, timetable link, reflection link, source labels (§61), created/used dates
- `lesson_versions`: lesson_id, label, snapshot JSON, created_at
- `components`: id, kind (intro/explanation/activity/eval/assignment/conclusion…), body, tags, reuse count (§44)
- `questions`: id, class/subject/topic/difficulty/type/objective, body, answer, source lesson (§42)
- `resources`: id, kind (scheme/textbook/aid/worksheet/template/tip/upload), file/text ref, tags (§43)
- `timetable_entries`: weekday, period, class_id, subject_id, duration
- `reflections`: lesson_id, what worked / didn't / completed / difficulties / changes (§39)
- `annotations`: lesson_id, section ref, private note (§47)
- `collections` + `collection_items`: favorites (§56)

---

## 3. Design system (Phase 1, before any feature code)

Start here because the PRD demands "one simple app for one teacher" (§5), fast Quick Prep (§10), and print fidelity (§58). No school-dashboard aesthetics.

### Tokens

- Color: 1 primary (deep green, trust/school), 1 accent (warm amber for AI suggestions — always visually distinct from teacher text), neutrals, success/warn/danger. WCAG AA contrast. Dark-mode + high-contrast later.
- Type: single readable sans (e.g. Inter / Noto — good for Nigerian diacritics), scale 12/14/16/20/24/32. Lesson-print serif option for formal notes.
- Spacing/radius: 4pt grid, 8px radius cards, large 48px touch targets (low-end devices, outdoor glare).
- Motion: minimal, no blocking animations. Every AI state has skeleton + cancel.

### Components (build once, reuse everywhere)

AppBar + 5-tab nav (§5), LessonSectionCard (view/edit/regen/accept-diff states), PromptBar (natural instruction input, §13), SourceChip (teacher / textbook / scheme / AI / edited, §61), StatusPill (not-started/draft/ready), EmptyStates ("JSS2 Mathematics — Algebra" starter, §9), PrintPreview, OfflineBanner.

### UX flows to prototype first (Figma, clickable, tested with 5 teachers)

1. First-run: classes → subjects → format → first Quick Prep in ≤10 min (§77 target).
2. Create: topic/scheme/textbook/previous/blank → mode picker → missing-info nudge → lesson draft.
3. Edit: per-section generate/rewrite/accept-diff (§12) — AI panel never covers teacher text.
4. Teach loop: mark used → reflection (§39) → continuity into next lesson (§38).
5. Print: section picker → Nigerian layout → PDF/share (§58).

Acceptance: 4/5 teachers complete a usable lesson in test without help; print output approved as "fits my normal format" (§77: 80% target).

---

## 4. Phased delivery

Each phase ends with a tagged, testable build + PRD traceability. Do not start Phase N+1 if exit criteria fail.

### Phase 0 — Foundation (week 1)

- Decisions locked (§2 table), repo structure (`app/`, `packages/domain/`, `packages/prompts/`, `docs/`), Flutter + Drift + FTS5 scaffold, lint/format/CI, manual QA checklist, metric definitions (§77).
- Exit: `flutter build apk` + empty 5-tab shell runs offline on a low-end Android emulator.

### Phase 1 — Design system + prototype (weeks 2–3)

- Tokens, components above, print stylesheet, Figma prototype of 5 flows, 5-teacher hallway test.
- PRD: §5, §8 (visual), §54, §58 (preview).
- Exit: approved prototype + component library in code (Storybook-style page).

### Phase 2 — Manual lesson core (weeks 4–6) — biggest value, no AI yet

- Onboarding, teacher/class/subject profiles (§14–16 minimal), Nigerian 18-section editor (add/remove/rename/reorder), personal templates, save/duplicate/delete, validation (no forced counts, §23).
- PRD: §8–9, §11, §14–16 (CRUD), §37 types, §76 items 1–8, 13.
- Exit: teacher creates/prints a full manual lesson offline; ≥60% of test teachers finish first lesson (§77).

### Phase 3 — Schemes, resources, timetable (weeks 7–8)

- Scheme input (paste/type/upload; photo stored, OCR deferred, §17), textbook refs (§20), resource library (§43), timetable + weekly view + Home "next / needs-prep / continue" (§50–51, §54).
- PRD: §17–18, §20–21 (typed only), §43, §50–51, §54.
- Exit: lesson pre-fills class/subject/scheme context; weekly plan shows statuses.

### Phase 4 — AI assistance + quality check (weeks 9–11)

- Gateway + prompts: full-lesson (Quick/Standard/Deep, §10) and per-section (§12), instruction scopes (lesson/subject/class/general, §13), source chips (§61), conflict notice (§19), quality check (§48) + improvement suggestions (§49, accept/reject, no scores).
- Cost/latency caps, cancel/retry, offline fallback ("AI unavailable — continue manually").
- Exit: ≥70% generated content accepted with minor/no edits in pilot; median usable lesson ≤10 min (§77).

### Phase 5 — Memory: history, continuity, reuse (weeks 12–13)

- FTS search (§55), history filters (§45), versions + compare/restore (§46), annotations (§47), reusable components save/suggest (§44), question bank CRUD + insert into eval/assignment (§42), classwork/assignment/revision/remedial builders (§31–34 basic), evaluations aligned to objectives (§30).
- Exit: ≥30% lessons reuse prior material; ≥50% of reflectors reuse reflection in next lesson (§77 continuity target).

### Phase 6 — Planning + Home + print hardening (weeks 14–15)

- Dashboard (§54), collections/favorites (§56), basic duplicate warning (§57), term helpers minimal (§52–53 read-only summary), PDF/print section picker + Nigerian layout (§58), auto-save + recovery (§60), local backup/export.
- Exit: print approved by teachers; kill-app recovery works; offline airplane-mode pass.

### Phase 7 — Beta + metrics + hardening (weeks 16–18)

- 20–50 real teachers, 4-week retention cohort. Instrument only opt-in events for §77 (first-lesson rate, weekly active, completion, time-to-usable, reuse rate, acceptance, time-saved survey, usability, retention, control satisfaction, format fit, continuity use).
- Accessibility, performance (cold start, low-RAM), security review (local encryption, no PII leaks to AI logs), Play listing + PWA.
- Exit: MVP success definition §78 (12 checks) reviewed; go/no-go to public launch.

### Post-MVP (explicitly not now)

Assessments/marking (§40–41 full), term planning/end-review (§52–53 full), teacher analytics/report (§68–69), sharing/public library (§70–72), PD (§73), voice (§64), photo OCR (§65), external research (§62), differentiation/inclusive full (§35–36).

---

## 5. Testing, DevOps, risks

- Testing: unit (section/template/version logic), widget (editor, accept-diff), integration (create→reflect→next-lesson), print golden tests, offline/airplane suite, AI prompt regression set (JSS2 Algebra, Basic Science practical, Civic discussion, etc.).
- DevOps: GitHub Actions (analyze/test/build), versioned prompts, feature flags for AI modes, staged rollout, crash reporting (opt-in), local-first backup before any destructive migration.
- Risks: data cost → cap AI tokens, default manual mode; low-end devices → paginate 1374-line docs, lazy-load lists, 50MB APK budget; power cuts → aggressive auto-save; curriculum variance → never hardcode scheme, teacher overrides always win (§18); AI hallucinations → source chips + "differs" warnings (§19).

---

## 6. Milestones & traceability

| Milestone | PRD sections | Success signal (§77–78) |
|---|---|---|
| M1 Prototype approved | §5, §8, §54, §58 | 4/5 teachers finish test lesson |
| M2 Manual lesson shippable offline | §8–9, §11, §37 | ≥60% first-lesson completion |
| M3 Context-aware (schemes/timetable) | §14–18, §20, §43, §50–51 | Scheme-linked lessons used |
| M4 AI usable | §10, §12–13, §19, §48–49, §61 | ≤10 min median, ≥70% accept |
| M5 Memory/reuse | §30–34, §38–39, §42, §44–47, §55 | ≥30% reuse, continuity ≥50% |
| M6 Print/polish + beta ready | §54, §56–60 | 80% format fit, recovery works |
| M7 Public MVP | §76–78 | 40% 4-week retention, 80% control satisfaction |

---

## 7. Immediate next actions

1. Approve stack (Flutter local-first + AI gateway) or request React Native costing.
2. Commission Phase 1 Figma (5 flows) + recruit 5 teachers for hallway test.
3. Scaffold `app/` + `packages/domain` + prompt stubs in this repo.
4. Define opt-in metrics events for §77 before writing AI code.

*What NOT to do next: auth servers, HOD roles, school dashboards, student tracking, public marketplace — all rejected by §75.*
