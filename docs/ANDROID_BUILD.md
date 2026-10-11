# LessonPrep on Android (Play Store) — wrapper plan + build guide

Strategy: **Trusted Web Activity (TWA)** — the Play listing is a thin,
Google-approved wrapper that opens your live site fullscreen, no address bar.
Same code, same database, same backends. No rewrite, no feature loss by
design. The AAB cannot be built on this machine yet (no Node/JDK/SDK) — the
steps below are exact for any machine with them.

## 1. Install the toolchain (once, ~30 min, all free)

1. **Node.js LTS** → https://nodejs.org (needed for Bubblewrap).
2. **JDK 17** → https://adoptium.net (needed to sign the package).
3. **Android Studio** → https://developer.android.com/studio (installs the
   Android SDK + platform tools; accept the licences).
4. `npm i -g @bubblewrap/cli` → `bubblewrap --version` proves it works.

## 2. Generate the Android project (2 min)

```
bubblewrap init --manifest https://lessonsprep.netlify.app/manifest.json
```

Accept defaults; package name `app.lessonprep.twa`. This repo already
supplies everything Bubblewrap reads: `manifest.json` (name, standalone,
theme, **192/512/maskable PNG icons** in `app/icons/`), `login.html`
start page, HTTPS host.

## 3. Build the upload package

```
bubblewrap build
```

Output: `app-release-bundle.aab` (first build creates your signing key —
back it up; losing it locks you out of future updates).

## 4. Publish ($25 one-time, Google's fee, not ours)

1. https://play.google.com/console → pay $25 → create app `LessonPrep`.
2. Upload the `.aab` to **internal testing** first, install on your phone,
   run the teacher test (`app/DEPLOY_TEST.md`).
3. Play Console → **Setup → App integrity** → copy the **SHA-256 app
   signing fingerprint** → paste it into `app/.well-known/assetlinks.json`
   replacing `REPLACE_WITH_PLAY_SIGNING_SHA256` → push (this file is already
   deployed; updating it makes links open in the app instead of Chrome).
4. Fill the **Data safety** form honestly: on-device lessons (IndexedDB),
   optional Supabase EU-region accounts (see below), no ads, no third-party
   sale. Then promote to production.

## 5. Feature matrix — what works where

### Works fully OFFLINE in the Android app (airplane mode ✓)
Lesson CRUD + 18-section editor, versions/snapshots + restore, templates,
schemes, question bank, resources, full-text search + favourites, timetable
+ smart Home, reflections + next-lesson continuity, annotations, quality
checklist, print via Android system print (Save as PDF ✓), backup
export/import, device-local sign-up/login, PWA shell itself. The service
worker + IndexedDB need no network after first load.

### Requires INTERNET
- **AI generation** (Gemini Worker proxy or remote Ollama) — manual writing
  always available; offline banner explains.
- **Cloud accounts** (Supabase login/sign-up/password reset) — device-local
  accounts work offline; cross-device login needs one connection.
- **First-ever load** of any page/file (then cached by the service worker).
- Supabase + jsDelivr CDN scripts (Dexie itself is vendored locally, fine).

### Android-specific notes (no rewrites needed)
- TWA shares Chrome's storage: a teacher logged in on Chrome is logged in
  in the app (same origin) — a feature, not a bug.
- Backup export downloads to the Downloads folder; import uses the system
  file picker — both verified patterns on WebView/Chrome.
- `crypto.subtle` (password hashing) needs HTTPS — satisfied by Netlify.
- No native code exists, so nothing *breaks* on Android; the only
  not-applicable items are things never built (push notifications,
  background sync, in-app billing).

## 6. After launch

Every `git push` to `main` updates the site inside the installed app
automatically (it's a live wrapper) — store updates are only needed for
icon/name/package changes.
