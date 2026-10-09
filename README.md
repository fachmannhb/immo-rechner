# Immobilien-Werkzeuge

Eine lokale Webseite zum Suchen, Vergleichen, Durchrechnen und Kaufen von Immobilien zur Vermietung, mit Wertermittlung, Umbau-Rechner, Ablauf zum Abhaken und Rechtsverzeichnis. Arbeitswerkzeug, keine Anlage-, Rechts- oder Steuerberatung.

Aufbau seit Welle 1 des Umbaus (09.10.2026, Variante A „ruhig und hell“, Ansprache „Sie“):

- Startseite „Was möchten Sie tun?“ mit der Zeichnung, dem Hauptknopf „Hier anfangen“ (springt in den Rechner ins Feld Kaufpreis), dem Knopf „Beispiel ansehen“ und sieben gleich großen Kacheln (Schritt 6 trägt „Grundriss und Einrichtung“ als schmale Zeile darunter) plus der gestrichelten Kachel „Außerdem“ (Gesetze, Monteurzimmer). Alle Bereiche zusätzlich über „Alle Bereiche“ oben rechts. Die Ergebniszeile der Startseite erscheint erst, wenn der Rechner Zahlen hat. Das 3D-Haus der alten Startseite ist durch die Zeichnung ersetzt; `haus3d.js` bleibt im Bau, findet seine Elemente aber nicht mehr und tut nichts.
- Leiste „Schritt für Schritt zum Kauf“ unter der Kopfzeile, nur in den sieben Schritt-Bereichen: 1 Gebiet wählen (Karte), 2 Haus suchen, 3 Merkliste, 4 Rechnen, 5 Wert prüfen, 6 Umbau und Grundriss, 7 Kaufablauf (Prüfliste). Erledigt (Haken) heißt nur: die Schritte vor dem aktuellen. Es wird kein Fortschritt gespeichert. Auf dem Handy steht nur „Schritt N von 7 · Weiter →“. Auf Start, Recht, Monteurzimmer und Impressum fehlt die Leiste.
- Jeder Bereich beginnt mit Zeichnung, Kurzsatz und drei Zeilen „Wofür? / Was brauche ich? / Hier anfangen“ mit einem Knopf; lange Einleitungen stehen hinter „Mehr dazu“. Texte in `daten/einstieg.js`, Zeichnungen in `daten/bilder.js` (eigene flache SVG, hell und dunkel über Farbvariablen).
- Fachbegriffe haben ein (?) mit der langen Erklärung und darunter einen sichtbaren Halbsatz (`kurz` in `daten/begriffe.js`).
- Knopf „Beispiel ansehen“ (Startseite und Rechner): ein erfundenes Reihenhaus in Bremen (`daten/musterhaus.js`: 300.000 €, 120 m², 1.560 € Kaltmiete, 70.000 € Eigenkapital, 3,8 % Zins) füllt Rechner und legt einen Merklisten-Eintrag an. Vorher werden die eigenen Werte dieser Felder und die Merkliste in `immo-beispiel-sicherung` gesichert. Ein blaues Band „Beispiel – nicht Ihre Zahlen · Beispiel leeren“ steht in allen Bereichen, auch nach dem Neuladen. „Beispiel leeren“ stellt die eigenen Werte wieder her und entfernt nur den Beispiel-Eintrag. „Als Datei sichern“ nimmt den Beispiel-Eintrag nicht mit. Lässt der Browser kein Speichern zu, lädt das Beispiel nicht und sagt das im Band.
- Der Rechner hat fünf Schritte. Links die Eingaben (Kaufpreis ganz oben), rechts die Ergebniskarte mit großem Satz, Zahlenzeilen von der Miete bis „Übrig im Monat“ und der Liste „Das haben wir angenommen“ (je Annahme eine Zeile, aus den echten Feldwerten; unveränderte Startwerte für Miete und Wohnfläche tragen das Schild „Startwert“). Bei den breiten Schritten 2 und 5 steht die Karte darüber. Auf dem Handy steht die Karte vor den Eingaben und die Schrittleiste ist einzeilig und waagrecht scrollbar. Kacheln und Ergebnisse mit lauter „-“ bleiben verborgen, bis Zahlen da sind. Der Ergebnissatz hat Ampel (eigene Einordnung, keine Empfehlung).
- Merkliste: Leer-Zustand mit Zeichnung und großem Knopf „Erstes Haus eintragen“; „Ampel einstellen“ und „Sichern und laden“ sind ruhiger, der Hinweis „einzige echte Sicherung“ steht in einem blauen Informationskasten.
- Farbbedeutung: Violett = Handlung (Knöpfe, aktiver Schritt), Blau = Information (Hinweise, (?), Beispielband, Schilder „Annahme“ und „Startwert“), Grün/Gelb/Rot nur für Ergebnisse; kein Orange. Schrift: Fließtext mindestens 16 px, Quellenangaben 15 px, nichts unter 14 px (Beschriftungen in Diagrammen und Karten ausgenommen). Abstände über `--abstand-s/m/l`.
- Fußzeile „Impressum · Datenschutz · Keine Anlageberatung“ auf jeder Seite. Der Bereich `#impressum` (im Menü „Impressum und Datenschutz“) ist nur ein **Gerüst**: Felder in eckigen Klammern (`[Name]`, `[Anschrift]`, `[E-Mail]`, `[Telefon optional]`, `[Feld: Angaben zum Hoster]` …), Ausfüllhilfe und der Hinweis, dass ein Anwalt oder ein seriöser Generator den Text vor der Veröffentlichung prüfen muss. Es steht kein ausformulierter Rechtstext darin (Projektregel R006); die Datenschutz-Stichpunkte nennen nur, was die Seite tut (Daten bleiben im Browser, keine Cookies, Schriften und Karten eingebettet).

