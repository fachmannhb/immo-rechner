/* Monteurzimmer Bremen: Angebotspreise und Standortindikatoren aus der Präsentation
   (Folie 19 und 20, Abruf 27.09.2026). Angebotsdaten, keine erzielbaren Preise. */
window.DATEN = window.DATEN || {};
window.DATEN.monteurBremen = {
  abruf: '2026-09-27',
  quelle: 'monteurzimmer.de, monteur-zimmer.com, mein-monteurzimmer.de, Anyrooms (laut Präsentation Folie 19)',
  preise: [
    { gebiet: 'Hemelingen / Hastedt', angaben: '43 Angebote auf einem großen Portal; ca. 8,91 bis 22 € p. P./Nacht, weitere aktuelle Angebote 17 bis 19 €' },
    { gebiet: 'Walle / Hafen', angaben: 'Walle 22 Angebote, Beispiel ca. 16 €; Hafennähe ca. 20 € ab einer Woche/Monat' },
    { gebiet: 'Bremen gesamt', angaben: 'Marktübersicht: überwiegend ca. 12 bis 25 € p. P./Nacht; Einzelzimmer und Apartments darüber' }
  ],
  standorte: [
    { gebiet: 'Nordwest / Hafen', orte: 'Gröpelingen, Oslebshausen, Walle', merkmal: 'Industrie- und Hafennähe, Preisbeispiele ca. 16 bis 20 €' },
    { gebiet: 'Ost / Südost', orte: 'Hemelingen, Hastedt, Osterholz', merkmal: 'Nähe Mercedes / Hansalinie, viele sichtbare Angebote' },
    { gebiet: 'Süd / GVZ-Korridor', orte: 'Neustadt, Arsten, Richtung GVZ', merkmal: 'Logistik, Autobahnanbindung, objektbezogen prüfen' }
  ]
};
