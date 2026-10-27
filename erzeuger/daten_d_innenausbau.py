# -*- coding: utf-8 -*-
"""Erzeugt daten/innenausbau.js aus recherche/22_innenausbau_solar.md (Abschnitt 1, 1b, Werte-Tabelle)."""
from daten_d_common import maker, schreibe, G, P, N, L

z = maker('2026-10-26')

QUELLEN = {
    'ci_wohnung': {'titel': 'clean-invoice, Wohnung sanieren Kosten (aktualisiert 06.03.2026)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/wohnung-sanieren-kosten'},
    'ci_bad': {'titel': 'clean-invoice, Badsanierung Kosten (Stand Februar 2026)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/badezimmer-sanieren-kosten'},
    'ci_trockenbau': {'titel': 'clean-invoice, Trockenbau Kosten pro m² (aktualisiert 22.03.2026)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/trockenbau-kosten-pro-qm'},
    'ci_maler': {'titel': 'clean-invoice, Maler Kosten pro m² (aktualisiert März 2026)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/maler-kosten-pro-qm'},
    'ci_putz': {'titel': 'clean-invoice, Innenputz Kosten pro m² (Stand März 2026)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/innenputz-kosten-pro-qm'},
    'ci_tuer': {'titel': 'clean-invoice, Tür einbauen Kosten (Tabelle Stand Februar 2026)', 'url': 'https://www.clean-invoice.com/wissen/allgemein/tuer-einbauen-kosten'},
    'reduco_hk': {'titel': 'reduco.ai, Heizkörper austauschen Kosten (Stand 07.09.2026)', 'url': 'https://reduco.ai/blog/heizung/heizkoerper-austauschen-kosten'},
    'co2_fbh': {'titel': 'co2online, Fußbodenheizung Kosten (17.06.2026)', 'url': 'https://www.co2online.de/modernisieren-und-bauen/heizung/fussbodenheizung/fussbodenheizung-kosten/'},
    'meister_job': {'titel': 'meister-job.de, Preise Elektroinstallation (nur Textauszug; Wert nicht verwenden)', 'url': 'https://meister-job.de/was-kosten-elektroinstallation/'},
    'cochem_zell': {'titel': 'Landkreis Cochem-Zell, Merkblatt Elektroinstallation M1, Tabelle 2 nach RAL-RG 678 (PDF, rekonstruiert)', 'url': 'https://www.cochem-zell.de/themen/bauen-wohnen-umwelt/untere-bauaufsichtsbehoerde/merkblatt-zur-elektroinstallation.pdf?cid=1czj'},
    'baunetz_elektro': {'titel': 'baunetzwissen.de, Installationsumfang und Ausstattungswerte (undatiert)', 'url': 'https://www.baunetzwissen.de/elektro/fachwissen/grundinstallationen/installationsumfang-und-ausstattungswerte-152964'},
    'bericht22': {'titel': 'Recherche 22, Abschnitt Offene Punkte / Suchlage (keine Quelle gefunden)', 'url': 'recherche/22_innenausbau_solar.md'},
}

# bezug = Menge aus dem Grundriss: boden_m2, wand_m2, decke_m2, stueck, raum, bad, tuer, kueche, anlage
GEWERKE = [
    {'id': 'elektrik', 'name': 'Elektrik'},
    {'id': 'sanitaer', 'name': 'Sanitär und Bad'},
    {'id': 'heizung', 'name': 'Heizung'},
    {'id': 'trockenbau', 'name': 'Trockenbau'},
    {'id': 'boden', 'name': 'Bodenbelag'},
    {'id': 'waende', 'name': 'Wände (Maler, Putz)'},
    {'id': 'decke', 'name': 'Decke'},
    {'id': 'tueren', 'name': 'Innentüren'},
    {'id': 'kueche', 'name': 'Küche anschließen'},
]

NA = 'nicht angegeben'
B = 'brutto'


def r(id, gewerk, name, einheit, bezug, von, bis, q, nb=NA, typ=None, s=P, **kw):
    return z(id, name, einheit, von, bis, q, s, gewerk=gewerk, bezug=bezug, typisch=typ, nb=nb, **kw)


