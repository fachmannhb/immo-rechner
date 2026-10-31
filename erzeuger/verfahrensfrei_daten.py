# Erzeugt daten/verfahrensfrei.js aus den Werte-Tabellen der Berichte 34 (Bayern G01-G10), 35 und 36 (nicht von Hand aendern).
# Aufruf: python erzeuger/verfahrensfrei_daten.py
import sys, io, os, re, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import regel_lib as L

LAENDER = collections.OrderedDict([
    ('BW', 'Baden-Württemberg'), ('BY', 'Bayern'), ('BE', 'Berlin'), ('BB', 'Brandenburg'),
    ('HB', 'Bremen'), ('HH', 'Hamburg'), ('HE', 'Hessen'), ('MV', 'Mecklenburg-Vorpommern'),
    ('NI', 'Niedersachsen'), ('NW', 'Nordrhein-Westfalen'), ('RP', 'Rheinland-Pfalz'), ('SL', 'Saarland'),
    ('SN', 'Sachsen'), ('ST', 'Sachsen-Anhalt'), ('SH', 'Schleswig-Holstein'), ('TH', 'Thüringen')])

STRUKTUREN = collections.OrderedDict([
    ('gartenhaus', 'Gartenhaus / Gebäude ohne Aufenthaltsraum'),
    ('gartengeraetehaus', 'Gartengerätehaus (eigene Zeile, Bremen)'),
    ('gartenlaube_kleingarten', 'Gartenlaube im Kleingarten'),
    ('garage_carport', 'Garage / Carport / Fahrradüberdachung'),
    ('terrassendach_wintergarten', 'Terrassenüberdachung / Wintergarten / Vorbau'),
    ('balkon', 'Balkonüberdachung / Balkonverglasung'),
    ('pool', 'Pool / Schwimmbecken / Wasserbecken'),
    ('kleinwind', 'Kleinwindanlage'),
    ('gewaechshaus', 'Gewächshaus'),
    ('stall', 'Stall / Tierhaltung'),
    ('brunnen', 'Brunnen'),
    ('solar', 'Solaranlage freistehend / ohne nähere Angabe'),
    ('solar_dach', 'Solaranlage auf Dach / Wand'),
    ('mauer', 'Mauer / Einfriedung / Stützmauer'),
    ('gartenanlagen', 'Gartenanlagen, Pergola, Bienenstand u. Ä.'),
    ('sauna', 'Sauna'),
    ('waermepumpe', 'Wärmepumpe'),
    ('feuerstaette', 'Feuerstätte / Feuerungsanlage'),
    ('kleinklaeranlage', 'Abwasseranlage / Kleinkläranlage'),
    ('regenwasserbehaelter', 'Regenwasserbehälter'),
    ('erdkeller_hohlraum', 'Künstlicher Hohlraum / Erdkeller'),
    ('brennholz', 'Brennholzplatz'),
    ('sonstiges', 'Sonstiges'),
])
KERN = ['gartenhaus', 'garage_carport', 'terrassendach_wintergarten', 'pool', 'kleinwind', 'gewaechshaus', 'stall', 'brunnen', 'solar', 'mauer']

