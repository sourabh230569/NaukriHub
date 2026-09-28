/**
 * config.js — frontend runtime configuration.
 *
 * Loaded BEFORE api.js on every page.
 *
 * ── Single-server / local dev ──────────────────────────────────────────────
 *   Leave API_URL empty (''). The frontend then talks to the same origin
 *   that serves it (e.g. http://localhost:5000/api).
 *
 * ── Split deploy (frontend on Vercel, backend on Render) ────────────────────
 *   Set API_URL to your Render backend base URL, WITHOUT a trailing slash
 *   and WITHOUT '/api'. Example:
 *
 *     window.API_URL = 'https://naukrihub-api.onrender.com';
 *
 *   api.js will automatically append '/api' to it.
 */
window.API_URL = '';
