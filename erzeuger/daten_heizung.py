# -*- coding: utf-8 -*-
"""Erzeugt daten/heizung.js (window.DATEN.heizung): Anschaffung der Heizanlage fuer die Mappe (Auftrag S3, 01.11.2026).
Einzige Quelle: recherche/52_heizung_vergleich.md (Abruf 31.10.2026), Abschnitt 2a (Zeilen H-20 und H-22), Zeile H-03 (Abschnitt 1) und Abschnitt "Widersprueche" Nr. 5.
Der Erzeuger liest den Bericht selbst und bricht OHNE Schreiben ab, wenn
 - H-20 die Zahlen 12.500 und 29.500 nicht enthaelt oder "ab 12.500" nicht als geprueft und 29.500 nicht als unsicher gekennzeichnet ist,
 - H-22 nicht "6.000 bis 9.000" und "veraltet" enthaelt,
 - H-03 nicht "Bio-Treppe", "10 %", "2029", "60 %", "2040" und "§ 43" enthaelt,
 - eine verwendete Adresse (URL) nicht im Berichtstext vorkommt.
Andere Heizarten (H-21, H-23 bis H-27) stehen NICHT hier: sie folgen mit der eigenen Heizungs-Karte.
Aufruf: python -I -X utf8 erzeuger/daten_heizung.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import schreibe, HIER

BERICHT = open(os.path.join(os.path.dirname(HIER), 'recherche', '52_heizung_vergleich.md'), encoding='utf-8').read()
ZEILEN = BERICHT.split('\n')
ABRUF = '2026-10-31'
fehler = []


def zeile(kennung):
    z = [x for x in ZEILEN if x.startswith('| ' + kennung + ' |')]
    if len(z) != 1:
        fehler.append('Zeile %s nicht genau einmal im Bericht (%d)' % (kennung, len(z)))
        return ''
    return z[0]


def verlange(txt, teile, was):
    for t in teile:
        if t not in txt:
            fehler.append('%s: "%s" fehlt im Bericht' % (was, t))


H20, H22, H03 = zeile('H-20'), zeile('H-22'), zeile('H-03')
URL_WP = 'https://www.co2online.de/modernisieren-und-bauen/waermepumpe/'
URL_GAS = 'https://www.co2online.de/modernisieren-und-bauen/heizung/heizungsarten-im-vergleich/'
URL_GEG = 'https://www.gesetze-im-internet.de/geg/__43.html'
verlange(H20, ['12.500', '29.500', 'ab 12.500', 'geprüft', 'unsicher', URL_WP], 'H-20')
verlange(H22, ['6.000 bis 9.000', 'veraltet', 'Preisbasis 2023', URL_GAS], 'H-22')
verlange(H03, ['Bio-Treppe', '10 %', '2029', '15 %', '2030', '30 %', '2035', '60 %', '2040', '§ 43', 'vor Nutzung am Volltext gegenlesen'], 'H-03')
verlange(BERICHT, [URL_GEG, 'Abruf 31.10.2026', 'Nicht aufgelöst'], 'Bericht')
# Widerspruch Nr. 5 muss im Bericht stehen
w5 = [x for x in ZEILEN if x.startswith('5. Luft-Wasser-Wärmepumpe:')]
if len(w5) != 1:
    fehler.append('Widerspruch Nr. 5 (Luft-Wasser) nicht gefunden')

if fehler:
    print('ABBRUCH, nichts geschrieben:')
    for f in fehler:
        print(' -', f)
    sys.exit(1)

o = {
    'stand': ABRUF,
    'bericht': 'recherche/52_heizung_vergleich.md',
    'arten': {
        'waermepumpe': {
            'id': 'H-20', 'name': 'Luft-Wasser-Wärmepumpe', 'einheit': '€', 'basis': 'Anschaffung inkl. Einbau',
            'von': 12500, 'bis': 29500,
            'von_status': 'geprüft', 'von_text': 'Seite co2online am Original gelesen: „Luft-Wasser: ab 12.500 €“',
            'bis_status': 'unsicher – prüfen vor Nutzung', 'bis_text': 'Suchtreffer-Zusammenfassung der Seitenfamilie: „Luft-Wasser etwa 29.500 €“, nicht am Original gelesen',
            'status': 'prüfen vor Nutzung',
            'widerspruch': 'Bericht 52, Widerspruch 5: die gelesene Seite nennt „ab 12.500 €“; die Suchtreffer-Zusammenfassung ordnet 12.500 € der Luft-Luft- und 29.500 € der Luft-Wasser-Wärmepumpe zu. Nicht aufgelöst, die Seite vor Nutzung gegenlesen.',
            'quelle': 'co2online, „Wärmepumpe: Kosten, Funktion & Förderung 2026“', 'url': URL_WP, 'abruf': ABRUF,
        },
        'gas': {
            'id': 'H-22', 'name': 'Gas-Brennwert', 'einheit': '€', 'basis': 'Anschaffung inkl. Einbau',
            'von': 6000, 'bis': 9000,
            'status': 'veraltet, nur Größenordnung', 'preisstand': '2023',
            'quelle': 'co2online, „Heizungsarten im Vergleich“ (veröffentlicht 26.09.2024, Preisbasis 2023)', 'url': URL_GAS, 'abruf': ABRUF,
        },
    },
    'bio_treppe': {
        'id': 'H-03', 'gesetz': '§ 43 GModG', 'stufen': [['2029', 10], ['2030', 15], ['2035', 30], ['2040', 60]],
        'status': 'Zahlen vor Nutzung am Volltext gegenlesen',
        'quelle': 'GModG § 43 (gesetze-im-internet.de)', 'url': URL_GEG, 'abruf': ABRUF,
    },
}

if __name__ == '__main__':
    pfad, n = schreibe('heizung', 'Anschaffung Heizanlage (Auftrag S3, 01.11.2026): Luft-Wasser-Wärmepumpe (H-20) und Gas-Brennwert (H-22) mit Quelle, Abruf und Status je Wert; Bio-Treppe (H-03). ERZEUGT von erzeuger/daten_heizung.py aus recherche/52_heizung_vergleich.md (Abruf 31.10.2026). Nicht von Hand ändern.', o)
    print('%s: %d Byte; Arten %d' % (pfad, n, len(o['arten'])))
