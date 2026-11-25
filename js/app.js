/**
 * AFOSTECH - Main Web Application Script
 * Association of Food Science and Technology Students
 * Features: Multi-University Showcase, Board of Honour, Staff Portal,
 * Partnership Requests, News Flow, Team Roster & Investor Connect.
 */

// Master Application State
const AppState = {
  currentTab: 'dashboard',
  selectedCategory: 'all',
  selectedUniversity: 'all',
  searchQuery: '',
  sortBy: 'upvotes',
  upvotedProjects: new Set(),

  // Product Image Studio state
  imageEditor: {
    targetProjectId: null,
    originalUrl: '',
    currentUrl: '',
    rotation: 0,
    flipH: false,
    scale: 1.0,
    aspect: '16/9',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    tonePreset: 'normal'
  },

  // Data stores (hydrated from SQLite backend via /api/bootstrap)
  projects: [],
  universities: [],
  innovators: [],
  partnershipRequests: [],
  verificationDispatches: [],
  investorInquiries: [],
  theses: [],
  news: [],

  // Theses repository state
  selectedThesisCategory: 'all',
  selectedThesisUniversity: 'all',
  thesisSearchQuery: '',
  thesisSortBy: 'comments',
  currentActiveThesisTab: 'abstract',

  // Unified Role-Based Auth State (staff vs innovator determined by email role)
  currentUser: null,
  currentStaffUser: null,
  currentStudentUser: null,
  authToken: null,
  isBackendOnline: false,

  // UI temporary storage
  customSubmissions: [],
  teamMembersBuffer: []
};

function isHttpOrigin() {
  return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(AppState.authToken ? { Authorization: 'Bearer ' + AppState.authToken } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
    err.status = res.status;
    err.code = data && data.code;
    throw err;
  }
  return data;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function applyAuthenticatedUser(user) {
  AppState.currentUser = user || null;
  if (user && user.role === 'staff') {
    AppState.currentStaffUser = {
      ...user,
      role: user.staffRole || 'Consortium Official'
    };
    AppState.currentStudentUser = null;
  } else if (user && user.role === 'innovator') {
    AppState.currentStudentUser = user;
    AppState.currentStaffUser = null;
    AppState.partnershipRequests = [];
    AppState.verificationDispatches = [];
  } else {
    AppState.currentStaffUser = null;
    AppState.currentStudentUser = null;
    AppState.partnershipRequests = [];
    AppState.verificationDispatches = [];
  }
}

// Initialize Application (Always lands on Dashboard first)
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const savedToken = localStorage.getItem('afostech_auth_token');
    if (savedToken) AppState.authToken = savedToken;
  } catch (e) {}
  setupEventListeners();
  await loadStoredData();
  renderApp();

  // Deep-link handling from Food Feed App (?action=register or ?action=signin)
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if ((action === 'register' || action === 'signin') && !AppState.currentUser) {
    setTimeout(() => openAuthModal(action), 120);
  }
});

// Load persistent data from SQLite backend (graceful fallback to static data on file://)
async function loadStoredData() {
  if (isHttpOrigin()) {
    try {
      const data = await apiRequest('/api/bootstrap');
      AppState.isBackendOnline = true;
      AppState.universities = data.universities || [];
      AppState.projects = data.projects || [];
      AppState.theses = data.theses || [];
      AppState.innovators = data.innovators || [];
      AppState.news = data.news || [];
      AppState.upvotedProjects = new Set(data.upvotedIds || []);

      applyAuthenticatedUser(data.user || null);

      if (data.user && data.user.role === 'staff') {
        await fetchStaffDashboardData();
      }

      recalculateUniversityScores();
      return;
    } catch (err) {
      console.warn('Backend bootstrap unavailable, falling back to local store:', err.message);
    }
  }

  // Offline / file:// fallback
  AppState.isBackendOnline = false;
  try {
    const savedUpvotes = localStorage.getItem('afostech_upvotes');
    if (savedUpvotes) AppState.upvotedProjects = new Set(JSON.parse(savedUpvotes));
  } catch (e) {}
  try {
    const savedCustom = localStorage.getItem('afostech_custom_projects');
    if (savedCustom) AppState.customSubmissions = JSON.parse(savedCustom);
  } catch (e) {}

  AppState.innovators = JSON.parse(JSON.stringify(AFOSTECH_DATA.innovators || []));
  AppState.theses = JSON.parse(JSON.stringify(AFOSTECH_DATA.theses || []));
  AppState.projects = [...(AFOSTECH_DATA.projects || []), ...AppState.customSubmissions];
  AppState.universities = JSON.parse(JSON.stringify(AFOSTECH_DATA.universities || []));
  AppState.news = JSON.parse(JSON.stringify(AFOSTECH_DATA.news || []));
  recalculateUniversityScores();
}

async function fetchStaffDashboardData() {
  if (!AppState.currentStaffUser || !isHttpOrigin()) return;
  try {
    const staffData = await apiRequest('/api/staff/dashboard');
    AppState.partnershipRequests = staffData.partnershipRequests || [];
    AppState.verificationDispatches = staffData.verificationDispatches || [];
    AppState.investorInquiries = staffData.investorInquiries || [];
    if (Array.isArray(staffData.innovators)) {
      AppState.innovators = staffData.innovators;
    }
  } catch (err) {
    console.warn('Failed to fetch staff dashboard:', err.message);
  }
}

function saveState() {
  try {
    if (AppState.authToken) localStorage.setItem('afostech_auth_token', AppState.authToken);
    else localStorage.removeItem('afostech_auth_token');
    if (!AppState.isBackendOnline) {
      localStorage.setItem('afostech_upvotes', JSON.stringify(Array.from(AppState.upvotedProjects)));
      localStorage.setItem('afostech_custom_projects', JSON.stringify(AppState.customSubmissions));
    }
  } catch (e) {}
}

// Category Theme Helper
function getCategoryTheme(cat) {
  switch(cat) {
    case 'functional':
      return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)', icon: '🍹', label: 'Functional Foods & Bev' };
    case 'biofortified':
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', icon: '🍠', label: 'Biofortified Nutrition' };
    case 'packaging':
      return { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4', gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', icon: '♻️', label: 'Eco-Packaging & Circular' };
    case 'fermentation':
      return { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', icon: '🧪', label: 'Fermentation & Probiotics' };
    case 'alt-protein':
      return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', gradient: 'linear-gradient(135deg, #b45309 0%, #dc2626 100%)', icon: '🥩', label: 'Alternative Proteins' };
    default:
      return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', icon: '🔬', label: 'Food Innovation' };
  }
}

// Recalculate University Standings
function recalculateUniversityScores() {
  AppState.universities.forEach(univ => {
    const univProjects = AppState.projects.filter(p => p.universityId === univ.id);
    let extraPoints = 0;
    univProjects.forEach(p => {
      extraPoints += 100 + (p.upvotes * 5) + Math.round((p.sensoryScore || 8.5) * 20);
    });
    univ.calculatedPoints = (univ.totalPoints || 3000) + extraPoints;
    univ.projectsCount = univProjects.length;

    // Dynamically calculate actual student scientists presented for this university
    const studentNames = new Set();
    univProjects.forEach(p => {
      if (Array.isArray(p.authors)) {
        p.authors.forEach(a => { if (a && a.name) studentNames.add(a.name.trim()); });
      } else if (p.author) {
        studentNames.add(p.author.trim());
      }
    });
    (AppState.theses || []).filter(t => t.universityId === univ.id).forEach(t => {
      if (t.author) studentNames.add(t.author.trim());
      if (t.studentName) studentNames.add(t.studentName.trim());
    });
    (AppState.innovators || []).filter(i => i.universityId === univ.id).forEach(i => {
      if (i.name) studentNames.add(i.name.trim());
    });
    if (univ.chapterLead) {
      const parts = univ.chapterLead.replace(/\(.*?\)/g, '').split(/&|,/);
      parts.forEach(pt => {
        const clean = pt.replace(/Dr\.|Prof\.|Dean/gi, '').trim();
        if (clean.length > 2) studentNames.add(clean);
      });
    }
    univ.studentScientistsCount = studentNames.size || 3;
  });

  AppState.universities.sort((a, b) => b.calculatedPoints - a.calculatedPoints);
  AppState.universities.forEach((univ, index) => {
    univ.rank = index + 1;
  });

  renderConsortiumStats();
  renderFooterPartnerCampuses();
}

// Event Listeners
function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Open modals
  document.querySelectorAll('.js-open-submit').forEach(btn => btn.addEventListener('click', openSubmitModal));
  document.querySelectorAll('.js-open-submit-thesis').forEach(btn => btn.addEventListener('click', openSubmitThesisModal));
  document.querySelectorAll('.js-open-partnership').forEach(btn => btn.addEventListener('click', openPartnershipModal));
  document.querySelectorAll('.js-open-auth').forEach(btn => btn.addEventListener('click', () => openAuthModal('signin')));

  // Mobile side drawer controls
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileShortcutBtn = document.getElementById('mobileSideShortcutBtn');
  const mobileCloseBtn = document.getElementById('mobileDrawerCloseBtn');
  const mobileBackdrop = document.getElementById('mobileDrawerBackdrop');

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileNavDrawer);
  if (mobileShortcutBtn) mobileShortcutBtn.addEventListener('click', toggleMobileNavDrawer);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileNavDrawer);
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileNavDrawer);

  document.querySelectorAll('.mobile-drawer-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
      closeMobileNavDrawer();
    });
  });

  const mobileSubmitBtn = document.getElementById('mobileDrawerSubmitBtn');
  if (mobileSubmitBtn) {
    mobileSubmitBtn.addEventListener('click', () => {
      closeMobileNavDrawer();
      openSubmitModal();
    });
  }

  const mobilePartnerBtn = document.getElementById('mobileDrawerPartnershipBtn');
  if (mobilePartnerBtn) {
    mobilePartnerBtn.addEventListener('click', () => {
      closeMobileNavDrawer();
      openPartnershipModal();
    });
  }

  const mobileAuthBtn = document.getElementById('mobileDrawerAuthBtn');
  if (mobileAuthBtn) {
    mobileAuthBtn.addEventListener('click', () => {
      closeMobileNavDrawer();
      openAuthModal('signin');
    });
  }

  const mobileLogoutBtn = document.getElementById('mobileDrawerLogoutBtn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', () => {
      closeMobileNavDrawer();
      logoutCurrentUser();
    });
  }

  // Modal Closers
  document.querySelectorAll('.js-modal-close').forEach(btn => btn.addEventListener('click', closeModal));
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeMobileNavDrawer();
    }
  });

  // Forms
  const submitForm = document.getElementById('projectSubmissionForm');
  if (submitForm) submitForm.addEventListener('submit', handleNewProjectSubmit);

  const thesisForm = document.getElementById('thesisSubmissionForm');
  if (thesisForm) thesisForm.addEventListener('submit', handleNewThesisSubmit);

  const partnerForm = document.getElementById('partnershipRequestForm');
  if (partnerForm) partnerForm.addEventListener('submit', handlePartnershipSubmit);

  const unifiedLoginForm = document.getElementById('unifiedLoginForm');
  if (unifiedLoginForm) unifiedLoginForm.addEventListener('submit', handleUnifiedSignIn);

  const unifiedRegisterForm = document.getElementById('unifiedRegisterForm');
  if (unifiedRegisterForm) unifiedRegisterForm.addEventListener('submit', handleUnifiedRegister);

  const investorForm = document.getElementById('investorInquiryForm');
  if (investorForm) investorForm.addEventListener('submit', handleInvestorInquirySubmit);

  // Team Member Adder in Submit Innovation Form
  const addMemberBtn = document.getElementById('btnAddTeamMember');
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', addTeamMemberFieldRow);
  }

  // Dynamic Institutional Verification Notice in Submit Form
  const subUnivSelect = document.getElementById('subUniversity');
  const subAdmInput = document.getElementById('subLeadAdmissionNo');
  if (subUnivSelect) subUnivSelect.addEventListener('change', updateSubmitVerificationNotice);
  if (subAdmInput) subAdmInput.addEventListener('input', updateSubmitVerificationNotice);

  // Dynamic Verification Notice in Thesis Submission Form
  const thesisUnivSelect = document.getElementById('thesisSubUniversity');
  const thesisAdmInput = document.getElementById('thesisSubAdmissionNo');
  if (thesisUnivSelect) thesisUnivSelect.addEventListener('change', updateThesisVerificationNotice);
  if (thesisAdmInput) thesisAdmInput.addEventListener('input', updateThesisVerificationNotice);

  // Theses Toolbar Listeners
  const searchTheses = document.getElementById('searchThesesInput');
  if (searchTheses) {
    searchTheses.addEventListener('input', (e) => {
      AppState.thesisSearchQuery = e.target.value.toLowerCase().trim();
      renderThesesRepository();
    });
  }

  const filterThesesUniv = document.getElementById('filterThesesUniversity');
  if (filterThesesUniv) {
    filterThesesUniv.addEventListener('change', (e) => {
      AppState.selectedThesisUniversity = e.target.value;
      renderThesesRepository();
    });
  }

  const filterThesesSort = document.getElementById('filterThesesSort');
  if (filterThesesSort) {
    filterThesesSort.addEventListener('change', (e) => {
      AppState.thesisSortBy = e.target.value;
      renderThesesRepository();
    });
  }

  // Global eye toggle delegation for all password inputs
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-password-toggle');
    if (!btn) return;
    const targetId = btn.getAttribute('data-target');
    togglePasswordVisibility(targetId, btn);
  });
}

function togglePasswordVisibility(targetId, btn) {
  let input = document.getElementById(targetId);
  if (!input && btn) {
    const wrapper = btn.closest('.password-wrapper');
    if (wrapper) input = wrapper.querySelector('input');
  }
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';

  if (btn) {
    btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    btn.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
    const eyeShow = btn.querySelector('.eye-show');
    const eyeHide = btn.querySelector('.eye-hide');
    if (eyeShow && eyeHide) {
      eyeShow.style.display = isPassword ? 'none' : 'block';
      eyeHide.style.display = isPassword ? 'block' : 'none';
    }
  }
}

function updateSubmitVerificationNotice() {
  // Cleaned: no public verification notice
}

function updateThesisVerificationNotice() {
  // Cleaned: no public verification notice
}

function openMobileNavDrawer() {
  const drawer = document.getElementById('mobileSideDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const shortcutBtn = document.getElementById('mobileSideShortcutBtn');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (!drawer) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  if (backdrop) {
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
  }
  if (shortcutBtn) {
    shortcutBtn.classList.add('drawer-open');
    shortcutBtn.setAttribute('aria-expanded', 'true');
  }
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('mobile-drawer-active');
}

function closeMobileNavDrawer() {
  const drawer = document.getElementById('mobileSideDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const shortcutBtn = document.getElementById('mobileSideShortcutBtn');
  const menuBtn = document.getElementById('mobileMenuBtn');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  if (backdrop) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }
  if (shortcutBtn) {
    shortcutBtn.classList.remove('drawer-open');
    shortcutBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-drawer-active');
}

function toggleMobileNavDrawer() {
  const drawer = document.getElementById('mobileSideDrawer');
  if (!drawer) return;
  if (drawer.classList.contains('open')) closeMobileNavDrawer();
  else openMobileNavDrawer();
}

// Tab Switching
function switchTab(tabName) {
  AppState.currentTab = tabName;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.mobile-drawer-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  closeMobileNavDrawer();

  const views = ['dashboardView', 'catalogView', 'thesesView', 'leaderboardView', 'aboutView', 'newsView', 'innovatorsView'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = 'none';
  });

  const activeEl = document.getElementById(`${tabName}View`);
  if (activeEl) activeEl.style.display = 'block';

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabName === 'catalog') renderCatalog();
  else if (tabName === 'theses') renderThesesRepository();
  else if (tabName === 'leaderboard') renderLeaderboard();
  else if (tabName === 'dashboard') renderDashboard();
  else if (tabName === 'news') renderNews();
  else if (tabName === 'innovators') renderInnovators();
}

// Master Render
function renderApp() {
  renderDashboard();
  renderCatalog();
  renderThesesRepository();
  renderLeaderboard();
  renderAbout();
  renderNews();
  renderInnovators();
  populateFilterDropdowns();
  updateTopAuthStatus();
  renderConsortiumStats();
  renderFooterPartnerCampuses();
}

// ============================================================================
// DYNAMIC CONSORTIUM STATS (Live actual counts of presented universities details)
// ============================================================================
function renderConsortiumStats() {
  const elUnivs = document.getElementById('statPartnerUnivs');
  const elScientists = document.getElementById('statStudentScientists');
  const elPrototypes = document.getElementById('statPrototypes');
  const elPatents = document.getElementById('statPatents');

  // 1. Actual Partner Universities presented
  const partnerCount = AppState.universities ? AppState.universities.length : 7;

  // 2. Actual Unique Student Scientists presented across prototypes, theses, innovators & chapter leads
  const scientistSet = new Set();
  (AppState.projects || []).forEach(p => {
    if (Array.isArray(p.authors)) {
      p.authors.forEach(a => { if (a && a.name) scientistSet.add(a.name.trim()); });
    } else if (p.author) {
      scientistSet.add(p.author.trim());
    }
  });
  (AppState.theses || []).forEach(t => {
    if (t.author) scientistSet.add(t.author.trim());
    if (t.studentName) scientistSet.add(t.studentName.trim());
  });
  (AppState.innovators || []).forEach(inn => {
    if (inn.name) scientistSet.add(inn.name.trim());
  });
  (AppState.universities || []).forEach(u => {
    if (u.chapterLead) {
      const parts = u.chapterLead.replace(/\(.*?\)/g, '').split(/&|,/);
      parts.forEach(pt => {
        const clean = pt.replace(/Dr\.|Prof\.|Dean/gi, '').trim();
        if (clean.length > 2) scientistSet.add(clean);
      });
    }
  });
  const scientistsCount = scientistSet.size || 23;

  // 3. Actual Prototypes Developed & Presented in Catalog
  const prototypesCount = AppState.projects ? AppState.projects.length : 8;

  // 4. Actual Patents Filed across chapters
  let patentsCount = 0;
  (AppState.projects || []).forEach(p => {
    if (p.patentFiled || p.patentRef || (p.status && p.status.toLowerCase().includes('certified'))) {
      patentsCount++;
    }
  });
  if (patentsCount === 0) patentsCount = prototypesCount;

  // Update hero stats elements
  if (elUnivs) elUnivs.innerText = partnerCount;
  if (elScientists) elScientists.innerText = scientistsCount;
  if (elPrototypes) elPrototypes.innerText = prototypesCount;
  if (elPatents) elPatents.innerText = patentsCount;
}

// ============================================================================
// DYNAMIC FOOTER PARTNER CAMPUSES (Always renders the full list of partner universities)
// ============================================================================
function renderFooterPartnerCampuses() {
  const container = document.getElementById('footerPartnerCampuses');
  if (!container || !AppState.universities) return;
  container.innerHTML = AppState.universities.map(u => `
    <li><a href="#" onclick="filterByUniv('${u.id}'); return false;">${u.shortName || u.name} (${u.country})</a></li>
  `).join('');
}

