# Bericht 42 (Sauna SA, Gewaechshaus GW, Kleinwind im Wohngebiet KW) fuer daten/verfahrensfrei.js, aufgerufen von verfahrensfrei_daten.py (nicht von Hand aendern).
# Die Werte stehen hier einmal, tmp/e1c_daten_test.py liest sie getrennt aus recherche/42_sauna_gewaechshaus_kleinwind.md zurueck und vergleicht.
# Status-Regel des Auftrags e1c: amtlich gelesen = geprueft; lxgesetze, gesetze.co, Synopse, nichtamtliche Lesefassung, Bericht-35-Uebernahme ohne amtliche Seite = pruefen vor Nutzung;
# jede Zeile, die nur ueber die allgemeine Gebaeude-Nummer laeuft (Auslegung), ebenfalls "pruefen vor Nutzung".
import collections

AMTLICH = {'BY', 'BE', 'BB', 'HB', 'HE', 'NW', 'SL', 'SN', 'ST', 'SH', 'TH'}   # amtlicher Text am 31.10.2026 gelesen (HH: nichtamtliche Lesefassung; BW, NI, RP, MV: Sekundaer-/nichtamtliche Quelle)
ABRUF = '2026-10-31'
ABRUF_MV = '2026-10-27'

QUELLEN_42 = collections.OrderedDict([
    ('BY-42', ('BayBO Art. 57, gültig ab 01.05.2026', 'https://www.gesetze-bayern.de/Content/Document/BayBO-57')),
    ('BW-42', ('LBO BW Anhang 1 (lxgesetze.de)', 'https://lxgesetze.de/lbo/AN-1')),
    ('BE-42', ('BauO Bln § 61, ab 23.07.2026', 'https://gesetze.berlin.de/perma?j=BauO_BE_!_61')),
    ('BB-42', ('BbgBO § 61, Änderung 29.06.2026', 'https://bravors.brandenburg.de/gesetze/bbgbo_2016')),
    ('HH-42', ('HBauO 2025, Lesefassung 25.09.2025', 'https://www.hamburg.de/resource/blob/1120174/a1f3778eb712e7a95605fbc6872df915/hamburgische-bauordnung-hbauo-2025-nichtamtliche-lesefassung-data.pdf')),
    ('HE-42', ('HBO, Broschüre Oktober 2025', 'https://wirtschaft.hessen.de/sites/wirtschaft.hessen.de/files/2025-11/hbo_broschuere_stand_oktober_2025-baupaket_i_2.pdf')),
    ('NI-42', ('NBauO Anhang zu § 60 (gesetze.co)', 'https://gesetze.co/NI/NBauO/Anhang')),
    ('NW-42', ('BauO NRW 2018, Fassung 01.09.2026', 'https://recht.nrw.de/system/files/pdf/state-law-and-regulations/2026/08/02/4c959a/01-09-2026-bauo-nrw-2018-landesbauordnung-2018.pdf')),
    ('RP-42', ('LBauO RLP, Synopse Nov. 2025', 'https://mkbwk.rlp.de/fileadmin/07/Bilder/Themen/Baurecht_und_Bautechnik/Bauvorschriften/Bauordnungsrecht/Synopse_mit_unterschiedlichen_Inkrafttretenszeitpunkten_2.0.pdf')),
    ('SL-42', ('LBO Saarland § 61', 'https://recht.saarland.de/perma?j=BauO_SL_!_61')),
    ('SN-42', ('SächsBO § 61', 'https://www.revosax.sachsen.de/vorschrift/1779-SaechsBO')),
    ('ST-42', ('BauO LSA § 60', 'https://www.landesrecht.sachsen-anhalt.de/perma?j=BauO_ST_!_60')),
    ('SH-42', ('LBO Schleswig-Holstein § 61', 'https://www.gesetze-rechtsprechung.sh.juris.de/perma?j=BauO_SH_!_61')),
    ('TH-42', ('ThürBO § 63', 'https://landesrecht.thueringen.de/perma?j=BauO_TH_!_63')),
    ('MBO-42', ('MBO § 2 Abs. 2 (Gebäude), Fassung 2020', 'https://bauministerkonferenz.de/Dokumente/42323530.pdf')),
])
# Dieselbe Adresse wie eine schon vorhandene Quelle: diese wiederverwenden (spart Platz in der Seite); nur BE und SH haben in Bericht 42 eine andere Adresse. Nicht benutzte -42-Quellen fallen beim Erzeugen weg.
QUELLE_VON = {'MV': 'MV-35', 'HB': 'HB-41', 'BY': 'BY-34', 'BW': 'BW-35', 'BB': 'BB-35', 'HH': 'HH-35', 'HE': 'HE-35', 'NI': 'NI-35', 'NW': 'Q-NW26', 'RP': 'Q-RP25', 'SL': 'Q-SL', 'SN': 'Q-SN', 'ST': 'Q-ST', 'TH': 'Q-TH'}

