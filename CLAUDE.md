# Authority Content Studio — Frontend

## Deployment
- **Platform:** Vercel (auto-deploys on push to `main`)
- **Backend:** Modal.com FastAPI at `https://growpredictably--authority-content-studio-backend-fastapi-app.modal.run`
- **Database:** Supabase (PostgreSQL) — frontend uses Supabase Auth + client queries

## Tech Stack
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack React Query

## Key Rules
- This is the deployable frontend repo. Commits to `main` trigger Vercel builds.
- Backend code lives in a separate monorepo (`authority-content-studio`).
- Do NOT modify backend or database schemas from this repo.
