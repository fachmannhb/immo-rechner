/* Bereich „Wo ist Wohnen gefragt?“: Deutschlandkarte (Länder, Landkreise), Ebenen mit Ampel, Sterne,
   Steckbrief, Tabelle, Streudiagramm; dazu KARTE.gebietFuer(objekt) für die Merkliste.
   Daten: daten/karte_geo.js (BKG), karte_werte.js (INKAR, Zensus, Portal), karte_werke.js, karte_orte.js (Destatis).
   Rechnen mit RECHNER.rang/gesamtwert/ampelVon. Ampel = eigene Einordnung nach offenen Regeln, keine Empfehlung. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var D = window.DATEN || {}, R = window.RECHNER;
  var GEO = D.karte, W = D.kartewerte, WERKE = (D.kartewerke && D.kartewerke.werke) || [], ORTE = D.orte || [];
  if (!GEO || !W || !R) return;
  var NS = 'http://www.w3.org/2000/svg';
  var fmt0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmt2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var SCHLUESSEL = 'immo-karte';

  /* ---------- Grundlagen ---------- */
  var LAENDER = {};
  GEO.laender.forEach(function (l) { LAENDER[l.ags] = l.name; });
  var KREISE = GEO.kreise.map(function (k) {
    return { ags: k.ags, name: k.name, art: k.art, land: LAENDER[k.ags.slice(0, 2)] || '', pfad: k.pfad, cx: k.cx, cy: k.cy, w: W.kreise[k.ags] || {} };
  });
  var NACH_AGS = {};
  KREISE.forEach(function (k, i) { NACH_AGS[k.ags] = i; });
  function anzeigeName(k) { return k.name + (/^Landkreis|^Kreis|^Region|^Städteregion/.test(k.art) && k.name.indexOf(k.art) < 0 ? ' (' + k.art + ')' : ''); }

  /* Kennzahlen je Ebene: [Feld, hoch ist gut?] – Rang 0–100 über alle Kreise */
  var EBENEN = [
    { id: 'gesamt', name: 'Gesamt', text: 'Mischung aller Ebenen mit Ihren Gewichten.' },
    { id: 'nachfrage', name: 'Nachfrage', teile: [['e5', true], ['p45', true], ['leer', false]], text: 'Wächst die Bevölkerung (letzte 5 Jahre und Prognose bis 2045), und stehen wenige Wohnungen leer?' },
    { id: 'arbeit', name: 'Arbeit', teile: [['besch', true], ['saldo', true]], text: 'Viele Arbeitsplätze und mehr Menschen, die zur Arbeit herkommen als wegfahren.' },
    { id: 'studium', name: 'Studium', teile: [['studq', true]], text: 'Viele Studierende im Verhältnis zur Einwohnerzahl.' },
    { id: 'miete', name: 'Miete', teile: [['miete', true]], text: 'Höhe der durchschnittlichen Nettokaltmiete (Zensus 2022).' },
    { id: 'einstieg', name: 'Einstieg', teile: [['bau', false]], text: 'Günstiges Bauland, also niedrigere Einstiegspreise.' },
    { id: 'mieteboden', name: 'Miete/Boden', teile: [['mb', true]], text: 'Miete im Verhältnis zum Baulandpreis. Grober Anzeiger, keine echte Rendite.' }
  ];
  var EBENE = {};
  EBENEN.forEach(function (e) { EBENE[e.id] = e; });
  KREISE.forEach(function (k) { if (k.w.miete != null && k.w.bau > 0) k.w.mb = k.w.miete * 12 / k.w.bau; });
  var raenge = {}; /* Feld -> Rang je Kreis */
  ['e5', 'p45', 'leer', 'besch', 'saldo', 'studq', 'miete', 'bau', 'mb'].forEach(function (f) {
    var gut = { leer: false, bau: false }[f] === false ? false : true;
    raenge[f] = R.rang(KREISE.map(function (k) { return k.w[f] != null ? k.w[f] : null; }), gut);
  });
  function ebeneWert(e, i) {
    var t = EBENE[e].teile, s = 0, n = 0;
    t.forEach(function (p) { var r = raenge[p[0]][i]; if (r != null) { s += r; n++; } });
    return n ? s / n : null;
  }

  /* ---------- Einstellungen (im Browser gemerkt) ---------- */
  var STANDARD = { ebene: 'gesamt', gewichte: { nachfrage: 3, arbeit: 2, studium: 1, miete: 1, einstieg: 0, mieteboden: 1 }, gruen: 66, gelb: 33, sterne: { werk: true, hochschule: true, pendler: true, haeuser: true, portal: true } };
  var E = (function () {
    try {
      var g = JSON.parse(localStorage.getItem(SCHLUESSEL) || 'null');
      if (g && typeof g === 'object') {
        var e = JSON.parse(JSON.stringify(STANDARD));
        if (EBENE[g.ebene]) e.ebene = g.ebene;
        Object.keys(e.gewichte).forEach(function (k) { var v = Number(g.gewichte && g.gewichte[k]); if (isFinite(v) && v >= 0 && v <= 5) e.gewichte[k] = v; });
        ['gruen', 'gelb'].forEach(function (k) { var v = Number(g[k]); if (isFinite(v) && v >= 0 && v <= 100) e[k] = v; });
        Object.keys(e.sterne).forEach(function (k) { if (g.sterne && typeof g.sterne[k] === 'boolean') e.sterne[k] = g.sterne[k]; });
        return e;
      }
    } catch (x) { /* Speicher gesperrt: Standard */ }
    return JSON.parse(JSON.stringify(STANDARD));
  })();
  function merken() { try { localStorage.setItem(SCHLUESSEL, JSON.stringify(E)); } catch (x) { /* ohne Speicher weiter */ } }

  /* ---------- Werte je Kreis und Land ---------- */
  /* Mittelwerte aus mehreren Rängen ballen sich um 50; darum wird jede Ebene und der Gesamtwert am Ende
     noch einmal als Rang über alle Kreise ausgedrückt (100 = bester Kreis). So teilen die Schwellen sauber. */
  var wert = [], ampel = [], LANDWERT = {};
  function rechnen() {
    var roh = {};
    EBENEN.forEach(function (e) { if (e.id !== 'gesamt') roh[e.id] = R.rang(KREISE.map(function (k, i) { return ebeneWert(e.id, i); }), true); });
    KREISE.forEach(function (k, i) {
      k.eb = {};
      Object.keys(roh).forEach(function (id) { k.eb[id] = roh[id][i]; });
    });
    var ges = R.rang(KREISE.map(function (k) { return R.gesamtwert(k.eb, E.gewichte); }), true);
    KREISE.forEach(function (k, i) {
      k.eb.gesamt = ges[i];
      wert[i] = k.eb[E.ebene];
      ampel[i] = R.ampelVon(wert[i], E.gruen, E.gelb);
    });
    /* Länder: nach Einwohnern gewichtetes Mittel der Kreise, dann Rang unter den 16 Ländern */
    var codes = Object.keys(LAENDER), mittel = codes.map(function (c) {
      var s = 0, g = 0;
      KREISE.forEach(function (k) { if (k.ags.slice(0, 2) === c && k.eb[E.ebene] != null) { var ew = k.w.ew || 1; s += k.eb[E.ebene] * ew; g += ew; } });
      return g ? s / g : null;
    });
    var lr = R.rang(mittel, true);
    codes.forEach(function (c, j) { LANDWERT[c] = lr[j]; });
  }
  function landWert(lags) { return LANDWERT[lags]; }

  /* ---------- Sterne ---------- */
  var GRENZE_STUD = 20000, GRENZE_EIN = 100000;
  function sterneVon(k) {
    var s = [];
    WERKE.filter(function (w) { return w.ags === k.ags; }).forEach(function (w) {
      s.push({ art: 'werk', text: w.firma + ' ' + w.werk + (w.besch ? ', ' + w.besch + ' Beschäftigte' : '') + (w.quelle ? ' (' + w.quelle + ')' : ''), url: w.url });
    });
    if (k.w.stud >= GRENZE_STUD) s.push({ art: 'hochschule', text: 'Hochschulort: ' + fmt0.format(k.w.stud) + ' Studierende (' + (W.felder.stud.jahr || '') + ')' });
    if (k.w.ein >= GRENZE_EIN) s.push({ art: 'pendler', text: 'Pendlerzentrum: ' + fmt0.format(k.w.ein) + ' Einpendler (' + (W.felder.ein.jahr || '') + ')' });
    return s;
  }
  var STERNNAME = { werk: 'Großes Werk', hochschule: 'Hochschulort', pendler: 'Pendlerzentrum' };

  /* ---------- Merkliste: Ort -> Kreis ---------- */
  var ORT_INDEX = {};
  ORTE.forEach(function (o) { var n = o[0].toLowerCase(); (ORT_INDEX[n] = ORT_INDEX[n] || []).push(o); });
  var LAND_CODE = {};
  Object.keys(LAENDER).forEach(function (c) { LAND_CODE[LAENDER[c].toLowerCase()] = c; });
  function kreisVonOrt(ortText, landName) {
    var t = String(ortText || '').trim();
    if (!t) return null;
    var plz = (/\b(\d{5})\b/.exec(t) || [])[1];
    var name = t.replace(/\b\d{5}\b/, '').trim();
    var lc = landName ? LAND_CODE[String(landName).toLowerCase()] : null;
    var versuche = [name, name.split(/\s*[-–,(\/]\s*/)[0]];
    for (var v = 0; v < versuche.length; v++) {
      var n = versuche[v].toLowerCase().trim();
      if (!n) continue;
      var kand = ORT_INDEX[n] || [];
      if (!kand.length) {
        /* „Frankfurt“ -> „Frankfurt am Main“: Gemeinden, die so beginnen */
        Object.keys(ORT_INDEX).forEach(function (k) { if (k.indexOf(n + ' ') === 0) kand = kand.concat(ORT_INDEX[k]); });
      }
      if (lc) { var imLand = kand.filter(function (o) { return o[1].slice(0, 2) === lc; }); if (imLand.length) kand = imLand; }
      if (plz) { var mitPlz = kand.filter(function (o) { return o[2] === plz; }); if (mitPlz.length) kand = mitPlz; }
      if (kand.length) {
        kand = kand.slice().sort(function (a, b) { return b[3] - a[3]; });
        var kreise = {};
        kand.forEach(function (o) { kreise[o[1]] = true; });
        return { ags: kand[0][1], sicher: Object.keys(kreise).length === 1, gemeinde: kand[0][0] };
      }
    }
    return null;
  }

  /* ---------- Karte zeichnen ---------- */
  var svg = $('k-karte');
  var vb = null, gewaehlt = null, ziehen = null, sichtbar = false;
  var BOX = GEO.box;
  function el(name, attr, eltern) {
    var e = document.createElementNS(NS, name);
    Object.keys(attr || {}).forEach(function (k) { e.setAttribute(k, attr[k]); });
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function einpassen() {
    var w = BOX[2] - BOX[0] + 20, h = BOX[3] - BOX[1] + 20, bw = svg.clientWidth || 600, bh = svg.clientHeight || 700;
    if (w / h < bw / bh) w = h * bw / bh; else h = w * bh / bw;
    vb = { x: (BOX[0] + BOX[2]) / 2 - w / 2, y: (BOX[1] + BOX[3]) / 2 - h / 2, w: w, h: h };
  }
  function zoomen(f, cx, cy) {
    if (!vb) einpassen();
    var nw = Math.min(1400, Math.max(40, vb.w * f)), k = nw / vb.w;
    if (cx == null) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
    vb = { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w: nw, h: vb.h * k };
    zeichnen();
  }
  function px() { return vb.w / (svg.clientWidth || 600); }
  var LAENDER_AB = 520; /* breiter als 520 km sichtbar: Länder eingefärbt, sonst Landkreise */
  function sternPfad(x, y, r) {
    var p = '';
    for (var i = 0; i < 10; i++) {
      var a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      p += (i ? 'L' : 'M') + (x + rr * Math.cos(a)).toFixed(2) + ' ' + (y + rr * Math.sin(a)).toFixed(2);
    }
    return p + 'Z';
  }
  function zeichnen() {
    if (!sichtbar || !svg.clientWidth) return;
    if (!vb) einpassen();
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var s = px(), laenderModus = vb.w > LAENDER_AB;
    var gK = el('g', {}, svg);
    KREISE.forEach(function (k, i) {
      var a = laenderModus ? R.ampelVon(landWert(k.ags.slice(0, 2)), E.gruen, E.gelb) : ampel[i];
      var p = el('path', { d: k.pfad, class: 'k-flaeche ' + (a || 'leer') + (laenderModus ? ' grob' : '') + (gewaehlt === k.ags ? ' gewaehlt' : ''), 'data-ags': k.ags }, gK);
      el('title', {}, p).textContent = laenderModus ? k.land + ': ' + (landWert(k.ags.slice(0, 2)) != null ? fmt0.format(landWert(k.ags.slice(0, 2))) : '-') + ' von 100'
        : anzeigeName(k) + ': ' + (wert[i] != null ? fmt0.format(wert[i]) : '-') + ' von 100';
    });
    /* feine Kreisgrenzen über den Flächen (die Flächen haben einen Rand in eigener Farbe gegen Haarlücken) */
    if (!laenderModus) {
      var gG = el('g', { 'pointer-events': 'none' }, svg);
      KREISE.forEach(function (k) { el('path', { d: k.pfad, class: 'k-grenze' }, gG); });
    }
    var gL = el('g', { 'pointer-events': 'none' }, svg);
    GEO.laender.forEach(function (l) { el('path', { d: l.pfad, class: 'k-land' }, gL); });
    if (gewaehlt != null && NACH_AGS[gewaehlt] != null) el('path', { d: KREISE[NACH_AGS[gewaehlt]].pfad, class: 'k-auswahl' }, svg);
    if (laenderModus) {
      GEO.laender.forEach(function (l) {
        var ks = KREISE.filter(function (k) { return k.ags.slice(0, 2) === l.ags; });
        var cx = 0, cy = 0, n = 0;
        ks.forEach(function (k) { var ew = k.w.ew || 1; cx += k.cx * ew; cy += k.cy * ew; n += ew; });
        if (!n || l.ags === '04' || l.ags === '02' || l.ags === '11') return; /* Stadtstaaten zu klein für Beschriftung */
        var t = el('text', { x: cx / n, y: cy / n, class: 'k-name', 'font-size': 12 * s, 'stroke-width': 3 * s }, svg);
        t.textContent = l.name;
      });
    }
    /* Sterne und Häuser */
    var gS = el('g', {}, svg);
    KREISE.forEach(function (k) {
      var st = sterneVon(k).filter(function (x) { return E.sterne[x.art]; });
      var arten = [];
      st.forEach(function (x) { if (arten.indexOf(x.art) < 0) arten.push(x.art); });
      arten.forEach(function (art, j) {
        var x = k.cx + (j - (arten.length - 1) / 2) * 13 * s, y = k.cy;
        var p = el('path', { d: sternPfad(x, y, 7 * s), class: 'k-stern ' + art, 'data-ags': k.ags }, gS);
        var titel = el('title', {}, p);
        titel.textContent = anzeigeName(k) + ': ' + st.filter(function (q) { return q.art === art; }).map(function (q) { return q.text; }).join('; ');
      });
    });
    if (E.sterne.portal) {
      (W.portal || []).forEach(function (pt) {
        var k = KREISE[NACH_AGS[pt.ags]]; if (!k) return;
        var r = el('rect', { x: k.cx - 4 * s, y: k.cy + 9 * s, width: 8 * s, height: 8 * s, class: 'k-portal', transform: 'rotate(45 ' + k.cx + ' ' + (k.cy + 13 * s) + ')', 'data-ags': k.ags }, gS);
        el('title', {}, r).textContent = pt.stadt + ': Wohnung ' + fmt0.format(pt.wohnung) + ' €/m² (Portalwert McMakler, Q1 2026)';
      });
    }
    if (E.sterne.haeuser && window.KARTE_HAEUSER) {
      window.KARTE_HAEUSER().forEach(function (h, j) {
        var k = KREISE[NACH_AGS[h.ags]]; if (!k) return;
        var c = el('circle', { cx: k.cx + 10 * s + (j % 3) * 3 * s, cy: k.cy - 10 * s, r: 5 * s, class: 'k-haus ' + (h.art || 'leer'), 'data-ags': k.ags }, gS);
        el('title', {}, c).textContent = 'Ihr Haus: ' + h.titel;
      });
    }
    svg.setAttribute('class', laenderModus ? 'grob' : '');
    $('k-zoom-hinweis').textContent = laenderModus ? 'Bundesländer im Vergleich untereinander (Mittel ihrer Kreise, nach Einwohnern gewichtet). Hineinzoomen oder ein Land anklicken zeigt die Landkreise.' : 'Landkreise und kreisfreie Städte. Herauszoomen zeigt die Bundesländer.';
  }

  /* ---------- Bedienung der Karte ---------- */
  function imPlan(ev) {
    var m = svg.getScreenCTM(); if (!m) return [0, 0];
    var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; p = p.matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  svg.addEventListener('pointerdown', function (ev) {
    if (ev.button > 0) return;
    ziehen = { cx: ev.clientX, cy: ev.clientY, vb: { x: vb.x, y: vb.y, w: vb.w, h: vb.h }, bewegt: false, ziel: ev.target.closest('[data-ags]') };
    try { svg.setPointerCapture(ev.pointerId); } catch (x) { /* egal */ }
  });
  svg.addEventListener('pointermove', function (ev) {
    if (!ziehen) return;
    var dx = ev.clientX - ziehen.cx, dy = ev.clientY - ziehen.cy;
    if (Math.abs(dx) + Math.abs(dy) > 4) ziehen.bewegt = true;
    if (!ziehen.bewegt) return;
    var k = ziehen.vb.w / (svg.clientWidth || 600);
    vb.x = ziehen.vb.x - dx * k; vb.y = ziehen.vb.y - dy * k;
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
  });
  function los() {
    if (!ziehen) return;
    var z = ziehen; ziehen = null;
    if (!z.bewegt && z.ziel) waehle(z.ziel.getAttribute('data-ags'), vb.w > LAENDER_AB);
    else if (z.bewegt) zeichnen();
  }
  svg.addEventListener('pointerup', los);
  svg.addEventListener('pointercancel', function () { ziehen = null; });
  svg.addEventListener('wheel', function (ev) {
    if (!ev.ctrlKey) return;
    ev.preventDefault();
    var p = imPlan(ev); zoomen(ev.deltaY > 0 ? 1.2 : 1 / 1.2, p[0], p[1]);
  }, { passive: false });
  $('k-zoom-ein').addEventListener('click', function () { zoomen(1 / 1.5); });
  $('k-zoom-aus').addEventListener('click', function () { zoomen(1.5); });
  $('k-zoom-passt').addEventListener('click', function () { einpassen(); zeichnen(); });

  /* Kreis wählen; mitZoom: auf den Kreis heranfahren (z. B. Klick im Ländermodus, Tabelle, Suche) */
  function waehle(ags, mitZoom) {
    if (NACH_AGS[ags] == null) return;
    gewaehlt = ags;
    var k = KREISE[NACH_AGS[ags]];
    if (mitZoom) {
      var b = 130, bw = svg.clientWidth || 600, bh = svg.clientHeight || 700;
      vb = { x: k.cx - b / 2, y: k.cy - b * bh / bw / 2, w: b, h: b * bh / bw };
    }
    zeichnen(); steckbrief(); tabelleMarkieren();
  }

  /* ---------- Steckbrief ---------- */
  function balken(v) {
    if (v == null) return '<span class="klein">keine Daten</span>';
    var a = R.ampelVon(v, E.gruen, E.gelb);
    return '<span class="k-balken"><span class="' + a + '" style="width:' + Math.max(3, v).toFixed(0) + '%"></span></span> <b>' + fmt0.format(v) + '</b>';
  }
  function zahlText(f, v) {
    var m = W.felder[f]; if (v == null || !m) return '-';
    var t = (m.einheit === '%' || f === 'saldo' || f === 'studq') ? fmt1.format(v) : (m.einheit === '€/m²' && f === 'miete' ? fmt2.format(v) : fmt0.format(v));
    return t + (m.einheit ? ' ' + m.einheit : '');
  }
  function steckbrief() {
    var box = $('k-steckbrief');
    if (gewaehlt == null) { box.innerHTML = '<p>Klicken Sie auf ein Gebiet, um seine Zahlen zu sehen. Oder suchen Sie oben nach einem Ort.</p>'; return; }
    var i = NACH_AGS[gewaehlt], k = KREISE[i], st = sterneVon(k);
    var a = ampel[i], h = '<h4>' + esc(anzeigeName(k)) + '</h4><p class="klein" style="margin-top:-4px">' + esc(k.land) + '</p>';
    h += '<p class="k-ampel-satz ' + (a || 'leer') + '">' + (a ? { gut: 'Gefragtes Gebiet', warn: 'Mittleres Gebiet', schlecht: 'Schwächeres Gebiet' }[a] : 'Keine Daten') +
      ' nach Ihren Regeln (Ebene ' + esc(EBENE[E.ebene].name) + ': ' + (wert[i] != null ? fmt0.format(wert[i]) : '-') + ' von 100)</p>';
    h += st.length ? '<ul class="k-sterne">' + st.map(function (x) { return '<li><span class="k-st ' + x.art + '" aria-hidden="true">★</span> ' + esc(x.text) + (x.url ? ' <a href="' + esc(x.url) + '" target="_blank" rel="noopener">Quelle</a>' : '') + '</li>'; }).join('') + '</ul>' : '';
    h += '<table class="k-eb"><tbody>' + EBENEN.map(function (e) { return '<tr><th scope="row">' + esc(e.name) + '</th><td>' + balken(k.eb[e.id]) + '</td></tr>'; }).join('') + '</tbody></table>';
    var felder = ['ew', 'e5', 'p45', 'leer', 'miete', 'bau', 'besch', 'ein', 'aus', 'stud'];
    h += '<dl class="k-zahlen">' + felder.map(function (f) { return '<dt>' + esc(W.felder[f].name) + ' <span class="klein">(' + esc(W.felder[f].jahr) + ')</span></dt><dd>' + zahlText(f, k.w[f]) + '</dd>'; }).join('') + '</dl>';
    var pt = (W.portal || []).filter(function (p) { return p.ags === k.ags; })[0];
    if (pt) {
      var rend = k.w.miete ? k.w.miete * 12 / pt.wohnung * 100 : null;
      h += '<p class="klein"><b>' + esc(pt.stadt) + ', Portalwert:</b> Wohnung ' + fmt0.format(pt.wohnung) + ' €/m², Haus ' + fmt0.format(pt.haus) + ' €/m² (McMakler, 1. Quartal 2026).' +
        (rend ? ' Grobe Bruttorendite mit Zensus-Miete: ' + fmt1.format(rend) + ' %. Achtung: Bestandsmiete 2022 gegen Angebotspreis 2026, darum eher zu niedrig.' : '') + '</p>';
    }
    var haeuser = window.KARTE_HAEUSER ? window.KARTE_HAEUSER().filter(function (x) { return x.ags === k.ags; }) : [];
    if (haeuser.length) h += '<p class="klein"><b>Ihre Häuser hier:</b> ' + haeuser.map(function (x) { return esc(x.titel) + (x.brutto != null ? ' (' + fmt1.format(x.brutto) + ' % brutto)' : ''); }).join(', ') + '</p>';
    h += '<div class="knopfreihe"><button type="button" class="knopf" id="k-suchen">Haus hier suchen</button></div>';
    box.innerHTML = h;
    $('k-suchen').addEventListener('click', function () {
      var o = $('s-ort'); if (!o) return;
      o.value = k.name.replace(/,.*$/, '');
      o.dispatchEvent(new Event('input', { bubbles: true })); o.dispatchEvent(new Event('change', { bubbles: true }));
      var t = $('tab-suche'); if (t) t.click();
    });
  }

  /* ---------- Ebenen, Gewichte, Schwellen ---------- */
  function ebenenKnoepfe() {
    var box = $('k-ebenen'); box.innerHTML = '';
    EBENEN.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = e.name; b.title = e.text;
      b.setAttribute('aria-pressed', E.ebene === e.id ? 'true' : 'false');
      b.addEventListener('click', function () { E.ebene = e.id; merken(); allesNeu(); ebenenKnoepfe(); });
      box.appendChild(b);
    });
    $('k-ebene-text').textContent = EBENE[E.ebene].text;
  }
  function regler() {
    var box = $('k-gewichte');
    box.innerHTML = EBENEN.filter(function (e) { return e.id !== 'gesamt'; }).map(function (e) {
      return '<div><label for="k-g-' + e.id + '">' + esc(e.name) + ': <output id="k-g-' + e.id + '-w">' + E.gewichte[e.id] + '</output></label>' +
        '<input type="range" id="k-g-' + e.id + '" min="0" max="5" step="1" value="' + E.gewichte[e.id] + '"></div>';
    }).join('');
    EBENEN.forEach(function (e) {
      var r = $('k-g-' + e.id); if (!r) return;
      r.addEventListener('input', function () { E.gewichte[e.id] = Number(r.value); $('k-g-' + e.id + '-w').textContent = r.value; merken(); allesNeu(); });
    });
    ['gruen', 'gelb'].forEach(function (k) {
      var r = $('k-' + k);
      r.value = E[k]; $('k-' + k + '-w').textContent = E[k];
      r.addEventListener('input', function () {
        var v = Number(r.value);
        if (k === 'gruen' && v <= E.gelb) v = E.gelb + 1;
        if (k === 'gelb' && v >= E.gruen) v = E.gruen - 1;
        E[k] = v; r.value = v; $('k-' + k + '-w').textContent = v; merken(); allesNeu();
      });
    });
    Object.keys(E.sterne).forEach(function (k) {
      var c = $('k-s-' + k); if (!c) return;
      c.checked = E.sterne[k];
      c.addEventListener('change', function () { E.sterne[k] = c.checked; merken(); zeichnen(); });
    });
  }

  /* ---------- Suche nach Ort oder Kreis ---------- */
  $('k-suche').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); suchen(); } });
  $('k-suche-los').addEventListener('click', suchen);
  function suchen() {
    var t = $('k-suche').value.trim(), m = $('k-suche-meldung');
    if (!t) { m.textContent = 'Bitte einen Ort, Landkreis oder eine Postleitzahl eingeben.'; return; }
    var kreis = KREISE.filter(function (k) { return k.name.toLowerCase() === t.toLowerCase(); })[0];
    var tr = kreis ? { ags: kreis.ags, sicher: true } : kreisVonOrt(t);
    if (!tr) {
      kreis = KREISE.filter(function (k) { return k.name.toLowerCase().indexOf(t.toLowerCase()) >= 0; })[0];
      tr = kreis ? { ags: kreis.ags, sicher: false } : null;
    }
    if (!tr) { m.textContent = 'Nicht gefunden: „' + t + '“. Bitte den Namen einer Gemeinde oder eines Landkreises eingeben.'; return; }
    var k = KREISE[NACH_AGS[tr.ags]];
    m.textContent = (tr.gemeinde && tr.gemeinde.toLowerCase() !== k.name.toLowerCase() ? tr.gemeinde + ' liegt in ' : 'Gefunden: ') + anzeigeName(k) + (tr.sicher ? '.' : ' (mehrere Orte heißen so; der größte ist gewählt).');
    waehle(tr.ags, true);
  }

  /* ---------- Tabelle ---------- */
  var sortFeld = 'wert', sortAuf = false;
  var SPALTEN = [['name', 'Gebiet'], ['land', 'Land'], ['wert', 'Wert'], ['p45', 'Prognose 2045'], ['leer', 'Leerstand'], ['miete', 'Miete €/m²'], ['stud', 'Studierende'], ['ein', 'Einpendler'], ['sterne', 'Sterne']];
  function tabelle() {
    var such = $('k-filter').value.trim().toLowerCase(), land = $('k-land').value, amp = $('k-amp').value;
    var reihen = KREISE.map(function (k, i) { return { k: k, i: i, st: sterneVon(k) }; }).filter(function (r) {
      return (!such || r.k.name.toLowerCase().indexOf(such) >= 0) && (!land || r.k.ags.slice(0, 2) === land) && (!amp || ampel[r.i] === amp);
    });
    function v(r) {
      if (sortFeld === 'name' || sortFeld === 'land') return r.k[sortFeld];
      if (sortFeld === 'wert') return wert[r.i];
      if (sortFeld === 'sterne') return r.st.length;
      return r.k.w[sortFeld];
    }
    reihen.sort(function (a, b) {
      var x = v(a), y = v(b);
      if (x == null) return 1; if (y == null) return -1;
      var c = typeof x === 'string' ? x.localeCompare(y, 'de') : x - y;
      return sortAuf ? c : -c;
    });
    $('k-tabelle').querySelector('thead').innerHTML = '<tr>' + SPALTEN.map(function (s) {
      var an = sortFeld === s[0];
      return '<th scope="col"' + (s[0] !== 'name' && s[0] !== 'land' ? ' class="z"' : '') + ' aria-sort="' + (an ? (sortAuf ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="k-sort" data-feld="' + s[0] + '">' + esc(s[1]) + (an ? (sortAuf ? ' ▲' : ' ▼') : '') + '</button></th>';
    }).join('') + '</tr>';
    $('k-tabelle').querySelector('tbody').innerHTML = reihen.map(function (r) {
      var k = r.k, a = ampel[r.i];
      return '<tr data-ags="' + k.ags + '"' + (gewaehlt === k.ags ? ' class="gewaehlt"' : '') + '><th scope="row" data-titel="Gebiet"><button type="button" class="k-zeige" data-ags="' + k.ags + '">' + esc(anzeigeName(k)) + '</button></th>' +
        '<td data-titel="Land">' + esc(k.land) + '</td>' +
        '<td class="z" data-titel="Wert"><span class="ampel-punkt ' + (a || 'leer') + '" aria-hidden="true"></span>' + (wert[r.i] != null ? fmt0.format(wert[r.i]) : '-') + '<span class="sprung"> ' + (a ? { gut: 'grün', warn: 'gelb', schlecht: 'rot' }[a] : '') + '</span></td>' +
        '<td class="z" data-titel="Prognose 2045">' + zahlText('p45', k.w.p45) + '</td><td class="z" data-titel="Leerstand">' + zahlText('leer', k.w.leer) + '</td>' +
        '<td class="z" data-titel="Miete €/m²">' + (k.w.miete != null ? fmt2.format(k.w.miete) : '-') + '</td><td class="z" data-titel="Studierende">' + zahlText('stud', k.w.stud) + '</td>' +
        '<td class="z" data-titel="Einpendler">' + zahlText('ein', k.w.ein) + '</td>' +
        '<td class="z" data-titel="Sterne">' + r.st.map(function (x) { return '<span class="k-st ' + x.art + '" title="' + esc(x.text) + '">★</span>'; }).join('') + '<span class="sprung">' + r.st.map(function (x) { return STERNNAME[x.art]; }).join(', ') + '</span></td></tr>';
    }).join('');
    $('k-anzahl').textContent = reihen.length + ' von ' + KREISE.length + ' Gebieten';
  }
  function tabelleMarkieren() {
    document.querySelectorAll('#k-tabelle tbody tr').forEach(function (tr) { tr.classList.toggle('gewaehlt', tr.getAttribute('data-ags') === gewaehlt); });
  }
  $('k-tabelle').addEventListener('click', function (ev) {
    var s = ev.target.closest('.k-sort');
    if (s) { var f = s.getAttribute('data-feld'); if (sortFeld === f) sortAuf = !sortAuf; else { sortFeld = f; sortAuf = f === 'name' || f === 'land'; } tabelle(); return; }
    var z = ev.target.closest('.k-zeige');
    if (z) { waehle(z.getAttribute('data-ags'), true); $('k-buehne').scrollIntoView({ block: 'nearest' }); }
  });
  ['k-filter', 'k-land', 'k-amp'].forEach(function (id) { $(id).addEventListener('input', tabelle); $(id).addEventListener('change', tabelle); });
  $('k-land').innerHTML = '<option value="">Alle Länder</option>' + GEO.laender.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); }).map(function (l) { return '<option value="' + l.ags + '">' + esc(l.name) + '</option>'; }).join('');

  /* ---------- Streudiagramm: Nachfrage gegen Miete/Boden ---------- */
  function streu() {
    var box = $('k-streu'), w = Math.max(300, box.clientWidth || 600), h = 320, l = 46, r = 14, o = 14, u = 40;
    var sx = function (v) { return l + v / 100 * (w - l - r); }, sy = function (v) { return o + (1 - v / 100) * (h - o - u); };
    var s = '<rect x="' + sx(50) + '" y="' + sy(100) + '" width="' + (sx(100) - sx(50)) + '" height="' + (sy(50) - sy(100)) + '" class="k-quadrant"/>' +
      '<text x="' + (sx(100) - 6) + '" y="' + (sy(100) + 16) + '" text-anchor="end" class="k-qtext">gefragt und viel Miete je Bodenpreis</text>';
    [0, 25, 50, 75, 100].forEach(function (t) {
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(t) + '" y2="' + sy(t) + '"/><text x="' + (l - 6) + '" y="' + (sy(t) + 4) + '" text-anchor="end">' + t + '</text>' +
        '<text x="' + sx(t) + '" y="' + (h - u + 16) + '" text-anchor="middle">' + t + '</text>';
    });
    s += '<text x="' + ((l + w - r) / 2) + '" y="' + (h - 6) + '" text-anchor="middle">Nachfrage (Rang 0 bis 100) →</text>';
    s += '<text x="12" y="' + ((o + h - u) / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + ((o + h - u) / 2) + ')">Miete/Boden →</text>';
    KREISE.forEach(function (k, i) {
      var x = k.eb.nachfrage, y = k.eb.mieteboden;
      if (x == null || y == null) return;
      s += '<circle cx="' + sx(x).toFixed(1) + '" cy="' + sy(y).toFixed(1) + '" r="' + (gewaehlt === k.ags ? 6 : 3.5) + '" class="k-punkt ' + (ampel[i] || 'leer') + (gewaehlt === k.ags ? ' gewaehlt' : '') + '" data-ags="' + k.ags + '" data-tip="<b>' + esc(anzeigeName(k)) + '</b><br>Nachfrage ' + fmt0.format(x) + ', Miete/Boden ' + fmt0.format(y) + '"/>';
    });
    box.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="Streudiagramm: Nachfrage gegen Miete im Verhältnis zum Bodenpreis, je Landkreis">' + s + '</svg>';
  }
  $('k-streu').addEventListener('click', function (ev) { var p = ev.target.closest('[data-ags]'); if (p) { waehle(p.getAttribute('data-ags'), true); $('k-buehne').scrollIntoView({ block: 'nearest' }); } });

  /* ---------- 2D / 3D ---------- */
  var drei = false;
  function ansicht(d) {
    drei = d && !!window.KARTE3D;
    $('k-ansicht-2d').setAttribute('aria-pressed', drei ? 'false' : 'true');
    $('k-ansicht-3d').setAttribute('aria-pressed', drei ? 'true' : 'false');
    svg.style.visibility = drei ? 'hidden' : '';
    $('k-szene').hidden = !drei; $('k-zoom').hidden = drei;
    if (drei) window.KARTE3D.zeige(KREISE, wert, ampel); else zeichnen();
  }
  $('k-ansicht-2d').addEventListener('click', function () { ansicht(false); });
  $('k-ansicht-3d').addEventListener('click', function () { ansicht(true); });
  window.addEventListener('themagewechselt', function () { if (drei) window.KARTE3D.zeige(KREISE, wert, ampel); });

  function allesNeu() {
    rechnen(); zeichnen(); steckbrief(); tabelle(); streu();
    if (drei) window.KARTE3D.zeige(KREISE, wert, ampel);
    if (window.KARTE_GEAENDERT) window.KARTE_GEAENDERT();
  }
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (sichtbar) { var alt = vb; einpassen(); if (alt) { vb.x = alt.x; vb.y = alt.y; vb.w = alt.w; vb.h = alt.w * (svg.clientHeight || 1) / (svg.clientWidth || 1); } zeichnen(); streu(); } }).observe($('k-buehne'));

  rechnen();
  ebenenKnoepfe(); regler();
  $('k-quellen').innerHTML = 'Kartengrundlage: © <a href="https://www.bkg.bund.de" target="_blank" rel="noopener">BKG</a> (2026) <a href="https://www.govdata.de/dl-de/by-2-0" target="_blank" rel="noopener">dl-de/by-2-0</a>, Datenquellen: <a href="https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf" target="_blank" rel="noopener">datenquellen_vg_nuts.pdf</a>; verändert (vereinfacht, umgerechnet). ' +
    'Kennzahlen: ' + esc(W.quellen.inkar) + '; ' + esc(W.quellen.zensus) + '. Portalpreise: ' + esc(W.quellen.portal) + '. Gemeinden: Statistisches Bundesamt (Destatis), Gemeindeverzeichnis, 2026. Werke: offizielle Konzernseiten (Abruf 08.10.2026) und Wikipedia (Abruf 09.10.2026).';

  window.KARTE = {
    zeigt: function (an) { sichtbar = !!an; if (!sichtbar) return; if (!vb) einpassen(); zeichnen(); steckbrief(); tabelle(); streu(); },
    /* Für die Merkliste: Kreis, Ampel, Sterne zu einem Objekt (ort, land) */
    gebietFuer: function (ob) {
      var tr = ob.kreis && NACH_AGS[ob.kreis] != null ? { ags: ob.kreis, sicher: true } : kreisVonOrt(ob.ort, ob.land);
      if (!tr) return null;
      var i = NACH_AGS[tr.ags], k = KREISE[i];
      return { ags: k.ags, name: anzeigeName(k), sicher: tr.sicher, ampel: ampel[i], wert: wert[i], ebene: EBENE[E.ebene].name, sterne: sterneVon(k) };
    },
    kreisListe: function () { return KREISE.map(function (k) { return { ags: k.ags, name: anzeigeName(k), land: k.land }; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); }); },
    waehle: function (ags) { waehle(ags, true); }
  };
})();
