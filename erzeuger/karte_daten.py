# Erzeugt daten/karte_werte.js aus den geprüften Rohdaten in recherche/karte_roh/ (INKAR, Zensus 2022).
# Seit 26.10.2026 ohne Portalpreise: Die Nutzungsbedingungen des Portals verbieten die Weiterverarbeitung (Bericht recherche/21).
# Amtliche Preise je Land und Stadt stehen in daten/preise_amtlich.js (erzeugt von erzeuger/preise_daten.py).
# Aufruf: python -I -X utf8 erzeuger/karte_daten.py
import csv, json
from pathlib import Path

basis = Path(__file__).resolve().parent.parent
roh = basis / 'recherche' / 'karte_roh'

# INKAR (BBSR), dl-de/by-2.0; Kennzahl-Nummern im INKAR-Katalog geprüft
INKAR = [  # (Spalte in der CSV, Kurzname, Beschriftung, Einheit, Nachkommastellen)
    ('einwohner', 'ew', 'Einwohner', '', 0),
    ('entw_einwohner_5j_pct', 'e5', 'Bevölkerung, Veränderung 5 Jahre', '%', 1),
    ('entw_einwohner_10j_pct', 'e10', 'Bevölkerung, Veränderung 10 Jahre', '%', 1),
    ('prog_bev_2022_2045_pct', 'p45', 'Bevölkerungsprognose 2022 bis 2045', '%', 1),
    ('bauland_eur_m2', 'bau', 'Kaufwert Bauland', '€/m²', 0),
    ('beschaeftigte_arbeitsort_anzahl', 'besch', 'Beschäftigte am Arbeitsort', '', 0),
    ('einpendler_anzahl', 'ein', 'Einpendler', '', 0),
    ('auspendler_anzahl', 'aus', 'Auspendler', '', 0),
    ('pendlersaldo_je100', 'saldo', 'Pendlersaldo je 100 Beschäftigte', '', 1),
    ('studierende_anzahl', 'stud', 'Studierende', '', 0),
    ('studierende_je1000', 'studq', 'Studierende je 1.000 Einwohner', '', 1),
]
with open(roh / 'inkar_bbsr' / 'inkar_kreise_neuestes_jahr.csv', encoding='utf-8') as f:
    zeilen = list(csv.DictReader(f, delimiter=';'))
kreise = {}
jahre = {}
for z in zeilen:
    d = {}
    for spalte, kurz, _, _, nk in INKAR:
        w = z.get(spalte, '').strip()
        if w not in ('', 'NA', 'None'):
            d[kurz] = round(float(w), nk) if nk else int(round(float(w)))
            jahre.setdefault(kurz, set()).add(z.get(spalte + '_jahr', ''))
    kreise[z['kreis_ags']] = d


# Zensus 2022 (JSON-stat), dl-de/by-2.0: Leerstandsquote WHG009, marktaktiv WHG014, Nettokaltmiete WHG012
def jsonstat(datei, code, stichtag='2022-05-15'):
    d = json.loads((roh / 'zensus2022' / datei).read_text(encoding='utf-8'))
    if isinstance(d, str):
        d = json.loads(d)
    ds = d['data'][0]
    ids, size = ds['id'], ds['size']
    idx = {k: ds['dimension'][k]['category']['index'] for k in ids}
    wahl = {'statistic': 0, 'STAG': idx['STAG'][stichtag], 'content': idx['content'][code]}
    out = {}
    for ags, g in idx['GEOLK4'].items():
        pos = 0
        for k, n in zip(ids, size):
            pos = pos * n + (g if k == 'GEOLK4' else wahl[k])
        w = ds['value'][pos] if isinstance(ds['value'], list) else ds['value'].get(str(pos))
        if w is not None:
            out[ags] = w
    return out


for datei, code, kurz in [('data_4000W-0001_kreise_raw.json', 'WHG009$QMU', 'leer'),
                          ('data_4000W-0002_kreise_raw.json', 'WHG014$QMU', 'leerm'),
                          ('data_4000W-0004_kreise_raw.json', 'WHG012$QMU', 'miete')]:
    for ags, w in jsonstat(datei, code).items():
        kreise.setdefault(ags, {})[kurz] = w

daten = {
    'felder': {kurz: {'name': name, 'einheit': einheit, 'jahr': '/'.join(sorted(j for j in jahre.get(kurz, []) if j))}
               for _, kurz, name, einheit, _ in INKAR},
    'kreise': kreise,
    'quellen': {
        'inkar': 'BBSR, INKAR – Indikatoren und Karten zur Raum- und Stadtentwicklung (inkar.de), Abruf 08.10.2026, dl-de/by-2-0',
        'zensus': '© Statistische Ämter des Bundes und der Länder, Zensus 2022 (Stichtag 15.05.2022), Tabellen 4000W-0001, -0002, -0004, Abruf 08.10.2026, dl-de/by-2-0'
    }
}
daten['felder'].update({'leer': {'name': 'Leerstandsquote', 'einheit': '%', 'jahr': '2022'},
                        'leerm': {'name': 'Marktaktiver Leerstand', 'einheit': '%', 'jahr': '2022'},
                        'miete': {'name': 'Durchschnittliche Nettokaltmiete', 'einheit': '€/m²', 'jahr': '2022'}})
js = ('/* Kennzahlen je Landkreis für die Deutschlandkarte. Erzeugt von erzeuger/karte_daten.py, nicht von Hand bearbeiten.\n'
      '   Quellen und Lizenz: siehe quellen (INKAR/BBSR und Zensus 2022 unter dl-de/by-2-0). */\n'
      'window.DATEN = window.DATEN || {};\nwindow.DATEN.kartewerte = ') + json.dumps(daten, ensure_ascii=False, separators=(',', ':')) + ';\n'
(basis / 'daten' / 'karte_werte.js').write_text(js, encoding='utf-8')
voll = sum(1 for d in kreise.values() if all(k in d for k in ('e5', 'p45', 'leer', 'miete', 'besch', 'stud')))
print('Kreise', len(kreise), 'vollständig', voll, 'Datei', round(len(js.encode('utf-8')) / 1024), 'KB')
print('Bremen', kreise['04011'])
print('Jahre', {k: v['jahr'] for k, v in daten['felder'].items()})
