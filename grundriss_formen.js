/* Oberfläche „Haus- und Dachform“ im Bereich „Grundriss und Einrichtung“ (Welle D, Teil 1):
   1. Kompaktheit des gezeichneten Hauses live (Hüllfläche ÷ Volumen, A/V) aus energie_kern.js, mit Balken, Vergleich zu den Hausformen aus daten/formen.js
      (Baunetzwissen, Bezug „beheiztes Volumen“) und zu einem Würfel gleichen Volumens;
   2. Vergleich der Dachformen je Kriterium (Balken, Ampel als eigene Einordnung, einfache Nachteile). Die Kuppel trägt „kaum belastbare Daten“.
   Texte: daten/texte_energie.js (de/en/ru). Ampeln sind eigene Einordnungen nach offen genannten Schwellen, keine Empfehlung (R078). */
(function () {
  'use strict';
  var K = window.ENERGIE_KERN, G = window.GRUNDRISS;
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { return window.TXT ? window.TXT.lang() : 'de'; }
  function nf(d) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function n0(x) { return nf(0).format(x); }
  function n1(x) { return nf(1).format(x); }
  function n2(x) { return nf(2).format(x); }
  function datumDe(iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); }
  function symbol(id) { return '<svg class="sym" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  var wurzel = document.getElementById('g-formen-inhalt'), kopfEl = document.getElementById('g-formen-kopfzeile'), details = document.getElementById('g-formen-details');
  if (!wurzel || !K || !G) return;
  var STATUS_KEY = { 'geprüft': ['statusGeprueft', 'st-gepr'], 'prüfen vor Nutzung': ['statusPruefen', 'st-pruef'], 'Lücke': ['statusLuecke', 'st-luecke'], 'eigene Einordnung': ['esStatusEigen', 'st-eigen'], 'Annahme': ['annahme', 'st-annahme'] };
  function badge(status) { var s = STATUS_KEY[status] || STATUS_KEY['prüfen vor Nutzung']; return '<span class="rg-status ' + s[1] + '" data-status="' + esc(status) + '">' + esc(tr(s[0])) + '</span>'; }
  function F() { return window.DATEN && window.DATEN.formen; }
  function eintrag(liste, id) { var d = F(); if (!d || !d[liste]) return null; for (var i = 0; i < d[liste].length; i++) if (d[liste][i].id === id) return d[liste][i]; return null; }
  function belegF(e, extraHinweis) {
    var d = F(), q = d && d.quellen && d.quellen[e.quelle];
    return { id: e.id, name: e.name, status: e.status, abruf: e.abruf, quelle: q ? q.titel : e.quelle, url: q ? q.url : '', hinweis: [e.hinweis, extraHinweis].filter(Boolean).join(' '), paragraf: '' };
  }
  function kurz(t) { var s = String(t || ''); var m = /^(.*?)(?:,| \(|:|; )/.exec(s); s = m ? m[1] : s; return s.length > 60 ? s.slice(0, 58) + '…' : s; }
  var hn = 0;
  function hilfe(inner) { var id = 'fm-h' + (++hn); return '<button type="button" class="hilfe-knopf es-hk" data-hilfe="' + id + '" aria-expanded="false" aria-controls="' + id + '" aria-label="' + esc(tr('regBelegKnopf')) + '">?</button><div class="es-hilfe" id="' + id + '" hidden>' + inner + '</div>'; }
  function belegBox(b) {
    return '<div class="rg-beleg" data-beleg="' + esc(b.id) + '"><p class="rg-beleg-kopf" lang="de"><b>' + esc(b.name) + '</b></p><p class="rg-beleg-meta">' + badge(b.status) + ' <span class="rg-abruf" data-abruf="' + esc(b.abruf) + '">' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) + '</span></p>' +
      (b.hinweis ? '<p class="klein" lang="de">' + esc(b.hinweis) + '</p>' : '') + '<p class="klein rg-quellen" lang="de">' + (b.url && /^https?:/.test(b.url) ? '<a class="rg-quelle" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + esc(tr('regQuelle')) + ': ' + esc(b.quelle) + '</a>' : esc(tr('regQuelle')) + ': ' + esc(b.quelle)) + '</p></div>';
  }
  function ampel(art) {
    var z = { gruen: ['✓', 'fmGruen'], gelb: ['!', 'fmGelb'], rot: ['✕', 'fmRot'], offen: ['?', 'fmOffen'] }[art] || ['?', 'fmOffen'];
    return '<span class="fm-ampel ' + art + '" data-ampel="' + art + '"><i aria-hidden="true">' + z[0] + '</i>' + esc(tr(z[1])) + '</span>';
  }
  var DACH_ID = { sattel: 'dach_satteldach', walm: 'dach_walmdach', pult: 'dach_pultdach', flach: 'dach_flachdach' };
  var KRITERIEN = ['kosten', 'lebensdauer', 'raum', 'pv', 'wartung', 'genehmigung'];
  var kriterium = 'kosten', gebaut = false, letzteKompakt = null;
  function punkteArt(r, sw) { return r >= sw.gruen_ab ? 'gruen' : (r >= sw.gelb_ab ? 'gelb' : 'rot'); }

  /* ---------- Teil 1: Kompaktheit ---------- */
  function kompaktHtml(k) {
    var d = F(), h = '';
    if (!k || k.fehler) {
      return '<div class="rg-leer es-leer" data-kompakt="leer">' + symbol('i-haus') + '<p>' + esc(tr(k && k.fehler === 'keineRaeume' ? 'fmKeineRaeume' : 'fmKeinPlan')) + '</p></div>';
    }
    var art = K.klasseAv(k.av), SK = 1.6;
    var baender = ['W04', 'W03', 'W02', 'W01'].map(function (id) { return eintrag('hausformen_av', id); }).filter(Boolean);
    h += '<div class="fm-gross" data-kompakt="ok"><div><span class="fm-zahl" data-av="' + k.av.toFixed(4) + '">' + n2(k.av) + '</span> <span class="klein">m²/m³</span></div><div>' + ampel(art) + ' <span class="annahme es-an">' + esc(tr('esStatusEigen')) + '</span></div></div>';
    h += '<div class="fm-skala" role="img" aria-label="' + esc(tr('fmSkalaAria', { av: n2(k.av) })) + '">' +
      baender.map(function (e) {
        return '<div class="fm-band"><span class="fm-band-name">' + esc(tr('fmHaus' + e.id)) + '</span><span class="fm-band-spur"><span class="fm-band-bereich" style="left:' + (100 * e.von / SK).toFixed(1) + '%;width:' + (100 * (e.bis - e.von) / SK).toFixed(1) + '%"></span></span><span class="fm-band-wert" data-band="' + e.id + '">' + n1(e.von) + ' – ' + n1(e.bis) + '</span></div>'; }).join('') +
      '<div class="fm-marke-zeile"><span class="fm-band-name">' + esc(tr('fmIhrHaus')) + '</span><span class="fm-band-spur"><span class="fm-ihr" style="left:' + (100 * Math.min(k.av, SK) / SK).toFixed(1) + '%"><i></i></span><span class="fm-wuerfel" style="left:' + (100 * Math.min(k.wuerfelAv, SK) / SK).toFixed(1) + '%"><i></i></span></span><span class="fm-band-wert">' + n2(k.av) + '</span></div>' +
      '<div class="fm-achse"><span>0</span><span>0,4</span><span>0,8</span><span>1,2</span><span>1,6</span></div></div>';
    h += '<p class="fm-legende"><span><i class="sw ihr"></i>' + esc(tr('fmLegIhr')) + '</span> <span><i class="sw wue"></i>' + esc(tr('fmLegWuerfel', { av: n2(k.wuerfelAv) })) + '</span> <span><i class="sw bd"></i>' + esc(tr('fmLegBaender')) + '</span></p>';
    h += '<p data-kompakt-satz="1">' + esc(tr('fmSatz', { huelle: n0(k.huelle), vol: n0(k.volumen), av: n2(k.av) })) + ' ' + esc(tr('fmWuerfelSatz', { av: n2(k.wuerfelAv), p: n0(Math.max(0, k.mehrAlsWuerfel) * 100) })) + '</p>';
    h += '<p class="klein">' + esc(tr('fmErkl')) + '</p>';
    if (k.naeherung) h += '<p class="es-warn" data-warn="naeherung">' + esc(tr('fmNaeherung')) + '</p>';
    var w01 = eintrag('hausformen_av', 'W01'), h02 = eintrag('haus_aussagen', 'H02');
    h += '<p class="klein fm-q" lang="de"><b>' + esc(tr('regQuelle')) + ':</b> ' + esc(kurz(d.quellen.baunetz_form.titel)) + ', ' + esc(tr('regAbruf', { datum: datumDe(w01.abruf) })) + ' ' + badge(w01.status) + ' · ' + esc(w01.bezug) + ' ' + hilfe(belegBox(belegF(w01)) + (h02 ? belegBox(belegF(h02)) : '')) + '</p>';
    h += '<p class="klein">' + esc(tr('fmSchwellen')) + ' <span class="annahme es-an">' + esc(tr('esStatusEigen')) + '</span></p>';
    h += '<ul class="annahmen fm-annahmen"><li><span><span class="annahme es-an">' + esc(tr('annahme')) + '</span> ' + esc(tr('fmAnKeller')) + '</span></li><li><span><span class="annahme es-an">' + esc(tr('annahme')) + '</span> ' + esc(tr('fmAnDach')) + '</span></li><li><span><span class="annahme es-an">' + esc(tr('annahme')) + '</span> ' + esc(tr('fmAnMass')) + '</span></li></ul>';
    return h;
  }

  /* ---------- Teil 2: Dachformen ---------- */
  function werteVon(e, krit, sw) {
    /* Rückgabe {art, text, balken: {von, bis, max} | {punkte}} oder {art:'offen'} */
    var mid;
    if (krit === 'kosten') { if (e.von == null) return { art: 'offen' }; mid = (e.von + e.bis) / 2; return { art: mid <= sw.kosten.gruen_bis ? 'gruen' : (mid <= sw.kosten.gelb_bis ? 'gelb' : 'rot'), text: n0(e.von) + ' – ' + n0(e.bis) + ' €/m²', bereich: [e.von, e.bis, 220] }; }
    if (krit === 'lebensdauer') { if (e.lebensdauer_von == null) return { art: 'offen' }; mid = (e.lebensdauer_von + e.lebensdauer_bis) / 2; return { art: mid >= sw.lebensdauer.gruen_ab ? 'gruen' : (mid >= sw.lebensdauer.gelb_ab ? 'gelb' : 'rot'), text: n0(e.lebensdauer_von) + ' – ' + n0(e.lebensdauer_bis) + ' ' + tr('fmJahre'), bereich: [e.lebensdauer_von, e.lebensdauer_bis, 110] }; }
    var r = krit === 'raum' ? e.raum_rang : (krit === 'pv' ? e.rang_pv : (krit === 'wartung' ? e.rang_wartung : e.rang_genehmigung));
    if (r == null) return { art: 'offen' };
    return { art: punkteArt(r, sw.punkte), text: tr('fmPunkte', { n: r }), punkte: r };
  }
  function dachHtml() {
    var d = F(), sw = d.dach_schwellen, liste = d.dachformen.filter(function (e) { return /^dach_/.test(e.id) && e.id !== 'dach_kuppel_forum'; }), h = '';
    var plan = G.plan(), meins = plan && plan.dach ? DACH_ID[plan.dach.form] : null;
    h += '<div class="es-chips fm-krit" role="group" aria-label="' + esc(tr('fmKritAria')) + '">' + KRITERIEN.map(function (k) {
      return '<button type="button" class="chip" data-krit="' + k + '" aria-pressed="' + (k === kriterium ? 'true' : 'false') + '">' + esc(tr('fmK_' + k)) + '</button>'; }).join('') + '</div>';
    h += '<p class="klein fm-kritfrage" data-b="kritfrage">' + esc(tr('fmKF_' + kriterium)) + '</p>';
    h += '<ul class="fm-liste">' + liste.map(function (e) {
      var w = werteVon(e, kriterium, sw), balk = '';
      if (w.bereich) balk = '<span class="fm-bereich" aria-hidden="true"><span class="fm-bereich-b ' + w.art + '" style="left:' + (100 * w.bereich[0] / w.bereich[2]).toFixed(1) + '%;width:' + Math.max(2, 100 * (w.bereich[1] - w.bereich[0]) / w.bereich[2]).toFixed(1) + '%"></span></span>';
      else if (w.punkte) balk = '<span class="fm-bereich" aria-hidden="true"><span class="fm-bereich-b ' + w.art + '" style="left:0;width:' + (20 * w.punkte) + '%"></span></span>';
      else balk = '<span class="fm-bereich leer" aria-hidden="true"></span>';
      var duenn = e.id === 'dach_kuppel';
      return '<li class="fm-form" data-form="' + e.id + '"' + (meins === e.id ? ' data-meins="1"' : '') + '><div class="fm-kopf"><b lang="de">' + esc(e.name) + '</b>' + (meins === e.id ? ' <span class="fm-meins">' + esc(tr('fmIhrDach')) + '</span>' : '') +
        (duenn ? ' <span class="fm-duenn" data-duenn="1">' + esc(tr('fmDuenn')) + '</span>' : '') + '</div>' +
        '<div class="fm-wertzeile">' + balk + '<span class="fm-wert" data-wert-text="1">' + (w.art === 'offen' ? esc(tr('fmKeineAngabe')) : esc(w.text)) + '</span>' + ampel(w.art) + '</div>' +
        '<p class="fm-nachteil klein" lang="de"><b>' + esc(tr('fmNachteil')) + ':</b> ' + esc(e.nachteil || tr('fmKeineAngabe')) + '</p>' +
        '<p class="klein fm-q" lang="de">' + badge(e.status) + ' <span class="annahme es-an">' + esc(tr('esStatusEigen')) + '</span> ' + esc(kurz(d.quellen[e.quelle].titel)) + ', ' + esc(tr('regAbruf', { datum: datumDe(e.abruf) })) + ' ' + hilfe(belegBox(belegF(e, e.wartung && kriterium === 'wartung' ? e.wartung : (kriterium === 'pv' && e.pv ? e.pv : (kriterium === 'genehmigung' && e.genehmigung ? e.genehmigung : (kriterium === 'raum' && e.raum ? e.raum : ''))))) ) + '</p></li>';
    }).join('') + '</ul>';
    var s = d.dach_schwellen;
    h += '<p class="klein">' + esc(tr('fmDachSchwellen', { kg: s.kosten.gruen_bis, kgl: s.kosten.gelb_bis, lg: s.lebensdauer.gruen_ab, lgl: s.lebensdauer.gelb_ab })) + ' <span class="annahme es-an">' + esc(tr('esStatusEigen')) + '</span></p>';
    h += '<p class="klein">' + esc(tr('fmDachWerblich')) + '</p><p class="klein">' + esc(tr('fmKeineBauempfehlung')) + '</p>';
    return h;
  }

  function bauen() {
    wurzel.innerHTML = '<div class="fm" data-b="fm"><section class="es-schritt"><h4 class="es-h">' + symbol('i-haus') + '<span>' + esc(tr('fmTitelKompakt')) + '</span></h4><div data-b="kompakt" aria-live="polite"></div></section>' +
      '<section class="es-schritt"><h4 class="es-h">' + symbol('i-dach') + '<span>' + esc(tr('fmTitelDach')) + '</span></h4><div data-b="dach"></div></section></div>';
    gebaut = true;
    wurzel.addEventListener('click', function (ev) {
      var h = ev.target.closest('[data-hilfe]');
      if (h) { var box = document.getElementById(h.getAttribute('data-hilfe')), auf = h.getAttribute('aria-expanded') === 'true'; h.setAttribute('aria-expanded', auf ? 'false' : 'true'); if (box) box.hidden = auf; return; }
      var c = ev.target.closest('[data-krit]');
      if (c) { kriterium = c.getAttribute('data-krit'); zeichne(); var ch = wurzel.querySelector('[data-krit="' + kriterium + '"]'); if (ch) ch.focus(); }
    });
    zeichne();
  }
  function zeichne() {
    if (!F()) { var f = document.getElementById('g-formen-fehler'); if (f) { f.textContent = tr('fmKeineDaten'); f.hidden = false; } return; }
    var k = letzteKompakt = K.kompaktheit(G.plan());
    wurzel.querySelector('[data-b="kompakt"]').innerHTML = kompaktHtml(k);
    wurzel.querySelector('[data-b="dach"]').innerHTML = dachHtml();
  }
  function kopfZeile() {
    var k = letzteKompakt = K.kompaktheit(G.plan());
    if (kopfEl) kopfEl.textContent = k && !k.fehler ? tr('fmKopf', { av: n2(k.av), wort: tr({ gruen: 'fmGruen', gelb: 'fmGelb', rot: 'fmRot' }[K.klasseAv(k.av)]) }) : tr('fmKopfLeer');
  }
  var timer = null;
  function jetzt() { clearTimeout(timer); kopfZeile(); if (gebaut) zeichne(); }
  function aktualisieren() { clearTimeout(timer); timer = setTimeout(jetzt, 150); }
  if (details) { details.addEventListener('toggle', function () { if (details.open && !gebaut) bauen(); }); if (details.open) bauen(); }
  window.addEventListener('sprachegewechselt', function () { if (gebaut) { gebaut = false; wurzel.innerHTML = ''; bauen(); } kopfZeile(); });
  window.GRUNDRISS_FORMEN = { aktualisieren: aktualisieren, jetzt: jetzt, kompaktheit: function () { return letzteKompakt; }, kriterium: function (k) { if (k) { kriterium = k; if (gebaut) zeichne(); } return kriterium; } };
  jetzt();
})();
