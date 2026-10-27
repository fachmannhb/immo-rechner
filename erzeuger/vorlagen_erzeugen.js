/* Erzeugt daten/vorlage_musterhaus2.js, vorlage_klein.js, vorlage_gross.js.
   Aufruf im Ordner werkzeuge:  node erzeuger/vorlagen_erzeugen.js
   Die Lage von Fenstern und Türen kommt aus GRUNDRISS_GEO.bindungPos, damit die gespeicherten x/y genau dem entsprechen,
   was die Seite beim Laden selbst nachrechnet. Alle Maße in Metern, Raumumriss = lichtes Maß. Alles erfunden außer dem
   Grundriss des Musterhauses (Maße des Nutzers, Obergeschoss angenommen). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const BASIS = path.join(__dirname, '..');
const GEO = require(path.join(BASIS, 'grundriss_geo.js'));
const KERN = require(path.join(BASIS, 'regeln_kern.js'));   /* Raumnutzung (Welle C): aus dem Namen vorbelegt, einzelne Räume unten ausdrücklich gesetzt */
const ctx = { window: { DATEN: {} } };
['sanierung', 'moebel'].forEach(n => vm.runInNewContext(fs.readFileSync(path.join(BASIS, 'daten', n + '.js'), 'utf8'), ctx));
const ART = {};
ctx.window.DATEN.moebel.artikel.forEach(a => { ART[a.id] = a; });
const r3 = x => Math.round(x * 1000) / 1000;
const fehler = [];

function neuePlanung(id, kopf) {
  const P = Object.assign({ app: 'immo-grundriss', version: 2, aktiv: 0, wandhoehe: 2.5, beispiel: true, vorlage: id, preise: {}, mengen: {}, etagen: [] }, kopf);
  let zaehler = 0;
  P.neueEtage = function (name, opt) {
    const e = Object.assign({ name: name, bild: null, hoehe: 2.5, aussenwand: 0.3, innenwand: 0.115, decke: 0.25, raeume: [], teile: [] }, opt || {});
    const praefix = 'e' + (P.etagen.length + 1);
    e.raum = function (rid, rname, x0, y0, x1, y1, o) {
      e.raeume.push(Object.assign({ id: rid, name: rname, art: 'voll', nutzung: KERN.nutzungAusName(rname) || 'sonstiges', punkte: [[r3(x0), r3(y0)], [r3(x1), r3(y0)], [r3(x1), r3(y1)], [r3(x0), r3(y1)]] }, o || {}));
    };
    /* Fenster oder Tür an eine Raumkante binden. mitte = Koordinate der Mitte entlang der Kante (x bei waagerechter, y bei senkrechter Kante) */
    e.oeffnung = function (art, rid, kante, mitte, w, o) {
      o = o || {};
      const raum = e.raeume.filter(r => r.id === rid)[0];
      if (!raum) { fehler.push('Raum fehlt: ' + rid); return; }
      const k = GEO.kanten(raum)[kante];
      const pkt = Math.abs(k.u[1]) < 1e-9 ? [mitte, k.a[1]] : [k.a[0], mitte];
      const s = (pkt[0] - k.a[0]) * k.u[0] + (pkt[1] - k.a[1]) * k.u[1];
      if (s - w / 2 < -1e-6 || s + w / 2 > k.L + 1e-6) fehler.push(`${rid} Kante ${kante}: ${art} ${w} m bei ${mitte} passt nicht (Kante ${k.L.toFixed(2)} m, s=${s.toFixed(2)})`);
      const bd = { raum: rid, kante: kante, t: Math.round(s / k.L * 10000) / 10000 };
      const p = GEO.bindungPos(e, bd, w, undefined, GEO.waende(e));
      if (!p || p.dicke == null) { fehler.push(`${rid} Kante ${kante}: keine Wand unter ${art} bei ${mitte}`); return; }
      const a = ART[art];
      const t = { id: 'v' + id.slice(0, 2) + praefix + 'n' + (++zaehler), art: art, x: r3(p.x), y: r3(p.y), w: w, d: r3(p.dicke), dreh: p.dreh,
        hoehe: o.hoehe != null ? o.hoehe : a.hoehe / 100, bruestung: o.bruestung != null ? o.bruestung : (art === 'fenster' ? 0.9 : 0), bindung: bd, bindungGrund: '' };
      e.teile.push(t);
    };
    e.moebel = function (art, x, y, dreh, o) {
      const a = ART[art];
      if (!a) { fehler.push('Katalog kennt ' + art + ' nicht'); return; }
      const t = Object.assign({ id: 'v' + id.slice(0, 2) + praefix + 'n' + (++zaehler), art: art, x: r3(x), y: r3(y), w: a.breite / 100, d: a.tiefe / 100, dreh: dreh || 0 }, o || {});
      /* Umriss muss in einem Raum liegen */
      const c = Math.cos(t.dreh * Math.PI / 180), sn = Math.sin(t.dreh * Math.PI / 180);
      const ecken = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(q => [t.x + q[0] * t.w / 2 * c - q[1] * t.d / 2 * sn, t.y + q[0] * t.w / 2 * sn + q[1] * t.d / 2 * c]);
      const imRaum = (q, r) => GEO.punktImVieleck(q, r.punkte) || r.punkte.some((p0, i) => GEO.abstandPunktStrecke(q, p0, r.punkte[(i + 1) % r.punkte.length]) < 0.011);
      const drin = e.raeume.some(r => ecken.every(q => imRaum(q, r)));
      if (!drin) fehler.push(`${art} bei (${x}, ${y}) liegt nicht ganz in einem Raum (Etage ${P.etagen.length + 1})`);
      e.teile.push(t);
    };
    P.etagen.push(e);
    return e;
  };
  return P;
}

