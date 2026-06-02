/* ROOTS Live Poll – Hauptanwendung */
const SUPABASE_URL = 'https://csmguwcvzreefluhahyu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWd1d2N2enJlZWZsdWhhaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjM0ODcsImV4cCI6MjA5MjUzOTQ4N30.Fiafx7XBaQZXUX3bKQIBH7znBHx3B51yL-bftOHsL4Q';
const APP_VERSION = '20260520-resultsfx';
const JOIN_BASE = `${location.origin}${location.pathname}`;
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, storage: window.localStorage },
});
window.__rootsSupabaseClient = sb;

const PROFANITY = ['arsch', 'scheiße', 'scheisse', 'fuck', 'shit', 'damn', 'idiot', 'hurensohn'];
const OPTION_TYPES = new Set(['mc_single', 'mc_multi', 'quiz', 'ranking', 'percent_split']);
const LP_AVATAR_EMOJIS = () => window.LP_AVATAR_EMOJIS || ['🦊', '🐼', '🦁', '🦄', '🐸', '🐙', '🌟', '🔥'];
const LP_AVATAR_COLORS = () => window.LP_AVATAR_COLORS || ['#206efb', '#10b981', '#f59e0b', '#dc2626', '#a855f7'];

try {
  if (window.self !== window.top) document.documentElement.classList.add('in-iframe');
} catch {
  document.documentElement.classList.add('in-iframe');
}
if (document.documentElement.classList.contains('in-iframe') && window.RootsUserBridge?.syncAuthFromParentStorage) {
  void window.RootsUserBridge.syncAuthFromParentStorage();
}

const State = {
  user: null,
  profile: null,
  authMode: 'signin',
  dashFilter: 'all',
  search: '',
  presentations: [],
  presentation: null,
  slides: [],
  selectedSlideId: null,
  session: null,
  sessionChannel: null,
  responses: [],
  participants: [],
  participant: null,
  deviceId: localStorage.getItem('lp_device_id') || crypto.randomUUID(),
  pendingQueue: JSON.parse(localStorage.getItem('lp_pending_queue') || '[]'),
  dragSlideId: null,
  answeredSlides: new Set(),
  presentToolbarBound: false,
  presentMouseHandler: null,
  questionTimer: null,
  quizScores: {},
  joinProfile: { name: '', emoji: '🦊', color: '#206efb' },
  activityItems: [],
  addSlideModalBound: false,
  addSlideFocusType: null,
  resultsDisplayMode: 'percent',
  confettiSlideId: null,
  participantPoll: null,
  sopFocusMode: false,
  showPresentPanels: false,
  participantVoteExpert: false,
  bubbleSeenIds: {},
  participantResponsesKey: null,
  participantResponsesAt: 0,
};

localStorage.setItem('lp_device_id', State.deviceId);

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const uid = () => crypto.randomUUID();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isInteractive = (t) => window.LP_INTERACTIVE_TYPES?.has(t);
const defaultStyle = () => ({ ...(window.LP_DEFAULT_STYLE || {}) });

function toast(msg, type = 'info') {
  const c = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warn' ? 'warn' : ''}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function showScreen(name) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(`#screen-${name}`);
  if (el) el.classList.add('active');
}

function isJoinRoute() {
  const hash = location.hash.toLowerCase();
  if (hash.startsWith('#join')) return true;
  return Boolean(new URLSearchParams(location.search).get('join'));
}

function buildJoinUrl(code) {
  const safe = String(code || '').trim().toUpperCase();
  return `${JOIN_BASE}?join=${encodeURIComponent(safe)}&v=${APP_VERSION}#join/${safe}`;
}

function parseJoinCodeFromHash() {
  const fromQuery = new URLSearchParams(location.search).get('join');
  if (fromQuery) return fromQuery.trim().toUpperCase();
  const raw = location.hash.replace(/^#join\/?/i, '');
  return raw.split(/[/?#&]/)[0]?.trim().toUpperCase() || '';
}

function enterParticipantJoin() {
  document.documentElement.classList.add('lp-join-route');
  showScreen('participant');
  renderParticipantEntry(parseJoinCodeFromHash());
}

function showLoginAlert(msg) {
  const el = $('#login-alert');
  el.textContent = msg;
  el.classList.add('visible');
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function filterProfanity(text, enabled) {
  // Prefer the comprehensive filter from lp-core.js (DE+EN list, partial-word match)
  if (typeof window.LP_filterProfanity === 'function') return window.LP_filterProfanity(text, enabled);
  if (!enabled || !text) return text;
  let out = text;
  PROFANITY.forEach((w) => { out = out.replace(new RegExp(w, 'gi'), '***'); });
  return out;
}

function participantAvatarHtml(p, size = 'md') {
  const emoji = p?.avatar_emoji || '👤';
  const color = p?.avatar_color || '#206efb';
  const name = p?.display_name || 'Gast';
  return `<span class="p-avatar p-avatar-${size}" style="background:${esc(color)}" title="${esc(name)}" aria-label="${esc(name)}">${emoji}</span>`;
}

function participantChipHtml(p) {
  return `<div class="present-participant-chip">${participantAvatarHtml(p, 'sm')}<span>${esc(p.display_name || 'Gast')}</span></div>`;
}

function sopTrackTheme(trackClass) {
  const themes = {
    'track-pre': { accent: '#206efb', badgeBg: '#dbe7ff', badgeColor: '#165fd9', soft: '#eff6ff' },
    'track-ops': { accent: '#0f6b57', badgeBg: '#d0f4ee', badgeColor: '#0f6b57', soft: '#ecfdf5' },
    'track-post': { accent: '#5b21b6', badgeBg: '#ede9fe', badgeColor: '#5b21b6', soft: '#f5f3ff' },
  };
  return themes[trackClass] || themes['track-pre'];
}

function renderSopQuestionBadge(c) {
  if (!c.sopPhaseName && !c.sopCardName) return '';
  const theme = sopTrackTheme(c.sopTrackClass);
  const parts = [c.sopTrackLabel, c.sopPhaseName, c.sopCardName].filter(Boolean);
  return `<div class="sop-menti-q-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(parts.join(' · '))}</div>`;
}

function getTrackBrainstormSlides(trackKey) {
  if (!trackKey || !State.slides?.length) return [];
  const byKey = State.slides.filter((s) => s.slide_type === 'brainstorm' && s.content?.sopTrackKey === trackKey);
  if (byKey.length) return byKey;
  return State.slides.filter((s) => s.slide_type === 'brainstorm' && s.content?.sopTrackClass === trackKey);
}

function stableUseCaseOptionId(text, index) {
  const base = String(text).toLowerCase().trim()
    .replace(/[^a-z0-9äöüß]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return base ? `uc-${base}` : `uc-${index}`;
}

function aggregateTrackUseCases(trackKey) {
  const slides = getTrackBrainstormSlides(trackKey);
  const byCard = [];
  const allItems = [];
  slides.forEach((slide) => {
    const items = (State.responses || [])
      .filter((r) => r.slide_id === slide.id && !r.is_hidden)
      .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim() }))
      .filter((item) => item.text);
    byCard.push({
      phase: slide.content?.sopPhaseName || '',
      card: slide.content?.sopCardName || slide.content?.title || 'Karte',
      items,
    });
    items.forEach((item) => allItems.push({
      ...item,
      phase: slide.content?.sopPhaseName || '',
      card: slide.content?.sopCardName || '',
    }));
  });
  const seen = new Set();
  const unique = allItems.filter((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { byCard, allItems, unique };
}

function aggregateAllTracksUseCases() {
  // Sammelt Use Cases aller Brainstorm-Slides mit SOP-Track-Info, gruppiert
  // nach Track -> Phase. Wird für Cross-Track-Summary und Final-Vote benutzt.
  const slides = (State.slides || []).filter((s) =>
    s.slide_type === 'brainstorm' && (s.content?.sopTrackClass || s.content?.sopTrackKey)
  );
  const trackOrder = []; // preserve order of first appearance
  const byTrackKey = new Map();
  const allItems = [];
  slides.forEach((slide) => {
    const c = slide.content || {};
    const trackKey = c.sopTrackClass || c.sopTrackKey;
    const trackLabel = c.sopTrackLabel || trackKey;
    const phaseName = c.sopPhaseName || c.title || '';
    if (!byTrackKey.has(trackKey)) {
      byTrackKey.set(trackKey, { trackKey, trackLabel, phases: [] });
      trackOrder.push(trackKey);
    }
    const items = (State.responses || [])
      .filter((r) => r.slide_id === slide.id && !r.is_hidden)
      .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim() }))
      .filter((item) => item.text);
    byTrackKey.get(trackKey).phases.push({ phase: phaseName, items, slideId: slide.id });
    items.forEach((item) => allItems.push({
      ...item, trackKey, trackLabel, phase: phaseName,
    }));
  });
  const byTrack = trackOrder.map((k) => byTrackKey.get(k));
  const seen = new Set();
  const unique = allItems.filter((item) => {
    const k = item.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { byTrack, allItems, unique };
}

function renderAllTracksResultsHtml() {
  const topByTrack = aggregateTopTrackVotedUseCases();
  if (topByTrack.length) {
    return `<div class="sop-all-tracks-results sop-all-tracks-results--top3">${topByTrack.map((trk) => {
      const theme = sopTrackTheme(trk.trackKey);
      return `<div class="sop-all-track-group ${esc(trk.trackKey || '')}" style="--track-accent:${theme.accent};--track-soft:${theme.soft}">
        <div class="sop-all-track-head" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(trk.trackLabel || '')} · Top 3</div>
        <div class="sop-all-track-phase">
          <div class="sop-all-track-phase-head">Priorisiert im Track-Voting</div>
          <div class="sop-all-track-phase-items">${trk.items.map((it, idx) =>
            `<div class="sop-all-track-item"><strong>#${idx + 1}</strong> ${esc(it.text)}<small>${esc(it.phase || '')}${it.votes ? ` · ${it.votes}× gewählt` : ''}</small></div>`
          ).join('')}</div>
        </div>
      </div>`;
    }).join('')}
    <div class="sop-all-track-total">${topByTrack.reduce((sum, trk) => sum + trk.items.length, 0)} priorisierte Use Cases · bereit für Impact/Effort</div>
  </div>`;
  }

  const { byTrack, allItems } = aggregateAllTracksUseCases();
  if (!allItems.length) {
    return '<div class="present-wait-msg">Noch keine Use Cases gesammelt. Bitte zuerst die Phase-Brainstormings durchgehen.</div>';
  }
  return `<div class="sop-all-tracks-results">${byTrack.map((trk) => {
    const theme = sopTrackTheme(trk.trackKey);
    const phasesHtml = trk.phases.filter((p) => p.items.length).map((p) => `
      <div class="sop-all-track-phase">
        <div class="sop-all-track-phase-head">${esc(p.phase)}</div>
        <div class="sop-all-track-phase-items">${p.items.map((it) =>
          `<div class="sop-all-track-item">${esc(it.text)}</div>`
        ).join('')}</div>
      </div>`).join('');
    if (!phasesHtml) return '';
    return `<div class="sop-all-track-group ${esc(trk.trackKey || '')}" style="--track-accent:${theme.accent};--track-soft:${theme.soft}">
      <div class="sop-all-track-head" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(trk.trackLabel || '')}</div>
      ${phasesHtml}
    </div>`;
  }).join('')}
  <div class="sop-all-track-total">${allItems.length} Use Cases gesammelt · über alle Tracks</div>
</div>`;
}

function aggregateTopTrackVotedUseCases() {
  const voteSlides = (State.slides || []).filter((s) => s.settings?.sopTrackVote);
  const byTrack = [];
  voteSlides.forEach((voteSlide) => {
    const key = voteSlide.content?.sopTrackKey || voteSlide.content?.sopTrackClass;
    if (!key) return;
    const { allItems } = aggregateTrackUseCases(key);
    const itemByVoteId = {};
    allItems.forEach((item) => { itemByVoteId[`resp-${item.id}`] = item; });
    const totals = {};
    const votes = {};
    (State.responses || [])
      .filter((r) => r.slide_id === voteSlide.id && !r.is_hidden)
      .forEach((r) => {
        (r.response?.values || []).forEach((id) => {
          votes[id] = (votes[id] || 0) + 1;
          totals[id] = (totals[id] || 0) + 10;
        });
        Object.entries(r.response?.points || {}).forEach(([id, val]) => {
          totals[id] = (totals[id] || 0) + Number(val || 0);
        });
      });
    const items = Object.entries(totals)
      .map(([id, score]) => ({ ...itemByVoteId[id], voteId: id, score, votes: votes[id] || 0 }))
      .filter((item) => item?.text && item.score > 0)
      .sort((a, b) => b.score - a.score || b.votes - a.votes)
      .slice(0, 3);
    if (items.length) {
      byTrack.push({
        trackKey: key,
        trackLabel: voteSlide.content?.sopTrackLabel || key,
        items,
      });
    }
  });
  return byTrack;
}

function aggregateCardUseCases(trackKey, phaseName, cardName) {
  const slide = State.slides.find((s) => {
    const c = s.content || {};
    const trackMatch = c.sopTrackKey === trackKey || c.sopTrackClass === trackKey;
    return trackMatch && s.slide_type === 'brainstorm' && c.sopPhaseName === phaseName && c.sopCardName === cardName;
  });
  if (!slide) return { items: [], slide: null };
  const items = (State.responses || [])
    .filter((r) => r.slide_id === slide.id && !r.is_hidden)
    .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim() }))
    .filter((item) => item.text);
  return { items, slide };
}

function getVoteSlideScope(slide) {
  if (!slide) return null;
  const c = slide.content || {};
  const st = slide.settings || {};
  if (st.brainstormVote && c.brainstormSourceId) {
    return {
      kind: 'brainstorm',
      sourceId: c.brainstormSourceId,
      maxSelections: st.brainstormVoteMax || c.maxSelections || 2,
    };
  }
  const key = c.sopTrackKey || c.sopTrackClass;
  if (st.sopCardVote && key && c.sopCardName) {
    return { kind: 'card', key, phaseName: c.sopPhaseName, cardName: c.sopCardName, maxSelections: st.sopVoteMax || 2 };
  }
  if (st.sopTrackVote && key) {
    return { kind: 'track', key, maxSelections: 3 };
  }
  if (st.sopAllTracksVote) {
    return { kind: 'all-tracks', key: null, maxSelections: 5 };
  }
  return null;
}

function isSopVoteSlide(slide) {
  return Boolean(getVoteSlideScope(slide));
}

function isSopCardResultsSlide(slide) {
  return Boolean(slide?.settings?.sopCardResults);
}

function isBrainstormResultsSlide(slide) {
  return Boolean(slide?.settings?.brainstormResults && slide?.content?.brainstormSourceId);
}

function isBrainstormVoteSlide(slide) {
  return Boolean(slide?.settings?.brainstormVote && slide?.content?.brainstormSourceId);
}

function isCardResultsSlide(slide) {
  return isSopCardResultsSlide(slide) || isBrainstormResultsSlide(slide);
}

function aggregateBrainstormItems(sourceSlideId) {
  const items = (State.responses || [])
    .filter((r) => r.slide_id === sourceSlideId && !r.is_hidden)
    .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim() }))
    .filter((item) => item.text);
  return { items };
}

function findBrainstormVoteSlide(sourceId) {
  return State.slides.find((s) => s.settings?.brainstormVote && s.content?.brainstormSourceId === sourceId);
}

function findBrainstormResultsSlide(sourceId) {
  return State.slides.find((s) => s.settings?.brainstormResults && s.content?.brainstormSourceId === sourceId);
}

function hasBrainstormChain(slide) {
  if (!slide || slide.slide_type !== 'brainstorm') return false;
  return Boolean(slide.settings?.brainstormAttachRanking || findBrainstormVoteSlide(slide.id));
}

const COLLECT_CHAIN_TYPES = new Set(['brainstorm', 'open', 'wordcloud']);
const DIRECT_RESULTS_CHAIN_TYPES = new Set(['mc_single', 'mc_multi', 'yesno', 'scale', 'ranking', 'quiz', 'percent_split', 'reaction', 'number_guess', 'qa']);
const SCORABLE_INTERACTIVE_TYPES = new Set(['mc_single', 'mc_multi', 'yesno', 'wordcloud', 'open', 'brainstorm', 'scale', 'ranking', 'quiz', 'reaction', 'number_guess', 'percent_split', 'qa']);

function isSystemLinkedSlide(slide) {
  return Boolean(
    slide?.settings?.brainstormLinked
    || slide?.settings?.slideResultsLinked
    || slide?.settings?.presentationResults
    || slide?.settings?.presentationClosing
  );
}

function getPresentationSettings() {
  return {
    attachPresentationResults: false,
    attachPresentationClosing: false,
    resultsDisplayMode: 'percent',
    resultsConfetti: true,
    closingTitle: 'Danke für eure Teilnahme!',
    closingBody: 'Fragen, Feedback oder Applaus willkommen.',
    ...(State.presentation?.settings || {}),
  };
}

const ADD_CLOSURE_CARDS = [
  { type: 'presentation_results', icon: 'fa-chart-column', label: 'Session-Ergebnis', desc: 'Alle interaktiven Folien in einer Übersicht am Ende.' },
  { type: 'presentation_closing', icon: 'fa-heart', label: 'Abschlussfolie', desc: 'Zentrierte Danke-Folie als stilvoller Abschluss.' },
];

function getResultsDisplayMode() {
  const mode = getPresentationSettings().resultsDisplayMode || State.resultsDisplayMode || 'percent';
  return mode === 'count' ? 'count' : 'percent';
}

function setResultsDisplayMode(mode) {
  State.resultsDisplayMode = mode === 'count' ? 'count' : 'percent';
  void persistPresentationSettings({ resultsDisplayMode: State.resultsDisplayMode });
}

function isResultsViewSlide(slide) {
  if (!slide) return false;
  return isCardResultsSlide(slide) || !!slide.settings?.presentationResults || isSlideResultsLinkedSlide(slide);
}

function renderResultsDisplayToggleHtml() {
  const mode = getResultsDisplayMode();
  return `<div class="present-results-toggle" role="group" aria-label="Ergebnis-Anzeige">
    <button type="button" class="present-results-toggle-btn ${mode === 'percent' ? 'active' : ''}" data-results-mode="percent">%</button>
    <button type="button" class="present-results-toggle-btn ${mode === 'count' ? 'active' : ''}" data-results-mode="count">#</button>
  </div>`;
}

function bindResultsDisplayToggle(root) {
  root?.querySelectorAll('[data-results-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setResultsDisplayMode(btn.dataset.resultsMode);
      renderPresent();
      refreshAddSlideClosureUi();
    });
  });
}

function launchResultsConfetti(duration = 3200) {
  let canvas = document.getElementById('lp-confetti-canvas');
  if (canvas) canvas.remove();
  canvas = document.createElement('canvas');
  canvas.id = 'lp-confetti-canvas';
  canvas.className = 'lp-confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  const colors = ['#206efb', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#fbbf24', '#22d3ee'];
  const particles = Array.from({ length: 140 }, () => ({
    x: canvas.width * (0.25 + Math.random() * 0.5),
    y: -10 - Math.random() * canvas.height * 0.2,
    w: 5 + Math.random() * 7,
    h: 4 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 5,
    vy: 1.5 + Math.random() * 4,
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 10,
  }));
  const start = performance.now();
  const tick = (t) => {
    const elapsed = t - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.07;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < duration) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

function resultsSlideHasWinner(slide) {
  if (!slide) return false;
  if (isCardResultsSlide(slide)) {
    const c = slide.content || {};
    const voteSlide = isBrainstormResultsSlide(slide)
      ? findBrainstormVoteSlide(c.brainstormSourceId)
      : findCardVoteSlide(c.sopTrackKey || c.sopTrackClass, c.sopPhaseName, c.sopCardName);
    if (!voteSlide) return false;
    const visible = getVisibleResponses(voteSlide.id);
    const { voteCounts } = aggregateVoteResponses(voteSlide, visible);
    return Object.values(voteCounts).some((n) => n > 0);
  }
  if (isSlideResultsLinkedSlide(slide)) {
    const source = State.slides.find((s) => s.id === slide.content?.resultsSourceId);
    if (!source) return false;
    const visible = getVisibleResponses(source.id);
    const agg = window.LPViz.aggregateResponses(source, visible);
    if (agg.counts) return Object.values(agg.counts).some((n) => n > 0);
    if (agg.scores) return Object.values(agg.scores).some((n) => n > 0);
    if (agg.totals) return Object.values(agg.totals).some((n) => n > 0);
    return (agg.total || 0) > 0;
  }
  if (slide.settings?.presentationResults) {
    return analyzePresentationScoring().scorableSlides.some((s) => {
      const visible = getVisibleResponses(s.id);
      const agg = window.LPViz.aggregateResponses(s, visible);
      if (agg.counts) return Object.values(agg.counts).some((n) => n > 0);
      return (agg.total || 0) > 0;
    });
  }
  return false;
}

function maybeLaunchResultsConfetti(slide) {
  if (!slide || !isResultsViewSlide(slide)) return;
  if (getPresentationSettings().resultsConfetti === false) return;
  if (!resultsSlideHasWinner(slide)) return;
  if (State.confettiSlideId === slide.id) return;
  State.confettiSlideId = slide.id;
  launchResultsConfetti();
}

function analyzeSlideChainCapability(slide) {
  if (!slide || isSystemLinkedSlide(slide)) {
    return { canRank: false, canResults: false, reason: 'System- oder Verknüpfungsfolie' };
  }
  const t = slide.slide_type;
  if (COLLECT_CHAIN_TYPES.has(t)) {
    return {
      canRank: true,
      canResults: true,
      needsRankForResults: true,
      rankLabel: 'Ranking-Folie anbinden',
      resultsLabel: 'Ergebnis-Folie anbinden',
    };
  }
  if (DIRECT_RESULTS_CHAIN_TYPES.has(t)) {
    return {
      canRank: false,
      canResults: true,
      needsRankForResults: false,
      resultsLabel: 'Ergebnis-Folie anbinden',
      rankReason: 'Ranking braucht gesammelte Freitext-Ideen (Brainstorming, Offene Frage, Word Cloud).',
    };
  }
  return { canRank: false, canResults: false, reason: 'Keine auswertbaren Antworten auf dieser Folie.' };
}

function analyzePresentationScoring(slides = State.slides) {
  const scorableSlides = (slides || []).filter(
    (s) => SCORABLE_INTERACTIVE_TYPES.has(s.slide_type) && !isSystemLinkedSlide(s)
  );
  return {
    scorableCount: scorableSlides.length,
    canPresentationResults: scorableSlides.length > 0,
    scorableSlides,
    noResultsReason: scorableSlides.length
      ? ''
      : 'Mindestens eine interaktive Folie mit auswertbaren Antworten nötig.',
  };
}

function getCollectChainSettings(slide) {
  const s = { ...window.LP_DEFAULT_SETTINGS, ...(slide?.settings || {}) };
  if (slide?.slide_type === 'brainstorm') {
    return {
      attachRank: !!s.brainstormAttachRanking,
      attachResults: !!s.brainstormAttachResults,
      voteMax: Math.max(1, Number(s.brainstormVoteMax || 2)),
    };
  }
  return {
    attachRank: !!s.slideAttachRanking,
    attachResults: !!s.slideAttachResults,
    voteMax: Math.max(1, Number(s.slideAttachVoteMax || 2)),
  };
}

function setCollectChainSettings(slide, partial) {
  slide.settings = slide.settings || {};
  if (slide.slide_type === 'brainstorm') {
    if ('attachRank' in partial) slide.settings.brainstormAttachRanking = partial.attachRank;
    if ('attachResults' in partial) slide.settings.brainstormAttachResults = partial.attachResults;
    if ('voteMax' in partial) slide.settings.brainstormVoteMax = partial.voteMax;
  } else {
    if ('attachRank' in partial) slide.settings.slideAttachRanking = partial.attachRank;
    if ('attachResults' in partial) slide.settings.slideAttachResults = partial.attachResults;
    if ('voteMax' in partial) slide.settings.slideAttachVoteMax = partial.voteMax;
  }
}

function hasCollectChain(slide) {
  if (!slide || !COLLECT_CHAIN_TYPES.has(slide.slide_type)) return false;
  const cs = getCollectChainSettings(slide);
  return cs.attachRank || Boolean(findBrainstormVoteSlide(slide.id));
}

function isSlideResultsLinkedSlide(slide) {
  return Boolean(slide?.settings?.slideResultsLinked && slide?.content?.resultsSourceId);
}

function findSlideResultsSlide(sourceId) {
  return State.slides.find((s) => s.settings?.slideResultsLinked && s.content?.resultsSourceId === sourceId);
}

function findPresentationResultsSlide() {
  return State.slides.find((s) => s.settings?.presentationResults);
}

function findPresentationClosingSlide() {
  return State.slides.find((s) => s.settings?.presentationClosing);
}

function useCenteredLayout(slide) {
  if (!slide) return false;
  const c = { ...defaultStyle(), ...slide.content };
  if (c.layout === 'default') return false;
  if (c.layout === 'center') return true;
  if (slide.settings?.presentationClosing) return true;
  if (c.mentiHero) return true;
  if (slide.slide_type === 'section' && !c.sopTrackClass) return true;
  if (
    slide.slide_type === 'content'
    && !c.sopKind
    && !c.sopTrackResults
    && !isCardResultsSlide(slide)
    && !isSlideResultsLinkedSlide(slide)
    && !slide.settings?.presentationResults
  ) {
    return c.layout === 'center';
  }
  return false;
}

function renderCenteredSlideHtml(c, editable, opts = {}) {
  const icon = opts.icon || 'fa-signal';
  const titleEl = editable
    ? `<div class="canvas-editable canvas-title menti-hero-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="menti-hero-title">${esc(c.title || '')}</h1>`;
  const bodyEl = editable
    ? `<div class="canvas-editable menti-hero-body" contenteditable="true" data-field="body">${esc(c.body || c.subtitle || '')}</div>`
    : `<p class="menti-hero-body">${esc(c.body || c.subtitle || '').replace(/\n/g, '<br>')}</p>`;
  return `
    <div class="menti-hero canvas-body-wrap">
      <div class="canvas-centered-icon menti-hero-icon"><i class="fa-solid ${icon}"></i></div>
      ${titleEl}
      ${bodyEl}
    </div>`;
}

function renderPresentationResultsPresentHtml() {
  const scoring = analyzePresentationScoring();
  const mode = getResultsDisplayMode();
  if (!scoring.scorableSlides.length) {
    return '<p class="present-wait-msg">Noch keine auswertbaren Folien in dieser Präsentation.</p>';
  }
  return `${renderResultsDisplayToggleHtml()}<div class="pres-results-summary">${scoring.scorableSlides.map((s) => {
    const displaySlide = getTrackVoteDisplaySlide(s);
    const visible = getVisibleResponses(s.id);
    const agg = window.LPViz.aggregateResponses(displaySlide, visible);
    const title = s.content?.title || s.content?.prompt || 'Folie';
    return `<div class="pres-results-block"><h3>${esc(title)}</h3><div class="viz-wrap viz-wrap-present">${window.LPViz.renderViz(displaySlide, agg, 'present', { displayMode: mode })}</div></div>`;
  }).join('')}</div>`;
}

let _autosaveTimer = null;
function setEditorSaveStatus(state) {
  const el = $('#editor-save-status');
  if (!el) return;
  el.className = 'autosave-pill';
  if (state === 'saving') {
    el.classList.add('is-saving');
    el.innerHTML = '<span class="pill-dot"></span> Speichert…';
    return;
  }
  if (state === 'error') {
    el.classList.add('is-error');
    el.innerHTML = '<span class="pill-dot"></span> Fehler beim Speichern';
    return;
  }
  if (state === 'saved') {
    el.classList.add('is-active');
    el.innerHTML = '<span class="pill-dot"></span> Gespeichert';
    clearTimeout(_autosaveTimer);
    _autosaveTimer = setTimeout(() => setEditorSaveStatus('idle'), 2400);
    return;
  }
  el.classList.add('is-active');
  el.innerHTML = '<span class="pill-dot"></span> Autosave aktiv';
}

function isBrainstormCollectSlide(slide) {
  if (!slide || !COLLECT_CHAIN_TYPES.has(slide.slide_type)) return false;
  const c = slide.content || {};
  if (isSopWorkshopPresentation() && (c.sopKind === 'phase-workshop' || c.sopKind === 'card-workshop' || c.sopCardName)) return true;
  return hasCollectChain(slide);
}

function shouldUseVoteWorkshopUi(slide) {
  if (!slide) return false;
  if (isSopWorkshopPresentation() && (slide.settings?.sopCardVote || slide.settings?.sopTrackVote)) return true;
  return isBrainstormVoteSlide(slide);
}

function findCardVoteSlide(trackKey, phaseName, cardName) {
  return State.slides.find((s) => {
    const c = s.content || {};
    const st = s.settings || {};
    const trackMatch = c.sopTrackKey === trackKey || c.sopTrackClass === trackKey;
    return st.sopCardVote && trackMatch && c.sopPhaseName === phaseName && c.sopCardName === cardName;
  });
}

function getVoteOptions(slide) {
  const scope = getVoteSlideScope(slide);
  if (!scope) return slide?.content?.options || [];
  if (scope.kind === 'brainstorm') {
    const { items } = aggregateBrainstormItems(scope.sourceId);
    if (!items.length) return [{ id: 'none', text: 'Noch keine Ideen gesammelt' }];
    return items.map((item) => ({ id: `resp-${item.id}`, text: item.text }));
  }
  if (scope.kind === 'card') {
    const { items } = aggregateCardUseCases(scope.key, scope.phaseName, scope.cardName);
    if (!items.length) return [{ id: 'none', text: 'Noch keine Use Cases gesammelt' }];
    return items.map((item) => ({ id: `resp-${item.id}`, text: item.text }));
  }
  const { allItems } = aggregateTrackUseCases(scope.key);
  if (!allItems.length) return [{ id: 'none', text: 'Noch keine Use Cases gesammelt' }];
  return allItems.map((item) => ({ id: `resp-${item.id}`, text: item.text }));
}

function getVoteDisplaySlide(slide) {
  if (!getVoteSlideScope(slide)) return slide;
  return { ...slide, content: { ...slide.content, options: getVoteOptions(slide) } };
}

function getTrackVoteOptions(slide) {
  return getVoteOptions(slide);
}

function getTrackVoteDisplaySlide(slide) {
  return getVoteDisplaySlide(slide);
}

const SOP_TRACK_NAV_CLASS = {
  'track-pre': 'sop-nav-track--pre',
  'track-ops': 'sop-nav-track--ops',
  'track-post': 'sop-nav-track--post',
};

function isSopWorkshopPresentation() {
  return Boolean(State.slides?.some((s) => s.content?.sopTrackKey || s.content?.sopTrackClass));
}

function findSlideIndexForSopStep(trackKey, phaseName, cardName, step) {
  return State.slides.findIndex((s) => {
    const c = s.content || {};
    const st = s.settings || {};
    const trackMatch = c.sopTrackKey === trackKey || c.sopTrackClass === trackKey;
    if (step === 'track-intro') {
      return s.slide_type === 'section' && c.sopKind === 'track' && trackMatch;
    }
    if (step === 'card-intro') {
      return s.slide_type === 'content' && c.sopKind === 'card' && c.sopPhaseName === phaseName && c.sopCardName === cardName && trackMatch;
    }
    if (step === 'brainstorm' || step === 'card') {
      if (!trackMatch) return false;
      if (s.slide_type === 'brainstorm' && c.sopPhaseName === phaseName && c.sopCardName === cardName) return true;
      if (s.slide_type === 'content' && c.sopKind === 'card' && c.sopPhaseName === phaseName && c.sopCardName === cardName) return true;
      return false;
    }
    if (step === 'card-vote') {
      return st.sopCardVote && trackMatch && c.sopPhaseName === phaseName && c.sopCardName === cardName;
    }
    if (step === 'card-results') {
      return st.sopCardResults && trackMatch && c.sopPhaseName === phaseName && c.sopCardName === cardName;
    }
    if (step === 'track-vote') {
      return st.sopTrackVote && trackMatch;
    }
    return false;
  });
}

function getSopSlideContext(slide) {
  if (!slide) return null;
  const c = slide.content || {};
  const st = slide.settings || {};
  if (st.sopCardResults) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: c.sopCardName, kind: 'card-results' };
  }
  if (st.sopCardVote) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: c.sopCardName, kind: 'card-vote' };
  }
  if (st.sopTrackVote) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: null, cardName: null, kind: 'track-vote' };
  }
  if (slide.slide_type === 'brainstorm' && (c.sopTrackKey || c.sopTrackClass) && c.sopKind === 'phase-workshop') {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: null, kind: 'phase-brainstorm' };
  }
  if (slide.slide_type === 'brainstorm' && (c.sopTrackKey || c.sopTrackClass) && c.sopCardName) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: c.sopCardName, kind: 'card-brainstorm' };
  }
  if (c.sopKind === 'card' || c.sopKind === 'card-workshop') {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: c.sopCardName, kind: 'card-brainstorm' };
  }
  if (c.sopKind === 'track') {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: null, cardName: null, kind: 'track-intro' };
  }
  return null;
}

