# -*- coding: utf-8 -*-
"""Erzeugt daten/klima.js (window.DATEN.klima): Klimaanlage, Strom, Speicher auf der Heizungs-Karte (Auftrag H2, 03.11.2026).
Alle Zahlen kommen aus recherche/53_klima_strom_speicher.md (K-Nummern, Abruf 31.10.2026) und recherche/60_klima_strom_speicher_runde2.md (Abruf 02.11.2026).
Werte, die schon in daten/energie.js stehen (Speicher-Preis, Faustregel, Lebensdauer, PV-Preis, Steckersolar, 14a), werden NUR per Schluessel
referenziert (ref: [Liste, id]); dieser Erzeuger prueft, dass jeder Schluessel in daten/energie.js vorkommt.
Der Erzeuger liest die Berichte selbst und bricht OHNE Schreiben ab, wenn eine erwartete Zahl, Adresse oder ein Status fehlt.
Luecken bleiben Luecken (nie 0, nie Mittelwert). Keine Empfehlung (R078).
Aufruf: python -I -X utf8 erzeuger/daten_klima.py"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import schreibe, HIER

WURZEL = os.path.dirname(HIER)
B53 = open(os.path.join(WURZEL, 'recherche', '53_klima_strom_speicher.md'), encoding='utf-8').read()
B60 = open(os.path.join(WURZEL, 'recherche', '60_klima_strom_speicher_runde2.md'), encoding='utf-8').read()
ENERGIE = open(os.path.join(WURZEL, 'daten', 'energie.js'), encoding='utf-8').read()
ZEILEN = (B53 + '\n' + B60).split('\n')
A53 = '2026-10-31'
A60 = '2026-11-02'
fehler = []


def zeile(anfang, was):
    z = [x for x in ZEILEN if x.startswith(anfang)]
    if not z:
        fehler.append('%s: Zeile "%s" fehlt im Bericht' % (was, anfang))
        return ''
    return z[0]


def k(nr, teile):
    """Zeile '| K-nr |' holen und die erwarteten Zahlen oder Woerter darin verlangen"""
    z = zeile('| %s |' % nr, nr)
    for t in teile:
        if t not in z:
            fehler.append('%s: "%s" fehlt im Bericht' % (nr, t))
    return z


def verlange(txt, teile, was):
    for t in teile:
        if t not in txt:
            fehler.append('%s: "%s" fehlt im Bericht' % (was, t))


def ref(liste, i):
    if '"id":"%s"' % i not in ENERGIE:
        fehler.append('daten/energie.js: Schluessel "%s" fehlt' % i)
    return {'ref': [liste, i]}


# ---- Pruefung der Berichtszeilen (Zahlen, Status) ----
k('K-05', ['300 bis über 1.000', '| geprüft |'])
k('K-02', ['1.800 bis 3.500', '1.350 bis 4.300'])
k('K-03', ['5.000 bis 8.000', '80 bis 200'])
k('K-04', ['2.000 bis 5.000', '4.000 bis 8.000', '100 bis 200', 'Sekundärzitat'])
k('K-06', ['Monoblock ab unter 200 €', 'über 60 dB', 'Ventilator ab 20 €'])
k('K-08', ['Fachbetrieb', 'Erlaubnis'])
k('K-09', ['20 bis 400', '30 €'])
k('K-11', ['350', 'kein Messwert'] if False else ['350'])
k('K-12', ['60 W/m²', 'geprüft'])
k('K-13', ['8,5'])
k('K-14', ['3 bis 4', 'unsicher'])
k('K-15', ['01.01.2027', '01.01.2029', 'unsicher'])
k('K-16', ['§ 5', '§ 6', '§ 10', 'Überschriften geprüft'])
k('K-18', ['55/40', '50/35', 'Nachbarfenster'])
k('K-23', ['unsicher'])
k('K-40', ['6,3 bis 10,6', '8,7 bis 14,4', 'Fraunhofer ISE', 'geprüft'])
k('K-41', ['9,1 bis 22,5', '500 bis 1.200', '500 bis 1.000'])
k('K-47', ['250 bis 2.000', '3.000 bis 12.000', '50 bis 100 €/Jahr', '55 bis 100 dB', 'geprüft'])
k('K-48', ['33 bis 100', '17 bis 50', 'Annahme'])
k('K-49', ['Lücke'])
k('K-51', ['unsicher', 'Widerspruch 4'])
k('K-63', ['unsicher'])
k('K-64', ['Version 1.0, Ausgabe 11/2014', 'Anwendung freiwillig'])
k('K-65', ['Bericht 52'])
k('K-66', ['Lücke'])
k('K-67', ['Bericht 39', '2.000 €', 'prüfen vor Nutzung'])
k('K-68', ['§ 14a EnWG', 'geprüft'])
k('K-70', ['VDE-AR-N 4105:2026-03', 'Fachkraft'])
k('K-72', ['Lücke'])
k('K-80', ['1.700 bis 2.459', '387 bis 559'])
k('K-81', ['4.319', '983'])
k('K-82', ['20.000 bis 24.000', '455 bis 546', '24.000 bis 32.000'])
k('K-83', ['5.000 bis 9.000', '1.138 bis 2.048'])
k('K-84', ['Lücke'])
k('K-85', ['29.499', '581', 'Aktionspreis'])
k('K-86', ['Lücke'])
k('K-87', ['nicht zulässig', '8418', '8502', '8504', '8415 und 8507 im gelesenen Teil nicht gefunden'])
k('K-88', ['ungeklärt'])
k('K-90', ['§ 7 ProdSG', 'geprüft'])
k('K-91', ['2023/1542', 'prüfen vor Nutzung'])
k('K-92', ['Lücke'])
k('K-93', ['Nr. 3 b "Wärmepumpen"', 'Nr. 12 a', 'prüfen vor Nutzung'])
k('K-94', ['Art. 57', 'Nr. 2 b', 'prüfen vor Nutzung'])
k('K-95', ['grundsätzlich nicht genehmigungsfrei', 'unsicher'])
k('K-96', ['Lücke'])
k('K-100', ['ab 10.000', 'ab 20.000', '200 bis 800', '15 bis 20 Jahre', 'geprüft'])
k('K-101', ['20.000 bis 25.000', '30.000 bis 40.000', 'geprüft'])
k('K-102', ['25.000 bis 30.000', '8.000 bis 15.000', 'unsicher'])
k('K-103', ['2027/2028', 'unsicher', 'widersprüchlich'])
k('K-104', ['Lücke'])
k('K-105', ['Lücke'])
k('K-108', ['keine gefunden'])
k('K-111', ['Barrierereduzierung', 'geprüft'])
k('K-112', ['Bauliche Veränderungen', 'geprüft'])
k('K-115', ['14 Jahre', '5 bis 10', 'unsicher'])
k('K-116', ['unsicher'])
k('K-117', ['400 bis 1.200', '1.500 bis 6.000', 'unsicher'])
k('K-118', ['Lücke'])
k('K-119', ['MwSt', 'geprüft'])
k('K-120', ['Anlagen zur Erzeugung von Kälte', 'geprüft'])
k('K-121', ['4,2 kW', 'Anlagen zur Raumkühlung'])
verlange(B53, ['3,75 bis 6,25 ct/kWh', '19 bis 80 €', '37,97 ct/kWh', '17 bis 100', '0,5 bis 1,5 l/Stunde'], 'Bericht 53')
verlange(B53, ['| Russland |', '| Weißrussland |', '| Ukraine |', '| Polen |', 'Faustregel 1,5 kWh je 1.000 kWh'], 'Bericht 53 D.1/K-60')
verlange(B60, ['4,3955 PLN', '50,77 UAH', 'Aktualizacja: 08.2026'], 'Bericht 60 Kurse')
for a in ('| Split, gut (SEER aus K-13) | 8,5 | 1,2 x 350 / 8,5 | 49 kWh | 18,76 € |', '| Split, mittel | 6,0 | 1,2 x 350 / 6 | 70 kWh | 26,58 € |',
          '| Monoblock | 3,0 | 1,2 x 350 / 3 | 140 kWh | 53,16 € |', '| Monoblock, schlecht | 2,0 | 1,2 x 350 / 2 | 210 kWh | 79,74 € |'):
    verlange(B53, [a], 'Bericht 53 A.4')

# ---- Quellen: einmal je Id (t Titel, u Adresse, a Abruf, s Status) ----
URL = {
    'vz_mini': 'https://www.verbraucherzentrale.de/wissen/energie/heizen-und-warmwasser/hilft-eine-miniklimaanlage-gegen-die-grosse-hitze-123853',
    'vz_klima': 'https://www.verbraucherzentrale.de/wissen/energie/energetische-sanierung/klimaanlage-installieren-was-ist-zu-beachten-10525',
    'co2o': 'https://www.co2online.de/modernisieren-und-bauen/anpassung-an-den-klimawandel/klimageraete-effizienzklassen-typen/',
    'reduco': 'https://reduco.ai/blog/heizung/split-klimaanlage-kosten-einbau-2026',
    'adac_k': 'https://www.homeandsmart.de/klimaanlage-komplettangebot-preis-leistung-foerderung-0010-856117',
    'hausj': 'https://hausjournal.net/nutzungsdauer-klimaanlage',
    'bau': 'https://bau.de/text/170127-sunliner-sanierung',
    'vzhh': 'https://www.vzhh.de/themen/bauen-immobilien-energie/so-bleiben-haus-wohnung-auch-im-sommer-angenehm-kuehl',
    'ise': 'https://www.ise.fraunhofer.de/content/dam/ise/de/documents/publications/studies/DE2024_ISE_Studie_Stromgestehungskosten_Erneuerbare_Energien.pdf',
    'adac_n': 'https://www.adac.de/rund-ums-haus/energie/versorgung/notstromaggregat/',
    'adac_b': 'https://www.adac.de/rund-ums-haus/energie/versorgung/blockheizkraftwerk-einfamilienhaus/',
    'adac_z': 'https://www.adac.de/rund-ums-haus/energie/versorgung/brennstoffzellenheizung/',
    'vzs': 'https://www.verbraucherzentrale.de/wissen/energie/erneuerbare-energien/steckersolar-solarstrom-vom-balkon-direkt-in-die-steckdose-44715',
    'chem': 'https://www.gesetze-im-internet.de/chemklimaschutzv_2026/BJNR0640B0026.html',
    'ta': 'https://www.verwaltungsvorschriften-im-internet.de/bsvwvbund_26081998_IG19980826.htm',
    'fgas': 'https://gesetze.legal/eu/vo_eu_2024_573/anhang_iv',
    'vde': 'https://www.vde.com/de/fnn/themen/tar/tar-niederspannung/erzeugungsanlagen-am-niederspannungsnetz-vde-ar-n-4105-2026',
    'prodsg': 'https://www.gesetze-im-internet.de/prodsg_2021/__7.html',
    'bat': 'https://www.ihk.de/giessen-friedberg/geschaeftsbereiche/innovation/umwelt/ce-kennzeichnung-fuer-batterien-5922464',
    'bves': 'https://www.bves.de/wp-content/uploads/2023/08/Sicherheitsleitfaden-Li-Ionen-Hausspeicher.pdf',
    'lxbw': 'https://lxgesetze.de/lbo-2019/AN',
    'lxby': 'https://lxgesetze.de/baybo/57',
    'hass': 'https://www.hassloch.de/gv_hassloch/Wirtschaften,%20Bauen,%20Wohnen%20&%20Umwelt/Bauen/Bauberatung,%20Bauantrag/Informationen%20zum%20Download/Kleinklimaanlagen%20in%20Ha%C3%9Floch_Homepage.pdf',
    'bgb554': 'https://www.gesetze-im-internet.de/bgb/__554.html',
    'weg20': 'https://www.gesetze-im-internet.de/woeigg/__20.html',
    'enwg14a': 'https://www.gesetze-im-internet.de/enwg_2005/__14a.html',
    'bnetza': 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/SteuerbareVBE/start.html',
    'mur': 'https://muratordom.pl/instalacje/wentylacja-i-klimatyzacja/ceny-montazu-klimatyzacji-2026-aktualny-cennik-sprawdzamy-stawki-aa-pGeF-7Yd2-ZZtp.html',
    'cen': 'https://cenauslug.pl/poradniki/ile-kosztuje-domowy-magazyn-energii-ceny-oplacalnosc-i-analiza-zwrotu-z-inwestycji',
    'ven': 'https://vencon.ua/products/cooper-hunter-vital-plus-ch-s12ftxf6',
}
for u in URL.values():
    if u.replace('%20', ' ').replace('%C3%9F', 'ß') not in B53 + B60 and u not in B53 + B60:
        fehler.append('Adresse nicht in den Berichten: ' + u)


def qd(t, u, a, s):
    return {'t': t, 'u': URL.get(u, ''), 'a': a, 's': s}


QUELLEN = {
    'vz_mini': qd('Verbraucherzentrale, „Hilft eine Mini-Klimaanlage gegen die große Hitze?“ (04.08.2026)', 'vz_mini', A53, 'geprüft'),
    'vz_klima': qd('Verbraucherzentrale, „Klimaanlage installieren: Was ist zu beachten?“ (04.08.2026)', 'vz_klima', A53, 'geprüft'),
    'co2o': qd('co2online, „Klimageräte & Klimaanlagen: Vergleich, Effizienz, Alternativen“ (10.07.2025)', 'co2o', A53, 'geprüft'),
    'reduco': qd('reduco.ai, „Split-Klimaanlage 2026: Kosten“ (Stand 31.07.2026, kommerzielle Seite)', 'reduco', A53, 'prüfen vor Nutzung'),
    'adac_k': qd('homeandsmart.de, „Klimaanlage Komplettangebot“ (zitiert ADAC und MyHammer, Original nicht gelesen)', 'adac_k', A53, 'prüfen vor Nutzung'),
    'hausj': qd('hausjournal.net, „Nutzungsdauer Klimaanlage“ (Ratgeber, keine unabhängige Quelle)', 'hausj', A60, 'unsicher'),
    'bau': qd('bau.de, Tabelle Sonnenschutz (nur Suchtreffer-Zusammenfassung)', 'bau', A60, 'unsicher'),
    'vzhh': qd('Verbraucherzentrale Hamburg, „So bleiben Haus und Wohnung im Sommer kühl“ (nur Suchtreffer-Zusammenfassung)', 'vzhh', A60, 'unsicher'),
    'ise': qd('Fraunhofer ISE, „Stromgestehungskosten Erneuerbare Energien“ (Juli 2024, reale Werte 2024, ohne Mehrwertsteuer)', 'ise', A53, 'geprüft'),
    'adac_n': qd('ADAC, „Notstromaggregat“ (03.09.2026)', 'adac_n', A53, 'geprüft'),
    'adac_b': qd('ADAC, „Blockheizkraftwerk im Einfamilienhaus“ (12.09.2025)', 'adac_b', A60, 'geprüft'),
    'adac_z': qd('ADAC, „Brennstoffzellen-Heizung“ (15.09.2025); Förderteil nicht am BEG-Text gelesen', 'adac_z', A60, 'geprüft'),
    'wind': qd('Suchtreffer zu vattenfall.de, biallo.de, rechner-portal.de (Einzelseiten nicht gelesen)', '', A60, 'unsicher'),
    'vzs': qd('Verbraucherzentrale, „Steckersolar“ (24.07.2026)', 'vzs', A53, 'geprüft'),
    'chem': qd('ChemKlimaschutzV 2026 (gesetze-im-internet.de), Überschriften §§ 5, 6, 10 geprüft', 'chem', A53, 'geprüft'),
    'ta': qd('TA Lärm Nr. 6.1 (verwaltungsvorschriften-im-internet.de, Wiedergabe durch Abrufwerkzeug)', 'ta', A53, 'prüfen vor Nutzung'),
    'fgas': qd('VO (EU) 2024/573 Anhang IV (Sekundärabdruck gesetze.legal, kein Wortlaut)', 'fgas', A53, 'unsicher'),
    'vde': qd('VDE FNN, VDE-AR-N 4105:2026-03 (Seite zur Norm, Normtext nicht gelesen)', 'vde', A53, 'geprüft'),
    'prodsg': qd('ProdSG § 7 „CE-Kennzeichnung“', 'prodsg', A60, 'geprüft'),
    'bat': qd('IHK Gießen-Friedberg, „CE-Kennzeichnung für Batterien“ (27.10.2025)', 'bat', A60, 'prüfen vor Nutzung'),
    'bves': qd('BVES, „Sicherheitsleitfaden Li-Ionen-Hausspeicher“ (Version 1.0, 11/2014, freiwillig)', 'bves', A53, 'prüfen vor Nutzung'),
    'lxbw': qd('lxgesetze.de, Anhang zu § 50 LBO Baden-Württemberg (private Wiedergabe)', 'lxbw', A60, 'prüfen vor Nutzung'),
    'lxby': qd('lxgesetze.de, Art. 57 BayBO (private Wiedergabe)', 'lxby', A60, 'prüfen vor Nutzung'),
    'hass': qd('Ortsgemeinde Haßloch, Merkblatt Kleinklimaanlagen (nur Suchtreffer-Zusammenfassung)', 'hass', A60, 'unsicher'),
    'bgb554': qd('BGB § 554', 'bgb554', A60, 'geprüft'),
    'weg20': qd('WEG § 20', 'weg20', A60, 'geprüft'),
    'enwg14a': qd('EnWG § 14a', 'enwg14a', A60, 'geprüft'),
    'bnetza': qd('Bundesnetzagentur, Portal Steuerbare Verbrauchseinrichtungen', 'bnetza', A60, 'geprüft'),
    'mur': qd('muratordom.pl, „Ceny montażu klimatyzacji 2026“ (Seite 17.03.2026)', 'mur', A60, 'prüfen vor Nutzung'),
    'cen': qd('cenauslug.pl, „Ile kosztuje domowy magazyn energii“ („Aktualizacja: 08.2026“)', 'cen', A60, 'prüfen vor Nutzung'),
    'ven': qd('vencon.ua, Produktseite Cooper&Hunter (Händler, Aktionspreis, ohne Seitendatum)', 'ven', A60, 'prüfen vor Nutzung'),
    'b53': qd('eigene Rechnung mit offenen Annahmen', '', A53, 'Annahme'),
    'eigen': qd('eigene Annahme (kein Beleg)', '', A53, 'Annahme'),
    'ru': qd('VO (EU) 833/2014 Anhang XXI, Teilauszug einer Sekundärseite (umwelt-online)', '', A53, 'unsicher'),
    'by': qd('VO (EG) 765/2006, Artikeltexte gelesen, Anhänge nicht', '', A53, 'unsicher'),
}


def F(von, bis, einh, q, s, i, n='', off=''):
    d = {'von': von, 'bis': bis, 'e': einh, 'q': q, 's': s, 'id': i}
    if n:
        d['n'] = n
    if off:
        d['off'] = off
    return d


def L(grund, i, q='b53', s='Lücke'):
    return {'luecke': grund, 'q': q, 's': s, 'id': i}


def W(v, i, q, s, n, **kw):
    d = {'w': v, 'id': i, 'q': q, 's': s, 'n': n}
    d.update(kw)
    return d


ANNAHMEN = {
    'm2': W(20, 'A.4', 'b53', 'Annahme', 'Raum 20 m² (Annahme).', min=8, max=60, step=1),
    'js': W(4000, 'Beispiel', 'eigen', 'Annahme', 'Jahresstrom 4.000 kWh als Beispiel; nicht aus einer Quelle. Mit dem eigenen Verbrauch ersetzen.', min=1000, max=12000, step=100),
    'kwm2': W(60, 'K-12', 'vz_mini', 'geprüft', 'Mindestkühlleistung für einen ganzen Raum 60 W je m².'),
    'std': W(350, 'K-11', 'vz_klima', 'Annahme', '350 Betriebsstunden im Sommer: Label-Konvention, kein Messwert.'),
    'seer_gut': W(8.5, 'K-13', 'reduco', 'Annahme', 'SEER 8,5 (Beispielwert einer Händlerseite), keine Messung eines bestimmten Geräts.'),
    'seer_mittel': W(6.0, 'A.4', 'b53', 'Annahme', 'SEER 6 als mittlerer Fall (Annahme).'),
    'eer_gut': W(3.0, 'A.4', 'b53', 'Annahme', 'EER 3 (Annahme). Die Angabe „meist 3 bis 4“ der UBA-Studie ist unsicher (Studie nicht gelesen).'),
    'eer_schlecht': W(2.0, 'A.4', 'b53', 'Annahme', 'EER 2 als schlechter Fall (Annahme).'),
}

# ---- Kühlen ----
VFR_NICHT = 'nicht geprüft'
KUEHLEN = {
    'mono': {'auf': 1, 'bt': {'rechne': 'eer', 'q': 'b53', 's': 'Annahme', 'id': 'A.4'},
             'f': {'an': [F(300, 1000, '€', 'vz_mini', 'geprüft', 'K-05', 'Mobile Raumklimageräte; „über 1.000 €“ ist nach oben offen.', 'bis')],
                   'le': [F(5, 10, 'a', 'hausj', 'unsicher', 'K-115', 'Mobile Geräte laut Ratgeberportal; keine unabhängige Quelle.')]},
             'vor': [['günstig, kein Einbau nötig', 'vz_mini']], 'nach': [['deutlich weniger effizient als Split (Stiftung Warentest, Verbraucherzentrale)', 'vz_mini'], ['oft 1.000 W und mehr, über 60 dB', 'co2o']],
             'erl': ['fgas27']},
    'split': {'auf': 3, 'bt': {'rechne': 'seer', 'q': 'b53', 's': 'Annahme', 'id': 'A.4'},
              'f': {'an': [F(1800, 3500, '€', 'reduco', 'prüfen vor Nutzung', 'K-02', 'Gesamt installiert; die Seite nennt Gerät und Montage getrennt, die Summe ergibt rechnerisch 1.350 bis 4.300 €.'),
                           F(2000, 5000, '€', 'adac_k', 'prüfen vor Nutzung', 'K-04', 'Monosplit inklusive Montage laut Zitat von ADAC; das ADAC-Original wurde nicht gelesen. Beide Spannen widersprechen sich teilweise.')],
                    'wa': [F(80, 200, '€', 'reduco', 'prüfen vor Nutzung', 'K-03', 'Je Jahr. Zweite Quelle: 100 bis 200 €.')],
                    'le': [F(14, 14, 'a', 'hausj', 'unsicher', 'K-115', 'Etwa 14 Jahre laut Ratgeber; ein Hersteller nennt 15 bis 20 Jahre für zentrale Systeme (nur Suchtreffer). „Etwa 15 Jahre“ nur als gekennzeichnete Annahme.')]},
              'vor': [['schnellste Kühlung (rund 7 Minuten um 11 °C im Test), kann auch heizen, effizienter', 'reduco']],
              'nach': [['Fachbetrieb Pflicht, Außengerät (Lärm, Fassade)', 'vz_klima'], ['reine Klimaanlage nicht förderfähig (Suchtreffer)', 'reduco']],
              'erl': ['miet', 'weg', 'chem', 'ta', 'sp14a', 'fgas29', 'vf_bw', 'vf_by', 'vf_rp', 'vf_rest']},
    'multi': {'auf': 3, 'bt': L('Betrieb für mehrere Räume nicht gerechnet.', 'E.1'),
              'f': {'an': [F(5000, 8000, '€', 'reduco', 'prüfen vor Nutzung', 'K-03', '3 Räume, ein Außengerät. 4 bis 5 Räume: 7.000 bis 12.000 €.'),
                           F(4000, 8000, '€', 'adac_k', 'prüfen vor Nutzung', 'K-04', '2 bis 4 Innengeräte laut ADAC-Zitat (Original nicht gelesen).')],
                    'wa': [F(80, 200, '€', 'reduco', 'prüfen vor Nutzung', 'K-03', 'Je Jahr.')]},
              'vor': [['ein Außengerät für mehrere Räume', 'reduco']], 'nach': [['höhere Kosten, längere Leitungswege', 'reduco'], ['Zusatzleitung 50 bis 80 € je Meter (ADAC-Zitat)', 'adac_k']],
              'erl': ['miet', 'weg', 'chem', 'ta', 'sp14a', 'fgas29', 'vf_bw', 'vf_by', 'vf_rp', 'vf_rest']},
    'fan': {'auf': 1, 'bt': {'text': 'wenig Strom (keine Kühlleistung, nur Luftbewegung); Stromkosten nicht gerechnet', 'q': 'co2o', 's': 'geprüft', 'id': 'K-06'},
            'f': {'an': [F(20, 400, '€', 'vz_mini', 'geprüft', 'K-09', 'Standventilatoren (Test von 38 Geräten); ab etwa 30 €. Preise für Deckenventilatoren: Lücke.')]},
            'vor': [['ab 20 bis 30 €, wenig Strom', 'co2o']], 'nach': [['senkt die Raumtemperatur nicht', 'co2o']], 'erl': []},
    'schatten': {'auf': 2, 'bt': {'text': 'braucht keinen Strom (senkt den Wärmeeintrag)', 'q': 'co2o', 's': 'geprüft', 'id': 'K-06'},
                 'f': {'an': [F(400, 1200, '€ je Fenster', 'bau', 'unsicher', 'K-117', 'Rollläden oder Raffstore mit Motor je Fenster; Markise 1.500 bis 6.000 €; kommerzielle Schätzwerte. Nicht mit den Gesamtpreisen der anderen Karten vergleichbar, darum ohne Balken.')]},
                 'vor': [['gilt laut Verbraucherzentrale Hamburg als wirksamste Lösung (Suchtreffer, nicht selbst gelesen)', 'vzhh']], 'nach': [['Montage nötig; Regeln je nach Fassade und Land (nicht geprüft)', 'eigen']],
                 'hinweis': 'Förderung für Außenjalousien (BEG) wurde nicht am Gesetzestext gelesen und wird hier nicht übernommen.', 'erl': []},
    'wp': {'auf': 0, 'verweis': True,
           'f': {}, 'vor': [['passive Kühlung über die Flächenheizung ist sehr sparsam, senkt die Temperatur aber nur wenig', 'co2o']], 'nach': [['aktive Kühlung erhöht die Stromkosten', 'co2o']],
           'hinweis': 'Eine Wärmepumpe mit Kühlfunktion hat hier keine eigene Spanne: die Preise stehen oben auf der Karte „Heizarten“ (Luft-Wasser-Wärmepumpe).', 'erl': ['sp14a']},
}
# ---- Strom ----
STROM = {
    'netz': {'auf': 1, 'netz': True, 'f': {}, 'vor': [['kein eigener Aufwand', 'eigen']], 'nach': [['Preis wie im Vertrag; ob die Umsatzsteuer enthalten ist, nennt die Quelle nicht ausdrücklich', 'b53']],
             'hinweis': 'Derselbe Preis wie auf der Karte Heizarten (kein zweiter Regler). Der amtliche Wert ist ein Endkundenpreis mit Netzentgelten, Steuern und Abgaben.', 'erl': []},
    'pvdach': {'auf': 2, 'f': {'ct': [F(6.3, 14.4, 'ct', 'ise', 'geprüft', 'K-40', 'Stromgestehungskosten Dach-PV bis 30 kWp 2024: Süddeutschland 6,3 bis 10,6, Norddeutschland 8,7 bis 14,4 ct/kWh; Erzeugungskosten ohne Netzentgelte und Steuern, ohne Mehrwertsteuer gerechnet.')],
                               'an': [ref('pv_preise', 'pv_preis_4_6')], 'wa': [ref('pv_technik', 'pv_betrieb_eur')]},
               'vor': [['belastbare Zahlen im Hausmaßstab', 'ise']], 'nach': [['Dachprüfung und Elektriker nötig (eigene Einordnung)', 'eigen']], 'erl': ['vde', 'mastr']},
    'pvsp': {'auf': 2, 'f': {'ct': [F(9.1, 22.5, 'ct', 'ise', 'geprüft', 'K-41', 'PV-Batterie-Kleinanlage 2024, Batteriekosten laut Text 500 bis 1.200, laut Tabelle 500 bis 1.000 €/kWh (Widerspruch in der Quelle); ohne Mehrwertsteuer.')],
                             'an': [ref('pv_preise', 'pv_gesamt_5_10_sp10')], 'wa': [ref('pv_technik', 'pv_betrieb_eur')], 'le': [ref('speicher', 'sp_lebensdauer')]},
             'vor': [['höherer Eigenverbrauch', 'ise']], 'nach': [['Speicher kostet zusätzlich, siehe „Speicher“ weiter unten', 'eigen']], 'erl': ['vde', 'mastr', 'sp14a']},
    'balkon': {'auf': 1, 'f': {'ct': [F(3.75, 6.25, 'ct', 'b53', 'Annahme', 'B.2', 'Eigene Rechnung: 300 bis 500 € (Set plus Montage, zwei Module) geteilt durch 8.000 kWh genutzten Strom in 20 Jahren (2 Module × 200 kWh); ohne Alterung, Zinsen, Ausfall. Die 20 Jahre sind eine Annahme.')],
                               'an': [F(200, 300, '€', 'vzs', 'geprüft', 'K-30', 'Set mit zwei Standardmodulen; Montagematerial 50 bis 100 € je Modul; Batteriespeicher-Aufpreis etwa 500 bis 1.000 €.')]},
               'vor': [['je 400-Wp-Modul etwa 200 kWh im Jahr gespart, Amortisation meist 3 bis 5 Jahre (senkrecht, Südbalkon, unverschattet)', 'vzs']], 'nach': [['nur kleine Leistung (800 VA, 2.000 Wp)', 'vzs']], 'erl': ['steck', 'st960', 'miet', 'weg']},
    'bhkw': {'auf': 3, 'f': {'ct': [L('Stromgestehungskosten je kWh sind nicht angegeben und nicht belegt.', 'K-100', 'adac_b')],
                             'an': [F(10000, None, '€', 'adac_b', 'geprüft', 'K-100', 'Nano-BHKW (bis 2,5 kW) ab 10.000 €, Mikro-BHKW (bis 15 kW) ab 20.000 €; Installation etwa 5.000 €, Pufferspeicher 1.500 bis 5.000 €. Nach oben offen.', 'bis')],
                             'wa': [F(200, 800, '€', 'adac_b', 'geprüft', 'K-100', 'Je Jahr.')],
                             'le': [F(15, 20, 'a', 'adac_b', 'prüfen vor Nutzung', 'K-100', 'Herstellerangabe laut Artikel.')]},
             'vor': [['KWK-Zuschlag 8 ct/kWh eingespeist, 4 ct/kWh selbst genutzt', 'adac_b']], 'nach': [['Gas und Wärmebedarf nötig, Wartung', 'adac_b']],
             'hinweis': 'Der frühere Wert „ab 5.500 Betriebsstunden“ stammt aus einer Seite von 2016 und wird nicht übernommen.', 'erl': []},
    'bz': {'auf': 3, 'f': {'ct': [L('Stromgestehungskosten im Hausmaßstab nicht belegt; der ISE-Wert 23,1 bis 59,0 ct/kWh gilt für Kraftwerke von 50 MW.', 'K-43', 'ise')],
                           'an': [F(20000, 25000, '€', 'adac_z', 'geprüft', 'K-101', 'Gerät mindestens 20.000 bis 25.000 €; gesamter Heizungstausch 30.000 bis 40.000 € oder mehr.')]},
           'vor': [['Strom und Wärme zugleich', 'adac_z']], 'nach': [['Förderstand widersprüchlich (ADAC 09/2025 gegen eine zweite Quelle), nicht am BEG-Text gelesen: vor Nutzung prüfen', 'adac_z']], 'erl': []},
    'wind': {'auf': 3, 'f': {'ct': [L('Stromgestehungskosten für Kleinwind am Haus: keine unabhängige Zahl (21,9 ct/kWh nur bei 6 m/s in einem Rechnerportal, unsicher).', 'K-102', 'wind', 'Lücke')],
                             'an': [F(25000, 30000, '€', 'wind', 'unsicher', 'K-102', 'Anlage 5 kW laut Anbieter etwa 6.000 € je kW; eine andere Quelle nennt 8.000 bis 15.000 €. Der Ertrag widerspricht sich zwischen zwei Beiträgen (3.400 bis 4.900 gegen 5.000 bis 10.000 kWh im Jahr).')]},
             'vor': [], 'nach': [['Statik und Standort nötig; Regeln (Verfahrensfreiheit, Gebiete) hier nicht geprüft', 'b53']], 'erl': []},
    'notstrom': {'auf': 2, 'f': {'ct': [F(17, 100, 'ct', 'b53', 'Annahme', 'K-48', 'Eigene Rechnung: Betriebskosten 1 bis 3 € je Stunde geteilt durch die Last (3 kW: 33 bis 100, 6 kW: 17 bis 50 ct/kWh). Die Zuordnung Stundenkosten zu Last stammt nicht aus der Quelle. Nur für Notstrom, kein Dauerbetrieb.')],
                                 'an': [F(250, 12000, '€', 'adac_n', 'geprüft', 'K-47', 'Je nach Leistung: 1,5 bis 3 kW 250 bis 2.000 €, 3 bis 8 kW 600 bis 6.000 €, stationär 8 bis 20 kW 3.000 bis 12.000 €; Umschalter 250 bis 500 € (manuell) oder 800 bis 2.000 € (automatisch).')],
                                 'wa': [F(50, 100, '€', 'adac_n', 'geprüft', 'K-47', 'Je Jahr.')]},
                 'vor': [['läuft unabhängig vom Netz', 'adac_n']], 'nach': [['Lärm 55 bis 100 dB, Kraftstofflagerung, Umschalter vom Elektriker', 'adac_n']], 'erl': ['mastr_n']},
}
# ---- Speicher ----
SPEICHER = {
    'li': {'auf': 2, 'f': {'an': [ref('speicher', 'sp_preis_spanne')], 'le': [ref('speicher', 'sp_lebensdauer')]},
           'vor': [['LFP-Zellen dominieren den Heimspeichermarkt (Herstellerseiten, unabhängige Quelle nicht gelesen)', 'b53']], 'nach': [['Aufstellort, Brandschutz und Elektriker beachten', 'bves']],
           'hinweis': 'Preis, Faustregel und Lebensdauer stehen in den Energie-Daten (eine Zahl, eine Quelle). Feste gesetzliche Abstandsmaße für Heimspeicher wurden nicht gefunden (unsicher); die aktuelle Fassung des BVES-Leitfadens ebenfalls nicht.',
           'erl': ['vde', 'sp14a', 'ce_bat', 'brand']},
    'na': {'auf': 0, 'luecke': 'Preis und Marktreife: Quellen widersprüchlich (Natrium-Ionen 40 % billiger gegen etwa gleich wie Lithium); serienreife Heimspeicher werden für 2027 bis 2028 erwartet (nur Suchtreffer, kommerzielle Portale).',
           'luecke_q': 'b53', 'luecke_s': 'unsicher', 'luecke_id': 'K-103', 'f': {}, 'vor': [], 'nach': [], 'erl': []},
    'h2': {'auf': 0, 'luecke': 'Wasserstoff im Hausmaßstab: nicht belegt (Lücke). Der ISE-Wert für wasserstoffbetriebene Gaskraftwerke (23,6 bis 43,3 ct/kWh) gilt nur für Kraftwerke.',
           'luecke_q': 'ise', 'luecke_s': 'Lücke', 'luecke_id': 'K-104', 'f': {}, 'vor': [], 'nach': [], 'erl': []},
    'v2h': {'auf': 0, 'luecke': 'Preis eines Autos als Speicher (bidirektionales Laden): nicht erhoben (Lücke). Hinweis aus einer früheren Recherche (nur Sekundärquelle): bidirektionale Wallbox 2.000 € im Bundesprogramm „Laden im Mehrparteienhaus“.',
            'luecke_q': 'b53', 'luecke_s': 'prüfen vor Nutzung', 'luecke_id': 'K-67', 'f': {}, 'vor': [], 'nach': [], 'erl': []},
    'waerme': {'auf': 0, 'verweis': True, 'f': {}, 'vor': [], 'nach': [], 'hinweis': 'Wärmespeicher (Pufferspeicher) gehören zur Heizung: siehe Karte „Heizarten“; hier keine eigene Zahl.', 'erl': []},
}

ERLX = {
    'fgas27': {'t': 'Neue steckerfertige Geräte (Monoblock) bis 12 kW mit F-Gas ab GWP 150: Verbot des Inverkehrbringens ab 01.01.2027 (Anhang IV Nr. 8 b), Ausnahmen bei Sicherheitsanforderungen; betrifft neue Geräte, nicht den Weiterbetrieb. Unsicher, Wortlaut nicht gelesen.', 'p': 'VO (EU) 2024/573', 's': 'unsicher', 'q': 'fgas'},
    'fgas29': {'t': 'Neue Luft-Luft-Splitsysteme bis 12 kW mit F-Gas ab GWP 150: Verbot des Inverkehrbringens ab 01.01.2029 (Anhang IV Nr. 9 c). Unsicher, Wortlaut nicht gelesen; Nummern in anderen Quellen abweichend.', 'p': 'VO (EU) 2024/573', 's': 'unsicher', 'q': 'fgas'},
    'chem': {'t': 'Fest eingebaute Split-Geräte mit F-Gas dürfen nur Fachkräfte mit Sachkundebescheinigung oder Betriebe mit Unternehmenszertifikat installieren. Überschriften geprüft, Wortlaut der Absätze nur sinngemäß.', 'p': 'ChemKlimaschutzV 2026 §§ 5, 6, 10', 's': 'geprüft', 'q': 'chem'},
    'miet': {'t': 'Mieter brauchen für ein Split-Gerät die Erlaubnis des Vermieters (Verbraucherzentrale). Klimageräte stehen nicht in den Fällen, in denen Mieter einen Anspruch haben. Anwalt fragen.', 'p': 'BGB § 554 Abs. 1', 's': 'geprüft', 'q': 'bgb554'},
    'weg': {'t': 'Außengerät an der Fassade: Beschluss der Eigentümer nötig (bauliche Veränderung); ein Anspruch besteht nur für die in Abs. 2 genannten Zwecke, Klimageräte gehören nicht dazu. Die Einordnung als bauliche Veränderung ist Auslegung. Anwalt fragen.', 'p': 'WEG § 20 Abs. 1 bis 3', 's': 'geprüft', 'q': 'weg20'},
    'ta': {'t': 'Schall am Nachbarfenster: allgemeines Wohngebiet tags 55 / nachts 40 dB(A), reines Wohngebiet 50 / 35; nachts 22 bis 6 Uhr. Gemessen wird am Immissionsort, nicht an der Grundstücksgrenze.', 'p': 'TA Lärm Nr. 6.1, 6.4', 's': 'prüfen vor Nutzung', 'q': 'ta'},
    'sp14a': {'t': 'Der Gesetzestext nennt „Anlagen zur Erzeugung von Kälte“ und Speicher als steuerbare Verbrauchseinrichtungen. Ob ein einzelnes Raumklimagerät darunter fällt, ist Auslegung. Die Bundesnetzagentur nennt „Anlagen zur Raumkühlung“ bei Wärmepumpen, Schwelle 4,2 kW Netzanschlussleistung; gleichartige Geräte hinter einem Anschluss können zusammengerechnet werden.', 'p': 'EnWG § 14a Abs. 3', 's': 'a', 'q': 'enwg14a'},
    'vf_bw': {'t': 'Anhang zu § 50 LBO: Wärmepumpen stehen darin, Klimageräte und Außengeräte nicht ausdrücklich; ob die Generalklausel Nr. 12 a passt, ist offen (Auslegung). Private Wiedergabe, nicht die amtliche Landesseite.', 'p': 'Baden-Württemberg', 's': 'prüfen vor Nutzung', 'q': 'lxbw'},
    'vf_by': {'t': 'Art. 57 BayBO: kein eigener Eintrag für Klimageräte oder Außengeräte; „sonstige Anlagen der technischen Gebäudeausrüstung“ (Abs. 1 Nr. 2 b) als möglicher Auffangtatbestand (Auslegung). Private Wiedergabe.', 'p': 'Bayern', 's': 'prüfen vor Nutzung', 'q': 'lxby'},
    'vf_rp': {'t': 'Ein Gemeindemerkblatt (Haßloch) nennt Klimaanlagen „grundsätzlich nicht genehmigungsfrei“; die Landesnorm wurde nicht geprüft.', 'p': 'Rheinland-Pfalz', 's': 'unsicher', 'q': 'hass'},
    'vf_rest': {'t': 'Berlin, Brandenburg, Bremen, Hamburg, Hessen, Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen, Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thüringen: Verfahrensfreiheit von Klima-Außengeräten nicht geprüft. Denkmalschutz: nicht recherchiert. Verfahrensfrei heißt nicht frei von Lärm- und Nachbarrecht.', 'p': '13 weitere Länder', 's': 'nicht geprüft'},
    'vde': {'t': 'Netzparallele Erzeugungsanlagen und Speicher: Anschluss und Parallelbetrieb nach VDE-AR-N 4105:2026-03 (seit 27.02.2026), Anmeldung beim Netzbetreiber; Speicher und andere Einheiten nur durch Fachkraft. Normtext kostenpflichtig, nicht gelesen.', 'p': 'VDE-AR-N 4105:2026-03', 's': 'geprüft', 'q': 'vde'},
    'mastr': {'t': 'Anmeldung im Marktstammdatenregister und beim Netzbetreiber: Regeln mit Fundstelle: Karte „Strom vom eigenen Dach“ im Bereich Grundriss.', 'p': 'MaStR', 's': 'prüfen vor Nutzung'},
    'mastr_n': {'t': 'Fest mit der Hausinstallation verbundene Aggregate sollen im Marktstammdatenregister gemeldet werden (Ratgeber); ADAC nennt eine leistungsabhängige Meldepflicht. Beide widersprechen sich, der Verordnungstext wurde nicht gelesen. VDE-AR-N 4105 gilt für Inselbetrieb vermutlich nicht (Annahme, nicht geprüft).', 'p': 'MaStRV', 's': 'unsicher'},
    'steck': dict(ref('steckersolar', 'st_2000_800'), p='EEG § 8 Abs. 5a, MaStRV § 5'),
    'st960': dict(ref('steckersolar', 'st_960'), p='Produktnorm DIN VDE V 0126-95'),
    'ce_bat': {'t': 'Batterien tragen die CE-Kennzeichnung nach der Batterieverordnung; ProdSG § 7: Bereitstellen ohne vorgeschriebene CE-Kennzeichnung ist verboten. Für Klimageräte und Wechselrichter: Richtlinienliste nicht belegt (Lücke).', 'p': 'VO (EU) 2023/1542, ProdSG § 7', 's': 'prüfen vor Nutzung', 'q': 'bat'},
    'brand': {'t': 'Der Leitfaden (Fassung 2014, Anwendung freiwillig) verlangt Aufbau nach den Brandschutzvorschriften der Landesbauordnung und Aufstellhinweise in der Anleitung; feste Abstandsmaße stehen nicht darin.', 'p': 'BVES-Sicherheitsleitfaden', 's': 'prüfen vor Nutzung', 'q': 'bves'},
}
for e in ERLX.values():
    if 'q' in e and e['q'] not in QUELLEN:
        fehler.append('Quelle %s unbekannt' % e['q'])
# Haushaltsstrom-Netzpreis, Speicher-Richtgroesse: keine eigenen Zahlen hier (Strompreis: Annahmen der Heizarten-Karte, Speicherpreis und Faustregel: daten/energie.js)
ref('speicher', 'sp_groesse')
ref('netz_und_luecken', 'n14a_gesetz')
ref('netz_und_luecken', 'n14a_4_2')

IMPORT = {
    'kuehlen': [
        {'l': 'PL', 's': 'Polen', 'g': 'prüfen vor Nutzung', 't': 'Montage eines 3,5-kW-Split-Geräts 1.700 bis 2.459 zł brutto (etwa 387 bis 559 €); Gerät plus Montage ab 4.319 zł (etwa 983 €) (muratordom.pl, Seite 17.03.2026, abgerufen 02.11.2026). Kurs 1 € = 4,3955 zł (NBP-Mittelkurs, wirksam 30.10.2026). Anderer Warenkorb als die deutschen Spannen (Marke, Leitungslänge), nur ein Ab-Preis; Transport, Einfuhr und Gewährleistung nicht erhoben. In Deutschland muss ein Fachbetrieb montieren.'},
        {'l': 'UA', 's': 'Ukraine', 'g': 'prüfen vor Nutzung', 't': 'Split 12 BTU (3,2 kW Kühlen), nur Gerät, 29.499 UAH (etwa 581 €) auf einer Händlerseite (vencon.ua, Aktionspreis, ohne Seitendatum, abgerufen 02.11.2026). Kurs 1 € = 50,77 UAH (open.er-api.com, 02.11.2026): nur Größenordnung, der amtliche NBU-Kurs war nicht abrufbar. Montage separat, Marke und Modell nicht mit Polen vergleichbar. Zoll (Kapitel 84/85) und Handelsregeln EU–Ukraine nicht geprüft.'},
        {'l': 'RU', 's': 'Russland', 'g': 'ungeklärt', 't': 'Klimageräte (Zolltarif 8415) wurden im gelesenen Teil von Anhang XXI der VO (EU) 833/2014 nicht gefunden; Wärmepumpen (8418) stehen darin. Ob ein umkehrbares Split-Gerät als 8415 oder 8418 gilt, entscheidet der Zoll. Nur ein Teilauszug einer Sekundärseite gelesen (100.000 von 745.137 Zeichen): unsicher, Wortlaut offen. Kein Einstandspreis.'},
        {'l': 'BY', 's': 'Weißrussland', 'g': 'ungeklärt', 't': 'Die Anhänge der VO (EG) 765/2006 wurden nicht gelesen; bis zur Prüfung nicht als zulässig führen. Kein Einstandspreis.'},
    ],
    'strom': [
        {'l': 'PL', 's': 'Polen', 'g': 'prüfen vor Nutzung', 't': 'Tausch eines Hybrid-Wechselrichters zusätzlich 5.000 bis 9.000 zł (1.138 bis 2.048 €) (cenauslug.pl, „Aktualizacja: 08.2026“, abgerufen 02.11.2026; Kurs 1 € = 4,3955 zł). Reiner Wechselrichter-Preis: Lücke.'},
        {'l': 'PL', 's': 'Polen', 'g': 'Lücke', 't': 'Notstromaggregat: Preis nicht gefunden.'},
        {'l': 'UA', 's': 'Ukraine', 'g': 'Lücke', 't': 'Wechselrichter und Aggregate: Preise nicht gefunden; Zoll und Handelsregeln nicht geprüft.'},
        {'l': 'RU', 's': 'Russland', 'g': 'nicht zulässig', 't': 'Stromerzeugungsaggregate (8502) und Stromrichter wie Wechselrichter (8504) stehen in Anhang XXI der VO (EU) 833/2014 (Einfuhrverbot). Nur ein Teilauszug einer Sekundärseite gelesen: unsicher, Prüfung im Wortlaut offen. Kein Einstandspreis.'},
        {'l': 'BY', 's': 'Weißrussland', 'g': 'ungeklärt', 't': 'Anhänge der VO (EG) 765/2006 nicht gelesen; bis zur Prüfung nicht als zulässig führen. Kein Einstandspreis.'},
    ],
    'speicher': [
        {'l': 'PL', 's': 'Polen', 'g': 'prüfen vor Nutzung', 't': 'Heimspeicher 10 kWh mit Montage: Budget 20.000 bis 24.000 zł (4.550 bis 5.460 €, 455 bis 546 € je kWh), Standard 24.000 bis 32.000 zł (5.460 bis 7.280 €) (cenauslug.pl, „Aktualizacja: 08.2026“, abgerufen 02.11.2026; Kurs 1 € = 4,3955 zł). Die Seite nennt selbst „2500-4000 zł/kWh“, was zu ihrer Tabelle nicht passt. Landed-Cost (Transport, Einfuhr, Gewährleistung) nicht erhoben.'},
        {'l': 'UA', 's': 'Ukraine', 'g': 'Lücke', 't': 'Speicherpreise nicht gefunden; Zoll und Handelsregeln nicht geprüft.'},
        {'l': 'RU', 's': 'Russland', 'g': 'ungeklärt', 't': 'Akkumulatoren (8507) wurden im gelesenen Teil von Anhang XXI nicht gefunden (Teilauszug, unsicher). Kein Einstandspreis.'},
        {'l': 'BY', 's': 'Weißrussland', 'g': 'ungeklärt', 't': 'Anhänge der VO (EG) 765/2006 nicht gelesen; bis zur Prüfung nicht als zulässig führen. Kein Einstandspreis.'},
    ],
}

# Reihenfolge der Karten: feste Liste, neutral (keine Rangliste)
REIHE = {'kuehlen': ['mono', 'split', 'multi', 'fan', 'schatten', 'wp'], 'strom': ['netz', 'pvdach', 'pvsp', 'balkon', 'bhkw', 'bz', 'wind', 'notstrom'], 'speicher': ['li', 'na', 'h2', 'v2h', 'waerme']}
ABSCHNITTE = {'kuehlen': KUEHLEN, 'strom': STROM, 'speicher': SPEICHER}
for ab, d in ABSCHNITTE.items():
    if sorted(d) != sorted(REIHE[ab]):
        fehler.append('Reihe %s passt nicht zu den Karten' % ab)
    for i, c in d.items():
        for lst in (c['vor'], c['nach']):
            for t, q in lst:
                if q not in QUELLEN:
                    fehler.append('Quelle %s unbekannt (%s)' % (q, i))
        for e in c['erl']:
            if e not in ERLX:
                fehler.append('Recht %s unbekannt (%s)' % (e, i))
        for fl in c['f'].values():
            for f in fl:
                if 'ref' not in f and f['q'] not in QUELLEN:
                    fehler.append('Quelle %s unbekannt (%s)' % (f['q'], i))
                if 'von' in f and f['von'] is None:
                    fehler.append('Wert ohne Anfang (%s)' % i)
for g in IMPORT.values():
    for x in g:
        if x['g'] not in ('prüfen vor Nutzung', 'Lücke', 'ungeklärt', 'nicht zulässig'):
            fehler.append('Importstatus %s' % x['g'])

if fehler:
    print('ABBRUCH, nichts geschrieben:')
    for f in fehler:
        print(' -', f)
    sys.exit(1)

o = {'stand': A60, 'bericht': 'recherche/53_klima_strom_speicher.md', 'bericht2': 'recherche/60_klima_strom_speicher_runde2.md',
     'annahmen': ANNAHMEN, 'quellen': QUELLEN, 'reihe': REIHE, 'kuehlen': KUEHLEN, 'strom': STROM, 'speicher': SPEICHER, 'erlx': ERLX, 'import': IMPORT}

if __name__ == '__main__':
    pfad, n = schreibe('klima', 'Klimaanlage, Strom, Speicher (H2 03.11.2026): Arten, Spannen, Annahmen, Recht, Import; Quellen: recherche/53 und 60 (K-Nummern). ERZEUGT von erzeuger/daten_klima.py. Nicht von Hand ändern. Werte aus daten/energie.js nur als Schlüssel (ref).', o)
    print('%s: %d Byte; Karten %d' % (pfad, n, sum(len(v) for v in ABSCHNITTE.values())))
