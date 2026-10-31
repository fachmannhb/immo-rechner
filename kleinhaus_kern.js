/* Kern „Kleinhäuser“ (K1), rein, auch in Node (tmp/kleinhaus_kern_test.js). plan.kleinhaus = { ref, typ, herkunft, regler 0 zu .. 1 offen, schnee, wind }. Ampel nur über ANBAU_KERN.verfahrensfrei.
   Fehlende Teilbeträge bleiben „Keine Angabe“, die Summe heißt „mindestens“. USD / EZB-Kurs; netto + 19 %; Zoll = Satz × (Ware + Fracht); EUSt = 19 % × (Zollwert + Zoll), § 11 UStG. R078. */
(function (root) {
  'use strict';
  var AK = root.ANBAU_KERN || (typeof require === 'function' ? require('./anbau_kern.js') : null);
  var ANNAHMEN = { typ: 'ausklapp', herkunft: 'cn', regler: 1, schnee: '2', wind: '2' };
  var HERKUENFTE = ['de', 'pl', 'ua', 'cn', 'ru', 'by'], KOSTEN_ID = ['kauf', 'fracht', 'zoll', 'eust', 'kran', 'fundament', 'strom', 'wasser', 'abwasser', 'daemmung'];
  function ok(x) { return typeof x === 'number' && isFinite(x); }
  function r2(x) { return Math.round(x * 100) / 100; }
  function r3(x) { return Math.round(x * 1000) / 1000; }
  function KD() { return root.DATEN && root.DATEN.kleinhaus; }
  function typInfo(id) { var l = KD() ? KD().typen : []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function planKh(plan) {
    var p = plan && plan.kleinhaus && typeof plan.kleinhaus === 'object' && !Array.isArray(plan.kleinhaus) ? plan.kleinhaus : null, r = { vorhanden: !!p, ref: '', typ: ANNAHMEN.typ, herkunft: ANNAHMEN.herkunft, regler: ANNAHMEN.regler, schnee: ANNAHMEN.schnee, wind: ANNAHMEN.wind, explizit: {}, meldungen: [] }, d = KD();
    if (!p) return r;
    if (typeof p.ref === 'string' && /^[a-z0-9_]{1,12}$/.test(p.ref)) r.ref = p.ref;
    if (p.typ !== undefined) { if (typInfo(p.typ)) { r.typ = p.typ; r.explizit.typ = true; } else r.meldungen.push({ feld: 'typ', wert: String(p.typ) }); }
    if (p.herkunft !== undefined) { if (HERKUENFTE.indexOf(p.herkunft) >= 0) { r.herkunft = p.herkunft; r.explizit.herkunft = true; } else r.meldungen.push({ feld: 'herkunft', wert: String(p.herkunft) }); }
    if (ok(p.regler)) { r.regler = Math.min(1, Math.max(0, p.regler)); r.explizit.regler = true; }
    [['schnee', d && d.eignung.schnee], ['wind', d && d.eignung.wind]].forEach(function (k) {
      if (p[k[0]] === undefined) return;
      if (k[1] && k[1].some(function (z) { return z.z === p[k[0]]; })) { r[k[0]] = p[k[0]]; r.explizit[k[0]] = true; } else r.meldungen.push({ feld: k[0], wert: String(p[k[0]]) });
    });
    return r;
  }
  /* Außenmaß bei Reglerwert r: Faltcontainer ändert die Höhe, Ausklapp-Container die Breite, alle anderen bleiben gleich */
  function mass(t, r) {
    var z = t.zu, o = t.offen, f = t.regler ? Math.min(1, Math.max(0, ok(r) ? r : 1)) : 1, m = { l: o[0], b: o[1], h: o[2] };
    if (t.regler) { m.b = z[1] + f * (o[1] - z[1]); m.h = z[2] + f * (o[2] - z[2]); m.l = z[0] + f * (o[0] - z[0]); }
    return { l: r3(m.l), b: r3(m.b), h: r3(m.h), f: f };
  }
  function flaeche(t) { return r2(t.offen[0] * t.offen[1]); }
  function wohnflaeche(t) { var w = t.wohn; return w.m2 != null ? { m2: w.m2, art: w.art } : { m2: null, bis: w.bis, von: w.von, art: w.art }; }
  /* „kleines Gebäude“ (§ 3 Nr. 17 GModG): höchstens 50 m² Nutzfläche. Näherung: Wohn- bzw. Innenfläche, die beheizte Gebäudenutzfläche ist nicht berechnet */
  function kleinesGebaeude(m2) { return { m2: m2, grenze: 50, klein: ok(m2) && m2 <= 50 }; }
  function komp(key) { var d = KD(), c = d.komp[key]; return c ? c : null; }
  /* ein Kostenbaustein -> Zeile in Euro */
  function zeile(id, c, o) {
    var d = KD(), z = { id: id, ids: c.ids, q: c.q ? c.q.split(',').map(function (s) { return s.trim(); }) : [], status: c.status, abruf: c.abruf, hinweis: c.hinweis || '', von: null, bis: null, luecke: false, entf: false, grund: '', brutto: !!c.brutto };
    if (c.luecke) { z.luecke = true; z.grund = c.luecke; return z; }
    if (c.entf) { z.entf = true; z.grund = c.entf; z.von = 0; z.bis = 0; return z; }
    var v = c.je_m2 ? [c.je_m2[0] * o.flaeche, c.je_m2[1] * o.flaeche] : [c.von, c.bis], k = 1;
    if (c.w === 'USD') { k = 1 / d.kurs.usd; z.usd = true; }
    if (c.netto) { k *= 1 + d.ust.satz; z.nettoZuBrutto = true; }
    if (o.teiler && id === 'fracht') { k /= o.teiler; z.teiler = o.teiler; }
    z.von = r2(v[0] * k); z.bis = r2(v[1] * k);
    return z;
  }
  function kosten(typId, herk, opt) {
    var d = KD(), t = typInfo(typId), k = d && d.kosten[herk];
    if (!d || !t) return { ok: false, grund: 'keineDaten' };
    if (herk === 'ru' || herk === 'by') return { ok: true, erlaubt: false, herk: herk, typ: typId, verbot: d.verboten[herk] };
    if (!k) return { ok: false, grund: 'keineZeile' };
    var Z = {}, fl = flaeche(t);
    Z.kauf = zeile('kauf', d.komp[d.kosten.kauf[typId + '|' + herk] || k.kauf], { flaeche: fl });
    Z.fracht = zeile('fracht', d.komp[k.fracht], { flaeche: fl, teiler: herk === 'cn' ? t.je : 0 });
    if (herk === 'cn' && t.je > 1) Z.fracht.teilerBeleg = !!t.jeBeleg;
    var wk = !Z.kauf.luecke && !Z.fracht.luecke;
    if (k.zoll === 'auto') {
      if (!t.zoll) Z.zoll = zeile('zoll', d.komp.l_zoll_holz, {});
      else if (wk) {
        var zs = d.zoll.satz;
        Z.zoll = zeile('zoll', { ids: d.zoll.ids, q: d.zoll.q, status: d.zoll.status, abruf: d.zoll.abruf, hinweis: d.zoll.hinweis, von: 0, bis: 0, w: 'EUR' }, {});
        Z.zoll.von = r2(zs * (Z.kauf.von + Z.fracht.von)); Z.zoll.bis = r2(zs * (Z.kauf.bis + Z.fracht.bis)); Z.zoll.rechnung = 'zollwert';
      } else Z.zoll = zeile('zoll', d.komp.l_zoll_wert, {});
    } else Z.zoll = zeile('zoll', d.komp[k.zoll], {});
    if (k.eust === 'auto') {
      if (wk && !Z.zoll.luecke && t.zoll) {
        Z.eust = zeile('eust', { ids: d.ust.ids, q: d.ust.q, status: d.ust.status, abruf: d.ust.abruf, hinweis: d.bemessung.hinweis, von: 0, bis: 0, w: 'EUR' }, {});
        Z.eust.von = r2(d.ust.satz * (Z.kauf.von + Z.fracht.von + Z.zoll.von)); Z.eust.bis = r2(d.ust.satz * (Z.kauf.bis + Z.fracht.bis + Z.zoll.bis)); Z.eust.rechnung = 'eust';
      } else Z.eust = zeile('eust', d.komp.l_eust_wert, {});
    } else Z.eust = zeile('eust', d.komp[k.eust], {});
    ['kran', 'fundament', 'strom', 'wasser', 'abwasser', 'daemmung'].forEach(function (id) { Z[id] = zeile(id, d.komp[id === 'kran' && typId === 'tiny' ? 'kran_tiny' : id], { flaeche: fl }); });
    var zl = KOSTEN_ID.map(function (id) { return Z[id]; }), von = 0, bis = 0, lu = 0;
    zl.forEach(function (z) { if (z.luecke) lu++; else { von += z.von; bis += z.bis; } });
    return { ok: true, erlaubt: true, herk: herk, typ: typId, zeilen: zl, summe: { von: r2(von), bis: r2(bis), mindestens: lu > 0, luecken: lu, ohneKauf: !!Z.kauf.luecke }, flaeche: fl };
  }
  /* Bauantrag-Ampel: nur das vorhandene Modul. „lager“ = Gartenhaus ohne Aufenthaltsraum (kann grün sein), „wohnen“ = Wohnraum (Modul: keinBaustein, grau) */
  function ampel(typId, land) {
    var t = typInfo(typId), fl = flaeche(t), h = t.offen[2];
    return { land: land, flaeche: fl, hoehe: h, lager: AK.verfahrensfrei('gartenhaus', land, fl, h, null), wohnen: AK.verfahrensfrei('anbau', land, fl, h, null) };
  }
  function findeBaustein(ctx, ref) {
    var l = (ctx.items || []).filter(function (x) { return x.art === 'gartenhaus'; });
    if (ref) return l.filter(function (x) { return x.id === ref; })[0] || { fehlt: true, ref: ref };
    return null;
  }
  function rechne(plan) {
    var ps = planKh(plan), d = KD(), c = { ps: ps, ok: false, grund: d ? '' : 'keineDaten' };
    if (!d) return c;
    var t = typInfo(ps.typ), land = AK.planLand(plan);
    c.ok = true; c.typ = t; c.land = land; c.landName = AK.aussenInfo ? (root.REGELN ? root.REGELN.landInfo(land).name : land) : land;
    c.mass = mass(t, ps.regler); c.flaeche = flaeche(t); c.wohn = wohnflaeche(t);
    c.klein = kleinesGebaeude(c.wohn.m2 != null ? c.wohn.m2 : c.wohn.bis);
    c.kosten = kosten(ps.typ, ps.herkunft);
    c.alle = HERKUENFTE.map(function (h) { return kosten(ps.typ, h); });
    c.ampel = ampel(ps.typ, land);
    return c;
  }
  /* ---------- Bearbeiten (schreibt in den Plan; der Aufrufer ruft danach GRUNDRISS.geaendert()) ---------- */
  function sicher(plan) { if (!plan.kleinhaus || typeof plan.kleinhaus !== 'object' || Array.isArray(plan.kleinhaus)) plan.kleinhaus = {}; return plan.kleinhaus; }
  function wahlSetzen(plan, feld, wert) {
    var d = KD(), p;
    if (feld === 'typ') { if (!typInfo(wert)) return false; p = sicher(plan); p.typ = wert; return true; }
    if (feld === 'herkunft') { if (HERKUENFTE.indexOf(wert) < 0) return false; p = sicher(plan); p.herkunft = wert; return true; }
    if (feld === 'regler') { if (!ok(wert)) return false; p = sicher(plan); p.regler = r2(Math.min(1, Math.max(0, wert))); return true; }
    if (feld === 'schnee' || feld === 'wind') { if (!d.eignung[feld].some(function (z) { return z.z === wert; })) return false; p = sicher(plan); p[feld] = wert; return true; }
    return false;
  }
  function verknuepfen(plan, id) {
    var ok2 = (plan.aussen || []).some(function (a) { return a.art === 'gartenhaus' && a.id === id; });
    if (!ok2) return { ok: false, grund: 'keinGartenhaus' };
    sicher(plan).ref = id;
    return { ok: true, id: id };
  }
  var API = { ANNAHMEN: ANNAHMEN, HERKUENFTE: HERKUENFTE, KOSTEN_ID: KOSTEN_ID, typInfo: typInfo, planKh: planKh, mass: mass, flaeche: flaeche, wohnflaeche: wohnflaeche, kleinesGebaeude: kleinesGebaeude, kosten: kosten, ampel: ampel, findeBaustein: findeBaustein,
    rechne: rechne, wahlSetzen: wahlSetzen, verknuepfen: verknuepfen };
  root.KLEINHAUS_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