function getActiveTrackKey(slideIndex) {
  const ctx = getSopSlideContext(State.slides[slideIndex]);
  if (ctx?.trackKey) return ctx.trackKey;
  for (let i = slideIndex; i >= 0; i -= 1) {
    const c = getSopSlideContext(State.slides[i]);
    if (c?.trackKey) return c.trackKey;
  }
  return null;
}

function getTrackCardSlideIndexes(trackKey) {
  return State.slides
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => {
      const c = s.content || {};
      const trackMatch = c.sopTrackKey === trackKey || c.sopTrackClass === trackKey;
      return trackMatch && s.slide_type === 'brainstorm' && c.sopCardName;
    });
}

function getTrackPhaseSlideIndexes(trackKey) {
  return State.slides
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => {
      const c = s.content || {};
      const trackMatch = c.sopTrackKey === trackKey || c.sopTrackClass === trackKey;
      return trackMatch && s.slide_type === 'brainstorm' && c.sopKind === 'phase-workshop';
    });
}

function getWorkshopMode(slide) {
  const ctx = getSopSlideContext(slide);
  if (!ctx) return slide?.settings?.workshopMode || null;
  if (ctx.kind === 'track-intro') return 'orient';
  if (ctx.kind === 'card-brainstorm' || ctx.kind === 'phase-brainstorm') return 'collect';
  if (ctx.kind === 'track-vote' || ctx.kind === 'card-vote' || ctx.kind === 'card-results') return 'decide';
  return slide?.settings?.workshopMode || null;
}

function getWorkshopProgress(slideIndex) {
  const slide = State.slides[slideIndex];
  const ctx = getSopSlideContext(slide);
  const trackKey = ctx?.trackKey || getActiveTrackKey(slideIndex);
  if (!trackKey || !ctx) return null;
  const cards = getTrackCardSlideIndexes(trackKey);
  const track = (window.SOP_TOOL_TRACKS || []).find((t) => t.class === trackKey);
  const trackLabel = track?.title.replace(/^Track \d+: /, '') || trackKey;
  if (ctx.kind === 'track-vote') {
    return { trackKey, trackLabel, step: 'decide', stepLabel: 'Priorisierung', cardIndex: cards.length, cardTotal: cards.length, pct: 100, counter: 'Track-Priorisierung' };
  }
  if (ctx.kind === 'card-vote' || ctx.kind === 'card-results') {
    const idx = cards.findIndex(({ s }) => s.content?.sopCardName === ctx.cardName);
    const cardNum = idx >= 0 ? idx + 1 : 0;
    const subStep = ctx.kind === 'card-results' ? 3 : 2;
    const pct = cards.length ? Math.round(((cardNum - 1) * 3 + subStep) / (cards.length * 3) * 100) : 0;
    const counter = ctx.kind === 'card-results' ? `Ergebnis · ${ctx.cardName}` : `Priorisierung · ${ctx.cardName}`;
    return { trackKey, trackLabel, step: 'decide', stepLabel: ctx.kind === 'card-results' ? 'Ergebnis' : 'Priorisierung', cardIndex: cardNum, cardTotal: cards.length, pct, cardName: ctx.cardName, phaseName: ctx.phaseName, counter };
  }
  if (ctx.kind === 'track-intro') {
    return { trackKey, trackLabel, step: 'orient', stepLabel: 'Orientierung', cardIndex: 0, cardTotal: cards.length, pct: 0 };
  }
  if (ctx.kind === 'phase-brainstorm') {
    const phases = getTrackPhaseSlideIndexes(trackKey);
    const idx = phases.findIndex(({ s }) => s.content?.sopPhaseName === ctx.phaseName);
    const phaseNum = idx >= 0 ? idx + 1 : 0;
    const pct = phases.length ? Math.round((phaseNum / phases.length) * 100) : 0;
    return { trackKey, trackLabel, step: 'collect', stepLabel: 'Brainstorming', cardIndex: phaseNum, cardTotal: phases.length, pct, phaseName: ctx.phaseName, counter: `Phase ${phaseNum} / ${phases.length} · ${ctx.phaseName}` };
  }
  if (ctx.cardName) {
    const idx = cards.findIndex(({ s }) => s.content?.sopCardName === ctx.cardName);
    const cardNum = idx >= 0 ? idx + 1 : 0;
    const pct = cards.length ? Math.round((cardNum / cards.length) * 100) : 0;
    return { trackKey, trackLabel, step: 'collect', stepLabel: 'Brainstorming', cardIndex: cardNum, cardTotal: cards.length, pct, cardName: ctx.cardName, phaseName: ctx.phaseName };
  }
  return null;
}

function renderWorkshopProgressHtml(slideIndex) {
  if (!isSopWorkshopPresentation()) {
    return `<div class="menti-slide-counter">Folie ${slideIndex + 1} / ${State.slides.length}</div>`;
  }
  const p = getWorkshopProgress(slideIndex);
  if (!p) return `<div class="menti-slide-counter">Folie ${slideIndex + 1} / ${State.slides.length}</div>`;
  const counter = p.counter || (p.step === 'decide' ? 'Priorisierung' : p.step === 'orient' ? 'Track-Start' : `Karte ${p.cardIndex} / ${p.cardTotal}`);
  const mode = p.step === 'orient' ? 'orient' : p.step === 'collect' ? 'collect' : 'decide';
  return `<div class="menti-slide-progress">
    <div class="menti-slide-progress-top">
      <span class="menti-slide-track">${esc(p.trackLabel)}</span>
      <span class="menti-slide-step">${esc(counter)}</span>
      ${renderWorkshopModeBadge(mode)}
    </div>
    <div class="workshop-progress-bar"><div class="workshop-progress-fill" style="width:${p.pct}%"></div></div>
  </div>`;
}

function wrapMentiSlide(bodyHtml, slideIndex) {
  return `<div class="menti-slide">
    ${renderWorkshopProgressHtml(slideIndex)}
    <div class="menti-slide-content">${bodyHtml}</div>
  </div>`;
}

function renderWorkshopModeBadge(mode) {
  const labels = { orient: 'Orientierung', collect: 'Brainstorming', decide: 'Priorisierung' };
  const icons = { orient: 'fa-compass', collect: 'fa-lightbulb', decide: 'fa-chart-pie' };
  if (!mode || !labels[mode]) return '';
  return `<div class="workshop-mode-badge workshop-mode-${mode}"><i class="fa-solid ${icons[mode]}"></i> ${labels[mode]}</div>`;
}

function getCardNavStatus(trackKey, phaseName, cardName, currentIndex) {
  const brainstormIdx = findSlideIndexForSopStep(trackKey, phaseName, cardName, 'card');
  const voteIdx = findSlideIndexForSopStep(trackKey, phaseName, cardName, 'card-vote');
  const resultsIdx = findSlideIndexForSopStep(trackKey, phaseName, cardName, 'card-results');
  if ([brainstormIdx, voteIdx, resultsIdx].includes(currentIndex)) return 'active';
  const lastIdx = resultsIdx >= 0 ? resultsIdx : (voteIdx >= 0 ? voteIdx : brainstormIdx);
  if (lastIdx >= 0 && currentIndex > lastIdx) return 'done';
  if (brainstormIdx >= 0 && currentIndex > brainstormIdx && voteIdx < 0) return 'done';
  return 'open';
}

function cardNavStatusIcon(status) {
  if (status === 'done') return '<i class="fa-solid fa-check sop-nav-status done"></i>';
  if (status === 'active') return '<i class="fa-solid fa-circle sop-nav-status active"></i>';
  return '<i class="fa-regular fa-circle sop-nav-status open"></i>';
}

function getSopBoardContextFromSlide(slide) {
  const ctx = getSopSlideContext(slide);
  if (ctx?.kind !== 'track-intro') return { show: false };
  return { show: true, trackKey: ctx.trackKey, phaseName: null, cardName: null };
}

function getTrackVoteOptionsGrouped(slide) {
  const scope = getVoteSlideScope(slide);
  if (scope?.kind === 'brainstorm') {
    const opts = getVoteOptions(slide).filter((o) => o.id !== 'none');
    if (!opts.length) return [];
    const sourceSlide = State.slides.find((s) => s.id === scope.sourceId);
    return [{
      phase: '',
      card: sourceSlide?.content?.title || 'Brainstorming',
      options: opts,
    }];
  }
  if (scope?.kind === 'card') {
    const opts = getVoteOptions(slide).filter((o) => o.id !== 'none');
    if (!opts.length) return [];
    return [{
      phase: scope.phaseName,
      card: scope.cardName,
      options: opts,
    }];
  }
  if (scope?.kind === 'all-tracks') {
    const { byTrack } = aggregateAllTracksUseCases();
    const groups = [];
    byTrack.forEach((trk) => {
      trk.phases.forEach((p) => {
        if (p.items.length) {
          groups.push({
            phase: `${trk.trackLabel} · ${p.phase}`,
            card: '',
            options: p.items.map((item) => ({ id: `resp-${item.id}`, text: item.text })),
          });
        }
      });
    });
    return groups;
  }
  const key = slide.content?.sopTrackKey || slide.content?.sopTrackClass;
  if (!key) return [];
  const { byCard } = aggregateTrackUseCases(key);
  return byCard
    .filter((g) => g.items.length)
    .map((g) => ({
      phase: g.phase,
      card: g.card,
      options: g.items.map((item) => ({ id: `resp-${item.id}`, text: item.text })),
    }));
}

function markNewBubbleIds(scopeKey, items) {
  if (!State.bubbleSeenIds) State.bubbleSeenIds = {};
  const prev = State.bubbleSeenIds[scopeKey] || new Set();
  const newIds = new Set();
  items.forEach((item) => {
    const id = typeof item === 'object' ? item.id : item;
    if (!id) return;
    if (!prev.has(id)) newIds.add(id);
    prev.add(id);
  });
  State.bubbleSeenIds[scopeKey] = prev;
  return newIds;
}

function aggregateVoteResponses(slide, visible) {
  const optionMap = {};
  getVoteOptions(slide).forEach((o) => { optionMap[o.id] = o.text; });
  const voteCounts = {};
  const pointTotals = {};
  let totalVotes = 0;
  visible.forEach((r) => {
    (r.response?.values || []).forEach((id) => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
      totalVotes += 1;
    });
    const pts = r.response?.points || {};
    Object.entries(pts).forEach(([id, val]) => { pointTotals[id] = (pointTotals[id] || 0) + Number(val || 0); });
  });
  return { voteCounts, pointTotals, totalVotes, optionMap };
}

function aggregateTrackVoteResponses(slide, visible) {
  const { voteCounts, pointTotals, optionMap } = aggregateVoteResponses(slide, visible);
  const top3Counts = voteCounts;
  return { top3Counts, pointTotals, optionMap };
}

function renderVoteResultsHtml(slide, visible, { showWinners = false, displayMode = null } = {}) {
  const mode = displayMode || getResultsDisplayMode();
  const scope = getVoteSlideScope(slide);
  const { voteCounts, pointTotals, totalVotes } = aggregateVoteResponses(slide, visible);
  const options = getVoteOptions(slide).filter((o) => o.id !== 'none');
  const hasPointVotes = Object.values(pointTotals).some((v) => v > 0);
  if (scope?.kind === 'track' && hasPointVotes) return renderTrackVoteResultsHtml(slide, visible);

  const ranked = options.map((o) => ({
    ...o,
    votes: voteCounts[o.id] || 0,
    pct: totalVotes ? Math.round((voteCounts[o.id] || 0) / totalVotes * 1000) / 10 : 0,
  })).sort((a, b) => b.votes - a.votes || b.pct - a.pct);

  const maxVotes = Math.max(1, ...ranked.map((o) => o.votes));
  const maxPct = Math.max(1, ...ranked.map((o) => o.pct));
  let html = '<div class="card-vote-results">';
  if (showWinners) {
    html += renderResultsDisplayToggleHtml();
    const winners = ranked.filter((o) => o.votes > 0).slice(0, 3);
    if (winners.length) {
      html += `<div class="card-vote-winners">${winners.map((w, i) => `
        <div class="card-vote-winner card-vote-winner--${i + 1}${i === 0 ? ' card-vote-winner--confetti' : ''}">
          <span class="card-vote-winner-rank">#${i + 1}</span>
          <span class="card-vote-winner-text">${esc(w.text)}</span>
          <span class="card-vote-winner-pct">${mode === 'count' ? `${w.votes} Stimmen` : `${w.pct}% · ${w.votes} Stimmen`}</span>
        </div>`).join('')}</div>`;
    }
  }
  html += ranked.map((o) => {
    const barPct = mode === 'count' ? Math.round((o.votes / maxVotes) * 100) : Math.round((o.pct / maxPct) * 100);
    const label = mode === 'count' ? `${o.votes}` : `${o.pct}%`;
    return `<div class="track-vote-result-row card-vote-result-row">
      <span>${esc(o.text)}</span>
      <div class="viz-bar-track"><div class="viz-bar-fill" style="width:${barPct}%"></div></div>
      <strong>${label}${mode === 'percent' ? '' : ` · ${o.votes}`}</strong>
    </div>`;
  }).join('');
  html += `<div class="card-vote-total">${visible.length} Teilnehmer · ${totalVotes} Stimmen gesamt</div></div>`;
  return html;
}

function getCardVoteParticipation(slide) {
  const visible = getVisibleResponses(slide.id);
  const votedParticipantIds = new Set(visible.map((r) => r.participant_id).filter(Boolean));
  const allParticipants = State.participants || [];
  const voted = allParticipants.filter((p) => votedParticipantIds.has(p.id));
  const pending = allParticipants.filter((p) => !votedParticipantIds.has(p.id));
  return { voted, pending, votedCount: voted.length, totalCount: allParticipants.length };
}

function renderCardVoteParticipationHtml(slide) {
  const { voted, pending, votedCount, totalCount } = getCardVoteParticipation(slide);
  const pct = totalCount ? Math.round((votedCount / totalCount) * 100) : 0;
  return `<div class="card-vote-participation">
    <div class="card-vote-participation-head">
      <span class="card-vote-participation-count"><i class="fa-solid fa-users"></i> ${votedCount} / ${totalCount} haben abgestimmt</span>
      <div class="card-vote-participation-bar"><div class="card-vote-participation-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="card-vote-participation-grid">
      <div class="card-vote-participation-col">
        <div class="card-vote-participation-label"><i class="fa-solid fa-check"></i> Abgestimmt (${voted.length})</div>
        <div class="card-vote-participation-list">${voted.map((p) => `<span class="card-vote-part-chip">${participantAvatarHtml(p, 'xs')} ${esc(p.display_name)}</span>`).join('') || '<span class="card-vote-part-empty">Noch niemand</span>'}</div>
      </div>
      <div class="card-vote-participation-col">
        <div class="card-vote-participation-label card-vote-participation-label--wait"><i class="fa-regular fa-clock"></i> Ausstehend (${pending.length})</div>
        <div class="card-vote-participation-list">${pending.map((p) => `<span class="card-vote-part-chip card-vote-part-chip--wait">${participantAvatarHtml(p, 'xs')} ${esc(p.display_name)}</span>`).join('') || '<span class="card-vote-part-empty">Alle fertig</span>'}</div>
      </div>
    </div>
  </div>`;
}

function renderCardVotePresentHtml(slide, visible) {
  const scope = getVoteSlideScope(slide);
  if (!scope || (scope.kind !== 'card' && scope.kind !== 'brainstorm')) return renderTrackVotePresentHtml(slide, visible);
  let items = [];
  let label = scope.cardName || 'Karte';
  if (scope.kind === 'brainstorm') {
    ({ items } = aggregateBrainstormItems(scope.sourceId));
    const sourceSlide = State.slides.find((s) => s.id === scope.sourceId);
    label = sourceSlide?.content?.title || 'Brainstorming';
  } else {
    ({ items } = aggregateCardUseCases(scope.key, scope.phaseName, scope.cardName));
    label = scope.cardName;
  }
  if (!items.length) {
    return '<div class="present-wait-msg">Noch keine Ideen gesammelt. Bitte zuerst das Brainstorming abschließen.</div>';
  }
  const bubbleKey = scope.kind === 'brainstorm' ? `brainstorm-vote-${scope.sourceId}` : `card-vote-${scope.key}-${scope.cardName}`;
  const newIds = markNewBubbleIds(bubbleKey, items);
  const bubbleHtml = window.LPViz.renderBrainstormBubbles(items, { mode: 'present', maxItems: 80, newIds });
  const hasVotes = visible.length > 0;
  const maxHint = scope.maxSelections || 2;
  return `<div class="track-vote-present card-vote-present">
    <div class="track-vote-present-head">
      <span class="track-vote-count">${items.length} Ideen · ${esc(label)}</span>
      <span class="track-vote-hint">${State.session.question_open ? `Max. ${maxHint} Favoriten pro Person` : 'Abstimmung abgeschlossen'}</span>
    </div>
    ${renderCardVoteParticipationHtml(slide)}
    ${bubbleHtml}
    ${hasVotes ? `<div class="track-vote-live-ranking"><div class="track-vote-live-label">Live-Ergebnis (Prozent)</div>${renderVoteResultsHtml(slide, visible)}</div>` : ''}
  </div>`;
}

function renderCardResultsPresentHtml(slide) {
  const c = slide.content || {};
  let voteSlide = null;
  let items = [];
  let label = c.sopCardName || c.title || 'Karte';
  if (isBrainstormResultsSlide(slide)) {
    voteSlide = findBrainstormVoteSlide(c.brainstormSourceId);
    ({ items } = aggregateBrainstormItems(c.brainstormSourceId));
    const sourceSlide = State.slides.find((s) => s.id === c.brainstormSourceId);
    label = sourceSlide?.content?.title || label;
  } else {
    const key = c.sopTrackKey || c.sopTrackClass;
    voteSlide = findCardVoteSlide(key, c.sopPhaseName, c.sopCardName);
    ({ items } = aggregateCardUseCases(key, c.sopPhaseName, c.sopCardName));
  }
  if (!voteSlide) return '<div class="present-wait-msg">Keine Abstimmungsfolie gefunden.</div>';
  const visible = State.session ? getVisibleResponses(voteSlide.id) : [];
  const bubbleHtml = items.length
    ? window.LPViz.renderBrainstormBubbles(items, { mode: 'present', maxItems: 80 })
    : '';
  return `<div class="card-results-present">
    <div class="track-vote-present-head">
      <span class="track-vote-count">Ergebnis · ${esc(label)}</span>
      <span class="track-vote-hint">${getResultsDisplayMode() === 'count' ? 'Gewinner und Stimmen in absoluten Zahlen' : 'Gewinner und Stimmenanteile in Prozent'}</span>
    </div>
    ${renderCardVoteParticipationHtml(voteSlide)}
    ${bubbleHtml}
    ${renderVoteResultsHtml(voteSlide, visible, { showWinners: true })}
  </div>`;
}

function renderBrainstormPresentViz(slide, visible) {
  const items = visible
    .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim() }))
    .filter((item) => item.text);
  const newIds = markNewBubbleIds(slide.id, items);
  return window.LPViz.renderBrainstormBubbles(items, { mode: 'present', maxItems: 100, newIds });
}

function renderTrackVotePresentHtml(slide, visible) {
  // Cross-Track-Voting (Workshop-Finale): aggregiert aus allen Tracks.
  const scope = getVoteSlideScope(slide);
  if (scope?.kind === 'all-tracks') {
    const { allItems } = aggregateAllTracksUseCases();
    if (!allItems.length) {
      return '<div class="present-wait-msg">Noch keine Use Cases gesammelt. Bitte zuerst die Phase-Brainstormings durchführen.</div>';
    }
    const newIds = markNewBubbleIds('all-tracks-vote', allItems);
    const bubbleHtml = window.LPViz.renderBrainstormBubbles(allItems, { mode: 'present', maxItems: 200, newIds });
    const hasVotes = visible.length > 0 || !State.session.question_open;
    return `<div class="track-vote-present" data-uniform-bubbles="true">
      <div class="track-vote-present-head">
        <span class="track-vote-count">${allItems.length} Use Cases</span>
        <span class="track-vote-hint">Alle Tracks zusammen · ${State.session.question_open ? 'Teilnehmer priorisieren jetzt die Top-5' : 'Priorisierung abgeschlossen'}</span>
      </div>
      ${renderCardVoteParticipationHtml(slide)}
      ${bubbleHtml}
      ${hasVotes ? `<div class="track-vote-live-ranking"><div class="track-vote-live-label">Live-Ergebnis</div>${renderVoteResultsHtml(slide, visible)}</div>` : ''}
    </div>`;
  }
  const key = slide.content?.sopTrackKey || slide.content?.sopTrackClass;
  const { allItems } = aggregateTrackUseCases(key);
  if (!allItems.length) {
    return '<div class="present-wait-msg">Noch keine Use Cases gesammelt. Bitte zuerst das Brainstorming in den Karten abschließen.</div>';
  }
  const newIds = markNewBubbleIds(`track-vote-${key}`, allItems);
  const bubbleHtml = window.LPViz.renderBrainstormBubbles(allItems, { mode: 'present', maxItems: 120, newIds });
  const hasVotes = visible.length > 0 || !State.session.question_open;
  const boardHtml = renderSopBoardPreview(slide.content || {});
  return `<div class="track-vote-present">
    <div class="track-vote-present-head">
      <span class="track-vote-count">${allItems.length} Use Cases</span>
      <span class="track-vote-hint">Kontext aus allen SOP-Phasen · ${State.session.question_open ? 'Teilnehmer wählen jetzt Top 3' : 'Priorisierung abgeschlossen'}</span>
    </div>
    ${boardHtml ? `<div class="track-vote-sop-context">${boardHtml}</div>` : ''}
    ${renderCardVoteParticipationHtml(slide)}
    ${bubbleHtml}
    ${hasVotes ? `<div class="track-vote-live-ranking"><div class="track-vote-live-label">Live-Ergebnis</div>${renderVoteResultsHtml(slide, visible)}</div>` : ''}
  </div>`;
}

function renderTrackVoteGroupedListHtml(slide, { selectable = false, selectedIds = [] } = {}) {
  const groups = getTrackVoteOptionsGrouped(slide);
  if (!groups.length) return '<div class="present-wait-msg">Noch keine Use Cases gesammelt.</div>';
  return `<div class="track-vote-grouped">${groups.map((g) => `
    <div class="track-vote-group">
      <div class="track-vote-group-head"><span>${esc(g.phase)}</span><strong>${esc(g.card)}</strong></div>
      <div class="track-vote-group-items">${g.options.map((o) => {
        if (selectable) {
          const checked = selectedIds.includes(o.id) ? ' checked' : '';
          return `<label class="track-vote-option"><input type="checkbox" value="${esc(o.id)}"${checked} /><span>${esc(o.text)}</span></label>`;
        }
        return `<div class="track-vote-option-read">${esc(o.text)}</div>`;
      }).join('')}</div>
    </div>`).join('')}</div>`;
}

function aggregateTrackVoteResponses(slide, visible) {
  return aggregateVoteResponses(slide, visible);
}

