/* Oberfläche „Strom vom eigenen Dach“ (Welle D, Teil 1). Dieselbe Rechnung (energie_kern.js, rechne()) steckt an zwei Stellen:
   1. als Karte im Bereich „Grundriss und Einrichtung“ (#g-strom-inhalt): die Dachflächen kommen aus dem 3D-Dach der Zeichnung, das Land aus dem Plan;
   2. als eigener kleiner Rechner im Menü (#strom, #s-strom-inhalt): die Dachflächen gibt man selbst ein (Fläche, Himmelsrichtung, Neigung).
   Beide teilen die Eingaben (Personen, Verbrauch, Auto, Speicher …, Schlüssel „immo-strom“), darum zeigen sie bei gleichen Eingaben dieselben Zahlen.
   Alle Texte stehen in daten/texte_energie.js (de/en/ru), alle Zahlen aus daten/energie.js tragen Quelle, Abrufdatum und Status am Wert (R073).
   Keine Anlage-, Steuer- oder Rechtsberatung (R078, R079); Annahmen sind als Annahme gekennzeichnet. */
(function () {
  'use strict';
  var K = window.ENERGIE_KERN, RK = window.REGELN, G = window.GRUNDRISS;
  var SCHLUESSEL = 'immo-strom';
  function tr(k, v) { return window.TXT ? window.TXT.t(k, v) : k; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { return window.TXT ? window.TXT.lang() : 'de'; }
  function nf(d) { return new Intl.NumberFormat(lang(), { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function n0(x) { return nf(0).format(x); }
  function n1(x) { return nf(1).format(x); }
  function n2(x) { return nf(2).format(x); }
  function eur(x) { return n0(x) + ' €'; }
  function datumDe(iso) { var t = String(iso || '').split('-'); return t.length === 3 ? t[2] + '.' + t[1] + '.' + t[0] : String(iso || ''); }
  function symbol(id) { return '<svg class="sym" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function zahlLesen(txt) {
    var s = String(txt == null ? '' : txt).replace(/\s/g, '');
    if (s === '') return NaN;
    s = s.indexOf(',') >= 0 ? s.replace(/\./g, '').replace(',', '.') : s;
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  if (!K || !RK || !G) {
    var f0 = document.getElementById('g-strom-fehler');
    if (f0) { f0.textContent = !K ? 'Der Rechenkern für Solarstrom konnte nicht geladen werden (energie_kern.js).' : 'Die Zeichnung oder die Regeln fehlen.'; f0.hidden = false; }
    return;
  }

  /* ---------- gemeinsame Eingaben ---------- */
  var AUTO_STD = { an: false, km: null, kwh100: null, wallbox: true, geraet: 'mittel', install: 'mittel', kraftstoff: 'benzin', preisBasis: '2025' };
  var S = { personen: 3, verbrauch: null, strompreis: null, steigerung: 0, einspeisung: 'teil', variante: 'keiner', thermie: 'ww', auto: JSON.parse(JSON.stringify(AUTO_STD)),
    frei: { land: null, flaechen: [{ flaeche: 30, richtung: 180, neigung: 35 }], geaendert: false } };
  var speicherFehler = '';
  (function laden() {
    try {
      var raw = localStorage.getItem(SCHLUESSEL);
      if (!raw) return;
      var o = JSON.parse(raw);
      ['personen', 'verbrauch', 'strompreis', 'steigerung', 'einspeisung', 'variante', 'thermie'].forEach(function (k) { if (o[k] !== undefined) S[k] = o[k]; });
      if (o.auto) Object.keys(AUTO_STD).forEach(function (k) { if (o.auto[k] !== undefined) S.auto[k] = o.auto[k]; });
      if (o.frei && o.frei.flaechen && o.frei.flaechen.length) { S.frei.flaechen = o.frei.flaechen.slice(0, 8); S.frei.land = o.frei.land || null; S.frei.geaendert = !!o.frei.geaendert; }
    } catch (e) { speicherFehler = 'laden'; }
  })();
  function speichern() {
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(S)); if (speicherFehler === 'speichern') speicherFehler = ''; }
    catch (e) { speicherFehler = 'speichern'; }
  }

  /* ---------- Bausteine ---------- */
  var STATUS_KEY = { 'geprüft': ['statusGeprueft', 'st-gepr'], 'geprüft (Landesportal)': ['statusPortal', 'st-portal'], 'prüfen vor Nutzung': ['statusPruefen', 'st-pruef'], 'Lücke': ['statusLuecke', 'st-luecke'],
    'eigene Einordnung': ['esStatusEigen', 'st-eigen'], 'Annahme': ['annahme', 'st-annahme'] };
  function badge(status) {
    var s = STATUS_KEY[status] || STATUS_KEY['prüfen vor Nutzung'];
    return '<span class="rg-status ' + s[1] + '" data-status="' + esc(status) + '">' + esc(tr(s[0])) + '</span>';
  }
  function kurz(t) { var s = String(t || ''); var m = /^(.*?)(?:,| \(|:|; )/.exec(s); s = m ? m[1] : s; return s.length > 60 ? s.slice(0, 58) + '…' : s; }
  /* Eine Zahl mit Beleg: Wert, Quelle, Abruf und Status stehen als Daten am Element (Prüfung in tmp/energie_test.py) */
  function zahl(text, b, extra) {
    var q = b ? b.quelle : tr('annahme'), a = b ? b.abruf : '', st = b ? b.status : 'Annahme';
    return '<span class="es-zahl" data-quelle="' + esc(b ? b.id : 'annahme') + '" data-quelle-titel="' + esc(q) + '" data-abruf="' + esc(a) + '" data-status="' + esc(st) + '"' + (extra || '') + '>' + text + '</span>';
  }
  /* Eigene Rechnung mit Annahmen: kein Quellenwert, aber als Annahme gekennzeichnet (Status „Annahme“) */
  function modell() { return { id: 'modell', quelle: tr('esModellQuelle'), abruf: '', status: 'Annahme' }; }
  /* Quellenzeile unter einer Gruppe von Zahlen: Kurzname, Abruf, Status, alles sichtbar */
  function quellen(belege) {
    var seen = {}, teile = [];
    belege.forEach(function (b) {
      if (!b) return;
      var k = kurz(b.quelle) + '|' + b.abruf + '|' + b.status;
      if (seen[k]) return; seen[k] = 1;
      teile.push('<span class="es-qeintrag">' + esc(kurz(b.quelle)) + ' · ' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) + ' ' + badge(b.status) + '</span>');
    });
    return teile.length ? '<p class="klein es-q" lang="de"><b>' + esc(tr('regQuelle')) + ':</b> ' + teile.join(' · ') + '</p>' : '';
  }
  function annahmeZeile(textKey, par) {
    return '<span class="annahme es-an">' + esc(tr('annahme')) + '</span> ' + esc(tr(textKey, par));
  }
  var hilfeNr = 0;
  function hilfe(innerHtml, label) {
    var id = 'es-h' + (++hilfeNr);
    return '<button type="button" class="hilfe-knopf es-hk" data-hilfe="' + id + '" aria-expanded="false" aria-controls="' + id + '" aria-label="' + esc(label || tr('hilfeKnopf')) + '">?</button>' +
      '<div class="es-hilfe" id="' + id + '" hidden>' + innerHtml + '</div>';
  }
  function belegBox(b) {
    if (!b) return '';
    return '<div class="rg-beleg" data-beleg="' + esc(b.id) + '"><p class="rg-beleg-kopf" lang="de"><b>' + esc(b.name || b.id) + '</b>' + (b.paragraf ? ' · ' + esc(b.paragraf) : '') + '</p>' +
      '<p class="rg-beleg-meta">' + badge(b.status) + ' <span class="rg-abruf" data-abruf="' + esc(b.abruf) + '">' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) + '</span>' +
      (b.gilt_ab ? ' <span class="rg-gilt">' + esc(tr('regGiltAb', { datum: datumDe(b.gilt_ab) })) + '</span>' : '') + (b.gilt_bis ? ' <span class="rg-gilt">' + esc(tr('regGiltBis', { datum: datumDe(b.gilt_bis) })) + '</span>' : '') + '</p>' +
      (b.hinweis ? '<p class="klein" lang="de">' + esc(b.hinweis) + '</p>' : '') +
      '<p class="klein rg-quellen" lang="de">' + (b.url && /^https?:/.test(b.url) ? '<a class="rg-quelle" href="' + esc(b.url) + '" target="_blank" rel="noopener">' + esc(tr('regQuelle')) + ': ' + esc(b.quelle) + '</a>' : '<span class="rg-ohne-link">' + esc(tr('regQuelle')) + ': ' + esc(b.quelle) + '</span>') + '</p></div>';
  }
  function balken(anteil, klasse, label) {
    var w = Math.max(0, Math.min(1, anteil)) * 100;
    return '<div class="es-balken" role="img" aria-label="' + esc(label) + '"><span class="es-b ' + (klasse || 'c1') + '" style="width:' + w.toFixed(1) + '%"></span></div>';
  }
  function stapel(teile, label) {
    var sum = teile.reduce(function (a, t) { return a + t.wert; }, 0) || 1;
    return '<div class="es-balken es-stapel" role="img" aria-label="' + esc(label) + '">' + teile.map(function (t) {
      return '<span class="es-b ' + t.klasse + '" style="width:' + (100 * t.wert / sum).toFixed(1) + '%"></span>'; }).join('') + '</div>';
  }
  function richtungWort(grad) {
    if (grad == null) return tr('dreiSflach');
    var N = ['dreiRnN', 'dreiRnNO', 'dreiRnO', 'dreiRnSO', 'dreiRnS', 'dreiRnSW', 'dreiRnW', 'dreiRnNW'];
    return tr(N[K.himmelIndex(grad)]);
  }
  var KLASSE_KEY = { sehrgut: 'dreiKsehrgut', gut: 'dreiKgut', maessig: 'dreiKmaessig', schlecht: 'dreiKschlecht' };
  var KLASSE_BALKEN = { sehrgut: 'gut', gut: 'gut2', maessig: 'warn', schlecht: 'schlecht' };

  /* ---------- Instanzen ---------- */
  var instanzen = [];
  var planSig = '', planAuswahl = null, planFlaechen = null, planFehler = null;
  var timer = null;

  function landVon(inst) {
    if (inst.modus === 'plan') { var p = G.plan(); return RK.landOk(p && p.land) ? p.land : 'HB'; }
    return RK.landOk(S.frei.land) ? S.frei.land : (function () { var p = G.plan(); return RK.landOk(p && p.land) ? p.land : 'HB'; })();
  }
  function planDach(land) {
    var stadt = RK.landInfo(land).stadt, p = G.plan();
    var r = K.dachflaechen(p, stadt);
    var sig = land + '|' + JSON.stringify(r.flaechen.map(function (f) { return [f.neigung, f.richtung, Math.round(f.flaeche * 10)]; })) + '|' + (r.fehler || '');
    if (sig !== planSig) { planSig = sig; planAuswahl = K.besteFlaechen(r.flaechen); }
    planFlaechen = r.flaechen; planFehler = r.fehler;
    return r;
  }
  function freiFlaechen(land) {
    var stadt = RK.landInfo(land).stadt;
    return S.frei.flaechen.map(function (f, i) {
      var fl = { n: i + 1, flaeche: +f.flaeche || 0, neigung: Math.max(0, Math.min(80, Math.round(+f.neigung || 0))), richtung: (+f.neigung || 0) <= 0 ? null : (((+f.richtung || 0) % 360) + 360) % 360 };
      return K.flacheMitErtrag(fl, stadt);
    });
  }
  function eingaben(inst) {
    var land = landVon(inst), fl, auswahl;
    if (inst.modus === 'plan') { planDach(land); fl = planFlaechen || []; auswahl = planAuswahl || []; fl = fl.map(function (f) { var c = JSON.parse(JSON.stringify(f)); c.gewaehlt = auswahl.indexOf(f.n) >= 0; return c; }); }
    else { fl = freiFlaechen(land).map(function (f, i) { f.gewaehlt = true; return f; }); }
    return { land: land, flaechenAlle: fl, rechnung: {
      land: land, flaechen: fl, personen: S.personen, verbrauchEigen: S.verbrauch, strompreisCt: S.strompreis, steigerung: S.steigerung, einspeisung: S.einspeisung,
      varianteWahl: S.variante, auto: S.auto } };
  }

  /* ---------- Gerüst einer Instanz ---------- */
  function schritt(nr, icon, key, innen, id) {
    return '<section class="es-schritt"' + (id ? ' id="' + id + '"' : '') + '><h4 class="es-h"><span class="es-nr" aria-hidden="true">' + nr + '</span>' + symbol(icon) + '<span>' + esc(tr(key)) + '</span></h4>' + innen + '</section>';
  }
  function chips(feld, liste, aktuell) {
    return '<div class="es-chips" role="group">' + liste.map(function (x) {
      return '<button type="button" class="chip" data-akt="wahl" data-feld="' + feld + '" data-wert="' + esc(x[0]) + '" aria-pressed="' + (String(aktuell) === String(x[0]) ? 'true' : 'false') + '">' + esc(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function geruestHtml(inst) {
    var plan = inst.modus === 'plan', p = inst.pre;
    var h = '<div class="es" data-modus="' + inst.modus + '">';
    h += '<p class="klein es-intro">' + esc(tr('esKwpErkl')) + ' <button type="button" class="chip" data-akt="zum-ergebnis">' + esc(tr('esZumErgebnis')) + ' ↓</button></p>';
    /* 1 Dach */
    var dach = '<div data-b="land"></div><div data-b="flaechen" aria-live="polite"></div>';
    h += schritt(1, 'i-dach', 'esH1', dach);
    /* 2 Haushalt */
    var haus = '<div class="es-raster">' +
      '<div class="es-feld"><label class="es-label" for="' + p + 'pers">' + esc(tr('esPersonen')) + '</label><div class="g-schritter"><button type="button" class="chip" data-akt="persminus" aria-label="' + esc(tr('esWeniger')) + '">−</button><span class="g-schritter-zahl" id="' + p + 'pers" data-b="pers" aria-live="polite"></span><button type="button" class="chip" data-akt="persplus" aria-label="' + esc(tr('esMehr')) + '">+</button></div></div>' +
      '<div class="es-feld"><label class="es-label" for="' + p + 'verbr">' + esc(tr('esVerbrauch')) + '</label><input type="text" inputmode="decimal" id="' + p + 'verbr" data-f="verbrauch" placeholder="" aria-describedby="' + p + 'verbr-f"><div class="fehler" id="' + p + 'verbr-f" role="alert"></div><p class="klein" data-b="verbrHinweis"></p></div>' +
      '<div class="es-feld"><label class="es-label" for="' + p + 'preis">' + esc(tr('esStrompreis')) + '</label><input type="text" inputmode="decimal" id="' + p + 'preis" data-f="strompreis" aria-describedby="' + p + 'preis-f"><div class="fehler" id="' + p + 'preis-f" role="alert"></div><p class="klein" data-b="preisHinweis"></p></div>' +
      '<div class="es-feld"><span class="es-label" id="' + p + 'einsp-l">' + esc(tr('esEinspeisung')) + '</span>' + chips('einspeisung', [['teil', tr('esTeil')], ['voll', tr('esVoll')]], S.einspeisung) + '<p class="klein">' + esc(tr('esEinspHilfe')) + '</p></div>' +
      '<div class="es-feld"><label class="es-label" for="' + p + 'steig">' + esc(tr('esSteigerung')) + ' <b data-b="steigWert"></b></label><input type="range" id="' + p + 'steig" data-f="steigerung" min="0" max="5" step="0.5"><p class="klein">' + annahmeZeile('esSteigHilfe') + '</p></div>' +
      '</div>';
    h += schritt(2, 'i-haus', 'esH2', haus);
    /* 3 Auto */
    var auto = '<label class="es-haken"><input type="checkbox" data-f="auto-an"> <span>' + esc(tr('esAutoAn')) + '</span></label><div data-b="autoFeld" hidden>' +
      '<div class="es-raster">' +
      '<div class="es-feld"><label class="es-label" for="' + p + 'km">' + esc(tr('esKm')) + '</label><input type="text" inputmode="decimal" id="' + p + 'km" data-f="km" aria-describedby="' + p + 'km-f"><div class="fehler" id="' + p + 'km-f" role="alert"></div><p class="klein" data-b="kmHinweis"></p></div>' +
      '<div class="es-feld"><label class="es-label" for="' + p + 'k100">' + esc(tr('esKwh100')) + '</label><input type="text" inputmode="decimal" id="' + p + 'k100" data-f="kwh100" aria-describedby="' + p + 'k100-f"><div class="fehler" id="' + p + 'k100-f" role="alert"></div>' +
      '<div class="es-chips" data-b="klassen"></div><p class="klein" data-b="k100Hinweis"></p></div>' +
      '<div class="es-feld"><span class="es-label">' + esc(tr('esKraftstoff')) + '</span>' + chips('kraftstoff', [['benzin', tr('esBenzin')], ['diesel', tr('esDiesel')]], S.auto.kraftstoff) + chips('preisBasis', [['2025', tr('esPreis2025')], ['sep2026', tr('esPreisSep')]], S.auto.preisBasis) + '<p class="klein" data-b="preisLHinweis"></p></div>' +
      '<div class="es-feld"><label class="es-haken"><input type="checkbox" data-f="wallbox"> <span>' + esc(tr('esWallbox')) + '</span></label>' +
      '<div data-b="wallboxFeld"><span class="es-label">' + esc(tr('esGeraet')) + '</span>' + chips('geraet', [['einfach', tr('esEinfach')], ['mittel', tr('esMittel')], ['premium', tr('esPremium')]], S.auto.geraet) +
      '<span class="es-label">' + esc(tr('esInstall')) + '</span>' + chips('install', [['gering', tr('esGering')], ['mittel', tr('esMittel')], ['hoch', tr('esHoch')]], S.auto.install) + '<p class="klein" data-b="wallboxHinweis"></p></div></div>' +
      '</div></div>';
    h += schritt(3, 'i-auto', 'esH3', auto);
    /* 4 bis 7 Ergebnisse */
    h += schritt(4, 'i-batterie', 'esH4', '<div data-b="varianten" aria-live="polite"></div>');
    h += schritt(5, 'i-rechner', 'esH5', '<div data-b="ergebnis" aria-live="polite"></div>');
    h += schritt(6, 'i-paragraf', 'esH6', '<div data-b="regeln"></div>');
    h += schritt(7, 'i-sonne', 'esH7', '<div data-b="thermie"></div>');
    h += '<section class="es-schritt es-annahmen"><h4 class="es-h">' + symbol('i-waage') + '<span>' + esc(tr('esAnnahmenTitel')) + '</span></h4><div data-b="annahmen"></div></section>';
    h += '<p class="fehler" data-b="fehler" role="alert" hidden></p><div class="meldung" data-b="meldung" role="status" aria-live="polite"></div>';
    return h + '</div>';
  }

  function b(inst, name) { return inst.wurzel.querySelector('[data-b="' + name + '"]'); }
  function f(inst, name) { return inst.wurzel.querySelector('[data-f="' + name + '"]'); }

  /* ---------- Teile ---------- */
  function htmlLand(inst, land) {
    if (inst.modus === 'plan') {
      return '<p class="es-landzeile">' + symbol('i-karte') + ' ' + esc(tr('esLandPlan', { land: RK.landInfo(land).name, stadt: RK.landInfo(land).stadt })) + ' <a href="#" class="es-link" data-akt="land-aendern">' + esc(tr('esLandAendern')) + '</a></p>';
    }
    return '<div class="es-feld"><label class="es-label" for="' + inst.pre + 'land">' + esc(tr('esLandWahl')) + '</label><select id="' + inst.pre + 'land" data-f="land">' +
      RK.LAENDER.map(function (l) { return '<option value="' + l.k + '"' + (l.k === land ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select>' +
      '<p class="klein">' + esc(tr('esLandHinweis', { stadt: RK.landInfo(land).stadt })) + '</p></div>';
  }
  function htmlFlaechenPlan(inst, ein) {
    if (planFehler) {
      var k = planFehler === 'keinDach' ? 'esKeinDach' : 'esKeineRaeume';
      return '<div class="rg-leer es-leer">' + symbol('i-dach') + '<p>' + esc(tr(k)) + '</p></div>' +
        '<div class="knopfreihe"><button type="button" class="knopf zweit" data-ziel="strom">' + esc(tr('esZumRechner')) + '</button></div>';
    }
    var best = Math.max.apply(null, ein.flaechenAlle.map(function (x) { return x.ey || 0; }).concat([1]));
    var rows = ein.flaechenAlle.map(function (x) {
      var id = inst.pre + 'fl' + x.n, anteil = x.ey != null ? x.ey / best : 0;
      return '<li class="es-flaeche"><label class="es-fl-kopf" for="' + id + '"><input type="checkbox" id="' + id + '" data-akt="fl" data-n="' + x.n + '"' + (x.gewaehlt ? ' checked' : '') + '> ' +
        '<span class="es-fl-name"><b>' + esc(tr('esFlaecheName', { n: x.n, richtung: richtungWort(x.richtung) })) + '</b> <span class="klein">' + esc(tr('esFlaecheDaten', { neigung: x.neigung, m2: n1(x.flaeche) })) + '</span></span></label>' +
        (x.ey != null ? '<div class="es-fl-wert">' + balken(anteil, KLASSE_BALKEN[x.klasse] || 'c1', tr('esErtragBalken', { ey: n0(x.ey) })) +
          '<span class="es-fl-zahl">' + zahl(tr('esEyWert', { ey: n0(x.ey) }), ein.belegPv, ' data-ey="' + x.ey + '"') + ' <span class="es-fl-klasse">' + esc(tr(KLASSE_KEY[x.klasse] || 'dreiKschlecht')) + '</span> <span class="annahme es-an">' + esc(tr('esStatusEigen')) + '</span></span></div>'
          : '<p class="fehler">' + esc(tr('esKeinErtrag', { stadt: RK.landInfo(ein.land).stadt })) + '</p>') + '</li>';
    }).join('');
    return '<ul class="es-flaechen">' + rows + '</ul><div class="knopfreihe es-fl-knoepfe"><button type="button" class="knopf zweit" data-akt="beste">' + symbol('i-stern') + esc(tr('esBeste')) + '</button>' +
      '<button type="button" class="knopf zweit" data-akt="alle">' + esc(tr('esAlle')) + '</button></div>' +
      '<p class="klein es-q" lang="de"><b>' + esc(tr('regQuelle')) + ':</b> PVGIS (EU-Kommission), ' + esc(tr('regAbruf', { datum: datumDe(ein.pvAbruf) })) + ' ' + badge('geprüft') + ' · ' + esc(tr('esPvgisHinweis', { stadt: RK.landInfo(ein.land).stadt })) + '</p>';
  }
  function htmlFlaechenFrei(inst, ein) {
    var rows = S.frei.flaechen.map(function (x, i) {
      var id = inst.pre + 'ff' + i, fl = ein.flaechenAlle[i];
      return '<li class="es-frei-zeile" data-i="' + i + '"><div class="es-frei-felder">' +
        '<div class="es-feld"><label class="es-label" for="' + id + 'm">' + esc(tr('esFlFlaeche')) + '</label><input type="text" inputmode="decimal" id="' + id + 'm" data-ff="flaeche" data-i="' + i + '" value="' + esc(n1(+x.flaeche || 0).replace(/ /g, '')) + '" aria-describedby="' + id + 'f"></div>' +
        '<div class="es-feld"><label class="es-label" for="' + id + 'r">' + esc(tr('esFlRichtung')) + '</label><select id="' + id + 'r" data-ff="richtung" data-i="' + i + '">' +
        [0, 45, 90, 135, 180, 225, 270, 315].map(function (g) { return '<option value="' + g + '"' + (K.himmelIndex(+x.richtung || 0) * 45 === g ? ' selected' : '') + '>' + esc(richtungWort(g)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="es-feld"><label class="es-label" for="' + id + 'n">' + esc(tr('esFlNeigung')) + ' <b data-b="neig' + i + '">' + (+x.neigung || 0) + '°</b></label><input type="range" id="' + id + 'n" data-ff="neigung" data-i="' + i + '" min="0" max="60" step="1" value="' + (+x.neigung || 0) + '"></div>' +
        '</div><div class="fehler" id="' + id + 'f" role="alert"></div>' +
        '<div class="es-fl-wert" data-b="ff' + i + '">' + (fl && fl.ey != null ? balken(fl.ey / Math.max(1, fl.ey, 1100), KLASSE_BALKEN[fl.klasse] || 'c1', tr('esErtragBalken', { ey: n0(fl.ey) })) + '<span class="es-fl-zahl">' + zahl(tr('esEyWert', { ey: n0(fl.ey) }), ein.belegPv, ' data-ey="' + fl.ey + '"') + '</span>' : '') + '</div>' +
        (S.frei.flaechen.length > 1 ? '<button type="button" class="chip etage-weg" data-akt="ff-weg" data-i="' + i + '" aria-label="' + esc(tr('esFlWeg')) + '">✕ <span>' + esc(tr('esFlWeg')) + '</span></button>' : '') + '</li>';
    }).join('');
    var plan = G.plan(), hat = false;
    try { hat = K.dachflaechen(plan, RK.landInfo(landVon(inst)).stadt).flaechen.length > 0; } catch (e) { hat = false; }
    return '<ul class="es-flaechen es-frei">' + rows + '</ul><div class="knopfreihe">' +
      (S.frei.flaechen.length < 8 ? '<button type="button" class="knopf zweit" data-akt="ff-neu">' + symbol('i-dach') + esc(tr('esFlNeu')) + '</button>' : '') +
      (hat ? '<button type="button" class="knopf zweit" data-akt="ff-plan">' + symbol('i-grundriss') + esc(tr('esAusPlan')) + '</button>' : '') + '</div>' +
      '<div class="g-frage es-frage" data-b="ffFrage" hidden><p>' + esc(tr('esAusPlanFrage')) + '</p><div class="knopfreihe"><button type="button" class="knopf" data-akt="ff-plan-ja">' + esc(tr('esErsetzen')) + '</button><button type="button" class="knopf zweit" data-akt="ff-plan-nein">' + esc(tr('esAbbrechen')) + '</button></div></div>' +
      '<p class="klein es-q" lang="de"><b>' + esc(tr('regQuelle')) + ':</b> PVGIS (EU-Kommission), ' + esc(tr('regAbruf', { datum: datumDe(ein.pvAbruf) })) + ' ' + badge('geprüft') + ' · ' + esc(tr('esPvgisHinweis', { stadt: RK.landInfo(ein.land).stadt })) + '</p>';
  }

  /* Welle D, Teil 2b (Nachtrag): Die Amortisation rechnet mit gleichbleibendem Strompreis, solange der Regler 0 % steht; das sagt dieser Hinweis daneben (auch bei eigenem Strompreis).
     Steht der Regler über 0, nennt der Hinweis den gewählten Anstieg, damit er nie das Falsche behauptet. */
  function anstiegHinweis(tag) {
    var s = +S.steigerung > 0 ? tr('esAnSteig', { p: n1(S.steigerung) }) : tr('esOhneAnstieg');
    return '<' + tag + ' class="klein es-anstieg-hinweis" data-anstieg="' + (+S.steigerung > 0 ? n1(S.steigerung) : '0') + '">' + esc(s) + '</' + tag + '>';
  }
  function htmlVarianten(res, ein) {
    var v = res.varianten, namen = { keiner: tr('esOhneSpeicher'), klein: tr('esKleinSp', { kwh: K.ANNAHMEN.speicherKlein }), gross: tr('esGrossSp', { kwh: K.ANNAHMEN.speicherGross }) };
    var maxInv = Math.max(v.gross.invest, 1), maxEv = Math.max(res.erzeugung, 1);
    var cards = ['keiner', 'klein', 'gross'].map(function (k) {
      var x = v[k], gew = res.gewaehlteVariante === k;
      var am = x.amortJahr != null ? tr('esAmortJahr', { jahr: x.amortJahr }) : tr('esAmortNie', { n: K.ANNAHMEN.horizont });
      return '<button type="button" class="es-var" data-akt="variante" data-wert="' + k + '" aria-pressed="' + (gew ? 'true' : 'false') + '">' +
        '<span class="es-var-kopf">' + symbol(k === 'keiner' ? 'i-sonne' : 'i-batterie') + '<b>' + esc(namen[k]) + '</b>' + (gew ? '<span class="es-gew">' + esc(tr('esGewaehlt')) + '</span>' : '') + '</span>' +
        '<span class="es-var-zeile"><span>' + esc(tr('esAutarkie')) + '</span><b>' + zahl(n0(x.autarkie * 100) + ' %', modell(), ' data-var="' + k + '-autarkie" data-wert="' + (x.autarkie * 100).toFixed(2) + '"') + '</b></span>' + balken(x.autarkie, 'c1', tr('esAutarkie') + ' ' + n0(x.autarkie * 100) + ' %') +
        '<span class="es-var-zeile"><span>' + esc(tr('esEigenverbrauch')) + '</span><b>' + zahl(n0(x.ev) + ' kWh', modell(), ' data-var="' + k + '-ev" data-wert="' + x.ev.toFixed(1) + '"') + '</b></span>' + balken(x.ev / maxEv, 'c2', tr('esEigenverbrauch') + ' ' + n0(x.ev) + ' kWh') +
        '<span class="es-var-zeile"><span>' + esc(tr('esInvest')) + '</span><b>' + zahl(eur(x.invest), res.preis ? K.beleg(res.preis.eintrag) : modell(), ' data-var="' + k + '-invest" data-wert="' + x.invest.toFixed(0) + '"') + '</b></span>' + balken(x.invest / maxInv, 'c3', tr('esInvest') + ' ' + eur(x.invest)) +
        '<span class="es-var-zeile"><span>' + esc(tr('esAmortisation')) + '</span><b>' + zahl(esc(am), modell(), ' data-var="' + k + '-amort" data-wert="' + (x.amortJahr == null ? '' : x.amortJahr) + '"') + '</b></span>' + anstiegHinweis('span') + '</button>';
    }).join('');
    var sp = res.varianten.klein.speicherPreis, sg = res.varianten.gross.speicherPreis;
    var q = quellen([K.beleg(K.eint('eigenverbrauch', 'ev_autarkie')), K.beleg(K.eint('speicher', 'sp_groesse')), sp && K.beleg(sp.eintrag), sg && K.beleg(sg.eintrag), K.beleg(K.eint('speicher', 'sp_lebensdauer')), K.beleg(K.eint('speicher', 'sp_ersatz'))]);
    return '<div class="es-vars">' + cards + '</div><p class="klein">' + annahmeZeile('esSpeicherAnnahme', { klein: K.ANNAHMEN.speicherKlein, gross: K.ANNAHMEN.speicherGross }) + '</p>' + q +
      '<p class="klein">' + annahmeZeile('esSpeicherErsatz', { jahr: K.ANNAHMEN.spJahr }) + '</p>';
  }

  function cashflowSvg(x, titel) {
    var W = 520, H = 170, pad = 6, n = x.kum.length, bw = (W - 2 * pad) / n;
    var min = Math.min.apply(null, x.kum.concat([0])), max = Math.max.apply(null, x.kum.concat([0])), span = (max - min) || 1;
    var y0 = pad + (H - 2 * pad - 18) * (max / span);
    var s = '<svg class="es-cash" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(titel) + '" focusable="false"><line class="es-null" x1="0" x2="' + W + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '"/>';
    x.kum.forEach(function (v, i) {
      var h = Math.abs(v) / span * (H - 2 * pad - 18), neg = v < 0, top = neg ? y0 : y0 - h, mark = x.amortJahr === i;
      s += '<rect class="es-bar ' + (neg ? 'neg' : 'pos') + (mark ? ' mark' : '') + '" data-jahr="' + i + '" data-kum="' + v.toFixed(0) + '" x="' + (pad + i * bw + 1).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + Math.max(2, bw - 2).toFixed(1) + '" height="' + Math.max(1, h).toFixed(1) + '"><title>' + esc(tr('esJahrTitel', { jahr: i, wert: eur(v) })) + '</title></rect>';
      if (i % 5 === 0 || mark) s += '<text class="es-jt" x="' + (pad + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + i + '</text>';
    });
    return s + '</svg>';
  }

  function htmlErgebnis(res, ein) {
    var x = res.varianten[res.gewaehlteVariante], eeg = res.eeg, h = '';
    var am = x.amortJahr != null ? tr('esSatzAmort', { jahr: x.amortJahr, genau: n1(x.amortGenau) }) : tr('esSatzNie', { n: K.ANNAHMEN.horizont });
    h += '<p class="es-satz" data-satz="1">' + tr('esSatz', { kwp: zahl(n1(res.kwp), modell(), ' data-wert="' + res.kwp.toFixed(3) + '"'), kwh: zahl(n0(res.erzeugung), ein.belegPv, ' data-wert="' + res.erzeugung.toFixed(0) + '"'), am: zahl(esc(am), modell(), ' data-wert="' + (x.amortGenau == null ? '' : x.amortGenau.toFixed(2)) + '"') }) + '</p>' + anstiegHinweis('p');
    /* Erzeugung */
    h += '<div class="es-zeile"><span class="es-z-name">' + symbol('i-sonne') + esc(tr('esErzeugung')) + '</span><b>' + zahl(n0(res.erzeugung) + ' kWh', ein.belegPv, ' data-wert="' + res.erzeugung.toFixed(1) + '"') + '</b></div>' +
      stapel([{ wert: x.ev, klasse: 'c1' }, { wert: x.einsp, klasse: 'c2' }], tr('esEvEinspBalken', { ev: n0(x.ev), e: n0(x.einsp) })) +
      '<p class="es-legende"><span><i class="sw c1"></i>' + esc(tr('esEigenverbrauch')) + ' ' + n0(x.ev) + ' kWh (' + n0(x.eigenQuote * 100) + ' %)</span> <span><i class="sw c2"></i>' + esc(tr('esEinspeisungKwh')) + ' ' + n0(x.einsp) + ' kWh</span></p>' +
      '<p class="klein">' + esc(tr('esErzeugungFormel', { flaeche: n1(res.flaecheGesamt), nutz: n1(res.flaecheNutz), m2: n1(res.m2JeKwp), kwp: n2(res.kwp), ey: n0(res.eyMittel) })) + ' ' + annahmeZeile('esNutzAnteil', { p: n0(K.ANNAHMEN.nutzanteil * 100) }) + '</p>';
    /* Autarkie */
    h += '<div class="es-zeile"><span class="es-z-name">' + symbol('i-blitz') + esc(tr('esAutarkieStrom')) + '</span><b>' + zahl(n0(x.autarkie * 100) + ' %', modell(), ' data-wert="' + (x.autarkie * 100).toFixed(2) + '" data-b-autarkie="1"') + '</b></div>' +
      balken(x.autarkie, 'c1', tr('esAutarkieStrom') + ' ' + n0(x.autarkie * 100) + ' %') +
      '<p class="klein">' + esc(tr('esAutarkieErkl', { v: n0(res.verbrauch.gesamt), ev: n0(x.ev) })) + ' ' + annahmeZeile('esEvModell') + '</p>';
    /* Geld */
    var kw = res.steuer;
    h += '<dl class="es-geld">' +
      '<div><dt>' + esc(tr('esSparNetz')) + '</dt><dd>' + zahl(eur(x.einnahmenEv1), res.strompreis.beleg, ' data-wert="' + x.einnahmenEv1.toFixed(2) + '" data-b-geld="spar"') + '<span class="klein"> ' + esc(tr('esSparNetzRechnung', { kwh: n0(x.ev), ct: n1(res.strompreis.ct) })) + '</span></dd></div>' +
      '<div><dt>' + esc(tr('esEinspVerg')) + '</dt><dd>' + (eeg ? zahl(eur(x.einnahmenEinsp1), eeg.eintraege[0], ' data-wert="' + x.einnahmenEinsp1.toFixed(2) + '" data-b-geld="eeg"') + '<span class="klein"> ' + esc(tr('esEinspRechnung', { kwh: n0(x.einsp), ct: n2(eeg.ct) })) + '</span>' : '-') + '</dd></div>' +
      '<div><dt>' + esc(tr('esBetrieb')) + '</dt><dd>' + zahl('−' + eur(x.kosten1), res.betrieb.beleg, ' data-wert="' + x.kosten1.toFixed(2) + '"') + '<span class="klein"> ' + esc(tr('esBetriebRechnung', { p: n0(res.betrieb.prozent) })) + '</span></dd></div>' +
      '<div class="gesamt"><dt>' + esc(tr('esNetto1')) + '</dt><dd><b>' + zahl(eur(x.netto1), modell(), ' data-wert="' + x.netto1.toFixed(2) + '"') + '</b></dd></div>' +
      '<div><dt>' + esc(tr('esInvestGesamt')) + '</dt><dd>' + (res.preis ? zahl(eur(x.invest), K.beleg(res.preis.eintrag), ' data-wert="' + x.invest.toFixed(0) + '" data-b-geld="invest"') + '<span class="klein"> ' + esc(tr('esInvestRechnung', { kwp: n2(res.kwp), eur: n0(res.preis.eurKwp) })) + '</span>' : '-') + '</dd></div>' +
      '</dl>';
    var q = [res.strompreis.beleg, res.betrieb.beleg, res.degradation.beleg, res.preis && K.beleg(res.preis.eintrag)];
    if (eeg) q = q.concat(eeg.eintraege.slice(0, 1), [K.beleg(K.eint('eeg', 'eeg_anteilig'))]);
    h += quellen(q);
    if (res.preis && res.preis.unterStaffel) h += '<p class="es-warn">' + esc(tr('esUnterStaffel')) + '</p>';
    if (eeg) {
      var teile = eeg.stufen.filter(function (s) { return s.kw > 0; }).map(function (s) { return n1(s.kw) + ' kW × ' + n2(s.ct) + ' ct'; }).join(' + ');
      h += '<p class="klein es-eeg" data-eeg-ct="' + eeg.ct.toFixed(4) + '">' + esc(tr('esEegAnteilig', { ct: n2(eeg.ct), teile: teile })) + ' ' + hilfe(belegBox(eeg.eintraege[0]) + belegBox(K.beleg(K.eint('eeg', 'eeg_anteilig'))), tr('regBelegKnopf')) + '</p>';
      if (eeg.ausserhalb) h += '<p class="es-warn" role="status" data-warn="eeg-datum">' + esc(tr('esEegAusserhalb', { heute: datumDe(eeg.datum), von: datumDe(eeg.gilt_ab), bis: datumDe(eeg.gilt_bis) })) + '</p>';
      else h += '<p class="klein">' + esc(tr('esEegGilt', { von: datumDe(eeg.gilt_ab), bis: datumDe(eeg.gilt_bis) })) + '</p>';
      if (eeg.kwOhneVerguetung > 0) h += '<p class="es-warn">' + esc(tr('esEegUeber100', { kw: n1(eeg.kwOhneVerguetung) })) + '</p>';
      h += '<p class="klein">' + annahmeZeile('esEegNach20', { n: K.ANNAHMEN.eegJahre }) + '</p>';
    }
    h += '<p class="klein">' + annahmeZeile('esDegr', { p: n1(res.degradation.prozent) }) + ' ' + annahmeZeile('esErsatzWr', { jahr: K.ANNAHMEN.wrJahr }) + '</p>';
    /* Steuer */
    h += '<div class="es-steuer"><p>' + symbol('i-paragraf') + ' ' + esc(tr(kw.ust0 ? 'esUst0' : 'esUstUeber', { kwp: n0(kw.schwelleKwp) })) + '</p><p>' + symbol('i-paragraf') + ' ' + esc(tr(kw.estFrei ? 'esEstFrei' : 'esEstUeber', { kwp: n0(kw.schwelleKwp) })) + '</p>' +
      quellen(kw.beleg) + '<p class="klein">' + esc(tr('esSteuerBerater')) + '</p></div>';
    /* Jahre */
    h += '<h5 class="es-h5">' + esc(tr('esJahreTitel')) + '</h5>' + cashflowSvg(x, tr('esJahreBalken', { jahr: x.amortJahr == null ? '–' : x.amortJahr })) +
      '<p class="es-legende"><span><i class="sw neg"></i>' + esc(tr('esNochNichtDrin')) + '</span> <span><i class="sw pos"></i>' + esc(tr('esDrin')) + '</span></p>';
    /* Auto */
    if (res.auto.an) {
      var a = res.auto, vg = a.vergleich, mx = Math.max(vg.tanken, vg.netz, vg.mitAnlage, 1);
      h += '<h5 class="es-h5">' + symbol('i-auto') + ' ' + esc(tr('esAutoTitel', { km: n0(a.km) })) + '</h5>' +
        '<div class="es-auto-zeilen">' +
        '<div class="es-az"><span>' + esc(tr(a.kraftstoff === 'diesel' ? 'esAzDiesel' : 'esAzBenzin', { l: n0(a.liter), p: n2(a.preisL) })) + '</span><b>' + zahl(eur(vg.tanken), a.belege.preis, ' data-auto="tanken" data-wert="' + vg.tanken.toFixed(2) + '"') + '</b></div>' + balken(vg.tanken / mx, 'c3', tr('esAzTanken') + ' ' + eur(vg.tanken)) +
        '<div class="es-az"><span>' + esc(tr('esAzNetz', { kwh: n0(a.kwh), ct: n1(res.strompreis.ct) })) + '</span><b>' + zahl(eur(vg.netz), res.strompreis.beleg, ' data-auto="netz" data-wert="' + vg.netz.toFixed(2) + '"') + '</b></div>' + balken(vg.netz / mx, 'c2', tr('esAzNetz', { kwh: n0(a.kwh), ct: n1(res.strompreis.ct) }) + ' ' + eur(vg.netz)) +
        '<div class="es-az"><span>' + esc(tr('esAzAnlage', { p: n0(vg.anteilDach * 100) })) + '</span><b>' + zahl(eur(vg.mitAnlage), modell(), ' data-auto="anlage" data-wert="' + vg.mitAnlage.toFixed(2) + '"') + '</b></div>' + balken(vg.mitAnlage / mx, 'c1', tr('esAzAnlage', { p: n0(vg.anteilDach * 100) }) + ' ' + eur(vg.mitAnlage)) + '</div>' +
        '<p class="klein">' + esc(tr('esAutoVerbrauchFormel', { km: n0(a.km), k100: n1(a.kwh100), kwh: n0(a.kwh), l100: n1(a.liter / a.km * 100) })) + '</p>' +
        '<p class="klein">' + esc(tr('esAutoVerlust', { von: n1(a.belege.verlust.von), bis: n1(a.belege.verlust.bis) })) + '</p>';
      var mA = x.mitAuto;
      h += '<p class="es-satz klein-satz" data-satz="auto">' + esc(mA.amortGenau != null ? tr('esAutoAmort', { invest: eur(mA.invest), wb: eur(a.wallbox.summe), jahre: n1(mA.amortGenau) }) : tr('esAutoNie', { n: K.ANNAHMEN.horizont, invest: eur(mA.invest) })) + '</p>';
      h += '<p class="klein">' + annahmeZeile('esAutoOhneFahrzeug') + '</p>';
      h += '<p class="klein">' + annahmeZeile('esWallboxMitte') + ' ' + esc(tr('esWallboxKosten', { geraet: eur(a.wallbox.geraet), install: eur(a.wallbox.install) })) + '</p>';
      h += '<div class="es-steuer"><p>' + symbol('i-blitz') + ' ' + esc(tr('esNav19')) + ' ' + hilfe(belegBox(a.belege.anmeldung) + belegBox(K.beleg(K.eint('auto', 'wallbox_geraet'))), tr('regBelegKnopf')) + '</p>' +
        '<p>' + symbol('i-blitz') + ' ' + esc(tr('es14a')) + ' ' + hilfe(belegBox(K.beleg(K.eint('netz_und_luecken', 'n14a_4_2'))) + belegBox(K.beleg(K.eint('netz_und_luecken', 'n14a_geltung'))), tr('regBelegKnopf')) + '</p></div>';
      h += quellen([a.belege.km, a.belege.kwh100, a.belege.wallbox[0], a.belege.wallbox[1], a.belege.preis, a.belege.verbrauch, a.belege.anmeldung]);
    }
    return h;
  }

  /* Balken mit den Bundesschwellen und Markierung der eigenen Anlage; Wurzelskala, damit 2 und 7 kW lesbar bleiben */
  function posKw(kw) { return Math.sqrt(Math.max(0, Math.min(100, kw)) / 100) * 100; }
  function htmlRegeln(res, ein, land) {
    var kwp = res.ok ? res.kwp : null, rg = K.regelnKarten(land, kwp, null), h = '';
    if (!rg) return '<p class="fehler">' + esc(tr('esKeineDaten')) + '</p>';
    /* Solarpflicht */
    var sp = rg.solarpflicht;
    h += '<div class="es-pflicht"><h5 class="es-h5">' + symbol('c-pflicht') + ' ' + esc(tr('esSolarpflichtTitel', { land: RK.landInfo(land).name })) + '</h5>';
    if (sp && !rg.solarpflichtLuecke) {
      h += '<p data-solarpflicht="' + esc(land) + '">' + (rg.solarpflichtWert && rg.solarpflichtWert.anteil_dach_prozent ? '<b>' + esc(tr('esSolarpflichtProzent', { p: rg.solarpflichtWert.anteil_dach_prozent })) + '</b> ' : '') + '<span lang="de">' + esc(sp.text) + '</span> ' + badge(sp.status) + ' ' + hilfe(belegHtmlRegel(sp), tr('regBelegKnopf')) + '</p>';
    } else h += '<p data-solarpflicht="' + esc(land) + '">' + esc(tr('esSolarpflichtLuecke')) + ' ' + badge('Lücke') + '</p>';
    h += '<p class="klein">' + esc(tr('esSolarpflichtHinweis')) + '</p></div>';
    /* Schwellenbalken */
    h += '<h5 class="es-h5">' + symbol('i-waage') + ' ' + esc(tr('esSchwellenTitel')) + '</h5><div class="es-schw" role="img" aria-label="' + esc(tr('esSchwellenAria', { kwp: kwp == null ? '–' : n1(kwp) })) + '"><div class="es-schw-balken">' +
      (kwp != null ? '<span class="es-schw-fuell" style="width:' + posKw(kwp).toFixed(1) + '%"></span>' : '') + '</div>';
    rg.schwellen.forEach(function (s, i) {
      h += '<span class="es-marke' + (s.erreicht ? ' erreicht' : '') + ' z' + (i % 2) + '" style="left:' + posKw(s.kw).toFixed(1) + '%" data-kw="' + s.kw + '">' + (i + 1) + '</span>';
    });
    if (kwp != null) h += '<span class="es-ihre' + (posKw(kwp) < 22 ? ' links' : (posKw(kwp) > 78 ? ' rechts' : '')) + '" style="left:' + posKw(kwp).toFixed(1) + '%" data-kwp="' + kwp.toFixed(2) + '"><i></i><b>' + esc(tr('esIhreAnlage', { kwp: n1(kwp) })) + '</b></span>';
    h += '</div><p class="klein">' + esc(tr('esSkalaHinweis')) + '</p><ol class="es-schw-liste">' + rg.schwellen.map(function (s, i) {
      return '<li data-kw="' + s.kw + '"' + (s.erreicht ? ' class="erreicht"' : '') + '><b class="es-nummer">' + (i + 1) + '</b> <span><b>' + n0(s.kw) + ' kW</b> – ' + esc(tr(s.key)) + (s.erreicht ? ' <span class="es-erreicht">' + esc(tr('esErreicht')) + '</span>' : '') + ' ' + badge(s.beleg.status) +
        ' <span class="klein">' + esc(tr('regAbruf', { datum: datumDe(s.beleg.abruf) })) + '</span> ' + hilfe(belegBox(s.beleg), tr('regBelegKnopf')) + '</span></li>';
    }).join('') + '</ol>';
    /* Privat und Vermieter */
    function karte(art, liste, titelKey, wasKey, punkte) {
      return '<div class="karte es-art" data-art="' + art + '"><h5 class="es-h5">' + symbol(art === 'privat' ? 'i-haus' : 'i-bett') + ' ' + esc(tr(titelKey)) + '</h5><p class="klein">' + esc(tr(wasKey)) + '</p><ul class="es-punkte">' + punkte + '</ul>' +
        '<details class="es-alle"><summary>' + esc(tr('esAlleRegeln', { n: liste.length })) + '</summary><ul class="es-regelliste">' + liste.map(function (r) {
          return '<li data-regel="' + esc(r.id) + '"><span lang="de">' + esc(r.name) + '</span> ' + (r.paragraf ? '<span class="klein" lang="de">' + esc(r.paragraf) + '</span> ' : '') + badge(r.status) + ' <span class="klein">' + esc(tr('regAbruf', { datum: datumDe(r.abruf) })) + '</span> ' + hilfe(belegBox(r), tr('regBelegKnopf')) + '</li>'; }).join('') + '</ul></details></div>';
    }
    function punkt(ok, key, par, b) { return '<li class="' + (ok ? 'ok' : 'achtung') + '"><span class="es-pz" aria-hidden="true">' + (ok ? '✓' : '!') + '</span><span>' + esc(tr(key, par)) + (b ? ' ' + badge(b.status) + ' ' + hilfe(belegBox(b), tr('regBelegKnopf')) : '') + '</span></li>'; }
    var E = function (id) { var d = window.DATEN.energie; return K.beleg(K.eint('bundesregeln', id) || K.eint('steckersolar', id)); };
    var kw = kwp == null ? 0 : kwp, pp = '', vp = '';
    pp += kw <= 2 ? punkt(true, 'esPrSteckersolar', {}, E('st_2000_800')) : punkt(true, 'esPrNormal', {}, E('r_mastr'));
    pp += punkt(kw <= 30, kw <= 30 ? 'esPrUst0' : 'esPrUstUeber', {}, E('r_ust_0'));
    pp += punkt(kw <= 30, kw <= 30 ? 'esPrEst' : 'esPrEstUeber', {}, E('r_est_72'));
    if (kw > 7) pp += punkt(false, 'esPrSmart', {}, E('r_msbg_7kw'));
    pp += punkt(kw < 25, kw < 25 ? 'esPrBegrenzung' : (kw < 100 ? 'esPrFern' : 'esPrDirekt'), {}, kw < 25 ? E('r_eeg9_unter25') : (kw < 100 ? E('r_eeg9_25_100') : E('r_eeg21_100')));
    vp += punkt(true, 'esVmMieter', {}, E('st_mieter'));
    vp += punkt(false, 'esVmMieterstrom', {}, E('r_mieterstrom_vertrag'));
    vp += punkt(false, 'esVmEigen', {}, K.beleg(K.eint('eigenverbrauch', 'ev_vermietung')));
    vp += punkt(kw <= 30, kw <= 30 ? 'esVmSteuer' : 'esVmSteuerUeber', {}, E('r_est_72'));
    h += '<div class="es-arten">' + karte('privat', rg.privat, 'esPrivatTitel', 'esPrivatWas', pp) + karte('vermieter', rg.vermieter, 'esVermieterTitel', 'esVermieterWas', vp) + '</div>';
    h += '<p class="klein">' + esc(tr('esRegelnKeineBeratung')) + '</p>';
    return h;
  }
  function belegHtmlRegel(b) {
    /* Beleg aus regeln_kern.js (Landesregel): Titel, Landesbauordnung, Paragraf, Status, Abruf, Wortlaut/Text, Quellen */
    var h = '<div class="rg-beleg" data-beleg-land="1"><p class="rg-beleg-kopf" lang="de"><b>' + esc(b.titel) + '</b>' + (b.lbo ? ' · ' + esc(b.lbo) : '') + (b.paragraf ? ' · ' + esc(b.paragraf) : '') + '</p>' +
      '<p class="rg-beleg-meta">' + badge(b.status) + ' <span class="rg-abruf" data-abruf="' + esc(b.abruf) + '">' + esc(tr('regAbruf', { datum: datumDe(b.abruf) })) + '</span></p>';
    if (b.wortlaut) h += '<blockquote class="rg-wortlaut" lang="de">' + esc(b.wortlaut) + '</blockquote>'; else if (b.text) h += '<p class="klein" lang="de">' + esc(b.text) + '</p>';
    if (b.hinweis) h += '<p class="klein" lang="de">' + esc(b.hinweis) + '</p>';
    (b.quellen || []).forEach(function (q) { h += '<p class="klein rg-quellen" lang="de">' + (q.url ? '<a class="rg-quelle" href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(tr('regQuelle')) + ': ' + esc(q.titel) + '</a>' : esc(q.titel)) + '</p>'; });
    return h + '</div>';
  }

  function htmlThermie(res, ein) {
    var modus = S.thermie === 'heizung' ? 'heizung' : 'ww';
    if (!res.ok) return '<p class="klein">' + esc(tr('esThermieWartet')) + '</p>';
    var t = K.vergleichThermie(res.flaecheNutz, res.kwp, res.erzeugung, res.verbrauch.personen, modus, res.investPv), mx = Math.max(t.energieSt, t.energiePv, 1), h = '';
    h += chips('thermie', [['ww', tr('esThermieWw')], ['heizung', tr('esThermieHeiz')]], modus);
    h += '<p class="klein">' + esc(tr('esThermieEinl', { m2: n1(res.flaecheNutz) })) + '</p>';
    h += '<div class="es-th" data-th="1">' +
      '<div class="es-th-spalte" data-art="pv"><h5 class="es-h5">' + symbol('i-sonne') + ' ' + esc(tr('esThPv')) + '</h5>' +
      '<div class="es-az"><span>' + esc(tr('esThEnergie')) + '</span><b>' + zahl(n0(t.energiePv) + ' kWh ' + esc(tr('esThStrom')), ein.belegPv, ' data-th-wert="pv-energie" data-wert="' + t.energiePv.toFixed(0) + '"') + '</b></div>' + balken(t.energiePv / mx, 'c1', tr('esThPv') + ' ' + n0(t.energiePv) + ' kWh') +
      '<div class="es-az"><span>' + esc(tr('esThKosten')) + '</span><b>' + (t.investPv ? zahl(eur(t.investPv), res.preis ? K.beleg(res.preis.eintrag) : modell(), ' data-th-wert="pv-invest" data-wert="' + (t.investPv || 0).toFixed(0) + '"') : '–') + '</b></div>' + (t.investPv ? balken(t.investPv / Math.max(t.investPv, t.investSt, 1), 'c3', tr('esThKosten') + ' ' + eur(t.investPv)) : '') +
      '<div class="es-az"><span>' + esc(tr('esThWert')) + '</span><b>' + zahl(eur(res.varianten.keiner.netto1) + ' ' + esc(tr('esThProJahr')), res.strompreis.beleg) + '</b></div>' +
      '<div class="es-az"><span>' + esc(tr('esThFoerder')) + '</span><b>' + zahl(esc(tr('esThKeine')), t.belege.beg) + '</b></div></div>' +
      '<div class="es-th-spalte" data-art="st"><h5 class="es-h5">' + symbol('i-thermo') + ' ' + esc(tr('esThSt')) + '</h5>' +
      '<div class="es-az"><span>' + esc(tr('esThEnergie')) + '</span><b>' + zahl(n0(t.energieSt) + ' kWh ' + esc(tr('esThWaerme')), t.belege.ertrag, ' data-th-wert="st-energie" data-wert="' + t.energieSt.toFixed(0) + '"') + '</b></div>' + balken(t.energieSt / mx, 'c2', tr('esThSt') + ' ' + n0(t.energieSt) + ' kWh') +
      '<div class="es-az"><span>' + esc(tr('esThKosten')) + '</span><b>' + zahl(eur(t.investSt), t.belege.preis, ' data-th-wert="st-invest" data-wert="' + t.investSt.toFixed(0) + '"') + '</b></div>' + balken(t.investSt / Math.max(t.investPv || 0, t.investSt, 1), 'c3', tr('esThSt') + ' ' + eur(t.investSt)) +
      '<div class="es-az"><span>' + esc(tr('esThWert')) + '</span><b>' + zahl(esc(tr('esThLuecke')), t.belege.wert, ' data-th-wert="st-wert"') + '</b></div>' +
      '<div class="es-az"><span>' + esc(tr('esThFoerder')) + '</span><b>' + zahl(esc(tr('esThBeg', { p: t.foerderProzent })), t.belege.beg) + '</b></div>' +
      '<div class="es-az"><span>' + esc(tr('esThAmort')) + '</span><b>' + zahl(esc(tr('esThJahreBis', { von: t.amortVon, bis: t.amortBis })), t.belege.amort) + '</b></div></div></div>';
    h += '<p class="klein">' + esc(tr('esThBegrenzt', { m2: n1(t.flaeche), je: n1(t.bedarf / Math.max(1, res.verbrauch.personen)), pers: res.verbrauch.personen })) + (t.begrenzt ? ' ' + esc(tr('esThRestPv', { m2: n1(res.flaecheNutz - t.flaeche) })) : '') + '</p>';
    h += '<p class="es-warn">' + esc(tr('esThKwhHinweis')) + '</p>';
    h += '<p class="klein">' + esc(tr('esThPvTh')) + '</p>';
    h += '<p class="klein">' + esc(tr('esThBegDatum', { datum: datumDe((K.eint('beg', 'beg_em_datum') || {}).datum_richtlinie || ''), ab: datumDe(t.belege.begDatum.gilt_ab) })) + ' ' + hilfe(belegBox(t.belege.begDatum) + belegBox(t.belege.isfp) + belegBox(t.belege.beg), tr('regBelegKnopf')) + '</p>';
    h += quellen([t.belege.ertrag, t.belege.preis, t.belege.amort, t.belege.beg, t.belege.wert, t.belege.flaeche]);
    return h;
  }

  function htmlAnnahmen(res) {
    var A = K.ANNAHMEN, z = [];
    z.push(['esAnNutz', { p: n0(A.nutzanteil * 100) }]);
    z.push(['esAnM2', { m2: n1(res.m2JeKwp) }]);
    z.push(['esAnModell', {}]);
    z.push(['esAnPreis', {}]);
    z.push(['esAnHorizont', { n: A.horizont, e: A.eegJahre }]);
    z.push(['esAnGeraete', { wr: A.wrJahr, sp: A.spJahr }]);
    z.push(['esAnSteig', { p: n1(S.steigerung) }]);
    z.push(['esAnVermiet', {}]);
    z.push(['esAnLuecken', {}]);
    return '<ul class="annahmen es-annahmenliste">' + z.map(function (x) { return '<li><span>' + annahmeZeile(x[0], x[1]) + '</span></li>'; }).join('') + '</ul>' +
      '<p class="klein">' + esc(tr('esKeineAnlageberatung')) + '</p>';
  }

  /* ---------- Zeichnen einer Instanz ---------- */
  function fehlerEin(inst, text) { var e = b(inst, 'fehler'); if (e) { e.textContent = text || ''; e.hidden = !text; } }
  function aktualisiere(inst, voll) {
    if (!inst.wurzel || !inst.gebaut) return;
    var ein = eingaben(inst), land = ein.land;
    var pv = window.DATEN && window.DATEN.pvgis;
    ein.pvAbruf = pv ? pv.abruf : '';
    var er = K.eint('pv_technik', 'pv_flaeche_vz');
    ein.belegPv = pv ? { id: 'pvgis', quelle: 'PVGIS (EU-Kommission), ' + (pv.zuordnung || ''), abruf: pv.abruf, status: 'geprüft', name: 'PVGIS', hinweis: pv.urheberHinweis || '', url: pv.url } : null;
    if (voll || !inst.landHtml || inst.landHtml !== land) { b(inst, 'land').innerHTML = htmlLand(inst, land); inst.landHtml = land; }
    var sig = JSON.stringify([ein.flaechenAlle.map(function (x) { return [x.n, x.flaeche, x.neigung, x.richtung, x.gewaehlt, x.ey]; }), land, lang()]);
    var flEl = b(inst, 'flaechen');
    if (inst.modus === 'plan') {
      if (voll || inst.sigFl !== sig) { flEl.innerHTML = htmlFlaechenPlan(inst, ein); inst.sigFl = sig; }
    } else if (voll || inst.sigStruktur !== S.frei.flaechen.length + '|' + lang() + '|' + land) {
      flEl.innerHTML = htmlFlaechenFrei(inst, ein); inst.sigStruktur = S.frei.flaechen.length + '|' + lang() + '|' + land;
    } else {
      ein.flaechenAlle.forEach(function (x, i) {
        var el = b(inst, 'ff' + i); if (!el) return;
        el.innerHTML = x.ey != null ? balken(x.ey / Math.max(1, x.ey, 1100), KLASSE_BALKEN[x.klasse] || 'c1', tr('esErtragBalken', { ey: n0(x.ey) })) + '<span class="es-fl-zahl">' + zahl(tr('esEyWert', { ey: n0(x.ey) }), ein.belegPv, ' data-ey="' + x.ey + '"') + '</span>' : '';
        var nn = b(inst, 'neig' + i); if (nn) nn.textContent = x.neigung + '°';
      });
    }
    /* Eingabefelder auffüllen, ohne das gerade bediente zu stören */
    var res = K.rechne(ein.rechnung);
    inst.letzte = res; inst.ein = ein;
    var pers = b(inst, 'pers'); pers.textContent = String(S.personen);
    function setze(name, wert) { var el = f(inst, name); if (el && document.activeElement !== el) el.value = wert; }
    function platz(name, wert) { var el = f(inst, name); if (el) el.setAttribute('placeholder', wert); }
    setze('verbrauch', S.verbrauch > 0 ? n0(S.verbrauch).replace(/ /g, '') : '');
    setze('strompreis', S.strompreis > 0 ? n1(S.strompreis) : '');
    var jeP = res.verbrauch ? res.verbrauch.jeP : 1240, pbeleg = K.beleg(K.eint('strompreis', 'strom_je_person'));
    b(inst, 'verbrHinweis').innerHTML = esc(tr('esVerbrHinweis', { n: S.personen, kwh: n0(S.personen * jeP), je: n0(jeP) })) + ' ' + badge(pbeleg.status) + ' <span class="klein" lang="de">' + esc(kurz(pbeleg.quelle)) + ', ' + esc(tr('regAbruf', { datum: datumDe(pbeleg.abruf) })) + '</span>';
    var sp = K.beleg(K.eint('strompreis', 'strompreis_haushalt'));
    b(inst, 'preisHinweis').innerHTML = esc(tr('esPreisHinweis', { ct: n1(sp.von) })) + ' ' + badge(sp.status) + ' <span class="klein" lang="de">' + esc(kurz(sp.quelle)) + ', ' + esc(tr('regAbruf', { datum: datumDe(sp.abruf) })) + '</span>';
    platz('verbrauch', n0(S.personen * jeP)); platz('strompreis', n1(sp.von)); platz('km', n0(K.eint('auto', 'km_bev').von)); platz('kwh100', n1(K.eint('auto', 'ecar_klasse_kompakt').von));
    b(inst, 'steigWert').textContent = n1(S.steigerung) + ' %';
    var st = f(inst, 'steigerung'); if (st && document.activeElement !== st) st.value = String(S.steigerung);
    var an = f(inst, 'auto-an'); an.checked = !!S.auto.an; b(inst, 'autoFeld').hidden = !S.auto.an;
    var wb = f(inst, 'wallbox'); wb.checked = !!S.auto.wallbox; b(inst, 'wallboxFeld').hidden = !S.auto.wallbox;
    var kmE = K.beleg(K.eint('auto', 'km_bev')), kE = K.beleg(K.eint('auto', 'ecar_klasse_kompakt')), ad = K.beleg(K.eint('auto', 'ecar_adac'));
    setze('km', S.auto.km > 0 ? n0(S.auto.km).replace(/ /g, '') : '');
    setze('kwh100', S.auto.kwh100 > 0 ? n1(S.auto.kwh100) : '');
    b(inst, 'kmHinweis').innerHTML = esc(tr('esKmHinweis', { km: n0(kmE.von) })) + ' ' + badge(kmE.status) + ' <span class="klein" lang="de">' + esc(kurz(kmE.quelle)) + ', ' + esc(tr('regAbruf', { datum: datumDe(kmE.abruf) })) + '</span>';
    var kl = [['ecar_klasse_klein', 'esKlKlein'], ['ecar_klasse_kompakt', 'esKlKompakt'], ['ecar_klasse_suv', 'esKlSuv'], ['ecar_bestand', 'esKlBestand']].map(function (x) { var e = K.eint('auto', x[0]); return [e.von, tr(x[1]) + ' ' + n1(e.von)]; });
    b(inst, 'klassen').innerHTML = kl.map(function (x) { return '<button type="button" class="chip klein" data-akt="k100" data-wert="' + x[0] + '" aria-pressed="' + (S.auto.kwh100 === x[0] ? 'true' : 'false') + '">' + esc(x[1]) + '</button>'; }).join('');
    b(inst, 'k100Hinweis').innerHTML = esc(tr('esK100Hinweis', { von: n1(ad.von), bis: n1(ad.bis) })) + ' ' + badge(ad.status) + ' <span class="klein" lang="de">' + esc(kurz(ad.quelle)) + ', ' + esc(tr('regAbruf', { datum: datumDe(ad.abruf) })) + '</span> <span class="klein">' + esc(tr('esKlassenHinweis')) + '</span>';
    var pk = K.beleg(K.eint('auto', S.auto.kraftstoff === 'diesel' ? (S.auto.preisBasis === 'sep2026' ? 'preis_diesel_sep2026' : 'preis_diesel_2025') : (S.auto.preisBasis === 'sep2026' ? 'preis_e10_sep2026' : 'preis_e10_2025')));
    b(inst, 'preisLHinweis').innerHTML = esc(tr('esPreisLHinweis', { p: n2(pk.von) })) + ' ' + badge(pk.status) + ' <span class="klein" lang="de">' + esc(kurz(pk.quelle)) + ', ' + esc(tr('regAbruf', { datum: datumDe(pk.abruf) })) + '</span>';
    var gw = K.beleg(K.eint('auto', 'wallbox_geraet')), iw = K.beleg(K.eint('auto', 'wallbox_install'));
    b(inst, 'wallboxHinweis').innerHTML = esc(tr('esWallboxHinweis', { gv: n0(gw.von), gb: n0(gw.bis), iv: n0(iw.von), ib: n0(iw.bis) })) + ' ' + badge(gw.status) + ' <span class="klein" lang="de">' + esc(kurz(gw.quelle)) + ', ' + esc(tr('regAbruf', { datum: datumDe(gw.abruf) })) + '</span>';
    inst.wurzel.querySelectorAll('.chip[data-akt="wahl"]').forEach(function (c) {
      var feld = c.getAttribute('data-feld'), w = c.getAttribute('data-wert'), akt = (feld === 'einspeisung') ? S.einspeisung : (feld === 'thermie' ? S.thermie : S.auto[feld]);
      c.setAttribute('aria-pressed', String(akt) === w ? 'true' : 'false');
    });
    /* Ergebnisse */
    var vEl = b(inst, 'varianten'), eEl = b(inst, 'ergebnis'), rEl = b(inst, 'regeln'), tEl = b(inst, 'thermie');
    if (!res.ok) {
      var key = res.fehler && res.fehler.code === 'keineFlaeche' ? 'esFehlerKeineFlaeche' : (res.fehler && res.fehler.code === 'keinErtrag' ? 'esKeinErtrag' : 'esKeineDaten');
      var m = '<div class="rg-leer es-leer">' + symbol('i-sonne') + '<p data-fehler="' + esc(res.fehler ? res.fehler.code : '') + '">' + esc(tr(key, { stadt: res.stadt || RK.landInfo(land).stadt })) + '</p></div>';
      vEl.innerHTML = m; eEl.innerHTML = ''; tEl.innerHTML = '';
      rEl.innerHTML = htmlRegeln(res, ein, land);
      inst.kopf = '';
    } else {
      vEl.innerHTML = htmlVarianten(res, ein);
      eEl.innerHTML = htmlErgebnis(res, ein);
      rEl.innerHTML = htmlRegeln(res, ein, land);
      tEl.innerHTML = htmlThermie(res, ein);
      inst.kopf = tr('esKopfZeile', { kwp: n1(res.kwp), kwh: n0(res.erzeugung) });
    }
    b(inst, 'annahmen').innerHTML = res.ok ? htmlAnnahmen(res) : '';
    var sm = b(inst, 'meldung');
    sm.textContent = speicherFehler === 'speichern' ? tr('esNichtGemerkt') : (speicherFehler === 'laden' ? tr('esLadenFehler') : '');
    if (inst.kopfEl) inst.kopfEl.textContent = inst.kopf || tr('esKopfLeer');
  }

  /* ---------- Bedienung ---------- */
  function zahlFeld(inst, el, min, max, name, feldKey) {
    var fe = el.parentNode.querySelector('.fehler') || el.nextElementSibling, v = zahlLesen(el.value), txt = String(el.value || '').trim();
    if (txt === '') { el.removeAttribute('aria-invalid'); if (fe) fe.textContent = ''; return { leer: true }; }
    if (!(v >= min && v <= max)) {
      el.setAttribute('aria-invalid', 'true');
      if (fe) fe.textContent = tr('esZahlFehler', { name: name, min: n0(min), max: n0(max) });
      return { fehler: true };
    }
    el.removeAttribute('aria-invalid'); if (fe) fe.textContent = '';
    return { wert: v };
  }
  function bei(inst, ev) {
    var t = ev.target, feld = t.getAttribute && t.getAttribute('data-f'), ffeld = t.getAttribute && t.getAttribute('data-ff');
    if (feld) {
      var r;
      if (feld === 'verbrauch') { r = zahlFeld(inst, t, 100, 100000, tr('esVerbrauch'), feld); if (r.leer) S.verbrauch = null; else if (!r.fehler) S.verbrauch = r.wert; }
      else if (feld === 'strompreis') { r = zahlFeld(inst, t, 5, 200, tr('esStrompreis'), feld); if (r.leer) S.strompreis = null; else if (!r.fehler) S.strompreis = r.wert; }
      else if (feld === 'km') { r = zahlFeld(inst, t, 100, 200000, tr('esKm'), feld); if (r.leer) S.auto.km = null; else if (!r.fehler) S.auto.km = r.wert; }
      else if (feld === 'kwh100') { r = zahlFeld(inst, t, 5, 60, tr('esKwh100'), feld); if (r.leer) S.auto.kwh100 = null; else if (!r.fehler) S.auto.kwh100 = r.wert; }
      else if (feld === 'steigerung') S.steigerung = parseFloat(t.value) || 0;
      else if (feld === 'auto-an') S.auto.an = t.checked;
      else if (feld === 'wallbox') S.auto.wallbox = t.checked;
      else if (feld === 'land') { S.frei.land = t.value; S.frei.geaendert = true; }
      speichern(); alle(false, feld === 'auto-an' || feld === 'wallbox' || feld === 'land' ? true : false); return;
    }
    if (ffeld) {
      var i = +t.getAttribute('data-i'), fl = S.frei.flaechen[i];
      if (!fl) return;
      if (ffeld === 'flaeche') {
        var v = zahlLesen(t.value), fe = document.getElementById(t.id.replace(/m$/, 'f'));
        if (!(v > 0 && v <= 2000)) { t.setAttribute('aria-invalid', 'true'); if (fe) fe.textContent = tr('esZahlFehler', { name: tr('esFlFlaeche'), min: '1', max: '2.000' }); return; }
        t.removeAttribute('aria-invalid'); if (fe) fe.textContent = ''; fl.flaeche = v;
      } else if (ffeld === 'richtung') fl.richtung = +t.value;
      else if (ffeld === 'neigung') fl.neigung = +t.value;
      S.frei.geaendert = true; speichern(); alle(false, false);
    }
  }
  function klick(inst, ev) {
    var t = ev.target.closest('[data-akt],[data-hilfe],[data-ziel]');
    if (!t || !inst.wurzel.contains(t)) return;
    if (t.hasAttribute('data-hilfe')) {
      var box = document.getElementById(t.getAttribute('data-hilfe')), auf = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', auf ? 'false' : 'true'); if (box) box.hidden = auf; return;
    }
    var akt = t.getAttribute('data-akt');
    if (!akt) return;
    ev.preventDefault && ev.preventDefault();
    var w = t.getAttribute('data-wert');
    switch (akt) {
      case 'persplus': S.personen = Math.min(10, S.personen + 1); break;
      case 'persminus': S.personen = Math.max(1, S.personen - 1); break;
      case 'wahl': {
        var fk = t.getAttribute('data-feld');
        if (fk === 'einspeisung') S.einspeisung = w; else if (fk === 'thermie') S.thermie = w; else S.auto[fk] = w;
        break;
      }
      case 'k100': S.auto.kwh100 = parseFloat(w); break;
      case 'variante': S.variante = w; break;
      case 'fl': {
        var n = +t.getAttribute('data-n'), a = planAuswahl || [], ix = a.indexOf(n);
        if (t.checked && ix < 0) a.push(n); else if (!t.checked && ix >= 0) a.splice(ix, 1);
        planAuswahl = a; break;
      }
      case 'beste': planAuswahl = K.besteFlaechen(planFlaechen || []); break;
      case 'alle': planAuswahl = (planFlaechen || []).map(function (x) { return x.n; }); break;
      case 'ff-neu': if (S.frei.flaechen.length < 8) { S.frei.flaechen.push({ flaeche: 20, richtung: 180, neigung: 35 }); S.frei.geaendert = true; } break;
      case 'ff-weg': { var wi = +t.getAttribute('data-i'); if (S.frei.flaechen.length > 1) { S.frei.flaechen.splice(wi, 1); S.frei.geaendert = true; } break; }
      case 'ff-plan': {
        if (S.frei.geaendert) { var q = b(inst, 'ffFrage'); if (q) { q.hidden = false; var bt = q.querySelector('button'); if (bt) bt.focus(); } return; }
        planInFrei(inst); break;
      }
      case 'ff-plan-ja': planInFrei(inst); break;
      case 'zum-ergebnis': { var ze = b(inst, 'ergebnis'); if (ze) ze.scrollIntoView({ block: 'start' }); return; }
      case 'ff-plan-nein': { var q2 = b(inst, 'ffFrage'); if (q2) q2.hidden = true; return; }
      case 'land-aendern': {
        var d = document.getElementById('g-land-details'); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); var sm = d.querySelector('summary'); if (sm) sm.focus({ preventScroll: true }); }
        return;
      }
      default: return;
    }
    speichern(); alle(false, true);
  }
  function planInFrei(inst) {
    var p = G.plan(), land = RK.landOk(p.land) ? p.land : 'HB', r = planDach(land);
    if (!r.flaechen.length) { var m = b(inst, 'meldung'); m.textContent = tr('esKeinDach'); return; }
    /* übernommen werden die in der Planungskarte gewählten Flächen (keine gewählt: alle) */
    var wahl = (planAuswahl && planAuswahl.length) ? r.flaechen.filter(function (x) { return planAuswahl.indexOf(x.n) >= 0; }) : r.flaechen;
    S.frei.flaechen = wahl.slice(0, 8).map(function (x) { return { flaeche: Math.round(x.flaeche * 100) / 100, richtung: x.richtung == null ? 180 : x.richtung, neigung: x.neigung }; });
    S.frei.land = RK.landOk(p.land) ? p.land : S.frei.land; S.frei.geaendert = false;
    var q = b(inst, 'ffFrage'); if (q) q.hidden = true;
  }
  function alle(voll, struktur) {
    instanzen.forEach(function (inst) { if (inst.gebaut) aktualisiere(inst, !!struktur || !!voll); });
  }

  function bauen(inst) {
    if (inst.gebaut || !inst.wurzel) return;
    inst.pre = inst.modus === 'plan' ? 'gs-' : 'ss-';
    inst.wurzel.innerHTML = geruestHtml(inst);
    inst.gebaut = true;
    inst.wurzel.addEventListener('click', function (ev) { klick(inst, ev); });
    inst.wurzel.addEventListener('input', function (ev) { bei(inst, ev); });
    inst.wurzel.addEventListener('change', function (ev) { if (ev.target.tagName === 'SELECT' || ev.target.type === 'checkbox') bei(inst, ev); });
    aktualisiere(inst, true);
  }

  /* ---------- Einhängen ---------- */
  function haenge(modus, id, kopfId, detailsId) {
    var w = document.getElementById(id);
    if (!w) return null;
    var inst = { modus: modus, wurzel: w, gebaut: false, kopfEl: kopfId ? document.getElementById(kopfId) : null };
    instanzen.push(inst);
    if (detailsId) {
      var d = document.getElementById(detailsId);
      if (d) { d.addEventListener('toggle', function () { if (d.open) bauen(inst); }); if (d.open) bauen(inst); }
    } else bauen(inst);
    return inst;
  }
  var planInst = haenge('plan', 'g-strom-inhalt', 'g-strom-kopfzeile', 'g-strom-details');
  var freiInst = haenge('frei', 's-strom-inhalt', null, null);

  function jetzt() {
    clearTimeout(timer);
    instanzen.forEach(function (inst) {
      if (inst.gebaut) aktualisiere(inst, false);
      else if (inst.modus === 'plan' && inst.kopfEl) {
        /* Karte zu: nur die Kurzzeile aus der Rechnung mit den besten Flächen */
        var ein = eingaben(inst), res = K.rechne(ein.rechnung);
        inst.kopfEl.textContent = res.ok ? tr('esKopfZeile', { kwp: n1(res.kwp), kwh: n0(res.erzeugung) }) : tr('esKopfLeer');
      }
    });
  }
  function aktualisieren() { clearTimeout(timer); timer = setTimeout(jetzt, 150); }
  window.addEventListener('sprachegewechselt', function () { instanzen.forEach(function (i) { if (i.gebaut) { i.wurzel.innerHTML = geruestHtml(i); i.landHtml = null; i.sigFl = null; i.sigStruktur = null; } }); jetzt(); });
  window.addEventListener('themagewechselt', function () { /* Farben kommen aus CSS-Variablen */ });
  window.GRUNDRISS_ENERGIE = {
    aktualisieren: aktualisieren, jetzt: jetzt,
    ergebnis: function (modus) { var i = instanzen.filter(function (x) { return x.modus === (modus || 'plan'); })[0]; return i ? i.letzte : null; },
    zustand: function () { return JSON.parse(JSON.stringify(S)); },
    setze: function (o) { Object.keys(o || {}).forEach(function (k) { if (k === 'auto') Object.keys(o.auto).forEach(function (a) { S.auto[a] = o.auto[a]; }); else S[k] = o[k]; }); speichern(); alle(false, true); },
    auswahl: function (liste) { if (liste) { planAuswahl = liste.slice(); alle(false, true); } return planAuswahl && planAuswahl.slice(); },
    ausPlan: function () { if (freiInst) planInFrei(freiInst); speichern(); alle(false, true); }
  };
  jetzt();
})();
