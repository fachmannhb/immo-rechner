# Erzeugt daten/preise_amtlich.js: amtliche Baulandpreise je Bundesland und Landeshauptstadt, dazu die Links zu den
# Gutachterausschüssen der Länder. Alle Werte stammen aus recherche/21_preise_laender.md (Tabellen 4a, 4b, "Links je Land"),
# nur Zeilen mit Status "geprüft". Aufruf: python -I -X utf8 erzeuger/preise_daten.py
#
# Bewusst NICHT enthalten (Bericht 21, Spalte Lizenz "Seite verlinken" = nur verlinken, keine Zahl kopieren):
# Eigentumswohnung und Haus (€/m²) je Land und Stadt, Portalpreise. Diese Werte haben keine freie Lizenz.
# Ebenfalls nicht enthalten (Status "prüfen vor Nutzung" oder nur Suchtreffer): Hannover ETW 6.700, München Angebotspreis,
# Schwerin ETW, Potsdam-Spannen, Magdeburg-Index.
import json
from pathlib import Path

basis = Path(__file__).resolve().parent.parent
geo = (basis / 'daten' / 'karte_geo.js').read_text(encoding='utf-8')
geo = json.loads(geo[geo.index('window.DATEN.karte = ') + 21:].rstrip().rstrip(';'))
kreisnamen = {k['ags']: k['name'] for k in geo['kreise']}

DL = 'https://www.govdata.de/dl-de/by-2-0'
QUELLEN = {
    'land': {
        'kurz': 'Destatis, GENESIS-Online, Tabelle 61511-0050',
        'text': 'Statistisches Bundesamt (Destatis), GENESIS-Online, Tabelle 61511-0050 „Kaufwerte für Bauland: Bundesländer“ (Tabellenstand 21.09.2026), '
                'Berichtsjahr 2025, Wohnbaufläche, baureifes Land, durchschnittlicher Kaufwert in €/m², Abruf 26.10.2026; '
                'Werte unverändert, in der Anzeige auf ganze Euro gerundet.',
        'url': 'https://genesis.destatis.de/datenbank/online/statistic/61511/table/61511-0050',
        'lizenz': 'dl-de/by-2-0', 'lizenzUrl': DL, 'abruf': '26.10.2026', 'jahr': 2025,
        'art': 'Wohnbaufläche, baureifes Land'
    },
    'stadt': {
        'kurz': 'Regionaldatenbank, Tabelle 61511-01-03-4',
        'text': 'Statistische Ämter des Bundes und der Länder, Regionaldatenbank Deutschland, Tabelle 61511-01-03-4 „Kaufwerte für Bauland, Kreise und kreisfreie Städte“, '
                'Berichtsjahr 2025, baureifes Land aller Bauflächen (nicht nur Wohnbau), durchschnittlicher Kaufwert in €/m², Abruf 26.10.2026; '
                'Werte unverändert, in der Anzeige auf ganze Euro gerundet.',
        'url': 'https://www.regionalstatistik.de/datenbank/online/statistic/61511/table/61511-01-03-4',
        'lizenz': 'dl-de/by-2-0', 'lizenzUrl': DL, 'abruf': '26.10.2026', 'jahr': 2025,
        'art': 'baureifes Land aller Bauflächen'
    }
}

