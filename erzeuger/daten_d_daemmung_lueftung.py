# -*- coding: utf-8 -*-
"""Erzeugt daten/daemmung_lueftung.js aus recherche/31, 33 und 37 (37 hat Vorrang, je Zeile mit ersetzt/bestaetigt vermerkt)."""
from daten_d_common import maker, schreibe, G, P, L, A

z = maker('2026-10-27')

QUELLEN = {
    'gmodg': {'titel': 'GModG (früher GEG), §§ 13, 15, 16, 34 bis 36, Anlage 7', 'url': 'https://www.gesetze-im-internet.de/geg/'},
    'goerg': {'titel': 'Görg, GModG schafft GEG ab (17.07.2026; nur im Suchtreffer gesehen)', 'url': 'https://www.goerg.de/de/aktuelles/veroeffentlichungen/17-07-2026/gebaeudemodernisierungsgesetz-gmodg-schafft-geg-ab-was-sich-aendert-und-was-bleibt'},
    'iwu': {'titel': 'IWU, Deutsche Wohngebäudetypologie (EPISCOPE 2015, Volltext gelesen)', 'url': 'https://www.iwu.de/fileadmin/publikationen/gebaeudebestand/episcope/2015_IWU_LogaEtAl_Deutsche-Wohngeb%C3%A4udetypologie.pdf'},
    'dena26': {'titel': 'dena-Gebäudereport 2026 (PDF, Volltext gelesen)', 'url': 'https://www.gebaeudeforum.de/fileadmin/gebaeudeforum/Downloads/Gebaeudereport/dena-Gebaeudereport_2026.pdf'},
    'kfw261': {'titel': 'KfW Merkblatt Kredit 261, Stand 09/2026, ab 24.09.2026', 'url': 'https://www.kfw.de/PDF/Download-Center/F%C3%B6rderprogramme-(Inlandsf%C3%B6rderung)/PDF-Dokumente/6000004854_M_261.pdf'},
    'kfw262': {'titel': 'KfW 262 Einzelmaßnahmen-Kredit (Seite)', 'url': 'http://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%c3%b6rderprodukte/Bundesf%c3%b6rderung-f%c3%bcr-effiziente-Geb%c3%a4ude-Wohngeb%c3%a4ude-Kredit-(262)/'},
    'kfw297': {'titel': 'KfW 297/298 Klimafreundlicher Neubau Wohngebäude (Seite)', 'url': 'https://www.kfw.de/inlandsfoerderung/Privatpersonen/Neubau/Förderprodukte/Klimafreundlicher-Neubau-Wohngebäude-(297-298)/'},
    'bafa_sanierung': {'titel': 'BAFA, Sanierung Wohngebäude (Seite)', 'url': 'https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude/sanierung_wohngebaeude_node.html'},
    'beg_em': {'titel': 'BMWE, Richtlinie BEG Einzelmaßnahmen, Vom 17. Juli 2026, in Kraft 21.07.2026 (Volltext)', 'url': 'https://www.energiewechsel.de/KAENEF/Redaktion/DE/PDF-Anlagen/BEG/beg-richtlinien-juli-2026/20260720-beg-einzelmassnahmen.pdf?__blob=publicationFile&v=6'},
    'ph_baunetz': {'titel': 'Baunetzwissen, Passivhaus (Glossar; Suchtreffer, Sekundärquelle)', 'url': 'https://www.baunetzwissen.de/glossar/p/passivhaus-45089'},
    'ph_institut': {'titel': 'Passivhaus Institut, Qualitätsanforderungen', 'url': 'https://passivehouse.com/de/02_informationen/02_qualitaetsanforderungen/02_qualitaetsanforderungen.htm'},
    'sh_lueftung': {'titel': 'Schwäbisch Hall, Kosten Lüftungsanlage (BKI Q4 2024, Handelsseite zitiert BKI)', 'url': 'https://www.schwaebisch-hall.de/kosten-bauen-sanieren/kosten-haustechnik/kosten-lueftungsanlage.html'},
    'drklein': {'titel': 'Dr. Klein, Lüftungsanlage (Suchtreffer)', 'url': 'https://www.drklein.de/lueftungsanlage.html'},
    'greenox': {'titel': 'greenox (Hersteller, Suchtreffer)', 'url': 'https://greenox-group.de/?p=10352'},
    'filter_ratgeber': {'titel': 'heimwerker.de Lüftungsfilter, clean-invoice Luftfilter, Händler Exhausto (Suchtreffer)', 'url': 'https://www.heimwerker.de/lueftungsfilter-wechseln/'},
    'lueftungskonzept': {'titel': 'Energie-Fachberater, Lüftungskonzept Pflicht (Suchtreffer; DIN 1946-6 kostenpflichtig)', 'url': 'https://www.energie-fachberater.de/expertenrat/expertenrat-lueftungskozept-pflicht-1771747162.php'},
    'heimwerker_lueftung': {'titel': 'heimwerker.de Lüftungsanlage mit Wärmerückgewinnung (Suchtreffer)', 'url': 'https://www.heimwerker.de/lueftungsanlage-mit-waermerueckgewinnung-test/'},
    'bimschv': {'titel': '1. BImSchV §§ 3, 4, 5, 14, 15, 22, 26, Anlage 4', 'url': 'https://www.gesetze-im-internet.de/bimschv_1_2010/'},
    'bimschv_such': {'titel': 'Websuche zur 1. BImSchV (Stuttgarter Zeitung, HKI; Suchtreffer)', 'url': 'https://www2.hki-online.de/presse/pdfs/betriebserlaubnis-erlischt_austauschfrist-fuer-alte-kachel--und-kaminoefen-endet-am-31.-dezember-2024.pdf'},
    'mfeuv': {'titel': 'Muster-Feuerungsverordnung (MFeuV), Stand 09/2007, geändert 2016/2017 (Volltext)', 'url': 'https://viega.de/content/dam/viegadm/content-assets/de/de-brandschutz/downloads-brandschutz/Muster-Feuerungsverordnung_DE_09_2017.PDF'},
    'mfeuv_such': {'titel': 'MFeuV / Landes-FeuVO: umwelt-online, Hessen, SH, bdh, Bayern (nur Suchtreffer)', 'url': 'https://umwelt-online.de/recht/bau/argebau/feuv.htm'},
    'tris': {'titel': 'EU-Notifizierung TRIS 25194, MFeuV Fassung 28.11.2023 (ENTWURF)', 'url': 'https://technical-regulation-information-system.ec.europa.eu/ro/notification/25194/text/D/DE'},
    'kuo': {'titel': 'KÜO Anlage 1 Kehrungen und Überprüfungen', 'url': 'https://www.gesetze-im-internet.de/k_o/anlage_1.html'},
    'bgb906': {'titel': 'BGB § 906 Zuführung unwägbarer Stoffe', 'url': 'https://www.gesetze-im-internet.de/bgb/__906.html'},
    'aroundhome_kamin': {'titel': 'aroundhome, Kamin Kosten (Ratgeber, Suchtreffer)', 'url': 'https://www.aroundhome.de/kamin/preise-kosten/'},
    'forum_kamin': {'titel': 'bau.de Forum Kaminofen (Forum, unsicher)', 'url': 'https://bau.de/forum/kachelofen/10390.php'},
    'vergleich_kamin': {'titel': 'vergleich.de Kamin Kosten (Suchtreffer)', 'url': 'https://www.vergleich.de/kamin-kosten.html'},
    'monsterdealz': {'titel': 'monsterdealz, Brennholz 2026 (Ratgeber mit Partner-Links)', 'url': 'https://www.monsterdealz.de/magazin/brennholz-kaufen'},
    'koeln_holz': {'titel': 'Stadt Köln, Preisübersicht Brennholz (27.05.2026; nur Suchtreffer-Zusammenfassung)', 'url': 'https://www.stadt-koeln.de/mediaasset/content/pdf67/preisübersicht_brennholz_27_05_26.pdf'},
    'bingen_holz': {'titel': 'Gemeinde Bingen (Hohenzollern), Brennholzpreise Saison 2026/27 (Suchtreffer)', 'url': 'https://www.bingen-hohenzollern.de/wp-content/uploads/2026/07/Gemeindewald-Festlegung-der-Brennholzpreise.pdf'},
    'holz_ratgeber': {'titel': 'Brennholz-Ratgeber/Rechner: toom, utopia, topagrar, HKI (Suchtreffer)', 'url': 'https://toom.de/selbermachen/wohnen-haushalt/waerme-energie/kaminoefen/brennholz-trocknen/'},
    'lwf': {'titel': 'LWF Bayern, Merkblatt 20 Scheitholz (Suchtreffer, nicht selbst gelesen)', 'url': 'https://lwf.bayern.de/mam/cms04/service/dateien/mb20_scheitholz_2025_rz_web_bf.pdf'},
    'wg_aroundhome': {'titel': 'aroundhome, Wintergarten Kosten (Stand Juni 2026 laut Suchtreffer)', 'url': 'https://www.aroundhome.de/wintergarten/kosten/'},
    'wg_bau': {'titel': 'bau.de, Wintergarten-Kosten (03/2025, Suchtreffer)', 'url': 'https://bau.de/text/250319-wintergarten-kosten-preisfaktoren-spartipps-experten'},
    'anbau_forum': {'titel': 'Aufstockung/Anbau Foren (bau.de, energiesparhaus.at; nur Anekdoten)', 'url': 'https://bau.de/forum/holzbau/10636.php'},
    'baybo6': {'titel': 'BayBO Art. 6 Abstandsflächen (Suchtreffer)', 'url': 'https://www.gesetze-bayern.de/Content/Rtf/BayBO-6?all=False'},
    'sachsen_garage': {'titel': 'Merkblatt Baugenehmigung Garagen Brand-Erbisdorf (kommunal, Suchtreffer)', 'url': 'https://www.brand-erbisdorf.de/wp-content/uploads/2023/09/197798992-merkblatt_baugenehmigung_garagen.pdf'},
    'feuer_merkblatt': {'titel': 'Feuerwehr-Merkblatt Bayern offenes Feuer; Berlin; sanier.de (Suchtreffer)', 'url': 'https://ffenzelhausen.feuerwehren.bayern/media/filer_public/e2/4b/e24b0283-2f88-45b1-8180-a3a0b523af99/merkblatt_zum_umgang_mit_offenem_feuer_im_freien.pdf'},
    'eigen': {'titel': 'Eigene Rechnung aus den genannten Quellwerten', 'url': 'recherche/33_anbau_kamin_grill.md'},
    'luecke': {'titel': 'Keine Quelle gefunden (Berichte 31, 33, 37, offene Punkte)', 'url': 'recherche/'},
}


