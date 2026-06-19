/* Vorlagen – umfangreich, arbeitsalltagnah, vielfältige Folientypen */
// Single source of truth for the default slide style (also exposed as LP_DEFAULT_STYLE further below).
window.LP_DEFAULT_STYLE = { bgColor: '#ffffff', textColor: '#0f172a', accentColor: '#206efb' };
window.LP_TEMPLATE_STYLE = window.LP_DEFAULT_STYLE;
window.LP_TEMPLATE_SETTINGS = { anonymous: false, askName: true, showResultsLive: true, profanityFilter: true, multipleResponses: false };

// Central sopKind discriminators — these string VALUES must stay in sync with the checks in app.js.
window.LP_SOP_KIND = Object.freeze({
  TRACK: 'track',
  PHASE_OVERVIEW: 'phase-overview',
  TRACK_OVERVIEW: 'track-overview',
  WORKSHOP_GOAL: 'workshop-goal',
  INSTRUCTIONS: 'instructions',
  PHASE_WORKSHOP: 'phase-workshop',
  TRACK_COLLECT: 'track-collect',
  PHASE_VOTE: 'phase-vote',
  TRACK_VOTE: 'track-vote',
  TRACK_PRESENTATION: 'track-presentation',
  ALL_TRACKS_SUMMARY: 'all-tracks-summary',
  FINAL_MATRIX: 'final-matrix',
  NEXT_STEPS: 'next-steps',
  PITCH_SESSION: 'pitch-session',
  FINAL_VOTE: 'final-vote',
  CARD_WORKSHOP: 'card-workshop',
  DUAL_PAIR_ORIENT: 'dual-pair-orient',
  DUAL_PAIR_COLLECT: 'dual-pair-collect',
  GROUP_VOTE: 'group-vote',
  GROUP_TRANSITION: 'group-transition',
  PARTICIPANTS: 'participants',
  WORKSHOP_CLOSE: 'workshop-close',
});
const SK = window.LP_SOP_KIND;

// Verbindliche Gruppen-Identität (Icon + Label) — konsistent in Present, Split-View, Chips.
window.LP_SOP_GROUP_META = Object.freeze({
  internal: {
    key: 'internal',
    label: 'Internal SOP',
    shortLabel: 'Internal',
    icon: 'fa-building',
  },
  consulting: {
    key: 'consulting',
    label: 'Consulting SOP',
    shortLabel: 'Consulting',
    icon: 'fa-handshake',
  },
});

function sopGroupFields(group) {
  const meta = window.LP_SOP_GROUP_META[group];
  if (!meta) return {};
  return { sopGroup: group, sopGroupLabel: meta.label, sopGroupIcon: meta.icon };
}

function dualBothGroupsFields() {
  const g = window.LP_SOP_GROUP_META;
  return {
    sopDualBoth: true,
    sopGroupChips: [
      { sopGroup: 'internal', sopGroupLabel: g.internal.label, sopGroupIcon: g.internal.icon },
      { sopGroup: 'consulting', sopGroupLabel: g.consulting.label, sopGroupIcon: g.consulting.icon },
    ],
  };
}

function dualSequentialProgress(group, trackIndex, trackTotal, intTrackCount) {
  const sopIndex = group === 'internal' ? 1 : 2;
  const globalTrackIndex = group === 'internal' ? trackIndex : intTrackCount + trackIndex;
  const globalTrackTotal = intTrackCount + (window.SOP_TOOL_TRACKS?.length || 0);
  return {
    sopDualProgress: {
      mode: 'sequential',
      sopIndex,
      sopTotal: 2,
      trackIndex: trackIndex + 1,
      trackTotal,
      globalTrackIndex: globalTrackIndex + 1,
      globalTrackTotal,
      label: `SOP ${sopIndex}/2, Track ${trackIndex + 1} von ${trackTotal}`,
      globalLabel: `Track ${globalTrackIndex + 1} von ${globalTrackTotal}`,
    },
  };
}

function dualParallelProgress(pairIndex, pairTotal) {
  return {
    sopDualProgress: {
      mode: 'parallel',
      pairIndex: pairIndex + 1,
      pairTotal,
      label: `Track ${pairIndex + 1} von ${pairTotal}`,
    },
  };
}

// Dual-SOP: Zuweisung erfolgt live per QR-Teilnehmer (siehe assignParticipantSopGroup).
// LP_DUAL_SOP_TEAMS bleibt nur als optionale Editor-Referenz, nicht mehr in Folien hardcodiert.
window.LP_DUAL_SOP_TEAMS = {
  internal: [],
  consulting: [],
};
function dualTeamsBody() {
  return '';
}

// Single source of truth for the Impact/Effort matrix quadrants (used by sopIceMatrix + LP_DEFAULT_CONTENT).
window.LP_ICE_QUADRANTS = {
  qw: { label: 'Quick Win', icon: '🚀', desc: 'hoher Impact · niedriger Aufwand → sofort angehen' },
  sb: { label: 'Strategic Bet', icon: '⭐', desc: 'hoher Impact · hoher Aufwand → langfristig planen' },
  ts: { label: 'Time Sink', icon: '🔧', desc: 'niedriger Impact · hoher Aufwand → kritisch hinterfragen' },
  dr: { label: 'Drop', icon: '❌', desc: 'niedriger Impact · niedriger Aufwand → weglassen' },
};
// Fresh shallow copy so per-slide content never shares one mutable quadrant object.
function iceQuadrants() {
  const q = window.LP_ICE_QUADRANTS;
  return { qw: { ...q.qw }, sb: { ...q.sb }, ts: { ...q.ts }, dr: { ...q.dr } };
}

