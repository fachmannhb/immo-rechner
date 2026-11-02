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

# ---- H1 (02.11.2026): Heizarten im Vergleich, alles aus Bericht 52 (H-Nummern) und Bericht 61 (Wortlaut GModG) ----
B61 = open(os.path.join(WURZEL, 'recherche', '61_gmodg_heizung_wortlaut.md'), encoding='utf-8').read()
ABRUF_61 = '2026-11-02'
ABRUF_16 = '2026-10-09'
URL_CO = 'https://www.co2online.de/modernisieren-und-bauen/'
GEG = 'https://www.gesetze-im-internet.de/geg/__%s.html'
# Die Bio-Treppe (Stufen und Stichtag) steht nur einmal: stufen (aus Bericht 59, oben geprüft) und STICHTAG_ISO; alle Texte unten werden daraus gebaut (keine dritte Kopie der Zahlen)
STICHTAG_ISO = '2026-07-29'
verlange(B59, ['nach dem 29. Juli 2026'], 'Stichtag Bio-Treppe')
STICHTAG_DE = '.'.join(reversed(STICHTAG_ISO.split('-')))
BIO_STUFEN_TXT = ', '.join('ab %s zu %d %%' % (j, p) for j, p in stufen)
BIO_VON_BIS = '%d %% ab %s bis %d %% ab %s' % (stufen[0][1], stufen[0][0], stufen[-1][1], stufen[-1][0])


def h(nr, teile):
    """Zeile '| H-nr |' aus Bericht 52 holen und die erwarteten Zahlen/Woerter darin verlangen"""
    z = zeile(Z52, '| H-%s |' % nr, 'H-%s' % nr)
    verlange(z, teile, 'H-%s' % nr)
    return z


h('21', ['30.500', '8.000 bis 16.000'])
h('23', ['6.000 bis 18.000', 'veraltet'])
h('24', ['14.000 bis 21.000', 'pelletheizung'])
h('25', ['12.000 bis 20.000', 'unsicher'])
h('26', ['3.000 bis 8.000', '5.000 bis 20.000', 'reduco.ai'])
h('27', ['1.200 bis 1.800', 'infrarotheizung'])
h('28', ['17.000 bis 35.000', 'hybridheizung'])
h('30', ['30 %'])
h('31', ['28.000'])
h('35', ['Gas- und Ölheizung', 'Infrarotheizung'])
h('40', ['11,93', 'BDEW_Gaspreisanalyse_082026.pdf'])
h('41', ['14,06', 'cleanthinking.de', 'unsicher'])
h('42', ['17,9', 'prüfen vor Nutzung'])
h('43', ['37,97', 'PD26_345_61243.html', 'geprüft'])
h('44', ['27,44', 'unsicher'])
h('45', ['464,61', '9,29', 'topagrar.com', 'unsicher'])
h('46', ['144,66', 'prüfen'])
h('48', ['15,6', 'unsicher'])
h('60', ['100 bis 400'])
h('61', ['220', 'veraltet'])
h('62', ['175', 'veraltet'])
h('63', ['280 bis 500'])
h('64', ['| 0 |'])
h('65', ['Lücke'])
h('71', ['3,4', '4,3', 'unsicher'])
h('74', ['0,90'])
h('80', ['310 / 240 / 270'])
h('81', ['| 20 |'])
h('82', ['| 560 |'])
h('83', ['180 / 40 / 300'])
h('110', ['1.885'])
h('70', ['2,6 bis 5,4', 'ise.fraunhofer.de'])
verlange(B52, ['Hybrid-Anteil Wärmepumpe | 70 % WP, 30 % Gas | eigene Annahme', 'Nutzungsgrad Pellets | 0,85 | eigene Annahme', 'Nutzungsgrad Scheitholzkessel | 0,80 | eigene Annahme',
               '10.000 Heizung + 5.000 Warmwasser'], 'Annahmetabelle Bericht 52')
