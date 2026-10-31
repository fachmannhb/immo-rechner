/* Mappe für den Hausbauer (M1): sammelt aus Plan und Kernen ein Objekt (rein, ohne Texte/DOM). Jede Zahl kommt aus derselben Funktion mit denselben Argumenten wie in der Karte;
   Bedienzustand (Stufe, Altbelag, Putz) kommt über opt. */
(function (root) {
  'use strict';
  var FESTE = ['festpreis', 'zeitplan', 'gewaehrleistung', 'nichtEnthalten'];
  var ok = function (x) { return typeof x === 'number' && isFinite(x); };
  function heuteLokal() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function belege(liste) {
    var seen = {}, out = [];
    liste.forEach(function (b) {
      if (!b) return;
      var x = { titel: b.quelleTitel || b.titel || b.quelle || b.name || '', url: /^https?:/.test(b.url || '') ? b.url : '', abruf: b.abruf || '', status: b.status || '' }, k = x.titel + '|' + x.abruf;
      if (x.titel && !seen[k]) { seen[k] = 1; out.push(x); }
    });
    return out;
  }

  /* Raumliste: dieselben Bausteine wie raumWohn in grundriss.js */
  function raumliste(plan) {
    var R = root.RECHNER, RK = root.REGELN, ART = {}, out = { zeilen: [], etagen: [], grund: 0, wohn: 0, nutz: 0 };
    ((root.DATEN && root.DATEN.moebel && root.DATEN.moebel.artikel) || []).forEach(function (a) { ART[a.id] = a; });
    plan.etagen.forEach(function (e, ei) {
      var s = { name: e.name, index: ei, raeume: 0, grund: 0, wohn: 0, nutz: 0 };
      (e.raeume || []).forEach(function (r) {
        var f = R.polygonFlaeche(r.punkte), d = { flaeche: f, art: r.art, teil12: r.teil12, teil0: r.teil0, balkonProzent: r.balkon };
        var w = Math.max(0, R.wohnflaecheRaum(d) - (r.art === 'voll' ? RK.treppenAbzug(e, r, ART) : 0));
        out.zeilen.push({ etage: e.name, etageIndex: ei, id: r.id, name: r.name, nutzung: RK.nutzungVon(r), art: r.art, flaeche: f, wohn: w });
        s.raeume++; s.grund += f; s.wohn += w; s.nutz += R.nutzflaecheRaum(d);
      });
      out.etagen.push(s); out.grund += s.grund; out.wohn += s.wohn; out.nutz += s.nutz;
    });
    return out;
  }

  /* Zuordnung (M2): welche Zeile welche Leistung abdeckt. „zaehlt“ ist die Zeile mit der umfassenderen Basis (inklusive Einbau/Arbeit) und zählt in die Summe; die Zeilen
     in „deckt“ bleiben sichtbar, zählen aber nicht (Vermerk „schon in … enthalten“). Nur wenn die zählende Zeile einen Preis hat. sicher=false: Überschneidung nicht sicher
     aufzulösen -> beide gezeigt, keine doppelt in der Summe, dazu eine Frage an den Bauunternehmer. Schlüssel: Gruppe/Id; „daemmung/wand“ und „daemmung/fenster“ sind Teile der Dämm-Zeile. */
  var ZUORDNUNG = [
    { id: 'boden', zaehlt: 'innenausbau/boden', deckt: ['material/boden'], sicher: true },
    { id: 'wanddaemmung', zaehlt: 'daemmung/wand', deckt: ['material/daemmung'], sicher: false },
    { id: 'fenster', zaehlt: 'daemmung/fenster', deckt: ['material/fenster', 'material/verglasung'], sicher: false }
  ];
  var SUMMEN_GRUPPEN = { innenausbau: 1, material: 1, daemmung: 1, lueftung: 1, anbau: 1 };
  function preisig(x) { return !!x && ((ok(x.von) && x.von > 0) || (ok(x.bis) && x.bis > 0)); }
  function abschlussMit(z, lu, fe, ex) {
    var idx = {}, ue = [], roh = { von: 0, bis: 0 }, sum = { von: 0, bis: 0 }, weg = {};
    z.forEach(function (r) {
      idx[r.gruppe + '/' + r.id] = r;
      if (r.gruppe === 'daemmung') (r.teile || []).forEach(function (t) { idx['daemmung/' + t.bauteil] = t; });
    });
    ZUORDNUNG.forEach(function (u) {
      if (!preisig(idx[u.zaehlt])) return;
      var da = u.deckt.filter(function (k) { return idx[k] && !idx[k].teile; });
      if (!da.length) return;
      da.forEach(function (k) { idx[k].inSumme = false; idx[k].enthaltenIn = u.zaehlt; idx[k].sicher = u.sicher; weg['k:' + k.replace('/', ':')] = 1; });
      ue.push({ id: u.id, zaehlt: u.zaehlt, deckt: da, sicher: u.sicher });
    });
    z.forEach(function (r) {
      if (!SUMMEN_GRUPPEN[r.gruppe]) return;
      if (ok(r.von)) roh.von += r.von;
      if (ok(r.bis)) roh.bis += r.bis;
      if (r.inSumme === false) return;
      if (ok(r.von)) sum.von += r.von;
      if (ok(r.bis)) sum.bis += r.bis;
    });
    return { zeilen: z, summe: sum, summeRoh: roh, ueberlappungen: ue, luecken: lu.filter(function (l) { return !weg[l.id]; }), fehler: fe, heiz: ex.heiz, foerderung: ex.foerderung };
  }

  /* Kosten: Innenausbau, Material, Dämm-Mehrkosten, Lüftung einmalig, Anbau wie in den Karten; jede Leistung genau einmal in der Summe (ZUORDNUNG) */
  function kostenBlock(plan, opt, B) {
    var K = root.AUSBAU_KERN, HK = root.HUELLE_KERN, z = [], lu = [], fe = [], ex = { heiz: null, foerderung: [] };
    function abschluss(a, b, c) { return abschlussMit(a, b, c, ex); }
    var pm = K.planMaterial(plan), mg = K.mengenAusPlan(plan), stufe = opt.stufe === 0 || opt.stufe === 2 ? opt.stufe : 1;
    if (mg.ok) {
      B.mg = mg;
      var ik = K.innenausbauKosten(mg, null, stufe, { altbelag: !!opt.altbelag, putz: !!opt.putz, bodenMaterial: pm.explizit.boden ? pm.wahl.boden : '' });
      ik.gewerke.forEach(function (g) {
        if (!g.positionen.length) return;
        z.push({ gruppe: 'innenausbau', id: g.id, von: g.von, bis: g.bis, luecke: g.positionen.some(function (p) { return p.luecke; }),
          belege: belege(g.positionen.filter(function (p) { return !p.luecke; }).map(function (p) { return { quelleTitel: p.quelleTitel, url: p.url, abruf: p.abruf, status: p.status }; })) });
        g.positionen.forEach(function (p) { if (p.luecke) lu.push({ id: 'k:innenausbau:' + p.id, key: 'mLuecke', par: { name: p.name } }); });
      });
    } else fe.push({ teil: 'innenausbau', grund: mg.fehler || '?' });
    var hb = K.hausBilanz(plan);
    if (!hb.ok) { fe.push({ teil: 'material', grund: hb.fehler || '?' }); return abschluss(z, lu, fe); }
    K.BAUTEILE_PLAN.forEach(function (bt) {
      var kz = hb.kosten.bauteile[bt], mi = K.matInfo(hb.wahl[bt]);
      if (!kz || kz.keine) return;
      var l = !!(kz.luecke || kz.von == null), m = mi ? mi.name : '';
      z.push({ gruppe: 'material', id: bt, material: m, von: ok(kz.von) ? kz.von : null, bis: ok(kz.bis) ? kz.bis : null, luecke: l, belege: kz.preis ? belege([kz.preis.beleg]) : [] });
      if (l) lu.push({ id: 'k:material:' + bt, key: 'mLuecke', par: { bauteil: bt, material: m } });
    });
    /* Dämmstandard und Lüftung: gleiche Argumente wie in grundriss_huelle.js */
    var ps = HK.planStandard(plan), pl = HK.planLueftung(plan);
    var hw = HK.heizwaermeMitStandard(plan, { bilanz: hb, standard: ps.id, lueftungsart: pl.art });
    var mf = HK.mehrkostenUndFoerderung(plan, ps.id, { heizwaerme: hw }), mk = mf.mehrkosten, ml = mk && mk.luecken && mk.luecken.length;
    if (mk && (mk.von > 0 || mk.bis > 0 || ml)) {
      z.push({ gruppe: 'daemmung', id: ps.id, von: mk.von, bis: mk.bis, luecke: !!ml, belege: belege((mk.teile || []).map(function (t) { return t.beleg; }).concat([mk.beleg])),
        teile: (mk.teile || []).map(function (t) { return { bauteil: t.bauteil, von: t.von, bis: t.bis }; }) });
      if (ml) lu.push({ id: 'k:daemmung:' + ps.id, key: 'mLuecke', par: { standard: ps.id } });
    }
    var lk = HK.lueftungKosten(plan, pl.art, { neubau: pl.neubau, mengen: hb.mengen });   /* Einmalkosten hängen nicht vom Strompreis ab */
    if (lk.ok && pl.art !== 'keine') {
      z.push({ gruppe: 'lueftung', id: pl.art, von: lk.einmalig.von, bis: lk.einmalig.bis, luecke: false, belege: belege(lk.belege) });
    }
    /* Heizwärme (nur Anzeige, keine Kosten) und Förderung (möglicher Zuschuss, wird nirgends abgezogen): gleiche Aufrufe wie die Hülle-Karte */
    if (hw && hw.ok && hw.gesamt && hw.transmission && hw.lueftung) {
      ex.heiz = { kwhM2: hw.gesamt.kwhM2, lo: hw.gesamt.kwhM2Lo, hi: hw.gesamt.kwhM2Hi, trans: hw.transmission.kwhM2, lueft: hw.lueftung.kwhM2, kwh: hw.gesamt.kwh, wohn: hw.wohnflaeche, standard: ps.id,
        belege: belege([hw.gradtage ? { titel: hw.gradtage.station + ' · ' + hw.gradtage.quelle, abruf: hw.gradtage.abruf, status: hw.gradtage.status } : null]) };
    }
    if (mf.foerderung && mf.foerderung.art !== 'keine') ex.foerderung.push({ quelle: 'daemmung', art: mf.foerderung.art, von: mf.foerderung.von, bis: mf.foerderung.bis, stufe: mf.foerderung.stufe || null, neubau: !!mf.neubau, belege: belege(mf.foerderung.belege) });
    if (lk.ok && pl.art !== 'keine' && lk.foerderung && lk.foerderung.art === 'beg') ex.foerderung.push({ quelle: 'lueftung', art: 'beg', von: lk.foerderung.von, bis: lk.foerderung.bis, stufe: null, neubau: false, belege: belege(lk.foerderung.belege || lk.belege) });
    var ac = B.ac;
    if (!ac.leer) {
      if (ac.kosten && ac.kosten.ok) {
        z.push({ gruppe: 'anbau', id: ac.pa.art, von: ac.kosten.von, bis: ac.kosten.bis, luecke: false, belege: belege([ac.kosten.beleg]) });
        if (ac.kosten.gmodgLuecke) lu.push({ id: 'gmodg', key: 'mLueckeGmodg', par: { art: ac.pa.art } });
      } else lu.push({ id: 'k:anbau:' + ac.pa.art, key: 'mLuecke', par: { art: ac.pa.art } });
    }
    return abschluss(z, lu, fe);
  }

  function sammle(plan, optionen) {
    var opt = optionen || {}, RK = root.REGELN, K = root.AUSBAU_KERN, HK = root.HUELLE_KERN, AK = root.ANBAU_KERN, GK = root.GRUNDSTUECK_KERN;
    var m = { ok: false, fehlt: [], fehler: [], luecken: [], annahmen: [], ampeln: [], fragen: [] };
    if (!plan || !Array.isArray(plan.etagen) || !root.RECHNER || !RK || !K || !HK || !AK || !GK) { m.fehler.push({ teil: 'start', grund: 'kern' }); m.fehlt.push('raeume'); return m; }
    var datum = opt.datum || heuteLokal(), land = AK.planLand(plan);
    m.raeume = raumliste(plan);
    m.kopf = { datum: datum, land: land, landName: RK.landInfo(land).name, etagen: m.raeume.etagen.filter(function (e) { return e.raeume > 0; }).length, wohn: m.raeume.wohn };
    if (!m.raeume.zeilen.length) { m.fehlt.push('raeume'); return m; }
    m.ok = true;
    var B = { ac: AK.rechne(plan) }, pm = K.planMaterial(plan), ps = HK.planStandard(plan), pl = HK.planLueftung(plan), pw = HK.planWasser(plan), pa = AK.planAnbau(plan);
    var gc = GK.rechne(plan), plus = !!(plan.grundstueck || gc.items.length), kb;
    try { kb = kostenBlock(plan, opt, B); } catch (e) { kb = { zeilen: [], summe: { von: 0, bis: 0 }, summeRoh: { von: 0, bis: 0 }, ueberlappungen: [], heiz: null, foerderung: [], luecken: [], fehler: [{ teil: 'kosten', grund: e && e.message ? e.message : '?' }] }; }
    m.kosten = kb; m.fehler = m.fehler.concat(kb.fehler); m.luecken = kb.luecken.slice(); m.ueberlappungen = kb.ueberlappungen;
    m.ausbau = {
      stufe: opt.stufe === 0 || opt.stufe === 2 ? opt.stufe : 1, altbelag: !!opt.altbelag, putz: !!opt.putz,
      material: K.BAUTEILE_PLAN.map(function (bt) { var mi = K.matInfo(pm.wahl[bt]); return { bauteil: bt, id: pm.wahl[bt], name: mi ? mi.name : '', explizit: !!pm.explizit[bt] }; }),
      daemmdickeCm: pm.wahl.daemmdicke_cm, standard: ps.id, standardExplizit: ps.explizit, lueftung: pl.art, lueftungExplizit: pl.explizit,
      wasser: { personen: pw.personen, regenwasser: pw.regenwasser },
      anbau: pa.art ? { art: pa.art, flaeche: pa.flaeche, hoehe: pa.hoehe } : null,
      grundstueck: plus ? { breite: gc.g.breite, tiefe: gc.g.tiefe, flaechen: gc.flaechen, zaehlung: gc.zaehlung,
        items: gc.items.map(function (it) { return { id: it.id, art: it.art, b: it.b, t: it.t, flaeche: it.flaeche, ampel: it.ampel, garten: !!it.garten }; }) } : null
    };
    /* Grundstücks-Preise nicht addierbar (Alternativen, €/Jahr, €/kW): Zeilen mit ohneSumme */
    gc.items.forEach(function (it) {
      (it.daten.kosten || []).forEach(function (k) {
        kb.zeilen.push({ gruppe: 'grundstueck', id: it.id + ':' + k.id, art: it.art, name: k.name, einheit: k.einheit, von: k.von, bis: k.bis, luecke: !!k.luecke, ohneSumme: true, belege: k.luecke ? [] : belege([k]) });
        if (k.luecke) m.luecken.push({ id: 'k:gs:' + it.id + ':' + k.id, key: 'mLuecke', par: { art: it.art, name: k.name } });
      });
    });
    /* Regeln des Landes: RK.pruefe, nur gelbe und rote Zeilen */
    var rg = RK.pruefe(plan, { datum: datum }), rang = { rot: 2, gelb: 1 };
    m.regeln = { datum: rg.datum, land: rg.land, summe: rg.summe, stand: RK.daten() ? RK.daten().stand : '', zeilen: [] };
    function zeile(z, id, name, etage) {
      if (!z || (z.ampel !== 'gelb' && z.ampel !== 'rot')) return;
      var w = (z.pruefungen || []).filter(function (p) { return rang[p.stufe]; }).sort(function (a, b) { return rang[b.stufe] - rang[a.stufe]; })[0];
      m.regeln.zeilen.push({ id: id, name: name, etage: etage, ampel: z.ampel, grund: w ? { code: w.code, par: w.par || {} } : null });
      m.ampeln.push({ id: 'rg:' + id, quelle: 'regel', name: name, ampel: z.ampel });
    }
    zeile(rg.haus, 'haus', '', '');
    rg.raeume.forEach(function (z) { if (z.art === 'voll') zeile(z, z.etageIndex + ':' + z.raum, z.name, z.etage); });
    m.anbauAmpel = null;
    if (!B.ac.leer) {
      var aa = B.ac.vf && B.ac.vf.ok ? B.ac.vf.summe.ampel : 'grau';
      m.anbauAmpel = { art: B.ac.pa.art, ampel: aa, flaeche: B.ac.pa.flaeche };
      if (aa !== 'gruen') m.ampeln.push({ id: 'anbau', quelle: 'anbau', art: B.ac.pa.art, ampel: aa });
    }
    gc.items.forEach(function (it) { if (!it.garten && it.ampel !== 'gruen') m.ampeln.push({ id: 'gs:' + it.id, quelle: 'grundstueck', art: it.art, ampel: it.ampel }); });
    /* Annahmen: alles, was die Seite selbst festgelegt hat */
    var an = function (id, par) { m.annahmen.push({ id: id, par: par || {} }); };
    var nm = m.ausbau.material.filter(function (x) { return !x.explizit && x.id; });
    if (nm.length) an('material', { items: nm.map(function (x) { return { bauteil: x.bauteil, name: x.name }; }) });
    if (!ps.explizit) an('standard', { standard: ps.id });
    if (!pl.explizit) an('lueftung');
    if (!pw.explizit.personen) an('personen', { n: pw.personen });
    if (B.mg && B.mg.annahmen.indexOf('raumhoehe') >= 0) an('raumhoehe', { h: K.ANNAHMEN.raumhoehe });
    if (pa.art && !(pa.flaecheExplizit && pa.hoeheExplizit)) an('anbau', { fl: pa.flaeche, h: pa.hoehe });
    if (plus && !gc.g.explizit.groesse) an('grundstueck', { b: gc.g.breite, t: gc.g.tiefe });
    gc.items.forEach(function (it) {
      if (it.art === 'sauna' && !it.ofenEigen) an('ofen:' + it.id);
      if (it.art === 'kleinwind' && !it.gebietEigen) an('gebiet:' + it.id);
    });
    m.fragen = fragen(m);
    return m;
  }

  /* Fragen: je Lücke Preisfrage, je gelbe/rote/graue Ampel „Bauantrag?“, je Annahme Rückfrage, dazu vier feste; jede Id einmal. */
  function fragen(s) {
    var out = [], seen = {};
    function dazu(f) { var k = f.typ + '|' + f.id; if (!seen[k]) { seen[k] = 1; out.push(f); } }
    (s.luecken || []).forEach(function (l) { dazu({ typ: 'luecke', id: l.id, key: 'mFrageLuecke', par: { l: l } }); });
    (s.ueberlappungen || []).forEach(function (u) { if (!u.sicher) dazu({ typ: 'ueberlappung', id: 'ue:' + u.id, key: 'mFrageUeber', par: { leistung: u.id } }); });
    (s.ampeln || []).forEach(function (a) {
      if (a.ampel === 'gelb' || a.ampel === 'rot' || a.ampel === 'grau') dazu({ typ: 'ampel', id: a.id, key: 'mFrageAmpel', par: { name: a.name || '', art: a.art || '', quelle: a.quelle || '', ampel: a.ampel } });
    });
    (s.annahmen || []).forEach(function (a) { dazu({ typ: 'annahme', id: a.id, key: 'mFrageAnnahme', par: { ap: a.par || {} } }); });
    FESTE.forEach(function (f) { dazu({ typ: 'fest', id: f, key: 'mFest_' + f, par: {} }); });
    return out;
  }

  root.MAPPE_KERN = { FESTE: FESTE, ZUORDNUNG: ZUORDNUNG,sammle: sammle, fragen: fragen, raumliste: raumliste, heuteLokal: heuteLokal };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MAPPE_KERN;
})(typeof window !== 'undefined' ? window : globalThis);