function zeile(o) { return JSON.stringify(o); }
function schreiben(datei, id, kommentar, P) {
  const kopf = ['app', 'version', 'aktiv', 'wandhoehe', 'nord', 'beispiel', 'vorlage', 'dach', 'preise', 'mengen'].map(k => `  ${k}: ${JSON.stringify(P[k])}`).join(',\n');
  const et = P.etagen.map(e => {
    const k = { name: e.name, bild: null, hoehe: e.hoehe, aussenwand: e.aussenwand, innenwand: e.innenwand, decke: e.decke };
    const kopfE = Object.keys(k).map(n => `${n}: ${JSON.stringify(k[n])}`).join(', ');
    return `    {\n      ${kopfE},\n      raeume: [\n${e.raeume.map(r => '        ' + zeile(r)).join(',\n')}\n      ],\n      teile: [\n${e.teile.map(t => '        ' + zeile(t)).join(',\n')}\n      ]\n    }`;
  }).join(',\n');
  const text = `${kommentar}\nwindow.DATEN = window.DATEN || {};\nwindow.DATEN.vorlagen = window.DATEN.vorlagen || {};\nwindow.DATEN.vorlagen.${id} = {\n${kopf},\n  etagen: [\n${et}\n  ]\n};\n`;
  fs.writeFileSync(path.join(BASIS, 'daten', datei), text, 'utf8');
}
function bericht(name, P) {
  P.etagen.forEach(e => {
    const wl = GEO.waende(e);
    const aussen = wl.filter(w => w.typ === 'aussen').map(w => ({ L: Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) })).filter(w => w.L < 0.6);
    console.log(`${name} / ${e.name}: ${e.raeume.length} Räume, ${e.teile.length} Teile, Wände innen ${wl.filter(w => w.typ === 'innen').length}, außen ${wl.filter(w => w.typ === 'aussen').length} (kurze Außenstücke unter 0,6 m: ${aussen.length})`);
  });
}

