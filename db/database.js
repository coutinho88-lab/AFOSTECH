const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'afostech.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

['images', 'letters', 'theses', 'dissertations', 'avatars', 'videos'].forEach(sub => {
  fs.mkdirSync(path.join(UPLOADS_DIR, sub), { recursive: true });
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(String(password), salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function createDatabase(dbPath = DB_PATH) {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('staff', 'innovator')),
      staff_role TEXT,
      department TEXT,
      admission_no TEXT UNIQUE COLLATE NOCASE,
      university_id TEXT,
      university_name TEXT,
      university_short_name TEXT,
      degree TEXT,
      year_of_study TEXT,
      membership_status TEXT DEFAULT 'Authenticated Member',
      institutional_verified INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      board_of_honour INTEGER DEFAULT 0,
      pitched_competition TEXT,
      product_name TEXT,
      product_id TEXT,
      bio TEXT,
      cv_file_name TEXT,
      cv_file_size TEXT,
      public_safety_certified INTEGER DEFAULT 0,
      investor_ask_json TEXT,
      inquiries_count INTEGER DEFAULT 0,
      registered_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT,
      logo_color TEXT,
      badge_color TEXT,
      total_points INTEGER DEFAULT 3000,
      rank INTEGER DEFAULT 1,
      projects_count INTEGER DEFAULT 0,
      student_scientists_count INTEGER DEFAULT 0,
      chapter_lead TEXT,
      strengths TEXT,
      verification_email TEXT,
      dean_email TEXT,
      faculty TEXT,
      registrar_officer TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT,
      university_id TEXT NOT NULL,
      university_name TEXT NOT NULL,
      lead_admission_no TEXT,
      category TEXT NOT NULL,
      category_label TEXT,
      authors_json TEXT NOT NULL,
      dissertation_file_json TEXT,
      featured INTEGER DEFAULT 0,
      award TEXT,
      upvotes INTEGER DEFAULT 0,
      peer_reviews INTEGER DEFAULT 0,
      sustainability_score REAL DEFAULT 4.5,
      sensory_score REAL DEFAULT 8.5,
      status TEXT,
      summary TEXT,
      ingredients_json TEXT,
      nutrition_json TEXT,
      sensory_profile_json TEXT,
      process_flow_json TEXT,
      image TEXT,
      badges_json TEXT,
      institutional_verification_json TEXT,
      created_by_user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_upvotes (
      project_id TEXT NOT NULL,
      voter_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, voter_key),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS theses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tagline TEXT,
      author TEXT NOT NULL,
      author_admission_no TEXT,
      author_degree TEXT,
      author_verified INTEGER DEFAULT 0,
      university_id TEXT NOT NULL,
      university_name TEXT NOT NULL,
      supervisors TEXT,
      department TEXT,
      category TEXT NOT NULL,
      category_label TEXT,
      date_submitted TEXT,
      year TEXT,
      abstract TEXT,
      keywords_json TEXT,
      file_json TEXT,
      views_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS thesis_comments (
      id TEXT PRIMARY KEY,
      thesis_id TEXT NOT NULL,
      author TEXT NOT NULL,
      role TEXT,
      university TEXT,
      date TEXT,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS partnership_requests (
      id TEXT PRIMARY KEY,
      university_name TEXT NOT NULL,
      short_name TEXT,
      country TEXT NOT NULL,
      city TEXT,
      reference_no TEXT,
      faculty_department TEXT,
      official_email TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      contact_title TEXT,
      student_enrollment TEXT,
      status TEXT DEFAULT 'Pending Official Review',
      date_applied TEXT,
      letter_document_json TEXT,
      letter_file_path TEXT,
      letter_subject TEXT,
      letter_of_intent TEXT,
      full_letter_body TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_dispatches (
      id TEXT PRIMARY KEY,
      type TEXT,
      reference_code TEXT,
      project_id TEXT,
      project_title TEXT,
      applicant_name TEXT,
      author_name TEXT,
      admission_no TEXT,
      degree TEXT,
      year_of_study TEXT,
      student_email TEXT,
      university_id TEXT,
      university_name TEXT,
      university_short_name TEXT,
      recipient_email TEXT,
      cc_emails TEXT,
      dispatched_at TEXT,
      status TEXT,
      confirmed_at TEXT,
      confirmed_by TEXT,
      dissertation_doc TEXT,
      all_authors_json TEXT,
      purpose TEXT,
      student_id TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS investor_inquiries (
      id TEXT PRIMARY KEY,
      innovator_id TEXT NOT NULL,
      org_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      proposal TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      badge TEXT,
      badge_color TEXT,
      title TEXT NOT NULL,
      date TEXT,
      summary TEXT,
      action_label TEXT,
      link TEXT
    );

    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      theme TEXT,
      grand_prize TEXT,
      deadline TEXT,
      days_left INTEGER,
      participants TEXT,
      stages_json TEXT
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      quote TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      profession TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      phone TEXT,
      about TEXT,
      avatar_url TEXT,
      password_hash TEXT NOT NULL,
      linked_afostech_user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feed_posts (
      id TEXT PRIMARY KEY,
      app_account_id TEXT,
      linked_user_id TEXT,
      author_name TEXT NOT NULL,
      author_profession TEXT,
      author_avatar TEXT,
      author_avatar_url TEXT,
      author_color TEXT DEFAULT '#059669',
      university_id TEXT,
      university_name TEXT,
      author_degree TEXT,
      author_admission_no TEXT,
      topic_tag TEXT DEFAULT '#FoodChemistry',
      topic_label TEXT,
      title TEXT,
      content TEXT NOT NULL,
      media_type TEXT DEFAULT 'text',
      media_url TEXT,
      media_caption TEXT,
      video_duration TEXT,
      likes_count INTEGER DEFAULT 0,
      reposts_count INTEGER DEFAULT 0,
      time_ago TEXT DEFAULT 'Just now',
      date_posted TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feed_post_likes (
      post_id TEXT NOT NULL,
      actor_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, actor_key),
      FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feed_post_reposts (
      post_id TEXT NOT NULL,
      actor_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, actor_key),
      FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feed_post_bookmarks (
      post_id TEXT NOT NULL,
      actor_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, actor_key),
      FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feed_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_profession TEXT,
      author_avatar TEXT,
      author_avatar_url TEXT,
      time_ago TEXT DEFAULT 'Just now',
      text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feed_messages (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      recipient_name TEXT NOT NULL,
      recipient_email TEXT,
      recipient_account_id TEXT,
      sender_name TEXT NOT NULL,
      sender_contact TEXT NOT NULL,
      inquiry_type TEXT,
      message_text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marketplace_orders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_email TEXT,
      buyer_city TEXT,
      buyer_country TEXT,
      tier TEXT DEFAULT 'single',
      quantity INTEGER DEFAULT 1,
      unit_name TEXT,
      subtotal_usd REAL DEFAULT 0,
      shipping_usd REAL DEFAULT 0,
      total_usd REAL DEFAULT 0,
      student_payout_usd REAL DEFAULT 0,
      afostech_revenue_usd REAL DEFAULT 0,
      status TEXT DEFAULT 'Order Confirmed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    db.exec('ALTER TABLE projects ADD COLUMN commercial_json TEXT;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE feed_messages ADD COLUMN is_read INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE feed_messages ADD COLUMN replies_json TEXT;');
  } catch (e) {}

  return db;
}

module.exports = {
  DB_PATH,
  UPLOADS_DIR,
  createDatabase,
  hashPassword,
  verifyPassword
};
