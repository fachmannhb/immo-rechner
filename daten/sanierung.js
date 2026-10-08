/* Umbau und Sanierung: Kostenspannen, Förderprogramme, Bauablauf.
   Quelle: Recherche 07 (werkzeuge/recherche/07_sanierung_foerderung.md), Abruf 07.10.2026.
   Kosten nur aus Ratgeber- und Anbieterseiten: Größenordnung, durch echte Angebote ersetzen.
   Startpreis je Zeile = Mitte der kleinsten genannten Spanne (eigene Wahl, im Rechner änderbar). */
window.DATEN = window.DATEN || {};
window.DATEN.sanierung = {
  abruf: '2026-10-07',
  bauteile: [
    { id: 'dach', name: 'Dach neu eindecken inkl. Dämmung', einheit: 'm² Dachfläche', von: 95, bis: 250, start: 160, quelle: 'clean-invoice.com (2026); whk-controlling.de (13.04.2026, netto)' },
    { id: 'fassade', name: 'Fassadendämmung WDVS', einheit: 'm² Wandfläche', von: 130, bis: 250, start: 165, quelle: 'Commerzbank-Ratgeber (06.01.2025); reduco.ai, clean-invoice.com, whk-controlling.de (2026)' },
    { id: 'fenster', name: 'Fenster tauschen (3-fach, inkl. Einbau)', einheit: 'Stück', von: 500, bis: 900, start: 700, quelle: 'reduco.ai (2026); whk-controlling.de (13.04.2026, netto)' },
    { id: 'gas', name: 'Heizung Gas-Brennwert (Anlage)', einheit: 'Anlage', von: 9000, bis: 17000, start: 13000, quelle: 'Suchtreffer-Auszüge 2026, Original nicht geprüft (unsicher)' },
    { id: 'wp', name: 'Wärmepumpe Luft/Wasser (Anlage, Einfamilienhaus-Größe)', einheit: 'Anlage', von: 14000, bis: 47000, start: 30000, quelle: 'reduco.ai; whk-controlling.de; clean-invoice.com (2026), sehr breite Streuung' },
    { id: 'elektrik', name: 'Elektrik erneuern (Standard)', einheit: 'm² Wohnfläche', von: 80, bis: 150, start: 110, quelle: 'clean-invoice.com, my-hammer.de (2026); whk-controlling.de (netto)' },
    { id: 'bad', name: 'Bad komplett (Standard)', einheit: 'Bad', von: 16000, bis: 28000, start: 20000, quelle: 'clean-invoice.com (2026); Suchtreffer-Auszüge 2026' },
    { id: 'leitungen', name: 'Wasser- und Abwasserleitungen', einheit: 'm² Wohnfläche', von: 60, bis: 100, start: 80, quelle: 'whk-controlling.de (13.04.2026, netto)' },
    { id: 'boden', name: 'Böden', einheit: 'm²', von: 45, bis: 140, start: 80, quelle: 'clean-invoice.com (2026)' },
    { id: 'putz', name: 'Innenputz, Trockenbau', einheit: 'm²', von: 40, bis: 80, start: 60, quelle: 'whk-controlling.de (13.04.2026, netto)' },
    { id: 'keller', name: 'Kellerabdichtung (Horizontalsperre)', einheit: 'lfd. m', von: 120, bis: 250, start: 180, quelle: 'clean-invoice.com, bau.de (2026, Suchtreffer)' },
    { id: 'tueren', name: 'Innentüren mit Zarge und Einbau', einheit: 'Stück', von: 250, bis: 500, start: 350, quelle: 'clean-invoice.com, kuechenfibel.de (2026); whk-controlling.de' },
    { id: 'kern', name: 'Kernsanierung gesamt (statt Einzelpositionen)', einheit: 'm² Wohnfläche', von: 700, bis: 2500, start: 1200, quelle: 'reduco.ai (24.08.2026); clean-invoice.com; whk-controlling.de' }
  ],
  zuschlaege: {
    planung: { start: 13, text: 'Planung 12 bis 15 % der Baukosten (whk-controlling.de, 13.04.2026)' },
    baustelle: { start: 7, text: 'Baustelleneinrichtung und Entsorgung 5 bis 10 % (whk-controlling.de, 13.04.2026)' },
    puffer: { start: 15, text: 'Puffer für Unvorhergesehenes im Altbau 15 bis 20 % (whk-controlling.de; clean-invoice.com, 2026)' }
  },
  foerderung: [
    { name: 'BAFA BEG Einzelmaßnahmen (Gebäudehülle, Anlagentechnik)', hoehe: '15 % der förderfähigen Ausgaben, mit Sanierungsfahrplan (iSFP) 5 Prozentpunkte mehr auf den Anteil über 30.000 €; Höchstgrenze 30.000 € je Wohnung und Jahr (60.000 € mit iSFP)', vermieter: 'ja', vorher: 'Antrag vor Beauftragung', status: 'aktiv, Prozentsätze aus Sekundärquellen nach BEG-Reform 21.07.2026', url: 'https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude/sanierung_wohngebaeude_node.html' },
    { name: 'KfW 261 Wohngebäude Kredit (Effizienzhaus)', hoehe: 'Kredit bis 150.000 € je Wohnung, Tilgungszuschuss je nach Effizienzhaus-Stufe (Sätze nach der Reform widersprüchlich)', vermieter: 'ja', vorher: 'Antrag über die Hausbank vor Vorhabenbeginn, Energieeffizienz-Experte nötig', status: 'aktiv, Zuschusssätze unsicher', url: 'https://www.kfw.de/partner/KfW-Partnerportal/Multiplikatoren/F%C3%B6rderprodukte/Wohngeb%C3%A4ude-Kredit-%28261%29/index.jsp' },
    { name: 'KfW 458 Heizungsförderung', hoehe: 'Vermieter: nur Grundförderung 30 %, förderfähige Kosten erste Wohnung höchstens 28.000 €', vermieter: 'eingeschränkt (nur Grundförderung)', vorher: 'Liefervertrag mit Förderklausel, Antrag vor Beginn', status: 'aktiv, Details aus Sekundärquellen', url: 'https://finanztip.de/heizkosten-sparen/foerderung-heizung/' },
    { name: 'BAFA Energieberatung für Wohngebäude (EBW, iSFP)', hoehe: '50 % des Beratungshonorars, höchstens 650 € (1 bis 2 Wohnungen) bzw. 850 € (ab 3 Wohnungen)', vermieter: 'ja', vorher: 'Antrag vor Beauftragung', status: 'aktiv laut Quelle, BAFA-Seite Stand 01/2025', url: 'https://www.bafa.de/DE/Energie/Energieberatung/Energieberatung_Wohngebaeude/energieberatung_wohngebaeude_node.html' },
    { name: 'Bremen: Modernisierungsförderung Mietwohnraum (BAB)', hoehe: 'Darlehen bis 55.000 € plus Zuschuss 15.000 € je Wohnung, höchstens 80 % der Kosten (Merkblatt Stand März 2021, aktuelle Höhe unsicher); Miet- und Belegungsbindung', vermieter: 'ja, ausdrücklich', vorher: 'Anmeldung vor Baubeginn', status: 'aktiv laut Förderdatenbank (Richtlinie 30.06.2026)', url: 'https://www.foerderdatenbank.de/FDB/Content/DE/Foerderprogramm/Land/Bremen/wohnungsbaufoerderung-modernisierungsfoerderung.html' },
    { name: 'Steuerermäßigung § 35c EStG', hoehe: '20 % der Kosten über 3 Jahre, höchstens 40.000 €', vermieter: 'nein, nur Selbstnutzer; bei Vermietung Werbungskosten oder Abschreibung (Steuerberater)', vorher: 'nein', status: 'aktiv', url: 'https://www.gesetze-im-internet.de/estg/__35c.html' },
    { name: 'KfW 124 und 308 (Wohneigentum)', hoehe: 'nur für selbst genutztes Wohneigentum', vermieter: 'nein', vorher: '-', status: 'für Vermieter nicht nutzbar', url: 'https://www.kfw.de' }
  ],
  ablauf: [
    { schritt: 'Planung', inhalt: 'Ziel, Budget, Zeitplan; Mieter früh informieren.', wer: 'Eigentümer' },
    { schritt: 'Bestandsaufnahme', inhalt: 'Zustand, Schadstoffe, tragende Teile.', wer: 'Sachverständiger, bei Bedarf Statiker' },
    { schritt: 'Energieberatung', inhalt: 'Sanierungsfahrplan bzw. Bestätigung für BEG-Förderung; Förderantrag vor jeder Beauftragung.', wer: 'Energieeffizienz-Experte' },
    { schritt: 'Entwurf und Leistungsverzeichnis', inhalt: 'Grundrisse, Maßnahmen, Mengen für Angebote.', wer: 'Architekt oder Planer' },
    { schritt: 'Genehmigung klären', inhalt: 'Bremen: vereinfachtes Verfahren (Entscheidung binnen 12 Wochen nach Vollständigkeit, Antrag digital) oder Genehmigungsfreistellung nach § 62 BremLBO im Bebauungsplangebiet (Gemeinde kann binnen eines Monats widersprechen). Ob eine Maßnahme verfahrensfrei ist (§ 61 BremLBO), bei der Bauaufsicht fragen.', wer: 'Entwurfsverfasser', quelle: 'service.bremen.de, Abruf 07.10.2026' },
    { schritt: 'Statik', inhalt: 'Bei Eingriffen in tragende Teile; Standsicherheitsnachweis gehört zu den Bauvorlagen.', wer: 'Statiker' },
    { schritt: 'Angebote und Vergabe', inhalt: 'Mehrere Angebote je Gewerk; bei Förderung Förderklausel in den Vertrag.', wer: 'Planer, Bauleiter' },
    { schritt: 'Modernisierung ankündigen', inhalt: 'Bei vermieteten Wohnungen spätestens drei Monate vor Beginn in Textform ankündigen (§ 555c BGB); Mieter muss dulden, außer bei Härte (§ 555d BGB).', wer: 'Eigentümer, bei Fragen Rechtsanwalt', quelle: 'gesetze-im-internet.de, Abruf 07.10.2026' },
    { schritt: 'Bauausführung', inhalt: 'Bauleitung, Fotos und Protokolle, Abschlagsrechnungen prüfen.', wer: 'Bauleiter' },
    { schritt: 'Abnahme', inhalt: 'Werk abnehmen; wegen unwesentlicher Mängel darf die Abnahme nicht verweigert werden (§ 640 BGB). Mängel ins Protokoll.', wer: 'Eigentümer, Sachverständiger', quelle: 'gesetze-im-internet.de, Abruf 07.10.2026' },
    { schritt: 'Gewährleistung', inhalt: 'Mängelansprüche verjähren bei Bauwerken nach 5 Jahren ab Abnahme (§ 634a BGB); Fristen notieren.', wer: 'Eigentümer', quelle: 'gesetze-im-internet.de, Abruf 07.10.2026' }
  ]
};
