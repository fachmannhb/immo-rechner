# -*- coding: utf-8 -*-
"""Erzeugt daten/wasser_seite.js, die schlanke Fassung von daten/wasser.js fuer die Seite (Welle D, Teil 2b).
Die Datei setzt window.DATEN.wasser (gleiche Form wie daten/wasser.js, nur weniger Zeilen); wasser.js selbst wird nicht eingebettet und bleibt vollstaendig im Repository.
Weggelassen: Zeilen, die die Seite nicht zeigt (Widersprueche, Einzeljahres-Hinweis, Lizenzzeile, rw_din, rw_wc_bedarf, rw_ersparnis, hr_pflicht, Teile des Trinkwasserrechts,
Bremer Foerderrichtlinie (abgelaufen), Teile der Enthaertung), nicht benutzte Quellen und das Feld "ref". Zeilen werden nur weggelassen, nie veraendert.
Aufruf (im Ordner werkzeuge):  python -I -X utf8 erzeuger/daten_d_wasser_seite.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

import daten_d_wasser as quelle
from daten_d_common import DATEN, _j

OBJ_VOLL = quelle.OBJ
BEHALTEN = {
    'haerte': ['hr_weich', 'hr_mittel', 'hr_hart'],
    'trinkwasserrecht': ['tw_anzeige', 'tw_natrium'],
    'regenwasser': ['rw_formel', 'rw_speicher', 'rw_ertragsbeiwert', 'rw_ertragsbeiwert_gruen', 'rw_satzung', 'rw_filter', 'rw_kosten', 'rw_pumpe'],
    'gebuehren': ['gb_bremen', 'gb_spanne', 'gb_zisterne', 'gb_bremen_zisterne', 'gb_berlin'],
    'enthaertung': ['en_warentest', 'en_vz_nrw', 'en_salz_vz', 'en_anschaffung', 'en_einbau', 'en_betrieb', 'en_wartung', 'en_kalkwandler'],
}
META = OBJ_VOLL['meta']
obj = {'meta': {k: META[k] for k in ('titel', 'abruf', 'dwd_attribution', 'dwd_lizenz') if k in META}}   # die langen Hinweistexte bleiben in wasser.js
benutzt = set()


def schlank(z):
    return {k: v for k, v in z.items() if k != 'ref'}


# Niederschlag: alle Laenderzeilen (mit Kuerzel) und Deutschland; ohne Einzeljahres-Hinweis und Lizenzzeile.
# Die Seite zeigt nur das Mittel 1991 bis 2020: die Einzeljahre (j2024, j2025) und der Hinweistext der Naeherung bleiben in wasser.js.
obj['niederschlag'] = [{k: v for k, v in schlank(z).items() if k not in ('j2024', 'j2025', 'hinweis')} for z in OBJ_VOLL['niederschlag'] if z.get('kuerzel')]
for name, ids in BEHALTEN.items():
    vorhanden = {z['id']: z for z in OBJ_VOLL[name]}
    fehlt = [i for i in ids if i not in vorhanden]
    if fehlt:
        raise SystemExit('Zeilen fehlen in wasser.%s: %s' % (name, ', '.join(fehlt)))
    obj[name] = [schlank(vorhanden[i]) for i in ids]
obj['wasserpreise'] = [schlank(z) for z in OBJ_VOLL['wasserpreise']]
for liste in [k for k in obj if k != 'meta']:
    for z in obj[liste]:
        if z.get('quelle'):
            benutzt.add(z['quelle'])
fehlend = sorted(q for q in benutzt if q not in OBJ_VOLL['quellen'] and q != 'luecke')
if fehlend:
    raise SystemExit('Quellen fehlen in wasser: ' + ', '.join(fehlend))
obj['quellen'] = {k: v for k, v in OBJ_VOLL['quellen'].items() if k in benutzt}
KOPF = ('Wasser: schlanke Fassung von daten/wasser.js für die Seite (Welle D, Teil 2b). Niederschlag 1991-2020 (DWD, CC BY 4.0), Härte, TrinkwV, Regenwasser, Gebühren, Enthärtung, Preise. '
        'Quellen: recherche/32, 37 (Abruf 27.10.2026), 37 hat Vorrang. Erzeugt von erzeuger/daten_d_wasser_seite.py.')
zeilen = ['{']
items = list(obj.items())
for i, (k, v) in enumerate(items):
    komma = ',' if i < len(items) - 1 else ''
    if isinstance(v, list) and v and all(isinstance(x, dict) for x in v):
        zeilen.append(_j(k) + ':[')
        for j, x in enumerate(v):
            zeilen.append(_j(x) + (',' if j < len(v) - 1 else ''))
        zeilen.append(']' + komma)
    else:
        zeilen.append(_j(k) + ':' + _j(v) + komma)
zeilen.append('}')
text = '/* ' + KOPF + ' */\nwindow.DATEN = window.DATEN || {};\nwindow.DATEN.wasser = ' + '\n'.join(zeilen) + ';\n'
pfad = os.path.join(DATEN, 'wasser_seite.js')
with open(pfad, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)
print('wasser_seite', len(text.encode('utf-8')), 'Bytes', pfad, '| Quellen:', len(obj['quellen']))
