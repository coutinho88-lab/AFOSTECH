const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { createDatabase, DB_PATH, UPLOADS_DIR, hashPassword, verifyPassword } = require('./db/database');
const { seedDatabase } = require('./db/seed');

const ROOT_DIR = __dirname;
const FOODFEED_SIBLING_DIR = path.resolve(ROOT_DIR, '..', 'AFOSTECH-FoodFeed');
const SECRET_FILE = path.join(ROOT_DIR, 'db', '.session-secret');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ico': 'image/x-icon'
};

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  try {
    if (fs.existsSync(SECRET_FILE)) {
      return fs.readFileSync(SECRET_FILE, 'utf8').trim();
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, generated, 'utf8');
    return generated;
  } catch (e) {
    return 'afostech-dev-fallback-secret-change-in-prod';
  }
}

function signToken(payload, secret) {
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const bodyB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${headerB64}.${bodyB64}`).digest('base64url');
  return `${headerB64}.${bodyB64}.${sig}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${bodyB64}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      cookies[key] = val;
    }
  });
  return cookies;
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function mapUserRow(row, includePrivate = false) {
  if (!row) return null;
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    staffRole: row.staff_role,
    department: row.department,
    admissionNo: row.admission_no,
    universityId: row.university_id,
    universityName: row.university_name,
    universityShortName: row.university_short_name,
    degree: row.degree,
    yearOfStudy: row.year_of_study,
    membershipStatus: row.membership_status,
    institutionalVerified: Boolean(row.institutional_verified),
    verified: Boolean(row.verified),
    boardOfHonour: Boolean(row.board_of_honour),
    pitchedCompetition: row.pitched_competition,
    productName: row.product_name,
    productId: row.product_id,
    bio: row.bio,
    cvFileName: row.cv_file_name,
    cvFileSize: row.cv_file_size,
    publicSafetyCertified: Boolean(row.public_safety_certified),
    investorAsk: safeJsonParse(row.investor_ask_json, null),
    inquiriesCount: row.inquiries_count || 0,
    registeredAt: row.registered_at
  };
  if (!includePrivate) {
    // Public roster view keeps non-sensitive showcase data
    delete user.staffRole;
  }
  return user;
}

function mapUniversityRow(u) {
  return {
    id: u.id,
    name: u.name,
    shortName: u.short_name,
    country: u.country,
    city: u.city,
    logoColor: u.logo_color,
    badgeColor: u.badge_color,
    totalPoints: u.total_points,
    rank: u.rank,
    projectsCount: u.projects_count,
    studentScientistsCount: u.student_scientists_count,
    chapterLead: u.chapter_lead,
    strengths: u.strengths,
    verificationEmail: u.verification_email,
    deanEmail: u.dean_email,
    faculty: u.faculty,
    registrarOfficer: u.registrar_officer
  };
}

function mapProjectRow(p) {
  return {
    id: p.id,
    title: p.title,
    tagline: p.tagline,
    universityId: p.university_id,
    universityName: p.university_name,
    leadAdmissionNo: p.lead_admission_no,
    category: p.category,
    categoryLabel: p.category_label,
    authors: safeJsonParse(p.authors_json, []),
    dissertationFile: safeJsonParse(p.dissertation_file_json, null),
    featured: Boolean(p.featured),
    award: p.award,
    upvotes: p.upvotes || 0,
    peerReviews: p.peer_reviews || 0,
    sustainabilityScore: p.sustainability_score,
    sensoryScore: p.sensory_score,
    status: p.status,
    summary: p.summary,
    ingredients: safeJsonParse(p.ingredients_json, []),
    nutritionPer100g: safeJsonParse(p.nutrition_json, {}),
    sensoryProfile: safeJsonParse(p.sensory_profile_json, {}),
    processFlow: safeJsonParse(p.process_flow_json, []),
    image: p.image,
    badges: safeJsonParse(p.badges_json, []),
    createdByUserId: p.created_by_user_id || null
  };
}

function mapThesisRow(t, comments) {
  return {
    id: t.id,
    title: t.title,
    tagline: t.tagline,
    author: t.author,
    authorAdmissionNo: t.author_admission_no,
    authorDegree: t.author_degree,
    authorVerified: Boolean(t.author_verified),
    universityId: t.university_id,
    universityName: t.university_name,
    supervisors: t.supervisors,
    department: t.department,
    category: t.category,
    categoryLabel: t.category_label,
    dateSubmitted: t.date_submitted,
    year: t.year,
    abstract: t.abstract,
    keywords: safeJsonParse(t.keywords_json, []),
    file: safeJsonParse(t.file_json, {}),
    viewsCount: t.views_count || 0,
    comments: (comments || []).map(c => ({
      id: c.id,
      author: c.author,
      role: c.role,
      university: c.university || 'AFOSTECH Consortium',
      date: c.date,
      content: c.text,
      text: c.text
    }))
  };
}

