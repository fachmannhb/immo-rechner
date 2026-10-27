# -*- coding: utf-8 -*-
"""Gemeinsame Hilfen für die Datengeneratoren der Welle D (daten_d_*.py).
Schreibt daten/<name>.js im selben Format wie pvgis.js: Kommentarkopf, window.DATEN.<name> = {...};
UTF-8 ohne BOM, LF. Eintragslisten stehen eine Zeile je Eintrag."""
import json
import os

HIER = os.path.dirname(os.path.abspath(__file__))
DATEN = os.path.join(os.path.dirname(HIER), 'daten')

G = 'geprüft'
P = 'prüfen vor Nutzung'
N = 'neu holen'
L = 'Lücke'
A = 'abgelaufen'
E = 'eigene Einordnung'
STATUS = [G, P, N, L, A, E]

# Top-Level-Schlüssel, die keine Eintragslisten sind (Prüfung überspringt sie)
KEINE_EINTRAEGE = ('widersprueche', 'hinweise')


def maker(abruf_standard):
    """Liefert z(...) zum Bauen eines Eintrags. Leere Felder (None) fallen weg;
    bei Status 'neu holen' bleiben von/bis ausdrücklich null."""
    def z(id, name, einheit=None, von=None, bis=None, q=None, s=P, ab=None, **kw):
        d = {'id': id, 'name': name}
        if einheit is not None:
            d['einheit'] = einheit
        if von is not None or s == N:
            d['von'] = von
        if bis is not None or s == N:
            d['bis'] = bis
        for k, v in kw.items():
            if v is not None:
                d[k] = v
        d['quelle'] = q
        d['abruf'] = ab or abruf_standard
        d['status'] = s
        return d
    return z


def _j(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))


def schreibe(name, kopf, obj):
    zeilen = ['{']
    items = list(obj.items())
    for i, (k, v) in enumerate(items):
        komma = ',' if i < len(items) - 1 else ''
        if isinstance(v, list) and v and all(isinstance(x, dict) for x in v):
            zeilen.append(_j(k) + ':[')
            for j, x in enumerate(v):
                zeilen.append(_j(x) + (',' if j < len(v) - 1 else ''))
            zeilen.append(']' + komma)
        else:
            zeilen.append(_j(k) + ':' + _j(v) + komma)
    zeilen.append('}')
    text = '/* ' + kopf.strip() + ' */\nwindow.DATEN = window.DATEN || {};\nwindow.DATEN.' + name + ' = ' + '\n'.join(zeilen) + ';\n'
    pfad = os.path.join(DATEN, name + '.js')
    with open(pfad, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    return pfad, len(text.encode('utf-8'))