Welle 2 (09.10.2026: Wert, Umbau, Grundriss):

- Wert (4 Schritte: Grundstück, Gebäude, Miete und Zins, Vergleich und Sachwert) und Umbau (5 Schritte: Bauteile, Kosten und Förderung, Mehrmiete und Wert, Förderprogramme, Bauablauf) zeigen je Bildschirm höchstens 3 bis 4 Felder, der Rest steht unter „Mehr Einstellungen“. Die Schrittlogik ist `zeigeSchritt(formId, leisteId, n, fokus)` in `app.js` und dient auch dem Rechner (unverändert 5 Schritte).
- Beide Bereiche haben einen Ergebnissatz mit Wartezustand (`satz leer` nennt, was fehlt). Wert: neutral ohne Ampel, erst wenn Grundstück, Bodenrichtwert, Baujahr, Wohnfläche, Wohnungen und Miete da sind. Umbau: Kosten, Mehrmiete nach § 559 BGB, Wertzuwachs. Normtexte (ImmoWertV, Anlagen, Paragraphen) stehen nur in Aufklapptexten. Der Liegenschaftszins ist ein sichtbares Feld mit dem Schild „Annahme“; der Bremer Wert (Grundstücksmarktbericht 2026, Abschnitt 8.1) fehlt noch und wird nachgetragen.
- Umbau: Bauteile und Förderprogramme sind auch am Desktop Karten (Klasse `karten-immer`, IDs `u-tabelle`, `u-tabelle-mehr`, `u-foerder-tabelle`). Vier Bauteile stehen oben (`haupt: true` in `daten/sanierung.js`), die übrigen unter „Mehr Einstellungen“; der Preis liegt hinter „Preis ändern“. Förderwerte nach Recherche 03b (Abruf 09.10.2026): KfW 261 (Tilgungszuschuss EH 40 EE 10 %, EH 55 EE und Denkmal EE 5 %, EH 70 EE und EH 85 EE 0 %), Bremer Modernisierungsförderung (Richtlinie 27.08.2026, mit Bindungen: 6,80 € je m², 20 Jahre, Wohnberechtigungsschein). Nicht amtlich belegte Programme (BEG-Einzelmaßnahmen-Sätze, KfW 458, BAFA-Beratung) tragen die Marke „Vor Nutzung prüfen“. Abkürzungen (BEG, iSFP, WDVS, Kappung, WBS, EH, EE) haben sichtbare Halbsätze.
- Grundriss: die Karte „So fangen Sie an“ (Beispielhaus laden, Bild wählen) steht groß ganz oben; „Bild entfernen“ und „Diese Etage löschen“ sind auch gesperrt kontrastreich (über 6:1); Halbsätze für Maßstab, Nutzfläche, Raumhöhe; die Matratze ohne Preis trägt „Preis offen“.
- „Beispiel ansehen“ füllt zusätzlich Wert (250 m² Grund, 600 €/m² erfunden) und Umbau (Bad, 10 Fenster, 130 m² Fassade, 5.000 € Förderung); alle anderen Umbau-Mengen werden dabei geleert und mit „Beispiel leeren“ wiederhergestellt (inklusive Häkchen Heizungstausch).
- Test `tmp/welle2_test.py` (optional `BASIS_URL` für den Vergleich mit dem Stand vor Welle 2, gebaut mit `tmp/w2_basis_bauen.py`). `pruef_seite.ps1` und `welle1_test.py` öffnen jetzt alle `.schritt` (auch Wert und Umbau).

Block 4 (09.10.2026: Steuern sparen und „Ergebnis weiterleiten“):