REGELN = [  # (Schluessel, Regex ueber den Bauwerk-Text), Reihenfolge wichtig
    ('gartenlaube_kleingarten', r'Laube|Kleingarten'),
    ('gartengeraetehaus', r'Gartengerät'),
    ('gartenhaus', r'Gartenhaus|^Gebäude'),
    ('sauna', r'Sauna'),
    ('solar', r'(?i)^(?=.*solar)(?:(?!dach|wand|balkon).)*$|solar.*(?:gebäudeunabh|freistehend|frei stehend)'),
    ('solar_dach', r'(?i)solar'),
    ('kleinwind', r'(?i)wind(?!ow)'),
    ('gewaechshaus', r'Gewächshaus'),
    ('stall', r'Stall|Geflügel|Tierhaltung'),
    ('brunnen', r'Brunnen'),
    ('waermepumpe', r'Wärmepumpe'),
    ('kleinklaeranlage', r'Abwasser|Kläranlage'),
    ('regenwasserbehaelter', r'Regenwasser'),
    ('brennholz', r'Brennholz'),
    ('feuerstaette', r'Feuerst|Feuerung'),
    ('erdkeller_hohlraum', r'Hohlraum'),
    ('pool', r'Schwimm|Wasserbecken|Pool'),
    ('garage_carport', r'Garage|Carport'),
    ('balkon', r'Balkon'),
    ('gartenanlagen', r'Pergola|Gartenanlagen'),
    ('terrassendach_wintergarten', r'Terrasse|Wintergarten|Vorbau'),
    ('mauer', r'(?i)mauer|einfriedung|sichtschutz'),
    ('gartenhaus', r'Gartenhaus|Gebäude'),
]

BY_KAT = {'G01': 'gartenhaus', 'G02': 'garage_carport', 'G03': 'terrassendach_wintergarten', 'G04': 'kleinwind', 'G05': 'pool',
          'G06': 'pool', 'G07': 'brunnen', 'G08': 'mauer', 'G09': 'solar', 'G10': 'gewaechshaus'}

PARA_PREFIX = {
    'BW': 'Anhang 1 zu § 50 Abs. 1 LBO', 'BE': '§ 61 Abs. 1 BauO Bln', 'BB': '§ 61 Abs. 2 BbgBO',
    'HB': '§ 61 Abs. 1 BremLBO', 'HH': 'HBauO § 61, Anlage', 'HE': 'HBO § 63, Anlage',
    'MV': '§ 61 Abs. 1 LBauO M-V', 'NI': 'NBauO § 60 Abs. 1, Anhang',
}

QUELLEN = collections.OrderedDict()
OFFEN = collections.Counter()
UNIT_RE = re.compile(r'(?<![\w])(m³|m²|m|kW)(?![\w²³])')
NUMRE = r'(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)'
ZAHL_EINHEIT = re.compile(NUMRE + r'\s*(m³|m²|m|kW)(?![\w²³])?')


def kategorie(text):
    for key, rx in REGELN:
        if re.search(rx, text):
            return key
    return 'sonstiges'


def status_norm(z):
    z = z.strip()
    if z.startswith('geprüft') and 'prüfen vor Nutzung' not in z and 'unsicher' not in z and 'nicht übernehmen' not in z:
        return 'geprüft'
    return 'prüfen vor Nutzung'


