/* Beispielhaus für „Grundriss und Einrichtung“ (Nutzerwunsch 08.10.2026): erfundenes kleines Haus,
   Grundfläche 10 × 8 m, 6 Zimmer auf zwei Etagen, dazu Küche, 2 Bäder, Flure, Terrasse, Garage, Keller.
   Alle Maße erfunden, keine echten Daten. Möbelmaße (w, d) ergänzt grundriss.js aus daten/moebel.js.
   Sollwerte (tmp/grundriss_test.ps1): Wohnfläche EG 80 + Terrasse 16,5 × 25 % = 84,125;
   DG 18 + 18 + 11,2 + 8,75 + 12,25 = 68,2; zusammen 152,3 m². Nutzfläche Garage 18 + Keller 80 = 98 m². */
window.DATEN = window.DATEN || {};
window.DATEN.beispielhaus = {
  app: 'immo-grundriss', version: 1, aktiv: 0, wandhoehe: 2.5, beispiel: true,
  preise: {}, mengen: { leuchte: 11, vorhang: 12, matratze140: 2 },
  etagen: [
    {
      name: 'Beispiel: Erdgeschoss', bild: null, raeume: [
        { name: 'Wohnzimmer', art: 'voll', punkte: [[0, 0], [5.5, 0], [5.5, 4.5], [0, 4.5]] },
        { name: 'Esszimmer', art: 'voll', punkte: [[5.5, 0], [10, 0], [10, 4.5], [5.5, 4.5]] },
        { name: 'Arbeitszimmer', art: 'voll', punkte: [[0, 4.5], [3, 4.5], [3, 8], [0, 8]] },
        { name: 'Bad', art: 'voll', punkte: [[3, 4.5], [4.5, 4.5], [4.5, 8], [3, 8]] },
        { name: 'Flur', art: 'voll', punkte: [[4.5, 4.5], [6, 4.5], [6, 8], [4.5, 8]] },
        { name: 'Küche', art: 'voll', punkte: [[6, 4.5], [10, 4.5], [10, 8], [6, 8]] },
        { name: 'Terrasse', art: 'balkon', balkon: 25, punkte: [[0, -3], [5.5, -3], [5.5, 0], [0, 0]] },
        { name: 'Garage', art: 'zubehoer', separat: true, punkte: [[10, 0], [13, 0], [13, 6], [10, 6]] }
      ],
      teile: [
        { art: 'sofa', x: 2.75, y: 3.9 }, { art: 'couchtisch', x: 2.75, y: 2.9 }, { art: 'tvboard', x: 2.75, y: 0.3 },
        { art: 'esstisch', x: 7.75, y: 2.25 },
        { art: 'stuhl', x: 7.4, y: 1.55 }, { art: 'stuhl', x: 8.1, y: 1.55 },
        { art: 'stuhl', x: 7.4, y: 2.95, dreh: 180 }, { art: 'stuhl', x: 8.1, y: 2.95, dreh: 180 },
        { art: 'kueche', x: 8.5, y: 7.7 }, { art: 'kuehlschrank', x: 6.4, y: 7.7 },
        { art: 'schreibtisch', x: 1.5, y: 7.7 }, { art: 'buerostuhl', x: 1.5, y: 7.0 }, { art: 'regal', x: 0.2, y: 6, dreh: 90 },
        { art: 'waschmaschine', x: 3.35, y: 7.65 }, { art: 'spiegelschrank', x: 4.05, y: 7.9 },
        { art: 'tuer', x: 5.0, y: 4.5 }, { art: 'tuer', x: 1.5, y: 4.5 },
        { art: 'tuer', x: 6, y: 6.5, dreh: 90 }, { art: 'tuer', x: 4.5, y: 6.5, dreh: 90 }
      ]
    },
    {
      name: 'Beispiel: Dachgeschoss', bild: null, raeume: [
        { name: 'Schlafzimmer', art: 'voll', teil12: 20, teil0: 10, punkte: [[0, 0], [5, 0], [5, 4.5], [0, 4.5]] },
        { name: 'Kinderzimmer 1', art: 'voll', teil12: 20, teil0: 10, punkte: [[5, 0], [10, 0], [10, 4.5], [5, 4.5]] },
        { name: 'Kinderzimmer 2', art: 'voll', teil12: 20, teil0: 10, punkte: [[0, 4.5], [4, 4.5], [4, 8], [0, 8]] },
        { name: 'Bad', art: 'voll', punkte: [[4, 4.5], [6.5, 4.5], [6.5, 8], [4, 8]] },
        { name: 'Flur', art: 'voll', punkte: [[6.5, 4.5], [10, 4.5], [10, 8], [6.5, 8]] }
      ],
      teile: [
        { art: 'bett180', x: 2.5, y: 1.25 }, { art: 'nachttisch', x: 1.1, y: 0.4 }, { art: 'nachttisch', x: 3.9, y: 0.4 }, { art: 'schrank3', x: 2.5, y: 4.2 },
        { art: 'bett140', x: 6.0, y: 1.25 }, { art: 'schrank2', x: 9.4, y: 4.2 }, { art: 'schreibtisch', x: 8.5, y: 0.4 },
        { art: 'bett140', x: 1.0, y: 6.35 }, { art: 'schreibtisch', x: 3.0, y: 7.65 }, { art: 'schrank2', x: 3.4, y: 4.85 },
        { art: 'spiegelschrank', x: 5.25, y: 7.9 }
      ]
    },
    {
      name: 'Beispiel: Keller', bild: null, raeume: [
        { name: 'Kellerraum', art: 'zubehoer', punkte: [[0, 0], [6, 0], [6, 8], [0, 8]] },
        { name: 'Heizraum', art: 'zubehoer', punkte: [[6, 0], [10, 0], [10, 8], [6, 8]] }
      ],
      teile: [{ art: 'trockner', x: 0.5, y: 0.5 }]
    }
  ]
};