function mapPartnershipRow(r) {
  return {
    id: r.id,
    universityName: r.university_name,
    shortName: r.short_name,
    country: r.country,
    city: r.city,
    referenceNo: r.reference_no,
    facultyDepartment: r.faculty_department,
    officialEmail: r.official_email,
    contactPerson: r.contact_person,
    contactTitle: r.contact_title,
    studentEnrollment: r.student_enrollment,
    status: r.status,
    dateApplied: r.date_applied,
    letterDocumentFile: safeJsonParse(r.letter_document_json, null),
    letterFilePath: r.letter_file_path || null,
    letterSubject: r.letter_subject,
    letterOfIntent: r.letter_of_intent,
    fullLetterBody: r.full_letter_body
  };
}

function mapDispatchRow(d) {
  return {
    id: d.id,
    type: d.type,
    referenceCode: d.reference_code,
    projectId: d.project_id,
    projectTitle: d.project_title,
    applicantName: d.applicant_name,
    authorName: d.author_name,
    admissionNo: d.admission_no,
    degree: d.degree,
    yearOfStudy: d.year_of_study,
    studentEmail: d.student_email,
    universityId: d.university_id,
    universityName: d.university_name,
    universityShortName: d.university_short_name,
    recipientEmail: d.recipient_email,
    ccEmails: d.cc_emails,
    dispatchedAt: d.dispatched_at,
    status: d.status,
    confirmedAt: d.confirmed_at,
    confirmedBy: d.confirmed_by,
    dissertationDoc: d.dissertation_doc,
    allAuthors: safeJsonParse(d.all_authors_json, []),
    purpose: d.purpose,
    studentId: d.student_id,
    remarks: d.remarks
  };
}

function sendJson(res, status, data, headers = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(payload);
}

function readJsonBody(req, maxBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function saveBase64File(dataUrl, subdir, baseName, uploadsRoot = UPLOADS_DIR) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const b64 = match[2];

  const extMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };
  const ext = extMap[mime] || '.bin';
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const fileName = `${safeBase}${ext}`;
  const dir = path.join(uploadsRoot, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const absPath = path.join(dir, fileName);
  fs.writeFileSync(absPath, Buffer.from(b64, 'base64'));
  return `/uploads/${subdir}/${fileName}`;
}

function serveStaticFile(res, baseDir, relPath) {
  const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
  let absPath = path.join(baseDir, safePath);
  if (!absPath.startsWith(baseDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }
  if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
    absPath = path.join(absPath, 'index.html');
  }
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
    return false;
  }
  const ext = path.extname(absPath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(absPath).pipe(res);
  return true;
}

