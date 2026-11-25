/**
 * AFOSTECH Admin Dashboard Controller
 */
const AdminState = {
  token: null,
  staffUser: null,
  section: 'overview',
  data: {
    stats: {},
    partnershipRequests: [],
    verificationDispatches: [],
    innovators: [],
    investorInquiries: [],
    universities: [],
    projects: [],
    theses: [],
    news: [],
    feedPosts: [],
    marketplaceOrders: [],
    appAccounts: []
  }
};

const SECTION_META = {
  overview: ['Overview & Consortium Analytics', 'Live KPIs across Web Portal, Phone App, and Marketplace'],
  verifications: ['Enrollments & Member Verification', 'Authenticate student admissions, Board of Honour & App accounts'],
  partnerships: ['University Partnership Inquiries', 'Inspect uploaded dean request letters & commission partner chapters'],
  catalog: ['Innovations & Theses Moderation', 'Spotlight flagship prototypes & manage open-access research'],
  marketplace: ['Marketplace Orders & Revenue Ledger', 'Track 85% Innovator / 15% Consortium split & dispatch orders'],
  community: ['Food Feed & Consortium Bulletins', 'Moderate community feed posts & publish official announcements']
};

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showAdminToast(msg) {
  const c = document.getElementById('adminToastContainer');
  if (!c) return;
  const el = document.createElement('div');
  el.className = 'admin-toast';
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { el.remove(); }, 3400);
}

async function adminApi(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(AdminState.token ? { Authorization: 'Bearer ' + AdminState.token } : {}),
    ...(options.headers || {})
  };
  const resp = await fetch(url, { credentials: 'same-origin', ...options, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data.error || `Request failed (${resp.status})`);
    err.status = resp.status;
    throw err;
  }
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    AdminState.token = localStorage.getItem('afostech_auth_token');
  } catch (e) {}

  const feedLink = document.getElementById('adminOpenFeedLink');
  if (feedLink && window.location.pathname.startsWith('/portal/')) {
    feedLink.href = '/index.html';
  }

  await verifyStaffAndLoad();
});

async function verifyStaffAndLoad() {
  try {
    const me = await adminApi('/api/auth/me');
    if (!me.user || me.user.role !== 'staff') {
      showAuthGate();
      return;
    }
    AdminState.staffUser = me.user;
    await refreshAdminData();
    showShell();
  } catch (e) {
    showAuthGate();
  }
}

function showAuthGate() {
  document.getElementById('adminAuthGate').style.display = 'flex';
  document.getElementById('adminShell').style.display = 'none';
}

function showShell() {
  document.getElementById('adminAuthGate').style.display = 'none';
  document.getElementById('adminShell').style.display = 'flex';
  const pill = document.getElementById('adminStaffPill');
  if (pill && AdminState.staffUser) {
    pill.textContent = `🛡️ ${AdminState.staffUser.name}`;
  }
  renderAdminSection();
}

function fillAdminDemo(email, pwd) {
  document.getElementById('adminEmail').value = email;
  document.getElementById('adminPassword').value = pwd;
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  try {
    const res = await adminApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (!res.user || res.user.role !== 'staff') {
      showAdminToast('🔒 Access Denied: Only AFOSTECH Staff Officials can access the Admin Dashboard.');
      return;
    }
    AdminState.token = res.token;
    AdminState.staffUser = res.user;
    localStorage.setItem('afostech_auth_token', res.token);
    if (res.appToken) localStorage.setItem('afostech_app_token', res.appToken);
    await refreshAdminData();
    showShell();
    showAdminToast(`🛡️ Welcome, ${res.user.name}`);
  } catch (err) {
    showAdminToast('⚠️ ' + err.message);
  }
}

async function handleAdminLogout() {
  try { await adminApi('/api/auth/logout', { method: 'POST' }); } catch (e) {}
  AdminState.token = null;
  AdminState.staffUser = null;
  localStorage.removeItem('afostech_auth_token');
  localStorage.removeItem('afostech_app_token');
  showAuthGate();
  showAdminToast('Signed out of Admin Dashboard.');
}

