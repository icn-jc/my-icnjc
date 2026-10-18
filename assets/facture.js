/* ═════════════════ FACTURES : calcul, PDF et Word ═════════════════
   La facture est créée UNE SEULE FOIS dans la compta (document `factures`, champ `doc` = photo de tout ce qui s'imprime).
   Le PDF et le Word sont ensuite régénérés à volonté depuis cette photo : jamais de nouvelle écriture.
   Bibliothèques chargées à la demande : assets/vendor/pdf-lib.min.js (PDF) et assets/vendor/docx.min.js (Word). */

/* Coordonnées de la JE : valeurs par défaut publiques. RIB / IBAN / BIC se saisissent dans Administration → Paramètres. */
const JE_DEFAUT = {
  nom: 'ICN Junior Conseil', forme: 'Association loi 1901, affiliée à la CNJE',
  adresse: '76 route de la Demi-Lune La Nef - Les Collines de l’Arche', cp_ville: '92800 Puteaux, France', tel: '',
  siret: '', siren: '', ape: '', tva_intra: '', rib: '', domiciliation: '', iban: '', bic: '', cheque_ordre: 'ICN Junior Conseil', president: ''
};
const FACTURE_TYPES = { Acompte: "Facture d'acompte", 'Intermédiaire': 'Facture intermédiaire', Solde: 'Facture de solde', Refacturation: 'Refacturation' };

