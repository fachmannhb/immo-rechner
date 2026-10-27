# -*- coding: utf-8 -*-
"""Erzeugt daten/material.js aus recherche/30_baumaterial.md (Werte-Tabelle, ein Wert pro Zeile)."""
from daten_d_common import maker, schreibe, G, P, L, E

z = maker('2026-10-27')

WB = 'https://www.wecobis.de/bauproduktgruppen/'
WECOBIS = {
    'a': ('Porenbeton', 'massivbaustoffe-pg/porenbeton-pg.html'), 'b': ('Kalksandsteine', 'massivbaustoffe-pg/kalksandsteine-pg.html'),
    'c': ('Ziegel', 'massivbaustoffe-pg/ziegel-pg.html'), 'd': ('Lehmsteine', 'massivbaustoffe-pg/lehmsteine-pg.html'),
    'e': ('Leichtbeton', 'massivbaustoffe-pg/leichtbeton-pg.html'), 'f': ('Lehmputz', 'moertel-estriche-pg/putzmoertel-pg/lehmputz-pg.html'),
    'g': ('WDVS-Infoblatt (Stand Mai 2016)', 'daemmstoffe-pg/wdvs-info.html'), 'h': ('Mineralwolle', 'daemmstoffe-pg/daemmstoffe-mineralisch-pg/mineralwolle-pg.html'),
    'i': ('Schaumglas', 'daemmstoffe-pg/daemmstoffe-mineralisch-pg/schaumglas-pg.html'), 'j': ('Calciumsilikat', 'daemmstoffe-pg/daemmstoffe-mineralisch-pg/calciumsilikat-pg.html'),
    'k': ('Holzfaser', 'daemmstoffe-pg/daemmstoffe-nachwachsend-pg/holzfaser-pg.html'), 'l': ('Zellulosefaser', 'daemmstoffe-pg/daemmstoffe-nachwachsend-pg/zellulosefaser-pg.html'),
    'm': ('Flachs/Hanf', 'daemmstoffe-pg/daemmstoffe-nachwachsend-pg/flachs-daemmstoffe-pg.html'), 'n': ('Strohdämmstoffe', 'daemmstoffe-pg/daemmstoffe-nachwachsend-pg/strohdaemmstoffe-pg.html'),
    'o': ('EPS', 'daemmstoffe-pg/daemmstoffe-synthetisch-pg/eps-link.html'), 'p': ('XPS', 'daemmstoffe-pg/daemmstoffe-synthetisch-pg/xps-link.html'),
    'q': ('Polyurethan-Hartschaum', 'daemmstoffe-pg/daemmstoffe-synthetisch-pg/polyurethan-hartschaum.html'), 'r': ('Brettsperrholz', 'holzprodukte-pg/vollholz-pg/brettsperrholz-pg.html'),
    's': ('Konstruktionsholz / Nadelholz', 'holzprodukte-pg/vollholz-pg/konstruktionsholz-pg.html'), 't': ('Isoliergläser', 'verglasungen-pg/funktionsglaeser-pg/isolierglaeser-pg.html'),
    'u': ('Isoliergläser gasgefüllt', 'verglasungen-pg/funktionsglaeser-pg/isolierglaeser-pg/isolierglaeser-gasgefuellt-pg.html'), 'v': ('Bodenbeläge', 'bodenbelaege-pg/'),
    'w': ('Dachbahnen Bitumen/Kunststoff', 'abdichtungen-pg/abdichtungsbahnen-pg/dachbahn-bitumen-pg.html'), 'x': ('Zink', 'metalle-pg/zink-pg.html'), 'y': ('Aluminium', 'metalle-pg/aluminium-pg.html'),
}
QUELLEN = {
    'bbsr26': {'titel': 'BBSR/BNB, Nutzungsdauern von Bauteilen (Excel 26.03.13, Spaltenkopf Stand 04.11.2025); Zeilennummer in ref', 'url': 'https://www.nachhaltigesbauen.de/austausch/nutzungsdauern-von-bauteilen/'},
    'bbsr17': {'titel': 'BBSR/BNB, Nutzungsdauern von Bauteilen, Stand 24.02.2017 (ersetzt durch 2026)', 'url': 'https://www.nachhaltigesbauen.de/fileadmin/pdf/Nutzungsdauer_Bauteile/BNB_Nutzungsdauern_von_Bauteilen_2017-02-24.pdf'},
    'thega': {'titel': 'ThEGA, Faktenblatt Dämmstoffe (März 2025)', 'url': 'https://www.thega.de/fileadmin/user_upload/Dokumente/Fachbereiche/Energie-_und_Ressourceneffizienz/Fachinformationen/ThEGA-Faktenblatt-Daemmstoffe.pdf'},
    'oekobaudat': {'titel': 'ÖKOBAUDAT (Bundesportal), Schnittstelle, Indikator GWP-total, Modul A1-A3; UUID in ref', 'url': 'https://oekobaudat.de/OEKOBAU.DAT/resource/processes/'},
    'gmodg': {'titel': 'GModG (früher GEG) Anlage 7 zu § 36', 'url': 'https://www.gesetze-im-internet.de/geg/anlage_7.html'},
    'co2_daemm': {'titel': 'co2online, Alle ökologischen Dämmstoffe im Vergleich (04.09.2025)', 'url': 'https://www.co2online.de/modernisieren-und-bauen/daemmung/oekologische-daemmstoffe/'},
    'eexp_daemm': {'titel': 'energie-experten.org, Preis-Vergleich von Dämmstoffen (Seitenstand 28.09.2026; Vermittlungsportal)', 'url': 'https://www.energie-experten.org/bauen-und-sanieren/daemmung/daemmstoffe/preise'},
    'eexp_fenster': {'titel': 'energie-experten.org, Fenster-Preise (Seitenstand 29.07.2024; Vermittlungsportal)', 'url': 'https://energie-experten.org/bauen-und-sanieren/fenster/kauf-ratgeber/fenster-preise.html'},
    'eexp_dach': {'titel': 'energie-experten.org, Dachziegel-Preise (Seitenstand 29.07.2024; Vermittlungsportal)', 'url': 'https://www.energie-experten.org/bauen-und-sanieren/dach/dachziegel/preise'},
    'suchtreffer': {'titel': 'Suchtreffer-Zusammenfassungen (bauen.de, energie-experten.org, co2online), Seiten nicht selbst abgerufen', 'url': 'recherche/30_baumaterial.md#Q11'},
    'sachsen_daemm': {'titel': 'Sächsische Landesanstalt für Landwirtschaft, Dämmstoffe aus der Natur (undatiert)', 'url': 'https://publikationen.sachsen.de/bdb/artikel/13546/documents/15412'},
    'eigen': {'titel': 'Eigene Rechnung aus den genannten Quellwerten (Annahmen im Hinweis)', 'url': 'recherche/30_baumaterial.md'},
    'ci_boden': {'titel': 'clean-invoice, Wohnung sanieren Kosten (06.03.2026), Abruf 26.10.2026 (Recherche 22)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/wohnung-sanieren-kosten'},
    'co2_gruen': {'titel': 'co2online, Dachbegrünung (19.05.2022), über Recherche 29', 'url': 'https://www.co2online.de/modernisieren-und-bauen/anpassung-an-den-klimawandel/dachbegruenung/'},
    'luecke': {'titel': 'Keine Quelle gefunden (Recherche 30, Offene Punkte 4)', 'url': 'recherche/30_baumaterial.md'},
}
for k, (t, p) in WECOBIS.items():
    QUELLEN['wb_' + k] = {'titel': 'WECOBIS ' + t, 'url': WB + p}

