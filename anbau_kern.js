/* Rechenkern „Anbau und Nebengebäude“ (Welle D, Teil 3), rein, läuft auch in Node (tmp/anbau_kern_test.js); Oberfläche: grundriss_anbau.js.
   Kosten: nur Wintergarten belegt (daten/daemmung_seite.js, wintergarten_anbau: €/m² × Fläche), sonst „Keine Angabe“. Bauantrag: daten/verfahrensfrei.js je Land;
   die Einheit steht an jedem Wert und wird NIE umgerechnet (m² Grundfläche, m³ Rauminhalt = Fläche × Höhe). Die Ampel ist eine EIGENE Einordnung (R078, keine Rechtsaussage):
   grün bis 90 % des Grenzwerts, gelb bis zur Grenze, rot darüber, grau wenn der Text das Bauwerk nicht nennt. Unklare Zuordnung: alle Einträge zeigen, nicht raten. Annahmen: ANNAHMEN. */
(function (root) {
  'use strict';
  var RK = root.REGELN || (typeof require === 'function' ? require('./regeln_kern.js') : null);

  /* Annahmen (eigene Wahl, in der Seite als Annahme gekennzeichnet): Gelb-Schwelle und Starthöhe für Grenzen in m³ */
  var ANNAHMEN = { gelbAb: 0.9, hoehe: 2.5 };
  var TW = 'terrassendach_wintergarten', GC = 'garage_carport';
  /* min/max/start: Reglerbereich und Startwert in m²; passt: Muster für den Namen im Eintrag (null = alle Einträge); wohnraum: kein Baustein in den Daten */
  var ARTEN = [
    { id: 'wg_kalt', baustein: [TW], passt: /wintergarten/i, kosten: 'wg_kalt', gesamt: 'kalt', min: 4, max: 60, start: 15 },
    { id: 'wg_warm', baustein: [TW], passt: /wintergarten/i, kosten: 'wg_warm', gesamt: 'warm', beheizt: true, min: 4, max: 60, start: 15 },
    { id: 'terrassendach', baustein: [TW], passt: /terrasse/i, min: 4, max: 80, start: 20 },
    { id: 'carport', baustein: [GC], passt: /carport|überdachte|stellplatz|abstellplatz/i, min: 6, max: 60, start: 15 },
    { id: 'garage', baustein: [GC], passt: /garage/i, min: 6, max: 80, start: 18 },
    { id: 'gartenhaus', baustein: ['gartenhaus', 'gartengeraetehaus'], passt: null, min: 2, max: 60, start: 12 },
    { id: 'anbau', baustein: [], wohnraum: true, min: 5, max: 100, start: 20 },
    { id: 'aufstockung', baustein: [], wohnraum: true, min: 10, max: 200, start: 40 }
  ];
  var FLAECHE_MIN = 1, FLAECHE_MAX = 500, HOEHE_MIN = 1, HOEHE_MAX = 10;
  var RANG = { gruen: 0, grau: 1, gelb: 2, rot: 3 };

  function DL() { return root.DATEN && root.DATEN.daemmung_seite; }
  function VF() { return root.DATEN && root.DATEN.verfahrensfrei; }
  function zahlOk(x) { return typeof x === 'number' && isFinite(x); }
  function klemme(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function artInfo(id) { for (var i = 0; i < ARTEN.length; i++) if (ARTEN[i].id === id) return ARTEN[i]; return null; }

  /* Belege */
  function dlEintrag(id) {
    var l = DL() && DL().wintergarten_anbau; if (!l) return null;
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }
  function beleg(e) {
    if (!e) return null;
    var q = DL().quellen && DL().quellen[e.quelle];
    return { id: e.id, name: e.name || '', status: e.status || '', abruf: e.abruf || '', quelle: q ? q.titel : (e.quelle || ''), url: q ? q.url : '', hinweis: e.hinweis || '' };
  }
  function vfQuellen(e, vf) {
    return (e.quelle || []).map(function (id) { var q = vf.quellen && vf.quellen[id]; return { id: id, titel: q ? q.titel : id, url: q && id !== 'KEINE' ? q.url : '' }; })
      .filter(function (q) { return q.id !== 'KEINE'; });
  }

  /* Plan-Feld (tolerant: fehlt es, gilt der Startzustand) */
  function planAnbau(plan) {
    var pa = plan && plan.anbau && typeof plan.anbau === 'object' && !Array.isArray(plan.anbau) ? plan.anbau : null;
    var res = { art: null, info: null, flaeche: null, hoehe: ANNAHMEN.hoehe, flaecheExplizit: false, hoeheExplizit: false, meldung: null };
    if (!pa) return res;
    if (typeof pa.art === 'string' && pa.art !== '') {
      var info = artInfo(pa.art);
      if (info) { res.art = info.id; res.info = info; } else res.meldung = { feld: 'anbau', id: pa.art };
    }
    if (!res.info) return res;
    res.flaeche = res.info.start;
    if (zahlOk(pa.flaeche_m2)) { res.flaeche = klemme(pa.flaeche_m2, FLAECHE_MIN, FLAECHE_MAX); res.flaecheExplizit = true; }
    if (zahlOk(pa.hoehe_m)) { res.hoehe = klemme(pa.hoehe_m, HOEHE_MIN, HOEHE_MAX); res.hoeheExplizit = true; }
    return res;
  }
  function planLand(plan) { return plan && RK && RK.landOk(plan.land) ? plan.land : 'HB'; }
  function landName(k) { return RK ? RK.landInfo(k).name : k; }

  /* Kosten */
  function kosten(artId, flaeche) {
    var a = artInfo(artId);
    if (!a || !zahlOk(flaeche) || flaeche <= 0) return { ok: false, grund: 'eingabe' };
    if (!a.kosten) {
      var res = { ok: false, grund: a.wohnraum ? 'wohnraum' : 'keinPreis' };
      if (a.wohnraum) res.beleg = beleg(dlEintrag('wg_anbau_kosten'));
      return res;
    }
    var z = dlEintrag(a.kosten);
    if (!z || !zahlOk(z.von) || !zahlOk(z.bis)) return { ok: false, grund: 'keinPreis' };
    var out = { ok: true, art: a.id, flaeche: flaeche, jeVon: z.von, jeBis: z.bis, einheit: z.einheit, von: z.von * flaeche, bis: z.bis * flaeche, beleg: beleg(z),
      nichtInWohnflaeche: true, beheizt: !!a.beheizt, gmodgLuecke: a.beheizt ? beleg(dlEintrag('wg_gmodg')) : null };
    var g = dlEintrag('wg_gesamt');
    if (g && zahlOk(g[a.gesamt + '_von']) && zahlOk(g[a.gesamt + '_bis'])) {
      out.gesamt = { typ: a.gesamt, von: g[a.gesamt + '_von'], bis: g[a.gesamt + '_bis'], beleg: beleg(g) };
      out.ueberGesamt = out.bis > out.gesamt.bis;
    }
    return out;
  }
  /* Bauantrag-Ampel */
  function bewerte(e, a, flaeche, hoehe, vf) {
    var z = {
      bauwerk: e.bauwerk || '', baustein: e.baustein, art: e.art || 'luecke', wert: zahlOk(e.wert) ? e.wert : null, einheit: e.einheit || '', wertRoh: e.wert_roh || '',
      bedingung: e.bedingung && !/^[–—-]$/.test(String(e.bedingung).trim()) ? e.bedingung : '', aussenbereich: e.aussenbereich || '',
      aussenWert: zahlOk(e.ausserbereich_wert) ? e.ausserbereich_wert : null, paragraf: e.paragraf || '', quellen: vfQuellen(e, vf),
      abruf: e.abruf || vf.abruf_std || '', status: e.status || vf.status_std || '', hinweis: e.hinweis || '', grund: e.luecke_grund || '',
      sonder: /au(ß|ss)enbereich/i.test(e.bauwerk || ''), ampel: 'grau', ursache: null, mass: null, anteil: null, rechnung: null
    };
    if (e.status === 'Lücke' || e.art === undefined) { z.ursache = 'luecke'; return z; }
    switch (e.art) {
      case 'grenze':
        if (!z.wert || (z.einheit !== 'm²' && z.einheit !== 'm³')) { z.ursache = 'einheit'; break; }
        if (z.einheit === 'm²') { z.mass = flaeche; z.rechnung = { typ: 'flaeche', flaeche: flaeche }; }
        else { z.mass = flaeche * hoehe; z.rechnung = { typ: 'volumen', flaeche: flaeche, hoehe: hoehe }; }
        z.anteil = z.mass / z.wert;
        z.ampel = z.mass > z.wert ? 'rot' : (z.mass >= ANNAHMEN.gelbAb * z.wert ? 'gelb' : 'gruen');
        break;
      case 'ohne_grenze': z.ampel = 'gruen'; z.ursache = 'ohneGrenze'; break;
      case 'nicht_frei': z.ampel = 'rot'; z.ursache = 'nichtFrei'; break;
      case 'nicht_genannt': z.ursache = 'nichtGenannt'; break;
      case 'text': z.ursache = 'text'; break;
      default: z.ursache = 'sonst';
    }
    /* Eintrag nur für „unbeheizt“: sagt nichts über den beheizten Wintergarten (grau) */
    if (a.beheizt && /unbeheizt/i.test(z.bedingung) && z.ampel !== 'grau') { z.ampelOhneBeheizt = z.ampel; z.ampel = 'grau'; z.ursache = 'nurUnbeheizt'; }
    return z;
  }
  function verfahrensfrei(artId, land, flaeche, hoehe) {
    var a = artInfo(artId), vf = VF();
    if (!a || !zahlOk(flaeche)) return { ok: false, grund: 'eingabe' };
    if (!vf || !vf.laender) return { ok: false, grund: 'keineDaten' };
    var l = vf.laender[land];
    if (!l) return { ok: false, grund: 'keinLand' };
    hoehe = zahlOk(hoehe) ? hoehe : ANNAHMEN.hoehe;
    var res = { ok: true, art: a.id, land: land, landName: landName(land), flaeche: flaeche, hoehe: hoehe, zeilen: [], summe: { ampel: 'grau', mehrere: false, ursache: 'keinBaustein' }, brauchtHoehe: false, gefunden: [] };
    if (a.wohnraum) return res;     /* kein Baustein in den Daten: nur „Bauaufsicht fragen“ */
    var alle = [];
    a.baustein.forEach(function (b) { (l.strukturen[b] || []).forEach(function (e) { alle.push(Object.assign({ baustein: b }, e)); }); });
    res.gefunden = alle.filter(function (e) { return e.bauwerk; }).map(function (e) { return e.bauwerk; });
    var treffer = alle.filter(function (e) { return !a.passt || !e.bauwerk || a.passt.test(e.bauwerk); });
    if (!treffer.length) { res.summe = { ampel: 'grau', mehrere: false, ursache: 'nichtGenannt' }; return res; }
    res.zeilen = treffer.map(function (e) { return bewerte(e, a, flaeche, hoehe, vf); });
    res.brauchtHoehe = res.zeilen.some(function (z) { return z.art === 'grenze' && z.einheit === 'm³'; });
    var haupt = res.zeilen.filter(function (z) { return !z.sonder; });
    if (!haupt.length) haupt = res.zeilen;
    var schlimm = haupt[0];
    haupt.forEach(function (z) { if (RANG[z.ampel] > RANG[schlimm.ampel]) schlimm = z; });
    res.summe = { ampel: schlimm.ampel, mehrere: haupt.length > 1, ursache: schlimm.ursache, zeile: schlimm };
    return res;
  }

  /* Abstandsflächen und Sachsen */
  function abstand(land) {
    var z = dlEintrag('wg_abstand');
    var out = { allgemein: true, land: land, landName: landName(land), by: null };
    if (land === 'BY' && z) out.by = { faktor: z.faktor_h, min: z.min_m, gewerbe: z.faktor_h_gewerbe, name: z.name, beleg: beleg(z) };
    return out;
  }
  /* Sachsen: Merkblatt (wg_sachsen) gegen verfahrensfrei.js; amtlich vor Merkblatt, die Seite zeigt den Gesetzeswert */
  function sachsen(artId, land, vfRes) {
    if (land !== 'SN' || (artId !== 'garage' && artId !== 'carport') || !vfRes || !vfRes.ok) return null;
    var z = dlEintrag('wg_sachsen');
    var hauptZ = null;
    vfRes.zeilen.forEach(function (x) { if (x.art === 'grenze' && x.einheit === 'm²' && !hauptZ) hauptZ = x; });
    if (!z || !hauptZ) return null;
    return { merkblatt: z.von, einheit: z.einheit, gesetz: hauptZ.wert, gleich: z.von === hauptZ.wert && z.einheit === hauptZ.einheit, beleg: beleg(z) };
  }

  /* Alles zusammen */
  function rechne(plan) {
    var pa = planAnbau(plan), land = planLand(plan), c = { pa: pa, land: land, landName: landName(land), leer: !pa.art };
    if (c.leer) return c;
    c.kosten = kosten(pa.art, pa.flaeche);
    c.vf = verfahrensfrei(pa.art, land, pa.flaeche, pa.hoehe);
    c.abstand = abstand(land);
    c.sachsen = sachsen(pa.art, land, c.vf);
    return c;
  }

  var API = {
    ANNAHMEN: ANNAHMEN, ARTEN: ARTEN, RANG: RANG, FLAECHE_MIN: FLAECHE_MIN, FLAECHE_MAX: FLAECHE_MAX, HOEHE_MIN: HOEHE_MIN, HOEHE_MAX: HOEHE_MAX,
    artInfo: artInfo, planAnbau: planAnbau, planLand: planLand, kosten: kosten, verfahrensfrei: verfahrensfrei, abstand: abstand, sachsen: sachsen, rechne: rechne
  };
  root.ANBAU_KERN = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
