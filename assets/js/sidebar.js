// ── My-ICN-JC — Sidebar ───────────────────────────────────────

// CSS sidebar chargé depuis global.css

// Structure de navigation par rôle
function buildNavItems(role, basePath) {
  const ALL = ['super_admin','president','vice_president','tresorier','secretaire',
               'responsable_commercial','responsable_qualite','responsable_marketing',
               'tresorerie','auditeur','marketing','commercial','membre_cos','intervenant'];
  const all = [
    // ── Accueil ──────────────────────────────────────────────
    { section:null, key:'home', label:'Accueil', icon:'home',
      href: basePath+'index.html', roles:ALL },

    // ── AUDIT ────────────────────────────────────────────────
    { section:'AUDIT', key:'tracker_treso', label:'Tracker Tréso', icon:'clipboard',
      href: basePath+'audit/tracker_treso.html',
      roles:['super_admin','vice_president','tresorier','tresorerie','responsable_qualite'] },
    { section:null, key:'tracker_orga', label:'Tracker Orga', icon:'check-square',
      href: basePath+'audit/tracker_orga.html',
      roles:['super_admin','president','vice_president','tresorier','responsable_qualite','auditeur'] },

    // ── KPI ──────────────────────────────────────────────────
    { section:'KPI', key:'kpi_treso', label:'KPI Trésorerie', icon:'trending-up',
      href: basePath+'dashboard/kpi_treso.html',
      roles:['super_admin','president','vice_president','tresorier','tresorerie',
             'secretaire','responsable_marketing','responsable_commercial','responsable_qualite','membre_cos'] },
    { section:null, key:'kpi_commercial', label:'KPI Commercial', icon:'bar-chart',
      href: basePath+'dashboard/kpi_commercial.html',
      roles:['super_admin','president','vice_president','tresorier','responsable_commercial',
             'secretaire','marketing','responsable_marketing','auditeur','commercial','membre_cos'] },

    // ── CRM ──────────────────────────────────────────────────
    { section:'CRM', key:'crm_prospection', label:'Prospection', icon:'target',
      href: basePath+'crm/crm_prospection.html',
      roles:['super_admin','president','vice_president','tresorier','secretaire',
             'responsable_commercial','responsable_qualite','responsable_marketing',
             'tresorerie','auditeur','marketing','commercial','membre_cos'] },
    { section:null, key:'crm_clients', label:'Clients', icon:'briefcase',
      href: basePath+'crm/crm_clients.html',
      roles:['super_admin','president','vice_president','tresorier','responsable_commercial',
             'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial','membre_cos'] },
    { section:null, key:'crm_intervenants', label:'Intervenants', icon:'users',
      href: basePath+'crm/crm_intervenants.html',
      roles:['super_admin','president','vice_president','tresorier','responsable_commercial',
             'responsable_marketing','responsable_qualite','secretaire','tresorerie','membre_cos'] },
    { section:null, key:'etudes', label:'Études', icon:'folder',
      href: basePath+'etudes/etudes_index.html',
      roles:['super_admin','president','vice_president','tresorier','responsable_commercial',
             'responsable_qualite','secretaire','tresorerie','responsable_marketing','commercial','membre_cos'] },
    { section:null, key:'crm_partenariats', label:'Partenariats', icon:'link',
      href: basePath+'crm/crm_partenariats.html',
      roles:['super_admin','president','vice_president','responsable_commercial',
             'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'] },

    // ── MON ESPACE ───────────────────────────────────────────
    { section:'MON ESPACE', key:'mes_missions', label:'Mes missions', icon:'award',
      href: basePath+'crm/mes_missions.html', roles:ALL },
    { section:null, key:'gestion_docs', label:'Gestion documents', icon:'file-text',
      href: basePath+'qualite/gestion_docs.html',
      roles:['super_admin','responsable_qualite'] },

    // ── DIVERS ───────────────────────────────────────────────
    { section:'DIVERS', key:'evenements', label:'Événements', icon:'calendar',
      href: basePath+'evenements/evenements_index.html', roles:ALL },

    // ── ADMIN ────────────────────────────────────────────────
    { section:'ADMIN', key:'admin', label:'Administration', icon:'settings',
      href: basePath+'admin/admin_index.html',
      roles:['super_admin','president'] },
    { section:null, key:'mandats', label:'Historique mandats', icon:'book-open',
      href: basePath+'admin/mandats.html',
      roles:['super_admin','president','vice_president'] },
  ];

  return all.filter(item => item.roles.includes(role));
}


