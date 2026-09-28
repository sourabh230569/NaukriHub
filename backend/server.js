'use strict';

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

// Initialise DB connection (creates schema if needed)
const { getDb } = require('./config/database');
getDb();

// Route modules
const authRoutes        = require('./routes/auth.routes');
const jobRoutes         = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const adminRoutes       = require('./routes/admin.routes');
const userRoutes        = require('./routes/user.routes');

// Error middleware
const { errorHandler } = require('./middleware/error.middleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, file://)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development also allow any localhost
    if (process.env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Body / Cookie parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'fallback_secret'));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Static files (serve frontend) ───────────────────────────────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter,    authRoutes);
app.use('/api/jobs',         generalLimiter, jobRoutes);
app.use('/api/applications', generalLimiter, applicationRoutes);
app.use('/api/admin',        generalLimiter, adminRoutes);
app.use('/api/user',         generalLimiter, userRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Job Portal API is running', timestamp: new Date().toISOString() });
});

// ─── Catch-all: serve frontend index for non-API routes ───────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API route not found' });
  }
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Job Portal API running on http://localhost:${PORT}`);
  console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Frontend    : ${frontendPath}\n`);
});

module.exports = app;