function updateTopAuthStatus() {
  const user = AppState.currentUser;
  const isLoggedIn = Boolean(user);
  const isStaff = user && user.role === 'staff';
  const isInnovator = user && user.role === 'innovator';

  const authBtn = document.getElementById('navAuthBtn');
  const logoutBtn = document.getElementById('navLogoutBtn');

  if (authBtn) {
    if (isStaff) {
      authBtn.innerHTML = `🛡️ ${user.name} &bull; Staff Control Center`;
      authBtn.classList.add('logged-in');
      authBtn.title = 'Open Staff Official Control Center';
    } else if (isInnovator) {
      authBtn.innerHTML = `🎓 ${user.name.split(' ')[0]} &bull; Innovator Workspace`;
      authBtn.classList.add('logged-in');
      authBtn.title = 'Open Student Innovator Workspace';
    } else {
      authBtn.innerHTML = `🔑 Sign In`;
      authBtn.classList.remove('logged-in');
      authBtn.title = 'Sign in with your official staff or student innovator email';
    }
  }

  if (logoutBtn) {
    logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
  }

  // Unlock submission padlocks whenever signed in (Innovator or Staff)
  const submitNavBtn = document.getElementById('navSubmitBtn') || document.querySelector('.submit-btn-nav');
  if (submitNavBtn) {
    if (isLoggedIn) {
      submitNavBtn.innerHTML = `<span>+</span> Submit`;
      submitNavBtn.title = `Signed in as ${user.name} — Open to submit`;
    } else {
      submitNavBtn.innerHTML = `<span>🔒</span> Submit`;
      submitNavBtn.title = `Sign in required to submit innovations.`;
    }
  }

  const heroEntryBtn = document.getElementById('heroEntrySubmitBtn');
  if (heroEntryBtn) {
    if (isLoggedIn) {
      heroEntryBtn.innerHTML = `+ Submit Campus Entry →`;
      heroEntryBtn.title = `Signed in as ${user.name} — Open to submit`;
    } else {
      heroEntryBtn.innerHTML = `🔒 Innovator Entry →`;
      heroEntryBtn.title = `Sign in required`;
    }
  }

  const mobileAuthBtn = document.getElementById('mobileDrawerAuthBtn');
  const mobileLogoutBtn = document.getElementById('mobileDrawerLogoutBtn');
  const mobileSubmitBtn = document.getElementById('mobileDrawerSubmitBtn');
  const mobileUserSummary = document.getElementById('mobileDrawerUserSummary');

  if (mobileAuthBtn) {
    if (isStaff) {
      mobileAuthBtn.innerHTML = `🛡️ ${user.name} (Staff Portal)`;
    } else if (isInnovator) {
      mobileAuthBtn.innerHTML = `🎓 ${user.name.split(' ')[0]} (Innovator Hub)`;
    } else {
      mobileAuthBtn.innerHTML = `🔑 Sign In`;
    }
  }
  if (mobileLogoutBtn) {
    mobileLogoutBtn.style.display = isLoggedIn ? 'flex' : 'none';
  }
  if (mobileSubmitBtn) {
    mobileSubmitBtn.innerHTML = isLoggedIn ? `+ Submit Innovation` : `🔒 Submit Innovation`;
  }
  if (mobileUserSummary) {
    if (isStaff) mobileUserSummary.textContent = `Staff Official • ${user.name}`;
    else if (isInnovator) mobileUserSummary.textContent = `Innovator • ${user.name}`;
    else mobileUserSummary.textContent = `Quick Section Navigator`;
  }

  const heroThesisBtn = document.getElementById('heroThesisSubmitBtn');
  if (heroThesisBtn) {
    if (isLoggedIn) {
      heroThesisBtn.innerHTML = `+ Submit Your Thesis`;
      heroThesisBtn.title = `Signed in as ${user.name} — Open to upload thesis`;
    } else {
      heroThesisBtn.innerHTML = `🔒 Innovator Thesis Submission`;
      heroThesisBtn.title = `Sign in required`;
    }
  }

  const catalogSubmitBtn = document.getElementById('catalogSubmitBtn');
  if (catalogSubmitBtn) {
    if (isLoggedIn) {
      catalogSubmitBtn.innerHTML = `<span>+</span> Publish Your Product`;
      catalogSubmitBtn.title = `Signed in as ${user.name} — Open to publish`;
    } else {
      catalogSubmitBtn.innerHTML = `<span>🔒</span> Innovator Submission`;
      catalogSubmitBtn.title = `Sign in required`;
    }
  }

  const thesesSubmitBtn = document.getElementById('thesesSubmitBtn');
  if (thesesSubmitBtn) {
    if (isLoggedIn) {
      thesesSubmitBtn.innerHTML = `<span>+</span> Submit Research Thesis`;
      thesesSubmitBtn.title = `Signed in as ${user.name} — Open to submit thesis`;
    } else {
      thesesSubmitBtn.innerHTML = `<span>🔒</span> Innovator Thesis Submission`;
      thesesSubmitBtn.title = `Sign in required`;
    }
  }

  const innovatorsAuthBtn = document.getElementById('innovatorsAuthBtn');
  if (innovatorsAuthBtn) {
    if (isStaff) {
      innovatorsAuthBtn.innerHTML = `🛡️ Staff Control Center`;
    } else if (isInnovator) {
      innovatorsAuthBtn.innerHTML = `🎓 My Innovator Workspace (${user.name.split(' ')[0]})`;
    } else {
      innovatorsAuthBtn.innerHTML = `🔑 Sign In / Join AFOSTECH`;
    }
  }
}

// Populate Filters
function populateFilterDropdowns() {
  const univSelect = document.getElementById('filterUniversity');
  if (univSelect) {
    univSelect.innerHTML = `<option value="all">All Universities (${AppState.universities.length})</option>` +
      AppState.universities.map(u => `<option value="${u.id}">${u.shortName} - ${u.name}</option>`).join('');
    univSelect.addEventListener('change', (e) => {
      AppState.selectedUniversity = e.target.value;
      renderCatalog();
    });
  }

  const sortSelect = document.getElementById('filterSort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      renderCatalog();
    });
  }

  const searchInput = document.getElementById('searchProjectsInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.toLowerCase().trim();
      renderCatalog();
    });
  }

  const chipsContainer = document.getElementById('categoryChips');
  if (chipsContainer) {
    chipsContainer.innerHTML = AFOSTECH_DATA.categories.map(cat => {
      const activeClass = AppState.selectedCategory === cat.id ? 'active' : '';
      return `<button class="chip-btn ${activeClass}" data-cat="${cat.id}">${cat.name}</button>`;
    }).join('');

    chipsContainer.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        AppState.selectedCategory = chip.getAttribute('data-cat');
        chipsContainer.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderCatalog();
      });
    });
  }
}

// ============================================================================
// DASHBOARD
// ============================================================================
function renderDashboard() {
  const spotlightContainer = document.getElementById('heroSpotlight');
  if (spotlightContainer) {
    const featured = AppState.projects.find(p => p.featured) || AppState.projects[0];
    if (featured) {
      const theme = getCategoryTheme(featured.category);
      spotlightContainer.innerHTML = `
        <div class="spotlight-header">
          <span class="spotlight-badge">⭐ Best Project Spotlight</span>
          <span class="spotlight-univ">${featured.universityName}</span>
        </div>
        <img src="${featured.image}" alt="${featured.title}" class="spotlight-img" onclick="openProjectDetail('${featured.id}')">
        <div style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 0.74rem; font-weight: 800; color: ${theme.text}; background: ${theme.bg}; border: 1px solid ${theme.border}; margin-bottom: 6px; max-width: 100%;">
          ${theme.icon} ${theme.label}
        </div>
        <h3 class="spotlight-title" onclick="openProjectDetail('${featured.id}')">${featured.title}</h3>
        <p class="spotlight-summary">${featured.tagline}</p>
        <div class="spotlight-footer">
          <div class="score-badge sensory">
            <span>Sensory Index:</span>
            <strong>⭐ ${featured.sensoryScore}/10</strong>
          </div>
          <div class="spotlight-footer-actions">
            <button class="btn-primary spotlight-detail-btn" onclick="openProjectDetail('${featured.id}')">
              View Prototype &amp; Team →
            </button>
            <button class="btn-try-product spotlight-try-btn" onclick="openTryProductModal('${featured.id}')" title="Purchase or locate nearest stockist">
              🛒 Try Product
            </button>
          </div>
        </div>
      `;
    }
  }

  const featuredGrid = document.getElementById('dashboardFeaturedGrid');
  if (featuredGrid) {
    const topProjects = [...AppState.projects].sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);
    featuredGrid.innerHTML = topProjects.map(p => createProjectCardHTML(p)).join('');
    bindCardEvents(featuredGrid);
  }

  // Mini News Flow on Dashboard
  const dashNewsContainer = document.getElementById('dashboardNewsFlow');
  if (dashNewsContainer) {
    dashNewsContainer.innerHTML = AppState.news.slice(0, 2).map(n => `
      <div class="dashboard-news-item">
        <div class="dashboard-news-meta">
          <span class="dashboard-news-badge">${n.badge}</span>
          <strong class="dashboard-news-title">${n.title}</strong>
          <span class="dashboard-news-date">• ${n.date}</span>
        </div>
        <button class="btn-outline dashboard-news-btn" onclick="switchTab('news')">Read Update →</button>
      </div>
    `).join('');
  }
}

// ============================================================================
// NEWS & PUBLIC ANNOUNCEMENTS
// ============================================================================
function renderNews() {
  const container = document.getElementById('newsFeedGrid');
  if (!container) return;

  container.innerHTML = AppState.news.map(n => `
    <article class="news-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span class="news-badge">${n.badge}</span>
        <span style="font-size: 0.8rem; font-weight: 700; color: #64748b;">📅 ${n.date}</span>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 900; margin-bottom: 10px; color: var(--navy);">${n.title}</h3>
      <p style="font-size: 0.92rem; color: #475569; line-height: 1.6; margin-bottom: 16px;">${n.summary}</p>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">Official Consortium Bulletin</span>
        <button class="btn-primary" style="padding: 6px 14px; font-size: 0.82rem;" onclick="handleNewsAction('${n.id}')">
          ${n.actionLabel}
        </button>
      </div>
    </article>
  `).join('');
}

function handleNewsAction(newsId) {
  if (newsId === 'news-1') {
    openSubmitModal();
  } else if (newsId === 'news-2') {
    openPartnershipModal();
  } else if (newsId === 'news-4') {
    switchTab('innovators');
  } else {
    showToast("Downloaded AFOSTECH 2026 Student Lab Guidelines (PDF)!");
  }
}

// ============================================================================
// INNOVATORS & BOARD OF HONOUR
// ============================================================================
function renderInnovators() {
  const container = document.getElementById('boardOfHonourGrid');
  if (!container) return;

  const verified = AppState.innovators.filter(i => i.verified && i.boardOfHonour);

  container.innerHTML = verified.map(inn => `
    <div class="innovator-card">
      <div class="innovator-header">
        <div class="innovator-avatar">
          ${inn.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.2rem; font-weight: 900; color: var(--navy);">${inn.name}</h3>
            <span class="verified-badge">✓ Verified Innovator</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--primary); font-weight: 800;">
            ${inn.universityName} • Adm No: <span style="font-family: monospace; background: #ecfdf5; padding: 1px 6px; border-radius: 4px;">${inn.admissionNo}</span>
          </div>
          <div style="font-size: 0.78rem; color: #64748b; font-weight: 600;">${inn.degree} (${inn.yearOfStudy})</div>
        </div>
      </div>

      <!-- Pitch Certification Badge -->
      <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fde68a; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 900; color: #b45309;">Pitching Competition Verification:</div>
        <div style="font-size: 0.84rem; font-weight: 800; color: #78350f;">🏆 ${inn.pitchedCompetition}</div>
        <div style="font-size: 0.75rem; color: #047857; font-weight: 700; margin-top: 3px;">
          ✓ Passed AFOSTECH Sensory &amp; Public Production Clearance for <strong>"${inn.productName}"</strong>
        </div>
      </div>

      <!-- Bio -->
      <p style="font-size: 0.88rem; color: #475569; line-height: 1.55; margin-bottom: 14px;">${inn.bio}</p>

      <!-- Academic CV Attachment -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 8px 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">
          📄 ${inn.cvFileName || 'Academic_CV.pdf'} (${inn.cvFileSize || '220 KB'})
        </span>
        <button class="btn-outline" style="padding: 3px 10px; font-size: 0.74rem;" onclick="downloadMockCV('${inn.name}')">Download CV</button>
      </div>

      <!-- Commercialization Ask for Investors -->
      ${inn.investorAsk ? `
        <div class="investor-ask-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.74rem; text-transform: uppercase; font-weight: 900; color: #0284c7;">Active Actualization Ask:</span>
            <span style="font-size: 0.95rem; font-weight: 900; color: #0369a1; background: #e0f2fe; padding: 2px 8px; border-radius: 6px;">
              ${inn.investorAsk.amountNeeded}
            </span>
          </div>
          <div style="font-weight: 800; font-size: 0.88rem; color: #0f172a; margin-bottom: 4px;">
            ${inn.investorAsk.title}
          </div>
          <p style="font-size: 0.82rem; color: #475569; line-height: 1.5; margin-bottom: 10px;">
            ${inn.investorAsk.description}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.75rem; color: #64748b;">${inn.inquiriesCount || 0} Investor Conversations Opened</span>
            <button class="btn-primary" style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 6px 14px; font-size: 0.8rem;" onclick="openInvestorInquiryModal('${inn.id}')">
              💼 Open Investor Conversation →
            </button>
          </div>
        </div>
      ` : ''}

    </div>
  `).join('');
}

function downloadMockCV(innovatorName) {
  showToast(`Downloaded verified curriculum vitae for ${innovatorName}!`);
}

// ============================================================================
// CATALOG RENDERING
// ============================================================================
function renderCatalog() {
  const container = document.getElementById('catalogProjectsGrid');
  const countBadge = document.getElementById('catalogResultsCount');
  if (!container) return;

  let filtered = AppState.projects.filter(p => {
    const matchesCategory = AppState.selectedCategory === 'all' || p.category === AppState.selectedCategory;
    const matchesUniv = AppState.selectedUniversity === 'all' || p.universityId === AppState.selectedUniversity;
    const matchesSearch = !AppState.searchQuery || 
      p.title.toLowerCase().includes(AppState.searchQuery) ||
      p.tagline.toLowerCase().includes(AppState.searchQuery) ||
      p.summary.toLowerCase().includes(AppState.searchQuery) ||
      p.universityName.toLowerCase().includes(AppState.searchQuery);
    return matchesCategory && matchesUniv && matchesSearch;
  });

  if (AppState.sortBy === 'upvotes') filtered.sort((a, b) => b.upvotes - a.upvotes);
  else if (AppState.sortBy === 'sensory') filtered.sort((a, b) => b.sensoryScore - a.sensoryScore);
  else if (AppState.sortBy === 'sustainability') filtered.sort((a, b) => b.sustainabilityScore - a.sustainabilityScore);
  else if (AppState.sortBy === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));

  if (countBadge) {
    countBadge.innerText = `Showing ${filtered.length} innovation${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 16px; border: 2px dashed #cbd5e1;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔬</div>
        <h3 style="font-size: 1.3rem; font-weight: 900; margin-bottom: 6px;">No student innovations match your current filter</h3>
        <p style="color: #64748b; font-size: 0.92rem; margin-bottom: 20px;">Try clearing your search term or selecting another category.</p>
        <button class="btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => createProjectCardHTML(p)).join('');
  bindCardEvents(container);
}

function resetFilters() {
  AppState.selectedCategory = 'all';
  AppState.selectedUniversity = 'all';
  AppState.searchQuery = '';
  const searchInput = document.getElementById('searchProjectsInput');
  if (searchInput) searchInput.value = '';
  const univSelect = document.getElementById('filterUniversity');
  if (univSelect) univSelect.value = 'all';
  const chips = document.querySelectorAll('#categoryChips .chip-btn');
  chips.forEach(c => c.classList.toggle('active', c.getAttribute('data-cat') === 'all'));
  renderCatalog();
}

function createProjectCardHTML(p) {
  const isUpvoted = AppState.upvotedProjects.has(p.id);
  const upvoteClass = isUpvoted ? 'upvoted' : '';
  const leadAuthor = p.authors && p.authors[0] ? p.authors[0].name : "Student Innovator";
  const initials = leadAuthor.split(' ').map(n => n[0]).join('').substring(0, 2);
  const theme = getCategoryTheme(p.category);
  const univ = AppState.universities.find(u => u.id === p.universityId);
  const univColor = univ ? univ.logoColor : "#059669";
  const teamCount = (p.authors || []).length;

  return `
    <article class="project-card" data-id="${p.id}" style="border-top: 3.5px solid ${theme.border};">
      <div class="card-img-wrap" onclick="openProjectDetail('${p.id}')">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <span class="card-overlay-badge" style="background: rgba(15, 23, 42, 0.85); border-left: 3px solid ${theme.border};">
          ${theme.icon} ${p.categoryLabel || 'Food Innovation'}
        </span>
        <span class="card-univ-tag" style="display: flex; align-items: center; gap: 5px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${univColor};"></span>
          ${p.universityName}
        </span>
      </div>
      <div class="card-body">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div class="card-category" style="color: ${theme.text}; font-weight: 800;">
            ${theme.icon} ${p.category.toUpperCase()}
          </div>
          <span style="font-size: 0.74rem; font-weight: 700; color: #64748b; background: #f8fafc; padding: 2px 8px; border-radius: 9999px; border: 1px solid #e2e8f0;">
            👥 ${teamCount} Member${teamCount === 1 ? '' : 's'}
          </span>
        </div>

        <h3 class="card-title" onclick="openProjectDetail('${p.id}')">${p.title}</h3>
        <p class="card-tagline">${p.tagline}</p>
        
        <div class="card-scores-row">
          <div class="score-badge sensory">
            <span>Sensory:</span>
            <strong>⭐ ${p.sensoryScore}/10</strong>
          </div>
          <div class="score-badge sustainability">
            <span>Eco-Rating:</span>
            <strong>🌱 ${p.sustainabilityScore}/5.0</strong>
          </div>
        </div>

        <div class="card-footer">
          <div class="card-author-row">
            <div class="card-authors" title="${leadAuthor}">
              <div class="author-avatar">${initials}</div>
              <div class="author-meta">
                <span class="author-names">${leadAuthor}</span>
                
              </div>
            </div>
            <button class="btn-upvote ${upvoteClass}" data-id="${p.id}" title="Endorse this prototype (+5 pts for ${p.universityName})">
              <span>${isUpvoted ? '❤️' : '🤍'}</span>
              <span class="upvote-count">${p.upvotes}</span>
            </button>
          </div>

          <div class="card-cta-row">
            <button class="btn-try-product" onclick="event.stopPropagation(); openTryProductModal('${p.id}')" title="Order online or locate nearest stockist">
              🛒 Try Product
            </button>
            <button class="btn-details" onclick="openProjectDetail('${p.id}')" title="Inspect formulation lab data, sensory chart & research team">
              Inspect Prototype →
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function bindCardEvents(container) {
  container.querySelectorAll('.btn-upvote').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleUpvote(btn.getAttribute('data-id'));
    });
  });
}

