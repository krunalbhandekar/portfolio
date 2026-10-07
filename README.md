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
# API → http://localhost:5000/api/v1/health
cd server
cp .env.example .env        # only CLIENT_URL is required in Phase 0
npm install
npm run dev

# Web → http://localhost:3000
cd client
cp .env.example .env.local
npm install
npm run dev
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

**Vercel (client)**: Framework Next.js, Root Directory `client`, default build command (`npm run build`). Env vars are listed in `client/.env.example`.

**Render (server)**: Web Service, Node runtime, Root Directory `server`

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/api/v1/health`
- Region: Singapore
- Env vars are listed in `server/.env.example`. Phase 0 needs `CLIENT_URL` (and `NODE_ENV=production`).
