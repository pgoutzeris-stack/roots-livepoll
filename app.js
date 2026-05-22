/* ROOTS Live Poll – Hauptanwendung */
const SUPABASE_URL = 'https://csmguwcvzreefluhahyu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWd1d2N2enJlZWZsdWhhaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjM0ODcsImV4cCI6MjA5MjUzOTQ4N30.Fiafx7XBaQZXUX3bKQIBH7znBHx3B51yL-bftOHsL4Q';
const APP_VERSION = '20260520-sop4';
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
  participantPoll: null,
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
      .filter((r) => r.slide_id === slide.id)
      .map((r) => String(r.response?.text || '').trim())
      .filter(Boolean);
    byCard.push({
      phase: slide.content?.sopPhaseName || '',
      card: slide.content?.sopCardName || slide.content?.title || 'Karte',
      items,
    });
    items.forEach((text) => allItems.push({
      text,
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

function getTrackVoteOptions(slide) {
  const key = slide.content?.sopTrackKey || slide.content?.sopTrackClass;
  if (!slide.settings?.sopTrackVote || !key) return slide.content?.options || [];
  const { unique } = aggregateTrackUseCases(key);
  if (!unique.length) return [{ id: 'none', text: 'Noch keine Use Cases gesammelt' }];
  return unique.slice(0, 12).map((item, i) => ({ id: stableUseCaseOptionId(item.text, i), text: item.text }));
}

function getTrackVoteDisplaySlide(slide) {
  if (!slide.settings?.sopTrackVote) return slide;
  return { ...slide, content: { ...slide.content, options: getTrackVoteOptions(slide) } };
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
    if (!trackMatch && step !== 'track-intro') return false;
    if (step === 'track-intro') {
      return s.slide_type === 'section' && c.sopKind === 'track' && trackMatch;
    }
    if (step === 'card-intro') {
      return s.slide_type === 'content' && c.sopKind === 'card' && c.sopPhaseName === phaseName && c.sopCardName === cardName;
    }
    if (step === 'brainstorm') {
      return s.slide_type === 'brainstorm' && c.sopPhaseName === phaseName && c.sopCardName === cardName;
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
  if (st.sopTrackVote) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: null, cardName: null, kind: 'track-vote' };
  }
  if (slide.slide_type === 'brainstorm' && (c.sopTrackKey || c.sopTrackClass)) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: c.sopCardName, kind: 'brainstorm' };
  }
  if (c.sopKind === 'card') {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: c.sopCardName, kind: 'card-intro' };
  }
  if (c.sopKind === 'track') {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: null, cardName: null, kind: 'track-intro' };
  }
  return null;
}

function getSopBoardContextFromSlide(slide) {
  const ctx = getSopSlideContext(slide);
  if (!ctx?.trackKey) return { show: false };
  return {
    show: true,
    trackKey: ctx.trackKey,
    phaseName: ctx.cardName ? ctx.phaseName : null,
    cardName: ctx.cardName || null,
  };
}

function renderSopFullBoardHtml(ctx = {}) {
  const tracks = window.SOP_TOOL_TRACKS || [];
  const { trackKey, phaseName, cardName } = ctx;
  if (!tracks.length) return '';
  let html = '<div class="sop-workshop-board-inner">';
  tracks.forEach((track, tIdx) => {
    if (trackKey && track.class !== trackKey) return;
    html += `<div class="track ${esc(track.class)}" data-track-index="${tIdx}">
      <div class="track-header">
        <span class="track-badge">Track ${tIdx + 1}</span>
        <span class="track-name">${esc(track.title)}</span>
      </div>
      <div class="phases-wrapper"><div class="phases-row">`;
    (track.phases || []).forEach((phase, pIdx) => {
      const hidePhase = phaseName && phase.name !== phaseName;
      html += `<div class="phase-col ${hidePhase ? 'sop-nav-filter-hidden' : ''}" data-phase-index="${pIdx}">
        <div class="phase-label">${esc(phase.name)}</div>
        <div class="phase-cards">`;
      (phase.cards || []).forEach((card) => {
        const active = track.class === trackKey && phase.name === phaseName && card.name === cardName;
        html += `<div class="sop-card sop-card-readonly ${active ? 'sop-card-active' : ''}">
          <div class="card-trigger">
            <div class="card-header-main"><div class="card-title-wrap"><div class="card-title">${esc(card.name)}</div></div></div>
            <div class="card-meta-chips"><span class="card-chip"><i class="fa-solid fa-lightbulb"></i> KI Use Cases</span></div>
          </div>
        </div>`;
      });
      html += '</div></div>';
    });
    html += '</div></div></div>';
  });
  html += '</div>';
  return html;
}

