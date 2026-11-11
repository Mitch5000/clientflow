# ClientFlow — going live with a real backend

ClientFlow is a fullstack app: React frontend + **Supabase** backend (Auth, Postgres, Realtime).
It also has an **offline demo fallback**: if no Supabase credentials are present at build time, it
runs entirely from a localStorage seed. That is why the portfolio copy (`uploads/clientflow/index.html`)
works with no server — it is built in demo mode.

## 1. Create the Supabase project
1. Go to https://supabase.com → **New project** (free tier is fine). Pick a strong DB password, note the region.
2. Wait for it to finish provisioning.

## 2. Create the schema
1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/schema.sql` and **Run**.
   This creates the `users`, `team_members`, `projects`, `tasks`, `activities` tables,
   enables Row Level Security (any signed-in user can read/write — a shared-workspace demo),
   and adds the tables to the Realtime publication.

## 3. Auth settings (for a frictionless demo)
1. **Authentication → Providers → Email**: ensure Email is enabled.
2. **Authentication → Settings**: turn **OFF** "Confirm email" so `signUp` returns a session
   immediately (otherwise new users must click a confirmation email before the app unlocks).
   Turn it back ON if you want real email verification.

## 4. Add credentials
1. **Project Settings → API Keys**: copy the **Publishable key** (`sb_publishable_…`). On newer dashboards this replaces the old `anon public` key — same idea, browser-safe. **Never** use a **Secret key** (`sb_secret_…`, the `service_role` equivalent). If your dashboard still shows legacy keys, the `anon public` (`eyJ…`) also works.
2. **Project URL** isn't on the API Keys page in the new dashboard. Get it from the green **Connect** button, **Settings → Data API**, or read the ref from your dashboard address bar (`…/project/<REF>/…` → `https://<REF>.supabase.co`).
3. Copy `.env.example` to `.env` and fill them in:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_your-publishable-key
   ```
   The publishable/anon key is safe to ship in a frontend bundle; RLS is what protects the data.

## 5. Build
```
npm install
npm run build      # -> dist/index.html (single file, now in LIVE mode)
```
The first live load auto-seeds the demo projects/tasks/team (only if the tables are empty).

## 6. Host the frontend (pick one — all free)
ClientFlow uses a **HashRouter**, so it needs no server-side rewrites; any static host works.

- **Netlify Drop (recommended, easiest):** build locally *with* `.env` (the keys get baked in at build time), then drag the `dist/` folder onto https://app.netlify.com/drop. No Netlify env config is needed — Drop only uploads your pre-built files. (Example live result: https://musical-llama-bca605.netlify.app.)
- **Netlify/Vercel from a Git repo (continuous deploy):** connect the repo; *then* set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in the host's environment variables so *their* build can bake them in.
- **GitHub Pages:** commit the `dist/` you built with env, then enable Pages.

## 7. Verify real-time collaboration
Open the deployed URL in two different browsers (or one normal + one incognito), sign in,
and drag a task or add a comment in one — it appears in the other within a second. That is
Supabase Realtime; it is what makes the "Real-time collaboration" claim true.

## Notes / production hardening (beyond this demo)
- RLS is intentionally permissive (shared workspace). For a real product, scope policies by
  `auth.uid()` and a `workspace_members` join table.
- Consider a `service_role`-only seeding script instead of client auto-seed.
- Add server-side validation/triggers and storage buckets for avatars/attachments if you extend it.
