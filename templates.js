/* Vorlagen – umfangreich, arbeitsalltagnah, vielfältige Folientypen */
window.LP_TEMPLATE_STYLE = { bgColor: '#ffffff', textColor: '#0f172a', accentColor: '#206efb' };
window.LP_TEMPLATE_SETTINGS = { anonymous: false, askName: true, showResultsLive: true, profanityFilter: true, multipleResponses: false };

// ─── WORKSHOP-EINSTELLUNGEN (zentral anpassen) ────────────────────────────────
// Gelten für alle Brainstorm-Sammelrunden in SOP- und Marketing-Vorlagen.
window.LP_WORKSHOP_SETTINGS = {
  brainstormTimeLimitSec: 300,   // Sammelzeit pro Folie in Sekunden (0 = kein Limit)
  brainstormMaxResponses: 2,     // Maximale Use Cases pro Teilnehmer pro Folie
};

function tplSlide(type, content, settings = {}) {
  return {
    slide_type: type,
    content: { ...window.LP_TEMPLATE_STYLE, ...content },
    settings: { ...window.LP_TEMPLATE_SETTINGS, ...settings },
  };
}

// Shorthand für Brainstorm-Einstellungen mit globalen Workshop-Limits
function brainstormSettings(extra = {}) {
  const ws = window.LP_WORKSHOP_SETTINGS;
  return {
    showResultsLive: true,
    workshopMode: 'collect',
    profanityFilter: true,
    timeLimitSec: ws.brainstormTimeLimitSec,
    responseLimit: ws.brainstormMaxResponses,
    multipleResponses: ws.brainstormMaxResponses > 1,
    ...extra,
  };
}