function renderSopWorkshopNavHtml(currentIndex, { clickable = false, onNavigate } = {}) {
  const tracks = window.SOP_TOOL_TRACKS || [];
  const ctx = getSopSlideContext(State.slides[currentIndex]);
  let html = '<div class="dash-nav-section">Inhaltsverzeichnis</div>';
  tracks.forEach((track) => {
    const navClass = SOP_TRACK_NAV_CLASS[track.class] || '';
    const trackIdx = findSlideIndexForSopStep(track.class, null, null, 'track-intro');
    const trackActive = ctx?.trackKey === track.class;
    html += `<div class="sop-nav-track-group">
      <button type="button" class="dash-nav-item ${navClass}${trackActive && ctx?.kind === 'track-intro' ? ' active' : ''}${trackActive && ctx?.kind !== 'track-intro' ? ' sop-nav-parent-active active' : ''}" data-slide-index="${trackIdx}" ${trackIdx < 0 ? 'disabled' : ''}>
        <i class="fa-solid fa-folder-tree"></i><span>${esc(track.title.replace(/^Track \d+: /, ''))}</span>
      </button>
      <div class="sop-nav-phases">`;
    (track.phases || []).forEach((phase) => {
      html += `<div class="sop-nav-phase-group"><div class="sop-nav-phase-label">${esc(phase.name)}</div>`;
      (phase.cards || []).forEach((card) => {
        const introIdx = findSlideIndexForSopStep(track.class, phase.name, card.name, 'card-intro');
        const brainIdx = findSlideIndexForSopStep(track.class, phase.name, card.name, 'brainstorm');
        const cardActive = ctx?.trackKey === track.class && ctx?.phaseName === phase.name && ctx?.cardName === card.name;
        html += `<button type="button" class="dash-nav-item dash-nav-item--sub ${navClass}${cardActive && ctx?.kind === 'card-intro' ? ' active' : ''}" data-slide-index="${introIdx}" ${introIdx < 0 ? 'disabled' : ''}>
          <i class="fa-solid fa-file-lines"></i><span>${esc(card.name)}</span>
        </button>
        <button type="button" class="dash-nav-item dash-nav-item--step ${navClass}${cardActive && ctx?.kind === 'brainstorm' ? ' active' : ''}" data-slide-index="${brainIdx}" ${brainIdx < 0 ? 'disabled' : ''}>
          <i class="fa-solid fa-circle"></i><span>Brainstorming</span>
        </button>`;
      });
      html += '</div>';
    });
    const voteIdx = findSlideIndexForSopStep(track.class, null, null, 'track-vote');
    const voteActive = ctx?.trackKey === track.class && ctx?.kind === 'track-vote';
    html += `<button type="button" class="dash-nav-item dash-nav-item--vote ${navClass}${voteActive ? ' active' : ''}" data-slide-index="${voteIdx}" ${voteIdx < 0 ? 'disabled' : ''}>
      <i class="fa-solid fa-chart-pie"></i><span>Priorisierung · 100 Punkte</span>
    </button></div></div>`;
  });
  return { html, bind(container) {
    if (!clickable || !onNavigate || !container) return;
    container.querySelectorAll('[data-slide-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.slideIndex, 10);
        if (Number.isFinite(idx) && idx >= 0) onNavigate(idx);
      });
    });
  } };
}

