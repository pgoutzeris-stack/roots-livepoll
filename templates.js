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
    intro: 'Alles vor Projektstart: vom Erstkontakt über Bedarfsanalyse bis zum Pitch. Hier identifizieren wir KI-Potenziale entlang der frühen SOP-Schritte.',
    phases: [
      {
        name: 'Anbahnung',
        intro: 'Frühe Anbahnung: ROOTS vorstellen, Zielstellung klären und eine erste Analyse durchführen.',
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
        intro: 'Vertiefende Exploration: Bedarf verstehen, Onboarding skizzieren und digitale Präsenz analysieren.',
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
        intro: 'Pitch-Phase: Angebot gestalten, präsentieren und Vertragsabschluss vorbereiten.',
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
    intro: 'Projektdurchführung von Ramp-up bis Implementierung – hier liegt das größte operative KI-Potenzial im Tagesgeschäft.',
    phases: [
      {
        name: 'Ramp-up',
        intro: 'Projektstart: Struktur aufbauen und Briefing sowie Content-Plan definieren.',
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
        intro: 'Datengetriebene Auswertung und strategische Verdichtung – Performance verstehen, Muster erkennen, Strategie schärfen.',
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
        intro: 'Content produzieren, ausspielen und Community betreuen.',
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
        intro: 'Kampagnen live schalten und Tools integrieren.',
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
    intro: 'Nach Projektende: Ergebnisse übergeben, lernen und Beziehung pflegen.',
    phases: [
      {
        name: 'Closeout',
        intro: 'Projektabschluss: Reporting, Retro und Kundenfeedback.',
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
        intro: 'Langfristige Beziehungspflege und Wachstum nach Projektende.',
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

function sopPhaseIntro(track, phase) {
  return tplSlide('section', {
    title: phase.name,
    subtitle: track.title,
    body: phase.intro,
    sopKind: 'phase',
    ...sopMeta(track, phase),
  });
}

function sopCardIntro(track, phase, card) {
  return tplSlide('content', {
    title: card.name,
    body: card.intro,
    subtitle: `${phase.name} · ${track.title.replace(/^Track \d+: /, '')}`,
    sopKind: 'card',
    sopBoard: [{ name: phase.name, cards: [card.name] }],
    ...sopMeta(track, phase, card),
  });
}

// ─── SOP CARD-LEVEL HELPERS (Brainstorm + Vote) ───────
// Card-Result-Slide entfällt — der Live-View des Vote-Slides zeigt
// die Ergebnisse direkt. Aggregation erfolgt auf Track-Ebene.

function sopCardBrainstorm(track, phase, card) {
  return tplSlide('brainstorm', {
    title: card.name,
    body: card.intro,
    subtitle: `${phase.name} · ${track.title.replace(/^Track \d+: /, '')}`,
    prompt: card.prompt || 'Welche KI Use Cases siehst du hier?\nFormat: Was · Wer · Welches Tool',
    mentiQuestion: true,
    sopKind: 'card-workshop',
    ...sopMeta(track, phase, card),
  }, { showResultsLive: true, workshopMode: 'collect' });
}

function sopCardVote(track, phase, card) {
  const voteMax = card.voteMax || 2;
  const pluralS = voteMax === 1 ? '' : 's';
  return tplSlide('mc_multi', {
    title: `Priorisierung · ${card.name}`,
    prompt: `Wähle deine ${voteMax} Lieblings-Use-Case${pluralS} aus dem Brainstorming dieser Karte.`,
    subtitle: `${phase.name} · ${track.title.replace(/^Track \d+: /, '')}`,
    mentiQuestion: true,
    maxSelections: voteMax,
    options: [],
    ...sopMeta(track, phase, card),
  }, { showResultsLive: true, sopCardVote: true, sopVoteMax: voteMax, workshopMode: 'decide' });
}

// ─── SOP TRACK-LEVEL HELPERS (Cluster, Vote, Matrix, Owner) ───────

function sopTrackThemeCluster(track) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('mc_multi', {
    title: `Themen-Cluster · ${label}`,
    prompt: 'Welche Themen ziehen sich durch die Top-Use-Cases dieses Tracks?\n(Mehrfachauswahl)',
    subtitle: 'Hilft uns, die Vielzahl zu gruppieren',
    options: [
      { id: 'content', text: 'Content & Texterstellung' },
      { id: 'analytics', text: 'Analytics & Insights' },
      { id: 'communication', text: 'Kommunikation & Outreach' },
      { id: 'research', text: 'Research & Discovery' },
      { id: 'automation', text: 'Automatisierung & Workflows' },
      { id: 'design', text: 'Design & Visuals' },
      { id: 'admin', text: 'Admin & Operations' },
      { id: 'other', text: 'Sonstiges' },
    ],
    maxSelections: 4,
    mentiQuestion: true,
    sopKind: 'theme-cluster',
    ...sopMeta(track),
  }, { showResultsLive: true, workshopMode: 'decide' });
}

function sopTrackVote(track) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('percent_split', {
    title: `Priorisierung · ${label}`,
    prompt: 'Verteile 100 Punkte auf die Use Cases dieses Tracks, die du wirklich umsetzen würdest.\n(Optionen werden aus den Karten-Votes aggregiert)',
    mentiQuestion: true,
    options: [],
    ...sopMeta(track),
  }, { showResultsLive: true, sopTrackVote: true, sopVoteMode: 'top3', workshopMode: 'decide' });
}

function sopTrackMatrix(track) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('content', {
    title: `Effort vs. Impact · ${label}`,
    subtitle: 'Plenums-Diskussion · ⏱ 5 Min',
    body: 'Wo positionieren wir die Top-Use-Cases dieses Tracks?\n\n  HOHER IMPACT\n  ┌──────────────────┬──────────────────┐\n  │ ⭐ STRATEGIC BET │ 🚀 QUICK WIN     │\n  │ langfristig wert │ jetzt umsetzbar  │\n  ├──────────────────┼──────────────────┤\n  │ ❌ DROP          │ 🔧 TIME SINK     │\n  │ nicht weiter     │ Aufwand zu hoch  │\n  └──────────────────┴──────────────────┘\n  hoher Aufwand ←——————→ niedriger Aufwand\n\nDiskutiert pro Top-Use-Case: in welchen Quadranten gehört er?\nDer Host hält das Ergebnis fest (Miro / Notion).',
    sopKind: 'matrix-2x2',
    ...sopMeta(track),
  }, { workshopMode: 'orient' });
}

function sopTrackOwner(track) {
  const label = track.title.replace(/^Track \d+: /, '');
  return tplSlide('open', {
    title: `Owner-Nominierung · ${label}`,
    prompt: 'Wer übernimmt den Lead für den TOP-Use-Case dieses Tracks?\nSelbst-Nominierung erlaubt — gerne mit Backup.',
    subtitle: 'Format: Name · ggf. Backup · Tag-Limit für Kickoff',
    sopKind: 'owner-nomination',
    ...sopMeta(track),
  }, { workshopMode: 'decide' });
}

// ─── WORKSHOP-LEVEL HELPERS (Final + Closing) ───────

function sopCrossTrackFinal() {
  return tplSlide('percent_split', {
    title: 'Top-5 für die nächsten 90 Tage',
    prompt: 'Verteile 100 Punkte. Welche 5 Use Cases pilotiert ROOTS zuerst — über alle Tracks hinweg?\n(Optionen werden aus den Track-Votes aggregiert)',
    subtitle: 'Workshop-Finale · alle Tracks zusammen',
    options: [],
    mentiQuestion: true,
    sopKind: 'final-aggregation',
  }, { showResultsLive: true, workshopMode: 'decide' });
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
    body: 'Pro SOP-Karte: Brainstorming → Top-Favoriten wählen.\nPro Track: Themen-Cluster · Priorisierung · Effort/Impact · Owner.\nFinale: Top-5 Use Cases für die nächsten 90 Tage.\n\nQR scannen · Name + Avatar wählen.',
    mentiHero: true,
  }));

  // 2. Per Track
  SOP_TOOL_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));

    track.phases.forEach((phase) => {
      slides.push(sopPhaseIntro(track, phase));

      phase.cards.forEach((card) => {
        if (card.requiresIntro) {
          slides.push(sopCardIntro(track, phase, card));
        }
        slides.push(sopCardBrainstorm(track, phase, card));
        slides.push(sopCardVote(track, phase, card));
        // (sopCardResults entfernt — Live-Vote-View ersetzt es)
      });
    });

    // End of Track: Cluster, Vote, Matrix, Owner
    slides.push(sopTrackThemeCluster(track));
    slides.push(sopTrackVote(track));
    slides.push(sopTrackMatrix(track));
    slides.push(sopTrackOwner(track));
  });

  // 3. Cross-Track Finale
  slides.push(sopCrossTrackFinal());

  // 4. Workshop Closing
  slides.push(...sopWorkshopClose());

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
];

window.LP_DEFAULT_STYLE = {
  bgColor: '#ffffff',
  textColor: '#0f172a',
  accentColor: '#206efb',
};

window.LP_INTERACTIVE_TYPES = new Set([
  'mc_single', 'mc_multi', 'yesno', 'wordcloud', 'open', 'scale', 'ranking',
  'quiz', 'qa', 'brainstorm', 'reaction', 'number_guess', 'percent_split', 'pin_image',
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