- Neuer Nebenbereich `#steuern` („Steuern sparen“, Menü `#tab-steuern`, Kachel „Außerdem“, nicht in der Leiste) mit Einstieg, Zeichnung und deutlichem Hinweis „ersetzt keine Steuerberatung“. Oben 35 Karten in fünf aufklappbaren Gruppen (Kauf, Umbau, Vermietung, Verkauf, Fallen) aus `daten/steuern.js`, Inhalt aus `recherche/14_steuern_sparen.md` (alle Quellen Abruf 09.10.2026). Je Karte: ein Satz in einfacher Sprache („Das Gesetz erlaubt …“), Bedingung, „Gilt für Vermieter: ja/nein“, Paragraph mit Link auf gesetze-im-internet.de oder BMF, Quelle mit Abrufdatum. § 35c und § 10f stehen als „nur für Selbstnutzer“. Was der Bericht „unsicher“ nennt, trägt das Schild „Vor Nutzung prüfen“ samt Grund.
- Vier Rechner (Rechenfunktionen in `rechner.js`: `anschaffungsnaheKosten`, `erhoehteAfa`, `gebaeudewertSachwert`, `kaufpreisAufteilung`, `verkauf`; Oberfläche in `app.js`, `rechneSteuer()`), gemeinsame Grundannahmen Steuersatz (Annahme, Voreinstellung 30 %) und Baujahr (leer = aus dem Rechner):
  a) 15-%-Prüfer (§ 6 Abs. 1 Nr. 1a EStG): Grenze, Summe, Abstand („noch X € Luft“ oder „X € darüber“), Steuerwirkung im ersten Jahr sofort gegen nur Abschreibung. Genau 15 % ist unschädlich (Ganzzahlvergleich). Anschaffungskosten des Gebäudes leer = aus Teil c, sonst Gebäudeanteil des Rechners (Annahme).
  b) § 7h/§ 7i: 9 % in 8 Jahren, 7 % in 4 Jahren (zusammen bis zu 100 %), Tabelle Jahr für Jahr gegen die normale Abschreibung. Großer Hinweis: Bescheinigung beziehungsweise Abstimmung vor Baubeginn.
  c) Kaufpreisaufteilung: Bodenwert = Fläche × Bodenrichtwert, Gebäudewert aus der Sachwert-Rechnung des Bereichs Wert ohne Boden (`gebaeudewertSachwert`), Aufteilung im Verhältnis, Nebenkosten im gleichen Verhältnis. Gekennzeichnet als Näherung nach dem Prinzip der BMF-Arbeitshilfe, nicht die Arbeitshilfe selbst.
  d) Verkauf nach 1 bis 30 Jahren (§ 23 EStG): baut auf dem Rechner Schritt 5 auf (Restschuld, Überschüsse, Abschreibung). Zeile N heißt „Verkauf kurz nach dem N. Jahrestag des Kaufvertrags“ (maßgeblich sind die Notarverträge, taggenau); steuerpflichtig bei N kleiner als 10, ab N = 10 steuerfrei. Gewinn = Verkaufspreis − Verkaufskosten − (Anschaffungskosten − Summe Abschreibung); Freigrenze 1.000 € (999 € frei, 1.000 € voll steuerpflichtig); Verlust ohne Steuer. Gesamtergebnis = Erlös nach Schuld und Steuer + Überschüsse nach Steuern − eingesetztes Eigenkapital. Diagramm (`GRAFIK.verkauf`, Palette c1/c3) mit Linie bei Ablauf der Frist, Tabelle, Satz „Rechnerisch im Plus ab Jahr X“ (neutral, eigene Rechnung, keine Empfehlung). Warnungen: Vorfälligkeitsentschädigung nicht gerechnet, gewerblicher Grundstückshandel (mehr als drei Objekte in fünf Jahren), Selbstnutzung, Freigrenze gilt für den Jahresgesamtgewinn, Verlustverrechnung, ohne Kirchensteuer.