function getIcon(name) {
  const icons = {
    home: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
    clipboard: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>',
    'check-square': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    'trending-up': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>',
    'bar-chart': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    target: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    briefcase: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    link: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    folder: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    calendar: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    settings: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    'book-open': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'briefcase': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    'users': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'award': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    'file-text': '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  };
  return icons[name] || '';
}

function renderSidebar(role, profile, user, activeKey) {
  const basePath = getBasePath();
  const items = buildNavItems(role, basePath);

  // Construire le HTML nav
  let navHTML = '';
  let lastSection = null;
  items.forEach(item => {
    if (item.section && item.section !== lastSection) {
      navHTML += `<div class="sidebar-section">${item.section}</div>`;
      lastSection = item.section;
    }
    const isActive = item.key === activeKey ? ' active' : '';
    navHTML += `<a class="sidebar-item${isActive}" href="${item.href}" data-label="${item.label}">${getIcon(item.icon)}<span class="nav-label">${item.label}</span></a>`;
  });

  const initials = (profile.prenom || '?')[0].toUpperCase();
  const photoURL  = user.photoURL || '';

  // Lire la préférence sauvegardée
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

  const sidebarHTML = `
    <nav class="sidebar${isCollapsed ? ' collapsed' : ''}" id="sidebar">
      <button class="sidebar-toggle" id="sidebar-toggle" onclick="toggleSidebar()" title="Réduire/Agrandir">
        <span id="sidebar-toggle-icon">${isCollapsed ? '›' : '‹'}</span>
      </button>
      <a class="sidebar-logo" href="${basePath}index.html">
        <img src="${basePath}assets/images/logo_sans_texte.png" style="width:28px;height:28px;object-fit:contain;flex-shrink:0"/>
        <div>
          <div class="sidebar-logo-text">My-ICN-JC</div>
          <div class="sidebar-logo-sub">Intranet</div>
        </div>
      </a>
      <div class="sidebar-nav">${navHTML}</div>
      <div class="sidebar-footer">
        <div class="sidebar-health">
          <div class="health-dot orange" id="health-dot"></div>
          <span id="health-label">Santé JE</span>
        </div>
        <div class="sidebar-user">
          ${photoURL
            ? `<img class="sidebar-avatar" src="${photoURL}" style="display:block" alt=""/>`
            : `<div class="sidebar-avatar-placeholder">${initials}</div>`}
          <span class="sidebar-username">${profile.prenom || user.displayName || user.email}</span>
        </div>
        <button class="sidebar-logout" onclick="doLogout()"><span class="sidebar-logout-icon">⏻</span><span class="sidebar-logout-text">Se déconnecter</span></button>
      </div>
    </nav>
  `;

  // Injecter dans le DOM
  const container = document.getElementById('sidebar-container');
  if (container) container.innerHTML = sidebarHTML +
    // Overlay mobile
    '<div class="sidebar-overlay" id="sidebar-overlay" onclick="closeMobileSidebar()"></div>' +
    // Bouton hamburger mobile
    '<button class="mobile-menu-btn" id="mobile-menu-btn" onclick="openMobileSidebar()">☰</button>';

  // Appliquer l'état au contenu principal
  const appContent = document.querySelector('.app-content');
  if (appContent && isCollapsed) appContent.classList.add('sidebar-collapsed');
}

function openMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (overlay) overlay.classList.add('active');
}

function closeMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (overlay) overlay.classList.remove('active');
}

function toggleSidebar() {
  const sidebar    = document.getElementById('sidebar');
  const appContent = document.querySelector('.app-content');
  const icon       = document.getElementById('sidebar-toggle-icon');
  if (!sidebar) return;
  const collapsed = sidebar.classList.toggle('collapsed');
  if (appContent) appContent.classList.toggle('sidebar-collapsed', collapsed);
  if (icon) icon.textContent = collapsed ? '›' : '‹';
  localStorage.setItem('sidebar-collapsed', collapsed);
}

// ── Calcul indicateur santé JE ─────────────────────────────────
async function updateHealthIndicator() {
  try {
    // Critères : tâches en retard, études actives, KPI
    const today = new Date().toISOString().split('T')[0];
    const lateTasks = await COLLECTIONS.tasks
      .where('status','!=','Terminé')
      .where('date','<', today)
      .get();

    const activeEtudes = await COLLECTIONS.etudes
      .where('statut','in',['En cours','Bloquée'])
      .get();

    let score = 100;
    score -= lateTasks.size * 5;      // -5 par tâche en retard
    activeEtudes.forEach(doc => {
      if (doc.data().statut === 'Bloquée') score -= 15;
    });

    const dot   = document.getElementById('health-dot');
    const label = document.getElementById('health-label');
    if (!dot || !label) return;

    if (score >= 75) {
      dot.className = 'health-dot green';
      label.innerText = 'Bonne santé';
    } else if (score >= 40) {
      dot.className = 'health-dot orange';
      label.innerText = 'Attention requise';
    } else {
      dot.className = 'health-dot red';
      label.innerText = 'Situation critique';
    }
  } catch(e) {
    // Silencieux si pas de droits
  }
}
