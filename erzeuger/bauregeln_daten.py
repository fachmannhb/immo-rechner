# Erzeugt daten/bauregeln.js aus den Werte-Tabellen der Berichte 20, 23, 24-27 (nicht von Hand aendern).
# Aufruf: python erzeuger/bauregeln_daten.py
import sys, io, os, re, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import regel_lib as L

LAENDER = collections.OrderedDict([
    ('BW', 'Baden-Württemberg'), ('BY', 'Bayern'), ('BE', 'Berlin'), ('BB', 'Brandenburg'),
    ('HB', 'Bremen'), ('HH', 'Hamburg'), ('HE', 'Hessen'), ('MV', 'Mecklenburg-Vorpommern'),
    ('NI', 'Niedersachsen'), ('NW', 'Nordrhein-Westfalen'), ('RP', 'Rheinland-Pfalz'), ('SL', 'Saarland'),
    ('SN', 'Sachsen'), ('ST', 'Sachsen-Anhalt'), ('SH', 'Schleswig-Holstein'), ('TH', 'Thüringen')])

# Landesbauordnung je Land: (Kurzname, Fassung, Quellschluessel, ggf. feste URL)
LBO = {
    'HB': ('BremLBO', 'Neufassung vom 29.05.2024 (in Kraft 01.07.2024); Änderung durch Artikelgesetz vom 01.09.2026 gilt ab 01.01.2027', 'GBl60', None),
    'BW': ('LBO BW', 'Neubekanntmachung vom 16.03.2026 (GBl. 2026 Nr. 44)', 'BW-GBl44', None),
    'BY': ('BayBO', 'Fassung vom 14.08.2007, Text gültig ab 01.05.2026', 'BY-BayBO', None),
    'BE': ('BauO Bln', 'Änderung durch Gesetz für einfaches Bauen (GEB) vom 09.07.2026, gültig ab 23.07.2026 (laut Synopse)', 'BE-Syn', None),
    'BB': ('BbgBO', 'Fassung vom 15.11.2018, zuletzt geändert durch Gesetz vom 29.06.2026', 'BB-BbgBO', None),
    'HH': ('HBauO', 'Fassung vom 06.01.2025, gültig ab 01.01.2026', 'HH-LR(n)', None),
    'HE': ('HBO', 'Fassung vom 28.05.2018, zuletzt geändert durch Gesetz vom 09.10.2025', 'HE-HBO', None),
    'MV': ('LBauO M-V', 'Fassung vom 15.10.2015, zuletzt geändert durch Gesetz vom 08.07.2026', 'MV-LR(nn)', None),
    'NI': ('NBauO', 'je Paragraf unterschiedliche Fassungen, überwiegend ab 01.07.2025 (siehe Quelle je Regel)', 'NI-43', None),
    'NW': ('BauO NRW 2018', 'Fassung gültig ab 01.09.2026 (Gesetz vom 21.07.2026)', 'NW-BauO', None),
    'RP': ('LBauO RP', 'nur Verlagsfassung Stand 15.12.2022 plus nichtamtliche Synopse Stand 11/2025 (amtlicher Text nicht abrufbar)', 'RP-FT', None),
    'SL': ('LBO Saarland', 'amtlicher Text nicht abrufbar; keine gelesenen Werte (Bericht 26)', 'SL-Such', None),
    'SN': ('SächsBO', 'Fassung vom 11.05.2016, rechtsbereinigt Stand 19.03.2024', 'SN-BO', None),
    'ST': ('BauO LSA', 'Gesamtausgabe 01.08.2026 bis 19.01.2027 (danach neue Fassung von §§ 1 und 65)', 'ST-BO', None),
    'SH': ('LBO SH', 'Fassung vom 05.07.2024, letzte berücksichtigte Änderung 13.12.2024', 'SH-BO', None),
    'TH': ('ThürBO', 'Fassung vom 02.07.2024, zuletzt geändert durch Gesetz vom 06.07.2026 (seit 24.07.2026)', 'TH-BO', None),
}

