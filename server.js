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
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.webmanifest': 'application/manifest+json',
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

function defaultCommercialForProject(p) {
  const originCountry = (p.university_name && p.university_name.includes('Makerere'))
    ? 'Uganda'
    : (p.university_name && p.university_name.includes('KNUST'))
      ? 'Ghana'
      : (p.university_name && p.university_name.includes('Ibadan'))
        ? 'Nigeria'
        : (p.university_name && p.university_name.includes('Stellenbosch'))
          ? 'South Africa'
          : 'Kenya';

  return {
    singleUnit: 'Single Prototype Pack (150g)',
    singlePriceUSD: 2.5,
    singlePriceFormatted: '$2.50',
    wholesaleUnit: 'Wholesale Carton (20 Units)',
    wholesalePriceUSD: 42.0,
    wholesalePriceFormatted: '$42.00',
    wholesaleMinQuantity: 1,
    originCountry,
    originCity: originCountry === 'Kenya' ? 'Nairobi' : 'Main Campus',
    leadInnovatorPayoutPct: 85,
    organizationRevenuePct: 15,
    inStock: true,
    leadTimeDays: '2 - 4 Days Domestic / 5 - 8 Days Regional Freight',
    stockists: [
      {
        name: `${p.university_name || 'Campus'} Food Science Pilot Outlet`,
        city: originCountry === 'Kenya' ? 'Nairobi' : 'University Campus',
        country: originCountry,
        address: `Department of Food Science & Technology, ${p.university_name || 'Partner Campus'}`,
        phone: '+254 700 120 450',
        hours: 'Mon-Sat 8:00 AM - 5:00 PM',
        status: 'In Stock (Pilot Batch)'
      }
    ]
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
    commercial: safeJsonParse(p.commercial_json, null) || defaultCommercialForProject(p),
    createdByUserId: p.created_by_user_id || null
  };
}

function resolveLinkedAfostechUser(db, email, linkedUserId) {
  let row = null;
  if (linkedUserId) {
    row = db.prepare('SELECT * FROM users WHERE id = ?').get(linkedUserId);
  }
  if (!row && email) {
    row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  }
  if (!row) return null;
  return mapUserRow(row, true);
}

