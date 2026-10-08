# Immobilien-Werkzeuge

Eine lokale Webseite zum Suchen, Vergleichen, Durchrechnen und Kaufen von Immobilien zur Vermietung, mit Wertermittlung, Umbau-Rechner, Ablauf zum Abhaken und Rechtsverzeichnis. Arbeitswerkzeug, keine Anlage-, Rechts- oder Steuerberatung.

Aufbau seit 08.10.2026: Startseite „Was willst du tun?“ mit sechs Kacheln und einer kleinen Extra-Kachel (Monteurzimmer), alle Bereiche zusätzlich über „Alle Bereiche“ oben rechts. Der Rechner hat vier Schritte und zeigt oben das Ergebnis als Satz mit Ampel (eigene Einordnung, keine Empfehlung). Fachbegriffe haben ein (?) mit Erklärung in einfacher Sprache. Profi-Teile (Formeln, Tilgungsplan, Sachwert) sind eingeklappt. Farben: Violett und Blau, hell und dunkel (Knopf mit Sonne oder Halbmond).

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
| `daten/*.js` | recherchierte Daten mit Quelle und Abrufdatum; `daten/begriffe.js` enthält die Erklärtexte |
| `fonts/`, `libs/three.min.js` | eingebettete Schriften (Manrope 700/800, Source Sans 3 400/600/700) und Three.js r160 |

Danach im Ordner `werkzeuge` bauen:

    python -I -X utf8 bau.py

Für den privaten Link: `python -I -X utf8 tmp/artifact_bauen.py <ziel.html>` und die Zieldatei veröffentlichen.

## Prüfen

    node tmp/rechner_test.js
    powershell -NoProfile -File tmp\pruef_seite.ps1 -Fotos
    powershell -NoProfile -File tmp\bedien_test.ps1

Der Rechentest vergleicht die Formeln mit Referenzwerten (Präsentation Folie 4, 5, 7; Annuität; ImmoWertV; § 559 BGB). Das Prüfskript öffnet die Seite im Browser, setzt Beispieldaten ein, liest die Ergebnisse aus, testet Merkliste, Import und Speicher, misst den Überlauf in drei Breiten und beiden Designs (alle Schritte und Aufklapper offen) und macht Fotos nach `.playwright-cli/`. Der Bedientest prüft Kacheln, Zurück-Knopf, Sonne/Mond, Erklärungen, Rechner-Schritte, Angebote B/C und das Menü. Für Ansichten im Normalzustand: `tmp\fotos.ps1 -Bereiche rechner,merkliste -Breiten 1440,390` (in PowerShell mit `&` aufrufen, damit die Listen ankommen).

Letzter Lauf 08.10.2026: alle Werte wie Soll, kein Überlauf, keine Konsolenfehler, Bedientest 15 von 15 grün.

## Grenzen

- Merkliste, Eingaben und Haken liegen nur im Browser. Echte Sicherung: „Als Datei sichern“.
- Recherchierte Werte haben einen Stand (Startseite, „Wie aktuell sind die Daten?“, und `recherche/`). Grunderwerbsteuer außer Bremen, Förderhöhen nach der BEG-Reform 21.07.2026, Sanierungskosten und zehn Landesbauordnungs-Titel sind nicht amtlich bestätigt; die Seite kennzeichnet das.
- Liegenschaftszins (4 %), Regional- und Sachwertfaktor sind Annahmen, bis die Werte des Gutachterausschusses eingetragen sind.
- Wertermittlung ist eine eigene Schätzung nach ImmoWertV-Formeln, kein Verkehrswertgutachten.
- Die Ampeln sind eigene Einordnungen nach offen genannten Schwellen, keine Kaufempfehlung.
- Offen: Ob die öffentliche Seite ein Impressum und eine Datenschutzerklärung braucht, wird noch geklärt (Rechtsanwalt oder seriöser Generator). Bis dahin ist die Seite ohne beides online.
- Die Prüfskripte (`tmp/`), Recherche-Berichte und Entwürfe liegen nur lokal und sind nicht in diesem Repository.

## Lizenzen der eingebetteten Teile

- Three.js r160: MIT-Lizenz, https://github.com/mrdoob/three.js
- Schriften Manrope und Source Sans 3: SIL Open Font License 1.1, Dateien aus https://fontsource.org (Paket @fontsource)