KOSTEN = [
    # Elektrik
    r('ib_elektro_teil', 'elektrik', 'Elektrik teilweise (Steckdosen, Schalter)', '€/m² Wohnfläche', 'boden_m2', 50, 80, 'ci_wohnung'),
    r('ib_elektro_komplett', 'elektrik', 'Elektrik komplette Neuverkabelung', '€/m² Wohnfläche', 'boden_m2', 120, 180, 'ci_wohnung'),
    r('ib_steckdose_zusatz', 'elektrik', 'Zusätzliche Steckdose setzen (Material und Arbeit)', '€ je Stück', 'stueck', None, None, 'meister_job', s=N,
      hinweis='Wert aus meister-job.de nicht verwenden (Einzelquelle, nur Textauszug, Abruf an der Bot-Sperre gescheitert). Neu aus unabhängiger Quelle holen.'),
    r('ib_zaehlerschrank', 'elektrik', 'Sicherungskasten / Zählerschrank komplett erneuern', '€ je Anlage', 'anlage', None, None, 'meister_job', s=N,
      hinweis='Wert aus meister-job.de nicht verwenden (nur Suchtreffer-Auszug). Neu aus unabhängiger Quelle holen.'),
    r('ib_bad_elektro', 'elektrik', 'Elektro im Bad (Leitungen, FI, Spots)', '€ je Bad', 'bad', 600, 1200, 'ci_bad'),
    r('ib_luecke_auslass', 'elektrik', 'Preis je Lichtauslass, Schalter, Netzwerkdose, Unterverteilung', '€ je Stück', 'stueck', None, None, 'bericht22', s=L,
      hinweis='Keine brauchbare Quelle gefunden; nur Forenbeiträge ohne Datum (40 € je Steckdose, 145 € je Cat6-Doppeldose, 530 € je Verteiler), nicht übernommen.'),
    # Sanitär
    r('ib_bad_einfach', 'sanitaer', 'Bad komplett, einfach', '€ je Bad', 'bad', 8000, 12000, 'ci_wohnung'),
    r('ib_bad_mittel', 'sanitaer', 'Bad komplett, mittel', '€ je Bad', 'bad', 12000, 18000, 'ci_wohnung'),
    r('ib_bad_premium', 'sanitaer', 'Bad komplett, premium', '€ je Bad', 'bad', 18000, 28000, 'ci_wohnung'),
    r('ib_bad_8qm_std', 'sanitaer', 'Bad 8 m², Standard (inkl. Entkernung, Sanitär, Fliesen, Elektrik)', '€ je Bad', 'bad', 7000, 10500, 'ci_bad'),
    r('ib_bad_8qm_mittel', 'sanitaer', 'Bad 8 m², Mittelklasse', '€ je Bad', 'bad', 10500, 17500, 'ci_bad'),
    r('ib_bad_8qm_premium', 'sanitaer', 'Bad 8 m², Premium', '€ je Bad', 'bad', 17500, 28000, 'ci_bad'),
    r('ib_gaeste_wc', 'sanitaer', 'Gäste-WC (Beispielrechnung, ein Wert)', '€ je Gäste-WC', 'stueck', 5000, 5000, 'ci_wohnung', hinweis='Beispiel der Quelle, keine Spanne.'),
    r('ib_wc', 'sanitaer', 'WC wandhängend inkl. Vorwand', '€ je Stück', 'stueck', 500, 1200, 'ci_bad'),
    r('ib_waschtisch', 'sanitaer', 'Waschtisch mit Unterschrank und Armatur', '€ je Stück', 'stueck', 400, 1500, 'ci_bad'),
    r('ib_dusche', 'sanitaer', 'Dusche bodengleich (Rinne und Glaswand)', '€ je Stück', 'stueck', 800, 2500, 'ci_bad'),
    r('ib_wanne', 'sanitaer', 'Badewanne (zusätzlich)', '€ je Stück', 'stueck', 500, 2000, 'ci_bad'),
    # Heizung
    r('ib_hk_typ22', 'heizung', 'Heizkörper Kompakt Typ 22, 1:1-Tausch inkl. Montage', '€ je Stück', 'stueck', 350, 650, 'reduco_hk'),
    r('ib_hk_design', 'heizung', 'Heizkörper Plan/Design inkl. Montage', '€ je Stück', 'stueck', 500, 900, 'reduco_hk'),
    r('ib_hk_bad', 'heizung', 'Badheizkörper inkl. Montage', '€ je Stück', 'stueck', 250, 600, 'reduco_hk'),
    r('ib_hk_montage', 'heizung', 'Heizkörper nur Montage, ohne Leitungsänderung', '€ je Stück', 'stueck', 150, 310, 'reduco_hk'),
    r('ib_fbh_nass', 'heizung', 'Fußbodenheizung Nasssystem', '€/m² beheizte Fläche', 'boden_m2', 45, 130, 'co2_fbh', hinweis='Untergrenze im Altbau 65 €/m².'),
    r('ib_fbh_trocken', 'heizung', 'Fußbodenheizung Trockensystem', '€/m² beheizte Fläche', 'boden_m2', 65, 135, 'co2_fbh', hinweis='Untergrenze im Altbau 85 €/m².'),
    r('ib_fbh_elektro', 'heizung', 'Fußbodenheizung elektrisch', '€/m² beheizte Fläche', 'boden_m2', 20, 90, 'co2_fbh', hinweis='Untergrenze im Altbau 25 €/m².'),
    r('ib_fbh_fraesen', 'heizung', 'Fußbodenheizung gefräst', '€/m² beheizte Fläche', 'boden_m2', 30, 120, 'co2_fbh'),
    # Trockenbau
    r('ib_trockenbauwand', 'trockenbau', 'Ständerwand (Material und Montage)', '€/m² Wandfläche', 'wand_m2', 35, 90, 'ci_trockenbau', nb=B, typ=[50, 75]),
    r('ib_decke_abgehaengt', 'trockenbau', 'Decke abhängen (Trockenbaudecke)', '€/m² Decke', 'decke_m2', 30, 120, 'ci_trockenbau', nb=B, typ=[50, 70]),
    r('ib_vorsatzschale', 'trockenbau', 'Vorsatzschale', '€/m² Wandfläche', 'wand_m2', 20, 70, 'ci_trockenbau', nb=B, typ=[35, 55]),
    r('ib_spachteln_q2', 'trockenbau', 'Verspachteln Q2 (nur Arbeit)', '€/m² Fläche', 'wand_m2', 8, 15, 'ci_trockenbau'),
    # Boden
    r('ib_laminat', 'boden', 'Laminat inkl. Verlegung', '€/m² Boden', 'boden_m2', 45, 45, 'ci_wohnung', typ=45, hinweis='Quelle nennt nur diesen Wert, keine Spanne.'),
    r('ib_vinyl', 'boden', 'Vinyl-Designboden inkl. Verlegung', '€/m² Boden', 'boden_m2', 85, 85, 'ci_wohnung', typ=85, hinweis='Quelle nennt nur diesen Wert.'),
    r('ib_fliesen', 'boden', 'Fliesen inkl. Verlegung', '€/m² Boden', 'boden_m2', 120, 120, 'ci_wohnung', typ=120, hinweis='Quelle nennt nur diesen Wert.'),
    r('ib_parkett', 'boden', 'Parkett inkl. Verlegung', '€/m² Boden', 'boden_m2', 140, 140, 'ci_wohnung', typ=140, hinweis='Quelle nennt nur diesen Wert.'),
    r('ib_altbelag_entfernen', 'boden', 'Altbelag entfernen und entsorgen', '€/m² Boden', 'boden_m2', 15, 15, 'ci_wohnung', typ=15, hinweis='Quelle nennt nur diesen Wert.'),
    # Wände
    r('ib_wand_streichen', 'waende', 'Wände streichen (Dispersion inkl. Grundierung)', '€/m² Wandfläche', 'wand_m2', 7, 20, 'ci_maler', nb=B, typ=[8, 15]),
    r('ib_raufaser', 'waende', 'Raufaser tapezieren', '€/m² Wandfläche', 'wand_m2', 10, 25, 'ci_maler', nb=B, typ=[12, 20]),
    r('ib_vlies', 'waende', 'Vlies tapezieren', '€/m² Wandfläche', 'wand_m2', 12, 35, 'ci_maler', nb=B, typ=[15, 25]),
    r('ib_spachteln_grundieren', 'waende', 'Spachteln und Grundieren', '€/m² Wandfläche', 'wand_m2', 8, 25, 'ci_maler', nb=B, typ=[10, 20]),
    r('ib_streichen_wd_alt', 'waende', 'Streichen Wände und Decken (zweite Quelle)', '€/m² Wandfläche', 'wand_m2', 12, 18, 'ci_wohnung', hinweis='Zweite Angabe zu derselben Leistung; weicht von ib_wand_streichen ab (andere Seite).'),
    r('ib_tapezieren_alt', 'waende', 'Tapezieren (zweite Quelle)', '€/m² Wandfläche', 'wand_m2', 20, 35, 'ci_wohnung'),
    r('ib_spachteln_q3', 'waende', 'Spachteln Q3', '€/m² Wandfläche', 'wand_m2', 30, 45, 'ci_wohnung'),
    r('ib_putz_gips_masch', 'waende', 'Innenputz Gipsputz, Maschine (einlagig 10 bis 15 mm)', '€/m² Wandfläche', 'wand_m2', 15, 26, 'ci_putz', nb=B),
    r('ib_putz_gips_hand', 'waende', 'Innenputz Gipsputz, Handauftrag', '€/m² Wandfläche', 'wand_m2', 21, 36, 'ci_putz', nb=B),
    r('ib_putz_kalk', 'waende', 'Innenputz Kalkputz', '€/m² Wandfläche', 'wand_m2', 23, 38, 'ci_putz', nb=B),
    r('ib_putz_kalkzement', 'waende', 'Innenputz Kalk-Zement (Bad, Küche, Keller)', '€/m² Wandfläche', 'wand_m2', 19, 33, 'ci_putz', nb=B),
    # Decke
    r('ib_decke_streichen', 'decke', 'Decke streichen', '€/m² Decke', 'decke_m2', 8, 25, 'ci_maler', nb=B, typ=[10, 18]),
    # Türen
    r('ib_tuer_cpl', 'tueren', 'Innentür CPL weiß inkl. Zarge und Einbau', '€ je Tür', 'tuer', 250, 450, 'ci_tuer', nb=B),
    r('ib_tuer_furniert', 'tueren', 'Innentür furniert', '€ je Tür', 'tuer', 400, 700, 'ci_tuer', nb=B),
    r('ib_tuer_vollholz', 'tueren', 'Innentür Vollholz', '€ je Tür', 'tuer', 550, 1100, 'ci_tuer', nb=B),
    r('ib_tuer_montage', 'tueren', 'Innentür nur Montage', '€ je Tür', 'tuer', 120, 200, 'ci_tuer', nb='unklar'),
    # Küche
    r('ib_kueche_anschluss', 'kueche', 'Küche: nur Anschlüsse erneuern (Wasser, Strom, Abluft)', '€ je Küche', 'kueche', 800, 2000, 'ci_wohnung'),
]

