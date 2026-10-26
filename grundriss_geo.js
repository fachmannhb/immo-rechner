/* Geometrie für den Grundriss: Wände aus Räumen ableiten, Fenster und Türen an Raumkanten binden.
   Reine Rechnung ohne Oberfläche (läuft auch in Node, siehe tmp/geo_test.js). Alle Maße in Metern.

   Zeichen-Regel (Annahme, in der Seite sichtbar): Der Raumumriss ist das lichte Maß, die Wand wächst nach außen.
   - Außenwand: liegt außen am Umriss (Dicke etage.aussenwand, Standard 0,30 m), der Raum behält sein Maß.
   - Innenwand: Kante, die zwei Räume gemeinsam haben (auch nur teilweise, Toleranz 2 cm). Sie ist EINE Wand,
     mittig auf der gemeinsamen Linie (Dicke etage.innenwand, Standard 0,115 m).
   - Lässt jemand zwischen zwei Räumen eine Lücke bis Innenwand + 2 cm (echtes lichtes Maß beider Räume),
     zählt das ebenfalls als EINE Innenwand, mittig in der Lücke (sonst entstünden zwei Außenwände).
   - Balkon, Loggia, Terrasse (art 'balkon') bekommen keine eigenen Wände. Die Kante zu einem Wohnraum ist Außenwand
     dieses Wohnraums.
   Ein Teilstück ist ein Segment {a, b, typ, dicke, raeume, raum, kante, nx, ny}: a und b liegen auf der Raumkante
   des Raums `raum` (bei Lücke: mittig), (nx, ny) zeigt von diesem Raum nach außen. Kollineare Nachbarstücke werden
   nicht zusammengefasst. */