# Themenregister: Schluessel -> (Titel, Gruppe)
THEMEN = collections.OrderedDict([
    ('raumhoehe', ('Lichte Raumhöhe Aufenthaltsräume', 'raeume')),
    ('raumhoehe_dach', ('Lichte Raumhöhe im Dachraum', 'raeume')),
    ('ausnahme_gk12', ('Ausnahme von der Raumhöhe für Wohngebäude Gebäudeklasse 1 und 2', 'raeume')),
    ('fensterflaeche', ('Fensterfläche (Anteil an der Raumfläche)', 'raeume')),
    ('fensterflaeche_nutzungsaenderung', ('Fensterfläche bei Nutzungsänderung im Bestand', 'raeume')),
    ('belichtung', ('Belichtung und Belüftung (ohne Zahlenwert)', 'raeume')),
    ('mindestgroesse', ('Mindestgröße Aufenthaltsraum', 'raeume')),
    ('kueche', ('Küche oder Kochnische je Wohnung', 'pflichtraeume')),
    ('bad_wc', ('Bad und Toilette je Wohnung', 'pflichtraeume')),
    ('fensterlose_baeder', ('Fensterlose Bäder und Toiletten', 'pflichtraeume')),
    ('abstellraum', ('Abstellraum je Wohnung', 'pflichtraeume')),
    ('wohnung_abgeschlossen', ('Wohnung baulich abgeschlossen', 'pflichtraeume')),
    ('keller_wohnung', ('Wohnungen im Kellergeschoss', 'pflichtraeume')),
    ('rauchmelder', ('Rauchwarnmelder', 'brandschutz')),
    ('rettungswege', ('Rettungswege je Geschoss', 'brandschutz')),
    ('rettungsfenster', ('Rettungsfenster (lichte Größe)', 'brandschutz')),
    ('rettungsfenster_nutzungsaenderung', ('Rettungsfenster bei Nutzungsänderung im Bestand', 'brandschutz')),
    ('rettungsfenster_unterkante', ('Rettungsfenster: Höhe über Fußboden', 'brandschutz')),
    ('rettungsfenster_dach', ('Rettungsfenster im Dach: Abstand zur Traufkante', 'brandschutz')),
    ('bruestung', ('Fensterbrüstung (Höhe)', 'brandschutz')),
    ('umwehrung', ('Umwehrung (Absturzsicherung)', 'brandschutz')),
    ('treppe_breite', ('Breite notwendiger Treppen', 'brandschutz')),
    ('flur_breite', ('Breite notwendiger Flure', 'brandschutz')),
    ('verfahrensfrei_innen', ('Verfahrensfrei: nichttragende Bauteile innen', 'verfahren')),
    ('verfahrensfrei_tragend', ('Verfahrensfrei: tragende Bauteile ändern', 'verfahren')),
    ('dachausbau', ('Dachgeschossausbau zu Wohnzwecken', 'verfahren')),
    ('verfahrensfrei_fenster', ('Verfahrensfrei: Fenster und Türen', 'verfahren')),
    ('verfahrensfrei_pflichten', ('Verfahrensfreiheit entbindet nicht von anderen Vorschriften', 'verfahren')),
    ('nachweise_statik', ('Bautechnische Nachweise (Statik)', 'verfahren')),
    ('bestand_umnutzung', ('Erleichterungen für Umnutzung im Bestand', 'verfahren')),
    ('gebaeudeklasse2', ('Gebäudeklasse 2 (Definition)', 'verfahren')),
    ('barrierefrei', ('Barrierefreiheit: ab welcher Wohnungszahl', 'barrierefrei')),
    ('barrierefrei_ausnahmen', ('Barrierefreiheit: Ausnahmen, Aufzugsregeln, Bestand', 'barrierefrei')),
    ('din18040_geltung', ('DIN 18040-2: Geltung als Technische Baubestimmung', 'barrierefrei')),
    ('din18040_ausnahmen', ('DIN 18040-2: ausgenommene Abschnitte', 'barrierefrei')),
    ('solar_verfahrensfrei', ('Solaranlagen Dach und Wand: verfahrensfrei', 'solar')),
    ('solar_freistehend', ('Solaranlagen freistehend: verfahrensfrei', 'solar')),
    ('hochhaus', ('Hochhaus (Ausschluss der Verfahrensfreiheit)', 'solar')),
    ('pv_brandwand', ('PV-Abstand zur Brandwand', 'solar')),
    ('pv_brandwand_ohne', ('PV ohne Abstand zur Brandwand (bei Schutz)', 'solar')),
    ('pv_brandwand_125', ('PV-Abstand zur Brandwand 1,25 m (übrige Anlagen)', 'solar')),
    ('dachbegruenung', ('Dachbegrünung (Flachdach)', 'solar')),
    ('solarpflicht', ('Solarpflicht (Kern)', 'solar')),
    ('solarpflicht_detail', ('Solarpflicht: Einzelheiten, Stichtage, Ausnahmen', 'solar')),
    ('denkmal', ('Denkmalschutz: Genehmigung für Veränderung / PV', 'denkmal')),
    ('denkmal_innen', ('Denkmalschutz: Umbau im Innern', 'denkmal')),
    ('rechtsstand', ('Rechtsstand und angekündigte Änderungen', 'stand')),
])
# Themen, die in jedem Land vorhanden sein muessen (Eintrag oder Luecke)
KERN = ['raumhoehe', 'raumhoehe_dach', 'ausnahme_gk12', 'fensterflaeche', 'belichtung', 'kueche', 'bad_wc', 'fensterlose_baeder',
        'abstellraum', 'rauchmelder', 'rettungswege', 'rettungsfenster', 'rettungsfenster_unterkante', 'rettungsfenster_dach',
        'bruestung', 'umwehrung', 'treppe_breite', 'flur_breite', 'verfahrensfrei_innen', 'verfahrensfrei_tragend', 'dachausbau',
        'verfahrensfrei_fenster', 'verfahrensfrei_pflichten', 'nachweise_statik', 'bestand_umnutzung', 'gebaeudeklasse2',
        'barrierefrei', 'din18040_geltung', 'solar_verfahrensfrei', 'solar_freistehend', 'hochhaus',
        'pv_brandwand', 'pv_brandwand_125', 'solarpflicht', 'denkmal', 'denkmal_innen', 'rechtsstand']
NICHT_BEAUFTRAGT = {'belichtung', 'fensterlose_baeder', 'treppe_breite', 'flur_breite', 'verfahrensfrei_pflichten', 'nachweise_statik'}

ID2THEMA = {
    'B01': 'raumhoehe', 'B02': 'raumhoehe_dach', 'B03': 'ausnahme_gk12', 'B04': 'fensterflaeche',
    'B04a': 'fensterflaeche_nutzungsaenderung', 'B05': 'belichtung', 'B06': 'kueche', 'B07': 'bad_wc',
    'B08': 'fensterlose_baeder', 'B09': 'abstellraum', 'B10': 'rauchmelder', 'B11': 'rettungswege',
    'B12': 'rettungsfenster', 'B12a': 'rettungsfenster_nutzungsaenderung', 'B13': 'rettungsfenster_unterkante',
    'B14': 'rettungsfenster_dach', 'B15': 'bruestung', 'B16': 'treppe_breite', 'B17': 'flur_breite',
    'B18': 'verfahrensfrei_innen', 'B19': 'verfahrensfrei_tragend', 'B20': 'dachausbau', 'B21': 'verfahrensfrei_fenster',
    'B22': 'verfahrensfrei_pflichten', 'B23': 'nachweise_statik', 'B24': 'bestand_umnutzung', 'B25': 'gebaeudeklasse2',
    'B26': 'umwehrung', 'B27': 'keller_wohnung', 'B28': 'rechtsstand', 'B29': 'wohnung_abgeschlossen',
    'P01': 'solar_verfahrensfrei', 'P02': 'solar_freistehend', 'P03': 'pv_brandwand', 'P04': 'pv_brandwand_125',
    'P05': 'dachbegruenung', 'P06': 'solarpflicht', 'P07': 'solarpflicht_detail', 'P08': 'solarpflicht_detail',
    'P09': 'solarpflicht_detail', 'P10': 'solarpflicht_detail', 'M01': 'denkmal', 'M02': 'denkmal_innen',
    'V01': 'rechtsstand', 'V02': 'rechtsstand',
}
# Datei 25 (HH, HE, MV, NI) nutzt S01..S07 fuer Solar und D01 fuer Denkmal
ID2THEMA_25 = {'S01': 'solar_verfahrensfrei', 'S02': 'solar_freistehend', 'S03': 'pv_brandwand_ohne', 'S04': 'pv_brandwand',
               'S05': 'pv_brandwand_125', 'S06': 'hochhaus', 'S07': 'solarpflicht', 'D01': 'denkmal'}
