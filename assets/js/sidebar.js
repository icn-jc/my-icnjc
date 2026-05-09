// ── My-ICN-JC — Sidebar ───────────────────────────────────────

const SIDEBAR_CSS = `
  .sidebar{position:fixed;left:0;top:0;bottom:0;width:220px;background:#0f1923;display:flex;flex-direction:column;z-index:100;border-right:1px solid rgba(255,255,255,0.06);}
  .sidebar-logo{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:10px;text-decoration:none;}
  .sidebar-logo svg{width:28px;height:28px;flex-shrink:0;}
  .sidebar-logo-text{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:#fff;line-height:1.2;}
  .sidebar-logo-sub{font-size:9px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.12em;}
  .sidebar-nav{flex:1;overflow-y:auto;padding:12px 0;}
  .sidebar-section{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,0.25);padding:14px 20px 6px;}
  .sidebar-item{display:flex;align-items:center;gap:10px;padding:8px 20px;font-size:13px;color:rgba(255,255,255,0.55);text-decoration:none;transition:all .15s;cursor:pointer;border-left:2px solid transparent;}
  .sidebar-item:hover{color:#fff;background:rgba(255,255,255,0.05);}
  .sidebar-item.active{color:#fff;background:rgba(163,33,95,0.15);border-left-color:#A3215F;}
  .sidebar-item .icon{width:16px;height:16px;flex-shrink:0;opacity:.7;}
  .sidebar-item.active .icon{opacity:1;}
  .sidebar-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,0.06);}
  .sidebar-health{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:11px;color:rgba(255,255,255,0.4);}
  .health-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  .health-dot.green{background:#22c55e;box-shadow:0 0 6px #22c55e;}
  .health-dot.orange{background:#f59e0b;box-shadow:0 0 6px #f59e0b;}
  .health-dot.red{background:#ef4444;box-shadow:0 0 6px #ef4444;}
  .sidebar-user{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
  .sidebar-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;display:none;flex-shrink:0;}
  .sidebar-avatar-placeholder{width:28px;height:28px;border-radius:50%;background:rgba(163,33,95,0.4);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0;}
  .sidebar-username{font-size:12px;color:rgba(255,255,255,0.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sidebar-logout{width:100%;padding:7px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:7px;color:rgba(255,255,255,0.45);font-size:11px;cursor:pointer;font-family:inherit;transition:all .15s;}
  .sidebar-logout:hover{background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.3);color:#ef4444;}
  .app-content{margin-left:220px;min-height:100vh;}
  @media(max-width:768px){.sidebar{transform:translateX(-100%);transition:transform .25s;}.sidebar.open{transform:none;}.app-content{margin-left:0;}.mobile-menu-btn{display:flex;}}
  .mobile-menu-btn{display:none;position:fixed;top:12px;left:12px;z-index:200;width:38px;height:38px;background:#0f1923;border:1px solid rgba(255,255,255,0.1);border-radius:8px;align-items:center;justify-content:center;cursor:pointer;}
`;

