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

  // Staff Official accesses Admin Dashboard & sees uploaded partnership letter + full stats
  const staffDash = await api('/api/staff/dashboard', { token: staffToken });
  assert.equal(staffDash.status, 200);
  assert.ok(staffDash.json.stats && typeof staffDash.json.stats.totalSalesUSD === 'number');
  assert.ok(Array.isArray(staffDash.json.projects) && staffDash.json.projects.length >= 1);
  assert.ok(Array.isArray(staffDash.json.feedPosts));
  const suaReq = staffDash.json.partnershipRequests.find(r => r.id === newReqId);
  assert.ok(suaReq);
  assert.ok(suaReq.letterFilePath.startsWith('/uploads/letters/'));

  // Staff publishes and deletes an official news bulletin + toggles featured innovation
  const newsPost = await api('/api/staff/news', {
    method: 'POST',
    token: staffToken,
    body: JSON.stringify({ badge: 'Admin Bulletin', title: '2026 Secretariat Audit Complete', summary: 'All partner labs certified.' })
  });
  assert.equal(newsPost.status, 201);
  const delNews = await api(`/api/staff/news/${newsPost.json.item.id}`, { method: 'DELETE', token: staffToken });
  assert.equal(delNews.status, 200);
  const featToggle = await api('/api/staff/projects/proj-2/featured', { method: 'POST', token: staffToken });
  assert.equal(featToggle.status, 200);

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

