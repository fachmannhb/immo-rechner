/* Einstieg in drei Zeilen je Bereich und die Schritte der Leiste „Schritt für Schritt zum Kauf“ (Welle 1, 09.10.2026).
   Ansprache „Sie“. app.js füllt damit die Seitenköpfe (kurz), das Kästchen „Wofür? / Was brauche ich? / Hier anfangen“
   und die Leiste. Reine Texte, keine Rechen- oder Rechtsaussagen.
   fokus: Id des Feldes, das der Knopf „Hier anfangen“ anspringt; fokusSel: CSS-Auswahl, wenn die Id erst zur Laufzeit entsteht;
   aktion: eigene Handlung statt Fokus (erstes-haus öffnet das Formular der Merkliste). */
window.DATEN = window.DATEN || {};
window.DATEN.einstieg = {
  /* die sieben Schritte der Leiste; ziele = Bereiche, die zu diesem Schritt gehören (der erste ist das Ziel des Punktes) */
  weg: [
    { name: 'Gebiet wählen', ziele: ['karte'] },
    { name: 'Haus suchen', ziele: ['suche'] },
    { name: 'Merkliste', ziele: ['merkliste'] },
    { name: 'Rechnen', ziele: ['rechner'] },
    { name: 'Wert prüfen', ziele: ['wert'] },
    { name: 'Umbau und Grundriss', ziele: ['umbau', 'grundriss'] },
    { name: 'Kaufablauf', ziele: ['pruefliste'] }
  ],
  bereiche: {
    karte: {
      kurz: 'Sehen Sie, in welchen Gegenden Wohnungen gefragt sind.',
      wofuer: 'Sie erkennen auf einen Blick, wo viele Menschen wohnen wollen und wo die Miete im Verhältnis zum Boden hoch ist. Die Ampel ist eine eigene Einordnung, keine Kaufempfehlung.',
      brauche: 'Nichts. Sie können einen Ort oder eine Postleitzahl eintippen.',
      anfang: { text: 'Ort suchen ↓', fokus: 'k-suche' }
    },
    suche: {
      kurz: 'Öffnen Sie die großen Immobilienportale mit Ihrer Suche.',
      wofuer: 'Ein Klick öffnet das Portal mit Ort und Höchstpreis schon eingetragen.',
      brauche: 'Ort, Haustyp und den Höchstpreis, den Sie zahlen wollen.',
      anfang: { text: 'Ort eintragen ↓', fokus: 's-ort' }
    },
    merkliste: {
      kurz: 'Sammeln Sie Häuser und vergleichen Sie sie nebeneinander.',
      wofuer: 'Jedes Haus bekommt eine Karte mit Ampel: Trägt es sich oder nicht?',
      brauche: 'Name, Kaufpreis und Ort. Miete und Wohnfläche machen den Vergleich genauer.',
      anfang: { text: 'Haus eintragen ↓', aktion: 'erstes-haus' }
    },
    rechner: {
      kurz: 'Fünf Schritte vom Kaufpreis bis zur Steuer. Für die erste Antwort genügen Kaufpreis und Miete.',
      wofuer: 'Sie sehen, ob die Miete die Kosten für Kredit und Haus deckt.',
      brauche: 'Kaufpreis und Kaltmiete. Eigenkapital und Zinssatz der Bank machen es genauer.',
      anfang: { text: 'Mit dem Kaufpreis beginnen ↓', fokus: 'r-preis' },
      beispiel: true
    },
    wert: {
      kurz: 'Schätzen Sie, ob der Preis zum Haus passt.',
      wofuer: 'Sie sehen, was das Haus nach den Formeln der Gutachter wert sein könnte. Das ist Ihre eigene Schätzung, kein Gutachten.',
      brauche: 'Grundstücksfläche, Bodenrichtwert, Baujahr, Zahl der Wohnungen und Miete.',
      anfang: { text: 'Werte aus dem Rechner holen ↓', fokus: 'w-aus-rechner' }
    },
    umbau: {
      kurz: 'Planen Sie, was Umbau und Renovierung kosten.',
      wofuer: 'Sie sehen die Kosten, mögliche Förderung und wie viel Mehrmiete der Umbau bringen darf. Die Preise sind Richtwerte, keine Angebote.',
      brauche: 'Mengen je Bauteil, zum Beispiel Quadratmeter Dach oder Zahl der Bäder.',
      anfang: { text: 'Erstes Bauteil eintragen ↓', fokusSel: '#u-tabelle input' }
    },
    grundriss: {
      kurz: 'Zeichnen Sie den Grundriss nach und richten Sie ihn ein.',
      wofuer: 'Sie sehen die Wohnfläche nach Wohnflächenverordnung und was die Einrichtung kostet. Das ist kein Bauplan und kein Aufmaß.',
      brauche: 'Ein Bild des Grundrisses aus dem Exposé, oder zeichnen Sie einfach auf dem Raster.',
      anfang: { text: 'Beispielhaus ausprobieren ↓', fokus: 'g-beispiel' }
    },
    pruefliste: {
      kurz: 'Haken Sie den Weg vom Geldrahmen bis zur Vermietung ab.',
      wofuer: 'Sie vergessen nichts Wichtiges: Unterlagen, Besichtigung, Finanzierung, Notar. Die Liste ersetzt keine Beratung.',
      brauche: 'Nichts. Der Stand bleibt in Ihrem Browser gespeichert.',
      anfang: { text: 'Erste Etappe ansehen ↓', fokus: 'pa-ziel' }
    },
    recht: {
      kurz: 'Finden Sie Gesetze und Ansprechpartner zu Ihrer Frage.',
      wofuer: 'Jeder Eintrag führt zum amtlichen Text. „Wann wichtig“ erklärt ihn in einfachen Worten. Das ist keine Rechtsberatung.',
      brauche: 'Ein Stichwort, zum Beispiel Miete, Heizung oder Grundbuch.',
      anfang: { text: 'Stichwort suchen ↓', fokus: 're-suche' }
    },
    monteur: {
      kurz: 'Rechnen Sie, ob Zimmer für Handwerker und Projektteams sich lohnen.',
      wofuer: 'Eine mögliche Nutzung nach dem Kauf: Sie sehen Umsatz, Ergebnis und die Belegung, ab der es sich trägt. Die Werte sind Planungswerte, keine Zusagen.',
      brauche: 'Zahl der Betten, Preis pro Person und Nacht und die geschätzte Belegung.',
      anfang: { text: 'Betten eintragen ↓', fokus: 'mz-betten' }
    }
  },
  /* Kurzzeilen für Bereiche ohne Einstiegskasten */
  kurzOhne: {
    impressum: 'Angaben zum Anbieter und zum Datenschutz. Noch ein Gerüst mit Feldern, das ausgefüllt und geprüft werden muss.'
  }
};