// ─── WORKSHOP-EINSTELLUNGEN (zentral anpassen) ────────────────────────────────
// Gelten für alle Brainstorm-Sammelrunden in SOP- und Marketing-Vorlagen.
window.LP_WORKSHOP_SETTINGS = {
  brainstormTimeLimitSec: 300,   // Sammelzeit pro Folie in Sekunden (0 = kein Limit)
  brainstormMaxResponses: 2,     // Maximale Use Cases pro Teilnehmer pro Folie
  finalPriorityCount: 5,         // Anzahl final priorisierter Use Cases → wandern in die Matrix
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
    askName: true, // Use Cases müssen einem benannten Teilnehmer zugeordnet sein
    anonymous: false,
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
            prompt: 'Welche KI hilft beim Erkennen und Qualifizieren von Beratungsbedarf?\n\nBeispiele: LinkedIn-Signal-Monitoring, News-Tracker zu Zielkunden, Intent-Scoring-Bot.',
          },
          {
            name: 'Erstgespräch / ROOTS Vorstellung',
            intro: 'ROOTS Positionierung, Arbeitsweise und Team im Erstkontakt überzeugend präsentieren.',
            prompt: 'Welche KI macht den Erstkontakt persönlicher und schärfer?\n\nBeispiele: KI-personalisiertes Outreach, Auto-Recherche zum Kunden vorab, Pitch-Deck-Generator.',
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
            prompt: 'Welche KI macht Problem-Framing schneller und präziser?\n\nBeispiele: \"5-Why\"-Bot, Symptom-Ursache-Mapping, Auto-Transkript von Discovery-Calls.',
          },
          {
            name: 'Zielstellung klären',
            intro: 'Gemeinsame Ziele, Erfolgskriterien und Erwartungen aller Stakeholder definieren.',
            prompt: 'Welche KI hilft, Ziele schneller und klarer zu formulieren?\n\nBeispiele: SMART-Goal-Coach, KI-Moderator für Discovery-Calls, Highlight-Extraktion aus Transcripts.',
          },
          {
            name: 'Initiale Analyse',
            intro: 'Erste faktenbasierte Einschätzung von Markt, Wettbewerb und Ist-Situation.',
            prompt: 'Welche KI beschleunigt Markt- und Wettbewerbs-Analysen?\n\nBeispiele: Perplexity Deep Research, Industry-Research-Bot, SWOT-Generator.',
          },
          {
            name: 'Initiale Hypothese(n)',
            intro: 'Erste fundierte Hypothesen zur Problemlösung entwickeln und dokumentieren.',
            prompt: 'Welche KI hilft beim Entwickeln und Schärfen erster Hypothesen?\n\nBeispiele: Hypothesen-Generierung aus Interviews, Issue-Tree-Bot, LLM als Sparring-Partner.',
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
            prompt: 'Welche KI hilft beim schnellen Skizzieren eines überzeugenden Projektablaufs?\n\nBeispiele: Auto-Workplan aus Scope-Doc, Timeline-Generator, Meilenstein-Template-AI.',
          },
          {
            name: 'KVA aufsetzen',
            intro: 'Kostenschätzung, Vertragsbasis und kommerzielles Angebot strukturieren.',
            prompt: 'Welche KI unterstützt beim sauberen Aufsetzen eines KVA?\n\nBeispiele: Aufwand-Predictor aus Scope, Pricing-Optimizer, Contract-Template-Filler.',
          },
          {
            name: 'Kundenpitch oder E-Mail Kommunikation',
            intro: 'Angebot persönlich pitchen oder überzeugend schriftlich kommunizieren.',
            prompt: 'Welche KI macht Pitch und Kommunikation schärfer und persönlicher?\n\nBeispiele: Pitch-Deck-Optimizer, Personalisierungs-AI für E-Mails, Rehearsal-Coach-Bot.',
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
            prompt: 'Welche KI automatisiert oder beschleunigt den Vertragsabschluss?\n\nBeispiele: Contract-Generator, Auto-Risk-Flag, E-Signature-Workflow.',
          },
          {
            name: 'Team-Staffing, Rollenverteilung',
            intro: 'Passendes Team zusammenstellen und Rollen klar zuweisen.',
            prompt: 'Welche KI hilft beim smarten Team-Staffing und Rollen-Matching?\n\nBeispiele: Skill-Matching-Bot, Rollen-Allokator aus Scope, Kapazitätsplanung-AI.',
          },
          {
            name: 'Detaillierter Workplan & Projektplan',
            intro: 'Detaillierten Arbeitsplan mit Tasks, Verantwortlichkeiten und Timeline erstellen.',
            prompt: 'Welche KI generiert oder optimiert Workpläne und Projektpläne?\n\nBeispiele: Auto-Kanban aus Scope, Timeline-Generator, Projektplan-AI.',
          },
          {
            name: 'Zugänge',
            intro: 'Benötigte System-, Tool- und Datenzugänge beschaffen und verwalten.',
            prompt: 'Welche KI unterstützt beim Managen von Zugängen und Berechtigungen?\n\nBeispiele: Access-Request-Tracker, Onboarding-Checkliste-AI, Permissioning-Bot.',
          },
          {
            name: 'Daten',
            intro: 'Relevante Datenquellen identifizieren, beschaffen und für Analysen vorbereiten.',
            prompt: 'Welche KI hilft beim Identifizieren, Beschaffen und Aufbereiten von Daten?\n\nBeispiele: Data-Catalog-AI, Auto-Data-Cleaning, Schema-Matching-Bot.',
          },
          {
            name: 'Kick-off / Client-Onboarding & Erwartungsmanagement',
            intro: 'Projekt formal starten, Stakeholder ausrichten und Erwartungen managen.',
            prompt: 'Welche KI macht Kickoff und Erwartungsmanagement effektiver?\n\nBeispiele: Kickoff-Agenda-Generator, Stakeholder-Map-AI, Expectation-Tracker.',
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
            prompt: 'Welche KI unterstützt bei Datenanforderung und -erhebung?\n\nBeispiele: Data-Request-Template-AI, Survey-Generator, Auto-Follow-up für Datenlieferungen.',
          },
          {
            name: 'IST-Analyse',
            intro: 'Aktuellen Zustand faktenbasiert analysieren, strukturieren und dokumentieren.',
            prompt: 'Welche KI beschleunigt oder vertieft die IST-Analyse?\n\nBeispiele: Auto-Dashboards aus Rohdaten, Process-Mining-AI, Anomalie-Detection.',
          },
          {
            name: 'Benchmarking',
            intro: 'Performance des Kunden gegen Markt, Wettbewerb und Best Practices messen.',
            prompt: 'Welche KI liefert schnellere und tiefere Benchmark-Vergleiche?\n\nBeispiele: Industry-Benchmark-Scraper, Competitive-Intelligence-AI, KPI-Vergleichs-Bot.',
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
            prompt: 'Welche KI hilft beim schnellen Destillieren von So-Whats?\n\nBeispiele: Auto-Insight-Extraktion aus Analysen, LLM-Sparring für So-What-Test, Pattern-Erkennung.',
          },
          {
            name: 'Storyline (Pyramid Principle)',
            intro: 'Argumentation nach dem Pyramid Principle logisch und überzeugend strukturieren.',
            prompt: 'Welche KI unterstützt beim Aufbau einer starken Storyline?\n\nBeispiele: Storyline-Coach-AI, Pyramid-Principle-Checker, Auto-Narrative-Generator.',
          },
          {
            name: 'Priorisierung',
            intro: 'Empfehlungen nach Impact, Aufwand und Realisierbarkeit priorisieren.',
            prompt: 'Welche KI hilft bei der strukturierten Priorisierung von Handlungsoptionen?\n\nBeispiele: Impact-Effort-Matrix-AI, Decision-Support-Bot, Multi-Criteria-Priorisierung.',
          },
          {
            name: 'Business-Case',
            intro: 'Wirtschaftlichkeit der Empfehlung quantifizieren und plausibilisieren.',
            prompt: 'Welche KI beschleunigt die Business-Case-Entwicklung?\n\nBeispiele: Business-Case-Calculator, ROI-Modell-Generator, Sensitivitätsanalyse-AI.',
          },
          {
            name: 'Roadmap & Next Steps',
            intro: 'Umsetzungs-Roadmap und konkrete nächste Schritte definieren.',
            prompt: 'Welche KI hilft bei der Entwicklung einer belastbaren Roadmap?\n\nBeispiele: Auto-Roadmap aus Empfehlungen, Dependency-Mapper, Quick-Win-Identifier.',
          },
          {
            name: 'Executive Summary',
            intro: 'Kernbotschaft und wichtigste Erkenntnisse für Entscheider prägnant zusammenfassen.',
            prompt: 'Welche KI schreibt oder schärft Executive Summaries?\n\nBeispiele: Auto-Exec-Summary-Generator, Zusammenfassungs-AI, One-Pager-Bot.',
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
            prompt: 'Welche KI beschleunigt Charting und Datenvisualisierung?\n\nBeispiele: Auto-Charting aus Excel, Chart-Empfehlungs-AI, Dataviz-Generator.',
          },
          {
            name: '(Steering-Committee) Präsentation(en)',
            intro: 'Ergebnisse vor Kunden, Management oder Steering Committee überzeugend präsentieren.',
            prompt: 'Welche KI unterstützt bei der Präsentation vor Entscheidern?\n\nBeispiele: Präsentations-Coach-AI, Slide-Optimizer, Rehearsal-Bot.',
          },
          {
            name: 'ggf. Q&A im JFX',
            intro: 'Fragen und kritische Einwände im JFX-Format souverän und präzise beantworten.',
            prompt: 'Welche KI hilft, auf schwierige Fragen besser vorbereitet zu sein?\n\nBeispiele: Fragen-Anticipation-Bot, Devil-Advocate-AI, Auto-FAQ aus Präsentationsinhalt.',
          },
          {
            name: 'Elevator Test für kommunikative Stärke der Empfehlung',
            intro: 'Empfehlung in 30 Sekunden klar, prägnant und überzeugend vertreten können.',
            prompt: 'Welche KI hilft beim Schärfen des Elevator Pitches einer Empfehlung?\n\nBeispiele: Pitch-Feedback-AI, Klarheits-Check-Bot, Elevator-Test-Simulator.',
          },
          {
            name: 'Auslieferung / Sign-off',
            intro: 'Finale Deliverables übergeben und formalen Abschluss mit dem Kunden sichern.',
            prompt: 'Welche KI unterstützt bei der strukturierten Übergabe und dem Sign-off?\n\nBeispiele: Deliverable-Checklist-AI, Sign-off-Workflow-Bot, Archive-Generator.',
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
            prompt: 'Welche KI unterstützt Capability Building und Training?\n\nBeispiele: Personalisierte Lernpfad-AI, Training-Content-Generator, Kompetenz-Gap-Analyse-Bot.',
          },
          {
            name: 'Change-Management',
            intro: 'Veränderungsprozess strukturiert begleiten und Widerstände proaktiv managen.',
            prompt: 'Welche KI macht Change-Management effektiver?\n\nBeispiele: Stakeholder-Sentiment-Monitor, Change-Story-Generator, Widerstandsanalyse-AI.',
          },
          {
            name: 'Governance',
            intro: 'Entscheidungsstrukturen und Steuerungsmechanismen für die Umsetzung etablieren.',
            prompt: 'Welche KI hilft beim Aufsetzen effizienter Governance-Strukturen?\n\nBeispiele: RACI-Generator, Meeting-Cadence-Planer, Decision-Log-AI.',
          },
          {
            name: 'Pilot-Design & Durchführung',
            intro: 'Pilotprojekt konzipieren, kontrolliert durchführen und Ergebnisse bewerten.',
            prompt: 'Welche KI unterstützt beim Design und der Auswertung von Pilots?\n\nBeispiele: A/B-Test-Design-AI, Pilot-Tracking-Dashboard, Ergebnis-Auswertungs-Bot.',
          },
          {
            name: 'Monitoring',
            intro: 'Fortschritt und Wirkung der Implementierung systematisch messen und steuern.',
            prompt: 'Welche KI automatisiert das Implementierungs-Monitoring?\n\nBeispiele: KPI-Tracker-AI, Anomalie-Alert-Bot, Auto-Fortschrittsbericht.',
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
            prompt: 'Welche KI automatisiert oder verbessert die finale Projektübergabe?\n\nBeispiele: Auto-Abschlussbericht, Übergabe-Checkliste-AI, Dokumentations-Bot.',
          },
          {
            name: 'Rechnung',
            intro: 'Leistungsabrechnung korrekt erstellen und Zahlungseingang sicherstellen.',
            prompt: 'Welche KI unterstützt beim effizienten Rechnungs- und Zahlungsmanagement?\n\nBeispiele: Invoicing-AI, Auto-Mahnwesen, Zahlungseingangs-Tracker.',
          },
          {
            name: 'Team-Feedback & Evaluation (NPS)',
            intro: 'Projekterfahrungen intern und mit dem Kunden strukturiert bewerten.',
            prompt: 'Welche KI hilft beim effizienten Einholen und Auswerten von Feedback?\n\nBeispiele: NPS-Bot, Sentiment-aus-Email, Auto-Theme-Extraktion aus Feedbacks.',
          },
          {
            name: 'Internes Review & Learnings',
            intro: 'Projektlernpunkte intern dokumentieren und für künftige Projekte nutzbar machen.',
            prompt: 'Welche KI verbessert unsere Retros und den Learnings-Speicher?\n\nBeispiele: Retro-Facilitator-Bot, Auto-Learning-Database, Pattern-Detection across Projects.',
          },
          {
            name: 'Interne Margin-Analyse',
            intro: 'Wirtschaftlichkeit des Projekts analysieren und Erkenntnisse für künftige Kalkulation ableiten.',
            prompt: 'Welche KI unterstützt die Margin-Analyse und Projektkalkulation?\n\nBeispiele: Auto-Profitabilitäts-Report, Stunden-Auswertungs-AI, Budget-vs-Actual-Analyse.',
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
            prompt: 'Welche KI automatisiert das KPI-Tracking nach Projektabschluss?\n\nBeispiele: KPI-Dashboard-AI, Auto-Impact-Report, Anomalie-Alerting für Ziel-KPIs.',
          },
          {
            name: 'Case-Study-Entwicklung',
            intro: 'Projekterfolge als überzeugende Case Study aufbereiten und vermarkten.',
            prompt: 'Welche KI beschleunigt die Case-Study-Entwicklung?\n\nBeispiele: Case-Study-Draft-Generator, Quote-Extraktion aus Calls, Reference-Letter-AI.',
          },
          {
            name: 'Nachfrage weiterer Beratungsbedarf',
            intro: 'Folgeprojekte und neuen Beratungsbedarf beim Kunden proaktiv identifizieren.',
            prompt: 'Welche KI hilft beim Erkennen und Adressieren von Folgebedarf?\n\nBeispiele: Customer-Health-Score, Buying-Signal-Detection, Upsell-Pitch-Generator.',
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
window.sopBoardData = sopBoardData;

function sopTrackIntro(track, trackIndex) {
  return tplSlide('section', {
    title: track.title,
    subtitle: track.phases.map((p) => p.name).join(' · '),
    body: track.intro,
    sopKind: SK.TRACK,
    sopTrackIndex: trackIndex + 1,
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, { workshopMode: 'orient' });
}

// ─── INSTRUKTIONS-FOLIE ────────────────────────────────────────────────────────
// Erscheint einmal nach dem Opener — erklärt Format, Timing und Limit.

// Zielbild-Folie: erklärt vorweg, worauf der Workshop hinausläuft (Impact/Effort).
function sopWorkshopGoal() {
  return tplSlide('content', {
    title: 'Worum es heute geht',
    subtitle: 'Das Ziel des Workshops',
    body: 'Wir sammeln konkrete KI Use Cases aus eurem Arbeitsalltag, priorisieren sie gemeinsam und ordnen sie am Ende nach Impact und Aufwand ein.\n\nGesucht sind vor allem Quick Wins: viel Wirkung bei wenig Aufwand — die setzen wir zuerst um.',
    sopKind: SK.WORKSHOP_GOAL,
    isHeroSlide: false,
  }, { workshopMode: 'orient' });
}

// ─── Use-Case-Format (Instruktionen + Simulation) ───────────────────────────
// Einheitliches Dreiteiler-Format: grob | KI-Feature | Abhängigkeiten (intern per | getrennt)
window.LP_USE_CASE_LABELS = {
  summary: 'Use Case grob formuliert',
  feature: 'Konkretes KI-Feature',
  dependencies: 'Abhängigkeiten',
  formula: [
    'Was ihr umsetzen wollt',
    'Konkretes KI-Feature',
    'Was im Team schon vorhanden sein muss',
  ],
};

function simUseCase(useCase, feature, dependencies) {
  return `${useCase} | ${feature} | ${dependencies}`;
}

function buildUseCaseInstructionBody(exampleKey = 'consulting') {
  const good = {
    consulting: [
      simUseCase(
        'Discovery-Calls automatisch auswerten',
        'Transkript, Themen-Cluster und Action Items werden erzeugt und nach Notion exportiert',
        'MS Teams-Aufzeichnungen + Notion-Workspace für das Projekt',
      ),
      simUseCase(
        'Rechnungsentwürfe aus Projektzeiten erstellen',
        'GPT füllt Positionen, prüft Umsatzsteuer und EN 16931-Konformität',
        'Zeiterfassung in Harvest + Rechnungsvorlage in SharePoint',
      ),
      simUseCase(
        'Erstes Angebot aus Kundenbriefing skizzieren',
        'Scope wird zu Workplan, Meilensteinen und grober Aufwandsschätzung',
        'Briefing-Dokument in Google Docs + interne Angebots-Templates',
      ),
    ],
    marketing: [
      simUseCase(
        'Paid-Social-Creatives aus Briefing ableiten',
        'Hook, Headline und Format-Varianten je Zielgruppe, Export als CSV für Meta Ads',
        'Creative-Briefing in Figma + Zielgruppen-Definition in Notion',
      ),
      simUseCase(
        'Wöchentlichen Kampagnen-Report versenden',
        'KPI-Digest mit Anomalie-Hinweisen und Handlungsempfehlungen per E-Mail',
        'Zugang zu GA4 + Meta Ads + feste Report-Vorlage',
      ),
      simUseCase(
        'Landingpage-Texte aus Produkt-One-Pager',
        'SEO-Titel, Meta-Description und drei CTA-Varianten zum A/B-Test',
        'Produkt-One-Pager in Notion + Marken-Tonalität dokumentiert',
      ),
    ],
  };
  const avoid = [
    'Neues vollautomatisiertes Rechnungstool',
    'KI für Rechnungen',
    'ChatGPT nutzen',
    'Automatisierung',
    'Mehr Effizienz mit KI',
  ];
  const examples = good[exampleKey] || good.consulting;
  const L = window.LP_USE_CASE_LABELS;
  return [
    `Format: ${L.formula.join(' | ')}`,
    '',
    'Pro Eintrag genau drei Teile: Use Case grob formuliert, konkretes KI-Feature, Abhängigkeiten. In der Sammlung erscheint nur der erste Teil — ab Pitch, Priorisierung und Matrix der komplette Use Case.',
    '',
    'Gute Use Cases:',
    ...examples,
    '',
    'Bitte vermeiden:',
    ...avoid,
    '',
    'Je präziser alle drei Teile, desto besser könnt ihr später priorisieren und in die Matrix einordnen.',
  ].join('\n');
}

function sopWorkshopInstructions(exampleKey = 'consulting') {
  const ws = window.LP_WORKSHOP_SETTINGS;
  const timeMin = ws.brainstormTimeLimitSec > 0
    ? `${Math.round(ws.brainstormTimeLimitSec / 60)} Minuten`
    : 'offene Zeit';
  return tplSlide('content', {
    title: 'So formuliert ihr Use Cases',
    subtitle: `${timeMin} pro Runde · max. ${ws.brainstormMaxResponses} Use Cases pro Person · Use Case grob + KI-Feature + Abhängigkeiten`,
    body: buildUseCaseInstructionBody(exampleKey),
    isHeroSlide: false,
    sopKind: SK.INSTRUCTIONS,
  }, { workshopMode: 'orient' });
}

// Gemeinsamer Workshop-Auftakt: Opener → Zielbild → Instruktionen.
// Wird von allen Vorlagen genutzt, statt die drei Folien je Builder zu duplizieren.
function sopWorkshopIntro({ title, subtitle, body, exampleKey = 'consulting', openerExtra = {} } = {}) {
  return [
    tplSlide('content', {
      title,
      subtitle,
      body: body || 'QR scannen · Name + Avatar wählen · los geht\'s!',
      isHeroSlide: true,
      ...openerExtra,
    }),
    sopWorkshopGoal(),
    sopWorkshopInstructions(exampleKey),
  ];
}

// ─── SOP PHASE BRAINSTORM ─────────────────────────────────────────────────────
// Pro Phase wird gesammelt.

function sopPhaseBrainstorm(track, phase) {
  const ws = window.LP_WORKSHOP_SETTINGS;
  return tplSlide('brainstorm', {
    title: 'Use Cases sammeln',
    body: '',
    subtitle: '',
    prompt: `Welche KI Use Cases seht ihr in der Phase „${phase.name}"? Max. ${ws.brainstormMaxResponses} Use Cases pro Person.`,
    isQuestionSlide: true,
    sopKind: SK.PHASE_WORKSHOP,
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase),
  }, brainstormSettings());
}

// ─── SOP TRACK BRAINSTORM ─────────────────────────────────────────────────────
// Pro Track: EINE Sammelfolie — alle Phasen + Karten im sopBoard sichtbar.

function sopTrackBrainstorm(track) {
  const ws = window.LP_WORKSHOP_SETTINGS;
  return tplSlide('brainstorm', {
    title: 'Use Cases sammeln',
    body: '',
    subtitle: '',
    prompt: `Welche KI Use Cases seht ihr in diesem Track? Max. ${ws.brainstormMaxResponses} Use Cases pro Person.\n\nNutzt die SOP-Übersicht als Orientierung — alle Phasen und Karten sind mögliche Ansatzpunkte.`,
    isQuestionSlide: true,
    sopKind: SK.TRACK_COLLECT,
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, brainstormSettings());
}

function sopTrackVote(track, trackIndex) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('mc_multi', {
    title: `Top 3 priorisieren · ${label}`,
    subtitle: `Track ${trackIndex + 1} · alle gesammelten Use Cases`,
    prompt: 'Wählt die drei KI Use Cases, die in diesem Track den größten Hebel für ROOTS haben.\nNutzt die SOP-Übersicht als Kontext: In welchen Phasen zahlen die Ideen wirklich ein?',
    isQuestionSlide: true,
    options: [],
    maxSelections: 3,
    sopKind: SK.TRACK_VOTE,
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, { showResultsLive: true, sopTrackVote: true, sopVoteMax: 3, workshopMode: 'decide' });
}

// Präsentations-Session nach dem Track-Vote: Gewinner stellen ihre Use Cases kurz vor.
function sopTrackPresentationSession(track) {
  return tplSlide('content', {
    title: `Presentation Session · ${track.title.replace(/^Track \d+: /, '')}`,
    subtitle: 'Top-gewählte Use Cases · jetzt kurz vorstellen',
    body: `Die Abstimmung ist abgeschlossen — die meistgewählten Use Cases sind sichtbar.\n\nJede Person hat 1–2 Minuten: Was ist die KI-Idee? · Wer im Team profitiert? · Welches Tool kommt zum Einsatz?\n\nDanach: Top-Ideen gemeinsam in die ICE Matrix eintragen.`,
    isHeroSlide: false,
    sopKind: SK.TRACK_PRESENTATION,
    ...sopMeta(track),
  }, { workshopMode: 'present', sopTrackPresentation: true });
}

// ─── CROSS-TRACK SUMMARY ───────────────────────────────────────────────────────

function sopAllTracksSummary() {
  return tplSlide('content', {
    title: 'Track-Top-3 im Überblick',
    subtitle: 'Aus den priorisierten Use Cases aller Tracks',
    body: 'Hier seht ihr die priorisierten Use Cases aus den Track-Abstimmungen. Diese Auswahl wandert im nächsten Schritt in die Impact/Effort-Matrix.',
    sopKind: SK.ALL_TRACKS_SUMMARY,
    sopAllTracksResults: true,
    isHeroSlide: true,
  }, { workshopMode: 'orient' });
}

// ─── ICE-MATRIX (Impact/Effort) — finale Priorisierung ────────────────────────
// Erscheint am Ende ALLER Vorlagen. Enthält vollständige Priorisierungs-Anleitung.

function sopIceMatrix() {
  return tplSlide('priority_matrix', {
    title: 'Impact/Effort-Matrix',
    prompt: 'Ordnet die priorisierten KI Use Cases gemeinsam in die Matrix ein.\n\nImpact: Wie stark verbessert dieser Use Case unsere Arbeit / unsere Qualität?\nEffort: Wie hoch ist der Aufwand für Einführung, Lernkurve und laufende Nutzung?\n\nQuick Wins sofort angehen · Strategic Bets langfristig einplanen\nTime Sinks kritisch hinterfragen · Drop weglassen',
    subtitle: 'Impact vs. Effort · finale Priorisierung',
    xAxisLabel: 'Aufwand (Effort)',
    xAxisLow: 'niedrig',
    xAxisHigh: 'hoch',
    yAxisLabel: 'Impact',
    yAxisLow: 'niedrig',
    yAxisHigh: 'hoch',
    quadrants: iceQuadrants(),
    sopKind: SK.FINAL_MATRIX,
  }, { showResultsLive: true, sopAllTracksMatrix: true, sopMatrixCount: (window.LP_WORKSHOP_SETTINGS?.finalPriorityCount || 5), workshopMode: 'decide' });
}

// Next Steps: Quick Wins aus der Matrix → Action Log (Host pflegt Verantwortliche & Deadlines).
function sopWorkshopNextSteps() {
  return tplSlide('content', {
    title: 'Next Steps',
    subtitle: '',
    body: 'Was sind die nächsten Schritte für unsere Quick Wins? Pro Use Case legen wir Verantwortliche, Deadlines und konkrete Actions fest.',
    sopKind: SK.NEXT_STEPS,
    isHeroSlide: false,
  }, { workshopMode: 'decide', sopNextSteps: true });
}

// ─── ABSCHLUSS-FOLIEN ──────────────────────────────────────────────────────────

// Abschluss: Danke-Folie (ohne Feedback-Runde).
function sopWorkshopClose() {
  return [
    tplSlide('content', {
      title: 'Danke! 🙌',
      body: 'Die Top-Use-Cases übergeben wir an die SOP-Owner.\nAction Items sammeln wir in Notion.\nKickoffs für die nominierten Use Cases folgen.\n\nLet\'s build the future of ROOTS.',
      isHeroSlide: true,
      sopKind: SK.WORKSHOP_CLOSE,
    }),
  ];
}

// ─── PITCH SESSION + FINALE ABSTIMMUNG ─────────────────────────────────────────

function sopPitchSession() {
  return tplSlide('content', {
    title: 'Pitch Session',
    subtitle: 'Jede Person stellt ihren Use Case kurz vor · 2 Minuten pro Person',
    body: '',
    sopKind: SK.PITCH_SESSION,
    pitchTimerSec: 120,
  }, { workshopMode: 'present', sopPitchSession: true });
}

function sopFinalAllTracksVote() {
  const ws = window.LP_WORKSHOP_SETTINGS;
  const count = ws?.finalPriorityCount || 5;
  return tplSlide('mc_multi', {
    title: 'Finale Priorisierung',
    subtitle: `Alle Use Cases · wähle deine Top ${count} (keine eigenen)`,
    prompt: `Welche ${count} Use Cases haben den größten Impact für euer Team?\nHinweis: Eigene Beiträge können nicht gewählt werden.`,
    isQuestionSlide: true,
    options: [],
    maxSelections: count,
    sopKind: SK.FINAL_VOTE,
    sopFairVote: true,
  }, { showResultsLive: true, sopAllTracksVote: true, sopFairVote: true, sopVoteMax: count, workshopMode: 'decide' });
}

//  'pro-phase' → Brainstorm je Phase → Track-Vote → Presentation Session → ICE-Matrix → Abschluss
//  'pro-track' → EIN Brainstorm → Pitch-Session → faire Abstimmung → ICE-Matrix → Abschluss

function buildSopKiWorkshopSlides(mode = 'pro-phase') {
  const slides = [];
  const ws = window.LP_WORKSHOP_SETTINGS;
  const timeMin = ws.brainstormTimeLimitSec > 0
    ? `${Math.round(ws.brainstormTimeLimitSec / 60)} Min.`
    : '';

  const modeLabel = {
    'pro-phase': `Pro Phase ${timeMin ? '· ' + timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases · SOP-Kontext vor jeder Phase`,
    'pro-track': `Pro Track ${timeMin ? '· ' + timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases · alle Phasen auf einen Blick`,
  }[mode] || '';

  // 1.–3. Opener → Zielbild → Instruktionen (gemeinsamer Auftakt)
  slides.push(...sopWorkshopIntro({
    title: 'SOP · KI Use-Case Workshop',
    subtitle: modeLabel,
    exampleKey: 'consulting',
  }));

  // 4. Per Track
  SOP_TOOL_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));

    if (mode === 'pro-phase') {
      // Pro Phase: Brainstorm je Phase (SOP-Board sichtbar) → Track-Vote → Presentation Session
      track.phases.forEach((phase) => {
        slides.push(sopPhaseBrainstorm(track, phase));  // SOP-Board direkt auf Brainstorm-Slide
      });
      slides.push(sopTrackVote(track, ti));
      slides.push(sopTrackPresentationSession(track));

    } else if (mode === 'pro-track') {
      // Pro Track: EIN Brainstorm (SOP-Board sichtbar) → kein Track-Vote → konsolidiert am Ende
      slides.push(sopTrackBrainstorm(track));   // SOP-Board direkt auf Brainstorm-Slide
    }
  });

  // 4. Finale: Abstimmung + ICE-Matrix + Next Steps + Abschluss
  if (mode === 'pro-track') {
    // Pro Track: noch keine Präsentation gelaufen → Pitch-Session + faire Gesamt-Abstimmung.
    slides.push(sopPitchSession());
    slides.push(sopFinalAllTracksVote());
  } else {
    // Pro Phase: pro Track gab es bereits eine Presentation Session → Pitch, dann Gesamt-Überblick.
    slides.push(sopPitchSession());
    slides.push(sopAllTracksSummary());
    slides.push(sopFinalAllTracksVote());
  }
  slides.push(sopIceMatrix());
  slides.push(sopWorkshopNextSteps());
  slides.push(...sopWorkshopClose());

  return slides;
}

