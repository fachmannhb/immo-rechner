/* Rechenkern „Heizarten im Vergleich“ (H1, 02.11.2026), rein, läuft auch in Node (tmp/heizung_kern_test.js). Daten: daten/heizung.js (vergleich, erzeugt von erzeuger/daten_heizung.py), Berichte 52 und 61.
   Eingabe: Heizwärme des Hauses in kWh (aus der Karte Dämmung, ohne Warmwasser) oder das Beispielhaus, dazu Warmwasser in kWh. Die Karte reicht die Zahl herein, der Kern kennt weder Zeichnung noch Seite.
   Nutzwärme = Heizwärme + Warmwasser. Endenergie = Nutzwärme / Nutzungsgrad (bzw. Jahresarbeitszahl). Energie je Jahr = Endenergie × Preis.
   20 Jahre = (Anschaffung − Förderung) + 20 × (Energie + Wartung), jedes Ende der Spanne mit seinem Ende (Anschaffung von/bis, Wartung von/bis, Förderung 30 % von höchstens 28.000 € am jeweiligen Ende).
   Ohne Preissteigerung, Zins, Grundpreise, Zählergebühren, Ersatz von Teilen, Bio-Treppe-Kosten und CO2-Preisänderung. CO2 t/Jahr = Faktor (Anlage 9) / Nutzungsgrad × Nutzwärme.
   Keine Empfehlung (R078): der Kern rechnet, er wählt nichts aus. */
(function (root) {
  'use strict';
  function ok(x) { return typeof x === 'number' && isFinite(x); }
  function pos(x) { return ok(x) && x > 0; }
  function V() { var h = root.DATEN && root.DATEN.heizung; return h && h.vergleich && h.arten ? h : null; }
  function fehlt() { return { ok: false, grund: 'daten' }; }
  /* Vorgaben aus den Daten (Annahmen mit Quelle, Abruf, Status stehen dort) */
  function standard() {
    var h = V(); if (!h) return null;
    var a = h.vergleich.annahmen, p = {}, n = {};
    Object.keys(a.preis).forEach(function (k) { p[k] = a.preis[k].w; });
    Object.keys(a.nutz).forEach(function (k) { n[k] = a.nutz[k].w; });
    return { heiz: a.heiz0.w, ww: a.ww.w, foerd: true, wptarif: false, preis: p, nutz: n };
  }
  function eingabe(e) {
    var s = standard(), r = { heiz: s.heiz, ww: s.ww, foerd: s.foerd, wptarif: s.wptarif, preis: Object.assign({}, s.preis), nutz: Object.assign({}, s.nutz), meldungen: [] }, x = e || {};
    if (x.heiz !== undefined) { if (ok(x.heiz) && x.heiz >= 0) r.heiz = x.heiz; else r.meldungen.push('heiz'); }
    if (x.ww !== undefined) { if (ok(x.ww) && x.ww >= 0) r.ww = x.ww; else r.meldungen.push('ww'); }
    if (x.foerd !== undefined) r.foerd = !!x.foerd;
    if (x.wptarif !== undefined) r.wptarif = !!x.wptarif;
    ['preis', 'nutz'].forEach(function (f) {
      var q = x[f] && typeof x[f] === 'object' ? x[f] : {};
      Object.keys(q).forEach(function (k) {
        if (r[f][k] === undefined) { r.meldungen.push(f + '.' + k); return; }
        if (pos(q[k])) r[f][k] = q[k]; else r.meldungen.push(f + '.' + k);
      });
    });
    return r;
  }
  function foerderung(h, id, anschaffung, an) {
    var f = h.vergleich.foerderung, st = h.vergleich.arten[id].foerd;
    if (!an) return { aktiv: false, von: 0, bis: 0, status: st };
    if (f.arten.indexOf(id) < 0) return { aktiv: false, von: 0, bis: 0, status: st };
    return { aktiv: true, von: f.satz * Math.min(anschaffung.von, f.max), bis: f.satz * Math.min(anschaffung.bis, f.max), status: st };
  }
  /* Eine Heizart: Energie, Wartung, 20-Jahres-Spanne, CO2 */
  function art(h, id, e, nutz) {
    var A = h.vergleich.arten[id], D = h.arten[id], J = h.vergleich.jahre, P = e.preis, N = e.nutz, wp = !!A.wp, an = { von: D.von, bis: D.bis }, g, energie = 0, endenergie = 0, co2 = [0, 0];
    var strom = (e.wptarif && (wp || A.hy)) ? P.wpstrom : P.strom, ctKey = { gas: P.gas, oel: P.oel, strom: P.strom, pellets: P.pellets, holz: P.holz, fernwaerme: P.fernwaerme };
    if (A.hy) {   /* Hybrid: Anteil Wärmepumpe (Annahme) mit Jahresarbeitszahl Luft-Wasser, Rest Gas */
      var anteil = N.hybrid_wp, wpFa = h.vergleich.arten.waermepumpe.co2[0], gasFa = h.vergleich.arten.gas.co2[0];
      var kwhWp = nutz * anteil / N.jaz_luft, kwhGas = nutz * (1 - anteil) / N.gas;
      endenergie = kwhWp + kwhGas;
      energie = kwhWp * strom / 100 + kwhGas * P.gas / 100;
      var c = (kwhWp * wpFa + kwhGas * gasFa) / 1e6; co2 = [c, c];
    } else {
      endenergie = nutz / N[A.nutz];
      energie = endenergie * (A.tr === 'strom' ? strom : ctKey[A.tr]) / 100;
      co2 = [endenergie * A.co2[0] / 1e6, endenergie * A.co2[1] / 1e6];
    }
    g = foerderung(h, id, an, e.foerd);
    var w = A.wart ? { von: A.wart[0], bis: A.wart[1], luecke: false } : { von: 0, bis: 0, luecke: true };
    var ges = { von: an.von - g.von + J * (energie + w.von), bis: an.bis - g.bis + J * (energie + w.bis) };
    ges.mitte = (ges.von + ges.bis) / 2;
    return { id: id, a: an, f: g, endenergie: endenergie, energie: energie, wart: w, gesamt: ges, co2: { von: co2[0], bis: co2[1] }, auf: A.auf, ww: A.ww !== false };
  }
  /* Eingabe e (siehe eingabe()), Ergebnis: je Heizart in fester Reihenfolge und die Höchstwerte für eine gemeinsame Skala */
  function rechne(e0) {
    var h = V(); if (!h) return fehlt();
    var e = eingabe(e0), nutz = e.heiz + e.ww, liste;
    if (!(nutz > 0)) return { ok: false, grund: 'nutzwaerme' };
    liste = h.vergleich.reihe.map(function (id) { return art(h, id, e, nutz); });
    return { ok: true, nutz: nutz, heiz: e.heiz, ww: e.ww, e: e, arten: liste, jahre: h.vergleich.jahre,
      max: { kosten: Math.max.apply(null, liste.map(function (x) { return x.gesamt.bis; })), co2: Math.max.apply(null, liste.map(function (x) { return x.co2.bis; })), auf: 3 } };
  }
  /* Reihenfolge nach der Mitte der 20-Jahres-Spanne: nur eine Sortierung zur Ansicht, keine Empfehlung */
  function nachKosten(res) { return res.arten.slice().sort(function (a, b) { return a.gesamt.mitte - b.gesamt.mitte; }).map(function (x) { return x.id; }); }
  var API = { standard: standard, eingabe: eingabe, rechne: rechne, nachKosten: nachKosten };
  root.HEIZUNG_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