/* ================= Musterhaus (Maße des Nutzers, lichte Maße, Ursprung links oben) ================= */
(function () {
  const P = neuePlanung('musterhaus2', { nord: 270, dach: { form: 'sattel', neigung: 35, first: 'y', ueberstand: 0.3 } });
  function geschoss(e, p, oben) {
    const n = oben ? ['Zimmer 1', 'Zimmer 2', 'Flur', 'Zimmer 3', 'Zimmer 4', 'Bad'] : ['Wohnzimmer', 'Küche', 'Flur', 'Schlafzimmer', 'Zimmer', 'Bad'];
    const nu = oben ? ['schlafen', 'kind', 'flur', 'kind', 'arbeiten', 'bad'] : ['wohnen', 'kueche', 'flur', 'schlafen', 'arbeiten', 'bad'];
    e.raum(p + 'wohn', n[0], 0, 0, 4.20, 4.68, { nutzung: nu[0] });
    e.raum(p + 'kueche', n[1], 4.46, 0, 8.28, 4.68, { nutzung: nu[1] });
    e.raum(p + 'flur', n[2], 3.30, 4.93, 8.28, 6.25, { nutzung: nu[2] });
    e.raum(p + 'schlaf', n[3], 0, 4.93, 3.10, 10.25, { nutzung: nu[3] });
    e.raum(p + 'zimmer', n[4], 3.30, 6.51, 6.40, 10.25, { nutzung: nu[4] });
    e.raum(p + 'bad', n[5], 6.59, 6.51, 8.28, 10.25, { nutzung: nu[5] });
    e.oeffnung('fenster', p + 'wohn', 0, 1.40, 2.00);   /* 27.10.2026: 2,00 m statt 1,40 m (Zeichnung des Nutzers), damit Wohnzimmer und Zimmer 1 die Fensterregel 1/8 in Bremen und Bayern erfüllen */
    e.oeffnung('fenster', p + 'kueche', 0, 5.20, 1.00);
    if (oben) { e.oeffnung('fenster', p + 'kueche', 0, 7.50, 0.90); e.oeffnung('fenster', p + 'flur', 1, 5.59, 1.00); }
    else { e.oeffnung('fenster', p + 'kueche', 0, 7.50, 0.90, { hoehe: 2.1, bruestung: 0 }); e.oeffnung('tuer', p + 'flur', 1, 5.59, 1.00, { hoehe: 2.1 }); }
    e.oeffnung('fenster', p + 'schlaf', 2, 1.55, 1.70);   /* 27.10.2026: 1,70 m statt 1,10 m, damit Schlafzimmer und Zimmer 3 die Fensterregel 1/8 erfüllen */
    e.oeffnung('fenster', p + 'zimmer', 2, 4.85, 1.40);
    e.oeffnung('fenster', p + 'bad', 2, 7.435, 0.60, { hoehe: 0.6, bruestung: 1.2 });
    e.oeffnung('tuer', p + 'flur', 0, 3.78, 0.80);
    e.oeffnung('tuer', p + 'flur', 0, 5.60, 0.90);
    e.oeffnung('tuer', p + 'schlaf', 1, 5.59, 0.90);
    e.oeffnung('tuer', p + 'zimmer', 0, 3.90, 0.80);
    e.oeffnung('tuer', p + 'bad', 0, 7.10, 0.80);
  }
  const eg = P.neueEtage('Erdgeschoss', { innenwand: 0.25 });
  geschoss(eg, 'me_', false);
  eg.moebel('treppe', 0.55, 2.55, 0);
  eg.moebel('sofa', 3.70, 2.70, 270); eg.moebel('couchtisch', 2.55, 2.70, 90); eg.moebel('tvboard', 1.60, 2.70, 90);
  eg.moebel('kueche', 7.98, 2.45, 270); eg.moebel('kuehlschrank', 7.995, 4.13, 270);
  eg.moebel('esstisch', 6.0, 2.5, 0);
  eg.moebel('stuhl', 5.65, 1.80, 0); eg.moebel('stuhl', 6.35, 1.80, 0); eg.moebel('stuhl', 5.65, 3.20, 180); eg.moebel('stuhl', 6.35, 3.20, 180);
  eg.moebel('bett180', 1.25, 5.98, 0); eg.moebel('schrank3', 0.30, 8.60, 90);
  eg.moebel('sofa', 5.94, 8.40, 270);
  eg.moebel('spiegelschrank', 8.195, 8.20, 270); eg.moebel('waschmaschine', 6.875, 9.10, 90);
  const og = P.neueEtage('Obergeschoss (Annahme: wie EG)', { innenwand: 0.25 });
  geschoss(og, 'mo_', true);
  og.moebel('treppeoben', 0.55, 2.55, 0);
  schreiben('vorlage_musterhaus2.js', 'musterhaus2',
    `/* Vorlage „Musterhaus“ für „Grundriss und Einrichtung“: Grundriss nach einer Vorlage des Nutzers (lichte Maße, Ursprung links oben,
   x nach rechts, y nach unten), mit Maßen aus der Zeichnung des Nutzers. Auf Wanddicke 25 cm angeglichen: die Seite erkennt eine Trennwand nur,
   wenn die Lücke höchstens Innenwand + 2 cm misst (hier 27 cm). Geändert: Lücke Wohnzimmer|Küche 28 → 26 cm und Lücke Flur|Zimmer, Bad 31 → 26 cm;
   dafür Küche 2 cm breiter (3,82 statt 3,80 m), Zimmer und Bad 4 cm tiefer (3,74 statt 3,70 m), Bad 1 cm schmaler (1,69 statt 1,70 m).
   Alle anderen Maße sind die des Nutzers (Gesamtbreite 8,28 m, Schlafzimmer bis 10,25 m), mit einer Ausnahme (27.10.2026): Die Fenster von Wohnzimmer
   (2,00 statt 1,40 m) und Schlafzimmer (1,70 statt 1,10 m), je Geschoss, sind breiter gezeichnet, damit jeder Raum die Fensterregel (Fensterfläche
   mindestens 1/8 der Raumfläche) in Bremen und Bayern erfüllt. BEWUSST GEBLIEBEN: Das Musterhaus hat keinen Abstellraum; das ist das Lehrbeispiel
   für die Karte „Regeln prüfen“ (Bremen verlangt einen Abstellraum je Wohnung und meldet ihn als gelben Hinweis „Abstellraum fehlt“).
   ANNAHMEN: Obergeschoss wie das Erdgeschoss (vom Nutzer nicht vorgegeben), Raumnamen oben neutral; Treppe (1,00 × 3,40 m) im Wohnzimmer
   statt im nur 1,32 m tiefen Flur (dort bliebe neben ihr 32 cm Durchgang und sie versperrte die Türen); Nord 270 Grad; Dach Satteldach 35 Grad,
   First entlang der langen Seite. Möbel: nur, was der Katalog hat (kein Ecksofa, Sessel, Teppich, keine Badewanne, WC, kein Waschbecken).
   Erzeugt von erzeuger/vorlagen_erzeugen.js, nicht von Hand ändern. Alle Zahlen sind Planungswerte, keine Bauzeichnung. */`, P);
  bericht('Musterhaus', P);
})();

