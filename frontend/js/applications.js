/**
 * applications.js — user My Applications page.
 * Depends on: api.js, auth.js, common.js
 */

function pageSetup() {
  window.ui.populateSidebarUser('sidebarName', 'sidebarRole');
  window.ui.initMobileNav();
  window.ui.initLogoutButtons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   MY APPLICATIONS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

async function init() {
  pageSetup();
  window.ui.renderTableSkeletons('applicationsTableBody', 7, 6);

  try {
    const res          = await window.api.applications.my();
    const applications = res.data.applications || [];
    renderApplicationsTable(applications);
  } catch (err) {
    window.ui.showAlert('appsAlert', err?.data?.message || 'Failed to load applications.', 'error');
    document.getElementById('applicationsTableBody').innerHTML = '';
  }
}

function renderApplicationsTable(applications) {
  const tbody = document.getElementById('applicationsTableBody');
  if (!tbody) return;

  if (!applications.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-state__title">No applications yet</div>
          <p class="empty-state__description">You haven't applied to any jobs yet. Browse open positions to get started.</p>
          <a href="/user/jobs.html" class="btn btn--primary btn--sm">Find Jobs</a>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = applications.map(app => {
    const deadlinePassed = window.ui.isDeadlinePassed(app.job_deadline);
    return `
      <tr>
        <td>
          <a href="/user/job-details.html?id=${app.job_id}" style="color:var(--color-accent);font-weight:500;">
            ${window.ui.escapeHtml(app.job_title)}
          </a>
        </td>
        <td>${window.ui.escapeHtml(app.job_company)}</td>
        <td>${window.ui.makeBadge(app.job_employment_type)}</td>
        <td class="muted">${window.ui.formatDate(app.applied_at)}</td>
        <td class="muted" style="${deadlinePassed ? 'color:var(--color-danger) !important;' : ''}">
          ${window.ui.formatDate(app.job_deadline)}${deadlinePassed ? ' (Passed)' : ''}
        </td>
        <td>${window.ui.makeBadge(app.status)}</td>
        <td>
          <a href="/user/job-details.html?id=${app.job_id}" class="btn btn--ghost btn--sm">View Job</a>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── Expose ──────────────────────────────────────────────────────────────── */
window.applicationsPage = { init };