- Hinweise „→ Steuern sparen“ im Umbau (mit der Summe der eingetragenen Kosten und der Drei-Jahres-Bedingung; im 15-%-Prüfer setzt ein Knopf die Umbaukosten als Jahr 1 ein), im Rechner Schritt 5 und in der Prüfliste (Kaufpreisaufteilung im Vertrag, Sanierungsgebiet und Denkmal).
- „Beispiel ansehen“ (auch im Bereich Steuern, Knopf `beispiel-steuern`) füllt zusätzlich die Steuer-Felder (`steuer` in `daten/musterhaus.js`), „Beispiel leeren“ stellt sie wieder her; die Brutto-Grundfläche (190 m²) steht dafür im Steuer-Feld, nicht im Bereich Wert.
- Knopf „Ergebnis weiterleiten“ an jedem Ergebnis (Rechner, Wert, Umbau, Grundriss, Monteurzimmer, alle vier Steuer-Rechner; eine gemeinsame Funktion `teilen()` in `app.js`). Inhalt: Text (Überschrift, Datum, wichtigste Eingaben, Ergebnisse, Satz „Eigene Berechnung mit Annahmen, keine Anlage- oder Steuerberatung“) und Link auf https://fachmannhb.github.io/immo-rechner/ mit den Eingaben im Teil hinter `#` (`#teilen=BEREICH&FELD=WERT&…`). Im Link stehen nur Zahlen und Auswahlwerte aus einer Whitelist je Bereich, nie Namen, Adressen oder Notizen der Merkliste (`r-objekt` ist ausgeschlossen); der Teil hinter `#` geht nicht an den Server. Auf dem Handy öffnet `navigator.share` das Teilen-Fenster, sonst wird Text plus Link kopiert („Kopiert – jetzt in E-Mail oder Messenger einfügen“); scheitert alles, steht der Text in einem Feld zum selbst Kopieren, mit Grund. Beim Öffnen eines Teilen-Links werden die Werte eingesetzt, die eigenen vorher in `immo-teilen-sicherung` gesichert und ein blaues Band „Geteilte Zahlen – nicht Ihre eigenen · Eigene Zahlen zurückholen“ gezeigt (auch nach dem Neuladen); der Hash verschwindet aus der Adresse. Ein laufendes Beispiel wird dabei zuerst beendet. Kaputte Links bekommen eine sichtbare Meldung mit Grund, es ändert sich nichts. Der Grundriss selbst steckt nicht im Link (nur sein Ergebnis im Text). Der Link öffnet die neue Fassung erst, wenn diese Fassung auf der öffentlichen Seite liegt.
- Grenzen: eigene Näherungen zum Verstehen, keine Steuerberatung; Steuersatz, Wertsteigerung, Verkaufskosten und Soli sind Annahmen; Soli-Freigrenze und Milderungszone, Kirchensteuer, Vorfälligkeitsentschädigung, Zusatzkosten wie Renovierung beim Verkauf und Zinsänderungen nach der Zinsbindung sind nicht gerechnet; die Kaufpreisaufteilung ist nicht die Arbeitshilfe der Finanzverwaltung; die Liste der Bremer Sanierungsgebiete ist nicht aus einer aktuellen amtlichen Quelle belegt. Test: `tmp/steuer_test.py` (Handwerte der Rechenfunktionen stehen in `tmp/rechner_test.js`).

Block 5 (09.10.2026: Bank-Mappe, Anschlussfinanzierung, Heizungs-Check, Besichtigung):

