# -*- coding: utf-8 -*-
"""Erzeugt daten/formen.js aus recherche/29_hausform_dach.md (Hausformen, Dachformen)."""
from daten_d_common import maker, schreibe, G, P, L, E

z = maker('2026-10-27')

QUELLEN = {
    'baunetz_form': {'titel': 'Baunetzwissen, Gebäudeform', 'url': 'https://www.baunetzwissen.de/nachhaltig-bauen/fachwissen/planungsgrundlagen/gebaeudeform-662875'},
    'tuebingen': {'titel': 'Stadt Tübingen / ebök, Das energieeffiziente Haus (04.12.2018, PHPP, Folien; Auswertung nach EnEV 2016)', 'url': 'https://www.tuebingen.de/Dateien/musterberechnung_energieeffizientes_bauen.pdf'},
    'woflv2': {'titel': 'WoFlV § 2 Zur Wohnfläche gehörende Grundflächen', 'url': 'https://www.gesetze-im-internet.de/woflv/__2.html'},
    'woflv4': {'titel': 'WoFlV § 4 Anrechnung der Grundflächen (Abruf lieferte nur Zusammenfassung)', 'url': 'https://www.gesetze-im-internet.de/woflv/__4.html'},
    'baugb9': {'titel': 'BauGB § 9 Inhalt des Bebauungsplans (Zusammenfassung)', 'url': 'https://www.gesetze-im-internet.de/bbaug/__9.html'},
    'baugb31': {'titel': 'BauGB § 31 Ausnahmen und Befreiungen', 'url': 'https://www.gesetze-im-internet.de/bbaug/__31.html'},
    'wohnen_fin': {'titel': 'Wohnen und Finanzieren, Dachformen (Stand 13.01.2026; werblich, starpool)', 'url': 'https://wohnen-und-finanzieren.de/blog/dachformen'},
    'aroundhome': {'titel': 'Aroundhome, Dachformen (Vermittler, werblich)', 'url': 'https://www.aroundhome.de/dachdecker/dachformen/'},
    'fertighaus': {'titel': 'fertighaus.de, Dachformen (Vermittler, werblich)', 'url': 'https://www.fertighaus.de/dachformen/'},
    'baunetz_flach': {'titel': 'Baunetzwissen, Langzeittauglichkeit von Flachdächern', 'url': 'https://www.baunetzwissen.de/flachdach/fachwissen/einfuehrung/langzeittauglichkeit-von-flachdaechern-155927'},
    'co2_ausrichtung': {'titel': 'co2online, Optimale Ausrichtung für PV', 'url': 'https://www.co2online.de/modernisieren-und-bauen/photovoltaik/dach-ausrichtung-neigung-alternativen/'},
    'vz_nds': {'titel': 'Verbraucherzentrale Niedersachsen, Photovoltaik für Privathaushalte (2023)', 'url': 'https://www.verbraucherzentrale-niedersachsen.de/sites/default/files/medien/645/dokumente/BR_Photovoltaik_VZ-Nds_2023_Web.pdf'},
    'co2_gruen': {'titel': 'co2online, Dachbegrünung (19.05.2022, Preisstand 2022)', 'url': 'https://www.co2online.de/modernisieren-und-bauen/anpassung-an-den-klimawandel/dachbegruenung/'},
    'hlnug': {'titel': 'HLNUG Factsheet 7 Kosten-Nutzen Dachbegrünung (nur Suchtreffer)', 'url': 'https://www.hlnug.de/'},
    'reduco': {'titel': 'reduco.ai-Blog (Berufung auf Fraunhofer ISE/PVGIS, nur Suchtreffer)', 'url': 'https://reduco.ai/'},
    'baunetz_solarpflicht': {'titel': 'Baunetzwissen, Regelungen der Bundesländer zur Solarpflicht (Stand Januar 2026)', 'url': 'https://www.baunetzwissen.de/flachdach/fachwissen/richtlinien-verordnungen/regelungen-der-bundeslaender-zur-solarpflicht-8327622'},
    'such_forum': {'titel': 'Forum-/Vermittler-Suchtreffer (hausbau-forum.de, bau.de-Forum, capitalo.de), Seiten nicht abgerufen', 'url': 'recherche/29_hausform_dach.md'},
    'bplan_beispiele': {'titel': 'B-Pläne Nidda, Lauffen, gesetze-bayern.de BeckRS 2024 N 24643 (nur Suchtreffer)', 'url': 'recherche/29_hausform_dach.md'},
    'dibt_dlubal': {'titel': 'Dlubal Knowledge Base 001530, Bayerisches Staatsministerium Merkblatt (Suchtreffer); DIBt-Tabelle nicht abgerufen', 'url': 'recherche/29_hausform_dach.md'},
    'tonline_kuppel': {'titel': 't-online Baulexikon Kuppeldach (17.03.2016)', 'url': 'https://www.t-online.de/heim-garten/bauen/id_77296328/kuppeldach-eigenschaften-der-klassischen-dachform.html'},
    'bau_forum': {'titel': 'bau.de-Forum Kuppel/Geodät (Suchtreffer, KI-Analyse; nicht belastbar)', 'url': 'recherche/29_hausform_dach.md'},
    'eigen': {'titel': 'Eigene Einordnung aus den offengelegten Quellenaussagen (R078)', 'url': 'recherche/29_hausform_dach.md'},
    'luecke': {'titel': 'Keine Quelle gefunden (Recherche 29, Offene Punkte)', 'url': 'recherche/29_hausform_dach.md'},
}