def parse_vf(w, einheit):
    """Gibt dict(art, wert, einheit, ausserbereich_wert, werte_alle) zurueck. Nie umrechnen."""
    t = w.strip()
    low = t.lower()
    erg = collections.OrderedDict()
    if low.startswith(('ja_ohne_grenze', 'ohne maß', 'ohne höhengrenze', 'verfahrensfrei, ohne', 'ohne größenangabe', 'ohne grenze')):
        erg['art'] = 'ohne_grenze'
    elif low.startswith('nicht_frei') or low.startswith('nicht verfahrensfrei'):
        erg['art'] = 'nicht_frei'
    elif low.startswith(('nicht_genannt', 'nicht gelistet', 'nicht ausdrücklich')):
        erg['art'] = 'nicht_genannt'
    elif low.startswith('kein_eigener_tatbestand'):
        erg['art'] = 'kein_eigener_tatbestand'
    elif low.startswith(('nur betriebe', 'nur mobile', 'nur für betriebe')):
        erg['art'] = 'nur_betriebe'
    elif re.search(r'\d', t):
        erg['art'] = 'grenze'
    else:
        erg['art'] = 'text'
    erg['wert'] = None
    erg['einheit'] = None
    if erg['art'] == 'grenze':
        m = re.search(NUMRE, t)
        erg['wert'] = L.zahl(m.group(1))
        mu = re.match(r'\s*(m³|m²|m|kW)(?![\w²³])', t[m.end():])
        if mu:
            erg['einheit'] = mu.group(1)
        else:
            mu = UNIT_RE.search(einheit)
            erg['einheit'] = mu.group(1) if mu else None
    # Aussenbereich-Sonderwert
    # nur die Form "N [Innenbereich]; M AB" / "N; im AB M" / "ohne Maß; im AB M m²" (erstes Segment einfach, zweites nennt den Aussenbereich)
    if ';' in t and erg['art'] in ('grenze', 'ohne_grenze'):
        erstes, zweites = t.split(';', 1)
        if (re.match(r'^\s*\d+\s*(?:Innenbereich)?\s*$', erstes) or erstes.lower().startswith('ohne maß')) and re.search(r'\bAB\b|Außenbereich', zweites):
            m = (re.search(NUMRE + r'\s*(?:m[²³])?\s*(?:im\s+)?(?:AB|Außenbereich)\b', zweites)
                 or re.search(r'(?:im\s+)?(?:AB|Außenbereich)\D{0,70}?' + NUMRE, zweites))
            if m:
                erg['ausserbereich_wert'] = L.zahl(m.group(1))
    # weitere Zahlen mit Einheit (z. B. Tiefe, Hoehe) als Liste
    alle = [{'wert': L.zahl(a), 'einheit': b} for a, b in re.findall(NUMRE + r'\s*(m³|m²|m|kW)(?![\w²³])', t)]
    if len(alle) > 1:
        erg['werte_alle'] = alle
    return erg


def korrigiere(p, bau, wert):
    """Mehrere Bauwerke in einer Zeile: die erste Zahl gehoert dann nicht sicher zum Bauwerk -> kein Hauptwert."""
    w = wert.strip()
    if p['art'] == 'grenze' and (w.startswith('–') or (';' in bau and ';' in w)):
        p['art'] = 'text'
        p['wert'] = None
        p['einheit'] = None
        p['mehrere_bauwerke'] = True
        p.pop('ausserbereich_wert', None)
    return p


def paragraf_35(land, fund):
    f = fund.strip()
    if re.match(r'^(§|Art\.|Anhang|Anlage|MBO)', f):
        return f
    return PARA_PREFIX.get(land, '') + ', ' + f


def add_entry(daten, land, ent, text):
    daten[land].setdefault(kategorie(text), []).append(ent)


def betrieb(bed):
    """Hinweisflag: die Bedingung nennt land-/forstwirtschaftliche Betriebe (Wert gilt dann evtl. nicht fuer den Privatgarten)."""
    return bool(re.search(r'(?i)(?:nur|für)[^;]{0,40}(?:land-?|forst|betrieb|erwerbs)|Betrieb', bed or ''))


def bereich(bed):
    """Hilfsfeld: wie der Text den Aussenbereich behandelt (nur Hinweis, Text bleibt in bedingung)."""
    b = bed or ''
    if re.search(r'außer(?: im)? (?:AB|Außenbereich)|nicht (?:im )?(?:AB|Außenbereich)|ausgenommen im AB', b):
        return 'nicht_im_aussenbereich'
    if re.search(r'nur (?:im )?Innenbereich|Innenbereich;|nur Innenbereich', b):
        return 'nur_innenbereich'
    return None


def kuerzen(s, n):
    if s is None or not isinstance(s, str) or len(s) <= n:
        return s
    return s[:n].rsplit(' ', 1)[0].rstrip(' ,;:.') + ' …'


VOLL_BEDINGUNG = None   # None = bei allen Bausteinen steht die ganze Bedingung zusätzlich im Feld bedingung_voll (Karten Anbau und Grundstück zeigen sie aufklappbar); sonst Tupel der Bausteine


