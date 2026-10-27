/* Rechenkern für „Innenausbau aus dem Plan“ und „Materialwahl“ (Welle D, Teil 2a): reine Rechnung ohne Oberfläche, läuft auch in Node
   (tmp/ausbau_kern_test.js lädt die Daten wie der Browser). Die Oberfläche steht in grundriss_ausbau.js; die Karten im Grundriss, der Rechner
   im Bereich „Material vergleichen“ und der Hinweis im Umbau rufen dieselben Funktionen, darum stimmen die Zahlen überein.
   Daten: daten/innenausbau.js (Preise je Gewerk), daten/material_seite.js (Kennwerte je Material, aus daten/material.js erzeugt), daten/gradtage.js.
   Alle Näherungen stehen unten als ANNAHMEN und werden in der Seite als Annahme gezeigt. Keine Bau-, Kauf- oder Anlageberatung (R078). */
(function (root) {
  'use strict';
  var GEO = root.GRUNDRISS_GEO || (typeof require === 'function' ? require('./grundriss_geo.js') : null);
  var DACH = root.GRUNDRISS_DACH || (typeof require === 'function' ? require('./grundriss_dach.js') : null);
  var RK = root.REGELN || (typeof require === 'function' ? require('./regeln_kern.js') : null);
  var EK = root.ENERGIE_KERN || (typeof require === 'function' ? require('./energie_kern.js') : null);
  function RE() { return root.RECHNER || (typeof require === 'function' ? require('./rechner.js') : null); }   /* rechner.js wird in der Seite erst nach diesem Skript geladen */

  /* ---------- Annahmen (eigene Wahl, in der Seite als Annahme gekennzeichnet) ---------- */
  var ANNAHMEN = {
    raumhoehe: 2.5,         /* m, nur wenn im Plan keine gültige Höhe steht */
    deltaAussen: 0.25,      /* m: eine Öffnung gehört zum Raum, wenn ihr Mittelpunkt höchstens halbe Außenwand + 25 cm von dessen Kante liegt */
    uDach: 0.24,            /* W/(m²·K): Dach/oberste Decke wird mit dem Grenzwert der Anlage 7 (Nr. 5) angesetzt; die Eindeckung ändert den U-Wert nicht */
    uBoden: 0.50,           /* W/(m²·K): Boden zum Erdreich mit dem Wert aus Anlage 7 Nr. 6c, ohne Temperatur-Korrekturfaktor (Fx = 1) */
    uTuer: 1.8,             /* W/(m²·K): Außentür, Wert aus Anlage 7 Nr. 4 */
    rUebergang: 0.17,       /* m²K/W: Rsi + Rse, Abgleich mit ThEGA laut daten/material.js (meta.dicke_formel), keine Norm */
    daemmdickeCm: 16,       /* cm, Startwert der gewählten Dämmung (ThEGA-Tabelle: 10 bis 18 cm für U 0,24) */
    uGelbBis: 0.35,         /* W/(m²·K): obere Grenze von „gelb“ beim U-Wert der Wand; eigene Wahl, belegt ist nur 0,24 (Anlage 7) */
    gradtageStandard: 3462  /* Kd/a (Bremen), nur wenn das Land in daten/gradtage.js fehlt */
  };
  var STANDARD_MATERIAL = { aussenwand: 'ziegel', daemmung: '', daemmdicke_cm: ANNAHMEN.daemmdickeCm, dach: 'tonziegel', fenster: 'pvc', verglasung: 'v3_argon', boden: 'laminat' };
  var BAUTEILE_PLAN = ['aussenwand', 'daemmung', 'dach', 'fenster', 'verglasung', 'boden'];
  var STUFEN = ['einfach', 'mittel', 'gehoben'];

  function IB() { return root.DATEN && root.DATEN.innenausbau; }
  function MA() { return root.DATEN && root.DATEN.material; }
  function runde(x, n) { var f = Math.pow(10, n || 0); return Math.round(x * f) / f; }
  function zahlOk(x) { return typeof x === 'number' && isFinite(x); }
  function katalog() {
    var m = {};
    ((root.DATEN && root.DATEN.moebel && root.DATEN.moebel.artikel) || []).forEach(function (a) { m[a.id] = a; });
    return m;
  }
  function abstand(p, a, b) { return GEO.abstandPunktStrecke(p, a, b); }

  /* ====================================================================== Mengen aus dem Plan */
  function raumHoehe(plan, e) {
    var h = Number(e && e.hoehe);
    if (isFinite(h) && h > 0) return { h: h, annahme: false };
    var w = Number(plan && plan.wandhoehe);
    if (isFinite(w) && w > 0) return { h: w, annahme: false };
    return { h: ANNAHMEN.raumhoehe, annahme: true };
  }
  function umfang(p) {
    var s = 0;
    for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    return s;
  }
  /* Raum(e) einer Öffnung: der nächste Raum (höchstens halbe Außenwand + 25 cm) und ein zweiter, wenn die Öffnung in einer Innenwand sitzt */
  function raeumeDerOeffnung(e, vr, t) {
    var dA = Number(e.aussenwand) > 0 ? Number(e.aussenwand) : GEO.STD.aussenwand, dI = Number(e.innenwand) > 0 ? Number(e.innenwand) : GEO.STD.innenwand;
    var p = [t.x, t.y], ds = vr.map(function (r) {
      var m = Infinity;
      for (var i = 0; i < r.punkte.length; i++) m = Math.min(m, abstand(p, r.punkte[i], r.punkte[(i + 1) % r.punkte.length]));
      return { r: r, d: m };
    }).sort(function (a, b) { return a.d - b.d; });
    if (!ds.length || ds[0].d > dA / 2 + ANNAHMEN.deltaAussen) return [];
    var res = [ds[0].r];
    for (var k = 1; k < ds.length; k++) if (ds[k].d <= dI / 2 + 0.06 && ds[k].d - ds[0].d <= 0.1) res.push(ds[k].r);
    return res;
  }
  function istKueche(r, e, ART) {
    if (RK.nutzungVon(r) === 'kueche') return true;
    return (e.teile || []).some(function (t) { return t.art === 'kueche' && RK.imVieleck(t.x, t.y, r.punkte); });
  }

  /* Mengen je Etage und gesamt. Nur Räume der Art „voll“ (Wohnräume) zählen für den Innenausbau; Balkon, Wintergarten, Keller/Garage nicht. */
  function mengenAusPlan(plan) {
    if (!plan || !Array.isArray(plan.etagen)) return { ok: false, fehler: 'keinPlan' };
    var R = RE(), ART = katalog(), eb = DACH.ebenen(plan), annahmen = [], etagen = [];
    var S = { wohnflaeche: 0, boden: 0, bodenTrocken: 0, decke: 0, deckeTrocken: 0, wand: 0, wandTrocken: 0, raeume: 0, heizkoerper: 0, baeder: 0, wcs: 0, kuechen: 0,
      fenster: 0, fensterFlaeche: 0, tuerenInnen: 0, tuerenAussen: 0, tuerAussenFlaeche: 0, wandneuLaenge: 0, wandneuFlaeche: 0 };
    var raumListe = [], hoeheAnn = false;
    plan.etagen.forEach(function (e, ei) {
      var hh = raumHoehe(plan, e), vr = (e.raeume || []).filter(function (r) { return r.art === 'voll' && r.punkte && r.punkte.length >= 3; });
      if (hh.annahme) hoeheAnn = true;
      var E = { name: e.name, hoehe: hh.h, keller: !!(eb[ei] && eb[ei].keller), raeume: [] }, jeRaum = new Map();   /* Schlüssel = Raumobjekt (Ids können in rohen Daten fehlen) */
      (e.raeume || []).forEach(function (r) {   /* Wohnfläche: dieselbe Rechnung wie GRUNDRISS.summen() (alle Raumarten) */
        if (!r.punkte || r.punkte.length < 3) return;
        var fl = R.polygonFlaeche(r.punkte);
        var wf = Math.max(0, R.wohnflaecheRaum({ flaeche: fl, art: r.art, teil12: r.teil12, teil0: r.teil0, balkonProzent: r.balkon }) - (r.art === 'voll' ? RK.treppenAbzug(e, r, ART) : 0));
        S.wohnflaeche += wf;
      });
      vr.forEach(function (r) {
        var fl = R.polygonFlaeche(r.punkte), ab = RK.treppenAbzug(e, r, ART), nutz = RK.nutzungVon(r);
        var nass = nutz === 'bad' || nutz === 'wc', bo = Math.max(0, fl - ab), wb = umfang(r.punkte) * hh.h;
        jeRaum.set(r, { id: r.id, name: r.name, nutzung: nutz, grund: fl, boden: bo, umfang: umfang(r.punkte), wandBrutto: wb, oeffnungen: 0, nass: nass });
      });
      (e.teile || []).forEach(function (t) {
        var a = ART[t.art];
        if (!a) return;
        var tw = isFinite(Number(t.w)) && Number(t.w) > 0 ? Number(t.w) : a.breite / 100;   /* ältere Pläne ohne Breite: Katalogmaß */
        if (a.form === 'wand' && t.art === 'wandneu') { S.wandneuLaenge += tw; S.wandneuFlaeche += tw * hh.h; return; }
        if (a.form !== 'fenster' && a.form !== 'tuer') return;
        var hoeh = isFinite(Number(t.hoehe)) && Number(t.hoehe) > 0 ? Number(t.hoehe) : a.hoehe / 100, flaeche = tw * hoeh;
        var rs = raeumeDerOeffnung(e, vr, t);
        rs.forEach(function (r) { jeRaum.get(r).oeffnungen += flaeche; });
        if (a.form === 'fenster') {
          if (rs.length) { S.fenster += 1; S.fensterFlaeche += flaeche; if (!E.keller) { S.hFenster = (S.hFenster || 0) + 1; S.hFensterFlaeche = (S.hFensterFlaeche || 0) + flaeche; } }
        } else if (rs.length >= 2) S.tuerenInnen += 1;
        else if (rs.length === 1) { S.tuerenAussen += 1; S.tuerAussenFlaeche += flaeche; if (!E.keller) S.hTuerFlaeche = (S.hTuerFlaeche || 0) + flaeche; }
      });
      vr.forEach(function (r) {
        var m = jeRaum.get(r); m.wandNetto = Math.max(0, m.wandBrutto - m.oeffnungen);
        S.boden += m.boden; S.decke += m.boden; S.wand += m.wandNetto; S.raeume += 1;
        if (!m.nass) { S.bodenTrocken += m.boden; S.deckeTrocken += m.boden; S.wandTrocken += m.wandNetto; S.heizkoerper += 1; }
        if (m.nutzung === 'bad') S.baeder += 1;
        if (m.nutzung === 'wc') S.wcs += 1;
        if (istKueche(r, e, ART)) { S.kuechen += 1; m.kueche = true; }
        E.raeume.push(m); raumListe.push(m);
      });
      etagen.push(E);
    });
    if (hoeheAnn) annahmen.push('raumhoehe');
    S.hFenster = S.hFenster || 0; S.hFensterFlaeche = S.hFensterFlaeche || 0; S.hTuerFlaeche = S.hTuerFlaeche || 0;
    /* Hülle und Dach: Rechnung der Kompaktheit (energie_kern.js) und des 3D-Dachs (Neigung eingerechnet, mit Überstand) */
    var kom = EK ? EK.kompaktheit(plan) : { fehler: 'keinKern' }, dachFl = 0, dachFehler = null;
    if (EK) {
      var df = EK.dachflaechen(plan, 'Bremen');
      if (df.fehler) dachFehler = df.fehler; else df.flaechen.forEach(function (f) { dachFl += f.flaeche; });
    }
    var huelle = null;
    if (!kom.fehler) {
      var wandBrutto = kom.wandFlaeche, oeff = S.hFensterFlaeche + S.hTuerFlaeche;
      huelle = { wandBrutto: wandBrutto, fensterFlaeche: S.hFensterFlaeche, fensterStueck: S.hFenster, tuerFlaeche: S.hTuerFlaeche, wandNetto: Math.max(0, wandBrutto - oeff),
        bodenFlaeche: kom.aussenFlaeche0, deckeFlaeche: Math.max(0, kom.deckelFlaeche - kom.aussenFlaeche0), volumen: kom.volumen, aussenUmfang0: kom.aussenUmfang0, naeherung: kom.naeherung };
    }
    S.aussenwandBrutto = huelle ? huelle.wandBrutto : 0; S.aussenwandNetto = huelle ? huelle.wandNetto : 0; S.dachflaeche = dachFl;
    return { ok: S.raeume > 0, fehler: S.raeume > 0 ? null : 'keineRaeume', annahmen: annahmen, summe: S, etagen: etagen, raeume: raumListe, huelle: huelle, dachFehler: dachFehler,
      elektro: elektroSoll(raumListe) };
  }

  /* ====================================================================== Innenausbau-Kosten */
  function ibZeile(id) {
    var d = IB(); if (!d) return null;
    for (var i = 0; i < d.kosten.length; i++) if (d.kosten[i].id === id) return d.kosten[i];
    return null;
  }
  function ibQuelle(q) { var d = IB(); return d && d.quellen && d.quellen[q] ? d.quellen[q] : { titel: q || '', url: '' }; }
  function regelZeile(id) {
    var d = IB(), l = (d && d.ausstattung_regeln) || [];
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }
  /* Faktoren der Ausstattungsstufen für die Elektrik: Stufe 2 ≈ 125 %, Stufe 3 ≈ 150 % der Stufe 1 (baunetzwissen.de, undatiert). Der Preis „komplette Neuverkabelung“
     gilt als Stufe 2 (Annahme); daraus: einfach = 100/125, mittel = 1, gehoben = 150/125. */
  function elektroFaktoren() {
    var z = regelZeile('an_kostenrelation');
    if (!z || !z.von || !z.bis) return [1, 1, 1];
    return [100 / z.von, 1, z.bis / z.von];
  }
  /* Auswahl der Preiszeilen je Gewerk und Stufe. Eigene Wahl (Annahme, steht in der Seite): die Daten kennen keine allgemeinen Stufen. */
  var BODEN_ID = { laminat: 'ib_laminat', vinyl: 'ib_vinyl', parkett: 'ib_parkett', fliesen: 'ib_fliesen' };
  function auswahl(gewerk, stufe, opt) {
    var f = elektroFaktoren(), p = [];
    switch (gewerk) {
      case 'elektrik': p.push({ id: 'ib_elektro_komplett', menge: 'boden', faktor: f[stufe], faktorQuelle: 'an_kostenrelation' }); break;
      case 'sanitaer':
        p.push({ id: ['ib_bad_einfach', 'ib_bad_mittel', 'ib_bad_premium'][stufe], menge: 'baeder' });
        p.push({ id: 'ib_gaeste_wc', menge: 'wcs' });
        break;
      case 'heizung':
        if (stufe === 2) p.push({ id: 'ib_fbh_nass', menge: 'boden' });
        else { p.push({ id: stufe === 0 ? 'ib_hk_typ22' : 'ib_hk_design', menge: 'heizkoerper' }); p.push({ id: 'ib_hk_montage', menge: 'heizkoerper' }); }
        p.push({ id: 'ib_hk_bad', menge: 'baeder' });
        break;
      case 'trockenbau': p.push({ id: 'ib_trockenbauwand', menge: 'wandneuFlaeche' }); break;
      case 'boden':
        if (opt.bodenMaterial === 'linoleum') p.push({ luecke: true, name: 'Linoleum', einheit: '€/m² Boden', menge: 'bodenTrocken', quelle: 'luecke' });
        else p.push({ id: opt.bodenMaterial && BODEN_ID[opt.bodenMaterial] ? BODEN_ID[opt.bodenMaterial] : ['ib_laminat', 'ib_vinyl', 'ib_parkett'][stufe], menge: 'bodenTrocken' });
        if (opt.altbelag) p.push({ id: 'ib_altbelag_entfernen', menge: 'bodenTrocken' });
        break;
      case 'waende':
        if (stufe === 2) p.push({ id: 'ib_vlies', menge: 'wandTrocken' });
        if (stufe >= 1) p.push({ id: 'ib_spachteln_grundieren', menge: 'wandTrocken' });
        p.push({ id: 'ib_wand_streichen', menge: 'wandTrocken' });
        if (opt.putz) p.push({ id: 'ib_putz_gips_masch', menge: 'wandTrocken' });
        break;
      case 'decke': p.push({ id: 'ib_decke_streichen', menge: 'deckeTrocken' }); break;
      case 'tueren':
        p.push({ id: ['ib_tuer_cpl', 'ib_tuer_furniert', 'ib_tuer_vollholz'][stufe], menge: 'tuerenInnen' });
        p.push({ id: 'ib_tuer_montage', menge: 'tuerenInnen' });
        break;
      case 'kueche': p.push({ id: 'ib_kueche_anschluss', menge: 'kuechen' }); break;
    }
    return p;
  }
  var MENGE_EINHEIT = { boden: 'm²', bodenTrocken: 'm²', wand: 'm²', wandTrocken: 'm²', deckeTrocken: 'm²', decke: 'm²', wandneuFlaeche: 'm²', baeder: 'Bad', wcs: 'WC', heizkoerper: 'Stück', tuerenInnen: 'Stück', kuechen: 'Küche' };
  /* Welche Mengenart passt zu welchem „bezug“ der Preiszeile (Prüfung, damit nie ein Preis je Stück mit einer Fläche multipliziert wird) */
  var BEZUG_MENGE = { boden_m2: ['boden', 'bodenTrocken'], wand_m2: ['wand', 'wandTrocken', 'wandneuFlaeche'], decke_m2: ['decke', 'deckeTrocken'], bad: ['baeder'], tuer: ['tuerenInnen'], kueche: ['kuechen'], stueck: ['heizkoerper', 'wcs', 'baeder'] };

  function innenausbauKosten(mengen, daten, stufe, optionen) {
    var d = daten || IB(), opt = optionen || {}, st = Math.max(0, Math.min(2, stufe | 0));
    if (!d || !mengen || !mengen.summe) return { ok: false, fehler: 'keineDaten' };
    var S = mengen.summe, gewerke = [], sv = 0, sb = 0, luecken = 0;
    d.meta_gewerke.forEach(function (g) {
      var pos = [], av = 0, ab = 0, lk = 0;
      auswahl(g.id, st, opt).forEach(function (a) {
        var z = a.luecke ? { id: 'ib_linoleum', name: a.name, einheit: a.einheit, von: null, bis: null, quelle: a.quelle, abruf: d.meta.abruf, status: 'Lücke', nb: 'nicht angegeben' } : ibZeile(a.id);
        if (!z) return;
        var m = S[a.menge] || 0;
        if (!(m > 0)) return;
        var q = ibQuelle(z.quelle), lueck = z.von == null || z.bis == null, fak = a.faktor || 1;
        var p = { id: z.id, name: z.name, einheit: z.einheit, bezug: z.bezug, menge: m, mengeArt: a.menge, mengeEinheit: MENGE_EINHEIT[a.menge] || '', preisVon: z.von, preisBis: z.bis, faktor: fak,
          faktorQuelle: a.faktorQuelle ? ibQuelle(regelZeile(a.faktorQuelle).quelle).titel : '', quelle: z.quelle, quelleTitel: q.titel, url: q.url, abruf: z.abruf, status: z.status, nb: z.nb, hinweis: z.hinweis || '', luecke: lueck,
          summeVon: lueck ? null : m * z.von * fak, summeBis: lueck ? null : m * z.bis * fak };
        if (lueck) lk += 1; else { av += p.summeVon; ab += p.summeBis; }
        pos.push(p);
      });
      var benutzt = {};
      pos.forEach(function (p) { benutzt[p.id] = 1; });
      var alt = d.kosten.filter(function (k) { return k.gewerk === g.id && !benutzt[k.id]; }).map(function (k) {
        var q = ibQuelle(k.quelle);
        return { id: k.id, name: k.name, einheit: k.einheit, preisVon: k.von == null ? null : k.von, preisBis: k.bis == null ? null : k.bis, quelle: k.quelle, quelleTitel: q.titel, url: q.url, abruf: k.abruf, status: k.status, nb: k.nb, hinweis: k.hinweis || '', luecke: k.von == null || k.bis == null };
      });
      gewerke.push({ id: g.id, name: g.name, von: av, bis: ab, positionen: pos, alternativen: alt, luecken: lk });
      sv += av; sb += ab; luecken += lk;
    });
    return { ok: true, stufe: st, stufeName: STUFEN[st], gewerke: gewerke, von: sv, bis: sb, luecken: luecken, hinweisNb: 'Brutto/Netto: die Quellen nennen es meist nicht; wer Vorsteuer abziehen darf, rechnet netto.' };
  }

  /* Soll an Steckdosen und Lichtauslässen nach Merkblatt (Raumtyp → Zeile in daten/innenausbau.js, ausstattung). Zuordnung der Raumnutzung ist eigene Wahl. */
  var ELEKTRO_ZUORDNUNG = { wohnen: 'wz', schlafen: 'sz', kind: 'sz', arbeiten: 'sz', essen: 'an_essz', kueche: 'an_kueche', bad: 'an_bad', wc: 'an_wc', flur: 'an_flur_bis3', abstell: 'an_abstell', technik: 'an_hausarbeit' };
  function elektroSoll(raumListe) {
    var d = IB(), res = { steckdosen: [0, 0, 0], licht: [0, 0, 0], ohneZuordnung: 0, raeume: 0 };
    if (!d || !d.ausstattung) return res;
    var tab = {}; d.ausstattung.forEach(function (a) { tab[a.id] = a; });
    raumListe.forEach(function (r) {
      var z = ELEKTRO_ZUORDNUNG[r.nutzung];
      if (z === 'wz') z = r.grund <= 20 ? 'an_wz_bis20' : 'an_wz_ueber20';
      if (z === 'sz') z = r.grund <= 20 ? 'an_schlaf_bis20' : 'an_schlaf_ueber20';
      var a = z && tab[z];
      if (!a || !a.steckdosen || !a.lichtausl) { res.ohneZuordnung += 1; return; }
      res.raeume += 1;
      for (var i = 0; i < 3; i++) { res.steckdosen[i] += a.steckdosen[i]; res.licht[i] += a.lichtausl[i]; }
    });
    return res;
  }

  /* ====================================================================== Material: Kennwerte */
  function matListe(bauteil) {
    var m = MA(); if (!m) return [];
    return m.meta_materialien.filter(function (x) { return !bauteil || x.bauteil === bauteil; });
  }
  function matInfo(id) {
    var m = MA(); if (!m) return null;
    for (var i = 0; i < m.meta_materialien.length; i++) if (m.meta_materialien[i].id === id) return m.meta_materialien[i];
    return null;
  }
  function zeilen(id, krit) {
    var m = MA(), echt = [], luecken = [];
    if (!m) return { echt: echt, luecken: luecken };
    m.kennwerte.forEach(function (k) {
      if (k.kriterium !== krit) return;
      if (k.material !== id && !(k.materialien && k.materialien.indexOf(id) >= 0)) return;
      if (k.status === 'Lücke' || k.quelle === 'luecke') luecken.push(k); else echt.push(k);
    });
    return { echt: echt, luecken: luecken };
  }
  function quelleTitel(q) { var m = MA(); return m && m.quellen && m.quellen[q] ? m.quellen[q].titel : (q || ''); }
  function beleg(k) { return { id: k.id, quelle: k.quelle, quelleTitel: quelleTitel(k.quelle), abruf: k.abruf, status: k.status, hinweis: k.hinweis || '' }; }
  function zahlVonBis(k) { return zahlOk(k.von) && zahlOk(k.bis) ? { von: k.von, bis: k.bis } : (zahlOk(k.von) ? { von: k.von, bis: k.von } : null); }
  /* Rechenwert für λ: „typisch“ der Zeile; sonst „Repräsentativ a bis b“ aus dem Hinweis; sonst die Mitte der Spanne (Annahme, in der Seite gekennzeichnet) */
  function rechenwertLambda(k) {
    if (!k) return null;
    var vb = zahlVonBis(k); if (!vb) return null;
    var wert, art = 'mitte', lo = vb.von, hi = vb.bis, rep = false;
    if (zahlOk(k.typisch)) { wert = k.typisch; art = 'typisch'; }
    else {
      var m = /Repräsentativ ([\d,.]+) bis ([\d,.]+)/.exec(k.hinweis || '');
      if (m) { lo = parseFloat(m[1].replace(',', '.')); hi = parseFloat(m[2].replace(',', '.')); rep = true; }
      wert = (lo + hi) / 2; art = lo === hi ? 'einzel' : (rep ? 'repraesentativ' : 'mitte');
      /* Spanne mehr als Faktor 3 und kein typischer Wert: kein Rechenwert (ein Wert aus der Mitte wäre geraten) */
      if (lo > 0 && hi / lo > 3) { wert = null; art = 'weit'; }
    }
    return { wert: wert, von: rep ? lo : vb.von, bis: rep ? hi : vb.bis, vonVoll: vb.von, bisVoll: vb.bis, art: art, einheit: k.einheit || 'W/(m·K)' };
  }
  function systemOhneU(id) { return id === 'holzrahmen'; }
  function preisZeile(k) {
    var vb = zahlVonBis(k), m = MA();
    return { id: k.id, von: vb ? vb.von : null, bis: vb ? vb.bis : null, einheit: k.einheit || '', basis: k.basis || '', basisName: (m && m.basis_namen && m.basis_namen[k.basis]) || k.basis || '', nb: k.nb || '',
      hinweis: k.hinweis || '', bezugDickeCm: dickeAusHinweis(k.hinweis), beleg: beleg(k) };
  }
  function dickeAusHinweis(h) {
    var m = /(\d+(?:[.,]\d+)?)\s*cm/.exec(h || '');
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }
  /* Alle Kennwerte eines Materials in einer Form. Lücke = nichts gefunden: erkennbar an null und an luecken[]. */
  function materialKennwerte(daten, bauteil, materialId) {
    var m = daten || MA(), info = matInfo(materialId);
    if (!m || !info || (bauteil && info.bauteil !== bauteil)) return { ok: false, id: materialId, bauteil: bauteil, fehler: 'unbekanntesMaterial' };
    var res = { ok: true, id: materialId, bauteil: info.bauteil, name: info.name, luecken: [], lambda: null, dicke_wand_m: null, preise: [], preis: null, lebensdauer: null, brand: [], schall: null, ug: null, gwp: [], feuchte: [], wartung: [], verarbeitung: [], nachteil: [], dicke_u024: null };
    function wertText(z) { return z.echt.map(function (k) { return { text: k.wert || k.hinweis || '', beleg: beleg(k), widerspruch: !!k.widerspruch }; }); }
    var lz = zeilen(materialId, 'lambda').echt.concat(zeilen(materialId, 'lambda_thega').echt).filter(function (k) { return zahlVonBis(k); });
    var lw = null, lk = null;
    for (var li = 0; li < lz.length; li++) {
      var rw = rechenwertLambda(lz[li]);
      if (rw && (rw.wert != null || !lw)) { lw = rw; lk = lz[li]; if (rw.wert != null) break; }
    }
    if (lw) { lw.beleg = beleg(lk); res.lambda = lw; } else res.luecken.push('lambda');
    var dw = zeilen(materialId, 'dicke_wand').echt[0];
    if (dw && zahlVonBis(dw)) res.dicke_wand_m = { von: dw.von / 100, bis: dw.bis / 100, beleg: beleg(dw) };
    zeilen(materialId, 'preis').echt.forEach(function (k) { if (zahlVonBis(k)) res.preise.push(preisZeile(k)); });
    res.preis = res.preise[0] || null; if (!res.preis) res.luecken.push('preis');
    var ld = zeilen(materialId, 'lebensdauer').echt[0];
    if (ld && zahlVonBis(ld)) res.lebensdauer = { von: ld.von, bis: ld.bis, ge: !!ld.ge, beleg: beleg(ld) }; else res.luecken.push('lebensdauer');
    res.brand = wertText(zeilen(materialId, 'brand_din')); if (!res.brand.length) res.luecken.push('brand_din');
    var sc = zeilen(materialId, 'schall').echt.concat(zeilen(materialId, 'rw').echt);
    var scn = sc.filter(function (k) { return zahlVonBis(k); })[0];
    if (scn) res.schall = { von: scn.von, bis: scn.bis, einheit: scn.einheit, beleg: beleg(scn) }; else res.luecken.push('schall');
    var ug = zeilen(materialId, 'ug').echt[0];
    if (ug && zahlVonBis(ug)) res.ug = { von: ug.von, bis: ug.bis, beleg: beleg(ug) };
    zeilen(materialId, 'gwp').echt.forEach(function (k) {
      if (zahlVonBis(k)) res.gwp.push({ von: k.von, bis: k.bis, einheit: k.einheit, skala: k.skala || '', indikator: k.indikator || '', rechnung: !!k.rechnung, hinweis: k.hinweis || '', beleg: beleg(k) });
    });
    if (!res.gwp.length) res.luecken.push('gwp');
    res.feuchte = wertText(zeilen(materialId, 'feuchte')); if (!res.feuchte.length) res.luecken.push('feuchte');
    res.wartung = wertText(zeilen(materialId, 'wartung')); if (!res.wartung.length) res.luecken.push('wartung');
    res.verarbeitung = wertText(zeilen(materialId, 'verarbeitung')); if (!res.verarbeitung.length) res.luecken.push('verarbeitung');
    res.nachteil = wertText(zeilen(materialId, 'nachteil'));
    var du = zeilen(materialId, 'dicke_u024').echt[0];
    if (du) {
      var fakt = du.einheit === 'm' ? 100 : 1;
      if (zahlVonBis(du)) res.dicke_u024 = { von: du.von * fakt, bis: du.bis * fakt, beleg: beleg(du), rechnung: !!du.rechnung };
      else res.dicke_u024 = { text: du.wert || '', beleg: beleg(du), rechnung: !!du.rechnung };
    }
    return res;
  }

  /* ====================================================================== U-Wert und Heizwärme */
  /* U = 1 / (Rsi + Rse + Σ d/λ). schichten: [{d (m), lambda}], extra.rUebergang überschreibt 0,17. Annahmen sichtbar in der Seite. */
  function uWert(lambda, dicke_m, extra) {
    var ex = extra || {}, r = zahlOk(ex.rUebergang) ? ex.rUebergang : ANNAHMEN.rUebergang, s = [];
    if (zahlOk(lambda) && lambda > 0 && zahlOk(dicke_m) && dicke_m >= 0) s.push({ d: dicke_m, lambda: lambda });
    (ex.schichten || []).forEach(function (x) { if (zahlOk(x.lambda) && x.lambda > 0 && zahlOk(x.d) && x.d >= 0) s.push(x); });
    if (!s.length) return null;
    var rs = r; s.forEach(function (x) { rs += x.d / x.lambda; });
    return 1 / rs;
  }
  function gradtage(land) {
    var g = root.DATEN && root.DATEN.gradtage;
    if (g && g.laender && g.laender[land]) { var z = g.laender[land]; return { wert: z.wert, station: z.station, quelle: z.quelle, abruf: z.abruf, status: z.status, land: land, annahme: false }; }
    return { wert: ANNAHMEN.gradtageStandard, station: 'Annahme', quelle: 'Annahme (Bremen)', abruf: '', status: 'Annahme', land: land, annahme: true };
  }
  /* Transmissionsnäherung: H_T = Σ U·A in W/K, Q = H_T × Gradtagzahl × 24 / 1000 in kWh/a. Ohne Lüftungsverluste und ohne solare/innere Gewinne (kein Energieausweis). */
  function heizwaermeBedarf(flaechen, uWerte, gradtagzahl) {
    var ht = 0, teile = {};
    Object.keys(flaechen).forEach(function (k) {
      if (!zahlOk(flaechen[k]) || !zahlOk(uWerte[k])) return;
      teile[k] = uWerte[k] * flaechen[k]; ht += teile[k];
    });
    return { HT: ht, teile: teile, kwh: ht * gradtagzahl * 24 / 1000, gradtage: gradtagzahl };
  }

  /* Wahl des Materials im Plan: fehlt etwas, gilt der Standard; eine unbekannte Id wird durch den Standard ersetzt und gemeldet (nichts wird gespeichert). */
  function planMaterial(plan) {
    var pm = plan && plan.material && typeof plan.material === 'object' ? plan.material : {}, wahl = {}, meldungen = [], explizit = {};
    BAUTEILE_PLAN.forEach(function (b) {
      var v = pm[b];
      if (b === 'daemmung' && v === '') { wahl[b] = ''; explizit[b] = true; return; }   /* ausdrücklich „keine Dämmung“ */
      if (v == null || v === '') { wahl[b] = STANDARD_MATERIAL[b]; explizit[b] = false; return; }
      var info = matInfo(v);
      if (!info || info.bauteil !== b) { wahl[b] = STANDARD_MATERIAL[b]; meldungen.push({ bauteil: b, id: String(v) }); return; }
      wahl[b] = v; explizit[b] = true;
    });
    var dd = Number(pm.daemmdicke_cm);
    wahl.daemmdicke_cm = isFinite(dd) && dd >= 0 && dd <= 40 ? dd : STANDARD_MATERIAL.daemmdicke_cm;
    return { wahl: wahl, meldungen: meldungen, explizit: explizit };
  }
  function a7(k) { var m = MA(); return m && m.anlage7 && m.anlage7[k] ? m.anlage7[k] : null; }
  function wandDicke(plan) {
    var eb = DACH.ebenen(plan), best = null;
    plan.etagen.forEach(function (e, i) { if (eb[i] && !eb[i].keller && (e.raeume || []).length && (!best || eb[i].rang < eb[best.i].rang)) best = { i: i, d: Number(e.aussenwand) > 0 ? Number(e.aussenwand) : GEO.STD.aussenwand }; });
    return best ? best.d : GEO.STD.aussenwand;
  }

  /* Außenwand als Schichten: tragende Wand (λ des Materials, Dicke aus dem Plan) plus gewählte Dämmung. Rückgabe: U-Werte (mittel, niedrigster, höchster) oder Grund. */
  function wandU(plan, wahl) {
    var kw = materialKennwerte(null, 'aussenwand', wahl.aussenwand);
    if (!kw.ok) return { ok: false, grund: 'unbekanntesMaterial' };
    if (systemOhneU(wahl.aussenwand)) return { ok: false, grund: 'system', material: kw };
    if (!kw.lambda) return { ok: false, grund: 'keinLambda', material: kw };
    if (kw.lambda.wert == null) return { ok: false, grund: 'lambdaWeit', material: kw };
    var d = wandDicke(plan), dae = null;
    if (wahl.daemmung) {
      dae = materialKennwerte(null, 'daemmung', wahl.daemmung);
      if (!dae.ok || !dae.lambda || dae.lambda.wert == null) return { ok: false, grund: 'daemmungOhneLambda', material: kw, daemmung: dae };
    }
    function u(lw, ld) {
      var ex = { schichten: [] };
      if (dae) ex.schichten.push({ d: wahl.daemmdicke_cm / 100, lambda: ld });
      return uWert(lw, d, ex);
    }
    var res = { ok: true, d: d, material: kw, daemmung: dae, u: u(kw.lambda.wert, dae && dae.lambda.wert),
      uNiedrig: u(kw.lambda.von, dae && dae.lambda.von), uHoch: u(kw.lambda.bis, dae && dae.lambda.bis) };
    return res;
  }
  function fensterU(wahl) {
    var kw = materialKennwerte(null, 'verglasung', wahl.verglasung);
    if (!kw.ok || !kw.ug) return { ok: false, grund: 'keinUg', material: kw };
    return { ok: true, u: (kw.ug.von + kw.ug.bis) / 2, uNiedrig: kw.ug.von, uHoch: kw.ug.bis, material: kw };
  }

  /* Gesamtrechnung des gezeichneten Hauses: Heizwärmebedarf (Näherung), Kosten der gewählten Bauteile */
  function hausBilanz(plan, optionen) {
    var opt = optionen || {}, mg = mengenAusPlan(plan);
    if (!mg.ok) return { ok: false, fehler: mg.fehler || 'keinPlan', mengen: mg };
    var pm = planMaterial(plan), wahl = pm.wahl, h = mg.huelle, res = { ok: true, wahl: wahl, meldungen: pm.meldungen, explizit: pm.explizit, mengen: mg, annahmen: ANNAHMEN };
    var land = (plan && plan.land) || 'HB';
    res.gradtage = gradtage(land);
    var wu = wandU(plan, wahl), fu = fensterU(wahl);
    res.wand = wu; res.fenster = fu;
    var uTuer = a7('tuer'), uDach = a7('dach'), uBoden = a7('decke_unten');
    res.annahmeU = { tuer: uTuer ? uTuer.u : ANNAHMEN.uTuer, dach: uDach ? uDach.u : ANNAHMEN.uDach, boden: uBoden ? uBoden.u : ANNAHMEN.uBoden };
    if (!h) { res.heizung = { ok: false, grund: 'keineHuelle' }; }
    else if (!wu.ok || !fu.ok) res.heizung = { ok: false, grund: !wu.ok ? 'wand_' + wu.grund : 'fenster_' + fu.grund };
    else {
      var fl = { wand: h.wandNetto, fenster: h.fensterFlaeche, tuer: h.tuerFlaeche, dach: h.deckeFlaeche, boden: h.bodenFlaeche };
      function lauf(uw, uf) { return heizwaermeBedarf(fl, { wand: uw, fenster: uf, tuer: res.annahmeU.tuer, dach: res.annahmeU.dach, boden: res.annahmeU.boden }, res.gradtage.wert); }
      var mitte = lauf(wu.u, fu.u), lo = lauf(wu.uNiedrig, fu.uNiedrig), hi = lauf(wu.uHoch, fu.uHoch), wfl = mg.summe.wohnflaeche;
      res.heizung = { ok: true, flaechen: fl, u: { wand: wu.u, fenster: fu.u, tuer: res.annahmeU.tuer, dach: res.annahmeU.dach, boden: res.annahmeU.boden }, HT: mitte.HT, teile: mitte.teile, kwh: mitte.kwh,
        wohnflaeche: wfl, kwhM2: wfl > 0 ? mitte.kwh / wfl : null, kwhM2Niedrig: wfl > 0 ? lo.kwh / wfl : null, kwhM2Hoch: wfl > 0 ? hi.kwh / wfl : null };
    }
    res.kosten = materialKosten(plan, mg, wahl);
    return res;
  }

  /* Kosten der gewählten Bauteile: Fläche (oder Stück) × Preis. Eine Lücke bleibt „Angebot einholen“, nie 0. Jede Zeile trägt Preisbasis und Beleg. */
  function bauteilFlaeche(bauteil, mg, wahl) {
    var S = mg.summe, h = mg.huelle;
    switch (bauteil) {
      case 'aussenwand': case 'daemmung': return h ? { menge: h.wandNetto, einheit: 'm²', art: 'Außenwand (ohne Fenster und Türen)' } : null;
      case 'dach': return S.dachflaeche > 0 ? { menge: S.dachflaeche, einheit: 'm²', art: 'Dachfläche' } : null;
      case 'fenster': case 'verglasung': return h ? { menge: h.fensterFlaeche, einheit: 'm²', stueck: h.fensterStueck, art: 'Fensterfläche' } : null;
      case 'boden': return { menge: S.bodenTrocken, einheit: 'm²', art: 'Boden (ohne Bad und WC)' };
    }
    return null;
  }
  function kostenFuer(bauteil, materialId, fl, dickeCm) {
    var kw = materialKennwerte(null, bauteil, materialId);
    if (!kw.ok) return { ok: false, grund: 'unbekanntesMaterial' };
    var res = { ok: true, bauteil: bauteil, material: materialId, name: kw.name, flaeche: fl, preis: kw.preis, andere: kw.preise.slice(1), von: null, bis: null, luecke: false, faktor: 1, skaliert: false };
    if (!fl || !(fl.menge > 0)) { res.luecke = true; res.grund = 'keineMenge'; return res; }
    var p = kw.preis;
    if (!p) { res.luecke = true; res.grund = 'keinPreis'; return res; }
    var menge = fl.menge, einheit = p.einheit;
    if (p.basis === 'fenster_stueck') { if (!(fl.stueck > 0)) { res.luecke = true; res.grund = 'keineMenge'; return res; } menge = fl.stueck; res.mengeEinheit = 'Stück'; }
    else res.mengeEinheit = fl.einheit;
    var fak = 1;
    if (bauteil === 'daemmung' && p.basis === 'daemm_u024' && p.bezugDickeCm && dickeCm > 0) { fak = dickeCm / p.bezugDickeCm; res.skaliert = true; }
    res.faktor = fak; res.menge = menge;
    res.von = menge * p.von * fak; res.bis = menge * p.bis * fak;
    return res;
  }
  function materialKosten(plan, mg, wahl) {
    var out = {}, sv = 0, sb = 0, luecken = 0;
    BAUTEILE_PLAN.forEach(function (b) {
      if (b === 'daemmung' && !wahl.daemmung) { out[b] = { ok: true, keine: true, bauteil: b }; return; }
      if (b === 'verglasung') { out[b] = { ok: true, bauteil: b, luecke: true, grund: 'keinPreis', name: (matInfo(wahl.verglasung) || {}).name }; luecken += 1; return; }
      var k = kostenFuer(b, wahl[b], bauteilFlaeche(b, mg, wahl), wahl.daemmdicke_cm);
      out[b] = k;
      if (k.ok && !k.luecke && k.von != null) { sv += k.von; sb += k.bis; } else luecken += 1;
    });
    return { bauteile: out, von: sv, bis: sb, luecken: luecken };
  }

  /* ====================================================================== Ampeln (eigene Einordnung, R078) */
  /* Schwellen aus DATEN.material.ampel (Texte „ab 50“, „25 bis 49“ …); tmp/ausbau_kern_test.js prüft, dass diese Zahlen zu den Texten passen. */
  var SCHWELLEN = {
    lebensdauer: { gruenAb: 50, gelbAb: 25 },
    dickeCm: { gruenBis: 12, gelbBis: 17, rotAb: 18 },
    brand: { gruen: ['A1', 'A2'], gelb: ['B1'], rot: ['B2', 'B3', 'E', 'D'] }
  };
  function ampelLebensdauer(jahre) { return jahre >= SCHWELLEN.lebensdauer.gruenAb ? 'gruen' : (jahre >= SCHWELLEN.lebensdauer.gelbAb ? 'gelb' : 'rot'); }
  function ampelDicke(cm) { return cm <= SCHWELLEN.dickeCm.gruenBis ? 'gruen' : (cm <= SCHWELLEN.dickeCm.gelbBis ? 'gelb' : 'rot'); }
  /* U-Wert der Wand: grün bis 0,24 (Anlage 7, belegt); gelb bis 0,35 (eigene Wahl); sonst rot */
  function ampelU(u, ziel) {
    var z = zahlOk(ziel) ? ziel : 0.24;
    return u <= z + 1e-9 ? 'gruen' : (u <= ANNAHMEN.uGelbBis ? 'gelb' : 'rot');
  }
  /* Brandklasse aus dem Text (DIN 4102): schlechteste genannte Klasse zählt (vorsichtig); EN 13501 wird nicht vermischt */
  function brandKlasse(text) {
    var t = String(text || ''), m = t.match(/(?:DIN 4102\s*)?\b(A1|A2|B1|B2|B3)\b/g), rang = { A1: 0, A2: 1, B1: 2, B2: 3, B3: 4 }, worst = null;
    (m || []).forEach(function (x) { x = x.replace(/DIN 4102\s*/, ''); if (rang[x] != null && (worst === null || rang[x] > rang[worst])) worst = x; });
    if (!worst && /nicht brennbar/i.test(t)) worst = 'A1';
    return worst;
  }
  function ampelBrand(kl) { return !kl ? null : (SCHWELLEN.brand.gruen.indexOf(kl) >= 0 ? 'gruen' : (SCHWELLEN.brand.gelb.indexOf(kl) >= 0 ? 'gelb' : 'rot')); }

  /* ====================================================================== Vergleich je Bauteil */
  var KRITERIEN = [
    { id: 'preis', art: 'zahl', besser: 'min', gruppe: 'basis' },
    { id: 'daemm', art: 'zahl', besser: 'min', quelle: 'lambda' },
    { id: 'dicke', art: 'zahl', besser: 'min', quelle: 'dicke_u024', ampel: 'dicke' },
    { id: 'schall', art: 'zahl', besser: 'max' },
    { id: 'brand', art: 'text', quelle: 'brand' },
    { id: 'lebensdauer', art: 'zahl', besser: 'max', ampel: 'lebensdauer' },
    { id: 'wartung', art: 'text' },
    { id: 'feuchte', art: 'text' },
    { id: 'gwp', art: 'zahl', besser: 'min', gruppe: 'skala' },
    { id: 'selber', art: 'text', quelle: 'verarbeitung' }
  ];
  function mitteVonBis(x) { return x ? (x.von + x.bis) / 2 : null; }
  /* Eine Zelle je Material und Kriterium: Zahl (mit Spanne), Text oder Lücke */
  function zelle(kw, k) {
    var z = { kriterium: k.id, art: k.art, luecke: false };
    switch (k.id) {
      case 'preis': {
        if (!kw.preis) { z.luecke = true; break; }
        z.wert = (kw.preis.von + kw.preis.bis) / 2; z.von = kw.preis.von; z.bis = kw.preis.bis; z.einheit = kw.preis.einheit; z.gruppe = kw.preis.basis; z.gruppeName = kw.preis.basisName; z.nb = kw.preis.nb;
        z.beleg = kw.preis.beleg; z.weitere = kw.preise.slice(1).map(function (p) { return { von: p.von, bis: p.bis, einheit: p.einheit, basisName: p.basisName }; });
        break;
      }
      case 'daemm': {
        if (!kw.lambda) { z.luecke = true; break; }
        z.wert = kw.lambda.wert; z.von = kw.lambda.von; z.bis = kw.lambda.bis; z.einheit = kw.lambda.einheit; z.beleg = kw.lambda.beleg; z.mitte = kw.lambda.art === 'mitte' || kw.lambda.art === 'repraesentativ'; z.weit = kw.lambda.art === 'weit';
        if (z.weit) z.von = kw.lambda.vonVoll, z.bis = kw.lambda.bisVoll;
        break;
      }
      case 'dicke': {
        if (!kw.dicke_u024 || kw.dicke_u024.von == null) { z.luecke = !kw.dicke_u024; z.text = kw.dicke_u024 ? kw.dicke_u024.text : ''; z.beleg = kw.dicke_u024 ? kw.dicke_u024.beleg : null; if (kw.dicke_u024) { z.art = 'text'; z.rot = true; } break; }
        z.wert = (kw.dicke_u024.von + kw.dicke_u024.bis) / 2; z.von = kw.dicke_u024.von; z.bis = kw.dicke_u024.bis; z.einheit = 'cm'; z.beleg = kw.dicke_u024.beleg; z.rechnung = kw.dicke_u024.rechnung;
        z.ampel = ampelDicke(kw.dicke_u024.bis); break;
      }
      case 'schall': {
        if (!kw.schall) { z.luecke = true; break; }
        z.wert = (kw.schall.von + kw.schall.bis) / 2; z.von = kw.schall.von; z.bis = kw.schall.bis; z.einheit = kw.schall.einheit || 'dB'; z.beleg = kw.schall.beleg; z.gruppe = z.einheit; break;
      }
      case 'brand': {
        if (!kw.brand.length) { z.luecke = true; break; }
        z.texte = kw.brand.map(function (b) { return { text: b.text, klasse: brandKlasse(b.text), beleg: b.beleg, widerspruch: b.widerspruch }; });
        var kl = z.texte.map(function (t) { return t.klasse; }).filter(Boolean), rang = { A1: 0, A2: 1, B1: 2, B2: 3, B3: 4 }, w = null;
        kl.forEach(function (x) { if (w === null || rang[x] > rang[w]) w = x; });
        z.klasse = w; z.ampel = ampelBrand(w); z.uneinig = z.texte.some(function (t) { return t.widerspruch; });
        break;
      }
      case 'lebensdauer': {
        if (!kw.lebensdauer) { z.luecke = true; break; }
        z.wert = (kw.lebensdauer.von + kw.lebensdauer.bis) / 2; z.von = kw.lebensdauer.von; z.bis = kw.lebensdauer.bis; z.einheit = 'Jahre'; z.ge = kw.lebensdauer.ge; z.beleg = kw.lebensdauer.beleg;
        z.ampel = ampelLebensdauer(kw.lebensdauer.von); break;
      }
      case 'gwp': {
        if (!kw.gwp.length) { z.luecke = true; break; }
        /* bevorzugt die Zeile der Skala, die die meisten Materialien des Bauteils haben: das entscheidet vergleich(); hier alle Zeilen anbieten */
        z.zeilen = kw.gwp; break;
      }
      case 'wartung': case 'feuchte': case 'selber': {
        var l = k.id === 'selber' ? kw.verarbeitung : kw[k.id];
        if (!l.length) { z.luecke = true; break; }
        z.texte = l.map(function (x) { return { text: x.text, beleg: x.beleg }; }); break;
      }
    }
    return z;
  }
  function balkenAnteil(werte, wert, besser) {
    var mn = Math.min.apply(null, werte), mx = Math.max.apply(null, werte);
    if (mx === mn) return 1;
    return besser === 'min' ? (mx - wert) / (mx - mn) : (wert - mn) / (mx - mn);
  }
  /* Vergleich aller Materialien eines Bauteils: Zellen, Balken (nur innerhalb gleicher Preisbasis bzw. GWP-Skala), Sätze „besser, aber teurer“ */
  function vergleich(bauteil) {
    var liste = matListe(bauteil), res = { bauteil: bauteil, materialien: [], kriterien: KRITERIEN.map(function (k) { return k.id; }), saetze: [] };
    if (!liste.length) return { bauteil: bauteil, materialien: [], kriterien: [], saetze: [], fehler: 'keinBauteil' };
    var kws = liste.map(function (m) { return materialKennwerte(null, bauteil, m.id); });
    var ms = kws.map(function (kw) { var o = { id: kw.id, name: kw.name, zellen: {}, nachteile: kw.nachteil.map(function (n) { return { text: n.text, beleg: n.beleg }; }), luecken: kw.luecken }; KRITERIEN.forEach(function (k) { o.zellen[k.id] = zelle(kw, k); }); return o; });
    /* GWP: die Skala wählen, die die meisten Materialien tragen; nur diese bekommen einen Balken (Herstellung A1 bis A3, negative Werte = gespeicherter Kohlenstoff) */
    var zaehl = {};
    ms.forEach(function (m) { var z = m.zellen.gwp; if (z.zeilen) { var seen = {}; z.zeilen.forEach(function (r) { if (!seen[r.skala]) { seen[r.skala] = 1; zaehl[r.skala] = (zaehl[r.skala] || 0) + 1; } }); } });
    var beste = Object.keys(zaehl).sort(function (a, b) { return zaehl[b] - zaehl[a]; })[0] || null;
    /* Dämmstoffe: gerecht ist der Vergleich bei gleichem Wärmewiderstand (je m² bei R = 1, ampel amp_gwp), nicht je m³ */
    if ((zaehl.daemm_m2_r1 || 0) >= 3) beste = 'daemm_m2_r1';
    ms.forEach(function (m) {
      var z = m.zellen.gwp; if (!z.zeilen) return;
      var pr = z.zeilen.filter(function (r) { return r.skala === beste; });
      if (pr.length) {
        var lo = Math.min.apply(null, pr.map(function (r) { return r.von; })), hi = Math.max.apply(null, pr.map(function (r) { return r.bis; }));
        z.wert = (lo + hi) / 2; z.von = lo; z.bis = hi; z.einheit = pr[0].einheit; z.gruppe = beste; z.beleg = pr[0].beleg; z.indikator = pr[0].indikator; z.negativ = lo < 0;
      } else { z.andereSkala = true; z.einheit = z.zeilen[0].einheit; z.von = z.zeilen[0].von; z.bis = z.zeilen[0].bis; z.beleg = z.zeilen[0].beleg; }
    });
    /* Balken je Kriterium und Gruppe */
    KRITERIEN.forEach(function (k) {
      if (k.art !== 'zahl') return;
      var gruppen = {};
      ms.forEach(function (m) { var z = m.zellen[k.id]; if (z && z.wert != null && !z.luecke && !z.andereSkala) { (gruppen[z.gruppe || '_'] = gruppen[z.gruppe || '_'] || []).push(z); } });
      Object.keys(gruppen).forEach(function (g) {
        var zs = gruppen[g], werte = zs.map(function (z) { return z.wert; });
        zs.forEach(function (z) { z.gruppenGroesse = zs.length; z.balken = zs.length > 1 ? balkenAnteil(werte, z.wert, k.besser) : null; });
      });
      ms.forEach(function (m) { var z = m.zellen[k.id]; if (z && z.wert != null && z.gruppenGroesse == null) z.gruppenGroesse = 1; });
    });
    /* „besser, aber teurer“: gleiche Preisbasis, besserer Dämmwert (kleineres λ) oder längere Lebensdauer bei höherem Preis als das billigste Material der Gruppe */
    var pg = {};
    ms.forEach(function (m) { var z = m.zellen.preis; if (z.wert != null) (pg[z.gruppe] = pg[z.gruppe] || []).push(m); });
    Object.keys(pg).forEach(function (g) {
      var gr = pg[g].slice().sort(function (a, b) { return a.zellen.preis.wert - b.zellen.preis.wert; });
      if (gr.length < 2) return;
      var ref = gr[0];
      gr.slice(1).forEach(function (m) {
        if (!(m.zellen.preis.wert > ref.zellen.preis.wert * 1.0001)) return;
        var d = m.zellen.daemm, r = ref.zellen.daemm, l = m.zellen.lebensdauer, rl = ref.zellen.lebensdauer;
        if (d.wert != null && r.wert != null && d.wert < r.wert * 0.9999) res.saetze.push({ art: 'daemm', besser: m.id, referenz: ref.id, preis: m.zellen.preis.wert, preisRef: ref.zellen.preis.wert, einheit: m.zellen.preis.einheit, wert: d.wert, wertRef: r.wert });
        else if (l.wert != null && rl.wert != null && l.wert > rl.wert * 1.0001) res.saetze.push({ art: 'lebensdauer', besser: m.id, referenz: ref.id, preis: m.zellen.preis.wert, preisRef: ref.zellen.preis.wert, einheit: m.zellen.preis.einheit, wert: l.wert, wertRef: rl.wert });
      });
    });
    res.materialien = ms; res.gwpSkala = beste;
    return res;
  }

  /* Eigenständiger Rechner im Bereich „Material vergleichen“: Fläche + Material → Menge, Kosten, U-Wert. Dieselben Funktionen wie die Planerkarte. */
  function rechnerEinzel(bauteil, materialId, flaeche, optionen) {
    var opt = optionen || {}, kw = materialKennwerte(null, bauteil, materialId);
    if (!kw.ok) return { ok: false, fehler: 'unbekanntesMaterial' };
    var fl = { menge: flaeche, einheit: 'm²', stueck: opt.stueck, art: '' };
    var k = kostenFuer(bauteil, materialId, fl, opt.daemmdickeCm);
    var res = { ok: true, bauteil: bauteil, material: kw, kosten: k, u: null, uGrund: null };
    if (bauteil === 'daemmung') {
      if (!kw.lambda) res.uGrund = 'keinLambda';
      else if (kw.lambda.wert == null) res.uGrund = 'lambdaWeit';
      else { var d = (opt.daemmdickeCm || 0) / 100; res.u = { wert: uWert(kw.lambda.wert, d), niedrig: uWert(kw.lambda.von, d), hoch: uWert(kw.lambda.bis, d), nurDaemmung: true }; }
    } else if (bauteil === 'aussenwand') {
      if (systemOhneU(materialId)) res.uGrund = 'system'; else if (!kw.lambda) res.uGrund = 'keinLambda'; else if (kw.lambda.wert == null) res.uGrund = 'lambdaWeit';
      else { var dd = (opt.wanddickeCm || 30) / 100; res.u = { wert: uWert(kw.lambda.wert, dd), niedrig: uWert(kw.lambda.von, dd), hoch: uWert(kw.lambda.bis, dd) }; }
    } else if (bauteil === 'verglasung') {
      if (!kw.ug) res.uGrund = 'keinUg'; else res.u = { wert: (kw.ug.von + kw.ug.bis) / 2, niedrig: kw.ug.von, hoch: kw.ug.bis, ug: true };
    }
    if (res.u) res.u.ampel = ampelU(res.u.wert, bauteil === 'verglasung' ? (a7('glas') ? a7('glas').u : 1.1) : 0.24);
    return res;
  }

  var api = {
    ANNAHMEN: ANNAHMEN, STANDARD_MATERIAL: STANDARD_MATERIAL, BAUTEILE_PLAN: BAUTEILE_PLAN, STUFEN: STUFEN, SCHWELLEN: SCHWELLEN, KRITERIEN: KRITERIEN, BEZUG_MENGE: BEZUG_MENGE,
    mengenAusPlan: mengenAusPlan, innenausbauKosten: innenausbauKosten, elektroFaktoren: elektroFaktoren, elektroSoll: elektroSoll, auswahl: auswahl,
    materialKennwerte: materialKennwerte, matListe: matListe, matInfo: matInfo, rechenwertLambda: rechenwertLambda, uWert: uWert, heizwaermeBedarf: heizwaermeBedarf, gradtage: gradtage,
    planMaterial: planMaterial, wandU: wandU, fensterU: fensterU, hausBilanz: hausBilanz, materialKosten: materialKosten, kostenFuer: kostenFuer, bauteilFlaeche: bauteilFlaeche,
    ampelLebensdauer: ampelLebensdauer, ampelDicke: ampelDicke, ampelU: ampelU, ampelBrand: ampelBrand, brandKlasse: brandKlasse, vergleich: vergleich, rechnerEinzel: rechnerEinzel
  };
  root.AUSBAU_KERN = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
