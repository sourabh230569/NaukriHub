-- =============================================================================
-- Seed data for Job Application Portal
-- WARNING: These are DEVELOPMENT / DEMO credentials only.
--          Change ALL passwords before any real deployment.
-- =============================================================================

-- Admin account  (password: Admin@123)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES
  ('System Admin', 'admin@example.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/KZDQJK2',
   'admin');

-- Sample users  (password for all: User@1234)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES
  ('Aarav Sharma',   'aarav@example.com',   '$2a$12$8K1p/a0fR7KxR.7LzK4eJ.nY9E/ZqFjT6tZ1Y8mXnP2qKjG3LuUWi', 'user'),
  ('Priya Mehta',    'priya@example.com',   '$2a$12$8K1p/a0fR7KxR.7LzK4eJ.nY9E/ZqFjT6tZ1Y8mXnP2qKjG3LuUWi', 'user'),
  ('Rohan Gupta',    'rohan@example.com',   '$2a$12$8K1p/a0fR7KxR.7LzK4eJ.nY9E/ZqFjT6tZ1Y8mXnP2qKjG3LuUWi', 'user'),
  ('Sneha Patel',    'sneha@example.com',   '$2a$12$8K1p/a0fR7KxR.7LzK4eJ.nY9E/ZqFjT6tZ1Y8mXnP2qKjG3LuUWi', 'user'),
  ('Karan Singh',    'karan@example.com',   '$2a$12$8K1p/a0fR7KxR.7LzK4eJ.nY9E/ZqFjT6tZ1Y8mXnP2qKjG3LuUWi', 'user');