MENGEN = [
    z('ib_wandflaeche_faktor', 'Wandfläche als Faustregel: Wohnfläche mal Faktor', 'Faktor', 2.5, 3, 'ci_maler', P,
      hinweis='Genauer: Raumumfang mal Raumhöhe minus Fenster minus Türen (Quelle nennt Abziehen und Nichtabziehen beide).'),
]

# Ausstattungswerte nach RAL-RG 678 (Stufe 1 Mindest-, 2 Standard-, 3 Komfortausstattung): [Stufe1, Stufe2, Stufe3]
# Steckdosen = Stellen (Zweifach-Steckdose zählt als eine); Lichtauslässe = Beleuchtungsanschlüsse
NB_RAL = 'Aus Merkblatt rekonstruiert (Position der Textteile), Norm DIN 18015-2 / RAL-RG 678 selbst nicht gesehen.'


def a(id, raum, s3, l3, **kw):
    return z(id, raum, 'Anzahl je Raum', None, None, 'cochem_zell', P, ab='2026-10-26', steckdosen=s3, lichtausl=l3, **kw)


AUSSTATTUNG = [
    a('an_wz_bis20', 'Wohnzimmer bis 20 m²', [4, 8, 10], [2, 2, 3]),
    a('an_wz_ueber20', 'Wohnzimmer über 20 m²', [5, 11, 13], [3, 3, 4]),
    a('an_schlaf_bis20', 'Schlaf-, Kinder-, Gäste-, Arbeitszimmer, Büro bis 20 m²', [4, 8, 10], [1, 2, 3]),
    a('an_schlaf_ueber20', 'dieselben Räume über 20 m²', [5, 11, 13], [2, 3, 4]),
    a('an_essz', 'Esszimmer', [3, 5, 7], [1, 1, 2]),
    a('an_kochnische', 'Kochnische', [3, 4, 4], [1, 2, 2]),
    a('an_kueche', 'Küche', [5, 10, 12], [2, 3, 3]),
    a('an_hausarbeit', 'Hausarbeitsraum', [3, 8, 10], [1, 2, 3]),
    a('an_bad', 'Bad', [2, 4, 5], [2, 3, 3]),
    a('an_wc', 'WC', [1, 2, 2], [1, 1, 2]),
    a('an_flur_bis3', 'Flur bis 3 m Länge', [1, 2, 2], [1, 1, 1], hinweis='Spaltenzuordnung der Quelle unsicher.'),
    a('an_flur_ueber3', 'Flur über 3 m Länge', None, [2, 3, 4], hinweis='Steckdosen nicht zuordenbar; Lichtauslässe 2/3/4 nur laut Positionen im PDF, Zuordnung der Spalten unsicher.'),
    a('an_freisitz', 'Freisitz', [1, 2, 3], [1, 2, 2]),
    a('an_abstell', 'Abstellraum', [1, 2, 2], [1, 1, 1]),
    a('an_keller', 'Keller, Bodenraum, Garage', [1, 2, 2], [1, 1, 1]),
    a('an_hobby', 'Hobbyraum', [3, 6, 8], [1, 2, 2]),
    a('an_kellergang', 'Kellergang, je 6 m Länge', [1, 1, 1], [1, 1, 1]),
]
# Eintrag 'an_flur_ueber3': Steckdosen fehlen bewusst (None fällt weg)

