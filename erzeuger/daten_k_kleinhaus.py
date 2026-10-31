# -*- coding: utf-8 -*-
"""Erzeugt daten/kleinhaus.js (window.DATEN.kleinhaus) fuer die Karte "Kleinhaeuser" (Auftrag K1, 31.10.2026).
Quellen: recherche/45 (C-xx), 46 (I-xx), 47 (Abschnitte ohne Id), 48 (C2-xx), 49 (M2-xx), 50 (G-80/G-81). 48 ersetzt Ids aus 45 (siehe dort "Ersetzte Ids").
Der Erzeuger prueft selbst: jede angegebene Id muss im Bericht als Tabellenzeile "| Id |" stehen (bei 47: die Textstelle), und jede Zahl in den Pruefstrings muss in genau dieser Zeile vorkommen; sonst Abbruch, nichts geschrieben.
Werte, die NICHT aus den Berichten stammen, tragen ids "neu" und eine Quelle mit URL (am 31.10.2026 mit WebFetch geoeffnet): ISO-Containermass, Hig/Yumi-Datenblatt (zu/offen), EZB-Kurs, UStG 11, Modulhaus-Masse (Annahme).
Status: Berichts-Status "geprueft" -> geprüft; "pruefen vor Nutzung" -> prüfen vor Nutzung; "unsicher" -> unsicher (nur dort, wo die Seite die Zahl braucht und sie ausdruecklich als unsicher kennzeichnet: Zonenwerte);
Suchtreffer-Zeilen (C-07, C-08, C-12, C-16, C-10, C2-31, C2-34, C2-40, I-07, M2-34) werden NICHT uebernommen (R074), die Seite zeigt "Keine Angabe".
Aufruf: python -I -X utf8 erzeuger/daten_k_kleinhaus.py"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import schreibe, HIER

BER = os.path.join(os.path.dirname(HIER), 'recherche')
FILES = {45: '45_china_container_kleinhaus.md', 46: '46_import_pl_ru_by.md', 47: '47_mobile_haeuser_raeder.md', 48: '48_container_kleinhaus_luecken.md', 49: '49_mobile_haeuser_luecken.md', 50: '50_gewaechshaus.md'}
B = {n: open(os.path.join(BER, f), encoding='utf-8').read().split('\n') for n, f in FILES.items()}
G, P, U, L, E = 'geprüft', 'prüfen vor Nutzung', 'unsicher', 'Lücke', 'eigene Einordnung'
ABRUF = '2026-10-31'
fehler = []
n_geprueft = [0]


def pruefe(bericht, kennung, *chk):
    """kennung: Id ("C-02") oder Textstelle; chk: Strings, die in derselben Berichtszeile stehen muessen."""
    zeilen = B[bericht]
    z = None
    ist_id = re.match(r'^[A-Z]{1,2}\d?-[0-9A-Za-z]+$', kennung) is not None
    for t in zeilen:
        if (ist_id and t.startswith('| ' + kennung + ' |')) or (not ist_id and kennung in t):
            z = t
            break
    if z is None:
        fehler.append(f'Bericht {bericht}: "{kennung}" nicht gefunden')
        return
    n_geprueft[0] += 1
    for c in chk:
        if c not in z:
            fehler.append(f'Bericht {bericht} "{kennung}": "{c}" fehlt in der Zeile')


# ---------------------------------------------------------------- Pruefung gegen die Berichte (Zahlen, die unten stehen)
pruefe(45, 'C-02', '5.800 × 2.480 × 2.560', '1.500', '1.100')
pruefe(45, 'C-03', '790', '1.450')
pruefe(45, 'C-01', '6.999', '5.999', '4.999', '5.900 × 6.300', '5.640 × 6.140')
pruefe(45, 'C-04', '4.400', '4.300', '4.200')
pruefe(45, 'C-05', '11.800 × 6.240', '11.800 × 2.200')
pruefe(45, 'C-09', '11,8 × 6,3 × 2,5')
pruefe(45, 'C-11', '4.429', '3.686')
pruefe(45, 'C-27', '96.000', '30 m²')
pruefe(45, 'C-28', '52.900', '24 m²')
pruefe(45, 'C-29', '107.000', '42 m²')
pruefe(45, 'C-35', '120 km/h', '150 kg/m²', '300 kg/m²')
pruefe(45, 'C-37', 'Nicht vergleichbar')
pruefe(45, 'C-H01', '2,70', '9406 20 00 00')
pruefe(45, 'C-H02', '50 Quadratmetern', 'zehn Jahren')
pruefe(45, 'C-H03', 'Lücke')
pruefe(45, 'C-19', 'Wohnen zählt nicht')
pruefe(45, 'C-15', '19 %')
pruefe(48, 'C2-01', '50 Quadratmetern')
pruefe(48, 'C2-02', 'Gebäudenutzfläche')
pruefe(48, 'C2-03', 'DIN V 18599')
pruefe(48, 'C2-06', '0,24')
pruefe(48, 'C2-07', '1,3')
pruefe(48, 'C2-09', '1,8')
pruefe(48, 'C2-10', '0,24')
pruefe(48, 'C2-11', '0,30')
pruefe(48, 'C2-13', '0,43 / 0,40', '0,53 / 0,49', '133–167 mm')
pruefe(48, 'C2-14', '0,47 / 0,43', '146 / 140 mm')
pruefe(48, 'C2-17', '0,64 / 0,58', '0,80 / 0,70')
pruefe(48, 'C2-22', 'Schneelastzonen_nach_Verwaltungsgrenzen.xlsx')
pruefe(48, 'C2-23', 'Windzonen_nach_Verwaltungsgrenzen.xlsx')
pruefe(48, 'C2-24', '0,65', '0,81', '0,85', '1,06', '1,10', 'unsicher')
pruefe(48, 'C2-25', '22,5', '0,32', '25,0', '0,39', '27,5', '0,47', '30,0', '0,56', 'unsicher')
pruefe(48, 'C2-27', 'M 8 S 23.2010', '08.05.2023')
pruefe(48, 'C2-28', 'unsicher')
pruefe(48, 'C2-29', 'unsicher')
pruefe(48, 'C2-30', '500 bis 800', '150 bis 200')
pruefe(48, 'C2-32', '70 bis 100')
pruefe(48, 'C2-34', 'widersprechen C2-32')
pruefe(48, 'C2-35', '1.219,75')
pruefe(48, 'C2-36', '5.593,00', '4.046,00')
pruefe(48, 'C2-37', '1.840,40')
pruefe(48, 'C2-38', '732,95')
pruefe(48, 'C2-39', 'nicht gefunden')
pruefe(48, 'C2-46', 'keinen Zollsatz')
pruefe(46, 'I-20', 'Binnenmarkt')
pruefe(46, 'I-21', '10.000')
pruefe(46, 'I-22', '19 %')
pruefe(46, 'I-23', 'Lücke')
pruefe(46, 'I-26', 'Lücke')
pruefe(46, 'I-29', 'keine seriöse Quelle')
pruefe(46, 'I-14', 'Lücke')
pruefe(46, '| Russland | VO (EU) Nr. 833/2014, Art. 3i', 'Anhang XXI', '9406')
pruefe(46, '| Weißrussland | VO (EG) Nr. 765/2006, Art. 1o', 'Anhang X', '44 Holz und Holzwaren')
pruefe(50, 'G-80', 'verboten', '9406')
pruefe(50, 'G-81', 'verboten', 'Art. 1ra', 'Anhang XXVII')
pruefe(47, 'Allgemein 2,55 m', '2,55 m')
pruefe(47, '| Höhe | 4,00 m', '4,00 m')
pruefe(47, '| Länge Anhänger | 12,00 m', '12,00 m')
pruefe(47, '- Außenmaß 2,55 m × 12,00 m', '24,9 m²')
pruefe(47, '- Realistischer mit Deichsel', '21,7 m²')
pruefe(47, '§ 20 BMG Begriff der Wohnung', 'nicht oder nur gelegentlich fortbewegt')
pruefe(49, 'M2-01', 'überwiegend ortsfest benutzt zu werden')
pruefe(49, 'M2-02', 'überwiegend ortsfest benutzt zu werden')
pruefe(49, 'M2-03', 'überwiegend ortsfest benutzt zu werden')
pruefe(49, 'M2-08', 'Dauerwohnen')
pruefe(49, 'M2-09c', 'Wohnnutzung ermöglicht')
pruefe(49, 'M2-09e', 'nicht dauerhaften Nutzung')
pruefe(49, 'M2-10', 'überwiegend ortsfest benutzt zu werden')
pruefe(49, 'M2-11', 'Tiny Houses für Wohnzwecke sind Gebäude')
pruefe(49, 'M2-12', 'wie ein Neubau zu behandeln')
pruefe(49, 'M2-14', 'Lücke')
pruefe(49, 'M2-16', 'nicht oder nur gelegentlich fortbewegt')
pruefe(49, 'M2-17a', '7,46', '373,24')
pruefe(49, 'M2-17c', '24 Monate')
pruefe(49, 'M2-18', '40,00 bis 1.300,00')
pruefe(49, 'M2-20', 'zwei Wochen')
pruefe(49, 'M2-21', 'Lücke')
pruefe(49, 'M2-24', '12 Gastbetten')
pruefe(49, 'M2-26', 'Nutzungsuntersagung')
pruefe(49, 'M2-28', '§ 549')
pruefe(49, 'M2-33', '40.000', '9,37 m', '2.500 kg', '2.700 kg')
pruefe(49, 'M2-35', 'Lücke')
if fehler:
    print('ABBRUCH, nichts geschrieben:')
    for f in fehler:
        print('  -', f)
    sys.exit(1)

# ---------------------------------------------------------------- Quellen (jede URL einmal)
Q = {
    'ISO': ['Wikipedia, Intermodal container (ISO 668); Reederseiten nicht erreichbar', 'https://en.wikipedia.org/wiki/Intermodal_container'],
    'HIG': ['Hig Housing Tech, Made-in-China, ausklappbares Containerhaus', 'https://higcontainerhouse.en.made-in-china.com/product/CtVUDRplOocE/China-High-Strength-Expandable-Mobile-Home-Prefab-Modular-Container-House.html'],
    'YUMI': ['Xiamen Yumi, Made-in-China, Faltcontainer 20 Fuß', 'https://yumi-steel.en.made-in-china.com/product/oOFANRPUHpTt/China-Movable-Prefabricated-Light-Steel-Frame-Folding-Container-House.html'],
    'ZONG': ['Shandong Zongfab, Made-in-China, Faltcontainer', 'https://cn-containerhouse.en.made-in-china.com/product/dEmrxPJDmlUo/China-20FT-Folding-Container-Home-Prefab-Home.html'],
    'CGCH': ['CGCH, Alibaba, ausklappbares Haus', 'https://www.alibaba.com/product-introduction/CGCH-Mobile-Home-20ft-40ft-Expandable_1601199489000.html'],
    'WANZ': ['Wanzhi Steel, 40 Fuß Doppelflügel', 'https://wanzhi-steel.com/expandable-container-house/40ft-double-wing-expandable-house'],
    'DREWRY': ['Drewry, World Container Index (29.10.2026)', 'https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index-assessed-by-drewry'],
    'TARIC': ['EU-TARIC, 9406 20 00 00, Ursprung China', 'https://ec.europa.eu/taxation_customs/dds2/taric/measures.jsp?Lang=de&Taric=9406200000&Area=CN&SimDate=20261031'],
    'UST11': ['UStG § 11 Bemessungsgrundlage für die Einfuhr', 'https://www.gesetze-im-internet.de/ustg_1980/__11.html'],
    'UST12': ['UStG § 12 Steuersätze (Regelsatz 19 %)', 'https://www.gesetze-im-internet.de/ustg_1980/__12.html'],
    'ECB': ['EZB-Referenzkurs USD, 30.10.2026', 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html'],
    'PROMO': ['promobil.de, Tiny-House-Wohnwagen Niewiadow Villetta 780 (01.09.2025)', 'https://www.promobil.de/wohnwagen/neuheiten/tiny-house-wohnwagen-aus-polen-der-niewiadow-villetta-780/'],
    'SHALL': ['Schwäbisch Hall, Tiny House kaufen und finanzieren (Ratgeber)', 'https://www.schwaebisch-hall.de/ratgeber/neubau-und-anbau/minimalistisch-bauen/tiny-house-kaufen.html'],
    'DHZ': ['Deutsche Handwerks Zeitung, Kranpreise 2026 (16.07.2026)', 'https://www.deutsche-handwerks-zeitung.de/?p=381287'],
    'SANIER': ['sanier.de, Was kosten Fundamente (17.12.2025)', 'https://www.sanier.de/ratgeber/was-kosten-fundamente'],
    'NUERT': ['Stadtwerke Nürtingen, Preisblatt NAV 01/2026', 'https://www.sw-nuertingen.de/_Resources/Persistent/b/a/a/6/baa6ef55d4cd3460f8853088abe6bcb183e14beb/Preisblatt%20NAV%2001_2026.pdf'],
    'HERTEN': ['Hertener Stadtwerke, Preisblatt Netzanschluss Strom 2026', 'https://www.hertener-stadtwerke.de/fileadmin/hertener-stadtwerke/downloads/03_netze/01_versorgungsnetze/Stromnetz/Netzanschluss/ab_2026_hertenerstadtwerke_preisblatt_ergaenzende_bedingungen_nav.pdf'],
    'PEINE': ['Stadtwerke Peine, Preisblatt Wasser 01/2026', 'https://www.stadtwerke-peine.de/files/9416-3-0-0a84/Preisblatt Wasser.pdf'],
    'GWN': ['Gemeindewerke Nümbrecht, Preisblatt Wasser 2026', 'https://gwn24.de/wp-content/uploads/2025/12/Preisblatt_Wasser_2026.pdf'],
    'G3': ['GModG § 3 Begriffsbestimmungen (Adresse /geg/)', 'https://www.gesetze-im-internet.de/geg/__3.html'],
    'G104': ['GModG § 104 Kleine Gebäude und Gebäude aus Raumzellen', 'https://www.gesetze-im-internet.de/geg/__104.html'],
    'GA7': ['GModG Anlage 7 Höchstwerte der Wärmedurchgangskoeffizienten', 'https://www.gesetze-im-internet.de/geg/anlage_7.html'],
    'DLS': ['Dlubal Knowledge Base 001530 (Schneelastzonen, Sekundärquelle)', 'https://www.dlubal.com/de/support-und-schulungen/support/knowledge-base/001530'],
    'DLW': ['Dlubal Knowledge Base 001554 (Windzonen, Sekundärquelle)', 'https://www.dlubal.com/de/support-und-schulungen/support/knowledge-base/001554'],
    'DIBTS': ['DIBt, Schneelastzonen je Gemeinde (Excel)', 'https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Schneelastzonen_nach_Verwaltungsgrenzen.xlsx'],
    'DIBTW': ['DIBt, Windzonen je Gemeinde (Excel)', 'https://www.dibt.de/fileadmin/dibt-website/Dokumente/Referat/P5/Technische_Bestimmungen/Windzonen_nach_Verwaltungsgrenzen.xlsx'],
    'VGM': ['VG München, Beschluss 08.05.2023, M 8 S 23.2010 (Tiny-Haus)', 'https://www.gesetze-bayern.de/Content/Rtf/Y-300-Z-BECKRS-B-2023-N-11615?all=False'],
    'BMG20': ['BMG § 20 Begriff der Wohnung', 'https://www.gesetze-im-internet.de/bmg/__20.html'],
    'STVZO32': ['StVZO § 32 Abmessungen von Fahrzeugen', 'https://www.gesetze-im-internet.de/stvzo_2012/__32.html'],
    'STVO29': ['StVO § 29 Übermäßige Straßenbenutzung', 'https://www.gesetze-im-internet.de/stvo_2013/__29.html'],
    'GEBOST': ['GebOSt Anlage, Nr. 263.1.1 (40 bis 1.300 €)', 'https://www.gesetze-im-internet.de/stgebo_2011/anlage.html'],
    'KOELN': ['Stadt Köln, Genehmigung für Großraumtransporte', 'https://www.stadt-koeln.de/service/produkt/genehmigung-fuer-grossraumtransporte-und-schwertransporte'],
    'MBO': ['Musterbauordnung § 2 Abs. 1 (Bauministerkonferenz)', 'https://bauministerkonferenz.de/Dokumente/42323530.pdf'],
    'BAYBO': ['BayBO Art. 2', 'https://www.gesetze-bayern.de/Content/Document/BayBO-2'],
    'BAUONRW': ['BauO NRW 2018 § 2 (Fassung 01.09.2026)', 'https://recht.nrw.de/lrgv/gesetz/01092026-landesbauordnung-2018-bauo-nrw-2018/'],
    'DRSBW': ['Landtag BW, Drucksache 16/7708 (Antwort 04.03.2020)', 'https://www.landtag-bw.de/resource/blob/248260/0f55951d83a5eefbc444519385d27694/16_7708_D.pdf'],
    'DRSBY': ['Bayerischer Landtag, Anfrage 18/11865 (Antwort 03.12.2020)', 'https://www.bayern.landtag.de/www/ElanTextAblage_WP18/Drucksachen/Schriftliche%20Anfragen/18_0011865.pdf'],
    'DRSNDS': ['Niedersächsischer Landtag, Drucksache 19/754', 'https://www.landtag-niedersachsen.de/drucksachen/drucksachen_19_02500/00501-01000/19-00754.pdf'],
    'SHPM': ['Innenministerium SH, Pressemitteilung 16.07.2020 (Camping, Dauerwohnen)', 'https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/IV/Presse/PI/2020/200716_campingplatzverordnung.html'],
    'KRAFT': ['KraftStG § 9 Steuersatz', 'https://www.gesetze-im-internet.de/kraftstg/__9.html'],
    'STVZOA8': ['StVZO Anlage VIII (Hauptuntersuchung, Fristen)', 'https://www.gesetze-im-internet.de/stvzo_2012/anlage_viii.html'],
    'BGB549': ['BGB § 549 Auf Wohnraummietverhältnisse anwendbare Vorschriften', 'https://www.gesetze-im-internet.de/bgb/__549.html'],
    'BEVO': ['BeVO NRW (Beherbergungsstättenverordnung)', 'https://recht.nrw.de/lrgv/rechtsverordnung/30042005-verordnung-ueber-den-bau-und-betrieb-von-beherbergungsstaetten/'],
    'SANK': ['VO (EU) 833/2014 Art. 3i, EUR-Lex 24.07.2026', 'https://eur-lex.europa.eu/legal-content/DE/TXT/HTML/?uri=CELEX:02014R0833-20260724'],
    'SANKBY': ['VO (EG) 765/2006 Art. 1o, 1ra, EUR-Lex 15.10.2026', 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02006R0765-20261015'],
    'BER': ['Eigene Berichte 45 bis 50 (recherche/)', ''],
}
quellen = {k: {'titel': v[0], 'url': v[1]} for k, v in Q.items()}


def c(**kw):
    kw.setdefault('abruf', ABRUF)
    return kw


# ---------------------------------------------------------------- Typen (Masse in m: l = Laenge, b = Breite, h = Hoehe)
TYPEN = [
    {'id': 'cont20', 'regler': False, 'zu': [6.058, 2.438, 2.591], 'offen': [6.058, 2.438, 2.591], 'innen': [5.867, 2.330], 'gewicht': 2200, 'gewichtArt': 'leer', 'je': 1, 'zoll': '9406 20', 'wohn': {'m2': round(5.867 * 2.330, 2), 'art': 'rechnung'},
     'mass': c(ids='neu', q='ISO', status=P, hinweis='ISO 668: außen 6,058 × 2,438 × 2,591 m, innen höchstens 5,867 × 2,330 m (Wikipedia-Tabelle zur Norm, Reederseiten nicht erreichbar).'),
     'fracht_annahme': 'Annahme: ein Container je 40-Fuß-Einheit'},
    {'id': 'falt', 'regler': True, 'zu': [5.8, 2.48, 0.42], 'offen': [5.8, 2.48, 2.56], 'innen': [5.64, 2.32], 'gewicht': 1300, 'gewichtArt': 'Haus', 'je': 8, 'jeBeleg': True, 'zoll': '9406 20', 'wohn': {'m2': round(5.64 * 2.32, 2), 'art': 'rechnung'},
     'mass': c(ids='C-02 (offen), neu (zusammengeklappt 0,42 m)', q='YUMI', status=P, hinweis='Aufgebaut 5.800 × 2.480 × 2.560 mm, zusammengeklappt 420 mm hoch, innen 5.640 × 2.320 mm, 8 Stück je 40-Fuß-HQ-Container (Datenblatt).')},
    {'id': 'ausklapp', 'regler': True, 'zu': [5.9, 2.2, 2.48], 'offen': [5.9, 6.3, 2.48], 'innen': [5.64, 6.14], 'gewicht': 2500, 'gewichtArt': 'Haus', 'je': 1, 'zoll': '9406 20', 'wohn': {'m2': round(5.64 * 6.14, 2), 'art': 'rechnung'},
     'mass': c(ids='C-01, neu (zu 5.900 × 2.200 × 2.480 mm)', q='HIG', status=P, hinweis='Zu 5.900 × 2.200 × 2.480 mm, offen außen 5.900 × 6.300 mm, innen 5.640 × 6.140 mm (Datenblatt). Größere Variante C-05 (40 Fuß): offen 11.800 × 6.240 mm, etwa 73,6 m².'),
     'gross': {'m2': round(11.8 * 6.24, 1), 'ids': 'C-05', 'q': 'WANZ'}, 'fracht_annahme': 'Annahme: ein Haus je 40-Fuß-Einheit'},
    {'id': 'tiny', 'regler': False, 'zu': [9.37, 2.55, 3.20], 'offen': [9.37, 2.55, 3.20], 'innen': None, 'gewicht': 2700, 'gewichtArt': 'zulässig', 'je': 1, 'zoll': None, 'wohn': {'m2': None, 'bis': 24.9, 'von': 21.7, 'art': 'grenze'},
     'mass': c(ids='M2-33, 47 Abschnitt B1', q='PROMO', status=P, hinweis='Beispiel Villetta 780: 9,37 m (mit Deichsel) × 2,55 × 3,20 m, 2.500 kg im Text, 2.700 kg in der Datenliste. Wohnfläche nicht belegt; erlaubt ohne Sondergenehmigung: 2,55 m breit, 4 m hoch, 12 m lang, innen etwa 21,7 bis 24,9 m² (Bericht 47).')},
    {'id': 'modul', 'regler': False, 'zu': [6.0, 4.0, 3.0], 'offen': [6.0, 4.0, 3.0], 'innen': None, 'gewicht': None, 'je': 1, 'zoll': None, 'wohn': {'m2': 24, 'art': 'anbieter'},
     'mass': c(ids='C-28 (24 m²); Maße neu: ANNAHME', q='SHALL', status=E, annahme=True, hinweis='Nur „ca. 24 m²“ stammt vom Anbieter (Smart House). Außenmaße 6,0 × 4,0 m und Höhe 3,0 m mit Satteldach sind eine ANNAHME für die Zeichnung, kein Herstellermaß.')},
]

# ---------------------------------------------------------------- Kostenbausteine
komp = {
    'k_falt_cn': c(von=790, bis=1500, w='USD', ids='C-02, C-03', q='YUMI, ZONG', status=P, hinweis='Angebotspreise ab Werk je Stück (Yumi 1.100 bis 1.500, Zongfab 790 bis 1.450), keine Rechnungen'),
    'k_ausk_cn': c(von=4200, bis=6999, w='USD', ids='C-01, C-04', q='HIG, CGCH', status=P, hinweis='Angebotspreise ab Werk (Hig 4.999 bis 6.999, CGCH 4.200 bis 4.400), Rohbau, keine Rechnungen'),
    'k_tiny_pl': c(von=40000, bis=40000, w='EUR', brutto=True, ids='M2-33', q='PROMO', status=P, hinweis='Villetta 780 „ca. 40.000 Euro brutto (je nach Importeur)“'),
    'k_modul_de': c(von=52900, bis=96000, w='EUR', brutto=True, ids='C-27, C-28', q='SHALL', status=P, hinweis='24 m² (Smart House, schlüsselfertig) bis 30 m² (Schwörer Flying Spaces), Ratgeberpreise „ab“'),
    'l_kauf': c(luecke='Kein belegter Preis in den Berichten; Anzeigen- und Suchtreffer-Preise sind nicht übernommen', ids='C-07, C-08, C-10, I-07, M2-34', status=L),
    'l_kauf_ua': c(luecke='Kein belegter Euro-Preis; Anbieter nennen keine Preise', ids='I-14, M2-35', status=L),
    'f_cn': c(von=3686, bis=4429, w='USD', ids='C-11', q='DREWRY', status=P, hinweis='Drewry 29.10.2026 je 40-Fuß-Container: Mittel 4.429, Shanghai bis Rotterdam 3.686 USD, Spotpreis, ohne Hafen und Lkw'),
    'l_fracht': c(luecke='Frachtkosten nicht belegt', ids='I-26', status=L),
    'l_fracht_ua': c(luecke='Transport, Versicherung, Lieferzeit: keine seriöse Quelle', ids='I-29', status=L),
    'l_zoll_ua': c(luecke='Zollsatz der Ukraine für 9406 nicht belegt (Handelsabkommen seit 29.10.2025 überarbeitet)', ids='I-23', status=L),
    'l_zoll_holz': c(luecke='Zollsatz 9406 10 (Holz) und Leichtstahl ohne Einreihung nicht belegt', ids='C2-46, C-H03', status=L),
    'l_zoll_wert': c(luecke='Zollwert unbekannt, weil der Kaufpreis fehlt', ids='C-H01', status=L),
    'z_eu': c(entf='EU-Binnenmarkt: kein Zoll', ids='I-20', status=E, hinweis='Bericht 46 führt die Quelle dafür als Lücke; hier als eigene Einordnung'),
    'u_eu': c(entf='Preis enthält die Umsatzsteuer (brutto). Bei kleinen polnischen Verkäufern kann polnische USt gelten', ids='I-21', status=E),
    'l_eust_wert': c(luecke='Einfuhrumsatzsteuer 19 % (Regelsatz), aber der Zollwert ist unbekannt', ids='C-H01, C-15', status=L),
    'l_eust_ua': c(luecke='Einfuhrumsatzsteuer 19 % (Regelsatz), aber Zollwert und Zoll unbekannt', ids='I-22, I-23', status=L),
    'kran': c(von=500, bis=800, w='EUR', netto=True, ids='C2-30', q='DHZ', status=P, hinweis='Tagessatz 30-t-Autokran mit Kranführer, netto, ohne Transport; nur eine Quelle'),
    'kran_tiny': c(entf='Das Haus steht auf eigenem Fahrgestell und wird gezogen, nicht gehoben', ids='47 Abschnitt B', status=E),
    'fundament': c(je_m2=[70, 100], w='EUR', ids='C2-32', q='SANIER', status=P, hinweis='Bodenplatte 70 bis 100 €/m² mit Lohn, Dämmung oft extra; ANNAHME Bodenplatte unter der Standfläche, die Art bestimmt der Tragwerksplaner; zweite Quelle widerspricht (C2-34, nicht übernommen)'),
    'strom': c(von=1219.75, bis=5593.00, w='EUR', brutto=True, ids='C2-35, C2-36', q='NUERT, HERTEN', status=G, hinweis='Zwei Versorger: Nürtingen ab 1.219,75 € (plus 61,88 €/m), Herten 4.046,00 bis 5.593,00 €; örtlich verschieden'),
    'wasser': c(von=732.95, bis=1840.40, w='EUR', brutto=True, ids='C2-37, C2-38', q='PEINE, GWN', status=G, hinweis='Zwei Versorger: Nümbrecht 732,95 €, Peine 1.840,40 €, ohne Grabenarbeiten; örtlich verschieden'),
    'abwasser': c(luecke='Kanalanschluss: Gebühr oder Beitrag nach Gemeindesatzung, kein Preisblatt gesichtet', ids='C2-39', status=L),
    'daemmung': c(luecke='Nachrüstkosten für Dämmung (und Statik, Elektro) nicht belegt', ids='C2-13 bis C2-20', status=L),
}
# Kosten je Typ und Herkunft (Verweise auf komp); zoll/eust "auto" = Rechnung in kleinhaus_kern.js
# Kosten je Herkunft (Verweise auf komp); "kauf" je "typ|herkunft" nur dort, wo ein Preis belegt ist, sonst Luecke l_kauf; zoll/eust "auto" = Rechnung in kleinhaus_kern.js (nur China, nur mit Zolltarif)
kosten = {
    'kauf': {'falt|cn': 'k_falt_cn', 'ausklapp|cn': 'k_ausk_cn', 'tiny|pl': 'k_tiny_pl', 'modul|de': 'k_modul_de'},
    'de': {'kauf': 'l_kauf', 'fracht': 'l_fracht', 'zoll': 'z_eu', 'eust': 'u_eu'},
    'pl': {'kauf': 'l_kauf', 'fracht': 'l_fracht', 'zoll': 'z_eu', 'eust': 'u_eu'},
    'ua': {'kauf': 'l_kauf_ua', 'fracht': 'l_fracht_ua', 'zoll': 'l_zoll_ua', 'eust': 'l_eust_ua'},
    'cn': {'kauf': 'l_kauf', 'fracht': 'f_cn', 'zoll': 'auto', 'eust': 'auto'},
}

verboten = {
    'ru': c(stufe='Einfuhr in die EU verboten', gesetz='VO (EU) Nr. 833/2014, Art. 3i mit Anhang XXI', ware='Kapitel 44 (Holz und Holzwaren) und 9406 (vorgefertigte Gebäude)', stand='EUR-Lex konsolidiert 24.07.2026 (Anhang XXI enthält 44 und 9406)', fund='Bericht 46, Nachprüfung am EUR-Lex-Volltext (Zeile 5); Bericht 50, G-80', ids='46 Nachprüfung, G-80', q='SANK', status=G),
    'by': c(stufe='Einfuhr in die EU verboten', gesetz='VO (EG) Nr. 765/2006, Art. 1o mit Anhang X (Holz, Kapitel 44) und Art. 1ra mit Anhang XXVII (u. a. 9406 vorgefertigte Gebäude)', ware='Kapitel 44 und 9406', stand='EUR-Lex konsolidiert 15.10.2026 (Anhang X = KN 44; Anhang XXVII enthält 9406)', fund='Bericht 46, Nachprüfung am EUR-Lex-Volltext (Zeile 5); Bericht 50, G-81', ids='46 Nachprüfung, G-81', q='SANKBY', status=G),
}

# ---------------------------------------------------------------- Eignung
eignung = {
    'gmodg': [
        {'id': 'klein', 'text': '„Kleines Gebäude“: nicht mehr als 50 m² Nutzfläche (§ 3 Abs. 1 Nr. 17); bei Wohngebäuden die nach DIN V 18599 beheizte Gebäudenutzfläche (Nr. 26). Verglichen wird nur die Wohnfläche als Näherung.', 'ids': 'C2-01, C2-02, C2-03', 'q': 'G3', 'status': G},
        {'id': 's104', 'text': '§ 104 Satz 1: Hält ein neues kleines Gebäude die Höchstwerte nach § 36 (Anlage 7, „erstmaliger Einbau“) ein, gelten die Anforderungen des § 10 Absatz 2 als erfüllt, nur diese; Mindestwärmeschutz (§ 11) und Dichtheit (§ 13) bleiben offen. Satz 2 (Raumzellen, höchstens zehn Jahre) passt nicht zu Dauernutzung. Anwendungsbeginn einzelner Teile (Suchtreffer: 01.01.2027) prüfen.', 'ids': 'C-H02, C2-05, C-23', 'q': 'G104', 'status': G},
    ],
    'u': [
        {'id': 'wand', 'name': 'Außenwand', 'soll': 0.24, 'ids': 'C2-06', 'q': 'GA7', 'status': G},
        {'id': 'dach', 'name': 'Dach (erstmaliger Einbau, nicht die 0,20 des Referenzgebäudes)', 'soll': 0.24, 'ids': 'C2-10', 'q': 'GA7', 'status': G},
        {'id': 'boden', 'name': 'Boden gegen Erdreich', 'soll': 0.30, 'ids': 'C2-11', 'q': 'GA7', 'status': G},
        {'id': 'fenster', 'name': 'Fenster (Uw)', 'soll': 1.3, 'ids': 'C2-07', 'q': 'GA7', 'status': G},
        {'id': 'tuer', 'name': 'Außentür', 'soll': 1.8, 'ids': 'C2-09', 'q': 'GA7', 'status': G},
    ],
    'aufbau': {
        'falt': {'wand': '75 mm Steinwolle-Sandwich', 'dach': '50 mm Steinwolle-Sandwich', 'uWand': [0.43, 0.47], 'uDach': [0.58, 0.70], 'ids': 'C-02, C2-14, C2-17', 'text': 'U: eigene Rechnung, angenommenes Lambda (Steinwolle 0,035), ohne Wärmebrücken; Hersteller nennt keinen U-Wert'},
        'ausklapp': {'wand': '75 mm EPS- oder Steinwolle-Sandwich', 'dach': '50 mm Sandwich', 'uWand': [0.40, 0.53], 'uDach': [0.58, 0.80], 'ids': 'C-01, C2-13, C2-17', 'text': 'U: eigene Rechnung, angenommenes Lambda (EPS 0,032 bis 0,040), ohne Wärmebrücken; Hersteller nennt keinen U-Wert. Für 0,24 etwa 128 bis 167 mm EPS'},
    },
    'last': {
        'ausklapp': {'dach': 150, 'boden': 300, 'wind': 'Wind bis 120 km/h (Hersteller)', 'ids': 'C-35', 'text': 'Der Hersteller nennt Dachlast 150 kg/m² (etwa 1,5 kN/m²), nicht ausdrücklich Schneelast; Bodenlast 300 kg/m²'},
        'falt': {'dach': None, 'boden': None, 'wind': 'Wind „Stufe 8“ (Yumi, Skala nicht erklärt)', 'ids': 'C-35', 'text': 'Keine Last in kN/m² angegeben'},
    },
    'schnee': [
        {'z': '1', 'sk': 0.65}, {'z': '1a', 'sk': 0.81}, {'z': '2', 'sk': 0.85}, {'z': '2a', 'sk': 1.06}, {'z': '3', 'sk': 1.10}],
    'wind': [
        {'z': '1', 'v': 22.5, 'q': 0.32}, {'z': '2', 'v': 25.0, 'q': 0.39}, {'z': '3', 'v': 27.5, 'q': 0.47}, {'z': '4', 'v': 30.0, 'q': 0.56}],
    'zonenBeleg': {'ids': 'C2-24, C2-25', 'q': 'DLS, DLW', 'status': U, 'hinweis': 'Sekundärquelle (Software-Hersteller), Mindestwerte der Geländeschneelast, höhenabhängig; Windwerte Basisdruck qb. Die Zuordnung je Gemeinde steht in zwei DIBt-Excel-Dateien (nicht geöffnet). Windstaudruck qp (Tabelle NA.B.3) ist nicht belegt. Kein Nachweis.', 'zuordnung': 'DIBTS, DIBTW'},
}

faelle = [
    {'id': 'C2-27', 'titel': 'VG München, Beschluss 08.05.2023, M 8 S 23.2010', 'text': 'Nutzungsuntersagung für ein als „Tiny-Haus“ bezeichnetes Gartenhaus: Wohnnutzung formell rechtswidrig (keine Baugenehmigung), der Ausbau wohntypischer Einrichtung durfte verlangt werden. „Ein Gartenhaus mit wohnungsspezifischer Ausstattung ist kein Gartenhaus mehr.“ Kein Container, kein Import.', 'q': 'VGM', 'status': G, 'abruf': ABRUF},
]
faelle_hinweis = 'Kein belegter Fall eines abgelehnten oder nachgerüsteten Container- oder Importhauses gefunden (Bericht 48, Abschnitt 3); der Fall oben ist nur verwandt, C2-28 und C2-29 sind nur Suchtreffer (unsicher, nicht übernommen).'

regeln = [
    {'id': 'baurecht', 'mobil': 'Gleich wie fest: Was „überwiegend ortsfest benutzt“ werden soll, ist eine bauliche Anlage, die Räder ändern nichts (MBO, NRW, Bayern, Baden-Württemberg).', 'fest': 'Baugenehmigung nötig, soweit nicht verfahrensfrei; Wohnen ist nie verfahrensfreier Kleinstbau.', 'ids': 'M2-01, M2-02, M2-03, C-19', 'q': 'MBO, BAUONRW, DRSBW', 'status': P},
    {'id': 'zulassung', 'mobil': 'Ändert das Baurecht nach den gelesenen Texten nicht: Tiny Houses für Wohnzwecke sind Gebäude (Bayern), bei jeder Verlegung gilt ein Neubau (Niedersachsen, Landtagsbeschluss, kein Urteil). Gerichtsentscheidung zum immer umgesetzten Wohnanhänger: nicht gefunden.', 'fest': 'Entfällt', 'ids': 'M2-10, M2-11, M2-12, M2-14', 'q': 'DRSBY, DRSNDS', 'status': P},
    {'id': 'wohnsitz', 'mobil': 'Wohnwagen sind nur Wohnungen, wenn sie „nicht oder nur gelegentlich fortbewegt“ werden (§ 20 BMG); eine Zahl für „gelegentlich“ steht nicht im Gesetz.', 'fest': 'Eine Wohnung im Sinne des Meldegesetzes, Anmeldung binnen zwei Wochen; ob der Standort baurechtlich zum Wohnen zulässig ist, prüft die Meldebehörde nicht grundsätzlich (nicht belegt).', 'ids': 'M2-16', 'q': 'BMG20', 'status': G},
    {'id': 'vermietung', 'mobil': 'Dauermiete als Wohnraum: BGB §§ 535 ff., 549. Kurzzeitvermietung ohne Wohnbaurecht: Nutzungsuntersagung (VG München). BeVO NRW erst ab mehr als 12 Gastbetten.', 'fest': 'Gleich. Ferienvermietung: Zweckentfremdung und Gewerbeanmeldung je Gemeinde (nicht geprüft).', 'ids': 'M2-24, M2-26, M2-28', 'q': 'BGB549, VGM, BEVO', 'status': P},
    {'id': 'standort', 'mobil': 'Wohnnutzung nur in einem Baugebiet, das Wohnen zulässt; auf Campingplätzen ist Dauerwohnen nach der Auffassung von Bayern und Schleswig-Holstein nicht zulässig.', 'fest': 'Gleich (Baugebiet mit Wohnnutzung, Erschließung, Abstandsflächen).', 'ids': 'M2-09c, M2-09e, M2-08', 'q': 'DRSBW, DRSBY, SHPM', 'status': P},
    {'id': 'transport', 'mobil': 'Ohne Erlaubnis höchstens 2,55 m breit, 4,00 m hoch, 12,00 m lang (innen etwa 21,7 bis 24,9 m²). Größer nur mit Erlaubnis (§ 29 Abs. 3 StVO): 40 bis 1.300 €, meist etwa zwei Wochen. Begleitfahrzeug ab welcher Breite: Lücke.', 'fest': 'Transport der Module (Lkw, Kran) beim Lieferanten; Übermaß-Erlaubnis gilt auch hier.', 'ids': 'B1, M2-18, M2-20, M2-21', 'q': 'STVZO32, STVO29, GEBOST, KOELN', 'status': P},
    {'id': 'laufend', 'mobil': 'Dauerzulassung: Kfz-Steuer 7,46 € je 200 kg, höchstens 373,24 € im Jahr; Hauptuntersuchung alle 24 Monate (0,75 bis 3,5 t); dazu Haftpflicht.', 'fest': 'Keine Zulassungskosten.', 'ids': 'M2-17a, M2-17c', 'q': 'KRAFT, STVZOA8', 'status': P},
    {'id': 'waerme', 'mobil': 'GModG: gleiche Regeln wie fest; „kleines Gebäude“ bis 50 m² Nutzfläche (Folgen siehe Eignung).', 'fest': 'Gleich.', 'ids': 'M2-12, C2-01', 'q': 'G3', 'status': G},
]

widersprueche = [
    {'id': 'w_gmodg', 'text': 'Geltung des GModG: Gesetzestext unter /geg/, Verbraucherzentrale „gilt seit 29.07.2026“, Suchtreffer „Teile ab 01.01.2027“', 'entscheidung': 'Die Karte nennt „Gesetzestext mit Stand 31.10.2026, Anwendungsbeginn einzelner Teile prüfen“ (Bericht 45).', 'ids': 'C-23'},
    {'id': 'w_dach', 'text': 'Dach-U-Wert: 0,20 (Referenzgebäude, Bericht 45) gegen 0,24 (Anlage 7, erstmaliger Einbau)', 'entscheidung': 'Es gilt 0,24 (Bericht 48 berichtigt Bericht 45).', 'ids': 'C2-10, C-31'},
    {'id': 'w_masse', 'text': 'Herstellermaße widersprüchlich (Zongfab C-03: 5.900 × 2.980 × 2.480 mm; Suzhou Stars C-06: 6,2 bis 6,6 m ausgeklappt)', 'entscheidung': 'Nur die Datenblätter Hig (C-01) und Yumi (C-02) mit klaren Tabellen sind übernommen; die anderen bleiben außen vor.', 'ids': 'C-03, C-06'},
    {'id': 'w_fundament', 'text': 'Fundamentpreise: sanier.de 70 bis 100 €/m² Bodenplatte gegen 90 bis 180 €/m² in Suchtreffern', 'entscheidung': 'Nur sanier.de ist übernommen (Seite gelesen), die Suchtreffer nicht (R074).', 'ids': 'C2-32, C2-34'},
    {'id': 'w_by', 'text': 'Weißrussland und 9406: Bericht 46 „nicht in Anhang X“, Bericht 50 „in Anhang XXVII“', 'entscheidung': 'Beides gilt: Holz (Kapitel 44) in Anhang X, 9406 in Anhang XXVII; Einfuhr verboten (am EUR-Lex-Volltext bestätigt, 31.10.2026).', 'ids': 'G-81'},
]

obj = {
    'stand': ABRUF,
    'status_fertig': P,
    'quellen': quellen,
    'kurs': c(usd=1.1172, ids='neu', q='ECB', stand='2026-10-30', status=G, hinweis='EZB-Referenzkurs 30.10.2026: 1 € = 1,1172 US-Dollar'),
    'zoll': c(satz=0.027, nr='9406 20 00 00', ids='C-H01', q='TARIC', status=G, hinweis='Drittlandszollsatz 2,70 % für Fertigbaumodule aus Stahl, Ursprung China, keine Antidumping- oder Ausgleichsmaßnahme angezeigt (Stand 31.10.2026)'),
    'ust': c(satz=0.19, ids='C-15, I-22', q='UST12', status=G, hinweis='Einfuhrumsatzsteuer 19 % (Regelsatz § 12 UStG)'),
    'bemessung': c(ids='neu', q='UST11', status=G, hinweis='EUSt-Bemessung: Zollwert plus Zölle plus Beförderung bis zum ersten Bestimmungsort in der EU (§ 11 Abs. 1, 3 UStG). Zollwert = Ware + Fracht bis zur EU-Grenze: ANNAHME (Art. 71 UZK auf zoll.de nicht lesbar). Lkw ab Hafen fehlt.'),
    'typen': TYPEN,
    'komp': komp,
    'kosten': kosten,
    'verboten': verboten,
    'eignung': eignung,
    'faelle': faelle,
    'faelle_hinweis': faelle_hinweis,
    'regeln': regeln,
    'widersprueche': widersprueche,
}
pfad, groesse = schreibe('kleinhaus', 'Karte Kleinhäuser (K1, 31.10.2026): Typen, Maße, Kosten bis zur Aufstellung, Eignung, Regeln. ERZEUGT von erzeuger/daten_k_kleinhaus.py aus recherche/45 bis 50. Nicht von Hand ändern.', obj)
print(f'{pfad}: {groesse} Byte; {n_geprueft[0]} Berichtszeilen geprüft, Typen {len(TYPEN)}, Bausteine {len(komp)}, Kostenzeilen {len(kosten)}, Quellen {len(quellen)}')