verlange(B52, ['Gas-Brennwert | 7.500 | 0 | 1.988 | 220 | 51.700 (50.200 bis 53.200)', 'Hybrid Gas + WP | 26.000 | 0 (Lücke) | 1.770 | 470 | 70.800 (Anschaffung 17.000 bis 35.000: 61.800 bis 79.800)'], 'Abschnitt 7 Bericht 52')
for p in ('§ 10', '§ 42', '§ 43', '§ 45', '§ 46', '§ 108', '§ 109'):
    verlange(B61, ['| %s |' % p], 'Bericht 61 Paragraf ' + p)
verlange(B61, ['Abs. 6: Ist der Eigentümer nicht Betreiber', 'Status überall: Wortlaut gelesen', 'Auslegung, nicht geprüft', 'Buchstabenzuordnung e/f unsicher'], 'Bericht 61 Aussagen')

URL_ISE = 'https://www.ise.fraunhofer.de/content/dam/ise/de/documents/presseinformationen/2025/3025_ISE_PI_Waermepumpen-heizen-auch-im-Altbau-klimafreundlich.pdf'
URL_KFW = 'https://www.kfw.de/PDF/Download-Center/F%C3%B6rderprogramme-(Inlandsf%C3%B6rderung)/PDF-Dokumente/6000005131_M_458.pdf'


def qd(t, u, a, s):
    return {'t': t, 'u': u, 'a': a, 's': s}