async function refreshAdminData() {
  try {
    const data = await adminApi('/api/staff/dashboard');
    AdminState.data = data;
    updateSidebarBadges();
    renderAdminSection();
  } catch (err) {
    if (err.status === 401 || err.status === 403) showAuthGate();
    else showAdminToast('⚠️ ' + err.message);
  }
}

function updateSidebarBadges() {
  const s = AdminState.data.stats || {};
  const bVer = document.getElementById('badgePendingVerifications');
  const bPart = document.getElementById('badgePendingPartnerships');
  if (bVer) {
    bVer.textContent = s.pendingVerifications || 0;
    bVer.style.display = s.pendingVerifications > 0 ? 'inline-block' : 'none';
  }
  if (bPart) {
    bPart.textContent = s.pendingPartnerships || 0;
    bPart.style.display = s.pendingPartnerships > 0 ? 'inline-block' : 'none';
  }
}

function openAdminSidebar() {
  document.getElementById('adminSidebar').classList.add('open');
  document.getElementById('adminSidebarBackdrop').classList.add('open');
}

function closeAdminSidebar() {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('adminSidebarBackdrop').classList.remove('open');
}

function switchAdminSection(sec) {
  AdminState.section = sec;
  document.querySelectorAll('.sb-nav-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-sec') === sec));
  const [title, sub] = SECTION_META[sec] || ['Admin Dashboard', ''];
  document.getElementById('adminTopTitle').textContent = title;
  document.getElementById('adminTopSub').textContent = sub;
  closeAdminSidebar();
  renderAdminSection();
}