function syncSopWorkshopShell(mode, slideIndex) {
  const isSop = isSopWorkshopPresentation();
  document.body.classList.toggle('lp-sop-workshop', isSop);
  document.body.classList.toggle('editor-mode', mode === 'editor');
  document.body.classList.toggle('present-mode', mode === 'present');
  document.body.classList.toggle('participant-mode', mode === 'participant');

  const editorNav = $('#editor-sop-nav');
  const editorList = $('#editor-slides');
  const presentSidebar = $('#present-sop-sidebar');
  const presentBoard = $('#present-sop-board');
  const participantSidebar = $('#participant-sop-sidebar');

  if (!isSop) {
    editorNav?.classList.add('hidden');
    editorList?.classList.remove('hidden');
    presentSidebar?.classList.add('hidden');
    presentBoard?.classList.add('hidden');
    participantSidebar?.classList.add('hidden');
    return;
  }

  const idx = slideIndex ?? 0;
  const slide = State.slides[idx];
  const boardCtx = getSopBoardContextFromSlide(slide);
  const nav = renderSopWorkshopNavHtml(idx, {
    clickable: mode === 'editor' || mode === 'present',
    onNavigate: (targetIdx) => {
      if (mode === 'editor') {
        State.selectedSlideId = State.slides[targetIdx]?.id;
        renderEditor();
      } else if (mode === 'present') {
        void goToSlide(targetIdx);
      }
    },
  });

  if (mode === 'editor') {
    editorNav?.classList.remove('hidden');
    editorList?.classList.add('hidden');
    if (editorNav) {
      editorNav.innerHTML = nav.html;
      nav.bind(editorNav);
    }
  }

  if (mode === 'present') {
    presentSidebar?.classList.remove('hidden');
    if (presentSidebar) {
      presentSidebar.innerHTML = nav.html;
      nav.bind(presentSidebar);
    }
    if (boardCtx.show && presentBoard) {
      presentBoard.classList.remove('hidden');
      presentBoard.innerHTML = renderSopFullBoardHtml(boardCtx);
    } else {
      presentBoard?.classList.add('hidden');
    }
  }

  if (mode === 'participant') {
    participantSidebar?.classList.remove('hidden');
    if (participantSidebar) {
      participantSidebar.innerHTML = nav.html;
    }
  }
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
      <div class="sop-track-result-items">${group.items.map((t) => `<div class="sop-track-result-item">${esc(t)}</div>`).join('')}</div>
    </div>`).join('')}<div class="sop-track-result-total">${allItems.length} Use Cases gesammelt</div></div>`;
}

