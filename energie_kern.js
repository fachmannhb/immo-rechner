/* Rechenkern für „Strom vom eigenen Dach“ und die Kompaktheit des Hauses (Welle D, Teil 1): reine Rechnung ohne Oberfläche, läuft auch in Node
   (tmp/energie_test.js lädt die Daten wie der Browser). Liest daten/energie.js, daten/pvgis.js, daten/formen.js, den Plan (grundriss_dach.js,
   grundriss_geo.js) und die Landesregeln (regeln_kern.js). Die Oberfläche steht in grundriss_energie.js; die Planungskarte im Grundriss und der
   eigene Rechner im Menü rufen dieselbe Funktion rechne(), darum stimmen die Zahlen überein.
   Alle Näherungen sind unten als ANNAHMEN benannt und werden in der Seite als Annahme gezeigt. Keine Anlage-, Steuer- oder Rechtsberatung (R078, R079). */
(function (root) {
  'use strict';
  var DACH = root.GRUNDRISS_DACH || (typeof require === 'function' ? require('./grundriss_dach.js') : null);
  var GEO = root.GRUNDRISS_GEO || (typeof require === 'function' ? require('./grundriss_geo.js') : null);
  var RK = root.REGELN || (typeof require === 'function' ? require('./regeln_kern.js') : null);

  /* ---------- Annahmen (eigene Näherungen, in der Seite als Annahme gekennzeichnet) ---------- */
  var ANNAHMEN = {
    nutzanteil: 0.70,        /* Anteil der Dachfläche, den Module belegen können (Rand, Kamin, Fenster, Abstände); eigene Schätzung, keine Quelle */
    evMaxErzeugung: 0.90,    /* höchstens so viel der Erzeugung kann im Haus verbraucht werden */
    speicherKlein: 5,        /* kWh, Auswahl für „kleiner Speicher“ */
    speicherGross: 10,       /* kWh, Auswahl für „großer Speicher“ */
    horizont: 25,            /* Jahre der Rechnung (Herstellergarantie 25 bis 30 Jahre, ISE) */
    eegJahre: 20,            /* feste Vergütung 20 Jahre; danach wird nichts mehr angesetzt */
    wrJahr: 13,              /* Wechselrichter-Ersatz nach 10 bis 15 Jahren: Mitte */
    spJahr: 15,              /* Speicher-Ersatz nach 12 bis 20 Jahren: vorsichtig im Jahr 15 */
    strompreisSteigerung: 0  /* % je Jahr, Standard: keine Steigerung (vorsichtig) */
  };
  var STANDARD = {
    land: 'HB', personen: 3, verbrauchEigen: null, einspeisung: 'teil', varianteWahl: 'keiner', steigerung: 0,
    strompreisCt: null, datum: null,
    auto: { an: false, km: null, kwh100: null, wallbox: true, geraet: 'mittel', install: 'mittel', kraftstoff: 'benzin', preisBasis: '2025' }
  };

  function E() { return root.DATEN && root.DATEN.energie; }
  function eint(liste, id) {
    var d = E(); if (!d || !d[liste]) return null;
    for (var i = 0; i < d[liste].length; i++) if (d[liste][i].id === id) return d[liste][i];
    return null;
  }
  function mitte(e) { return e && e.von != null && e.bis != null ? (e.von + e.bis) / 2 : (e && e.von != null ? e.von : null); }
  function runde(x, n) { var f = Math.pow(10, n || 0); return Math.round(x * f) / f; }

  /* Beleg einer Zahl: Quelle, Abruf, Status stehen an jedem Wert (R073) */
  function beleg(e) {
    if (!e) return null;
    var d = E(), q = d && d.quellen && d.quellen[e.quelle];
    return { id: e.id, name: e.name, status: e.status, abruf: e.abruf, quelle: q ? q.titel : (e.quelle || ''), url: q ? q.url : '', hinweis: e.hinweis || '', paragraf: e.paragraf || '',
      von: e.von, bis: e.bis, einheit: e.einheit || '', gilt_ab: e.gilt_ab || '', gilt_bis: e.gilt_bis || '' };
  }

  /* ---------- Dachflächen aus dem Plan (dieselbe Geometrie wie die 3D-Ansicht) ---------- */
  function flaeche3d(pts) {
    var sx = 0, sy = 0, sz = 0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i], q = pts[(i + 1) % pts.length];
      sx += p[1] * q[2] - p[2] * q[1]; sy += p[2] * q[0] - p[0] * q[2]; sz += p[0] * q[1] - p[1] * q[0];
    }
    return Math.sqrt(sx * sx + sy * sy + sz * sz) / 2;
  }
  var HIMMEL = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  function himmelIndex(grad) { return Math.round((((grad % 360) + 360) % 360) / 45) % 8; }

  /* Fläche aus Richtung (Kompass, 0 = Nord, 180 = Süd) und Neigung: Ertrag je kWp aus daten/pvgis.js; flach (Neigung 0) hat keine Richtung */
  function flacheMitErtrag(f, stadt) {
    var daten = root.DATEN && root.DATEN.pvgis;
    var asp = f.richtung == null ? 0 : (function (r) { var a = r - 180; return a <= -180 ? a + 360 : (a > 180 ? a - 360 : a); })(f.richtung);
    var er = daten ? DACH.ertrag(daten, stadt, asp, f.neigung) : null;
    var best = daten ? DACH.bestwert(daten, stadt) : null;
    f.aspekt = asp;
    f.ey = er ? runde(er.ey, 1) : null; f.gekappt = er ? er.gekappt : false;
    f.klasse = er && best ? DACH.klasse(er.ey, best) : null;
    f.anteilBest = er && best ? er.ey / best : null;
    return f;
  }
  /* Dachflächen des Plans: [{n, flaeche (m², geneigte Fläche mit Überstand), neigung, richtung, ey, klasse, ...}] oder {fehler} */
  function dachflaechen(plan, stadt) {
    if (!plan || !plan.dach) return { fehler: 'keinDach', flaechen: [] };
    var ei = DACH.dachEtage(plan);
    if (ei < 0) return { fehler: 'keineRaeume', flaechen: [] };
    var eb = DACH.ebenen(plan), rect = DACH.huellRechteck(plan.etagen[ei]);
    if (!rect) return { fehler: 'keineRaeume', flaechen: [] };
    var df = DACH.dachFlaechen(plan.dach, rect, eb[ei].oben + eb[ei].decke);
    var nord = plan.nord || 0, out = [];
    df.faces.forEach(function (f, i) {
      var rich = f.bergab ? DACH.himmelsrichtung(f.bergab, nord) : null;
      var fl = { n: i + 1, flaeche: flaeche3d(f.pts), neigung: Math.round(f.neigung), richtung: rich == null ? null : Math.round(rich) };
      out.push(flacheMitErtrag(fl, stadt));
    });
    return { fehler: null, flaechen: out, form: df.form };
  }
  /* „Beste Flächen“: alle Flächen mit mindestens 80 % des besten Tabellenwerts der Stadt (Klasse „gut“ oder besser); sonst die beste einzelne */
  function besteFlaechen(flaechen) {
    var gut = flaechen.filter(function (f) { return f.anteilBest != null && f.anteilBest >= 0.80; }).map(function (f) { return f.n; });
    if (gut.length || !flaechen.length) return gut;
    var b = flaechen.slice().sort(function (p, q) { return (q.ey || 0) - (p.ey || 0); })[0];
    return b && b.ey != null ? [b.n] : [];
  }

  /* ---------- Preise, Vergütung ---------- */
  function pvPreis(kwp) {
    var d = E(), l = (d && d.pv_preise) || [], treffer = null, unter = false;
    var kl = l.filter(function (x) { return x.kwp_von != null; }).sort(function (a, b) { return a.kwp_von - b.kwp_von; });
    kl.forEach(function (x) { if (!treffer && kwp > x.kwp_von && (x.kwp_bis == null || kwp <= x.kwp_bis)) treffer = x; });
    if (!treffer && kl.length) { treffer = kl[0]; unter = kwp <= kl[0].kwp_von; }
    return treffer ? { eurKwp: treffer.von, klasse: treffer.id, eintrag: treffer, unterStaffel: unter, ueberStaffel: false } : null;
  }
  function speicherPreis(kwh) {
    var d = E(), l = (d && d.speicher) || [], t = null;
    l.forEach(function (x) {
      var m = /^sp_preis_(\d+)_(\d+)$/.exec(x.id); if (!m || t) return;
      if (kwh >= +m[1] && kwh <= +m[2]) t = x;
    });
    return t ? { eurKwh: t.von, eintrag: t } : null;
  }
  /* EEG: anteilig je Leistungsstufe (§ 23c EEG): 12 kWp = 10/12 × Satz bis 10 kW + 2/12 × Satz bis 40 kW. art: 'teil' oder 'voll'. */
  function eegSatz(kwp, art, datum) {
    var d = E(), ids = ['eeg_bis10', 'eeg_bis40', 'eeg_bis100'], grenzen = [0, 10, 40, 100], stufen = [], summe = 0, rest = 0;
    var eintraege = ids.map(function (id) { return eint('eeg', id); });
    if (!d || eintraege.some(function (x) { return !x; }) || !(kwp > 0)) return null;
    for (var i = 0; i < 3; i++) {
      var teil = Math.max(0, Math.min(kwp, grenzen[i + 1]) - grenzen[i]);
      var ct = art === 'voll' ? eintraege[i].voll : eintraege[i].teil;
      stufen.push({ von: grenzen[i], bis: grenzen[i + 1], kw: teil, ct: ct });
      summe += teil * ct;
    }
    rest = Math.max(0, kwp - 100);
    var ga = eintraege[0].gilt_ab, gb = eintraege[0].gilt_bis, heute = datum || (RK ? RK.heute() : '');
    return {
      ct: summe / kwp, stufen: stufen, kwOhneVerguetung: rest, gilt_ab: ga, gilt_bis: gb, datum: heute,
      ausserhalb: !!(heute && ((ga && heute < ga) || (gb && heute > gb))), art: art, eintraege: eintraege.map(beleg)
    };
  }

  /* ---------- Verbrauch und Eigenverbrauch ---------- */
  function autarkieAnteil(speicherKwh, verbrauch) {
    /* Näherung (eigene Rechnung aus den Spannen der Verbraucherzentrale/ISE): ohne Speicher Autarkiegrad A0 (Mitte 25 bis 30 %);
       der Speicher hebt ihn linear bis A1 (70 %, „mit Speicher bis 70“) bei der doppelten Faustregelgröße (1,5 kWh je 1.000 kWh Verbrauch). */
    var a = eint('eigenverbrauch', 'ev_autarkie'), g = eint('speicher', 'sp_groesse');
    var a0 = a ? (a.ohne_von + a.ohne_bis) / 200 : 0.275, a1 = a ? a.mit_bis / 100 : 0.70, je = g ? g.von : 1.5;
    var sRec = je * verbrauch / 1000;
    if (speicherKwh <= 0 || sRec <= 0) return a0;
    return a0 + (a1 - a0) * Math.min(1, speicherKwh / (2 * sRec));
  }
  function eigenverbrauch(erzeugung, verbrauch, speicherKwh, art) {
    if (art === 'voll') return 0;
    return Math.max(0, Math.min(autarkieAnteil(speicherKwh, verbrauch) * verbrauch, ANNAHMEN.evMaxErzeugung * erzeugung));
  }

  /* ---------- Hauptrechnung ---------- */
  function mischen(a, b) { var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; }); Object.keys(b || {}).forEach(function (k) { o[k] = b[k]; }); return o; }
  function rechne(eing) {
    var e = mischen(STANDARD, eing); e.auto = mischen(STANDARD.auto, eing && eing.auto);
    var res = { ok: false, fehler: null, annahmen: ANNAHMEN };
    var d = E();
    if (!d) { res.fehler = { code: 'keineDaten' }; return res; }
    var stadt = RK ? RK.landInfo(e.land).stadt : 'Bremen';
    res.land = e.land; res.stadt = stadt;
    var gewaehlt = (e.flaechen || []).filter(function (f) { return f.gewaehlt !== false && f.flaeche > 0; }).map(function (f) { return mischen(f, {}); });
    if (!gewaehlt.length) { res.fehler = { code: 'keineFlaeche' }; return res; }
    if (gewaehlt.some(function (f) { return f.ey == null; })) { res.fehler = { code: 'keinErtrag', stadt: stadt }; return res; }

    /* Fläche → Leistung → Erzeugung */
    var mq = eint('pv_technik', 'pv_flaeche_vz'), m2kwp = mitte(mq) || 6;
    var flGes = 0, kwp = 0, erz = 0;
    gewaehlt.forEach(function (f) { var nutz = f.flaeche * ANNAHMEN.nutzanteil; f.nutzflaeche = nutz; f.kwp = nutz / m2kwp; flGes += f.flaeche; kwp += f.kwp; erz += f.kwp * f.ey; });
    res.flaecheGesamt = flGes; res.flaecheNutz = flGes * ANNAHMEN.nutzanteil; res.m2JeKwp = m2kwp; res.kwp = kwp;
    res.eyMittel = erz / kwp; res.erzeugung = erz; res.gewaehlt = gewaehlt;
    res.belegFlaeche = beleg(mq);

    /* Preis der Anlage */
    var pp = pvPreis(kwp);
    res.preis = pp; res.investPv = pp ? pp.eurKwp * kwp : null;
    res.ueberStaffel = kwp > 100;

    /* Verbrauch */
    var jeP = eint('strompreis', 'strom_je_person'), perP = jeP ? jeP.von : 1240;
    var pers = Math.max(1, Math.round(e.personen || 1));
    var vh = e.verbrauchEigen > 0 ? e.verbrauchEigen : pers * perP;
    res.verbrauch = { haushalt: vh, jeP: perP, personen: pers, eigeneEingabe: e.verbrauchEigen > 0, beleg: beleg(jeP) };
    var au = e.auto, vcar = 0;
    res.auto = { an: !!au.an };
    if (au.an) {
      var kmE = eint('auto', 'km_bev'), kwhE = eint('auto', 'ecar_klasse_kompakt');
      var km = au.km > 0 ? au.km : (kmE ? kmE.von : 11312), k100 = au.kwh100 > 0 ? au.kwh100 : (kwhE ? kwhE.von : 18.1);
      vcar = km / 100 * k100;
      var gE = eint('auto', 'wallbox_geraet'), iE = eint('auto', 'wallbox_install');
      var wb = { an: !!au.wallbox, geraet: gE ? mitte({ von: gE[au.geraet][0], bis: gE[au.geraet][1] }) : 0, install: iE ? mitte({ von: iE[au.install][0], bis: iE[au.install][1] }) : 0 };
      wb.summe = wb.an ? wb.geraet + wb.install : 0;
      var pE = eint('auto', au.kraftstoff === 'diesel' ? (au.preisBasis === 'sep2026' ? 'preis_diesel_sep2026' : 'preis_diesel_2025') : (au.preisBasis === 'sep2026' ? 'preis_e10_sep2026' : 'preis_e10_2025'));
      var vE = eint('auto', au.kraftstoff === 'diesel' ? 'verbrauch_diesel' : 'verbrauch_benzin');
      var liter = km / 100 * (vE ? vE.von : 7.8), preisL = pE ? pE.von : 1.688;
      res.auto = { an: true, km: km, kwh100: k100, kwh: vcar, wallbox: wb, kraftstoff: au.kraftstoff, preisBasis: au.preisBasis, liter: liter, preisL: preisL, spritKosten: liter * preisL,
        belege: { km: beleg(kmE), kwh100: beleg(kwhE), wallbox: [beleg(gE), beleg(iE)], preis: beleg(pE), verbrauch: beleg(vE), verlust: beleg(eint('auto', 'ladeverlust_wallbox')), anmeldung: beleg(eint('auto', 'wallbox_anmeldung')) } };
    }
    var V = vh + vcar;
    res.verbrauch.auto = vcar; res.verbrauch.gesamt = V;

    /* Preise */
    var sp = eint('strompreis', 'strompreis_haushalt'), ct = e.strompreisCt > 0 ? e.strompreisCt : (sp ? sp.von : 37);
    res.strompreis = { ct: ct, beleg: beleg(sp), eigeneEingabe: e.strompreisCt > 0 };
    var eeg = eegSatz(kwp, e.einspeisung === 'voll' ? 'voll' : 'teil', e.datum);
    var eegTeil = eegSatz(kwp, 'teil', e.datum);
    res.eeg = eeg; res.eegTeilCt = eegTeil ? eegTeil.ct : null;

    /* Steuern (Hinweise, keine Berechnung): 0 % USt und Einkommensteuerfreiheit bis 30 kWp */
    var ust = eint('bundesregeln', 'r_ust_0'), est = eint('bundesregeln', 'r_est_72');
    res.steuer = { ust0: kwp <= (ust ? ust.schwelle_kw : 30), estFrei: kwp <= (est ? est.schwelle_kw : 30), schwelleKwp: ust ? ust.schwelle_kw : 30, beleg: [beleg(ust), beleg(est)] };

    /* Varianten: kein, kleiner, großer Speicher */
    var pe = eint('pv_technik', 'pv_degr_plan'), deg = (pe ? pe.von : 0.5) / 100;
    var bt = eint('pv_technik', 'pv_betrieb_proz'), betrieb = (bt ? bt.typisch : 1) / 100;
    var wrE = eint('pv_technik', 'pv_wr_ersatz'), wrKosten = wrE ? mitte(wrE) : 1500;
    var spE = eint('speicher', 'sp_ersatz'), spErsatzGross = spE ? mitte(spE) : 5500;
    var st = (e.steigerung || 0) / 100, N = ANNAHMEN.horizont, art = e.einspeisung === 'voll' ? 'voll' : 'teil';
    res.degradation = { prozent: deg * 100, beleg: beleg(pe) }; res.betrieb = { prozent: betrieb * 100, beleg: beleg(bt) };
    res.einspeisung = art;
    function variante(name, sKwh) {
      var sp2 = sKwh > 0 ? speicherPreis(sKwh) : null;
      var investSp = sKwh > 0 && sp2 ? sp2.eurKwh * sKwh : 0;
      var invest = (res.investPv || 0) + investSp;
      var ersatz = sKwh > 0 ? spErsatzGross * sKwh / ANNAHMEN.speicherGross : 0;
      var v = { name: name, speicherKwh: sKwh, speicherPreis: sp2, investSpeicher: investSp, invest: invest, ersatzSpeicher: ersatz, jahre: [], kum: [-invest], kumAuto: null };
      var kum = -invest, kumA = null, fuelSave = null;
      if (res.auto.an) { kumA = -(invest + res.auto.wallbox.summe); }
      var amort = null, amortAuto = null, amortGenau = null;
      for (var y = 1; y <= N; y++) {
        var gen = erz * Math.pow(1 - deg, y - 1), ev = eigenverbrauch(gen, V, sKwh, art), fe = gen - ev;
        var preis = ct / 100 * Math.pow(1 + st, y - 1);
        var einn = ev * preis + (y <= ANNAHMEN.eegJahre && eeg ? fe * eeg.ct / 100 : 0);
        var kost = betrieb * invest, ereig = (y === ANNAHMEN.wrJahr ? wrKosten : 0) + (y === ANNAHMEN.spJahr ? ersatz : 0);
        var netto = einn - kost - ereig, vor = kum;
        kum += netto;
        if (y === 1) { v.ev = ev; v.einsp = fe; v.einnahmen1 = einn; v.einnahmenEv1 = ev * preis; v.einnahmenEinsp1 = einn - ev * preis; v.kosten1 = kost; v.netto1 = netto; }
        if (amort == null && kum >= 0) { amort = y; amortGenau = y - 1 + (netto > 0 ? -vor / netto : 0); }
        v.jahre.push({ jahr: y, erzeugung: gen, ev: ev, einsp: fe, einnahmen: einn, kosten: kost, ereignis: ereig, netto: netto, kum: kum });
        v.kum.push(kum);
        if (kumA != null) {
          var autoNetto = netto + (res.auto.spritKosten - vcar * preis);
          var vorA = kumA; kumA += autoNetto;
          if (amortAuto == null && kumA >= 0) amortAuto = y - 1 + (autoNetto > 0 ? -vorA / autoNetto : 0);
          if (y === 1) fuelSave = res.auto.spritKosten - vcar * preis;
        }
      }
      v.amortJahr = amort; v.amortGenau = amortGenau; v.endsumme = kum;
      v.autarkie = V > 0 ? v.ev / V : 0; v.eigenQuote = erz > 0 ? v.ev / erz : 0;
      if (res.auto.an) { v.mitAuto = { invest: invest + res.auto.wallbox.summe, amortGenau: amortAuto, amortJahr: amortAuto == null ? null : Math.ceil(amortAuto), endsumme: kumA, spritErsparnis1: fuelSave }; }
      v.nutzenGegenNetz1 = v.ev * ct / 100;
      return v;
    }
    res.varianten = {
      keiner: variante('keiner', 0),
      klein: variante('klein', ANNAHMEN.speicherKlein),
      gross: variante('gross', ANNAHMEN.speicherGross)
    };
    res.gewaehlteVariante = res.varianten[e.varianteWahl] ? e.varianteWahl : 'keiner';

    /* Auto: Kosten je Jahr im Vergleich (Tanken, nur Netzstrom, mit Ihrer Anlage) */
    if (res.auto.an) {
      var vv = res.varianten[res.gewaehlteVariante], anteilDach = V > 0 ? vv.ev / V : 0;
      var ctDach = res.eegTeilCt != null ? res.eegTeilCt : 0;
      res.auto.vergleich = {
        tanken: res.auto.spritKosten,
        netz: vcar * ct / 100,
        mitAnlage: vcar * (1 - anteilDach) * ct / 100 + vcar * anteilDach * ctDach / 100,
        anteilDach: anteilDach, ctDach: ctDach
      };
    }
    res.ok = true;
    return res;
  }

  /* ---------- Schwellen (Bundesregeln) für den Balken und die Karten Privat / Vermieter ---------- */
  var SCHWELLEN = [
    { id: 'st_2000_800', key: 'schwSteckersolar', kw: 2 },
    { id: 'r_msbg_7kw', key: 'schwSmartMeter', kw: 7 },
    { id: 'r_eeg9_unter25', key: 'schwEinspeise25', kw: 25 },
    { id: 'r_ust_0', key: 'schwSteuer30', kw: 30 },
    { id: 'r_eeg21_100', key: 'schwDirekt100', kw: 100 }
  ];
  function regelnKarten(land, kwp, datum) {
    var d = E(); if (!d) return null;
    var alle = (d.bundesregeln || []).concat(d.steckersolar || []);
    var sw = SCHWELLEN.map(function (s) {
      var e = eint('bundesregeln', s.id) || eint('steckersolar', s.id);
      return { id: s.id, key: s.key, kw: s.kw, beleg: beleg(e), erreicht: kwp != null && kwp >= s.kw };
    });
    function fuer(f) { return alle.filter(function (x) { return String(x.fall || 'A,B').split(',').indexOf(f) >= 0; }).map(beleg); }
    var pf = RK ? RK.regel(land, 'solarpflicht', datum) : null;
    return {
      schwellen: sw, privat: fuer('A'), vermieter: fuer('B'),
      solarpflicht: pf ? (RK.beleg(land, 'solarpflicht', pf)) : null, solarpflichtWert: pf && pf.wert ? pf.wert : null,
      solarpflichtLuecke: !pf || pf.status === 'Lücke', land: land
    };
  }

  /* ---------- Solarthermie gegen PV auf derselben Dachfläche ---------- */
  function vergleichThermie(nutzflaecheM2, kwp, erzeugungPv, personen, modus, investPv) {
    var d = E(); if (!d) return null;
    var ww = eint('solarthermie', 'st_flaeche_ww'), wwH = eint('solarthermie', 'st_flaeche_ww_heiz'), ertrag = eint('solarthermie', 'st_ertrag');
    var preis = eint('solarthermie', 'st_preis_anlage'), amort = eint('solarthermie', 'st_amortisation'), beg = eint('solarthermie', 'st_beg_grund');
    var wert = eint('solarthermie', 'st_ww_pv_kosten'), isfp = eint('beg', 'beg_isfp'), begDatum = eint('beg', 'beg_em_datum');
    var jeP = modus === 'heizung' ? wwH.flach : ww.flach;
    var bedarf = jeP * Math.max(1, personen);              /* m² Kollektor, die der Haushalt sinnvoll nutzt */
    var fl = Math.min(nutzflaecheM2, bedarf);
    var typ = 400 / 1;                                     /* Mitte der Spanne 300 bis 600 gibt 450; „gut ausgelegter Flachkollektor 350 bis 500“ → 425 */
    typ = (ertrag.von + ertrag.bis) / 2;
    var preisM2 = 4780 / 6;                                 /* Beispiel 6 m² Flachkollektor installiert 4.780 € (co2online) */
    return {
      flaeche: fl, bedarf: bedarf, begrenzt: nutzflaecheM2 > bedarf, energieSt: fl * typ, ertragM2: typ, ertragVon: ertrag.von, ertragBis: ertrag.bis,
      investSt: fl * preisM2, preisM2: preisM2, foerderProzent: beg ? beg.von : 30, amortVon: amort.von, amortBis: amort.bis,
      energiePv: erzeugungPv, kwp: kwp, investPv: investPv, pvJeM2: nutzflaecheM2 > 0 ? erzeugungPv / nutzflaecheM2 : 0,
      belege: { ertrag: beleg(ertrag), preis: beleg(preis), amort: beleg(amort), beg: beleg(beg), wert: beleg(wert), flaeche: beleg(modus === 'heizung' ? wwH : ww), isfp: beleg(isfp), begDatum: beleg(begDatum) }
    };
  }

  /* ---------- Kompaktheit A/V aus der Zeichnung ---------- */
  /* Umriss des Hauses je Etage (nur rechtwinklige Räume): Das Netz aus allen Raumkoordinaten teilt die Fläche in Zellen; eine Zelle ist „innen“, wenn ihre
     Mitte in einem Raum (ohne Balkon) liegt. Schmale Zellen (höchstens Innenwanddicke + 2 cm) mit innen liegenden Nachbarn auf beiden Seiten gehören zu den
     Innenwänden zwischen den Räumen und werden mitgezählt. Fläche A und Umfang U des Umrisses sind dann exakt; die Außenwand wird um ihre Dicke d nach
     außen angesetzt (Gehrung): Fläche = A + U·d + d²·T, Umfang = U + 2d·T, mit T = gewölbte Ecken − einspringende Ecken (4 bei einem Rechteck, 4 bei einer
     L-Form 5 − 1). Schräge Wände: kein exakter Umriss, die Seite nimmt dann das umschließende Rechteck (Näherung, wird angezeigt). */
  function umriss(etage) {
    var rs = (etage.raeume || []).filter(function (r) { return r.art !== 'balkon' && r.punkte && r.punkte.length >= 3; });
    if (!rs.length) return null;
    var EPS = 1e-6, xs = [], ys = [];
    for (var a = 0; a < rs.length; a++) {
      var p = rs[a].punkte;
      for (var b = 0; b < p.length; b++) {
        var q = p[(b + 1) % p.length];
        if (Math.abs(p[b][0] - q[0]) > EPS && Math.abs(p[b][1] - q[1]) > EPS) return null;   /* schräge Kante */
        xs.push(p[b][0]); ys.push(p[b][1]);
      }
    }
    function eindeutig(l) {
      l.sort(function (u, v) { return u - v; });
      var o = [];
      l.forEach(function (v) { if (!o.length || v - o[o.length - 1] > EPS) o.push(v); });
      return o;
    }
    xs = eindeutig(xs); ys = eindeutig(ys);
    var nx = xs.length - 1, ny = ys.length - 1;
    if (nx < 1 || ny < 1) return null;
    var dI = Number(etage.innenwand); dI = isFinite(dI) && dI > 0 ? dI : GEO.STD.innenwand;
    var dA = Number(etage.aussenwand); dA = isFinite(dA) && dA > 0 ? dA : GEO.STD.aussenwand;
    var schmal = dI + 0.02, i, j;
    var innen = [];
    for (i = 0; i < nx; i++) {
      innen.push([]);
      for (j = 0; j < ny; j++) {
        var c = [(xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2], drin = false;
        for (var r = 0; r < rs.length && !drin; r++) drin = GEO.punktImVieleck(c, rs[r].punkte);
        innen[i].push(drin);
      }
    }
    function ist(ii, jj) { return ii >= 0 && jj >= 0 && ii < nx && jj < ny && innen[ii][jj]; }
    for (var runde2 = 0; runde2 < 6; runde2++) {
      var geaendert = false;
      for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
        if (innen[i][j]) continue;
        var w = xs[i + 1] - xs[i], h = ys[j + 1] - ys[j];
        if ((w <= schmal && ist(i - 1, j) && ist(i + 1, j)) || (h <= schmal && ist(i, j - 1) && ist(i, j + 1))) { innen[i][j] = true; geaendert = true; }
      }
      if (!geaendert) break;
    }
    var A = 0, U = 0, T = 0;
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      if (!innen[i][j]) continue;
      var bw = xs[i + 1] - xs[i], bh = ys[j + 1] - ys[j];
      A += bw * bh;
      if (!ist(i - 1, j)) U += bh;
      if (!ist(i + 1, j)) U += bh;
      if (!ist(i, j - 1)) U += bw;
      if (!ist(i, j + 1)) U += bw;
    }
    for (i = 0; i <= nx; i++) for (j = 0; j <= ny; j++) {
      var s = (ist(i - 1, j - 1) ? 1 : 0) + (ist(i, j - 1) ? 1 : 0) + (ist(i - 1, j) ? 1 : 0) + (ist(i, j) ? 1 : 0);
      if (s === 1) T += 1; else if (s === 3) T -= 1;
    }
    if (A <= 0) return null;
    return { innenFlaeche: A, innenUmfang: U, aussenFlaeche: A + U * dA + dA * dA * T, aussenUmfang: U + 2 * dA * T, dicke: dA, tanSumme: T };
  }
  function boundingNaeherung(etage) {
    var r = DACH.huellRechteck(etage); if (!r) return null;
    var b = r.x1 - r.x0, t = r.y1 - r.y0;
    return { aussenFlaeche: b * t, aussenUmfang: 2 * (b + t), naeherung: true };
  }
  /* Kompaktheit des Hauses: Hüllfläche ÷ beheiztes Bruttovolumen (Außenmaße). Annahmen: nur Etagen über der Erde sind beheizt (Keller nicht), das Dach
     über der obersten Etage ist unbeheizt (die Decke ist die Hülle), Höhe je Etage = lichte Höhe + Deckenstärke. */
  function kompaktheit(plan) {
    if (!plan || !plan.etagen) return { fehler: 'keinPlan' };
    var eb = DACH.ebenen(plan), liste = [];
    plan.etagen.forEach(function (et, i) {
      if (!eb[i] || eb[i].keller) return;
      if (!(et.raeume || []).some(function (r) { return r.art !== 'balkon'; })) return;
      liste.push({ i: i, rang: eb[i].rang, et: et, h: eb[i].hoehe + eb[i].decke });
    });
    if (!liste.length) return { fehler: 'keineRaeume' };
    liste.sort(function (a, b) { return a.rang - b.rang; });
    var naeh = false;
    liste.forEach(function (x) { x.u = umriss(x.et); if (!x.u) { x.u = boundingNaeherung(x.et); naeh = true; } });
    var wand = 0, vol = 0, i;
    liste.forEach(function (x) { wand += x.u.aussenUmfang * x.h; vol += x.u.aussenFlaeche * x.h; });
    var deckel = liste[0].u.aussenFlaeche;                        /* Boden der untersten Etage */
    for (i = 0; i < liste.length; i++) {
      var a = liste[i].u.aussenFlaeche, ob = i + 1 < liste.length ? liste[i + 1].u.aussenFlaeche : 0;
      deckel += Math.max(0, a - ob);                                /* Decke bzw. Dachterrasse, soweit nichts darüber steht */
      if (i + 1 < liste.length) deckel += Math.max(0, ob - a);      /* auskragende obere Etage: Unterseite */
    }
    var A = wand + deckel, av = A / vol;
    var wuerfel = 6 / Math.pow(vol, 1 / 3);
    return { fehler: null, huelle: A, wandFlaeche: wand, deckelFlaeche: deckel, volumen: vol, av: av, wuerfelAv: wuerfel, mehrAlsWuerfel: av / wuerfel - 1, etagen: liste.length, naeherung: naeh,
      aussenFlaeche0: liste[0].u.aussenFlaeche, aussenUmfang0: liste[0].u.aussenUmfang, schleifen: liste.map(function (x) { return x.u.schleifen || 1; }) };
  }
  /* Eigene Einordnung (R078), Schwellen in formen.js nicht vorhanden: offen genannt — Reihenhaus-Niveau bis 0,7, freistehend üblich bis 1,0 */
  function klasseAv(av) { return av <= 0.7 ? 'gruen' : (av <= 1.0 ? 'gelb' : 'rot'); }

  var api = {
    ANNAHMEN: ANNAHMEN, STANDARD: STANDARD, SCHWELLEN: SCHWELLEN, HIMMEL: HIMMEL, himmelIndex: himmelIndex,
    eint: eint, beleg: beleg, mitte: mitte, flacheMitErtrag: flacheMitErtrag, dachflaechen: dachflaechen, besteFlaechen: besteFlaechen,
    pvPreis: pvPreis, speicherPreis: speicherPreis, eegSatz: eegSatz, autarkieAnteil: autarkieAnteil, eigenverbrauch: eigenverbrauch,
    rechne: rechne, regelnKarten: regelnKarten, vergleichThermie: vergleichThermie, kompaktheit: kompaktheit, klasseAv: klasseAv, umriss: umriss
  };
  root.ENERGIE_KERN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