window.SOP_TOOL_TRACKS = SOP_TOOL_TRACKS;

// ─── INTERNAL SOP TRACKS ───────────────────────────────────────────
// Interne SOP (Betrieb von ROOTS selbst) — gleiche Struktur wie SOP_TOOL_TRACKS,
// Klassen mit Präfix track-int-. Karten sind reine {name}-Einträge.
const INTERNAL_SOP_TRACKS = [
  {
    title: 'Track 1: People',
    class: 'track-int-people',
    intro: 'Den gesamten Mitarbeiter-Lebenszyklus von der Einstellung bis zur Kapazitätsplanung managen. 3 Phasen.',
    phases: [
      {
        name: 'Hiring',
        intro: 'Von der Definition des Stellenprofils bis zum unterschriebenen Vertrag.',
        cards: [
          { name: 'Stellenprofil & Anforderungen definieren' },
          { name: 'Ausschreibung & Sourcing' },
          { name: 'Bewerbungsprozess: Screening, Interviews, Case' },
          { name: 'Vertrag' },
        ],
      },
      {
        name: 'Onboarding',
        intro: 'Neue Mitarbeitende strukturiert ausstatten, einarbeiten und ins Team integrieren.',
        cards: [
          { name: 'Equipment, IT-Zugänge, Tools' },
          { name: 'Erster Tag & Teamvorstellung' },
          { name: 'Einarbeitungsplan (30/60/90 Tage)' },
          { name: 'Mentor-Zuweisung' },
        ],
      },
      {
        name: 'Kapazitäts- & Urlaubsplanung',
        intro: 'Auslastung, Urlaube und Teamkalender laufend planen und im Blick behalten.',
        cards: [
          { name: 'Auslastung pro MA' },
          { name: 'Urlaubsanfragen & -genehmigung' },
          { name: 'Teamkalender pflegen' },
        ],
      },
    ],
  },
  {
    title: 'Track 2: Steuerung',
    class: 'track-int-steuerung',
    intro: 'Ziele, Meetings und Finanzen als Steuerungsinstrumente des Unternehmens führen. 3 Phasen.',
    phases: [
      {
        name: 'OKR-Planung',
        intro: 'Ziele im Review reflektieren und in der Planung neu ausrichten.',
        cards: [
          { name: 'Review-Meeting' },
          { name: 'Planungs-Meeting' },
        ],
      },
      {
        name: 'Meeting',
        intro: 'Meetings effizient vorbereiten, dokumentieren und in Actions überführen.',
        cards: [
          { name: 'Meeting Etiquette' },
          { name: 'Meeting Minutes' },
          { name: 'Actions & Next Steps' },
        ],
      },
      {
        name: 'Finance & Controlling',
        intro: 'Finanzen und Controlling laufend überwachen und steuern.',
        cards: [
          { name: 'Finance & Controlling' },
        ],
      },
    ],
  },
  {
    title: 'Track 3: Wissen',
    class: 'track-int-wissen',
    intro: 'Internes Wissen sichern und in internen Projekten nutzbar machen. 2 Phasen.',
    phases: [
      {
        name: 'Internes Wissensmanagement',
        intro: 'Wissen strukturiert ablegen, aktuell halten und bei Personalwechsel sichern.',
        cards: [
          { name: 'Ablagestruktur in SharePoint einhalten' },
          { name: 'Frameworks, Methoden, SOPs aktuell halten' },
          { name: 'Wissenstransfer bei Personalwechsel' },
        ],
      },
      {
        name: 'Interne Projekte',
        intro: 'Interne Projekte von der Zielklärung bis zum fertigen Deliverable umsetzen.',
        cards: [
          { name: 'Anlass, Zielgruppe & Ziel klären' },
          { name: 'Inhaltsstruktur & Storyline (Pyramid Principle)' },
          { name: 'Erstellung & Design nach ROOTS Master & CD' },
        ],
      },
    ],
  },
  {
    title: 'Track 4: Marketing & New Business',
    class: 'track-int-marketing',
    intro: 'Neue Geschäftschancen erschließen und ROOTS über Content sichtbar machen. 2 Phasen.',
    phases: [
      {
        name: 'New Business',
        intro: 'Leads identifizieren, kontaktieren und bis zur Übergabe in die Consulting SOP führen.',
        cards: [
          { name: 'Lead-Identifikation & Qualifizierung' },
          { name: 'Outreach & Erstkontakt' },
          { name: 'Pipeline-Management & Statusverfolgung' },
          { name: 'Übergabe in Consulting SOP bei Go' },
        ],
      },
      {
        name: 'Content',
        intro: 'Mit Thought-Leadership und Always-On-Inhalten kontinuierlich Reichweite aufbauen.',
        cards: [
          { name: 'Thought-Leadership' },
          { name: 'Always-On' },
        ],
      },
    ],
  },
  {
    title: 'Track 5: Daten-Infrastruktur & (AI) Tools',
    class: 'track-int-daten',
    intro: 'Datenablage, Tool-Landschaft und AI-Regeln als Fundament des Betriebs pflegen. 3 Phasen.',
    phases: [
      {
        name: 'SharePoint',
        intro: 'Ordnerstruktur, Zugriffsrechte und Datenpflege in SharePoint sauber halten.',
        cards: [
          { name: 'Ordnerstruktur-Governance' },
          { name: 'Zugriffsrechte & Berechtigungen' },
          { name: 'Pflege, Archivierung & Bereinigung' },
        ],
      },
      {
        name: '(AI) Tools',
        intro: 'Tool-Landschaft, Lizenzen und Use Cases übersichtlich verwalten und evaluieren.',
        cards: [
          { name: 'Tool-Übersicht pflegen' },
          { name: 'Lizenz- & Zugangsmanagement' },
          { name: 'Use-Case-Entwicklung' },
          { name: 'Tool-Evaluation' },
        ],
      },
      {
        name: 'AI Rules',
        intro: 'Verbindliche AI-Regeln laufend pflegen und aktuell halten.',
        cards: [
          { name: 'AI Rules pflegen & aktualisieren' },
        ],
      },
    ],
  },
];