function renderSopContentHtml(c, editable = false) {
  if (c.sopKind === 'card') return renderSopCardHtml(c, editable);
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
  State.selectedSlideId = State.slides[0]?.id || null;
  $('#editor-title').value = pres.title;
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
  if (isSopWorkshopPresentation()) {
    list.innerHTML = '';
    return;
  }
  list.innerHTML = State.slides.map((s, i) => `
    <div class="slide-thumb ${s.id === State.selectedSlideId ? 'active' : ''}" draggable="true" data-id="${s.id}">
      <div class="slide-thumb-row">
        <div class="slide-thumb-num">${i + 1} · ${esc(window.LP_SLIDE_TYPES.find((t) => t.type === s.slide_type)?.label || s.slide_type)}</div>
        <div class="slide-thumb-actions">
          <button type="button" class="slide-mini-btn" data-dup="${s.id}" title="Duplizieren"><i class="fa-solid fa-copy"></i></button>
          <button type="button" class="slide-mini-btn danger" data-del="${s.id}" title="Löschen"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="slide-thumb-title">${esc(s.content?.title || s.content?.prompt || 'Folie')}</div>
    </div>`).join('');
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

async function deleteSlide(id) {
  await sb.from('lp_slides').delete().eq('id', id);
  State.slides = State.slides.filter((s) => s.id !== id);
  State.slides.forEach((s, idx) => { s.sort_order = idx; });
  await persistSlideOrder();
  State.selectedSlideId = State.slides[0]?.id || null;
  renderEditor();
}

function renderEditorSopBoardAppend(slide) {
  if (!isSopWorkshopPresentation()) return '';
  const boardCtx = getSopBoardContextFromSlide(slide);
  if (!boardCtx.show) return '';
  return `<div class="sop-workshop-board-wrap editor-board-preview">${renderSopFullBoardHtml(boardCtx)}</div>`;
}

function renderEditorCanvas() {
  const slide = currentSlide();
  const canvas = $('#editor-canvas');
  if (!slide) { canvas.innerHTML = '<p>Keine Folien – füge eine hinzu.</p>'; return; }
  const c = { ...defaultStyle(), ...slide.content };
  const accent = c.accentColor || '#206efb';
  canvas.style.background = c.bgColor || '#fff';
  canvas.style.color = c.textColor || '#0f172a';

  let body = '';
  if (slide.slide_type === 'section' && c.sopTrackClass) {
    canvas.innerHTML = `${renderSopSectionHtml(c, true)}<div class="canvas-hint"><i class="fa-solid fa-pen"></i> Titel, Text und Einleitung direkt bearbeiten</div>${renderEditorSopBoardAppend(slide)}`;
    bindCanvasInlineEdit();
    return;
  }
  if (slide.slide_type === 'content' && (c.mentiHero || c.sopKind || c.sopTrackResults)) {
    const html = c.mentiHero ? renderMentiHeroHtml(c, true) : renderSopContentHtml(c, true);
    if (html) {
      canvas.innerHTML = `${html}<div class="canvas-hint"><i class="fa-solid fa-pen"></i> Titel und Text direkt bearbeiten</div>${renderEditorSopBoardAppend(slide)}`;
      bindCanvasInlineEdit();
      return;
    }
  }
  if (slide.slide_type === 'content' || slide.slide_type === 'section') {
    body = `
      <p class="canvas-editable" contenteditable="true" data-field="body" data-placeholder="Text eingeben…">${esc(c.body || c.subtitle || '')}</p>
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" class="canvas-image">` : ''}`;
  } else if (OPTION_TYPES.has(slide.slide_type)) {
    body = `
      <p class="canvas-editable canvas-prompt" contenteditable="true" data-field="prompt" data-placeholder="Frage eingeben…">${esc(c.prompt || '')}</p>
      <div class="canvas-options">${(c.options || []).map((o) => `
        <div class="canvas-option" style="border-color:${accent}22;background:${accent}11">${esc(o.text)}</div>`).join('')}</div>`;
  } else {
    body = `<p class="canvas-editable canvas-prompt" contenteditable="true" data-field="prompt" data-placeholder="Frage eingeben…">${esc(c.prompt || '')}</p>`;
  }

  canvas.innerHTML = `
    ${renderSopQuestionBadge(c)}
    <div class="canvas-editable canvas-title ${c.mentiQuestion ? 'menti-q-title' : ''}" contenteditable="true" data-field="title" data-placeholder="Titel…">${esc(c.title || c.prompt || 'Folie')}</div>
    ${body}
    <div class="canvas-hint"><i class="fa-solid fa-pen"></i> Direkt auf der Folie tippen zum Bearbeiten</div>${renderEditorSopBoardAppend(slide)}`;
  bindCanvasInlineEdit();
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
      void persistSlide(slide);
      const propTitle = $('#prop-title');
      const propPrompt = $('#prop-prompt');
      if (field === 'title' && propTitle) propTitle.value = val;
      if ((field === 'prompt' || field === 'body') && propPrompt) propPrompt.value = val;
      if (field === 'subtitle' && $('#prop-subtitle')) $('#prop-subtitle').value = val;
      if (field === 'body' && propPrompt) propPrompt.value = val;
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
      ${slide.slide_type === 'mc_multi' ? `<div class="props-label">Max. Auswahl</div><input id="prop-max-sel" type="number" min="1" value="${c.maxSelections || 3}" />` : ''}`;
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
    await persistSlide(slideObj);
  }, 700);

  panel.querySelectorAll('input,textarea').forEach((el) => {
    el.addEventListener('input', saveContent);
    el.addEventListener('change', saveContent);
  });
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
  $('#editor-save-status').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Speichert…';
  await sb.from('lp_slides').update({ content: slideObj.content, settings: slideObj.settings }).eq('id', slideObj.id);
  await sb.from('lp_presentations').update({ updated_at: new Date().toISOString() }).eq('id', State.presentation.id);
  $('#editor-save-status').innerHTML = '<i class="fa-solid fa-cloud"></i> Gespeichert';
  renderEditorCanvas();
}