# material-id: (Bauteil, Name)
MAT = {
    'ks': ('aussenwand', 'Kalksandstein'), 'ziegel': ('aussenwand', 'Ziegel / Planziegel'), 'porenbeton': ('aussenwand', 'Porenbeton'),
    'beton': ('aussenwand', 'Beton (Stahlbeton, Ortbeton)'), 'leichtbeton': ('aussenwand', 'Leichtbeton-Mauersteine'),
    'holzrahmen': ('aussenwand', 'Holzrahmenbau (Holztafel, Ständer)'), 'bsp': ('aussenwand', 'Massivholz / Brettsperrholz'),
    'lehm': ('aussenwand', 'Lehm (Lehmsteine, Stampflehm)'), 'strohballen': ('aussenwand', 'Strohballenbau'),
    'mineralwolle': ('daemmung', 'Mineralwolle (Glas, Stein)'), 'eps': ('daemmung', 'EPS (Styropor)'), 'xps': ('daemmung', 'XPS'),
    'pur_pir': ('daemmung', 'PUR / PIR'), 'holzfaser': ('daemmung', 'Holzfaser'), 'zellulose': ('daemmung', 'Zellulose'),
    'hanf_flachs': ('daemmung', 'Hanf / Flachs'), 'schaumglas': ('daemmung', 'Schaumglas'),
    'mineraldaemmplatte': ('daemmung', 'Mineraldämmplatte (Calciumsilikat, Mineralschaum)'), 'stroh': ('daemmung', 'Stroh (Platten, Ballen, Einblas)'),
    'wdvs': ('fassade', 'WDVS (Wärmedämm-Verbundsystem)'), 'vhf': ('fassade', 'Vorgehängte hinterlüftete Fassade'),
    'tonziegel': ('dach', 'Tondachziegel'), 'betondachstein': ('dach', 'Betondachstein'), 'schiefer': ('dach', 'Schiefer'),
    'metall': ('dach', 'Metall (Zink, Kupfer, Alu, Edelstahl)'), 'bitumen': ('dach', 'Bitumen (Schindeln, Dachpappe, Bahnen)'),
    'epdm': ('dach', 'EPDM / Kunststofffolie'), 'gruendach': ('dach', 'Gründach (extensiv)'), 'reet': ('dach', 'Reet'),
    'pvc': ('fenster', 'Fensterrahmen Kunststoff (PVC-U)'), 'holzfenster': ('fenster', 'Fensterrahmen Holz'), 'holzalu': ('fenster', 'Fensterrahmen Holz-Alu'), 'alu': ('fenster', 'Fensterrahmen Aluminium'),
    'v2_alt': ('verglasung', '2-fach unbeschichtet, ohne Gas'), 'v2_luft': ('verglasung', '2-fach beschichtet, Luft'), 'v2_argon': ('verglasung', '2-fach beschichtet, Argon'),
    'v3_argon': ('verglasung', '3-fach beschichtet, Argon'), 'v3_krypton': ('verglasung', '3-fach beschichtet, Krypton'),
    'laminat': ('boden', 'Laminat'), 'vinyl': ('boden', 'Vinyl (Design-/Klickvinyl)'), 'parkett': ('boden', 'Parkett'), 'fliesen': ('boden', 'Fliesen'), 'linoleum': ('boden', 'Linoleum'),
}
BAUTEILE = [
    {'id': 'aussenwand', 'name': 'Außenwand'}, {'id': 'daemmung', 'name': 'Dämmung'}, {'id': 'fassade', 'name': 'Fassadensystem'},
    {'id': 'dach', 'name': 'Dacheindeckung'}, {'id': 'fenster', 'name': 'Fensterrahmen'}, {'id': 'verglasung', 'name': 'Verglasung'}, {'id': 'boden', 'name': 'Bodenbelag'},
]
KRIT = {
    'lebensdauer': 'Nutzungsdauer (BBSR 2026)', 'lebensdauer_2017': 'Nutzungsdauer (BBSR 2017)', 'lebensdauer_andere': 'Nutzungsdauer (andere Quelle)',
    'lambda': 'Wärmeleitfähigkeit λ', 'lambda_thega': 'Wärmeleitfähigkeit λ (ThEGA-Bereich)', 'wlg': 'Wärmeleitfähigkeitsgruppe im WDVS', 'rohdichte': 'Rohdichte',
    'druckfestigkeit': 'Druckfestigkeit', 'dicke_u024': 'Dicke für U ≤ 0,24', 'brand_din': 'Brandverhalten', 'schall': 'Schallschutz',
    'feuchte': 'Feuchteverhalten', 'mu': 'Diffusionswiderstand µ', 'gwp': 'Treibhauspotenzial A1-A3', 'preis': 'Preis', 'verarbeitung': 'Verarbeitung / selbst machen',
    'wartung': 'Wartung', 'nachteil': 'Typischer Nachteil', 'gewicht': 'Masse', 'ug': 'Ug-Wert', 'rw': 'Schalldämmmaß Rw', 'dicke_wand': 'Wanddicke ohne Zusatzdämmung',
    'rueckbau': 'Rückbau / Recycling', 'sommer': 'Sommerlicher Wärmeschutz', 'eignung': 'Eignung', 'zulassung': 'Zulassung', 'anforderung': 'Anforderung',
}
ZEILEN = []


def m(rid, mats, krit, w, einheit, q, s=G, hinweis=None, ref=None, **kw):
    """Eine oder mehrere Material-Zeilen. w: Zahl -> von=bis, Tupel -> von,bis, Text -> wert."""
    if isinstance(mats, str):
        mats = [mats]
    if s == L and len(mats) > 1:
        # Lücke für mehrere Materialien: eine Zeile mit Liste statt vieler gleicher Zeilen
        e = z(rid, KRIT[krit], einheit, None, None, q, s, materialien=list(mats), kriterium=krit, hinweis=hinweis, ref=ref)
        del e['name']
        ZEILEN.append(e)
        return
    for idx, mat in enumerate(mats):
        d = dict(kw)
        if idx > 0:
            hinweis = None  # Hinweis nur an der ersten Zeile einer Gruppe, spart Platz
        von = bis = None
        if isinstance(w, tuple):
            von, bis = w
        elif isinstance(w, (int, float)) and not isinstance(w, bool):
            von = bis = w
        elif w is not None:
            d['wert'] = w
        rid2 = rid if len(mats) == 1 else rid + '.' + mat
        e = z(rid2, KRIT[krit], einheit, von, bis, q, s, material=mat, kriterium=krit, hinweis=hinweis, ref=ref, **d)
        del e['name']  # Name steht in meta_kriterien, Bauteil in meta_materialien (schlank halten)
        ZEILEN.append(e)


def gwp(rid, mat, wert, einheit, skala, uuid=None, ind='GWP-total', s=G, hinweis=None, rechnung=False, q='oekobaudat'):
    m(rid, mat, 'gwp', wert, einheit, 'eigen' if rechnung else q, P if rechnung else s, hinweis=hinweis, ref=uuid,
      skala=skala, indikator=ind, rechnung=True if rechnung else None)


LUE = lambda rid, mat, krit, grund: m(rid, mat, krit, None, None, 'luecke', L, hinweis=grund)

# ===== Außenwand =====
m('A01', ['ks', 'ziegel', 'porenbeton'], 'lebensdauer', 50, 'Jahre', 'bbsr26', ref='331.111.25', ge=True, hinweis='Mauerwerkswand; Deckel bei 50')
m('A02', 'beton', 'lebensdauer', 50, 'Jahre', 'bbsr26', ref='331.112.25', ge=True, hinweis='2017: 331.211')
m('A03', ['holzrahmen', 'bsp'], 'lebensdauer', 50, 'Jahre', 'bbsr26', ref='331.113.25', ge=True, hinweis='Holzwand (Blockbau, Fachwerk, Holztafel, Massivholz, Skelett)')
m('A04', 'strohballen', 'lebensdauer', 50, 'Jahre', 'bbsr26', ref='331.115.25', ge=True)
m('A05', 'lehm', 'lebensdauer', 50, 'Jahre', 'bbsr26', ref='331.116.25', ge=True, hinweis='Lehmbauwand')
m('A10', 'ks', 'lambda', (0.27, 1.8), 'W/(m·K)', 'wb_b', hinweis='Typische Bereiche; Rohdichte 1000 bis 2200')
m('A10r', 'ks', 'rohdichte', (1000, 2200), 'kg/m³', 'wb_b')
m('A11', 'ziegel', 'lambda', (0.075, 0.96), 'W/(m·K)', 'wb_c', hinweis='Repräsentativ 0,075 bis 0,12')
m('A11r', 'ziegel', 'rohdichte', (550, 2000), 'kg/m³', 'wb_c', hinweis='Repräsentativ 575')
m('A12', 'porenbeton', 'lambda', (0.08, 0.21), 'W/(m·K)', 'wb_a')
m('A12r', 'porenbeton', 'rohdichte', (250, 800), 'kg/m³', 'wb_a')
m('A12d', 'porenbeton', 'druckfestigkeit', (1.6, 10), 'N/mm²', 'wb_a')
m('A14', 'bsp', 'lambda', 0.13, 'W/(m·K)', 'wb_r', hinweis='Rechenwert DIN V 4108-4 für Brettsperrholz')
m('A14h', 'holzrahmen', 'lambda', 0.13, 'W/(m·K)', 'wb_s', hinweis='Nur das Konstruktionsholz selbst (Rechenwert DIN V 4108-4); Holzrahmen ist ein System, die Dämmung zwischen den Ständern siehe Dämmung.')
m('A15', 'lehm', 'rohdichte', (400, 2200), 'kg/m³', 'wb_d', hinweis='Lehmstein; λ hängt von der Rohdichte ab')
m('A16', 'lehm', 'lambda', None, 'W/(m·K)', 'wb_f', wert='Lehmputz als Anhalt: 1200 kg/m³ = 0,47; 1600 = 0,73; 2000 = 1,1', hinweis='Kein Lehmstein-Wert.')
m('A17', 'strohballen', 'lambda', (0.048, 0.052), 'W/(m·K)', 'wb_n', typisch=0.049, hinweis='Rechenwert 0,049 nach ETA; quer 0,052, senkrecht zur Halmrichtung 0,048. WECOBIS druckt W/m²K, gemeint W/(m·K).')
for _mat, _wb in [('ks', 'wb_b'), ('ziegel', 'wb_c'), ('porenbeton', 'wb_a'), ('leichtbeton', 'wb_e')]:
    m('A20.' + _mat, _mat, 'brand_din', 'DIN 4102 A1 / EN 13501 A1', None, _wb)
