# -*- coding: utf-8 -*-
"""Erzeugt daten/grundstueck.js (window.DATEN.grundstueck) fuer die Karte "Grundstueck" (Welle E, Teil 1).
Quellen: recherche/34_grundstueck_autark.md (Werte-Tabelle mit Ids, Teilergebnis 27.10.2026) und recherche/39_eauto_wallbox_kraftstoff.md (Nr. 12 bis 18).
Uebernommen wird nur, was im Bericht mit Id steht (Feld ref = "34:P01" bzw. "39:12"). Werte, die der Bericht ausdruecklich "nicht uebernehmen" nennt (K04, K05),
und alles ohne Quelle (Sauna-, Gartenhaus-, Garage-, Gewaechshaus-, Fischteich-Preise) werden als Luecke gefuehrt. Die "Bauschritte" des Berichts sind laut Bericht nicht belegt und fehlen hier.
Die Genehmigungs-Zahlen je Land stehen NICHT hier, sondern in daten/verfahrensfrei.js (eine Quelle, eine Ampel).
Aufruf: python -I -X utf8 erzeuger/daten_e_grundstueck.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding='utf-8')
from daten_d_common import maker, schreibe, G, P, L

z = maker('2026-10-27')

QUELLEN = {
    'bayboa57': {'titel': 'BayBO Art. 57 (gesetze-bayern.de)', 'url': 'https://www.gesetze-bayern.de/Content/Document/BayBO-57'},
    'whg46': {'titel': 'WHG § 46 Erlaubnisfreie Benutzungen des Grundwassers', 'url': 'https://www.gesetze-im-internet.de/whg_2009/__46.html'},
    'whg49': {'titel': 'WHG § 49 Erdaufschlüsse (Wortlaut nur zusammengefasst gelesen)', 'url': 'https://www.gesetze-im-internet.de/whg_2009/__49.html'},
    'enwg14a': {'titel': 'EnWG § 14a Netzorientierte Steuerung', 'url': 'https://www.gesetze-im-internet.de/enwg_2005/__14a.html'},
    'bnetza_vbe': {'titel': 'Bundesnetzagentur, Steuerbare Verbrauchseinrichtungen (Zusammenfassung des Abrufwerkzeugs)', 'url': 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/SteuerbareVBE/artikel.html'},
    'bnetza_bk6': {'titel': 'Bundesnetzagentur, BK6-22-300, Beschluss 27.11.2023, Anlage 1', 'url': 'https://www.bundesnetzagentur.de/DE/Beschlusskammern/1_GZ/BK6-GZ/2022/BK6-22-300/Beschluss/BK6-22-300_Beschluss_Anlage1.pdf'},
    'bnetza_integration': {'titel': 'Bundesnetzagentur, Integration von steuerbaren Verbrauchseinrichtungen', 'url': 'https://www.bundesnetzagentur.de/DE/Vportal/Energie/SteuerbareVBE/start.html'},
    'viehverkv26': {'titel': 'ViehVerkV § 26 Anzeige und Registrierung', 'url': 'https://www.gesetze-im-internet.de/viehverkv_2007/__26.html'},
    'bienseuchv1a': {'titel': 'BienSeuchV § 1a (nichtamtliche Wiedergabe)', 'url': 'https://www.gesetze-im-internet.de/bienseuchv/__1a.html'},
    'nav19': {'titel': 'NAV § 19 Betrieb von elektrischen Anlagen, Verbrauchsgeräten und Ladeeinrichtungen', 'url': 'https://www.gesetze-im-internet.de/nav/__19.html'},
    'adac_wallbox': {'titel': 'ADAC, Wallbox: Das kosten private Ladestationen plus Installation 2026 (29.06.2026)', 'url': 'https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/laden/wallbox-kosten/'},
    'pool_ratgeber': {'titel': 'aroundhome.de und hausjournal.net (Ratgeber, Suchtreffer)', 'url': 'https://www.aroundhome.de/'},
    'energiemarie': {'titel': 'energiemarie.de, Windkraft (Vergleichsseite)', 'url': 'https://energiemarie.de/strompreisvergleich/oekostrom/windkraft'},
    'landtag_rlp': {'titel': 'Landtag Rheinland-Pfalz, Vorlage 947-V-18 nach Verbraucherzentrale (Suchtreffer)', 'url': 'https://dokumente.landtag.rlp.de/landtag/vorlagen/947-V-18.pdf'},
    'reduco': {'titel': 'reduco.ai nach Verbraucherzentrale RLP, Wärmepumpe Kosten (Juli 2026)', 'url': 'https://reduco.ai/blog/waermepumpe-kosten-foerderung'},
    'fachzentrum_bienen': {'titel': 'Fachzentrum Bienen Mayen laut Presse (deutsche-wirtschafts-nachrichten.de, Suchtreffer)', 'url': 'https://www.deutsche-wirtschafts-nachrichten.de/'},
    'hornbach': {'titel': 'Ratgeberseiten (hornbach.de u. a.) und Hobby-Verband (Suchtreffer)', 'url': 'https://www.hornbach.de/'},
    'bdew': {'titel': 'BDEW, Wasserfakten im Überblick (PDF nicht lesbar, Wert aus Suchtreffer)', 'url': 'https://www.bdew.de/media/documents/Wasserfakten_im_Ueberblick_April_o_MW_05052025_1.pdf'},
    'utopia': {'titel': 'utopia.de, Stromspiegel 2025', 'url': 'https://utopia.de/ratgeber/stromspiegel-2025-ist-dein-stromverbrauch-normal_813088/'},
    'sanier': {'titel': 'sanier.de und gartenjournal.net, Anbauflächen (Ratgeber)', 'url': 'https://www.sanier.de/garten/nutzgarten/welche-anbauflaechen-sind-fuer-welche-ertraege-noetig'},
    'luecke': {'titel': 'Keine Quelle gefunden (Bericht 34, offene Punkte)', 'url': 'recherche/34_grundstueck_autark.md'},
}

# id, Name; die Reihenfolge ist die der Bildleiste
BAUSTEINE = [
    {'id': 'gartenhaus', 'name': 'Gartenhaus'},
    {'id': 'garage_carport', 'name': 'Garage / Carport'},
    {'id': 'terrassendach', 'name': 'Terrassendach'},
    {'id': 'sauna', 'name': 'Sauna'},
    {'id': 'pool', 'name': 'Pool'},
    {'id': 'gewaechshaus', 'name': 'Gewächshaus'},
    {'id': 'brunnen', 'name': 'Brunnen'},
    {'id': 'regentank', 'name': 'Regenwassertank'},
    {'id': 'kleinwind', 'name': 'Kleinwindanlage'},
    {'id': 'waermepumpe', 'name': 'Wärmepumpe (außen)'},
    {'id': 'wallbox', 'name': 'Wallbox'},
    {'id': 'huehnerstall', 'name': 'Hühnerstall'},
    {'id': 'bienenstock', 'name': 'Bienenstock'},
    {'id': 'fischteich', 'name': 'Fischteich'},
]

LUECKE_34 = 'Bericht 34, offener Punkt 7: für diesen Baustein keine Quelle gefunden'

KOSTEN = [
    z('k_pool_beton', 'Betonbecken', '€', 25000, 55000, 'pool_ratgeber', P, baustein='pool', ref='34:P01', hinweis='Ratgeber, Suchtreffer; Beispiel im Bericht: 6 × 3 m Beton mit Liner 28.000 €'),
    z('k_pool_schalstein', 'Schalsteinpool', '€', 15000, 35000, 'pool_ratgeber', P, baustein='pool', ref='34:P01', hinweis='Ratgeber, Suchtreffer'),
    z('k_pool_betrieb', 'Betrieb im Jahr (Wasser, Strom, Chemie, Pflege)', '€/Jahr', 300, 1200, 'pool_ratgeber', P, baustein='pool', ref='34:P02', hinweis='Ratgeber, Suchtreffer; Wasserpreis im Bericht aus 2019, veraltet'),
    z('k_pool_beheizt', 'Betrieb im Jahr, beheizt', '€/Jahr', 1500, 2500, 'pool_ratgeber', P, baustein='pool', ref='34:P02', hinweis='Ratgeber, Suchtreffer'),
    z('k_kleinwind', 'Anlage', '€/kW', 3000, 9000, 'energiemarie', P, baustein='kleinwind', ref='34:K02', hinweis='Vergleichsseite, unsicher'),
    z('k_wp', 'Luft-Wasser-Wärmepumpe, brutto, Juli 2026', '€', 21099, 54168, 'reduco', P, baustein='waermepumpe', ref='34:K03', hinweis='Mittel 36.397 €; Verbraucherzentrale RLP über reduco.ai, Suchtreffer; Förderung steht im Bericht 16'),
    z('k_wallbox_gesamt', 'Wallbox 11 kW, Gerät und Installation', '€', 1200, 3500, 'adac_wallbox', G, baustein='wallbox', ref='39:14', hinweis='ADAC: „grob 1.200 bis 3.500“; brutto oder netto nicht genannt'),
    z('k_wallbox_geraet', 'Gerät (einfach 300 bis 600, Mittelklasse 600 bis 1.000, Premium 1.000 bis 2.000)', '€', 300, 2000, 'adac_wallbox', G, baustein='wallbox', ref='39:12', hinweis='brutto oder netto nicht genannt'),
    z('k_wallbox_install', 'Installation im Einfamilienhaus (gering 500 bis 800, mittel 800 bis 1.500, hoch ab 1.500)', '€', 500, 3000, 'adac_wallbox', G, baustein='wallbox', ref='39:13', hinweis='Standfuß 400 bis 1.000 € falls nötig'),
    z('k_wallbox_anmeldung', 'Anmeldung beim Netzbetreiber', '€', 0, 0, 'adac_wallbox', G, baustein='wallbox', ref='39:15', hinweis='kostenlos; Smart Meter oder Steuerbox höchstens 50 € im Jahr je Gerät'),
    # Lücken: ehrlich "Keine Angabe" mit Grund
    z('k_luecke_gartenhaus', 'Preis Gartenhaus', q='luecke', s=L, baustein='gartenhaus', luecke_grund=LUECKE_34),
    z('k_luecke_garage', 'Preis Garage oder Carport', q='luecke', s=L, baustein='garage_carport', luecke_grund=LUECKE_34),
    z('k_luecke_terrasse', 'Preis Terrassendach', q='luecke', s=L, baustein='terrassendach', luecke_grund='Bericht 34 nennt keinen Preis; Wintergarten-Preise stehen in der Karte Anbau'),
    z('k_luecke_sauna', 'Preis Sauna', q='luecke', s=L, baustein='sauna', luecke_grund=LUECKE_34),
    z('k_luecke_gewaechshaus', 'Preis Gewächshaus', q='luecke', s=L, baustein='gewaechshaus', luecke_grund=LUECKE_34),
    z('k_luecke_brunnen', 'Preis Brunnenbohrung', q='luecke', s=L, baustein='brunnen', ref='34:K05', luecke_grund='Der Bericht nennt 5.000 bis 15.000 € nur aus einem Forum und schreibt „nicht übernehmen“; deshalb keine Zahl'),
    z('k_luecke_regentank', 'Preis Regenwassertank', q='luecke', s=L, baustein='regentank', luecke_grund='Bericht 34 nennt keinen Preis; Regenwasser-Zahlen folgen mit der Wasser-Karte (Teil 2)'),
    z('k_luecke_huhn', 'Preis Hühnerstall', q='luecke', s=L, baustein='huehnerstall', luecke_grund='Bericht 34 nennt keinen Preis'),
    z('k_luecke_bienen', 'Preis Bienenvolk und Zubehör', q='luecke', s=L, baustein='bienenstock', luecke_grund='Bericht 34: „Volkskosten: nicht gefunden“'),
    z('k_luecke_fisch', 'Preis Fischteich', q='luecke', s=L, baustein='fischteich', luecke_grund=LUECKE_34),
]

PFLICHTEN = [
    z('p_brunnen_46', 'Entnahme für den Haushalt ist erlaubnisfrei, Landesrecht kann Anzeige oder Erlaubnis verlangen', q='whg46', s=G, baustein='brunnen', ref='34:W01', hinweis='WHG § 46 Abs. 1 Nr. 1 und Abs. 3; bei der Unteren Wasserbehörde nachfragen'),
    z('p_brunnen_49', 'Arbeiten am Grundwasser einen Monat vor Beginn anzeigen', q='whg49', s=P, baustein='brunnen', ref='34:W02', hinweis='WHG § 49 Abs. 1 (Erdaufschlüsse); Wortlaut nur als Zusammenfassung gelesen'),
    z('p_huhn_26', 'Hühnerhaltung vor Beginn bei der zuständigen Behörde anzeigen (Name, Anschrift, Tierzahl, Nutzungsart, Standort)', q='viehverkv26', s=G, baustein='huehnerstall', ref='34:T01', hinweis='ViehVerkV § 26 Abs. 1'),
    z('p_bienen_1a', 'Bienenhaltung spätestens bei Beginn anzeigen (Zahl der Völker, Standort), zwölfstellige Registernummer', q='bienseuchv1a', s=G, baustein='bienenstock', ref='34:T02', hinweis='BienSeuchV § 1a; die Wiedergabe auf gesetze-im-internet.de ist nichtamtlich'),
    z('p_wallbox_nav', 'Ladeeinrichtung vor der Inbetriebnahme dem Netzbetreiber melden; über 12 kVA Summenleistung zusätzlich vorher zustimmen lassen', q='nav19', s=G, baustein='wallbox', ref='39:16', hinweis='NAV § 19 Abs. 2; der Netzbetreiber äußert sich binnen 2 Monaten'),
    z('p_wallbox_14a', 'Nicht öffentliche Ladepunkte sind steuerbare Verbrauchseinrichtungen: der Netzbetreiber darf bei Überlast auf 4,2 kW drosseln (neue Anlagen seit 01.01.2024)', q='enwg14a', s=G, baustein='wallbox', ref='34:E01', hinweis='EnWG § 14a Abs. 3; 4,2 kW aus BNetzA BK6-22-300 (39:17)'),
    z('p_wp_14a', 'Wärmepumpen sind steuerbare Verbrauchseinrichtungen (§ 14a): Anmeldung und Steuerbarkeit beim Netzbetreiber klären', q='enwg14a', s=G, baustein='waermepumpe', ref='34:E01', hinweis='EnWG § 14a Abs. 3'),
    z('p_wp_laerm', 'Schallschutz und Abstand zum Nachbarn (TA Lärm)', q='luecke', s=L, baustein='waermepumpe', ref='34:Offen3', luecke_grund='Bericht 34, offener Punkt 3: TA Lärm Nr. 6.1 und Mindestabstände nicht gelesen, nicht aus dem Gedächtnis eingesetzt'),
    z('p_teich_wasser', 'Wasserrecht für Teich, Zu- und Ablauf', q='luecke', s=L, baustein='fischteich', ref='34:Fischteich', luecke_grund='Bericht 34: Wasserrecht für künstlich angelegte Teiche nicht recherchiert'),
]

WERTE = [
    z('w_wind_ertrag', 'Jahresertrag einer Kleinwindanlage mit 1 m Rotor (älterer Wert; die Verbraucherzentrale hält Kleinwind im Privathaushalt für unwirtschaftlich)', 'kWh/Jahr', 96, 96, 'landtag_rlp', P, baustein='kleinwind', ref='34:K01'),
    z('w_honig', 'Honig je Bienenvolk (2023 bis 2022)', 'kg/Jahr', 36.7, 37.2, 'fachzentrum_bienen', P, baustein='bienenstock', ref='34:T03', hinweis='laut Presse; Zehnjahresschnitt des Imkerbundes knapp 34 kg, schlechte Jahre 18 kg (ohne Id im Bericht, nur Text)'),
    z('w_huhn_auslauf', 'Auslauf je Huhn (Verband mindestens 4, Ratgeber 10)', 'm²/Huhn', 4, 10, 'hornbach', P, baustein='huehnerstall', ref='34:T04', hinweis='Die beiden Angaben widersprechen sich, siehe Widersprüche'),
    z('a_wasser', 'Wasserverbrauch je Person und Tag (2024)', 'l/Tag', 122, 122, 'bdew', P, baustein='autarkie', ref='34:A01', hinweis='für Teil 2 (Autarkie-Balken)'),
    z('a_strom', 'Stromverbrauch je Person und Jahr (Durchschnitt)', 'kWh/Jahr', 1240, 1240, 'utopia', P, baustein='autarkie', ref='34:A02', hinweis='für Teil 2 (Autarkie-Balken)'),
    z('a_gemuese', 'Gemüsefläche je Person (Großteil des Gemüses)', 'm²/Person', 20, 20, 'sanier', P, baustein='autarkie', ref='34:A03', hinweis='Ratgeber; mit Kartoffeln und Lagergemüse 50 bis 80, nahezu Vollversorgung mit Obst 150 bis 160; für Teil 2'),
    z('a_kartoffeln', 'Fläche je Person mit Kartoffeln und Lagergemüse', 'm²/Person', 50, 80, 'sanier', P, baustein='autarkie', ref='34:A03', hinweis='Ratgeber; für Teil 2'),
    z('a_voll', 'Fläche je Person für nahezu Vollversorgung', 'm²/Person', 150, 160, 'sanier', P, baustein='autarkie', ref='34:A03', hinweis='Ratgeber; für Teil 2'),
]

WIDERSPRUECHE = [
    {'id': 'wi_auslauf', 'thema': 'Auslauf je Huhn', 'inhalt': 'Ratgeber nennen 10 m² je Huhn, ein Hobby-Verband mindestens 4 m² (34:T04).',
     'entscheidung': 'Die Karte zeigt die Spanne 4 bis 10 m² mit Hinweis, keine der beiden Zahlen allein; beide unsicher (prüfen vor Nutzung).'},
    {'id': 'wi_gewaechshaus', 'thema': 'Gewächshaus im Privatgarten', 'inhalt': 'BayBO Art. 57 Abs. 1 Nr. 1d nennt Gewächshäuser nur für Betriebe (34:G10); ob ein Gewächshaus im Privatgarten als „Gebäude“ unter Nr. 1a fällt, ist laut Bericht nicht geprüft.',
     'entscheidung': 'Zeilen „nur für Betriebe“ färben die Ampel nicht, sie stehen grau mit dem Hinweis „für Privatgärten bei der Bauaufsicht fragen“.'},
    {'id': 'wi_forum', 'thema': 'Preise aus Foren', 'inhalt': 'Brunnenbohrung 5.000 bis 15.000 € (34:K05) und Kleinkläranlage 8.000 bis 15.000 € (34:K04) stehen nur in einem Forum; der Bericht schreibt „nicht übernehmen“.',
     'entscheidung': 'Nicht übernommen. Die Karte zeigt „Keine Angabe“ mit Grund (R074).'},
    {'id': 'wi_wp_preis', 'thema': 'Wärmepumpe: Preisspanne', 'inhalt': 'Der Bericht nennt neben 21.099 bis 54.168 € (34:K03) eine weitere, breit streuende Spanne von 13.000 bis 25.000 € (ohne Id).',
     'entscheidung': 'Nur die Spanne mit Id wird gezeigt; die zweite Zahl ist ohne Id und wird nicht übernommen.'},
]

HINWEISE = [
    'Diese Preise und Pflichten stammen aus Bericht 34 (Teilergebnis, 27.10.2026) und Bericht 39. Viele Preise sind Ratgeber-Angaben und tragen den Status „prüfen vor Nutzung“.',
    'Ob ein Baustein einen Bauantrag braucht, kommt aus daten/verfahrensfrei.js (Bundesland aus dem Plan). Hier stehen nur Preise, Pflichten, die nicht vom Bauantrag abhängen, und Kennzahlen.',
    'Die Bauschritte aus Bericht 34 sind dort als nicht belegt bezeichnet und fehlen hier ausdrücklich.',
]

OBJ = {
    'stand': '2026-10-27',
    'hinweise': HINWEISE,
    'quellen': QUELLEN,
    'bausteine': BAUSTEINE,
    'kosten': KOSTEN,
    'pflichten': PFLICHTEN,
    'werte': WERTE,
    'widersprueche': WIDERSPRUECHE,
}

KOPF = ('Grundstück: Preise, Pflichten und Kennzahlen je Außen-Baustein (Gartenhaus, Pool, Brunnen, Wallbox, Hühnerstall und weitere). Quellen: recherche/34_grundstueck_autark.md (Teilergebnis) '
        'und recherche/39_eauto_wallbox_kraftstoff.md, Abruf 27.10.2026. Nur Werte mit Id aus den Berichten (Feld ref); Lücken stehen als Status „Lücke“. Erzeugt von erzeuger/daten_e_grundstueck.py (nicht von Hand ändern).')

if __name__ == '__main__':
    pfad, groesse = schreibe('grundstueck', KOPF, OBJ)
    print('grundstueck', groesse, 'Bytes', pfad)