(function (wurzel) {
  'use strict';
  var TOL = 0.02, MIN = 0.01;
  var STD = { aussenwand: 0.30, innenwand: 0.115, decke: 0.25 };

  /* +1 oder -1 je nach Umlaufsinn (Vorzeichen der Fläche); bestimmt, wohin "außen" zeigt */
  function umlauf(p) {
    var a = 0;
    for (var i = 0; i < p.length; i++) { var q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; }
    return a >= 0 ? 1 : -1;
  }
  /* Kanten eines Raums mit Länge, Richtung u und Normale n (zeigt aus dem Raum heraus) */
  function kanten(raum) {
    var p = raum.punkte, sg = umlauf(p), out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < MIN) { out.push({ i: i, a: a, b: b, L: L, u: [1, 0], n: [0, -sg], leer: true }); continue; }
      var u = [dx / L, dy / L];
      out.push({ i: i, a: a, b: b, L: L, u: u, n: [sg * u[1], -sg * u[0]], leer: false });
    }
    return out;
  }
  function wert(e, k) { var v = Number(e && e[k]); return isFinite(v) && v > 0 ? v : STD[k]; }
  function istBalkon(r) { return r.art === 'balkon'; }

  function waende(etage) {
    var raeume = (etage && etage.raeume) || [], dA = wert(etage, 'aussenwand'), dI = wert(etage, 'innenwand');
    var ke = raeume.map(kanten), res = [];
    raeume.forEach(function (A, ia) {
      ke[ia].forEach(function (ea) {
        if (ea.leer) return;
        /* alle Kanten anderer Räume, die dieser gegenüberliegen und sich überdecken */
        var deck = [];
        raeume.forEach(function (B, ib) {
          if (ib === ia) return;
          ke[ib].forEach(function (eb) {
            if (eb.leer) return;
            if (Math.abs(ea.u[0] * eb.u[1] - ea.u[1] * eb.u[0]) > 0.002) return;       /* nicht parallel */
            if (ea.n[0] * eb.n[0] + ea.n[1] * eb.n[1] > -0.5) return;                   /* schauen nicht gegeneinander */
            var luecke = (eb.a[0] - ea.a[0]) * ea.n[0] + (eb.a[1] - ea.a[1]) * ea.n[1]; /* Abstand entlang der Normale von A */
            if (luecke < -TOL || luecke > dI + TOL) return;
            var s1 = (eb.a[0] - ea.a[0]) * ea.u[0] + (eb.a[1] - ea.a[1]) * ea.u[1];
            var s2 = (eb.b[0] - ea.a[0]) * ea.u[0] + (eb.b[1] - ea.a[1]) * ea.u[1];
            var lo = Math.max(0, Math.min(s1, s2)), hi = Math.min(ea.L, Math.max(s1, s2));
            if (hi - lo > MIN) deck.push({ ib: ib, lo: lo, hi: hi, luecke: Math.max(0, luecke), n: eb.n });
          });
        });
        var bp = [0, ea.L];
        deck.forEach(function (d) { bp.push(d.lo, d.hi); });
        bp.sort(function (x, y) { return x - y; });
        for (var k = 0; k + 1 < bp.length; k++) {
          var s0 = bp[k], s1 = bp[k + 1];
          if (s1 - s0 <= MIN) continue;
          var mitte = (s0 + s1) / 2;
          var mit = deck.filter(function (d) { return d.lo - 1e-9 <= mitte && mitte <= d.hi + 1e-9; });
          var menge = [ia]; mit.forEach(function (d) { if (menge.indexOf(d.ib) < 0) menge.push(d.ib); });
          var haus = menge.filter(function (j) { return !istBalkon(raeume[j]); });
          if (!haus.length) continue;                              /* nur Balkone: keine Wand */
          if (Math.min.apply(null, haus) !== ia) continue;          /* ein anderer Raum erzeugt dieses Stück */
          var innen = haus.length > 1;
          var luecke = 0;
          if (innen) { var dd = mit.filter(function (d) { return !istBalkon(raeume[d.ib]); })[0]; luecke = dd ? dd.luecke : 0; }
          var vx = ea.n[0] * luecke / 2, vy = ea.n[1] * luecke / 2;
          res.push({
            a: [ea.a[0] + ea.u[0] * s0 + vx, ea.a[1] + ea.u[1] * s0 + vy],
            b: [ea.a[0] + ea.u[0] * s1 + vx, ea.a[1] + ea.u[1] * s1 + vy],
            typ: innen ? 'innen' : 'aussen', dicke: innen ? dI : dA,
            raeume: menge.map(function (j) { return raeume[j].id; }),
            raum: A.id, kante: ea.i, nx: ea.n[0], ny: ea.n[1]
          });
        }
      });
    });
    return res;
  }

  /* Maßstücke für die Maßlinien: jede Raumkante wird an den Stellen geteilt, wo ein anderer Raum (auch ein Balkon)
     gegenüberliegt, wie in waende(), nur mit Balkonen als Nachbarn. Jedes Stück erscheint genau einmal: beim Raum mit
     der kleinsten Nummer unter den beteiligten Räumen.
     Stück: {raum, kante, i (Nummer des Stücks an dieser Kante), n (Stücke an dieser Kante), a, b (auf der Kante des Raums),
     L, u (Richtung), nx, ny (nach außen vom Raum), geteilt (ein Nachbar liegt gegenüber), nachbarn (Raum-IDs), luecke,
     mitte (Mittelpunkt des Stücks auf der Wandachse, dort steht die Zahl bei geteilten Stücken), balkon (Raum ist Balkon)}.
     Wandachse: Innenwand mittig in der Lücke; Außenwand eines Wohnraums zum Balkon liegt auf der Balkonseite
     (nach außen vom Wohnraum, Dicke etage.aussenwand); zwei Balkone: auf der Kante. */
  function massstuecke(etage) {
    var raeume = (etage && etage.raeume) || [], dI = wert(etage, 'innenwand'), dA = wert(etage, 'aussenwand');
    var ke = raeume.map(kanten), res = [];
    raeume.forEach(function (A, ia) {
      ke[ia].forEach(function (ea) {
        if (ea.leer) return;
        var deck = [];
        raeume.forEach(function (B, ib) {
          if (ib === ia) return;
          ke[ib].forEach(function (eb) {
            if (eb.leer) return;
            if (Math.abs(ea.u[0] * eb.u[1] - ea.u[1] * eb.u[0]) > 0.002) return;
            if (ea.n[0] * eb.n[0] + ea.n[1] * eb.n[1] > -0.5) return;
            var luecke = (eb.a[0] - ea.a[0]) * ea.n[0] + (eb.a[1] - ea.a[1]) * ea.n[1];
            if (luecke < -TOL || luecke > dI + TOL) return;
            var s1 = (eb.a[0] - ea.a[0]) * ea.u[0] + (eb.a[1] - ea.a[1]) * ea.u[1];
            var s2 = (eb.b[0] - ea.a[0]) * ea.u[0] + (eb.b[1] - ea.a[1]) * ea.u[1];
            var lo = Math.max(0, Math.min(s1, s2)), hi = Math.min(ea.L, Math.max(s1, s2));
            if (hi - lo > MIN) deck.push({ ib: ib, lo: lo, hi: hi, luecke: Math.max(0, luecke) });
          });
        });
        var bp = [0, ea.L];
        deck.forEach(function (d) { bp.push(d.lo, d.hi); });
        bp.sort(function (x, y) { return x - y; });
        var stuecke = [];
        for (var k = 0; k + 1 < bp.length; k++) {
          var s0 = bp[k], s1 = bp[k + 1];
          if (s1 - s0 <= MIN) continue;
          var mitte = (s0 + s1) / 2;
          var mit = deck.filter(function (d) { return d.lo - 1e-9 <= mitte && mitte <= d.hi + 1e-9; });
          if (mit.some(function (d) { return d.ib < ia; })) continue;                 /* gehört dem Raum mit kleinerer Nummer */
          stuecke.push({ s0: s0, s1: s1, mit: mit });
        }
        stuecke.forEach(function (st, si) {
          var mit = st.mit, geteilt = mit.length > 0, luecke = 0, versatz = 0;
          var nachbarHaus = mit.some(function (d) { return !istBalkon(raeume[d.ib]); });
          if (geteilt) {
            luecke = mit[0].luecke;
            if (!istBalkon(A) && !nachbarHaus) versatz = dA / 2;           /* Wohnraum gegen Balkon: Außenwand außen am Wohnraum */
            else if (istBalkon(A) && nachbarHaus) versatz = -dA / 2;       /* Balkon gegen Wohnraum: die Wand liegt im Balkon-Umriss */
            else if (!istBalkon(A) && nachbarHaus) versatz = luecke / 2;   /* Innenwand mittig in der Lücke */
            else versatz = luecke / 2;
          }
          var m = (st.s0 + st.s1) / 2;
          res.push({
            raum: A.id, kante: ea.i, i: si, n: stuecke.length,
            a: [ea.a[0] + ea.u[0] * st.s0, ea.a[1] + ea.u[1] * st.s0], b: [ea.a[0] + ea.u[0] * st.s1, ea.a[1] + ea.u[1] * st.s1],
            L: st.s1 - st.s0, u: ea.u, nx: ea.n[0], ny: ea.n[1], geteilt: geteilt, luecke: luecke,
            nachbarn: mit.map(function (d) { return raeume[d.ib].id; }), balkon: istBalkon(A),
            mitte: [ea.a[0] + ea.u[0] * m + ea.n[0] * versatz, ea.a[1] + ea.u[1] * m + ea.n[1] * versatz]
          });
        });
      });
    });
    return res;
  }

  /* Liegt der Punkt p im Vieleck (Strahlverfahren)? */
  function punktImVieleck(p, pts) {
    var drin = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) drin = !drin;
    }
    return drin;
  }
  /* Ist die Strecke a-b frei von allen Räumen? Geprüft in Abständen von höchstens 5 cm; an beiden Enden bleibt
     `schrumpf` Meter ungeprüft (die Maßlinie darf am Rand eines Nachbarraums enden). */
  function streckeFrei(etage, a, b, schrumpf) {
    var L = Math.hypot(b[0] - a[0], b[1] - a[1]), sk = Math.min(schrumpf || 0, L / 2 - 1e-6);
    var n = Math.max(2, Math.ceil((L - 2 * sk) / 0.05)), raeume = (etage && etage.raeume) || [];
    for (var i = 0; i <= n; i++) {
      var t = (sk + (L - 2 * sk) * i / n) / (L || 1), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      for (var r = 0; r < raeume.length; r++) if (punktImVieleck(p, raeume[r].punkte)) return false;
    }
    return true;
  }

  /* Wandstück als Vieleck (4 Punkte). Außenwand: nach außen; Innenwand: mittig. Außenstücke werden an
     gewölbten (konvexen) Raumecken um die Dicke verlängert, damit die Ecke nicht eine Kerbe hat. */
  function wandVieleck(w, verlaengern) {
    var dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    var d = w.dicke, o1 = w.typ === 'innen' ? -d / 2 : 0, o2 = w.typ === 'innen' ? d / 2 : d;
    var e0 = verlaengern && verlaengern[0] ? (w.typ === 'innen' ? 0 : d) : 0, e1 = verlaengern && verlaengern[1] ? (w.typ === 'innen' ? 0 : d) : 0;
    var ax = w.a[0] - ux * e0, ay = w.a[1] - uy * e0, bx = w.b[0] + ux * e1, by = w.b[1] + uy * e1;
    return [[ax + w.nx * o1, ay + w.ny * o1], [bx + w.nx * o1, by + w.ny * o1], [bx + w.nx * o2, by + w.ny * o2], [ax + w.nx * o2, ay + w.ny * o2]];
  }
  /* Soll ein Außenstück an Anfang/Ende verlängert werden? Ja, wenn dort die Raumecke nach außen gewölbt ist. */
  function eckenVerlaengerung(etage, w) {
    var raum = (etage.raeume || []).filter(function (r) { return r.id === w.raum; })[0];
    if (!raum || w.typ !== 'aussen') return [false, false];
    var k = kanten(raum), n = k.length, ea = k[w.kante], vor = k[(w.kante + n - 1) % n], nach = k[(w.kante + 1) % n];
    var sg = umlauf(raum.punkte);
    function gewoelbt(e1, e2) { return sg * (e1.u[0] * e2.u[1] - e1.u[1] * e2.u[0]) > 1e-6; }
    var amAnfang = Math.hypot(w.a[0] - ea.a[0], w.a[1] - ea.a[1]) < TOL, amEnde = Math.hypot(w.b[0] - ea.b[0], w.b[1] - ea.b[1]) < TOL;
    return [amAnfang && gewoelbt(vor, ea), amEnde && gewoelbt(ea, nach)];
  }

  function abstandPunktStrecke(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }

  /* Nächste Raumkante zu p (nur Räume, die selbst Wände haben), höchstens maxD entfernt.
     bevorzugt: {raum, kante} der bisherigen Bindung, bekommt 5 cm Vorsprung (stabil bei Gleichstand). */
  function naechsteKante(etage, p, maxD, bevorzugt) {
    var best = null;
    (etage.raeume || []).forEach(function (r) {
      if (istBalkon(r)) return;
      kanten(r).forEach(function (e) {
        if (e.leer) return;
        var d = abstandPunktStrecke(p, e.a, e.b);
        if (bevorzugt && bevorzugt.raum === r.id && bevorzugt.kante === e.i) d -= 0.05;
        if (d <= maxD && (!best || d < best.abstand)) best = { raum: r.id, kante: e.i, abstand: d, e: e };
      });
    });
    if (!best) return null;
    var e = best.e, s = (p[0] - e.a[0]) * e.u[0] + (p[1] - e.a[1]) * e.u[1];
    return { raum: best.raum, kante: best.kante, abstand: Math.max(0, best.abstand), laenge: e.L, s: Math.max(0, Math.min(e.L, s)) };
  }

  /* Mittelpunkt und Drehwinkel (Grad) eines Teils der Breite w, das mit Bindung bd an einer Raumkante sitzt.
     Der Winkel zeigt die Schwenkseite (lokales +y) ins Innere des Raums; vorherDreh wählt zwischen den zwei
     Möglichkeiten (θ oder θ+180) die nähere, damit eine gedrehte Tür gedreht bleibt. */
  function bindungPos(etage, bd, w, vorherDreh, wandListe) {
    if (!bd) return null;
    var raum = (etage.raeume || []).filter(function (r) { return r.id === bd.raum; })[0];
    if (!raum) return null;
    var k = kanten(raum), e = k[bd.kante];
    if (!e || e.leer) return null;
    var hw = w / 2, s = Math.max(0, Math.min(1, bd.t)) * e.L;
    if (e.L >= w) s = Math.max(hw, Math.min(e.L - hw, s)); else s = e.L / 2;
    var p = [e.a[0] + e.u[0] * s, e.a[1] + e.u[1] * s], dicke = null, typ = null;
    var liste = wandListe || waende(etage);
    for (var i = 0; i < liste.length; i++) {
      var q = liste[i];
      if (q.raeume.indexOf(raum.id) < 0) continue;
      if (abstandPunktStrecke(p, q.a, q.b) > Math.max(q.dicke, 0.2)) continue;
      /* Punkt auf die Wandlinie legen */
      var dx = q.b[0] - q.a[0], dy = q.b[1] - q.a[1], L2 = dx * dx + dy * dy, t = L2 ? ((p[0] - q.a[0]) * dx + (p[1] - q.a[1]) * dy) / L2 : 0;
      if (t < -1e-9 || t > 1 + 1e-9) continue;
      p = [q.a[0] + t * dx, q.a[1] + t * dy]; dicke = q.dicke; typ = q.typ;
      if (q.typ === 'aussen') p = [p[0] + q.nx * q.dicke / 2, p[1] + q.ny * q.dicke / 2];
      break;
    }
    var th = Math.atan2(e.n[0], -e.n[1]) * 180 / Math.PI;
    th = ((th % 360) + 360) % 360;
    var th2 = (th + 180) % 360;
    function diff(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
    var dreh = (vorherDreh != null && isFinite(vorherDreh) && diff(vorherDreh, th2) < diff(vorherDreh, th)) ? th2 : th;
    return { x: p[0], y: p[1], dreh: Math.round(dreh * 100) / 100, dicke: dicke, typ: typ, laenge: e.L, s: s };
  }

  var api = {
    TOL: TOL, STD: STD, umlauf: umlauf, kanten: kanten, waende: waende, wandVieleck: wandVieleck,
    eckenVerlaengerung: eckenVerlaengerung, naechsteKante: naechsteKante, bindungPos: bindungPos,
    abstandPunktStrecke: abstandPunktStrecke, istBalkon: istBalkon,
    massstuecke: massstuecke, punktImVieleck: punktImVieleck, streckeFrei: streckeFrei
  };
  wurzel.GRUNDRISS_GEO = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
