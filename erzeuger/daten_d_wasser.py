# -*- coding: utf-8 -*-
"""Erzeugt daten/wasser.js aus recherche/32_wasser.md und 37_luecken_wasser_energie.md (37 hat Vorrang)."""
from daten_d_common import maker, schreibe, G, P, L, A

z = maker('2026-10-27')

QUELLEN = {
    'dwd_rr': {'titel': 'DWD Open Data, Gebietsmittel Niederschlag Jahr (erstellt 20261002, Reihe 1881 bis 2025); Mittel 1991 bis 2020 eigene Mittelung', 'url': 'https://opendata.dwd.de/climate_environment/CDC/regional_averages_DE/annual/precipitation/regional_averages_rr_year.txt'},
    'dwd_recht': {'titel': 'DWD, Rechtliche Hinweise / Open Data (CC BY 4.0; nur Zusammenfassung des Abrufwerkzeugs)', 'url': 'https://www.dwd.de/DE/service/rechtliche_hinweise/rechtliche_hinweise_node.html'},
    'wrmg9': {'titel': 'WRMG § 9 Angabe der Wasserhärtebereiche', 'url': 'https://www.gesetze-im-internet.de/wrmg/__9.html'},
    'trinkwv': {'titel': 'TrinkwV 2023 §§ 2, 12, 13 und Anlage 3 (gesetze-im-internet.de); Paragraf in ref', 'url': 'https://www.gesetze-im-internet.de/trinkwv_2023/'},
    'gesundheitsamt': {'titel': 'Gesundheitsamt Rheingau-Taunus, Formular Regenwasseranlagen (Suchtreffer)', 'url': 'https://rheingau-taunus.de/fileadmin/forms/gesundheit/regenwasseranlagen_formular.pdf'},
    'baunetz_regen': {'titel': 'Baunetzwissen, Regenwassernutzung (undatiert)', 'url': 'https://www.baunetzwissen.de/drucken/regenwassernutzung-172802'},
    'stadtwerke_zisterne': {'titel': 'Stadtwerke-Merkblatt Regenwassernutzungsanlage Zisterne (Suchtreffer)', 'url': 'https://www.sw-bb.de/_Resources/Persistent/0/b/f/1/0bf1486a81c08cb8a30fb0147e689f04e90eb79a/merkblatt_regenwassernutzungsanlage_zisterne.pdf'},
    'satzung_wutoeschingen': {'titel': 'Gemeinde Wutöschingen, Zisternensatzung 01.01.2014 (Bildscan; Werte nur aus Suchtreffer)', 'url': 'https://www.wutoeschingen.de/fileadmin/user_upload/Einrichtungen/Eigene_Formulare/Satzung_-_Zisternensatzung_vom_01.01.2014.pdf'},
    'din1989': {'titel': 'DIN 1989-100:2022-07 (kostenpflichtig, nur Geltungsangabe aus Suchtreffer)', 'url': 'https://www.din.de/'},
    'bn_ansbach': {'titel': 'BUND Naturschutz Ansbach, Regenwassernutzung außen; BHW-Meldung 22.06.2021 (Suchtreffer)', 'url': 'https://ansbach.bund-naturschutz.de/fileadmin/kreisgruppen/ansbach/Themen/Wasser/PDF-Wasser/Regenwassernutzung_aussen__4c_.pdf'},
    'service_hb_nsw': {'titel': 'Stadtservice Bremen, Niederschlagswassergebühren bezahlen', 'url': 'https://www.service.bremen.de/niederschlagswassergebuehren-bezahlen-188773'},
    'wohnglueck': {'titel': 'wohnglueck, Niederschlagswassergebühr berechnen (Ratgeber ohne Datum)', 'url': 'https://wohnglueck.de/artikel/niederschlagswassergebuehr-richtig-berechnen-und-sparen-37142'},
    'bremen_brosch': {'titel': 'Umweltressort Bremen, Broschüre Regenwasser (undatiert)', 'url': 'https://umwelt.bremen.de/sixcms/media.php/13/Regenwasser-Brosch%C3%BCre%20web.pdf'},
    'bremen_amtsblatt': {'titel': 'Amtsblatt Bremen Nr. 297 vom 21.12.2023, Förderrichtlinie Regen- und Grauwasser (Volltext gelesen)', 'url': 'https://www.amtsblatt.bremen.de/fastmedia/233/2023_12_21_ABl_Nr_0297_signed.pdf'},
    'hausundgrund_hb': {'titel': 'Haus & Grund Bremen, Niederschlagswassergebühren (Suchtreffer)', 'url': 'https://www.hausundgrund.de/verein/bremen/aktuelles/topthemen/niederschlagswassergebuehren'},
    'bwb_berlin': {'titel': 'Berliner Wasserbetriebe, Übersicht (Suchtreffer; PDF-Abruf umgeleitet)', 'url': 'https://www.bwb.de/'},
    'test_enthaerter': {'titel': 'Stiftung Warentest, Filter- und Enthärtungsanlagen für Trinkwasser: Meist überflüssig (26.02.2009, Aktualisierung 2016)', 'url': 'https://www.test.de/Filter-und-Enthaertungsanlagen-fuer-Trinkwasser-Meist-ueberfluessig-1758406-0/'},
    'beobachter': {'titel': 'Beobachter, Wasserbehandler: Kalkverhütung nicht kalkulierbar (Suchtreffer)', 'url': 'https://www.beobachter.ch/konsum/wasserbehandler-kalkverhutung-nicht-kalkulierbar-0'},
    'vz_nrw_enth': {'titel': 'Verbraucherzentrale NRW, Wasserenthärtungsanlage', 'url': 'https://www.verbraucherzentrale.nrw/schadstoffe/gebaeude/wasserenthaertungsanlage-wird-durch-einbau-das-leitungswasser-belastet-43292'},
    'ost_w512': {'titel': 'OST Ostschweizer Fachhochschule, Factsheet physikalische Wasserbehandlungsgeräte nach W512 (06/2024, Volltext gelesen)', 'url': 'https://ost.ch/fileadmin/dateiliste/3_forschung_dienstleistung/3.2_interdisziplinaere_themen/3.2.6_kmn_kompetenzzentrum_mathematik_und_naturwissenschaften/angewandte_chemie/pdf_angewandtechemie/240619_factsheet_pwbg_w512_kmn.pdf'},
    'hersteller_enth': {'titel': 'Herstellerunterlagen SYR LEX 1500, Grünbeck softliQ PB20 (Suchtreffer)', 'url': 'https://www.syr.de/'},
    'homeandsmart': {'titel': 'homeandsmart, Lohnt sich eine Wasserenthärtungsanlage? (26.10.2026, Ratgeber)', 'url': 'https://www.homeandsmart.de/hartes-wasser-kosten-enthaertungsanlage-0002-589827'},
    'statistik_wasser': {'titel': 'Statistikämter Berlin-Brandenburg, Sachsen: Trink- und Abwasserentgelte 2025 (Suchtreffer-Zahlen)', 'url': 'https://www.statistik.sachsen.de/download/presse-2026/mi_statistik-sachsen-054-2026_trinkwasser_und_abwasserentgelte_2025.pdf'},
    'bdew_wasser': {'titel': 'BDEW Wasserfakten im Überblick (PDF nicht lesbar; Wert aus Suchtreffer, über Bericht 34)', 'url': 'https://www.bdew.de/media/documents/Wasserfakten_im_Ueberblick_April_o_MW_05052025_1.pdf'},
    'eigen': {'titel': 'Eigene Rechnung / Definition (Annahmen im Hinweis)', 'url': 'recherche/37_luecken_wasser_energie.md'},
    'luecke': {'titel': 'Keine Quelle gefunden (Berichte 32 und 37, offene Punkte)', 'url': 'recherche/'},
}
BASIS_DWD = 'Datenbasis: Deutscher Wetterdienst, eigene Mittelung der Jahre 1991 bis 2020'

