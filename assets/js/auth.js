// ── My-ICN-JC — Auth & Rôles ──────────────────────────────────

const ALLOWED_DOMAIN = 'icnjuniorconseil.com';

// ── Hiérarchie complète ───────────────────────────────────────
var ROLE_HIERARCHY_AUTH = [
  'super_admin',
  'president',
  'vice_president',
  'tresorier',
  'secretaire',
  'responsable_commercial',
  'responsable_qualite',
  'responsable_marketing',
  'tresorerie',
  'auditeur',
  'marketing',
  'commercial',
  'intervenant',
  'membre_cos', // Anciens membres — lecture seule CA
];

function getHighestRoleAuth(roles) {
  for (var i = 0; i < ROLE_HIERARCHY_AUTH.length; i++) {
    if (roles.indexOf(ROLE_HIERARCHY_AUTH[i]) !== -1) return ROLE_HIERARCHY_AUTH[i];
  }
  return 'commercial';
}

// ── Rôles CA (accès données financières / tréso) ──────────────
const CA_ROLES = [
  'super_admin','president','vice_president','tresorier',
  'secretaire','responsable_commercial','responsable_qualite',
  'responsable_marketing','tresorerie','auditeur','marketing',
  'membre_cos' // lecture seule
];

// ── Permissions par page ──────────────────────────────────────
const PAGE_ACCESS = {
  'index': ['super_admin','president','vice_president','tresorier','secretaire',
            'responsable_commercial','responsable_qualite','responsable_marketing',
            'tresorerie','auditeur','marketing','commercial','membre_cos'],

  'tracker_treso': ['super_admin','vice_president','tresorier','tresorerie','responsable_qualite'],
  'tracker_orga':  ['super_admin','president','vice_president','tresorier','responsable_qualite','auditeur'],

  'kpi_treso':     ['super_admin','president','vice_president','tresorier','tresorerie',
                    'secretaire','responsable_marketing','responsable_commercial','responsable_qualite','membre_cos'],
  'kpi_commercial':['super_admin','president','vice_president','tresorier','responsable_commercial',
                    'secretaire','marketing','responsable_marketing','auditeur','commercial','membre_cos'],

  'crm_prospection': ['super_admin','president','vice_president','tresorier','secretaire',
                      'responsable_commercial','responsable_qualite','responsable_marketing',
                      'tresorerie','auditeur','marketing','commercial','membre_cos'],
  'crm_clients':     ['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial','membre_cos'],
  'crm_intervenants':['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','membre_cos'],
  'crm_partenariats':['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'],
  'etudes':          ['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_qualite','secretaire','tresorerie','responsable_marketing','membre_cos'],
  'mes_missions':    ['super_admin','president','vice_president','tresorier','secretaire',
                      'responsable_commercial','responsable_qualite','responsable_marketing',
                      'tresorerie','auditeur','marketing','commercial','intervenant','membre_cos'],
  'gestion_docs':    ['super_admin','responsable_qualite'],
  'crm_compta':      ['super_admin','president','vice_president','tresorier','tresorerie','responsable_qualite'],

  'etudes': ['super_admin','president','vice_president','tresorier','responsable_commercial',
             'responsable_qualite','secretaire','tresorerie','responsable_marketing','membre_cos'],
  'evenements': ['super_admin','president','vice_president','tresorier','secretaire',
                 'responsable_commercial','responsable_qualite','responsable_marketing',
                 'tresorerie','auditeur','marketing','commercial','membre_cos'],
  'mes_missions': ROLE_HIERARCHY_AUTH,
  'mandats': ['super_admin','president','vice_president'], // Lecture tous, modif super_admin + président du mandat

  'admin': ['super_admin','president'],
};

// ── Droits de modification ────────────────────────────────────
const EDIT_ROLES = {
  'kpi_treso':         ['super_admin','tresorier'],
  'tracker_treso':     ['super_admin','tresorier'],
  'tracker_orga':      ['super_admin','president','vice_president','responsable_qualite','auditeur'],
  'crm_clients':       ['super_admin','president','vice_president','responsable_commercial'],
  'crm_intervenants':  ['super_admin','president','vice_president','responsable_commercial','secretaire'],
  'etudes':            ['super_admin','president','vice_president','responsable_commercial','responsable_qualite'],
  'mes_missions':      ['super_admin','responsable_commercial','responsable_qualite'],
  'gestion_docs':      ['super_admin','responsable_qualite'],
  'crm_partenariats':  ['super_admin','president','vice_president','responsable_commercial'],
  'crm_prospection':   ROLE_HIERARCHY_AUTH,
  'etudes':            ['super_admin','president','vice_president','responsable_commercial','responsable_qualite'],
  'evenements':        ['super_admin','president','vice_president','secretaire'],
  'kpi_commercial':    ['super_admin','president','vice_president','responsable_commercial'],
  'mandats':           ['super_admin'],
  'admin':             ['super_admin','president'],
};

