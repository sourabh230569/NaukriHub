/**
 * api.js — centralised API communication layer.
 * All fetch calls go through here. No other module should call fetch() directly.
 */

// API base URL.
// - Local dev / single-server: leave window.API_URL unset → uses same-origin '/api'.
// - Split deploy (frontend on Vercel, backend on Render): set window.API_URL
//   in config.js to your Render URL, e.g. 'https://naukrihub-api.onrender.com'.
const API_BASE = (window.API_URL ? window.API_URL.replace(/\/$/, '') : '') + '/api';

// ─── Token storage ─────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('jp_token');
}

function setToken(token) {
  localStorage.setItem('jp_token', token);
}

function clearToken() {
  localStorage.removeItem('jp_token');
  localStorage.removeItem('jp_user');
}

// ─── Core request ──────────────────────────────────────────────────────────

async function request(method, path, body = null, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = {
    method,
    headers,
    credentials: 'include',
    ...opts
  };

  if (body !== null) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json().catch(() => ({
    success: false,
    message: 'Invalid response from server.'
  }));

  // Surface HTTP errors as thrown objects so callers can catch them
  if (!response.ok) {
    const err = new Error(data.message || `HTTP ${response.status}`);
    err.status = response.status;
    err.data   = data;
    throw err;
  }

  return data;
}

// ─── Convenience wrappers ──────────────────────────────────────────────────

const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path)         => request('DELETE', path),

  // ── Auth ──────────────────────────────────────────────────────────────
  auth: {
    register: (data)   => request('POST', '/auth/register', data),
    login:    (data)   => request('POST', '/auth/login', data),
    logout:   ()       => request('POST', '/auth/logout'),
    me:       ()       => request('GET',  '/auth/me')
  },

  // ── Jobs ──────────────────────────────────────────────────────────────
  jobs: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
      ).toString();
      return request('GET', `/jobs${qs ? `?${qs}` : ''}`);
    },
    get:    (id)       => request('GET',    `/jobs/${id}`),
    create: (data)     => request('POST',   '/jobs', data),
    update: (id, data) => request('PUT',    `/jobs/${id}`, data),
    delete: (id)       => request('DELETE', `/jobs/${id}`),
    apply:  (jobId)    => request('POST',   `/jobs/${jobId}/apply`)
  },

  // ── Applications (user) ───────────────────────────────────────────────
  applications: {
    my:  ()    => request('GET', '/applications/my'),
    get: (id)  => request('GET', `/applications/${id}`)
  },

  // ── Admin ─────────────────────────────────────────────────────────────
  admin: {
    dashboard:          ()          => request('GET', '/admin/dashboard'),
    jobApplications:    (jobId)     => request('GET', `/admin/jobs/${jobId}/applications`),
    allApplications:    ()          => request('GET', '/admin/applications'),
    updateAppStatus:    (id, status)=> request('PUT', `/admin/applications/${id}/status`, { status })
  },

  // ── User ──────────────────────────────────────────────────────────────
  user: {
    dashboard:   ()     => request('GET', '/user/dashboard'),
    profile:     ()     => request('GET', '/user/profile'),
    updateProfile:(data)=> request('PUT', '/user/profile', data)
  }
};

// Export for use in other modules (non-module scripts use window.api)
window.api       = api;
window.getToken  = getToken;
window.setToken  = setToken;
window.clearToken = clearToken;