# (Kürzel, Land, Mittel 1991-2020, Jahr 2024, Jahr 2025, Näherungs-Region oder None)
DWD = [
    ('BW', 'Baden-Württemberg', 952.6, 1068.9, 864.9, None),
    ('BY', 'Bayern', 934.8, 1070.4, 729.3, None),
    ('BE', 'Berlin', 578.9, None, None, 'Brandenburg/Berlin'),
    ('BB', 'Brandenburg', 578.9, 601.9, 481.9, None),
    ('HB', 'Bremen', 763.0, None, None, 'Niedersachsen/Hamburg/Bremen'),
    ('HH', 'Hamburg', 763.0, None, None, 'Niedersachsen/Hamburg/Bremen'),
    ('HE', 'Hessen', 761.5, 888.9, 618.9, None),
    ('MV', 'Mecklenburg-Vorpommern', 619.8, 695.9, 512.7, None),
    ('NI', 'Niedersachsen', 763.0, 920.7, 588.6, None),
    ('NW', 'Nordrhein-Westfalen', 869.5, 1028.3, 673.4, None),
    ('RP', 'Rheinland-Pfalz', 772.6, 930.6, 694.5, None),
    ('SL', 'Saarland', 903.2, 1204.9, 818.0, None),
    ('SN', 'Sachsen', 723.5, 711.2, 561.6, None),
    ('ST', 'Sachsen-Anhalt', 574.2, 613.2, 436.7, None),
    ('SH', 'Schleswig-Holstein', 812.8, 961.7, 728.4, None),
    ('TH', 'Thüringen', 720.6, 790.5, 552.8, None),
]
NIEDERSCHLAG = []
for k, land, m, j24, j25, nae in DWD:
    kw = {'land': land, 'kuerzel': k}
    if j24 is not None:
        kw['j2024'] = j24
        kw['j2025'] = j25
    if nae:
        NIEDERSCHLAG.append(z('nd_' + k, land + ' (Näherung)', 'mm/a', m, m, 'dwd_rr', P, naeherung=True, region_dwd=nae,
                              hinweis='Nicht einzeln in der DWD-Datei; Näherung mit Kombi-Gebiet. Stationswert nicht abgerufen.', ref='37 R15', **kw))
    else:
        NIEDERSCHLAG.append(z('nd_' + k, land, 'mm/a', m, m, 'dwd_rr', G, ref='37 R01 bis R13', **kw))