# Land: (Kennziffer, Name, Wert Q1, Fälle, Hinweis, Gutachterausschuss-Link, Linktext, Linkstatus, Marktbericht-Link oder None)
OK = 'Seite am 26.10.2026 abgerufen (HTTP 200)'
PRUEFEN = 'prüfen vor Nutzung: per Skript nicht abrufbar (403 bzw. Abfrageschutz), Adresse aus der Länderliste des Arbeitskreises der Oberen Gutachterausschüsse'
LAENDER = [
    ('01', 'Schleswig-Holstein', 131.19, 593, '', 'https://www.schleswig-holstein.de/gaa/DE/gaa_node', 'Gutachterausschüsse Schleswig-Holstein', OK, None),
    ('02', 'Hamburg', 1089.10, 460, '', 'https://www.hamburg.de/politik-und-verwaltung/behoerden/behoerde-fuer-stadtentwicklung-und-wohnen/aemter-und-landesbetrieb/landesbetrieb-geoinformation-und-vermessung/produkte-und-dienstleistungen/infos-ueber-grundstuecke/gutachterausschuss-fuer-grundstueckswerte/immobilienmarktbericht-238656', 'Gutachterausschuss Hamburg, Immobilienmarktbericht', OK, 'https://dokumente.hamburg.de/resource/blob/1166868/3039802c93be48167a41165fd07eb17b/d-immobilienmarktbericht-2026-data.pdf'),
    ('03', 'Niedersachsen', 155.55, 4141, 'Der Landesbericht nennt für 2024 einen anderen Wert (129 €/m², Bauplatz für individuellen Wohnungsbau); die Abgrenzung ist eine andere.', 'https://www.gag.niedersachsen.de/', 'Gutachterausschüsse Niedersachsen', OK, 'https://www.gag.niedersachsen.de/startseite/gutachterausschusse/niedersachsischer-landesgrundstucksmarktbericht-2025-preise-in-den-einzelnen-marktsegmenten-entwickeln-sich-konstant-239013.html'),
    ('04', 'Bremen', 321.57, 72, '', 'https://www.gutachterausschuss.bremen.de/', 'Gutachterausschuss Bremen', OK, 'https://www.gutachterausschuss.bremen.de/sixcms/media.php/13/Auszug_Grundst%C3%BCcksmarktbericht%20Bremen%202026_gesichert.pdf'),
    ('05', 'Nordrhein-Westfalen', 313.85, 5279, '', 'https://www.boris.nrw.de/boris-nrw/', 'BORIS.NRW (Gutachterausschüsse, Grundstücksmarktbericht)', OK, None),
    ('06', 'Hessen', 309.37, 1168, '', 'https://hvbg.hessen.de/immobilienwertermittlung', 'Hessische Verwaltung für Bodenmanagement und Geoinformation', OK, None),
    ('07', 'Rheinland-Pfalz', 197.35, 2135, '', 'https://gutachterausschuesse.rlp.de/', 'Gutachterausschüsse Rheinland-Pfalz', OK, None),
    ('08', 'Baden-Württemberg', 340.58, 3096, '', 'https://www.zgg-bw.de/', 'Zentrale Geschäftsstelle der Gutachterausschüsse Baden-Württemberg', OK, None),
    ('09', 'Bayern', 423.61, 8674, '', 'https://www.gutachterausschuesse-bayern.de/', 'Gutachterausschüsse Bayern', OK, None),
    ('10', 'Saarland', 136.92, 388, '', 'http://www.saarland.de/gutachterausschuesse', 'Gutachterausschüsse Saarland', PRUEFEN, None),
    ('11', 'Berlin', 756.25, 142, 'Fläche und Summe sind vertraulich, nur das Mittel wird ausgewiesen.', 'https://www.berlin.de/gutachterausschuss/', 'Gutachterausschuss Berlin', OK, 'https://www.berlin.de/sen/stadt/presse/pressemeldungen/pressemitteilung.1699073.php'),
    ('12', 'Brandenburg', 220.70, 1405, 'Der Landesbericht nennt 219 €/m² (andere Abgrenzung, baureifes Grundstück).', 'https://gutachterausschuss.brandenburg.de/', 'Gutachterausschuss Brandenburg', OK, 'https://mik.brandenburg.de/mik/de/service/presse/pressemitteilungen/detail-pm-und-meldungen/~27-07-2026-bilanz-2025-grundstuecksmarkt-in-brandenburg-erholt-sich-weiter'),
    ('13', 'Mecklenburg-Vorpommern', 146.44, 789, 'Fläche und Summe sind vertraulich, nur das Mittel wird ausgewiesen.', 'https://www.laiv-mv.de/Geoinformation/Wertermittlung/', 'Landesamt für innere Verwaltung, Wertermittlung', OK, None),
    ('14', 'Sachsen', 167.83, 856, '', 'https://www.boris.sachsen.de/', 'BORIS Sachsen', OK, None),
    ('15', 'Sachsen-Anhalt', 92.31, 736, '', 'https://geodatenportal.sachsen-anhalt.de/gfds/de/gdp-adressen-gutachterausschuss.html', 'Gutachterausschüsse Sachsen-Anhalt', OK, None),
    ('16', 'Thüringen', 92.73, 508, '', 'https://tlbg.thueringen.de/wertermittlung/', 'Thüringer Landesamt für Bodenmanagement und Geoinformation', PRUEFEN, None),
]