def e(id, name, einheit=None, von=None, bis=None, q=None, s=P, ref=None, hinweis=None, **kw):
    return z(id, name, einheit, von, bis, q, s, ref=ref, hinweis=hinweis, **kw)


GMODG = [
    e('gm_titel', 'Das bisher GEG genannte Gesetz heißt auf gesetze-im-internet.de jetzt Gebäudemodernisierungsgesetz (GModG), Adresse /geg/; Paragrafenstruktur erhalten, Heizungsvorgaben §§ 71 bis 73 weggefallen', None, None, None, 'gmodg', G, '31 R01', 'Kurznamen im Werkzeug danach richten.'),
    e('gm_inkraft', 'Inkrafttreten GModG', None, None, None, 'goerg', P, '31 R02', 'Bundestag 10.07.2026 laut Presse; Verkündung/Inkrafttreten nicht belegt (Bundesgesetzblatt prüfen). Seite nennt kein Stand-Datum.'),
    e('gm_neubau_pe', 'Neubau: Jahres-Primärenergiebedarf höchstens das 0,55-fache des Referenzgebäudes (EH-55-Niveau als Minimum)', 'Faktor', 0.55, 0.55, 'gmodg', G, '31 R03, § 15', 'Referenzausführung Anlage 1 nicht gelesen.'),
    e('gm_neubau_ht', 'Neubau: Transmissionswärmeverlust höchstens das 1,0-fache des Referenzgebäudes', 'Faktor', 1.0, 1.0, 'gmodg', G, '31 R04, § 16'),
    e('gm_dichtheit', 'Neubau: Gebäudehülle luftdicht nach anerkannten Regeln der Technik; kein Zahlenwert für n50; Mindestluftwechsel aus anderen Vorschriften bleibt unberührt', None, None, None, 'gmodg', G, '31 R05, § 13'),
    e('gm_bagatell', 'Bestand: Bagatellgrenze, darunter keine Anlage-7-Pflicht', '% der Fläche der Bauteilgruppe', 10, 10, 'gmodg', G, '31 R10, §§ 34, 36'),
    e('gm_obergeschossdecke', 'Bestand: Nachrüstpflicht oberste Geschossdecke, U höchstens', 'W/(m²·K)', 0.24, 0.24, 'gmodg', G, '31 R11, § 35', 'Gilt bei Nichterfüllung des Mindestwärmeschutzes DIN 4108-2.'),
]
ANLAGE7 = [
    e('a7_wand', 'Anlage 7: Außenwand (Ersatz, Bekleidung, Dämmung, Putzerneuerung) U höchstens', 'W/(m²·K)', 0.24, 0.24, 'gmodg', G, '31 R12, Anlage 7 Nr. 1a/1b', 'Nr. 1b entfällt, wenn die Wand nach 31.12.1983 energiesparrechtlich errichtet wurde. Fußnoten 1 bis 5 nicht einzeln gelesen.'),
    e('a7_fenster', 'Anlage 7: Fenster und Fenstertüren Uw höchstens', 'W/(m²·K)', 1.3, 1.3, 'gmodg', G, '31 R13, Nr. 2a'),
    e('a7_dachfenster', 'Anlage 7: Dachflächenfenster Uw höchstens', 'W/(m²·K)', 1.4, 1.4, 'gmodg', G, '31 R14, Nr. 2b'),
    e('a7_glas', 'Anlage 7: Verglasung (reiner Glastausch) Ug höchstens', 'W/(m²·K)', 1.1, 1.1, 'gmodg', G, '31 R15, Nr. 2c'),
    e('a7_tuer', 'Anlage 7: Außentür', 'W/(m²·K)', 1.8, 1.8, 'gmodg', G, '31 R16, Nr. 4'),
    e('a7_dach', 'Anlage 7: Dach, oberste Geschossdecke', 'W/(m²·K)', 0.24, 0.24, 'gmodg', G, '31 R17, Nr. 5a/5b'),
    e('a7_flachdach', 'Anlage 7: Flachdach bei neuer Abdichtung', 'W/(m²·K)', 0.20, 0.20, 'gmodg', G, '31 R18, Nr. 5c'),
    e('a7_erdreich', 'Anlage 7: Wand gegen Erdreich oder unbeheizte Räume', 'W/(m²·K)', 0.30, 0.30, 'gmodg', G, '31 R19, Nr. 6a/6b'),
    e('a7_decke_fbh', 'Anlage 7: Decke nach unten zu Erdreich/Außenluft/unbeheizt, Fußbodenaufbau auf der beheizten Seite', 'W/(m²·K)', 0.50, 0.50, 'gmodg', G, '31 R20, Nr. 6c'),
    e('a7_decke_aussen', 'Anlage 7: Decke nach unten zur Außenluft', 'W/(m²·K)', 0.24, 0.24, 'gmodg', G, '31 R21, Nr. 6d/6e'),
    e('a7_lambda', 'Anlage 7 Fußnote 1: Rechenwert λ bei begrenzter Dämmdicke 0,035; Einblasdämmung/nachwachsend 0,045', 'W/(m·K)', None, None, 'gmodg', G, '31 R22', begrenzte_dicke=0.035, einblas_nachwachsend=0.045),
]
ALTBAU = [
    e('ab_efh_ist', 'Einfamilienhaus Baualtersklasse E (1958 bis 1968), 110 m² Wohnfläche, unsaniert (Fenster getauscht): Netto-Heizwärmebedarf', 'kWh/(m²·a)', 180, 180, 'iwu', G, '37 A01', 'Erdgas-Endenergie 309. Referenzklima Deutschland, bezogen auf beheizte Wohnfläche; ein Beispielgebäude, kein Bundesmittel. Auf die Gebäudenutzfläche AN bezogen etwa 20 % niedriger.', endenergie=309),
    e('ab_efh_p1', 'Dasselbe Haus nach Maßnahmenpaket 1 (12 cm WDVS λ 0,035, Dachgeschoss voll gedämmt, neue 2-Scheiben-Fenster, 8 cm Kellerdecke, Brennwertkessel; etwa EnEV 2009)', 'kWh/(m²·a)', 129, 129, 'iwu', G, '37 A02', endenergie=204),
    e('ab_efh_p2', 'Dasselbe Haus nach Paket 2 (24 cm Außenwand, 30 cm Dach, 12 cm Kellerdecke, Passivhausfenster, Lüftung mit Wärmerückgewinnung, thermische Solaranlage Warmwasser)', 'kWh/(m²·a)', 57, 57, 'iwu', G, '37 A03', 'Absolut Endenergie von etwa 30.000 auf etwa 7.500 kWh/a.', endenergie=102),
    e('ab_efh_kosten', 'Verbrauchskosten dieses Beispiels: Ist / Paket 1 / Paket 2', '€/(m²·a)', None, None, 'iwu', G, '37 A04', 'Energiepreise 2015, nicht in heutige Euro umrechnen.', werte=[23, 15, 9]),
    e('ab_mfh', 'Mehrfamilienhaus Baualtersklasse E: Heizwärmebedarf Ist / Paket 1 / Paket 2', 'kWh/(m²·a)', None, None, 'iwu', G, '37 A05', 'Endenergie Erdgas 204/111/45; Kosten 17/9,7/5,6 €/(m²·a).', werte=[127, 74, 21]),
    e('ab_dena', 'Durchschnittlicher Wärmeverbrauch Wohnungsbestand 2024: klimabereinigt 149, real 128', 'kWh/(m² Wohnfläche·a)', None, None, 'dena26', G, '37 A06', 'Bestand insgesamt, nicht nach Baujahr.', klimabereinigt=149, real=128),
    e('ab_tabula', 'Heizwärmebedarf je Baualtersklasse als Tabelle (TABULA/IWU)', 'kWh/(m²·a)', None, None, 'luecke', L, '37 A07', 'Nur als Diagramm im IWU-Bericht; Webtool läuft per JavaScript. Altbau nach Alter bisher nur Klasse E belegt.'),
]
KFW = []
for sid, nm, ee, nh in [('eh40', 'Effizienzhaus 40', 10, 15), ('eh55', 'Effizienzhaus 55', 5, 10), ('eh70', 'Effizienzhaus 70', 0, 5), ('eh85', 'Effizienzhaus 85', 0, 5), ('denkmal', 'Effizienzhaus Denkmal', 5, 10)]:
    KFW.append(e('kfw261_' + sid, 'KfW 261 ' + nm + ': Tilgungszuschuss mit EE-Klasse / mit Nachhaltigkeitsklasse (NH)', '% von 150.000 €', ee, nh, 'kfw261', G,
                 '37 A09 (bestätigt 31 R31 bis R35)', 'Kredit bis 150.000 € je Wohneinheit; ee = ohne NH, nh = mit NH; Euro: ee_eur / nh_eur.', ee_proz=ee, nh_proz=nh, ee_eur=ee * 1500, nh_eur=nh * 1500))
