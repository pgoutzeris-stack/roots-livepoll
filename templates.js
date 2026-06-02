/* Vorlagen – umfangreich, arbeitsalltagnah, vielfältige Folientypen */
window.LP_TEMPLATE_STYLE = { bgColor: '#ffffff', textColor: '#0f172a', accentColor: '#206efb' };
window.LP_TEMPLATE_SETTINGS = { anonymous: false, askName: true, showResultsLive: true, profanityFilter: true, multipleResponses: false };

function tplSlide(type, content, settings = {}) {
  return {
    slide_type: type,
    content: { ...window.LP_TEMPLATE_STYLE, ...content },
    settings: { ...window.LP_TEMPLATE_SETTINGS, ...settings },
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
            prompt: 'Welche KI macht Problem-Framing schneller und präziser?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: "5-Why"-Bot, Symptom-Ursache-Mapping, Auto-Transkript von Discovery-Calls.',
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

function sopPhaseIntro(track, phase, phaseIndex, totalPhases) {
  return tplSlide('section', {
    title: phase.name,
    subtitle: `${track.title.replace(/^Track \d+: /, '')} · Phase ${phaseIndex + 1} von ${totalPhases}`,
    body: phase.intro,
    sopKind: 'phase',
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase),
  });
}

// ─── SOP PHASE BRAINSTORM ─────────────────────────────
// Statt pro Karte wird pro Phase gesammelt. Der SOP-Kontext wird direkt
// auf der vorherigen Phasenfolie gezeigt.

function sopPhaseBrainstorm(track, phase) {
  return tplSlide('brainstorm', {
    title: `KI Use Cases in ${phase.name}`,
    body: '',
    subtitle: track.title.replace(/^Track \d+: /, ''),
    prompt: 'Wo seht ihr KI-Potenzial in dieser Phase? Sammelt eure Ideen — konkrete Tools, Workflows, Aufgaben die KI übernehmen könnte.',
    mentiQuestion: true,
    sopKind: 'phase-workshop',
    ...sopMeta(track, phase),
  }, { showResultsLive: true, workshopMode: 'collect', profanityFilter: true });
}

function sopPhaseVote(track, phase) {
  return tplSlide('mc_multi', {
    title: `Priorisierung · ${phase.name}`,
    subtitle: track.title.replace(/^Track \d+: /, ''),
    prompt: 'Wählt die drei wichtigsten KI Use Cases dieser Phase. Welche Ideen sollten in dieser Phase zuerst weitergedacht oder pilotiert werden?',
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
    prompt: 'Wählt die drei KI Use Cases, die in diesem Track den größten Hebel für ROOTS haben. Nutzt die SOP-Übersicht als Kontext: In welchen Phasen zahlen die Ideen wirklich ein?',
    mentiQuestion: true,
    options: [],
    maxSelections: 3,
    sopKind: 'track-vote',
    sopBoard: sopBoardData(track),
    ...sopMeta(track),
  }, { showResultsLive: true, sopTrackVote: true, sopVoteMax: 3, workshopMode: 'decide' });
}

// ─── WORKSHOP-LEVEL HELPERS (Cross-Track Summary + Final Vote + Closing) ───────

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

function sopPriorityMatrix() {
  return tplSlide('priority_matrix', {
    title: 'Priorisierungs-Matrix',
    prompt: 'Ziehe die je Track priorisierten KI Use Cases in den passenden Quadranten. Diskutiert kurz, ob Impact und Aufwand realistisch eingeschätzt sind.',
    subtitle: 'Impact vs. Effort · Track-Top-3',
    xAxisLabel: 'Aufwand',
    xAxisLow: 'niedrig',
    xAxisHigh: 'hoch',
    yAxisLabel: 'Impact',
    yAxisLow: 'niedrig',
    yAxisHigh: 'hoch',
    quadrants: {
      qw: { label: 'Quick Win', icon: '🚀', desc: 'hoher Impact · niedriger Aufwand' },
      sb: { label: 'Strategic Bet', icon: '⭐', desc: 'hoher Impact · hoher Aufwand' },
      ts: { label: 'Time Sink', icon: '🔧', desc: 'niedriger Impact · hoher Aufwand' },
      dr: { label: 'Drop', icon: '❌', desc: 'niedriger Impact · niedriger Aufwand' },
    },
    sopKind: 'final-matrix',
  }, { showResultsLive: true, sopAllTracksMatrix: true, workshopMode: 'decide' });
}

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

// ─── BUILD ───────

function buildSopKiWorkshopSlides() {
  const slides = [];

  // 1. Opener
  slides.push(tplSlide('content', {
    title: 'SOP · KI Use-Case Workshop',
    body: 'Wir gehen die ROOTS-SOP Track für Track durch.\nPro Phase sammeln wir KI-Use-Cases.\nAm Track-Ende priorisiert ihr die Top 3 Use Cases.\nZum Abschluss ordnen wir die priorisierten Use Cases in eine Impact/Effort-Matrix ein.\n\nQR scannen · Name + Avatar wählen.',
    mentiHero: true,
  }));

  // 2. Per Track: Intro → Phasen (Intro + Brainstorm + Priorisierung) → Track Top-3
  SOP_TOOL_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));
    track.phases.forEach((phase, pi, allPhases) => {
      slides.push(sopPhaseIntro(track, phase, pi, allPhases.length));
      slides.push(sopPhaseBrainstorm(track, phase));
      slides.push(sopPhaseVote(track, phase));
    });
    slides.push(sopTrackVote(track, ti));
  });

  // 3. Workshop-Finale: Track-Top-3 Übersicht + Priorisierungs-Matrix
  slides.push(sopAllTracksSummary());
  slides.push(sopPriorityMatrix());

  return slides;
}

