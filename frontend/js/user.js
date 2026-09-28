/**
 * user.js — logic for the user dashboard page.
 * Depends on: api.js, auth.js, common.js
 */

function userSetup() {
  window.ui.populateSidebarUser('sidebarName', 'sidebarRole');
  window.ui.initMobileNav();
  window.ui.initLogoutButtons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   USER DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */

async function initDashboard() {
  userSetup();

  // Personalise greeting
  const user     = window.auth.currentUser();
  const greeting = document.getElementById('dashGreeting');
  if (greeting && user) {
    const hour = new Date().getHours();
    const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    greeting.textContent = `${time}, ${user.name.split(' ')[0]}.`;
  }

  window.ui.renderStatSkeletons('statsGrid', 5);
  window.ui.renderTableSkeletons('recentTableBody', 5, 5);

  try {
    const res   = await window.api.user.dashboard();
    const stats = res.data;
    renderUserStats(stats);
    renderRecentApps(stats.recent_applications || []);
  } catch (err) {
    window.ui.showAlert('dashAlert', err?.data?.message || 'Failed to load dashboard data.', 'error');
    document.getElementById('statsGrid').innerHTML = '';
    document.getElementById('recentTableBody').innerHTML = `
      <tr><td colspan="5" style="text-align:center;padding:var(--space-10);color:var(--color-text-muted);">
        Could not load applications. Please refresh.
      </td></tr>`;
  }
}

function renderUserStats(stats) {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__label">Applications Submitted</div>
      <div class="stat-card__value">${stats.total_applications ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Under Review</div>
      <div class="stat-card__value">${stats.under_review ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Shortlisted</div>
      <div class="stat-card__value">${stats.shortlisted ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Selected</div>
      <div class="stat-card__value">${stats.selected ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Rejected</div>
      <div class="stat-card__value">${stats.rejected ?? 0}</div>
    </div>
  `;
}

function renderRecentApps(apps) {
  const tbody = document.getElementById('recentTableBody');
  if (!tbody) return;

  if (!apps.length) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-state__title">No applications yet</div>
          <p class="empty-state__description">You haven't applied to any jobs yet. Browse open positions to get started.</p>
          <a href="/user/jobs.html" class="btn btn--primary btn--sm">Find Jobs</a>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => `
    <tr>
      <td style="font-weight:500;">${window.ui.escapeHtml(app.job_title)}</td>
      <td>${window.ui.escapeHtml(app.job_company)}</td>
      <td class="muted">${window.ui.formatDate(app.applied_at)}</td>
      <td>${window.ui.makeBadge(app.status)}</td>
      <td>
        <a href="/user/job-details.html?id=${app.job_id}" class="btn btn--ghost btn--sm">View Job</a>
      </td>
    </tr>
  `).join('');
}

/* ── Expose ──────────────────────────────────────────────────────────────── */
window.userPages = { initDashboard };