function mapAppAccountRow(row, db) {
  if (!row) return null;
  const linked = resolveLinkedAfostechUser(db, row.email, row.linked_afostech_user_id);
  const canSubmitAFOSTECH = Boolean(
    linked && (linked.role === 'staff' || (linked.role === 'innovator' && linked.membershipStatus !== 'Pending Institutional Confirmation'))
  );
  return {
    id: row.id,
    name: row.name,
    profession: row.profession,
    email: row.email,
    phone: row.phone || '',
    about: row.about || '',
    avatarUrl: row.avatar_url || '',
    linkedAfostechUserId: linked ? linked.id : (row.linked_afostech_user_id || null),
    linkedAfostechUser: linked ? {
      id: linked.id,
      name: linked.name,
      email: linked.email,
      role: linked.role,
      universityId: linked.universityId,
      universityName: linked.universityName,
      universityShortName: linked.universityShortName,
      admissionNo: linked.admissionNo,
      degree: linked.degree,
      membershipStatus: linked.membershipStatus,
      verified: linked.verified
    } : null,
    isAFOSTECHLinked: Boolean(linked),
    canSubmitAFOSTECH,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapFeedPostRow(p, comments, likedSet, repostedSet) {
  return {
    id: p.id,
    appAccountId: p.app_account_id || null,
    linkedUserId: p.linked_user_id || null,
    authorName: p.author_name,
    authorProfession: p.author_profession || p.author_degree || 'Food Science Innovator',
    authorAvatar: p.author_avatar || (p.author_name ? p.author_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FS'),
    authorAvatarUrl: p.author_avatar_url || '',
    authorColor: p.author_color || '#059669',
    universityId: p.university_id || null,
    universityName: p.university_name || 'AFOSTECH Community',
    authorDegree: p.author_degree || '',
    authorAdmissionNo: p.author_admission_no || '',
    topicTag: p.topic_tag || '#FoodChemistry',
    topicLabel: p.topic_label || 'Food Science',
    title: p.title || '',
    content: p.content || '',
    mediaType: p.media_type || 'text',
    mediaUrl: p.media_url || '',
    mediaCaption: p.media_caption || '',
    videoDuration: p.video_duration || '01:45',
    likesCount: p.likes_count || 0,
    repostsCount: p.reposts_count || 0,
    isLiked: Boolean(likedSet && likedSet.has(p.id)),
    isReposted: Boolean(repostedSet && repostedSet.has(p.id)),
    timeAgo: p.time_ago || 'Just now',
    datePosted: p.date_posted || 'Nov 2026',
    comments: (comments || []).map(c => ({
      id: c.id,
      authorName: c.author_name,
      authorRole: c.author_profession || 'Community Reader',
      authorProfession: c.author_profession || 'Community Reader',
      authorAvatar: c.author_avatar || 'FS',
      authorAvatarUrl: c.author_avatar_url || '',
      timeAgo: c.time_ago || 'Just now',
      text: c.text
    }))
  };
}

function mapMarketplaceOrderRow(o) {
  return {
    id: o.id,
    projectId: o.project_id,
    productName: o.product_name,
    buyerName: o.buyer_name,
    buyerEmail: o.buyer_email || '',
    buyerCity: o.buyer_city || '',
    buyerCountry: o.buyer_country || 'Kenya',
    tier: o.tier || 'single',
    quantity: o.quantity || 1,
    unitName: o.unit_name || 'Unit',
    subtotalUSD: o.subtotal_usd || 0,
    shippingUSD: o.shipping_usd || 0,
    totalUSD: o.total_usd || 0,
    studentPayoutUSD: o.student_payout_usd || 0,
    afostechRevenueUSD: o.afostech_revenue_usd || 0,
    status: o.status || 'Confirmed',
    createdAt: o.created_at
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
  const match = dataUrl.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const b64 = match[2];

  const extMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
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

  function ensureAppAccountForAfostechUser(afUserRow) {
    if (!afUserRow) return null;
    if (afUserRow.role === 'innovator' && afUserRow.membership_status === 'Pending Institutional Confirmation') {
      return null;
    }
    let appRow = db.prepare('SELECT * FROM app_accounts WHERE linked_afostech_user_id = ? OR LOWER(email) = LOWER(?)').get(
      afUserRow.id, afUserRow.email
    );
    if (!appRow) {
      const appId = `app-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
      const prof = afUserRow.role === 'staff'
        ? (afUserRow.staff_role || 'AFOSTECH Staff Official')
        : (afUserRow.degree ? `${afUserRow.degree} Innovator` : 'Food Science Innovator');
      db.prepare(`
        INSERT INTO app_accounts (
          id, name, profession, email, about, password_hash, linked_afostech_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(appId, afUserRow.name, prof, afUserRow.email, afUserRow.bio || '', afUserRow.password_hash, afUserRow.id);
      appRow = db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(appId);
    } else if (appRow.linked_afostech_user_id !== afUserRow.id) {
      db.prepare('UPDATE app_accounts SET linked_afostech_user_id = ? WHERE id = ?').run(afUserRow.id, appRow.id);
      appRow = db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(appRow.id);
    }
    return mapAppAccountRow(appRow, db);
  }

  function getSessionUser(req) {
    const cookies = parseCookies(req);
    let token = cookies.afostech_session;
    let appToken = cookies.afostech_app_session;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const bearer = authHeader.slice(7).trim();
      const decoded = verifyToken(bearer, secret);
      if (decoded && decoded.type !== 'app') {
        token = bearer;
      } else if (decoded && decoded.type === 'app') {
        appToken = bearer;
      }
    }
    const payload = verifyToken(token, secret);
    if (payload && payload.sub && payload.type !== 'app') {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
      if (row) return mapUserRow(row, true);
    }
    // Unified SSO: if signed into the Phone App with a verified linked AFOSTECH account, resolve Web user seamlessly
    const appPayload = verifyToken(appToken, secret);
    if (appPayload && appPayload.sub && appPayload.type === 'app') {
      const appRow = db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(appPayload.sub);
      const appMapped = appRow ? mapAppAccountRow(appRow, db) : null;
      if (appMapped && appMapped.canSubmitAFOSTECH && appMapped.linkedAfostechUserId) {
        const linkedRow = db.prepare('SELECT * FROM users WHERE id = ?').get(appMapped.linkedAfostechUserId);
        if (linkedRow) return mapUserRow(linkedRow, true);
      }
    }
    return null;
  }

  function getSessionAppAccount(req) {
    const cookies = parseCookies(req);
    let token = cookies.afostech_app_session;
    let webToken = cookies.afostech_session;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const bearer = authHeader.slice(7).trim();
      const decoded = verifyToken(bearer, secret);
      if (decoded && decoded.type === 'app') {
        token = bearer;
      } else if (decoded && decoded.type !== 'app') {
        webToken = bearer;
      }
    }
    const payload = verifyToken(token, secret);
    if (payload && payload.sub && payload.type === 'app') {
      const row = db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(payload.sub);
      if (row) return mapAppAccountRow(row, db);
    }
    // Unified SSO: if user is logged in on AFOSTECH website, reuse/provision their profile automatically in the App
    const webPayload = verifyToken(webToken, secret);
    if (webPayload && webPayload.sub && webPayload.type !== 'app') {
      const afRow = db.prepare('SELECT * FROM users WHERE id = ?').get(webPayload.sub);
      if (afRow) return ensureAppAccountForAfostechUser(afRow);
    }
    return null;
  }

  function getEffectiveSubmitter(req, currentUser, appUser) {
    if (currentUser) return currentUser;
    if (appUser && appUser.canSubmitAFOSTECH && appUser.linkedAfostechUserId) {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(appUser.linkedAfostechUserId);
      return row ? mapUserRow(row, true) : null;
    }
    return null;
  }

  function getVoterKey(req, user, appUser) {
    if (user) return `user:${user.id}`;
    if (appUser) return `app:${appUser.id}`;
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
      const currentAppUser = getSessionAppAccount(req);
      const effectiveSubmitter = getEffectiveSubmitter(req, currentUser, currentAppUser);

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
        return sendJson(res, 200, { ok: true, db: 'sqlite', app: options.primaryApp || 'portal', counts }, {
          'Access-Control-Allow-Origin': '*'
        });
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

        // Also issue Phone App SSO session cookie so transitioning to the App requires zero extra sign-in
        const appAccount = ensureAppAccountForAfostechUser(userRow);
        const cookiesOut = [
          `afostech_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`
        ];
        let appToken = null;
        if (appAccount) {
          appToken = signToken({
            type: 'app',
            sub: appAccount.id,
            email: appAccount.email,
            exp: Date.now() + 14 * 24 * 60 * 60 * 1000
          }, secret);
          cookiesOut.push(`afostech_app_session=${encodeURIComponent(appToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=1209600`);
        }

        return sendJson(res, 200, { user, token, appUser: appAccount, appToken }, {
          'Set-Cookie': cookiesOut
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
          'Set-Cookie': [
            'afostech_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
            'afostech_app_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'
          ]
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
        if (!effectiveSubmitter) return sendJson(res, 401, { error: 'Sign in with a verified AFOSTECH innovator account to submit food innovations.' });
        const body = await readJsonBody(req);
        const title = (body.title || '').trim();
        const tagline = (body.tagline || '').trim();
        const universityId = body.universityId || effectiveSubmitter.universityId || 'jkuat';
        const category = body.category || 'functional';

        if (!title || !tagline) {
          return sendJson(res, 400, { error: 'Product title and tagline are required.' });
        }

        const univ = db.prepare('SELECT * FROM universities WHERE id = ?').get(universityId);
        const univName = univ ? univ.name : (effectiveSubmitter.universityName || 'Partner University');
        const projectId = `custom-${Date.now()}`;

        let imagePath = (body.image || '').trim() || 'assets/spirocracker.svg';
        if (imagePath.startsWith('data:image/')) {
          const saved = saveBase64File(imagePath, 'images', `proj_${projectId}`, uploadsDir);
          if (saved) imagePath = saved;
        }

        const leadAdmissionNo = (body.leadAdmissionNo || effectiveSubmitter.admissionNo || 'MEMBER').trim();
        const authors = Array.isArray(body.authors) && body.authors.length > 0
          ? body.authors
          : [{ name: effectiveSubmitter.name, admissionNo: leadAdmissionNo, role: body.authorRole || 'Lead Innovator', year: 'Student Lead', contribution: 'Lead formulation author.' }];

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

        const commercialObj = body.commercial || defaultCommercialForProject({ university_name: univName });

        db.prepare(`
          INSERT INTO projects (
            id, title, tagline, university_id, university_name, lead_admission_no,
            category, category_label, authors_json, dissertation_file_json,
            featured, upvotes, peer_reviews, sustainability_score, sensory_score,
            status, summary, ingredients_json, nutrition_json, sensory_profile_json,
            process_flow_json, image, badges_json, commercial_json, created_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 0, 4.8, 8.9, 'Newly Published by Student', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          projectId, title, tagline, universityId, univName, leadAdmissionNo,
          category, category.toUpperCase(), JSON.stringify(authors), JSON.stringify(dissertationFile),
          body.summary || tagline, JSON.stringify(ingredients), JSON.stringify(nutrition),
          JSON.stringify(sensoryProfile), JSON.stringify(processFlow), imagePath,
          JSON.stringify(badges), JSON.stringify(commercialObj), effectiveSubmitter.id
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
        if (!effectiveSubmitter) return sendJson(res, 401, { error: 'Sign in with a verified AFOSTECH innovator account to submit research theses.' });
        const body = await readJsonBody(req);
        const title = (body.title || '').trim();
        const tagline = (body.tagline || '').trim();
        const abstract = (body.abstract || '').trim();
        if (!title || !abstract) return sendJson(res, 400, { error: 'Thesis title and abstract are required.' });

        const universityId = body.universityId || effectiveSubmitter.universityId || 'jkuat';
        const univ = db.prepare('SELECT * FROM universities WHERE id = ?').get(universityId);
        const thesisId = `thesis-${Date.now()}`;
        const fileObj = body.file || {
          fileName: `${(body.author || effectiveSubmitter.name).replace(/\s+/g, '_')}_2026_Thesis.pdf`,
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
          (body.author || effectiveSubmitter.name).trim(),
          (body.authorAdmissionNo || effectiveSubmitter.admissionNo || 'MEMBER').trim(),
          (body.authorDegree || effectiveSubmitter.degree || 'B.Sc. Food Science & Technology').trim(),
          effectiveSubmitter.verified ? 1 : 0,
          universityId,
          univ ? univ.short_name : (effectiveSubmitter.universityShortName || 'Affiliate'),
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
      // PHONE APP (AFOSTECH-FoodFeed): ACCOUNT AUTH, PROFILE, FEED & MARKETPLACE
      // ------------------------------------------------------------------
      if (pathname === '/api/app/bootstrap' && method === 'GET') {
        const isMember = Boolean(
          (currentUser && (currentUser.role === 'staff' || currentUser.membershipStatus !== 'Pending Institutional Confirmation')) ||
          (currentAppUser && currentAppUser.canSubmitAFOSTECH)
        );
        const orgRow = db.prepare('SELECT data_json FROM organization WHERE id = ?').get('afostech');
        const allUniversities = db.prepare('SELECT * FROM universities').all().map(mapUniversityRow);
        const allProjects = db.prepare('SELECT * FROM projects ORDER BY featured DESC, upvotes DESC').all().map(mapProjectRow);
        const thesesCount = db.prepare('SELECT COUNT(*) AS c FROM theses').get().c;
        const scientistsCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'innovator' AND membership_status != 'Pending Institutional Confirmation'").get().c;

        const achievements = {
          universitiesCount: allUniversities.length,
          scientistsCount,
          prototypesCount: allProjects.length,
          patentsCount: allProjects.filter(p => p.award || p.featured).length + 4
        };

        let universities = [];
        let projects = [];
        let theses = [];
        let innovators = [];
        let news = [];
        let competitions = [];

        if (isMember) {
          universities = allUniversities;
          projects = allProjects;
          const thesesRows = db.prepare('SELECT * FROM theses ORDER BY rowid DESC').all();
          const allThesisComments = db.prepare('SELECT * FROM thesis_comments ORDER BY rowid ASC').all();
          const thesisCommentsById = {};
          for (const c of allThesisComments) {
            if (!thesisCommentsById[c.thesis_id]) thesisCommentsById[c.thesis_id] = [];
            thesisCommentsById[c.thesis_id].push(c);
          }
          theses = thesesRows.map(t => mapThesisRow(t, thesisCommentsById[t.id] || []));
          innovators = db.prepare("SELECT * FROM users WHERE role = 'innovator' AND membership_status != 'Pending Institutional Confirmation'").all().map(r => mapUserRow(r, false));
          news = db.prepare('SELECT * FROM news').all().map(n => ({
            id: n.id, badge: n.badge, badgeColor: n.badge_color, title: n.title,
            date: n.date, summary: n.summary, actionLabel: n.action_label, link: n.link
          }));
          competitions = db.prepare('SELECT * FROM competitions').all().map(c => ({
            id: c.id, title: c.title, theme: c.theme, grandPrize: c.grand_prize,
            deadline: c.deadline, daysLeft: c.days_left, participants: c.participants,
            stages: safeJsonParse(c.stages_json, [])
          }));
        } else {
          // Public / Normal App Users: only expose Marketplace product data (no Theses, Honour Board, Leaderboard, or Innovator dossiers)
          projects = allProjects.map(p => ({
            id: p.id,
            title: p.title,
            tagline: p.tagline,
            universityId: p.universityId,
            universityName: p.universityName,
            category: p.category,
            categoryLabel: p.categoryLabel,
            image: p.image,
            sensoryScore: p.sensoryScore,
            sustainabilityScore: p.sustainabilityScore,
            commercial: p.commercial
          }));
        }

        const actorKey = getVoterKey(req, currentUser, currentAppUser);
        const likedSet = new Set(db.prepare('SELECT post_id FROM feed_post_likes WHERE actor_key = ?').all(actorKey).map(r => r.post_id));
        const repostedSet = new Set(db.prepare('SELECT post_id FROM feed_post_reposts WHERE actor_key = ?').all(actorKey).map(r => r.post_id));

        const feedRows = db.prepare('SELECT * FROM feed_posts ORDER BY rowid DESC').all();
        const feedCommentRows = db.prepare('SELECT * FROM feed_comments ORDER BY rowid ASC').all();
        const commentsByPost = {};
        for (const fc of feedCommentRows) {
          if (!commentsByPost[fc.post_id]) commentsByPost[fc.post_id] = [];
          commentsByPost[fc.post_id].push(fc);
        }
        const feedPosts = feedRows.map(p => mapFeedPostRow(p, commentsByPost[p.id] || [], likedSet, repostedSet));
        const marketplaceOrders = db.prepare('SELECT * FROM marketplace_orders ORDER BY rowid DESC').all().map(mapMarketplaceOrderRow);

        let messages = [];
        if (currentAppUser) {
          messages = db.prepare(`
            SELECT * FROM feed_messages
            WHERE recipient_account_id = ? OR LOWER(recipient_email) = LOWER(?) OR LOWER(recipient_name) = LOWER(?)
            ORDER BY rowid DESC
          `).all(currentAppUser.id, currentAppUser.email, currentAppUser.name);
        }

        const upvotedIds = isMember
          ? db.prepare('SELECT project_id FROM project_upvotes WHERE voter_key = ?').all(actorKey).map(r => r.project_id)
          : [];

        return sendJson(res, 200, {
          appUser: currentAppUser,
          canAccessMemberSections: isMember,
          achievements,
          feedPosts,
          marketplaceOrders,
          organization: orgRow ? safeJsonParse(orgRow.data_json, {}) : {},
          universities,
          projects,
          theses,
          innovators,
          news,
          competitions,
          upvotedIds,
          messages
        });
      }

      if (pathname === '/api/app/auth/register' && method === 'POST') {
        const body = await readJsonBody(req);
        const name = (body.name || '').trim();
        const profession = (body.profession || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const phone = (body.phone || '').trim();
        const about = (body.about || '').trim();
        const password = (body.password || '').trim();

        if (!name || !profession || !email || !password) {
          return sendJson(res, 400, { error: 'Name, profession, email, and password are required.' });
        }

        const existingApp = db.prepare('SELECT id FROM app_accounts WHERE LOWER(email) = LOWER(?)').get(email);
        if (existingApp) {
          return sendJson(res, 409, { error: 'An app account with this email already exists. Please sign in instead.' });
        }

        const matchedAfostech = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
        const appId = `app-${Date.now()}`;

        let avatarUrl = '';
        if (body.avatarDataUrl && typeof body.avatarDataUrl === 'string' && body.avatarDataUrl.startsWith('data:image/')) {
          const saved = saveBase64File(body.avatarDataUrl, 'avatars', `avatar_${appId}`, uploadsDir);
          if (saved) avatarUrl = saved;
        }

        db.prepare(`
          INSERT INTO app_accounts (
            id, name, profession, email, phone, about, avatar_url, password_hash, linked_afostech_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          appId, name, profession, email, phone || null, about || null, avatarUrl || null,
          hashPassword(password), matchedAfostech ? matchedAfostech.id : null
        );

        const appUser = mapAppAccountRow(db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(appId), db);
        const token = signToken({
          type: 'app',
          sub: appUser.id,
          email: appUser.email,
          exp: Date.now() + 14 * 24 * 60 * 60 * 1000
        }, secret);

        const regCookies = [
          `afostech_app_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=1209600`
        ];
        let afostechToken = null;
        if (appUser.canSubmitAFOSTECH && appUser.linkedAfostechUser) {
          afostechToken = signToken({
            sub: appUser.linkedAfostechUser.id,
            email: appUser.linkedAfostechUser.email,
            role: appUser.linkedAfostechUser.role,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000
          }, secret);
          regCookies.push(`afostech_session=${encodeURIComponent(afostechToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
        }

        return sendJson(res, 201, { appUser, token, afostechToken }, {
          'Set-Cookie': regCookies
        });
      }

      if (pathname === '/api/app/auth/login' && method === 'POST') {
        const body = await readJsonBody(req);
        const email = (body.email || '').trim().toLowerCase();
        const password = (body.password || '').trim();
        if (!email || !password) {
          return sendJson(res, 400, { error: 'Email and password are required.' });
        }

        let appRow = db.prepare('SELECT * FROM app_accounts WHERE LOWER(email) = LOWER(?)').get(email);
        if (appRow) {
          if (!verifyPassword(password, appRow.password_hash)) {
            return sendJson(res, 401, { error: 'Invalid email or password.' });
          }
          const matched = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
          if (matched && appRow.linked_afostech_user_id !== matched.id) {
            db.prepare('UPDATE app_accounts SET linked_afostech_user_id = ? WHERE id = ?').run(matched.id, appRow.id);
            appRow = db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(appRow.id);
          }
        } else {
          // Allow signing directly with AFOSTECH website credentials
          const afUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
          if (!afUser || !verifyPassword(password, afUser.password_hash)) {
            return sendJson(res, 401, { error: 'Invalid email or password.' });
          }
          if (afUser.role === 'innovator' && afUser.membership_status === 'Pending Institutional Confirmation') {
            return sendJson(res, 403, { error: 'Enrollment Pending: Your AFOSTECH student account is awaiting university confirmation.' });
          }
          const provisioned = ensureAppAccountForAfostechUser(afUser);
          appRow = provisioned ? db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(provisioned.id) : null;
        }

        const appUser = mapAppAccountRow(appRow, db);
        const token = signToken({
          type: 'app',
          sub: appUser.id,
          email: appUser.email,
          exp: Date.now() + 14 * 24 * 60 * 60 * 1000
        }, secret);

        const loginCookies = [
          `afostech_app_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=1209600`
        ];
        let afostechToken = null;
        if (appUser.canSubmitAFOSTECH && appUser.linkedAfostechUser) {
          afostechToken = signToken({
            sub: appUser.linkedAfostechUser.id,
            email: appUser.linkedAfostechUser.email,
            role: appUser.linkedAfostechUser.role,
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000
          }, secret);
          loginCookies.push(`afostech_session=${encodeURIComponent(afostechToken)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
        }

        return sendJson(res, 200, { appUser, token, afostechToken }, {
          'Set-Cookie': loginCookies
        });
      }

      if (pathname === '/api/app/auth/logout' && method === 'POST') {
        return sendJson(res, 200, { ok: true }, {
          'Set-Cookie': [
            'afostech_app_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
            'afostech_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'
          ]
        });
      }

      if (pathname === '/api/app/auth/me' && method === 'GET') {
        if (!currentAppUser) return sendJson(res, 401, { error: 'Not authenticated in app' });
        return sendJson(res, 200, { appUser: currentAppUser });
      }

      if (pathname === '/api/app/profile' && method === 'PUT') {
        if (!currentAppUser) return sendJson(res, 401, { error: 'Sign in required to update your profile.' });
        const body = await readJsonBody(req);
        const name = (body.name !== undefined ? body.name : currentAppUser.name).trim();
        const profession = (body.profession !== undefined ? body.profession : currentAppUser.profession).trim();
        const phone = (body.phone !== undefined ? body.phone : currentAppUser.phone).trim();
        const about = (body.about !== undefined ? body.about : currentAppUser.about).trim();

        if (!name || !profession) {
          return sendJson(res, 400, { error: 'Name and profession are required.' });
        }

        let avatarUrl = currentAppUser.avatarUrl || '';
        if (body.avatarDataUrl && typeof body.avatarDataUrl === 'string' && body.avatarDataUrl.startsWith('data:image/')) {
          const saved = saveBase64File(body.avatarDataUrl, 'avatars', `avatar_${currentAppUser.id}_${Date.now()}`, uploadsDir);
          if (saved) avatarUrl = saved;
        }

        const matchedAf = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(currentAppUser.email);
        db.prepare(`
          UPDATE app_accounts
          SET name = ?, profession = ?, phone = ?, about = ?, avatar_url = ?, linked_afostech_user_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(name, profession, phone || null, about || null, avatarUrl || null, matchedAf ? matchedAf.id : null, currentAppUser.id);

        // Keep author attribution updated cleanly on user's posts and linked AFOSTECH web profile
        db.prepare('UPDATE feed_posts SET author_name = ?, author_profession = ?, author_avatar_url = ? WHERE app_account_id = ?').run(
          name, profession, avatarUrl || null, currentAppUser.id
        );
        if (matchedAf) {
          db.prepare('UPDATE users SET name = ?, bio = ? WHERE id = ?').run(name, about || '', matchedAf.id);
        }

        const updated = mapAppAccountRow(db.prepare('SELECT * FROM app_accounts WHERE id = ?').get(currentAppUser.id), db);
        return sendJson(res, 200, { appUser: updated });
      }

      if (pathname === '/api/feed/posts' && method === 'POST') {
        const poster = currentAppUser || (currentUser ? {
          id: null,
          name: currentUser.name,
          profession: currentUser.role === 'staff' ? (currentUser.staffRole || 'AFOSTECH Official') : (currentUser.degree || 'Student Innovator'),
          avatarUrl: '',
          linkedAfostechUser: currentUser
        } : null);

        if (!poster) {
          return sendJson(res, 401, { error: 'Please create an account or sign in to publish posts to the Food Science Feed.' });
        }

        const body = await readJsonBody(req);
        const title = (body.title || '').trim();
        const content = (body.content || '').trim();
        const mediaType = ['text', 'image', 'video'].includes(body.mediaType) ? body.mediaType : 'text';
        const mediaCaption = (body.mediaCaption || '').trim();
        const topicTag = (body.topicTag || '#FoodChemistry').trim();
        const videoDuration = (body.videoDuration || '01:45').trim();

        if (!content && !mediaCaption) {
          return sendJson(res, 400, { error: 'Post caption or text content is required.' });
        }

        const postId = `post-${Date.now()}`;
        let mediaUrl = (body.mediaUrl || '').trim();
        if (body.mediaDataUrl && typeof body.mediaDataUrl === 'string' && body.mediaDataUrl.startsWith('data:')) {
          const subdir = mediaType === 'video' ? 'videos' : 'images';
          const saved = saveBase64File(body.mediaDataUrl, subdir, `feed_${postId}`, uploadsDir);
          if (saved) mediaUrl = saved;
        }

        const linked = poster.linkedAfostechUser || null;
        const initials = poster.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'FS';

        db.prepare(`
          INSERT INTO feed_posts (
            id, app_account_id, linked_user_id, author_name, author_profession,
            author_avatar, author_avatar_url, author_color, university_id, university_name,
            author_degree, author_admission_no, topic_tag, topic_label, title, content,
            media_type, media_url, media_caption, video_duration, likes_count, reposts_count,
            time_ago, date_posted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, '#059669', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'Just now', 'Nov 2026')
        `).run(
          postId, poster.id || null, linked ? linked.id : null,
          poster.name, poster.profession, initials, poster.avatarUrl || null,
          linked ? linked.universityId : null,
          linked ? (linked.universityShortName || linked.universityName) : 'AFOSTECH Community',
          linked ? linked.degree : poster.profession,
          linked ? linked.admissionNo : null,
          topicTag, topicTag.replace('#', ''),
          title || null, content || mediaCaption,
          mediaType, mediaUrl || null, mediaCaption || null,
          mediaType === 'video' ? videoDuration : null
        );

        const createdRow = db.prepare('SELECT * FROM feed_posts WHERE id = ?').get(postId);
        return sendJson(res, 201, { post: mapFeedPostRow(createdRow, [], new Set([postId]), new Set()) });
      }

      const feedLikeMatch = pathname.match(/^\/api\/feed\/posts\/([^/]+)\/like$/);
      if (feedLikeMatch && method === 'POST') {
        const postId = feedLikeMatch[1];
        const postRow = db.prepare('SELECT * FROM feed_posts WHERE id = ?').get(postId);
        if (!postRow) return sendJson(res, 404, { error: 'Post not found' });

        const actorKey = getVoterKey(req, currentUser, currentAppUser);
        const existing = db.prepare('SELECT 1 FROM feed_post_likes WHERE post_id = ? AND actor_key = ?').get(postId, actorKey);
        let isLiked;
        let likesCount;
        if (existing) {
          db.prepare('DELETE FROM feed_post_likes WHERE post_id = ? AND actor_key = ?').run(postId, actorKey);
          likesCount = Math.max(0, (postRow.likes_count || 0) - 1);
          isLiked = false;
        } else {
          db.prepare('INSERT INTO feed_post_likes (post_id, actor_key) VALUES (?, ?)').run(postId, actorKey);
          likesCount = (postRow.likes_count || 0) + 1;
          isLiked = true;
        }
        db.prepare('UPDATE feed_posts SET likes_count = ? WHERE id = ?').run(likesCount, postId);
        return sendJson(res, 200, { postId, likesCount, isLiked });
      }

      const feedRepostMatch = pathname.match(/^\/api\/feed\/posts\/([^/]+)\/repost$/);
      if (feedRepostMatch && method === 'POST') {
        const postId = feedRepostMatch[1];
        const postRow = db.prepare('SELECT * FROM feed_posts WHERE id = ?').get(postId);
        if (!postRow) return sendJson(res, 404, { error: 'Post not found' });

        const actorKey = getVoterKey(req, currentUser, currentAppUser);
        const existing = db.prepare('SELECT 1 FROM feed_post_reposts WHERE post_id = ? AND actor_key = ?').get(postId, actorKey);
        let repostsCount = postRow.reposts_count || 0;
        if (!existing) {
          db.prepare('INSERT INTO feed_post_reposts (post_id, actor_key) VALUES (?, ?)').run(postId, actorKey);
          repostsCount += 1;
          db.prepare('UPDATE feed_posts SET reposts_count = ? WHERE id = ?').run(repostsCount, postId);
        }
        return sendJson(res, 200, { postId, repostsCount, isReposted: true });
      }

      const feedCommMatch = pathname.match(/^\/api\/feed\/posts\/([^/]+)\/comments$/);
      if (feedCommMatch && method === 'POST') {
        const postId = feedCommMatch[1];
        const postRow = db.prepare('SELECT id FROM feed_posts WHERE id = ?').get(postId);
        if (!postRow) return sendJson(res, 404, { error: 'Post not found' });

        const body = await readJsonBody(req);
        const text = (body.text || '').trim();
        if (!text) return sendJson(res, 400, { error: 'Comment text is required.' });

        const authorName = (body.authorName || (currentAppUser && currentAppUser.name) || (currentUser && currentUser.name) || 'Community Reader').trim();
        const authorProfession = (body.authorProfession || body.authorRole || (currentAppUser && currentAppUser.profession) || 'Food Science Enthusiast').trim();
        const authorAvatar = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FS';
        const authorAvatarUrl = (currentAppUser && currentAppUser.avatarUrl) || '';
        const commentId = `fc-${Date.now()}`;

        db.prepare(`
          INSERT INTO feed_comments (id, post_id, author_name, author_profession, author_avatar, author_avatar_url, time_ago, text)
          VALUES (?, ?, ?, ?, ?, ?, 'Just now', ?)
        `).run(commentId, postId, authorName, authorProfession, authorAvatar, authorAvatarUrl || null, text);

        return sendJson(res, 201, {
          comment: {
            id: commentId,
            authorName,
            authorRole: authorProfession,
            authorProfession,
            authorAvatar,
            authorAvatarUrl,
            timeAgo: 'Just now',
            text
          }
        });
      }

      const feedMsgMatch = pathname.match(/^\/api\/feed\/posts\/([^/]+)\/messages$/);
      if (feedMsgMatch && method === 'POST') {
        const postId = feedMsgMatch[1];
        const postRow = db.prepare('SELECT * FROM feed_posts WHERE id = ?').get(postId);
        if (!postRow) return sendJson(res, 404, { error: 'Post not found' });

        const body = await readJsonBody(req);
        const senderName = (body.senderName || (currentAppUser && currentAppUser.name) || '').trim();
        const senderContact = (body.senderContact || (currentAppUser && currentAppUser.email) || '').trim();
        const messageText = (body.messageText || '').trim();
        if (!senderName || !senderContact || !messageText) {
          return sendJson(res, 400, { error: 'Your name, contact email/phone, and message are required.' });
        }

        let recipientEmail = '';
        if (postRow.app_account_id) {
          const acc = db.prepare('SELECT email FROM app_accounts WHERE id = ?').get(postRow.app_account_id);
          if (acc) recipientEmail = acc.email;
        }
        const msgId = `msg-${Date.now()}`;
        db.prepare(`
          INSERT INTO feed_messages (
            id, post_id, recipient_name, recipient_email, recipient_account_id,
            sender_name, sender_contact, inquiry_type, message_text
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          msgId, postId, postRow.author_name, recipientEmail || null, postRow.app_account_id || null,
          senderName, senderContact, (body.inquiryType || 'Scientific Inquiry').trim(), messageText
        );

        return sendJson(res, 201, {
          message: db.prepare('SELECT * FROM feed_messages WHERE id = ?').get(msgId)
        });
      }

      if (pathname === '/api/marketplace/orders' && method === 'GET') {
        const orders = db.prepare('SELECT * FROM marketplace_orders ORDER BY rowid DESC').all().map(mapMarketplaceOrderRow);
        return sendJson(res, 200, { orders });
      }

      if (pathname === '/api/marketplace/orders' && method === 'POST') {
        const body = await readJsonBody(req);
        const projectId = (body.projectId || '').trim();
        const buyerName = (body.buyerName || (currentAppUser && currentAppUser.name) || '').trim();
        const buyerCountry = (body.buyerCountry || 'Kenya').trim();
        const buyerCity = (body.buyerCity || '').trim();
        const tier = body.tier === 'wholesale' ? 'wholesale' : 'single';
        const quantity = Math.max(1, Number(body.quantity) || 1);

        const projectRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!projectRow) return sendJson(res, 404, { error: 'Product innovation not found.' });
        if (!buyerName || !buyerCity) {
          return sendJson(res, 400, { error: 'Recipient name and delivery city are required.' });
        }

        const comm = safeJsonParse(projectRow.commercial_json, null) || defaultCommercialForProject(projectRow);
        const isCrossBorder = buyerCountry.toLowerCase() !== (comm.originCountry || 'Kenya').toLowerCase();
        const effectiveTier = isCrossBorder ? 'wholesale' : tier;
        const unitPrice = effectiveTier === 'wholesale' ? Number(comm.wholesalePriceUSD || 40) : Number(comm.singlePriceUSD || 2.5);
        const unitName = effectiveTier === 'wholesale' ? (comm.wholesaleUnit || 'Wholesale Carton') : (comm.singleUnit || 'Sample Pack');
        const subtotal = Number((unitPrice * quantity).toFixed(2));
        const shipping = Number((isCrossBorder ? (18 + quantity * 6) : 3.5).toFixed(2));
        const total = Number((subtotal + shipping).toFixed(2));
        const studentPayout = Number((subtotal * 0.85).toFixed(2));
        const afostechRevenue = Number((subtotal * 0.15).toFixed(2));

        const orderId = `AFOST-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const status = isCrossBorder ? 'Awaiting Cross-Border Export Dispatch' : 'Domestic Dispatch Scheduled (24h)';

        db.prepare(`
          INSERT INTO marketplace_orders (
            id, project_id, product_name, buyer_name, buyer_email, buyer_city, buyer_country,
            tier, quantity, unit_name, subtotal_usd, shipping_usd, total_usd,
            student_payout_usd, afostech_revenue_usd, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId, projectId, projectRow.title, buyerName,
          (body.buyerEmail || (currentAppUser && currentAppUser.email) || '').trim(),
          buyerCity, buyerCountry, effectiveTier, quantity, unitName,
          subtotal, shipping, total, studentPayout, afostechRevenue, status
        );

        const order = mapMarketplaceOrderRow(db.prepare('SELECT * FROM marketplace_orders WHERE id = ?').get(orderId));
        return sendJson(res, 201, { order });
      }

      const cycleOrderMatch = pathname.match(/^\/api\/marketplace\/orders\/([^/]+)\/cycle$/);
      if (cycleOrderMatch && method === 'POST') {
        const orderId = cycleOrderMatch[1];
        const row = db.prepare('SELECT * FROM marketplace_orders WHERE id = ?').get(orderId);
        if (!row) return sendJson(res, 404, { error: 'Order not found' });
        const statuses = [
          'Domestic Dispatch Scheduled (24h)',
          'Awaiting Cross-Border Export Dispatch',
          'Dispatched via Cold-Chain Logistics',
          'Delivered to Buyer'
        ];
        const idx = statuses.indexOf(row.status);
        const nextStatus = statuses[(idx + 1) % statuses.length];
        db.prepare('UPDATE marketplace_orders SET status = ? WHERE id = ?').run(nextStatus, orderId);
        return sendJson(res, 200, { order: mapMarketplaceOrderRow(db.prepare('SELECT * FROM marketplace_orders WHERE id = ?').get(orderId)) });
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
          const universities = db.prepare('SELECT * FROM universities ORDER BY rank ASC').all().map(mapUniversityRow);
          const projects = db.prepare('SELECT * FROM projects ORDER BY featured DESC, upvotes DESC').all().map(mapProjectRow);
          const theses = db.prepare('SELECT * FROM theses ORDER BY rowid DESC').all().map(t => mapThesisRow(t, []));
          const news = db.prepare('SELECT * FROM news ORDER BY rowid DESC').all().map(n => ({
            id: n.id, badge: n.badge, badgeColor: n.badge_color, title: n.title,
            date: n.date, summary: n.summary, actionLabel: n.action_label, link: n.link
          }));
          const feedPosts = db.prepare('SELECT * FROM feed_posts ORDER BY rowid DESC').all().map(p => mapFeedPostRow(p, [], new Set(), new Set()));
          const marketplaceOrders = db.prepare('SELECT * FROM marketplace_orders ORDER BY rowid DESC').all().map(mapMarketplaceOrderRow);
          const appAccounts = db.prepare('SELECT * FROM app_accounts ORDER BY created_at DESC').all().map(r => mapAppAccountRow(r, db));

          const stats = {
            totalUniversities: universities.length,
            totalInnovators: innovators.length,
            verifiedInnovators: innovators.filter(i => i.verified).length,
            pendingVerifications: verificationDispatches.filter(d => !(d.status || '').toLowerCase().includes('verified')).length,
            pendingPartnerships: partnershipRequests.filter(r => r.status !== 'Approved').length,
            totalProjects: projects.length,
            totalTheses: theses.length,
            totalFeedPosts: feedPosts.length,
            totalAppAccounts: appAccounts.length,
            totalOrders: marketplaceOrders.length,
            totalSalesUSD: Number(marketplaceOrders.reduce((s, o) => s + Number(o.totalUSD || 0), 0).toFixed(2)),
            innovatorPayoutUSD: Number(marketplaceOrders.reduce((s, o) => s + Number(o.studentPayoutUSD || 0), 0).toFixed(2)),
            consortiumRevenueUSD: Number(marketplaceOrders.reduce((s, o) => s + Number(o.afostechRevenueUSD || 0), 0).toFixed(2))
          };

          return sendJson(res, 200, {
            partnershipRequests,
            verificationDispatches,
            innovators,
            investorInquiries,
            universities,
            projects,
            theses,
            news,
            feedPosts,
            marketplaceOrders,
            appAccounts,
            stats
          });
        }

        const staffProjFeatMatch = pathname.match(/^\/api\/staff\/projects\/([^/]+)\/featured$/);
        if (staffProjFeatMatch && method === 'POST') {
          const projectId = staffProjFeatMatch[1];
          const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
          if (!row) return sendJson(res, 404, { error: 'Innovation not found' });
          const nextFeat = row.featured ? 0 : 1;
          db.prepare('UPDATE projects SET featured = ? WHERE id = ?').run(nextFeat, projectId);
          return sendJson(res, 200, { id: projectId, featured: Boolean(nextFeat) });
        }

        const staffProjDelMatch = pathname.match(/^\/api\/staff\/projects\/([^/]+)$/);
        if (staffProjDelMatch && method === 'DELETE') {
          const projectId = staffProjDelMatch[1];
          const info = db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
          if (!info.changes) return sendJson(res, 404, { error: 'Innovation not found' });
          return sendJson(res, 200, { ok: true, id: projectId });
        }

        const staffThesisDelMatch = pathname.match(/^\/api\/staff\/theses\/([^/]+)$/);
        if (staffThesisDelMatch && method === 'DELETE') {
          const thesisId = staffThesisDelMatch[1];
          const info = db.prepare('DELETE FROM theses WHERE id = ?').run(thesisId);
          if (!info.changes) return sendJson(res, 404, { error: 'Thesis not found' });
          return sendJson(res, 200, { ok: true, id: thesisId });
        }

        const staffFeedDelMatch = pathname.match(/^\/api\/staff\/feed\/posts\/([^/]+)$/);
        if (staffFeedDelMatch && method === 'DELETE') {
          const postId = staffFeedDelMatch[1];
          const info = db.prepare('DELETE FROM feed_posts WHERE id = ?').run(postId);
          if (!info.changes) return sendJson(res, 404, { error: 'Feed post not found' });
          return sendJson(res, 200, { ok: true, id: postId });
        }

        if (pathname === '/api/staff/news' && method === 'POST') {
          const body = await readJsonBody(req);
          const title = (body.title || '').trim();
          const summary = (body.summary || '').trim();
          if (!title || !summary) return sendJson(res, 400, { error: 'Bulletin title and summary are required.' });
          const newsId = `news-${Date.now()}`;
          const badge = (body.badge || 'Consortium Bulletin').trim();
          const badgeColor = (body.badgeColor || '#059669').trim();
          const date = (body.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })).trim();
          const actionLabel = (body.actionLabel || 'Learn More →').trim();
          const link = (body.link || '#newsView').trim();
          db.prepare('INSERT INTO news (id, badge, badge_color, title, date, summary, action_label, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
            newsId, badge, badgeColor, title, date, summary, actionLabel, link
          );
          return sendJson(res, 201, {
            item: { id: newsId, badge, badgeColor, title, date, summary, actionLabel, link }
          });
        }

        const staffNewsDelMatch = pathname.match(/^\/api\/staff\/news\/([^/]+)$/);
        if (staffNewsDelMatch && method === 'DELETE') {
          const newsId = staffNewsDelMatch[1];
          const info = db.prepare('DELETE FROM news WHERE id = ?').run(newsId);
          if (!info.changes) return sendJson(res, 404, { error: 'News item not found' });
          return sendJson(res, 200, { ok: true, id: newsId });
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
      if (pathname.startsWith('/uploads/')) {
        const relUpload = pathname.slice('/uploads/'.length);
        if (serveStaticFile(res, uploadsDir, relUpload)) return;
      }

      if (pathname.startsWith('/foodfeed-app/')) {
        if (fs.existsSync(FOODFEED_SIBLING_DIR)) {
          const rel = pathname.slice('/foodfeed-app/'.length) || 'index.html';
          if (serveStaticFile(res, FOODFEED_SIBLING_DIR, rel)) return;
          if (serveStaticFile(res, ROOT_DIR, rel)) return;
        }
        res.writeHead(404);
        res.end('AFOSTECH-FoodFeed folder not found');
        return;
      }

      if (options.primaryApp === 'foodfeed' && fs.existsSync(FOODFEED_SIBLING_DIR)) {
        if (pathname.startsWith('/portal/')) {
          const relPortal = pathname.slice('/portal/'.length) || 'index.html';
          if (serveStaticFile(res, ROOT_DIR, relPortal)) return;
        }
        const relFeed = pathname === '/' ? 'index.html' : pathname.slice(1);
        if (serveStaticFile(res, FOODFEED_SIBLING_DIR, relFeed)) return;
        if (serveStaticFile(res, ROOT_DIR, relFeed)) return;
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const relStatic = pathname === '/'
        ? 'index.html'
        : (pathname === '/admin' ? 'admin.html' : pathname.slice(1));
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