const SOP_TOOL_TRACKS = [
  {
    title: 'Track 1: Pre-Engagement',
    class: 'track-pre',
    intro: 'Vom ersten Kontakt bis zum unterschriebenen Vertrag. 3 Phasen.',
    phases: [
      {
        name: 'Anbahnung',
        intro: 'Potenziellen Kunden erkennen, Bedarf erspüren, ROOTS vorstellen.',
        cards: [
          {
            name: 'Bedarfserkennung / Problem Sensing',
            intro: 'Signale für einen möglichen Beratungsbedarf frühzeitig erkennen und qualifizieren.',
            prompt: 'Welche KI hilft beim Erkennen und Qualifizieren von Beratungsbedarf?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: LinkedIn-Signal-Monitoring, News-Tracker zu Zielkunden, Intent-Scoring-Bot.',
            voteMax: 2,
          },
          {
            name: 'Erstgespräch / ROOTS Vorstellung',
            intro: 'ROOTS Positionierung, Arbeitsweise und Team im Erstkontakt überzeugend präsentieren.',
            prompt: 'Welche KI macht den Erstkontakt persönlicher und schärfer?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: KI-personalisiertes Outreach, Auto-Recherche zum Kunden vorab, Pitch-Deck-Generator.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Exploration',
        intro: 'Kernproblem durchdringen, Ziele schärfen, erste Hypothesen ableiten.',
        cards: [
          {
            name: 'Problem Verstehen',
            intro: 'Kundenproblem tief durchdringen — Symptome von Ursachen trennen.',
            prompt: 'Welche KI macht Problem-Framing schneller und präziser?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: \"5-Why\"-Bot, Symptom-Ursache-Mapping, Auto-Transkript von Discovery-Calls.',
            voteMax: 2,
          },
          {
            name: 'Zielstellung klären',
            intro: 'Gemeinsame Ziele, Erfolgskriterien und Erwartungen aller Stakeholder definieren.',
            prompt: 'Welche KI hilft, Ziele schneller und klarer zu formulieren?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: SMART-Goal-Coach, KI-Moderator für Discovery-Calls, Highlight-Extraktion aus Transcripts.',
            voteMax: 2,
          },
          {
            name: 'Initiale Analyse',
            intro: 'Erste faktenbasierte Einschätzung von Markt, Wettbewerb und Ist-Situation.',
            prompt: 'Welche KI beschleunigt Markt- und Wettbewerbs-Analysen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Perplexity Deep Research, Industry-Research-Bot, SWOT-Generator.',
            voteMax: 2,
          },
          {
            name: 'Initiale Hypothese(n)',
            intro: 'Erste fundierte Hypothesen zur Problemlösung entwickeln und dokumentieren.',
            prompt: 'Welche KI hilft beim Entwickeln und Schärfen erster Hypothesen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Hypothesen-Generierung aus Interviews, Issue-Tree-Bot, LLM als Sparring-Partner.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Pitch',
        intro: 'Angebot entwickeln, überzeugend pitchen, Vertrag abschließen.',
        cards: [
          {
            name: 'Projektablauf skizzieren',
            intro: 'Groben Projektplan, Vorgehensweise und Meilensteine für den Kunden skizzieren.',
            prompt: 'Welche KI hilft beim schnellen Skizzieren eines überzeugenden Projektablaufs?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Workplan aus Scope-Doc, Timeline-Generator, Meilenstein-Template-AI.',
            voteMax: 2,
          },
          {
            name: 'KVA aufsetzen',
            intro: 'Kostenschätzung, Vertragsbasis und kommerzielles Angebot strukturieren.',
            prompt: 'Welche KI unterstützt beim sauberen Aufsetzen eines KVA?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Aufwand-Predictor aus Scope, Pricing-Optimizer, Contract-Template-Filler.',
            voteMax: 2,
          },
          {
            name: 'Kundenpitch oder E-Mail Kommunikation',
            intro: 'Angebot persönlich pitchen oder überzeugend schriftlich kommunizieren.',
            prompt: 'Welche KI macht Pitch und Kommunikation schärfer und persönlicher?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Pitch-Deck-Optimizer, Personalisierungs-AI für E-Mails, Rehearsal-Coach-Bot.',
            voteMax: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'Track 2: Execution',
    class: 'track-ops',
    intro: 'Vom Projekt-Kickoff bis zur Auslieferung und Implementierung. 5 Phasen.',
    phases: [
      {
        name: 'Ramp-up',
        intro: 'Projekt aufgleisen — Team, Struktur, Zugänge, Kickoff.',
        cards: [
          {
            name: 'Vertrag',
            intro: 'Vertragsabschluss rechtssicher finalisieren und intern ablegen.',
            prompt: 'Welche KI automatisiert oder beschleunigt den Vertragsabschluss?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Contract-Generator, Auto-Risk-Flag, E-Signature-Workflow.',
            voteMax: 1,
          },
          {
            name: 'Team-Staffing, Rollenverteilung',
            intro: 'Passendes Team zusammenstellen und Rollen klar zuweisen.',
            prompt: 'Welche KI hilft beim smarten Team-Staffing und Rollen-Matching?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Skill-Matching-Bot, Rollen-Allokator aus Scope, Kapazitätsplanung-AI.',
            voteMax: 2,
          },
          {
            name: 'Detaillierter Workplan & Projektplan',
            intro: 'Detaillierten Arbeitsplan mit Tasks, Verantwortlichkeiten und Timeline erstellen.',
            prompt: 'Welche KI generiert oder optimiert Workpläne und Projektpläne?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Kanban aus Scope, Timeline-Generator, Projektplan-AI.',
            voteMax: 2,
          },
          {
            name: 'Zugänge',
            intro: 'Benötigte System-, Tool- und Datenzugänge beschaffen und verwalten.',
            prompt: 'Welche KI unterstützt beim Managen von Zugängen und Berechtigungen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Access-Request-Tracker, Onboarding-Checkliste-AI, Permissioning-Bot.',
            voteMax: 1,
          },
          {
            name: 'Daten',
            intro: 'Relevante Datenquellen identifizieren, beschaffen und für Analysen vorbereiten.',
            prompt: 'Welche KI hilft beim Identifizieren, Beschaffen und Aufbereiten von Daten?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Data-Catalog-AI, Auto-Data-Cleaning, Schema-Matching-Bot.',
            voteMax: 2,
          },
          {
            name: 'Kick-off / Client-Onboarding & Erwartungsmanagement',
            intro: 'Projekt formal starten, Stakeholder ausrichten und Erwartungen managen.',
            prompt: 'Welche KI macht Kickoff und Erwartungsmanagement effektiver?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Kickoff-Agenda-Generator, Stakeholder-Map-AI, Expectation-Tracker.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Analyse',
        intro: 'Daten erheben, IST-Situation analysieren, gegen Benchmarks messen.',
        cards: [
          {
            name: 'Datenanforderung & -erhebung',
            intro: 'Benötigte Daten beim Kunden anfragen und strukturiert erheben.',
            prompt: 'Welche KI unterstützt bei Datenanforderung und -erhebung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Data-Request-Template-AI, Survey-Generator, Auto-Follow-up für Datenlieferungen.',
            voteMax: 2,
          },
          {
            name: 'IST-Analyse',
            intro: 'Aktuellen Zustand faktenbasiert analysieren, strukturieren und dokumentieren.',
            prompt: 'Welche KI beschleunigt oder vertieft die IST-Analyse?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Dashboards aus Rohdaten, Process-Mining-AI, Anomalie-Detection.',
            voteMax: 2,
          },
          {
            name: 'Benchmarking',
            intro: 'Performance des Kunden gegen Markt, Wettbewerb und Best Practices messen.',
            prompt: 'Welche KI liefert schnellere und tiefere Benchmark-Vergleiche?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Industry-Benchmark-Scraper, Competitive-Intelligence-AI, KPI-Vergleichs-Bot.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Synthese',
        intro: 'Erkenntnisse verdichten, Storyline entwickeln, Empfehlungen schärfen.',
        cards: [
          {
            name: '„So-What"-Extraktion aus Analysen',
            intro: 'Aus Rohdaten und Analysen handlungsrelevante Erkenntnisse ableiten.',
            prompt: 'Welche KI hilft beim schnellen Destillieren von So-Whats?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Insight-Extraktion aus Analysen, LLM-Sparring für So-What-Test, Pattern-Erkennung.',
            voteMax: 3,
          },
          {
            name: 'Storyline (Pyramid Principle)',
            intro: 'Argumentation nach dem Pyramid Principle logisch und überzeugend strukturieren.',
            prompt: 'Welche KI unterstützt beim Aufbau einer starken Storyline?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Storyline-Coach-AI, Pyramid-Principle-Checker, Auto-Narrative-Generator.',
            voteMax: 2,
          },
          {
            name: 'Priorisierung',
            intro: 'Empfehlungen nach Impact, Aufwand und Realisierbarkeit priorisieren.',
            prompt: 'Welche KI hilft bei der strukturierten Priorisierung von Handlungsoptionen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Impact-Effort-Matrix-AI, Decision-Support-Bot, Multi-Criteria-Priorisierung.',
            voteMax: 2,
          },
          {
            name: 'Business-Case',
            intro: 'Wirtschaftlichkeit der Empfehlung quantifizieren und plausibilisieren.',
            prompt: 'Welche KI beschleunigt die Business-Case-Entwicklung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Business-Case-Calculator, ROI-Modell-Generator, Sensitivitätsanalyse-AI.',
            voteMax: 2,
          },
          {
            name: 'Roadmap & Next Steps',
            intro: 'Umsetzungs-Roadmap und konkrete nächste Schritte definieren.',
            prompt: 'Welche KI hilft bei der Entwicklung einer belastbaren Roadmap?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Roadmap aus Empfehlungen, Dependency-Mapper, Quick-Win-Identifier.',
            voteMax: 2,
          },
          {
            name: 'Executive Summary',
            intro: 'Kernbotschaft und wichtigste Erkenntnisse für Entscheider prägnant zusammenfassen.',
            prompt: 'Welche KI schreibt oder schärft Executive Summaries?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Exec-Summary-Generator, Zusammenfassungs-AI, One-Pager-Bot.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Delivery',
        intro: 'Ergebnisse aufbereiten, präsentieren und formal übergeben.',
        cards: [
          {
            name: 'Charting',
            intro: 'Daten und Erkenntnisse in klare, überzeugende Charts und Visualisierungen übersetzen.',
            prompt: 'Welche KI beschleunigt Charting und Datenvisualisierung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Charting aus Excel, Chart-Empfehlungs-AI, Dataviz-Generator.',
            voteMax: 2,
          },
          {
            name: '(Steering-Committee) Präsentation(en)',
            intro: 'Ergebnisse vor Kunden, Management oder Steering Committee überzeugend präsentieren.',
            prompt: 'Welche KI unterstützt bei der Präsentation vor Entscheidern?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Präsentations-Coach-AI, Slide-Optimizer, Rehearsal-Bot.',
            voteMax: 2,
          },
          {
            name: 'ggf. Q&A im JFX',
            intro: 'Fragen und kritische Einwände im JFX-Format souverän und präzise beantworten.',
            prompt: 'Welche KI hilft, auf schwierige Fragen besser vorbereitet zu sein?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Fragen-Anticipation-Bot, Devil-Advocate-AI, Auto-FAQ aus Präsentationsinhalt.',
            voteMax: 1,
          },
          {
            name: 'Elevator Test für kommunikative Stärke der Empfehlung',
            intro: 'Empfehlung in 30 Sekunden klar, prägnant und überzeugend vertreten können.',
            prompt: 'Welche KI hilft beim Schärfen des Elevator Pitches einer Empfehlung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Pitch-Feedback-AI, Klarheits-Check-Bot, Elevator-Test-Simulator.',
            voteMax: 1,
          },
          {
            name: 'Auslieferung / Sign-off',
            intro: 'Finale Deliverables übergeben und formalen Abschluss mit dem Kunden sichern.',
            prompt: 'Welche KI unterstützt bei der strukturierten Übergabe und dem Sign-off?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Deliverable-Checklist-AI, Sign-off-Workflow-Bot, Archive-Generator.',
            voteMax: 1,
          },
        ],
      },
      {
        name: 'Implementierung',
        intro: 'Empfehlungen umsetzen — Fähigkeiten aufbauen, Change begleiten, Ergebnisse sichern.',
        cards: [
          {
            name: 'Capability Building & Training',
            intro: 'Kundenseitige Kompetenzen und Fähigkeiten für die Umsetzung systematisch aufbauen.',
            prompt: 'Welche KI unterstützt Capability Building und Training?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Personalisierte Lernpfad-AI, Training-Content-Generator, Kompetenz-Gap-Analyse-Bot.',
            voteMax: 2,
          },
          {
            name: 'Change-Management',
            intro: 'Veränderungsprozess strukturiert begleiten und Widerstände proaktiv managen.',
            prompt: 'Welche KI macht Change-Management effektiver?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Stakeholder-Sentiment-Monitor, Change-Story-Generator, Widerstandsanalyse-AI.',
            voteMax: 2,
          },
          {
            name: 'Governance',
            intro: 'Entscheidungsstrukturen und Steuerungsmechanismen für die Umsetzung etablieren.',
            prompt: 'Welche KI hilft beim Aufsetzen effizienter Governance-Strukturen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: RACI-Generator, Meeting-Cadence-Planer, Decision-Log-AI.',
            voteMax: 1,
          },
          {
            name: 'Pilot-Design & Durchführung',
            intro: 'Pilotprojekt konzipieren, kontrolliert durchführen und Ergebnisse bewerten.',
            prompt: 'Welche KI unterstützt beim Design und der Auswertung von Pilots?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: A/B-Test-Design-AI, Pilot-Tracking-Dashboard, Ergebnis-Auswertungs-Bot.',
            voteMax: 2,
          },
          {
            name: 'Monitoring',
            intro: 'Fortschritt und Wirkung der Implementierung systematisch messen und steuern.',
            prompt: 'Welche KI automatisiert das Implementierungs-Monitoring?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: KPI-Tracker-AI, Anomalie-Alert-Bot, Auto-Fortschrittsbericht.',
            voteMax: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'Track 3: Post-Engagement',
    class: 'track-post',
    intro: 'Sauberer Projektabschluss und nachhaltige Kundenbeziehung. 2 Phasen.',
    phases: [
      {
        name: 'Closeout',
        intro: 'Projekt sauber abschließen — Übergabe, Abrechnung, Feedback, Learnings.',
        cards: [
          {
            name: 'Finale Übergabe',
            intro: 'Alle Ergebnisse, Dokumente und Deliverables strukturiert an den Kunden übergeben.',
            prompt: 'Welche KI automatisiert oder verbessert die finale Projektübergabe?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Abschlussbericht, Übergabe-Checkliste-AI, Dokumentations-Bot.',
            voteMax: 2,
          },
          {
            name: 'Rechnung',
            intro: 'Leistungsabrechnung korrekt erstellen und Zahlungseingang sicherstellen.',
            prompt: 'Welche KI unterstützt beim effizienten Rechnungs- und Zahlungsmanagement?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Invoicing-AI, Auto-Mahnwesen, Zahlungseingangs-Tracker.',
            voteMax: 1,
          },
          {
            name: 'Team-Feedback & Evaluation (NPS)',
            intro: 'Projekterfahrungen intern und mit dem Kunden strukturiert bewerten.',
            prompt: 'Welche KI hilft beim effizienten Einholen und Auswerten von Feedback?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: NPS-Bot, Sentiment-aus-Email, Auto-Theme-Extraktion aus Feedbacks.',
            voteMax: 2,
          },
          {
            name: 'Internes Review & Learnings',
            intro: 'Projektlernpunkte intern dokumentieren und für künftige Projekte nutzbar machen.',
            prompt: 'Welche KI verbessert unsere Retros und den Learnings-Speicher?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Retro-Facilitator-Bot, Auto-Learning-Database, Pattern-Detection across Projects.',
            voteMax: 2,
          },
          {
            name: 'Interne Margin-Analyse',
            intro: 'Wirtschaftlichkeit des Projekts analysieren und Erkenntnisse für künftige Kalkulation ableiten.',
            prompt: 'Welche KI unterstützt die Margin-Analyse und Projektkalkulation?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Profitabilitäts-Report, Stunden-Auswertungs-AI, Budget-vs-Actual-Analyse.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Follow-up',
        intro: 'Beziehung nachhaltig pflegen, KPIs tracken, Folgeaufträge entwickeln.',
        cards: [
          {
            name: 'KPI-Tracking',
            intro: 'Wirkung und Ergebnisse der umgesetzten Empfehlungen anhand von KPIs messen.',
            prompt: 'Welche KI automatisiert das KPI-Tracking nach Projektabschluss?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: KPI-Dashboard-AI, Auto-Impact-Report, Anomalie-Alerting für Ziel-KPIs.',
            voteMax: 2,
          },
          {
            name: 'Case-Study-Entwicklung',
            intro: 'Projekterfolge als überzeugende Case Study aufbereiten und vermarkten.',
            prompt: 'Welche KI beschleunigt die Case-Study-Entwicklung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Case-Study-Draft-Generator, Quote-Extraktion aus Calls, Reference-Letter-AI.',
            voteMax: 2,
          },
          {
            name: 'Nachfrage weiterer Beratungsbedarf',
            intro: 'Folgeprojekte und neuen Beratungsbedarf beim Kunden proaktiv identifizieren.',
            prompt: 'Welche KI hilft beim Erkennen und Adressieren von Folgebedarf?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Customer-Health-Score, Buying-Signal-Detection, Upsell-Pitch-Generator.',
            voteMax: 2,
          },
        ],
      },
    ],
  },
];

function sopMeta(track, phase, card) {
  const label = track.title.replace(/^Track \d+: /, '');
  return {
    sopTrackKey: track.class,
    sopTrackClass: track.class,
    sopTrackLabel: label,
    sopPhaseName: phase?.name || '',
    sopCardName: card?.name || '',
  };
}

function sopBoardData(track, phaseFilter) {
  const phases = phaseFilter
    ? track.phases.filter((p) => p.name === phaseFilter.name)
    : track.phases;
  return phases.map((p) => ({
    name: p.name,
    cards: p.cards.map((c) => c.name),
  }));
}

function sopTrackIntro(track, trackIndex) {
  return tplSlide('section', {
    title: track.title,
    subtitle: track.phases.map((p) => p.name).join(' · '),
    body: track.intro,
    sopKind: 'track',
    sopTrackIndex: trackIndex + 1,
    ...sopMeta(track),
  }, { workshopMode: 'orient' });
}

// SOP-Übersichtsfolie für eine Phase — erscheint DIREKT VOR dem Brainstorm dieser Phase.
// Zeigt: Phasenname + Intro + alle Karten als strukturierte Liste.
// sopBoard ist enthalten für spätere Erweiterung in app.js.
function sopPhaseOverview(track, phase) {
  return tplSlide('content', {
    title: phase.name,
    subtitle: track.title.replace(/^Track \d+: /, ''),
    body: '',
    sopKind: 'phase-overview',
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase),
  }, { workshopMode: 'orient' });
}

// SOP-Gesamtübersicht für einen Track — erscheint vor dem Track-Brainstorm.
// Zeigt: alle Phasen mit ihren Karten als strukturierte Liste.
function sopTrackOverview(track) {
  return tplSlide('content', {
    title: `SOP · ${track.title.replace(/^Track \d+: /, '')}`,
    subtitle: '',
    body: '',
    sopKind: 'track-overview',
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, { workshopMode: 'orient' });
}

// ─── INSTRUKTIONS-FOLIE ────────────────────────────────────────────────────────
// Erscheint einmal nach dem Opener — erklärt Format, Timing und Limit.

function sopWorkshopInstructions() {
  const ws = window.LP_WORKSHOP_SETTINGS;
  const timeMin = ws.brainstormTimeLimitSec > 0
    ? `${Math.round(ws.brainstormTimeLimitSec / 60)} Minuten`
    : 'offene Zeit';
  return tplSlide('content', {
    title: 'So formuliert ihr Use Cases',
    subtitle: `${timeMin} pro Runde · max. ${ws.brainstormMaxResponses} Use Cases pro Person`,
    body: `Format: Was die KI macht | Wer nutzt sie | Welches Tool\n\nGute Use Cases:\nDiscovery-Call transkribieren + Highlights markieren | PL | Otter.ai\nWettbewerbs-Recherche zu Zielkunden vor dem Erstgespräch | BD | Perplexity\nProposal-Draft aus Briefing in 5 Min. generieren | Senior | ChatGPT\nKPI-Dashboard automatisch aus Rohdaten erstellen | Analyst | Julius.ai\n\nBitte vermeiden:\nKI für E-Mails\nAI einsetzen\nChatGPT nutzen\n\nJe konkreter, desto wertvoller für die Auswertung.`,
    mentiHero: false,
    sopKind: 'instructions',
  }, { workshopMode: 'orient' });
}

// ─── SOP PHASE BRAINSTORM ─────────────────────────────────────────────────────
// Pro Phase wird gesammelt.

function sopPhaseBrainstorm(track, phase) {
  const ws = window.LP_WORKSHOP_SETTINGS;
  return tplSlide('brainstorm', {
    title: `KI Use Cases · ${phase.name}`,
    body: '',
    subtitle: track.title.replace(/^Track \d+: /, ''),
    prompt: `Welche KI seht ihr in dieser Phase? Max. ${ws.brainstormMaxResponses} Use Cases pro Person.\nFormat: Was · Wer · Tool — z. B. „Proposal-Draft aus Briefing → Senior → ChatGPT"`,
    mentiQuestion: true,
    sopKind: 'phase-workshop',
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase),
  }, brainstormSettings());
}

// ─── SOP TRACK BRAINSTORM ─────────────────────────────────────────────────────
// Pro Track: EINE Sammelfolie — alle Phasen + Karten im sopBoard sichtbar.

function sopTrackBrainstorm(track) {
  const ws = window.LP_WORKSHOP_SETTINGS;
  return tplSlide('brainstorm', {
    title: `KI Use Cases · ${track.title.replace(/^Track \d+: /, '')}`,
    body: '',
    subtitle: track.title,
    prompt: `Welche KI seht ihr in diesem Track? Max. ${ws.brainstormMaxResponses} Use Cases pro Person.\nFormat: Was · Wer · Tool — z. B. „Proposal-Draft aus Briefing → Senior → ChatGPT"\n\nNutzt die SOP-Übersicht als Orientierung — alle Phasen und Karten sind mögliche Ansatzpunkte.`,
    mentiQuestion: true,
    sopKind: 'track-collect',
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, brainstormSettings());
}

function sopPhaseVote(track, phase) {
  return tplSlide('mc_multi', {
    title: `Priorisierung · ${phase.name}`,
    subtitle: track.title.replace(/^Track \d+: /, ''),
    prompt: 'Wählt die drei wichtigsten KI Use Cases dieser Phase. Welche Ideen sollten zuerst weitergedacht oder pilotiert werden?',
    mentiQuestion: true,
    options: [],
    maxSelections: 3,
    sopKind: 'phase-vote',
    ...sopMeta(track, phase),
  }, { showResultsLive: true, sopPhaseVote: true, sopVoteMax: 3, workshopMode: 'decide', phaseVoteLeaderboardOnly: true });
}

function sopTrackVote(track, trackIndex) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('mc_multi', {
    title: `Top 3 priorisieren · ${label}`,
    subtitle: `Track ${trackIndex + 1} · alle gesammelten Use Cases`,
    prompt: 'Wählt die drei KI Use Cases, die in diesem Track den größten Hebel für ROOTS haben.\nNutzt die SOP-Übersicht als Kontext: In welchen Phasen zahlen die Ideen wirklich ein?',
    mentiQuestion: true,
    options: [],
    maxSelections: 3,
    sopKind: 'track-vote',
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, { showResultsLive: true, sopTrackVote: true, sopVoteMax: 3, workshopMode: 'decide' });
}

// Präsentations-Session nach dem Track-Vote: Gewinner stellen ihre Use Cases kurz vor.
function sopTrackPresentationSession(track) {
  return tplSlide('content', {
    title: `Presentation Session · ${track.title.replace(/^Track \d+: /, '')}`,
    subtitle: 'Top-gewählte Use Cases · jetzt kurz vorstellen',
    body: `Die Abstimmung ist abgeschlossen — die meistgewählten Use Cases sind sichtbar.\n\nJede Person hat 1–2 Minuten:\n→ Was ist die KI-Idee?\n→ Wer im Team profitiert?\n→ Welches Tool kommt zum Einsatz?\n\nDanach: Top-Ideen gemeinsam in die ICE Matrix eintragen.`,
    mentiHero: false,
    sopKind: 'track-presentation',
    ...sopMeta(track),
  }, { workshopMode: 'present', sopTrackPresentation: true });
}

// ─── CROSS-TRACK SUMMARY ───────────────────────────────────────────────────────

function sopAllTracksSummary() {
  return tplSlide('content', {
    title: 'Track-Top-3 im Überblick',
    subtitle: 'Aus den priorisierten Use Cases aller Tracks',
    body: 'Hier seht ihr die priorisierten Use Cases aus den Track-Abstimmungen. Diese Auswahl wandert im nächsten Schritt in die Impact/Effort-Matrix.',
    sopKind: 'all-tracks-summary',
    sopAllTracksResults: true,
    mentiHero: true,
  }, { workshopMode: 'orient' });
}

// ─── ICE-MATRIX (Impact/Effort) — finale Priorisierung ────────────────────────
// Erscheint am Ende ALLER Vorlagen. Enthält vollständige Priorisierungs-Anleitung.

function sopIceMatrix() {
  return tplSlide('priority_matrix', {
    title: 'Impact/Effort-Matrix',
    prompt: 'Ordnet die priorisierten KI Use Cases gemeinsam in die Matrix ein.\n\n→ Impact: Wie stark verbessert dieser Use Case unsere Arbeit / unsere Qualität?\n→ Effort: Wie hoch ist der Aufwand für Einführung, Lernkurve und laufende Nutzung?\n\nQuick Wins sofort angehen · Strategic Bets langfristig einplanen\nTime Sinks kritisch hinterfragen · Drop weglassen',
    subtitle: 'Impact vs. Effort · finale Priorisierung',
    xAxisLabel: 'Aufwand (Effort)',
    xAxisLow: 'niedrig',
    xAxisHigh: 'hoch',
    yAxisLabel: 'Impact',
    yAxisLow: 'niedrig',
    yAxisHigh: 'hoch',
    quadrants: {
      qw: { label: 'Quick Win', icon: '🚀', desc: 'hoher Impact · niedriger Aufwand → sofort angehen' },
      sb: { label: 'Strategic Bet', icon: '⭐', desc: 'hoher Impact · hoher Aufwand → langfristig planen' },
      ts: { label: 'Time Sink', icon: '🔧', desc: 'niedriger Impact · hoher Aufwand → kritisch hinterfragen' },
      dr: { label: 'Drop', icon: '❌', desc: 'niedriger Impact · niedriger Aufwand → weglassen' },
    },
    sopKind: 'final-matrix',
  }, { showResultsLive: true, sopAllTracksMatrix: true, workshopMode: 'decide' });
}

// ─── ABSCHLUSS-FOLIEN ──────────────────────────────────────────────────────────

function sopWorkshopClose() {
  return [
    tplSlide('section', {
      title: 'Abschluss & Action Items',
      subtitle: '⏱ 10 Min · Take-Aways, NPS und Danke',
    }),
    tplSlide('open', {
      title: 'Mein persönlicher Top-1',
      prompt: 'Welcher Use Case bleibt bei DIR hängen — und warum?',
      subtitle: '⏱ 2 Min',
    }),
    tplSlide('open', {
      title: 'Action Item für die nächsten 14 Tage',
      prompt: 'Was machst du konkret damit in den kommenden 2 Wochen?',
      subtitle: '⏱ 2 Min',
    }),
    tplSlide('scale', {
      title: 'Workshop-Bewertung (NPS)',
      prompt: 'Wie wahrscheinlich würdest du diesen Workshop einem Kollegen empfehlen?',
      subtitle: '0 = gar nicht · 10 = absolut',
      min: 0, max: 10,
      minLabel: 'gar nicht',
      maxLabel: 'absolut',
    }, { anonymous: true }),
    tplSlide('open', {
      title: 'Eine Sache, die wir besser machen können',
      prompt: 'Konstruktives Feedback für den nächsten Workshop?',
      subtitle: 'Anonym · ⏱ 2 Min',
    }, { anonymous: true }),
    tplSlide('content', {
      title: 'Danke! 🙌',
      body: 'Die Top-Use-Cases übergeben wir an die SOP-Owner.\nAction Items sammeln wir in Notion.\nKickoffs für die nominierten Use Cases folgen.\n\nLet\'s build the future of ROOTS.',
      mentiHero: true,
    }),
  ];
}

// ─── BUILD ───────────────────────────────────────────────────────────────────
//
// mode:
// ─── PITCH SESSION + FINALE ABSTIMMUNG ─────────────────────────────────────────

function sopPitchSession() {
  return tplSlide('content', {
    title: 'Pitch Session',
    subtitle: 'Jede Person stellt ihren Use Case kurz vor · 2 Minuten pro Person',
    body: '',
    sopKind: 'pitch-session',
    pitchTimerSec: 120,
  }, { workshopMode: 'present', sopPitchSession: true });
}

function sopFinalAllTracksVote() {
  const ws = window.LP_WORKSHOP_SETTINGS;
  const max = ws?.brainstormMaxResponses || 3;
  return tplSlide('mc_multi', {
    title: 'Finale Priorisierung',
    subtitle: 'Alle Use Cases · wähle deine Favoriten (keine eigenen)',
    prompt: `Welche ${max} Use Cases haben den größten Impact für euer Team?\n→ Eigene Beiträge können nicht gewählt werden.`,
    mentiQuestion: true,
    options: [],
    maxSelections: max,
    sopKind: 'final-vote',
    sopFairVote: true,
  }, { showResultsLive: true, sopAllTracksVote: true, sopFairVote: true, sopVoteMax: max, workshopMode: 'decide' });
}

//  'pro-phase' → Brainstorm je Phase (SOP-Board on Slide) → Track-Vote → Presentation Session → Pitch → ICE-Matrix
//  'pro-track' → EIN Brainstorm (SOP-Board on Slide) → Pitch-Session → Faire Abstimmung → ICE-Matrix
//  'phase'/'track' → legacy aliases

function buildSopKiWorkshopSlides(mode = 'pro-phase') {
  const slides = [];
  const ws = window.LP_WORKSHOP_SETTINGS;
  const timeMin = ws.brainstormTimeLimitSec > 0
    ? `${Math.round(ws.brainstormTimeLimitSec / 60)} Min.`
    : '';

  const modeLabel = {
    'pro-phase': `Pro Phase ${timeMin ? '· ' + timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases · SOP-Kontext vor jeder Phase`,
    'pro-track': `Pro Track ${timeMin ? '· ' + timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases · alle Phasen auf einen Blick`,
    phase:  `Pro Phase ${timeMin ? '· ' + timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases`,
    track:  `Pro Track ${timeMin ? '· ' + timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases`,
  }[mode] || '';

  // 1. Opener
  slides.push(tplSlide('content', {
    title: 'SOP · KI Use-Case Workshop',
    subtitle: modeLabel,
    body: 'QR scannen · Name + Avatar wählen · los geht\'s!',
    mentiHero: true,
  }));

  // 2. Instruktions-Folie (Format, Timing, Limit)
  slides.push(sopWorkshopInstructions());

  // 3. Per Track
  SOP_TOOL_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));

    if (mode === 'pro-phase' || mode === 'phase') {
      // Pro Phase: Brainstorm je Phase (SOP-Board sichtbar) → Track-Vote → Presentation Session
      track.phases.forEach((phase) => {
        slides.push(sopPhaseBrainstorm(track, phase));  // SOP-Board direkt auf Brainstorm-Slide
      });
      slides.push(sopTrackVote(track, ti));
      slides.push(sopTrackPresentationSession(track));

    } else if (mode === 'pro-track' || mode === 'track') {
      // Pro Track: EIN Brainstorm (SOP-Board sichtbar) → kein Track-Vote → konsolidiert am Ende
      slides.push(sopTrackBrainstorm(track));   // SOP-Board direkt auf Brainstorm-Slide
    }
  });

  // 4. Finale: Pitch-Session + Abstimmung + ICE-Matrix
  if (mode === 'pro-track' || mode === 'track') {
    slides.push(sopPitchSession());
    slides.push(sopFinalAllTracksVote());
  } else {
    slides.push(sopAllTracksSummary());
    slides.push(sopPitchSession());
  }
  slides.push(sopIceMatrix());

  return slides;
}

window.SOP_TOOL_TRACKS = SOP_TOOL_TRACKS;

// ─── LOCALSTORAGE: SOP-Struktur beim ersten Laden speichern ──────────────────
(function () {
  const LS_KEY = 'lp_sop_tracks_v2';
  try {
    const existing = localStorage.getItem(LS_KEY);
    if (!existing) {
      localStorage.setItem(LS_KEY, JSON.stringify(SOP_TOOL_TRACKS, null, 2));
      console.info(
        '%c[LP] SOP-Struktur in localStorage gespeichert%c  Key: ' + LS_KEY,
        'background:#206efb;color:#fff;padding:2px 6px;border-radius:4px;font-weight:700',
        'color:#64748b'
      );
    }
    if (window.LP) {
      window.LP.exportSopTracks = function () {
        const json = localStorage.getItem(LS_KEY) || JSON.stringify(SOP_TOOL_TRACKS, null, 2);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(json).then(() => {
            if (window.toast) window.toast('SOP-Struktur in Zwischenablage kopiert ✓', 'success');
          });
        } else {
          console.log(json);
          if (window.toast) window.toast('SOP-Struktur → siehe Konsole', 'info');
        }
        return json;
      };
    }
  } catch (_) { /* quota */ }
})();

// ─── MARKETING SOP TRACKS (DEBUG) ───────────────────────────────────────────
const MARKETING_SOP_TRACKS = [
  {
    title: 'Track 1: Analyse & Insights',
    class: 'track-marketing',
    intro: 'Kampagnen-Performance auswerten, Zielgruppen verstehen, Strategie ableiten. 3 Phasen.',
    phases: [
      {
        name: 'Performance-Analyse',
        intro: 'Kampagnen- und Marketing-Performance auswerten.',
        cards: [
          {
            name: 'KPI-Tracking & Reporting',
            intro: 'Kampagnen-KPIs automatisch erfassen, aufbereiten und kommunizieren.',
            prompt: 'Welche KI automatisiert KPI-Tracking & Reporting?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Dashboard, Anomalie-Alert, Performance-Digest.',
            voteMax: 2,
          },
          {
            name: 'Kanal-Performance',
            intro: 'Performance einzelner Kanäle (SEA, Social, Email, Display) vergleichen.',
            prompt: 'Welche KI verbessert die Kanal-Performance-Analyse?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Cross-Channel-Reporting-AI, Budget-Optimizer, Creative-Performance-Tracker.',
            voteMax: 2,
          },
          {
            name: 'Attribution & ROI',
            intro: 'Beitrag jedes Touchpoints zum Conversion-Pfad messen und bewerten.',
            prompt: 'Welche KI macht Attribution und ROI-Messung präziser?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Multi-Touch-Attribution-AI, Incrementality-Testing-Bot, ROI-Calculator.',
            voteMax: 2,
          },
          {
            name: 'Content-Performance',
            intro: 'Wirksamkeit von Creatives, Texten und Formaten datenbasiert bewerten.',
            prompt: 'Welche KI hilft bei der Content-Performance-Analyse?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Creative-Scoring-AI, A/B-Test-Analyzer, Copy-Performance-Tracker.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Zielgruppen-Insights',
        intro: 'Zielgruppenverhalten und Insights ableiten.',
        cards: [
          {
            name: 'Verhaltensanalyse',
            intro: 'Nutzerverhalten auf Website, App und Social systematisch analysieren.',
            prompt: 'Welche KI macht Verhaltensanalysen schneller und tiefer?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Heatmap-AI, Session-Recording-Analyzer, Funnel-Optimizer.',
            voteMax: 2,
          },
          {
            name: 'Segment-Identifikation',
            intro: 'Relevante Zielgruppensegmente aus Daten erkennen und beschreiben.',
            prompt: 'Welche KI hilft bei der automatischen Segment-Identifikation?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Clustering-AI, Look-alike-Modell, Propensity-Scoring-Bot.',
            voteMax: 2,
          },
          {
            name: 'Persona-Update',
            intro: 'Buyer Personas auf Basis neuer Daten und Insights aktualisieren.',
            prompt: 'Welche KI unterstützt beim datengetriebenen Persona-Update?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Social-Listening-AI, Persona-Generator, Interview-Synthesis-Bot.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Erkenntnisse bündeln & Strategie-Update',
        intro: 'Analyseergebnisse zusammenführen, Muster identifizieren und die Strategie auf Basis daraus anpassen.',
        cards: [
          {
            name: 'Synthese & Muster-Erkennung',
            intro: 'Erkenntnisse aus allen Quellen zusammenführen und übergreifende Muster identifizieren.',
            prompt: 'Welche KI unterstützt die Synthese und Muster-Erkennung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Cross-Channel-Insight-AI, Pattern-Detection-Bot, Auto-Briefing-Generator.',
            voteMax: 2,
          },
          {
            name: 'Handlungsempfehlungen',
            intro: 'Aus gebündelten Erkenntnissen konkrete, priorisierte Empfehlungen ableiten.',
            prompt: 'Welche KI hilft, Empfehlungen automatisch abzuleiten?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Insight-to-Action-AI, Priorisierungs-Bot, Recommendation-Engine.',
            voteMax: 2,
          },
          {
            name: 'Strategie-Anpassung & Roadmap',
            intro: 'Strategie auf Basis der Erkenntnisse gezielt anpassen und Roadmap definieren.',
            prompt: 'Welche KI beschleunigt das Strategie-Update und die Roadmap-Entwicklung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Strategy-Update-AI, Roadmap-Generator, OKR-Alignment-Bot.',
            voteMax: 2,
          },
        ],
      },
    ],
  },
];

// ─── SOP CARD BRAINSTORM (eine Folie pro Karte, kein Body — Kontext via sopBoard) ─
function sopCardBrainstorm(track, phase, card) {
  const ws = window.LP_WORKSHOP_SETTINGS;
  return tplSlide('brainstorm', {
    title: card.name,
    body: '',
    subtitle: phase.name,
    prompt: card.prompt || `Welche KI Use Cases seht ihr hier? Max. ${ws.brainstormMaxResponses} pro Person.\nFormat: Was · Wer · Tool`,
    mentiQuestion: true,
    sopKind: 'card-workshop',
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase, card),
  }, brainstormSettings());
}

// ─── DEBUG · MARKETING SOP KI WORKSHOP ──────────────────────────────────────
function buildDebugSopWorkshopSlides() {
  const slides = [];
  const ws = window.LP_WORKSHOP_SETTINGS;
  const timeMin = ws.brainstormTimeLimitSec > 0
    ? `${Math.round(ws.brainstormTimeLimitSec / 60)} Min.`
    : '';

  // Opener
  slides.push(tplSlide('content', {
    title: 'Marketing SOP · KI Use-Case Workshop',
    subtitle: `Pro Karte ${timeMin ? timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases pro Person`,
    body: 'QR scannen · Name + Avatar wählen · los geht\'s!',
    mentiHero: true,
  }));

  // Instruktions-Folie
  slides.push(sopWorkshopInstructions());

  MARKETING_SOP_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));
    track.phases.forEach((phase) => {
      phase.cards.forEach((card) => {
        slides.push(sopCardBrainstorm(track, phase, card));
      });
    });
    slides.push(sopTrackVote(track, ti));
    slides.push(sopTrackPresentationSession(track));
  });

  // Finale: Übersicht + ICE-Matrix + Abschluss
  slides.push(sopAllTracksSummary());
  slides.push(sopIceMatrix());
  slides.push(...sopWorkshopClose());

  return slides;
}

window.LP_TEMPLATES = [
  {
    key: 'roots-sop-ki-workshop-phase',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Workshop · Pro Phase',
    desc: 'SOP-Kontext je Phase → Brainstorm → Track-Vote → Presentation Session → ICE Matrix.',
    duration: '90–150 Min.',
    group: '6–25',
    tips: 'Höchste Tiefe. SOP-Übersicht vor jedem Brainstorm. 5 Min. / max. 2 Use Cases je Phase.',
    slides: buildSopKiWorkshopSlides('pro-phase'),
  },
  {
    key: 'roots-sop-ki-workshop-track',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Workshop · Pro Track',
    desc: 'Alle Phasen auf einen Blick → Track-Brainstorm → Track-Vote → Presentation Session → ICE Matrix.',
    duration: '60–90 Min.',
    group: '6–25',
    tips: 'Tempo-Format. Vollständige SOP-Übersicht als Kontext. 5 Min. / max. 2 Use Cases pro Track.',
    slides: buildSopKiWorkshopSlides('pro-track'),
  },
  {
    key: 'debug-marketing-sop-workshop',
    category: 'DEBUG',
    name: 'DEBUG · Marketing SOP Workshop',
    desc: 'Marketing-SOP: je Karte KI Use Cases sammeln · Track-Top-3 · Presentation Session · ICE Matrix.',
    duration: '60–90 Min.',
    group: '6–20',
    tips: 'Pro Karte 5 Min. · max. 2 Use Cases · Auswertung nach Teilbereich.',
    slides: buildDebugSopWorkshopSlides(),
  },
];

// ─── DEBUG MOCK DATA ─────────────────────────────────────────────────────────
window.LP_DEBUG_PHASE_USE_CASES = {
  'Anbahnung': [
    'LinkedIn-Signal-Monitoring für Bedarfserkennung',
    'Otter.ai für Discovery-Call-Transcripts',
    'Perplexity Deep Research zum Zielkunden',
    'ChatGPT für personalisiertes Outreach',
    'Synthesia für Pitch-Video vorab',
  ],
  'Exploration': [
    'Auto-Transkript von Discovery-Calls + Themen-Cluster',
    '5-Why-Bot für Symptom-Ursache-Mapping',
    'Highlight-Extraktion aus Stakeholder-Interviews',
    'SMART-Goal-Coach für Zieldefinition',
    'Perplexity für initiale Markt- und Wettbewerbsanalyse',
    'Issue-Tree-Generator für erste Hypothesen',
  ],
  'Pitch': [
    'Proposal-Generator aus Brief + Templates',
    'Auto-Workplan aus Scope-Doc',
    'Pricing-Optimizer mit Marktvergleich',
    'Contract-Template-Filler für KVA',
    'Pitch-Deck-Optimizer mit AI-Feedback',
  ],
  'Ramp-up': [
    'Auto-Kanban-Board aus Scope-Doc',
    'Skill-Matching-Bot für Team-Staffing',
    'Timeline-Generator aus Briefing',
    'Data-Catalog-AI für Datenquellen',
    'Kickoff-Agenda-Generator',
    'Stakeholder-Map-AI für Erwartungsmanagement',
  ],
  'Analyse': [
    'Survey-Generator für Datenanforderung',
    'Auto-Dashboards aus Rohdaten',
    'Process-Mining-AI für IST-Analyse',
    'Industry-Benchmark-Scraper',
    'Competitive-Intelligence-AI für Benchmarking',
  ],
  'Synthese': [
    'LLM-Sparring für So-What-Test aus Analysen',
    'Storyline-Coach-AI nach Pyramid Principle',
    'Impact-Effort-Matrix-AI für Priorisierung',
    'Business-Case-Calculator mit ROI-Modell',
    'Auto-Roadmap aus Empfehlungen',
    'Exec-Summary-Generator',
  ],
  'Delivery': [
    'Auto-Charting aus Excel',
    'Slide-Optimizer für Steering-Committee',
    'Fragen-Anticipation-Bot für Q&A',
    'Elevator-Test-Simulator für Empfehlungen',
    'Deliverable-Checklist-AI für Sign-off',
  ],
  'Implementierung': [
    'Personalisierter Lernpfad für Capability Building',
    'Change-Story-Generator',
    'RACI-Generator für Governance',
    'A/B-Test-Design-AI für Pilots',
    'KPI-Tracker-AI für Monitoring',
    'Anomalie-Alert-Bot bei Zielabweichung',
  ],
  'Closeout': [
    'Auto-Abschlussbericht aus Projektdaten',
    'Invoicing-AI für Rechnungsstellung',
    'NPS-Bot für Team-Feedback',
    'Retro-Facilitator-Bot',
    'Auto-Learning-Database für Learnings',
    'Auto-Profitabilitäts-Report für Margin-Analyse',
  ],
  'Follow-up': [
    'KPI-Dashboard-AI für Impact-Tracking',
    'Case-Study-Draft-Generator',
    'Customer-Health-Score',
    'Buying-Signal-Detection für Folgeprojekte',
    'Upsell-Pitch-Generator',
  ],
};

window.LP_DEBUG_PARTICIPANTS = [
  { name: 'Anna Becker',  emoji: '🦊', color: '#206efb' },
  { name: 'Max Hoffmann', emoji: '🐼', color: '#10b981' },
  { name: 'Lena Schmidt', emoji: '🦁', color: '#06b6d4' },
  { name: 'Tom Werner',   emoji: '🐸', color: '#a855f7' },
  { name: 'Sara Klein',   emoji: '🦄', color: '#ec4899' },
  { name: 'Felix Bauer',  emoji: '🐙', color: '#06b6d4' },
];

window.LP_SLIDE_TYPES = [
  { type: 'content', label: 'Inhalt', icon: 'fa-align-left', desc: 'Titel, Text, Bild' },
  { type: 'section', label: 'Kapitel', icon: 'fa-bookmark', desc: 'Trennfolie' },
  { type: 'mc_single', label: 'Multiple Choice', icon: 'fa-circle-dot', desc: 'Eine Antwort' },
  { type: 'mc_multi', label: 'Mehrfachauswahl', icon: 'fa-square-check', desc: 'Mehrere Antworten' },
  { type: 'yesno', label: 'Ja / Nein', icon: 'fa-toggle-on', desc: 'Schnelle Abstimmung' },
  { type: 'wordcloud', label: 'Wortwolke', icon: 'fa-cloud', desc: 'Kurze Begriffe' },
  { type: 'open', label: 'Offene Frage', icon: 'fa-comment', desc: 'Freitext' },
  { type: 'scale', label: 'Skala', icon: 'fa-sliders', desc: 'Bewertung 1–10' },
  { type: 'ranking', label: 'Ranking', icon: 'fa-arrow-down-wide-short', desc: 'Reihenfolge' },
  { type: 'quiz', label: 'Quiz', icon: 'fa-bolt', desc: 'Richtige Antwort + Punkte' },
  { type: 'qa', label: 'Q&A', icon: 'fa-circle-question', desc: 'Fragen & Upvotes' },
  { type: 'brainstorm', label: 'Brainstorming', icon: 'fa-lightbulb', desc: 'Freitext sammeln · optional Ranking + Ergebnis' },
  { type: 'reaction', label: 'Reaktion', icon: 'fa-face-smile', desc: 'Emoji-Feedback' },
  { type: 'number_guess', label: 'Zahl schätzen', icon: 'fa-hashtag', desc: 'Durchschnitt/Median' },
  { type: 'percent_split', label: '100 Punkte', icon: 'fa-chart-pie', desc: 'Prozent verteilen' },
  { type: 'pin_image', label: 'Pin auf Bild', icon: 'fa-location-dot', desc: 'Marker setzen' },
  { type: 'priority_matrix', label: 'Priorisierungs-Matrix', icon: 'fa-table-cells-large', desc: 'Items per Drag-and-Drop in 2×2-Matrix einordnen' },
];

window.LP_DEFAULT_STYLE = {
  bgColor: '#ffffff',
  textColor: '#0f172a',
  accentColor: '#206efb',
};

window.LP_INTERACTIVE_TYPES = new Set([
  'mc_single', 'mc_multi', 'yesno', 'wordcloud', 'open', 'scale', 'ranking',
  'quiz', 'qa', 'brainstorm', 'reaction', 'number_guess', 'percent_split', 'pin_image', 'priority_matrix',
]);

window.LP_AVATAR_EMOJIS = ['🦊', '🐼', '🦁', '🐸', '🦄', '🐙', '🦋', '🐳', '🌟', '🔥', '💎', '🎯', '🚀', '🌈', '🎨', '⚡'];
window.LP_AVATAR_COLORS = ['#206efb', '#10b981', '#06b6d4', '#dc2626', '#6366f1', '#0ea5e9', '#14b8a6', '#22d3ee', '#3b82f6', '#475569'];

window.LP_DEFAULT_CONTENT = {
  content: { title: 'Neue Folie', body: '', imageUrl: '', ...window.LP_DEFAULT_STYLE },
  section: { title: 'Kapitel', subtitle: '', ...window.LP_DEFAULT_STYLE },
  mc_single: { title: 'Frage', prompt: 'Wähle eine Option', options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }] },
  mc_multi: { title: 'Frage', prompt: 'Wähle mehrere', options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }], maxSelections: 3 },
  yesno: { title: 'Ja oder Nein?', prompt: '' },
  wordcloud: { title: 'Wortwolke', prompt: 'Gib ein kurzes Wort ein' },
  open: { title: 'Offene Frage', prompt: 'Deine Antwort…' },
  scale: { title: 'Skala', prompt: 'Bewerte von 1 bis 10', min: 1, max: 10, minLabel: 'niedrig', maxLabel: 'hoch' },
  ranking: { title: 'Ranking', prompt: 'Ordne nach Wichtigkeit', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }] },
  quiz: { title: 'Quiz', prompt: 'Wähle die richtige Antwort', options: [{ id: 'a', text: 'A', correct: false }, { id: 'b', text: 'B', correct: true }] },
  qa: { title: 'Q&A', prompt: 'Stelle deine Frage' },
  brainstorm: { title: 'Brainstorming', prompt: 'Deine Idee…' },
  reaction: { title: 'Reaktion', prompt: 'Wie fühlst du dich?' },
  number_guess: { title: 'Schätzfrage', prompt: 'Gib eine Zahl ein' },
  percent_split: { title: 'Verteile 100 Punkte', prompt: '', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }] },
  pin_image: { title: 'Pin auf Bild', prompt: 'Tippe auf das Bild', imageUrl: '' },
  priority_matrix: {
    title: 'Priorisierungs-Matrix',
    prompt: 'Ziehe jeden Use Case in den passenden Quadranten.',
    xAxisLabel: 'Aufwand', xAxisLow: 'niedrig', xAxisHigh: 'hoch',
    yAxisLabel: 'Impact', yAxisLow: 'niedrig', yAxisHigh: 'hoch',
    quadrants: {
      qw: { label: 'Quick Win', icon: '🚀', desc: 'hoher Impact · niedriger Aufwand' },
      sb: { label: 'Strategic Bet', icon: '⭐', desc: 'hoher Impact · hoher Aufwand' },
      ts: { label: 'Time Sink', icon: '🔧', desc: 'niedriger Impact · hoher Aufwand' },
      dr: { label: 'Drop', icon: '❌', desc: 'niedriger Impact · niedriger Aufwand' },
    },
  },
};

window.LP_DEFAULT_SETTINGS = {
  anonymous: false,
  multipleResponses: false,
  timeLimitSec: 0,
  required: false,
  moderation: false,
  showResultsLive: true,
  profanityFilter: true,
  askName: true,
};