/* ───────── Montant en lettres (français) ───────── */
const _U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const _D = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
function _sous1000(n) {
  let s = '';
  const c = Math.floor(n / 100), r = n % 100;
  if (c) s += (c > 1 ? _U[c] + ' ' : '') + 'cent' + (c > 1 && r === 0 ? 's' : '');
  if (r) {
    if (s) s += ' ';
    if (r < 20) s += _U[r];
    else if (r < 70) { const d = Math.floor(r / 10), u = r % 10; s += _D[d] + (u === 1 ? ' et un' : u ? '-' + _U[u] : ''); }
    else if (r < 80) { const u = r - 60; s += 'soixante' + (u === 11 ? ' et onze' : '-' + _U[u]); }
    else { const u = r - 80; s += 'quatre-vingt' + (u === 0 ? 's' : '-' + _U[u]); }
  }
  return s;
}
function nombreEnLettres(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'zéro';
  const parts = [];
  const mil = Math.floor(n / 1e6), k = Math.floor((n % 1e6) / 1000), r = n % 1000;
  if (mil) parts.push(_sous1000(mil) + ' million' + (mil > 1 ? 's' : ''));
  if (k) parts.push(k === 1 ? 'mille' : _sous1000(k).replace(/quatre-vingts$/, 'quatre-vingt').replace(/cents$/, 'cent') + ' mille');
  if (r) parts.push(_sous1000(r));
  return parts.join(' ');
}
function montantEnLettres(ttc) {
  const v = Math.round(Math.abs(num(ttc)) * 100), e = Math.floor(v / 100), c = v % 100;
  let s = nombreEnLettres(e) + (e > 1 ? ' euros' : ' euro') + ' et ' + nombreEnLettres(c) + (c > 1 ? ' centimes' : ' centime') + ' toutes taxes comprises';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ───────── Construction de la facture (calculs) ───────── */
const _r2 = n => Math.round(num(n) * 100) / 100;
/* Argent pour documents : espaces simples (compatibles avec la police du PDF). */
function moneyDoc(n) {
  const v = _r2(n), neg = v < 0, s = Math.abs(v).toFixed(2), p = s.split('.');
  return (neg ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + p[1] + ' €';
}
const _pct = n => String(num(n)).replace('.', ',');

/* Lignes de l'étude : phases actives + frais de structure ; repli sur une ligne unique si les phases ne correspondent pas au montant. */
function ligneseEtude(e) {
  const frais = num(e.frais_structure, 100), total = _r2(e.montant_ht);
  const rows = []; let sum = 0;
  (e.phases || []).forEach(p => {
    if (p.actif === false) return;
    const m = _r2(num(p.jeh_total) * num(p.montant_jeh)); if (!m) return;
    sum += m; rows.push({ label: (p.label || 'Phase') + ' (' + _pct(p.jeh_total) + ' Jours - Étude Homme)', montant: m });
  });
  if (!rows.length || Math.abs(sum + frais - total) > 0.5) {
    return [{ label: e.title || 'Prestations de l’étude', montant: _r2(total - frais) }, { label: 'Frais de structure', montant: frais }];
  }
  return [{ label: 'Frais de structure', montant: frais }].concat(rows);
}

/* opts : type, etude, client{nom,civilite,contact,adresse,cp_ville,siren}, prevHT, tauxAcompte, montant (intermédiaire),
   tva, date_emission, date_echeance, convention, denomination, objet (refacturation), lignes (refacturation), je
   → { montant_ht, doc } ou { erreur } */
function construireFacture(o) {
  const type = o.type, tva = num(o.tva, 20);
  const doc = { titre: FACTURE_TYPES[type] || 'Facture', type, client: o.client || {}, je: Object.assign({}, JE_DEFAUT, o.je || {}),
    tva_encaissements: true, lignes: [], deduction: null };
  let ht = 0;
  if (type === 'Refacturation') {
    doc.lignes = (o.lignes || []).filter(l => l.label && num(l.montant)).map(l => ({ label: l.label, montant: _r2(l.montant) }));
    if (!doc.lignes.length) return { erreur: 'Ajoute au moins une ligne avec un montant.' };
    ht = _r2(doc.lignes.reduce((a, l) => a + l.montant, 0));
    doc.objet = o.objet || 'Refacturation';
    doc.etude = null;
  } else {
    const e = o.etude; if (!e) return { erreur: 'Choisis une étude.' };
    const total = _r2(e.montant_ht), prev = _r2(o.prevHT), reste = _r2(total - prev), frais = num(e.frais_structure, 100);
    if (total <= 0) return { erreur: 'Cette étude n’a pas de montant HT.' };
    doc.lignes = ligneseEtude(e);
    doc.total_etude = total; doc.total_frais = frais; doc.total_prestations = _r2(total - frais);
    if (type === 'Acompte') {
      const t = num(o.tauxAcompte, 30);
      ht = _r2(total * t / 100); doc.taux_acompte = t;
      doc.net_label = 'Acompte de ' + _pct(t) + ' % du montant total de l’étude';
    } else if (type === 'Solde') {
      ht = reste;
      doc.net_label = 'Solde de l’étude';
    } else {
      ht = o.montant !== undefined && o.montant !== '' ? _r2(o.montant) : reste;
      doc.net_label = 'Montant de la présente facture intermédiaire';
    }
    if (prev > 0 && type !== 'Acompte') doc.deduction = { label: type === 'Solde' ? 'Déduction des factures précédentes (acomptes)' : 'Déjà facturé (factures précédentes)', montant: prev };
    if (type === 'Intermédiaire') doc.reste_apres = _r2(reste - ht);
    if (ht <= 0) return { erreur: 'Rien à facturer : l’étude est déjà entièrement facturée.' };
    if (ht > reste + 0.5) return { erreur: 'Le montant (' + moneyDoc(ht) + ' HT) dépasse le reste à facturer de l’étude (' + moneyDoc(reste) + ' HT).' };
    doc.etude = { ref: e.reference || '', denomination: o.denomination || e.title || '', convention: o.convention || ((e.reference || '') + '_CE'),
      nb_jeh: o.nb_jeh != null ? o.nb_jeh : num(e.jeh_total_etude), date_fin: o.date_fin || e.date_fin || '' };
    doc.objet = type === 'Acompte' ? "Facture d'acompte concernant l'étude " + doc.etude.ref + " en référence à la convention d'étude " + doc.etude.convention
      : (type === 'Solde' ? 'Facture de solde' : 'Facture intermédiaire') + " concernant l'étude " + doc.etude.ref + " en référence à la convention d'étude " + doc.etude.convention;
  }
  const ttc = _r2(ht * (1 + tva / 100));
  return { montant_ht: ht, taux_tva: tva, montant_tva: _r2(ttc - ht), montant_ttc: ttc, doc };
}

/* ───────── Modèle d'impression commun au PDF et au Word ───────── */
function modeleFacture(f) {
  const d = f.doc || {}, je = Object.assign({}, JE_DEFAUT, d.je || {}), c = d.client || {};
  const ht = _r2(f.montant_ht), tva = num(f.taux_tva, 20), ttc = factureTTC(f), tvaMt = _r2(ttc - ht);
  const contact = [c.civilite, c.contact].filter(Boolean).join(' ');
  const jeLines = [je.forme, je.adresse, je.cp_ville, je.tel && 'Tél : ' + je.tel, je.siret && 'SIRET : ' + je.siret, je.siren && 'SIREN : ' + je.siren,
    je.ape && 'Code APE : ' + je.ape, je.tva_intra && 'N° TVA intra : ' + je.tva_intra].filter(Boolean);
  const clientLines = [c.nom, contact, c.adresse, c.cp_ville, c.siren && 'SIREN du client : ' + c.siren].filter(Boolean);
  const etude = d.etude ? [['Étude n° : ', d.etude.ref], ['Dénomination service rendu : ', d.etude.denomination], ["Référence Convention d'Etude : ", d.etude.convention]] : null;
  const rows = (d.lignes || []).map(l => [l.label, moneyDoc(l.montant)]);
  const foot = [];
  if (d.etude) foot.push(['Total HT de l’étude', moneyDoc(d.total_etude)]);
  if (d.deduction) foot.push([d.deduction.label, moneyDoc(-d.deduction.montant)]);
  if (d.net_label) foot.push([d.net_label, moneyDoc(ht)]);
  const left = [['Date d’émission de la facture : ', fmtDate(f.date_emission)], ['Date d’échéance de la facture : ', fmtDate(f.date_echeance)]];
  if (d.etude) {
    left.push(['Nombre total de JEH : ', String(num(d.etude.nb_jeh))]);
    if (d.etude.date_fin) left.push(['Date de fin d’étude : ', fmtDate(d.etude.date_fin)]);
    left.push(['Montant total HT des prestations de l’étude : ', moneyDoc(d.total_prestations)]);
    left.push(['Montant total HT des frais de structure : ', moneyDoc(d.total_frais)]);
    left.push(['Montant total HT de l’étude : ', moneyDoc(d.total_etude)]);
    if (d.reste_apres != null) left.push(['Reste à facturer après cette facture (HT) : ', moneyDoc(d.reste_apres)]);
  } else left.push(['Montant total HT de la refacturation : ', moneyDoc(ht)]);
  const legal = ["Aucun escompte n'est accordé pour paiement anticipé",
    "En cas de retard de paiement, conformément à la loi 2008-776 du 4 août 2008, il sera appliqué des pénalités au taux de 3 fois le taux d'intérêt légal en vigueur.",
    "Cette pénalité court à compter de la date d'échéance jusqu'au jour du paiement complet des sommes dues.",
    'Règlement à la réception par chèque bancaire, postal ou virement uniquement.'];
  const pay = [je.rib && 'RIB : ' + je.rib, je.domiciliation && 'Domiciliation : ' + je.domiciliation, je.iban && 'IBAN : ' + je.iban, je.bic && 'BIC : ' + je.bic].filter(Boolean);
  return { numero: f.numero, titre: d.titre || 'Facture', je, jeLines, clientLines, etude, objet: d.objet || '', rows, foot, left,
    tva: { taux: _pct(tva) + ' %', montant: moneyDoc(tvaMt), ht: moneyDoc(ht) }, ttc: moneyDoc(ttc), lettres: montantEnLettres(ttc), tvaEnc: d.tva_encaissements !== false,
    legal, pay, cheque: je.cheque_ordre, adresseCheque: [je.nom, [je.adresse, je.cp_ville].filter(Boolean).join(', ')].filter(Boolean).join(', ') };
}

/* ───────── Outils communs ───────── */
const _loaded = {};
function chargerScript(src) {
  if (_loaded[src]) return _loaded[src];
  return (_loaded[src] = new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('Chargement impossible : ' + src)); document.head.appendChild(s); }));
}
async function _logoBytes() { const r = await fetch('assets/logo.png'); return new Uint8Array(await r.arrayBuffer()); }
function telecharger(blob, nom) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
const nomFichierFacture = (f, ext) => 'Facture_' + String(f.numero || '').replace(/[^\w-]+/g, '_') + '_' + String((f.doc && f.doc.client && f.doc.client.nom) || f.client_name || '').replace(/[^\w-]+/g, '_').slice(0, 30) + '.' + ext;

