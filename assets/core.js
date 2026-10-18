/* My-ICN-JC v2 — socle commun : Firebase, connexion, droits, navigation, utilitaires.
   Chaque page charge ce fichier puis appelle App.start('cle_page', function () { ... }). */

firebase.initializeApp({
  apiKey: 'AIzaSyBNf8Bfa0d2jKdldcobTMU3xj7Kwbbu8Tk',
  authDomain: 'my-icnjc.firebaseapp.com',
  projectId: 'my-icnjc',
  storageBucket: 'my-icnjc.firebasestorage.app',
  messagingSenderId: '563677014842',
  appId: '1:563677014842:web:8c9a638556c401066c3e03'
});
const db = firebase.firestore();
const auth = firebase.auth();
const FV = firebase.firestore.FieldValue;
const DOMAIN = 'icnjuniorconseil.com';

/* ═════════════════ RÔLES & DROITS ═════════════════
   Un membre peut avoir plusieurs rôles : il a accès à une page si AU MOINS un de ses rôles l'autorise. */
/* Comptes propriétaires : gardent toujours le rôle Super Admin, même si leur fiche membre est modifiée ou supprimée par erreur. */
const OWNERS = ['stella.yathe@icnjuniorconseil.com'];
const ROLE_LABELS = {
  super_admin: 'Super Admin', president: 'Président', vice_president: 'Vice-Président', tresorier: 'Trésorier',
  secretaire: 'Secrétaire général', responsable_commercial: 'Resp. Commercial', responsable_qualite: 'Resp. Qualité',
  responsable_marketing: 'Resp. Marketing', tresorerie: 'Trésorerie (pôle)', auditeur: 'Auditeur',
  marketing: 'Marketing (pôle)', commercial: 'Commercial', membre_cos: 'Membre COS',
  intervenant: 'Intervenant', tuteur: 'Tuteur', commercial_ext: 'Commercial externe'
};
const ROLE_ORDER = Object.keys(ROLE_LABELS);
const CA = ['super_admin', 'president', 'vice_president', 'tresorier', 'secretaire', 'responsable_commercial', 'responsable_qualite', 'responsable_marketing'];
const POLES = ['tresorerie', 'auditeur', 'marketing', 'commercial'];
const INTERNES = CA.concat(POLES, ['membre_cos']);
const EXTERNAL_ROLES = ['tuteur', 'commercial_ext', 'intervenant', 'membre_cos'];

const ACCESS = {
  index:        { view: INTERNES.concat(['tuteur', 'commercial_ext']) },
  prospection:  { view: INTERNES.concat(['tuteur', 'commercial_ext']), edit: INTERNES.concat(['commercial_ext']) },
  etudes:       { view: CA.concat(['tresorerie', 'membre_cos', 'tuteur', 'commercial_ext']),
                  edit: ['super_admin', 'president', 'vice_president', 'responsable_commercial', 'responsable_qualite'] },
  clients:      { view: CA.concat(['tresorerie', 'commercial', 'membre_cos', 'commercial_ext']),
                  edit: ['super_admin', 'president', 'vice_president', 'responsable_commercial'] },
  intervenants: { view: CA.concat(['tresorerie', 'membre_cos', 'commercial_ext']),
                  edit: ['super_admin', 'president', 'vice_president', 'responsable_commercial', 'secretaire'] },
  compta:       { view: ['super_admin', 'president', 'vice_president', 'tresorier', 'tresorerie', 'responsable_qualite', 'commercial_ext'],
                  edit: ['super_admin', 'tresorier', 'tresorerie'] },
  kpi:          { view: INTERNES.concat(['tuteur']) },
  missions:     { view: INTERNES.concat(['intervenant', 'commercial_ext']) },
  documents:    { view: ['super_admin', 'responsable_qualite'], edit: ['super_admin', 'responsable_qualite'] },
  admin:        { view: ['super_admin', 'president'], edit: ['super_admin', 'president'] }
};