REGELN = [
    z('an_stromkreise', 'Allgemeine Stromkreise für Beleuchtung und Steckdosen nach Wohnfläche', 'Anzahl', 3, 7, 'cochem_zell', P,
      staffel=[{'bis_m2': 50, 'kreise': 3}, {'bis_m2': 75, 'kreise': 4}, {'bis_m2': 100, 'kreise': 5}, {'bis_m2': 125, 'kreise': 6}, {'ab_m2': 126, 'kreise': 7}],
      hinweis='Merkblatt Landkreis Cochem-Zell M1; Staffelgrenzen so im PDF (51 bis 75 usw.).'),
    z('an_schaltstellen', 'Jedem Raumzugang und jedem Bettplatz ist eine Schaltstelle für Beleuchtung zuzuordnen', None, None, None, 'cochem_zell', P),
    z('an_zweifach', 'Steckdosen an Bettplätzen und Arbeitsflächen von Küchen und Hausarbeitsräumen: Zweifach-Steckdose, zählt in der Tabelle als eine', None, None, None, 'cochem_zell', P),
    z('an_kostenrelation', 'Kosten Ausstattungsstufe 2 etwa 125 %, Stufe 3 etwa 150 % der Stufe 1', '%', 125, 150, 'baunetz_elektro', P,
      hinweis='baunetzwissen.de, Seite ohne Datum; von = Stufe 2, bis = Stufe 3.'),
]

