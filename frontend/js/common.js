/**
 * common.js — shared UI helpers used across all pages.
 * Depends on: auth.js
 */

// ─── Alert / toast ──────────────────────────────────────────────────────────

/**
 * Show a message in an alert element.
 * @param {string} elementId
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert--${type}`;
  el.textContent = message;
  el.removeAttribute('aria-hidden');
  // Scroll into view smoothly
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = 'alert alert--hidden';
  el.textContent = '';
}

// ─── Button loading state ────────────────────────────────────────────────────

function setButtonLoading(btn, loading, loadingText = 'Loading...') {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getBadgeClass(status) {
  const map = {
    'Open':         'badge--open',
    'Closed':       'badge--closed',
    'Applied':      'badge--applied',
    'Under Review': 'badge--review',
    'Shortlisted':  'badge--shortlisted',
    'Rejected':     'badge--rejected',
    'Selected':     'badge--selected',
    'Full-time':    'badge--fulltime',
    'Part-time':    'badge--parttime',
    'Internship':   'badge--internship',
    'Contract':     'badge--contract',
    'Remote':       'badge--remote'
  };
  return map[status] || '';
}

function makeBadge(text) {
  return `<span class="badge ${getBadgeClass(text)}">${text}</span>`;
}

// ─── Date formatting ─────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

// ─── Skeleton loaders ────────────────────────────────────────────────────────

function renderStatSkeletons(containerId, count = 4) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array(count).fill(0).map(() => `
    <div class="stat-card skeleton">
      <div class="stat-card__label skel-line"></div>
      <div class="stat-card__value skel-line"></div>
    </div>
  `).join('');
}

function renderTableSkeletons(tbodyId, cols = 5, rows = 5) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const widths = ['60%', '40%', '50%', '30%', '45%'];
  tbody.innerHTML = Array(rows).fill(0).map(() => `
    <tr class="table-skeleton">
      ${Array(cols).fill(0).map((_, i) => `
        <td><div class="skel-line" style="width:${widths[i % widths.length]}"></div></td>
      `).join('')}
    </tr>
  `).join('');
}

function renderJobSkeletons(containerId, count = 4) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array(count).fill(0).map(() => `
    <div class="job-card skeleton">
      <div class="skel-line skel-title"></div>
      <div class="skel-line skel-company"></div>
      <div class="skel-line skel-meta"></div>
      <div class="skel-line skel-text"></div>
      <div class="skel-line skel-text2"></div>
      <div class="skel-line skel-btn"></div>
    </div>
  `).join('');
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function renderEmptyState(containerId, title, description, actionHtml = '') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__title">${title}</div>
      <p class="empty-state__description">${description}</p>
      ${actionHtml}
    </div>
  `;
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────

function confirmAction(message) {
  return window.confirm(message);
}

// ─── Navigation ─────────────────────────────────────────────────────────────

/**
 * Mark the active nav link by matching pathname.
 */
function setActiveNav(navId) {
  const nav  = document.getElementById(navId);
  if (!nav) return;
  const path = window.location.pathname;
  nav.querySelectorAll('a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href');
    if (href && (path === href || path.endsWith(href))) {
      a.classList.add('active');
    }
  });
}

/**
 * Populate the user info section in the sidebar.
 */
function populateSidebarUser(nameId, roleId) {
  const user = window.auth.currentUser();
  if (!user) return;
  const nameEl = document.getElementById(nameId);
  const roleEl = document.getElementById(roleId);
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
}

// ─── Hamburger / mobile sidebar ──────────────────────────────────────────────

function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
      if (overlay) overlay.classList.toggle('open', open);
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('open');
      overlay.classList.remove('open');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    });
  }

  // Navbar hamburger (public pages)
  const navHamburger = document.getElementById('navHamburger');
  const mobileMenu   = document.getElementById('mobileMenu');
  if (navHamburger && mobileMenu) {
    navHamburger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      navHamburger.setAttribute('aria-expanded', String(open));
    });
  }
}

// ─── Logout wiring ───────────────────────────────────────────────────────────

function initLogoutButtons() {
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.auth.handleLogout();
    });
  });
}

// ─── Query params ─────────────────────────────────────────────────────────────

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ─── Truncate text ────────────────────────────────────────────────────────────

function truncate(str, maxLen = 120) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

// ─── Escape HTML ─────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Expose globals ──────────────────────────────────────────────────────────

window.ui = {
  showAlert,
  hideAlert,
  setButtonLoading,
  getBadgeClass,
  makeBadge,
  formatDate,
  formatDateTime,
  isDeadlinePassed,
  renderStatSkeletons,
  renderTableSkeletons,
  renderJobSkeletons,
  renderEmptyState,
  confirmAction,
  setActiveNav,
  populateSidebarUser,
  initMobileNav,
  initLogoutButtons,
  getParam,
  truncate,
  escapeHtml
};