SAUNA_WORTLAUT = {
    'BY': 'Gebäude mit einem Brutto-Rauminhalt bis zu 75 m3, außer im Außenbereich, sowie Gebäude ohne Aufenthaltsräume, Toiletten oder Feuerstätten, wenn die Gebäude weder Verkaufs- noch Ausstellungszwecken dienen, im Außenbereich bis 20 m3 Brutto-Rauminhalt,',
    'BW': 'Gebäude ohne Aufenthaltsräume, Toiletten oder Feuerstätten, wenn die Gebäude weder Verkaufs- noch Ausstellungszwecken dienen, im Innenbereich bis 40 m³, im Außenbereich bis 20 m³ Brutto-Rauminhalt;',
    'BE': 'eingeschossige Gebäude mit einer Brutto-Grundfläche bis zu 10 m², außer im Außenbereich, sowie untergeordnete Gebäude wie Kioske, Verkaufswagen und Toiletten auf öffentlichen Verkehrsflächen und in öffentlichen Grün- und Erholungsanlagen,',
    'BB': 'Gebäude ohne Aufenthaltsräume, Toiletten oder Feuerstätten mit nicht mehr als 75 Kubikmeter Brutto-Rauminhalt, die nicht im Außenbereich liegen; dies gilt nicht für Garagen, Ställe sowie Gebäude, die Verkaufs- oder Ausstellungszwecken dienen,',
    'HB': 'eingeschossige, auch gewerblich genutzte Gebäude mit einer Brutto-grundfläche bis zu 10 Quadratmeter, Gartengerätehäuser bis 12 Quadratmeter Brutto-Grundfläche, außer im Außenbereich,',
    'HH': 'ein eingeschossiges Gebäude ohne Aufenthaltsräume bis 30 m³ Brutto-Rauminhalt je zugehörigem Hauptgebäude, außer im Außenbereich,',
    'HH10g': 'g) Saunaanlagen, die nicht gewerblichen oder öffentlichen Zwecken dienen; (Anlage I Nr. 10, „folgende Anlagen in Gärten und zur Freizeitgestaltung“)',
    'HE': 'Gebäude ohne Aufenthaltsräume, Toiletten oder Feuerstätten, wenn die Gebäude nicht mehr als 30 m³ Brutto-Rauminhalt haben und weder Verkaufs- noch Ausstellungszwecken dienen,',
    'NI': 'Gebäude und Vorbauten ohne Aufenthaltsräume, Toiletten und Feuerstätten, wenn die Gebäude und Vorbauten nicht mehr als 75 m3 - im Außenbereich nicht mehr als 40 m3 - Brutto-Rauminhalt haben und weder Verkaufs- noch Ausstellungszwecken noch dem Abstellen von Kraftfahrzeugen dienen,',
    'NW': 'Gebäude bis zu 75 m³ Brutto-Rauminhalt ohne Aufenthaltsräume, Ställe, Toiletten oder Feuerstätten, im Außenbereich nur, wenn sie einem land- oder forstwirtschaftlichen Betrieb [...] und weder Verkaufs- noch Ausstellungszwecken dienen,',
    'RP': 'Gebäude bis zu 50 m³, im Außenbereich bis zu 10 m³ umbauten Raums ohne Aufenthaltsräume, Toiletten oder Feuerstätten; ausgenommen sind Kulturdenkmäler und Gebäude in der Umgebung von Kultur- und Naturdenkmälern sowie Garagen, Verkaufs- und Ausstellungsstände,',
    'SL': 'eingeschossige Gebäude bis zu 75 m3 Brutto-Rauminhalt, außer im Außenbereich,',
    'SN': 'Gebäude mit einem Brutto-Rauminhalt von bis zu 75 m³ und von bis zu 80 m³ für Ladestationen, die der Elektromobilität des öffentlichen Nahverkehrs dienen, außer im Außenbereich,',
    'ST': 'eingeschossige Gebäude mit einer Grundfläche bis zu 10 m2, außer im Außenbereich, auch soweit sie nachfolgend von der Genehmigungsfreiheit ausgenommen sind,',
    'SH': 'Gebäude ohne Aufenthaltsräume, ohne Toiletten und ohne Feuerstätten mit Ausnahme von Garagen, Verkaufs- und Ausstellungsständen mit einem Brutto-Rauminhalt bis zu 30 m3, im Außenbereich bis zu 10 m3,',
    'TH': 'eingeschossige Gebäude mit einer Grundfläche bis zu 30 m2, außer im Außenbereich,',
    'MV': 'Gebäude und Gebäudeteile ohne Aufenthaltsräume und Feuerstätten mit einer mittleren Wandhöhe bis zu 3 m und einer Brutto-Grundfläche bis zu 40 m², außer im Außenbereich,',
}
GW_WORTLAUT = {
    'BW': 'Gewächshäuser bis zu 5 m Höhe, im Außenbereich nur landwirtschaftliche Gewächshäuser,',
    'BB': 'Gewächshäuser mit nicht mehr als 50 Kubikmeter Brutto-Rauminhalt, ausgenommen im Außenbereich,',
}


