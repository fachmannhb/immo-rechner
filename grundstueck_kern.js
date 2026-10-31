/* Rechenkern „Grundstück“ (Welle E, Teil 1), rein, läuft auch in Node (tmp/grundstueck_kern_test.js); Oberfläche: grundriss_grundstueck.js.
   Hausumriss = Hüllrechteck der Räume des untersten Geschosses (plan.etagen[0], Räume der Art „balkon“ ausgenommen) einschließlich Außenwand (etagen[0].aussenwand; fehlt der Wert, gilt 0,30 m wie in der Zeichnung, als sichtbare Annahme). Grundstück = Rechteck.
   Neue Bausteine bekommen den ersten freien Platz (Raster 0,5 m, mindestens 0,5 m Abstand zu Haus, Grundstücksgrenze und anderen Bausteinen), zuerst im Garten unterhalb des Hauses (es gibt kein Straßenfeld: unterer Bereich des Bildes).
   Plan-Felder (optional, alte Pläne laden unverändert): plan.grundstueck { breite_m, tiefe_m, haus_x_m, haus_y_m } und plan.aussen [ { id, art, x_m, y_m, breite_m, tiefe_m, hoehe_m } ].
   Die Genehmigungs-Ampel kommt aus anbau_kern.js (AK.verfahrensfrei, dieselbe Rechnung und dieselben Texte wie in der Karte Anbau); Preise, Pflichten und Kennzahlen aus daten/grundstueck.js.
   Es werden nur gemessene Abstände in Metern gezeigt, nie ein Urteil über Abstandsflächen (R078). */