/* ================= Kleines Haus, eingeschossig (erfunden) ================= */
(function () {
  const P = neuePlanung('klein', { nord: 0, dach: { form: 'sattel', neigung: 30, first: 'x', ueberstand: 0.3 } });
  const e = P.neueEtage('Erdgeschoss');
  e.raum('k_bad', 'Bad', 0, 0, 2.10, 2.90);
  e.raum('k_flur', 'Flur/Technik', 2.215, 0, 4.00, 2.90, { nutzung: 'flur' });
  e.raum('k_zimmer', 'Kleines Zimmer', 4.115, 0, 7.40, 2.90, { nutzung: 'arbeiten' });
  e.raum('k_wohn', 'Wohnen / Kochen', 0, 3.015, 4.40, 8.40);
  e.raum('k_schlaf', 'Schlafzimmer', 4.515, 3.015, 7.40, 8.40);
  e.oeffnung('tuer', 'k_flur', 0, 3.10, 1.00, { hoehe: 2.1 });
  e.oeffnung('tuer', 'k_wohn', 0, 3.20, 0.90);
  e.oeffnung('tuer', 'k_bad', 1, 1.45, 0.80);
  e.oeffnung('tuer', 'k_zimmer', 3, 1.45, 0.80);
  e.oeffnung('tuer', 'k_schlaf', 3, 7.00, 0.80);
  e.oeffnung('fenster', 'k_wohn', 2, 1.20, 1.60);
  e.oeffnung('fenster', 'k_wohn', 2, 3.30, 0.90, { hoehe: 2.1, bruestung: 0 });
  e.oeffnung('fenster', 'k_wohn', 3, 7.20, 1.20);
  e.oeffnung('fenster', 'k_schlaf', 2, 5.95, 1.40);
  e.oeffnung('fenster', 'k_schlaf', 1, 6.50, 1.00);
  e.oeffnung('fenster', 'k_zimmer', 1, 1.45, 1.00);
  e.oeffnung('fenster', 'k_bad', 0, 1.05, 0.60, { hoehe: 0.6, bruestung: 1.2 });
  e.moebel('kueche', 0.30, 4.55, 90); e.moebel('kuehlschrank', 0.285, 6.20, 90);
  e.moebel('esstisch', 2.45, 4.95, 0);
  e.moebel('stuhl', 2.10, 4.25, 0); e.moebel('stuhl', 2.80, 4.25, 0); e.moebel('stuhl', 2.10, 5.65, 180); e.moebel('stuhl', 2.80, 5.65, 180);
  e.moebel('sofa', 2.20, 7.85, 0); e.moebel('couchtisch', 2.20, 6.75, 0);
  e.moebel('bett180', 6.0, 4.10, 0); e.moebel('nachttisch', 4.80, 3.25, 0); e.moebel('nachttisch', 7.15, 3.25, 0); e.moebel('schrank2', 7.0, 8.10, 0);
  e.moebel('schreibtisch', 5.7, 0.35, 180); e.moebel('buerostuhl', 5.7, 1.00, 0); e.moebel('regal', 6.8, 2.75, 0);
  e.moebel('waschmaschine', 0.35, 2.55, 0); e.moebel('spiegelschrank', 2.015, 0.70, 270);
  schreiben('vorlage_klein.js', 'klein',
    `/* Vorlage „Kleines Haus“ für „Grundriss und Einrichtung“: eingeschossig, innen 7,40 × 8,40 m (außen etwa 8,0 × 9,0 m), Wohnfläche etwa 60 m².
   Ganz erfunden, keine echten Daten. Kompakter Quader ohne Vor- und Rücksprünge (Bericht recherche/29_hausform_dach.md: Erker und Versprünge
   verschlechtern die Kompaktheit), Fenster vor allem nach Süden (unten im Plan, Nord = 0), Satteldach 30 Grad, First waagerecht im Plan,
   damit eine Dachfläche nach Süden zeigt. Die Außenmaße weichen vom Wunsch 7,5 × 8,5 m ab, weil sonst nur etwa 50 m² Wohnfläche herauskommen.
   Erzeugt von erzeuger/vorlagen_erzeugen.js, nicht von Hand ändern. */`, P);
  bericht('Klein', P);
})();