window.SOP_TOOL_TRACKS = SOP_TOOL_TRACKS;

// ─── LOCALSTORAGE: SOP-Struktur beim ersten Laden speichern ──────────────────
// Damit kann die Struktur jederzeit in DevTools → Application → localStorage
// eingesehen, exportiert oder für künftige Anpassungen genutzt werden.
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
    // Expose helper: LP.exportSopTracks() → kopiert JSON in Clipboard
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

window.LP_TEMPLATES = [
  {
    key: 'roots-sop-ki-workshop',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Brainstorming & KI Use Cases',
    desc: 'Fokussierter SOP-Workshop: pro Phase KI Use Cases sammeln, pro Track Top 3 priorisieren, finale Impact/Effort-Matrix.',
    duration: '90–150 Min.',
    group: '6–25',
    tips: 'Flow: Phase verstehen → KI Use Cases sammeln → Track-Top-3 wählen → Impact/Effort-Matrix befüllen.',
    slides: buildSopKiWorkshopSlides(),
  },
  {
    key: 'roots-sop-ki-workshop-debug',
    category: 'ROOTS · SOP & KI · DEBUG',
    name: '[DEBUG] SOP-Workshop · simulierte Antworten',
    desc: 'QA-Test-Version: Sobald du sie startest, werden automatisch Fake-Teilnehmer und realistische Antworten für ALLE Folien injiziert. Damit kannst du jede Slide-Render-Variante inspizieren.',
    duration: '— (Debug)',
    group: '— (Debug)',
    tips: 'Erscheint nur lokal — Antworten werden nicht in der DB persistiert. Nach dem Verlassen der Session sind sie weg.',
    slides: buildSopKiWorkshopSlides(),
  },
];

// ─── DEBUG MOCK DATA ─────────────────────────────────────────────
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
  { name: 'Lena Schmidt', emoji: '🦁', color: '#f59e0b' },
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
window.LP_AVATAR_COLORS = ['#206efb', '#10b981', '#f59e0b', '#dc2626', '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'];

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
