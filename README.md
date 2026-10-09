# Immobilien-Werkzeuge

Eine lokale Webseite zum Suchen, Vergleichen, Durchrechnen und Kaufen von Immobilien zur Vermietung, mit Wertermittlung, Umbau-Rechner, Ablauf zum Abhaken und Rechtsverzeichnis. Arbeitswerkzeug, keine Anlage-, Rechts- oder Steuerberatung.

Aufbau seit 08.10.2026: Startseite „Was willst du tun?“ mit sieben Kacheln und einer kleinen Extra-Kachel (Monteurzimmer), alle Bereiche zusätzlich über „Alle Bereiche“ oben rechts. Der Rechner hat vier Schritte und zeigt oben das Ergebnis als Satz mit Ampel (eigene Einordnung, keine Empfehlung). Fachbegriffe haben ein (?) mit Erklärung in einfacher Sprache. Profi-Teile (Formeln, Tilgungsplan, Sachwert) sind eingeklappt. Farben: Violett und Blau, hell und dunkel (Knopf mit Sonne oder Halbmond).

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
| `daten/*.js` | recherchierte Daten mit Quelle und Abrufdatum; `daten/begriffe.js` enthält die Erklärtexte |
| `fonts/`, `libs/three.min.js` | eingebettete Schriften (Manrope 700/800, Source Sans 3 400/600/700) und Three.js r160 |

Danach im Ordner `werkzeuge` bauen:

    python -I -X utf8 bau.py

Für den privaten Link: `python -I -X utf8 tmp/artifact_bauen.py <ziel.html>` und die Zieldatei veröffentlichen.

## Prüfen

    node tmp/rechner_test.js
    node tmp/anzeige_test.js
    powershell -NoProfile -File tmp\pruef_seite.ps1 -Fotos
    powershell -NoProfile -File tmp\bedien_test.ps1
    powershell -NoProfile -File tmp\grundriss_test.ps1
    powershell -NoProfile -File tmp\karte_test.ps1
    powershell -NoProfile -File tmp\grundriss_fotos.ps1

Der Rechentest vergleicht die Formeln mit Referenzwerten (Präsentation Folie 4, 5, 7; Annuität; ImmoWertV; § 559 BGB). Das Prüfskript öffnet die Seite im Browser, setzt Beispieldaten ein, liest die Ergebnisse aus, testet Merkliste, Import und Speicher, misst den Überlauf in drei Breiten und beiden Designs (alle Schritte und Aufklapper offen) und macht Fotos nach `.playwright-cli/`. Der Bedientest prüft Kacheln, Zurück-Knopf, Sonne/Mond, Erklärungen, Rechner-Schritte, Angebote B/C und das Menü. Für Ansichten im Normalzustand: `tmp\fotos.ps1 -Bereiche rechner,merkliste -Breiten 1440,390` (in PowerShell mit `&` aufrufen, damit die Listen ankommen).

Der Grundriss-Test lädt einen erfundenen Musterplan (`tmp/grundriss_muster.js`) und prüft Wohnfläche, Nutzfläche, Kosten, Zeichnen per Maus, Tastatur, Übernahme in den Rechner, Neuladen und 3D.

Letzter Lauf 08.10.2026 (nach Einbau Grundriss): alle Werte wie Soll, kein Überlauf in allen zehn Bereichen, keine Konsolenfehler, Bedientest grün (eine Prüfzeile vergleicht jetzt Zeichencodes, weil die Konsole „€“ verfälscht), Grundriss-Test grün.

## Grenzen

- Merkliste, Eingaben und Haken liegen nur im Browser. Echte Sicherung: „Als Datei sichern“.
- Recherchierte Werte haben einen Stand (Startseite, „Wie aktuell sind die Daten?“, und `recherche/`). Grunderwerbsteuer außer Bremen, Förderhöhen nach der BEG-Reform 21.07.2026, Sanierungskosten und zehn Landesbauordnungs-Titel sind nicht amtlich bestätigt; die Seite kennzeichnet das.
- Liegenschaftszins (4 %), Regional- und Sachwertfaktor sind Annahmen, bis die Werte des Gutachterausschusses eingetragen sind.
- Wertermittlung ist eine eigene Schätzung nach ImmoWertV-Formeln, kein Verkehrswertgutachten.
- Grundriss: kein Bauplan. Wände sind Raumränder ohne Wandstärke, Dachschrägen nur als Flächenanteil, 3D zeigt nur die gewählte Etage. Möbelpreise fast nur von IKEA (Einstieg bis oberes IKEA-Niveau); Matratze 140×200 ohne geprüften Preis, Wand entfernen nur aus einer Quelle; einige Zeichenmaße geschätzt (in der Seite markiert). Ein großes Grundrissbild passt eventuell nicht in den Browserspeicher; dann sagt die Seite das, und der Plan sollte als Datei gesichert werden.
- Die Ampeln sind eigene Einordnungen nach offen genannten Schwellen, keine Kaufempfehlung.
- Offen: Ob die öffentliche Seite ein Impressum und eine Datenschutzerklärung braucht, wird noch geklärt (Rechtsanwalt oder seriöser Generator). Bis dahin ist die Seite ohne beides online.
- Die Prüfskripte (`tmp/`), Recherche-Berichte und Entwürfe liegen nur lokal und sind nicht in diesem Repository.

## Lizenzen der eingebetteten Teile

- Three.js r160: MIT-Lizenz, https://github.com/mrdoob/three.js
- Schriften Manrope und Source Sans 3: SIL Open Font License 1.1, Dateien aus https://fontsource.org (Paket @fontsource)
