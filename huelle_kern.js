/* Rechenkern für „Wie gut gedämmt?“, „Frische Luft“, „Wasser“ und die Energiepreise (Welle D, Teil 2b): reine Rechnung ohne Oberfläche, läuft auch in Node
   (tmp/huelle_kern_test.js lädt die Daten wie der Browser). Die Oberfläche steht in grundriss_huelle.js.
   Baut auf ausbau_kern.js auf (Mengen, U-Werte, Transmissionsrechnung) und nutzt dieselbe Gradtagzahl; es gibt keine zweite Heizwärme-Rechnung.
   Daten: daten/daemmung_seite.js (Standards, Förderung, Lüftung), daten/material_seite.js (anlage7), daten/wasser.js, daten/energiepreise.js, daten/sanierung.js (Fassade, Fenster).
   Jede recherchierte Zahl kommt mit Beleg (Quelle, Abruf, Status) aus den Daten; was nicht in den Daten steht, ist eine ANNAHME (unten) und wird in der Seite als Annahme gezeigt.
   Keine Bau-, Förder- oder Rechtsberatung (R006, R078): Fördersätze nur als Zahl mit Beleg, „vor Antrag am Original prüfen“. */
(function (root) {
  'use strict';
  var AK = root.AUSBAU_KERN || (typeof require === 'function' ? require('./ausbau_kern.js') : null);
  var DACH = root.GRUNDRISS_DACH || (typeof require === 'function' ? require('./grundriss_dach.js') : null);
  var EK = root.ENERGIE_KERN || (typeof require === 'function' ? require('./energie_kern.js') : null);

  /* ---------- Annahmen (eigene Wahl; in der Seite als Annahme gekennzeichnet) ---------- */
  var ANNAHMEN = {
    luftwechsel: 0.5,        /* 1/h: Mindestluftwechsel-Größenordnung; die Daten nennen keinen Wert (gm_dichtheit hat keine Zahl, n50 0,6 des Passivhauses ist ein Drucktestwert bei 50 Pa) */
    luftwaerme: 0.34,        /* Wh/(m³·K): volumenbezogene Wärmekapazität der Luft (Lehrbuchwert; keine Fundstelle in daten/ oder recherche/31) */
    wrgMitte: 0.85,          /* Mitte von lu_wrg_praxis (80 bis 90 %, Herstellerangabe) */
    wirkungsgrad: { gas: 0.9, oel: 0.85 },   /* Heizkessel; keine Zeile in den Daten */
    personen: 3,
    ph: { wand: 0.15, dach: 0.15, glas: 0.7, boden: 0.15 },   /* Passivhaus: Faustwerte; das Institut legt Bauteil-U nicht fest (Kriterium ist der Heizwärmebedarf 15) */
    ntwProPersonTag: { wc: 24, waschmaschine: 10 },           /* l: nur aus dem Satzungsbeispiel rw_satzung, keine Norm */
    filter: 0.9,             /* Filterwirkungsgrad: nur aus dem Satzungsbeispiel rw_satzung (rw_filter ist eine Lücke) */
    beiwertVon: 0.75,        /* Ertragsbeiwert: Satzungsbeispiel Ziegeldach 75 % bis Baunetzwissen 0,8 bis 0,9 (Spanne, die beide umfasst; w_wa_03) */
    beiwertBis: 0.9,
    bezugFlaecheZentral: 150 /* m²: lu_zentral nennt „Haus ca. 150 m²“; die Kosten werden proportional zur Wohnfläche umgerechnet (Annahme) */
  };
  var STANDARDS = ['bestand', 'gmodg', 'kfw', 'passivhaus'];
  var KFW_STUFEN = ['eh85', 'eh70', 'eh55', 'eh40'];
  var LUEFTUNG_ARTEN = ['keine', 'dez_abluft', 'dez_wrg', 'zentral'];
  var HAERTEN = ['weich', 'mittel', 'hart'];
  var TRAEGER = ['gas', 'oel'];

  function DL() { return root.DATEN && root.DATEN.daemmung_seite; }
  function WA() { return root.DATEN && root.DATEN.wasser; }
  function EP() { return root.DATEN && root.DATEN.energiepreise; }
  function SA() { return root.DATEN && root.DATEN.sanierung; }
  function MAT() { return root.DATEN && root.DATEN.material; }
  function zahlOk(x) { return typeof x === 'number' && isFinite(x); }
  function runde(x, n) { var f = Math.pow(10, n || 0); return Math.round(x * f) / f; }
  function klemme(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

  /* ---------- Belege ---------- */
  function quelleInfo(id) {
    var kandidaten = [DL(), WA(), EP(), MAT()];
    for (var i = 0; i < kandidaten.length; i++) { var q = kandidaten[i] && kandidaten[i].quellen && kandidaten[i].quellen[id]; if (q) return q; }
    return null;
  }
  function beleg(e, extra) {
    if (!e) return null;
    var q = quelleInfo(e.quelle);
    var b = { id: e.id, name: e.name || '', status: e.status || '', abruf: e.abruf || '', quelle: q ? q.titel : (e.quelle || ''), url: q ? q.url : '', hinweis: e.hinweis || '',
      von: e.von, bis: e.bis, einheit: e.einheit || '', gilt_ab: e.gilt_ab || '', gilt_bis: e.gilt_bis || '' };
    if (extra) Object.keys(extra).forEach(function (k) { b[k] = extra[k]; });
    return b;
  }
  function eintrag(daten, liste, id) {
    var l = daten && daten[liste]; if (!l) return null;
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }
  function dl(liste, id) { return eintrag(DL(), liste, id); }
  function wa(liste, id) { return eintrag(WA(), liste, id); }

  /* ====================================================================== Plan-Felder (tolerant: fehlt ein Feld, gilt der Standard; eine unbekannte Id ergibt eine Meldung) */
  function planStandard(plan) {
    var v = plan && plan.daemmstandard, res = { id: 'bestand', meldung: null, explizit: false, kfwStufe: 'eh55', kfwExplizit: false };
    if (typeof v === 'string' && v !== '') {
      if (STANDARDS.indexOf(v) >= 0) { res.id = v; res.explizit = true; } else res.meldung = { feld: 'daemmstandard', id: v };
    }
    var k = plan && plan.kfwstufe;
    if (typeof k === 'string' && k !== '') { if (KFW_STUFEN.indexOf(k) >= 0) { res.kfwStufe = k; res.kfwExplizit = true; } else res.meldung = res.meldung || { feld: 'kfwstufe', id: k }; }
    var m = plan && plan.mehrkosten_eigen;
    res.mehrkostenEigen = zahlOk(m) && m >= 0 ? m : null;
    return res;
  }
  function planLueftung(plan) {
    var pl = plan && plan.lueftung && typeof plan.lueftung === 'object' ? plan.lueftung : {}, res = { art: 'keine', meldung: null, explizit: false, neubau: false, neubauExplizit: false };
    if (typeof pl.art === 'string' && pl.art !== '') {
      if (LUEFTUNG_ARTEN.indexOf(pl.art) >= 0) { res.art = pl.art; res.explizit = true; } else res.meldung = { feld: 'lueftung', id: pl.art };
    }
    if (typeof pl.neubau === 'boolean') { res.neubau = pl.neubau; res.neubauExplizit = true; }
    else res.neubau = !!(plan && (plan.vorlage || plan.beispiel));   /* Annahme: ein Plan aus einer Vorlage gilt als Neubau */
    return res;
  }
  function planWasser(plan) {
    var pw = plan && plan.wasser && typeof plan.wasser === 'object' ? plan.wasser : {}, res = { personen: ANNAHMEN.personen, regenwasser: true, gruendach: false, haerte: 'mittel', enthaertung: false, preis: null, meldung: null, explizit: {} };
    var p = Number(pw.personen);
    if (isFinite(p) && p >= 1 && p <= 12) { res.personen = Math.round(p); res.explizit.personen = true; }
    if (typeof pw.regenwasser === 'boolean') { res.regenwasser = pw.regenwasser; res.explizit.regenwasser = true; }
    if (typeof pw.gruendach === 'boolean') res.gruendach = pw.gruendach;
    if (typeof pw.enthaertung === 'boolean') res.enthaertung = pw.enthaertung;
    if (typeof pw.haerte === 'string' && pw.haerte !== '') { if (HAERTEN.indexOf(pw.haerte) >= 0) { res.haerte = pw.haerte; res.explizit.haerte = true; } else res.meldung = { feld: 'haerte', id: pw.haerte }; }
    var pr = Number(pw.preis);
    if (isFinite(pr) && pr > 0 && pr < 50) res.preis = pr;
    return res;
  }
  /* Gas- und Ölpreis: Startwerte aus daten/energiepreise.js, Eingabe überschreibt (plan.energiepreise = { traeger, gas_ct, oel_eur100l }) */
  function energiepreise(plan) {
    var d = EP(), pe = plan && plan.energiepreise && typeof plan.energiepreise === 'object' ? plan.energiepreise : {};
    var gasE = eintrag({ e: d && d.eintraege }, 'e', 'gas_destatis_alle'), oelE = eintrag({ e: d && d.eintraege }, 'e', 'oel_tecson'), hwE = eintrag({ e: d && d.eintraege }, 'e', 'oel_heizwert_kwh'), bwE = eintrag({ e: d && d.eintraege }, 'e', 'oel_brennwert');
    var res = { traeger: 'gas', meldung: null, gasEigen: false, oelEigen: false };
    if (typeof pe.traeger === 'string' && pe.traeger !== '') { if (TRAEGER.indexOf(pe.traeger) >= 0) res.traeger = pe.traeger; else res.meldung = { feld: 'energiepreise', id: pe.traeger }; }
    res.gasCt = zahlOk(pe.gas_ct) && pe.gas_ct > 0 && pe.gas_ct < 200 ? pe.gas_ct : (gasE ? gasE.wert : 11.58); res.gasEigen = zahlOk(pe.gas_ct) && pe.gas_ct > 0 && pe.gas_ct < 200;
    res.oelEur100 = zahlOk(pe.oel_eur100l) && pe.oel_eur100l > 0 && pe.oel_eur100l < 1000 ? pe.oel_eur100l : (oelE ? oelE.wert : 180); res.oelEigen = zahlOk(pe.oel_eur100l) && pe.oel_eur100l > 0 && pe.oel_eur100l < 1000;
    res.oelKwhProL = hwE ? hwE.wert : 10.05;
    res.oelCt = oelCtProKwh(res.oelEur100, res.oelKwhProL);
    res.oelCtBrennwert = bwE ? oelCtProKwh(res.oelEur100, bwE.wert) : null;
    res.ct = res.traeger === 'oel' ? res.oelCt : res.gasCt;
    res.wirkungsgrad = ANNAHMEN.wirkungsgrad[res.traeger];
    res.belegGas = beleg(gasE); res.belegOel = beleg(oelE); res.belegOelKwh = beleg(hwE); res.belegOelBrennwert = beleg(bwE);
    return res;
  }
  /* €/100 l durch kWh/l: 1 € je 100 l sind 1 ct je l, also ergibt die Teilung durch kWh/l direkt ct/kWh */
  function oelCtProKwh(eur100l, kwhProL) { return zahlOk(eur100l) && zahlOk(kwhProL) && kwhProL > 0 ? eur100l / kwhProL : null; }
  /* Heizkosten je Jahr aus Nutzenergie: Q / Wirkungsgrad × Preis */
  function heizkosten(qKwh, ep) { return zahlOk(qKwh) ? qKwh / ep.wirkungsgrad * ep.ct / 100 : null; }

  /* ====================================================================== A: Dämmstandards */
  function a7(k) { var m = MAT(); return m && m.anlage7 && m.anlage7[k] ? m.anlage7[k] : null; }
  function uZeile(wert, e, annahme, extra) {
    var o = { wert: wert, annahme: !!annahme, beleg: e ? beleg(e) : null };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function a7Zeile(k) {
    var z = a7(k);
    if (!z) return null;
    return { wert: z.u, annahme: false, beleg: beleg({ id: z.id, name: z.name, quelle: z.quelle, abruf: z.abruf, status: z.status, einheit: 'W/(m²·K)', von: z.u, bis: z.u }) };
  }
  /* Vier Standards. u = Zielwerte je Bauteil (nur wo die Daten sie hergeben oder eine sichtbare Annahme gilt), heizRef = Heizwärme-Referenz, foerderung = Zeilen der Daten. */
  function daemmstandards() {
    var ph = ANNAHMEN.ph, ist = dl('altbau_heizwaerme', 'ab_efh_ist'), phHz = dl('passivhaus', 'ph_heizwaerme'), phLuft = dl('passivhaus', 'ph_luft');
    var res = {};
    res.bestand = { id: 'bestand', u: null, heizRef: ist ? { wert: ist.von, einheit: ist.einheit, beleg: beleg(ist) } : null,
      hinweis: 'ohneZiel' };
    res.gmodg = { id: 'gmodg', u: { wand: a7Zeile('wand'), dach: a7Zeile('dach'), glas: a7Zeile('glas'), boden: a7Zeile('decke_unten') },
      heizRef: null };
    res.kfw = { id: 'kfw', u: null, heizRef: null, stufen: {}, boni: beleg(dl('kfw', 'kfw261_boni')), stand: beleg(dl('kfw', 'kfw261_stand')), kredit297: beleg(dl('kfw', 'kfw297')), mehrkosten: beleg(dl('kfw', 'kfw_mehrkosten')) };
    KFW_STUFEN.forEach(function (s) {
      var e = dl('kfw', 'kfw261_' + s);
      res.kfw.stufen[s] = e ? { id: s, eeProz: e.ee_proz, nhProz: e.nh_proz, eeEur: e.ee_eur, nhEur: e.nh_eur, beleg: beleg(e) } : null;
    });
    res.passivhaus = { id: 'passivhaus', u: { wand: uZeile(ph.wand, null, true), dach: uZeile(ph.dach, null, true), glas: uZeile(ph.glas, null, true), boden: uZeile(ph.boden, null, true) },
      heizRef: phHz ? { wert: phHz.von, einheit: phHz.einheit, beleg: beleg(phHz) } : null, luftdicht: phLuft ? beleg(phLuft) : null, mehrkosten: beleg(dl('passivhaus', 'ph_mehrkosten')) };
    return res;
  }

  /* Transmissionsanteil bei gegebenem Ziel: je Bauteil gilt der kleinere U-Wert aus Ist (Materialwahl) und Ziel. v: 'mitte' | 'lo' | 'hi' */
  function uVariante(b, v) {
    var w = b.wand, f = b.fenster, au = b.annahmeU;
    var sw = v === 'lo' ? w.uNiedrig : (v === 'hi' ? w.uHoch : w.u), sf = v === 'lo' ? f.uNiedrig : (v === 'hi' ? f.uHoch : f.u);
    return { wand: sw, fenster: sf, tuer: au.tuer, dach: au.dach, boden: au.boden };
  }
  function uMitZiel(ist, ziel) {
    var u = { wand: ist.wand, fenster: ist.fenster, tuer: ist.tuer, dach: ist.dach, boden: ist.boden };
    if (ziel) {
      if (ziel.wand) u.wand = Math.min(ist.wand, ziel.wand.wert);
      if (ziel.glas) u.fenster = Math.min(ist.fenster, ziel.glas.wert);
      if (ziel.dach) u.dach = Math.min(ist.dach, ziel.dach.wert);
      if (ziel.boden) u.boden = Math.min(ist.boden, ziel.boden.wert);
    }
    return u;
  }

  /* Netto-Luftvolumen: Grundfläche der Wohnräume mal Raumhöhe, ohne Keller (Annahme; nicht das Außenvolumen der Kompaktheit) */
  function luftVolumen(mg) {
    var v = 0, fl = 0;
    (mg.etagen || []).forEach(function (E) {
      if (E.keller) return;
      E.raeume.forEach(function (r) { v += r.grund * E.hoehe; fl += r.grund; });
    });
    return { m3: v, grundflaeche: fl };
  }
  /* Lüftungsverlust: H_V = 0,34 Wh/(m³·K) × n × V; Q_V = H_V × Gradtagzahl × 24 / 1000; mit Wärmerückgewinnung × (1 − Wärmebereitstellungsgrad) */
  function lueftungsverlust(volumen_m3, luftwechsel, wrg, gradtagzahl) {
    var n = zahlOk(luftwechsel) ? luftwechsel : ANNAHMEN.luftwechsel, hv = ANNAHMEN.luftwaerme * n * volumen_m3;
    var eta = zahlOk(wrg) ? wrg : 0;
    return { HV: hv * (1 - eta), HVohne: hv, kwh: hv * (1 - eta) * gradtagzahl * 24 / 1000, kwhOhne: hv * gradtagzahl * 24 / 1000, eta: eta, n: n };
  }
  function wrgGrad(art) {
    if (art !== 'dez_wrg' && art !== 'zentral') return null;
    var e = dl('lueftung', 'lu_wrg_praxis');
    return { mitte: ANNAHMEN.wrgMitte, von: e ? e.von / 100 : 0.8, bis: e ? e.bis / 100 : 0.9, beleg: beleg(e) };
  }

  /* Heizwärme des gezeichneten Hauses mit Standard und Lüftung: Transmission (ausbau_kern, mit Zielwerten des Standards) plus Lüftung. */
  function heizwaermeMitStandard(plan, optionen) {
    var opt = optionen || {}, std = opt.standard || planStandard(plan).id, art = opt.lueftungsart != null ? opt.lueftungsart : planLueftung(plan).art;
    var b = opt.bilanz || AK.hausBilanz(plan);
    if (!b.ok) return { ok: false, grund: b.fehler || 'keinPlan', standard: std };
    var sd = daemmstandards()[std] || daemmstandards().bestand, res = { ok: true, standard: std, art: art, gradtage: b.gradtage, bilanz: b };
    var mg = b.mengen, wfl = mg.summe.wohnflaeche, vol = luftVolumen(mg), g = b.gradtage.wert;
    res.wohnflaeche = wfl;
    /* Lüftung: unabhängig von der Transmission rechenbar */
    var wrg = wrgGrad(art);
    var vMitte = lueftungsverlust(vol.m3, ANNAHMEN.luftwechsel, wrg ? wrg.mitte : 0, g);
    var vLo = lueftungsverlust(vol.m3, ANNAHMEN.luftwechsel, wrg ? wrg.bis : 0, g), vHi = lueftungsverlust(vol.m3, ANNAHMEN.luftwechsel, wrg ? wrg.von : 0, g);
    var vOhne = lueftungsverlust(vol.m3, ANNAHMEN.luftwechsel, 0, g);
    res.lueftung = { volumen: vol.m3, n: vMitte.n, wrg: wrg, kwh: vMitte.kwh, kwhLo: vLo.kwh, kwhHi: vHi.kwh, kwhOhneWrg: vOhne.kwh, kwhM2: wfl > 0 ? vMitte.kwh / wfl : null,
      kwhM2Lo: wfl > 0 ? vLo.kwh / wfl : null, kwhM2Hi: wfl > 0 ? vHi.kwh / wfl : null, kwhM2Ohne: wfl > 0 ? vOhne.kwh / wfl : null, HV: vMitte.HV };
    if (!b.heizung || !b.heizung.ok) { res.transmission = null; res.gesamt = null; res.grund = b.heizung ? b.heizung.grund : 'keineHuelle'; res.ok = true; res.ohneTransmission = true; return res; }
    var h = b.heizung, fl = h.flaechen;
    function lauf(v, ziel) { return AK.heizwaermeBedarf(fl, uMitZiel(uVariante(b, v), ziel), g); }
    var zl = sd.u, mitte = lauf('mitte', zl), lo = lauf('lo', zl), hi = lauf('hi', zl);
    var istM = lauf('mitte', null), istLo = lauf('lo', null), istHi = lauf('hi', null);
    function m2(x) { return wfl > 0 ? x / wfl : null; }
    res.transmission = { kwh: mitte.kwh, kwhLo: lo.kwh, kwhHi: hi.kwh, kwhM2: m2(mitte.kwh), kwhM2Lo: m2(lo.kwh), kwhM2Hi: m2(hi.kwh), HT: mitte.HT,
      istKwh: istM.kwh, istKwhLo: istLo.kwh, istKwhHi: istHi.kwh, istKwhM2: m2(istM.kwh) };
    res.gesamt = { kwh: mitte.kwh + vMitte.kwh, kwhLo: lo.kwh + vLo.kwh, kwhHi: hi.kwh + vHi.kwh, kwhM2: m2(mitte.kwh + vMitte.kwh), kwhM2Lo: m2(lo.kwh + vLo.kwh), kwhM2Hi: m2(hi.kwh + vHi.kwh) };
    /* Bauteile über dem Ziel (Materialwahl gegen Zielwert); Dach und Boden sind Annahmen der Rechnung (Anlage 7), nicht gewählt */
    var ist = uVariante(b, 'mitte'), ueber = [];
    if (zl) {
      [['wand', 'wand', ist.wand, false], ['fenster', 'glas', ist.fenster, false], ['dach', 'dach', ist.dach, true], ['boden', 'boden', ist.boden, true]].forEach(function (x) {
        var z = zl[x[1]];
        if (z && x[2] > z.wert + 1e-9) ueber.push({ bauteil: x[0], ist: x[2], ziel: z.wert, annahmeIst: x[3], zielAnnahme: !!z.annahme });
      });
    }
    res.ueberZiel = ueber; res.ziel = zl; res.uIst = ist; res.uWirk = uMitZiel(ist, zl);
    return res;
  }

  /* ---------- Förderung nach BEG Einzelmaßnahmen (Hülle und Lüftung: 15 %, iSFP +5 Prozentpunkte nur auf den Teil über 30.000 €) ---------- */
  function begFoerderung(kosten, mitIsfp, satzId) {
    var sz = dl('beg_einzelmassnahmen', satzId || 'beg_huelle'), hoe = dl('beg_einzelmassnahmen', 'beg_hoechst');
    if (!sz || !hoe || !zahlOk(kosten) || kosten <= 0) return 0;
    var satz = sz.von / 100, bonus = (sz.isfp_bonus || 0) / 100, h1 = hoe.we1, h2 = hoe.isfp_we1;
    if (!mitIsfp) return satz * Math.min(kosten, h1);
    var k = Math.min(kosten, h2), f = satz * k;
    if (kosten >= h1) f += bonus * Math.max(0, k - h1);
    return f;
  }
  function begSpanne(kVon, kBis, satzId) { return { von: begFoerderung(kVon, false, satzId), bis: begFoerderung(kBis, true, satzId) }; }

  /* Mehrkosten bis zum Ziel: Fassade und Fenster mit den Preisen aus daten/sanierung.js (Ratgeber, prüfen vor Nutzung); Dach und Boden haben keinen Preis (Lücke). */
  function sanZeile(id) { var s = SA(); if (!s) return null; for (var i = 0; i < s.bauteile.length; i++) if (s.bauteile[i].id === id) return s.bauteile[i]; return null; }
  function sanBeleg(z) { return z ? { id: z.id, name: z.name, quelle: z.quelle, abruf: (SA() && SA().abruf) || '', status: 'prüfen vor Nutzung', einheit: z.einheit, von: z.von, bis: z.bis, url: '' } : null; }
  function mehrkostenUndFoerderung(plan, standardId, optionen) {
    var opt = optionen || {}, ps = planStandard(plan), id = standardId || ps.id, pl = planLueftung(plan), neubau = opt.neubau != null ? opt.neubau : pl.neubau;
    var stufe = opt.kfwStufe || ps.kfwStufe, eigen = opt.mehrkostenEigen !== undefined ? opt.mehrkostenEigen : ps.mehrkostenEigen;
    var sds = daemmstandards(), hw = opt.heizwaerme || heizwaermeMitStandard(plan, { standard: id });
    var res = { standard: id, neubau: neubau, mehrkosten: { von: 0, bis: 0, art: 'keine', teile: [], luecken: [] }, foerderung: { von: 0, bis: 0, art: 'keine', hinweise: [], belege: [] }, ok: true };
    var mk = res.mehrkosten;
    if (id === 'bestand') { mk.art = 'keine'; return res; }
    if (eigen != null && eigen > 0) { mk.von = eigen; mk.bis = eigen; mk.art = 'eigen'; }
    else if (id === 'kfw') { mk.art = 'luecke'; mk.luecken.push('kfw_mehrkosten'); mk.beleg = sds.kfw.mehrkosten; }
    else if (hw && hw.ok && hw.ueberZiel && hw.bilanz.heizung && hw.bilanz.heizung.ok) {
      var h = hw.bilanz.mengen.huelle, von = 0, bis = 0;
      hw.ueberZiel.forEach(function (u) {
        if (u.bauteil === 'wand') {
          var z = sanZeile('fassade');
          if (z && h) { var t = { bauteil: 'wand', menge: h.wandNetto, einheit: 'm²', von: h.wandNetto * z.von, bis: h.wandNetto * z.bis, preis: z, beleg: sanBeleg(z) }; mk.teile.push(t); von += t.von; bis += t.bis; }
        } else if (u.bauteil === 'fenster') {
          var zf = sanZeile('fenster');
          if (zf && h) { var tf = { bauteil: 'fenster', menge: h.fensterStueck, einheit: 'Stück', von: h.fensterStueck * zf.von, bis: h.fensterStueck * zf.bis, preis: zf, beleg: sanBeleg(zf) }; mk.teile.push(tf); von += tf.von; bis += tf.bis; }
        } else mk.luecken.push(u.bauteil);
      });
      mk.von = von; mk.bis = bis; mk.art = mk.teile.length || mk.luecken.length ? 'schaetzung' : 'erreicht';
      if (mk.art === 'schaetzung' && !mk.teile.length) mk.art = 'luecke';
    }
    /* Förderung */
    var fo = res.foerderung;
    if (!neubau) {
      if (id === 'gmodg' || id === 'passivhaus') {
        var s = begSpanne(mk.von, mk.bis, 'beg_huelle');
        if (mk.art === 'schaetzung' || mk.art === 'eigen') { fo.von = s.von; fo.bis = s.bis; fo.art = 'beg'; fo.belege.push(beleg(dl('beg_einzelmassnahmen', 'beg_huelle')), beleg(dl('beg_einzelmassnahmen', 'beg_hoechst'))); }
        else { fo.art = 'beg_offen'; fo.belege.push(beleg(dl('beg_einzelmassnahmen', 'beg_huelle'))); }
      } else if (id === 'kfw') {
        var st = sds.kfw.stufen[stufe];
        if (st) { fo.von = st.eeEur; fo.bis = st.nhEur; fo.art = 'kfw261'; fo.stufe = stufe; fo.belege.push(st.beleg, sds.kfw.boni, sds.kfw.stand); }
      }
    } else {
      if (id === 'kfw') { fo.art = 'kfw297'; fo.belege.push(sds.kfw.kredit297); }
      else fo.art = 'neubauKeine';
    }
    return res;
  }

  /* ---------- Amortisation ---------- */
  /* Jahre = (Mehrkosten − Förderung) / (Ersparnis kWh × Preis ct / 100 / Wirkungsgrad − Zusatzkosten €/a). Keine Zinsen, Preis konstant (Annahmen, in der Seite genannt).
     Nie Unendlich oder NaN: bei fehlenden Angaben, Ersparnis ≤ 0 oder ungültigen Zahlen { ok: false, grund }. */
  function amortisation(mehrkostenNetto, ersparnisKwhProJahr, preisCtProKwh, wirkungsgrad, zusatzEurProJahr) {
    if (!zahlOk(mehrkostenNetto) || !zahlOk(ersparnisKwhProJahr) || !zahlOk(preisCtProKwh) || !zahlOk(wirkungsgrad) || wirkungsgrad <= 0) return { ok: false, grund: 'eingabe' };
    if (preisCtProKwh <= 0) return { ok: false, grund: 'keinPreis' };
    var jahrEur = ersparnisKwhProJahr * preisCtProKwh / 100 / wirkungsgrad - (zahlOk(zusatzEurProJahr) ? zusatzEurProJahr : 0);
    if (!(jahrEur > 1e-9)) return { ok: false, grund: 'keineErsparnis', ersparnisEur: jahrEur };
    if (mehrkostenNetto <= 0) return { ok: true, jahre: 0, ersparnisEur: jahrEur, gedeckt: true };
    return { ok: true, jahre: mehrkostenNetto / jahrEur, ersparnisEur: jahrEur };
  }
  /* Spanne: günstigster Fall (niedrige Kosten, hohe Förderung, hohe Ersparnis) bis ungünstigster Fall (hohe Kosten, niedrige Förderung, niedrige Ersparnis) */
  function amortisationSpanne(p) {
    var best = amortisation(p.kostenVon - p.foerderBis, p.kwhHi, p.ct, p.eta, p.zusatzLo);
    var schlecht = amortisation(p.kostenBis - p.foerderVon, p.kwhLo, p.ct, p.eta, p.zusatzHi);
    if (!best.ok) return { ok: false, grund: best.grund };
    if (!schlecht.ok) return { ok: false, grund: schlecht.grund === 'keineErsparnis' ? 'ersparnisUnsicher' : schlecht.grund, von: best.jahre };
    return { ok: true, von: best.jahre, bis: schlecht.jahre, ersparnisEurVon: schlecht.ersparnisEur, ersparnisEurBis: best.ersparnisEur };
  }
  /* Dämmstandard: Ersparnis aus dem Unterschied der Transmission (Ist gegen Standard), Preis aus den Energiepreisen */
  function daemmAmortisation(plan, standardId, optionen) {
    var opt = optionen || {}, ep = opt.energiepreise || energiepreise(plan);
    var hw = opt.heizwaerme || heizwaermeMitStandard(plan, { standard: standardId, lueftungsart: 'keine' });
    var mf = opt.mehrkosten || mehrkostenUndFoerderung(plan, standardId, { heizwaerme: hw });
    var res = { ok: false, grund: 'keineAngabe', hw: hw, mf: mf, ep: ep };
    if (!hw.ok || !hw.transmission) { res.grund = 'keineHeizwaerme'; return res; }
    if (standardId === 'bestand') { res.grund = 'keinStandard'; return res; }
    if (standardId === 'kfw') { res.grund = 'kfwOhneHeizwaerme'; return res; }   /* KfW legt keine U-Werte fest: die Daten geben keine Heizwärme für die Stufe her */
    if (mf.mehrkosten.art === 'luecke' || mf.mehrkosten.art === 'keine') { res.grund = 'keineMehrkosten'; return res; }
    var t = hw.transmission, ersMitte = t.istKwh - t.kwh, ersLo = Math.max(0, t.istKwhLo - t.kwhLo), ersHi = Math.max(0, t.istKwhHi - t.kwhHi);
    var lo = Math.min(ersLo, ersHi), hi = Math.max(ersLo, ersHi);
    res.ersparnisKwh = { mitte: ersMitte, von: lo, bis: hi };
    if (mf.mehrkosten.art === 'erreicht') { res.grund = 'schonErreicht'; return res; }
    var a = amortisationSpanne({ kostenVon: mf.mehrkosten.von, kostenBis: mf.mehrkosten.bis, foerderVon: mf.foerderung.von, foerderBis: mf.foerderung.bis, kwhLo: lo, kwhHi: hi, ct: ep.ct, eta: ep.wirkungsgrad });
    res.amort = a; res.ok = a.ok; res.grund = a.ok ? null : a.grund;
    return res;
  }

  /* ====================================================================== B: Lüftung */
  function raeumeFuerLueftung(mg) {
    var c = { aufenthalt: 0, kueche: 0, nass: 0 };
    var zuluft = { wohnen: 1, schlafen: 1, kind: 1, arbeiten: 1, essen: 1, kueche: 1, '': 1 };
    (mg.raeume || []).forEach(function (r) {
      if (r.nutzung === 'bad' || r.nutzung === 'wc') { c.nass += 1; return; }
      if (r.kueche || r.nutzung === 'kueche') c.kueche += 1;
      if (zuluft[r.nutzung] || r.kueche) c.aufenthalt += 1;
    });
    return c;
  }
  function strompreisCt() {
    var e = EK && EK.eint ? EK.eint('strompreis', 'strompreis_haushalt') : null;
    return { ct: e ? e.von : 37, beleg: e && EK.beleg ? EK.beleg(e) : null };
  }
  function lueftungKosten(plan, art, optionen) {
    var opt = optionen || {}, pl = planLueftung(plan), neubau = opt.neubau != null ? opt.neubau : pl.neubau, mg = opt.mengen || AK.mengenAusPlan(plan);
    if (!mg.ok) return { ok: false, grund: mg.fehler || 'keinPlan' };
    var wfl = mg.summe.wohnflaeche, r = raeumeFuerLueftung(mg), preisKey = neubau ? 'neubau' : 'altbau';
    var res = { ok: true, art: art, neubau: neubau, raeume: r, wohnflaeche: wfl, einmalig: { von: 0, bis: 0 }, stueck: [], strom: null, luecken: [], hinweise: [], belege: [], foerderung: { von: 0, bis: 0, art: 'keine', belege: [] } };
    var ab = dl('lueftung', 'lu_dez_abluft'), wrg = dl('lueftung', 'lu_dez_wrg'), z1 = dl('lueftung', 'lu_zentral'), z2 = dl('lueftung', 'lu_zentral2');
    var sp = opt.strompreis || strompreisCt();
    res.strompreis = sp;
    if (art === 'keine') { res.filter = null; return res; }
    if (art === 'dez_abluft') {
      var n1 = r.nass + r.kueche, p1 = ab[preisKey];
      res.stueck.push({ art: 'abluft', anzahl: n1, preis: p1, summe: n1 * p1, beleg: beleg(ab) });
      res.einmalig.von = res.einmalig.bis = n1 * p1; res.belege.push(beleg(ab));
    } else if (art === 'dez_wrg') {
      var nz = r.aufenthalt, nn = r.nass, pz = wrg[preisKey], pn = ab[preisKey];
      res.stueck.push({ art: 'wrg', anzahl: nz, preis: pz, summe: nz * pz, beleg: beleg(wrg) });
      res.stueck.push({ art: 'abluft', anzahl: nn, preis: pn, summe: nn * pn, beleg: beleg(ab) });
      res.einmalig.von = res.einmalig.bis = nz * pz + nn * pn; res.belege.push(beleg(wrg), beleg(ab));
    } else if (art === 'zentral') {
      var f = wfl / ANNAHMEN.bezugFlaecheZentral;
      res.einmalig.von = z2.von * f; res.einmalig.bis = z2.bis * f; res.belege.push(beleg(z1), beleg(z2));
      res.zentralFaktor = f; res.stueck.push({ art: 'zentral', anzahl: 1, von: z2.von * f, bis: z2.bis * f, beleg: beleg(z2) });
      if (!neubau) res.hinweise.push('zentralAltbau');
    }
    /* Strom: bezogen auf die Wohnfläche. lu_strom nennt „hochwertige Anlage“, nicht die Bauart: nur Anlagen mit Wärmerückgewinnung bekommen eine Zahl. */
    if (art === 'dez_wrg' || art === 'zentral') {
      var s1 = dl('lueftung', 'lu_strom'), s2 = dl('lueftung', 'lu_strom2');
      var jeM2Von = s1.von / 100, jeM2Bis = s2.von / 120, kwhVon = jeM2Von * wfl, kwhBis = jeM2Bis * wfl;
      res.strom = { kwhVon: kwhVon, kwhBis: kwhBis, eurVon: kwhVon * sp.ct / 100, eurBis: kwhBis * sp.ct / 100, ct: sp.ct, belege: [beleg(s1), beleg(s2)], strompreisBeleg: sp.beleg };
    } else res.luecken.push('strom');
    res.filter = { monate: { von: dl('lueftung', 'lu_filter_wechsel').von, bis: dl('lueftung', 'lu_filter_wechsel').bis }, beleg: beleg(dl('lueftung', 'lu_filter_wechsel')), beispiel: beleg(dl('lueftung', 'lu_filter_preis')), luecke: beleg(dl('lueftung', 'lu_luecke')) };
    /* Förderung: BEG Einzelmaßnahmen gelten für bestehende Gebäude; Neubau keine */
    var fo = res.foerderung, satz = dl('beg_einzelmassnahmen', 'beg_lueftung_satz');
    if (!neubau) {
      var sps = begSpanne(res.einmalig.von, res.einmalig.bis, 'beg_lueftung_satz');
      fo.von = sps.von; fo.bis = sps.bis; fo.art = 'beg';
      fo.belege.push(beleg(satz), beleg(dl('beg_einzelmassnahmen', 'beg_lueftung_wbg')), beleg(dl('beg_einzelmassnahmen', 'beg_lueftung_nachweis')));
    } else { fo.art = 'neubauKeine'; fo.belege.push(beleg(dl('beg_einzelmassnahmen', 'beg_alter'))); }
    return res;
  }
  /* Lüftung gegen „keine“: Heizwärme-Ersparnis durch Wärmerückgewinnung, Strom dagegen, Amortisation (Spanne) */
  function lueftungAmortisation(plan, art, optionen) {
    var opt = optionen || {}, ep = opt.energiepreise || energiepreise(plan);
    var hw = opt.heizwaerme || heizwaermeMitStandard(plan, { lueftungsart: art });
    var k = opt.kosten || lueftungKosten(plan, art, opt);
    var res = { ok: false, grund: 'keineAngabe', hw: hw, k: k, ep: ep };
    if (!k.ok || !hw.ok) { res.grund = 'keinPlan'; return res; }
    if (art === 'keine') { res.grund = 'keineLueftung'; return res; }
    if (art === 'dez_abluft') { res.grund = 'keineErsparnis'; res.ersparnisKwh = { von: 0, bis: 0 }; return res; }
    var L = hw.lueftung, lo = L.kwhOhneWrg - L.kwhHi, hi = L.kwhOhneWrg - L.kwhLo;
    res.ersparnisKwh = { mitte: L.kwhOhneWrg - L.kwh, von: lo, bis: hi };
    var s = k.strom;
    var a = amortisationSpanne({ kostenVon: k.einmalig.von, kostenBis: k.einmalig.bis, foerderVon: k.foerderung.von, foerderBis: k.foerderung.bis, kwhLo: lo, kwhHi: hi, ct: ep.ct, eta: ep.wirkungsgrad,
      zusatzLo: s ? s.eurVon : 0, zusatzHi: s ? s.eurBis : 0 });
    res.amort = a; res.ok = a.ok; res.grund = a.ok ? null : a.grund;
    return res;
  }

  /* ====================================================================== C: Wasser */
  function shoelace(pts) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
    return Math.abs(s) / 2;
  }
  /* Dachfläche für Regen: Regen fällt senkrecht, darum zählt die waagerechte Projektion (Grundfläche des Daches mit Überstand), nicht die geneigte Fläche */
  function dachflaecheRegen(plan) {
    if (!plan || !plan.dach || !DACH) return { ok: false, grund: 'keinDach' };
    var ei = DACH.dachEtage(plan);
    if (ei < 0) return { ok: false, grund: 'keineRaeume' };
    var eb = DACH.ebenen(plan), rect = DACH.huellRechteck(plan.etagen[ei]);
    if (!rect) return { ok: false, grund: 'keineRaeume' };
    var df = DACH.dachFlaechen(plan.dach, rect, eb[ei].oben + eb[ei].decke), proj = 0;
    df.faces.forEach(function (f) { proj += shoelace(f.pts.map(function (p) { return [p[0], p[1]]; })); });
    var geneigt = null;
    if (EK) { var d = EK.dachflaechen(plan, 'Bremen'); if (!d.fehler) { geneigt = 0; d.flaechen.forEach(function (f) { geneigt += f.flaeche; }); } }
    return { ok: true, projektion: proj, geneigt: geneigt, form: df.form };
  }
  function niederschlag(land) {
    var d = WA(); if (!d) return null;
    var e = wa('niederschlag', 'nd_' + land) || null, fallback = false;
    if (!e) { e = wa('niederschlag', 'nd_DE'); fallback = true; }
    if (!e) return null;
    return { mm: e.von, land: e.land, kuerzel: e.kuerzel, naeherung: !!e.naeherung, region: e.region_dwd || '', fallback: fallback, beleg: beleg(e), attribution: d.meta ? d.meta.dwd_attribution : '', lizenz: d.meta ? d.meta.dwd_lizenz : '',
      j2024: e.j2024, j2025: e.j2025 };
  }
  function wasserpreis(land) {
    var e = wa('wasserpreise', 'wp_tw_' + land);
    if (!e) return null;
    return { trinkwasser: e.von, abwasser: e.abwasser, land: e.land, beleg: beleg(e) };
  }
  function regenwasser(dachflaecheM2, land, personen, optionen) {
    var opt = optionen || {}, nd = niederschlag(land), res = { ok: false };
    if (!nd || !(dachflaecheM2 > 0)) return { ok: false, grund: !nd ? 'keinNiederschlag' : 'keineDachflaeche' };
    var pers = personen > 0 ? personen : ANNAHMEN.personen;
    res.niederschlag = nd; res.dachflaeche = dachflaecheM2; res.personen = pers;
    if (opt.gruendach) { res.ok = true; res.gruendach = true; res.ertragNichtBerechenbar = true; res.belegGruen = beleg(wa('regenwasser', 'rw_ertragsbeiwert_gruen')); return res; }
    var sat = wa('regenwasser', 'rw_satzung'), A = ANNAHMEN;
    var bei = { von: A.beiwertVon, bis: A.beiwertBis }, f = A.filter;
    res.formel = beleg(wa('regenwasser', 'rw_formel')); res.beiwert = { von: bei.von, bis: bei.bis, beleg: beleg(wa('regenwasser', 'rw_ertragsbeiwert')), satzung: beleg(sat) };
    res.filter = { wert: f, beleg: beleg(sat), luecke: beleg(wa('regenwasser', 'rw_filter')) };
    var basis = nd.mm * dachflaecheM2 * f;
    res.ertrag = { von: basis * bei.von, bis: basis * bei.bis, mitte: basis * (bei.von + bei.bis) / 2 };   /* l/a */
    var ntwTag = A.ntwProPersonTag.wc + A.ntwProPersonTag.waschmaschine, bedarfNtw = ntwTag * pers * 365;
    res.bedarfNtw = bedarfNtw; res.bedarfWc = A.ntwProPersonTag.wc * pers * 365; res.bedarfWaesche = A.ntwProPersonTag.waschmaschine * pers * 365;
    res.satzung = beleg(sat);
    var vb = wa('wasserpreise', 'wp_verbrauch'), gesamt = (vb ? vb.von : 122) * pers * 365;
    res.gesamtbedarf = gesamt; res.belegVerbrauch = beleg(vb);
    function deck(e) { return Math.min(1, e / bedarfNtw); }
    res.deckung = { von: deck(res.ertrag.von), bis: deck(res.ertrag.bis), mitte: deck(res.ertrag.mitte) };       /* Anteil von WC und Waschmaschine, bei 100 % gedeckelt */
    res.gedeckt = { von: Math.min(res.ertrag.von, bedarfNtw), bis: Math.min(res.ertrag.bis, bedarfNtw), mitte: Math.min(res.ertrag.mitte, bedarfNtw) };   /* l/a */
    res.autarkie = { von: res.gedeckt.von / gesamt, bis: res.gedeckt.bis / gesamt, mitte: res.gedeckt.mitte / gesamt };   /* Anteil des gesamten Wasserbedarfs */
    res.ueberschuss = res.ertrag.mitte > bedarfNtw;
    /* Speicher */
    var sp = wa('regenwasser', 'rw_speicher');
    res.speicher = { jeNutzer: { von: sp.l_je_nutzer_von * pers, bis: sp.l_je_nutzer_bis * pers }, jeM2: { von: sp.l_je_m2_von * dachflaecheM2, bis: sp.l_je_m2_bis * dachflaecheM2 }, beleg: beleg(sp) };
    /* Kosten, Ersparnis */
    var kosten = wa('regenwasser', 'rw_kosten');
    res.kosten = { von: kosten.von, bis: kosten.bis, beleg: beleg(kosten), pumpe: beleg(wa('regenwasser', 'rw_pumpe')) };
    var wp = wasserpreis(land), preis = null;
    if (wp) preis = { von: wp.trinkwasser, bis: wp.trinkwasser + wp.abwasser, quelle: 'daten', beleg: wp.beleg };
    else if (opt.preisEurM3 > 0) preis = { von: opt.preisEurM3, bis: opt.preisEurM3, quelle: 'eingabe' };
    res.preis = preis; res.preisLuecke = !wp ? beleg(wa('wasserpreise', 'wp_luecke')) : null;
    if (preis) {
      /* Das Regenwasser im WC spart den Trinkwasserpreis; die Abwassergebühr fällt für das WC-Wasser meist trotzdem an (Bremen: Hausverbrauch über eigenen Zähler mit Abwassergebühr belegt). Darum Spanne: nur Trinkwasser bis Trinkwasser plus Abwasser. */
      var m3Lo = res.gedeckt.von / 1000, m3Hi = res.gedeckt.bis / 1000;
      res.ersparnis = { von: m3Lo * preis.von, bis: m3Hi * preis.bis, m3Von: m3Lo, m3Bis: m3Hi };
    } else res.ersparnis = null;
    /* Niederschlagswassergebühr nur wo die Daten eine Regel für das Land haben */
    var geb = { art: 'satzung', beleg: beleg(wa('gebuehren', 'gb_zisterne')) };
    if (land === 'HB') {
      var gb = wa('gebuehren', 'gb_bremen'), gz = wa('gebuehren', 'gb_bremen_zisterne'), m3v = res.speicher.jeNutzer.von / 1000, m3b = res.speicher.jeNutzer.bis / 1000;
      var abzugVon = Math.min(dachflaecheM2, gz.von * m3v), abzugBis = Math.min(dachflaecheM2, gz.von * m3b);
      geb = { art: 'bremen', von: abzugVon * gb.von, bis: abzugBis * gb.von, abzugVon: abzugVon, abzugBis: abzugBis, satz: gb.von, beleg: beleg(gb), belegZisterne: beleg(gz) };
    } else if (land === 'BE') {
      var gbs = wa('gebuehren', 'gb_spanne'), gbe = wa('gebuehren', 'gb_berlin'), satzBe = gbs.staedte && gbs.staedte.Berlin, speicherOk = res.speicher.jeNutzer.von >= 20 * dachflaecheM2;
      geb = { art: 'berlin', von: speicherOk ? dachflaecheM2 * satzBe * gbe.von / 100 : 0, bis: speicherOk ? dachflaecheM2 * satzBe * gbe.von / 100 : 0, satz: satzBe, prozent: gbe.von, speicherOk: speicherOk, beleg: beleg(gbe), belegSatz: beleg(gbs) };
    }
    res.gebuehr = geb;
    var ersV = (res.ersparnis ? res.ersparnis.von : 0) + (geb.von || 0), ersB = (res.ersparnis ? res.ersparnis.bis : 0) + (geb.bis || 0);
    res.ersparnisGesamt = res.ersparnis ? { von: ersV, bis: ersB } : null;
    if (res.ersparnisGesamt) res.amort = amortisationEuro(kosten.von, kosten.bis, 0, 0, ersV, ersB);
    else res.amort = { ok: false, grund: 'keinPreis' };
    res.ok = true;
    return res;
  }
  /* Amortisation in Euro: Jahre = Kosten / Ersparnis je Jahr (Spanne wie bei der Heizung) */
  function amortisationEuro(kVon, kBis, fVon, fBis, eLo, eHi) {
    function einzel(k, e) {
      if (!zahlOk(k) || !zahlOk(e)) return { ok: false, grund: 'eingabe' };
      if (!(e > 1e-9)) return { ok: false, grund: 'keineErsparnis' };
      return { ok: true, jahre: Math.max(0, k) / e };
    }
    var best = einzel(kVon - fBis, eHi), schlecht = einzel(kBis - fVon, eLo);
    if (!best.ok) return { ok: false, grund: best.grund };
    if (!schlecht.ok) return { ok: false, grund: 'ersparnisUnsicher', von: best.jahre };
    return { ok: true, von: best.jahre, bis: schlecht.jahre };
  }
  function enthaertung(haertebereich) {
    var id = HAERTEN.indexOf(haertebereich) >= 0 ? haertebereich : 'mittel', h = wa('haerte', 'hr_' + id);
    if (!h) return { ok: false };
    var res = { ok: true, bereich: id, mmol: { von: h.von, bis: h.bis == null ? null : h.bis }, dh: { von: h.dh_von == null ? 0 : h.dh_von, bis: h.dh_bis == null ? null : h.dh_bis }, beleg: beleg(h) };
    res.sinnvoll = id === 'hart';
    res.warentest = beleg(wa('enthaertung', 'en_warentest')); res.verbraucherzentrale = beleg(wa('enthaertung', 'en_vz_nrw'));
    res.kosten = { anschaffung: beleg(wa('enthaertung', 'en_anschaffung')), einbau: beleg(wa('enthaertung', 'en_einbau')), betrieb: beleg(wa('enthaertung', 'en_betrieb')), wartung: beleg(wa('enthaertung', 'en_wartung')), salz: beleg(wa('enthaertung', 'en_salz_vz')) };
    res.kalkwandler = beleg(wa('enthaertung', 'en_kalkwandler')); res.natrium = beleg(wa('trinkwasserrecht', 'tw_natrium'));
    var an = wa('enthaertung', 'en_anschaffung'), ei = wa('enthaertung', 'en_einbau');
    res.einmalig = { von: an.von + ei.von, bis: an.bis + ei.bis };
    res.anzeige = beleg(wa('trinkwasserrecht', 'tw_anzeige'));
    return res;
  }

  var api = {
    ANNAHMEN: ANNAHMEN, STANDARDS: STANDARDS, KFW_STUFEN: KFW_STUFEN, LUEFTUNG_ARTEN: LUEFTUNG_ARTEN, HAERTEN: HAERTEN, TRAEGER: TRAEGER,
    planStandard: planStandard, planLueftung: planLueftung, planWasser: planWasser, energiepreise: energiepreise, oelCtProKwh: oelCtProKwh, heizkosten: heizkosten,
    daemmstandards: daemmstandards, luftVolumen: luftVolumen, lueftungsverlust: lueftungsverlust, wrgGrad: wrgGrad, heizwaermeMitStandard: heizwaermeMitStandard,
    begFoerderung: begFoerderung, begSpanne: begSpanne, mehrkostenUndFoerderung: mehrkostenUndFoerderung, amortisation: amortisation, amortisationSpanne: amortisationSpanne,
    amortisationEuro: amortisationEuro, daemmAmortisation: daemmAmortisation, raeumeFuerLueftung: raeumeFuerLueftung, lueftungKosten: lueftungKosten, lueftungAmortisation: lueftungAmortisation,
    dachflaecheRegen: dachflaecheRegen, niederschlag: niederschlag, wasserpreis: wasserpreis, regenwasser: regenwasser, enthaertung: enthaertung, strompreisCt: strompreisCt, beleg: beleg
  };
  root.HUELLE_KERN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
