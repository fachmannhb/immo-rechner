# -*- coding: utf-8 -*-
"""Erzeugt daten/energie.js aus recherche/22 (PV), 23 (Bundesregeln), 29 (Dachwinkel), 34 (Wallbox, 14a), 37 (Solarthermie)."""
from daten_d_common import maker, schreibe, G, P, N, L, A

z = maker('2026-10-26')
z27 = maker('2026-10-27')

QUELLEN = {
    'vz_preisindex': {'titel': 'Verbraucherzentrale, Preisindex PV und Speicher (Stand 28.08.2026; 71 bzw. 70 Angebote)', 'url': 'https://www.verbraucherzentrale.de/wissen/energie/erneuerbare-energien/was-kostet-eine-photovoltaikanlage-49155'},
    'vz_planung': {'titel': 'Verbraucherzentrale, Photovoltaik: Was bei der Planung wichtig ist (Stand 26.08.2026)', 'url': 'https://www.verbraucherzentrale.de/wissen/energie/erneuerbare-energien/photovoltaik-was-bei-der-planung-einer-solaranlage-wichtig-ist-5574'},
    'vz_speicher': {'titel': 'Verbraucherzentrale, Lohnen sich Batteriespeicher? (Stand 02.07.2026; nur Abrufwerkzeug-Auszug)', 'url': 'https://www.verbraucherzentrale.de/wissen/energie/erneuerbare-energien/lohnen-sich-batteriespeicher-fuer-photovoltaikanlagen-24589'},
    'vz_eeg': {'titel': 'Verbraucherzentrale, EEG 2023/24: Was heute gilt (Stand 01.08.2026; nicht im Rohtext geprüft)', 'url': 'https://www.verbraucherzentrale.de/wissen/energie/erneuerbare-energien/eeg-202324-was-heute-fuer-photovoltaikanlagen-gilt-75401'},
    '42watt': {'titel': '42watt, Photovoltaik Kosten 2026 (Seite 14.07.2026, Ratgeber)', 'url': 'https://42watt.de/magazin/photovoltaik-kosten'},
    'ise_fakten': {'titel': 'Fraunhofer ISE, Aktuelle Fakten zur Photovoltaik in Deutschland (Fassung 20.08.2026)', 'url': 'https://www.ise.fraunhofer.de/content/dam/ise/de/documents/publications/studies/aktuelle-fakten-zur-photovoltaik-in-deutschland.pdf'},
    'pvgis': {'titel': 'PVGIS 5.3 (EU-Kommission), Bremen 53,075 N 8,807 O, SARAH3 2005 bis 2023, 14 % Verluste', 'url': 'https://re.jrc.ec.europa.eu/pvg_tools/de/'},
    'co2_ausrichtung': {'titel': 'co2online, Optimale Ausrichtung und Neigung für PV', 'url': 'https://www.co2online.de/modernisieren-und-bauen/photovoltaik/dach-ausrichtung-neigung-alternativen/'},
    'vz_nds': {'titel': 'Verbraucherzentrale Niedersachsen, Photovoltaik für Privathaushalte (Broschüre 2023, S. 3)', 'url': 'https://www.verbraucherzentrale-niedersachsen.de/sites/default/files/medien/645/dokumente/BR_Photovoltaik_VZ-Nds_2023_Web.pdf'},
    'reduco_blog': {'titel': 'reduco.ai-Blog (Berufung auf Fraunhofer ISE/PVGIS, nur Suchtreffer)', 'url': 'https://reduco.ai/'},
    'bdew_strompreis': {'titel': 'BDEW Strompreisanalyse August 2026 (PDF, Seite 1)', 'url': 'https://www.bdew.de/media/documents/BDEW_Strompreisanalyse_082026.pdf'},
    'destatis_strom': {'titel': 'Statistisches Bundesamt, Haushaltsstrompreis 2. Halbjahr 2025 (nur Suchtreffer-Zusammenfassung)', 'url': 'https://www.destatis.de/'},
    'bnetza_eeg': {'titel': 'Bundesnetzagentur, Erneuerbare Energien: Fördersätze (Inbetriebnahme 01.08. bis 31.12.2026)', 'url': 'https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/EEG_Foerderung/start.html'},
    'ustg12': {'titel': 'UStG § 12 Steuersätze, Abs. 3 (gesetze-im-internet.de)', 'url': 'https://www.gesetze-im-internet.de/ustg_1980/__12.html'},
    'ustg19': {'titel': 'UStG § 19 Besteuerung der Kleinunternehmer', 'url': 'https://www.gesetze-im-internet.de/ustg_1980/__19.html'},
    'estg3': {'titel': 'EStG § 3 (Nr. 72), gesetze-im-internet.de', 'url': 'https://www.gesetze-im-internet.de/estg/__3.html'},
    'gewstg3': {'titel': 'GewStG § 3 (Nr. 32) und § 9 Nr. 1', 'url': 'https://www.gesetze-im-internet.de/gewstg/__3.html'},
    'msbg29': {'titel': 'MsbG § 29 Ausstattung von Messstellen', 'url': 'https://www.gesetze-im-internet.de/messbg/__29.html'},
    'eeg9': {'titel': 'EEG 2023 §§ 8, 9, 10b, 21, 21b, 48, 48a', 'url': 'https://www.gesetze-im-internet.de/eeg_2014/__9.html'},
    'mastrv5': {'titel': 'MaStRV § 5 Registrierungsfrist', 'url': 'https://www.gesetze-im-internet.de/mastrv/__5.html'},
    'bnetza_balkon': {'titel': 'Bundesnetzagentur, Balkon-Solaranlagen (FAQ, Seitenstand 21.02.2025)', 'url': 'https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/ErneuerbareEnergien/Solaranlagen/Balkon_table.html'},
    'vz_steckersolar': {'titel': 'Verbraucherzentrale, Gesetze und Normen für Steckersolar (Seitenstand 21.10.2026, Sekundärquelle)', 'url': 'https://www.verbraucherzentrale.de/aktuelle-meldungen/energie/neue-gesetze-und-normen-fuer-steckersolar-was-gilt-heute-was-gilt-noch-nicht-90740'},
    'bgb554': {'titel': 'BGB § 554 Barrierereduzierung, E-Mobilität, Einbruchsschutz und Steckersolargeräte', 'url': 'https://www.gesetze-im-internet.de/bgb/__554.html'},
    'weg20': {'titel': 'WEG § 20 Bauliche Veränderungen', 'url': 'https://www.gesetze-im-internet.de/woeigg/__20.html'},
    'enwg': {'titel': 'EnWG §§ 5, 14a, 42a, 42b', 'url': 'https://www.gesetze-im-internet.de/enwg_2005/__14a.html'},
    'stromstg9': {'titel': 'StromStG § 9 Steuerbefreiungen', 'url': 'https://www.gesetze-im-internet.de/stromstg/__9.html'},
    'bnetza_vbe': {'titel': 'Bundesnetzagentur, Steuerbare Verbrauchseinrichtungen, BK6-22-300 (Zusammenfassung)', 'url': 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/SteuerbareVBE/artikel.html'},
    'utopia_strom': {'titel': 'Utopia, Stromspiegel 2025 (nur Suchtreffer)', 'url': 'https://utopia.de/ratgeber/stromspiegel-2025-ist-dein-stromverbrauch-normal_813088/'},
    'co2_st': {'titel': 'co2online, Solarthermie Kosten, Preise, Amortisation (Artikel 28.04.2026)', 'url': 'https://www.co2online.de/modernisieren-und-bauen/solarthermie/solarthermie-preise-kosten-amortisation/'},
    'vz_st': {'titel': 'Verbraucherzentrale, Solarthermie: So nutzen Sie Solarenergie für Heizung und Warmwasser', 'url': 'https://www.verbraucherzentrale.de/wissen/energie/erneuerbare-energien/solarthermie-so-nutzen-sie-solarenergie-fuer-heizung-und-warmwasser-5568'},
    'beg_em': {'titel': 'Bundesanzeiger, Förderrichtlinie BEG Einzelmaßnahmen, Vom 17. August 2026 (BAnz AT 27.08.2026 B1), in Kraft mit Wirkung vom 21.07.2026 (Volltext, Bericht 39)', 'url': 'https://www.bundesanzeiger.de/pub/publication/jLXvW09kHTQoDINAdoC/jLXvW09kHTQoDINAdoC/BAnz%20AT%2027.08.2026%20B1.pdf?inline='},
    'beg_em_juli': {'titel': 'BMWE-Fassung der Richtlinie BEG EM, Vom 17. Juli 2026 (Kopie Ingenieurkammer; Bundesanzeiger-Angabe dort noch Platzhalter), frühere Fassung', 'url': 'https://www.ingenieurkammer.de/fileadmin/dokumente/Downloads_PDF/News_Dokumente/20260717_F%C3%B6rderrichtlinie_BEG_EM.pdf'},
    'eeg23c': {'titel': 'EEG 2023 § 23c Anteilige Zahlung (gesetze-im-internet.de; Überschrift und Wortlaut vom Hauptfenster gegengeprüft)', 'url': 'https://www.gesetze-im-internet.de/eeg_2014/__23c.html'},
    'adac_verbrauch': {'titel': 'ADAC, Stromverbrauch & Reichweite: Große Unterschiede bei Elektroautos (Stand 21.07.2026)', 'url': 'https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/elektroauto/stromverbrauch-elektroautos-adac-test/'},
    'adac_ladeverlust': {'titel': 'ADAC, Ladeverluste beim Elektroauto (Studie 06.08.2026, 5 Fahrzeuge)', 'url': 'https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/laden/ladeverluste-elektroauto-studie/'},
    'adac_wallbox': {'titel': 'ADAC, Wallbox: Das kosten private Ladestationen plus Installation 2026 (29.06.2026)', 'url': 'https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/laden/wallbox-kosten/'},
    'adac_kraftstoff': {'titel': 'ADAC, Spritpreis-Entwicklung: Benzin- und Dieselpreise seit 1950 (Stand 01.10.2026)', 'url': 'https://www.adac.de/verkehr/tanken-kraftstoff-antrieb/kraftstoffpreisentwicklung/'},
    'destatis_fahrleistung': {'titel': 'Statistisches Bundesamt, Fahrleistungen, Energieverbräuche und spezifischer Kraftstoffverbrauch je 100 km mit Pkw', 'url': 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Umwelt/UGR/verkehr-tourismus/Tabellen/fahrleistungen-kraftstoffverbrauch.html'},
    'kba_km': {'titel': 'Kraftfahrt-Bundesamt, Pressemitteilung Nr. 38/2026 Verkehr in Kilometern (09.09.2026)', 'url': 'https://www.kba.de/DE/Presse/Pressemitteilungen/Allgemein/2026/pm38_2026_verkehr_in_kilometern.html'},
    'kba_km_2024': {'titel': 'Kraftfahrt-Bundesamt, Verkehr in Kilometern, Kurzbericht 2024 (nur Suchtreffer-Zusammenfassung)', 'url': 'https://www.kba.de/DE/Statistik/Kraftverkehr/VerkehrKilometer/vk_inlaenderfahrleistung/2024/verkehr_in_kilometern_kurzbericht_pdf.pdf?__blob=publicationFile&v=5'},
    'nav19': {'titel': 'NAV § 19 Betrieb von elektrischen Anlagen, Verbrauchsgeräten und Ladeeinrichtungen, Eigenanlagen (gesetze-im-internet.de)', 'url': 'https://www.gesetze-im-internet.de/nav/__19.html'},
    'bnetza_bk6': {'titel': 'Bundesnetzagentur, Festlegung BK6-22-300, Anlage 1 (Beschluss 27.11.2023)', 'url': 'https://www.bundesnetzagentur.de/DE/Beschlusskammern/1_GZ/BK6-GZ/2022/BK6-22-300/Beschluss/BK6-22-300_Beschluss_Anlage1.pdf'},
    'bnetza_vbe_start': {'titel': 'Bundesnetzagentur, Integration von steuerbaren Verbrauchseinrichtungen', 'url': 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/SteuerbareVBE/start.html'},
    '42watt_wallbox': {'titel': '42watt, Wallbox Förderung 2026 (Ratgeber)', 'url': 'https://42watt.de/magazin/wallbox-foerderung'},
    'adac_woche': {'titel': 'Suchtreffer-Zusammenfassung zur ADAC-Wochenauswertung (21.10.2026), Seite nicht selbst gelesen', 'url': 'https://www.adac.de/verkehr/tanken-kraftstoff-antrieb/kraftstoffpreisentwicklung/'},
    'kfw458': {'titel': 'KfW Merkblatt Zuschuss 458, Stand 09/2026, gültig ab 24.09.2026 (PDF gelesen)', 'url': 'https://www.kfw.de/PDF/Download-Center/F%C3%B6rderprogramme-(Inlandsf%C3%B6rderung)/PDF-Dokumente/6000005131_M_458.pdf'},
    'bericht_luecke': {'titel': 'Berichte 22, 23, 34, 37: keine Quelle gefunden', 'url': 'recherche/'},
}

# --- PV-Anlagenpreise (Verbraucherzentrale-Staffeln; netto = brutto bei 0 % USt, Stichprobe nicht geprüft) ---
PREIS_NB = 'netto/brutto in der Quelle nicht angegeben; bei Anlagen bis 30 kWp 0 % USt (§ 12 Abs. 3 UStG), ob alle Angebote darunter fielen ist offen.'
PV_PREISE = []
for kid, v, b, p in [('4_6', 4, 6, 2090), ('6_8', 6, 8, 1820), ('8_9', 8, 9, 1520), ('9_10', 9, 10, 1410),
                     ('10_12', 10, 12, 1290), ('12_14', 12, 14, 1240), ('14_16', 14, 16, 1220), ('ueber16', 16, None, 1010)]:
    name = 'PV-Anlage ohne Speicher, ' + (('über %d kWp' % v) if b is None else ('über %d bis %d kWp' % (v, b)) if v > 4 else '4 bis 6 kWp')
    PV_PREISE.append(z('pv_preis_' + kid, name, '€/kWp', p, p, 'vz_preisindex', G, kwp_von=v, kwp_bis=b, nb='unklar'))
PV_PREISE += [
    z('pv_preis_5_10_ratgeber', 'PV 5 bis 10 kWp ohne Speicher (Ratgeber)', '€/kWp', 1100, 1400, '42watt', P, nb='unklar', hinweis='Niedriger als Verbraucherzentrale (1.410 bis 2.090 in diesem Bereich); Streuung plausibel, Staffeln der Verbraucherzentrale als Grundlage nehmen.'),
    z('pv_preis_10_15_ratgeber', 'PV 10 bis 15 kWp ohne Speicher (Ratgeber)', '€/kWp', 970, 1200, '42watt', P, nb='unklar'),
    z('pv_gesamt_5_10_sp10', 'PV 5 bis 10 kWp mit 10-kWh-Speicher, Gesamtpreis', '€ gesamt', 13000, 19000, '42watt', P, nb='unklar'),
    z('pv_gesamt_10_15_sp10', 'PV 10 bis 15 kWp mit 10-kWh-Speicher, Gesamtpreis', '€ gesamt', 17000, 23000, '42watt', P, nb='unklar'),
    z('pv_systempreis_ise', 'Systempreis Aufdach 10 bis 100 kWp (Fraunhofer ISE Abb. 5)', '€/kWp', None, None, 'ise_fakten', L, hinweis='Zahl nur als Grafik im PDF, nicht ablesbar.'),
]
SPEICHER = [
    z('sp_preis_4_6', 'Batteriespeicher 4 bis 6 kWh', '€/kWh', 510, 510, 'vz_preisindex', G, nb='unklar'),
    z('sp_preis_6_8', 'Batteriespeicher über 6 bis 8 kWh', '€/kWh', 480, 480, 'vz_preisindex', G, nb='unklar'),
    z('sp_preis_8_10', 'Batteriespeicher über 8 bis 10 kWh', '€/kWh', 410, 410, 'vz_preisindex', G, nb='unklar'),
    z('sp_preis_10_12', 'Batteriespeicher über 10 bis 12 kWh', '€/kWh', 390, 390, 'vz_preisindex', G, nb='unklar'),
    z('sp_preis_12_16', 'Batteriespeicher über 12 bis 16 kWh', '€/kWh', 360, 360, 'vz_preisindex', G, nb='unklar'),
    z('sp_preis_spanne', 'Batteriespeicher inkl. Installation, ab 5 kWh', '€/kWh', 300, 700, 'vz_speicher', P, hinweis='Nur Abrufwerkzeug-Auszug.'),
    z('sp_preis_ratgeber', 'Speicher 10 kWh installiert (Ratgeber)', '€ gesamt', 4000, 8000, '42watt', P, hinweis='Entspricht rund 350 bis 700 €/kWh.'),
    z('sp_groesse', 'Speichergröße Faustregel', 'kWh je 1.000 kWh Jahresverbrauch', 1.5, 1.5, 'vz_speicher', P, hinweis='Nur Abrufwerkzeug-Auszug.'),
    z('sp_lebensdauer', 'Speicher Lebensdauer', 'Jahre', 10, 15, 'vz_speicher', P, hinweis='Nur Abrufwerkzeug-Auszug.'),
    z('sp_ersatz', 'Speicher-Ersatz nach 12 bis 20 Jahren (Ratgeber)', '€', 3000, 8000, '42watt', P),
]
TECHNIK = [
    z('pv_flaeche_vz', 'Flächenbedarf PV', 'm² je kWp', 5, 7, 'vz_planung', G, hinweis='Beim Flachdach (Aufständerung, Abstände) deutlich mehr; nicht recherchiert.'),
    z('pv_flaeche_co2', 'Flächenbedarf PV laut co2online', 'm² je kWp', 5, 6.4, 'co2_ausrichtung', G, ab='2026-10-27', hinweis='Seite nennt 6 bis 6,4 m² für 1 bis 1,2 kWp.'),
    z('pv_flaeche_ratgeber', 'Flächenbedarf Schrägdach (Ratgeber)', 'm² je kWp', 8, 8, '42watt', P, hinweis='Widerspricht Verbraucherzentrale und co2online.'),
    z('pv_degr_gemessen', 'Degradation gemessen (44 Aufdachanlagen)', '% der Nennleistung je Jahr', 0.15, 0.15, 'ise_fakten', G),
    z('pv_degr_plan', 'Degradation übliche Planungsannahme (Ertrag)', '% je Jahr', 0.5, 0.5, 'ise_fakten', G, hinweis='LCOE-Annahme des ISE, Nutzungsdauer 20 Jahre.'),
    z('pv_garantie', 'Herstellergarantie: Leistungsverlust über 25 bis 30 Jahre höchstens', '%', 10, 15, 'ise_fakten', G),
    z('pv_betrieb_proz', 'Laufende Kosten', '% der Investition je Jahr', 1, 2, 'ise_fakten', G, typisch=1, hinweis='LCOE-Annahme des ISE: 1 %.'),
    z('pv_betrieb_eur', 'Betrieb und Wartung gesamt', '€ je Jahr', 200, 300, '42watt', P),
    z('pv_wartungsvertrag', 'Wartungsvertrag', '€ je Jahr', 150, 250, '42watt', P),
    z('pv_versicherung', 'Versicherung', '€ je Jahr', 70, 300, '42watt', P),
    z('pv_wr_ersatz', 'Wechselrichter-Ersatz nach 10 bis 15 Jahren', '€', 1000, 2000, '42watt', P),
    z('pv_pruefintervall', 'Prüfung durch Fachperson spätestens alle', 'Jahre', 5, 5, 'vz_planung', G),
    z('pv_ausrichtung_optimum', 'Optimale Ausrichtung Süd, 30 Grad; unter 25 oder über 60 Grad bis 10 % weniger', None, None, None, 'vz_planung', G),
]
ERTRAG = [
    z('ertrag_bremen_sued35', 'Ertrag Bremen Süd 35 Grad', 'kWh/kWp·a', 995.8, 995.8, 'pvgis', G),
    z('ertrag_bremen_sued30', 'Ertrag Bremen Süd 30 Grad', 'kWh/kWp·a', 988.0, 988.0, 'pvgis', G, hinweis='daten/pvgis.js nennt für Bremen Süd 30 Grad 983,44 (Version 5.2, SARAH2, 2005 bis 2020): andere Datenversion, gleiche Größenordnung.'),
    z('ertrag_bremen_sued15', 'Ertrag Bremen Süd 15 Grad', 'kWh/kWp·a', 932.0, 932.0, 'pvgis', G),
    z('ertrag_bremen_so35', 'Ertrag Bremen Südost 35 Grad', 'kWh/kWp·a', 945.6, 945.6, 'pvgis', G),
    z('ertrag_bremen_ost30', 'Ertrag Bremen Ost 30 Grad', 'kWh/kWp·a', 808.6, 808.6, 'pvgis', G),
    z('ertrag_bremen_west30', 'Ertrag Bremen West 30 Grad', 'kWh/kWp·a', 789.0, 789.0, 'pvgis', G),
    z('ertrag_bremen_ow30', 'Ertrag Bremen Ost-West 30 Grad (Mittel aus Ost und West, gleiche kWp je Seite)', 'kWh/kWp·a', 798.8, 798.8, 'pvgis', G, rechnung=True, hinweis='Eigener Mittelwert aus zwei PVGIS-Werten; rund 81 % des Südertrags.'),
    z('ertrag_vz_plan', 'Planungsertrag (Verbraucherzentrale, vorsichtig)', 'kWh/kWp·a', 900, 900, 'vz_planung', G),
    z('ertrag_ratgeber', 'Ertrag Ratgeber', 'kWh/kWp·a', 950, 1050, '42watt', P, hinweis='Über dem Bremer Südwert.'),
    z('ertrag_co2_sued35', 'Ertrag Süd 35 Grad laut co2online (Bezug = 100 %)', 'kWh/kWp·a', 824, 824, 'co2_ausrichtung', G, ab='2026-10-27', hinweis='Süd 25 Grad 816, 30 Grad 822, 45 Grad 813; Ost 25/30/35/45 Grad 679/667/655/624. Standort/Datenbasis der Seite unklar; liegt unter dem PVGIS-Wert für Bremen (995,8).'),
    z('ertrag_ost_west_abschlag_co2', 'Ost/West gegenüber Süd weniger', '%', 18, 24, 'co2_ausrichtung', G, ab='2026-10-27'),
    z('ertrag_ost_west_abschlag_vz', 'Ost-/West-Dach Ertragsminderung', '%', 10, 20, 'vz_nds', G, ab='2026-10-27'),
    z('ertrag_flachdach_0', 'Flachdach 0 Grad relativ zum Optimum', '%', 84, 84, 'reduco_blog', P, ab='2026-10-27', hinweis='Anbieter-Blog, Sekundärquelle.'),
]
EIGEN = [
    z('ev_ohne', 'Eigenverbrauchsquote ohne Speicher', '% der Erzeugung', 20, 40, 'ise_fakten', G, hinweis='Je nach Anlagengröße (HTW-Studie, Primärstudie nicht eingesehen). Verbraucherzentrale Beispiel 4 Personen, 5 kWp: 20 bis 30 %.'),
    z('ev_mit', 'Eigenverbrauchsquote mit Speicher', '% der Erzeugung', 50, 60, 'vz_planung', G, hinweis='Beispiel 5 kWp, 4 Personen. ISE: Speicher verdoppelt den Eigenverbrauch typischerweise.'),
    z('ev_mit_ratgeber', 'Eigenverbrauchsquote mit Speicher (Ratgeber: 5 kWh 45 bis 55, 10 kWh 60 bis 70)', '% der Erzeugung', None, None, '42watt', P, kwh5_von=45, kwh5_bis=55, kwh10_von=60, kwh10_bis=70),
    z('ev_autarkie', 'Autarkiegrad (Anteil am Verbrauch, nicht an der Erzeugung): ohne Speicher 25 bis 30, mit Speicher bis 70', '% des Verbrauchs', None, None, 'vz_speicher', P, ohne_von=25, ohne_bis=30, mit_bis=70, hinweis='Andere Größe als die Quote; nur Abrufwerkzeug-Auszug.'),
    z('ev_vermietung', 'Quoten gelten für Haushalte mit eigenem Verbrauch; im vermieteten Haus verbrauchen Mieter den Strom, Eigenverbrauch des Eigentümers wäre nur Allgemeinstrom', None, None, None, 'bericht_luecke', L, hinweis='Mieterstrom/Direktlieferung nicht recherchiert (siehe regeln r_mieterstrom_*).'),
]
STROMPREIS = [
    z('strompreis_haushalt', 'Haushaltsstrompreis 2026 Durchschnitt (3.500 kWh/Jahr, nur Neukundentarife, ungewichtet)', 'ct/kWh brutto', 37.0, 37.0, 'bdew_strompreis', G, nb='brutto', hinweis='Zusammensetzung: Beschaffung/Vertrieb 15,17; Netzentgelt 9,24; Steuern, Abgaben, Umlagen 12,6 ct/kWh.'),
    z('strompreis_bdew_jan', 'Haushaltsstrompreis BDEW-Fassung Januar (ersetzt durch 08/2026)', 'ct/kWh', 37.2, 37.2, 'ise_fakten', P, ersetzt='strompreis_haushalt'),
    z('strompreis_destatis', 'Haushaltsstrompreis Destatis 2. Halbjahr 2025', 'ct/kWh', 40.55, 40.55, 'destatis_strom', P, hinweis='unsicher: nur Suchtreffer-Zusammenfassung, Original nicht abgerufen; Destatis und BDEW messen verschieden.'),
    z('strom_je_person', 'Stromverbrauch Durchschnitt je Person', 'kWh je Person und Jahr', 1240, 1240, 'utopia_strom', P, ab='2026-10-27', hinweis='aus Bericht 34 A02, Stromspiegel 2025 über Utopia.'),
]
# --- EEG-Vergütung: Hauptfenster hat Teil 7,70/6,66/5,44 und Voll 12,22/10,24/10,24 gegengeprüft ---
EEG_GUELT = dict(gilt_ab='2026-08-01', gilt_bis='2026-12-31')
EEG = [
    z('eeg_bis10', 'EEG-Vergütung Anlage auf Gebäude bis 10 kW', 'ct/kWh', None, None, 'bnetza_eeg', G, teil=7.70, voll=12.22, klasse_bis_kw=10, **EEG_GUELT),
    z('eeg_bis40', 'EEG-Vergütung Anlage auf Gebäude bis 40 kW', 'ct/kWh', None, None, 'bnetza_eeg', G, teil=6.66, voll=10.24, klasse_bis_kw=40, **EEG_GUELT,
      hinweis='Werte vom Hauptfenster gegengeprüft. Geklärt (Hauptfenster, 27.10.2026): Der Satz gilt nicht für die ganze Anlage, sondern anteilig je Leistungsstufe nach § 23c EEG (Anteilige Zahlung), z. B. 12 kWp = 10/12 des Satzes bis 10 kW plus 2/12 des Satzes bis 40 kW.'),
    z('eeg_bis100', 'EEG-Vergütung Anlage auf Gebäude bis 100 kW', 'ct/kWh', None, None, 'bnetza_eeg', G, teil=5.44, voll=10.24, klasse_bis_kw=100, **EEG_GUELT),
    z('eeg_sonstige', 'EEG-Vergütung sonstige Anlagen bis 100 kW (Teil- und Volleinspeisung gleich)', 'ct/kWh', None, None, 'bnetza_eeg', G, teil=6.19, voll=6.19, klasse_bis_kw=100, **EEG_GUELT),
    z('eeg_anteilig', 'EEG-Vergütung wird anteilig je Leistungsstufe gezahlt (§ 23c EEG): Anteil der Anlage bis 10 kW zum Satz bis 10 kW, Anteil von 10 bis 40 kW zum Satz bis 40 kW, Anteil von 40 bis 100 kW zum Satz bis 100 kW', None, None, None, 'eeg23c', G,
      hinweis='Beispiel 12 kWp Teileinspeisung: 10/12 × 7,70 + 2/12 × 6,66 = 7,5267 ct/kWh im Mittel. Überschrift und Wortlaut vom Hauptfenster am 27.10.2026 gegengeprüft. Über 100 kW keine feste Vergütung (§ 21).', stufen_kw=[10, 40, 100]),
    z('eeg_vorher_bis10','EEG-Teileinspeisung bis 10 kW, Inbetriebnahme bis 31.07.2026', 'ct/kWh', None, None, 'ise_fakten', P, teil=7.78, gilt_bis='2026-07-31', hinweis='Fraunhofer ISE, Fassung 20.08.2026; Beginn des Zeitraums nicht belegt.'),
    z('eeg_degression', 'Vergütung sinkt halbjährlich um 1 Prozent; feste Vergütung 20 Jahre', '% je Halbjahr', 1, 1, 'vz_eeg', P, hinweis='Verbraucherzentrale-Seite Stand 01.08.2026, nicht im Rohtext nachgesehen.'),
    z('eeg_ab_2027', 'Nach 31.12.2026: Nachfolgeregelung in parlamentarischer Beratung; Referentenentwurf würde 20-jährige feste Vergütung streichen (nur noch bis zu drei Jahre)', None, None, None, 'vz_eeg', P, hinweis='Nicht beschlossen. Für Inbetriebnahme 2027 ist der Satz nicht gesichert.'),
]
# --- Bundesregeln, Schwellen (kW) ---
def rg(id, name, kw, para, was, q, s=G, fall='A,B', **kw2):
    return z(id, name, None, None, None, q, s, ab='2026-10-26', schwelle_kw=kw, paragraf=para, was=was, fall=fall, **kw2)

REGELN = [
    rg('r_ust_0', 'Umsatzsteuer 0 % auf Lieferung und Installation von PV und Speicher', 30, 'UStG § 12 Abs. 3', 'Als erfüllt (Privatwohnungen/Wohnungen) gilt, wenn die installierte Bruttoleistung laut Marktstammdatenregister nicht mehr als 30 kWp beträgt.', 'ustg12',
       hinweis='Vom Hauptfenster gegengeprüft. Ob eine GmbH als Betreiber begünstigt ist, folgt aus dem Text nicht ausdrücklich: Steuerberater (R079).'),
    rg('r_est_72', 'Einkommensteuerfreie Einnahmen aus PV', 30, 'EStG § 3 Nr. 72', '30 kWp (peak) je Wohn- oder Gewerbeeinheit, insgesamt höchstens 100 kWp je Steuerpflichtigem oder Mitunternehmerschaft; bei voller Steuerfreiheit kein Gewinn zu ermitteln.', 'estg3',
       gruppe_kwp=100, hinweis='Vom Hauptfenster gegengeprüft. Die Angabe 15 kWp je Einheit bei Mehrfamilienhäusern (steuerkurse.de) widerspricht dem Gesetzeswortlaut und ist abgelehnt. Zählweise der Einheiten bei Teileigentum: Steuerberater.'),
    rg('r_gewst_32', 'Gewerbesteuerfrei: Erzeugung und Vermarktung von Strom aus Gebäude-Solaranlage', 30, 'GewStG § 3 Nr. 32', 'Bis zu einer installierten Leistung von 30 kW; keine 100-kW-Grenze im Text.', 'gewstg3'),
    rg('r_gewst_9', 'GmbH: erweiterte Kürzung bleibt, wenn Einnahmen aus Strom und Ladestationen nicht über 20 % der Mieteinnahmen liegen', None, 'GewStG § 9 Nr. 1 Satz 3 Buchst. b, c', 'Strom nur an Mieter des Anlagenbetreibers; sonstige Mieterleistungen höchstens 5 %.', 'gewstg3', P, fall='B',
       hinweis='Zusammenfassung sprach von 10 % in einer Überschrift, Text nennt 20 %: am Originaltext gegenlesen. Steuerberater.'),
    rg('r_ust_19', 'Kleinunternehmer: Umsatzsteuerfrei bis Vorjahresumsatz 25.000 €, laufendes Jahr 100.000 €', None, 'UStG § 19 Abs. 1', 'Wechselwirkung mit dem 0-%-Satz ist Steuerberater-Thema.', 'ustg19'),
    rg('r_msbg_7kw', 'Intelligentes Messsystem mit Steuereinrichtung bei Erzeugungsanlagen', 7, 'MsbG § 29 Abs. 1 Nr. 2 Buchst. b', 'Bei mehr als 7 kW, soweit nötig und wirtschaftlich vertretbar (§ 30); mindestens moderne Messeinrichtung bis 31.12.2032; Ausnahme bei dauerhaft auf 0 % begrenzter Einspeisung.', 'msbg29',
       hinweis='Vom Hauptfenster gegengeprüft (mehr als 7 kW).'),
    rg('r_msbg_6000', 'Intelligentes Messsystem bei Letztverbrauch', None, 'MsbG § 29 Abs. 1 Nr. 1', 'Bei mehr als 6.000 kWh Jahresverbrauch.', 'msbg29'),
    rg('r_eeg9_unter25', 'Einspeisung auf 60 % der installierten Leistung begrenzen (bis intelligentes Messsystem und Ansteuerbarkeit geprüft)', 25, 'EEG § 9 Abs. 2', 'Anlagen unter 25 kW mit Einspeisevergütung oder Mieterstromzuschlag; Steckersolar bis 2 kW ausgenommen.', 'eeg9'),
    rg('r_eeg9_25_100', 'Einspeiseleistung ganz oder teilweise ferngesteuert reduzierbar', 25, 'EEG § 9 Abs. 2', '25 kW bis unter 100 kW; bei Einspeisevergütung alternativ 60-%-Begrenzung.', 'eeg9'),
    rg('r_eeg9_100', 'Netzbetreiber ruft Ist-Einspeisung ab und regelt fern', 100, 'EEG § 9 Abs. 2', 'Ab 100 kW.', 'eeg9'),
    rg('r_eeg21_100', 'Feste Einspeisevergütung nur für Anlagen bis 100 kW', 100, 'EEG § 21 Abs. 1 Nr. 1', 'Darüber Direktvermarktung.', 'eeg9', hinweis='Schwelle 100 kW gelesen; die Pflicht zur Direktvermarktung darüber (§ 10, § 21b) nur abgeleitet: prüfen vor Nutzung.'),
    rg('r_eeg10b_25', 'Fernabruf/Fernsteuerung durch den Direktvermarkter', 25, 'EEG § 10b', 'Bei mehr als 25 kW in der Direktvermarktung; Pflicht ab 01.01.2028 und ab Einbau des Smart-Meter-Gateways.', 'eeg9'),
    rg('r_mastr', 'Marktstammdatenregister-Registrierung innerhalb eines Monats nach Inbetriebnahme', None, 'MaStRV § 5', 'Für Steckersolar vereinfacht mit 5 Angaben (laut Verbraucherzentrale/BNetzA-Suchtreffer: prüfen).', 'mastrv5', hinweis='Frist geprüft; die 5 Angaben und der Wegfall der Netzbetreibermeldung seit 16.05.2024 nur Sekundärquelle.'),
    rg('r_mieterstrom_zuschlag', 'Mieterstromzuschlag, Staffeln nach Leistung', 10, 'EEG § 21 Abs. 3, § 48a', 'Staffeln bis 10 kW, bis 40 kW, bis 1 MW; mindestens 40 % der Gebäudefläche Wohnen (bei Nicht-Wohngebäuden); Speicherstrom ohne Zuschlag. Cent-Sätze nicht abgerufen.', 'eeg9', fall='B', staffel_kw=[10, 40, 1000], hinweis='Cent-Sätze: Lücke.'),
    rg('r_mieterstrom_vertrag', 'Mieterstromvertrag: Preis höchstens 90 % des Grundversorgungstarifs, Laufzeit höchstens 2 Jahre, nicht Teil des Mietvertrags', None, 'EnWG § 42a Abs. 2 bis 4', 'Vollversorgung auch ohne Mieterstrom vertraglich vorsehen; Wertersatz an Vermieter höchstens 75 % des Grundversorgungstarifs.', 'enwg', fall='B'),
    rg('r_gebaeudeversorgung', 'Gemeinschaftliche Gebäudeversorgung ohne Netzdurchleitung', None, 'EnWG § 42b', 'Viertelstündliche Messung, Gebäudestromnutzungsvertrag, Aufteilungsschlüssel; keine Pflicht zur Vollversorgung.', 'enwg', fall='B'),
    rg('r_enwg5', 'Anzeige bei der Bundesnetzagentur für Energielieferanten an Haushaltskunden', None, 'EnWG § 5', 'Ausgenommen Belieferung ausschließlich innerhalb einer Kundenanlage; Anwendung auf Vermieter bei Mieterstrom nicht geklärt.', 'enwg', P, fall='B', hinweis='Fachanwalt/Netzbetreiber fragen.'),
    rg('r_stromst_2mw', 'Stromsteuerbefreiung für Strom aus Solaranlagen bei Entnahme/Lieferung im räumlichen Zusammenhang', 2000, 'StromStG § 9 Abs. 1 Nr. 3, Abs. 4', 'Solaranlagen bis 2 MW; wer an Letztverbraucher liefert, braucht eine Erlaubnis (Abs. 4).', 'stromstg9', fall='B'),
]
STECKER = [
    rg('st_2000_800', 'Steckersolargerät: vereinfachter Anschluss', 2, 'EEG § 8 Abs. 5a, § 9 Abs. 1; MaStRV § 5', 'Bis 2.000 W Modulleistung und 800 VA Wechselrichter (Geräte hinter derselben Entnahmestelle zusammengerechnet); Registrierung nur im Marktstammdatenregister; Zähler muss unverzüglich getauscht werden.', 'bnetza_balkon',
       einheit_kw='2.000 W Module, 800 VA Wechselrichter'),
    rg('st_960', 'Schuko-Stecker bis 960 W Modulleistung zulässig (mit Sicherheitsfunktion), darüber spezieller Einspeise-Stecker', None, 'Produktnorm (kein Gesetz)', 'Norm nicht gelesen.', 'vz_steckersolar', P, fall='A'),
    rg('st_stecker_speicher', 'Speicher am Steckersolargerät: nicht von der vereinfachten Anmeldung abgedeckt, zusätzlich beim Netzbetreiber melden', None, 'keine Norm gefunden', 'Laut Gesetzeswortlaut fällt ein Speicher unter Speicherung elektrischer Energie nach § 14a EnWG.', 'vz_steckersolar', P, fall='A'),
    rg('st_mieter', 'Mieter kann Erlaubnis für ein Steckersolargerät verlangen', None, 'BGB § 554', 'Entfällt, wenn dem Vermieter auch unter Würdigung der Mieterinteressen nicht zumutbar; abweichende Vereinbarung zum Nachteil des Mieters unwirksam.', 'bgb554', fall='B'),
    rg('st_weg', 'Wohnungseigentümer können angemessene bauliche Veränderung für Steckersolargeräte verlangen', None, 'WEG § 20 Abs. 2', 'Durchführung im Rahmen ordnungsmäßiger Verwaltung beschlossen; Grenze: grundlegende Umgestaltung/unbillige Benachteiligung.', 'weg20', fall='A'),
]
NETZ14A = [
    z27('n14a_gesetz', 'Steuerbare Verbrauchseinrichtungen nach § 14a EnWG Abs. 3: Wärmepumpen, nicht öffentlich zugängliche Ladepunkte, Speicher (Kälteanlagen, Nachtspeicherheizungen)', None, None, None, 'enwg', G, hinweis='PV-Erzeugungsanlagen werden im Gesetz nicht genannt; Gesetzestext nennt weder Wallbox noch 4,2 kW.'),
    z27('n14a_4_2', 'Schwelle 4,2 kW: Anwendung bei Netzanschlussleistung über 4,2 kW; Netzbetreiber darf bei akuter Überlastung auf bis zu 4,2 kW drosseln, präventiv höchstens 2 Stunden täglich; Anschluss darf nicht verweigert werden', 'kW', 4.2, 4.2, 'bnetza_bk6', G, hinweis='Festlegung BK6-22-300 vom 27.11.2023, Anlage 1 (Ziffer 2.4.1 d und 4.5.1) selbst gelesen (Bericht 39); gültig für neue Anlagen seit 01.01.2024, Bestandsanlagen Übergangsfrist bis 31.12.2028. Vorher (Bericht 34) nur Zusammenfassung, Status prüfen vor Nutzung.'),
    z27('n14a_geltung', 'Steuerbare Verbrauchseinrichtungen: Wallbox, Wärmepumpe, Klimagerät, Stromspeicher (Einspeicherung); neue Anlagen seit 01.01.2024, Bestandsanlagen Übergangsfrist bis 31.12.2028', None, None, None, 'bnetza_vbe_start', G),
    z27('n14a_modul1', 'Netzentgelt Modul 1: pauschale Reduzierung', '€ je Jahr', 110, 190, 'bnetza_vbe', P, hinweis='Stand 2023, je Netzgebiet verschieden.'),
    z27('n14a_modul2', 'Netzentgelt Modul 2: Arbeitspreis auf 40 % mit separatem Zähler', '% des Arbeitspreises', 40, 40, 'bnetza_vbe', P),
    z27('n14a_modul3', 'Modul 3 (zeitvariabel) ab April 2025 nur zusammen mit Modul 1', None, None, None, 'bnetza_vbe', P, hinweis='Nur Zusammenfassung; Module vor Nutzung am Original prüfen.'),
    z27('brennstoff_vergleich', 'Brennstoffvergleich Gas, Öl, Pellets, Holz, Strom in ct/kWh', 'ct/kWh', None, None, 'bericht_luecke', L, hinweis='Kein Gas-, Öl- oder Pelletpreis in den Berichten. Vorhanden: Haushaltsstrom (strompreis_haushalt) und Brennholz je Raummeter mit Energiegehalt (daemmung_lueftung.js, Kamin).'),
]
def stz(id, name, einheit, von, bis, q, s, hinweis=None, ersetzt=None, **kw):
    return z27(id, name, einheit, von, bis, q, s, hinweis=hinweis, ersetzt=ersetzt, **kw)

SOLARTHERMIE = [
    stz('st_flaeche_ww', 'Kollektorfläche nur Warmwasser, je Person: Flachkollektor 1,5, Vakuumröhre 1', 'm² je Person', None, None, 'co2_st', G, 'Ratgeber, Artikel 28.04.2026; Dimensionierung durch Energieberatung.', '32 Nr. 15', flach=1.5, roehre=1),
    stz('st_flaeche_ww_heiz', 'Kollektorfläche Warmwasser plus Heizung, je Person: Flach 3, Röhre 2', 'm² je Person', None, None, 'co2_st', G, flach=3, roehre=2),
    stz('st_flaeche_efh', 'Kollektorfläche Einfamilienhaus: nur Warmwasser 3 bis 6; mit Heizung 9 bis 20', 'm²', None, None, 'vz_st', G, 'Günstig ab mindestens 3 Personen.', ww_von=3, ww_bis=6, heiz_von=9, heiz_bis=20),
    stz('st_deckung', 'Solarer Deckungsgrad Warmwasser: bis 60 (co2online), bis 70 (Verbraucherzentrale); Warmwasser plus Heizung 20 bis 30 % des Gesamtverbrauchs', '%', None, None, 'co2_st', G, 'Quellen weichen ab (co2online bis 60, Verbraucherzentrale bis 70).', '32 Nr. 16', co2online_bis=60, vz_bis=70),
    stz('st_speicher', 'Speicher: Warmwasser 250 bis 350 l; Warmwasser plus Heizung 500 bis 1.500 l', 'l', None, None, 'vz_st', G, 'Utopia nennt 50 l je m² Kollektor (nur Suchtreffer); aus Verbraucherzentrale-Werten folgen 58 bis 83 l je m².', '32 Nr. 18', ww_von=250, ww_bis=350, heiz_von=500, heiz_bis=1500),
    stz('st_ertrag', 'Ertrag Kollektor', 'kWh/(m²·a)', 300, 600, 'co2_st', G, 'Gut ausgelegter Flachkollektor 350 bis 500; Beispiel Berlin: 6 m² Flach Warmwasser = 300 kWh/(m²·a). Verbraucherzentrale: rund 400 nur Warmwasser, rund 300 mit Heizung.'),
    stz('st_preis_anlage', 'Installierter Preis Warmwasseranlage Einfamilienhaus (130 m², 4 Personen)', '€', 4780, 5000, 'co2_st', G, 'Beispiel 6 m² Flachkollektor inkl. Installation 4.780; Betriebskosten 100 €/a; vor Förderung.', '32 Nr. 20 (andere Größe)'),
    stz('st_preis_m2', 'Preis je m² Kollektor: Flach 300 bis 500, Vakuumröhre 600 bis 800', '€/m²', None, None, 'co2_st', G, flach_von=300, flach_bis=500, roehre_von=600, roehre_bis=800),
    stz('st_preis_altbau', 'Preis nachträglich im Altbau: nur Warmwasser 6.000 bis 10.000; Warmwasser plus Heizung 9.000 bis 17.000', '€', None, None, 'vz_st', G, 'Stand 2025 laut Seite.', ww_von=6000, ww_bis=10000, heiz_von=9000, heiz_bis=17000),
    stz('st_amortisation', 'Amortisation', 'Jahre', 15, 20, 'co2_st', P, 'Beispiele 19 und 22 Jahre; ob mit oder ohne Förderung gerechnet, ist Annahme.'),
    stz('st_beg_grund', 'BEG EM Solarthermie: Grundfördersatz', '% der förderfähigen Ausgaben', 30, 30, 'beg_em', G, 'Nr. 8.4.1; Richtlinie Fassung Juli 2026 in Kraft 21.07.2026. Bestätigt durch KfW-Merkblatt 458 (Stand 09/2026).'),
    stz('st_beg_klima', 'Klimageschwindigkeits-Bonus', 'Prozentpunkte', 16, 16, 'beg_em', G, '16 (bis 31.01.2027), 12 (02 bis 07/2027), 8 (08/2027 bis 01/2028), 4 (02 bis 07/2028), ab 01.08.2028 entfällt. Nur selbstnutzende Eigentümer für die selbst genutzte Wohneinheit, beim Austausch einer funktionstüchtigen Altheizung (mindestens 20 Jahre): für vermietete Immobilien nicht nutzbar.'),
    stz('st_beg_einkommen', 'Einkommens-Bonus: 40 % bis 30.000 € zvE, 30 % über 30.000 bis 40.000 €, 10 % über 40.000 bis 50.000 €', 'Prozentpunkte', None, None, 'beg_em', G, 'Nur Selbstnutzer; Kind unter 18 senkt anzusetzendes Einkommen um 10.000 €.',
        staffel=[{'bis_zve': 30000, 'pp': 40}, {'bis_zve': 40000, 'pp': 30}, {'bis_zve': 50000, 'pp': 10}]),
    stz('st_beg_obergrenze', 'Obergrenze Gesamtzuschuss: 80 % (zvE bis 30.000 €, mit Familienzuschlag bis 40.000 €), sonst 70 %', '%', None, None, 'beg_em', G, normal=70, einkommensschwach=80),
    stz('st_beg_hoechst', 'Förderfähige Höchstausgaben Heizungstechnik Wohngebäude: 1. Wohneinheit 28.000, 2. bis 6. je 15.000, ab 7. je 8.000', '€', None, None, 'beg_em', G, 'Erste Wohneinheit sinkt ab 01.02.2027 halbjährlich um 750 € (bis 22.000 € ab 01.08.2030).', we1=28000, we2_6=15000, ab_we7=8000),
    stz('st_foerder_stelle', 'Zuständige Stelle: KfW, Zuschuss 458 (Heizungsförderung für Privatpersonen); Antrag nach Liefer- und Leistungsvertrag, Bestätigung durch Energieeffizienz-Experten', None, None, None, 'kfw458', G, 'KfW-Merkblatt 458 (09/2026) bestätigt Grundförderung 30 %, Boni, Höchstbetrag 28.000 €; Solarthermie als förderfähig gelistet. Vermieter nur Grundförderung (Folgerung, prüfen).'),
    stz('st_vs_pv', 'Vergleich Solarthermie mit PV: Solarthermie hat höheren Energieertrag je m²; auf kleinen Dächern konkurrieren beide um die Fläche; Solarthermie hebt die Jahresarbeitszahl einer Wärmepumpe', None, None, None, 'vz_st', G, 'PV-Anlagen selbst nicht BEG-förderbar, PVT-Kollektoren teilweise (etwa 2.000 € je kWp).'),
    stz('st_ww_pv_kosten', 'Warmwasser aus PV-Strom: Kosten je kWh Wärme (Heizstab, Brauchwasser-Wärmepumpe)', 'ct/kWh', None, None, '42watt', L, 'Ratgeberwerte (Heizstab 6 bis 14, Brauchwasser-WP 1,7 bis 4,0 ct/kWh) nicht übernommen (R074, kein Fraunhofer-Dokument gefunden). Bei Bedarf selbst aus Strompreis und COP rechnen.', '32 Nr. 15 bis 19 (Ergänzung)'),
    stz('st_vergleich_ise', 'Fraunhofer-ISE-Haushaltsvergleich Solarthermie gegen PV plus Wärmepumpe', None, None, None, 'bericht_luecke', L, 'Nicht gefunden (37 S20).'),
]
# --- E-Auto, Wallbox, Kraftstoff (Bericht 39, Abruf 27.10.2026) ---
AUTO = [
    z27('ecar_adac', 'E-Auto Verbrauch ADAC-Tests ab 1/26 (12 Modelle, z. B. Tesla Model Y 16,4; Ioniq 6 17,0; Kia EV5 23,9), mit Ladeverlusten', 'kWh/100 km', 14.8, 23.9, 'adac_verbrauch', G, hinweis='ADAC rechnet die Ladeverluste in den Verbrauch ein: nicht noch einmal aufschlagen.'),
    z27('ecar_ecotest', 'E-Auto Verbrauch ADAC Ecotest, ganze Liste bis 12/25', 'kWh/100 km', 13.4, 29.7, 'adac_verbrauch', G, typisch_von=16, typisch_bis=21),
    z27('ecar_klasse_klein', 'Klassenmittel Kleinwagen (6 Modelle, eigene Mittelwertbildung aus der ADAC-Tabelle)', 'kWh/100 km', 16.7, 16.7, 'adac_verbrauch', P, rechnung=True, hinweis='ADAC bildet keine Klassen; Auswahl der Modelle ist eine eigene Zuordnung.'),
    z27('ecar_klasse_kompakt', 'Klassenmittel Kompaktklasse (6 Modelle, eigene Mittelwertbildung aus der ADAC-Tabelle)', 'kWh/100 km', 18.1, 18.1, 'adac_verbrauch', P, rechnung=True, hinweis='ADAC bildet keine Klassen; Auswahl der Modelle ist eine eigene Zuordnung.'),
    z27('ecar_klasse_suv', 'Klassenmittel SUV (8 Modelle, eigene Mittelwertbildung aus der ADAC-Tabelle)', 'kWh/100 km', 19.6, 19.6, 'adac_verbrauch', P, rechnung=True, hinweis='ADAC bildet keine Klassen; Auswahl der Modelle ist eine eigene Zuordnung.'),
    z27('ecar_bestand', 'Durchschnittsverbrauch Pkw mit Elektroantrieb im Bestand (Inländer 2024)', 'kWh/100 km', 22.1, 22.1, 'destatis_fahrleistung', G, hinweis='2023: 21,9. Ob Ladeverluste enthalten sind, nennt die Tabelle nicht.'),
    z27('ladeverlust_wallbox', 'Ladeverluste an der Wallbox (11/22 kW Wechselstrom; Renault R5 5,1; Model Y 6,1; CLA 6,9; ID.7 6,9; EX30 7,0)', '%', 5.1, 7.0, 'adac_ladeverlust', G, hinweis='Kleine Stichprobe (5 Fahrzeuge). Nur zur Information: in den ADAC-Verbräuchen schon enthalten.'),
    z27('ladeverlust_steckdose', 'Ladeverluste an der Haushaltssteckdose', '%', 12.7, 24.2, 'adac_ladeverlust', G),
    z27('km_bev', 'Jahresfahrleistung Pkw mit Elektroantrieb 2025', 'km je Jahr', 11312, 11312, 'kba_km', G),
    z27('km_benzin', 'Jahresfahrleistung Benzin-Pkw 2025', 'km je Jahr', 8406, 8406, 'kba_km', G),
    z27('km_alle_2024', 'Jahresfahrleistung alle Pkw 2024 (Diesel 16.984, Benzin 9.555)', 'km je Jahr', 12309, 12309, 'kba_km_2024', P, hinweis='Nur aus der Suchtreffer-Zusammenfassung des KBA-PDFs, PDF nicht selbst gelesen.'),
    z27('wallbox_geraet', 'Wallbox, Gerät (einfach 300 bis 600, Mittelklasse 600 bis 1.000, Premium 1.000 bis 2.000)', '€', 300, 2000, 'adac_wallbox', G, einfach=[300, 600], mittel=[600, 1000], premium=[1000, 2000], hinweis='Brutto oder netto nennt der ADAC nicht.'),
    z27('wallbox_install', 'Wallbox, Installation im Einfamilienhaus (gering 500 bis 800, mittel 800 bis 1.500, hoch 1.500 bis 3.000); Standfuß 400 bis 1.000 falls nötig', '€', 500, 3000, 'adac_wallbox', G, gering=[500, 800], mittel=[800, 1500], hoch=[1500, 3000]),
    z27('wallbox_gesamt', 'Wallbox 11 kW gesamt (Gerät plus Installation), grob', '€', 1200, 3500, 'adac_wallbox', G),
    z27('wallbox_anmeldung', 'Wallbox: Mitteilung an den Netzbetreiber vor Inbetriebnahme immer; vorherige Zustimmung zusätzlich, wenn die Summen-Bemessungsleistung der Anlage mehr als 12 kVA beträgt; Netzbetreiber äußert sich binnen 2 Monaten', 'kVA', 12, 12, 'nav19', G, hinweis='NAV § 19 Abs. 2, Überschrift gegengelesen; der Gesetzeswortlaut nennt 12 kVA je elektrischer Anlage (nicht je Gerät), der ADAC schreibt vereinfacht 11 kW. Anmeldung kostenlos, Smart Meter oder Steuerbox höchstens 50 € je Jahr.'),
    z27('wallbox_foerderung', 'Wallbox-Förderung Einfamilienhaus (selbst genutzt): keine bundesweite Förderung, KfW 442 ausgelaufen', None, None, None, '42watt_wallbox', P, hinweis='Sekundärquelle, KfW-Seite selbst nicht gelesen.'),
    z27('wallbox_mehrpartei', 'Bundesprogramm Laden im Mehrparteienhaus: 1.500 € je Stellplatz mit Wallbox; Antragsfrist bis 10.11.2026, solange Mittel reichen', '€ je Stellplatz', 1500, 1500, '42watt_wallbox', P, hinweis='Nur Sekundärquelle; selbstnutzende Einfamilienhaus-Eigentümer ausgeschlossen; für Vermieter relevant, Berechtigung privater Vermieter nicht geprüft.'),
    z27('preis_e10_2025', 'Superpreis E10, Jahresmittel 2025', '€/l', 1.688, 1.688, 'adac_kraftstoff', G),
    z27('preis_diesel_2025', 'Diesel, Jahresmittel 2025', '€/l', 1.611, 1.611, 'adac_kraftstoff', G),
    z27('preis_e10_sep2026', 'Superpreis E10, Monatsmittel September 2026', '€/l', 2.266, 2.266, 'adac_kraftstoff', G, hinweis='Zeitweise Energiesteuersenkung um 14 ct/l vom 01.10. bis 31.12.2026 (nur Zusammenfassung, amtliche Quelle nicht gelesen).'),
    z27('preis_diesel_sep2026', 'Diesel, Monatsmittel September 2026', '€/l', 2.386, 2.386, 'adac_kraftstoff', G),
    z27('preis_woche_2026_10', 'E10 2,110 und Diesel 2,255 €/l bundesweit in der Woche 21.10.2026', '€/l', 2.110, 2.255, 'adac_woche', P, e10=2.110, diesel=2.255, hinweis='Nur Suchtreffer-Zusammenfassung zur ADAC-Wochenauswertung.'),
    z27('verbrauch_benzin', 'Verbrauch Vergleichs-Verbrenner Benzin (Bestandsmittel 2023 und 2024, enthält Biokraftstoff)', 'l/100 km', 7.8, 7.8, 'destatis_fahrleistung', G, hinweis='Bestandsmittel, nicht der Wert eines bestimmten Modells.'),
    z27('verbrauch_diesel', 'Verbrauch Vergleichs-Verbrenner Diesel (Bestandsmittel 2023 und 2024)', 'l/100 km', 7.3, 7.3, 'destatis_fahrleistung', G, hinweis='Bestandsmittel, nicht der Wert eines bestimmten Modells.'),
]
BEG = [
    z27('beg_em_datum', 'BEG Einzelmaßnahmen: Richtlinie Vom 17.08.2026 (Bundesanzeiger BAnz AT 27.08.2026 B1), in Kraft mit Wirkung vom 21.07.2026, gilt bis 31.12.2030; Anträge vor Inkrafttreten nach der Richtlinie vom 21.12.2023', 'Datum', None, None, 'beg_em', G, gilt_ab='2026-07-21', gilt_bis='2030-12-31', datum_richtlinie='2026-08-17', hinweis='Die BMWE-Fassung Vom 17. Juli 2026 trägt denselben Inhalt und dasselbe Inkrafttreten (Bundesanzeiger-Angabe dort noch Platzhalter). Maßgeblich ist die Bundesanzeiger-Fassung.'),
    z27('beg_isfp', 'iSFP-Bonus 5 Prozentpunkte nur auf den Teil der förderfähigen Ausgaben über 30.000 € (1. Wohneinheit) und nur bei mindestens 30.000 € förderfähigen Ausgaben brutto; mit iSFP-Bonus steigt die Höchstgrenze für Hülle und Anlagentechnik auf 60.000 € (1. WE), 30.000 € (2. bis 6.), 15.000 € (ab 7.); nicht für Wärmeerzeuger (Nr. 5.3); ob Solarthermie darunter fällt, steht im Bericht nicht und ist in der Richtlinie nachzulesen', 'Prozentpunkte', 5, 5, 'beg_em', G, hoechst_ohne=30000, hoechst_mit=60000, mindest_invest=30000, frist_jahre=15, hinweis='Nr. 8.4.2 und 8.3.1 a der Bundesanzeiger-Fassung (Bericht 39). Wärmeerzeuger haben eine eigene Höchstgrenze von 28.000 € (1. WE), ab 01.02.2027 halbjährlich 750 € weniger.'),
]
WIDERSPRUECHE = [
    {'id': 'w_en_01', 'text': 'PV-Ertrag Süd: PVGIS Bremen 988,0 (30 Grad) bzw. 995,8 (35 Grad) gegen pvgis.js 983,44 (andere Datenversion), co2online 824 (Standort unklar), Verbraucherzentrale-Planungswert 900. Für Bremen PVGIS, 900 als vorsichtige Variante.', 'betrifft': ['ertrag_bremen_sued30', 'ertrag_co2_sued35', 'ertrag_vz_plan']},
    {'id': 'w_en_02', 'text': 'Ost-/West-Abschlag: PVGIS Bremen Ost 30 Grad 18,2 % (808,6 gegen 988,0), Ost-West-Mischung 19,2 %, co2online 18 bis 24 %, Verbraucherzentrale Niedersachsen 10 bis 20 %.', 'betrifft': ['ertrag_ost_west_abschlag_co2', 'ertrag_ost_west_abschlag_vz']},
    {'id': 'w_en_03', 'text': 'Flächenbedarf PV: 5 bis 7 m² je kWp (Verbraucherzentrale), 5 bis 6,4 (co2online), rund 8 (42watt).', 'betrifft': ['pv_flaeche_vz', 'pv_flaeche_co2', 'pv_flaeche_ratgeber']},
    {'id': 'w_en_04', 'text': 'Haushaltsstrompreis: BDEW 08/2026 37,0 ct/kWh, BDEW-Fassung Januar 37,2, Destatis 2. Halbjahr 2025 40,55 (Original nicht gelesen).', 'betrifft': ['strompreis_haushalt', 'strompreis_destatis']},
    {'id': 'w_en_05', 'text': '§ 3 Nr. 72 EStG: steuerkurse.de nennt 15 kWp je Einheit bei Mehrfamilienhäusern, der Gesetzeswortlaut 30 kWp je Wohn- oder Gewerbeeinheit; Gesetz hat Vorrang, Zählweise Steuerberater.', 'betrifft': ['r_est_72']},
    {'id': 'w_en_06', 'text': 'BEG EM: Bericht 31 (Sekundärquelle Schwäbisch Hall) nannte Zuschüsse pauschal 10 Prozentpunkte niedriger ab 21.07.2026; Bericht 37 widerlegt das mit KfW-Merkblatt (Stand 09/2026). Bericht 37 hat Vorrang.', 'betrifft': ['st_beg_grund']},
    {'id': 'w_en_07', 'text': 'Datum der BEG-EM-Richtlinie, GEKLÄRT (Bericht 39, 27.10.2026): maßgeblich ist die Bundesanzeiger-Fassung Vom 17.08.2026 (BAnz AT 27.08.2026 B1), in Kraft mit Wirkung vom 21.07.2026. Die früher gelesene BMWE-Fassung Vom 17. Juli 2026 ist die Vorfassung mit gleichem Inhalt und gleichem Inkrafttreten. Fördersätze stimmen überein.', 'betrifft': ['st_beg_grund', 'beg_em_datum', 'sanierung.js:foerderung']},
    {'id': 'w_en_08', 'text': '§ 14a EnWG: Das Gesetz nennt die 4,2-kW-Schwelle nicht; sie steht in der BNetzA-Festlegung BK6-22-300 (Anlage 1 jetzt selbst gelesen, Bericht 39). Modul 2 (60 % Reduzierung, nicht mit Modul 1 kombinierbar) und das genaue Datum der Entscheidung BK8-22/010-A bleiben Sekundärquelle.', 'betrifft': ['n14a_gesetz', 'n14a_4_2', 'n14a_modul2']},
    {'id': 'w_en_10', 'text': 'Wallbox-Anmeldung: ADAC schreibt vereinfacht, bis 11 kW genüge die Anmeldung, darüber brauche man eine Genehmigung. NAV § 19 Abs. 2 nennt 12 kVA Summen-Bemessungsleistung je elektrischer Anlage (nicht je Gerät). Das Gesetz hat Vorrang.', 'betrifft': ['wallbox_anmeldung']},
    {'id': 'w_en_11', 'text': 'E-Auto-Verbrauch: ADAC-Werte (14,8 bis 23,9) enthalten die Ladeverluste, Destatis-Bestandsmittel 22,1 nennt dazu nichts. Wallbox-Ladeverlust 5,1 bis 7,0 % deshalb nicht noch einmal aufschlagen.', 'betrifft': ['ecar_adac', 'ecar_bestand', 'ladeverlust_wallbox']},
    {'id': 'w_en_09', 'text': 'Speichergröße je m² Kollektor: Utopia 50 l (Suchtreffer) gegen 58 bis 83 l aus Verbraucherzentrale-Werten.', 'betrifft': ['st_speicher']},
]

OBJ = {
    'meta': {
        'titel': 'Energie: Photovoltaik, EEG, Bundesregeln, Netz, Solarthermie',
        'abruf': '2026-10-26 (PV, EEG, Regeln); 2026-10-27 (Solarthermie, Netz, Ertragsvergleiche)',
        'hinweis_land': 'Nur Bundesregeln. Landesregeln zu Solarpflicht, Verfahrensfreiheit und Abständen stehen in bauregeln.js.',
        'hinweis_eeg': 'Gilt nur für Inbetriebnahme 01.08. bis 31.12.2026 (EEG 2023, bis 31.12.2026 anwendbar). Danach gibt es keine beschlossene Regelung.',
        'hinweis_pv_preise': PREIS_NB,
    },
    'quellen': QUELLEN,
    'pv_preise': PV_PREISE,
    'speicher': SPEICHER,
    'pv_technik': TECHNIK,
    'pv_ertrag_bremen': ERTRAG,
    'eigenverbrauch': EIGEN,
    'strompreis': STROMPREIS,
    'eeg': EEG,
    'bundesregeln': REGELN,
    'steckersolar': STECKER,
    'netz_und_luecken': NETZ14A,
    'auto': AUTO,
    'beg': BEG,
    'solarthermie': SOLARTHERMIE,
    'widersprueche': WIDERSPRUECHE,
}

if __name__ == '__main__':
    print(schreibe('energie', 'Energie: PV-Preise, Speicher, Ertrag, EEG, Bundesregeln, 14a, Solarthermie. Quellen: recherche/22, 23, 29, 34, 37, 39 (Abruf 26./27.10.2026). Erzeugt von erzeuger/daten_d_energie.py.', OBJ))
