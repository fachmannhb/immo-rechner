/* Portale für die Objektsuche. Prüfstand je Eintrag, geprüft am 07.10.2026 per HTTP-Abruf
   (Recherche 01 und eigener Test tmp/ka_preis_test.py). */
window.DATEN = window.DATEN || {};
window.DATEN.portale = {
  geprueft: '2026-10-07',
  liste: [
    { id: 'kleinanzeigen', name: 'Kleinanzeigen', stand: 'Ort und Höchstpreis geprüft (Oldenburg, Bremen); Mehrfamilienhaus-Filter am Seitentitel erkannt',
      hinweis: 'Ort wird als Suchwort übergeben; Treffer aus der Umgebung möglich.' },
    { id: 'immoscout', name: 'ImmoScout24', stand: 'Muster ungeprüft (Robotersperre beim Test)',
      hinweis: 'Ort als Pfad aus Bundesland und Ort gebildet; passt der Ort nicht, im Portal neu wählen.' },
    { id: 'immowelt', name: 'Immowelt', stand: 'nur Bremen geprüft',
      hinweis: 'Andere Orte: Startseite, Ort dort eingeben. Höchstpreis wird nicht übernommen.' },
    { id: 'sparkasse', name: 'Sparkasse Immobilien', stand: 'Bremen mit Preis geprüft',
      hinweis: 'Andere Orte: Ortsseite des Portals, nicht für jeden Ort vorhanden.' },
    { id: 'zvg', name: 'ZVG-Portal (Zwangsversteigerungen)', stand: 'Bundesland und Ort geprüft',
      hinweis: 'Amtliches Portal der Justiz. Öffnet in neuem Fenster per Formular.' }
  ],
  volksbank: 'Kein bundesweites Volksbank-Portal gefunden; Angebote liegen bei der jeweiligen Bank vor Ort.',
  /* Bremen: fertige, geprüfte Adressen aus Recherche 01 */
  bremen: {
    immowelt: {
      haus: 'https://www.immowelt.de/suche/kaufen/haus/bremen/bremen-28219/ad08de2110',
      haus300: 'https://www.immowelt.de/suche/kaufen/haus/preis--300000/bremen/bremen-28219/ad08de2110',
      wohnung: 'https://www.immowelt.de/suche/kaufen/wohnung/bremen/bremen-28219/ad08de2110',
      mfh: 'https://www.immowelt.de/suche/kaufen/haus/mehrfamilienhaus/bremen/bremen-28219/ad08de2110',
      anlage: 'https://www.immowelt.de/suche/kaufen/immobilien/kapitalanlage/bremen/bremen-28219/ad08de2110'
    },
    sparkasseOrt: '53.0756%2F8.80933%2F0__Bremen'
  }
};
