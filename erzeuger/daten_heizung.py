# -*- coding: utf-8 -*-
"""Erzeugt daten/heizung.js (window.DATEN.heizung): Anschaffung der Heizanlage fuer die Mappe (Auftrag S3 01.11.2026, S4 02.11.2026).
S4: EIN Waermepumpen-Wert auf der ganzen Seite. Er steht NUR hier (Luft-Wasser, Spanne, Mittel, Median) und wird aus
recherche/59_waermepumpe_preis_nachpruefung.md gelesen (Abruf 02.11.2026; Verbraucherzentrale RLP, Zweiter Check, Tabelle 1).
Der Baustein "Waermepumpe (aussen)" im Grundstueck (k_wp) verweist auf diesen Wert und hat keine eigene Zahl.
Der co2online-Durchschnitt 29.500 EUR (Bundesverband Waermepumpe) steht getrennt beschriftet als "richtwert", nicht in der Spanne.
Gas-Brennwert (H-22) kommt weiter aus recherche/52_heizung_vergleich.md (Preisstand 2023).
Bio-Treppe (GModG Paragraf 43): Stufen und Ueberschrift aus Bericht 59 (am amtlichen Wortlaut geprueft 02.11.2026).
Der Erzeuger liest die Berichte selbst und bricht OHNE Schreiben ab, wenn eine erwartete Zahl, Adresse oder Ueberschrift fehlt.
Aufruf: python -I -X utf8 erzeuger/daten_heizung.py"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import schreibe, HIER

WURZEL = os.path.dirname(HIER)
B52 = open(os.path.join(WURZEL, 'recherche', '52_heizung_vergleich.md'), encoding='utf-8').read()
B59 = open(os.path.join(WURZEL, 'recherche', '59_waermepumpe_preis_nachpruefung.md'), encoding='utf-8').read()
Z52 = B52.split('\n')
Z59 = B59.split('\n')
ABRUF_59 = '2026-11-02'
ABRUF_52 = '2026-10-31'
fehler = []


def zeile(zeilen, anfang, was):
    z = [x for x in zeilen if x.startswith(anfang)]
    if len(z) < 1:
        fehler.append('%s: Zeile "%s" fehlt im Bericht' % (was, anfang))
        return ''
    return z[0]


def verlange(txt, teile, was):
    for t in teile:
        if t not in txt:
            fehler.append('%s: "%s" fehlt im Bericht' % (was, t))


def zahl(s):
    return int(s.replace('.', ''))


# ---- Waermepumpe aus Bericht 59 ----
URL_PDF = 'https://www.verbraucherzentrale-rlp.de/media/34390/download'
URL_PM = 'https://www.verbraucherzentrale-rlp.de/pressemitteilungen/waermepumpenangebote-im-check-grosse-preisunterschiede-und-versteckte-kosten-bleiben-123787'
URL_ARTEN = 'https://www.co2online.de/modernisieren-und-bauen/waermepumpe/waermepumpe-arten-im-vergleich/'
URL_GEG = 'https://www.gesetze-im-internet.de/geg/__43.html'
spanne = zeile(Z59, '| Spanne, Mittelwert, Median |', 'VZ RLP Spanne')
mm = re.search(r'Minimum ([\d.]+) €, Maximum ([\d.]+) €, Mittelwert ([\d.]+) €, Median ([\d.]+) €', spanne)
WP = None
if not mm:
    fehler.append('VZ RLP: "Minimum .. Maximum .. Mittelwert .. Median" nicht lesbar')
else:
    WP = [zahl(x) for x in mm.groups()]
    if WP != [21099, 54168, 36397, 34898]:
        fehler.append('VZ RLP: erwartet 21099/54168/36397/34898, gelesen %s' % WP)
verlange(spanne, ['160 Angebote', 'Tabelle 1'], 'VZ RLP Spanne')
verlange(zeile(Z59, '| Stichprobe |', 'VZ RLP Stichprobe'), ['160 Angebote', 'Rheinland-Pfalz', 'September 2025 bis April 2026', 'nicht ohne Weiteres auf den Gesamtmarkt übertragen'], 'VZ RLP Stichprobe')
verlange(zeile(Z59, '| Einbau enthalten |', 'VZ RLP Einbau'), ['Nur teilweise', '78 von 160'], 'VZ RLP Einbau')
verlange(zeile(Z59, '| Brutto |', 'VZ RLP brutto'), ['kein Satz dazu gefunden', 'unsicher'], 'VZ RLP brutto')
verlange(B59, [URL_PDF, URL_PM, URL_ARTEN, '29.500', '29.09.2026', 'Bundesverband Wärmepumpe', 'Einbau', 'Abrufdatum aller Werte: 02.11.2026'], 'Bericht 59')
art_zeile = zeile(Z59, '| Luft-Wasser 29.500 € (Unterseite', 'co2online Luft-Wasser')
verlange(art_zeile, ['29.500', 'Bundesverband Wärmepumpe', '29.09.2026', 'nicht angegeben'], 'co2online Luft-Wasser 29.500')

# ---- Bio-Treppe aus Bericht 59 ----
bio = zeile(Z59, '- Abs. 1 wörtlich:', 'GModG Paragraf 43 Abs. 1')
stufen = [[j, int(p)] for j, p in re.findall(r'ab dem 1\. Januar (\d{4}) mindestens (\d+) Prozent', bio)]
if stufen != [['2029', 10], ['2030', 15], ['2035', 30], ['2040', 60]]:
    fehler.append('GModG 43: Stufen erwartet 2029/10, 2030/15, 2035/30, 2040/60, gelesen %s' % stufen)
verlange(bio, ['nach dem 29. Juli 2026'], 'GModG 43 Abs. 1')
mu = re.search(r'- Überschrift: "(§ 43 [^"]+)"', B59)
UEBERSCHRIFT = mu.group(1) if mu else ''
if UEBERSCHRIFT != '§ 43 Einbau einer Heizungsanlage, die mit Gas, Heizöl oder Flüssiggas beschickt wird':
    fehler.append('GModG 43: Ueberschrift unerwartet: "%s"' % UEBERSCHRIFT)
verlange(B59, [URL_GEG, 'Stufen 10 % ab 2029, 15 % ab 2030, 30 % ab 2035, 60 % ab 2040 und Stichtag "nach dem 29. Juli 2026": alle geprüft am Original'], 'GModG 43')

# ---- Gas aus Bericht 52 ----
H22 = zeile(Z52, '| H-22 |', 'H-22')
URL_GAS = 'https://www.co2online.de/modernisieren-und-bauen/heizung/heizungsarten-im-vergleich/'
verlange(H22, ['6.000 bis 9.000', 'veraltet', 'Preisbasis 2023', URL_GAS], 'H-22')
verlange(B52, ['Abruf 31.10.2026'], 'Bericht 52')

if fehler:
    print('ABBRUCH, nichts geschrieben:')
    for f in fehler:
        print(' -', f)
    sys.exit(1)

o = {
    'stand': ABRUF_59,
    'bericht': 'recherche/59_waermepumpe_preis_nachpruefung.md',
    'arten': {
        'waermepumpe': {
            'id': 'WP-59', 'name': 'Luft-Wasser-Wärmepumpe', 'einheit': '€', 'basis': 'Anschaffung, Angebotspreise für Ein- und Zweifamilienhäuser in Rheinland-Pfalz',
            'von': WP[0], 'bis': WP[1], 'mittel': WP[2], 'median': WP[3],
            'angebote': 160, 'zeitraum_von': '09/2025', 'zeitraum_bis': '04/2026', 'berichtsstand': '07/2026',
            'status': 'geprüft (Angebotsauswertung, regional)',
            'unsicher': True,
            'hinweis': '160 Angebote aus Rheinland-Pfalz, nicht repräsentativ; Montage nicht in jedem Angebot vollständig; brutto im zweiten Bericht nicht ausdrücklich. Mittel %s €, Median %s €.' % ('{:,}'.format(WP[2]).replace(',', '.'), '{:,}'.format(WP[3]).replace(',', '.')),
            'quelle': 'Verbraucherzentrale Rheinland-Pfalz, „Luft-Wasser-Wärmepumpen: Zweiter Check von 160 Angeboten aus Rheinland-Pfalz“ (Tabelle 1, Stand 07/2026)',
            'url': URL_PDF,
            'quelle2': 'Verbraucherzentrale Rheinland-Pfalz, Pressemitteilung vom 02.07.2026',
            'url2': URL_PM,
            'abruf': ABRUF_59,
            'richtwert': {
                'wert': 29500, 'einheit': '€', 'stand': '2026-09-29',
                'text': 'Durchschnitt Luft-Wasser laut co2online (Quelle Bundesverband Wärmepumpe, 29.09.2026); Einbau und brutto nicht angegeben',
                'status': 'unsicher – Einbau und brutto nicht angegeben',
                'quelle': 'co2online, „Wärmepumpen im Vergleich: Kosten & Wirkungsgrad“', 'url': URL_ARTEN, 'abruf': ABRUF_59,
            },
        },
        'gas': {
            'id': 'H-22', 'name': 'Gas-Brennwert', 'einheit': '€', 'basis': 'Anschaffung inkl. Einbau',
            'von': 6000, 'bis': 9000,
            'status': 'veraltet, nur Größenordnung', 'preisstand': '2023', 'unsicher': True,
            'quelle': 'co2online, „Heizungsarten im Vergleich“ (veröffentlicht 26.09.2024, Preisbasis 2023)', 'url': URL_GAS, 'abruf': ABRUF_52,
        },
    },
    'bio_treppe': {
        'id': 'H-03', 'gesetz': '§ 43 GModG', 'ueberschrift': UEBERSCHRIFT, 'stichtag': '2026-07-29', 'stufen': stufen,
        'status': 'am Gesetzestext geprüft 02.11.2026',
        'quelle': 'GModG § 43 (gesetze-im-internet.de)', 'url': URL_GEG, 'abruf': ABRUF_59,
    },
}

if __name__ == '__main__':
    pfad, n = schreibe('heizung', 'Anschaffung Heizanlage (S3 01.11.2026, S4 02.11.2026): EIN Wärmepumpen-Wert (Luft-Wasser, VZ RLP, Bericht 59) mit getrenntem Richtwert; Gas-Brennwert (H-22, Bericht 52); Bio-Treppe (§ 43 GModG, Bericht 59). ERZEUGT von erzeuger/daten_heizung.py. Nicht von Hand ändern.', o)
    print('%s: %d Byte; Arten %d' % (pfad, n, len(o['arten'])))