- Bank-Mappe: Knopf „Bank-Mappe erstellen“ bei der Ergebniskarte des Rechners und „Bank-Mappe“ an jeder Hauskarte der Merkliste. Öffnet eine Ganzseiten-Ansicht (`#mappe-ov`, außerhalb von `<main>`; die Seite dahinter ist „inert“, Escape und „← Zurück“ schließen, der Fokus geht zum Knopf zurück) mit: Objekt (Ort, Bezeichnung, Wohnfläche, Baujahr, Wohneinheiten, was die Merkliste nicht kennt steht als „nicht erfasst“), Kaufpreis, Kaufnebenkosten (aufgeschlüsselt), Gesamtkosten, Eigenkapital, Darlehen, Sollzins, Tilgung, Zinsbindung, Monatsrate, Restschuld nach der Zinsbindung, Kaltmiete, Bruttorendite, Reinertrag, Überschuss pro Monat, Ampel (eigene Einordnung wie im Ergebnissatz), Annahmenliste, Datum und „Eigene Berechnung, keine Beratung“. Das Blatt ist immer hell (auch im Dunkelmodus; die helle Palette setzt `bau.py` aus `palette.json` auf `.blatt`). Eigenes `@media print`: alles außer der Mappe und die Knopfleiste verschwinden, Knopf „Drucken / als PDF speichern“ ruft `window.print()` (scheitert es, steht eine Meldung mit Grund da). Personendaten des Nutzers werden nicht abgefragt. Ohne Kaufpreis (Rechner) oder ohne Angebot A (Hauskarte) zeigt die Mappe stattdessen eine sichtbare Meldung. Bei der Hauskarte kommen Preis, Fläche, Miete, Ort aus der Merkliste; Eigenkapital, Zins, Tilgung, Bindung und Kosten aus dem Rechner (Angebot A), das steht in der Annahmenliste. „Ergebnis weiterleiten“ in der Mappe teilt nur die Zahlen (`TEILEN.mappe`, Link öffnet nur den leeren Rechner), nie Notizen oder Besichtigung.
- Anschlussfinanzierung im Rechner Schritt 4 (Rechenfunktion `RECHNER.anschluss` in `rechner.js`): Die Zinsbindung ist weiter das Feld „Zinsbindung in Jahren“ von Angebot A in Schritt 2 (Annahme 10), Schritt 4 zeigt sie an. Ergebnissatz „Nach 10 Jahren sind noch X € offen. Bei 6 % Zins steigt die Rate auf Y €, es bleiben Z € im Monat.“ (6 % oder der eigene Zins; „sinkt“/„bleibt“ und „es fehlen“ je nach Zahl; ohne Miete nur der erste Teil, ohne Kredit ein Wartesatz). Tabelle für 4, 5, 6 % und den eigenen Zins (`r-an-eigen`): neue Rate, Unterschied zur Rate heute, bleibt im Monat, schuldenfrei nach. Zwei Wege (`r-an-modus`): gleiche Tilgung (Rate = Restschuld × (Zins + Tilgung) ÷ 12, dieselbe Formel wie `kredit`) oder schuldenfrei zum selben Zeitpunkt (Annuität über die verbleibenden Monate; Zins 0 % = Restschuld ÷ Monate; kann der Kredit nie getilgt werden, steht eine Meldung statt einer Zahl). Annahmen: Miete bleibt gleich, keine Sondertilgung, vor Steuern. Der Rechner hat weiter genau fünf Schritte; die Regler darunter (Zins, Miete, Leerstand zusammen) bleiben.
- Heizungs- und Energie-Check im Bereich Umbau: aufklappbare Karte „Pflichten nach dem Kauf: Heizung und Energie“ über den Umbau-Schritten, außerhalb des Umbau-Formulars (kein sechster Schritt, nicht im Teilen-Link). Fünf Fragen (Baujahr, Heizungsart, Einbaujahr, oberste Geschossdecke gedämmt, Rohre im Keller gedämmt, gespeichert unter `immo-heizcheck`), dann die Liste „Was auf Sie zukommen kann“ mit Paragraph-Link. Regeln in `rechner.js` (`heizungsCheck`, getestet in `tmp/rechner_test.js`), Texte in `daten/pflichten.js`, Grundlage ausschließlich `recherche/15_vermieter_regeln.md` Abschnitt A (Gebäudemodernisierungsgesetz GModG, früher GEG; Abruf 09.10.2026): § 43 Bio-Treppe für Gas-/Öl-/Flüssiggasheizungen, die nach dem 29.07.2026 eingebaut werden (10 % ab 01.01.2029, 15 % ab 01.01.2030, 30 % ab 01.01.2035, 60 % ab 01.01.2040); § 72 „(weggefallen)“, also keine Austauschpflicht für alte Kessel; § 35 oberste Geschossdecke und § 69 Rohrdämmung mit der Ausnahme und Frist für selbst bewohnte Häuser; Energieausweis §§ 79/80 (Bedarfsausweis nur als Hinweis zum Bauantrag vor 01.11.1977); Wärmeplan Bremen. Was der Bericht „unsicher“ nennt (Fristen vor dem 29.07.2026, Bremerhaven, § 109), trägt „Vor Nutzung prüfen“. Kosten nur als Ratgeberwert mit Quelle und Abruf (co2online, energie-fachberater.de), Preisstand unbekannt. Keine Rechtsberatung; Energieberater mit iSFP.
- Besichtigungs-Checkliste (`daten/besichtigung.js`) an jeder Hauskarte: Ganzseiten-Ansicht für das Handy mit acht Gruppen (Außen und Dach, Keller und Feuchtigkeit, Fenster und Türen, Heizung und Leitungen, Elektrik, Bad und Küche, Unterlagen, Fragen an Makler oder Verkäufer), je Punkt große Knöpfe „ok / beobachten / Mangel“ (zweiter Tipp nimmt zurück), je Gruppe ein Notizfeld. Gespeichert wird sofort als `besichtigung` im Merklisten-Eintrag (`punkte`, `notizen`, `zeit`), also auch in „Als Datei sichern“ (Notizen inklusive); beim Ändern des Hauses bleibt sie erhalten; gelesene Daten werden gesäubert (nur bekannte Punkte). Die Karte zeigt „X Mängel · Y zu beobachten · Z von 42 Punkten bewertet“. Notizen gehen weder in Teilen-Links noch in die Bank-Mappe. „Beispiel ansehen“ legt im Musterhaus eine erfundene Besichtigung an (4 Mängel) und füllt die Anschlussfinanzierung (eigener Zins 5,5 %).
- Test: `python -I -X utf8 tmp/block5_test.py [--fotos]` (Handrechnungen unabhängig in Python, Mappe, Druck-CSS im Dunkelmodus, Heizungs-Check in vier Fällen, Besichtigung speichern, neu laden, Export, Mängelzähler, keine Notizen im Teilen-Text). Fotos nach `.playwright-cli/b5_*.png`; die PDF-Ausgabe (`b5_mappe.pdf`) lässt sich hier mangels pdftoppm nicht anzeigen, die Druckvorschau als Bild entsteht über `playwright-cli set-media print`.

