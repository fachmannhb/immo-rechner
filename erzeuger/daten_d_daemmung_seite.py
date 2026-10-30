# -*- coding: utf-8 -*-
"""Erzeugt daten/daemmung_seite.js, die schlanke Fassung von daten/daemmung_lueftung.js fuer die Seite (Welle D, Teil 2b).
Nur die Zeilen, die die Karten "Wie gut gedaemmt?" und "Frische Luft" zeigen, plus die dort referenzierten Quellen; das Feld "ref" faellt weg.
Nicht eingebettet: kamin, brennholz, wintergarten_anbau, grill_feuerstelle, gmodg_anlage7 (die Grenzwerte stehen schon in daten/material_seite.js unter anlage7),
die Liste gmodg, nicht gezeigte Zeilen und die Widersprueche (sie stehen in der README, Tabelle Welle D Teil 2b).
daten/daemmung_lueftung.js bleibt vollstaendig im Repository (die Seite darf Zeilen nur weglassen, nie aendern).
Aufruf (im Ordner werkzeuge):  python -I -X utf8 erzeuger/daten_d_daemmung_seite.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

import daten_d_daemmung_lueftung as quelle
from daten_d_common import schreibe

OBJ_VOLL = quelle.OBJ
BEHALTEN = {
    'altbau_heizwaerme': ['ab_efh_ist'],
    'kfw': ['kfw261_eh40', 'kfw261_eh55', 'kfw261_eh70', 'kfw261_eh85', 'kfw261_boni', 'kfw261_stand', 'kfw297', 'kfw_mehrkosten'],
    'beg_einzelmassnahmen': ['beg_huelle', 'beg_hoechst', 'beg_lueftung_satz', 'beg_lueftung_wbg', 'beg_lueftung_nachweis', 'beg_alter'],
    'passivhaus': ['ph_heizwaerme', 'ph_luft', 'ph_mehrkosten'],
    'lueftung': ['lu_dez_abluft', 'lu_dez_wrg', 'lu_zentral', 'lu_zentral2', 'lu_strom', 'lu_strom2', 'lu_wrg_praxis', 'lu_filter_wechsel', 'lu_filter_preis', 'lu_luecke'],
}

obj = {'meta': {k: v for k, v in OBJ_VOLL['meta'].items() if k in ('titel', 'abruf')}}   # der lange Hinweistext bleibt in daemmung_lueftung.js
benutzt = set()
for name, ids in BEHALTEN.items():
    vorhanden = {z['id']: z for z in OBJ_VOLL[name]}
    fehlt = [i for i in ids if i not in vorhanden]
    if fehlt:
        raise SystemExit('Zeilen fehlen in daemmung_lueftung.%s: %s' % (name, ', '.join(fehlt)))
    zeilen = []
    for i in ids:
        z = {k: v for k, v in vorhanden[i].items() if k != 'ref'}
        zeilen.append(z)
        if z.get('quelle'):
            benutzt.add(z['quelle'])
    obj[name] = zeilen
fehlend = sorted(q for q in benutzt if q not in OBJ_VOLL['quellen'] and q != 'luecke')
if fehlend:
    raise SystemExit('Quellen fehlen in daemmung_lueftung: ' + ', '.join(fehlend))
obj['quellen'] = {k: v for k, v in OBJ_VOLL['quellen'].items() if k in benutzt}
KOPF = ('Dämmstandard, Förderung, Lüftung: schlanke Fassung von daten/daemmung_lueftung.js für die Seite (Welle D, Teil 2b). '
        'Quellen: recherche/31, 33, 37 (Abruf 27.10.2026), 37 hat Vorrang. Erzeugt von erzeuger/daten_d_daemmung_seite.py.')
pfad, groesse = schreibe('daemmung_seite', KOPF, obj)
print('daemmung_seite', groesse, 'Bytes', pfad, '| Zeilen:', ', '.join('%s=%d' % (n, len(obj[n])) for n in BEHALTEN), '| Quellen:', len(obj['quellen']))