function renderAdminSection() {
  const main = document.getElementById('adminMainBody');
  if (!main) return;
  const d = AdminState.data;
  const s = d.stats || {};
  const sec = AdminState.section;

  if (sec === 'overview') {
    main.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Partner Universities</div>
          <div class="kpi-val">${s.totalUniversities || 0}</div>
          <div class="kpi-sub">${s.pendingPartnerships || 0} pending applications</div>
        </div>
        <div class="kpi-card blue">
          <div class="kpi-label">Innovators &amp; App Users</div>
          <div class="kpi-val">${s.totalInnovators || 0} / ${s.totalAppAccounts || 0}</div>
          <div class="kpi-sub">${s.verifiedInnovators || 0} Board of Honour verified</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Catalog &amp; Theses</div>
          <div class="kpi-val">${s.totalProjects || 0} / ${s.totalTheses || 0}</div>
          <div class="kpi-sub">${s.pendingVerifications || 0} pending enrollments</div>
        </div>
        <div class="kpi-card gold">
          <div class="kpi-label">Marketplace Sales</div>
          <div class="kpi-val">$${Number(s.totalSalesUSD || 0).toFixed(2)}</div>
          <div class="kpi-sub">AFOSTECH 15%: $${Number(s.consortiumRevenueUSD || 0).toFixed(2)}</div>
        </div>
      </div>

      <div class="two-col-grid">
        <div class="admin-panel">
          <div class="panel-header">
            <h3>Pending Administrative Actions</h3>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:10px;">
              <div><strong>University Affiliation Letters</strong><div class="panel-sub">${s.pendingPartnerships || 0} awaiting review</div></div>
              <button type="button" class="btn-admin-primary btn-admin-sm" onclick="switchAdminSection('partnerships')">Review →</button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:10px;">
              <div><strong>Student Enrollment Prompts</strong><div class="panel-sub">${s.pendingVerifications || 0} awaiting confirmation</div></div>
              <button type="button" class="btn-admin-primary btn-admin-sm" onclick="switchAdminSection('verifications')">Verify →</button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#f8fafc;border-radius:10px;">
              <div><strong>Community Food Feed</strong><div class="panel-sub">${s.totalFeedPosts || 0} public posts &amp; ${s.totalOrders || 0} orders</div></div>
              <button type="button" class="btn-admin-outline btn-admin-sm" onclick="switchAdminSection('community')">Moderate →</button>
            </div>
          </div>
        </div>

        <div class="admin-panel">
          <div class="panel-header">
            <h3>Recent Investor Inquiries (${(d.investorInquiries || []).length})</h3>
          </div>
          ${(d.investorInquiries || []).slice(0, 5).map(inq => `
            <div style="padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;gap:8px;font-size:0.82rem;">
                <strong>${esc(inq.org_name)}</strong>
                <span style="color:var(--azure);font-family:monospace;">${esc(inq.contact_email)}</span>
              </div>
              <div style="font-size:0.78rem;color:var(--slate);margin-top:3px;">${esc(inq.proposal)}</div>
            </div>
          `).join('') || '<p class="panel-sub">No investor inquiries logged yet.</p>'}
        </div>
      </div>
    `;
  } else if (sec === 'verifications') {
    main.innerHTML = `
      <div class="admin-panel">
        <div class="panel-header">
          <div><h3>Institutional Student Enrollment Prompts</h3><span class="panel-sub">Confirm bona fide student admission to activate AFOSTECH member accounts</span></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Student &amp; Admission No.</th><th>Campus &amp; Registrar</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${(d.verificationDispatches || []).map(disp => {
                const isV = (disp.status || '').toLowerCase().includes('verified');
                return `
                  <tr>
                    <td><strong>${esc(disp.authorName || disp.applicantName)}</strong><br><small style="color:var(--primary-dark);font-family:monospace;">Adm: ${esc(disp.admissionNo)}</small></td>
                    <td><strong>${esc(disp.universityName)}</strong><br><small style="color:var(--azure);">${esc(disp.recipientEmail)}</small></td>
                    <td>${esc(disp.projectTitle || disp.purpose || 'Enrollment')}</td>
                    <td><span class="status-pill ${isV ? 'ok' : 'warn'}">${isV ? 'Verified' : 'Pending'}</span></td>
                    <td>${!isV ? `<button type="button" class="btn-admin-primary btn-admin-sm" onclick="adminConfirmDispatch('${esc(disp.id)}')">Confirm Enrollment</button>` : '<span style="color:var(--primary-dark);font-weight:800;">✓ Active</span>'}</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="5">No verification prompts.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-header">
          <div><h3>Registered Innovators &amp; Board of Honour (${(d.innovators || []).length})</h3></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Innovator &amp; Email</th><th>University</th><th>Product</th><th>Status</th><th>Control</th></tr></thead>
            <tbody>
              ${(d.innovators || []).map(inn => `
                <tr>
                  <td><strong>${esc(inn.name)}</strong><br><small style="color:var(--muted);">${esc(inn.email)} &bull; Adm: ${esc(inn.admissionNo)}</small></td>
                  <td>${esc(inn.universityShortName || inn.universityName)}</td>
                  <td>${esc(inn.productName || '—')}</td>
                  <td><span class="status-pill ${inn.verified ? 'ok' : 'warn'}">${inn.verified ? 'Board Verified' : esc(inn.membershipStatus)}</span></td>
                  <td><button type="button" class="btn-admin-outline btn-admin-sm" onclick="adminToggleInnovator('${esc(inn.id)}')">${inn.verified ? 'Revoke Badge' : 'Verify Honour Board'}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-header">
          <div><h3>Phone App Accounts Directory (${(d.appAccounts || []).length})</h3><span class="panel-sub">Shows public community accounts vs AFOSTECH-linked accounts</span></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name &amp; Profession</th><th>Email &amp; Phone</th><th>AFOSTECH Link</th></tr></thead>
            <tbody>
              ${(d.appAccounts || []).map(acc => `
                <tr>
                  <td><strong>${esc(acc.name)}</strong><br><small style="color:var(--primary-dark);font-weight:700;">${esc(acc.profession)}</small></td>
                  <td>${esc(acc.email)}<br><small style="color:var(--muted);">${esc(acc.phone || 'No phone')}</small></td>
                  <td><span class="status-pill ${acc.isAFOSTECHLinked ? 'ok' : 'info'}">${acc.isAFOSTECHLinked ? 'Linked AFOSTECH Member' : 'Community User'}</span></td>
                </tr>
              `).join('') || '<tr><td colspan="3">No app accounts registered yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (sec === 'partnerships') {
    main.innerHTML = `
      <div class="admin-panel">
        <div class="panel-header">
          <div><h3>University Partnership Requests (${(d.partnershipRequests || []).length})</h3><span class="panel-sub">Inspect official request letters and approve new partner campus chapters</span></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>University &amp; Country</th><th>Official Email &amp; Dean</th><th>Letter</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${(d.partnershipRequests || []).map(r => `
                <tr>
                  <td><strong>${esc(r.universityName)}</strong> (${esc(r.country)})<br><small style="color:var(--muted);">${esc(r.referenceNo || '')}</small></td>
                  <td><span style="color:var(--primary-dark);">${esc(r.officialEmail)}</span><br><small>${esc(r.contactPerson)}</small></td>
                  <td><button type="button" class="btn-admin-outline btn-admin-sm" onclick="adminViewLetter('${esc(r.id)}')">📄 Read Letter</button></td>
                  <td><span class="status-pill ${r.status === 'Approved' ? 'ok' : 'warn'}">${esc(r.status)}</span></td>
                  <td>${r.status === 'Approved' ? '✓ Active Chapter' : `<button type="button" class="btn-admin-primary btn-admin-sm" onclick="adminApprovePartnership('${esc(r.id)}')">Approve &amp; Add Chapter</button>`}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (sec === 'catalog') {
    main.innerHTML = `
      <div class="admin-panel">
        <div class="panel-header">
          <div><h3>Student Food Innovations (${(d.projects || []).length})</h3><span class="panel-sub">Feature flagship prototypes on Dashboard Spotlight or moderate entries</span></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Prototype</th><th>University</th><th>Scores</th><th>Spotlight</th><th>Action</th></tr></thead>
            <tbody>
              ${(d.projects || []).map(p => `
                <tr>
                  <td><strong>${esc(p.title)}</strong><br><small style="color:var(--muted);">${esc(p.categoryLabel || p.category)}</small></td>
                  <td>${esc(p.universityName)}</td>
                  <td>⭐ ${p.sensoryScore}/10 &bull; ❤️ ${p.upvotes}</td>
                  <td><button type="button" class="btn-admin-outline btn-admin-sm" onclick="adminToggleFeatured('${esc(p.id)}')">${p.featured ? '⭐ Featured' : 'Make Featured'}</button></td>
                  <td><button type="button" class="btn-admin-danger" onclick="adminDeleteProject('${esc(p.id)}')">Delete</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-header">
          <div><h3>Research Theses &amp; Dissertations (${(d.theses || []).length})</h3></div>
        </div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Title &amp; Author</th><th>University</th><th>Action</th></tr></thead>
            <tbody>
              ${(d.theses || []).map(t => `
                <tr>
                  <td><strong>${esc(t.title)}</strong><br><small style="color:var(--muted);">${esc(t.author)} (${esc(t.authorDegree || '')})</small></td>
                  <td>${esc(t.universityName)}</td>
                  <td><button type="button" class="btn-admin-danger" onclick="adminDeleteThesis('${esc(t.id)}')">Remove</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (sec === 'marketplace') {
    main.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card gold"><div class="kpi-label">Gross Sales</div><div class="kpi-val">$${Number(s.totalSalesUSD || 0).toFixed(2)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Innovator Payouts (85%)</div><div class="kpi-val">$${Number(s.innovatorPayoutUSD || 0).toFixed(2)}</div></div>
        <div class="kpi-card blue"><div class="kpi-label">Consortium Share (15%)</div><div class="kpi-val">$${Number(s.consortiumRevenueUSD || 0).toFixed(2)}</div></div>
      </div>

      <div class="admin-panel">
        <div class="panel-header"><h3>Commercial Orders (${(d.marketplaceOrders || []).length})</h3></div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Order ID &amp; Product</th><th>Buyer &amp; Destination</th><th>Total</th><th>Status</th><th>Control</th></tr></thead>
            <tbody>
              ${(d.marketplaceOrders || []).map(o => `
                <tr>
                  <td><strong>${esc(o.id)}</strong><br><small>${esc(o.productName)} (${o.quantity}x)</small></td>
                  <td>${esc(o.buyerName)}<br><small style="color:var(--muted);">${esc(o.buyerCity)}, ${esc(o.buyerCountry)}</small></td>
                  <td><strong>$${Number(o.totalUSD || 0).toFixed(2)}</strong></td>
                  <td><span class="status-pill info">${esc(o.status)}</span></td>
                  <td><button type="button" class="btn-admin-primary btn-admin-sm" onclick="adminCycleOrder('${esc(o.id)}')">Advance Dispatch</button></td>
                </tr>
              `).join('') || '<tr><td colspan="5">No orders placed yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else if (sec === 'community') {
    main.innerHTML = `
      <div class="two-col-grid">
        <div class="admin-panel">
          <div class="panel-header"><h3>📢 Publish Official News Bulletin</h3></div>
          <form onsubmit="adminPublishNews(event)">
            <div class="form-group">
              <label class="form-label" for="newsBadge">Tag / Badge *</label>
              <input type="text" id="newsBadge" class="form-control" value="Consortium Announcement" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="newsTitle">Headline *</label>
              <input type="text" id="newsTitle" class="form-control" required placeholder="e.g. 2026 East Africa Sensory Hackathon Open">
            </div>
            <div class="form-group">
              <label class="form-label" for="newsSummary">Bulletin Details *</label>
              <textarea id="newsSummary" class="form-control" rows="3" required placeholder="Enter official consortium update..."></textarea>
            </div>
            <button type="submit" class="btn-admin-primary">Publish Bulletin →</button>
          </form>
        </div>

        <div class="admin-panel">
          <div class="panel-header"><h3>Active News Bulletins (${(d.news || []).length})</h3></div>
          ${(d.news || []).map(n => `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:10px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
              <div><strong>${esc(n.title)}</strong><div class="panel-sub">${esc(n.badge)} &bull; ${esc(n.date)}</div></div>
              <button type="button" class="btn-admin-danger" onclick="adminDeleteNews('${esc(n.id)}')">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-header"><h3>🥑 Food Science Feed Moderation (${(d.feedPosts || []).length})</h3></div>
        <div class="table-wrap">
          <table class="admin-table">
            <thead><tr><th>Author &amp; Profession</th><th>Post &amp; Topic</th><th>Engagement</th><th>Moderation</th></tr></thead>
            <tbody>
              ${(d.feedPosts || []).map(p => `
                <tr>
                  <td><strong>${esc(p.authorName)}</strong><br><small style="color:var(--primary-dark);">${esc(p.authorProfession)}</small></td>
                  <td><strong>${esc(p.title || p.topicTag)}</strong><br><small style="color:var(--slate);">${esc((p.content || '').slice(0, 110))}...</small></td>
                  <td>❤️ ${p.likesCount || 0} &bull; 🔁 ${p.repostsCount || 0}</td>
                  <td><button type="button" class="btn-admin-danger" onclick="adminDeleteFeedPost('${esc(p.id)}')">Remove Post</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

async function adminConfirmDispatch(id) {
  try {
    await adminApi(`/api/staff/verifications/${id}/confirm`, { method: 'POST' });
    await refreshAdminData();
    showAdminToast('✓ Enrollment confirmed and student member activated!');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminToggleInnovator(id) {
  try {
    await adminApi(`/api/staff/innovators/${id}/verify`, { method: 'POST' });
    await refreshAdminData();
    showAdminToast('✓ Board of Honour status updated!');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminApprovePartnership(id) {
  try {
    await adminApi(`/api/staff/partnerships/${id}/approve`, { method: 'POST' });
    await refreshAdminData();
    showAdminToast('✓ University Partnership approved and chapter added!');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

function adminViewLetter(id) {
  const r = (AdminState.data.partnershipRequests || []).find(x => x.id === id);
  if (!r) return;
  document.getElementById('adminModalKicker').textContent = `${r.universityName} • ${r.country}`;
  document.getElementById('adminModalTitle').textContent = r.letterSubject || 'Partnership Request Letter';
  const fileHtml = r.letterFilePath
    ? `<div style="margin-bottom:12px;"><a href="${esc(r.letterFilePath)}" target="_blank" class="btn-admin-primary btn-admin-sm" style="text-decoration:none;">📎 Download Attached Letter Document</a></div>`
    : '';
  document.getElementById('adminModalBody').innerHTML = `
    ${fileHtml}
    <div style="font-size:0.84rem;margin-bottom:10px;">
      <strong>Contact:</strong> ${esc(r.contactPerson)} &bull; <strong>Email:</strong> ${esc(r.officialEmail)}
    </div>
    <div style="background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px;white-space:pre-line;font-size:0.85rem;">
      ${esc(r.fullLetterBody || r.letterOfIntent || 'Formal affiliation request submitted via portal.')}
    </div>
  `;
  document.getElementById('adminModalBackdrop').classList.add('active');
}

function closeAdminModal() {
  document.getElementById('adminModalBackdrop').classList.remove('active');
}

async function adminToggleFeatured(id) {
  try {
    await adminApi(`/api/staff/projects/${id}/featured`, { method: 'POST' });
    await refreshAdminData();
    showAdminToast('⭐ Featured spotlight status toggled!');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminDeleteProject(id) {
  try {
    await adminApi(`/api/staff/projects/${id}`, { method: 'DELETE' });
    await refreshAdminData();
    showAdminToast('🗑️ Innovation removed.');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminDeleteThesis(id) {
  try {
    await adminApi(`/api/staff/theses/${id}`, { method: 'DELETE' });
    await refreshAdminData();
    showAdminToast('🗑️ Research thesis removed.');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminCycleOrder(id) {
  try {
    await adminApi(`/api/marketplace/orders/${id}/cycle`, { method: 'POST' });
    await refreshAdminData();
    showAdminToast('📦 Order dispatch status updated!');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminPublishNews(e) {
  e.preventDefault();
  try {
    await adminApi('/api/staff/news', {
      method: 'POST',
      body: JSON.stringify({
        badge: document.getElementById('newsBadge').value.trim(),
        title: document.getElementById('newsTitle').value.trim(),
        summary: document.getElementById('newsSummary').value.trim()
      })
    });
    e.target.reset();
    await refreshAdminData();
    showAdminToast('📢 Official bulletin published!');
  } catch (err) { showAdminToast('⚠️ ' + err.message); }
}

async function adminDeleteNews(id) {
  try {
    await adminApi(`/api/staff/news/${id}`, { method: 'DELETE' });
    await refreshAdminData();
    showAdminToast('🗑️ Bulletin deleted.');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}

async function adminDeleteFeedPost(id) {
  try {
    await adminApi(`/api/staff/feed/posts/${id}`, { method: 'DELETE' });
    await refreshAdminData();
    showAdminToast('🗑️ Feed post moderated and removed.');
  } catch (e) { showAdminToast('⚠️ ' + e.message); }
}