Noch Platzhalter nach Welle 1: das ganze Impressum und der Datenschutz (Felder leer), der Hoster-Eintrag, die Zeichnungen (eigene Entwürfe, gern austauschbar), die Beispielwerte (erfunden). Wert, Umbau, Grundriss, Karte, Suche, Recht, Prüfliste und Monteurzimmer haben in Welle 1 nur das Grundgerüst; ihr Inhalt wird in Welle 2 und 3 umgestaltet.

Fachliche Grundlagen weiter wie vorher: Profi-Teile (Formeln, Tilgungsplan, Sachwert) sind eingeklappt, Farben hell und dunkel (Knopf mit Sonne oder Halbmond).

Bereich „Grundriss und Einrichtung“ (seit 08.10.2026): Grundrissbild aus dem Exposé laden, Maßstab an einer bekannten Strecke festlegen, Räume nachzeichnen (Rechteck, Ecke für Ecke oder mit Maßen), Möbel und Umbau-Teile hineinstellen, Ansicht von oben oder in 3D, mehrere Etagen. Ergebnis: Wohnfläche nach WoFlV §§ 2 und 4, Nutzfläche (Keller, Garage, separat vermietbar), Kostenliste und Schlafplätze je Zimmer; Wohnfläche und Summe lassen sich in den Rechner übernehmen. Der Plan wird im Browser gespeichert (Schlüssel `immo-grundriss`) und kann als Datei gesichert werden. Der Knopf „Beispielhaus laden“ trägt ein erfundenes Haus ein (`daten/beispielhaus.js`: 6 Zimmer auf zwei Etagen, Keller, Garage, eingerichtet).

Merkliste „Anzeige einfügen“ (seit 08.10.2026): Text einer Portalanzeige (Strg+A, Strg+C) und Link einfügen, „Daten herauslesen“ füllt Kaufpreis, Wohnfläche, Zimmer, Grundstück, Baujahr, Miete, Wohnungen, Provision und Ort ins Formular; gespeichert wird erst nach Prüfung. Nur mit dem Link geht es nicht: Eine Webseite darf fremde Portalseiten nicht abrufen. Geprüft an nachgebauten Texten (ImmoScout-, Immowelt-, Kleinanzeigen-Aufbau) und an einer echten Kleinanzeigen-Anzeige.

## Karte „Wo ist Wohnen gefragt?“

Die Karte zeigt alle 400 Landkreise und kreisfreien Städte als Ampel („Gefragtes Gebiet nach deinen Regeln“, Ebenen Gesamt, Nachfrage, Arbeit, Studium, Miete, Einstieg, Miete/Boden; die Gewichte lassen sich verstellen) und die Bundesländer im Vergleich. Dazu gibt es Sterne für große Werke, Hochschulorte (ab 20.000 Studierenden) und Pendlerzentren (ab 100.000 Einpendlern), eine Suche nach Ort, Postleitzahl oder Landkreis, eine Tabelle mit Streudiagramm und eine 3D-Ansicht. Die Merkliste zeigt je Haus die Gebietszeile des passenden Kreises.

Datenquellen und Lizenzen (Einzelheiten in `recherche/09_karte_daten.md`, `10_sterne_staedte.md`, `11_werke.md`):

- Kreisgrenzen: © BKG (2026), Verwaltungsgebiete 1:2.500.000 (VG2500), Stand 31.12.2025, Datenlizenz Deutschland Namensnennung 2.0; verändert (vereinfacht, umgerechnet).
- Kennzahlen (Einwohner, Bevölkerungsentwicklung, Beschäftigte, Pendler, Studierende, Bauland): INKAR des BBSR, Datenlizenz Deutschland Namensnennung 2.0. Leerstand und Nettokaltmiete: Zensus 2022 der Statistischen Ämter des Bundes und der Länder, ebenfalls dl-de/by-2.0. Nicht geklärt ist, ob die Drittdaten von IDN ImmoDaten innerhalb von INKAR (Angebotsmieten) weitergegeben werden dürfen; vor einer breiteren Veröffentlichung klären (Bericht 09).
- Orte und Kreiszuordnung: Gemeindeverzeichnis des Statistischen Bundesamts, Gebietsstand 31.03.2026, Abruf 08.10.2026. Hanau ist dem Main-Kinzig-Kreis zugeordnet, weil Karte und Kennzahlen den Gebietsstand 2025 haben.
- Portalpreise einzelner Städte: McMakler, Q1 2026 (Bericht 10).
- Werke: Konzernseiten (Abruf 08.10.2026) und Wikipedia (Abruf 09.10.2026, Nutzerentscheidung, weil mehrere Konzernseiten den Abruf sperren). Jeder Stern nennt Quelle und Abrufdatum. Beschäftigtenzahlen stehen nur da, wo die Quelle eine Zahl zum Werk nennt, meist mit altem Stand.