function createAppServer(options = {}) {
  const db = options.db || createDatabase(options.dbPath || DB_PATH);
  seedDatabase(db);
  const uploadsDir = options.uploadsDir || UPLOADS_DIR;
  const secret = options.sessionSecret || getSessionSecret();

  function getSessionUser(req) {
    const cookies = parseCookies(req);
    let token = cookies.afostech_session;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
    const payload = verifyToken(token, secret);
    if (!payload || !payload.sub) return null;
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    return row ? mapUserRow(row, true) : null;
  }

  function getVoterKey(req, user) {
    if (user) return `user:${user.id}`;
    const cookies = parseCookies(req);
    if (cookies.afostech_voter) return `voter:${cookies.afostech_voter}`;
    return `ip:${req.socket.remoteAddress || 'anon'}`;
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);
    const method = req.method.toUpperCase();

    try {
      const currentUser = getSessionUser(req);

      // ------------------------------------------------------------------
      // API ROUTES
      // ------------------------------------------------------------------
      if (pathname === '/api/health' && method === 'GET') {
        const counts = {
          users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
          universities: db.prepare('SELECT COUNT(*) AS c FROM universities').get().c,
          projects: db.prepare('SELECT COUNT(*) AS c FROM projects').get().c,
          theses: db.prepare('SELECT COUNT(*) AS c FROM theses').get().c,
          partnershipRequests: db.prepare('SELECT COUNT(*) AS c FROM partnership_requests').get().c
        };
        return sendJson(res, 200, { ok: true, db: 'sqlite', counts });
      }

      if (pathname === '/api/bootstrap' && method === 'GET') {
        const orgRow = db.prepare('SELECT data_json FROM organization WHERE id = ?').get('afostech');
        const universities = db.prepare('SELECT * FROM universities').all().map(mapUniversityRow);
        const projects = db.prepare('SELECT * FROM projects ORDER BY featured DESC, upvotes DESC').all().map(mapProjectRow);
        const thesesRows = db.prepare('SELECT * FROM theses ORDER BY rowid DESC').all();
        const allComments = db.prepare('SELECT * FROM thesis_comments ORDER BY rowid ASC').all();
        const commentsByThesis = {};
        for (const c of allComments) {
          if (!commentsByThesis[c.thesis_id]) commentsByThesis[c.thesis_id] = [];
          commentsByThesis[c.thesis_id].push(c);
        }
        const theses = thesesRows.map(t => mapThesisRow(t, commentsByThesis[t.id] || []));

        // Public innovators showcase (only role = 'innovator' and non-pending, OR all innovators sanitized for public showcase)
        const innovatorRows = db.prepare("SELECT * FROM users WHERE role = 'innovator' AND membership_status != 'Pending Institutional Confirmation'").all();
        const innovators = innovatorRows.map(r => mapUserRow(r, false));

        const news = db.prepare('SELECT * FROM news').all().map(n => ({
          id: n.id, badge: n.badge, badgeColor: n.badge_color, title: n.title,
          date: n.date, summary: n.summary, actionLabel: n.action_label, link: n.link
        }));
        const competitions = db.prepare('SELECT * FROM competitions').all().map(c => ({
          id: c.id, title: c.title, theme: c.theme, grandPrize: c.grand_prize,
          deadline: c.deadline, daysLeft: c.days_left, participants: c.participants,
          stages: safeJsonParse(c.stages_json, [])
        }));
        const testimonials = db.prepare('SELECT name, title, quote FROM testimonials').all();

        const voterKey = getVoterKey(req, currentUser);
        const upvotedIds = db.prepare('SELECT project_id FROM project_upvotes WHERE voter_key = ?').all(voterKey).map(r => r.project_id);

        return sendJson(res, 200, {
          organization: orgRow ? safeJsonParse(orgRow.data_json, {}) : {},
          universities,
          projects,
          theses,
          innovators,
          news,
          competitions,
          testimonials,
          upvotedIds,
          user: currentUser
        });
      }

      // --- AUTHENTICATION (UNIFIED EMAIL LOGIN) ---
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await readJsonBody(req);
        const emailOrAdm = (body.email || body.identifier || '').trim();
        const password = (body.password || '').trim();

        if (!emailOrAdm || !password) {
          return sendJson(res, 400, { error: 'Email and password are required.' });
        }

        const userRow = db.prepare(
          'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(admission_no) = LOWER(?)'
        ).get(emailOrAdm, emailOrAdm);

        if (!userRow || !verifyPassword(password, userRow.password_hash)) {
          return sendJson(res, 401, { error: 'Invalid email or password.' });
        }

        if (userRow.role === 'innovator' && userRow.membership_status === 'Pending Institutional Confirmation') {
          return sendJson(res, 403, {
            error: 'Enrollment Pending: Your student account is currently awaiting confirmation from your university.',
            code: 'PENDING_ENROLLMENT'
          });
        }

        const user = mapUserRow(userRow, true);
        const token = signToken({
          sub: user.id,
          email: user.email,
          role: user.role,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000
        }, secret);

        return sendJson(res, 200, { user, token }, {
          'Set-Cookie': `afostech_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`
        });
      }

      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await readJsonBody(req);
        const name = (body.name || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const admNo = (body.admissionNo || '').trim();
        const universityId = (body.universityId || '').trim();
        const degree = (body.degree || 'B.Sc. Food Science & Technology').trim();
        const yearOfStudy = (body.yearOfStudy || '3rd Year').trim();
        const password = (body.password || '').trim();

        if (!name || !email || !admNo || !password) {
          return sendJson(res, 400, { error: 'Full name, institutional email, admission number, and password are required.' });
        }
        if (email.endsWith('@afostech-students.org')) {
          return sendJson(res, 403, { error: 'Staff email domains cannot register through student self-signup.' });
        }

        const existing = db.prepare(
          'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(admission_no) = LOWER(?)'
        ).get(email, admNo);
        if (existing) {
          return sendJson(res, 409, { error: 'An account with this email or admission number already exists.' });
        }

        const univ = db.prepare('SELECT * FROM universities WHERE id = ?').get(universityId);
        const univName = univ ? univ.name : 'Partner University';
        const univShort = univ ? univ.short_name : 'Affiliate University';
        const registrarEmail = univ ? (univ.verification_email || `registrar.academic@${univ.id}.ac.ke`) : `registrar.academic@${universityId}.ac.ke`;
        const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

        const studentId = `inn-${Date.now()}`;
        db.prepare(`
          INSERT INTO users (
            id, name, email, password_hash, role, department, admission_no,
            university_id, university_name, university_short_name, degree, year_of_study,
            membership_status, institutional_verified, verified, board_of_honour,
            pitched_competition, product_name, bio, cv_file_name, cv_file_size,
            public_safety_certified, inquiries_count, registered_at
          ) VALUES (?, ?, ?, ?, 'innovator', 'Food Science & Technology', ?, ?, ?, ?, ?, ?, 'Pending Institutional Confirmation', 0, 0, 0, 'New Member — Eligible for Upcoming Pitch Cup', 'New Product Formulation Pending', ?, ?, '210 KB', 0, 0, ?)
        `).run(
          studentId, name, email, hashPassword(password), admNo,
          universityId, univName, univShort, degree, yearOfStudy,
          `${degree} student researcher at ${univShort}. Research focus: postharvest preservation and nutrient fortification.`,
          `${name.replace(/\s+/g, '_')}_Academic_CV.pdf`,
          nowStr
        );

        const refCode = `AFOST-VER-REG-${Math.floor(1000 + Math.random() * 9000)}`;
        db.prepare(`
          INSERT INTO verification_dispatches (
            id, type, reference_code, applicant_name, author_name, admission_no,
            degree, year_of_study, student_email, university_id, university_name,
            university_short_name, recipient_email, cc_emails, dispatched_at, status,
            purpose, student_id, remarks
          ) VALUES (?, 'Student Membership Verification', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Prompt Sent (Pending Confirmation)', 'AFOSTECH Student Membership & Innovator Privilege Authentication', ?, 'Student registration awaiting institutional admission confirmation.')
        `).run(
          `disp-reg-${Date.now()}`, refCode, name, name, admNo, degree, yearOfStudy,
          email, universityId, univName, univShort, registrarEmail,
          `secretariat@afostech-students.org, dean.foodscience@${universityId}.ac.ke`,
          nowStr, studentId
        );

        return sendJson(res, 201, {
          message: 'Registration submitted successfully! Your student innovator account will be activated once enrolled.',
          studentId
        });
      }

      if (pathname === '/api/auth/logout' && method === 'POST') {
        return sendJson(res, 200, { ok: true }, {
          'Set-Cookie': 'afostech_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'
        });
      }

      if (pathname === '/api/auth/me' && method === 'GET') {
        if (!currentUser) return sendJson(res, 401, { error: 'Not authenticated' });
        return sendJson(res, 200, { user: currentUser });
      }

      // --- INNOVATOR / AUTHENTICATED USER ACTIONS ---
      if (pathname === '/api/innovator/profile' && method === 'PUT') {
        if (!currentUser) return sendJson(res, 401, { error: 'Authentication required' });
        const body = await readJsonBody(req);
        const bio = (body.bio ?? currentUser.bio ?? '').trim();
        const degree = (body.degree ?? currentUser.degree ?? '').trim();
        const investorAsk = body.investorAsk !== undefined ? body.investorAsk : currentUser.investorAsk;

        db.prepare('UPDATE users SET bio = ?, degree = ?, investor_ask_json = ? WHERE id = ?').run(
          bio, degree, investorAsk ? JSON.stringify(investorAsk) : null, currentUser.id
        );

        if (body.password && body.password.trim()) {
          db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(body.password.trim()), currentUser.id);
        }

        const updated = mapUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(currentUser.id), true);
        return sendJson(res, 200, { user: updated });
      }

      if (pathname === '/api/projects' && method === 'POST') {
        if (!currentUser) return sendJson(res, 401, { error: 'Sign in required to submit food innovations.' });
        const body = await readJsonBody(req);
        const title = (body.title || '').trim();
        const tagline = (body.tagline || '').trim();
        const universityId = body.universityId || currentUser.universityId || 'jkuat';
        const category = body.category || 'functional';

        if (!title || !tagline) {
          return sendJson(res, 400, { error: 'Product title and tagline are required.' });
        }

        const univ = db.prepare('SELECT * FROM universities WHERE id = ?').get(universityId);
        const univName = univ ? univ.name : (currentUser.universityName || 'Partner University');
        const projectId = `custom-${Date.now()}`;

        let imagePath = (body.image || '').trim() || 'assets/spirocracker.svg';
        if (imagePath.startsWith('data:image/')) {
          const saved = saveBase64File(imagePath, 'images', `proj_${projectId}`, uploadsDir);
          if (saved) imagePath = saved;
        }

        const leadAdmissionNo = (body.leadAdmissionNo || currentUser.admissionNo || 'MEMBER').trim();
        const authors = Array.isArray(body.authors) && body.authors.length > 0
          ? body.authors
          : [{ name: currentUser.name, admissionNo: leadAdmissionNo, role: body.authorRole || 'Lead Innovator', year: 'Student Lead', contribution: 'Lead formulation author.' }];

        let dissertationFile = body.dissertationFile || {
          name: `${title.replace(/\s+/g, '_')}_Dissertation.pdf`,
          size: '2.8 MB',
          pages: 65,
          dateSubmitted: 'November 2026',
          certifiedByDean: true
        };
        if (body.dissertationDataUrl) {
          const docUrl = saveBase64File(body.dissertationDataUrl, 'dissertations', `diss_${projectId}`, uploadsDir);
          if (docUrl) dissertationFile.url = docUrl;
        }

        const badges = ['✨ New Student Submission', `📍 ${univName}`, `👥 ${authors.length} Researchers`];
        const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
        const nutrition = body.nutritionPer100g || { calories: '280 kcal', protein: '14.2 g', carbohydrates: '38.0 g', dietaryFiber: '6.5 g', iron: '4.2 mg' };
        const sensoryProfile = body.sensoryProfile || { taste: 8.9, aroma: 8.7, textureCrunch: 9.0, colorAppeal: 8.8, overallAcceptability: 8.9 };
        const processFlow = body.processFlow || ['Preparation of raw biomass and indigenous ingredients.', 'Controlled laboratory formulating, pasteurization and testing.', 'Sensory panel trials and thesis verification.'];

        db.prepare(`
          INSERT INTO projects (
            id, title, tagline, university_id, university_name, lead_admission_no,
            category, category_label, authors_json, dissertation_file_json,
            featured, upvotes, peer_reviews, sustainability_score, sensory_score,
            status, summary, ingredients_json, nutrition_json, sensory_profile_json,
            process_flow_json, image, badges_json, created_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, 4.8, 8.9, 'Newly Published by Student', ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, title, tagline, universityId, univName, leadAdmissionNo,
          category, category.toUpperCase(), JSON.stringify(authors), JSON.stringify(dissertationFile),
          body.summary || tagline, JSON.stringify(ingredients), JSON.stringify(nutrition),
          JSON.stringify(sensoryProfile), JSON.stringify(processFlow), imagePath,
          JSON.stringify(badges), currentUser.id
        );

        // Log internal dispatch for institutional oversight
        const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
        const refCode = `AFOST-VER-${(univ ? univ.short_name : 'UNIV').replace(/[^a-zA-Z]/g, '').toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        db.prepare(`
          INSERT INTO verification_dispatches (
            id, type, reference_code, project_id, project_title, author_name, admission_no,
            university_id, university_name, recipient_email, dispatched_at, status, dissertation_doc, all_authors_json, remarks
          ) VALUES (?, 'Project Showcase Verification', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Prompt Sent (Pending Confirmation)', ?, ?, ?)
        `).run(
          `disp-${Date.now()}`, refCode, projectId, title, authors[0].name, leadAdmissionNo,
          universityId, univName, univ ? (univ.verification_email || `registrar.academic@${univ.id}.ac.ke`) : 'registrar.academic@university.ac.ke',
          nowStr, dissertationFile.name, JSON.stringify(authors),
          `Verification prompt logged for ${univName} Academic Registrar.`
        );

        const created = mapProjectRow(db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId));
        return sendJson(res, 201, { project: created });
      }

      const projImgMatch = pathname.match(/^\/api\/projects\/([^/]+)\/image$/);
      if (projImgMatch && method === 'PUT') {
        if (!currentUser) return sendJson(res, 401, { error: 'Sign in required to edit product images.' });
        const projectId = projImgMatch[1];
        const projRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!projRow) return sendJson(res, 404, { error: 'Project not found' });

        // Authorization check: must be staff OR author/owner of this product
        const authors = safeJsonParse(projRow.authors_json, []);
        const isAuthor = currentUser.role === 'staff' ||
          projRow.created_by_user_id === currentUser.id ||
          (currentUser.admissionNo && projRow.lead_admission_no === currentUser.admissionNo) ||
          authors.some(a => a && ((currentUser.admissionNo && a.admissionNo === currentUser.admissionNo) || a.name === currentUser.name));

        if (!isAuthor) {
          return sendJson(res, 403, { error: 'Only the product innovator author or staff officials can edit this product photo.' });
        }

        const body = await readJsonBody(req);
        let finalImageUrl = (body.image || '').trim();
        if (!finalImageUrl) return sendJson(res, 400, { error: 'Image data or URL is required.' });

        if (finalImageUrl.startsWith('data:image/')) {
          const saved = saveBase64File(finalImageUrl, 'images', `edit_${projectId}_${Date.now()}`, uploadsDir);
          if (saved) finalImageUrl = saved;
        }

        db.prepare('UPDATE projects SET image = ? WHERE id = ?').run(finalImageUrl, projectId);
        return sendJson(res, 200, { projectId, image: finalImageUrl });
      }

      const upvoteMatch = pathname.match(/^\/api\/projects\/([^/]+)\/upvote$/);
      if (upvoteMatch && method === 'POST') {
        const projectId = upvoteMatch[1];
        const projRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!projRow) return sendJson(res, 404, { error: 'Project not found' });

        const cookies = parseCookies(req);
        let setVoterCookie = null;
        let voterKey = getVoterKey(req, currentUser);
        if (!currentUser && !cookies.afostech_voter) {
          const vid = crypto.randomBytes(12).toString('hex');
          voterKey = `voter:${vid}`;
          setVoterCookie = `afostech_voter=${vid}; HttpOnly; Path=/; SameSite=Lax; Max-Age=31536000`;
        }

        const existingVote = db.prepare('SELECT 1 FROM project_upvotes WHERE project_id = ? AND voter_key = ?').get(projectId, voterKey);
        let upvoted;
        let newUpvotes;
        if (existingVote) {
          db.prepare('DELETE FROM project_upvotes WHERE project_id = ? AND voter_key = ?').run(projectId, voterKey);
          newUpvotes = Math.max(0, (projRow.upvotes || 0) - 1);
          upvoted = false;
        } else {
          db.prepare('INSERT INTO project_upvotes (project_id, voter_key) VALUES (?, ?)').run(projectId, voterKey);
          newUpvotes = (projRow.upvotes || 0) + 1;
          upvoted = true;
        }
        db.prepare('UPDATE projects SET upvotes = ? WHERE id = ?').run(newUpvotes, projectId);

        const headers = setVoterCookie ? { 'Set-Cookie': setVoterCookie } : {};
        return sendJson(res, 200, { projectId, upvotes: newUpvotes, upvoted }, headers);
      }

      if (pathname === '/api/theses' && method === 'POST') {
        if (!currentUser) return sendJson(res, 401, { error: 'Sign in required to submit research theses.' });
        const body = await readJsonBody(req);
        const title = (body.title || '').trim();
        const tagline = (body.tagline || '').trim();
        const abstract = (body.abstract || '').trim();
        if (!title || !abstract) return sendJson(res, 400, { error: 'Thesis title and abstract are required.' });

        const universityId = body.universityId || currentUser.universityId || 'jkuat';
        const univ = db.prepare('SELECT * FROM universities WHERE id = ?').get(universityId);
        const thesisId = `thesis-${Date.now()}`;
        const fileObj = body.file || {
          fileName: `${(body.author || currentUser.name).replace(/\s+/g, '_')}_2026_Thesis.pdf`,
          fileSize: '4.2 MB',
          pages: 72,
          downloadsCount: 1
        };
        if (body.thesisDataUrl) {
          const docUrl = saveBase64File(body.thesisDataUrl, 'theses', `thesis_${thesisId}`, uploadsDir);
          if (docUrl) fileObj.url = docUrl;
        }

        db.prepare(`
          INSERT INTO theses (
            id, title, tagline, author, author_admission_no, author_degree, author_verified,
            university_id, university_name, supervisors, department, category, category_label,
            date_submitted, year, abstract, keywords_json, file_json, views_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'November 2026', '2026', ?, ?, ?, 1)
        `).run(
          thesisId, title, tagline,
          (body.author || currentUser.name).trim(),
          (body.authorAdmissionNo || currentUser.admissionNo || 'MEMBER').trim(),
          (body.authorDegree || currentUser.degree || 'B.Sc. Food Science & Technology').trim(),
          currentUser.verified ? 1 : 0,
          universityId,
          univ ? univ.short_name : (currentUser.universityShortName || 'Affiliate'),
          (body.supervisors || 'Department Research Committee').trim(),
          univ ? (univ.faculty || 'Faculty of Agriculture & Food Science') : 'School of Food Science',
          body.category || 'functional',
          (body.category || 'functional').toUpperCase(),
          abstract,
          JSON.stringify(Array.isArray(body.keywords) ? body.keywords : ['Food Science', 'AFOSTECH']),
          JSON.stringify(fileObj)
        );

        db.prepare('INSERT INTO thesis_comments (id, thesis_id, author, role, date, text) VALUES (?, ?, ?, ?, ?, ?)').run(
          `comm-init-${Date.now()}`, thesisId, 'AFOSTECH Editorial Board', 'Consortium Open Access Desk',
          'November 2026', 'Manuscript indexed and published to the inter-university open access repository.'
        );

        const row = db.prepare('SELECT * FROM theses WHERE id = ?').get(thesisId);
        const comments = db.prepare('SELECT * FROM thesis_comments WHERE thesis_id = ?').all(thesisId);
        return sendJson(res, 201, { thesis: mapThesisRow(row, comments) });
      }

      const thesisCommMatch = pathname.match(/^\/api\/theses\/([^/]+)\/comments$/);
      if (thesisCommMatch && method === 'POST') {
        const thesisId = thesisCommMatch[1];
        const thesisRow = db.prepare('SELECT id FROM theses WHERE id = ?').get(thesisId);
        if (!thesisRow) return sendJson(res, 404, { error: 'Thesis not found' });

        const body = await readJsonBody(req);
        const text = (body.content || body.text || '').trim();
        if (!text) return sendJson(res, 400, { error: 'Comment text is required.' });

        const comment = {
          id: `comm-${Date.now()}`,
          thesis_id: thesisId,
          author: (body.author || (currentUser && currentUser.name) || 'Academic Reader').trim(),
          role: (body.role || (currentUser && currentUser.role === 'staff' ? 'AFOSTECH Official' : 'Student Researcher / Peer Reviewer')).trim(),
          university: (body.university || (currentUser && currentUser.universityName) || 'AFOSTECH Community').trim(),
          date: 'Just now',
          content: text,
          text
        };

        db.prepare('INSERT INTO thesis_comments (id, thesis_id, author, role, university, date, text) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          comment.id, comment.thesis_id, comment.author, comment.role, comment.university, comment.date, comment.text
        );

        return sendJson(res, 201, { comment });
      }

      const thesisDlMatch = pathname.match(/^\/api\/theses\/([^/]+)\/download$/);
      if (thesisDlMatch && method === 'POST') {
        const thesisId = thesisDlMatch[1];
        const row = db.prepare('SELECT file_json FROM theses WHERE id = ?').get(thesisId);
        if (!row) return sendJson(res, 404, { error: 'Thesis not found' });
        const fileObj = safeJsonParse(row.file_json, {});
        fileObj.downloadsCount = (fileObj.downloadsCount || 0) + 1;
        db.prepare('UPDATE theses SET file_json = ? WHERE id = ?').run(JSON.stringify(fileObj), thesisId);
        return sendJson(res, 200, { downloadsCount: fileObj.downloadsCount });
      }

      if (pathname === '/api/partnerships' && method === 'POST') {
        const body = await readJsonBody(req);
        const univName = (body.universityName || '').trim();
        const country = (body.country || '').trim();
        const contactPerson = (body.contactPerson || '').trim();
        const officialEmail = (body.officialEmail || '').trim();
        const letterOfIntent = (body.letterOfIntent || '').trim();

        if (!univName || !country || !contactPerson || !officialEmail || !letterOfIntent) {
          return sendJson(res, 400, { error: 'All required institutional affiliation fields must be completed.' });
        }

        const reqId = `req-${Date.now()}`;
        const cleanCode = univName.split(' ').map(w => w[0]).join('').substring(0, 5).toUpperCase();
        const refNo = `${cleanCode}/FST/DIR/2026/${Math.floor(100 + Math.random() * 900)}`;

        let letterFilePath = null;
        if (body.letterDocumentDataUrl) {
          letterFilePath = saveBase64File(body.letterDocumentDataUrl, 'letters', `${cleanCode}_${reqId}`, uploadsDir);
        }

        const letterDoc = body.letterDocumentFile || {
          name: `${cleanCode}_Official_Affiliation_Request_Letter_Signed.pdf`,
          size: '2.4 MB',
          type: 'application/pdf',
          uploadedAt: 'Nov 2026'
        };

        db.prepare(`
          INSERT INTO partnership_requests (
            id, university_name, short_name, country, city, reference_no,
            faculty_department, official_email, contact_person, contact_title,
            student_enrollment, status, date_applied, letter_document_json,
            letter_file_path, letter_subject, letter_of_intent, full_letter_body
          ) VALUES (?, ?, ?, ?, 'Main Campus', ?, 'Faculty of Agriculture & Food Science', ?, ?, 'Dean / Department Head', ?, 'Pending Official Review', 'Just Now', ?, ?, 'FORMAL APPLICATION FOR INTER-UNIVERSITY CHAPTER AFFILIATION & STUDENT PRODUCT SHOWCASE ACCESS', ?, ?)
        `).run(
          reqId, univName, cleanCode, country, refNo, officialEmail, contactPerson,
          body.studentEnrollment || '300+ Food Science & Nutrition Students',
          JSON.stringify(letterDoc), letterFilePath, letterOfIntent,
          body.fullLetterBody || letterOfIntent
        );

        return sendJson(res, 201, {
          id: reqId,
          referenceNo: refNo,
          status: 'Pending Official Review'
        });
      }

      if (pathname === '/api/inquiries' && method === 'POST') {
        const body = await readJsonBody(req);
        const innovatorId = (body.innovatorId || '').trim();
        const orgName = (body.orgName || '').trim();
        const contactEmail = (body.contactEmail || '').trim();
        const proposal = (body.proposal || '').trim();

        if (!innovatorId || !orgName || !contactEmail || !proposal) {
          return sendJson(res, 400, { error: 'Organization name, email, and proposal are required.' });
        }

        db.prepare('INSERT INTO investor_inquiries (id, innovator_id, org_name, contact_email, proposal) VALUES (?, ?, ?, ?, ?)').run(
          `inq-${Date.now()}`, innovatorId, orgName, contactEmail, proposal
        );
        db.prepare('UPDATE users SET inquiries_count = inquiries_count + 1 WHERE id = ?').run(innovatorId);
        const updatedInn = db.prepare('SELECT inquiries_count FROM users WHERE id = ?').get(innovatorId);

        return sendJson(res, 201, { ok: true, inquiriesCount: updatedInn ? updatedInn.inquiries_count : 1 });
      }

      // ------------------------------------------------------------------
      // STAFF-ONLY PROTECTED ROUTES (Role Check: role === 'staff')
      // ------------------------------------------------------------------
      if (pathname.startsWith('/api/staff/')) {
        if (!currentUser) {
          return sendJson(res, 401, { error: 'Authentication required to access Staff Secretariat tools.' });
        }
        if (currentUser.role !== 'staff') {
          return sendJson(res, 403, { error: 'Forbidden: Only AFOSTECH Staff Officials have access to Secretariat controls and confidential records.' });
        }

        if (pathname === '/api/staff/dashboard' && method === 'GET') {
          const partnershipRequests = db.prepare('SELECT * FROM partnership_requests ORDER BY created_at DESC').all().map(mapPartnershipRow);
          const verificationDispatches = db.prepare('SELECT * FROM verification_dispatches ORDER BY created_at DESC').all().map(mapDispatchRow);
          const innovators = db.prepare("SELECT * FROM users WHERE role = 'innovator' ORDER BY created_at DESC").all().map(r => mapUserRow(r, true));
          const investorInquiries = db.prepare('SELECT * FROM investor_inquiries ORDER BY created_at DESC').all();
          return sendJson(res, 200, {
            partnershipRequests,
            verificationDispatches,
            innovators,
            investorInquiries
          });
        }

        const approveMatch = pathname.match(/^\/api\/staff\/partnerships\/([^/]+)\/approve$/);
        if (approveMatch && method === 'POST') {
          const reqId = approveMatch[1];
          const pReq = db.prepare('SELECT * FROM partnership_requests WHERE id = ?').get(reqId);
          if (!pReq) return sendJson(res, 404, { error: 'Partnership request not found' });

          db.prepare("UPDATE partnership_requests SET status = 'Approved' WHERE id = ?").run(reqId);
          const newUnivId = pReq.university_name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const exists = db.prepare('SELECT id FROM universities WHERE id = ?').get(newUnivId);
          let newUniversity = null;
          if (!exists) {
            const rankCount = db.prepare('SELECT COUNT(*) AS c FROM universities').get().c + 1;
            db.prepare(`
              INSERT INTO universities (
                id, name, short_name, country, city, logo_color, total_points,
                rank, projects_count, student_scientists_count, chapter_lead, strengths, dean_email
              ) VALUES (?, ?, ?, ?, ?, '#0284c7', 3000, ?, 0, 3, ?, 'Newly Affiliated Partner Chapter', ?)
            `).run(
              newUnivId, pReq.university_name, pReq.short_name || 'NEW', pReq.country,
              pReq.city || 'Main Campus', rankCount, pReq.contact_person, pReq.official_email
            );
            newUniversity = mapUniversityRow(db.prepare('SELECT * FROM universities WHERE id = ?').get(newUnivId));
          }
          return sendJson(res, 200, { ok: true, status: 'Approved', university: newUniversity });
        }

        const letterMatch = pathname.match(/^\/api\/staff\/partnerships\/([^/]+)\/letter$/);
        if (letterMatch && method === 'GET') {
          const reqId = letterMatch[1];
          const pReq = db.prepare('SELECT * FROM partnership_requests WHERE id = ?').get(reqId);
          if (!pReq) return sendJson(res, 404, { error: 'Partnership request not found' });
          return sendJson(res, 200, { partnership: mapPartnershipRow(pReq) });
        }

        const verifyInnMatch = pathname.match(/^\/api\/staff\/innovators\/([^/]+)\/verify$/);
        if (verifyInnMatch && method === 'POST') {
          const innId = verifyInnMatch[1];
          const inn = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'innovator'").get(innId);
          if (!inn) return sendJson(res, 404, { error: 'Innovator not found' });
          const nextVerified = inn.verified ? 0 : 1;
          db.prepare('UPDATE users SET verified = ?, board_of_honour = ? WHERE id = ?').run(nextVerified, nextVerified, innId);
          return sendJson(res, 200, { id: innId, verified: Boolean(nextVerified), boardOfHonour: Boolean(nextVerified) });
        }

        const confirmDispMatch = pathname.match(/^\/api\/staff\/verifications\/([^/]+)\/confirm$/);
        if (confirmDispMatch && method === 'POST') {
          const dispId = confirmDispMatch[1];
          const disp = db.prepare('SELECT * FROM verification_dispatches WHERE id = ? OR reference_code = ?').get(dispId, dispId);
          if (!disp) return sendJson(res, 404, { error: 'Verification dispatch not found' });

          const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
          const confirmedBy = `Office of the Academic Registrar - ${disp.university_name}`;
          db.prepare("UPDATE verification_dispatches SET status = 'Institutionally Verified & Authenticated', confirmed_at = ?, confirmed_by = ? WHERE id = ?").run(
            nowStr, confirmedBy, disp.id
          );

          if (disp.student_id || disp.admission_no) {
            db.prepare(`
              UPDATE users SET membership_status = 'Authenticated Member', institutional_verified = 1
              WHERE role = 'innovator' AND (id = ? OR LOWER(admission_no) = LOWER(?))
            `).run(disp.student_id || '', disp.admission_no || '');
          }

          return sendJson(res, 200, { ok: true, id: disp.id, status: 'Institutionally Verified & Authenticated', confirmedAt: nowStr });
        }

        return sendJson(res, 404, { error: 'Staff endpoint not found' });
      }

      if (pathname.startsWith('/api/')) {
        return sendJson(res, 404, { error: 'API endpoint not found' });
      }

      // ------------------------------------------------------------------
      // STATIC FILE ROUTES
      // ------------------------------------------------------------------
      if (pathname.startsWith('/foodfeed-app/')) {
        if (fs.existsSync(FOODFEED_SIBLING_DIR)) {
          const rel = pathname.slice('/foodfeed-app/'.length) || 'index.html';
          if (serveStaticFile(res, FOODFEED_SIBLING_DIR, rel)) return;
        }
        res.writeHead(404);
        res.end('AFOSTECH-FoodFeed folder not found');
        return;
      }

      const relStatic = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (serveStaticFile(res, ROOT_DIR, relStatic)) return;

      res.writeHead(404);
      res.end('Not Found');
    } catch (err) {
      console.error('Server Error:', err);
      sendJson(res, 500, { error: err.message || 'Internal Server Error' });
    }
  });

  server.db = db;
  return server;
}

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  const server = createAppServer();
  server.listen(PORT, () => {
    console.log(`AFOSTECH Server running at http://localhost:${PORT}`);
    console.log(`SQLite Database stored at ${DB_PATH}`);
  });
}

module.exports = { createAppServer };