test('Phone App supports public account creation, profile editing, feed media+captions, marketplace orders & AFOSTECH innovator linking', async () => {
  // 1. Public / Guest App bootstrap hides Theses & Honour Board while keeping Feed, Marketplace & Achievements
  const boot = await api('/api/app/bootstrap');
  assert.equal(boot.status, 200);
  assert.equal(boot.json.canAccessMemberSections, false);
  assert.equal(boot.json.theses.length, 0);
  assert.equal(boot.json.innovators.length, 0);
  assert.ok(boot.json.achievements && boot.json.achievements.universitiesCount >= 7);
  assert.ok(Array.isArray(boot.json.feedPosts) && boot.json.feedPosts.length >= 1);
  assert.ok(Array.isArray(boot.json.projects) && boot.json.projects.length >= 1);
  assert.ok(boot.json.projects[0].commercial);

  // 1b. Website-logged-in AFOSTECH innovator (Faith Wanjiru) transitions directly into Phone App without creating another account!
  const webFaithLogin = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'f.wanjiru@students.jkuat.ac.ke', password: 'innovator2026' })
  });
  assert.equal(webFaithLogin.status, 200);
  const ssoBoot = await api('/api/app/bootstrap', { token: webFaithLogin.json.token });
  assert.equal(ssoBoot.status, 200);
  assert.ok(ssoBoot.json.appUser);
  assert.equal(ssoBoot.json.appUser.email, 'f.wanjiru@students.jkuat.ac.ke');
  assert.equal(ssoBoot.json.canAccessMemberSections, true);
  assert.ok(ssoBoot.json.theses.length >= 1);
  assert.ok(ssoBoot.json.innovators.length >= 1);

  // 2. Anyone creates an account (Phone & About left optional at signup, updated later in Profile)
  const regGuest = await api('/api/app/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Dr. Chef Maya Patel',
      profession: 'Culinary Biochemist',
      email: 'maya.patel@kitchenlab.org',
      password: 'chefpass123'
    })
  });
  assert.equal(regGuest.status, 201);
  assert.equal(regGuest.json.appUser.profession, 'Culinary Biochemist');
  assert.equal(regGuest.json.appUser.isAFOSTECHLinked, false);
  assert.equal(regGuest.json.appUser.canSubmitAFOSTECH, false);
  const guestToken = regGuest.json.token;

  // Normal non-AFOSTECH user stays restricted from Innovations/Theses member sections
  const guestBoot = await api('/api/app/bootstrap', { token: guestToken });
  assert.equal(guestBoot.status, 200);
  assert.equal(guestBoot.json.canAccessMemberSections, false);
  assert.equal(guestBoot.json.theses.length, 0);
  assert.equal(guestBoot.json.innovators.length, 0);

  // Non-linked app user cannot submit AFOSTECH innovation
  const blockedSubmit = await api('/api/projects', {
    method: 'POST',
    token: guestToken,
    body: JSON.stringify({ title: 'Blocked Item', tagline: 'Should fail', category: 'functional' })
  });
  assert.equal(blockedSubmit.status, 401);

  // Update Profile later with About, Phone & Avatar photo
  const tinyPngB64 = 'data:image/png;base64,' + Buffer.from('fake-png-avatar').toString('base64');
  const profUpd = await api('/api/app/profile', {
    method: 'PUT',
    token: guestToken,
    body: JSON.stringify({
      phone: '+254711223344',
      about: 'Researching plant hydrocolloids and fermentation flavor chemistry.',
      avatarDataUrl: tinyPngB64
    })
  });
  assert.equal(profUpd.status, 200);
  assert.equal(profUpd.json.appUser.phone, '+254711223344');
  assert.ok(profUpd.json.appUser.about.includes('hydrocolloids'));
  assert.ok(profUpd.json.appUser.avatarUrl.startsWith('/uploads/avatars/'));

  // Publish video post with captioning + interact (like, repost, comment, DM)
  const tinyMp4B64 = 'data:video/mp4;base64,' + Buffer.from('fake-mp4-stream').toString('base64');
  const postRes = await api('/api/feed/posts', {
    method: 'POST',
    token: guestToken,
    body: JSON.stringify({
      mediaType: 'video',
      title: 'Pectin Gelation Experiment',
      mediaCaption: 'Boiling citrus peel extract at pH 3.2 for natural jam setting',
      content: 'Demonstrating thermal gelation dynamics for clean-label preserves. #FoodChemistry',
      topicTag: '#FoodChemistry',
      mediaDataUrl: tinyMp4B64
    })
  });
  assert.equal(postRes.status, 201);
  assert.equal(postRes.json.post.authorProfession, 'Culinary Biochemist');
  assert.ok(postRes.json.post.mediaUrl.startsWith('/uploads/videos/'));
  const createdPostId = postRes.json.post.id;

  const commRes = await api(`/api/feed/posts/${createdPostId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ authorName: 'Alex Kim', authorProfession: 'Food Technologist', text: 'Great viscosity profile!' })
  });
  assert.equal(commRes.status, 201);
  assert.equal(commRes.json.comment.authorProfession, 'Food Technologist');

  // 3. Innovator (Grace Nabirye) signs up in App using the same email used in AFOSTECH -> auto-links account!
  const regInn = await api('/api/app/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Grace Nabirye',
      profession: 'Biopolymer Packaging Researcher',
      email: 'g.nabirye@mak.ac.ug',
      phone: '+256700998877',
      password: 'apppassword99'
    })
  });
  assert.equal(regInn.status, 201);
  assert.equal(regInn.json.appUser.isAFOSTECHLinked, true);
  assert.equal(regInn.json.appUser.canSubmitAFOSTECH, true);
  const linkedToken = regInn.json.token;

  // Linked App account seamlessly accesses AFOSTECH Website user endpoint (/api/auth/me) without re-signing in!
  const appToWebMe = await api('/api/auth/me', { token: linkedToken });
  assert.equal(appToWebMe.status, 200);
  assert.equal(appToWebMe.json.user.email, 'g.nabirye@mak.ac.ug');

  // Linked innovator submits Innovation & Thesis directly from App -> visible in AFOSTECH & Marketplace!
  const appProjRes = await api('/api/projects', {
    method: 'POST',
    token: linkedToken,
    body: JSON.stringify({
      title: 'App-Submitted Spirulina Crunch',
      tagline: 'Crisp fortified snack launched directly from mobile app',
      category: 'biofortified',
      universityId: 'jkuat',
      summary: 'High-protein snack bar extruded at 130C.'
    })
  });
  assert.equal(appProjRes.status, 201);
  assert.ok(appProjRes.json.project.commercial);

  const appThRes = await api('/api/theses', {
    method: 'POST',
    token: linkedToken,
    body: JSON.stringify({
      title: 'Microalgae Bioavailability in Extruded Matrices',
      tagline: 'JKUAT 2026 Pilot Study',
      category: 'biofortified',
      universityId: 'jkuat',
      abstract: 'In vitro digestion study confirming 88% iron bioaccessibility.'
    })
  });
  assert.equal(appThRes.status, 201);

  // Place Marketplace Try Product order for the newly submitted innovation
  const orderRes = await api('/api/marketplace/orders', {
    method: 'POST',
    token: linkedToken,
    body: JSON.stringify({
      projectId: appProjRes.json.project.id,
      buyerName: 'Chef Maya Patel',
      buyerEmail: 'maya.patel@kitchenlab.org',
      buyerCountry: 'Kenya',
      buyerCity: 'Nairobi',
      tier: 'single',
      quantity: 2
    })
  });
  assert.equal(orderRes.status, 201);
  assert.equal(orderRes.json.order.productName, 'App-Submitted Spirulina Crunch');
});
