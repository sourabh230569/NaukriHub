# Job Application Portal

A full-stack web application built as an academic project. It provides a complete job application workflow with two user roles: **Admin** and **User**.

---

## Project Overview

JobPortal allows organisations to post job openings and candidates to browse, search, and apply for them. Admins manage the full lifecycle of job listings and can review, shortlist, or reject individual applications. Users receive a personal dashboard showing their application history and current statuses.

---

## Features

### Admin
- Secure login
- Admin dashboard with aggregated statistics (total jobs, open/closed split, total applications)
- Create, view, edit, and delete job listings
- View all applicants per job
- Update application status (Applied, Under Review, Shortlisted, Rejected, Selected)
- View all applications across all jobs

### User
- Register an account and log in securely
- Browse and search jobs (title, company, location, type, status)
- View full job details
- Apply for open jobs (one application per job enforced at DB level)
- Personal dashboard with application statistics
- Track application status across all submissions

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Fetch API |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Authentication | JWT (jsonwebtoken) + bcryptjs password hashing |
| Security | helmet, cors, express-rate-limit |
| Development | nodemon |

---

## Architecture

```
Routes
  ↓
Middleware (auth, role, validation, error)
  ↓
Controllers (HTTP request/response)
  ↓
Services (business logic, SQL queries)
  ↓
Database (SQLite via better-sqlite3)
```

Frontend JS modules follow a similar separation:
- `api.js` — all fetch calls, token management
- `auth.js` — session state, route guards
- `common.js` — shared UI helpers, skeleton loaders, badges
- `validation.js` — client-side form validation
- `admin.js`, `user.js`, `jobs.js`, `applications.js` — page-level logic

---

## Folder Structure

```
job-application-portal/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── terms.html
│   ├── privacy.html
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── create-job.html
│   │   ├── edit-job.html
│   │   ├── job-details.html
│   │   └── applicants.html
│   ├── user/
│   │   ├── dashboard.html
│   │   ├── jobs.html
│   │   ├── job-details.html
│   │   └── applications.html
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── jobs.css
│   │   ├── forms.css
│   │   └── responsive.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── common.js
│       ├── validation.js
│       ├── admin.js
│       ├── user.js
│       ├── jobs.js
│       └── applications.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── config/
│   │   └── database.js
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.js
│   │   └── jobportal.db        ← created on first run
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   └── utils/
├── .gitignore
└── README.md
```

---

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT | Required |
| email | TEXT | Unique |
| password | TEXT | bcrypt hash |
| role | TEXT | 'admin' or 'user' |
| created_at | TEXT | Auto |
| updated_at | TEXT | Auto |

### jobs
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| title | TEXT | Required |
| company | TEXT | Required |
| location | TEXT | Required |
| employment_type | TEXT | Full-time / Part-time / Internship / Contract / Remote |
| description | TEXT | Required |
| requirements | TEXT | Required |
| salary | TEXT | Optional |
| experience | TEXT | Optional |
| application_deadline | TEXT | Required |
| status | TEXT | Open / Closed |
| created_by | INTEGER | FK → users.id |
| created_at | TEXT | Auto |
| updated_at | TEXT | Auto |

### applications
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER | FK → users.id |
| job_id | INTEGER | FK → jobs.id |
| status | TEXT | Applied / Under Review / Shortlisted / Rejected / Selected |
| applied_at | TEXT | Auto |
| updated_at | TEXT | Auto |
| UNIQUE | (user_id, job_id) | Prevents duplicate applications |

---

## API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Jobs
```
GET    /api/jobs                      Public
GET    /api/jobs/:id                  Public
POST   /api/jobs                      Admin only
PUT    /api/jobs/:id                  Admin only
DELETE /api/jobs/:id                  Admin only
POST   /api/jobs/:jobId/apply         User only
```

Supported query params for `GET /api/jobs`:
- `search` — matches title or company
- `location` — partial match
- `type` — exact employment type
- `status` — Open or Closed
- `sort` — newest | oldest | title | company | deadline

### Applications
```
GET /api/applications/my              Authenticated user
GET /api/applications/:id             Authenticated (own record)
```

