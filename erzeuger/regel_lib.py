# Gemeinsame Hilfen fuer bauregeln_daten.py und verfahrensfrei_daten.py
# Nur Standardbibliothek. Liest die Recherche-Berichte unter recherche/.
import re, os, json

HIER = os.path.dirname(os.path.abspath(__file__))
WERK = os.path.dirname(HIER)
REC = os.path.join(WERK, 'recherche')
DATEN = os.path.join(WERK, 'daten')

FEHLER = []  # gesammelte Parse-Fehler, werden vom Aufrufer ausgegeben


def zellen(zeile):
    """Zerlegt eine Markdown-Tabellenzeile; leere Zellen bleiben erhalten."""
    z = zeile.strip()
    if z.startswith('|'):
        z = z[1:]
    if z.endswith('|'):
        z = z[:-1]
    return [c.strip() for c in z.split('|')]


def tabellen(dateiname):
    """Liefert (kopf, zeilen, startzeile) fuer jede Tabelle der Datei.
    Jede Datenzeile muss genau so viele Zellen haben wie der Kopf, sonst Fehler."""
    pfad = os.path.join(REC, dateiname)
    with open(pfad, encoding='utf-8') as f:
        zeilen = f.read().split('\n')
    i = 0
    while i < len(zeilen):
        if zeilen[i].startswith('|'):
            block = []
            start = i + 1
            while i < len(zeilen) and zeilen[i].startswith('|'):
                block.append(zeilen[i])
                i += 1
            if len(block) < 2:
                continue
            kopf = zellen(block[0])
            if not re.match(r'^\|[\s:|-]+\|?$', block[1].strip()):
                continue
            daten = []
            for k, z in enumerate(block[2:]):
                c = zellen(z)
                if len(c) != len(kopf):
                    FEHLER.append('%s Zeile %d: %d statt %d Zellen (%s)' % (dateiname, start + 2 + k, len(c), len(kopf), c[0][:20]))
                    continue
                daten.append(c)
            yield kopf, daten, start
        else:
            i += 1


def iso(d):
    m = re.match(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$', d.strip())
    if not m:
        return d.strip()
    return '%s-%02d-%02d' % (m.group(3), int(m.group(2)), int(m.group(1)))


URL_RE = re.compile(r'https?://[^\s`)\]>,;<]+')


def url_bereinigen(u):
    return u.rstrip('.,;:)')


def quellen_aus_datei(dateiname):
    """Liest '- KUERZEL = Titel, URL'-Zeilen und Tabellen mit Kopf 'Kuerzel|Titel|URL'."""
    out = {}
    pfad = os.path.join(REC, dateiname)
    with open(pfad, encoding='utf-8') as f:
        text = f.read().split('\n')
    for z in text:
        m = re.match(r'^- ([A-Za-z0-9ÄÖÜäöü()\-_.]+) = (.*)$', z)
        if not m:
            continue
        key, rest = m.group(1), m.group(2)
        u = URL_RE.search(rest)
        url = url_bereinigen(u.group(0)) if u else None
        if key.startswith('NI-'):
            mm = re.search(r'ID `([0-9a-f-]{36})`', rest) or re.search(r'`([0-9a-f]{8}-[0-9a-f-]{27})`', rest)
            if mm:
                url = 'https://voris.wolterskluwer-online.de/browse/document/' + mm.group(1)
        titel = rest
        if u:
            titel = rest[:u.start()]
        titel = re.sub(r'[\s,:;(`]+$', '', titel).strip()
        out[key] = {'titel': titel, 'url': url}
    for kopf, daten, _ in tabellen(dateiname):
        if kopf[0].lower().startswith('kürzel') and len(kopf) >= 3 and kopf[1] == 'Titel':
            for c in daten:
                u = URL_RE.search(c[2])
                out[c[0]] = {'titel': c[1], 'url': url_bereinigen(u.group(0)) if u else None}
    return out


def quellkeys(zelle, defs):
    """Zerlegt eine Quellzelle in Schluessel, die in defs vorkommen. Rueckgabe (keys, unaufgeloest)."""
    keys, offen = [], []
    for teil in re.split(r'[;,]', zelle):
        t = teil.strip()
        if not t:
            continue
        if t.startswith('('):
            keys.append('KEINE')
            continue
        t = re.sub(r'\s*\(§[^)]*\)$', '', t).strip()
        if t in defs:
            keys.append(t)
            continue
        t0 = re.sub(r'\s*\([^)]*\)$', '', t).strip()
        if t0 in defs:
            keys.append(t0)
            continue
        for suf in ('(n)', '(nn)'):
            if t0 + suf in defs:
                keys.append(t0 + suf)
                break
        else:
            suf = None
        if suf:
            continue
        m = re.match(r'^(.*?)\((\w+)\)$', t)
        if m and (m.group(1) + '(n)') in defs:
            keys.append(m.group(1) + '(n)')
            continue
        if m and (m.group(1) + '(nn)') in defs:
            keys.append(m.group(1) + '(nn)')
            continue
        offen.append(t)
    return keys, offen


def zahl(s):
    """'2,40' -> 2.4 ; '1.600' -> 1600 ; '1 600' -> 1600"""
    s = s.strip().replace(' ', '')
    if re.match(r'^\d{1,3}(\.\d{3})+$', s):
        return int(s.replace('.', ''))
    s = s.replace(',', '.')
    v = float(s)
    return int(v) if v == int(v) and '.' not in s else v


def js_schreiben(pfad, kopf_kommentar, name, obj):
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    s = s.replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    with open(pfad, 'w', encoding='utf-8', newline='\n') as f:
        f.write(kopf_kommentar.rstrip('\n') + '\n')
        f.write('window.DATEN = window.DATEN || {};\n')
        f.write('window.DATEN.%s = %s;\n' % (name, s))
    return os.path.getsize(pfad)