function renderTrackVoteResultsHtml(slide, visible) {
  const { voteCounts: top3Counts, pointTotals } = aggregateVoteResponses(slide, visible);
  const groups = getTrackVoteOptionsGrouped(slide);
  const scoreFor = (id) => (top3Counts[id] || 0) * 10 + (pointTotals[id] || 0);
  let html = '<div class="track-vote-results">';
  groups.forEach((g) => {
    html += `<div class="track-vote-group"><div class="track-vote-group-head"><span>${esc(g.phase)}</span><strong>${esc(g.card)}</strong></div><div class="track-vote-group-items">`;
    g.options
      .map((o) => ({ ...o, score: scoreFor(o.id), votes: top3Counts[o.id] || 0, points: pointTotals[o.id] || 0 }))
      .sort((a, b) => b.score - a.score)
      .forEach((o) => {
        const max = Math.max(1, ...g.options.map((x) => scoreFor(x.id)));
        const pct = Math.round((o.score / max) * 100);
        html += `<div class="track-vote-result-row"><span>${esc(o.text)}</span><div class="viz-bar-track"><div class="viz-bar-fill" style="width:${pct}%"></div></div><strong>${o.votes ? `${o.votes}× Top 3` : ''}${o.votes && o.points ? ' · ' : ''}${o.points ? `${Math.round(o.points)} Pkt` : ''}</strong></div>`;
      });
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

function renderWorkshopCardCollectHtml(c, editable = false) {
  const titleEl = editable
    ? `<div class="canvas-editable menti-q-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="menti-q-title">${esc(c.title || c.sopCardName || '')}</h1>`;
  const subEl = c.subtitle ? `<p class="menti-crumb">${esc(c.subtitle)}</p>` : '';
  const bodyEl = editable
    ? `<div class="canvas-editable menti-q-sub" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
    : (c.body ? `<p class="menti-q-sub">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
  const promptEl = editable
    ? `<div class="canvas-editable menti-q-prompt workshop-collect-prompt" contenteditable="true" data-field="prompt">${esc(c.prompt || '')}</div>`
    : (c.prompt ? `<p class="menti-q-prompt">${esc(c.prompt).replace(/\n/g, '<br>')}</p>` : '');
  return `<div class="menti-question-block">${subEl}${titleEl}${bodyEl}${promptEl || ''}</div>`;
}

function renderParticipantWorkshopHeader(slideIndex) {
  if (!isSopWorkshopPresentation()) return '';
  return renderWorkshopProgressHtml(slideIndex);
}

function wrapMentiParticipantSlide(bodyHtml, slideIndex) {
  const header = isSopWorkshopPresentation() ? renderParticipantWorkshopHeader(slideIndex) : '';
  return `<div class="menti-participant-slide">${header}<div class="menti-participant-content">${bodyHtml}</div></div>`;
}

function renderParticipantTrackVoteHtml(slide) {
  const groups = getTrackVoteOptionsGrouped(slide);
  if (!groups.length) return '<p style="color:var(--muted)">Noch keine Use Cases gesammelt. Bitte warte, bis das Brainstorming abgeschlossen ist.</p>';
  const scope = getVoteSlideScope(slide);
  const max = scope?.maxSelections || 2;
  if (scope?.kind === 'track') {
    const expert = State.participantVoteExpert;
    if (expert) {
      const opts = getTrackVoteOptions(slide);
      return `<p class="vote-mode-hint">Expertenmodus: Verteile genau <strong>100 Punkte</strong>.</p>
        ${opts.map((o) => `<div class="split-row"><span>${esc(o.text)}</span><input type="number" min="0" max="100" value="0" data-split="${esc(o.id)}" class="split-input" /></div>`).join('')}
        <div id="split-total" style="font-weight:700;margin:.5rem 0">Summe: 0 / 100</div>
        <button type="button" class="btn-ghost vote-mode-toggle" id="vote-mode-toggle">← Zurück zu Top 3</button>
        <button type="button" class="btn-primary participant-submit" id="submit-split">Punkte senden</button>`;
    }
    return `<p class="vote-mode-hint">Wähle deine <strong>Top 3 Use Cases</strong> in diesem Track.</p>
      ${renderTrackVoteGroupedListHtml(slide, { selectable: true })}
      <div id="fav-counter" class="top3-counter">0 / 3 gewählt</div>
      <button type="button" class="btn-ghost vote-mode-toggle" id="vote-mode-toggle">Expertenmodus: 100 Punkte</button>
      <button type="button" class="btn-primary participant-submit" id="submit-favorites">Top 3 senden</button>`;
  }
  return `<p class="vote-mode-hint">Wähle <strong>maximal ${max} Lieblings-Use-Cases</strong> aus dem Brainstorming.</p>
    ${renderTrackVoteGroupedListHtml(slide, { selectable: true })}
    <div id="fav-counter" class="top3-counter">0 / ${max} gewählt</div>
    <button type="button" class="btn-primary participant-submit" id="submit-favorites">Favoriten senden</button>`;
}

function bindSopWorkshopPanelClicks(container, onNavigate) {
  if (!container || !onNavigate) return;
  container.querySelectorAll('[data-slide-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.slideIndex, 10);
      if (Number.isFinite(idx) && idx >= 0) onNavigate(idx);
    });
  });
}

function renderSopWorkshopPanelHtml(currentIndex, { clickable = false, onNavigate } = {}) {
  const tracks = window.SOP_TOOL_TRACKS || [];
  const activeTrackKey = getActiveTrackKey(currentIndex);
  const activeTrack = tracks.find((t) => t.class === activeTrackKey);
  if (!activeTrack) return { html: '', bind() {} };

  const navClass = SOP_TRACK_NAV_CLASS[activeTrack.class] || '';
  // Slide-Index Finder fuer Phase-basierte Struktur:
  // - 'phase-intro': section-Slide mit sopKind='phase'
  // - 'phase-brainstorm': brainstorm-Slide mit dem Phase-Namen
  // - 'track-summary': content-Slide mit sopTrackResults
  function findIdx(predicate) {
    return State.slides.findIndex(predicate);
  }
  const trackIntroIdx = findIdx((s) => {
    const c = s.content || {};
    return s.slide_type === 'section' && c.sopKind === 'track' && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
  });
  const trackSummaryIdx = findIdx((s) => {
    const c = s.content || {};
    return s.slide_type === 'content' && c.sopTrackResults && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
  });
  const trackIdxNum = tracks.findIndex((t) => t.class === activeTrack.class);

  let html = `<div class="workshop-sop-panel ${esc(activeTrack.class)} ${esc(navClass)}">
    <div class="workshop-sop-panel-head"><i class="fa-solid fa-map"></i> Workshop</div>`;
  html += `<button type="button" class="workshop-sop-panel-track${currentIndex === trackIntroIdx ? ' active' : ''}" data-slide-index="${trackIntroIdx}" ${trackIntroIdx < 0 ? 'disabled' : ''}>
    <span class="workshop-sop-panel-badge">Track ${trackIdxNum + 1}</span>
    <span class="workshop-sop-panel-title">${esc(activeTrack.title.replace(/^Track \d+: /, ''))}</span>
  </button>`;

  (activeTrack.phases || []).forEach((phase, phaseIdx) => {
    const phaseIntroIdx = findIdx((s) => {
      const c = s.content || {};
      return s.slide_type === 'section' && c.sopKind === 'phase' && c.sopPhaseName === phase.name && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
    });
    const phaseBrainstormIdx = findIdx((s) => {
      const c = s.content || {};
      return s.slide_type === 'brainstorm' && c.sopPhaseName === phase.name && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
    });
    // Aktuelle Phase = wenn currentIndex auf Phase-Intro oder Phase-Brainstorm liegt
    const phaseActive = (currentIndex === phaseIntroIdx) || (currentIndex === phaseBrainstormIdx);
    // Passed: bereits abgehakt
    const phasePassed = phaseBrainstormIdx >= 0 && currentIndex > phaseBrainstormIdx;
    const stateClass = phaseActive ? 'is-current' : (phasePassed ? 'is-passed' : '');

    html += `<div class="workshop-sop-phase">
      <button type="button" class="sop-nav-phase-item ${stateClass}" data-slide-index="${phaseIntroIdx >= 0 ? phaseIntroIdx : phaseBrainstormIdx}" ${(phaseIntroIdx < 0 && phaseBrainstormIdx < 0) ? 'disabled' : ''}>
        <i class="fa-solid fa-bookmark"></i>
        <span>${esc(phase.name)}</span>
      </button>`;
    if (phaseBrainstormIdx >= 0) {
      html += `<button type="button" class="workshop-sop-step ${currentIndex === phaseBrainstormIdx ? 'active' : ''}" data-slide-index="${phaseBrainstormIdx}" title="Brainstorming">
        <i class="fa-solid fa-lightbulb"></i> Brainstorm
      </button>`;
    }
    html += '</div>';
  });

  if (trackSummaryIdx >= 0) {
    html += `<button type="button" class="workshop-sop-vote ${currentIndex === trackSummaryIdx ? 'active' : ''}" data-slide-index="${trackSummaryIdx}">
      <i class="fa-solid fa-chart-pie"></i><span>Track-Übersicht</span>
    </button>`;
  }

  const laterTracks = tracks.filter((t) => t.class !== activeTrackKey);
  if (laterTracks.length) {
    html += '<div class="workshop-sop-later">';
    laterTracks.forEach((track) => {
      const tIdx = findIdx((s) => s.content?.sopKind === 'track' && (s.content.sopTrackClass === track.class || s.content.sopTrackKey === track.class));
      const tSummary = findIdx((s) => (s.content?.sopTrackResults) && (s.content.sopTrackClass === track.class || s.content.sopTrackKey === track.class));
      const done = tSummary >= 0 && currentIndex > tSummary;
      const label = done ? 'Abgeschlossen' : (currentIndex >= tIdx && tIdx >= 0 ? 'Später' : 'Noch nicht gestartet');
      html += `<div class="workshop-sop-later-item">${esc(track.title.replace(/^Track \d+: /, ''))} · ${label}</div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return {
    html,
    bind(container) {
      if (!clickable || !onNavigate) return;
      bindSopWorkshopPanelClicks(container, onNavigate);
    },
  };
}

function renderSopWorkshopNavHtml(currentIndex, options = {}) {
  return renderSopWorkshopPanelHtml(currentIndex, options);
}

function syncSopWorkshopShell(mode, slideIndex) {
  const isSop = isSopWorkshopPresentation();
  document.body.classList.toggle('lp-sop-workshop', isSop);
  document.body.classList.toggle('lp-sop-focus', isSop && State.sopFocusMode);
  document.body.classList.toggle('lp-sop-panels', isSop && State.showPresentPanels);
  document.body.classList.toggle('editor-mode', mode === 'editor');
  document.body.classList.toggle('present-mode', mode === 'present');
  document.body.classList.toggle('participant-mode', mode === 'participant');

  const slide = State.slides[slideIndex ?? 0];
  const modeName = getWorkshopMode(slide);
  document.body.classList.toggle('workshop-orient', modeName === 'orient');
  document.body.classList.toggle('workshop-collect', modeName === 'collect');
  document.body.classList.toggle('workshop-decide', modeName === 'decide');

  const editorNav = $('#editor-sop-nav');
  const editorPanel = $('#editor-sop-panel');
  const presentPanel = $('#present-sop-panel');
  const participantPanel = $('#participant-sop-panel');

  if (!isSop) {
    editorNav?.classList.add('hidden');
    editorPanel?.classList.add('hidden');
    presentPanel?.classList.add('hidden');
    participantPanel?.classList.add('hidden');
    return;
  }

  const idx = slideIndex ?? 0;
  const onNavigate = (targetIdx) => {
    if (mode === 'editor') {
      State.selectedSlideId = State.slides[targetIdx]?.id;
      renderEditor();
    } else if (mode === 'present') {
      void goToSlide(targetIdx);
    }
  };
  const panel = renderSopWorkshopPanelHtml(idx, {
    clickable: mode === 'editor' || mode === 'present',
    onNavigate,
  });

  const mountPanel = (el) => {
    if (!el) return;
    if (!panel.html) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    el.innerHTML = panel.html;
    panel.bind(el);
  };

  editorNav?.classList.add('hidden');
  if (mode === 'editor') mountPanel(editorPanel);
  else editorPanel?.classList.add('hidden');

  if (mode === 'present') mountPanel(presentPanel);
  else presentPanel?.classList.add('hidden');

  if (mode === 'participant') mountPanel(participantPanel);
  else participantPanel?.classList.add('hidden');
}

function renderSopBoardPreview(c, editable = false) {
  if (c.sopKind === 'track' || c.sopKind === 'phase') return '';
  const board = c.sopBoard || [];
  if (!board.length) return '';
  const theme = sopTrackTheme(c.sopTrackClass);
  const trackIdx = c.sopTrackIndex || 1;
  const ed = (field, val, cls) => editable
    ? `<span class="canvas-editable ${cls}" contenteditable="true" data-field="${field}">${esc(val)}</span>`
    : esc(val);
  const cols = board.map((phase) => `
    <div class="sop-board-phase">
      <div class="sop-board-phase-label">${ed('phase', phase.name, 'sop-board-phase-name')}</div>
      <div class="sop-board-cards">${(phase.cards || []).map((card) => `
        <div class="sop-board-card ${c.sopKind === 'card' && card === c.title ? 'active' : ''}">
          <i class="fa-solid fa-file-lines"></i><span>${esc(card)}</span>
        </div>`).join('')}</div>
    </div>`).join('');
  return `
    <div class="sop-board-preview ${esc(c.sopTrackClass || '')} ${esc(c.sopKind || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
      <div class="sop-board-track-header">
        <span class="sop-board-track-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">Track ${trackIdx}</span>
        <span class="sop-board-track-name">${ed('title', c.title, 'sop-board-track-title')}</span>
      </div>
      <div class="sop-board-phases-row">${cols}</div>
    </div>`;
}

function renderSopSectionHtml(c, editable = false) {
  const theme = sopTrackTheme(c.sopTrackClass);
  const isTrack = c.sopKind === 'track';
  const titleEl = editable
    ? `<div class="canvas-editable sop-menti-title" contenteditable="true" data-field="title" data-placeholder="Titel…">${esc(c.title || '')}</div>`
    : `<h1 class="sop-menti-title">${esc(c.title)}</h1>`;
  const subEl = editable
    ? `<div class="canvas-editable sop-menti-sub" contenteditable="true" data-field="subtitle" data-placeholder="Untertitel…">${esc(c.subtitle || '')}</div>`
    : (c.subtitle ? `<p class="sop-menti-sub">${esc(c.subtitle)}</p>` : '');
  const bodyEl = editable
    ? `<div class="canvas-editable sop-menti-body" contenteditable="true" data-field="body" data-placeholder="Einleitungstext…">${esc(c.body || '')}</div>`
    : (c.body ? `<p class="sop-menti-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
  return `
    <div class="sop-menti-section ${isTrack ? 'sop-menti-track' : 'sop-menti-phase'} ${esc(c.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
      <div class="sop-menti-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(c.sopTrackLabel || 'SOP')}</div>
      ${titleEl}
      ${subEl}
      ${bodyEl}
      ${renderSopBoardPreview(c, editable)}
    </div>`;
}

function renderSopCardHtml(c, editable = false) {
  const theme = sopTrackTheme(c.sopTrackClass);
  const titleEl = editable
    ? `<div class="canvas-editable sop-card-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="sop-card-title">${esc(c.title)}</h1>`;
  const subEl = editable
    ? `<div class="canvas-editable sop-card-sub" contenteditable="true" data-field="subtitle">${esc(c.subtitle || '')}</div>`
    : (c.subtitle ? `<p class="sop-card-sub">${esc(c.subtitle)}</p>` : '');
  const bodyEl = editable
    ? `<div class="canvas-editable sop-card-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
    : `<p class="sop-card-body">${esc(c.body || '').replace(/\n/g, '<br>')}</p>`;
  return `
    <div class="sop-card-slide ${esc(c.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
      <div class="sop-menti-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(c.sopTrackLabel)} · ${esc(c.sopPhaseName)}</div>
      <div class="sop-card-visual"><i class="fa-solid fa-file-lines"></i></div>
      ${titleEl}
      ${subEl}
      ${bodyEl}
      ${renderSopBoardPreview(c, editable)}
    </div>`;
}

function renderSopTrackResultsHtml(trackKey) {
  const { byCard, allItems } = aggregateTrackUseCases(trackKey);
  if (!allItems.length) return '<div class="present-wait-msg">Noch keine Use Cases in diesem Track gesammelt.</div>';
  return `<div class="sop-track-results">${byCard.filter((g) => g.items.length).map((group) => `
    <div class="sop-track-result-group">
      <div class="sop-track-result-head"><span>${esc(group.phase)}</span><strong>${esc(group.card)}</strong></div>
      <div class="sop-track-result-items">${group.items.map((item) => `<div class="sop-track-result-item">${esc(item.text || item)}</div>`).join('')}</div>
    </div>`).join('')}<div class="sop-track-result-total">${allItems.length} Use Cases gesammelt</div></div>`;
}

function renderSopContentHtml(c, editable = false) {
  if (c.sopKind === 'card') return renderSopCardHtml(c, editable);
  if (c.sopAllTracksResults) {
    const titleEl = editable
      ? `<div class="canvas-editable sop-menti-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-menti-title">${esc(c.title)}</h1>`;
    const bodyEl = editable
      ? `<div class="canvas-editable sop-menti-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-menti-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    const results = State.session ? renderAllTracksResultsHtml() : '<div class="present-wait-msg">Ergebnisse erscheinen in der Live-Session.</div>';
    return `
      <div class="sop-menti-section sop-all-tracks-results-slide">
        <div class="sop-menti-badge" style="background:#0f172a;color:#fff">Alle Tracks</div>
        ${titleEl}
        ${bodyEl}
        <div class="sop-track-results-wrap">${results}</div>
      </div>`;
  }
  if (c.sopTrackResults) {
    const theme = sopTrackTheme(c.sopTrackClass);
    const titleEl = editable
      ? `<div class="canvas-editable sop-menti-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-menti-title">${esc(c.title)}</h1>`;
    const bodyEl = editable
      ? `<div class="canvas-editable sop-menti-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-menti-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    const results = State.session ? renderSopTrackResultsHtml(c.sopTrackKey) : '<div class="present-wait-msg">Ergebnisse erscheinen in der Live-Session.</div>';
    return `
      <div class="sop-menti-section sop-track-results-slide ${esc(c.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
        <div class="sop-menti-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(c.sopTrackLabel || 'Track')}</div>
        ${titleEl}
        ${bodyEl}
        ${renderSopBoardPreview(c, editable)}
        <div class="sop-track-results-wrap">${results}</div>
      </div>`;
  }
  return '';
}

function renderMentiHeroHtml(c, editable = false) {
  const titleEl = editable
    ? `<div class="canvas-editable menti-hero-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="menti-hero-title">${esc(c.title)}</h1>`;
  const bodyEl = editable
    ? `<div class="canvas-editable menti-hero-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
    : `<p class="menti-hero-body">${esc(c.body || '').replace(/\n/g, '<br>')}</p>`;
  return `
    <div class="menti-hero">
      <div class="menti-hero-icon"><i class="fa-solid fa-signal"></i></div>
      ${titleEl}
      ${bodyEl}
    </div>`;
}

function renderPresentParticipants() {
  const bar = $('#present-participants');
  if (!bar) return;
  if (!State.participants.length) {
    bar.innerHTML = '<span class="present-participants-empty">Warte auf Teilnehmer…</span>';
    return;
  }
  bar.innerHTML = `
    <div class="present-participants-label"><i class="fa-solid fa-users"></i> ${State.participants.length} Teilnehmer</div>
    <div class="present-participants-list">${State.participants.map(participantChipHtml).join('')}</div>`;
}

function pushPresentActivity(participantId, action = 'hat geantwortet') {
  const p = State.participants.find((x) => x.id === participantId);
  if (!p?.display_name) return;
  State.activityItems.unshift({ id: uid(), p, action, at: Date.now() });
  State.activityItems = State.activityItems.slice(0, 6);
  renderPresentActivity();
}

function renderPresentActivity() {
  const feed = $('#present-activity');
  if (!feed) return;
  feed.innerHTML = State.activityItems.map((item) => `
    <div class="present-activity-item">
      ${participantAvatarHtml(item.p, 'xs')}
      <span><strong>${esc(item.p.display_name)}</strong> ${esc(item.action)}</span>
    </div>`).join('');
  if (State.activityItems.length) {
    clearTimeout(State._activityHide);
    feed.classList.add('visible');
    State._activityHide = setTimeout(() => feed.classList.remove('visible'), 4000);
  }
}

function mountRootsUser() {
  if (window.RootsUser?._loadAndMount) void window.RootsUser._loadAndMount(sb);
  else if (window.RootsUserBridge?.mountSyncStatus) window.RootsUserBridge.mountSyncStatus(sb);
}

async function loadProfile(user) {
  const { data } = await sb.schema('users').from('profiles')
    .select('id,email,full_name,position,avatar_url,app_role')
    .eq('id', user.id).maybeSingle();
  State.profile = data || { id: user.id, email: user.email, full_name: user.email?.split('@')[0] };
}

function goDashboard() {
  location.hash = '#dashboard';
  showScreen('dashboard');
  void loadPresentations().then(renderDashboard);
}

/* ─── AUTH ─── */
async function onAuthSession(session) {
  State.user = session.user;
  await loadProfile(session.user);
  mountRootsUser();
  if (isJoinRoute()) {
    enterParticipantJoin();
    return;
  }
  if (location.hash.startsWith('#editor/') || location.hash.startsWith('#present/') || location.hash.startsWith('#results/')) {
    await routeFromHash();
    return;
  }
  showScreen('dashboard');
  await loadPresentations();
  renderDashboard();
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const pw = $('#login-password').value;
  $('#login-submit').disabled = true;
  try {
    if (State.authMode === 'signup') {
      const { error } = await sb.auth.signUp({ email, password: pw });
      if (error) throw error;
      toast('Konto erstellt – bitte E-Mail bestätigen.', 'success');
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      await onAuthSession(data.session);
    }
  } catch (err) {
    showLoginAlert(err.message || 'Anmeldung fehlgeschlagen');
  } finally {
    $('#login-submit').disabled = false;
  }
}

/* ─── DASHBOARD ─── */
async function loadPresentations() {
  const { data, error } = await sb.from('lp_presentations').select('*').order('updated_at', { ascending: false });
  if (error) { toast(error.message, 'error'); return; }
  State.presentations = data || [];
}

function filteredPresentations() {
  let list = [...State.presentations];
  const q = State.search.trim().toLowerCase();
  if (q) list = list.filter((p) => p.title.toLowerCase().includes(q));
  if (State.dashFilter === 'favorites') list = list.filter((p) => p.is_favorite);
  else if (State.dashFilter === 'draft') list = list.filter((p) => p.status === 'draft');
  else if (State.dashFilter === 'active') list = list.filter((p) => p.status === 'active');
  else if (State.dashFilter === 'archived') list = list.filter((p) => p.status === 'archived');
  else if (State.dashFilter === 'recent') list = list.slice(0, 12);
  return list;
}

function renderDashboard() {
  const grid = $('#presentations-grid');
  const list = filteredPresentations();
  grid.innerHTML = `
    <div class="create-card" id="card-create"><i class="fa-solid fa-plus"></i><span>Neue Präsentation</span></div>
    ${list.map((p) => `
      <article class="board-card" data-id="${p.id}">
        <div class="board-thumb"><i class="fa-solid fa-signal"></i></div>
        <div class="board-meta">
          <div class="board-name">${esc(p.title)}</div>
          <div class="board-sub">${esc(p.status)} · ${new Date(p.updated_at).toLocaleDateString('de-DE')}</div>
        </div>
        <div class="board-actions">
          <button type="button" class="board-action-btn" data-act="fav" title="Favorit"><i class="fa-${p.is_favorite ? 'solid' : 'regular'} fa-star"></i></button>
          <button type="button" class="board-action-btn" data-act="rename" title="Umbenennen"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="board-action-btn" data-act="dup" title="Duplizieren"><i class="fa-solid fa-copy"></i></button>
          <button type="button" class="board-action-btn" data-act="del" title="Löschen"><i class="fa-solid fa-trash"></i></button>
        </div>
      </article>`).join('')}`;
  grid.querySelector('#card-create')?.addEventListener('click', () => createPresentation());
  grid.querySelectorAll('.board-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.board-action-btn')) return;
      openEditor(card.dataset.id);
    });
    card.querySelector('[data-act="fav"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const p = State.presentations.find((x) => x.id === card.dataset.id);
      await sb.from('lp_presentations').update({ is_favorite: !p.is_favorite }).eq('id', p.id);
      await loadPresentations(); renderDashboard();
    });
    card.querySelector('[data-act="rename"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const p = State.presentations.find((x) => x.id === card.dataset.id);
      const title = prompt('Neuer Titel:', p.title);
      if (!title?.trim()) return;
      await sb.from('lp_presentations').update({ title: title.trim() }).eq('id', p.id);
      await loadPresentations(); renderDashboard();
    });
    card.querySelector('[data-act="dup"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await duplicatePresentation(card.dataset.id);
    });
    card.querySelector('[data-act="del"]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Präsentation löschen?')) return;
      await sb.from('lp_presentations').delete().eq('id', card.dataset.id);
      await loadPresentations(); renderDashboard();
    });
  });
}

async function createPresentation(templateKey) {
  const tpl = window.LP_TEMPLATES.find((t) => t.key === templateKey);
  const { data: pres, error } = await sb.from('lp_presentations').insert({
    owner_id: State.user.id,
    title: tpl?.name || 'Neue Präsentation',
    status: 'draft',
  }).select().single();
  if (error) { toast(error.message, 'error'); return; }
  const slides = tpl?.slides?.length
    ? tpl.slides.map((s, i) => ({
        presentation_id: pres.id,
        sort_order: i,
        slide_type: s.slide_type,
        content: { ...defaultStyle(), ...s.content },
        settings: { ...window.LP_DEFAULT_SETTINGS, ...(s.settings || {}) },
      }))
    : [{
        presentation_id: pres.id, sort_order: 0, slide_type: 'content',
        content: { title: 'Willkommen', body: 'Füge interaktive Folien hinzu.', ...defaultStyle() },
        settings: { ...window.LP_DEFAULT_SETTINGS },
      }];
  await sb.from('lp_slides').insert(slides);
  closeModal('modal-templates');
  openEditor(pres.id);
}

async function duplicatePresentation(id) {
  const src = State.presentations.find((p) => p.id === id);
  if (!src) return;
  const { data: pres } = await sb.from('lp_presentations').insert({
    owner_id: State.user.id,
    title: `${src.title} (Kopie)`,
    status: 'draft',
    settings: src.settings,
  }).select().single();
  const { data: slides } = await sb.from('lp_slides').select('*').eq('presentation_id', id).order('sort_order');
  if (slides?.length) {
    await sb.from('lp_slides').insert(slides.map((s) => ({
      presentation_id: pres.id,
      sort_order: s.sort_order,
      slide_type: s.slide_type,
      content: s.content,
      settings: s.settings,
    })));
  }
  await loadPresentations(); renderDashboard();
  toast('Dupliziert', 'success');
}

function renderTemplatesModal() {
  const grid = $('#templates-grid');
  grid.innerHTML = window.LP_TEMPLATES.map((t) => `
    <button type="button" class="template-card" data-key="${t.key}">
      <div class="template-cat">${esc(t.category)}</div>
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.desc)}</p>
      <div class="template-meta"><span><i class="fa-solid fa-clock"></i> ${esc(t.duration)}</span><span><i class="fa-solid fa-users"></i> ${esc(t.group)}</span><span><i class="fa-solid fa-layer-group"></i> ${t.slides?.length || 0} Folien</span></div>
      ${t.tips ? `<p class="template-tips"><i class="fa-solid fa-lightbulb"></i> ${esc(t.tips)}</p>` : ''}
    </button>`).join('');
  grid.querySelectorAll('.template-card').forEach((btn) => {
    btn.addEventListener('click', () => createPresentation(btn.dataset.key));
  });
}

/* ─── EDITOR ─── */
async function openEditor(id) {
  location.hash = `#editor/${id}`;
  const { data: pres } = await sb.from('lp_presentations').select('*').eq('id', id).single();
  const { data: slides } = await sb.from('lp_slides').select('*').eq('presentation_id', id).order('sort_order');
  State.presentation = pres;
  State.slides = slides || [];
  State.resultsDisplayMode = getPresentationSettings().resultsDisplayMode || 'percent';
  State.selectedSlideId = State.slides[0]?.id || null;
  $('#editor-title').value = pres.title;
  setEditorSaveStatus('idle');
  showScreen('editor');
  renderEditor();
}

function renderEditor() {
  renderSlideList();
  renderEditorCanvas();
  renderEditorProps();
  const slideIdx = State.slides.findIndex((s) => s.id === State.selectedSlideId);
  syncSopWorkshopShell('editor', slideIdx >= 0 ? slideIdx : 0);
}

function currentSlide() {
  return State.slides.find((s) => s.id === State.selectedSlideId) || State.slides[0];
}

function renderSlideList() {
  const list = $('#editor-slides');
  if (!list) return;
  list.innerHTML = State.slides.map((s, i) => {
    const typeLabel = window.LP_SLIDE_TYPES.find((t) => t.type === s.slide_type)?.label || s.slide_type;
    const chainTag = s.settings?.brainstormLinked
      ? (s.settings?.brainstormVote ? ' · Ranking' : s.settings?.brainstormResults ? ' · Ergebnis' : s.settings?.slideResultsLinked ? ' · Ergebnis' : '')
      : s.settings?.presentationResults
        ? ' · Session-Ergebnis'
        : s.settings?.presentationClosing
          ? ' · Abschluss'
          : (s.settings?.brainstormAttachRanking && s.slide_type === 'brainstorm' ? ' · +Kette' : s.settings?.slideAttachRanking ? ' · +Kette' : s.settings?.slideAttachResults ? ' · +Ergebnis' : '');
    return `
    <div class="slide-thumb ${s.id === State.selectedSlideId ? 'active' : ''}" draggable="true" data-id="${s.id}">
      <div class="slide-thumb-row">
        <div class="slide-thumb-num">${i + 1} · ${esc(typeLabel)}${esc(chainTag)}</div>
        <div class="slide-thumb-actions">
          <button type="button" class="slide-mini-btn" data-dup="${s.id}" title="Duplizieren"><i class="fa-solid fa-copy"></i></button>
          <button type="button" class="slide-mini-btn danger" data-del="${s.id}" title="Löschen"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="slide-thumb-title">${esc(s.content?.title || s.content?.prompt || 'Folie')}</div>
    </div>`;
  }).join('');
  list.querySelectorAll('.slide-thumb').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.slide-mini-btn')) return;
      State.selectedSlideId = el.dataset.id;
      renderEditor();
    });
    el.addEventListener('dragstart', () => { State.dragSlideId = el.dataset.id; });
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', async () => {
      const from = State.slides.findIndex((s) => s.id === State.dragSlideId);
      const to = State.slides.findIndex((s) => s.id === el.dataset.id);
      if (from < 0 || to < 0 || from === to) return;
      const [item] = State.slides.splice(from, 1);
      State.slides.splice(to, 0, item);
      State.slides.forEach((s, idx) => { s.sort_order = idx; });
      await persistSlideOrder();
      renderEditor();
    });
  });
  list.querySelectorAll('[data-dup]').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await duplicateSlide(btn.dataset.dup);
  }));
  list.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (State.slides.length <= 1) { toast('Mindestens eine Folie behalten', 'warn'); return; }
    if (!confirm('Folie löschen?')) return;
    await deleteSlide(btn.dataset.del);
  }));
}

