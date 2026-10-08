/* Grunderwerbsteuer je Bundesland.
   Geprüft 07.10.2026. Bremen amtlich (service.bremen.de, Seite aktualisiert 17.09.2026).
   Übrige Länder: Wikipedia-Tabelle und mehrere Übersichtsseiten 2026 nennen dieselben Werte,
   kein Landesgesetz einzeln aufgerufen. Vor einem Kauf beim Finanzamt gegenprüfen.
   zvg = Länderkürzel des ZVG-Portals. */
window.DATEN = window.DATEN || {};
window.DATEN.grest = {
  geprueft: '2026-10-07',
  quelleAmtlich: { name: 'service.bremen.de, Grunderwerbsteuer', url: 'https://www.service.bremen.de/dienstleistungen/grunderwerbsteuer-9673' },
  quelleSonst: { name: 'Wikipedia, Grunderwerbsteuer (Deutschland), Tabelle Steuersatz; Übersichten 2026', url: 'https://de.wikipedia.org/wiki/Grunderwerbsteuer_(Deutschland)' },
  laender: [
    { land: 'Baden-Württemberg', satz: 5.0, seit: '05.11.2011', amtlich: false, zvg: 'bw' },
    { land: 'Bayern', satz: 3.5, seit: 'seit 1997 unverändert', amtlich: false, zvg: 'by' },
    { land: 'Berlin', satz: 6.0, seit: '01.01.2014', amtlich: false, zvg: 'be' },
    { land: 'Brandenburg', satz: 6.5, seit: '01.07.2015', amtlich: false, zvg: 'br' },
    { land: 'Bremen', satz: 5.5, seit: '01.07.2025 (vorher 5,0 %)', amtlich: true, zvg: 'hb' },
    { land: 'Hamburg', satz: 5.5, seit: '01.01.2023', amtlich: false, zvg: 'hh' },
    { land: 'Hessen', satz: 6.0, seit: '01.08.2014', amtlich: false, zvg: 'he' },
    { land: 'Mecklenburg-Vorpommern', satz: 6.0, seit: '01.07.2019', amtlich: false, zvg: 'mv' },
    { land: 'Niedersachsen', satz: 5.0, seit: '01.01.2014', amtlich: false, zvg: 'ni' },
    { land: 'Nordrhein-Westfalen', satz: 6.5, seit: '01.01.2015', amtlich: false, zvg: 'nw' },
    { land: 'Rheinland-Pfalz', satz: 5.0, seit: '01.03.2012', amtlich: false, zvg: 'rp' },
    { land: 'Saarland', satz: 6.5, seit: '01.01.2015', amtlich: false, zvg: 'sl' },
    { land: 'Sachsen', satz: 5.5, seit: '01.01.2023', amtlich: false, zvg: 'sn' },
    { land: 'Sachsen-Anhalt', satz: 5.0, seit: '01.03.2012', amtlich: false, zvg: 'st' },
    { land: 'Schleswig-Holstein', satz: 6.5, seit: '01.01.2014', amtlich: false, zvg: 'sh' },
    { land: 'Thüringen', satz: 5.0, seit: '01.01.2024 (vorher 6,5 %)', amtlich: false, zvg: 'th' }
  ],
  /* Spannen für Notar/Grundbuch und Makler, Quelle: Recherche 01 vom 07.10.2026 */
  notar: { standard: 2.0, text: 'Notar ca. 0,5 bis 1 %, Grundbuch ca. 0,5 % (ImmoScout24-Ratgeber, aktualisiert 05.05.2026); 2 % ist ein vorsichtiger Ansatz und entspricht Folie 4.', url: 'https://www.immobilienscout24.de/wissen/kaufen/notargebuehren.html' },
  makler: { standard: 3.57, text: 'Wohnung/Einfamilienhaus: Käufer zahlt seit 23.12.2020 höchstens die Hälfte. Mehrfamilienhaus, Gewerbe, Anlageobjekt: frei verhandelbar, meist 3 bis 7,14 % inkl. MwSt. (Ratgeberseiten, nur als Suchtreffer gesehen, unsicher). Im Exposé nachlesen.' }
};
