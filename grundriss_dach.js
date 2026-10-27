/* Reine Rechnung für die 3D-Ansicht (läuft auch in Node, siehe tmp/dach_geo_test.js). Alle Maße in Metern, Winkel in Grad.
   Plan-Koordinaten (x, y) wie im Plan, z nach oben. Nichts hier zeichnet etwas.
   - ebenen():        Höhenlage jeder Etage (Keller unter dem Erdgeschoss, siehe istKeller)
   - wandKoerper():   Wandstücke als Kästen, Wände in Teile zerlegt, wo ein gebundenes Fenster oder eine Tür sitzt
   - huellRechteck(), dachFlaechen(): Dach über dem umschließenden Rechteck der obersten Etage (Näherung)
   - aspekt(), ertrag(), klasse(): Himmelsrichtung einer Dachfläche → PVGIS-Ertragstabelle (daten/pvgis.js)
   - sonnenstand():   Höhe und Himmelsrichtung der Sonne nach der Standardformel (Spencer), Uhrzeit mit Sommerzeit nach Monat */
(function (wurzel) {
  'use strict';
  var GEO = wurzel.GRUNDRISS_GEO || (typeof require === 'function' ? require('./grundriss_geo.js') : null);
  var RAD = Math.PI / 180;

  /* ---------- Etagen übereinander ---------- */
  /* Keller (Name) liegen unter dem Erdgeschoss, in Reihenfolge der Liste nach unten; alles andere in Reihenfolge der Liste nach oben.
     Annahme, in der Seite genannt: Sind alle Etagen Keller, gilt die Listenreihenfolge ohne Sonderfall. */
  function istKeller(e) { return /keller|untergeschoss|souterrain|(^|\s)ug(\s|$)/i.test(String((e && e.name) || '')); }
  function hoeheVon(e) { var h = Number(e && e.hoehe); return isFinite(h) && h > 0 ? h : 2.5; }
  function deckeVon(e) { var d = Number(e && e.decke); return isFinite(d) && d > 0 ? d : 0.25; }
  function ebenen(plan) {
    var et = (plan && plan.etagen) || [], oben = [], unten = [], res = [];
    et.forEach(function (e, i) { (istKeller(e) ? unten : oben).push(i); });
    if (!oben.length) { oben = unten; unten = []; }
    var z = 0;
    oben.forEach(function (i, k) {
      var h = hoeheVon(et[i]), d = deckeVon(et[i]);
      res[i] = { index: i, keller: false, basis: z, oben: z + h, decke: d, hoehe: h, rang: k };
      z += h + d;
    });
    z = 0;
    unten.forEach(function (i, k) {
      var h = hoeheVon(et[i]), d = deckeVon(et[i]);
      res[i] = { index: i, keller: true, oben: z - d, basis: z - d - h, decke: d, hoehe: h, rang: -1 - k };
      z = z - d - h;
    });
    return res;
  }
  /* Höchste Etage über der Erde, die Räume hat (trägt das Dach); -1 wenn keine */
  function dachEtage(plan) {
    var eb = ebenen(plan), best = -1;
    eb.forEach(function (x, i) {
      if (!x || x.keller) return;
      var e = plan.etagen[i];
      if (!(e.raeume || []).some(function (r) { return r.art !== 'balkon'; })) return;
      if (best < 0 || x.basis > eb[best].basis) best = i;
    });
    return best;
  }

  /* ---------- Wände mit Öffnungen ---------- */
  function istOeffnung(t, ART) { var a = ART[t.art]; return !!a && (a.form === 'tuer' || a.form === 'fenster') && !!t.bindung; }
  /* Liefert Kästen {k:'wand'|'glas'|'blatt', typ, cx, cy, z0, z1, len, dick, ux, uy}; z relativ zur Etagenbasis.
     Öffnungen werden geometrisch einem Wandstück zugeordnet (Mittelpunkt auf der Wandachse, höchstens halbe Dicke + 20 cm daneben). */
  function wandKoerper(etage, ART, hoeheEtage) {
    var H = hoeheEtage || etage.hoehe || 2.5, wl = GEO.waende(etage), res = [];
    res.verbraucht = {};   /* Ids der Fenster/Türen, die in einer Wand eine Öffnung bekommen haben (der Rest wird als freies Teil gezeichnet) */
    var oeff = (etage.teile || []).filter(function (t) { return istOeffnung(t, ART); });
    wl.forEach(function (w) {
      var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy);
      if (L < 0.01) return;
      var ux = dx / L, uy = dy / L, d = w.dicke, o1 = w.typ === 'innen' ? -d / 2 : 0, oc = w.typ === 'innen' ? 0 : d / 2;
      var v = GEO.eckenVerlaengerung(etage, w), e0 = v[0] && w.typ !== 'innen' ? d : 0, e1 = v[1] && w.typ !== 'innen' ? d : 0;
      function P(s) { return [w.a[0] + ux * s + w.nx * oc, w.a[1] + uy * s + w.ny * oc]; }
      function kasten(k, s0, s1, z0, z1, dick) {
        if (s1 - s0 < 0.005 || z1 - z0 < 0.005) return;
        var m = P((s0 + s1) / 2);
        res.push({ k: k, typ: w.typ, cx: m[0], cy: m[1], z0: z0, z1: z1, len: s1 - s0, dick: dick || d, ux: ux, uy: uy });
      }
      /* Öffnungen dieses Stücks */
      var lue = [];
      oeff.forEach(function (t) {
        var a = ART[t.art], sc = (t.x - w.a[0]) * ux + (t.y - w.a[1]) * uy, perp = (t.x - w.a[0]) * w.nx + (t.y - w.a[1]) * w.ny - oc;
        if (Math.abs(perp) > d / 2 + 0.2) return;
        var s0 = sc - t.w / 2, s1 = sc + t.w / 2, c0 = Math.max(0, s0), c1 = Math.min(L, s1);
        if (c1 - c0 < 0.02) return;
        /* nur wenn das Teil ungefähr parallel zur Wand liegt (Drehwinkel des Teils: lokales x entlang der Wand) */
        var ang = (t.dreh || 0) * RAD, tx = Math.cos(ang), ty = Math.sin(ang);
        if (Math.abs(tx * ux + ty * uy) < 0.9) return;
        var ho = Math.max(0.1, Math.min(t.hoehe || (a.hoehe / 100), H)), br = Math.max(0, t.bruestung || 0);
        if (br + ho > H) ho = Math.max(0.1, H - br);
        lue.push({ s0: c0, s1: c1, fs0: s0, fs1: s1, br: br, ho: ho, fenster: a.form === 'fenster', t: t });
        if (t.id != null) res.verbraucht[t.id] = true;
      });
      lue.sort(function (p, q) { return p.s0 - q.s0; });
      /* nicht überlappen lassen */
      for (var i = 1; i < lue.length; i++) if (lue[i].s0 < lue[i - 1].s1) lue[i].s0 = lue[i - 1].s1;
      var pos = -e0;
      lue.forEach(function (o) {
        if (o.s1 <= o.s0) return;
        kasten('wand', pos, o.s0, 0, H);
        if (o.br > 0.005) kasten('wand', o.s0, o.s1, 0, o.br);
        if (o.br + o.ho < H - 0.005) kasten('wand', o.s0, o.s1, o.br + o.ho, H);
        if (o.fenster) kasten('glas', o.s0, o.s1, o.br, o.br + o.ho, 0.04);
        else {
          /* Türblatt: um 70° in den Raum aufgeschwenkt, Angel am Anfang der Öffnung */
          var wdt = o.fs1 - o.fs0, ca = Math.cos(70 * RAD), sa = Math.sin(70 * RAD), h0 = P(o.s0);
          var bx = ux * ca - w.nx * sa, by = uy * ca - w.ny * sa;
          res.push({ k: 'blatt', typ: w.typ, cx: h0[0] + bx * wdt / 2, cy: h0[1] + by * wdt / 2, z0: o.br, z1: o.br + o.ho, len: wdt, dick: 0.04, ux: bx, uy: by });
        }
        pos = o.s1;
      });
      kasten('wand', pos, L + e1, 0, H);
    });
    return res;
  }

  /* ---------- Dach ---------- */
  /* Umschließendes Rechteck aller Räume außer Balkonen, um die Außenwand vergrößert (Näherung, in der Seite genannt) */
  function huellRechteck(etage) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    (etage.raeume || []).forEach(function (r) {
      if (r.art === 'balkon') return;
      r.punkte.forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    });
    if (!isFinite(x0)) return null;
    var d = Number(etage.aussenwand); d = isFinite(d) && d > 0 ? d : 0.3;
    return { x0: x0 - d, y0: y0 - d, x1: x1 + d, y1: y1 + d };
  }
  /* Dachflächen. Rückgabe {faces:[{pts:[[x,y,z],...], bergab:[dx,dy]|null, neigung}], giebel:[[[x,y,z],...]], kasten:{...}|null,
     zFirst, form}. zT = Oberkante der Wand unter dem Dach (Oberkante Decke). */
  function dachFlaechen(dach, r, zT) {
    var form = dach.form, t = Math.tan(Math.max(0, Math.min(80, dach.neigung)) * RAD), U = Math.max(0, dach.ueberstand || 0), first = dach.first === 'y' ? 'y' : 'x';
    var hoch = dach.hoch === 'max' ? 'max' : 'min';
    var out = { form: form, faces: [], giebel: [], kasten: null, zFirst: zT };
    var xm = (r.x0 + r.x1) / 2, ym = (r.y0 + r.y1) / 2, a = (r.x1 - r.x0) / 2, b = (r.y1 - r.y0) / 2;
    var X0 = r.x0 - U, X1 = r.x1 + U, Y0 = r.y0 - U, Y1 = r.y1 + U, zU = zT - U * t, neig = Math.atan(t) / RAD;
    if (form === 'flach' || t < 1e-6) {
      var zd = 0.2;
      out.kasten = { x0: X0, y0: Y0, x1: X1, y1: Y1, z0: zT, z1: zT + zd };
      out.faces.push({ pts: [[X0, Y0, zT + zd], [X1, Y0, zT + zd], [X1, Y1, zT + zd], [X0, Y1, zT + zd]], bergab: null, neigung: 0 });
      out.zFirst = zT + zd;
      return out;
    }
    if (form === 'sattel') {
      if (first === 'x') {
        var zF = zT + b * t; out.zFirst = zF;
        out.faces.push({ pts: [[X0, Y0, zU], [X1, Y0, zU], [X1, ym, zF], [X0, ym, zF]], bergab: [0, -1], neigung: neig });
        out.faces.push({ pts: [[X1, Y1, zU], [X0, Y1, zU], [X0, ym, zF], [X1, ym, zF]], bergab: [0, 1], neigung: neig });
        out.giebel.push([[r.x0, r.y0, zT], [r.x0, r.y1, zT], [r.x0, ym, zF]], [[r.x1, r.y0, zT], [r.x1, r.y1, zT], [r.x1, ym, zF]]);
      } else {
        var zF2 = zT + a * t; out.zFirst = zF2;
        out.faces.push({ pts: [[X0, Y0, zU], [X0, Y1, zU], [xm, Y1, zF2], [xm, Y0, zF2]], bergab: [-1, 0], neigung: neig });
        out.faces.push({ pts: [[X1, Y1, zU], [X1, Y0, zU], [xm, Y0, zF2], [xm, Y1, zF2]], bergab: [1, 0], neigung: neig });
        out.giebel.push([[r.x0, r.y0, zT], [r.x1, r.y0, zT], [xm, r.y0, zF2]], [[r.x0, r.y1, zT], [r.x1, r.y1, zT], [xm, r.y1, zF2]]);
      }
      return out;
    }
    if (form === 'walm') {
      var k = Math.min(a, b), zW = zT + k * t, l = Math.abs(a - b);
      out.zFirst = zW;
      if (a >= b) {
        out.faces.push({ pts: [[X0, Y0, zU], [X1, Y0, zU], [xm + l, ym, zW], [xm - l, ym, zW]], bergab: [0, -1], neigung: neig });
        out.faces.push({ pts: [[X1, Y1, zU], [X0, Y1, zU], [xm - l, ym, zW], [xm + l, ym, zW]], bergab: [0, 1], neigung: neig });
        out.faces.push({ pts: [[X0, Y1, zU], [X0, Y0, zU], [xm - l, ym, zW]], bergab: [-1, 0], neigung: neig });
        out.faces.push({ pts: [[X1, Y0, zU], [X1, Y1, zU], [xm + l, ym, zW]], bergab: [1, 0], neigung: neig });
      } else {
        out.faces.push({ pts: [[X0, Y0, zU], [X0, Y1, zU], [xm, ym + l, zW], [xm, ym - l, zW]], bergab: [-1, 0], neigung: neig });
        out.faces.push({ pts: [[X1, Y1, zU], [X1, Y0, zU], [xm, ym - l, zW], [xm, ym + l, zW]], bergab: [1, 0], neigung: neig });
        out.faces.push({ pts: [[X1, Y0, zU], [X0, Y0, zU], [xm, ym - l, zW]], bergab: [0, -1], neigung: neig });
        out.faces.push({ pts: [[X0, Y1, zU], [X1, Y1, zU], [xm, ym + l, zW]], bergab: [0, 1], neigung: neig });
      }
      return out;
    }
    /* pult: eine Fläche; first 'x' = hohe Kante läuft in x-Richtung (oben oder unten im Plan, je nach hoch), 'y' = in y-Richtung */
    if (first === 'x') {
      var span = r.y1 - r.y0, zH = zT + span * t, yh = hoch === 'min' ? r.y0 : r.y1, yl = hoch === 'min' ? r.y1 : r.y0, sg = hoch === 'min' ? 1 : -1;
      var zHo = zT + (span + U) * t;
      var yHo = hoch === 'min' ? Y0 : Y1, yLo = hoch === 'min' ? Y1 : Y0;
      out.faces.push({ pts: [[X0, yHo, zHo], [X1, yHo, zHo], [X1, yLo, zU], [X0, yLo, zU]], bergab: [0, sg], neigung: neig });
      out.giebel.push([[r.x0, yl, zT], [r.x0, yh, zT], [r.x0, yh, zH]], [[r.x1, yl, zT], [r.x1, yh, zT], [r.x1, yh, zH]],
        [[r.x0, yh, zT], [r.x1, yh, zT], [r.x1, yh, zH], [r.x0, yh, zH]]);
      out.zFirst = zH;
    } else {
      var span2 = r.x1 - r.x0, zH2 = zT + span2 * t, xh = hoch === 'min' ? r.x0 : r.x1, xl = hoch === 'min' ? r.x1 : r.x0, sg2 = hoch === 'min' ? 1 : -1;
      var zHo2 = zT + (span2 + U) * t;
      var xHo = hoch === 'min' ? X0 : X1, xLo = hoch === 'min' ? X1 : X0;
      out.faces.push({ pts: [[xHo, Y0, zHo2], [xHo, Y1, zHo2], [xLo, Y1, zU], [xLo, Y0, zU]], bergab: [sg2, 0], neigung: neig });
      out.giebel.push([[xl, r.y0, zT], [xh, r.y0, zT], [xh, r.y0, zH2]], [[xl, r.y1, zT], [xh, r.y1, zT], [xh, r.y1, zH2]],
        [[xh, r.y0, zT], [xh, r.y1, zT], [xh, r.y1, zH2], [xh, r.y0, zH2]]);
      out.zFirst = zH2;
    }
    return out;
  }

  /* ---------- Himmelsrichtung und Ertrag ---------- */
  /* PVGIS-Azimut (0 = Süd, 90 = West, -90 = Ost, ±180 = Nord) einer Fläche, die in Planrichtung `bergab` abfällt.
     nord = Winkel in Grad, in den Norden auf dem Plan zeigt (0 = oben, im Uhrzeigersinn). Plan-Winkel: 0 = oben (−y), im Uhrzeigersinn. */
  function himmelsrichtung(bergab, nord) {
    var plan = Math.atan2(bergab[0], -bergab[1]) / RAD;
    return (((plan - (nord || 0)) % 360) + 360) % 360;      /* 0 = Nord, 90 = Ost, 180 = Süd, 270 = West */
  }
  function aspekt(bergab, nord) {
    var a = himmelsrichtung(bergab, nord) - 180;
    return a <= -180 ? a + 360 : (a > 180 ? a - 360 : a);
  }
  function stadtZeile(daten, name) {
    if (!daten || !daten.staedte) return null;
    for (var i = 0; i < daten.staedte.length; i++) if (daten.staedte[i].name === name) return daten.staedte[i];
    return null;
  }
  /* Jahresertrag in kWh je kWp für Aspekt und Neigung: bilinear, Aspekt ringsum, Neigung über 60° wie 60° (gekappt = true) */
  function ertrag(daten, stadt, asp, neig) {
    var s = stadtZeile(daten, stadt); if (!s) return null;
    var as = daten.aspekte, ne = daten.neigungen, kapp = neig > ne[ne.length - 1];
    var n = Math.max(ne[0], Math.min(ne[ne.length - 1], neig));
    var schr = ne[1] - ne[0], i0 = Math.min(ne.length - 2, Math.floor((n - ne[0]) / schr)), fn = (n - ne[i0]) / schr;
    var w = as[1] - as[0], p = (((asp - as[0]) % 360) + 360) % 360 / w, j0 = Math.floor(p) % as.length, j1 = (j0 + 1) % as.length, fa = p - Math.floor(p);
    function z(i) { return s.ey[i][j0] * (1 - fa) + s.ey[i][j1] * fa; }
    return { ey: z(i0) * (1 - fn) + z(i0 + 1) * fn, gekappt: kapp };
  }
  function bestwert(daten, stadt) {
    var s = stadtZeile(daten, stadt); if (!s) return null;
    var m = 0; s.ey.forEach(function (z) { z.forEach(function (v) { if (v > m) m = v; }); });
    return m;
  }
  /* Eigene Einordnung nach offen genannten Schwellen, bezogen auf den besten Tabellenwert der Stadt (keine Empfehlung) */
  var SCHWELLEN = [['sehrgut', 0.90], ['gut', 0.80], ['maessig', 0.65], ['schlecht', 0]];
  function klasse(ey, best) {
    var r = best ? ey / best : 0;
    for (var i = 0; i < SCHWELLEN.length; i++) if (r >= SCHWELLEN[i][1]) return SCHWELLEN[i][0];
    return 'schlecht';
  }

  /* ---------- Sonne ---------- */
  var TAGE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  /* Sommerzeit (MESZ) vereinfacht: Monate April bis Oktober (der 21. des Monats) */
  function sommerzeit(monat) { return monat >= 4 && monat <= 10; }
  /* Sonnenstand am 21. des Monats zur Uhrzeit `stunde` (Uhr, MEZ bzw. MESZ) an Ort lat/lon.
     Rückgabe {hoehe (Grad über dem Horizont), azimut (Kompass, 0 = Nord, 90 = Ost, 180 = Süd), ueber (Sonne über dem Horizont)}. */
  function sonnenstand(lat, lon, monat, stunde) {
    var n = TAGE[Math.max(1, Math.min(12, monat)) - 1] + 21, B = 2 * Math.PI * (n - 1) / 365;
    var dekl = 0.006918 - 0.399912 * Math.cos(B) + 0.070257 * Math.sin(B) - 0.006758 * Math.cos(2 * B) + 0.000907 * Math.sin(2 * B) - 0.002697 * Math.cos(3 * B) + 0.00148 * Math.sin(3 * B);
    var zg = 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B) - 0.014615 * Math.cos(2 * B) - 0.040849 * Math.sin(2 * B));
    var wahr = stunde - 1 - (sommerzeit(monat) ? 1 : 0) + lon / 15 + zg / 60;   /* Ortszeit der Sonne in Stunden */
    var w = 15 * (wahr - 12) * RAD, phi = lat * RAD;
    var sinH = Math.sin(phi) * Math.sin(dekl) + Math.cos(phi) * Math.cos(dekl) * Math.cos(w);
    var h = Math.asin(Math.max(-1, Math.min(1, sinH)));
    var az = Math.atan2(Math.sin(w), Math.cos(w) * Math.sin(phi) - Math.tan(dekl) * Math.cos(phi)) / RAD + 180;
    return { hoehe: h / RAD, azimut: ((az % 360) + 360) % 360, ueber: h > 0.0087, dekl: dekl / RAD };
  }

  var api = {
    istKeller: istKeller, ebenen: ebenen, dachEtage: dachEtage, wandKoerper: wandKoerper, huellRechteck: huellRechteck,
    dachFlaechen: dachFlaechen, himmelsrichtung: himmelsrichtung, aspekt: aspekt, stadtZeile: stadtZeile, ertrag: ertrag,
    bestwert: bestwert, klasse: klasse, SCHWELLEN: SCHWELLEN, sonnenstand: sonnenstand, sommerzeit: sommerzeit
  };
  wurzel.GRUNDRISS_DACH = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