KFW += [
    e('kfw261_boni', 'KfW 261 Boni: Worst Performing Building plus 10 Prozentpunkte (EH 40, 55, 70; nicht Denkmal); Serielle Sanierung plus 15 (EH 40/55) bzw. plus 5 (EH 70); kumulierbar mit Nachhaltigkeitsklasse', 'Prozentpunkte', None, None, 'kfw261', G, '37 A10', wpb=10, seriell_eh40_55=15, seriell_eh70=5,
      hinweis='Eigene Rechnung: EH 40 NH 15 + WPB 10 + seriell 15 = 40 % (passt zu co2online "bis zu 40 %, maximal 150.000 €").'),
    e('kfw261_stand', 'KfW 261: Merkblatt Stand 09/2026, gültig ab 24.09.2026; Zinssätze nicht ermittelbar (Seite zeigt Platzhalter)', None, None, None, 'kfw261', G, '37 A09/A11',
      'Sekundärquelle (31 R36: ab 21.07.2026 pauschal 10 Prozentpunkte niedriger, max. 52.500 €) ist für die gültige Fassung widerlegt. Offen: Sätze zwischen 21.07. und 24.09.2026; BEG-WG-Richtlinie nicht ausgewertet.', ersetzt='31 R36'),
    e('kfw262', 'KfW 262 Einzelmaßnahmen-Kredit eingestellt, keine neuen Anträge; Alternative 261 oder Heizungsförderung', None, None, None, 'kfw262', G, '31 R37'),
    e('kfw297', 'KfW 297 (Selbstnutzer) / 298 (übrige) Klimafreundlicher Neubau: Kredithöchstbetrag EH 55 und EH 40 gegen EH 40 mit QNG', '€ je Wohnung', None, None, 'kfw297', G, '31 R38/R39', eh55_eh40=100000, eh40_qng=150000,
      hinweis='Öl/Gas (EH 55) bzw. Öl/Gas/Biomasse (EH 40) ausgeschlossen; Baugenehmigung nötig; Zinssätze Platzhalter.'),
    e('kfw_mehrkosten', 'Mehrkosten und Einsparung je Effizienzhaus-Stufe / Passivhaus aus neutraler Quelle', '% bzw. €/m²', None, None, 'luecke', L, '37 A08, 31 Punkt 6',
      'Ratgeberwerte (Passivhaus bis zu 14 % teurer 2009; etwa 8 %; KfW 40 gegen 60 5 bis 15 % aus KI-Forenantwort) nicht übernommen (R074).'),
]
BEG = [
    e('beg_huelle', 'BEG EM Einzelmaßnahme Gebäudehülle (Dämmung): Fördersatz', '%', 15, 15, 'beg_em', G, '37 A12, Nr. 8.4.1', 'iSFP-Bonus plus 5 Prozentpunkte; Worst-Performing-Building-Bonus plus 5 ab Quartal 1 2027.', ersetzt='31 R41', isfp_bonus=5),
    e('beg_hoechst', 'BEG EM Höchstausgaben Hülle, Anlagentechnik, Heizungsoptimierung: 1. Wohneinheit 30.000, 2. bis 6. je 15.000, ab 7. je 8.000; mit iSFP 60.000 / 30.000 / 15.000', '€', None, None, 'beg_em', G, '37 A13, Nr. 8.3.1 a', we1=30000, we2_6=15000, ab_we7=8000, isfp_we1=60000, isfp_we2_6=30000, isfp_ab_we7=15000,
      hinweis='Je Gebäude und Kalenderjahr; Fachplanung/Baubegleitung bei Ein- und Zweifamilienhäusern auf 5.000 € gedeckelt; Kredit bis 120.000 € je Wohneinheit. Ob der iSFP-Bonus nur für den Teil über 30.000 € gilt (so sanierung.js), ist hier nicht bestätigt.', ersetzt='31 R41 (Obergrenze 22.500 €)'),
    e('beg_lueftung_satz', 'BEG EM Lüftung (Anlagentechnik außer Heizung): Fördersatz', '%', 15, 15, 'beg_em', G, '37 A14, Nr. 5.2/8.4.1', 'iSFP-Bonus plus 5 Prozentpunkte.', isfp_bonus=5),
    e('beg_lueftung_wbg', 'BEG EM Lüftung Wohngebäude: Wärmebereitstellungsgrad mindestens 80 % bei Pel,Vent höchstens 0,45 W/(m³/h), oder mindestens 75 % bei höchstens 0,35 W/(m³/h)', '%', None, None, 'beg_em', G, '37 A15, technische Mindestanforderungen Nr. 2.1.1', wbg_proz_pel045=80, wbg_proz_pel035=75,
      hinweis='Bedarfsgeregelte zentrale Abluftsysteme Pel ≤ 0,20 W/(m³/h); Kompaktgeräte mit Abluftwärmepumpe ηs ≥ 140 % (bei 35 °C).', ersetzt='31 R66 (Herstellerangabe 75 %, nur halb richtig)'),
    e('beg_lueftung_nachweis', 'BEG EM Lüftung: Fachunternehmererklärung plus Herstellerbescheinigung (DIN V 4701-10/12, DIN V 18599-6, DIN 1946-6); Anlage einreguliert; Lüftung zum Feuchteschutz nach DIN 1946-6 für die gesamte Nutzungseinheit', None, None, None, 'beg_em', G, '37 A16'),
    e('beg_alter', 'BEG EM Dämmung Gebäudehülle: Gebäude älter als', 'Jahre ab Bauantrag', 5, 5, 'bafa_sanierung', G, '31 R40', 'Fördersatz steht auf der BAFA-Seite nicht, siehe beg_huelle.'),
]
PASSIV = [
    e('ph_heizwaerme', 'Passivhaus: Heizwärmebedarf höchstens', 'kWh/(m²·a)', 15, 15, 'ph_baunetz', P, '31 R50', 'Sekundärquelle; Primärquelle Passivhaus Institut nennt Zahlen nur im nicht abrufbaren Gebäudekriterien-PDF.'),
    e('ph_heizlast', 'Passivhaus: Heizlast (Alternativkriterium) höchstens', 'W/m²', 10, 10, 'ph_baunetz', P, '31 R51'),
    e('ph_luft', 'Passivhaus: Luftdichtheit n50 höchstens', '1/h', 0.6, 0.6, 'ph_baunetz', P, '31 R52'),
    e('ph_primaer', 'Passivhaus: Primärenergie gesamt', 'kWh/(m²·a)', None, None, 'ph_baunetz', P, '31 R53', wert_a=120, wert_b_nichtregenerativ=60, hinweis='Quellen widersprechen sich (120 gegen 60 nichtregenerativ); Klassen Classic, Plus, Premium nach erneuerbarem PER. Keinen Wert fest übernehmen.', widerspruch=True),
    e('enerphit_luft', 'EnerPHit: Luftdichtheit qE50 höchstens', 'm³/(h·m²)', 1.0, 1.0, 'ph_institut', G, '31 R54', 'Nur dieser EnerPHit-Wert bestätigt; EnerPHit erlaubt etwas höheren Energiebedarf; weitere Zahlen im PDF Gebäudekriterien Version 10c (Passipedia lieferte HTTP 402).'),
    e('ph_mehrkosten', 'Passivhaus/EnerPHit Mehrkosten', '%', None, None, 'luecke', L, '37 A08', 'Nur Ratgeberwerte, nicht übernommen.'),
]
LUEFTUNG = [
    e('lu_dez_abluft', 'Dezentral, Abluft, je Stück: Neubau / Altbau', '€ netto', None, None, 'sh_lueftung', P, '31 R60', 'Mittelwerte BKI Q4 2024 (Handelsseite zitiert BKI).', neubau=400, altbau=545),
    e('lu_dez_wrg', 'Dezentral mit Wärmerückgewinnung, je Stück: Neubau / Altbau', '€ netto', None, None, 'sh_lueftung', P, '31 R61', neubau=1400, altbau=1565),
    e('lu_zentral', 'Zentral mit Wärmerückgewinnung, Haus ca. 150 m², Neubau', '€ netto', 14000, 14000, 'sh_lueftung', P, '31 R62', 'Altbau nach Aufwand; je m² etwa 93 €/m² (eigene Rechnung).'),
    e('lu_zentral2', 'Zentral mit Wärmerückgewinnung (andere Quelle)', '€', 12000, 16000, 'drklein', P, '31 R64', 'Stützt lu_zentral grob.'),
    e('lu_dez_nachruest', 'Dezentrale Nachrüstung Altbau ca. 120 m², inkl. Installation', '€', 5000, 7000, 'sh_lueftung', P, '31 R63'),
    e('lu_strom', 'Stromverbrauch hochwertige Anlage 100 m²', 'kWh/a', 180, 300, 'sh_lueftung', P, '31 R65', 'Andere Quelle (Dr. Klein): 550 kWh/a bei 120 m²; Spannweite hoch.', widerspruch=True),
    e('lu_strom2', 'Stromverbrauch Lüftungsanlage 120 m² (Dr. Klein)', 'kWh/a', 550, 550, 'drklein', P, '31 R65'),
    e('lu_wrg_praxis', 'Wärmebereitstellungsgrad moderner Geräte (Herstellerangabe)', '%', 80, 90, 'greenox', P, '31 R67', 'Herstellerseite.'),
    e('lu_filter_wechsel', 'Filterwechsel: ePM2,5 3 bis 12 Monate; ePM1 3 bis 6 Monate', 'Monate', 3, 12, 'filter_ratgeber', P, '31 R68', 'Ratgeber.'),
    e('lu_filter_preis', 'Ersatzfilter Beispiel F7 (Exhausto VEX2.5)', '€ brutto', 168.84, 168.84, 'filter_ratgeber', P, '31 R69', 'Einzelbeispiel; Jahreskosten laut Dr. Klein ca. 40 €/a (P).'),
    e('lu_filter_klassen', 'F7 entspricht grob ePM2,5 (Abscheidung 50 bis 65 % bzw. 80 bis 90 %, Quellen widersprechen sich); ePM1/F9 hält mehr Feinstaub zurück, erhöht den Druckverlust', None, None, None, 'filter_ratgeber', P, '31 Zusatz', 'Foren, unsicher; ISO 16890 Zuordnung amtlich nicht belegt.', widerspruch=True),
    e('lu_konzept', 'Lüftungskonzept nach DIN 1946-6 nötig, wenn mehr als 1/3 der Fenster getauscht oder (Einfamilienhaus) mehr als 1/3 der Dachfläche abgedichtet wird', 'Anteil', 0.33, 0.33, 'lueftungskonzept', P, '31 R70', 'Weder am Gesetz noch an der DIN geprüft; GModG § 13 verweist nur auf den Mindestluftwechsel.'),
    e('lu_vergleich', 'Dezentral: pro Raum ein Wandgerät, Wanddurchbruch und Stromanschluss je Gerät, in Altbauten leichter nachrüstbar, Filterwechsel je Gerät. Zentral: Kanalnetz, geringerer Stromverbrauch laut Hersteller, Nachrüsten sehr aufwendig', None, None, None, 'heimwerker_lueftung', P, '31 Vergleich'),
    e('lu_luecke', 'Sommer-Bypass, Erdwärmetauscher, Schallwerte, Hygieneregeln (VDI 6022), Filterkosten je Jahr belastbar', None, None, None, 'luecke', L, '31 Punkt 7'),
    e('lu_kamin', 'Kaminofen und Lüftungsanlage: raumluftabsaugende Anlagen dürfen die Betriebssicherheit raumluftabhängiger Feuerstätten nicht beeinträchtigen (Verriegelung, überwachte Abgasabführung oder kein gefährlicher Unterdruck)', None, None, None, 'mfeuv', G, '37 F05, MFeuV § 4 Abs. 2', 'Wichtig bei Passivhaus mit Kaminofen.'),
]
KAMIN = [
    e('ka_feuchte', '1. BImSchV: Feuchtegehalt Holzbrennstoffe unter 25 % bezogen auf Trocken-/Darrgewicht (Ausnahme automatisch beschickte Anlagen)', '%', 25, 25, 'bimschv', G, '33 K01, § 3 Abs. 3'),
    e('ka_feuchte_rechnung', '25 % bezogen auf Trockengewicht entsprechen rechnerisch 20 % Wassergehalt bezogen auf Frischgewicht (0,25/1,25)', '%', 20, 20, 'eigen', P, '33 K02', 'Eigene Rechnung, in einer Fachquelle zu bestätigen; Ratgeber nennen 20 %.', rechnung=True),
    e('ka_scheitholz', 'Erlaubter Brennstoff Scheitholz: naturbelassenes stückiges Holz einschließlich anhaftender Rinde', None, None, None, 'bimschv', G, '33 K03, § 3 Abs. 1 Nr. 4'),
    e('ka_offen', 'Offene Kamine nur gelegentlich; nur naturbelassenes stückiges Holz oder Holzbriketts', None, None, None, 'bimschv', G, '33 K04, § 4 Abs. 4'),
    e('ka_typpruefung', 'Einzelraumfeuerungen (außer Grundöfen/offene Kamine), errichtet ab 22.03.2010, brauchen Typprüfung des Herstellers', None, None, None, 'bimschv', G, '33 K05, § 4 Abs. 3'),
    e('ka_beratung', 'Beratung durch Schornsteinfeger für Betreiber handbeschickter Anlagen innerhalb 1 Jahr nach Errichtung/Betreiberwechsel', 'Jahre', 1, 1, 'bimschv', G, '33 K06, § 4 Abs. 8'),
    e('ka_a4_raumheizer', 'Anlage 4 Stufe 2 (errichtet nach 31.12.2014) Raumheizer Flach-/Füllfeuerung: CO 1,25 g/m³, Staub 0,04 g/m³, Wirkungsgrad mindestens 73 % / 70 %', '%', None, None, 'bimschv', G, '33 K07, Anlage 4', wirkungsgrad_flachfeuerung=73, wirkungsgrad_fuellfeuerung=70, co_g_m3=1.25, staub_g_m3=0.04),
    e('ka_a4_speicher', 'Anlage 4 Stufe 2 Speichereinzelfeuerstätten/Kamineinsätze: CO 1,25, Staub 0,04, Wirkungsgrad 75 %', '%', 75, 75, 'bimschv', G, '33 K08'),
    e('ka_a4_kachel', 'Anlage 4 Stufe 2 Kachelofeneinsätze: CO 1,25, Staub 0,04, Wirkungsgrad 80 %', '%', 80, 80, 'bimschv', G, '33 K09'),
    e('ka_a4_herd', 'Anlage 4 Stufe 2 Herde/Heizungsherde: CO 1,50, Staub 0,04, Wirkungsgrad 70 % / 75 %', '%', None, None, 'bimschv', G, '33 K10', wirkungsgrad_herd=70, wirkungsgrad_heizungsherd=75),
    e('ka_a4_pellet', 'Anlage 4 Stufe 2 Pelletöfen ohne / mit Wassertasche: CO 0,25, Staub 0,03 / 0,02, Wirkungsgrad 85 % / 90 %', '%', None, None, 'bimschv', G, '33 K11', wirkungsgrad_ohne_wassertasche=85, wirkungsgrad_mit_wassertasche=90),
    e('ka_a4_kaminofen', 'Kaminöfen in Anlage 4 nicht gesondert aufgeführt; sonstige Anlagen: Anforderungen der Raumheizer mit Flachfeuerung', None, None, None, 'bimschv', G, '33 K12', 'Aus Zusammenfassung des Abrufwerkzeugs; Tabellenzeilen im Original gegenlesen.'),
    e('ka_alt_grenz', 'Altanlagen (errichtet vor 22.03.2010) dürfen weiterbetrieben werden bei Staub 0,15 g/m³ und CO 4 g/m³ (Prüfstandsbescheinigung oder Messung)', 'g/m³', None, None, 'bimschv', G, '33 K13, § 26 Abs. 1', staub=0.15, co=4),
    e('ka_alt_fristen', 'Nachrüst-/Stilllegungsfristen nach Typenschild-Datum: bis 31.12.1974 oder nicht feststellbar 31.12.2014; 1975 bis 1984 31.12.2017; 1985 bis 1994 31.12.2020; 1995 bis 21.03.2010 31.12.2024', 'Datum', None, None, 'bimschv', G, '33 K14, § 26 Abs. 2', 'Alle Fristen sind abgelaufen (letzte 31.12.2024).', fristen=['2014-12-31', '2017-12-31', '2020-12-31', '2024-12-31']),
    e('ka_nach2024', 'Frist nach 31.12.2024: in § 26 keine spätere Frist gefunden; Websuche ohne Hinweis auf Änderung 2025/2026', None, None, None, 'bimschv_such', P, '33 K15', 'Negativer Befund; Fußnote Stand der Verordnung nicht lesbar.'),
    e('ka_ausnahmen', 'Ausnahmen von der Nachrüstpflicht: nichtgewerbliche Herde und Backöfen unter 15 kW; offene Kamine; Grundöfen; Anlagen in ausschließlich darüber beheizten Wohneinheiten; vor 01.01.1950 hergestellte Anlagen (Glaubhaftmachung)', None, None, None, 'bimschv', G, '33 K16, § 26 Abs. 3'),
    e('ka_stufe1', 'Anlagen errichtet 22.03.2010 bis 31.12.2014 gelten weiter mit Stufe-1-Grenzwerten', None, None, None, 'bimschv', G, '33 K17, § 26 Abs. 6'),
    e('ka_kessel', '§ 5 Feuerungsanlagen ab 4 kW (Kessel): Stufe 1 Staub 0,06 bis 0,10, CO 0,3 bis 1,0 g/m³; Stufe 2 Staub 0,02, CO 0,3 bis 0,4', 'g/m³', None, None, 'bimschv', G, '33 K18, § 5', 'Gilt für Kessel nach § 5, nicht für Einzelraumfeuerung nach Anlage 4.'),
    e('ka_abnahme', 'Schornsteinfeger stellt Einhaltung fest: für ab 22.03.2010 errichtete Anlagen binnen 4 Wochen nach Inbetriebnahme', 'Wochen', 4, 4, 'bimschv', G, '33 K19, § 14'),
    e('ka_messung', 'Einzelraumfeuerung: kein Messintervall, Prüfung bei der Feuerstättenschau; Messung alle 2 Kalenderjahre gilt für andere feste Feuerungen ab 4 kW', 'Jahre', 2, 2, 'bimschv', G, '33 K20, § 15'),
    e('ka_ausnahme_antrag', 'Ausnahme auf Antrag bei Härtefall (unverhältnismäßiger Aufwand) und ohne schädliche Umwelteinwirkungen', None, None, None, 'bimschv', G, '33 K21, § 22'),
    e('ka_nachbar', 'Nachbarrecht: Rauch, Gerüche, Ruß dürfen nicht untersagt werden, wenn sie die Benutzung nur unwesentlich beeinträchtigen; bei Einhaltung gesetzlicher Grenzwerte Regel-Annahme der Unwesentlichkeit', None, None, None, 'bgb906', G, '33 G01, BGB § 906', 'Ausgleichsanspruch Abs. 2 Satz 2 nicht gelesen.'),
    e('mf_abstand', 'Abstand Feuerstätte zu brennbaren Bauteilen: höchstens 85 °C an brennbaren Bauteilen bei Nennleistung; erfüllt bei Einhaltung der Herstellerabstände, sonst Mindestabstand 40 cm', 'cm', 40, 40, 'mfeuv', G, '37 F01, MFeuV § 4 Abs. 7', 'Bestätigt 33 K24 und nennt die Fundstelle.', ersetzt='33 K24', grad_c=85),
    e('mf_boden', 'Bodenschutz vor der Feuerungsöffnung (feste Brennstoffe): nichtbrennbarer Belag, nach vorn mindestens 50 cm, seitlich mindestens 30 cm über die Feuerungsöffnung hinaus', 'cm', None, None, 'mfeuv', G, '37 F02, MFeuV § 4 Abs. 8', ersetzt='33 K22', vorn_cm=50, seitlich_cm=30),
    e('mf_offen', 'Offene Kamine: brennbare Bauteile nach oben und zur Seite mindestens 80 cm von der Feuerraumöffnung; mit beiderseits belüftetem Strahlungsschutz mindestens 40 cm', 'cm', None, None, 'mfeuv', G, '37 F03, MFeuV § 4 Abs. 9', 'Die 80 cm gelten für OFFENE Kamine, nicht allgemein für Kaminöfen.', ersetzt='33 K23', ohne_schutz_cm=80, mit_strahlungsschutz_cm=40),
    e('mf_luft', 'Verbrennungsluft raumluftabhängige Feuerstätten: bei Nennleistung insgesamt höchstens 50 kW je Aufstellraum eine Öffnung ins Freie mit mindestens 150 cm² oder zwei mit je mindestens 75 cm²; alternativ Nachweis 1,6 m³/h je kW; gilt nicht für offene Kamine', 'cm²', 150, 150, 'mfeuv', G, '37 F04, MFeuV § 3 Abs. 2, 5, 6', ersetzt='33 K26 (Lücke)'),
    e('mf_garage', 'Aufstellung in Garagen nicht erlaubt, ausgenommen raumluftunabhängige Feuerstätten mit Oberflächentemperatur höchstens 300 °C', '°C', 300, 300, 'mfeuv', G, '37 F06, MFeuV § 4 Abs. 1 Nr. 2'),
    e('mf_land', 'Die MFeuV ist eine Empfehlung; die Länder setzen sie in eigenen Feuerungsverordnungen um (Beispiele Hessen FeuVO 2009, Schleswig-Holstein FeuVO 2020, Bayern BayFeuV). Fassung 28.11.2023 (Kopf ENTWURF) hat in den genannten Paragrafen dieselben Zahlen; Übernahme durch ein Land nicht geprüft', None, None, None, 'mfeuv_such', P, '37 F07, 33 K25', 'Landesfassung des Zielorts lesen (Bremen nicht abgerufen). Vollständige 16-Länder-Liste fehlt.'),
    e('ka_kehrungen', 'KÜO Anlage 1, feste Brennstoffe: Kehrungen je Kalenderjahr: ganzjährig regelmäßig 4; regelmäßig in üblicher Heizperiode 3; Holzpellets 2; wiederkehrend nach § 15 1. BImSchV zu überwachende 2; mehr als gelegentlich, nicht regelmäßig 2; gelegentlich 1', 'Kehrungen/Jahr', None, None, 'kuo', P, '37 F08', ganzjaehrig=4, heizperiode=3, pellets=2, ueberwachung_nach_15=2, mehr_als_gelegentlich=2, gelegentlich=1, hinweis='Spaltenzuordnung nicht eindeutig; Fußnote nicht lesbar. Bei mehreren zutreffenden Nummern gilt laut Suchtreffer (VGH München 13.05.2025) die niedrigere Zahl.'),
    e('ka_kehrgebuehr', 'Kehrgebühren (KÜO Anlage 3 Gebührenverzeichnis)', '€', None, None, 'luecke', L, '37 F09', 'Beträge nicht gelesen.'),
    e('ka_geraet', 'Kaminofen (Gerät)', '€', 2000, 3000, 'aroundhome_kamin', P, '33 K27'),
    e('ka_schornstein', 'Schornstein insgesamt, nachträglich, Edelstahl', '€', 2500, 4000, 'aroundhome_kamin', P, '33 K28', 'Forum bau.de: 3.000 bis 6.000 € bzw. 6.000 bis 12.000 € mit Fundament/Dachdurchführung/Abnahme; streuen stark.'),
    e('ka_montage', 'Montage durch Fachfirma', '€', None, None, 'aroundhome_kamin', P, '33 K29', 'Widersprüchlich: aroundhome mindestens 200 €, Forenübersicht 1.500 bis 3.000 €.', widerspruch=True, aroundhome_min=200, forum_von=1500, forum_bis=3000),
    e('ka_abnahme_preis', 'Schornsteinfeger-Abnahme', '€', None, None, 'vergleich_kamin', P, '33 K30', vergleich_von=50, vergleich_bis=150, forum_von=200, forum_bis=500, hinweis='Widersprüchlich: vergleich.de 50 bis 150, Forum 200 bis 500. Amtliche Kehr- und Überprüfungsgebühren je Land nicht erhoben.', widerspruch=True),
    e('ka_verbrauch', 'Brennholzverbrauch je Saison für Raum/Haus; Wartungsintervalle und Kosten (Dichtungen)', None, None, None, 'luecke', L, '33 K40/K41'),
]
HOLZ = [
    e('ho_buche', 'Brennholz Buche, 33 cm, Mittel bundesweit Juli 2026, inkl. Lieferung bis 10 km', '€/Rm', 144.66, 144.66, 'monsterdealz', P, '33 K31', 'Ratgeber mit Partner-Links, nicht unabhängig geprüft.'),
    e('ho_fichte', 'Brennholz Fichte, 33 cm, wie oben', '€/Rm', 109.83, 109.83, 'monsterdealz', P, '33 K32'),
    e('ho_baumarkt', 'Baumarkt Juni 2026, trockene Buche, 0,9 Raummeter (Obi 140, Hornbach 135, Bauhaus 135)', '€ je 0,9 Rm', 135, 140, 'monsterdealz', P, '33 K33'),
    e('ho_koeln', 'Waldbrennholz Köln, Mai 2026, je Raummeter Polter frei Weg (nicht trocken geliefert): Laubholz 40; Eiche/Buche/Esche/Ahorn 50; Nadelholz 30', '€/Rm', 30, 50, 'koeln_holz', P, '33 K34', 'Nur Suchtreffer-Zusammenfassung.'),
    e('ho_bingen', 'Gemeinde Bingen (Hohenzollern), Saison 2026/27, Endverbraucher: Hartlaub 85 brutto (79,44 netto); Weichlaub/Nadel 55 brutto (51,40 netto)', '€/Rm', None, None, 'bingen_holz', P, '33 K35', weichlaub_nadel_brutto=55, hartlaub_brutto=85),
    e('ho_umrechnung', 'Umrechnung Festmeter/Raummeter: 1 Rm = 0,7 Fm bzw. 1 Fm = 1,4 Rm (Stadt Köln, agrar-Leitfaden)', 'Fm je Rm', 0.7, 0.7, 'holz_ratgeber', P, '33 K36', 'Widerspruch: ein Rechner mit TFZ-Bezug nennt 1,98 Rm je Fm; topagrar 1 Fm = 2 bis 2,5 Srm; Schüttraummeter Buchenscheite ca. 0,68 Rm. Verkäufer-Basis klären.', widerspruch=True),
    e('ho_energie', 'Energiegehalt Buche: 1 Ster (460 kg) ca. 1.900 kWh; Fichte (310 kg) ca. 1.345 kWh', 'kWh/Rm', None, None, 'lwf', P, '33 K37', fichte=1345, buche=1900, buche_rechner=1458, hinweis='Nur Suchtreffer; ein Rechner mit TFZ-Bezug nennt bei 20 % Wasser 1.458 kWh/Rm Buche. Werte weichen ab.', widerspruch=True),
    e('ho_trocknung', 'Trocknungszeit Scheitholz: Fichte/Kiefer ca. 1 Jahr; Buche/Esche/Eiche 2 bis 3 Jahre (toom); Österreich LK 1,5 bis 2 Jahre bis unter 20 %; HKI ca. 2 Jahre geschützt gelagert', 'Jahre', None, None, 'holz_ratgeber', P, '33 K38', 'Ratgeber/Verband, streuen.', nadel_j=1, laub_von_j=2, laub_bis_j=3),
    e('ho_lager', 'Lagerung gespalten, vom Boden abgehoben, luftig, regengeschützt; Lagerdauer höchstens ca. 5 Jahre (utopia)', 'Jahre', 5, 5, 'holz_ratgeber', P, '33 K39'),
]
WINTERGARTEN = [
    e('wg_kalt', 'Wintergarten, Komplettpreis Kaltwintergarten', '€/m²', 500, 900, 'wg_aroundhome', P, '33 A01', 'Stand Juni 2026 laut Suchtreffer.'),
    e('wg_warm', 'Warmwintergarten, Komplettpreis', '€/m²', 1400, 5500, 'wg_aroundhome', P, '33 A02'),
    e('wg_gesamt', 'Gesamtkosten Kalt / mittelwarm / Warm: 10.000 bis 25.000 / 25.000 bis 50.000 / 50.000 bis 100.000', '€', None, None, 'wg_aroundhome', P, '33 A03', kalt_von=10000, kalt_bis=25000, mittelwarm_von=25000, mittelwarm_bis=50000, warm_von=50000, warm_bis=100000),
    e('wg_rahmen', 'Rahmenmaterial (Materialkosten, offenbar ohne Montage): Kunststoff 150 bis 300; Holz 250 bis 500; Aluminium 350 bis 700', '€/m²', None, None, 'wg_bau', P, '33 A04', 'Abgrenzung unklar (bau.de 03/2025).', kunststoff_von=150, kunststoff_bis=300, holz_von=250, holz_bis=500, alu_von=350, alu_bis=700),
    e('wg_gmodg', 'Anforderungen GModG an beheizten Wintergarten', None, None, None, 'luecke', L, '33 A05'),
    e('wg_anbau_kosten', 'Wohnraum-Anbau massiv/Holz und Aufstockung, Kosten je m²', '€/m²', None, None, 'luecke', L, '33 A06/A07', 'Nur Forenanekdoten (1.000 bis 2.000 €/m², Österreich/Tirol), nicht verwendet. Statik: Tragfähigkeit des Bestands durch Tragwerksplaner prüfen (qualitativ).'),
    e('wg_abstand', 'Abstandsflächen Regel (Bayern als Beispiel): 0,4 H, mindestens 3 m; Gewerbe-/Industriegebiet 0,2 H; Garagen ohne Aufenthaltsräume in der Abstandsfläche bis 3 m mittlere Wandhöhe und 9 m Gesamtlänge je Grenze', 'H; m', None, None, 'baybo6', P, '33 A08/A09', faktor_h=0.4, min_m=3, faktor_h_gewerbe=0.2, hinweis='Art. 6 BayBO nur Suchtreffer; MBO-Wortlaut und Länderabweichungen nicht abgerufen. Landesregeln: bauregeln.js.'),
    e('wg_sachsen', 'Sachsen: Garagen/Carports verfahrensfrei (Innenbereich) bis 50 m² Brutto-Grundfläche, mittlere Wandhöhe bis 3 m', 'm²', 50, 50, 'sachsen_garage', P, '33 A10', 'Kommunales Merkblatt, nicht SächsBO-Text; widerspricht der verbreiteten 30-m²-Angabe, die nicht belegt ist.'),
    e('wg_verfahrensfrei', 'Verfahrensfreie Größen Wintergarten/Terrassenüberdachung/Carport/Garage je Land', None, None, None, 'luecke', L, '33 A11', 'Für alle 16 Länder nicht erhoben; siehe verfahrensfrei.js.'),
]
GRILL = [
    e('gr_wald', '100 m Abstand zum Wald für offenes Feuer: Bayern (Art. 17 BayWaldG), Sachsen (§ 15 SächsWaldG), Berlin (unter 100 m Genehmigung der Forsten), Baden-Württemberg ähnlich', 'm', 100, 100, 'feuer_merkblatt', P, '33 G02', 'Gesetzestexte nicht selbst abgerufen; übrige Länder nicht erhoben.'),
    e('gr_nachbar', 'Abstand Feuer zu Nachbargrundstück: keine bundesweite Regel; Ratgeber Mindeststandard 10 m; Bayern 25 m zu Feldgehölzen/Hecken', 'm', None, None, 'feuer_merkblatt', P, '33 G03', ratgeber_m=10, bayern_gehoelz_m=25, hinweis='Nicht rechtlich verbindlich belegt.'),
    e('gr_gemeinde', 'Gemeindliche Verbote, Landesimmissionsschutz, Kosten fester Grill/Feuerstelle', None, None, None, 'luecke', L, '33 G04/G05', 'Gemeindesatzung ist maßgeblich.'),
]
WIDERSPRUECHE = [
    {'id': 'w_dl_01', 'text': 'KfW 261: Bericht 31 (R36, Sekundärquelle) behauptete ab 21.07.2026 pauschal 10 Prozentpunkte niedrigere Zuschüsse und max. 52.500 € je Wohneinheit; Bericht 37 widerlegt das für die gültige Fassung (Merkblatt 09/2026 ab 24.09.2026). Vorrang 37.', 'betrifft': ['kfw261_stand']},
    {'id': 'w_dl_02', 'text': 'BEG EM Hülle: Bericht 31 (R41) 15 % und Obergrenze 22.500 €; Bericht 37 (Volltext Richtlinie) Höchstausgaben 30.000 € (60.000 € mit iSFP). sanierung.js beschreibt den iSFP-Bonus nur für den Teil der Ausgaben über 30.000 €; das ist in 37 nicht bestätigt. Vorrang 37.', 'betrifft': ['beg_huelle', 'beg_hoechst', 'sanierung.js:foerderung']},
    {'id': 'w_dl_03', 'text': 'Lüftung WBG: Hersteller (Bericht 31 R66) 75 % Mindestwert; Richtlinie (37 A15) 80 % bei Pel ≤ 0,45 W/(m³/h), 75 % nur bei Pel ≤ 0,35. Vorrang 37.', 'betrifft': ['beg_lueftung_wbg']},
    {'id': 'w_dl_04', 'text': 'Lüftung Strom: 180 bis 300 kWh/a bei 100 m² (BKI-Handelsseite) gegen 550 kWh/a bei 120 m² (Dr. Klein).', 'betrifft': ['lu_strom', 'lu_strom2']},
    {'id': 'w_dl_05', 'text': 'Passivhaus Primärenergie 120 gegen 60 kWh/(m²·a) (nichtregenerativ): Sekundärquellen widersprechen sich, kein fester Wert.', 'betrifft': ['ph_primaer']},
    {'id': 'w_dl_06', 'text': 'Brennholz: Umrechnung Festmeter/Raummeter 1,4 (Köln) gegen 1,98 (Rechner); Energiegehalt Buche 1.900 kWh/Rm (LWF-Suchtreffer) gegen 1.458 (Rechner).', 'betrifft': ['ho_umrechnung', 'ho_energie']},
    {'id': 'w_dl_07', 'text': 'Kaminofen-Preise: Montage 200 € (aroundhome) gegen 1.500 bis 3.000 € (Forum); Abnahme 50 bis 150 € gegen 200 bis 500 €.', 'betrifft': ['ka_montage', 'ka_abnahme_preis']},
    {'id': 'w_dl_08', 'text': '33 K22 bis K24 (MFeuV, Paragrafen unklar, Suchtreffer) sind durch 37 F01 bis F03 (Volltext) bestätigt und mit Paragrafen versehen. 33 K26 (Verbrennungsluft, Lücke) durch 37 F04 geschlossen.', 'betrifft': ['mf_abstand', 'mf_boden', 'mf_offen', 'mf_luft']},
    {'id': 'w_dl_09', 'text': 'GModG-Anlage 7 Wand 0,24 und Dach 0,24 W/(m²·K) gelten bei Änderung am Bestand; für Neubau gilt das Referenzgebäudeverfahren (§§ 15, 16). Nicht dieselben Zahlen.', 'betrifft': ['a7_wand', 'gm_neubau_pe']},
]