def schlank_eintrag(e, st=None):
    o = collections.OrderedDict()
    if e['status'] != 'geprüft':     # "geprüft" ist der Standard (status_std)
        o['status'] = e['status']
    if e['status'] == 'Lücke':
        o['luecke_grund'] = kuerzen(e.get('luecke_grund'), 80)
    else:
        o['bauwerk'] = kuerzen(e.get('bauwerk'), 42)
        o['art'] = e.get('art')
        if e.get('wert') is not None:
            o['wert'] = e['wert']
        if e.get('einheit'):
            o['einheit'] = e['einheit']
        if e.get('wert') is None and e.get('wert_roh'):
            o['wert_roh'] = kuerzen(e['wert_roh'], 60)
        if e.get('bedingung'):
            o['bedingung'] = kuerzen(e['bedingung'], 30)
            if (VOLL_BEDINGUNG is None or st in VOLL_BEDINGUNG) and o['bedingung'] != e['bedingung']:
                o['bedingung_voll'] = e['bedingung']
        for k in ('aussenbereich', 'ausserbereich_wert', 'mehrere_bauwerke', 'tiefe_max', 'nur_vorueber'):
            if e.get(k) not in (None, False):
                o[k] = e[k]
        if e.get('paragraf'):
            o['paragraf'] = kuerzen(e['paragraf'], 28)
        if e.get('hinweis'):
            o['hinweis'] = kuerzen(e['hinweis'], 24)
    o['quelle'] = e.get('quelle') or ['KEINE']
    if e.get('abruf') != '2026-10-27':   # Standard-Abrufdatum steht einmal oben (abruf_std)
        o['abruf'] = e.get('abruf')
    return o


def schlank_bauen(obj):
    s = collections.OrderedDict()
    for k in ('stand', 'hinweis'):
        s[k] = obj[k]
    s['status_std'] = 'geprüft'
    s['abruf_std'] = '2026-10-27'
    for k in ('arten', 'strukturen', 'kern'):
        s[k] = obj[k]
    s['quellen'] = collections.OrderedDict(
        (k, collections.OrderedDict([(a, (kuerzen(b, 45) if a == 'titel' else b)) for a, b in v.items()])) for k, v in obj['quellen'].items())
    s['laender'] = collections.OrderedDict(
        (c, collections.OrderedDict([('name', l['name']),
                                     ('strukturen', collections.OrderedDict((st, [schlank_eintrag(e, st) for e in lst]) for st, lst in l['strukturen'].items()))]))
        for c, l in obj['laender'].items())
    return s


