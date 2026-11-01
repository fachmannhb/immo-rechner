/* Rechenkern „Sauna“ (S1, 31.10.2026), rein, läuft auch in Node (tmp/sauna_kern_test.js); Oberfläche: grundriss_sauna.js. Daten: daten/sauna.js (Berichte 43 und 44).
   Größe, Ofenwahl (elektro/holz) und Bauantrag-Ampel kommen vom verknüpften Baustein „Sauna“ der Karte Grundstück (plan.aussen, GRUNDSTUECK_KERN, ANBAU_KERN): keine zweite Rechnung.
   plan.sauna (optional) = { ref, art, holz_wand, holz_bank, stunden }. Die Maße des Bausteins gelten als Außenmaß der Kabine; Volumen = Breite × Tiefe × Höhe (Annahme: Wandstärke nicht abgezogen).
   Fass: Höhe = Durchmesser (die Oberfläche hält die Breite gleich), Volumen = Zylinder; die Ampel rechnet weiter mit Fläche × Höhe. Preise ohne belegte Händlerzeile sind Lücken. Keine Kaufempfehlung (R078). */
(function (root) {
  'use strict';
  var GK = root.GRUNDSTUECK_KERN || (typeof require === 'function' ? require('./grundstueck_kern.js') : null);
  /* Annahmen (die Seite zeigt sie als Annahme): Startart, Startholz, Stunden je Gang, Beispielmaße je Art, Wandstärke je Art (Karibu: S-40, S-41, S-42), Symbolgröße des Ofens (kein Herstellermaß) */
  var ANNAHMEN = { art: 'garten', wand: 'fichte', bank: 'linde', stunden: 1 };
  var ARTEN = { innen: { b: 2, t: 2.2, h: 2.2, w: 0.068 }, garten: { b: 2, t: 2, h: 2.3, w: 0.038 }, fass: { b: 2, t: 2.5, h: 2, w: 0.04 } };
  var START = { b: 2.5, t: 2.5, h: 2.4 };   /* Startgröße des Bausteins in grundstueck_kern.js */
  var OFEN_MASS = { 3.6: [0.40, 0.35, 0.60], 9: [0.50, 0.45, 0.75] };
  var H_MIN = 1.75, H_MAX = 3, B_MAX = 6, T_MAX = 6, S_MIN = 0.25, S_MAX = 4;
  function ok(x) { return typeof x === 'number' && isFinite(x); }
  function klemme(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function SD() { return root.DATEN && root.DATEN.sauna; }
  function SH() { return root.DATEN && root.DATEN.saunaholz; }
  /* S2: vier Hölzer (Thermo-Kiefer, Thermo-Fichte, Thermo-Erle, Kelo) stehen nur in daten/saunaholz.js: ohne Händlerzeile, also alles Lücke in der Materialliste (Keine Angabe, nicht in der Summe) */
  function holzInfo(id) {
    var l = SD().holz, i, s = SH();
    for (i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    for (i = 0; s && i < s.holz.length; i++) if (s.holz[i].id === id) { var L = { status: 'Lücke' }; return { id: id, name: s.holz[i].name, wand: L, bank: L, harz: L, splitter: L, rho: L, m2: [], lfm: [], nurSaunaholz: true }; }
    return null;
  }
  function holzDaten(id) { var s = SH(), i; for (i = 0; s && i < s.holz.length; i++) if (s.holz[i].id === id) return s.holz[i]; return null; }
  function matInfo(id) { var l = SD().material; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }

  function planSauna(plan) {
    var p = plan && plan.sauna && typeof plan.sauna === 'object' && !Array.isArray(plan.sauna) ? plan.sauna : null;
    var r = { vorhanden: !!p, ref: '', art: ANNAHMEN.art, wand: ANNAHMEN.wand, bank: ANNAHMEN.bank, stunden: ANNAHMEN.stunden, explizit: {}, meldungen: [] };
    if (!p) return r;
    if (typeof p.ref === 'string' && /^[a-z0-9_]{1,12}$/.test(p.ref)) r.ref = p.ref;
    if (p.art !== undefined) { if (ARTEN[p.art]) { r.art = p.art; r.explizit.art = true; } else r.meldungen.push({ typ: 'art', wert: String(p.art) }); }
    [['holz_wand', 'wand'], ['holz_bank', 'bank']].forEach(function (k) {
      if (p[k[0]] === undefined) return;
      if (typeof p[k[0]] === 'string' && holzInfo(p[k[0]])) { r[k[1]] = p[k[0]]; r.explizit[k[1]] = true; } else r.meldungen.push({ typ: 'holz', feld: k[1], wert: String(p[k[0]]) });
    });
    if (ok(p.stunden)) { r.stunden = klemme(p.stunden, S_MIN, S_MAX); r.explizit.stunden = true; }
    return r;
  }
  function mass(art, b, t, h) { return art === 'fass' ? { b: h, t: t, h: h, d: h } : { b: b, t: t, h: h, d: null }; }   /* Fass: Durchmesser = Höhe */
  function volumen(art, b, t, h) { var m = mass(art, b, t, h); return r2(art === 'fass' ? Math.PI / 4 * m.d * m.d * m.t : m.b * m.t * m.h); }
  /* Ofenleistung (Karibu: bis 5,5 m³ 3,6 kW, bis 14 m³ 9 kW; Weka 3,6 kW „bis ca. 6 m³“; darüber keine Angabe) */
  function ofenKlasse(v) {
    var o = SD().ofen, k0 = o.klassen[0], k1 = o.klassen[1];
    if (!ok(v) || v <= 0) return { v: v, kw: null, status: 'eingabe' };
    if (v > k1.bis) return { v: v, kw: null, status: 'zugross', max: k1.bis };
    if (v <= k0.bis) return { v: v, kw: k0.kw, status: 'ok', klasse: k0 };
    return { v: v, kw: k1.kw, status: 'ok', klasse: k1, grenz: v <= o.grenz.bis, wekaAlt: v <= o.grenz.bis ? k0.kw : null };
  }
  /* Spanne eines Holzes; „Quellen“ zählt verschiedene Händler, nicht Zeilen */
  function holzPreis(id, einheit) {
    var h = holzInfo(id), z = h ? h[einheit === 'lfm' ? 'lfm' : 'm2'] : [], q = {}, zs = z.filter(function (r) { return !r.ausser; });   /* K1: Zeilen mit ausser (Hinweis „nicht als Sauna ausgewiesen“) bleiben sichtbar, zählen aber nicht zur Spanne und nicht zur Quellenzahl */
    zs.forEach(function (r) { q[r.quelle + r.h] = 1; });
    var n = Object.keys(q).length;
    if (!zs.length) return { id: id, luecke: true, n: 0, zeilen: z };
    var v = zs.map(function (r) { return r.v; });
    return { id: id, luecke: false, zeilen: z, n: n, einQuelle: n === 1, von: Math.min.apply(null, v), bis: Math.max.apply(null, v) };
  }
  /* ---------- Holzvergleich (S2): Rangliste aus gezählten Quellen und belegten Eigenschaften, der Preis zählt NICHT ----------
     Punktzahl (0 bis 100) = w × E + (1 − w) × P.  E = Zahl der empfehlenden Quellen für den Zweck ÷ 8 (alle gezählten Quellen, auch die unsichere, wie Abschnitt 7 des Berichts 58).
     P = Mittel der belegten Eigenschaften (Stufe 1 bis 3, geteilt durch 3; Harz, Hitze, Haltbarkeit, Splittern; Geruch zählt seit S3 nicht, er ist Geschmack). Eine Lücke und ein Quellen-Widerspruch zählen weder im Zähler noch im Nenner (nie als 0).
     Hat ein Holz keine einzige belegte Eigenschaft, entfällt P und die Punktzahl ist E allein (Regel, die Seite nennt „0 von 5 belegt“). Gleiche Punktzahl = geteilter Platz.
     Das Gewicht w ist Bedienzustand (Start 0,5 = Annahme), das bestplatzierte Holz wird nie von selbst gewählt. */
  /* S3: Geruch ist Geschmack, keine Eigenschaft: er bleibt in KRIT (Anzeige, Balken, Allergie-Hinweis), zählt aber nicht zur Punktzahl (ZAEHLT). */
  var GEWICHT_START = 0.5, KRIT = ['harz', 'hitze', 'halt', 'splitter', 'geruch'], ZAEHLT = ['harz', 'hitze', 'halt', 'splitter'];
  function gewichtOk(w) { return ok(w) ? klemme(w, 0, 1) : GEWICHT_START; }
  function zaehlung(id, zweck) {
    var h = holzDaten(id), s = SH(), z = h && h.z && h.z[zweck === 'bank' ? 'bank' : 'wand'];
    return z ? { n: z.q.length, q: z.q, u: z.u, gesamt: s.anzahl_quellen } : { n: 0, q: [], u: [], gesamt: s ? s.anzahl_quellen : 0 };
  }
  function eigenschaften(id) {
    var h = holzDaten(id), st = [], out = [];
    KRIT.forEach(function (k) {
      var v = h && h.k[k], e = { key: k, art: !v || v.l ? 'luecke' : v.w ? 'widerspruch' : 'stufe', s: v && v.s || 0, q: v && v.q || [], t: v && v.t || '', abg: !!(v && v.abg), zaehlt: ZAEHLT.indexOf(k) >= 0 };
      if (e.art === 'stufe' && e.zaehlt) st.push(e.s);
      out.push(e);
    });
    return { liste: out, belegt: st.length, von: ZAEHLT.length, mittel: st.length ? st.reduce(function (a, b) { return a + b / 3; }, 0) / st.length : null };
  }
  function bewerte(id, zweck, w) {
    var z = zaehlung(id, zweck), e = eigenschaften(id), E = z.gesamt ? z.n / z.gesamt : 0, P = e.mittel;
    var punkte = P === null ? E : w * E + (1 - w) * P;
    return { id: id, name: holzInfo(id).name, n: z.n, u: z.u, q: z.q, gesamt: z.gesamt, E: E, P: P, belegt: e.belegt, belegtVon: e.von, krit: e.liste, punkte: Math.floor(punkte * 1000 + 0.5 + 1e-7) / 10, roh: punkte };
  }
  function rangliste(zweck, gewicht) {
    var s = SH(), w = gewichtOk(gewicht), z = zweck === 'bank' ? 'bank' : 'wand';
    if (!s) return { zweck: z, w: w, eintraege: [], max: 0 };
    var l = s.holz.map(function (h) { return bewerte(h.id, z, w); }), mx = 0;
    l.forEach(function (x) { if (x.n > mx) mx = x.n; });
    l.sort(function (a, b) { return Math.round(b.roh * 1e9) - Math.round(a.roh * 1e9) || b.n - a.n || a.name.localeCompare(b.name, 'de'); });
    l.forEach(function (x) {
      x.platz = 1 + l.filter(function (y) { return Math.round(y.roh * 1e9) > Math.round(x.roh * 1e9); }).length;
      x.geteilt = l.filter(function (y) { return Math.round(y.roh * 1e9) === Math.round(x.roh * 1e9); }).length > 1;
      x.meist = mx > 0 && x.n === mx;
    });
    return { zweck: z, w: w, eintraege: l, max: mx };
  }
  /* Preisbalken (zählt nicht zur Rangfolge): Mitte der Spanne aus holzPreis, geteilt durch die größte Mitte aller Hölzer; ohne belegten Preis null = Lücke */
  function preisBalken(einheit) {
    var l = SH() ? SH().holz.map(function (h) { var p = holzPreis(h.id, einheit); return { id: h.id, mitte: p.luecke ? null : (p.von + p.bis) / 2 }; }) : [], mx = 0;
    l.forEach(function (x) { if (x.mitte !== null && x.mitte > mx) mx = x.mitte; });
    l.forEach(function (x) { x.anteil = x.mitte === null || !mx ? null : x.mitte / mx; });
    return l;
  }
  function strompreis() {
    var e = root.DATEN && root.DATEN.energiepreise && root.DATEN.energiepreise.eintraege, i;
    for (i = 0; e && i < e.length; i++) if (e[i].id === 'strom_destatis_alle') return { ct: e[i].wert, abruf: e[i].abruf, status: e[i].status, quelle: e[i].quelle };
    return null;
  }
  /* Kosten je Gang: kW × Stunden × Strompreis (Annahme Volllast: Obergrenze) */
  function betrieb(kw, stunden, ct) {
    if (!ok(kw) || !ok(stunden) || !ok(ct)) return { ok: false };
    var kwh = kw * stunden;
    return { ok: true, kw: kw, stunden: stunden, kwh: Math.round(kwh * 1000) / 1000, ct: ct, eur: Math.round(kwh * ct) / 100 };
  }
  function auf(x, n) { return Math.ceil(x / n - 1e-9); }
  /* Wand: Umfang × Höhe minus Tür (Fass: Mantel + zwei Stirnflächen), Decke Breite × Tiefe, Verschnitt als Annahme; Bankleisten: Bretter je Bank × Länge */
  function mengen(art, b, t, h) {
    var d = SD(), m = mass(art, b, t, h), tuer = d.ofen.tuer[0] * d.ofen.tuer[1], bk = d.bank, fass = art === 'fass';
    var wand = fass ? Math.PI * m.d * m.t + Math.PI / 2 * m.d * m.d - tuer : 2 * (m.b + m.t) * m.h - tuer, decke = fass ? 0 : m.b * m.t, laenge = fass ? m.t : m.b;
    var raster = bk.latte + bk.fuge, nU = auf(bk.unten, raster), nO = auf(bk.oben, raster), v = bk.verschnitt;
    return { tuer: tuer, wand: wand, decke: decke, flaeche: wand + decke, verschnitt: v, profil: (wand + decke) * (1 + v), bankLaenge: laenge, bankBretter: nU + nO, nUnten: nU, nOben: nO, bankLfm: laenge * (nU + nO) * (1 + v) };
  }
  function pos(id, menge, einheit, von, bis, x) {
    var p = { id: id, menge: menge, einheit: einheit, von: von, bis: bis, luecke: !(ok(von) && ok(bis)) };
    for (var k in x) p[k] = x[k];
    return p;
  }
  function material(art, b, t, h, wand, bank, ofen, kw) {
    var mg = mengen(art, b, t, h), out = [], pw = holzPreis(wand, 'm2'), pb = holzPreis(bank, 'lfm'), dm = matInfo('daemmung');
    out.push(pos('profil', mg.profil, 'm²', pw.luecke ? null : pw.von * mg.profil, pw.luecke ? null : pw.bis * mg.profil, { holz: wand, preis: pw }));
    out.push(pos('bank', mg.bankLfm, 'lfm', pb.luecke ? null : pb.von * mg.bankLfm, pb.luecke ? null : pb.bis * mg.bankLfm, { holz: bank, preis: pb }));
    out.push(pos('daemmung', mg.flaeche, 'm²', dm.von * mg.flaeche, dm.bis * mg.flaeche, { beleg: dm }));
    var of = SD().ofen.klassen.filter(function (k) { return k.kw === kw; })[0];
    out.push(ofen === 'holz' || !of ? pos('ofen', 1, 'Stück', null, null, { holzofen: ofen === 'holz' }) : pos('ofen', 1, 'Stück', of.preis[0], of.preis[1], { kw: kw, beleg: of }));
    out.push(pos('steuerung', 1, 'Stück', 0, 0, { beleg: matInfo('steuerung'), imOfen: true }));
    ['tuer', 'leuchte', 'steine'].forEach(function (id) { var mi = matInfo(id); out.push(pos(id, 1, id === 'steine' ? 'Satz' : 'Stück', mi.von, mi.bis, { beleg: mi })); });
    out.push(pos('rahmen', null, '', null, null, { beleg: matInfo('rahmen') }), pos('elektro', null, '', null, null, { beleg: matInfo('elektro') }));
    var von = 0, bis = 0, lu = 0;
    out.forEach(function (p) { if (p.luecke) lu++; else { von += p.von; bis += p.bis; } });
    return { mengen: mg, pos: out, summe: { von: von, bis: bis }, luecken: lu };
  }
  /* Preisvergleich: nur Angebote mit ähnlicher Außenfläche stehen nebeneinander, der Rest ist „andere Größe“ (Klassengrenzen = Annahme) */
  function vergleich(art, b, t, h, selbst) {
    var d = SD(), m = mass(art, b, t, h), fl = m.b * m.t, rows = d.preise_fertig.map(function (r) { var q = r.b * r.t / fl; return { r: r, gleich: q >= d.klasse.von && q <= d.klasse.bis, verhaeltnis: q }; });
    return { flaeche: fl, klasse: d.klasse, selbstbau: selbst, gleich: rows.filter(function (x) { return x.gleich; }), andere: rows.filter(function (x) { return !x.gleich; }) };
  }
  /* Geometrie für 3D und Skizzen in m: x Breite, z Tiefe (Rückwand z = 0, Tür vorn bei z = T), y nach oben */
  function geometrie(art, b, t, h, kw, ofenArt) {
    var d = SD(), m = mass(art, b, t, h), w = ARTEN[art].w, bk = d.bank, ab = d.ofen.abstand.filter(function (a) { return a.kw === kw; })[0], om = OFEN_MASS[kw];
    var g = { art: art, B: m.b, T: m.t, H: m.h, w: w, Bi: m.b - 2 * w, Ti: m.t - 2 * w, Hi: m.h - w, d: m.d, ofen: null };
    g.tuer = { b: d.ofen.tuer[1], h: d.ofen.tuer[0], x: (m.b - d.ofen.tuer[1]) / 2 };
    g.bank = { oben: { tiefe: Math.min(bk.oben, g.Ti) }, unten: { tiefe: Math.min(bk.unten, Math.max(0, g.Ti - bk.oben)) } };
    if (ofenArt !== 'holz' && ab && om) {
      var s = ab.seite / 100;
      g.ofen = { b: om[0], t: om[1], h: om[2], seite: s, decke: ab.decke / 100, modell: ab.modell, x: w + s, z: m.t - w - s - om[1], kw: kw };
      g.ofen.freiOben = g.Hi - om[2]; g.ofen.zuNiedrig = g.ofen.freiOben < g.ofen.decke;
    }
    return g;
  }
  function findeItem(ctx, ref) {
    var l = (ctx.items || []).filter(function (x) { return x.art === 'sauna'; });
    if (ref) return l.filter(function (x) { return x.id === ref; })[0] || { fehlt: true, ref: ref };   /* entfernter Baustein: sichtbare Meldung, kein stilles Umhängen */
    return l[0] || null;
  }
  function rechne(plan) {
    var ps = planSauna(plan), ctx = GK.rechne(plan), it = SD() ? findeItem(ctx, ps.ref) : null, c = { ps: ps, ctx: ctx, item: null, ok: false, grund: SD() ? '' : 'keineDaten' };
    if (!SD()) return c;
    if (!it) { c.grund = 'keineSauna'; return c; }
    if (it.fehlt) { c.grund = 'refFehlt'; c.ref = it.ref; return c; }
    c.item = it; c.ok = true; c.art = ps.art; c.b = it.b; c.t = it.t; c.h = it.h; c.ofen = it.ofen; c.ofenEigen = !!it.ofenEigen;
    c.volumen = volumen(c.art, c.b, c.t, c.h);
    c.klasse = c.ofen === 'holz' ? { v: c.volumen, kw: null, status: 'holz' } : ofenKlasse(c.volumen);
    c.kw = c.klasse.kw;
    c.material = material(c.art, c.b, c.t, c.h, ps.wand, ps.bank, c.ofen, c.kw);
    c.vergleich = vergleich(c.art, c.b, c.t, c.h, c.material);
    c.strom = strompreis();
    c.betrieb = c.ofen === 'holz' || !c.kw || !c.strom ? { ok: false } : betrieb(c.kw, ps.stunden, c.strom.ct);
    c.geo = geometrie(c.art, c.b, c.t, c.h, c.kw, c.ofen);
    c.ampel = it.ampel; c.vf = it.vf;
    return c;
  }

  /* ---------- Bearbeiten (schreibt in den Plan; der Aufrufer ruft danach GRUNDRISS.geaendert()) ---------- */
  function verknuepfen(plan, id) {
    var s = GK.normalisiere(plan), it = null;
    s.items.forEach(function (x) { if (x.art === 'sauna' && (x.id === id || (!it && !id))) it = x; });
    if (!it) return { ok: false, grund: 'keineSauna' };
    var neu = !plan.sauna || typeof plan.sauna !== 'object';
    if (neu) plan.sauna = {};
    plan.sauna.ref = it.id;
    if (neu && it.b === START.b && it.t === START.t && it.h === START.h) {   /* noch die Startgröße: Beispielmaß der Art (sonst 15 m³, über der Ofenangabe) */
      var a = ARTEN[ANNAHMEN.art];
      GK.festschreiben(plan);
      GK.bausteinSetzen(plan, it.id, 'breite_m', a.b); GK.bausteinSetzen(plan, it.id, 'tiefe_m', a.t); GK.bausteinSetzen(plan, it.id, 'hoehe_m', a.h);
    }
    return { ok: true, id: it.id, neu: neu };
  }
  function saunaAnlegen(plan) { var r = GK.bausteinHinzu(plan, 'sauna'); if (r.ok) verknuepfen(plan, r.id); return r; }
  function groesseSetzen(plan, feld, wert) {
    var ps = planSauna(plan), it = findeItem(GK.rechne(plan), ps.ref), lim = { breite_m: [1, B_MAX], tiefe_m: [1, T_MAX], hoehe_m: [H_MIN, H_MAX] }[feld];
    if (!it || it.fehlt || !ok(wert) || !lim) return false;
    wert = r2(klemme(wert, lim[0], lim[1]));
    GK.festschreiben(plan);
    GK.bausteinSetzen(plan, it.id, feld, wert);
    if (ps.art === 'fass' && feld === 'hoehe_m') GK.bausteinSetzen(plan, it.id, 'breite_m', wert);   /* Fass: Breite = Durchmesser = Höhe */
    return true;
  }
  function wahlSetzen(plan, feld, wert) {
    if (!plan.sauna || typeof plan.sauna !== 'object') plan.sauna = {};
    var ps = plan.sauna;
    if (feld === 'art') {
      if (!ARTEN[wert]) return false;
      ps.art = wert;
      if (wert === 'fass') { var it = findeItem(GK.rechne(plan), ps.ref); if (it && !it.fehlt) groesseSetzen(plan, 'hoehe_m', it.h); }
      return true;
    }
    if (feld === 'holz_wand' || feld === 'holz_bank') { if (!holzInfo(wert)) return false; ps[feld] = wert; return true; }
    if (feld === 'stunden' && ok(wert)) { ps.stunden = r2(klemme(wert, S_MIN, S_MAX)); return true; }
    return false;
  }
  var API = { ANNAHMEN: ANNAHMEN, ARTEN: ARTEN, H_MIN: H_MIN, H_MAX: H_MAX, B_MAX: B_MAX, T_MAX: T_MAX, S_MIN: S_MIN, S_MAX: S_MAX, holzInfo: holzInfo, holzDaten: holzDaten, GEWICHT_START: GEWICHT_START, KRIT: KRIT, ZAEHLT: ZAEHLT, zaehlung: zaehlung, eigenschaften: eigenschaften, rangliste: rangliste, preisBalken: preisBalken, gewichtOk: gewichtOk, planSauna: planSauna, volumen: volumen, ofenKlasse: ofenKlasse, holzPreis: holzPreis, strompreis: strompreis,
    betrieb: betrieb, mengen: mengen, material: material, vergleich: vergleich, geometrie: geometrie, rechne: rechne, verknuepfen: verknuepfen, saunaAnlegen: saunaAnlegen, groesseSetzen: groesseSetzen, wahlSetzen: wahlSetzen };
  root.SAUNA_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
