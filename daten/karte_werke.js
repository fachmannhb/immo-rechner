/* Große Werke für die Sterne der Deutschlandkarte. Zwei Quellenarten:
   (1) Einträge mit Konzern-URL: geöffnete offizielle Konzernseite (Bericht recherche/11_werke.md, Abruf 08.10.2026;
       Stichprobe BMW Dingolfing selbst geprüft).
   (2) Einträge mit Feld "quelle" (Wikipedia: <Artikeltitel>, Abruf 09.10.2026): Nutzerentscheidung 09.10.2026, weil
       einige Konzernseiten den Abruf sperren, reicht Wikipedia. Ort des Werks und Beschäftigte stehen so im Artikel;
       Beschäftigte nur, wenn der Artikel eine Zahl zum Werk nennt (sonst leer, Jahr in Klammern wie im Artikel).
   Kreisschlüssel aus dem Destatis-Gemeindeverzeichnis (daten/karte_orte.js), nicht aus den Quellen.
   Zweiter Lauf 09.10.2026: VW Emden, Zwickau, Hannover, Kassel (Baunatal), Salzgitter, Braunschweig, Infineon Dresden,
   Bosch Dresden, Meyer Werft Papenburg (Zahlen mit Jahr aus dem Rohtext des jeweiligen Artikels).
   Weiterhin ohne Stern: Siemens (Wikipedia nennt keine belegte aktuelle Werkszahl), Bosch-Standorte außer Reutlingen und
   Dresden (Bamberg ohne Artikel, Feuerbach/Homburg nur in der Liste des Stellenabbaus), Ford Saarlouis (Fahrzeugproduktion
   im November 2025 eingestellt), VW Gläserne Manufaktur Dresden (Artikel schreibt in der Vergangenheit), ZF Friedrichshafen,
   Salzgitter AG, Continental, Bayer, Schaeffler (Artikel nennen nur Konzernzahlen, kein Werk mit Zahl), ESMC Dresden
   (Fabrik im Bau); Intel Magdeburg ist abgesagt. */