def sa(land, nr, wert, einheit, bed, para, ab=None, feuer=False, alt=False, ausl='sauna', wortlaut=None, bauwerk='Sauna (Gebäude)', art='grenze'):
    return dict(id='SA-' + land + nr, land=land, bauwerk=bauwerk, art=art, wert=wert, einheit=einheit, ab=ab, feuer=feuer, alt=alt, ausl=ausl, bed=bed, para=para,
                wortlaut=wortlaut or SAUNA_WORTLAUT.get(land), roh=None)


SAUNA = [
    sa('BW', '', 40, 'm³', 'ohne Aufenthaltsräume, Toiletten, Feuerstätten', 'Anhang 1 Nr. 1a', ab=20, feuer=True),
    sa('BY', '', 75, 'm³', 'außer Außenbereich; dort ohne Feuerstätten, bis 20 m³', 'Art. 57 Abs. 1 Nr. 1a', ab=20),
    sa('BE', '', 10, 'm²', 'Brutto-Grundfläche, eingeschossig, außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    sa('BB', '', 75, 'm³', 'ohne Aufenthaltsräume, Feuerstätten; nicht im Außenbereich', '§ 61 Abs. 2 Nr. 1a', feuer=True),
    sa('HB', '', 10, 'm²', 'Brutto-Grundfläche, eingeschossig, außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    sa('HH', '', None, None, 'Saunaanlage, nicht gewerblich oder öffentlich', 'Anlage I Nr. 10g', alt=True, ausl=None,
       wortlaut=SAUNA_WORTLAUT['HH10g'], art='ohne_grenze', bauwerk='Saunaanlage (privat)'),
    sa('HH', '2', 30, 'm³', 'Ersatz: Gebäude ohne Aufenthaltsräume, je Hauptgebäude', 'Anlage I Nr. 1a', alt=True, bauwerk='Sauna als Gebäude (Rückfall)'),
    sa('HE', '', 30, 'm³', 'ohne Aufenthaltsräume, Toiletten, Feuerstätten', 'Anlage zu § 63 Nr. 1.1', feuer=True),
    sa('MV', '1', 10, 'm²', 'Brutto-Grundfläche, eingeschossig, außer Außenbereich', '§ 61 Abs. 1 Nr. 1a', alt=True, bauwerk='Sauna (Gebäude, kleine Nummer)',
       wortlaut='Wortlaut der kleinen Nummer nicht neu gelesen (Bericht 35, MV-V01)'),
    sa('MV', '2', 40, 'm²', 'Wandhöhe bis 3 m, ohne Aufenthaltsräume, Feuerstätten', '§ 61 Abs. 1 Nr. 1b', feuer=True, alt=True, bauwerk='Sauna (Gebäude, große Nummer)'),
    sa('NI', '', 75, 'm³', 'ohne Aufenthaltsräume, Toiletten, Feuerstätten', 'Anhang zu § 60 Nr. 1.1', ab=40, feuer=True),
    sa('NW', '', 75, 'm³', 'ohne Aufenthaltsräume, Ställe, Toiletten, Feuerstätten', '§ 62 Abs. 1 Nr. 1a', feuer=True),
    sa('RP', '', 50, 'm³', 'ohne Aufenthaltsräume, Toiletten, Feuerstätten', '§ 62 Abs. 1 Nr. 1a', ab=10, feuer=True),
    sa('SL', '', 75, 'm³', 'eingeschossig, außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    sa('SN', '', 75, 'm³', 'außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    sa('ST', '', 10, 'm²', 'Grundfläche, eingeschossig, außer Außenbereich', '§ 60 Abs. 1 Nr. 1a'),
    sa('SH', '', 30, 'm³', 'ohne Aufenthaltsräume, Toiletten, Feuerstätten', '§ 61 Abs. 1 Nr. 1a', ab=10, feuer=True),
    sa('TH', '', 30, 'm²', 'Grundfläche, eingeschossig, außer Außenbereich', '§ 63 Abs. 1 Nr. 1a'),
]


def gw(land, nr, wert, einheit, bed, para, ab=None, ausl='gewaechshaus', alt=False, wortlaut=None):
    return dict(id='GW-' + land + nr, land=land, bauwerk='Gewächshaus (privat)', art='grenze', wert=wert, einheit=einheit, ab=ab, feuer=False, alt=alt, ausl=ausl, bed=bed, para=para,
                wortlaut=wortlaut or GW_WORTLAUT.get(land) or SAUNA_WORTLAUT.get(land), roh=None, privat=True)


GEWAECHSHAUS = [
    gw('BW', '', 5, 'm', 'Innenbereich auch privat; Außenbereich nur landwirtschaftlich', 'Anhang 1 Nr. 1d', ausl=None),
    gw('BB', '', 50, 'm³', 'auch privat; nicht im Außenbereich', '§ 61 Abs. 2 Nr. 1f', ausl=None),
    gw('BY', '', 75, 'm³', 'Außenbereich nur ohne Feuerstätte', 'Art. 57 Abs. 1 Nr. 1a', ab=20),
    gw('BE', '', 10, 'm²', 'eingeschossig, außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    gw('HB', '', 10, 'm²', 'außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    gw('HH', '', 30, 'm³', 'eingeschossig, je Hauptgebäude, außer Außenbereich', 'Anlage I Nr. 1a'),
    gw('HE', '', 30, 'm³', 'unbeheizt (ohne Feuerstätten)', 'Anlage zu § 63 Nr. 1.1'),
    gw('MV', '1', 10, 'm²', 'außer Außenbereich', '§ 61 Abs. 1 Nr. 1a', alt=True),
    gw('MV', '2', 40, 'm²', 'ohne Feuerstätten, außer Außenbereich', '§ 61 Abs. 1 Nr. 1b', alt=True),
    gw('NI', '', 75, 'm³', 'ohne Feuerstätten', 'Anhang zu § 60 Nr. 1.1', ab=40),
    gw('NW', '', 75, 'm³', 'ohne Feuerstätten', '§ 62 Abs. 1 Nr. 1a'),
    gw('RP', '', 50, 'm³', 'ohne Feuerstätten', '§ 62 Abs. 1 Nr. 1a', ab=10),
    gw('SL', '', 75, 'm³', 'eingeschossig, außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    gw('SN', '', 75, 'm³', 'außer Außenbereich', '§ 61 Abs. 1 Nr. 1a'),
    gw('ST', '', 10, 'm²', 'Grundfläche, eingeschossig', '§ 60 Abs. 1 Nr. 1a'),
    gw('SH', '', 30, 'm³', 'ohne Feuerstätten', '§ 61 Abs. 1 Nr. 1a', ab=10),
    gw('TH', '', 30, 'm²', 'Grundfläche, eingeschossig', '§ 63 Abs. 1 Nr. 1a'),
]

# Kleinwind: (Land, Hoehe, Gewerbe-Hoehe, Rotor, Aussenbereich-Hoehe, Gebiet wr, wa, gw, Bedingung, Paragraf, alte Id)
# Gebiet: frei = laut Text nicht ausgeschlossen; aus = Text schliesst das Gebiet aus; nicht = Gebiet steht nicht in der Liste der erlaubten Gebiete; gew = nur Gewerbe/Industrie gelistet, Aussenbereich nicht
KLEINWIND_ZEILEN = [
    ('BW', 10, None, None, None, 'frei', 'frei', 'frei', 'kein Gebietsausschluss', 'Anhang 1 Nr. 3d', 'BW-V09'),
    ('BY', 15, None, None, None, 'frei', 'frei', 'frei', 'freie Höhe; kein Gebietsausschluss', 'Art. 57 Abs. 1 Nr. 3b', 'BY-G04'),
    ('BE', 10, None, 3, None, 'aus', 'frei', 'frei', 'außer reine Wohngebiete', '§ 61 Abs. 1 Nr. 3c', 'BE-V07'),
    ('BB', 10, None, 3, None, 'aus', 'frei', 'frei', 'außer reine Wohngebiete', '§ 61 Abs. 2 Nr. 3', 'BB-V10'),
    ('HB', 10, None, 3, None, 'nicht', 'nicht', 'frei', 'nur Gewerbe/Industrie, privilegiert im Außenbereich', '§ 61 Abs. 1 Nr. 3c', 'HB-V08'),
    ('HH', 10, 15, 3, None, 'aus', 'frei', 'frei', 'außer reine Wohngebiete; 15 m nur Gewerbe/Industrie, Hafen', 'Anlage I Nr. 3c', 'HH-V06'),
    ('HE', 10, None, 3, None, 'aus', 'frei', 'frei', 'außer reine Wohngebiete', 'Anlage zu § 63 Nr. 3.13', 'HE-V09'),
    ('MV', 10, None, 3, None, 'aus', 'aus', 'frei', 'außer reine, allgemeine, besondere Wohn-, Mischgebiete', '§ 61 Abs. 1 Nr. 3d', 'MV-V07'),
    ('NI', 10, 15, 3, None, 'aus', 'aus', 'frei', 'außer reine, allgemeine Wohngebiete, nahe Denkmalen', 'Anhang Nr. 2.5b', 'NI-V07'),
    ('NW', 10, None, None, None, 'aus', 'aus', 'frei', 'außer reine, allgemeine, besondere Wohn-, Mischgebiete', '§ 62 Abs. 1 Nr. 3c', 'NW-V08'),
    ('RP', 10, None, None, None, 'nicht', 'nicht', 'frei', 'nur Gewerbe/Industrie, privilegierter Außenbereich; Dach 2 m', '§ 62 Abs. 1 Nr. 4g', 'RP-V08'),
    ('SL', 15, None, None, 20, 'frei', 'frei', 'frei', 'über 10 m mit Standsicherheitsnachweis', '§ 61 Abs. 1 Nr. 3c', 'SL-V08'),
    ('SN', 10, None, 3, None, 'aus', 'frei', 'frei', 'außer reine Wohngebiete', '§ 61 Abs. 1 Nr. 3c', 'SN-V08'),
    ('ST', 10, None, 3, None, 'nicht', 'nicht', 'gew', 'nur Gewerbe- und Industriegebiete', '§ 60 Abs. 1 Nr. 3d', 'ST-V08'),
    ('SH', 15, None, None, None, 'nicht', 'nicht', 'frei', 'nur Kleinsiedlungs-, Kern-, Gewerbe-, Industriegebiet, Außenbereich', '§ 61 Abs. 1 Nr. 3c', 'SH-V08'),
    ('TH', 10, None, 3, None, 'aus', 'frei', 'frei', 'außer reine Wohngebiete, geschützte Teile von Natur/Landschaft', '§ 63 Abs. 1 Nr. 3d', 'TH-V08'),
]


def status_von(land, ausl, extra_pruefen=False):
    if ausl or extra_pruefen or land not in AMTLICH:
        return 'prüfen vor Nutzung'
    return 'geprüft'


def eintrag(d, quellen_alt=None):
    e = collections.OrderedDict()
    e['id'] = d['id']
    e['bauwerk'] = d['bauwerk']
    e['art'] = d['art']
    e['wert'] = d['wert']
    e['einheit'] = d['einheit']
    e['wert_roh'] = ('ohne Größengrenze' if d['art'] == 'ohne_grenze' else '%s %s' % (str(d['wert']).replace('.', ','), d['einheit']))
    e['einheit_roh'] = d['einheit']
    e['bedingung'] = d['bed']
    if d.get('ab') is not None:
        e['ausserbereich_wert'] = d['ab']
    e['paragraf'] = d['para']
    e['wortlaut'] = d.get('wortlaut')
    land = d['land']
    e['quelle'] = [QUELLE_VON.get(land, land + '-42')]
    e['abruf'] = ABRUF_MV if land == 'MV' else ABRUF
    # Status: Auslegung oder nichtamtliche Quelle = pruefen; HH-Saunaanlage (ausdruecklich, aber nichtamtliche Lesefassung) ebenfalls (HH nicht in AMTLICH)
    e['status'] = status_von(land, d.get('ausl'))
    if d.get('ausl'):
        e['auslegung'] = d['ausl']
    if d.get('feuer'):
        e['feuer_aus'] = True
    if d.get('alt'):
        e['alt'] = True
    if d.get('privat'):
        e['privat'] = True
    return e


def kleinwind_eintrag(z, alte):
    land, h, hgew, rotor, ab, wr, wa, gw_, bed, para, alt_id = z
    e = collections.OrderedDict()
    e['id'] = 'KW-' + land
    e['bauwerk'] = 'Windenergieanlage' if land not in ('BY', 'NW', 'RP', 'SL', 'ST', 'SH', 'TH') else 'Kleinwindanlage'
    e['art'] = 'grenze'
    e['wert'] = h
    e['einheit'] = 'm'
    e['wert_roh'] = '%d m' % h + (', Rotor %d m' % rotor if rotor else '')
    e['einheit_roh'] = 'm'
    e['bedingung'] = bed
    if ab is not None:
        e['ausserbereich_wert'] = ab
    e['paragraf'] = para
    e['wortlaut'] = alte.get('wortlaut')   # Wortlaut der ersetzten Zeile aus Bericht 34/35/36 bleibt erhalten
    e['quelle'] = [QUELLE_VON.get(land, land + '-42')]
    e['abruf'] = ABRUF_MV if land == 'MV' else ABRUF
    e['status'] = status_von(land, None)
    e['gebiet'] = collections.OrderedDict([('wr', wr), ('wa', wa), ('gw', gw_)])
    if hgew:
        e['gw_wert'] = hgew
    if rotor:
        e['rotor_max'] = rotor
    return e


def uebernehmen(daten, QUELLEN):
    """Ersetzt/ergaenzt die Eintraege in daten[land][baustein]; jede Ersetzung muss genau eine Stelle treffen, sonst Abbruch."""
    for k, (titel, url) in QUELLEN_42.items():
        QUELLEN[k] = {'titel': titel, 'url': url}
    if 'MV-35' not in QUELLEN or 'HB-41' not in QUELLEN:
        raise SystemExit('FEHLER: Quelle MV-35 oder HB-41 fehlt')
    ersetzt = []

    def ersetze(land, baustein, alt_id):
        liste = daten[land].get(baustein, [])
        stellen = [i for i, x in enumerate(liste) if x.get('id') == alt_id]
        if len(stellen) != 1:
            raise SystemExit('FEHLER: %s nicht genau einmal in %s/%s gefunden: %s' % (alt_id, land, baustein, stellen))
        alt = liste.pop(stellen[0])
        ersetzt.append((alt_id, land, baustein, alt.get('wert'), alt.get('einheit'), alt.get('status')))
        return alt

    # Sauna: nur HH hatte eine Zeile (HH-V11)
    ersetze('HH', 'sauna', 'HH-V11')
    for d in SAUNA:
        daten[d['land']].setdefault('sauna', []).append(eintrag(d))
    # Gewaechshaus: BW-V06 und BB-V04 (beide "auch privat") werden ersetzt; die Betriebs-Zeilen bleiben
    ersetze('BW', 'gewaechshaus', 'BW-V06')
    ersetze('BB', 'gewaechshaus', 'BB-V04')
    for d in GEWAECHSHAUS:
        liste = daten[d['land']].setdefault('gewaechshaus', [])
        liste.insert(sum(1 for x in liste if str(x.get('id', '')).startswith('GW-')), eintrag(d))
    # Kleinwind: alle 16 Zeilen werden ersetzt
    for z in KLEINWIND_ZEILEN:
        alt = ersetze(z[0], 'kleinwind', z[10])
        if daten[z[0]]['kleinwind']:
            raise SystemExit('FEHLER: %s hat weitere Kleinwind-Zeilen' % z[0])
        daten[z[0]]['kleinwind'].append(kleinwind_eintrag(z, alt))
    return ersetzt
