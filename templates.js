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

const SOP_KI_TRACKS = [
  {
    name: 'Pre-Engagement',
    subtitle: 'Anbahnung · Exploration · Pitch',
    phases: [
      { name: 'Anbahnung', desc: 'ROOTS Vorstellung, Zielstellung klären, initiale Analyse.\nSchritte: Erstkontakt, Zieldefinition, Ist-/Marktanalyse.' },
      { name: 'Exploration', desc: 'Bedarfsanalyse & Problem Framing, Onboarding-Skizze, Website-Analyse, initiale Spezifikationen.' },
      { name: 'Pitch', desc: 'Angebotsgestaltung & Präsentation, Pitch Benchmarking, Onboarding Admin & Vertrag.' },
    ],
  },
  {
    name: 'Execution',
    subtitle: 'Ramp-up · Analyse · Synthese · Delivery · Implementierung',
    phases: [
      { name: 'Ramp-up', desc: 'Projektstruktur aufbauen, Briefing & Content-Plan.' },
      { name: 'Analyse', desc: 'Performance-Analyse, Zielgruppen-Insights.' },
      { name: 'Synthese', desc: 'Erkenntnisse bündeln, Strategie-Update.' },
      { name: 'Delivery', desc: 'Content-Produktion, Ausspielung & Community Management.' },
      { name: 'Implementierung', desc: 'Kampagnen-Setup, Tool-Integration & Automatisierung.' },
    ],
  },
  {
    name: 'Post-Engagement',
    subtitle: 'Closeout · Follow-Up',
    phases: [
      { name: 'Closeout', desc: 'Finales Reporting & Übergabe, interne Retro & Learnings, Kundenfeedback einholen.' },
      { name: 'Follow-Up', desc: 'Beziehungspflege & Check-ins, Upsell & Folgeauftrag, Case Study & Referenz.' },
    ],
  },
];

function sopKiPhaseSlides(trackName, phase) {
  return [
    tplSlide('section', { title: phase.name, subtitle: `${trackName} · SOP-Unterphase` }),
    tplSlide('content', {
      title: phase.name,
      body: `${phase.desc}\n\nAls Nächstes sammeln wir KI Use Cases für diese Unterphase.`,
    }),
    tplSlide('brainstorm', {
      title: `KI Use Cases · ${phase.name}`,
      prompt: `Welche konkreten KI Use Cases siehst du in „${phase.name}“ (${trackName})?\nFreitext: Was? Wer? Welches Tool oder welcher Prozess?`,
    }, { showResultsLive: true, moderation: true }),
    tplSlide('content', {
      title: `Ergebnisse · ${phase.name}`,
      body: 'Die gesammelten KI Use Cases werden live angezeigt.\n\nModerator:in clustert die Ideen – dann weiter zur Abstimmung.',
    }, { showPreviousSlideResults: true }),
    tplSlide('ranking', {
      title: `Priorisierung · ${phase.name}`,
      prompt: `Priorisiere KI-Hebel für „${phase.name}“ (1 = höchste Priorität)`,
      options: [
        { id: 'a', text: 'Zeitersparnis / Effizienz' },
        { id: 'b', text: 'Qualität & Output' },
        { id: 'c', text: 'Quick Win (< 4 Wochen)' },
        { id: 'd', text: 'Strategischer Impact' },
        { id: 'e', text: 'Skalierbarkeit im Team' },
      ],
    }, { showResultsLive: true }),
  ];
}

function sopKiTrackSlides(track) {
  const phaseSlides = track.phases.flatMap((phase) => sopKiPhaseSlides(track.name, phase));
  const trackRankOptions = track.phases.map((phase, i) => ({
    id: String.fromCharCode(97 + i),
    text: `${phase.name} – Top Use Case (vom Team benennen)`,
  }));
  return [
    tplSlide('section', { title: track.name, subtitle: track.subtitle }),
    tplSlide('content', {
      title: `SOP-Track · ${track.name}`,
      body: `Unterphasen:\n${track.phases.map((p) => `• ${p.name}`).join('\n')}\n\nPro Unterphase: Brainstorming → Ergebnisse → Priorisierung.`,
    }),
    ...phaseSlides,
    tplSlide('section', { title: `Track-Übersicht · ${track.name}`, subtitle: 'Zusammenfassung & Top Use Cases' }),
    tplSlide('content', {
      title: `${track.name} · Zusammenfassung`,
      body: `Abgeschlossene Unterphasen: ${track.phases.map((p) => p.name).join(' · ')}\n\nTop Use Cases festhalten und in SOP-Karten überführen.`,
    }),
    tplSlide('ranking', {
      title: `Top Use Cases · ${track.name}`,
      prompt: `Welche KI Use Cases aus ${track.name} setzen wir zuerst um? (1 = höchste Priorität)`,
      options: trackRankOptions,
    }, { showResultsLive: true }),
    tplSlide('open', {
      title: `Track-Fazit · ${track.name}`,
      prompt: `Was ist der wichtigste KI Use Case aus ${track.name} – und wer ist Owner?`,
    }),
  ];
}