NIEDERSCHLAG.append(z('nd_DE', 'Deutschland', 'mm/a', 791.5, 791.5, 'dwd_rr', G, kuerzel='DE', land='Deutschland', j2024=901.6, j2025=642.0, ref='37 R14'))
NIEDERSCHLAG.append(z('nd_hinweis_jahre', 'Einzeljahre 2024 und 2025 (Felder j2024, j2025) zeigen die Schwankung (z. B. Baden-Württemberg 1.068,9 gegen 864,9); keine Bemessungsgrundlage', 'mm/a', None, None, 'dwd_rr', P,
                      hinweis='2024: DWD-Primärdatei, Spaltenzuordnung nach Kopfzeile; 2025 ist ein Trockenjahr, Werte prüfen vor Nutzung. Datei zuletzt geändert 08.10.2026.', ref='32 Nr. 10 bis 13'))
NIEDERSCHLAG.append(z('nd_lizenz', 'Lizenz DWD Open Data: Weiterverwendung unter Creative-Commons-Lizenz BY 4.0 mit Quellenangabe; Änderungen an Daten kenntlich machen', None, None, None, 'dwd_recht', P,
                      attribution=BASIS_DWD, attribution_status='Wortlaut des geforderten Quellenvermerks und des Änderungshinweises nicht gelesen: vor Veröffentlichung am DWD-Original prüfen',
                      hinweis='Nur Zusammenfassung des Abrufwerkzeugs. Auf der Seite Quelle nennen und die eigene Mittelung kenntlich machen. Open-Data-Seite gibt keine Verfügbarkeitszusage für den Server.', ref='37 R16'))
