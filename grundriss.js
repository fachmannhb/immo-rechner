/* Bereich „Grundriss und Einrichtung“: Bild laden, Maßstab, Räume zeichnen, Möbel stellen,
   Wohnfläche (WoFlV) und Kosten. Alle Koordinaten in Metern; das Bild liegt mit der linken
   oberen Ecke auf (0,0) und ist mpp Meter je Bildpunkt groß. Speichert unter „immo-grundriss“.
   Rechnet mit RECHNER (rechner.js), zeichnet 3D über GRUNDRISS3D (grundriss3d.js). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var svg = $('g-plan');
  if (!svg || !window.RECHNER) return;
  var R = window.RECHNER;
  var KAT = (window.DATEN && window.DATEN.moebel) || { artikel: [] };
  var ART = {};
  KAT.artikel.forEach(function (a) { ART[a.id] = a; });
  var SCHLUESSEL = 'immo-grundriss';
  var NS = 'http://www.w3.org/2000/svg';
  var fmt1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmt0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  function euro(x) { return fmt0.format(Math.round(x)) + ' €'; }
  function qm(x) { return fmt1.format(x) + ' m²'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function zahl(s) { var n = R.leseZahl(s); return n == null ? null : n; }
  function neueId(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function rund(x, schritt) { return Math.round(x / schritt) * schritt; }

  var ARTEN = [
    ['voll', 'Wohnraum (Zimmer, Küche, Bad, Flur)'],
    ['balkon', 'Balkon, Loggia, Terrasse'],
    ['wintergarten', 'Wintergarten (unbeheizt)'],
    ['zubehoer', 'Keller, Garage, Heizraum, Abstellraum außerhalb']
  ];

  /* ---------- Zustand ---------- */
  function neueEtage(name) { return { name: name, bild: null, bildB: 0, bildH: 0, mpp: 0.01, massstab: false, raeume: [], teile: [] }; }
  function leererPlan() { return { app: 'immo-grundriss', version: 1, aktiv: 0, wandhoehe: 2.5, preise: {}, mengen: {}, etagen: [neueEtage('Erdgeschoss')] }; }
  var plan = laden() || leererPlan();
  var gewaehlt = null;      /* { typ:'raum'|'teil', id } */
  var modus = 'auswahl';    /* auswahl | rechteck | ecken | massstab */
  var entwurf = [];         /* Punkte beim Zeichnen Ecke für Ecke */
  var maus = null;          /* letzte Mausposition im Plan */
  var massPunkte = [];
  var ziehen = null;
  var ansicht3d = false;
  var gruppe = 'wohnung';
  var vb = null;            /* sichtbarer Ausschnitt {x,y,w,h} */
  var sichtbar = false;

  function etage() { return plan.etagen[plan.aktiv] || plan.etagen[0]; }

  /* ---------- Speichern ---------- */
  function pruefePlan(p) {
    if (!p || typeof p !== 'object' || p.app !== 'immo-grundriss' || !Array.isArray(p.etagen) || !p.etagen.length) return null;
    var zahlOk = function (x, d) { x = Number(x); return isFinite(x) ? x : d; };
    var neu = leererPlan();
    neu.wandhoehe = Math.min(6, Math.max(1.8, zahlOk(p.wandhoehe, 2.5)));
    neu.preise = {}; neu.mengen = {};
    Object.keys(p.preise || {}).forEach(function (k) { var v = Number(p.preise[k]); if (isFinite(v) && v >= 0) neu.preise[k] = v; });
    Object.keys(p.mengen || {}).forEach(function (k) { var v = Number(p.mengen[k]); if (isFinite(v) && v >= 0) neu.mengen[k] = v; });
    neu.etagen = p.etagen.slice(0, 12).map(function (e, i) {
      var n = neueEtage(String(e.name || ('Etage ' + (i + 1))).slice(0, 40));
      if (typeof e.bild === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(e.bild)) {
        n.bild = e.bild; n.bildB = zahlOk(e.bildB, 0); n.bildH = zahlOk(e.bildH, 0);
      }
      n.mpp = zahlOk(e.mpp, 0.01) > 0 ? zahlOk(e.mpp, 0.01) : 0.01;
      n.massstab = !!e.massstab;
      n.raeume = (e.raeume || []).filter(function (r) { return r && Array.isArray(r.punkte) && r.punkte.length >= 3; }).map(function (r) {
        return {
          id: String(r.id || neueId('r')), name: String(r.name || 'Raum').slice(0, 40),
          art: ARTEN.some(function (a) { return a[0] === r.art; }) ? r.art : 'voll',
          punkte: r.punkte.map(function (q) { return [zahlOk(q[0], 0), zahlOk(q[1], 0)]; }),
          teil12: zahlOk(r.teil12, 0), teil0: zahlOk(r.teil0, 0), balkon: zahlOk(r.balkon, 25), separat: !!r.separat
        };
      });
      n.teile = (e.teile || []).filter(function (t) { return t && ART[t.art]; }).map(function (t) {
        return { id: String(t.id || neueId('t')), art: t.art, x: zahlOk(t.x, 0), y: zahlOk(t.y, 0), w: Math.max(0.05, zahlOk(t.w, 1)), d: Math.max(0.02, zahlOk(t.d, 1)), dreh: [0, 90, 180, 270].indexOf(Number(t.dreh)) >= 0 ? Number(t.dreh) : 0 };
      });
      return n;
    });
    neu.aktiv = Math.min(neu.etagen.length - 1, Math.max(0, zahlOk(p.aktiv, 0) | 0));
    if (p.beispiel === true) neu.beispiel = true;
    return neu;
  }
  function laden() {
    try { var t = localStorage.getItem(SCHLUESSEL); return t ? pruefePlan(JSON.parse(t)) : null; } catch (e) { return null; }
  }
  var speicherTimer = null;
  function speichern() {
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(function () {
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(plan));
        if (meldungArt === 'speicher') meldung('');
      } catch (e) {
        /* meist zu groß wegen der Bilder: Plan ohne Bilder speichern und sagen, warum */
        var ohne = JSON.parse(JSON.stringify(plan));
        ohne.etagen.forEach(function (et) { et.bild = null; });
        try {
          localStorage.setItem(SCHLUESSEL, JSON.stringify(ohne));
          meldung('Der Plan ist gespeichert, das Grundrissbild aber nicht: es ist zu groß für den Speicher dieses Browsers. Sichere den Plan als Datei („Plan sichern“ unten), dann bleibt auch das Bild erhalten.', 'speicher');
        } catch (e2) {
          meldung('Der Plan konnte in diesem Browser nicht gespeichert werden (Speicher voll oder gesperrt, z. B. im privaten Fenster). Sichere ihn als Datei, sonst ist er nach dem Schließen weg.', 'speicher');
        }
      }
    }, 300);
  }
  var meldungArt = '';
  function meldung(text, art) { $('g-meldung').textContent = text; meldungArt = text ? (art || '') : ''; }

  /* ---------- Ansicht ---------- */
  function px2m() { var b = svg.clientWidth || 800; return vb ? vb.w / b : 0.02; }
  function grenzen() {
    var e = etage(), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function nimm(x, y) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (e.bild) { nimm(0, 0); nimm(e.bildB * e.mpp, e.bildH * e.mpp); }
    e.raeume.forEach(function (r) { r.punkte.forEach(function (p) { nimm(p[0], p[1]); }); });
    e.teile.forEach(function (t) { nimm(t.x - t.w / 2, t.y - t.w / 2); nimm(t.x + t.w / 2, t.y + t.w / 2); });
    if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 14; y1 = 10; }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function einpassen() {
    var g = grenzen(), rand = 1;
    var w = Math.max(4, g.x1 - g.x0) + 2 * rand, h = Math.max(4, g.y1 - g.y0) + 2 * rand;
    var bw = svg.clientWidth || 800, bh = svg.clientHeight || 500;
    if (w / h < bw / bh) w = h * bw / bh; else h = w * bh / bw;
    vb = { x: (g.x0 + g.x1) / 2 - w / 2, y: (g.y0 + g.y1) / 2 - h / 2, w: w, h: h };
  }
  function zoomen(f, cx, cy) {
    if (!vb) einpassen();
    var nw = Math.min(400, Math.max(1.5, vb.w * f)), k = nw / vb.w;
    if (cx == null) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
    vb = { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w: nw, h: vb.h * k };
    zeichnen();
  }
  function seitenverhaeltnis() {
    if (!vb) return;
    var bw = svg.clientWidth, bh = svg.clientHeight;
    if (!bw || !bh) return;
    var h = vb.w * bh / bw;
    vb.y += (vb.h - h) / 2; vb.h = h;
  }

  /* ---------- Zeichnen ---------- */
  function schwerpunkt(p) {
    var a = 0, cx = 0, cy = 0;
    for (var i = 0; i < p.length; i++) {
      var q = p[i], r = p[(i + 1) % p.length], k = q[0] * r[1] - r[0] * q[1];
      a += k; cx += (q[0] + r[0]) * k; cy += (q[1] + r[1]) * k;
    }
    if (Math.abs(a) < 1e-9) {
      return [p.reduce(function (s, q) { return s + q[0]; }, 0) / p.length, p.reduce(function (s, q) { return s + q[1]; }, 0) / p.length];
    }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function flaeche(r) { return R.polygonFlaeche(r.punkte); }
  function el(name, attr, eltern) {
    var e = document.createElementNS(NS, name);
    Object.keys(attr || {}).forEach(function (k) { e.setAttribute(k, attr[k]); });
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function zeichnen() {
    if (!sichtbar || ansicht3d) return;
    if (!vb) einpassen();
    var fokusId = document.activeElement && svg.contains(document.activeElement) ? document.activeElement.getAttribute('data-id') : null;
    var e = etage(), s = px2m();
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (e.bild) el('image', { href: e.bild, x: 0, y: 0, width: e.bildB * e.mpp, height: e.bildH * e.mpp, preserveAspectRatio: 'none', opacity: 0.85 }, svg);
    /* Raster: 1 m, bei großem Ausschnitt 5 m */
    var schritt = vb.w > 80 ? 5 : 1, gr = el('g', { 'aria-hidden': 'true' }, svg);
    for (var x = Math.floor(vb.x / schritt) * schritt; x <= vb.x + vb.w; x += schritt) el('line', { x1: x, y1: vb.y, x2: x, y2: vb.y + vb.h, class: 'raster-linie' + (x % (schritt * 5) === 0 ? ' meter' : '') }, gr);
    for (var y = Math.floor(vb.y / schritt) * schritt; y <= vb.y + vb.h; y += schritt) el('line', { x1: vb.x, y1: y, x2: vb.x + vb.w, y2: y, class: 'raster-linie' + (y % (schritt * 5) === 0 ? ' meter' : '') }, gr);

    e.raeume.forEach(function (r) {
      var g = el('g', { 'data-raum': r.id, 'data-id': r.id, tabindex: 0, role: 'button', 'aria-label': 'Raum ' + r.name + ', ' + qm(flaeche(r)) }, svg);
      el('polygon', { points: r.punkte.map(function (p) { return p[0] + ',' + p[1]; }).join(' '), class: 'raum art-' + r.art + (gewaehlt && gewaehlt.id === r.id ? ' gewaehlt' : '') }, g);
    });
    e.teile.forEach(function (t) {
      var a = ART[t.art];
      var g = el('g', { 'data-teil': t.id, 'data-id': t.id, tabindex: 0, role: 'button', 'aria-label': a.name + (t.dreh ? ', gedreht ' + t.dreh + ' Grad' : ''), transform: 'translate(' + t.x + ' ' + t.y + ') rotate(' + t.dreh + ')', class: 'teil ' + (a.form === 'wandweg' ? 'wandweg' : a.gruppe) + (gewaehlt && gewaehlt.id === t.id ? ' gewaehlt' : '') }, svg);
      el('rect', { x: -t.w / 2, y: -t.d / 2, width: t.w, height: t.d, class: 'koerper', rx: Math.min(t.w, t.d) * 0.06 }, g);
      if (a.form === 'bett') {
        var k = Math.min(0.5, t.w * 0.4), n = t.w > 1.2 ? 2 : 1;
        for (var i = 0; i < n; i++) el('rect', { x: -t.w / 2 + 0.08 + i * (t.w - 0.16) / n, y: -t.d / 2 + 0.08, width: (t.w - 0.16) / n - (n > 1 ? 0.06 : 0), height: Math.min(0.35, t.d * 0.2), class: 'kissen', rx: 0.05 }, g);
        void k;
      }
      if (a.form === 'tuer') el('path', { d: 'M ' + (-t.w / 2) + ' ' + (t.d / 2) + ' A ' + t.w + ' ' + t.w + ' 0 0 0 ' + (t.w / 2) + ' ' + (t.d / 2 - t.w), class: 'hilfslinie', style: 'stroke-dasharray:4 4;stroke-width:1.5' }, g);
      var fs = 11 * s, kurz = a.kurz || a.name;
      if (t.w > kurz.length * fs * 0.55 && t.d > fs * 1.4) {
        var tx = el('text', { x: 0, y: a.form === 'bett' ? t.d * 0.12 : 0, 'font-size': fs, transform: t.dreh % 180 ? 'rotate(' + (-t.dreh) + ')' : (t.dreh === 180 ? 'rotate(180)' : '') }, g);
        tx.textContent = kurz;
      }
    });
    /* Raumnamen über den Möbeln; Konturbreite in Metern, weil im Plan eine Einheit ein Meter ist */
    e.raeume.forEach(function (r) {
      var c = schwerpunkt(r.punkte), t = el('text', { x: c[0], y: c[1], class: 'raum-text', 'font-size': 14 * s, 'stroke-width': 3 * s }, svg);
      var a = el('tspan', { x: c[0], dy: 0 }, t); a.textContent = r.name;
      var b = el('tspan', { x: c[0], dy: 17 * s, class: 'leise', 'font-size': 13 * s }, t); b.textContent = qm(flaeche(r));
    });
    /* Griffe am gewählten Raum */
    if (gewaehlt && gewaehlt.typ === 'raum' && modus === 'auswahl') {
      var rg = findeRaum(gewaehlt.id);
      if (rg) rg.punkte.forEach(function (p, i) { el('circle', { cx: p[0], cy: p[1], r: 7 * s, class: 'griff', 'data-griff': i }, svg); });
    }
    /* Hilfslinien beim Zeichnen */
    if (ziehen && ziehen.typ === 'rechteck' && ziehen.b) {
      var a0 = ziehen.a, b0 = ziehen.b;
      el('rect', { x: Math.min(a0[0], b0[0]), y: Math.min(a0[1], b0[1]), width: Math.abs(b0[0] - a0[0]), height: Math.abs(b0[1] - a0[1]), class: 'hilfsflaeche' }, svg);
      var mt = el('text', { x: (a0[0] + b0[0]) / 2, y: (a0[1] + b0[1]) / 2, class: 'raum-text', 'font-size': 14 * s, 'stroke-width': 3 * s }, svg);
      mt.textContent = fmt1.format(Math.abs(b0[0] - a0[0])) + ' × ' + fmt1.format(Math.abs(b0[1] - a0[1])) + ' m';
    }
    if (modus === 'ecken' && entwurf.length) {
      var pts = entwurf.concat(maus ? [maus] : []);
      el('polyline', { points: pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '), class: 'hilfslinie' }, svg);
      entwurf.forEach(function (p, i) { el('circle', { cx: p[0], cy: p[1], r: (i === 0 ? 8 : 5) * s, class: 'hilfspunkt' }, svg); });
    }
    if (massPunkte.length) {
      var mp = massPunkte.concat(modus === 'massstab' && maus && massPunkte.length === 1 ? [maus] : []);
      if (mp.length > 1) el('line', { x1: mp[0][0], y1: mp[0][1], x2: mp[1][0], y2: mp[1][1], class: 'hilfslinie' }, svg);
      massPunkte.forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 6 * s, class: 'hilfspunkt' }, svg); });
    }
    svg.setAttribute('class', modus === 'auswahl' ? '' : 'zeichnen');
    if (fokusId) { var f = svg.querySelector('[data-id="' + fokusId + '"]'); if (f) f.focus({ preventScroll: true }); }
  }

  function findeRaum(id) { return etage().raeume.filter(function (r) { return r.id === id; })[0]; }
  function findeTeil(id) { return etage().teile.filter(function (t) { return t.id === id; })[0]; }

  /* ---------- Maus und Finger ---------- */
  function imPlan(ev) {
    var m = svg.getScreenCTM();
    if (!m) return [0, 0];
    var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    p = p.matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  /* Einrasten an vorhandenen Raumecken, sonst auf 5 cm */
  function einrasten(p, ohneId) {
    var tol = 10 * px2m(), best = null, bd = tol;
    etage().raeume.forEach(function (r) {
      if (r.id === ohneId) return;
      r.punkte.forEach(function (q) { var d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } });
    });
    return best ? [best[0], best[1]] : [rund(p[0], 0.05), rund(p[1], 0.05)];
  }
  svg.addEventListener('pointerdown', function (ev) {
    if (ev.button > 0) return;
    var p = imPlan(ev);
    if (modus === 'rechteck') {
      ziehen = { typ: 'rechteck', a: einrasten(p), b: null };
    } else if (modus === 'ecken') {
      var q = einrasten(p);
      if (entwurf.length >= 3 && Math.hypot(q[0] - entwurf[0][0], q[1] - entwurf[0][1]) < 12 * px2m()) { eckenFertig(); return; }
      entwurf.push(q); tipp(); zeichnen(); return;
    } else if (modus === 'massstab') {
      massPunkte.push([p[0], p[1]]);
      if (massPunkte.length === 2) { modusSetzen('auswahl'); $('g-mass-frage').hidden = false; $('g-mass-laenge').focus(); }
      zeichnen(); return;
    } else {
      var griff = ev.target.closest('[data-griff]'), teil = ev.target.closest('[data-teil]'), raum = ev.target.closest('[data-raum]');
      if (griff && gewaehlt && gewaehlt.typ === 'raum') {
        ziehen = { typ: 'griff', id: gewaehlt.id, i: Number(griff.getAttribute('data-griff')) };
      } else if (teil) {
        var t = findeTeil(teil.getAttribute('data-teil'));
        waehle('teil', t.id);
        ziehen = { typ: 'teil', id: t.id, dx: t.x - p[0], dy: t.y - p[1], bewegt: false };
      } else if (raum) {
        var r = findeRaum(raum.getAttribute('data-raum'));
        waehle('raum', r.id);
        ziehen = { typ: 'raum', id: r.id, start: p, alt: r.punkte.map(function (q) { return q.slice(); }), bewegt: false };
      } else {
        if (gewaehlt) waehle(null);
        ziehen = { typ: 'schieben', cx: ev.clientX, cy: ev.clientY, vb: { x: vb.x, y: vb.y, w: vb.w, h: vb.h } };
        svg.classList.add('schieben');
      }
    }
    try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
    ev.preventDefault();
  });
  svg.addEventListener('pointermove', function (ev) {
    var p = imPlan(ev);
    if (!ziehen) {
      if (modus === 'ecken' && entwurf.length || modus === 'massstab' && massPunkte.length === 1) { maus = modus === 'ecken' ? einrasten(p) : p; zeichnen(); }
      return;
    }
    if (ziehen.typ === 'rechteck') { ziehen.b = einrasten(p); zeichnen(); }
    else if (ziehen.typ === 'schieben') {
      var k = px2m();
      vb.x = ziehen.vb.x - (ev.clientX - ziehen.cx) * k; vb.y = ziehen.vb.y - (ev.clientY - ziehen.cy) * k;
      svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    } else if (ziehen.typ === 'teil') {
      var t = findeTeil(ziehen.id);
      t.x = rund(p[0] + ziehen.dx, 0.1); t.y = rund(p[1] + ziehen.dy, 0.1); ziehen.bewegt = true; zeichnen();
    } else if (ziehen.typ === 'raum') {
      var r = findeRaum(ziehen.id), dx = rund(p[0] - ziehen.start[0], 0.05), dy = rund(p[1] - ziehen.start[1], 0.05);
      r.punkte = ziehen.alt.map(function (q) { return [q[0] + dx, q[1] + dy]; }); ziehen.bewegt = dx || dy; zeichnen();
    } else if (ziehen.typ === 'griff') {
      var rr = findeRaum(ziehen.id); rr.punkte[ziehen.i] = einrasten(p, rr.id); zeichnen();
    }
  });
  function loslassen() {
    if (!ziehen) return;
    var z = ziehen; ziehen = null;
    svg.classList.remove('schieben');
    if (z.typ === 'rechteck' && z.b) {
      var a = z.a, b = z.b;
      if (Math.abs(b[0] - a[0]) >= 0.3 && Math.abs(b[1] - a[1]) >= 0.3) {
        var x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
        neuerRaum([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
        return;
      }
    }
    if (z.typ !== 'schieben') geaendert(); else zeichnen();
  }
  svg.addEventListener('pointerup', loslassen);
  svg.addEventListener('pointercancel', loslassen);
  svg.addEventListener('dblclick', function () { if (modus === 'ecken') eckenFertig(); });
  svg.addEventListener('wheel', function (ev) {
    if (!ev.ctrlKey) return; /* ohne Strg scrollt die Seite normal */
    ev.preventDefault();
    var p = imPlan(ev);
    zoomen(ev.deltaY > 0 ? 1.15 : 1 / 1.15, p[0], p[1]);
  }, { passive: false });
  svg.addEventListener('focusin', function (ev) {
    var g = ev.target.closest('[data-id]');
    if (!g) return;
    var id = g.getAttribute('data-id');
    if (!gewaehlt || gewaehlt.id !== id) waehle(g.hasAttribute('data-teil') ? 'teil' : 'raum', id);
  });

  /* ---------- Tastatur ---------- */
  document.addEventListener('keydown', function (ev) {
    if (!sichtbar || ansicht3d) return;
    var imFeld = /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName);
    if (ev.key === 'Escape') {
      if (modus !== 'auswahl' || entwurf.length || massPunkte.length) { entwurf = []; massPunkte = []; $('g-mass-frage').hidden = true; modusSetzen('auswahl'); zeichnen(); ev.preventDefault(); }
      return;
    }
    if (imFeld) return;
    if (ev.key === 'Enter' && modus === 'ecken') { eckenFertig(); ev.preventDefault(); return; }
    if (!svg.contains(document.activeElement) || !gewaehlt) return;
    var schritt = ev.shiftKey ? 0.5 : 0.1, dx = 0, dy = 0;
    if (ev.key === 'ArrowLeft') dx = -schritt; else if (ev.key === 'ArrowRight') dx = schritt;
    else if (ev.key === 'ArrowUp') dy = -schritt; else if (ev.key === 'ArrowDown') dy = schritt;
    if (dx || dy) {
      if (gewaehlt.typ === 'teil') { var t = findeTeil(gewaehlt.id); t.x = rund(t.x + dx, 0.05); t.y = rund(t.y + dy, 0.05); }
      else { var r = findeRaum(gewaehlt.id); r.punkte = r.punkte.map(function (q) { return [rund(q[0] + dx, 0.05), rund(q[1] + dy, 0.05)]; }); }
      geaendert(); ev.preventDefault(); return;
    }
    if ((ev.key === 'r' || ev.key === 'R') && gewaehlt.typ === 'teil') { drehen(); ev.preventDefault(); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { loeschen(); ev.preventDefault(); }
  });

  /* ---------- Aktionen ---------- */
  function geaendert() { speichern(); zeichnen(); auswerten(); }
  function raumNummer() {
    var n = 0; plan.etagen.forEach(function (e) { n += e.raeume.length; }); return n + 1;
  }
  function neuerRaum(punkte) {
    var r = { id: neueId('r'), name: 'Raum ' + raumNummer(), art: 'voll', punkte: punkte, teil12: 0, teil0: 0, balkon: 25, separat: false };
    etage().raeume.push(r);
    gewaehlt = { typ: 'raum', id: r.id };
    geaendert(); auswahlZeigen();
    meldung('Raum angelegt (' + qm(flaeche(r)) + '). Rechts kannst du ihm einen Namen und eine Art geben.');
  }
  function eckenFertig() {
    if (entwurf.length < 3) { tipp('Mindestens drei Ecken setzen, dann schließen.'); return; }
    var p = entwurf; entwurf = []; maus = null;
    neuerRaum(p); tipp();
  }
  function waehle(typ, id) {
    gewaehlt = typ ? { typ: typ, id: id } : null;
    zeichnen(); auswahlZeigen();
  }
  function drehen() {
    var t = gewaehlt && gewaehlt.typ === 'teil' && findeTeil(gewaehlt.id);
    if (!t) return;
    t.dreh = (t.dreh + 90) % 360; geaendert(); auswahlZeigen();
  }
  function loeschen() {
    if (!gewaehlt) return;
    var e = etage(), name;
    if (gewaehlt.typ === 'teil') { var t = findeTeil(gewaehlt.id); name = ART[t.art].name; e.teile = e.teile.filter(function (x) { return x.id !== gewaehlt.id; }); }
    else { var r = findeRaum(gewaehlt.id); name = r.name; e.raeume = e.raeume.filter(function (x) { return x.id !== gewaehlt.id; }); }
    gewaehlt = null;
    geaendert(); auswahlZeigen();
    meldung('„' + name + '“ gelöscht.');
    svg.focus();
  }
  function teilHinzu(artId) {
    var a = ART[artId], e = etage(), x, y;
    var r = gewaehlt && gewaehlt.typ === 'raum' && findeRaum(gewaehlt.id);
    if (r) { var c = schwerpunkt(r.punkte); x = c[0]; y = c[1]; }
    else { if (!vb) einpassen(); x = vb.x + vb.w / 2; y = vb.y + vb.h / 2; }
    var t = { id: neueId('t'), art: artId, x: rund(x, 0.1), y: rund(y, 0.1), w: a.breite / 100, d: a.tiefe / 100, dreh: 0 };
    e.teile.push(t);
    gewaehlt = { typ: 'teil', id: t.id };
    geaendert(); auswahlZeigen();
    var g = svg.querySelector('[data-id="' + t.id + '"]'); if (g) g.focus({ preventScroll: true });
  }

  /* ---------- Modus, Schritte, Tipps ---------- */
  function tipp(text) {
    var t = text;
    if (!t) {
      if (modus === 'rechteck') t = 'Drücken und ziehen, um einen rechteckigen Raum zu zeichnen.';
      else if (modus === 'ecken') t = entwurf.length ? entwurf.length + ' Ecken gesetzt. Auf den ersten Punkt klicken oder Enter drückt den Raum zu.' : 'Klicke die erste Ecke des Raums an.';
      else if (modus === 'massstab') t = massPunkte.length ? 'Jetzt das Ende der Strecke anklicken.' : 'Klicke den Anfang einer Strecke an, deren Länge du kennst.';
      else t = '';
    }
    $('g-tipp').textContent = t;
  }
  function modusSetzen(m) {
    modus = m;
    if (m !== 'ecken') { entwurf = []; maus = null; }
    document.querySelectorAll('[data-gmodus]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gmodus') === m ? 'true' : 'false'); });
    tipp(); zeichnen();
  }
  function schrittZeigen(n) {
    n = String(n);
    document.querySelectorAll('#g-schritte button').forEach(function (b) {
      if (b.getAttribute('data-gschritt') === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-gpanel]').forEach(function (p) { p.hidden = p.getAttribute('data-gpanel') !== n; });
    if (n === '2') modusSetzen(etage().raeume.length ? 'auswahl' : 'rechteck');
    else if (modus !== 'auswahl') modusSetzen('auswahl');
  }
  document.querySelectorAll('#g-schritte button').forEach(function (b) {
    b.addEventListener('click', function () { schrittZeigen(b.getAttribute('data-gschritt')); });
  });
  document.querySelectorAll('[data-gmodus]').forEach(function (b) {
    b.addEventListener('click', function () { modusSetzen(b.getAttribute('data-gmodus')); });
  });
  $('g-zur-liste').addEventListener('click', function () { $('g-kosten-karte').scrollIntoView({ block: 'start' }); var h = $('g-kosten-karte').querySelector('h3'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); });

  /* ---------- Etagen ---------- */
  function etagenZeigen() {
    var box = $('g-etagen');
    box.innerHTML = '';
    plan.etagen.forEach(function (e, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = e.name;
      b.setAttribute('aria-pressed', i === plan.aktiv ? 'true' : 'false');
      b.addEventListener('click', function () { plan.aktiv = i; gewaehlt = null; massPunkte = []; entwurf = []; vb = null; speichern(); allesZeigen(); });
      box.appendChild(b);
    });
    var e = etage();
    $('g-etage-name').value = e.name;
    $('g-wandhoehe').value = fmt1.format(plan.wandhoehe).replace(/,0$/, ',0');
    $('g-etage-weg').disabled = plan.etagen.length < 2;
    $('g-bild-weg').disabled = !e.bild;
    $('g-mass-start').disabled = !e.bild;
    $('g-mass-stand').textContent = !e.bild ? 'Ohne Bild ist der Maßstab fest: ein Kästchen = 1 m.' :
      e.massstab ? 'Maßstab festgelegt. Du kannst ihn jederzeit neu festlegen; gezeichnete Räume wandern mit.' :
        'Noch kein Maßstab: Das Bild ist vorläufig 15 m breit angenommen. Flächen stimmen erst nach dem Festlegen.';
  }
  $('g-etage-neu').addEventListener('click', function () {
    var namen = ['Erdgeschoss', 'Obergeschoss', 'Dachgeschoss', 'Keller', '2. Obergeschoss'];
    var frei = namen.filter(function (n) { return !plan.etagen.some(function (e) { return e.name === n; }); })[0] || ('Etage ' + (plan.etagen.length + 1));
    plan.etagen.push(neueEtage(frei)); plan.aktiv = plan.etagen.length - 1; gewaehlt = null; vb = null;
    speichern(); allesZeigen(); schrittZeigen(1);
    meldung('Etage „' + frei + '“ angelegt. Lade ihr Grundrissbild oder zeichne direkt.');
  });
  $('g-etage-name').addEventListener('input', function () {
    etage().name = this.value.trim().slice(0, 40) || 'Etage'; speichern();
    var b = $('g-etagen').children[plan.aktiv]; if (b) b.textContent = etage().name;
    auswerten();
  });
  $('g-wandhoehe').addEventListener('input', function () {
    var v = zahl(this.value), f = $('g-wandhoehe-f');
    if (v == null || v < 1.8 || v > 6) { f.textContent = 'Bitte eine Höhe zwischen 1,8 und 6 m eingeben.'; this.setAttribute('aria-invalid', 'true'); return; }
    f.textContent = ''; this.removeAttribute('aria-invalid');
    plan.wandhoehe = v; speichern(); if (ansicht3d) dreiD();
  });
  var etageWegBestaetigt = false;
  $('g-etage-weg').addEventListener('click', function () {
    var e = etage();
    if (plan.etagen.length < 2) return;
    if ((e.raeume.length || e.teile.length || e.bild) && !etageWegBestaetigt) {
      etageWegBestaetigt = true; this.textContent = 'Wirklich löschen? Nochmal klicken';
      meldung('„' + e.name + '“ enthält ' + e.raeume.length + ' Räume und ' + e.teile.length + ' Teile. Zum Löschen den Knopf noch einmal drücken; vorher kannst du unten den Plan als Datei sichern.');
      return;
    }
    plan.etagen.splice(plan.aktiv, 1); plan.aktiv = Math.max(0, plan.aktiv - 1);
    etageWegBestaetigt = false; this.textContent = 'Diese Etage löschen';
    gewaehlt = null; vb = null; speichern(); allesZeigen();
    meldung('Etage „' + e.name + '“ gelöscht.');
  });
  $('g-etage-weg').addEventListener('blur', function () { if (etageWegBestaetigt) { etageWegBestaetigt = false; this.textContent = 'Diese Etage löschen'; } });

  /* ---------- Bild und Maßstab ---------- */
  function labelAlsKnopf(id, inputId) {
    $(id).addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $(inputId).click(); } });
  }
  labelAlsKnopf('g-bild-knopf', 'g-bild-datei');
  labelAlsKnopf('g-laden-knopf', 'g-laden-datei');
  $('g-bild-datei').addEventListener('change', function () {
    var datei = this.files && this.files[0];
    this.value = '';
    if (!datei) return;
    if (!/^image\/(png|jpeg|webp)$/.test(datei.type)) { meldung('Nicht geladen: „' + datei.name + '“ ist kein JPG-, PNG- oder WebP-Bild. Ein PDF-Grundriss lässt sich vorher als Bild speichern (z. B. Bildschirmfoto).'); return; }
    if (datei.size > 25 * 1024 * 1024) { meldung('Nicht geladen: Das Bild ist größer als 25 MB.'); return; }
    var url = URL.createObjectURL(datei), img = new Image();
    img.onload = function () {
      var max = 1600, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      var e = etage(), hatteRaeume = e.raeume.length > 0;
      e.bild = c.toDataURL('image/jpeg', 0.85); e.bildB = c.width; e.bildH = c.height;
      e.mpp = 15 / c.width; e.massstab = false; massPunkte = [];
      vb = null; speichern(); allesZeigen();
      meldung('Bild geladen. Lege jetzt den Maßstab fest: „Strecke anklicken“ und eine bekannte Wandlänge eingeben.' + (hatteRaeume ? ' Achtung: Die schon gezeichneten Räume dieser Etage werden beim Maßstab mit vergrößert oder verkleinert.' : ''));
      $('g-mass-start').focus();
    };
    img.onerror = function () { URL.revokeObjectURL(url); meldung('Das Bild „' + datei.name + '“ konnte nicht gelesen werden (Datei beschädigt oder Format unbekannt).'); };
    img.src = url;
  });
  $('g-bild-weg').addEventListener('click', function () {
    var e = etage(); if (!e.bild) return;
    e.bild = null; e.bildB = 0; e.bildH = 0; e.massstab = false; massPunkte = [];
    speichern(); allesZeigen(); meldung('Bild entfernt. Die Räume bleiben.');
  });
  $('g-mass-start').addEventListener('click', function () {
    massPunkte = []; $('g-mass-frage').hidden = true; modusSetzen('massstab');
    $('g-buehne').scrollIntoView({ block: 'nearest' });
  });
  function massAbbruch() { massPunkte = []; $('g-mass-frage').hidden = true; $('g-mass-laenge-f').textContent = ''; modusSetzen('auswahl'); }
  $('g-mass-abbruch').addEventListener('click', massAbbruch);
  function massOk() {
    var feld = $('g-mass-laenge'), L = zahl(feld.value), f = $('g-mass-laenge-f');
    if (L == null || L <= 0.1 || L > 200) { f.textContent = 'Bitte eine Länge zwischen 0,1 und 200 m eingeben, z. B. 4,20.'; feld.setAttribute('aria-invalid', 'true'); feld.focus(); return; }
    var a = massPunkte[0], b = massPunkte[1], d = a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0;
    if (d < 1e-6) { f.textContent = 'Die beiden Punkte liegen aufeinander. Bitte die Strecke neu anklicken.'; return; }
    f.textContent = ''; feld.removeAttribute('aria-invalid');
    var k = L / d, e = etage();
    e.mpp *= k; e.massstab = true;
    e.raeume.forEach(function (r) { r.punkte = r.punkte.map(function (q) { return [q[0] * k, q[1] * k]; }); });
    e.teile.forEach(function (t) { t.x *= k; t.y *= k; });
    massPunkte = []; $('g-mass-frage').hidden = true; feld.value = '';
    vb = null; speichern(); allesZeigen();
    meldung('Maßstab festgelegt: Das Bild ist jetzt ' + fmt1.format(e.bildB * e.mpp) + ' m breit. Weiter mit Schritt 2: Räume zeichnen.');
  }
  $('g-mass-ok').addEventListener('click', massOk);
  $('g-mass-laenge').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); massOk(); } });

  /* ---------- Raum mit Maßen ---------- */
  $('g-neu-raum').addEventListener('click', function () {
    var b = zahl($('g-neu-b').value), l = zahl($('g-neu-l').value), ok = true;
    [['g-neu-b', b], ['g-neu-l', l]].forEach(function (p) {
      var f = $(p[0] + '-f');
      if (p[1] == null || p[1] < 0.3 || p[1] > 100) { f.textContent = 'Bitte 0,3 bis 100 m eingeben.'; $(p[0]).setAttribute('aria-invalid', 'true'); ok = false; }
      else { f.textContent = ''; $(p[0]).removeAttribute('aria-invalid'); }
    });
    if (!ok) return;
    /* rechts neben die vorhandenen Räume legen */
    var e = etage(), x0 = 0, y0 = 0;
    if (e.raeume.length) { var g = grenzen(); x0 = rund(g.x1 + 0.5, 0.05); y0 = rund(g.y0, 0.05); }
    neuerRaum([[x0, y0], [x0 + b, y0], [x0 + b, y0 + l], [x0, y0 + l]]);
    vb = null; zeichnen();
  });

  /* ---------- Katalog ---------- */
  function katalogZeigen() {
    var box = $('g-katalog');
    box.innerHTML = '';
    KAT.artikel.filter(function (a) { return (a.gruppe === gruppe || (a.auch || []).indexOf(gruppe) >= 0) && a.zeichnen !== false; }).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = esc(a.name) + '<small>' + esc(a.breite + ' × ' + a.tiefe + ' cm') + '</small>';
      b.setAttribute('aria-label', a.name + ' hinzufügen, ' + a.breite + ' mal ' + a.tiefe + ' Zentimeter');
      b.addEventListener('click', function () { teilHinzu(a.id); });
      box.appendChild(b);
    });
  }
  document.querySelectorAll('[data-ggruppe]').forEach(function (b) {
    b.addEventListener('click', function () {
      gruppe = b.getAttribute('data-ggruppe');
      document.querySelectorAll('[data-ggruppe]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      katalogZeigen();
    });
  });

  /* ---------- Auswahl bearbeiten ---------- */
  function feld(id, label, wert, hilfe) {
    return '<div><label for="' + id + '">' + esc(label) + '</label><input type="text" id="' + id + '" inputmode="decimal" value="' + esc(wert) + '" aria-describedby="' + id + '-f">' +
      '<div class="fehler" id="' + id + '-f"></div>' + (hilfe ? '<div class="klein">' + esc(hilfe) + '</div>' : '') + '</div>';
  }
  function auswahlZeigen() {
    var box = $('g-auswahl');
    if (!gewaehlt) { box.innerHTML = ''; return; }
    if (gewaehlt.typ === 'raum') {
      var r = findeRaum(gewaehlt.id); if (!r) { box.innerHTML = ''; return; }
      var f = flaeche(r);
      var h = '<h4>Raum: ' + esc(r.name) + '</h4><p>Grundfläche <b>' + qm(f) + '</b>, davon Wohnfläche <b>' + qm(R.wohnflaecheRaum(raumDaten(r))) + '</b>.</p>' +
        '<div style="display:grid;gap:12px"><div><label for="g-r-name">Name</label><input type="text" id="g-r-name" value="' + esc(r.name) + '"></div>' +
        '<div><label for="g-r-art">Art des Raums</label><select id="g-r-art">' + ARTEN.map(function (a) { return '<option value="' + a[0] + '"' + (a[0] === r.art ? ' selected' : '') + '>' + esc(a[1]) + '</option>'; }).join('') + '</select></div>';
      if (r.art === 'voll' || r.art === 'wintergarten') {
        h += '<div class="g-mini">' + feld('g-r-t12', 'Anteil 1 bis 2 m hoch, in %', fmt0.format(r.teil12), '') + feld('g-r-t0', 'Anteil unter 1 m hoch, in %', fmt0.format(r.teil0), '') + '</div>' +
          '<p class="klein" style="margin:0">Nur bei Dachschrägen: welcher Teil der Fläche niedriger ist. Zählt halb bzw. gar nicht.</p>';
      } else if (r.art === 'balkon') {
        h += feld('g-r-balkon', 'Angerechnet in % (Regel 25, höchstens 50)', fmt0.format(r.balkon), '');
      } else {
        h += '<div class="g-check"><input type="checkbox" id="g-r-separat"' + (r.separat ? ' checked' : '') + '><label for="g-r-separat">Kann separat vermietet werden (z. B. Garage, Lagerraum)</label></div>';
      }
      h += '</div><div class="knopfreihe"><button type="button" class="knopf zweit" id="g-r-weg">Raum löschen</button></div>' +
        '<p class="klein" style="margin:8px 0 0">Ecken verschieben: an den Kreisen ziehen. Ganzen Raum: in der Fläche ziehen oder Pfeiltasten.</p>';
      box.innerHTML = h;
      $('g-r-name').addEventListener('input', function () { r.name = this.value.trim().slice(0, 40) || 'Raum'; box.querySelector('h4').textContent = 'Raum: ' + r.name; speichern(); zeichnen(); auswerten(); });
      $('g-r-art').addEventListener('change', function () { r.art = this.value; geaendert(); auswahlZeigen(); $('g-r-art').focus(); });
      prozentFeld('g-r-t12', function (v) { r.teil12 = v; }, 100);
      prozentFeld('g-r-t0', function (v) { r.teil0 = v; }, 100);
      prozentFeld('g-r-balkon', function (v) { r.balkon = v; }, 50);
      if ($('g-r-separat')) $('g-r-separat').addEventListener('change', function () { r.separat = this.checked; speichern(); auswerten(); });
      $('g-r-weg').addEventListener('click', loeschen);
    } else {
      var t = findeTeil(gewaehlt.id); if (!t) { box.innerHTML = ''; return; }
      var a = ART[t.art];
      box.innerHTML = '<h4>' + esc(a.name) + '</h4>' +
        '<div class="g-mini">' + feld('g-t-b', 'Breite in cm', fmt0.format(t.w * 100), '') + feld('g-t-d', 'Tiefe in cm', fmt0.format(t.d * 100), '') + '</div>' +
        (a.einheit === 'm' ? '<p class="klein" style="margin:6px 0 0">Kosten nach Länge: ' + fmt1.format(t.w) + ' m.</p>' : '') +
        (a.masz ? '<p class="klein" style="margin:6px 0 0">Vorgabemaß ' + esc(a.masz) + '; bitte mit dem echten Möbel vergleichen.</p>' : '') +
        '<div class="knopfreihe"><button type="button" class="knopf zweit" id="g-t-dreh">Drehen (R)</button><button type="button" class="knopf zweit" id="g-t-weg">Löschen (Entf)</button></div>' +
        '<p class="klein" style="margin:8px 0 0">Verschieben: ziehen oder Pfeiltasten (mit Umschalt in größeren Schritten).</p>';
      [['g-t-b', 'w'], ['g-t-d', 'd']].forEach(function (p) {
        $(p[0]).addEventListener('input', function () {
          var v = zahl(this.value), fe = $(p[0] + '-f');
          if (v == null || v < 2 || v > 2000) { fe.textContent = 'Bitte 2 bis 2000 cm eingeben.'; this.setAttribute('aria-invalid', 'true'); return; }
          fe.textContent = ''; this.removeAttribute('aria-invalid');
          t[p[1]] = v / 100; geaendert();
        });
      });
      $('g-t-dreh').addEventListener('click', drehen);
      $('g-t-weg').addEventListener('click', loeschen);
    }
  }
  function prozentFeld(id, setzen, max) {
    var e = $(id); if (!e) return;
    e.addEventListener('input', function () {
      var v = zahl(this.value), f = $(id + '-f');
      if (v == null || v < 0 || v > max) { f.textContent = 'Bitte 0 bis ' + max + ' eingeben.'; this.setAttribute('aria-invalid', 'true'); return; }
      f.textContent = ''; this.removeAttribute('aria-invalid');
      setzen(v); speichern(); auswerten();
      var p = $('g-auswahl').querySelector('p'); var r = findeRaum(gewaehlt.id);
      if (p && r) p.innerHTML = 'Grundfläche <b>' + qm(flaeche(r)) + '</b>, davon Wohnfläche <b>' + qm(R.wohnflaecheRaum(raumDaten(r))) + '</b>.';
    });
  }
  function raumDaten(r) { return { flaeche: flaeche(r), art: r.art, teil12: r.teil12, teil0: r.teil0, balkonProzent: r.balkon }; }

  /* ---------- Auswertung ---------- */
  function preisVon(a) { return plan.preise[a.id] != null ? plan.preise[a.id] : a.start; }
  function summen() {
    var wfl = 0, nfl = 0, sep = 0, betten = 0, mengen = {}, raeumeRows = [], bettRows = [], monteur = false;
    plan.etagen.forEach(function (e) {
      e.raeume.forEach(function (r) {
        var d = raumDaten(r), w = R.wohnflaecheRaum(d), n = R.nutzflaecheRaum(d);
        wfl += w; nfl += n; if (r.separat && n) sep += n;
        raeumeRows.push({ r: r, etage: e.name, f: d.flaeche, w: w, n: n });
      });
      var jeRaum = {};
      e.teile.forEach(function (t) {
        var a = ART[t.art];
        mengen[a.id] = (mengen[a.id] || 0) + (a.einheit === 'm' ? t.w : 1);
        if (a.gruppe === 'monteur') monteur = true;
        if (a.betten) {
          betten += a.betten;
          var r = e.raeume.filter(function (x) { return R.punktImPolygon(t.x, t.y, x.punkte); })[0];
          var k = r ? r.id : '_';
          jeRaum[k] = jeRaum[k] || { name: r ? r.name : 'außerhalb der Räume', etage: e.name, f: r ? flaeche(r) : 0, n: 0 };
          jeRaum[k].n += a.betten;
        }
      });
      Object.keys(jeRaum).forEach(function (k) { bettRows.push(jeRaum[k]); });
    });
    var posten = [];
    KAT.artikel.forEach(function (a) {
      var m;
      if (a.jeBett) m = monteur ? betten * a.jeBett : 0;
      else if (a.zeichnen === false) m = plan.mengen[a.id] || 0;
      else m = mengen[a.id] || 0;
      if (m > 0 || a.zeichnen === false && !a.jeBett) posten.push({ a: a, menge: m, preis: preisVon(a), gruppe: a.gruppe });
    });
    var k = R.einrichtungskosten(posten.map(function (p) { return { menge: p.menge, preis: p.preis || 0, gruppe: p.gruppe }; }));
    var ohneMassstab = plan.etagen.filter(function (e) { return e.bild && !e.massstab && e.raeume.length; }).map(function (e) { return e.name; });
    var ohnePreis = posten.filter(function (p) { return p.menge > 0 && p.preis == null; }).length;
    return { wfl: wfl, nfl: nfl, sep: sep, betten: betten, einrichtung: k.einrichtung, umbau: k.umbau, summe: k.summe, posten: posten, raeume: raeumeRows, bettRows: bettRows, ohneMassstab: ohneMassstab, ohnePreis: ohnePreis };
  }
  function auswerten() {
    var s = summen(), nRaeume = s.raeume.length;
    $('g-wfl').textContent = nRaeume ? qm(s.wfl) : '-';
    $('g-nfl').textContent = nRaeume ? qm(s.nfl) : '-';
    $('g-einr').textContent = s.einrichtung ? euro(s.einrichtung) : '-';
    $('g-umb').textContent = s.umbau ? euro(s.umbau) : '-';
    var box = $('g-satz'), titel, klein, art = 'leer', zeichen = '?';
    if (!nRaeume) {
      titel = 'Noch kein Raum gezeichnet.';
      klein = 'Fang mit Schritt 1 an: Grundrissbild laden oder das Beispielhaus ausprobieren, oder gleich in Schritt 2 auf dem Raster zeichnen.';
    } else {
      titel = qm(s.wfl) + ' Wohnfläche' + (s.summe ? ', Einrichtung und Umbau etwa ' + euro(s.summe) : '') + '.';
      klein = (s.nfl ? 'Dazu ' + qm(s.nfl) + ' Nutzfläche' + (s.sep ? ', davon ' + qm(s.sep) + ' separat vermietbar' : '') + '. ' : '') +
        (s.betten ? s.betten + ' Schlafplätze. ' : '') + 'Preise sind Richtwerte, keine Angebote.';
      if (plan.beispiel) klein = 'Beispielhaus mit erfundenen Maßen. ' + klein;
      zeichen = '✓'; art = 'gut';
      if (s.ohneMassstab.length) {
        art = 'warn'; zeichen = '!';
        klein = 'Achtung: Für ' + s.ohneMassstab.join(', ') + ' ist noch kein Maßstab festgelegt, die Flächen stimmen erst danach. ' + klein;
      }
    }
    box.className = 'satz ' + art;
    box.querySelector('.lampe').textContent = zeichen;
    $('g-satz-text').textContent = titel;
    $('g-satz-klein').textContent = klein;

    /* Räume */
    var tb = $('g-raeume').querySelector('tbody');
    tb.innerHTML = s.raeume.length ? s.raeume.map(function (x) {
      var artName = ARTEN.filter(function (a) { return a[0] === x.r.art; })[0][1];
      return '<tr><td data-titel="Raum">' + esc(x.r.name) + (x.r.separat && x.n ? ' <span class="klein">(separat vermietbar)</span>' : '') + '</td><td data-titel="Etage">' + esc(x.etage) + '</td><td data-titel="Art">' + esc(artName) + '</td>' +
        '<td class="z" data-titel="Grundfläche">' + qm(x.f) + '</td><td class="z" data-titel="Wohnfläche">' + qm(x.w) + '</td><td class="z" data-titel="Nutzfläche">' + (x.n ? qm(x.n) : '-') + '</td></tr>';
    }).join('') + '<tr><th scope="row" colspan="3">Summe</th><td class="z" data-titel="Grundfläche"><b>' + qm(s.raeume.reduce(function (a, x) { return a + x.f; }, 0)) + '</b></td><td class="z" data-titel="Wohnfläche"><b>' + qm(s.wfl) + '</b></td><td class="z" data-titel="Nutzfläche"><b>' + qm(s.nfl) + '</b></td></tr>'
      : '<tr><td colspan="6">Noch keine Räume.</td></tr>';

    /* Kosten */
    var kb = $('g-kosten').querySelector('tbody');
    var aktiv = document.activeElement && kb.contains(document.activeElement) ? document.activeElement.id : null;
    if (!aktiv) {
      kb.innerHTML = s.posten.length ? s.posten.map(function (p) {
        var a = p.a, mengeZelle;
        if (a.zeichnen === false && !a.jeBett) mengeZelle = '<input type="text" inputmode="decimal" id="g-m-' + a.id + '" value="' + (p.menge ? fmt0.format(p.menge) : '') + '" placeholder="0" aria-label="Menge ' + esc(a.name) + '">';
        else mengeZelle = a.einheit === 'm' ? fmt1.format(p.menge) + ' m' : fmt0.format(p.menge);
        var spanne = a.von != null ? euro(a.von) + ' bis ' + euro(a.bis) + (a.einheit === 'm' ? ' je m' : '') : 'keine geprüfte Spanne';
        return '<tr><td data-titel="Teil">' + esc(a.name) + (a.jeBett ? ' <span class="klein">(je Schlafplatz)</span>' : '') + '</td><td class="z" data-titel="Menge">' + mengeZelle + '</td>' +
          '<td data-titel="€ je ' + (a.einheit === 'm' ? 'm' : 'Stück') + '"><input type="text" inputmode="decimal" id="g-p-' + a.id + '" value="' + (p.preis != null ? fmt0.format(p.preis) : '') + '" placeholder="Preis eintragen" aria-label="Preis je ' + (a.einheit === 'm' ? 'Meter' : 'Stück') + ' ' + esc(a.name) + '"></td>' +
          '<td class="z" data-titel="Summe" id="g-s-' + a.id + '">' + (p.preis != null ? euro(p.menge * p.preis) : '-') + '</td>' +
          '<td data-titel="Spanne und Quelle" class="klein">' + esc(spanne) + (a.quelle ? '<br>' + esc(a.quelle) : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="5">Noch keine Möbel oder Umbau-Teile im Plan.</td></tr>';
    } else {
      s.posten.forEach(function (p) { var z = $('g-s-' + p.a.id); if (z) z.textContent = p.preis != null ? euro(p.menge * p.preis) : '-'; });
    }
    $('g-kosten-ergebnis').innerHTML =
      '<div class="wert"><dt>Einrichtung</dt><dd>' + euro(s.einrichtung) + '</dd></div>' +
      '<div class="wert"><dt>Umbau</dt><dd>' + euro(s.umbau) + '</dd></div>' +
      '<div class="wert haupt"><dt>Zusammen</dt><dd>' + euro(s.summe) + '</dd></div>';
    $('g-preis-hinweis').textContent = 'Preise sind Richtwerte' + (KAT.abruf ? ' (Abruf ' + KAT.abruf + ')' : '') + ', keine Angebote: bitte eigene Preise eintragen.' + (s.ohnePreis ? ' ' + s.ohnePreis + ' Teile haben noch keinen Preis und zählen mit 0 €.' : '');

    /* Schlafplätze */
    $('g-betten-block').hidden = !s.betten;
    $('g-betten').querySelector('tbody').innerHTML = s.bettRows.map(function (b) {
      return '<tr><td data-titel="Zimmer">' + esc(b.name) + ' <span class="klein">(' + esc(b.etage) + ')</span></td><td class="z" data-titel="Schlafplätze">' + b.n + '</td><td class="z" data-titel="m² je Schlafplatz">' + (b.f ? fmt1.format(b.f / b.n) : '-') + '</td></tr>';
    }).join('');
    if (ansicht3d) dreiD();
  }
  $('g-kosten').addEventListener('input', function (ev) {
    var id = ev.target.id, v = ev.target.value.trim(), n = v === '' ? null : zahl(v);
    if (v !== '' && (n == null || n < 0)) { ev.target.setAttribute('aria-invalid', 'true'); return; }
    ev.target.removeAttribute('aria-invalid');
    if (id.indexOf('g-p-') === 0) { var a = id.slice(4); if (n == null) delete plan.preise[a]; else plan.preise[a] = n; }
    else if (id.indexOf('g-m-') === 0) { plan.mengen[id.slice(4)] = n || 0; }
    speichern(); auswerten();
  });
  $('g-kosten').addEventListener('focusout', function () { setTimeout(function () { if (!$('g-kosten').contains(document.activeElement)) auswerten(); }, 0); });

  /* ---------- In den Rechner übernehmen ---------- */
  var fmtFlaeche = function (x) { return fmt1.format(x); };
  function setzeFeld(id, wert) {
    var e = $(id); if (!e) return;
    e.value = wert;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function uebernehmen(art) {
    var s = summen(), alt = R.leseZahl($('r-zusatz').value) || 0;
    var kosten = art === 'dazu' ? alt + s.summe : s.summe;
    if (s.raeume.length) setzeFeld('r-flaeche', fmtFlaeche(s.wfl));
    setzeFeld('r-zusatz', fmt0.format(Math.round(kosten)));
    $('g-frage').hidden = true;
    $('g-uebernahme-meldung').innerHTML = 'Übernommen: ' + (s.raeume.length ? 'Wohnfläche ' + esc(qm(s.wfl)) + ', ' : '') + 'zusätzliche Kosten ' + esc(euro(kosten)) + '. <a href="#rechner" data-ziel="rechner">Zum Rechner</a>';
  }
  $('g-uebernehmen').addEventListener('click', function () {
    var s = summen();
    if (!s.raeume.length && !s.summe) { $('g-uebernahme-meldung').textContent = 'Es gibt noch nichts zu übernehmen: zeichne zuerst Räume oder stelle Möbel in den Plan.'; return; }
    var alt = R.leseZahl($('r-zusatz').value) || 0, altF = R.leseZahl($('r-flaeche').value) || 0;
    if (alt > 0 || (altF > 0 && s.raeume.length && Math.abs(altF - s.wfl) > 0.05)) {
      $('g-frage-text').textContent = 'Im Rechner steht schon etwas: ' + (altF ? 'Wohnfläche ' + qm(altF) + ', ' : '') + 'zusätzliche Kosten ' + euro(alt) + '. ' +
        'Neu aus dem Grundriss: ' + (s.raeume.length ? 'Wohnfläche ' + qm(s.wfl) + ', ' : '') + 'Einrichtung und Umbau ' + euro(s.summe) + '. Die Wohnfläche wird in beiden Fällen ersetzt.';
      $('g-frage').hidden = false; $('g-frage-ersetzen').focus();
      return;
    }
    uebernehmen('ersetzen');
  });
  $('g-frage-ersetzen').addEventListener('click', function () { uebernehmen('ersetzen'); });
  $('g-frage-dazu').addEventListener('click', function () { uebernehmen('dazu'); });
  $('g-frage-nein').addEventListener('click', function () { $('g-frage').hidden = true; $('g-uebernahme-meldung').textContent = 'Nichts übernommen.'; });

  /* ---------- Datei sichern, laden, neu ---------- */
  function heute() { var d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }
  function dateiSichern(zusatz) {
    try {
      var daten = JSON.parse(JSON.stringify(plan)); daten.exportiert = new Date().toISOString();
      var blob = new Blob([JSON.stringify(daten)], { type: 'application/json' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'grundriss_' + heute() + (zusatz || '') + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) {
      $('g-datei-meldung').textContent = 'Die Datei konnte nicht erzeugt werden: ' + (e && e.message ? e.message : 'unbekannter Fehler') + '.';
      return false;
    }
  }
  function leer() { return plan.etagen.every(function (e) { return !e.raeume.length && !e.teile.length && !e.bild; }); }
  $('g-sichern').addEventListener('click', function () {
    if (dateiSichern('')) $('g-datei-meldung').textContent = 'Datei „grundriss_' + heute() + '.json“ wird heruntergeladen. Erscheint nichts, erlaubt diese Ansicht keine Downloads; dann die Seite direkt im Browser öffnen.';
  });
  $('g-laden-datei').addEventListener('change', function () {
    var datei = this.files && this.files[0]; this.value = '';
    if (!datei) return;
    var rd = new FileReader();
    rd.onload = function () {
      var neu = null;
      try { neu = pruefePlan(JSON.parse(rd.result)); } catch (e) { neu = null; }
      if (!neu) { $('g-datei-meldung').textContent = 'Nicht geladen: „' + datei.name + '“ ist keine Grundriss-Datei dieser Seite.'; return; }
      var gesichert = !leer() && dateiSichern('_vorher');
      plan = neu; gewaehlt = null; vb = null; speichern(); allesZeigen();
      $('g-datei-meldung').textContent = 'Geladen: ' + neu.etagen.length + ' Etagen.' + (gesichert ? ' Der bisherige Plan wurde vorher als „grundriss_' + heute() + '_vorher.json“ gesichert.' : '');
    };
    rd.onerror = function () { $('g-datei-meldung').textContent = 'Die Datei konnte nicht gelesen werden.'; };
    rd.readAsText(datei);
  });
  $('g-neu').addEventListener('click', function () {
    if (leer()) return;
    $('g-neu-frage').hidden = false; $('g-neu-sichern').focus();
  });
  function neuBeginnen() { plan = leererPlan(); gewaehlt = null; vb = null; $('g-neu-frage').hidden = true; speichern(); allesZeigen(); schrittZeigen(1); }
  $('g-neu-sichern').addEventListener('click', function () { if (dateiSichern('_alt')) { neuBeginnen(); $('g-datei-meldung').textContent = 'Alter Plan als Datei gesichert, neuer Plan begonnen.'; } });
  $('g-neu-ohne').addEventListener('click', function () { neuBeginnen(); $('g-datei-meldung').textContent = 'Neuer Plan begonnen.'; });
  $('g-neu-nein').addEventListener('click', function () { $('g-neu-frage').hidden = true; });

  /* ---------- Beispielhaus (daten/beispielhaus.js) ---------- */
  function beispielLaden() {
    var vorlage = window.DATEN && window.DATEN.beispielhaus;
    if (!vorlage) { meldung('Das Beispielhaus fehlt in dieser Fassung der Seite.'); return; }
    var p = JSON.parse(JSON.stringify(vorlage));
    p.etagen.forEach(function (e) {
      e.raeume.forEach(function (r) { r.id = neueId('r'); });
      e.teile.forEach(function (t) { var a = ART[t.art]; t.id = neueId('t'); if (a) { t.w = a.breite / 100; t.d = a.tiefe / 100; } });
    });
    var neu = pruefePlan(p);
    if (!neu) { meldung('Das Beispielhaus konnte nicht geladen werden.'); return; }
    plan = neu; gewaehlt = null; vb = null; $('g-beispiel-frage').hidden = true;
    speichern(); allesZeigen();
    meldung('Beispielhaus geladen: oben bei „Etage“ zwischen Erdgeschoss, Dachgeschoss und Keller wechseln, mit „3D“ ansehen. Alle Maße sind erfunden.');
  }
  $('g-beispiel').addEventListener('click', function () {
    if (leer()) { beispielLaden(); return; }
    $('g-beispiel-frage').hidden = false; $('g-beispiel-sichern').focus();
  });
  $('g-beispiel-sichern').addEventListener('click', function () { if (dateiSichern('_vor_beispiel')) beispielLaden(); });
  $('g-beispiel-ohne').addEventListener('click', beispielLaden);
  $('g-beispiel-nein').addEventListener('click', function () { $('g-beispiel-frage').hidden = true; $('g-beispiel').focus(); });

  /* ---------- Ansicht von oben / 3D ---------- */
  function dreiD() {
    if (!window.GRUNDRISS3D) return;
    window.GRUNDRISS3D.zeige(plan, ART);
  }
  function ansichtSetzen(drei) {
    ansicht3d = drei && !!window.GRUNDRISS3D;
    $('g-ansicht-plan').setAttribute('aria-pressed', ansicht3d ? 'false' : 'true');
    $('g-ansicht-3d').setAttribute('aria-pressed', ansicht3d ? 'true' : 'false');
    svg.style.visibility = ansicht3d ? 'hidden' : '';
    $('g-szene').hidden = !ansicht3d;
    $('g-zoom').hidden = ansicht3d;
    $('g-tipp').textContent = ansicht3d ? '' : $('g-tipp').textContent;
    if (ansicht3d) dreiD(); else zeichnen();
  }
  $('g-ansicht-plan').addEventListener('click', function () { ansichtSetzen(false); });
  $('g-ansicht-3d').addEventListener('click', function () { ansichtSetzen(true); });
  $('g-zoom-ein').addEventListener('click', function () { zoomen(1 / 1.3); });
  $('g-zoom-aus').addEventListener('click', function () { zoomen(1.3); });
  $('g-zoom-passt').addEventListener('click', function () { einpassen(); zeichnen(); });

  if ('ResizeObserver' in window) new ResizeObserver(function () { if (sichtbar && !ansicht3d) { seitenverhaeltnis(); zeichnen(); } }).observe($('g-buehne'));
  window.addEventListener('themagewechselt', function () { if (ansicht3d) dreiD(); });

  function allesZeigen() { etagenZeigen(); zeichnen(); auswahlZeigen(); auswerten(); }

  katalogZeigen();
  auswerten();

  window.GRUNDRISS = {
    /* von app.js beim Reiterwechsel gerufen: Größe ist erst messbar, wenn der Bereich sichtbar ist */
    zeigt: function (an) {
      sichtbar = !!an;
      if (!sichtbar) return;
      if (!vb) einpassen(); else seitenverhaeltnis();
      allesZeigen(); tipp();
    },
    summen: summen,
    plan: function () { return plan; },
    /* für Prüfskripte: Plan setzen, geprüft wie beim Datei-Import */
    setzePlan: function (p) { var n = pruefePlan(p); if (!n) return false; plan = n; gewaehlt = null; vb = null; speichern(); allesZeigen(); return true; }
  };
})();