# Quellen einmal je Id (t Titel, u Adresse, a Abruf, s Status); die Seite zeigt Quelle, Abruf und Status an jeder Zahl
QUELLEN = {
    'arten': qd('co2online, „Heizungsarten im Vergleich“ (26.09.2024, Preisbasis 2023)', URL_GAS, ABRUF_52, 'veraltet'),
    'pellet': qd('co2online, „Pelletheizung“ (ohne Datum)', URL_CO + 'heizung/pelletheizung/', ABRUF_52, 'prüfen vor Nutzung'),
    'wp26': qd('co2online, „Wärmepumpe: Kosten, Funktion & Förderung 2026“', URL_CO + 'waermepumpe/', ABRUF_52, 'geprüft'),
    'ratgeber': qd('Ratgeber (wohnglück, hausjournal), nur Suchtreffer', '', ABRUF_52, 'prüfen vor Nutzung'),
    'reduco': qd('reduco.ai, „Fernwärme 2026“ (Blog)', 'https://reduco.ai/blog/heizung/fernwaerme-kosten-anschluss-2026', ABRUF_52, 'prüfen vor Nutzung'),
    'ir': qd('co2online, „Infrarotheizung“ (Oktober 2026)', URL_CO + 'heizung/infrarotheizung/', ABRUF_52, 'geprüft'),
    'hyb': qd('co2online, „Hybridheizung“ (05.08.2025)', URL_CO + 'heizung/hybridheizung/', ABRUF_52, 'prüfen vor Nutzung'),
    'bdew': qd('BDEW-Gaspreisanalyse August 2026 (Bericht 40)', 'https://www.bdew.de/media/documents/BDEW_Gaspreisanalyse_082026.pdf', '2026-10-27', 'geprüft'),
    'ct1': qd('cleanthinking.de, „Was Heizen im Winter 2026/27 wirklich kostet“ (zitiert Destatis)', 'https://www.cleanthinking.de/?p=1073584', ABRUF_52, 'prüfen vor Nutzung'),
    'tec': qd('tecson.de, Heizöl-Tagespreis 27.10.2026 (Bericht 40)', '', '2026-10-27', 'prüfen vor Nutzung'),
    'destatis': qd('Destatis, Pressemitteilung Nr. 345 vom 30.09.2026', 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/09/PD26_345_61243.html', ABRUF_52, 'geprüft'),
    'bnetza': qd('Bundesnetzagentur, Monitoringbericht 2025, zitiert von cleanthinking.de', '', ABRUF_52, 'veraltet'),
    'depi': qd('Deutsches Pelletinstitut über topagrar.com, Oktober 2026', 'https://www.topagrar.com/energie/news/pelletspreis-steigt-im-oktober-2026-weniger-stark-an-a-20030280.html', ABRUF_52, 'prüfen vor Nutzung'),
    'holz': qd('Buche 144,66 €/Rm (Ratgeber, Bericht 33); 1.885 kWh/Rm: LWF Bayern, Merkblatt 20', 'https://lwf.bayern.de/mam/cms04/service/dateien/mb20_scheitholz_2025_rz_web_bf.pdf', ABRUF_52, 'prüfen vor Nutzung'),
    'fw': qd('Wärmepreis-Transparenzplattform, zitiert von cleanthinking.de (01.04.2026)', '', ABRUF_52, 'prüfen vor Nutzung'),
    'ise': qd('Fraunhofer ISE, Pressemitteilung vom 03.11.2025 (Feldmessung)', URL_ISE, ABRUF_52, 'geprüft'),
    'wpqs': qd('Fraunhofer ISE, WP-QS Schlussbericht (Mittel nur aus Suchtreffer)', 'https://www.ise.fraunhofer.de/content/dam/ise/de/documents/projekte/WP-QS_Schlussbericht.pdf', ABRUF_52, 'prüfen vor Nutzung'),
    'a9': qd('GModG Anlage 9, Treibhausgas-Faktoren (Bericht 52; nicht in Bericht 61)', 'https://www.gesetze-im-internet.de/geg/anlage_9.html', ABRUF_52, 'prüfen vor Nutzung'),
    'kfw': qd('KfW Merkblatt 458, Stand 09/2026 (Bericht 16)', URL_KFW, ABRUF_16, 'geprüft'),
    'gmodg': qd('GModG am amtlichen Wortlaut (Bericht 61)', 'https://www.gesetze-im-internet.de/geg/', ABRUF_61, 'geprüft'),
    'b33': qd('Bericht 33 (Holzfeuerung, Zusammenfassung)', '', '2026-10-27', 'prüfen vor Nutzung'),
    'eigen': qd('eigene Annahme (kein Beleg)', '', ABRUF_52, 'Annahme'),
    'vz': qd('Verbraucherzentrale, Wärmepumpen-Seiten (Bericht 52, Abschnitt 7)', '', ABRUF_52, 'geprüft'),
}


def art(hid, name, von, bis, basis, status, q, hinweis, **extra):
    """neue Heizart in arten: gleiche Felder wie waermepumpe/gas, damit Mappe und Kostenzeile sie ohne Sonderfall lesen"""
    d = {'id': hid, 'name': name, 'basis': basis, 'von': von, 'bis': bis, 'status': status, 'unsicher': True, 'q': q, 'hinweis': hinweis}   # Quelle, Adresse und Abruf stehen einmal in vergleich.quellen[q]
    d.update(extra)
    return d


ARTEN_NEU = {
    'oel': art('H-23', 'Öl-Brennwert', 6000, 18000, 'Anschaffung inkl. Einbau, ohne Tank.', 'veraltet, nur Größenordnung', 'arten', 'Preisbasis 2023, nur Größenordnung.', preisstand='2023'),
    'sole': art('H-21', 'Sole-/Erdwärmepumpe', 38500, 46500, 'Gerät 30.500 € plus Bohrung oder Kollektoren 8.000 bis 16.000 €.', 'prüfen vor Nutzung', 'wp26', 'Die Seite nennt im Text im Schnitt 46.500 € und widerspricht sich bei Förderbeispielen; Bohrung ist genehmigungspflichtig (nicht geprüft).'),
    'pellets': art('H-24', 'Pelletkessel', 14000, 21000, 'Kessel mit Lager, Puffer und Einbau.', 'prüfen vor Nutzung', 'pellet', 'Größenordnung; die Seite von 2024 nennt 17.000 bis 25.000 €.'),
    'scheitholz': art('H-25', 'Scheitholzkessel (Vergaser)', 12000, 20000, 'Anschaffung inkl. Einbau, ohne Förderung.', 'prüfen vor Nutzung', 'ratgeber', 'Ratgeber-Zusammenfassung, nicht am Original gelesen; Puffer 1.500 bis 3.000 € extra.'),
    'fernwaerme': art('H-26', 'Fernwärme', 3000, 8000, 'Einbau der Übergabestation (2024).', 'veraltet, nur Größenordnung', 'arten', 'Der Hausanschluss (5.000 bis 20.000 €, reduco.ai, unsicher) ist NICHT in der Spanne.', preisstand='2024'),
    'infrarot': art('H-27', 'Infrarot / Elektro', 1200, 1800, 'Geräte für ein Haus, Fachkraft kommt dazu.', 'prüfen vor Nutzung', 'ir', 'Gerät 100 bis 600 €; Gesamtpreis eigene Überschlagsrechnung (10 bis 15 Geräte).'),
    'hybrid': art('H-28', 'Hybrid Gas + Wärmepumpe', 17000, 35000, 'Anschaffung inkl. Einbau.', 'prüfen vor Nutzung', 'hyb', 'Der Fördertext der Quelle (65-%-Bedingung) ist veraltet.'),
}


def w(v, i, q, s, n=''):
    d = {'w': v, 'id': i, 'q': q, 's': s}
    if n:
        d['n'] = n
    return d


ANNAHMEN = {
    'heiz0': w(10000, 'H-Beispiel', 'wp26', 'Annahme', 'Beispielhaus ohne Zeichnung: 10.000 kWh Heizwärme (co2online); mit Haus kommt sie aus der Karte Dämmung.'),
    'ww': w(5000, 'H-Beispiel', 'wp26', 'Annahme', 'Warmwasser 5.000 kWh im Jahr (co2online-Beispiel); die Heizwärme des Hauses enthält keines.'),
    'preis': {
        'gas': w(11.93, 'H-40', 'bdew', 'geprüft', 'Erdgas, 20.000 kWh, 2026 bisher (August: 12,45 ct).'),
        'oel': w(14.06, 'H-41', 'ct1', 'prüfen vor Nutzung', 'Juli 2026 mit USt.; andere Quelle 17,9 ct (H-42).'),
        'strom': w(37.97, 'H-43', 'destatis', 'geprüft', '1. Halbjahr 2026, „inkl. Steuern“ nicht ausdrücklich.'),
        'wpstrom': w(27.44, 'H-44', 'bnetza', 'veraltet', 'Stand 01.04.2025, Sekundärquelle: vor Nutzung prüfen.'),
        'pellets': w(9.29, 'H-45', 'depi', 'prüfen vor Nutzung', '464,61 €/t durch 5.000 kWh/t (Annahme); Portale melden 439 bis 444 €/t.'),
        'holz': w(7.6743, 'H-46', 'holz', 'prüfen vor Nutzung', 'Buche 144,66 €/Rm durch 1.885 kWh/Rm; Zeit nicht bepreist; Waldholz 40 bis 50 €/Rm.'),
        'fernwaerme': w(15.6, 'H-48', 'fw', 'prüfen vor Nutzung', 'Mischpreis brutto, meiste Kunden 12,5 bis 17,5 ct; Mehrfamilienhaus-Preis, hier Näherung.'),
    },
    'oel_alt': w(17.9, 'H-42', 'tec', 'prüfen vor Nutzung', 'Heizöl-Tagespreis 27.10.2026, 3.000 l.'),
    'nutz': {
        'gas': w(0.90, 'H-74', 'ct1', 'prüfen vor Nutzung', 'Brennwertkessel (laut cleanthinking, unsicher).'),
        'oel': w(0.90, 'H-74', 'ct1', 'prüfen vor Nutzung', 'Brennwertkessel (laut cleanthinking, unsicher).'),
        'jaz_luft': w(3.4, 'H-71', 'wpqs', 'prüfen vor Nutzung', 'Feld 2,6 bis 4,9; Mittel nur aus Suchtreffer.'),
        'jaz_sole': w(4.3, 'H-71', 'wpqs', 'prüfen vor Nutzung', 'Feld 3,6 bis 5,4; Quellen uneinig.'),
        'pellets': w(0.85, 'H-74', 'eigen', 'Annahme', 'Eigene Annahme ohne Quelle (Mindestwert Pelletöfen 85 %).'),
        'scheitholz': w(0.80, 'H-74', 'eigen', 'Annahme', 'Eigene Annahme ohne Quelle.'),
        'fernwaerme': w(1.0, 'H-56', 'eigen', 'Annahme', 'Übergabe ohne Verluste; Netzverluste nicht gerechnet.'),
        'infrarot': w(1.0, 'H-57', 'ir', 'Annahme', 'Hersteller nahezu 100 %, Messung bei Strahlung nur 40 bis 70 % (Widerspruch).'),
        'hybrid_wp': w(0.70, 'H-58', 'eigen', 'Annahme', '70 % der Wärme aus der Wärmepumpe, 30 % Gas; eigene Annahme.'),
    },
}


def li(*paare):
    return [[t, q] for t, q in paare]


def erl(t, p, s, par=''):
    d = {'t': t, 'p': p, 's': s}
    if par:
        d['u'] = GEG % par
    return d


# Erlaubt-Angaben einmal je Id; s: g = Wortlaut gelesen (Bericht 61), n = Wortlaut nicht geprüft, p = prüfen vor Nutzung, a = Auslegung, Anwalt fragen
ERLX = {
    'gas42': erl('Einbau im Bestand ist eine zulässige Option.', '§ 42 Abs. 2 Nr. 1', 'g', '42'),
    'bio43': erl('Bei Einbau nach dem ' + STICHTAG_DE + ' muss die Wärme ' + BIO_STUFEN_TXT + ' aus Biomethan, Bioöl, biogenem Flüssiggas oder Wasserstoff stammen; erfüllbar auch durch Solarthermie, Lüftung mit Wärmerückgewinnung oder Hybrid.', '§ 43 Abs. 1, 3 bis 5', 'g', '43'),
    'bu108': erl('Bußgeld bis 5.000 € bei Vorsatz oder Leichtfertigkeit.', '§ 108', 'g', '108'),
    'wp42': erl('Elektrisch angetriebene Wärmepumpe ist eine zulässige Option.', '§ 42 Abs. 2 Nr. 2', 'g', '42'),
    'laerm': erl('Schall außen: allgemeines Wohngebiet tags 55 / nachts 40 dB(A), reines Wohngebiet 50 / 35; Buchstabenzuordnung unsicher.', 'TA Lärm Nr. 6.1', 'p'),
    'lbo': erl('Abstände zur Grenze und Verfahrensfreiheit hängen vom Bundesland ab; nicht für alle Länder geprüft.', 'Landesbauordnung', 'n'),
    'bohr': erl('Bohrung ist genehmigungspflichtig; Genehmigung und Landesrecht nicht geprüft.', 'Wasser- und Bergrecht', 'n'),
    'bm42': erl('Biomasse ist eine zulässige Option.', '§ 42 Abs. 2 Nr. 4', 'g', '42'),
    'bm45': erl('Im Bestand nur Biomassekessel oder Biomasseofen mit Wasser als Wärmeträger; nur Brennstoffe nach § 3 Abs. 1 Nr. 4, 5, 5a, 6, 7, 8 oder 13 der 1. BImSchV.', '§ 45 Abs. 1', 'g', '45'),
    'bim': erl('Typprüfung des Herstellers, Grenzwerte der 1. BImSchV: Wortlaut nicht geprüft.', '1. BImSchV', 'n'),
    'fw42': erl('Hausübergabestation zum Anschluss an ein Wärmenetz ist eine zulässige Option.', '§ 42 Abs. 2 Nr. 9', 'g', '42'),
    'fw109': erl('Anschlusszwang je Gemeinde möglich: § 109 begründet ihn nicht selbst, er verweist auf Landesrecht; Landesrecht nicht geprüft.', '§ 109', 'g', '109'),
    'ir46': erl('Stromdirektheizung im Bestand nur, wenn der Wärmeschutz die Werte der §§ 16 und 19 um mindestens 30 % unterschreitet; Austausch einer Einzelraum-Stromdirektheizung ausgenommen.', '§ 46 Abs. 1 und 2', 'g', '46'),
    'ir46a': erl('Ausnahme: höchstens zwei Wohnungen, Eigentümer bewohnt eine selbst. Ob ein vermietetes Haus darunter fällt, ist Auslegung.', '§ 46 Satz 2', 'a', '46'),
    'ir10': erl('Im Neubau mindestens 45 % Unterschreitung, gleiche Ausnahme.', '§ 10 Abs. 4', 'g', '10'),
    'hy42': erl('Wärmepumpen-Hybridheizung ist eine zulässige Option.', '§ 42 Abs. 2 Nr. 5', 'g', '42'),
    'hy43': erl('Die Bio-Treppe gilt als erfüllt, wenn die Wärmepumpe beim Teillastpunkt A (DIN EN 14825) mindestens 30 % bzw. bei bivalent alternativem Betrieb 40 % der Leistung des Spitzenlasterzeugers erreicht; der Satz ist im Wortlaut verschachtelt.', '§ 43 Abs. 5 Satz 1', 'g', '43'),
    'hy43a': erl('Was „bivalent alternativer Betrieb“ hier heißt und dass sonst die Bio-Treppe gilt, ist Auslegung.', '§ 43 Abs. 5', 'a', '43'),
}
BIO = ['gas42', 'bio43', 'bu108']

ARTEN_VGL = {
    'gas': {'tr': 'gas', 'nutz': 'gas', 'co2': [240, 240], 'wart': [220, 220, 'H-61', 'arten', 'veraltet'], 'auf': 1, 'foerd': 'nein', 'bio': True,
            'vor': li(('niedrige Anschaffung', 'arten'), ('Bio-Treppe erst ab ' + stufen[0][0], 'gmodg')),
            'nach': li(('keine Förderung für neue Anlagen', 'arten'), ('Bio-Treppe: ' + BIO_VON_BIS, 'gmodg'), ('CO2-Preis steckt im Gaspreis (Bericht 40)', '')), 'erl': BIO},
    'oel': {'tr': 'oel', 'nutz': 'oel', 'co2': [310, 310], 'wart': [175, 175, 'H-62', 'arten', 'veraltet'], 'auf': 1, 'foerd': 'nein', 'bio': True,
            'vor': li(('niedrige bis mittlere Anschaffung', 'arten')),
            'nach': li(('keine Förderung für neue Anlagen', 'arten'), ('Bio-Treppe wie bei Gas', 'gmodg'), ('hoher, schwankender Ölpreis (14,06 oder 17,9 ct)', 'ct1'), ('Tank und Platz nötig (Bericht 51 fehlt)', '')),
            'erl': BIO, 'hinweis': 'Aufwand gering, aber Tank und Platz nötig.'},
    'waermepumpe': {'tr': 'strom', 'nutz': 'jaz_luft', 'co2': [560, 560], 'wart': [100, 400, 'H-60', 'wp26', 'geprüft'], 'auf': 2, 'foerd': 'ja', 'wp': True,
                    'vor': li(('günstiger und weniger aufwendig als Erdwärme, fast überall umsetzbar', 'vz'), ('Jahresarbeitszahl im Feld 2,6 bis 5,4', 'ise'), ('förderfähig (Grundförderung 30 %)', 'kfw')),
                    'nach': li(('weniger effizient als Erdwärme, Ventilatoren machen Geräusche, Aufstellort bestimmt den Schallschutz', 'vz'), ('Preis streut stark (regionale Angebotsauswertung)', 'eigen')),
                    'erl': ['wp42', 'laerm', 'lbo']},
    'sole': {'tr': 'strom', 'nutz': 'jaz_sole', 'co2': [560, 560], 'wart': [100, 400, 'H-60', 'wp26', 'geprüft'], 'auf': 3, 'foerd': 'ja', 'wp': True,
             'vor': li(('Erdtemperatur schwankt kaum, sparsamer Betrieb', 'vz'), ('höhere Jahresarbeitszahl (4,3, unsicher)', 'wpqs'), ('förderfähig (Grundförderung 30 %)', 'kfw')),
             'nach': li(('Bohrungen nicht überall erlaubt, nicht jeder Boden gibt genug Wärme, Erweiterung teuer, Kollektoren brauchen große aufgegrabene Flächen', 'vz'), ('hohe Kosten', 'wp26')),
             'erl': ['wp42', 'bohr'], 'hinweis': 'Aufwand hoch: Bohrung genehmigungspflichtig (nicht geprüft).'},
    'pellets': {'tr': 'pellets', 'nutz': 'pellets', 'co2': [20, 20], 'wart': [280, 500, 'H-63', 'pellet', 'prüfen vor Nutzung'], 'auf': 2.5, 'foerd': 'ja',
                'vor': li(('niedrigere Betriebskosten als Öl, gut mit Solarthermie kombinierbar, hohe KfW-Förderung', 'pellet'), ('niedriger CO2-Faktor (20 g/kWh)', 'a9')),
                'nach': li(('hohe Anschaffung, Lager 3 bis 10 m², Asche 3- bis 5-mal im Jahr, Feinstaub, mehr Wartung', 'pellet')), 'erl': ['bm42', 'bm45', 'bim']},
    'scheitholz': {'tr': 'holz', 'nutz': 'scheitholz', 'co2': [20, 20], 'wart': None, 'auf': 3, 'foerd': 'luecke',
                   'vor': li(('günstiger Brennstoff in der Rechnung', 'holz'), ('niedriger CO2-Faktor (20 g/kWh)', 'a9')),
                   'nach': li(('Zeit- und Platzbedarf für Holz (eigene Einordnung)', 'eigen'), ('Trocknung 1 bis 3 Jahre', 'b33'), ('Pufferspeicher nötig (unsicher)', 'ratgeber')), 'erl': ['bm42', 'bm45', 'bim'],
                   'hinweis': 'Kaminofen: nur Zusatz, kein Ersatz der Heizung (Ersparnis im Beispiel rund 90 € im Jahr vor Ofen, Schornsteinfeger und Zeit). Ob er unter § 45 fällt: Auslegung, Anwalt oder Schornsteinfeger fragen.'},
    'fernwaerme': {'tr': 'fernwaerme', 'nutz': 'fernwaerme', 'co2': [180, 300], 'wart': [0, 0, 'H-64', 'arten', 'veraltet'], 'auf': 1, 'foerd': 'luecke',
                   'vor': li(('geringer Einbauaufwand, keine Wartung', 'arten')),
                   'nach': li(('Preis hoch (15,6 ct, unsicher)', 'fw'), ('Hausanschluss 5.000 bis 20.000 € kommt dazu (unsicher)', 'reduco'), ('nur wo ein Netz liegt', 'eigen')), 'erl': ['fw42', 'fw109'],
                   'hinweis': 'Der Hausanschluss (5.000 bis 20.000 €) ist in der Spanne nicht enthalten.'},
    'infrarot': {'tr': 'strom', 'nutz': 'infrarot', 'co2': [560, 560], 'wart': [0, 0, 'H-65', 'ir', 'geprüft'], 'auf': 1, 'foerd': 'nein', 'ww': False,
                 'vor': li(('geringe Anschaffung, kaum Wartung, platzsparend', 'ir')),
                 'nach': li(('hohe Betriebskosten', 'ir'), ('keine Warmwasserbereitung', 'ir'), ('keine Förderprogramme', 'ir'), ('Wirkungsgrad umstritten (Hersteller nahezu 100 %, Messung 40 bis 70 %)', 'ir')),
                 'erl': ['ir46', 'ir46a', 'ir10']},
    'hybrid': {'tr': 'hybrid', 'nutz': 'hybrid_wp', 'co2': None, 'wart': [470, 470, 'H-58', 'eigen', 'Annahme'], 'auf': 2.5, 'foerd': 'luecke', 'hy': True,
               'vor': li(('hoher erneuerbarer Anteil, sicher bei Frost, sinnvoll im Altbau', 'hyb')),
               'nach': li(('höhere Investition, aufwendigere Planung und Wartung, mehr Platz', 'hyb'), ('Förderlage im Artikel veraltet (65-%-Bedingung)', 'hyb')), 'erl': ['hy42', 'hy43', 'hy43a'],
               'hinweis': 'Wartung 470 € = Wärmepumpe 250 € plus Gas 220 € (eigene Summe).'},
}
# Reihenfolge der Karten: feste Liste, neutral
REIHE = ['gas', 'oel', 'waermepumpe', 'sole', 'pellets', 'scheitholz', 'fernwaerme', 'infrarot', 'hybrid']
FOERDERUNG = {'satz': 0.30, 'max': 28000, 'arten': ['waermepumpe', 'sole', 'pellets'], 'q': 'kfw'}
IMPORT = [
    {'l': 'PL', 's': 'Polen', 'g': 'Lücke', 't': 'Kein Zoll, kein Sanktionsrecht (EU-Binnenmarkt). Preise vor Ort nicht gefunden. Nur deutsche Händlerpreise für polnische Marken, mit Händlermarge und ohne Vor-Ort-Preis: Defro Bioslim 20 kW Pelletkessel 4.661,96 € (gemashop.de), ohne ausgewiesene 1.-BImSchV-Zertifizierung. Typprüfung bzw. Prüfnummer des Herstellers verlangen.'},
    {'l': 'UA', 's': 'Ukraine', 'g': 'Lücke', 't': 'Kein Sanktionsverbot für diese Waren gefunden. Preise (Hrywnja), Zoll nach Handelsabkommen und Einfuhrumsatzsteuer 19 % für Kessel und Öfen nicht recherchiert.'},
    {'l': 'RU', 's': 'Russland', 'g': 'ungeklärt', 't': 'Einfuhrverbote sind für Kapitel 44 und 9406 belegt (Bericht 46); für Heizkessel und Öfen (vermutlich Zolltarif 7321, 8403) und Eisen und Stahl wurde der Wortlaut nicht gelesen (EUR-Lex nicht lesbar). „Nicht zulässig“ erst nach Lesen des Originals. Preise vor Ort nicht recherchiert.'},
    {'l': 'BY', 's': 'Weißrussland', 'g': 'ungeklärt', 't': 'Eisen- und Stahlerzeugnisse sind verboten (Art. 1q, Anhang XII, VO 765/2006); die Zolltarifnummern für Kessel und Öfen wurden nicht geprüft. Preise vor Ort nicht recherchiert.'},
]
for i in REIHE:
    if i not in ('waermepumpe', 'gas') and i not in ARTEN_NEU:
        fehler.append('Heizart %s fehlt in ARTEN_NEU' % i)
    for a in ARTEN_VGL[i]['vor'] + ARTEN_VGL[i]['nach']:
        if a[1] and a[1] not in QUELLEN:
            fehler.append('Quelle %s unbekannt' % a[1])
    for k in ARTEN_VGL[i]['erl']:
        if k not in ERLX:
            fehler.append('Erlaubt-Angabe %s unbekannt' % k)
    if ARTEN_VGL[i]['wart'] and ARTEN_VGL[i]['wart'][3] not in QUELLEN:
        fehler.append('Quelle Wartung %s unbekannt' % i)

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
        'oel': ARTEN_NEU['oel'], 'sole': ARTEN_NEU['sole'], 'pellets': ARTEN_NEU['pellets'], 'scheitholz': ARTEN_NEU['scheitholz'],
        'fernwaerme': ARTEN_NEU['fernwaerme'], 'infrarot': ARTEN_NEU['infrarot'], 'hybrid': ARTEN_NEU['hybrid'],
    },
    'bio_treppe': {
        'id': 'H-03', 'gesetz': '§ 43 GModG', 'ueberschrift': UEBERSCHRIFT, 'stichtag': STICHTAG_ISO, 'stufen': stufen,
        'status': 'am Gesetzestext geprüft 02.11.2026',
        'quelle': 'GModG § 43 (gesetze-im-internet.de)', 'url': URL_GEG, 'abruf': ABRUF_59,
    },
    'vergleich': {
        'stand': ABRUF_61, 'bericht': 'recherche/52_heizung_vergleich.md', 'bericht_recht': 'recherche/61_gmodg_heizung_wortlaut.md',
        'reihe': REIHE, 'jahre': 20, 'annahmen': ANNAHMEN, 'arten': ARTEN_VGL, 'foerderung': FOERDERUNG, 'quellen': QUELLEN, 'erlx': ERLX, 'import': IMPORT,
    },
}

if __name__ == '__main__':
    pfad, n = schreibe('heizung', 'Heizanlage (S3 01.11.2026, S4 02.11.2026, H1 02.11.2026): Anschaffung je Heizart (Wärmepumpe: Bericht 59; übrige: Bericht 52, H-Nummern); Bio-Treppe (§ 43 GModG, Bericht 59); Vergleich Heizarten (Annahmen, Wirkung, CO2-Faktoren, Vor-/Nachteile, Erlaubt nach Bericht 61). ERZEUGT von erzeuger/daten_heizung.py. Nicht von Hand ändern.', o)
    print('%s: %d Byte; Arten %d' % (pfad, n, len(o['arten'])))