async function duplicateSlide(id) {
  const src = State.slides.find((s) => s.id === id);
  if (!src) return;
  const sort = State.slides.length;
  const { data } = await sb.from('lp_slides').insert({
    presentation_id: State.presentation.id,
    sort_order: sort,
    slide_type: src.slide_type,
    content: JSON.parse(JSON.stringify(src.content)),
    settings: JSON.parse(JSON.stringify(src.settings || {})),
  }).select().single();
  State.slides.push(data);
  State.selectedSlideId = data.id;
  renderEditor();
  toast('Folie dupliziert', 'success');
}

async function syncBrainstormChainSlides(collectSlide) {
  return syncCollectChainSlides(collectSlide);
}

async function syncCollectChainSlides(collectSlide) {
  if (!collectSlide || !COLLECT_CHAIN_TYPES.has(collectSlide.slide_type) || !State.presentation?.id) return;
  if (collectSlide.content?.sopTrackKey || collectSlide.content?.sopTrackClass) return;
  const cs = getCollectChainSettings(collectSlide);
  const attachRank = cs.attachRank;
  const attachResults = attachRank && cs.attachResults;
  const maxSel = cs.voteMax;
  const sourceId = collectSlide.id;
  const bc = collectSlide.content || {};
  const typeLabel = collectSlide.slide_type === 'brainstorm' ? 'Brainstorming' : collectSlide.slide_type === 'wordcloud' ? 'Word Cloud' : 'Offene Frage';
  const title = bc.title || typeLabel;

  const removeLinked = async (slide) => {
    if (!slide?.settings?.brainstormLinked) return;
    await sb.from('lp_slides').delete().eq('id', slide.id);
    State.slides = State.slides.filter((s) => s.id !== slide.id);
  };

  let voteSlide = findBrainstormVoteSlide(sourceId);
  let resultsSlide = findBrainstormResultsSlide(sourceId);

  if (!attachRank) {
    await removeLinked(voteSlide);
    await removeLinked(resultsSlide);
    voteSlide = null;
    resultsSlide = null;
  } else {
    const voteContent = {
      ...defaultStyle(),
      title: `Priorisierung · ${title}`,
      prompt: `Wähle deine Favoriten aus „${title}“.`,
      options: [],
      maxSelections: maxSel,
      brainstormSourceId: sourceId,
    };
    const voteSettings = {
      ...window.LP_DEFAULT_SETTINGS,
      showResultsLive: true,
      brainstormVote: true,
      brainstormVoteMax: maxSel,
      brainstormLinked: true,
      workshopMode: 'decide',
    };
    if (!voteSlide) {
      const insertAt = Math.max(0, State.slides.findIndex((s) => s.id === sourceId) + 1);
      const { data, error } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: insertAt,
        slide_type: 'mc_multi',
        content: voteContent,
        settings: voteSettings,
      }).select().single();
      if (error) { toast(error.message, 'error'); return; }
      State.slides.splice(insertAt, 0, data);
      voteSlide = data;
    } else {
      voteSlide.content = { ...voteSlide.content, ...voteContent };
      voteSlide.settings = { ...voteSlide.settings, ...voteSettings };
      await sb.from('lp_slides').update({ content: voteSlide.content, settings: voteSlide.settings }).eq('id', voteSlide.id);
    }
  }

  if (!attachResults) {
    await removeLinked(resultsSlide);
    resultsSlide = null;
  } else if (voteSlide) {
    const resultsContent = {
      ...defaultStyle(),
      title: `Ergebnis · ${title}`,
      body: 'Die favorisierten Ideen mit Stimmenanteil und Gewinnern.',
      brainstormSourceId: sourceId,
    };
    const resultsSettings = {
      ...window.LP_DEFAULT_SETTINGS,
      showResultsLive: true,
      brainstormResults: true,
      brainstormLinked: true,
      workshopMode: 'decide',
    };
    if (!resultsSlide) {
      const voteIdx = State.slides.findIndex((s) => s.id === voteSlide.id);
      const insertAt = voteIdx >= 0 ? voteIdx + 1 : State.slides.length;
      const { data, error } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: insertAt,
        slide_type: 'content',
        content: resultsContent,
        settings: resultsSettings,
      }).select().single();
      if (error) { toast(error.message, 'error'); return; }
      State.slides.splice(insertAt, 0, data);
      resultsSlide = data;
    } else {
      resultsSlide.content = { ...resultsSlide.content, ...resultsContent };
      resultsSlide.settings = { ...resultsSlide.settings, ...resultsSettings };
      await sb.from('lp_slides').update({ content: resultsSlide.content, settings: resultsSlide.settings }).eq('id', resultsSlide.id);
    }
  }

  const bIdx = State.slides.findIndex((s) => s.id === sourceId);
  if (bIdx >= 0 && voteSlide) {
    const vIdx = State.slides.findIndex((s) => s.id === voteSlide.id);
    if (vIdx >= 0 && vIdx !== bIdx + 1) {
      State.slides.splice(vIdx, 1);
      State.slides.splice(bIdx + 1, 0, voteSlide);
    }
  }
  if (voteSlide && resultsSlide) {
    const vIdx = State.slides.findIndex((s) => s.id === voteSlide.id);
    const rIdx = State.slides.findIndex((s) => s.id === resultsSlide.id);
    if (vIdx >= 0 && rIdx >= 0 && rIdx !== vIdx + 1) {
      State.slides.splice(rIdx, 1);
      State.slides.splice(vIdx + 1, 0, resultsSlide);
    }
  }

  State.slides.forEach((s, idx) => { s.sort_order = idx; });
  await persistSlideOrder();
  await sb.from('lp_presentations').update({ updated_at: new Date().toISOString() }).eq('id', State.presentation.id);
}

async function syncSlideResultsChain(sourceSlide) {
  if (!sourceSlide || !State.presentation?.id) return;
  const cap = analyzeSlideChainCapability(sourceSlide);
  if (!cap.canResults || cap.needsRankForResults) return;
  const attach = !!sourceSlide.settings?.slideAttachResults;
  const sourceId = sourceSlide.id;
  const sc = sourceSlide.content || {};
  const title = sc.title || sc.prompt || 'Folie';

  const removeLinked = async (slide) => {
    if (!slide?.settings?.slideResultsLinked) return;
    await sb.from('lp_slides').delete().eq('id', slide.id);
    State.slides = State.slides.filter((s) => s.id !== slide.id);
  };

  let resultsSlide = findSlideResultsSlide(sourceId);
  if (!attach) {
    await removeLinked(resultsSlide);
    State.slides.forEach((s, idx) => { s.sort_order = idx; });
    await persistSlideOrder();
    return;
  }

  const resultsContent = {
    ...defaultStyle(),
    layout: 'center',
    title: `Ergebnis · ${title}`,
    body: 'Live-Auswertung der Antworten auf der vorherigen Folie.',
    resultsSourceId: sourceId,
  };
  const resultsSettings = {
    ...window.LP_DEFAULT_SETTINGS,
    showResultsLive: true,
    slideResultsLinked: true,
  };

  if (!resultsSlide) {
    const insertAt = Math.max(0, State.slides.findIndex((s) => s.id === sourceId) + 1);
    const { data, error } = await sb.from('lp_slides').insert({
      presentation_id: State.presentation.id,
      sort_order: insertAt,
      slide_type: 'content',
      content: resultsContent,
      settings: resultsSettings,
    }).select().single();
    if (error) { toast(error.message, 'error'); return; }
    State.slides.splice(insertAt, 0, data);
    resultsSlide = data;
  } else {
    resultsSlide.content = { ...resultsSlide.content, ...resultsContent };
    resultsSlide.settings = { ...resultsSlide.settings, ...resultsSettings };
    await sb.from('lp_slides').update({ content: resultsSlide.content, settings: resultsSlide.settings }).eq('id', resultsSlide.id);
  }

  const sIdx = State.slides.findIndex((s) => s.id === sourceId);
  const rIdx = State.slides.findIndex((s) => s.id === resultsSlide.id);
  if (sIdx >= 0 && rIdx >= 0 && rIdx !== sIdx + 1) {
    State.slides.splice(rIdx, 1);
    State.slides.splice(sIdx + 1, 0, resultsSlide);
  }

  State.slides.forEach((s, idx) => { s.sort_order = idx; });
  await persistSlideOrder();
  await sb.from('lp_presentations').update({ updated_at: new Date().toISOString() }).eq('id', State.presentation.id);
}

async function persistPresentationSettings(partial) {
  State.presentation.settings = { ...getPresentationSettings(), ...partial };
  await sb.from('lp_presentations').update({
    settings: State.presentation.settings,
    updated_at: new Date().toISOString(),
  }).eq('id', State.presentation.id);
}

async function syncPresentationClosureSlides() {
  if (!State.presentation?.id) return;
  const ps = getPresentationSettings();
  const scoring = analyzePresentationScoring();

  const removeLinked = async (slide) => {
    if (!slide) return;
    await sb.from('lp_slides').delete().eq('id', slide.id);
    State.slides = State.slides.filter((s) => s.id !== slide.id);
  };

  let resultsSlide = findPresentationResultsSlide();
  let closingSlide = findPresentationClosingSlide();

  if (!ps.attachPresentationResults || !scoring.canPresentationResults) {
    await removeLinked(resultsSlide);
    resultsSlide = null;
    if (ps.attachPresentationResults && !scoring.canPresentationResults) {
      await persistPresentationSettings({ attachPresentationResults: false });
    }
  } else {
    const resultsContent = {
      ...defaultStyle(),
      layout: 'center',
      title: 'Ergebnisse der Session',
      body: 'Zusammenfassung aller interaktiven Folien.',
    };
    const resultsSettings = {
      ...window.LP_DEFAULT_SETTINGS,
      showResultsLive: true,
      presentationResults: true,
    };
    if (!resultsSlide) {
      const { data, error } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: State.slides.length,
        slide_type: 'content',
        content: resultsContent,
        settings: resultsSettings,
      }).select().single();
      if (error) { toast(error.message, 'error'); return; }
      State.slides.push(data);
      resultsSlide = data;
    } else {
      resultsSlide.settings = { ...resultsSlide.settings, ...resultsSettings };
      if (!resultsSlide.content?.title) resultsSlide.content = { ...resultsSlide.content, ...resultsContent };
      await sb.from('lp_slides').update({ content: resultsSlide.content, settings: resultsSlide.settings }).eq('id', resultsSlide.id);
    }
  }

  if (!ps.attachPresentationClosing) {
    await removeLinked(closingSlide);
    closingSlide = null;
  } else {
    const closingContent = {
      ...defaultStyle(),
      layout: 'center',
      title: getPresentationSettings().closingTitle || 'Danke für eure Teilnahme!',
      body: getPresentationSettings().closingBody || 'Fragen, Feedback oder Applaus willkommen.',
    };
    const closingSettings = {
      ...window.LP_DEFAULT_SETTINGS,
      presentationClosing: true,
    };
    if (!closingSlide) {
      const { data, error } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: State.slides.length,
        slide_type: 'content',
        content: closingContent,
        settings: closingSettings,
      }).select().single();
      if (error) { toast(error.message, 'error'); return; }
      State.slides.push(data);
      closingSlide = data;
    } else {
      closingSlide.settings = { ...closingSlide.settings, ...closingSettings };
      if (!closingSlide.content?.title) closingSlide.content = { ...closingSlide.content, layout: 'center', ...closingContent };
      else closingSlide.content.layout = closingSlide.content.layout || 'center';
      await sb.from('lp_slides').update({ content: closingSlide.content, settings: closingSlide.settings }).eq('id', closingSlide.id);
    }
  }

  const endSlides = [];
  if (resultsSlide) endSlides.push(resultsSlide);
  if (closingSlide) endSlides.push(closingSlide);
  endSlides.forEach((endSlide) => {
    const idx = State.slides.findIndex((s) => s.id === endSlide.id);
    if (idx >= 0) {
      State.slides.splice(idx, 1);
      State.slides.push(endSlide);
    }
  });
  if (resultsSlide && closingSlide) {
    const rIdx = State.slides.findIndex((s) => s.id === resultsSlide.id);
    const cIdx = State.slides.findIndex((s) => s.id === closingSlide.id);
    if (rIdx >= 0 && cIdx >= 0 && cIdx !== rIdx + 1) {
      State.slides.splice(cIdx, 1);
      State.slides.splice(rIdx + 1, 0, closingSlide);
    }
  }

  State.slides.forEach((s, idx) => { s.sort_order = idx; });
  await persistSlideOrder();
  await sb.from('lp_presentations').update({ updated_at: new Date().toISOString() }).eq('id', State.presentation.id);
}

async function savePresentationClosureFromModal(partial = {}) {
  const scoring = analyzePresentationScoring();
  const settingsPatch = { ...partial };
  if ('attachPresentationResults' in settingsPatch && settingsPatch.attachPresentationResults && !scoring.canPresentationResults) {
    settingsPatch.attachPresentationResults = false;
  }
  await persistPresentationSettings(settingsPatch);
  await syncPresentationClosureSlides();
  renderSlideList();
  renderEditorCanvas();
  refreshAddSlideClosureUi();
}

async function togglePresentationClosureCard(type) {
  const presSettings = getPresentationSettings();
  const scoring = analyzePresentationScoring();
  if (type === 'presentation_results') {
    const next = !presSettings.attachPresentationResults;
    if (next && !scoring.canPresentationResults) {
      toast(scoring.noResultsReason, 'warn');
      return;
    }
    await savePresentationClosureFromModal({
      attachPresentationResults: next,
      resultsDisplayMode: getResultsDisplayMode(),
      resultsConfetti: $('#add-results-confetti')?.checked !== false,
    });
    const slide = findPresentationResultsSlide();
    if (slide) State.selectedSlideId = slide.id;
    toast(next ? 'Session-Ergebnis eingefügt' : 'Session-Ergebnis entfernt', 'success');
  } else if (type === 'presentation_closing') {
    const next = !presSettings.attachPresentationClosing;
    await savePresentationClosureFromModal({
      attachPresentationClosing: next,
      closingTitle: $('#add-closing-title')?.value || presSettings.closingTitle,
      closingBody: $('#add-closing-body')?.value || presSettings.closingBody,
    });
    const slide = findPresentationClosingSlide();
    if (slide) {
      slide.content.title = $('#add-closing-title')?.value || slide.content.title;
      slide.content.body = $('#add-closing-body')?.value || slide.content.body;
      await sb.from('lp_slides').update({ content: slide.content }).eq('id', slide.id);
      State.selectedSlideId = slide.id;
    }
    toast(next ? 'Abschlussfolie eingefügt' : 'Abschlussfolie entfernt', 'success');
  }
  renderEditor();
}

function refreshAddSlideClosureUi() {
  const presSettings = getPresentationSettings();
  const presScoring = analyzePresentationScoring();
  const presResultsLinked = findPresentationResultsSlide();
  const presClosingLinked = findPresentationClosingSlide();
  const mode = getResultsDisplayMode();
  const hintEl = $('#add-closure-results-hint');
  const confettiEl = $('#add-results-confetti');
  const titleEl = $('#add-closing-title');
  const bodyEl = $('#add-closing-body');
  const resultsBtn = $('#btn-toggle-pres-results');
  const closingBtn = $('#btn-toggle-pres-closing');

  if (hintEl) {
    hintEl.textContent = presScoring.canPresentationResults
      ? `${presScoring.scorableCount} auswertbare Folie${presScoring.scorableCount === 1 ? '' : 'n'} in dieser Präsentation.`
      : presScoring.noResultsReason;
  }
  if (confettiEl) confettiEl.checked = presSettings.resultsConfetti !== false;
  if (titleEl) titleEl.value = presClosingLinked?.content?.title || presSettings.closingTitle || titleEl.value;
  if (bodyEl) bodyEl.value = presClosingLinked?.content?.body || presSettings.closingBody || bodyEl.value;

  document.querySelectorAll('#add-closure-results-panel .add-closure-seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.resultsMode === mode);
  });

  if (resultsBtn) {
    const on = !!presSettings.attachPresentationResults && !!presResultsLinked;
    resultsBtn.innerHTML = on
      ? '<i class="fa-solid fa-check"></i> Session-Ergebnis entfernen'
      : `<i class="fa-solid fa-plus"></i> Session-Ergebnis ${presScoring.canPresentationResults ? 'einblenden' : 'nicht möglich'}`;
    resultsBtn.disabled = !presScoring.canPresentationResults && !on;
  }
  if (closingBtn) {
    const on = !!presSettings.attachPresentationClosing && !!presClosingLinked;
    closingBtn.innerHTML = on
      ? '<i class="fa-solid fa-check"></i> Abschlussfolie entfernen'
      : '<i class="fa-solid fa-plus"></i> Abschlussfolie einblenden';
  }

  $$('.type-card[data-type="presentation_results"]').forEach((card) => {
    card.classList.toggle('is-enabled', !!presResultsLinked);
    card.classList.toggle('type-card--disabled', !presScoring.canPresentationResults && !presResultsLinked);
  });
  $$('.type-card[data-type="presentation_closing"]').forEach((card) => {
    card.classList.toggle('is-enabled', !!presClosingLinked);
  });
}

function showAddSlideOptions(type) {
  State.addSlideFocusType = type;
  const chainBox = $('#brainstorm-add-chain');
  const layoutBox = $('#add-slide-layout');
  const closureBox = $('#add-closure-options');
  const resultsPanel = $('#add-closure-results-panel');
  const closingPanel = $('#add-closure-closing-panel');
  $$('.type-card').forEach((card) => card.classList.toggle('type-card--focus', !!type && card.dataset.type === type));
  if (!type) {
    chainBox?.classList.add('hidden');
    layoutBox?.classList.add('hidden');
    closureBox?.classList.add('hidden');
    return;
  }
  chainBox?.classList.toggle('hidden', !COLLECT_CHAIN_TYPES.has(type));
  layoutBox?.classList.toggle('hidden', type !== 'section' && type !== 'content');
  const isClosure = type === 'presentation_results' || type === 'presentation_closing';
  closureBox?.classList.toggle('hidden', !isClosure);
  resultsPanel?.classList.toggle('hidden', type !== 'presentation_results');
  closingPanel?.classList.toggle('hidden', type !== 'presentation_closing');
  if (type === 'section' || type === 'content') {
    const centerEl = $('#add-slide-center');
    if (centerEl) centerEl.checked = type === 'section';
  }
  if (isClosure) refreshAddSlideClosureUi();
}

function finalizePresentUi(slide) {
  updatePresentToolbarUi(slide);
  bindResultsDisplayToggle($('#present-stage'));
  maybeLaunchResultsConfetti(slide);
}

async function deleteSlide(id) {
  const slide = State.slides.find((s) => s.id === id);
  if (slide && COLLECT_CHAIN_TYPES.has(slide.slide_type)) {
    for (const linked of [findBrainstormVoteSlide(id), findBrainstormResultsSlide(id)]) {
      if (linked) await sb.from('lp_slides').delete().eq('id', linked.id);
    }
  }
  if (slide && analyzeSlideChainCapability(slide).canResults && !analyzeSlideChainCapability(slide).needsRankForResults) {
    const linked = findSlideResultsSlide(id);
    if (linked) await sb.from('lp_slides').delete().eq('id', linked.id);
  }
  await sb.from('lp_slides').delete().eq('id', id);
  State.slides = State.slides.filter((s) => s.id !== id);
  State.slides.forEach((s, idx) => { s.sort_order = idx; });
  await persistSlideOrder();
  State.selectedSlideId = State.slides[0]?.id || null;
  renderEditor();
}

function renderEditorCanvas() {
  const slide = currentSlide();
  const canvas = $('#editor-canvas');
  if (!slide) { canvas.innerHTML = '<p>Keine Folien – füge eine hinzu.</p>'; return; }
  const c = { ...defaultStyle(), ...slide.content };
  const accent = c.accentColor || '#206efb';
  canvas.style.background = c.bgColor || '#fff';
  canvas.style.color = c.textColor || '#0f172a';
  canvas.classList.toggle('is-centered', useCenteredLayout(slide));

  if (slide.slide_type === 'section' && c.sopTrackClass) {
    canvas.classList.remove('is-centered');
    canvas.innerHTML = `${renderWorkshopModeBadge('orient')}${renderSopSectionHtml(c, true)}<div class="canvas-hint"><i class="fa-solid fa-pen"></i> Titel, Text und Einleitung direkt bearbeiten</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (isBrainstormCollectSlide(slide)) {
    canvas.classList.remove('is-centered');
    canvas.innerHTML = `${wrapMentiSlide(renderWorkshopCardCollectHtml(c, true), State.slides.findIndex((s) => s.id === slide.id))}<div class="canvas-hint"><i class="fa-solid fa-pen"></i> Freitext sammeln${hasCollectChain(slide) ? ' · Ranking & Ergebnis folgen automatisch' : ''}</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (shouldUseVoteWorkshopUi(slide)) {
    canvas.classList.remove('is-centered');
    const max = slide.settings?.brainstormVoteMax || slide.settings?.slideAttachVoteMax || slide.settings?.sopVoteMax || slide.content?.maxSelections || 2;
    canvas.innerHTML = `${renderWorkshopModeBadge('decide')}
      <div class="canvas-editable canvas-title menti-q-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>
      <p class="canvas-editable canvas-prompt" contenteditable="true" data-field="prompt">${esc(c.prompt || '')}</p>
      <div class="track-vote-editor-preview">${renderTrackVoteGroupedListHtml(slide)}</div>
      <div class="canvas-hint"><i class="fa-solid fa-info-circle"></i> Ideen aus Sammelfolie · max. ${max} Favoriten</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (isCardResultsSlide(slide) || isSlideResultsLinkedSlide(slide)) {
    canvas.classList.remove('is-centered');
    const preview = isSlideResultsLinkedSlide(slide)
      ? (() => {
          const source = State.slides.find((s) => s.id === slide.content?.resultsSourceId);
          if (!source) return '<p class="props-hint">Quellfolie nicht gefunden</p>';
          return `<div class="viz-wrap">${window.LPViz.renderViz(source, window.LPViz.aggregateResponses(source, []), 'editor')}</div>`;
        })()
      : `<div class="track-vote-editor-preview">${renderCardResultsPresentHtml(slide)}</div>`;
    canvas.innerHTML = `${renderWorkshopModeBadge('decide')}
      <div class="canvas-editable canvas-title menti-q-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>
      <p class="canvas-editable canvas-prompt" contenteditable="true" data-field="body">${esc(c.body || '')}</p>
      ${preview}
      <div class="canvas-hint"><i class="fa-solid fa-trophy"></i> Ergebnisfolie · Vorschau im Präsentationsmodus mit Live-Daten</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (slide.settings?.presentationResults) {
    canvas.innerHTML = `${renderCenteredSlideHtml(c, true, { icon: 'fa-chart-column' })}
      <div class="pres-results-summary" style="margin-top:1.5rem">${renderPresentationResultsPresentHtml()}</div>
      <div class="canvas-hint"><i class="fa-solid fa-chart-column"></i> Session-Ergebnis · fasst alle interaktiven Folien zusammen</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (slide.settings?.presentationClosing) {
    canvas.innerHTML = `${renderCenteredSlideHtml(c, true, { icon: 'fa-heart' })}
      <div class="canvas-hint"><i class="fa-solid fa-pen"></i> Abschlussfolie · zentriertes Layout</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (slide.slide_type === 'content' && (c.mentiHero || c.sopKind || c.sopTrackResults || c.sopKind === 'card-results')) {
    const html = c.mentiHero ? renderMentiHeroHtml(c, true) : renderSopContentHtml(c, true);
    if (html) {
      canvas.classList.toggle('is-centered', c.mentiHero || useCenteredLayout(slide));
      canvas.innerHTML = `${html}<div class="canvas-hint"><i class="fa-solid fa-pen"></i> Titel und Text direkt bearbeiten</div>`;
      bindCanvasInlineEdit();
      return;
    }
  }
  if ((slide.slide_type === 'content' || slide.slide_type === 'section') && useCenteredLayout(slide)) {
    canvas.innerHTML = `${renderCenteredSlideHtml(c, true, { icon: slide.slide_type === 'section' ? 'fa-heading' : 'fa-align-center' })}
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" class="canvas-image">` : ''}
      <div class="canvas-hint"><i class="fa-solid fa-pen"></i> Titel und Text direkt auf der Folie bearbeiten</div>`;
    bindCanvasInlineEdit();
    return;
  }

  let body = '';
  if (slide.slide_type === 'content' || slide.slide_type === 'section') {
    body = `
      <p class="canvas-editable" contenteditable="true" data-field="body" data-placeholder="Text eingeben…">${esc(c.body || c.subtitle || '')}</p>
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" class="canvas-image">` : ''}`;
  } else if (OPTION_TYPES.has(slide.slide_type)) {
    body = `
      <p class="canvas-editable canvas-prompt" contenteditable="true" data-field="prompt" data-placeholder="Frage eingeben…">${esc(c.prompt || '')}</p>
      <div class="canvas-options">${(c.options || []).map((o, i) => `
        <div class="canvas-option-row">
          <div class="canvas-option canvas-editable" contenteditable="true" data-field="option" data-opt-idx="${i}" style="border-color:${esc(o.color || accent)}44;background:${esc(o.color || accent)}11">${esc(o.text)}</div>
          <button type="button" class="canvas-opt-rm" data-rm-canvas-opt="${i}" title="Option entfernen"><i class="fa-solid fa-xmark"></i></button>
        </div>`).join('')}
        <button type="button" class="canvas-opt-add" id="canvas-add-option"><i class="fa-solid fa-plus"></i> Option</button>
      </div>`;
  } else {
    body = `<p class="canvas-editable canvas-prompt" contenteditable="true" data-field="prompt" data-placeholder="Frage eingeben…">${esc(c.prompt || '')}</p>`;
  }

  canvas.innerHTML = `
    ${renderSopQuestionBadge(c)}
    <div class="canvas-editable canvas-title ${c.mentiQuestion ? 'menti-q-title' : ''}" contenteditable="true" data-field="title" data-placeholder="Titel…">${esc(c.title || c.prompt || 'Folie')}</div>
    ${body}
    <div class="canvas-hint"><i class="fa-solid fa-pen"></i> Direkt auf der Folie tippen zum Bearbeiten</div>`;
  bindCanvasInlineEdit();
  bindCanvasOptionActions();
}

function bindCanvasOptionActions() {
  const slide = currentSlide();
  if (!slide || !OPTION_TYPES.has(slide.slide_type)) return;
  $('#canvas-add-option')?.addEventListener('click', () => {
    slide.content.options = slide.content.options || [];
    slide.content.options.push({ id: uid().slice(0, 8), text: 'Neue Option', color: slide.content.accentColor || '#206efb' });
    void persistSlide(slide);
    renderEditorProps();
    renderEditorCanvas();
  });
  $$('#editor-canvas [data-rm-canvas-opt]').forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const idx = Number(btn.dataset.rmCanvasOpt);
    if ((slide.content.options || []).length <= 1) { toast('Mindestens eine Option behalten', 'warn'); return; }
    slide.content.options.splice(idx, 1);
    void persistSlide(slide);
    renderEditorProps();
    renderEditorCanvas();
  }));
}