window.INTERNAL_SOP_TRACKS = INTERNAL_SOP_TRACKS;

// Hinweis: Der localStorage-Spiegel + Export-Helfer steht am Dateiende,
// damit er alle drei SOP-Strukturen (inkl. Marketing) erfassen kann.

// ─── MARKETING SOP TRACKS ───────────────────────────────────────────
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
            prompt: 'Welche KI automatisiert KPI-Tracking & Reporting?\n\nBeispiele: Auto-Dashboard, Anomalie-Alert, Performance-Digest.',
          },
          {
            name: 'Kanal-Performance',
            intro: 'Performance einzelner Kanäle (SEA, Social, Email, Display) vergleichen.',
            prompt: 'Welche KI verbessert die Kanal-Performance-Analyse?\n\nBeispiele: Cross-Channel-Reporting-AI, Budget-Optimizer, Creative-Performance-Tracker.',
          },
          {
            name: 'Attribution & ROI',
            intro: 'Beitrag jedes Touchpoints zum Conversion-Pfad messen und bewerten.',
            prompt: 'Welche KI macht Attribution und ROI-Messung präziser?\n\nBeispiele: Multi-Touch-Attribution-AI, Incrementality-Testing-Bot, ROI-Calculator.',
          },
          {
            name: 'Content-Performance',
            intro: 'Wirksamkeit von Creatives, Texten und Formaten datenbasiert bewerten.',
            prompt: 'Welche KI hilft bei der Content-Performance-Analyse?\n\nBeispiele: Creative-Scoring-AI, A/B-Test-Analyzer, Copy-Performance-Tracker.',
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
            prompt: 'Welche KI macht Verhaltensanalysen schneller und tiefer?\n\nBeispiele: Heatmap-AI, Session-Recording-Analyzer, Funnel-Optimizer.',
          },
          {
            name: 'Segment-Identifikation',
            intro: 'Relevante Zielgruppensegmente aus Daten erkennen und beschreiben.',
            prompt: 'Welche KI hilft bei der automatischen Segment-Identifikation?\n\nBeispiele: Clustering-AI, Look-alike-Modell, Propensity-Scoring-Bot.',
          },
          {
            name: 'Persona-Update',
            intro: 'Buyer Personas auf Basis neuer Daten und Insights aktualisieren.',
            prompt: 'Welche KI unterstützt beim datengetriebenen Persona-Update?\n\nBeispiele: Social-Listening-AI, Persona-Generator, Interview-Synthesis-Bot.',
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
            prompt: 'Welche KI unterstützt die Synthese und Muster-Erkennung?\n\nBeispiele: Cross-Channel-Insight-AI, Pattern-Detection-Bot, Auto-Briefing-Generator.',
          },
          {
            name: 'Handlungsempfehlungen',
            intro: 'Aus gebündelten Erkenntnissen konkrete, priorisierte Empfehlungen ableiten.',
            prompt: 'Welche KI hilft, Empfehlungen automatisch abzuleiten?\n\nBeispiele: Insight-to-Action-AI, Priorisierungs-Bot, Recommendation-Engine.',
          },
          {
            name: 'Strategie-Anpassung & Roadmap',
            intro: 'Strategie auf Basis der Erkenntnisse gezielt anpassen und Roadmap definieren.',
            prompt: 'Welche KI beschleunigt das Strategie-Update und die Roadmap-Entwicklung?\n\nBeispiele: Strategy-Update-AI, Roadmap-Generator, OKR-Alignment-Bot.',
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
    title: 'Use Cases sammeln',
    body: '',
    subtitle: '',
    prompt: card.prompt || `Welche KI Use Cases seht ihr für „${card.name}"? Max. ${ws.brainstormMaxResponses} pro Person.`,
    isQuestionSlide: true,
    sopKind: SK.CARD_WORKSHOP,
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase, card),
  }, brainstormSettings());
}

