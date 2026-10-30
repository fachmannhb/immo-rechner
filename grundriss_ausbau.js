/* Oberfläche „Innenausbau aus dem Plan“ und „Materialwahl“ (Welle D, Teil 2a). Alle Zahlen rechnet ausbau_kern.js (rein, läuft auch in Node); hier steht nur Darstellung und Bedienung.
   Vier Stellen, eine Rechnung:
   1. Karte „Was kostet der Innenausbau?“ im Grundriss (#g-ausbau-inhalt): Mengen aus dem gezeichneten Plan × Preisspannen aus daten/innenausbau.js, drei Ausstattungsstufen.
   2. Karte „Material für Ihr Haus“ im Grundriss (#g-material-inhalt): Material je Bauteil wählen (plan.material), Kosten, U-Wert, Heizwärme (Näherung) sofort.
   3. Bereich „Material vergleichen“ (#material): Materialien nebeneinander mit Balken je Eigenschaft, Rechner mit eigener Fläche, „In meine Planung übernehmen“. Funktioniert ohne Plan.
   4. Hinweis im Umbau (#u-ausbau-hinweis): „Aus dem Grundriss: Innenausbau X bis Y €“ und Knopf „Mengen übernehmen“ (füllt die Mengenfelder u-m-…).
   Texte: daten/texte_ausbau.js (de/en/ru); Material- und Quellennamen sind Datenzeilen und bleiben Deutsch. Jede Zahl trägt Quelle, Abruf und Status (R073); Annahmen sind als Annahme gekennzeichnet (R005).
   Keine Bau-, Kauf- oder Anlageberatung (R078): Ampeln sind „eigene Einordnung“. */
