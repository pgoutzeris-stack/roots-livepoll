# ROOTS Live Poll

> Interaktive Live-Polling- und Präsentations-Plattform für Workshops, Trainings und Events. Wie Mentimeter / Slido / Polleverywhere, im ROOTS-Design, auf Supabase, deploybar als statische Web-App auf GitHub Pages.

**Live:** https://pgoutzeris-stack.github.io/roots-livepoll/
**Im ROOTS Intranet:** Eingebunden unter **Live Poll**

---

## ✨ Features

### Präsentator-Seite
- 📊 **16 Slide-Typen:** Content · Section · MC-Single · MC-Multi · Wordcloud · Open Text · Scale · Yes/No · Quiz · Q&A · Ranking · Reaction · Number-Guess · Brainstorm · Percent-Split · Pin-on-Image
- ⏱ **Timer / Countdown** pro Slide (mit Auto-Close-Option)
- 🏆 **Quiz-Leaderboard** live (Top-5 während Slide, Top-10 als Closure)
- 🎬 **Workshop-Modus** mit fokussierter Slide-Anzeige
- 📈 **Live-Visualisierungen** (Bubble-Cloud, Bar-Chart, %-Split)
- 🔁 **Auto-Advance** bei X% Antwort-Quote
- 👻 **Anonymous-Mode** pro Slide einstellbar
- 📝 **Slide-Notes** privat für Präsentator
- 📑 **Versionierung** mit Snapshot-Wiederherstellung
- 📤 **CSV-Export** von Session-Ergebnissen
- 🎉 **Konfetti** auf Gewinner-Slide
- 🛡 **Moderation-Queue** (Q&A / Open Antworten erst nach Approval)
- 🚀 **Self-Paced Mode** (Teilnehmer in eigenem Tempo)

### Teilnehmer-Seite (mobil-optimiert)
- 🔗 **Beitreten per 6-stelligem Code** oder QR
- 📱 **PWA** — installierbar auf Home-Screen
- 💬 **Q&A Upvoting** — Fragen werden nach Popularität sortiert
- 🎭 **Reaktions-Stream** — Floating Emojis sichtbar für alle
- ✓ **Optimistic UI** — Antwort sofort bestätigt
- 📳 **Haptic Feedback** auf Submit
- 🌙 **Dark Mode** automatisch
- ♿ **A11y** — Screen-Reader, Focus-Trap, Reduce-Motion

### Plattform
- 🔐 **Auto-Login** über ROOTS Intranet Bridge
- 🔄 **Realtime** via Supabase Channels (Postgres-Changes + Broadcast)
- 💪 **Auto-Reconnect** bei Verbindungsabbrüchen (Exponential Backoff)
- 📡 **Sync-Status-Badge** im Header (Live / Reconnecting / Offline)
- 🛡 **RLS** auf jeder Tabelle, granular pro Session/Slide
- 📊 **Audit-Log** für Debug + Compliance
- ⚙️ **Auto-Cleanup** stale Sessions nach 24h
- 🔒 **Rate-Limits** (500 Teilnehmer/Session, 50 Antworten/Slide/Teilnehmer)
- 📏 **JSON-Größen-Constraint** (8KB max pro Antwort)
- 🚫 **Profanity-Filter** (DE+EN Wortliste)

---

## 🏗 Architektur

```
roots-livepoll/
├── index.html              # 5 Screens: Login, Dashboard, Editor, Present, Participant, Results
├── lp-core.js              # ⭐ Resilience: error-handler, sbCall, reconnect, PWA-reg
├── app.js                  # Haupt-App-Logik (Auth, Dashboard, Editor, Present, Participant)
├── lp-features.js          # Features-Layer: Timer, Leaderboard, Q&A-Upvote, Reactions
├── viz.js                  # Visualisierungs-Komponenten
├── templates.js            # Workshop-Vorlagen + SOP-Tracks
├── styles.css              # Haupt-Styles (ROOTS Design System)
├── lp-extra.css            # ⭐ Skeleton, Empty States, Tooltips, Timer, Leaderboard, Reactions
├── manifest.json           # ⭐ PWA Manifest
├── sw.js                   # ⭐ Service Worker (network-first für Shell, cache-first für Assets)
├── schema.sql              # Supabase Schema V1 (Tabellen + RLS)
├── schema-v2.sql           # ⭐ Migration V2 (Constraints, Indizes, Cron, Q&A-Upvotes, Audit)
├── package.json            # ⭐ DX: ESLint, Prettier, TS-Check, Playwright
├── .eslintrc.json          # ⭐ ESLint mit Live-Poll-Globals
├── .prettierrc.json        # ⭐ Format-Config
└── .github/workflows/
    └── deploy-pages.yml    # ⭐ Auto-Deploy mit Cache-Busting (__BUILD__ → SHA)
```

### Datenfluss-Diagramm

