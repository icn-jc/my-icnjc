// ── My-ICN-JC — Auth & Rôles ──────────────────────────────────

const ALLOWED_DOMAIN = 'icnjuniorconseil.com';

// ── Définition des rôles ──────────────────────────────────────
const ROLES = {
  super_admin:            'super_admin',
  president:              'president',
  vice_president:         'vice_president',
  tresorier:              'tresorier',
  secretaire:             'secretaire',
  responsable_commercial: 'responsable_commercial',
  responsable_qualite:    'responsable_qualite',
  responsable_marketing:  'responsable_marketing',
  tresorerie:             'tresorerie',
  auditeur:               'auditeur',
  marketing:              'marketing',
  commercial:             'commercial',
  intervenant:            'intervenant',
};

// ── Hiérarchie (index 0 = le plus élevé) ─────────────────────
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
  'responsable_marketing','tresorerie','auditeur','marketing'
];

// ── Permissions par page ──────────────────────────────────────
const PAGE_ACCESS = {
  // Tout le monde (sauf intervenants)
  'index': ['super_admin','president','vice_president','tresorier','secretaire',
            'responsable_commercial','responsable_qualite','responsable_marketing',
            'tresorerie','auditeur','marketing','commercial'],

  // Tracker trésorerie
  'tracker_treso': ['super_admin','vice_president','tresorier','tresorerie','responsable_qualite'],

  // Tracker orga
  'tracker_orga': ['super_admin','president','vice_president','tresorier','responsable_qualite','auditeur'],

  // KPI trésorerie
  'kpi_treso': ['super_admin','president','vice_president','tresorier','tresorerie',
                'secretaire','responsable_marketing','responsable_commercial','responsable_qualite'],

  // KPI commercial
  'kpi_commercial': ['super_admin','president','vice_president','tresorier','responsable_commercial',
                     'secretaire','marketing','responsable_marketing','auditeur','commercial'],

  // CRM
  'crm_prospection': ['super_admin','president','vice_president','tresorier','secretaire',
                      'responsable_commercial','responsable_qualite','responsable_marketing',
                      'tresorerie','auditeur','marketing','commercial'],
  'crm_clients':     ['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'],
  'crm_intervenants':['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie'],
  'crm_partenariats':['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'],

  // Études
  'etudes': ['super_admin','president','vice_president','tresorier','responsable_commercial',
             'responsable_qualite','secretaire','tresorerie','responsable_marketing'],

  // Événements
  'evenements': ['super_admin','president','vice_president','tresorier','secretaire',
                 'responsable_commercial','responsable_qualite','responsable_marketing',
                 'tresorerie','auditeur','marketing','commercial'],

  // Mes missions (intervenants + tous)
  'mes_missions': ['super_admin','president','vice_president','tresorier','secretaire',
                   'responsable_commercial','responsable_qualite','responsable_marketing',
                   'tresorerie','auditeur','marketing','commercial','intervenant'],

  // Admin
  'admin': ['super_admin','president'],
};

// ── Droits de modification par page ──────────────────────────
const EDIT_ROLES = {
  'kpi_treso':         ['super_admin','tresorier'],
  'tracker_treso':     ['super_admin','tresorier'],
  'tracker_orga':      ['super_admin','president','vice_president','responsable_qualite','auditeur'],
  'crm_clients':       ['super_admin','president','vice_president','responsable_commercial'],
  'crm_intervenants':  ['super_admin','president','vice_president','responsable_commercial','secretaire'],
  'crm_partenariats':  ['super_admin','president','vice_president','responsable_commercial'],
  'crm_prospection':   ['super_admin','president','vice_president','tresorier','secretaire',
                        'responsable_commercial','responsable_qualite','responsable_marketing',
                        'tresorerie','auditeur','marketing','commercial'],
  'etudes':            ['super_admin','president','vice_president','responsable_commercial','responsable_qualite'],
  'evenements':        ['super_admin','president','vice_president','secretaire'],
  'kpi_commercial':    ['super_admin','president','vice_president','responsable_commercial'],
  'admin':             ['super_admin','president'],
};

// ── Droits archiver/désarchiver tracker orga ─────────────────
const ARCHIVE_ORGA_ROLES = ['super_admin','responsable_qualite'];

// ── Utilisateur courant (global) ──────────────────────────────
let CURRENT_USER    = null;
let CURRENT_ROLE    = null;
let CURRENT_PROFILE = null;

// ── Initialisation Auth ───────────────────────────────────────
function initAuth(pageKey, onReady) {
  auth.onAuthStateChanged(async function(user) {
    if (!user) { showLoginPage(); return; }

    const email  = user.email || '';
    const domain = email.split('@')[1] || '';

    if (domain !== ALLOWED_DOMAIN) {
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

      // Support multi-rôles
      var profileRoles = Array.isArray(CURRENT_PROFILE.roles)
        ? CURRENT_PROFILE.roles
        : (CURRENT_PROFILE.role ? [CURRENT_PROFILE.role] : ['commercial']);
      CURRENT_ROLE = getHighestRoleAuth(profileRoles);

      // Vérifier accès page
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

// ── Helpers rôles ─────────────────────────────────────────────
function isAdmin()        { return ['super_admin','president'].includes(CURRENT_ROLE); }
function isCA()           { return CA_ROLES.includes(CURRENT_ROLE); }
function canEdit(page)    { return (EDIT_ROLES[page] || []).includes(CURRENT_ROLE); }
function canArchiveOrga() { return ARCHIVE_ORGA_ROLES.includes(CURRENT_ROLE); }

// ── Connexion Google ──────────────────────────────────────────
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

// ── UI helpers ────────────────────────────────────────────────
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

// ── Chemin relatif vers la racine ─────────────────────────────
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
