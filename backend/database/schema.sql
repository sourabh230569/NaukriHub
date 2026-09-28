-- Job Application Portal Database Schema
-- SQLite

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  title                 TEXT    NOT NULL,
  company               TEXT    NOT NULL,
  location              TEXT    NOT NULL,
  employment_type       TEXT    NOT NULL CHECK (employment_type IN ('Full-time','Part-time','Internship','Contract','Remote')),
  description           TEXT    NOT NULL,
  requirements          TEXT    NOT NULL,
  salary                TEXT,
  experience            TEXT,
  application_deadline  TEXT    NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed')),
  created_by            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id      INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status      TEXT    NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied','Under Review','Shortlisted','Rejected','Selected')),
  applied_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, job_id)
);

-- Indexes for frequent query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_status          ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by      ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id  ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status  ON applications(status);
