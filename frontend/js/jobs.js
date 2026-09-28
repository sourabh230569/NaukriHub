/**
 * jobs.js — job listing (browse/search) and job detail pages.
 * Depends on: api.js, auth.js, common.js
 *
 * Works for both authenticated users (with apply button) and
 * unauthenticated visitors (browse only).
 */

/* ── Setup ─────────────────────────────────────────────────────────────────── */

function pageSetup() {
  window.ui.populateSidebarUser('sidebarName', 'sidebarRole');
  window.ui.initMobileNav();
  window.ui.initLogoutButtons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB LISTING PAGE  (/user/jobs.html)
   ═══════════════════════════════════════════════════════════════════════════ */

function init() {
  pageSetup();

  // Pre-fill filters from URL query params (allows linking to filtered views)
  const params = new URLSearchParams(window.location.search);
  ['search', 'location', 'type', 'status', 'sort'].forEach(key => {
    const el = document.getElementById(key);
    if (el && params.get(key)) el.value = params.get(key);
  });

  loadJobs();

  // Filter form
  const form = document.getElementById('filterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadJobs();
    });
  }

  // Clear button
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const f = document.getElementById('filterForm');
      if (f) f.reset();
      // Reset status to Open as a sensible default
      const statusEl = document.getElementById('status');
      if (statusEl) statusEl.value = 'Open';
      loadJobs();
    });
  }
}

async function loadJobs() {
  window.ui.renderJobSkeletons('jobsList', 5);
  window.ui.hideAlert('jobsAlert');

  const params = {
    search:   document.getElementById('search')?.value.trim()   || '',
    location: document.getElementById('location')?.value.trim() || '',
    type:     document.getElementById('type')?.value            || '',
    status:   document.getElementById('status')?.value          || '',
    sort:     document.getElementById('sort')?.value            || 'newest'
  };

  try {
    const res  = await window.api.jobs.list(params);
    const jobs = res.data.jobs || [];

    // Update results meta
    const meta = document.getElementById('resultsMeta');
    if (meta) {
      meta.textContent = jobs.length
        ? `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`
        : '';
    }

    renderJobCards(jobs);
  } catch (err) {
    document.getElementById('jobsList').innerHTML = '';
    window.ui.showAlert('jobsAlert', err?.data?.message || 'Failed to load jobs. Please try again.', 'error');
  }
}

function renderJobCards(jobs) {
  const container = document.getElementById('jobsList');
  if (!container) return;

  if (!jobs.length) {
    window.ui.renderEmptyState(
      'jobsList',
      'No jobs found',
      'Try adjusting your search or filters to find open positions.',
      '<a href="#" onclick="document.getElementById(\'clearFilters\').click();return false;" class="btn btn--secondary btn--sm">Clear filters</a>'
    );
    return;
  }

  const isLoggedIn = window.auth.isLoggedIn();
  const isUser     = window.auth.isUser();

  container.innerHTML = `<div class="jobs-list">${jobs.map(job => buildJobCard(job, isLoggedIn, isUser)).join('')}</div>`;
}