Stand der Daten: Kennzahlen 2022 bis 2024, Grenzen 31.12.2025, Werke 08.10. und 09.10.2026.

Grenzen: Die Werkliste ist nicht vollständig (Siemens, weitere Bosch-Standorte und viele mittlere Werke fehlen; Ford Saarlouis ist bewusst nicht aufgenommen, weil die Fahrzeugproduktion im November 2025 endete). Wikipedia-Zahlen sind teils Jahre alt. Die Ampel ist eine eigene Einordnung nach offen genannten Schwellen, keine Kaufempfehlung. Kreise sind grob: ein Stadtteil kann anders liegen als sein Landkreis. Die Rohdaten (`recherche/karte_roh/`) liegen nur lokal und sind nicht im Repository.

## Starten

Öffentlich im Netz: https://fachmannhb.github.io/immo-rechner/ (GitHub Pages, ohne Anmeldung).

Lokal: `index.html` im Explorer doppelklicken. Die Seite läuft im Browser, auch ohne Internet. In VS Code sieht man nur den Code.

Privater Link (gleicher Stand): https://claude.ai/artifact/7HJhiXdnS31WPAZqKqH712. Dort funktioniert „Als Datei sichern“ in der Merkliste nicht.

Die Seite speichert Eingaben, Merkliste und Haken nur im Browser des Besuchers. Sie schickt nichts an einen Server und lädt keine fremden Dienste (Schriften und Three.js sind eingebettet).

## Voraussetzungen

Zum Benutzen nur ein aktueller Browser. Zum Ändern und Bauen: Python 3.12, für Tests Node.js und playwright-cli 0.1.21.

## Ändern und neu bauen

`index.html` ist erzeugt und wird nie direkt bearbeitet (Regel R003). Geändert werden:

| Datei | Inhalt |
|---|---|
| `vorlage.html` | Aufbau, Texte, Gestaltung (Farbwerte der Oberfläche oben im `<style>`) |
| `palette.json` | einzige Stelle für Diagramm- und Statusfarben (R024) |
| `app.js` | Bedienlogik: Bereiche, Rechner-Schritte, Ergebnissatz, Merkliste-Karten, Erklärungen |
| `rechner.js` | alle Rechenformeln (ohne Oberfläche, auch von den Tests benutzt) |
| `grafik.js`, `haus3d.js` | Diagramme und 3D-Haus (`merkliste3d.js` wird seit 08.10.2026 nicht mehr eingebaut) |
| `grundriss.js`, `grundriss3d.js` | Bereich Grundriss: Zeichenfläche, Räume, Möbel, Kosten, Speichern; 3D-Ansicht |
| `daten/moebel.js` | Möbel und Umbau-Teile mit Maßen und Preisspannen (Bericht `recherche/08_moebel_preise.md`); Tür und Bad aus `daten/sanierung.js` |
| `daten/*.js` | recherchierte Daten mit Quelle und Abrufdatum; `daten/begriffe.js` enthält die Erklärtexte und Halbsätze |
| `daten/steuern.js` | Tipps und Fallen „Steuern sparen“ mit Paragraph, Quelle und Abrufdatum (Bericht `recherche/14_steuern_sparen.md`) |
| `daten/einstieg.js`, `daten/bilder.js`, `daten/musterhaus.js` | Einstieg in drei Zeilen und Schritte der Leiste; Zeichnungen; erfundenes Beispiel (alles Texte und Planungswerte, keine Recherche) |
| `daten/pflichten.js`, `daten/besichtigung.js` | Texte des Heizungs- und Energie-Checks (GModG, aus `recherche/15`); Punkte der Besichtigungs-Checkliste |
| `fonts/`, `libs/three.min.js` | eingebettete Schriften (Manrope 700/800, Source Sans 3 400/600/700) und Three.js r160 |

Danach im Ordner `werkzeuge` bauen:

    python -I -X utf8 bau.py

Für den privaten Link: `python -I -X utf8 tmp/artifact_bauen.py <ziel.html>` und die Zieldatei veröffentlichen.

## Prüfen

    node tmp/rechner_test.js
    node tmp/kontrast.js
    python -I -X utf8 tmp/welle1_test.py
    python -I -X utf8 tmp/welle2_test.py
    python -I -X utf8 tmp/steuer_test.py [--fotos]
    python -I -X utf8 tmp/block5_test.py [--fotos]
    node tmp/anzeige_test.js
    powershell -NoProfile -File tmp\pruef_seite.ps1 -Fotos
    powershell -NoProfile -File tmp\bedien_test.ps1
    powershell -NoProfile -File tmp\grundriss_test.ps1
    powershell -NoProfile -File tmp\karte_test.ps1
    powershell -NoProfile -File tmp\grundriss_fotos.ps1

