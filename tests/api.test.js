const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createAppServer } = require('../server');

let server;
let baseUrl;
let tempDir;

test.before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afostech-test-'));
  const dbPath = path.join(tempDir, 'test.db');
  const uploadsDir = path.join(tempDir, 'uploads');
  server = createAppServer({ dbPath, uploadsDir, sessionSecret: 'test-secret-key' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

test.after(async () => {
  if (server && server.db) server.db.close();
  if (server) await new Promise(resolve => server.close(resolve));
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
});

async function api(route, opts = {}) {
  const res = await fetch(`${baseUrl}${route}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers || {})
    }
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, json, text };
}

test('Public bootstrap loads seeded SQLite data without exposing confidential staff records', async () => {
  const health = await api('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.json.ok, true);
  assert.equal(health.json.counts.universities, 7);

  const boot = await api('/api/bootstrap');
  assert.equal(boot.status, 200);
  assert.equal(boot.json.universities.length, 7);
  assert.equal(boot.json.projects.length, 8);
  assert.equal(boot.json.theses.length, 6);
  assert.equal(boot.json.user, null);
  assert.equal(boot.json.partnershipRequests, undefined);
  assert.equal(boot.json.verificationDispatches, undefined);
});

test('Role-based authentication separates Staff Official and Student Innovator privileges', async () => {
  // Unauthenticated access blocked
  const unauthStaff = await api('/api/staff/dashboard');
  assert.equal(unauthStaff.status, 401);

  const unauthProj = await api('/api/projects', { method: 'POST', body: JSON.stringify({ title: 'X', tagline: 'Y' }) });
  assert.equal(unauthProj.status, 401);

  // 1. Innovator Login via email
  const innLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'f.wanjiru@students.jkuat.ac.ke', password: 'innovator2026' })
  });
  assert.equal(innLogin.status, 200);
  assert.equal(innLogin.json.user.role, 'innovator');
  const innToken = innLogin.json.token;

  // Innovator CANNOT access Staff Control Center endpoints
  const forbiddenStaffDash = await api('/api/staff/dashboard', { token: innToken });
  assert.equal(forbiddenStaffDash.status, 403);

  // Innovator CANNOT approve partnerships
  const forbiddenApprove = await api('/api/staff/partnerships/req-1/approve', { method: 'POST', token: innToken });
  assert.equal(forbiddenApprove.status, 403);

  // Innovator CANNOT edit someone else's product image
  const forbiddenImgEdit = await api('/api/projects/proj-2/image', {
    method: 'PUT',
    token: innToken,
    body: JSON.stringify({ image: 'assets/mobiyog.svg' })
  });
  assert.equal(forbiddenImgEdit.status, 403);

  // Innovator CAN edit their own product image (with base64 PNG persisted to uploads/images)
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const ownImgEdit = await api('/api/projects/proj-1/image', {
    method: 'PUT',
    token: innToken,
    body: JSON.stringify({ image: tinyPng })
  });
  assert.equal(ownImgEdit.status, 200);
  assert.ok(ownImgEdit.json.image.startsWith('/uploads/images/'));

  // 2. Submit new project & thesis as innovator
  const newProj = await api('/api/projects', {
    method: 'POST',
    token: innToken,
    body: JSON.stringify({
      title: 'Test BioCassava Crunch',
      tagline: 'Fortified cassava crisp',
      universityId: 'jkuat',
      category: 'biofortified',
      summary: 'High beta-carotene crisp'
    })
  });
  assert.equal(newProj.status, 201);
  assert.equal(newProj.json.project.title, 'Test BioCassava Crunch');

  const newThesis = await api('/api/theses', {
    method: 'POST',
    token: innToken,
    body: JSON.stringify({
      title: 'Milling Kinetics Study',
      tagline: 'Particle size effects',
      abstract: 'Full experimental kinetic analysis.',
      universityId: 'jkuat',
      category: 'functional'
    })
  });
  assert.equal(newThesis.status, 201);

  // Verify persistence in bootstrap
  const bootAfter = await api('/api/bootstrap', { token: innToken });
  assert.equal(bootAfter.json.projects.length, 9);
  assert.equal(bootAfter.json.theses.length, 7);
});

test('Public interactions, confidential partnership file uploads, registration & Staff Official approvals persist', async () => {
  // Public upvote toggle
  const up1 = await api('/api/projects/proj-1/upvote', { method: 'POST' });
  assert.equal(up1.status, 200);
  assert.equal(up1.json.upvoted, true);

  // Public thesis comment
  const comm = await api('/api/theses/thesis-1/comments', {
    method: 'POST',
    body: JSON.stringify({ author: 'Dr. Test', role: 'Faculty', text: 'Well controlled study.' })
  });
  assert.equal(comm.status, 201);

  // Submit confidential university partnership with request letter PDF attachment
  const pdfBase64 = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 Test Dean Letter').toString('base64');
  const partRes = await api('/api/partnerships', {
    method: 'POST',
    body: JSON.stringify({
      universityName: 'Sokoine University of Agriculture',
      country: 'Tanzania',
      contactPerson: 'Prof. Asha Mwanga',
      officialEmail: 'dean.food@sua.ac.tz',
      studentEnrollment: '410 Students',
      letterOfIntent: 'Applying for consortium affiliation.',
      letterDocumentFile: { name: 'SUA_Dean_Request.pdf', size: '0.1 MB', type: 'application/pdf', uploadedAt: 'Nov 2026' },
      letterDocumentDataUrl: pdfBase64
    })
  });
  assert.equal(partRes.status, 201);
  const newReqId = partRes.json.id;

  // Student self-registration creates Pending Institutional Confirmation account
  const regRes = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Samuel Ochieng',
      email: 's.ochieng@students.egerton.ac.ke',
      admissionNo: 'ED11/9999/24',
      universityId: 'egerton',
      password: 'mypassword'
    })
  });
  assert.equal(regRes.status, 201);

  // Pending student cannot login before confirmation
  const pendingLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 's.ochieng@students.egerton.ac.ke', password: 'mypassword' })
  });
  assert.equal(pendingLogin.status, 403);
  assert.equal(pendingLogin.json.code, 'PENDING_ENROLLMENT');

  // Staff Official login via official email
  const staffLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@afostech-students.org', password: 'admin123' })
  });
  assert.equal(staffLogin.status, 200);
  assert.equal(staffLogin.json.user.role, 'staff');
  const staffToken = staffLogin.json.token;

  // Staff Official accesses confidential dashboard & sees uploaded partnership letter
  const staffDash = await api('/api/staff/dashboard', { token: staffToken });
  assert.equal(staffDash.status, 200);
  const suaReq = staffDash.json.partnershipRequests.find(r => r.id === newReqId);
  assert.ok(suaReq);
  assert.ok(suaReq.letterFilePath.startsWith('/uploads/letters/'));

  // Staff approves partnership -> creates new university chapter
  const approveRes = await api(`/api/staff/partnerships/${newReqId}/approve`, { method: 'POST', token: staffToken });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.json.university.country, 'Tanzania');

  // Staff confirms Samuel's institutional enrollment -> Samuel can now log in!
  const samuelDisp = staffDash.json.verificationDispatches.find(d => d.admissionNo === 'ED11/9999/24');
  assert.ok(samuelDisp);
  const confRes = await api(`/api/staff/verifications/${samuelDisp.id}/confirm`, { method: 'POST', token: staffToken });
  assert.equal(confRes.status, 200);

  const activatedLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 's.ochieng@students.egerton.ac.ke', password: 'mypassword' })
  });
  assert.equal(activatedLogin.status, 200);
  assert.equal(activatedLogin.json.user.role, 'innovator');
});
