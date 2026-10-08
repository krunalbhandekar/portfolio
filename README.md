# Krunal Bhandekar — Portfolio

A CMS-driven developer portfolio. The full product and technical spec is in [portfolio.md](portfolio.md), and the build plan is in §15 of that file.

| Folder | App | Deploys to |
|---|---|---|
| [`client/`](client) | Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui) | Vercel (Root Directory `client`) |
| [`server/`](server) | Express 5 + TypeScript (ESM) | Render (Root Directory `server`) |

Both apps auto-deploy from GitHub on push to `main`. There are no CI `.yml` files and no Docker.

## Requirements

- Node.js 20.19+ (LTS)
- npm

## Local development

```bash
# API → http://localhost:5050/api/v1/health  (needs MongoDB: Atlas URI or a local mongod)
# Port 5050, not 5000: macOS AirPlay Receiver occupies 5000.
cd server
cp .env.example .env        # fill MONGODB_URI, GOOGLE_CLIENT_ID, CLOUDINARY_URL and the three secrets
npm install
npm run seed                # once: admin, site settings, homepage, about, starter skills (idempotent)
npm run dev

# Web → http://localhost:3000  (proxies /api/v1/* to API_URL, default http://localhost:5050)
cd client
cp .env.example .env.local  # REVALIDATE_SECRET must match the server's
npm install
npm run dev
# Admin: footer "Admin" link → /admin/login (only krunalbhandekar10@gmail.com can sign in)
# Public pages are static: content changes appear after an admin save (on-demand revalidation).
# `npm run build` fetches content from API_URL; if the API is unreachable it builds with fallbacks.
```

## Scripts (both folders)

| Script | What it does |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm run build` | Lint, type-check and build (fails on any error, which blocks the deploy) |
| `npm start` | Run the production build |
| `npm run lint` / `npm run typecheck` | Checks only |
| `npm run format` | Prettier |

## Deployment settings

**Vercel (client)**: Framework Next.js, Root Directory `client`, default build command (`npm run build`). Env vars are listed in `client/.env.example`. `API_URL` must point at the Render service (no trailing slash, no `/api/v1`).

**Render (server)**: Web Service, Node runtime, Root Directory `server`

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/api/v1/health`
- Region: Singapore
- Env vars are listed in `server/.env.example`. Required: `NODE_ENV=production`, `CLIENT_URL` (the Vercel URL), `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REVALIDATE_SECRET`.
- Seed production once from your machine: `MONGODB_URI=<atlas-uri> npm run seed` (in `server/`).