// ─── MARKETING SOP · KI WORKSHOP ──────────────────────────────────────
function buildMarketingSopWorkshopSlides() {
  const slides = [];
  const ws = window.LP_WORKSHOP_SETTINGS;
  const timeMin = ws.brainstormTimeLimitSec > 0
    ? `${Math.round(ws.brainstormTimeLimitSec / 60)} Min.`
    : '';

  // Opener → Zielbild → Instruktionen (Marketing-Beispiele)
  slides.push(...sopWorkshopIntro({
    title: 'Marketing SOP · KI Use-Case Workshop',
    subtitle: `Pro Karte ${timeMin ? timeMin + ' · ' : ''}max. ${ws.brainstormMaxResponses} Use Cases pro Person`,
    exampleKey: 'marketing',
  }));

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

  // Finale: Pitch → Übersicht (optional) → Gesamt-Priorisierung → ICE-Matrix → Next Steps → Abschluss
  slides.push(sopPitchSession());
  if (MARKETING_SOP_TRACKS.length > 1) slides.push(sopAllTracksSummary());
  slides.push(sopFinalAllTracksVote());
  slides.push(sopIceMatrix());
  slides.push(sopWorkshopNextSteps());
  slides.push(...sopWorkshopClose());

  return slides;
}

// ─── DUAL-SOP GEMEINSAME HELFER ───────────────────────────────────────────────
// Von sequenzieller UND paralleler Dual-Vorlage genutzt (kein doppelter Code).

