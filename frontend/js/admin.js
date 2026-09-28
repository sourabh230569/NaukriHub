/**
 * admin.js — logic for all admin pages.
 * Depends on: api.js, auth.js, common.js, validation.js
 */

/* ── Shared setup run on every admin page ──────────────────────────────────── */

function adminSetup() {
  window.ui.populateSidebarUser('sidebarName', 'sidebarRole');
  window.ui.initMobileNav();
  window.ui.initLogoutButtons();
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════ */

async function initDashboard() {
  adminSetup();
  window.ui.renderStatSkeletons('statsGrid', 4);
  window.ui.renderTableSkeletons('jobsTableBody', 8, 6);

  try {
    const res   = await window.api.admin.dashboard();
    const stats = res.data;
    renderStats(stats);
    renderJobsTable(stats.jobs || []);
  } catch (err) {
    window.ui.showAlert('dashAlert', err?.data?.message || 'Failed to load dashboard data.', 'error');
    document.getElementById('statsGrid').innerHTML = '';
    document.getElementById('jobsTableBody').innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:var(--space-10);color:var(--color-text-muted);">
        Could not load jobs. Please refresh the page.
      </td></tr>`;
  }
}

function renderStats(stats) {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__label">Total Jobs</div>
      <div class="stat-card__value">${stats.total_jobs ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Open Jobs</div>
      <div class="stat-card__value">${stats.open_jobs ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Closed Jobs</div>
      <div class="stat-card__value">${stats.closed_jobs ?? 0}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Total Applications</div>
      <div class="stat-card__value">${stats.total_applications ?? 0}</div>
    </div>
  `;
}

function renderJobsTable(jobs) {
  const tbody = document.getElementById('jobsTableBody');
  if (!tbody) return;

  if (!jobs.length) {
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-state__title">No jobs yet</div>
          <p class="empty-state__description">Create your first job to get started.</p>
          <a href="/admin/create-job.html" class="btn btn--primary btn--sm">Create Job</a>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = jobs.map(job => `
    <tr>
      <td>
        <a href="/admin/job-details.html?id=${job.id}" style="color:var(--color-accent);font-weight:500;">
          ${window.ui.escapeHtml(job.title)}
        </a>
      </td>
      <td>${window.ui.escapeHtml(job.company)}</td>
      <td>${window.ui.escapeHtml(job.location)}</td>
      <td>${window.ui.makeBadge(job.employment_type)}</td>
      <td style="font-weight:600;">${job.application_count}</td>
      <td>${window.ui.makeBadge(job.status)}</td>
      <td class="muted">${window.ui.formatDate(job.application_deadline)}</td>
      <td>
        <div class="table-actions">
          <a href="/admin/job-details.html?id=${job.id}" class="btn btn--ghost btn--sm">View</a>
          <a href="/admin/edit-job.html?id=${job.id}" class="btn btn--secondary btn--sm">Edit</a>
          <a href="/admin/applicants.html?jobId=${job.id}" class="btn btn--secondary btn--sm">Applicants</a>
          <button class="btn btn--danger btn--sm" onclick="window.adminPages.deleteJob(${job.id}, this)">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function deleteJob(jobId, btn) {
  if (!window.ui.confirmAction('Delete this job? This will also remove all associated applications.')) return;
  const origText = btn.textContent;
  btn.textContent = 'Deleting...';
  btn.disabled = true;
  try {
    await window.api.jobs.delete(jobId);
    // Remove the table row
    const row = btn.closest('tr');
    if (row) row.remove();
    window.ui.showAlert('dashAlert', 'Job deleted successfully.', 'success');
    // Refresh stats
    const res = await window.api.admin.dashboard();
    renderStats(res.data);
  } catch (err) {
    window.ui.showAlert('dashAlert', err?.data?.message || 'Failed to delete job.', 'error');
    btn.textContent = origText;
    btn.disabled = false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE JOB
   ═══════════════════════════════════════════════════════════════════════════ */

function initCreateJob() {
  adminSetup();

  // Set min date on deadline to today
  const deadlineInput = document.getElementById('application_deadline');
  if (deadlineInput) {
    deadlineInput.min = new Date().toISOString().split('T')[0];
  }

  const form = document.getElementById('createJobForm');
  const btn  = document.getElementById('createJobBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    window.ui.hideAlert('createJobAlert');
    window.validate.clearFieldErrors();

    const data = getJobFormData();
    const { valid, errors } = window.validate.validateJobForm(data);
    if (!valid) {
      window.validate.showFieldErrors(errors);
      return;
    }

    window.ui.setButtonLoading(btn, true, 'Creating...');
    try {
      const res = await window.api.jobs.create(data);
      window.ui.showAlert('createJobAlert', 'Job created successfully. Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = `/admin/job-details.html?id=${res.data.job.id}`;
      }, 1000);
    } catch (err) {
      const msg = err?.data?.message || 'Failed to create job. Please try again.';
      window.ui.showAlert('createJobAlert', msg, 'error');
    } finally {
      window.ui.setButtonLoading(btn, false);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDIT JOB
   ═══════════════════════════════════════════════════════════════════════════ */

async function initEditJob() {
  adminSetup();

  const jobId = window.ui.getParam('id');
  if (!jobId) {
    window.location.href = '/admin/dashboard.html';
    return;
  }

  try {
    const res = await window.api.jobs.get(jobId);
    const job = res.data.job;

    document.getElementById('editPageTitle').textContent = `Edit: ${job.title}`;
    document.title = `Edit: ${job.title} — JobPortal Admin`;

    // Hide skeleton, show form
    document.getElementById('formSkeleton').style.display = 'none';
    const form = document.getElementById('editJobForm');
    form.style.display = '';

    // Populate form fields
    setField('title',                job.title);
    setField('company',              job.company);
    setField('location',             job.location);
    setField('employment_type',      job.employment_type);
    setField('salary',               job.salary || '');
    setField('experience',           job.experience || '');
    setField('application_deadline', job.application_deadline ? job.application_deadline.split('T')[0] : '');
    setField('status',               job.status);
    setField('description',          job.description);
    setField('requirements',         job.requirements);

    const btn = document.getElementById('saveJobBtn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      window.ui.hideAlert('editJobAlert');
      window.validate.clearFieldErrors();

      const data = getJobFormData();
      const { valid, errors } = window.validate.validateJobForm(data);
      if (!valid) {
        window.validate.showFieldErrors(errors);
        return;
      }

      window.ui.setButtonLoading(btn, true, 'Saving...');
      try {
        await window.api.jobs.update(jobId, data);
        window.ui.showAlert('editJobAlert', 'Job updated successfully.', 'success');
      } catch (err) {
        window.ui.showAlert('editJobAlert', err?.data?.message || 'Failed to update job.', 'error');
      } finally {
        window.ui.setButtonLoading(btn, false);
      }
    });

  } catch (err) {
    document.getElementById('formSkeleton').style.display = 'none';
    window.ui.showAlert('editJobAlert', err?.data?.message || 'Failed to load job details.', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOB DETAILS (admin view)
   ═══════════════════════════════════════════════════════════════════════════ */

async function initJobDetails() {
  adminSetup();

  const jobId = window.ui.getParam('id');
  if (!jobId) {
    window.location.href = '/admin/dashboard.html';
    return;
  }

  try {
    const res = await window.api.jobs.get(jobId);
    const job = res.data.job;

    document.title = `${job.title} — JobPortal Admin`;
    renderJobDetailAdmin(job);
  } catch (err) {
    window.ui.showAlert('pageAlert', err?.data?.message || 'Failed to load job details.', 'error');
    document.getElementById('jobDetailContent').innerHTML = '';
  }
}

function renderJobDetailAdmin(job) {
  const container = document.getElementById('jobDetailContent');
  if (!container) return;

  const deadlinePassed = window.ui.isDeadlinePassed(job.application_deadline);

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-4);flex-wrap:wrap;margin-bottom:var(--space-6);">
      <div>
        <h1 style="font-size:var(--text-2xl);margin-bottom:var(--space-2);">${window.ui.escapeHtml(job.title)}</h1>
        <div style="font-size:var(--text-base);color:var(--color-text-muted);">${window.ui.escapeHtml(job.company)}</div>
      </div>
      <div class="table-actions">
        <a href="/admin/edit-job.html?id=${job.id}" class="btn btn--secondary">Edit Job</a>
        <a href="/admin/applicants.html?jobId=${job.id}" class="btn btn--primary">View Applicants (${job.application_count})</a>
        <button class="btn btn--danger" id="deleteBtn">Delete Job</button>
      </div>
    </div>

    <div class="job-detail__main">
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
          <span class="job-detail__meta-value" style="${deadlinePassed ? 'color:var(--color-danger);' : ''}">${window.ui.formatDate(job.application_deadline)}${deadlinePassed ? ' (Passed)' : ''}</span>
        </div>
        <div class="job-detail__meta-item">
          <span class="job-detail__meta-label">Applications</span>
          <span class="job-detail__meta-value" style="font-weight:700;">${job.application_count}</span>
        </div>
        <div class="job-detail__meta-item">
          <span class="job-detail__meta-label">Posted</span>
          <span class="job-detail__meta-value">${window.ui.formatDate(job.created_at)}</span>
        </div>
      </div>

      <div class="job-detail__section">
        <h3>Description</h3>
        <p>${window.ui.escapeHtml(job.description)}</p>
      </div>

      <div class="job-detail__section">
        <h3>Requirements</h3>
        <p>${window.ui.escapeHtml(job.requirements)}</p>
      </div>
    </div>
  `;

  document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!window.ui.confirmAction('Delete this job and all its applications?')) return;
    const btn = document.getElementById('deleteBtn');
    btn.textContent = 'Deleting...';
    btn.disabled = true;
    try {
      await window.api.jobs.delete(job.id);
      window.location.href = '/admin/dashboard.html';
    } catch (err) {
      window.ui.showAlert('pageAlert', err?.data?.message || 'Failed to delete job.', 'error');
      btn.textContent = 'Delete Job';
      btn.disabled = false;
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICANTS
   ═══════════════════════════════════════════════════════════════════════════ */

async function initApplicants() {
  adminSetup();
  window.ui.renderTableSkeletons('applicantsTableBody', 6, 5);

  const jobId = window.ui.getParam('jobId');

  // Update back link and title if filtering by job
  if (jobId) {
    const backLink = document.getElementById('backLink');
    if (backLink) backLink.href = `/admin/job-details.html?id=${jobId}`;
  }

  try {
    let applications;
    if (jobId) {
      const res = await window.api.admin.jobApplications(jobId);
      applications = res.data.applications;
      // Fetch job name for page title
      try {
        const jobRes = await window.api.jobs.get(jobId);
        const titleEl = document.getElementById('applicantsPageTitle');
        const subEl   = document.getElementById('applicantsPageSub');
        if (titleEl) titleEl.textContent = `Applicants: ${jobRes.data.job.title}`;
        if (subEl)   subEl.textContent   = `${applications.length} application${applications.length !== 1 ? 's' : ''} received`;
        document.title = `Applicants: ${jobRes.data.job.title} — JobPortal Admin`;
      } catch (_) { /* ignore */ }
    } else {
      const res = await window.api.admin.allApplications();
      applications = res.data.applications;
      const subEl = document.getElementById('applicantsPageSub');
      if (subEl) subEl.textContent = `${applications.length} total application${applications.length !== 1 ? 's' : ''}`;
    }

    renderApplicantsTable(applications);
  } catch (err) {
    window.ui.showAlert('applicantsAlert', err?.data?.message || 'Failed to load applications.', 'error');
    document.getElementById('applicantsTableBody').innerHTML = '';
  }
}

function renderApplicantsTable(applications) {
  const tbody = document.getElementById('applicantsTableBody');
  if (!tbody) return;

  if (!applications.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-state__title">No applications yet</div>
          <p class="empty-state__description">This job has not received any applications yet.</p>
        </div>
      </td></tr>`;
    return;
  }

  const statusOptions = ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Selected'];

  tbody.innerHTML = applications.map(app => `
    <tr id="app-row-${app.id}">
      <td style="font-weight:500;">${window.ui.escapeHtml(app.applicant_name)}</td>
      <td class="muted">${window.ui.escapeHtml(app.applicant_email)}</td>
      <td>
        <a href="/admin/job-details.html?id=${app.job_id}" style="color:var(--color-accent);">
          ${window.ui.escapeHtml(app.job_title)}
        </a>
        <div style="font-size:var(--text-xs);color:var(--color-text-light);">${window.ui.escapeHtml(app.job_company)}</div>
      </td>
      <td class="muted">${window.ui.formatDate(app.applied_at)}</td>
      <td>
        <span class="badge ${window.ui.getBadgeClass(app.status)}" id="app-badge-${app.id}">${app.status}</span>
      </td>
      <td>
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <select class="form-select" style="height:32px;font-size:var(--text-xs);padding:0 var(--space-2);width:140px;"
            id="status-select-${app.id}" aria-label="Update status for ${window.ui.escapeHtml(app.applicant_name)}">
            ${statusOptions.map(s => `<option value="${s}" ${s === app.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn--primary btn--sm"
            onclick="window.adminPages.updateStatus(${app.id}, this)"
            data-app-id="${app.id}">Update</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function updateStatus(appId, btn) {
  const select  = document.getElementById(`status-select-${appId}`);
  const newStatus = select ? select.value : null;
  if (!newStatus) return;

  window.ui.setButtonLoading(btn, true, 'Saving...');
  try {
    const res = await window.api.admin.updateAppStatus(appId, newStatus);
    const updated = res.data.application;
    // Update badge in-place
    const badge = document.getElementById(`app-badge-${appId}`);
    if (badge) {
      badge.textContent = updated.status;
      badge.className = `badge ${window.ui.getBadgeClass(updated.status)}`;
    }
    window.ui.showAlert('applicantsAlert', 'Status updated successfully.', 'success');
  } catch (err) {
    window.ui.showAlert('applicantsAlert', err?.data?.message || 'Failed to update status.', 'error');
  } finally {
    window.ui.setButtonLoading(btn, false);
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function getJobFormData() {
  return {
    title:                document.getElementById('title')?.value.trim()               || '',
    company:              document.getElementById('company')?.value.trim()             || '',
    location:             document.getElementById('location')?.value.trim()            || '',
    employment_type:      document.getElementById('employment_type')?.value            || '',
    description:          document.getElementById('description')?.value.trim()         || '',
    requirements:         document.getElementById('requirements')?.value.trim()        || '',
    salary:               document.getElementById('salary')?.value.trim()              || '',
    experience:           document.getElementById('experience')?.value.trim()          || '',
    application_deadline: document.getElementById('application_deadline')?.value       || '',
    status:               document.getElementById('status')?.value                     || 'Open'
  };
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value || '';
}

/* ── Expose ──────────────────────────────────────────────────────────────── */

window.adminPages = {
  initDashboard,
  initCreateJob,
  initEditJob,
  initJobDetails,
  initApplicants,
  deleteJob,
  updateStatus
};