HARTE = [
    z('hr_weich', 'Härtebereich weich', 'mmol CaCO3/l', 0, 1.5, 'wrmg9', G, ref='32 Nr. 1', dh_bis=8.4, hinweis='Unter 1,5 mmol/l; °dH-Umrechnung (mal 5,6) rechnerisch, nicht im Gesetz.'),
    z('hr_mittel', 'Härtebereich mittel', 'mmol CaCO3/l', 1.5, 2.5, 'wrmg9', G, ref='32 Nr. 2', dh_von=8.4, dh_bis=14, hinweis='1,5 bis 2,5 mmol/l; °dH rechnerisch.'),
    z('hr_hart', 'Härtebereich hart', 'mmol CaCO3/l', 2.5, None, 'wrmg9', G, ref='32 Nr. 3', dh_von=14, hinweis='Über 2,5 mmol/l, über 14 °dH rechnerisch.'),
    z('hr_pflicht', 'Wasserversorger geben die Härte mindestens einmal jährlich und bei Änderung an', None, None, None, 'wrmg9', G, ref='32 Nr. 4, § 9 Abs. 1'),
]
TRINKWV = [
    z('tw_anzeige', 'Nichttrinkwasseranlage (u. a. Regenwasser im Haus) beim Gesundheitsamt anzeigen: spätestens 4 Wochen vor Baubeginn; Stilllegung innerhalb 3 Tagen', 'Wochen', 4, 4, 'trinkwv', G, ref='32 Nr. 5, § 12',
      hinweis='§ 12 nennt Regenwasser nicht wörtlich, sondern Nichttrinkwasseranlage nach § 2 Nr. 10; ältere Behördenblätter zitieren § 13 Abs. 4 der alten TrinkwV.'),
    z('tw_definition', 'Nichttrinkwasseranlage: eine Anlage, die zusätzlich zu einer Trinkwasserinstallation installiert ist und Wasser führt, das nicht für Trinkwasserzwecke bestimmt ist (Anfang wörtlich)', None, None, None, 'trinkwv', G, ref='32 Nr. 6, § 2 Nr. 10'),
    z('tw_kennzeichnung', 'Leitungen dauerhaft unterscheidbar, Entnahmestellen gekennzeichnet und gegen Trinkgebrauch gesichert; Verbindung zur Trinkwasserinstallation nur mit Sicherungseinrichtung nach anerkannten Regeln der Technik', None, None, None, 'trinkwv', G, ref='32 Nr. 7, § 13', hinweis='Zusammenfassung des Abrufwerkzeugs, Absatznummern nicht gelesen.'),
    z('tw_natrium', 'Grenzwert Natrium im Trinkwasser', 'mg/l', 200, 200, 'trinkwv', G, ref='32 Nr. 8, Anlage 3 Teil I', hinweis='Ionentauscher erhöhen Natrium.'),
    z('tw_praxis', 'Gartenbewässerung allein nicht anzeigepflichtig; Haus (WC, Waschmaschine) anzeigepflichtig', None, None, None, 'gesundheitsamt', P, ref='32 Nr. 9', hinweis='Behördenpraxis aus Suchtreffer, nicht Gesetzestext.'),
]
REGEN = [
    z('rw_formel', 'Jahresertrag Regenwasser in Litern = Niederschlag (mm) × Dachfläche (m²) × Ertragsbeiwert × Filterwirkungsgrad (1 mm = 1 l je m²)', 'l/a', None, None, 'eigen', P, rechnung=True, hinweis='Eigene Definition; Normformeln aus DIN 1989-100 nicht gelesen (kostenpflichtig).'),
    z('rw_din', 'DIN 1989-100:2022-07 gilt für Regenwassernutzungsanlagen in Gebäuden und auf Grundstücken (mit DIN EN 16941-1), Abschnitt 4 Planungsgrundsätze zur Anlagenbemessung', None, None, None, 'din1989', P, ref='37 R19', hinweis='Normtext nicht gelesen; Faustformeln 21 Tage oder 6 % nicht belegt.'),
    z('rw_speicher', 'Faustwerte Speicher: 800 bis 1.000 l Nutzvolumen je Nutzer; 25 bis 50 l je m² angeschlossener Fläche', 'l', None, None, 'stadtwerke_zisterne', P, ref='37 R20, 32 Nr. 22', hinweis='Stadtwerke-Merkblatt, Suchtreffer; DIN nicht eingesehen.',
      l_je_nutzer_von=800, l_je_nutzer_bis=1000, l_je_m2_von=25, l_je_m2_bis=50),
    z('rw_ertragsbeiwert', 'Ertragsbeiwert geneigte Dachflächen (Tonziegel, Schiefer, Betondachstein)', '-', 0.8, 0.9, 'baunetz_regen', P, ref='37 R17', ersetzt='32 Nr. 23', hinweis='Ratgeber, undatiert, nennt Bezug auf DIN 1989-100:2022-07 ohne Tabelle.'),
    z('rw_ertragsbeiwert_gruen', 'Ertragsbeiwert Gründach', '-', None, None, 'luecke', L, ref='32 Nr. 23', hinweis='Forenwert 0,7 nicht übernommen (R074); aus DIN 1989-100 / DWA-A 138 belegen.'),
    z('rw_satzung', 'Beispiel Gemeindesatzung (Wutöschingen, Baden-Württemberg): Dachwirkungsgrad Ziegeldach 75 %, Filter 90 %, WC 24 l/(Person·d), Waschmaschine 10 l/(Person·d), Garten 0,20 l/(m²·d)', None, None, None, 'satzung_wutoeschingen', P, ref='37 R18', dach_proz=75, filter_proz=90, wc_l_pd=24, waschmaschine_l_pd=10, garten_l_m2d=0.20,
      hinweis='Nur aus Suchtreffer-Zusammenfassung; PDF ist ein Bildscan. Satzung einer einzelnen Gemeinde, keine Norm.'),
    z('rw_filter', 'Filterwirkungsgrad nach Norm', '-', None, None, 'luecke', L, ref='32 Nr. 24', hinweis='Nicht gefunden; 0,9 steht nur im Satzungsbeispiel. Nicht aus dem Gedächtnis einsetzen.'),
    z('rw_wc_bedarf', 'WC-Bedarf je Person und Tag', 'l', None, None, 'luecke', L, ref='32 Nr. 25', hinweis='Forenwert 30 bis 40 l nicht übernommen; Satzungsbeispiel 24 l (rw_satzung).'),
    z('rw_kosten', 'Regenwasseranlage Einfamilienhaus, Kosten', '€', 2500, 6000, 'bn_ansbach', P, ref='32 Nr. 20', hinweis='BUND Naturschutz Ansbach 2.500 bis 6.000; UBA laut BHW-Meldung (2021) 2.500 bis 5.000. Hausinstallation mit getrennten Leitungen eher oben oder darüber.'),
    z('rw_ersparnis', 'Ersparnis Trinkwasser 4 Personen rund 60 m³/Jahr; Abwasser bis rund 300 €/Jahr', 'm³/a', 60, 60, 'bn_ansbach', P, ref='32 Nr. 21', hinweis='BHW 2021.'),
    z('rw_pumpe', 'Kosten Pumpe, Hauswasserwerk, Hausinstallation mit getrennten Leitungen', '€', None, None, 'luecke', L, ref='37 R29'),
]
GEBUEHR = [
    z('gb_bremen', 'Niederschlagswassergebühr Bremen', '€/(m²·a) versiegelte Fläche', 0.83, 0.83, 'service_hb_nsw', G, ref='37 R21', gilt_ab='2024-04-01', gilt_bis='2026-12-31', zuvor=0.80,
      hinweis='Richtet sich nach überbauten und befestigten Flächen mit Anschluss an das Kanalsystem; Zisterne auf der Seite nicht erwähnt; Auskunft hanseWasser.'),
    z('gb_spanne', 'Typische Spanne Niederschlagswassergebühr; Einfamilienhaus etwa 150 bis 200 €/a', '€/(m²·a)', 0.70, 1.90, 'wohnglueck', P, ref='37 R22', staedte={'Berlin': 1.809, 'München': 1.77, 'Köln': 1.27, 'Hamburg': 0.76, 'Stuttgart': 0.68, 'Frankfurt': 0.50},
      hinweis='Ratgeber ohne Datum; Städtewerte können veraltet sein; manche Kommunen ohne Regengebühr.'),
    z('gb_zisterne', 'Wirkung einer Zisterne auf die Gebühr: mit Notüberlauf mindert sie in vielen Kommunen die Berechnungsfläche um mehrere m² je m³ Speicher; Regentonne oft nicht anerkannt; Gründach, durchlässige Beläge, Versickerung weitere Minderung', None, None, None, 'wohnglueck', P, ref='37 R23', hinweis='Kommunal verschieden.'),
    z('gb_bremen_zisterne', 'Bremen laut Broschüre: Zisterne ohne Notüberlauf in die Kanalisation: angeschlossene Dachfläche kann auf Antrag aus der Gebührenermittlung herausgenommen werden; mit Notüberlauf: ab mindestens 2 m³ Speicher je vollem m³ 20 m² abgezogen', 'm² je m³', 20, 20, 'bremen_brosch', P, ref='37 R24',
      hinweis='Broschüre undatiert, bezieht sich auf die Einführung der getrennten Gebühr 2011; Modell kann geändert sein. Hausverbrauch (WC) über eigenen Wasserzähler mit Abwassergebühr belegt; Anzeige beim Gesundheitsamt nötig.'),
    z('gb_berlin', 'Berlin (Beispiel für kommunale Unterschiede): Regenwassernutzungsanlage mit Kanalanschluss mindert nur 10 %, nur bei Speicher über 20 l je m² angeschlossener Fläche (Stand Oktober 2023)', '%', 10, 10, 'bwb_berlin', P, ref='37 R25'),
    z('gb_bremen_flaeche', 'Bremen: gebührenpflichtig sind nur Flächen, von denen Niederschlagswasser tatsächlich in die öffentliche Kanalisation fließt; hanseWasser verschickt Erhebungsbögen mit teils statistischen Flächen', None, None, None, 'hausundgrund_hb', P, ref='37 R26', hinweis='Verbandsseite, nicht Satzung.'),
    z('gb_bremen_foerderung', 'Bremen Förderrichtlinie Regen- und Grauwasser (Richtlinie vom 09.11.2023): bis 40 % der förderfähigen Kosten, höchstens 5.000 €; nur Gartenbewässerung 25 %, höchstens 1.500 €; Dachfläche über 50 m², Speicher mindestens 2 m³ nutzbar; Antrag vor Maßnahmenbeginn bei Bremer Umwelt Beratung e.V.', '€', None, None, 'bremen_amtsblatt', A, ref='37 R27',
      gilt_bis='2024-12-31', proz=40, max_eur=5000, proz_garten=25, max_eur_garten=1500, hinweis='ABGELAUFEN: laut Richtlinientext bis 31.12.2024 befristet; Verlängerung nicht belegt, aktuelles Programm (Schwammstadt) nicht abgerufen. Rückforderung bei Abbau innerhalb von 10 Jahren; Einbau mit Mieterhöhung gilt als nicht sachgerechte Verwendung.'),
    z('gb_bremen_anzeige', 'Bremen: Betrieb ist beim Gesundheitsamt (soweit nach TrinkwV erforderlich) und beim Abwasserunternehmen (hanseWasser) anzuzeigen', None, None, None, 'bremen_amtsblatt', G, ref='37 R28, Nr. 5'),
]
ENTHAERTUNG = [
    z('en_warentest', 'Ionentauscher tauschen Calcium und Magnesium gegen Natrium aus; fest installierte Anlagen müssen mit Salz regeneriert werden; Behandlung im Haus meist überflüssig; Versprechen wie Harmonisierung schwer belegbar', None, None, None, 'test_enthaerter', G, ref='37 E01', hinweis='Älterer Artikel (2009, aktualisiert 2016), kein Vergleich physikalischer Geräte, keine Preise.'),
    z('en_warentest_alt', 'Letzter Warentest physikalischer Geräte 2000 (mit VKI Österreich und belgischer Verbraucherunion): 10 von 12 mangelhaft, 2 befriedigend', None, None, None, 'beobachter', P, ref='37 E02', hinweis='Beobachter-Seite nicht selbst gelesen; kein neuer Test.'),
    z('en_vz_nrw', 'Verbraucherzentrale NRW: sinnvoll ab über 2,5 mmol/l (über 14 °dH), vor allem gegen Kalk im Warmwasserbereich; hartes Wasser gesundheitlich unbedenklich', 'mmol/l', 2.5, 2.5, 'vz_nrw_enth', G, ref='37 E03'),
    z('en_salz_vz', 'Salzverbrauch je Einfamilienhaus: mehr als 100 kg im Jahr möglich', 'kg/a', 100, None, 'vz_nrw_enth', G, ref='37 E04', ersetzt='32 Nr. 29 (Salz 50 bis 100 kg, KI-Schätzung)', hinweis='Natrium-Grenzwert 200 mg/l; Keimwachstum bei langem Stillstand.'),
    z('en_ausfuehrung', 'Ausführung: Fachinstallateur, DVGW-zertifizierte Geräte, regelmäßige Wartung, Salzverbrauch im Betriebsbuch protokollieren', None, None, None, 'vz_nrw_enth', G, ref='37 E05'),
    z('en_w512', 'DVGW W 512 prüft nur die Wirksamkeit gegen Steinbildung in Trinkwassererwärmern (Kaltwassergeräte: W 510); Prüfstand 3 Wochen, Boiler mit Heizstäben, Parallelstrecke ohne Gerät', 'Wochen', 3, 3, 'ost_w512', G, ref='37 E06'),
    z('en_w512_kriterium', 'Kriterium wirksam nach W 512', '%', None, None, 'ost_w512', L, ref='37 E07', hinweis='Widerspruch: OST mindestens 66 % weniger Kalk, Suchtreffer Wirksamkeitsfaktor 0,8; Norm kostenpflichtig. Keinen Zahlenwert übernehmen.'),
    z('en_ost_test', 'OST-Test: 10 physikalische Geräte (4 Permanentmagnet, 2 Elektroimpuls, 2 elektrochemisch, 1 Katalysator, 1 anderes); nur die 2 elektrochemischen zeigten kalkverhütende Wirkung (Leitungswasser Rapperswil)', 'Geräte', None, None, 'ost_w512', G, ref='37 E08', getestet=10, wirksam=2),
    z('en_normen', 'DIN EN 14743 / DIN 19636-100 (Ionenaustauscher) und DIN EN 806-5 (Wartungsintervalle): Normtexte kostenpflichtig, nicht gelesen; Herstellerbeispiele: Härteeinstellung vierteljährlich Betreiber, Reinigung Salzbehälter und Funktionsprüfung jährlich Fachhandwerker, Verschleißteile alle 2 Jahre, Hygieneelemente nach 250 m³ oder 2 Jahren', None, None, None, 'hersteller_enth', P, ref='37 E09/E10', hinweis='Gerätespezifisch, keine Norm; vor Kauf Bedienungsanleitung lesen.'),
    z('en_anschaffung', 'Anschaffung Einfamilienhaus', '€', 600, 3000, 'homeandsmart', P, ref='37 E11', hinweis='Ratgeber vom 26.10.2026.'),
    z('en_einbau', 'Einbau durch Installateur', '€', 300, 600, 'homeandsmart', P, ref='37 E12'),
    z('en_betrieb', 'Salz und Betrieb pro Jahr (4 Personen, 180 m³ Wasser, Resthärte 8 °dH): 14 °dH 43 kg und 49 €; 20 °dH 86 kg und 89 €; 25 °dH 122 kg und 122 €', '€/a', None, None, 'homeandsmart', P, ref='37 E13', ersetzt='32 Nr. 29', staffel=[{'dh': 14, 'kg': 43, 'eur': 49}, {'dh': 20, 'kg': 86, 'eur': 89}, {'dh': 25, 'kg': 122, 'eur': 122}], hinweis='Ratgeber-Rechnung; 25 °dH stützt die Verbraucherzentrale-Aussage über 100 kg.'),
    z('en_wartung', 'Wartung durch Fachbetrieb alle 1 bis 2 Jahre', '€', 80, 150, 'homeandsmart', P, ref='37 E14'),
    z('en_kalkwandler', 'Kalkwandler/physikalisches Gerät: Preis', '€', None, None, 'luecke', L, ref='37 E15'),
]
PREISE = [
    z('wp_tw_BE', 'Trinkwasserpreis 2025 Berlin', '€/m³', 1.81, 1.81, 'statistik_wasser', P, ref='32 Nr. 26', land='Berlin', abwasser=2.16),
    z('wp_tw_BB', 'Trinkwasserpreis 2025 Brandenburg', '€/m³', 1.82, 1.82, 'statistik_wasser', P, ref='32 Nr. 26', land='Brandenburg', abwasser=3.60),
    z('wp_tw_NW', 'Trinkwasserpreis 2025 Nordrhein-Westfalen', '€/m³', 1.86, 1.86, 'statistik_wasser', P, ref='32 Nr. 26', land='Nordrhein-Westfalen', abwasser=3.21),
    z('wp_tw_ST', 'Trinkwasserpreis 2025 Sachsen-Anhalt', '€/m³', 2.01, 2.01, 'statistik_wasser', P, ref='32 Nr. 26', land='Sachsen-Anhalt', abwasser=3.45),
    z('wp_tw_SN', 'Trinkwasserpreis 2025 Sachsen', '€/m³', 2.35, 2.35, 'statistik_wasser', P, ref='32 Nr. 26', land='Sachsen', abwasser=2.77),
    z('wp_tw_HE', 'Trinkwasserpreis 2025 Hessen', '€/m³', 2.59, 2.59, 'statistik_wasser', P, ref='32 Nr. 26', land='Hessen', abwasser=2.75),
    z('wp_luecke', 'Wasser- und Abwasserpreis für die übrigen Länder (Bremen, Hamburg, Niedersachsen, Schleswig-Holstein, Mecklenburg-Vorpommern, Thüringen, Rheinland-Pfalz, Saarland, Baden-Württemberg, Bayern)', '€/m³', None, None, 'luecke', L, ref='32 Nr. 26/27',
      laender=['HB', 'HH', 'NI', 'SH', 'MV', 'TH', 'RP', 'SL', 'BW', 'BY'], hinweis='Nur 6 Länder belegt (Feld abwasser = Schmutzwasserentgelt €/m³); Zahlen aus Suchtreffern, Bezugsjahre und Methoden verschieden.'),
    z('wp_verbrauch', 'Wasserverbrauch je Einwohner und Tag 2024', 'l', 122, 122, 'bdew_wasser', P, ref='34 A01', ab='2026-10-27', hinweis='Suchtreffer; Destatis 2022: 126 l.'),
]
WIDERSPRUECHE = [
    {'id': 'w_wa_01', 'text': 'Niederschlag: Bericht 32 liefert nur Einzeljahre 2024/2025 (Baden-Württemberg 1.068,9 gegen 864,9 mm); Bericht 37 liefert das Mittel 1991 bis 2020 (952,6). Für Bemessung das Mittel nehmen.', 'betrifft': ['nd_BW', 'nd_hinweis_jahre']},
    {'id': 'w_wa_02', 'text': 'Hamburg, Bremen und Berlin fehlen in der DWD-Länderdatei einzeln: Näherung mit den Kombi-Gebieten Niedersachsen/Hamburg/Bremen (763,0) und Brandenburg/Berlin (578,9).', 'betrifft': ['nd_HB', 'nd_HH', 'nd_BE']},
    {'id': 'w_wa_03', 'text': 'Ertragsbeiwert: Bericht 32 hatte Forenwerte (Ziegel 0,8 bis 0,9, Gründach 0,7); Bericht 37 nur Ratgeber Baunetzwissen 0,8 bis 0,9, Gründach offen; Satzungsbeispiel rechnet 75 % für Ziegeldach. Keine Normquelle.', 'betrifft': ['rw_ertragsbeiwert', 'rw_satzung']},
    {'id': 'w_wa_04', 'text': 'Enthärtung: Bericht 32 (Salz 50 bis 100 kg/Jahr, Wartung 50 bis 150 €, KI-Schätzung, nicht übernehmen) gegen Verbraucherzentrale NRW (mehr als 100 kg) und Ratgeber-Rechnung (43 bis 122 kg). Bericht 37 hat Vorrang.', 'betrifft': ['en_salz_vz', 'en_betrieb']},
    {'id': 'w_wa_05', 'text': 'Kosten Regenwasseranlage: BUND Ansbach 2.500 bis 6.000 € gegen UBA laut BHW 2.500 bis 5.000 € (2021).', 'betrifft': ['rw_kosten']},
    {'id': 'w_wa_06', 'text': 'W-512-Wirksamkeit: OST 66 % weniger Kalk gegen Suchtreffer Faktor 0,8 (höchstens 20 % Abscheidung). Kein Wert übernommen.', 'betrifft': ['en_w512_kriterium']},
    {'id': 'w_wa_07', 'text': 'Bremer Regenwasser-Förderung (bis 40 %, 5.000 €) ist abgelaufen (31.12.2024); ein Fördersammler führt das Programm als geschlossen. Nicht als aktuell anzeigen.', 'betrifft': ['gb_bremen_foerderung']},
]

