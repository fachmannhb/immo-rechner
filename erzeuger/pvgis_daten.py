"""Holt relative Ertragswerte (E_y, kWh je kWp und Jahr) von PVGIS fuer die 16 Landeshauptstaedte und schreibt daten/pvgis.js.
Aufruf (im Ordner werkzeuge):  python -I -X utf8 erzeuger/pvgis_daten.py
Quelle: PVGIS (Gemeinsame Forschungsstelle der EU-Kommission), Schnittstelle PVcalc v5_2, kristallines Silizium,
1 kWp, Systemverluste 14 %, feste Aufstaenderung. Hoechstens 2 Abrufe je Sekunde (erlaubt sind 30), bei Fehlern bis zu 5 Versuche.
Zwischenstand in tmp/pvgis_cache.json: ein abgebrochener Lauf macht dort weiter.
Azimut-Konvention von PVGIS: 0 = Sued, 90 = West, -90 = Ost, -180 = Nord. Neigung 0 = waagerecht (Himmelsrichtung
ohne Bedeutung, daher ein Abruf je Stadt, der fuer alle Richtungen gilt)."""
import datetime, json, os, sys, time, urllib.request

BASIS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(BASIS, 'tmp', 'pvgis_cache.json')
ZIEL = os.path.join(BASIS, 'daten', 'pvgis.js')
API = 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc'
ASPEKTE = list(range(-180, 151, 30))      # 12 Werte
NEIGUNGEN = list(range(0, 61, 10))        # 7 Werte
# Landeshauptstaedte: Stadtmitte, auf 0,001 Grad gerundet (Wikipedia/OpenStreetMap-Koordinaten; Bremen vom Hauptfenster gegen PVGIS geprueft)
STAEDTE = [
    ('Stuttgart', 'Baden-Württemberg', 48.775, 9.182), ('München', 'Bayern', 48.137, 11.575),
    ('Berlin', 'Berlin', 52.520, 13.405), ('Potsdam', 'Brandenburg', 52.391, 13.065),
    ('Bremen', 'Bremen', 53.079, 8.802), ('Hamburg', 'Hamburg', 53.551, 9.994),
    ('Wiesbaden', 'Hessen', 50.083, 8.240), ('Schwerin', 'Mecklenburg-Vorpommern', 53.629, 11.413),
    ('Hannover', 'Niedersachsen', 52.375, 9.732), ('Düsseldorf', 'Nordrhein-Westfalen', 51.227, 6.774),
    ('Mainz', 'Rheinland-Pfalz', 50.000, 8.271), ('Saarbrücken', 'Saarland', 49.240, 6.997),
    ('Dresden', 'Sachsen', 51.050, 13.738), ('Magdeburg', 'Sachsen-Anhalt', 52.131, 11.639),
    ('Kiel', 'Schleswig-Holstein', 54.323, 10.123), ('Erfurt', 'Thüringen', 50.978, 11.029),
]


def abruf(lat, lon, neigung, aspekt):
    url = f'{API}?lat={lat}&lon={lon}&peakpower=1&loss=14&angle={neigung}&aspect={aspekt}&outputformat=json'
    for versuch in range(5):
        try:
            with urllib.request.urlopen(url, timeout=40) as r:
                d = json.load(r)
            return d['outputs']['totals']['fixed']['E_y'], d['inputs']['location']['elevation'], d['inputs']['meteo_data']
        except Exception as e:
            print('  Fehler', type(e).__name__, str(e)[:80], 'Versuch', versuch + 1, flush=True)
            time.sleep(2 * (versuch + 1))
    raise SystemExit(f'Abruf gescheitert: {url}')


def main():
    cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
    meteo = cache.get('_meteo')
    for name, land, lat, lon in STAEDTE:
        c = cache.setdefault(name, {'werte': {}})
        for neigung in NEIGUNGEN:
            for aspekt in (ASPEKTE if neigung else [0]):
                k = f'{aspekt}|{neigung}'
                if k in c['werte']:
                    continue
                ey, hoehe, m = abruf(lat, lon, neigung, aspekt)
                c['werte'][k] = ey
                c['hoehe'] = hoehe
                meteo = meteo or {'strahlung': m.get('radiation_db'), 'wetter': m.get('meteo_db'), 'von': m.get('year_min'), 'bis': m.get('year_max')}
                cache['_meteo'] = meteo
                time.sleep(0.5)
            json.dump(cache, open(CACHE, 'w', encoding='utf-8'))
        print(name, 'fertig,', len(c['werte']), 'Werte', flush=True)
    heute = datetime.date.today().isoformat()
    staedte = []
    for name, land, lat, lon in STAEDTE:
        w = cache[name]['werte']
        zeilen = []  # je Neigung eine Zeile mit 12 Werten in Reihenfolge der Aspekte
        for neigung in NEIGUNGEN:
            zeilen.append([w['0|0'] if neigung == 0 else w[f'{a}|{neigung}'] for a in ASPEKTE])
        staedte.append({'name': name, 'land': land, 'lat': lat, 'lon': lon, 'hoehe': cache[name]['hoehe'], 'ey': zeilen})
    daten = {
        'quelle': 'PVGIS (Gemeinsame Forschungsstelle der Europäischen Kommission), Schnittstelle PVcalc v5_2',
        'url': 'https://re.jrc.ec.europa.eu/pvg_tools/en/',
        'abruf': heute, 'version': 'API 5.2',
        'zuordnung': 'Anlage: 1 kWp kristallines Silizium, feste Aufständerung, Systemverluste 14 %; E_y = Jahresertrag in kWh je kWp',
        'meteo': meteo,
        'urheber': 'PVGIS © European Union, 2001-2026',
        'urheberHinweis': 'Wortlaut wie in der Ausgabe der PVGIS-Schnittstelle (csv, letzte Zeile "PVGIS (c) European Union, 2001-2026"), Abruf ' + heute + '.',
        'aspekte': ASPEKTE, 'neigungen': NEIGUNGEN,
        'azimutRegel': '0 = Süd, 90 = West, -90 = Ost, ±180 = Nord',
        'staedte': staedte,
    }
    text = ('/* Relativer Solarertrag nach Dachrichtung und Neigung, erzeugt von erzeuger/pvgis_daten.py (nicht von Hand ändern).\n'
            '   Quelle und Abrufdatum stehen in den Feldern quelle, abruf, urheber. Wird von der 3D-Ansicht (Dachfarben) und später\n'
            '   von der Amortisationsrechnung gelesen. ey[neigungIndex][aspektIndex] = kWh je kWp und Jahr. */\n'
            'window.DATEN = window.DATEN || {};\n'
            'window.DATEN.pvgis = ' + json.dumps(daten, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(ZIEL, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print('geschrieben', ZIEL, len(text) // 1024, 'KB')


if __name__ == '__main__':
    main()
