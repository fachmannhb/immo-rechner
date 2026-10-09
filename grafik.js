/* SVG-Diagramme der Werkzeugseite. Farben kommen aus den CSS-Variablen, damit hell und dunkel stimmen.
   Jede Zeichenfunktion misst die Breite ihres Containers neu, Text bleibt so auch am Handy lesbar. */
(function () {
  'use strict';
  var NB = ' ';
  var fmt0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  function euro(n) { return isFinite(n) ? fmt0.format(n) + NB + '€' : '-'; }
  function kurz(n) {
    var a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + NB + 'Mio.';
    if (a >= 1e3) return fmt0.format(n / 1e3) + NB + 'Tsd.';
    return fmt0.format(n);
  }
  function v(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function breite(el) { return Math.max(280, Math.round(el.clientWidth || 600)); }
  function svg(w, h, inhalt, titel) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(titel) + '">' + inhalt + '</svg>';
  }
  /* „schöne“ Achsenschritte */
  function schritte(max, anzahl) {
    if (max <= 0) return [0];
    var roh = max / anzahl, p = Math.pow(10, Math.floor(Math.log10(roh)));
    var s = [1, 2, 2.5, 5, 10].map(function (f) { return f * p; }).filter(function (x) { return x >= roh; })[0];
    var out = [];
    for (var x = 0; x <= max + s * 0.001; x += s) out.push(x);
    return out;
  }

  /* ---------- Hover-Hinweis ---------- */
  var tip = null;
  function zeigeTip(ev, html) {
    tip = tip || document.getElementById('tip');
    if (!tip) return;
    tip.innerHTML = html;
    tip.hidden = false;
    var x = ev.clientX + 14, y = ev.clientY + 14;
    var r = tip.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }
  function versteckeTip() { if (tip) tip.hidden = true; }
  document.addEventListener('mousemove', function (ev) {
    var m = ev.target.closest && ev.target.closest('.diagramm [data-tip]');
    if (m) zeigeTip(ev, m.getAttribute('data-tip'));
    else if (!(ev.target.closest && ev.target.closest('.diagramm .fang'))) versteckeTip();
  });
  document.addEventListener('scroll', versteckeTip, { passive: true });

  /* ---------- 1. Mittelverwendung gegen Finanzierung ---------- */
  function mittel(el, d) {
    var w = breite(el), links = 92, rechts = 16, h = 150;
    var max = Math.max(d.gesamt, d.ek + d.darlehen, d.kaufpreis) || 1;
    var sx = function (x) { return links + x / max * (w - links - rechts); };
    var c1 = v('--c1'), c2 = v('--c2'), c3 = v('--c3'), neutral = v('--leise'), grund = v('--karte');
    function balken(y, teile, name) {
      var x0 = 0, s = '<text x="0" y="' + (y + 22) + '">' + name + '</text>';
      teile.forEach(function (t) {
        if (t.wert <= 0) return;
        var x = sx(x0), bw = Math.max(1, sx(x0 + t.wert) - x - 2);
        s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="34" rx="4" fill="' + t.farbe + '" fill-opacity="' + (t.deckung || 1) + '" data-tip="<b>' + esc(t.name) + '</b><br>' + euro(t.wert) + ' (' + fmt0.format(t.wert / d.kaufpreis * 100) + NB + '% vom Kaufpreis)"/>';
        if (bw > t.kurz.length * 7.4 + 14) s += '<text class="wertlabel" x="' + (x + 8) + '" y="' + (y + 22) + '" style="fill:' + grund + '">' + esc(t.kurz) + '</text>';
        x0 += t.wert;
      });
      return s;
    }
    var inhalt = balken(10, [
      { name: 'Kaufpreis', kurz: 'Kaufpreis ' + kurz(d.kaufpreis), wert: d.kaufpreis, farbe: c1 },
      { name: 'Kaufnebenkosten', kurz: 'Nebenkosten', wert: d.nebenkosten, farbe: c2 },
      { name: 'Renovierung und Sonstiges', kurz: 'Renovierung', wert: d.zusatz, farbe: c2, deckung: .55 }
    ], 'Wofür') + balken(64, [
      { name: 'Eigenkapital', kurz: 'Eigenkapital', wert: d.ek, farbe: c3 },
      { name: 'Darlehen', kurz: 'Darlehen ' + kurz(d.darlehen), wert: d.darlehen, farbe: neutral, deckung: .55 }
    ], 'Woher');
    var xk = sx(d.kaufpreis);
    inhalt += '<line x1="' + xk + '" x2="' + xk + '" y1="4" y2="108" stroke="' + v('--text') + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
      '<text x="' + Math.min(xk, w - 120) + '" y="128" text-anchor="' + (xk > w - 120 ? 'start' : 'middle') + '">100' + NB + '% Kaufpreis</text>';
    el.innerHTML = svg(w, h, inhalt, 'Mittelverwendung und Finanzierung');
  }

  /* ---------- 2. Restschuld der Angebote ---------- */
  function restschuld(el, legEl, serien) {
    var w = breite(el), h = 240, l = 58, r = 40, o = 12, u = 30;
    serien = serien.filter(function (s) { return s && s.punkte.length; });
    if (!serien.length) { el.innerHTML = '<p class="klein">Mindestens ein Angebot vollständig ausfüllen.</p>'; legEl.innerHTML = ''; return; }
    var maxJ = Math.min(40, Math.max.apply(null, serien.map(function (s) { return s.punkte[s.punkte.length - 1].j; })));
    var maxY = Math.max.apply(null, serien.map(function (s) { return s.punkte[0].y; })) || 1;
    var sx = function (j) { return l + j / maxJ * (w - l - r); };
    var sy = function (y) { return o + (1 - y / maxY) * (h - o - u); };
    var s = '';
    schritte(maxY, 4).forEach(function (y) {
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(y) + '" y2="' + sy(y) + '"/><text x="' + (l - 8) + '" y="' + (sy(y) + 4) + '" text-anchor="end">' + kurz(y) + '</text>';
    });
    schritte(maxJ, 6).forEach(function (j) {
      s += '<text x="' + sx(j) + '" y="' + (h - 8) + '" text-anchor="middle">' + j + '</text>';
    });
    s += '<line class="achse" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    s += '<text x="' + (w - r) + '" y="' + (h - 8) + '" text-anchor="start" dx="6">Jahre</text>';
    var labels = [];
    serien.forEach(function (se, nr) {
      var pts = se.punkte.filter(function (p) { return p.j <= maxJ; });
      var pfad = pts.map(function (p, i) { return (i ? 'L' : 'M') + sx(p.j).toFixed(1) + ' ' + sy(p.y).toFixed(1); }).join(' ');
      if (se.bindung > 0 && se.bindung <= maxJ) {
        s += '<line x1="' + sx(se.bindung) + '" x2="' + sx(se.bindung) + '" y1="' + o + '" y2="' + sy(0) + '" stroke="' + se.farbe + '" stroke-width="1" stroke-dasharray="3 4" opacity=".8"/>';
      }
      s += '<path d="' + pfad + '" fill="none" stroke="' + se.farbe + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      var b = pts.filter(function (p) { return p.j === se.bindung; })[0];
      if (b) {
        s += '<circle cx="' + sx(b.j) + '" cy="' + sy(b.y) + '" r="4.5" fill="' + se.farbe + '" stroke="' + v('--karte') + '" stroke-width="2"/>';
        labels.push({ x: sx(b.j), y: sy(b.y), text: se.name.replace('Angebot ', '') + ' ' + kurz(b.y) });
      }
    });
    /* Beschriftung am Ende der Zinsbindung, rechts neben dem Punkt, gegen Überlappung verschoben */
    labels.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 15) labels[i].y = labels[i - 1].y + 15;
    labels.forEach(function (lb) { s += '<text class="wertlabel" x="' + (lb.x + 9) + '" y="' + (lb.y - 7) + '">' + esc(lb.text) + '</text>'; });
    /* Fangfläche für Fadenkreuz */
    s += '<line id="rest-kreuz" x1="0" x2="0" y1="' + o + '" y2="' + sy(0) + '" stroke="' + v('--leise') + '" stroke-width="1" visibility="hidden"/>';
    s += '<rect class="fang" x="' + l + '" y="' + o + '" width="' + (w - l - r) + '" height="' + (sy(0) - o) + '" fill="transparent"/>';
    el.innerHTML = svg(w, h, s, 'Restschuld je Angebot über die Jahre');
    var fang = el.querySelector('.fang'), kreuz = el.querySelector('#rest-kreuz');
    fang.addEventListener('mousemove', function (ev) {
      var box = el.querySelector('svg').getBoundingClientRect();
      var x = (ev.clientX - box.left) * (w / box.width);
      var j = Math.max(0, Math.min(maxJ, Math.round((x - l) / (w - l - r) * maxJ)));
      kreuz.setAttribute('x1', sx(j)); kreuz.setAttribute('x2', sx(j)); kreuz.setAttribute('visibility', 'visible');
      var html = '<b>Jahr ' + j + '</b>';
      serien.forEach(function (se) {
        var p = se.punkte.filter(function (q) { return q.j === j; })[0];
        html += '<br><span style="color:' + se.farbe + '">■</span> ' + esc(se.name) + ': ' + (p ? euro(p.y) : 'getilgt');
      });
      zeigeTip(ev, html);
    });
    fang.addEventListener('mouseleave', function () { kreuz.setAttribute('visibility', 'hidden'); versteckeTip(); });
    legEl.innerHTML = serien.map(function (se) {
      return '<span><i class="linie" style="background:' + se.farbe + '"></i>' + esc(se.name) + ' (Zinsbindung ' + se.bindung + NB + 'J.)</span>';
    }).join('');
  }

  /* ---------- 2b. Vermögen über die Jahre: Hauswert, Restschuld, Vermögen im Haus ---------- */
  function vermoegen(el, legEl, jahre) {
    var w = breite(el), h = 260, l = 64, r = 16, o = 12, u = 30;
    if (!jahre || !jahre.length) { el.innerHTML = '<p class="klein">Schritte 1 bis 3 und Angebot A vollständig ausfüllen.</p>'; legEl.innerHTML = ''; return; }
    var punkte = [{ jahr: 0, wert: jahre[0].wert / (jahre[1] ? jahre[1].wert / jahre[0].wert : 1), rest: jahre[0].rest + jahre[0].tilgung }].concat(jahre);
    punkte[0].vermoegen = punkte[0].wert - punkte[0].rest;
    var maxJ = jahre.length;
    var maxY = Math.max.apply(null, punkte.map(function (p) { return Math.max(p.wert, p.rest, p.vermoegen); })) || 1;
    var minY = Math.min(0, Math.min.apply(null, punkte.map(function (p) { return p.vermoegen; })));
    var sx = function (j) { return l + j / maxJ * (w - l - r); };
    var sy = function (y) { return o + (1 - (y - minY) / (maxY - minY)) * (h - o - u); };
    var c1 = v('--c1'), c2 = v('--c2'), leise = v('--leise');
    var s = '';
    schritte(maxY - minY, 4).forEach(function (y0) {
      var y = y0 + minY;
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(y) + '" y2="' + sy(y) + '"/><text x="' + (l - 8) + '" y="' + (sy(y) + 4) + '" text-anchor="end">' + kurz(y) + '</text>';
    });
    schritte(maxJ, 6).forEach(function (j) { s += '<text x="' + sx(j) + '" y="' + (h - 8) + '" text-anchor="middle">' + j + '</text>'; });
    s += '<line class="achse" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    function pfad(feld) { return punkte.map(function (p, i) { return (i ? 'L' : 'M') + sx(p.jahr).toFixed(1) + ' ' + sy(p[feld]).toFixed(1); }).join(' '); }
    s += '<path d="' + pfad('vermoegen') + ' L' + sx(maxJ).toFixed(1) + ' ' + sy(0).toFixed(1) + ' L' + sx(0).toFixed(1) + ' ' + sy(0).toFixed(1) + 'Z" fill="' + c1 + '" fill-opacity=".18" stroke="none"/>';
    s += '<path d="' + pfad('wert') + '" fill="none" stroke="' + c2 + '" stroke-width="2"/>';
    s += '<path d="' + pfad('rest') + '" fill="none" stroke="' + leise + '" stroke-width="2" stroke-dasharray="6 4"/>';
    s += '<path d="' + pfad('vermoegen') + '" fill="none" stroke="' + c1 + '" stroke-width="2.5"/>';
    var e = punkte[punkte.length - 1];
    s += '<circle cx="' + sx(e.jahr) + '" cy="' + sy(e.vermoegen) + '" r="4.5" fill="' + c1 + '" stroke="' + v('--karte') + '" stroke-width="2"/>';
    s += '<text class="wertlabel" x="' + (sx(e.jahr) - 8) + '" y="' + (sy(e.vermoegen) - 9) + '" text-anchor="end">' + kurz(e.vermoegen) + '</text>';
    s += '<line id="verm-kreuz" x1="0" x2="0" y1="' + o + '" y2="' + (h - u) + '" stroke="' + leise + '" stroke-width="1" visibility="hidden"/>';
    s += '<rect class="fang" x="' + l + '" y="' + o + '" width="' + (w - l - r) + '" height="' + (h - o - u) + '" fill="transparent"/>';
    el.innerHTML = svg(w, h, s, 'Hauswert, Restschuld und Vermögen im Haus über die Jahre');
    var fang = el.querySelector('.fang'), kreuz = el.querySelector('#verm-kreuz');
    fang.addEventListener('mousemove', function (ev) {
      var box = el.querySelector('svg').getBoundingClientRect();
      var x = (ev.clientX - box.left) * (w / box.width);
      var j = Math.max(1, Math.min(maxJ, Math.round((x - l) / (w - l - r) * maxJ)));
      var p = jahre[j - 1];
      kreuz.setAttribute('x1', sx(j)); kreuz.setAttribute('x2', sx(j)); kreuz.setAttribute('visibility', 'visible');
      zeigeTip(ev, '<b>Jahr ' + j + '</b><br><span style="color:' + c2 + '">■</span> Hauswert: ' + euro(p.wert) +
        '<br><span style="color:' + leise + '">■</span> Restschuld: ' + euro(p.rest) + '<br><span style="color:' + c1 + '">■</span> Vermögen im Haus: ' + euro(p.vermoegen) +
        '<br>Bleibt im Jahr nach Steuern: ' + euro(p.nachSteuer));
    });
    fang.addEventListener('mouseleave', function () { kreuz.setAttribute('visibility', 'hidden'); versteckeTip(); });
    legEl.innerHTML = '<span><i class="linie" style="background:' + c2 + '"></i>Hauswert</span><span><i class="linie" style="background:' + leise + '"></i>Restschuld (gestrichelt)</span><span><i class="linie" style="background:' + c1 + '"></i>Vermögen im Haus = Hauswert − Restschuld</span>';
  }

  /* ---------- 3. Zinsen und Tilgung je Jahr ---------- */
  function tilgung(el, legEl, plan, bindung) {
    var w = breite(el), h = 252, l = 58, r = 16, o = 26, u = 30;
    if (!plan || !plan.length) { el.innerHTML = '<p class="klein">Keine Tilgung: Die Rate deckt nur die Zinsen.</p>'; legEl.innerHTML = ''; return; }
    var jahre = plan.slice(0, 40);
    var maxY = Math.max.apply(null, jahre.map(function (p) { return p.zinsen + p.tilgung; })) || 1;
    var n = jahre.length, slot = (w - l - r) / n, bw = Math.max(2, slot - 2);
    var sy = function (y) { return o + (1 - y / maxY) * (h - o - u); };
    var c1 = v('--c1'), c2 = v('--c2'), s = '';
    schritte(maxY, 4).forEach(function (y) {
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(y) + '" y2="' + sy(y) + '"/><text x="' + (l - 8) + '" y="' + (sy(y) + 4) + '" text-anchor="end">' + kurz(y) + '</text>';
    });
    var jedes = n > 24 ? 5 : n > 12 ? 2 : 1;
    jahre.forEach(function (p, i) {
      var x = l + i * slot + 1;
      var tip = '<b>Jahr ' + p.jahr + '</b><br>Zinsen: ' + euro(p.zinsen) + '<br>Tilgung: ' + euro(p.tilgung) + '<br>Restschuld: ' + euro(p.rest);
      var yz = sy(p.zinsen), yt = sy(p.zinsen + p.tilgung);
      s += '<rect x="' + x + '" y="' + yz + '" width="' + bw + '" height="' + Math.max(0, sy(0) - yz) + '" fill="' + c2 + '" data-tip="' + esc(tip) + '"/>';
      s += '<rect x="' + x + '" y="' + yt + '" width="' + bw + '" height="' + Math.max(0, yz - yt - (bw > 6 ? 2 : 1)) + '" fill="' + c1 + '" data-tip="' + esc(tip) + '"/>';
      if (p.jahr % jedes === 0 || p.jahr === 1) s += '<text x="' + (x + bw / 2) + '" y="' + (h - 8) + '" text-anchor="middle">' + p.jahr + '</text>';
    });
    s += '<line class="achse" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    if (bindung > 0 && bindung < n) {
      var xb = l + bindung * slot;
      s += '<line x1="' + xb + '" x2="' + xb + '" y1="' + (o - 8) + '" y2="' + sy(0) + '" stroke="' + v('--text') + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
        '<text x="' + xb + '" y="' + (o - 13) + '" text-anchor="middle">Ende Zinsbindung</text>';
    }
    el.innerHTML = svg(w, h, s, 'Zinsen und Tilgung je Jahr');
    legEl.innerHTML = '<span><i style="background:' + c1 + '"></i>Tilgung</span><span><i style="background:' + c2 + '"></i>Zinsen</span>';
  }

  /* ---------- 4. Vom Mieteingang zum Cashflow ---------- */
  function wasserfall(el, schritteListe) {
    var w = breite(el), h = 250, l = 58, r = 12, o = 22, u = 42;
    var stand = 0, punkte = [];
    schritteListe.forEach(function (st) {
      if (st.summe) { punkte.push({ name: st.name, von: 0, bis: st.wert, summe: true }); stand = st.wert; }
      else { punkte.push({ name: st.name, von: stand, bis: stand + st.wert }); stand += st.wert; }
    });
    var werte = [0];
    punkte.forEach(function (p) { werte.push(p.von, p.bis); });
    var maxY = Math.max.apply(null, werte), minY = Math.min.apply(null, werte);
    var spanne = (maxY - minY) || 1;
    var sy = function (y) { return o + (maxY - y) / spanne * (h - o - u); };
    var n = punkte.length, slot = (w - l - r) / n, bw = Math.min(64, slot * 0.62);
    var c1 = v('--c1'), neutral = v('--leise'), gut = v('--gut'), schlecht = v('--schlecht'), s = '';
    var tick = schritte(spanne, 4);
    var tSchritt = tick.length > 1 ? tick[1] : spanne;
    var tWerte = [];
    for (var tw = Math.ceil(minY / tSchritt) * tSchritt; tw <= maxY + 1e-6; tw += tSchritt) tWerte.push(tw + 0); /* + 0 macht aus -0 eine 0 */
    tWerte.forEach(function (yy) {
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(yy) + '" y2="' + sy(yy) + '"/><text x="' + (l - 8) + '" y="' + (sy(yy) + 4) + '" text-anchor="end">' + kurz(yy) + '</text>';
    });
    s += '<line class="achse" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    punkte.forEach(function (p, i) {
      var x = l + i * slot + (slot - bw) / 2;
      var y1 = sy(Math.max(p.von, p.bis)), y2 = sy(Math.min(p.von, p.bis));
      var betrag = p.summe ? p.bis : p.bis - p.von;
      var farbe = p.summe ? (i === 0 ? c1 : (betrag < 0 ? schlecht : gut)) : neutral;
      var deck = p.summe ? 1 : .5;
      s += '<rect x="' + x + '" y="' + y1 + '" width="' + bw + '" height="' + Math.max(2, y2 - y1) + '" rx="4" fill="' + farbe + '" fill-opacity="' + deck + '" data-tip="<b>' + esc(p.name) + '</b><br>' + euro(betrag) + ' pro Monat"/>';
      if (i < n - 1) {
        var xn = l + (i + 1) * slot + (slot - bw) / 2, ya = sy(p.bis);
        s += '<line x1="' + (x + bw) + '" x2="' + xn + '" y1="' + ya + '" y2="' + ya + '" stroke="' + v('--linie2') + '" stroke-dasharray="2 3"/>';
      }
      var ly = y1 - 6;
      s += '<text class="wertlabel" x="' + (x + bw / 2) + '" y="' + ly + '" text-anchor="middle">' + (betrag > 0 && !p.summe ? '+' : '') + (Math.abs(betrag) < 100000 ? euro(betrag) : kurz(betrag)) + '</text>';
      var worte = p.name.split(' ');
      var zeile1 = worte.slice(0, Math.ceil(worte.length / 2)).join(' '), zeile2 = worte.slice(Math.ceil(worte.length / 2)).join(' ');
      s += '<text x="' + (x + bw / 2) + '" y="' + (h - 22) + '" text-anchor="middle">' + esc(zeile1) + '</text>';
      if (zeile2) s += '<text x="' + (x + bw / 2) + '" y="' + (h - 9) + '" text-anchor="middle">' + esc(zeile2) + '</text>';
    });
    el.innerHTML = svg(w, h, s, 'Vom Mieteingang zum Cashflow pro Monat');
  }

  /* ---------- 5. Monteurzimmer: Ergebnis je nach Belegung ---------- */
  /* d: { rechne: function(belegungProzent) -> {operativ, nachKredit}, aktuell, beOhne, beMit } */
  function belegung(el, legEl, d) {
    var w = breite(el), h = 250, l = 62, r = 20, o = 16, u = 30;
    var pkt = [];
    for (var b = 0; b <= 100; b += 2) { var e = d.rechne(b); pkt.push({ b: b, op: e.operativ, nk: e.nachKredit }); }
    var werte = [0];
    pkt.forEach(function (p) { werte.push(p.op, p.nk); });
    var maxY = Math.max.apply(null, werte), minY = Math.min.apply(null, werte), spanne = (maxY - minY) || 1;
    var sx = function (x) { return l + x / 100 * (w - l - r); };
    var sy = function (y) { return o + (maxY - y) / spanne * (h - o - u); };
    var c1 = v('--c1'), c2 = v('--c2'), s = '';
    var tick = schritte(spanne, 4), st = tick.length > 1 ? tick[1] : spanne;
    for (var t = Math.ceil(minY / st) * st; t <= maxY + 1e-6; t += st) {
      var tt = t + 0;
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(tt) + '" y2="' + sy(tt) + '"/><text x="' + (l - 8) + '" y="' + (sy(tt) + 4) + '" text-anchor="end">' + kurz(tt) + '</text>';
    }
    [0, 25, 50, 75, 100].forEach(function (x) { s += '<text x="' + sx(x) + '" y="' + (h - 8) + '" text-anchor="middle">' + x + NB + '%</text>'; });
    s += '<line x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '" stroke="' + v('--text') + '" stroke-width="1"/>';
    function linie(key, farbe) {
      return '<path d="' + pkt.map(function (p, i) { return (i ? 'L' : 'M') + sx(p.b).toFixed(1) + ' ' + sy(p[key]).toFixed(1); }).join(' ') +
        '" fill="none" stroke="' + farbe + '" stroke-width="2" stroke-linejoin="round"/>';
    }
    s += linie('op', c1) + linie('nk', c2);
    [[d.beOhne, c1, 'ohne Kredit'], [d.beMit, c2, 'mit Kredit']].forEach(function (be, i) {
      if (!isFinite(be[0]) || be[0] < 0 || be[0] > 100) return;
      s += '<circle cx="' + sx(be[0]) + '" cy="' + sy(0) + '" r="5" fill="' + be[1] + '" stroke="' + v('--karte') + '" stroke-width="2"/>' +
        '<text class="wertlabel" x="' + (sx(be[0]) + 8) + '" y="' + (sy(0) + (i ? -10 : 18)) + '">' + fmt0.format(be[0]) + NB + '%</text>';
    });
    if (isFinite(d.aktuell)) {
      var xa = sx(Math.max(0, Math.min(100, d.aktuell)));
      s += '<line x1="' + xa + '" x2="' + xa + '" y1="' + o + '" y2="' + (h - u) + '" stroke="' + v('--leise') + '" stroke-dasharray="4 4"/>' +
        '<text x="' + (xa + 6) + '" y="' + (o + 8) + '">aktuell ' + fmt0.format(d.aktuell) + NB + '%</text>';
    }
    s += '<line class="kreuz" x1="0" x2="0" y1="' + o + '" y2="' + (h - u) + '" stroke="' + v('--leise') + '" visibility="hidden"/>';
    s += '<rect class="fang" x="' + l + '" y="' + o + '" width="' + (w - l - r) + '" height="' + (h - o - u) + '" fill="transparent"/>';
    el.innerHTML = svg(w, h, s, 'Monatsergebnis je nach Belegung');
    var fang = el.querySelector('.fang'), kreuz = el.querySelector('.kreuz');
    fang.addEventListener('mousemove', function (ev) {
      var bx = el.querySelector('svg').getBoundingClientRect();
      var x = (ev.clientX - bx.left) * (w / bx.width);
      var bel = Math.max(0, Math.min(100, Math.round((x - l) / (w - l - r) * 50) * 2));
      var e = d.rechne(bel);
      kreuz.setAttribute('x1', sx(bel)); kreuz.setAttribute('x2', sx(bel)); kreuz.setAttribute('visibility', 'visible');
      zeigeTip(ev, '<b>Belegung ' + bel + NB + '%</b><br><span style="color:' + c1 + '">■</span> ohne Kredit: ' + euro(e.operativ) + '<br><span style="color:' + c2 + '">■</span> nach Kreditrate: ' + euro(e.nachKredit));
    });
    fang.addEventListener('mouseleave', function () { kreuz.setAttribute('visibility', 'hidden'); versteckeTip(); });
    legEl.innerHTML = '<span><i class="linie" style="background:' + c1 + '"></i>Operatives Ergebnis (ohne Kredit)</span><span><i class="linie" style="background:' + c2 + '"></i>Nach Kreditrate Angebot A</span><span>Punkte auf der Nulllinie: Break-even</span>';
  }

  /* ---------- 6. Wertermittlung: Verfahren gegen Kaufpreis ---------- */
  /* d: { zeilen: [{name, boden, gebaeude} | {name, gesamt}], kaufpreis } */
  function werte(el, legEl, d) {
    var w = breite(el), l = 116, r = 24, zeileH = 44, o = 10;
    var h = o + d.zeilen.length * zeileH + 34;
    var max = d.kaufpreis || 0;
    d.zeilen.forEach(function (z) { max = Math.max(max, z.gesamt !== undefined ? z.gesamt : z.boden + z.gebaeude); });
    max = max * 1.08 || 1;
    var sx = function (x) { return l + Math.max(0, x) / max * (w - l - r); };
    var c1 = v('--c1'), c2 = v('--c2'), c3 = v('--c3'), s = '';
    schritte(max, 4).forEach(function (x) {
      s += '<line class="gitter" x1="' + sx(x) + '" x2="' + sx(x) + '" y1="' + o + '" y2="' + (h - 26) + '"/><text x="' + sx(x) + '" y="' + (h - 8) + '" text-anchor="middle">' + kurz(x) + '</text>';
    });
    d.zeilen.forEach(function (z, i) {
      var y = o + i * zeileH + 6, bh = 28;
      s += '<text x="0" y="' + (y + 18) + '">' + esc(z.name) + '</text>';
      if (z.gesamt !== undefined) {
        s += '<rect x="' + l + '" y="' + y + '" width="' + Math.max(2, sx(z.gesamt) - l) + '" height="' + bh + '" rx="4" fill="' + c2 + '" data-tip="<b>' + esc(z.name) + '</b><br>' + euro(z.gesamt) + '"/>';
        s += '<text class="wertlabel" x="' + (sx(z.gesamt) + 6) + '" y="' + (y + 18) + '">' + euro(z.gesamt) + '</text>';
      } else {
        var xb = sx(z.boden);
        s += '<rect x="' + l + '" y="' + y + '" width="' + Math.max(1, xb - l - 2) + '" height="' + bh + '" rx="4" fill="' + c3 + '" data-tip="<b>' + esc(z.name) + ': Bodenwert</b><br>' + euro(z.boden) + '"/>';
        s += '<rect x="' + xb + '" y="' + y + '" width="' + Math.max(1, sx(z.boden + z.gebaeude) - xb) + '" height="' + bh + '" rx="4" fill="' + c1 + '" data-tip="<b>' + esc(z.name) + ': Gebäude</b><br>' + euro(z.gebaeude) + '"/>';
        s += '<text class="wertlabel" x="' + (sx(z.boden + z.gebaeude) + 6) + '" y="' + (y + 18) + '">' + euro(z.boden + z.gebaeude) + '</text>';
      }
    });
    if (d.kaufpreis > 0) {
      var xk = sx(d.kaufpreis);
      s += '<line x1="' + xk + '" x2="' + xk + '" y1="' + (o - 4) + '" y2="' + (h - 26) + '" stroke="' + v('--text') + '" stroke-width="1.5" stroke-dasharray="5 4"/>';
    }
    el.innerHTML = svg(w, h, s, 'Wertermittlung gegen Kaufpreis');
    var mitVgl = d.zeilen.some(function (z) { return z.gesamt !== undefined; });
    legEl.innerHTML = '<span><i style="background:' + c3 + '"></i>Bodenwert</span><span><i style="background:' + c1 + '"></i>Gebäudewert</span>' +
      (mitVgl ? '<span><i style="background:' + c2 + '"></i>Vergleichswert</span>' : '') +
      (d.kaufpreis > 0 ? '<span><i class="linie" style="background:' + v('--text') + '"></i>Kaufpreis ' + euro(d.kaufpreis) + '</span>' : '');
  }

  /* ---------- Verkauf nach N Jahren: Gesamtergebnis je Jahr, Linie bei Ablauf der Zehn-Jahres-Frist (Block 4) ---------- */
  function verkauf(el, legEl, d) {
    var zeilen = d && d.zeilen;
    if (!zeilen || !zeilen.length) { el.innerHTML = '<p class="klein">Rechner Schritte 1 bis 3 und Angebot A ausfüllen.</p>'; legEl.innerHTML = ''; return; }
    var w = breite(el), h = 292, l = 64, r = 16, o = 30, u = 46;
    var maxJ = zeilen.length, frist = d.frist;
    var ys = zeilen.map(function (z) { return z.gesamt; }).concat([0]);
    var maxY = Math.max.apply(null, ys), minY = Math.min.apply(null, ys);
    if (maxY === minY) maxY = minY + 1;
    var sx = function (j) { return l + (j - 1) / (maxJ - 1 || 1) * (w - l - r); };
    var sy = function (y) { return o + (1 - (y - minY) / (maxY - minY)) * (h - o - u); };
    var c1 = v('--c1'), c3 = v('--c3'), leise = v('--leise');
    var s = '';
    var xFrist = sx(frist - 0.5);
    s += '<rect x="' + l + '" y="' + o + '" width="' + Math.max(0, xFrist - l) + '" height="' + (h - o - u) + '" fill="' + c3 + '" fill-opacity=".10"/>';
    /* runde Achsenwerte (Vielfache der Schrittweite, nicht ab dem Minimum) */
    var st = schritte(maxY - minY, 4), step = st.length > 1 ? st[1] - st[0] : 1;
    for (var yt = Math.ceil(minY / step) * step; yt <= maxY + step * 0.001; yt += step) {
      if (Math.abs(yt) < step * 1e-9) yt = 0; /* kein „-0“ an der Achse */
      s += '<line class="gitter" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(yt) + '" y2="' + sy(yt) + '"/><text x="' + (l - 8) + '" y="' + (sy(yt) + 4) + '" text-anchor="end">' + kurz(yt) + '</text>';
    }
    [1, 5, 10, 15, 20, 25, 30].filter(function (j) { return j <= maxJ; }).forEach(function (j) { s += '<text x="' + sx(j) + '" y="' + (h - u + 18) + '" text-anchor="middle">' + j + '</text>'; });
    s += '<text x="' + ((l + w - r) / 2) + '" y="' + (h - 6) + '" text-anchor="middle">Verkauf nach … Jahren</text>';
    s += '<line class="achse" x1="' + l + '" x2="' + (w - r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    s += '<line x1="' + xFrist + '" x2="' + xFrist + '" y1="' + o + '" y2="' + (h - u) + '" stroke="' + c3 + '" stroke-width="2" stroke-dasharray="6 4"/>';
    s += '<text x="' + (xFrist - 6) + '" y="' + (o - 10) + '" text-anchor="end">Steuerpflichtig</text><text x="' + (xFrist + 6) + '" y="' + (o - 10) + '" text-anchor="start">Frist abgelaufen</text>';
    var pfad = zeilen.map(function (z, i) { return (i ? 'L' : 'M') + sx(z.jahr).toFixed(1) + ' ' + sy(z.gesamt).toFixed(1); }).join(' ');
    s += '<path d="' + pfad + '" fill="none" stroke="' + c1 + '" stroke-width="2.5"/>';
    if (d.plusAb) {
      var pz = zeilen[d.plusAb - 1];
      s += '<circle cx="' + sx(pz.jahr) + '" cy="' + sy(pz.gesamt) + '" r="5" fill="' + c1 + '" stroke="' + v('--karte') + '" stroke-width="2"/>';
      s += '<text class="wertlabel" x="' + sx(pz.jahr) + '" y="' + (sy(pz.gesamt) - 10) + '" text-anchor="' + (sx(pz.jahr) < l + 60 ? 'start' : 'middle') + '">im Plus ab Jahr ' + d.plusAb + '</text>';
    }
    s += '<line id="verk-kreuz" x1="0" x2="0" y1="' + o + '" y2="' + (h - u) + '" stroke="' + leise + '" stroke-width="1" visibility="hidden"/>';
    s += '<rect class="fang" x="' + l + '" y="' + o + '" width="' + (w - l - r) + '" height="' + (h - o - u) + '" fill="transparent"/>';
    el.innerHTML = svg(w, h, s, 'Gesamtergebnis nach Verkauf in den Jahren 1 bis ' + maxJ + ', Linie bei Ablauf der Zehn-Jahres-Frist');
    var fang = el.querySelector('.fang'), kreuz = el.querySelector('#verk-kreuz');
    fang.addEventListener('mousemove', function (ev) {
      var box = el.querySelector('svg').getBoundingClientRect();
      var x = (ev.clientX - box.left) * (w / box.width);
      var j = Math.max(1, Math.min(maxJ, Math.round((x - l) / (w - l - r) * (maxJ - 1)) + 1));
      var z = zeilen[j - 1];
      kreuz.setAttribute('x1', sx(j)); kreuz.setAttribute('x2', sx(j)); kreuz.setAttribute('visibility', 'visible');
      zeigeTip(ev, '<b>Verkauf nach ' + j + ' Jahren</b><br>Preis: ' + euro(z.preis) + '<br>Gewinn nach § 23: ' + euro(z.gewinn) + '<br>Steuer: ' + euro(z.steuer) +
        '<br>Gesamtergebnis: ' + euro(z.gesamt));
    });
    fang.addEventListener('mouseleave', function () { kreuz.setAttribute('visibility', 'hidden'); versteckeTip(); });
    legEl.innerHTML = '<span><i class="linie" style="background:' + c1 + '"></i>Gesamtergebnis nach Verkauf (nach Steuern)</span><span><i class="linie" style="background:' + c3 + '"></i>Rosa Fläche: Verkauf innerhalb der Frist, Gewinn steuerpflichtig</span>';
  }

  window.GRAFIK = { verkauf: verkauf, werte: werte, mittel: mittel, restschuld: restschuld, vermoegen: vermoegen, tilgung: tilgung, wasserfall: wasserfall, belegung: belegung, versteckeTip: versteckeTip };
})();