# N-Ids: Bremen-Schema gilt in Datei 20, 25 und fuer HB-Zeilen in 27; die uebrigen Laenderdateien (24, 26, 27) haben ein anderes Schema
N_BREMEN = {'N01': 'din18040_geltung', 'N02': 'barrierefrei', 'N03': 'din18040_ausnahmen'}
N_LAND = {'N01': 'barrierefrei', 'N02': 'barrierefrei_ausnahmen', 'N03': 'din18040_geltung'}
# HB-P09 ist Rechtsstand BremSolarG
HB_SONDER = {'P09': 'rechtsstand'}

# Landesportal-Quellen aus Bericht 38: Rahmen-Adresse und Muster-Adresse je Paragraf ({n} = Paragrafnummer)
PORTAL_FIX = {
    'SL-LBO': ('https://recht.saarland.de/perma?j=BauO_SL', 'https://recht.saarland.de/perma?j=BauO_SL_!_{n}'),
    'BE-BauO': ('https://gesetze.berlin.de/perma?j=BauO_BE', 'https://gesetze.berlin.de/perma?j=BauO_BE_!_{n}'),
    'BW-LBO': ('https://www.landesrecht-bw.de/perma?j=BauO_BW', 'https://www.landesrecht-bw.de/perma?j=BauO_BW_!_{n}'),
    'RP-LBauO': ('https://www.landesrecht.rlp.de/bsrp/document/jlr-NNLRP00005B3E', None),
    'RP-LSolarG': ('https://www.landesrecht.rlp.de/bsrp/document/jlr-NNLRP00005C9BNN00000000004', None),
    'BE-SolarG': ('https://gesetze.berlin.de/perma?j=SolarG_BE', 'https://gesetze.berlin.de/perma?j=SolarG_BE_!_{n}'),
    'BW-PVPf': ('https://www.landesrecht-bw.de/bsbw/document/jlr-NNLBW00007BEDNN00000000004', None),
}
LANDESPORTAL = {'SL-LBO', 'SL-LBO12a', 'SL-DSchG', 'RP-LBauO', 'RP-LSolarG', 'RP-DSchG', 'BE-BauO', 'BE-SolarG', 'BE-DSchG', 'BW-LBO', 'BW-KlimaG', 'BW-PVPf', 'BW-DSchG'}

QUELLEN = collections.OrderedDict()   # Schluessel -> {titel,url}
QUELLEN_DATEI = {}
OFFEN = collections.Counter()


def quellen_laden():
    for f in ['20_bauregeln.md', '24_laender_1.md', '25_laender_2.md', '26_laender_3.md', '27_laender_4.md', '38_nachholen_sl_rp_be_bw.md']:
        d = L.quellen_aus_datei(f)
        for k, v in d.items():
            if k in QUELLEN and QUELLEN[k] != v:
                if QUELLEN[k]['url'] != v['url']:
                    print('WARN Quelle doppelt mit anderer URL:', k, QUELLEN[k]['url'], v['url'])
                continue
            QUELLEN[k] = v
            QUELLEN_DATEI[k] = f
    # Bericht 38 nennt Muster-Adressen mit <Nr>; die Quelle bekommt die Rahmen-Adresse, "muster" erlaubt einen Link auf den Paragrafen
    for k, (rahmen, muster) in PORTAL_FIX.items():
        if k in QUELLEN:
            QUELLEN[k]['url'] = rahmen
            if muster:
                QUELLEN[k]['muster'] = muster
    QUELLEN['KEINE'] = {'titel': 'keine Quelle abrufbar oder gefunden (Lücke bzw. gesperrt; siehe Suchanfragen im Bericht)', 'url': None}
    QUELLEN['NI'] = {'titel': 'Niedersächsische Bauordnung (NBauO) insgesamt, NI-VORIS (Einzelparagrafen siehe NI-2, NI-43 usw.)', 'url': 'https://voris.wolterskluwer-online.de/'}


def status_norm(zelle, einheit, wert):
    z = zelle.strip()
    if einheit.strip('() ') in ('Lücke',) or wert.startswith('nicht gelesen'):
        return 'Lücke'
    if z.startswith('geprüft') and 'prüfen vor Nutzung' not in z and 'unsicher' not in z:
        return 'geprüft'
    return 'prüfen vor Nutzung'


NUM = r'(\d+(?:,\d+)?)'


def dez(s):
    return float(s.replace(',', '.'))


def zehntel(v):
    return round(v, 4)


