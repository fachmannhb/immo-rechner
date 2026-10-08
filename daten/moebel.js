/* Möbel und Umbau-Elemente für „Grundriss und Einrichtung“.
   Preise: Bericht recherche/08_moebel_preise.md, Abruf 08.10.2026, fast nur IKEA Deutschland
   (Einstiegs- bis oberes IKEA-Niveau, kein belegtes Mittelsegment anderer Händler).
   Stichproben selbst geprüft 08.10.2026: KLEPPSTAD 2-/3-türig, Innentür clean-invoice.
   Maße in cm (Breite × Tiefe × Höhe); „masz:'geschätzt'“ = Zeichenmaß nicht von der Quelle.
   start:null = kein geprüfter Preis, die Seite zeigt „Preis eintragen“.
   gruppe: wohnung | monteur | umbau (umbau zählt als Umbau, alles andere als Einrichtung);
   auch: in welchen weiteren Katalog-Gruppen das Teil erscheint.
   einheit 'm': Menge = Länge des Teils im Plan (Breite). betten: Schlafplätze.
   zeichnen:false = nicht im Plan, Menge in der Kostenliste; jeBett = Menge je Schlafplatz. */
window.DATEN = window.DATEN || {};
(function () {
  var san = (window.DATEN.sanierung && window.DATEN.sanierung.bauteile) || [];
  function ausSanierung(id) { return san.filter(function (b) { return b.id === id; })[0] || {}; }
  var bad = ausSanierung('bad'), tuer = ausSanierung('tueren');
  var IK = 'ikea.com/de, Abruf 08.10.2026';

  window.DATEN.moebel = {
    abruf: '08.10.2026',
    artikel: [
      /* Wohnung */
      { id: 'bett140', gruppe: 'wohnung', auch: ['monteur'], name: 'Doppelbett 140×200 (Gestell und Lattenrost, ohne Matratze)', kurz: 'Bett 140', form: 'bett', betten: 2, breite: 150, tiefe: 210, hoehe: 90, masz: 'geschätzt', von: 140, bis: 348, start: 259, quelle: IK + '; Gestell 90–179 €, Lattenrost 50–169 €' },
      { id: 'matratze140', gruppe: 'wohnung', name: 'Matratze 140×200', zeichnen: false, von: null, bis: null, start: null, quelle: 'Noch kein geprüfter Preis' },
      { id: 'bett180', gruppe: 'wohnung', name: 'Doppelbett 180×200 (nur Gestell)', kurz: 'Bett 180', form: 'bett', betten: 2, breite: 190, tiefe: 210, hoehe: 90, masz: 'geschätzt', von: 299, bis: 499, start: 299, quelle: IK + '; Lattenrost und Matratze kommen dazu' },
      { id: 'schrank2', gruppe: 'wohnung', auch: ['monteur'], name: 'Kleiderschrank 2-türig', kurz: 'Schrank', breite: 79, tiefe: 55, hoehe: 176, von: 69, bis: 89.99, start: 79, quelle: IK + ' (KLEPPSTAD, BRIMNES)' },
      { id: 'schrank3', gruppe: 'wohnung', name: 'Kleiderschrank 3-türig', kurz: 'Schrank', breite: 117, tiefe: 55, hoehe: 176, von: 99.99, bis: 282, start: 115, quelle: IK + ' (KLEPPSTAD bis PAX)' },
      { id: 'sofa', gruppe: 'wohnung', name: 'Sofa 3-Sitzer', kurz: 'Sofa', breite: 218, tiefe: 88, hoehe: 88, von: 279, bis: 899, start: 499, quelle: IK + ' (EKTORP)' },
      { id: 'couchtisch', gruppe: 'wohnung', name: 'Couchtisch', kurz: 'Tisch', breite: 90, tiefe: 55, hoehe: 45, masz: 'Höhe geschätzt', von: 19.99, bis: 149, start: 59.99, quelle: IK },
      { id: 'esstisch', gruppe: 'wohnung', name: 'Esstisch für 4', kurz: 'Esstisch', breite: 125, tiefe: 75, hoehe: 74, masz: 'Höhe geschätzt', von: 59.99, bis: 159, start: 129, quelle: IK },
      { id: 'stuhl', gruppe: 'wohnung', auch: ['monteur'], name: 'Stuhl', kurz: 'Stuhl', breite: 45, tiefe: 50, hoehe: 80, masz: 'geschätzt', von: 69.99, bis: 99.99, start: 79.99, quelle: IK },
      { id: 'schreibtisch', gruppe: 'wohnung', auch: ['monteur'], name: 'Schreibtisch', kurz: 'Schreibtisch', breite: 120, tiefe: 60, hoehe: 75, masz: 'Höhe geschätzt', von: 39.99, bis: 249, start: 89.98, quelle: IK },
      { id: 'buerostuhl', gruppe: 'wohnung', name: 'Bürostuhl', kurz: 'Stuhl', breite: 60, tiefe: 60, hoehe: 100, masz: 'geschätzt', von: 25, bis: 349, start: 79.99, quelle: IK },
      { id: 'kommode', gruppe: 'wohnung', name: 'Kommode', kurz: 'Kommode', breite: 70, tiefe: 50, hoehe: 75, von: 49, bis: 199, start: 99.99, quelle: IK },
      { id: 'regal', gruppe: 'wohnung', name: 'Regal', kurz: 'Regal', breite: 80, tiefe: 28, hoehe: 202, von: 29, bis: 99, start: 59.99, quelle: IK + ' (BILLY)' },
      { id: 'nachttisch', gruppe: 'wohnung', auch: ['monteur'], name: 'Nachttisch', kurz: 'NT', breite: 39, tiefe: 41, hoehe: 53, von: 14, bis: 119, start: 29.99, quelle: IK },
      { id: 'tvboard', gruppe: 'wohnung', name: 'TV-Board', kurz: 'TV', breite: 120, tiefe: 41, hoehe: 53, von: 18, bis: 399, start: 59.99, quelle: IK },
      { id: 'kueche', gruppe: 'wohnung', auch: ['monteur'], name: 'Küchenzeile 270 cm mit Geräten', kurz: 'Küche', breite: 270, tiefe: 60, hoehe: 200, von: 1299, bis: 2349, start: 1299, quelle: 'poco.de, Abruf 08.10.2026; Versand extra' },
      { id: 'kuehlschrank', gruppe: 'wohnung', name: 'Kühlschrank', kurz: 'Kühl', breite: 55, tiefe: 57, hoehe: 83, von: 119, bis: 229, start: 229, quelle: IK },
      { id: 'waschmaschine', gruppe: 'wohnung', auch: ['monteur'], name: 'Waschmaschine', kurz: 'WM', breite: 60, tiefe: 57, hoehe: 86, von: 299, bis: 429, start: 299, quelle: IK },
      { id: 'trockner', gruppe: 'wohnung', auch: ['monteur'], name: 'Wäschetrockner', kurz: 'Tr', breite: 60, tiefe: 60, hoehe: 85, von: 299.99, bis: 364.95, start: 329.99, quelle: 'poco.de, Abruf 08.10.2026' },
      { id: 'spiegelschrank', gruppe: 'wohnung', name: 'Spiegelschrank Bad', kurz: 'Spiegel', breite: 50, tiefe: 17, hoehe: 75, von: 89, bis: 289, start: 119, quelle: IK },
      { id: 'leuchte', gruppe: 'wohnung', name: 'Deckenleuchte (Anzahl eintragen)', zeichnen: false, von: 6.99, bis: 59.99, start: 29.99, quelle: IK },
      { id: 'vorhang', gruppe: 'wohnung', name: 'Vorhang (Anzahl eintragen)', zeichnen: false, von: 7.99, bis: 69.99, start: 24.99, quelle: IK + '; ob je Stück oder Paar, sagt die Seite nicht' },

      /* Monteurzimmer */
      { id: 'einzelbett', gruppe: 'monteur', name: 'Einzelbett 90×200 mit Matratze (ohne Lattenrost)', kurz: 'Bett', form: 'bett', betten: 1, breite: 95, tiefe: 205, hoehe: 80, masz: 'geschätzt', von: 110, bis: 368, start: 159, quelle: IK },
      { id: 'etagenbett', gruppe: 'monteur', name: 'Etagenbett 90×200 mit 2 Matratzen', kurz: 'Etagenbett', form: 'bett', betten: 2, breite: 100, tiefe: 210, hoehe: 160, masz: 'geschätzt', von: 229, bis: 527, start: 327, quelle: IK + '; Summe aus Gestell und Matratzen gerechnet' },
      { id: 'spind', gruppe: 'monteur', name: 'Metallspind 1-türig', kurz: 'Spind', breite: 38, tiefe: 45, hoehe: 180, masz: 'vor Zeichnen prüfen', von: 105.99, bis: 319.99, start: 290, quelle: 'otto.de, Abruf 08.10.2026' },
      { id: 'tischkuehl', gruppe: 'monteur', name: 'Tisch-Kühlschrank', kurz: 'Kühl', breite: 47, tiefe: 45, hoehe: 49, von: 119, bis: 119, start: 119, quelle: IK + ' (ein Gerät)' },
      { id: 'gemeinschaftstisch', gruppe: 'monteur', name: 'Tisch für 6', kurz: 'Tisch 6', breite: 170, tiefe: 80, hoehe: 74, masz: 'Höhe geschätzt', von: 159, bis: 499, start: 159, quelle: IK },
      { id: 'waesche', gruppe: 'monteur', name: 'Bettwäsche und 2 Handtücher', zeichnen: false, jeBett: 1, von: 21.77, bis: 65.97, start: 27.97, quelle: IK + '; Summe gerechnet' },

      /* Umbau */
      { id: 'tuer', gruppe: 'umbau', name: 'Innentür mit Zarge und Einbau', kurz: 'Tür', form: 'tuer', breite: 90, tiefe: 10, hoehe: 200, von: tuer.von || 250, bis: tuer.bis || 450, start: tuer.start || 350, quelle: 'wie „Umbauen und renovieren“: ' + (tuer.quelle || 'clean-invoice.com') },
      { id: 'fenster', gruppe: 'umbau', name: 'Fenster tauschen (Kunststoff, mit Einbau)', kurz: 'Fenster', form: 'fenster', breite: 120, tiefe: 15, hoehe: 130, von: 340, bis: 580, start: 420, quelle: 'Preisratgeber, Abruf 08.10.2026, einfache Verglasung' },
      { id: 'wandneu', gruppe: 'umbau', name: 'Trockenbauwand neu (je m Länge, 2,5 m hoch)', kurz: 'neue Wand', form: 'wand', einheit: 'm', breite: 300, tiefe: 10, hoehe: 250, von: 125, bis: 262.5, start: 155, quelle: '50–105 €/m² × 2,5 m Höhe, Abruf 08.10.2026' },
      { id: 'wandweg', gruppe: 'umbau', name: 'Nicht tragende Wand entfernen (je m Länge, 2,5 m hoch)', kurz: 'Wand weg', form: 'wandweg', einheit: 'm', breite: 300, tiefe: 15, hoehe: 250, von: null, bis: null, start: 700, quelle: 'Nur eine Quelle (sanier.de, ca. 280 €/m² × 2,5 m), unsicher. Vorher Statiker fragen, ob die Wand wirklich nicht trägt.' },
      { id: 'badneu', gruppe: 'umbau', name: 'Bad komplett einbauen', kurz: 'Bad neu', form: 'flaeche', breite: 200, tiefe: 250, hoehe: 5, von: bad.von || 16000, bis: bad.bis || 28000, start: bad.start || 20000, quelle: 'wie „Umbauen und renovieren“: ' + (bad.quelle || '') },
      { id: 'kuechemontage', gruppe: 'umbau', name: 'Küche montieren (je m Küchenzeile)', kurz: 'Küchenmontage', form: 'flaeche', einheit: 'm', breite: 270, tiefe: 60, hoehe: 5, von: 150, bis: 350, start: 250, quelle: 'Preisratgeber, Abruf 08.10.2026; Wasser und Elektro extra (Elektro nur Fachbetrieb)' }
    ]
  };
})();
