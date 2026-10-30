/* Gas- und Heizölpreis für Heizkostensatz und Amortisation (Welle D, Teil 2b). Von Hand gepflegt. Quelle aller Zeilen: recherche/40_gas_oel_heizgradtage.md (Bericht 40), Abruf 27.10.2026; "quelle" = Quellennummer dort.
   Status "geprüft" = am Original gelesen; "prüfen vor Nutzung" = Portalpreis, Suchtreffer oder eigene Rechnung. Heizöl schwankt täglich: der Startwert ist nur ein Beispiel, die Seite lässt den eigenen Preis eintragen.
   Umrechnung Heizöl in kWh: Heizwert 10,05 kWh/l (geprüft); der Brennwert ca. 10,6 (Anbieter-Suchtreffer) steht nur zum Vergleich (Entscheidung in der README, Tabelle Welle D Teil 2b). */
window.DATEN = window.DATEN || {};
window.DATEN.energiepreise = {
  meta: { titel: 'Gas- und Heizölpreis', abruf: '2026-10-27' },
  quellen: {
    Q1: { titel: 'Destatis, Pressemitteilung Nr. 345 vom 30.09.2026: Strom- und Gaspreise für Haushalte im 1. Halbjahr 2026', url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/09/PD26_345_61243.html' },
    Q3: { titel: 'Tecson, Heizölpreise Deutschland-Durchschnitt (Tagespreis 27.10.2026, 3.000 l, inkl. MwSt.)', url: 'https://www.tecson.de/heizoelpreise.html' },
    Q6: { titel: 'EBeV 2030, Anlage 2 (Dichte und Heizwert Heizöl EL)', url: 'https://www.gesetze-im-internet.de/ebev_2030/anlage_2.html' },
    Q7: { titel: 'Heizungsanbieter-Seite zu Brennwert Öl (Suchtreffer)', url: 'https://www.heizungsdiscount24.de/oel-heizung/brennwert/' }
  },
  eintraege: [
    { id: 'gas_destatis_alle', name: 'Erdgas, alle Haushalte, 1. Halbjahr 2026, brutto', wert: 11.58, einheit: 'ct/kWh', quelle: 'Q1', abruf: '2026-10-27', status: 'geprüft',
      hinweis: 'Grund-, Arbeitspreis, Netzentgelte, Steuern, Abgaben; 5,3 % weniger als im 2. Halbjahr 2025. Ob die MwSt. enthalten ist, steht in der Mitteilung nicht ausdrücklich.' },
    { id: 'oel_tecson', name: 'Heizöl EL, Tagespreis Deutschland-Durchschnitt', wert: 180, einheit: '€/100 l', quelle: 'Q3', abruf: '2026-10-27', status: 'prüfen vor Nutzung',
      hinweis: 'Portal, 3.000 l, inkl. MwSt.; schwankt täglich und mit Menge und Region.' },
    { id: 'oel_heizwert_kwh', name: 'Heizöl EL, Heizwert', wert: 10.05, einheit: 'kWh/l', quelle: 'Q6', abruf: '2026-10-27', status: 'geprüft',
      hinweis: 'Eigene Rechnung aus Q6: 42,8 GJ/t mal 0,845 t/1000 l = 36,17 MJ/l, geteilt durch 3,6.' },
    { id: 'oel_brennwert', name: 'Heizöl EL, Brennwert (nur zum Vergleich)', wert: 10.6, einheit: 'kWh/l', quelle: 'Q7', abruf: '2026-10-27', status: 'prüfen vor Nutzung',
      hinweis: 'Beruht auf "Brennwert 6 % über Heizwert bei Heizöl" eines Anbieters, keine amtliche Quelle.' }
  ]
};