# Stadt: (Kreisschlüssel der Karte, Name, Wert Q2 oder None, Fälle, Hinweis)
STAEDTE = [
    ('01002', 'Kiel', None, 1, 'Kein Wert: 2025 gab es nur einen Kauffall, der Wert ist aus Datenschutzgründen unterdrückt. Nächste Stelle ist der Gutachterausschuss des Landes.'),
    ('02000', 'Hamburg', 1082.69, 465, 'Stadtstaat; Landeswert und Stadtwert unterscheiden sich nur in der Abgrenzung.'),
    ('03241', 'Hannover (Stadt)', 639.15, 44, 'Wert der Stadt Hannover; die Karte zeigt die ganze Region Hannover (dort 294,71 €/m², 313 Fälle).'),
    ('04011', 'Bremen (Stadt)', 198.92, 74, 'Alle Bauflächen, nicht nur Wohnbau. Der Landeswert für Wohnbauland ist höher.'),
    ('05111', 'Düsseldorf', 1259.94, 31, ''),
    ('06414', 'Wiesbaden', 1126.38, 26, ''),
    ('07315', 'Mainz', 1338.06, 14, 'Sehr wenige Kauffälle; alle Baulandarten zusammen nur 857,03 €/m².'),
    ('08111', 'Stuttgart', 1154.35, 54, ''),
    ('09162', 'München', 3455.08, 373, ''),
    ('10041', 'Saarbrücken (Stadt)', 182.92, 13, 'Wert der Stadt Saarbrücken (sehr wenige Fälle); die Karte zeigt den ganzen Regionalverband (dort 149,69 €/m², 62 Fälle).'),
    ('11000', 'Berlin', 756.46, 143, 'Stadtstaat.'),
    ('12054', 'Potsdam', 791.63, 38, ''),
    # Bericht 21 ordnet 448,41 €/m² (47 Fälle) dem Schlüssel 13003 zu und nennt ihn Schwerin. 13003 ist aber Rostock (die Karte
    # führt 13003 als Rostock, Schwerin ist 13004). Darum kein Wert für Schwerin, bis der Schlüssel 13004 gelesen ist.
    ('13004', 'Schwerin', None, None, 'Kein Wert: Für Schwerin liegt noch keine geprüfte Zahl vor (der Bericht hat den Wert des Schlüssels 13003 versehentlich Schwerin zugeordnet, er gehört zu Rostock).'),
    ('14612', 'Dresden', 479.44, 84, ''),
    ('15003', 'Magdeburg', 207.47, 69, ''),
    ('16051', 'Erfurt', 300.52, 21, 'Wenige Kauffälle.'),
]

fehler = [(a, n) for a, n, *_ in STAEDTE if a not in kreisnamen]
print('Städte ohne Kreis in der Karte:', fehler)
print('Zuordnung:', [(n, kreisnamen[a]) for a, n, *_ in STAEDTE if a in kreisnamen])

laender = {}
for code, name, wert, faelle, hinweis, ga, gatext, status, bericht in LAENDER:
    laender[code] = {
        'name': name, 'bau': {'wert': wert, 'faelle': faelle, 'wenig': faelle < 100, 'jahr': 2025, 'art': QUELLEN['land']['art'], 'quelle': 'land', 'hinweis': hinweis},
        'ga': ga, 'gaText': gatext, 'gaStatus': status, 'bericht': bericht
    }
staedte = {}
for ags, name, wert, faelle, hinweis in STAEDTE:
    staedte[ags] = {'name': name, 'land': ags[:2], 'bau': {'wert': wert, 'faelle': faelle, 'wenig': faelle is not None and faelle < 50, 'jahr': 2025, 'art': QUELLEN['stadt']['art'], 'quelle': 'stadt', 'hinweis': hinweis}}

daten = {
    'stand': '26.10.2026',
    'quellen': QUELLEN,
    'laender': laender,
    'staedte': staedte,
    'keinWert': 'Kein frei verwendbarer amtlicher Wert für Eigentumswohnungen und Häuser (die Marktberichte sind urheberrechtlich geschützt). Die Berichte finden Sie über den Link des Landes.',
    'portalLink': {'text': 'Aktuelle Angebotspreise bei McMakler (externe Seite)', 'url': 'https://www.mcmakler.de/immobilienpreise'}
}
js = ('/* Amtliche Baulandpreise je Bundesland (Destatis) und Landeshauptstadt (Regionaldatenbank), dazu Links zu den Gutachterausschüssen.\n'
      '   Erzeugt von erzeuger/preise_daten.py aus recherche/21_preise_laender.md (nur Status "geprüft"), nicht von Hand bearbeiten.\n'
      '   Lizenz der Zahlen: Datenlizenz Deutschland Namensnennung 2.0 (dl-de/by-2-0), siehe quellen. */\n'
      'window.DATEN = window.DATEN || {};\nwindow.DATEN.preise = ') + json.dumps(daten, ensure_ascii=False, separators=(',', ':')) + ';\n'
(basis / 'daten' / 'preise_amtlich.js').write_text(js, encoding='utf-8')
print('Länder', len(laender), 'Städte', len(staedte), 'mit Wert', sum(1 for s in staedte.values() if s['bau']['wert'] is not None), 'Datei', round(len(js.encode('utf-8')) / 1024, 1), 'KB')
