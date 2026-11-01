# -*- coding: utf-8 -*-
"""Erzeugt daten/saunaholz.js (window.DATEN.saunaholz) fuer den Holzvergleich in der Sauna-Karte (Auftrag S2, 01.11.2026).
Einzige Quelle: recherche/58_saunaholz_vergleich.md (Abruf 31.10.2026). Der Erzeuger prueft gegen den Bericht und bricht ohne Schreiben ab, wenn
 - ein Quellenkuerzel nicht in Abschnitt 1 steht (eigene Zusatzquellen tragen den Schluessel "X-..." und stehen unter "zusatz"),
 - die Zahl der empfehlenden Quellen je Holz und Zweck nicht mit den Spalten "Summe W / Summe B" der Tabelle in Abschnitt 2 uebereinstimmt,
 - ein in Abschnitt 7 genanntes Holz dort eine andere Zahl hat,
 - eine Preis- oder Importzahl nicht im Berichtstext vorkommt.
Das gehoert NICHT in daten/sauna.js (Berichte 43/44): die Karte liest beide Dateien, die Preisspanne bleibt die aus sauna.js (eine Rechnung).
Aufruf: python -I -X utf8 erzeuger/daten_s2_holz.py"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import schreibe, HIER

BERICHT = open(os.path.join(os.path.dirname(HIER), 'recherche', '58_saunaholz_vergleich.md'), encoding='utf-8').read()
ZEILEN = BERICHT.split('\n')
ABRUF = '2026-10-31'
fehler = []

# ---- Abschnitt 1: Quellen mit Kuerzel (Titel und URL stehen im Bericht; hier nur kurz)
QUELLEN = {
    'TH': ('Thermory, Sauna materials Product catalogue 0422 GER', 'Hersteller (Thermoholz)', 'https://thermory.com/wp-content/uploads/2022/07/Thermory_Sauna_materials_Product_catalogue_0422-A4_GER_web.pdf'),
    'HA': ('Harvia, Choosing sauna benches und How to design a sauna', 'Hersteller', 'https://www.harvia.com/en-US/ideas-and-trends/products/choosing-sauna-benches/'),
    'KA': ('Karibu, Außensauna online kaufen', 'Hersteller', 'https://www.karibu.de/info/wissenswertes/sauna-wissen/sauna-planung/aussensauna-kaufen'),
    'OS': ('Osmo, Saunaprofile', 'Hersteller', 'https://www.osmo.de/innenbereich/einrichtung-moebelbau/saunabau/saunaprofile'),
    'KL': ('Klafs, Wellness-ABC Hemlock', 'Hersteller', 'https://www.klafs.de/privat/gesundheit/wellness-abc/hemlock'),
    'HJ': ('Hausjournal, Sauna-Holzarten (31.12.2024)', 'Ratgeber', 'https://www.hausjournal.net/sauna-holzarten'),
    'SA': ('Sanier.de, Die besten Holzarten für die Heimsauna', 'Ratgeber', 'https://www.sanier.de/badezimmer/sauna/die-besten-holzarten-fuer-die-heimsauna'),
    'HB': ('Hornbach.de, Banklatte Linde 2400 x 65 x 28 mm', 'Händler', 'https://www.hornbach.de/p/banklatte-linde-2400-x-65-x-28-mm/10571513/'),
    'WE': ('Weka (aus Bericht 43): Eignungsaussage ohne Zweck, wird nicht gezählt', 'Hersteller', 'recherche/43_sauna_bau.md'),
}
GEZAEHLT = ['TH', 'HA', 'KA', 'OS', 'KL', 'HJ', 'SA', 'HB']
# ---- Zusatzquellen (nicht in Abschnitt 1; eigener Schluessel X-...)
ZUSATZ = {
    'X-BAUA': ('BAuA, TRGS 907 Holzstaub (nur Suchtreffer)', 'Behörde, unsicher', 'https://www.baua.de/DE/Angebote/Regelwerk/TRGS/pdf/907/907-holzstaub.pdf?__blob=publicationFile&v=2'),
    'X-IHR': ('ihr-holzshop.de, Fasebrett nord. Fichte 18,5 x 121 mm', 'Händler', 'https://ihr-holzshop.de/profilholz-fasebrett-nord.-fichte-18-5-x-121-mm-us-hobelfallend'),
    'X-HHO': ('holzhandelonline.de, Thermo-Abachi Profilholz (Fassadenprofil)', 'Händler', 'https://www.holzhandelonline.de/danisches-tripel-block-profilholz-abachi-thermohol.html'),
    'X-EBAY': ('eBay-Angebote (Suchtreffer)', 'Händler, unsicher', ''),
    'X-HSH': ('Holzshop, Espe-Saunaprofil (Suchtreffer)','Händler, unsicher', ''),
    'X-SL': ('sauna-life.com (Suchtreffer, Seite nicht lesbar)', 'Händler, unsicher', 'https://sauna-life.com/Sauna-wood/Wood-moulding-Hemlock/Hemlock-14-x-96-x-2720-mm::4005.html'),
    'X-PUU': ('Puumarket (Estland), Espe und Thermo-Espe STP 15 x 90 x 2400', 'Händler (EU-Vergleich)', 'https://puumarket.ee/en/toode/sauna-voodrilaud-haab-stp-15x90x2400mm/'),
    'X-SPR': ('sprzedajemy.pl, Anzeigen Saunabretter (Suchtreffer)', 'Anzeigenportal, unsicher', 'https://sprzedajemy.pl/dom-i-ogrod/ogrod/baseny-balie-i-sauny/sauny/temat/deski'),
    'X-ROZ': ('Rozetka und Prom.ua, Suchergebnisse (Suchtreffer)', 'Händler, unsicher', 'https://build.rozetka.com.ua/ua/brus/c4640664/'),
}

# ---- Zaehlung (Abschnitt 2/7): empfehlende Quellen je Holz und Zweck; u = davon unsicher (Suchtreffer)
HOLZ_IDS = [('fichte', 'Fichte'), ('kiefer', 'Kiefer'), ('thermokiefer', 'Thermo-Kiefer'), ('espe', 'Espe'), ('thermoespe', 'Thermo-Espe'), ('thermofichte', 'Thermo-Fichte'),
            ('abachi', 'Abachi'), ('hemlock', 'Hemlock'), ('rotzeder', 'Rotzeder'), ('erle', 'Erle'), ('thermoerle', 'Thermo-Erle'), ('linde', 'Linde'), ('kelo', 'Kelo')]
ZAEHLUNG = {
    'fichte': {'wand': (['TH', 'HA', 'KA', 'OS', 'KL'], ['KL']), 'bank': (['HA'], [])},
    'kiefer': {'wand': (['HA'], []), 'bank': (['HA'], [])},
    'thermokiefer': {'wand': ([], []), 'bank': (['TH'], [])},
    'espe': {'wand': (['TH', 'HA', 'OS'], []), 'bank': (['TH', 'HA', 'KA', 'HJ', 'SA'], [])},
    'thermoespe': {'wand': (['TH', 'HA'], []), 'bank': (['TH', 'HA'], [])},
    'thermofichte': {'wand': (['TH'], []), 'bank': ([], [])},
    'abachi': {'wand': ([], []), 'bank': (['HJ'], [])},
    'hemlock': {'wand': (['OS', 'KL', 'HJ', 'SA'], []), 'bank': (['HJ', 'SA'], [])},
    'rotzeder': {'wand': (['TH', 'HJ'], []), 'bank': (['TH'], [])},
    'erle': {'wand': (['TH', 'HA'], []), 'bank': (['TH', 'HA'], [])},
    'thermoerle': {'wand': (['TH', 'HA'], []), 'bank': (['TH', 'HA'], [])},
    'linde': {'wand': ([], []), 'bank': (['HB'], [])},
    'kelo': {'wand': ([], []), 'bank': ([], [])},
}

# ---- Eigenschaften: s = Stufe 1..3 (3 = fuer die Sauna guenstig), q = Quellen, t = Textaussage; abg = aus "Thermoholz allgemein" abgeleitet;
# L = Luecke (keine Quelle), W = Quellen widersprechen sich (kein Balken, nicht in der Punktzahl)
L = {'l': 1}


def K(s, q, t, abg=False):
    d = {'s': s, 'q': q, 't': t}
    if abg:
        d['abg'] = 1
    return d


def W(q, t):
    return {'w': 1, 'q': q, 't': t}


TH_ALLG = ' (Thermoholz allgemein)'
KRIT = {
    'fichte': {'harz': K(2, ['WE'], 'harzarm, nur unbehandelt (Weka, Bericht 43)'), 'hitze': K(2, ['HJ'], 'speichert Wärme, ohne sich stark zu erhitzen'), 'halt': K(3, ['HA', 'KA'], 'Platz 1 beim Umgang mit Feuchte (Harvia), nimmt kaum Wasser auf (Karibu)'), 'splitter': L, 'geruch': K(2, ['HJ', 'SA'], 'angenehmer Duft')},
    'kiefer': {'harz': L, 'hitze': L, 'halt': L, 'splitter': L, 'geruch': L},
    'thermokiefer': {'harz': K(3, ['TH'], 'harz- und splitterfrei'), 'hitze': K(3, ['TH'], 'geringe Wärmeleitfähigkeit'), 'halt': K(3, ['TH'], 'dimensionsstabil, hohe Fäulnisbeständigkeit'), 'splitter': K(3, ['TH'], 'splitterfrei'), 'geruch': K(3, ['SA'], 'ohne Holzduft' + TH_ALLG, True)},
    'thermofichte': {'harz': K(3, ['HJ'], 'harzfrei' + TH_ALLG, True), 'hitze': K(3, ['TH', 'HJ'], 'geringere Wärmeleitfähigkeit' + TH_ALLG, True), 'halt': K(3, ['TH'], 'dimensionsstabil, hohe Fäulnisbeständigkeit' + TH_ALLG, True), 'splitter': L, 'geruch': K(3, ['SA'], 'ohne Holzduft' + TH_ALLG, True)},
    'espe': {'harz': K(3, ['TH', 'HJ'], 'kein Harz'), 'hitze': K(3, ['TH', 'HJ'], 'leitet Wärme schlecht'), 'halt': K(3, ['HJ', 'OS'], 'formstabil, feuchtigkeitsbeständig, laut Osmo widerstandsfähiger als Fichte'), 'splitter': K(3, ['TH'], 'keine Splitter'), 'geruch': K(3, ['HJ'], 'keine stark duftenden Harze')},
    'thermoespe': {'harz': K(3, ['HJ'], 'harzfrei' + TH_ALLG, True), 'hitze': K(3, ['TH', 'HJ'], 'geringere Wärmeleitfähigkeit'), 'halt': K(3, ['TH', 'HJ', 'SA'], 'dimensionsstabil, fäulnisbeständig, nimmt kaum Feuchtigkeit auf'), 'splitter': L, 'geruch': K(3, ['SA'], 'ohne Holzduft')},
    'abachi': {'harz': K(3, ['HJ'], 'harzfrei'), 'hitze': K(3, ['HJ'], 'geringe Wärmeleitfähigkeit'), 'halt': K(1, ['HJ'], 'nimmt Feuchtigkeit leicht auf, pflegebedürftig'), 'splitter': K(3, ['HJ'], 'splittert nicht'), 'geruch': L},
    'hemlock': {'harz': K(2, ['HJ'], 'harzarm'), 'hitze': K(2, ['HJ'], 'gibt Wärme gleichmäßig ab'), 'halt': K(3, ['HJ', 'KL'], 'langlebig, feuchtigkeitsbeständig, für große Temperaturbelastung geeignet'), 'splitter': L, 'geruch': L},
    'rotzeder': {'harz': K(3, ['TH', 'HJ'], 'kein Harz'), 'hitze': K(3, ['TH'], 'geringe Wärmeleitfähigkeit'), 'halt': K(3, ['TH', 'SA'], 'wasserabweisend, witterungsbeständig'), 'splitter': K(3, ['SA', 'HJ'], 'splittert nicht'), 'geruch': K(2, ['TH', 'HJ', 'SA'], 'starker, angenehmer Duft (ätherische Öle)')},
    'erle': {'harz': L, 'hitze': K(3, ['TH'], 'verminderte Wärmeleitfähigkeit'), 'halt': K(3, ['TH'], 'widerstandsfähig, wasserabweisend'), 'splitter': L, 'geruch': L},
    'thermoerle': {'harz': K(3, ['HJ'], 'harzfrei' + TH_ALLG, True), 'hitze': K(3, ['TH'], 'geringere Wärmeleitfähigkeit' + TH_ALLG, True), 'halt': W(['TH', 'HA'], 'Thermory: dimensionsstabil; Harvia: spröder, poröser, nimmt Feuchtigkeit leichter auf'), 'splitter': L, 'geruch': K(3, ['SA'], 'ohne Holzduft' + TH_ALLG, True)},
    'linde': {'harz': K(2, ['WE'], 'harzarm (Weka, Eignungsaussage ohne Zweck)'), 'hitze': L, 'halt': L, 'splitter': L, 'geruch': L},
    'kelo': {'harz': L, 'hitze': L, 'halt': K(3, ['SA', 'HJ'], 'sehr hart und formstabil, verzieht sich kaum'), 'splitter': L, 'geruch': K(2, ['HJ'], 'angenehmer Duft')},
}

# ---- Vor- und Nachteile (Datentexte, Deutsch wie in sauna.js): [Text, Quellen, unsicher?]
PLUS = {
    'fichte': [('Beim Umgang mit Feuchte Platz 1 unter den genannten Hölzern', ['HA']), ('Festes, elastisches Holz, nimmt kaum Wasser auf', ['KA']), ('Für Außenwände der Kabine bevorzugt', ['TH'])],
    'kiefer': [('Beim Umgang mit Feuchte auf Platz 2 hinter Fichte', ['HA'])],
    'thermokiefer': [('Harz- und splitterfrei, geringe Wärmeleitfähigkeit, „hervorragend für Saunabänke“', ['TH'])],
    'thermofichte': [('Dimensionsstabil, hohe Fäulnisbeständigkeit (Thermoholz)', ['TH'])],
    'espe': [('Kein Harz, keine Splitter, leitet Wärme schlecht', ['TH']), ('Formstabil, feuchtigkeitsbeständig', ['HJ']), ('Praktisch astfrei, noch widerstandsfähiger als Fichte', ['OS'])],
    'thermoespe': [('Dimensionsstabil, hohe Fäulnisbeständigkeit', ['TH']), ('Nimmt kaum Feuchtigkeit auf, ohne Holzduft', ['SA'])],
    'abachi': [('Harzfrei, splittert nicht, geringe Wärmeleitfähigkeit', ['HJ']), ('Laut Hausjournal ideal für Sitzbänke und Rückenlehnen', ['HJ'])],
    'hemlock': [('Wenige Einschlüsse, für große Temperaturbelastung besonders gut geeignet', ['KL']), ('Harzarm, langlebig, gibt Wärme gleichmäßig ab', ['HJ'])],
    'rotzeder': [('Kein Harz, geringe Wärmeleitfähigkeit, wasserabweisend', ['TH']), ('Splittert nicht, witterungsbeständig', ['SA']), ('Starker, angenehmer Duft', ['TH', 'HJ', 'SA'])],
    'erle': [('Widerstandsfähig, wasserabweisend, verminderte Wärmeleitfähigkeit', ['TH'])],
    'thermoerle': [('Dimensionsstabil (Thermory)', ['TH'])],
    'linde': [('Ein Händler nennt sie ausdrücklich geeignet als Banklatte in der Sauna', ['HB']), ('Harzarm (Weka, ohne Zweckangabe)', ['WE'])],
    'kelo': [('Sehr hart, formstabil, selten rissig', ['SA']), ('Angenehmer Duft', ['HJ'])],
}
MINUS = {
    'espe': [('Beim Umgang mit Feuchte nur Platz 4 von 5 (Harvia)', ['HA'], False)],
    'abachi': [('Nimmt Feuchtigkeit leicht auf, pflegebedürftig', ['HJ'], False), ('Tropenholz, Raubbau-Kritik', ['SA'], False), ('Als atemwegssensibilisierend gelistet (Holzstaub beim Bearbeiten); verbaut nicht belegt', ['X-BAUA'], True)],
    'rotzeder': [('Als atemwegssensibilisierend gelistet (Holzstaub beim Bearbeiten); verbaut nicht belegt', ['X-BAUA'], True)],
    'thermoerle': [('Laut Harvia spröder, poröser, nimmt Feuchtigkeit leichter auf', ['HA'], False)],
    'kelo': [('Selten und teuer; auf dem Markt Fälschungen, Herkunft meist Finnland oder Russland', ['HJ', 'SA'], False)],
}
# Vorbehalte (Abschnitt 7/8) und Widersprueche (Abschnitt 8, Punkte 8 und 9)
HINWEIS = {
    'fichte': 'Die Hersteller, die Fichte nennen, verkaufen selbst Fichte-Kabinen. Klafs steht nur als Suchtreffer (unsicher).',
    'kiefer': 'Thermory führt nur Thermo-Radiatakiefer; diese Angaben stehen bei Thermo-Kiefer.',
    'espe': 'Thermory, Osmo und Karibu verkaufen selbst Espe.',
    'abachi': 'In Foren oft als Standard-Bankholz genannt, aber kein gelesener Hersteller nennt es ausdrücklich (Harvia erwähnt es nicht).',
    'linde': 'Als Bankholz nur eine Händlerseite (kein Hersteller); „harzarm“ (Weka) nennt keinen Zweck und zählt nicht.',
    'kelo': 'Keine ausdrückliche Empfehlung gefunden („selten und teuer“).',
    'erle': 'Hausjournal: zwei Lesungen derselben Seite widersprechen sich (Bank „bleibt kühl“ ja oder nein); deshalb dort nicht gezählt.',
}
WIDERSPRUCH = {
    'thermoerle': 'Quellen widersprechen sich: Thermory „dimensionsstabil“, Harvia „nimmt Feuchtigkeit leichter auf“. Nicht aufgelöst.',
    'erle': 'Quellen widersprechen sich: Hausjournal ist bei Erle nicht eindeutig (zwei Lesungen).',
}

# ---- Zusaetzliche Preise (Bericht 58, Abschnitt 4), NICHT in der Spanne der Karte (die Spanne bleibt die aus sauna.js):
# e = Einheit (m2, lfm, stk), v = Preis in EUR (null = nicht rechenbar), h = Anbieter, q = Quelle, s = belegt | unsicher | eu, ausser = Sauna-Eignung nicht belegt
PREISE = {
    'fichte': [dict(e='m2', v=17.25, h='ihr-holzshop.de', q='X-IHR', s='belegt', ausser=1, hinweis='Fasebrett 18,5 × 121 mm, nicht als Sauna ausgewiesen, derzeit nicht auf Lager')],
    'espe': [dict(e='m2', v=109.90, h='Holzshop (Händler nicht benannt)', q='X-HSH', s='unsicher', hinweis='Osmo-Saunaprofil A, Maße und Datum nicht erkennbar'),
             dict(e='stk', v=23.33, h='eBay', q='X-EBAY', s='unsicher', hinweis='Banklatte 28 × 90, 6 Stück für 140 €, Länge unklar'),
             dict(e='m2', v=83.13, h='Puumarket (Estland)', q='X-PUU', s='eu', hinweis='STP 15 × 90 × 2400, Versand nach Deutschland nicht genannt'),
             dict(e='lfm', v=6.65, h='Puumarket (Estland)', q='X-PUU', s='eu', hinweis='STP 15 × 90 × 2400')],
    'thermoespe': [dict(e='m2', v=416, h='eBay', q='X-EBAY', s='unsicher', hinweis='15 × 90 × 2400, 89,90 € je Stück; bei Deckbreite 80 mm 468 €/m²'),
                   dict(e='m2', v=67.50, h='Puumarket (Estland)', q='X-PUU', s='eu', hinweis='„price offer“, also vorläufig'),
                   dict(e='lfm', v=5.40, h='Puumarket (Estland)', q='X-PUU', s='eu', hinweis='„price offer“, also vorläufig')],
    'hemlock': [dict(e='m2', v=99.50, h='sauna-life.com', q='X-SL', s='unsicher', hinweis='Seite nicht lesbar, Preis nur aus Suchtreffer'),
                dict(e='m2', v=None, h='eBay', q='X-EBAY', s='unsicher', hinweis='119,90 €, Menge unklar, nicht rechenbar')],
    'rotzeder': [dict(e='m2', v=None, h='eBay', q='X-EBAY', s='unsicher', hinweis='149,90 oder 119,90 €, Währung und Menge unklar, nicht rechenbar')],
    'abachi': [dict(e='lfm', v=16.11, h='eBay', q='X-EBAY', s='unsicher', hinweis='Banklatte 34 × 90 × 1900, 30,60 €'),
               dict(e='lfm', v=7.95, h='eBay', q='X-EBAY', s='unsicher', hinweis='Banklatte 2,00 m, Sortierung B, 15,90 €'),
               dict(e='m2', v=98.48, h='holzhandelonline.de', q='X-HHO', s='belegt', ausser=1, hinweis='Thermo-Abachi (Thermo-Ayous) Fassadenprofil, Sauna-Eignung nicht belegt; bis 105,53 €/m²')],
}
# ---- Import (Abschnitt 5): Polen und Ukraine nur mit dem, was der Bericht belegt; Preise in zl / UAH, keine Euro-Umrechnung
PL = {
    'espe': ['Saunaprofil 15 × 90 mm: 295 zł (Länge fehlt)', 'Banklatte 28 × 42 × 2,4 m: 21 zł (8,75 zł je lfm)'],
    'thermoespe': ['Profil 15 × 120 mm: 360 zł (Länge fehlt)', 'Banklatte 28 × 42 × 2,4 m: 25 zł (10,42 zł je lfm)'],
    'abachi': ['Leiste 22 × 80 mm, Klasse A: 23 zł (Länge fehlt)'],
}
UA = {
    'linde': ['Vagonka 14 × 110 × 1600 mm: 1379 UAH je m² (2427 UAH für 1,76 m²)', 'Vagonka 14 × 110 × 2000 mm: 1869 UAH je m² (4112 UAH für 2,20 m²)', 'Prom „Extra“: 2205 UAH je m²'],
    'thermoespe': ['Greus STS4 15 × 120 × 2100 bis 3000 mm: 642 UAH je Stück'],
    'abachi': ['Leiste PAL 22 × 80 × 2200 bis 3200 mm: 390 UAH je Stück'],
    'thermokiefer': ['Thermo-Radiata-Bankbohle Greus 26 × 140 × 2100 bis 2400 mm: 900 UAH je Stück'],
}
IMPORT = {
    'pl_q': 'X-SPR', 'ua_q': 'X-ROZ',
    'pl_hinweis': 'Nur Suchtreffer eines Anzeigenportals. Fracht nach Deutschland: Lücke. Kurs nicht abgerufen, keine Euro-Umrechnung. Zoll und Einfuhrumsatzsteuer entfallen im Binnenmarkt (nicht an der Primärquelle belegt).',
    'ua_hinweis': 'Nur Suchtreffer. Fracht: Lücke. Kurs nicht abgerufen, keine Euro-Umrechnung. Zoll: voraussichtlich keiner (Schluss aus dem EU-Ukraine-Abkommen, TARIC-Satz für KN 4409 ist Lücke). Einfuhrumsatzsteuer: Regelsatz 19 % (§ 12 UStG), Ermäßigung für Holz nicht geprüft.',
    'kelo': 'Laut Sanier kommen Kelo und Fichte meist aus Finnland, Skandinavien oder Russland: aus Russland nicht erlaubt, sonst Herkunftsnachweis verlangen.',
}
# RU/BY: geprueft im Hauptfenster am EUR-Lex-Text (Nachpruefung am Ende von Bericht 58), nicht zoll.de
VERBOT = {
    'ru': {'land': 'Russland', 'stufe': 'Einfuhr verboten', 'gesetz': 'Verordnung (EU) Nr. 833/2014, Art. 3i Abs. 1 mit Anhang XXI', 'ware': 'Kapitel 44 „Holz und Holzwaren; Holzkohle“ (ganz, auch Profilbretter und Banklatten)',
           'stand': 'konsolidierte Fassung vom 24.07.2026', 'fund': 'https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:02014R0833-20260724', 'abruf': ABRUF, 'status': 'geprüft'},
    'by': {'land': 'Belarus', 'stufe': 'Einfuhr verboten', 'gesetz': 'Verordnung (EG) Nr. 765/2006, Art. 1o Abs. 1 mit Anhang X', 'ware': 'KN 44 „Holz und Holzwaren; Holzkohle“ (ganzes Kapitel)',
           'stand': 'konsolidierte Fassung vom 15.10.2026 (englisch)', 'fund': 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02006R0765-20261015', 'abruf': ABRUF, 'status': 'geprüft'},
}
EUDR = {'gesetz': 'VO (EU) 2023/1115 (EUDR), Art. 38 Abs. 2 und 3, Anhang I (ex 4407, ex 4409)', 'stand': 'konsolidierte Fassung vom 18.09.2026',
        'fund': 'https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:02023R1115-20260918', 'abruf': ABRUF, 'status': 'geprüft',
        'text': 'Gilt ab 30.12.2026; für Kleinst- und kleine Unternehmen ab 30.06.2027, aber nicht für Erzeugnisse, die schon unter die Holzhandelsverordnung (EU) Nr. 995/2010 fielen (Saunaholz wohl), daher wahrscheinlich 30.12.2026. Betroffen sind vor allem Händler und Importeure; ob ein Privatkauf „Inverkehrbringen“ ist, ist offen.'}


# ---------------- Pruefung gegen den Bericht ----------------
def norm(n):
    n = re.sub(r'\(.*?\)', '', n).strip().lower()
    return n.replace('-', '').replace(' ', '').replace('nord.', '')


def tabelle2():
    ab, out = False, {}
    for z in ZEILEN:
        if z.startswith('## 2.'):
            ab = True
            continue
        if ab and z.startswith('## '):
            break
        if ab and z.startswith('| ') and not z.startswith('| Holz') and not z.startswith('|---'):
            c = [x.strip() for x in z.strip().strip('|').split('|')]
            if len(c) >= 11:
                mw, mb = re.match(r'(\d+)', c[-2]), re.match(r'(\d+)', c[-1])
                out[norm(c[0])] = (int(mw.group(1)), int(mb.group(1)), 'unsicher' in c[-2])
    return out


def abschnitt7():
    ab, zw, out = False, None, {}
    for z in ZEILEN:
        if z.startswith('## 7.'):
            ab = True
            continue
        if ab and z.startswith('## '):
            break
        if not ab:
            continue
        if z.startswith('Wand/Decke'):
            zw = 'wand'
        elif z.startswith('Bank/Liege'):
            zw = 'bank'
        m = re.match(r'\d+\.\s+(.*)', z)
        if m and zw:
            for seg in m.group(1).split(';'):
                mm = re.match(r'\s*(.+?)\s+(\d)\b', seg)
                if mm:
                    for nm in mm.group(1).split(','):
                        out[(zw, norm(nm))] = int(mm.group(2))
    return out


def pruefe_alles():
    t2, a7 = tabelle2(), abschnitt7()
    kuerzel = set(re.findall(r'^\| ([A-Z]{2,3}) \|', BERICHT, flags=re.M))
    for k in list(QUELLEN) + GEZAEHLT:
        if k not in kuerzel and k != 'WE' and k not in QUELLEN:
            fehler.append('Kürzel nicht in Abschnitt 1: ' + k)
    for k in QUELLEN:
        if k not in kuerzel:
            fehler.append('Kürzel nicht in Abschnitt 1: ' + k)
    if len(t2) != 13:
        fehler.append('Tabelle Abschnitt 2 hat %d statt 13 Hölzer' % len(t2))
    for hid, nm in HOLZ_IDS:
        z = ZAEHLUNG[hid]
        if norm(nm) not in t2:
            fehler.append('Holz nicht in Abschnitt 2: ' + nm)
            continue
        w, b, uw = t2[norm(nm)]
        if len(z['wand'][0]) != w or len(z['bank'][0]) != b:
            fehler.append('%s: Zählung Wand %d / Bank %d, Bericht %d / %d' % (nm, len(z['wand'][0]), len(z['bank'][0]), w, b))
        if bool(z['wand'][1]) != uw:
            fehler.append(nm + ': Markierung unsicher stimmt nicht mit Abschnitt 2')
        for zw in ('wand', 'bank'):
            for q in z[zw][0]:
                if q not in GEZAEHLT:
                    fehler.append('%s: Quelle %s zählt nicht' % (nm, q))
            for q in z[zw][1]:
                if q not in z[zw][0]:
                    fehler.append('%s: unsicher %s ohne Zählung' % (nm, q))
            if (zw, norm(nm)) in a7 and a7[(zw, norm(nm))] != len(z[zw][0]):
                fehler.append('%s %s: Abschnitt 7 sagt %d, Daten %d' % (nm, zw, a7[(zw, norm(nm))], len(z[zw][0])))
    if len(a7) < 20:
        fehler.append('Abschnitt 7 nicht gelesen (%d Einträge)' % len(a7))
    # alle Kuerzel in den Eigenschaften und Listen
    ok = set(QUELLEN) | set(ZUSATZ)
    for hid, kr in KRIT.items():
        for key, v in kr.items():
            for q in v.get('q', []):
                if q not in ok:
                    fehler.append('%s/%s: Quelle %s unbekannt' % (hid, key, q))
    for tab in (PLUS, MINUS):
        for hid, lst in tab.items():
            for e in lst:
                for q in e[1]:
                    if q not in ok:
                        fehler.append('%s: Quelle %s unbekannt' % (hid, q))
    for hid, lst in PREISE.items():
        for p in lst:
            if p['q'] not in ok:
                fehler.append('%s: Preisquelle %s unbekannt' % (hid, p['q']))
            if p['v'] is not None:
                a, b = ('%.2f' % p['v']).replace('.', ','), ('%.2f' % p['v'])
                kurz = str(int(p['v'])) if p['v'] == int(p['v']) else None
                if a not in BERICHT and b not in BERICHT and not (kurz and re.search(r'\b%s\b' % kurz, BERICHT)):
                    fehler.append('%s: Preis %s steht nicht im Bericht' % (hid, p['v']))
    zahlen = ['295 zł', '21 zł', '8,75', '360 zł', '25 zł', '10,42', '23 zł', '1379', '4112', '1869', '2205', '642 UAH', '390 UAH', '900 UAH', '2427', '105,53', '23,33', '468', '416', '119,90', '149,90', '30,60', '15,90']
    for x in zahlen:
        if x not in BERICHT:
            fehler.append('Zahl nicht im Bericht: ' + x)
    for v in VERBOT.values():
        if v['fund'].split('uri=')[1].split('-')[-1] not in BERICHT:
            fehler.append('Fundstelle nicht im Bericht: ' + v['fund'])
    if EUDR['fund'].split('uri=')[1] not in BERICHT or '30.12.2026' not in BERICHT:
        fehler.append('EUDR-Fundstelle nicht im Bericht')


def baue():
    pruefe_alles()
    if fehler:
        print('FEHLER im Erzeuger, nichts geschrieben:')
        for f in fehler:
            print(' -', f)
        sys.exit(1)
    holz = []
    for hid, nm in HOLZ_IDS:
        z = ZAEHLUNG[hid]
        d = {'id': hid, 'name': nm, 'z': {zw: {'q': z[zw][0], 'u': z[zw][1]} for zw in ('wand', 'bank')}, 'k': KRIT[hid],
             'plus': [[t, q] for t, q in PLUS.get(hid, [])], 'minus': [[t, q, 1 if u else 0] for t, q, u in MINUS.get(hid, [])]}
        if hid in HINWEIS:
            d['hinweis'] = HINWEIS[hid]
        if hid in WIDERSPRUCH:
            d['widerspruch'] = WIDERSPRUCH[hid]
        if hid in PREISE:
            d['preise'] = PREISE[hid]
        if hid in PL:
            d['pl'] = PL[hid]
        if hid in UA:
            d['ua'] = UA[hid]
        holz.append(d)
    return {
        'stand': ABRUF, 'bericht': 'recherche/58_saunaholz_vergleich.md', 'anzahl_quellen': len(GEZAEHLT), 'gezaehlt': GEZAEHLT,
        'krit': ['harz', 'hitze', 'halt', 'splitter', 'geruch'],
        'quellen': {k: {'titel': v[0], 'art': v[1], 'url': v[2]} for k, v in QUELLEN.items()},
        'zusatz': {k: {'titel': v[0], 'art': v[1], 'url': v[2]} for k, v in ZUSATZ.items()},
        'holz': holz, 'import': IMPORT, 'verbot': VERBOT, 'eudr': EUDR,
    }


if __name__ == '__main__':
    o = baue()
    pfad, n = schreibe('saunaholz', 'Holzvergleich Sauna (S2, 01.11.2026): Zählung der empfehlenden Quellen, Eigenschaften mit Quelle, Vor- und Nachteile, Zusatzpreise, Import. ERZEUGT von erzeuger/daten_s2_holz.py aus recherche/58_saunaholz_vergleich.md (Abruf 31.10.2026). Nicht von Hand ändern.', o)
    print(f'{pfad}: {n} Byte; Hölzer {len(o["holz"])}, Quellen {len(o["quellen"])} + {len(o["zusatz"])} zusätzliche')