// Gesamt-Priorisierung über beide SOPs. Faire Abstimmung: eigene Beiträge sind
// nicht wählbar (sopFairVote) — konsistent mit der Single-SOP-Finalabstimmung.
function dualCombinedVote() {
  const n = (window.LP_WORKSHOP_SETTINGS?.finalPriorityCount || 5);
  return tplSlide('mc_multi', {
    title: 'Gesamt-Priorisierung über beide SOPs',
    subtitle: `Wählt die Top ${n} KI Use Cases aus Internal und Consulting`,
    prompt: `Welche ${n} Use Cases haben über beide SOPs hinweg den größten Hebel für ROOTS?\nHinweis: Eigene Beiträge können nicht gewählt werden.`,
    isQuestionSlide: true,
    options: [],
    maxSelections: n,
    sopKind: SK.GROUP_VOTE,
    sopFairVote: true,
    ...dualBothGroupsFields(),
    sopDualProgress: { mode: 'finale', label: 'Finale Priorisierung' },
  }, { showResultsLive: true, sopAllTracksVote: true, sopFairVote: true, sopVoteMax: n, workshopMode: 'decide' });
}

// Teilnehmer-Zuweisungsfolie — live im Present-Modus aus QR-Teilnehmern befüllt.
function dualParticipantsSlide(subtitle) {
  return tplSlide('content', {
    title: 'SOP-Zuweisung',
    subtitle: subtitle || 'Teilnehmer per QR-Code Internal oder Consulting zuweisen',
    body: '',
    sopKind: SK.PARTICIPANTS,
    isHeroSlide: false,
    ...dualBothGroupsFields(),
  }, { workshopMode: 'orient' });
}

function dualGroupTransitionSlide(intTrackCount) {
  return tplSlide('section', {
    title: 'Wechsel zu Consulting SOP',
    subtitle: 'Internal abgeschlossen — jetzt die Consulting-SOP durchgehen',
    body: `${intTrackCount} Internal-Tracks sind durch. Als Nächstes sammelt ihr Use Cases entlang der Consulting-SOP.`,
    sopKind: SK.GROUP_TRANSITION,
    ...sopGroupFields('consulting'),
    sopDualProgress: { mode: 'sequential', sopIndex: 2, sopTotal: 2, label: 'SOP 2/2' },
    sopDualSequential: true,
  }, { workshopMode: 'orient' });
}

// ─── DUAL SOP · SEQUENZIELL (Internal, dann Consulting — kein Split-View) ─────
function buildDualSopSequentialWorkshopSlides() {
  const slides = [];
  const intTrackCount = INTERNAL_SOP_TRACKS.length;
  const conTrackCount = SOP_TOOL_TRACKS.length;

  function tagDualSharedSlide(slide) {
    Object.assign(slide.content, dualBothGroupsFields());
    slide.content.sopDualSequential = true;
    return slide;
  }

  function tagSeqSlide(slide, group, trackIndex, trackTotal) {
    Object.assign(slide.content, sopGroupFields(group));
    Object.assign(slide.content, dualSequentialProgress(group, trackIndex, trackTotal, intTrackCount));
    slide.content.sopDualSequential = true;
    return slide;
  }

  const introSlides = sopWorkshopIntro({
    title: 'SOP · KI Use-Case Workshop',
    subtitle: 'Internal und Consulting nacheinander',
    exampleKey: 'consulting',
  });
  introSlides.forEach((s) => tagDualSharedSlide(s));
  slides.push(...introSlides);

  slides.push(tagDualSharedSlide(
    dualParticipantsSlide('Alle per QR beigetretenen Teilnehmer einem SOP zuweisen — danach startet Internal.'),
  ));

  INTERNAL_SOP_TRACKS.forEach((t, i) => {
    slides.push(tagSeqSlide(sopTrackBrainstorm(t), 'internal', i, intTrackCount));
  });

  slides.push(dualGroupTransitionSlide(intTrackCount));

  SOP_TOOL_TRACKS.forEach((t, i) => {
    slides.push(tagSeqSlide(sopTrackBrainstorm(t), 'consulting', i, conTrackCount));
  });

  slides.push(tagDualSharedSlide(sopPitchSession()));
  slides.push(tagDualSharedSlide(dualCombinedVote()));
  slides.push(tagDualSharedSlide(sopIceMatrix()));
  slides.push(tagDualSharedSlide(sopWorkshopNextSteps()));
  sopWorkshopClose().forEach((s) => slides.push(tagDualSharedSlide(s)));

  return slides;
}

