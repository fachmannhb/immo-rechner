/* Besichtigungs-Checkliste für die Hauskarten der Merkliste (Block 5, 09.10.2026). Ansprache „Sie“.
   Reine Fragen zum Anschauen, keine Rechts- oder Gutachteraussagen und keine Preise. Ersetzt keinen Sachverständigen.
   Je Punkt: id (stabil, wird mit dem Haus gespeichert, nicht umbenennen), t = Frage, kurz = Halbsatz in Alltagssprache (optional).
   Bewertung je Punkt: ok, beobachten, mangel (gespeichert als 'ok' | 'beob' | 'mangel'). Bei Unterlagen und Fragen heißt „Mangel“: fehlt oder unklar. */
window.DATEN = window.DATEN || {};
window.DATEN.besichtigung = {
  gruppen: [
    { id: 'aussen', titel: 'Außen und Dach', punkte: [
      { id: 'dach', t: 'Dach: Ziegel gebrochen oder verschoben, Moos?' },
      { id: 'rinne', t: 'Dachrinnen und Fallrohre: dicht und frei?' },
      { id: 'fassade', t: 'Fassade: Risse, abgeplatzter Putz, Algen?' },
      { id: 'sockel', t: 'Sockel und Mauerwerk: feuchte Flecken, weiße Ausblühungen?', kurz: 'Weiße Ausblühungen sind ein Zeichen für Feuchtigkeit in der Wand.' },
      { id: 'grundstueck', t: 'Grundstück: fällt das Gelände vom Haus weg, stehen Bäume sehr nah?' }
    ] },
    { id: 'keller', titel: 'Keller und Feuchtigkeit', punkte: [
      { id: 'keller-wand', t: 'Kellerwände: feuchte Flecken, Schimmel, muffiger Geruch?' },
      { id: 'keller-boden', t: 'Kellerboden: nasse Stellen oder Risse?' },
      { id: 'abdichtung', t: 'Wurde der Keller abgedichtet? Gibt es die Rechnung?', kurz: 'Eine Abdichtung hält Wasser von außen aus dem Mauerwerk.' },
      { id: 'dachboden', t: 'Dachboden: Feuchtespuren am Holz, Zustand der Dämmung?' },
      { id: 'lueftung', t: 'Außenwände in den Zimmern: trocken, keine Schimmelecken?' }
    ] },
    { id: 'fenster', titel: 'Fenster und Türen', punkte: [
      { id: 'fenster-zustand', t: 'Fenster: Rahmen und Dichtungen in Ordnung, schließen dicht?' },
      { id: 'verglasung', t: 'Scheiben: zweifach oder dreifach, beschlagen sie von innen?', kurz: 'Beschlag zwischen den Scheiben heißt: Das Fenster ist undicht.' },
      { id: 'tueren', t: 'Haustür und Innentüren: schließen, Schloss und Zargen in Ordnung?' },
      { id: 'rollaeden', t: 'Rollläden und Fensterbänke: funktionieren sie?' }
    ] },
    { id: 'heizung', titel: 'Heizung und Leitungen', punkte: [
      { id: 'heizung-art', t: 'Heizung: Art, Einbaujahr am Typenschild, Wartungsnachweis?', kurz: 'Das Einbaujahr entscheidet mit, welche Pflichten später auf Sie zukommen (siehe Umbau, „Pflichten nach dem Kauf“).' },
      { id: 'heizkoerper', t: 'Heizkörper: werden alle gleichmäßig warm, gehen die Ventile?' },
      { id: 'wasserleitung', t: 'Wasserleitungen: Material, Wasserdruck, braunes Wasser?', kurz: 'Alte Bleirohre gelten als gesundheitsschädlich.' },
      { id: 'abwasser', t: 'Abwasser: laufen Abflüsse frei, riecht es?' },
      { id: 'rohrdaemmung', t: 'Heizungs- und Warmwasserrohre im Keller: gedämmt?' }
    ] },
    { id: 'elektrik', titel: 'Elektrik', punkte: [
      { id: 'sicherung', t: 'Sicherungskasten: Alter, ist ein FI-Schalter vorhanden?', kurz: 'Ein FI-Schalter schaltet bei einem Stromschlag sofort ab.' },
      { id: 'steckdosen', t: 'Steckdosen und Schalter: genug vorhanden, mit Schutzkontakt, keine Brandspuren?' },
      { id: 'leitungen', t: 'Elektroanlage: Alter und letzte Prüfung bekannt?' },
      { id: 'zaehler', t: 'Zähler: Zustand, einer je Wohnung?' }
    ] },
    { id: 'bad', titel: 'Bad und Küche', punkte: [
      { id: 'bad-zustand', t: 'Bad: Fliesen, Fugen, Silikon, Schimmel?' },
      { id: 'sanitaer', t: 'WC, Waschbecken, Dusche oder Wanne: tropfende Armaturen?' },
      { id: 'abluft', t: 'Bad: Fenster oder Lüfter vorhanden?' },
      { id: 'kueche', t: 'Küche: Anschlüsse in Ordnung, Einbauküche im Preis?' },
      { id: 'warmwasser', t: 'Warmwasser: kommt es schnell, wie wird es erzeugt?' }
    ] },
    { id: 'unterlagen', titel: 'Unterlagen', punkte: [
      { id: 'u-grundbuch', t: 'Grundbuchauszug', kurz: 'Zeigt, wem das Haus gehört und welche Lasten (zum Beispiel Wegerecht) eingetragen sind.' },
      { id: 'u-ausweis', t: 'Energieausweis (muss spätestens bei der Besichtigung vorliegen)' },
      { id: 'u-grundriss', t: 'Grundrisse und Flächenberechnung' },
      { id: 'u-nebenkosten', t: 'Nebenkostenabrechnungen der letzten Jahre' },
      { id: 'u-miete', t: 'Mietverträge, falls vermietet' },
      { id: 'u-rechnungen', t: 'Rechnungen und Nachweise für Sanierungen' },
      { id: 'u-weg', t: 'Bei Wohnungen: Teilungserklärung und Protokolle der Eigentümerversammlungen', kurz: 'Darin steht, was Ihnen gehört und was gemeinsam finanziert wird.' }
    ] },
    { id: 'fragen', titel: 'Fragen an Makler oder Verkäufer', punkte: [
      { id: 'f-grund', t: 'Warum wird verkauft?' },
      { id: 'f-dauer', t: 'Wie lange steht das Haus schon zum Verkauf?' },
      { id: 'f-maengel', t: 'Sind Mängel, Schäden oder Streit mit Nachbarn bekannt?' },
      { id: 'f-miete', t: 'Wie hoch ist die Miete, wird sie pünktlich gezahlt?' },
      { id: 'f-kosten', t: 'Was kostet das Haus im Jahr (Grundsteuer, Versicherung, Schornsteinfeger)?' },
      { id: 'f-preis', t: 'Gibt es Spielraum beim Preis, und wer zahlt die Provision?' },
      { id: 'f-uebergabe', t: 'Wann kann übergeben werden, was bleibt im Haus?' }
    ] }
  ],
  hinweis: 'Diese Liste ersetzt keinen Sachverständigen. Bei Zweifeln an Dach, Feuchtigkeit oder Elektrik lassen Sie vor dem Kauf einen Bausachverständigen schauen. Ihre Notizen bleiben in Ihrem Browser und gehen weder in Links zum Weiterleiten noch in die Bank-Mappe.'
};