const NAV = [
  { key: 'index', label: 'Accueil', href: 'index.html', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { sec: 'CRM' },
  { key: 'prospection', label: 'Prospection', href: 'prospection.html', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01' },
  { key: 'clients', label: 'Clients', href: 'clients.html', icon: 'M3 21V7l9-4 9 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01' },
  { key: 'intervenants', label: 'Intervenants', href: 'intervenants.html', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
  { sec: 'Études' },
  { key: 'etudes', label: 'Études', href: 'etudes.html', icon: 'M4 4h16v16H4zM4 9h16M9 9v11' },
  { key: 'missions', label: 'Mes missions', href: 'missions.html', icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9' },
  { key: 'documents', label: 'Documents', href: 'documents.html', icon: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 14h6M9 18h4' },
  { sec: 'Pilotage' },
  { key: 'kpi', label: 'Indicateurs', href: 'kpi.html', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { key: 'compta', label: 'Comptabilité', href: 'compta.html', icon: 'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { sec: 'Admin' },
  { key: 'admin', label: 'Administration', href: 'admin.html', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z' }
];

/* ═════════════════ RÈGLES MÉTIER PARTAGÉES ═════════════════ */
const STATUTS = ['À contacter', 'Pas de réponse', 'Rappel demandé', 'Contacté', 'RDV planifié', 'RDV effectué', 'Proposition envoyée', 'Négociation', 'Signé', 'Perdu'];
// Statuts qui comptent comme un vrai contact (objectifs, KPI). "À contacter" et "Pas de réponse" ne comptent pas.
const STATUTS_VALORISES = ['Contacté', 'Rappel demandé', 'RDV planifié', 'RDV effectué', 'Proposition envoyée', 'Négociation', 'Signé'];
const STATUTS_OUVERTS = ['Contacté', 'Rappel demandé', 'RDV planifié', 'RDV effectué', 'Proposition envoyée', 'Négociation'];
const STATUT_BADGE = { 'À contacter': '', 'Pas de réponse': '', 'Rappel demandé': 'b-warn', 'Contacté': 'b-info', 'RDV planifié': 'b-violet',
  'RDV effectué': 'b-violet', 'Proposition envoyée': 'b-pink', 'Négociation': 'b-warn', 'Signé': 'b-ok', 'Perdu': 'b-bad' };

const ETUDE_STATUTS = ['Prospection', 'Signé', 'En cours', 'Livré', 'Facturé', 'Clôturé'];
const ETUDE_SIGNEE = ['Signé', 'En cours', 'Livré', 'Facturé', 'Clôturé']; // = étude signée pour toutes les stats
const ETUDE_BADGE = { Prospection: 'b-info', 'Signé': 'b-ok', 'En cours': 'b-warn', 'Livré': 'b-violet', 'Facturé': 'b-pink', 'Clôturé': '' };

/* Calcul financier d'une étude : JEH × €/JEH par phase active, + frais de structure.
   Intervenants = taux % des JEH ; la JE garde le reste + les frais de structure. */
function calcEtude(e) {
  const taux = num(e.taux_intervenants, 50);
  const frais = num(e.frais_structure, 100);
  let jeh = 0, montantJeh = 0;
  (e.phases || []).forEach(p => {
    if (p.actif === false) return;
    jeh += num(p.jeh_total);
    montantJeh += num(p.jeh_total) * num(p.montant_jeh);
  });
  const brutIv = montantJeh * taux / 100;
  return { taux, frais, jeh, montantJeh, ht: montantJeh + frais, brutIv, partJe: montantJeh - brutIv + frais };
}
function montantBrutAssignation(jeh, montantJeh, taux) { return num(jeh) * num(montantJeh) * num(taux, 50) / 100; }

/* TVA : chaque facture porte son HT, son taux et son TTC. Les comparaisons avec l'étude se font toujours HT contre HT. */
const TVA_TAUX = [20, 10, 5.5, 0];
function round2(n) { return Math.round(num(n) * 100) / 100; }
function tvaTaux(f) { return num(f.taux_tva, 20); }
function factureTTC(f) { return f.montant_ttc != null && f.montant_ttc !== '' ? num(f.montant_ttc) : round2(num(f.montant_ht) * (1 + tvaTaux(f) / 100)); }
function etudeTTC(e) { return round2(num(e.montant_ht) * (1 + num(e.taux_tva, 20) / 100)); }
/* Encaissé HT d'une étude = somme HT de ses factures encaissées (ou ancienne saisie s'il n'y a aucune facture).
   Une étude marquée « soldée » par la trésorerie est considérée comme entièrement encaissée. */
function encaisseHT(e, factures) {
  if (e.solde_declare) return Math.max(num(e.montant_ht), round2((factures || []).filter(f => f.etude_id === e.id && f.statut === 'Encaissée').reduce((a, f) => a + num(f.montant_ht), 0)));
  const fs = (factures || []).filter(f => f.etude_id === e.id);
  return fs.length ? round2(fs.filter(f => f.statut === 'Encaissée').reduce((a, f) => a + num(f.montant_ht), 0)) : num(e.montant_encaisse);
}
/* Situation d'encaissement d'une étude, en mots simples.
   etat : 'solde' | 'reste' | 'frais' (montant HT enregistré sans les frais de structure) | 'trop' | 'vide' */
function situationEtude(e, factures) {
  const ht = num(e.montant_ht), enc = encaisseHT(e, factures), frais = num(e.frais_structure, 100), diff = round2(enc - ht);
  let etat = 'reste';
  if (!ht) etat = 'vide';
  else if (Math.abs(diff) <= 0.5) etat = 'solde';
  else if (diff > 0 && frais > 0 && Math.abs(diff - frais) <= 1) etat = 'frais';
  else if (diff > 0) etat = 'trop';
  return { ht, enc, reste: Math.max(0, round2(ht - enc)), ecart: diff, frais, etat };
}
const SITUATION_LABEL = { solde: ['Soldée', 'b-ok'], reste: ['Reste à encaisser', 'b-warn'], frais: ['Frais de structure oubliés', 'b-info'], trop: ['Encaissé > montant', 'b-bad'], vide: ['Montant manquant', 'b-warn'] };

/* Toute personne ayant le rôle intervenant (accès externe ou membre) doit avoir une fiche dans « Intervenants »,
   sinon on ne peut pas lui assigner de mission. Crée les fiches manquantes, renvoie le nombre créé. */
async function syncIntervenants() {
  const [ivs, ext, users] = await Promise.all([getAll(db.collection('intervenants')), getAll(db.collection('whitelist_emails')), getAll(db.collection('users'))]);
  const known = new Set(ivs.map(i => (i.email || '').toLowerCase()).filter(Boolean));
  const people = ext.filter(x => x.role === 'intervenant').map(x => ({ email: x.id, prenom: x.prenom, nom: x.nom }))
    .concat(users.filter(u => (u.roles || []).includes('intervenant')).map(u => ({ email: u.email || u.id, prenom: u.prenom, nom: u.nom })));
  let n = 0;
  for (const p of people) {
    const email = (p.email || '').toLowerCase();
    if (!email || known.has(email)) continue;
    known.add(email); n++;
    await db.collection('intervenants').add({ prenom: p.prenom || '', nom: p.nom || '', email, statut: 'Actif', disponibilite: 'Disponible', mandats_ids: [], note_interne: 0,
      notes: 'Fiche créée automatiquement depuis les accès du site.', created_at_str: today(), created_at: FV.serverTimestamp() });
  }
  return n;
}

/* Indicateurs d'un mandat, calculés à partir des données du site sur la période du mandat.
   Une étude compte pour le mandat si elle y est rattachée, ou (sans rattachement valide) si sa date de signature tombe dans la période.
   Quand le site n'a pas de données (anciens mandats), on reprend la valeur saisie à la main dans Administration → Mandats. */
function mandatStats(m, D) {
  const a = m.date_debut || '', b = m.date_fin || '9999-12-31';
  const ids = (D.mandats || []).map(x => x.id);
  const etudes = (D.etudes || []).filter(e => ETUDE_SIGNEE.includes(e.statut) &&
    (e.mandat_id === m.id || (!ids.includes(e.mandat_id) && inRange(e.date_signature || e.created_at_str, a, b))));
  const caSigne = etudes.reduce((s, e) => s + num(e.montant_ht), 0);
  const factures = D.factures || [];
  const caEnc = round2(etudes.reduce((s, e) => s + encaisseHT(e, factures), 0));
  const ivs = new Set();
  etudes.forEach(e => (e.phases || []).forEach(p => (p.intervenants || []).forEach(x => ivs.add(x.intervenant_id || x.email))));
  const P = D.prospects || [];
  const contactes = P.filter(p => inRange(p.first_contact_at, a, b)).length;
  const signes = P.filter(p => p.status === 'Signé' && inRange(p.last_contact_at, a, b)).length;
  const kt = m.kpi_treso || {}, kc = m.kpi_commercial || {};
  const pick = (auto, stored) => auto > 0 ? { v: auto, manual: false } : { v: num(stored), manual: num(stored) > 0 };
  return {
    caSigne: pick(caSigne, kt.ca_signe || kc.ca_signe),
    caEnc: pick(caEnc, kt.ca_encaisse),
    nbEtudes: pick(etudes.length, kt.nb_etudes || kc.nb_etudes_signees),
    panier: pick(etudes.length ? caSigne / etudes.length : 0, kt.panier_moyen || kc.panier_moyen),
    nbIv: pick(ivs.size, kt.nb_intervenants),
    contactes: pick(contactes, kc.nb_prospects),
    tauxConv: pick(contactes ? Math.round(signes / contactes * 100) : 0, kc.taux_conversion),
    transfo: pick(caSigne ? Math.round(caEnc / caSigne * 100) : 0, kt.taux_transformation),
    cash: num(kt.cash_disponible), marge: num(kt.marge_nette_moy), coutMoyen: num(kt.cout_moyen_etude), membresCa: num(kc.nb_membres_ca),
    etudes, signes
  };
}

/* ═════════════════ UTILITAIRES ═════════════════ */
function num(v, def) { const n = parseFloat(v); return isNaN(n) ? (def === undefined ? 0 : def) : n; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function eur(n) { return Math.round(num(n)).toLocaleString('fr-FR') + ' €'; }
function eurc(n) { return num(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function pad(n) { return String(n).padStart(2, '0'); }
function dateStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function today() { return dateStr(new Date()); }
function parseDate(s) { if (!s) return null; const p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); }
function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 864e5); }
function fmtDate(s) { if (!s) return '—'; const p = String(s).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
function longDate(d) { d = d || new Date(); const j = JOURS[d.getDay()]; return j[0].toUpperCase() + j.slice(1) + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear(); }

/* Semaine ISO (lundi → dimanche). key = 'AAAA-Wss' (même format que l'historique des objectifs). */
function isoWeek(s) {
  const d = parseDate(s || today());
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const thursday = new Date(monday); thursday.setDate(monday.getDate() + 3);
  const firstThu = new Date(thursday.getFullYear(), 0, 4);
  const week = 1 + Math.round(((thursday - firstThu) / 864e5 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
  const start = dateStr(monday);
  return { week, year: monday.getFullYear(), key: monday.getFullYear() + '-W' + pad(week), start, end: addDays(start, 6) };
}
function inRange(s, a, b) { s = (s || '').slice(0, 10); return !!s && (!a || s >= a) && (!b || s <= b); }
function initials(p, n) { return ((p || '?')[0] + (n || '')[0]).toUpperCase(); }
function fullName(u) { return u ? ((u.prenom || '') + ' ' + (u.nom || '')).trim() || u.email : ''; }

function toast(msg, isErr) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.toggle('err', !!isErr); t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
function fail(e) { console.error(e); toast('Erreur : ' + (e && e.message ? e.message : e), true); }

/* Clics : tout élément avec data-action="nom" appelle handlers.nom(élément, event). Plus aucun onclick dans le HTML généré. */
function onActions(handlers, root) {
  (root || document).addEventListener('click', ev => {
    const el = ev.target.closest('[data-action]');
    if (!el || !handlers[el.dataset.action]) return;
    ev.preventDefault();
    handlers[el.dataset.action](el, ev);
  });
}

/* Modales et panneaux : <div class="modal" id="x"> / <aside class="panel" id="x"> */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openPanel(id) { document.getElementById(id).classList.add('open'); overlay().classList.add('open'); overlay()._panel = id; }
function closePanel(id) { document.getElementById(id).classList.remove('open'); overlay().classList.remove('open'); }
function overlay() {
  let o = document.getElementById('overlay');
  if (!o) {
    o = document.createElement('div'); o.id = 'overlay'; o.className = 'overlay'; document.body.appendChild(o);
    o.addEventListener('click', () => { if (o._panel) closePanel(o._panel); });
  }
  return o;
}
document.addEventListener('click', ev => {
  const c = ev.target.closest('[data-close]');
  if (c) { const id = c.dataset.close; const el = document.getElementById(id); if (el.classList.contains('panel')) closePanel(id); else closeModal(id); }
  if (ev.target.classList && ev.target.classList.contains('modal')) ev.target.classList.remove('open');
});
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Escape') return;
  document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  document.querySelectorAll('.panel.open').forEach(p => closePanel(p.id));
});

/* Lit les champs d'un formulaire : <input data-f="nom"> → { nom: valeur } (nombres pour type=number). */
function readForm(root) {
  const out = {};
  root.querySelectorAll('[data-f]').forEach(el => {
    out[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? null : num(el.value)) : el.value.trim();
  });
  return out;
}
function fillForm(root, data) {
  root.querySelectorAll('[data-f]').forEach(el => {
    const v = data[el.dataset.f];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v;
  });
}
function options(list, current, placeholder) {
  return (placeholder !== undefined ? '<option value="">' + esc(placeholder) + '</option>' : '') +
    list.map(o => { const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(current == null ? '' : current) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');
}

/* Écoute une collection en temps réel → tableau [{id, ...}] */
function watch(ref, cb) {
  return ref.onSnapshot(snap => cb(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))), fail);
}
function getAll(ref) { return ref.get().then(snap => snap.docs.map(d => Object.assign({ id: d.id }, d.data()))); }

/* Export Excel (SheetJS chargé à la demande) */
function exportExcel(fileName, sheets) {
  const run = () => {
    const wb = XLSX.utils.book_new();
    Object.keys(sheets).forEach(name => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheets[name]), name.slice(0, 31)));
    XLSX.writeFile(wb, fileName);
  };
  if (window.XLSX) return run();
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = run; s.onerror = () => toast('Impossible de charger l’export Excel', true);
  document.head.appendChild(s);
}

/* ═════════════════ APPLICATION ═════════════════ */
const App = {
  user: null,
  can(page, kind) {
    if (!this.user) return false;
    const rule = ACCESS[page]; if (!rule) return false;
    const list = rule[kind || 'view'] || [];
    return this.user.roles.some(r => list.includes(r));
  },
  canEdit(page) { return this.can(page, 'edit'); },
  has(role) { return !!this.user && this.user.roles.includes(role); },
  isCA() { return !!this.user && (this.user.membre_ca === true || this.user.roles.some(r => CA.includes(r))); },
  isSA() { return this.has('super_admin'); },
  home() { return this.can('index') ? 'index.html' : 'missions.html'; },

  start(pageKey, ready) {
    this.page = pageKey;
    const main = document.querySelector('main');
    main.hidden = true;
    auth.onAuthStateChanged(async fbUser => {
      if (!fbUser) return this.showLogin();
      try {
        const profile = await this.loadProfile(fbUser);
        if (!profile) {
          return this.showLogin('Ton adresse ' + fbUser.email + ' n’est pas autorisée. Demande à Stella ou au Président de t’ajouter dans Administration.', true);
        }
        this.user = profile;
        if (!this.can(pageKey)) { location.replace(this.home()); return; }
        this.buildLayout(main);
        main.hidden = false;
        document.getElementById('login') && document.getElementById('login').remove();
        ready && ready();
      } catch (e) {
        this.showLogin('Erreur de connexion : ' + e.message, true);
      }
    });
  },

  async loadProfile(fbUser) {
    const email = (fbUser.email || '').toLowerCase().trim();
    const internal = email.endsWith('@' + DOMAIN);
    let doc = null, externe = false;
    if (internal) {
      doc = await db.collection('users').doc(email).get();
      if (!doc.exists && OWNERS.includes(email)) doc = { exists: true, data: () => ({ prenom: 'Stella', nom: 'YATHE', roles: ['super_admin'] }) };
    } else {
      doc = await db.collection('whitelist_emails').doc(email).get();
      externe = doc.exists;
      if (!doc.exists) doc = await db.collection('users').doc(email).get();
    }
    if (!doc.exists) {
      // Un intervenant enregistré dans « Intervenants » avec cet email accède automatiquement à « Mes missions »
      const iv = await db.collection('intervenants').where('email', '==', email).limit(1).get();
      if (iv.empty) return null;
      const d = iv.docs[0].data();
      return { email, uid: fbUser.uid, photo: fbUser.photoURL || '', prenom: d.prenom || email.split('@')[0], nom: d.nom || '',
        roles: ['intervenant'], role: 'intervenant', prospecte: false, membre_ca: false, externe: !internal, data: d };
    }
    const d = doc.data();
    let roles = Array.isArray(d.roles) && d.roles.length ? d.roles.slice() : (d.role ? [d.role] : []);
    if (!roles.length) roles = externe ? ['tuteur'] : ['commercial'];
    if (OWNERS.includes(email) && !roles.includes('super_admin')) roles.push('super_admin'); // filet de sécurité
    roles.sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
    return {
      email, uid: fbUser.uid, photo: fbUser.photoURL || '',
      prenom: d.prenom || (fbUser.displayName || '').split(' ')[0] || email.split('@')[0],
      nom: d.nom || '', roles, role: roles[0],
      prospecte: externe ? false : d.prospecte === true,
      membre_ca: d.membre_ca === true, externe, data: d
    };
  },

  showLogin(msg, signOut) {
    if (signOut) auth.signOut();
    document.querySelector('main').hidden = true;
    let el = document.getElementById('login');
    if (!el) { el = document.createElement('div'); el.id = 'login'; el.className = 'login'; document.body.prepend(el); }
    el.innerHTML = '<div class="login-art"><img src="assets/logo-mark-xl.png" alt="">' +
        '<p><b>L\u2019intranet d\u2019ICN Junior Conseil</b>Prospection, études, intervenants et pilotage du mandat, au même endroit.</p></div>' +
      '<div class="login-form"><img src="assets/logo.png" alt="ICN Junior Conseil">' +
        '<h1>Connexion</h1><p>Utilise ton compte Google ICN Junior Conseil ou l\u2019adresse qui t\u2019a été autorisée.</p>' +
        '<button class="google-btn" id="google-btn"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="">Se connecter avec Google</button>' +
        (msg ? '<div class="login-msg">' + esc(msg) + '</div>' : '') +
        '<div class="login-foot">Un souci d\u2019accès ? Contacte Stella ou le Président.</div></div>';
    document.getElementById('google-btn').onclick = () => {
      const p = new firebase.auth.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      auth.signInWithPopup(p).catch(e => {
        if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
        this.showLogin('Erreur : ' + e.message);
      });
    };
  },

  buildLayout(main) {
    if (document.querySelector('.layout')) return;
    const u = this.user;
    let mini = false; try { mini = localStorage.getItem('side-mini') === '1'; } catch (e) {}
    let nav = '', pendingSec = null;
    NAV.forEach(n => {
      if (n.sec) { pendingSec = n.sec; return; }
      if (!this.can(n.key)) return;
      if (pendingSec) { nav += '<div class="side-sec">' + pendingSec + '</div>'; pendingSec = null; }
      nav += '<a class="side-link' + (n.key === this.page ? ' on' : '') + '" href="' + n.href + '" title="' + n.label + '">' +
        '<svg viewBox="0 0 24 24"><path d="' + n.icon + '"/></svg><span class="label">' + n.label + '</span></a>';
    });
    const avatar = u.photo ? '<img src="' + esc(u.photo) + '" alt="">' : '<span class="avatar">' + esc(initials(u.prenom, u.nom)) + '</span>';
    const layout = document.createElement('div');
    layout.className = 'layout';
    layout.innerHTML =
      '<button class="burger" id="burger" aria-label="Menu">☰</button><div class="scrim" id="scrim"></div>' +
      '<aside class="side' + (mini ? ' mini' : '') + '" id="side">' +
        '<div class="side-head"><img src="assets/logo-mark.png" alt=""><div class="side-title">My-ICN-JC<small>Intranet</small></div>' +
        '<button class="side-toggle" id="side-toggle" title="Réduire / agrandir">' + (mini ? '›' : '‹') + '</button></div>' +
        '<nav class="side-nav">' + nav + '</nav>' +
        '<div class="side-foot"><div class="side-user" title="' + esc(u.email) + '">' + avatar + '<div><b>' + esc(u.prenom) + '</b><span>' + esc(ROLE_LABELS[u.role] || u.role) + '</span><span class="side-mail">' + esc(u.email) + '</span></div></div>' +
        '<button class="side-logout" id="logout" title="Se déconnecter">⏻ <span class="label">Se déconnecter</span></button></div>' +
      '</aside>';
    main.parentNode.insertBefore(layout, main);
    layout.appendChild(main);
    main.classList.add('main');
    const side = document.getElementById('side');
    document.getElementById('side-toggle').onclick = () => {
      side.classList.toggle('mini');
      const m = side.classList.contains('mini');
      document.getElementById('side-toggle').textContent = m ? '›' : '‹';
      try { localStorage.setItem('side-mini', m ? '1' : '0'); } catch (e) {}
    };
    const scrim = document.getElementById('scrim');
    document.getElementById('burger').onclick = () => { side.classList.add('open'); scrim.classList.add('open'); };
    scrim.onclick = () => { side.classList.remove('open'); scrim.classList.remove('open'); };
    document.getElementById('logout').onclick = () => auth.signOut().then(() => location.reload());
  }
};