OBJ = {
    'meta': {
        'titel': 'Dämmstandard, Förderung, Lüftung, Kamin, Wintergarten',
        'abruf': '2026-10-27',
        'hinweis': 'Bericht 37 hat Vorrang vor 31 und 33; ersetzte oder bestätigte Zeilen tragen ref/ersetzt. Gesetzestexte kamen als Zusammenfassungen des Abrufwerkzeugs: Zahlen und Überschriften gelesen, voller Wortlaut nicht. Keine Rechts- oder Förderberatung; Förderanträge vor Vorhabenbeginn, Sätze vor Antrag am Original prüfen.',
    },
    'quellen': QUELLEN,
    'gmodg': GMODG,
    'gmodg_anlage7': ANLAGE7,
    'altbau_heizwaerme': ALTBAU,
    'kfw': KFW,
    'beg_einzelmassnahmen': BEG,
    'passivhaus': PASSIV,
    'lueftung': LUEFTUNG,
    'kamin': KAMIN,
    'brennholz': HOLZ,
    'wintergarten_anbau': WINTERGARTEN,
    'grill_feuerstelle': GRILL,
    'widersprueche': WIDERSPRUECHE,
}

if __name__ == '__main__':
    print(schreibe('daemmung_lueftung', 'Dämmstandards (GModG, KfW, Passivhaus), Lüftung, Kamin (1. BImSchV, MFeuV), Brennholz, Wintergarten. Quellen: recherche/31, 33, 37 (Abruf 27.10.2026), 37 hat Vorrang. Erzeugt von erzeuger/daten_d_daemmung_lueftung.py.', OBJ))