/* ================= Großes Haus, zwei Geschosse (erfunden) ================= */
(function () {
  const P = neuePlanung('gross', { nord: 0, dach: { form: 'sattel', neigung: 35, first: 'x', ueberstand: 0.3 } });
  const eg = P.neueEtage('Erdgeschoss');
  eg.raum('ge_arbeit', 'Arbeitszimmer', 0, 0, 3.40, 4.40);
  eg.raum('ge_wc', 'WC', 3.515, 0, 5.30, 2.00);
  eg.raum('ge_hwr', 'HWR / Technik', 3.515, 2.115, 5.30, 4.40);
  eg.raum('ge_flur', 'Flur', 5.415, 0, 8.00, 4.40);
  eg.raum('ge_speis', 'Abstell', 8.115, 0, 10.00, 4.40);
  eg.raum('ge_wek', 'Wohnen / Essen / Küche', 0, 4.515, 10.00, 10.40);
  eg.oeffnung('tuer', 'ge_flur', 0, 6.25, 1.10, { hoehe: 2.1 });
  eg.oeffnung('tuer', 'ge_wek', 0, 6.00, 0.90);
  eg.oeffnung('tuer', 'ge_arbeit', 2, 1.70, 0.90);
  eg.oeffnung('tuer', 'ge_speis', 2, 9.00, 0.80);
  eg.oeffnung('tuer', 'ge_wc', 1, 1.00, 0.80);
  eg.oeffnung('tuer', 'ge_hwr', 1, 3.00, 0.80);
  eg.oeffnung('fenster', 'ge_wek', 2, 1.50, 1.60);
  eg.oeffnung('fenster', 'ge_wek', 2, 3.90, 1.60);
  eg.oeffnung('fenster', 'ge_wek', 2, 6.50, 1.20, { hoehe: 2.1, bruestung: 0 });
  eg.oeffnung('fenster', 'ge_wek', 2, 8.60, 1.20);
  eg.oeffnung('fenster', 'ge_wek', 3, 7.50, 1.40);
  eg.oeffnung('fenster', 'ge_wek', 1, 9.20, 1.00);
  eg.oeffnung('fenster', 'ge_arbeit', 0, 1.70, 1.40);
  eg.oeffnung('fenster', 'ge_arbeit', 3, 1.80, 1.20);
  eg.oeffnung('fenster', 'ge_wc', 0, 4.40, 0.60, { hoehe: 0.6, bruestung: 1.2 });
  eg.moebel('treppe', 7.47, 1.85, 180);
  eg.moebel('schreibtisch', 1.70, 0.35, 180); eg.moebel('buerostuhl', 1.70, 1.00, 0); eg.moebel('regal', 3.26, 2.60, 90);
  eg.moebel('waschmaschine', 3.95, 3.95, 0); eg.moebel('trockner', 4.75, 3.95, 0);
  eg.moebel('sofa', 2.50, 9.00, 0); eg.moebel('couchtisch', 2.50, 7.80, 0); eg.moebel('tvboard', 2.50, 5.40, 180);
  eg.moebel('kueche', 9.70, 7.00, 270); eg.moebel('kuehlschrank', 9.715, 5.25, 270);
  eg.moebel('esstisch', 6.80, 7.20, 0);
  eg.moebel('stuhl', 6.45, 6.50, 0); eg.moebel('stuhl', 7.15, 6.50, 0); eg.moebel('stuhl', 6.45, 7.90, 180); eg.moebel('stuhl', 7.15, 7.90, 180);
  const og = P.neueEtage('Obergeschoss');
  og.raum('go_schlaf2', 'Schlafzimmer 2', 0, 0, 3.40, 4.40);
  og.raum('go_flur', 'Flur / Galerie', 3.515, 0, 8.00, 4.40);
  og.raum('go_bad', 'Bad', 8.115, 0, 10.00, 4.40);
  og.raum('go_ankleide', 'Ankleide / Abstell', 0, 4.515, 6.40, 6.30);
  og.raum('go_eltern', 'Schlafzimmer 1', 0, 6.415, 6.40, 10.40);
  og.raum('go_zimmer3', 'Schlafzimmer 3', 6.515, 4.515, 10.00, 10.40);
  og.oeffnung('tuer', 'go_schlaf2', 1, 1.80, 0.90);
  og.oeffnung('tuer', 'go_bad', 3, 1.80, 0.80);
  og.oeffnung('tuer', 'go_ankleide', 0, 4.60, 0.90);
  og.oeffnung('tuer', 'go_eltern', 0, 3.00, 0.90);
  og.oeffnung('tuer', 'go_zimmer3', 0, 7.30, 0.90);
  og.oeffnung('fenster', 'go_schlaf2', 0, 1.70, 1.40);
  og.oeffnung('fenster', 'go_schlaf2', 3, 1.80, 1.20);
  og.oeffnung('fenster', 'go_flur', 0, 5.75, 1.20);
  og.oeffnung('fenster', 'go_bad', 0, 9.05, 0.60, { hoehe: 0.6, bruestung: 1.2 });
  og.oeffnung('fenster', 'go_ankleide', 3, 5.40, 1.00);
  og.oeffnung('fenster', 'go_eltern', 3, 9.30, 1.00);
  og.oeffnung('fenster', 'go_eltern', 2, 1.60, 1.60);
  og.oeffnung('fenster', 'go_eltern', 2, 4.40, 1.60);
  og.oeffnung('fenster', 'go_zimmer3', 2, 8.25, 1.60);
  og.oeffnung('fenster', 'go_zimmer3', 1, 9.00, 1.20);
  og.oeffnung('fenster', 'go_zimmer3', 1, 5.60, 1.00);
  og.moebel('treppeoben', 7.47, 1.85, 180);
  og.moebel('bett140', 1.50, 1.35, 0); og.moebel('schrank2', 0.45, 4.05, 180);
  og.moebel('bett180', 5.33, 8.40, 90); og.moebel('nachttisch', 6.18, 7.25, 90); og.moebel('nachttisch', 6.18, 9.55, 90); og.moebel('schrank3', 0.30, 7.30, 90);
  og.moebel('bett140', 8.60, 5.70, 0); og.moebel('schreibtisch', 7.20, 10.05, 180); og.moebel('buerostuhl', 7.20, 9.40, 0);
  og.moebel('waschmaschine', 8.45, 4.10, 0); og.moebel('spiegelschrank', 9.915, 2.70, 270);
  schreiben('vorlage_gross.js', 'gross',
    `/* Vorlage „Großes Haus“ für „Grundriss und Einrichtung“: zwei Geschosse, innen 10,0 × 10,4 m (außen etwa 10,6 × 11,0 m), Wohnfläche etwa 200 m².
   Ganz erfunden, keine echten Daten. Kompakter Quader, Wohnbereich im Süden (unten im Plan, Nord = 0), Eingang, Treppe und Nebenräume im Norden,
   Satteldach 35 Grad mit waagerechtem First, damit eine Dachfläche nach Süden zeigt (Bericht recherche/29_hausform_dach.md). Treppe 1,00 × 3,40 m
   gerade, Steigung etwa 18 cm (Maß geschätzt). Die Außenmaße sind größer als der Wunsch 10 × 11 m, damit die Wohnfläche bei 200 m² landet.
   Erzeugt von erzeuger/vorlagen_erzeugen.js, nicht von Hand ändern. */`, P);
  bericht('Groß', P);
})();

if (fehler.length) { console.log('FEHLER:\n  ' + fehler.join('\n  ')); process.exit(1); }
console.log('Vorlagen geschrieben.');