const ARCHIVE_ORGA_ROLES = ['super_admin','responsable_qualite'];

// ── État courant ──────────────────────────────────────────────
let CURRENT_USER    = null;
let CURRENT_ROLE    = null;
let CURRENT_PROFILE = null;

// ── Init Auth ─────────────────────────────────────────────────
function initAuth(pageKey, onReady) {
  auth.onAuthStateChanged(async function(user) {
    if (!user) { showLoginPage(); return; }
    const email  = user.email || '';
    const domain = email.split('@')[1] || '';
    // ⚠️ TEMPORAIRE — accès test stellayathe@gmail.com
    const TEMP_WHITELIST = ['stellayathe@gmail.com'];
    const isTemp = TEMP_WHITELIST.includes(email.toLowerCase());
    if (domain !== ALLOWED_DOMAIN && !isTemp) {
      auth.signOut();
      showAccessDenied('Utilise ton adresse @icnjuniorconseil.com');
      return;
    }
    try {
      const doc = await COLLECTIONS.users.doc(email).get();
      if (!doc.exists) {
        auth.signOut();
        showAccessDenied('Ton compte n\'a pas encore été configuré. Contacte Stella.');
        return;
      }
      CURRENT_USER    = user;
      CURRENT_PROFILE = doc.data();
      var profileRoles = Array.isArray(CURRENT_PROFILE.roles)
        ? CURRENT_PROFILE.roles
        : (CURRENT_PROFILE.role ? [CURRENT_PROFILE.role] : ['commercial']);
      CURRENT_ROLE = getHighestRoleAuth(profileRoles);
      const allowed = PAGE_ACCESS[pageKey] || [];
      if (!allowed.includes(CURRENT_ROLE)) {
        showAccessDenied('Tu n\'as pas accès à cette page.');
        return;
      }
      if (onReady) onReady(CURRENT_USER, CURRENT_ROLE, CURRENT_PROFILE);
    } catch (err) {
      showAccessDenied('Erreur de connexion : ' + err.message);
    }
  });
}

function isAdmin()        { return ['super_admin','president'].includes(CURRENT_ROLE); }
function isCA()           { return CA_ROLES.includes(CURRENT_ROLE); }
function canEdit(page)    { return (EDIT_ROLES[page] || []).includes(CURRENT_ROLE); }
function canArchiveOrga() { return ARCHIVE_ORGA_ROLES.includes(CURRENT_ROLE); }
function isSuperAdmin()   { return CURRENT_ROLE === 'super_admin'; }
function isMembre_cos()   { return CURRENT_ROLE === 'membre_cos'; }

function doGoogleLogin() {
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.style.display = 'none';
  auth.signInWithPopup(googleProvider).catch(function(e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      if (errEl) { errEl.innerText = 'Erreur : ' + e.message; errEl.style.display = 'block'; }
    }
  });
}

function doLogout() {
  auth.signOut().then(function() {
    window.location.href = getBasePath() + 'index.html';
  });
}

function showLoginPage() {
  const lp = document.getElementById('login-page');
  const ap = document.getElementById('app-page');
  if (lp) lp.style.display = 'flex';
  if (ap) ap.style.display = 'none';
}

function showAccessDenied(msg) {
  const lp = document.getElementById('login-page');
  const ap = document.getElementById('app-page');
  const db = document.getElementById('denied-box');
  const dm = document.getElementById('denied-msg');
  if (lp) lp.style.display = 'flex';
  if (ap) ap.style.display = 'none';
  if (db) db.style.display = 'block';
  if (dm) dm.innerText = msg;
}

function showAppPage(user, role, profile) {
  const lp = document.getElementById('login-page');
  const ap = document.getElementById('app-page');
  if (lp) lp.style.display = 'none';
  if (ap) ap.style.display = 'block';
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.innerText = profile.prenom || user.displayName || user.email;
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl && user.photoURL) { avatarEl.src = user.photoURL; avatarEl.style.display = 'block'; }
}

function getBasePath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const repoIdx = parts.indexOf('my-icnjc');
  if (repoIdx === -1) return './';
  const afterRepo = parts.slice(repoIdx + 1);
  const levels = afterRepo.length > 0
    ? afterRepo.length - (afterRepo[afterRepo.length-1].includes('.') ? 1 : 0)
    : 0;
  return levels > 0 ? '../'.repeat(levels) : './';
}