def main():
    daten = {k: collections.OrderedDict() for k in LAENDER}
    muster = []
    quellen35 = {}
    bauordnung = {}

    # --- Kopfangaben aus Bericht 35 (Quellenuebersicht) ---
    for kopf, rows, _ in L.tabellen('35_verfahrensfrei_1.md'):
        if kopf[0] == 'Kürzel' and kopf[1] == 'Land':
            for r in rows:
                code = r[0]
                bauordnung[code] = {'fassung': r[2], 'quellenart': r[3], 'status_hinweis': r[4]}
    # --- Bericht 36: Quellenkuerzel ---
    q36 = L.quellen_aus_datei('36_verfahrensfrei_2.md')
    for k, v in q36.items():
        QUELLEN[k] = v

    # --- Bericht 35 ---
    srcidx = {}
    for kopf, rows, _ in L.tabellen('35_verfahrensfrei_1.md'):
        if kopf[0] != 'id':
            continue
        for r in rows:
            _id, bau, wert, einheit, geltung, fund, abruf, wort, quelle, status = r
            code = _id.split('-')[0]
            u = L.URL_RE.search(quelle)
            url = L.url_bereinigen(u.group(0)) if u else None
            titel = re.sub(r'[\s,]+$', '', quelle[:u.start()]) if u else quelle
            if code == 'MBO':
                key = 'MBO'
            else:
                k2 = (code, titel, url)
                if k2 not in srcidx:
                    n = sum(1 for k in srcidx if k[0] == code)
                    srcidx[k2] = '%s-35' % code if n == 0 else '%s-35%s' % (code, chr(97 + n))
                key = srcidx[k2]
            QUELLEN.setdefault(key, {'titel': titel, 'url': url})
            p = korrigiere(parse_vf(wert, einheit), bau, wert)
            ent = collections.OrderedDict()
            ent['id'] = _id
            ent['bauwerk'] = bau
            ent.update(p)
            ent['wert_roh'] = wert
            ent['einheit_roh'] = einheit
            ent['bedingung'] = geltung
            b = bereich(geltung)
            if b:
                ent['aussenbereich'] = b
            if betrieb(geltung):
                ent['betrieb_hinweis'] = True
            ent['paragraf'] = paragraf_35(code, fund) if code != 'MBO' else fund
            ent['wortlaut'] = wort
            ent['quelle'] = [key]
            ent['abruf'] = L.iso(abruf)
            ent['status'] = status_norm(status)
            if status.strip() != 'geprüft':
                ent['hinweis'] = status
            if code == 'MBO':
                muster.append((kategorie(bau), ent))
            elif code in LAENDER:
                add_entry(daten, code, ent, bau)
            else:
                print('WARN unbekanntes Land in 35:', _id)

    # --- Bericht 36 ---
    for kopf, rows, _ in L.tabellen('36_verfahrensfrei_2.md'):
        if kopf[0] != 'id':
            continue
        for r in rows:
            _id, landname, bau, wert, einheit, bed, para, quelle, abruf, status, wort = r
            code = _id.split('-')[0]
            keys, offen = L.quellkeys(quelle, QUELLEN)
            for o in offen:
                OFFEN[o] += 1
            p = korrigiere(parse_vf(wert, einheit), bau, wert)
            ent = collections.OrderedDict()
            ent['id'] = _id
            ent['bauwerk'] = bau
            ent.update(p)
            ent['wert_roh'] = wert
            ent['einheit_roh'] = einheit
            ent['bedingung'] = bed
            b = bereich(bed)
            if b:
                ent['aussenbereich'] = b
            if betrieb(bed):
                ent['betrieb_hinweis'] = True
            ent['paragraf'] = para
            ent['wortlaut'] = wort
            ent['quelle'] = keys
            if offen:
                ent['quelle_roh'] = quelle
            ent['abruf'] = L.iso(abruf)
            ent['status'] = status_norm(status)
            if status.strip() != 'geprüft':
                ent['hinweis'] = status
            if code not in LAENDER:
                print('WARN unbekanntes Land in 36:', _id)
                continue
            add_entry(daten, code, ent, bau)

    # --- Bericht 41: Bremen Wintergarten und Terrassenüberdachung (ersetzt HB-V04 aus Bericht 35, kein zweiter Eintrag) ---
    QUELLEN['HB-41'] = {'titel': 'GBl. Bremen Nr. 60 v. 25.06.2024, S. 437', 'url': 'https://gesetzblatt.bremen.de/fastmedia/218/2024_06_25_GBl_Nr_0060_signed.pdf'}
    hb_neu = collections.OrderedDict()
    hb_neu['id'] = 'HB-41-W01'
    hb_neu['bauwerk'] = 'Terrasse, Veranda, Wintergarten (Vorbau)'   # muss „Terrasse“ und „Wintergarten“ innerhalb von 42 Zeichen enthalten (Muster der Karten)
    hb_neu['art'] = 'grenze'
    hb_neu['wert'] = 30
    hb_neu['einheit'] = 'm²'
    hb_neu['tiefe_max'] = 3.5            # zweite Bedingung „und“ (beide Grenzen gelten), Einheit m Tiefe
    hb_neu['nur_vorueber'] = True        # Wortlaut: „nur zum vorübergehenden Aufenthalt bestimmte Vorbauten“ → beheizter Wintergarten bleibt grau
    hb_neu['wert_roh'] = '30 m² Grundfläche und 3,50 m Tiefe'
    hb_neu['einheit_roh'] = 'm² / m'
    hb_neu['bedingung'] = ('vor die Außenwand vortretende eingeschossige Gebäudeteile ohne Feuerstätten; Wintergärten und Veranden nur überwiegend verglast und nur zum vorübergehenden Aufenthalt; '
                           'nicht im Geltungsbereich örtlicher Bauvorschriften nach § 86 Abs. 1 Nr. 1')
    hb_neu['paragraf'] = '§ 61 Abs.1 Nr.1 h bb BremLBO'   # höchstens 28 Zeichen (sonst kürzt schlank_eintrag); voll: § 61 Abs. 1 Nr. 1 Buchst. h Doppelbuchst. bb
    hb_neu['wortlaut'] = ('Terrassen einschließlich möglicher Überdachungen sowie überwiegend verglaste, nur zum vorübergehenden Aufenthalt bestimmte Vorbauten (Veranden, Wintergärten) '
                          'bis zu einer Grundfläche von 30 Quadratmeter und einer Tiefe bis 3,50 Meter; Einleitung Buchst. h: vor die Außenwand eines Gebäudes vortretende eingeschossige Gebäudeteile ohne Feuerstätten, '
                          'außer im Geltungsbereich örtlicher Bauvorschriften nach § 86 Absatz 1 Nummer 1')
    hb_neu['quelle'] = ['HB-41']
    hb_neu['abruf'] = '2026-10-31'
    hb_neu['status'] = 'geprüft'
    hb_liste = daten['HB'].get('terrassendach_wintergarten', [])
    hb_stellen = [i for i, e in enumerate(hb_liste) if e.get('id') == 'HB-V04']
    if len(hb_stellen) != 1:
        print('FEHLER: HB-V04 nicht genau einmal gefunden:', hb_stellen)
        raise SystemExit(1)
    hb_liste[hb_stellen[0]] = hb_neu

    # --- Bericht 34: Bayern G01-G10 ---
    QUELLEN['BY-34'] = {'titel': 'BayBO Art. 57 (Verfahrensfreie Bauvorhaben, Beseitigung von Anlagen), BAYERN.RECHT', 'url': 'https://www.gesetze-bayern.de/Content/Document/BayBO-57'}
    for kopf, rows, _ in L.tabellen('34_grundstueck_autark.md'):
        if kopf[0] != 'id':
            continue
        for r in rows:
            _id, wert, einheit, gilt, quelle, abruf, status = r
            if not re.match(r'^G\d\d$', _id):
                continue
            p = parse_vf(wert, einheit)
            ent = collections.OrderedDict()
            ent['id'] = 'BY-' + _id
            m = re.search(r'Nr\. ([\w ]+)', gilt)
            ent['bauwerk'] = STRUKTUREN[BY_KAT[_id]] + ' (' + gilt + ')'
            ent.update(p)
            ent['wert_roh'] = wert
            ent['einheit_roh'] = einheit
            ent['bedingung'] = gilt + ('; ' + einheit if re.search(r'außer|nur ', einheit) else '')
            b = bereich(einheit + ' ' + wert)
            if b:
                ent['aussenbereich'] = b
            ent['paragraf'] = 'Art. 57 Abs. 1 BayBO' + (', Nr. ' + m.group(1) if m else '')
            ent['wortlaut'] = None
            ent['wortlaut_hinweis'] = 'Bericht 34 enthält zu G01-G10 keinen wörtlichen Satz (nur Zahlen und Fundstelle)'
            ent['quelle'] = ['BY-34']
            ent['abruf'] = L.iso(abruf)
            ent['status'] = status_norm(status)
            daten['BY'].setdefault(BY_KAT[_id], []).append(ent)

    # --- Luecken ---
    spezial = {
        ('MV', 'garage_carport'): 'Bericht 35: Garage im MV-Text ausdrücklich nicht gelistet (siehe offene Punkte dort); nicht als „verfahrensfrei“ annehmen',
        ('BY', 'stall'): 'Bericht 34 nennt Ställe nur im Fließtext (Art. 57 Abs. 1 Nr. 1c: nur Betriebe nach § 35 BauGB, nicht privat), keine Tabellenzeile; vor Nutzung prüfen',
        ('BY', 'terrassendach_wintergarten'): None,
    }
    for land in LAENDER:
        for k in KERN:
            if k in daten[land]:
                continue
            grund = spezial.get((land, k)) or 'im Bericht keine Zeile (nicht gefunden oder nicht ausdrücklich gelistet)'
            daten[land][k] = [collections.OrderedDict([('status', 'Lücke'), ('art', 'luecke'), ('wert', None), ('einheit', None), ('luecke_grund', grund), ('quelle', ['KEINE']), ('abruf', '2026-10-27'), ('abruf_hinweis', 'Berichtsdatum, kein Abruf (nichts gefunden)')])]
    QUELLEN['KEINE'] = {'titel': 'keine Quelle (Lücke; siehe Grund)', 'url': None}

    # --- Ausgabe zusammenbauen ---
    laender_out = collections.OrderedDict()
    for land, name in LAENDER.items():
        s = collections.OrderedDict()
        for k in STRUKTUREN:
            if k in daten[land]:
                s[k] = daten[land][k]
        if land in bauordnung:
            bo = bauordnung[land]
        elif land == 'BY':
            bo = {'fassung': 'BayBO Art. 57 Abs. 1, Text gültig ab 01.05.2026', 'quellenart': 'amtlich (gesetze-bayern.de), Bericht 34', 'status_hinweis': 'geprüft'}
        else:
            qk = {'NW': 'Q-NW26', 'RP': 'Q-RP25', 'SL': 'Q-SL', 'SN': 'Q-SN', 'ST': 'Q-ST', 'SH': 'Q-SH', 'TH': 'Q-TH'}[land]
            bo = {'fassung': QUELLEN[qk]['titel'], 'quellenart': 'siehe Quelle ' + qk, 'status_hinweis': 'je Zeile'}
        laender_out[land] = collections.OrderedDict([('name', name), ('bauordnung', bo), ('strukturen', s)])

    benutzt = set()
    for d in laender_out.values():
        for lst in d['strukturen'].values():
            for e in lst:
                benutzt.update(e.get('quelle', []))
    for _k, e in muster:
        benutzt.update(e['quelle'])
    quellen_out = collections.OrderedDict((k, v) for k, v in QUELLEN.items() if k in benutzt)
    fehlend = sorted(k for k in benutzt if k not in quellen_out)

    muster_out = collections.OrderedDict()
    for k, e in muster:
        muster_out.setdefault(k, []).append(e)

    obj = collections.OrderedDict()
    obj['stand'] = '2026-10-27'
    obj['hinweis'] = ('Verfahrensfreie Garten- und Grundstücksbauten je Bundesland, aus den Berichten 34 (Bayern), 35 und 36 (Abrufe am 27.10.2026) übernommen, Bremen Terrasse/Wintergarten aus Bericht 41 (Abruf 31.10.2026), nicht von Hand ändern. '
                      'Verfahrensfrei heißt nicht regelfrei: Abstandsflächen, Bebauungsplan, Gestaltungs- und Denkmalschutzsatzungen und Naturschutz gelten weiter. '
                      'Einheiten werden nie umgerechnet: m³ (Brutto-Rauminhalt) und m² (Grundfläche) sind verschiedene Maße; die Einheit steht an jedem Wert. '
                      '"Außenbereich" ist meist die Ausnahme (Feld aussenbereich bzw. ausserbereich_wert). Keine Rechtsberatung; vor einem Bau die untere Bauaufsicht fragen.')
    obj['arten'] = collections.OrderedDict([
        ('grenze', 'verfahrensfrei bis zum Wert (Einheit beachten)'), ('ohne_grenze', 'verfahrensfrei ohne Größenangabe'),
        ('nicht_frei', 'der Text nimmt diesen Fall aus (nicht verfahrensfrei)'), ('nicht_genannt', 'im gelesenen Text nicht enthalten'),
        ('kein_eigener_tatbestand', 'kein eigener Tatbestand (Auslegung)'), ('nur_betriebe', 'nur für land-/forstwirtschaftliche Betriebe'),
        ('text', 'Text ohne Zahl, siehe wert_roh'), ('luecke', 'nicht gefunden oder nicht gelesen, siehe luecke_grund')])
    obj['strukturen'] = collections.OrderedDict((k, v) for k, v in STRUKTUREN.items())
    obj['kern'] = KERN
    obj['quellen'] = quellen_out
    obj['muster'] = muster_out
    obj['laender'] = laender_out

    kopf = ('/* Verfahrensfreie Garten- und Grundstücksbauten je Bundesland, erzeugt von erzeuger/verfahrensfrei_daten.py aus recherche/34, 35, 36 (nicht von Hand ändern).\n'
            '   Aufbau: laender[Kürzel].strukturen[baustein] = Liste von Einträgen {id, bauwerk, art, wert, einheit, wert_roh, einheit_roh, bedingung, paragraf, wortlaut, quelle[], abruf, status}.\n'
            '   art "grenze" = verfahrensfrei bis wert (einheit m³, m² oder m, nie umgerechnet). Lücken tragen status "Lücke" und luecke_grund. */')
    pfad = os.path.join(L.DATEN, 'verfahrensfrei_voll.js')
    groesse = L.js_schreiben(pfad, kopf.replace('Verfahrensfreie Garten', 'VOLLE Fassung (nicht eingebettet, nur fürs Repository) der verfahrensfreien Garten'), 'verfahrensfrei_voll', obj)
    schlank = schlank_bauen(obj)
    kopf_s = ('/* Verfahrensfreie Garten- und Grundstücksbauten je Bundesland, SCHLANKE Fassung für die Seite, erzeugt von erzeuger/verfahrensfrei_daten.py (nicht von Hand ändern).\n'
              '   Aufbau: laender[Kürzel].strukturen[baustein] = Liste von Einträgen {bauwerk, art, wert, einheit, wert_roh, bedingung, aussenbereich, ausserbereich_wert, paragraf, quelle[], abruf, status, hinweis}.\n'
              '   Der wörtliche Gesetzestext je Zeile steht in daten/verfahrensfrei_voll.js (nicht eingebettet); in der Seite gilt der Link zur Quelle. */')
    pfad_s = os.path.join(L.DATEN, 'verfahrensfrei.js')
    groesse_s = L.js_schreiben(pfad_s, kopf_s, 'verfahrensfrei', schlank)
    print('Schlank:', pfad_s, groesse_s, 'Bytes')

    print('Datei:', pfad, groesse, 'Bytes')
    print('Parse-Fehler:', L.FEHLER)
    print('Quellen-Schluessel ohne Definition:', fehlend)
    print('Nicht aufgeloeste Quellen:', dict(OFFEN))
    print('%-3s %8s %8s %8s %8s' % ('LD', 'geprüft', 'prüfen', 'Lücke', 'Einträge'))
    tot = collections.Counter()
    for land in LAENDER:
        c = collections.Counter(e['status'] for lst in laender_out[land]['strukturen'].values() for e in lst)
        tot.update(c)
        print('%-3s %8d %8d %8d %8d' % (land, c['geprüft'], c['prüfen vor Nutzung'], c['Lücke'], sum(c.values())))
    print('Summe', dict(tot))
    print('Sonstiges:', [(l, e['id'], e['bauwerk']) for l in LAENDER for e in laender_out[l]['strukturen'].get('sonstiges', [])])


if __name__ == '__main__':
    main()
