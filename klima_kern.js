/* Rechenkern „Klimaanlage, Strom, Speicher“ (H2, 03.11.2026), rein, läuft auch in Node (tmp/klima_kern_test.js). Daten: daten/klima.js (erzeugt von erzeuger/daten_klima.py), Speicherpreis und Faustregel: daten/energie.js (Schlüssel sp_preis_spanne, sp_groesse). Berichte 53 (A.4, C) und 60.
   Kühlen: Kühlleistung kW = m² × 60 W / 1000; Strom je Sommer kWh = kW × 350 Stunden / (SEER bzw. EER); Kosten = kWh × Strompreis. Split mit SEER 8,5 (von) bis 6 (bis), Monoblock mit EER 3 (von) bis 2 (bis). SEER und EER sind Annahmen, keine Messwerte.
   Der Strompreis kommt von außen (die Karte reicht den Preis der Heizarten-Karte herein, kein zweiter Regler).
   Speicher: Richtgröße kWh = Jahresstrom / 1.000 × 1,5; Kosten von/bis = kWh × €/kWh von/bis. Strom-Erzeugungskosten werden nicht gerechnet, nur als Spannen gezeigt.
   Keine Empfehlung (R078): der Kern rechnet, er wählt nichts aus. */
(function (root) {
  'use strict';
  function ok(x) { return typeof x === 'number' && isFinite(x); }
  function K() { var k = root.DATEN && root.DATEN.klima; return k && k.annahmen && k.kuehlen ? k : null; }
  function en(liste, id) { var e = root.DATEN && root.DATEN.energie, l = e && e[liste]; return l ? l.filter(function (x) { return x.id === id; })[0] || null : null; }
  function standard() { var k = K(); return k ? { m2: k.annahmen.m2.w, js: k.annahmen.js.w } : null; }
  function eingabe(e) {
    var s = standard(), x = e || {}, r = { m2: s.m2, js: s.js, strom: x.strom, meldungen: [] }, A = K().annahmen;
    ['m2', 'js'].forEach(function (f) {
      if (x[f] === undefined) return;
      if (ok(x[f]) && x[f] >= A[f].min && x[f] <= A[f].max) r[f] = x[f]; else r.meldungen.push(f);
    });
    return r;
  }
  function rechne(e0) {
    var k = K(), faust = en('speicher', 'sp_groesse'), preis = en('speicher', 'sp_preis_spanne');
    if (!k || !faust || !preis) return { ok: false, grund: 'daten' };
    var e = eingabe(e0), A = k.annahmen;
    if (!(ok(e.strom) && e.strom > 0)) return { ok: false, grund: 'strompreis' };
    var kw = e.m2 * A.kwm2.w / 1000, std = A.std.w, ct = e.strom;
    function bis(lo, hi) {
      var a = kw * std / lo, b = kw * std / hi;
      return { kwh: [a, b], eur: [a * ct / 100, b * ct / 100], teiler: [lo, hi] };
    }
    var kwh = e.js / 1000 * faust.von;
    return { ok: true, m2: e.m2, js: e.js, ct: ct, kw: kw, std: std, e: e,
      kuehl: { mono: bis(A.eer_gut.w, A.eer_schlecht.w), split: bis(A.seer_gut.w, A.seer_mittel.w) },
      sp: { js: e.js, faust: faust.von, kwh: kwh, von: kwh * preis.von, bis: kwh * preis.bis, euroKwh: [preis.von, preis.bis] } };
  }
  var API = { standard: standard, eingabe: eingabe, rechne: rechne };
  root.KLIMA_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