### Admin
```
GET /api/admin/dashboard
GET /api/admin/jobs/:jobId/applications
GET /api/admin/applications
PUT /api/admin/applications/:id/status
```

### User
```
GET /api/user/dashboard
GET /api/user/profile
PUT /api/user/profile
```

---

## Authentication

- Passwords hashed with **bcryptjs** (12 rounds) before storage.
- Login returns a **JWT** signed with `JWT_SECRET`.
- Token stored in `localStorage` (frontend) and sent as `Authorization: Bearer <token>`.
- Token also set as an **HTTP-only cookie** for added security.
- All protected routes verify the token via `requireAuth` middleware.
- Role-based access enforced via `requireRole('admin')` / `requireRole('user')` middleware.
- Frontend route guards (`requireAdmin`, `requireUser`) redirect unauthorised users client-side, but backend enforcement is the authoritative check.

---

## Authorization

| Action | Admin | User | Unauthenticated |
|---|---|---|---|
| View jobs | Yes | Yes | Yes |
| Apply for job | No | Yes | No |
| Create/Edit/Delete job | Yes | No | No |
| View own applications | No | Yes | No |
| View all applications | Yes | No | No |
| Update application status | Yes | No | No |
| Admin dashboard | Yes | No | No |

---

## Installation

### Prerequisites
- Node.js >= 18
- npm >= 9

### Steps

```bash
# 1. Navigate to the backend directory
cd job-application-portal/backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env and set your own JWT_SECRET and COOKIE_SECRET

# 4. Run the seed script (creates DB + demo data)
npm run seed

# 5. Start the development server
npm run dev
```

The server starts on **http://localhost:5000** by default.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database/jobportal.db
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500
COOKIE_SECRET=change_this_cookie_secret_too
```

Never commit the `.env` file. It is listed in `.gitignore`.

---

## Database Setup

The database is created automatically on first server start via `config/database.js`, which reads and executes `database/schema.sql`.

To populate it with demo data:

```bash
cd backend
npm run seed
```

To reset the database, delete `backend/database/jobportal.db` and re-run the seed command.

---

## Running the Application

### Backend

```bash
cd backend
npm run dev       # Development (nodemon, auto-restart)
npm start         # Production
```

### Frontend

The Express server in `server.js` serves the `frontend/` directory as static files. Once the backend is running, open:

```
http://localhost:5000
```

No separate frontend server is required. All HTML, CSS, and JS files are served by Express.

If you prefer a separate static server during frontend-only development, you can use VS Code Live Server or:

```bash
npx serve ../frontend -p 3000
```

When using a separate frontend server, ensure its origin is listed in `CORS_ORIGIN` in your `.env`.

---

## Demo Credentials

> **Warning:** These are development/demo credentials only. Change all passwords before any real deployment.

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin@123 |
| User | aarav@example.com | User@1234 |
| User | priya@example.com | User@1234 |
| User | rohan@example.com | User@1234 |
| User | sneha@example.com | User@1234 |
| User | karan@example.com | User@1234 |

---

## Seed Data Summary

The seed script creates:
- 1 admin account
- 5 sample users
- 8 job listings across various employment types and companies
- 11 sample applications with varied statuses (Applied, Under Review, Shortlisted, Rejected, Selected)

---

## Security Practices Implemented

- Passwords stored as bcrypt hashes (never plain text)
- All SQL queries use parameterised statements (no string concatenation)
- JWT-based authentication with HTTP-only cookies
- Role-based authorisation enforced on every protected API route
- Input validation on both frontend and backend
- `helmet` sets secure HTTP headers
- `express-rate-limit` on auth endpoints (30 req / 15 min)
- CORS restricted to configured origins
- No stack traces exposed in production error responses
- Secrets stored in `.env`, never committed

---

## Future Improvements

- Email notifications on application status changes
- Resume/CV file upload
- Pagination for large job and application lists
- Admin user management (create/deactivate users)
- Rich text editor for job descriptions
- Saved jobs / bookmarks feature
- Advanced sorting and multi-select filters
- Password reset via email
- Rate limiting on all routes (not just auth)
- Production deployment guide (PM2, Nginx, HTTPS)