m('A21.bsp', 'bsp', 'brand_din', 'DIN 4102 B2 / EN 13501 D-d0', None, 'wb_r')
m('A21.holzrahmen', 'holzrahmen', 'brand_din', 'DIN 4102 B2 / EN 13501 D-d0', None, 'wb_s')
m('A22', 'lehm', 'brand_din', 'A1 bei höchstens 1 Masse-% organischen Zusätzen, sonst B', None, 'wb_d')
m('A23', 'strohballen', 'brand_din', 'EN 13501 Euroklasse E; mit mehr als 8 mm Lehmputz B-s1,d0', None, 'wb_n')
m('A30', 'leichtbeton', 'schall', (33, 37), 'dB (R\'w, einschalig)', 'wb_e', hinweis='Je Rohdichte, Dicke, Putz; nur Leichtbeton, ≥ 33 bis ≥ 37.')
m('A31', 'ks', 'feuchte', 'Wärme und Feuchte speichernd bzw. regulierend (qualitativ)', None, 'wb_b')
m('A32', 'ks', 'mu', 'Loch/Hohlblock 5/10; Voll/Block 15/25', None, 'wb_b', hinweis='DIN 4108-4')
m('A32z', 'ziegel', 'mu', '5/10', None, 'wb_c')
m('A32p', 'porenbeton', 'mu', '5/10', None, 'wb_a')
m('A33', 'ziegel', 'rueckbau', 'Gefüllte Ziegel seit Anfang der 2000er am Markt; Mengen für wirtschaftliche Trennung zu gering; Mineralwolle-Stecklinge ziehen auf der Baustelle', None, 'wb_a')
m('A34', 'ziegel', 'nachteil', 'Brennen braucht viel Energie (Aufwand laut Seite um bis zu 40 % gesunken); gefüllte Ziegel später schwer sortenrein zu trennen', None, 'wb_c')
m('A35', 'porenbeton', 'verarbeitung', 'Leichte Großformate; Elemente über 25 kg nur mit Hebezeug', None, 'wb_a')
m('A35n', 'porenbeton', 'nachteil', 'Weniger druck- und schlagfest als Voll-Stein; ohne Zusatzdämmung dicke Wände (36 bis 49 cm) nötig', None, 'wb_a', hinweis='Wanddicke aus bauen.de (A41).')
m('A36', 'beton', 'rueckbau', 'Altbeton nach Aufbereitung als rezyklierte Gesteinskörnung, vor allem Straßenbau; Wiederverwertung als Zuschlag mit Einschränkungen', None, 'wb_a')
m('A37', ['holzrahmen', 'bsp'], 'mu', (20, 200), None, 'wb_s', hinweis='Stark feuchteabhängig')
m('A38', ['holzrahmen', 'bsp'], 'feuchte', 'Holzschutz und Feuchteschutz Pflicht: vorbeugend baulich, sonst chemisch nach DIN 68800 Teil 2 und 3', None, 'wb_s')
m('A39', 'lehm', 'feuchte', 'Offenporig, nimmt Feuchte auf und gibt sie ab. DIN 18945: Anwendungsklasse Ia höchster Widerstand (verputzt, Witterung ausgesetzt), III niedrigster (trocken, nicht tragend, wassersensibel). Stranggepresste Steine mit hohem Tongehalt sehr wasserempfindlich', None, 'wb_d')
m('A40', 'porenbeton', 'preis', (35, 50), '€/m² Wand', 'suchtreffer', P, hinweis='25 cm ca. 35, 40 cm ca. 50; bauen.de laut Suchtreffer, Seite nicht abgerufen, etwa 2 Jahre alt.', basis='wand')
m('A40b', 'lehm', 'verarbeitung', 'Lehmputz zweilagig, überwiegend maschinell; Handwerk', None, 'wb_f')
m('A41', ['ziegel', 'porenbeton', 'leichtbeton'], 'dicke_wand', (36.5, 49), 'cm', 'suchtreffer', P, hinweis='bauen.de Massivbau, Suchtreffer')
m('A42', 'holzrahmen', 'preis', (2500, 3000), '€/m² Wohnfläche (Haus gesamt ohne Fundament)', 'suchtreffer', P, typisch=2700, hinweis='Kein Wandpreis; bauen.de Holzständerbauweise, Suchtreffer.', basis='haus')
m('A43', 'lehm', 'nachteil', 'Staub enthält Quarz (TRGS 906); feuchteempfindlich; trägt nicht als Dämmstoff', None, 'wb_f')
m('A44', 'strohballen', 'zulassung', 'Bauaufsichtliche Zulassung nötig; Schutz vor Feuchte nötig', None, 'co2_daemm')
m('A45', 'strohballen', 'preis', 26, '€/m² (als Dämmstoff, nicht als Wand)', 'co2_daemm', P, basis='daemm_gmodg')
m('A60', 'ks', 'dicke_u024', None, 'm', 'eigen', P, wert='über 1,08 (λ 0,27): ohne Dämmung nicht zu erreichen', rechnung=True, hinweis='d = λ · (1/0,24 − 0,17), Annahme Übergangswiderstände 0,17 aus Abgleich mit ThEGA, ohne Putz.')
m('A61', 'ziegel', 'dicke_u024', (0.30, 0.48), 'm', 'eigen', P, rechnung=True, hinweis='λ 0,075 bis 0,12; Formel wie A60')
m('A62', 'porenbeton', 'dicke_u024', (0.32, 0.84), 'm', 'eigen', P, rechnung=True, hinweis='λ 0,08 bis 0,21; Formel wie A60')
m('A63', 'bsp', 'dicke_u024', 0.52, 'm', 'eigen', P, rechnung=True, hinweis='λ 0,13, allein aus Holz; Formel wie A60')
m('A64', 'lehm', 'dicke_u024', 1.9, 'm', 'eigen', P, rechnung=True, hinweis='λ 0,47 (Lehmputz 1200 kg/m³); über 1,9 m; Formel wie A60')
m('A65', 'strohballen', 'dicke_u024', 0.20, 'm', 'eigen', P, rechnung=True, hinweis='λ 0,049; Dämmstoff und Wand in einem')
gwp('A70', 'ks', 126, 'kg CO2e je 1000 kg', 'wand_t', 'cc0d7baa-755a-4a4a-baf3-4fe53d68a041', hinweis='Je Tonne, nicht je m³.')
gwp('A71', 'ziegel', 113, 'kg CO2e je m³', 'wand_m3', '08dd0308-eebf-4db1-82ee-b340d070c9b9', ind='GWP (EN 15804+A1)', hinweis='Ungefüllt; älterer Indikator GWP, nicht GWP-total.')
gwp('A71g', 'ziegel', 146, 'kg CO2e je m³', 'wand_m3', '5576bbd6-2ccf-4e79-aa8c-441e7aa428ee', ind='GWP (EN 15804+A1)', hinweis='Gefüllt; älterer Indikator GWP.')
gwp('A72', 'ziegel', 284.24, 'kg CO2e je m³', 'wand_m3', 'b822aa09-3cb6-49a3-98f6-a3ebf325a70b', hinweis='Planziegel PS-gefüllt 605 kg/m³, generisch.')
gwp('A73a', 'porenbeton', 191.02, 'kg CO2e je m³', 'wand_m3', 'c5310f2b-23a1-4059-ba25-80d9b3e933f5', hinweis='380 kg/m³. UUID so im Bericht.')
gwp('A73b', 'porenbeton', 263.32, 'kg CO2e je m³', 'wand_m3', '45e2894f-09e7-4152-a4bd-8a13f6d5b0c3', hinweis='472 kg/m³ bewehrt.')
gwp('A73c', 'porenbeton', 206.94, 'kg CO2e je m³', 'wand_m3', 'e6819670-eb6c-4104-adea-f7f8bb2f49e6', hinweis='Branchen-Datensatz 428 kg/m³; Ytong Hersteller 167,0 (23acc50d-86af-4b11-a85c-c743f789ca9f).')
gwp('A74', 'beton', 181, 'kg CO2e je m³', 'wand_m3', '8347f9a7-f4ec-4a36-a266-a0281f5fd16d', hinweis='C25/30 Ø; Transportbeton generisch 221,66 und 222,96.')
gwp('A75', 'holzrahmen', -640.28, 'kg CO2e je m³', 'wand_m3', '703eec32-59af-47e1-9c91-4a32afe3187f', hinweis='Konstruktionsvollholz 529 kg/m³. Negativ = Kohlenstoffspeicher in der Herstellung verbucht, am Lebensende wieder frei (Module C).')
gwp('A76', 'bsp', -641.66, 'kg CO2e je m³', 'wand_m3', 'bb838307-4509-4d98-864a-6cb96aaa39a6', hinweis='Brettsperrholz Ø; negativ wie A75.')
gwp('A77a', 'lehm', 91.76, 'kg CO2e je m³', 'wand_m3', 'f25983c6-104a-4d19-8d2a-c0dccafa2f3b', hinweis='Adobe 1200 kg/m³.')
gwp('A77b', 'lehm', 9.62, 'kg CO2e je m³', 'wand_m3', '3f9ebd47-f93e-4fee-859a-13700134ee3c', hinweis='Stampflehmwand 2000 kg/m³.')
gwp('A78', 'strohballen', -98.03, 'kg CO2e je m³', 'wand_m3', 'e45e2b55-a8c4-4037-bc7d-e3718c4e28f3', hinweis='Strohdämmung 100 kg/m³; negativ wie A75.')
LUE('L_beton', 'beton', 'lambda', 'Keine Quelle für λ, Schall, Brandklasse, Preis und Verarbeitung von Beton.')
LUE('L_wand_preis', ['ks', 'ziegel', 'lehm', 'strohballen'], 'preis', 'Kein Wandpreis gefunden (Strohballen nur als Dämmstoff, A45).')
LUE('L_wand_schall', ['ks', 'ziegel', 'porenbeton', 'beton', 'holzrahmen', 'bsp', 'lehm', 'strohballen'], 'schall', 'Schallschutz nur für Leichtbeton (A30) und Isolierglas belegt; KS "schalldämmend" ohne Zahl.')