BEZ_BAU = 'wärmeübertragende Hüllfläche geteilt durch beheiztes Volumen'
BEZ_TUE = 'Hüllfläche geteilt durch Bruttovolumen'


def av(id, name, v, b, bezug, q, s, **kw):
    return z(id, name, 'm²/m³', v, b, q, s, bezug=bezug, **kw)


HAUSFORMEN = [
    av('W01', 'Freistehendes Einfamilienhaus (allgemein)', 0.7, 1.0, BEZ_BAU, 'baunetz_form', G, hinweis='Quelle: 0,7 bis über 1.'),
    av('W02', 'Doppelhaus', 0.6, 0.9, BEZ_BAU, 'baunetz_form', G),
    av('W03', 'Reihenhaus', 0.4, 0.6, BEZ_BAU, 'baunetz_form', G),
    av('W04', 'Mehrfamilienhaus', 0.3, 0.5, BEZ_BAU, 'baunetz_form', G),
    av('W07', 'EFH L-Form 14,5 × 4 m Grundriss, 1 Geschoss, unterkellert', 0.94, 0.94, BEZ_TUE, 'tuebingen', P, hinweis='Beispiel mit bestimmten Maßen, keine Regel für alle L-Formen. Wert und Typ stehen in der Folie als Text nebeneinander, Zuordnung nach Reihenfolge.'),
    av('W08', 'EFH 10 × 10 m (Quader/Würfel-nah), 1 Geschoss, unterkellert', 0.76, 0.76, BEZ_TUE, 'tuebingen', P),
    av('W09', 'EFH mit Einliegerwohnung 10 × 15 m, 1 Geschoss, unterkellert', 0.72, 0.72, BEZ_TUE, 'tuebingen', P),
    av('W10', 'Zweifamilienhaus 10 × 15 m, 2 Geschosse, unterkellert', 0.59, 0.59, BEZ_TUE, 'tuebingen', P),
    av('W11', 'Beispiel 2 Geschosse, 100 m² Grundfläche, drei Grundrissformen (Bau X, Y, Z)', None, None, BEZ_TUE, 'tuebingen', P, werte=[0.74, 0.90, 0.78],
       hinweis='Formen nur als Zeichnung, Zuordnung zu Würfel/L nicht lesbar.'),
    av('W_bungalow', 'Bungalow / Winkelbungalow', None, None, None, 'luecke', L, hinweis='Keine deutsche neutrale Quelle. A/V im Planer aus dem 3D-Modell selbst berechnen.'),
    av('W_uform', 'U-Form', None, None, None, 'luecke', L, hinweis='Keine neutrale Quelle.'),
    av('W_stadtvilla', 'Stadtvilla', None, None, None, 'luecke', L, hinweis='Keine neutrale Quelle.'),
]
HAUS_AUSSAGEN = [
    z('W05', 'Heizkosten relativ: Hochhausscheibe gegenüber freistehendem EFH = 100 %', '%', 23.8, 23.8, 'baunetz_form', G, hinweis='Kein Hinweis auf Rechenjahr oder Dämmstand.'),
    z('W06', 'Heizkosten relativ: viergeschossige Blockrandbebauung', '%', 36.6, 36.6, 'baunetz_form', G),
    z('H01', 'Kleineres A/V senkt den Energiebedarf je m³ beheiztem Raum; Kugel hat das kleinste A/V, dann Würfel', None, None, None, 'baunetz_form', G, art='qualitativ'),
    z('H02', 'Erker, Gauben, Gebäudevorsprünge erhöhen A/V und Heizwärmeverbrauch deutlich; Kompaktheit hängt zuerst von der Größe, dann von der Form ab', None, None, None, 'baunetz_form', G, art='qualitativ'),
    z('H03', 'Satteldach und Pultdach eignen sich gut für Niedrigenergiehäuser', None, None, None, 'baunetz_form', G, art='qualitativ'),
    z('H04', 'Gebäude mit großem A/V brauchen besseren Wärmeschutz; niedriger Heizwärmebedarf führt nicht unbedingt zu höheren Baukosten, in der Regel zu niedrigeren Gesamtkosten', None, None, None, 'tuebingen', G, art='qualitativ', hinweis='Folie 26; EnEV-2016-Auswertung, nicht GEG.'),
    z('H05', 'Exotische Formen (Kugel, drehbare Häuser) verringern Verluste nur geringfügig und kosten deutlich mehr', None, None, None, 'baunetz_form', G, art='qualitativ'),
    z('H06', 'Tübinger Diagramme: Änderung des Heizwärmebedarfs in kWh/(m²a) je Einflussfaktor (Erker, Dachterrasse, A/V)', 'kWh/(m²·a)', None, None, 'luecke', L, hinweis='Zahlen nur in der Grafik, nicht auslesbar.'),
    z('W12', 'Mehrpreis eines Erkers', '€ je Erker', None, None, 'luecke', L, hinweis='Forum-Wert (5.000 bis 7.000 €, hausbau-forum.de, nur Suchtreffer) nicht übernommen (R074).'),
    z('W12b', 'Mehrkosten aufwendiger Grundrisse gegenüber eckigem Haus', '%', None, None, 'luecke', L, hinweis='Forum-Wert (10 bis 20 %, KI-Text) nicht übernommen (R074).'),
    z('W_keller', 'Mehrkosten Keller gegenüber Bodenplatte; Kosten je m² nach Geschosszahl', None, None, None, 'luecke', L, hinweis='BKI-Kennwerte kostenpflichtig und auf Brutto-Grundfläche bezogen, nicht auf Wohnfläche.'),
]


