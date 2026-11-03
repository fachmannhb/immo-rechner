/* Oberfläche „Heizarten im Vergleich“ (H1, 02.11.2026): Karte #hv-karte im Bereich Umbau, direkt unter dem Heizungs-Check (#hz-karte). Rechnung: heizung_kern.js, Daten: daten/heizung.js (vergleich), Texte: daten/texte_heizung.js.
   Das Haus liefert die Heizwärme (GRUNDRISS_HUELLE.waermeBedarf); ohne Haus rechnet die Karte mit dem Beispielhaus und sagt das sichtbar. Die Annahmen sind Bedienzustand (nicht im Plan), seit H1b im Browser-Speicher „immo-heizvergleich“.
   In den Plan geschrieben wird nur die Wahl „Für die Mappe übernehmen“ (plan.heizanlage.art). Keine Empfehlung, kein Sieger (R078).
   Bei der Auslieferung werden Kommentare und Einrückung entfernt (bau.py, SCHLANK). */
(function () {
  'use strict';
  var HK = window.HEIZUNG_KERN, G = window.GRUNDRISS, D = window.DATEN || {}, WZ = window.GRUNDRISS_ANBAU && window.GRUNDRISS_ANBAU.werkzeug, HD = D.heizung, V = HD && HD.vergleich;
  function byId(i) { return document.getElementById(i); }
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function melde(t) { var e = byId('hv-fehler'); if (e) { e.textContent = t || ''; e.hidden = !t; } }
  if (!HK || !G || !WZ || !V) { melde(tr('hvFehler', { grund: (!HK ? 'heizung_kern.js' : !WZ ? 'Karte Anbau' : !G ? 'Zeichnung' : 'Daten') + ' fehlt.' })); return; }
  var esc = WZ.esc, sym = WZ.symbol, nz = WZ.nz, n0 = WZ.n0, schild = WZ.annahmeSchild;
  function T(k, v) { return esc(tr(k, v)); }
  function nf(x, d) { return new Intl.NumberFormat(WZ.lang(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(x); }
  function r100(x) { return n0(Math.round(x / 100) * 100); }
  function datum(iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); }
  var ICON = { gas: 'i-flamme', oel: 'i-tropfen', waermepumpe: 'i-gs-waermepumpe', sole: 'i-boden', pellets: 'i-sa-holz', scheitholz: 'i-an-gartenhaus', fernwaerme: 'i-zentral', infrarot: 'i-blitz', hybrid: 'i-thermo' };
  var STAND = HK.standard();
  var KD = D.klima, KK = window.KLIMA_KERN, EN = D.energie || {}, klOK = !!(KD && KK && KD.annahmen && EN.speicher);
  var REG = { preis: { gas: [5, 30, 0.01], oel: [5, 30, 0.01], strom: [15, 60, 0.01], wpstrom: [15, 60, 0.01], pellets: [4, 20, 0.01], holz: [3, 20, 0.01], fernwaerme: [8, 30, 0.1] },
    nutz: { gas: [0.6, 1, 0.01], oel: [0.6, 1, 0.01], jaz_luft: [2, 6, 0.1], jaz_sole: [2, 6.5, 0.1], pellets: [0.6, 1, 0.01], scheitholz: [0.5, 1, 0.01], fernwaerme: [0.8, 1, 0.01], infrarot: [0.4, 1, 0.01], hybrid_wp: [0.2, 0.95, 0.05] } };
  var ST = null, ctx = null, timer = null, offen = {}, hilfe = {}, frage = null, nachricht = '', hinweis = true, wurzel = byId('hv-inhalt'), det = byId('hv-details');
  try { hinweis = localStorage.getItem('immo-hv-hinweis') !== '1'; } catch (e0) { hinweis = true; }
  if (klOK) REG.klima = { m2: [KD.annahmen.m2.min, KD.annahmen.m2.max, KD.annahmen.m2.step], js: [KD.annahmen.js.min, KD.annahmen.js.max, KD.annahmen.js.step] };
  function neuST() { return { sort: false, foerd: true, wptarif: false, heiz: STAND.heiz, ww: STAND.ww, preis: Object.assign({}, STAND.preis), nutz: Object.assign({}, STAND.nutz), klima: klOK ? KK.standard() : {} }; }
  ST = neuST();

  function kurz(t) { var m = /^(.*?)(?:,| \(|:|; )/.exec(t || ''), s = m ? m[1] : (t || ''); return s.length > 46 ? s.slice(0, 44) + '…' : s; }
  var CHIP = { 'geprüft': ['gepr', 'hvSt_gepr'], 'prüfen vor Nutzung': ['pruef', 'hvSt_pruef'], 'veraltet': ['pruef', 'hvSt_veralt'], 'Annahme': ['annahme', 'hvSt_annahme'], 'Lücke': ['luecke', 'hvSt_luecke'], 'ungeklärt': ['luecke', 'hvSt_ungeklaert'], 'unsicher': ['pruef', 'hvSt_unsicher'], 'nicht zulässig': ['luecke', 'hvSt_nzul'], 'nicht geprüft': ['luecke', 'hvSt_nichtgepr'], 'Verweis': ['eigen', 'hvSt_verweis'],
    g: ['gepr', 'hvS_g'], n: ['luecke', 'hvS_n'], p: ['pruef', 'hvS_p'], a: ['eigen', 'hvS_a'] };
  function chip(s) {
    var c = CHIP[s] || (/^veraltet/.test(s) ? CHIP['veraltet'] : /Angebotsauswertung/.test(s) ? ['gepr', 'statusAngebote'] : /^geprüft/.test(s) ? CHIP['geprüft'] : CHIP['prüfen vor Nutzung']);
    return '<span class="rg-status st-' + c[0] + '" data-status="' + esc(s) + '">' + T(c[1]) + '</span>';
  }
  /* Quelle mit Link, Abruf und Status direkt an der Zahl */
  function beleg(titel, url, abruf, status) {
    var n = esc(kurz(titel));
    return '<span class="ab-quelle">' + (/^https?:/.test(url || '') ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + n + '</a>' : n) + (abruf ? ' · ' + T('hvAbruf', { datum: datum(abruf) }) : '') + ' ' + chip(status) + '</span>';
  }
  function qb(q, status) { var x = V.quellen[q] || {}; return beleg(x.t, x.u, x.a, status || x.s); }
  function hk(id) { return '<button type="button" class="hilfe-knopf" data-hv="hilfe" data-wert="' + id + '" aria-expanded="' + !!hilfe[id] + '" aria-controls="' + id + '" aria-label="' + T('hilfeKnopf') + '">?</button>'; }
  function hp(id, inner) { return '<p class="klein hv-hilfe" id="' + id + '"' + (hilfe[id] ? '' : ' hidden') + '>' + inner + '</p>'; }

  /* ---------- Haus und Eingabe ---------- */
  function haus() {
    try { var H = window.GRUNDRISS_HUELLE; return H && H.waermeBedarf ? H.waermeBedarf() : { ok: false, grund: 'keinPlan' }; } catch (e1) { return { ok: false, grund: 'x' }; }
  }
  function eingabeAus(h) {
    return { heiz: h.ok ? h.kwh : ST.heiz, ww: ST.ww, foerd: ST.foerd, wptarif: ST.wptarif, preis: ST.preis, nutz: ST.nutz };
  }

  /* ---------- Teile der Karte ---------- */
  function grundHtml(h, c) {
    var p = { heiz: n0(c.heiz), ww: n0(c.ww), nutz: n0(c.nutz) };
    if (h.ok) return '<p class="hv-grund" data-hv-haus="ja">' + sym('i-haus') + '<span>' + T('hvHaus', p) + '</span></p>';
    var g = 'hvG_' + h.grund;
    return '<div class="ab-meldung" role="status" data-hv-haus="nein"><p>' + T('hvBeispiel', Object.assign({ grund: tr(window.TEXTE[g] ? g : 'hvG_x') }, p)) + '</p><div class="knopfreihe"><button type="button" class="knopf mittel" data-hv="zeichnen" id="hv-zeichnen">' + sym('i-grundriss') + ' ' + T('hvZeichnen') + '</button></div></div>';
  }
  function werkzeugHtml() {
    return '<div class="knopfreihe hv-werk"><button type="button" class="knopf mittel zweit" data-hv="check" id="hv-check">' + sym('i-paragraf') + ' ' + T('hvCheck') + '</button>' +
      '<button type="button" class="knopf mittel zweit' + (hinweis ? ' gs-puls' : '') + '" data-hv="sort" data-fk="t-sort" aria-pressed="' + ST.sort + '">' + sym('i-pfeil-ab') + ' ' + T(ST.sort ? 'hvSortAus' : 'hvSort') + '</button>' +
      '<button type="button" class="knopf mittel zweit" data-hv="foerd" data-fk="t-foerd" aria-pressed="' + ST.foerd + '">' + sym(ST.foerd ? 'i-an-ok' : 'i-an-stopp') + ' ' + T('hvFoerd') + ': ' + T(ST.foerd ? 'hvAn' : 'hvAus') + '</button>' + hk('hv-h-foerd') + '</div>' +
      hp('hv-h-foerd', T('hvHilfeFoerd')) + '<p class="klein" data-hv-foerdkurz="1">' + T('hvFoerdKurz') + '</p><p class="klein" data-hv-sorthinweis="1">' + schild() + ' ' + T('hvSortHinweis') + '</p>';
  }
  var RW = [0, 12000, 100], RH = [2000, 40000, 500];
  /* H1b: Annahmen bleiben erhalten (R020), eigener Speicher wie beim Heizungs-Check. Ungültiges oder beschädigtes fällt still auf die Vorgabe zurück; „Zurück auf Vorgaben“ löscht den Speicher. */
  var SPEICHER = 'immo-heizvergleich';
  function zahlIn(x, r) { return typeof x === 'number' && isFinite(x) && x >= r[0] && x <= r[1]; }
  function laden() {
    var s = neuST(), o = null;
    try { o = JSON.parse(localStorage.getItem(SPEICHER)); } catch (e4) { o = null; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return s;
    ['sort', 'foerd', 'wptarif'].forEach(function (k) { if (typeof o[k] === 'boolean') s[k] = o[k]; });
    if (zahlIn(o.heiz, RH)) s.heiz = o.heiz;
    if (zahlIn(o.ww, RW)) s.ww = o.ww;
    ['preis', 'nutz'].forEach(function (g) { if (o[g] && typeof o[g] === 'object') Object.keys(REG[g]).forEach(function (k) { if (zahlIn(o[g][k], REG[g][k])) s[g][k] = o[g][k]; }); });
    if (klOK && o.klima && typeof o.klima === 'object') ['m2', 'js'].forEach(function (k) { if (zahlIn(o.klima[k], REG.klima[k])) s.klima[k] = o.klima[k]; });
    return s;
  }
  var merkt = true;
  function speichern() { try { localStorage.setItem(SPEICHER, JSON.stringify(ST)); merkt = true; } catch (e5) { merkt = false; /* nur das Merken fällt weg, die Rechnung geht weiter; der Hinweis unter den Annahmen sagt es */ } }
  ST = laden();
  function dez(r) { return r[2] >= 1 ? 0 : r[2] >= 0.1 ? 1 : 2; }
  function reg(pfad, lab, a, r, extra, kq) {
    var p = pfad.split('.'), id = 'hv-' + p.join('-'), w = p.length === 2 ? ST[p[0]][p[1]] : ST[pfad];
    return '<div class="es-feld hv-reg"><label class="es-label" for="' + id + '-z">' + T(lab) + '</label><div class="hv-reg-z"><input type="range" id="' + id + '" min="' + r[0] + '" max="' + r[1] + '" step="' + r[2] + '" value="' + w + '" data-hv-r="' + pfad + '" aria-label="' + T(lab) + '">' +
      '<input type="text" inputmode="decimal" id="' + id + '-z" value="' + nf(w, dez(r)) + '" data-hv-z="' + pfad + '" aria-describedby="' + id + '-f"></div><span class="fehler" id="' + id + '-f" role="alert"></span>' +
      '<span class="klein">' + (kq ? qk(a.q, a.s) : qb(a.q, a.s)) + '</span><span class="klein">' + esc(a.n || '') + '</span>' + (extra || '') + '</div>';
  }
  function annahmenHtml(h) {
    var A = V.annahmen, s = '<details class="mehr-einst" id="hv-ann"' + (offen['ann'] ? ' open' : '') + ' data-hv-det="ann"><summary>' + sym('i-werkzeug') + ' ' + T('hvAnn') + '</summary><div class="hv-regeln">';
    s += reg('ww', 'hvWW', A.ww, RW);
    if (!h.ok) s += reg('heiz', 'hvHeiz', A.heiz0, RH);
    Object.keys(REG.preis).forEach(function (k) { s += reg('preis.' + k, 'hvP_' + k, A.preis[k], REG.preis[k], k === 'oel' ? '<button type="button" class="knopf mittel zweit hv-alt" data-hv="oelalt">' + T('hvOelAlt') + '</button>' : ''); });
    s += '<div class="es-feld hv-reg"><button type="button" class="es-var" data-hv="wptarif" data-fk="t-wp" aria-pressed="' + ST.wptarif + '"><span class="es-var-kopf">' + sym(ST.wptarif ? 'i-an-ok' : 'i-an-frage') + '<b>' + T('hvWpTarif') + ': ' + T(ST.wptarif ? 'hvAn' : 'hvAus') + '</b></span></button></div>';
    Object.keys(REG.nutz).forEach(function (k) { s += reg('nutz.' + k, 'hvN_' + k, A.nutz[k], REG.nutz[k]); });
    return s + '</div><div class="knopfreihe"><button type="button" class="knopf mittel zweit" data-hv="reset">' + sym('i-dreh') + ' ' + T('hvAnnReset') + '</button></div><p class="klein" data-hv-gemerkt="' + (merkt ? 'ja' : 'nein') + '">' + T(merkt ? 'hvAnnGemerkt' : 'hvAnnNichtGemerkt') + '</p></details>';
  }
  function balken(klasse, von, bis, max, label, offen) {
    var a = Math.min(100, Math.max(0, von / max * 100)), b = Math.min(100, Math.max(a, bis / max * 100));
    return '<div class="es-balken hv-bal" role="img" aria-label="' + esc(label) + '"><span class="es-b ' + klasse + '" style="width:' + a.toFixed(1) + '%"></span><span class="es-b ' + klasse + ' hv-hell' + (offen ? ' hv-off' : '') + '" style="width:' + (b - a).toFixed(1) + '%"></span></div>';
  }
  function aufKey(a) { return a === 2.5 ? 'hvAuf_25' : 'hvAuf_' + a; }
  function bioHtml(id) {
    var bt = HD.bio_treppe;
    if (!V.arten[id].bio || !bt) return '';
    return '<div class="hv-bio" data-hv-bio="1"><b>' + T('hvBio', { d: datum(bt.stichtag) }) + '</b> ' + hk('hv-h-bio-' + id) + '<div class="hv-stufen">' + bt.stufen.map(function (s) { return '<span class="hv-stufe">' + T('hvBioStufe', { j: s[0], p: s[1] }) + '</span>'; }).join('') + '</div>' +
      hp('hv-h-bio-' + id, T('hvBioHilfe', { ueb: bt.ueberschrift, abruf: datum(bt.abruf) })) + '</div>';
  }
  function liste(arr) { return '<ul class="gs-ul hv-ul">' + arr.map(function (x) { return '<li lang="de">' + esc(x[0]) + (x[1] ? ' <span class="klein">(' + qb(x[1]) + ')</span>' : '') + '</li>'; }).join('') + '</ul>'; }
  function rechenweg(x, d) {
    var A = V.arten[x.id], s = '<ul class="gs-ul hv-ul" data-hv-rechenweg="' + x.id + '">';
    s += '<li data-hv-zeile="a">' + T('hvRwA', { von: n0(x.a.von), bis: n0(x.a.bis) }) + ' ' + (d.q ? qb(d.q, d.status) : beleg(d.quelle, d.url, d.abruf, d.status)) + (d.hinweis ? ' <span class="klein" lang="de">' + esc(d.hinweis) + '</span>' : '') + '</li>';
    s += '<li data-hv-zeile="f">' + (x.f.aktiv ? T('hvRwF', { von: n0(x.f.von), bis: n0(x.f.bis) }) + ' ' + qb(V.foerderung.q) : T(A.foerd === 'luecke' ? 'hvFoerdLuecke' : A.foerd === 'nein' ? 'hvFoerdNein' : 'hvRwF0')) + '</li>';
    s += '<li data-hv-zeile="e">' + T('hvRwE', { kwh: n0(x.endenergie), eur: n0(x.energie) }) + '</li>';
    s += '<li data-hv-zeile="w">' + (x.wart.luecke ? T('hvRwW0') : T(x.wart.von === x.wart.bis ? 'hvRwW1' : 'hvRwW', { von: n0(x.wart.von), bis: n0(x.wart.bis) }) + ' ' + qb(A.wart[3], A.wart[4])) + '</li>';
    s += '<li data-hv-zeile="c">' + (A.co2 ? T('hvRwC', { f: nf(A.co2[0], 0) + (A.co2[1] !== A.co2[0] ? '–' + nf(A.co2[1], 0) : '') }) : T('hvRwCh')) + ' ' + qb('a9') + '</li></ul>';
    return s;
  }
  function erlHtml(id) {
    return '<ul class="hv-erl">' + V.arten[id].erl.map(function (k) {
      var e = V.erlx[k];
      return '<li lang="de"><b>' + (e.u ? '<a href="' + esc(e.u) + '" target="_blank" rel="noopener">' + esc(e.p) + '</a>' : esc(e.p)) + '</b> ' + chip(e.s) + ' ' + esc(e.t) + '</li>';
    }).join('') + '</ul>';
  }
  function karteHtml(x, c, plan) {
    var A = V.arten[x.id], d = HD.arten[x.id], name = tr('hvA_' + x.id), g = x.gesamt, m = c.max, gewaehlt = plan.heizanlage && plan.heizanlage.art === x.id;
    var kt = T('hvKostenZ', { von: r100(g.von), bis: r100(g.bis) }) + (x.wart.luecke ? ' *' : ''), co = x.co2.von === x.co2.bis ? T('hvCo2Z1', { von: nf(x.co2.von, 2) }) : T('hvCo2Z', { von: nf(x.co2.von, 1), bis: nf(x.co2.bis, 1) });
    var s = '<article class="hv-k" data-hv-art="' + x.id + '" data-von="' + Math.round(g.von) + '" data-bis="' + Math.round(g.bis) + '"><div class="hv-k-kopf">' + sym(ICON[x.id]) + '<h4 class="hv-name">' + esc(name) + '</h4></div>';
    s += '<div class="hv-zeile"><span>' + T('hvB_kosten') + '</span><b class="es-zahl" data-hv-kosten="1">' + kt + '</b></div>' + balken('c1', g.von, g.bis, m.kosten, tr('hvB_kosten') + ': ' + tr('hvKostenZ', { von: r100(g.von), bis: r100(g.bis) }));
    s += '<div class="hv-zeile"><span>' + T('hvB_co2') + '</span><b class="es-zahl" data-hv-co2="1">' + co + '</b></div>' + balken('c2', x.co2.von, x.co2.bis, m.co2, tr('hvB_co2') + ': ' + co.replace(/<[^>]+>/g, ''));
    s += '<div class="hv-zeile"><span>' + T('hvB_auf') + ' <span class="klein">(' + T('hvEigen') + ')</span></span><b data-hv-auf="' + x.auf + '">' + T(aufKey(x.auf)) + '</b></div>' + balken('c3', x.auf, x.auf, m.auf, tr('hvB_auf') + ': ' + tr(aufKey(x.auf)));
    if (x.wart.luecke) s += '<p class="klein" data-hv-luecke="wartung">* ' + T('hvRwW0') + '</p>';
    if (x.ww === false) s += '<p class="klein" data-hv-ww="aus">' + T('hvInfrarotWW') + '</p><p class="klein" data-hv-ir="auslegung">' + T('hvIrAnwalt') + '</p>';
    s += bioHtml(x.id);
    if (frage && frage.neu === x.id) s += '<div class="ab-meldung" role="alert" data-hv-frage="1"><p>' + T('hvMappeFrage', { alt: tr('mpHz_' + frage.alt), neu: name }) + '</p><div class="knopfreihe"><button type="button" class="knopf mittel" data-hv="ersetzen" data-wert="' + x.id + '" data-fk="ers-' + x.id + '">' + T('hvErsetzen') + '</button><button type="button" class="knopf mittel zweit" data-hv="behalten" data-fk="beh-' + x.id + '">' + T('hvBehalten') + '</button></div></div>';
    s += '<button type="button" class="es-var hv-mappe" data-hv="mappe" data-wert="' + x.id + '" data-fk="map-' + x.id + '" aria-pressed="' + !!gewaehlt + '"><span class="es-var-kopf">' + sym(gewaehlt ? 'i-an-ok' : 'i-grundriss') + '<b>' + T(gewaehlt ? 'hvMappeIst' : 'hvMappe') + '</b></span></button>';
    s += '<details class="hv-det" data-hv-det="' + x.id + '"' + (offen[x.id] ? ' open' : '') + '><summary>' + T('hvMehr') + '</summary>' + rechenweg(x, d);
    s += '<h5 class="es-h5">' + T('hvVor') + '</h5>' + liste(A.vor) + '<h5 class="es-h5">' + T('hvNach') + '</h5>' + liste(A.nach) + '<h5 class="es-h5">' + sym('i-paragraf') + T('hvErl') + '</h5><p class="klein">' + T('hvRecht') + '</p>' + erlHtml(x.id);
    if (A.hinweis) s += '<p class="klein" lang="de">' + esc(A.hinweis) + '</p>';
    return s + '</details></article>';
  }
  function importHtml(liste, key) {
    key = key || 'import';
    return '<details class="mehr-einst" data-hv-det="' + key + '"' + (offen[key] ? ' open' : '') + '><summary>' + sym('i-karte') + ' ' + T('hvImport') + '</summary><p class="klein">' + T('hvImportT') + '</p><ul class="gs-ul hv-ul" ' + (key === 'import' ? 'data-hv-import="1"' : 'data-kl-import="' + key + '"') + '>' + (liste || V['import']).map(function (i) {
      return '<li lang="de" data-hv-land="' + i.l + '"><b>' + esc(i.s) + '</b> ' + chip(i.g) + ' ' + esc(i.t) + '</li>';
    }).join('') + '</ul></details>';
  }
  function kartenHtml(c, plan) {
    var reihe = ST.sort ? HK.nachKosten(c) : V.reihe, by = {};
    c.arten.forEach(function (x) { by[x.id] = x; });
    return '<p class="klein">' + T('hvSkala') + ' ' + hk('hv-h-rw') + '</p>' + hp('hv-h-rw', T('hvHilfeRechnung')) + '<div class="hv-grid" data-hv-sort="' + ST.sort + '">' + reihe.map(function (id) { return karteHtml(by[id], c, plan); }).join('') + '</div>';
  }
  function mitFokus(w, fn) {
    var af = document.activeElement, fk = af && w.contains(af) ? af.getAttribute('data-fk') || af.id : null;
    fn();
    if (fk) { var n = w.querySelector('[data-fk="' + fk + '"]') || byId(fk); if (n && n.focus) n.focus({ preventScroll: true }); }
  }

  /* ---------- H2: Klimaanlage, Strom, Speicher (Daten daten/klima.js, Kern klima_kern.js; Speicherpreis, Faustregel, PV-Preis, Steckersolar und 14a stehen nur in daten/energie.js und werden dort gelesen) ---------- */
  var KICON = { mono: 'i-luft', split: 'i-fenster', multi: 'i-zentral', fan: 'i-luefter', schatten: 'i-glas', wp: 'i-gs-waermepumpe', netz: 'i-blitz', pvdach: 'i-dach', pvsp: 'i-batterie', balkon: 'i-sonne', bhkw: 'i-thermo', bz: 'i-tropfen', wind: 'i-gs-kleinwind', notstrom: 'i-an-achtung', li: 'i-batterie', na: 'i-blitz', h2: 'i-tropfen', v2h: 'i-auto', waerme: 'i-flamme' };
  var KAB = [['kuehlen', 'i-luft', 'klAbK', 'klAbKs'], ['strom', 'i-blitz', 'klAbS', 'klAbSs'], ['speicher', 'i-batterie', 'klAbSp', 'klAbSps']];
  var KRECH = { eer: 'mono', seer: 'split' };
  var KFELD = { kuehlen: ['an', 'bt', 'wa', 'le'], strom: ['ct', 'an', 'wa', 'le'], speicher: ['an', 'le'] };
  function qk(q, s) { var x = KD.quellen[q] || {}; return beleg(x.t, x.u, x.a, s || x.s); }
  function zf(x) { return nf(x, x % 1 === 0 ? 0 : (Math.round(x * 10) / 10 === x ? 1 : 2)); }
  function efind(l, i) { var a = EN[l] || []; for (var j = 0; j < a.length; j++) if (a[j].id === i) return a[j]; return {}; }
  function fakt(f) {
    if (f.ref) { var e = efind(f.ref[0], f.ref[1]), q = (EN.quellen || {})[e.quelle] || {}; return { von: e.von, bis: e.bis, e: e.einheit === 'Jahre' ? 'a' : e.einheit, s: e.status, id: e.id, n: e.hinweis, beleg: beleg(q.titel, q.url, e.abruf, e.status) }; }
    var x = KD.quellen[f.q] || {};
    return { von: f.von, bis: f.bis, off: f.off, e: f.e, s: f.s, id: f.id, n: f.n, beleg: beleg(x.t, x.u, x.a, f.s) };
  }
  function ue(e, j) { return e === 'a' ? tr('klUa') : e === 'ct' ? 'ct/kWh' : e === '€ je Fenster' ? tr('klUf') : (e === '€' && j) ? tr('klUj') : e; }
  function spanne(x, e) {
    var v = zf(x.von);
    if (x.bis === null || x.bis === undefined) return tr('klAb', { von: v, e: e });
    if (x.von === x.bis) return v + ' ' + e;
    return tr(x.off === 'bis' ? 'klUeber' : 'klSp', { von: v, bis: zf(x.bis), e: e });
  }
  function rowB(lab, x, max, kl, e, tg) {
    var t = spanne(x, e);
    return '<div class="hv-zeile"><span>' + esc(lab) + '</span><b class="es-zahl" data-kl-w="1"' + (tg ? ' data-kl-b="' + tg + '"' : '') + ' data-von="' + Math.round(x.von * 100) + '" data-bis="' + (x.bis == null ? '' : Math.round(x.bis * 100)) + '">' + esc(t) + '</b></div>' +
      (max && x.bis != null ? balken(kl, x.von, x.bis, max, lab + ': ' + t, x.off === 'bis') : '') + '<p class="klein hv-q" data-k="' + esc(x.id || '') + '">' + x.beleg + '</p>';
  }
  function rowL(lab, x) { return '<p class="klein hv-lk-z" data-hv-luecke="1" data-k="' + esc(x.id || '') + '"><b>' + esc(lab) + '</b> ' + chip(x.s) + ' ' + esc(x.luecke) + '</p>'; }
  function rowT(lab, a) { return '<div class="hv-zeile"><span>' + esc(lab) + '</span><b data-kl-text="1">' + esc(a.text) + '</b></div><p class="klein hv-q" data-k="' + esc(a.id || '') + '">' + qk(a.q, a.s) + '</p>'; }
  function klRechnen() { try { return KK.rechne({ m2: ST.klima.m2, js: ST.klima.js, strom: ST.preis.strom }); } catch (e7) { return { ok: false, grund: String(e7 && e7.message || e7) }; } }
  function klM(k) {
    var M = { an: 0, bt: Math.max(k.kuehl.mono.eur[1], k.kuehl.split.eur[1]), ct: k.ct, sp: 1000 };
    Object.keys(KD.kuehlen).forEach(function (i) { ((KD.kuehlen[i].f || {}).an || []).forEach(function (f) { if (f.e === '€' && f.bis > M.an) M.an = f.bis; }); });
    Object.keys(KD.strom).forEach(function (i) { ((KD.strom[i].f || {}).ct || []).forEach(function (f) { if (f.bis > M.ct) M.ct = f.bis; }); });
    return M;
  }
  function klWerte(ab, d, k, M) {
    var s = '', f = d.f || {}, x, r, q;
    if (ab === 'kuehlen') {
      (f.an || []).forEach(function (a) { x = fakt(a); s += rowB(tr('klB_an'), x, x.e === '€' ? M.an : 0, 'c1', ue(x.e)); });
      if (d.bt && d.bt.rechne) { r = k.kuehl[KRECH[d.bt.rechne]]; q = KD.quellen[d.bt.q]; s += rowB(tr('klB_bt'), { von: r.eur[0], bis: r.eur[1], e: '€', beleg: beleg(q.t, q.u, q.a, d.bt.s), id: d.bt.id }, M.bt, 'c2', '€', 'bt'); }
      else if (d.bt && d.bt.luecke) s += rowL(tr('klB_bt'), d.bt);
      else if (d.bt) s += rowT(tr('klB_bt'), d.bt);
    } else if (ab === 'strom') {
      if (d.netz) { q = V.annahmen.preis.strom; s += rowB(tr('klB_ct'), { von: ST.preis.strom, bis: ST.preis.strom, e: 'ct', beleg: qb(q.q, q.s), id: q.id }, M.ct, 'c1', 'ct/kWh', 'ct'); }
      (f.ct || []).forEach(function (a) { if (a.luecke) s += rowL(tr('klB_ct'), a); else { x = fakt(a); s += rowB(tr('klB_ct'), x, M.ct, 'c1', 'ct/kWh', 'ct'); } });
      (f.an || []).forEach(function (a) { x = fakt(a); s += rowB(tr('klB_an'), x, 0, 'c1', ue(x.e)); });
    } else (f.an || []).forEach(function (a) { x = fakt(a); s += rowB(tr('klB_ek'), x, M.sp, 'c1', x.e); });
    return s;
  }
  function zeileMehr(key, a, k) {
    var lab = '<b>' + esc(tr('klB_' + key)) + ':</b> ', x, r, t, rw = '';
    if (a.luecke) return '<li data-kl-z="' + key + '">' + lab + chip(a.s) + ' ' + esc(a.luecke) + '</li>';
    if (a.rechne) {
      r = k.kuehl[KRECH[a.rechne]]; t = spanne({ von: r.eur[0], bis: r.eur[1] }, '€');
      rw = '<br><span class="klein" data-kl-rw="' + a.rechne + '">' + T('klRw_' + a.rechne, { kw: zf(k.kw), m2: n0(k.m2), w: n0(KD.annahmen.kwm2.w), std: n0(k.std), t: zf(r.teiler[0]) + ' – ' + zf(r.teiler[1]), kwh: zf(Math.round(r.kwh[0])) + ' – ' + zf(Math.round(r.kwh[1])), ct: nf(k.ct, 2), eur: nf(r.eur[0], 2) + ' – ' + nf(r.eur[1], 2) }) + '</span>';
      return '<li data-kl-z="bt">' + lab + esc(t) + ' ' + qk(a.q, a.s) + rw + '</li>';
    }
    if (a.text) return '<li data-kl-z="bt">' + lab + esc(a.text) + ' ' + qk(a.q, a.s) + '</li>';
    x = fakt(a); t = spanne(x, ue(x.e, key === 'wa'));
    return '<li data-kl-z="' + key + '">' + lab + esc(t) + ' ' + x.beleg + (x.n ? ' <span class="klein" lang="de">' + esc(x.n) + '</span>' : '') + '</li>';
  }
  function listeK(arr) { return arr.length ? '<ul class="gs-ul hv-ul">' + arr.map(function (x) { return '<li lang="de">' + esc(x[0]) + (x[1] ? ' <span class="klein">(' + qk(x[1]) + ')</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="klein">' + chip('Lücke') + ' ' + T('klNichtBelegt') + '</p>'; }
  function erlK(ids) {
    return '<ul class="hv-erl" data-kl-erl="1">' + ids.map(function (i) {
      var e = KD.erlx[i], t = e.t, s = e.s, u = '', r, q;
      if (e.ref) { r = efind(e.ref[0], e.ref[1]); q = (EN.quellen || {})[r.quelle] || {}; t = (r.name || '') + (r.was ? ' ' + r.was : ''); s = r.status; u = q.url; } else if (e.q) u = (KD.quellen[e.q] || {}).u;
      return '<li lang="de"><b>' + (/^https?:/.test(u || '') ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(e.p) + '</a>' : esc(e.p)) + '</b> ' + chip(s) + ' ' + esc(t) + '</li>';
    }).join('') + '</ul>';
  }
  function klMehr(ab, id, d, k) {
    var keys = (d.verweis || d.luecke) ? [] : d.netz ? ['ct'] : KFELD[ab], s = '<details class="hv-det" data-hv-det="kl_' + id + '"' + (offen['kl_' + id] ? ' open' : '') + '><summary>' + T('klMehr') + '</summary>';
    if (keys.length) s += '<ul class="gs-ul hv-ul" data-kl-zahlen="' + id + '">' + keys.map(function (key) {
      var fl = key === 'bt' ? (d.bt ? [d.bt] : []) : (d.f && d.f[key]) || [], q;
      if (d.netz) { q = V.annahmen.preis.strom; return '<li data-kl-z="ct"><b>' + esc(tr('klB_ct')) + ':</b> ' + esc(nf(ST.preis.strom, 2) + ' ct/kWh') + ' ' + qb(q.q, q.s) + ' <span class="klein" lang="de">' + esc(q.n) + '</span></li>'; }
      return fl.length ? fl.map(function (a) { return zeileMehr(key, a, k); }).join('') : '<li data-kl-z="' + key + '"><b>' + esc(tr('klB_' + key)) + ':</b> ' + chip('Lücke') + ' ' + T('klNichtBelegt') + '</li>';
    }).join('') + '</ul>';
    if (!d.verweis && !d.luecke) s += '<h5 class="es-h5">' + T('hvVor') + '</h5>' + listeK(d.vor) + '<h5 class="es-h5">' + T('hvNach') + '</h5>' + listeK(d.nach);
    if (d.erl.length) s += '<h5 class="es-h5">' + sym('i-paragraf') + T('klRechtH') + '</h5><p class="klein">' + T('hvRecht') + '</p>' + erlK(d.erl);
    if (d.hinweis && !d.verweis) s += '<p class="klein" lang="de">' + esc(d.hinweis) + '</p>';
    return s + '</details>';
  }
  function klKarte(ab, id, k, M) {
    var d = KD[ab][id], s = '<article class="hv-k kl-k' + (d.luecke ? ' hv-lk' : '') + '" data-kl-art="' + id + '"><div class="hv-k-kopf">' + sym(KICON[id]) + '<h4 class="hv-name">' + T('klA_' + id) + '</h4></div>';
    if (d.luecke) s += rowL(tr('klB_luecke'), { s: d.luecke_s, luecke: d.luecke, id: d.luecke_id });
    else if (d.verweis) s += '<p class="klein" data-kl-verweis="1">' + chip('Verweis') + ' <span lang="de">' + esc(d.hinweis) + '</span></p><button type="button" class="knopf mittel zweit" data-hv="oben" data-fk="kl-o-' + id + '">' + sym('i-waage') + ' ' + T('klOben') + '</button>';
    else s += klWerte(ab, d, k, M);
    if (d.auf) s += '<div class="hv-zeile"><span>' + T('hvB_auf') + ' <span class="klein">(' + T('hvEigen') + ')</span></span><b data-hv-auf="' + d.auf + '">' + T(aufKey(d.auf)) + '</b></div>' + balken('c3', d.auf, d.auf, 3, tr('hvB_auf') + ': ' + tr(aufKey(d.auf)));
    return s + (d.luecke || (d.verweis && !d.erl.length) ? '' : klMehr(ab, id, d, k)) + '</article>';
  }
  function richt(k) {
    var p = k.sp, fa = fakt({ ref: ['speicher', 'sp_groesse'] }), pr = fakt({ ref: ['speicher', 'sp_preis_spanne'] }), mx = REG.klima.js[1] / 1000 * p.faust * p.euroKwh[1];
    return '<div class="kl-richt" data-kl-richt="1"><p class="kl-richt-t"><b data-kl-kwh="' + p.kwh + '">' + T('klRichtT', { js: n0(p.js), kwh: zf(p.kwh) }) + '</b> ' + schild() + '</p><div class="hv-zeile"><span>' + T('klRichtK') + '</span><b class="es-zahl" data-kl-kosten="1" data-von="' + Math.round(p.von) + '" data-bis="' + Math.round(p.bis) + '">' + T('klSp', { von: n0(p.von), bis: n0(p.bis), e: '€' }) + '</b></div>' +
      balken('c1', p.von, p.bis, mx, tr('klRichtK') + ': ' + tr('klSp', { von: n0(p.von), bis: n0(p.bis), e: '€' })) + '<p class="klein">' + T('klRichtRw', { js: n0(p.js), f: zf(p.faust), kwh: zf(p.kwh), p1: n0(p.euroKwh[0]), p2: n0(p.euroKwh[1]) }) + '</p><p class="klein hv-q">' + fa.beleg + ' ' + pr.beleg + '</p></div>';
  }
  function klInner(ab, k) {
    if (!k.ok) return '<p class="fehler" role="alert">' + T('klFehlerRechnen', { grund: k.grund }) + '</p>';
    var M = klM(k), s = '';
    if (ab === 'kuehlen') s += '<p class="klein" data-kl-strompreis="1">' + T('klStrompreis', { ct: nf(k.ct, 2) }) + '</p>';
    if (ab === 'speicher') s += richt(k);
    return s + '<p class="klein">' + T(ab === 'strom' ? 'klSkalaCt' : 'klSkala') + '</p><div class="hv-grid" data-kl-grid="' + ab + '">' + KD.reihe[ab].map(function (id) { return klKarte(ab, id, k, M); }).join('') + '</div>';
  }
  function klAb(a, k) {
    var ab = a[0], A = KD.annahmen, s = '<details class="mehr-einst kl-ab" id="kl-ab-' + ab + '" data-hv-det="kl_' + ab + '"' + (offen['kl_' + ab] ? ' open' : '') + '><summary>' + sym(a[1]) + ' <b>' + T(a[2]) + '</b> <span class="klein">' + T(a[3]) + '</span></summary>';
    if (ab === 'kuehlen') s += '<div class="hv-regeln">' + reg('klima.m2', 'klM2', A.m2, REG.klima.m2, '', true) + '</div><p class="klein">' + schild() + ' ' + T('klKuehlAnn', { w: n0(A.kwm2.w), std: n0(A.std.w), s1: zf(A.seer_gut.w), s2: zf(A.seer_mittel.w), e1: zf(A.eer_gut.w), e2: zf(A.eer_schlecht.w) }) + ' ' + hk('kl-h-k') + '</p>' + hp('kl-h-k', T('klKuehlHilfe'));
    if (ab === 'strom') s += '<p class="klein">' + schild() + ' ' + T('klStromMass') + '</p>';
    if (ab === 'speicher') s += '<div class="hv-regeln">' + reg('klima.js', 'klJS', A.js, REG.klima.js, '', true) + '</div><p class="klein">' + T('klSpeicherAnn') + ' ' + hk('kl-h-sp') + '</p>' + hp('kl-h-sp', T('klSpeicherHilfe'));
    return s + '<div data-kl-karten="' + ab + '">' + klInner(ab, k) + '</div>' + importHtml(KD['import'][ab], 'kl_i_' + ab) + '</details>';
  }
  function klBox() {
    if (!klOK) return '<div class="hv-platz" data-hv-platz="1"><p class="fehler" role="alert">' + T('klFehler', { grund: (!KK ? 'klima_kern.js' : 'daten/klima.js oder daten/energie.js') + ' fehlt.' }) + '</p></div>';
    var k = klRechnen();
    return '<div class="kl-block" data-kl-block="1"><h4>' + sym('i-sonne') + ' ' + T('klBlock') + '</h4><p class="klein">' + schild() + ' ' + T('klKeine') + '</p><div class="knopfreihe hv-werk"><button type="button" class="knopf mittel zweit" data-hv="oben" data-fk="kl-oben" id="kl-oben">' + sym('i-waage') + ' ' + T('klOben') + '</button><button type="button" class="knopf mittel zweit" data-hv="pv" data-fk="kl-pv" id="kl-pv">' + sym('i-sonne') + ' ' + T('klPV') + '</button></div>' + KAB.map(function (a) { return klAb(a, k); }).join('') + '</div>';
  }
  function klNeu() {
    if (!klOK || !wurzel) return;
    var k = klRechnen();
    KAB.forEach(function (a) { var el = wurzel.querySelector('[data-kl-karten="' + a[0] + '"]'); if (el) el.innerHTML = klInner(a[0], k); });
  }
  function zuPv() {
    var tg = byId('tab-grundriss'); if (tg) tg.click();
    var d = byId('g-strom-details'); if (d) d.open = true;
    var kk = byId('g-strom-karte'); if (kk) kk.scrollIntoView({ block: 'start', behavior: 'auto' });
    var su = d && d.querySelector('summary'); if (su) su.focus({ preventScroll: true });
  }

  /* ---------- Zeichnen ---------- */
  function rechnen() {
    var h = haus(), c = HK.rechne(eingabeAus(h));
    if (!c.ok) { melde(tr('hvFehlerRechnen', { grund: c.grund })); return null; }
    if (c.e.meldungen.length) melde(tr('hvMeld', { was: c.e.meldungen.join(', ') })); else melde('');
    ctx = { h: h, c: c };
    return ctx;
  }
  function kartenNeu() {
    var k = rechnen(), box = byId('hv-karten'), kopf = byId('hv-grund');
    if (!k || !box) return;
    var plan = G.plan();
    mitFokus(wurzel, function () { kopf.innerHTML = grundHtml(k.h, k.c); box.innerHTML = kartenHtml(k.c, plan); byId('hv-meld').textContent = nachricht; klNeu(); });
  }
  function jetzt() {
    if (!wurzel || !det) return;
    var k = rechnen();
    if (!k) { wurzel.innerHTML = ''; return; }
    var plan = G.plan();
    mitFokus(wurzel, function () {
      wurzel.innerHTML = '<div id="hv-grund">' + grundHtml(k.h, k.c) + '</div>' + werkzeugHtml() + '<p class="klein" id="hv-meld" role="status" aria-live="polite">' + esc(nachricht) + '</p>' + annahmenHtml(k.h) + '<div id="hv-karten">' + kartenHtml(k.c, plan) + '</div>' +
        klBox() + importHtml();
    });
  }
  function aktualisieren() {
    clearTimeout(timer);
    timer = setTimeout(function () { if (det && det.open) jetzt(); }, 150);
  }

  /* ---------- Bedienung ---------- */
  function parse(t) { var s = String(t).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'), x = parseFloat(s); return /^-?\d*\.?\d+$/.test(s) && isFinite(x) ? x : NaN; }
  function setzeWert(pfad, x) {
    var p = pfad.split('.');
    if (p.length === 2) ST[p[0]][p[1]] = x; else ST[p[0]] = x;
    speichern();
  }
  function bereich(pfad) { var p = pfad.split('.'); return p.length === 2 ? REG[p[0]][p[1]] : pfad === 'ww' ? RW : RH; }
  function bei(ev) {
    var t = ev.target, r = t.getAttribute && t.getAttribute('data-hv-r'), z = t.getAttribute && t.getAttribute('data-hv-z');
    if (r) {
      var x = parseFloat(t.value), zf = t.parentNode.querySelector('[data-hv-z]');
      if (!isFinite(x)) return;
      setzeWert(r, x); if (zf) zf.value = nf(x, dez(bereich(r)));
      kartenNeu();
    } else if (z) {
      var b = bereich(z), v = parse(t.value), fe = t.parentNode.parentNode.querySelector('.fehler') || t.parentNode.querySelector('.fehler');
      if (!(v >= b[0] && v <= b[1])) { if (ev.type === 'change') { if (fe) fe.textContent = tr('hvFeld', { min: nf(b[0], dez(b)), max: nf(b[1], dez(b)) }); t.setAttribute('aria-invalid', 'true'); } return; }
      if (fe) fe.textContent = ''; t.removeAttribute('aria-invalid');
      setzeWert(z, v); var sl = t.parentNode.querySelector('[data-hv-r]'); if (sl) sl.value = v;
      kartenNeu();
    }
  }
  function zuCheck() {
    var hz = byId('hz-karte'), p = G.plan(), art = p.heizanlage && p.heizanlage.art, MAP = { gas: 'gas', oel: 'oel', waermepumpe: 'waermepumpe', sole: 'waermepumpe', fernwaerme: 'fernwaerme', pellets: 'sonstige', scheitholz: 'sonstige', infrarot: 'sonstige' };
    if (!hz) return;
    hz.open = true;
    var sel = byId('hz-art');
    if (sel && !sel.value && MAP[art]) { sel.value = MAP[art]; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    hz.scrollIntoView({ block: 'start', behavior: 'auto' });
    var s = hz.querySelector('summary'); if (s) s.focus({ preventScroll: true });
  }
  function uebernehmen(w) {
    var p = G.plan();
    p.heizanlage = { art: w };
    try { G.geaendert(); } catch (e2) { melde(tr('hvFehler', { grund: String(e2 && e2.message || e2) })); return; }
    nachricht = tr('hvMappeOk', { art: tr('hvA_' + w) });
    frage = null; kartenNeu();
  }
  function klick(ev) {
    var t = ev.target.closest('[data-hv]');
    if (!t) return;
    if (hinweis) { hinweis = false; try { localStorage.setItem('immo-hv-hinweis', '1'); } catch (e3) { /* nur der Hinweis fällt weg */ } }
    var a = t.getAttribute('data-hv'), w = t.getAttribute('data-wert'), plan = G.plan(), alt;
    if (a === 'hilfe') { var p = byId(w), auf = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', auf); hilfe[w] = auf; if (p) p.hidden = !auf; return; }
    if (a === 'check') { zuCheck(); return; }
    if (a === 'oben') { var ok0 = byId('hv-karte'); if (ok0) ok0.scrollIntoView({ block: 'start', behavior: 'auto' }); var su0 = byId('hv-summary'); if (su0) su0.focus({ preventScroll: true }); return; }
    if (a === 'pv') { zuPv(); return; }
    if (a === 'zeichnen') { var tg = byId('tab-grundriss'); if (tg) tg.click(); return; }
    if (a === 'sort' || a === 'foerd' || a === 'wptarif') { ST[a] = !ST[a]; speichern(); jetzt(); return; }
    if (a === 'reset') { ST = neuST(); try { localStorage.removeItem(SPEICHER); merkt = true; } catch (e6) { merkt = false; } jetzt(); return; }
    if (a === 'oelalt') { ST.preis.oel = V.annahmen.oel_alt.w; speichern(); jetzt(); var ob = wurzel.querySelector('[data-hv-z="preis.oel"]'); if (ob) ob.focus({ preventScroll: true }); return; }
    if (a === 'mappe') {
      alt = plan.heizanlage && plan.heizanlage.art;
      if (alt === w) return;
      if (alt && alt !== 'offen') { frage = { alt: alt, neu: w }; kartenNeu(); var ja = wurzel.querySelector('[data-hv=ersetzen]'); if (ja) ja.focus({ preventScroll: true }); return; }
      uebernehmen(w); return;
    }
    if (a === 'ersetzen') { uebernehmen(w); var nb = wurzel.querySelector('[data-hv=mappe][data-wert="' + w + '"]'); if (nb) nb.focus({ preventScroll: true }); return; }
    if (a === 'behalten') { alt = frage && frage.alt; var nn = frage && frage.neu; frage = null; nachricht = tr('hvMappeBehalten', { alt: tr('mpHz_' + alt) }); kartenNeu(); var bb = wurzel.querySelector('[data-hv=mappe][data-wert="' + nn + '"]'); if (bb) bb.focus({ preventScroll: true }); }
  }
  /* von außen: aus dem Grundstück (Baustein Wärmepumpe), aus der Mappe und aus dem Heizungs-Check; schließt zuerst die Mappe, wechselt dann in den Bereich Umbau */
  function oeffnen() {
    var zu = document.querySelector('#g-mappe-ov:not([hidden]) [data-overlay-zu]'); if (zu) zu.click();
    var tab = byId('tab-umbau'); if (tab) tab.click();
    if (det) det.open = true;
    jetzt();
    var k = byId('hv-karte'); if (k) k.scrollIntoView({ block: 'start', behavior: 'auto' });
    var s = byId('hv-summary'); if (s) s.focus({ preventScroll: true });
    return true;
  }
  if (wurzel) {
    wurzel.addEventListener('click', klick); wurzel.addEventListener('input', bei); wurzel.addEventListener('change', bei);
    wurzel.addEventListener('toggle', function (ev) { var d = ev.target.getAttribute && ev.target.getAttribute('data-hv-det'); if (d) offen[d] = ev.target.open; }, true);
  }
  if (det) det.addEventListener('toggle', function () { if (det.open) jetzt(); });
  var zur = byId('hv-zurueck'); if (zur) zur.addEventListener('click', oeffnen);
  window.addEventListener('sprachegewechselt', function () { if (det && det.open) jetzt(); });
  window.GRUNDRISS_HEIZUNG = { aktualisieren: aktualisieren, jetzt: jetzt, oeffnen: oeffnen, ergebnis: function () { return ctx; } };
})();
