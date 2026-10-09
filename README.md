# Krunal Bhandekar — Portfolio

A CMS-driven developer portfolio. Every piece of visible content is edited in the admin panel; the public site is static and refreshes itself seconds after an edit. The full product and technical spec is in [portfolio.md](portfolio.md) (build plan in §15).

| Folder | App | Deploys to |
|---|---|---|
| [`client/`](client) | Next.js 16 (App Router, Cache Components, TypeScript, Tailwind v4) | Vercel (Root Directory `client`) |
| [`server/`](server) | Express 5 + TypeScript (ESM), MongoDB (Mongoose), Cloudinary | Render (Root Directory `server`) |

Both apps auto-deploy from GitHub on push to `main`. There are no CI `.yml` files and no Docker.

## Contents

1. [Local setup](#local-setup)
2. [Environment variables](#environment-variables)
3. [Deployment](#deployment)
4. [Undoing changes](#undoing-changes)
5. [Day-to-day](#day-to-day)
6. [Scripts](#scripts)

## Local setup

Requirements: Node.js 20.19+ and npm; MongoDB (an Atlas URI, or `mongod` installed locally).

```bash
# 1. API → http://localhost:5050/api/v1/health
#    Port 5050, not 5000: macOS AirPlay Receiver occupies 5000.
cd server
cp .env.example .env        # fill MONGODB_URI, GOOGLE_CLIENT_ID, CLOUDINARY_URL and the secrets
npm install
npm run dev

# 2. Site → http://localhost:3000 (proxies /api/v1/* to API_URL, default http://localhost:5050)
cd client
cp .env.example .env.local  # REVALIDATE_SECRET must equal the server's
npm install
npm run dev
```

- Admin: footer **Admin** link → `/admin/login`. Only `ADMIN_EMAIL` (krunalbhandekar10@gmail.com) can sign in; add `http://localhost:3000` to the Google OAuth client's authorized JavaScript origins.
- Public pages are static. A save in the admin calls the site's `/api/revalidate`, so changes appear within seconds. **Edit content in the admin of the environment whose site should update** (a local admin revalidates the local site only).
- Use a separate database for development (a local `mongod` or a second Atlas database) so experiments never reach the live site.
- If MongoDB fails with `ENOTFOUND …mongodb.net`, your router's DNS can't resolve Atlas hosts: set the Mac's DNS to `8.8.8.8` / `1.1.1.1`.

## Environment variables

Full, commented lists: [`server/.env.example`](server/.env.example) and [`client/.env.example`](client/.env.example). `.env` files are git-ignored; real values live only in Render and Vercel.

**Server (Render)**

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `CLIENT_URL` | yes | The site's URL (CORS, CSRF origin check, revalidation calls) |
| `MONGODB_URI` | yes | Atlas connection string (least-privilege user) |
| `GOOGLE_CLIENT_ID` | yes | Same value as the client's `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| `ADMIN_EMAIL` | yes | The only account allowed into the admin; also receives contact/testimonial notification emails |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | yes | `openssl rand -hex 32` each |
| `REVALIDATE_SECRET` | yes | **Must equal the client's.** Also authorises Draft Mode previews |
| `CLOUDINARY_URL` | yes | `cloudinary://<key>:<secret>@<cloud>` (media, usage widget) |
| `RESEND_API_KEY` | optional | Contact/testimonial email notifications |

**Client (Vercel)**: `NEXT_PUBLIC_SITE_URL`, `API_URL` (Render URL, no trailing slash, no `/api/v1`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `REVALIDATE_SECRET`.

## Deployment

**Vercel (client)**: Framework Next.js, Root Directory `client`, default build command (`npm run build` = lint + type-check + build). Optional *Ignored Build Step*: `git diff --quiet HEAD^ HEAD -- .` (skips builds when only `server/` changed).

**Render (server)**: Web Service, Node runtime, Root Directory `server`, region Singapore.

- Build: `npm ci --include=dev && npm run build` · Start: `npm start` · Health check: `/api/v1/health`
- No seeding needed: your first Google sign-in creates the admin account, and Site Settings / Homepage / About start from defaults until you save them.
- The free plan sleeps after ~15 idle minutes (30–60 s to wake). The public site is unaffected (static on Vercel); the admin shows "Waking up the server…" and retries. Optional keep-alive: ping `GET /api/v1/health` every 14 minutes (UptimeRobot or cron-job.org); nothing else needs a scheduler.

**Google OAuth**: authorized JavaScript origins = the production URL (and `http://localhost:3000`). Publishing status **In production**, so visitors can leave testimonials.

**Security**: the site sends a strict Content Security Policy and security headers (`client/next.config.ts`); the API uses Helmet, strict CORS, CSRF header checks, rate limits, Zod validation, sanitised rich text and signed Cloudinary uploads (images/PDF only, 10 MB). Check `npm audit --omit=dev` in both folders before releases.

## Undoing changes

There are no scheduled backups. Mistakes are undone inside the admin:

- **History** button in every editor: the last 30 versions of each item, with a diff and one-click restore (the restore itself is undoable).
- **Recently deleted** on every list: brings a deleted item back exactly as it was (same id and URL).
- **Audit log**: who changed what and when.

These cover content edits, not the database itself. MongoDB Atlas M0 has no automatic backups, so if you ever want a full copy, export it yourself with `mongodump "<MONGODB_URI>"` (MongoDB Database Tools) from time to time.

## Day-to-day

- **Draft → Preview → Publish** from each editor.
- **Renaming a published page's slug** automatically adds a 301 from the old URL (Admin → SEO → Redirects). Redirects are applied before the page renders.
- **Audit log**: Admin → Audit log (filters by content type, action, outcome and date).
- **SEO**: per-page titles/descriptions/noindex in Admin → SEO; site-wide defaults in Site Settings; per-item SEO inside each editor.

## Scripts

| Script (both folders) | What it does |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm run build` | Lint, type-check and build (fails on any error, which blocks the deploy) |
| `npm start` | Run the production build |
| `npm run lint` / `npm run typecheck` | Checks only |
| `npm run format` | Prettier |