OBJ = {
    'meta': {
        'titel': 'Wasser: Niederschlag, Härte, Trinkwasserrecht, Regenwasser, Gebühren, Enthärtung',
        'niederschlag_hinweis': 'Liste niederschlag: Jahresmittel 1991 bis 2020 in mm je Jahr (von = bis); j2024 und j2025 sind Einzeljahre.',
        'abruf': '2026-10-27',
        'hinweis': 'Bericht 37 hat Vorrang vor 32. Das DIN 1989-100 war nicht lesbar (kostenpflichtig): Bemessungswerte sind Ratgeber- oder Satzungswerte. Solarthermie steht in energie.js.',
        'dwd_attribution': BASIS_DWD,
        'dwd_lizenz': 'CC BY 4.0 (Wortlaut des Quellenvermerks nicht verifiziert)',
    },
    'quellen': QUELLEN,
    'niederschlag': NIEDERSCHLAG,
    'haerte': HARTE,
    'trinkwasserrecht': TRINKWV,
    'regenwasser': REGEN,
    'gebuehren': GEBUEHR,
    'enthaertung': ENTHAERTUNG,
    'wasserpreise': PREISE,
    'widersprueche': WIDERSPRUECHE,
}

if __name__ == '__main__':
    print(schreibe('wasser', 'Wasser: Niederschlag 1991-2020 (DWD, CC BY 4.0), Härte, TrinkwV, Regenwasser, Gebühren, Enthärtung, Preise. Quellen: recherche/32, 37 (Abruf 27.10.2026), 37 hat Vorrang. Erzeugt von erzeuger/daten_d_wasser.py.', OBJ))