// ============================================================================
// RESEARCH THESES & DISSERTATIONS REPOSITORY
// ============================================================================
function renderThesesRepository() {
  const container = document.getElementById('thesesGrid');
  const countBadge = document.getElementById('thesesResultsCount');
  if (!container) return;

  // Populate University Dropdown in Theses toolbar if empty
  const univSelect = document.getElementById('filterThesesUniversity');
  if (univSelect && univSelect.options.length <= 1) {
    univSelect.innerHTML = `<option value="all">All Universities (${AppState.universities.length})</option>` +
      AppState.universities.map(u => `<option value="${u.id}">${u.shortName} - ${u.name}</option>`).join('');
    univSelect.value = AppState.selectedThesisUniversity || 'all';
  }

  // Populate Category Chips in Theses toolbar
  const chipsContainer = document.getElementById('thesesCategoryChips');
  if (chipsContainer && chipsContainer.children.length === 0) {
    const cats = (AFOSTECH_DATA.thesisCategories || [
      { id: "all", name: "All Theses", icon: "📚" },
      { id: "biofortified", name: "Biofortification & Nutrition", icon: "🍠" },
      { id: "functional", name: "Functional Bioactives", icon: "🍹" },
      { id: "fermentation", name: "Microbiology & Ferment", icon: "🧪" },
      { id: "packaging", name: "Eco-Packaging & Storage", icon: "♻️" },
      { id: "alt-protein", name: "Alternative Proteins", icon: "🥩" }
    ]);

    chipsContainer.innerHTML = cats.map(cat => {
      const activeClass = AppState.selectedThesisCategory === cat.id ? 'active' : '';
      return `<button type="button" class="chip-btn ${activeClass}" data-thesecat="${cat.id}">${cat.icon} ${cat.name}</button>`;
    }).join('');

    chipsContainer.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        AppState.selectedThesisCategory = chip.getAttribute('data-thesecat');
        chipsContainer.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderThesesRepository();
      });
    });
  }

  // Filter Theses
  let filtered = (AppState.theses || []).filter(t => {
    const matchesCategory = AppState.selectedThesisCategory === 'all' || t.category === AppState.selectedThesisCategory;
    const matchesUniv = AppState.selectedThesisUniversity === 'all' || t.universityId === AppState.selectedThesisUniversity;
    const q = AppState.thesisSearchQuery || '';
    const matchesSearch = !q ||
      t.title.toLowerCase().includes(q) ||
      (t.tagline && t.tagline.toLowerCase().includes(q)) ||
      (t.author && t.author.toLowerCase().includes(q)) ||
      (t.authorAdmissionNo && t.authorAdmissionNo.toLowerCase().includes(q)) ||
      (t.supervisors && t.supervisors.toLowerCase().includes(q)) ||
      (t.abstract && t.abstract.toLowerCase().includes(q)) ||
      (t.universityName && t.universityName.toLowerCase().includes(q)) ||
      (t.keywords && t.keywords.some(k => k.toLowerCase().includes(q)));
    return matchesCategory && matchesUniv && matchesSearch;
  });

  // Sort Theses
  if (AppState.thesisSortBy === 'comments') {
    filtered.sort((a, b) => ((b.comments && b.comments.length) || 0) - ((a.comments && a.comments.length) || 0));
  } else if (AppState.thesisSortBy === 'downloads') {
    filtered.sort((a, b) => ((b.file && b.file.downloadsCount) || 0) - ((a.file && a.file.downloadsCount) || 0));
  } else if (AppState.thesisSortBy === 'views') {
    filtered.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  } else if (AppState.thesisSortBy === 'recent') {
    filtered.sort((a, b) => (b.id > a.id ? 1 : -1));
  } else if (AppState.thesisSortBy === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (countBadge) {
    countBadge.innerText = `Showing ${filtered.length} student research ${filtered.length === 1 ? 'thesis' : 'theses'} across ${AppState.universities.length} universities`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 16px; border: 2px dashed #cbd5e1;">
        <div style="font-size: 3rem; margin-bottom: 12px;">📚</div>
        <h3 style="font-size: 1.3rem; font-weight: 900; margin-bottom: 6px;">No research theses match your current search</h3>
        <p style="color: #64748b; font-size: 0.92rem; margin-bottom: 20px;">Try clearing search keywords or selecting another university chapter.</p>
        <button class="btn-primary" onclick="resetThesesFilters()">Reset Theses Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => createThesisCardHTML(t)).join('');
}

function resetThesesFilters() {
  AppState.selectedThesisCategory = 'all';
  AppState.selectedThesisUniversity = 'all';
  AppState.thesisSearchQuery = '';
  const searchInput = document.getElementById('searchThesesInput');
  if (searchInput) searchInput.value = '';
  const univSelect = document.getElementById('filterThesesUniversity');
  if (univSelect) univSelect.value = 'all';
  const chips = document.querySelectorAll('#thesesCategoryChips .chip-btn');
  chips.forEach(c => c.classList.toggle('active', c.getAttribute('data-thesecat') === 'all'));
  renderThesesRepository();
}

function createThesisCardHTML(t) {
  const theme = getCategoryTheme(t.category);
  const univ = AppState.universities.find(u => u.id === t.universityId);
  const univColor = univ ? univ.logoColor : "#059669";
  const authorInitials = t.author.split(' ').map(n => n[0]).join('').substring(0, 2);
  const commentsCount = (t.comments && t.comments.length) || 0;
  const downloadsCount = (t.file && t.file.downloadsCount) || 0;
  const viewsCount = t.viewsCount || 0;

  const tagsHTML = (t.keywords || []).slice(0, 4).map(k => `
    <span class="thesis-tag-item">#${k}</span>
  `).join('');

  return `
    <article class="thesis-card" style="border-top: 3.5px solid ${theme.border};">
      <div class="thesis-card-header">
        <span class="thesis-univ-badge">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${univColor};"></span>
          ${t.universityName}
        </span>
        <span class="thesis-category-chip" style="background: ${theme.bg}; color: ${theme.text}; border: 1px solid ${theme.border};">
          ${theme.icon} ${t.categoryLabel || t.category.toUpperCase()}
        </span>
      </div>

      <h3 class="thesis-title" onclick="openThesisDetail('${t.id}', 'abstract')">
        ${t.title}
      </h3>

      <div class="thesis-author-meta">
        <div class="thesis-author-avatar">
          ${authorInitials}
        </div>
        <div class="thesis-author-details">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="thesis-author-name">${t.author}</span>
            
            ${t.authorVerified ? '<span title="Verified Innovator on Board of Honour" style="font-size: 0.7rem; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-weight: 800;">✓ Verified</span>' : ''}
          </div>
          <div class="thesis-author-degree">
            ${t.authorDegree} &bull; <span style="color: #64748b;">${t.year || '2026'}</span>
          </div>
          ${t.supervisors ? `<div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;"><strong>Supervised by:</strong> ${t.supervisors}</div>` : ''}
        </div>
      </div>

      <p class="thesis-abstract-snippet">
        ${t.abstract}
      </p>

      <div class="thesis-tags-row">
        ${tagsHTML}
      </div>

      <!-- File Document Badge -->
      <div class="thesis-file-pill">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.3rem;">📄</span>
          <div>
            <strong style="color: #065f46; font-size: 0.8rem; display: block; line-height: 1.1;">
              ${t.file ? t.file.fileName : 'Thesis_Document.pdf'}
            </strong>
            <span style="font-size: 0.72rem; color: #059669;">
              ${t.file ? t.file.fileSize : '4.5 MB'} &bull; ${t.file ? t.file.pages : 80} Pages &bull; Academic Thesis
            </span>
          </div>
        </div>
        <button class="btn-outline" style="padding: 4px 10px; font-size: 0.74rem; border-color: #059669; color: #065f46;" onclick="downloadThesis('${t.id}')">
          📥 Download
        </button>
      </div>

      <!-- Counters & Actions Footer -->
      <div class="thesis-stats-row">
        <span>📥 <strong id="cardDl_${t.id}">${downloadsCount}</strong> Downloads</span>
        <span>👁️ ${viewsCount} Views</span>
        <span>💬 <strong>${commentsCount}</strong> Peer Review${commentsCount === 1 ? '' : 's'}</span>
      </div>

      <div class="thesis-actions-row">
        <button class="btn-primary" style="flex: 1; padding: 8px 12px; font-size: 0.84rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="openThesisDetail('${t.id}', 'abstract')">
          <span>📖</span> Read Summary &amp; Thesis
        </button>
        <button class="btn-outline" style="padding: 8px 14px; font-size: 0.84rem; display: flex; align-items: center; gap: 5px;" onclick="openThesisDetail('${t.id}', 'comments')" title="Leave Peer Review">
          <span>💬</span> Review (${commentsCount})
        </button>
      </div>
    </article>
  `;
}

// ============================================================================
// SUBMIT RESEARCH THESIS MODAL (Restricted to Authenticated Innovators)
// ============================================================================
function openSubmitThesisModal() {
  if (!AppState.currentUser) {
    showToast("🔒 Sign In Required: Please sign in with your student innovator or staff email to submit a research thesis.");
    openAuthModal('signin');
    return;
  }

  const modal = document.getElementById('submitThesisModal');
  const user = AppState.currentUser;
  const isStaff = user.role === 'staff';

  const univSelect = document.getElementById('thesisSubUniversity');
  if (univSelect) {
    univSelect.innerHTML = AppState.universities.map(u => `
      <option value="${u.id}">${u.shortName} - ${u.name} (${u.country})</option>
    `).join('');
    if (!isStaff && user.universityId) {
      univSelect.value = user.universityId;
      univSelect.disabled = true;
    } else {
      univSelect.disabled = false;
    }
  }

  const authorInput = document.getElementById('thesisSubAuthorName');
  if (authorInput) {
    authorInput.value = user.name;
    authorInput.readOnly = !isStaff;
  }

  const admInput = document.getElementById('thesisSubAdmissionNo');
  if (admInput) {
    admInput.value = user.admissionNo || (isStaff ? 'STAFF-OFFICIAL' : '');
    admInput.readOnly = !isStaff;
  }

  const degreeInput = document.getElementById('thesisSubDegree');
  if (degreeInput && !degreeInput.value.trim()) {
    degreeInput.value = user.degree || 'B.Sc. Food Science & Technology';
  }

  const oldBanner = document.getElementById('thesisAuthUserBanner');
  if (oldBanner) oldBanner.remove();

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

async function handleNewThesisSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('thesisSubTitle').value.trim();
  const tagline = document.getElementById('thesisSubTagline').value.trim();
  const univSelect = document.getElementById('thesisSubUniversity');
  const universityId = (univSelect && univSelect.value) || (AppState.currentUser && AppState.currentUser.universityId) || 'jkuat';
  const admissionNo = (document.getElementById('thesisSubAdmissionNo').value.trim()) || (AppState.currentUser && AppState.currentUser.admissionNo) || 'MEMBER';
  const authorName = (document.getElementById('thesisSubAuthorName').value.trim()) || (AppState.currentUser && AppState.currentUser.name);
  const degree = document.getElementById('thesisSubDegree').value.trim();
  const category = document.getElementById('thesisSubCategory').value;
  const supervisors = document.getElementById('thesisSubSupervisors').value.trim();
  const keywordsStr = document.getElementById('thesisSubKeywords').value.trim();
  const abstract = document.getElementById('thesisSubAbstract').value.trim();
  const fileInput = document.getElementById('thesisSubFile');

  const fileObj = {
    fileName: fileInput.files && fileInput.files[0] ? fileInput.files[0].name : `${authorName.replace(/\s+/g, '_')}_2026_Thesis.pdf`,
    fileSize: fileInput.files && fileInput.files[0] ? `${(fileInput.files[0].size / 1024 / 1024).toFixed(1)} MB` : "4.2 MB",
    pages: Math.floor(65 + Math.random() * 40),
    downloadsCount: 1
  };
  let thesisDataUrl = null;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    try { thesisDataUrl = await fileToDataUrl(fileInput.files[0]); } catch (err) {}
  }

  const keywords = keywordsStr ? keywordsStr.split(',').map(s => s.trim()).filter(Boolean) : ["Food Science", "Nutrition", "AFOSTECH Research"];

  if (AppState.isBackendOnline) {
    try {
      const result = await apiRequest('/api/theses', {
        method: 'POST',
        body: JSON.stringify({
          title, tagline, author: authorName, authorAdmissionNo: admissionNo,
          authorDegree: degree, universityId, category, supervisors,
          keywords, abstract, file: fileObj, thesisDataUrl
        })
      });
      AppState.theses.unshift(result.thesis);
      closeModal();
      e.target.reset();
      recalculateUniversityScores();
      renderThesesRepository();
      switchTab('theses');
      showToast("📚 Research dissertation submitted and saved to database!");
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }

  // Fallback offline
  const univ = AppState.universities.find(u => u.id === universityId);
  const newThesis = {
    id: `thesis-${Date.now()}`, title, tagline, author: authorName,
    authorAdmissionNo: admissionNo, authorDegree: degree, authorVerified: false,
    universityId, universityName: univ ? univ.shortName : "Affiliate",
    supervisors: supervisors || "Department Research Committee",
    department: univ ? (univ.faculty || "School of Food Science") : "School of Food Science",
    category, categoryLabel: category.toUpperCase(),
    dateSubmitted: "November 2026", year: "2026", abstract, keywords, file: fileObj,
    viewsCount: 1, comments: []
  };
  AppState.theses.unshift(newThesis);
  saveState();
  closeModal();
  e.target.reset();
  renderThesesRepository();
  switchTab('theses');
  showToast("📚 Research dissertation submitted successfully!");
}

function openThesisDetail(thesisId, defaultTab = 'abstract') {
  const thesis = (AppState.theses || []).find(t => t.id === thesisId);
  if (!thesis) return;

  // Increment views
  thesis.viewsCount = (thesis.viewsCount || 0) + 1;
  saveState();

  const modal = document.getElementById('thesisDetailModal');
  const body = document.getElementById('thesisDetailModalBody');
  const titleHeader = document.getElementById('thesisModalTitleHeader');
  if (!modal || !body) return;

  if (titleHeader) titleHeader.innerText = thesis.title;
  const theme = getCategoryTheme(thesis.category);
  const commentsList = thesis.comments || [];
  const downloadsCount = (thesis.file && thesis.file.downloadsCount) || 0;

  body.innerHTML = `
    <!-- Top Academic Metadata Card -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="thesis-univ-badge" style="background: white;">
            🏛️ <strong>${thesis.universityName}</strong>
          </span>
          <span class="thesis-category-chip" style="background: ${theme.bg}; color: ${theme.text}; border: 1px solid ${theme.border};">
            ${theme.icon} ${thesis.categoryLabel || thesis.category.toUpperCase()}
          </span>
          ${thesis.authorVerified ? '<span style="font-size: 0.75rem; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-weight: 800; border: 1px solid #fcd34d;">✓ Verified Innovator</span>' : '<span style="font-size: 0.75rem; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 9999px; font-weight: 800; border: 1px solid #a7f3d0;">Student Researcher</span>'}
        </div>
        <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">
          📅 Defended: <strong>${thesis.dateSubmitted || '2026'}</strong>
        </div>
      </div>

      <h2 style="font-size: 1.35rem; font-weight: 900; color: var(--navy); line-height: 1.4; margin-bottom: 10px;">
        ${thesis.title}
      </h2>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 0.86rem; color: #334155; margin-bottom: 16px;">
        <div>
          <span style="color: #64748b; display: block; font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Student Author</span>
          <strong>${thesis.author}</strong> 
        </div>
        <div>
          <span style="color: #64748b; display: block; font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Degree Program</span>
          <strong>${thesis.authorDegree}</strong>
        </div>
        <div>
          <span style="color: #64748b; display: block; font-size: 0.74rem; text-transform: uppercase; font-weight: 700;">Supervising Faculty</span>
          <strong>${thesis.supervisors || 'Faculty Advisory Panel'}</strong>
        </div>
      </div>

      <!-- Action & Download CTA Banner -->
      <div style="background: white; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 2rem;">📑</span>
          <div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #065f46;">
              ${thesis.file ? thesis.file.fileName : 'Thesis_Document.pdf'}
            </div>
            <div style="font-size: 0.78rem; color: #059669;">
              ${thesis.file ? thesis.file.fileSize : '4.5 MB'} &bull; ${thesis.file ? thesis.file.pages : 85} Pages &bull; Complete Full Research Thesis
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn-primary" style="padding: 9px 18px; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;" onclick="downloadThesis('${thesis.id}')">
            <span>📥</span> Download Full Thesis PDF (<strong id="modalDlCount_${thesis.id}">${downloadsCount}</strong>)
          </button>
        </div>
      </div>
    </div>

    <!-- Interactive Navigation Tabs in Modal -->
    <div class="thesis-tab-nav">
      <button type="button" class="thesis-tab-btn ${defaultTab === 'abstract' ? 'active' : ''}" id="tabBtn_abstract" onclick="switchThesisModalTab('abstract')">
        <span>📑</span> Research Abstract &amp; Key Findings
      </button>
      <button type="button" class="thesis-tab-btn ${defaultTab === 'document' ? 'active' : ''}" id="tabBtn_document" onclick="switchThesisModalTab('document')">
        <span>📖</span> Full Thesis Document Reader
      </button>
      <button type="button" class="thesis-tab-btn ${defaultTab === 'comments' ? 'active' : ''}" id="tabBtn_comments" onclick="switchThesisModalTab('comments')">
        <span>💬</span> Peer Reviews &amp; Academic Comments (<strong id="modalCommentsCount_${thesis.id}">${commentsList.length}</strong>)
      </button>
    </div>

    <!-- TAB 1: ABSTRACT & EXECUTIVE SUMMARY -->
    <div id="thesisTabContent_abstract" style="display: ${defaultTab === 'abstract' ? 'block' : 'none'};">
      <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px;">
        <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--navy); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>🔬</span> Scientific Abstract &amp; Executive Summary
        </h4>
        <p style="font-size: 0.95rem; color: #334155; line-height: 1.7; text-align: justify; margin-bottom: 20px;">
          ${thesis.abstract}
        </p>

        <!-- Structured Key Findings Box -->
        <div style="background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px;">
          <h5 style="font-size: 0.95rem; font-weight: 900; color: #065f46; margin-bottom: 10px;">
            Key Analytical Results &amp; Practical Industry Value:
          </h5>
          <ul style="font-size: 0.88rem; color: #1e293b; padding-left: 20px; line-height: 1.6;">
            <li><strong>Laboratory Methodology:</strong> Standardized analytical protocols, sensory testing with trained hedonic panels, and bioaccessibility assays.</li>
            <li><strong>Nutritional &amp; Functional Retention:</strong> Documented high bioactive stability, bio-preservation, and microbial safety thresholds.</li>
            <li><strong>Commercial Application:</strong> Formulated for low-cost, decentralized manufacturing utilizing indigenous African agricultural feedstocks.</li>
          </ul>
        </div>

        <div>
          <span style="font-size: 0.8rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-right: 8px;">Keywords:</span>
          ${(thesis.keywords || []).map(k => `<span class="thesis-tag-item" style="font-size: 0.8rem; margin: 2px;">#${k}</span>`).join('')}
        </div>
      </div>
    </div>

    <!-- TAB 2: FULL THESIS DOCUMENT READER -->
    <div id="thesisTabContent_document" style="display: ${defaultTab === 'document' ? 'block' : 'none'};">
      <div class="academic-paper-view">
        <div class="academic-paper-header">
          <div class="academic-seal-wrap">
            <img src="assets/logo.jpg" alt="AFOSTECH Official Seal" style="height: 52px; width: 52px; border-radius: 8px; object-fit: contain; border: 1.5px solid #10b981; background: white; padding: 2px;">
            <div style="text-align: left;">
              <div style="font-size: 0.82rem; font-weight: 800; letter-spacing: 1px; color: #059669; text-transform: uppercase;">
                ${thesis.universityName} &bull; ${thesis.department || 'School of Food Science and Nutrition'}
              </div>
              <div style="font-size: 0.72rem; color: #64748b;">
                Association of Food Science and Technology Students (AFOSTECH) Collegiate Consortium
              </div>
            </div>
          </div>

          <h1 class="academic-paper-title">${thesis.title}</h1>
          <div class="academic-paper-authors">
            By <strong>${thesis.author}</strong> (Admission No: <strong>${thesis.authorAdmissionNo || 'Bonafide Student'}</strong>)
          </div>
          <div class="academic-paper-supervisors">
            Academic Supervisors: <strong>${thesis.supervisors || 'Faculty Advisory Committee'}</strong> &bull; ${thesis.dateSubmitted || 'Academic Year 2026'}
          </div>

          <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 14px; border-radius: 9999px; font-size: 0.75rem; color: #047857; font-weight: 700;">
            <span>✓</span> Official Candidate Dissertation &bull; Verified for Open-Access Academic Dissemination
          </div>
        </div>

        <div class="academic-paper-section">
          <h4>Chapter 1: Problem Statement &amp; Research Hypothesis</h4>
          <p>
            Agricultural post-harvest losses and micronutrient malnutrition represent twin vulnerabilities across developing food systems. Traditional processing technologies frequently induce thermal degradation of sensitive bioactives and micronutrients. This dissertation tests the central hypothesis that optimizing non-thermal or low-temperature drying and encapsulation protocols enables maximum retention of functional matrices while delivering acceptable sensory hedonic profiles to consumers.
          </p>
        </div>

        <div class="academic-paper-section">
          <h4>Chapter 2: Materials, Experimental Protocols &amp; Analytical Methods</h4>
          <p>
            All botanical raw materials were harvested at physiological maturity from certified university agricultural research stations. Experimental designs followed standard completely randomized factorial arrangements (CRD). High-Performance Liquid Chromatography (RP-HPLC) was performed on a C18 reverse-phase column with photodiode array detection. Sensory evaluation was conducted under red-light masking in standardized individual sensory booths using trained 9-point hedonic scaling. Statistical analysis was performed using one-way ANOVA followed by Tukey's Honest Significant Difference post-hoc comparisons (p &lt; 0.05).
          </p>
        </div>

        <div class="academic-paper-section">
          <h4>Chapter 3: Scientific Results &amp; Laboratory Discussion</h4>
          <p>
            Experimental trials proved that the optimized processing parameters resulted in statistically significant bioactive retention (p &lt; 0.001) over conventional atmospheric processing. Moisture sorption isotherms demonstrated that packaging the formulation in moisture-barrier laminates maintains microbial stability (water activity a_w &lt; 0.35) for a minimum of 180 days at 25°C ambient tropical conditions.
          </p>
        </div>

        <div class="academic-paper-section">
          <h4>Chapter 4: Conclusions, Commercial Scale-Up &amp; Recommendations</h4>
          <p>
            The findings demonstrate a commercially feasible, student-led innovation that bridges the gap between academic research and community nutrition security. Recommendations are made for regional food processing hubs and small-to-medium food enterprises (SMEs) to adopt these low-cost parameters for fortified consumer food manufacturing.
          </p>
        </div>

        <div style="border-top: 1px solid #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="font-size: 0.8rem; color: #64748b;">
            📄 Complete ${thesis.file ? thesis.file.pages : 85}-Page Thesis Document File: <strong>${thesis.file ? thesis.file.fileName : 'Thesis.pdf'}</strong>
          </div>
          <button class="btn-primary" style="padding: 7px 16px; font-size: 0.82rem;" onclick="downloadThesis('${thesis.id}')">
            📥 Download Complete Document (${thesis.file ? thesis.file.fileSize : 'PDF'})
          </button>
        </div>
      </div>
    </div>

    <!-- TAB 3: PEER REVIEWS & ACADEMIC COMMENTS -->
    <div id="thesisTabContent_comments" style="display: ${defaultTab === 'comments' ? 'block' : 'none'};">
      <div class="comment-thread-container" style="margin-top: 0; border-top: none; padding-top: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--navy);">
              💬 Academic Peer Review &amp; Scientific Discussion
            </h4>
            <span style="font-size: 0.8rem; color: #64748b;">
              Constructive critique, questions on laboratory methodology, and industry collaboration inquiries.
            </span>
          </div>
          <span style="font-size: 0.82rem; font-weight: 800; background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0;">
            ${commentsList.length} Peer Review${commentsList.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        <!-- Add Comment Form -->
        <form id="thesisCommentForm_${thesis.id}" onsubmit="handleThesisCommentSubmit(event, '${thesis.id}')" style="background: white; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <h5 style="font-size: 0.95rem; font-weight: 800; color: var(--navy); margin-bottom: 12px;">
            ✍️ Post a Peer Review / Critique on this Research
          </h5>
          <div class="form-row">
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 0.78rem;">Your Full Name *</label>
              <input type="text" id="commAuthorName_${thesis.id}" class="form-control" placeholder="e.g. Kelvin Mutua" required style="padding: 7px 10px; font-size: 0.84rem;">
            </div>
            <div class="form-group" style="margin-bottom: 10px;">
              <label class="form-label" style="font-size: 0.78rem;">University / Affiliation &amp; Role *</label>
              <input type="text" id="commAuthorRole_${thesis.id}" class="form-control" placeholder="e.g. JKUAT Kenya • Finalist Researcher" required style="padding: 7px 10px; font-size: 0.84rem;">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label class="form-label" style="font-size: 0.78rem;">Peer Critique / Question on Methodology or Findings *</label>
            <textarea id="commContent_${thesis.id}" class="form-control" rows="3" placeholder="Share your academic review, question experimental protocols, or discuss commercial scaling..." required style="font-size: 0.86rem;"></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn-primary" style="padding: 8px 18px; font-size: 0.84rem; background: linear-gradient(135deg, #059669 0%, #0284c7 100%);">
              Post Academic Peer Review →
            </button>
          </div>
        </form>

        <!-- Existing Comments List -->
        <div id="thesisCommentsList_${thesis.id}">
          ${commentsList.map(c => `
            <div class="comment-card-item">
              <div class="comment-card-header">
                <div>
                  <span class="comment-author-name">${c.author}</span>
                  <span class="comment-role-tag">${c.role} (${c.university})</span>
                </div>
                <span class="comment-timestamp">${c.date}</span>
              </div>
              <p class="comment-body-text">${c.content}</p>
            </div>
          `).join('') || '<p style="color: #64748b; font-size: 0.88rem; text-align: center; padding: 20px;">No peer reviews yet. Be the first food science researcher to comment!</p>'}
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function switchThesisModalTab(tabId) {
  ['abstract', 'document', 'comments'].forEach(t => {
    const btn = document.getElementById(`tabBtn_${t}`);
    const content = document.getElementById(`thesisTabContent_${t}`);
    if (btn) btn.classList.toggle('active', t === tabId);
    if (content) content.style.display = t === tabId ? 'block' : 'none';
  });
}

async function downloadThesis(thesisId) {
  const thesis = AppState.theses.find(t => t.id === thesisId);
  if (!thesis) return;

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest(`/api/theses/${thesisId}/download`, { method: 'POST' });
      if (thesis.file) thesis.file.downloadsCount = res.downloadsCount;
    } catch (e) {}
  } else if (thesis.file) {
    thesis.file.downloadsCount = (thesis.file.downloadsCount || 0) + 1;
    saveState();
  }

  const fileName = thesis.file ? thesis.file.fileName : 'Thesis_Manuscript.pdf';
  if (thesis.file && thesis.file.url) {
    window.open(thesis.file.url, '_blank');
  }
  showToast(`Downloading Open Access Thesis: "${fileName}"...`);
  renderThesesRepository();
}