def dach(id, name, kv, kb, lv, lb, wartung, raum, pv, gen, q, s=P, **kw):
    return z(id, name, '€/m² Dachfläche', kv, kb, q, s, lebensdauer_von=lv, lebensdauer_bis=lb, wartung=wartung, raum=raum, pv=pv, genehmigung=gen, **kw)


DACHFORMEN = [
    dach('dach_satteldach', 'Satteldach', 60, 100, 80, 100, 'Kontrolle alle 2 bis 3 Jahre, Neueindeckung nach 40 bis 50 Jahren', 'Durch Schrägen begrenzt',
         'Süddach 25 bis 45 Grad nahe am Optimum; nicht zu steil wegen Schneeabrutsch, in regenreichen Gebieten steiler (Aroundhome)', 'Meist unproblematisch, wenn im Bebauungsplan genannt', 'wohnen_fin', raum_rang=2),
    dach('dach_walmdach', 'Walmdach', 100, 150, 90, 100, 'Kontrolle alle 3 Jahre', 'Stark eingeschränkt',
         'Gut geeignet, da alle Himmelsrichtungen Flächen bieten (fertighaus.de); wenig Angriffsfläche für Wind (ohne Zahl)', 'Meist unproblematisch, wenn im Bebauungsplan genannt', 'wohnen_fin', raum_rang=1,
         neigung_grad=[15, 40], hinweis='Aroundhome: Neueindeckung allein 80 bis 120, Dachstuhl 50 bis 80 €/m²; die beiden Quellen messen Unterschiedliches.'),
    dach('dach_krueppelwalm', 'Krüppelwalmdach', 110, 160, None, None, None, 'Mehr Raum als Vollwalm', None, None, 'wohnen_fin', raum_rang=2),
    dach('dach_pultdach', 'Pultdach', 70, 100, 50, 60, 'Kontrolle alle 2 Jahre', 'Mehr Raum im Obergeschoss als Satteldach',
         'Nur eine Dachfläche, Ausrichtung sorgfältig planen; lohnt nur bei Süd-Ausrichtung (Aroundhome)', 'Meist unproblematisch, wenn im Bebauungsplan genannt', 'wohnen_fin', raum_rang=4),
    dach('dach_flachdach', 'Flachdach', 70, 110, 30, 50, 'Jährliche Sichtprüfung, Abdichtung nach 20 bis 25 Jahren erneuern', 'Volle Raumhöhe, Dachterrasse möglich',
         'Braucht Aufständerung; 0 Grad rund 84 % des Optimums (Anbieter-Blog, prüfen)', 'Braucht Prüfung; Beispiel B-Plan: Flachdach 0 bis 5 Grad, "Flachdächer als Grünflächen"', 'wohnen_fin', raum_rang=5,
         hinweis='Sanierung mit Dämmung 120 bis 240 €/m² (Aroundhome); Aufsattelung statt Sanierung 100 bis 150 €/m² Mehrkosten (Baunetzwissen, Zitat, Bezug unklar). Neubau 70 bis 110 gegen Sanierung 120 bis 240 messen Unterschiedliches.'),
    dach('dach_zeltdach', 'Zeltdach', 90, 140, 80, 100, 'Kontrolle alle 2 bis 3 Jahre', 'Eingeschränkt; Grundriss symmetrisch/quadratisch nötig', None, None, 'wohnen_fin', raum_rang=1),
    dach('dach_mansarddach', 'Mansarddach', 120, 180, 70, 90, 'Kontrolle alle 2 Jahre', 'Fast ein vollwertiges zusätzliches Stockwerk; der Knick kann Dämmlücken erzeugen (Aroundhome)', None, None, 'wohnen_fin', raum_rang=5),
    dach('dach_tonnendach', 'Tonnendach', 120, 200, None, None, None, 'Viel Raum innen; schwer zu dämmen', None, None, 'wohnen_fin', raum_rang=4,
         hinweis='Aroundhome: 130 bis 180 €/m².'),
    dach('dach_kuppel', 'Kuppeldach / Kuppelhaus / Geodät', None, None, None, None, None, None, None,
         'Selten bei Wohnhäusern wegen aufwendiger Konstruktion und Baugenehmigung; fügt sich nicht in jedes Stadtbild; Statik immer von Fachleuten prüfen lassen', 'tonline_kuppel', G,
         hinweis='Datenlage dünn: nur t-online (2016, Pavillon-Artikel, kein Fachverlag). Kosten je m², Möbel, Fenster, Anbieter: keine brauchbare Quelle (Lücke). Genehmigungsaussagen zu Spritzbeton- und Glas-/Geodätkuppel nur aus Forum.'),
    dach('dach_kuppel_forum', 'Kuppel: Zustimmung im Einzelfall (Spritzbeton) und Statikprüfung bei Glas-/Geodätkuppel', None, None, None, None, None, None, None, None, 'bau_forum', P,
         hinweis='Forum, laut Zusammenfassung KI-Analyse; nicht belastbar.'),
]
# Eigene Einordnung (R078) aus den Aussagen der Quellen oben, für den Vergleichskasten der Seite: Punkte 1 (ungünstig) bis 5 (günstig);
# fehlt ein Punktwert, gibt es keine Angabe (Lücke). nachteil = ein Satz in einfacher Sprache. Kosten, Lebensdauer und Raum stehen schon in den Feldern oben.
EINORDNUNG = {
    'dach_satteldach': dict(rang_pv=5, rang_wartung=4, rang_genehmigung=5, nachteil='Unter den Schrägen geht Raum verloren, und das Dach braucht alle 2 bis 3 Jahre einen Blick.'),
    'dach_walmdach': dict(rang_pv=4, rang_wartung=4, rang_genehmigung=5, nachteil='Teurer als ein Satteldach (100 bis 150 gegen 60 bis 100 € je m²), und der Raum unter dem Dach ist stark eingeschränkt.'),
    'dach_krueppelwalm': dict(nachteil='Teurer als ein Satteldach (110 bis 160 € je m²); zu Wartung, Lebensdauer und Solareignung gibt es keine Angabe.'),
    'dach_pultdach': dict(rang_pv=3, rang_wartung=4, rang_genehmigung=5, nachteil='Nur eine Dachfläche: Solarstrom lohnt sich nur bei Süd-Ausrichtung. Die Angaben nennen die kürzeste Lebensdauer der Steildächer (50 bis 60 Jahre).'),
    'dach_flachdach': dict(rang_pv=3, rang_wartung=2, rang_genehmigung=3, nachteil='Die Abdichtung muss nach 20 bis 25 Jahren erneuert werden, jedes Jahr ist eine Sichtprüfung nötig, Solarmodule brauchen eine Aufständerung, und im Bebauungsplan kann das Flachdach ausgeschlossen sein.'),
    'dach_zeltdach': dict(rang_wartung=4, nachteil='Der Grundriss muss quadratisch oder symmetrisch sein, und der Raum unter dem Dach ist eingeschränkt.'),
    'dach_mansarddach': dict(rang_wartung=3, nachteil='Teuer (120 bis 180 € je m²), und am Knick können Dämmlücken entstehen.'),
    'dach_tonnendach': dict(nachteil='Teuer (120 bis 200 € je m²) und schwer zu dämmen.'),
    'dach_kuppel': dict(rang_genehmigung=1, nachteil='Kaum belastbare Daten (nur ein Lexikonartikel von 2016 und Forenbeiträge). Selten, aufwendig zu bauen und zu genehmigen; die Statik muss immer eine Fachperson prüfen.'),
}
for _d in DACHFORMEN:
    if _d['id'] in EINORDNUNG:
        _d.update(EINORDNUNG[_d['id']])
        _d['einordnung_quelle'] = 'eigen'