// Structure de navigation par rôle
function buildNavItems(role, basePath) {
  const ALL = ['super_admin','president','vice_president','tresorerie','secretaire',
               'responsable_commercial','responsable_qualite','responsable_marketing',
               'marketing','auditeur','commercial'];
  const all = [
    { section: null, key:'home', label:'Accueil', icon:'home',
      href: basePath + 'index.html', roles: ALL },

    { section:'AUDIT', key:'tracker_treso', label:'Tracker Tréso', icon:'clipboard',
      href: basePath + 'audit/tracker_treso.html',
      roles:['super_admin','vice_president','tresorerie','responsable_qualite'] },

    { section:null, key:'tracker_orga', label:'Tracker Orga', icon:'check-square',
      href: basePath + 'audit/tracker_orga.html',
      roles:['super_admin','president','vice_president','responsable_qualite','auditeur'] },

    { section:'DASHBOARD', key:'kpi_treso', label:'KPI Trésorerie', icon:'trending-up',
      href: basePath + 'dashboard/kpi_treso.html',
      roles:['super_admin','president','vice_president','tresorerie','secretaire',
             'responsable_marketing','responsable_commercial','responsable_qualite'] },

    { section:null, key:'kpi_commercial', label:'KPI Commercial', icon:'bar-chart',
      href: basePath + 'dashboard/kpi_commercial.html',
      roles:['super_admin','president','vice_president','responsable_commercial',
             'secretaire','marketing','responsable_marketing','auditeur','commercial'] },

    { section:'CRM', key:'crm_prospection', label:'Prospection', icon:'target',
      href: basePath + 'crm/crm_prospection.html', roles: ALL },

    { section:null, key:'crm_clients', label:'Clients', icon:'briefcase',
      href: basePath + 'crm/crm_clients.html',
      roles:['super_admin','president','vice_president','responsable_commercial',
             'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'] },

    { section:null, key:'crm_intervenants', label:'Intervenants', icon:'users',
      href: basePath + 'crm/crm_intervenants.html',
      roles:['super_admin','president','vice_president','responsable_commercial',
             'responsable_marketing','responsable_qualite','secretaire','tresorerie'] },

    { section:null, key:'crm_partenariats', label:'Partenariats', icon:'link',
      href: basePath + 'crm/crm_partenariats.html',
      roles:['super_admin','president','vice_president','responsable_commercial',
             'responsable_marketing','responsable_qualite','secretaire','tresorerie','commercial'] },

    { section:'ÉTUDES', key:'etudes', label:'Suivi études', icon:'folder',
      href: basePath + 'etudes/etudes_index.html',
      roles:['super_admin','president','vice_president','responsable_commercial',
             'responsable_qualite','secretaire','tresorerie','responsable_marketing'] },

    { section:'ÉVÉNEMENTS', key:'evenements', label:'Événements', icon:'calendar',
      href: basePath + 'evenements/evenements_index.html', roles: ALL },

    { section:'ADMIN', key:'admin', label:'Administration', icon:'settings',
      href: basePath + 'admin/admin_index.html',
      roles:['super_admin','president'] },
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
  };
  return icons[name] || '';
}

function renderSidebar(role, profile, user, activeKey) {
  const basePath = getBasePath();
  const items = buildNavItems(role, basePath);

  // Injecter le CSS
  if (!document.getElementById('sidebar-css')) {
    const style = document.createElement('style');
    style.id = 'sidebar-css';
    style.textContent = SIDEBAR_CSS;
    document.head.appendChild(style);
  }

  // Construire le HTML
  let navHTML = '';
  let lastSection = null;
  items.forEach(item => {
    if (item.section && item.section !== lastSection) {
      navHTML += `<div class="sidebar-section">${item.section}</div>`;
      lastSection = item.section;
    } else if (!item.section && lastSection !== '__none__') {
      // Pas de séparateur pour les sous-items sans section
    }
    const isActive = item.key === activeKey ? ' active' : '';
    navHTML += `<a class="sidebar-item${isActive}" href="${item.href}">${getIcon(item.icon)}<span>${item.label}</span></a>`;
  });

  const initials = (profile.prenom || '?')[0].toUpperCase();
  const photoURL  = user.photoURL || '';

  const sidebarHTML = `
    <nav class="sidebar" id="sidebar">
      <a class="sidebar-logo" href="${basePath}index.html">
        <img src="${basePath}assets/images/logo_sans_texte.png" style="width:32px;height:32px;object-fit:contain"/>
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
        <button class="sidebar-logout" onclick="doLogout()">Se déconnecter</button>
      </div>
    </nav>
  `;

  // Injecter dans le DOM
  const container = document.getElementById('sidebar-container');
  if (container) container.innerHTML = sidebarHTML;
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
