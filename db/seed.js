const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { hashPassword } = require('./database');

function loadInitialDataFromClientFile() {
  const dataFile = path.join(__dirname, '..', 'js', 'data.js');
  const raw = fs.readFileSync(dataFile, 'utf8');
  const sandbox = {};
  vm.runInNewContext(raw.replace('const AFOSTECH_DATA =', 'var AFOSTECH_DATA ='), sandbox);
  return sandbox.AFOSTECH_DATA;
}

function loadSiblingModuleData(relFile, varName) {
  const candidate = path.resolve(__dirname, '..', '..', 'AFOSTECH-FoodFeed', 'js', relFile);
  if (!fs.existsSync(candidate)) return null;
  try {
    const raw = fs.readFileSync(candidate, 'utf8');
    const sandbox = {};
    vm.runInNewContext(raw.replace(`const ${varName} =`, `var ${varName} =`), sandbox);
    return sandbox[varName];
  } catch (e) {
    return null;
  }
}

function seedFeedAndMarketplace(db) {
  const feedData = loadSiblingModuleData('feed-data.js', 'FEED_DATA');
  const mktData = loadSiblingModuleData('marketplace-data.js', 'MARKETPLACE_DATA');

  db.exec('BEGIN');
  try {
    // Backfill commercial_json on existing projects from marketplace seed if missing
    if (mktData && Array.isArray(mktData.products)) {
      const updateComm = db.prepare('UPDATE projects SET commercial_json = ? WHERE id = ? AND (commercial_json IS NULL OR commercial_json = \'\')');
      for (const mp of mktData.products) {
        if (mp && mp.id && mp.commercial) {
          updateComm.run(JSON.stringify(mp.commercial), mp.id);
        }
      }
    }

    // Seed feed_posts & feed_comments if empty
    const feedCount = db.prepare('SELECT COUNT(*) AS cnt FROM feed_posts').get().cnt;
    if (feedCount === 0 && feedData && Array.isArray(feedData.feedPosts)) {
      const insertPost = db.prepare(`
        INSERT INTO feed_posts (
          id, author_name, author_profession, author_avatar, author_color,
          university_id, university_name, author_degree, author_admission_no,
          topic_tag, topic_label, title, content, media_type, media_url,
          media_caption, video_duration, likes_count, reposts_count, time_ago, date_posted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertComment = db.prepare(`
        INSERT INTO feed_comments (
          id, post_id, author_name, author_profession, author_avatar, time_ago, text
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of feedData.feedPosts) {
        insertPost.run(
          p.id, p.authorName, p.authorRole || p.authorDegree || 'Food Science Researcher',
          p.authorAvatar || null, p.authorColor || '#059669',
          p.universityId || null, p.universityName || null, p.authorDegree || null,
          p.authorAdmissionNo || null, p.topicTag || '#FoodChemistry',
          p.topicLabel || 'Food Science', p.title || null, p.content || '',
          p.mediaType || 'text', p.mediaUrl || null, p.mediaCaption || null,
          p.videoDuration || null, p.likesCount || 0, p.repostsCount || 0,
          p.timeAgo || 'Recent', p.datePosted || 'Nov 2026'
        );
        for (const c of p.comments || []) {
          insertComment.run(
            c.id || `fc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            p.id, c.authorName, c.authorRole || 'Community Reader',
            c.authorAvatar || 'FS', c.timeAgo || 'Recent', c.text || ''
          );
        }
      }
    }

    // Seed marketplace_orders if empty
    const orderCount = db.prepare('SELECT COUNT(*) AS cnt FROM marketplace_orders').get().cnt;
    if (orderCount === 0 && mktData && Array.isArray(mktData.productOrders)) {
      const insertOrder = db.prepare(`
        INSERT INTO marketplace_orders (
          id, project_id, product_name, buyer_name, buyer_email, buyer_city,
          buyer_country, tier, quantity, unit_name, subtotal_usd, shipping_usd,
          total_usd, student_payout_usd, afostech_revenue_usd, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const o of mktData.productOrders) {
        insertOrder.run(
          o.id, o.projectId || 'proj-1', o.productName, o.buyerName, o.buyerEmail || null,
          o.buyerCity || '', o.buyerCountry || 'Kenya', o.tier || 'single',
          o.quantity || 1, o.unitName || 'Unit', o.subtotalUSD || 0, o.shippingUSD || 0,
          o.totalUSD || 0, o.studentPayoutUSD || 0, o.afostechRevenueUSD || 0,
          o.status || 'Confirmed'
        );
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function seedDatabase(db) {
  const orgCount = db.prepare('SELECT COUNT(*) AS cnt FROM organization').get().cnt;
  if (orgCount > 0) {
    seedFeedAndMarketplace(db);
    return false; // Core already seeded; ensured Feed/Marketplace data present
  }

  const data = loadInitialDataFromClientFile();

  db.exec('BEGIN');
  try {
    // 1. Organization metadata
    db.prepare('INSERT INTO organization (id, data_json) VALUES (?, ?)').run(
      'afostech',
      JSON.stringify(data.organization || {})
    );

    // 2. Staff Officials (role = 'staff')
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, staff_role, department,
        admission_no, university_id, university_name, university_short_name,
        degree, year_of_study, membership_status, institutional_verified,
        verified, board_of_honour, pitched_competition, product_name, product_id,
        bio, cv_file_name, cv_file_size, public_safety_certified,
        investor_ask_json, inquiries_count, registered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of data.staffOfficials || []) {
      insertUser.run(
        s.id,
        s.name,
        s.email,
        hashPassword(s.password || 'admin123'),
        'staff',
        s.role || 'Consortium Official',
        s.department || 'Consortium Secretariat',
        null, null, null, null, null, null,
        'Staff Official',
        1, 1, 0, null, null, null,
        `${s.role} at ${s.department}`,
        null, null, 1, null, 0, 'Established'
      );
    }

    // 3. Student Innovators (role = 'innovator')
    for (const inn of data.innovators || []) {
      insertUser.run(
        inn.id,
        inn.name,
        inn.email,
        hashPassword(inn.password || 'innovator2026'),
        'innovator',
        null,
        'Food Science & Technology',
        inn.admissionNo || null,
        inn.universityId || null,
        inn.universityName || null,
        inn.universityShortName || null,
        inn.degree || null,
        inn.yearOfStudy || null,
        inn.membershipStatus || 'Authenticated Member',
        inn.institutionalVerified === false ? 0 : 1,
        inn.verified ? 1 : 0,
        inn.boardOfHonour ? 1 : 0,
        inn.pitchedCompetition || null,
        inn.productName || null,
        inn.productId || null,
        inn.bio || null,
        inn.cvFileName || null,
        inn.cvFileSize || null,
        inn.publicSafetyCertified ? 1 : 0,
        inn.investorAsk ? JSON.stringify(inn.investorAsk) : null,
        inn.inquiriesCount || 0,
        inn.registeredAt || 'Nov 2026'
      );
    }

    // 4. Universities
    const insertUniv = db.prepare(`
      INSERT INTO universities (
        id, name, short_name, country, city, logo_color, badge_color,
        total_points, rank, projects_count, student_scientists_count,
        chapter_lead, strengths, verification_email, dean_email, faculty, registrar_officer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of data.universities || []) {
      insertUniv.run(
        u.id, u.name, u.shortName, u.country, u.city || null,
        u.logoColor || '#059669', u.badgeColor || null,
        u.totalPoints || 3000, u.rank || 1, u.projectsCount || 0,
        u.studentScientistsCount || 3, u.chapterLead || null,
        u.strengths || null, u.verificationEmail || null, u.deanEmail || null,
        u.faculty || null, u.registrarOfficer || null
      );
    }

    // 5. Projects
    const insertProject = db.prepare(`
      INSERT INTO projects (
        id, title, tagline, university_id, university_name, lead_admission_no,
        category, category_label, authors_json, dissertation_file_json,
        featured, award, upvotes, peer_reviews, sustainability_score, sensory_score,
        status, summary, ingredients_json, nutrition_json, sensory_profile_json,
        process_flow_json, image, badges_json, institutional_verification_json,
        created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of data.projects || []) {
      insertProject.run(
        p.id, p.title, p.tagline || '', p.universityId, p.universityName,
        p.leadAdmissionNo || null, p.category, p.categoryLabel || p.category,
        JSON.stringify(p.authors || []),
        p.dissertationFile ? JSON.stringify(p.dissertationFile) : null,
        p.featured ? 1 : 0, p.award || null, p.upvotes || 0, p.peerReviews || 0,
        p.sustainabilityScore || 4.5, p.sensoryScore || 8.5, p.status || 'Active',
        p.summary || '', JSON.stringify(p.ingredients || []),
        JSON.stringify(p.nutritionPer100g || {}),
        JSON.stringify(p.sensoryProfile || {}),
        JSON.stringify(p.processFlow || []),
        p.image || 'assets/spirocracker.svg',
        JSON.stringify(p.badges || []),
        p.institutionalVerification ? JSON.stringify(p.institutionalVerification) : null,
        null
      );
    }

    // 6. Theses + Comments
    const insertThesis = db.prepare(`
      INSERT INTO theses (
        id, title, tagline, author, author_admission_no, author_degree, author_verified,
        university_id, university_name, supervisors, department, category, category_label,
        date_submitted, year, abstract, keywords_json, file_json, views_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertComment = db.prepare(`
      INSERT INTO thesis_comments (id, thesis_id, author, role, university, date, text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of data.theses || []) {
      insertThesis.run(
        t.id, t.title, t.tagline || '', t.author, t.authorAdmissionNo || null,
        t.authorDegree || null, t.authorVerified ? 1 : 0, t.universityId, t.universityName,
        t.supervisors || null, t.department || null, t.category, t.categoryLabel || t.category,
        t.dateSubmitted || 'Nov 2026', t.year || '2026', t.abstract || '',
        JSON.stringify(t.keywords || []), JSON.stringify(t.file || {}),
        t.viewsCount || 0
      );
      for (const c of t.comments || []) {
        insertComment.run(
          c.id, t.id, c.author, c.role || 'Reviewer',
          c.university || t.universityName || 'Consortium Member',
          c.date || 'Nov 2026', c.content || c.text || ''
        );
      }
    }

    // 7. Confidential Partnership Requests
    const insertPartner = db.prepare(`
      INSERT INTO partnership_requests (
        id, university_name, short_name, country, city, reference_no,
        faculty_department, official_email, contact_person, contact_title,
        student_enrollment, status, date_applied, letter_document_json,
        letter_file_path, letter_subject, letter_of_intent, full_letter_body
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of data.partnershipRequests || []) {
      insertPartner.run(
        r.id, r.universityName, r.shortName || null, r.country, r.city || null,
        r.referenceNo || null, r.facultyDepartment || null, r.officialEmail,
        r.contactPerson, r.contactTitle || null, r.studentEnrollment || null,
        r.status || 'Pending Official Review', r.dateApplied || 'Nov 2026',
        r.letterDocumentFile ? JSON.stringify(r.letterDocumentFile) : null,
        null, r.letterSubject || null, r.letterOfIntent || null, r.fullLetterBody || null
      );
    }

    // 8. Verification Dispatches
    const insertDisp = db.prepare(`
      INSERT INTO verification_dispatches (
        id, type, reference_code, project_id, project_title, applicant_name, author_name,
        admission_no, degree, year_of_study, student_email, university_id, university_name,
        university_short_name, recipient_email, cc_emails, dispatched_at, status,
        confirmed_at, confirmed_by, dissertation_doc, all_authors_json, purpose, student_id, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const d of data.verificationDispatches || []) {
      insertDisp.run(
        d.id, d.type || 'Project Showcase Verification', d.referenceCode || null,
        d.projectId || null, d.projectTitle || null, d.applicantName || null, d.authorName || null,
        d.admissionNo || null, d.degree || null, d.yearOfStudy || null, d.studentEmail || null,
        d.universityId || null, d.universityName || null, d.universityShortName || null,
        d.recipientEmail || null, d.ccEmails || null, d.dispatchedAt || null, d.status || null,
        d.confirmedAt || null, d.confirmedBy || null, d.dissertationDoc || null,
        d.allAuthors ? JSON.stringify(d.allAuthors) : null, d.purpose || null,
        d.studentId || null, d.remarks || null
      );
    }

    // 9. News, Competitions, Testimonials
    const insertNews = db.prepare(`
      INSERT INTO news (id, badge, badge_color, title, date, summary, action_label, link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of data.news || []) {
      insertNews.run(n.id, n.badge, n.badgeColor, n.title, n.date, n.summary, n.actionLabel, n.link);
    }

    const insertComp = db.prepare(`
      INSERT INTO competitions (id, title, theme, grand_prize, deadline, days_left, participants, stages_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of data.competitions || []) {
      insertComp.run(
        c.id, c.title, c.theme, c.grandPrize, c.deadline,
        c.daysLeft || 30, c.participants, JSON.stringify(c.stages || [])
      );
    }

    const insertTest = db.prepare('INSERT INTO testimonials (name, title, quote) VALUES (?, ?, ?)');
    for (const t of data.testimonials || []) {
      insertTest.run(t.name, t.title, t.quote);
    }

    db.exec('COMMIT');
    seedFeedAndMarketplace(db);
    return true;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { seedDatabase };
