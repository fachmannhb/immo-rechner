/* Regelkern für „Grundriss und Einrichtung“ (Welle C): reine Rechenfunktionen, ohne Oberfläche.
   Liest daten/bauregeln.js (schlanke Fassung) und daten/verfahrensfrei.js, prüft einen Plan gegen die Regeln des gewählten Bundeslandes
   und liefert Ergebnisse als Daten (Code, Stufe, Zahlen, Belege). Die Texte baut grundriss_regeln.js über daten/texte.js.
   Läuft auch in Node (tmp/regel_kern_test.js, tmp/regel_test.py): dort vorher grundriss_geo.js und die Daten laden.
   Stufen: gruen = erfüllt, gelb = Hinweis oder Ausnahme oder prüfen, rot = Wert der Landesbauordnung verfehlt, info = Hinweis ohne Ampelwirkung.
   Keine Rechtsberatung: Genehmigung und Statik prüfen Bauamt und Fachleute; eigene Einordnungen (Faustregeln) sind als solche markiert (R078). */
(function (root) {
  'use strict';

  var LAENDER = [
    { k: 'BW', name: 'Baden-Württemberg', stadt: 'Stuttgart' }, { k: 'BY', name: 'Bayern', stadt: 'München' },
    { k: 'BE', name: 'Berlin', stadt: 'Berlin' }, { k: 'BB', name: 'Brandenburg', stadt: 'Potsdam' },
    { k: 'HB', name: 'Bremen', stadt: 'Bremen' }, { k: 'HH', name: 'Hamburg', stadt: 'Hamburg' },
    { k: 'HE', name: 'Hessen', stadt: 'Wiesbaden' }, { k: 'MV', name: 'Mecklenburg-Vorpommern', stadt: 'Schwerin' },
    { k: 'NI', name: 'Niedersachsen', stadt: 'Hannover' }, { k: 'NW', name: 'Nordrhein-Westfalen', stadt: 'Düsseldorf' },
    { k: 'RP', name: 'Rheinland-Pfalz', stadt: 'Mainz' }, { k: 'SL', name: 'Saarland', stadt: 'Saarbrücken' },
    { k: 'SN', name: 'Sachsen', stadt: 'Dresden' }, { k: 'ST', name: 'Sachsen-Anhalt', stadt: 'Magdeburg' },
    { k: 'SH', name: 'Schleswig-Holstein', stadt: 'Kiel' }, { k: 'TH', name: 'Thüringen', stadt: 'Erfurt' }
  ];
  var NUTZUNGEN = ['wohnen', 'schlafen', 'kind', 'arbeiten', 'kueche', 'essen', 'bad', 'wc', 'flur', 'abstell', 'technik', 'treppe', 'sonstiges'];
  /* Aufenthaltsräume: Räume zum längeren Aufenthalt (Küche zählt mit, eine Kochnische nicht) */
  var AUFENTHALT = { wohnen: 1, schlafen: 1, kind: 1, arbeiten: 1, kueche: 1, essen: 1 };
  var GK_TEXTE = ['', 'gk1', 'gk2', 'gk3', 'gk4', 'gk5'];

  var datumFest = null;
  function heute() {
    if (datumFest) return datumFest;
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Für Prüfungen: Stichtag festlegen (z. B. '2027-01-01'); ohne Wert gilt wieder die Uhr */
  function setzeDatum(d) { datumFest = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null; }

  function landOk(k) { return LAENDER.some(function (l) { return l.k === k; }); }
  function landInfo(k) { return LAENDER.filter(function (l) { return l.k === k; })[0] || LAENDER[4]; }

  /* ---------- Daten ---------- */
  function normieren(d) {
    if (!d || d._norm) return d;
    var s = d.status_std || 'geprüft', a = d.abruf_std || '';
    Object.keys(d.laender || {}).forEach(function (k) {
      var gruppe = d.laender[k].regeln || d.laender[k].strukturen || {};
      Object.keys(gruppe).forEach(function (th) {
        gruppe[th].forEach(function (e) { if (!e.status) e.status = s; if (!e.abruf) e.abruf = a; });
      });
    });
    d._norm = true;
    return d;
  }
  function daten() { return normieren(root.DATEN && root.DATEN.bauregeln); }
  function datenVf() { return normieren(root.DATEN && root.DATEN.verfahrensfrei); }

  /* Eintrag, der am Stichtag gilt (gilt_ab / gilt_bis); nichts Passendes: null */
  function aktiv(liste, datum) {
    var treffer = (liste || []).filter(function (e) { return (!e.gilt_ab || e.gilt_ab <= datum) && (!e.gilt_bis || datum <= e.gilt_bis); });
    treffer.sort(function (a, b) { return (a.gilt_ab || '').localeCompare(b.gilt_ab || ''); });
    return treffer.length ? treffer[treffer.length - 1] : null;
  }
  function regel(land, thema, datum) {
    var d = daten(), l = d && d.laender[land];
    if (!l) return null;
    var e = aktiv(l.regeln[thema], datum || heute());
    return e ? Object.assign({ thema: thema, land: land }, e) : null;
  }
  /* Zahl mit Rückfall auf die frühere Fassung, wenn die gültige Fassung nur Text hat (Bremen 2027) */
  function regelMitWert(land, thema, datum) {
    var e = regel(land, thema, datum);
    if (e && e.status !== 'Lücke' && e.wert != null) return e;
    var d = daten(), l = d && d.laender[land];
    var alt = ((l && l.regeln[thema]) || []).filter(function (x) { return x.status !== 'Lücke' && x.wert != null; });
    if (!alt.length) return e;
    var f = Object.assign({ thema: thema, land: land, rueckfall: true }, alt[alt.length - 1]);
    return f;
  }
  function istLuecke(e) { return !e || e.status === 'Lücke'; }

  /* Beleg für die Anzeige: jede Zahl hat Quelle, Abrufdatum, Status und (bei Kernregeln) den Wortlaut */
  function quellenListe(land, e) {
    var d = daten(), out = [];
    (e.quelle || []).forEach(function (k) {
      var q = d && d.quellen && d.quellen[k]; if (!q || k === 'KEINE') return;
      var url = q.url, num = e.paragraf && /§\s*(\d+[a-z]?)/.exec(e.paragraf);
      if (q.muster && num) url = q.muster.replace('{n}', num[1]);
      out.push({ key: k, titel: q.titel, url: url || null });
    });
    return out;
  }
  function beleg(land, thema, e) {
    if (!e) return null;
    var d = daten(), t = d && d.themen[thema];
    return {
      thema: thema, titel: t ? t.titel : thema, status: e.status, abruf: e.abruf, paragraf: e.paragraf || '',
      text: e.text || '', wortlaut: e.wortlaut || '', gekuerzt: !!e.wortlaut_gekuerzt, hinweis: e.hinweis || '',
      gilt_ab: e.gilt_ab || '', gilt_bis: e.gilt_bis || '', rueckfall: !!e.rueckfall,
      lbo: d && d.laender[land] ? d.laender[land].lbo.titel : '', quellen: quellenListe(land, e)
    };
  }

  /* ---------- Geometrie ---------- */
  function flaecheVon(p) {
    var a = 0;
    for (var i = 0; i < p.length; i++) { var q = p[i], r = p[(i + 1) % p.length]; a += q[0] * r[1] - r[0] * q[1]; }
    return Math.abs(a) / 2;
  }
  function imVieleck(x, y, p) {
    var drin = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) drin = !drin;
    }
    return drin;
  }
  function ecken(t) {
    var r = (t.dreh || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), hw = t.w / 2, hd = t.d / 2;
    return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(function (q) { return [t.x + q[0] * c - q[1] * s, t.y + q[0] * s + q[1] * c]; });
  }
  /* Überschneiden sich zwei Vielecke (konvex)? eps = Mindesttiefe der Überlappung in Metern */
  function schneiden(A, B, eps) {
    function achsen(P) {
      var o = [];
      for (var i = 0; i < P.length; i++) {
        var q = P[i], r = P[(i + 1) % P.length], dx = r[0] - q[0], dy = r[1] - q[1], l = Math.hypot(dx, dy);
        if (l > 1e-9) o.push([-dy / l, dx / l]);
      }
      return o;
    }
    var ax = achsen(A).concat(achsen(B));
    for (var k = 0; k < ax.length; k++) {
      var a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      A.forEach(function (p) { var v = p[0] * ax[k][0] + p[1] * ax[k][1]; a0 = Math.min(a0, v); a1 = Math.max(a1, v); });
      B.forEach(function (p) { var v = p[0] * ax[k][0] + p[1] * ax[k][1]; b0 = Math.min(b0, v); b1 = Math.max(b1, v); });
      if (a1 - b0 <= eps || b1 - a0 <= eps) return false;
    }
    return true;
  }
  /* kleinste Seite des kleinsten umschließenden Rechtecks eines Raums = „Breite“ (Meter) */
  function raumBreite(p) {
    var best = Infinity, bestA = Infinity;
    for (var i = 0; i < p.length; i++) {
      var q = p[i], r = p[(i + 1) % p.length], dx = r[0] - q[0], dy = r[1] - q[1], l = Math.hypot(dx, dy);
      if (l < 1e-9) continue;
      var ux = dx / l, uy = dy / l, u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
      p.forEach(function (z) { var u = z[0] * ux + z[1] * uy, v = -z[0] * uy + z[1] * ux; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); });
      var A = (u1 - u0) * (v1 - v0);
      if (A < bestA) { bestA = A; best = Math.min(u1 - u0, v1 - v0); }
    }
    return isFinite(best) ? best : 0;
  }

  /* ---------- Katalog ---------- */
  function katalog() {
    var m = {};
    ((root.DATEN && root.DATEN.moebel && root.DATEN.moebel.artikel) || []).forEach(function (a) { m[a.id] = a; });
    return m;
  }
  function istFenster(ART, t) { var a = ART[t.art]; return !!a && a.form === 'fenster'; }
  function istTuer(ART, t) { var a = ART[t.art]; return !!a && a.form === 'tuer'; }
  var KEIN_MOEBEL = { fenster: 1, tuer: 1, wand: 1, wandweg: 1, flaeche: 1, treppeoben: 1 };
  function istMoebel(ART, t) { var a = ART[t.art]; return !!a && !KEIN_MOEBEL[a.form]; }

  /* ---------- Nutzung eines Raums ---------- */
  var NAMEN = [
    ['treppe', /treppe|stiege/i], ['wc', /\bwc\b|toilette|\bklo\b/i], ['bad', /bad|dusch|wanne/i],
    ['technik', /hwr|technik|heiz|hauswirtschaft|waschk|waschr/i], ['abstell', /abstell|speisekammer|vorrat|lager|ankleide/i],
    ['flur', /flur|diele|eingang|galerie|vorraum|windfang|garderobe/i], ['schlafen', /schlaf|eltern|gäste|gaeste|\bgast/i],
    ['kind', /kind|jugend|baby/i], ['arbeiten', /arbeit|büro|buero|homeoffice|studio|werkstatt/i],
    ['wohnen', /wohn|stube|salon/i], ['kueche', /küche|kueche|koch/i], ['essen', /\bess|esszimmer/i]
  ];
  function nutzungAusName(name) {
    var n = String(name || '');
    for (var i = 0; i < NAMEN.length; i++) if (NAMEN[i][1].test(n)) return NAMEN[i][0];
    return '';
  }
  function nutzungVon(r) { return NUTZUNGEN.indexOf(r.nutzung) >= 0 ? r.nutzung : (nutzungAusName(r.name) || ''); }

  /* ---------- Geschosse ---------- */
  /* Art der Etage nach Name und Reihenfolge: keller | eg | og | dach; ebene = Geschosse über dem Erdgeschoss; boden = Fußbodenhöhe über Gelände (m) */
  function etagenInfo(plan) {
    var et = plan.etagen, g = -1, i;
    for (i = 0; i < et.length; i++) if (/erdgeschoss|^eg\b|parterre/i.test(et[i].name)) { g = i; break; }
    if (g < 0) { for (i = 0; i < et.length; i++) if (!/keller|untergeschoss|^ug\b/i.test(et[i].name)) { g = i; break; } }
    if (g < 0) g = 0;
    var boden = 0;
    return et.map(function (e, idx) {
      var typ = idx < g || /keller|untergeschoss|^ug\b/i.test(e.name) ? 'keller' : idx === g ? 'eg' : /dach/i.test(e.name) ? 'dach' : 'og';
      var info = { typ: typ, ebene: typ === 'keller' ? -1 : idx - g, boden: typ === 'keller' ? 0 : boden };
      if (idx >= g) boden += (e.hoehe || 2.5) + (e.decke || 0.25);
      return info;
    });
  }

  /* ---------- Gebäudeklasse ---------- */
  /* Vorschlag aus dem Plan: Höhe = Fußboden des obersten Geschosses mit Aufenthaltsräumen über Gelände; Fläche = geschätzte Brutto-Grundfläche
     (Summe der Raumflächen über dem Gelände geteilt durch 0,85 für die Wände; Keller zählt nicht). Eingaben des Nutzers: freistehend, Wohnungen. */
  function gebaeudeklasse(plan) {
    var info = etagenInfo(plan), hoehe = 0, netto = 0;
    plan.etagen.forEach(function (e, i) {
      if (info[i].typ === 'keller') return;
      var hat = e.raeume.some(function (r) { return r.art === 'voll'; });
      if (hat) hoehe = Math.max(hoehe, info[i].boden);
      e.raeume.forEach(function (r) { if (r.art === 'voll') netto += flaecheVon(r.punkte); });
    });
    var bgf = netto / 0.85, wohnungen = Math.max(1, plan.wohnungen || 1), frei = plan.freistehend !== false, v;
    if (hoehe <= 7 && wohnungen <= 2 && bgf <= 400) v = frei ? 1 : 2;
    else if (hoehe <= 7) v = 3;
    else if (hoehe <= 13) v = 4;
    else v = 5;
    return { vorschlag: v, hoehe: Math.round(hoehe * 100) / 100, bgf: Math.round(bgf), wohnungen: wohnungen, freistehend: frei, gewaehlt: plan.gebaeudeklasse || 0, wirksam: plan.gebaeudeklasse || v };
  }

  /* ---------- Treppen und Wohnfläche (WoFlV § 3 Abs. 3 Nr. 2) ---------- */
  /* Treppen mit mehr als drei Steigungen und ihre Treppenabsätze zählen nicht zur Wohnfläche: Grundfläche der Treppe (und der Treppenöffnung im
     Geschoss darüber), deren Mitte im Raum liegt. */
  function treppenAbzug(e, r, ART) {
    var s = 0;
    (e.teile || []).forEach(function (t) {
      var a = ART[t.art];
      if (!a || (a.form !== 'treppe' && a.form !== 'treppeoben')) return;
      var w = t.w != null ? t.w : a.breite / 100, d = t.d != null ? t.d : a.tiefe / 100;
      if (imVieleck(t.x, t.y, r.punkte)) s += w * d;
    });
    return Math.min(s, flaecheVon(r.punkte));
  }

  /* ---------- Freiflächen vor Möbeln ---------- */
  function wandVielecke(e) {
    var GEO = root.GRUNDRISS_GEO; if (!GEO) return [];
    var wl = GEO.waende(e);
    return wl.map(function (w) { return GEO.wandVieleck(w, GEO.eckenVerlaengerung(e, w)); });
  }
  /* Mitte einer Seite eines Teils: lokale Richtung (ux,uy) = (±1,0) oder (0,±1), Abstand h */
  function seitenPunkt(t, lx, ly, extra) {
    var r = (t.dreh || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), hw = t.w / 2 + extra, hd = t.d / 2 + extra;
    var x = lx * hw, y = ly * hd;
    return [t.x + x * c - y * s, t.y + x * s + y * c];
  }
  function nahAnWand(p, waende, grenze) {
    for (var i = 0; i < waende.length; i++) {
      var W = waende[i];
      if (imVieleck(p[0], p[1], W)) return true;
      for (var k = 0; k < W.length; k++) {
        var a = W[k], b = W[(k + 1) % W.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, u = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
        if (Math.hypot(p[0] - (a[0] + u * dx), p[1] - (a[1] + u * dy)) < grenze) return true;
      }
    }
    return false;
  }
  /* Freiflächen aller Möbel mit Katalogfeld frei (cm): Liste {id, art, zone:[Ecken], zone2:[Ecken]|null, tiefe, konflikt, mit}.
     Vorn = die Seite, die von der nächsten Wand wegzeigt (Möbel stehen mit dem Rücken zur Wand); steht das Teil frei, gilt die untere Seite (+y). */
  function freiflaechen(e, ART) {
    var waende = wandVielecke(e), out = [];
    var hindernis = (e.teile || []).filter(function (t) { return istMoebel(ART, t) || (ART[t.art] && ART[t.art].form === 'treppe'); });
    (e.teile || []).forEach(function (t) {
      var a = ART[t.art]; if (!a || !(a.frei > 0) || !istMoebel(ART, t)) return;
      var f = a.frei / 100, zonen = [], seiten = a.freiArt === 'seiten' ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1], [1, 0], [-1, 0]];
      if (a.freiArt === 'seiten') {
        seiten.forEach(function (sd) {
          if (nahAnWand(seitenPunkt(t, sd[0], sd[1], 0.12), waende, 0.28)) return;     /* Bett an der Wand: diese Seite entfällt */
          zonen.push(sd);
        });
      } else {
        var wandSeite = null, best = Infinity;
        seiten.forEach(function (sd) {
          var p = seitenPunkt(t, sd[0], sd[1], 0.12);
          var dmin = Infinity;
          waende.forEach(function (W) {
            if (imVieleck(p[0], p[1], W)) dmin = 0;
            for (var k = 0; k < W.length; k++) {
              var A = W[k], B = W[(k + 1) % W.length], dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy, u = L2 ? Math.max(0, Math.min(1, ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / L2)) : 0;
              dmin = Math.min(dmin, Math.hypot(p[0] - (A[0] + u * dx), p[1] - (A[1] + u * dy)));
            }
          });
          if (dmin < 0.28 && dmin < best) { best = dmin; wandSeite = sd; }
        });
        zonen.push(wandSeite ? [-wandSeite[0], -wandSeite[1]] : [0, 1]);
      }
      zonen.forEach(function (sd) {
        var r = (t.dreh || 0) * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), hw = t.w / 2, hd = t.d / 2;
        var loc;
        if (sd[1] !== 0) loc = [[-hw, sd[1] * hd], [hw, sd[1] * hd], [hw, sd[1] * (hd + f)], [-hw, sd[1] * (hd + f)]];
        else loc = [[sd[0] * hw, -hd], [sd[0] * (hw + f), -hd], [sd[0] * (hw + f), hd], [sd[0] * hw, hd]];
        var zone = loc.map(function (q) { return [t.x + q[0] * c - q[1] * s, t.y + q[0] * s + q[1] * c]; });
        var mit = null, konflikt = false;
        if (waende.some(function (W) { return schneiden(zone, W, 0.02); })) { konflikt = true; mit = 'wand'; }
        else {
          var anderes = hindernis.filter(function (o) { return o.id !== t.id && schneiden(zone, ecken(o), 0.02); })[0];
          if (anderes) { konflikt = true; mit = anderes.art; }
        }
        out.push({ id: t.id, art: t.art, zone: zone, tiefe: a.frei, konflikt: konflikt, mit: mit });
      });
    });
    return out;
  }

  /* ---------- Bewegungsfläche (Quadrat s × s Meter, frei von Möbeln, im Raum) ---------- */
  function freiesQuadrat(r, hindernisse, s) {
    var xs = r.punkte.map(function (p) { return p[0]; }), ys = r.punkte.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), h = s / 2, st = 0.15;
    for (var cx = x0 + h; cx <= x1 - h + 1e-9; cx += st) {
      for (var cy = y0 + h; cy <= y1 - h + 1e-9; cy += st) {
        var pr = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h], [cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]];
        if (!pr.every(function (p) { return imVieleck(p[0] * 0.999 + cx * 0.001, p[1] * 0.999 + cy * 0.001, r.punkte); })) continue;
        var q = pr.slice(0, 4);
        if (hindernisse.every(function (o) { return !schneiden(q, o, 0.01); })) return true;
      }
    }
    return false;
  }

  /* ---------- Prüfung ---------- */
  function zahlenDe(x, n) { return (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n).replace('.', ','); }

  function pruefe(plan, opt) {
    opt = opt || {};
    var land = landOk(opt.land || plan.land) ? (opt.land || plan.land) : 'HB', datum = opt.datum || heute(), ART = katalog();
    var d = daten(), gk = gebaeudeklasse(plan), info = etagenInfo(plan), wohnungen = gk.wohnungen;
    var res = { land: land, datum: datum, gk: gk, wohnungen: wohnungen, raeume: [], haus: null, summe: { gruen: 0, gelb: 0, rot: 0 }, daten: !!d };
    if (!d || !d.laender[land]) { res.fehler = 'daten'; return res; }
    var bf = regelMitWert(land, 'barrierefrei', datum), barriere = bf && bf.wert > 0 && wohnungen > bf.wert;

    function item(code, stufe, par, themen, extra) {
      var belege = [];
      (themen || []).forEach(function (th) {
        var e = th.e !== undefined ? th.e : regelMitWert(land, th, datum);
        var nm = th.e !== undefined ? th.t : th;
        if (e && !istLuecke(e)) belege.push(beleg(land, nm, e));
        else if (e) belege.push({ thema: nm, titel: (d.themen[nm] || {}).titel || nm, status: 'Lücke', abruf: e.abruf, text: e.luecke_grund || '', lbo: d.laender[land].lbo.titel, quellen: [] });
      });
      return Object.assign({ code: code, stufe: stufe, par: par || {}, belege: belege }, extra || {});
    }
    function schlechter(a, b) { var r = { gruen: 0, info: 0, gelb: 1, rot: 2 }; return (r[b] || 0) > (r[a] || 0) ? b : a; }

    var rauchE = regel(land, 'rauchmelder', datum);
    var rhE = regelMitWert(land, 'raumhoehe', datum), rhDachE = regelMitWert(land, 'raumhoehe_dach', datum), ausE = regel(land, 'ausnahme_gk12', datum);
    var fensterE = regelMitWert(land, 'fensterflaeche', datum), rettE = regelMitWert(land, 'rettungsfenster', datum), ukE = regelMitWert(land, 'rettungsfenster_unterkante', datum);
    var brE = regelMitWert(land, 'bruestung', datum);
    var rw = (d.bund && d.bund.richtwerte) || [];
    function richt(id) { return rw.filter(function (x) { return x.id === id; })[0]; }
    function richtBeleg(id) {
      var x = richt(id); if (!x) return null;
      return { thema: 'richtwert', titel: x.gilt_fuer, status: x.status, abruf: x.abruf, paragraf: '', text: x.wert_text, wortlaut: x.wortlaut || '', gekuerzt: false, hinweis: '', gilt_ab: '', gilt_bis: '', lbo: '',
        quellen: (x.quelle || []).map(function (k) { var q = d.quellen && d.quellen[k]; return q ? { key: k, titel: q.titel, url: q.url } : null; }).filter(Boolean), eigen: true };
    }
    function richtInfo(code, id, par) {
      var b = richtBeleg(id), it = item(code, 'info', par, []);
      if (b) it.belege.push(b);
      it.eigen = true;
      return it;
    }

    plan.etagen.forEach(function (e, ei) {
      var ei_ = info[ei];
      var frei = null;
      e.raeume.forEach(function (r) {
        var z = { etage: e.name, etageIndex: ei, raum: r.id, name: r.name, nutzung: nutzungVon(r), nutzungGewaehlt: !!r.nutzung, art: r.art, flaeche: flaecheVon(r.punkte), pruefungen: [], ampel: 'neutral' };
        res.raeume.push(z);
        if (r.art !== 'voll') return;
        var nu = z.nutzung, aufenthalt = !!AUFENTHALT[nu], fl = z.flaeche;
        var fenster = (e.teile || []).filter(function (t) { return istFenster(ART, t) && t.bindung && t.bindung.raum === r.id; });
        var tueren = (e.teile || []).filter(function (t) { return istTuer(ART, t) && t.bindung && t.bindung.raum === r.id; });
        if (!nu) z.pruefungen.push(item('nutzung', 'gelb', {}, []));

        if (aufenthalt) {
          /* lichte Raumhöhe */
          var H = e.hoehe || 2.5, dach = ei_.typ === 'dach';
          if (dach && !istLuecke(rhDachE) && rhDachE.wert != null) {
            var anteilNiedrig = (r.teil12 || 0) + (r.teil0 || 0);
            if (H >= rhDachE.wert - 1e-6 && anteilNiedrig <= 50) z.pruefungen.push(item('hoeheDachOk', 'gruen', { ist: zahlenDe(H, 2), soll: zahlenDe(rhDachE.wert, 2) }, ['raumhoehe_dach']));
            else z.pruefungen.push(item('hoeheDach', H >= rhDachE.wert - 1e-6 ? 'gelb' : 'rot', { ist: zahlenDe(H, 2), soll: zahlenDe(rhDachE.wert, 2), niedrig: Math.round(anteilNiedrig) }, ['raumhoehe_dach']));
          } else if (istLuecke(rhE) || rhE.wert == null) {
            z.pruefungen.push(item('hoeheLuecke', 'gelb', {}, [{ e: rhE, t: 'raumhoehe' }]));
          } else if (H >= rhE.wert - 1e-6) {
            z.pruefungen.push(item('hoeheOk', 'gruen', { ist: zahlenDe(H, 2), soll: zahlenDe(rhE.wert, 2) }, ['raumhoehe']));
          } else {
            var aw = ausE && !istLuecke(ausE) ? ausE.wert : false, klein = gk.wirksam <= 2;
            if (klein && aw === true) z.pruefungen.push(item('hoeheAusnahme', 'gelb', { ist: zahlenDe(H, 2), soll: zahlenDe(rhE.wert, 2), gk: gk.wirksam }, ['raumhoehe', 'ausnahme_gk12']));
            else if (klein && aw && typeof aw === 'object' && aw.ersatzwert_m != null) {
              if (H >= aw.ersatzwert_m - 1e-6) z.pruefungen.push(item(aw.ermessen ? 'hoeheErmessen' : 'hoeheErsatz', aw.ermessen ? 'gelb' : 'gruen', { ist: zahlenDe(H, 2), soll: zahlenDe(rhE.wert, 2), ersatz: zahlenDe(aw.ersatzwert_m, 2) }, ['raumhoehe', 'ausnahme_gk12']));
              else z.pruefungen.push(item('hoeheZuNiedrig', 'rot', { ist: zahlenDe(H, 2), soll: zahlenDe(rhE.wert, 2), ersatz: zahlenDe(aw.ersatzwert_m, 2) }, ['raumhoehe', 'ausnahme_gk12']));
            } else z.pruefungen.push(item('hoeheZuNiedrig', 'rot', { ist: zahlenDe(H, 2), soll: zahlenDe(rhE.wert, 2) }, ['raumhoehe', 'ausnahme_gk12']));
          }
          /* Fensterfläche (Rohbaumaß der Fenster im Raum) */
          if (!istLuecke(fensterE) && fensterE.wert && fensterE.wert.nenner) {
            var anteil = fensterE.wert.zaehler / fensterE.wert.nenner, soll = anteil * fl, ist = 0;
            fenster.forEach(function (t) { ist += t.w * (t.hoehe != null ? t.hoehe : (ART[t.art].hoehe || 130) / 100); });
            var okF = ist >= soll - 1e-6, par = { ist: zahlenDe(ist, 2), soll: zahlenDe(soll, 2), bruch: fensterE.wert.zaehler + '/' + fensterE.wert.nenner, n: fenster.length };
            z.pruefungen.push(item(okF ? 'fensterOk' : (fenster.length ? 'fensterZuKlein' : 'fensterFehlt'), okF ? 'gruen' : 'rot', par, ['fensterflaeche']));
          } else z.pruefungen.push(item('fensterLuecke', 'gelb', {}, [{ e: fensterE, t: 'fensterflaeche' }]));
          /* Rettungsfenster in Obergeschossen */
          if (ei_.typ === 'og' || ei_.typ === 'dach') {
            if (!istLuecke(rettE) && rettE.wert && rettE.wert.breite) {
              var maxUk = rettE.wert.unterkante_max != null ? rettE.wert.unterkante_max : (!istLuecke(ukE) ? ukE.wert : null);
              var guete = fenster.filter(function (t) {
                var h = t.hoehe != null ? t.hoehe : 1.3;
                return t.w >= rettE.wert.breite - 1e-6 && h >= rettE.wert.hoehe - 1e-6 && (maxUk == null || (t.bruestung != null ? t.bruestung : 0.9) <= maxUk + 1e-6);
              });
              var par2 = { breite: zahlenDe(rettE.wert.breite, 2), hoehe: zahlenDe(rettE.wert.hoehe, 2), uk: maxUk != null ? zahlenDe(maxUk, 2) : '', n: fenster.length };
              z.pruefungen.push(item(guete.length ? 'rettungOk' : 'rettungPruefen', guete.length ? 'gruen' : 'gelb', par2, [{ e: rettE, t: 'rettungsfenster' }].concat(ukE && !istLuecke(ukE) ? [{ e: ukE, t: 'rettungsfenster_unterkante' }] : [])));
            } else z.pruefungen.push(item('rettungLuecke', 'gelb', {}, [{ e: rettE, t: 'rettungsfenster' }]));
            /* Brüstung der Fenster in Obergeschossen */
            if (fenster.length) {
              if (!istLuecke(brE) && brE.wert && brE.wert.hoehe != null) {
                var absturz = ei_.boden, minB = absturz > 12 && brE.wert.ab_12m ? brE.wert.ab_12m : brE.wert.hoehe;
                var zuNiedrig = fenster.filter(function (t) { return (t.bruestung != null ? t.bruestung : 0.9) < minB - 1e-6; });
                if (zuNiedrig.length) z.pruefungen.push(item('bruestungNiedrig', 'gelb', { soll: zahlenDe(minB, 2), n: zuNiedrig.length, kleinste: zahlenDe(Math.min.apply(null, zuNiedrig.map(function (t) { return t.bruestung != null ? t.bruestung : 0.9; })), 2) }, [{ e: brE, t: 'bruestung' }]));
                else z.pruefungen.push(item('bruestungOk', 'gruen', { soll: zahlenDe(minB, 2) }, [{ e: brE, t: 'bruestung' }]));
              } else if (istLuecke(brE)) z.pruefungen.push(item('bruestungLuecke', 'gelb', {}, [{ e: brE, t: 'bruestung' }]));
              else z.pruefungen.push(item('bruestungKeinWert', 'info', {}, [{ e: brE, t: 'bruestung' }]));   /* z. B. Bayern: das Gesetz nennt keinen Zahlenwert */
            }
          }
        }
        /* Rauchwarnmelder */
        if (nu === 'schlafen' || nu === 'kind' || nu === 'flur') z.pruefungen.push(item('rauch', 'info', { n: rauchE && rauchE.wert ? rauchE.wert : 1 }, [{ e: rauchE, t: 'rauchmelder' }]));
        /* Türen und Bewegungsflächen (Empfehlung, bei mehr Wohnungen als das Land erlaubt: Pflicht) */
        if (tueren.some(function (t) { return t.w < 0.9 - 1e-6; })) {
          z.pruefungen.push(item(barriere ? 'tuerSchmalPflicht' : 'tuerSchmal', barriere ? 'gelb' : 'info', { n: tueren.filter(function (t) { return t.w < 0.9 - 1e-6; }).length, schwelle: bf ? bf.wert : '' }, barriere ? [{ e: bf, t: 'barrierefrei' }] : []));
          if (!barriere && richtBeleg('A08')) z.pruefungen[z.pruefungen.length - 1].belege.push(richtBeleg('A08'));
          z.pruefungen[z.pruefungen.length - 1].eigen = !barriere;
        }
        if ((aufenthalt || nu === 'bad') && opt.bewegung !== false) {
          var hind = (e.teile || []).filter(function (t) { return (istMoebel(ART, t) || (ART[t.art] && ART[t.art].form === 'treppe')) && imVieleck(t.x, t.y, r.punkte); }).map(ecken);
          var seite = barriere ? 1.5 : 1.2;
          if (!freiesQuadrat(r, hind, seite)) {
            var it = item(barriere ? 'bewegungEngPflicht' : 'bewegungEng', barriere ? 'gelb' : 'info', { cm: Math.round(seite * 100) }, barriere ? [{ e: bf, t: 'barrierefrei' }] : []);
            var rb = richtBeleg('A01'); if (rb && !barriere) it.belege.push(rb);
            it.eigen = !barriere;
            z.pruefungen.push(it);
          }
        }
        /* Faustregeln der Architekten (eigene Einordnung, ändern die Ampel nicht) */
        var FR = { schlafen: ['F01', 12], kind: ['F02', 10], bad: ['F03', 8], wc: ['F04', 3], kueche: ['F05', 10] };
        if (FR[nu] && fl < FR[nu][1] - 1e-6 && richt(FR[nu][0])) z.pruefungen.push(richtInfo('faustKlein', FR[nu][0], { ist: zahlenDe(fl, 1), soll: zahlenDe(FR[nu][1], 0) }));
        if (nu === 'flur' && richt('F06')) {
          var br = raumBreite(r.punkte);
          if (br < 1 - 1e-6) z.pruefungen.push(richtInfo('faustFlur', 'F06', { ist: zahlenDe(br, 2), soll: '1,00' }));
        }
        /* Freiflächen vor Möbeln */
        if (!frei) frei = freiflaechen(e, ART);
        var meine = frei.filter(function (f) { var t = (e.teile || []).filter(function (x) { return x.id === f.id; })[0]; return t && f.konflikt && imVieleck(t.x, t.y, r.punkte); });
        meine.forEach(function (f) { z.pruefungen.push(richtInfoFrei(f)); });
        z.ampel = z.pruefungen.reduce(function (a, p) { return p.stufe === 'info' ? a : schlechter(a, p.stufe); }, 'gruen');
        z.ampel = z.ampel === 'info' ? 'gruen' : z.ampel;
      });
    });
    function richtInfoFrei(f) {
      var b = richtBeleg(f.tiefe >= 120 ? 'A04' : 'A05');
      var it = item('freiEng', 'gelb', { art: f.art, cm: f.tiefe, mit: f.mit }, []);
      if (b) it.belege.push(b);
      it.eigen = true; it.teilId = f.id;
      return it;
    }

    /* Pflichträume je Wohnung (ganzes Haus) */
    var alle = [];
    plan.etagen.forEach(function (e, ei) { e.raeume.forEach(function (r) { if (r.art === 'voll') alle.push({ e: e, r: r, nu: nutzungVon(r), fl: flaecheVon(r.punkte), typ: info[ei].typ }); }); });
    var haus = { name: '', pruefungen: [], ampel: 'gruen' };
    function zaehle(nu) { return alle.filter(function (x) { return x.nu === nu; }).length; }
    if (alle.length) {
      var kuE = regel(land, 'kueche', datum), baE = regel(land, 'bad_wc', datum), abE = regel(land, 'abstellraum', datum);
      var kuecheZahl = alle.filter(function (x) { return x.nu === 'kueche' || (x.e.teile || []).some(function (t) { return (t.art === 'kueche' || t.art === 'kuechemontage') && imVieleck(t.x, t.y, x.r.punkte); }); }).length;
      if (istLuecke(kuE)) haus.pruefungen.push(item('kuecheLuecke', 'gelb', {}, [{ e: kuE, t: 'kueche' }]));
      else if (kuE.pflicht === 'ja') haus.pruefungen.push(item(kuecheZahl >= wohnungen ? 'kuecheOk' : 'kuecheFehlt', kuecheZahl >= wohnungen ? 'gruen' : 'gelb', { n: wohnungen }, ['kueche']));
      else haus.pruefungen.push(item(kuE.pflicht === 'technisch' ? 'kuecheTechnisch' : 'kuecheKeine', 'info', {}, ['kueche']));
      var badZahl = zaehle('bad'), wcZahl = zaehle('wc') + badZahl;
      if (istLuecke(baE)) haus.pruefungen.push(item('badLuecke', 'gelb', {}, [{ e: baE, t: 'bad_wc' }]));
      else if (baE.pflicht === 'nur_wc') haus.pruefungen.push(item(wcZahl >= wohnungen ? 'wcOk' : 'wcFehlt', wcZahl >= wohnungen ? 'gruen' : 'gelb', { n: wohnungen }, ['bad_wc']));
      else haus.pruefungen.push(item(badZahl >= wohnungen && wcZahl >= wohnungen ? 'badOk' : (badZahl >= wohnungen ? 'wcFehlt' : 'badFehlt'), badZahl >= wohnungen && wcZahl >= wohnungen ? 'gruen' : 'gelb', { n: wohnungen }, ['bad_wc']));
      /* Abstellraum nach Landesregel (pflicht: immer | gk35 | mehr_als_2 | nein) */
      if (istLuecke(abE)) haus.pruefungen.push(item('abstellLuecke', 'gelb', {}, [{ e: abE, t: 'abstellraum' }]));
      else {
        var pf = abE.pflicht, noetig = pf === 'immer' || (pf === 'gk35' && gk.wirksam >= 3) || (pf === 'mehr_als_2' && wohnungen > 2);
        var abstellFl = alle.filter(function (x) { return x.nu === 'abstell'; }).reduce(function (s, x) { return s + x.fl; }, 0), abstellZahl = zaehle('abstell');
        if (noetig) {
          var wfl = alle.filter(function (x) { return x.typ !== 'keller' && AUFENTHALT[x.nu]; }).reduce(function (s, x) { return s + x.fl; }, 0) / wohnungen;
          var mind = null;
          if (abE.wert && typeof abE.wert === 'object') mind = wfl <= abE.wert.bis_wohnung_m2 ? abE.wert.wert_klein : abE.wert.wert_gross;
          else if (typeof abE.wert === 'number') mind = abE.wert;
          if (abstellZahl < wohnungen) haus.pruefungen.push(item('abstellFehlt', 'gelb', { mind: mind != null ? zahlenDe(mind, 1) : '', n: wohnungen }, ['abstellraum']));
          else if (mind != null && abstellFl / wohnungen < mind - 1e-6) haus.pruefungen.push(item('abstellKlein', 'gelb', { ist: zahlenDe(abstellFl / wohnungen, 1), mind: zahlenDe(mind, 1) }, ['abstellraum']));
          else haus.pruefungen.push(item('abstellOk', 'gruen', {}, ['abstellraum']));
        }
      }
      haus.ampel = haus.pruefungen.reduce(function (a, p) { return p.stufe === 'info' ? a : schlechter(a, p.stufe); }, 'gruen');
      res.haus = haus;
    }

    res.raeume.forEach(function (z) { if (z.art === 'voll' && z.ampel !== 'neutral') res.summe[z.ampel]++; });
    if (res.haus) res.summe[res.haus.ampel]++;
    res.barriere = !!barriere;
    return res;
  }

  /* ---------- Genehmigung (verfahrensfrei) ---------- */
  var FREI_THEMEN = ['verfahrensfrei_innen', 'verfahrensfrei_tragend', 'dachausbau', 'solar_verfahrensfrei'];
  function genehmigung(land, datum) {
    datum = datum || heute();
    var d = daten();
    return FREI_THEMEN.map(function (th) {
      var e = regel(land, th, datum);
      return { thema: th, luecke: istLuecke(e), beleg: e && !istLuecke(e) ? beleg(land, th, e) : { thema: th, titel: d && d.themen[th] ? d.themen[th].titel : th, status: 'Lücke', abruf: e ? e.abruf : '', text: e ? (e.luecke_grund || '') : '', quellen: [] } };
    });
  }

  var API = {
    LAENDER: LAENDER, NUTZUNGEN: NUTZUNGEN, AUFENTHALT: AUFENTHALT, GK_TEXTE: GK_TEXTE, FREI_THEMEN: FREI_THEMEN,
    heute: heute, setzeDatum: setzeDatum, landOk: landOk, landInfo: landInfo, daten: daten, datenVf: datenVf,
    aktiv: aktiv, regel: regel, regelMitWert: regelMitWert, beleg: beleg, nutzungAusName: nutzungAusName, nutzungVon: nutzungVon,
    etagenInfo: etagenInfo, gebaeudeklasse: gebaeudeklasse, treppenAbzug: treppenAbzug, freiflaechen: freiflaechen,
    pruefe: pruefe, genehmigung: genehmigung, flaecheVon: flaecheVon, imVieleck: imVieleck, raumBreite: raumBreite, schneiden: schneiden, ecken: ecken
  };
  root.REGELN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