function bindCanvasInlineEdit() {
  const slide = currentSlide();
  if (!slide) return;
  $$('#editor-canvas [contenteditable]').forEach((el) => {
    el.addEventListener('input', debounce(() => {
      const field = el.dataset.field;
      const val = el.innerText.trim();
      if (field === 'title') slide.content.title = val;
      else if (field === 'prompt') slide.content.prompt = val;
      else if (field === 'body') slide.content.body = val;
      else if (field === 'subtitle') slide.content.subtitle = val;
      else if (field === 'option') {
        const idx = Number(el.dataset.optIdx);
        slide.content.options = slide.content.options || [];
        if (slide.content.options[idx]) slide.content.options[idx].text = val;
      }
      void persistSlide(slide);
      const propTitle = $('#prop-title');
      const propPrompt = $('#prop-prompt');
      if (field === 'title' && propTitle) propTitle.value = val;
      if ((field === 'prompt' || field === 'body') && propPrompt) propPrompt.value = val;
      if (field === 'subtitle' && $('#prop-subtitle')) $('#prop-subtitle').value = val;
      if (field === 'body' && propPrompt) propPrompt.value = val;
      if (field === 'option') renderEditorProps();
      renderSlideList();
    }, 600));
    el.addEventListener('focus', () => el.classList.add('editing'));
    el.addEventListener('blur', () => el.classList.remove('editing'));
  });
}

function collectOptionsFromPanel() {
  const slide = currentSlide();
  const propsPanel = $('#editor-props');
  if (!slide || !OPTION_TYPES.has(slide.slide_type) || !propsPanel) return;
  slide.content.options = slide.content.options || [];
  propsPanel.querySelectorAll('[data-opt="text"]').forEach((inp) => {
    const idx = Number(inp.dataset.idx);
    if (slide.content.options[idx]) slide.content.options[idx].text = inp.value;
  });
  if (slide.slide_type === 'quiz') {
    propsPanel.querySelectorAll('[data-opt="correct"]').forEach((inp) => {
      const idx = Number(inp.dataset.idx);
      if (slide.content.options[idx]) slide.content.options[idx].correct = inp.checked;
    });
  }
}

function collectStyleFromPanel() {
  const slide = currentSlide();
  if (!slide) return;
  slide.content.bgColor = $('#prop-bg')?.value || slide.content.bgColor;
  slide.content.textColor = $('#prop-text-color')?.value || slide.content.textColor;
  slide.content.accentColor = $('#prop-accent')?.value || slide.content.accentColor;
}

let panel = null;

function renderEditorProps() {
  const slide = currentSlide();
  panel = $('#editor-props');
  if (!slide) { panel.innerHTML = ''; return; }
  const c = { ...defaultStyle(), ...slide.content };
  const s = { ...window.LP_DEFAULT_SETTINGS, ...slide.settings };

  let optionsHtml = '';
  if (OPTION_TYPES.has(slide.slide_type)) {
    optionsHtml = `
      <div class="props-section">Antwortoptionen</div>
      ${(c.options || []).map((o, i) => `
        <div class="option-row">
          <input type="color" class="opt-color" data-opt="color" data-idx="${i}" value="${esc(o.color || c.accentColor || '#206efb')}" title="Farbe" />
          <input data-opt="text" data-idx="${i}" value="${esc(o.text)}" placeholder="Optionstext" />
          ${slide.slide_type === 'quiz' ? `<label class="opt-correct" title="Richtig"><input type="checkbox" data-opt="correct" data-idx="${i}" ${o.correct ? 'checked' : ''} /></label>` : ''}
          <button type="button" class="opt-rm" data-rm-opt="${i}"><i class="fa-solid fa-xmark"></i></button>
        </div>`).join('')}
      <button type="button" class="btn-secondary btn-sm" id="btn-add-option"><i class="fa-solid fa-plus"></i> Option</button>
      ${slide.slide_type === 'mc_multi' && !isBrainstormVoteSlide(slide) ? `<div class="props-label">Max. Auswahl</div><input id="prop-max-sel" type="number" min="1" value="${c.maxSelections || 3}" />` : ''}
      ${isBrainstormVoteSlide(slide) ? `<p class="props-hint"><i class="fa-solid fa-link"></i> Optionen kommen automatisch aus dem Brainstorming der vorherigen Folie.</p>` : ''}`;
  }

  let slideChainHtml = '';
  const chainCap = analyzeSlideChainCapability(slide);
  const isSopSlide = slide.content?.sopTrackKey || slide.content?.sopTrackClass;
  if (!isSopSlide && (chainCap.canRank || chainCap.canResults)) {
    const cs = getCollectChainSettings(slide);
    const attachRank = COLLECT_CHAIN_TYPES.has(slide.slide_type) ? cs.attachRank : false;
    const attachResults = COLLECT_CHAIN_TYPES.has(slide.slide_type) ? cs.attachResults : !!s.slideAttachResults;
    const voteLinked = findBrainstormVoteSlide(slide.id);
    const resultsLinked = findBrainstormResultsSlide(slide.id) || findSlideResultsSlide(slide.id);
    const rankDisabled = !chainCap.canRank ? ' props-chain-disabled' : '';
    const resultsDisabled = !chainCap.canResults ? ' props-chain-disabled' : '';
    slideChainHtml = `
    <div class="props-section">Folien-Kette</div>
    <p class="props-hint" style="margin-top:0">Optional Ranking- und Ergebnisfolien automatisch direkt nach dieser Folie einfügen.</p>
    ${chainCap.canRank ? `
    <label class="props-toggle${rankDisabled}"><input type="checkbox" id="set-slide-rank" ${attachRank ? 'checked' : ''} ${!chainCap.canRank ? 'disabled' : ''}><span class="props-toggle-box"><i class="fa-solid fa-arrow-down-wide-short"></i></span><span class="props-toggle-text">${esc(chainCap.rankLabel || 'Ranking-Folie anbinden')}</span></label>` : `
    <label class="props-toggle props-chain-disabled"><input type="checkbox" disabled><span class="props-toggle-box"><i class="fa-solid fa-arrow-down-wide-short"></i></span><span class="props-toggle-text">Ranking-Folie anbinden</span></label>
    <p class="props-chain-reason">${esc(chainCap.rankReason || 'Ranking ist für diese Folie nicht verfügbar.')}</p>`}
    <label class="props-toggle${resultsDisabled}"><input type="checkbox" id="set-slide-results" ${attachResults ? 'checked' : ''} ${!chainCap.canResults || (chainCap.needsRankForResults && !attachRank) ? 'disabled' : ''}><span class="props-toggle-box"><i class="fa-solid fa-trophy"></i></span><span class="props-toggle-text">${esc(chainCap.resultsLabel || 'Ergebnis-Folie anbinden')}</span></label>
    ${chainCap.canRank ? `<div class="props-label">Max. Favoriten bei Ranking</div>
    <input id="set-slide-vote-max" type="number" min="1" max="10" value="${cs.voteMax || s.brainstormVoteMax || 2}" ${!attachRank ? 'disabled' : ''} />` : ''}
    ${voteLinked || resultsLinked ? `<p class="props-hint"><i class="fa-solid fa-link"></i> Verknüpft: ${voteLinked ? 'Ranking' : ''}${voteLinked && resultsLinked ? ' · ' : ''}${resultsLinked ? 'Ergebnis' : ''}</p>` : ''}
    ${!chainCap.canRank && !chainCap.canResults && chainCap.reason ? `<p class="props-chain-reason">${esc(chainCap.reason)}</p>` : ''}`;
  }

  panel.innerHTML = `
    <div class="props-head">
      <span>Design & Einstellungen</span>
      <button type="button" class="btn-ghost props-close-mobile" id="props-close-mobile"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="props-section">Design</div>
    <div class="color-grid">
      <label class="color-field"><span>Hintergrund</span><input type="color" id="prop-bg" value="${c.bgColor || '#ffffff'}" /></label>
      <label class="color-field"><span>Text</span><input type="color" id="prop-text-color" value="${c.textColor || '#0f172a'}" /></label>
      <label class="color-field"><span>Akzent</span><input type="color" id="prop-accent" value="${c.accentColor || '#206efb'}" /></label>
    </div>
    <div class="props-section">Inhalt</div>
    <div class="props-label">Titel</div><input id="prop-title" value="${esc(c.title || '')}" />
    ${slide.slide_type === 'section' || c.sopKind ? `<div class="props-label">Untertitel</div><input id="prop-subtitle" value="${esc(c.subtitle || '')}" />` : ''}
    <div class="props-label">${slide.slide_type === 'section' || c.sopKind === 'card' || c.sopTrackResults ? 'Einleitung / Beschreibung' : 'Frage / Text'}</div><textarea id="prop-prompt">${esc(c.prompt || c.body || '')}</textarea>
    ${slide.slide_type === 'content' || slide.slide_type === 'pin_image' ? `<div class="props-label">Bild-URL</div><input id="prop-image" value="${esc(c.imageUrl || '')}" placeholder="https://…" />` : ''}
    ${slide.slide_type === 'scale' ? `
      <div class="props-label">Skala</div>
      <div class="props-row-2"><input id="prop-min" type="number" value="${c.min ?? 1}" placeholder="Min" /><input id="prop-max" type="number" value="${c.max ?? 10}" placeholder="Max" /></div>
      <input id="prop-min-label" value="${esc(c.minLabel || '')}" placeholder="Beschriftung links" />
      <input id="prop-max-label" value="${esc(c.maxLabel || '')}" placeholder="Beschriftung rechts" />` : ''}
    ${optionsHtml}
    ${slideChainHtml}
    <div class="props-section">Interaktion</div>
    <div class="props-toggle-grid">
      <label class="props-toggle"><input type="checkbox" id="set-anonymous" ${s.anonymous ? 'checked' : ''}><span class="props-toggle-box"><i class="fa-solid fa-user-secret"></i></span><span class="props-toggle-text">Anonyme Antworten</span></label>
      <label class="props-toggle"><input type="checkbox" id="set-moderation" ${s.moderation ? 'checked' : ''}><span class="props-toggle-box"><i class="fa-solid fa-shield"></i></span><span class="props-toggle-text">Moderation</span></label>
      <label class="props-toggle"><input type="checkbox" id="set-live" ${s.showResultsLive !== false ? 'checked' : ''}><span class="props-toggle-box"><i class="fa-solid fa-chart-simple"></i></span><span class="props-toggle-text">Live-Ergebnisse</span></label>
      <label class="props-toggle"><input type="checkbox" id="set-multi" ${s.multipleResponses ? 'checked' : ''}><span class="props-toggle-box"><i class="fa-solid fa-repeat"></i></span><span class="props-toggle-text">Mehrfach-Antworten</span></label>
      <label class="props-toggle"><input type="checkbox" id="set-profanity" ${s.profanityFilter !== false ? 'checked' : ''}><span class="props-toggle-box"><i class="fa-solid fa-filter"></i></span><span class="props-toggle-text">Profanity-Filter</span></label>
    </div>
    <p class="props-hint"><i class="fa-solid fa-circle-info"></i> Name & Avatar werden bei Teilnahme immer abgefragt.</p>
    <div class="props-label">Zeitlimit (Sek., 0 = aus)</div><input id="set-time" type="number" min="0" value="${s.timeLimitSec || 0}" />`;

  const saveContent = debounce(async () => {
    const slideObj = currentSlide();
    if (!slideObj) return;
    collectOptionsFromPanel();
    collectStyleFromPanel();
    slideObj.content = {
      ...defaultStyle(),
      ...slideObj.content,
      title: $('#prop-title')?.value || '',
      subtitle: $('#prop-subtitle')?.value ?? slideObj.content.subtitle,
      prompt: $('#prop-prompt')?.value || '',
      body: ['content', 'section'].includes(slideObj.slide_type) || slideObj.content.sopKind
        ? ($('#prop-prompt')?.value || slideObj.content.body)
        : slideObj.content.body,
      imageUrl: $('#prop-image')?.value ?? slideObj.content.imageUrl,
      min: Number($('#prop-min')?.value ?? slideObj.content.min ?? 1),
      max: Number($('#prop-max')?.value ?? slideObj.content.max ?? 10),
      minLabel: $('#prop-min-label')?.value ?? slideObj.content.minLabel,
      maxLabel: $('#prop-max-label')?.value ?? slideObj.content.maxLabel,
      maxSelections: Number($('#prop-max-sel')?.value ?? slideObj.content.maxSelections ?? 3),
    };
    panel.querySelectorAll('[data-opt="color"]').forEach((inp) => {
      const idx = Number(inp.dataset.idx);
      if (slideObj.content.options?.[idx]) slideObj.content.options[idx].color = inp.value;
    });
    slideObj.settings = {
      ...slideObj.settings,
      anonymous: $('#set-anonymous')?.checked,
      moderation: $('#set-moderation')?.checked,
      showResultsLive: $('#set-live')?.checked,
      multipleResponses: $('#set-multi')?.checked,
      profanityFilter: $('#set-profanity')?.checked,
      askName: true,
      timeLimitSec: Number($('#set-time')?.value || 0),
    };
    if (COLLECT_CHAIN_TYPES.has(slideObj.slide_type) && !slideObj.content?.sopTrackKey && !slideObj.content?.sopTrackClass) {
      setCollectChainSettings(slideObj, {
        attachRank: !!$('#set-slide-rank')?.checked,
        attachResults: !!$('#set-slide-results')?.checked,
        voteMax: Number($('#set-slide-vote-max')?.value || 2),
      });
    } else if (chainCap.canResults && !chainCap.needsRankForResults) {
      slideObj.settings.slideAttachResults = !!$('#set-slide-results')?.checked;
    }
    await persistSlide(slideObj);
  }, 700);

  const saveSlideChain = async () => {
    const slideObj = currentSlide();
    if (!slideObj || isSopSlide) return;
    const cap = analyzeSlideChainCapability(slideObj);
    if (COLLECT_CHAIN_TYPES.has(slideObj.slide_type)) {
      setCollectChainSettings(slideObj, {
        attachRank: !!$('#set-slide-rank')?.checked,
        attachResults: !!$('#set-slide-results')?.checked,
        voteMax: Number($('#set-slide-vote-max')?.value || 2),
      });
      await persistSlide(slideObj);
      await syncCollectChainSlides(slideObj);
    } else if (cap.canResults && !cap.needsRankForResults) {
      slideObj.settings.slideAttachResults = !!$('#set-slide-results')?.checked;
      await persistSlide(slideObj);
      await syncSlideResultsChain(slideObj);
    } else {
      return;
    }
    renderEditorProps();
    renderSlideList();
    renderEditorCanvas();
    toast('Folien-Kette aktualisiert', 'success');
  };

  panel.querySelectorAll('input,textarea').forEach((el) => {
    el.addEventListener('input', saveContent);
    el.addEventListener('change', saveContent);
  });
  $('#set-slide-rank')?.addEventListener('change', () => {
    const on = $('#set-slide-rank')?.checked;
    const resultsEl = $('#set-slide-results');
    const maxEl = $('#set-slide-vote-max');
    if (resultsEl) {
      resultsEl.disabled = !on;
      if (!on) resultsEl.checked = false;
    }
    if (maxEl) maxEl.disabled = !on;
    void saveSlideChain();
  });
  $('#set-slide-results')?.addEventListener('change', () => { void saveSlideChain(); });
  $('#set-slide-vote-max')?.addEventListener('change', () => { void saveSlideChain(); });
  panel.querySelectorAll('[data-rm-opt]').forEach((btn) => btn.addEventListener('click', () => {
    currentSlide().content.options.splice(Number(btn.dataset.rmOpt), 1);
    saveContent();
    renderEditorProps();
    renderEditorCanvas();
  }));
  $('#btn-add-option')?.addEventListener('click', () => {
    const slideObj = currentSlide();
    slideObj.content.options = slideObj.content.options || [];
    slideObj.content.options.push({ id: uid().slice(0, 8), text: 'Neue Option', color: slideObj.content.accentColor || '#206efb' });
    saveContent();
    renderEditorProps();
    renderEditorCanvas();
  });
  $('#props-close-mobile')?.addEventListener('click', () => panel.classList.remove('mobile-open'));
}

async function persistSlide(slideObj) {
  setEditorSaveStatus('saving');
  try {
    await sb.from('lp_slides').update({ content: slideObj.content, settings: slideObj.settings }).eq('id', slideObj.id);
    await sb.from('lp_presentations').update({ updated_at: new Date().toISOString() }).eq('id', State.presentation.id);
    setEditorSaveStatus('saved');
  } catch (err) {
    setEditorSaveStatus('error');
    toast(err?.message || 'Speichern fehlgeschlagen', 'error');
    return;
  }
  renderEditorCanvas();
}

async function persistSlideOrder() {
  await Promise.all(State.slides.map((s) => sb.from('lp_slides').update({ sort_order: s.sort_order }).eq('id', s.id)));
}

function renderAddSlideModal() {
  const grid = $('#slide-type-grid');
  const typeCards = [
    ...window.LP_SLIDE_TYPES.map((t) => `
    <button type="button" class="type-card" data-type="${t.type}">
      <h3><i class="fa-solid ${t.icon}"></i> ${esc(t.label)}</h3>
      <p>${esc(t.desc)}</p>
    </button>`),
    ...ADD_CLOSURE_CARDS.map((t) => `
    <button type="button" class="type-card type-card--closure" data-type="${t.type}">
      <h3><i class="fa-solid ${t.icon}"></i> ${esc(t.label)}</h3>
      <p>${esc(t.desc)}</p>
    </button>`),
  ].join('');
  grid.innerHTML = typeCards;
  refreshAddSlideClosureUi();
  grid.querySelectorAll('.type-card').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      if (type === 'presentation_results' || type === 'presentation_closing') {
        showAddSlideOptions(type);
        return;
      }
      const base = JSON.parse(JSON.stringify(window.LP_DEFAULT_CONTENT[type] || { title: 'Neu' }));
      const settings = { ...window.LP_DEFAULT_SETTINGS };
      const content = { ...defaultStyle(), ...base };
      if (type === 'section' || type === 'content') {
        content.layout = $('#add-slide-center')?.checked ? 'center' : 'default';
      }
      if (type === 'brainstorm') {
        settings.brainstormAttachRanking = !!$('#add-chain-rank')?.checked;
        settings.brainstormAttachResults = !!$('#add-chain-results')?.checked;
        settings.brainstormVoteMax = Number($('#add-chain-max')?.value || 2);
      } else if (type === 'open' || type === 'wordcloud') {
        settings.slideAttachRanking = !!$('#add-chain-rank')?.checked;
        settings.slideAttachResults = !!$('#add-chain-results')?.checked;
        settings.slideAttachVoteMax = Number($('#add-chain-max')?.value || 2);
      }
      const { data } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: State.slides.length,
        slide_type: type,
        content,
        settings,
      }).select().single();
      State.slides.push(data);
      if ((type === 'brainstorm' && settings.brainstormAttachRanking) || ((type === 'open' || type === 'wordcloud') && settings.slideAttachRanking)) {
        await syncCollectChainSlides(data);
      }
      State.selectedSlideId = data.id;
      closeModal('modal-add-slide');
      renderEditor();
    });
    btn.addEventListener('mouseenter', () => showAddSlideOptions(btn.dataset.type));
  });
  showAddSlideOptions(null);
}

function bindAddSlideModalControls() {
  if (State.addSlideModalBound) return;
  State.addSlideModalBound = true;
  $('#btn-toggle-pres-results')?.addEventListener('click', () => { void togglePresentationClosureCard('presentation_results'); });
  $('#btn-toggle-pres-closing')?.addEventListener('click', () => { void togglePresentationClosureCard('presentation_closing'); });
  $('#add-results-confetti')?.addEventListener('change', () => {
    void savePresentationClosureFromModal({ resultsConfetti: $('#add-results-confetti')?.checked !== false });
  });
  document.querySelectorAll('#add-closure-results-panel .add-closure-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setResultsDisplayMode(btn.dataset.resultsMode);
      refreshAddSlideClosureUi();
    });
  });
  $('#add-closing-title')?.addEventListener('change', async () => {
    const title = $('#add-closing-title')?.value || '';
    await savePresentationClosureFromModal({ closingTitle: title });
    const slide = findPresentationClosingSlide();
    if (slide) {
      slide.content.title = title;
      await sb.from('lp_slides').update({ content: slide.content }).eq('id', slide.id);
      renderEditorCanvas();
    }
  });
  $('#add-closing-body')?.addEventListener('change', async () => {
    const body = $('#add-closing-body')?.value || '';
    await savePresentationClosureFromModal({ closingBody: body });
    const slide = findPresentationClosingSlide();
    if (slide) {
      slide.content.body = body;
      await sb.from('lp_slides').update({ content: slide.content }).eq('id', slide.id);
      renderEditorCanvas();
    }
  });
}

async function saveVersionSnapshot() {
  const snapshot = { slides: State.slides, title: State.presentation.title };
  await sb.from('lp_presentation_versions').insert({
    presentation_id: State.presentation.id,
    label: new Date().toLocaleString('de-DE'),
    snapshot,
    created_by: State.user.id,
  });
  toast('Version gespeichert', 'success');
}

async function openVersionsModal() {
  const { data: versions } = await sb.from('lp_presentation_versions')
    .select('*').eq('presentation_id', State.presentation.id).order('created_at', { ascending: false });
  const list = $('#versions-list');
  list.innerHTML = (versions || []).length
    ? versions.map((v) => `
      <div class="version-row">
        <div><strong>${esc(v.label || 'Version')}</strong><div class="version-meta">${new Date(v.created_at).toLocaleString('de-DE')}</div></div>
        <button type="button" class="btn-secondary btn-sm" data-restore="${v.id}">Wiederherstellen</button>
      </div>`).join('')
    : '<p style="color:var(--muted)">Noch keine Versionen gespeichert.</p>';
  list.querySelectorAll('[data-restore]').forEach((btn) => btn.addEventListener('click', () => restoreVersion(btn.dataset.restore, versions)));
  openModal('modal-versions');
}

async function restoreVersion(versionId, versions) {
  const ver = versions.find((v) => v.id === versionId);
  if (!ver || !confirm('Aktuelle Folien durch diese Version ersetzen?')) return;
  const snap = ver.snapshot;
  await sb.from('lp_slides').delete().eq('presentation_id', State.presentation.id);
  const rows = (snap.slides || []).map((s, i) => ({
    presentation_id: State.presentation.id,
    sort_order: i,
    slide_type: s.slide_type,
    content: s.content,
    settings: s.settings || { ...window.LP_DEFAULT_SETTINGS },
  }));
  const { data: inserted } = await sb.from('lp_slides').insert(rows).select('*');
  if (snap.title) {
    await sb.from('lp_presentations').update({ title: snap.title }).eq('id', State.presentation.id);
    State.presentation.title = snap.title;
    $('#editor-title').value = snap.title;
  }
  State.slides = inserted || [];
  State.selectedSlideId = State.slides[0]?.id || null;
  closeModal('modal-versions');
  renderEditor();
  toast('Version wiederhergestellt', 'success');
}

/* ─── SESSION / PRESENT ─── */
async function startPresentation() {
  await sb.from('lp_sessions').update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('presentation_id', State.presentation.id).eq('status', 'live');
  await sb.from('lp_presentations').update({ status: 'active' }).eq('id', State.presentation.id);

  let code = genCode();
  for (let i = 0; i < 8; i++) {
    const { data: exists } = await sb.from('lp_sessions').select('id').eq('code', code).maybeSingle();
    if (!exists) break;
    code = genCode();
  }
  const { data: session, error } = await sb.from('lp_sessions').insert({
    presentation_id: State.presentation.id,
    host_id: State.user.id,
    code,
    status: 'live',
    question_open: true,
    current_slide_index: 0,
  }).select().single();
  if (error) { toast(error.message, 'error'); return; }
  State.session = session;
  State.responses = [];
  State.participants = [];
  State._debugSeeded = false; // ← Re-Seed erlauben bei jeder neuen Session
  location.hash = `#present/${session.id}`;
  showScreen('present');
  await loadSessionData();
  subscribeSessionChannel();
  renderPresentParticipants();
  renderPresent();
  bindPresentToolbar();
  toast(`Session gestartet – Code ${code}`, 'success');
}

async function loadSessionData() {
  const [{ data: slides }, { data: responses }, { data: participants }, { data: pres }] = await Promise.all([
    sb.from('lp_slides').select('*').eq('presentation_id', State.session.presentation_id).order('sort_order'),
    sb.from('lp_responses').select('*').eq('session_id', State.session.id).order('created_at'),
    sb.from('lp_participants').select('*').eq('session_id', State.session.id),
    sb.from('lp_presentations').select('*').eq('id', State.session.presentation_id).maybeSingle(),
  ]);
  if (pres) State.presentation = pres;
  State.resultsDisplayMode = getPresentationSettings().resultsDisplayMode || 'percent';
  State.slides = normalizeSlides(slides);
  State.responses = responses || [];
  State.participants = participants || [];
  // ─── DEBUG-Modus: Wenn Präsentations-Titel mit [DEBUG] beginnt, injiziere
  //     simulierte Teilnehmer + Antworten lokal (keine DB-Schreibvorgänge).
  const t = String(State.presentation?.title || '');
  if (t.toUpperCase().includes('[DEBUG]') || State.presentation?.settings?.debug) {
    seedDebugSession();
  }
}