Der Rechentest vergleicht die Formeln mit Referenzwerten (Präsentation Folie 4, 5, 7; Annuität; ImmoWertV; § 559 BGB). Das Prüfskript öffnet die Seite im Browser, setzt Beispieldaten ein, liest die Ergebnisse aus, testet Merkliste, Import und Speicher, misst den Überlauf in drei Breiten und beiden Designs (alle Schritte und Aufklapper offen) und macht Fotos nach `.playwright-cli/`. Der Bedientest prüft Kacheln, Zurück-Knopf, Sonne/Mond, Erklärungen, Rechner-Schritte, Angebote B/C und das Menü. Für Ansichten im Normalzustand: `tmp\fotos.ps1 -Bereiche rechner,merkliste -Breiten 1440,390` (in PowerShell mit `&` aufrufen, damit die Listen ankommen).

`tmp/welle1_test.py` prüft die Umbau-Welle 1: kleinste Schriftgröße je Bereich und Breite, Leiste (richtiger aktiver Punkt, unsichtbar auf Start/Recht/Monteur/Impressum, Handy-Zeile), Beispiel (ein Klick ab der Startseite, leeren stellt eigene Werte und Merkliste wieder her), Fußzeile in jedem Bereich, Impressum-Felder und Du-Formen im sichtbaren Text. `tmp/alle_tests.ps1 -Marke vorher` führt alle Skripte nacheinander aus und legt die Ausgaben nach `tmp/out_*_<marke>.txt`. Die Ansprache „Sie“ hat den Sollwert in `bedien_test.ps1` geändert (alt „Dein Rechenbeispiel: Du legst etwa 73“, neu „Ihr Rechenbeispiel: Sie legen etwa 73“).

Der Grundriss-Test lädt einen erfundenen Musterplan (`tmp/grundriss_muster.js`) und prüft Wohnfläche, Nutzfläche, Kosten, Zeichnen per Maus, Tastatur, Übernahme in den Rechner, Neuladen und 3D.

Letzter Lauf 08.10.2026 (nach Einbau Grundriss): alle Werte wie Soll, kein Überlauf in allen zehn Bereichen, keine Konsolenfehler, Bedientest grün (eine Prüfzeile vergleicht jetzt Zeichencodes, weil die Konsole „€“ verfälscht), Grundriss-Test grün.

## Grenzen

- Merkliste, Eingaben und Haken liegen nur im Browser. Echte Sicherung: „Als Datei sichern“.
- Recherchierte Werte haben einen Stand (Startseite, „Wie aktuell sind die Daten?“, und `recherche/`). Grunderwerbsteuer außer Bremen, Förderhöhen nach der BEG-Reform 21.07.2026, Sanierungskosten und zehn Landesbauordnungs-Titel sind nicht amtlich bestätigt; die Seite kennzeichnet das.
- Liegenschaftszins (4 %), Regional- und Sachwertfaktor sind Annahmen, bis die Werte des Gutachterausschusses eingetragen sind.
- Wertermittlung ist eine eigene Schätzung nach ImmoWertV-Formeln, kein Verkehrswertgutachten.
- Grundriss: kein Bauplan. Wände sind Raumränder ohne Wandstärke, Dachschrägen nur als Flächenanteil, 3D zeigt nur die gewählte Etage. Möbelpreise fast nur von IKEA (Einstieg bis oberes IKEA-Niveau); Matratze 140×200 ohne geprüften Preis, Wand entfernen nur aus einer Quelle; einige Zeichenmaße geschätzt (in der Seite markiert). Ein großes Grundrissbild passt eventuell nicht in den Browserspeicher; dann sagt die Seite das, und der Plan sollte als Datei gesichert werden.
- Die Ampeln sind eigene Einordnungen nach offen genannten Schwellen, keine Kaufempfehlung.
- Offen: Impressum und Datenschutz sind nur ein Gerüst mit Feldern; ob und mit welchem Text die öffentliche Seite beides braucht, klären Rechtsanwalt oder seriöser Generator. Bis dahin sollte die öffentliche Seite nicht als rechtlich vollständig gelten.
- Die Prüfskripte (`tmp/`), Recherche-Berichte und Entwürfe liegen nur lokal und sind nicht in diesem Repository.

## Lizenzen der eingebetteten Teile

- Three.js r160: MIT-Lizenz, https://github.com/mrdoob/three.js
- Schriften Manrope und Source Sans 3: SIL Open Font License 1.1, Dateien aus https://fontsource.org (Paket @fontsource)
