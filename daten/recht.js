/* Verzeichnis Gesetze, Verordnungen, Bauordnungen und Anlaufstellen.
   Quelle: Recherche 06 (werkzeuge/recherche/06_gesetze.md), Titel von den amtlichen Seiten abgelesen, Abruf 07.10.2026.
   Stichproben selbst geprüft 07.10.2026: GModG unter /geg/, Baugesetzbuch unter /bbaug/, § 559 BGB, ImmoWertV §§ 34 und Anlage 4.
   „Wann wichtig“ = eigene Erklärung, keine Rechtsberatung. Keine Gesetzestexte in der Seite, nur Links zum amtlichen Text. */
window.DATEN = window.DATEN || {};
window.DATEN.recht = {
  abruf: '2026-10-07',
  bund: [
    { k: 'BGB Kaufrecht', t: 'Bürgerliches Gesetzbuch, §§ 433 ff. „Kauf, Tausch“', u: 'https://www.gesetze-im-internet.de/bgb/', b: 'Kauf', w: 'Was Verkäufer und Käufer sich schulden und wann Mängel am Haus Rechte geben. Beim Grundstückskauf kommt der Notarvertrag dazu.' },
    { k: 'BGB Mietrecht', t: 'Bürgerliches Gesetzbuch, §§ 535 ff. „Mietvertrag, Pachtvertrag“', u: 'https://www.gesetze-im-internet.de/bgb/', b: 'Vermietung', w: 'Grundlage für Mietvertrag, Miete, Kaution, Mieterhöhung, Betriebskosten und Kündigung bei Wohnraum.' },
    { k: 'BGB § 556d', t: '§ 556d Zulässige Miethöhe bei Mietbeginn; Verordnungsermächtigung', u: 'https://www.gesetze-im-internet.de/bgb/__556d.html', b: 'Vermietung', w: 'Mietpreisbremse bei Neuvermietung, wo das Land sie per Verordnung festlegt (Bremen siehe unten).' },
    { k: 'BGB § 559', t: '§ 559 Mieterhöhung nach Modernisierungsmaßnahmen', u: 'https://www.gesetze-im-internet.de/bgb/__559.html', b: 'Vermietung, Umbau', w: '8 % der Modernisierungskosten pro Jahr umlegbar, mit Kappungsgrenzen (siehe Bereich „Umbauen und renovieren“).' },
    { k: 'BetrKV', t: 'Verordnung über die Aufstellung von Betriebskosten', u: 'https://www.gesetze-im-internet.de/betrkv/', b: 'Vermietung', w: 'Welche laufenden Kosten auf Mieter umgelegt werden dürfen. Für Mietvertrag und Nebenkostenabrechnung.' },
    { k: 'WoFlV', t: 'Verordnung zur Berechnung der Wohnfläche', u: 'https://www.gesetze-im-internet.de/woflv/', b: 'Vermietung, Wertermittlung', w: 'Wie Wohnfläche gerechnet wird (Balkone, Dachschrägen). Für Exposé, Mietvertrag und Rendite.' },
    { k: 'HeizkostenV', t: 'Verordnung über die verbrauchsabhängige Abrechnung der Heiz- und Warmwasserkosten', u: 'https://www.gesetze-im-internet.de/heizkostenv/', b: 'Vermietung', w: 'Heiz- und Warmwasserkosten müssen nach Verbrauch abgerechnet werden.' },
    { k: 'GModG (früher GEG)', t: 'Gesetz zur Einsparung von Energie und zur Modernisierung der Wärmeversorgung in Gebäuden (Gebäudemodernisierungsgesetz)', u: 'https://www.gesetze-im-internet.de/geg/', b: 'Umbau, Kauf, Vermietung', w: 'Energiestandard, Heizung, Dämmung, Energieausweis. Beim Kauf, Umbau und Heizungstausch prüfen. Zuletzt geändert 23.07.2026.' },
    { k: 'BauGB', t: 'Baugesetzbuch', u: 'https://www.gesetze-im-internet.de/bbaug/', b: 'Umbau, Kauf', w: 'Bebauungsplan, Innen- und Außenbereich, Vorkaufsrecht der Gemeinde, Sanierungs- und Erhaltungssatzungen.' },
    { k: 'BauNVO', t: 'Verordnung über die bauliche Nutzung der Grundstücke', u: 'https://www.gesetze-im-internet.de/baunvo/', b: 'Umbau, Kauf', w: 'Gebietsarten (Wohngebiet, Mischgebiet) und was dort genutzt werden darf; wichtig für Nutzungsänderungen.' },
    { k: 'PlanZV', t: 'Verordnung über die Ausarbeitung der Bauleitpläne und die Darstellung des Planinhalts', u: 'https://www.gesetze-im-internet.de/planzv_90/', b: 'Umbau, Kauf', w: 'Erklärt Zeichen und Farben im Bebauungsplan.' },
    { k: 'ImmoWertV', t: 'Verordnung über die Grundsätze für die Ermittlung der Verkehrswerte von Immobilien und der für die Wertermittlung erforderlichen Daten', u: 'https://www.gesetze-im-internet.de/immowertv_2022/', b: 'Wertermittlung', w: 'Wie Gutachter den Wert ermitteln; Grundlage des Bereichs „Was ist das Haus wert?“.' },
    { k: 'BewG', t: 'Bewertungsgesetz', u: 'https://www.gesetze-im-internet.de/bewg/', b: 'Steuer, Wertermittlung', w: 'Bewertung für Grundsteuer und Erbschaftsteuer.' },
    { k: 'WEG', t: 'Gesetz über das Wohnungseigentum und das Dauerwohnrecht (Wohnungseigentumsgesetz)', u: 'https://www.gesetze-im-internet.de/woeigg/', b: 'Kauf, Verwaltung', w: 'Beim Kauf einer Eigentumswohnung: Gemeinschaftseigentum, Versammlung, Hausgeld, Rücklage.' },
    { k: 'GBO', t: 'Grundbuchordnung', u: 'https://www.gesetze-im-internet.de/gbo/', b: 'Kauf', w: 'Wie Eigentum, Grundschulden und Vormerkungen eingetragen werden.' },
    { k: 'BeurkG', t: 'Beurkundungsgesetz', u: 'https://www.gesetze-im-internet.de/beurkg/', b: 'Kauf', w: 'Wie der Notar beurkundet, u. a. Vorlage des Vertragsentwurfs vorab.' },
    { k: 'GNotKG', t: 'Gesetz über Kosten der freiwilligen Gerichtsbarkeit für Gerichte und Notare (Gerichts- und Notarkostengesetz)', u: 'https://www.gesetze-im-internet.de/gnotkg/', b: 'Kauf', w: 'Grundlage der Notar- und Grundbuchkosten.' },
    { k: 'GrEStG', t: 'Grunderwerbsteuergesetz', u: 'https://www.gesetze-im-internet.de/grestg_1983/', b: 'Kauf, Steuer', w: 'Grunderwerbsteuer; den Satz bestimmt das Bundesland.' },
    { k: 'GwG', t: 'Gesetz über das Aufspüren von Gewinnen aus schweren Straftaten (Geldwäschegesetz)', u: 'https://www.gesetze-im-internet.de/gwg_2017/', b: 'Kauf', w: 'Notar und Makler prüfen Identität und Herkunft des Geldes.' },
    { k: 'ZVG', t: 'Gesetz über die Zwangsversteigerung und die Zwangsverwaltung', u: 'https://www.gesetze-im-internet.de/zvg/', b: 'Kauf', w: 'Kauf in der Zwangsversteigerung: Gebote, Zuschlag, bestehen bleibende Rechte.' },
    { k: 'MaBV', t: 'Verordnung über die Pflichten der Immobilienmakler, Darlehensvermittler, Bauträger, Baubetreuer und Wohnimmobilienverwalter (Makler- und Bauträgerverordnung)', u: 'https://www.gesetze-im-internet.de/gewo_34cdv/', b: 'Kauf, Verwaltung', w: 'Pflichten von Maklern, Bauträgern, Verwaltern; beim Bauträgerkauf Zahlung nach Baufortschritt.' },
    { k: 'GewO § 34c', t: 'Gewerbeordnung, § 34c Immobilienmakler, Darlehensvermittler, Bauträger, Baubetreuer, Wohnimmobilienverwalter', u: 'https://www.gesetze-im-internet.de/gewo/', b: 'Verwaltung', w: 'Erlaubnispflicht, wenn man Verwaltung für andere gegen Entgelt anbietet.' },
    { k: 'EStG § 7, § 21', t: 'Einkommensteuergesetz: § 7 Absetzung für Abnutzung oder Substanzverringerung; § 21 Einkünfte aus Vermietung und Verpachtung', u: 'https://www.gesetze-im-internet.de/estg/', b: 'Steuer', w: 'Abschreibung des Gebäudes und Einkünfte aus Vermietung (Anlage V). Mit Steuerberater.' },
    { k: 'GrStG', t: 'Grundsteuergesetz', u: 'https://www.gesetze-im-internet.de/grstg_1973/', b: 'Steuer', w: 'Grundsteuer, meist über die Nebenkosten umgelegt.' },
    { k: 'UStG', t: 'Umsatzsteuergesetz', u: 'https://www.gesetze-im-internet.de/ustg_1980/', b: 'Steuer', w: 'Bei Gewerbemiete oder Beherbergung (Monteurzimmer) wichtig; mit Steuerberater klären.' },
    { k: 'BauFordSiG', t: 'Gesetz über die Sicherung der Bauforderungen', u: 'https://www.gesetze-im-internet.de/baufordsig/', b: 'Umbau', w: 'Baugeld muss für das Bauvorhaben verwendet werden.' },
    { k: 'WPG', t: 'Gesetz für die Wärmeplanung und zur Dekarbonisierung der Wärmenetze', u: 'https://www.gesetze-im-internet.de/wpg/', b: 'Umbau, Kauf', w: 'Kommunale Wärmeplanung; hilft bei der Heizungsentscheidung.' },
    { k: 'GEIG', t: 'Gesetz zum Aufbau einer gebäudeintegrierten Lade- und Leitungsinfrastruktur für die Elektromobilität', u: 'https://www.gesetze-im-internet.de/geig/', b: 'Umbau', w: 'Ladeinfrastruktur bei größeren Renovierungen mit Stellplätzen.' },
    { k: 'TrinkwV', t: 'Verordnung über die Qualität von Wasser für den menschlichen Gebrauch', u: 'https://www.gesetze-im-internet.de/trinkwv_2023/', b: 'Vermietung', w: 'Prüfpflichten, z. B. Legionellen bei größeren Warmwasseranlagen.' },
    { k: 'KÜO', t: 'Verordnung über die Kehrung und Überprüfung von Anlagen', u: 'https://www.gesetze-im-internet.de/k_o/', b: 'Verwaltung', w: 'Wie oft der Schornsteinfeger kehren und prüfen muss.' },
    { k: 'SchfHwG', t: 'Gesetz über das Berufsrecht und die Versorgung im Schornsteinfegerhandwerk', u: 'https://www.gesetze-im-internet.de/schfhwg/', b: 'Verwaltung', w: 'Bezirksschornsteinfeger und Feuerstättenschau.' },
    { k: '1. BImSchV', t: 'Erste Verordnung zur Durchführung des Bundes-Immissionsschutzgesetzes', u: 'https://www.gesetze-im-internet.de/bimschv_1_2010/', b: 'Verwaltung, Umbau', w: 'Kleine Feuerungsanlagen (Kamin, Ofen, Kessel): Grenzwerte und Messungen.' },
    { k: 'BBodSchG', t: 'Gesetz zum Schutz vor schädlichen Bodenveränderungen und zur Sanierung von Altlasten', u: 'https://www.gesetze-im-internet.de/bbodschg/', b: 'Kauf', w: 'Altlasten auf dem Grundstück; auch der Eigentümer kann haften.' },
    { k: 'WoGG', t: 'Wohngeldgesetz', u: 'https://www.gesetze-im-internet.de/wogg/', b: 'Vermietung', w: 'Wenn Mieter Wohngeld beziehen (Mietbescheinigung).' }
  ],
  laender: [
    { l: 'Baden-Württemberg', t: 'Landesbauordnung für Baden-Württemberg (LBO)', u: 'https://www.landesrecht-bw.de/jportal/?quelle=jlink&query=BauO+BW&psml=bsbawueprod.psml', g: false },
    { l: 'Bayern', t: 'Bayerische Bauordnung (BayBO)', u: 'https://www.gesetze-bayern.de/Content/Document/BayBO', g: true },
    { l: 'Berlin', t: 'Bauordnung für Berlin (BauO Bln)', u: 'https://gesetze.berlin.de/bsbe/document/jlr-BauOBE2005rahmen', g: false },
    { l: 'Brandenburg', t: 'Brandenburgische Bauordnung (BbgBO)', u: 'https://bravors.brandenburg.de/gesetze/bbgbo_2016', g: true },
    { l: 'Bremen', t: 'Bremische Landesbauordnung vom 29. Mai 2024 (laut Portal Außerkrafttreten 31.12.2026, Neufassung beim Bauamt erfragen)', u: 'https://www.transparenz.bremen.de/metainformationen/bremische-landesbauordnung-vom-29-mai-2024-232736', g: true },
    { l: 'Hamburg', t: 'Hamburgische Bauordnung (HBauO)', u: 'https://www.landesrecht-hamburg.de/bsha/document/jlr-BauOHA2025pP32', g: false },
    { l: 'Hessen', t: 'Hessische Bauordnung (HBO)', u: 'https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-NNLHE00005097NN00000000002', g: false },
    { l: 'Mecklenburg-Vorpommern', t: 'Landesbauordnung Mecklenburg-Vorpommern (LBauO M-V), nur Portaleinstieg', u: 'https://www.landesrecht-mv.de/', g: false },
    { l: 'Niedersachsen', t: 'Niedersächsische Bauordnung (NBauO), Fassung ab 01.07.2025', u: 'https://voris.wolterskluwer-online.de/browse/document/5496160f-0120-30fe-bbd6-9a24d113afc2', g: true },
    { l: 'Nordrhein-Westfalen', t: 'Bauordnung für das Land Nordrhein-Westfalen (Landesbauordnung 2018 - BauO NRW 2018), Fassung ab 01.09.2026', u: 'https://recht.nrw.de/lrgv/gesetz/01092026-landesbauordnung-2018-bauo-nrw-2018/', g: true },
    { l: 'Rheinland-Pfalz', t: 'Landesbauordnung Rheinland-Pfalz (LBauO)', u: 'https://landesrecht.rlp.de/bsrp/document/jlr-BauORPrahmen', g: false },
    { l: 'Saarland', t: 'Landesbauordnung (LBO) des Saarlandes', u: 'https://recht.saarland.de/bssl/document/jlr-NNLSL00009DF9NN00000000238', g: false },
    { l: 'Sachsen', t: 'Sächsische Bauordnung (SächsBO)', u: 'https://www.revosax.sachsen.de/vorschrift/1779-SaechsBO', g: true },
    { l: 'Sachsen-Anhalt', t: 'Bauordnung des Landes Sachsen-Anhalt (BauO LSA)', u: 'https://www.landesrecht.sachsen-anhalt.de/bsst/document/jlr-NNLST000040E3NN00000000019', g: false },
    { l: 'Schleswig-Holstein', t: 'Landesbauordnung für das Land Schleswig-Holstein (LBO)', u: 'https://www.gesetze-rechtsprechung.sh.juris.de/jportal/?quelle=jlink&query=BauO+SH&psml=bsshoprod.psml&max=true&aiz=true', g: false },
    { l: 'Thüringen', t: 'Thüringer Bauordnung (ThürBO)', u: 'https://landesrecht.thueringen.de/jportal/?max=true&psml=bsthueprod.psml&quelle=jlink&query=BauO+TH', g: false }
  ],
  regional: [
    { l: 'Bremen', t: 'Bremisches Wohnraumschutzgesetz vom 13. Juli 2021', u: 'https://www.transparenz.bremen.de/metainformationen/bremisches-wohnraumschutzgesetz-vom-13-juli-2021-296736', w: 'Zweckentfremdung von Wohnraum, Überbelegung, Mindestzustand; wichtig bei Umnutzung oder Monteurzimmern.' },
    { l: 'Bremen', t: 'Mietenbegrenzungsverordnung vom 18. November 2025 (gültig bis 31.12.2029)', u: 'https://www.transparenz.bremen.de/metainformationen/verordnung-ueber-die-zulaessige-miethoehe-gemaess-556d-absatz-2-des-buergerlichen-gesetzbuchs-mietenbegrenzungsverordnung-vom-18-november-2025-306286', w: 'Wo in Bremen die Mietpreisbremse gilt; vor der Startmiete lesen.' },
    { l: 'Bremen', t: 'Mobilitäts-Bau-Ortsgesetz (MobBauOG HB) vom 20. September 2022', u: 'https://www.transparenz.bremen.de/metainformationen/ortsgesetz-ueber-vorhabenbezogene-stellplaetze-fuer-kraftfahrzeuge-fahrradabstellplaetze-und-mobilitaetsmanagement-bei-bauvorhaben-in-der-stadtgemeinde-bremen-mobilitaets-bau-ortsgesetz-mobbauog-hb-vom-20-september-2022-184255', w: 'Stellplätze bei Umbau oder Nutzungsänderung; ersetzt das alte Stellplatzortsgesetz (außer Kraft seit 30.09.2022).' },
    { l: 'Bremen', t: 'Bremisches Denkmalschutzgesetz (BremDSchG) vom 18. Dezember 2018', u: 'https://www.transparenz.bremen.de/metainformationen/bremisches-gesetz-zur-pflege-und-zum-schutz-der-kulturdenkmaeler-bremisches-denkmalschutzgesetz-bremdschg-vom-18-dezember-2018-124518', w: 'Bei Denkmälern braucht ein Umbau eine Genehmigung.' },
    { l: 'Niedersachsen', t: 'Niedersächsisches Gesetz über den Schutz von Wohnraum und von Unterkünften für Beschäftigte (NWoSchG), Geltung im Browser prüfen', u: 'https://voris.wolterskluwer-online.de/browse/document/a5b6cd8b-43a1-3e24-9637-127621b5d2c1', w: 'Zweckentfremdung, Überbelegung, Unterkünfte für Beschäftigte (auch Monteurzimmer).' },
    { l: 'Niedersachsen', t: 'Niedersächsische Beherbergungsstättenverordnung (NBeStättVO), ab 01.09.2023', u: 'https://voris.wolterskluwer-online.de/browse/document/2a4b11b9-aca9-3ab0-b469-885abdceb1c3', w: 'Gilt für Beherbergungsstätten mit mehr als zwölf Betten.' },
    { l: 'Niedersachsen', t: 'Niedersächsisches Denkmalschutzgesetz', u: 'https://voris.wolterskluwer-online.de/browse/document/1a71a07f-419e-3714-afe8-2b19223e2534', w: 'Bei denkmalgeschützten Häusern.' },
    { l: 'Niedersachsen', t: 'Niedersächsische Bauvorlagenverordnung (NBauVorlVO)', u: 'https://voris.wolterskluwer-online.de/browse/document/e6893cc0-df2a-3397-b5a5-31e7b2fb1a4b', w: 'Welche Unterlagen zum Bauantrag gehören.' }
  ],
  stellen: [
    { t: 'BORIS-D Bodenrichtwerte Deutschland', u: 'https://www.bodenrichtwerte-boris.de/boris-d/', w: 'Bodenrichtwerte aller Länder.' },
    { t: 'Gutachterausschuss Bremen', u: 'https://www.gutachterausschuss.bremen.de/', w: 'Bodenrichtwerte, Grundstücksmarktbericht (Liegenschaftszinssätze).' },
    { t: 'Immobilienmarkt Niedersachsen', u: 'https://immobilienmarkt.niedersachsen.de/', w: 'Bodenrichtwerte und Marktdaten Niedersachsen und Bremen.' },
    { t: 'ZVG-Portal', u: 'https://www.zvg-portal.de/', w: 'Termine der Zwangsversteigerungen.' },
    { t: 'ELSTER', u: 'https://www.elster.de/', w: 'Steuererklärung online; nur nach eigener Prüfung und mit Steuerberater einreichen.' },
    { t: 'KfW Förderung Privatpersonen', u: 'https://www.kfw.de/inlandsfoerderung/Privatpersonen/', w: 'Förderkredite und Zuschüsse.' },
    { t: 'BAFA Bundesförderung für effiziente Gebäude', u: 'https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/effiziente_gebaeude_node.html', w: 'Zuschüsse für Einzelmaßnahmen.' },
    { t: 'Energie-Effizienz-Experten', u: 'https://www.energie-effizienz-experten.de/', w: 'Zugelassene Experten für Förderanträge.' },
    { t: 'Transparenzportal Bremen', u: 'https://www.transparenz.bremen.de/', w: 'Amtliches Bremer Landesrecht.' },
    { t: 'Gesetze im Internet', u: 'https://www.gesetze-im-internet.de/', w: 'Amtliches Bundesrecht.' }
  ]
};