function sessionChannelName(sessionId) {
  return `lp-session-${sessionId}`;
}

// ════════════════════════════════════════════════════════════════
// DEBUG-MODE — Realtime-Simulator
// Teilnehmer joinen zeitversetzt, Antworten kommen drip-by-drip wie in
// einem echten Workshop. Alles ausschließlich client-seitig.
// ════════════════════════════════════════════════════════════════
const LP_DebugSim = {
  active: false,
  joinIdx: 0,
  joinTimer: null,
  responsesBySlide: new Map(), // slideId -> [{ response, delayMs }]
  pendingTimers: [],            // alle setTimeout IDs zum Aufräumen
  triggeredSlides: new Set(),   // slideIds wo Drip schon gestartet wurde
  speed: 1,                     // 1 = normal, 2 = 2x schnell, 0.5 = halbe

  start() {
    this.stop();
    this.active = true;
    this.joinIdx = 0;
    this.triggeredSlides = new Set();
    this.responsesBySlide = new Map();
    this.pendingTimers = [];
    this.prepareResponses();
    this.dripNextParticipant();
    // Für aktuellen Slide schon vorbereiten
    setTimeout(() => this.maybeDripCurrentSlide(), 1500 / this.speed);
    try { toast(`🛠 DEBUG-Simulator gestartet — 6 Teilnehmer joinen jetzt zeitversetzt`, 'info'); } catch {}
  },

  stop() {
    this.active = false;
    if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
    this.pendingTimers.forEach((t) => clearTimeout(t));
    this.pendingTimers = [];
  },

  schedule(fn, ms) {
    const t = setTimeout(() => {
      this.pendingTimers = this.pendingTimers.filter((x) => x !== t);
      if (this.active) fn();
    }, Math.max(0, ms / this.speed));
    this.pendingTimers.push(t);
    return t;
  },

  // ─── Teilnehmer drip-by-drip joinen lassen ──────────────────
  dripNextParticipant() {
    if (!this.active) return;
    const defs = window.LP_DEBUG_PARTICIPANTS || [];
    if (this.joinIdx >= defs.length) return;
    const p = defs[this.joinIdx];
    const sessionId = State.session?.id;
    const fake = {
      id: `debug-p-${this.joinIdx}-${sessionId}`,
      session_id: sessionId,
      device_id: `debug-d-${this.joinIdx}`,
      display_name: p.name,
      avatar_emoji: p.emoji,
      avatar_color: p.color,
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };
    if (!State.participants.find((x) => x.id === fake.id)) {
      State.participants.push(fake);
      try { pushPresentActivity(fake.id, 'ist beigetreten'); } catch {}
    }
    try { updatePresentStats(); } catch {}
    try { renderPresentParticipants(); } catch {}
    try { renderPresent(); } catch {}
    this.joinIdx++;
    if (this.joinIdx < defs.length) {
      const next = 700 + Math.random() * 1300; // 0.7–2.0s
      this.joinTimer = setTimeout(() => this.dripNextParticipant(), next / this.speed);
    }
  },

  // ─── Antworten vorbereiten (alle Slides) ────────────────────
  prepareResponses() {
    if (!Array.isArray(State.slides) || !State.slides.length) return;
    const PHASE_USE_CASES = window.LP_DEBUG_PHASE_USE_CASES || {};
    const defs = window.LP_DEBUG_PARTICIPANTS || [];
    const sessionId = State.session?.id;
    const now = Date.now();
    function pseudoRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

    // First pass: brainstorm slides
    const allCollected = [];
    State.slides.forEach((slide) => {
      if (slide.slide_type !== 'brainstorm') return;
      const c = slide.content || {};
      const phaseName = c.sopPhaseName || c.title || '';
      const useCases = PHASE_USE_CASES[phaseName] || PHASE_USE_CASES[c.title] || [];
      if (!useCases.length) return;
      const queue = [];
      useCases.forEach((text, i) => {
        const pIdx = i % defs.length;
        const fakeP = `debug-p-${pIdx}-${sessionId}`;
        const respId = `debug-r-${slide.id}-${i}`;
        const response = {
          id: respId,
          session_id: sessionId,
          slide_id: slide.id,
          participant_id: fakeP,
          response: { text },
          is_hidden: false,
          created_at: new Date(now + i * 100).toISOString(),
          updated_at: new Date(now + i * 100).toISOString(),
        };
        // Drip-Delay: 600ms–2.4s zwischen Antworten
        const delayMs = 800 + i * (1100 + Math.random() * 800);
        queue.push({ response, delayMs });
        allCollected.push({
          slideId: slide.id,
          respId,
          text,
          phaseName,
          trackLabel: c.sopTrackLabel || '',
          trackKey: c.sopTrackKey || c.sopTrackClass || '',
        });
      });
      this.responsesBySlide.set(slide.id, queue);
    });

    // Second pass: alle anderen Slide-Typen
    State.slides.forEach((slide) => {
      const type = slide.slide_type;
      if (!isInteractive(type) || type === 'brainstorm') return;
      const c = slide.content || {};
      const st = slide.settings || {};
      const queue = [];
      defs.forEach((p, idx) => {
        const fakeP = `debug-p-${idx}-${sessionId}`;
        const respId = `debug-r-${slide.id}-${fakeP}`;
        let response = null;

        if (type === 'mc_single' || type === 'yesno' || type === 'quiz') {
          const opts = type === 'yesno' ? [{ id: 'yes' }, { id: 'no' }] : (c.options || []);
          if (!opts.length) return;
          const choice = opts[Math.floor(pseudoRandom(idx + (slide.id.charCodeAt(0) || 0)) * opts.length)];
          if (type === 'quiz') {
            const correct = opts.find((o) => o.correct);
            response = { value: choice.id, correct: correct && choice.id === correct.id };
          } else {
            response = { value: choice.id };
          }
        } else if (type === 'mc_multi') {
          if (st.sopCardVote || st.sopTrackVote || st.brainstormVote || st.sopAllTracksVote) {
            const max = st.sopVoteMax || c.maxSelections || 2;
            const scopedCollected = st.sopTrackVote
              ? allCollected.filter((it) => it.trackKey === (c.sopTrackKey || c.sopTrackClass))
              : allCollected;
            if (scopedCollected.length) {
              const picked = [...scopedCollected].sort(() => pseudoRandom(idx + slide.id.length) - 0.5).slice(0, max);
              response = { values: picked.map((it) => `resp-${it.respId}`) };
            }
          } else {
            const opts = c.options || [];
            const max = c.maxSelections || 3;
            const shuffled = [...opts].sort(() => pseudoRandom(idx) - 0.5).slice(0, Math.min(max, Math.max(1, opts.length)));
            if (shuffled.length) response = { values: shuffled.map((o) => o.id) };
          }
        } else if (type === 'wordcloud') {
          const words = ['effizienz', 'automation', 'geschwindigkeit', 'qualität', 'präzision', 'transparenz', 'skalierbar', 'innovation'];
          response = { text: words[idx % words.length] };
        } else if (type === 'open' || type === 'qa') {
          const samples = ['Großartig — direkt umsetzbar.', 'Bin gespannt auf die Pilot-Phase.', 'Sehr wertvoll für unsere Workflows.', 'Brauchen wir, um schneller zu werden.', 'Klare Action Items für die nächsten 14 Tage.', 'Spannend! Wer übernimmt das?'];
          response = { text: samples[idx % samples.length] };
        } else if (type === 'scale') {
          const min = c.min ?? 0, max = c.max ?? 10;
          response = { value: Math.round(min + pseudoRandom(idx + slide.id.length) * (max - min)) };
        } else if (type === 'number_guess') {
          response = { value: Math.round(100 + pseudoRandom(idx) * 500) };
        } else if (type === 'reaction') {
          const reactions = ['👍', '❤️', '🎉', '😂', '😮', '👏'];
          response = { emoji: reactions[idx % reactions.length] };
        } else if (type === 'ranking') {
          const opts = c.options || [];
          if (opts.length) response = { order: [...opts].sort(() => pseudoRandom(idx) - 0.5).map((o) => o.id) };
        } else if (type === 'percent_split') {
          if (st.sopAllTracksVote || st.sopTrackVote) {
            const scopedCollected = st.sopTrackVote
              ? allCollected.filter((it) => it.trackKey === (c.sopTrackKey || c.sopTrackClass))
              : allCollected;
            if (scopedCollected.length) {
              const pool = [...scopedCollected].sort(() => pseudoRandom(idx) - 0.5).slice(0, 5);
              const points = {}; let remaining = 100;
              pool.forEach((it, i) => {
                const pts = i === pool.length - 1 ? remaining : Math.max(5, Math.floor(remaining * (0.2 + pseudoRandom(idx + i) * 0.4)));
                points[`resp-${it.respId}`] = Math.min(pts, remaining);
                remaining -= points[`resp-${it.respId}`];
              });
              response = { points };
            }
          } else {
            const opts = c.options || [];
            if (opts.length) {
              const points = {}; let remaining = 100;
              opts.forEach((o, i) => {
                const pts = i === opts.length - 1 ? remaining : Math.floor(remaining / (opts.length - i));
                points[o.id] = pts; remaining -= pts;
              });
              response = { points };
            }
          }
        } else if (type === 'priority_matrix') {
          const quadrants = ['qw', 'sb', 'ts', 'dr'];
          const weights = [0.4, 0.3, 0.15, 0.15];
          const matrix = {}, meta = {};
          allCollected.forEach((it, i) => {
            const r = pseudoRandom(idx * 31 + i);
            let acc = 0, picked = 'qw';
            for (let q = 0; q < quadrants.length; q++) {
              acc += weights[q];
              if (r <= acc) { picked = quadrants[q]; break; }
            }
            matrix[it.respId] = picked;
            meta[it.respId] = { text: it.text, phase: it.phaseName, trackLabel: it.trackLabel };
          });
          response = { matrix, meta };
        } else if (type === 'pin_image') {
          response = { pin: { x: Math.round(pseudoRandom(idx) * 100), y: Math.round(pseudoRandom(idx + 1) * 100) } };
        }

        if (response) {
          const full = {
            id: respId,
            session_id: sessionId,
            slide_id: slide.id,
            participant_id: fakeP,
            response,
            is_hidden: false,
            created_at: new Date(now + idx * 200).toISOString(),
            updated_at: new Date(now + idx * 200).toISOString(),
          };
          // Drip-Delay: 1.2–3.5s zwischen Antworten (zufällig pro Teilnehmer)
          const delayMs = 1000 + idx * (1400 + Math.random() * 1500);
          queue.push({ response: full, delayMs });
        }
      });
      if (queue.length) this.responsesBySlide.set(slide.id, queue);
    });
  },

  // ─── Drip-Funktion: läuft, wenn Host zu einem Slide wechselt ──
  maybeDripCurrentSlide() {
    if (!this.active) return;
    const idx = State.session?.current_slide_index || 0;
    const slide = State.slides[idx];
    if (!slide || this.triggeredSlides.has(slide.id)) return;
    const queue = this.responsesBySlide.get(slide.id);
    if (!queue || !queue.length) return;
    this.triggeredSlides.add(slide.id);
    queue.forEach((item) => {
      this.schedule(() => {
        // Skip wenn Teilnehmer noch nicht da → später nochmal versuchen
        const haveP = State.participants.find((p) => p.id === item.response.participant_id);
        if (!haveP) {
          this.schedule(() => this.pushResponse(item.response), 1500);
          return;
        }
        this.pushResponse(item.response);
      }, item.delayMs);
    });
  },

  pushResponse(response) {
    // Dedupe
    if (State.responses.find((r) => r.id === response.id)) return;
    State.responses.push(response);
    try { if (response.participant_id) pushPresentActivity(response.participant_id); } catch {}
    try { updatePresentStats(); } catch {}
    try { renderPresent(); } catch {}
  },

  setSpeed(s) {
    this.speed = Math.max(0.25, Math.min(10, Number(s) || 1));
    console.info(`[DebugSim] Speed = ${this.speed}x`);
  },

  // Sofort-Modus: alles auf einmal (für QA-Sprung)
  flushAll() {
    this.responsesBySlide.forEach((queue, slideId) => {
      this.triggeredSlides.add(slideId);
      queue.forEach((item) => {
        if (!State.responses.find((r) => r.id === item.response.id)) {
          State.responses.push(item.response);
        }
      });
    });
    const defs = window.LP_DEBUG_PARTICIPANTS || [];
    const sessionId = State.session?.id;
    defs.forEach((p, idx) => {
      const id = `debug-p-${idx}-${sessionId}`;
      if (!State.participants.find((x) => x.id === id)) {
        State.participants.push({
          id, session_id: sessionId, device_id: `debug-d-${idx}`,
          display_name: p.name, avatar_emoji: p.emoji, avatar_color: p.color,
          joined_at: new Date().toISOString(),
        });
      }
    });
    this.joinIdx = defs.length;
    if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
    try { renderPresentParticipants(); updatePresentStats(); renderPresent(); } catch {}
    console.info('[DebugSim] flushAll: alle Antworten + Teilnehmer sofort injiziert');
  },
};
window.LP_DebugSim = LP_DebugSim;

// ─── DEBUG-Panel im Präsentations-Modus injizieren ───
function ensureDebugPanel() {
  if (document.getElementById('lp-debug-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'lp-debug-panel';
  panel.className = 'lp-debug-panel';
  panel.innerHTML = `
    <div class="lp-debug-panel-head">
      <i class="fa-solid fa-flask-vial"></i>
      <span class="lp-dbg-title">DEBUG-Simulator</span>
      <button class="lp-debug-collapse" id="lp-dbg-collapse" title="Ein-/Ausblenden"><i class="fa-solid fa-chevron-up"></i></button>
    </div>
    <div class="lp-debug-body">
      <div class="lp-debug-row"><span>Status:</span><strong id="lp-dbg-status">aktiv</strong></div>
      <div class="lp-debug-row"><span>Teilnehmer:</span><strong id="lp-dbg-participants">0</strong></div>
      <div class="lp-debug-row"><span>Antworten:</span><strong id="lp-dbg-responses">0</strong></div>
      <div class="lp-debug-row" style="gap:.4rem"><span>Speed:</span>
        <div class="lp-debug-btn-grp">
          <button class="lp-debug-btn" data-speed="0.5">0.5x</button>
          <button class="lp-debug-btn active" data-speed="1">1x</button>
          <button class="lp-debug-btn" data-speed="2">2x</button>
          <button class="lp-debug-btn" data-speed="5">5x</button>
        </div>
      </div>
      <div class="lp-debug-btn-grp">
        <button class="lp-debug-btn warn" id="lp-dbg-flush">⚡ Alles sofort</button>
        <button class="lp-debug-btn danger" id="lp-dbg-reset">Reset</button>
      </div>
      <div class="lp-debug-status" id="lp-dbg-current">Slide: 1</div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.querySelectorAll('[data-speed]').forEach((b) => {
    b.onclick = () => {
      LP_DebugSim.setSpeed(parseFloat(b.dataset.speed));
      panel.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('active', x === b));
    };
  });
  panel.querySelector('#lp-dbg-flush').onclick = () => LP_DebugSim.flushAll();
  panel.querySelector('#lp-dbg-reset').onclick = () => window.LP_resetDebug?.();
  // Collapse-Toggle: speichert Status in localStorage
  const applyCollapse = (collapsed) => {
    panel.classList.toggle('collapsed', collapsed);
    const icon = panel.querySelector('#lp-dbg-collapse i');
    if (icon) icon.className = collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
    try { localStorage.setItem('lp_dbg_collapsed', collapsed ? '1' : '0'); } catch {}
  };
  applyCollapse(localStorage.getItem('lp_dbg_collapsed') === '1');
  panel.querySelector('#lp-dbg-collapse').onclick = () => applyCollapse(!panel.classList.contains('collapsed'));
  panel.querySelector('.lp-debug-panel-head').onclick = (e) => {
    if (e.target.closest('#lp-dbg-collapse')) return; // schon vom Button erledigt
    if (panel.classList.contains('collapsed')) applyCollapse(false);
  };
  setInterval(() => {
    if (!document.getElementById('lp-debug-panel')) return;
    const cnt = State.responses.filter((r) => String(r.id).startsWith('debug-r-')).length;
    const pcnt = State.participants.filter((p) => String(p.id).startsWith('debug-p-')).length;
    const idx = State.session?.current_slide_index || 0;
    document.getElementById('lp-dbg-participants').textContent = pcnt;
    document.getElementById('lp-dbg-responses').textContent = cnt;
    document.getElementById('lp-dbg-current').textContent = `Slide: ${idx + 1} / ${State.slides?.length || 0}`;
    document.getElementById('lp-dbg-status').textContent = LP_DebugSim.active ? `aktiv (${LP_DebugSim.speed}x)` : 'pausiert';
  }, 800);
}

function removeDebugPanel() {
  document.getElementById('lp-debug-panel')?.remove();
}

function seedDebugSession() {
  if (State._debugSeeded) {
    console.info('[DEBUG-Sim] bereits initialisiert — übersprungen. Reset mit LP_resetDebug().');
    return;
  }
  if (!State.session) { console.warn('[DEBUG-Sim] keine Session'); return; }
  if (!Array.isArray(State.slides) || !State.slides.length) {
    console.warn('[DEBUG-Sim] keine Slides geladen');
    return;
  }
  State._debugSeeded = true;
  ensureDebugPanel();
  LP_DebugSim.start();
}

// Manual debug helpers exposed on window for console access
window.LP_seedDebug = function () { State._debugSeeded = false; seedDebugSession(); };
window.LP_resetDebug = function () {
  LP_DebugSim.stop();
  State.responses = (State.responses || []).filter((r) => !String(r.id).startsWith('debug-r-'));
  State.participants = (State.participants || []).filter((p) => !String(p.id).startsWith('debug-p-'));
  State._debugSeeded = false;
  removeDebugPanel();
  if (typeof renderPresent === 'function') renderPresent();
  if (typeof renderPresentParticipants === 'function') renderPresentParticipants();
  console.info('[DEBUG-Sim] zurückgesetzt');
};

function applySessionPatch(patch) {
  if (!State.session) return;
  State.session = { ...State.session, ...patch };
}

function broadcastSessionPatch(patch) {
  applySessionPatch(patch);
  try {
    State.sessionChannel?.send({ type: 'broadcast', event: 'session_sync', payload: patch });
  } catch { /* channel may not be ready */ }
}

function handleParticipantSessionEnd() {
  stopParticipantSync();
  $('#participant-root').innerHTML = '<div class="participant-card"><h1>Session beendet</h1><p>Vielen Dank für deine Teilnahme.</p></div>';
}

function stopParticipantSync() {
  if (State.participantPoll) {
    clearInterval(State.participantPoll);
    State.participantPoll = null;
  }
}

function startParticipantSync() {
  stopParticipantSync();
  State.participantPoll = setInterval(async () => {
    if (!State.session?.id || !State.participant) return;
    const { data } = await sb.from('lp_sessions')
      .select('current_slide_index, question_open, status')
      .eq('id', State.session.id)
      .maybeSingle();
    if (!data) return;
    const prevIndex = State.session.current_slide_index;
    const changed = data.current_slide_index !== prevIndex
      || data.question_open !== State.session.question_open
      || data.status !== State.session.status;
    if (!changed) return;
    applySessionPatch(data);
    if (data.current_slide_index !== prevIndex) {
      await ensureParticipantResponses(true);
    }
    if (data.status === 'ended') {
      handleParticipantSessionEnd();
      return;
    }
    await renderParticipantQuestion();
  }, 2500);
}

function subscribeSessionChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  const chName = sessionChannelName(State.session.id);
  State.sessionChannel = sb.channel(chName)
    .on('broadcast', { event: 'session_sync' }, ({ payload }) => {
      window.LP?.channelHeartbeat(chName);
      applySessionPatch(payload || {});
      renderPresent();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      State.session = { ...State.session, ...payload.new };
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      State.responses.push(payload.new);
      if (payload.new.participant_id) pushPresentActivity(payload.new.participant_id);
      renderPresent();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      const idx = State.responses.findIndex((r) => r.id === payload.new.id);
      if (idx >= 0) State.responses[idx] = payload.new;
      else State.responses.push(payload.new);
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_participants', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      if (!State.participants.find((p) => p.id === payload.new.id)) {
        State.participants.push(payload.new);
        pushPresentActivity(payload.new.id, 'ist beigetreten');
      }
      updatePresentStats();
      renderPresentParticipants();
      renderPresent();
    })
    .on('system', {}, () => window.LP?.channelHeartbeat(chName))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') window.LP?.channelHeartbeat(chName);
    });
  window.LP?.registerChannel(chName, () => subscribeSessionChannel());
}

function currentSessionSlide() {
  return State.slides[State.session?.current_slide_index || 0];
}

function getVisibleResponses(slideId) {
  return State.responses.filter((r) => r.slide_id === slideId && !r.is_hidden);
}

function getPendingResponses(slideId) {
  return State.responses.filter((r) => r.slide_id === slideId && r.is_hidden);
}

function updatePresentHeader() {
  const titleEl = $('#present-title');
  if (titleEl) titleEl.textContent = State.presentation?.title || 'Präsentation';
}

function renderPresent() {
  const slide = currentSessionSlide();
  const stage = $('#present-stage');
  if (!slide) { stage.innerHTML = '<h1>Keine Folien</h1>'; return; }
  const c = slide.content || {};
  // DEBUG-Simulator: bei jedem Slide-Wechsel die Antworten für diesen Slide
  // zeitversetzt drippen (nur einmal pro Slide via triggeredSlides-Set)
  if (window.LP_DebugSim?.active) window.LP_DebugSim.maybeDripCurrentSlide();
  // #13 Track-Farb-Coding: propagiere SOP-Track-Class auf Stage-Wrapper,
  // damit CSS-Akzente (Header-Border, Badge-Farben) automatisch zur Geltung kommen.
  const trackClass = c.sopTrackClass || c.sopTrackKey || '';
  stage.dataset.trackClass = trackClass;
  const stageWrap = stage.closest('.present-stage-wrap') || stage.parentElement;
  if (stageWrap) stageWrap.dataset.trackClass = trackClass;
  const interactive = isInteractive(slide.slide_type);
  const visible = getVisibleResponses(slide.id);
  const pending = getPendingResponses(slide.id);
  const displaySlide = getTrackVoteDisplaySlide(slide);
  const agg = window.LPViz.aggregateResponses(displaySlide, visible);

  let viz = '';
  if (!interactive) {
    if (c.sopAllTracksResults || slide.settings?.sopAllTracksResults) {
      viz = `<div class="sop-track-results-wrap">${renderAllTracksResultsHtml()}</div>`;
    } else if (c.sopTrackResults && c.sopTrackKey) {
      viz = `<div class="sop-track-results-wrap">${renderSopTrackResultsHtml(c.sopTrackKey)}</div>`;
    } else if (slide.settings?.showPreviousSlideResults) {
      const prevSlide = State.slides[(State.session.current_slide_index || 0) - 1];
      if (prevSlide) {
        const prevVisible = getVisibleResponses(prevSlide.id);
        const prevAgg = window.LPViz.aggregateResponses(prevSlide, prevVisible);
        viz = `<div class="present-results-review">${window.LPViz.renderViz(prevSlide, prevAgg, 'present')}</div>`;
      }
    } else if (c.imageUrl) {
      viz = `<img src="${esc(c.imageUrl)}" alt="" style="max-width:min(720px,90vw);border-radius:16px;margin-top:1rem">`;
    }
  } else if (slide.settings?.showResultsLive !== false) {
    // Live-Ergebnisse für ALLE Slide-Typen (einheitlich wie SOP): Visualisierung
    // immer rendern, auch wenn noch keine Antwort vorliegt. Die einzelnen
    // Renderer (viz.js) zeigen leere Zustände passend an (Skelett-Balken,
    // "Antworten werden gesammelt…" für Brainstorm/Open).
    if (slide.settings?.sopCardVote || slide.settings?.brainstormVote) {
      viz = renderCardVotePresentHtml(displaySlide, visible);
    } else if (slide.settings?.sopTrackVote || slide.settings?.sopAllTracksVote) {
      viz = renderTrackVotePresentHtml(displaySlide, visible);
    } else if (slide.slide_type === 'open' || slide.slide_type === 'brainstorm') {
      viz = renderBrainstormPresentViz(slide, visible);
    } else {
      viz = window.LPViz.renderViz(displaySlide, agg, 'present', { displayMode: getResultsDisplayMode() });
    }
  } else {
    viz = `<div class="present-wait-msg">${State.session.question_open ? 'Antworten werden gesammelt…' : 'Frage geschlossen'}</div>`;
  }

  const modPanel = pending.length ? `
    <div class="present-mod-panel">
      <div class="present-mod-head">${pending.length} ausstehende Antworten</div>
      ${pending.slice(0, 5).map((r) => {
        const p = State.participants.find((x) => x.id === r.participant_id);
        const who = p ? `<span class="present-mod-who">${participantAvatarHtml(p, 'xs')} ${esc(p.display_name)}</span>` : '';
        return `
        <div class="present-mod-item">
          ${who}
          <span>${esc(r.response?.text || r.response?.value || JSON.stringify(r.response))}</span>
          <button type="button" class="present-mod-btn" data-approve="${r.id}">Freigeben</button>
          <button type="button" class="present-mod-btn danger" data-hide="${r.id}">Verbergen</button>
        </div>`;
      }).join('')}
    </div>` : '';

  const slideInk = c.textColor || 'var(--ink)';
  const slideMuted = c.subtextColor || 'var(--muted)';

  if (slide.slide_type === 'section' && c.sopTrackClass) {
    stage.innerHTML = wrapMentiSlide(`${renderSopSectionHtml(c)}`, State.session.current_slide_index || 0);
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    finalizePresentUi(slide);
    return;
  }

  if (slide.slide_type === 'section' && useCenteredLayout(slide)) {
    stage.innerHTML = wrapMentiSlide(renderCenteredSlideHtml(c, false, { icon: 'fa-heading' }), State.session.current_slide_index || 0);
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    finalizePresentUi(slide);
    return;
  }

  if (slide.settings?.presentationResults || slide.settings?.presentationClosing || isSlideResultsLinkedSlide(slide)) {
    let html = '';
    if (slide.settings?.presentationResults) {
      html = `${renderCenteredSlideHtml(c, false, { icon: 'fa-chart-column' })}
        <div class="viz-wrap viz-wrap-present">${renderPresentationResultsPresentHtml()}</div>`;
    } else if (slide.settings?.presentationClosing) {
      html = renderCenteredSlideHtml(c, false, { icon: 'fa-heart' });
    } else {
      const source = State.slides.find((s) => s.id === slide.content?.resultsSourceId);
      const srcVisible = source ? getVisibleResponses(source.id) : [];
      const srcDisplay = source ? getTrackVoteDisplaySlide(source) : null;
      const srcAgg = srcDisplay ? window.LPViz.aggregateResponses(srcDisplay, srcVisible) : { total: 0 };
      html = `${useCenteredLayout(slide) ? renderCenteredSlideHtml(c, false, { icon: 'fa-trophy' }) : `<h1 class="menti-q-title">${esc(c.title || 'Ergebnis')}</h1><p class="menti-q-prompt">${esc(c.body || '').replace(/\n/g, '<br>')}</p>`}
        <div class="viz-wrap viz-wrap-present">${srcDisplay ? window.LPViz.renderViz(srcDisplay, srcAgg, 'present', { displayMode: getResultsDisplayMode() }) : ''}</div>`;
    }
    stage.innerHTML = wrapMentiSlide(html, State.session.current_slide_index || 0);
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    finalizePresentUi(slide);
    return;
  }

  if (slide.slide_type === 'content' && (c.mentiHero || c.sopKind || c.sopTrackResults || isCardResultsSlide(slide))) {
    let html;
    if (isCardResultsSlide(slide)) {
      html = `<h1 class="menti-q-title">${esc(c.title || 'Ergebnis')}</h1>
        <p class="menti-q-prompt">${esc(c.body || '').replace(/\n/g, '<br>')}</p>
        <div class="viz-wrap viz-wrap-present">${renderCardResultsPresentHtml(slide)}</div>`;
    } else {
      html = c.mentiHero ? renderMentiHeroHtml(c) : renderSopContentHtml(c);
    }
    if (html) {
      stage.innerHTML = wrapMentiSlide(html, State.session.current_slide_index || 0);
      updatePresentHeader();
      updatePresentStats();
      renderPresentParticipants();
      void renderQrCode();
      syncSopWorkshopShell('present', State.session.current_slide_index || 0);
      finalizePresentUi(slide);
      return;
    }
  }

  if (slide.slide_type === 'content' && useCenteredLayout(slide) && !interactive) {
    stage.innerHTML = wrapMentiSlide(`${renderCenteredSlideHtml(c, false, { icon: 'fa-align-center' })}
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" style="max-width:min(720px,90vw);border-radius:16px;margin-top:1rem">` : ''}
      ${viz ? `<div class="viz-wrap viz-wrap-present">${viz}</div>` : ''}`, State.session.current_slide_index || 0);
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    finalizePresentUi(slide);
    return;
  }

  const sopBadge = renderSopQuestionBadge(c);
  const slideIdx = State.session.current_slide_index || 0;
  const workshopMode = getWorkshopMode(slide);

  if (isBrainstormCollectSlide(slide)) {
    stage.innerHTML = wrapMentiSlide(`
      ${renderWorkshopCardCollectHtml(c)}
      <div class="viz-wrap viz-wrap-present">${viz}</div>${modPanel}`, slideIdx);
    stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
    stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', slideIdx);
    finalizePresentUi(slide);
    return;
  }

  if (shouldUseVoteWorkshopUi(slide)) {
    stage.innerHTML = wrapMentiSlide(`
      <h1 class="menti-q-title">${esc(c.title || 'Priorisierung')}</h1>
      <p class="menti-q-prompt">${esc(c.prompt || '').replace(/\n/g, '<br>')}</p>
      <div class="viz-wrap viz-wrap-present">${viz}</div>${modPanel}`, slideIdx);
    stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
    stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', slideIdx);
    finalizePresentUi(slide);
    return;
  }

  stage.innerHTML = wrapMentiSlide(`
    ${!isSopWorkshopPresentation() && workshopMode ? renderWorkshopModeBadge(workshopMode) : ''}
    ${!isSopWorkshopPresentation() ? sopBadge : ''}
    <h1 class="menti-q-title ${c.mentiQuestion ? '' : 'present-slide-title'}" style="color:${esc(slideInk)}">${esc(c.title || c.prompt || 'Folie')}</h1>
    <p class="menti-q-prompt ${c.mentiQuestion ? '' : 'present-slide-body'}" style="color:${esc(slideMuted)}">${esc(c.prompt || c.body || '').replace(/\n/g, '<br>')}</p>
    <div class="viz-wrap viz-wrap-present">${viz}</div>${modPanel}`, slideIdx);

  stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
  stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
  updatePresentHeader();
  updatePresentStats();
  renderPresentParticipants();
  void renderQrCode();
  syncSopWorkshopShell('present', State.session.current_slide_index || 0);
  finalizePresentUi(slide);
}

async function moderateResponse(id, keepHidden) {
  await sb.from('lp_responses').update({ is_hidden: keepHidden }).eq('id', id);
  const r = State.responses.find((x) => x.id === id);
  if (r) r.is_hidden = keepHidden;
  renderPresent();
}

function updatePresentToolbarUi(slide) {
  const idx = State.session?.current_slide_index || 0;
  const total = State.slides.length || 1;
  const counter = $('#present-slide-counter');
  if (counter) counter.textContent = `${idx + 1} / ${total}`;

  const responsesBtn = $('#present-toggle-responses');
  if (responsesBtn) {
    const open = !!State.session?.question_open;
    responsesBtn.innerHTML = open ? '<i class="fa-solid fa-circle-dot"></i>' : '<i class="fa-solid fa-circle-stop"></i>';
    responsesBtn.title = open ? 'Antworten sammeln (aktiv)' : 'Antworten pausiert';
    responsesBtn.classList.toggle('is-active', open);
  }

  const joinBtn = $('#present-toggle-join');
  if (joinBtn) {
    const locked = !!State.session?.join_locked;
    joinBtn.innerHTML = locked ? '<i class="fa-solid fa-user-slash"></i>' : '<i class="fa-solid fa-user-plus"></i>';
    joinBtn.title = locked ? 'Neue Teilnehmer blockiert' : 'Neue Teilnehmer zulassen';
    joinBtn.classList.toggle('is-active', !locked);
  }

  const modeBtn = $('#present-results-mode');
  if (modeBtn) {
    const show = isResultsViewSlide(slide);
    modeBtn.classList.toggle('hidden', !show);
    if (show) {
      const mode = getResultsDisplayMode();
      modeBtn.textContent = mode === 'count' ? '#' : '%';
      modeBtn.title = mode === 'count' ? 'Absolute Zahlen (klicken für Prozent)' : 'Prozent (klicken für absolute Zahlen)';
      modeBtn.classList.add('is-active');
    }
  }
}

function updatePresentStats() {
  const slide = currentSessionSlide();
  const count = getVisibleResponses(slide?.id).length;
  const pending = getPendingResponses(slide?.id).length;
  $('#present-stats').textContent = `${State.participants.length} TN · ${count} Antw.${pending ? ` · ${pending} wartend` : ''}`;
  updatePresentToolbarUi(slide);
}

async function renderQrCode() {
  if (!State.session) return;
  const url = buildJoinUrl(State.session.code);
  const img = $('#present-qr');
  const urlEl = $('#present-join-url');
  const codeEl = $('#present-code-text');
  if (urlEl) urlEl.textContent = url;
  if (codeEl) codeEl.textContent = State.session.code;
  if (!img) return;
  try {
    if (typeof QRCode !== 'undefined' && QRCode.toDataURL) {
      img.src = await QRCode.toDataURL(url, {
        width: 140,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      img.alt = `QR Code ${State.session.code}`;
    } else {
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`;
    }
  } catch {
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(url)}`;
  }
}

function bindPresentToolbar() {
  if (State.presentToolbarBound) return;
  State.presentToolbarBound = true;
  const bar = $('#present-toolbar');
  const showBar = () => {
    bar.classList.remove('hidden');
    clearTimeout(State._barHide);
    State._barHide = setTimeout(() => bar.classList.add('hidden'), 3500);
  };
  State.presentMouseHandler = showBar;
  document.addEventListener('mousemove', showBar);
  showBar();

  $('#present-prev').onclick = () => changeSlide(-1);
  $('#present-next').onclick = () => changeSlide(1);
  $('#present-toggle-responses').onclick = async () => {
    const question_open = !State.session.question_open;
    broadcastSessionPatch({ question_open });
    renderPresent();
    await sb.from('lp_sessions').update({ question_open }).eq('id', State.session.id);
  };
  $('#present-toggle-join').onclick = async () => {
    const join_locked = !State.session.join_locked;
    await sb.from('lp_sessions').update({ join_locked }).eq('id', State.session.id);
    State.session.join_locked = join_locked;
    updatePresentStats();
  };
  $('#present-results-mode')?.addEventListener('click', () => {
    setResultsDisplayMode(getResultsDisplayMode() === 'count' ? 'percent' : 'count');
    renderPresent();
  });
  $('#present-show-code').onclick = () => {
    $('#present-code-bar').classList.toggle('hidden');
    void renderQrCode();
  };
  $('#present-focus-toggle')?.addEventListener('click', () => {
    State.sopFocusMode = !State.sopFocusMode;
    document.body.classList.toggle('lp-sop-focus', State.sopFocusMode);
    toast(State.sopFocusMode ? 'Fokusmodus: SOP-Panel ausgeblendet' : 'Fokusmodus aus', 'success');
  });
  $('#present-toggle-panels')?.addEventListener('click', () => {
    State.showPresentPanels = !State.showPresentPanels;
    document.body.classList.toggle('lp-sop-panels', State.showPresentPanels);
    toast(State.showPresentPanels ? 'Teilnehmer-Leiste eingeblendet' : 'Teilnehmer-Leiste ausgeblendet', 'success');
  });
  $('#present-reset').onclick = async () => {
    if (!confirm('Antworten dieser Folie zurücksetzen?')) return;
    const slide = currentSessionSlide();
    await sb.from('lp_responses').delete().eq('session_id', State.session.id).eq('slide_id', slide.id);
    State.responses = State.responses.filter((r) => r.slide_id !== slide.id);
    renderPresent();
  };
  $('#present-end').onclick = async () => {
    if (!confirm('Session beenden?')) return;
    await sb.from('lp_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', State.session.id);
    location.hash = `#results/${State.session.id}`;
    await openResults(State.session.id);
  };
}

