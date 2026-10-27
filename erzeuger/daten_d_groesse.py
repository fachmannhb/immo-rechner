# -*- coding: utf-8 -*-
"""Zeigt, welche Abschnitte der Datendateien wie viele Bytes belegen (Hilfsskript zum Schlankhalten)."""
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
DATEN = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'daten')
for n in ['innenausbau', 'energie', 'material', 'formen', 'daemmung_lueftung', 'wasser']:
    t = open(os.path.join(DATEN, n + '.js'), encoding='utf-8').read()
    obj = json.loads(re.search(r'= (\{.*\});\s*$', t, re.S).group(1))
    print(n, len(t.encode('utf-8')))
    for k, v in obj.items():
        s = len(json.dumps(v, ensure_ascii=False).encode('utf-8'))
        extra = ''
        if isinstance(v, list) and v and isinstance(v[0], dict):
            feld = {}
            for x in v:
                for kk, vv in x.items():
                    feld[kk] = feld.get(kk, 0) + len(json.dumps(vv, ensure_ascii=False).encode('utf-8')) + len(kk) + 4
            top = sorted(feld.items(), key=lambda a: -a[1])[:5]
            extra = ' | ' + ', '.join('%s %d' % a for a in top)
        print('   %-26s %7d%s' % (k, s, extra))