(function () {
  'use strict';
  var K = window.AUSBAU_KERN, G = window.GRUNDRISS, D = window.DATEN || {};
  var SCHLUESSEL = 'immo-ausbau';
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { return window.TXT ? window.TXT.lang() : 'de'; }
  function nf(d) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function n0(x) { return nf(0).format(x); }
  function n1(x) { return nf(1).format(x); }
  function n2(x) { return nf(2).format(x); }
  function n3(x) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: 3, maximumFractionDigits: 4 }).format(x); }   /* λ: 0,035 und 0,0375 */
  function eur(x) { return n0(x) + ' €'; }
  function r100(x) { return Math.round(x / 100) * 100; }
  function bis(a, b, f) { f = f || n0; return a === b ? f(a) : f(a) + ' ' + tr('wortBis') + ' ' + f(b); }
  function spanneEur(a, b) { return a === b ? eur(a) : n0(a) + ' ' + tr('wortBis') + ' ' + eur(b); }
  function datumDe(iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); }
  function symbol(id) { return '<svg class="sym" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function byId(id) { return document.getElementById(id); }
  function zahlLesen(txt) {
    var s = String(txt == null ? '' : txt).replace(/\s/g, '');
    if (s === '') return NaN;
    s = s.indexOf(',') >= 0 ? s.replace(/\./g, '').replace(',', '.') : s;
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function meldeFehler(id, text) { var e = byId(id); if (!e) return; e.textContent = text || ''; e.hidden = !text; }
  if (!K || !G || !D.innenausbau || !D.material) {
    meldeFehler('g-ausbau-fehler', 'Die Innenausbau-Rechnung konnte nicht geladen werden: ' + (!K ? 'ausbau_kern.js fehlt.' : (!G ? 'die Zeichnung fehlt.' : 'die Preisdaten fehlen.')));
    return;
  }

  /* ---------- Zustand (nur Bedienung; der Plan selbst bleibt im Plan) ---------- */
  var S = { stufe: 1, altbelag: false, putz: false, bauteil: 'daemmung', rechner: {} };
  var speicherFehler = false;
  (function laden() {
    try {
      var o = JSON.parse(localStorage.getItem(SCHLUESSEL) || 'null');
      if (!o) return;
      if (o.stufe === 0 || o.stufe === 1 || o.stufe === 2) S.stufe = o.stufe;
      S.altbelag = !!o.altbelag; S.putz = !!o.putz;
      if (typeof o.bauteil === 'string' && K.matListe(o.bauteil).length) S.bauteil = o.bauteil;
      if (o.rechner && typeof o.rechner === 'object') S.rechner = o.rechner;
    } catch (e) { speicherFehler = true; }
  })();
  function speichern() { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(S)); speicherFehler = false; } catch (e) { speicherFehler = true; } }

  /* ---------- Bausteine ---------- */
  var STATUS_KEY = { 'geprüft': ['statusGeprueft', 'st-gepr'], 'geprüft (Landesportal)': ['statusPortal', 'st-portal'], 'prüfen vor Nutzung': ['statusPruefen', 'st-pruef'], 'Lücke': ['statusLuecke', 'st-luecke'],
    'neu holen': ['statusLuecke', 'st-luecke'], 'eigene Einordnung': ['esStatusEigen', 'st-eigen'], 'Annahme': ['annahme', 'st-annahme'] };
  function badge(status) {
    var s = STATUS_KEY[status] || STATUS_KEY['prüfen vor Nutzung'];
    return '<span class="rg-status ' + s[1] + '" data-status="' + esc(status) + '">' + esc(tr(s[0])) + '</span>';
  }
  function kurz(t) { var s = String(t || ''); var m = /^(.*?)(?:,| \(|:|; )/.exec(s); s = m ? m[1] : s; return s.length > 60 ? s.slice(0, 58) + '…' : s; }
  function quelleHtml(b) {
    if (!b) return '';
    var t = b.quelleTitel || b.quelle || '', name = esc(kurz(t));
    var link = b.url ? '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + name + '</a>' : name;
    return '<span class="ab-quelle" data-quelle="' + esc(b.quelle || b.id || '') + '" data-abruf="' + esc(b.abruf || '') + '" data-status="' + esc(b.status || '') + '">' + link +
      (b.abruf ? ' · ' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) : '') + ' ' + badge(b.status || 'prüfen vor Nutzung') + (b.nb && b.nb !== 'nicht angegeben' ? ' · ' + esc(b.nb) : '') + '</span>';
  }
  function annahmeZeile(textKey, par) { return '<span class="annahme es-an">' + esc(tr('annahme')) + '</span> ' + esc(tr(textKey, par)); }
  function ampelHtml(art, wortKey) {
    var z = { gruen: '✓', gelb: '!', rot: '✕' }[art] || '?';
    return '<span class="fm-ampel ' + art + '" data-ampel="' + art + '"><i aria-hidden="true">' + z + '</i>' + esc(tr(wortKey || ('mvAmpel_' + art))) + '</span>';
  }
  function begriffKurz(name) {
    var l = D.begriffe || [];
    for (var i = 0; i < l.length; i++) if (l[i].t === name || l[i].t.indexOf(name) === 0) return '<small class="kurz">' + esc(l[i].kurz) + '</small>';
    return '';
  }
  var GEW_ICON = { elektrik: 'i-blitz', sanitaer: 'i-tropfen', heizung: 'i-thermo', trockenbau: 'i-wand', boden: 'i-boden', waende: 'i-farbe', decke: 'i-lampe', tueren: 'i-tuer', kueche: 'i-kueche' };
  var BT_ICON = { aussenwand: 'i-wand', daemmung: 'i-schicht', fassade: 'i-haus', dach: 'i-dach', fenster: 'i-fenster', verglasung: 'i-glas', boden: 'i-boden' };
  function gewName(id) { return tr('abGew_' + id); }
  function btName(id) { return tr('maBt_' + id); }
  function mitFokus(wurzel, fn) {
    var af = document.activeElement, fk = af && wurzel.contains(af) ? af.getAttribute('data-fk') : null;
    var offen = {};
    wurzel.querySelectorAll('details[data-g][open]').forEach(function (d) { offen[d.getAttribute('data-g')] = 1; });
    fn(offen);
    wurzel.querySelectorAll('details[data-g]').forEach(function (d) { if (offen[d.getAttribute('data-g')]) d.open = true; });
    if (fk) { var n = wurzel.querySelector('[data-fk="' + fk + '"]'); if (n) n.focus({ preventScroll: true }); }
  }
  function hatRaeume(plan) { return !!(plan && plan.etagen && plan.etagen.some(function (e) { return (e.raeume || []).length; })); }

  /* ---------- Rechenstand (eine Rechnung je Änderung, von allen Stellen genutzt) ---------- */
  var ctx = null;
  function rechne() {
    var plan = G.plan(), c = { plan: plan, leer: !hatRaeume(plan), stufe: S.stufe };
    if (c.leer) { ctx = c; return c; }
    var pm = K.planMaterial(plan);
    var opt = { altbelag: S.altbelag, putz: S.putz, bodenMaterial: pm.explizit.boden ? pm.wahl.boden : '' };
    c.mg = K.mengenAusPlan(plan);
    if (!c.mg.ok) { c.fehler = c.mg.fehler; ctx = c; return c; }
    c.opt = opt;
    c.kosten = K.innenausbauKosten(c.mg, null, S.stufe, opt);
    c.bilanz = K.hausBilanz(plan);
    ctx = c;
    return c;
  }

  /* ====================================================================== 1. Karte Innenausbau */
  function fehlerHtml(code) {
    return '<p class="ab-meldung fehler" role="alert" data-fehler="' + esc(code) + '">' + esc(code === 'keineRaeume' ? tr('abKeineWohn') : tr('abFehler', { grund: code })) + '</p>';
  }
  function entscheidungenHtml(liste) {
    return (liste || []).map(function (e) {
      return '<div class="ab-ent" data-id="' + esc(e.id) + '"><h5>' + esc(e.position) + '</h5><p><b>' + esc(tr('abEntAlt')) + '</b> ' + esc(e.alt) + '</p><p><b>' + esc(tr('abEntNeu')) + '</b> ' + esc(e.neu) + '</p><p>' + esc(e.grund) + '</p></div>';
    }).join('');
  }
  function entBlock(liste) {
    var E = D.ausbau_entscheidungen;
    if (!E) return '';
    return '<details class="ab-alt" data-g="ent"><summary>' + esc(tr('abEntTitel')) + '</summary><p class="klein">' + esc(E.regel) + '</p>' + entscheidungenHtml(liste || E.innenausbau) + '</details>';
  }
  function positionHtml(p) {
    var preis = p.luecke ? '–' : bis(p.preisVon, p.preisBis) + ' ' + esc(p.einheit);
    var fak = p.faktor && Math.abs(p.faktor - 1) > 1e-9 ? '<span class="ab-faktor">' + esc(tr('abFaktor', { f: n2(p.faktor), q: p.faktorQuelle })) + '</span>' : '';
    var summe = p.luecke ? '<span class="ab-luecke" data-luecke="1">' + esc(tr('abLuecke')) + '</span>' : spanneEur(p.summeVon, p.summeBis);
    return '<div class="ab-pos" data-pos="' + esc(p.id) + '">' +
      '<div><span class="ab-p-name">' + esc(p.name) + '</span>' + fak + '</div>' +
      '<div><span class="ab-l">' + esc(tr('abSpMenge')) + '</span>' + (p.mengeEinheit === 'm²' ? n1(p.menge) : n0(p.menge)) + ' ' + esc(p.mengeEinheit) + '</div>' +
      '<div><span class="ab-l">' + esc(tr('abSpPreis')) + '</span>' + preis + '</div>' +
      '<div class="ab-p-summe"' + (p.luecke ? '' : ' data-von="' + p.summeVon + '" data-bis="' + p.summeBis + '"') + '><span class="ab-l">' + esc(tr('abSpSumme')) + '</span>' + summe + '</div>' +
      '<div class="ab-p-beleg">' + quelleHtml(p) + (p.hinweis ? ' · ' + esc(p.hinweis) : '') + '</div></div>';
  }
  function gewerkHtml(g, maxBis, elektro) {
    var leer = !g.positionen.length, bar = '';
    if (!leer && maxBis > 0) bar = '<span class="ab-b1" style="width:' + (100 * g.von / maxBis).toFixed(2) + '%"></span><span class="ab-b2" style="width:' + (100 * (g.bis - g.von) / maxBis).toFixed(2) + '%"></span>';
    var zahl = leer ? '<span class="ab-leer">' + esc(tr('abNichts')) + '</span>' : (g.bis > 0 ? spanneEur(r100(g.von), r100(g.bis)) : '–') + (g.luecken ? ' <span class="ab-luecke">+' + g.luecken + '</span>' : '');
    var h = '<details class="ab-gewerk" data-g="' + esc(g.id) + '"><summary data-fk="gw-' + esc(g.id) + '">' +
      '<span class="ab-g-name">' + symbol(GEW_ICON[g.id] || 'i-werkzeug') + esc(gewName(g.id)) + '</span>' +
      '<span class="ab-balken" aria-hidden="true">' + bar + '</span>' +
      '<span class="ab-g-zahl es-zahl" data-gewerk="' + esc(g.id) + '" data-von="' + g.von + '" data-bis="' + g.bis + '">' + zahl + '</span></summary>';
    if (!leer) {
      h += '<div class="ab-pos-kopf"><div>' + esc(tr('abSpPos')) + '</div><div>' + esc(tr('abSpMenge')) + '</div><div>' + esc(tr('abSpPreis')) + '</div><div>' + esc(tr('abSpSumme')) + '</div></div>';
      h += g.positionen.map(positionHtml).join('');
    } else h += '<p class="klein">' + esc(tr('abNichtsGrund')) + '</p>';
    if (g.id === 'elektrik' && elektro && elektro.raeume) {
      h += '<p class="ab-soll">' + esc(tr('abElektroSoll', { steck: elektro.steckdosen[S.stufe], licht: elektro.licht[S.stufe], stufe: S.stufe + 1 })) + '</p>';
    }
    if (g.alternativen.length) {
      h += '<details class="ab-alt" data-g="alt-' + esc(g.id) + '"><summary>' + esc(tr('abAlternativen')) + '</summary>' + g.alternativen.map(function (a) {
        return '<div class="ab-pos" data-alt="' + esc(a.id) + '"><div>' + esc(a.name) + '</div><div></div><div>' + (a.luecke ? '<span class="ab-luecke">' + esc(tr('abLuecke')) + '</span>' : bis(a.preisVon, a.preisBis) + ' ' + esc(a.einheit)) + '</div><div></div>' +
          '<div class="ab-p-beleg">' + quelleHtml(a) + (a.hinweis ? ' · ' + esc(a.hinweis) : '') + '</div></div>';
      }).join('') + '</details>';
    }
    return h + '</details>';
  }
  function ausbauHtml(c) {
    if (c.leer) return '<div class="ab-meldung" role="status">' + esc(tr('abLeer')) + '<div class="knopfreihe"><button type="button" class="knopf zweit" data-ziel="grundriss" data-anker="g-start">' + esc(tr('abVorlage')) + '</button></div></div>';
    if (c.fehler) return fehlerHtml(c.fehler);
    var k = c.kosten, s = c.mg.summe, h = '';
    var maxBis = Math.max.apply(null, k.gewerke.map(function (g) { return g.bis; }).concat([1]));
    h += '<div class="es-satz ab-satz" aria-live="polite"><span>' + esc(tr('abSatz', { von: n0(r100(k.von)), bis: n0(r100(k.bis)), stufe: tr('abStufe_' + S.stufe) })) + '</span>' +
      '<span hidden class="es-zahl" id="g-ausbau-summe" data-von="' + k.von + '" data-bis="' + k.bis + '" data-stufe="' + S.stufe + '"></span></div>';
    h += '<p class="klein ab-satz-zeile">' + esc(tr('abSatzKlein', { boden: n0(s.bodenTrocken), wand: n0(s.wandTrocken), raeume: s.raeume, baeder: s.baeder })) +
      (k.luecken ? ' ' + esc(tr('abLueckenSatz', { n: k.luecken })) : '') + '</p>';
    h += '<div class="g-kopfzeile"><h4 class="es-h5">' + esc(tr('abStufe')) + '</h4><button type="button" class="hilfe-knopf" data-ab="hilfe" aria-expanded="false" aria-controls="g-ausbau-hilfe" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button></div>';
    h += '<p class="klein" id="g-ausbau-hilfe" hidden>' + esc(tr('abHilfe')) + '</p>';
    h += '<div class="ab-stufen" role="group" aria-label="' + esc(tr('abStufe')) + '">' + [0, 1, 2].map(function (i) {
      var st = ''; for (var q = 0; q <= i; q++) st += symbol('i-stern');
      return '<button type="button" class="es-var ab-stufe" data-ab="stufe" data-wert="' + i + '" data-fk="stufe-' + i + '" aria-pressed="' + (S.stufe === i) + '"><span class="es-var-kopf"><span class="sterne" aria-hidden="true">' + st + '</span><b>' + esc(tr('abStufe_' + i)) + '</b></span><span class="klein">' + esc(tr('abStufeText_' + i)) + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="ab-optionen"><label class="es-haken"><input type="checkbox" data-ab="opt" data-opt="altbelag" data-fk="opt-altbelag"' + (S.altbelag ? ' checked' : '') + '> ' + esc(tr('abOptAlt')) + '</label>' +
      '<label class="es-haken"><input type="checkbox" data-ab="opt" data-opt="putz" data-fk="opt-putz"' + (S.putz ? ' checked' : '') + '> ' + esc(tr('abOptPutz')) + '</label></div>';
    h += '<p class="klein">' + esc(tr('abLegende')) + '</p>';
    h += k.gewerke.map(function (g) { return gewerkHtml(g, maxBis, c.mg.elektro); }).join('');
    h += '<ul class="ab-liste">' +
      (c.mg.annahmen.indexOf('raumhoehe') >= 0 ? '<li>' + annahmeZeile('abAnnHoehe') + '</li>' : '') +
      '<li>' + annahmeZeile('abAnn1') + '</li><li>' + annahmeZeile('abAnn2') + '</li><li>' + annahmeZeile('abAnn3') + '</li><li>' + annahmeZeile('abAnn4') + '</li><li>' + annahmeZeile('abStufeAnnahme') + '</li>' +
      '<li>' + annahmeZeile('abKuecheRegel') + '</li></ul>';
    h += entBlock();
    return h;
  }
  function kopfAusbau(c) {
    var el = byId('g-ausbau-kopfzeile');
    if (!el) return;
    el.textContent = c.leer || !c.kosten ? tr('abKopfLeer') : tr('abKopf', { von: n0(r100(c.kosten.von)), bis: n0(r100(c.kosten.bis)) });
  }

  /* ====================================================================== 2. Karte Material (Planer) */
  function grundText(code) { return tr('maG_' + String(code).replace(/^(wand|fenster)_/, '')); }
  function heizReihe(name, wert, max, ref, extra) {
    return '<div class="ma-reihe"><span class="ma-name">' + esc(name) + '</span><span class="ma-spur" aria-hidden="true"><span class="ma-fuell' + (ref ? ' ref' : '') + '" style="width:' + Math.max(0.5, Math.min(100, 100 * wert / max)).toFixed(2) + '%"></span>' + (extra || '') + '</span>' +
      '<span class="ma-wert">' + esc(n0(wert)) + '</span></div>';
  }
  function bauteilWahlHtml(c, pm) {
    var h = '';
    K.BAUTEILE_PLAN.forEach(function (b) {
      var liste = K.matListe(b), sel = pm.wahl[b], std = K.STANDARD_MATERIAL[b];
      h += '<div class="ma-zeile" data-b="' + b + '"><h5 class="es-h5">' + symbol(BT_ICON[b]) + esc(btName(b)) + '</h5>';
      h += '<div class="es-chips" role="group" aria-label="' + esc(btName(b)) + '">';
      if (b === 'daemmung') h += '<button type="button" class="chip mit-symbol ma-chip" data-ab="mat" data-b="daemmung" data-m="" data-fk="mat-daemmung-keine" aria-pressed="' + (sel === '') + '">' + symbol('i-schicht') + esc(tr('maKeine')) + '</button>';
      liste.forEach(function (m) {
        h += '<button type="button" class="chip mit-symbol ma-chip" data-ab="mat" data-b="' + b + '" data-m="' + m.id + '" data-fk="mat-' + b + '-' + m.id + '" aria-pressed="' + (sel === m.id) + '">' + symbol(BT_ICON[b]) + esc(m.name) +
          (m.id === std && b !== 'daemmung' ? ' <small>(' + esc(tr('maStandard')) + ')</small>' : '') + '</button>';
      });
      h += '</div>';
      if (b === 'daemmung') {
        var dm = sel ? K.materialKennwerte(null, 'daemmung', sel) : null, du = dm && dm.dicke_u024;
        h += '<div class="ma-dicke"><label for="ma-dicke"><b>' + esc(tr('maDicke')) + '</b> <span id="ma-dicke-wert">' + esc(tr('maCm', { cm: n0(pm.wahl.daemmdicke_cm) })) + '</span></label>' +
          '<input type="range" id="ma-dicke" min="0" max="30" step="1" value="' + pm.wahl.daemmdicke_cm + '"' + (sel ? '' : ' disabled aria-disabled="true"') + ' data-fk="dicke"></div>';
        if (du && du.von != null) h += '<p class="klein">' + esc(tr('maDickeZiel', { von: n0(du.von), bis: n0(du.bis) })) + ' ' + ampelHtml(K.ampelDicke(du.bis)) + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span></p>';
        else if (sel) h += '<p class="klein">' + esc(tr('maDickeZielKeine')) + '</p>';
      }
      if (b !== 'aussenwand' && b !== 'daemmung' && b !== 'verglasung') h += '<p class="klein">' + esc(tr('maNurKosten')) + '</p>';
      h += '</div>';
    });
    return h;
  }
  function uBlock(titel, u, ziel, grundCode, mat, zielKey) {
    if (!u || !u.ok) {
      return '<div class="ma-u"><b>' + esc(titel) + '</b> <span class="ab-luecke">' + esc(tr('maKeineAngabe')) + '</span><span class="klein">' + esc(grundCode ? grundText(grundCode) : '') + (mat ? ' (' + esc(mat) + ')' : '') + '</span></div>';
    }
    var amp = K.ampelU(u.u, ziel);
    return '<div class="ma-u"><span>' + esc(titel) + '</span> <b class="es-zahl" data-u="' + u.u + '">' + n2(u.u) + '</b><span class="klein">W/(m²·K)</span> ' +
      (u.uNiedrig != null && Math.abs(u.uHoch - u.uNiedrig) > 0.0005 ? '<span class="klein">(' + esc(tr('maSpanne')) + ' ' + n2(u.uNiedrig) + ' ' + esc(tr('wortBis')) + ' ' + n2(u.uHoch) + ')</span> ' : '') +
      ampelHtml(amp) + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span><span class="klein">' + esc(tr(zielKey, { u: n2(ziel) })) + '</span></div>';
  }
  function materialErgebnisHtml(c) {
    var b = c.bilanz, h = '';
    var pm = K.planMaterial(c.plan);
    var heiz = b.heizung, ref = (D.material.heizwaerme_referenz || []);
    h += '<h4 class="es-h5">' + symbol('i-thermo') + esc(tr('maHeizTitel')) + '</h4>';
    if (heiz && heiz.ok) {
      /* Welle D, Teil 2b: derselbe Balken wie in der Karte „Wie gut gedämmt?“ (Wände, Dach, Fenster und Lüftung, mit dem gewählten Standard); ohne grundriss_huelle.js bleibt der alte Balken */
      var hb = window.GRUNDRISS_HUELLE && window.GRUNDRISS_HUELLE.balkenHtml ? window.GRUNDRISS_HUELLE.balkenHtml(c, 'ma') : null;
      var max = hb ? hb.max : Math.max(200, heiz.kwhM2Hoch * 1.1, heiz.kwhM2 * 1.1);
      if (hb) h += hb.html;
      else {
        var span = '<span class="ma-spanne" style="left:' + (100 * heiz.kwhM2Niedrig / max).toFixed(2) + '%;width:' + Math.max(0.6, 100 * (heiz.kwhM2Hoch - heiz.kwhM2Niedrig) / max).toFixed(2) + '%"></span>';
        h += '<div class="ma-reihe" data-heiz="ihr"><span class="ma-name">' + esc(tr('maIhrHaus')) + '</span><span class="ma-spur" aria-hidden="true"><span class="ma-fuell" style="width:' + (100 * heiz.kwhM2 / max).toFixed(2) + '%"></span>' + span + '</span><span class="ma-wert es-zahl" id="ma-heiz-wert" data-kwh-m2="' + heiz.kwhM2 + '" data-lo="' + heiz.kwhM2Niedrig + '" data-hi="' + heiz.kwhM2Hoch + '">' + n0(heiz.kwhM2) + '</span></div>';
        h += '<p class="klein">' + esc(tr('maHeizSatz', { kwh: n0(heiz.kwhM2), lo: n0(heiz.kwhM2Niedrig), hi: n0(heiz.kwhM2Hoch), q: n0(heiz.kwh), wfl: n1(heiz.wohnflaeche) })) + '</p>';
      }
      h += '<div class="es-legende"><span><b>' + esc(tr('maRefTitel')) + '</b></span></div>';
      ref.forEach(function (r) { h += heizReihe(tr('maRef_' + r.id), r.wert, max, true); });
      h += '<p class="klein">' + annahmeZeile('maRefHinweis') + '</p>';
    } else {
      var code = heiz ? heiz.grund : 'x';
      var mat = /wand_/.test(code) ? (K.matInfo(b.wahl.aussenwand) || {}).name : '';
      h += '<div class="ab-meldung" role="status" data-heiz="keine"><b>' + esc(tr('maKeineAngabe')) + '.</b> ' + esc(grundText(code)) + (mat ? ' (' + esc(mat) + ')' : '') + '</div>';
    }
    h += '<h4 class="es-h5">' + symbol('i-wand') + esc(tr('maUTitel')) + '</h4>' + begriffKurz('U-Wert');
    h += uBlock(tr('maUWand'), b.wand, 0.24, !b.wand.ok ? 'wand_' + b.wand.grund : '', (K.matInfo(b.wahl.aussenwand) || {}).name, 'maUZielWand');
    h += uBlock(tr('maUGlas'), b.fenster, 1.1, !b.fenster.ok ? 'fenster_' + b.fenster.grund : '', (K.matInfo(b.wahl.verglasung) || {}).name, 'maUZielGlas');
    h += '<p class="klein">' + annahmeZeile('maUGlasHinweis') + '</p>';
    h += '<h4 class="es-h5">' + symbol('i-rechner') + esc(tr('maKostenTitel')) + '</h4><div class="ma-kosten">';
    K.BAUTEILE_PLAN.forEach(function (bt) {
      var kz = b.kosten.bauteile[bt], mi = K.matInfo(b.wahl[bt]);
      var name = '<b>' + esc(btName(bt)) + '</b><br>' + esc(bt === 'daemmung' && !b.wahl.daemmung ? tr('maKeine') : (mi ? mi.name : ''));
      var mitte, beleg = '';
      if (kz.keine) mitte = '<span class="klein">' + esc(tr('maKeineDaemmung')) + '</span>';
      else if (kz.luecke || kz.von == null) {
        mitte = '<span class="ab-luecke" data-luecke="1">' + esc(tr('abLuecke')) + '</span> <span class="klein">' + esc(tr('maLueckeGrund_' + (kz.grund || 'keinPreis'))) + '</span>';
        if (kz.preis === null && bt !== 'verglasung') beleg = '';
      } else {
        mitte = '<span class="es-zahl" data-bauteil="' + bt + '" data-von="' + kz.von + '" data-bis="' + kz.bis + '">' + spanneEur(Math.round(kz.von), Math.round(kz.bis)) + '</span><br><span class="klein">' +
          esc(tr('maRechnung', { menge: n1(kz.menge), einheit: kz.mengeEinheit, preis: bis(kz.preis.von, kz.preis.bis), pe: kz.preis.einheit })) + (kz.skaliert ? ' ' + esc(tr('maDickenFaktor', { f: n2(kz.faktor) })) : '') + '</span>';
        beleg = '<span class="klein">' + esc(kz.preis.basisName) + '</span><br>' + quelleHtml(kz.preis.beleg);
      }
      h += '<div class="ma-kosten-zeile" data-bt="' + bt + '"><div>' + name + '</div><div>' + mitte + '</div><div>' + beleg + '</div></div>';
    });
    h += '</div>';
    var kosten = b.kosten;
    h += '<div class="es-satz klein-satz" data-summe="1"><span class="es-zahl" id="ma-kosten-summe" data-von="' + kosten.von + '" data-bis="' + kosten.bis + '">' + esc(tr('maKostenSumme', { von: n0(r100(kosten.von)), bis: n0(r100(kosten.bis)) })) + '</span>' +
      (kosten.luecken ? ' ' + esc(tr('maOhnePreis', { n: kosten.luecken })) : '') + '</div>';
    var mel = b.meldungen.map(function (m) { return '<p class="ab-meldung fehler" role="alert" data-meldung="' + esc(m.bauteil) + '">' + esc(tr('maUnbekannt', { id: m.id, bauteil: btName(m.bauteil) })) + '</p>'; }).join('');
    h += mel;
    var d = b.mengen.huelle;
    h += '<details class="ab-alt" data-g="ma-ann"><summary>' + esc(tr('maAnnTitel')) + '</summary><ul class="ab-liste">' +
      '<li>' + annahmeZeile('maAnnWand', { cm: n0(Math.round(b.wand.d * 100 * 10) / 10) }) + '</li>' +
      '<li>' + annahmeZeile('maAnnDach', { dach: n2(b.annahmeU.dach), boden: n2(b.annahmeU.boden), tuer: n2(b.annahmeU.tuer) }) + '</li>' +
      '<li>' + annahmeZeile('maAnnUe') + '</li>' +
      '<li>' + annahmeZeile('maAnnRechnung') + '</li>' +
      '<li><span class="es-zahl" data-gradtage="' + b.gradtage.wert + '">' + esc(tr('maAnnGrad', { wert: n0(b.gradtage.wert), station: b.gradtage.station })) + '</span> ' +
      (b.gradtage.annahme ? '<span class="annahme">' + esc(tr('annahme')) + '</span>' : esc(tr('regAbruf', { datum: datumDe(b.gradtage.abruf) })) + ' ' + badge(b.gradtage.status)) + begriffKurz('Gradtagzahl') + '</li>' +
      (d && d.naeherung ? '<li>' + annahmeZeile('maAnnSchraeg') + '</li>' : '') + '</ul></details>';
    h += '<div class="knopfreihe"><button type="button" class="knopf zweit" data-ziel="material">' + esc(tr('maZumVergleich')) + '</button></div>';
    return h;
  }
  function materialHtml(c) {
    if (c.leer) return '<div class="ab-meldung" role="status">' + esc(tr('abLeer')) + '<div class="knopfreihe"><button type="button" class="knopf zweit" data-ziel="grundriss" data-anker="g-start">' + esc(tr('abVorlage')) + '</button><button type="button" class="knopf zweit" data-ziel="material">' + esc(tr('maZumVergleich')) + '</button></div></div>';
    if (c.fehler) return fehlerHtml(c.fehler);
    var pm = K.planMaterial(c.plan);
    return '<div id="g-material-wahl">' + bauteilWahlHtml(c, pm) + '</div><div id="g-material-ergebnis" aria-live="polite">' + materialErgebnisHtml(c) + '</div>';
  }
  function kopfMaterial(c) {
    var el = byId('g-material-kopfzeile');
    if (!el) return;
    if (c.leer || !c.bilanz) { el.textContent = tr('abKopfLeer'); return; }
    var h = c.bilanz.heizung, ges = window.GRUNDRISS_HUELLE && window.GRUNDRISS_HUELLE.gesamtM2 ? window.GRUNDRISS_HUELLE.gesamtM2(c) : null;   /* Teil 2b: mit Lüftung */
    el.textContent = h && h.ok ? tr('maKopf', { kwh: n0(ges != null ? ges : h.kwhM2) }) : tr('maKopfKeine');
  }

  /* Material setzen (Planer): schreibt plan.material und lässt den Plan speichern */
  function setzeMaterial(bauteil, id, dicke) {
    var plan = G.plan();
    var alt = plan.material ? JSON.parse(JSON.stringify(plan.material)) : null;
    if (!plan.material) plan.material = {};
    plan.material[bauteil] = id;
    if (bauteil === 'daemmung' && id && !isFinite(Number(plan.material.daemmdicke_cm))) plan.material.daemmdicke_cm = K.ANNAHMEN.daemmdickeCm;
    if (dicke != null) plan.material.daemmdicke_cm = Math.max(0, Math.min(40, dicke));
    G.geaendert();
    return alt;
  }

  /* ====================================================================== 3. Bereich Material vergleichen */
  function kritKopf(k) { return tr('mvK_' + k.id); }
  function zelleHtml(k, z) {
    var kopf = '<div class="mv-k-kopf"><span>' + esc(kritKopf(k)) + '</span>', wert = '', rest = '';
    if (z.luecke) return '<div class="mv-krit" data-k="' + k.id + '">' + kopf + '<span class="mv-keine">' + esc(tr('mvKeineAngabe')) + '</span></div></div>';
    function balken(zz) {
      if (zz.balken != null) return '<span class="ma-spur" aria-hidden="true"><span class="ma-fuell" style="width:' + (12 + 88 * zz.balken).toFixed(1) + '%"></span></span>';
      if (zz.gruppenGroesse === 1) return '<span class="klein">' + esc(tr('mvEinzel')) + '</span>';
      return '';
    }
    switch (k.id) {
      case 'preis':
        wert = bis(z.von, z.bis) + ' ' + esc(z.einheit) + (z.nb ? ' (' + esc(z.nb) + ')' : '');
        rest = balken(z) + '<p class="mv-k-text">' + esc(z.gruppeName || '') + '</p>' +
          (z.weitere && z.weitere.length ? '<p class="mv-k-text">' + esc(tr('mvWeiterePreise')) + ' ' + z.weitere.map(function (w) { return esc(bis(w.von, w.bis) + ' ' + w.einheit + ' (' + w.basisName + ')'); }).join('; ') + '</p>' : '');
        break;
      case 'daemm':
        wert = 'λ ' + (z.von === z.bis ? n3(z.von) : n3(z.von) + ' ' + tr('wortBis') + ' ' + n3(z.bis)) + ' W/(m·K)';
        rest = z.weit ? '<p class="mv-k-text"><span class="annahme">' + esc(tr('mvLambdaWeit')) + '</span></p>' : (z.wert != null ? balken(z) + (z.mitte ? '<p class="mv-k-text">' + esc(tr('mvLambdaMitte', { w: n3(z.wert) })) + '</p>' : '') : '');
        break;
      case 'dicke':
        if (z.art === 'text') { wert = esc(z.text); rest = '<p class="mv-k-text">' + ampelHtml('rot') + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span></p>'; break; }
        wert = bis(z.von, z.bis) + ' cm';
        rest = balken(z) + '<p class="mv-k-text">' + ampelHtml(z.ampel) + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span>' + (z.rechnung ? ' · ' + esc(tr('mvEigeneRechnung')) : '') + '</p>';
        break;
      case 'schall': wert = bis(z.von, z.bis) + ' ' + esc(z.einheit); rest = balken(z); break;
      case 'lebensdauer':
        wert = (z.ge ? tr('mvMindestens') + ' ' : '') + bis(z.von, z.bis) + ' ' + esc(tr('mvJahre'));
        rest = balken(z) + '<p class="mv-k-text">' + ampelHtml(z.ampel) + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span></p>';
        break;
      case 'brand':
        wert = z.klasse ? esc(z.klasse) : '';
        rest = z.texte.map(function (t) { return '<p class="mv-k-text">' + esc(t.text) + '</p>'; }).join('') +
          (z.ampel ? '<p class="mv-k-text">' + ampelHtml(z.ampel) + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span>' + (z.uneinig ? ' · <b>' + esc(tr('mvUneinig')) + '</b>' : '') + '</p>' : '');
        break;
      case 'gwp':
        if (z.andereSkala) { wert = bis(z.von, z.bis, n1) + ' ' + esc(z.einheit); rest = '<p class="mv-k-text">' + esc(tr('mvGwpAnders')) + '</p>'; break; }
        wert = bis(z.von, z.bis, n1) + ' ' + esc(z.einheit);
        rest = balken(z) + (z.negativ ? '<p class="mv-k-text">' + esc(tr('mvGwpNeg')) + '</p>' : '') + '<p class="mv-k-text">' + esc(z.indikator || '') + '</p>';
        break;
      default:   /* Texte: Wartung, Feuchte, Selber machen */
        rest = z.texte.map(function (t) { return '<p class="mv-k-text">' + esc(t.text) + '</p>'; }).join('');
    }
    var bel = z.beleg ? '<p class="mv-k-q">' + quelleHtml(z.beleg) + '</p>' : (z.texte && z.texte[0] && z.texte[0].beleg ? '<p class="mv-k-q">' + z.texte.map(function (t) { return quelleHtml(t.beleg); }).join(' · ') + '</p>' : '');
    return '<div class="mv-krit" data-k="' + k.id + '">' + kopf + '<span class="mv-k-wert es-zahl">' + wert + '</span></div>' + rest + bel + '</div>';
  }
  function vergleichHtml(bauteil) {
    var v = K.vergleich(bauteil), h = '';
    h += '<h3>' + esc(tr('mvVergleich', { bauteil: btName(bauteil) })) + '</h3><p class="klein">' + esc(tr('mvLegende')) + '</p>' +
      '<div class="mv-begriffe"><b>λ</b> ' + begriffKurz('Wärmeleitfähigkeit') + '<b>U</b> ' + begriffKurz('U-Wert') + '<b>CO₂</b> ' + begriffKurz('Treibhauspotenzial') + '</div>';
    if (v.saetze.length) {
      var nm = {}; v.materialien.forEach(function (m) { nm[m.id] = m.name; });
      h += '<h4 class="es-h5">' + esc(tr('mvBesserTitel')) + '</h4><ul class="mv-saetze">' + v.saetze.map(function (s) {
        return '<li data-satz="' + esc(s.art) + '">' + esc(tr(s.art === 'daemm' ? 'mvBesserDaemm' : 'mvBesserLeben', { besser: nm[s.besser], ref: nm[s.referenz], a: s.art === 'daemm' ? n3(s.wert) : n0(s.wert), b: s.art === 'daemm' ? n3(s.wertRef) : n0(s.wertRef),
          p1: n0(s.preis), p2: n0(s.preisRef), einheit: s.einheit })) + '</li>';
      }).join('') + '</ul><p class="klein">' + annahmeZeile('mvBesserHinweis') + '</p>';
    }
    h += '<div class="mv-karten">' + v.materialien.map(function (m) {
      var head = '<h4>' + esc(m.name) + '</h4>';
      var krit = K.KRITERIEN.map(function (k) { return zelleHtml(k, m.zellen[k.id]); }).join('');
      var nach = m.nachteile.length ? '<div class="mv-nachteil"><b>' + esc(tr('mvNachteil')) + ':</b> ' + m.nachteile.map(function (n) { return esc(n.text); }).join(' ') + '</div>' : '';
      return '<article class="mv-karte" data-m="' + esc(m.id) + '">' + head + krit + nach + '</article>';
    }).join('') + '</div>';
    if (v.gwpSkala) h += '<p class="klein">' + esc(tr('mvGwpHinweis')) + '</p>';
    return h;
  }
  function bauteilKacheln() {
    return D.material.meta_bauteile.map(function (b) {
      return '<button type="button" class="mv-kachel" id="m-bk-' + b.id + '" data-ab="bauteil" data-b="' + b.id + '" data-fk="bk-' + b.id + '" aria-pressed="' + (S.bauteil === b.id) + '">' + symbol(BT_ICON[b.id] || 'i-material') +
        '<b>' + esc(btName(b.id)) + '</b><span class="klein">' + esc(tr('mvAnzahl', { n: K.matListe(b.id).length })) + '</span></button>';
    }).join('');
  }
  /* Eigenständiger Rechner: Fläche + Material → Menge, Kosten, U-Wert (derselbe Kern wie die Planerkarte) */
  function rechnerStand(b) {
    var r = S.rechner[b];
    if (!r) {
      var liste = K.matListe(b), c = ctx, flaeche = 30, stueck = 5, wand = 30;
      if (c && c.mg && c.mg.ok) {
        var fl = K.bauteilFlaeche(b, c.mg, null);
        if (fl && fl.menge > 0) flaeche = Math.round(fl.menge * 10) / 10;
        if (c.mg.huelle && c.mg.huelle.fensterStueck > 0) stueck = c.mg.huelle.fensterStueck;
        if (c.bilanz && c.bilanz.wand && c.bilanz.wand.d) wand = Math.round(c.bilanz.wand.d * 1000) / 10;
      }
      r = S.rechner[b] = { material: liste[0] ? liste[0].id : '', flaeche: String(flaeche).replace('.', ','), stueck: String(stueck), dicke: b === 'daemmung' ? 16 : wand };
    }
    return r;
  }
  function rechnerHtml(b) {
    var r = rechnerStand(b), liste = K.matListe(b), h = '';
    h += '<div class="mv-rechner">';
    h += '<div class="es-feld"><label for="mr-material">' + esc(tr('mvMaterial')) + '</label><select id="mr-material" data-ab="r-material" data-fk="r-material">' +
      liste.map(function (m) { return '<option value="' + m.id + '"' + (m.id === r.material ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="es-feld"><label for="mr-flaeche">' + esc(tr('mvFlaeche')) + '</label><input type="text" id="mr-flaeche" inputmode="decimal" value="' + esc(r.flaeche) + '" data-ab="r-flaeche" data-fk="r-flaeche" aria-describedby="mr-flaeche-f"><div class="fehler" id="mr-flaeche-f"></div></div>';
    if (b === 'fenster') h += '<div class="es-feld"><label for="mr-stueck">' + esc(tr('mvStueck')) + '</label><input type="text" id="mr-stueck" inputmode="numeric" value="' + esc(r.stueck) + '" data-ab="r-stueck" data-fk="r-stueck" aria-describedby="mr-stueck-f"><div class="fehler" id="mr-stueck-f"></div></div>';
    if (b === 'daemmung') h += '<div class="es-feld"><label for="mr-dicke">' + esc(tr('mvDicke')) + '</label><input type="text" id="mr-dicke" inputmode="decimal" value="' + esc(String(r.dicke).replace('.', ',')) + '" data-ab="r-dicke" data-fk="r-dicke" aria-describedby="mr-dicke-f"><div class="fehler" id="mr-dicke-f"></div></div>';
    if (b === 'aussenwand') h += '<div class="es-feld"><label for="mr-dicke">' + esc(tr('mvWandDicke')) + '</label><input type="text" id="mr-dicke" inputmode="decimal" value="' + esc(String(r.dicke).replace('.', ',')) + '" data-ab="r-dicke" data-fk="r-dicke" aria-describedby="mr-dicke-f"><div class="fehler" id="mr-dicke-f"></div></div>';
    h += '</div><div id="mr-ergebnis" aria-live="polite"></div>';
    var kannPlan = K.BAUTEILE_PLAN.indexOf(b) >= 0;
    h += '<div class="knopfreihe"><button type="button" class="knopf" id="mr-uebernehmen" data-ab="uebernehmen" data-fk="r-uebernehmen"' + (kannPlan ? '' : ' disabled aria-disabled="true"') + '>' + esc(tr('mvUebernehmen')) + '</button></div>';
    if (!kannPlan) h += '<p class="klein">' + esc(tr('mvNichtImPlaner')) + '</p>';
    h += '<div id="mr-meldung" role="status" aria-live="polite"></div>';
    return h;
  }
  function rechnerErgebnis(b) {
    var r = rechnerStand(b), el = byId('mr-ergebnis');
    if (!el) return null;
    var fl = zahlLesen(r.flaeche), st = zahlLesen(r.stueck), dk = zahlLesen(String(r.dicke).replace('.', ','));
    var f1 = byId('mr-flaeche-f'), f2 = byId('mr-stueck-f'), f3 = byId('mr-dicke-f');
    var ok = true;
    if (f1) { var bad = !(fl > 0 && fl <= 100000); f1.textContent = bad ? tr('mvFehlerZahl', { min: 0, max: n0(100000) }) : ''; if (bad) ok = false; byId('mr-flaeche').setAttribute('aria-invalid', bad ? 'true' : 'false'); }
    if (f2) { var bad2 = !(st > 0 && st <= 1000 && Math.floor(st) === st); f2.textContent = bad2 ? tr('mvFehlerStueck') : ''; if (bad2) ok = false; }
    if (f3) { var bad3 = !(dk >= 0 && dk <= (b === 'daemmung' ? 40 : 100)); f3.textContent = bad3 ? tr('mvFehlerDicke') : ''; if (bad3) ok = false; }
    if (!ok) { el.innerHTML = '<p class="ab-meldung fehler" role="alert">' + esc(tr('mvFehlerEingabe')) + '</p>'; return null; }
    var res = K.rechnerEinzel(b, r.material, fl, { daemmdickeCm: dk, wanddickeCm: dk, stueck: st });
    if (!res.ok) { el.innerHTML = '<p class="ab-meldung fehler" role="alert">' + esc(tr('abFehler', { grund: res.fehler })) + '</p>'; return null; }
    var k = res.kosten, h = '<dl class="es-geld">';
    h += '<div><dt>' + esc(tr('mvMenge')) + '</dt><dd class="es-zahl" data-menge="' + (k.menge || fl) + '">' + (k.menge && k.mengeEinheit === 'Stück' ? n0(k.menge) + ' ' + esc(tr('mvStueckEinheit')) : n1(fl) + ' m²') + '</dd></div>';
    if (k.luecke || k.von == null) h += '<div><dt>' + esc(tr('mvKosten')) + '</dt><dd><span class="ab-luecke" data-luecke="1">' + esc(tr('abLuecke')) + '</span> <span class="klein">' + esc(tr('maLueckeGrund_' + (k.grund || 'keinPreis'))) + '</span></dd></div>';
    else h += '<div class="gesamt"><dt>' + esc(tr('mvKosten')) + '</dt><dd class="es-zahl" data-von="' + k.von + '" data-bis="' + k.bis + '">' + spanneEur(Math.round(k.von), Math.round(k.bis)) +
      '<br><span class="klein">' + esc(tr('maRechnung', { menge: n1(k.menge), einheit: k.mengeEinheit, preis: bis(k.preis.von, k.preis.bis), pe: k.preis.einheit })) + (k.skaliert ? ' ' + esc(tr('maDickenFaktor', { f: n2(k.faktor) })) : '') + '<br>' + esc(k.preis.basisName) + '<br>' + quelleHtml(k.preis.beleg) + '</span></dd></div>';
    if (res.u) {
      var ziel = b === 'verglasung' ? 1.1 : 0.24;
      h += '<div><dt>' + (b === 'verglasung' ? esc(tr('mvUg')) : (b === 'daemmung' ? esc(tr('mvUDaemm')) : esc(tr('mvUWand')))) + begriffKurz('U-Wert') + '</dt><dd><b class="es-zahl" data-u="' + res.u.wert + '">' + n2(res.u.wert) + '</b> W/(m²·K) ' +
        (res.u.niedrig != null && Math.abs(res.u.hoch - res.u.niedrig) > 0.0005 ? '<span class="klein">(' + esc(tr('maSpanne')) + ' ' + n2(res.u.niedrig) + ' ' + esc(tr('wortBis')) + ' ' + n2(res.u.hoch) + ')</span> ' : '') +
        (res.u.nurDaemmung ? '' : ampelHtml(res.u.ampel) + ' <span class="annahme">' + esc(tr('esStatusEigen')) + '</span>') + '<br><span class="klein">' +
        esc(res.u.nurDaemmung ? tr('mvUNurDaemm') : tr(b === 'verglasung' ? 'maUZielGlas' : 'maUZielWand', { u: n2(ziel) })) + '</span></dd></div>';
    } else if (res.uGrund) h += '<div><dt>' + esc(tr('mvUWand')) + '</dt><dd><span class="ab-luecke">' + esc(tr('maKeineAngabe')) + '</span> <span class="klein">' + esc(grundText(res.uGrund)) + '</span></dd></div>';
    h += '</dl>';
    el.innerHTML = h;
    return res;
  }
  function seiteBauen() {
    var bk = byId('m-bauteile'), vg = byId('m-vergleich'), rc = byId('m-rechner'), en = byId('m-entscheidungen');
    if (!bk || !vg || !rc) return;
    mitFokus(byId('material'), function () {
      bk.innerHTML = bauteilKacheln();
      vg.innerHTML = vergleichHtml(S.bauteil);
      rc.innerHTML = rechnerHtml(S.bauteil);
      if (en) { var E = D.ausbau_entscheidungen; en.innerHTML = E ? '<p class="klein">' + esc(E.regel) + '</p><h4 class="es-h5">' + esc(tr('abEntInnen')) + '</h4>' + entscheidungenHtml(E.innenausbau) + '<h4 class="es-h5">' + esc(tr('abEntMaterial')) + '</h4>' + entscheidungenHtml(E.material) : ''; }
    });
    rechnerErgebnis(S.bauteil);
  }

  /* ====================================================================== 4. Hinweis im Umbau */
  var UEB = [['dach', 'dachflaeche', 'm²'], ['fassade', 'aussenwandNetto', 'm²'], ['fenster', 'fenster', ''], ['elektrik', 'wohnflaeche', 'm²'], ['bad', 'baeder', ''], ['boden', 'bodenTrocken', 'm²'],
    ['putz', 'wandTrocken', 'm²'], ['trockenbau', 'wandneuFlaeche', 'm²'], ['tueren', 'tuerenInnen', '']];
  function uebernahmeWerte(c) {
    var s = c.mg.summe, res = [];
    UEB.forEach(function (u) {
      var v = s[u[1]];
      if (!(v > 0)) return;
      var feld = byId('u-m-' + u[0]);
      if (!feld) return;
      res.push({ id: u[0], feld: feld, wert: u[2] === 'm²' ? Math.round(v) : Math.round(v), einheit: u[2], name: ((D.sanierung && D.sanierung.bauteile.filter(function (b) { return b.id === u[0]; })[0]) || {}).name || u[0] });
    });
    return res;
  }
  function umbauHinweis(c) {
    var el = byId('u-ausbau-hinweis');
    if (!el) return;
    if (c.leer || !c.kosten) { el.hidden = true; el.innerHTML = ''; return; }
    var meldung = el.querySelector('#u-ausbau-meldung'), gemerkt = meldung ? meldung.innerHTML : '', gemerktHidden = meldung ? meldung.hidden : true;
    el.hidden = false;
    el.innerHTML = '<div class="ab-umbau-zeile">' + symbol('i-grundriss') + '<div><b id="u-ausbau-text" class="es-zahl" data-von="' + c.kosten.von + '" data-bis="' + c.kosten.bis + '">' +
      esc(tr('abUmbauHinweis', { von: n0(r100(c.kosten.von)), bis: n0(r100(c.kosten.bis)) })) + '</b><br><span class="klein">' + esc(tr('abUmbauKlein', { stufe: tr('abStufe_' + S.stufe) })) + '</span></div>' +
      '<button type="button" class="knopf" data-ab="uebernehmen-umbau" data-fk="u-uebernehmen">' + esc(tr('abUebernehmen')) + '</button>' +
      '<button type="button" class="knopf zweit" data-ziel="grundriss" data-anker="g-ausbau-karte">' + esc(tr('abZurKarte')) + '</button></div>' +
      '<div class="ab-meldung" id="u-ausbau-meldung" role="status" aria-live="polite"' + (gemerktHidden ? ' hidden' : '') + '>' + gemerkt + '</div>';
  }
  function umbauMelden(html, fehler) {
    var m = byId('u-ausbau-meldung'); if (!m) return;
    m.className = 'ab-meldung' + (fehler ? ' fehler' : ''); m.innerHTML = html; m.hidden = !html;
  }
  function umbauSchreiben(werte) {
    var namen = [];
    werte.forEach(function (w) {
      w.feld.value = String(w.wert);
      w.feld.dispatchEvent(new Event('input', { bubbles: true }));
      namen.push(w.name + ' ' + n0(w.wert) + (w.einheit ? ' ' + w.einheit : ''));
    });
    umbauMelden(esc(tr('abUebernommen', { n: werte.length, liste: namen.join('; ') })), false);
  }
  function umbauUebernehmen() {
    var c = ctx || rechne();
    if (c.leer || !c.mg || !c.mg.ok) { umbauMelden(esc(tr('abUebKeinPlan')), true); return; }
    var werte = uebernahmeWerte(c);
    if (!werte.length) { umbauMelden(esc(tr('abUebNichts')), true); return; }
    var belegt = werte.filter(function (w) { var v = w.feld.value.trim(); return v !== '' && v !== '0' && zahlLesen(v) !== Math.round(w.wert); });
    if (belegt.length) {
      umbauMelden(esc(tr('abUebFrage', { n: belegt.length })) + '<div class="knopfreihe"><button type="button" class="knopf" data-ab="ueb-ja" data-fk="ueb-ja">' + esc(tr('abUebJa')) + '</button><button type="button" class="knopf zweit" data-ab="ueb-nein" data-fk="ueb-nein">' + esc(tr('abUebNein')) + '</button></div>', false);
      var b = document.querySelector('[data-ab="ueb-ja"]'); if (b) b.focus();
      return;
    }
    umbauSchreiben(werte);
  }

  /* ====================================================================== Zusammenspiel */
  var timer = null;
  function jetzt() {
    clearTimeout(timer);
    var c;
    try { c = rechne(); } catch (e) {
      var g = 'Innenausbau und Material konnten nicht gerechnet werden: ' + (e && e.message ? e.message : e);
      meldeFehler('g-ausbau-fehler', g); meldeFehler('g-material-fehler', g); return;
    }
    meldeFehler('g-ausbau-fehler', speicherFehler ? tr('abSpeicherFehler') : '');
    meldeFehler('g-material-fehler', '');
    try {
      kopfAusbau(c); kopfMaterial(c); umbauHinweis(c);
      var d1 = byId('g-ausbau-details'), d2 = byId('g-material-details'), w1 = byId('g-ausbau-inhalt'), w2 = byId('g-material-inhalt');
      if (d1 && d1.open && w1) mitFokus(w1, function () { w1.innerHTML = ausbauHtml(c); });
      if (d2 && d2.open && w2) {
        var altDicke = byId('ma-dicke'), amDrag = altDicke && document.activeElement === altDicke;
        if (amDrag) { var erg = byId('g-material-ergebnis'); if (erg && c.bilanz) erg.innerHTML = materialErgebnisHtml(c); }
        else mitFokus(w2, function () { w2.innerHTML = materialHtml(c); });
      }
      var sec = byId('material');
      if (sec && !sec.hidden) { /* Rechner: Startwerte hängen vom Plan ab; nur die Ergebnisse neu rechnen */ rechnerErgebnis(S.bauteil); }
    } catch (e2) {
      var t = 'Die Anzeige von Innenausbau und Material ist ausgefallen: ' + (e2 && e2.message ? e2.message : e2);
      meldeFehler('g-ausbau-fehler', t);
    }
  }
  function aktualisieren() { clearTimeout(timer); timer = setTimeout(jetzt, 150); }

  function klick(ev) {
    var t = ev.target.closest('[data-ab]');
    if (!t) return;
    var a = t.getAttribute('data-ab');
    switch (a) {
      case 'stufe': S.stufe = +t.getAttribute('data-wert'); speichern(); jetzt(); break;
      case 'hilfe': {
        var p = byId('g-ausbau-hilfe'), auf = t.getAttribute('aria-expanded') !== 'true';
        t.setAttribute('aria-expanded', auf ? 'true' : 'false'); if (p) p.hidden = !auf; break;
      }
      case 'mat': {
        var b = t.getAttribute('data-b'), m = t.getAttribute('data-m');
        setzeMaterial(b, m); jetzt(); break;
      }
      case 'bauteil': S.bauteil = t.getAttribute('data-b'); speichern(); seiteBauen(); break;
      case 'uebernehmen': materialUebernehmen(); break;
      case 'rueckgaengig': rueckgaengig(); break;
      case 'uebernehmen-umbau': umbauUebernehmen(); break;
      case 'ueb-ja': umbauSchreiben(uebernahmeWerte(ctx || rechne())); break;
      case 'ueb-nein': umbauMelden(esc(tr('abUebAbgebrochen')), false); break;
    }
  }
  function bei(ev) {
    var t = ev.target;
    if (!t.getAttribute) return;
    var a = t.getAttribute('data-ab');
    if (a === 'opt') { S[t.getAttribute('data-opt')] = !!t.checked; speichern(); jetzt(); return; }
    if (t.id === 'ma-dicke') {
      var v = +t.value, lab = byId('ma-dicke-wert'); if (lab) lab.textContent = tr('maCm', { cm: n0(v) });
      var plan = G.plan(); if (!plan.material) plan.material = {};
      plan.material.daemmdicke_cm = v; G.geaendert(); return;
    }
    if (a === 'r-material') { var r = rechnerStand(S.bauteil); r.material = t.value; speichern(); rechnerErgebnis(S.bauteil); return; }
    if (a === 'r-flaeche') { rechnerStand(S.bauteil).flaeche = t.value; speichern(); rechnerErgebnis(S.bauteil); return; }
    if (a === 'r-stueck') { rechnerStand(S.bauteil).stueck = t.value; speichern(); rechnerErgebnis(S.bauteil); return; }
    if (a === 'r-dicke') { rechnerStand(S.bauteil).dicke = t.value; speichern(); rechnerErgebnis(S.bauteil); return; }
  }
  var undoStand = null;
  function materialUebernehmen() {
    var b = S.bauteil, r = rechnerStand(b), meld = byId('mr-meldung');
    if (!meld) return;
    var res = rechnerErgebnis(b);
    if (!res) { meld.innerHTML = '<p class="ab-meldung fehler" role="alert">' + esc(tr('mvFehlerEingabe')) + '</p>'; return; }
    var plan = G.plan();
    if (!hatRaeume(plan)) {
      meld.innerHTML = '<div class="ab-meldung fehler" role="alert" data-meldung="kein-plan">' + esc(tr('mvKeinPlan')) + '<div class="knopfreihe"><button type="button" class="knopf" data-ziel="grundriss" data-anker="g-start" data-fk="r-vorlage">' + esc(tr('abVorlage')) + '</button></div></div>';
      return;
    }
    var vorher = plan.material ? JSON.parse(JSON.stringify(plan.material)) : null;
    var dk = zahlLesen(String(r.dicke).replace('.', ','));
    undoStand = { plan: vorher };
    var alt = K.planMaterial(plan).wahl[b];
    setzeMaterial(b, r.material, b === 'daemmung' ? dk : null);
    jetzt();
    var mi = K.matInfo(r.material), ai = K.matInfo(alt);
    meld.innerHTML = '<div class="ab-meldung" role="status" data-meldung="uebernommen">' + esc(tr('mvUebernommen', { bauteil: btName(b), material: mi ? mi.name : r.material, alt: ai ? ai.name : (alt || tr('maKeine')) })) +
      '<div class="knopfreihe"><button type="button" class="knopf zweit" data-ziel="grundriss" data-anker="g-material-karte" data-fk="r-zumplan">' + esc(tr('mvZumGrundriss')) + '</button><button type="button" class="knopf zweit" data-ab="rueckgaengig" data-fk="r-undo">' + esc(tr('mvRueckgaengig')) + '</button></div></div>';
  }
  function rueckgaengig() {
    var meld = byId('mr-meldung');
    if (!undoStand) return;
    var plan = G.plan();
    if (undoStand.plan) plan.material = undoStand.plan; else delete plan.material;
    undoStand = null; G.geaendert(); jetzt();
    if (meld) meld.innerHTML = '<div class="ab-meldung" role="status">' + esc(tr('mvZurueck')) + '</div>';
  }

  /* ---------- Einhängen ---------- */
  ['g-ausbau-inhalt', 'g-material-inhalt', 'material', 'u-ausbau-hinweis'].forEach(function (id) {
    var w = byId(id); if (!w) return;
    w.addEventListener('click', klick);
    w.addEventListener('input', bei);
    w.addEventListener('change', function (ev) { if (ev.target.tagName === 'SELECT' || ev.target.type === 'checkbox') bei(ev); });
  });
  ['g-ausbau-details', 'g-material-details'].forEach(function (id) { var d = byId(id); if (d) d.addEventListener('toggle', function () { if (d.open) jetzt(); }); });
  var hk = byId('m-hilfe');
  if (hk) hk.addEventListener('click', function () {
    var p = byId('m-hilfe-text'), auf = hk.getAttribute('aria-expanded') !== 'true';
    hk.setAttribute('aria-expanded', auf ? 'true' : 'false'); if (p) p.hidden = !auf;
  });
  window.addEventListener('sprachegewechselt', function () { jetzt(); seiteBauen(); });
  /* Der Bereich „Material vergleichen“ wird beim ersten Öffnen und bei jedem Wechsel dorthin frisch gebaut (Startwerte aus dem aktuellen Plan) */
  var tabM = byId('tab-material');
  if (tabM) tabM.addEventListener('click', function () { rechne(); seiteBauen(); });
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-ziel="material"], button[data-ziel="material"]');
    if (a && !a.classList.contains('bereich-knopf')) setTimeout(function () { rechne(); seiteBauen(); }, 0);
  });
  window.addEventListener('hashchange', function () { if (location.hash === '#material') setTimeout(function () { rechne(); seiteBauen(); }, 0); });

  window.GRUNDRISS_AUSBAU = {
    aktualisieren: aktualisieren, jetzt: jetzt,
    ergebnis: function () { return ctx; },
    zustand: function () { return JSON.parse(JSON.stringify(S)); },
    setze: function (o) { Object.keys(o || {}).forEach(function (k) { S[k] = o[k]; }); speichern(); jetzt(); seiteBauen(); },
    seite: seiteBauen, rechnerErgebnis: function () { return rechnerErgebnis(S.bauteil); },
    uebernehmen: materialUebernehmen
  };
  setTimeout(function () { jetzt(); rechne(); seiteBauen(); }, 0);
})();
