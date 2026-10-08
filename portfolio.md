# Portfolio — Product & Technical Specification

**Owner:** Krunal Bhandekar
**Role:** Full-Stack Software Engineer (4+ years)
**Admin (sole):** krunalbhandekar10@gmail.com
**Goal:** A fast, SEO-friendly, fully CMS-driven portfolio with a modern developer look. It shows real engineering evidence (projects, case studies, architecture, decisions) rather than a list of websites, and has a private admin panel for editing every piece of content.

> Positioning: "Here is my engineering journey, the systems I've built, the problems I've solved, the decisions I've made, and the impact of my work."

### Key decisions (locked)

| # | Decision |
|---|---|
| 1 | Media storage: **Cloudinary free plan** (content is mostly screenshots) |
| 2 | Single admin: **krunalbhandekar10@gmail.com** (Google OAuth only) |
| 3 | Visual style: **modern developer portfolio** (see [Design Direction](#2-design-direction--modern-developer-aesthetic)) |
| 4 | Hosting: **client on Vercel**, **server on Render**, DB on MongoDB Atlas. Both deploy through their **GitHub integration** (auto-deploy on push): **no CI/CD `.yml` files, no Docker** |
| 5 | Repo layout: two top-level folders, **`client/`** and **`server/`** |
| 6 | Admin login entry point: a small, low-key **link in the footer** (not in the main navigation) |

---

## Table of Contents

1. [Tech Stack & Hosting](#1-tech-stack--hosting)
2. [Design Direction — Modern Developer Aesthetic](#2-design-direction--modern-developer-aesthetic)
3. [Public Site — Pages & Features](#3-public-site--pages--features)
4. [Additional Features (Suggested)](#4-additional-features-suggested)
5. [Admin Panel (CMS)](#5-admin-panel-cms)
6. [Authentication — Google OAuth Only](#6-authentication--google-oauth-only)
7. [Media Storage — Cloudinary (Free Plan)](#7-media-storage--cloudinary-free-plan)
8. [SEO Strategy](#8-seo-strategy)
9. [Data Model (MongoDB)](#9-data-model-mongodb)
10. [API Design](#10-api-design)
11. [Project Structure](#11-project-structure)
12. [Performance, Accessibility & Security](#12-performance-accessibility--security)
13. [Deployment — Vercel + Render](#13-deployment--vercel--render)
14. [Things to Avoid](#14-things-to-avoid)
15. [Build Roadmap](#15-build-roadmap)

---

## 1. Tech Stack & Hosting

| Layer | Choice | Why |
|---|---|---|
| Frontend (`client/`) | **Next.js (App Router) + TypeScript** | SSG/ISR for SEO, Metadata API, sitemap, OG image generation |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, small bundle, modern look out of the box |
| Motion | Motion (Framer Motion) + View Transitions | Subtle, performant animations |
| Fonts | Geist Sans + Geist Mono (via `next/font`) | Clean modern developer aesthetic |
| Icons | lucide-react + simple-icons (tech logos) | |
| Data fetching (admin) | TanStack Query | Caching, mutations, optimistic updates in the CMS |
| Forms (admin) | React Hook Form + Zod | Same validation rules as the backend |
| Rich text | Tiptap (or MDX) | Case studies, blog posts, about section |
| Code highlighting | Shiki | Static, theme-aware syntax highlighting |
| Diagrams | Mermaid (rendered) / React Flow (interactive) | Architecture showcase |
| Backend (`server/`) | **Node.js + Express + TypeScript** | |
| Database | **MongoDB Atlas (M0 free) + Mongoose** | |
| Auth | Google OAuth 2.0 (`google-auth-library`) + JWT in httpOnly cookies | Admin-only login |
| Media storage | **Cloudinary (free plan)** | Screenshots, thumbnails, logos, certificates, resume PDF |
| Email | Resend (free tier) | Contact form notifications to krunalbhandekar10@gmail.com |
| Analytics | Vercel Web Analytics or Umami | Privacy-friendly visitor insights |
| Scheduled jobs | cron-job.org (free external HTTP cron) | Render's free plan has no cron jobs; no workflow files needed |
| Hosting | **Vercel** (client) · **Render** (server) · **MongoDB Atlas** (DB) · **Cloudinary** (media) | |

### Rendering strategy

- Public pages are **static / ISR on Vercel** with **on-demand revalidation**. When content is saved in the admin panel, the server calls the client's revalidation endpoint, so the live site updates within seconds and stays fully static.
- Because public pages are served from Vercel's CDN, **visitors never wait for a Render cold start**. Only the admin panel and the contact form call the server directly.
- Admin pages (`/admin/*`) are client-rendered, protected, and marked `noindex`.

---

## 2. Design Direction — Modern Developer Aesthetic

The site should look like the work of a current product engineer: minimal, sharp and fast, with developer-native details. Avoid the template look.

### 2.1 Visual language

- **Dark-first** with a polished light mode (follows the system setting, with a manual toggle). Near-black background (`#0A0A0A`-ish), neutral greys, and **one accent color** that can be changed from the admin panel.
- **Typography:** Geist Sans for content, **Geist Mono for metadata** (dates, tech tags, labels, stats, section numbers like `01 / Projects`).
- **Layout:** a **bento grid** on the home page, generous whitespace, a content width of about 1100px, and a strong typographic hierarchy.
- **Surfaces:** cards with 1px subtle borders, soft **cursor spotlight / glow on hover**, gradient borders on featured items, and a faint **dot/grid background** with light noise grain.
- **Navbar:** sticky, translucent (backdrop blur), compact. Its links are Projects, Case Studies, Engineering, About, Blog and Contact, plus the ⌘K trigger and the theme toggle.

### 2.2 Developer-native touches

- **⌘K command palette** for navigation and search
- **Terminal-style hero accent** (e.g. a small `$ whoami` block or a typed role line) used sparingly
- **Live status badge** with a pulsing dot, e.g. "Available for opportunities"
- Code blocks with Shiki highlighting, a copy button and the file name in the header
- Keyboard shortcut hints (`⌘K`, `G P` → projects)
- Tech tags styled as mono "chips" with logos
- Footer meta line: "Built with Next.js · Deployed on Vercel & Render · Last updated <date>"

### 2.3 Motion

- Fade/slide-in on scroll (once), stagger on grids, and layout animation when project filters change
- View Transitions from a project card to its detail page (shared thumbnail/title)
- Hover micro-interactions on buttons and cards, plus a toast confirmation when the email is copied
- **Respect `prefers-reduced-motion`.** No splash loaders, scroll hijacking, cursor trails or heavy 3D scenes.

### 2.4 Reference inspiration

vercel.com, linear.app, rauno.me, leerob.com, brittanychiang.com. Borrow their restraint and clarity, not their layouts.

### 2.5 Design system deliverables

- Design tokens (colors, radius, spacing, shadows) as CSS variables, with the accent color driven by site settings
- Base components: Button, Badge/Chip, Card, BentoCard, Section header, Timeline item, Stat, Tag filter, Lightbox, Code block, Callout, Empty state
- A consistent section pattern: mono eyebrow label → heading → muted description → content

---

## 3. Public Site — Pages & Features

### 3.1 Home

- **Hero**
  - Name, role (Full-Stack Software Engineer) and a one-line positioning statement
  - Photo/avatar, location and an availability status badge (e.g., "Open to opportunities")
  - Primary tech stack chips (React • Node.js • TypeScript • MongoDB)
  - CTAs: **View Projects**, **Download Resume**, **Contact Me**
- **Bento grid** combining: stats (years, projects, technologies, companies; only numbers you can back up), current role, tech stack, a "Currently building" card, GitHub activity and location/timezone
- **Featured projects:** 3–6 pinned project cards
- **Short about** with a link to the full About page
- **Career journey preview** (mini timeline)
- **Technical expertise summary:** Frontend | Backend | Database | DevOps
- **Featured case studies**
- **Testimonials carousel**
- **Latest blog posts** (if the blog is enabled)

### 3.2 Footer (global)

- Columns: navigation links, social links (GitHub, LinkedIn, X, email), Resume, RSS
- Copy-to-clipboard email
- Meta line: "Built with Next.js · Deployed on Vercel & Render · © <year> Krunal Bhandekar"
- **Admin login entry:** a small, muted **"Admin"** link (lock icon) at the bottom of the footer → `/admin/login`
  - Not in the main navbar and not in the public command palette results
  - `rel="nofollow"`; `/admin/*` is excluded from the sitemap and disallowed in `robots.txt`
  - Shows **"Dashboard"** instead when an admin session is active
  - Visitors who click it see only a "Sign in with Google" page. Every non-admin Google account is rejected.

### 3.3 About

- Professional story and the kinds of problems you enjoy solving
- Education
- Non-linear career journey as a differentiator (e.g., Mechanical Engineering → Software Development → Full-Stack Engineer)
- How you entered software development
- Companies worked with, roles and responsibilities
- Areas of expertise and domains worked in
- How you work (values, collaboration style, engineering principles)

### 3.4 Experience / Career Timeline

- Visual vertical timeline (education, transitions, jobs)
- For each job:
  - Company (logo, link), position, duration, location/remote
  - Technologies used
  - Responsibilities
  - Achievements (impact first)
  - Linked projects

### 3.5 Projects (core of the site)

- **Project grid** with cards: thumbnail, title, one-line summary, category, tech tags, status, "Professional / Personal" badge
- **Featured projects** pinned at the top
- **Filters:** category (Full Stack, Frontend, Backend, DevOps, APIs, SaaS, Internal Tools, Side Projects), technology, type (Professional / Personal), year
- **Search** by title, tech or feature
- **Sort:** featured, newest, most complex
- Links: live demo, GitHub, case study (where public)
- **Professional vs personal separation**
  - Professional (company) work carries a "Private Project — Professional Work" label: no proprietary code or data, redacted screenshots (redacted **before** upload), and diagrams in place of code
  - Personal projects include full source and demo links

### 3.6 Project Detail Page (every project)

- **Overview:** name, one-liner, category, your role, duration, team size, status, technologies
- **Impact metrics at the top** (e.g., "Reduced API response time by 60%"), using only real numbers
- **Problem:** the business/user problem
- **Solution:** what was built
- **Your contribution:** exactly what you did (designed REST APIs, built React modules, implemented auth/RBAC, designed schemas, payment workflow, integrations, query optimization…)
- **Architecture:** diagram (static or interactive)
- **Features list:** auth, RBAC, dashboards, order management, payments, notifications, reports, uploads, search, integrations
- **Engineering challenges:** Challenge → Solution → Result
- **Key technical decisions** (why X over Y)
- **Screenshot gallery** (lightbox) from Cloudinary; demo video embedded from YouTube or Loom
- **Demo info:** live link, GitHub, demo credentials (personal projects only)
- **Related projects** and next/previous navigation

### 3.7 Case Studies (top 4–6 projects)

Long-form deep dives, structured as:

```
Problem → Business Requirements → Constraints → Architecture → Database Design
→ API Design → Implementation → Challenges → Solution → Result → Learnings
```

- Business problem and technical problem
- Constraints (time, team, legacy systems, scale)
- Approach and important decisions
- Database model and API design snippets
- What you learned
- Reading time, sticky table of contents, share buttons

### 3.8 Engineering Section

- **Architecture showcase:** system, API, database, auth flow, payment flow, order flow and deployment architecture, as interactive diagrams (zoom/pan, click a node for its explanation)
- **API showcase:** selected endpoints with method, path, auth, params, request/response examples and status codes; optional Swagger/OpenAPI-style viewer
- **Database design:** collections, relationships, indexes, key schemas, data modeling decisions
- **DevOps / Infrastructure:** CI/CD pipeline diagrams from professional work (e.g., Developer → Git → Jenkins → Docker → AWS → Kubernetes → Production) and exactly what you personally handled. This portfolio's own Vercel + Render pipeline can be shown as well.
- **Engineering decisions (FAQ style):** Why MongoDB? Why React Query? Why Node.js? Why Docker? How did you design RBAC? How did you handle large datasets? How did you handle authentication?

### 3.9 "What I Built" Explorer

A searchable, filterable table of concrete features you've built across projects:

| Feature | Project | Technology | Area |
|---|---|---|---|
| RBAC | Admin Panel | Node + MongoDB | Backend |
| Order Management | Buyofuel | React + Node | Full Stack |
| Invoice Discounting | Finance | Node + MongoDB | Backend |
| Payment Integration | Trading Platform | Node | Integration |
| CI/CD Pipeline | Production | Jenkins + Docker | DevOps |

- Filter by area or technology, search by keyword
- Clicking a row opens the related project or case study section

### 3.10 Skills

- **Technology stack** grouped into Frontend, Backend, Database, DevOps/Cloud and Tools, shown as tags/icons with **no percentage bars**
- Optional experience indicator in words (e.g., "Daily use · 4 yrs", "Production experience", "Familiar")
- **Technical capabilities** (what you can actually do): REST API development, auth & authorization, RBAC, database design, API integration, payment integration, performance optimization, error handling, logging, CI/CD, cloud deployment, Dockerization, system design, testing
- Each skill links to the projects that used it

### 3.11 GitHub Integration

- Pinned/featured repositories (stars, forks, languages, description)
- Contribution activity graph
- Language breakdown
- Open source contributions section (PRs to other projects)
- Cached in MongoDB and refreshed daily by an external cron (cron-job.org) to avoid API rate limits

### 3.12 Testimonials

- Quote, name, role, company, relationship (manager/colleague/client), photo, LinkedIn link

### 3.13 Achievements

- Measurable, verifiable achievements (modules built, processes automated, integrations delivered, users supported, manual work reduced)

### 3.14 Certifications & Education

- Degree, bootcamp, certifications, courses, workshops, fellowships, talks, awards
- Each with institution, date, certificate image (Cloudinary) and verification link

### 3.15 Blog / Technical Articles

- Topics: MongoDB optimization, Node.js architecture, React performance, Docker, Kubernetes, API design, authentication, system design, production lessons
- Tags, categories, search, reading time, table of contents, code syntax highlighting, related posts
- RSS feed
- Option to cross-post or link to LinkedIn posts

### 3.16 Now Page (`/now`)

- What you're currently building, learning and reading

### 3.17 Resume

- **Download Resume PDF** button (always the latest version from the admin panel, stored in Cloudinary)
- Web resume page (`/resume`) rendered from the same CMS data, print-friendly
- Resume = 1–2 page summary; portfolio = detailed evidence

### 3.18 Contact

- Email, LinkedIn, GitHub, phone (optional), location (optional)
- Contact form: name, email, subject, message, and an optional "reason" dropdown (Job opportunity / Freelance / Collaboration / Other)
- Optional calendar booking link (Cal.com / Calendly)
- Spam protection, plus success/error states. Show a "sending…" state that tolerates a Render cold start of up to about 60s.

### 3.19 Global UX

- Fully responsive and mobile-first (recruiters often open links on their phones)
- Dark/light mode toggle (respects the system preference)
- Subtle, performant animations only
- Custom 404 page with helpful links

---

## 4. Additional Features (Suggested)

1. **Command palette (Ctrl/⌘ + K):** jump to any project, skill, case study or post. It feels developer-native and doubles as site search.
2. **Recruiter Quick View (`/hire` or `?view=recruiter`):** a one-screen summary of role, years, stack, availability, notice period, preferred locations/remote, top 3 projects, resume and contact.
3. **Role-tailored resume versions:** upload several resumes (Full-Stack, Backend, Frontend) and share a specific one by link.
4. **Skill → project cross-linking:** every tech tag is a clickable page (`/skills/node-js`) listing the projects, features and posts that use it. These long-tail pages also help SEO.
5. **Draft / Publish / Schedule workflow:** edit safely without exposing unfinished content, and preview drafts before publishing.
6. **Content versioning & audit log:** every edit stores a revision, and previous versions can be restored.
7. **Media library:** central management of Cloudinary assets with alt text, auto format/quality, usage references and a Cloudinary credit-usage widget.
8. **Dynamic Open Graph images:** auto-generated share cards per project/post (title, stack, your name), so LinkedIn, X and WhatsApp previews look professional.
9. **Contact inbox in admin:** view, mark as read, archive and reply via email, plus an email notification for each new message.
10. **Admin analytics dashboard:** page views, top projects, resume downloads, contact submissions and referrers.
11. **Resume download tracking:** download counts per resume version.
12. **Section visibility & ordering toggles:** show/hide and reorder home page sections from the admin panel without code changes.
13. **Per-page SEO editor:** custom meta title, description, OG image, canonical URL and noindex flag for every page, project and post.
14. **Redirect manager:** when a project slug changes, a 301 redirect is created automatically so links and SEO don't break.
15. **Site settings:** name, tagline, social links, availability status, accent color and announcement banner, all managed from the admin panel.
16. **Uses page (`/uses`):** your hardware, editor, extensions and tools.
17. **Recruiter FAQ:** notice period, work authorization, remote/relocation preference and expected role.
18. **Copy-to-clipboard email & vCard download.**
19. **Automated DB backups:** a nightly cron-triggered JSON export saved to Cloudinary, plus an "Export all content as JSON" button in the admin panel.
20. **Accessibility first:** keyboard navigation, focus states, semantic HTML, WCAG AA contrast.

---

## 5. Admin Panel (CMS)

Route: `/admin` (client-rendered, `noindex, nofollow`, excluded from the sitemap and blocked in `robots.txt`).
**Entry point:** the "Admin" link in the footer → `/admin/login` (see [3.2](#32-footer-global)).

### 5.1 Principle

**Every piece of visible content comes from the database.** The public site has no hard-coded text apart from layout chrome.

### 5.2 Modules

| Module | What you can edit |
|---|---|
| **Dashboard** | Visits, top pages, resume downloads, new messages, draft count, recent edits, Cloudinary credits used |
| **Site Settings** | Name, title, tagline, logo, favicon, social links, email, phone, location, availability status, accent color, announcement banner, analytics ID, calendar link |
| **Homepage** | Hero content, CTAs, bento cards, stats, section ordering & visibility, featured item selection |
| **About** | Rich text story, education, journey steps, values |
| **Experience** | CRUD for jobs/timeline entries, drag-and-drop ordering |
| **Projects** | CRUD with all detail fields, gallery, architecture diagrams, challenges, decisions, metrics, featured flag, type (professional/personal), status, slug, SEO |
| **Case Studies** | Long-form rich text with structured sections, linked project |
| **Engineering** | Architecture diagrams, API showcase entries, DB design entries, DevOps pipeline, decision FAQ |
| **What I Built** | CRUD for feature rows linked to projects |
| **Skills** | Categories, skills (name, icon, level label, years), capabilities, ordering |
| **Testimonials** | CRUD, approve/hide, ordering |
| **Achievements** | CRUD |
| **Certifications & Education** | CRUD with certificate upload and verification links |
| **Blog** | Posts with a rich editor, tags, categories, cover image, draft/schedule/publish |
| **Now / Uses / FAQ** | Simple rich-text/list editors |
| **Resume** | Upload several PDF versions, set the default, view download counts |
| **Media Library** | Upload to Cloudinary, browse, alt text, delete, usage references |
| **Messages** | Contact inbox: read/unread, archive, delete, export |
| **SEO** | Global defaults, per-page overrides, redirect manager, sitemap preview |
| **GitHub** | Username, pinned repo selection, manual cache refresh |
| **Revisions & Audit Log** | Change history, restore |
| **Backup** | Export/import content as JSON, list/download nightly backups |

### 5.3 CMS capabilities

- Draft / Published / Scheduled states on all content types
- Live preview of a draft on the real page layout (Next.js Draft Mode)
- Drag-and-drop ordering
- Automatic slug generation with a uniqueness check
- Image upload with client-side compression, crop and **required alt text**
- Form validation that mirrors the server's Zod schemas
- Unsaved changes warning
- On save, the server triggers on-demand revalidation of the affected public pages

---

## 6. Authentication — Google OAuth Only

### 6.1 Rules

- **Only Google sign-in.** No password and no sign-up form.
- **Single admin:** `ADMIN_EMAIL=krunalbhandekar10@gmail.com`. Any other Google account is rejected with 403, even after Google authentication succeeds.
- Verify `email_verified === true` and the token's `aud === GOOGLE_CLIENT_ID`.
- The admin record is seeded or upserted on first successful login. No other admin can ever be created.

### 6.2 Flow

```
Visitor/admin clicks the "Admin" link in the footer → /admin/login
        ↓
"Sign in with Google" (Google Identity Services) → ID token (credential)
        ↓
POST {API}/api/v1/auth/google  { credential }
        ↓
Express verifies the token with google-auth-library (audience = GOOGLE_CLIENT_ID)
        ↓
email === krunalbhandekar10@gmail.com && email_verified ?  → else 403
        ↓
Upsert admin, issue a short-lived access JWT (15 min) + refresh token (7 days)
in httpOnly, Secure, SameSite=Lax cookies (Domain = .<your-domain>)
        ↓
Admin requests carry the cookies → `requireAdmin` middleware validates the JWT
        ↓
The refresh endpoint rotates tokens; logout clears cookies and revokes the refresh token
```

### 6.3 Cookies across Vercel and Render (important)

`*.vercel.app` and `*.onrender.com` are different sites, and browsers block third-party cookies between them. Use one of these:

- **Implemented (default):** the browser calls same-origin `/api/v1/*`, and a Next.js rewrite on Vercel proxies it to the Render URL (`API_URL`). Cookies are host-only, first-party on the site's domain, and work with or without a custom domain. Leave `COOKIE_DOMAIN` unset.
- **Optional later:** with a custom domain for both (e.g. `krunalbhandekar.dev` + `api.krunalbhandekar.dev`), the browser can call the API directly: set `NEXT_PUBLIC_API_URL` on the client and `COOKIE_DOMAIN=.krunalbhandekar.dev` on the server.

Cookies set by the API: `pf_at` (access JWT, httpOnly, path `/`, 15 min), `pf_rt` (refresh token, httpOnly, path `/api/v1/auth`, 7 days) and `pf_session=1` (non-secret, JS-readable hint used only for the footer "Admin"/"Dashboard" link).

### 6.4 Security details

- Refresh tokens stored hashed in MongoDB, with rotation and revocation
- CSRF protection for state-changing admin requests (SameSite cookies + a custom header check)
- CORS restricted to the client domain(s) (production domain + Vercel preview pattern if needed)
- Rate limiting on auth endpoints
- Every login attempt (success or rejection, time, IP, user agent) logged in the audit log
- Google Cloud OAuth client: authorized JavaScript origins = `http://localhost:3000` and the production domain only

### 6.5 Environment variables

**`server/.env`** (set in the Render dashboard)

```
NODE_ENV=production
PORT=10000
MONGODB_URI=
CLIENT_URL=https://krunalbhandekar.dev
CORS_ORIGINS=                # optional extra origins, comma-separated
TRUST_PROXY_HOPS=1
COOKIE_DOMAIN=               # empty with the /api/v1 proxy (default)
GOOGLE_CLIENT_ID=
ADMIN_EMAIL=krunalbhandekar10@gmail.com
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REVALIDATE_SECRET=
JOBS_SECRET=
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
RESEND_API_KEY=
CONTACT_NOTIFY_EMAIL=krunalbhandekar10@gmail.com
GITHUB_TOKEN=
TURNSTILE_SECRET_KEY=
SENTRY_DSN=
```

**`client/.env`** (set in the Vercel dashboard)

```
NEXT_PUBLIC_SITE_URL=https://krunalbhandekar.dev
API_URL=https://<render-service>.onrender.com   # server-only; /api/v1 proxy target
# NEXT_PUBLIC_API_URL=https://api.krunalbhandekar.dev/api/v1   # only for direct mode
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
REVALIDATE_SECRET=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 7. Media Storage — Cloudinary (Free Plan)

Most media is **screenshots**, which suits the free plan well.

### 7.1 Free plan limits (check the current Cloudinary pricing page before building)

- About **25 monthly credits**, where 1 credit ≈ 1 GB storage **or** 1 GB bandwidth **or** 1,000 transformations
- File size caps: about 10 MB per image and about 100 MB per video
- PDF/ZIP delivery is **blocked by default** on free accounts. Enable "Allow delivery of PDF and ZIP files" in Settings → Security so the resume can be downloaded.

### 7.2 What goes where

| Asset | Storage |
|---|---|
| Project screenshots, thumbnails, galleries | Cloudinary `portfolio/projects/<slug>/` |
| Blog / case study cover and inline images | Cloudinary `portfolio/blog/`, `portfolio/case-studies/` |
| Avatar, logo, favicon source | Cloudinary `portfolio/brand/` |
| Company logos | Cloudinary `portfolio/companies/` |
| Certificates | Cloudinary `portfolio/certificates/` |
| Resume PDFs | Cloudinary `portfolio/resumes/` |
| Demo videos | **YouTube (unlisted) / Loom embeds**, not Cloudinary (saves bandwidth credits) |
| OG images | Generated by Next.js (`next/og`), not stored |

### 7.3 Upload flow (files never pass through Render)

```
Admin picks a file → client-side compression (max ~2000px, WebP, ~80% quality)
        ↓
POST /api/v1/admin/media/signature  → server returns a signed upload signature (folder, timestamp)
        ↓
Browser uploads directly to Cloudinary (signed upload)
        ↓
POST /api/v1/admin/media  { publicId, url, width, height, bytes, format, alt }  → saved in MongoDB
```

- Allowed formats: jpg, jpeg, png, webp, gif, pdf; size limits enforced on both the client and in the signed params
- Alt text is required before saving

### 7.4 Delivery

- Always deliver with `f_auto,q_auto` and a width-based transformation
- Use a **Cloudinary loader for `next/image`** (or `next-cloudinary`) so Vercel's own image optimization quota isn't used
- Keep a small fixed set of sizes (e.g. `thumb` 400w, `card` 800w, `full` 1600w) to limit the number of transformations
- Blur placeholders from a tiny Cloudinary variant

### 7.5 Rules

- **Redact confidential company screenshots before uploading.** A Cloudinary blur/pixelate transformation still leaves the original file accessible.
- Deleting from the media library calls Cloudinary `destroy(publicId)`, which is blocked while the asset is still referenced (`usedIn` is not empty)
- The admin dashboard shows Cloudinary credit usage (Admin API `usage`) with a warning at 80%

---

## 8. SEO Strategy

### 8.1 Technical SEO

- Server-rendered/static HTML for every public page (Next.js SSG/ISR on Vercel)
- Next.js **Metadata API**: a unique `title`, `description` and canonical URL per page
- **Open Graph & Twitter cards** with dynamic OG images (`next/og`)
- **Auto-generated `sitemap.xml`** from the DB (projects, case studies, posts, skill pages) with `lastmod`
- **`robots.txt`** allowing public pages and disallowing `/admin` and `/api`
- **RSS feed** for the blog
- Clean, readable slugs: `/projects/buyofuel-trading-platform`
- 301 redirects on slug change (redirect manager)
- Proper heading hierarchy (a single `h1` per page)
- Image optimization (Cloudinary `f_auto,q_auto`, width/height set, lazy loading, descriptive alt text)
- Breadcrumbs on detail pages
- Fast Core Web Vitals (targets: LCP < 2.5s, CLS < 0.1, INP < 200ms)
- The footer "Admin" link is `rel="nofollow"` and `/admin/*` is `noindex`

### 8.2 Structured data (JSON-LD)

| Page | Schema |
|---|---|
| Home / About | `Person` (name, jobTitle, sameAs social links, knowsAbout skills, alumniOf) + `WebSite` |
| Projects | `CreativeWork` / `SoftwareApplication` |
| Blog posts / case studies | `Article` / `BlogPosting` |
| Detail pages | `BreadcrumbList` |
| FAQ | `FAQPage` |

### 8.3 Content SEO

- Skill pages (`/skills/react`) and blog posts create long-tail search entry points
- Target queries like "Krunal Bhandekar", "Full Stack Developer Pune" and "React Node developer portfolio"
- Submit the sitemap to Google Search Console and Bing Webmaster Tools
- Custom domain (e.g., `krunalbhandekar.dev`)

---

## 9. Data Model (MongoDB)

All content collections share these common fields:

```ts
{
  status: 'draft' | 'published' | 'scheduled',
  publishAt?: Date,
  order: number,
  seo?: { title, description, ogImage, canonical, noindex },
  createdAt, updatedAt, updatedBy
}
```

Image fields store a **media reference** (`{ mediaId, publicId, url, alt, width, height }`) rather than a raw URL.

### Collections

| Collection | Key fields |
|---|---|
| `admins` | email (always krunalbhandekar10@gmail.com), name, avatar, googleId, lastLoginAt |
| `refreshTokens` | adminId, tokenHash, expiresAt, revokedAt, userAgent, ip |
| `siteSettings` (singleton) | name, title, tagline, avatar, location, availability, socials[], email, phone, accentColor, banner, calendarUrl, homepageSections[] (key, visible, order), bentoCards[] |
| `about` (singleton) | story (rich text), education[], journey[], values[] |
| `experiences` | company, companyLogo, companyUrl, position, employmentType, location, startDate, endDate, isCurrent, technologies[], responsibilities[], achievements[], projectIds[] |
| `projects` | title, slug, summary, category, type (professional/personal), role, duration, teamSize, projectStatus, technologies[], featured, thumbnail, gallery[], videoUrl (YouTube/Loom), liveUrl, repoUrl, demoCredentials, problem, solution, contributions[], features[], architecture {diagram, description}, challenges[] {challenge, solution, result}, decisions[] {question, answer}, metrics[] {label, value}, confidential (bool), experienceId, caseStudyId |
| `caseStudies` | title, slug, projectId, sections[] (type, heading, content), readingTime, coverImage |
| `engineeringItems` | type (architecture/api/database/devops/decision), title, slug, content, diagram, apiSpec {method, path, auth, params, request, response, statusCodes}, projectId |
| `builtFeatures` | feature, projectId, technologies[], area, description |
| `skills` | name, slug, category, icon, levelLabel, years, projectIds[] |
| `capabilities` | name, description, relatedSkillIds[] |
| `testimonials` | quote, name, role, company, relationship, photo, linkedinUrl, visible |
| `achievements` | title, description, metric, date, projectId |
| `certifications` | title, institution, type (degree/bootcamp/cert/course/talk/award), date, certificateImage, verifyUrl |
| `posts` | title, slug, excerpt, content, coverImage, tags[], category, readingTime, publishedAt |
| `pages` | key (now/uses/faq), content |
| `resumes` | label, media (Cloudinary PDF ref), isDefault, downloadCount |
| `media` | publicId, url, resourceType (image/raw), format, folder, bytes, width, height, alt, usedIn[] {collection, documentId} |
| `messages` | name, email, subject, reason, message, read, archived, ip, userAgent |
| `redirects` | from, to, statusCode |
| `revisions` | collectionName, documentId, snapshot, adminId, createdAt |
| `auditLogs` | adminId, action, entity, entityId, meta, ip, createdAt |
| `githubCache` | repos[], contributions, languages, fetchedAt |
| `events` | type (resume_download, project_view…), refId, createdAt (optional TTL index) |

### Indexes

- Unique: `slug` on projects, caseStudies, posts, skills and engineeringItems; `email` on admins; `publicId` on media
- Compound: `{ status: 1, featured: 1, order: 1 }` on projects; `{ status: 1, publishedAt: -1 }` on posts
- Text index on projects/posts/builtFeatures for search
- TTL on `refreshTokens.expiresAt`
- Atlas M0 has a 512 MB storage limit. That is plenty, because media lives in Cloudinary, but keep `events` on a TTL (e.g., 180 days).

---

## 10. API Design

Base: `https://api.<domain>/api/v1`

### Public (read-only, `published` content only)

```
GET  /health
GET  /settings
GET  /home
GET  /about
GET  /experiences
GET  /projects?category=&tech=&type=&q=&featured=
GET  /projects/:slug
GET  /case-studies/:slug
GET  /engineering?type=
GET  /engineering/:slug
GET  /built-features?area=&tech=&q=
GET  /skills
GET  /skills/:slug
GET  /testimonials
GET  /achievements
GET  /certifications
GET  /posts?tag=&q=&page=
GET  /posts/:slug
GET  /pages/:key
GET  /github
GET  /resume/:id?/download       # tracks the download, redirects to the Cloudinary URL
GET  /search?q=                  # command palette
GET  /sitemap-data
POST /contact                     # rate-limited, Turnstile + honeypot, emails krunalbhandekar10@gmail.com
POST /events                      # lightweight analytics
```

### Auth

```
POST /auth/google
POST /auth/refresh
POST /auth/logout
GET  /auth/me                     # used by the footer to show "Admin" vs "Dashboard"
```

### Admin (requires `requireAdmin`)

```
GET|POST         /admin/:resource
GET|PATCH|DELETE /admin/:resource/:id
PATCH            /admin/:resource/reorder
POST             /admin/:resource/:id/publish
POST             /admin/:resource/:id/unpublish
GET              /admin/:resource/:id/revisions
POST             /admin/:resource/:id/revisions/:revId/restore
PUT              /admin/settings
POST             /admin/media/signature          # Cloudinary signed upload params
POST             /admin/media                    # save metadata after a direct upload
DELETE           /admin/media/:id                # Cloudinary destroy + DB delete (blocked if in use)
GET              /admin/media/usage              # Cloudinary credit usage
GET              /admin/messages
PATCH            /admin/messages/:id
GET              /admin/analytics
POST             /admin/github/refresh
GET              /admin/export
POST             /admin/import
```

### Jobs (called by cron-job.org, header `x-jobs-secret: JOBS_SECRET`)

```
POST /jobs/github-sync            # daily
POST /jobs/publish-scheduled      # every 15 min; publishes due items and triggers revalidation
POST /jobs/backup                 # nightly; exports all collections as JSON → Cloudinary (private, raw), keeps last 7
```

### Conventions

- Zod validation middleware on every write
- Consistent response shape: `{ success, data, error, meta }`
- Centralized error handler, request logging (pino), request IDs
- Pagination: `page`, `limit`, returns `meta.total`
- After any admin write, call `POST {CLIENT_URL}/api/revalidate` with the secret and the affected paths/tags

---

## 11. Project Structure

Two independent apps in one Git repo. Each has its own `package.json` and deploys separately.

```
portfolio/
├── client/                              # Next.js (App Router) → Vercel (Root Directory: client)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx                     # Home (bento)
│   │   │   │   ├── about/
│   │   │   │   ├── experience/
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/
│   │   │   │   ├── case-studies/[slug]/
│   │   │   │   ├── engineering/
│   │   │   │   ├── built/                       # What I Built explorer
│   │   │   │   ├── skills/[slug]/
│   │   │   │   ├── blog/[slug]/
│   │   │   │   └── now/  uses/  hire/  resume/  contact/
│   │   │   ├── admin/
│   │   │   │   ├── login/                       # reached from the footer "Admin" link
│   │   │   │   └── (dashboard)/...modules
│   │   │   ├── api/revalidate/route.ts
│   │   │   ├── api/draft/route.ts
│   │   │   ├── sitemap.ts
│   │   │   ├── robots.ts
│   │   │   ├── rss.xml/route.ts
│   │   │   ├── opengraph-image.tsx
│   │   │   └── not-found.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui primitives
│   │   │   ├── layout/              # Navbar, Footer (with Admin link), ThemeToggle, CommandPalette
│   │   │   ├── sections/            # Hero, BentoGrid, FeaturedProjects, Timeline...
│   │   │   └── admin/               # CMS forms, tables, MediaPicker
│   │   ├── lib/
│   │   │   ├── api.ts               # fetch wrapper (server + client)
│   │   │   ├── cloudinary.ts        # next/image loader, URL helpers, upload helper
│   │   │   ├── validations/         # Zod form schemas (mirror the server schemas)
│   │   │   ├── seo.ts               # metadata + JSON-LD helpers
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── styles/                  # globals.css, design tokens
│   │   └── types/
│   ├── public/
│   ├── next.config.ts
│   ├── .env.example
│   └── package.json
│
├── server/                              # Express + TypeScript → Render (Root Directory: server)
│   ├── src/
│   │   ├── config/                  # env (validated with Zod), db, cloudinary, cors
│   │   ├── modules/
│   │   │   ├── auth/  projects/  posts/  skills/  media/  messages/  jobs/  ...
│   │   │   │   ├── *.model.ts
│   │   │   │   ├── *.schema.ts      # Zod (source of truth for validation)
│   │   │   │   ├── *.service.ts
│   │   │   │   ├── *.controller.ts
│   │   │   │   └── *.routes.ts
│   │   ├── middlewares/             # requireAdmin, validate, rateLimit, jobsAuth, error
│   │   ├── services/                # cloudinary, mail (Resend), revalidate, github
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── scripts/                     # seed admin & initial content
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── portfolio.md
└── README.md
```

No `.github/workflows/`, no `Dockerfile` and no `docker-compose.yml`: Vercel and Render build directly from the GitHub repo.

**Shared types without a third folder:** the server's Zod schemas are the source of truth. The client keeps mirrored form schemas in `client/src/lib/validations/` and response types in `client/src/types/`. Keep them in sync when a model changes.

---

## 12. Performance, Accessibility & Security

### Performance
- Static/ISR pages on Vercel's CDN, so the public site does not depend on Render being awake
- Images through Cloudinary (`f_auto,q_auto`, responsive widths, blur placeholders)
- Fonts via `next/font` (Geist), no layout shift
- Minimal client JS on public pages (Server Components by default; animations only in small client islands)
- Lazy-load galleries, diagrams and video embeds (click-to-load YouTube/Loom facade)
- Lighthouse target: 95+ in every category

### Accessibility
- Semantic HTML, landmarks, a single `h1`
- Keyboard navigable (including the command palette, lightbox and the footer admin link)
- Visible focus states and WCAG AA contrast in both themes (check muted greys on the dark background)
- Alt text required in the media library
- `prefers-reduced-motion` respected

### Security
- Helmet, strict CORS, rate limiting (`express-rate-limit`)
- Input validation and sanitization (Zod + sanitized rich-text HTML)
- `express-mongo-sanitize` against NoSQL injection
- Signed Cloudinary uploads only (no unsigned upload preset); format and size restrictions
- Contact form: honeypot field + Cloudflare Turnstile + rate limit
- Secrets only in Vercel/Render env vars, never committed; `.env.example` files contain no values
- Atlas network access: Render's free plan has no static outbound IP, so allow `0.0.0.0/0` with a strong, least-privilege DB user
- Content Security Policy headers on the client (allow `res.cloudinary.com`, Google Identity, YouTube/Loom)
- Never expose confidential company code, data or internal URLs

---

## 13. Deployment — Vercel + Render

```
Developer → git push (feature branch / main)
   → Vercel (GitHub integration): auto-deploys client/ (preview URL per PR, production on main)
   → Render (GitHub integration): auto-deploys server/ on main (health check: /api/v1/health)
   → MongoDB Atlas (M0) · Cloudinary (media) · Resend (email)
   → DNS: krunalbhandekar.dev → Vercel, api.krunalbhandekar.dev → Render
```

No CI/CD config files and no Docker. Both platforms are connected to the GitHub repo and build on push. Quality checks run as part of each build:

- `client`: `npm run build` = `eslint . && next build` (Next.js 16's `next build` no longer lints by itself; it still type-checks)
- `server`: `npm run build` runs `tsc` (type errors fail the deploy); add `npm run lint` to the build script if desired
- A failed build never replaces the live version on either platform
- Run `npm run lint` / `npm test` locally before pushing

### 13.1 Vercel (client)

- Import the repo and set **Root Directory = `client`** (framework: Next.js)
- Ignored Build Step: skip the build when only `server/` changed
- Env vars per environment (Production / Preview)
- Custom domain + `www` redirect
- Hobby plan is enough; images use the Cloudinary loader, so Vercel's image optimization isn't counted

### 13.2 Render (server)

- New **Web Service** connected to the GitHub repo, **Root Directory = `server`**, **Node runtime** (no Docker), Auto-Deploy: on commit to `main`
  - Build: `npm ci --include=dev && npm run build` (dev deps are needed for `tsc`, even with `NODE_ENV=production`) · Start: `npm start`
  - Health check path: `/api/v1/health`
  - Region: **Singapore** (closest to India), with the Atlas cluster in the same region (AWS `ap-southeast-1`)
- Custom domain: `api.krunalbhandekar.dev`
- **Free plan considerations:**
  - Spins down after about 15 min of inactivity, and a cold start takes roughly 30–60s. Public pages are unaffected (they are static on Vercel); the admin panel and contact form show a loading state.
  - Optional keep-alive: UptimeRobot pings `/api/v1/health` every 10–14 min (750 free instance hours a month cover a single service running 24/7)
  - No cron jobs on the free plan, so scheduled tasks are triggered by cron-job.org (see 13.3)
  - No persistent disk, which is fine because files live in Cloudinary
- Make sure the Vercel build doesn't fail while Render is asleep: use `generateStaticParams` with fallback, `dynamicParams = true`, and retry/timeout in the API fetch helper

### 13.3 Scheduled jobs (cron-job.org, no files in the repo)

Configured in the cron-job.org dashboard. Each job sends a `POST` with the `x-jobs-secret` header. Requests to a sleeping Render instance wake it up, so give the jobs a 60s+ timeout or retry once.

| Job | Schedule | What it does |
|---|---|---|
| Publish scheduled | every 15 min | `POST /jobs/publish-scheduled` (publishes due content and revalidates) |
| GitHub sync | daily | `POST /jobs/github-sync` (refreshes GitHub cache and revalidates) |
| Backup | nightly | `POST /jobs/backup`: JSON export of all collections uploaded to Cloudinary `portfolio/backups/` as a private raw file, keeping the last 7 (Atlas M0 has no automated backups) |
| Keep-alive (optional) | every 14 min | `GET /health`, replacing the UptimeRobot ping if preferred |

### 13.4 Environments & monitoring

- Environments: local (client `:3000`, server `:5050` (not 5000: macOS AirPlay uses it), a separate Atlas dev database, or MongoDB installed locally (no Docker)), Vercel preview, production
- Uptime monitoring: UptimeRobot / Better Stack
- Error tracking: Sentry (free) on client and server
- This pipeline can itself be showcased in the Engineering → DevOps section

---

## 14. Things to Avoid

- Listing every small tutorial project. Curate.
- Broken demo links or outdated projects
- Vague descriptions ("built a web app") with no outcome
- Heavy animations, 3D scenes, splash loaders or scroll hijacking that slow the site down
- Skill percentage bars
- Fake or unverifiable metrics
- Exposing proprietary code, client data or internal URLs from company projects
- Uploading **unredacted** company screenshots to Cloudinary
- Hosting large videos on Cloudinary's free plan (use YouTube/Loom)
- Making public pages depend on live calls to Render (cold starts)
- Putting the admin login in the main navigation
- Making the resume the main source of information

---

## 15. Build Roadmap

### 15.1 How to use this roadmap (instructions for the implementing LLM)

1. **Work one phase at a time, in order.** Do not start a phase until every "Done when" item of the previous phase is satisfied.
2. **Within a phase, follow the task order** (server → admin → public, unless stated otherwise). Each task lists the spec sections it implements; read those sections before writing code.
3. **Build only what the current phase lists.** Features from later phases are listed under "Not in this phase" so they are not started early. Leave clean extension points instead of placeholders.
4. **After each phase:** tick the checkboxes in this file, update `.env.example` files and `README.md`, then push to `main` (Vercel and Render deploy automatically from GitHub).
5. **Ask the owner** when a decision is not covered by this spec, rather than guessing (e.g., copy text, domain name, colors).

### 15.2 Global rules (apply to every phase)

- TypeScript `strict` in both `client/` and `server/`. No `any` without a comment explaining why.
- No Docker, no `.github/workflows`, no CI `.yml` files (see [13](#13-deployment--vercel--render)).
- **No hard-coded content** on public pages; everything comes from the API (layout chrome excepted).
- Public API returns only `status: 'published'` content. Admin API requires `requireAdmin`.
- Every write endpoint: Zod validation → service → `{ success, data, error, meta }` response → audit-friendly logging → **trigger revalidation** of affected public paths.
- Every image goes through Cloudinary with **required alt text**; render with the Cloudinary loader.
- Every public page: mobile-first, dark + light themes, `prefers-reduced-motion` respected, keyboard accessible, unique metadata.
- Admin pages: `noindex`, client-rendered, loading/empty/error states, unsaved-changes warning.
- Secrets only in Vercel/Render env vars. Never commit `.env`.
- Keep the module pattern on the server: `model / schema / service / controller / routes` per module.

### 15.3 Phase overview

| Phase | Name | Outcome | Live? |
|---|---|---|---|
| 0 | Setup & Accounts | Repo, accounts, both apps deploy "hello world" from GitHub | Skeleton |
| 1 | Design System & Layout Shell | Modern UI kit, navbar, footer (with Admin link), themes | Skeleton |
| 2 | Backend Core & Admin Auth | Express foundation, MongoDB, Google login for the single admin, admin shell | Admin only |
| 3 | Media & Core CMS | Cloudinary uploads + admin CRUD for core content | Admin only |
| 4 | Public Site MVP & Launch | Core public pages from the CMS, contact, SEO, revalidation, custom domains | **✅ MVP launch** |
| 5 | Depth Content | Case studies, engineering, What I Built, testimonials, achievements, certifications, inbox, drafts & preview | ✅ |
| 6 | Differentiators | Blog, GitHub, ⌘K palette, Recruiter view, skill pages, interactive diagrams, analytics | ✅ |
| 7 | Operations & Polish | Revisions, audit log, redirects, scheduled publishing, backups, Now/Uses/FAQ, audits | ✅ Final |

---

### Phase 0 — Setup & Accounts

**Goal:** an empty but deployable two-folder project with every external account ready.
**Depends on:** nothing. **Spec:** [1](#1-tech-stack--hosting), [6.3](#63-cookies-across-vercel-and-render-important), [6.5](#65-environment-variables), [11](#11-project-structure), [13](#13-deployment--vercel--render)

**Features / tasks**
- [x] Git repo with `client/` and `server/` folders, root `.gitignore`, `README.md`
- [x] `client/`: Next.js (App Router, `src/`), TypeScript strict, Tailwind, shadcn/ui init, ESLint + Prettier, `.env.example`
- [x] `server/`: Express + TypeScript, `tsx` for dev, `tsc` build to `dist/`, ESLint + Prettier, `.env.example`
- [x] `server`: env loader validated with Zod (fails fast on missing vars), `GET /api/v1/health`
- [ ] Accounts: MongoDB Atlas M0 (Singapore), Cloudinary (enable PDF delivery), Google Cloud OAuth client, Resend, Cloudflare Turnstile, Sentry, UptimeRobot, cron-job.org
- [ ] Vercel project (Root Directory `client`) and Render web service (Root Directory `server`, Node runtime) connected to GitHub with auto-deploy on `main`
- [ ] Domain decided; DNS: root → Vercel, `api.` → Render (or Next.js rewrite fallback until the domain is bought)

**Deliverables:** both apps deployed; `/api/v1/health` returns `{ success: true }` from Render; Vercel shows a placeholder page.

**Done when**
- [ ] Push to `main` deploys both apps without manual steps
- [x] Server refuses to start when a required env var is missing
- [x] `npm run build` passes locally in both folders

**Not in this phase:** any UI design, DB models, auth.

---

### Phase 1 — Design System & Layout Shell

**Goal:** the modern developer look exists as reusable components before any real content.
**Depends on:** Phase 0. **Spec:** [2](#2-design-direction--modern-developer-aesthetic), [3.2](#32-footer-global), [3.19](#319-global-ux)

**Features / tasks**
- [x] Design tokens as CSS variables (colors, radius, spacing, shadows), dark-first, light theme, **accent color variable** (later driven by site settings)
- [x] Geist Sans + Geist Mono via `next/font`
- [x] Theme toggle (system / dark / light) without flash on load
- [x] Base components: Button, Badge/Chip (mono, with tech logo), Card, BentoCard (with hover spotlight), SectionHeader (mono eyebrow → heading → description), Stat, TimelineItem, TagFilter, Lightbox, CodeBlock (Shiki + copy), Callout, EmptyState, Skeleton
- [x] Background treatment: subtle dot/grid + noise grain
- [x] **Navbar:** sticky, translucent, links (Projects, Case Studies, Engineering, About, Blog, Contact), ⌘K trigger button (opens nothing yet), theme toggle, mobile menu
- [x] **Footer:** nav links, socials, resume, RSS, copy-email, meta line, **muted "Admin" link → `/admin/login`** (`rel="nofollow"`)
- [x] Motion primitives: reveal-on-scroll wrapper, stagger container; all disabled under reduced motion
- [x] Custom 404 page
- [x] Internal `/dev/components` preview page (excluded from production build/sitemap) using mock data

**Deliverables:** UI kit + layout shell rendered with mock data, deployed on Vercel.

**Implementation notes:** theme toggle is a single button cycling System → Light → Dark (icon chosen by CSS from `html[data-theme-pref]`, no hydration mismatch). Motion uses `LazyMotion` and the mobile menu sheet is lazy-loaded, keeping first-load JS ≈160 KB. Measured on the production build: mobile Performance 96 / Accessibility 100, desktop 100 / 100.

**Done when**
- [x] Every component works in dark and light themes and at 360px width
- [x] Keyboard focus is visible on every interactive element
- [x] Lighthouse on the shell page: Performance ≥ 95, Accessibility ≥ 95

**Not in this phase:** API calls, real content, admin pages.

---

### Phase 2 — Backend Core & Admin Auth

**Goal:** a production-grade Express foundation and secure Google sign-in for the single admin.
**Depends on:** Phase 1. **Spec:** [5](#5-admin-panel-cms), [6](#6-authentication--google-oauth-only), [9](#9-data-model-mongodb), [10](#10-api-design), [12](#12-performance-accessibility--security)

**Server**
- [x] MongoDB connection (Mongoose) with graceful shutdown
- [x] Middlewares: Helmet, CORS (client domain only, credentials), cookie-parser, JSON limit, `express-mongo-sanitize`, rate limiter, request ID, pino logging, central error handler, 404 handler
- [x] Shared helpers: response builder `{ success, data, error, meta }`, `validate(zodSchema)`, `asyncHandler`, pagination util
- [x] Common content fields plugin (status, publishAt, order, seo, updatedBy, timestamps)
- [x] Models: `admins`, `refreshTokens`, `auditLogs`
- [x] Auth module: `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
  - verify Google ID token (audience), `email_verified`, **email must equal `ADMIN_EMAIL` (krunalbhandekar10@gmail.com)** else 403
  - access JWT (15 min) + rotating hashed refresh token (7 days) in httpOnly Secure SameSite=Lax cookies with `COOKIE_DOMAIN`
  - log every login attempt (success / rejected) to `auditLogs`
- [x] `requireAdmin` middleware + CSRF custom-header check on state-changing admin routes
- [x] Revalidation service: `revalidate(paths[], tags[])` → `POST {CLIENT_URL}/api/revalidate` (used from Phase 3 on)

**Client — admin**
- [x] `/admin/login`: "Sign in with Google" (Google Identity Services), error state for rejected accounts
- [x] Auth context using `/auth/me`; silent refresh on 401; logout
- [x] Protected admin layout: sidebar (module list from [5.2](#52-modules), unbuilt modules hidden), top bar with avatar + logout, `noindex`
- [x] Empty Dashboard page
- [x] Footer link switches "Admin" → "Dashboard" when a session exists
- [x] API client (`lib/api.ts`): base URL, `credentials: 'include'`, CSRF header, typed responses, retry + 60s timeout for Render cold starts
- [x] `client/src/app/api/revalidate/route.ts` protected by `REVALIDATE_SECRET`

**Done when**
- [ ] krunalbhandekar10@gmail.com can sign in on production; any other Google account gets 403 *(verify after deploy)*
- [ ] Cookies work between the client domain and the API domain (or via rewrite fallback) *(verify after deploy)*
- [x] Access token expiry refreshes silently; logout revokes the refresh token
- [x] Admin routes return 401 without a session; `/admin/*` is `noindex` and disallowed in `robots.txt`

**Implementation notes**
- `express-mongo-sanitize` is incompatible with Express 5 (read-only `req.query`): replaced by a body sanitizer (`middlewares/sanitize.ts`) + Mongoose `sanitizeFilter` + Zod validation.
- No `asyncHandler`: Express 5 forwards rejected promises to the error handler natively.
- CSRF: `X-Requested-With: portfolio` required on state-changing `/auth/*` and `/admin/*` requests, plus a foreign-`Origin` check.
- Refresh tokens are HMAC-hashed (`JWT_REFRESH_SECRET`), rotated per use, grouped in families; reuse outside a 30 s grace window revokes the whole family.
- Proxy mode is the default (see §6.3). Footer link reads the `pf_session` hint cookie — no API call on public pages.
- Revalidation uses `revalidateTag(tag, { expire: 0 })` so the first visit after an edit is fresh.
- Admin modules are listed in `client/src/components/admin/admin-modules.ts`; set `available: true` as each one is built.

**Not in this phase:** content CRUD, media uploads, public data.

---

### Phase 3 — Media & Core CMS

**Goal:** the admin can upload screenshots and manage all content needed for the MVP site.
**Depends on:** Phase 2. **Spec:** [5](#5-admin-panel-cms), [7](#7-media-storage--cloudinary-free-plan), [9](#9-data-model-mongodb), [10](#10-api-design)

**Server**
- [ ] Cloudinary service (server-side keys only)
- [ ] Media module: `POST /admin/media/signature`, `POST /admin/media`, `GET /admin/media`, `PATCH /admin/media/:id` (alt text), `DELETE /admin/media/:id` (Cloudinary destroy, blocked when `usedIn` is not empty)
- [ ] `usedIn` tracking: content services update media references on save/delete
- [ ] Generic admin CRUD factory: list (pagination, search), get, create, update, delete, reorder, publish/unpublish
- [ ] Models + admin routes: `siteSettings` (singleton), `about` (singleton), `experiences`, `projects`, `skills`, `capabilities`, `resumes`
- [ ] Slug generation + uniqueness check; text index on `projects`
- [ ] Every write triggers revalidation of affected paths
- [ ] Seed script (`server/scripts/seed.ts`): admin + starter settings

**Client — admin**
- [ ] Reusable admin kit: DataTable (search, sort, pagination), form layout, field components (text, textarea, select, tags, date, switch, URL, repeater/array field, rich text with Tiptap), drag-and-drop reorder, confirm dialog, toast, unsaved-changes guard
- [ ] **MediaPicker / uploader:** client-side compression → signed direct upload → metadata save; required alt text; folder chosen by context (`portfolio/projects/<slug>` etc.)
- [ ] Media Library page (grid, filter by folder, edit alt, delete with "in use" warning)
- [ ] Modules: **Site Settings** (incl. accent color, availability, socials), **Homepage** (hero, CTAs, bento cards, stats, section order/visibility, featured selection), **About**, **Experience**, **Projects** (all detail fields, gallery, challenges, decisions, metrics, confidential flag), **Skills & Capabilities**, **Resume** (multiple PDFs, set default)
- [ ] Publish / unpublish toggle on every content type

**Done when**
- [ ] A screenshot uploads directly to Cloudinary (never passes through Render) and appears in the media library
- [ ] Content cannot be saved with an image missing alt text
- [ ] Deleting media in use is blocked
- [ ] All core content for the real portfolio can be entered from the admin panel

**Not in this phase:** public pages consuming the data, case studies, blog, drafts preview.

---

### Phase 4 — Public Site MVP & Launch 🚀

**Goal:** visitors see a fast, SEO-ready portfolio driven entirely by the CMS. **This is the first public launch.**
**Depends on:** Phase 3. **Spec:** [3](#3-public-site--pages--features), [8](#8-seo-strategy), [10](#10-api-design), [13](#13-deployment--vercel--render)

**Server**
- [ ] Public routes: `GET /settings`, `/home`, `/about`, `/experiences`, `/projects` (filters: category, tech, type, q, featured), `/projects/:slug`, `/skills`, `/resume/:id?/download` (redirect to Cloudinary), `/sitemap-data`
- [ ] Contact module: `POST /contact` with Zod, honeypot, Turnstile verify, rate limit; save to `messages`; email to `CONTACT_NOTIFY_EMAIL` via Resend
- [ ] Indexes from [9](#indexes) for these collections

**Client — public**
- [ ] Data layer: server-side fetchers with tags; ISR with on-demand revalidation; build does not fail if Render is asleep (retry, `dynamicParams`)
- [ ] Accent color, name, socials and availability applied from site settings
- [ ] **Home:** hero (status badge, stack chips, CTAs), bento grid, featured projects, short about, career preview, expertise summary; sections ordered/hidden per settings
- [ ] **About**, **Experience timeline**
- [ ] **Projects list:** grid, filters, search, sort, professional/personal badge, animated filter layout
- [ ] **Project detail:** overview, metrics, problem/solution, contribution, architecture (static image/Mermaid), features, challenges, decisions, gallery lightbox, video facade, links, related + next/prev
- [ ] **Skills** grouped by category with links to projects
- [ ] **Resume:** download button + print-friendly `/resume` page
- [ ] **Contact** form with success/error and cold-start-tolerant "sending…" state
- [ ] SEO: Metadata API per page, canonical, dynamic OG images, `sitemap.ts`, `robots.ts`, JSON-LD `Person`, `WebSite`, `BreadcrumbList`, `CreativeWork`
- [ ] Analytics: Vercel Web Analytics or Umami

**Launch tasks**
- [ ] Custom domains live on Vercel and Render, HTTPS, `www` redirect
- [ ] Sentry on client and server; UptimeRobot (or cron-job.org) health ping
- [ ] Real content entered for at least 4 projects, experience, skills and resume
- [ ] Sitemap submitted to Google Search Console

**Done when**
- [ ] Editing a project in admin updates the live page within ~10 seconds without a redeploy
- [ ] Public pages load instantly even while the Render server is asleep
- [ ] Contact submission stores the message and emails krunalbhandekar10@gmail.com
- [ ] Lighthouse ≥ 95 (all categories) on Home, Projects and a Project detail page, on mobile
- [ ] Rich Results Test validates the JSON-LD

**Not in this phase:** case studies, engineering section, blog, testimonials, command palette.

---

### Phase 5 — Depth Content

**Goal:** show engineering depth beyond project cards, and make content editing safe.
**Depends on:** Phase 4. **Spec:** [3.7](#37-case-studies-top-46-projects)–[3.9](#39-what-i-built-explorer), [3.12](#312-testimonials)–[3.14](#314-certifications--education), [4](#4-additional-features-suggested) (#5, #9), [5.3](#53-cms-capabilities)

**Server**
- [ ] Models + admin/public routes: `caseStudies`, `engineeringItems`, `builtFeatures`, `testimonials`, `achievements`, `certifications`
- [ ] Draft / published states enforced everywhere; preview endpoint returning drafts to an authenticated admin
- [ ] Messages admin routes: list, mark read/unread, archive, delete, export CSV

**Client — admin**
- [ ] Modules: Case Studies (structured sections editor), Engineering (type-specific forms incl. API spec editor and Mermaid diagram field with live preview), What I Built, Testimonials (visibility toggle), Achievements, Certifications & Education
- [ ] **Messages inbox** with unread badge in the sidebar
- [ ] **Draft / Publish** workflow and **live preview** via Next.js Draft Mode (`/api/draft`)
- [ ] Dashboard v1: counts (projects, drafts, unread messages), recent edits

**Client — public**
- [ ] **Case study** pages: sticky TOC, reading time, share buttons, `Article` JSON-LD
- [ ] **Engineering** section: architecture, API showcase, database design, DevOps, decisions FAQ (`FAQPage` JSON-LD)
- [ ] **What I Built** explorer: searchable/filterable table linking to projects
- [ ] Testimonials carousel (home), Achievements, Certifications & Education pages/sections
- [ ] Motion polish: scroll reveals, View Transitions from project card → detail

**Done when**
- [ ] A draft can be previewed on the real layout but is invisible to visitors and absent from the sitemap
- [ ] At least 2 case studies and 1 item per engineering type are published
- [ ] New contact messages appear in the inbox with an unread count

**Not in this phase:** blog, GitHub, command palette, analytics, revisions.

---

### Phase 6 — Differentiators

**Goal:** the features that make the portfolio stand out to recruiters and engineers.
**Depends on:** Phase 5. **Spec:** [3.11](#311-github-integration), [3.15](#315-blog--technical-articles), [4](#4-additional-features-suggested) (#1–4, #8, #10–11, #18)

**Server**
- [ ] `posts` model + routes (tags, categories, search, pagination); text index
- [ ] GitHub service + `githubCache`; `POST /jobs/github-sync` (with `x-jobs-secret`) and `POST /admin/github/refresh`
- [ ] `GET /search?q=` across projects, case studies, skills, posts, engineering
- [ ] `events` model (TTL) + `POST /events`; resume download counting; `GET /admin/analytics`
- [ ] `GET /admin/media/usage` (Cloudinary credit usage)
- [ ] `skills/:slug` public route with linked projects, features and posts

**Client — admin**
- [ ] Blog module (Tiptap with code blocks, cover image, tags, publish)
- [ ] GitHub module (username, pinned repo selection, manual refresh)
- [ ] Dashboard v2: views, top projects, resume downloads per version, referrers, Cloudinary usage widget (warn at 80%)
- [ ] Recruiter FAQ fields in settings (notice period, relocation, work authorization)

**Client — public**
- [ ] **Blog** list + post pages (Shiki, TOC, reading time, related posts, `BlogPosting` JSON-LD), **RSS** feed
- [ ] **GitHub** section: pinned repos, contribution graph, language breakdown, OSS contributions
- [ ] **⌘K command palette** (navigation + search; admin pages excluded)
- [ ] **Recruiter Quick View** `/hire`
- [ ] **Skill pages** `/skills/[slug]` (long-tail SEO)
- [ ] **Interactive architecture diagrams** (React Flow: zoom/pan, click node for details)
- [ ] Role-tailored resume links (`/resume?v=backend`), vCard download, copy email toast

**cron-job.org**
- [ ] Daily GitHub sync job configured

**Done when**
- [ ] ⌘K finds any published project, post or skill and is fully keyboard operable
- [ ] GitHub data refreshes daily without hitting rate limits
- [ ] Resume downloads and project views appear on the dashboard

**Not in this phase:** revisions, redirects, scheduled publishing, backups.

---

### Phase 7 — Operations & Polish

**Goal:** make the site safe to maintain for years and finish the remaining pages.
**Depends on:** Phase 6. **Spec:** [4](#4-additional-features-suggested) (#5–6, #12–14, #16–17, #19–20), [12](#12-performance-accessibility--security), [13.3](#133-scheduled-jobs-cron-joborg-no-files-in-the-repo)

**Server**
- [ ] `revisions`: snapshot on every update; list + restore endpoints
- [ ] Audit log for all admin writes (action, entity, ip)
- [ ] `redirects` model; automatic 301 on slug change; public lookup used by the client
- [ ] Scheduled publishing: `status: 'scheduled'` + `publishAt`; `POST /jobs/publish-scheduled`
- [ ] Backups: `POST /jobs/backup` → JSON export to Cloudinary `portfolio/backups/` (private raw), keep last 7
- [ ] `GET /admin/export`, `POST /admin/import` (validated, dry-run option)
- [ ] `pages` model for Now / Uses / FAQ

**Client — admin**
- [ ] Revision history drawer with diff view and restore on every content type
- [ ] Audit log page (filters by entity/date)
- [ ] SEO module: global defaults, per-page overrides, redirects manager, sitemap preview
- [ ] Schedule picker in the publish control
- [ ] Backup page: list/download nightly backups, export/import JSON
- [ ] Now / Uses / FAQ editors
- [ ] Announcement banner control

**Client — public**
- [ ] `/now`, `/uses`, FAQ (with `FAQPage` JSON-LD)
- [ ] Middleware/route handling for DB-driven 301 redirects
- [ ] Announcement banner

**cron-job.org**
- [ ] Publish-scheduled (every 15 min) and nightly backup jobs configured

**Final audit**
- [ ] Accessibility audit (axe + manual keyboard/screen reader pass), WCAG AA contrast in both themes
- [ ] Performance audit: Lighthouse ≥ 95 on all public page types, Core Web Vitals in the green
- [ ] Security review: CSP, CORS, rate limits, upload restrictions, dependency audit (`npm audit`)
- [ ] Render cold-start UX review on admin and contact
- [ ] `README.md`: local setup, env vars, deployment, cron jobs, restore-from-backup steps

**Done when**
- [ ] Any content change can be reverted from the admin panel
- [ ] Changing a project slug keeps old links working (301)
- [ ] A scheduled post goes live automatically at its time (±15 min)
- [ ] A nightly backup exists in Cloudinary and has been test-restored into a dev database once

---

### 15.4 Feature → phase index

| Feature | Phase |
|---|---|
| Repo, accounts, GitHub-connected deploys | 0 |
| Design tokens, components, navbar, footer with Admin link, themes | 1 |
| Google OAuth (single admin), JWT cookies, admin shell | 2 |
| Cloudinary uploads, media library, core CMS modules | 3 |
| Home, About, Experience, Projects, Skills, Resume, Contact, SEO basics, revalidation | 4 |
| Case studies, Engineering, What I Built, testimonials, achievements, certifications | 5 |
| Drafts + live preview, contact inbox | 5 |
| Blog + RSS, GitHub integration, ⌘K, `/hire`, skill pages, interactive diagrams, analytics | 6 |
| Revisions, audit log, redirects, scheduled publishing, backups, export/import | 7 |
| Now / Uses / FAQ, announcement banner, final audits | 7 |