DACH_SCHWELLEN = {
    'kosten': {'gruen_bis': 90, 'gelb_bis': 130, 'einheit': '€/m² Dachfläche', 'bezug': 'Mitte der Spanne'},
    'lebensdauer': {'gruen_ab': 80, 'gelb_ab': 50, 'einheit': 'Jahre', 'bezug': 'Mitte der Spanne'},
    'punkte': {'gruen_ab': 4, 'gelb_ab': 3, 'bezug': 'Punkte 1 bis 5 (eigene Einordnung)'},
}
GRUENDACH = [
    z('W42', 'Gründach extensiv, Kosten', '€/m²', 30, 60, 'co2_gruen', G, hinweis='Preisstand 2022.'),
    z('W43', 'Gründach intensiv, Kosten', '€/m²', 60, 120, 'co2_gruen', P, rechnung=True, hinweis='Abgeleitet: co2online sagt im Schnitt doppelt so hoch.'),
    z('W44', 'Gründach Gewicht extensiv', 'kg/m²', 60, 150, 'co2_gruen', G),
    z('W45', 'Gründach Gewicht intensiv', 'kg/m²', 200, None, 'co2_gruen', G, hinweis='Mehr als 200.'),
    z('W46', 'Gründach kommunale Förderung (über 70 Programme)', '€/m²', 10, 50, 'co2_gruen', P, hinweis='Programme ändern sich.'),
    z('W41', 'Abstand Substratoberfläche zu Modulunterkante bei PV auf Gründach', 'cm', 20, 30, 'co2_gruen', G, hinweis='Mindestens 20, besser 30.'),
    z('W47', 'Gründach Regenrückhalt extensiv / intensiv', 'l/m²', None, None, 'hlnug', P, hinweis='Extensiv 20 bis 50, intensiv ca. 80.', extensiv_von=20, extensiv_bis=50, intensiv=80),
    z('W48', 'Gründach Pflegekosten extensiv / intensiv', '€/m²·a', None, None, 'hlnug', P, extensiv_von=0.5, extensiv_bis=2, intensiv_von=2.5, intensiv_bis=4, hinweis='Extensiv 0,5 bis 2, intensiv 2,5 bis 4. Pflege extensiv 1 bis 2 Mal jäten (co2online).'),
    z('W48b', 'Abdichtung hält mit Begrünung länger', 'Jahre', 10, 20, 'hlnug', P, hinweis='Siehe Widerspruch w_fo_03 zu BBSR.'),
]
WOHNFLAECHE = [
    z('W30', 'Anrechnung Grundfläche bei lichter Höhe von mindestens 2 m', '%', 100, 100, 'woflv4', P, hinweis='Zusammenfassung des Abrufwerkzeugs; Wortlaut vor Verwendung selbst gegenlesen.'),
    z('W31', 'Anrechnung bei lichter Höhe von mindestens 1 m und unter 2 m', '%', 50, 50, 'woflv4', P, hinweis='Zusammenfassung des Abrufwerkzeugs.'),
    z('W31b', 'Anrechnung bei lichter Höhe unter 1 m', '%', None, None, 'luecke', L, hinweis='Im Abruf nicht bestätigt (nach Kenntnis des Berichts nicht angerechnet, ungeprüft).'),
    z('W32', 'Keller-, Abstell-, Wasch-, Boden-, Trocken-, Heizungsräume und Garagen zählen nicht zur Wohnfläche', None, None, None, 'woflv2', G, hinweis='§ 2 Abs. 3, Überschrift gelesen; Zusammenfassung.'),
]
PV_DACH = [
    z('pv_ost_west', 'PV: Ost/West-Dach gegenüber Süd weniger Ertrag', '%', 18, 24, 'co2_ausrichtung', G, hinweis='Verbraucherzentrale Niedersachsen: 10 bis 20 %. Süd 25 bis 45 Grad weicht unter 1 % vom Optimum ab. Zahlen in energie.js.'),
    z('pv_ost_west_vz', 'PV: Ost-/West-Dach Ertragsminderung (Verbraucherzentrale Niedersachsen)', '%', 10, 20, 'vz_nds', G),
    z('pv_flachdach', 'PV: Flachdach 0 Grad relativ zum Optimum', '%', 84, 84, 'reduco', P, hinweis='Anbieter-Blog.'),
    z('pv_solarpflicht', 'Solarpflicht Neubau: Mindestbelegung Bremen, Niedersachsen, Brandenburg', '% der Dachfläche', 50, 50, 'baunetz_solarpflicht', P,
       hinweis='Stand Januar 2026; Quellen widersprechen sich bei NRW und Bayern. Landesregeln stehen in bauregeln.js; dort maßgeblich.'),
]
SCHNEE_WIND = [
    z('sw_schnee', 'Schneelast nach DIN EN 1991-1-3 mit Nationalem Anhang; Schneelastzonen nach DIBt-Tabelle, Zonengrenzen bei der Behörde erfragen; Dachneigung geht über Formbeiwerte ein', None, None, None, 'dibt_dlubal', P, hinweis='Formbeiwerte und Zonen nicht beschafft. Für das Tool: Zone beim Bauamt oder Statiker prüfen.'),
    z('sw_wind', 'Windzone', None, None, None, 'luecke', L, hinweis='Keine Windzonenzuordnung beschafft.'),
]
BPLAN = [
    z('bp_baugb9', 'Dachform und Dachneigung stehen in der Praxis in örtlichen Bauvorschriften nach Landesbauordnung, die in den Bebauungsplan übernommen werden (BauGB § 9 Abs. 4)', None, None, None, 'baugb9', P, hinweis='Absatz 1 enthält laut Abruf kein "Dach"/"Dachform"; Absatz 4 Ermächtigung der Länder. Wortlaut selbst gegenlesen.'),
    z('bp_baugb31', 'Befreiung von B-Plan-Festsetzungen möglich, wenn die Grundzüge der Planung nicht berührt werden und einer von drei Gründen vorliegt (Wohl der Allgemeinheit, städtebauliche Vertretbarkeit, offenbar nicht beabsichtigte Härte)', None, None, None, 'baugb31', G, hinweis='Nur sinngemäß gelesen.'),
    z('bp_beispiele', 'Beispiele: Satteldach 20 bis 45 Grad und Flachdach 0 bis 5 Grad je Baugebiet (Nidda); Satteldach 36 bis 48 Grad (Lauffen); Flachdächer als Grünflächen', 'Grad', None, None, 'bplan_beispiele', P, hinweis='Nur Beispiele, nicht repräsentativ.', satteldach_nidda=[20, 45], flachdach_nidda=[0, 5], satteldach_lauffen=[36, 48]),
    z('bp_gericht', 'Ein bayerisches Gericht sah die Festsetzung der Dachform als möglichen Grundzug der Planung; Befreiung kann abgelehnt werden', None, None, None, 'bplan_beispiele', P),
]
KRITERIEN = [
    z('k_baukosten', 'Baukosten', None, None, None, 'eigen', E, einordnung='Dach: Satteldach und Pultdach am unteren Rand (60 bis 100 bzw. 70 bis 100 €/m²), Walm-, Mansard-, Tonnendach höher (100 bis 200 €/m²)', begruendung='Wohnen und Finanzieren, Aroundhome; werblich, nur Größenordnung', hinweis='Eigene Einordnung, keine Empfehlung (R078).'),
    z('k_kompaktheit', 'Heizwärmeverlust / Kompaktheit', None, None, None, 'eigen', E, einordnung='Reihen-/Doppelhaus besser als freistehend; einfacher Quader besser als L-Form; Erker, Gauben, Vorsprünge verschlechtern', begruendung='Baunetzwissen (A/V Reihenhaus 0,4 bis 0,6, Doppelhaus 0,6 bis 0,9, freistehend 0,7 bis über 1); Tübingen'),
    z('k_wartung', 'Wartung', None, None, None, 'eigen', E, einordnung='Flachdach höhere Pflege (jährliche Sichtprüfung, Abdichtung nach 20 bis 25 Jahren); geneigte Dächer Kontrolle alle 2 bis 3 Jahre', begruendung='Wohnen und Finanzieren; prüfen vor Nutzung'),
    z('k_raum', 'Nutzbarer Raum', None, None, None, 'eigen', E, einordnung='Mansarddach und Flachdach am meisten; Pultdach mehr als Satteldach; Walmdach am wenigsten', begruendung='Aroundhome, Wohnen und Finanzieren, WoFlV § 4 (2-m-Regel); Berechnung muss der Planer am 3D-Modell machen'),
    z('k_pv', 'PV-Eignung', None, None, None, 'eigen', E, einordnung='Süddach 25 bis 45 Grad nahe am Optimum; Ost/West 18 bis 24 % weniger; Flachdach braucht Aufständerung', begruendung='co2online; Verbraucherzentrale Niedersachsen'),
    z('k_genehmigung', 'Genehmigungsrisiko', None, None, None, 'eigen', E, einordnung='Satteldach, Walmdach, Pultdach meist unproblematisch, wenn im B-Plan genannt; Flachdach und Kuppel brauchen Prüfung; Kuppel selten und schwer', begruendung='BauGB § 9 Abs. 4, § 31; Beispiel-B-Pläne; t-online (Kuppel)'),
]
WIDERSPRUECHE = [
    {'id': 'w_fo_01', 'text': 'A/V-Definition: Baunetzwissen rechnet Hülle durch beheiztes Volumen, Tübingen durch Bruttovolumen. Nie in einer Skala mischen; im Planer eine Definition festlegen (Feld bezug).', 'betrifft': ['W01', 'W07']},
    {'id': 'w_fo_02', 'text': 'Dachkosten: Walmdach 100 bis 150 (Wohnen und Finanzieren, ganzes Dach) gegen Neueindeckung 80 bis 120 plus Dachstuhl 50 bis 80 (Aroundhome); Flachdach Neubau 70 bis 110 gegen Sanierung 120 bis 240. Messen Unterschiedliches. sanierung.js dach 95 bis 250 €/m² (inkl. Dämmung) ist dritte Basis.', 'betrifft': ['dach_walmdach', 'dach_flachdach', 'sanierung.js:dach']},
    {'id': 'w_fo_03', 'text': 'Lebensdauer: werbliche Dachformquellen (Satteldach 80 bis 100, Mansard 70 bis 90, Pult 50 bis 60 Jahre) gegen BBSR 2026 (Eindeckungen höchstens "≥ 50", Bitumen 25 bis 30, Kunststoff 30 bis 40, Reet 35). Bericht 29 hatte die BBSR-Tabelle noch nicht gefunden (jetzt in material.js). Gründach: BBSR Schutzschicht 45 / Abdichtung 35 Jahre gegen HLNUG (Suchtreffer) Abdichtung 10 bis 20 Jahre länger.', 'betrifft': ['dach_satteldach', 'dach_mansarddach', 'W48b', 'material.js:R09']},
    {'id': 'w_fo_04', 'text': 'Solarpflicht der Länder: Quellen widersprechen sich bei NRW und Bayern (Baunetzwissen "seit 1.1.2025" gegen Wohnen und Finanzieren "bisher nur Nichtwohngebäude"). Landesbauordnung lesen; bauregeln.js maßgeblich.', 'betrifft': ['pv_solarpflicht']},
    {'id': 'w_fo_05', 'text': 'PV Süd 35 Grad: co2online 824 kWh/kWp (Standort unklar) gegen PVGIS Bremen 995,8 (energie.js); die Verhältnisse passen, die Höhe nicht.', 'betrifft': ['pv_ost_west']},
]

