// ── My-ICN-JC — Auth & Rôles ──────────────────────────────────

const ALLOWED_DOMAIN = 'icnjuniorconseil.com';

// ── Définition des rôles ──────────────────────────────────────
const ROLES = {
  super_admin:            'super_admin',
  president:              'president',
  tresorerie:             'tresorerie',
  responsable_commercial: 'responsable_commercial',
  responsable_qualite:    'responsable_qualite',
  secretaire:             'secretaire',
  marketing:              'marketing',
  auditeur:               'auditeur',
  membre:                 'membre',
};

// Rôles ayant accès aux données CA (KPI tréso, finances)
const CA_ROLES = [
  'super_admin','president','tresorerie',
  'responsable_commercial','responsable_qualite',
  'secretaire','marketing'
];

// Rôles pouvant tout modifier (admin total)
const ADMIN_ROLES = ['super_admin','president'];

// ── Utilisateur courant (global) ──────────────────────────────
let CURRENT_USER   = null;  // objet Firebase Auth
let CURRENT_ROLE   = null;  // string rôle
let CURRENT_PROFILE = null; // document Firestore users/

// ── Permissions par page ──────────────────────────────────────
const PAGE_ACCESS = {
  // Tout le monde authentifié
  'index':               ['super_admin','president','tresorerie','responsable_commercial','responsable_qualite','secretaire','marketing','auditeur','membre'],
  // CA uniquement
  'kpi_treso':           ['super_admin','president','tresorerie','secretaire','marketing','responsable_commercial','responsable_qualite'],
  'tracker_treso':       ['super_admin','president','tresorerie'],
  // Qualité + admin
  'tracker_orga':        ['super_admin','president','responsable_qualite','auditeur'],
  // Commercial + admin
  'crm_clients':         ['super_admin','president','responsable_commercial','secretaire'],
  'crm_intervenants':    ['super_admin','president','responsable_commercial','responsable_qualite','secretaire'],
  'crm_partenariats':    ['super_admin','president','secretaire'],
  // Tous (prospection = chacun ses propres lignes)
  'crm_prospection':     ['super_admin','president','tresorerie','responsable_commercial','responsable_qualite','secretaire','marketing','auditeur','membre'],
  // Études
  'etudes':              ['super_admin','president','responsable_commercial','responsable_qualite','secretaire'],
  // Événements
  'evenements':          ['super_admin','president','tresorerie','responsable_commercial','responsable_qualite','secretaire','marketing','auditeur','membre'],
  // KPI commercial
  'kpi_commercial':      ['super_admin','president','responsable_commercial','secretaire','marketing','auditeur','membre'],
  // Admin : toi + président uniquement
  'admin':               ['super_admin','president'],
};

// ── Initialisation Auth ───────────────────────────────────────
function initAuth(pageKey, onReady) {
  auth.onAuthStateChanged(async function(user) {
    if (!user) {
      // Pas connecté → page de login
      showLoginPage();
      return;
    }

    const email  = user.email || '';
    const domain = email.split('@')[1] || '';

    // Vérifier le domaine
    if (domain !== ALLOWED_DOMAIN) {
      auth.signOut();
      showAccessDenied('Utilise ton adresse @icnjuniorconseil.com');
      return;
    }

    // Récupérer le profil Firestore
    try {
      const doc = await COLLECTIONS.users.doc(email).get();
      if (!doc.exists) {
        // Compte pas encore dans la base → accès refusé
        auth.signOut();
        showAccessDenied('Ton compte n\'a pas encore été configuré. Contacte Stella ou Antoine.');
        return;
      }

      CURRENT_USER    = user;
      CURRENT_PROFILE = doc.data();
      CURRENT_ROLE    = CURRENT_PROFILE.role;

      // Vérifier l'accès à cette page
      const allowed = PAGE_ACCESS[pageKey] || [];
      if (!allowed.includes(CURRENT_ROLE)) {
        showAccessDenied('Tu n\'as pas accès à cette page.');
        return;
      }

      // Tout bon → afficher l'app
      if (onReady) onReady(CURRENT_USER, CURRENT_ROLE, CURRENT_PROFILE);

    } catch (err) {
      showAccessDenied('Erreur de connexion : ' + err.message);
    }
  });
}

// ── Connexion Google ──────────────────────────────────────────
function doGoogleLogin() {
  const errEl = document.getElementById('login-error');
  if (errEl) { errEl.style.display = 'none'; }
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

// ── Helpers rôles ─────────────────────────────────────────────
function isAdmin()     { return ADMIN_ROLES.includes(CURRENT_ROLE); }
function isCA()        { return CA_ROLES.includes(CURRENT_ROLE); }
function canEdit(page) {
  const editRoles = {
    'kpi_treso':        ['super_admin','president','tresorerie'],
    'tracker_treso':    ['super_admin','president','tresorerie'],
    'tracker_orga':     ['super_admin','president','responsable_qualite','auditeur'],
    'crm_clients':      ['super_admin','president','responsable_commercial'],
    'crm_intervenants': ['super_admin','president','responsable_commercial','responsable_qualite'],
    'crm_partenariats': ['super_admin','president'],
    'crm_prospection':  ['super_admin','president','tresorerie','responsable_commercial','responsable_qualite','secretaire','marketing','auditeur','membre'],
    'etudes':           ['super_admin','president','responsable_commercial','responsable_qualite'],
    'evenements':       ['super_admin','president','secretaire'],
    'kpi_commercial':   ['super_admin','president','responsable_commercial'],
    'admin':            ['super_admin','president'],
  };
  return (editRoles[page] || []).includes(CURRENT_ROLE);
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
  // Remplir le nom dans le header
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.innerText = profile.prenom || user.displayName || user.email;
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl && user.photoURL) { avatarEl.src = user.photoURL; avatarEl.style.display = 'block'; }
}

// ── Chemin relatif vers la racine ──────────────────────────────
function getBasePath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const repoIdx = parts.indexOf('my-icnjc');
  if (repoIdx === -1) return './';
  // Nombre de niveaux entre le fichier courant et la racine du repo
  // ex: /my-icnjc/admin/admin_index.html → parts après repo = ['admin','admin_index.html'] → 1 dossier
  const afterRepo = parts.slice(repoIdx + 1);
  const levels = afterRepo.length > 0 ? afterRepo.length - (afterRepo[afterRepo.length-1].includes('.') ? 1 : 0) : 0;
  return levels > 0 ? '../'.repeat(levels) : './';
}
