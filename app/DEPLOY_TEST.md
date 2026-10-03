# LessonPrep — Deploy + final test (Stage 7)

## Deploy free (pick one, ~5 minutes)

**Netlify:** app.netlify.com → Add new site → Import from GitHub →
`deborah-adeyemo/LessonPrep`, branch `beginner-web`. `netlify.toml` already
sets publish dir to `app` — no build command. You get an `https://` link
(HTTPS is required for install + offline).

**Alt:** Vercel (`vercel.com`, same steps, root `app/`), or Cloudflare Pages
(free, same). GitHub Pages also works (repo Settings → Pages).

## Phone test (the real exam)

1. Open the link on a low-end Android phone → browser menu → **Install app**
   (or Add to Home Screen). Open the installed app.
2. **Airplane mode ON:** create a lesson, edit sections, search, open a
   snapshot, print-preview. Everything except AI must work.
3. **Print:** lesson → Print / Save PDF → confirm it looks like a normal
   Nigerian note (teacher verdict rules).
4. **Crash test:** type half a section, kill the app, reopen — text intact
   (auto-save), versions restorable.
5. **Backup:** Profile → Export backup → email the file to yourself →
   delete a lesson → Import → lesson returns.
6. **AI (needs internet):** Profile → AI settings → Test → Generate one
   section → Accept, then Discard another. Draft untouched until Accept.

## Teacher pass (5 teachers, 15 min each)

1. Without help: add timetable → Quick Prep from Create → edit 3 sections.
2. Mark lesson Ready → find it in My Lessons search.
3. Teach (pretend) → save a reflection → Start next lesson → check
   Previous Knowledge carried over.
4. Print to PDF → "Does this fit your normal format? What's missing?"
5. Pass = 4/5 finish unaided. Fix confusions in `app/`, not in docs.

## After launch

Merge `beginner-web` → `main` via pull request when the teacher test
passes. Automated checks (Vitest + Playwright) and the Flutter port from
`docs/IMPLEMENTATION_PLAN.md` are the post-launch road.
