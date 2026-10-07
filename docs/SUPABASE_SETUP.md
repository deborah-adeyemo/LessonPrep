# Supabase cloud accounts — free setup (~5 minutes)

Gives you: email sign-up/login that works on ANY device + a central list of
every account (dashboard → Authentication → Users) + password-reset emails.
Phone-number identifiers stay device-local (Supabase SMS is a paid add-on).
Lessons stay on-device — cloud login only; lesson sync is a later step.

## 1. Create the project (free, no card)

1. Go to https://supabase.com → Sign up / Log in (GitHub login is fine).
2. **New project** → name `lessonprep` → pick a region near Nigeria
   (e.g. `West EU - Ireland`, closest free region) → generate a password →
   **Create project**. Wait ~2 minutes.

## 2. Copy two keys

Project → **Settings (gear) → API**:
- **Project URL** → looks like `https://xyzabc.supabase.co`
- **anon public key** → long `eyJ...` string (this key is safe to put in the
  app — it only allows sign-up/login, protected by Supabase rules).

## 3. Make sign-up teacher-friendly (recommended)

Authentication → **Sign In / Up** → turn **OFF "Confirm email"** while
piloting (teachers log straight in; switch it back on for production).
Leave everything else default.

## 4. Connect the app

1. Open your app → **Profile → Cloud accounts**.
2. Paste the URL + anon key → **Save cloud settings** → status shows
   **● cloud ON**.
3. Sign out, then **Sign up with an email address** → log in on a second
   phone with the same email → you're in, same account.

## 5. See your users + resets

- Users list: dashboard → **Authentication → Users** (every sign-up appears
  here with first/last name in metadata).
- Password reset: the app's login page shows **Forgot password?** whenever
  cloud is on — Supabase sends the email automatically.
- To go device-only again: Profile → **Use device only**.

## Costs & limits (free tier, 2026)

Supabase free: 50,000 monthly active users, unlimited API calls for this
size — you will not pay anything while piloting with teachers.