function buildSopKiWorkshopSlides() {
  return [
    tplSlide('content', {
      title: 'ROOTS · SOP & KI Use-Case Workshop',
      body: 'Wir gehen jeden SOP-Track und jede Unterphase durch:\n\n1. KI Use Cases sammeln (Brainstorming)\n2. Ergebnisse anzeigen & besprechen\n3. Priorisieren\n\nScannt den QR-Code, Name + Avatar wählen.',
    }),
    tplSlide('section', { title: 'Ankommen', subtitle: 'Kontext · AI for Impact · Erwartungen' }),
    tplSlide('reaction', { title: 'Stimmung', prompt: 'Wie neugierig bist du auf KI in unserer SOP-Arbeit?' }, { anonymous: true }),
    tplSlide('content', {
      title: 'ROOTS AI for Impact',
      body: 'Vier Dimensionen:\n• Strategy – Wachstum & Wettbewerb\n• Process – Marketing Operations & Automatisierung\n• People – Skills, Coaching, Change\n• Ethics & Compliance – Datenschutz, Transparenz',
    }),
    tplSlide('wordcloud', { title: 'Erwartung', prompt: 'Ein Wort: Was soll heute rauskommen?' }, { anonymous: true }),
    ...SOP_KI_TRACKS.flatMap(sopKiTrackSlides),
    tplSlide('section', { title: 'Gesamtübersicht', subtitle: 'Alle Tracks · Finale Priorisierung' }),
    tplSlide('content', {
      title: 'Workshop · Gesamtübersicht',
      body: `Tracks durchlaufen:\n${SOP_KI_TRACKS.map((t) => `• ${t.name}: ${t.phases.map((p) => p.name).join(', ')}`).join('\n')}\n\nJetzt: finale Abstimmung über alle Tracks.`,
    }),
    tplSlide('ranking', {
      title: 'Finale Priorisierungsliste',
      prompt: 'Top KI Use Cases über alle SOP-Tracks (1 = zuerst umsetzen)',
      options: [
        { id: 'a', text: 'Pre-Engagement – Top Use Case' },
        { id: 'b', text: 'Execution – Top Use Case' },
        { id: 'c', text: 'Post-Engagement – Top Use Case' },
        { id: 'd', text: 'Cross-Track Quick Win' },
        { id: 'e', text: 'Enablement / Team-Skill' },
      ],
    }, { showResultsLive: true }),
    tplSlide('percent_split', {
      title: 'Impact-Budget 100',
      prompt: 'Verteilt 100 Punkte auf die finale Top-5 Liste',
      options: [
        { id: 'a', text: 'Use Case #1' },
        { id: 'b', text: 'Use Case #2' },
        { id: 'c', text: 'Use Case #3' },
        { id: 'd', text: 'Use Case #4' },
        { id: 'e', text: 'Use Case #5' },
      ],
    }, { showResultsLive: true }),
    tplSlide('yesno', { title: 'Datenschutz', prompt: 'Sind die Top Use Cases mit unseren KI-Richtlinien vereinbar?' }),
    tplSlide('open', { title: 'Dein Next Step', prompt: 'Was machst du in den nächsten 48 Stunden konkret?' }),
    tplSlide('scale', {
      title: 'Workshop-Nutzen',
      prompt: 'Wie hilfreich war der Workshop?',
      min: 1, max: 5, minLabel: 'wenig', maxLabel: 'sehr',
    }, { anonymous: true }),
    tplSlide('content', {
      title: 'Danke!',
      body: 'Ergebnisse werden im SOP-Dashboard festgehalten.\n\nNächster Schritt: Top Use Cases → SOP-Karten → Pilot → Retro.',
    }),
  ];
}

window.LP_TEMPLATES = [
  {
    key: 'roots-sop-ki-workshop',
    category: 'ROOTS · SOP & KI',
    name: 'SOP-Brainstorming & KI Use Cases',
    desc: 'Jeder SOP-Track und jede Unterphase: KI Use Cases sammeln, Ergebnisse zeigen, priorisieren – mit Track- und Gesamtübersicht.',
    duration: '120–180 Min.',
    group: '6–25',
    tips: 'Pro Unterphase: Brainstorming → Ergebnisse-Folie (zeigt Antworten der Vorfolie) → Ranking. Track- und Gesamtübersicht am Ende. Ergebnisse in SOP-Karten überführen.',
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
  { type: 'brainstorm', label: 'Brainstorming', icon: 'fa-lightbulb', desc: 'Karten sammeln' },
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
