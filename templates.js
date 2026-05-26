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
    intro: 'Vom Erstkontakt bis zum Vertragsabschluss. 3 Phasen.',
    phases: [
      {
        name: 'Anbahnung',
        intro: 'Erstkontakt mit dem Kunden — vorstellen, Ziele klären, Markt einschätzen.',
        cards: [
          {
            name: 'ROOTS Vorstellung',
            intro: 'Erster Kontakt mit dem Kunden – ROOTS Positionierung, Team und Arbeitsweise vorstellen.',
            prompt: 'Welche KI macht den Erstkontakt persönlicher und überzeugender?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: KI-personalisiertes Outreach, Auto-Recherche zum Kunden vorab, Pitch-Video-Generator.',
            voteMax: 1,
          },
          {
            name: 'Zielstellung klären',
            intro: 'Gemeinsame Ziele, Erfolgskriterien und Erwartungen des Kunden definieren.',
            prompt: 'Welche KI hilft, Ziele schneller und schärfer zu klären?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: SMART-Goal-Coach, KI-Moderator für Discovery-Calls, Auto-Transcript & Highlight-Extraktion.',
            voteMax: 2,
          },
          {
            name: 'Initiale Analyse',
            intro: 'Erste Einschätzung von Markt, Wettbewerb und Ist-Situation des Kunden.',
            prompt: 'Welche KI beschleunigt Markt- und Wettbewerbs-Analysen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Wettbewerbs-Scraper, Industry-Research-Bot, SWOT-Generator.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Exploration',
        intro: 'Tiefer eintauchen — Bedarf verstehen, Online-Auftritt prüfen, erste Specs erfassen.',
        cards: [
          {
            name: 'Bedarfsanalyse / Problem Framing',
            intro: 'Kernprobleme und Herausforderungen des Kunden strukturiert erfassen.',
            prompt: 'Welche KI macht Problem-Framing schärfer und schneller?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Transkript von Discovery-Calls + Themen-Cluster, "5-Why"-Bot, Symptom-Ursache-Mapping.',
            voteMax: 2,
            requiresIntro: true,
          },
          {
            name: 'Onboarding-Skizze & Aufwand',
            intro: 'Groben Projekt- und Onboarding-Rahmen mit Aufwandsindikation skizzieren.',
            prompt: 'Welche KI hilft beim schnellen Aufwand-Scoping und Onboarding-Plan?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Templates aus Vergangenheits-Projekten, Aufwand-Predictor, Auto-Plan-Generator.',
            voteMax: 2,
          },
          {
            name: 'Website & Online-Analyse',
            intro: 'Digitale Touchpoints, Website und Online-Auftritt des Kunden bewerten.',
            prompt: 'Welche KI liefert automatisierte Website- und Online-Audits?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: SEO-Auditor, UX-Analyse-AI, Heatmap-Predictor, Brand-Consistency-Checker.',
            voteMax: 3,
          },
          {
            name: 'Initiale Spezifikationen',
            intro: 'Erste Anforderungen und Spezifikationen für das Projekt dokumentieren.',
            prompt: 'Welche KI hilft beim sauberen Erfassen erster Specs?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: User-Story-Generator, Spec-Template-Filler, Akzeptanz-Kriterien-Bot.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Pitch',
        intro: 'Angebot bauen, präsentieren, Vertrag schließen.',
        cards: [
          {
            name: 'Angebotsgestaltung & Präsentation',
            intro: 'Angebot erstellen und überzeugend beim Kunden präsentieren.',
            prompt: 'Welche KI macht Angebote schneller und schöner?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Proposal-Generator aus Brief, Pitch-Deck-AI, Pricing-Optimizer.',
            voteMax: 2,
          },
          {
            name: 'Pitch Benchmarking',
            intro: 'Pitch gegen Wettbewerb und Best Practices spiegeln und schärfen.',
            prompt: 'Welche KI hilft beim Benchmarken gegen Best-Practice-Pitches?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Competitive-Pitch-Library, AI-Pitch-Critique, A/B-Test-Generator.',
            voteMax: 1,
            requiresIntro: true,
          },
          {
            name: 'Onboarding Admin & Vertrag',
            intro: 'Vertrag, Admin und organisatorisches Onboarding nach Pitch-Abschluss.',
            prompt: 'Welche KI automatisiert Vertrag und administratives Onboarding?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Contract-Generator, Auto-Risk-Flag, Onboarding-Checkliste-AI.',
            voteMax: 2,
          },
        ],
      },
    ],
  },
  {
    title: 'Track 2: Execution',
    class: 'track-ops',
    intro: 'Projekt-Operations vom Start bis zur Live-Schaltung. 4 Phasen — größter SOP-Bereich.',
    phases: [
      {
        name: 'Ramp-up',
        intro: 'Projekt aufgleisen — Team, Struktur, Briefing, Content-Plan.',
        cards: [
          {
            name: 'Projektstruktur aufbauen',
            intro: 'Team, Rollen, Timelines und Projekt-Setup etablieren.',
            prompt: 'Welche KI hilft beim sauberen Projekt-Setup?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Kanban-Board, Rollen-Allokator, Timeline-Generator aus Scope-Doc.',
            voteMax: 2,
          },
          {
            name: 'Briefing & Content-Plan',
            intro: 'Briefings erstellen und Content-Planung für das Projekt festlegen.',
            prompt: 'Welche KI hilft beim Briefing-Schreiben und Content-Planning?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Brief-Template-Filler, Editorial-Calendar-AI, Theme-Suggestion-Bot.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Analyse & Synthese',
        intro: 'Daten verstehen, Muster erkennen, Strategie schärfen.',
        cards: [
          {
            name: 'Performance-Analyse',
            intro: 'Kampagnen- und Marketing-Performance auswerten.',
            prompt: 'Welche KI liefert schnellere oder tiefere Performance-Insights?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Dashboards aus GA4/Meta, Anomalie-Detection in Conversion-Funnel, Predictive-ROI-Modelle.',
            voteMax: 2,
          },
          {
            name: 'Zielgruppen-Insights',
            intro: 'Zielgruppenverhalten und Insights ableiten.',
            prompt: 'Welche KI hilft uns, Zielgruppen schneller und präziser zu verstehen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Sentiment-Analyse aus Reviews, Persona-Generator aus Survey-Daten, Social-Listening mit Cluster-AI.',
            voteMax: 2,
          },
          {
            name: 'Erkenntnisse bündeln & Strategie-Update',
            intro: 'Analyseergebnisse zusammenführen, Muster identifizieren und die Strategie auf Basis daraus anpassen.',
            prompt: 'Welche KI hilft beim Verdichten von Insights und Schärfen der Strategie?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Synthese aus Discovery-Notes, Strategie-Canvas-Generator, Hypothesen-Tests mit LLMs.',
            voteMax: 2,
            requiresIntro: true,
          },
        ],
      },
      {
        name: 'Delivery',
        intro: 'Content produzieren, ausspielen, Community pflegen.',
        cards: [
          {
            name: 'Content-Produktion',
            intro: 'Inhalte erstellen – Texte, Visuals, Formate gemäß Plan.',
            prompt: 'Welche KI verzehnfacht unsere Content-Produktion?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: ChatGPT für Copy-Varianten, Midjourney/DALL-E für Visuals, ElevenLabs für Voiceover, Runway für Video.',
            voteMax: 3,
          },
          {
            name: 'Ausspielung & Community Management',
            intro: 'Content veröffentlichen und Community aktiv betreuen.',
            prompt: 'Welche KI optimiert Posting und Community-Reaktion?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Best-Time-To-Post-Predictor, Auto-Reply-Drafts, Sentiment-Watchdog.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Implementierung',
        intro: 'Kampagnen launchen, Tools integrieren, Workflows automatisieren.',
        cards: [
          {
            name: 'Kampagnen-Setup',
            intro: 'Kampagnen in Plattformen konfigurieren und launchen.',
            prompt: 'Welche KI automatisiert Kampagnen-Setup in Ads-Plattformen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-Creative-Variants, Audience-Generator, Bid-Optimizer.',
            voteMax: 2,
          },
          {
            name: 'Tool-Integration & Automatisierung',
            intro: 'Tools verbinden, Workflows automatisieren und skalieren.',
            prompt: 'Welche KI hilft bei Tool-Integration und Workflow-Automatisierung?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Zapier + GPT für Custom-Workflows, n8n-Templates, Make.com-Szenarien mit AI-Steps.',
            voteMax: 4,
            requiresIntro: true,
          },
        ],
      },
    ],
  },
  {
    title: 'Track 3: Post-Engagement',
    class: 'track-post',
    intro: 'Projektabschluss und langfristige Kunden-Beziehung. 2 Phasen.',
    phases: [
      {
        name: 'Closeout',
        intro: 'Sauberer Abschluss — Reporting, interne Retro, Kundenfeedback.',
        cards: [
          {
            name: 'Finales Reporting & Übergabe',
            intro: 'Ergebnisse dokumentieren und an den Kunden übergeben.',
            prompt: 'Welche KI automatisiert Reporting und Übergabe?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Auto-PDF-Report aus Analytics, Highlights-Reel-Generator, Stakeholder-Briefing-Bot.',
            voteMax: 3,
          },
          {
            name: 'Interne Retro & Learnings',
            intro: 'Interne Retrospektive und Learnings festhalten.',
            prompt: 'Welche KI verbessert unsere Retros und Learnings-Speicher?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Retro-Facilitator-Bot, Auto-Learning-Database, Pattern-Detection across Projects.',
            voteMax: 2,
          },
          {
            name: 'Kundenfeedback einholen',
            intro: 'Feedback vom Kunden strukturiert einholen und auswerten.',
            prompt: 'Welche KI hilft beim sauberen Einholen + Auswerten von Feedback?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: NPS-Bot, Sentiment-aus-Email, Auto-Theme-Extraktion.',
            voteMax: 2,
          },
        ],
      },
      {
        name: 'Follow-Up',
        intro: 'Beziehung pflegen, Upsell finden, Case Study produzieren.',
        cards: [
          {
            name: 'Beziehungspflege & Check-ins',
            intro: 'Regelmäßige Check-ins und Beziehungspflege mit dem Kunden.',
            prompt: 'Welche KI hält die Kunden-Beziehung warm?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Smart-CRM-Reminder, Personalisierte Check-in-Drafts, Birthday-/Anniversary-Bot.',
            voteMax: 2,
          },
          {
            name: 'Upsell & Folgeauftrag',
            intro: 'Folgeprojekte und Upsell-Potenziale identifizieren und ansprechen.',
            prompt: 'Welche KI hilft beim Erkennen und Adressieren von Upsell-Signalen?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Customer-Health-Score, Buying-Signal-Detection, Upsell-Pitch-Generator.',
            voteMax: 3,
          },
          {
            name: 'Case Study & Referenz',
            intro: 'Erfolgsgeschichte als Case Study und Referenz aufbereiten.',
            prompt: 'Welche KI macht Case Studies und Referenzen schneller produzierbar?\nFormat: Was · Wer · Welches Tool\n\nBeispiele: Case-Study-Draft aus Projektdaten, Quote-Extraktion aus Calls, Reference-Letter-Generator.',
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
    ...sopMeta(track, phase),
  });
}

// ─── SOP PHASE BRAINSTORM ─────────────────────────────
// Statt pro Karte wird pro Phase gesammelt — die Karten dienen als
// Inspiration im Slide-Body. Use Cases werden Track-weit aggregiert.

function sopPhaseBrainstorm(track, phase) {
  // Karten der Phase mit ihrer kurzen Beschreibung als Bullet-Liste —
  // damit Teilnehmer wissen welche SOP-Schritte konkret abgedeckt sind.
  const cardsHint = phase.cards.map((c) => `• ${c.name}${c.intro ? ' — ' + c.intro : ''}`).join('\n');
  return tplSlide('brainstorm', {
    title: `KI in ${phase.name}`,
    body: cardsHint,
    subtitle: track.title.replace(/^Track \d+: /, ''),
    prompt: 'Wo seht ihr KI-Potenzial in dieser Phase? Sammelt eure Ideen — konkrete Tools, Workflows, Aufgaben die KI übernehmen könnte.',
    mentiQuestion: true,
    sopKind: 'phase-workshop',
    sopBoard: [{ name: phase.name, cards: phase.cards.map((c) => c.name) }],
    ...sopMeta(track, phase),
  }, { showResultsLive: true, workshopMode: 'collect', profanityFilter: true });
}

// ─── SOP TRACK SUMMARY (zeigt alle Phase-Use-Cases) ──────

function sopTrackSummary(track, trackIndex) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('content', {
    title: `Übersicht · ${label}`,
    subtitle: `Alle KI-Use-Cases aus Track ${trackIndex + 1}`,
    body: 'Hier seht ihr alle Ideen aus diesem Track — strukturiert nach Phasen.\nWeiter zum nächsten Track.',
    sopKind: 'track-summary',
    sopTrackResults: true,
    ...sopMeta(track),
  }, { workshopMode: 'orient' });
}

// ─── WORKSHOP-LEVEL HELPERS (Cross-Track Summary + Final Vote + Closing) ───────

function sopAllTracksSummary() {
  return tplSlide('content', {
    title: 'Alle KI-Use-Cases',
    subtitle: 'Über alle 3 Tracks zusammengefasst',
    body: 'Hier seht ihr alle Use Cases aus dem gesamten Workshop — strukturiert nach Track und Phase.\nIm nächsten Schritt priorisiert ihr die Top-5 für die nächsten 90 Tage.',
    sopKind: 'all-tracks-summary',
    sopAllTracksResults: true,
    mentiHero: true,
  }, { workshopMode: 'orient' });
}

function sopFinalVote() {
  return tplSlide('percent_split', {
    title: 'Top-5 für die nächsten 90 Tage',
    prompt: 'Verteile 100 Punkte. Welche 5 Use Cases pilotiert ROOTS zuerst — über alle Tracks hinweg?',
    subtitle: 'Workshop-Finale · alle Tracks zusammen',
    mentiQuestion: true,
    options: [],
    sopKind: 'final-vote',
  }, { showResultsLive: true, sopAllTracksVote: true, workshopMode: 'decide' });
}

function sopPriorityMatrix() {
  return tplSlide('priority_matrix', {
    title: 'Priorisierungs-Matrix',
    prompt: 'Ziehe jeden Use Case in den passenden Quadranten. Du kannst beliebig oft umsortieren.',
    subtitle: 'Effort vs. Impact · alle Tracks',
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
    body: 'Wir gehen die ROOTS-SOP Track für Track durch.\nPro Phase sammeln wir KI-Use-Cases.\nAm Track-Ende seht ihr alle Ideen strukturiert.\nAm Workshop-Ende priorisiert ihr die Top-5 für die nächsten 90 Tage.\n\nQR scannen · Name + Avatar wählen.',
    mentiHero: true,
  }));

  // 2. Per Track: Intro → Phasen (Intro + Brainstorm) → Track-Übersicht
  SOP_TOOL_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));
    track.phases.forEach((phase, pi, allPhases) => {
      slides.push(sopPhaseIntro(track, phase, pi, allPhases.length));
      slides.push(sopPhaseBrainstorm(track, phase));
    });
    slides.push(sopTrackSummary(track, ti));
  });

  // 3. Workshop-Finale: Übersicht aller Use Cases, Top-5 Vote, Priorisierungs-Matrix
  slides.push(sopAllTracksSummary());
  slides.push(sopFinalVote());
  slides.push(sopPriorityMatrix());

  return slides;
}

window.SOP_TOOL_TRACKS = SOP_TOOL_TRACKS;

window.LP_TEMPLATES = [
  {
    key: 'roots-sop-ki-workshop',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Brainstorming & KI Use Cases',
    desc: 'Fokussierter SOP-Workshop: pro Karte Brainstorming, 2 Favoriten wählen, Ergebnis mit Prozenten und Gewinnern.',
    duration: '90–150 Min.',
    group: '6–25',
    tips: 'Pro Unterphase (z. B. ROOTS Vorstellung): sammeln → max. 2 Favoriten → Ergebnisfolie. Live-Ansicht zeigt Abstimmungsfortschritt.',
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
    'Otter.ai für Discovery-Call-Transcripts',
    'Perplexity für tiefe Wettbewerbs-Recherche',
    'ChatGPT für Vorrecherche zum Kunden',
    'Synthesia für personalisiertes Outreach-Video',
    'Notion AI für strukturierte Vorbereitungs-Notes',
  ],
  'Exploration': [
    'Auto-Transkript von Discovery-Calls + Themen-Cluster',
    'Symptom-Ursache-Mapping mit GPT',
    'Aufwand-Predictor basierend auf historischen Projekten',
    'SEO-Auditor (Lighthouse + GPT-Erklärungen)',
    'User-Story-Generator aus Briefing-Notes',
    'Brand-Consistency-Checker für Website',
  ],
  'Pitch': [
    'Proposal-Generator aus Brief + Templates',
    'Pitch-Deck-AI für Slide-Optimierung',
    'Pricing-Optimizer mit Marktvergleich',
    'Auto-Risk-Flag für Verträge',
    'Contract-Generator aus Scope-Doc',
  ],
  'Ramp-up': [
    'Auto-Kanban-Board aus Scope-Doc',
    'Rollen-Allokator basierend auf Skills',
    'Timeline-Generator aus Briefing',
    'Editorial-Calendar-AI',
    'Theme-Suggestion-Bot für Content-Plan',
  ],
  'Analyse & Synthese': [
    'Auto-Dashboards aus GA4/Meta',
    'Anomalie-Detection in Conversion-Funnel',
    'Sentiment-Analyse aus Reviews',
    'Persona-Generator aus Survey-Daten',
    'Social-Listening mit Cluster-AI',
    'Auto-Synthese aus Discovery-Notes',
  ],
  'Delivery': [
    'ChatGPT für Copy-Varianten',
    'Midjourney/DALL-E für Visuals',
    'ElevenLabs für Voiceover',
    'Runway für Video-Generierung',
    'Best-Time-To-Post-Predictor',
    'Auto-Reply-Drafts für Community Management',
  ],
  'Implementierung': [
    'Auto-Creative-Variants für Ads',
    'Audience-Generator aus Lookalike-Daten',
    'Bid-Optimizer für Kampagnen',
    'Zapier + GPT für Custom-Workflows',
    'n8n-Templates für Routine-Aufgaben',
    'Make.com-Szenarien mit AI-Steps',
  ],
  'Closeout': [
    'Auto-PDF-Report aus Analytics',
    'Highlights-Reel-Generator',
    'Stakeholder-Briefing-Bot',
    'Retro-Facilitator-Bot',
    'Auto-Learning-Database',
    'NPS-Bot für Kundenfeedback',
  ],
  'Follow-Up': [
    'Smart-CRM-Reminder',
    'Personalisierte Check-in-Drafts',
    'Customer-Health-Score',
    'Buying-Signal-Detection',
    'Upsell-Pitch-Generator',
    'Case-Study-Draft aus Projektdaten',
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
