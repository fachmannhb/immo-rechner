/* Fachbegriffe in einfacher Sprache (Nutzerwunsch 08.10.2026: „für jedes Kind verständlich“).
   Nur Begriffserklärungen, keine Rechts- oder Steuerberatung. Zahlen nur, wenn sie geprüft auf der Seite stehen.
   w: Wörter, nach denen in Feldbeschriftungen gesucht wird (das erste passende gewinnt; Reihenfolge zählt).
   nurAnfang: nur wenn die Beschriftung mit dem Wort beginnt (z. B. nicht bei „Fixkosten (ohne Kredit)“).
   app.js hängt an passende Beschriftungen ein (?) an, das die Erklärung zeigt. */
window.DATEN = window.DATEN || {};
window.DATEN.begriffe = [
  { w: ['Grunderwerbsteuer'], t: 'Grunderwerbsteuer', e: 'Eine Steuer, die du beim Kauf einmal an das Bundesland zahlst. Wie hoch sie ist, hängt vom Bundesland ab; der Satz steht in der Auswahl „Bundesland“.' },
  { w: ['Notar und Grundbuch'], t: 'Notar und Grundbuch', e: 'Der Notar beurkundet den Kaufvertrag. Das Grundbuchamt trägt dich danach als neuen Eigentümer ein. Beides kostet Gebühren, die zum Kaufpreis dazukommen.' },
  { w: ['Makler', 'Maklerprovision'], t: 'Makler', e: 'Wenn ein Makler das Haus vermittelt, bekommt er eine Provision. Wie hoch sie ist, steht im Angebot (Exposé).' },
  { w: ['Eigenes Geld', 'Eigenkapital'], t: 'Eigenes Geld (Eigenkapital)', e: 'Das Geld, das du selbst mitbringst. Alles andere leihst du dir bei der Bank. Je mehr eigenes Geld, desto kleiner sind Kredit und Rate.' },
  { w: ['Kaufnebenkosten'], t: 'Kaufnebenkosten', e: 'Alles, was zum Kaufpreis dazukommt: Grunderwerbsteuer, Notar, Grundbuch und, falls es einen gibt, der Makler.' },
  { w: ['Gesamtkosten'], t: 'Gesamtkosten', e: 'Kaufpreis plus Nebenkosten plus Renovierung. So viel Geld brauchst du insgesamt.' },
  { w: ['Finanzierungsquote'], t: 'Finanzierungsquote', e: 'Kredit geteilt durch Kaufpreis. Über 100 % heißt: Die Bank soll auch die Nebenkosten mitbezahlen. Das machen nicht alle Banken.' },
  { w: ['Kredit', 'Darlehen'], nurAnfang: true, t: 'Kredit (Darlehen)', e: 'Das Geld, das dir die Bank leiht: Gesamtkosten minus dein eigenes Geld.' },
  { w: ['Sollzins'], t: 'Sollzins', e: 'Der Preis für das geliehene Geld, in Prozent pro Jahr.' },
  { w: ['Tilgung'], t: 'Tilgung', e: 'Der Teil der Rate, mit dem du die Schuld wirklich abbezahlst. Die anfängliche Tilgung in Prozent sagt, wie schnell es am Anfang geht.' },
  { w: ['Restschuld'], t: 'Restschuld', e: 'Was du der Bank am Ende der Zinsbindung noch schuldest. Dafür brauchst du dann einen neuen Kredit oder eine Anschlussfinanzierung.' },
  { w: ['Zins nach der Zinsbindung', 'Anschlusszins'], t: 'Zins nach der Zinsbindung', e: 'Der Zins, den die Bank verlangt, wenn die Zinsbindung vorbei ist. Heute weiß niemand, wie hoch er dann sein wird. Darum spielt Schritt 4 einen höheren Zins durch.' },
  { w: ['Zinsbindung'], t: 'Zinsbindung', e: 'So viele Jahre bleibt der Zins fest. Danach gilt ein neuer Zins, der höher oder niedriger sein kann.' },
  { w: ['Rate im Monat', 'Monatsrate'], t: 'Rate im Monat', e: 'Was du jeden Monat an die Bank zahlst: Zinsen plus Tilgung. Bei diesem Kredit (Annuitätendarlehen) bleibt sie gleich hoch; mit der Zeit wird der Zinsanteil kleiner und der Tilgungsanteil größer.' },
  { w: ['Kaltmiete'], t: 'Kaltmiete', e: 'Die Miete ohne Heizung und ohne Nebenkosten wie Wasser oder Müll.' },
  { w: ['Nicht umlagefähige', 'Nicht umgelegte Betriebskosten'], t: 'Nicht umlagefähige Kosten', e: 'Kosten, die du als Vermieter selbst trägst und nicht über die Nebenkosten an die Mieter weitergeben darfst, zum Beispiel Verwaltung oder Kontoführung.' },
  { w: ['Instandhaltungsrücklage'], t: 'Instandhaltungsrücklage', e: 'Geld, das du jeden Monat für spätere Reparaturen zur Seite legst, zum Beispiel für Dach, Heizung oder Fenster.' },
  { w: ['Mietausfall', 'Mietausfallwagnis'], t: 'Mietausfall und Leerstand', e: 'Ein Puffer für Monate, in denen eine Wohnung leer steht oder ein Mieter nicht zahlt.' },
  { w: ['Bruttorendite', 'Bruttomietrendite'], t: 'Bruttorendite', e: 'Jahresmiete geteilt durch Kaufpreis. Eine schnelle erste Zahl zum Vergleichen; Kosten sind darin noch nicht abgezogen.' },
  { w: ['Nettorendite', 'Nettomietrendite'], t: 'Nettorendite', e: 'Was von der Jahresmiete nach den laufenden Kosten übrig bleibt, geteilt durch die Gesamtkosten. Genauer als die Bruttorendite.' },
  { w: ['Kaufpreisfaktor'], t: 'Kaufpreisfaktor', e: 'Wie viele Jahresmieten das Haus kostet: Kaufpreis geteilt durch Jahreskaltmiete. Ein kleinerer Faktor heißt: günstiger im Verhältnis zur Miete.' },
  { w: ['Reinertrag'], t: 'Reinertrag', e: 'Die Miete nach Abzug von Leerstand, nicht umlagefähigen Kosten und Rücklage, aber noch vor der Kreditrate.' },
  { w: ['Bleibt im Monat', 'Cashflow'], t: 'Bleibt im Monat (Cashflow)', e: 'Was am Monatsende übrig bleibt oder fehlt: Reinertrag minus Kreditrate, vor Steuern. Ein Minus heißt, du legst jeden Monat Geld dazu.' },
  { w: ['Bodenrichtwert'], t: 'Bodenrichtwert', e: 'Was ein Quadratmeter Bauland in der Gegend im Durchschnitt wert ist. Der Gutachterausschuss ermittelt ihn; du kannst ihn kostenlos im Portal BORIS nachsehen.' },
  { w: ['Ertragswert'], t: 'Ertragswert', e: 'Ein Wert, der aus den Mieten berechnet wird, die das Haus bringen kann. So bewertet man üblicherweise Mietshäuser.' },
  { w: ['Sachwert'], t: 'Sachwert', e: 'Ein Wert aus dem, was das Gebäude heute zu bauen kosten würde (abzüglich Alter), plus dem Wert des Grundstücks.' },
  { w: ['Vergleichswert', 'Vergleichspreis'], t: 'Vergleichswert', e: 'Ein Wert aus den Preisen ähnlicher Häuser in der Gegend.' },
  { w: ['Liegenschaftszins', 'Liegenschaftszinssatz'], t: 'Liegenschaftszins', e: 'Ein Zinssatz, mit dem Gutachter aus den Mieten einen Wert machen. Je niedriger er ist, desto höher kommt der Wert heraus. Der Gutachterausschuss veröffentlicht ihn für die Region.' },
  { w: ['Gesamtnutzungsdauer'], t: 'Gesamtnutzungsdauer', e: 'Wie viele Jahre ein Gebäude dieser Art insgesamt üblicherweise genutzt wird.' },
  { w: ['Restnutzungsdauer'], t: 'Restnutzungsdauer', e: 'Wie viele Jahre das Gebäude voraussichtlich noch wirtschaftlich genutzt werden kann. Eine Modernisierung kann sie verlängern.' },
  { w: ['Brutto-Grundfläche'], t: 'Brutto-Grundfläche', e: 'Die Fläche aller Geschosse, außen gemessen. Sie steht in den Bauunterlagen.' },
  { w: ['Modernisierung'], t: 'Modernisierung', e: 'Ein Umbau, der das Haus verbessert, zum Beispiel Dämmung oder ein neues Bad. Danach darf die Miete bei bestehenden Verträgen in Grenzen steigen; reine Reparaturen zählen nicht dazu.' },
  { w: ['Belegung'], t: 'Belegung', e: 'Wie viel Prozent der Betten im Durchschnitt pro Nacht bezahlt belegt sind.' }
];
