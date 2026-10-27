# -*- coding: utf-8 -*-
"""Erzeugt alle sechs Datendateien der Welle D (daten/*.js). Aufruf: python erzeuger/daten_d_alle.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')

import daten_d_innenausbau as a
import daten_d_energie as b
import daten_d_material as c
import daten_d_formen as d
import daten_d_daemmung_lueftung as e
import daten_d_wasser as f
from daten_d_common import schreibe

KOEPFE = {
    'innenausbau': 'Innenausbau je Gewerk (Preise, Einheiten nach Grundrissmenge) und Ausstattungswerte. Quelle: recherche/22_innenausbau_solar.md (Abruf 26.10.2026). Erzeugt von erzeuger/daten_d_innenausbau.py.',
    'energie': 'Energie: PV-Preise, Speicher, Ertrag, EEG, Bundesregeln, 14a, Solarthermie. Quellen: recherche/22, 23, 29, 34, 37, 39 (Abruf 26./27.10.2026). Erzeugt von erzeuger/daten_d_energie.py.',
    'material': 'Baumaterial je Bauteil, eine Zeile je Material und Kriterium. Quelle: recherche/30_baumaterial.md (Abruf 27.10.2026). Erzeugt von erzeuger/daten_d_material.py.',
    'formen': 'Hausformen (A/V) und Dachformen (Kosten, Lebensdauer, Raum, PV, Genehmigung). Quelle: recherche/29_hausform_dach.md (Abruf 27.10.2026). Kuppel-Daten schwach. Erzeugt von erzeuger/daten_d_formen.py.',
    'daemmung_lueftung': 'Dämmstandards (GModG, KfW, Passivhaus), Lüftung, Kamin (1. BImSchV, MFeuV), Brennholz, Wintergarten. Quellen: recherche/31, 33, 37 (Abruf 27.10.2026), 37 hat Vorrang. Erzeugt von erzeuger/daten_d_daemmung_lueftung.py.',
    'wasser': 'Wasser: Niederschlag 1991-2020 (DWD, CC BY 4.0), Härte, TrinkwV, Regenwasser, Gebühren, Enthärtung, Preise. Quellen: recherche/32, 37 (Abruf 27.10.2026), 37 hat Vorrang. Erzeugt von erzeuger/daten_d_wasser.py.',
}
for name, mod in [('innenausbau', a), ('energie', b), ('material', c), ('formen', d), ('daemmung_lueftung', e), ('wasser', f)]:
    pfad, groesse = schreibe(name, KOEPFE[name], mod.OBJ)
    print(name, groesse, 'Bytes', pfad)
