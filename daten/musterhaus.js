/* Musterhaus für den Knopf „Beispiel ansehen“ (Welle 1, 09.10.2026).
   ALLES ERFUNDEN: ein Reihenhaus in Bremen mit frei gewählten Werten. Keine echte Anzeige, keine echten Preise.
   Die Werte sind ein Beispiel, kein Angebot und keine Empfehlung. Alle Zahlen sind Planungswerte. */
window.DATEN = window.DATEN || {};
window.DATEN.musterhaus = {
  name: 'Reihenhaus in Bremen',
  /* Felder des Rechners (Id: Text wie bei der Eingabe) */
  rechner: {
    'r-preis': '300.000', 'r-land': 'Bremen', 'r-notar': '2', 'r-makler': '0', 'r-zusatz': '0', 'r-ek': '70.000',
    'r-zins-a': '3,8', 'r-tilg-a': '2', 'r-bind-a': '10',
    'r-flaeche': '120', 'r-miete': '1.560', 'r-nul': '150', 'r-rueck': '12', 'r-ausfall': '3',
    /* Anschlussfinanzierung (Block 5): eigener Anschlusszins 5,5 %, gleiche Tilgung wie bisher; die Zinsbindung (10 Jahre) steht oben */
    'r-an-eigen': '5,5', 'r-an-modus': 'tilgung'
  },
  /* Wert (Welle 2): erfundene Grundstücks- und Gebäudedaten, Liegenschaftszins bleibt die Annahme 4 %.
     Der Bodenrichtwert ist frei gewählt, kein echter Wert für Bremen. */
  wert: {
    'w-grund': '250', 'w-brw': '600', 'w-baujahr': '1975', 'w-stichjahr': '2026', 'w-gnd': '80', 'w-rnd': '',
    'w-wfl': '120', 'w-we': '1', 'w-miete': '1.560', 'w-verw': '298', 'w-inst': '11,70', 'w-ausfall': '2', 'w-betrieb': '0', 'w-lz': '4',
    'w-vgl': '', 'w-bgf': ''
  },
  /* Umbau (Welle 2): ein neues Bad, zehn Fenster und eine gedämmte Fassade; alle anderen Bauteile bleiben leer.
     Wohnfläche und Miete fehlen absichtlich: der Umbau nimmt sie aus dem Rechner (120 m², 1.560 €). */
  umbau: {
    'u-m-bad': '1', 'u-m-fenster': '10', 'u-m-fassade': '130',
    'u-planung': '13', 'u-baustelle': '7', 'u-puffer': '15', 'u-foerder': '5.000', 'u-anteil': '70', 'u-wfl': '', 'u-miete-alt': '', 'u-rnd-neu': ''
  },
  /* Steuern sparen (Block 4): erfundene Werte. Die Renovierung von 18.000 € bleibt unter der 15-%-Grenze (Gebäude-Anschaffungskosten aus der Kaufpreisaufteilung, rund 134.600 €); die Brutto-Grundfläche
     (190 m²) steht hier statt im Bereich Wert, damit das Beispiel dort unverändert bleibt. Kaufpreis, Boden und Gebäude kommen aus Rechner und Wert. */
  steuer: {
    'st-satz': '30', 'st-baujahr': '1975',
    'st-a-ak': '', 'st-a-j1': '12.000', 'st-a-j2': '6.000', 'st-a-j3': '',
    'st-b-typ': '7h', 'st-b-kosten': '60.000',
    'st-c-kp': '', 'st-c-grund': '', 'st-c-brw': '', 'st-c-bgf': '190', 'st-c-geb': '',
    'st-d-ws': '1,5', 'st-d-vk': '3', 'st-d-soli': 'true'
  },
  /* Eintrag für die Merkliste; feste Id, damit „Beispiel leeren“ ihn wiederfindet */
  objekt: {
    id: 'beispiel-musterhaus', titel: 'Beispiel: Reihenhaus Bremen (erfunden)', ort: 'Bremen', land: 'Bremen',
    preis: 300000, flaeche: 120, zimmer: 5, miete: 1560, makler: 0, baujahr: 1975, we: 1,
    link: '', notiz: 'Erfundenes Beispiel, nicht Ihre Zahlen. Wird mit „Beispiel leeren“ wieder entfernt.', beispiel: true,
    /* Besichtigung (Block 5): erfundener Rundgang; Punkt-Ids stehen in daten/besichtigung.js */
    besichtigung: {
      zeit: '2026-10-09',
      punkte: {
        dach: 'ok', rinne: 'beob', fassade: 'ok', sockel: 'mangel', grundstueck: 'ok',
        'keller-wand': 'mangel', 'keller-boden': 'ok', abdichtung: 'beob',
        'fenster-zustand': 'ok', verglasung: 'beob', 'heizung-art': 'ok', heizkoerper: 'ok', rohrdaemmung: 'mangel',
        sicherung: 'ok', 'bad-zustand': 'beob', 'u-ausweis': 'ok', 'u-grundbuch': 'ok', 'u-rechnungen': 'mangel'
      },
      notizen: {
        keller: 'Beispiel, erfunden: Links hinten feuchte Ecke, Verkäufer sagt, das sei von 2019.',
        heizung: 'Beispiel, erfunden: Gaskessel, Typenschild schlecht lesbar, Wartungsheft nachfordern.',
        fragen: 'Beispiel, erfunden: Provision wird laut Makler geteilt.'
      }
    }
  }
};
