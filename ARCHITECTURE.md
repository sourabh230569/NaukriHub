# NaukriHub — Complete Architecture & Interview Guide

> A full-stack **Job Application Portal** where admins post jobs and applicants
> browse, apply, and track their applications. Built with **Node.js + Express**
> (backend), **vanilla HTML/CSS/JavaScript** (frontend), and **SQLite** (database).
>
> Live: https://naukrihub-v2gj.onrender.com
> Repo: https://github.com/sourabh230569/NaukriHub

This single document explains **everything** — the architecture, every folder and
file, how a request flows end to end, the database design, security, deployment,
and **exactly what to say in an interview**. Read it top to bottom once, and you
will be able to defend any part of this project.

---

## Table of Contents

1. [What the app does (in one minute)](#1-what-the-app-does)
2. [Tech stack and why each choice](#2-tech-stack)
3. [High-level architecture](#3-high-level-architecture)
4. [The layered backend design](#4-the-layered-backend-design)
5. [Full folder & file breakdown](#5-full-folder--file-breakdown)
6. [Database design](#6-database-design)
7. [Authentication & authorization](#7-authentication--authorization)
8. [Request lifecycle — traced end to end](#8-request-lifecycle)
9. [Complete API reference](#9-complete-api-reference)
10. [Frontend architecture](#10-frontend-architecture)
11. [Security measures](#11-security-measures)
12. [Deployment](#12-deployment)
13. [Interview Q&A — the questions you WILL be asked](#13-interview-qa)
14. [Known limitations & how you'd improve it](#14-limitations--improvements)

---

## 1. What the app does

Two kinds of users:

- **Applicant (role `user`)** — registers, logs in, browses/searches job listings,
  views job details, applies to a job, and tracks the status of their applications
  (Applied → Under Review → Shortlisted → Selected/Rejected). Has a personal
  dashboard with stats.
- **Admin (role `admin`)** — logs in, creates/edits/deletes job postings, sees all
  applicants for each job, and updates each application's status. Has an admin
  dashboard with aggregate stats.

**One-line pitch for an interview:**
"NaukriHub is a full-stack job portal with role-based access control. It has a
REST API built on Express with a clean controller–service–data layering, JWT
authentication, an SQLite database with proper relational constraints, and a
zero-framework frontend that talks to the API through a single centralized
fetch layer."

---

## 2. Tech stack

| Layer | Technology | Why this was chosen |
|---|---|---|
| Runtime | **Node.js (>=18)** | JavaScript on the server; huge ecosystem; single language across the stack. |
| Web framework | **Express 4** | Minimal, unopinionated, industry-standard for REST APIs. |
| Database | **SQLite** via **better-sqlite3** | Zero-config, file-based, no separate DB server. `better-sqlite3` is **synchronous** and very fast for this scale. |
| Auth | **JWT** (`jsonwebtoken`) + **bcryptjs** | Stateless tokens; bcrypt for secure password hashing. |
| Security | **helmet**, **cors**, **express-rate-limit** | Secure HTTP headers, controlled cross-origin access, brute-force protection. |
| Misc | **morgan** (logging), **cookie-parser**, **dotenv** | Request logging, cookie parsing, env-var loading. |
| Frontend | **Vanilla HTML/CSS/JS** | No framework — demonstrates core web fundamentals (DOM, fetch, events). |
| Hosting | **Render** (single web service) | Runs the Node server which serves BOTH the API and the static frontend. |

**Key talking point:** The backend uses **`better-sqlite3`, which is synchronous**.
That means DB calls like `db.prepare(...).get()` return results directly, no
`await` needed. This simplifies the code a lot and is perfectly fine because
SQLite reads/writes are local file operations that complete in microseconds.

---

## 3. High-level architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              BROWSER (Client)                │
                    │  HTML pages + CSS + vanilla JS                │
                    │  - api.js  (single fetch layer)               │
                    │  - auth.js (JWT stored in localStorage)       │
                    │  - page scripts (jobs.js, admin.js, ...)      │
                    └───────────────────┬─────────────────────────┘
                                        │  HTTPS
                                        │  fetch('/api/...') + Bearer token
                                        ▼
        ┌───────────────────────────────────────────────────────────────┐
        │                  EXPRESS SERVER (server.js)                     │
        │                                                                 │
        │  Security → CORS → Rate limit → Body parse → Logging            │
        │                          │                                      │
        │        ┌─────────────────┼──────────────────┐                  │
        │        ▼                 ▼                  ▼                   │
        │   Static files       API routes        Catch-all (SPA-ish)     │
        │   (frontend/)     (/api/auth, /jobs,   → serves index.html      │
        │                    /applications,                               │
        │                    /admin, /user)                               │
        │                          │                                      │
        │   ROUTES → MIDDLEWARE → CONTROLLERS → SERVICES → DATABASE       │
        └──────────────────────────────────┬────────────────────────────┘
                                            ▼
                              ┌──────────────────────────┐
                              │   SQLite  (jobportal.db)  │
                              │   users · jobs ·          │
                              │   applications            │
                              └──────────────────────────┘
```

**The single most important architectural fact:** the frontend and backend are
**one server**. In `server.js`, `app.use(express.static(frontendPath))` serves the
HTML/CSS/JS, and the same Express app also mounts the `/api/*` routes. That's why
the whole thing deploys as **one** Render service and needs no separate frontend
host.

---

## 4. The layered backend design

The backend follows a clean **4-layer separation of concerns**. This is the thing
interviewers love, so understand it well:

```
Route  →  Middleware  →  Controller  →  Service  →  Database
```

| Layer | Responsibility | Does NOT do |
|---|---|---|
| **Route** (`routes/`) | Maps a URL + HTTP method to a chain of middleware + a controller function. | No business logic. |
| **Middleware** (`middleware/`) | Cross-cutting concerns: authentication, role checks, input validation, error handling. | No business logic. |
| **Controller** (`controllers/`) | Reads `req`, calls the right service, shapes the HTTP response, catches errors. | No SQL, no auth logic. |
| **Service** (`services/`) | The actual business logic + all database access (SQL queries). | No knowledge of `req`/`res`. |
| **Utils** (`utils/`) | Small reusable helpers (response formatting, password hashing). | — |

**Why this matters (say this in the interview):**
"Separating controllers from services means my business logic doesn't depend on
Express. If I ever wanted to expose the same logic over GraphQL or a CLI, I'd
reuse the service layer untouched. It also makes the code easy to test and reason
about — each layer has exactly one job."

---

## 5. Full folder & file breakdown

```
job-application-portal/
├── backend/
│   ├── server.js                  ← Express app entry point
│   ├── package.json               ← dependencies + npm scripts
│   ├── .env / .env.example        ← environment variables (secrets)
│   ├── config/
│   │   └── database.js            ← SQLite connection + schema init
│   ├── database/
│   │   ├── schema.sql             ← table definitions (DDL)
│   │   ├── seed.js                ← inserts demo data
│   │   └── seed.sql               ← raw seed SQL (alt)
│   ├── middleware/
│   │   ├── auth.middleware.js     ← JWT verification (requireAuth, optionalAuth)
│   │   ├── role.middleware.js     ← role gate (requireRole)
│   │   ├── validation.middleware.js ← input validation
│   │   └── error.middleware.js    ← global error handler + 404
│   ├── controllers/
│   │   ├── auth.controller.js     ← register/login/logout/me
│   │   ├── job.controller.js      ← job CRUD
│   │   ├── application.controller.js ← apply, my applications
│   │   ├── admin.controller.js    ← admin dashboard + status updates
│   │   └── user.controller.js     ← user dashboard + profile
│   ├── services/
│   │   ├── auth.service.js        ← auth business logic + SQL
│   │   ├── job.service.js         ← job business logic + SQL
│   │   └── application.service.js ← application logic + dashboard aggregates
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── job.routes.js
│   │   ├── application.routes.js
│   │   ├── admin.routes.js
│   │   └── user.routes.js
│   └── utils/
│       ├── password.js            ← bcrypt hash/compare
│       └── response.js            ← sendSuccess / sendError helpers
│
├── frontend/
│   ├── index.html                 ← public landing/browse page
│   ├── login.html / register.html ← auth pages
│   ├── privacy.html / terms.html  ← static content pages
│   ├── css/                       ← modular stylesheets (variables, reset, ...)
│   ├── js/
│   │   ├── config.js              ← sets window.API_URL (backend base URL)
│   │   ├── api.js                 ← ★ centralized fetch layer (all HTTP here)
│   │   ├── auth.js                ← session state + route guards
│   │   ├── common.js              ← shared UI helpers (window.ui)
│   │   ├── validation.js          ← client-side form validation
│   │   ├── jobs.js                ← job listing + detail pages
│   │   ├── admin.js               ← all admin pages
│   │   ├── applications.js        ← user's applications page
│   │   └── user.js                ← user dashboard/profile
│   ├── user/                      ← applicant pages (dashboard, jobs, ...)
│   └── admin/                     ← admin pages (dashboard, create-job, ...)
│
├── render.yaml                    ← Render deployment blueprint
├── vercel.json                    ← (optional) Vercel static-frontend config
├── ARCHITECTURE.md                ← this document
└── README.md
```

### Backend files — what each one actually does

**`server.js` (the entry point).** Boots the app in this exact order:
1. Loads env vars (`dotenv`).
2. Initializes the DB connection (`getDb()` — creates tables if missing).
3. Applies `helmet` (secure headers).
4. Applies **CORS** with an allow-list read from `CORS_ORIGIN`; in development it
   also allows any localhost origin.
5. Applies **rate limiting** — a stricter limiter (30 req / 15 min) on `/api/auth`
   to stop brute-forcing logins, and a general limiter (300 req / 15 min) elsewhere.
6. Parses JSON/URL-encoded bodies (capped at 10kb) and cookies.
7. Logs requests with `morgan`.
8. Serves the `frontend/` folder as static files.
9. Mounts the five API routers.
10. A `/api/health` endpoint for uptime checks.
11. A catch-all `app.get('*')` that returns `index.html` for non-API routes.
12. The global error handler last.
13. `app.listen(PORT)`.

**`config/database.js`.** Creates a **singleton** better-sqlite3 connection (one
connection reused across the app). Sets pragmas: `journal_mode = WAL` (better
concurrency), `foreign_keys = ON` (enforce relationships), `synchronous = NORMAL`.
On first connect it runs `schema.sql` so the tables always exist.

**`middleware/auth.middleware.js`.**
- `extractToken(req)` — pulls the JWT from the `Authorization: Bearer <token>`
  header **or** from a `token` cookie.
- `requireAuth` — verifies the token, then **re-checks the user still exists in the
  DB** (so a deleted user's token is instantly invalid), and attaches
  `req.user = { id, name, email, role }`.
- `optionalAuth` — same idea but never blocks; used on public job routes so a
  logged-in user gets extra data (like `hasApplied`) while guests still see jobs.

**`middleware/role.middleware.js`.** `requireRole('admin')` is a **factory** —
it returns a middleware that checks `req.user.role`. Returns **403** if the role
doesn't match. Must run *after* `requireAuth`.

**`middleware/validation.middleware.js`.** Pure functions that validate request
bodies for register, login, job create/update, and status update. On failure they
return **400** with a friendly message. This is the server-side safety net
(client-side validation can always be bypassed).

**`middleware/error.middleware.js`.** The global error handler. Central place that
turns thrown errors into JSON responses, maps CORS errors to 403, and **never
leaks stack traces** to clients in production.

**Controllers** are thin: read `req`, call a service, send a response via the
`sendSuccess`/`sendError` helpers, and forward unexpected errors to `next(err)`.

**Services** hold the real logic and **all the SQL**:
- `auth.service.js` — `register` (hash password, force role to `'user'`, reject
  duplicate email with 409), `login` (compare bcrypt hash, sign JWT), `getMe`.
  It also has a `safeUser()` helper that **strips the password hash** before
  returning any user object.
- `job.service.js` — list (with dynamic filters + whitelisted sort), get-by-id,
  create, update, delete, and `hasUserApplied`. The list query LEFT JOINs users
  and applications to also return the poster's name and an `application_count`.
- `application.service.js` — apply (with four guards: job exists, job is Open,
  deadline not passed, not already applied), fetch my applications, admin views,
  status updates, and the **dashboard aggregate queries** (counts by status, etc.).

**Utils.** `password.js` wraps bcrypt with 12 salt rounds. `response.js` gives the
whole API a **consistent response shape**: `{ success, message, data? }` or
`{ success:false, message, error? }`.

---

## 6. Database design

Three tables. All timestamps are stored as text via SQLite's `datetime('now')`.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | auto-increment |
| name | TEXT | required |
| email | TEXT | required, **UNIQUE** |
| password | TEXT | **bcrypt hash**, never plaintext |
| role | TEXT | `'admin'` or `'user'`, `CHECK` constraint, default `'user'` |
| created_at / updated_at | TEXT | default `datetime('now')` |

### `jobs`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| title, company, location | TEXT | required |
| employment_type | TEXT | CHECK: Full-time/Part-time/Internship/Contract/Remote |
| description, requirements | TEXT | required |
| salary, experience | TEXT | optional |
| application_deadline | TEXT | required |
| status | TEXT | `'Open'` or `'Closed'`, default `'Open'` |
| created_by | INTEGER FK → users(id) | `ON DELETE CASCADE` |
| created_at / updated_at | TEXT | |

### `applications` (the join table)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users(id) | `ON DELETE CASCADE` |
| job_id | INTEGER FK → jobs(id) | `ON DELETE CASCADE` |
| status | TEXT | Applied/Under Review/Shortlisted/Rejected/Selected |
| applied_at / updated_at | TEXT | |
| — | **UNIQUE(user_id, job_id)** | ★ one application per user per job |

### Relationships
- A user (admin) **posts many** jobs. `jobs.created_by → users.id`.
- A user (applicant) **submits many** applications; a job **receives many**
  applications. `applications` is a classic **many-to-many join** between users
  and jobs, with extra columns (status, timestamps).

### Two design decisions to highlight in an interview
1. **`UNIQUE(user_id, job_id)`** enforces "one application per user per job" **at
   the database level**. Even if the application-code check has a race condition,
   the DB will reject the duplicate. Defense in depth.
2. **`ON DELETE CASCADE`** everywhere — deleting a job automatically deletes its
   applications; deleting a user deletes their jobs and applications. No orphan rows.
3. **Indexes** are created on the columns used in `WHERE`/`JOIN` (status,
   created_by, employment_type, user_id, job_id) so filtering and joining stay fast.

---

## 7. Authentication & authorization

### Registration / Login flow
1. Client POSTs credentials to `/api/auth/register` or `/api/auth/login`.
2. Validation middleware checks the body.
3. Service layer:
   - **Register:** rejects duplicate email (409), hashes the password with bcrypt
     (12 rounds), inserts the user with role forced to `'user'`, signs a JWT.
   - **Login:** looks up the user by email, `bcrypt.compare`s the password, and on
     success signs a JWT. Wrong email and wrong password give the **same** generic
     error ("Invalid email or password") so attackers can't tell which emails exist.
4. The JWT (`{ id, role }`, expires in 7 days) is returned in the JSON body **and**
   set as an httpOnly cookie.

### How the token is used afterwards
- The frontend stores the token in `localStorage` (`jp_token`) and sends it on every
  request as `Authorization: Bearer <token>` (see `api.js`).
- The httpOnly cookie is a secondary mechanism; the primary is the Bearer header.
  **This is why the split frontend/backend deploy works cleanly** — Bearer tokens
  are not subject to third-party-cookie restrictions.

### Authorization (role-based access control)
- `requireAuth` proves *who you are*.
- `requireRole('admin')` / `requireRole('user')` proves *what you're allowed to do*.
- Example chain: `POST /api/jobs` → `requireAuth` → `requireRole('admin')` →
  `validateJob` → `createJob`. A logged-in applicant hitting this gets **403**.

**Interview soundbite:** "Authentication and authorization are separate concerns.
`requireAuth` answers *who are you*; `requireRole` answers *are you allowed*. I keep
them as separate, composable middleware so I can mix and match per route."

---

## 8. Request lifecycle

Let's trace **"an applicant applies to a job"** end to end:

1. **User clicks "Apply Now"** on `/user/job-details.html`.
2. `jobs.js` calls `window.api.jobs.apply(jobId)`.
3. `api.js` sends `POST /api/jobs/:jobId/apply` with the `Authorization: Bearer`
   header and `credentials: 'include'`.
4. **Express receives it.** helmet → CORS → rate limiter → JSON parser → morgan.
5. It matches `job.routes.js`: `router.post('/:jobId/apply', requireAuth, requireRole('user'), appCtrl.applyForJob)`.
6. **`requireAuth`** verifies the JWT and loads the user from the DB → `req.user`.
7. **`requireRole('user')`** confirms the role is `user` (admins can't apply).
8. **`applyForJob` controller** parses `jobId`, calls the service.
9. **`application.service.applyForJob`** runs four guards:
   - job exists? (404 if not)
   - job status is `Open`? (400 if closed)
   - deadline not passed? (400 if passed)
   - not already applied? (409 if duplicate — also guarded by the DB UNIQUE index)
   Then it `INSERT`s the application and returns the full application row.
10. The controller sends `201 { success:true, data:{ application } }`.
11. Back in the browser, `jobs.js` swaps the apply box for a success message.

Every other feature follows the same **Route → Middleware → Controller → Service →
DB → response** path. Once you can narrate this one flow, you understand the whole
backend.

---

## 9. Complete API reference

Base path: `/api`. All responses share the shape `{ success, message, data? }`.

### Auth — `/api/auth`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | public | Create account (role always `user`), returns JWT |
| POST | `/login` | public | Log in, returns JWT |
| POST | `/logout` | public | Clears the auth cookie |
| GET | `/me` | required | Return the current logged-in user |

### Jobs — `/api/jobs`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | optional | List jobs; supports `?search=&location=&type=&status=&sort=` |
| GET | `/:id` | optional | Job details (+ `hasApplied` if a user is logged in) |
| POST | `/` | admin | Create a job |
| PUT | `/:id` | admin | Update a job |
| DELETE | `/:id` | admin | Delete a job (cascades applications) |
| POST | `/:jobId/apply` | user | Apply to a job |

### Applications — `/api/applications`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/my` | user | The logged-in user's own applications |
| GET | `/:id` | required | One application (user: own only; admin: any) |

### Admin — `/api/admin` (entire router is admin-only)
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | Aggregate stats (job counts, total applications, per-job counts) |
| GET | `/jobs/:jobId/applications` | All applicants for a specific job |
| GET | `/applications` | Every application in the system |
| PUT | `/applications/:id/status` | Change an application's status |

### User — `/api/user` (entire router is user-only)
| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | The user's stats + 5 most recent applications |
| GET | `/profile` | The user's profile |
| PUT | `/profile` | Update the user's name |

---

## 10. Frontend architecture

**No framework — pure HTML/CSS/JS.** The design is deliberately modular:

- **`config.js`** sets `window.API_URL`. Empty = talk to the same origin (`/api`).
  Set it to a Render URL for a split deploy. It loads *before* `api.js` on every page.
- **`api.js`** is the **single source of all network calls**. Nothing else in the
  app calls `fetch` directly. It attaches the Bearer token, sets JSON headers,
  throws structured errors on non-2xx responses, and exposes a tidy `window.api`
  object (`api.jobs.list()`, `api.auth.login()`, etc.).
- **`auth.js`** manages session state in `localStorage` and provides **route
  guards**: `requireAuth()`, `requireAdmin()`, `requireUser()`, and
  `redirectIfLoggedIn()`. Each protected page calls the right guard at the top so
  a logged-out user is bounced to login, and a user can't open admin pages.
- **`common.js`** (`window.ui`) — shared UI utilities: alerts, button loading
  states, badge rendering, date formatting, skeleton loaders, empty states,
  mobile nav, and crucially **`escapeHtml()`** used everywhere untrusted text is
  rendered (XSS protection on the client).
- **`validation.js`** (`window.validate`) — client-side form validation for instant
  feedback (the server still re-validates everything).
- **Page scripts** (`jobs.js`, `admin.js`, `applications.js`, `user.js`) contain the
  logic specific to each page and call into `window.api` and `window.ui`.

**Rendering approach:** pages fetch data from the API, then build HTML strings and
inject them into the DOM. Loading states use skeleton placeholders; errors surface
via the shared alert component.

**Interview soundbite:** "I centralized all HTTP in `api.js` so authentication,
error handling, and the base URL live in exactly one place. If I need to add a
retry, a global 401-handler, or change the API host, I touch one file."

---

## 11. Security measures

This project has genuinely thoughtful security — call these out:

1. **Passwords hashed with bcrypt** (12 salt rounds), never stored or returned in
   plaintext. `safeUser()` strips the hash from every response.
2. **JWT** for stateless auth with a 7-day expiry.
3. **Role-based access control** enforced server-side on every protected route.
4. **SQL injection prevention** — *every* query uses **parameterized statements**
   (`db.prepare('... WHERE id = ?').get(id)`). Even the dynamic sort uses a
   **whitelist map**, never string concatenation of user input.
5. **XSS prevention** — all user-generated text is passed through `escapeHtml()`
   before being inserted into the DOM.
6. **helmet** sets secure HTTP headers.
7. **CORS allow-list** — only configured origins may call the API.
8. **Rate limiting** — tighter on auth endpoints to resist brute force.
9. **Request body size cap** (10kb) to blunt payload-based DoS.
10. **Generic auth errors** — login never reveals whether an email exists.
11. **No stack traces leaked** to clients in production (global error handler).
12. **DB-level integrity** — `CHECK` constraints on enums, `UNIQUE` on
    (user_id, job_id), foreign keys with cascade.
13. **User existence re-checked on every authenticated request**, so a deleted
    user's token stops working immediately.

---

## 12. Deployment

**Deployed as a single Render Web Service.** Because Express serves both the API
and the static frontend, one service runs the whole app.

- **Build:** `npm install`
- **Start:** `npm run start:seeded` → runs `node database/seed.js; node server.js`.
  On the free tier there is **no persistent disk**, so the SQLite file is
  re-created on each start. `seed.js` uses `INSERT OR IGNORE`, so re-seeding is
  **idempotent** (no duplicates) and the demo accounts always exist.
- **Env vars on Render:** `NODE_ENV=production`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`,
  `COOKIE_SECRET`, `DATABASE_PATH=./database/jobportal.db`, and `CORS_ORIGIN`.
- **Health check:** `/api/health`.

**Why not Vercel for the backend?** Vercel is serverless — it has no persistent
filesystem, and `better-sqlite3` needs a real file to write to. On Vercel the DB
would reset on every invocation. So the backend runs on Render (a long-lived Node
process). `render.yaml` and `vercel.json` exist in the repo to document both paths,
but the current live deploy is the single Render service.

**Free-tier caveats to mention honestly:**
- The service **sleeps after ~15 minutes** of inactivity; the first request then
  takes ~30–50 seconds to wake (cold start).
- Without a persistent disk, **newly registered users are lost on restart** (the
  seeded demo accounts persist because they're re-inserted at startup). The fix is
  a paid persistent disk or moving to a hosted Postgres.

---

## 13. Interview Q&A

**Q: Walk me through the architecture.**
> "It's a full-stack app. The frontend is vanilla HTML/CSS/JS that talks to a REST
> API through one centralized fetch module. The backend is Express with a clean
> Route → Middleware → Controller → Service → Database layering. Data lives in
> SQLite with three tables — users, jobs, applications — where applications is a
> many-to-many join. Auth is JWT-based with bcrypt-hashed passwords and role-based
> access control. The whole thing is one server, since Express also serves the
> static frontend, and it's deployed on Render."

**Q: Why did you separate controllers and services?**
> "Single responsibility. Controllers only deal with HTTP — reading the request and
> shaping the response. Services hold the business logic and SQL and know nothing
> about Express. That keeps logic testable and reusable, and makes each file easy
> to reason about."

**Q: How does authentication work?**
> "On login I verify the password with bcrypt and sign a JWT containing the user id
> and role. The client stores it and sends it as a Bearer token on each request.
> The `requireAuth` middleware verifies the token and reloads the user from the DB
> so deleted users are rejected immediately. `requireRole` then enforces
> permissions per route."

**Q: How do you prevent SQL injection?**
> "Every query is parameterized with `?` placeholders through better-sqlite3's
> prepared statements. I never concatenate user input into SQL. The one dynamic
> part — sort order — is resolved through a whitelist map, not raw input."

**Q: How do you prevent a user from applying to the same job twice?**
> "Two layers. The service checks for an existing application, and the database has
> a `UNIQUE(user_id, job_id)` constraint as a hard guarantee even under a race."

**Q: Why SQLite? Isn't that a toy database?**
> "For this scale it's ideal — zero config, no separate server, and better-sqlite3
> is extremely fast because it's synchronous and in-process. The schema uses real
> foreign keys, constraints, and indexes, so migrating to Postgres later is mostly
> a driver and connection change; the relational model is already sound."

**Q: What happens when someone applies to a job? (they want the flow)**
> Narrate section 8 — the four service-layer guards are the impressive part.

**Q: What are the weaknesses / what would you improve?**
> See section 14 — always have an honest answer ready. It shows maturity.

**Q: Why is `better-sqlite3` synchronous — doesn't that block Node?**
> "It does block the event loop for the duration of the query, but SQLite queries
> here are local, indexed, and sub-millisecond, so it's a non-issue at this scale.
> The tradeoff buys much simpler code. If I needed high concurrency with heavy
> queries, I'd move to Postgres with an async driver."

**Q: How is the frontend protected if it's just static files?**
> "The frontend guards are UX, not security — they redirect the wrong role away
> from a page. Real enforcement is server-side: every protected API route runs
> `requireAuth` and `requireRole`, so even if someone opens an admin page directly,
> the API refuses their requests with 401/403."

---

## 14. Limitations & improvements

Be ready to volunteer these — interviewers respect self-awareness.

| Limitation | How I'd improve it |
|---|---|
| SQLite resets on free-tier restart | Add a persistent disk, or migrate to hosted **Postgres** (Neon/Supabase). |
| Registration is user-only; admins are seeded | Add an admin-invite flow or a super-admin who can promote users. |
| No pagination on job/application lists | Add `LIMIT`/`OFFSET` (or keyset) pagination + a total count. |
| No resume/file upload on apply | Add file upload to S3-compatible storage and store the URL. |
| No automated tests | Add Jest + supertest for the API and the service layer. |
| Token only expires (no refresh/blacklist) | Add short-lived access tokens + refresh tokens, or a revocation list. |
| No email notifications | Send status-change emails via a provider (SendGrid/SES). |
| Client renders via string templating | For a larger app, move to a component framework (React/Vue). |

---

### One-paragraph summary to memorize

> "NaukriHub is a role-based job portal. Applicants browse and apply to jobs and
> track their status; admins manage jobs and applicants. The backend is Express with
> a Route → Middleware → Controller → Service → DB architecture, JWT auth, bcrypt
> password hashing, and role-based access control. Data is in SQLite with a proper
> relational schema — a users/jobs many-to-many via an applications table with a
> unique constraint and cascading deletes. Security includes parameterized queries,
> output escaping, helmet, CORS, and rate limiting. Express also serves the vanilla
> JS frontend, so it deploys as a single Render service."