```
Präsentator                  Teilnehmer
   │                             │
   ▼                             ▼
┌──────────────────────────────────────┐
│  Supabase Realtime Channel           │
│   • broadcast: session_sync          │
│   • postgres_changes: lp_sessions    │
│   • postgres_changes: lp_responses   │
│   • postgres_changes: lp_participants│
└──────────────────────────────────────┘
   │                             │
   ▼                             ▼
┌──────────────────────────────────────┐
│  Postgres (Supabase)                 │
│   • lp_presentations · lp_slides     │
│   • lp_sessions · lp_participants    │
│   • lp_responses · lp_qna_upvotes    │
│   • lp_audit · lp_presentation_versions │
└──────────────────────────────────────┘
```

---

## 🔧 Setup

### 1. Supabase

```bash
# In Supabase SQL Editor (oder via CLI psql):
\i schema.sql         # V1 — Tabellen, RLS, Realtime-Pub
\i schema-v2.sql      # V2 — Constraints, Q&A-Upvotes, Cleanup, Audit
```

### 2. GitHub Pages

```bash
# Push auf main → Workflow läuft automatisch
git push origin main
```

Der Workflow injiziert die Git-SHA in alle `__BUILD__`-Platzhalter — kein manuelles Versionieren mehr.

### 3. Intranet-Integration

Bereits eingebunden als iframe in `ROOTS_Intranet`.

### 4. Lokal entwickeln

```bash
# Statt npm: direkt starten (keine Build-Pipeline nötig)
python3 -m http.server 8080
# oder
npx serve .

# Lint/Format (optional, wenn npm verfügbar):
npm install
npm run lint
npm run format
```

---

## 🎯 Tastaturkürzel

### Präsentations-Modus
| Taste | Aktion |
|---|---|
| `→` / `Space` | Nächste Folie |
| `←` | Vorherige Folie |
| `?` | Hilfe-Overlay |
| `R` | Antworten zurücksetzen |
| `F` | Vollbild |
| `1`–`7` | Reaktion senden (👍❤️🎉😂😮👏🔥) |
| `Esc` | Modal schließen |

### Editor
| Taste | Aktion |
|---|---|
| `⌘S` | Snapshot speichern |
| `⌘D` | Folie duplizieren |
| `⌘⏎` | Präsentation starten |
| `Del` | Folie löschen |

---

## 🚨 Troubleshooting

### „Verbindung verloren" wird dauerhaft angezeigt
- Browser-Konsole prüfen — Supabase-Realtime-Limit erreicht (10 concurrent connections free tier)?
- Hard-Refresh (`Cmd+Shift+R`)
- `localStorage.removeItem('lp_pending_queue')` und neu laden

### Teilnehmer kann nicht beitreten („Session nicht gefunden")
- Session-Code prüfen (Groß-/Kleinschreibung)
- Session noch live? (`select * from lp_sessions where code = 'XXXX' and status in ('live','paused')`)
- Auto-Cleanup beendet Sessions nach 24h

### Q&A-Antwort verschwindet
- Wahrscheinlich Profanity-Filter aktiv oder Moderation eingeschaltet
- Im Editor pro Slide unter `settings.moderate = true` deaktivieren
- Oder Antwort manuell freigeben: `update lp_responses set is_hidden = false where id = '...'`

### Service-Worker hält alte Version fest
- DevTools → Application → Service Workers → "Update" klicken
- Oder im Toast "Jetzt aktualisieren" klicken (erscheint automatisch bei neuem Build)
- Notfall: `caches.keys().then(k => k.forEach(c => caches.delete(c)))`

### „Storage permission denied"
- Service-Role-Key in Supabase erneuert? Frontend nutzt nur anon — kein Service-Role!
- RLS-Policy fehlt: prüfen mit `select * from pg_policies where tablename like 'lp_%'`

---

## 🧪 Debug-Hooks

In der Browser-Konsole verfügbar:

```js
LP.errors()         // letzte 50 Fehler mit Stack + Kontext
LP.clearErrors()    // Error-Log leeren
LP.updateSyncBadge('live')  // Status manuell setzen
State               // Komplette App-State Inspection
window.LP_BUILD     // Aktuelle Build-ID (git SHA)
LP_Timer.start(slide)   // Timer manuell starten
LP_Reactions.broadcast('🎉')  // Reaktion senden
LP_renderLeaderboard(5)  // HTML-String für Top-5
```

---

## 🗄 Schema-Übersicht

| Tabelle | Zweck | Realtime |
|---|---|:-:|
| `lp_presentations` | Decks (Owner, Settings, Status) | ✓ |
| `lp_slides` | Folien (Type, Content, Sort) | — |
| `lp_sessions` | Aktive/beendete Sessions (Code, Status, current_index) | ✓ |
| `lp_participants` | Teilnehmer pro Session (Name, Emoji, last_active) | ✓ |
| `lp_responses` | Antworten (JSON, is_hidden, needs_moderation) | ✓ |
| `lp_qna_upvotes` | Upvotes für Q&A-Fragen | — |
| `lp_presentation_versions` | Snapshots für Rollback | — |
| `lp_audit` | Audit-Log (Session-Events) | — |