async function changeSlide(delta) {
  const next = clamp((State.session.current_slide_index || 0) + delta, 0, State.slides.length - 1);
  if (next === State.session.current_slide_index) return;
  State.confettiSlideId = null;
  broadcastSessionPatch({ current_slide_index: next, question_open: true });
  renderPresent();
  await sb.from('lp_sessions').update({ current_slide_index: next, question_open: true }).eq('id', State.session.id);
}

async function goToSlide(index) {
  const next = clamp(index, 0, State.slides.length - 1);
  if (next === State.session.current_slide_index) return;
  State.confettiSlideId = null;
  broadcastSessionPatch({ current_slide_index: next, question_open: true });
  renderPresent();
  await sb.from('lp_sessions').update({ current_slide_index: next, question_open: true }).eq('id', State.session.id);
}

/* ─── PARTICIPANT ─── */
async function ensureParticipantResponses(force = false) {
  if (!State.session?.id || !State.participant) return;
  const slideIndex = State.session.current_slide_index || 0;
  const slide = State.slides[slideIndex];
  const needsTrackData = Boolean(slide?.settings?.sopTrackVote || slide?.settings?.sopCardVote || slide?.settings?.brainstormVote);
  if (!needsTrackData && !force) return;
  const cacheKey = `${State.session.id}:${slideIndex}`;
  const fresh = State.participantResponsesKey === cacheKey
    && Date.now() - (State.participantResponsesAt || 0) < 2500;
  if (!force && fresh) return;
  const { data } = await sb.from('lp_responses').select('*').eq('session_id', State.session.id).order('created_at');
  State.responses = data || [];
  State.participantResponsesKey = cacheKey;
  State.participantResponsesAt = Date.now();
}

function normalizeSlideRecord(slide) {
  if (!slide) return slide;
  const next = { ...slide };
  if (typeof next.content === 'string') {
    try { next.content = JSON.parse(next.content); } catch { next.content = {}; }
  }
  if (typeof next.settings === 'string') {
    try { next.settings = JSON.parse(next.settings); } catch { next.settings = {}; }
  }
  return next;
}

function normalizeSlides(slides) {
  return (slides || []).map(normalizeSlideRecord);
}

function loadAnsweredSlides(sessionId) {
  try {
    State.answeredSlides = new Set(JSON.parse(localStorage.getItem(`lp_answered_${sessionId}`) || '[]'));
  } catch {
    State.answeredSlides = new Set();
  }
}

function markAnswered(slideId) {
  State.answeredSlides.add(slideId);
  localStorage.setItem(`lp_answered_${State.session.id}`, JSON.stringify([...State.answeredSlides]));
}

function renderParticipantEntry(codePrefill) {
  const saved = JSON.parse(localStorage.getItem('lp_join_profile') || 'null');
  const code = (codePrefill || parseJoinCodeFromHash() || '').trim().toUpperCase();
  const hasCode = Boolean(code);
  State.joinProfile = {
    name: '',
    emoji: LP_AVATAR_EMOJIS()[0],
    color: LP_AVATAR_COLORS()[0],
  };
  if (!hasCode && saved?.name) State.joinProfile.name = saved.name;
  if (!hasCode && saved?.emoji) State.joinProfile.emoji = saved.emoji;
  if (!hasCode && saved?.color) State.joinProfile.color = saved.color;
  const root = $('#participant-root');
  root.innerHTML = `
    <div class="participant-card participant-join-card">
      <h1>Live teilnehmen</h1>
      <p>${hasCode ? 'Willkommen! Wähle Name und Avatar – der Code ist bereits hinterlegt.' : 'Code, Name und Avatar – dann bist du dabei.'}</p>
      ${hasCode ? `
        <div class="join-code-badge"><i class="fa-solid fa-qrcode"></i> Session <strong>${esc(code)}</strong></div>
        <input type="hidden" id="join-code" value="${esc(code)}" />`
      : `<label class="join-label">Session-Code</label>
        <input class="participant-code-input" id="join-code" maxlength="8" placeholder="CODE" autocomplete="one-time-code" />`}
      <label class="join-label">Dein Name <span class="req">*</span></label>
      <input id="join-name" placeholder="Vorname oder Nickname" class="participant-name-input" value="${esc(State.joinProfile.name)}" required autocomplete="name" />
      <label class="join-label">Dein Avatar <span class="req">*</span></label>
      <div class="avatar-preview-wrap">
        <div id="avatar-preview" class="avatar-preview" style="background:${esc(State.joinProfile.color)}">${State.joinProfile.emoji}</div>
        <div class="avatar-preview-name" id="avatar-preview-name">${esc(State.joinProfile.name || 'Dein Name')}</div>
      </div>
      <div class="avatar-color-row">${LP_AVATAR_COLORS().map((c) => `<button type="button" class="avatar-color-btn ${c === State.joinProfile.color ? 'active' : ''}" data-color="${c}" style="background:${c}" aria-label="Farbe"></button>`).join('')}</div>
      <div class="avatar-emoji-grid">${LP_AVATAR_EMOJIS().map((e) => `<button type="button" class="avatar-emoji-btn ${e === State.joinProfile.emoji ? 'active' : ''}" data-emoji="${e}" aria-pressed="${e === State.joinProfile.emoji}">${e}</button>`).join('')}</div>
      <button type="button" class="btn-primary participant-submit" id="join-submit"><i class="fa-solid fa-arrow-right"></i> Beitreten</button>
    </div>`;

  const updatePreview = () => {
    const name = $('#join-name').value.trim() || 'Dein Name';
    $('#avatar-preview').textContent = State.joinProfile.emoji;
    $('#avatar-preview').style.background = State.joinProfile.color;
    $('#avatar-preview-name').textContent = name;
  };

  $('#join-name').addEventListener('input', updatePreview);
  root.querySelectorAll('.avatar-emoji-btn').forEach((btn) => btn.addEventListener('click', () => {
    State.joinProfile.emoji = btn.dataset.emoji;
    root.querySelectorAll('.avatar-emoji-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.emoji === State.joinProfile.emoji);
      b.setAttribute('aria-pressed', b.dataset.emoji === State.joinProfile.emoji ? 'true' : 'false');
    });
    updatePreview();
  }));
  root.querySelectorAll('.avatar-color-btn').forEach((btn) => btn.addEventListener('click', () => {
    State.joinProfile.color = btn.dataset.color;
    root.querySelectorAll('.avatar-color-btn').forEach((b) => b.classList.toggle('active', b.dataset.color === State.joinProfile.color));
    updatePreview();
  }));
  $('#join-submit').onclick = () => {
    const code = $('#join-code').value.trim().toUpperCase();
    const name = $('#join-name').value.trim();
    if (!code) { toast('Bitte Code eingeben', 'warn'); return; }
    if (!name) { toast('Bitte Name eingeben', 'warn'); return; }
    if (!State.joinProfile.emoji) { toast('Bitte Avatar wählen', 'warn'); return; }
    localStorage.setItem('lp_join_profile', JSON.stringify({ name, emoji: State.joinProfile.emoji, color: State.joinProfile.color }));
    void joinSession(code, name, State.joinProfile.emoji, State.joinProfile.color);
  };
  $('#join-code')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#join-name')?.focus(); });
  setTimeout(() => $('#join-name')?.focus(), 120);
}

async function joinSession(code, name, emoji, color) {
  const { data: session, error } = await sb.from('lp_sessions').select('*').eq('code', code.toUpperCase()).in('status', ['live', 'paused']).maybeSingle();
  if (error || !session) { toast('Code ungültig oder Session beendet', 'error'); return; }
  if (session.join_locked) { toast('Beitritt gesperrt', 'error'); return; }
  const { data: part, error: pErr } = await sb.from('lp_participants').upsert({
    session_id: session.id,
    device_id: State.deviceId,
    display_name: name,
    avatar_emoji: emoji,
    avatar_color: color,
  }, { onConflict: 'session_id,device_id' }).select().single();
  if (pErr) { toast(pErr.message, 'error'); return; }
  State.session = session;
  State.participant = part;
  State.responses = [];
  loadAnsweredSlides(session.id);
  const { data: slides } = await sb.from('lp_slides').select('*').eq('presentation_id', session.presentation_id).order('sort_order');
  State.slides = normalizeSlides(slides);
  subscribeParticipantChannel();
  await renderParticipantQuestion();
}

function subscribeParticipantChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  State.sessionChannel = sb.channel(sessionChannelName(State.session.id))
    .on('broadcast', { event: 'session_sync' }, ({ payload }) => {
      applySessionPatch(payload || {});
      if (State.session.status === 'ended') {
        handleParticipantSessionEnd();
        return;
      }
      void renderParticipantQuestion();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      applySessionPatch(payload.new || {});
      if (State.session.status === 'ended') {
        handleParticipantSessionEnd();
        return;
      }
      void renderParticipantQuestion();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, () => {
      void (async () => {
        await ensureParticipantResponses(true);
        await renderParticipantQuestion();
      })();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, () => {
      void (async () => {
        await ensureParticipantResponses(true);
        const slide = State.slides[State.session.current_slide_index || 0];
        if (slide?.settings?.sopTrackVote || slide?.settings?.sopCardVote || slide?.settings?.brainstormVote || slide?.slide_type === 'qa') await renderParticipantQuestion();
      })();
    })
    .subscribe();
  startParticipantSync();
}

async function loadQaResponses(slideId) {
  const { data } = await sb.from('lp_responses').select('*').eq('session_id', State.session.id).eq('slide_id', slideId).eq('is_hidden', false);
  return (data || []).filter((r) => r.response?.text);
}

function hasAnsweredSlide(slide) {
  if (slide.settings?.multipleResponses) return false;
  return State.answeredSlides.has(slide.id);
}

async function renderParticipantQuestion() {
  const slideIndex = State.session.current_slide_index || 0;
  const slide = State.slides[slideIndex];
  if (isSopVoteSlide(slide)) await ensureParticipantResponses(true);
  const root = $('#participant-root');
  const finishParticipant = () => syncSopWorkshopShell('participant', slideIndex);
  if (!slide?.settings?.sopTrackVote) State.participantVoteExpert = false;
  if (!slide) { root.innerHTML = '<div class="participant-card"><p>Warte auf Folie…</p></div>'; finishParticipant(); return; }
  if (!State.session.question_open) {
    root.innerHTML = `<div class="participant-card"><h1>${esc(slide.content?.title || 'Warte…')}</h1><p>Die Frage ist geschlossen. Bitte warte auf die nächste Folie.</p></div>`;
    finishParticipant();
    return;
  }
  if (!isInteractive(slide.slide_type)) {
    if (slide.slide_type === 'section' && slide.content?.sopTrackClass) {
      root.innerHTML = wrapMentiParticipantSlide(`
        <div class="participant-wait-block">
          ${renderSopSectionHtml(slide.content)}
          <p class="participant-sop-wait"><i class="fa-solid fa-eye"></i> Bitte auf den Vortragenden achten…</p>
        </div>`, slideIndex);
      finishParticipant();
      return;
    }
    if (slide.slide_type === 'content' && (slide.content?.mentiHero || slide.content?.sopKind || slide.content?.sopTrackResults || isSopCardResultsSlide(slide))) {
      const html = slide.content.mentiHero ? renderMentiHeroHtml(slide.content) : (isSopCardResultsSlide(slide) ? '' : renderSopContentHtml(slide.content));
      if (html || isSopCardResultsSlide(slide)) {
        root.innerHTML = wrapMentiParticipantSlide(`
          <div class="participant-wait-block">${html || `<h1 class="menti-q-title">${esc(slide.content?.title || 'Ergebnis')}</h1><p class="menti-q-prompt">${esc(slide.content?.body || '')}</p>`}
          <p class="participant-sop-wait"><i class="fa-solid fa-eye"></i> Bitte auf die Ergebnisse auf dem Beamer achten…</p></div>`, slideIndex);
        finishParticipant();
        return;
      }
    }
    root.innerHTML = `<div class="participant-card"><h1>${esc(slide.content?.title || 'Folie')}</h1><p>${esc(slide.content?.body || slide.content?.prompt || '')}</p><p style="color:var(--muted);margin-top:1rem">Bitte auf den Vortragenden achten…</p></div>`;
    finishParticipant();
    return;
  }
  if (hasAnsweredSlide(slide)) {
    root.innerHTML = wrapMentiParticipantSlide(`
      <div class="participant-sent-card">
        <div class="participant-sent-icon"><i class="fa-solid fa-check"></i></div>
        <h1 class="menti-q-title">Antwort gesendet</h1>
        <p class="menti-q-prompt">Danke! Bitte warte auf die nächste Karte…</p>
      </div>`, slideIndex);
    finishParticipant();
    return;
  }

  const c = slide.content || {};
  const type = slide.slide_type;
  const timeLimit = slide.settings?.timeLimitSec || 0;
  let input = '';

  if (type === 'mc_single' || type === 'quiz' || type === 'yesno') {
    const opts = type === 'yesno'
      ? [{ id: 'yes', text: 'Ja' }, { id: 'no', text: 'Nein' }]
      : (slide.settings?.sopTrackVote ? getTrackVoteOptions(slide) : (c.options || []));
    input = opts.map((o) => `<button type="button" class="participant-option" data-val="${esc(o.id)}" style="border-color:${esc(o.color || c.accentColor || 'var(--line)')}">${esc(o.text)}</button>`).join('');
  } else if (type === 'mc_multi') {
    if (isSopVoteSlide(slide)) {
      input = renderParticipantTrackVoteHtml(slide);
    } else {
      input = `<div id="multi-wrap">${(c.options || []).map((o) => `<label class="props-check"><input type="checkbox" value="${esc(o.id)}"> ${esc(o.text)}</label>`).join('')}</div><button type="button" class="btn-primary participant-submit" id="submit-multi">Senden</button>`;
    }
  } else if (type === 'wordcloud' || type === 'open' || type === 'brainstorm') {
    const isCollect = isBrainstormCollectSlide(slide);
    if (isCollect) {
      input = `<label class="join-label" for="p-text">Dein KI Use Case</label>
        <textarea id="p-text" rows="4" class="participant-textarea participant-textarea-lg" placeholder="${esc((c.prompt || '').split('\n')[0] || 'Use Case beschreiben…')}"></textarea>
        <button type="button" class="btn-primary participant-submit participant-submit-lg" id="submit-text">Use Case senden</button>`;
    } else {
      input = `<textarea id="p-text" rows="3" class="participant-textarea" placeholder="${esc(c.prompt || 'Antwort')}"></textarea><button type="button" class="btn-primary participant-submit" id="submit-text">Senden</button>`;
    }
  } else if (type === 'qa') {
    input = `<textarea id="p-text" rows="2" class="participant-textarea" placeholder="Deine Frage…"></textarea><button type="button" class="btn-primary participant-submit" id="submit-text">Frage senden</button><div id="qa-list" class="qa-list"></div>`;
  } else if (type === 'scale') {
    input = `<div class="scale-labels"><span>${esc(c.minLabel || c.min || 1)}</span><span>${esc(c.maxLabel || c.max || 10)}</span></div>
      <input id="p-range" type="range" min="${c.min ?? 1}" max="${c.max ?? 10}" value="${Math.round(((c.min ?? 1) + (c.max ?? 10)) / 2)}" class="participant-range" />
      <div id="p-range-val" style="text-align:center;font-size:1.5rem;font-weight:700;margin:.5rem 0">${Math.round(((c.min ?? 1) + (c.max ?? 10)) / 2)}</div>
      <button type="button" class="btn-primary participant-submit" id="submit-num">Senden</button>`;
  } else if (type === 'number_guess') {
    input = `<input id="p-num" type="number" class="participant-num-input" placeholder="Deine Schätzung"><button type="button" class="btn-primary participant-submit" id="submit-num" style="margin-top:.75rem">Senden</button>`;
  } else if (type === 'reaction') {
    input = ['👍', '👎', '❤️', '😂', '😮', '👏'].map((e) => `<button type="button" class="participant-option participant-emoji" data-emoji="${e}">${e}</button>`).join('');
  } else if (type === 'ranking') {
    input = `<p style="font-size:.85rem;color:var(--muted);margin-bottom:.5rem">Tippe Optionen in Reihenfolge (1 = wichtigste)</p>
      <div id="rank-list">${(c.options || []).map((o) => `<button type="button" class="participant-option rank-opt" data-id="${esc(o.id)}">${esc(o.text)}</button>`).join('')}</div>
      <div id="rank-order" class="rank-order"></div>
      <button type="button" class="btn-primary participant-submit" id="submit-rank">Senden</button>`;
  } else if (type === 'percent_split') {
    if (slide.settings?.sopTrackVote) {
      input = renderParticipantTrackVoteHtml(slide);
    } else {
      input = `<p style="font-size:.85rem;color:var(--muted)">Verteile 100 Punkte</p>
        ${(c.options || []).map((o) => `<div class="split-row"><span>${esc(o.text)}</span><input type="number" min="0" max="100" value="0" data-split="${esc(o.id)}" class="split-input" /></div>`).join('')}
        <div id="split-total" style="font-weight:700;margin:.5rem 0">Summe: 0 / 100</div>
        <button type="button" class="btn-primary participant-submit" id="submit-split">Senden</button>`;
    }
  } else if (type === 'pin_image') {
    input = c.imageUrl
      ? `<div class="pin-wrap" id="pin-wrap"><img src="${esc(c.imageUrl)}" alt="" id="pin-img" /><div id="pin-marker" class="pin-marker hidden">📍</div></div><button type="button" class="btn-primary participant-submit" id="submit-pin" disabled>Pin setzen & senden</button>`
      : `<p style="color:var(--muted)">Kein Bild konfiguriert.</p>`;
  } else if (type === 'priority_matrix') {
    input = renderParticipantMatrixHtml(slide);
  }

  const isWorkshop = isSopWorkshopPresentation() || hasBrainstormChain(slide) || isBrainstormVoteSlide(slide) || isBrainstormResultsSlide(slide);
  const isCollect = isBrainstormCollectSlide(slide);
  const isDecide = shouldUseVoteWorkshopUi(slide);
  const cardClass = [
    'participant-card',
    c.mentiQuestion || isWorkshop ? 'participant-menti-q' : '',
    getWorkshopMode(slide) ? `participant-mode-${getWorkshopMode(slide)}` : '',
    isWorkshop ? 'participant-card-menti' : '',
  ].filter(Boolean).join(' ');

  root.innerHTML = wrapMentiParticipantSlide(`
    <div class="${cardClass}">
      ${!isWorkshop ? `<div class="participant-header-row">
        ${participantAvatarHtml(State.participant, 'md')}
        <div><div class="participant-meta">Code ${esc(State.session.code)}${slide.settings?.anonymous ? ' · Anonym' : ''}</div><div class="participant-you">${esc(State.participant?.display_name || '')}</div></div>
      </div>` : ''}
      ${isCollect ? renderWorkshopCardCollectHtml(c) : ''}
      ${isDecide ? `<h1 class="menti-q-title">${esc(c.title || 'Priorisierung')}</h1><p class="menti-q-prompt">${esc(c.prompt || '').replace(/\n/g, '<br>')}</p>` : ''}
      ${!isCollect && !isDecide ? `<h1 class="menti-q-title">${esc(c.title || c.prompt || 'Frage')}</h1>` : ''}
      ${!isCollect && !isDecide && c.prompt && c.title ? `<p class="menti-q-prompt">${esc(c.prompt).replace(/\n/g, '<br>')}</p>` : ''}
      ${timeLimit ? `<div id="p-timer" class="p-timer">${timeLimit}s</div>` : ''}
      ${input}
    </div>`, slideIndex);

  if (timeLimit) startQuestionTimer(timeLimit);
  bindParticipantHandlers(slide);
  finishParticipant();
}

function startQuestionTimer(sec) {
  clearInterval(State.questionTimer);
  let left = sec;
  const el = $('#p-timer');
  State.questionTimer = setInterval(() => {
    left -= 1;
    if (el) el.textContent = `${left}s`;
    if (left <= 0) {
      clearInterval(State.questionTimer);
      $('#participant-root').innerHTML = '<div class="participant-card"><h1>Zeit abgelaufen</h1><p>Warte auf die nächste Frage…</p></div>';
    }
  }, 1000);
}

function getMatrixItems(slide) {
  // Wenn sopAllTracksMatrix: nutze die Top-3 aus den jeweiligen Track-Votes.
  if (slide?.settings?.sopAllTracksMatrix) {
    const trackTop = aggregateTopTrackVotedUseCases();
    const rankedTop = trackTop.flatMap((trk) => trk.items.map((item) => ({
      id: item.id,
      text: item.text,
      phase: item.phase,
      trackLabel: trk.trackLabel,
      score: item.score,
    })));
    if (rankedTop.length) return rankedTop;

    const { allItems } = aggregateAllTracksUseCases();
    // Fallback: wenn noch keine Track-Votes da sind, zeige alle (max 12) damit Slide nicht leer ist.
    return allItems.slice(0, 12).map((u, i) => ({ id: u.id || `it-${i}`, text: u.text, phase: u.phase, trackLabel: u.trackLabel }));
  }
  // Manuelle Items aus slide.content.manualItems
  return (slide?.content?.manualItems || []).map((t, i) => ({ id: `it-${i}`, text: typeof t === 'string' ? t : (t.text || ''), phase: '', trackLabel: '' }));
}

function getMatrixLocalKey(slideId) {
  return `lp_matrix_${State.session?.id || ''}_${slideId}_${State.deviceId}`;
}

function loadMatrixLocal(slideId) {
  try { return JSON.parse(localStorage.getItem(getMatrixLocalKey(slideId)) || '{}'); }
  catch { return {}; }
}

function saveMatrixLocal(slideId, placements) {
  try { localStorage.setItem(getMatrixLocalKey(slideId), JSON.stringify(placements || {})); }
  catch {}
}

function renderParticipantMatrixHtml(slide) {
  const c = slide.content || {};
  const items = getMatrixItems(slide);
  const quadrants = c.quadrants || {
    qw: { label: 'Quick Win', icon: '🚀', desc: 'hoher Impact · niedriger Aufwand' },
    sb: { label: 'Strategic Bet', icon: '⭐', desc: 'hoher Impact · hoher Aufwand' },
    ts: { label: 'Time Sink', icon: '🔧', desc: 'niedriger Impact · hoher Aufwand' },
    dr: { label: 'Drop', icon: '❌', desc: 'niedriger Impact · niedriger Aufwand' },
  };
  if (!items.length) {
    return '<div class="participant-wait-block"><p class="participant-sop-wait"><i class="fa-solid fa-clock"></i> Noch keine Use Cases gesammelt. Bitte warte auf den Vortragenden.</p></div>';
  }
  const placements = loadMatrixLocal(slide.id);
  const inQuadrant = (q) => items.filter((it) => placements[it.id] === q);
  const inPool = items.filter((it) => !placements[it.id]);
  const itemCard = (it) => `<div class="lp-mx-item" data-item-id="${esc(it.id)}" data-text="${esc(it.text)}">
    <span class="lp-mx-item-text">${esc(it.text)}</span>
  </div>`;
  return `<div class="lp-mx-wrap" data-slide-id="${esc(slide.id)}">
    <div class="lp-mx-instructions">
      <i class="fa-solid fa-hand-pointer"></i>
      <span>Halten und ziehen, um Use Cases in Quadranten zu schieben. Tippen zum schnellen Setzen.</span>
    </div>
    <div class="lp-mx-grid-wrap">
      <div class="lp-mx-y-label">${esc(c.yAxisLabel || 'Impact')}</div>
      <div class="lp-mx-y-high">↑ hoch</div>
      <div class="lp-mx-y-low">↓ niedrig</div>
      <div class="lp-mx-grid">
        <div class="lp-mx-cell lp-q-sb" data-drop="sb">
          <div class="lp-mx-cell-head"><span class="lp-mx-cell-icon">${quadrants.sb.icon}</span><strong>${esc(quadrants.sb.label)}</strong></div>
          <div class="lp-mx-cell-items">${inQuadrant('sb').map(itemCard).join('')}</div>
        </div>
        <div class="lp-mx-cell lp-q-qw" data-drop="qw">
          <div class="lp-mx-cell-head"><span class="lp-mx-cell-icon">${quadrants.qw.icon}</span><strong>${esc(quadrants.qw.label)}</strong></div>
          <div class="lp-mx-cell-items">${inQuadrant('qw').map(itemCard).join('')}</div>
        </div>
        <div class="lp-mx-cell lp-q-dr" data-drop="dr">
          <div class="lp-mx-cell-head"><span class="lp-mx-cell-icon">${quadrants.dr.icon}</span><strong>${esc(quadrants.dr.label)}</strong></div>
          <div class="lp-mx-cell-items">${inQuadrant('dr').map(itemCard).join('')}</div>
        </div>
        <div class="lp-mx-cell lp-q-ts" data-drop="ts">
          <div class="lp-mx-cell-head"><span class="lp-mx-cell-icon">${quadrants.ts.icon}</span><strong>${esc(quadrants.ts.label)}</strong></div>
          <div class="lp-mx-cell-items">${inQuadrant('ts').map(itemCard).join('')}</div>
        </div>
      </div>
      <div class="lp-mx-x-label">${esc(c.xAxisLabel || 'Aufwand')}: hoch ← → niedrig</div>
    </div>
    <div class="lp-mx-pool" data-drop="pool">
      <div class="lp-mx-pool-head"><strong>Use Cases</strong> <span class="lp-mx-pool-count" id="lp-mx-pool-count">${inPool.length} / ${items.length}</span></div>
      <div class="lp-mx-pool-items">${inPool.map(itemCard).join('')}</div>
    </div>
    <div class="lp-mx-actions">
      <button type="button" class="btn-ghost" id="lp-mx-reset"><i class="fa-solid fa-rotate-left"></i> Zurücksetzen</button>
      <button type="button" class="btn-primary participant-submit" id="lp-mx-submit"><i class="fa-solid fa-paper-plane"></i> Auswahl absenden <span class="lp-mx-progress">(<span id="lp-mx-progress-n">${items.length - inPool.length}</span>/${items.length})</span></button>
    </div>
  </div>`;
}

// ─── DRAG-AND-DROP MATRIX (pointer events, mobile+desktop) ─────────
function setupMatrixDragDrop(slide) {
  const wrap = document.querySelector('.lp-mx-wrap[data-slide-id="' + slide.id + '"]');
  if (!wrap) return;
  const items = getMatrixItems(slide);
  const itemMeta = {};
  items.forEach((it) => { itemMeta[it.id] = { text: it.text, phase: it.phase, trackLabel: it.trackLabel }; });

  let placements = loadMatrixLocal(slide.id);

  function updateProgress() {
    const placed = Object.keys(placements).filter((k) => placements[k]).length;
    const total = items.length;
    const n = document.getElementById('lp-mx-progress-n'); if (n) n.textContent = placed;
    const pool = document.getElementById('lp-mx-pool-count'); if (pool) pool.textContent = `${total - placed} / ${total}`;
    const submit = document.getElementById('lp-mx-submit');
    if (submit) submit.disabled = placed === 0;
  }
  updateProgress();

  function moveItemToDom(itemEl, quadrant) {
    const target = quadrant === 'pool'
      ? wrap.querySelector('.lp-mx-pool-items')
      : wrap.querySelector('[data-drop="' + quadrant + '"] .lp-mx-cell-items');
    if (target) {
      target.appendChild(itemEl);
      itemEl.classList.add('lp-mx-item--just-dropped');
      setTimeout(() => itemEl.classList.remove('lp-mx-item--just-dropped'), 350);
    }
  }

  function setPlacement(itemId, quadrant) {
    if (quadrant === 'pool') {
      delete placements[itemId];
    } else {
      placements[itemId] = quadrant;
    }
    saveMatrixLocal(slide.id, placements);
    updateProgress();
    try { if (navigator.vibrate) navigator.vibrate(20); } catch {}
  }

  // Pointer drag implementation
  let dragging = null; // { el, ghost, offsetX, offsetY, startX, startY, moved }
  const LONGPRESS_MS = 220;
  let longpressTimer = null;

  function startDrag(item, e) {
    if (dragging) return;
    const rect = item.getBoundingClientRect();
    const ghost = item.cloneNode(true);
    ghost.classList.add('lp-mx-ghost');
    ghost.style.position = 'fixed';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    document.body.appendChild(ghost);
    item.classList.add('lp-mx-item--dragging');
    dragging = {
      el: item, ghost,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX, startY: e.clientY, moved: false,
    };
    try { item.setPointerCapture(e.pointerId); } catch {}
  }

  function moveDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    dragging.moved = Math.hypot(e.clientX - dragging.startX, e.clientY - dragging.startY) > 6 || dragging.moved;
    dragging.ghost.style.left = (e.clientX - dragging.offsetX) + 'px';
    dragging.ghost.style.top = (e.clientY - dragging.offsetY) + 'px';
    // Highlight drop target
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const dropEl = target?.closest('[data-drop]');
    wrap.querySelectorAll('[data-drop]').forEach((z) => z.classList.toggle('lp-mx-drop-active', z === dropEl));
  }

  function endDrag(e) {
    if (!dragging) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const dropEl = target?.closest('[data-drop]');
    dragging.el.classList.remove('lp-mx-item--dragging');
    wrap.querySelectorAll('[data-drop]').forEach((z) => z.classList.remove('lp-mx-drop-active'));
    dragging.ghost?.remove();
    if (dropEl && dragging.moved) {
      const q = dropEl.dataset.drop;
      moveItemToDom(dragging.el, q);
      setPlacement(dragging.el.dataset.itemId, q);
    }
    dragging = null;
  }

  wrap.querySelectorAll('.lp-mx-item').forEach((item) => {
    item.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      // On touch: small long-press to feel intentional; on mouse: immediate
      if (e.pointerType === 'touch') {
        longpressTimer = setTimeout(() => startDrag(item, e), LONGPRESS_MS);
      } else {
        startDrag(item, e);
      }
    });
  });

  window.addEventListener('pointermove', (e) => {
    if (longpressTimer && !dragging) {
      // canceled long-press if moved before threshold
      clearTimeout(longpressTimer); longpressTimer = null;
    }
    moveDrag(e);
  });

  window.addEventListener('pointerup', (e) => {
    if (longpressTimer) { clearTimeout(longpressTimer); longpressTimer = null; }
    if (dragging) endDrag(e);
  });
  window.addEventListener('pointercancel', (e) => {
    if (longpressTimer) { clearTimeout(longpressTimer); longpressTimer = null; }
    if (dragging) endDrag(e);
  });

  // Tap-to-cycle: tap an item to move it through quadrants (Mobile-friendly fallback)
  // Convention: pool -> qw -> sb -> ts -> dr -> pool
  const ORDER = ['pool', 'qw', 'sb', 'ts', 'dr'];
  wrap.querySelectorAll('.lp-mx-item').forEach((item) => {
    let downX = 0, downY = 0, downT = 0;
    item.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; downT = Date.now(); });
    item.addEventListener('pointerup', (e) => {
      const elapsed = Date.now() - downT;
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      // Treat as tap if quick and didn't move much
      if (!dragging && moved < 6 && elapsed < 180) {
        const cur = placements[item.dataset.itemId] || 'pool';
        const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
        moveItemToDom(item, next);
        setPlacement(item.dataset.itemId, next);
      }
    });
  });

  // Reset
  document.getElementById('lp-mx-reset')?.addEventListener('click', () => {
    placements = {};
    saveMatrixLocal(slide.id, placements);
    // Move all items back to pool
    const pool = wrap.querySelector('.lp-mx-pool-items');
    wrap.querySelectorAll('.lp-mx-item').forEach((it) => pool.appendChild(it));
    updateProgress();
  });

  // Submit
  document.getElementById('lp-mx-submit')?.addEventListener('click', () => {
    const placed = Object.keys(placements).filter((k) => placements[k]).length;
    if (!placed) { toast('Bitte mindestens 1 Use Case einsortieren', 'warn'); return; }
    submitResponse({ matrix: placements, meta: itemMeta });
  });
}

function bindParticipantHandlers(slide) {
  const c = slide.content || {};
  const type = slide.slide_type;

  $('#pin-wrap')?.addEventListener('click', (e) => {
    const img = $('#pin-img');
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const marker = $('#pin-marker');
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.classList.remove('hidden');
    img.dataset.pinX = x;
    img.dataset.pinY = y;
    $('#submit-pin').disabled = false;
  });

  $('#submit-pin')?.addEventListener('click', () => {
    const img = $('#pin-img');
    submitResponse({ pin: { x: Number(img.dataset.pinX), y: Number(img.dataset.pinY) } });
  });

  const rankOrder = [];
  $$('.rank-opt').forEach((btn) => btn.addEventListener('click', () => {
    if (rankOrder.includes(btn.dataset.id)) return;
    rankOrder.push(btn.dataset.id);
    btn.classList.add('selected');
    $('#rank-order').textContent = rankOrder.map((id, i) => `${i + 1}. ${(c.options || []).find((o) => o.id === id)?.text || id}`).join(' · ');
  }));
  $('#submit-rank')?.addEventListener('click', () => {
    if (!rankOrder.length) { toast('Bitte mindestens eine Option wählen', 'warn'); return; }
    submitResponse({ order: rankOrder });
  });

  $$('.split-input').forEach((inp) => inp.addEventListener('input', () => {
    const sum = $$('.split-input').reduce((a, el) => a + Number(el.value || 0), 0);
    const el = $('#split-total');
    if (el) { el.textContent = `Summe: ${sum} / 100`; el.style.color = sum === 100 ? 'var(--success)' : 'var(--danger)'; }
  }));
  $('#submit-split')?.addEventListener('click', () => {
    const points = {};
    let sum = 0;
    $$('.split-input').forEach((inp) => { points[inp.dataset.split] = Number(inp.value || 0); sum += Number(inp.value || 0); });
    if (sum !== 100) { toast('Summe muss genau 100 sein', 'warn'); return; }
    submitResponse({ points });
  });

  const voteScope = getVoteSlideScope(slide);
  const favMax = voteScope?.maxSelections || 3;
  const updateFavCounter = () => {
    const n = $$('.track-vote-option input:checked').length;
    const el = $('#fav-counter') || $('#top3-counter');
    if (el) {
      el.textContent = `${n} / ${favMax} gewählt`;
      el.style.color = n > favMax ? 'var(--danger)' : n >= 1 && n <= favMax ? 'var(--success)' : 'var(--muted)';
    }
  };
  $$('.track-vote-option input').forEach((inp) => inp.addEventListener('change', () => {
    if ($$('.track-vote-option input:checked').length > favMax) {
      inp.checked = false;
      toast(`Maximal ${favMax} Use Cases`, 'warn');
    }
    updateFavCounter();
  }));
  updateFavCounter();

  const submitFavorites = () => {
    const values = $$('.track-vote-option input:checked').map((i) => i.value);
    if (!values.length) { toast('Mindestens 1 Use Case wählen', 'warn'); return; }
    submitResponse({ values });
  };
  $('#submit-favorites')?.addEventListener('click', submitFavorites);
  $('#submit-top3')?.addEventListener('click', submitFavorites);

  $('#vote-mode-toggle')?.addEventListener('click', () => {
    State.participantVoteExpert = !State.participantVoteExpert;
    void renderParticipantQuestion();
  });

  $('#participant-root').querySelectorAll('.participant-option[data-val]').forEach((btn) => {
    btn.onclick = () => submitResponse({ value: btn.dataset.val });
  });
  $('#participant-root').querySelectorAll('.participant-option[data-emoji]').forEach((btn) => {
    btn.onclick = () => submitResponse({ emoji: btn.dataset.emoji });
  });
  $('#submit-text')?.addEventListener('click', () => {
    const text = filterProfanity($('#p-text').value.trim(), slide.settings?.profanityFilter !== false);
    const isCollect = isBrainstormCollectSlide(slide);
    if (!text && (slide.settings?.required || isCollect)) { toast(isCollect ? 'Bitte Idee eingeben' : 'Antwort erforderlich', 'warn'); return; }
    submitResponse({ text, upvotes: 0 });
  });
  $('#submit-num')?.addEventListener('click', () => {
    const val = type === 'scale' ? Number($('#p-range')?.value) : Number($('#p-num')?.value);
    if (!Number.isFinite(val)) { toast('Bitte Zahl eingeben', 'warn'); return; }
    submitResponse({ value: val });
  });
  $('#p-range')?.addEventListener('input', () => { const el = $('#p-range-val'); if (el) el.textContent = $('#p-range').value; });
  $('#submit-multi')?.addEventListener('click', () => {
    const values = Array.from($('#multi-wrap').querySelectorAll('input:checked')).map((i) => i.value);
    const max = c.maxSelections || 3;
    if (!values.length) { toast('Mindestens eine Option wählen', 'warn'); return; }
    if (values.length > max) { toast(`Maximal ${max} Optionen`, 'warn'); return; }
    submitResponse({ values });
  });

  if (type === 'qa') void renderQaList(slide);

  // Priority Matrix Drag-and-Drop Setup
  if (type === 'priority_matrix') setupMatrixDragDrop(slide);
}

async function renderQaList(slide) {
  const list = await loadQaResponses(slide.id);
  const el = $('#qa-list');
  if (!el) return;
  el.innerHTML = list.length
    ? list.sort((a, b) => (b.response?.upvotes || 0) - (a.response?.upvotes || 0)).slice(0, 10).map((r) => `
      <div class="qa-item">
        <span>${esc(r.response.text)}</span>
        <button type="button" class="qa-up" data-id="${r.id}" data-votes="${r.response.upvotes || 0}">▲ ${r.response.upvotes || 0}</button>
      </div>`).join('')
    : '<p style="color:var(--muted);font-size:.85rem">Noch keine Fragen</p>';
  el.querySelectorAll('.qa-up').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    const votes = Number(btn.dataset.votes || 0) + 1;
    const row = list.find((r) => r.id === id);
    if (!row) return;
    await sb.from('lp_responses').update({ response: { ...row.response, upvotes: votes } }).eq('id', id);
    void renderQaList(slide);
  }));
}

async function submitResponse(response) {
  const slide = State.slides[State.session.current_slide_index || 0];
  if (!slide || !State.session.question_open) return;
  if (slide.settings?.askName && !State.participant?.display_name) {
    toast('Bitte mit Namen beitreten', 'warn');
    enterParticipantJoin();
    return;
  }
  if (response.text) response.text = filterProfanity(response.text, slide.settings?.profanityFilter !== false);

  const row = {
    session_id: State.session.id,
    slide_id: slide.id,
    participant_id: State.participant?.id || null,
    response,
    is_hidden: !!slide.settings?.moderation,
  };

  const { data, error } = await sb.from('lp_responses').insert(row).select().single();
  if (error) {
    State.pendingQueue.push(row);
    localStorage.setItem('lp_pending_queue', JSON.stringify(State.pendingQueue));
    toast('Offline gespeichert – wird nachgereicht', 'warn');
    return;
  }
  if (data) {
    const idx = State.responses.findIndex((r) => r.id === data.id);
    if (idx >= 0) State.responses[idx] = data;
    else State.responses.push(data);
  }

  if (slide.slide_type === 'quiz') {
    const correct = (slide.content.options || []).find((o) => o.correct)?.id;
    const ok = response.value === correct;
    State.quizScores[State.participant?.id] = (State.quizScores[State.participant?.id] || 0) + (ok ? 1 : 0);
  }

  markAnswered(slide.id);
  const modMsg = slide.settings?.moderation ? 'Antwort zur Freigabe gesendet.' : 'Antwort gesendet.';
  $('#participant-root').innerHTML = `<div class="participant-card"><h1>Danke!</h1><p>${modMsg} Warte auf die nächste Frage…</p></div>`;
}

async function flushPendingQueue() {
  if (!State.pendingQueue.length) return;
  const rest = [];
  for (const row of State.pendingQueue) {
    const { error } = await sb.from('lp_responses').insert(row);
    if (error) rest.push(row);
  }
  State.pendingQueue = rest;
  localStorage.setItem('lp_pending_queue', JSON.stringify(rest));
}

setInterval(() => { void flushPendingQueue(); }, 15000);
window.addEventListener('online', () => { void flushPendingQueue(); });

/* ─── RESULTS ─── */
async function openResults(sessionId) {
  const { data: { session: auth } } = await sb.auth.getSession();
  const { data: session, error } = await sb.from('lp_sessions').select('*').eq('id', sessionId).single();
  if (error || !session) { toast('Session nicht gefunden', 'error'); goDashboard(); return; }
  if (auth?.user?.id !== session.host_id) { toast('Nur der Host kann Ergebnisse sehen', 'error'); goDashboard(); return; }
  State.session = session;
  await loadSessionData();
  showScreen('results');
  const content = $('#results-content');
  content.innerHTML = `
    <div class="results-header"><h1>Code ${esc(session.code)}</h1><p>${State.participants.length} Teilnehmer · ${State.responses.length} Antworten</p></div>
    ${State.slides.map((slide) => {
      const visible = State.responses.filter((r) => r.slide_id === slide.id && !r.is_hidden);
      const agg = window.LPViz.aggregateResponses(slide, visible);
      return `<section class="results-section"><h2>${esc(slide.content?.title || slide.content?.prompt || 'Folie')}</h2>${window.LPViz.renderViz(slide, agg, 'results')}</section>`;
    }).join('')}`;
}

function exportCsv() {
  const rows = [['session_id', 'slide_id', 'participant_id', 'response', 'is_hidden', 'created_at']];
  State.responses.forEach((r) => rows.push([r.session_id, r.slide_id, r.participant_id, JSON.stringify(r.response), r.is_hidden, r.created_at]));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `livepoll-${State.session?.code || 'export'}.csv`;
  a.click();
}

function exportPresentationJson() {
  const blob = new Blob([JSON.stringify({ presentation: State.presentation, slides: State.slides }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${State.presentation?.title || 'presentation'}.json`;
  a.click();
}

/* ─── MODALS / ROUTING ─── */
function openModal(id) { document.getElementById(id)?.classList.add('visible'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('visible'); }
window.closeModal = closeModal;

async function routeFromHash() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash || hash === 'dashboard') {
    if (!State.user) return;
    showScreen('dashboard');
    await loadPresentations();
    renderDashboard();
    return;
  }
  if (hash.startsWith('join')) {
    enterParticipantJoin();
    return;
  }
  if (hash.startsWith('present/')) {
    const id = hash.split('/')[1];
    const { data: session } = await sb.from('lp_sessions').select('*').eq('id', id).maybeSingle();
    if (!session) return;
    State.session = session;
    const { data: pres } = await sb.from('lp_presentations').select('*').eq('id', session.presentation_id).maybeSingle();
    if (pres) State.presentation = pres;
    State.resultsDisplayMode = getPresentationSettings().resultsDisplayMode || 'percent';
    await loadSessionData();
    showScreen('present');
    subscribeSessionChannel();
    renderPresentParticipants();
    renderPresent();
    bindPresentToolbar();
    return;
  }
  if (hash.startsWith('results/')) {
    await openResults(hash.split('/')[1]);
    return;
  }
  if (hash.startsWith('editor/')) {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    if (!State.user) { State.user = session.user; await loadProfile(session.user); mountRootsUser(); }
    await openEditor(hash.split('/')[1]);
    return;
  }
}

/* ─── INIT ─── */
function bindUi() {
  $('#login-form')?.addEventListener('submit', handleLogin);
  $('#login-toggle-mode')?.addEventListener('click', (e) => {
    e.preventDefault();
    State.authMode = State.authMode === 'signin' ? 'signup' : 'signin';
    $('#login-toggle-mode').textContent = State.authMode === 'signin' ? 'Noch kein Konto? Registrieren' : 'Bereits Konto? Anmelden';
    $('#login-submit').innerHTML = State.authMode === 'signin' ? '<i class="fa-solid fa-right-to-bracket"></i> Anmelden' : '<i class="fa-solid fa-user-plus"></i> Registrieren';
  });
  $$('.dash-nav-item[data-filter]').forEach((btn) => btn.addEventListener('click', () => {
    $$('.dash-nav-item[data-filter]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    State.dashFilter = btn.dataset.filter;
    renderDashboard();
  }));
  $('#dash-search')?.addEventListener('input', debounce((e) => { State.search = e.target.value; renderDashboard(); }, 200));
  $('#btn-new-presentation')?.addEventListener('click', () => createPresentation());
  $('#btn-open-templates')?.addEventListener('click', () => { renderTemplatesModal(); openModal('modal-templates'); });
  $('#btn-join-as-participant')?.addEventListener('click', () => { location.hash = '#join'; enterParticipantJoin(); });
  $('#editor-back')?.addEventListener('click', goDashboard);
  $('#btn-add-slide')?.addEventListener('click', () => { renderAddSlideModal(); openModal('modal-add-slide'); });
  bindAddSlideModalControls();
  $('#btn-save-version')?.addEventListener('click', saveVersionSnapshot);
  $('#btn-show-versions')?.addEventListener('click', openVersionsModal);
  $('#btn-export-pres')?.addEventListener('click', exportPresentationJson);
  $('#btn-toggle-props')?.addEventListener('click', () => $('#editor-props')?.classList.toggle('mobile-open'));
  $('#btn-start-present')?.addEventListener('click', startPresentation);
  $('#editor-title')?.addEventListener('input', debounce(async (e) => {
    State.presentation.title = e.target.value;
    await sb.from('lp_presentations').update({ title: e.target.value }).eq('id', State.presentation.id);
  }, 500));
  $$('.modal-close').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));
  $('#results-back')?.addEventListener('click', goDashboard);
  $('#btn-export-csv')?.addEventListener('click', exportCsv);
}

window.addEventListener('hashchange', routeFromHash);
window.addEventListener('roots-auth-ready', (e) => { if (e.detail?.session) void onAuthSession(e.detail.session); });
sb.auth.onAuthStateChange((_ev, session) => { if (session) void onAuthSession(session); });

bindUi();
void flushPendingQueue();
if (isJoinRoute()) {
  enterParticipantJoin();
} else {
  void routeFromHash();
}
if (document.documentElement.classList.contains('in-iframe')) {
  const loginCard = $('#screen-login .login-card');
  if (loginCard) loginCard.innerHTML = '<p style="text-align:center;color:var(--muted)"><i class="fa-solid fa-spinner fa-spin"></i> Anmeldung über Intranet…</p>';
  void window.RootsUserBridge?.syncAuthFromParentStorage?.();
}

// ─── EXPLIZITER INITIAL-AUTH-CHECK ───────────────────────────────
// onAuthStateChange feuert INITIAL_SESSION nicht immer zuverlaessig
// (besonders in iframes). Hier holen wir die Session aktiv und routen
// in das Dashboard, falls vorhanden. Verhindert das spurious Login-Popup
// trotz aktiver Intranet-Session.
(async function initAuthCheck() {
  try {
    // Geben dem Auth-Bridge bis zu 2.5s Zeit, die Session zu synchen
    for (let i = 0; i < 25; i++) {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        if (!State.user) await onAuthSession(session);
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    // Nach 2.5s ohne Session: Login-Card auf den normalen Login-Stand zurueck
    if (document.documentElement.classList.contains('in-iframe')) {
      const card = $('#screen-login .login-card');
      if (card && card.querySelector('.fa-spinner')) {
        card.innerHTML = '<h1 class="login-title" style="text-align:center">Nicht angemeldet</h1><p class="login-sub" style="text-align:center">Bitte melde dich zuerst im ROOTS Intranet an, dann öffne das Tool dort erneut.</p>';
      }
    }
  } catch (e) {
    console.warn('[LP] initAuthCheck error:', e);
  }
})();