/* ───────── PDF (pdf-lib) ───────── */
async function facturePDF(f) {
  await chargerScript('assets/vendor/pdf-lib.min.js');
  const { PDFDocument, StandardFonts, rgb } = PDFLib, m = modeleFacture(f);
  const pdf = await PDFDocument.create(), reg = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const okChars = new Set(reg.getCharacterSet());
  const safe = s => Array.from(String(s == null ? '' : s).replace(/[  ]/g, ' ').replace(/[‘’]/g, '’'))
    .map(ch => okChars.has(ch.codePointAt(0)) ? ch : (ch.normalize('NFD').replace(/[̀-ͯ]/g, '')[0] || '?')).map(ch => okChars.has(ch.codePointAt(0)) ? ch : '?').join('');
  const W = 595.28, H = 841.89, M = 40, ink = rgb(0.1, 0.1, 0.14), grey = rgb(0.42, 0.42, 0.47), brand = rgb(0.56, 0.1, 0.27), line = rgb(0.8, 0.8, 0.84), fill = rgb(0.96, 0.95, 0.96);
  let page = pdf.addPage([W, H]), y = H - M;
  const width = (t, sz, b) => (b ? bold : reg).widthOfTextAtSize(safe(t), sz);
  const wrap = (t, sz, maxW, b) => {
    const out = []; String(t == null ? '' : t).split('\n').forEach(par => {
      let cur = ''; par.split(/\s+/).forEach(w => { const test = cur ? cur + ' ' + w : w; if (cur && width(test, sz, b) > maxW) { out.push(cur); cur = w; } else cur = test; });
      out.push(cur);
    }); return out;
  };
  const text = (t, x, yy, o) => {
    o = o || {}; const sz = o.size || 9, s = safe(t); let xx = x;
    if (o.align === 'right') xx = x - width(t, sz, o.bold); else if (o.align === 'center') xx = x - width(t, sz, o.bold) / 2;
    page.drawText(s, { x: xx, y: yy, size: sz, font: o.bold ? bold : reg, color: o.color || ink });
  };
  const para = (t, x, maxW, o) => { o = o || {}; const sz = o.size || 9, lh = sz * 1.35; wrap(t, sz, maxW, o.bold).forEach(l => { text(l, x, y - sz, o); y -= lh; }); };
  const need = h => { if (y - h < M + 20) { page = pdf.addPage([W, H]); y = H - M; } };
  const hr = (yy, x1, x2, c) => page.drawLine({ start: { x: x1 || M, y: yy }, end: { x: x2 || W - M, y: yy }, thickness: 0.6, color: c || line });

  // Logo + bloc JE (gauche), titre + client (droite)
  try { const img = await pdf.embedPng(await _logoBytes()), w = 120, h = w * img.height / img.width; page.drawImage(img, { x: M, y: H - M - h, width: w, height: h }); y = H - M - h - 8; } catch (e) { y = H - M; }
  const yLeftStart = y; para(m.je.nom, M, 240, { bold: true, size: 11 }); m.jeLines.forEach(l => para(l, M, 240, { size: 8.5, color: grey }));
  const yLeftEnd = y; y = H - M;
  const RX = 320, RW = W - M - RX;
  para(m.titre, RX, RW, { bold: true, size: 16, color: brand }); y -= 2;
  para('Facture N°' + m.numero, RX, RW, { bold: true, size: 12 }); y -= 10;
  para("A l'attention de :", RX, RW, { size: 8.5, color: grey });
  m.clientLines.forEach((l, i) => para(l, RX, RW, { bold: i === 0, size: 10 }));
  y = Math.min(yLeftEnd, y) - 16;

  if (m.etude) {
    para('En référence à la prestation de service suivante :', M, W - 2 * M, { bold: true, size: 9.5 }); y -= 2;
    m.etude.forEach(r => { para(r[0] + r[1], M, W - 2 * M, { size: 9 }); });
    y -= 8;
  }
  para('Objet : ' + m.objet, M, W - 2 * M, { bold: true, size: 9.5 }); y -= 8;

  // Tableau désignation / montant
  const cx = W - M;
  need(40); page.drawRectangle({ x: M, y: y - 16, width: W - 2 * M, height: 16, color: fill });
  text('Désignation', M + 6, y - 11.5, { bold: true, size: 9 }); text('Montant HT', cx - 6, y - 11.5, { bold: true, size: 9, align: 'right' }); y -= 16;
  const tr = (a, b, o) => {
    o = o || {}; const sz = 9, ls = wrap(a, sz, W - 2 * M - 110, o.bold), h = ls.length * 12 + 6; need(h);
    ls.forEach((l, i) => text(l, M + 6, y - 11 - i * 12, { size: sz, bold: o.bold })); text(b, cx - 6, y - 11, { size: sz, bold: o.bold, align: 'right' }); y -= h; hr(y);
  };
  m.rows.forEach(r => tr(r[0], r[1])); m.foot.forEach((r, i) => tr(r[0], r[1], { bold: i === m.foot.length - 1 }));
  y -= 14; need(170);

  // Bas : infos à gauche, TVA / TTC à droite
  const yBlock = y, LW = 250;
  m.left.forEach(r => { const ls = wrap(r[0] + r[1], 8.5, LW); ls.forEach(l => { text(l, M, y - 9, { size: 8.5 }); y -= 12; }); });
  const yLeft2 = y; y = yBlock;
  const bx = 330, bw = W - M - bx;
  page.drawRectangle({ x: bx, y: y - 16, width: bw, height: 16, color: fill });
  text('Taux TVA', bx + 6, y - 11.5, { bold: true, size: 8.5 }); text('Montant TVA', bx + bw * 0.5, y - 11.5, { bold: true, size: 8.5, align: 'center' }); text('Montant HT', bx + bw - 6, y - 11.5, { bold: true, size: 8.5, align: 'right' }); y -= 16;
  text(m.tva.taux, bx + 6, y - 12, { size: 9 }); text(m.tva.montant, bx + bw * 0.5, y - 12, { size: 9, align: 'center' }); text(m.tva.ht, bx + bw - 6, y - 12, { size: 9, align: 'right' }); y -= 18;
  if (m.tvaEnc) { text('TVA sur les encaissements.', bx + 6, y - 9, { size: 8, color: grey }); y -= 16; }
  page.drawRectangle({ x: bx, y: y - 22, width: bw, height: 22, color: brand });
  text('Total T.T.C. net à payer', bx + 8, y - 15, { bold: true, size: 9.5, color: rgb(1, 1, 1) }); text(m.ttc, bx + bw - 8, y - 15, { bold: true, size: 11, color: rgb(1, 1, 1), align: 'right' }); y -= 30;
  wrap(m.lettres, 8.5, bw).forEach(l => { text(l, bx, y - 9, { size: 8.5, bold: true }); y -= 12; });
  y = Math.min(y, yLeft2) - 16;

  // Mentions et paiement
  need(150);
  m.legal.forEach(l => para(l, M, W - 2 * M, { size: 7.5, color: grey })); y -= 8;
  para('Modalités de paiement :', M, W - 2 * M, { bold: true, size: 9 });
  para("Pour les versements — merci d'indiquer votre nom et le numéro de facture", M, W - 2 * M, { size: 8.5 });
  if (m.pay.length) m.pay.forEach(l => para(l, M + 12, W - 2 * M - 12, { size: 9, bold: true })); else para('Coordonnées bancaires à renseigner dans Administration.', M + 12, W - 2 * M, { size: 8.5, color: rgb(0.75, 0.15, 0.15) });
  y -= 4; para('Pour les chèques : à l’ordre de ' + m.cheque, M, W - 2 * M, { size: 8.5 });
  para('Pour un règlement par chèque, nous vous remercions d’envoyer votre règlement accompagné du papillon à l’adresse :', M, W - 2 * M, { size: 8, color: grey });
  para(m.adresseCheque, M, W - 2 * M, { size: 8.5, bold: true });

  pdf.setTitle('Facture ' + m.numero); pdf.setAuthor(m.je.nom);
  return new Blob([await pdf.save()], { type: 'application/pdf' });
}