// ─── DUAL SOP · PARALLEL (Internal + Consulting gleichzeitig · Split-View) ──
function buildDualSopParallelWorkshopSlides() {
  const slides = [];
  const pairCount = Math.max(INTERNAL_SOP_TRACKS.length, SOP_TOOL_TRACKS.length);
  const G = window.LP_SOP_GROUP_META;
  const trackName = (t) => t?.title?.replace(/^Track \d+: /, '') || '';

  // Welche SOPs sind in diesem Paar vertreten? Bei ungleicher Track-Zahl
  // (Internal 5, Consulting 3) sind die letzten Paare einseitig.
  function pairInfo(pairIndex) {
    const internal = INTERNAL_SOP_TRACKS[pairIndex] || null;
    const consulting = SOP_TOOL_TRACKS[pairIndex] || null;
    const sides = [];
    if (internal) sides.push('internal');
    if (consulting) sides.push('consulting');
    const internalTrackName = internal ? trackName(internal) : null;
    const consultingTrackName = consulting ? trackName(consulting) : null;
    let subtitle = 'Überblick der parallelen Tracks';
    if (internal && consulting) {
      subtitle = `${G.internal.shortLabel}: ${internalTrackName} und ${G.consulting.shortLabel}: ${consultingTrackName}`;
    } else if (internal) {
      subtitle = `${G.internal.shortLabel}: ${internalTrackName}`;
    } else if (consulting) {
      subtitle = `${G.consulting.shortLabel}: ${consultingTrackName}`;
    }
    return {
      internal,
      consulting,
      sides,
      singleSide: sides.length === 1 ? sides[0] : null,
      internalTrackName,
      consultingTrackName,
      subtitle,
    };
  }

  function tagDualSharedSlide(slide) {
    Object.assign(slide.content, dualBothGroupsFields());
    slide.content.sopDualParallel = true;
    return slide;
  }

  function tagDualSlide(slide, group, pairIndex) {
    Object.assign(slide.content, sopGroupFields(group));
    Object.assign(slide.content, dualParallelProgress(pairIndex, pairCount));
    slide.content.sopDualPairIndex = pairIndex;
    slide.content.sopDualParallel = true;
    return slide;
  }

  const introSlides = sopWorkshopIntro({
    title: 'SOP · KI Use-Case Workshop',
    subtitle: 'Internal und Consulting parallel',
    body: 'QR scannen, Name und Avatar wählen. Der Host weist euch euer SOP-Team zu — los geht\'s!',
    exampleKey: 'consulting',
    openerExtra: { sopDualParallel: true },
  });
  introSlides.forEach((s) => tagDualSharedSlide(s));
  slides.push(...introSlides);

  slides.push(tagDualSharedSlide(
    dualParticipantsSlide('Alle per QR beigetretenen Teilnehmer einem SOP zuweisen — danach paralleles Sammeln.'),
  ));

  function dualPairCollectAnchor(pairIndex) {
    const ws = window.LP_WORKSHOP_SETTINGS;
    const info = pairInfo(pairIndex);
    const n = pairIndex + 1;
    return tplSlide('brainstorm', {
      title: 'Use Cases sammeln',
      subtitle: '',
      prompt: `Welche KI Use Cases seht ihr in diesem Track? Max. ${ws.brainstormMaxResponses} pro Person.`,
      isQuestionSlide: true,
      sopKind: SK.DUAL_PAIR_COLLECT,
      sopDualPairIndex: pairIndex,
      sopDualParallel: true,
      sopDualSingleSide: info.singleSide,
      internalTrackName: info.internalTrackName,
      consultingTrackName: info.consultingTrackName,
      ...dualParallelProgress(pairIndex, pairCount),
    }, brainstormSettings());
  }

  function hiddenBrainstormSlide(track, group, pairIndex) {
    const s = tagDualSlide(sopTrackBrainstorm(track), group, pairIndex);
    s.settings = { ...s.settings, sopDualHiddenNav: true };
    return s;
  }

  for (let i = 0; i < pairCount; i += 1) {
    slides.push(dualPairCollectAnchor(i));
    if (INTERNAL_SOP_TRACKS[i]) slides.push(hiddenBrainstormSlide(INTERNAL_SOP_TRACKS[i], 'internal', i));
    if (SOP_TOOL_TRACKS[i]) slides.push(hiddenBrainstormSlide(SOP_TOOL_TRACKS[i], 'consulting', i));
  }

  slides.push(tagDualSharedSlide(sopPitchSession()));
  slides.push(tagDualSharedSlide(dualCombinedVote()));
  slides.push(tagDualSharedSlide(sopIceMatrix()));
  slides.push(tagDualSharedSlide(sopWorkshopNextSteps()));
  sopWorkshopClose().forEach((s) => slides.push(tagDualSharedSlide(s)));

  return slides;
}

window.LP_TEMPLATES = [
  {
    key: 'roots-sop-ki-workshop-phase',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Workshop · Pro Phase',
    desc: 'SOP-Kontext je Phase → Brainstorm → Track-Vote → Presentation Session → Pitch → Übersicht → ICE Matrix.',
    duration: '90–150 Min.',
    group: '6–25',
    tips: 'Höchste Tiefe. SOP-Übersicht vor jedem Brainstorm. 5 Min. / max. 2 Use Cases je Phase — 10 Phasen × 5 Min ≈ 50 Min nur Sammeln, plus Votes/Presentations/Matrix.',
    slides: buildSopKiWorkshopSlides('pro-phase'),
  },
  {
    key: 'roots-sop-ki-workshop-track',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Workshop · Pro Track',
    desc: 'Alle Phasen auf einen Blick → Track-Brainstorm → Pitch Session → finale Priorisierung → ICE Matrix.',
    duration: '60–90 Min.',
    group: '6–25',
    tips: 'Tempo-Format. Vollständige SOP-Übersicht als Kontext. 5 Min. / max. 2 Use Cases pro Track. Am Ende Pitch, dann Gesamt-Priorisierung.',
    slides: buildSopKiWorkshopSlides('pro-track'),
  },
  {
    key: 'roots-marketing-sop-workshop',
    category: 'ROOTS · SOP & KI',
    name: 'Marketing SOP · Pro Karte',
    desc: 'Marketing-SOP (1 Track, 10 Karten): je Karte sammeln · Top-3 priorisieren · Presentation Session · Pitch → ICE Matrix.',
    duration: '75–110 Min.',
    group: '6–20',
    tips: 'Pro Karte 5 Min. · max. 2 Use Cases. Achtung: 10 Karten × 5 Min ≈ 50 Min nur Sammeln — Zeitlimit ggf. in LP_WORKSHOP_SETTINGS senken.',
    slides: buildMarketingSopWorkshopSlides(),
  },
  {
    key: 'roots-sop-dual-internal-consulting-sequential',
    category: 'ROOTS · SOP & KI',
    name: 'Internal + Consulting · nacheinander',
    desc: 'Erst Internal-SOP, dann Consulting-SOP · keine Split-View · EINE konsolidierte Priorisierung + gemeinsame ICE-Matrix.',
    duration: '90–120 Min.',
    group: '5–25',
    tips: 'Pro Track eine Sammel-Folie mit SOP-Board. Internal komplett durch, danach Consulting. Pitch Session, dann Gesamt-Priorisierung, Matrix und Abschluss.',
    slides: buildDualSopSequentialWorkshopSlides(),
  },
  {
    key: 'roots-sop-dual-internal-consulting-parallel',
    category: 'ROOTS · SOP & KI',
    name: 'Internal + Consulting · parallel',
    desc: 'Beide SOPs gleichzeitig · eine Sammel-Folie pro Track · Split-View mit voller SOP-Breite · Host-Zuweisung · konsolidierte Priorisierung + Matrix.',
    duration: '90–120 Min.',
    group: '5–25',
    tips: 'Pro Track nur eine Host-Folie (Sammeln mit SOP im Split). QR-Join → Host weist Internal/Consulting zu. Pitch Session, dann Gesamt-Priorisierung, Matrix und Abschluss.',
    slides: buildDualSopParallelWorkshopSlides(),
  },
];

// ─── DEBUG MOCK DATA ─────────────────────────────────────────────────────────
// Simulation: Use Cases im gleichen Format wie die Instruktionsfolie (Use Case | Feature | Abhängigkeiten)
window.LP_SIM_GENERIC_USE_CASES = [
  simUseCase('Meeting-Protokolle strukturieren', 'Transkript, Summary und To-dos landen in Notion', 'Teams-Aufzeichnung + Notion-Seite pro Projekt'),
  simUseCase('Erstkontakt-Mail vor Gespräch vorbereiten', 'Recherche zu Firma und Ansprechpartner, drei Gesprächseinstiege als Entwurf', 'LinkedIn-Profil + Website + CRM-Eintrag'),
  simUseCase('Workshop-Ergebnisse aufbereiten', 'Cluster aus Post-its, Priorisierung und nächste Schritte als Protokoll', 'Miro-Board oder Foto der Flipcharts + Notion-Vorlage'),
  simUseCase('Wiederkehrende Reports erstellen', 'Daten werden zusammengeführt, KPIs kommentiert, PDF versendet', 'Excel-Exporte + feste Report-Vorlage in PowerPoint'),
  simUseCase('Onboarding neuer Teammitglieder', 'Checkliste, Lernpfad und Q&A-Bot aus internen SOPs', 'SharePoint-SOPs + Confluence/Notion-Wissensbasis'),
  simUseCase('Kundenfeedback aus Umfragen auswerten', 'Sentiment, Top-Themen und Zitate als Kurzbericht', 'Typeform/Forms-Export + anonymisierte Rohdaten'),
];