OBJ = {
    'meta': {
        'titel': 'Hausformen und Dachformen',
        'abruf': '2026-10-27',
        'hinweis': 'Keine Bauempfehlung (R078): Einordnungen sind eigene Einstufungen. Dachkosten und Lebensdauern nur aus werblichen Vermittler-/Ratgeberseiten (prüfen vor Nutzung). Kuppel/Geodät: Datenlage schwach (t-online 2016, Forum).',
        'av_hinweis': 'A/V im Planer aus dem 3D-Modell selbst berechnen (Hüllfläche geteilt durch Volumen) und die Definition festlegen, statt Typwerte zu nehmen.',
    },
    'quellen': QUELLEN,
    'hausformen_av': HAUSFORMEN,
    'haus_aussagen': HAUS_AUSSAGEN,
    'dachformen': DACHFORMEN,
    'dach_schwellen': DACH_SCHWELLEN,
    'gruendach': GRUENDACH,
    'wohnflaeche_dachschraege': WOHNFLAECHE,
    'pv_dach': PV_DACH,
    'schnee_wind': SCHNEE_WIND,
    'bebauungsplan': BPLAN,
    'kriterien': KRITERIEN,
    'widersprueche': WIDERSPRUECHE,
}

if __name__ == '__main__':
    print(schreibe('formen', 'Hausformen (A/V) und Dachformen (Kosten, Lebensdauer, Raum, PV, Genehmigung). Quelle: recherche/29_hausform_dach.md (Abruf 27.10.2026). Kuppel-Daten schwach. Erzeugt von erzeuger/daten_d_formen.py.', OBJ))