# ===== Dämmung =====
m('D01', 'mineralwolle', 'lambda', (0.035, 0.040), 'W/(m·K)', 'wb_h', hinweis='Beispielprodukte; ThEGA 0,03 bis 0,05 (D03).')
m('D02a', 'mineralwolle', 'wlg', (32, 45), 'WLG', 'wb_g', hinweis='WLG = λ mal 1000')
m('D02b', 'eps', 'wlg', (32, 40), 'WLG', 'wb_g')
m('D02c', 'pur_pir', 'wlg', (23, 30), 'WLG', 'wb_g')
m('D02d', 'holzfaser', 'wlg', (38, 83), 'WLG', 'wb_g')
m('D02e', 'hanf_flachs', 'wlg', (40, 50), 'WLG', 'wb_g')
m('D02f', 'mineraldaemmplatte', 'wlg', (40, 65), 'WLG', 'wb_g', hinweis='Mineralschaum im WDVS')
m('D03', 'mineralwolle', 'lambda_thega', (0.03, 0.05), 'W/(m·K)', 'thega')
for rid, mat, v, b in [('D03e', 'eps', 0.035, 0.06), ('D03x', 'xps', 0.03, 0.045), ('D03p', 'pur_pir', 0.024, 0.045), ('D03h', 'holzfaser', 0.032, 0.065),
                       ('D03z', 'zellulose', 0.038, 0.04), ('D03f', 'hanf_flachs', 0.04, 0.045), ('D03s', 'schaumglas', 0.038, 0.055), ('D03m', 'mineraldaemmplatte', 0.05, 0.07)]:
    m(rid, mat, 'lambda_thega', (v, b), 'W/(m·K)', 'thega', P, hinweis='Ohne eigene Werte-ID im Bericht.')
m('D04', 'mineralwolle', 'brand_din', 'A1 / A1 (Platte); Trittschalldämmplatte A2 / A2,s1,d0', None, 'wb_h')
m('D04m', 'mineraldaemmplatte', 'brand_din', 'A1', None, 'wb_g')
m('D05a', 'eps', 'mu', (20, 70), None, 'wb_g')
m('D05b', 'pur_pir', 'mu', (20, 40), None, 'wb_g', hinweis='WDVS-Tabelle; PUR-Hartschaum-Seite nennt 40 bis 200 (D17).')
m('D05c', 'mineralwolle', 'mu', (1, 2), None, 'wb_g')
m('D05d', 'mineraldaemmplatte', 'mu', (3, 20), None, 'wb_g', hinweis='Mineralschaum; Calciumsilikat 2 bis 6 (D30).')
m('D05e', 'holzfaser', 'mu', (1, 5), None, 'wb_g')
m('D05f', 'hanf_flachs', 'mu', (1, 2), None, 'wb_g', hinweis='Hanf')
m('D06', 'mineralwolle', 'feuchte', 'Diffusionsoffen, Schutz vor Nässe nötig', None, 'suchtreffer', P, hinweis='unsicher: Sekundärquelle, nur Suchtreffer.')
LUE('D07', 'mineralwolle', 'verarbeitung', 'Faserstaub/Schutzkleidung nur aus Suchtreffer ohne Primärquelle; Bericht: nicht aufnehmen ohne Beleg.')
m('D08', ['wdvs', 'mineralwolle', 'eps'], 'rueckbau', 'Verklebtes WDVS: sortenreine Trennbarkeit stark eingeschränkt, Entsorgungskosten deutlich höher', None, 'thega')
m('D09a', ['holzfaser', 'zellulose'], 'sommer', 'gut (ThEGA)', None, 'thega', hinweis='Holzfaser c 2100 bis 2500 J/(kg·K)')
m('D09b', ['eps', 'pur_pir', 'xps', 'mineralwolle'], 'sommer', 'mittel (ThEGA); Mineralwolle eher geringere Speicherfähigkeit', None, 'thega')
m('D10', 'eps', 'lambda', (0.033, 0.038), 'W/(m·K)', 'wb_o')
m('D11', 'eps', 'brand_din', 'DIN 4102 B1 / EN 13501 E', None, 'wb_o')
LUE('D12', 'eps', 'brand_din', 'Aussage "schmilzt ab ca. 140 °C, tropft" nur aus einem Privatblog; nicht aufgenommen. Brennbarkeit selbst (B1 / E) ist belegt.')
m('D13', 'xps', 'lambda', (0.027, 0.035), 'W/(m·K)', 'wb_p')
m('D14', 'xps', 'brand_din', 'DIN 4102 B1 / EN 13501 E', None, 'wb_p')
m('D15', 'xps', 'feuchte', 'Unempfindlich gegen Feuchtigkeit, praktisch keine Wasseraufnahme', None, 'wb_p')
m('D16', ['xps', 'pur_pir'], 'eignung', 'Für erdberührte Bauteile nur feuchteresistente Materialien wie XPS oder PUR (Sockel, Keller)', None, 'thega')
m('D17', 'pur_pir', 'lambda', (0.018, 0.027), 'W/(m·K)', 'wb_q', hinweis='PUR-Hartschaum; Rohdichte 30 bis 43 kg/m³, µ 40 bis 200')
m('D18a', 'pur_pir', 'brand_din', 'ThEGA: B1', None, 'thega', P, widerspruch=True, hinweis='Widerspruch zwischen Quellen, offen gelassen: Herstellerangabe prüfen.')
m('D18b', 'pur_pir', 'brand_din', 'WECOBIS PUR-Hartschaum: B2 / E', None, 'wb_q', P, widerspruch=True)
m('D18c', 'pur_pir', 'brand_din', 'WECOBIS WDVS-Tabelle: B1', None, 'wb_g', P, widerspruch=True)
m('D19', 'holzfaser', 'lambda', 0.041, 'W/(m·K)', 'wb_k', hinweis='Standard-Dämmplatte, Rohdichte ca. 160 kg/m³')
m('D20a', 'holzfaser', 'brand_din', 'ThEGA: A2', None, 'thega', P, widerspruch=True, hinweis='Widerspruch zwischen Quellen, offen gelassen: Herstellerangabe prüfen.')
m('D20b', 'holzfaser', 'brand_din', 'WECOBIS Beispielprodukt: B2 / E', None, 'wb_k', P, widerspruch=True)
m('D20c', 'holzfaser', 'brand_din', 'WECOBIS WDVS-Tabelle: B1, B2', None, 'wb_g', P, widerspruch=True)
m('D21', 'holzfaser', 'feuchte', 'Ohne Hydrophobierung bei längerer Durchfeuchtung Aufquellen und Fäulnisgefahr', None, 'wb_k')
m('D22', 'zellulose', 'lambda', (0.040, 0.045), 'W/(m·K)', 'wb_l', hinweis='0,040 maschinell, 0,045 von Hand')
m('D23', 'zellulose', 'brand_din', 'B2 / E, teilweise B-s2,d0; Brandschutzmittel Borsalz oder Ammoniumphosphat; feuchteempfindlich', None, 'wb_l')
m('D24', ['zellulose', 'hanf_flachs'], 'verarbeitung', 'Dämmmatten zwischen Sparren teils in Eigenleistung; Einblasdämmung durch Fachfirma', None, 'sachsen_daemm', hinweis='undatiert')
m('D25', 'hanf_flachs', 'lambda', 0.040, 'W/(m·K)', 'wb_m')
m('D26', 'hanf_flachs', 'brand_din', 'B2 / E; feuchteempfindlich', None, 'wb_m')
m('D27', 'hanf_flachs', 'zulassung', 'Hanf im WDVS: ETA vorhanden, deutsche Zulassung im Stand 04/2018 nicht nachgewiesen', None, 'wb_g', P, hinweis='Stand alt.')
m('D28', 'schaumglas', 'lambda', (0.038, 0.050), 'W/(m·K)', 'wb_i', P, hinweis='0,038 (100 kg/m³), 0,042 (120), 0,050 (165); Zuordnung der Spalten Rohdichte zu λ angenommen.')
m('D29', 'schaumglas', 'brand_din', 'A1 / A1 (zwei Produkte); bitumenbeschichteter Stein B2 / D; resistent gegen Verrottung, Ungeziefer, Pilzbefall', None, 'wb_i')
m('D30', 'mineraldaemmplatte', 'lambda', (0.024, 0.1), 'W/(m·K)', 'wb_j', hinweis='Calciumsilikat; Euroklasse A1; µ 2 bis 6')
m('D31', 'mineraldaemmplatte', 'eignung', 'Calciumsilikat nicht für Außenwand geeignet; typisch Innendämmung (diffusionsoffen)', None, 'thega')
m('D32', 'stroh', 'lambda', (0.043, 0.052), 'W/(m·K)', 'wb_n', hinweis='Platten 0,043; Ballen 0,048 bis 0,052')
m('D33', 'stroh', 'brand_din', 'Euroklasse E', None, 'wb_n')
m('D34', 'stroh', 'zulassung', 'Schutz vor Feuchte nötig; Zulassung nötig', None, 'co2_daemm')
for rid, mat, v, b, h in [('D50a', 'mineralwolle', 14, 16, 'λ 0,035: 14 cm; 0,040: 16 cm'), ('D50b', 'eps', 14, 16, 'λ 0,035: 14 cm; 0,040: 16 cm'),
                          ('D50c', 'xps', 12, 14, 'λ 0,030: 12 cm; 0,035: 14 cm'), ('D50d', 'pur_pir', 10, 10, 'λ 0,025: 10 cm'),
                          ('D50e', 'holzfaser', 16, 18, 'λ 0,040: 16 cm; 0,045: 18 cm'), ('D50f', 'zellulose', 16, 18, 'λ 0,040: 16 cm; 0,045: 18 cm'),
                          ('D50g', 'hanf_flachs', 16, 16, 'λ 0,040: 16 cm'), ('D50h', 'schaumglas', 16, 18, 'λ 0,040: 16 cm; 0,045: 18 cm')]:
    m(rid, mat, 'dicke_u024', (v, b), 'cm', 'thega', G, hinweis='ThEGA-Tabelle ' + h)
