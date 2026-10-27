// Erzeugt daten/material_seite.js: die schlanke Fassung von daten/material.js, die in die Seite eingebettet wird (Welle D Teil 2a).
// Aufruf im Ordner werkzeuge:  node erzeuger/material_seite_erzeugen.js
// Weggelassen: Kennwerte, die die Seite nicht zeigt (Rohdichte, Druckfestigkeit, Masse, Zulassung, Anforderung, Eignung, Sommer, mu, Rueckbau, Nutzungsdauer 2017/andere,
// Waermeleitgruppe) und das Feld ref (UUIDs). Dazu: Namen der Preisbasen und die Grenzwerte aus Anlage 7 (aus daten/daemmung_lueftung.js).
// Nicht von Hand aendern: Aenderungen in daten/material.js (Erzeuger daten_d_material.py) oder hier.
const fs = require('fs'), path = require('path'), vm = require('vm');
const BASIS = path.join(__dirname, '..');
function lade(datei) {
  const ctx = vm.createContext({ window: { DATEN: {} } });
  vm.runInContext(fs.readFileSync(path.join(BASIS, datei), 'utf8'), ctx, { filename: datei });
  return ctx.window.DATEN;
}
const M = lade('daten/material.js').material;
const DL = lade('daten/daemmung_lueftung.js');
const dlName = Object.keys(DL)[0];
const DLD = DL[dlName];

function finde(id) {
  for (const k of Object.keys(DLD)) {
    if (Array.isArray(DLD[k])) { const z = DLD[k].find(x => x && x.id === id); if (z) return z; }
  }
  return null;
}
const WEG = new Set(['rohdichte', 'druckfestigkeit', 'wlg', 'gewicht', 'zulassung', 'anforderung', 'eignung', 'sommer', 'mu', 'rueckbau', 'lebensdauer_2017', 'lebensdauer_andere']);
const kennwerte = M.kennwerte.filter(k => !WEG.has(k.kriterium)).map(k => { const o = Object.assign({}, k); delete o.ref; return o; });
const kriterien = M.meta_kriterien.filter(k => !WEG.has(k.id));

const a7map = { wand: 'a7_wand', fenster: 'a7_fenster', glas: 'a7_glas', tuer: 'a7_tuer', dach: 'a7_dach', decke_unten: 'a7_decke_fbh' };
const anlage7 = {};
for (const [k, id] of Object.entries(a7map)) {
  const z = finde(id);
  if (!z) throw new Error('Anlage-7-Zeile fehlt: ' + id);
  anlage7[k] = { id: id, u: z.von, name: z.name, ref: z.ref || '', quelle: z.quelle, abruf: z.abruf, status: z.status };
}
const basisNamen = {
  wand: 'je m² Wand (Seitenstand etwa 2 Jahre alt)',
  daemm_u024: 'je m², Dicke wie im Hinweis, für U = 0,24',
  daemm_gmodg: 'je m², Dämmdicke nach GEG (Dicke nicht genannt)',
  fassade: 'je m² Fassade mit Montage',
  dach: 'je m², Material oder Verlegung nicht angegeben',
  dach_verlegt: 'je m² inklusive Verlegung',
  dach_material: 'je m², nur Material',
  dach_sanierung: 'je m² Flachdachsanierung',
  gruen: 'je m² Gründach (Preisstand 2022)',
  fenster_stueck: 'je Fenster, ohne Einbau',
  fenster_m2: 'je m² Fensterfläche',
  boden_verlegt: 'je m² inklusive Verlegung',
  haus: 'je m² Haus gesamt (kein Wandpreis)'
};
// Vergleichswerte fuer den Heizwaerme-Balken (IWU-Beispielhaus, Bestand dena): Zeilen der Liste altbau_heizwaerme
const refIds = ['ab_efh_ist', 'ab_efh_p1', 'ab_efh_p2', 'ab_dena'];
const heizReferenz = refIds.map(id => {
  const z = (DLD.altbau_heizwaerme || []).find(x => x.id === id);
  if (!z) throw new Error('Referenzzeile fehlt: ' + id);
  const wert = z.von != null ? z.von : z.klimabereinigt;
  return { id: id, name: z.name, wert: wert, einheit: z.einheit, quelle: z.quelle, abruf: z.abruf, status: z.status };
});
const quellenDl = {};
heizReferenz.forEach(r => { const q = DLD.quellen && DLD.quellen[r.quelle]; if (q) quellenDl[r.quelle] = q; });
Object.assign(M.quellen, quellenDl);
const out = {
  meta: Object.assign({}, M.meta, { erzeugt: 'erzeuger/material_seite_erzeugen.js aus daten/material.js (schlanke Fassung für die Seite)' }),
  quellen: M.quellen,
  meta_bauteile: M.meta_bauteile,
  meta_materialien: M.meta_materialien,
  meta_kriterien: kriterien,
  kennwerte: kennwerte,
  ampel: M.ampel,
  anlage7: anlage7,
  heizwaerme_referenz: heizReferenz,
  basis_namen: basisNamen
};
const kopf = '/* Baumaterial je Bauteil (schlanke Fassung von daten/material.js für die Seite). Erzeugt von erzeuger/material_seite_erzeugen.js, nicht von Hand ändern.\n' +
  '   Alle Preise: prüfen vor Nutzung, keine amtliche Preisquelle; Preisbasen nie auf einem Balken mischen (Feld basis). Anlage 7 = Grenzwerte des GModG bei Änderung am Bestand. */\n';
const text = kopf + 'window.DATEN = window.DATEN || {};\nwindow.DATEN.material = ' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(BASIS, 'daten', 'material_seite.js'), text, 'utf8');
console.log('daten/material_seite.js geschrieben: ' + Math.round(Buffer.byteLength(text) / 1024) + ' KB, Kennwerte ' + kennwerte.length + ' von ' + M.kennwerte.length + ', Materialien ' + M.meta_materialien.length);