/* ───────── Word (docx) ───────── */
async function factureWord(f) {
  await chargerScript('assets/vendor/docx.min.js');
  const D = docx, m = modeleFacture(f);
  const BRAND = '8F1A45', GREY = '6B6B78', NONE = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noB = { top: NONE, bottom: NONE, left: NONE, right: NONE };
  const run = (t, o) => new D.TextRun(Object.assign({ text: String(t == null ? '' : t), font: 'Calibri', size: 19 }, o || {}));
  const P = (t, o) => { o = o || {}; return new D.Paragraph({ alignment: o.align, spacing: { after: o.after != null ? o.after : 40, before: o.before || 0 }, children: [run(t, { bold: o.bold, size: o.size, color: o.color })] }); };
  const cell = (children, o) => new D.TableCell(Object.assign({ children, borders: noB, margins: { top: 40, bottom: 40, left: 90, right: 90 } }, o || {}));
  let logo = null; try { logo = new D.ImageRun({ type: 'png', data: await _logoBytes(), transformation: { width: 120, height: 79 } }); } catch (e) { /* sans logo */ }
  const left = [new D.Paragraph({ spacing: { after: 80 }, children: logo ? [logo] : [] }), P(m.je.nom, { bold: true, size: 22 })].concat(m.jeLines.map(l => P(l, { size: 17, color: GREY, after: 10 })));
  const right = [P(m.titre, { bold: true, size: 32, color: BRAND, after: 40 }), P('Facture N°' + m.numero, { bold: true, size: 24, after: 160 }), P("A l'attention de :", { size: 17, color: GREY })]
    .concat(m.clientLines.map((l, i) => P(l, { bold: i === 0, size: 20, after: 10 })));
  const head = new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new D.TableRow({ children: [cell(left, { width: { size: 48, type: D.WidthType.PERCENTAGE } }), cell(right, { width: { size: 52, type: D.WidthType.PERCENTAGE } })] })] });
  const body = [head, P('', { after: 120 })];
  if (m.etude) { body.push(P('En référence à la prestation de service suivante :', { bold: true, size: 20, after: 60 })); m.etude.forEach(r => body.push(new D.Paragraph({ spacing: { after: 20 }, children: [run(r[0], { size: 19 }), run(r[1], { size: 19, bold: true })] }))); body.push(P('', { after: 80 })); }
  body.push(P('Objet : ' + m.objet, { bold: true, size: 20, after: 120 }));
  const LINE = { style: D.BorderStyle.SINGLE, size: 4, color: 'CCCCD4' };
  const bb = { top: NONE, left: NONE, right: NONE, bottom: LINE };
  const trow = (a, b, o) => { o = o || {}; return new D.TableRow({ children: [new D.TableCell({ width: { size: 80, type: D.WidthType.PERCENTAGE }, borders: bb, shading: o.head ? { type: D.ShadingType.CLEAR, fill: 'F5F2F4' } : undefined, margins: { top: 50, bottom: 50, left: 90, right: 90 }, children: [P(a, { bold: o.bold || o.head, after: 0 })] }),
    new D.TableCell({ width: { size: 20, type: D.WidthType.PERCENTAGE }, borders: bb, shading: o.head ? { type: D.ShadingType.CLEAR, fill: 'F5F2F4' } : undefined, margins: { top: 50, bottom: 50, left: 90, right: 90 }, children: [P(b, { bold: o.bold || o.head, align: D.AlignmentType.RIGHT, after: 0 })] })] }); };
  body.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE },
    rows: [trow('Désignation', 'Montant HT', { head: true })].concat(m.rows.map(r => trow(r[0], r[1])), m.foot.map((r, i) => trow(r[0], r[1], { bold: i === m.foot.length - 1 }))) }));
  body.push(P('', { after: 140 }));
  const infos = m.left.map(r => new D.Paragraph({ spacing: { after: 30 }, children: [run(r[0], { size: 17 }), run(r[1], { size: 17, bold: true })] }));
  const tvaT = new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: [
    new D.TableRow({ children: ['Taux TVA', 'Montant TVA', 'Montant HT'].map(t => new D.TableCell({ borders: bb, shading: { type: D.ShadingType.CLEAR, fill: 'F5F2F4' }, children: [P(t, { bold: true, size: 17, after: 0, align: D.AlignmentType.CENTER })] })) }),
    new D.TableRow({ children: [m.tva.taux, m.tva.montant, m.tva.ht].map(t => new D.TableCell({ borders: bb, children: [P(t, { after: 0, align: D.AlignmentType.CENTER })] })) }),
    new D.TableRow({ children: [new D.TableCell({ columnSpan: 2, borders: noB, shading: { type: D.ShadingType.CLEAR, fill: BRAND }, children: [new D.Paragraph({ spacing: { before: 60, after: 60 }, children: [run('Total T.T.C. net à payer', { bold: true, color: 'FFFFFF' })] })] }),
      new D.TableCell({ borders: noB, shading: { type: D.ShadingType.CLEAR, fill: BRAND }, children: [new D.Paragraph({ alignment: D.AlignmentType.RIGHT, spacing: { before: 60, after: 60 }, children: [run(m.ttc, { bold: true, color: 'FFFFFF', size: 22 })] })] })] })] });
  const rightB = [tvaT].concat(m.tvaEnc ? [P('TVA sur les encaissements.', { size: 16, color: GREY, before: 40 })] : [], [P(m.lettres, { bold: true, size: 17, before: 60 })]);
  body.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new D.TableRow({ children: [cell(infos, { width: { size: 50, type: D.WidthType.PERCENTAGE } }), cell(rightB, { width: { size: 50, type: D.WidthType.PERCENTAGE } })] })] }));
  body.push(P('', { after: 160 }));
  m.legal.forEach(l => body.push(P(l, { size: 15, color: GREY, after: 20 })));
  body.push(P('Modalités de paiement :', { bold: true, size: 19, before: 140 }), P("Pour les versements — merci d'indiquer votre nom et le numéro de facture", { size: 17 }));
  (m.pay.length ? m.pay : ['Coordonnées bancaires à renseigner.']).forEach(l => body.push(P('      ' + l, { bold: true, size: 18, after: 10 })));
  body.push(P('Pour les chèques : à l’ordre de ' + m.cheque, { size: 17, before: 80 }), P('Pour un règlement par chèque, nous vous remercions d’envoyer votre règlement accompagné du papillon à l’adresse :', { size: 16, color: GREY }), P(m.adresseCheque, { bold: true, size: 17 }));
  const docu = new D.Document({ creator: m.je.nom, title: 'Facture ' + m.numero, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 800, bottom: 800, left: 900, right: 900 } } }, children: body }] });
  return D.Packer.toBlob(docu);
}

async function telechargerFacture(f, format) {
  const blob = format === 'word' ? await factureWord(f) : await facturePDF(f);
  telecharger(blob, nomFichierFacture(f, format === 'word' ? 'docx' : 'pdf'));
}