WORTZAHL = {'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5, 'acht': 8}


def parse_wert(thema, w, wortlaut, land=''):
    """Enge, themenbezogene Auswertung. Gibt (wert, einheit_norm) oder (None, None). Nie Einheiten umrechnen."""
    t = w.replace(' ', ' ')
    if thema in ('raumhoehe', 'raumhoehe_dach', 'rettungsfenster_unterkante', 'rettungsfenster_dach'):
        m = re.search(r'(?:mindestens|höchstens|^)\s*' + NUM, t)
        if m and not t.startswith('kein') and not t.startswith('Ausnahme') and not t.startswith('nicht'):
            return zehntel(dez(m.group(1))), 'm'
        return None, None
    if thema == 'fensterflaeche':
        m = re.search(r'\b(\d)\s*/\s*(\d+)\b', t)
        if m:
            return {'zaehler': int(m.group(1)), 'nenner': int(m.group(2))}, 'Anteil'
        m = re.search(r'\bein (Achtel|Zehntel|Sechstel)', t)
        if m:
            return {'zaehler': 1, 'nenner': {'Achtel': 8, 'Zehntel': 10, 'Sechstel': 6}[m.group(1)]}, 'Anteil'
        return None, None
    if thema == 'ausnahme_gk12':
        if 'keine Ausnahme' in t or t.startswith('keine'):
            return False, None
        m = re.match(r'^Ausnahme nur nach Ermessen: ' + NUM, t)
        if m:
            return {'ersatzwert_m': zehntel(dez(m.group(1))), 'ermessen': True}, 'm'
        m = re.match(r'^' + NUM + r' statt ' + NUM, t)
        if m:
            return {'ersatzwert_m': zehntel(dez(m.group(1))), 'ermessen': False}, 'm'
        if t.startswith('Ausnahme'):
            return True, None
        return None, None
    if thema == 'rettungsfenster':
        m = re.search(NUM + r'\s*(?:m\s*)?(?:breit\s*)?x\s*' + NUM, t)
        if m:
            erg = {'breite': zehntel(dez(m.group(1))), 'hoehe': zehntel(dez(m.group(2)))}
            m2 = re.search(r'nicht höher als ' + NUM + r' ?(?:m|Meter) über der Fußbodenoberkante', wortlaut)
            if m2:
                erg['unterkante_max'] = zehntel(dez(m2.group(1)))
            return erg, 'm'
        return None, None
    if thema == 'bruestung':
        m = re.search(r'(?:mindestens\s*)?' + NUM, t)
        if m:
            erg = {'hoehe': zehntel(dez(m.group(1)))}
            m2 = (re.search(NUM + r'\s*\((?:über|mehr als) 12 ?m\)', t)
                  or re.search(r'mindestens ' + NUM + r' bei Absturzhöhe (?:über|mehr als) 12 ?m', t)
                  or re.search(r'mindestens ' + NUM + r' bei (?:mehr als|über) 12 ?m', t)
                  or re.search(r'mindestens ' + NUM + r' darüber', t)
                  or re.search(r'sonst ' + NUM, t))
            if m2:
                erg['ab_12m'] = zehntel(dez(m2.group(1)))
            return erg, 'm'
        return None, None
    if thema == 'abstellraum':
        m = re.search(r'mindestens ' + NUM + r' \(Wohnung bis (\d+) m² nutzbarer Grundfläche\) beziehungsweise mindestens ' + NUM + r' \(Wohnung über', t)
        if m:
            return {'bis_wohnung_m2': int(m.group(2)), 'wert_klein': zehntel(dez(m.group(1))), 'wert_gross': zehntel(dez(m.group(3)))}, 'm²'
        m = re.search(r'soll ' + NUM + r' m² groß sein', t)
        if m:
            return zehntel(dez(m.group(1))), 'm²'
        return None, None
    if thema == 'rauchmelder':
        m = re.match(r'mindestens (\d+) Rauchwarnmelder', t)
        if m:
            return int(m.group(1)), 'Stück'
        return None, None
    if thema == 'barrierefrei':
        m = re.match(r'^(?:Gebäude mit )?mehr als (zwei|drei|vier|\d+)\s+Wohnungen', t) or re.search(r'In Gebäuden mit mehr als (zwei|drei|vier|\d+) Wohnungen', t) or re.search(r'nur "In Gebäuden mit mehr als (zwei) Wohnungen', t)
        if m:
            v = m.group(1)
            return (WORTZAHL[v] if v in WORTZAHL else int(v)), 'Wohnungen'
        return None, None
    if thema == 'solarpflicht':
        if land not in ('HB', 'NI', 'HH', 'BE'):
            return None, None   # Prozentwerte anderer Laender gelten nur fuer Teilfaelle (Gewerbe, Renovierung); nicht automatisch lesen
        erg = {}
        m = re.search(r'(\d+)\s*(?:Prozent|%|v\. H\.)', t)
        if m:
            erg['anteil_dach_prozent'] = int(m.group(1))
        m = re.search(r'(?:mindestens|ab|von)\s+(\d+)\s*m²', t)
        if m:
            erg['ab_dachflaeche_m2'] = int(m.group(1))
        return (erg or None), ('Prozent' if erg else None)
    if thema in ('pv_brandwand', 'pv_brandwand_125'):
        m = re.match(r'(?:mindestens )?' + NUM + r'\b', t)
        if m:
            return zehntel(dez(m.group(1))), 'm'
        return None, None
    return None, None


def pflicht_von(thema, t):
    """Aus dem Kurztext der Berichte: gilt die Anforderung für ein Einfamilienhaus (GK 1)?
    abstellraum: 'immer' (jede Wohnung) | 'gk35' (nur Gebäudeklassen 3 bis 5) | 'mehr_als_2' (nur Gebäude mit mehr als zwei Wohnungen) | 'nein'
    kueche, bad_wc: 'ja' | 'technisch' (nur Anschlüsse vorbereiten) | 'nein' (keine ausdrückliche Pflicht im Wortlaut)"""
    if thema == 'abstellraum':
        if 'kein Abstellraum' in t:
            return 'nein'
        if 'nur' in t and 'Gebäudeklassen 3 bis 5' in t and not t.startswith('Wortlaut ändert'):
            return 'gk35'
        if 'nicht verlangt' in t.split(';')[0]:
            return 'nein'
        if 'mehr als zwei Wohnungen' in t and not t.startswith('Wortlaut ändert'):
            return 'mehr_als_2'
        return 'immer'
    if thema in ('kueche', 'bad_wc'):
        if 'keine ausdrückliche Pflicht' in t:
            return 'nein'
        if 'technischen Voraussetzungen' in t:
            return 'technisch'
        if thema == 'bad_wc' and 'kein Bad' in t:
            return 'nur_wc'
        return 'ja'
    return None


PARA_RE = re.compile(r'((?:Art\.|§§?)\s*\d+[a-z]?(?:\s*Abs\.\s*\d+)?(?:\s*Satz\s*\d+)?(?:\s*Nr\.\s*\d+)?(?:\s+(?:DVO-NBauO|SAN-VO NRW|KlimaG BW|EWKG|HEG|NBauO|BremSolarG|PVPf-VO|DSchG NRW|BauO NRW))?)')


def paragraf(gilt):
    m = PARA_RE.search(gilt)
    return m.group(1).strip() if m else None


def eintrag(file, row, land, lid, thema):
    _id, wert, einheit, gilt, quelle, abruf, wortlaut, status = row
    st = status_norm(status, einheit, wert)
    w, e = (None, None) if st == 'Lücke' else parse_wert(thema, wert, wortlaut, land)
    keys, offen = L.quellkeys(quelle, DEFS)
    for o in offen:
        OFFEN[(file, o)] += 1
    ent = collections.OrderedDict()
    ent['id'] = _id
    if st == 'Lücke':
        ent['status'] = st
        ent['wert'] = None
        ent['luecke_grund'] = wert
        ent['gilt_fuer'] = gilt
        ent['quelle'] = keys or ['KEINE']
        ent['quelle_roh'] = quelle if offen else None
        ent['abruf'] = L.iso(abruf)
        return ent
    ent['wert'] = w
    pf = pflicht_von(thema, wert)
    if pf:
        ent['pflicht'] = pf
    ent['wert_text'] = wert
    ent['einheit'] = e if e else einheit
    ent['gilt_fuer'] = gilt
    p = paragraf(gilt)
    ent['paragraf'] = p
    ent['wortlaut'] = wortlaut
    ent['quelle'] = keys
    if offen:
        ent['quelle_roh'] = quelle
    ent['abruf'] = L.iso(abruf)
    ent['status'] = st
    if status != 'geprüft':
        ent['hinweis'] = status
    return ent


DEFS = {}

# Themen, deren wörtlicher Gesetzestext in der Seite mitgeliefert wird (Kernregeln der Prüfkarte und der Genehmigungskarte)
KERN_WORTLAUT = {'raumhoehe', 'ausnahme_gk12', 'fensterflaeche', 'rettungsfenster', 'bruestung', 'abstellraum',
                 'verfahrensfrei_innen', 'verfahrensfrei_tragend', 'dachausbau', 'solar_verfahrensfrei', 'gebaeudeklasse2'}
AMPEL_THEMEN = {'raumhoehe', 'ausnahme_gk12', 'fensterflaeche', 'rettungsfenster', 'bruestung'}
ABRUF_STD = '2026-10-27'
WORTLAUT_MAX = 290
TEXT_MAX = 50
HINWEIS_MAX = 34
# Themen der Karte "Darf ich das ohne Genehmigung?": die Antwort steht dort als Satz, darum längerer Kurztext und Wortlaut
KLARTEXT_THEMEN = {'verfahrensfrei_innen', 'verfahrensfrei_tragend', 'dachausbau', 'solar_verfahrensfrei', 'gebaeudeklasse2'}
# Themen, die die Seite heute nicht braucht: nur in der vollen Fassung (daten/bauregeln_voll.js)
NUR_VOLL = {'solarpflicht_detail', 'pv_brandwand_ohne', 'pv_brandwand_125', 'dachbegruenung', 'din18040_geltung', 'din18040_ausnahmen',
            'fensterflaeche_nutzungsaenderung', 'rettungsfenster_nutzungsaenderung', 'keller_wohnung', 'wohnung_abgeschlossen',
            'mindestgroesse', 'belichtung', 'fensterlose_baeder', 'denkmal_innen', 'umwehrung', 'treppe_breite', 'flur_breite',
            'verfahrensfrei_fenster', 'rettungsfenster_dach', 'pv_brandwand', 'barrierefrei_ausnahmen', 'nachweise_statik'}


def kuerzen(s, n):
    if s is None or len(s) <= n:
        return s
    k = s[:n].rsplit(' ', 1)[0].rstrip(' ,;:.')
    return k + ' …'


def schlank_eintrag(thema, e):
    o = collections.OrderedDict()
    if e['status'] != 'geprüft':     # "geprüft" ist der Standard (status_std), wird nicht wiederholt
        o['status'] = e['status']
    if e.get('status') == 'Lücke':
        o['luecke_grund'] = kuerzen(e.get('luecke_grund'), 70)
    else:
        if e.get('wert') is not None:
            o['wert'] = e['wert']
        if e.get('einheit') and e.get('einheit') != '(Regel)':
            o['einheit'] = e['einheit']
        if e.get('paragraf'):
            o['paragraf'] = e['paragraf']
        if e.get('pflicht'):
            o['pflicht'] = e['pflicht']
        if thema in KLARTEXT_THEMEN or not (thema in KERN_WORTLAUT and e.get('wortlaut')):   # wo der Wortlaut mitkommt, ist der Kurztext überflüssig
            o['text'] = kuerzen(e.get('wert_text'), 150 if thema in KLARTEXT_THEMEN else TEXT_MAX)
        if thema in KERN_WORTLAUT and e.get('wortlaut'):
            wl = e['wortlaut']
            o['wortlaut'] = wl if thema in AMPEL_THEMEN else kuerzen(wl, WORTLAUT_MAX)   # was eine Ampel bestimmt, bleibt vollständig
            if o['wortlaut'] != wl:
                o['wortlaut_gekuerzt'] = True
        if e.get('hinweis'):
            o['hinweis'] = kuerzen(e['hinweis'], HINWEIS_MAX)
    o['quelle'] = e.get('quelle') or ['KEINE']
    if e.get('abruf') != ABRUF_STD:   # Standard-Abrufdatum steht einmal oben (abruf_std)
        o['abruf'] = e.get('abruf')
    for k in ('gilt_ab', 'gilt_bis'):
        if e.get(k):
            o[k] = e[k]
    if e.get('bestaetigt_2027'):
        o['bestaetigt_2027'] = True
    return o


def schlank_bauen(obj):
    s = collections.OrderedDict()
    for k in ('stand', 'hinweis'):
        s[k] = obj[k]
    s['status_std'] = 'geprüft'
    s['abruf_std'] = ABRUF_STD
    for k in ('themen', 'kern'):
        s[k] = obj[k]
    s['quellen'] = collections.OrderedDict(
        (k, collections.OrderedDict([(a, (kuerzen(b, 54) if a == 'titel' else b)) for a, b in v.items()])) for k, v in obj['quellen'].items())
    s['hinweis'] += (' Status „geprüft (Landesportal)“ = der Text wurde im amtlichen Landesportal gelesen, nicht im Gesetzblatt. '
                     'Diese schlanke Fassung enthält den wörtlichen Gesetzestext nur für die Kernregeln; für alles andere gilt der Link zur Quelle (volle Fassung: daten/bauregeln_voll.js im Repository).')
    b = obj['bund']
    s['bund'] = collections.OrderedDict([
        ('hinweis', b['hinweis']),
        ('richtwerte', [collections.OrderedDict(
            [(k, (kuerzen(v, 90) if k == 'wortlaut' else kuerzen(v, 120) if k in ('wert_text', 'gilt_fuer') else v)) for k, v in e.items()
             if k in ('id', 'wert_text', 'einheit', 'gilt_fuer', 'wortlaut', 'quelle', 'abruf', 'status')])
            for e in b['richtwerte']]),
        ('solar', [])])
    laender = collections.OrderedDict()
    for c, l in obj['laender'].items():
        laender[c] = collections.OrderedDict([
            ('name', l['name']), ('lbo', l['lbo']),
            ('regeln', collections.OrderedDict((th, [schlank_eintrag(th, e) for e in lst]) for th, lst in l['regeln'].items() if th not in NUR_VOLL))])
    s['themen'] = collections.OrderedDict((k, v) for k, v in s['themen'].items() if k not in NUR_VOLL)
    s['kern'] = [k for k in s['kern'] if k not in NUR_VOLL]
    s['laender'] = laender
    return s


def main():
    quellen_laden()
    DEFS.update(QUELLEN)
    daten = {k: collections.OrderedDict() for k in LAENDER}      # land -> thema -> [eintraege]
    richtwerte = []
    unmapped = []
    hb2027 = []                                                    # (thema, eintrag) aus Datei 27
    hb_bestaetigt = []                                              # (id, kommentar, zeile)

    def add(land, thema, ent):
        daten[land].setdefault(thema, []).append(ent)

    # Datei 20 (Bremen) und Richtwerte
    for kopf, rows, _ in L.tabellen('20_bauregeln.md'):
        if kopf[0] != 'id':
            continue
        for r in rows:
            lid = r[0]
            if lid[0] in 'ASDF':
                ent = collections.OrderedDict()
                st = status_norm(r[7], r[2], r[1])
                keys, offen = L.quellkeys(r[4], DEFS)
                ent['id'] = lid
                ent['wert_text'] = r[1]
                ent['einheit'] = r[2]
                ent['gilt_fuer'] = r[3]
                ent['wortlaut'] = r[6]
                ent['quelle'] = keys
                ent['abruf'] = L.iso(r[5])
                ent['status'] = 'Lücke' if r[2].strip('() ') == 'Lücke' else st
                if r[7] != 'geprüft':
                    ent['hinweis'] = r[7]
                richtwerte.append(ent)
                continue
            th = N_BREMEN.get(lid) or ID2THEMA.get(lid)
            if not th:
                unmapped.append(('20', lid))
                continue
            add('HB', th, eintrag('20', r, 'HB', lid, th))

    # Dateien 24-27
    for f in ['24_laender_1.md', '25_laender_2.md', '26_laender_3.md', '27_laender_4.md']:
        for kopf, rows, _ in L.tabellen(f):
            if kopf[0] != 'id':
                continue
            for r in rows:
                m = re.match(r'^([A-Z]{2})-([A-Z]\d+[a-z]?)$', r[0])
                if not m:
                    unmapped.append((f, r[0]))
                    continue
                land, lid = m.group(1), m.group(2)
                if land not in LAENDER:
                    unmapped.append((f, r[0]))
                    continue
                th = None
                if f.startswith('25') and lid in ID2THEMA_25:
                    th = ID2THEMA_25[lid]
                elif land == 'NI' and lid == 'B28':
                    th = 'mindestgroesse'
                elif land == 'HB' and lid in HB_SONDER:
                    th = HB_SONDER[lid]
                elif lid in N_BREMEN:
                    th = (N_BREMEN if (f.startswith('25') or land == 'HB') else N_LAND)[lid]
                else:
                    th = ID2THEMA.get(lid)
                if not th:
                    unmapped.append((f, r[0]))
                    continue
                ent = eintrag(f, r, land, lid, th)
                if land == 'HB':
                    w = r[1]
                    if re.match(r'^(ÄNDERUNG ab|ERGÄNZUNG ab|NEU ab|Wortlaut ändert sich ab)', w):
                        ent['gilt_ab'] = '2027-01-01'
                        hb2027.append((th, ent))
                        continue
                    if w.startswith('UNVERÄNDERT'):
                        hb_bestaetigt.append((lid, r))
                        continue
                add(land, th, ent)

    # Bericht 38 (27.10.2026): Landesportal-Text ersetzt alte Zeilen von SL, RP, BE, BW
    ersetzt_n = 0
    neu_n = 0
    behalten_n = 0
    for kopf, rows, _ in L.tabellen('38_nachholen_sl_rp_be_bw.md'):
        if kopf[0] != 'id':
            continue
        for r in rows:
            m = re.match(r'^([A-Z]{2})-([A-Z]\d+[a-z]?)$', r[0])
            if not m or m.group(1) not in LAENDER:
                unmapped.append(('38', r[0]))
                continue
            land, lid = m.group(1), m.group(2)
            th = N_LAND.get(lid) if lid in N_LAND else ID2THEMA.get(lid)
            if not th:
                unmapped.append(('38', r[0]))
                continue
            ent = eintrag('38', r[:8], land, lid, th)
            md = re.match(r'^(\d{2}\.\d{2}\.\d{4})\s*\((.*)\)$', r[5].strip())
            if md:     # z. B. "26.10.2026 (Bericht 24, nicht neu abgerufen)": Datum bleibt Datum, der Rest wird Hinweis
                ent['abruf'] = L.iso(md.group(1))
                ent['abruf_hinweis'] = md.group(2)
            if ent['status'] == 'geprüft' and any(k in LANDESPORTAL for k in ent['quelle']):
                ent['status'] = 'geprüft (Landesportal)'
            ent['ersetzt'] = r[8]
            alte = {r[0]} | set(re.findall(r'[A-Z]{2}-[A-Z]\d+[a-z]?', r[8]))
            # "unverändert bestätigt": hatte die alte Zeile schon den Status "geprüft" (z. B. Gesetzblatt BW), bleibt sie bestehen und das Landesportal
            # kommt nur als zweite Quelle dazu (kein Rückschritt von Gesetzblatt auf Landesportal)
            if 'unverändert bestätigt' in r[8]:
                alt = [x for t in daten[land].values() for x in t if x.get('id') in alte and not x.get('ersetzt')]
                if len(alt) == 1 and alt[0]['status'] == 'geprüft':
                    for k in ent['quelle']:
                        if k not in alt[0]['quelle']:
                            alt[0]['quelle'].append(k)
                    alt[0]['portal_bestaetigt'] = '2026-10-27'
                    behalten_n += 1
                    continue
            for t in list(daten[land]):
                # nur alte Zeilen entfernen (nicht die neuen aus Bericht 38: bei "aufgeteilt" teilen sich mehrere neue Zeilen dieselbe alte Id)
                rest = [x for x in daten[land][t] if x.get('id') not in alte or x.get('ersetzt')]
                if len(rest) != len(daten[land][t]):
                    ersetzt_n += len(daten[land][t]) - len(rest)
                    if rest:
                        daten[land][t] = rest
                    else:
                        del daten[land][t]
            if r[8].strip() == 'neu':
                neu_n += 1
            add(land, th, ent)
    print('Bericht 38: alte Eintraege entfernt', ersetzt_n, ', neu ohne Vorgaenger', neu_n, ', alte Zeile "geprueft" behalten (Landesportal nur zusaetzliche Quelle)', behalten_n)

    # Bremen: zweite Eintraege ab 2027
    for th, ent in hb2027:
        for alt in daten['HB'].get(th, []):
            if 'gilt_ab' not in alt:
                alt['gilt_bis'] = '2026-12-31'
        add('HB', th, ent)
    # Bremen: UNVERAENDERT-Bestaetigungen
    bestaetigt_themen = {
        'B01': ['raumhoehe', 'raumhoehe_dach', 'ausnahme_gk12', 'fensterflaeche'],
        'B06': ['kueche', 'bad_wc', 'rauchmelder'],
        'B12': ['rettungswege', 'rettungsfenster', 'rettungsfenster_unterkante', 'rettungsfenster_dach', 'bruestung'],
        'B18': ['verfahrensfrei_innen', 'verfahrensfrei_tragend', 'dachausbau'],
        'P03': ['pv_brandwand', 'pv_brandwand_125'],
    }
    for lid, r in hb_bestaetigt:
        keys, _o = L.quellkeys(r[4], DEFS)
        for th in bestaetigt_themen.get(lid, []):
            for ent in daten['HB'].get(th, []):
                if 'gilt_ab' not in ent:
                    ent['bestaetigt_2027'] = {'id': 'HB-' + lid, 'text': 'unverändert ab 01.01.2027 laut Gesetzblatt Nr. 93 vom 12.09.2026 / Drucksache 21/1943', 'quelle': keys}

    # Datei 23: Bremer Solarzeilen (Abruf nur als Dateidatum) und Bundesregeln
    bund_solar = []
    bremen_solar = {
        'Gebäude, Dach, Außenwand': 'solar_verfahrensfrei',
        'gebäudeunabhängige Anlagen': 'solar_freistehend',
        'Abstand Brandwand: höchstens 0,30': 'pv_brandwand',
        'Abstand Brandwand: alle übrigen': 'pv_brandwand_125',
        'Hochhaus': 'hochhaus',
        'Denkmal': 'denkmal',
    }
    for kopf, rows, _ in L.tabellen('23_solar_regeln.md'):
        if kopf[0] != 'kW-Schwelle':
            continue
        for r in rows:
            schwelle, fall, was, para, quelle, status = r
            th = None
            for pre, t in bremen_solar.items():
                if schwelle.startswith(pre):
                    th = t
            if schwelle.startswith('Bremer Solarpflicht'):
                continue   # Suchtreffer; Solarpflicht kommt aus HB-P06..P08 (Gesetzblatt gelesen)
            if th:
                ent = collections.OrderedDict()
                ent['id'] = '23:' + th
                ent['wert'] = None
                m = re.search(r'Mindestens ' + NUM + r' m Abstand', was)
                if th in ('pv_brandwand',) and m:
                    ent['wert'] = zehntel(dez(m.group(1)))
                if th == 'pv_brandwand_125':
                    ent['wert'] = 1.25
                ent['wert_text'] = was
                ent['einheit'] = 'm' if ent['wert'] is not None else '(Regel)'
                ent['gilt_fuer'] = schwelle + ' | ' + fall
                ent['paragraf'] = para
                ent['wortlaut'] = None
                ent['wortlaut_hinweis'] = 'Bericht 23 enthält nur Kurzzitate und Zusammenfassung in der Spalte "Was gilt"'
                ent['quelle'] = ['BREM-23']
                ent['quelle_text'] = quelle
                ent['abruf'] = '2026-10-26'
                ent['abruf_hinweis'] = 'Dateidatum von Bericht 23 (keine Abrufspalte)'
                ent['status'] = 'geprüft' if status.startswith('geprüft') and 'prüfen' not in status and 'offen' not in status else 'prüfen vor Nutzung'
                if status != 'geprüft':
                    ent['hinweis'] = status
                if th in ('solar_verfahrensfrei', 'denkmal'):
                    add('HB', th, ent)
                    if th == 'solar_verfahrensfrei':
                        ent['gilt_bis'] = '2026-12-31'
                else:
                    add('HB', th, ent)
            else:
                bund_solar.append(collections.OrderedDict([
                    ('schwelle', schwelle), ('fall', fall), ('was_gilt', was), ('paragraf', para),
                    ('quelle_text', quelle), ('status', 'geprüft' if status.startswith('geprüft') and 'prüfen' not in status and 'Steuerberater' not in status else 'prüfen vor Nutzung'),
                    ('hinweis', status), ('abruf', '2026-10-26'), ('abruf_hinweis', 'Dateidatum von Bericht 23 (keine Abrufspalte)')]))
    QUELLEN['BREM-23'] = {'titel': 'Bericht 23_solar_regeln.md (Bremen, Quellen je Zeile im Feld quelle_text)', 'url': None}

    # Fehlende Quellen-Schluessel aufnehmen (ehrlich markiert)
    # Luecken auffuellen
    gruppe_sl = 'Saarland: amtlicher Landesrecht-Text nicht abrufbar (Bericht 26), keine Werte gelesen'
    for land in LAENDER:
        for th in KERN:
            if th in daten[land]:
                continue
            if land == 'SL':
                grund = gruppe_sl
            elif th in NICHT_BEAUFTRAGT and land != 'HB':
                grund = 'Thema für diese Ländergruppe nicht beauftragt (Landesbericht ohne Zeile)'
            elif land == 'HB' and th == 'umwehrung':
                grund = 'Bericht 20 hat keinen Bremer Umwehrungs-Wert; Bericht 27 (HB-B12) bestätigt § 38 nur pauschal ohne Wertzeile'
            elif land == 'HB' and th in ('denkmal_innen',):
                grund = 'für Bremen im Bericht keine eigene Zeile'
            else:
                grund = 'im Landesbericht keine Zeile (Thema nicht gefunden oder nicht erfasst)'
            ent = collections.OrderedDict([('status', 'Lücke'), ('wert', None), ('luecke_grund', grund), ('quelle', ['KEINE']), ('abruf', '2026-10-26'), ('abruf_hinweis', 'Berichtsdatum, kein Abruf (nichts gefunden)')])
            daten[land][th] = [ent]

    # Rettungsfenster-Hoehe aus Wortlaut ergaenzt bereits in parse_wert; Reihenfolge der Themen nach Register
    laender_out = collections.OrderedDict()
    for land, name in LAENDER.items():
        kurz, fassung, qk, _u = LBO[land]
        q = QUELLEN.get(qk, {})
        regeln = collections.OrderedDict()
        for th in THEMEN:
            if th in daten[land]:
                lst = daten[land][th]
                lst.sort(key=lambda e: (e.get('gilt_ab') or ''))
                regeln[th] = lst
        laender_out[land] = collections.OrderedDict([
            ('name', name),
            ('lbo', collections.OrderedDict([('titel', kurz), ('fassung', fassung), ('url', q.get('url')), ('quelle', qk)])),
            ('regeln', regeln)])

    # Quellen: nur benutzte Schluessel
    benutzt = set()
    for land in laender_out.values():
        for lst in land['regeln'].values():
            for e in lst:
                benutzt.update(e.get('quelle', []))
    for e in richtwerte:
        benutzt.update(e.get('quelle', []))
    for land, (kurz, fassung, qk, _u) in LBO.items():
        benutzt.add(qk)
    quellen_out = collections.OrderedDict()
    for k in QUELLEN:
        if k in benutzt:
            quellen_out[k] = QUELLEN[k]
    fehlend = sorted(k for k in benutzt if k not in quellen_out)

    obj = collections.OrderedDict()
    obj['stand'] = '2026-10-27'
    obj['hinweis'] = ('Aus den Recherche-Berichten 20, 23, 24-27 (Abrufe am 26.10.2026) übernommen, nicht von Hand ändern. '
                      'Status: "geprüft" = amtlichen Text gelesen; "prüfen vor Nutzung" = Sekundärquelle, Entwurf, Auslegung oder unsicher; '
                      '"Lücke" = nicht gelesen oder nicht gefunden. Jede Regel ist eine Liste von Einträgen (mehrere bei Fassungswechsel, z. B. Bremen ab 2027-01-01). '
                      'Keine Rechtsberatung; vor einem Bauvorhaben die Bauaufsicht fragen.')
    obj['themen'] = collections.OrderedDict((k, collections.OrderedDict([('titel', v[0]), ('gruppe', v[1])])) for k, v in THEMEN.items())
    obj['kern'] = KERN
    obj['quellen'] = quellen_out
    obj['bund'] = collections.OrderedDict([
        ('hinweis', 'Bundesweite Planungsrichtwerte (DIN 18040-2 über Sekundärquellen, Ratgeber-Faustregeln) und Solar-/Steuerschwellen. Kein Landesrecht; Richtwerte sind keine Rechtsvorgabe.'),
        ('richtwerte', richtwerte), ('solar', bund_solar)])
    obj['laender'] = laender_out

    kopf = ('/* Bauregeln je Bundesland für die Grundriss- und Umbauprüfung, erzeugt von erzeuger/bauregeln_daten.py aus recherche/20, 23, 24-27 (nicht von Hand ändern).\n'
            '   Aufbau: laender[Kürzel].regeln[thema] = Liste von Einträgen {id, wert, wert_text, einheit, gilt_fuer, paragraf, wortlaut, quelle[], abruf, status, gilt_ab, gilt_bis, hinweis}.\n'
            '   Lücken tragen status "Lücke" und luecke_grund. Quellen unter quellen[Schlüssel]. Werte werden nie umgerechnet. */')
    pfad = os.path.join(L.DATEN, 'bauregeln_voll.js')
    kopf_voll = kopf.replace('Bauregeln je Bundesland', 'VOLLE Fassung (nicht in die Seite eingebettet, nur fürs Repository) der Bauregeln je Bundesland')
    groesse = L.js_schreiben(pfad, kopf_voll, 'bauregeln_voll', obj)
    schlank = schlank_bauen(obj)
    kopf_s = ('/* Bauregeln je Bundesland, SCHLANKE Fassung für die Seite, erzeugt von erzeuger/bauregeln_daten.py aus recherche/20, 23, 24-27, 38 (nicht von Hand ändern).\n'
              '   Aufbau: laender[Kürzel].regeln[thema] = Liste von Einträgen {id, wert, einheit, gilt_fuer, paragraf, text, wortlaut (nur Kernregeln), quelle[], abruf, status, gilt_ab, gilt_bis, hinweis}.\n'
              '   Den vollen Wortlaut aller Zeilen enthält daten/bauregeln_voll.js (nicht eingebettet). Status: geprüft, geprüft (Landesportal), prüfen vor Nutzung, Lücke. */')
    pfad_s = os.path.join(L.DATEN, 'bauregeln.js')
    groesse_s = L.js_schreiben(pfad_s, kopf_s, 'bauregeln', schlank)
    print('Schlank:', pfad_s, groesse_s, 'Bytes')

    # Ausgabe
    print('Datei:', pfad, groesse, 'Bytes')
    print('Parse-Fehler:', L.FEHLER)
    print('Nicht zugeordnet:', unmapped)
    print('Quellen-Schluessel ohne Definition:', fehlend)
    print('Nicht aufgeloeste Quellen:', dict(OFFEN))
    print('%-3s %8s %8s %8s %8s' % ('LD', 'geprüft', 'prüfen', 'Lücke', 'Einträge'))
    tot = collections.Counter()
    for land in LAENDER:
        c = collections.Counter()
        for lst in laender_out[land]['regeln'].values():
            for e in lst:
                c[e['status']] += 1
        tot.update(c)
        print('%-3s %8d %8d %8d %8d' % (land, c['geprüft'], c['prüfen vor Nutzung'], c['Lücke'], sum(c.values())))
    print('Summe', dict(tot))
    print('Richtwerte', len(richtwerte), 'Bund-Solar', len(bund_solar))


if __name__ == '__main__':
    main()
