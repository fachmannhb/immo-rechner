# -*- coding: utf-8 -*-
"""Erzeugt daten/sauna.js (window.DATEN.sauna) fuer die Karte "Sauna" (Auftrag S1, 31.10.2026).
Quellen: recherche/43_sauna_bau.md (Ids S-xx) und recherche/44_sauna_bau_luecken.md (Ids S2-xx; 44 ersetzt/ergaenzt 43, wo dort vermerkt).
Uebernommen werden nur Werte, deren Id im Bericht als Tabellenzeile steht ("A5:n" = Zeile n der Tabelle "Abschnitt 5: Bauablauf" in Bericht 43).
Der Erzeuger prueft selbst: jede angegebene Id muss als Zeile "| Id |" im Bericht stehen, und jede Zahl in PRUEF/FERTIG_PRUEF muss in genau dieser Zeile vorkommen (sonst Abbruch, nichts geschrieben).

Status-Abbildung (Bericht -> Datei):
  geprueft ...                      -> geprüft
  geprueft mit Vorbehalt (S2-01)    -> prüfen vor Nutzung (R074)
  pruefen vor Nutzung (Haendler)    -> prüfen vor Nutzung
  unsicher (nur Suchtreffer)        -> nicht uebernommen (R074; spart Platz, die Seite zeigt "Keine Angabe"): S2-31a, S2-32a, S2-33, S2-37c, S-35, S2-01a
  Luecke / nicht lesbar             -> Lücke
  nicht verwendbar (S-34, S-81, S-28) und Preise aus Oesterreich/Schweiz (S-65, S-66, S-81, W-6) -> nicht uebernommen
Die Genehmigungs-Zahlen stehen NICHT hier (daten/verfahrensfrei.js, eine Ampel). Der Strompreis steht in daten/energiepreise.js (strom_destatis_alle).
Aufruf: python -I -X utf8 erzeuger/daten_s_sauna.py"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import schreibe, HIER

BERICHTE = os.path.join(os.path.dirname(HIER), 'recherche')
B43 = open(os.path.join(BERICHTE, '43_sauna_bau.md'), encoding='utf-8').read().split('\n')
B44 = open(os.path.join(BERICHTE, '44_sauna_bau_luecken.md'), encoding='utf-8').read().split('\n')
G, P, U, L = 'geprüft', 'prüfen vor Nutzung', 'unsicher', 'Lücke'
ABRUF = '2026-10-31'
fehler = []


def zeile(i):
    if i.startswith('A5:'):
        n = i[3:]
        ab5 = False
        for z in B43:
            if z.startswith('## Abschnitt 5'):
                ab5 = True
            elif z.startswith('## Abschnitt 6'):
                ab5 = False
            if ab5 and (z.startswith('| ' + n + ' ') or z.startswith('| ' + n + 'a ')):
                return z
        return None
    for z in (B44 if i.startswith('S2-') else B43):
        if z.startswith('| ' + i + ' |'):
            return z
    return None


def pruefe(i, *chk):
    z = zeile(i)
    if z is None:
        fehler.append(f'Id {i} steht in keinem Bericht als Tabellenzeile')
        return
    for c in chk:
        if c not in z:
            fehler.append(f'{i}: "{c}" fehlt in der Berichtszeile')


def hb(art, titel):
    return [titel, f'https://www.hornbach.de/p/s/{art}/']   # Hornbach loest die Artikelnummer auf (am 31.10.2026 geprueft: 12012596)


Q = {
    'WEKA': ['Weka Saunaofen Kompakt (3,6 kW), Anleitung 2019', 'https://media.hornbach.de/hb/ownersmanual/as.46997682.pdf'],
    'K9': ['Karibu/Weka Saunaofen 9 kW (Art.-Nr. 66601), Anleitung 2015', 'https://media.hornbach.at/hb/ownersmanual/as.46513844.pdf'],
    'KOFEN': ['Karibu, Ofenleistung nach Volumen', 'https://en.karibu.de/info/wissenswertes/sauna-wissen/welcher-saunaofen'],
    'KINFO': ['Karibu, Produktinformation 40 mm Sauna', 'https://www.karibu-saunen.de/media/Uploaded/allg_hinweise_sauna_40mm.pdf'],
    'WKAAPI': ['Weka Saunahaus Kaapi 2, Montageanleitung 2622', 'https://cdn.koempf24.de/product/11afc7/kaapi-2-ma-2.pdf?fm=pdf'],
    'EINHELL': ['Einhell, DIY-Projekt Sauna (Heimwerker, kein Fachbetrieb)', 'https://www.einhell.de/fileadmin/de/diy-projects/einhell-diy-projekt-sauna.pdf'],
    'VDE': ['VDE Verlag, DIN VDE 0100-703:2006-02', 'https://vde-verlag.de/standards/0100107/din-vde-0100-703-vde-0100-703-2006-02.html'],
    'LWG': ['LWG Bayern, Holz der Schwarzerle, Tab. 1 (DIN 68364)', 'https://lwg.bayern.de/mam/cms04/forsttechnik-holz/dateien/w42_das_holz_der_schwarzerle-eigenschaften_verwendung.pdf'],
    'THERMORY': ['Thermory, Sauna-Katalog 0422 (Hersteller, Werbung)', 'https://thermory.com/wp-content/uploads/2022/08/Thermory_Sauna_materials_Product_catalogue_0422-A4_GER_web.pdf'],
    'HOHMANN': ['Holz-Hohmann Shop, Bremen', 'https://shop.holz-hohmann.de/?s=sauna&post_type=product'],
    'ESAUNA': ['esaunashop.com', 'https://esaunashop.com/'],
    'HBLINDE': ['Hornbach.de, Banklatte Linde 10571514', 'https://www.hornbach.de/p/s/10571514/'],
    'HBFICHTE': ['Hornbach.de, Faseprofil Fichte 3558234', 'https://www.hornbach.de/p/s/3558234/'],
    'HBOFEN': ['Hornbach.de, Suchlisten Saunazubehör', 'https://www.hornbach.de/s/Saunaofen'],
    'CHECK24': ['Check24 Preisvergleich (Händler offen, „ab“-Preise)', 'https://preisvergleich.check24.de/ul/gartensaunen/'],
    'B33': ['Bericht 33: Kamin, 1. BImSchV', 'recherche/33_anbau_kamin_grill.md'],
    'B43': ['Bericht 43: Sauna bauen', 'recherche/43_sauna_bau.md'],
    'B44': ['Bericht 44: Sauna, zweite Runde', 'recherche/44_sauna_bau_luecken.md'],
    'HB-T2': hb(12012596, 'Hornbach.de, Karibu Talos 2 Express'), 'HB-T1': hb(12198205, 'Hornbach.de, Karibu Talos 1'), 'HB-T0': hb(12198189, 'Hornbach.de, Karibu Talos 0'),
    'HB-T3': hb(12198244, 'Hornbach.de, Karibu Talos 3'), 'HB-D3': hb(12869518, 'Hornbach.de, Karibu Dyka 3'), 'HB-T6': hb(12198230, 'Hornbach.de, Karibu Talos 6'),
    'HB-NA': hb(6627254, 'Hornbach.de, Weka Naantali'), 'HB-F2': hb(10474213, 'Hornbach.de, Karibu Fassy 2'), 'HB-CU': hb(12097871, 'Hornbach.de, Home Deluxe Cube Deluxe L'),
    'HB-FT': hb(12083846, 'Hornbach.de, FinnTherm Spruce'), 'HB-SK': hb(12097841, 'Hornbach.de, Home Deluxe Skyline XL Big'),
}


def p(v, h, i, q, s=P, **kw):
    d = {'v': v, 'h': h, 'i': i, 'quelle': q, 'status': s}
    d.update(kw)
    return d


def e(wert, i, q, s):
    return [wert, i, q, s]


# Holz: Eigenschaften nur aus S2-01/01a/02/03/04/05 (die Tabelle in 43 hat keine Ids), Preise aus S2-3x
HOLZ = [
    {'id': 'fichte', 'name': 'Fichte', 'wand': e('ja', 'S2-05', 'KINFO', G), 'bank': None, 'harz': e('Harzausfluss unvermeidbar, gering (Karibu, Weka)', 'S2-03', 'WKAAPI', G), 'splitter': None, 'rho': e(470, 'S2-01', 'LWG', P),
     'm2': [p(17.85, 'Holz-Hohmann', 'S2-30', 'HOHMANN'), p(18.90, 'Hornbach', 'S2-30a', 'HBFICHTE', hinweis='nicht als Sauna ausgewiesen', ausser=True)], 'lfm': []},
    {'id': 'espe', 'name': 'Espe', 'wand': e('ja', 'S2-31', 'HOHMANN', P), 'bank': e('ja', 'S2-05', 'KINFO', G), 'harz': e('kein Harz (Thermory)', 'S2-02', 'THERMORY', G), 'splitter': e('keine Splitter, schlecht wärmeleitend', 'S2-02', 'THERMORY', G),
     'rho': e(490, 'S2-01', 'LWG', P), 'm2': [p(92.53, 'Holz-Hohmann', 'S2-31', 'HOHMANN')], 'lfm': [],
     },
    {'id': 'thermoespe', 'name': 'Thermo-Espe', 'wand': e('ja', 'S2-02', 'THERMORY', G), 'bank': e('ja', 'S2-02', 'THERMORY', G), 'harz': e('harzfrei (Suchtreffer), dunkler', 'S2-02', 'THERMORY', P),
     'splitter': e('geringere Wärmeleitfähigkeit, formstabil', 'S2-02', 'THERMORY', G), 'rho': None, 'm2': [p(101.39, 'Holz-Hohmann', 'S2-32', 'HOHMANN')], 'lfm': [],
     },
    {'id': 'hemlock', 'name': 'Hemlock', 'wand': None, 'bank': None, 'harz': None, 'splitter': None, 'rho': None, 'm2': [], 'lfm': []},   # nur Suchtreffer (S2-33, S2-01a, unsicher): bewusst nicht uebernommen (R074)
    {'id': 'erle', 'name': 'Erle', 'wand': None, 'bank': e('ja', 'S2-02', 'THERMORY', G), 'harz': None, 'splitter': e('wasserabweisend, geringere Wärmeleitfähigkeit', 'S2-02', 'THERMORY', G), 'rho': e(550, 'S2-01', 'LWG', P),
     'm2': [p(48.00, 'esaunashop', 'S2-35', 'ESAUNA', ab=True)], 'lfm': []},
    {'id': 'linde', 'name': 'Linde', 'wand': e('ja', 'S2-34', 'ESAUNA', P), 'bank': e('ja', 'S2-37a', 'HBLINDE', P), 'harz': e('harzarm (Weka)', 'S2-04', 'WEKA', G), 'splitter': None, 'rho': e(530, 'S2-01', 'LWG', P),
     'm2': [p(23.80, 'esaunashop', 'S2-34', 'ESAUNA', ab=True, hinweis='Klasse AB'), p(31.30, 'esaunashop', 'S2-34', 'ESAUNA', ab=True, hinweis='Klasse A')],
     'lfm': [p(11.40, 'Hornbach', 'S2-37a', 'HBLINDE', hinweis='nicht online bestellbar')]},
    {'id': 'rotzeder', 'name': 'Rotzeder („Zeder“)', 'wand': e('ja', 'S2-02', 'THERMORY', G), 'bank': None, 'harz': e('kein Harz, Duft (Thermory)', 'S2-02', 'THERMORY', G), 'splitter': e('geringe Wärmeleitfähigkeit, wasserabweisend', 'S2-02', 'THERMORY', G),
     'rho': None, 'm2': [p(109.90, 'esaunashop', 'S2-36', 'ESAUNA', ab=True, hinweis='ob „Zeder“ Rotzeder ist, steht nicht dabei')], 'lfm': []},
    {'id': 'abachi', 'name': 'Abachi', 'wand': None, 'bank': e('ja', 'S2-37', 'ESAUNA', P), 'harz': None, 'splitter': None, 'rho': None, 'm2': [], 'lfm': [p(17.90, 'esaunashop', 'S2-37', 'ESAUNA', ab=True)],
     },
    {'id': 'kiefer', 'name': 'Kiefer', 'wand': None, 'bank': None, 'harz': None, 'splitter': None, 'rho': e(520, 'S2-01', 'LWG', P), 'm2': [], 'lfm': []},
]
PRUEF = {
    'S2-30': ['17,85'], 'S2-30a': ['18,90'], 'S2-31': ['92,53'], 'S2-31a': ['109,90'], 'S2-32': ['101,39'], 'S2-32a': ['79,90'], 'S2-33': ['99,50'], 'S2-34': ['23,80', '31,30'],
    'S2-35': ['48,00'], 'S2-36': ['109,90'], 'S2-37': ['17,90'], 'S2-37a': ['11,40'], 'S2-37c': ['23,50'], 'S2-01': ['0,55', '0,49', '0,53', '0,47', '0,52'], 'S2-01a': ['450', '480'],
    'S2-02': ['Espe', 'Erle'], 'S2-03': ['Harz'], 'S2-04': ['harzarm'], 'S2-05': ['Espe'], 'S-35': ['23,33'],
}
OFEN = {
    'klassen': [
        {'kw': 3.6, 'bis': 5.5, 'quelle': 'KOFEN', 'i': 'S-20', 'status': G, 'preis': [199.0, 199.0], 'preis_i': 'S2-52'},
        {'kw': 9.0, 'von': 5.5, 'bis': 14, 'quelle': 'K9', 'i': 'S2-20', 'status': G, 'preis': [279.0, 559.0], 'preis_i': 'S2-52a'},
    ],
    'grenz': {'von': 5.5, 'bis': 6.0, 'i': 'S-22'},
    'abstand': [
        {'kw': 3.6, 'modell': 'Weka Kompakt 3,6 kW', 'decke': 110, 'seite': 4, 'gitter': 4, 'i': 'S-29', 'quelle': 'WEKA', 'status': G},
        {'kw': 9.0, 'modell': 'Karibu/Weka 9 kW, Art.-Nr. 66601', 'decke': 110, 'seite': 7, 'gitter': 7, 'i': 'S2-12', 'quelle': 'K9', 'status': G},
    ],
    'hoehe_min': 1.75, 'hoehe_min_i': 'S-51', 'tuer': [1.75, 0.656], 'tuer_i': 'S2-53', 'steine_kg': 12, 'aufguss_g_m3': 15,
    'glas': 'Bei Glastür oder Glaswand: „stärkerer Ofen empfehlenswert“ (Karibu, ohne Zahl).',
}
MATERIAL = [
    {'id': 'daemmung', 'einheit': '€/m²', 'von': 6.93, 'bis': 7.75, 'i': 'S2-51a', 'quelle': 'HBOFEN', 'status': P},
    {'id': 'tuer', 'einheit': '€/Stück', 'von': 329.0, 'bis': 499.0, 'i': 'S2-53', 'quelle': 'HBOFEN', 'status': P},
    {'id': 'leuchte', 'einheit': '€/Stück', 'von': 43.50, 'bis': 54.99, 'i': 'S2-54', 'quelle': 'HBOFEN', 'status': P},
    {'id': 'steine', 'einheit': '€/Satz 12 kg', 'von': 24.99, 'bis': 26.99, 'i': 'S2-55', 'quelle': 'HBOFEN', 'status': P},
    {'id': 'steuerung', 'i': 'S2-56', 'quelle': 'HBOFEN', 'status': P},
    {'id': 'rahmen', 'i': 'S2-51', 'quelle': 'HBOFEN', 'status': L, 'hinweis': 'Menge nicht belegt (Preisbeispiel 2,23 bis 4,46 €/lfm)'},
    {'id': 'elektro', 'i': 'S-20', 'quelle': 'KOFEN', 'status': L, 'hinweis': 'Zuleitung und Anschluss durch die Elektrofachkraft: kein Preis belegt'},
]
BANK = {'unten': 0.50, 'oben': 0.72, 'fuge': 0.01, 'latte': 0.09, 'verschnitt': 0.10}   # Einhell-Beispielmaße, Banklatte 90 mm, Verschnitt = Annahme der Seite
# Fertige Saunen: Aussenmass b x t x h in m
FERTIG = [
    ['S-60', 'garten', 'Karibu Talos 2 Express', 1.96, 1.96, 2.28, '9 kW + Steuerung', 1999.00, 0, 'HB-T2'],
    ['S-61', 'garten', 'Karibu Talos 1', 1.96, 1.46, 2.28, '9 kW Bio-Kombi + Steuerung', 2499.00, 0, 'HB-T1'],
    ['S-62', 'garten', 'Karibu Talos 0', 1.96, 1.13, 2.28, '9 kW + Steuerung', 1969.00, 0, 'HB-T0'],
    ['S-63', 'garten', 'Karibu Talos 3', 2.31, 1.96, 2.28, '9 kW + Steuerung', 2690.00, 0, 'HB-T3'],
    ['S2-40', 'garten', 'Karibu Dyka 3', 2.765, 2.015, 2.32, 'ohne Ofen', 2795.00, 0, 'HB-D3'],
    ['S2-41', 'garten', 'Karibu Talos 6 (Vorraum)', 3.96, 2.31, 2.17, 'ohne Ofen', 3199.00, 0, 'HB-T6'],
    ['S2-43', 'garten', 'Weka Naantali', 2.11, 2.48, 2.53, '9 kW Bio-Kombi + Steuerung', 2829.00, 0, 'HB-NA'],
    ['S-67', 'fass', 'Karibu Fassy 2', 2.25, 2.77, 2.30, 'ohne Ofen', 3059.00, 0, 'HB-F2'],
    ['S2-45', 'fass', 'Home Deluxe Cube Deluxe L', 2.20, 1.85, 1.94, '8 kW inklusive', 2999.00, 0, 'HB-CU'],
    ['S2-45', 'fass', 'Home Deluxe Cube Deluxe L', 2.20, 1.94, 1.85, '8 kW inklusive', 2465.89, 1, 'CHECK24'],
    ['S-69', 'fass', 'Palmako Fasssauna Anita', 2.26, 2.53, 2.25, 'nicht angegeben', 2999.00, 1, 'CHECK24'],
    ['S-70', 'fass', 'Sanotechnik Fasssauna Bergen', 1.89, 2.20, 1.915, 'nicht angegeben', 3044.94, 1, 'CHECK24'],
    ['S2-60', 'bausatz', 'FinnTherm Innenkabine Spruce', 1.94, 1.94, 1.99, 'ohne Ofen', 2599.00, 0, 'HB-FT'],
    ['S2-60a', 'bausatz', 'FinnTherm Innenkabine Spruce', 1.94, 1.94, 1.99, 'ohne Ofen', 2599.00, 1, 'CHECK24'],
    ['S2-61', 'bausatz', 'Home Deluxe Skyline XL Big', 2.00, 2.00, 2.10, 'Harvia 8 kW', 3299.00, 0, 'HB-SK'],
    ['S2-65', 'bausatz', 'Karibu Inara', 2.31, 2.31, None, '9 kW inklusive', 3709.00, 1, 'CHECK24'],
]
FERTIG_PRUEF = {'S-60': ['1.999,00'], 'S-61': ['2.499,00'], 'S-62': ['1.969,00'], 'S-63': ['2.690,00'], 'S2-40': ['2.795,00'], 'S2-41': ['3.199,00'], 'S2-43': ['2.829,00'],
                'S-67': ['3.059,00'], 'S2-45': ['2.999,00', '2.465,89'], 'S-69': ['2.999'], 'S-70': ['3.044,94'], 'S2-60': ['2.599,00'], 'S2-60a': ['2.599,00'], 'S2-61': ['3.299,00'], 'S2-65': ['3.709,00']}
KLASSE = {'von': 0.8, 'bis': 1.25}   # eigene Annahme, die Seite nennt sie als Annahme

# id, Thema, Text, Quellen-Ids, Quelle, Status, gilt fuer (i = Innen, g = Garten, f = Fass), Widerspruch
REGELN = [
    ['strom1', 'strom', 'Bis 5,5 m³ genügt der 3,6-kW-Ofen am Haushaltsstrom, darüber braucht der 9-kW-Ofen Starkstrom (400 V). Anschluss durch die Elektrofachkraft.', ['S-20', 'S-21'], 'KOFEN', G, 'igf', ''],
    ['strom2', 'strom', '9-kW-Ofen Art.-Nr. 66601: Zuleitung 5 × 2,5 mm² Kupfer, 16 A, Trennvorrichtung bauseits, Isolationswiderstand über 1 MΩ; Anschluss durch die Elektrofachkraft. Gilt für diesen Ofen, die Anleitung Ihres Ofens ist maßgebend.', ['S2-20', 'S2-24'], 'K9', G, 'igf', 'W2-3'],
    ['strom3', 'strom', '3,6-kW-Ofen (Weka Kompakt): 230 V, 3 × 1,5 mm² Silikon, 16 A; Anschluss durch die Elektrofachkraft.', ['S-23'], 'WEKA', G, 'igf', ''],
    ['strom4', 'strom', 'Norm: DIN VDE 0100-703 (VDE 0100-703):2006-02, „Errichten von Niederspannungsanlagen – Teil 7-703: Anforderungen für Betriebsstätten, Räume und Anlagen besonderer Art – Räume und Kabinen mit Saunaheizungen“ (Inhalt nicht wiedergegeben).', ['S-27'], 'VDE', G, 'igf', 'W-3'],
    ['strom5', 'strom', 'Leuchte: geprüfte Saunaleuchte, 140 °C, höchstens 40 W, spritzwassergeschützt; Leitungen in der Kabine für 140 °C (Silikon).', ['S-50', 'S2-11e'], 'WEKA', G, 'igf', 'W-4'],
    ['strom6', 'strom', 'RCD für den Saunakreis: keine Herstellerangabe; die Elektrofachkraft legt es aus.', ['S2-22'], 'K9', L, 'igf', ''],
    ['brand1', 'brand', 'Abstände gelten je Ofentyp (Tabelle). Kabine mindestens 1,75 m hoch, nichts Brennbares unter dem Ofen, Ofen nie ohne Steine, nicht in Nische oder unter die Bank. Gilt für dieses Modell, die Anleitung Ihres Ofens ist maßgebend.', ['S-29', 'S2-12', 'S-51', 'S-52'], 'WEKA', G, 'igf', 'W2-2'],
    ['holz1', 'holz', 'Schornstein, Schornsteinfeger, 1. BImSchV: Beratung binnen 1 Jahr (§ 4 Abs. 8), Überwachung binnen 4 Wochen nach Inbetriebnahme (§ 14), Einzelraumfeuerung (§ 15 Abs. 2); Einzelheiten in Bericht 33. Abstände für einen Holz-Saunaofen: keine Herstellerangabe. Zusatzpflichten je Land offen (Bericht 42).', ['K06', 'K19', 'K20'], 'B33', G, 'igf', ''],
    ['luft1', 'luft', 'Innensauna: 10 cm Abstand zu Wand und Zimmerdecke (Karibu; Einhell nennt 4 bis 5 cm, anderes Produkt), Fliesen am Boden. Dämmung nicht ganz bis zur Decke, sonst droht Schimmel hinter der Sauna.', ['S2-11a', 'S-45', 'S-46'], 'KINFO', G, 'i', 'W2-1'],
    ['luft2', 'luft', 'Zuluft direkt unter dem Ofen, 5 bis 10 cm über dem Boden, nie verschließen; Abluft diagonal in der Rückwand zwischen den Liegen, über einen Kanal, damit Kondenswasser nicht hinter die Sauna tropft.', ['S-47', 'S-48', 'S-46'], 'WEKA', G, 'igf', 'W-5'],
    ['fund1', 'fund', 'Plattenfundament empfohlen, waagerecht und rechtwinklig, Untergrund eben und gewachsen (Aufschüttung verdichten). Sperrschicht zwischen Fundament und Bodenbalken, Verankerung gegen Wind. Rundum 1,0 bis 1,5 m Platz, Unterlüftung nicht abdichten. Frosttiefe, Bewehrung: keine Herstellerangabe.', ['S2-10a', 'S2-10b', 'S2-10d'], 'WKAAPI', G, 'gf', ''],
    ['dach1', 'dach', 'Die mitgelieferte Dachpappe schützt nur vorübergehend; dauerhaft Alu-Dachbahn, Bitumen-Schweißbahn oder EPDM. Ab 0,75 kN/m² Schnee (ca. 30 cm) räumen. Dämmung, Dampfsperre, Hinterlüftung: keine Herstellerangabe (Lücke).', ['S2-10e', 'S2-13'], 'WKAAPI', G, 'gf', 'W-7'],
    ['heiz1', 'heiz', 'Beim ersten Aufheizen leichter Geruch, danach lüften (Karibu); nie unbeobachtet aufheizen. Heizdauer, Temperaturstufen: keine Herstellerangabe (Lücke).', ['S2-11d', 'S-29'], 'KINFO', G, 'igf', ''],
]
# Symbol, Titel, Text, Quellen-Ids, Quelle, gilt fuer, Status (belegt | Lücke); "belegt" wird je nach Quelle zu geprüft (Hersteller) oder prüfen vor Nutzung (Heimwerker)
ABLAUF = [
    ['i-karte', 'Standort', 'Innensauna: Raum ausmessen, 10 cm Abstand zu Wand und Decke. Gartensauna: Bauantrag-Ampel und Abstände prüfen.', ['A5:1', 'S2-11a'], 'EINHELL', 'igf', 'belegt'],
    ['i-mass', 'Größe', 'Kabinenmaß festlegen (Beispiel 2 × 2,20 m, Höhe 2,20 m; nicht zu hoch); mindestens 1,75 m.', ['A5:2', 'S-51'], 'EINHELL', 'igf', 'belegt'],
    ['i-luft', 'Luft und Ofen einplanen', 'Zu- und Abluft und Ofenplatz vor dem Bauen festlegen; keine Liege über dem Ofen.', ['A5:3', 'S-47', 'S-48'], 'WEKA', 'igf', 'belegt'],
    ['i-blitz', 'Strom zuleiten', 'Starkstromzuleitung und Absicherung durch die Elektrofachkraft; nie selbst anschließen.', ['A5:4', 'S-20', 'S-23'], 'WEKA', 'igf', 'belegt'],
    ['i-boden', 'Fundament', 'Plattenfundament, eben, mit Sperrschicht und Verankerung (Weka-Haus).', ['S2-10a', 'S2-10b'], 'WKAAPI', 'gf', 'belegt'],
    ['i-boden', 'Fundamenttiefe und Bewehrung', 'Lücke: keine belegte Anleitung.', ['S2-10a'], 'B44', 'gf', 'Lücke'],
    ['i-wand', 'Wände', 'Bretter in die Nut der Eckpfosten, jedes zweite verschrauben (Einhell); Blockbohlen nach Anleitung (Weka).', ['A5:6', 'S-44'], 'EINHELL', 'igf', 'belegt'],
    ['i-tuer', 'Tür', 'Von innen jederzeit leicht zu öffnen; kein Schloss nachrüsten (Weka).', ['S2-10h'], 'WKAAPI', 'igf', 'belegt'],
    ['i-dach', 'Decke und Dach', 'Innen: Fichtendecke, Dampfsperr-Klebeband, Dämmplatten (Einhell). Garten: Dachbahn dauerhaft (Weka).', ['A5:8', 'S2-10e'], 'EINHELL', 'igf', 'belegt'],
    ['i-schicht', 'Dämmung, Dampfsperre, Hinterlüftung außen', 'Lücke: keine belegte Anleitung für eine gedämmte Gartensauna.', ['A5:9', 'S2-13'], 'B44', 'gf', 'Lücke'],
    ['i-flamme', 'Ofen montieren', 'Nach Anleitung des Ofens; Abstände einhalten, Fühler an der Decke, Steine locker auflegen.', ['A5:10', 'S2-10g'], 'WEKA', 'igf', 'belegt'],
    ['i-bett', 'Bänke', 'Beispiel: untere Liege 50 cm breit auf 45 cm, obere 72 cm auf 90 cm, 1 cm Fuge.', ['A5:11'], 'EINHELL', 'igf', 'belegt'],
    ['i-lampe', 'Licht', 'Nur geprüfte Saunaleuchte (140 °C, höchstens 40 W).', ['A5:12', 'S-50'], 'WEKA', 'igf', 'belegt'],
    ['i-paragraf', 'Abnahme', 'Die Elektrofachkraft misst den Isolationswiderstand (über 1 MΩ).', ['A5:13', 'S-23'], 'WEKA', 'igf', 'belegt'],
    ['i-paragraf', 'Abnahmeprotokoll, Prüfpflichten', 'Lücke: keine belegte Anleitung.', ['A5:13'], 'B43', 'igf', 'Lücke'],
    ['i-uhr', 'Erstes Aufheizen', 'Leichter Geruch möglich, danach lüften; nie unbeobachtet.', ['A5:14', 'S2-11d'], 'KINFO', 'igf', 'belegt'],
    ['i-uhr', 'Einbrennen (Dauer, Stufen)', 'Lücke: keine belegte Anleitung.', ['A5:15', 'S2-11d'], 'B44', 'igf', 'Lücke'],
]
WIDER = [
    ['W-1', 'Ofen nach Volumen: Karibu bis 5,5 m³ = 3,6 kW, Weka „bis ca. 6 m³“.', 'Beide mit Produktnamen zeigen; „1 kW je m³“ (Suchtreffer) nicht verwenden.'],
    ['W2-1', 'Abstand zur Raumwand: Karibu 10 cm, Einhell 4 bis 5 cm.', 'Karibu (Hersteller); Einhell als Hinweis.'],
    ['W2-2', 'Ofenabstand seitlich: 4 cm (Weka 3,6 kW), 7 cm (9 kW).', 'Nur je Ofentyp zeigen.'],
    ['W2-3', 'Sicherung: 16 A (Anleitung), „3 × 20 A“ (Händlerseite eines 8-kW-Ofens).', 'Anleitung des gewählten Ofens; Händlertext nicht übernommen.'],
    ['W-3', 'Norm: Weka zitiert VDE 0100 Teil 703/11.82, VDE Verlag führt 2006-02.', 'Nur der Titel der aktuellen Norm.'],
    ['W-4', 'Leuchte: Leuchtband (Einhell), geprüfte Saunaleuchte (Weka).', 'Weka und Karibu.'],
    ['W-5', 'Abluft: Weka Rückwand zwischen den Liegen, Einhell 1 m über Boden, Forum 30 cm unter der Decke.', 'Weka; die anderen nur als Hinweis.'],
    ['W-7', 'Dämmung: Styropor in der Decke (Einhell), Mineralwolle in den Wänden (Karibu).', 'Lücke zeigen, keine Empfehlung.'],
]


def baue():
    for h in HOLZ:
        for x in h['m2'] + h['lfm'] + h.get('unsicher', []):
            pruefe(x['i'], *PRUEF.get(x['i'], []))
        for k in ('wand', 'bank', 'harz', 'splitter', 'rho'):
            if h[k]:
                pruefe(h[k][1], *PRUEF.get(h[k][1], []))
    for o in OFEN['klassen']:
        pruefe(o['i'])
        pruefe(o['preis_i'])
    for a in OFEN['abstand']:
        pruefe(a['i'])
    pruefe(OFEN['grenz']['i'], '6 m')
    pruefe(OFEN['hoehe_min_i'], '1,75')
    pruefe(OFEN['tuer_i'], '175 x 65,6')
    for m in MATERIAL:
        pruefe(m['i'])
    pruefe('S2-51a', '6,93', '7,75')
    pruefe('S2-53', '329,00', '499,00')
    pruefe('S2-54', '43,50', '54,99')
    pruefe('S2-55', '24,99', '26,99')
    pruefe('S2-52', '199,00')
    pruefe('S2-52a', '279,00', '559,00')
    pruefe('S2-20', '5 x 2,5', '16 A')
    pruefe('S2-12', 'mindestens 7 cm', '110 cm')
    pruefe('S-29', '110 cm', '4 cm')
    pruefe('S2-11a', '10 cm')
    fert = []
    for f in FERTIG:
        pruefe(f[0], *FERTIG_PRUEF[f[0]])
        fert.append({'id': f[0], 'art': f[1], 'name': f[2], 'b': f[3], 't': f[4], 'h': f[5], 'ofen': f[6], 'preis': f[7], 'ab': bool(f[8]), 'quelle': f[9]})   # Status aller Zeilen: status_fertig
    regeln = []
    for r in REGELN:
        for i in r[3]:
            if re.match(r'^S2?-', i):
                pruefe(i)
        d = {'id': r[0], 'thema': r[1], 'text': r[2], 'ids': r[3], 'quelle': r[4], 'status': r[5], 'art': r[6]}
        if r[7]:
            d['w'] = r[7]
        regeln.append(d)
    abl = []
    for nr, a in enumerate(ABLAUF, 1):
        for i in a[3]:
            if re.match(r'^(S2?-|A5:)', i):
                pruefe(i)
        abl.append({'nr': nr, 'symbol': a[0], 'titel': a[1], 'text': a[2], 'ids': a[3], 'quelle': a[4], 'art': a[5], 'status': (L if a[6] == 'Lücke' else (P if a[4] == 'EINHELL' else G))})
    if fehler:
        print('FEHLER im Erzeuger, nichts geschrieben:')
        for f in fehler:
            print(' -', f)
        sys.exit(1)
    holz = []
    for h in HOLZ:
        d = {'id': h['id'], 'name': h['name']}
        for k in ('wand', 'bank', 'harz', 'splitter', 'rho'):
            d[k] = ({'wert': h[k][0], 'ids': h[k][1], 'quelle': h[k][2], 'status': h[k][3]} if h[k] else {'status': L})
        d['m2'] = h['m2']
        d['lfm'] = h['lfm']
        if h.get('unsicher'):
            d['unsicher'] = h['unsicher']
        holz.append(d)
    return {
        'stand': ABRUF, 'status_fertig': P,
        'quellen': {k: {'titel': v[0], 'url': v[1]} for k, v in Q.items()}, 'holz': holz,
        'ofen': OFEN, 'material': MATERIAL, 'bank': BANK, 'klasse': KLASSE,
        'preise_fertig': fert, 'regeln': regeln, 'bauablauf': abl,
        'widersprueche': [{'id': w[0], 'text': w[1], 'entscheidung': w[2]} for w in WIDER],
    }


if __name__ == '__main__':
    o = baue()
    pfad, n = schreibe('sauna', 'Sauna-Karte (S1, 31.10.2026): Holz, Ofen, Material, Preise, Regeln, Bauablauf. ERZEUGT von erzeuger/daten_s_sauna.py aus recherche/43 und 44. Zeilen ohne Abruf gelten für den Stand. Nicht von Hand ändern.', o)
    print(f'{pfad}: {n} Byte; Holz {len(o["holz"])}, fertige Saunen {len(o["preise_fertig"])}, Regeln {len(o["regeln"])}, Schritte {len(o["bauablauf"])}, Quellen {len(o["quellen"])}')