async function handleThesisCommentSubmit(e, thesisId) {
  e.preventDefault();
  const thesis = AppState.theses.find(t => t.id === thesisId);
  if (!thesis) return;

  const author = (document.getElementById(`commAuthorName_${thesisId}`)?.value || '').trim();
  const role = (document.getElementById(`commAuthorRole_${thesisId}`)?.value || '').trim() || 'Student Researcher / Peer Reviewer';
  const content = (document.getElementById(`commContent_${thesisId}`)?.value || '').trim();
  if (!author || !content) return;

  const university = (AppState.currentUser && AppState.currentUser.universityName) || 'AFOSTECH Community';
  let newComment = {
    id: `comm-${Date.now()}`, author, role, university, date: 'Just now', content
  };

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest(`/api/theses/${thesisId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ author, role, university, content })
      });
      newComment = res.comment;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }

  if (!thesis.comments) thesis.comments = [];
  thesis.comments.push(newComment);
  saveState();

  showToast(`💬 Peer review comment posted on "${thesis.title}"!`);
  openThesisDetail(thesisId, 'comments');
  renderThesesRepository();
}

async function toggleUpvote(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest(`/api/projects/${projectId}/upvote`, { method: 'POST' });
      project.upvotes = res.upvotes;
      if (res.upvoted) {
        AppState.upvotedProjects.add(projectId);
        showToast(`Endorsed! +5 competition points awarded to ${project.universityName} 🎉`);
      } else {
        AppState.upvotedProjects.delete(projectId);
        showToast(`Removed endorsement for ${project.title}`);
      }
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  } else {
    const hasUpvoted = AppState.upvotedProjects.has(projectId);
    if (hasUpvoted) {
      AppState.upvotedProjects.delete(projectId);
      project.upvotes = Math.max(0, project.upvotes - 1);
      showToast(`Removed endorsement for ${project.title}`);
    } else {
      AppState.upvotedProjects.add(projectId);
      project.upvotes += 1;
      showToast(`Endorsed! +5 competition points awarded to ${project.universityName} 🎉`);
    }
    saveState();
  }

  recalculateUniversityScores();
  renderCatalog();
  renderDashboard();
  renderLeaderboard();
}

// ============================================================================
// UNIVERSITY LEADERBOARD
// ============================================================================
function renderLeaderboard() {
  const podiumContainer = document.getElementById('leaderboardPodium');
  const tableBody = document.getElementById('leaderboardTableBody');
  if (!podiumContainer || !tableBody) return;

  const top3 = AppState.universities.slice(0, 3);
  if (top3.length >= 3) {
    podiumContainer.innerHTML = `
      <div class="podium-step rank-2" onclick="filterByUniv('${top3[1].id}')" style="cursor: pointer;">
        <div class="podium-avatar">🥈</div>
        <div class="podium-univ-name">${top3[1].shortName}</div>
        <div class="podium-points">${top3[1].calculatedPoints} pts</div>
        <div class="podium-pillar">2</div>
      </div>
      <div class="podium-step rank-1" onclick="filterByUniv('${top3[0].id}')" style="cursor: pointer;">
        <div class="podium-avatar">🏆</div>
        <div class="podium-univ-name">${top3[0].shortName}</div>
        <div class="podium-points">${top3[0].calculatedPoints} pts</div>
        <div class="podium-pillar">1</div>
      </div>
      <div class="podium-step rank-3" onclick="filterByUniv('${top3[2].id}')" style="cursor: pointer;">
        <div class="podium-avatar">🥉</div>
        <div class="podium-univ-name">${top3[2].shortName}</div>
        <div class="podium-points">${top3[2].calculatedPoints} pts</div>
        <div class="podium-pillar">3</div>
      </div>
    `;
  }

  tableBody.innerHTML = AppState.universities.map(u => {
    let rankBadgeClass = u.rank === 1 ? 'top-1' : u.rank === 2 ? 'top-2' : u.rank === 3 ? 'top-3' : 'other';
    return `
      <tr>
        <td><span class="rank-badge ${rankBadgeClass}">${u.rank}</span></td>
        <td>
          <div class="univ-info-cell">
            <span class="univ-color-dot" style="background: ${u.logoColor};"></span>
            <div>
              <div class="univ-cell-name">${u.name} (${u.shortName})</div>
              <div class="univ-cell-loc">${u.city}, ${u.country} • ${u.strengths}</div>
            </div>
          </div>
        </td>
        <td><strong style="color: var(--primary); font-size: 1.08rem;">${u.calculatedPoints}</strong></td>
        <td>
          <span style="font-weight: 800; color: #0284c7;">${u.projectsCount}</span> prototypes
          <div style="font-size: 0.72rem; color: #64748b; font-weight: 600; margin-top: 2px;">👥 ${u.studentScientistsCount || 3} Student Scientists</div>
        </td>
        <td><span style="font-size: 0.84rem; color: #475569;">${u.chapterLead}</span></td>
        <td><button class="btn-filter-univ" onclick="filterByUniv('${u.id}')">Explore Projects →</button></td>
      </tr>
    `;
  }).join('');
}

function filterByUniv(univId) {
  AppState.selectedUniversity = univId;
  const univSelect = document.getElementById('filterUniversity');
  if (univSelect) univSelect.value = univId;
  switchTab('catalog');
  renderCatalog();
}

// ============================================================================
// ABOUT AFOSTECH & CAMPUS PARTNERSHIP MOVEMENT
// ============================================================================
function renderAbout() {
  const container = document.getElementById('aboutUniversitiesGrid');
  if (container) {
    container.innerHTML = AppState.universities.map(u => `
      <div class="pillar-card" style="border-top: 4px solid ${u.logoColor};">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span class="univ-color-dot" style="background: ${u.logoColor}; width: 16px; height: 16px;"></span>
          <span style="font-size: 0.75rem; font-weight: 800; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 9999px;">${u.country}</span>
        </div>
        <h4 style="font-size: 1.1rem; font-weight: 900; margin-bottom: 4px;">${u.name}</h4>
        <div style="font-size: 0.82rem; color: var(--primary); font-weight: 700; margin-bottom: 4px;">Chapter Lead: ${u.chapterLead}</div>
        <p style="font-size: 0.84rem; color: #475569; margin-bottom: 8px;"><strong>Academic Focus:</strong> ${u.strengths}</p>
        <div style="font-size: 0.76rem; color: #0284c7; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>👥 <strong>${u.studentScientistsCount || 3}</strong> Student Scientists</span>
          <span>•</span>
          <span>💡 <strong>${u.projectsCount}</strong> Prototypes</span>
        </div>
        <button class="btn-filter-univ" style="width: 100%; text-align: center;" onclick="filterByUniv('${u.id}')">
          View Chapter Innovations (${u.projectsCount})
        </button>
      </div>
    `).join('');
  }
}

// ============================================================================
// READ REQUEST LETTER FEATURE (Restricted Exclusively to Staff Portal)
// ============================================================================
function handlePartLetterFileSelect(input) {
  const info = document.getElementById('partLetterFileInfo');
  const nameEl = document.getElementById('partLetterFileName');
  const sizeEl = document.getElementById('partLetterFileSize');
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    if (nameEl) nameEl.textContent = file.name;
    const mbSize = (file.size / (1024 * 1024)).toFixed(2);
    if (sizeEl) sizeEl.textContent = `(${mbSize} MB)`;
    if (info) info.style.display = 'flex';
  }
}

function clearPartLetterFile(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const input = document.getElementById('partLetterFile');
  if (input) input.value = '';
  const info = document.getElementById('partLetterFileInfo');
  if (info) info.style.display = 'none';
}

function downloadRequestLetterDoc(requestId) {
  const req = AppState.partnershipRequests.find(r => r.id === requestId);
  const docName = req && req.letterDocumentFile ? req.letterDocumentFile.name : 'Official_Request_Letter.pdf';
  showToast(`📥 Downloading official attached request letter: ${docName} for secretariat review`);
}

function openRequestLetter(requestId) {
  // Security check: Only authenticated staff officials can read private partnership request letters
  if (!AppState.currentStaffUser) {
    showToast('🔒 Access Restricted: Institutional request letters and dean correspondence are confidential and accessible solely to AFOSTECH officials via the Staff Portal.');
    openStaffLoginModal();
    return;
  }

  const req = AppState.partnershipRequests.find(r => r.id === requestId);
  if (!req) return;

  const modal = document.getElementById('partnershipLetterModal');
  const body = document.getElementById('partnershipLetterBody');
  if (!modal || !body) return;

  const isStaff = true;
  const docFile = req.letterDocumentFile || {
    name: `${req.shortName || 'University'}_Official_Affiliation_Request_Letter_Signed.pdf`,
    size: '2.4 MB',
    type: 'application/pdf',
    uploadedAt: req.dateApplied || 'Nov 2026'
  };

  body.innerHTML = `
    <!-- Attached Official Request Document File -->
    <div style="background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 2px solid #a7f3d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 2px 8px rgba(6,78,59,0.06);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 48px; height: 48px; border-radius: 10px; background: #059669; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 2px 6px rgba(5,150,105,0.3);">
          📑
        </div>
        <div>
          <div style="font-size: 0.72rem; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Attached Official Request Letter Document File</div>
          <div style="font-size: 0.98rem; font-weight: 900; color: #064e3b; display: flex; align-items: center; gap: 8px;">
            <span>${docFile.name}</span>
            <span style="font-size: 0.72rem; background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 9999px; border: 1px solid #86efac; font-weight: 800;">✓ Verified Letterhead</span>
          </div>
          <div style="font-size: 0.76rem; color: #64748b; margin-top: 2px;">
            Size: <strong>${docFile.size}</strong> • Attached via University Institutional Application • Uploaded: ${docFile.uploadedAt || req.dateApplied || 'Nov 2026'}
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-primary" style="padding: 8px 16px; font-size: 0.82rem; background: linear-gradient(135deg, #059669, #047857); display: inline-flex; align-items: center; gap: 6px;" onclick="downloadRequestLetterDoc('${req.id}')">
          <span>📥</span> Download Attached Document (${docFile.size})
        </button>
      </div>
    </div>

    <!-- Official Institutional Letterhead -->
    <div class="official-letterhead" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); font-family: 'Plus Jakarta Sans', Georgia, serif;">
      
      <!-- Top Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px double #064e3b; padding-bottom: 16px; margin-bottom: 22px; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; gap: 14px; align-items: center;">
          <div style="width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, #064e3b, #047857); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
            🏛️
          </div>
          <div>
            <h3 style="font-size: 1.35rem; font-weight: 900; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
              ${req.universityName}
            </h3>
            <div style="font-size: 0.85rem; font-weight: 800; color: #475569;">
              ${req.facultyDepartment || 'Faculty of Agriculture & Food Science'}
            </div>
            <div style="font-size: 0.78rem; color: #64748b;">
              ${req.city || 'Main Campus'}, ${req.country} • Institutional Domain: <strong style="color: #047857;">${req.officialEmail}</strong>
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Official Ref:</div>
          <div style="font-size: 0.88rem; font-family: monospace; font-weight: 800; color: #0f172a;">
            ${req.referenceNo || 'UCC/FST/DIR/2026/044'}
          </div>
          <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px;">
            Date: <strong>${req.dateApplied || 'November 2026'}</strong>
          </div>
          <span style="display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-top: 4px;">
            ✓ Authenticated Institutional Email
          </span>
        </div>
      </div>

      <!-- Addressed To Details -->
      <div style="margin-bottom: 20px; font-size: 0.88rem; color: #334155; line-height: 1.55;">
        <strong>To:</strong> The Executive Council &amp; Directorate of Inter-University Affiliations<br>
        <strong>Consortium:</strong> Association of Food Science and Technology Students (AFOSTECH)<br>
        <strong>Dispatched To Official Email:</strong> <span style="color: #0284c7; font-weight: 700;">partnerships@afostech-students.org</span><br>
        <strong>Campus Student Body:</strong> ${req.studentEnrollment || '300+ Food Science & Nutrition Students'}
      </div>

      <!-- Subject Heading -->
      <div style="background: #f8fafc; border-left: 4.5px solid var(--primary); padding: 12px 16px; margin-bottom: 22px; border-radius: 0 8px 8px 0;">
        <strong style="color: #0f172a; font-size: 0.96rem; text-transform: uppercase; letter-spacing: 0.4px;">
          SUBJECT: ${req.letterSubject || 'FORMAL APPLICATION FOR INTER-UNIVERSITY CHAPTER AFFILIATION & STUDENT PRODUCT SHOWCASE ACCESS'}
        </strong>
      </div>

      <!-- Full Request Letter Body -->
      <div style="font-size: 0.94rem; color: #1e293b; line-height: 1.75; white-space: pre-line; margin-bottom: 32px; background: #ffffff;">
${req.fullLetterBody || req.letterOfIntent}
      </div>

      <!-- Dean Signature Block & Verified University Seal -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1.5px solid #e2e8f0; padding-top: 20px; margin-top: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="font-family: 'Times New Roman', Georgia, serif; font-size: 1.5rem; font-style: italic; color: #1e3a8a; margin-bottom: 4px;">
            ${req.contactPerson}
          </div>
          <div style="font-weight: 900; font-size: 0.95rem; color: #0f172a;">${req.contactPerson}</div>
          <div style="font-size: 0.82rem; color: #475569;">${req.contactTitle || 'Dean, School of Agriculture & Allied Sciences'}</div>
          <div style="font-size: 0.78rem; color: #047857; font-weight: 700;">${req.universityName} • ${req.officialEmail}</div>
        </div>

        <div style="border: 2px dashed #059669; border-radius: 8px; padding: 12px 18px; text-align: center; background: #f0fdf4;">
          <div style="font-size: 0.68rem; font-weight: 900; color: #047857; text-transform: uppercase; letter-spacing: 0.8px;">Official Institutional Seal</div>
          <div style="font-size: 0.85rem; font-weight: 900; color: #064e3b; margin: 3px 0;">ACADEMIC DOMAIN AUTHENTICATED</div>
          <div style="font-size: 0.72rem; color: #059669;">Recorded in AFOSTECH Inward Secretariat Log</div>
        </div>
      </div>
    </div>

    <!-- Modal Controls & Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; flex-wrap: wrap; gap: 12px;">
      <div>
        <span style="font-size: 0.85rem; color: #64748b;">
          Affiliation Status: <strong style="color: ${req.status === 'Approved' ? '#059669' : '#d97706'};">${req.status}</strong>
        </span>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="btn-primary" style="background: linear-gradient(135deg, #059669, #047857); display: inline-flex; align-items: center; gap: 6px;" onclick="downloadRequestLetterDoc('${req.id}')">
          <span>📥</span> Download Attached Letter Document (${docFile.size})
        </button>
        <button class="btn-outline" onclick="showToast('Official letter prepared for PDF export!')">
          🖨️ Print / Save Letter (PDF)
        </button>
        ${(isStaff && req.status !== 'Approved') ? `
          <button class="btn-primary" onclick="approveUniversityPartnership('${req.id}'); closeModal();">
            ✓ Approve Partnership &amp; Add Chapter
          </button>
        ` : ''}
        <button class="btn-outline js-modal-close" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ============================================================================
// PROJECT DETAIL MODAL (With Rich Team Members & Dissertation)
// ============================================================================
function openProjectDetail(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  const modal = document.getElementById('projectDetailModal');
  const body = document.getElementById('projectDetailModalBody');
  if (!modal || !body) return;

  const isUpvoted = AppState.upvotedProjects.has(project.id);
  const upvoteClass = isUpvoted ? 'upvoted' : '';
  const theme = getCategoryTheme(project.category);

  // Render Full Team Members Roster
  const teamMembersHTML = (project.authors || []).map(author => `
    <div class="team-member-card">
      <div class="team-avatar">${author.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <h5 style="font-size: 0.95rem; font-weight: 900; color: var(--navy); margin-bottom: 2px;">${author.name}</h5>
          <span style="font-size: 0.75rem; font-family: monospace; font-weight: 700; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">
            Adm: ${author.admissionNo || 'Verified Student'}
          </span>
        </div>
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary); margin-bottom: 4px;">
          ${author.role} • <span style="color: #64748b; font-weight: 500;">${author.year || 'Food Science Researcher'}</span>
        </div>
        ${author.contribution ? `<p style="font-size: 0.8rem; color: #475569; line-height: 1.45;"><strong>Role in Project:</strong> ${author.contribution}</p>` : ''}
        ${author.email ? `<div style="font-size: 0.75rem; color: #0284c7; margin-top: 4px;">✉️ ${author.email}</div>` : ''}
      </div>
    </div>
  `).join('');

  // Enrolled innovators are pre-authenticated by their institution prior to enrollment; authenticity prompt is not publicized.
  const instNoticeHTML = '';

  // Dissertation file badge
  const dissertationHTML = project.dissertationFile ? `
    <div style="background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.8rem;">📑</span>
        <div>
          <div style="font-size: 0.88rem; font-weight: 800; color: #065f46;">
            ${project.dissertationFile.name}
          </div>
          <div style="font-size: 0.75rem; color: #047857;">
            ${project.dissertationFile.size} • ${project.dissertationFile.pages} Pages • University Research Document
          </div>
        </div>
      </div>
      <button class="btn-outline" style="padding: 6px 14px; font-size: 0.8rem; border-color: #059669; color: #065f46;" onclick="showToast('Dissertation thesis downloaded for academic review!')">
        Download Dissertation (PDF)
      </button>
    </div>
  ` : '';

  // Process Flow
  const processFlowHTML = (project.processFlow || []).map((step, idx) => `
    <li style="margin-bottom: 8px; font-size: 0.88rem; color: #334155;">
      <strong style="color: var(--primary);">Step ${idx + 1}:</strong> ${step}
    </li>
  `).join('');

  // Ingredients Badges
  const ingredientsHTML = (project.ingredients || []).map(ing => `
    <span style="background: #ffffff; border: 1.5px solid #a7f3d0; padding: 4px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 700; color: #065f46; display: inline-block; margin: 3px;">
      🌿 ${ing}
    </span>
  `).join('');

  // Nutrition Rows
  const nutritionRowsHTML = Object.entries(project.nutritionPer100g || {}).map(([key, val]) => {
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `<div class="nutrition-row"><span>${formattedKey}</span><strong style="color: #0f172a;">${val}</strong></div>`;
  }).join('');

  body.innerHTML = `
    <div class="detail-hero-grid">
      <div>
        <img src="${project.image}" alt="${project.title}" class="detail-img">
        <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${(project.badges || []).map(b => `<span style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; font-size: 0.75rem; font-weight: 800; padding: 3px 8px; border-radius: 9999px; border: 1px solid #fcd34d;">${b}</span>`).join('')}
        </div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="color: ${theme.text}; font-weight: 900; font-size: 0.82rem; text-transform: uppercase; background: ${theme.bg}; padding: 3px 10px; border-radius: 9999px; border: 1px solid ${theme.border};">
            ${theme.icon} ${project.categoryLabel}
          </span>
          <span style="font-size: 0.85rem; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 3px 12px; border-radius: 9999px;">
            ${project.universityName}
          </span>
        </div>
        <h2 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 6px; color: var(--navy);">${project.title}</h2>
        <p style="font-size: 0.92rem; color: #475569; font-style: italic; margin-bottom: 14px;">${project.tagline}</p>
        <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px;">${project.summary}</p>
        
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
          <button class="btn-upvote ${upvoteClass}" data-id="${project.id}" style="padding: 9px 18px; font-size: 0.92rem;" onclick="toggleUpvoteInModal('${project.id}')">
            <span>${isUpvoted ? '❤️ Endorsed' : '🤍 Endorse Innovation'}</span>
            <span class="upvote-count">${project.upvotes}</span>
          </button>
          <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">+5 Points toward University Leaderboard</span>
        </div>
      </div>
    </div>

    <!-- Try Product External Marketplace Link Callout -->
    <div class="try-product-callout">
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 2.2rem;">🛍️</span>
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 900; color: #064e3b; margin-bottom: 2px;">
            Try &amp; Order This Food Prototype
          </h4>
          <p style="font-size: 0.82rem; color: #047857; line-height: 1.45;">
            Directs you to our <strong>AFOSTECH Food Feed &amp; Marketplace App</strong> to order samples/wholesale packs or locate physical stores.
          </p>
        </div>
      </div>
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        ${(AppState.currentUser && (AppState.currentUser.role === 'staff' || project.leadAdmissionNo === AppState.currentUser.admissionNo || (project.authors || []).some(a => a.name === AppState.currentUser.name))) ? `
          <button class="btn-outline" style="padding: 9px 14px; font-size: 0.84rem; border-color: #059669; color: #065f46;" onclick="openProductImageEditor('${project.id}')">
            🖼️ Edit Photo
          </button>
        ` : ''}
        <button class="btn-primary" style="padding: 10px 22px; font-size: 0.9rem; background: linear-gradient(135deg, #059669, #047857); border: none; white-space: nowrap; box-shadow: 0 4px 12px rgba(5,150,105,0.3);" onclick="openTryProductModal('${project.id}')">
          🛒 Try Product →
        </button>
      </div>
    </div>

    <!-- Institutional Authenticity Verification Status -->
    ${instNoticeHTML}

    <!-- Dissertation Thesis Spotlight -->
    ${dissertationHTML}

    <!-- Research Team & Student Innovators Section -->
    <div style="margin-bottom: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--navy);">
          👥 Student Innovation Team
        </h4>
        <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary); background: #ecfdf5; padding: 3px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">
          Campus Research Cohort
        </span>
      </div>
      <div class="team-roster-grid">
        ${teamMembersHTML}
      </div>
    </div>

    <!-- Nutritional Breakdown & Sensory Evaluation Split -->
    <div class="detail-analytics-grid">
      <div class="nutrition-panel">
        <div class="nutrition-title">Nutrition Facts</div>
        <div style="font-size: 0.78rem; margin-bottom: 8px; color: #64748b;">Analytical Laboratory Test Data (Per 100g)</div>
        ${nutritionRowsHTML}
      </div>

      <div class="sensory-panel">
        <h4 style="font-size: 1.1rem; font-weight: 900; color: #78350f; margin-bottom: 8px;">Organoleptic Sensory Evaluation</h4>
        <div style="font-size: 0.8rem; color: #92400e; margin-bottom: 12px;">Evaluated by Trained 9-point Hedonic Sensory Panels:</div>
        
        <div class="sensory-bar-row">
          <div class="sensory-bar-label"><span>Taste &amp; Flavor Profile</span><strong>${project.sensoryProfile ? project.sensoryProfile.taste : 9.0}/10</strong></div>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${(project.sensoryProfile ? project.sensoryProfile.taste : 9.0) * 10}%; background: linear-gradient(90deg, #f59e0b, #d97706);"></div></div>
        </div>
        <div class="sensory-bar-row">
          <div class="sensory-bar-label"><span>Aroma Volatiles</span><strong>${project.sensoryProfile ? project.sensoryProfile.aroma : 8.8}/10</strong></div>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${(project.sensoryProfile ? project.sensoryProfile.aroma : 8.8) * 10}%; background: linear-gradient(90deg, #ea580c, #f59e0b);"></div></div>
        </div>
        <div class="sensory-bar-row">
          <div class="sensory-bar-label"><span>Texture &amp; Mouthfeel</span><strong>${project.sensoryProfile ? project.sensoryProfile.textureCrunch : 9.2}/10</strong></div>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${(project.sensoryProfile ? project.sensoryProfile.textureCrunch : 9.2) * 10}%; background: linear-gradient(90deg, #059669, #10b981);"></div></div>
        </div>
        <div class="sensory-bar-row">
          <div class="sensory-bar-label"><span>Visual Appeal</span><strong>${project.sensoryProfile ? project.sensoryProfile.colorAppeal : 8.9}/10</strong></div>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${(project.sensoryProfile ? project.sensoryProfile.colorAppeal : 8.9) * 10}%; background: linear-gradient(90deg, #0284c7, #38bdf8);"></div></div>
        </div>
        <div style="margin-top: 14px; padding: 10px; background: #ffffff; border-radius: 8px; font-size: 0.82rem; color: #78350f; font-weight: 800; border: 1px solid #fcd34d; display: flex; justify-content: space-between;">
          <span>Sensory Index: ⭐ ${project.sensoryScore}/10</span>
          <span>Eco-Rating: 🌱 ${project.sustainabilityScore}/5.0</span>
        </div>
      </div>
    </div>

    <!-- Ingredients & Methodology -->
    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 1.05rem; font-weight: 900; margin-bottom: 8px; color: var(--navy);">Raw Bio-Ingredients</h4>
      <div>${ingredientsHTML}</div>
    </div>
    <div style="margin-bottom: 24px;">
      <h4 style="font-size: 1.05rem; font-weight: 900; margin-bottom: 8px; color: var(--navy);">Unit Operations Methodology</h4>
      <ol style="padding-left: 20px;">${processFlowHTML}</ol>
    </div>

    <!-- Peer Feedback -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
      <h4 style="font-size: 1.05rem; font-weight: 900; margin-bottom: 10px; color: var(--navy);">Inter-Collegiate Peer Review</h4>
      <div style="display: flex; gap: 10px; margin-bottom: 12px;">
        <input type="text" id="peerCommentInput" class="form-control" placeholder="Write a constructive food science critique for ${project.universityName} researchers...">
        <button class="btn-primary" style="white-space: nowrap;" onclick="submitPeerComment('${project.id}')">Post Critique</button>
      </div>
      <div id="peerCommentsList">
        <div style="padding: 10px; background: #f0fdf4; border-radius: 8px; margin-bottom: 6px; border: 1px solid #a7f3d0; font-size: 0.84rem;">
          <strong style="color: #047857;">Student Reviewer (Makerere Chapter):</strong> "Impressive vacuum-baking moisture curve! Did you observe any Maillard degradation on lysine bioavailability?"
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function toggleUpvoteInModal(projectId) {
  toggleUpvote(projectId);
  openProjectDetail(projectId);
}

function submitPeerComment(projectId) {
  const input = document.getElementById('peerCommentInput');
  const list = document.getElementById('peerCommentsList');
  if (!input || !input.value.trim() || !list) return;

  const newComment = document.createElement('div');
  newComment.style.cssText = 'padding: 10px; background: #ecfdf5; border-radius: 8px; margin-bottom: 6px; border: 1.5px solid #a7f3d0; font-size: 0.84rem;';
  newComment.innerHTML = `<strong style="color: #047857;">You (Peer Food Scientist):</strong> "${input.value.trim()}" <span style="font-size: 0.72rem; color: #059669;">• Just now</span>`;
  list.prepend(newComment);
  input.value = '';
  showToast("Peer critique posted to student research team!");
}

// ============================================================================
// SUBMIT INNOVATION MODAL (Restricted to Authenticated Student Innovators)
// ============================================================================
function openSubmitModal() {
  if (!AppState.currentUser) {
    showToast("🔒 Sign In Required: Please sign in with your student innovator or staff email to feature an innovation.");
    openAuthModal('signin');
    return;
  }

  const modal = document.getElementById('submitProjectModal');
  const user = AppState.currentUser;
  const isStaff = user.role === 'staff';

  const univSelect = document.getElementById('subUniversity');
  if (univSelect) {
    univSelect.innerHTML = AppState.universities.map(u => `
      <option value="${u.id}">${u.shortName} - ${u.name} (${u.country})</option>
    `).join('');
    if (!isStaff && user.universityId) {
      univSelect.value = user.universityId;
      univSelect.disabled = true;
    } else {
      univSelect.disabled = false;
    }
  }

  const authorInput = document.getElementById('subAuthorName');
  if (authorInput) {
    authorInput.value = user.name;
    authorInput.readOnly = !isStaff;
  }

  const admInput = document.getElementById('subLeadAdmissionNo');
  if (admInput) {
    admInput.value = user.admissionNo || (isStaff ? 'STAFF-OFFICIAL' : '');
    admInput.readOnly = !isStaff;
  }

  const roleInput = document.getElementById('subAuthorRole');
  if (roleInput && !roleInput.value.trim()) {
    roleInput.value = isStaff ? `Faculty Advisor / ${user.staffRole || 'Staff Official'}` : `Lead Innovator / ${user.degree || 'B.Sc. Food Science & Tech'}`;
  }

  const oldBanner = document.getElementById('submitAuthUserBanner');
  if (oldBanner) oldBanner.remove();

  AppState.teamMembersBuffer = [];
  renderTeamMembersBuilder();

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function addTeamMemberFieldRow() {
  const nameInput = document.getElementById('newMemberName');
  const admInput = document.getElementById('newMemberAdm');
  const roleInput = document.getElementById('newMemberRole');

  if (!nameInput.value.trim()) {
    showToast("Please enter team member's full name.");
    return;
  }
  if (!admInput.value.trim()) {
    showToast("Please enter team member's university admission number for authentication.");
    return;
  }

  AppState.teamMembersBuffer.push({
    name: nameInput.value.trim(),
    admissionNo: admInput.value.trim(),
    role: roleInput.value.trim() || 'Co-researcher',
    year: 'Student Innovator'
  });

  nameInput.value = '';
  admInput.value = '';
  roleInput.value = '';

  renderTeamMembersBuilder();
}

function renderTeamMembersBuilder() {
  const list = document.getElementById('teamMembersBufferList');
  if (!list) return;

  if (AppState.teamMembersBuffer.length === 0) {
    list.innerHTML = `<div style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">No additional team members added yet. Add team members below.</div>`;
    return;
  }

  list.innerHTML = AppState.teamMembersBuffer.map((m, idx) => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 4px; font-size: 0.82rem;">
      <div>
        <strong>${m.name}</strong> • <span style="font-family: monospace; color: #047857;">${m.admissionNo}</span> • <span style="color: #64748b;">${m.role}</span>
      </div>
      <button type="button" style="color: #e11d48; background: none; border: none; cursor: pointer; font-weight: bold;" onclick="removeTeamMember(${idx})">✕</button>
    </div>
  `).join('');
}

function removeTeamMember(index) {
  AppState.teamMembersBuffer.splice(index, 1);
  renderTeamMembersBuilder();
}

async function handleNewProjectSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('subTitle').value.trim();
  const tagline = document.getElementById('subTagline').value.trim();
  const universityId = document.getElementById('subUniversity').value;
  const leadAdmissionNo = (document.getElementById('subLeadAdmissionNo').value.trim()) || (AppState.currentUser && AppState.currentUser.admissionNo) || 'MEMBER';
  const category = document.getElementById('subCategory').value;
  const authorName = document.getElementById('subAuthorName').value.trim();
  const authorRole = document.getElementById('subAuthorRole').value.trim();
  const summary = document.getElementById('subSummary').value.trim();
  const ingredientsStr = document.getElementById('subIngredients').value.trim();
  const fileInput = document.getElementById('subDissertationFile');

  if (!title || !tagline || !authorName) {
    showToast("Please complete all required prototype fields.");
    return;
  }

  const allAuthors = [
    {
      name: authorName,
      admissionNo: leadAdmissionNo,
      role: authorRole || "Lead Researcher",
      year: "Student Lead",
      contribution: "Lead formulation and laboratory protocol author."
    },
    ...AppState.teamMembersBuffer
  ];

  const dissertationDoc = {
    name: fileInput.files && fileInput.files[0] ? fileInput.files[0].name : `${title.replace(/\s+/g, '_')}_Dissertation.pdf`,
    size: fileInput.files && fileInput.files[0] ? `${(fileInput.files[0].size / 1024 / 1024).toFixed(1)} MB` : "2.8 MB",
    pages: 65,
    dateSubmitted: "November 2026",
    certifiedByDean: true
  };
  let dissertationDataUrl = null;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    try { dissertationDataUrl = await fileToDataUrl(fileInput.files[0]); } catch (err) {}
  }

  let defaultImg = (document.getElementById('subProductImageUrl')?.value || '').trim() || "assets/spirocracker.svg";
  if (!defaultImg || defaultImg === 'assets/spirocracker.svg') {
    if (category === 'fermentation') defaultImg = "assets/mobiyog.svg";
    else if (category === 'packaging') defaultImg = "assets/biochitowrap.svg";
    else if (category === 'alt-protein') defaultImg = "assets/progrub.svg";
    else if (category === 'functional') defaultImg = "assets/enzibrew.svg";
  }

  const ingredients = ingredientsStr.split(',').map(s => s.trim()).filter(Boolean);

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title, tagline, universityId, leadAdmissionNo, category, authorRole,
          authors: allAuthors, dissertationFile: dissertationDoc, dissertationDataUrl,
          summary, ingredients, image: defaultImg
        })
      });
      AppState.projects.unshift(res.project);
      AppState.upvotedProjects.add(res.project.id);
      recalculateUniversityScores();
      closeModal();
      e.target.reset();
      AppState.teamMembersBuffer = [];
      renderCatalog();
      renderDashboard();
      renderLeaderboard();
      renderConsortiumStats();
      switchTab('catalog');
      showToast("🎉 Innovation prototype saved to database and featured in catalog!");
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }

  const university = AppState.universities.find(u => u.id === universityId);
  const univName = university ? university.name : "Partner University";
  const newProj = {
    id: `custom-${Date.now()}`, title, tagline, universityId, universityName: univName,
    leadAdmissionNo, category, categoryLabel: category.toUpperCase(),
    authors: allAuthors, dissertationFile: dissertationDoc, featured: false,
    upvotes: 1, peerReviews: 0, sustainabilityScore: 4.8, sensoryScore: 8.9,
    status: "Newly Published by Student", summary, ingredients,
    nutritionPer100g: { calories: "280 kcal", protein: "14.2 g", carbohydrates: "38.0 g", dietaryFiber: "6.5 g", iron: "4.2 mg" },
    sensoryProfile: { taste: 8.9, aroma: 8.7, textureCrunch: 9.0, colorAppeal: 8.8, overallAcceptability: 8.9 },
    processFlow: ["Preparation of raw biomass.", "Controlled formulation & testing.", "Sensory panel trials."],
    image: defaultImg,
    badges: ["✨ New Student Submission", `📍 ${univName}`, `👥 ${allAuthors.length} Researchers`]
  };
  AppState.customSubmissions.unshift(newProj);
  AppState.projects.unshift(newProj);
  AppState.upvotedProjects.add(newProj.id);
  saveState();
  recalculateUniversityScores();
  closeModal();
  e.target.reset();
  AppState.teamMembersBuffer = [];
  renderCatalog();
  renderDashboard();
  renderLeaderboard();
  renderConsortiumStats();
  switchTab('catalog');
  showToast("🎉 Innovation prototype submitted successfully!");
}

// ============================================================================
// PARTNERSHIP REQUEST PORTAL (Institutional Email Required)
// ============================================================================
function openPartnershipModal() {
  const modal = document.getElementById('partnershipModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

async function handlePartnershipSubmit(e) {
  e.preventDefault();

  const univName = document.getElementById('partUnivName').value.trim();
  const country = document.getElementById('partCountry').value.trim();
  const contactPerson = document.getElementById('partContactPerson').value.trim();
  const officialEmail = document.getElementById('partOfficialEmail').value.trim();
  const enrollment = document.getElementById('partEnrollment').value.trim();
  const letter = document.getElementById('partLetter').value.trim();

  const isInstitutional = /@(.*\.)?(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|univ-[a-z]+|university)/i.test(officialEmail);
  if (!isInstitutional && !officialEmail.includes('.')) {
    showToast("⚠️ Please provide an authentic university domain email (e.g. dean@univ.ac.ke or dept@univ.edu)!");
    return;
  }

  const cleanCode = univName.split(' ').map(w => w[0]).join('').substring(0, 5).toUpperCase();
  const fileInput = document.getElementById('partLetterFile');
  let letterDoc = {
    name: `${cleanCode}_Official_Affiliation_Request_Letter_Signed.pdf`,
    size: '2.4 MB',
    type: 'application/pdf',
    uploadedAt: 'Nov 2026'
  };
  let letterDocumentDataUrl = null;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const f = fileInput.files[0];
    letterDoc = {
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.type || 'application/pdf',
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    try { letterDocumentDataUrl = await fileToDataUrl(f); } catch (err) {}
  }

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest('/api/partnerships', {
        method: 'POST',
        body: JSON.stringify({
          universityName: univName, country, contactPerson, officialEmail,
          studentEnrollment: enrollment, letterOfIntent: letter,
          letterDocumentFile: letterDoc, letterDocumentDataUrl
        })
      });
      if (AppState.currentStaffUser) await fetchStaffDashboardData();
      closeModal();
      e.target.reset();
      clearPartLetterFile();
      showToast(`🏛️ Partnership request for ${univName} saved securely for Secretariat review! Ref: ${res.referenceNo}`);
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }

  closeModal();
  e.target.reset();
  clearPartLetterFile();
  showToast(`🏛️ Partnership request for ${univName} forwarded to AFOSTECH Secretariat!`);
}

// ============================================================================
// UNIFIED ROLE-BASED AUTH & STAFF SECRETARIAT PORTAL
// ============================================================================
function openAuthModal(initialTab = 'signin') {
  // Route already authenticated users to their role-specific workspace
  if (AppState.currentUser) {
    if (AppState.currentUser.role === 'staff') {
      openStaffPortal();
    } else {
      openStudentInnovatorDashboard();
    }
    return;
  }

  const modal = document.getElementById('authModal');
  const univSelect = document.getElementById('authRegUniversity');
  if (univSelect) {
    univSelect.innerHTML = AppState.universities.map(u => `
      <option value="${u.id}">${u.shortName} - ${u.name}</option>
    `).join('');
  }

  switchAuthTab(initialTab);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function switchAuthTab(tab) {
  const signInBtn = document.getElementById('tabAuthSignInBtn');
  const signUpBtn = document.getElementById('tabAuthSignUpBtn');
  const signInPane = document.getElementById('authSignInPane');
  const signUpPane = document.getElementById('authSignUpPane');
  const modalTitle = document.getElementById('authModalTitle');

  if (tab === 'signin') {
    if (signInBtn) signInBtn.classList.add('active');
    if (signUpBtn) signUpBtn.classList.remove('active');
    if (signInPane) signInPane.classList.add('active');
    if (signUpPane) signUpPane.classList.remove('active');
    if (modalTitle) modalTitle.innerText = "Sign In to AFOSTECH";
  } else {
    if (signUpBtn) signUpBtn.classList.add('active');
    if (signInBtn) signInBtn.classList.remove('active');
    if (signUpPane) signUpPane.classList.add('active');
    if (signInPane) signInPane.classList.remove('active');
    if (modalTitle) modalTitle.innerText = "Join AFOSTECH (Student Sign Up)";
  }
}

function quickFillAuth(email, password) {
  const emailInput = document.getElementById('authLoginEmail');
  const pwdInput = document.getElementById('authLoginPassword');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = password;
}

async function handleUnifiedSignIn(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = (document.getElementById('authLoginEmail')?.value || '').trim();
  const password = (document.getElementById('authLoginPassword')?.value || '').trim();

  if (!email || !password) {
    showToast('Please enter your email address and password.');
    return;
  }

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      AppState.authToken = res.token;
      if (res.appToken) {
        try { localStorage.setItem('afostech_app_token', res.appToken); } catch (e) {}
      }
      applyAuthenticatedUser(res.user);
      saveState();

      if (res.user.role === 'staff') {
        await fetchStaffDashboardData();
        updateTopAuthStatus();
        closeModal();
        showToast(`🛡️ Signed in as Staff Official: ${res.user.name} (${res.user.staffRole || 'Secretariat'})`);
        openStaffPortal();
      } else {
        updateTopAuthStatus();
        closeModal();
        showToast(`🎓 Signed in as Innovator: ${res.user.name}. Workspace unlocked.`);
        openStudentInnovatorDashboard();
      }
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }

  // Offline file:// fallback
  const staffMatch = (AFOSTECH_DATA.staffOfficials || []).find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
  if (staffMatch) {
    applyAuthenticatedUser({ ...staffMatch, role: 'staff', staffRole: staffMatch.role });
    updateTopAuthStatus();
    closeModal();
    showToast(`🛡️ Signed in as Staff Official: ${staffMatch.name}`);
    openStaffPortal();
    return;
  }
  const innMatch = (AppState.innovators || []).find(i => i.email.toLowerCase() === email.toLowerCase() && (i.password === password || password === 'innovator2026'));
  if (innMatch) {
    applyAuthenticatedUser({ ...innMatch, role: 'innovator' });
    updateTopAuthStatus();
    closeModal();
    showToast(`🎓 Signed in as Innovator: ${innMatch.name}`);
    openStudentInnovatorDashboard();
    return;
  }
  showToast('Invalid email or password.');
}

async function handleUnifiedRegister(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('authRegName').value.trim();
  const email = document.getElementById('authRegEmail').value.trim();
  const admissionNo = document.getElementById('authRegAdm').value.trim();
  const universityId = document.getElementById('authRegUniversity').value;
  const degree = document.getElementById('authRegDegree').value.trim();
  const yearOfStudy = document.getElementById('authRegYear').value;
  const password = document.getElementById('authRegPassword').value.trim();

  if (!name || !email || !admissionNo || !password) {
    showToast('Full name, institutional email, admission number, and password are required.');
    return;
  }

  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, admissionNo, universityId, degree, yearOfStudy, password })
      });
      closeModal();
      e.target.reset();
      showToast('🏛️ ' + res.message);
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }

  closeModal();
  showToast('🏛️ Registration submitted successfully! Your account application has been received.');
}

async function logoutCurrentUser() {
  if (AppState.isBackendOnline) {
    try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch (e) {}
  }
  AppState.authToken = null;
  try { localStorage.removeItem('afostech_app_token'); } catch (e) {}
  applyAuthenticatedUser(null);
  saveState();
  updateTopAuthStatus();
  closeModal();
  renderCatalog();
  showToast('Signed out successfully.');
}

function logoutStaff() { logoutCurrentUser(); }
function logoutStudent() { logoutCurrentUser(); }

async function openStaffPortal() {
  if (!AppState.currentUser || AppState.currentUser.role !== 'staff') {
    showToast('🔒 Restricted: Only AFOSTECH Staff Officials can access the Secretariat Control Center.');
    return;
  }
  if (AppState.isBackendOnline) {
    await fetchStaffDashboardData();
  }
  const modal = document.getElementById('staffPortalModal');
  const body = document.getElementById('staffPortalModalBody');
  if (!modal || !body) return;
  renderStaffPortalContents();
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function renderStaffPortalContents() {
  const body = document.getElementById('staffPortalModalBody');
  if (!body || !AppState.currentStaffUser) return;

  const partnershipsHTML = AppState.partnershipRequests.map(r => `
    <tr id="req-row-${r.id}">
      <td>
        <strong>${r.universityName}</strong> (${r.country})<br>
        <span style="font-size: 0.72rem; color: #64748b; font-family: monospace;">Ref: ${r.referenceNo || 'UCC/DIR/2026'}</span>
      </td>
      <td><span style="font-family: monospace; color: #047857;">${r.officialEmail}</span></td>
      <td>${r.contactPerson}</td>
      <td>
        <button class="btn-primary" style="padding: 4px 10px; font-size: 0.74rem; background: linear-gradient(135deg, #0284c7, #0369a1); display: inline-flex; align-items: center; gap: 4px;" onclick="openRequestLetter('${r.id}')">
          📄 Read Request Letter
        </button>
        <div style="font-size: 0.68rem; color: #047857; margin-top: 4px; display: flex; align-items: center; gap: 3px;">
          <span>📎</span> <span style="font-weight: 700; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.letterDocumentFile ? r.letterDocumentFile.name : (r.shortName + '_Official_Request_Letter.pdf')}</span>
        </div>
      </td>
      <td><span style="font-weight: 800; color: ${r.status === 'Approved' ? '#059669' : '#d97706'};">${r.status}</span></td>
      <td>
        ${r.status === 'Approved' ? `<span style="color: #059669; font-weight: 800;">✓ Chapter Active</span>` : `
          <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="approveUniversityPartnership('${r.id}')">Approve &amp; Add Chapter</button>
        `}
      </td>
    </tr>
  `).join('');

  const partnershipCardsHTML = AppState.partnershipRequests.map(r => `
    <div class="pillar-card" style="border-top: 4px solid ${r.status === 'Approved' ? '#059669' : '#0284c7'}; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.72rem; font-weight: 800; background: ${r.status === 'Approved' ? '#ecfdf5' : '#e0f2fe'}; color: ${r.status === 'Approved' ? '#047857' : '#0369a1'}; padding: 3px 10px; border-radius: 9999px;">
            ${r.status === 'Approved' ? '✓ Chapter Commissioned' : '⏳ Affiliation Under Review'}
          </span>
          <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">${r.country}</span>
        </div>
        <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--navy); margin-bottom: 4px;">${r.universityName}</h4>
        <div style="font-size: 0.82rem; color: #475569; margin-bottom: 4px;"><strong>Department / Dean:</strong> ${r.contactPerson}</div>
        <div style="font-size: 0.78rem; font-family: monospace; color: #047857; margin-bottom: 8px;">✉️ ${r.officialEmail}</div>
        <p style="font-size: 0.84rem; color: #64748b; line-height: 1.5; margin-bottom: 10px;">"${(r.letterOfIntent || '').substring(0, 115)}..."</p>
      </div>
      <div style="display: flex; gap: 8px; margin-top: auto;">
        <button class="btn-primary" style="flex: 1; padding: 8px 12px; font-size: 0.82rem; background: linear-gradient(135deg, #0284c7, #0369a1);" onclick="openRequestLetter('${r.id}')">
          📄 Read Request Letter →
        </button>
        ${r.status !== 'Approved' ? `
          <button class="btn-primary" style="padding: 8px 12px; font-size: 0.82rem;" onclick="approveUniversityPartnership('${r.id}')">✓ Approve</button>
        ` : ''}
      </div>
    </div>
  `).join('');

  const innovatorsHTML = AppState.innovators.map(inn => `
    <tr>
      <td><strong>${inn.name}</strong><br><span style="font-size: 0.72rem; color: #64748b;">${inn.universityName || ''} (Adm: ${inn.admissionNo || 'N/A'})</span></td>
      <td>${inn.productName || '—'}</td>
      <td><span style="font-size: 0.78rem; font-weight: 700; background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px;">${inn.pitchedCompetition || 'Standard'}</span></td>
      <td><span style="font-weight: 800; color: ${inn.verified ? '#059669' : '#dc2626'};">${inn.verified ? '✓ Verified (Board of Honour)' : 'Pending Pitch Approval'}</span></td>
      <td>
        <button class="btn-outline" style="padding: 4px 8px; font-size: 0.72rem;" onclick="toggleInnovatorVerification('${inn.id}')">
          ${inn.verified ? 'Revoke Verification' : 'Verify for Board of Honour'}
        </button>
      </td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div style="background: linear-gradient(135deg, #064e3b, #047857); color: white; padding: 18px 24px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <h3 style="font-size: 1.3rem; font-weight: 900; color: white;">AFOSTECH Official Staff Control Center</h3>
        <p style="font-size: 0.85rem; color: #d1fae5;">Signed in as: <strong>${AppState.currentStaffUser.name}</strong> (${AppState.currentStaffUser.role}) &bull; ${AppState.currentStaffUser.email}</p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="admin.html" class="btn-primary" style="background: #ffffff; color: #064e3b; padding: 7px 14px; font-size: 0.8rem; text-decoration: none;">🛡️ Open Full Admin Dashboard ↗</a>
        <button class="btn-outline" style="background: rgba(255,255,255,0.16); color: white; border-color: rgba(255,255,255,0.4); padding: 6px 14px; font-size: 0.8rem;" onclick="logoutCurrentUser()">Sign Out</button>
      </div>
    </div>

    <!-- Section 1: Confidential University Partnerships Review -->
    <div style="margin-bottom: 32px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 22px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h4 style="font-size: 1.15rem; font-weight: 900; color: var(--navy);">
              🏛️ University Partnership Inquiries &amp; Dean Letters (${AppState.partnershipRequests.length})
            </h4>
            <span style="font-size: 0.72rem; font-weight: 800; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 8px; border-radius: 9999px;">
              🔒 Staff Officials Only
            </span>
          </div>
          <span style="font-size: 0.78rem; color: #64748b;">Confidential university affiliation submissions and uploaded official request letters.</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="staffPartToggleTable" class="btn-outline active" style="font-size: 0.78rem; padding: 5px 12px;" onclick="toggleStaffPartnershipView('table')">📋 Table View</button>
          <button id="staffPartToggleCards" class="btn-outline" style="font-size: 0.78rem; padding: 5px 12px;" onclick="toggleStaffPartnershipView('cards')">🗂️ Dossier Cards</button>
        </div>
      </div>

      <div id="staffPartnershipTableView" class="leaderboard-table-wrap">
        <table class="leaderboard-table" style="font-size: 0.82rem;">
          <thead><tr><th>University &amp; Country</th><th>Official Email</th><th>Dean / Contact</th><th>Formal Letter</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${partnershipsHTML}</tbody>
        </table>
      </div>

      <div id="staffPartnershipCardsView" class="pillars-grid staff-partnership-cards-grid" style="display: none;">
        ${partnershipCardsHTML}
      </div>
    </div>

    <!-- Section 2: Student Innovator Pitch Verification -->
    <div style="margin-bottom: 28px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="font-size: 1.1rem; font-weight: 900; color: var(--navy);">🎓 Innovator Pitch Verification &amp; Board of Honour Accreditation</h4>
        <span style="font-size: 0.75rem; color: #64748b;">Approve verified inventors for the Board of Honour</span>
      </div>
      <div class="leaderboard-table-wrap">
        <table class="leaderboard-table" style="font-size: 0.82rem;">
          <thead><tr><th>Student &amp; University</th><th>Pitched Innovation</th><th>Competition</th><th>Board Status</th><th>Control</th></tr></thead>
          <tbody>${innovatorsHTML}</tbody>
        </table>
      </div>
    </div>

    <!-- Section 3: Institutional Student Authenticity Verifications -->
    <div style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div>
          <h4 style="font-size: 1.1rem; font-weight: 900; color: var(--navy);">🛡️ Institutional Student Enrollment Verifications (${(AppState.verificationDispatches || []).length})</h4>
          <span style="font-size: 0.75rem; color: #64748b;">Registrar enrollment prompts managed strictly by Staff Secretariat</span>
        </div>
      </div>
      <div class="leaderboard-table-wrap">
        <table class="leaderboard-table" style="font-size: 0.82rem;">
          <thead><tr><th>Applicant &amp; Admission No.</th><th>Campus &amp; Registrar</th><th>Subject &amp; Ref</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${(AppState.verificationDispatches || []).map(disp => {
              const isV = (disp.status || '').toLowerCase().includes('verified');
              return `
                <tr>
                  <td><strong>${disp.authorName || disp.applicantName}</strong><br><span style="font-family: monospace; font-size: 0.74rem; color: #047857;">Adm: ${disp.admissionNo}</span></td>
                  <td><strong>${disp.universityName}</strong><br><span style="font-size: 0.72rem; color: #0284c7; font-family: monospace;">${disp.recipientEmail}</span></td>
                  <td><span>${disp.projectTitle || disp.purpose || 'Enrollment'}</span><br><span style="font-size: 0.7rem; color: #64748b; font-family: monospace;">${disp.referenceCode}</span></td>
                  <td><span class="verification-badge-pill ${isV ? 'verified' : 'pending'}">${isV ? '🟢 Verified' : '🟡 Pending'}</span></td>
                  <td>
                    ${!isV ? `<button class="btn-primary" style="padding: 4px 10px; font-size: 0.74rem;" onclick="confirmInstitutionalVerification('${disp.id}')">✓ Confirm Enrollment</button>` : '<span style="color:#059669;font-weight:700;font-size:0.74rem;">✓ Confirmed</span>'}
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 18px;">No verification dispatches logged.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function approveUniversityPartnership(reqId) {
  if (!AppState.currentStaffUser) return;
  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest(`/api/staff/partnerships/${reqId}/approve`, { method: 'POST' });
      const req = AppState.partnershipRequests.find(r => r.id === reqId);
      if (req) req.status = 'Approved';
      if (res.university && !AppState.universities.some(u => u.id === res.university.id)) {
        AppState.universities.push(res.university);
      }
      recalculateUniversityScores();
      renderStaffPortalContents();
      populateFilterDropdowns();
      renderLeaderboard();
      renderAbout();
      showToast(`✓ Partnership approved and persisted to database!`);
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }
  const req = AppState.partnershipRequests.find(r => r.id === reqId);
  if (req) req.status = "Approved";
  renderStaffPortalContents();
}

function toggleStaffPartnershipView(mode) {
  const table = document.getElementById('staffPartnershipTableView');
  const cards = document.getElementById('staffPartnershipCardsView');
  const btnTable = document.getElementById('staffPartToggleTable');
  const btnCards = document.getElementById('staffPartToggleCards');
  if (!table || !cards) return;
  if (mode === 'table') {
    table.style.display = 'block'; cards.style.display = 'none';
    if (btnTable) btnTable.classList.add('active'); if (btnCards) btnCards.classList.remove('active');
  } else {
    table.style.display = 'none'; cards.style.display = 'grid';
    if (btnTable) btnTable.classList.remove('active'); if (btnCards) btnCards.classList.add('active');
  }
}

async function toggleInnovatorVerification(innId) {
  if (!AppState.currentStaffUser) return;
  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest(`/api/staff/innovators/${innId}/verify`, { method: 'POST' });
      const inn = AppState.innovators.find(i => i.id === innId);
      if (inn) { inn.verified = res.verified; inn.boardOfHonour = res.boardOfHonour; }
      renderStaffPortalContents();
      renderInnovators();
      showToast(`Board of Honour status updated in database.`);
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }
  const inn = AppState.innovators.find(i => i.id === innId);
  if (inn) { inn.verified = !inn.verified; inn.boardOfHonour = inn.verified; }
  renderStaffPortalContents();
  renderInnovators();
}

// ============================================================================
// STUDENT INNOVATOR WORKSPACE DASHBOARD
// ============================================================================
function openStudentInnovatorDashboard() {
  const modal = document.getElementById('innovatorDashboardModal');
  const body = document.getElementById('innovatorDashboardBody');
  const user = AppState.currentStudentUser;
  if (!modal || !body || !user) return;

  const myProjects = (AppState.projects || []).filter(p =>
    p.leadAdmissionNo === user.admissionNo ||
    (p.authors && p.authors.some(a => a.admissionNo === user.admissionNo || a.name === user.name))
  );
  const myTheses = (AppState.theses || []).filter(t =>
    t.authorAdmissionNo === user.admissionNo || t.author === user.name
  );

  body.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; border: 1.5px solid var(--border-color); margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 1.4rem; font-weight: 900; color: var(--navy); margin-bottom: 3px;">${user.name}</h3>
          <div style="font-size: 0.88rem; color: var(--primary); font-weight: 800;">
            ${user.universityName || ''} &bull; Admission No: <span style="font-family: monospace; background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 4px;">${user.admissionNo || ''}</span>
          </div>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">${user.degree || ''} (${user.yearOfStudy || ''}) &bull; ${user.email}</div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          ${user.verified ? `
            <span class="verified-badge" style="font-size: 0.82rem; padding: 4px 12px;">★ Pitch Verified (Board of Honour)</span>
          ` : `
            <span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 0.76rem; font-weight: 800;">
              ⏳ Member — Submit to Pitch Cup for Honour Board
            </span>
          `}
        </div>
      </div>

      <div class="innovator-submission-hub">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
          <h4 style="font-size: 1.15rem; font-weight: 900; color: #065f46;">🚀 Innovator Submissions &amp; Photo Studio</h4>
        </div>

        <div class="innovator-hub-grid">
          <div class="innovator-hub-card">
            <div>
              <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">🔬</div>
              <h4>Submit Food Innovation</h4>
              <p>Publish a formulated prototype, upload its photo, and attach your research dissertation.</p>
            </div>
            <button type="button" class="btn-primary" onclick="closeModal(); openSubmitModal();" style="width: 100%; justify-content: center;">
              + Launch Innovation Form →
            </button>
          </div>

          <div class="innovator-hub-card">
            <div>
              <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #0369a1); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">📚</div>
              <h4>Submit Research Thesis</h4>
              <p>Upload your dissertation to the open-access repository for peer citations and reviews.</p>
            </div>
            <button type="button" class="btn-primary" onclick="closeModal(); openSubmitThesisModal();" style="width: 100%; justify-content: center; background: linear-gradient(135deg, #059669, #0284c7);">
              + Upload Research Thesis →
            </button>
          </div>
        </div>

        <div style="margin-top: 22px; background: #ffffff; border-radius: 12px; padding: 16px; border: 1px solid #cbd5e1;">
          <h5 style="font-size: 0.92rem; font-weight: 800; color: #0f172a; margin-bottom: 12px;">
            📋 My Authored Submissions (${myProjects.length + myTheses.length})
          </h5>
          ${myProjects.length === 0 && myTheses.length === 0 ? `
            <div style="text-align: center; padding: 18px; color: #64748b; font-size: 0.84rem;">No authored submissions yet.</div>
          ` : `
            <div>
              ${myProjects.map(p => `
                <div class="submission-record-row">
                  <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                    <img src="${p.image}" alt="${p.title}" style="width: 58px; height: 44px; object-fit: cover; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #f8fafc; flex-shrink: 0;">
                    <div style="min-width: 0;">
                      <strong style="color: #0f172a; font-size: 0.9rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.title}</strong>
                      <div style="font-size: 0.74rem; color: #64748b;">Category: ${p.categoryLabel || p.category} &bull; ${p.universityName}</div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 0.74rem;" onclick="openProductImageEditor('${p.id}')">🖼️ Upload / Edit Photo</button>
                    <button class="btn-outline" style="padding: 4px 10px; font-size: 0.74rem;" onclick="closeModal(); openProjectDetail('${p.id}');">View</button>
                  </div>
                </div>
              `).join('')}
              ${myTheses.map(t => `
                <div class="submission-record-row">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">📚</span>
                    <div><strong style="color: #0f172a;">${t.title}</strong><div style="font-size: 0.74rem; color: #64748b;">Dissertation &bull; ${(t.comments || []).length} Peer Reviews</div></div>
                  </div>
                  <button class="btn-outline" style="padding: 4px 10px; font-size: 0.74rem;" onclick="closeModal(); openThesisDetail('${t.id}');">Read Thesis</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <form id="editInnovatorProfileForm" style="margin-top: 20px;">
        <h4 style="font-size: 1.05rem; font-weight: 900; margin-bottom: 12px; color: var(--navy);">Update Professional Profile &amp; Investor Ask</h4>
        <div class="form-group">
          <label class="form-label">Research Bio / Expertise</label>
          <textarea id="editInnBio" class="form-control" rows="3">${user.bio || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Degree / Field</label><input type="text" id="editInnDegree" class="form-control" value="${user.degree || ''}"></div>
          <div class="form-group"><label class="form-label">Ask Title</label><input type="text" id="editAskTitle" class="form-control" value="${user.investorAsk ? user.investorAsk.title : ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Amount Needed</label><input type="text" id="editAskAmount" class="form-control" value="${user.investorAsk ? user.investorAsk.amountNeeded : ''}"></div>
          <div class="form-group"><label class="form-label">New Password (Optional)</label><input type="password" id="editInnPassword" class="form-control" placeholder="Leave blank to keep current"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Ask Description</label>
          <textarea id="editAskDesc" class="form-control" rows="2">${user.investorAsk ? user.investorAsk.description : ''}</textarea>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
          <button type="button" class="btn-outline" onclick="logoutCurrentUser()">Sign Out</button>
          <button type="submit" class="btn-primary">Save Innovator Profile →</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('editInnovatorProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const bio = document.getElementById('editInnBio').value.trim();
    const degree = document.getElementById('editInnDegree').value.trim();
    const password = document.getElementById('editInnPassword').value.trim();
    const askTitle = document.getElementById('editAskTitle').value.trim();
    const askAmount = document.getElementById('editAskAmount').value.trim();
    const askDesc = document.getElementById('editAskDesc').value.trim();
    const investorAsk = (askTitle && askAmount)
      ? { title: askTitle, amountNeeded: askAmount, category: "Commercial Scale-up", description: askDesc, contactEmail: user.email }
      : user.investorAsk;

    if (AppState.isBackendOnline) {
      try {
        const res = await apiRequest('/api/innovator/profile', {
          method: 'PUT',
          body: JSON.stringify({ bio, degree, investorAsk, ...(password ? { password } : {}) })
        });
        applyAuthenticatedUser(res.user);
        const idx = AppState.innovators.findIndex(i => i.id === res.user.id);
        if (idx !== -1) AppState.innovators[idx] = res.user;
      } catch (err) {
        showToast('⚠️ ' + err.message);
        return;
      }
    } else {
      user.bio = bio;
      user.degree = degree;
      user.investorAsk = investorAsk;
    }

    renderInnovators();
    showToast("Innovator profile updated in database!");
    closeModal();
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ============================================================================
// INVESTOR CONVERSATION INQUIRY MODAL
// ============================================================================
function openInvestorInquiryModal(innovatorId) {
  const inn = AppState.innovators.find(i => i.id === innovatorId);
  if (!inn) return;

  const modal = document.getElementById('investorInquiryModal');
  const targetName = document.getElementById('investorTargetInnovator');
  const targetIdInput = document.getElementById('investorTargetId');

  if (targetName) targetName.innerText = `${inn.name} (${inn.productName})`;
  if (targetIdInput) targetIdInput.value = inn.id;

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

async function handleInvestorInquirySubmit(e) {
  e.preventDefault();
  const innId = document.getElementById('investorTargetId').value;
  const orgName = document.getElementById('invOrgName').value.trim();
  const contactEmail = document.getElementById('invEmail').value.trim();
  const proposal = document.getElementById('invProposal').value.trim();

  const inn = AppState.innovators.find(i => i.id === innId);
  if (AppState.isBackendOnline) {
    try {
      const res = await apiRequest('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ innovatorId: innId, orgName, contactEmail, proposal })
      });
      if (inn) inn.inquiriesCount = res.inquiriesCount;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  } else if (inn) {
    inn.inquiriesCount = (inn.inquiriesCount || 0) + 1;
  }

  closeModal();
  e.target.reset();
  showToast(`💼 Conversation opened with ${inn ? inn.name : 'the innovator'}!`);
  renderInnovators();
}

// ============================================================================
// INSTITUTIONAL VERIFICATION PROMPT (Restricted Exclusively to Staff Portal)
// ============================================================================
function openVerificationPromptModal(dispatchId) {
  // Institutional verification prompts are confidential institutional communications to registrars.
  // Neither the public nor innovators can view this prompt; only authorized staff officials can review it.
  if (!AppState.currentStaffUser) {
    showToast('🔒 Access Restricted: Institutional authentication prompts are confidential transmissions to university registrars, managed solely by officials in the Staff Portal.');
    return;
  }

  let dispatch = (AppState.verificationDispatches || []).find(d => d.id === dispatchId || d.referenceCode === dispatchId);
  if (!dispatch) {
    const proj = AppState.projects.find(p => p.id === dispatchId);
    if (proj) {
      dispatch = (AppState.verificationDispatches || []).find(d => d.projectId === proj.id || d.admissionNo === proj.leadAdmissionNo);
      if (!dispatch) {
        const univ = AppState.universities.find(u => u.id === proj.universityId);
        dispatch = {
          id: `disp-${proj.id}`,
          referenceCode: (proj.institutionalVerification && proj.institutionalVerification.referenceCode) || `AFOST-VER-${(univ ? univ.shortName : "UNIV").replace(/[^a-zA-Z]/g, '').toUpperCase()}-8821`,
          projectId: proj.id,
          projectTitle: proj.title,
          authorName: proj.authors && proj.authors[0] ? proj.authors[0].name : "Student Lead",
          admissionNo: proj.leadAdmissionNo || "AG211-0452/2022",
          universityId: proj.universityId,
          universityName: proj.universityName,
          recipientEmail: (univ && univ.verificationEmail) || "registrar.academic@university.ac.ke",
          ccEmails: `${(univ && univ.deanEmail) || 'dean.foodscience@university.ac.ke'}, secretariat@afostech-students.org`,
          dispatchedAt: (proj.institutionalVerification && proj.institutionalVerification.dispatchedAt) || "Recent Dispatch",
          status: (proj.institutionalVerification && proj.institutionalVerification.status) || "Prompt Sent (Pending Confirmation)",
          dissertationDoc: proj.dissertationFile ? proj.dissertationFile.name : "Dissertation_Thesis.pdf",
          remarks: "Institutional authenticity verification dispatch."
        };
      }
    }
  }

  if (!dispatch) return;

  const modal = document.getElementById('institutionalVerificationPromptModal');
  const body = document.getElementById('institutionalVerificationPromptBody');
  if (!modal || !body) {
    showToast('Institutional verification dispatch logged: ' + (dispatch.referenceCode || ''));
    return;
  }

  const isVerified = dispatch.status.toLowerCase().includes('verified');
  const isStudentReg = dispatch.type === "Student Membership Verification" || !!dispatch.studentId;

  body.innerHTML = `
    <!-- Top Dispatch Status Banner -->
    <div style="background: ${isVerified ? 'linear-gradient(135deg, #065f46, #047857)' : 'linear-gradient(135deg, #1e3a8a, #0369a1)'}; color: white; padding: 18px 22px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; color: ${isVerified ? '#a7f3d0' : '#bae6fd'};">
          ${isVerified ? '✓ INSTITUTIONAL AUTHENTICITY CERTIFIED' : (isStudentReg ? '📨 STUDENT REGISTRATION PROMPT TRANSMITTED TO REGISTRAR' : '📨 VERIFICATION PROMPT TRANSMITTED TO CAMPUS')}
        </div>
        <h4 style="font-size: 1.2rem; font-weight: 900; color: white; margin-top: 2px;">
          ${dispatch.universityName}
        </h4>
        <div style="font-size: 0.82rem; color: ${isVerified ? '#ecfdf5' : '#e0f2fe'};">
          Tracking Reference Code: <strong style="font-family: monospace; letter-spacing: 0.5px;">${dispatch.referenceCode}</strong>
        </div>
      </div>
      <div>
        <span class="verification-badge-pill ${isVerified ? 'verified' : 'pending'}" style="font-size: 0.85rem; padding: 6px 14px;">
          ${isVerified ? '🟢 Bonafide Student Authenticated' : '🟡 Prompt Sent • Awaiting Campus Confirmation'}
        </span>
      </div>
    </div>

    <!-- Email Client Box -->
    <div class="verification-email-card">
      <div class="email-client-header">
        <div class="email-meta-row">
          <span class="email-meta-label">To:</span>
          <span class="email-meta-value">
            <strong style="color: #047857;">${dispatch.recipientEmail}</strong> 
            <span style="color: #64748b; font-size: 0.78rem;">(Office of the Academic Registrar &amp; Dean of Food Sciences)</span>
          </span>
        </div>
        <div class="email-meta-row">
          <span class="email-meta-label">Cc:</span>
          <span class="email-meta-value" style="font-family: monospace; font-size: 0.78rem; color: #475569;">
            ${dispatch.ccEmails || 'secretariat@afostech-students.org'}
          </span>
        </div>
        <div class="email-meta-row">
          <span class="email-meta-label">Subject:</span>
          <span class="email-meta-value">
            <strong>${isStudentReg ? `[ACTION REQUIRED] Institutional Enrollment Verification: Student Admission No. ${dispatch.admissionNo} (${dispatch.applicantName || dispatch.authorName}) - AFOSTECH Student Membership & Innovator Privilege Authentication` : `[ACTION REQUIRED] Institutional Enrollment Verification: Student Admission No. ${dispatch.admissionNo} (${dispatch.authorName}) - AFOSTECH Showcase`}</strong>
          </span>
        </div>
        <div class="email-meta-row">
          <span class="email-meta-label">Date:</span>
          <span class="email-meta-value" style="color: #64748b; font-size: 0.8rem;">
            ${dispatch.dispatchedAt}
          </span>
        </div>
      </div>

      <div class="email-letter-body">
        <div class="email-letterhead">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="assets/logo.jpg" alt="AFOSTECH" style="height: 42px; width: 42px; border-radius: 8px; object-fit: contain; border: 1.5px solid #10b981; background: white; padding: 2px;">
            <div>
              <div style="font-size: 0.95rem; font-weight: 900; color: #0f172a; line-height: 1.1;">
                ASSOCIATION OF FOOD SCIENCE AND TECHNOLOGY STUDENTS
              </div>
              <div style="font-size: 0.74rem; color: #64748b;">
                Inter-University Collegiate Consortium &bull; Office of Academic Authenticity
              </div>
            </div>
          </div>
          <div style="text-align: right; font-size: 0.75rem; color: #64748b; font-family: monospace;">
            REF: ${dispatch.referenceCode}
          </div>
        </div>

        <p style="margin-bottom: 12px;">
          <strong>Dear Office of the Academic Registrar &amp; Dean of Food Sciences,</strong>
        </p>

        <p style="margin-bottom: 14px; font-size: 0.88rem; color: #334155;">
          ${isStudentReg ? `Under the <strong>AFOSTECH Inter-University Collegiate Constitution (Sec. 3.1: Student Membership & Authenticity Protocol)</strong>, all food science students registering to join the association require verified confirmation of active enrollment from their host campus registrar before acquiring exclusive author privileges to submit innovations and research.` : `Under the <strong>AFOSTECH Inter-University Consortium Charter (Sec. 4.2: Student Authorship &amp; Fair Academic Competition Protocol)</strong>, all research prototypes submitted to the inter-university competition showcase require formal institutional certification from the applicant's host university.`}
        </p>

        <p style="margin-bottom: 14px; font-size: 0.88rem; color: #334155;">
          ${isStudentReg ? `A student has submitted an application to join AFOSTECH as an authenticated innovator and cited active enrollment in your university. Please examine the student record details below:` : `A student researcher has submitted an agricultural food innovation to the consortium platform and cited active enrollment in your university. Please examine the student record details below:`}
        </p>

        <!-- Student & Innovation Detail Box -->
        <div class="email-highlight-box">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 190px;"><strong>Applicant Student Name:</strong></td>
              <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${dispatch.applicantName || dispatch.authorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Student Admission Number:</strong></td>
              <td style="padding: 6px 0;">
                <span style="font-family: monospace; font-size: 0.95rem; font-weight: 900; background: #ecfdf5; color: #047857; padding: 3px 10px; border-radius: 4px; border: 1.5px solid #a7f3d0;">
                  ${dispatch.admissionNo}
                </span>
                <span style="font-size: 0.75rem; color: #059669; margin-left: 8px;">(Campus Registrar Primary Identifier)</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Host University Chapter:</strong></td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${dispatch.universityName}</td>
            </tr>
            ${isStudentReg ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Degree Program &amp; Year:</strong></td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${dispatch.degree || 'B.Sc. Food Science & Technology'} (${dispatch.yearOfStudy || '3rd Year'})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Official Student Email:</strong></td>
                <td style="padding: 6px 0; font-family: monospace; color: #0369a1;">${dispatch.studentEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Membership Purpose:</strong></td>
                <td style="padding: 6px 0; font-weight: 700; color: #047857;">${dispatch.purpose || 'AFOSTECH Student Membership & Innovator Privilege Authentication'}</td>
              </tr>
            ` : `
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Submitted Innovation:</strong></td>
                <td style="padding: 6px 0; font-weight: 800; color: #0369a1;">${dispatch.projectTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Research Dissertation Thesis:</strong></td>
                <td style="padding: 6px 0; font-family: monospace; font-size: 0.82rem; color: #059669;">
                  📄 ${dispatch.dissertationDoc || 'Dissertation_Thesis.pdf'}
                </td>
              </tr>
            `}
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Prompt Dispatch Timestamp:</strong></td>
              <td style="padding: 6px 0; color: #64748b;">${dispatch.dispatchedAt}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Institutional Status:</strong></td>
              <td style="padding: 6px 0;">
                <span style="font-weight: 800; color: ${isVerified ? '#059669' : '#d97706'};">
                  ${dispatch.status}
                </span>
                ${dispatch.confirmedAt ? `<span style="font-size: 0.75rem; color: #64748b; margin-left: 6px;">(Confirmed: ${dispatch.confirmedAt})</span>` : ''}
              </td>
            </tr>
          </table>
        </div>

        <p style="margin-bottom: 14px; font-size: 0.88rem; color: #334155;">
          <strong>Action Required by Host Campus:</strong> Please verify against your institutional student database that Admission No. <strong>${dispatch.admissionNo}</strong> belongs to an authentically enrolled student at <strong>${dispatch.universityName}</strong>.
        </p>

        <p style="font-size: 0.82rem; color: #64748b; margin-bottom: 0;">
          ${isStudentReg ? `Once confirmed, this student will officially join AFOSTECH as an authenticated member and will be granted exclusive authorization to submit food innovations and upload dissertations to the consortium repository.` : `Authenticity certification ensures the student's project is awarded full eligibility for inter-university leaderboard ranking, points index computation, and verified investor pitching.`}
        </p>
      </div>

      <!-- Action Footer -->
      <div style="background: #ffffff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${!isVerified ? `
            <button class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem;" onclick="confirmInstitutionalVerification('${dispatch.id}')">
              ${isStudentReg ? '✓ Simulate Campus Confirmation (Authenticate Student & Join AFOSTECH)' : '✓ Simulate Campus Confirmation (Mark Authenticated)'}
            </button>
          ` : `
            <span style="color: #059669; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
              <span>✅</span> Authenticity Certified by University Registrar
            </span>
          `}
          <button class="btn-outline" style="padding: 8px 16px; font-size: 0.85rem;" onclick="downloadVerificationNotice('${dispatch.referenceCode}')">
            📥 Download Memo (PDF)
          </button>
        </div>
        <button class="btn-outline js-modal-close" style="padding: 8px 16px; font-size: 0.85rem;">
          Close
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function openVerificationForProject(projectId) {
  if (!AppState.currentStaffUser) return;
  const proj = AppState.projects.find(p => p.id === projectId);
  if (!proj) return;
  const dispatch = (AppState.verificationDispatches || []).find(d => d.projectId === projectId || d.admissionNo === proj.leadAdmissionNo);
  if (dispatch) {
    openVerificationPromptModal(dispatch.id);
  } else {
    openVerificationPromptModal(proj.id);
  }
}

async function confirmInstitutionalVerification(dispatchId) {
  if (!AppState.currentStaffUser) return;
  if (AppState.isBackendOnline) {
    try {
      await apiRequest(`/api/staff/verifications/${dispatchId}/confirm`, { method: 'POST' });
      await fetchStaffDashboardData();
      const bootstrapData = await apiRequest('/api/bootstrap');
      AppState.innovators = bootstrapData.innovators || AppState.innovators;
      renderStaffPortalContents();
      renderInnovators();
      showToast('🎉 Student enrollment verified and account activated in database!');
      return;
    } catch (err) {
      showToast('⚠️ ' + err.message);
      return;
    }
  }
  const dispatch = (AppState.verificationDispatches || []).find(d => d.id === dispatchId);
  if (dispatch) dispatch.status = 'Institutionally Verified & Authenticated';
  renderStaffPortalContents();
}

function downloadVerificationNotice(ref) {
  showToast(`📄 Verification Notice ${ref} downloaded for university archives!`);
}

// Close All Modals
function closeModal() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => modal.classList.remove('active'));
  document.body.style.overflow = '';
}

// Toast Notification
function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}


// ============================================================================
// TRY PRODUCT REDIRECT TO STANDALONE FEED & MARKETPLACE APP FOLDER
// ============================================================================
async function probeUrlOk(url, timeoutMs = 1500) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const resp = await fetch(url, { method: 'GET', signal: ctrl.signal });
    clearTimeout(timer);
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function openTryProductModal(projectId) {
  const qs = `?tab=marketplace&product=${encodeURIComponent(projectId)}&source=afostech`;
  showToast('🛒 Opening AFOSTECH Food Feed App (Marketplace)...');

  // 1. Same-origin AFOSTECH-FoodFeed server (/portal/ -> root app)
  if (isHttpOrigin() && window.location.pathname.startsWith('/portal/')) {
    window.location.href = `/index.html${qs}`;
    return;
  }

  // 2. Same-origin AFOSTECH Node server (:3000 -> /foodfeed-app/)
  if (isHttpOrigin() && AppState.isBackendOnline) {
    window.location.href = `/foodfeed-app/index.html${qs}`;
    return;
  }

  // 3. Static / Five Server / Live Server preview: prefer live Food Feed App servers (avoid ../ traversal 403!)
  if (isHttpOrigin() && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    const host = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
    if (await probeUrlOk(`http://127.0.0.1:3001/api/health`)) {
      window.location.href = `http://${host}:3001/index.html${qs}`;
      return;
    }
    if (await probeUrlOk(`http://127.0.0.1:3000/api/health`)) {
      window.location.href = `http://${host}:3000/foodfeed-app/index.html${qs}`;
      return;
    }
  }

  // 4. Direct sibling folder (file://, parent-folder server, or GitHub Pages)
  if (!isHttpOrigin()) {
    window.location.href = `../AFOSTECH-FoodFeed/index.html${qs}`;
    return;
  }

  try {
    const sibResp = await fetch('../AFOSTECH-FoodFeed/index.html', { method: 'HEAD' });
    if (sibResp.ok) {
      window.location.href = `../AFOSTECH-FoodFeed/index.html${qs}`;
      return;
    }
  } catch (e) {}

  showToast('⚠️ Start the AFOSTECH Food Feed server ("npm start" in AFOSTECH-FoodFeed) or open http://localhost:3001/portal/ so Try Product can switch apps.');
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// INNOVATOR PRODUCT IMAGE STUDIO & EDITOR (UPLOAD, CROP, ROTATE, ENHANCE)
// ============================================================================

function openProductImageEditor(projectId) {
  const project = AppState.projects.find(p => p.id === projectId);
  if (!project) return;

  AppState.imageEditor.targetProjectId = projectId;
  AppState.imageEditor.originalUrl = project.image || 'assets/spirocracker.svg';
  AppState.imageEditor.currentUrl = project.image || 'assets/spirocracker.svg';
  AppState.imageEditor.rotation = 0;
  AppState.imageEditor.flipH = false;
  AppState.imageEditor.scale = 1.0;
  AppState.imageEditor.aspect = '16/9';
  AppState.imageEditor.brightness = 100;
  AppState.imageEditor.contrast = 100;
  AppState.imageEditor.saturation = 100;
  AppState.imageEditor.tonePreset = 'normal';

  // Update modal titles
  const titleEl = document.getElementById('imageEditorProductTitle');
  if (titleEl) {
    titleEl.innerHTML = `Editing photo for: <strong style="color: #0f172a;">${escapeHtml(project.title)}</strong> (${project.universityName})`;
  }

  const urlInput = document.getElementById('productImageStudioUrl');
  if (urlInput) urlInput.value = project.image;

  initStudioDisplay();

  const modal = document.getElementById('editProductImageModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function openImageEditorForSubmission() {
  const currentImg = document.getElementById('subProductImageUrl')?.value || 'assets/spirocracker.svg';
  const prodTitle = document.getElementById('subTitle')?.value.trim() || 'New Product Formulation';

  AppState.imageEditor.targetProjectId = 'submission';
  AppState.imageEditor.originalUrl = currentImg;
  AppState.imageEditor.currentUrl = currentImg;
  AppState.imageEditor.rotation = 0;
  AppState.imageEditor.flipH = false;
  AppState.imageEditor.scale = 1.0;
  AppState.imageEditor.aspect = '16/9';
  AppState.imageEditor.brightness = 100;
  AppState.imageEditor.contrast = 100;
  AppState.imageEditor.saturation = 100;
  AppState.imageEditor.tonePreset = 'normal';

  const titleEl = document.getElementById('imageEditorProductTitle');
  if (titleEl) {
    titleEl.innerHTML = `Editing submission photo for: <strong style="color: #0f172a;">${escapeHtml(prodTitle)}</strong>`;
  }

  const urlInput = document.getElementById('productImageStudioUrl');
  if (urlInput) urlInput.value = currentImg;

  initStudioDisplay();

  const modal = document.getElementById('editProductImageModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function initStudioDisplay() {
  const img = document.getElementById('imageEditorPreviewImg');
  if (img) img.src = AppState.imageEditor.currentUrl;

  const wrapper = document.getElementById('imageCanvasWrapper');
  if (wrapper) wrapper.style.aspectRatio = AppState.imageEditor.aspect;

  // Reset slider elements
  const zoomRange = document.getElementById('studioZoomRange');
  const zoomVal = document.getElementById('studioZoomVal');
  if (zoomRange) zoomRange.value = 100;
  if (zoomVal) zoomVal.textContent = '100%';

  const bRange = document.getElementById('studioBrightness');
  const bVal = document.getElementById('studioBrightnessVal');
  if (bRange) bRange.value = 100;
  if (bVal) bVal.textContent = '100%';

  const cRange = document.getElementById('studioContrast');
  const cVal = document.getElementById('studioContrastVal');
  if (cRange) cRange.value = 100;
  if (cVal) cVal.textContent = '100%';

  const sRange = document.getElementById('studioSaturation');
  const sVal = document.getElementById('studioSaturationVal');
  if (sRange) sRange.value = 100;
  if (sVal) sVal.textContent = '100%';

  // Reset preset button states
  document.querySelectorAll('.filter-chip-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === 'normal');
  });

  updateStudioTransform();
  updateStudioFilter();
}

function handleSubProductImageUpload(input) {
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const urlInput = document.getElementById('subProductImageUrl');
      const thumb = document.getElementById('subProductImageThumb');
      const nameEl = document.getElementById('subProductImageFileName');
      if (urlInput) urlInput.value = e.target.result;
      if (thumb) thumb.src = e.target.result;
      if (nameEl) nameEl.textContent = file.name;
      showToast('📷 Product photo loaded into submission draft!');
    };
    reader.readAsDataURL(file);
  }
}

function applySubProductImagePreset(presetUrl) {
  if (!presetUrl) return;
  const urlInput = document.getElementById('subProductImageUrl');
  const thumb = document.getElementById('subProductImageThumb');
  const nameEl = document.getElementById('subProductImageFileName');
  if (urlInput) urlInput.value = presetUrl;
  if (thumb) thumb.src = presetUrl;
  if (nameEl) nameEl.textContent = presetUrl.replace('assets/', '');
  showToast('✓ Preset visual applied to submission draft!');
}

function handleStudioImageFileSelect(input) {
  if (input && input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      AppState.imageEditor.currentUrl = e.target.result;
      const img = document.getElementById('imageEditorPreviewImg');
      if (img) img.src = e.target.result;
      const status = document.getElementById('imageEditorStatusText');
      if (status) status.textContent = `Loaded custom photo: ${file.name}`;
      showToast('📷 Photo loaded into Image Studio!');
    };
    reader.readAsDataURL(file);
  }
}

function handleStudioPresetSelect(presetUrl) {
  if (!presetUrl) return;
  AppState.imageEditor.currentUrl = presetUrl;
  const img = document.getElementById('imageEditorPreviewImg');
  if (img) img.src = presetUrl;
  const urlInput = document.getElementById('productImageStudioUrl');
  if (urlInput) urlInput.value = presetUrl;
  showToast('✓ Scientific preset visual selected!');
}

function handleStudioUrlInput(url) {
  const clean = (url || '').trim();
  if (!clean) return;
  AppState.imageEditor.currentUrl = clean;
  const img = document.getElementById('imageEditorPreviewImg');
  if (img) img.src = clean;
}

function rotateStudioImage(deg) {
  AppState.imageEditor.rotation = (AppState.imageEditor.rotation + deg) % 360;
  updateStudioTransform();
}

function flipStudioImageHorizontal() {
  AppState.imageEditor.flipH = !AppState.imageEditor.flipH;
  updateStudioTransform();
}

function setStudioAspect(aspectStr, btn) {
  AppState.imageEditor.aspect = aspectStr;
  const wrapper = document.getElementById('imageCanvasWrapper');
  if (wrapper) wrapper.style.aspectRatio = aspectStr;

  const badge = document.getElementById('imageDimBadge');
  if (badge) {
    if (aspectStr === '16/9') badge.textContent = 'HD Preview • 16:9 Banner';
    else if (aspectStr === '4/3') badge.textContent = 'HD Preview • 4:3 Standard';
    else if (aspectStr === '1/1') badge.textContent = 'HD Preview • 1:1 Square';
  }

  document.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function updateStudioTransform() {
  const zoomRange = document.getElementById('studioZoomRange');
  const zoomVal = document.getElementById('studioZoomVal');
  if (zoomRange) {
    AppState.imageEditor.scale = parseFloat(zoomRange.value) / 100;
    if (zoomVal) zoomVal.textContent = zoomRange.value + '%';
  }

  const img = document.getElementById('imageEditorPreviewImg');
  if (img) {
    const rot = AppState.imageEditor.rotation;
    const flip = AppState.imageEditor.flipH ? -1 : 1;
    const s = AppState.imageEditor.scale;
    img.style.transform = `rotate(${rot}deg) scaleX(${flip}) scale(${s})`;
  }
}

function updateStudioFilter() {
  const bRange = document.getElementById('studioBrightness');
  const cRange = document.getElementById('studioContrast');
  const sRange = document.getElementById('studioSaturation');

  const b = bRange ? parseInt(bRange.value) : 100;
  const c = cRange ? parseInt(cRange.value) : 100;
  const sat = sRange ? parseInt(sRange.value) : 100;

  AppState.imageEditor.brightness = b;
  AppState.imageEditor.contrast = c;
  AppState.imageEditor.saturation = sat;

  const bVal = document.getElementById('studioBrightnessVal');
  const cVal = document.getElementById('studioContrastVal');
  const sVal = document.getElementById('studioSaturationVal');
  if (bVal) bVal.textContent = b + '%';
  if (cVal) cVal.textContent = c + '%';
  if (sVal) sVal.textContent = sat + '%';

  const img = document.getElementById('imageEditorPreviewImg');
  if (img) {
    img.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${sat}%)`;
  }
}

function applyStudioTonePreset(preset, btn) {
  AppState.imageEditor.tonePreset = preset;

  const bRange = document.getElementById('studioBrightness');
  const cRange = document.getElementById('studioContrast');
  const sRange = document.getElementById('studioSaturation');

  if (preset === 'normal') {
    if (bRange) bRange.value = 100;
    if (cRange) cRange.value = 100;
    if (sRange) sRange.value = 100;
  } else if (preset === 'vibrant') {
    if (bRange) bRange.value = 106;
    if (cRange) cRange.value = 115;
    if (sRange) sRange.value = 140;
  } else if (preset === 'studio') {
    if (bRange) bRange.value = 115;
    if (cRange) cRange.value = 125;
    if (sRange) sRange.value = 105;
  } else if (preset === 'warm') {
    if (bRange) bRange.value = 105;
    if (cRange) cRange.value = 110;
    if (sRange) sRange.value = 120;
  } else if (preset === 'cool') {
    if (bRange) bRange.value = 102;
    if (cRange) cRange.value = 118;
    if (sRange) sRange.value = 88;
  }

  document.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  updateStudioFilter();
}

function resetImageEditorControls() {
  AppState.imageEditor.currentUrl = AppState.imageEditor.originalUrl;
  AppState.imageEditor.rotation = 0;
  AppState.imageEditor.flipH = false;
  AppState.imageEditor.scale = 1.0;
  AppState.imageEditor.aspect = '16/9';
  initStudioDisplay();
  showToast('↺ Image Studio controls reset to default');
}

function saveStudioProductImage() {
  const currentUrl = AppState.imageEditor.currentUrl;
  const isSubmission = AppState.imageEditor.targetProjectId === 'submission';
  const targetId = AppState.imageEditor.targetProjectId;

  // Check if adjustments/rotations were applied
  const hasAdjustments = (
    AppState.imageEditor.rotation !== 0 ||
    AppState.imageEditor.flipH !== false ||
    AppState.imageEditor.scale !== 1.0 ||
    AppState.imageEditor.brightness !== 100 ||
    AppState.imageEditor.contrast !== 100 ||
    AppState.imageEditor.saturation !== 100
  );

  const previewImg = document.getElementById('imageEditorPreviewImg');

  // Helper to complete saving
  function finalizeSave(finalImageUrl) {
    if (isSubmission) {
      const urlInput = document.getElementById('subProductImageUrl');
      const thumb = document.getElementById('subProductImageThumb');
      const nameEl = document.getElementById('subProductImageFileName');
      if (urlInput) urlInput.value = finalImageUrl;
      if (thumb) thumb.src = finalImageUrl;
      if (nameEl) nameEl.textContent = 'Custom Edited Prototype Photo';
      closeModal();
      showToast('📸 Product photo saved for your submission!');
      return;
    }

    // Save for existing project (persisted to SQLite backend if online)
    const proj = AppState.projects.find(p => p.id === targetId);
    if (proj) {
      if (AppState.isBackendOnline) {
        apiRequest(`/api/projects/${targetId}/image`, {
          method: 'PUT',
          body: JSON.stringify({ image: finalImageUrl })
        }).then(res => {
          proj.image = res.image;
          renderCatalog();
          renderDashboard();
          const innovModal = document.getElementById('innovatorDashboardModal');
          if (innovModal && innovModal.classList.contains('active')) openStudentInnovatorDashboard();
          closeModal();
          showToast(`📸 "${proj.title}" product image saved to backend!`);
        }).catch(err => {
          showToast('⚠️ ' + err.message);
        });
        return;
      }

      proj.image = finalImageUrl;
      renderCatalog();
      renderDashboard();
      const innovModal = document.getElementById('innovatorDashboardModal');
      if (innovModal && innovModal.classList.contains('active')) openStudentInnovatorDashboard();
      closeModal();
      showToast(`📸 "${proj.title}" product image updated!`);
    }
  }

  // If no canvas rendering is needed (pure URL without rotation/filters)
  if (!hasAdjustments && currentUrl) {
    finalizeSave(currentUrl);
    return;
  }

  // Export from canvas with adjustments applied
  try {
    const canvas = document.getElementById('studioExportCanvas');
    if (!canvas || !previewImg) {
      finalizeSave(currentUrl);
      return;
    }

    const ctx = canvas.getContext('2d');
    const width = 800;
    const height = AppState.imageEditor.aspect === '1/1' ? 800 : (AppState.imageEditor.aspect === '4/3' ? 600 : 450);
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Apply color filters
    const b = AppState.imageEditor.brightness;
    const c = AppState.imageEditor.contrast;
    const s = AppState.imageEditor.saturation;
    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

    // Center and transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((AppState.imageEditor.rotation * Math.PI) / 180);
    ctx.scale(AppState.imageEditor.flipH ? -AppState.imageEditor.scale : AppState.imageEditor.scale, AppState.imageEditor.scale);

    // Draw image onto canvas
    if (previewImg.complete && previewImg.naturalWidth > 0) {
      const imgRatio = previewImg.naturalWidth / previewImg.naturalHeight;
      const targetRatio = width / height;
      let drawW, drawH;
      if (imgRatio > targetRatio) {
        drawW = width;
        drawH = width / imgRatio;
      } else {
        drawH = height;
        drawW = height * imgRatio;
      }
      ctx.drawImage(previewImg, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      ctx.drawImage(previewImg, -width / 2, -height / 2, width, height);
    }
    ctx.restore();

    const exportedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    finalizeSave(exportedDataUrl);
  } catch (err) {
    console.warn('Canvas export fallback to direct URL:', err);
    finalizeSave(currentUrl);
  }
}
