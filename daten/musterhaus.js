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
    'r-flaeche': '120', 'r-miete': '1.560', 'r-nul': '150', 'r-rueck': '12', 'r-ausfall': '3'
  },
  /* Eintrag für die Merkliste; feste Id, damit „Beispiel leeren“ ihn wiederfindet */
  objekt: {
    id: 'beispiel-musterhaus', titel: 'Beispiel: Reihenhaus Bremen (erfunden)', ort: 'Bremen', land: 'Bremen',
    preis: 300000, flaeche: 120, zimmer: 5, miete: 1560, makler: 0, baujahr: 1975, we: 1,
    link: '', notiz: 'Erfundenes Beispiel, nicht Ihre Zahlen. Wird mit „Beispiel leeren“ wieder entfernt.', beispiel: true
  }
};
