# ROOTS Live Poll

Interaktive Live-Polling- und Präsentations-Plattform im ROOTS-Stil (Whiteboard-Layout).

Live: https://pgoutzeris-stack.github.io/roots-livepoll/

## Features (MVP)

- Präsentations-Dashboard mit Suche, Filtern, Favoriten, Vorlagen
- Editor mit Folienliste, Drag-and-Drop, Eigenschaften-Panel, Auto-Save
- Frage-Typen: Inhalt, MC, Wortwolke, Offen, Skala, Ja/Nein, Quiz, Q&A, Ranking, Reaktion, Schätzfrage, Brainstorming, 100-Punkte, Pin auf Bild
- Live-Präsentation mit Code + QR, Echtzeit-Ergebnissen
- Mobile Teilnehmer-Oberfläche ohne Login (Code)
- Session-Auswertung + CSV-Export
- Supabase Auth über ROOTS Intranet (kein SSO/2FA)

## Setup

1. `schema.sql` im Supabase SQL Editor ausführen
2. GitHub Pages aktivieren (Workflow deployt automatisch bei Push auf `main`)
3. Im ROOTS Intranet ist das Tool unter **Live Poll** eingebunden

## Teilnahme

Teilnehmer öffnen: `https://pgoutzeris-stack.github.io/roots-livepoll/?join=CODE#join/CODE`

## Architektur

- `index.html` + `styles.css` – UI wie Whiteboard
- `app.js` – Auth, Dashboard, Editor, Present, Participant
- `templates.js` – Vorlagen-Bibliothek
- `viz.js` – Live-Visualisierungen
- Supabase Tabellen: `lp_presentations`, `lp_slides`, `lp_sessions`, `lp_participants`, `lp_responses`
