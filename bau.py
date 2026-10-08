# Baut aus vorlage.html die fertige Einzeldatei index.html (offline lauffähig, auch für den privaten Link).
# Aufruf im Ordner werkzeuge:  python -I -X utf8 bau.py
# Bettet ein: Schriften (fonts/*.woff2 als data:), Three.js (libs/three.min.js) und alle <script src="..."> aus diesem Ordner.
# index.html nie direkt bearbeiten, nur vorlage.html und die .js-Dateien.
import base64
import re
from pathlib import Path

BASIS = Path(__file__).resolve().parent
SCHRIFTEN = [
    ('Manrope', 700, 'manrope-latin-700-normal.woff2'),
    ('Manrope', 800, 'manrope-latin-800-normal.woff2'),
    ('Source Sans 3', 400, 'source-sans-3-latin-400-normal.woff2'),
    ('Source Sans 3', 600, 'source-sans-3-latin-600-normal.woff2'),
    ('Source Sans 3', 700, 'source-sans-3-latin-700-normal.woff2'),
]
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'


def lesen(p):
    with open(p, encoding='utf-8', newline='') as f:
        return f.read()


def einmal(text, alt, neu):
    n = text.count(alt)
    if n != 1:
        raise SystemExit(f'Platzhalter {alt!r} kommt {n}-mal vor, erwartet 1. Nichts geschrieben.')
    return text.replace(alt, neu)


def skript_sicher(name, inhalt):
    if '</script' in inhalt.lower():
        raise SystemExit(f'{name} enthält "</script", kann nicht eingebettet werden.')
    return inhalt


vorlage = lesen(BASIS / 'vorlage.html')
# geschützte Leerzeichen zwischen Zahl und Einheit (nur im Vorlagentext, nicht in Bibliotheken)
vorlage, nbsp = re.subn(r'(\d) (%|€|m²)', '\\1\u00a0\\2', vorlage)

fonts = []
for familie, gewicht, datei in SCHRIFTEN:
    b64 = base64.b64encode((BASIS / 'fonts' / datei).read_bytes()).decode('ascii')
    fonts.append(f"@font-face{{font-family:'{familie}';font-style:normal;font-weight:{gewicht};font-display:swap;"
                 f"src:url(data:font/woff2;base64,{b64}) format('woff2');unicode-range:{LATIN}}}")
text = einmal(vorlage, '__FONTS_CSS__', '\n'.join(fonts))

# Diagramm- und Statusfarben nur aus palette.json (R024): hell auf :root, dunkel für System-Dunkel und für den Schalter
import json
pal = json.loads(lesen(BASIS / 'palette.json'))
def block(werte):
    return ' '.join(f'--{k}: {v};' for k, v in werte.items())
palette_css = (f'  :root {{ {block(pal["hell"])} }}\n'
               f'  @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ {block(pal["dunkel"])} }} }}\n'
               f'  :root[data-theme="dark"] {{ {block(pal["dunkel"])} }}')
text = einmal(text, '__PALETTE_CSS__', palette_css)
text = einmal(text, '<script>__THREE_JS__</script>',
              '<script>/* three.js r160, MIT-Lizenz */\n' + skript_sicher('three.min.js', lesen(BASIS / 'libs' / 'three.min.js')) + '\n</script>')

eingebettet = []
def ersetze(m):
    name = m.group(1)
    pfad = (BASIS / name).resolve()
    if BASIS not in pfad.parents:
        raise SystemExit(f'{name} liegt außerhalb des Ordners.')
    eingebettet.append(name)
    return f'<script>/* {name} */\n' + skript_sicher(name, lesen(pfad)) + '\n</script>'
text = re.sub(r'<script src="([^"]+\.js)"></script>', ersetze, text)
text = text.replace('<!-- VORLAGE: hier ändern, dann "python -I -X utf8 bau.py" ausführen. index.html wird erzeugt, nie direkt bearbeiten. -->',
                    '<!-- ERZEUGT von bau.py aus vorlage.html. Nicht direkt bearbeiten. -->')

with open(BASIS / 'index.html', 'w', encoding='utf-8', newline='') as f:
    f.write(text)
print(f'index.html geschrieben: {len(text.encode("utf-8")) // 1024} KB, {len(SCHRIFTEN)} Schriften, '
      f'Skripte: {", ".join(eingebettet)}, geschützte Leerzeichen: {nbsp}')