window.LP_DEBUG_PHASE_USE_CASES = {
  'Anbahnung': [
    simUseCase('Bedarfssignale bei Zielkunden erkennen', 'LinkedIn-Posts, News und Stellenanzeigen werden gescannt, wöchentliche Shortlist', 'Sales Navigator + Liste der Zielaccounts'),
    simUseCase('Outreach vor Erstgespräch personalisieren', 'GPT recherchiert Firma und schlägt drei konkrete Gesprächseinstiege vor', 'CRM-Eintrag + öffentliche Unternehmensinfos'),
    simUseCase('Erstgespräch-Protokoll automatisch', 'Transkript, Pain Points und nächste Schritte nach Notion', 'Teams-Call-Aufzeichnung + Notion-Template'),
  ],
  'Exploration': [
    simUseCase('Discovery-Call auswerten', 'Themen-Cluster, Zitate und offene Fragen aus Transkript', 'Aufgezeichnete Calls + Glossar der Kundenbegriffe'),
    simUseCase('Symptome von Ursachen trennen', '5-Why-Kette aus Interview-Notizen, Visualisierung als Issue Tree', 'Interview-Transkripte oder Moderations-Notizen'),
    simUseCase('SMART-Ziele aus Workshop-Notizen', 'Ziele mit Messgrößen, Verantwortlichen und Deadline-Vorschlag', 'Workshop-Protokoll + Stakeholder-Liste'),
    simUseCase('Markt- und Wettbewerbs-Snapshot', 'Perplexity-Research zu Markt, Wettbewerbern und Trends als Memo', 'Branche + Region definiert + Quellenfreigabe'),
    simUseCase('Erste Hypothesen strukturieren', 'Issue Tree und Hypothesen aus Gesprächsnotizen', 'Gesammelte Erkenntnisse aus Exploration-Phase'),
  ],
  'Pitch': [
    simUseCase('Angebots-Workplan aus Scope', 'Meilensteine, Deliverables und grobe Aufwände aus Briefing-Dokument', 'Scope-Doc + interne Workplan-Templates'),
    simUseCase('KVA-Entwurf aus Leistungsumfang', 'Positionen, Tagessätze und USt-Prüfung als Excel/PDF-Entwurf', 'Scope + Pricing-Guidelines + Vertragsvorlage'),
    simUseCase('Pitch-Deck aus Angebotsstory', 'Folienstruktur, Kernbotschaften und Sprecher-Notizen', 'Angebotsinhalt + ROOTS-Deck-Template'),
    simUseCase('Follow-up-Mail nach Pitch', 'Personalisierte Zusammenfassung, offene Punkte und nächster Termin', 'Pitch-Protokoll + CRM-Kontakt'),
  ],
  'Ramp-up': [
    simUseCase('Kickoff-Agenda aus Projektbrief', 'Agenda, Rollen, Erwartungen und RACI-Entwurf', 'Projektbrief + Teilnehmerliste'),
    simUseCase('Team-Staffing vorschlagen', 'Skill-Matching aus Profilen und Verfügbarkeiten', 'Team-Skills-Matrix + Projektanforderungen'),
    simUseCase('Datenquellen-Katalog anlegen', 'Übersicht aller benötigten Daten inkl. Owner und Zugangsstatus', 'Liste der Datenbedarfe aus Workplan'),
    simUseCase('Projekt-Timeline generieren', 'Gantt-Entwurf aus Meilensteinen und Abhängigkeiten', 'Workplan + Feiertags-/Urlaubsplanung'),
  ],
  'Analyse': [
    simUseCase('Umfrage für Datenbedarf', 'Fragebogen-Entwurf, Versandtext und Auswertungsplan', 'Liste der Datenlücken + Zielgruppe der Befragten'),
    simUseCase('Dashboard aus Rohdaten', 'Charts, Filter und Kommentar-Spalten in Excel/PBI', 'Bereinigte Rohdaten + KPI-Definition'),
    simUseCase('IST-Prozess aus Interviews', 'Prozessschritte, Medienbrüche und Pain Points visualisiert', 'Interview-Notizen + Prozess-Notation vereinbart'),
    simUseCase('Benchmark-Zahlen recherchieren', 'Branchenvergleich mit Quellenangaben als Tabelle', 'Benchmark-Fragen + freigegebene Research-Tools'),
  ],
  'Synthese': [
    simUseCase('So-What aus Analysefolien', 'Kernaussagen, Implikationen und Empfehlungsoptionen pro Chart', 'Fertige Analyse-Slides + Storyline-Rahmen'),
    simUseCase('Storyline nach Pyramid Principle', 'Argumentationsstruktur mit Überschriften und Belegfolien', 'Analyse-Ergebnisse + Zielgruppe der Präsentation'),
    simUseCase('Impact/Effort für Maßnahmen', 'Priorisierungsmatrix mit Begründung je Quadrant', 'Liste der Maßnahmen + Bewertungskriterien'),
    simUseCase('Business-Case-Rechnung', 'ROI-Szenario mit Annahmen, Sensitivität und Break-even', 'Kosten-/Nutzen-Annahmen + Excel-Modellvorlage'),
    simUseCase('Executive Summary', 'One-Pager mit Empfehlung, Risiken und nächsten Schritten', 'Finale Storyline + Freigabe durch Projektleitung'),
  ],
  'Delivery': [
    simUseCase('Charts aus Excel-Daten', 'Standardisierte Diagramme nach ROOTS-Design in PowerPoint', 'Excel-Daten + Chart-Templates'),
    simUseCase('Steering-Committee-Deck optimieren', 'Kürzen, Klarheit, Sprecher-Notizen und Q&A-Vorbereitung', 'Rohentwurf + Feedback vom PL'),
    simUseCase('Q&A-Antworten vorbereiten', 'Wahrscheinliche Fragen mit evidenzbasierten Antwortentwürfen', 'Finale Empfehlungsfolien + Anhang'),
    simUseCase('Elevator-Pitch testen', '30-Sekunden- und 2-Minuten-Version mit Feedback-Score', 'Kernbotschaft + Testpersonen aus dem Team'),
  ],
  'Implementierung': [
    simUseCase('Schulungsplan für Capability Building', 'Module, Formate, Materialien und Zeitplan', 'Skill-Gaps + verfügbare Trainer'),
    simUseCase('Change-Story für Betroffene', 'Narrativ, FAQ und Kommunikationsplan', 'Change-Impact-Analyse + Kanäle (Intranet/Teams)'),
    simUseCase('Governance/RACI definieren', 'Rollen, Entscheidungswege und Eskalation', 'Organigramm + Prozessverantwortliche'),
    simUseCase('Pilot-KPIs überwachen', 'Dashboard mit Schwellenwerten und Alert bei Abweichung', 'Pilot-Scope + Messkonzept'),
  ],
  'Closeout': [
    simUseCase('Abschlussbericht aus Projektdaten', 'Lessons Learned, Ergebnisse und offene Punkte', 'Projektordner + Meilenstein-Historie'),
    simUseCase('Rechnungsstellung vorbereiten', 'Leistungsnachweis, Positionen und Prüfung vor Versand', 'Timesheets + Vertrag/KVA'),
    simUseCase('Team-Retro moderieren', 'Retro-Protokoll mit Maßnahmen und Verantwortlichen', 'Anonymes Feedback oder Live-Runde'),
    simUseCase('Learnings in Wissensdatenbank', 'Strukturierte Einträge für ähnliche Projekte', 'Notion/SharePoint-Wissensbereich'),
  ],
  'Follow-up': [
    simUseCase('Impact der Empfehlungen tracken', 'KPI-Dashboard mit Ist vs. Soll und Kommentar', 'Verabredete KPIs + Datenzugänge beim Kunden'),
    simUseCase('Case Study aus Projekt', 'Entwurf mit Situation, Lösung, Ergebnis und Zitat', 'Freigabe Kunde + anonymisierte Facts'),
    simUseCase('Upsell-Signale erkennen', 'Monitoring von News, Stellen, Budgets bei Bestandskunden', 'Account-Liste + CRM-Historie'),
  ],
};

window.LP_DEBUG_PARTICIPANTS = [
  { name: 'Anna Becker',  emoji: '🦊', color: '#206efb' },
  { name: 'Max Hoffmann', emoji: '🐼', color: '#10b981' },
  { name: 'Lena Schmidt', emoji: '🦁', color: '#06b6d4' },
  { name: 'Tom Werner',   emoji: '🐸', color: '#a855f7' },
  { name: 'Sara Klein',   emoji: '🦄', color: '#ec4899' },
  { name: 'Felix Bauer',  emoji: '🐙', color: '#0ea5e9' },
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

// LP_DEFAULT_STYLE ist oben definiert (single source of truth).

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
    quadrants: iceQuadrants(),
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

// ─── LOCALSTORAGE: SOP-Strukturen beim Laden spiegeln + Export-Helfer ─────────
// Steht bewusst am Dateiende: alle drei SOP-Strukturen sind hier initialisiert.
(function () {
  const LS_KEY = 'lp_sop_tracks_v2';        // bestehender Key (Consulting) — rückwärtskompatibel
  const LS_KEY_ALL = 'lp_sop_tracks_all_v1'; // alle SOPs gebündelt
  const all = {
    consulting: SOP_TOOL_TRACKS,
    internal: INTERNAL_SOP_TRACKS,
    marketing: MARKETING_SOP_TRACKS,
  };
  // Immer die aktuelle In-Code-Struktur spiegeln, damit die Kopie nie veraltet.
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(SOP_TOOL_TRACKS, null, 2));
    localStorage.setItem(LS_KEY_ALL, JSON.stringify(all, null, 2));
  } catch (e) {
    console.warn('[LP] SOP-Struktur konnte nicht in localStorage geschrieben werden:', e);
  }
  // Export-Helfer robust anhängen — window.LP stammt aus lp-core.js (lädt vor templates.js).
  window.LP = window.LP || {};
  // which: 'consulting' | 'internal' | 'marketing' | 'all' (Default: all)
  window.LP.exportSopTracks = function (which = 'all') {
    const payload = which === 'all' ? all : (all[which] || all.consulting);
    const json = JSON.stringify(payload, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json)
        .then(() => { if (window.toast) window.toast(`SOP-Struktur (${which}) in Zwischenablage kopiert ✓`, 'success'); })
        .catch(() => { console.log(json); });
    } else {
      console.log(json);
      if (window.toast) window.toast('SOP-Struktur → siehe Konsole', 'info');
    }
    return json;
  };
})();