WIDERSPRUECHE = [
    {'id': 'w_ib_01', 'text': 'sanierung.js elektrik 80 bis 150 €/m² (Start 110) gegen Recherche 22: teilweise 50 bis 80, komplett 120 bis 180. Obergrenze 180 liegt über 150; nach Umfang unterscheiden.', 'betrifft': ['sanierung.js:elektrik', 'ib_elektro_teil', 'ib_elektro_komplett']},
    {'id': 'w_ib_02', 'text': 'sanierung.js bad 16.000 bis 28.000 € je Bad (Start 20.000) gegen einfach 8.000 bis 12.000, mittel 12.000 bis 18.000, premium 18.000 bis 28.000. Untergrenze widerspricht; Obergrenze 28.000 bestätigt.', 'betrifft': ['sanierung.js:bad', 'ib_bad_einfach', 'ib_bad_premium']},
    {'id': 'w_ib_03', 'text': 'sanierung.js putz 40 bis 80 €/m² vermischt Innenputz (15 bis 38) und Trockenbauwand (35 bis 90, typisch 50 bis 75). Zwei Gewerke, zwei Zeilen.', 'betrifft': ['sanierung.js:putz', 'ib_putz_gips_masch', 'ib_trockenbauwand']},
    {'id': 'w_ib_04', 'text': 'sanierung.js tueren 250 bis 500 € (Start 350) gegen CPL 250 bis 450, furniert 400 bis 700, Vollholz 550 bis 1.100. Standardtür bestätigt, höherwertige liegen darüber.', 'betrifft': ['sanierung.js:tueren', 'ib_tuer_cpl']},
    {'id': 'w_ib_05', 'text': 'Kein Widerspruch: sanierung.js boden 45 bis 140 €/m² deckt sich mit Laminat 45 bis Parkett 140, aber beide aus derselben Quelle (clean-invoice).', 'betrifft': ['sanierung.js:boden']},
    {'id': 'w_ib_06', 'text': 'moebel.js wandneu bis 105 €/m² gegen Ständerwand bis 90 €/m² (typisch 50 bis 75).', 'betrifft': ['moebel.js:wandneu', 'ib_trockenbauwand']},
    {'id': 'w_ib_07', 'text': 'Netto/Brutto bei den meisten Handwerkerpreisen nicht angegeben (nur Trockenbau, Maler, Putz, Türen brutto). Vermieter mit Vorsteuerabzug rechnet netto.', 'betrifft': ['alle']},
    {'id': 'w_ib_08', 'text': 'Zwei Quellenseiten nennen für Streichen/Tapezieren/Spachteln verschiedene Spannen (Maler-Seite 7 bis 20 gegen Wohnung-sanieren-Seite 12 bis 18).', 'betrifft': ['ib_wand_streichen', 'ib_streichen_wd_alt']},
    {'id': 'w_ib_09', 'text': 'sanier.de nennt bei Steckdosen deutlich höhere Zahlen (Wohnzimmer über 20 m²: 20 + 4); wurde nicht verwendet, zählt vermutlich Einsätze statt Stellen.', 'betrifft': ['an_wz_ueber20']},
]