function buildJobCard(job, isLoggedIn, isUser) {
  const deadlinePassed = window.ui.isDeadlinePassed(job.application_deadline);
  const isClosed       = job.status === 'Closed' || deadlinePassed;

  return `
    <article class="job-card" aria-label="${window.ui.escapeHtml(job.title)} at ${window.ui.escapeHtml(job.company)}">
      <div class="job-card__header">
        <div>
          <h2 class="job-card__title">
            <a href="/user/job-details.html?id=${job.id}" style="color:inherit;">${window.ui.escapeHtml(job.title)}</a>
          </h2>
          <div class="job-card__company">${window.ui.escapeHtml(job.company)}</div>
        </div>
        ${window.ui.makeBadge(job.status)}
      </div>

      <div class="job-card__meta">
        <span>${window.ui.escapeHtml(job.location)}</span>
        <span>${window.ui.makeBadge(job.employment_type)}</span>
        ${job.salary ? `<span>${window.ui.escapeHtml(job.salary)}</span>` : ''}
        ${job.experience ? `<span>${window.ui.escapeHtml(job.experience)}</span>` : ''}
      </div>

      <p class="job-card__excerpt">${window.ui.escapeHtml(window.ui.truncate(job.description, 160))}</p>

      <div class="job-card__footer">
        <div class="job-card__tags">
          <span class="job-card__deadline">Deadline: ${window.ui.formatDate(job.application_deadline)}${deadlinePassed ? ' (Passed)' : ''}</span>
          ${job.application_count > 0 ? `<span style="font-size:var(--text-xs);color:var(--color-text-light);">${job.application_count} applicant${job.application_count !== 1 ? 's' : ''}</span>` : ''}
        </div>
        <a href="/user/job-details.html?id=${job.id}" class="btn btn--${isClosed ? 'secondary' : 'primary'} btn--sm">
          ${isClosed ? 'View Details' : 'View & Apply'}
        </a>
      </div>
    </article>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB DETAIL PAGE  (/user/job-details.html)
   ═══════════════════════════════════════════════════════════════════════════ */

async function initDetail() {
  pageSetup();

  const jobId = window.ui.getParam('id');
  if (!jobId) {
    window.location.href = '/user/jobs.html';
    return;
  }

  try {
    const res      = await window.api.jobs.get(jobId);
    const job      = res.data.job;
    const hasApplied = res.data.hasApplied;

    document.title = `${job.title} — JobPortal`;
    renderJobDetail(job, hasApplied);
  } catch (err) {
    window.ui.showAlert('pageAlert', err?.data?.message || 'Failed to load job details.', 'error');
    document.getElementById('jobDetailContent').innerHTML = '';
  }
}

function renderJobDetail(job, hasApplied) {
  const container = document.getElementById('jobDetailContent');
  if (!container) return;

  const deadlinePassed = window.ui.isDeadlinePassed(job.application_deadline);
  const isClosed       = job.status === 'Closed' || deadlinePassed;
  const isLoggedIn     = window.auth.isLoggedIn();
  const isUser         = window.auth.isUser();

  let applyBoxContent = '';

  if (!isLoggedIn) {
    applyBoxContent = `
      <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">Log in to apply for this position.</p>
      <a href="/login.html?redirect=/user/job-details.html?id=${job.id}" class="btn btn--primary btn--full">Log In to Apply</a>
      <p style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:var(--space-3);text-align:center;">No account? <a href="/register.html" style="color:var(--color-accent);">Register here</a></p>
    `;
  } else if (!isUser) {
    applyBoxContent = `<p style="font-size:var(--text-sm);color:var(--color-text-muted);">Admins cannot apply for jobs.</p>`;
  } else if (isClosed) {
    applyBoxContent = `
      <div class="alert alert--warning" style="margin-bottom:0;">
        ${job.status === 'Closed' ? 'Applications for this position are closed.' : 'The application deadline has passed.'}
      </div>
    `;
  } else if (hasApplied) {
    applyBoxContent = `
      <div class="alert alert--success" style="margin-bottom:0;">
        You have already applied for this position.
      </div>
      <a href="/user/applications.html" class="btn btn--secondary btn--full" style="margin-top:var(--space-4);">View My Applications</a>
    `;
  } else {
    applyBoxContent = `
      <div id="applyAlert" class="alert alert--hidden" role="alert" aria-live="polite"></div>
      <button class="btn btn--primary btn--full" id="applyBtn">Apply Now</button>
      <p style="font-size:var(--text-xs);color:var(--color-text-light);margin-top:var(--space-3);text-align:center;">
        Deadline: ${window.ui.formatDate(job.application_deadline)}
      </p>
    `;
  }

  container.innerHTML = `
    <div class="job-detail__layout">
      <div class="job-detail__main">
        <h1 class="job-detail__title">${window.ui.escapeHtml(job.title)}</h1>
        <div class="job-detail__company">${window.ui.escapeHtml(job.company)}</div>

        <div class="job-detail__meta-row">
          <div class="job-detail__meta-item">
            <span class="job-detail__meta-label">Location</span>
            <span class="job-detail__meta-value">${window.ui.escapeHtml(job.location)}</span>
          </div>
          <div class="job-detail__meta-item">
            <span class="job-detail__meta-label">Type</span>
            <span class="job-detail__meta-value">${window.ui.makeBadge(job.employment_type)}</span>
          </div>
          <div class="job-detail__meta-item">
            <span class="job-detail__meta-label">Status</span>
            <span class="job-detail__meta-value">${window.ui.makeBadge(job.status)}</span>
          </div>
          ${job.salary ? `
          <div class="job-detail__meta-item">
            <span class="job-detail__meta-label">Salary</span>
            <span class="job-detail__meta-value">${window.ui.escapeHtml(job.salary)}</span>
          </div>` : ''}
          ${job.experience ? `
          <div class="job-detail__meta-item">
            <span class="job-detail__meta-label">Experience</span>
            <span class="job-detail__meta-value">${window.ui.escapeHtml(job.experience)}</span>
          </div>` : ''}
          <div class="job-detail__meta-item">
            <span class="job-detail__meta-label">Deadline</span>
            <span class="job-detail__meta-value" style="${deadlinePassed ? 'color:var(--color-danger);' : ''}">
              ${window.ui.formatDate(job.application_deadline)}${deadlinePassed ? ' (Passed)' : ''}
            </span>
          </div>
        </div>

        <div class="job-detail__section">
          <h3>Job Description</h3>
          <p>${window.ui.escapeHtml(job.description)}</p>
        </div>

        <div class="job-detail__section">
          <h3>Requirements</h3>
          <p>${window.ui.escapeHtml(job.requirements)}</p>
        </div>
      </div>

      <div class="job-detail__sidebar">
        <div class="job-apply-box">
          <div class="job-apply-box__title">Apply for this role</div>
          ${applyBoxContent}
        </div>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);">
          Posted ${window.ui.formatDate(job.created_at)}
        </div>
      </div>
    </div>
  `;

  // Wire apply button
  const applyBtn = document.getElementById('applyBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => applyForJob(job.id, applyBtn));
  }
}

async function applyForJob(jobId, btn) {
  window.ui.setButtonLoading(btn, true, 'Submitting...');
  window.ui.hideAlert('applyAlert');

  try {
    await window.api.jobs.apply(jobId);
    // Replace apply box content with success message
    const applyBox = btn.closest('.job-apply-box');
    if (applyBox) {
      applyBox.innerHTML = `
        <div class="job-apply-box__title">Apply for this role</div>
        <div class="alert alert--success" style="margin-bottom:var(--space-4);">Application submitted successfully.</div>
        <a href="/user/applications.html" class="btn btn--secondary btn--full">View My Applications</a>
      `;
    }
  } catch (err) {
    const msg = err?.data?.message || 'Failed to submit application. Please try again.';
    window.ui.showAlert('applyAlert', msg, 'error');
    window.ui.setButtonLoading(btn, false);
  }
}

/* ── Expose ──────────────────────────────────────────────────────────────── */
window.jobsPage = { init, initDetail };
