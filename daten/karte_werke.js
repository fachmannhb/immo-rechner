/* Große Werke für die Sterne der Deutschlandkarte. Nur Standorte, die auf einer geöffneten offiziellen
   Konzernseite stehen (Bericht recherche/11_werke.md, Abruf 08.10.2026; Stichprobe BMW Dingolfing selbst geprüft).
   Kreisschlüssel aus dem Destatis-Gemeindeverzeichnis (daten/karte_orte.js), nicht aus dem Bericht.
   Nicht belegt und darum ohne Stern: u. a. Mercedes-Benz (Konzernseiten sperren den Abruf), Audi, Porsche, Ford,
   Opel, Tesla, Bosch, Siemens; Intel Magdeburg ist abgesagt. Beschäftigte: so auf der Seite, meist ohne Jahr. */
window.DATEN = window.DATEN || {};
window.DATEN.kartewerke = {
  abruf: '08.10.2026',
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
    { firma: 'Airbus', werk: 'Manching (Verteidigung)', ort: 'Manching', ags: '09186', besch: '', url: 'https://www.airbus.com/de/about-us/our-worldwide-presence/airbus-in-europe/airbus-in-germany' }
  ]
};