m('D51', 'mineraldaemmplatte', 'dicke_u024', 20, 'cm', 'eigen', P, rechnung=True, hinweis='Bei λ 0,05, d = 4,0 · λ')
m('D52', 'stroh', 'dicke_u024', (17, 20), 'cm', 'eigen', P, rechnung=True, hinweis='λ 0,043: 17 cm; 0,049: 20 cm')
m('D60', ['mineralwolle', 'eps', 'pur_pir', 'holzfaser', 'zellulose', 'hanf_flachs', 'stroh', 'mineraldaemmplatte', 'wdvs'], 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True,
  ref='335.611.25, 335.614.25, 363.225.25, 361.311.25', hinweis='Kerndämmung, WDVS, Aufdach/Zwischensparren; Deckel bei 50. WDVS 2017: 40 (D62).')
m('D61', ['xps', 'schaumglas'], 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='335.121.25, 335.122.25', hinweis='Perimeterdämmung')
m('D62', 'wdvs', 'lebensdauer_2017', 40, 'Jahre', 'bbsr17', ref='335.641', hinweis='Durch Fassung 2026 ersetzt.')
m('D63', 'wdvs', 'lebensdauer_andere', 40, 'Jahre', 'thega', P, hinweis='ThEGA S. 3: durchschnittlich 40; widerspricht BBSR 2026 (≥ 50), vermutlich ältere BBSR-Fassung (nicht bestätigt).')
m('D64', 'vhf', 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='335.612.25', hinweis='Dämmschicht hinter hinterlüfteter Vorsatzschale')
m('D65', 'vhf', 'lebensdauer', None, 'Jahre', 'bbsr26', ref='335.814.25 bis 335.817.25', wert='Vorsatzschale: Kupfer, Zink, Edelstahl ≥ 50; Stahl galvanisch verzinkt und beschichtet 45; Stahl feuerverzinkt ≥ 50')
m('D66', 'wdvs', 'brand_din', 'Mineralwolle, Mineralschaum nicht brennbar; EPS, PUR, Phenol im System schwer entflammbar', None, 'wb_g', hinweis='Stand Mai 2016')
m('D67', 'wdvs', 'anforderung', 'Außenbekleidung: bis 7 m mindestens B2; über 7 bis 22 m mindestens B1; über 22 m nicht brennbar (MBO/LBO)', None, 'wb_g', hinweis='Landesbauordnung des Orts prüfen.')
gwp('D70', 'mineralwolle', 191.58, 'kg CO2e je m³', 'daemm_m3', '5ad90c89-55b4-495f-9879-9b19356a2d1a', hinweis='145 kg/m³; andere Versionen 192,11 und 196,03.')
gwp('D70r', 'mineralwolle', 6.7, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='GWP je m³ mal λ 0,035 (WECOBIS-Beispielwert, Annahme).')
gwp('D71', 'eps', 86.93, 'kg CO2e je m³', 'daemm_m3', '121c71e8-0f4c-4529-b72e-331198d15f0f', hinweis='25 kg/m³ generisch; Branchen-Ø 15 kg/m³: 46,99.')
gwp('D71r', 'eps', 3.0, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,035 angenommen')
gwp('D72', 'xps', 94.03, 'kg CO2e je m³', 'daemm_m3', '37f50a3e-5445-4bce-8eda-98f01dba441f', hinweis='32 kg/m³ generisch')
gwp('D72r', 'xps', 3.2, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,034 angenommen')
gwp('D73a', 'pur_pir', 176.05, 'kg CO2e je m³', 'daemm_m3', 'b960f95d-466b-4014-9565-64e51407a364', hinweis='PUR 30 kg/m³')
gwp('D73b', 'pur_pir', 99.15, 'kg CO2e je m³', 'daemm_m3', 'c2ba651c-00bf-4f69-a0dc-a6a5fe680652', hinweis='PIR 30 kg/m³')
gwp('D73r', 'pur_pir', 4.4, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='PUR; λ 0,025 angenommen. PIR: 2,5 je m².')
gwp('D73s', 'pur_pir', 2.5, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='PIR; λ 0,025 angenommen')
gwp('D74', 'holzfaser', -170.41, 'kg CO2e je m³', 'daemm_m3', 'eefa40b3-7156-43a9-b197-b908f204432b', hinweis='Holzfaserplatte nass 160 kg/m³; negativ wie A75.')
gwp('D74r', 'holzfaser', -7.0, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,041')
gwp('D75', 'zellulose', -73.37, 'kg CO2e je m³', 'daemm_m3', 'c355d75b-9026-4899-a41c-e5d221c424f2', ind='GWP (EN 15804+A1)', hinweis='Einblas 45 kg/m³; älterer Indikator GWP; negativ wie A75.')
gwp('D75r', 'zellulose', -2.9, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,040')
gwp('D76', 'hanf_flachs', 19.16, 'kg CO2e je m³', 'daemm_m3', '5ef0c519-f5b2-4d45-809d-5f417f90e90b', hinweis='Hanfvlies 38 kg/m³')
gwp('D76r', 'hanf_flachs', 0.8, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,040')
gwp('D77', 'schaumglas', 2.39, 'kg CO2e je kg', 'daemm_kg', '7091503e-34e5-44cd-9acb-7c2f16f6097f', hinweis='Je kg, nicht je m³.')
gwp('D77m', 'schaumglas', 287, 'kg CO2e je m³', 'daemm_m3', rechnung=True, hinweis='2,39 mal angenommene Rohdichte 120 kg/m³.')
gwp('D77r', 'schaumglas', 12.0, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,042')
gwp('D78', 'mineraldaemmplatte', 1403.94, 'kg CO2e je 1000 kg', 'daemm_t', 'ad750582-1987-46da-ac51-b309afa38169', hinweis='Calciumsilikat mikroporös Ø; kein m²-Wert berechnet.')
gwp('D79', 'stroh', -98.03, 'kg CO2e je m³', 'daemm_m3', 'e45e2b55-a8c4-4037-bc7d-e3718c4e28f3', hinweis='100 kg/m³; negativ wie A75.')
gwp('D79r', 'stroh', -4.8, 'kg CO2e je m² bei R = 1', 'daemm_m2_r1', rechnung=True, hinweis='λ 0,049')
for rid, mat, p, h in [('D80a', 'eps', 15, 'λ 0,040, 15 cm'), ('D80b', 'xps', 25, 'λ 0,040, 15 cm'), ('D80c', 'mineralwolle', 15, 'Steinwolle λ 0,037 / Glaswolle 0,036, 15 cm'),
                       ('D80d', 'pur_pir', 15, 'λ 0,022, 10 cm'), ('D80e', 'zellulose', 15, 'λ 0,042, 15 cm'), ('D80f', 'hanf_flachs', 20, 'λ 0,042, 15 cm'),
                       ('D80g', 'holzfaser', 45, 'λ 0,047, 20 cm'), ('D80h', 'schaumglas', 50, 'λ 0,045, 15 cm')]:
    m(rid, mat, 'preis', p, '€/m² bei U = 0,24', 'eexp_daemm', P, basis='daemm_u024', hinweis='Richtwert ' + h)
for rid, mat, p, h in [('D81a', 'zellulose', 20, 'Flocken 20, Platten 23'), ('D81b', 'holzfaser', 21.5, 'Platten 22, Matten 21, lose 20'), ('D81c', 'hanf_flachs', 26, 'Hanfmatten 26, Stopfwolle 31, Flachsmatten 22'),
                       ('D81d', 'stroh', 25, 'Einblas 24, Ballen 26')]:
    m(rid, mat, 'preis', p, '€/m² (Dämmdicke GEG)', 'co2_daemm', P, basis='daemm_gmodg', hinweis=h)
m('D82', 'wdvs', 'preis', (120, 200), '€/m² mit Montage', 'suchtreffer', P, hinweis='co2online via Suchtreffer (andere Ausgabe 140 bis 170); Bericht 07: 130 bis 250.', basis='fassade')
m('D83', 'vhf', 'preis', (180, 300), '€/m² mit Montage', 'suchtreffer', P, hinweis='energie-experten.org via Suchtreffer (älter 150 bis 250); Vermittlungsportal.', basis='fassade')
m('D84', 'vhf', 'brand_din', 'Mit Steinwolle nicht brennbar', None, 'suchtreffer', P)
m('D85', 'vhf', 'nachteil', 'Teurer; mehr Bauteile; Unterkonstruktion mechanisch befestigt, Trennbarkeit besser als bei verklebtem WDVS (Schluss aus ThEGA)', None, 'thega', P)
m('D86', 'wdvs', 'nachteil', 'Verklebung, Rückbau, Sockel und Anschlüsse', None, 'thega', P)
LUE('L_daemm_wartung', ['mineralwolle', 'eps', 'xps', 'pur_pir', 'holzfaser', 'zellulose', 'hanf_flachs', 'schaumglas', 'mineraldaemmplatte', 'stroh'], 'wartung', 'Keine Quelle zur Wartung von Dämmstoffen.')

# ===== Dach =====
m('R01', 'tonziegel', 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='363.212.25')
m('R02', 'betondachstein', 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='363.213.25', hinweis='Beton, Faserzement')
m('R03', 'schiefer', 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='363.211.25')
m('R04', 'metall', 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='363.214.25', hinweis='Zink, Kupferblech, Aluminium unbeschichtet, Stahl nicht rostend')
m('R05', 'metall', 'lebensdauer_andere', (40, 45), 'Jahre', 'bbsr26', ref='363.216.25 / 363.217.25', hinweis='Stahl galvanisch verzinkt und beschichtet 45; nur verzinkt 40')
m('R06', 'bitumen', 'lebensdauer', 25, 'Jahre', 'bbsr26', ref='363.219.25', hinweis='Schindeln und Wellplatten')
m('R07', 'bitumen', 'lebensdauer_andere', 30, 'Jahre', 'bbsr26', ref='363.113.25', hinweis='Bahnen, nicht genutztes Dach; unter Dämmung/Begrünung 35 (363.112.25)')
m('R08', 'epdm', 'lebensdauer', (30, 40), 'Jahre', 'bbsr26', ref='363.114.25 / 363.111.25', hinweis='Kunststoff-/Elastomerbahnen: 30 nicht genutzt, 40 unterhalb Dämmung')
m('R09', 'gruendach', 'lebensdauer', (35, 45), 'Jahre', 'bbsr26', ref='363.125.25 / 363.126.25', hinweis='Schutzschicht extensive Begrünung 45; Bekiesung/Intensivbegrünung 35. Abdichtung darunter (Bitumen) 35.')
m('R10', 'reet', 'lebensdauer', 35, 'Jahre', 'bbsr26', ref='363.224.25', hinweis='BBSR 2017: 30 (363.524)')
for rid, mat, v, h in [('R30a', 'tonziegel', 45, '1800 kg/m³ Ton'), ('R30b', 'betondachstein', 42, ''), ('R30c', 'schiefer', 30, ''), ('R30d', 'bitumen', 5, 'Bahn V 60'), ('R30e', 'epdm', 2, '')]:
    m(rid, mat, 'gewicht', v, 'kg/m²', 'oekobaudat', G, hinweis=h or None)
m('R31', 'metall', 'brand_din', 'Zink: A nicht brennbar (DIN 4102-1); Aluminium A1 / A1', None, 'wb_x')
m('R32', 'metall', 'nachteil', 'Zink bildet Schutzschicht; elektrolytische Korrosion bei Berührung mit Kupfer', None, 'wb_x')
m('R33a', 'bitumen', 'brand_din', 'Unterdach-/Unterdeck-/Unterspannbahnen E (EN 13501); Bitumenbahn als Dichtbahn B2 (DIN 4102)', None, 'wb_w')
m('R33b', 'epdm', 'brand_din', 'Kunststoff-Dichtbahnen B2 (DIN 4102)', None, 'wb_w')
gwp('R40a', 'tonziegel', 16.59, 'kg CO2e je m²', 'dach_m2', '592ffe6e-4c21-4a24-ba67-273acbfca373', hinweis='Drei generische Datensätze 16,59 / 15,61 / 15,88; Branchen-Ø 12,33.')
gwp('R40b', 'tonziegel', 12.33, 'kg CO2e je m²', 'dach_m2', None, hinweis='Branchen-Durchschnitt.')
gwp('R41a', 'betondachstein', 12.98, 'kg CO2e je m²', 'dach_m2', 'ee6d9736-2ddd-4d2d-acc1-3ea1031c1f9e', hinweis='Generisch.')
gwp('R41b', 'betondachstein', 9.03, 'kg CO2e je m²', 'dach_m2', '310c8696-3cdf-40ea-ab3e-d7b328b04ce0', hinweis='Hersteller-Ø (BMI Deutschland), A1+A2+A3 summiert.')
gwp('R42', 'schiefer', 15.39, 'kg CO2e je m²', 'dach_m2', '8847396e-ce82-433d-9f65-8bc144a2a7a4')
gwp('R43', 'metall', 3.39, 'kg CO2e je kg', 'dach_kg', '26353b00-6cd3-426d-903b-9fc5b1670398', hinweis='Zinkblech; Blechmasse je m² fehlt, kein m²-Wert.')
gwp('R44', 'bitumen', 2.23, 'kg CO2e je m²', 'dach_m2', 'da3f32e3-7b0d-44f2-ba03-8dd93aa94f75', hinweis='Nur die Bahn V 60.')
gwp('R45', 'epdm', 8.35, 'kg CO2e je m²', 'dach_m2', '48a0f50e-6dd0-4495-b0a4-210315b06680')
gwp('R46', 'gruendach', 4.23, 'kg CO2e je m²', 'dach_m2', 'b2edf535-557e-486a-9c31-8ad569c5f2ce', s=P, hinweis='Bilanzgrenzen des Datensatzes nicht geprüft.')
m('R50a', 'tonziegel', 'preis', (25, 30), '€/m²', 'eexp_dach', P, basis='dach', hinweis='Doppelmuldenziegel; Mönch/Nonne ca. 50; Flachdachziegel ca. 25; Material oder inkl. Verlegung nicht angegeben; Seitenstand 29.07.2024.')
m('R51', 'betondachstein', 'preis', 20, '€/m² inkl. Verlegung', 'eexp_dach', P, basis='dach_verlegt', hinweis='Seitenstand 29.07.2024')
m('R52', 'schiefer', 'preis', (80, 100), '€/m² inkl. Verlegung', 'eexp_dach', P, basis='dach_verlegt', hinweis='ca. 80 bis über 100; bauen.de Suchtreffer: einfache Deckung 60 bis 80, Altdeutsche ab ca. 110 (unsicher).')
m('R54', 'bitumen', 'preis', (8, 10), '€/m² nur Material (Dachpappe)', 'suchtreffer', P, basis='dach_material')
m('R55', 'bitumen', 'preis', (100, 200), '€/m² Flachdachsanierung', 'suchtreffer', P, basis='dach_sanierung', hinweis='energie-experten.org via Suchtreffer')
m('R56', 'bitumen', 'lebensdauer_andere', (10, 15), 'Jahre', 'suchtreffer', P, widerspruch=True, hinweis='bauen.de Suchtreffer: Erneuerung alle 10 bis 15 Jahre; widerspricht BBSR (Bahnen 30, Schindeln 25).')
m('R57', 'epdm', 'lebensdauer_andere', 50, 'Jahre', 'suchtreffer', P, ge=True, hinweis='Herstellerangabe "über 50", Suchtreffer; BBSR 30 bis 40.')
m('R58', 'gruendach', 'preis', (30, 60), '€/m²', 'co2_gruen', P, basis='gruen', hinweis='co2online 2022 (Preisstand 2022); aus Recherche 29. Pflege laut 29: 0,5 bis 2 €/m² und Jahr (unsicher).')
m('R59', 'reet', 'preis', 50, '€/m² Material (Verlegung über 100)', 'suchtreffer', P, basis='dach_material', hinweis='Material 50 bis 60, Verlegung über 100; bauen.de / energie-experten.org Suchtreffer.')
m('R60', 'reet', 'lebensdauer_andere', (30, 40), 'Jahre', 'suchtreffer', P, hinweis='Suchtreffer; unter guten Umständen mehr; BBSR 35.')
LUE('L_dach_preis', ['metall', 'epdm'], 'preis', 'Kein Preis für Metalldach und EPDM gefunden.')
LUE('L_dach_brand', ['tonziegel', 'betondachstein', 'schiefer', 'reet'], 'brand_din', 'Keine Quelle zur Brandklasse.')
LUE('L_dach_wartung', ['tonziegel', 'betondachstein', 'schiefer', 'metall', 'bitumen', 'epdm', 'gruendach', 'reet'], 'wartung', 'Keine Quelle zur Wartung gefunden.')

# ===== Fenster =====
m('F01', ['pvc', 'holzfenster', 'holzalu', 'alu'], 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='334.211.25 / 334.212.25 / 334.213.25', hinweis='Rahmen und Flügel; Nadelholz behandelt, Laubholz, Alu-Holz, Aluminium, PVC-U.')
m('F02', ['pvc', 'holzfenster'], 'lebensdauer_2017', 40, 'Jahre', 'bbsr17', ref='334.212', hinweis='Kunststoff, Nadelholz behandelt; durch 2026 ersetzt.')
gwp('F20a', 'pvc', 80.03, 'kg CO2e je m² Fenster', 'fenster_m2', '0890b210-0a2d-4880-b773-a7616342f849', hinweis='2-fach Isolierglas, Ø.')
gwp('F20b', 'pvc', 96.29, 'kg CO2e je m² Fenster', 'fenster_m2', 'ba632d37-312b-447c-92cf-e86ee73d753e', hinweis='3-fach Isolierglas, Ø (plus 16,3 gegenüber 2-fach).')
gwp('F21', 'holzfenster', 35.78, 'kg CO2e je m² Fenster', 'fenster_m2', '2105571b-1fba-4f73-8260-11a142b5c15f', hinweis='Branchen-EPD (VFF).')
gwp('F22', 'holzalu', 70.77, 'kg CO2e je m² Fenster', 'fenster_m2', '7d69f7e2-b235-4e15-ba66-f96a80ddfb1d', hinweis='VFF.')
gwp('F23', 'alu', 149.83, 'kg CO2e je m² Fenster', 'fenster_m2', '13dbfb7d-3375-43c6-90e9-ccf76c117837', s=P, hinweis='Ein Herstellerprodukt (RAICO FRAME+ 75), kein Branchendurchschnitt.')
m('F30', 'pvc', 'preis', (88, 150), '€ je Fenster (1,0 × 1,0 m bis 2,0 × 1,0 m)', 'eexp_fenster', P, basis='fenster_stueck', hinweis='Seitenstand 29.07.2024; Ug 1,0, 2- oder 3-fach nicht angegeben; ohne Einbau.')
m('F31', 'holzfenster', 'preis', (250, 400), '€/m²', 'eexp_fenster', P, basis='fenster_m2', hinweis='Kiefer: 250 bis 350, mit Isolierverglasung 300 bis 400.')
m('F32', 'holzalu', 'preis', (326, 891), '€ je Fenster (Dreh-Kipp, einflügelig)', 'eexp_fenster', P, basis='fenster_stueck')
m('F33', 'alu', 'preis', (131, 351), '€ je Fenster (0,5 × 0,5 m bis 2,0 × 1,3 m)', 'eexp_fenster', P, basis='fenster_stueck', nb='netto', hinweis='Listenpreis netto.')
m('F34', 'holzfenster', 'wartung', 'Holzschutz bei Holz allgemein: vorbeugend baulich, sonst chemisch nach DIN 68800; Haltbarkeit hängt von Holzschutz und Einbausituation ab', None, 'wb_s', hinweis='Für Fenster im Besonderen keine Quelle.')
LUE('L_fenster_wartung', ['pvc', 'holzalu', 'alu'], 'wartung', 'Keine Quelle zur Wartung; auch keine Uf-Werte der Rahmen.')
m('F40', 'v2_alt', 'ug', 3.4, 'W/(m²·K)', 'wb_t', hinweis='SZR 6 bis 8 mm; 3-fach 2,4; Einfachscheibe 5,8. Kommt heute praktisch nicht mehr vor.')
m('F41a', 'v2_luft', 'ug', (1.4, 1.6), 'W/(m²·K)', 'wb_u', hinweis='1,6 (SZR 12 mm), 1,4 (SZR 16 mm); beispielhaft; erfüllt GEG-Ug 1,1 nicht.')
m('F41b', 'v2_argon', 'ug', 1.1, 'W/(m²·K)', 'wb_u', hinweis='SZR 16 mm; genau an der GModG-Grenze Ug ≤ 1,1 beim Glastausch. Krypton 1,0.')
m('F41c', 'v3_argon', 'ug', 0.7, 'W/(m²·K)', 'wb_u', hinweis='2 × SZR 12 mm; Dreischeibengläser nur mit Gasfüllung.')
m('F41d', 'v3_krypton', 'ug', 0.5, 'W/(m²·K)', 'wb_u', hinweis='Teurer, keine Preisquelle.')
m('F43', ['v2_alt', 'v2_luft', 'v2_argon', 'v3_argon', 'v3_krypton'], 'lebensdauer', 30, 'Jahre', 'bbsr26', ref='334.316.25', hinweis='Gleich für 2-fach und 3-fach. Ende laut WECOBIS erreicht, wenn Tauwasser im Scheibenzwischenraum auftritt.')
m('F44a', 'v2_luft', 'rw', 35, 'dB', 'wb_u', hinweis='Aufbau 6/18/4')
m('F44b', 'v2_argon', 'rw', 37, 'dB', 'wb_u', hinweis='Aufbau 8/16/4')
LUE('L_glas_rw', ['v3_argon', 'v3_krypton', 'v2_alt'], 'rw', 'Keine Quelle für Schalldämmmaß.')

# ===== Boden =====
m('B01', 'laminat', 'lebensdauer', (15, 20), 'Jahre', 'bbsr26', ref='353.125.25 / 353.126.25', hinweis='Wohnen: Nutzungsklasse 31: 15; 32/33: 20. Kürzeste Lebensdauer in der Auswahl.')
m('B02', 'vinyl', 'lebensdauer', (15, 20), 'Jahre', 'bbsr26', P, ref='353.132.25; 353.124.25', hinweis='Zuordnung unsicher: PVC-heterogen 20, MMF-Beläge nach EN 16511 15 bis 20.')
m('B03', 'parkett', 'lebensdauer', (45, 50), 'Jahre', 'bbsr26', ref='353.141.25 / 353.142.25 / 353.143.25', hinweis='Vollholz, Dielen und Mehrschichtparkett ab 3,5 mm Nutzschicht ≥ 50; darunter 45.')
m('B04', 'fliesen', 'lebensdauer', 50, 'Jahre', 'bbsr26', ge=True, ref='353.118.25')
m('B05', 'linoleum', 'lebensdauer', 25, 'Jahre', 'bbsr26', ref='353.131.25', hinweis='Linoleum, PVC-homogen')
m('B10', 'laminat', 'brand_din', 'DIN 4102 B1 / EN 13501 Cfl', None, 'wb_v')
m('B11', 'laminat', 'schall', 'Härterer Klang, nicht so trittelastisch; Trittschalldämmung nötig', None, 'wb_v')
m('B11f', 'laminat', 'feuchte', 'Oberseitig keine Feuchteaufnahme; Einsatz in Feucht- und Nassräumen eingeschränkt', None, 'wb_v')
m('B12', 'vinyl', 'brand_din', 'PVC-Beläge B1 bis B2 / Bfl-s1, Efl', None, 'wb_v')
m('B13', 'parkett', 'brand_din', 'Holzfußböden B1, B2 / Cfl-s1, Dfl-s1', None, 'wb_v')
m('B14', 'fliesen', 'brand_din', 'A1 / A1fl; sehr strapazierbar, dauerhaft', None, 'wb_v')
m('B15', 'linoleum', 'brand_din', 'B1 bzw. B2 / Cfl-s1 bzw. Efl', None, 'wb_v')
gwp('B20a', 'laminat', -1.32, 'kg CO2e je m²', 'boden_m2', '14286caa-6bc1-4aa0-93d6-22d0f5b21195', hinweis='DPL generisch; Holzkohlenstoff verbucht (negativ wie A75).')
gwp('B20b', 'laminat', -6.01, 'kg CO2e je m²', 'boden_m2', '54731578-8a09-443b-bc07-371147109759', hinweis='EGGER Hersteller-Ø.')
gwp('B21', 'vinyl', 8.19, 'kg CO2e je m²', 'boden_m2', '39da14a3-8f39-4af9-955c-6a70f091acb8', ind='GWP (EN 15804+A1)', hinweis='PVC-Bodenbelag generisch (kein reiner Vinyl-Designboden); älterer Indikator GWP.')
gwp('B22a', 'parkett', -3.04, 'kg CO2e je m²', 'boden_m2', '19c8f194-c3ab-4797-9b1a-8f1788bf12d8', hinweis='Mehrschichtparkett generisch 6,5 kg/m²; negativ wie A75.')
gwp('B22b', 'parkett', -5.99, 'kg CO2e je m²', 'boden_m2', '6b316150-e55c-4c57-ba3f-128768599784', hinweis='VdP-Branche.')
gwp('B23', 'fliesen', 12.94, 'kg CO2e je m²', 'boden_m2', 'a2b5b7c9-db13-4dbd-be23-b0ff9f0cbd98', hinweis='Keramikfliesen Ø')
gwp('B24', 'linoleum', 4.08, 'kg CO2e je m²', 'boden_m2', 'c3d7aef9-38a6-4d2a-a77f-2eee25461482', hinweis='Generisch')
for rid, mat, p in [('B30a', 'laminat', 45), ('B30b', 'vinyl', 85), ('B30c', 'fliesen', 120), ('B30d', 'parkett', 140)]:
    m(rid, mat, 'preis', p, '€/m² inkl. Verlegung', 'ci_boden', P, ab='2026-10-26', basis='boden_verlegt', hinweis='Wert aus Recherche 22 (clean-invoice 06.03.2026), siehe auch innenausbau.js.')
LUE('L_boden', 'linoleum', 'preis', 'Kein Preis gefunden.')
LUE('L_boden_nachteil', ['fliesen', 'linoleum'], 'nachteil', 'Keine Nachteilsangabe in der Quelle.')
LUE('L_boden_feuchte', ['vinyl', 'parkett', 'fliesen', 'linoleum'], 'feuchte', 'Keine Quelle gefunden.')

# ===== Eigene Einordnung (R078) =====
AMPEL = [
    z('amp_lebensdauer', 'Lebensdauer (BBSR)', 'Jahre', None, None, 'bbsr26', E, kriterium='lebensdauer', gruen='ab 50', gelb='25 bis 49', rot='unter 25',
      hinweis='Eigene Einordnung aus offengelegten Schwellen, keine Empfehlung (R078). BBSR deckelt bei "≥ 50": Balken trennen nur kurzlebige von langlebigen Stoffen. Vom Nutzer noch zu bestätigen.'),
    z('amp_brand', 'Brandverhalten nach DIN 4102 (EN 13501 daneben anzeigen)', None, None, None, 'wb_g', E, kriterium='brand_din', gruen='A1, A2', gelb='B1', rot='B2 und schlechter',
      hinweis='Eigene Einordnung (R078). DIN 4102 und EN 13501 nie vermischen; bei Widerspruch (Holzfaser, PUR) Herstellerangabe prüfen. Vom Nutzer zu bestätigen.'),
    z('amp_dicke', 'Dämmwirkung: Dicke für U ≤ 0,24 (ThEGA-Tabelle)', 'cm', None, None, 'thega', E, kriterium='dicke_u024', gruen='bis 12', gelb='13 bis 16', rot='ab 18',
      hinweis='Eigene Einordnung (R078), Vorschlag aus Bericht 30 unverändert. OFFEN FÜR DEN NUTZER: 17 cm fällt in keine Stufe (Stroh bei λ 0,043 braucht 17 cm); Vorschlag gelb bis 17 cm.'),
    z('amp_preis', 'Preis: nur relativ innerhalb desselben Bauteils und derselben Preisbasis (Feld basis)', None, None, None, 'eigen', E, kriterium='preis',
      hinweis='Ohne belastbare Quelle keine Ampel, stattdessen "Preis prüfen". Alle Preise stehen auf prüfen vor Nutzung.'),
    z('amp_gwp', 'Ökobilanz: Balken nur innerhalb gleicher Skala (Feld skala); bei Dämmstoffen die Rechnung je m² bei R = 1', None, None, None, 'eigen', E, kriterium='gwp',
      hinweis='Einheiten (m³, m², t, kg) nie mischen; GWP (alt) und GWP-total nur ungefähr vergleichbar; negativ = in der Herstellung gespeicherter Kohlenstoff, am Lebensende wieder frei.'),
]
WIDERSPRUECHE = [
    {'id': 'w_ma_01', 'text': 'WDVS-Lebensdauer: BBSR 2026 mindestens 50 Jahre, BBSR 2017 40 Jahre, ThEGA 40 Jahre. ThEGA nutzt vermutlich die ältere Fassung (nicht bestätigt).', 'betrifft': ['D60', 'D62', 'D63']},
    {'id': 'w_ma_02', 'text': 'Bitumen-Dach: BBSR Bahnen 30 / Schindeln 25 Jahre gegen bauen.de (Suchtreffer) Erneuerung alle 10 bis 15 Jahre. Dachform-Lebensdauern aus Bericht 29 (Satteldach 80 bis 100, Mansard 70 bis 90, Pult 50 bis 60; werbliche Quellen) liegen über dem BBSR-Deckel 50 für Eindeckungen.', 'betrifft': ['R56', 'R06', 'R07']},
    {'id': 'w_ma_03', 'text': 'Brandklasse Holzfaser: ThEGA A2, WECOBIS Beispielprodukt B2 / E, WECOBIS WDVS-Tabelle B1/B2. Nicht entschieden: Herstellerangabe prüfen.', 'betrifft': ['D20a', 'D20b', 'D20c']},
    {'id': 'w_ma_04', 'text': 'Brandklasse PUR/PIR: ThEGA und WDVS-Tabelle B1, WECOBIS PUR-Hartschaum B2 / E. Nicht entschieden.', 'betrifft': ['D18a', 'D18b', 'D18c']},
    {'id': 'w_ma_05', 'text': 'Holzfaser-Preis 45 €/m² (bei 20 cm, Basis U = 0,24) gegen 21 bis 22 €/m² (Basis Dämmdicke GEG, co2online): verschiedene Basis, nicht auf einem Balken.', 'betrifft': ['D80g', 'D81b']},
    {'id': 'w_ma_06', 'text': 'Bericht 29 schreibt, die BBSR-Nutzungsdauertabelle sei nicht gefunden; Bericht 30 hat sie gefunden und ausgelesen (Excel, Stand 13.03.2026 laut Dateiname; Spaltenkopf 04.11.2025).', 'betrifft': ['bbsr26']},
    {'id': 'w_ma_07', 'text': 'GWP-Indikator gemischt: einige Datensätze führen den älteren Indikator GWP (A71, D75, B21), andere GWP-total. Balken mit beiden sind nur ungefähr.', 'betrifft': ['A71', 'D75', 'B21']},
    {'id': 'w_ma_08', 'text': 'Gründach: BBSR-Schutzschicht 45 Jahre, Abdichtung darunter 35 Jahre; Bericht 29 (HLNUG, Suchtreffer): Begrünung verlängert die Abdichtung um 10 bis 20 Jahre.', 'betrifft': ['R09']},
    {'id': 'w_ma_10', 'text': 'sanierung.js fenster 500 bis 900 € je Stück (3-fach, inkl. Einbau) gegen F30 bis F33: Kunststoff 88 bis 150 € je Fenster (1 × 1 m, Seitenstand 2024, ohne Einbau), Holz 250 bis 400 €/m², Holz-Alu 326 bis 891, Alu 131 bis 351 netto: andere Basis, anderes Jahr, nicht vergleichbar.', 'betrifft': ['F30', 'F31', 'F32', 'F33', 'sanierung.js:fenster']},
    {'id': 'w_ma_09', 'text': 'Bericht 30 nennt Bericht-07-Bereich WDVS 130 bis 250 €/m², co2online-Suchtreffer 120 bis 200 (andere Ausgabe 140 bis 170); sanierung.js fassade 130 bis 250.', 'betrifft': ['D82']},
]

OBJ = {
    'meta': {
        'titel': 'Baumaterial-Vergleich je Bauteil',
        'abruf': '2026-10-27',
        'hinweis': 'Eine Zeile je Material und Kriterium (Lücke = nichts gefunden). Alle Preise prüfen vor Nutzung, keine amtliche Preisquelle; Feld basis trennt nicht vergleichbare Preisbasen. Brandklassen DIN 4102 und EN 13501 getrennt lassen. GWP nur innerhalb gleicher skala vergleichen. ge = mindestens.',
        'preisbasen': 'Dämmpreise: basis daemm_u024 = Richtwerte für U = 0,24 mit genannter Dicke (energie-experten.org, Seite 28.09.2026 ohne Preisdatum, Vermittlungsportal); daemm_gmodg = Materialpreis Dämmdicke GEG (co2online, Stand 2024/2025, Dicke nicht genannt). Beide Basen nie auf einem Balken.',
        'u_ziel': 0.24,
        'u_ziel_hinweis': 'GModG Anlage 7: Außenwand und Dach U ≤ 0,24 W/(m²·K) bei Änderung am Bestand (siehe daemmung_lueftung.js).',
        'dicke_formel': 'd = λ · (1/0,24 − 0,17), Übergangswiderstände 0,17 m²K/W aus Abgleich mit ThEGA, nicht aus einer Norm; nur Orientierung.',
    },
    'quellen': QUELLEN,
    'meta_bauteile': BAUTEILE,
    'meta_materialien': [{'id': k, 'bauteil': v[0], 'name': v[1]} for k, v in MAT.items()],
    'meta_kriterien': [{'id': k, 'name': v} for k, v in KRIT.items()],
    'kennwerte': ZEILEN,
    'ampel': AMPEL,
    'widersprueche': WIDERSPRUECHE,
}

if __name__ == '__main__':
    print(schreibe('material', 'Baumaterial je Bauteil, eine Zeile je Material und Kriterium. Quelle: recherche/30_baumaterial.md (Abruf 27.10.2026). Erzeugt von erzeuger/daten_d_material.py.', OBJ))