(function (root) {
  'use strict';
  var AK = root.ANBAU_KERN || (typeof require === 'function' ? require('./anbau_kern.js') : null);

  /* Annahmen (in der Seite als Annahme gekennzeichnet) */
  /* aussenwand: Standarddicke der Zeichnung (grundriss.js, neueEtage); abstand: Mindestabstand beim Setzen neuer Bausteine; platzMin: kleine Bausteine brauchen im Bild mindestens so viel Platz (Symbol und Fokus erkennbar) */
  var ANNAHMEN = { rand: 3, minBreite: 15, minTiefe: 20, aussenwand: 0.3, abstand: 0.5, platzMin: 1.5 };
  var RASTER = 0.5;
  var GRUND_MIN = 5, GRUND_MAX = 300, MASS_MIN = 0.3, HOEHE_MAX = 30, MAX_BAUSTEINE = 40;
  /* Startgrößen je Baustein in Metern (Annahme, eigene Wahl): b = Breite, t = Tiefe, h = Höhe (Pool: Wassertiefe; Kleinwind: freie Höhe), max = größte Breite und Tiefe am Regler */
  var ARTEN = [
    { id: 'gartenhaus', b: 3, t: 3, h: 2.5, max: 12 },
    { id: 'garage_carport', b: 3, t: 6, h: 2.5, max: 20 },
    { id: 'terrassendach', b: 4, t: 3, h: 2.5, max: 15 },
    { id: 'sauna', b: 2.5, t: 2.5, h: 2.4, max: 8 },
    { id: 'pool', b: 6, t: 3, h: 1.5, max: 20 },
    { id: 'gewaechshaus', b: 3, t: 2.5, h: 2.5, max: 15 },
    { id: 'brunnen', b: 1, t: 1, h: 1, max: 3 },
    { id: 'regentank', b: 2, t: 2, h: 2, max: 8 },
    { id: 'kleinwind', b: 1, t: 1, h: 9, max: 4 },
    { id: 'waermepumpe', b: 1, t: 0.8, h: 1.2, max: 3 },
    { id: 'wallbox', b: 0.5, t: 0.3, h: 1.5, max: 2 },
    { id: 'huehnerstall', b: 2, t: 1.5, h: 1.5, max: 8 },
    { id: 'bienenstock', b: 1, t: 1, h: 1, max: 3 },
    { id: 'fischteich', b: 4, t: 3, h: 1.5, max: 20 }
  ];
  function artInfo(id) { for (var i = 0; i < ARTEN.length; i++) if (ARTEN[i].id === id) return ARTEN[i]; return null; }
  function zahlOk(x) { return typeof x === 'number' && isFinite(x); }
  function klemme(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function GD() { return root.DATEN && root.DATEN.grundstueck; }

  /* ---------- Haus ---------- */
  function hausUmriss(plan) {
    var e = plan && plan.etagen && plan.etagen[0];
    if (!e || !Array.isArray(e.raeume)) return null;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, n = 0;
    e.raeume.forEach(function (r) {
      if (r && r.art === 'balkon') return;   /* Balkon, Loggia, Terrasse (art „balkon“) zählen nicht ins Hüllrechteck */
      (r.punkte || []).forEach(function (p) {
        if (!zahlOk(p[0]) || !zahlOk(p[1])) return;
        n++; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      });
    });
    if (!n || !(x1 > x0) || !(y1 > y0)) return null;
    /* Außenwand liegt außen am Umriss (grundriss_geo.js): das Hüllrechteck wächst auf jeder Seite um die Wanddicke */
    var wandPlan = zahlOk(e.aussenwand), d = wandPlan ? klemme(e.aussenwand, 0.05, 0.8) : ANNAHMEN.aussenwand;
    var bb = x1 - x0 + 2 * d, tt = y1 - y0 + 2 * d;
    return { x0: x0 - d, y0: y0 - d, b: r2(bb), t: r2(tt), flaeche: r2(bb * tt), etage: e.name || '', wand: d, wandAnnahme: !wandPlan, raumB: r2(x1 - x0), raumT: r2(y1 - y0) };
  }
  /* Start: Grundstück so groß, dass das Haus mit je 3 m Rand passt (mindestens 15 × 20 m), Haus in der Mitte */
  function startGrund(haus) {
    var hb = haus ? haus.b : 0, ht = haus ? haus.t : 0;
    var b = Math.max(ANNAHMEN.minBreite, Math.ceil(hb + 2 * ANNAHMEN.rand)), t = Math.max(ANNAHMEN.minTiefe, Math.ceil(ht + 2 * ANNAHMEN.rand));
    return { breite: b, tiefe: t, hausX: r2((b - hb) / 2), hausY: r2((t - ht) / 2) };
  }

  /* ---------- Plan lesen (tolerant) ---------- */
  function normalisiere(plan) {
    var haus = hausUmriss(plan), meld = [];
    var pg = plan && plan.grundstueck && typeof plan.grundstueck === 'object' && !Array.isArray(plan.grundstueck) ? plan.grundstueck : null;
    var st = startGrund(haus);
    var g = { breite: st.breite, tiefe: st.tiefe, hausX: st.hausX, hausY: st.hausY, explizit: { groesse: false, lage: false } };
    if (pg) {
      if (zahlOk(pg.breite_m)) { g.breite = klemme(pg.breite_m, GRUND_MIN, GRUND_MAX); g.explizit.groesse = true; }
      if (zahlOk(pg.tiefe_m)) { g.tiefe = klemme(pg.tiefe_m, GRUND_MIN, GRUND_MAX); g.explizit.groesse = true; }
      if (zahlOk(pg.haus_x_m) || zahlOk(pg.haus_y_m)) g.explizit.lage = true;
      /* Lage nur dann aus dem Plan, wenn die Größe nicht automatisch ist: fehlt eine Angabe, gilt die Mitte */
      g.hausX = zahlOk(pg.haus_x_m) ? pg.haus_x_m : r2((g.breite - (haus ? haus.b : 0)) / 2);
      g.hausY = zahlOk(pg.haus_y_m) ? pg.haus_y_m : r2((g.tiefe - (haus ? haus.t : 0)) / 2);
    }
    if (haus) {
      if (haus.b > g.breite || haus.t > g.tiefe) meld.push({ typ: 'hausZuGross', hausB: haus.b, hausT: haus.t });
      var mx = Math.max(0, g.breite - haus.b), my = Math.max(0, g.tiefe - haus.t);
      var nx = r2(klemme(g.hausX, 0, mx)), ny = r2(klemme(g.hausY, 0, my));
      if (g.explizit.lage && (Math.abs(nx - g.hausX) > 0.005 || Math.abs(ny - g.hausY) > 0.005)) meld.push({ typ: 'hausVerschoben' });
      g.hausX = nx; g.hausY = ny;
    }
    var roh = plan && Array.isArray(plan.aussen) ? plan.aussen : [];
    var items = [], ids = {};
    roh.forEach(function (it, i) {
      if (!it || typeof it !== 'object') return;
      var a = typeof it.art === 'string' ? artInfo(it.art) : null;
      if (!a) { meld.push({ typ: 'unbekannteArt', art: String(it && it.art), nr: i + 1 }); return; }
      if (items.length >= MAX_BAUSTEINE) { if (!meld.some(function (m) { return m.typ === 'zuViele'; })) meld.push({ typ: 'zuViele', max: MAX_BAUSTEINE }); return; }
      var id = typeof it.id === 'string' && /^[a-z0-9_]{1,12}$/.test(it.id) && !ids[it.id] ? it.id : 'a' + (i + 1) + 'x';
      ids[id] = true;
      var w = klemme(zahlOk(it.breite_m) ? it.breite_m : a.b, MASS_MIN, Math.min(a.max, g.breite));
      var t = klemme(zahlOk(it.tiefe_m) ? it.tiefe_m : a.t, MASS_MIN, Math.min(a.max, g.tiefe));
      var h = klemme(zahlOk(it.hoehe_m) ? it.hoehe_m : a.h, MASS_MIN, HOEHE_MAX);
      var x0 = zahlOk(it.x_m) ? it.x_m : (g.breite - w) / 2, y0 = zahlOk(it.y_m) ? it.y_m : (g.tiefe - t) / 2;
      var x = klemme(x0, 0, g.breite - w), y = klemme(y0, 0, g.tiefe - t);
      var o = { id: id, art: a.id, x: r2(x), y: r2(y), b: r2(w), t: r2(t), h: r2(h), hoeheEigen: zahlOk(it.hoehe_m) };
      /* Welle E, Teil 1c: Ofen der Sauna und Baugebiet der Kleinwindanlage (Start: Elektro-Ofen, allgemeines Wohngebiet; *Eigen = der Nutzer hat gewählt, sonst gilt die Annahme) */
      if (a.id === 'sauna') { o.ofenEigen = it.ofen === 'holz' || it.ofen === 'elektro'; o.ofen = it.ofen === 'holz' ? 'holz' : AK.ANNAHMEN.ofen; }
      if (a.id === 'kleinwind') { o.gebietEigen = it.gebiet === 'wr' || it.gebiet === 'wa' || it.gebiet === 'gw'; o.gebiet = it.gebiet === 'wr' || it.gebiet === 'gw' ? it.gebiet : AK.ANNAHMEN.gebiet; }
      if (Math.abs(o.x - x0) > 0.005 || Math.abs(o.y - y0) > 0.005) { o.verschoben = true; meld.push({ typ: 'verschoben', id: id, art: a.id }); }
      items.push(o);
    });
    return { haus: haus, g: g, items: items, meldungen: meld };
  }

  /* ---------- Abstände und Flächen ---------- */
  function abstaende(s) {
    if (!s.haus) return null;
    var g = s.g, h = s.haus;
    return { links: r2(g.hausX), rechts: r2(g.breite - (g.hausX + h.b)), oben: r2(g.hausY), unten: r2(g.tiefe - (g.hausY + h.t)) };
  }
  function flaechen(s) {
    var grund = r2(s.g.breite * s.g.tiefe), haus = s.haus ? s.haus.flaeche : 0, bs = 0;
    s.items.forEach(function (it) { bs += it.b * it.t; });
    bs = r2(bs);
    var bebaut = r2(haus + bs);
    return { grund: grund, haus: haus, bausteine: bs, bebaut: bebaut, prozent: grund > 0 ? Math.round(bebaut / grund * 1000) / 10 : 0, frei: r2(grund - bebaut) };
  }

  /* ---------- Daten zu einem Baustein ---------- */
  function beleg(e) {
    var q = GD() && GD().quellen && GD().quellen[e.quelle];
    return { id: e.id, ref: e.ref || '', status: e.status, abruf: e.abruf, quelle: q ? q.titel : e.quelle, url: q ? q.url : '', hinweis: e.hinweis || '', grund: e.luecke_grund || '' };
  }
  function datenZu(artId) {
    var d = GD(), out = { kosten: [], pflichten: [], werte: [] };
    if (!d) return out;
    ['kosten', 'pflichten', 'werte'].forEach(function (k) {
      (d[k] || []).forEach(function (e) {
        if (e.baustein !== artId) return;
        var b = beleg(e);
        out[k].push(Object.assign({ name: e.name, einheit: e.einheit || '', von: typeof e.von === 'number' ? e.von : null, bis: typeof e.bis === 'number' ? e.bis : null, luecke: e.status === 'Lücke' }, b));
      });
    });
    return out;
  }

  /* ---------- Alles zusammen ---------- */
  function rechne(plan) {
    var s = normalisiere(plan), land = AK.planLand(plan);
    s.land = land; s.landName = AK.rechne({ land: land }).landName;
    s.abstaende = abstaende(s);
    s.flaechen = flaechen(s);
    s.zaehlung = { gruen: 0, gelb: 0, rot: 0, grau: 0 };
    s.items.forEach(function (it) {
      it.flaeche = r2(it.b * it.t);
      /* Tiefe nur für das Terrassendach (Bremen: Vorbau bis 3,50 m Tiefe); Annahme: die Tiefe des Bausteins (t) ist die Tiefe senkrecht zur Außenwand, der Text legt die Bezugsgröße nicht fest */
      it.vf = AK.verfahrensfrei(it.art, land, it.flaeche, it.h, it.art === 'terrassendach' ? it.t : null, { ofen: it.ofen, gebiet: it.gebiet });
      it.ampel = it.vf && it.vf.ok ? it.vf.summe.ampel : 'grau';
      s.zaehlung[it.ampel]++;
      it.daten = datenZu(it.art);
    });
    return s;
  }

  /* ---------- Bearbeiten (schreibt direkt in den Plan; der Aufrufer ruft danach GRUNDRISS.geaendert()) ---------- */
  function neueId(plan) {
    var n = 0;
    (plan.aussen || []).forEach(function (it) { var m = /^a(\d+)$/.exec(it && it.id || ''); if (m) n = Math.max(n, +m[1]); });
    return 'a' + (n + 1);
  }
  function ueberlappt(a, b) { return a.x < b.x + b.b && b.x < a.x + a.b && a.y < b.y + b.t && b.y < a.y + a.t; }
  /* Platzbedarf im Bild: kleine Bausteine werden mindestens platzMin groß gezeichnet; der Kasten liegt um die echte Lage zentriert */
  function platzKasten(o) {
    var eb = Math.max(o.b, ANNAHMEN.platzMin), et = Math.max(o.t, ANNAHMEN.platzMin);
    return { x: o.x - (eb - o.b) / 2, y: o.y - (et - o.t) / 2, b: eb, t: et };
  }
  /* erster freier Platz: Raster 0,5 m, mindestens 0,5 m Abstand zu Haus, Grundstücksgrenze und anderen Bausteinen.
     Zuerst der Garten unterhalb des Hauses (Zeilen von oben nach unten, von links nach rechts), dann der ganze Rest; sonst die Mitte (frei: false). */
  function freiePosition(s, art) {
    var w = Math.min(art.b, s.g.breite), t = Math.min(art.t, s.g.tiefe), ab = ANNAHMEN.abstand;
    var eb = Math.max(w, ANNAHMEN.platzMin), et = Math.max(t, ANNAHMEN.platzMin), dx = (eb - w) / 2, dy = (et - t) / 2;
    var sperr = [];
    if (s.haus) sperr.push({ x: s.g.hausX, y: s.g.hausY, b: s.haus.b, t: s.haus.t });
    s.items.forEach(function (it) { sperr.push(platzKasten(it)); });
    sperr = sperr.map(function (o) { return { x: o.x - ab, y: o.y - ab, b: o.b + 2 * ab, t: o.t + 2 * ab }; });
    var untenAb = s.haus ? s.g.hausY + s.haus.t + ab : 0;
    function suche(nurUnten) {
      var nx = Math.floor((s.g.breite - eb - 2 * ab) / RASTER + 1e-9), ny = Math.floor((s.g.tiefe - et - 2 * ab) / RASTER + 1e-9);
      for (var j = 0; j <= ny; j++) {
        var y = ab + j * RASTER;
        if (nurUnten && y < untenAb - 1e-9) continue;
        for (var i = 0; i <= nx; i++) {
          var x = ab + i * RASTER, k = { x: x, y: y, b: eb, t: et };
          if (!sperr.some(function (o) { return ueberlappt(k, o); })) return { x: r2(x + dx), y: r2(y + dy), frei: true };
        }
      }
      return null;
    }
    return (s.haus ? suche(true) : null) || suche(false) || { x: r2((s.g.breite - w) / 2), y: r2((s.g.tiefe - t) / 2), frei: false };
  }
  function schreibeGrundstueck(plan, s) {
    plan.grundstueck = { breite_m: r2(s.g.breite), tiefe_m: r2(s.g.tiefe), haus_x_m: r2(s.g.hausX), haus_y_m: r2(s.g.hausY) };
  }
  function bausteinHinzu(plan, artId) {
    var a = artInfo(artId);
    if (!a) return { ok: false, grund: 'unbekannteArt' };
    var s = normalisiere(plan);
    if (s.items.length >= MAX_BAUSTEINE) return { ok: false, grund: 'zuViele' };
    if (!plan.grundstueck) schreibeGrundstueck(plan, s);
    var p = freiePosition(s, a), id = neueId(plan);
    if (!Array.isArray(plan.aussen)) plan.aussen = [];
    /* hoehe_m bleibt weg, bis der Nutzer sie einstellt: bis dahin gilt die Startannahme der Art und die Seite zeigt das Annahme-Schild */
    plan.aussen.push({ id: id, art: a.id, x_m: r2(p.x), y_m: r2(p.y), breite_m: Math.min(a.b, s.g.breite), tiefe_m: Math.min(a.t, s.g.tiefe) });
    return { ok: true, id: id, frei: p.frei };
  }
  function bausteinEntfernen(plan, id) {
    if (!Array.isArray(plan.aussen)) return false;
    var n = plan.aussen.length;
    plan.aussen = plan.aussen.filter(function (it) { return it && it.id !== id; });
    if (!plan.aussen.length) delete plan.aussen;
    return !plan.aussen || plan.aussen.length < n;
  }
  /* Feld eines Bausteins setzen (Meter); der Wert wird beim nächsten Lesen an den Rand geschoben */
  function bausteinSetzen(plan, id, feld, wert) {
    var it = (plan.aussen || []).filter(function (x) { return x && x.id === id; })[0];
    if (!it || !zahlOk(wert)) return false;
    it[feld] = r2(wert);
    return true;
  }
  /* Auswahlfeld eines Bausteins setzen (Sauna: ofen = elektro | holz; Kleinwind: gebiet = wr | wa | gw); andere Werte werden abgelehnt */
  var OPTIONEN = { ofen: { art: 'sauna', werte: ['elektro', 'holz'] }, gebiet: { art: 'kleinwind', werte: ['wr', 'wa', 'gw'] } };
  function bausteinOption(plan, id, feld, wert) {
    var o = OPTIONEN[feld], it = (plan.aussen || []).filter(function (x) { return x && x.id === id; })[0];
    if (!o || !it || it.art !== o.art || o.werte.indexOf(wert) < 0) return false;
    it[feld] = wert;
    return true;
  }
  /* Rohwerte (auch nach dem Lesen unvollständige Bausteine) vollständig in den Plan schreiben, damit Ziehen und Tasten nur ein Feld ändern */
  function festschreiben(plan) {
    var s = normalisiere(plan);
    schreibeGrundstueck(plan, s);
    if (s.items.length || Array.isArray(plan.aussen)) {
      plan.aussen = s.items.map(function (it) {
        var o = { id: it.id, art: it.art, x_m: it.x, y_m: it.y, breite_m: it.b, tiefe_m: it.t };
        if (it.hoeheEigen) o.hoehe_m = it.h;
        if (it.ofenEigen) o.ofen = it.ofen;
        if (it.gebietEigen) o.gebiet = it.gebiet;
        return o;
      });
      if (!plan.aussen.length) delete plan.aussen;
    }
    return s;
  }
  function grundstueckSetzen(plan, feld, wert) {
    if (!zahlOk(wert)) return false;
    var s = festschreiben(plan);
    if (feld === 'breite_m') plan.grundstueck.breite_m = r2(klemme(wert, GRUND_MIN, GRUND_MAX));
    else if (feld === 'tiefe_m') plan.grundstueck.tiefe_m = r2(klemme(wert, GRUND_MIN, GRUND_MAX));
    else if (feld === 'haus_x_m' || feld === 'haus_y_m') plan.grundstueck[feld] = r2(wert);
    else return false;
    return !!s;
  }

  var API = {
    ANNAHMEN: ANNAHMEN, ARTEN: ARTEN, GRUND_MIN: GRUND_MIN, GRUND_MAX: GRUND_MAX, MASS_MIN: MASS_MIN, HOEHE_MAX: HOEHE_MAX, MAX_BAUSTEINE: MAX_BAUSTEINE,
    artInfo: artInfo, hausUmriss: hausUmriss, startGrund: startGrund, normalisiere: normalisiere, abstaende: abstaende, flaechen: flaechen, datenZu: datenZu, rechne: rechne,
    bausteinHinzu: bausteinHinzu, bausteinEntfernen: bausteinEntfernen, bausteinSetzen: bausteinSetzen, bausteinOption: bausteinOption, grundstueckSetzen: grundstueckSetzen, festschreiben: festschreiben, ueberlappt: ueberlappt,
    platzKasten: platzKasten
  };
  root.GRUNDSTUECK_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