window.DATEN = window.DATEN || {};
window.DATEN.kartewerke = {
  abruf: '08.10.2026 (Konzernseiten), 09.10.2026 (Wikipedia)',
  werke: [
    { firma: 'BASF', werk: 'Stammwerk Ludwigshafen', ort: 'Ludwigshafen am Rhein', ags: '07314', besch: 'rund 33.000 (ohne Jahr)', url: 'https://www.basf.com/global/de/who-we-are/organization/locations/europe/german-sites/ludwigshafen/the-site' },
    { firma: 'Volkswagen', werk: 'Werk Wolfsburg', ort: 'Wolfsburg', ags: '03103', besch: 'rund 70.000 (Stand 01.03.2024)', url: 'https://www.volkswagen-newsroom.com/de/werk-wolfsburg-das-herz-der-marke-vw-6811' },
    { firma: 'BMW', werk: 'Werk Dingolfing', ort: 'Dingolfing', ags: '09279', besch: 'über 18.000 (ohne Jahr)', url: 'https://www.bmwgroup-werke.com/dingolfing/de.html' },
    { firma: 'BMW', werk: 'Werk München', ort: 'München', ags: '09162', besch: 'ca. 6.100 (ohne Jahr)', url: 'https://www.bmwgroup-werke.com/muenchen/de.html' },
    { firma: 'BMW', werk: 'Werk Leipzig', ort: 'Leipzig', ags: '14713', besch: 'ca. 6.800 (ohne Jahr)', url: 'https://www.bmwgroup-werke.com/leipzig/de.html' },
    { firma: 'BMW', werk: 'Werk Regensburg', ort: 'Regensburg', ags: '09362', besch: 'ca. 9.000 (ohne Jahr)', url: 'https://www.bmwgroup-werke.com/regensburg/de.html' },
    { firma: 'BMW', werk: 'Werk Landshut', ort: 'Ergolding (bei Landshut)', ags: '09274', besch: 'ca. 3.800 (ohne Jahr)', url: 'https://www.bmwgroup-werke.com/landshut/de.html' },
    { firma: 'BMW', werk: 'Werk Berlin (Motorräder)', ort: 'Berlin', ags: '11000', besch: 'ca. 2.400 (ohne Jahr)', url: 'https://www.bmwgroup-werke.com/berlin/de.html' },
    { firma: 'Airbus', werk: 'Hamburg', ort: 'Hamburg', ags: '02000', besch: '', url: 'https://www.airbus.com/de/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-germany' },
    { firma: 'Airbus', werk: 'Bremen', ort: 'Bremen', ags: '04011', besch: '', url: 'https://www.airbus.com/de/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-germany' },
    { firma: 'Airbus', werk: 'Donauwörth (Hubschrauber)', ort: 'Donauwörth', ags: '09779', besch: 'mehr als 7.000 (ohne Jahr)', url: 'https://www.airbus.com/de/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-germany' },
    { firma: 'Airbus', werk: 'Manching (Verteidigung)', ort: 'Manching', ags: '09186', besch: '', url: 'https://www.airbus.com/de/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-germany' },
    /* ---- Wikipedia, Abruf 09.10.2026 ---- */
    { firma: 'Mercedes-Benz', werk: 'Werk Sindelfingen', ort: 'Sindelfingen', ags: '08115', besch: 'rund 35.000 (Stand 31.12.2017)', quelle: 'Wikipedia: Mercedes-Benz-Werk Sindelfingen, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Mercedes-Benz-Werk_Sindelfingen' },
    { firma: 'Mercedes-Benz', werk: 'Werk Untertürkheim', ort: 'Stuttgart (Untertürkheim)', ags: '08111', besch: 'rund 19.000 (Stand 31.12.2017)', quelle: 'Wikipedia: Mercedes-Benz Cars, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Mercedes-Benz_Cars' },
    { firma: 'Mercedes-Benz', werk: 'Werk Rastatt', ort: 'Rastatt', ags: '08216', besch: 'über 6.100 (Stand September 2023)', quelle: 'Wikipedia: Mercedes-Benz Cars, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Mercedes-Benz_Cars' },
    { firma: 'Mercedes-Benz', werk: 'Werk Bremen', ort: 'Bremen (Sebaldsbrück)', ags: '04011', besch: 'über 12.500 (Stand 31.12.2017)', quelle: 'Wikipedia: Mercedes-Benz-Werk Bremen, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Mercedes-Benz-Werk_Bremen' },
    { firma: 'Mercedes-Benz', werk: 'Lkw-Werk Wörth', ort: 'Wörth am Rhein', ags: '07334', besch: '10.326 (Ende 2019)', quelle: 'Wikipedia: Mercedes-Benz-Werk Wörth, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Mercedes-Benz-Werk_W%C3%B6rth' },
    { firma: 'Audi', werk: 'Werk Ingolstadt', ort: 'Ingolstadt', ags: '09161', besch: '', quelle: 'Wikipedia: Audi, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Audi' },
    { firma: 'Audi', werk: 'Werk Neckarsulm', ort: 'Neckarsulm', ags: '08125', besch: '', quelle: 'Wikipedia: Audi, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Audi' },
    { firma: 'Porsche', werk: 'Stammwerk Zuffenhausen', ort: 'Stuttgart (Zuffenhausen)', ags: '08111', besch: '', quelle: 'Wikipedia: Porsche, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Porsche' },
    { firma: 'Porsche', werk: 'Werk Leipzig', ort: 'Leipzig', ags: '14713', besch: '4.100 (August 2016)', quelle: 'Wikipedia: Porsche Leipzig, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Porsche_Leipzig' },
    { firma: 'Ford', werk: 'Stammwerk Köln-Niehl', ort: 'Köln (Niehl)', ags: '05315', besch: 'über 17.000 am Standort Köln (Oktober 2009)', quelle: 'Wikipedia: Ford-Werke, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Ford-Werke' },
    { firma: 'Opel', werk: 'Werk Rüsselsheim', ort: 'Rüsselsheim am Main', ags: '06433', besch: '', quelle: 'Wikipedia: Opel (Abschnitt Opel-Werk Rüsselsheim), Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Opel' },
    { firma: 'Tesla', werk: 'Gigafactory Berlin-Brandenburg', ort: 'Grünheide (Mark)', ags: '12067', besch: '', quelle: 'Wikipedia: Tesla Gigafactory Berlin-Brandenburg, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Tesla_Gigafactory_Berlin-Brandenburg' },
    { firma: 'Bosch', werk: 'Halbleiterwerke Reutlingen', ort: 'Reutlingen', ags: '08415', besch: '', quelle: 'Wikipedia: Robert Bosch GmbH, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Robert_Bosch_GmbH' },
    { firma: 'Thyssenkrupp Steel', werk: 'Stahlwerk Duisburg-Nord', ort: 'Duisburg', ags: '05112', besch: 'knapp 13.500 (Stand 2024)', quelle: 'Wikipedia: Thyssenkrupp Steel Europe, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Thyssenkrupp_Steel_Europe' },
    { firma: 'Volkswagen', werk: 'Werk Emden', ort: 'Emden', ags: '03402', besch: '7.700 (Jahr 2025)', quelle: 'Wikipedia: Volkswagenwerk Emden, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Volkswagenwerk_Emden' },
    { firma: 'Volkswagen', werk: 'Werk Zwickau (Mosel)', ort: 'Zwickau (Mosel)', ags: '14524', besch: '8.000 (Jahr 2025)', quelle: 'Wikipedia: Volkswagenwerk Zwickau, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Volkswagenwerk_Zwickau' },
    { firma: 'Volkswagen', werk: 'Werk Hannover (Nutzfahrzeuge)', ort: 'Hannover (Stöcken)', ags: '03241', besch: 'rund 15.000 (Jahr 2022)', quelle: 'Wikipedia: Volkswagenwerk Hannover, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Volkswagenwerk_Hannover' },
    { firma: 'Volkswagen', werk: 'Werk Kassel (Komponenten)', ort: 'Baunatal', ags: '06633', besch: 'rund 15.000 (ohne Jahr)', quelle: 'Wikipedia: Volkswagenwerk Kassel, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Volkswagenwerk_Kassel' },
    { firma: 'Volkswagen', werk: 'Motorenwerk Salzgitter', ort: 'Salzgitter (Beddingen)', ags: '03102', besch: 'gut 7.500 (ohne Jahr)', quelle: 'Wikipedia: Volkswagenwerk Salzgitter, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Volkswagenwerk_Salzgitter' },
    { firma: 'Volkswagen', werk: 'Werk Braunschweig', ort: 'Braunschweig', ags: '03101', besch: 'rund 7.000 (Stand 2024)', quelle: 'Wikipedia: Volkswagenwerk Braunschweig, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Volkswagenwerk_Braunschweig' },
    { firma: 'Infineon', werk: 'Standort Dresden (größter Fertigungsstandort)', ort: 'Dresden', ags: '14612', besch: '3.250 (Stand 2023)', quelle: 'Wikipedia: Infineon Technologies, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Infineon_Technologies' },
    { firma: 'Bosch', werk: 'Halbleiterwerk Dresden', ort: 'Dresden', ags: '14612', besch: '', quelle: 'Wikipedia: Robert Bosch GmbH, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Robert_Bosch_GmbH' },
    { firma: 'Meyer Werft', werk: 'Werft Papenburg', ort: 'Papenburg', ags: '03454', besch: '3.200 (Unternehmen, ohne Jahr)', quelle: 'Wikipedia: Meyer Werft, Abruf 09.10.2026', url: 'https://de.wikipedia.org/wiki/Meyer_Werft' }
  ]
};
