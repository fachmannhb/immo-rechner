/* Texte für den Heizungs- und Energie-Check im Bereich Umbau (Block 5, 09.10.2026). Ansprache „Sie“.
   Grundlage ausschließlich recherche/15_vermieter_regeln.md Abschnitt A (Gebäudemodernisierungsgesetz GModG, früher Gebäudeenergiegesetz GEG,
   Abruf der amtlichen Texte auf gesetze-im-internet.de am 09.10.2026). Was dort „UNSICHER“ heißt, steht hier als „Vor Nutzung prüfen“.
   Kostenwerte sind Ratgeberwerte, nicht amtlich, mit Quelle und Abruf am Wert. Keine Rechtsberatung.
   Die Regeln, welcher Punkt wann „gilt“, stehen in rechner.js (heizungsCheck); hier stehen nur Texte.
   Schlüssel in v: Status, bei der Heizung zusätzlich „status:grund“. */
window.DATEN = window.DATEN || {};
window.DATEN.pflichten = {
  abruf: '09.10.2026',
  status: {
    gilt: 'Gilt für Sie',
    moeglich: 'Kann auf Sie zukommen',
    pruefen: 'Vor Nutzung prüfen',
    frei: 'Hier nichts zu tun',
    info: 'Gut zu wissen'
  },
  punkte: {
    heizung: {
      titel: 'Gas-, Öl- oder Flüssiggasheizung: Bio-Anteil',
      para: '§ 43 GModG', url: 'https://www.gesetze-im-internet.de/geg/__43.html',
      v: {
        'gilt': 'Eine Heizung, die mit Gas, Heizöl oder Flüssiggas läuft und nach dem 29. Juli 2026 in ein bestehendes Gebäude neu eingebaut wird, muss einen wachsenden Anteil ihrer Wärme aus Biomethan, Bioöl, biogenem Flüssiggas oder Wasserstoff erzeugen (die „Bio-Treppe“). Statt des Brennstoffs können auch Solarthermie, ein Wärmepumpen-Hybrid, Lüftung mit Wärmerückgewinnung oder ein Biomasse-Hybrid die Pflicht erfüllen (§ 43 Abs. 3 bis 5, § 45 Abs. 2). Befreiung auf Antrag bei unbilliger Härte (§ 102). Bußgeld bis 5.000 € (§ 108).',
        'pruefen:art': 'Wählen Sie oben die Heizungsart. Nur bei Gas, Öl und Flüssiggas gilt die Bio-Treppe nach § 43.',
        'pruefen:einbau-fehlt': 'Tragen Sie das Einbaujahr ein (Typenschild am Kessel oder Wartungsprotokoll). Bei Gas, Öl und Flüssiggas entscheidet es, ob die Bio-Treppe gilt.',
        'pruefen:einbau-2026': 'Die Bio-Treppe gilt nur für Heizungen, die nach dem 29. Juli 2026 eingebaut werden. Bei Einbau 2026 kommt es auf den Tag an. Fragen Sie nach Rechnung oder Abnahmeprotokoll.',
        'frei:vor-2026': 'Eine Pflicht, alte Heizkessel auszutauschen, gibt es nach dem heutigen Gesetzestext nicht mehr: § 72 steht dort als „(weggefallen)“. Die Bio-Treppe gilt erst, wenn Sie später eine neue Gas-, Öl- oder Flüssiggasheizung einbauen lassen. Vor Nutzung prüfen: Ob eine Frist, die schon vor dem 29. Juli 2026 lief (zum Beispiel zwei Jahre nach einem Eigentumswechsel), rückwirkend entfällt, sagt der Gesetzestext nicht.',
        'frei:andere-art': 'Wärmepumpe, Fernwärme und andere Heizungen unterliegen der Bio-Treppe nicht; sie betrifft nur Gas-, Öl- und Flüssiggasheizungen. Wer später auf Gas oder Öl umrüsten will, muss sie beachten.'
      },
      folgen: 'Folgen für Vermieter: Bei Einbau und Betrieb einer solchen Anlage teilen Vermieter und Mieter bestimmte Kosten hälftig, nämlich Gasnetzentgelte und CO2-Kosten ab 2028 sowie die Kosten des vorgeschriebenen Brennstoffanteils (höchstens 30 % des Brennstoffs) ab 2029 (§ 5a Abs. 3 CO2KostAufG).',
      folgenUrl: 'https://www.gesetze-im-internet.de/co2kostaufg/__5a.html'
    },
    decke: {
      titel: 'Oberste Geschossdecke dämmen',
      para: '§ 35 GModG', url: 'https://www.gesetze-im-internet.de/geg/__35.html',
      v: {
        'moeglich': 'Eigentümer müssen dafür sorgen, dass eine oberste Geschossdecke, die den Mindestwärmeschutz nicht erfüllt, so gedämmt wird, dass ihr Wärmedurchgang höchstens 0,24 Watt je m² und Kelvin beträgt. Die Pflicht gilt als erfüllt, wenn stattdessen das Dach darüber gedämmt ist. Bei höchstens zwei Wohnungen, von denen der Eigentümer eine am 1. Februar 2002 selbst bewohnt hat, muss erst der neue Eigentümer nach einem Eigentumswechsel dämmen, mit zwei Jahren Frist ab dem ersten Eigentumsübergang nach dem 1. Februar 2002. Ob diese Frist bei Ihrem Haus schon läuft oder schon abgelaufen ist, hängt von der Geschichte des Hauses ab: Fragen Sie den Verkäufer und einen Energieberater. Bußgeld bis 50.000 € (§ 108).',
        'pruefen': 'Schauen Sie bei der Besichtigung auf den Dachboden, ob die Decke gedämmt ist, und lassen Sie sich Nachweise zeigen. Fehlt die Dämmung, kann § 35 eine Dämmpflicht auslösen (Ausnahmen und Fristen: Antwort „Nein“ wählen, dann steht es hier).',
        'frei': 'Sie haben angegeben, dass die Decke gedämmt ist. Erfüllt die Dämmung den Mindestwärmeschutz, ist hier nichts zu tun. Lassen Sie sich Dicke und Nachweis zeigen.'
      },
      kosten: 'Ratgeberwert, nicht amtlich, Preisstand unbekannt: nicht begehbare Decke 20 bis 35 € je m², begehbar 40 bis 80 € je m².',
      kostenQuelle: 'co2online', kostenUrl: 'https://www.co2online.de/modernisieren-und-bauen/daemmung/daemmung-der-obersten-geschossdecke/', kostenAbruf: '09.10.2026'
    },
    rohre: {
      titel: 'Heizungs- und Warmwasserrohre im Keller dämmen',
      para: '§ 69 GModG', url: 'https://www.gesetze-im-internet.de/geg/__69.html',
      v: {
        'moeglich': 'Heizungs- und Warmwasserrohre, die bisher ungedämmt, zugänglich und nicht in beheizten Räumen verlegt sind (zum Beispiel im Keller), müssen gedämmt werden. Mindestdicke nach Anlage 8: Rohre bis 22 mm Innendurchmesser 20 mm, über 22 bis 35 mm 30 mm, über 35 bis 100 mm so dick wie der Innendurchmesser, darüber 100 mm. Für Häuser mit höchstens zwei Wohnungen, von denen der Eigentümer eine am 1. Februar 2002 selbst bewohnt hat, gilt dieselbe Ausnahme mit zwei Jahren Frist wie bei der Decke (§ 69 Abs. 3 und 4). Bußgeld bis 50.000 € (§ 108).',
        'pruefen': 'Schauen Sie bei der Besichtigung im Keller, ob die Rohre eine Dämmung haben. Ungedämmte, zugängliche Rohre außerhalb beheizter Räume können unter § 69 fallen (Antwort „Nein“ wählen, dann steht es hier).',
        'frei': 'Sie haben angegeben, dass die Rohre gedämmt sind. Dann ist hier nichts zu tun.'
      },
      kosten: 'Ratgeberwert, nicht amtlich, Preisstand unbekannt: 5 bis 10 € je Meter, nur Material.',
      kostenQuelle: 'energie-fachberater.de', kostenUrl: 'https://www.energie-fachberater.de/daemmung/daemmung-keller/daemmung-rohrleitungen/', kostenAbruf: '09.10.2026'
    },
    ausweis: {
      titel: 'Energieausweis',
      para: '§§ 79, 80 GModG', url: 'https://www.gesetze-im-internet.de/geg/__80.html',
      v: {
        'info': 'Beim Verkauf muss der Verkäufer (oder der Makler) den Energieausweis spätestens bei der Besichtigung vorlegen und nach dem Kaufvertrag unverzüglich übergeben (§ 80 Abs. 4). Der Ausweis gilt zehn Jahre (§ 79 Abs. 3). Wollen Sie später vermieten, gilt die Vorlagepflicht entsprechend für Sie (§ 80 Abs. 5). Wird der Ausweis nicht oder nicht rechtzeitig vorgelegt, drohen bis zu 10.000 € Bußgeld (§ 108).'
      },
      bedarf: 'Ihr Baujahr (bis 1977) deutet darauf hin, dass der Bauantrag vor dem 1. November 1977 gestellt wurde. Bei Wohngebäuden mit weniger als fünf Wohnungen ist dann ein Energiebedarfsausweis nötig, außer das Haus erfüllte schon die Wärmeschutzverordnung von 1977 (§ 80 Abs. 3). Entscheidend ist der Tag des Bauantrags, nicht das Baujahr. Vor Nutzung prüfen.'
    },
    waermeplan: {
      titel: 'Wärmeplan der Stadt Bremen',
      para: 'Stadt Bremen', url: 'https://waermeplanung.bremen.de/',
      v: {
        'info': 'Nur wichtig, wenn das Haus in der Stadt Bremen liegt. Die Stadtbürgerschaft hat den Wärmeplan der Stadt am 21.04.2026 beschlossen. Laut Stadt ist er „eine strategische Fachplanung, die keine einklagbaren Rechte oder Pflichten begründet“: Er verpflichtet weder Netzbetreiber noch Eigentümer zu einer bestimmten Wärmeversorgung. Ob für Ihre Adresse ein Wärmenetz geplant ist, sehen Sie auf der Karte im Geoportal Bremen. Vor Nutzung prüfen: Bremerhaven wurde nicht geprüft; ob ein Anschluss- und Benutzungszwang für Fernwärme gilt (§ 109 GModG), wurde nicht gelesen.'
      },
      karteUrl: 'https://geoportal.bremen.de/waermeplanung/', karteHinweis: 'Adresse aus der Senatsvorlage, nicht geöffnet geprüft'
    }
  },
  fuss: 'Keine Rechtsberatung. Was für Ihr Haus wirklich nötig und sinnvoll ist, sagt Ihnen ein Energieberater, zum Beispiel mit einem individuellen Sanierungsfahrplan (iSFP). Nicht abgefragt: Pflichten für Häuser ab sechs Wohnungen (§ 60b, § 60c), Baudenkmal (§ 105) und die Wärmepumpen-Regeln. Das Gesetz heißt seit dem 29.07.2026 Gebäudemodernisierungsgesetz (GModG, früher Gebäudeenergiegesetz); die Adresse auf gesetze-im-internet.de ist unverändert /geg/.'
};
