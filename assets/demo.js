/* Données de démonstration — tout est marqué demo: true et nommé « [Démo] … » pour être supprimé d'un clic.
   Chargé uniquement par admin.html (Super Admin). */
const DEMO_COLLECTIONS = ['prospects', 'prospects_rdv', 'clients', 'intervenants', 'etudes', 'factures', 'documents'];

async function demoCount() {
  const n = await Promise.all(DEMO_COLLECTIONS.map(c => db.collection(c).where('demo', '==', true).get().then(s => s.size)));
  return n.reduce((a, b) => a + b, 0);
}

async function demoCreate(users, mandats) {
  const T = today(), d = k => addDays(T, k);
  const prospectors = users.filter(u => u.prospecte).map(u => u.email || u.id).slice(0, 3);
  const owners = prospectors.length ? prospectors : [App.user.email];
  const owner = i => owners[i % owners.length];
  const mandat = (mandats.find(m => m.statut === 'actif') || {}).id || '';
  const base = { demo: true, created_at: FV.serverTimestamp() };
  const add = (c, o) => db.collection(c).add(Object.assign({}, base, o)).then(r => r.id);

  /* Prospects : un par statut, répartis sur 8 semaines, avec historique d'actions */
  const P = [
    ['Boulangeries Mercier', 'Agroalimentaire', 'À contacter', null], ['Atelier Kervran', 'Artisanat', 'Pas de réponse', -3],
    ['Transports Lorrains', 'Logistique', 'Rappel demandé', -5], ['Clinique du Parc', 'Santé', 'Contacté', -2],
    ['Nancy Vélo Services', 'Mobilité', 'Contacté', -9], ['Studio Lumen', 'Communication', 'RDV planifié', -12],
    ['Brasserie des Vosges', 'Agroalimentaire', 'RDV effectué', -16], ['Cabinet Oréal Conseil', 'Conseil', 'Proposition envoyée', -20],
    ['GreenTech Est', 'Énergie', 'Négociation', -26], ['Maison Halbert', 'Luxe', 'Signé', -33],
    ['Optique Stanislas', 'Commerce', 'Perdu', -40], ['Domaine Saint-Rémy', 'Viticulture', 'Contacté', -47],
    ['Fromagerie Lehmann', 'Agroalimentaire', 'Proposition envoyée', -54], ['Coworking La Fabrique', 'Immobilier', 'RDV planifié', -6]
  ];
  const created = [];
  for (let i = 0; i < P.length; i++) {
    const [name, sector, status, off] = P[i];
    const first = off === null || status === 'Pas de réponse' ? '' : d(off);
    const amount = [0, 0, 0, 2500, 3000, 4500, 6000, 8000, 12000, 9500, 3500, 2000, 5000, 4000][i];
    const p = {
      company_name: '[Démo] ' + name, sector, source: ['Réseau', 'LinkedIn', 'Salon', 'Cap Financial'][i % 4], status,
      contact_name: ['Claire Martin', 'Hugo Petit', 'Sophie Laurent', 'Karim Benali'][i % 4], contact_poste: ['Gérant(e)', 'Directeur marketing', 'DAF', 'Responsable RH'][i % 4],
      contact_email: 'contact' + i + '@demo.example', contact_phone: '03 83 00 00 ' + pad(i), estimated_amount: amount, priority: i % 5 === 0 ? 'Haute' : 'Normale',
      tags: '', notes: 'Prospect fictif pour tester le module.', owner_email: owner(i), first_contact_at: first, last_contact_at: first ? d(Math.min(-1, off + 3)) : '',
      had_valuable_contact: !!first, next_action_at: ['Rappel demandé', 'Contacté', 'Proposition envoyée'].includes(status) ? d(i % 3 === 0 ? -2 : 4) : '',
      rdv_date: status === 'RDV planifié' ? d(3 + i % 4) : (['RDV effectué', 'Proposition envoyée', 'Négociation', 'Signé'].includes(status) && off !== null ? d(off + 7) : ''),
      created_at_str: off === null ? T : d(off - 2)
    };
    const id = await add('prospects', p);
    created.push(Object.assign({ id }, p));
    const acts = [];
    if (status === 'Pas de réponse') acts.push({ canal: 'Appel', date: d(-3), note: 'Messagerie, rappeler.', new_status: 'Pas de réponse' });
    if (first) acts.push({ canal: i % 2 ? 'Mail' : 'Appel', date: first, note: 'Premier échange, intérêt pour une étude.', new_status: 'Contacté' });
    if (p.rdv_date && first) acts.push({ canal: 'Appel', date: d(off + 2), note: 'RDV calé.', new_status: 'RDV planifié', rdv_date: p.rdv_date });
    if (['Proposition envoyée', 'Négociation', 'Signé'].includes(status)) acts.push({ canal: 'Mail', date: d(off + 9), note: 'Proposition commerciale envoyée.', new_status: 'Proposition envoyée', new_amount: amount });
    if (['Négociation', 'Signé'].includes(status)) acts.push({ canal: 'RDV', date: d(off + 14), note: 'Discussion sur le budget.', new_status: 'Négociation' });
    if (status === 'Signé') acts.push({ canal: 'Mail', date: d(off + 18), note: 'Convention signée.', new_status: 'Signé' });
    if (status === 'Perdu') acts.push({ canal: 'Appel', date: d(off + 10), note: 'Pas de budget cette année.', new_status: 'Perdu' });
    for (const a of acts) await db.collection('prospects').doc(id).collection('actions').add(Object.assign({ created_by: p.owner_email, created_at: a.date, created_ts: FV.serverTimestamp() }, a));
  }

  /* RDV : un à venir, un passé à débriefer, un débriefé */
  const byName = n => created.find(p => p.company_name === '[Démo] ' + n);
  for (const [n, signe, extra] of [['Studio Lumen', '', {}], ['Coworking La Fabrique', '', {}],
    ['Brasserie des Vosges', 'En attente retour client', { notes_apres: 'Besoin d’une étude de marché pour une nouvelle gamme.', demande: 'Étude consommateurs Grand Est', montant: 6000 }],
    ['Cabinet Oréal Conseil', 'Proposition envoyée', { notes_apres: 'Intéressés par un benchmark concurrentiel.', montant: 8000 }]]) {
    const p = byName(n);
    await add('prospects_rdv', Object.assign({ prospect_id: p.id, entreprise: p.company_name, date: p.rdv_date || d(-4), heure: '14:00', type_rdv: 'Visio',
      owner_email: p.owner_email, owner_name: p.owner_email, signe }, extra));
  }
  // Un RDV passé jamais débriefé (alerte sur l'accueil)
  const lumen = byName('Coworking La Fabrique');
  await add('prospects_rdv', { prospect_id: lumen.id, entreprise: '[Démo] Visite Coworking (non débriefé)', date: d(-2), heure: '10:00', type_rdv: 'Présentiel', owner_email: lumen.owner_email, owner_name: lumen.owner_email, signe: '' });

  /* Clients */
  const C = {};
  for (const [n, sector, ville, code] of [['Maison Halbert', 'Luxe', 'Nancy', 'DEMO01'], ['Région Grand Est — Service Jeunesse', 'Public', 'Metz', 'DEMO02'],
    ['Pharma Lorraine', 'Santé', 'Nancy', 'DEMO03'], ['Startup Kubik', 'Tech', 'Strasbourg', 'DEMO04']]) {
    C[n] = await add('clients', { company_name: '[Démo] ' + n, sector, ville, code_comptable: code, status: 'Actif', email: 'contact@demo.example', tel: '', website: '',
      contacts: [{ nom: 'Julie Robert', poste: 'Directrice', email: 'julie@demo.example', tel: '06 00 00 00 00' }],
      styles: ['Direct'], canaux: ['Email', 'Visio'], frequence: 'Hebdomadaire', note_relation: 4, notes_passation: 'Client fictif.', created_at_str: d(-60) });
  }

  /* Intervenants */
  const IV = [];
  for (const [prenom, nom, spe] of [['Léa', 'Fontaine', 'Marketing'], ['Mehdi', 'Rousseau', 'Finance'], ['Inès', 'Garnier', 'Stratégie'], ['Tom', 'Moreau', 'Data']]) {
    const email = (prenom + '.' + nom).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@demo.example';
    const id = await add('intervenants', { prenom, nom: nom + ' [Démo]', email, ecole: 'ICN Business School', niveau: 'M1', specialite: spe, situation: 'Étudiant',
      ville: 'Nancy', langues: 'Français, Anglais', competences: spe + ', Excel, PowerPoint', statut: 'Actif', disponibilite: 'Disponible',
      mandats_ids: mandat ? [mandat] : [], notation: 4, notes: 'Intervenant fictif.', created_at_str: d(-90) });
    IV.push({ id, nom: prenom + ' ' + nom, email });
  }

  /* Études : couvre tous les cas (en cours, livrée à facturer, soldée, à compléter, trop-perçu) */
  const phase = (label, jeh, prix, ivs) => {
    const p = { id: 'ph_' + Math.random().toString(36).slice(2, 9), label, sub: '', jeh_total: jeh, montant_jeh: prix, actif: true, intervenants: [] };
    (ivs || []).forEach(([iv, j, st]) => p.intervenants.push({ intervenant_id: iv.id, nom: iv.nom, email: iv.email, jeh: j, montant_brut: montantBrutAssignation(j, prix, 50), statut: st || 'Assigné' }));
    return p;
  };
  const E = [
    { k: 'halbert', reference: 'DEMHAL01', title: '[Démo] Étude de marché — nouvelle collection', client: 'Maison Halbert', type_etude: 'Étude de marché', statut: 'En cours', sig: -30,
      phases: [phase('Cadrage', 2, 400, [[IV[0], 2, 'Terminé']]), phase('Collecte', 6, 400, [[IV[0], 3], [IV[2], 3]]), phase('Restitution', 2, 400, [[IV[2], 2]])] },
    { k: 'region', reference: 'DEMREG01', title: '[Démo] Sondage jeunesse', client: 'Région Grand Est — Service Jeunesse', type_etude: 'Sondage', statut: 'Livré', sig: -70,
      phases: [phase('Conception', 3, 350, [[IV[3], 3, 'Terminé']]), phase('Analyse', 5, 350, [[IV[3], 5, 'Terminé']])] },
    { k: 'pharma', reference: 'DEMPHA01', title: '[Démo] Business plan', client: 'Pharma Lorraine', type_etude: 'Business plan', statut: 'Facturé', sig: -100,
      phases: [phase('Analyse', 4, 450, [[IV[1], 4, 'Terminé']]), phase('Construction', 4, 450, [[IV[1], 4, 'Terminé']])] },
    { k: 'kubik', reference: 'DEMKUB01', title: '[Démo] Benchmark concurrentiel', client: 'Startup Kubik', type_etude: 'Benchmark', statut: 'Signé', sig: -5, phases: [], a_completer: true }
  ];
  const EID = {};
  for (const e of E) {
    const c = calcEtude({ phases: e.phases, frais_structure: 100, taux_intervenants: 50 });
    EID[e.k] = await add('etudes', {
      reference: e.reference, title: e.title, client_id: C[e.client], client_name: '[Démo] ' + e.client, type_etude: e.type_etude, statut: e.statut,
      montant_ht: c.ht, montant_encaisse: 0, taux_tva: 20, frais_structure: 100, taux_intervenants: 50, jeh_total_etude: c.jeh,
      date_signature: d(e.sig), date_debut: d(e.sig + 7), date_fin: d(e.sig + 60), responsable_email: owner(0), phases: e.phases, intervenants: [], avenants: [],
      mandat_id: mandat, a_completer: !!e.a_completer, source: e.a_completer ? 'prospection' : '', description: 'Étude fictive pour tester les modules.',
      notes: '', created_at_str: d(e.sig)
    });
    e.ht = c.ht;
    for (const p of e.phases) for (const a of p.intervenants) {
      await add('documents', { type: 'RM', etude_id: EID[e.k], etude_ref: e.reference, phase_id: p.id, phase_label: p.label, intervenant_id: a.intervenant_id,
        intervenant_nom: a.nom, intervenant_email: a.email, nom_affiche: 'RM — ' + e.reference + ' — ' + p.label + ' — ' + a.nom,
        lien_gdrive: a.statut === 'Terminé' ? 'https://drive.google.com/demo' : '', statut: a.statut === 'Terminé' ? 'lien_ajoute' : 'en_attente_lien', vu_par_intervenant: false });
    }
  }

  /* Factures : acompte encaissé, facture en retard, étude soldée, trop-perçu (TTC saisi dans le HT) */
  const ht = k => E.find(e => e.k === k).ht;
  const F = [
    ['DEMO-FA-001', 'halbert', 'Acompte', round2(ht('halbert') * 0.3), 'Encaissée', -25, -10],
    ['DEMO-FA-002', 'region', 'Unique', ht('region'), 'En attente', -40, -10],
    ['DEMO-FA-003', 'pharma', 'Acompte', round2(ht('pharma') * 0.5), 'Encaissée', -95, -80],
    ['DEMO-FA-004', 'pharma', 'Solde', round2(ht('pharma') * 0.6), 'Encaissée', -40, -20] // volontairement trop : simule une saisie TTC dans le HT
  ];
  for (const [numero, k, type, mht, statut, em, enc] of F) {
    const e = E.find(x => x.k === k), ttc = round2(mht * 1.2);
    await add('factures', { numero, etude_id: EID[k], etude_ref: e.reference, client_name: '[Démo] ' + e.client, type, montant_ht: mht, taux_tva: 20,
      montant_tva: round2(ttc - mht), montant_ttc: ttc, statut, date_emission: d(em), date_echeance: d(em + 30), date_encaissement: statut === 'Encaissée' ? d(enc) : '',
      notes: k === 'pharma' && type === 'Solde' ? 'Erreur volontaire : à corriger dans la démo.' : '', created_by: App.user.email });
  }
  for (const k of Object.keys(EID)) {
    const fs = F.filter(f => f[1] === k && f[4] === 'Encaissée'), h = fs.reduce((a, f) => a + f[3], 0);
    await db.collection('etudes').doc(EID[k]).update({ montant_encaisse: round2(h), montant_encaisse_ttc: round2(h * 1.2) });
  }
}

async function demoDelete() {
  let n = 0;
  for (const c of DEMO_COLLECTIONS) {
    const snap = await db.collection(c).where('demo', '==', true).get();
    for (const doc of snap.docs) {
      if (c === 'prospects') {
        const acts = await doc.ref.collection('actions').get();
        await Promise.all(acts.docs.map(a => a.ref.delete()));
      }
      await doc.ref.delete(); n++;
    }
  }
  return n;
}
