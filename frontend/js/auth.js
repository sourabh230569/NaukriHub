/**
 * auth.js — authentication state management and guards.
 * Depends on: api.js
 */

// ─── Session helpers ────────────────────────────────────────────────────────

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('jp_user'));
  } catch {
    return null;
  }
}

function storeSession(user, token) {
  localStorage.setItem('jp_user', JSON.stringify(user));
  window.setToken(token);
}

function clearSession() {
  window.clearToken();
  localStorage.removeItem('jp_user');
}

function isLoggedIn() {
  return !!window.getToken() && !!getStoredUser();
}

function currentUser() {
  return getStoredUser();
}

function isAdmin() {
  const u = currentUser();
  return u && u.role === 'admin';
}

function isUser() {
  const u = currentUser();
  return u && u.role === 'user';
}

// ─── Route guards ───────────────────────────────────────────────────────────

/**
 * Call at the top of any page that requires authentication.
 * Redirects to login if not authenticated.
 */
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

/**
 * Call at the top of admin-only pages.
 */
function requireAdmin() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  if (!isAdmin()) {
    window.location.href = '/user/dashboard.html';
    return false;
  }
  return true;
}

/**
 * Call at the top of user-only pages.
 */
function requireUser() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  if (!isUser()) {
    window.location.href = '/admin/dashboard.html';
    return false;
  }
  return true;
}

/**
 * Call on login/register pages — redirect away if already logged in.
 */
function redirectIfLoggedIn() {
  if (!isLoggedIn()) return;
  if (isAdmin()) {
    window.location.href = '/admin/dashboard.html';
  } else {
    window.location.href = '/user/dashboard.html';
  }
}

// ─── Login / Register handlers ──────────────────────────────────────────────

async function handleRegister(formData) {
  const data = await window.api.auth.register(formData);
  if (data.success) {
    storeSession(data.data.user, data.data.token);
    window.location.href = '/user/dashboard.html';
  }
  return data;
}

async function handleLogin(email, password) {
  const data = await window.api.auth.login({ email, password });
  if (data.success) {
    storeSession(data.data.user, data.data.token);
    // Redirect based on role
    const params   = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect && !redirect.startsWith('//')) {
      window.location.href = redirect;
    } else if (data.data.user.role === 'admin') {
      window.location.href = '/admin/dashboard.html';
    } else {
      window.location.href = '/user/dashboard.html';
    }
  }
  return data;
}

async function handleLogout() {
  try {
    await window.api.auth.logout();
  } catch (_) {
    // Even if API call fails, clear local session
  } finally {
    clearSession();
    window.location.href = '/login.html';
  }
}

// ─── Expose globals ─────────────────────────────────────────────────────────

window.auth = {
  getStoredUser,
  storeSession,
  clearSession,
  isLoggedIn,
  currentUser,
  isAdmin,
  isUser,
  requireAuth,
  requireAdmin,
  requireUser,
  redirectIfLoggedIn,
  handleRegister,
  handleLogin,
  handleLogout
};
