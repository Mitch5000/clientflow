# ClientFlow — Fullstack Project Management App

A Kanban-style project management app with a **React + TypeScript** frontend and a **Supabase** backend
(Auth, PostgreSQL, Realtime). It runs in two modes: **live** (real Supabase backend) or an **offline demo**
(a fully seeded workspace persisted to `localStorage`) when no backend credentials are present — so the same
build works as a static portfolio demo *and* as a real fullstack app.

## Live demo
- **Hosted fullstack app:** https://musical-llama-bca605.netlify.app — real Supabase auth + Postgres + realtime. Create an account to explore; the workspace seeds on first login.
- **Offline demo:** building *without* Supabase keys produces a self-contained version that runs from a localStorage seed (this is the build embedded in the portfolio).

## Features
- **Kanban board** with drag & drop between columns (To Do → In Progress → Review → Done), drop-target highlighting, and confetti on completion
- **Command palette** (`Ctrl/Cmd + K`) + keyboard shortcuts (`N` new task, `/` focus search)
- **Real-time collaboration** — edits sync live across sessions via Supabase Realtime
- **Real authentication** — Supabase sign up / sign in / sessions with protected routes
- **Cloud data layer** — projects, tasks, comments, activity, and team members in Postgres with Row Level Security
- **Offline demo mode** — a full seeded workspace in `localStorage` when no backend is configured
- Activity feed + task **comment threads** with relative timestamps
- Dashboard **analytics** (Recharts) derived from real task data, count-up stats, and skeleton loaders
- Pinned tasks, priority/status semantics, responsive layout with a mobile drawer
- A hand-drawn brand mark and a warm **plum/gold design system** (no default Tailwind palette)

## Tech stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router (Hash), Context API, Framer Motion, Recharts, date-fns, lucide-react
- **Backend:** Supabase — Auth, PostgreSQL, Row Level Security, Realtime

## Getting started (demo mode)
```bash
git clone <your-repo-url>
cd clientflow
npm install
npm run dev
```
Open the local URL — it runs in **demo mode** out of the box. Sign in with any seeded user
(e.g. `mitch@clientflow.dev`, any password).

## Going live with Supabase
See **[SETUP.md](./SETUP.md)** for the full walkthrough. Short version:
1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
3. Copy `.env.example` → `.env` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
4. `npm run build` → deploy `dist/` to any static host (Netlify, Vercel, GitHub Pages). The first live load auto-seeds an empty database.

## Project structure
```
src/
  components/   Layout, Logo, CommandPalette, Toasts, ProtectedRoute, UserAvatar
  context/      AuthContext (Supabase auth + demo fallback), DataContext (data + realtime)
  lib/          supabase.ts (client + isDemoMode), api.ts (CRUD, mappers, realtime, auto-seed)
  pages/        Login, Register, Dashboard, Projects, Tasks, Team, Settings
  data/         seed.ts (the demo workspace)
  types/        domain models
  utils/        storage, confetti, toast, relativetime, cn
supabase/
  schema.sql    tables, RLS policies, realtime publication
SETUP.md        backend deploy guide
```

## Scripts
- `npm run dev` — local dev server
- `npm run build` — production build (inlined to a single file via `vite-plugin-singlefile`)
- `npm run preview` — preview the production build

## Notes
- RLS is intentionally permissive for the shared-workspace demo (any authenticated user can read/write). For production, scope policies by `auth.uid()` / workspace membership.
- The Supabase **anon** key is safe to ship in the client bundle; RLS is what protects the data.

## Author
Mitchell Osiago — **CodesBy.Mitch**

## License
MIT