### Realtime-Publication
```sql
-- Welche Tabellen werden broadcastet
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename like 'lp_%';
```

### RLS-Übersicht
```sql
select tablename, policyname, cmd
from pg_policies
where tablename like 'lp_%'
order by tablename, cmd;
```

---

## 📊 Performance-Budget

| Metrik | Budget | Ist (geschätzt) |
|---|---|---|
| Initial JS bundle | <250 KB | ~210 KB (app+templates+viz+core+features) |
| First Contentful Paint | <1.5s | ~0.8s (statisches HTML) |
| Time to Interactive | <3s | ~1.5s (Supabase initial fetch) |
| HTTP Requests initial | <8 | 7 (HTML+CSS×2+JS×5+Fonts) |

---

## 🔐 Sicherheit

- **RLS aktiv auf jeder Tabelle**
- **Session-Code 6 Zeichen** — geeignet für Workshops/Trainings; nicht für sensible Daten (>30 Mio Kombinationen)
- **Anti-Abuse:** Trigger limitieren Teilnehmer/Session und Responses/Slide
- **JSON-Validation:** `pg_column_size(response) < 8192` verhindert Storage-Bombing
- **Profanity-Filter** auf Frontend (umgehbar — für echte Moderation Server-Side empfohlen)
- **Auto-Expiry** nach 24h verhindert lange offene Sessions

---

## 🔮 Roadmap

### Bereits geliefert ✅
- Foundation: Error-Reporter, sbCall-Wrapper, Reconnect-Logic
- PWA: Manifest + Service Worker mit Update-Prompt
- Schema-V2: Constraints, Indizes, Auto-Cleanup, Audit-Log, Q&A-Upvotes
- Features: Timer, Leaderboard, Q&A-Upvoting, Reaction-Stream, Auto-Advance
- UX: Skeleton, Empty States, Tooltips, Focus-Trap, Reduce-Motion
- DX: ESLint, Prettier, Auto-Cache-Bust via Git-SHA

### Geplant 🚧
- [ ] **App.js Modul-Split** in 8+ Files (refactor sprint)
- [ ] **Bild-Upload** für Slides via Supabase Storage
- [ ] **PDF-Export** der gesamten Präsentation
- [ ] **Co-Host-Funktion** (zweite Person darf Slides wechseln)
- [ ] **Breakout-Rooms** für Gruppen-Voting
- [ ] **i18n DE/EN** mit JSON-Files
- [ ] **Webhooks** bei Session-End → POST zu URL
- [ ] **Playwright-Smoke-Tests** (Login, Create, Join, Submit)
- [ ] **Trend-Analytics** über mehrere Sessions

---

## 📝 Changelog

### V1.1.0 — 2026-05-22
- ✨ Timer/Countdown pro Slide
- ✨ Quiz-Leaderboard live
- ✨ Q&A-Upvoting
- ✨ Reaction-Stream (Floating Emojis, Keys 1-7)
- ✨ Auto-Advance bei X% Antwort-Quote
- 🐛 Globaler Error-Handler + auto-Reconnect
- 🐛 Service-Worker mit Update-Prompt
- 🔧 Schema V2: Constraints, Indizes, Audit-Log
- 🎨 Skeleton-Loader, Empty States, Tooltips
- ♿ Focus-Trap in Modals, Reduce-Motion-Support
- 🔧 Auto-Cache-Busting via Git-SHA in Deploy-Workflow

### V1.0.0 — 2026-05-20
- 🎉 Initial Release: 16 Slide-Typen, Workshop-Modus, SOP-Templates

---

## 🤝 Architektur-Entscheidungen

**Warum kein Build-Tool?**
GitHub Pages serviert statische Dateien direkt. Eine Build-Pipeline würde Komplexität ohne Mehrwert hinzufügen. Sollten in Zukunft Bundle-Size oder Code-Split kritisch werden, ist Migration zu Vite/esbuild trivial.

**Warum 3 separate JS-Files (lp-core, app, lp-features)?**
- `lp-core` MUSS vor `app.js` geladen werden (definiert `window.LP`, Error-Handler)
- `lp-features` MUSS nach `app.js` geladen werden (hookt sich in `renderPresent` ein)
- Diese Trennung ermöglicht surgical Updates ohne Risiko, `app.js` zu zerschießen

**Warum kein React/Vue?**
- Keine Build-Pipeline nötig
- Schnellere TTI (kleinerer Bundle)
- Vanilla DOM-API ausreichend für die Use-Cases
- ROOTS-Tools konsistent in Vanilla

---

Co-Authored-By: Claude Sonnet 4.6
