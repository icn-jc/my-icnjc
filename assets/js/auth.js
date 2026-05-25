// ═══════════════════════════════════════════════════════════════
// auth.js — ICN Junior Conseil
// ═══════════════════════════════════════════════════════════════

const ALLOWED_DOMAIN = 'icnjuniorconseil.com';

// ── Hiérarchie des rôles ──────────────────────────────────────
var ROLE_HIERARCHY_AUTH = [
  'super_admin', 'president', 'vice_president', 'tresorier', 'secretaire',
  'responsable_commercial', 'responsable_qualite', 'responsable_marketing',
  'tresorerie', 'auditeur', 'marketing', 'commercial', 'intervenant',
  'membre_cos', 'tuteur'
];

// ── Accès par page ────────────────────────────────────────────
// tuteur     → index + crm_prospection uniquement (lecture seule)
// intervenant → mes_missions + index
// Tous les autres rôles = accès normal selon liste
const PAGE_ACCESS = {
  'index': ['super_admin','president','vice_president','tresorier','secretaire',
            'responsable_commercial','responsable_qualite','responsable_marketing',
            'tresorerie','auditeur','marketing','commercial','membre_cos',
            'intervenant','tuteur'],

  'tracker_treso': ['super_admin','vice_president','tresorier','tresorerie','responsable_qualite'],
  'tracker_orga':  ['super_admin','president','vice_president','tresorier','responsable_qualite','auditeur'],

  'kpi_treso':     ['super_admin','president','vice_president','tresorier','tresorerie',
                    'secretaire','responsable_marketing','responsable_commercial','responsable_qualite','membre_cos'],
  'kpi_commercial':['super_admin','president','vice_president','tresorier','responsable_commercial',
                    'secretaire','marketing','responsable_marketing','auditeur','commercial','membre_cos'],

  'crm_prospection': ['super_admin','president','vice_president','tresorier','secretaire',
                      'responsable_commercial','responsable_qualite','responsable_marketing',
                      'tresorerie','auditeur','marketing','commercial','membre_cos','tuteur'],
  'crm_clients':     ['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial','membre_cos'],
  'crm_intervenants':['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','membre_cos'],
  'crm_partenariats':['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'],
  'crm_compta':      ['super_admin','president','vice_president','tresorier','tresorerie','responsable_qualite'],
  'crm_partenariats':ROLE_HIERARCHY_AUTH,

  'etudes':          ['super_admin','president','vice_president','tresorier','responsable_commercial',
                      'responsable_qualite','secretaire','tresorerie','responsable_marketing','membre_cos'],
  'mes_missions':    ROLE_HIERARCHY_AUTH,
  'gestion_docs':    ['super_admin','responsable_qualite'],
  'evenements':      ['super_admin','president','vice_president','tresorier','secretaire',
                      'responsable_commercial','responsable_qualite','responsable_marketing',
                      'tresorerie','auditeur','marketing','commercial','membre_cos'],
  'mandats':         ['super_admin','president','vice_president'],
  'admin':           ['super_admin','president'],
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
  'crm_partenariats':  ['super_admin','vice_president'],
  'crm_prospection':   ROLE_HIERARCHY_AUTH,
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

// ── Utilitaire rôle le plus élevé ────────────────────────────
function getHighestRoleAuth(roles) {
  if (!roles || !roles.length) return 'commercial';
  for (var i = 0; i < ROLE_HIERARCHY_AUTH.length; i++) {
    if (roles.includes(ROLE_HIERARCHY_AUTH[i])) return ROLE_HIERARCHY_AUTH[i];
  }
  return roles[0];
}

// ═══════════════════════════════════════════════════════════════
// INIT AUTH — point d'entrée unique
// ═══════════════════════════════════════════════════════════════
function initAuth(pageKey, onReady) {
  auth.onAuthStateChanged(async function(user) {
    if (!user) {
      showLoginPage();
      return;
    }

    const email  = (user.email || '').toLowerCase().trim();
    const domain = email.split('@')[1] || '';

    // ── CAS 1 : email @icnjuniorconseil.com ──────────────────
    if (domain === ALLOWED_DOMAIN) {
      try {
        const doc = await db.collection('users').doc(email).get();
        if (!doc.exists) {
          auth.signOut();
          showAccessDenied('Ton compte n\'a pas encore été configuré. Contacte Stella.');
          return;
        }
        const data = doc.data();
        const roles = Array.isArray(data.roles) ? data.roles
                    : data.role ? [data.role]
                    : ['commercial'];
        CURRENT_USER    = user;
        CURRENT_PROFILE = data;
        CURRENT_ROLE    = getHighestRoleAuth(roles);
        const allowed = PAGE_ACCESS[pageKey] || [];
        if (!allowed.includes(CURRENT_ROLE)) {
          auth.signOut();
          showAccessDenied('Tu n\'as pas accès à cette page.');
          return;
        }
        if (onReady) onReady(user, CURRENT_ROLE, CURRENT_PROFILE);
      } catch(e) {
        auth.signOut();
        showAccessDenied('Erreur de connexion : ' + e.message);
      }
      return;
    }

    // ── CAS 2 : email hors domaine → cherche dans whitelist_emails ──
    try {
      const wlDoc = await db.collection('whitelist_emails').doc(email).get();
      if (wlDoc.exists) {
        const wl = wlDoc.data();
        const role = wl.role || 'tuteur';
        CURRENT_USER    = user;
        CURRENT_ROLE    = role;
        CURRENT_PROFILE = {
          prenom:    wl.prenom || email.split('@')[0],
          nom:       wl.nom    || '',
          email:     email,
          role:      role,
          roles:     [role],
          prospecte: false
        };
        const allowed = PAGE_ACCESS[pageKey] || [];
        if (!allowed.includes(role)) {
          auth.signOut();
          showAccessDenied('Tu n\'as pas accès à cette page. Rôle : ' + role);
          return;
        }
        if (onReady) onReady(user, role, CURRENT_PROFILE);
        return;
      }

      // Pas dans whitelist_emails → accès refusé
      auth.signOut();
      showAccessDenied('Ton adresse email (' + email + ') n\'est pas autorisée. Contacte l\'administrateur.');

    } catch(e) {
      auth.signOut();
      showAccessDenied('Erreur de connexion : ' + e.message);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// UI helpers
// ═══════════════════════════════════════════════════════════════
function showLoginPage() {
  var lp = document.getElementById('login-page');
  var ap = document.getElementById('app-page');
  if (lp) lp.style.display = 'flex';
  if (ap) ap.style.display = 'none';
}

function showAppPage(user, role, profile) {
  var lp = document.getElementById('login-page');
  var ap = document.getElementById('app-page');
  if (lp) lp.style.display = 'none';
  if (ap) ap.style.display = 'flex';
  updateHealthIndicator();
}

function showAccessDenied(msg) {
  var lp = document.getElementById('login-page');
  var ap = document.getElementById('app-page');
  if (lp) lp.style.display = 'flex';
  if (ap) ap.style.display = 'none';
  var db2 = document.getElementById('denied-box');
  var dm  = document.getElementById('denied-msg');
  if (db2) db2.style.display = 'block';
  if (dm)  dm.innerText = msg;
  var le  = document.getElementById('login-error');
  if (le)  le.innerText = msg;
}

function doGoogleLogin() {
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function(e) {
    // Ignore cancelled-popup (double-click)
    if (e.code === 'auth/cancelled-popup-request') return;
    if (e.code === 'auth/popup-closed-by-user') return;
    var le = document.getElementById('login-error');
    if (le) le.innerText = 'Erreur : ' + e.message;
  });
}

function doGoogleLogout() {
  auth.signOut().then(function() {
    window.location.reload();
  });
}

// ═══════════════════════════════════════════════════════════════
// Fonctions utilitaires exportées
// ═══════════════════════════════════════════════════════════════
function getCurrentRole()    { return CURRENT_ROLE; }
function getCurrentUser()    { return CURRENT_USER; }
function getCurrentProfile() { return CURRENT_PROFILE; }

function canEdit(pageKey) {
  var roles = EDIT_ROLES[pageKey] || [];
  return roles.includes(CURRENT_ROLE);
}

function hasRole(role) {
  return CURRENT_ROLE === role;
}

function isInRole(roles) {
  return roles.includes(CURRENT_ROLE);
}

function updateHealthIndicator() {
  var el = document.getElementById('health-indicator');
  if (el) el.style.background = 'var(--success)';
}
