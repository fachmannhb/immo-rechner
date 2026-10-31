/* Bereich „Grundriss und Einrichtung“: Bild laden, Maßstab, Räume zeichnen, Möbel stellen,
   Wohnfläche (WoFlV) und Kosten. Alle Koordinaten in Metern; das Bild liegt mit der linken
   oberen Ecke auf (0,0) und ist mpp Meter je Bildpunkt groß. Speichert unter „immo-grundriss“.
   Rechnet mit RECHNER (rechner.js), zeichnet 3D über GRUNDRISS3D (grundriss3d.js). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var svg = $('g-plan');
  if (!svg || !window.RECHNER) return;
  var R = window.RECHNER;
  var GEO = window.GRUNDRISS_GEO;
  if (!GEO) return;
  /* Texte der neuen Funktionen in drei Sprachen (daten/texte.js, sprache.js); ohne sie bleibt der Schlüssel sichtbar */
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  var KAT = (window.DATEN && window.DATEN.moebel) || { artikel: [] };
  var ART = {};
  KAT.artikel.forEach(function (a) { ART[a.id] = a; });
  var SCHLUESSEL = 'immo-grundriss';
  var NS = 'http://www.w3.org/2000/svg';
  var fmt1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmt0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  function euro(x) { return fmt0.format(Math.round(x)) + ' €'; }
  function qm(x) { return fmt1.format(x) + ' m²'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function zahl(s) { var n = R.leseZahl(s); return n == null ? null : n; }
  function neueId(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function rund(x, schritt) { return Math.round(x / schritt) * schritt; }

  var ARTEN = [
    ['voll', 'Wohnraum (Zimmer, Küche, Bad, Flur)'],
    ['balkon', 'Balkon, Loggia, Terrasse'],
    ['wintergarten', 'Wintergarten (unbeheizt)'],
    ['zubehoer', 'Keller, Garage, Heizraum, Abstellraum außerhalb']
  ];

  /* Vorlagen: Schlüssel der Texte (daten/texte.js) je Vorlage als volle Zeichenketten, damit tmp/planung_test.py sie findet */
  var VORLAGEN_T = {
    beispielhaus: { name: 'vorlageNameBeispiel', kurz: 'vorlageKurzBeispiel', text: 'vorlageTextBeispiel' },
    musterhaus2: { name: 'vorlageNameMuster', kurz: 'vorlageKurzMuster', text: 'vorlageTextMuster' },
    klein: { name: 'vorlageNameKlein', kurz: 'vorlageKurzKlein', text: 'vorlageTextKlein' },
    gross: { name: 'vorlageNameGross', kurz: 'vorlageKurzGross', text: 'vorlageTextGross' }
  };

  /* ---------- Zustand ---------- */
  /* Datenmodell Version 2 (Version 1 lädt mit Standardwerten):
     Etage: hoehe (lichte Raumhöhe, Standard = alte plan.wandhoehe), aussenwand 0,30, innenwand 0,115, decke 0,25.
     Fenster/Tür: hoehe, bruestung (Fenster 0,9, Tür 0), bindung {raum, kante, t} oder null, bindungGrund.
     Plan: dach {form, neigung, first, ueberstand}. plan.wandhoehe bleibt als Standardhöhe neuer Etagen erhalten. */
  function neueEtage(name, hoehe) {
    return { name: name, bild: null, bildB: 0, bildH: 0, mpp: 0.01, massstab: false, hoehe: hoehe || 2.5, aussenwand: 0.30, innenwand: 0.115, decke: 0.25, raeume: [], teile: [] };
  }
  function neuesDach() { return { form: 'sattel', neigung: 35, first: 'x', ueberstand: 0.3 }; }
  /* Welle C (Regeln): plan.land = Bundesland-Kürzel (Standard Bremen, zuletzt gewähltes merkt sich die Seite für neue Pläne),
     plan.gebaeudeklasse 0 = noch nicht gewählt (dann gilt der Vorschlag), 1 bis 5; plan.wohnungen; plan.freistehend; raum.nutzung ('' = aus dem Namen);
     Fenster/Tür bestand:true = schon vorhanden, kostet beim Umbau nichts (Vorlagen). Alte Pläne laden unverändert (Datenmodell bleibt Version 2). */
  var RK = window.REGELN || null;
  var LAND_KEY = 'immo-land';
  function landLesen() {
    try { var k = localStorage.getItem(LAND_KEY); if (k && RK && RK.landOk(k)) return k; } catch (e) { /* ohne Speicher bleibt Bremen */ }
    return 'HB';
  }
  function landMerken(k) { try { localStorage.setItem(LAND_KEY, k); return true; } catch (e) { return false; } }
  function leererPlan() { return { app: 'immo-grundriss', version: 2, aktiv: 0, wandhoehe: 2.5, nord: 0, land: landLesen(), gebaeudeklasse: 0, wohnungen: 1, freistehend: true, dach: neuesDach(), preise: {}, mengen: {}, etagen: [neueEtage('Erdgeschoss', 2.5)] }; }
  function istTuerFenster(t) { var a = ART[t.art]; return !!a && (a.form === 'tuer' || a.form === 'fenster'); }
  var plan = laden() || leererPlan();
  var massAn = true;        /* Maßlinien zeigen */
  var markiert = null;      /* Teil, das gerade eingerastet ist (kurze Hervorhebung) */
  var gewaehlt = null;      /* { typ:'raum'|'teil', id } */
  var modus = 'auswahl';    /* auswahl | rechteck | ecken | massstab */
  var entwurf = [];         /* Punkte beim Zeichnen Ecke für Ecke */
  var maus = null;          /* letzte Mausposition im Plan */
  var massPunkte = [];
  var ziehen = null;
  var ansicht3d = false;
  var gruppe = 'wohnung';
  var vb = null;            /* sichtbarer Ausschnitt {x,y,w,h} */
  var sichtbar = false;

  function etage() { return plan.etagen[plan.aktiv] || plan.etagen[0]; }

  /* ---------- Fenster und Türen an der Wand ---------- */
  var SNAP = 0.4;   /* so nah (Meter) rastet ein Fenster oder eine Tür an einer Raumkante ein */
  function raumIn(e, id) { return e.raeume.filter(function (r) { return r.id === id; })[0]; }
  function loseBindung(t, grund) { t.bindung = null; t.bindungGrund = grund || ''; }
  /* Gebundene Teile folgen ihrer Raumkante (Ecke verschoben, Maßstab, Raum bewegt). Fehlt der Raum oder die
     Kante, bleibt das Teil frei stehen und merkt sich den Grund (wird in Seitenfeld und Statuszeile gezeigt). */
  function nachfuehren(e) {
    var wl = null;
    e.teile.forEach(function (t) {
      if (!t.bindung || !istTuerFenster(t)) return;
      var raum = raumIn(e, t.bindung.raum);
      if (!raum) { loseBindung(t, 'geloescht|'); return; }
      if (!GEO.kanten(raum)[t.bindung.kante]) { loseBindung(t, 'kante|' + raum.name); return; }
      wl = wl || GEO.waende(e);
      var p = GEO.bindungPos(e, t.bindung, t.w, t.dreh, wl);
      if (!p) { loseBindung(t, 'kante|' + raum.name); return; }
      t.x = p.x; t.y = p.y; t.dreh = p.dreh; if (p.dicke) t.d = p.dicke;
    });
  }
  function nachfuehrenAlle() { plan.etagen.forEach(nachfuehren); }
  /* Teil an die nächste Raumkante setzen (wunsch = gewünschte Mitte). true = eingerastet. */
  function anWand(t, wunsch, maxD) {
    var e = etage(), vorher = t.bindung ? t.dreh : null;
    var k = GEO.naechsteKante(e, wunsch, maxD == null ? SNAP : maxD, t.bindung);
    if (!k) { if (t.bindung) t.d = ART[t.art].tiefe / 100; loseBindung(t, ''); t.x = wunsch[0]; t.y = wunsch[1]; return false; }
    t.bindung = { raum: k.raum, kante: k.kante, t: k.laenge ? k.s / k.laenge : 0.5 };
    t.bindungGrund = '';
    var p = GEO.bindungPos(e, t.bindung, t.w, vorher, GEO.waende(e));
    if (!p) { loseBindung(t, ''); t.x = wunsch[0]; t.y = wunsch[1]; return false; }
    t.x = p.x; t.y = p.y; t.dreh = p.dreh; if (p.dicke) t.d = p.dicke;
    return true;
  }
  function freieTeile() {
    var r = [];
    plan.etagen.forEach(function (e) { e.teile.forEach(function (t) { if (t.bindungGrund) r.push({ t: t, etage: e }); }); });
    return r;
  }
  function grundText(g) {
    var p = String(g).split('|');
    return p[0] === 'geloescht' ? tr(p[1] ? 'grundGeloeschtName' : 'grundGeloescht', { name: p[1] || '' }) : tr('grundKante', { name: p[1] || '' });
  }
  function teilName(t) { return tr(ART[t.art].form === 'fenster' ? 'wortFenster' : 'wortTuer'); }

  /* ---------- Speichern ---------- */
  function pruefePlan(p) {
    if (!p || typeof p !== 'object' || p.app !== 'immo-grundriss' || !Array.isArray(p.etagen) || !p.etagen.length) return null;
    var zahlOk = function (x, d) { x = Number(x); return isFinite(x) ? x : d; };
    var neu = leererPlan();
    var klemme = function (x, lo, hi) { return Math.min(hi, Math.max(lo, x)); };
    neu.version = 2;
    /* Himmelsrichtung: Winkel in Grad, in den Norden auf dem Plan zeigt (0 = nach oben, im Uhrzeigersinn); v1-Pläne: 0 */
    neu.nord = Math.round(((zahlOk(p.nord, 0) % 360) + 360) % 360) % 360;
    neu.wandhoehe = klemme(zahlOk(p.wandhoehe, 2.5), 1.8, 6);
    neu.land = RK && RK.landOk(p.land) ? p.land : landLesen();
    neu.gebaeudeklasse = Math.round(klemme(zahlOk(p.gebaeudeklasse, 0), 0, 5));
    neu.wohnungen = Math.round(klemme(zahlOk(p.wohnungen, 1), 1, 50));
    neu.freistehend = p.freistehend !== false;
    var d0 = p.dach && typeof p.dach === 'object' ? p.dach : {};
    neu.dach = {
      form: ['sattel', 'walm', 'pult', 'flach'].indexOf(d0.form) >= 0 ? d0.form : 'sattel',
      neigung: klemme(zahlOk(d0.neigung, 35), 0, 80),
      first: d0.first === 'y' ? 'y' : 'x',
      ueberstand: klemme(zahlOk(d0.ueberstand, 0.3), 0, 2)
    };
    /* Pultdach: hohe Seite. Nur gespeichert, wenn nicht der Standard ('min' = oben bzw. links im Plan), damit ältere Pläne unverändert bleiben */
    if (d0.hoch === 'max') neu.dach.hoch = 'max';
    /* Welle D, Teil 2a: Materialwahl (optional). Fehlt das Feld, bleibt es weg (alte Pläne laden unverändert); die Standardwerte setzt erst die Rechnung ein
       (AUSBAU_KERN.planMaterial). Eine unbekannte Id wird mit gespeichert und in der Karte als Meldung gezeigt, der Standard gilt dann. */
    if (p.material && typeof p.material === 'object' && !Array.isArray(p.material)) {
      var pm = {}, pmOk = false;
      ['aussenwand', 'daemmung', 'dach', 'fenster', 'verglasung', 'boden'].forEach(function (k) {
        var v = p.material[k];
        if (typeof v === 'string' && /^[a-z0-9_]{0,30}$/.test(v)) { pm[k] = v; pmOk = true; }
      });
      if (typeof p.material.daemmdicke_cm === 'number' && isFinite(p.material.daemmdicke_cm)) { pm.daemmdicke_cm = klemme(p.material.daemmdicke_cm, 0, 40); pmOk = true; }
      if (pmOk) neu.material = pm;
    }
    /* Welle D, Teil 2b: Dämmstandard, Lüftung, Wasser, Energiepreise (alle optional). Nur vorhandene, gültig geformte Felder werden übernommen; fehlt ein Feld, bleibt es weg
       (alte Pläne laden unverändert). Eine unbekannte Id wird mitgespeichert und in der Karte als Meldung gezeigt (HUELLE_KERN.planStandard usw.), der Standard gilt dann. */
    var idOk = function (v) { return typeof v === 'string' && /^[a-z0-9_]{1,30}$/.test(v); };
    if (idOk(p.daemmstandard)) neu.daemmstandard = p.daemmstandard;
    if (idOk(p.kfwstufe)) neu.kfwstufe = p.kfwstufe;
    if (typeof p.mehrkosten_eigen === 'number' && isFinite(p.mehrkosten_eigen) && p.mehrkosten_eigen > 0) neu.mehrkosten_eigen = klemme(p.mehrkosten_eigen, 0, 99999999);
    if (p.lueftung && typeof p.lueftung === 'object' && !Array.isArray(p.lueftung)) {
      var lu = {};
      if (idOk(p.lueftung.art)) lu.art = p.lueftung.art;
      if (typeof p.lueftung.neubau === 'boolean') lu.neubau = p.lueftung.neubau;
      if (Object.keys(lu).length) neu.lueftung = lu;
    }
    /* Welle E, Teil 2: Personen im Haus, gemeinsame Stelle für Wasser-Karte und Autarkie-Block (1 bis 12); ältere Pläne haben nur plan.wasser.personen, das bleibt gültig */
    if (typeof p.personen === 'number' && isFinite(p.personen)) neu.personen = Math.round(klemme(p.personen, 1, 12));
    if (p.wasser && typeof p.wasser === 'object' && !Array.isArray(p.wasser)) {
      var wa = {}, pw0 = p.wasser;
      if (typeof pw0.personen === 'number' && isFinite(pw0.personen)) wa.personen = Math.round(klemme(pw0.personen, 1, 12));
      if (typeof pw0.regenwasser === 'boolean') wa.regenwasser = pw0.regenwasser;
      if (typeof pw0.gruendach === 'boolean') wa.gruendach = pw0.gruendach;
      if (typeof pw0.enthaertung === 'boolean') wa.enthaertung = pw0.enthaertung;
      if (idOk(pw0.haerte)) wa.haerte = pw0.haerte;
      if (typeof pw0.preis === 'number' && isFinite(pw0.preis) && pw0.preis > 0) wa.preis = klemme(pw0.preis, 0.01, 49.99);
      if (Object.keys(wa).length) neu.wasser = wa;
    }
    if (p.energiepreise && typeof p.energiepreise === 'object' && !Array.isArray(p.energiepreise)) {
      var ep0 = p.energiepreise, ep = {};
      if (idOk(ep0.traeger)) ep.traeger = ep0.traeger;
      if (typeof ep0.gas_ct === 'number' && isFinite(ep0.gas_ct) && ep0.gas_ct > 0) ep.gas_ct = klemme(ep0.gas_ct, 0.01, 199.99);
      if (typeof ep0.oel_eur100l === 'number' && isFinite(ep0.oel_eur100l) && ep0.oel_eur100l > 0) ep.oel_eur100l = klemme(ep0.oel_eur100l, 0.01, 999.99);
      if (Object.keys(ep).length) neu.energiepreise = ep;
    }
    /* Welle D, Teil 3: plan.anbau = { art, flaeche_m2, hoehe_m, tiefe_m }, optional (eine unbekannte art bleibt stehen, die Karte meldet sie) */
    if (p.anbau && typeof p.anbau === 'object' && !Array.isArray(p.anbau)) {
      var ab0 = p.anbau, ab = {};
      if (idOk(ab0.art)) ab.art = ab0.art;
      if (typeof ab0.flaeche_m2 === 'number' && isFinite(ab0.flaeche_m2) && ab0.flaeche_m2 > 0) ab.flaeche_m2 = klemme(ab0.flaeche_m2, 1, 500);
      if (typeof ab0.hoehe_m === 'number' && isFinite(ab0.hoehe_m) && ab0.hoehe_m > 0) ab.hoehe_m = klemme(ab0.hoehe_m, 1, 10);
      if (typeof ab0.tiefe_m === 'number' && isFinite(ab0.tiefe_m) && ab0.tiefe_m > 0) ab.tiefe_m = klemme(ab0.tiefe_m, 1, 8);   /* Welle E, Teil 1b: Tiefe für Grenzen mit Tiefe (Bremen) */
      if (Object.keys(ab).length) neu.anbau = ab;
    }
    /* Welle E, Teil 1: plan.grundstueck = { breite_m, tiefe_m, haus_x_m, haus_y_m } und plan.aussen = [ { id, art, x_m, y_m, breite_m, tiefe_m, hoehe_m } ], beide optional.
       Nur endliche Zahlen und gültig geformte Ids; eine unbekannte art bleibt stehen, die Karte meldet sie (GRUNDSTUECK_KERN); Werte außerhalb des Grundstücks schiebt der Kern an den Rand. */
    if (p.grundstueck && typeof p.grundstueck === 'object' && !Array.isArray(p.grundstueck)) {
      var gs0 = p.grundstueck, gs = {};
      ['breite_m', 'tiefe_m', 'haus_x_m', 'haus_y_m'].forEach(function (k) { if (typeof gs0[k] === 'number' && isFinite(gs0[k])) gs[k] = klemme(gs0[k], k.indexOf('haus') === 0 ? -1000 : 1, 1000); });
      if (Object.keys(gs).length) neu.grundstueck = gs;
    }
    if (Array.isArray(p.aussen)) {
      var au = [];
      p.aussen.slice(0, 80).forEach(function (a0) {
        if (!a0 || typeof a0 !== 'object' || !idOk(a0.art)) return;
        var a = { id: typeof a0.id === 'string' && /^[a-z0-9_]{1,12}$/.test(a0.id) ? a0.id : 'a' + (au.length + 1), art: a0.art };
        ['x_m', 'y_m', 'breite_m', 'tiefe_m', 'hoehe_m'].forEach(function (k) { if (typeof a0[k] === 'number' && isFinite(a0[k])) a[k] = klemme(a0[k], -1000, 1000); });
        /* Ofen (Sauna) und Baugebiet (Kleinwind); anderes fällt weg */
        if (a0.art === 'sauna' && (a0.ofen === 'elektro' || a0.ofen === 'holz')) a.ofen = a0.ofen;
        if (a0.art === 'kleinwind' && (a0.gebiet === 'wr' || a0.gebiet === 'wa' || a0.gebiet === 'gw')) a.gebiet = a0.gebiet;
        au.push(a);
      });
      if (au.length) neu.aussen = au;
    }
    neu.preise = {}; neu.mengen = {};
    Object.keys(p.preise || {}).forEach(function (k) { var v = Number(p.preise[k]); if (isFinite(v) && v >= 0) neu.preise[k] = v; });
    Object.keys(p.mengen || {}).forEach(function (k) { var v = Number(p.mengen[k]); if (isFinite(v) && v >= 0) neu.mengen[k] = v; });
    neu.etagen = p.etagen.slice(0, 12).map(function (e, i) {
      var n = neueEtage(String(e.name || ('Etage ' + (i + 1))).slice(0, 40), neu.wandhoehe);
      n.hoehe = klemme(zahlOk(e.hoehe, neu.wandhoehe), 1.8, 6);
      n.aussenwand = klemme(zahlOk(e.aussenwand, 0.30), 0.05, 0.8);   /* gleiche Grenzen wie die Felder (5 bis 80 cm) */
      n.innenwand = klemme(zahlOk(e.innenwand, 0.115), 0.05, 0.8);
      n.decke = klemme(zahlOk(e.decke, 0.25), 0.05, 1);
      if (typeof e.bild === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(e.bild)) {
        n.bild = e.bild; n.bildB = zahlOk(e.bildB, 0); n.bildH = zahlOk(e.bildH, 0);
      }
      n.mpp = zahlOk(e.mpp, 0.01) > 0 ? zahlOk(e.mpp, 0.01) : 0.01;
      n.massstab = !!e.massstab;
      n.raeume = (e.raeume || []).filter(function (r) { return r && Array.isArray(r.punkte) && r.punkte.length >= 3; }).map(function (r) {
        return {
          id: String(r.id || neueId('r')), name: String(r.name || 'Raum').slice(0, 40),
          art: ARTEN.some(function (a) { return a[0] === r.art; }) ? r.art : 'voll',
          nutzung: RK && RK.NUTZUNGEN.indexOf(r.nutzung) >= 0 ? r.nutzung : '',
          punkte: r.punkte.map(function (q) { return [zahlOk(q[0], 0), zahlOk(q[1], 0)]; }),
          teil12: zahlOk(r.teil12, 0), teil0: zahlOk(r.teil0, 0), balkon: zahlOk(r.balkon, 25), separat: !!r.separat
        };
      });
      n.teile = (e.teile || []).filter(function (t) { return t && ART[t.art]; }).map(function (t) {
        /* Drehwinkel: seit Version 2 beliebig (Fenster an schrägen Wänden), sonst 0/90/180/270 wie vorher */
        var dr = ((zahlOk(t.dreh, 0) % 360) + 360) % 360;
        var o = { id: String(t.id || neueId('t')), art: t.art, x: zahlOk(t.x, 0), y: zahlOk(t.y, 0), w: Math.max(0.05, zahlOk(t.w, 1)), d: Math.max(0.02, zahlOk(t.d, 1)), dreh: Math.round(dr * 100) / 100 };
        if (istTuerFenster(t)) {
          var a = ART[t.art], bd = t.bindung;
          o.hoehe = klemme(zahlOk(t.hoehe, a.hoehe / 100), 0.3, 4);
          o.bruestung = klemme(zahlOk(t.bruestung, a.form === 'fenster' ? 0.9 : 0), 0, 3);
          o.bindung = bd && typeof bd === 'object' && typeof bd.raum === 'string' && bd.raum && isFinite(Number(bd.kante)) && Number(bd.kante) >= 0
            ? { raum: bd.raum.slice(0, 60), kante: Math.floor(Number(bd.kante)), t: klemme(zahlOk(bd.t, 0.5), 0, 1) } : null;
          o.bindungGrund = typeof t.bindungGrund === 'string' ? t.bindungGrund.slice(0, 90) : '';
          if (t.bestand === true) o.bestand = true;
        }
        return o;
      });
      return n;
    });
    neu.aktiv = Math.min(neu.etagen.length - 1, Math.max(0, zahlOk(p.aktiv, 0) | 0));
    if (p.beispiel === true) neu.beispiel = true;
    /* Kennung der geladenen Vorlage (daten/vorlage_*.js), nur Kleinbuchstaben, Ziffern und _ */
    if (typeof p.vorlage === 'string' && /^[a-z0-9_]{1,30}$/.test(p.vorlage)) neu.vorlage = p.vorlage;
    return neu;
  }
  function laden() {
    try { var t = localStorage.getItem(SCHLUESSEL); return t ? pruefePlan(JSON.parse(t)) : null; } catch (e) { return null; }
  }
  var speicherTimer = null;
  function speichern() {
    /* Welle D: Strom vom Dach und Kompaktheit rechnen mit dem Plan, bei jeder Änderung neu (entprellt) */
    if (window.GRUNDRISS_ENERGIE) window.GRUNDRISS_ENERGIE.aktualisieren();
    if (window.GRUNDRISS_FORMEN) window.GRUNDRISS_FORMEN.aktualisieren();
    if (window.GRUNDRISS_AUSBAU) window.GRUNDRISS_AUSBAU.aktualisieren();   /* Welle D, Teil 2a: Innenausbau, Material und Umbau-Hinweis */
    if (window.GRUNDRISS_HUELLE) window.GRUNDRISS_HUELLE.aktualisieren();   /* Welle D, Teil 2b: Dämmstandard, Lüftung, Wasser */
    if (window.GRUNDRISS_ANBAU) window.GRUNDRISS_ANBAU.aktualisieren();     /* Welle D, Teil 3: Anbau */
    if (window.GRUNDRISS_GRUNDSTUECK) window.GRUNDRISS_GRUNDSTUECK.aktualisieren();   /* Welle E, Teil 1: Grundstück */
    clearTimeout(speicherTimer);
    speicherTimer = setTimeout(function () {
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(plan));
        if (meldungArt === 'speicher') meldung('');
      } catch (e) {
        /* meist zu groß wegen der Bilder: Plan ohne Bilder speichern und sagen, warum */
        var ohne = JSON.parse(JSON.stringify(plan));
        ohne.etagen.forEach(function (et) { et.bild = null; });
        try {
          localStorage.setItem(SCHLUESSEL, JSON.stringify(ohne));
          meldung('Der Plan ist gespeichert, das Grundrissbild aber nicht: es ist zu groß für den Speicher dieses Browsers. Sichern Sie den Plan als Datei („Plan sichern“ unten), dann bleibt auch das Bild erhalten.', 'speicher');
        } catch (e2) {
          meldung('Der Plan konnte in diesem Browser nicht gespeichert werden (Speicher voll oder gesperrt, z. B. im privaten Fenster). Sichern Sie ihn als Datei, sonst ist er nach dem Schließen weg.', 'speicher');
        }
      }
    }, 300);
  }
  var meldungArt = '';
  function meldung(text, art) { $('g-meldung').textContent = text; meldungArt = text ? (art || '') : ''; }

  /* ---------- Ansicht ---------- */
  var skalaUeber = 0;   /* nur beim Druckvorbereiten: Meter je Punkt, damit Beschriftungen auf Papier lesbar bleiben */
  function px2m() { if (skalaUeber) return skalaUeber; var b = svg.clientWidth || 800; return vb ? vb.w / b : 0.02; }
  function grenzen() {
    var e = etage(), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    function nimm(x, y) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (e.bild) { nimm(0, 0); nimm(e.bildB * e.mpp, e.bildH * e.mpp); }
    e.raeume.forEach(function (r) { r.punkte.forEach(function (p) { nimm(p[0], p[1]); }); });
    e.teile.forEach(function (t) { nimm(t.x - t.w / 2, t.y - t.w / 2); nimm(t.x + t.w / 2, t.y + t.w / 2); });
    if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 14; y1 = 10; }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  /* Ausschnitt so wählen, dass alles zu sehen ist. Am Bildschirm bleibt ein Rand in Bildschirmpunkten frei: für die
     Maßlinien rund um den Plan und unten für die Zoom-Knöpfe und die Windrose (sie liegen über dem Plan und würden sonst
     die untere Maßlinie verdecken). Für den Druck (druck = true) gilt der feste Rand von 1 m, dort gibt es keine Knöpfe. */
  function einpassen(druck) {
    var g = grenzen(), bw = svg.clientWidth || 800, bh = svg.clientHeight || 500;
    if (druck) {
      var rand = 1, w = Math.max(4, g.x1 - g.x0) + 2 * rand, h = Math.max(4, g.y1 - g.y0) + 2 * rand;
      if (w / h < bw / bh) w = h * bw / bh; else h = w * bh / bw;
      vb = { x: (g.x0 + g.x1) / 2 - w / 2, y: (g.y0 + g.y1) / 2 - h / 2, w: w, h: h };
      return;
    }
    var wand = (etage().aussenwand || 0.3), gw = Math.max(4, g.x1 - g.x0) + 2 * wand, gh = Math.max(4, g.y1 - g.y0) + 2 * wand;
    var pl = 56, pr = 56, po = 52, pu = 56, br = $('g-buehne') ? $('g-buehne').getBoundingClientRect() : null;
    [$('g-zoom'), $('g-nord')].forEach(function (b) {
      if (!b || !br) return;
      var r = b.getBoundingClientRect();
      if (r.width && r.height && r.top > br.top) pu = Math.max(pu, br.bottom - r.top + 12);
    });
    if (bw - pl - pr < 80) { pl = pr = Math.max(10, (bw - 80) / 2); }
    if (bh - po - pu < 80) { po = 10; pu = Math.max(10, Math.min(pu, bh - 90)); }
    var k = Math.min((bw - pl - pr) / gw, (bh - po - pu) / gh);       /* Bildschirmpunkte je Meter */
    var w2 = bw / k, h2 = bh / k, cx = (g.x0 + g.x1) / 2, cy = (g.y0 + g.y1) / 2;
    var yMitte = po + (bh - po - pu) / 2;                              /* Bildhöhe, auf der die Planmitte liegen soll */
    vb = { x: cx - w2 / 2, y: cy - yMitte / k, w: w2, h: h2 };
  }
  function zoomen(f, cx, cy) {
    if (!vb) einpassen();
    var nw = Math.min(400, Math.max(1.5, vb.w * f)), k = nw / vb.w;
    if (cx == null) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
    vb = { x: cx - (cx - vb.x) * k, y: cy - (cy - vb.y) * k, w: nw, h: vb.h * k };
    zeichnen();
  }
  function seitenverhaeltnis() {
    if (!vb) return;
    var bw = svg.clientWidth, bh = svg.clientHeight;
    if (!bw || !bh) return;
    var h = vb.w * bh / bw;
    vb.y += (vb.h - h) / 2; vb.h = h;
  }

  /* ---------- Zeichnen ---------- */
  function schwerpunkt(p) {
    var a = 0, cx = 0, cy = 0;
    for (var i = 0; i < p.length; i++) {
      var q = p[i], r = p[(i + 1) % p.length], k = q[0] * r[1] - r[0] * q[1];
      a += k; cx += (q[0] + r[0]) * k; cy += (q[1] + r[1]) * k;
    }
    if (Math.abs(a) < 1e-9) {
      return [p.reduce(function (s, q) { return s + q[0]; }, 0) / p.length, p.reduce(function (s, q) { return s + q[1]; }, 0) / p.length];
    }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function flaeche(r) { return R.polygonFlaeche(r.punkte); }
  function el(name, attr, eltern) {
    var e = document.createElementNS(NS, name);
    Object.keys(attr || {}).forEach(function (k) { e.setAttribute(k, attr[k]); });
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function zeichnen() {
    if (!sichtbar || ansicht3d) return;
    if (!vb) einpassen();
    var fokusId = document.activeElement && svg.contains(document.activeElement) ? document.activeElement.getAttribute('data-id') : null;
    var e = etage(), s = px2m();
    nachfuehren(e);
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (e.bild) el('image', { href: e.bild, x: 0, y: 0, width: e.bildB * e.mpp, height: e.bildH * e.mpp, preserveAspectRatio: 'none', opacity: 0.85 }, svg);
    /* Raster: 1 m, bei großem Ausschnitt 5 m */
    var schritt = vb.w > 80 ? 5 : 1, gr = el('g', { 'aria-hidden': 'true' }, svg);
    for (var x = Math.floor(vb.x / schritt) * schritt; x <= vb.x + vb.w; x += schritt) el('line', { x1: x, y1: vb.y, x2: x, y2: vb.y + vb.h, class: 'raster-linie' + (x % (schritt * 5) === 0 ? ' meter' : '') }, gr);
    for (var y = Math.floor(vb.y / schritt) * schritt; y <= vb.y + vb.h; y += schritt) el('line', { x1: vb.x, y1: y, x2: vb.x + vb.w, y2: y, class: 'raster-linie' + (y % (schritt * 5) === 0 ? ' meter' : '') }, gr);

    e.raeume.forEach(function (r) {
      var g = el('g', { 'data-raum': r.id, 'data-id': r.id, tabindex: 0, role: 'button', 'aria-label': 'Raum ' + r.name + ', ' + qm(flaeche(r)) }, svg);
      el('polygon', { points: r.punkte.map(function (p) { return p[0] + ',' + p[1]; }).join(' '), class: 'raum art-' + r.art + (gewaehlt && gewaehlt.id === r.id ? ' gewaehlt' : '') }, g);
    });
    /* Wände aus den Räumen abgeleitet (nicht gespeichert); Klicks gehen durch auf die Räume */
    var wl = GEO.waende(e);
    if (wl.length) {
      var wg = el('g', { class: 'waende', 'aria-hidden': 'true' }, svg);
      wl.forEach(function (w) {
        var vl = GEO.eckenVerlaengerung(e, w), q = GEO.wandVieleck(w, vl);
        el('polygon', { points: q.map(function (p) { return p[0] + ',' + p[1]; }).join(' '), class: 'wand ' + w.typ, 'data-wand': w.typ }, wg);
      });
    }
    e.teile.forEach(function (t) {
      var a = ART[t.art], tf = istTuerFenster(t);
      var g = el('g', { 'data-teil': t.id, 'data-id': t.id, tabindex: 0, role: 'button', 'aria-label': a.name + (t.dreh && !tf ? ', gedreht ' + t.dreh + ' Grad' : '') + (tf && t.bindung ? ', ' + tr('anWand') : ''), transform: 'translate(' + t.x + ' ' + t.y + ') rotate(' + t.dreh + ')', class: 'teil ' + (a.form === 'wandweg' ? 'wandweg' : a.form === 'fenster' ? 'fenster' : a.gruppe) + (gewaehlt && gewaehlt.id === t.id ? ' gewaehlt' : '') + (markiert === t.id ? ' eingerastet' : '') }, svg);
      el('rect', { x: -t.w / 2, y: -t.d / 2, width: t.w, height: t.d, class: 'koerper', rx: Math.min(t.w, t.d) * 0.06 }, g);
      if (a.form === 'fenster') el('line', { x1: -t.w / 2, y1: 0, x2: t.w / 2, y2: 0, class: 'glas' }, g);
      if (a.form === 'bett') {
        var k = Math.min(0.5, t.w * 0.4), n = t.w > 1.2 ? 2 : 1;
        for (var i = 0; i < n; i++) el('rect', { x: -t.w / 2 + 0.08 + i * (t.w - 0.16) / n, y: -t.d / 2 + 0.08, width: (t.w - 0.16) / n - (n > 1 ? 0.06 : 0), height: Math.min(0.35, t.d * 0.2), class: 'kissen', rx: 0.05 }, g);
        void k;
      }
      if (a.form === 'treppe' || a.form === 'treppeoben') {
        /* Stufenlinien quer zur Laufrichtung (etwa 24 cm Auftritt), Pfeil nach oben = Laufrichtung; oben im Obergeschoss gestrichelt */
        var nSt = Math.max(2, Math.round(t.d / 0.24));
        for (var si = 1; si < nSt; si++) el('line', { x1: -t.w / 2, x2: t.w / 2, y1: -t.d / 2 + si * t.d / nSt, y2: -t.d / 2 + si * t.d / nSt, class: 'stufe' }, g);
        el('path', { d: 'M 0 ' + (t.d / 2 - 0.25) + ' L 0 ' + (-t.d / 2 + 0.3) + ' M -0.14 ' + (-t.d / 2 + 0.52) + ' L 0 ' + (-t.d / 2 + 0.3) + ' L 0.14 ' + (-t.d / 2 + 0.52), class: 'stufe pfeil' }, g);
        if (a.form === 'treppeoben') g.setAttribute('class', g.getAttribute('class') + ' oben');
      }
      if (a.form === 'tuer') el('path', { d: 'M ' + (-t.w / 2) + ' ' + (t.d / 2) + ' A ' + t.w + ' ' + t.w + ' 0 0 0 ' + (t.w / 2) + ' ' + (t.d / 2 - t.w), class: 'hilfslinie', style: 'stroke-dasharray:4 4;stroke-width:1.5' }, g);
      var fs = 11 * s, kurz = a.kurz || a.name;
      if (t.w > kurz.length * fs * 0.55 && t.d > fs * 1.4) {
        var tx = el('text', { x: 0, y: a.form === 'bett' ? t.d * 0.12 : 0, 'font-size': fs, transform: t.dreh % 180 ? 'rotate(' + (-t.dreh) + ')' : (t.dreh === 180 ? 'rotate(180)' : '') }, g);
        tx.textContent = kurz;
      }
    });
    /* Freiflächen vor Möbeln (Knopf "Freiflächen zeigen", grundriss_regeln.js) */
    if (window.GRUNDRISS_REGELN && window.GRUNDRISS_REGELN.zeichneFrei) window.GRUNDRISS_REGELN.zeichneFrei(e, svg, s);
    /* Raumnamen über den Möbeln; Konturbreite in Metern, weil im Plan eine Einheit ein Meter ist */
    e.raeume.forEach(function (r) {
      var c = schwerpunkt(r.punkte), t = el('text', { x: c[0], y: c[1], class: 'raum-text', 'font-size': 14 * s, 'stroke-width': 3 * s }, svg);
      var a = el('tspan', { x: c[0], dy: 0 }, t); a.textContent = r.name;
      var b = el('tspan', { x: c[0], dy: 17 * s, class: 'leise', 'font-size': 13 * s }, t); b.textContent = qm(flaeche(r));
    });
    /* Griffe am gewählten Raum */
    if (gewaehlt && gewaehlt.typ === 'raum' && modus === 'auswahl') {
      var rg = findeRaum(gewaehlt.id);
      if (rg) rg.punkte.forEach(function (p, i) { el('circle', { cx: p[0], cy: p[1], r: 7 * s, class: 'griff', 'data-griff': i }, svg); });
    }
    /* Breiten-Griffe an einem gewählten Fenster oder einer Tür an der Wand: am Ende ziehen = breiter oder schmaler */
    if (gewaehlt && gewaehlt.typ === 'teil' && modus === 'auswahl') {
      var tg = findeTeil(gewaehlt.id);
      if (tg && istTuerFenster(tg) && tg.bindung) {
        var ca = Math.cos(tg.dreh * Math.PI / 180), sa = Math.sin(tg.dreh * Math.PI / 180);
        [-1, 1].forEach(function (sd) {
          el('circle', { cx: tg.x + sd * ca * tg.w / 2, cy: tg.y + sd * sa * tg.w / 2, r: 7 * s, class: 'griff breite', 'data-breite': sd }, svg);
        });
      }
    }
    if (massAn) masseZeichnen(e, s);
    /* Hilfslinien beim Zeichnen */
    if (ziehen && ziehen.typ === 'rechteck' && ziehen.b) {
      var a0 = ziehen.a, b0 = ziehen.b;
      el('rect', { x: Math.min(a0[0], b0[0]), y: Math.min(a0[1], b0[1]), width: Math.abs(b0[0] - a0[0]), height: Math.abs(b0[1] - a0[1]), class: 'hilfsflaeche' }, svg);
      var mt = el('text', { x: (a0[0] + b0[0]) / 2, y: (a0[1] + b0[1]) / 2, class: 'raum-text', 'font-size': 14 * s, 'stroke-width': 3 * s }, svg);
      mt.textContent = fmt1.format(Math.abs(b0[0] - a0[0])) + ' × ' + fmt1.format(Math.abs(b0[1] - a0[1])) + ' m';
    }
    if (modus === 'ecken' && entwurf.length) {
      var pts = entwurf.concat(maus ? [maus] : []);
      el('polyline', { points: pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '), class: 'hilfslinie' }, svg);
      entwurf.forEach(function (p, i) { el('circle', { cx: p[0], cy: p[1], r: (i === 0 ? 8 : 5) * s, class: 'hilfspunkt' }, svg); });
    }
    if (massPunkte.length) {
      var mp = massPunkte.concat(modus === 'massstab' && maus && massPunkte.length === 1 ? [maus] : []);
      if (mp.length > 1) el('line', { x1: mp[0][0], y1: mp[0][1], x2: mp[1][0], y2: mp[1][1], class: 'hilfslinie' }, svg);
      massPunkte.forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 6 * s, class: 'hilfspunkt' }, svg); });
    }
    svg.setAttribute('class', 'planzeichnung' + (modus === 'auswahl' ? '' : ' zeichnen'));
    if (fokusId) { var f = svg.querySelector('[data-id="' + fokusId + '"]'); if (f) f.focus({ preventScroll: true }); }
  }

  /* ---------- Maßlinien ---------- */
  function sprachCode() { return window.TXT ? window.TXT.lang() : 'de'; }
  function zahl2(x, stellen) {
    var loc = { de: 'de-DE', en: 'en-GB', ru: 'ru-RU' }[sprachCode()] || 'de-DE';
    return new Intl.NumberFormat(loc, { minimumFractionDigits: stellen, maximumFractionDigits: stellen }).format(x);
  }
  function massText(x) { return zahl2(x, 2) + ' ' + tr('einheitM'); }
  /* Gedrehtes Rechteck (Mitte, halbe Seiten, Drehwinkel) und Schnitt zweier Rechtecke (Trennachsen-Verfahren) */
  function obbVon(x, y, hw, hh, grad) { var r = (grad || 0) * Math.PI / 180; return { x: x, y: y, hw: hw, hh: hh, c: Math.cos(r), s: Math.sin(r) }; }
  function obbSchnitt(A, B) {
    var ax = [[A.c, A.s], [-A.s, A.c]], bx = [[B.c, B.s], [-B.s, B.c]], d = [B.x - A.x, B.y - A.y], ach = ax.concat(bx);
    function dot(p, q) { return p[0] * q[0] + p[1] * q[1]; }
    for (var i = 0; i < 4; i++) {
      var u = ach[i];
      var ra = A.hw * Math.abs(dot(u, ax[0])) + A.hh * Math.abs(dot(u, ax[1]));
      var rb = B.hw * Math.abs(dot(u, bx[0])) + B.hh * Math.abs(dot(u, bx[1]));
      if (Math.abs(dot(d, u)) > ra + rb) return false;
    }
    return true;
  }
  /* Rechteck eines Bedienelements (Zoom-Knöpfe, Windrose) in Plan-Koordinaten; nur am Bildschirm, nicht beim Drucken */
  function bildschirmHindernis(elm) {
    if (!elm || skalaUeber) return null;
    var b = elm.getBoundingClientRect(), m = svg.getScreenCTM();
    if (!b.width || !b.height || !m) return null;
    var inv = m.inverse(), p = svg.createSVGPoint(), q = svg.createSVGPoint();
    p.x = b.left - 6; p.y = b.top - 6; q.x = b.right + 6; q.y = b.bottom + 6;
    p = p.matrixTransform(inv); q = q.matrixTransform(inv);
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, hw: Math.abs(q.x - p.x) / 2, hh: Math.abs(q.y - p.y) / 2, c: 1, s: 0 };
  }
  /* Maßlinien (Knopf „Maße zeigen“). Jede Raumkante wird in Stücke geteilt (GEO.massstuecke, jedes Stück einmal):
     - freies Stück (draußen): Maßlinie mit Zahl außerhalb der Umrisse; liegt dort ein Raum im Weg, weiter hinaus,
       sonst die Zahl auf der Außenwand;
     - geteiltes Stück (Innenwand, Wand zum Balkon): die Zahl steht auf der Wand, bei Bedarf entlang der Wand
       verschoben, mit Hintergrundrand.
     Eine Zahl wird nie über ein Möbelstück, ein Fenster, eine Tür, die Zoom-Knöpfe, die Windrose oder eine andere Zahl
     gesetzt; findet sich kein freier Platz, bleibt sie weg. Dazu die Breite jedes Fensters und jeder Tür.
     Textgröße in Bildschirmpunkten (s = Meter je Punkt); Stücke, die auf dem Bildschirm kürzer als 40 Punkte sind
     oder kürzer als ihre Zahl, bleiben ohne Zahl. */
  function masseZeichnen(e, s) {
    var g = el('g', { class: 'masse', 'aria-hidden': 'true' }, svg);
    var fs = 13 * s, pad = 2 * s, dA = e.aussenwand || 0.3;
    var cache = {}, platziert = [];
    var teilO = e.teile.map(function (t) { return { id: t.id, o: obbVon(t.x, t.y, t.w / 2, t.d / 2, t.dreh) }; });
    var sperren = [bildschirmHindernis($('g-zoom')), bildschirmHindernis($('g-nord'))].filter(function (x) { return !!x; });
    function winkel(u) { var gr = Math.atan2(u[1], u[0]) * 180 / Math.PI; if (gr > 90) gr -= 180; if (gr <= -90) gr += 180; return Math.abs(gr) < 0.5 ? 0 : gr; }
    function messen(text) {
      if (cache[text]) return cache[text];
      var w = text.length * 0.6 * fs, h = 1.25 * fs;
      try {
        var t = el('text', { x: 0, y: 0, 'font-size': fs, class: 'masszahl' }, g); t.textContent = text;
        var b = t.getBBox(); g.removeChild(t);
        if (b.width > 0 && b.height > 0) { w = b.width; h = b.height; }
      } catch (err) { /* ohne Messung gilt die Schätzung */ }
      cache[text] = { w: w, h: h };
      return cache[text];
    }
    function frei(o, eigen) {
      var i;
      for (i = 0; i < teilO.length; i++) if (teilO[i].id !== eigen && obbSchnitt(o, teilO[i].o)) return false;
      for (i = 0; i < sperren.length; i++) if (obbSchnitt(o, sperren[i])) return false;
      for (i = 0; i < platziert.length; i++) if (obbSchnitt(o, platziert[i])) return false;
      return true;
    }
    /* erster freier Platz aus der Liste [x, y, Grad]; merkt ihn sich als belegt */
    function finde(text, kand, eigen) {
      var m = messen(text);
      for (var i = 0; i < kand.length; i++) {
        var o = obbVon(kand[i][0], kand[i][1], m.w / 2 + pad, m.h / 2 + pad / 2, kand[i][2]);
        if (frei(o, eigen)) { platziert.push(o); return kand[i]; }
      }
      return null;
    }
    function beschriften(k, text, attr) {
      var a = Object.assign({ x: k[0], y: k[1], 'font-size': fs, 'stroke-width': 3.5 * s, class: 'masszahl' }, attr || {});
      if (k[2]) a.transform = 'rotate(' + k[2] + ' ' + k[0] + ' ' + k[1] + ')';
      el('text', a, g).textContent = text;
    }
    /* Plätze entlang einer Strecke: Mitte, dann abwechselnd zu beiden Seiten (Meter ab der Mitte), nur innerhalb der Strecke */
    function entlang(p, u, L, halb, grad) {
      var res = [], schritt = Math.max(0.1, halb * 0.5), mx = L / 2 - halb - 2 * s;
      for (var d = 0; d <= mx + 1e-9; d += schritt) {
        res.push([p[0] + u[0] * d, p[1] + u[1] * d, grad]);
        if (d > 0) res.push([p[0] - u[0] * d, p[1] - u[1] * d, grad]);
      }
      return res;
    }
    GEO.massstuecke(e).forEach(function (m) {
      var text = massText(m.L), mb = messen(text), grad = winkel(m.u), halb = mb.w / 2 + pad;
      if (m.L < 0.3 || m.L / s < Math.max(40, mb.w / s + 8)) return;
      var attr = { 'data-mass': m.raum + ':' + m.kante + (m.n > 1 ? ':' + m.i : ''), 'data-laenge': m.L.toFixed(3) };
      var n = [m.nx, m.ny], mid = [(m.a[0] + m.b[0]) / 2, (m.a[1] + m.b[1]) / 2], k;
      if (m.geteilt) {                          /* auf der Wand */
        k = finde(text, entlang(m.mitte, m.u, m.L, halb, grad));
        if (k) { attr['data-geteilt'] = '1'; beschriften(k, text, attr); }
        return;
      }
      var basis = (m.balkon ? 0.1 : dA) + 24 * s;
      for (var i = 0; i < 3; i++) {             /* draußen: Maßlinie, nötigenfalls weiter hinaus */
        var off = basis + i * 22 * s;
        var ax = m.a[0] + n[0] * off, ay = m.a[1] + n[1] * off, bx = m.b[0] + n[0] * off, by = m.b[1] + n[1] * off;
        if (!GEO.streckeFrei(e, [ax, ay], [bx, by], 0.04)) continue;
        k = finde(text, entlang([(ax + bx) / 2, (ay + by) / 2], m.u, m.L, halb, grad));
        if (!k) continue;
        el('line', { x1: ax, y1: ay, x2: bx, y2: by, class: 'masslinie', 'data-haupt': '1' }, g);
        [[ax, ay], [bx, by]].forEach(function (q) { el('line', { x1: q[0] - n[0] * 5 * s, y1: q[1] - n[1] * 5 * s, x2: q[0] + n[0] * 5 * s, y2: q[1] + n[1] * 5 * s, class: 'masslinie' }, g); });
        beschriften(k, text, attr);
        return;
      }
      /* kein Platz draußen: Zahl auf die Außenwand (Wohnraum) bzw. auf die Kante (Balkon) */
      var wm = [mid[0] + n[0] * (m.balkon ? 0 : dA / 2), mid[1] + n[1] * (m.balkon ? 0 : dA / 2)];
      k = finde(text, entlang(wm, m.u, m.L, halb, grad));
      if (k) beschriften(k, text, attr);
    });
    e.teile.forEach(function (t) {
      if (!istTuerFenster(t)) return;
      var c = Math.cos(t.dreh * Math.PI / 180), sn = Math.sin(t.dreh * Math.PI / 180), text = massText(t.w);
      /* Fenster: im Raum (lokal +y, dort liegt keine Maßlinie der Kante); Tür: gegenüber der Schwenkseite (lokal -y);
         ist dort kein Platz, die andere Seite, dann weiter weg */
      var sg0 = ART[t.art].form === 'fenster' ? 1 : -1, kand = [];
      [1, 2.4].forEach(function (f) { [sg0, -sg0].forEach(function (sg) {
        var off = t.d / 2 + 9 * s * f;
        kand.push([t.x - sn * off * sg, t.y + c * off * sg, winkel([c, sn])]);
      }); });
      var k = finde(text, kand, t.id);
      if (k) beschriften(k, text, { 'data-mass-teil': t.id, 'data-breite': t.w.toFixed(3) });
    });
  }

  function findeRaum(id) { return etage().raeume.filter(function (r) { return r.id === id; })[0]; }
  function findeTeil(id) { return etage().teile.filter(function (t) { return t.id === id; })[0]; }

  /* ---------- Maus und Finger ---------- */
  function imPlan(ev) {
    var m = svg.getScreenCTM();
    if (!m) return [0, 0];
    var p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    p = p.matrixTransform(m.inverse());
    return [p.x, p.y];
  }
  /* Einrasten an vorhandenen Raumecken, sonst auf 5 cm */
  function einrasten(p, ohneId) {
    var tol = 10 * px2m(), best = null, bd = tol;
    etage().raeume.forEach(function (r) {
      if (r.id === ohneId) return;
      r.punkte.forEach(function (q) { var d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } });
    });
    return best ? [best[0], best[1]] : [rund(p[0], 0.05), rund(p[1], 0.05)];
  }
  svg.addEventListener('pointerdown', function (ev) {
    if (ev.button > 0) return;
    var p = imPlan(ev);
    if (modus === 'rechteck') {
      ziehen = { typ: 'rechteck', a: einrasten(p), b: null };
    } else if (modus === 'ecken') {
      var q = einrasten(p);
      if (entwurf.length >= 3 && Math.hypot(q[0] - entwurf[0][0], q[1] - entwurf[0][1]) < 12 * px2m()) { eckenFertig(); return; }
      entwurf.push(q); tipp(); zeichnen(); return;
    } else if (modus === 'massstab') {
      massPunkte.push([p[0], p[1]]);
      if (massPunkte.length === 2) { modusSetzen('auswahl'); $('g-mass-frage').hidden = false; $('g-mass-laenge').focus(); }
      zeichnen(); return;
    } else {
      var griff = ev.target.closest('[data-griff]'), teil = ev.target.closest('[data-teil]'), raum = ev.target.closest('[data-raum]'), bgriff = ev.target.closest('[data-breite]');
      if (bgriff && gewaehlt && gewaehlt.typ === 'teil') {
        ziehen = { typ: 'breite', id: gewaehlt.id, seite: Number(bgriff.getAttribute('data-breite')) };
      } else if (griff && gewaehlt && gewaehlt.typ === 'raum') {
        ziehen = { typ: 'griff', id: gewaehlt.id, i: Number(griff.getAttribute('data-griff')) };
      } else if (teil) {
        var t = findeTeil(teil.getAttribute('data-teil'));
        waehle('teil', t.id);
        ziehen = { typ: 'teil', id: t.id, dx: t.x - p[0], dy: t.y - p[1], bewegt: false };
      } else if (raum) {
        var r = findeRaum(raum.getAttribute('data-raum'));
        waehle('raum', r.id);
        ziehen = { typ: 'raum', id: r.id, start: p, alt: r.punkte.map(function (q) { return q.slice(); }), bewegt: false };
      } else {
        if (gewaehlt) waehle(null);
        ziehen = { typ: 'schieben', cx: ev.clientX, cy: ev.clientY, vb: { x: vb.x, y: vb.y, w: vb.w, h: vb.h } };
        svg.classList.add('schieben');
      }
    }
    try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
    ev.preventDefault();
  });
  svg.addEventListener('pointermove', function (ev) {
    var p = imPlan(ev);
    if (!ziehen) {
      if (modus === 'ecken' && entwurf.length || modus === 'massstab' && massPunkte.length === 1) { maus = modus === 'ecken' ? einrasten(p) : p; zeichnen(); }
      return;
    }
    if (ziehen.typ === 'rechteck') { ziehen.b = einrasten(p); zeichnen(); }
    else if (ziehen.typ === 'schieben') {
      var k = px2m();
      vb.x = ziehen.vb.x - (ev.clientX - ziehen.cx) * k; vb.y = ziehen.vb.y - (ev.clientY - ziehen.cy) * k;
      svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    } else if (ziehen.typ === 'teil') {
      var t = findeTeil(ziehen.id);
      if (istTuerFenster(t)) { anWand(t, [p[0] + ziehen.dx, p[1] + ziehen.dy]); }
      else { t.x = rund(p[0] + ziehen.dx, 0.1); t.y = rund(p[1] + ziehen.dy, 0.1); }
      ziehen.bewegt = true; zeichnen();
    } else if (ziehen.typ === 'breite') {
      var tb = findeTeil(ziehen.id);
      if (tb && tb.bindung) {
        /* festes Ende gegenüber, bewegtes Ende folgt der Maus entlang der Kante */
        var ux = Math.cos(tb.dreh * Math.PI / 180), uy = Math.sin(tb.dreh * Math.PI / 180);
        var sm = (p[0] - tb.x) * ux + (p[1] - tb.y) * uy;           /* Mausstelle entlang des Teils, 0 = Mitte */
        var fest = -ziehen.seite * tb.w / 2;
        var neuB = Math.min(3, Math.max(0.3, rund(Math.abs(sm * ziehen.seite - fest * ziehen.seite), 0.05)));
        var neueMitte = (fest + (fest + ziehen.seite * neuB)) / 2;   /* verschiebt die Mitte längs der Kante */
        var raum = raumIn(etage(), tb.bindung.raum), kk = raum && GEO.kanten(raum)[tb.bindung.kante];
        if (kk) {
          var sMitte = (tb.x - kk.a[0]) * kk.u[0] + (tb.y - kk.a[1]) * kk.u[1];   /* Mitte entlang der Kante (wandnormal ignoriert) */
          var dirKante = kk.u[0] * ux + kk.u[1] * uy >= 0 ? 1 : -1;
          tb.w = neuB;
          tb.bindung.t = Math.min(1, Math.max(0, (sMitte + dirKante * neueMitte) / kk.L));
          ziehen.bewegt = true; zeichnen();
        }
      }
    } else if (ziehen.typ === 'raum') {
      var r = findeRaum(ziehen.id), dx = rund(p[0] - ziehen.start[0], 0.05), dy = rund(p[1] - ziehen.start[1], 0.05);
      r.punkte = ziehen.alt.map(function (q) { return [q[0] + dx, q[1] + dy]; }); ziehen.bewegt = dx || dy; zeichnen();
    } else if (ziehen.typ === 'griff') {
      var rr = findeRaum(ziehen.id); rr.punkte[ziehen.i] = einrasten(p, rr.id); zeichnen();
    }
  });
  function loslassen() {
    if (!ziehen) return;
    var z = ziehen; ziehen = null;
    svg.classList.remove('schieben');
    if (z.typ === 'rechteck' && z.b) {
      var a = z.a, b = z.b;
      if (Math.abs(b[0] - a[0]) >= 0.3 && Math.abs(b[1] - a[1]) >= 0.3) {
        var x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
        neuerRaum([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
        return;
      }
    }
    if (z.typ === 'teil' || z.typ === 'breite') { var tz = findeTeil(z.id); if (tz && istTuerFenster(tz) && z.bewegt) rueckmeldungWand(tz); }
    if (z.typ !== 'schieben') geaendert(); else zeichnen();
  }
  /* Freundliche Rückmeldung nach dem Setzen: kurze Hervorhebung am Teil und ein Satz */
  var markTimer = null;
  function rueckmeldungWand(t) {
    clearTimeout(markTimer);
    if (gewaehlt && gewaehlt.id === t.id && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName)) auswahlZeigen();  /* Seitenfeld: "sitzt an der Wand" */
    var raum = t.bindung && raumIn(etage(), t.bindung.raum);
    if (raum) {
      markiert = t.id;
      markTimer = setTimeout(function () { markiert = null; zeichnen(); }, 1400);
      meldung(tr('eingerastet', { teil: teilName(t), raum: raum.name }));
    } else {
      markiert = null;
      meldung(tr('frei', { teil: teilName(t) }));
    }
  }
  svg.addEventListener('pointerup', loslassen);
  svg.addEventListener('pointercancel', loslassen);
  svg.addEventListener('dblclick', function () { if (modus === 'ecken') eckenFertig(); });
  svg.addEventListener('wheel', function (ev) {
    if (!ev.ctrlKey) return; /* ohne Strg scrollt die Seite normal */
    ev.preventDefault();
    var p = imPlan(ev);
    zoomen(ev.deltaY > 0 ? 1.15 : 1 / 1.15, p[0], p[1]);
  }, { passive: false });
  svg.addEventListener('focusin', function (ev) {
    var g = ev.target.closest('[data-id]');
    if (!g) return;
    var id = g.getAttribute('data-id');
    if (!gewaehlt || gewaehlt.id !== id) waehle(g.hasAttribute('data-teil') ? 'teil' : 'raum', id);
  });

  /* ---------- Tastatur ---------- */
  document.addEventListener('keydown', function (ev) {
    if (!sichtbar || ansicht3d) return;
    var imFeld = /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName);
    if (ev.key === 'Escape') {
      if (modus !== 'auswahl' || entwurf.length || massPunkte.length) { entwurf = []; massPunkte = []; $('g-mass-frage').hidden = true; modusSetzen('auswahl'); zeichnen(); ev.preventDefault(); }
      return;
    }
    if (imFeld) return;
    if (ev.key === 'Enter' && modus === 'ecken') { eckenFertig(); ev.preventDefault(); return; }
    if (!svg.contains(document.activeElement) || !gewaehlt) return;
    var schritt = ev.shiftKey ? 0.5 : 0.1, dx = 0, dy = 0;
    if (ev.key === 'ArrowLeft') dx = -schritt; else if (ev.key === 'ArrowRight') dx = schritt;
    else if (ev.key === 'ArrowUp') dy = -schritt; else if (ev.key === 'ArrowDown') dy = schritt;
    if (dx || dy) {
      if (gewaehlt.typ === 'teil') {
        var t = findeTeil(gewaehlt.id);
        if (istTuerFenster(t)) { anWand(t, [t.x + dx, t.y + dy]); rueckmeldungWand(t); }
        else { t.x = rund(t.x + dx, 0.05); t.y = rund(t.y + dy, 0.05); }
      }
      else { var r = findeRaum(gewaehlt.id); r.punkte = r.punkte.map(function (q) { return [rund(q[0] + dx, 0.05), rund(q[1] + dy, 0.05)]; }); }
      geaendert(); ev.preventDefault(); return;
    }
    if ((ev.key === 'r' || ev.key === 'R') && gewaehlt.typ === 'teil') { drehen(); ev.preventDefault(); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { loeschen(); ev.preventDefault(); }
  });

  /* ---------- Aktionen ---------- */
  function geaendert() { nachfuehrenAlle(); speichern(); zeichnen(); auswerten(); }
  function raumNummer() {
    var n = 0; plan.etagen.forEach(function (e) { n += e.raeume.length; }); return n + 1;
  }
  function neuerRaum(punkte) {
    var r = { id: neueId('r'), name: 'Raum ' + raumNummer(), art: 'voll', punkte: punkte, teil12: 0, teil0: 0, balkon: 25, separat: false };
    etage().raeume.push(r);
    gewaehlt = { typ: 'raum', id: r.id };
    geaendert(); auswahlZeigen();
    meldung('Raum angelegt (' + qm(flaeche(r)) + '). Rechts können Sie ihm einen Namen und eine Art geben.');
  }
  function eckenFertig() {
    if (entwurf.length < 3) { tipp('Mindestens drei Ecken setzen, dann schließen.'); return; }
    var p = entwurf; entwurf = []; maus = null;
    neuerRaum(p); tipp();
  }
  function waehle(typ, id) {
    gewaehlt = typ ? { typ: typ, id: id } : null;
    zeichnen(); auswahlZeigen();
  }
  function drehen() {
    var t = gewaehlt && gewaehlt.typ === 'teil' && findeTeil(gewaehlt.id);
    if (!t) return;
    /* an der Wand: nur die Schwenkseite wechseln (um 180 Grad), sonst Vierteldrehung */
    t.dreh = Math.round(((t.dreh + (istTuerFenster(t) && t.bindung ? 180 : 90)) % 360) * 100) / 100; geaendert(); auswahlZeigen();
  }
  function loeschen() {
    if (!gewaehlt) return;
    var e = etage(), name;
    if (gewaehlt.typ === 'teil') { var t = findeTeil(gewaehlt.id); name = ART[t.art].name; e.teile = e.teile.filter(function (x) { return x.id !== gewaehlt.id; }); }
    else {
      var r = findeRaum(gewaehlt.id); name = r.name; e.raeume = e.raeume.filter(function (x) { return x.id !== gewaehlt.id; });
      /* Fenster und Türen dieses Raums bleiben stehen, sind aber nicht mehr an einer Wand befestigt (mit Grund) */
      var frei = 0;
      e.teile.forEach(function (t) { if (t.bindung && t.bindung.raum === r.id) { loseBindung(t, 'geloescht|' + r.name); frei++; } });
      if (frei) name += '\u0000' + frei;
    }
    gewaehlt = null;
    geaendert(); auswahlZeigen();
    var np = String(name).split('\u0000');
    meldung('„' + np[0] + '“ gelöscht.' + (np[1] ? ' ' + tr('loeschFrei', { n: np[1], name: np[0] }) : ''));
    svg.focus();
  }
  /* Passende Kante eines gewählten Raums: Fenster = längste Außenkante, Tür = längste gemeinsame Kante (sonst längste) */
  function kanteFuer(e, raum, form) {
    var ks = GEO.kanten(raum).filter(function (k) { return !k.leer; }), wl = GEO.waende(e);
    function typ(k) {
      var m = wl.filter(function (w) { return w.raum === raum.id && w.kante === k.i; });
      var innen = m.some(function (w) { return w.typ === 'innen'; }), aussen = m.some(function (w) { return w.typ === 'aussen'; });
      return { innen: innen, aussen: aussen };
    }
    var wunschTyp = form === 'fenster' ? 'aussen' : 'innen';
    var passend = ks.filter(function (k) { return typ(k)[wunschTyp]; });
    var pool = passend.length ? passend : ks;
    if (!pool.length) return null;
    pool.sort(function (a, b) { return b.L - a.L; });
    return { raum: raum, kante: pool[0] };
  }
  function teilHinzu(artId) {
    var a = ART[artId], e = etage(), x, y;
    var r = gewaehlt && gewaehlt.typ === 'raum' && findeRaum(gewaehlt.id);
    if (r) { var c = schwerpunkt(r.punkte); x = c[0]; y = c[1]; }
    else { if (!vb) einpassen(); x = vb.x + vb.w / 2; y = vb.y + vb.h / 2; }
    var t = { id: neueId('t'), art: artId, x: rund(x, 0.1), y: rund(y, 0.1), w: a.breite / 100, d: a.tiefe / 100, dreh: 0 };
    var wandMeld = null;
    if (a.form === 'tuer' || a.form === 'fenster') {
      t.hoehe = a.hoehe / 100; t.bruestung = a.form === 'fenster' ? 0.9 : 0; t.bindung = null; t.bindungGrund = '';
      /* Gleich an eine Wand setzen (sonst läge das Teil mitten im Raum, außerhalb der 40 cm): in den gewählten Raum,
         sonst an die Kante, die der Bildmitte am nächsten ist. Fenster bevorzugt an eine Außenkante, Türen an eine gemeinsame. */
      var ziel = null;
      if (r) ziel = kanteFuer(e, r, a.form);
      else { var nk = GEO.naechsteKante(e, [x, y], 1e9, null); if (nk) { var rr = raumIn(e, nk.raum), ek = GEO.kanten(rr)[nk.kante]; ziel = { raum: rr, kante: ek }; } }
      if (ziel) {
        var L = ziel.kante.L, pos = 0.5, versuche = 0;
        /* nicht auf ein Teil legen, das dort schon sitzt */
        while (versuche++ < 8 && e.teile.some(function (o) {
          return o.bindung && o.bindung.raum === ziel.raum.id && o.bindung.kante === ziel.kante.i && Math.abs(o.bindung.t - pos) * L < (o.w + t.w) / 2 + 0.05;
        })) { pos += (t.w + 0.2) / L; if (pos > 1 - t.w / 2 / L) { pos = 0.5; break; } }
        var wunsch = [ziel.kante.a[0] + ziel.kante.u[0] * L * pos, ziel.kante.a[1] + ziel.kante.u[1] * L * pos];
        anWand(t, wunsch, 0.4);
      }
      wandMeld = t.bindung ? 'ja' : 'nein';
    }
    e.teile.push(t);
    gewaehlt = { typ: 'teil', id: t.id };
    geaendert(); auswahlZeigen();
    if (wandMeld === 'ja') { rueckmeldungWand(t); ersthinweisWand(); }
    else if (wandMeld === 'nein') meldung(tr('keinRaum'));
    var g = svg.querySelector('[data-id="' + t.id + '"]'); if (g) g.focus({ preventScroll: true });
  }

  /* ---------- Modus, Schritte, Tipps ---------- */
  function tipp(text) {
    var t = text;
    if (!t) {
      if (modus === 'rechteck') t = 'Drücken und ziehen, um einen rechteckigen Raum zu zeichnen.';
      else if (modus === 'ecken') t = entwurf.length ? entwurf.length + ' Ecken gesetzt. Auf den ersten Punkt klicken oder Enter drückt den Raum zu.' : 'Klicken Sie die erste Ecke des Raums an.';
      else if (modus === 'massstab') t = massPunkte.length ? 'Jetzt das Ende der Strecke anklicken.' : 'Klicken Sie den Anfang einer Strecke an, deren Länge Sie kennen.';
      else t = '';
    }
    $('g-tipp').textContent = t;
  }
  function modusSetzen(m) {
    modus = m;
    if (m !== 'ecken') { entwurf = []; maus = null; }
    document.querySelectorAll('[data-gmodus]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gmodus') === m ? 'true' : 'false'); });
    tipp(); zeichnen();
  }
  function schrittZeigen(n) {
    n = String(n);
    document.querySelectorAll('#g-schritte button').forEach(function (b) {
      if (b.getAttribute('data-gschritt') === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-gpanel]').forEach(function (p) { p.hidden = p.getAttribute('data-gpanel') !== n; });
    if (n === '2') modusSetzen(etage().raeume.length ? 'auswahl' : 'rechteck');
    else if (modus !== 'auswahl') modusSetzen('auswahl');
  }
  document.querySelectorAll('#g-schritte button').forEach(function (b) {
    b.addEventListener('click', function () { schrittZeigen(b.getAttribute('data-gschritt')); });
  });
  document.querySelectorAll('[data-gmodus]').forEach(function (b) {
    b.addEventListener('click', function () { modusSetzen(b.getAttribute('data-gmodus')); });
  });
  $('g-zur-liste').addEventListener('click', function () { $('g-kosten-karte').scrollIntoView({ block: 'start' }); var h = $('g-kosten-karte').querySelector('h3'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); });

  /* ---------- Etagen ---------- */
  function etagenZeigen() {
    var box = $('g-etagen');
    box.innerHTML = '';
    plan.etagen.forEach(function (e, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = e.name;
      b.setAttribute('aria-pressed', i === plan.aktiv ? 'true' : 'false');
      b.addEventListener('click', function () { plan.aktiv = i; gewaehlt = null; massPunkte = []; entwurf = []; vb = null; speichern(); allesZeigen(); });
      box.appendChild(b);
      if (i === plan.aktiv && plan.etagen.length > 1) {
        var x = document.createElement('button');
        x.type = 'button'; x.className = 'chip klein etage-weg'; x.textContent = '×';
        x.setAttribute('aria-label', 'Etage „' + e.name + '“ löschen');
        x.title = 'Diese Etage löschen';
        x.addEventListener('click', function () { etageLoeschen(x, 'Wirklich löschen?'); });
        x.addEventListener('blur', function () { if (etageWegBestaetigt === x) { etageWegBestaetigt = null; x.textContent = '×'; } });
        box.appendChild(x);
      }
    });
    var e = etage();
    $('g-etage-name').value = e.name;
    $('g-wandhoehe').value = fmt1.format(e.hoehe).replace(/,0$/, ',0');
    $('g-wandhoehe-f').textContent = ''; $('g-wandhoehe').removeAttribute('aria-invalid');
    wandHinweisZeigen();
    wandFelderZeigen();
    $('g-etage-weg').disabled = plan.etagen.length < 2;
    $('g-bild-weg').disabled = !e.bild;
    $('g-mass-start').disabled = !e.bild;
    $('g-mass-stand').textContent = !e.bild ? 'Ohne Bild ist der Maßstab fest: ein Kästchen = 1 m.' :
      e.massstab ? 'Maßstab festgelegt. Sie können ihn jederzeit neu festlegen; gezeichnete Räume wandern mit.' :
        'Noch kein Maßstab: Das Bild ist vorläufig 15 m breit angenommen. Flächen stimmen erst nach dem Festlegen.';
  }
  $('g-etage-neu').addEventListener('click', function () {
    var namen = ['Erdgeschoss', 'Obergeschoss', 'Dachgeschoss', 'Keller', '2. Obergeschoss'];
    var frei = namen.filter(function (n) { return !plan.etagen.some(function (e) { return e.name === n; }); })[0] || ('Etage ' + (plan.etagen.length + 1));
    plan.etagen.push(neueEtage(frei, plan.wandhoehe)); plan.aktiv = plan.etagen.length - 1; gewaehlt = null; vb = null;
    speichern(); allesZeigen(); schrittZeigen(1);
    meldung('Etage „' + frei + '“ angelegt. Laden Sie ihr Grundrissbild oder zeichnen Sie direkt.');
  });
  $('g-etage-name').addEventListener('input', function () {
    etage().name = this.value.trim().slice(0, 40) || 'Etage'; speichern();
    var b = $('g-etagen').children[plan.aktiv]; if (b) b.textContent = etage().name;
    auswerten();
  });
  $('g-wandhoehe').addEventListener('input', function () {
    var v = zahl(this.value), f = $('g-wandhoehe-f');
    if (v == null || v < 1.8 || v > 6) { f.textContent = tr('hoeheFehler'); this.setAttribute('aria-invalid', 'true'); return; }
    f.textContent = ''; this.removeAttribute('aria-invalid');
    etage().hoehe = v; speichern(); if (ansicht3d) dreiD();
  });
  /* Wanddicken dieser Etage (cm): Felder in Schritt 1. Grenzen 5 bis 80 cm, gleich wie in pruefePlan. */
  function cmFeldText(m) { return String(Math.round(m * 1000) / 10).replace('.', ','); }
  function wandFelderZeigen() {
    var e = etage();
    [['g-aussenwand', e.aussenwand], ['g-innenwand', e.innenwand]].forEach(function (p) {
      var f = $(p[0]); if (!f) return;
      f.value = cmFeldText(p[1]); f.removeAttribute('aria-invalid'); $(p[0] + '-f').textContent = '';
    });
  }
  ['aussenwand', 'innenwand'].forEach(function (key) {
    var f = $('g-' + key); if (!f) return;
    f.addEventListener('input', function () {
      var v = zahl(this.value), fe = $('g-' + key + '-f');
      if (v == null || v < 5 || v > 80) { fe.textContent = tr('wandFeldFehler', { min: 5, max: 80 }); this.setAttribute('aria-invalid', 'true'); return; }
      fe.textContent = ''; this.removeAttribute('aria-invalid');
      var e = etage(); e[key] = Math.round(v * 10) / 1000;
      nachfuehren(e); speichern(); zeichnen(); wandHinweisZeigen(); auswahlZeigen(); if (ansicht3d) dreiD();
    });
  });
  /* Sichtbare Annahme zu den Wandstärken (R005) unter dem Plan */
  function wandHinweisZeigen() {
    var e = etage(), box = $('g-wand-hinweis');
    if (!box) return;
    box.setAttribute('lang', sprachCode());
    var cm = function (m) { var c = Math.round(m * 1000) / 10; return zahl2(c, c % 1 ? 1 : 0); };
    $('g-wand-hinweis-text').textContent = tr('wandHinweis', { aussen: cm(e.aussenwand), innen: cm(e.innenwand) });
  }
  /* Etage löschen, vom Knopf in Schritt 1 und vom „ד an der Etage oben. Mit Inhalt erst
     beim zweiten Klick (der Knopf zeigt dann frageText), leer sofort. */
  var etageWegBestaetigt = null;
  function etageLoeschen(knopf, frageText) {
    var e = etage();
    if (plan.etagen.length < 2) return;
    if ((e.raeume.length || e.teile.length || e.bild) && etageWegBestaetigt !== knopf) {
      etageWegBestaetigt = knopf; knopf.textContent = frageText;
      meldung('„' + e.name + '“ enthält ' + e.raeume.length + ' Räume und ' + e.teile.length + ' Teile. Zum Löschen noch einmal klicken; vorher können Sie unten den Plan als Datei sichern.');
      return;
    }
    plan.etagen.splice(plan.aktiv, 1); plan.aktiv = Math.max(0, plan.aktiv - 1);
    etageWegBestaetigt = null; $('g-etage-weg').textContent = 'Diese Etage löschen';
    gewaehlt = null; vb = null; speichern(); allesZeigen();
    meldung('Etage „' + e.name + '“ gelöscht.');
    var b = $('g-etagen').children[0]; if (b) b.focus();
  }
  $('g-etage-weg').addEventListener('click', function () { etageLoeschen(this, 'Wirklich löschen? Nochmal klicken'); });
  $('g-etage-weg').addEventListener('blur', function () { if (etageWegBestaetigt === this) { etageWegBestaetigt = null; this.textContent = 'Diese Etage löschen'; } });

  /* ---------- Bild und Maßstab ---------- */
  function labelAlsKnopf(id, inputId) {
    $(id).addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $(inputId).click(); } });
  }
  labelAlsKnopf('g-bild-knopf', 'g-bild-datei');
  labelAlsKnopf('g-laden-knopf', 'g-laden-datei');
  $('g-bild-datei').addEventListener('change', function () {
    var datei = this.files && this.files[0];
    this.value = '';
    if (!datei) return;
    if (!/^image\/(png|jpeg|webp)$/.test(datei.type)) { meldung('Nicht geladen: „' + datei.name + '“ ist kein JPG-, PNG- oder WebP-Bild. Ein PDF-Grundriss lässt sich vorher als Bild speichern (z. B. Bildschirmfoto).'); return; }
    if (datei.size > 25 * 1024 * 1024) { meldung('Nicht geladen: Das Bild ist größer als 25 MB.'); return; }
    var url = URL.createObjectURL(datei), img = new Image();
    img.onload = function () {
      var max = 1600, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      var e = etage(), hatteRaeume = e.raeume.length > 0;
      e.bild = c.toDataURL('image/jpeg', 0.85); e.bildB = c.width; e.bildH = c.height;
      e.mpp = 15 / c.width; e.massstab = false; massPunkte = [];
      vb = null; speichern(); allesZeigen();
      meldung('Bild geladen. Legen Sie jetzt den Maßstab fest: „Strecke anklicken“ und eine bekannte Wandlänge eingeben.' + (hatteRaeume ? ' Achtung: Die schon gezeichneten Räume dieser Etage werden beim Maßstab mit vergrößert oder verkleinert.' : ''));
      $('g-mass-start').focus();
    };
    img.onerror = function () { URL.revokeObjectURL(url); meldung('Das Bild „' + datei.name + '“ konnte nicht gelesen werden (Datei beschädigt oder Format unbekannt).'); };
    img.src = url;
  });
  $('g-bild-weg').addEventListener('click', function () {
    var e = etage(); if (!e.bild) return;
    e.bild = null; e.bildB = 0; e.bildH = 0; e.massstab = false; massPunkte = [];
    speichern(); allesZeigen(); meldung('Bild entfernt. Die Räume bleiben.');
  });
  $('g-mass-start').addEventListener('click', function () {
    massPunkte = []; $('g-mass-frage').hidden = true; modusSetzen('massstab');
    $('g-buehne').scrollIntoView({ block: 'nearest' });
  });
  function massAbbruch() { massPunkte = []; $('g-mass-frage').hidden = true; $('g-mass-laenge-f').textContent = ''; modusSetzen('auswahl'); }
  $('g-mass-abbruch').addEventListener('click', massAbbruch);
  function massOk() {
    var feld = $('g-mass-laenge'), L = zahl(feld.value), f = $('g-mass-laenge-f');
    if (L == null || L <= 0.1 || L > 200) { f.textContent = 'Bitte eine Länge zwischen 0,1 und 200 m eingeben, z. B. 4,20.'; feld.setAttribute('aria-invalid', 'true'); feld.focus(); return; }
    var a = massPunkte[0], b = massPunkte[1], d = a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0;
    if (d < 1e-6) { f.textContent = 'Die beiden Punkte liegen aufeinander. Bitte die Strecke neu anklicken.'; return; }
    f.textContent = ''; feld.removeAttribute('aria-invalid');
    var k = L / d, e = etage();
    e.mpp *= k; e.massstab = true;
    e.raeume.forEach(function (r) { r.punkte = r.punkte.map(function (q) { return [q[0] * k, q[1] * k]; }); });
    e.teile.forEach(function (t) { t.x *= k; t.y *= k; });
    massPunkte = []; $('g-mass-frage').hidden = true; feld.value = '';
    vb = null; speichern(); allesZeigen();
    meldung('Maßstab festgelegt: Das Bild ist jetzt ' + fmt1.format(e.bildB * e.mpp) + ' m breit. Weiter mit Schritt 2: Räume zeichnen.');
  }
  $('g-mass-ok').addEventListener('click', massOk);
  $('g-mass-laenge').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); massOk(); } });

  /* ---------- Raum mit Maßen ---------- */
  $('g-neu-raum').addEventListener('click', function () {
    var b = zahl($('g-neu-b').value), l = zahl($('g-neu-l').value), ok = true;
    [['g-neu-b', b], ['g-neu-l', l]].forEach(function (p) {
      var f = $(p[0] + '-f');
      if (p[1] == null || p[1] < 0.3 || p[1] > 100) { f.textContent = 'Bitte 0,3 bis 100 m eingeben.'; $(p[0]).setAttribute('aria-invalid', 'true'); ok = false; }
      else { f.textContent = ''; $(p[0]).removeAttribute('aria-invalid'); }
    });
    if (!ok) return;
    /* rechts neben die vorhandenen Räume legen */
    var e = etage(), x0 = 0, y0 = 0;
    if (e.raeume.length) { var g = grenzen(); x0 = rund(g.x1 + 0.5, 0.05); y0 = rund(g.y0, 0.05); }
    neuerRaum([[x0, y0], [x0 + b, y0], [x0 + b, y0 + l], [x0, y0 + l]]);
    vb = null; zeichnen();
  });

  /* ---------- Katalog ---------- */
  function katalogZeigen() {
    var box = $('g-katalog');
    box.innerHTML = '';
    KAT.artikel.filter(function (a) { return (a.gruppe === gruppe || (a.auch || []).indexOf(gruppe) >= 0) && a.zeichnen !== false; }).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = esc(a.name) + '<small>' + esc(a.breite + ' × ' + a.tiefe + ' cm') + '</small>';
      b.setAttribute('aria-label', a.name + ' hinzufügen, ' + a.breite + ' mal ' + a.tiefe + ' Zentimeter');
      b.addEventListener('click', function () { teilHinzu(a.id); });
      box.appendChild(b);
    });
  }
  document.querySelectorAll('[data-ggruppe]').forEach(function (b) {
    b.addEventListener('click', function () {
      gruppe = b.getAttribute('data-ggruppe');
      document.querySelectorAll('[data-ggruppe]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      katalogZeigen();
    });
  });

  /* ---------- Auswahl bearbeiten ---------- */
  function feld(id, label, wert, hilfe) {
    return '<div><label for="' + id + '">' + esc(label) + '</label><input type="text" id="' + id + '" inputmode="decimal" value="' + esc(wert) + '" aria-describedby="' + id + '-f">' +
      '<div class="fehler" id="' + id + '-f"></div>' + (hilfe ? '<div class="klein">' + esc(hilfe) + '</div>' : '') + '</div>';
  }
  function auswahlZeigen() {
    var box = $('g-auswahl');
    if (!gewaehlt) { box.innerHTML = ''; return; }
    if (gewaehlt.typ === 'raum') {
      var r = findeRaum(gewaehlt.id); if (!r) { box.innerHTML = ''; return; }
      var f = flaeche(r);
      var h = '<h4>Raum: ' + esc(r.name) + '</h4><p>' + raumSatz(r) + '</p>' +
        '<div style="display:grid;gap:12px"><div><label for="g-r-name">Name</label><input type="text" id="g-r-name" value="' + esc(r.name) + '"></div>' +
        '<div><label for="g-r-art">Art des Raums</label><select id="g-r-art">' + ARTEN.map(function (a) { return '<option value="' + a[0] + '"' + (a[0] === r.art ? ' selected' : '') + '>' + esc(a[1]) + '</option>'; }).join('') + '</select></div>' +
        (r.art === 'voll' ? '<div id="g-r-nutz"></div>' : '');
      if (r.art === 'voll' || r.art === 'wintergarten') {
        h += '<div class="g-mini">' + feld('g-r-t12', 'Anteil 1 bis 2 m hoch, in %', fmt0.format(r.teil12), '') + feld('g-r-t0', 'Anteil unter 1 m hoch, in %', fmt0.format(r.teil0), '') + '</div>' +
          '<p class="klein" style="margin:0">Nur bei Dachschrägen: welcher Teil der Fläche niedriger ist. Zählt halb bzw. gar nicht.</p>';
      } else if (r.art === 'balkon') {
        h += feld('g-r-balkon', 'Angerechnet in % (Regel 25, höchstens 50)', fmt0.format(r.balkon), '');
      } else {
        h += '<div class="g-check"><input type="checkbox" id="g-r-separat"' + (r.separat ? ' checked' : '') + '><label for="g-r-separat">Kann separat vermietet werden (z. B. Garage, Lagerraum)</label></div>';
      }
      h += '</div><div class="knopfreihe"><button type="button" class="knopf zweit" id="g-r-weg">Raum löschen</button></div>' +
        '<p class="klein" style="margin:8px 0 0">Ecken verschieben: an den Kreisen ziehen. Ganzen Raum: in der Fläche ziehen oder Pfeiltasten.</p>';
      box.innerHTML = h;
      if ($('g-r-nutz') && window.GRUNDRISS_REGELN) window.GRUNDRISS_REGELN.raumPanel($('g-r-nutz'), r, function () { speichern(); auswerten(); });
      $('g-r-name').addEventListener('input', function () {
        r.name = this.value.trim().slice(0, 40) || 'Raum'; box.querySelector('h4').textContent = 'Raum: ' + r.name; speichern(); zeichnen(); auswerten();
        if ($('g-r-nutz') && window.GRUNDRISS_REGELN) window.GRUNDRISS_REGELN.raumPanel($('g-r-nutz'), r, function () { speichern(); auswerten(); }, true);
      });
      $('g-r-art').addEventListener('change', function () { r.art = this.value; geaendert(); auswahlZeigen(); $('g-r-art').focus(); });
      prozentFeld('g-r-t12', function (v) { r.teil12 = v; }, 100);
      prozentFeld('g-r-t0', function (v) { r.teil0 = v; }, 100);
      prozentFeld('g-r-balkon', function (v) { r.balkon = v; }, 50);
      if ($('g-r-separat')) $('g-r-separat').addEventListener('change', function () { r.separat = this.checked; speichern(); auswerten(); });
      $('g-r-weg').addEventListener('click', loeschen);
    } else {
      var t = findeTeil(gewaehlt.id); if (!t) { box.innerHTML = ''; return; }
      var a = ART[t.art];
      if (istTuerFenster(t)) { tuerFensterPanel(box, t, a); return; }
      box.innerHTML = '<h4>' + esc(a.name) + '</h4>' +
        '<div class="g-mini">' + feld('g-t-b', 'Breite in cm', fmt0.format(t.w * 100), '') + feld('g-t-d', 'Tiefe in cm', fmt0.format(t.d * 100), '') + '</div>' +
        (a.einheit === 'm' ? '<p class="klein" style="margin:6px 0 0">Kosten nach Länge: ' + fmt1.format(t.w) + ' m.</p>' : '') +
        (a.masz ? '<p class="klein" style="margin:6px 0 0">Vorgabemaß ' + esc(a.masz) + '; bitte mit dem echten Möbel vergleichen.</p>' : '') +
        '<div class="knopfreihe"><button type="button" class="knopf zweit" id="g-t-dreh">Drehen (R)</button><button type="button" class="knopf zweit" id="g-t-weg">Löschen (Entf)</button></div>' +
        '<p class="klein" style="margin:8px 0 0">Verschieben: ziehen oder Pfeiltasten (mit Umschalt in größeren Schritten).</p>';
      [['g-t-b', 'w'], ['g-t-d', 'd']].forEach(function (p) {
        $(p[0]).addEventListener('input', function () {
          var v = zahl(this.value), fe = $(p[0] + '-f');
          if (v == null || v < 2 || v > 2000) { fe.textContent = 'Bitte 2 bis 2000 cm eingeben.'; this.setAttribute('aria-invalid', 'true'); return; }
          fe.textContent = ''; this.removeAttribute('aria-invalid');
          t[p[1]] = v / 100; geaendert();
        });
      });
      $('g-t-dreh').addEventListener('click', drehen);
      $('g-t-weg').addEventListener('click', loeschen);
    }
  }
  /* Kleine Skizze zu einem Maß: Wand von vorn, Fenster darin, das gemeinte Maß als Pfeil */
  function skizze(welche) {
    var pf = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
    var pfeil = function (d) { return '<path d="' + d + '" ' + pf + ' stroke="var(--akzent-text)" stroke-width="2.4"/>'; };
    var m = {
      breite: pfeil('M22 37h24M25 34l-3 3 3 3M43 34l3 3-3 3'),
      hoehe: pfeil('M53 14v18M50 17l3-3 3 3M50 29l3 3 3-3'),
      bruestung: pfeil('M34 44V32M31 41l3 3 3-3M31 35l3-3 3 3')
    };
    return '<svg class="skizze" viewBox="0 0 64 48" width="64" height="48" aria-hidden="true" focusable="false">' +
      '<rect x="4" y="3" width="56" height="41" ' + pf + ' stroke="var(--leise)" stroke-width="1.6"/>' +
      '<rect x="22" y="14" width="24" height="18" ' + pf + ' stroke="var(--text)" stroke-width="2"/>' +
      '<path d="M2 44h60" ' + pf + ' stroke="var(--text)" stroke-width="3"/>' + (m[welche] || '') + '</svg>';
  }
  function feldMitSkizze(welche, id, label, wert, hilfe) {
    return '<div class="g-sk">' + skizze(welche) + feld(id, label, wert, hilfe) + '</div>';
  }
  function tuerFensterPanel(box, t, a) {
    var fenster = a.form === 'fenster', raum = t.bindung && raumIn(etage(), t.bindung.raum), h;
    h = '<h4><svg class="sym" aria-hidden="true"><use href="#' + (fenster ? 'i-fenster' : 'i-tuer') + '"/></svg> ' + esc(teilName(t)) + '</h4>';
    if (raum) h += '<p class="g-wand-ok" role="status"><b aria-hidden="true">✓</b> ' + esc(tr('panelAnWand', { raum: raum.name })) + '</p>';
    else if (t.bindungGrund) h += '<p class="g-wand-weg" role="status"><b aria-hidden="true">!</b> ' + esc(tr('panelFrei')) + ' ' + esc(grundText(t.bindungGrund)) + '</p>';
    else h += '<p class="g-wand-weg" role="status"><b aria-hidden="true">!</b> ' + esc(tr('panelNichtAnWand')) + '</p>';
    if (!raum) h += '<div class="knopfreihe" style="margin-top:0"><button type="button" class="knopf zweit" id="g-t-wand"><svg class="sym" aria-hidden="true"><use href="#i-wand"/></svg> ' + esc(tr('anWandSetzen')) + '</button></div>';
    h += '<div style="display:grid;gap:10px">' +
      feldMitSkizze('breite', 'g-t-b', tr('feldBreite'), fmt0.format(t.w * 100), tr('feldBreiteKurz')) +
      feldMitSkizze('hoehe', 'g-t-h', tr('feldHoehe'), fmt0.format(t.hoehe * 100), tr('feldHoeheKurz')) +
      (fenster ? feldMitSkizze('bruestung', 'g-t-br', tr('feldBruestung'), fmt0.format(t.bruestung * 100), tr('feldBruestungKurz')) : '') + '</div>' +
      '<div class="g-bestand" role="group" aria-label="' + esc(tr('teilBestandGruppe')) + '">' +
      '<button type="button" class="chip mit-symbol" id="g-t-bestand" aria-pressed="' + (t.bestand === true ? 'true' : 'false') + '"><svg class="sym" aria-hidden="true"><use href="#i-haus"/></svg>' + esc(tr('teilBestand')) + '</button>' +
      '<button type="button" class="chip mit-symbol" id="g-t-neu" aria-pressed="' + (t.bestand === true ? 'false' : 'true') + '"><svg class="sym" aria-hidden="true"><use href="#i-hammer"/></svg>' + esc(tr('teilNeu')) + '</button></div>' +
      '<p class="klein" style="margin:6px 0 0">' + esc(tr(t.bestand === true ? 'teilBestandHinweis' : 'teilNeuHinweis')) + '</p>' +
      '<div class="knopfreihe">' + (!fenster || !raum ? '<button type="button" class="knopf zweit" id="g-t-dreh"><svg class="sym" aria-hidden="true"><use href="#i-dreh"/></svg> ' + esc(raum ? tr('seiteWechseln') : tr('drehenR')) + '</button>' : '') +
      '<button type="button" class="knopf zweit" id="g-t-weg"><svg class="sym" aria-hidden="true"><use href="#i-weg-teil"/></svg> ' + esc(tr('loeschenEntf')) + '</button>' +
      '<button type="button" class="hilfe-knopf" id="g-t-hilfe" aria-expanded="false" aria-controls="g-t-hilfe-text" aria-label="' + esc(tr('hilfeKnopf')) + '">?</button></div>' +
      '<p class="klein" id="g-t-hilfe-text" hidden>' + esc(tr(fenster ? 'hilfeFenster' : 'hilfeTuer')) + '</p>' +
      '<p class="klein" style="margin:8px 0 0">' + esc(tr('panelZiehen')) + '</p>';
    box.innerHTML = h;
    box.setAttribute('lang', sprachCode());
    [['g-t-b', function (v) { t.w = v / 100; }, 20, 300], ['g-t-h', function (v) { t.hoehe = v / 100; }, 30, 400], ['g-t-br', function (v) { t.bruestung = v / 100; }, 0, 300]].forEach(function (p) {
      var inp = $(p[0]); if (!inp) return;
      inp.addEventListener('input', function () {
        var v = zahl(this.value), fe = $(p[0] + '-f');
        if (v == null || v < p[2] || v > p[3]) { fe.textContent = tr('feldFehler', { von: p[2], bis: p[3] }); this.setAttribute('aria-invalid', 'true'); return; }
        fe.textContent = ''; this.removeAttribute('aria-invalid');
        p[1](v); geaendert();
      });
    });
    [['g-t-bestand', true], ['g-t-neu', false]].forEach(function (p) {
      $(p[0]).addEventListener('click', function () {
        if (p[1]) t.bestand = true; else delete t.bestand;
        geaendert(); auswahlZeigen(); var f = $(p[0]); if (f) f.focus({ preventScroll: true });
      });
    });
    if ($('g-t-dreh')) $('g-t-dreh').addEventListener('click', drehen);
    $('g-t-weg').addEventListener('click', loeschen);
    $('g-t-hilfe').addEventListener('click', function () {
      var x = $('g-t-hilfe-text'), auf = x.hidden;
      x.hidden = !auf; this.setAttribute('aria-expanded', auf ? 'true' : 'false');
    });
    if ($('g-t-wand')) $('g-t-wand').addEventListener('click', function () {
      /* weiter suchen als beim Ziehen, damit "an die nächste Wand" auch aus der Raummitte klappt */
      if (anWand(t, [t.x, t.y], 3)) { geaendert(); auswahlZeigen(); rueckmeldungWand(t); }
      else meldung(tr('wandFehlt'));
    });
  }
  function prozentFeld(id, setzen, max) {
    var e = $(id); if (!e) return;
    e.addEventListener('input', function () {
      var v = zahl(this.value), f = $(id + '-f');
      if (v == null || v < 0 || v > max) { f.textContent = 'Bitte 0 bis ' + max + ' eingeben.'; this.setAttribute('aria-invalid', 'true'); return; }
      f.textContent = ''; this.removeAttribute('aria-invalid');
      setzen(v); speichern(); auswerten();
      var p = $('g-auswahl').querySelector('p'); var r = findeRaum(gewaehlt.id);
      if (p && r) p.innerHTML = raumSatz(r);
    });
  }
  function raumDaten(r) { return { flaeche: flaeche(r), art: r.art, teil12: r.teil12, teil0: r.teil0, balkonProzent: r.balkon }; }
  /* Wohnfläche eines Raums nach WoFlV: Treppen mit mehr als drei Steigungen und Treppenabsätze zählen nicht (§ 3 Abs. 3 Nr. 2),
     darum wird die Grundfläche der Treppe (und der Treppenöffnung darüber) im Raum abgezogen. Nur für Wohnräume ("voll"). */
  function treppeAbzug(e, r) { return r.art === 'voll' && RK ? RK.treppenAbzug(e, r, ART) : 0; }
  function raumWohn(e, r) { return Math.max(0, R.wohnflaecheRaum(raumDaten(r)) - treppeAbzug(e, r)); }
  function raumSatz(r) {
    var e = etage(), ab = treppeAbzug(e, r);
    return 'Grundfläche <b>' + qm(flaeche(r)) + '</b>, davon Wohnfläche <b>' + qm(raumWohn(e, r)) + '</b>.' + (ab > 0.005 ? ' ' + esc(tr('wohnTreppeAbzug', { qm: qm(ab) })) : '');
  }

  /* ---------- Auswertung ---------- */
  function preisVon(a) { return plan.preise[a.id] != null ? plan.preise[a.id] : a.start; }
  function summen() {
    var wfl = 0, nfl = 0, sep = 0, betten = 0, mengen = {}, raeumeRows = [], bettRows = [], monteur = false;
    plan.etagen.forEach(function (e) {
      e.raeume.forEach(function (r) {
        var d = raumDaten(r), w = raumWohn(e, r), n = R.nutzflaecheRaum(d);
        wfl += w; nfl += n; if (r.separat && n) sep += n;
        raeumeRows.push({ r: r, etage: e.name, f: d.flaeche, w: w, n: n, treppe: treppeAbzug(e, r) });
      });
      var jeRaum = {};
      e.teile.forEach(function (t) {
        var a = ART[t.art];
        if (t.bestand === true && istTuerFenster(t)) return;   /* schon vorhanden (Vorlage): kein Umbau, keine Kosten, bis "neu einbauen" gewählt wird */
        mengen[a.id] = (mengen[a.id] || 0) + (a.einheit === 'm' ? t.w : 1);
        if (a.gruppe === 'monteur') monteur = true;
        if (a.betten) {
          betten += a.betten;
          var r = e.raeume.filter(function (x) { return R.punktImPolygon(t.x, t.y, x.punkte); })[0];
          var k = r ? r.id : '_';
          jeRaum[k] = jeRaum[k] || { name: r ? r.name : 'außerhalb der Räume', etage: e.name, f: r ? flaeche(r) : 0, n: 0 };
          jeRaum[k].n += a.betten;
        }
      });
      Object.keys(jeRaum).forEach(function (k) { bettRows.push(jeRaum[k]); });
    });
    var posten = [];
    KAT.artikel.forEach(function (a) {
      var m;
      if (a.keinPosten) return;   /* z. B. Treppenöffnung oben: gehört zur Treppe darunter, kein eigener Posten */
      if (a.jeBett) m = monteur ? betten * a.jeBett : 0;
      else if (a.zeichnen === false) m = plan.mengen[a.id] || 0;
      else m = mengen[a.id] || 0;
      if (m > 0 || a.zeichnen === false && !a.jeBett) posten.push({ a: a, menge: m, preis: preisVon(a), gruppe: a.gruppe });
    });
    var k = R.einrichtungskosten(posten.map(function (p) { return { menge: p.menge, preis: p.preis || 0, gruppe: p.gruppe }; }));
    var ohneMassstab = plan.etagen.filter(function (e) { return e.bild && !e.massstab && e.raeume.length; }).map(function (e) { return e.name; });
    var ohnePreis = posten.filter(function (p) { return p.menge > 0 && p.preis == null; }).length;
    return { wfl: wfl, nfl: nfl, sep: sep, betten: betten, einrichtung: k.einrichtung, umbau: k.umbau, summe: k.summe, posten: posten, raeume: raeumeRows, bettRows: bettRows, ohneMassstab: ohneMassstab, ohnePreis: ohnePreis };
  }
  function auswerten() {
    var s = summen(), nRaeume = s.raeume.length;
    $('g-wfl').textContent = nRaeume ? qm(s.wfl) : '-';
    $('g-nfl').textContent = nRaeume ? qm(s.nfl) : '-';
    $('g-einr').textContent = s.einrichtung ? euro(s.einrichtung) : '-';
    $('g-umb').textContent = s.umbau ? euro(s.umbau) : '-';
    var box = $('g-satz'), titel, klein, art = 'leer', zeichen = '?';
    if (!nRaeume) {
      titel = 'Noch kein Raum gezeichnet.';
      klein = 'Fangen Sie oben bei „So fangen Sie an“ an: eine Vorlage laden oder ein Bild wählen, oder zeichnen Sie gleich in Schritt 2 auf dem Raster.';
    } else {
      titel = qm(s.wfl) + ' Wohnfläche' + (s.summe ? ', Einrichtung und Umbau etwa ' + euro(s.summe) : '') + '.';
      klein = (s.nfl ? 'Dazu ' + qm(s.nfl) + ' Nutzfläche' + (s.sep ? ', davon ' + qm(s.sep) + ' separat vermietbar' : '') + '. ' : '') +
        (s.betten ? s.betten + ' Schlafplätze. ' : '') + 'Preise sind Richtwerte, keine Angebote.';
      if (plan.beispiel) klein = tr((VORLAGEN_T[plan.vorlage] || VORLAGEN_T.beispielhaus).text) + ' ' + klein;
      zeichen = '✓'; art = 'gut';
      if (s.ohneMassstab.length) {
        art = 'warn'; zeichen = '!';
        klein = 'Achtung: Für ' + s.ohneMassstab.join(', ') + ' ist noch kein Maßstab festgelegt, die Flächen stimmen erst danach. ' + klein;
      }
    }
    /* Fenster/Türen, die ihre Wand verloren haben: sichtbar mit Grund (kommt aus dem gespeicherten Zustand der Teile) */
    var fr = freieTeile();
    if (fr.length) {
      art = 'warn'; zeichen = '!';
      var ft = fr[0].t;
      klein = tr('freiSatz', { n: fr.length, teil: teilName(ft), grund: grundText(ft.bindungGrund) }) + ' ' + klein;
    }
    box.className = 'satz ' + art;
    box.querySelector('.lampe').textContent = zeichen;
    $('g-satz-text').textContent = titel;
    $('g-satz-klein').textContent = klein;

    /* Räume */
    var tb = $('g-raeume').querySelector('tbody');
    tb.innerHTML = s.raeume.length ? s.raeume.map(function (x) {
      var artName = ARTEN.filter(function (a) { return a[0] === x.r.art; })[0][1];
      return '<tr><td data-titel="Raum">' + esc(x.r.name) + (x.r.separat && x.n ? ' <span class="klein">(separat vermietbar)</span>' : '') + '</td><td data-titel="Etage">' + esc(x.etage) + '</td><td data-titel="Art">' + esc(artName) + '</td>' +
        '<td class="z" data-titel="Grundfläche">' + qm(x.f) + '</td><td class="z" data-titel="Wohnfläche">' + qm(x.w) + '</td><td class="z" data-titel="Nutzfläche">' + (x.n ? qm(x.n) : '-') + '</td></tr>';
    }).join('') + '<tr><th scope="row" colspan="3">Summe</th><td class="z" data-titel="Grundfläche"><b>' + qm(s.raeume.reduce(function (a, x) { return a + x.f; }, 0)) + '</b></td><td class="z" data-titel="Wohnfläche"><b>' + qm(s.wfl) + '</b></td><td class="z" data-titel="Nutzfläche"><b>' + qm(s.nfl) + '</b></td></tr>'
      : '<tr><td colspan="6">Noch keine Räume.</td></tr>';

    /* Kosten */
    var kb = $('g-kosten').querySelector('tbody');
    var aktiv = document.activeElement && kb.contains(document.activeElement) ? document.activeElement.id : null;
    if (!aktiv) {
      kb.innerHTML = s.posten.length ? s.posten.map(function (p) {
        var a = p.a, mengeZelle;
        if (a.zeichnen === false && !a.jeBett) mengeZelle = '<input type="text" inputmode="decimal" id="g-m-' + a.id + '" value="' + (p.menge ? fmt0.format(p.menge) : '') + '" placeholder="0" aria-label="Menge ' + esc(a.name) + '">';
        else mengeZelle = a.einheit === 'm' ? fmt1.format(p.menge) + ' m' : fmt0.format(p.menge);
        var spanne = a.von != null ? euro(a.von) + ' bis ' + euro(a.bis) + (a.einheit === 'm' ? ' je m' : '') : 'keine geprüfte Spanne';
        return '<tr><td data-titel="Teil">' + esc(a.name) + (a.jeBett ? ' <span class="klein">(je Schlafplatz)</span>' : '') + (p.preis == null ? ' <span class="annahme">Preis offen</span>' : '') + '</td><td class="z" data-titel="Menge">' + mengeZelle + '</td>' +
          '<td data-titel="€ je ' + (a.einheit === 'm' ? 'm' : 'Stück') + '"><input type="text" inputmode="decimal" id="g-p-' + a.id + '" value="' + (p.preis != null ? fmt0.format(p.preis) : '') + '" placeholder="Preis eintragen" aria-label="Preis je ' + (a.einheit === 'm' ? 'Meter' : 'Stück') + ' ' + esc(a.name) + '"></td>' +
          '<td class="z" data-titel="Summe" id="g-s-' + a.id + '">' + (p.preis != null ? euro(p.menge * p.preis) : '-') + '</td>' +
          '<td data-titel="Spanne und Quelle" class="klein">' + esc(spanne) + (a.quelle ? '<br>' + esc(a.quelle) : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="5">Noch keine Möbel oder Umbau-Teile im Plan.</td></tr>';
    } else {
      s.posten.forEach(function (p) { var z = $('g-s-' + p.a.id); if (z) z.textContent = p.preis != null ? euro(p.menge * p.preis) : '-'; });
    }
    $('g-kosten-ergebnis').innerHTML =
      '<div class="wert"><dt>Einrichtung</dt><dd>' + euro(s.einrichtung) + '</dd></div>' +
      '<div class="wert"><dt>Umbau</dt><dd>' + euro(s.umbau) + '</dd></div>' +
      '<div class="wert haupt"><dt>Zusammen</dt><dd>' + euro(s.summe) + '</dd></div>';
    $('g-preis-hinweis').textContent = 'Preise sind Richtwerte' + (KAT.abruf ? ' (Abruf ' + KAT.abruf + ')' : '') + ', keine Angebote: bitte eigene Preise eintragen.' + (s.ohnePreis ? ' ' + s.ohnePreis + ' Teile haben noch keinen Preis und zählen mit 0 €.' : '');

    /* Schlafplätze */
    $('g-betten-block').hidden = !s.betten;
    $('g-betten').querySelector('tbody').innerHTML = s.bettRows.map(function (b) {
      return '<tr><td data-titel="Zimmer">' + esc(b.name) + ' <span class="klein">(' + esc(b.etage) + ')</span></td><td class="z" data-titel="Schlafplätze">' + b.n + '</td><td class="z" data-titel="m² je Schlafplatz">' + (b.f ? fmt1.format(b.f / b.n) : '-') + '</td></tr>';
    }).join('');
    if (ansicht3d) dreiD();
    if (window.GRUNDRISS_REGELN) window.GRUNDRISS_REGELN.aktualisieren();
  }
  $('g-kosten').addEventListener('input', function (ev) {
    var id = ev.target.id, v = ev.target.value.trim(), n = v === '' ? null : zahl(v);
    if (v !== '' && (n == null || n < 0)) { ev.target.setAttribute('aria-invalid', 'true'); return; }
    ev.target.removeAttribute('aria-invalid');
    if (id.indexOf('g-p-') === 0) { var a = id.slice(4); if (n == null) delete plan.preise[a]; else plan.preise[a] = n; }
    else if (id.indexOf('g-m-') === 0) { plan.mengen[id.slice(4)] = n || 0; }
    speichern(); auswerten();
  });
  $('g-kosten').addEventListener('focusout', function () { setTimeout(function () { if (!$('g-kosten').contains(document.activeElement)) auswerten(); }, 0); });

  /* ---------- In den Rechner übernehmen ---------- */
  var fmtFlaeche = function (x) { return fmt1.format(x); };
  function setzeFeld(id, wert) {
    var e = $(id); if (!e) return;
    e.value = wert;
    e.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function uebernehmen(art) {
    var s = summen(), alt = R.leseZahl($('r-zusatz').value) || 0;
    var kosten = art === 'dazu' ? alt + s.summe : s.summe;
    if (s.raeume.length) setzeFeld('r-flaeche', fmtFlaeche(s.wfl));
    setzeFeld('r-zusatz', fmt0.format(Math.round(kosten)));
    $('g-frage').hidden = true;
    $('g-uebernahme-meldung').innerHTML = 'Übernommen: ' + (s.raeume.length ? 'Wohnfläche ' + esc(qm(s.wfl)) + ', ' : '') + 'zusätzliche Kosten ' + esc(euro(kosten)) + '. <a href="#rechner" data-ziel="rechner">Zum Rechner</a>';
  }
  $('g-uebernehmen').addEventListener('click', function () {
    var s = summen();
    if (!s.raeume.length && !s.summe) { $('g-uebernahme-meldung').textContent = 'Es gibt noch nichts zu übernehmen: zeichnen Sie zuerst Räume oder stellen Sie Möbel in den Plan.'; return; }
    var alt = R.leseZahl($('r-zusatz').value) || 0, altF = R.leseZahl($('r-flaeche').value) || 0;
    if (alt > 0 || (altF > 0 && s.raeume.length && Math.abs(altF - s.wfl) > 0.05)) {
      $('g-frage-text').textContent = 'Im Rechner steht schon etwas: ' + (altF ? 'Wohnfläche ' + qm(altF) + ', ' : '') + 'zusätzliche Kosten ' + euro(alt) + '. ' +
        'Neu aus dem Grundriss: ' + (s.raeume.length ? 'Wohnfläche ' + qm(s.wfl) + ', ' : '') + 'Einrichtung und Umbau ' + euro(s.summe) + '. Die Wohnfläche wird in beiden Fällen ersetzt.';
      $('g-frage').hidden = false; $('g-frage-ersetzen').focus();
      return;
    }
    uebernehmen('ersetzen');
  });
  $('g-frage-ersetzen').addEventListener('click', function () { uebernehmen('ersetzen'); });
  $('g-frage-dazu').addEventListener('click', function () { uebernehmen('dazu'); });
  $('g-frage-nein').addEventListener('click', function () { $('g-frage').hidden = true; $('g-uebernahme-meldung').textContent = 'Nichts übernommen.'; });

  /* ---------- Datei sichern, laden, neu ---------- */
  function heute() { var d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }
  function dateiSichern(zusatz) {
    try {
      nachfuehrenAlle();
      var daten = JSON.parse(JSON.stringify(plan)); daten.exportiert = new Date().toISOString();
      var blob = new Blob([JSON.stringify(daten)], { type: 'application/json' });
      var url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'grundriss_' + heute() + (zusatz || '') + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) {
      $('g-datei-meldung').textContent = 'Die Datei konnte nicht erzeugt werden: ' + (e && e.message ? e.message : 'unbekannter Fehler') + '.';
      return false;
    }
  }
  function leer() { return plan.etagen.every(function (e) { return !e.raeume.length && !e.teile.length && !e.bild; }); }
  $('g-sichern').addEventListener('click', function () {
    if (dateiSichern('')) $('g-datei-meldung').textContent = 'Datei „grundriss_' + heute() + '.json“ wird heruntergeladen. Erscheint nichts, erlaubt diese Ansicht keine Downloads; dann die Seite direkt im Browser öffnen.';
  });
  $('g-laden-datei').addEventListener('change', function () {
    var datei = this.files && this.files[0]; this.value = '';
    if (!datei) return;
    var rd = new FileReader();
    rd.onload = function () {
      var neu = null;
      try { neu = pruefePlan(JSON.parse(rd.result)); } catch (e) { neu = null; }
      if (!neu) { $('g-datei-meldung').textContent = 'Nicht geladen: „' + datei.name + '“ ist keine Grundriss-Datei dieser Seite.'; return; }
      var gesichert = !leer() && dateiSichern('_vorher');
      plan = neu; gewaehlt = null; vb = null; speichern(); allesZeigen();
      $('g-datei-meldung').textContent = 'Geladen: ' + neu.etagen.length + ' Etagen.' + (gesichert ? ' Der bisherige Plan wurde vorher als „grundriss_' + heute() + '_vorher.json“ gesichert.' : '');
    };
    rd.onerror = function () { $('g-datei-meldung').textContent = 'Die Datei konnte nicht gelesen werden.'; };
    rd.readAsText(datei);
  });
  $('g-neu').addEventListener('click', function () {
    if (leer()) return;
    $('g-neu-frage').hidden = false; $('g-neu-sichern').focus();
  });
  function neuBeginnen() { plan = leererPlan(); gewaehlt = null; vb = null; $('g-neu-frage').hidden = true; speichern(); allesZeigen(); schrittZeigen(1); }
  $('g-neu-sichern').addEventListener('click', function () { if (dateiSichern('_alt')) { neuBeginnen(); $('g-datei-meldung').textContent = 'Alter Plan als Datei gesichert, neuer Plan begonnen.'; } });
  $('g-neu-ohne').addEventListener('click', function () { neuBeginnen(); $('g-datei-meldung').textContent = 'Neuer Plan begonnen.'; });
  $('g-neu-nein').addEventListener('click', function () { $('g-neu-frage').hidden = true; });

  /* ---------- Vorlagen: Beispielhaus (daten/beispielhaus.js) und drei weitere Häuser (daten/vorlage_*.js) ----------
     Vier Karten mit Skizze, Name, Wohnfläche und Geschosszahl (beides aus den Daten gerechnet, nicht von Hand
     eingetragen). Ist schon etwas im Plan, fragt die Seite vor dem Ersetzen und bietet an, den Plan zuerst als Datei zu sichern. */
  var VORLAGEN = ['beispielhaus', 'musterhaus2', 'klein', 'gross'];
  var vorlageWartet = null;      /* Vorlage, die nach der Rückfrage geladen wird */
  function vorlageDaten(id) { var D = window.DATEN || {}; return id === 'beispielhaus' ? D.beispielhaus : (D.vorlagen || {})[id]; }
  function vorlageKarteId(id) { return id === 'beispielhaus' ? 'g-beispiel' : 'g-vorlage-' + id; }
  function vorlageLaden(id) {
    id = id || vorlageWartet || 'beispielhaus';
    var vorlage = vorlageDaten(id);
    if (!vorlage) { meldung(tr('vorlageFehlt')); return; }
    var p = JSON.parse(JSON.stringify(vorlage));
    /* Ids und Maße ergänzen, wo sie fehlen (das Beispielhaus hat keine); feste Ids der Vorlagen bleiben, sonst verlieren Fenster und Türen ihre Wand */
    p.etagen.forEach(function (e) {
      e.raeume.forEach(function (r) { if (!r.id) r.id = neueId('r'); });
      e.teile.forEach(function (t) { var a = ART[t.art]; if (!t.id) t.id = neueId('t'); if (a) { if (t.w == null) t.w = a.breite / 100; if (t.d == null) t.d = a.tiefe / 100; } });
    });
    var neu = pruefePlan(p);
    if (!neu) { meldung(tr('vorlageNichtGeladen')); return; }
    /* Fenster und Türen der Vorlage sind "Bestand" (kosten keinen Umbau); beim Beispielhaus bleibt es wie bisher, damit seine Umbaukosten gleich bleiben */
    if (id !== 'beispielhaus') neu.etagen.forEach(function (e) { e.teile.forEach(function (t) { if (istTuerFenster(t)) t.bestand = true; }); });
    neu.land = plan.land;   /* das gewählte Bundesland bleibt */
    plan = neu; gewaehlt = null; vb = null; vorlageWartet = null; $('g-beispiel-frage').hidden = true;
    speichern(); allesZeigen();
    if (id === 'beispielhaus') meldung('Beispielhaus geladen: oben bei „Etage“ zwischen Erdgeschoss, Dachgeschoss und Keller wechseln, mit „3D“ ansehen. Alle Maße sind erfunden.');
    else meldung(tr('vorlageGeladen', { name: tr(VORLAGEN_T[id].name), text: tr(VORLAGEN_T[id].text) }));
    /* Das Ergebnis liegt unter den Karten: dorthin blättern, damit der Erfolg sofort sichtbar ist (ohne Animation bei "weniger Bewegung") */
    var sz = $('g-satz');
    if (sz && sz.scrollIntoView) {
      var b = sz.getBoundingClientRect();
      if (b.top < 80 || b.bottom > window.innerHeight) sz.scrollIntoView({ block: 'start', behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  function vorlageWohnflaeche(v) {
    var s = 0;
    v.etagen.forEach(function (e) {
      e.raeume.forEach(function (r) {
        var rr = { punkte: r.punkte, art: r.art || 'voll', teil12: r.teil12, teil0: r.teil0, balkon: r.balkon };
        s += Math.max(0, R.wohnflaecheRaum(raumDaten(rr)) - treppeAbzug(e, rr));
      });
    });
    return s;
  }
  /* Kleine Skizze der ersten Etage: nur die Räume, Farben über CSS-Klassen aus der Palette */
  function vorlageSkizze(v) {
    var e = v.etagen[0], x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    e.raeume.forEach(function (r) { r.punkte.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }); });
    var pad = Math.max(x1 - x0, y1 - y0) * 0.04;
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', (x0 - pad) + ' ' + (y0 - pad) + ' ' + (x1 - x0 + 2 * pad) + ' ' + (y1 - y0 + 2 * pad));
    s.setAttribute('class', 'vk-skizze'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    e.raeume.forEach(function (r) {
      el('polygon', { points: r.punkte.map(function (q) { return q[0] + ',' + q[1]; }).join(' '), class: 'vk-raum art-' + (r.art || 'voll') }, s);
    });
    return s;
  }
  function vorlagenZeigen() {
    var ul = $('g-vorlagen'); if (!ul) return;
    var hatFokus = document.activeElement && ul.contains(document.activeElement) ? document.activeElement.id : '';
    ul.textContent = '';
    VORLAGEN.forEach(function (id) {
      var v = vorlageDaten(id); if (!v) return;
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'g-vorlage'; b.id = vorlageKarteId(id); b.setAttribute('data-vorlage', id);
      b.appendChild(vorlageSkizze(v));
      function zeile(klasse, text) { var sp = document.createElement('span'); sp.className = klasse; sp.textContent = text; b.appendChild(sp); }
      zeile('vk-name', tr(VORLAGEN_T[id].name));
      zeile('vk-meta', tr(v.etagen.length === 1 ? 'vorlageMetaEins' : 'vorlageMeta', { qm: fmt0.format(Math.round(vorlageWohnflaeche(v))), n: v.etagen.length }));
      zeile('vk-text', tr(VORLAGEN_T[id].kurz));
      zeile('vk-los', tr('vorlageLos'));
      b.addEventListener('click', function () { vorlageAnfordern(id); });
      li.appendChild(b); ul.appendChild(li);
    });
    if (hatFokus && $(hatFokus)) $(hatFokus).focus({ preventScroll: true });
  }
  function vorlageAnfordern(id) {
    if (!vorlageDaten(id)) { meldung(tr('vorlageFehlt')); return; }
    if (leer()) { vorlageLaden(id); return; }
    vorlageWartet = id;
    $('g-beispiel-frage-text').textContent = tr('vorlageFrage', { name: tr(VORLAGEN_T[id].name) });
    $('g-beispiel-frage').hidden = false; $('g-beispiel-sichern').focus();
  }
  vorlagenZeigen();
  window.addEventListener('sprachegewechselt', vorlagenZeigen);
  $('g-beispiel-sichern').addEventListener('click', function () { if (dateiSichern('_vor_vorlage')) vorlageLaden(); });
  $('g-beispiel-ohne').addEventListener('click', function () { vorlageLaden(); });
  $('g-beispiel-nein').addEventListener('click', function () {
    var id = vorlageWartet; vorlageWartet = null;
    $('g-beispiel-frage').hidden = true; var k = $(vorlageKarteId(id || 'beispielhaus')); if (k) k.focus();
  });

  /* ---------- Ansicht von oben / 3D ---------- */
  function dreiD() {
    if (!window.GRUNDRISS3D) return;
    nachfuehrenAlle();
    window.GRUNDRISS3D.zeige(plan, ART);
  }
  function ansichtSetzen(drei) {
    ansicht3d = drei && !!window.GRUNDRISS3D;
    $('g-ansicht-plan').setAttribute('aria-pressed', ansicht3d ? 'false' : 'true');
    $('g-ansicht-3d').setAttribute('aria-pressed', ansicht3d ? 'true' : 'false');
    svg.style.visibility = ansicht3d ? 'hidden' : '';
    $('g-szene').hidden = !ansicht3d;
    $('g-zoom').hidden = ansicht3d;
    $('g-nord').hidden = ansicht3d;
    $('g-tipp').textContent = ansicht3d ? '' : $('g-tipp').textContent;
    $('g-3d-leiste').hidden = !ansicht3d;
    if (window.GRUNDRISS3D && window.GRUNDRISS3D.aktiv) window.GRUNDRISS3D.aktiv(ansicht3d);
    if (ansicht3d) dreiD(); else zeichnen();
  }
  $('g-ansicht-plan').addEventListener('click', function () { ansichtSetzen(false); });
  $('g-ansicht-3d').addEventListener('click', function () { ansichtSetzen(true); });
  $('g-zoom-ein').addEventListener('click', function () { zoomen(1 / 1.3); });
  $('g-zoom-aus').addEventListener('click', function () { zoomen(1.3); });
  $('g-zoom-passt').addEventListener('click', function () { einpassen(); zeichnen(); });

  if ('ResizeObserver' in window) new ResizeObserver(function () { if (sichtbar && !ansicht3d) { seitenverhaeltnis(); zeichnen(); } }).observe($('g-buehne'));
  window.addEventListener('themagewechselt', function () { if (ansicht3d) dreiD(); });

  /* Sonne und Dachertrag der 3D-Ansicht richten sich nach der Hauptstadt des gewählten Bundeslandes */
  function landAnwenden() {
    if (RK && window.GRUNDRISS3D && window.GRUNDRISS3D.ort) window.GRUNDRISS3D.ort(RK.landInfo(plan.land).stadt);
  }
  function allesZeigen() { landAnwenden(); nachfuehrenAlle(); etagenZeigen(); zeichnen(); auswahlZeigen(); auswerten(); nordZeigen(); dachZeigen(); }

  /* ---------- Himmelsrichtung (Windrose) ---------- */
  function nordZeigen() {
    var g = plan.nord || 0, pf = $('g-nord-pfeil'), n = $('g-nord-n'), r = $('g-nord'), f = $('g-nord-grad');
    if (!r) return;
    pf.setAttribute('transform', 'rotate(' + g + ' 32 32)');
    n.setAttribute('transform', 'rotate(' + (-g) + ' 32 17)');
    n.textContent = tr('nordBuchstabe');
    r.setAttribute('aria-valuenow', String(g)); r.setAttribute('aria-valuetext', tr('nordWert', { grad: g }));
    if (f && document.activeElement !== f) f.value = String(g);
  }
  function nordSetzen(grad) {
    plan.nord = Math.round(((grad % 360) + 360) % 360) % 360;
    speichern(); nordZeigen();
    if (ansicht3d) dreiD();
  }

  /* ---------- Dach (Form, Neigung, Firstrichtung, Überstand); wird in der 3D-Ansicht gezeigt ---------- */
  var FORMEN = ['sattel', 'walm', 'pult', 'flach'];
  function dachAendern() { speichern(); dachZeigen(); if (ansicht3d) dreiD(); }
  function dachZeigen() {
    var d = plan.dach, box = $('g-dach'); if (!box) return;
    box.querySelectorAll('[data-dachform]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-dachform') === d.form ? 'true' : 'false'); });
    if (document.activeElement !== $('g-dach-neigung')) $('g-dach-neigung').value = String(Math.round(d.neigung * 10) / 10).replace('.', ',');
    $('g-dach-schieber').value = String(Math.round(d.neigung));
    $('g-dach-schieber').disabled = d.form === 'flach'; $('g-dach-neigung').disabled = d.form === 'flach';
    if (document.activeElement !== $('g-dach-ueberstand')) $('g-dach-ueberstand').value = String(Math.round(d.ueberstand * 1000) / 10).replace('.', ',');
    var mitFirst = d.form === 'sattel' || d.form === 'pult', mitHoch = d.form === 'pult';
    $('g-dach-first').hidden = !mitFirst; $('g-dach-hoch').hidden = !mitHoch; $('g-dach-firstnur').hidden = mitFirst;
    box.querySelectorAll('[data-first]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-first') === d.first ? 'true' : 'false'); });
    var hoch = d.hoch === 'max' ? 'max' : 'min', hb = box.querySelectorAll('[data-hoch]');
    hb[0].textContent = tr(d.first === 'x' ? 'dachHochOben' : 'dachHochLinks'); hb[1].textContent = tr(d.first === 'x' ? 'dachHochUnten' : 'dachHochRechts');
    hb.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-hoch') === hoch ? 'true' : 'false'); });
  }
  (function dachBedienen() {
    var box = $('g-dach'); if (!box) return;
    box.querySelectorAll('[data-dachform]').forEach(function (b) {
      b.addEventListener('click', function () { plan.dach.form = b.getAttribute('data-dachform'); dachAendern(); });
    });
    box.querySelectorAll('[data-first]').forEach(function (b) {
      b.addEventListener('click', function () { plan.dach.first = b.getAttribute('data-first'); dachAendern(); });
    });
    box.querySelectorAll('[data-hoch]').forEach(function (b) {
      b.addEventListener('click', function () { if (b.getAttribute('data-hoch') === 'max') plan.dach.hoch = 'max'; else delete plan.dach.hoch; dachAendern(); });
    });
    $('g-dach-schieber').addEventListener('input', function () { plan.dach.neigung = Number(this.value); $('g-dach-neigung-f').textContent = ''; $('g-dach-neigung').removeAttribute('aria-invalid'); dachAendern(); });
    $('g-dach-neigung').addEventListener('input', function () {
      var v = zahl(this.value), fe = $('g-dach-neigung-f');
      if (v == null || v < 0 || v > 80) { fe.textContent = tr('dachFehlerNeigung'); this.setAttribute('aria-invalid', 'true'); return; }
      fe.textContent = ''; this.removeAttribute('aria-invalid'); plan.dach.neigung = v; dachAendern();
    });
    $('g-dach-neigung').addEventListener('blur', dachZeigen);
    $('g-dach-ueberstand').addEventListener('input', function () {
      var v = zahl(this.value), fe = $('g-dach-ueberstand-f');
      if (v == null || v < 0 || v > 200) { fe.textContent = tr('dachFehlerUeberstand'); this.setAttribute('aria-invalid', 'true'); return; }
      fe.textContent = ''; this.removeAttribute('aria-invalid'); plan.dach.ueberstand = v / 100; dachAendern();
    });
    $('g-dach-ueberstand').addEventListener('blur', dachZeigen);
    window.addEventListener('sprachegewechselt', dachZeigen);
  })();
  (function nordBedienen() {
    var r = $('g-nord'), f = $('g-nord-grad'); if (!r) return;
    var zieht = false;
    function ausMaus(ev) {
      var b = r.getBoundingClientRect(), dx = ev.clientX - (b.left + b.width / 2), dy = ev.clientY - (b.top + b.height / 2);
      if (Math.hypot(dx, dy) < 4) return;
      nordSetzen(Math.atan2(dx, -dy) * 180 / Math.PI);
    }
    r.addEventListener('pointerdown', function (ev) { zieht = true; try { r.setPointerCapture(ev.pointerId); } catch (err) { /* ohne Capture reicht move auf dem Element */ } ausMaus(ev); ev.preventDefault(); });
    r.addEventListener('pointermove', function (ev) { if (zieht) ausMaus(ev); });
    r.addEventListener('pointerup', function () { zieht = false; });
    r.addEventListener('pointercancel', function () { zieht = false; });
    r.addEventListener('keydown', function (ev) {
      var s = ev.shiftKey ? 15 : 1, k = ev.key, g = plan.nord || 0;
      if (k === 'ArrowRight' || k === 'ArrowUp') nordSetzen(g + s);
      else if (k === 'ArrowLeft' || k === 'ArrowDown') nordSetzen(g - s);
      else if (k === 'Home') nordSetzen(0);
      else return;
      ev.preventDefault(); ev.stopPropagation();
    });
    f.addEventListener('input', function () {
      var v = zahl(this.value), fe = $('g-nord-grad-f');
      if (v == null || v < 0 || v > 360) { fe.textContent = tr('nordFehler'); this.setAttribute('aria-invalid', 'true'); return; }
      fe.textContent = ''; this.removeAttribute('aria-invalid');
      nordSetzen(v);
    });
    f.addEventListener('blur', nordZeigen);
    $('g-nord-hilfe').addEventListener('click', function () {
      var x = $('g-nord-hilfe-text'), auf = x.hidden;
      x.hidden = !auf; this.setAttribute('aria-expanded', auf ? 'true' : 'false');
    });
  })();

  /* ---------- Maße zeigen (Knopf), erster Hinweis ---------- */
  var MASS_KEY = 'immo-grundriss-masse', HINWEIS_KEY = 'immo-hinweis-wand';
  try { if (localStorage.getItem(MASS_KEY) === '0') massAn = false; } catch (err) { /* ohne Speicher bleibt es an */ }
  function masseKnopf() { var b = $('g-masse'); if (b) b.setAttribute('aria-pressed', massAn ? 'true' : 'false'); }
  if ($('g-masse')) $('g-masse').addEventListener('click', function () {
    massAn = !massAn; masseKnopf();
    try { localStorage.setItem(MASS_KEY, massAn ? '1' : '0'); } catch (err) { meldung(tr('masseNichtGemerkt')); }
    zeichnen();
  });
  masseKnopf();
  if ($('g-wand-hilfe')) $('g-wand-hilfe').addEventListener('click', function () {
    var x = $('g-wand-hilfe-text'), auf = x.hidden;
    x.hidden = !auf; this.setAttribute('aria-expanded', auf ? 'true' : 'false');
  });
  function hinweisZeigen(text) {
    var b = $('g-hinweis'); if (!b) return;
    $('g-hinweis-text').textContent = text; b.setAttribute('lang', sprachCode()); b.hidden = false;
  }
  if ($('g-hinweis-zu')) $('g-hinweis-zu').addEventListener('click', function () { $('g-hinweis').hidden = true; svg.focus({ preventScroll: true }); });
  /* kurzer Hinweis beim ersten Fenster/Tür: wird nur einmal gezeigt (Bewegung nur ohne "reduzierte Bewegung") */
  function ersthinweisWand() {
    var schon = false;
    try { schon = localStorage.getItem(HINWEIS_KEY) === '1'; } catch (err) { schon = false; }
    if (schon) return;
    try { localStorage.setItem(HINWEIS_KEY, '1'); } catch (err) { /* dann kommt er beim nächsten Mal wieder, kein Schaden */ }
    hinweisZeigen(tr('hinweisWand'));
  }

  /* ---------- Plan drucken ---------- */
  var druckZustand = null;
  function nettoSkala(r) {
    var s = [10, 20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 2000], i;
    for (i = 0; i < s.length; i++) if (s[i] >= r) return s[i];
    return Math.ceil(r / 1000) * 1000;
  }
  function druckAufraeumen() {
    document.body.classList.remove('plan-druck');
    var box = $('g-druck'); if (box) box.innerHTML = '';
    if (druckZustand) {
      massAn = druckZustand.mass; ansicht3d = druckZustand.drei; vb = druckZustand.vb; druckZustand = null;
      if (sichtbar && !ansicht3d) zeichnen();
    }
  }
  /* baut die Druckseite (Plan mit Maßlinien, Maßstab, Raumliste, Datum); false = nichts zu drucken */
  function druckVorbereiten() {
    if (druckZustand) druckAufraeumen();
    var e = etage(), box = $('g-druck');
    if (!box || !e.raeume.length) return false;
    druckZustand = { vb: vb ? { x: vb.x, y: vb.y, w: vb.w, h: vb.h } : null, mass: massAn, drei: ansicht3d };
    ansicht3d = false; massAn = true;
    var altSichtbar = sichtbar; sichtbar = true;
    vb = null; einpassen(true); zeichnen();
    var fit = { w: vb.w, h: vb.h };
    /* Maßstab: 180 mm breit, 150 mm hoch verfügbar; auf eine runde Zahl 1:N gerundet, Größe dann exakt */
    var verh = Math.max(fit.w * 1000 / 180, fit.h * 1000 / 150), N = nettoSkala(verh);
    druckZustand.N = N;   /* für die Mappe (etagenBilder) */
    /* Beschriftungen in Papiergröße rechnen (1 Punkt = 0,2646 mm), dann neu zeichnen */
    skalaUeber = (0.2646 / 1000) * N;
    try { zeichnen(); } finally { skalaUeber = 0; }
    var klon = svg.cloneNode(true);
    sichtbar = altSichtbar;
    ['id', 'style', 'tabindex'].forEach(function (a) { klon.removeAttribute(a); });
    klon.setAttribute('class', 'planzeichnung'); klon.setAttribute('role', 'img'); klon.setAttribute('aria-label', tr('druckTitel', { etage: e.name }));
    klon.querySelectorAll('.raster-linie, .griff, .hilfslinie, .hilfsflaeche, .hilfspunkt').forEach(function (n) { n.remove(); });
    klon.querySelectorAll('[tabindex]').forEach(function (n) { n.removeAttribute('tabindex'); n.removeAttribute('role'); });
    klon.style.width = (fit.w * 1000 / N) + 'mm'; klon.style.height = (fit.h * 1000 / N) + 'mm';
    var loc = { de: 'de-DE', en: 'en-GB', ru: 'ru-RU' }[sprachCode()] || 'de-DE';
    var datum = new Intl.DateTimeFormat(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
    var rows = '', sw = 0, sg = 0;
    e.raeume.forEach(function (r) {
      var d = raumDaten(r), w = raumWohn(e, r), art = { voll: 'artVoll', balkon: 'artBalkon', wintergarten: 'artWinter', zubehoer: 'artZubehoer' }[r.art];
      sw += w; sg += d.flaeche;
      rows += '<tr><td>' + esc(r.name) + '</td><td>' + esc(tr(art)) + '</td><td class="z">' + zahl2(d.flaeche, 1) + ' m²</td><td class="z">' + zahl2(w, 1) + ' m²</td></tr>';
    });
    box.setAttribute('lang', sprachCode());
    var nordGrad = plan.nord || 0;
    /* Windrose für den Druck: feste helle Farben (keine Farbvariablen, die im Dunkelmodus dunkel wären), keine IDs */
    var rose = '<svg class="g-druck-rose" viewBox="0 0 64 64" width="84" height="84" role="img" aria-label="' + esc(tr('nordName') + ': ' + tr('nordWert', { grad: nordGrad })) + '">' +
      '<circle cx="32" cy="32" r="24" fill="#ffffff" stroke="#241d2e" stroke-width="2"/>' +
      '<g data-rose-pfeil="1" transform="rotate(' + nordGrad + ' 32 32)"><path d="M32 12 38 34 32 30 26 34Z" fill="#b23b2b" stroke="#241d2e" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<text x="32" y="17" transform="rotate(' + (-nordGrad) + ' 32 17)" text-anchor="middle" dominant-baseline="central" font-family="Manrope, Arial, sans-serif" font-weight="800" font-size="16" fill="#241d2e" stroke="#ffffff" stroke-width="3" paint-order="stroke">' + esc(tr('nordBuchstabe')) + '</text></g>' +
      '<circle cx="32" cy="32" r="3" fill="#241d2e"/></svg>';
    box.innerHTML = '<div class="g-druck-kopf"><div class="g-druck-kopf-text"><h1>' + esc(tr('druckTitel', { etage: e.name })) + '</h1>' +
      '<p class="g-druck-meta">' + esc(tr('druckDatum')) + ': <b>' + esc(datum) + '</b> · ' + esc(tr('druckMassstab')) + ': <b>1:' + N + '</b> · ' + esc(tr('druckHoehe')) + ': <b>' + zahl2(e.hoehe, 2) + ' ' + esc(tr('einheitM')) + '</b> · ' + esc(tr('nordName')) + ': <b>' + (plan.nord || 0) + '°</b></p></div>' + rose + '</div>' +
      '<div class="g-druck-plan"></div>' +
      '<p class="g-druck-klein">' + esc(tr('druckMassstabNote', { n: N })) + '</p>' +
      '<table class="g-druck-tab"><thead><tr><th>' + esc(tr('druckRaum')) + '</th><th>' + esc(tr('druckArt')) + '</th><th class="z">' + esc(tr('druckGrund')) + '</th><th class="z">' + esc(tr('druckWohn')) + '</th></tr></thead><tbody>' + rows +
      '<tr class="summe"><th colspan="2">' + esc(tr('druckSumme')) + '</th><td class="z">' + zahl2(sg, 1) + ' m²</td><td class="z">' + zahl2(sw, 1) + ' m²</td></tr></tbody></table>' +
      '<p class="g-druck-klein">' + esc($('g-wand-hinweis-text').textContent) + ' ' + esc(tr('druckKeinBauplan')) + '</p>';
    box.querySelector('.g-druck-plan').appendChild(klon);
    document.body.classList.add('plan-druck');
    return true;
  }
  function drucken() {
    var ok = false;
    try { ok = druckVorbereiten(); } catch (err) { druckAufraeumen(); meldung(tr('druckFehler', { grund: err && err.message ? err.message : '?' })); return; }
    if (!ok) { meldung(tr('druckLeer')); return; }
    try { window.print(); }
    catch (err) { druckAufraeumen(); meldung(tr('druckFehler', { grund: err && err.message ? err.message : '?' })); }
  }
  window.addEventListener('afterprint', druckAufraeumen);
  if ($('g-drucken')) $('g-drucken').addEventListener('click', drucken);

  /* Mappe (M1): Plan jeder Etage mit Maßen als SVG-Text, mit der Druckvorbereitung von „Plan drucken“; die Etage wird nur vorübergehend gewechselt. */
  function etagenBilder() {
    var vorher = plan.aktiv, out = [];
    try {
      plan.etagen.forEach(function (e, i) {
        if (!e.raeume.length) return;
        plan.aktiv = i;
        if (!druckVorbereiten()) return;
        var n = druckZustand ? druckZustand.N : 0, kl = $('g-druck').querySelector('.planzeichnung');
        if (kl) out.push({ name: e.name, index: i, hoehe: e.hoehe, massstab: n, svg: kl.outerHTML });
        druckAufraeumen();
      });
    } finally {
      plan.aktiv = vorher; druckAufraeumen();
      if (sichtbar && !ansicht3d) zeichnen();
    }
    return out;
  }
  function dreiBilder(richtungen, w, h) {
    if (!window.GRUNDRISS3D || !window.GRUNDRISS3D.fotos) return { fehler: 'webgl' };
    nachfuehrenAlle();
    return window.GRUNDRISS3D.fotos(plan, ART, richtungen, w, h);
  }

  /* Sprache gewechselt: neue Texte in Seitenfeld, Statuszeile, Maßzahlen */
  window.addEventListener('sprachegewechselt', function () {
    if (!$('g-hinweis').hidden) $('g-hinweis-text').textContent = tr('hinweisWand');
    allesZeigen();
  });

  katalogZeigen();
  landAnwenden();
  auswerten();

  window.GRUNDRISS = {
    /* Welle C: grundriss_regeln.js ändert Bundesland, Gebäudeklasse usw. am Plan und ruft dann geaendert(); landMerken merkt das Land für neue Pläne */
    geaendert: function () { speichern(); landAnwenden(); auswerten(); if (sichtbar && !ansicht3d) zeichnen(); },
    landMerken: landMerken,
    zeichnen: function () { if (sichtbar && !ansicht3d) zeichnen(); },
    raumWohn: raumWohn,
    /* von app.js beim Reiterwechsel gerufen: Größe ist erst messbar, wenn der Bereich sichtbar ist */
    zeigt: function (an) {
      sichtbar = !!an;
      if (!sichtbar) { druckAufraeumen(); if (window.GRUNDRISS3D && window.GRUNDRISS3D.pause) window.GRUNDRISS3D.pause(); return; }
      if (!vb) einpassen(); else seitenverhaeltnis();
      allesZeigen(); tipp();
    },
    summen: summen,
    plan: function () { return plan; },
    /* reine Geometrie: Wandstücke einer Etage (Standard: die gezeigte) */
    waende: function (e) { return GEO.waende(e || etage()); },
    nachfuehren: nachfuehrenAlle,
    druckVorbereiten: druckVorbereiten, druckAufraeumen: druckAufraeumen,
    etagenBilder: etagenBilder, dreiBilder: dreiBilder, dateiSichern: function () { return dateiSichern(); },
    /* für Prüfskripte: Plan setzen, geprüft wie beim Datei-Import */
    setzePlan: function (p) { var n = pruefePlan(p); if (!n) return false; plan = n; gewaehlt = null; vb = null; speichern(); allesZeigen(); return true; }
  };
})();
