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
          { name: 'ROOTS Vorstellung', intro: 'Erster Kontakt mit dem Kunden – ROOTS Positionierung, Team und Arbeitsweise vorstellen.' },
          { name: 'Zielstellung klären', intro: 'Gemeinsame Ziele, Erfolgskriterien und Erwartungen des Kunden definieren.' },
          { name: 'Initiale Analyse', intro: 'Erste Einschätzung von Markt, Wettbewerb und Ist-Situation des Kunden.' },
        ],
      },
      {
        name: 'Exploration',
        intro: 'Vertiefende Exploration: Bedarf verstehen, Onboarding skizzieren und digitale Präsenz analysieren.',
        cards: [
          { name: 'Bedarfsanalyse / Problem Framing', intro: 'Kernprobleme und Herausforderungen des Kunden strukturiert erfassen.' },
          { name: 'Onboarding-Skizze & Aufwand', intro: 'Groben Projekt- und Onboarding-Rahmen mit Aufwandsindikation skizzieren.' },
          { name: 'Website & Online-Analyse', intro: 'Digitale Touchpoints, Website und Online-Auftritt des Kunden bewerten.' },
          { name: 'Initiale Spezifikationen', intro: 'Erste Anforderungen und Spezifikationen für das Projekt dokumentieren.' },
        ],
      },
      {
        name: 'Pitch',
        intro: 'Pitch-Phase: Angebot gestalten, präsentieren und Vertragsabschluss vorbereiten.',
        cards: [
          { name: 'Angebotsgestaltung & Präsentation', intro: 'Angebot erstellen und überzeugend beim Kunden präsentieren.' },
          { name: 'Pitch Benchmarking', intro: 'Pitch gegen Wettbewerb und Best Practices spiegeln und schärfen.' },
          { name: 'Onboarding Admin & Vertrag', intro: 'Vertrag, Admin und organisatorisches Onboarding nach Pitch-Abschluss.' },
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
          { name: 'Projektstruktur aufbauen', intro: 'Team, Rollen, Timelines und Projekt-Setup etablieren.' },
          { name: 'Briefing & Content-Plan', intro: 'Briefings erstellen und Content-Planung für das Projekt festlegen.' },
        ],
      },
      {
        name: 'Analyse',
        intro: 'Datengetriebene Analyse: Performance und Zielgruppen verstehen.',
        cards: [
          { name: 'Performance-Analyse', intro: 'Kampagnen- und Marketing-Performance auswerten.' },
          { name: 'Zielgruppen-Insights', intro: 'Zielgruppenverhalten und Insights ableiten.' },
        ],
      },
      {
        name: 'Synthese',
        intro: 'Erkenntnisse bündeln und die Strategie auf Basis der Analyse aktualisieren.',
        cards: [
          { name: 'Erkenntnisse bündeln', intro: 'Analyseergebnisse zusammenführen und Muster identifizieren.' },
          { name: 'Strategie-Update', intro: 'Strategie auf Basis der Erkenntnisse anpassen und dokumentieren.' },
        ],
      },
      {
        name: 'Delivery',
        intro: 'Content produzieren, ausspielen und Community betreuen.',
        cards: [
          { name: 'Content-Produktion', intro: 'Inhalte erstellen – Texte, Visuals, Formate gemäß Plan.' },
          { name: 'Ausspielung & Community Management', intro: 'Content veröffentlichen und Community aktiv betreuen.' },
        ],
      },
      {
        name: 'Implementierung',
        intro: 'Kampagnen live schalten und Tools integrieren.',
        cards: [
          { name: 'Kampagnen-Setup', intro: 'Kampagnen in Plattformen konfigurieren und launchen.' },
          { name: 'Tool-Integration & Automatisierung', intro: 'Tools verbinden, Workflows automatisieren und skalieren.' },
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
          { name: 'Finales Reporting & Übergabe', intro: 'Ergebnisse dokumentieren und an den Kunden übergeben.' },
          { name: 'Interne Retro & Learnings', intro: 'Interne Retrospektive und Learnings festhalten.' },
          { name: 'Kundenfeedback einholen', intro: 'Feedback vom Kunden strukturiert einholen und auswerten.' },
        ],
      },
      {
        name: 'Follow-Up',
        intro: 'Langfristige Beziehungspflege und Wachstum nach Projektende.',
        cards: [
          { name: 'Beziehungspflege & Check-ins', intro: 'Regelmäßige Check-ins und Beziehungspflege mit dem Kunden.' },
          { name: 'Upsell & Folgeauftrag', intro: 'Folgeprojekte und Upsell-Potenziale identifizieren und ansprechen.' },
          { name: 'Case Study & Referenz', intro: 'Erfolgsgeschichte als Case Study und Referenz aufbereiten.' },
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

function sopCardBrainstorm(track, phase, card) {
  return tplSlide('brainstorm', {
    title: card.name,
    body: card.intro,
    subtitle: `${phase.name} · ${track.title.replace(/^Track \d+: /, '')}`,
    prompt: 'Welche KI Use Cases siehst du hier?\nWas · Wer · Welches Tool?',
    mentiQuestion: true,
    sopKind: 'card-workshop',
    ...sopMeta(track, phase, card),
  }, { showResultsLive: true, workshopMode: 'collect' });
}

function sopCardVote(track, phase, card) {
  return tplSlide('mc_multi', {
    title: `Priorisierung · ${card.name}`,
    prompt: 'Wähle deine 2 Lieblings-Use-Cases aus dem Brainstorming dieser Karte.',
    subtitle: `${phase.name} · ${track.title.replace(/^Track \d+: /, '')}`,
    mentiQuestion: true,
    maxSelections: 2,
    options: [],
    ...sopMeta(track, phase, card),
  }, { showResultsLive: true, sopCardVote: true, sopVoteMax: 2, workshopMode: 'decide' });
}

function sopCardResults(track, phase, card) {
  return tplSlide('content', {
    title: `Ergebnis · ${card.name}`,
    subtitle: `${phase.name} · ${track.title.replace(/^Track \d+: /, '')}`,
    body: 'Die favorisierten Use Cases mit Stimmenanteil und Gewinnern.',
    sopKind: 'card-results',
    ...sopMeta(track, phase, card),
  }, { showResultsLive: true, sopCardResults: true, workshopMode: 'decide' });
}

function sopTrackVote(track) {
  return tplSlide('percent_split', {
    title: `Priorisierung · ${track.title.replace(/^Track \d+: /, '')}`,
    prompt: 'Wähle deine Top 3 Use Cases in diesem Track. Optional: Expertenmodus mit 100 Punkten.',
    mentiQuestion: true,
    options: [],
    ...sopMeta(track),
  }, { showResultsLive: true, sopTrackVote: true, sopVoteMode: 'top3', workshopMode: 'decide' });
}

// ─── NEW v2 HELPERS (modulare SOP-Templates) ─────────
const TIME = { xs: '⏱ 2 Min', s: '⏱ 3 Min', m: '⏱ 5 Min', l: '⏱ 8 Min', br: '⏱ 10 Min Pause' };

function sopOpener(workshopTitle, workshopSubtitle) {
  return [
    tplSlide('content', {
      title: workshopTitle || 'SOP & KI Use Cases',
      body: workshopSubtitle || 'Willkommen zum Workshop.\n\nZiel:\n• KI-Potenziale entlang der SOP identifizieren\n• Top-Use-Cases priorisieren\n• Konkrete Next Steps definieren\n\n📱 Per QR beitreten · Name + Avatar wählen.',
      mentiHero: true,
    }),
    tplSlide('reaction', {
      title: 'Stimmungscheck',
      subtitle: TIME.xs,
      prompt: 'Wie startest du heute? Tipp deine aktuelle Stimmung an.',
    }, { anonymous: true }),
    tplSlide('wordcloud', {
      title: 'Erwartung in einem Wort',
      subtitle: TIME.s,
      prompt: 'Was erhoffst du dir von diesem Workshop?',
    }, { anonymous: true, profanityFilter: true }),
    tplSlide('content', {
      title: 'Wie wir arbeiten',
      body: '1. Pro SOP-Karte sammeln wir KI-Ideen\n2. Wir voten unsere Favoriten\n3. Pro Track: Top-Aggregation\n4. Am Ende: konkrete Action Items\n\n💡 Tipp: Beim Brainstormen kurze, konkrete Use Cases — "Was · Wer · Welches Tool"',
    }),
  ];
}

function sopPhaseTransition(track, phase, phaseIndex, totalPhases) {
  return tplSlide('section', {
    title: phase.name,
    subtitle: `Phase ${phaseIndex + 1}/${totalPhases} · ${track.title.replace(/^Track \d+: /, '')} · ${TIME.m}`,
    body: phase.intro,
    sopKind: 'phase',
    ...sopMeta(track, phase),
  });
}

// Optimized: 2-slide card flow (Brainstorm + Vote), result aggregiert auf Track-Ebene
function sopCardCompact(track, phase, card) {
  return [
    tplSlide('brainstorm', {
      title: card.name,
      body: card.intro,
      subtitle: `${phase.name} · ${TIME.m}`,
      prompt: 'Welche KI Use Cases siehst du hier?\n💡 Was · 👤 Wer · 🛠 Welches Tool?',
      mentiQuestion: true,
      sopKind: 'card-workshop',
      ...sopMeta(track, phase, card),
    }, { showResultsLive: true, workshopMode: 'collect', profanityFilter: true, timer: { seconds: 300, autoClose: false } }),
    tplSlide('mc_multi', {
      title: `Top 2 · ${card.name}`,
      prompt: 'Wähle deine 2 stärksten Use Cases',
      subtitle: `${phase.name} · ${TIME.s}`,
      mentiQuestion: true,
      maxSelections: 2,
      options: [],
      ...sopMeta(track, phase, card),
    }, { showResultsLive: true, sopCardVote: true, sopVoteMax: 2, workshopMode: 'decide', timer: { seconds: 180, autoClose: true } }),
  ];
}

function sopTrackReflection(track, trackIndex) {
  return [
    tplSlide('open', {
      title: 'Track-Highlight',
      subtitle: `${track.title} · ${TIME.s}`,
      prompt: 'In einem Satz: Was war für dich das wichtigste Aha aus diesem Track?',
    }, { anonymous: false, profanityFilter: true }),
    tplSlide('percent_split', {
      title: `Top-Aggregation · Track ${trackIndex + 1}`,
      prompt: 'Verteile 100 Punkte auf die Use Cases, die du wirklich umsetzen würdest.',
      subtitle: `${track.title.replace(/^Track \d+: /, '')} · ${TIME.m}`,
      mentiQuestion: true,
      options: [],
      ...sopMeta(track),
    }, { showResultsLive: true, sopTrackVote: true, sopVoteMode: 'top3', workshopMode: 'decide', timer: { seconds: 300, autoClose: true } }),
  ];
}

const ENERGIZERS = [
  { title: 'Energizer · Standing Wave', body: '1. Aufstehen 🧍\n2. Hände hoch strecken 🙌\n3. Tief einatmen 🌬\n4. Langsam ausatmen\n5. Setzen' },
  { title: 'Energizer · 5-4-3-2-1', body: 'In Gedanken nennen:\n5 Dinge die du siehst\n4 Dinge die du hörst\n3 Dinge die du fühlst\n2 Dinge die du riechst\n1 Ding das du schmeckst' },
  { title: 'Energizer · Power-Pose', body: '30 Sek lang eine Power-Pose deiner Wahl.\n(Wonder-Woman, Sieger-Arme, Yoga-Baum)' },
  { title: 'Energizer · Schüttel-Tanz', body: 'Lieblingssong (30 Sek): rechte Hand, linke Hand, rechtes Bein, linkes Bein, alles.' },
];

function sopEnergizer(index) {
  const e = ENERGIZERS[(index || 0) % ENERGIZERS.length];
  return tplSlide('content', { title: e.title, body: e.body, subtitle: TIME.s });
}

function sopBreak(label = 'Kaffee, Wasser, Fenster auf.') {
  return tplSlide('content', {
    title: '☕ Pause',
    body: `${label}\n\nWir sehen uns in 10 Min.`,
    subtitle: TIME.br,
    mentiHero: true,
  }, { timer: { seconds: 600, autoClose: false } });
}

function sopWorkshopClose() {
  return [
    tplSlide('section', { title: 'Abschluss', subtitle: 'Action Items & Feedback · ⏱ 10 Min' }),
    tplSlide('open', {
      title: 'Mein Take-Away',
      subtitle: TIME.s,
      prompt: 'Welcher Use Case bleibt bei dir hängen? Warum?',
    }, { profanityFilter: true }),
    tplSlide('open', {
      title: 'Action Item für mich',
      subtitle: TIME.s,
      prompt: 'Was werde ich konkret in den nächsten 14 Tagen tun?',
    }, { profanityFilter: true }),
    tplSlide('scale', {
      title: 'Workshop-Bewertung (NPS)',
      subtitle: 'Wie wahrscheinlich würdest du das einem Kollegen empfehlen?',
      prompt: '0 = gar nicht · 10 = absolut',
      min: 0, max: 10,
      minLabel: 'gar nicht',
      maxLabel: 'absolut',
    }, { anonymous: true }),
    tplSlide('open', {
      title: 'Eine Sache, die wir besser machen können',
      subtitle: TIME.s,
      prompt: 'Konstruktives Feedback?',
    }, { anonymous: true, profanityFilter: true }),
    tplSlide('content', {
      title: 'Danke! 🙌',
      body: 'Die Top-Use-Cases übergeben wir an die SOP-Owner.\nDokumentation kommt per Mail.\n\nLet\'s build the future of ROOTS.',
      mentiHero: true,
    }),
  ];
}

// ─── 3 OPTIMIZED VARIANTS ─────────────────────────────

function buildSopQuickScan(trackKey) {
  const track = SOP_TOOL_TRACKS.find((t) => t.class === trackKey) || SOP_TOOL_TRACKS[0];
  const trackIndex = SOP_TOOL_TRACKS.indexOf(track);
  return [
    ...sopOpener(`Quick-Scan: ${track.title}`, `Fokus auf ${track.title}.\n\n45-60 Min · pro Karte ein Brainstorm.\nDanach Track-Aggregation und Action Items.`),
    sopTrackIntro(track, trackIndex),
    ...track.phases.flatMap((phase, phaseIdx) => [
      sopPhaseTransition(track, phase, phaseIdx, track.phases.length),
      ...phase.cards.map((card) => tplSlide('brainstorm', {
        title: card.name,
        body: card.intro,
        subtitle: `${phase.name} · ${TIME.s}`,
        prompt: 'KI Use Cases? 💡 Was · 👤 Wer · 🛠 Tool',
        mentiQuestion: true,
        sopKind: 'card-workshop',
        ...sopMeta(track, phase, card),
      }, { showResultsLive: true, workshopMode: 'collect', profanityFilter: true, timer: { seconds: 180, autoClose: false } })),
    ]),
    sopEnergizer(0),
    ...sopTrackReflection(track, trackIndex),
    ...sopWorkshopClose(),
  ];
}

function buildSopDeepDive(trackKey) {
  const track = SOP_TOOL_TRACKS.find((t) => t.class === trackKey) || SOP_TOOL_TRACKS[0];
  const trackIndex = SOP_TOOL_TRACKS.indexOf(track);
  return [
    ...sopOpener(`Deep-Dive: ${track.title}`, `Tiefe Auseinandersetzung mit ${track.title}.\n\n90-120 Min · Brainstorm + Vote pro Karte.\nTrack-Aggregation & Action Items am Schluss.`),
    sopTrackIntro(track, trackIndex),
    ...track.phases.flatMap((phase, phaseIdx, arr) => {
      const slides = [
        sopPhaseTransition(track, phase, phaseIdx, arr.length),
        ...phase.cards.flatMap((card) => sopCardCompact(track, phase, card)),
      ];
      // Energizer in der Mitte
      if (phaseIdx === Math.floor(arr.length / 2) - 1) slides.push(sopEnergizer(1));
      return slides;
    }),
    sopBreak(),
    ...sopTrackReflection(track, trackIndex),
    ...sopWorkshopClose(),
  ];
}

function buildSopFullDay() {
  let energizerIdx = 0;
  const slides = [...sopOpener('SOP & KI Workshop · Halbtag-Programm', 'Alle 3 Tracks · 3-4 Std · mit Pausen und Energizern.\n\nWir gehen die komplette SOP entlang und sammeln + priorisieren KI-Use-Cases je Phase.')];
  SOP_TOOL_TRACKS.forEach((track, ti) => {
    slides.push(sopTrackIntro(track, ti));
    track.phases.forEach((phase, pi) => {
      slides.push(sopPhaseTransition(track, phase, pi, track.phases.length));
      phase.cards.forEach((card) => slides.push(...sopCardCompact(track, phase, card)));
    });
    slides.push(...sopTrackReflection(track, ti));
    if (ti < SOP_TOOL_TRACKS.length - 1) {
      slides.push(sopBreak());
      slides.push(sopEnergizer(energizerIdx++));
    }
  });
  // Final aggregation across all tracks
  slides.push(tplSlide('section', { title: 'Gesamt-Aggregation', subtitle: 'Top Use Cases aus allen Tracks · ⏱ 10 Min' }));
  slides.push(tplSlide('percent_split', {
    title: 'Top-3 für die nächsten 90 Tage',
    prompt: 'Verteile 100 Punkte auf die Use Cases, die ROOTS als Erstes pilotieren sollte.',
    subtitle: TIME.m,
    mentiQuestion: true,
    options: [],
  }, { showResultsLive: true, workshopMode: 'decide', timer: { seconds: 300, autoClose: true } }));
  slides.push(...sopWorkshopClose());
  return slides;
}

// Backwards-compat (alte Template-Key bleibt aufrufbar):
function buildSopKiWorkshopSlides() {
  return buildSopFullDay();
}

window.SOP_TOOL_TRACKS = SOP_TOOL_TRACKS;

window.LP_TEMPLATES = [
  {
    key: 'roots-sop-quick-pre',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Quick-Scan · Pre-Engagement',
    desc: 'Schneller 45-Min-Sprint: KI-Potenziale entlang Anbahnung, Exploration und Pitch sammeln. Brainstorming pro Karte, Track-Aggregation am Ende.',
    duration: '45–60 Min.',
    group: '5–20',
    tips: 'Ideal für Sales-Team-Kickoff oder Pitch-Coachings. 3 Min Brainstorm pro Karte (Timer eingebaut), danach gemeinsame Priorisierung.',
    slides: buildSopQuickScan('track-pre'),
  },
  {
    key: 'roots-sop-quick-ops',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Quick-Scan · Execution',
    desc: 'Schneller 45-Min-Sprint durch Ramp-up bis Implementierung. Operativstes SOP-Track mit größtem KI-Potenzial im Tagesgeschäft.',
    duration: '45–60 Min.',
    group: '5–20',
    tips: 'Empfohlen für Consulting-Teams und Delivery-Manager. Fokus auf wiederkehrende Aufgaben in Content-Produktion und Analyse.',
    slides: buildSopQuickScan('track-ops'),
  },
  {
    key: 'roots-sop-quick-post',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Quick-Scan · Post-Engagement',
    desc: 'Schneller 45-Min-Sprint durch Closeout und Follow-Up. Welche KI hilft bei Reporting, Retros und Beziehungspflege?',
    duration: '45–60 Min.',
    group: '5–20',
    tips: 'Gut für Account-Manager und Customer-Success. Fokus auf Reporting-Automatisierung und Case-Study-Erstellung.',
    slides: buildSopQuickScan('track-post'),
  },
  {
    key: 'roots-sop-deep-dive-pre',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Deep-Dive · Pre-Engagement',
    desc: 'Vertiefter 90-Min-Workshop zu Pre-Engagement. Pro Karte: Brainstorm + Vote der Top 2. Reflexion und Aggregation am Ende.',
    duration: '90–120 Min.',
    group: '6–25',
    tips: 'Inkl. Energizer in der Mitte und 10-Min-Pause vor der Reflexion. Pro Karte 5 Min Brainstorm, 3 Min Vote.',
    slides: buildSopDeepDive('track-pre'),
  },
  {
    key: 'roots-sop-deep-dive-ops',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Deep-Dive · Execution',
    desc: 'Vertiefter 90-Min-Workshop zur Projektdurchführung. Brainstorm + Vote pro Karte mit Track-Aggregation.',
    duration: '90–120 Min.',
    group: '6–25',
    tips: 'Größter SOP-Track (5 Phasen, 11 Karten). Empfehlung: vorher Pause einplanen.',
    slides: buildSopDeepDive('track-ops'),
  },
  {
    key: 'roots-sop-deep-dive-post',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Deep-Dive · Post-Engagement',
    desc: 'Vertiefter 90-Min-Workshop zu Projektabschluss und Beziehungspflege. Brainstorm + Vote + Aggregation.',
    duration: '60–90 Min.',
    group: '6–25',
    tips: 'Kompakter Track – ideal als 2. Workshop nach Quick-Scan.',
    slides: buildSopDeepDive('track-post'),
  },
  {
    key: 'roots-sop-full-day',
    category: 'ROOTS · SOP & KI',
    name: 'SOP Halbtag-Workshop · Alle 3 Tracks',
    desc: 'Vollumfänglicher Halbtags-Workshop mit allen 3 Tracks. Pausen, Energizer, Track-Übergänge und finale Gesamt-Aggregation der Top-3 Use Cases.',
    duration: '3–4 Std.',
    group: '8–30',
    tips: 'Empfehlung: Vormittag 09:00–13:00 mit zwei 10-Min-Pausen. Vorher Avatare und Names testen lassen. Action Items am Ende DOKUMENTIEREN.',
    slides: buildSopFullDay(),
  },
  {
    key: 'roots-sop-ki-workshop',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Brainstorming · Vollprogramm (legacy)',
    desc: 'Klassisches SOP-Format: pro Karte Brainstorm → Vote → Ergebnis. Alias für "Halbtag-Workshop".',
    duration: '90–150 Min.',
    group: '6–25',
    tips: 'Backwards-compat. Empfehlung: verwende stattdessen "SOP Quick-Scan" oder "SOP Halbtag-Workshop".',
    slides: buildSopKiWorkshopSlides(),
  },
  {
    key: 'workshop-full',
    category: 'Workshop & Moderation',
    name: 'Workshop Komplett (Halbtag)',
    desc: 'Einstieg, Energizer, Inhalte, Priorisierung und Abschluss – ideal für Team-Workshops und Moderation.',
    duration: '90–180 Min.',
    group: '8–40',
    tips: 'Gut für Kick-offs, Strategie-Workshops oder Kundenworkshops. Pausen nach Folie 6 und 12 einplanen.',
    slides: [
      tplSlide('content', { title: 'Willkommen', body: 'Schön, dass ihr dabei seid. Handy stumm, Kamera optional – heute zählt eure Beteiligung.' }),
      tplSlide('section', { title: 'Teil 1 · Ankommen', subtitle: 'Eisbrecher & Erwartungen' }),
      tplSlide('reaction', { title: 'Stimmungscheck', prompt: 'Wie fühlst du dich gerade?' }, { anonymous: true }),
      tplSlide('wordcloud', { title: 'Eisbrecher', prompt: 'Ein Wort, das deine Erwartung an heute beschreibt' }, { anonymous: true }),
      tplSlide('scale', { title: 'Erwartungen', prompt: 'Wie klar sind deine Erwartungen?', min: 1, max: 10, minLabel: 'völlig offen', maxLabel: 'sehr klar' }),
      tplSlide('open', { title: 'Was wäre ein Erfolg?', prompt: 'Was müsste heute passieren, damit sich der Tag gelohnt hat?' }),
      tplSlide('section', { title: 'Teil 2 · Inhalt', subtitle: 'Impulse & Diskussion' }),
      tplSlide('content', { title: 'Agenda', body: '1. Kontext\n2. Herausforderungen\n3. Lösungsansätze\n4. Nächste Schritte' }),
      tplSlide('brainstorm', { title: 'Herausforderungen', prompt: 'Was blockiert uns aktuell am meisten?' }, { moderation: true }),
      tplSlide('mc_multi', {
        title: 'Themen-Cluster',
        prompt: 'Welche Bereiche sind betroffen? (max. 3)',
        options: [{ id: 'a', text: 'Prozesse' }, { id: 'b', text: 'Tools' }, { id: 'c', text: 'Kommunikation' }, { id: 'd', text: 'Ressourcen' }, { id: 'e', text: 'Kunden' }],
        maxSelections: 3,
      }),
      tplSlide('ranking', {
        title: 'Priorisierung',
        prompt: 'Ordne nach Dringlichkeit (1 = am dringendsten)',
        options: [{ id: 'a', text: 'Quick Wins' }, { id: 'b', text: 'Strategische Projekte' }, { id: 'c', text: 'Technische Schulden' }, { id: 'd', text: 'Team-Entwicklung' }],
      }),
      tplSlide('percent_split', {
        title: 'Ressourcen-Budget',
        prompt: 'Verteile 100 Punkte auf Fokusbereiche',
        options: [{ id: 'a', text: 'Delivery' }, { id: 'b', text: 'Innovation' }, { id: 'c', text: 'Operations' }, { id: 'd', text: 'People' }],
      }),
      tplSlide('section', { title: 'Teil 3 · Abschluss', subtitle: 'Commitment & Feedback' }),
      tplSlide('yesno', { title: 'Commitment', prompt: 'Kannst du dich mit dem Ergebnis identifizieren?' }),
      tplSlide('open', { title: 'Nächster Schritt', prompt: 'Was machst du konkret in den nächsten 48 Stunden?' }),
      tplSlide('scale', { title: 'Workshop-Bewertung', prompt: 'Wie zufrieden bist du mit dem Workshop?', min: 1, max: 5, minLabel: 'wenig', maxLabel: 'sehr' }, { anonymous: true }),
      tplSlide('wordcloud', { title: 'Ein Wort zum Abschluss', prompt: 'Ein Wort für heute' }, { anonymous: true }),
    ],
  },
  {
    key: 'weekly-standup-poll',
    category: 'Unternehmens-Meetings',
    name: 'Weekly Stand-up & Pulse',
    desc: 'Schneller Wochenstart: Stimmung, Blocker, Fokus und Team-Prioritäten in 15 Minuten.',
    duration: '15–20 Min.',
    group: '4–15',
    tips: 'Montags im Team-Meeting oder vor dem Daily. Ergebnisse im Confluence/Notion festhalten.',
    slides: [
      tplSlide('content', { title: 'Guten Morgen!', body: 'Kurzer Pulse-Check – dann geht es mit dem Stand-up weiter.' }),
      tplSlide('reaction', { title: 'Wochenstimmung', prompt: 'Wie startest du in die Woche?' }, { anonymous: true }),
      tplSlide('scale', { title: 'Auslastung', prompt: 'Wie hoch ist deine Auslastung diese Woche?', min: 1, max: 10, minLabel: 'Luft', maxLabel: 'voll' }),
      tplSlide('yesno', { title: 'Blocker?', prompt: 'Gibt es etwas, das dich gerade blockiert?' }),
      tplSlide('open', { title: 'Blocker-Details', prompt: 'Was blockiert dich? (kurz)' }, { moderation: true }),
      tplSlide('mc_single', {
        title: 'Top-Fokus',
        prompt: 'Was ist dein #1-Fokus diese Woche?',
        options: [{ id: 'a', text: 'Kundenprojekt' }, { id: 'b', text: 'Internes Tooling' }, { id: 'c', text: 'Wissenstransfer' }, { id: 'd', text: 'Admin/Organisation' }],
      }),
      tplSlide('brainstorm', { title: 'Hilfe gebraucht?', prompt: 'Wo brauchst du Unterstützung vom Team?' }),
      tplSlide('mc_multi', {
        title: 'Team-Themen',
        prompt: 'Welche Themen sollten wir als Team ansprechen? (max. 2)',
        options: [{ id: 'a', text: 'Prozesse' }, { id: 'b', text: 'Qualität' }, { id: 'c', text: 'Kommunikation' }, { id: 'd', text: 'Tools' }],
        maxSelections: 2,
      }),
    ],
  },
  {
    key: 'retro-full',
    category: 'Unternehmens-Meetings',
    name: 'Sprint-Retrospektive',
    desc: 'Klassische Retro mit Start/Stop/Continue, Ranking und konkreten Actions – Scrum-ready.',
    duration: '45–75 Min.',
    group: '4–12',
    tips: 'Timer auf Brainstorming-Folien setzen (3–5 Min.). Action Items danach im Board festhalten.',
    slides: [
      tplSlide('section', { title: 'Retrospektive', subtitle: 'Sprint · Was lief gut, schlecht, was nehmen wir mit?' }),
      tplSlide('scale', { title: 'Sprint-Stimmung', prompt: 'Wie lief der Sprint insgesamt?', min: 1, max: 5, minLabel: 'schwierig', maxLabel: 'super' }, { anonymous: true }),
      tplSlide('brainstorm', { title: '🟢 Gut gelaufen', prompt: 'Was lief gut?' }, { anonymous: true }),
      tplSlide('brainstorm', { title: '🔴 Schlecht gelaufen', prompt: 'Was lief schlecht?' }, { anonymous: true }),
      tplSlide('brainstorm', { title: '🟡 Mitnehmen / Verbessern', prompt: 'Was nehmen wir uns vor?' }),
      tplSlide('wordcloud', { title: 'Ein Wort zum Sprint', prompt: 'Ein Wort, das den Sprint beschreibt' }, { anonymous: true }),
      tplSlide('ranking', {
        title: 'Action-Priorität',
        prompt: 'Welche Verbesserung hat höchste Priorität?',
        options: [{ id: 'a', text: 'Kommunikation' }, { id: 'b', text: 'Planung' }, { id: 'c', text: 'Technik' }, { id: 'd', text: 'Scope' }, { id: 'e', text: 'Testing' }],
      }),
      tplSlide('open', { title: 'Konkrete Action', prompt: 'Was ist der nächste konkrete Schritt?' }),
      tplSlide('yesno', { title: 'Commitment', prompt: 'Fühlst du dich vom Ergebnis abgeholt?' }, { anonymous: true }),
    ],
  },
  {
    key: 'townhall-full',
    category: 'Konferenzen & Events',
    name: 'Town Hall & All-Hands',
    desc: 'Große Runde: Q&A, Stimmungsbild, Prioritäten und Live-Feedback für Führungskräfte.',
    duration: '45–90 Min.',
    group: '20–500',
    tips: 'Q&A-Folie offen lassen während der Präsentation. Moderation für sensible Fragen aktivieren.',
    slides: [
      tplSlide('content', { title: 'Town Hall', body: 'Fragen stellen, abstimmen, Feedback geben – ihr seid live dabei.' }),
      tplSlide('reaction', { title: 'Stimmung', prompt: 'Wie geht es dir heute?' }, { anonymous: true }),
      tplSlide('scale', { title: 'Transparenz', prompt: 'Wie transparent findest du die Kommunikation im Unternehmen?', min: 1, max: 10, minLabel: 'wenig', maxLabel: 'sehr' }, { anonymous: true }),
      tplSlide('qa', { title: 'Fragen an die Führung', prompt: 'Was möchtest du fragen?' }, { anonymous: true, moderation: true }),
      tplSlide('mc_single', {
        title: 'Top-Thema',
        prompt: 'Welches Thema interessiert dich am meisten?',
        options: [{ id: 'a', text: 'Strategie' }, { id: 'b', text: 'Produkt' }, { id: 'c', text: 'Kultur' }, { id: 'd', text: 'Karriere' }],
      }, { anonymous: true }),
      tplSlide('open', { title: 'Was ist unklar?', prompt: 'Was wurde heute noch nicht klar beantwortet?' }, { anonymous: true }),
      tplSlide('yesno', { title: 'Vertrauen', prompt: 'Vertraust du der aktuellen Richtung?' }, { anonymous: true }),
      tplSlide('wordcloud', { title: 'Ein Wort', prompt: 'Ein Wort zum heutigen Town Hall' }, { anonymous: true }),
    ],
  },
  {
    key: 'education-full',
    category: 'Bildung & Unterricht',
    name: 'Training & Lern-Check',
    desc: 'Vorwissen, Quiz, Verständnis-Checks und Reflexion – für Schulungen und interne Enablement-Sessions.',
    duration: '60–90 Min.',
    group: '8–80',
    tips: 'Quiz-Folien mit Zeitlimit (20–30 Sek.) für mehr Spannung. Bestenliste am Ende besprechen.',
    slides: [
      tplSlide('content', { title: 'Training startet', body: 'Handy weg, mitdenken, Fragen stellen – los geht\'s!' }),
      tplSlide('section', { title: 'Block 1', subtitle: 'Vorwissen & Erwartungen' }),
      tplSlide('mc_single', {
        title: 'Vorwissen',
        prompt: 'Wie vertraut bist du mit dem Thema?',
        options: [{ id: 'a', text: 'Neu für mich' }, { id: 'b', text: 'Grundlagen' }, { id: 'c', text: 'Fortgeschritten' }, { id: 'd', text: 'Experte' }],
      }, { anonymous: true }),
      tplSlide('scale', { title: 'Lernmotivation', prompt: 'Wie motiviert bist du heute?', min: 1, max: 10, minLabel: 'niedrig', maxLabel: 'hoch' }, { anonymous: true }),
      tplSlide('section', { title: 'Block 2', subtitle: 'Wissenscheck' }),
      tplSlide('quiz', {
        title: 'Quiz 1',
        prompt: 'Was ist die korrekte Aussage?',
        options: [{ id: 'a', text: 'Antwort A', correct: false }, { id: 'b', text: 'Antwort B', correct: true }, { id: 'c', text: 'Antwort C', correct: false }],
      }, { timeLimitSec: 25 }),
      tplSlide('quiz', {
        title: 'Quiz 2',
        prompt: 'Welche Option trifft zu?',
        options: [{ id: 'a', text: 'Option 1', correct: true }, { id: 'b', text: 'Option 2', correct: false }, { id: 'c', text: 'Option 3', correct: false }],
      }, { timeLimitSec: 25 }),
      tplSlide('yesno', { title: 'Verständnis-Check', prompt: 'War der letzte Block verständlich?' }, { anonymous: true }),
      tplSlide('number_guess', { title: 'Schätzfrage', prompt: 'Schätze die Anzahl (Beispielwert)' }),
      tplSlide('open', { title: 'Offene Frage', prompt: 'Was ist noch unklar?' }),
      tplSlide('section', { title: 'Block 3', subtitle: 'Reflexion' }),
      tplSlide('scale', { title: 'Lernerfolg', prompt: 'Wie sicher fühlst du dich jetzt?', min: 1, max: 5, minLabel: 'unsicher', maxLabel: 'sicher' }, { anonymous: true }),
      tplSlide('brainstorm', { title: 'Takeaways', prompt: 'Was nimmst du mit?' }),
    ],
  },
  {
    key: 'hr-onboarding-full',
    category: 'HR & Team-Building',
    name: 'Onboarding & Team-Integration',
    desc: 'Neue Mitarbeitende kennenlernen, Erwartungen klären und Integrations-Feedback sammeln.',
    duration: '30–45 Min.',
    group: '5–25',
    tips: 'In der ersten Woche oder im Buddy-Meeting nutzen. Namen sind sichtbar – gut für Kennenlernen.',
    slides: [
      tplSlide('content', { title: 'Willkommen im Team!', body: 'Wir freuen uns, dass du dabei bist. Heute lernen wir uns kennen.' }),
      tplSlide('open', { title: 'Vorstellung', prompt: 'Kurz: Wer bist du und was machst du?' }),
      tplSlide('wordcloud', { title: 'Stärken', prompt: 'Ein Wort, das eine deiner Stärken beschreibt' }),
      tplSlide('scale', { title: 'Integration', prompt: 'Wie gut fühlst du dich bisher integriert?', min: 1, max: 10, minLabel: 'noch fremd', maxLabel: 'schon dabei' }, { anonymous: true }),
      tplSlide('mc_multi', {
        title: 'Onboarding-Themen',
        prompt: 'Welche Themen brauchst du noch? (max. 3)',
        options: [{ id: 'a', text: 'Tools & Zugänge' }, { id: 'b', text: 'Prozesse' }, { id: 'c', text: 'Team-Kultur' }, { id: 'd', text: 'Kunden/Projekte' }, { id: 'e', text: 'Benefits' }],
        maxSelections: 3,
      }),
      tplSlide('ranking', {
        title: 'Prioritäten Woche 1',
        prompt: 'Was ist dir in Woche 1 am wichtigsten?',
        options: [{ id: 'a', text: 'Kollegen kennenlernen' }, { id: 'b', text: 'Erstes Projekt' }, { id: 'c', text: 'Systeme verstehen' }, { id: 'd', text: 'Klarheit in Rolle' }],
      }),
      tplSlide('reaction', { title: 'Gefühl', prompt: 'Wie fühlst du dich nach dem ersten Tag?' }),
      tplSlide('open', { title: 'Fragen an HR/Buddy', prompt: 'Was möchtest du noch wissen?' }),
    ],
  },
  {
    key: 'product-discovery',
    category: 'Marktforschung & Produkt',
    name: 'Produkt-Discovery & Priorisierung',
    desc: 'Konzept-Tests, Feature-Priorisierung, Pain Points und Budget-Verteilung für Product Teams.',
    duration: '45–60 Min.',
    group: '5–20',
    tips: 'Ideal vor Roadmap-Planung. Ergebnisse direkt ins Backlog übernehmen.',
    slides: [
      tplSlide('section', { title: 'Product Discovery', subtitle: 'Problem → Lösung → Priorität' }),
      tplSlide('brainstorm', { title: 'Pain Points', prompt: 'Was nervt Nutzer/Kunden am meisten?' }, { moderation: true }),
      tplSlide('wordcloud', { title: 'Jobs-to-be-done', prompt: 'Ein Wort: Was wollen Nutzer wirklich erledigen?' }),
      tplSlide('mc_single', {
        title: 'Zielgruppe',
        prompt: 'Welche Nutzergruppe ist am kritischsten?',
        options: [{ id: 'a', text: 'Neue Nutzer' }, { id: 'b', text: 'Power User' }, { id: 'c', text: 'Admins' }, { id: 'd', text: 'Enterprise' }],
      }),
      tplSlide('percent_split', {
        title: 'Feature-Budget 100',
        prompt: 'Verteile 100 Punkte auf Features',
        options: [{ id: 'a', text: 'Performance' }, { id: 'b', text: 'UX/Design' }, { id: 'c', text: 'Integrationen' }, { id: 'd', text: 'Analytics' }, { id: 'e', text: 'Mobile' }],
      }),
      tplSlide('ranking', {
        title: 'Roadmap-Ranking',
        prompt: 'Ordne Features nach Business Value',
        options: [{ id: 'a', text: 'Feature A' }, { id: 'b', text: 'Feature B' }, { id: 'c', text: 'Feature C' }, { id: 'd', text: 'Feature D' }],
      }),
      tplSlide('scale', { title: 'Problem-Schwere', prompt: 'Wie schmerzhaft ist das Top-Problem?', min: 1, max: 10, minLabel: 'nice-to-have', maxLabel: 'kritisch' }),
      tplSlide('yesno', { title: 'Go / No-Go', prompt: 'Sollen wir das Top-Feature als Nächstes bauen?' }),
      tplSlide('number_guess', { title: 'Markt-Schätzung', prompt: 'Wie viele betroffene Nutzer schätzt du? (Zahl)' }),
      tplSlide('open', { title: 'Risiken', prompt: 'Was könnte schiefgehen?' }),
    ],
  },
  {
    key: 'client-workshop',
    category: 'Workshop & Moderation',
    name: 'Kunden-Workshop',
    desc: 'Status, Ziele, Feedback und nächste Schritte – strukturiert für Kundenmeetings und Reviews.',
    duration: '60–90 Min.',
    group: '3–15',
    tips: 'Kundennamen in Folien anpassen. Q&A am Ende offen lassen für offene Diskussion.',
    slides: [
      tplSlide('content', { title: 'Projekt-Review', body: 'Agenda: Status · Feedback · Entscheidungen · Next Steps' }),
      tplSlide('scale', { title: 'Zufriedenheit', prompt: 'Wie zufrieden seid ihr mit dem aktuellen Stand?', min: 1, max: 10, minLabel: 'unzufrieden', maxLabel: 'sehr zufrieden' }),
      tplSlide('mc_single', {
        title: 'Größter Hebel',
        prompt: 'Was bringt am meisten Fortschritt?',
        options: [{ id: 'a', text: 'Scope anpassen' }, { id: 'b', text: 'Mehr Ressourcen' }, { id: 'c', text: 'Bessere Abstimmung' }, { id: 'd', text: 'Technische Lösung' }],
      }),
      tplSlide('brainstorm', { title: 'Feedback', prompt: 'Was läuft gut, was nicht?' }, { moderation: true }),
      tplSlide('ranking', {
        title: 'Prioritäten Q2',
        prompt: 'Ordne Themen nach Dringlichkeit',
        options: [{ id: 'a', text: 'Feature X' }, { id: 'b', text: 'Bugfixes' }, { id: 'c', text: 'Reporting' }, { id: 'd', text: 'Integration' }],
      }),
      tplSlide('percent_split', {
        title: 'Budget-Verteilung',
        prompt: 'Verteile 100 Punkte auf Bereiche',
        options: [{ id: 'a', text: 'Neue Features' }, { id: 'b', text: 'Stabilität' }, { id: 'c', text: 'Support' }],
      }),
      tplSlide('qa', { title: 'Offene Fragen', prompt: 'Was möchtet ihr klären?' }),
      tplSlide('open', { title: 'Next Steps', prompt: 'Was ist der nächste konkrete Schritt?' }),
      tplSlide('yesno', { title: 'Alignment', prompt: 'Sind wir aligned für die nächste Phase?' }),
    ],
  },
  {
    key: 'academic-full',
    category: 'Akademisch & Forschung',
    name: 'Seminar & Vorlesung',
    desc: 'Verständnis-Checks, Diskussion, Schätzfragen und Abschluss-Reflexion für Lehre und Forschung.',
    duration: '45–90 Min.',
    group: '10–120',
    tips: 'Quiz-Folien für Prüfungsvorbereitung. Anonyme Folien für ehrliches Feedback.',
    slides: [
      tplSlide('section', { title: 'Seminar', subtitle: 'Einheit · Thema & Diskussion' }),
      tplSlide('mc_single', {
        title: 'Vorwissen',
        prompt: 'Wie gut kennst du das Thema?',
        options: [{ id: 'a', text: 'Erstes Mal' }, { id: 'b', text: 'Gehört' }, { id: 'c', text: 'Grundlagen' }, { id: 'd', text: 'Vertieft' }],
      }, { anonymous: true }),
      tplSlide('number_guess', { title: 'Schätzfrage', prompt: 'Schätze den Wert (Zahl aus dem Vortrag)' }),
      tplSlide('quiz', {
        title: 'Verständnis-Quiz',
        prompt: 'Welche Aussage ist korrekt?',
        options: [{ id: 'a', text: 'These A', correct: false }, { id: 'b', text: 'These B', correct: true }, { id: 'c', text: 'These C', correct: false }],
      }, { timeLimitSec: 30, anonymous: true }),
      tplSlide('yesno', { title: 'Klar?', prompt: 'Ist der Kernpunkt klar?' }, { anonymous: true }),
      tplSlide('open', { title: 'Diskussion', prompt: 'Welche Frage bleibt offen?' }),
      tplSlide('brainstorm', { title: 'Argumente', prompt: 'Pro & Contra – ein Argument' }),
      tplSlide('wordcloud', { title: 'Kernbegriff', prompt: 'Ein zentraler Begriff der Einheit' }, { anonymous: true }),
      tplSlide('scale', { title: 'Tempo', prompt: 'War das Tempo passend?', min: 1, max: 5, minLabel: 'zu langsam', maxLabel: 'zu schnell' }, { anonymous: true }),
      tplSlide('open', { title: 'Feedback', prompt: 'Was sollten wir nächstes Mal anders machen?' }, { anonymous: true }),
    ],
  },
  {
    key: 'project-kickoff',
    category: 'Unternehmens-Meetings',
    name: 'Projekt-Kickoff',
    desc: 'Team-Start: Rollen, Risiken, Erwartungen und Commitment für neue Projekte.',
    duration: '45–60 Min.',
    group: '5–20',
    tips: 'Nach dem Kickoff Action Items im Projektplan festhalten. Pin-Folie optional mit Architektur-Bild.',
    slides: [
      tplSlide('content', { title: 'Projekt-Kickoff', body: 'Ziele · Team · Timeline · Erfolgskriterien' }),
      tplSlide('open', { title: 'Erwartung', prompt: 'Was erwartest du von diesem Projekt?' }),
      tplSlide('brainstorm', { title: 'Risiken', prompt: 'Was könnte das Projekt gefährden?' }, { moderation: true }),
      tplSlide('mc_multi', {
        title: 'Erfolgsfaktoren',
        prompt: 'Was brauchen wir für Erfolg? (max. 3)',
        options: [{ id: 'a', text: 'Klare Scope' }, { id: 'b', text: 'Stakeholder-Buy-in' }, { id: 'c', text: 'Technik' }, { id: 'd', text: 'Kapazität' }, { id: 'e', text: 'Kommunikation' }],
        maxSelections: 3,
      }),
      tplSlide('ranking', {
        title: 'Meilensteine',
        prompt: 'Ordne Meilensteine nach Wichtigkeit',
        options: [{ id: 'a', text: 'MVP' }, { id: 'b', text: 'Pilot' }, { id: 'c', text: 'Rollout' }, { id: 'd', text: 'Optimierung' }],
      }),
      tplSlide('scale', { title: 'Confidence', prompt: 'Wie confident bist du für den Erfolg?', min: 1, max: 10, minLabel: 'skeptisch', maxLabel: 'sehr confident' }),
      tplSlide('pin_image', { title: 'Architektur / Scope', prompt: 'Markiere kritische Bereiche auf dem Bild', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }),
      tplSlide('yesno', { title: 'Commitment', prompt: 'Bist du committed für die nächsten 4 Wochen?' }),
      tplSlide('open', { title: 'Erste Action', prompt: 'Dein erster konkreter Schritt?' }),
    ],
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