OBJ = {
    'meta': {
        'titel': 'Innenausbau je Gewerk und Ausstattungswerte',
        'abruf': '2026-10-26',
        'hinweis': 'Alle Handwerkerpreise stammen aus kommerziellen Ratgeberseiten (keine amtliche Preisliste): Größenordnung, durch mindestens zwei echte Angebote ersetzen. Netto/Brutto steht in nb. typisch = Wert der Quelle, wo genannt.',
        'bezug_werte': 'boden_m2, wand_m2, decke_m2 (Menge aus dem Grundriss), stueck, raum, bad, tuer, kueche, anlage',
        'stufen': 'Ausstattungsstufe 1 = Mindest-, 2 = Standard-, 3 = Komfortausstattung (RAL-RG 678)',
    },
    'quellen': QUELLEN,
    'meta_gewerke': GEWERKE,
    'kosten': KOSTEN,
    'mengen': MENGEN,
    'ausstattung': AUSSTATTUNG,
    'ausstattung_regeln': REGELN,
    'widersprueche': WIDERSPRUECHE,
}

if __name__ == '__main__':
    print(schreibe('innenausbau', 'Innenausbau je Gewerk (Preise, Einheiten nach Grundrissmenge) und Ausstattungswerte. Quelle: recherche/22_innenausbau_solar.md (Abruf 26.10.2026). Erzeugt von erzeuger/daten_d_innenausbau.py.', OBJ))
