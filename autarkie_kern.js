/* Kern „Wie autark ist Ihr Haus?“ (Welle E, Teil 2), rein, Node-fähig (tmp/autarkie_kern_test.js). Strom, Wasser und Wärme werden hier nur eingeordnet (Wert, „fehlt“, „Keine Angabe“), nicht gerechnet;
   Essen = Beetfläche / (Fläche je Person × Personen) für drei Stufen aus daten/grundstueck.js (a_gemuese, a_kartoffeln, a_voll). Zahl am Balken: Anteil „fast alles“ mit der Mitte der Spanne. Details: README. */
(function (root) {
  'use strict';
  var GK = root.GRUNDSTUECK_KERN || (typeof require === 'function' ? require('./grundstueck_kern.js') : null);

  function klemme(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function zahlOk(x) { return typeof x === 'number' && isFinite(x); }
  var STUFEN = [['gemuese', 'a_gemuese'], ['kartoffeln', 'a_kartoffeln'], ['voll', 'a_voll']];

  /* Stufen aus den Daten: je Stufe Fläche je Person (von, bis) und der Beleg (Quelle, Abruf, Status) */
  function stufenDaten() {
    var liste = GK && GK.datenZu ? GK.datenZu('autarkie').werte : [], out = {};
    STUFEN.forEach(function (s) {
      var e = liste.filter(function (w) { return w.id === s[1]; })[0];
      if (e && zahlOk(e.von) && zahlOk(e.bis) && e.von > 0 && e.bis >= e.von) out[s[0]] = { id: e.id, von: e.von, bis: e.bis, mitte: (e.von + e.bis) / 2, beleg: e };
    });
    return out.gemuese && out.kartoffeln && out.voll ? out : null;
  }

  /* Essen: Beetfläche in m², Personen. Prozentwerte 0 bis 100, bei 100 gedeckelt. */
  function essen(flaecheM2, personen) {
    var st = stufenDaten();
    if (!st) return { ok: false, grund: 'keineDaten' };
    var P = zahlOk(personen) && personen >= 1 ? Math.round(personen) : 3, A = zahlOk(flaecheM2) && flaecheM2 > 0 ? flaecheM2 : 0;
    function pr(jeP) { return Math.round(klemme(A / (jeP * P), 0, 1) * 100000) / 1000; }
    var res = { ok: true, flaeche: A, personen: P, stufen: {}, erreicht: null };
    STUFEN.forEach(function (s) {
      var d = st[s[0]];
      /* größere Fläche je Person → kleinerer Anteil: von = niedrigster, bis = höchster Anteil */
      res.stufen[s[0]] = { id: d.id, jeP: { von: d.von, bis: d.bis, mitte: d.mitte }, bedarf: { von: d.von * P, bis: d.bis * P }, von: pr(d.bis), bis: pr(d.von), mitte: pr(d.mitte), beleg: d.beleg };
      if (A >= d.bis * P - 1e-9) res.erreicht = s[0];   /* sicher erreicht: Fläche reicht auch am oberen Ende der Spanne */
    });
    res.prozent = res.stufen.voll.mitte;
    res.skala = { gemuese: res.stufen.gemuese.jeP.mitte / res.stufen.voll.jeP.mitte * 100, kartoffeln: res.stufen.kartoffeln.jeP.mitte / res.stufen.voll.jeP.mitte * 100, voll: 100 };
    return res;
  }

  /* Strom: Antwort von GRUNDRISS_ENERGIE.autarkie() ({ ok, anteil, personen, kwp, … } oder { ok:false, grund }) */
  function strom(x) {
    if (!x || !x.ok) return { id: 'strom', status: 'fehlt', prozent: 0, grund: x && x.grund ? x.grund : 'keineKarte', karte: 'strom' };
    return { id: 'strom', status: 'wert', prozent: klemme(x.anteil, 0, 1) * 100, personen: x.personen, kwp: x.kwp, mitAuto: !!x.mitAuto, karte: 'strom' };
  }
  /* Wasser: Antwort von HUELLE_KERN.wasserBilanz() (status aus | keinDach | gruen | fehler | ok | keinPlan) */
  function wasser(b) {
    if (!b) return { id: 'wasser', status: 'fehlt', prozent: 0, grund: 'keinPlan', karte: 'wasser' };
    if (b.status === 'ok') {
      var a = b.rw.autarkie;
      return { id: 'wasser', status: 'wert', prozent: klemme(a.mitte, 0, 1) * 100, von: klemme(a.von, 0, 1) * 100, bis: klemme(a.bis, 0, 1) * 100, personen: b.rw.personen, karte: 'wasser', rw: b.rw };
    }
    if (b.status === 'gruen') return { id: 'wasser', status: 'keine', prozent: null, grund: 'gruen', karte: 'wasser' };
    return { id: 'wasser', status: 'fehlt', prozent: 0, grund: b.status, karte: 'wasser' };
  }
  /* Wärme: die Daten belegen keine Deckung (Holz, Wärmepumpe mit eigenem Solarstrom), also nie eine Zahl */
  function waerme(w) {
    return { id: 'waerme', status: 'keine', prozent: null, grund: w && w.ok ? 'keineDeckung' : (w && w.grund) || 'keinPlan', bedarfKwh: w && w.ok ? w.kwh : null, bedarfKwhM2: w && w.ok ? w.kwhM2 : null, karte: 'daemmung' };
  }
  function essenZeile(flaecheM2, personen) {
    var e = essen(flaecheM2, personen);
    return { id: 'essen', status: e.ok ? 'wert' : 'fehlt', prozent: e.ok ? e.prozent : 0, grund: e.ok ? '' : e.grund, essen: e, karte: 'beet' };
  }
  function alle(eing) {
    return [strom(eing.strom), wasser(eing.wasser), waerme(eing.waerme), essenZeile(eing.flaeche, eing.personen)];
  }

  var API = { STUFEN: STUFEN, stufenDaten: stufenDaten, essen: essen, strom: strom, wasser: wasser, waerme: waerme, essenZeile: essenZeile, alle: alle };
  root.AUTARKIE_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