async function persistSlideOrder() {
  await Promise.all(State.slides.map((s) => sb.from('lp_slides').update({ sort_order: s.sort_order }).eq('id', s.id)));
}

function renderAddSlideModal() {
  const grid = $('#slide-type-grid');
  grid.innerHTML = window.LP_SLIDE_TYPES.map((t) => `
    <button type="button" class="type-card" data-type="${t.type}">
      <h3><i class="fa-solid ${t.icon}"></i> ${esc(t.label)}</h3>
      <p>${esc(t.desc)}</p>
    </button>`).join('');
  grid.querySelectorAll('.type-card').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      const base = JSON.parse(JSON.stringify(window.LP_DEFAULT_CONTENT[type] || { title: 'Neu' }));
      const { data } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: State.slides.length,
        slide_type: type,
        content: { ...defaultStyle(), ...base },
        settings: { ...window.LP_DEFAULT_SETTINGS },
      }).select().single();
      State.slides.push(data);
      State.selectedSlideId = data.id;
      closeModal('modal-add-slide');
      renderEditor();
    });
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
  const [{ data: slides }, { data: responses }, { data: participants }] = await Promise.all([
    sb.from('lp_slides').select('*').eq('presentation_id', State.session.presentation_id).order('sort_order'),
    sb.from('lp_responses').select('*').eq('session_id', State.session.id).order('created_at'),
    sb.from('lp_participants').select('*').eq('session_id', State.session.id),
  ]);
  State.slides = slides || [];
  State.responses = responses || [];
  State.participants = participants || [];
}

function sessionChannelName(sessionId) {
  return `lp-session-${sessionId}`;
}

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
    const changed = data.current_slide_index !== State.session.current_slide_index
      || data.question_open !== State.session.question_open
      || data.status !== State.session.status;
    if (!changed) return;
    applySessionPatch(data);
    if (data.status === 'ended') {
      handleParticipantSessionEnd();
      return;
    }
    renderParticipantQuestion();
  }, 2500);
}

function subscribeSessionChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  State.sessionChannel = sb.channel(sessionChannelName(State.session.id))
    .on('broadcast', { event: 'session_sync' }, ({ payload }) => {
      applySessionPatch(payload || {});
      renderPresent();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      State.session = { ...State.session, ...payload.new };
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      State.responses.push(payload.new);
      if (payload.new.participant_id) pushPresentActivity(payload.new.participant_id);
      renderPresent();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      const idx = State.responses.findIndex((r) => r.id === payload.new.id);
      if (idx >= 0) State.responses[idx] = payload.new;
      else State.responses.push(payload.new);
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_participants', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      if (!State.participants.find((p) => p.id === payload.new.id)) {
        State.participants.push(payload.new);
        pushPresentActivity(payload.new.id, 'ist beigetreten');
      }
      updatePresentStats();
      renderPresentParticipants();
    })
    .subscribe();
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
  const interactive = isInteractive(slide.slide_type);
  const visible = getVisibleResponses(slide.id);
  const pending = getPendingResponses(slide.id);
  const displaySlide = getTrackVoteDisplaySlide(slide);
  const agg = window.LPViz.aggregateResponses(displaySlide, visible);

  let viz = '';
  if (!interactive) {
    if (c.sopTrackResults && c.sopTrackKey) {
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
    if (agg.total > 0 || !State.session.question_open) {
      viz = window.LPViz.renderViz(displaySlide, agg, 'present');
    } else {
      viz = '<div class="present-wait-msg">Antworten werden gesammelt…</div>';
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
    stage.innerHTML = `
      <div class="present-slide-meta">Folie ${(State.session.current_slide_index || 0) + 1} / ${State.slides.length}</div>
      ${renderSopSectionHtml(c)}`;
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    return;
  }

  if (slide.slide_type === 'content' && (c.mentiHero || c.sopKind || c.sopTrackResults)) {
    const html = c.mentiHero ? renderMentiHeroHtml(c) : renderSopContentHtml(c);
    if (html) {
      stage.innerHTML = `
        <div class="present-slide-meta">Folie ${(State.session.current_slide_index || 0) + 1} / ${State.slides.length}</div>
        ${html}`;
      updatePresentHeader();
      updatePresentStats();
      renderPresentParticipants();
      void renderQrCode();
      syncSopWorkshopShell('present', State.session.current_slide_index || 0);
      return;
    }
  }

  const sopBadge = renderSopQuestionBadge(c);

  stage.innerHTML = `
    <div class="present-slide-meta">Folie ${(State.session.current_slide_index || 0) + 1} / ${State.slides.length}</div>
    ${sopBadge}
    <h1 class="present-slide-title ${c.mentiQuestion ? 'menti-q-title' : ''}" style="color:${esc(slideInk)}">${esc(c.title || c.prompt || 'Folie')}</h1>
    <p class="present-slide-body ${c.mentiQuestion ? 'menti-q-prompt' : ''}" style="color:${esc(slideMuted)}">${esc(c.prompt || c.body || '').replace(/\n/g, '<br>')}</p>
    <div class="viz-wrap">${viz}</div>${modPanel}`;

  stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
  stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
  updatePresentHeader();
  updatePresentStats();
  renderPresentParticipants();
  void renderQrCode();
  syncSopWorkshopShell('present', State.session.current_slide_index || 0);
}

async function moderateResponse(id, keepHidden) {
  await sb.from('lp_responses').update({ is_hidden: keepHidden }).eq('id', id);
  const r = State.responses.find((x) => x.id === id);
  if (r) r.is_hidden = keepHidden;
  renderPresent();
}

function updatePresentStats() {
  const slide = currentSessionSlide();
  const count = getVisibleResponses(slide?.id).length;
  const pending = getPendingResponses(slide?.id).length;
  $('#present-stats').textContent = `${State.participants.length} TN · ${count} Antw.${pending ? ` · ${pending} wartend` : ''}`;
  const lockBtn = $('#present-lock-join');
  if (lockBtn) {
    lockBtn.innerHTML = State.session?.join_locked
      ? '<i class="fa-solid fa-lock"></i>'
      : '<i class="fa-solid fa-lock-open"></i>';
    lockBtn.title = State.session?.join_locked ? 'Beitritt gesperrt' : 'Beitritt erlauben';
  }
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
  $('#present-toggle-question').onclick = async () => {
    const question_open = !State.session.question_open;
    broadcastSessionPatch({ question_open });
    renderPresent();
    await sb.from('lp_sessions').update({ question_open }).eq('id', State.session.id);
  };
  $('#present-show-code').onclick = () => {
    $('#present-code-bar').classList.toggle('hidden');
    void renderQrCode();
  };
  $('#present-lock-join').onclick = async () => {
    await sb.from('lp_sessions').update({ join_locked: !State.session.join_locked }).eq('id', State.session.id);
    State.session.join_locked = !State.session.join_locked;
    updatePresentStats();
  };
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
  broadcastSessionPatch({ current_slide_index: next, question_open: true });
  renderPresent();
  await sb.from('lp_sessions').update({ current_slide_index: next, question_open: true }).eq('id', State.session.id);
}

async function goToSlide(index) {
  const next = clamp(index, 0, State.slides.length - 1);
  if (next === State.session.current_slide_index) return;
  broadcastSessionPatch({ current_slide_index: next, question_open: true });
  renderPresent();
  await sb.from('lp_sessions').update({ current_slide_index: next, question_open: true }).eq('id', State.session.id);
}

/* ─── PARTICIPANT ─── */
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
  loadAnsweredSlides(session.id);
  const { data: slides } = await sb.from('lp_slides').select('*').eq('presentation_id', session.presentation_id).order('sort_order');
  State.slides = slides || [];
  subscribeParticipantChannel();
  renderParticipantQuestion();
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
      renderParticipantQuestion();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      applySessionPatch(payload.new || {});
      if (State.session.status === 'ended') {
        handleParticipantSessionEnd();
        return;
      }
      renderParticipantQuestion();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, () => {
      if (State.slides[State.session.current_slide_index]?.slide_type === 'qa') renderParticipantQuestion();
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

function renderParticipantQuestion() {
  const slideIndex = State.session.current_slide_index || 0;
  const slide = State.slides[slideIndex];
  const root = $('#participant-root');
  const finishParticipant = () => syncSopWorkshopShell('participant', slideIndex);
  if (!slide) { root.innerHTML = '<div class="participant-card"><p>Warte auf Folie…</p></div>'; finishParticipant(); return; }
  if (!State.session.question_open) {
    root.innerHTML = `<div class="participant-card"><h1>${esc(slide.content?.title || 'Warte…')}</h1><p>Die Frage ist geschlossen. Bitte warte auf die nächste Folie.</p></div>`;
    finishParticipant();
    return;
  }
  if (!isInteractive(slide.slide_type)) {
    if (slide.slide_type === 'section' && slide.content?.sopTrackClass) {
      root.innerHTML = `<div class="participant-card participant-sop-section">${renderSopSectionHtml(slide.content)}<p class="participant-sop-wait">Bitte auf den Vortragenden achten…</p></div>`;
      finishParticipant();
      return;
    }
    if (slide.slide_type === 'content' && (slide.content?.mentiHero || slide.content?.sopKind || slide.content?.sopTrackResults)) {
      const html = slide.content.mentiHero ? renderMentiHeroHtml(slide.content) : renderSopContentHtml(slide.content);
      if (html) {
        root.innerHTML = `<div class="participant-card participant-sop-section">${html}<p class="participant-sop-wait">Bitte auf den Vortragenden achten…</p></div>`;
        finishParticipant();
        return;
      }
    }
    root.innerHTML = `<div class="participant-card"><h1>${esc(slide.content?.title || 'Folie')}</h1><p>${esc(slide.content?.body || slide.content?.prompt || '')}</p><p style="color:var(--muted);margin-top:1rem">Bitte auf den Vortragenden achten…</p></div>`;
    finishParticipant();
    return;
  }
  if (hasAnsweredSlide(slide)) {
    root.innerHTML = `<div class="participant-card"><h1>Antwort gesendet</h1><p>Du hast bereits geantwortet. Warte auf die nächste Frage…</p></div>`;
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
    input = `<div id="multi-wrap">${(c.options || []).map((o) => `<label class="props-check"><input type="checkbox" value="${esc(o.id)}"> ${esc(o.text)}</label>`).join('')}</div><button type="button" class="btn-primary participant-submit" id="submit-multi">Senden</button>`;
  } else if (type === 'wordcloud' || type === 'open' || type === 'brainstorm') {
    input = `<textarea id="p-text" rows="3" class="participant-textarea" placeholder="${esc(c.prompt || 'Antwort')}"></textarea><button type="button" class="btn-primary participant-submit" id="submit-text">Senden</button>`;
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
    const splitOpts = slide.settings?.sopTrackVote ? getTrackVoteOptions(slide) : (c.options || []);
    if (slide.settings?.sopTrackVote && splitOpts.length === 1 && splitOpts[0].id === 'none') {
      input = '<p style="color:var(--muted)">Noch keine Use Cases gesammelt. Bitte warte, bis das Brainstorming abgeschlossen ist.</p>';
    } else {
      input = `<p style="font-size:.85rem;color:var(--muted);margin-bottom:.75rem">Verteile genau <strong>100 Punkte</strong> auf die Use Cases dieses Tracks. Mehr Punkte = höhere Priorität.</p>
        ${splitOpts.map((o) => `<div class="split-row"><span>${esc(o.text)}</span><input type="number" min="0" max="100" value="0" data-split="${esc(o.id)}" class="split-input" /></div>`).join('')}
        <div id="split-total" style="font-weight:700;margin:.5rem 0">Summe: 0 / 100</div>
        <button type="button" class="btn-primary participant-submit" id="submit-split">Senden</button>`;
    }
  } else if (type === 'pin_image') {
    input = c.imageUrl
      ? `<div class="pin-wrap" id="pin-wrap"><img src="${esc(c.imageUrl)}" alt="" id="pin-img" /><div id="pin-marker" class="pin-marker hidden">📍</div></div><button type="button" class="btn-primary participant-submit" id="submit-pin" disabled>Pin setzen & senden</button>`
      : `<p style="color:var(--muted)">Kein Bild konfiguriert.</p>`;
  }

  root.innerHTML = `
    <div class="participant-card ${c.mentiQuestion ? 'participant-menti-q' : ''}">
      <div class="participant-header-row">
        ${participantAvatarHtml(State.participant, 'md')}
        <div><div class="participant-meta">Code ${esc(State.session.code)}${slide.settings?.anonymous ? ' · Anonyme Antwort' : ''}</div><div class="participant-you">${esc(State.participant?.display_name || '')}</div></div>
      </div>
      ${renderSopQuestionBadge(c)}
      <h1 class="${c.mentiQuestion ? 'menti-q-title' : ''}">${esc(c.title || c.prompt || 'Frage')}</h1>
      <p class="${c.mentiQuestion ? 'menti-q-prompt' : ''}">${esc(c.prompt || '').replace(/\n/g, '<br>')}</p>
      ${timeLimit ? `<div id="p-timer" class="p-timer">${timeLimit}s</div>` : ''}
      ${input}
    </div>`;

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

  $('#participant-root').querySelectorAll('.participant-option[data-val]').forEach((btn) => {
    btn.onclick = () => submitResponse({ value: btn.dataset.val });
  });
  $('#participant-root').querySelectorAll('.participant-option[data-emoji]').forEach((btn) => {
    btn.onclick = () => submitResponse({ emoji: btn.dataset.emoji });
  });
  $('#submit-text')?.addEventListener('click', () => {
    const text = filterProfanity($('#p-text').value.trim(), slide.settings?.profanityFilter !== false);
    if (!text && slide.settings?.required) { toast('Antwort erforderlich', 'warn'); return; }
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

  const { error } = await sb.from('lp_responses').insert(row);
  if (error) {
    State.pendingQueue.push(row);
    localStorage.setItem('lp_pending_queue', JSON.stringify(State.pendingQueue));
    toast('Offline gespeichert – wird nachgereicht', 'warn');
    return;
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
    const { data: pres } = await sb.from('lp_presentations').select('title').eq('id', session.presentation_id).maybeSingle();
    if (pres?.title) State.presentation = { ...(State.presentation || {}), title: pres.title };
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
