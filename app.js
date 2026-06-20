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
const LP_AVATAR_COLORS = () => window.LP_AVATAR_COLORS || ['#206efb', '#10b981', '#06b6d4', '#dc2626', '#6366f1'];
const LP_AVATAR_COLOR_NAMES = ['Blau', 'Grün', 'Türkis', 'Rot', 'Indigo', 'Himmelblau', 'Teal', 'Cyan', 'Royalblau', 'Schiefer'];

function avatarColorAriaLabel(hex) {
  const colors = LP_AVATAR_COLORS();
  const idx = colors.indexOf(hex);
  return `Avatar-Farbe ${LP_AVATAR_COLOR_NAMES[idx >= 0 ? idx : 0] || 'Auswahl'}`;
}

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
  dashSelectedIds: null,
  dashLastSelectedId: null,
  dashMarqueeDragging: false,
  dashSelectionBound: false,
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
  showPresentCode: true,
  participantVoteExpert: false,
  bubbleSeenIds: {},
  participantResponsesKey: null,
  participantResponsesAt: 0,
  matrixItemsBySlide: {},
  voteOptionsBySlide: {},
  pitchItems: [],
  pitchSync: null,
  quickWinItems: [],
  participantPitchPoll: null,
  pitchTimers: {},
  sopAssignSeen: null,
  closingCelebrationSlideId: null,
  heroAiRaf: 0,
  closingAiRaf: 0,
};

localStorage.setItem('lp_device_id', State.deviceId);
window.State = State; // lp-features.js liest window.State (top-level const ist im classic script nicht global)

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const cssEscapeLP = (s) => { try { return (window.CSS && CSS.escape) ? CSS.escape(String(s)) : String(s).replace(/["\\\]]/g, '\\$&'); } catch { return String(s); } };
const uid = () => crypto.randomUUID();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isInteractive = (t) => window.LP_INTERACTIVE_TYPES?.has(t);
const defaultStyle = () => ({ ...(window.LP_DEFAULT_STYLE || {}) });

function toast(msg, type = 'info') {
  const c = $('#toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warn' ? 'warn' : ''}`;
  el.textContent = msg;
  c.appendChild(el);
  if (type === 'error') hapticFeedback('error');
  else if (type === 'warn') hapticFeedback('medium');
  else if (type === 'success') hapticFeedback('success');
  setTimeout(() => el.remove(), 3200);
}

// ── ROOTS Confirm Modal (ersetzt window.confirm) ───────────────────────────
function lpConfirm({ title = 'Wirklich fortfahren?', desc = '', okLabel = 'Bestätigen', variant = 'danger', icon = 'fa-trash' } = {}) {
  return new Promise((resolve) => {
    const modal  = $('#lp-confirm-modal');
    if (!modal) { resolve(window.confirm(desc || title)); return; }
    const iconEl = $('#lp-confirm-icon');
    const okBtn  = $('#lp-confirm-ok');
    const cancel = $('#lp-confirm-cancel');
    $('#lp-confirm-title').textContent = title;
    const descEl = $('#lp-confirm-desc');
    descEl.textContent = desc;
    descEl.style.display = desc ? '' : 'none';
    iconEl.className = 'lp-confirm-icon' + (variant !== 'danger' ? ' ' + variant : '');
    iconEl.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    okBtn.className = 'lp-confirm-ok' + (variant !== 'danger' ? ' ' + variant : '');
    okBtn.textContent = okLabel;
    modal.classList.add('visible');
    const done = (val) => {
      modal.classList.remove('visible');
      okBtn.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBg);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onOk = () => done(true);
    const onCancel = () => done(false);
    const onBg = (e) => { if (e.target === modal) done(false); };
    const onKey = (e) => { if (e.key === 'Escape') done(false); };
    okBtn.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    modal.addEventListener('click', onBg);
    document.addEventListener('keydown', onKey);
  });
}

// ── ROOTS Prompt Modal (ersetzt window.prompt) ─────────────────────────────
function lpPrompt({ title = 'Eingabe', label = '', value = '', okLabel = 'Speichern' } = {}) {
  return new Promise((resolve) => {
    const modal = $('#lp-prompt-modal');
    if (!modal) { resolve(window.prompt(label || title, value)); return; }
    const input = $('#lp-prompt-input');
    const okBtn = $('#lp-prompt-ok');
    const cancel = $('#lp-prompt-cancel');
    $('#lp-prompt-title').textContent = title;
    const labelEl = $('#lp-prompt-label');
    labelEl.textContent = label;
    labelEl.style.display = label ? '' : 'none';
    okBtn.textContent = okLabel;
    input.value = value || '';
    modal.classList.add('visible');
    setTimeout(() => { input.focus(); input.select(); }, 50);
    const done = (val) => {
      modal.classList.remove('visible');
      okBtn.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBg);
      input.removeEventListener('keydown', onInputKey);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onOk = () => done(input.value);
    const onCancel = () => done(null);
    const onBg = (e) => { if (e.target === modal) done(null); };
    const onKey = (e) => { if (e.key === 'Escape') done(null); };
    const onInputKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); done(input.value); } };
    okBtn.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
    modal.addEventListener('click', onBg);
    input.addEventListener('keydown', onInputKey);
    document.addEventListener('keydown', onKey);
  });
}

function showScreen(name) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(`#screen-${name}`);
  if (el) el.classList.add('active');
  if (name !== 'participant') {
    closeParticipantSettingsSheet();
    clearParticipantActionBar();
  } else {
    syncParticipantMobileActionBar();
  }
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
  const norm = normalizeParticipantAvatar(p);
  const emoji = norm?.avatar_emoji || LP_AVATAR_EMOJIS()[0];
  const color = norm?.avatar_color || LP_AVATAR_COLORS()[0];
  const name = norm?.display_name || 'Gast';
  return `<span class="p-avatar p-avatar-${size}" style="background:${esc(color)}" title="${esc(name)}" aria-label="${esc(name)}">${emoji}</span>`;
}

function hashParticipantSeed(p) {
  const s = String(p?.id || p?.device_id || p?.display_name || 'guest');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function normalizeParticipantAvatar(p) {
  if (!p) return null;
  const emojis = LP_AVATAR_EMOJIS();
  const colors = LP_AVATAR_COLORS();
  const seed = hashParticipantSeed(p);
  const emojiRaw = String(p.avatar_emoji || '').trim();
  const colorRaw = String(p.avatar_color || '').trim();
  const emoji = emojiRaw && emojis.includes(emojiRaw) ? emojiRaw : emojis[seed % emojis.length];
  const color = colorRaw && /^#[0-9a-f]{6}$/i.test(colorRaw) ? colorRaw : colors[seed % colors.length];
  return { ...p, avatar_emoji: emoji, avatar_color: color };
}

function normalizeParticipantsList(list) {
  return (list || []).map((p) => normalizeParticipantAvatar(p));
}

function getParticipantForDisplay(id) {
  if (!id) return null;
  let p = State.participants.find((x) => x.id === id);
  if (!p && String(id).startsWith('debug-p-') && window.LP_DebugSim?.ensureDebugParticipant) {
    LP_DebugSim.ensureDebugParticipant(id);
    p = State.participants.find((x) => x.id === id);
  }
  return p ? normalizeParticipantAvatar(p) : null;
}

function participantHasRequiredAvatar(p) {
  if (!p) return false;
  const emojis = LP_AVATAR_EMOJIS();
  const colors = LP_AVATAR_COLORS();
  const emoji = String(p.avatar_emoji || '').trim();
  const color = String(p.avatar_color || '').trim();
  return Boolean(p.display_name?.trim() && emoji && emojis.includes(emoji) && color && colors.includes(color));
}

function getWorkshopSettings() {
  const presWs = State.presentation?.settings?.workshop || {};
  const global = window.LP_WORKSHOP_SETTINGS || {};
  return {
    brainstormTimeLimitSec: presWs.brainstormTimeLimitSec ?? global.brainstormTimeLimitSec ?? 300,
    brainstormMaxResponses: presWs.brainstormMaxResponses ?? global.brainstormMaxResponses ?? 2,
    trackVoteCount: presWs.trackVoteCount ?? global.trackVoteCount ?? 3,
    finalPriorityCount: presWs.finalPriorityCount ?? global.finalPriorityCount ?? 10,
    pitchTimerSec: presWs.pitchTimerSec ?? global.pitchTimerSec ?? 120,
  };
}

// Anzahl je Track priorisierter Use Cases (Zwischen-Vote). Slide-Override > Workshop-Setting.
function getTrackVoteCount(slide) {
  return Number(slide?.settings?.sopVoteMax || getWorkshopSettings().trackVoteCount || 3);
}

// Pitch-Timer in Sekunden. Slide-Override > Workshop-Setting.
function getPitchTimerSec(slide) {
  return Number(slide?.content?.pitchTimerSec || getWorkshopSettings().pitchTimerSec || 120);
}

function presentationHasWorkshopFlow() {
  return (State.slides || []).some((s) => {
    const c = s.content || {};
    const st = s.settings || {};
    return c.sopKind || st.sopAllTracksVote || st.sopAllTracksMatrix || st.sopTrackVote || st.sopNextSteps;
  });
}

function collectLimitLabel(limit) {
  const n = Number(limit) || 1;
  return n === 1 ? '1 Use Case' : `${n} Use Cases`;
}

function patchMaxUseCasesInText(text, limit) {
  const label = collectLimitLabel(limit);
  let t = String(text || '');
  if (!t.trim()) return t;
  t = t.replace(/Max\.\s*\d+\s*(Use Cases?|UC)?(\s*pro (Person|Teilnehmer))?/gi, `Max. ${label} pro Person`);
  t = t.replace(/max\.\s*\d+\s*Use Cases?/gi, `max. ${label}`);
  return t;
}

function applyCollectLimitToSlide(slide, limit) {
  if (!slide) return false;
  const n = Math.min(10, Math.max(1, Number(limit) || 1));
  const c = slide.content || (slide.content = {});
  const isCollect = COLLECT_CHAIN_TYPES.has(slide.slide_type);
  const isOpenerSub = c.isHeroSlide && c.subtitle && /max\.\s*\d+/i.test(String(c.subtitle));
  if (!isCollect && !isOpenerSub) return false;
  let changed = false;
  if (isCollect) {
    const st = slide.settings || (slide.settings = {});
    if (st.responseLimit !== n) { st.responseLimit = n; changed = true; }
    if (st.multipleResponses !== (n > 1)) { st.multipleResponses = n > 1; changed = true; }
    if (c.maxResponsesPerUser !== n) { c.maxResponsesPerUser = n; changed = true; }
    if (c.prompt) {
      const patched = patchMaxUseCasesInText(c.prompt, n);
      if (c.prompt !== patched) { c.prompt = patched; changed = true; }
    }
  }
  if (c.subtitle && /max\.\s*\d+/i.test(String(c.subtitle))) {
    const patched = patchMaxUseCasesInText(c.subtitle, n);
    if (c.subtitle !== patched) { c.subtitle = patched; changed = true; }
  }
  return changed;
}

function syncWorkshopSettingsToSlides({ finalPriorityCount, trackVoteCount, pitchTimerSec, brainstormMaxResponses } = {}) {
  const fin = finalPriorityCount != null ? Math.min(30, Math.max(1, Number(finalPriorityCount) || 10)) : null;
  const tvc = trackVoteCount != null ? Math.min(15, Math.max(1, Number(trackVoteCount) || 3)) : null;
  const pit = pitchTimerSec != null ? Math.max(15, Number(pitchTimerSec) || 120) : null;
  const bmr = brainstormMaxResponses != null ? Math.min(10, Math.max(1, Number(brainstormMaxResponses) || 1)) : null;
  const jobs = [];
  const touched = new Set();
  const mark = (s) => { if (!touched.has(s)) { touched.add(s); jobs.push(persistSlide(s)); } };
  (State.slides || []).forEach((s) => {
    const c = s.content || {};
    const st = s.settings || {};
    // Finale Priorisierung / Gesamt-Vote
    if (fin != null && (st.sopAllTracksVote || c.sopKind === 'final-vote' || c.sopKind === 'group-vote')) {
      st.sopVoteMax = fin;
      c.maxSelections = fin;
      if (c.subtitle && /Top \d+/i.test(String(c.subtitle))) c.subtitle = String(c.subtitle).replace(/Top \d+/i, `Top ${fin}`);
      if (c.prompt && /Welche \d+ Use Cases/i.test(String(c.prompt))) c.prompt = String(c.prompt).replace(/Welche \d+ Use Cases/i, `Welche ${fin} Use Cases`);
      mark(s);
    }
    // Matrix
    if (fin != null && (st.sopAllTracksMatrix || c.sopKind === 'final-matrix')) {
      st.sopMatrixCount = fin;
      mark(s);
    }
    // Track-Zwischen-Vote
    if (tvc != null && (st.sopTrackVote || c.sopKind === 'track-vote')) {
      st.sopVoteMax = tvc;
      c.maxSelections = tvc;
      if (c.title && /Top \d+/i.test(String(c.title))) c.title = String(c.title).replace(/Top \d+/i, `Top ${tvc}`);
      if (c.prompt && /Wählt die \d+/i.test(String(c.prompt))) c.prompt = String(c.prompt).replace(/Wählt die \d+/i, `Wählt die ${tvc}`);
      mark(s);
    }
    if (tvc != null && c.sopKind === 'all-tracks-summary' && c.title && /Top-\d+/i.test(String(c.title))) {
      c.title = String(c.title).replace(/Top-\d+/i, `Top-${tvc}`);
      mark(s);
    }
    // Pitch-Timer
    if (pit != null && (c.sopKind === 'pitch-session' || st.sopPitchSession)) {
      c.pitchTimerSec = pit;
      const minLabel = pit % 60 === 0 ? `${pit / 60} Minute${pit / 60 === 1 ? '' : 'n'}` : `${pit} Sek.`;
      if (c.subtitle && /· [^·]+ pro Person/i.test(String(c.subtitle))) {
        c.subtitle = String(c.subtitle).replace(/· [^·]+ pro Person/i, `· ${minLabel} pro Person`);
      }
      mark(s);
    }
    // Sammeln: max. Use Cases pro Person (Brainstorm / Open / Wordcloud + Opener-Subtitle)
    if (bmr != null && applyCollectLimitToSlide(s, bmr)) mark(s);
  });
  return Promise.all(jobs);
}

// Rückwärtskompatibler Alias (nur finale Anzahl).
function syncWorkshopFinalCountToSlides(count) {
  return syncWorkshopSettingsToSlides({ finalPriorityCount: count });
}

// Aktive simulierte Teilnehmer = erste N aus dem Pool (N = LP_SIM_PARTICIPANT_COUNT).
function simParticipantDefs() {
  const all = window.LP_DEBUG_PARTICIPANTS || [];
  const n = Math.max(1, Math.min(all.length, Number(window.LP_SIM_PARTICIPANT_COUNT) || all.length));
  return all.slice(0, n);
}

function simParticipantRecord(idx, sessionId, pDef = null) {
  const defs = window.LP_DEBUG_PARTICIPANTS || [];
  const def = pDef || defs[idx] || { name: `Teilnehmer ${idx + 1}` };
  const id = `debug-p-${idx}-${sessionId}`;
  return normalizeParticipantAvatar({
    id,
    session_id: sessionId,
    device_id: `debug-d-${idx}`,
    display_name: def.name || `Teilnehmer ${idx + 1}`,
    avatar_emoji: def.emoji,
    avatar_color: def.color,
    joined_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  });
}

function pushSimParticipant(participant) {
  const norm = normalizeParticipantAvatar(participant);
  if (!norm) return null;
  const existingIdx = State.participants.findIndex((x) => x.id === norm.id);
  if (existingIdx >= 0) State.participants[existingIdx] = { ...State.participants[existingIdx], ...norm };
  else State.participants.push(norm);
  return norm;
}

function sopTrackTheme(trackClass) {
  const themes = {
    'track-pre': { accent: '#206efb', badgeBg: '#dbe7ff', badgeColor: '#165fd9', soft: '#eff6ff' },
    'track-ops': { accent: '#206efb', badgeBg: '#dbe7ff', badgeColor: '#165fd9', soft: '#eff6ff' },
    'track-post': { accent: '#206efb', badgeBg: '#dbe7ff', badgeColor: '#165fd9', soft: '#eff6ff' },
  };
  return themes[trackClass] || themes['track-pre'];
}

function renderSopQuestionBadge(c) {
  if (!c.sopPhaseName && !c.sopCardName) return '';
  const theme = sopTrackTheme(c.sopTrackClass);
  const parts = [c.sopTrackLabel, c.sopPhaseName, c.sopCardName].filter(Boolean);
  return `<div class="sop-pslide-q-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(parts.join(' · '))}</div>`;
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

const USE_CASE_PART_SEP = ' | ';

function getUseCaseLabels() {
  return window.LP_USE_CASE_LABELS || {
    summary: 'Use Case Idee',
    feature: 'KI-Feature',
    dependencies: 'Abhängigkeiten',
    formula: ['Use Case Idee', 'KI-Feature', 'Abhängigkeiten'],
    guides: [
      { label: 'Use Case Idee', question: 'Was wollt ihr konkret umsetzen oder verbessern?' },
      { label: 'KI-Feature', question: 'Was soll die KI tun — Input, Output, welches Tool?' },
      { label: 'Abhängigkeiten', question: 'Was muss im Team schon da sein (Daten, Zugänge, Vorlagen)?' },
    ],
  };
}

function parseUseCaseParts(text) {
  const raw = String(text || '').trim();
  if (!raw) return { summary: '', feature: '', dependencies: '', full: '', hasParts: false };
  const parts = raw.split(/\s*\|\s*|\s·\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      summary: parts[0],
      feature: parts[1],
      dependencies: parts.slice(2).join(USE_CASE_PART_SEP),
      full: raw,
      hasParts: true,
    };
  }
  if (parts.length === 2) {
    return { summary: parts[0], feature: parts[1], dependencies: '', full: raw, hasParts: true };
  }
  return { summary: raw, feature: '', dependencies: '', full: raw, hasParts: false };
}

function joinUseCaseParts(summary, feature, dependencies) {
  const s = String(summary || '').trim();
  const f = String(feature || '').trim();
  const d = String(dependencies || '').trim();
  if (!s) return '';
  if (!f && !d) return s;
  if (!d) return `${s}${USE_CASE_PART_SEP}${f}`;
  return `${s}${USE_CASE_PART_SEP}${f}${USE_CASE_PART_SEP}${d}`;
}

function useCaseCollectLabel(text) {
  const p = parseUseCaseParts(text);
  return p.summary || p.full;
}

function useCaseFullPlain(text) {
  const p = parseUseCaseParts(text);
  if (!p.hasParts || (!p.feature && !p.dependencies)) return p.full;
  const L = getUseCaseLabels();
  const bits = [p.summary];
  if (p.feature) bits.push(`${L.feature}: ${p.feature}`);
  if (p.dependencies) bits.push(`${L.dependencies}: ${p.dependencies}`);
  return bits.join(' · ');
}

function renderUseCasePillsHtml(text, mode = 'full') {
  const p = parseUseCaseParts(text);
  const L = getUseCaseLabels();
  const summaryOnly = mode === 'collect' || mode === 'summary';
  if (summaryOnly) {
    const label = useCaseCollectLabel(text);
    if (!label) return '';
    return `<span class="uc-pills uc-pills--summary"><span class="uc-pill uc-pill--idea">${esc(label)}</span></span>`;
  }
  if (!p.hasParts || (!p.feature && !p.dependencies)) {
    return `<span class="uc-pills"><span class="uc-pill uc-pill--idea">${esc(p.full)}</span></span>`;
  }
  return `<span class="uc-pills uc-pills--full">
    ${p.summary ? `<span class="uc-pill uc-pill--idea"><span class="uc-pill-k">${esc(L.formula[0])}</span><span class="uc-pill-v">${esc(p.summary)}</span></span>` : ''}
    ${p.feature ? `<span class="uc-pill uc-pill--feature"><span class="uc-pill-k">${esc(L.formula[1])}</span><span class="uc-pill-v">${esc(p.feature)}</span></span>` : ''}
    ${p.dependencies ? `<span class="uc-pill uc-pill--deps"><span class="uc-pill-k">${esc(L.formula[2])}</span><span class="uc-pill-v">${esc(p.dependencies)}</span></span>` : ''}
  </span>`;
}

function renderUseCaseDisplayHtml(text, mode = 'full') {
  return renderUseCasePillsHtml(text, mode);
}

function useCaseDisplayModeForSlide(slide) {
  if (!slide) return 'full';
  if (isBrainstormCollectSlide(slide)) return 'collect';
  if (slide.slide_type === 'priority_matrix' || slide.settings?.sopAllTracksMatrix) return 'collect';
  if (slide.content?.sopKind === 'pitch-session' || slide.settings?.sopPitchSession) return 'full';
  if (slide.settings?.sopAllTracksVote || slide.settings?.sopTrackVote || slide.settings?.sopPhaseVote
    || slide.settings?.sopCardVote || slide.settings?.brainstormVote) return 'full';
  return 'full';
}

function readParticipantUseCaseInput(slide) {
  const summaryEl = $('#p-uc-summary');
  if (summaryEl && isBrainstormCollectSlide(slide)) {
    return joinUseCaseParts(
      summaryEl.value.trim(),
      $('#p-uc-feature')?.value.trim() || '',
      $('#p-uc-deps')?.value.trim() || '',
    );
  }
  return String($('#p-text')?.value || '').trim();
}

window.LPUseCase = {
  parseUseCaseParts,
  joinUseCaseParts,
  useCaseCollectLabel,
  useCaseFullPlain,
  getUseCaseLabels,
  renderUseCasePillsHtml,
  renderUseCaseDisplayHtml,
};

function aggregateTrackUseCases(trackKey) {
  const slides = getTrackBrainstormSlides(trackKey);
  const byCard = [];
  const allItems = [];
  slides.forEach((slide) => {
    const items = (State.responses || [])
      .filter((r) => r.slide_id === slide.id && !r.is_hidden)
      .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim(), participant_id: r.participant_id }))
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
    // Nur die echte Phase verwenden — KEIN Fallback auf den Folientitel, der bei
    // track-collect den Track-Namen wiederholt (führte zu doppeltem Track im UI).
    const phaseName = c.sopPhaseName || '';
    if (!byTrackKey.has(trackKey)) {
      byTrackKey.set(trackKey, { trackKey, trackLabel, sopGroup: c.sopGroup || null, phases: [] });
      trackOrder.push(trackKey);
    }
    const items = (State.responses || [])
      .filter((r) => r.slide_id === slide.id && !r.is_hidden)
      .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim(), participant_id: r.participant_id, authorName: r.response?._author || '' }))
      .filter((item) => item.text);
    byTrackKey.get(trackKey).phases.push({ phase: phaseName, items, slideId: slide.id });
    items.forEach((item) => allItems.push({
      ...item, trackKey, trackLabel, phase: phaseName, sopGroup: c.sopGroup || null,
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
        <div class="sop-all-track-head" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(trk.trackLabel || '')} · Top ${getWorkshopSettings().trackVoteCount}</div>
        <div class="sop-all-track-phase">
          <div class="sop-all-track-phase-head">Priorisiert im Track-Voting</div>
          <div class="sop-all-track-phase-items">${trk.items.map((it, idx) =>
            `<div class="sop-all-track-item"><strong>#${idx + 1}</strong> ${renderUseCaseDisplayHtml(it.text, 'full')}<small>${esc(it.phase || '')}${it.votes ? ` · ${it.votes}× gewählt` : ''}</small></div>`
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
  const trackHtml = (trk) => {
    const theme = sopTrackTheme(trk.trackKey);
    const phasesHtml = trk.phases.filter((p) => p.items.length).map((p) => `
      <div class="sop-all-track-phase">
        ${p.phase ? `<div class="sop-all-track-phase-head">${esc(p.phase)}</div>` : ''}
        <div class="sop-all-track-phase-items">${p.items.map((it) =>
          `<div class="sop-all-track-item">${renderUseCaseDisplayHtml(it.text, 'full')}</div>`
        ).join('')}</div>
      </div>`).join('');
    if (!phasesHtml) return '';
    return `<div class="sop-all-track-group ${esc(trk.trackKey || '')}" style="--track-accent:${theme.accent};--track-soft:${theme.soft}">
      <div class="sop-all-track-head" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(trk.trackLabel || '')}</div>
      ${phasesHtml}
    </div>`;
  };
  return `<div class="sop-all-tracks-results">${byTrack.map(trackHtml).join('')}
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

// Top Use Cases aus der FINALEN Cross-Track-Abstimmung (sopAllTracksVote).
// Diese wandern automatisch in die Impact/Effort-Matrix.
function aggregateTopFinalVotedUseCases(limit = 12) {
  return resolveFinalPriorityTopN(limit);
}

// Die final priorisierten Use Cases (genau die, die in der Matrix gelandet sind).
function getFinalPrioritizedUseCases() {
  const matrixSlide = getMatrixSlide();
  if (matrixSlide) {
    const items = getMatrixItems(matrixSlide);
    if (items?.length) return items;
  }
  const count = getFinalMatrixItemCount(matrixSlide);
  return resolveFinalPriorityTopN(count, { allowTrackFallback: !getFinalAllTracksVoteSlide() });
}

const NEXT_STEP_STATUSES = [
  { id: 'planned', label: 'Geplant' },
  { id: 'progress', label: 'In Arbeit' },
  { id: 'blocked', label: 'Blockiert' },
  { id: 'done', label: 'Erledigt' },
];

function getMatrixSlide() {
  return (State.slides || []).find((s) => s.settings?.sopAllTracksMatrix || s.content?.sopKind === 'final-matrix') || null;
}

function aggregateMatrixQuadrantItems(slide, quadrant = 'qw') {
  if (!slide) return [];
  const items = getMatrixItems(slide);
  const itemMeta = {};
  items.forEach((it) => { itemMeta[it.id] = { text: it.text, phase: it.phase, trackLabel: it.trackLabel }; });
  const itemPlacements = {};
  getVisibleResponses(slide.id).forEach((r) => {
    const m = r.response?.matrix || {};
    const meta = r.response?.meta || {};
    Object.entries(m).forEach(([itemId, q]) => {
      if (!['qw', 'sb', 'ts', 'dr'].includes(q)) return;
      if (!itemPlacements[itemId]) itemPlacements[itemId] = { qw: 0, sb: 0, ts: 0, dr: 0 };
      itemPlacements[itemId][q] += 1;
      if (meta[itemId]) itemMeta[itemId] = { ...itemMeta[itemId], ...meta[itemId] };
    });
  });
  const result = [];
  Object.entries(itemPlacements).forEach(([id, counts]) => {
    const max = Math.max(counts.qw, counts.sb, counts.ts, counts.dr);
    if (max === 0) return;
    const winner = ['qw', 'sb', 'ts', 'dr'].find((q) => counts[q] === max);
    if (winner !== quadrant) return;
    const meta = itemMeta[id] || items.find((it) => it.id === id) || {};
    result.push({
      id,
      text: meta.text || id,
      phase: meta.phase || '',
      trackLabel: meta.trackLabel || '',
      votes: counts[winner],
      total: counts.qw + counts.sb + counts.ts + counts.dr,
    });
  });
  if (!result.length) {
    const placements = loadMatrixLocal(slide.id);
    items.filter((it) => placements[it.id] === quadrant).forEach((it) => {
      result.push({ id: it.id, text: it.text, phase: it.phase || '', trackLabel: it.trackLabel || '' });
    });
  }
  return result.sort((a, b) => (b.votes || 0) - (a.votes || 0) || String(a.text).localeCompare(String(b.text), 'de'));
}

function getQuickWinMatrixUseCases() {
  const matrixSlide = getMatrixSlide();
  if (!matrixSlide) return [];
  return aggregateMatrixQuadrantItems(matrixSlide, 'qw');
}

function defaultNextStepAction() {
  return { owner: '', dueDate: '', nextStep: '', status: 'planned', notes: '' };
}

function getNextStepActions() {
  return State.session?.settings?.nextStepActions || {};
}

function formatNextStepDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function renderNextStepsActionLogHtml({ editable = false } = {}) {
  const items = State.session ? getQuickWinMatrixUseCases() : [];
  const actions = getNextStepActions();
  const participants = State.participants || [];
  if (!items.length) {
    return `<div class="ws-board ws-action-log">
      <div class="present-wait-msg"><i class="fa-solid fa-table-cells-large"></i> Die Quick Wins aus der Impact/Effort-Matrix erscheinen hier, sobald Use Cases im Quick-Win-Quadrant liegen.</div>
    </div>`;
  }
  const filled = items.filter((it) => {
    const a = actions[it.id] || {};
    return a.owner || a.dueDate || a.nextStep || (a.status && a.status !== 'planned') || a.notes;
  }).length;
  const head = `<div class="ws-board-head ws-board-head--actionlog">
      <span class="ws-board-stat"><i class="fa-solid fa-rocket"></i> ${items.length} Quick Win${items.length === 1 ? '' : 's'}</span>
      <span class="ws-board-stat ws-board-stat--accent"><i class="fa-solid fa-list-check"></i> ${filled} / ${items.length} mit Action</span>
      ${editable ? '<span class="ws-board-stat"><i class="fa-solid fa-pen"></i> Nur Host bearbeitet</span>' : ''}
    </div>`;
  const statusLabel = (id) => NEXT_STEP_STATUSES.find((s) => s.id === id)?.label || 'Geplant';
  const row = (it, i) => {
    const a = { ...defaultNextStepAction(), ...(actions[it.id] || {}) };
    const ownerCell = editable
      ? `<input type="text" class="ns-input" list="ns-owner-suggestions" data-ns-field="owner" data-ns-item="${esc(it.id)}" value="${esc(a.owner)}" placeholder="Name" />`
      : `<span class="ns-value${a.owner ? '' : ' ns-value--empty'}">${a.owner ? esc(a.owner) : '–'}</span>`;
    const dueCell = editable
      ? `<input type="date" class="ns-input ns-input--date" data-ns-field="dueDate" data-ns-item="${esc(it.id)}" value="${esc(a.dueDate)}" />`
      : `<span class="ns-value${a.dueDate ? '' : ' ns-value--empty'}">${a.dueDate ? esc(formatNextStepDate(a.dueDate)) : '–'}</span>`;
    const stepCell = editable
      ? `<input type="text" class="ns-input" data-ns-field="nextStep" data-ns-item="${esc(it.id)}" value="${esc(a.nextStep)}" placeholder="Erster Schritt…" />`
      : `<span class="ns-value${a.nextStep ? '' : ' ns-value--empty'}">${a.nextStep ? esc(a.nextStep) : '–'}</span>`;
    const statusCell = editable
      ? `<select class="ns-input ns-select" data-ns-field="status" data-ns-item="${esc(it.id)}">${NEXT_STEP_STATUSES.map((s) => `<option value="${s.id}"${a.status === s.id ? ' selected' : ''}>${esc(s.label)}</option>`).join('')}</select>`
      : `<span class="ns-status ns-status--${esc(a.status || 'planned')}">${esc(statusLabel(a.status))}</span>`;
    const notesCell = editable
      ? `<input type="text" class="ns-input" data-ns-field="notes" data-ns-item="${esc(it.id)}" value="${esc(a.notes)}" placeholder="Notiz…" />`
      : `<span class="ns-value ns-value--notes${a.notes ? '' : ' ns-value--empty'}">${a.notes ? esc(a.notes) : '–'}</span>`;
    return `<div class="ws-row ws-row--action${editable ? ' ws-row--action-edit' : ''}" data-ns-item="${esc(it.id)}">
        <span class="ws-c-rank">${i + 1}</span>
        <span class="ws-c-uc">
          <span class="ws-uc-text">${renderUseCaseDisplayHtml(it.text, 'full')}</span>
          ${(it.trackLabel || it.phase) ? `<span class="ws-uc-meta">${it.trackLabel ? `<span class="ws-uc-track">${esc(it.trackLabel)}</span>` : ''}${it.phase && it.phase !== it.trackLabel ? `<span class="ws-uc-phase">${esc(it.phase)}</span>` : ''}</span>` : ''}
        </span>
        <span class="ws-c-owner">${ownerCell}</span>
        <span class="ws-c-due">${dueCell}</span>
        <span class="ws-c-step">${stepCell}</span>
        <span class="ws-c-status">${statusCell}</span>
        <span class="ws-c-notes">${notesCell}</span>
      </div>`;
  };
  const datalist = editable && participants.length
    ? `<datalist id="ns-owner-suggestions">${participants.map((p) => `<option value="${esc(p.display_name || '')}"></option>`).join('')}</datalist>`
    : '';
  return `${datalist}<div class="ws-board ws-action-log">${head}
    <div class="ws-table ws-table--actionlog">
      <div class="ws-row ws-row--head ws-row--action">
        <span class="ws-c-rank">#</span>
        <span class="ws-c-uc">Quick Win · Use Case</span>
        <span class="ws-c-owner">Verantwortlich</span>
        <span class="ws-c-due">Bis wann</span>
        <span class="ws-c-step">Nächster Schritt</span>
        <span class="ws-c-status">Status</span>
        <span class="ws-c-notes">Notiz</span>
      </div>
      ${items.map(row).join('')}
    </div>
  </div>`;
}

let _nextStepSaveTimer = 0;

async function saveNextStepActions(actions) {
  if (!State.session?.id || !State.user) return;
  const settings = { ...(State.session.settings || {}), nextStepActions: actions };
  const { error } = await sb.from('lp_sessions').update({ settings }).eq('id', State.session.id);
  if (error) return;
  State.session.settings = settings;
  try {
    State.sessionChannel?.send({ type: 'broadcast', event: 'session_sync', payload: { settings } });
  } catch { /* channel may not be ready */ }
}

function bindNextStepsActionLog(root) {
  if (!root || !State.user) return;
  root.querySelectorAll('.ns-input').forEach((el) => {
    const handler = () => {
      const itemId = el.dataset.nsItem;
      const field = el.dataset.nsField;
      if (!itemId || !field) return;
      const actions = { ...getNextStepActions() };
      actions[itemId] = { ...defaultNextStepAction(), ...(actions[itemId] || {}), [field]: el.value };
      State.session.settings = { ...(State.session.settings || {}), nextStepActions: actions };
      clearTimeout(_nextStepSaveTimer);
      _nextStepSaveTimer = setTimeout(() => { void saveNextStepActions(actions); }, 450);
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
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
  if (st.sopPhaseVote && key && c.sopPhaseName) {
    return { kind: 'phase', key, phaseName: c.sopPhaseName, cardName: null, maxSelections: st.sopVoteMax || c.maxSelections || 3 };
  }
  if (st.sopTrackVote && key) {
    return { kind: 'track', key, maxSelections: getTrackVoteCount(slide) };
  }
  if (st.sopAllTracksVote) {
    return { kind: 'all-tracks', key: null, maxSelections: finalPriorityCount(slide) };
  }
  return null;
}

// Zentrale Anzahl der final priorisierten Use Cases (→ wandern in die Matrix).
function finalPriorityCount(slide) {
  const st = slide?.settings || {};
  const ws = getWorkshopSettings();
  return Number(st.sopVoteMax || st.sopFinalCount || ws.finalPriorityCount || 10);
}

// ─── Finale Priorisierung & Matrix: strikte Integrität ───────────────────────
function getFinalAllTracksVoteSlide() {
  return (State.slides || []).find((s) => s.settings?.sopAllTracksVote) || null;
}

function getFinalMatrixItemCount(matrixSlide) {
  const voteSlide = getFinalAllTracksVoteSlide();
  if (voteSlide) return finalPriorityCount(voteSlide);
  return Number(matrixSlide?.settings?.sopMatrixCount || getWorkshopSettings().finalPriorityCount || 10);
}

function getAllTracksVoteOptionMap() {
  const { allItems } = aggregateAllTracksUseCases();
  const map = {};
  allItems.forEach((item) => { map[`resp-${item.id}`] = item; });
  return map;
}

function getAllTracksVoteOptionIds(slide) {
  // Teilnehmer: gültige IDs aus den gebroadcasteten Optionen (lokale Aggregation
  // ist auf der Teilnehmerseite ggf. leer → würde sonst gültige Auswahl ablehnen).
  const broadcast = getBroadcastVoteGroups(slide);
  if (broadcast) {
    const ids = new Set();
    broadcast.forEach((g) => (g.options || []).forEach((o) => o?.id && ids.add(o.id)));
    return ids;
  }
  const scope = getVoteSlideScope(slide);
  if (!scope || scope.kind !== 'all-tracks') {
    return new Set(Object.keys(getAllTracksVoteOptionMap()));
  }
  const grp = slide?.content?.sopGroup || null;
  if (!grp) return new Set(Object.keys(getAllTracksVoteOptionMap()));
  const ids = new Set();
  getTrackVoteOptionsGrouped(slide).forEach((g) => g.options.forEach((o) => ids.add(o.id)));
  return ids;
}

function computeFinalVoteTotals(voteSlide) {
  const itemByVoteId = getAllTracksVoteOptionMap();
  const totals = {};
  const votes = {};
  if (!voteSlide) return { totals, votes, itemByVoteId };
  (State.responses || [])
    .filter((r) => r.slide_id === voteSlide.id && !r.is_hidden)
    .forEach((r) => {
      (r.response?.values || []).forEach((id) => {
        if (!itemByVoteId[id]) return;
        votes[id] = (votes[id] || 0) + 1;
        totals[id] = (totals[id] || 0) + 10;
      });
      Object.entries(r.response?.points || {}).forEach(([id, val]) => {
        if (!itemByVoteId[id]) return;
        totals[id] = (totals[id] || 0) + Number(val || 0);
      });
    });
  return { totals, votes, itemByVoteId };
}

function resolveFinalPriorityTopN(count, { allowTrackFallback = false } = {}) {
  const n = Math.max(1, Number(count) || getWorkshopSettings().finalPriorityCount || 10);
  const voteSlide = getFinalAllTracksVoteSlide();
  if (voteSlide) {
    const { totals, votes, itemByVoteId } = computeFinalVoteTotals(voteSlide);
    return Object.entries(totals)
      .map(([id, score]) => ({ ...itemByVoteId[id], voteId: id, score, votes: votes[id] || 0 }))
      .filter((item) => item?.id && item?.text && item.score > 0)
      .sort((a, b) => b.score - a.score || b.votes - a.votes || String(a.text).localeCompare(String(b.text), 'de'))
      .slice(0, n)
      .map(({ id, text, phase, trackLabel, score, votes: v, participant_id }) => ({
        id, text, phase, trackLabel, score, votes: v, participant_id: participant_id || null,
      }));
  }
  if (allowTrackFallback) {
    return aggregateTopTrackVotedUseCases()
      .flatMap((trk) => trk.items.map((item) => ({
        id: item.id, text: item.text, phase: item.phase, trackLabel: trk.trackLabel,
        score: item.score, votes: item.votes, participant_id: item.participant_id || null,
      })))
      .sort((a, b) => (b.score || 0) - (a.score || 0) || (b.votes || 0) - (a.votes || 0))
      .slice(0, n)
      .filter((item) => item?.id && item?.text);
  }
  return [];
}

// Teilnehmer: gebroadcastete Matrix-Items (Lookup über Folien-ID + Host-/Matrix-Fallback).
function getPushedMatrixItems(slide) {
  const store = State.matrixItemsBySlide || {};
  if (Array.isArray(store[slide?.id]) && store[slide.id].length) return store[slide.id];
  const hostSlide = State.slides?.[State.session?.current_slide_index || 0];
  if (hostSlide?.id && hostSlide.id !== slide?.id && Array.isArray(store[hostSlide.id]) && store[hostSlide.id].length) {
    return store[hostSlide.id];
  }
  const mx = getMatrixSlide();
  if (mx?.id && mx.id !== slide?.id && Array.isArray(store[mx.id]) && store[mx.id].length) return store[mx.id];
  return null;
}

function sanitizeMatrixItemsList(items, slide, { count } = {}) {
  const n = count ?? getFinalMatrixItemCount(slide);
  return (Array.isArray(items) ? items : [])
    .filter((i) => i?.id && i?.text)
    .slice(0, n);
}

function assertMatrixItemsIntegrity(items, slide, { count } = {}) {
  const n = count ?? getFinalMatrixItemCount(slide);
  const actual = sanitizeMatrixItemsList(items, slide, { count: n });
  if (!actual.length) return [];

  const isParticipantView = Boolean(State.participant && !State.user);
  const expected = resolveFinalPriorityTopN(n, { allowTrackFallback: !getFinalAllTracksVoteSlide() });

  // Teilnehmer ohne lokale Vote-Daten: gebroadcastete Items nicht verwerfen.
  // (Sonst leere Matrix trotz gültigem Host-Broadcast — Hauptursache des Bugs.)
  if (isParticipantView && !expected.length) return actual;

  const expectedIds = expected.map((i) => i.id);
  const actualIds = actual.map((i) => i.id);
  const ok = actual.length <= n
    && actual.every((i) => expectedIds.includes(i.id))
    && actualIds.length === new Set(actualIds).size
    && (expected.length === 0 || actual.length === expected.length);
  if (!ok && typeof console !== 'undefined') {
    console.warn('[LP] Matrix-Integrität: Items weichen von Final-Vote Top-N ab', { expected: expectedIds, actual: actualIds });
  }
  return ok ? actual : expected;
}

function isMatrixFairVote(slide) {
  if (!slide) return false;
  if (slide.settings?.sopFairVote) return true;
  const voteSlide = getFinalAllTracksVoteSlide();
  return !!(slide.settings?.sopAllTracksMatrix && voteSlide?.settings?.sopFairVote);
}

function isOwnMatrixItem(item, slide) {
  if (!isMatrixFairVote(slide) || !State.participant?.id) return false;
  return item?.participant_id === State.participant.id;
}

function sanitizeMatrixPlacements(placements, allowedIds) {
  const out = {};
  Object.entries(placements || {}).forEach(([id, q]) => {
    if (!allowedIds.has(id)) return;
    if (['qw', 'sb', 'ts', 'dr'].includes(q)) out[id] = q;
  });
  return out;
}

function validateVoteValues(slide, values) {
  const scope = getVoteSlideScope(slide);
  if (!scope) return { ok: true, values: values || [] };
  const vals = Array.isArray(values) ? values.filter(Boolean) : [];
  const max = scope.maxSelections || 3;
  if (!vals.length) return { ok: false, error: 'Mindestens 1 Use Case wählen' };
  if (vals.length > max) return { ok: false, error: `Maximal ${max} Use Cases` };
  const validIds = scope.kind === 'all-tracks'
    ? getAllTracksVoteOptionIds(slide)
    : new Set(getVoteOptions(slide).map((o) => o.id).filter((id) => id !== 'none'));
  if (vals.some((id) => !validIds.has(id))) {
    return { ok: false, error: 'Ungültige Auswahl — bitte erneut wählen' };
  }
  if (slide.settings?.sopFairVote && State.participant?.id) {
    const ownIds = new Set();
    getTrackVoteOptionsGrouped(slide).forEach((g) => {
      g.options.forEach((o) => {
        if (o.participant_id === State.participant.id) ownIds.add(o.id);
      });
    });
    if (vals.some((id) => ownIds.has(id))) {
      return { ok: false, error: 'Eigene Beiträge können nicht gewählt werden' };
    }
  }
  if (!slide.settings?.multipleResponses && State.participant?.id) {
    const dup = (State.responses || []).some((r) =>
      r.slide_id === slide.id && r.participant_id === State.participant.id && !r.is_hidden
    );
    if (dup) return { ok: false, error: 'Du hast bereits abgestimmt' };
  }
  return { ok: true, values: vals };
}

function invalidateMatrixItemsCache(slideId) {
  if (slideId && State.matrixItemsBySlide) {
    const next = { ...State.matrixItemsBySlide };
    delete next[slideId];
    State.matrixItemsBySlide = next;
  } else {
    State.matrixItemsBySlide = {};
  }
  State._lastMatrixSig = null;
}

function maybeRefreshMatrixBroadcastFromVote(response) {
  if (!response?.slide_id) return;
  const voteSlide = getFinalAllTracksVoteSlide();
  if (!voteSlide || response.slide_id !== voteSlide.id) return;
  invalidateMatrixItemsCache();
  const matrixSlide = getMatrixSlide();
  if (matrixSlide) broadcastMatrixItems(matrixSlide);
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

function aggregatePhaseUseCases(trackKey, phaseName) {
  const slides = (State.slides || []).filter((s) => {
    const c = s.content || {};
    const trackMatch = c.sopTrackKey === trackKey || c.sopTrackClass === trackKey;
    return trackMatch && s.slide_type === 'brainstorm' && c.sopKind === 'phase-workshop' && c.sopPhaseName === phaseName;
  });
  const items = [];
  slides.forEach((slide) => {
    (State.responses || [])
      .filter((r) => r.slide_id === slide.id && !r.is_hidden)
      .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim(), phase: phaseName }))
      .filter((item) => item.text)
      .forEach((item) => items.push(item));
  });
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
  const colors = ['#206efb', '#10b981', '#06b6d4', '#6366f1', '#ef4444', '#14b8a6', '#22d3ee'];
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
  if (c.isHeroSlide) return true;
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
    ? `<div class="canvas-editable canvas-title pslide-hero-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="pslide-hero-title">${esc(c.title || '')}</h1>`;
  const bodyEl = editable
    ? `<div class="canvas-editable pslide-hero-body" contenteditable="true" data-field="body">${esc(c.body || c.subtitle || '')}</div>`
    : `<p class="pslide-hero-body">${esc(c.body || c.subtitle || '').replace(/\n/g, '<br>')}</p>`;
  return `
    <div class="pslide-hero canvas-body-wrap">
      <div class="canvas-centered-icon pslide-hero-icon"><i class="fa-solid ${icon}"></i></div>
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
    el.classList.add('is-active', 'just-saved');
    el.innerHTML = '<i class="fa-solid fa-check pill-check"></i> Gespeichert';
    // Animation neu antriggern
    void el.offsetWidth;
    clearTimeout(_autosaveTimer);
    _autosaveTimer = setTimeout(() => setEditorSaveStatus('idle'), 2400);
    return;
  }
  el.classList.add('is-active');
  el.innerHTML = '<span class="pill-dot"></span> Autosave aktiv';
}

// ─── Simulations-/Debug-Modus (Toggle-Pill im Editor-Header) ─────────────────
function syncSimulationPill() {
  const btn = $('#editor-sim-toggle');
  if (!btn) return;
  const on = !!State.presentation?.settings?.debug;
  btn.classList.toggle('is-on', on);
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  const st = btn.querySelector('.sim-pill-state');
  if (st) st.textContent = on ? 'an' : 'aus';
}

async function toggleSimulationMode() {
  if (!State.presentation) return;
  const settings = { ...(State.presentation.settings || {}) };
  settings.debug = !settings.debug;
  State.presentation.settings = settings;
  syncSimulationPill();
  try {
    await sb.from('lp_presentations').update({ settings }).eq('id', State.presentation.id);
    toast(settings.debug
      ? '🧪 Simulation an — beim Präsentieren joinen simulierte Teilnehmer & Antworten'
      : 'Simulation aus', settings.debug ? 'info' : 'success');
  } catch (e) {
    toast(e?.message || 'Konnte Simulation nicht umschalten', 'error');
  }
}

function isBrainstormCollectSlide(slide) {
  if (!slide || !COLLECT_CHAIN_TYPES.has(slide.slide_type)) return false;
  const c = slide.content || {};
  if (isSopWorkshopPresentation() && (c.sopKind === 'dual-pair-collect' || c.sopKind === 'phase-workshop' || c.sopKind === 'card-workshop' || c.sopKind === 'track-collect' || c.sopCardName)) return true;
  return hasCollectChain(slide);
}

function shouldUseVoteWorkshopUi(slide) {
  if (!slide) return false;
  if (isSopWorkshopPresentation() && (slide.settings?.sopCardVote || slide.settings?.sopPhaseVote || slide.settings?.sopTrackVote || slide.settings?.sopAllTracksVote)) return true;
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
  // Teilnehmer: aus den gebroadcasteten Gruppen ableiten (flach), damit Experten-
  // modus + Validierung dieselben Optionen kennen wie die Auswahlliste.
  const broadcast = getBroadcastVoteGroups(slide);
  if (broadcast) {
    const flat = broadcast.flatMap((g) => g.options || []);
    return flat.length ? flat : [{ id: 'none', text: 'Noch keine Use Cases gesammelt' }];
  }
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
  if (scope.kind === 'phase') {
    const { items } = aggregatePhaseUseCases(scope.key, scope.phaseName);
    if (!items.length) return [{ id: 'none', text: 'Noch keine Use Cases in dieser Phase gesammelt' }];
    return items.map((item) => ({ id: `resp-${item.id}`, text: item.text }));
  }
  if (scope.kind === 'all-tracks') {
    const grp = slide?.content?.sopGroup || null;
    let { allItems } = aggregateAllTracksUseCases();
    if (grp) allItems = allItems.filter((it) => it.sopGroup === grp);
    if (!allItems.length) return [{ id: 'none', text: 'Noch keine Use Cases gesammelt' }];
    return allItems.map((item) => ({ id: `resp-${item.id}`, text: item.text }));
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
    if (step === 'phase-vote') {
      return st.sopPhaseVote && trackMatch && c.sopPhaseName === phaseName;
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
  if (st.sopPhaseVote) {
    return { trackKey: c.sopTrackKey || c.sopTrackClass, phaseName: c.sopPhaseName, cardName: null, kind: 'phase-vote' };
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
  if (c.sopKind === 'dual-pair-orient' || c.sopKind === 'dual-pair-collect') {
    const pairIdx = c.sopDualPairIndex ?? 0;
    const track = window.INTERNAL_SOP_TRACKS?.[pairIdx] || window.SOP_TOOL_TRACKS?.[pairIdx];
    return {
      trackKey: track?.class || null,
      phaseName: null,
      cardName: null,
      kind: c.sopKind === 'dual-pair-collect' ? 'track-collect' : 'track-intro',
    };
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
  if (ctx.kind === 'track-vote' || ctx.kind === 'phase-vote' || ctx.kind === 'card-vote' || ctx.kind === 'card-results') return 'decide';
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
  if (ctx.kind === 'phase-vote') {
    const phases = getTrackPhaseSlideIndexes(trackKey);
    const idx = phases.findIndex(({ s }) => s.content?.sopPhaseName === ctx.phaseName);
    const phaseNum = idx >= 0 ? idx + 1 : 0;
    const pct = phases.length ? Math.round((phaseNum / phases.length) * 100) : 0;
    return { trackKey, trackLabel, step: 'decide', stepLabel: 'Priorisierung', cardIndex: phaseNum, cardTotal: phases.length, pct, phaseName: ctx.phaseName, counter: `Priorisierung ${phaseNum} / ${phases.length} · ${ctx.phaseName}` };
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
  return `<div class="pslide-slide-counter">Folie ${slideIndex + 1} / ${State.slides.length}</div>`;
}

function wrapSlide(bodyHtml, slideIndex) {
  const ws = isSopWorkshopPresentation();
  return `<div class="pslide-slide${ws ? ' pslide-slide--ws' : ''}">
    ${ws ? '' : renderWorkshopProgressHtml(slideIndex)}
    <div class="pslide-slide-content${ws ? ' pslide-slide-content--ws' : ''}">${bodyHtml}</div>
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

function isGenericCollectCardLabel(label) {
  return !label || /^(use cases sammeln|ki use cases|use cases)$/i.test(String(label).trim());
}

function renderTrackVoteGroupHeadHtml(g) {
  const showCard = g.card && !isGenericCollectCardLabel(g.card);
  if (showCard) {
    return `<div class="track-vote-group-head"><span>${esc(g.phase)}</span><strong>${esc(g.card)}</strong></div>`;
  }
  return `<div class="track-vote-group-head track-vote-group-head--phase-only"><strong>${esc(g.phase)}</strong></div>`;
}

// Teilnehmer: vom Moderator gebroadcastete Vote-Optionen (funktioniert auch im
// Simulationsmodus, wo fremde Antworten nur lokal beim Presenter liegen — analog
// zu den Matrix-Items). Lookup über die Folien-ID, mit Fallback auf den Host-Slide.
function getBroadcastVoteGroups(slide) {
  // Nur auf der Teilnehmerseite (kein eingeloggter Host) gebroadcastete Optionen nutzen.
  if (!slide || !State.participant || State.user) return null;
  const store = State.voteOptionsBySlide || {};
  if (Array.isArray(store[slide.id]) && store[slide.id].length) return store[slide.id];
  const hostSlide = State.slides?.[State.session?.current_slide_index || 0];
  if (hostSlide && hostSlide.id !== slide.id && Array.isArray(store[hostSlide.id]) && store[hostSlide.id].length) {
    return store[hostSlide.id];
  }
  return null;
}

function getTrackVoteOptionsGrouped(slide) {
  const broadcast = getBroadcastVoteGroups(slide);
  if (broadcast) return broadcast;
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
  if (scope?.kind === 'phase') {
    const opts = getVoteOptions(slide).filter((o) => o.id !== 'none');
    if (!opts.length) return [];
    return [{
      phase: scope.phaseName,
      card: 'KI Use Cases',
      options: opts,
    }];
  }
  if (scope?.kind === 'all-tracks') {
    const { byTrack } = aggregateAllTracksUseCases();
    const grp = slide.content?.sopGroup || null; // Gruppen-Vote (internal/consulting) nur die eigene Gruppe
    const groups = [];
    (grp ? byTrack.filter((t) => t.sopGroup === grp) : byTrack).forEach((trk) => {
      trk.phases.forEach((p) => {
        if (p.items.length) {
          groups.push({
            phase: p.phase ? `${trk.trackLabel} · ${p.phase}` : trk.trackLabel,
            card: '',
            options: p.items.map((item) => ({ id: `resp-${item.id}`, text: item.text, participant_id: item.participant_id })),
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
      options: g.items.map((item) => ({ id: `resp-${item.id}`, text: item.text, participant_id: item.participant_id })),
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
          <span class="card-vote-winner-text">${renderUseCaseDisplayHtml(w.text, 'full')}</span>
          <span class="card-vote-winner-pct">${mode === 'count' ? `${w.votes} Stimmen` : `${w.pct}% · ${w.votes} Stimmen`}</span>
        </div>`).join('')}</div>`;
    }
  }
  html += ranked.map((o) => {
    const barPct = mode === 'count' ? Math.round((o.votes / maxVotes) * 100) : Math.round((o.pct / maxPct) * 100);
    const label = mode === 'count' ? `${o.votes}` : `${o.pct}%`;
    return `<div class="track-vote-result-row card-vote-result-row">
      <span>${renderUseCaseDisplayHtml(o.text, 'full')}</span>
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
  if (scope?.kind === 'phase') return renderPhaseVotePresentHtml(slide, visible);
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
  const voteBubbleItems = items.map((item) => ({ ...item, text: useCaseFullPlain(item.text) }));
  const bubbleHtml = window.LPViz.renderBrainstormBubbles(voteBubbleItems, { mode: 'present', maxItems: 80, newIds });
  const hasVotes = visible.length > 0;
  const maxHint = scope.maxSelections || 2;
  return `<div class="track-vote-present card-vote-present">
    <div class="track-vote-present-head">
      <span class="track-vote-count">${items.length} Ideen · ${esc(label)}</span>
      <span class="track-vote-hint">${State.session.question_open ? `Max. ${maxHint} Favoriten pro Person` : 'Abstimmung abgeschlossen'}</span>
    </div>
    ${renderCardVoteParticipationHtml(slide)}
    ${hasVotes ? `<div class="track-vote-live-ranking"><div class="track-vote-live-label">Live-Ergebnis (Prozent)</div>${renderVoteResultsHtml(slide, visible)}</div>` : '<div class="present-wait-msg">Warte auf die ersten Stimmen …</div>'}
  </div>`;
}

function renderPhaseVotePresentHtml(slide, visible) {
  const scope = getVoteSlideScope(slide);
  const { items } = aggregatePhaseUseCases(scope?.key, scope?.phaseName);
  if (!items.length) {
    return '<div class="present-wait-msg">Noch keine Use Cases in dieser Phase gesammelt. Bitte zuerst die Phase sammeln.</div>';
  }
  return `<div class="phase-vote-present">
    <div class="track-vote-present-head">
      <span class="track-vote-count">${items.length} Use Cases · ${esc(scope.phaseName || 'Phase')}</span>
      <span class="track-vote-hint">${State.session.question_open ? `Teilnehmer priorisieren jetzt die Top ${getTrackVoteCount(slide)}` : 'Priorisierung abgeschlossen'}</span>
    </div>
    ${renderCardVoteParticipationHtml(slide)}
    <div class="phase-vote-leaderboard">
      <div class="track-vote-live-label">Leaderboard der Phase</div>
      ${renderVoteResultsHtml(slide, visible)}
    </div>
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
    .map((r) => ({ id: r.id, text: useCaseCollectLabel(String(r.response?.text || '').trim()) }))
    .filter((item) => item.text);
  const newIds = markNewBubbleIds(slide.id, items);
  return window.LPViz.renderBrainstormBubbles(items, { mode: 'present', maxItems: 100, newIds });
}

// Brainstorm-Slides einer SOP-Gruppe, in Deck-Reihenfolge.
function brainstormSlidesOfGroup(group) {
  return (State.slides || []).filter((s) => s.slide_type === 'brainstorm' && s.content?.sopGroup === group);
}

function trackIntroSlidesOfGroup(group) {
  return (State.slides || []).filter((s) => s.slide_type === 'section' && s.content?.sopGroup === group && s.content?.sopKind === 'track');
}

function isDualSopWorkshop() {
  const groups = new Set((State.slides || []).map((s) => s.content?.sopGroup).filter(Boolean));
  return groups.has('internal') && groups.has('consulting');
}

// Split-View + parallele Teilnehmer-Zuweisung nur bei explizit paralleler Dual-SOP-Vorlage.
function isDualSopParallelWorkshop() {
  if ((State.slides || []).some((s) => s.content?.sopDualParallel)) return true;
  if (!isDualSopWorkshop()) return false;
  const intBrain = brainstormSlidesOfGroup('internal');
  const conIntroIdx = (State.slides || []).findIndex((s) => s.content?.sopGroup === 'consulting' && s.content?.sopKind === 'track');
  const lastIntBrainIdx = intBrain.length
    ? (State.slides || []).findIndex((s) => s.id === intBrain[intBrain.length - 1].id)
    : -1;
  return conIntroIdx >= 0 && lastIntBrainIdx >= 0 && conIntroIdx < lastIntBrainIdx;
}

function getDualSopPairIndex(slide) {
  if (!slide) return null;
  if (slide.content?.sopDualPairIndex != null) return slide.content.sopDualPairIndex;
  const group = slide.content?.sopGroup;
  if (!group) return null;
  if (slide.slide_type === 'brainstorm') {
    return brainstormSlidesOfGroup(group).findIndex((s) => s.id === slide.id);
  }
  if (slide.slide_type === 'section' && slide.content?.sopKind === 'track') {
    return trackIntroSlidesOfGroup(group).findIndex((s) => s.id === slide.id);
  }
  return null;
}

function getParticipantSopGroup(participantId) {
  if (!participantId || !State.session?.settings) return null;
  return State.session.settings.dualSopAssignments?.[participantId] || null;
}

function isParticipantSharedSlide(slide) {
  if (!slide) return true;
  const c = slide.content || {};
  if (isFinaleSlide(slide)) return true;
  if (c.sopDualBoth) return true;
  if (c.sopKind === 'participants' || c.sopKind === 'group-transition') return true;
  if (c.sopKind === 'workshop-goal' || c.sopKind === 'instructions') return true;
  if (c.isHeroSlide) return true;
  if (!c.sopGroup && c.sopKind !== 'dual-pair-collect') return true;
  return false;
}

function participantNeedsSopAssignment(slide) {
  if (!isDualSopWorkshop() || !State.participant || isParticipantSharedSlide(slide)) return false;
  return !getParticipantSopGroup(State.participant.id);
}

function participantOnWrongSopGroup(slide) {
  if (!isDualSopWorkshop() || !State.participant || isParticipantSharedSlide(slide)) return false;
  const assigned = getParticipantSopGroup(State.participant.id);
  if (!assigned) return false;
  const slideGroup = slide.content?.sopGroup;
  if (!slideGroup) return false;
  return slideGroup !== assigned;
}

function renderParticipantSopWaitHtml({ title = 'SOP-Zuweisung', lead = '' } = {}) {
  return `<div class="participant-wait-block participant-sop-unassigned ws-slide ws-slide--orient">
    <header class="ws-slide-head"><span class="ws-pill ws-pill--orient"><i class="fa-solid fa-hourglass-half"></i> Warte</span></header>
    <h1 class="ws-title">${esc(title)}</h1>
    <p class="ws-lead">${esc(lead || 'Bitte auf den Host achten…')}</p>
  </div>`;
}

function getDualSopAssignBuckets() {
  const buckets = { internal: [], consulting: [], unassigned: [] };
  (State.participants || []).forEach((p) => {
    const g = getParticipantSopGroup(p.id);
    if (g === 'internal' || g === 'consulting') buckets[g].push(p);
    else buckets.unassigned.push(p);
  });
  return buckets;
}

function participantAssignButtonsHtml(p, { large = false } = {}) {
  const assigned = getParticipantSopGroup(p.id);
  const activeInternal = assigned === 'internal' ? ' is-active' : '';
  const activeConsulting = assigned === 'consulting' ? ' is-active' : '';
  const intMeta = getSopGroupMeta('internal');
  const conMeta = getSopGroupMeta('consulting');
  if (large) {
    return `<span class="sop-assign-btns sop-assign-btns--large" role="group" aria-label="SOP-Zuweisung für ${esc(p.display_name || 'Gast')}">
      <button type="button" class="sop-assign-btn sop-assign-btn--internal${activeInternal}" data-sop-assign="internal" data-participant-id="${esc(p.id)}">
        <i class="fa-solid ${intMeta.icon}"></i> ${esc(intMeta.shortLabel || 'Internal')}
      </button>
      <button type="button" class="sop-assign-btn sop-assign-btn--consulting${activeConsulting}" data-sop-assign="consulting" data-participant-id="${esc(p.id)}">
        <i class="fa-solid ${conMeta.icon}"></i> ${esc(conMeta.shortLabel || 'Consulting')}
      </button>
    </span>`;
  }
  return `<span class="sop-assign-btns" role="group" aria-label="SOP-Zuweisung für ${esc(p.display_name || 'Gast')}">
    <button type="button" class="sop-assign-btn sop-assign-btn--internal${activeInternal}" data-sop-assign="internal" data-participant-id="${esc(p.id)}" title="${esc(intMeta.label)}">${esc(intMeta.shortLabel || 'Internal')}</button>
    <button type="button" class="sop-assign-btn sop-assign-btn--consulting${activeConsulting}" data-sop-assign="consulting" data-participant-id="${esc(p.id)}" title="${esc(conMeta.label)}">${esc(conMeta.shortLabel || 'Consulting')}</button>
  </span>`;
}

function renderSopAssignBoardHtml({ large = false } = {}) {
  if (!isDualSopWorkshop()) return '';
  const buckets = getDualSopAssignBuckets();
  const total = State.participants?.length || 0;
  if (!total) {
    return `<div class="sop-assign-board${large ? ' sop-assign-board--stage' : ''}">
      <p class="sop-assign-empty"><i class="fa-solid fa-qrcode"></i> Warte auf Teilnehmer per QR-Code…</p>
    </div>`;
  }
  const rowHtml = (p) => `<div class="sop-assign-row${large ? ' sop-assign-row--large' : ''}" data-participant-id="${esc(p.id)}">
    ${participantAvatarHtml(p, large ? 'md' : 'sm')}
    <span class="sop-assign-name">${esc(p.display_name || 'Gast')}</span>
    ${participantAssignButtonsHtml(p, { large })}
  </div>`;
  const column = (group, list) => {
    if (!list.length) return '';
    const meta = getSopGroupMeta(group);
    return `<div class="sop-assign-col sop-assign-col--${group}">
      <div class="sop-assign-col-head">
        <i class="fa-solid ${meta.icon}"></i> ${esc(meta.label)}
        <span class="sop-split-col-count">${list.length}</span>
      </div>
      <div class="sop-assign-col-list">${list.map(rowHtml).join('')}</div>
    </div>`;
  };
  const unassignedCol = buckets.unassigned.length ? `<div class="sop-assign-col sop-assign-col--unassigned">
    <div class="sop-assign-col-head">
      <i class="fa-solid fa-user-clock"></i> Noch nicht zugewiesen
      <span class="sop-split-col-count">${buckets.unassigned.length}</span>
    </div>
    <div class="sop-assign-col-list">${buckets.unassigned.map(rowHtml).join('')}</div>
  </div>` : '';
  const hint = large
    ? `<p class="sop-assign-hint"><i class="fa-solid fa-hand-pointer"></i> ${total} Teilnehmer beigetreten — weise jeden Internal oder Consulting zu. In der Mobilansicht sehen Teilnehmer nur ihr SOP, bis Pitch, Priorisierung und Matrix.</p>`
    : '';
  return `<div class="sop-assign-board${large ? ' sop-assign-board--stage' : ''}" data-sop-assign-board>
    ${hint}
    <div class="sop-assign-columns">
      ${column('internal', buckets.internal)}
      ${column('consulting', buckets.consulting)}
      ${unassignedCol}
    </div>
  </div>`;
}

function findDualSopSlideByPair(group, pairIndex, slideType) {
  if (pairIndex == null || pairIndex < 0) return null;
  return (State.slides || []).find((s) => s.slide_type === slideType
    && s.content?.sopGroup === group
    && getDualSopPairIndex(s) === pairIndex) || null;
}

function resolveParticipantSlide(slide) {
  if (!slide || !isDualSopWorkshop() || !State.participant) return slide;
  if (isParticipantSharedSlide(slide)) return slide;
  if (participantOnWrongSopGroup(slide) || participantNeedsSopAssignment(slide)) return slide;

  if (slide.content?.sopKind === 'dual-pair-collect' && isDualSopParallelWorkshop()) {
    const group = getParticipantSopGroup(State.participant.id);
    if (!group) return slide;
    const pairIdx = getDualSopPairIndex(slide);
    return findDualSopSlideByPair(group, pairIdx, 'brainstorm') || slide;
  }

  const group = getParticipantSopGroup(State.participant.id);
  if (!group) return slide;
  if (slide.content?.sopGroup === group) return slide;

  const pairIdx = getDualSopPairIndex(slide);
  if (pairIdx != null && pairIdx >= 0) {
    return findDualSopSlideByPair(group, pairIdx, slide.slide_type) || slide;
  }
  return slide;
}

async function assignParticipantSopGroup(participantId, group) {
  if (!State.session?.id) return;
  const prev = State.session.settings?.dualSopAssignments || {};
  const dualSopAssignments = { ...prev, [participantId]: group };
  const settings = { ...(State.session.settings || {}), dualSopAssignments };
  const { error } = await sb.from('lp_sessions').update({ settings }).eq('id', State.session.id);
  if (error) { toast('SOP-Zuweisung fehlgeschlagen', 'error'); return; }
  State.session.settings = settings;
  renderPresentParticipants();
  if (currentSessionSlide()?.content?.sopKind === 'participants') renderPresent();
  toast(group === 'internal' ? '→ Internal SOP' : '→ Consulting SOP', 'success');
}

function participantChipHtml(p) {
  return `<div class="present-participant-chip">${participantAvatarHtml(p, 'sm')}<span>${esc(p.display_name || 'Gast')}</span></div>`;
}

// Eine vollständige Brainstorm-Slide als Spalte (Frage + Board + Live-Bubbles DIESER Slide).
function findSopTrackByClass(className) {
  if (!className) return null;
  const all = [...(window.INTERNAL_SOP_TRACKS || []), ...(window.SOP_TOOL_TRACKS || [])];
  return all.find((t) => t.class === className) || null;
}

function enrichSopContent(c) {
  if (!c || c.sopBoard?.length) return c || {};
  const track = resolveTrackForCollect(c);
  if (!track) return c || {};
  return { ...c, ...trackToSopBoardContent(track, trackPairIndex(c)) };
}

function trackPairIndex(c) {
  if (Number.isFinite(c?.sopDualPairIndex)) return c.sopDualPairIndex;
  return (Number(c?.sopTrackIndex) || 1) - 1;
}

function resolveTrackForCollect(c) {
  if (!c) return null;
  if (c.sopTrackClass) return findSopTrackByClass(c.sopTrackClass);
  if (c.sopGroup && Number.isFinite(c.sopDualPairIndex)) {
    const tracks = c.sopGroup === 'internal'
      ? (window.INTERNAL_SOP_TRACKS || [])
      : (window.SOP_TOOL_TRACKS || []);
    return tracks[c.sopDualPairIndex] || null;
  }
  return null;
}

/** Volle Track-SOP für Carousel (alle Phasen), auch wenn die Folie nur eine Phase enthält. */
function enrichSopContentForCollect(c) {
  if (!c) return {};
  const track = resolveTrackForCollect(c);
  if (track) {
    return { ...c, ...trackToSopBoardContent(track, trackPairIndex(c)) };
  }
  return enrichSopContent(c);
}

function workshopDisplayTitle(c) {
  const raw = typeof c === 'string' ? c : (c?.title || c?.sopTrackLabel || '');
  return String(raw)
    .replace(/^Track \d+:\s*/, '')
    .replace(/^Track \d+\s*·\s*/, '')
    .replace(/^KI Use Cases\s*·\s*/, '')
    .trim();
}

function phaseChipsFromSubtitle(subtitle) {
  if (!subtitle) return [];
  return String(subtitle).split(' · ').map((s) => s.trim()).filter(Boolean)
    .map((label) => ({ icon: 'fa-bookmark', label }));
}

function getSopGroupMeta(group) {
  const fromTemplates = window.LP_SOP_GROUP_META?.[group];
  if (fromTemplates) return fromTemplates;
  if (group === 'internal') return { icon: 'fa-building', label: 'Internal SOP', shortLabel: 'Internal' };
  if (group === 'consulting') return { icon: 'fa-handshake', label: 'Consulting SOP', shortLabel: 'Consulting' };
  return { icon: 'fa-circle', label: 'Team', shortLabel: 'Team' };
}

function renderSopEmptyState({ icon = 'fa-circle', title = '', hint = '' } = {}) {
  const titleHtml = title ? `<p class="sop-empty-state-title">${esc(title)}</p>` : '';
  const hintHtml = hint ? `<p class="sop-empty-state-text">${esc(hint)}</p>` : '';
  return `<div class="sop-empty-state ws-empty ws-sop-empty">
    <i class="fa-solid ${icon}"></i>
    ${titleHtml}
    ${hintHtml}
  </div>`;
}

function getDualSopProgress(slide) {
  if (!slide || !isDualSopWorkshop()) return null;
  const c = slide.content || {};
  if (typeof c.sopDualProgress === 'string') return { label: c.sopDualProgress, kind: 'meta' };
  if (c.sopDualProgress?.label) return c.sopDualProgress;
  const pairIdx = getDualSopPairIndex(slide);
  const isParallel = !!c.sopDualParallel || (State.slides || []).some((s) => s.content?.sopDualParallel);
  if (isParallel && pairIdx != null && pairIdx >= 0) {
    const total = Math.max((window.INTERNAL_SOP_TRACKS || []).length, (window.SOP_TOOL_TRACKS || []).length);
    if (total > 0) {
      return { kind: 'parallel', n: pairIdx + 1, total, label: `Track ${pairIdx + 1} von ${total}` };
    }
  }
  if (c.sopGroup === 'internal') return { kind: 'sequential', n: 1, total: 2, label: 'SOP 1/2' };
  if (c.sopGroup === 'consulting') return { kind: 'sequential', n: 2, total: 2, label: 'SOP 2/2' };
  return null;
}

function getDualPairTrackNames(pairIdx) {
  const idx = pairIdx ?? 0;
  const intTrack = window.INTERNAL_SOP_TRACKS?.[idx];
  const conTrack = window.SOP_TOOL_TRACKS?.[idx];
  return {
    internal: intTrack ? workshopDisplayTitle({ title: intTrack.title }) : '',
    consulting: conTrack ? workshopDisplayTitle({ title: conTrack.title }) : '',
  };
}

function renderDualSopIdleColumn(activeGroup) {
  const idleSide = activeGroup === 'internal' ? 'consulting' : 'internal';
  const meta = getSopGroupMeta(idleSide);
  const title = idleSide === 'consulting'
    ? 'Consulting-Team ist fertig — unterstützt jetzt Internal'
    : 'Internal-Team ist fertig — unterstützt jetzt Consulting';
  return renderSopEmptyState({ icon: meta.icon, title, hint: 'Beide Teams bleiben am selben Track-Paar.' });
}

function renderDualSopSplitView(slide, columnRenderer) {
  const pairIdx = getDualSopPairIndex(slide) ?? 0;
  const singleSide = slide?.content?.sopDualSingleSide || null;
  const trackNames = getDualPairTrackNames(pairIdx);
  const renderBody = (group) => {
    const tracks = group === 'internal' ? window.INTERNAL_SOP_TRACKS : window.SOP_TOOL_TRACKS;
    if (!tracks?.[pairIdx]) {
      if (singleSide && singleSide !== group) return renderDualSopIdleColumn(singleSide);
      return renderSopEmptyState({
        icon: getSopGroupMeta(group).icon,
        title: 'Kein Track in diesem SOP.',
        hint: 'Für dieses Paar ist hier keine Folie hinterlegt.',
      });
    }
    return columnRenderer(group, pairIdx);
  };
  const singleSideClass = singleSide ? ` sop-split-single-side sop-split-single-side--${singleSide}` : '';
  if (singleSide === 'internal') {
    return `<div class="sop-split-grid sop-split-active sop-split-slides sop-split-full${singleSideClass}">
      ${renderSopSplitColumn('internal', renderBody('internal'), { trackName: trackNames.internal })}
    </div>`;
  }
  if (singleSide === 'consulting') {
    return `<div class="sop-split-grid sop-split-active sop-split-slides sop-split-full${singleSideClass}">
      ${renderSopSplitColumn('consulting', renderBody('consulting'), { trackName: trackNames.consulting })}
    </div>`;
  }
  const col = (group) => {
    const idle = !((group === 'internal' ? window.INTERNAL_SOP_TRACKS : window.SOP_TOOL_TRACKS)?.[pairIdx]);
    return renderSopSplitColumn(group, renderBody(group), { trackName: trackNames[group], idle });
  };
  return `<div class="sop-split-grid sop-split-active sop-split-slides sop-split-full${singleSideClass}">
    ${col('internal')}
    ${col('consulting')}
  </div>`;
}

function renderBrainstormSlideColumn(slide) {
  if (!slide) {
    return renderSopEmptyState({
      icon: 'fa-lightbulb',
      title: 'Kein entsprechender Track in diesem SOP.',
      hint: 'Brainstorm-Folie für dieses Paar fehlt.',
    });
  }
  const visible = getVisibleResponses(slide.id);
  if (visible.length) {
    return `<div class="ws-collect-col ws-collect-col--live-only">
      <div class="viz-wrap viz-wrap-present">${renderBrainstormPresentViz(slide, visible)}</div>
    </div>`;
  }
  return `${renderWorkshopCardCollectHtml(enrichSopContent(slide.content || {}), false, { shellMode: true, splitCol: true, slide })}
    <div class="present-wait-msg ws-collect-wait"><i class="fa-solid fa-lightbulb"></i> Use Cases erscheinen hier live …</div>`;
}

// Split-View (nur Beamer): links Internal-SOP, rechts Consulting-SOP — immer aktiv bis zur Gesamt-Priorisierung.
function renderSopSplitColumn(group, bodyHtml, { trackName = '', idle = false } = {}) {
  const meta = getSopGroupMeta(group);
  const short = meta.shortLabel || meta.label.replace(/\s+SOP$/, '');
  const headerLabel = trackName ? `${short} · ${trackName}` : meta.label;
  return `<div class="sop-split-col${idle ? ' sop-split-col--idle' : ''}">
      <div class="sop-split-col-head sop-split-col-head--${group}"><i class="fa-solid ${meta.icon}"></i> ${esc(headerLabel)}</div>
      <div class="sop-split-col-body">${bodyHtml}</div>
    </div>`;
}

function getDualPairTrackLabel(slide) {
  const pairIdx = getDualSopPairIndex(slide) ?? 0;
  const raw = window.INTERNAL_SOP_TRACKS?.[pairIdx]?.title
    || window.SOP_TOOL_TRACKS?.[pairIdx]?.title
    || `Track ${pairIdx + 1}`;
  return workshopDisplayTitle({ title: raw });
}

function renderGoalMatrixPreview() {
  const qwInner = `<div class="lp-mx-qw-target" aria-hidden="true">
    <p class="lp-mx-qw-tagline"><i class="fa-solid fa-arrow-trend-up"></i> Hier wollen wir hin</p>
  </div>`;
  const quad = (q, icon, label, hint, extra = '', focus = false) => `<div class="lp-mx-quad lp-mx-quad--goal lp-q-${q}${focus ? ' lp-mx-quad--qw-focus' : ''}">
    <div class="lp-mx-quad-head"><span class="lp-mx-quad-ico"><i class="fa-solid ${icon}"></i></span><strong>${label}</strong></div>
    <div class="lp-mx-quad-body">${hint ? `<span class="lp-mx-quad-hint">${hint}</span>` : ''}${extra}</div>
  </div>`;
  const gridHtml = [
    quad('qw', 'fa-rocket', 'Quick Win', 'viel Wirkung · wenig Aufwand', qwInner, true),
    quad('sb', 'fa-star', 'Strategic Bet', 'viel Wirkung · viel Aufwand'),
    quad('dr', 'fa-ban', 'Drop', 'wenig Wirkung · wenig Aufwand'),
    quad('ts', 'fa-screwdriver-wrench', 'Time Sink', 'wenig Wirkung · viel Aufwand'),
  ].join('');
  return window.LPViz.renderMatrixFrame({ yLabel: 'Impact', xLabel: 'Aufwand', gridHtml });
}

function trackToSopBoardContent(track, pairIdx) {
  if (!track) return null;
  const boardFn = typeof window.sopBoardData === 'function' ? window.sopBoardData : null;
  return {
    sopKind: 'track-collect',
    sopTrackClass: track.class,
    sopTrackIndex: pairIdx + 1,
    sopTrackLabel: track.title.replace(/^Track \d+: /, ''),
    sopBoard: boardFn ? boardFn(track) : (track.phases || []).map((p) => ({
      name: p.name,
      cards: (p.cards || []).map((card) => card.name || card),
    })),
  };
}

function renderDualPairCollectColumn(group, pairIdx) {
  const tracks = group === 'internal' ? window.INTERNAL_SOP_TRACKS : window.SOP_TOOL_TRACKS;
  const track = tracks?.[pairIdx];
  if (!track) {
    return renderSopEmptyState({
      icon: getSopGroupMeta(group).icon,
      title: 'Kein Track in diesem SOP.',
    });
  }
  const brainstormSlide = brainstormSlideForDualPair(group, pairIdx);
  const visible = brainstormSlide ? getVisibleResponses(brainstormSlide.id) : [];
  const hasLive = visible.length > 0;

  if (hasLive && brainstormSlide) {
    return `<div class="ws-collect-col ws-collect-col--split-present ws-collect-col--live-only">
      <div class="ws-split-collect-viz ws-split-collect-viz--solo">
        <div class="viz-wrap viz-wrap-present">${renderBrainstormPresentViz(brainstormSlide, visible)}</div>
      </div>
    </div>`;
  }

  const theme = sopTrackTheme(track.class);
  const boardContent = trackToSopBoardContent(track, pairIdx);
  let html = `<div class="ws-split-sop-board ws-orient-col ws-orient-col--split-present" style="--sop-accent:${theme.accent}">
    ${renderSopBoardPresentHtml(boardContent, false, { hideTrackHeader: true, alignCards: true })}
  </div>`;
  if (brainstormSlide) {
    html += `<div class="ws-split-collect-viz ws-split-collect-viz--idle">
      <div class="present-wait-msg ws-collect-wait"><i class="fa-solid fa-lightbulb"></i> Use Cases erscheinen hier live …</div>
    </div>`;
  }
  return `<div class="ws-collect-col ws-collect-col--split-present">${html}</div>`;
}

function renderDualPairOrientColumn(group, pairIdx) {
  const tracks = group === 'internal' ? window.INTERNAL_SOP_TRACKS : window.SOP_TOOL_TRACKS;
  const track = tracks?.[pairIdx];
  if (!track) {
    return renderSopEmptyState({
      icon: getSopGroupMeta(group).icon,
      title: 'Kein Track in diesem SOP.',
    });
  }
  const theme = sopTrackTheme(track.class);
  const boardContent = trackToSopBoardContent(track, pairIdx);
  return `<div class="ws-orient-col ws-orient-col--split-present" style="--sop-accent:${theme.accent}">
    ${renderSopBoardPresentHtml(boardContent, false, { hideTrackHeader: true, alignCards: true })}
  </div>`;
}

function renderDualPairOrientSplitView(slide) {
  return renderDualSopSplitView(slide, (group, pairIdx) => renderDualPairOrientColumn(group, pairIdx));
}

function renderSopSectionSplitView(currentSlide) {
  if (currentSlide?.content?.sopKind === 'dual-pair-orient') return renderDualPairOrientSplitView(currentSlide);
  return renderDualSopSplitView(currentSlide, (group, pairIdx) => {
    const s = trackIntroSlidesOfGroup(group)[pairIdx];
    return s
      ? renderSopSectionHtml(enrichSopContent(s.content), false, { shellMode: true, splitCol: true })
      : renderSopEmptyState({
        icon: getSopGroupMeta(group).icon,
        title: 'Kein Track in diesem SOP.',
        hint: 'Intro-Folie für dieses Paar fehlt.',
      });
  });
}

function renderBrainstormSplitViz(currentSlide) {
  return renderDualSopSplitView(currentSlide, (group, pairIdx) => renderDualPairCollectColumn(group, pairIdx));
}

// Finale Priorisierung (Moderator/Beamer): moderne Tabelle — alle Use Cases mit
// Autor + Live-Stimmen, immer sichtbar (auch vor der ersten Stimme).
function renderFinalVotePresentHtml(slide, visible) {
  const { allItems } = aggregateAllTracksUseCases();
  if (!allItems.length) {
    return '<div class="present-wait-msg">Noch keine Use Cases gesammelt. Bitte zuerst die Brainstormings durchführen.</div>';
  }
  const topN = finalPriorityCount(slide);
  const { voteCounts, totalVotes } = aggregateVoteResponses(slide, visible);
  const { votedCount, totalCount } = getCardVoteParticipation(slide);
  const partPct = totalCount ? Math.round((votedCount / totalCount) * 100) : 0;
  const decorate = (items) => items
    .map((item) => ({ ...item, votes: voteCounts[`resp-${item.id}`] || 0 }))
    .sort((a, b) => b.votes - a.votes || String(a.text).localeCompare(String(b.text), 'de'));
  const head = `<div class="ws-board-head">
      <span class="ws-board-stat"><i class="fa-solid fa-list-check"></i> ${allItems.length} Use Cases</span>
      <span class="ws-board-stat"><i class="fa-solid fa-users"></i> ${votedCount} / ${totalCount} abgestimmt</span>
      <span class="ws-board-stat ws-board-stat--accent"><i class="fa-solid fa-check-to-slot"></i> ${totalVotes} Stimmen</span>
      <span class="ws-board-stat ws-board-stat--matrix"><i class="fa-solid fa-table-cells-large"></i> Top ${topN} → Matrix</span>
      <span class="ws-board-progress"><span class="ws-board-progress-fill" style="width:${partPct}%"></span></span>
    </div>`;
  const tableFor = (rows) => {
    if (!rows.length) return '<div class="present-wait-msg">Keine Use Cases in dieser Gruppe.</div>';
    const maxVotes = Math.max(1, ...rows.map((r) => r.votes));
    let h = `<div class="ws-table">
      <div class="ws-row ws-row--head">
        <span class="ws-c-rank">#</span>
        <span class="ws-c-uc">Use Case</span>
        <span class="ws-c-author">Eingebracht von</span>
        <span class="ws-c-action">Stimmen</span>
      </div>`;
    rows.forEach((r, i) => {
      const author = getParticipantForDisplay(r.participant_id);
      const authorName = author?.display_name || r.authorName || '–';
      const ranked = r.votes > 0;
      const isMatrixTop = i < topN;
      const topClass = isMatrixTop ? ' ws-row--top' : '';
      const barPct = Math.round((r.votes / maxVotes) * 100);
      h += `<div class="ws-row${topClass}">
        <span class="ws-c-rank">${i + 1}</span>
        <span class="ws-c-uc">
          <span class="ws-uc-text">${renderUseCaseDisplayHtml(r.text, 'full')}</span>
        </span>
        <span class="ws-c-author">${participantAvatarHtml(author || { display_name: authorName }, 'xs')}<span class="ws-author-name">${esc(authorName)}</span></span>
        <span class="ws-c-action ws-votes">
          <span class="ws-votebar"><span class="ws-votebar-fill" style="width:${barPct}%"></span></span>
          <strong class="ws-votenum">${r.votes}</strong>
        </span>
      </div>`;
    });
    h += `</div>`;
    return h;
  };
  // Konsolidierte Priorisierung — EINE Liste über beide SOPs, kein Split.
  return `<div class="ws-board finale-vote">${head}${tableFor(decorate(allItems))}</div>`;
}

function renderTrackVotePresentHtml(slide, visible) {
  // Cross-Track-Voting (Workshop-Finale): moderne Tabelle aus allen Tracks.
  const scope = getVoteSlideScope(slide);
  if (scope?.kind === 'all-tracks') {
    return renderFinalVotePresentHtml(slide, visible);
  }
  const key = slide.content?.sopTrackKey || slide.content?.sopTrackClass;
  const { allItems } = aggregateTrackUseCases(key);
  if (!allItems.length) {
    return '<div class="present-wait-msg">Noch keine Use Cases gesammelt. Bitte zuerst das Brainstorming in den Phasen abschließen.</div>';
  }
  const hasVotes = visible.length > 0 || !State.session.question_open;
  const previewHtml = renderTrackVoteGroupedListHtml(slide);
  return `<div class="track-vote-present">
    <div class="track-vote-present-head">
      <span class="track-vote-count">${allItems.length} Use Cases</span>
      <span class="track-vote-hint">Kontext aus allen SOP-Phasen · ${State.session.question_open ? `Teilnehmer wählen jetzt Top ${getTrackVoteCount(slide)}` : 'Priorisierung abgeschlossen'}</span>
    </div>
    ${renderCardVoteParticipationHtml(slide)}
    <div class="track-vote-preview"><div class="track-vote-live-label">Abstimmungsoptionen</div>${previewHtml}</div>
    ${hasVotes ? `<div class="track-vote-live-ranking"><div class="track-vote-live-label">Live-Ergebnis</div>${renderVoteResultsHtml(slide, visible)}</div>` : '<div class="present-wait-msg">Warte auf die ersten Stimmen …</div>'}
  </div>`;
}

function renderTrackVoteGroupedListHtml(slide, { selectable = false, selectedIds = [], fairVote = false, hideGroupHeaders = false } = {}) {
  const groups = getTrackVoteOptionsGrouped(slide);
  if (!groups.length) return '<div class="present-wait-msg">Noch keine Use Cases gesammelt.</div>';
  const myId = fairVote ? (State.participant?.id) : null;
  return `<div class="track-vote-grouped">${groups.map((g) => `
    <div class="track-vote-group">
      ${hideGroupHeaders ? '' : renderTrackVoteGroupHeadHtml(g)}
      <div class="track-vote-group-items">${g.options.map((o) => {
        const isOwn = myId && o.participant_id === myId;
        if (selectable && !isOwn) {
          const sel = selectedIds.includes(o.id);
          return `<button type="button" class="track-vote-option track-vote-option--pick${sel ? ' is-selected' : ''}" data-vote-id="${esc(o.id)}" aria-pressed="${sel ? 'true' : 'false'}">${renderUseCaseDisplayHtml(o.text, 'full')}</button>`;
        }
        if (selectable && isOwn) {
          return `<div class="track-vote-option track-vote-option--own"><span>${renderUseCaseDisplayHtml(o.text, 'full')}</span><span class="vote-own-badge">Mein Beitrag</span></div>`;
        }
        return `<div class="track-vote-option-read">${renderUseCaseDisplayHtml(o.text, 'full')}</div>`;
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
    html += `<div class="track-vote-group">${renderTrackVoteGroupHeadHtml(g)}<div class="track-vote-group-items">`;
    g.options
      .map((o) => ({ ...o, score: scoreFor(o.id), votes: top3Counts[o.id] || 0, points: pointTotals[o.id] || 0 }))
      .sort((a, b) => b.score - a.score)
      .forEach((o) => {
        const max = Math.max(1, ...g.options.map((x) => scoreFor(x.id)));
        const pct = Math.round((o.score / max) * 100);
        html += `<div class="track-vote-result-row"><span>${renderUseCaseDisplayHtml(o.text, 'full')}</span><div class="viz-bar-track"><div class="viz-bar-fill" style="width:${pct}%"></div></div><strong>${o.votes ? `${o.votes}× Top ${getTrackVoteCount(slide)}` : ''}${o.votes && o.points ? ' · ' : ''}${o.points ? `${Math.round(o.points)} Pkt` : ''}</strong></div>`;
      });
    html += '</div></div>';
  });
  html += '</div>';
  return html;
}

// Zerlegt den Brainstorm-Prompt in Hauptfrage, Format-Hinweis und Orientierungs-Notiz.
// Konvention der Vorlagen: Zeile 1 = Frage · Zeile „Format: …" = Hinweis · Rest = Notiz.
function parseCollectPrompt(promptText) {
  const lines = String(promptText || '').split('\n').map((l) => l.trim()).filter(Boolean);
  let question = '';
  let formatHint = '';
  const noteLines = [];
  for (const l of lines) {
    if (/^Format:/i.test(l)) { formatHint = l.replace(/^Format:\s*/i, ''); continue; }
    if (!question) { question = l; continue; }
    noteLines.push(l);
  }
  return { question, formatHint, note: noteLines.join(' ') };
}

function brainstormSlideForDualPair(group, pairIdx) {
  return findDualSopSlideByPair(group, pairIdx, 'brainstorm')
    || brainstormSlidesOfGroup(group)[pairIdx]
    || null;
}

/** Moderator/Beamer: volles SOP-Board; Auto-Scroll nur bei Overflow (initSopBoardAutoScroll). */
function renderSopBoardPresentHtml(c, editable = false, opts = {}) {
  const inner = renderSopBoardPreview(c, editable, opts);
  if (!inner || editable) return inner;
  return `<div class="sop-board-autoscroll" data-autoplay="5500">${inner}</div>`;
}

function sopBoardCardName(card) {
  return typeof card === 'string' ? card : (card?.name || '');
}

/** Mobile Teilnehmer: alle Phasen + Unterpunkte untereinander (kein Carousel). */
function renderSopPhaseStackHtml(c) {
  const content = enrichSopContentForCollect(c);
  const board = content.sopBoard || [];
  if (!board.length) return '';
  const theme = sopTrackTheme(content.sopTrackClass);
  const phases = board.map((phase) => {
    const items = (phase.cards || [])
      .map((card) => sopBoardCardName(card))
      .filter(Boolean)
      .map((name) => {
        const active = name === content.sopCardName || (content.sopKind === 'card' && name === content.title);
        return `<li class="sop-phase-stack-item${active ? ' is-active' : ''}">${esc(name)}</li>`;
      }).join('');
    const phaseActive = phase.name === content.sopPhaseName;
    return `
      <section class="sop-phase-stack-phase${phaseActive ? ' is-active' : ''}">
        <h3 class="sop-phase-stack-title">${esc(phase.name)}</h3>
        ${items ? `<ul class="sop-phase-stack-list">${items}</ul>` : ''}
      </section>`;
  }).join('');
  return `<div class="sop-phase-stack" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">${phases}</div>`;
}

function initSopBoardAutoScroll(root = document) {
  const scope = root?.querySelectorAll ? root : document;
  scope.querySelectorAll('.sop-board-autoscroll').forEach((wrap) => {
    wrap._autoscrollCleanup?.();
    delete wrap.dataset.autoscrollInit;
    wrap.classList.remove('is-overflow', 'is-fit', 'is-measuring');
    wrap.querySelector('.sop-board-autoscroll-dots')?.remove();
  });
  scope.querySelectorAll('.sop-board-autoscroll:not([data-autoscroll-init])').forEach((wrap) => {
    wrap.dataset.autoscrollInit = '1';
    const row = wrap.querySelector('.sop-board-phases-row');
    if (!row) return;
    const phases = [...row.querySelectorAll('.sop-board-phase')];
    if (phases.length <= 1) return;

    const intervalMs = Number(wrap.dataset.autoplay) || 5500;
    let positions = [];
    let idx = 0;
    let timer = null;
    let rafId = null;
    let dotsEl = null;

    const measureOverflow = () => {
      wrap.classList.remove('is-overflow', 'is-fit');
      wrap.classList.add('is-measuring');
      row.scrollLeft = 0;
      const overflow = row.scrollWidth > row.clientWidth + 4;
      wrap.classList.remove('is-measuring');
      if (!overflow) {
        wrap.classList.add('is-fit');
        return null;
      }
      wrap.classList.add('is-overflow');
      const snaps = phases.map((phase) => {
        const maxScroll = Math.max(0, row.scrollWidth - row.clientWidth);
        return Math.min(Math.max(0, phase.offsetLeft - row.offsetLeft), maxScroll);
      });
      return [...new Set(snaps.map((p) => Math.round(p)))];
    };

    const buildDots = (count) => {
      if (!dotsEl) {
        dotsEl = document.createElement('div');
        dotsEl.className = 'sop-board-autoscroll-dots';
        wrap.appendChild(dotsEl);
      }
      dotsEl.innerHTML = '';
      if (count <= 1) {
        dotsEl.classList.add('hidden');
        return;
      }
      dotsEl.classList.remove('hidden');
      for (let i = 0; i < count; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sop-board-autoscroll-dot${i === 0 ? ' is-active' : ''}`;
        btn.dataset.index = String(i);
        btn.setAttribute('aria-label', `Board-Ausschnitt ${i + 1}`);
        btn.addEventListener('click', () => goTo(i, true));
        dotsEl.appendChild(btn);
      }
    };

    const smoothScrollTo = (target) => {
      const start = row.scrollLeft;
      const diff = target - start;
      if (Math.abs(diff) < 2) return;
      const duration = 850;
      const startTime = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
        row.scrollLeft = start + diff * ease;
        if (t < 1) rafId = requestAnimationFrame(step);
      };
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(step);
    };

    const goTo = (next, userClick = false) => {
      if (!positions.length) return;
      idx = ((next % positions.length) + positions.length) % positions.length;
      smoothScrollTo(positions[idx]);
      dotsEl?.querySelectorAll('.sop-board-autoscroll-dot').forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
      });
      if (userClick && timer) {
        clearInterval(timer);
        timer = setInterval(() => goTo(idx + 1), intervalMs);
      }
    };

    const setup = () => {
      if (timer) clearInterval(timer);
      timer = null;
      row.scrollLeft = 0;
      idx = 0;
      positions = measureOverflow() || [];
      if (positions.length <= 1) {
        dotsEl?.remove();
        dotsEl = null;
        return;
      }
      buildDots(positions.length);
      timer = setInterval(() => goTo(idx + 1), intervalMs);
    };

    setup();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => setup()) : null;
    ro?.observe(row);
    ro?.observe(wrap);
    wrap._autoscrollCleanup = () => {
      if (timer) clearInterval(timer);
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  });
}

function renderWorkshopCardCollectHtml(c, editable = false, { shellMode = false, splitCol = false, hideBoard = false, participantMode = false, shellWrapped = false, slide = null } = {}) {
  const content = enrichSopContent(c);
  const promptSource = (!editable && slide) ? getCollectPromptForSlide(slide) : content.prompt;
  const titleEl = editable
    ? `<div class="canvas-editable pslide-q-title" contenteditable="true" data-field="title" data-placeholder="Titel der Folie…">${esc(content.title || '')}</div>`
    : `<h1 class="pslide-q-title">${esc(content.title || content.sopCardName || '')}</h1>`;
  const subEl = content.subtitle ? `<p class="pslide-crumb">${esc(content.subtitle)}</p>` : '';
  const bodyTxt = (content.body && String(content.body).trim()) || '';
  const promptTxt = (content.prompt && String(content.prompt).trim()) || '';
  const hasBody = !!bodyTxt && bodyTxt !== promptTxt;
  const bodyEl = editable
    ? (hasBody ? `<div class="canvas-editable pslide-q-sub" contenteditable="true" data-field="body">${esc(content.body)}</div>` : '')
    : (hasBody ? `<p class="pslide-q-sub">${esc(content.body).replace(/\n/g, '<br>')}</p>` : '');
  const displayContent = (!editable && !splitCol) ? enrichSopContentForCollect(content) : enrichSopContent(content);
  let boardInner = '';
  if (participantMode && displayContent.sopBoard?.length) {
    boardInner = renderSopPhaseStackHtml(displayContent);
  } else if (displayContent.sopBoard?.length) {
    const boardOpts = { hideTrackHeader: shellMode, alignCards: !!(shellMode || splitCol) };
    boardInner = editable
      ? renderSopBoardPreview(displayContent, true, boardOpts)
      : renderSopBoardPresentHtml(displayContent, false, boardOpts);
  }
  const boardEl = !editable && displayContent.sopBoard?.length && !hideBoard
    ? `<div class="workshop-collect-board">${boardInner}</div>`
    : '';
  const { question, note } = parseCollectPrompt(promptSource);
  const showInlineQuestion = question && !(participantMode && shellWrapped);
  const questionEl = showInlineQuestion
    ? `<p class="pslide-q-prompt workshop-collect-question${participantMode ? ' workshop-collect-question--plain' : ''}">${participantMode ? esc(question) : `<i class="fa-solid fa-circle-question workshop-q-icon"></i><span>${esc(question)}</span>`}</p>`
    : '';
  const noteEl = note && !participantMode && !shellWrapped
    ? `<p class="workshop-collect-note"><i class="fa-solid fa-lightbulb"></i><span>${esc(note)}</span></p>`
    : '';
  if (participantMode) {
    return `<div class="workshop-collect-shell workshop-collect-shell--participant">${questionEl}${boardEl}</div>`;
  }
  if (editable) {
    const promptEl = `<div class="canvas-editable pslide-q-prompt workshop-collect-prompt" contenteditable="true" data-field="prompt" data-placeholder="Frage / Aufgabe für die Teilnehmer…">${esc(content.prompt || '')}</div>`;
    return `<div class="pslide-question-block workshop-collect-shell">${subEl}${titleEl}${bodyEl}${boardEl}${promptEl}</div>`;
  }
  if (shellMode) {
    const noteBlock = '';
    const questionBlock = '';
    const boardBlock = (splitCol || hideBoard) ? '' : boardEl;
    return `<div class="pslide-question-block workshop-collect-shell workshop-collect-shell--compact${splitCol ? ' workshop-collect-shell--split' : ''}">${questionBlock}${boardBlock}${noteBlock}</div>`;
  }
  const isSopCollect = !!(content.sopKind || content.sopBoard?.length);
  if (!isSopCollect) {
    const promptEl = content.prompt
      ? `<p class="pslide-q-prompt"><i class="fa-solid fa-circle-question workshop-q-icon"></i> ${esc(content.prompt).replace(/\n/g, '<br>')}</p>`
      : '';
    return `<div class="pslide-question-block workshop-collect-shell">${subEl}${titleEl}${bodyEl}${boardEl}${promptEl}</div>`;
  }
  return `<div class="pslide-question-block workshop-collect-shell">${subEl}${titleEl}${questionEl}${bodyEl}${boardEl}${noteEl}</div>`;
}

function renderParticipantWorkshopHeader(slideIndex) {
  if (!isSopWorkshopPresentation()) return '';
  return renderWorkshopProgressHtml(slideIndex);
}

function wrapParticipantSlide(bodyHtml, slideIndex) {
  const header = isSopWorkshopPresentation() ? renderParticipantWorkshopHeader(slideIndex) : '';
  return `<div class="pslide-participant-slide">${header}<div class="pslide-participant-content">${bodyHtml}</div></div>`;
}

const PARTICIPANT_MOBILE_MQ = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(max-width:768px)')
  : null;

function isParticipantMobileLayout() {
  return PARTICIPANT_MOBILE_MQ ? PARTICIPANT_MOBILE_MQ.matches : window.innerWidth <= 768;
}

function hapticFeedback(kind = 'light') {
  if (!navigator.vibrate) return;
  const patterns = {
    light: 8,
    medium: 18,
    select: 12,
    success: [10, 36, 14],
    error: [22, 48, 22, 48, 22],
  };
  try { navigator.vibrate(patterns[kind] || patterns.light); } catch { /* noop */ }
}

function setButtonBusy(btn, busy, busyLabel = 'Bitte warten…') {
  if (!btn) return;
  if (busy) {
    if (!btn.dataset.lpOrigHtml) btn.dataset.lpOrigHtml = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('is-busy');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ${esc(busyLabel)}`;
  } else {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.classList.remove('is-busy');
    if (btn.dataset.lpOrigHtml) {
      btn.innerHTML = btn.dataset.lpOrigHtml;
      delete btn.dataset.lpOrigHtml;
    }
  }
}

function setParticipantConnStatus(online) {
  const banner = document.getElementById('participant-conn-banner');
  if (!banner) return;
  banner.classList.toggle('hidden', !!online);
  banner.classList.toggle('is-offline', !online);
  document.body.classList.toggle('participant-conn-offline', !online);
}

function bindParticipantConnectivityHandlers() {
  if (State._participantConnBound) return;
  State._participantConnBound = true;
  window.addEventListener('online', () => setParticipantConnStatus(true));
  window.addEventListener('offline', () => setParticipantConnStatus(false));
  if (!navigator.onLine) setParticipantConnStatus(false);
}

function maybeShowPwaInstallHint() {
  if (!isParticipantMobileLayout()) return;
  if (localStorage.getItem('lp_pwa_hint_dismissed')) return;
  if (window.matchMedia?.('(display-mode: standalone)')?.matches) return;
  if (window.navigator.standalone) return;
  const hint = document.getElementById('participant-pwa-hint');
  if (!hint || !hint.classList.contains('hidden')) return;
  hint.classList.remove('hidden');
  hint.querySelector('.participant-pwa-hint-dismiss')?.addEventListener('click', () => {
    hint.classList.add('hidden');
    localStorage.setItem('lp_pwa_hint_dismissed', '1');
  }, { once: true });
}

function ensureParticipantActionBarOnBody() {
  const bar = document.getElementById('participant-action-bar');
  if (bar && bar.parentElement !== document.body) document.body.appendChild(bar);
  return bar;
}

function showParticipantActionBar() {
  const bar = ensureParticipantActionBarOnBody();
  if (!bar) return;
  bar.classList.remove('hidden');
  bar.setAttribute('aria-hidden', 'false');
  document.body.classList.add('participant-has-action-bar');
}

function clearParticipantActionBar() {
  const bar = ensureParticipantActionBarOnBody();
  if (!bar) return;
  bar.classList.add('hidden');
  bar.setAttribute('aria-hidden', 'true');
  bar.replaceChildren();
  State._participantBarShellReady = false;
  document.body.classList.remove('participant-has-action-bar');
}

function ensureParticipantActionBarShell() {
  const bar = ensureParticipantActionBarOnBody();
  if (!bar) return null;
  if (!State._participantBarShellReady || !bar.querySelector('.participant-action-bar-shell')) {
    bar.innerHTML = `
      <div class="participant-action-bar-shell">
        <div class="participant-action-bar-status" id="participant-bar-status" role="status" aria-live="polite"></div>
        <div class="participant-action-bar-row">
          <button type="button" class="participant-bar-settings-btn" id="participant-settings-open" aria-label="Teilnehmer-Einstellungen">
            <i class="fa-solid fa-gear" aria-hidden="true"></i>
          </button>
          <div class="participant-action-bar-actions" id="participant-bar-actions"></div>
        </div>
      </div>`;
    State._participantBarShellReady = true;
    bar.querySelector('#participant-settings-open')?.addEventListener('click', () => {
      hapticFeedback('light');
      openParticipantSettingsSheet();
    });
  }
  return bar;
}

function findParticipantPrimarySubmit(root) {
  if (!root) return null;
  const ids = [
    'submit-text', 'submit-choice', 'submit-favorites', 'submit-split', 'submit-multi', 'submit-num',
    'submit-rank', 'submit-pin', 'lp-mx-submit', 'join-submit', 'submit-top3',
  ];
  for (const id of ids) {
    const el = root.querySelector(`#${id}`);
    if (el?.matches?.('.btn-primary, .participant-submit')) return el;
  }
  const candidates = root.querySelectorAll('.btn-primary.participant-submit, .participant-submit.btn-primary');
  return candidates.length ? candidates[candidates.length - 1] : null;
}

function syncParticipantMobileActionBar() {
  if (!isParticipantMobileLayout() || !$('#screen-participant')?.classList.contains('active')) {
    clearParticipantActionBar();
    return;
  }
  const bar = ensureParticipantActionBarShell();
  const root = $('#participant-root');
  const actions = bar?.querySelector('#participant-bar-actions');
  const statusSlot = bar?.querySelector('#participant-bar-status');
  if (!bar || !actions || !statusSlot) return;

  showParticipantActionBar();
  actions.replaceChildren();
  statusSlot.replaceChildren();

  const statusEl = root?.querySelector('#fav-counter, #split-total');
  if (statusEl) {
    statusEl.classList.add('participant-action-bar-status');
    statusSlot.appendChild(statusEl);
  }

  const secondary = root?.querySelector('#lp-mx-reset');
  if (secondary) {
    secondary.classList.add('participant-action-bar-secondary');
    actions.appendChild(secondary);
  }

  const primary = findParticipantPrimarySubmit(root);
  if (primary) {
    primary.classList.add('participant-action-bar-btn');
    actions.appendChild(primary);
  }

  if (!primary && !secondary && !statusEl) {
    actions.innerHTML = '<span class="participant-bar-wait-hint">Bitte auf die Präsentation achten…</span>';
  }
}

function closeParticipantSettingsSheet() {
  const sheet = document.getElementById('participant-settings-sheet');
  if (!sheet) return;
  sheet.classList.add('hidden');
  sheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('participant-settings-open');
}

function openParticipantSettingsSheet() {
  const sheet = document.getElementById('participant-settings-sheet');
  if (!sheet) return;
  renderParticipantSettingsBody();
  sheet.classList.remove('hidden');
  sheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('participant-settings-open');
  sheet.querySelector('.participant-settings-close')?.focus();
}

function getParticipantSettingsProfile() {
  if (State.participant) {
    const p = normalizeParticipantAvatar(State.participant);
    return {
      name: p.display_name || '',
      emoji: p.avatar_emoji,
      color: p.avatar_color,
      mode: 'session',
    };
  }
  return {
    name: State.joinProfile?.name || $('#join-name')?.value?.trim() || '',
    emoji: State.joinProfile?.emoji || LP_AVATAR_EMOJIS()[0],
    color: State.joinProfile?.color || LP_AVATAR_COLORS()[0],
    mode: 'join',
  };
}

function syncJoinAvatarChipPreview() {
  const profile = getParticipantSettingsProfile();
  const face = $('#join-avatar-chip-face');
  const nameEl = $('#join-avatar-chip-name');
  if (face) {
    face.textContent = profile.emoji;
    face.style.background = profile.color;
  }
  if (nameEl) nameEl.textContent = profile.name || 'Avatar wählen';
}

function renderParticipantSettingsBody() {
  const body = document.getElementById('participant-settings-body');
  if (!body) return;
  const profile = getParticipantSettingsProfile();
  const emojis = LP_AVATAR_EMOJIS();
  const colors = LP_AVATAR_COLORS();
  const sopGroup = State.participant ? getParticipantSopGroup(State.participant.id) : null;
  const sopMeta = sopGroup ? getSopGroupMeta(sopGroup) : null;
  const sessionCode = State.session?.code || $('#join-code')?.value?.trim().toUpperCase() || '';

  body.innerHTML = `
    <div class="participant-settings-preview">
      <div class="participant-settings-avatar" id="settings-avatar-preview" style="background:${esc(profile.color)}">${profile.emoji}</div>
      <div class="participant-settings-preview-text">
        <strong id="settings-avatar-name">${esc(profile.name || 'Dein Name')}</strong>
        <span>${profile.mode === 'session' ? 'Dein Profil in dieser Session' : 'Avatar für den Beitritt'}</span>
      </div>
    </div>
    ${profile.mode === 'session' ? `
      <div class="participant-settings-section">
        <h3>Session</h3>
        <dl class="participant-settings-meta">
          <div><dt>Code</dt><dd>${esc(sessionCode || '—')}</dd></div>
          ${sopMeta ? `<div><dt>SOP</dt><dd>${esc(sopMeta.label)}</dd></div>` : ''}
        </dl>
      </div>` : ''}
    ${profile.mode === 'session' ? `
      <div class="participant-settings-section">
        <label class="join-label" for="settings-name">Anzeigename</label>
        <input id="settings-name" class="participant-name-input" value="${esc(profile.name)}" autocomplete="name" />
      </div>` : `
      <div class="participant-settings-section participant-settings-note">
        <p>Name und Code legst du auf der Startseite fest. Hier wählst du Emoji und Farbe.</p>
      </div>`}
    <div class="participant-settings-section">
      <h3>Avatar-Farbe</h3>
      <div class="participant-settings-colors">${colors.map((c, i) => `<button type="button" class="avatar-color-btn participant-settings-color ${c === profile.color ? 'active' : ''}" data-color="${c}" style="background:${c}" aria-label="${esc(avatarColorAriaLabel(c))}" aria-pressed="${c === profile.color}"></button>`).join('')}</div>
    </div>
    <div class="participant-settings-section">
      <h3>Emoji</h3>
      <div class="participant-settings-emoji-grid">${emojis.map((e) => `<button type="button" class="avatar-emoji-btn participant-settings-emoji ${e === profile.emoji ? 'active' : ''}" data-emoji="${e}" aria-pressed="${e === profile.emoji}">${e}</button>`).join('')}</div>
    </div>
    ${profile.mode === 'session' ? `<button type="button" class="btn-primary participant-settings-save" id="participant-settings-save">Profil speichern</button>` : ''}`;

  let draft = { ...profile };

  const updateDraftPreview = () => {
    const preview = $('#settings-avatar-preview');
    const namePreview = $('#settings-avatar-name');
    if (preview) {
      preview.textContent = draft.emoji;
      preview.style.background = draft.color;
    }
    if (namePreview) namePreview.textContent = draft.name || 'Dein Name';
    syncJoinAvatarChipPreview();
  };

  body.querySelectorAll('.participant-settings-emoji').forEach((btn) => btn.addEventListener('click', () => {
    draft.emoji = btn.dataset.emoji;
    hapticFeedback('select');
    body.querySelectorAll('.participant-settings-emoji').forEach((b) => {
      b.classList.toggle('active', b.dataset.emoji === draft.emoji);
      b.setAttribute('aria-pressed', b.dataset.emoji === draft.emoji ? 'true' : 'false');
    });
    if (profile.mode === 'join') {
      State.joinProfile = { ...State.joinProfile, emoji: draft.emoji, color: draft.color };
    }
    updateDraftPreview();
  }));

  body.querySelectorAll('.participant-settings-color').forEach((btn) => btn.addEventListener('click', () => {
    draft.color = btn.dataset.color;
    hapticFeedback('select');
    body.querySelectorAll('.participant-settings-color').forEach((b) => {
      b.classList.toggle('active', b.dataset.color === draft.color);
      b.setAttribute('aria-pressed', b.dataset.color === draft.color ? 'true' : 'false');
    });
    if (profile.mode === 'join') {
      State.joinProfile = { ...State.joinProfile, emoji: draft.emoji, color: draft.color };
    }
    updateDraftPreview();
  }));

  $('#settings-name')?.addEventListener('input', (e) => {
    draft.name = e.target.value.trim();
    updateDraftPreview();
  });

  $('#participant-settings-save')?.addEventListener('click', async () => {
    if (!State.participant?.id) return;
    if (!draft.name) { toast('Bitte Name eingeben', 'warn'); return; }
    const { data, error } = await sb.from('lp_participants').update({
      display_name: draft.name,
      avatar_emoji: draft.emoji,
      avatar_color: draft.color,
    }).eq('id', State.participant.id).select().single();
    if (error) { toast(error.message, 'error'); return; }
    State.participant = normalizeParticipantAvatar(data);
    localStorage.setItem('lp_join_profile', JSON.stringify({ name: draft.name, emoji: draft.emoji, color: draft.color }));
    hapticFeedback('success');
    toast('Profil gespeichert', 'success');
    closeParticipantSettingsSheet();
    syncJoinAvatarChipPreview();
    const youEl = $('#participant-root')?.querySelector('.participant-you');
    if (youEl) youEl.textContent = draft.name;
  });
}

function bindParticipantSettingsSheet() {
  if (State._participantSettingsBound) return;
  State._participantSettingsBound = true;
  document.getElementById('participant-settings-sheet')?.addEventListener('click', (e) => {
    if (e.target.closest('.participant-settings-close, .participant-settings-backdrop')) {
      closeParticipantSettingsSheet();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('participant-settings-open')) {
      closeParticipantSettingsSheet();
    }
  });
}

function mountParticipantActionBar(label, { id = 'submit-text', extraClass = 'participant-submit-lg' } = {}) {
  ensureParticipantActionBarShell();
  const root = $('#participant-root');
  if (root && !root.querySelector(`#${id}`)) {
    root.insertAdjacentHTML('beforeend', `<button type="button" class="btn-primary participant-submit ${extraClass}" id="${esc(id)}" hidden>${esc(label)}</button>`);
  }
  syncParticipantMobileActionBar();
}

function renderParticipantTrackVoteHtml(slide) {
  const groups = getTrackVoteOptionsGrouped(slide);
  if (!groups.length) return '<p style="color:var(--muted)">Noch keine Use Cases gesammelt. Bitte warte, bis das Brainstorming abgeschlossen ist.</p>';
  const scope = getVoteSlideScope(slide);
  const max = scope?.maxSelections || 2;
  if (scope?.kind === 'track') {
    const n = getTrackVoteCount(slide);
    const expert = State.participantVoteExpert;
    if (expert) {
      const opts = getTrackVoteOptions(slide);
      return `<p class="vote-mode-hint">Expertenmodus: Verteile genau <strong>100 Punkte</strong>.</p>
        ${opts.map((o) => `<div class="split-row"><span>${renderUseCaseDisplayHtml(o.text, 'full')}</span><input type="number" min="0" max="100" value="0" data-split="${esc(o.id)}" class="split-input" /></div>`).join('')}
        <div id="split-total" style="font-weight:700;margin:.5rem 0" role="status" aria-live="polite">Summe: 0 / 100</div>
        <button type="button" class="btn-ghost vote-mode-toggle" id="vote-mode-toggle">← Zurück zu Top ${n}</button>
        <button type="button" class="btn-primary participant-submit" id="submit-split">Punkte senden</button>`;
    }
    return `<p class="vote-mode-hint">Wähle deine <strong>Top ${n} Use Cases</strong> in diesem Track.</p>
      ${renderTrackVoteGroupedListHtml(slide, { selectable: true, fairVote: !!slide.settings?.sopFairVote })}
      <div id="fav-counter" class="top3-counter" role="status" aria-live="polite">0 / ${n} gewählt</div>
      <button type="button" class="btn-ghost vote-mode-toggle" id="vote-mode-toggle">Expertenmodus: 100 Punkte</button>
      <button type="button" class="btn-primary participant-submit" id="submit-favorites">Top ${n} senden</button>`;
  }
  if (scope?.kind === 'phase') {
    return `<p class="vote-mode-hint">Wähle deine <strong>Top ${max} KI Use Cases</strong> in dieser Phase.</p>
      ${renderTrackVoteGroupedListHtml(slide, { selectable: true, fairVote: !!slide.settings?.sopFairVote })}
      <div id="fav-counter" class="top3-counter" role="status" aria-live="polite">0 / ${max} gewählt</div>
      <button type="button" class="btn-primary participant-submit" id="submit-favorites">Priorisierung senden</button>`;
  }
  if (scope?.kind === 'all-tracks') {
    const fairVote = !!slide.settings?.sopFairVote;
    const hint = fairVote
      ? `Wähle deine <strong>Top ${max} Use Cases</strong> aus allen Tracks · eigene Beiträge sind ausgeschlossen.`
      : `Wähle <strong>Top ${max} Use Cases</strong> aus allen Tracks.`;
    return `<p class="vote-mode-hint">${hint}</p>
      ${renderTrackVoteGroupedListHtml(slide, { selectable: true, fairVote, hideGroupHeaders: true })}
      <div id="fav-counter" class="top3-counter" role="status" aria-live="polite">0 / ${max} gewählt</div>
      <button type="button" class="btn-primary participant-submit" id="submit-favorites">Priorisierung senden</button>`;
  }
  return `<p class="vote-mode-hint">Wähle <strong>maximal ${max} Lieblings-Use-Cases</strong> aus dem Brainstorming.</p>
    ${renderTrackVoteGroupedListHtml(slide, { selectable: true, fairVote: !!slide.settings?.sopFairVote })}
    <div id="fav-counter" class="top3-counter" role="status" aria-live="polite">0 / ${max} gewählt</div>
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

function isFinaleSlide(s) {
  if (!s) return false;
  const st = s.settings || {};
  const c = s.content || {};
  const k = c.sopKind;
  return !!(st.sopPitchSession || st.sopAllTracksVote || st.sopAllTracksMatrix || st.sopNextSteps || c.sopAllTracksResults
    || k === 'pitch-session' || k === 'final-vote' || k === 'group-vote' || k === 'final-matrix' || k === 'next-steps' || k === 'all-tracks-summary');
}

// Konsistente Finale-Pill (Badge) für Pitch Session, Finale Priorisierung und Matrix.
function renderFinalePillHtml() {
  return `<span class="ws-pill ws-pill--finale"><i class="fa-solid fa-flag-checkered"></i> Finale</span>`;
}

function renderNextStepsPillHtml() {
  return `<span class="ws-pill ws-pill--finale"><i class="fa-solid fa-list-check"></i> Next Steps · Actions</span>`;
}

function getWorkshopModePill(workshopMode) {
  const pills = {
    orient: { pillIcon: 'fa-compass', pillLabel: 'Orientierung', pillTone: 'orient' },
    collect: { pillIcon: 'fa-lightbulb', pillLabel: 'Sammeln', pillTone: 'collect' },
    decide: { pillIcon: 'fa-ranking-star', pillLabel: 'Priorisierung', pillTone: 'decide' },
    present: { pillIcon: 'fa-person-chalkboard', pillLabel: 'Präsentieren', pillTone: 'brand' },
  };
  return pills[workshopMode] || null;
}

function getSlideShellMeta(slide) {
  const c = slide?.content || {};
  if (c.sopKind === 'next-steps' || slide?.settings?.sopNextSteps) {
    return { pillIcon: 'fa-list-check', pillLabel: 'Next Steps', pillTone: 'finale' };
  }
  if (isFinaleSlide(slide)) {
    if (slide.settings?.sopPitchSession || c.sopKind === 'pitch-session') return { pillIcon: 'fa-person-chalkboard', pillLabel: 'Pitch', pillTone: 'finale' };
    if (slide.settings?.sopAllTracksVote || c.sopKind === 'final-vote') return { pillIcon: 'fa-ranking-star', pillLabel: 'Priorisierung', pillTone: 'finale' };
    if (slide.settings?.sopAllTracksMatrix || slide.slide_type === 'priority_matrix') return { pillIcon: 'fa-table-cells-large', pillLabel: 'Matrix', pillTone: 'finale' };
    return { pillIcon: 'fa-flag-checkered', pillLabel: 'Finale', pillTone: 'finale' };
  }
  const modePill = getWorkshopModePill(slide?.settings?.workshopMode);
  const workshopSlide = c.sopGroup || c.sopDualParallel || c.sopKind?.startsWith('dual-pair')
    || isBrainstormCollectSlide(slide) || (slide?.slide_type === 'section' && c.sopTrackClass);
  if (modePill && workshopSlide) return modePill;
  if (c.sopKind === 'group-transition') return { pillIcon: 'fa-arrows-turn-right', pillLabel: 'Wechsel', pillTone: 'orient' };
  if (c.sopKind === 'dual-pair-orient') return { pillIcon: 'fa-map', pillLabel: 'Orientierung', pillTone: 'orient' };
  if (c.sopKind === 'dual-pair-collect') return { pillIcon: 'fa-lightbulb', pillLabel: 'Sammeln', pillTone: 'collect' };
  if (isBrainstormCollectSlide(slide)) return { pillIcon: 'fa-lightbulb', pillLabel: 'Sammeln', pillTone: 'collect' };
  if (shouldUseVoteWorkshopUi(slide)) return { pillIcon: 'fa-ranking-star', pillLabel: 'Priorisierung', pillTone: 'decide' };
  if (slide?.slide_type === 'section' && c.sopTrackClass) return { pillIcon: 'fa-map', pillLabel: (c.sopTrackLabel || 'SOP').replace(/^Track \d+: /, ''), pillTone: 'orient' };
  if (c.isHeroSlide && !isWorkshopClosingSlide(slide)) return { pillIcon: 'fa-signal', pillLabel: 'Start', pillTone: 'brand' };
  if (c.sopKind === 'workshop-close') return { pillIcon: 'fa-heart', pillLabel: 'Abschluss', pillTone: 'muted' };
  if (c.sopKind === 'workshop-goal') return { pillIcon: 'fa-bullseye', pillLabel: 'Ziel', pillTone: 'brand' };
  if (c.sopKind === 'instructions') return { pillIcon: 'fa-pen-ruler', pillLabel: 'Format', pillTone: 'brand' };
  if (c.sopKind === 'participants') return { pillIcon: 'fa-user-group', pillLabel: 'Zuweisung', pillTone: 'orient' };
  if (c.sopKind === 'group-vote' || c.sopKind === 'final-vote') return { pillIcon: 'fa-ranking-star', pillLabel: 'Priorisierung', pillTone: 'finale' };
  if (slide?.settings?.presentationClosing || (c.isHeroSlide && /danke/i.test(String(c.title || '')))) {
    return { pillIcon: 'fa-heart', pillLabel: 'Abschluss', pillTone: 'muted' };
  }
  if (slide?.slide_type === 'open' && slide?.settings?.anonymous) return { pillIcon: 'fa-comment', pillLabel: 'Feedback', pillTone: 'muted' };
  if (modePill) return modePill;
  return { pillIcon: 'fa-circle-info', pillLabel: 'Info', pillTone: 'muted' };
}

function getWsPresentChips(slide) {
  const c = slide?.content || {};
  const chips = [];
  if (c.sopDualBoth && Array.isArray(c.sopGroupChips)) {
    c.sopGroupChips.forEach((g) => {
      if (g?.sopGroupLabel) {
        chips.push({ icon: g.sopGroupIcon || getSopGroupMeta(g.sopGroup).icon, label: g.sopGroupLabel });
      }
    });
  } else {
    const group = c.sopGroup;
    const groupLabel = c.sopGroupLabel || (group ? getSopGroupMeta(group).label : '');
    if (group && groupLabel) {
      chips.push({ icon: c.sopGroupIcon || getSopGroupMeta(group).icon, label: groupLabel });
    }
  }
  const progress = getDualSopProgress(slide);
  if (progress?.label) {
    chips.push({ icon: progress.mode === 'sequential' ? 'fa-arrows-left-right' : 'fa-layer-group', label: progress.label });
  }
  if (slide?.slide_type === 'section' && c.sopTrackClass) {
    chips.push(...phaseChipsFromSubtitle(c.subtitle));
  }
  if (isBrainstormCollectSlide(slide)) {
    if (c.sopTrackLabel) {
      chips.push({ icon: 'fa-bookmark', label: workshopDisplayTitle(c) });
    }
    const ws = getWorkshopSettings();
    chips.push(
      { icon: 'fa-clock', label: `${Math.round((slide.settings?.timeLimitSec || ws.brainstormTimeLimitSec || 300) / 60)} Min.` },
      { icon: 'fa-list-ol', label: collectLimitPillLabel(slide) },
    );
  }
  if (c.sopKind === 'dual-pair-orient') {
    chips.push({ icon: 'fa-table-columns', label: 'Parallel' });
  }
  if (c.sopKind === 'next-steps' || slide?.settings?.sopNextSteps) {
    chips.push({ icon: 'fa-list-check', label: 'Next Steps' });
  } else   if (isFinaleSlide(slide) && !chips.length) {
    chips.push({ icon: 'fa-flag-checkered', label: 'Finale' });
  }
  if (slide?.slide_type === 'open' && slide?.settings?.anonymous && c.subtitle) {
    chips.push({ icon: 'fa-user-secret', label: c.subtitle });
  }
  return chips.filter(Boolean);
}

function getWsPresentTitle(slide) {
  const c = slide?.content || {};
  if (slide?.slide_type === 'section' && c.sopTrackClass) return workshopDisplayTitle(enrichSopContent(c));
  if (c.sopKind === 'dual-pair-orient') return getDualPairTrackLabel(slide);
  if (isBrainstormCollectSlide(slide) && isSopWorkshopPresentation()) return 'Use Cases sammeln';
  if (isBrainstormCollectSlide(slide)) {
    return workshopDisplayTitle(enrichSopContent(c)) || c.sopCardName || c.title;
  }
  return c.title || c.prompt || 'Folie';
}

function getWsPresentLead(slide) {
  if (!slide) return '';
  const c = slide?.content || {};
  if (isWorkshopClosingSlide(slide) || isWorkshopOpeningSlide(slide)) return '';
  if (isBrainstormCollectSlide(slide)) {
    const { question, note } = parseCollectPrompt(getCollectPromptForSlide(slide));
    return [question, note].filter(Boolean).join('\n') || getPatchedWorkshopSubtitle(c.subtitle) || '';
  }
  if (slide.slide_type === 'section' && c.sopTrackClass && c.body) {
    return String(c.body).trim();
  }
  if (c.sopKind === 'group-transition' || (slide.slide_type === 'section' && c.body && !c.subtitle)) {
    return String(c.body).trim();
  }
  if (c.subtitle) return getPatchedWorkshopSubtitle(c.subtitle);
  if (c.sopKind === 'next-steps' && c.body) return String(c.body).trim();
  if (shouldUseVoteWorkshopUi(slide) && c.prompt) {
    return String(c.prompt).split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
  }
  if (slide.slide_type === 'open' && c.prompt) {
    return String(c.prompt).split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
  }
  if (slide.slide_type === 'priority_matrix' && c.body) return String(c.body).split('\n')[0].trim();
  return '';
}

/** Einheitliche Sub-Headline (Moderator): Text ohne Icon — auf allen Folien identisch. */
function renderWsSubLead(text, { allowHtml = false } = {}) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const inner = allowHtml && raw.includes('<')
    ? raw
    : esc(raw).replace(/\n/g, '<br>');
  return `<p class="ws-sub-lead">${inner}</p>`;
}

function mountPresentWsSlide(stage, slide, slideIdx, { main = '', splitOn = false, title = null, lead = null } = {}) {
  const meta = getSlideShellMeta(slide);
  stage.innerHTML = wrapSlide(renderWsSlideShell({
    ...meta,
    title: title ?? getWsPresentTitle(slide),
    chips: getWsPresentChips(slide),
    lead: lead ?? getWsPresentLead(slide),
    main,
  }), slideIdx);
  applyPresentStageLayout(stage, slide, { splitOn });
  updatePresentHeader();
  updatePresentStats();
  renderPresentParticipants();
  void renderQrCode();
  syncPresentCodeBar(State.showPresentCode);
  syncSopWorkshopShell('present', slideIdx);
  finalizePresentUi(slide);
}

function renderWsSlideShell({ pillIcon, pillLabel, pillTone = 'brand', title, chips = [], lead = '', main = '' }) {
  const chipHtml = chips.filter(Boolean).map((ch) => (
    typeof ch === 'string'
      ? `<span class="ws-chip">${esc(ch)}</span>`
      : `<span class="ws-chip"><i class="fa-solid ${ch.icon || 'fa-circle'}"></i> ${esc(ch.label)}</span>`
  )).join('');
  const leadHtml = renderWsSubLead(lead, { allowHtml: typeof lead === 'string' && lead.includes('<') });
  return `<section class="ws-slide ws-slide--${esc(pillTone)}">
    <header class="ws-slide-head">
      <span class="ws-pill ws-pill--${esc(pillTone)}"><i class="fa-solid ${pillIcon}"></i> ${esc(pillLabel)}</span>
      ${chipHtml ? `<div class="ws-chips">${chipHtml}</div>` : ''}
    </header>
    ${title ? `<h1 class="ws-title">${esc(title)}</h1>` : ''}
    ${leadHtml}
    ${main ? `<div class="ws-body"><div class="ws-body-inner">${main}</div></div>` : ''}
  </section>`;
}

function isNavHiddenSlide(slide) {
  return !!slide?.settings?.sopDualHiddenNav;
}

function visibleNavSlides() {
  return (State.slides || []).filter((s) => !isNavHiddenSlide(s));
}

function advanceSlideIndex(from, delta) {
  let i = from;
  for (let step = 0; step < (State.slides?.length || 0) + 1; step += 1) {
    i += delta;
    if (i < 0 || i >= (State.slides?.length || 0)) return clamp(from, 0, Math.max(0, (State.slides?.length || 1) - 1));
    if (!isNavHiddenSlide(State.slides[i])) return i;
  }
  return clamp(from, 0, Math.max(0, (State.slides?.length || 1) - 1));
}

function visibleSlideCounter(idx) {
  const vis = visibleNavSlides();
  const slide = State.slides[idx];
  if (!slide || isNavHiddenSlide(slide)) {
    const n = vis.findIndex((s) => (State.slides || []).indexOf(s) > idx);
    return { n: Math.max(1, n + 1), total: vis.length || 1 };
  }
  const n = vis.findIndex((s) => s.id === slide.id) + 1;
  return { n: n > 0 ? n : idx + 1, total: vis.length || 1 };
}

function renderSopFinalePanelHtml(currentIndex, { clickable = false, onNavigate } = {}) {
  const findIdx = (predicate) => State.slides.findIndex(predicate);
  const summaryIdx = findIdx((s) => s.content?.sopAllTracksResults || s.content?.sopKind === 'all-tracks-summary');
  const pitchIdx = findIdx((s) => s.settings?.sopPitchSession || s.content?.sopKind === 'pitch-session');
  const voteIdx = findIdx((s) => {
    const c = s.content || {};
    return s.settings?.sopAllTracksVote || c.sopKind === 'final-vote' || c.sopKind === 'group-vote';
  });
  const matrixIdx = findIdx((s) => s.settings?.sopAllTracksMatrix || s.content?.sopKind === 'final-matrix');
  const nextStepsIdx = findIdx((s) => s.settings?.sopNextSteps || s.content?.sopKind === 'next-steps');
  const onNextSteps = State.slides[currentIndex]?.content?.sopKind === 'next-steps'
    || State.slides[currentIndex]?.settings?.sopNextSteps;

  let html = `<div class="workshop-sop-panel workshop-sop-panel--finale">
    <div class="workshop-sop-panel-head"><i class="fa-solid ${onNextSteps ? 'fa-list-check' : 'fa-flag-checkered'}"></i> ${onNextSteps ? 'Next Steps · Actions' : 'Finale'}</div>`;
  (window.SOP_TOOL_TRACKS || []).forEach((t) => {
    html += `<div class="workshop-sop-later-item">${esc(t.title.replace(/^Track \d+: /, ''))} · Abgeschlossen</div>`;
  });
  const step = (idx, icon, label) => {
    if (idx < 0) return '';
    return `<button type="button" class="workshop-sop-vote${currentIndex === idx ? ' active' : ''}" data-slide-index="${idx}">
      <i class="fa-solid ${icon}"></i><span>${esc(label)}</span>
    </button>`;
  };
  html += step(summaryIdx, 'fa-layer-group', 'Übersicht');
  html += step(pitchIdx, 'fa-person-chalkboard', 'Pitch Session');
  html += step(voteIdx, 'fa-ranking-star', 'Abstimmung');
  html += step(matrixIdx, 'fa-table-cells-large', 'Impact/Effort');
  html += step(nextStepsIdx, 'fa-list-check', 'Next Steps');
  html += '</div>';
  return {
    html,
    bind(container) {
      if (clickable && onNavigate) bindSopWorkshopPanelClicks(container, onNavigate);
    },
  };
}

function renderDualSopParallelPanelHtml(currentIndex, { clickable = false, onNavigate } = {}) {
  const pairCount = Math.max(
    (window.INTERNAL_SOP_TRACKS || []).length,
    (window.SOP_TOOL_TRACKS || []).length,
  );
  const findPairIdx = (kind, pairIndex) => State.slides.findIndex((s) => {
    const c = s.content || {};
    return c.sopKind === kind && c.sopDualPairIndex === pairIndex;
  });
  let html = `<div class="workshop-sop-panel dual-sop-parallel">
    <div class="workshop-sop-panel-head"><i class="fa-solid fa-table-columns"></i> Dual-SOP · Parallel</div>`;
  for (let i = 0; i < pairCount; i += 1) {
    const collectIdx = findPairIdx('dual-pair-collect', i);
    const active = currentIndex === collectIdx;
    const trackTitle = (window.INTERNAL_SOP_TRACKS?.[i]?.title || window.SOP_TOOL_TRACKS?.[i]?.title || `Track ${i + 1}`)
      .replace(/^Track \d+: /, '');
    html += `<div class="workshop-sop-phase${active ? ' is-current' : ''}">
      <div class="workshop-sop-panel-track is-label">
        <span class="workshop-sop-panel-badge">Track ${i + 1}</span>
        <span class="workshop-sop-panel-title">${esc(trackTitle)}</span>
      </div>`;
    if (collectIdx >= 0) {
      html += `<button type="button" class="workshop-sop-step${currentIndex === collectIdx ? ' active' : ''}" data-slide-index="${collectIdx}">
        <i class="fa-solid fa-lightbulb"></i> Use Cases sammeln
      </button>`;
    }
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

function renderSopWorkshopPanelHtml(currentIndex, { clickable = false, onNavigate } = {}) {
  // Finale-Folien (Pitch Session, Finale-Priorisierung, Impact/Effort-Matrix) haben
  // keinen aktiven Track — sie bekommen ein eigenes Finale-Panel mit den drei
  // Finale-Schritten + Liste der abgeschlossenen Tracks. Frühzeitig zurückkehren,
  // damit die track-basierte Logik (getActiveTrackKey läuft sonst rückwärts zum
  // LETZTEN Track) für die Finale-Folien NICHT greift.
  if (isFinaleSlide(State.slides[currentIndex])) {
    return renderSopFinalePanelHtml(currentIndex, { clickable, onNavigate });
  }
  if (isDualSopParallelWorkshop()) {
    return renderDualSopParallelPanelHtml(currentIndex, { clickable, onNavigate });
  }
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
  const trackVoteIdx = findIdx((s) => {
    const c = s.content || {};
    return s.settings?.sopTrackVote && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
  });
  const trackPresentationIdx = findIdx((s) => {
    const c = s.content || {};
    return c.sopKind === 'track-presentation' && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
  });
  // Pro-Track: EIN track-collect-Brainstorm pro Track (keine Phasen-Unterschritte).
  const trackBrainstormIdx = findIdx((s) => {
    const c = s.content || {};
    return s.slide_type === 'brainstorm' && c.sopKind === 'track-collect' && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
  });
  const trackIdxNum = tracks.findIndex((t) => t.class === activeTrack.class);

  let html = `<div class="workshop-sop-panel ${esc(activeTrack.class)} ${esc(navClass)}">
    <div class="workshop-sop-panel-head"><i class="fa-solid fa-map"></i> Workshop</div>`;
  html += `<button type="button" class="workshop-sop-panel-track${currentIndex === trackIntroIdx ? ' active' : ''}" data-slide-index="${trackIntroIdx}" ${trackIntroIdx < 0 ? 'disabled' : ''}>
    <span class="workshop-sop-panel-badge">Track ${trackIdxNum + 1}</span>
    <span class="workshop-sop-panel-title">${esc(activeTrack.title.replace(/^Track \d+: /, ''))}</span>
  </button>`;

  // Pro-Track-Struktur: nur ein Brainstorm-Schritt, KEINE Phasen-Liste (die Phasen
  // sind als Orientierung im SOP-Board auf der Folie sichtbar, nicht in der Nav).
  if (trackBrainstormIdx >= 0) {
    html += `<button type="button" class="workshop-sop-step ${currentIndex === trackBrainstormIdx ? 'active' : ''}" data-slide-index="${trackBrainstormIdx}" title="Brainstorming">
      <i class="fa-solid fa-lightbulb"></i> Brainstorm
    </button>`;
  }

  (activeTrack.phases || []).forEach((phase, phaseIdx) => {
    const phaseIntroIdx = findIdx((s) => {
      const c = s.content || {};
      return s.slide_type === 'section' && c.sopKind === 'phase' && c.sopPhaseName === phase.name && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
    });
    const phaseBrainstormIdx = findIdx((s) => {
      const c = s.content || {};
      return s.slide_type === 'brainstorm' && c.sopPhaseName === phase.name && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
    });
    // Phasen ohne eigene Folien (Pro-Track-Modus) NICHT als (tote) Nav-Einträge zeigen.
    if (phaseIntroIdx < 0 && phaseBrainstormIdx < 0) return;
    const phaseVoteIdx = findIdx((s) => {
      const c = s.content || {};
      return s.settings?.sopPhaseVote && c.sopPhaseName === phase.name && (c.sopTrackClass === activeTrack.class || c.sopTrackKey === activeTrack.class);
    });
    // Aktuelle Phase = wenn currentIndex auf Phase-Intro oder Phase-Brainstorm liegt
    const phaseActive = (currentIndex === phaseIntroIdx) || (currentIndex === phaseBrainstormIdx) || (currentIndex === phaseVoteIdx);
    // Passed: bereits abgehakt
    const phasePassed = (phaseVoteIdx >= 0 ? phaseVoteIdx : phaseBrainstormIdx) >= 0 && currentIndex > (phaseVoteIdx >= 0 ? phaseVoteIdx : phaseBrainstormIdx);
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
    if (phaseVoteIdx >= 0) {
      html += `<button type="button" class="workshop-sop-step ${currentIndex === phaseVoteIdx ? 'active' : ''}" data-slide-index="${phaseVoteIdx}" title="Priorisierung">
        <i class="fa-solid fa-ranking-star"></i> Priorisierung
      </button>`;
    }
    html += '</div>';
  });

  if (trackVoteIdx >= 0) {
    html += `<button type="button" class="workshop-sop-vote ${currentIndex === trackVoteIdx ? 'active' : ''}" data-slide-index="${trackVoteIdx}">
      <i class="fa-solid fa-ranking-star"></i><span>Top ${getWorkshopSettings().trackVoteCount} priorisieren</span>
    </button>`;
  }
  if (trackPresentationIdx >= 0) {
    html += `<button type="button" class="workshop-sop-vote ${currentIndex === trackPresentationIdx ? 'active' : ''}" data-slide-index="${trackPresentationIdx}">
      <i class="fa-solid fa-person-chalkboard"></i><span>Pitch Session</span>
    </button>`;
  }

  const laterTracks = tracks.filter((t) => t.class !== activeTrackKey);
  if (laterTracks.length) {
    html += '<div class="workshop-sop-later">';
    laterTracks.forEach((track) => {
      const tIdx = findIdx((s) => s.content?.sopKind === 'track' && (s.content.sopTrackClass === track.class || s.content.sopTrackKey === track.class));
      const tVote = findIdx((s) => s.settings?.sopTrackVote && (s.content?.sopTrackClass === track.class || s.content?.sopTrackKey === track.class));
      const done = tVote >= 0 && currentIndex > tVote;
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
  document.body.classList.toggle('lp-dual-sop-parallel', isDualSopParallelWorkshop());
  document.body.classList.toggle('lp-dual-sop-workshop', isDualSopWorkshop());
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

  // Die SOP-Übersicht soll auf ALLEN SOP-Folien sichtbar sein — inklusive der
  // drei Finale-Folien (Pitch Session, Finale-Priorisierung, Impact/Effort-Matrix).
  // renderSopWorkshopPanelHtml rendert für diese Folien automatisch das Finale-Panel.
  const hidePanelForSlide = false;

  editorNav?.classList.add('hidden');
  if (mode === 'editor') mountPanel(editorPanel);
  else editorPanel?.classList.add('hidden');

  if (mode === 'present' && !hidePanelForSlide) mountPanel(presentPanel);
  else presentPanel?.classList.add('hidden');

  if (mode === 'participant' && !hidePanelForSlide) mountPanel(participantPanel);
  else participantPanel?.classList.add('hidden');
}

function renderSopBoardPreview(c, editable = false, { hideTrackHeader = false, alignCards = false } = {}) {
  const content = enrichSopContent(c);
  if (content.sopKind === 'track' && !content.sopBoard?.length) return '';
  const board = content.sopBoard || [];
  if (!board.length) return '';
  const theme = sopTrackTheme(content.sopTrackClass);
  const trackIdx = content.sopTrackIndex || 1;
  const boardTitle = board.length === 1 && content.sopPhaseName
    ? content.sopPhaseName
    : (content.sopTrackLabel || content.title || 'SOP');
  const ed = (field, val, cls) => editable
    ? `<span class="canvas-editable ${cls}" contenteditable="true" data-field="${field}">${esc(val)}</span>`
    : esc(val);
  const maxCards = Math.max(1, ...board.map((phase) => (phase.cards || []).length));
  const cols = board.map((phase) => {
    const cards = (phase.cards || []).map((card) => `
        <div class="sop-board-card ${card === content.sopCardName || (content.sopKind === 'card' && card === content.title) ? 'active' : ''}">
          <span>${esc(card)}</span>
        </div>`).join('');
    const spacers = alignCards ? Array(Math.max(0, maxCards - (phase.cards || []).length)).fill(0).map(() => (
      '<div class="sop-board-card sop-board-card--spacer" aria-hidden="true"><span>&nbsp;</span></div>'
    )).join('') : '';
    return `
    <div class="sop-board-phase ${phase.name === content.sopPhaseName || board.length === 1 ? 'active' : ''}">
      <div class="sop-board-phase-label">${ed('phase', phase.name, 'sop-board-phase-name')}</div>
      <div class="sop-board-cards">${cards}${spacers}</div>
    </div>`;
  }).join('');
  const headerHtml = hideTrackHeader ? '' : `
      <div class="sop-board-track-header">
        <span class="sop-board-track-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">Track ${trackIdx}</span>
        <span class="sop-board-track-name">${ed('title', boardTitle, 'sop-board-track-title')}</span>
      </div>`;
  return `
    <div class="sop-board-preview${hideTrackHeader ? ' sop-board-preview--no-header' : ''} ${esc(content.sopTrackClass || '')} ${esc(content.sopKind || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
      ${headerHtml}
      <div class="sop-board-phases-row" style="--sop-phase-count:${board.length};--sop-max-cards:${maxCards}">${cols}</div>
    </div>`;
}

function renderSopSectionHtml(c, editable = false, { shellMode = false, splitCol = false, participantCompact = false } = {}) {
  const content = enrichSopContent(c);
  const theme = sopTrackTheme(content.sopTrackClass);
  const isTrack = content.sopKind === 'track';
  if (participantCompact && !editable) {
    const board = content.sopBoard || [];
    const phases = board.map((p) => `<li class="sop-participant-phase-item"><i class="fa-solid fa-circle-dot"></i> ${esc(p.name)}</li>`).join('');
    return `<div class="sop-participant-track-intro" style="--sop-accent:${theme.accent}">
      <div class="sop-pslide-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(content.sopTrackLabel || 'SOP')}</div>
      <h2 class="sop-participant-track-title">${esc(content.title || '')}</h2>
      ${content.subtitle ? `<p class="sop-participant-track-sub">${esc(content.subtitle)}</p>` : ''}
      ${content.body ? `<p class="sop-participant-track-body">${esc(content.body).replace(/\n/g, '<br>')}</p>` : ''}
      ${phases ? `<ul class="sop-participant-phase-list">${phases}</ul>` : ''}
    </div>`;
  }
  if (shellMode && !editable) {
    const colTitle = splitCol && editable
      ? `<h2 class="ws-col-title">${esc(workshopDisplayTitle(content))}</h2>`
      : '';
    const bodyEl = editable && content.body
      ? `<p class="sop-pslide-body sop-pslide-body--shell">${esc(content.body).replace(/\n/g, '<br>')}</p>`
      : '';
    return `
    <div class="sop-pslide-section sop-pslide-section--shell ${isTrack ? 'sop-pslide-track' : 'sop-pslide-phase'} ${esc(content.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
      ${colTitle}
      ${bodyEl}
      ${editable
        ? renderSopBoardPreview(content, editable, { hideTrackHeader: shellMode, alignCards: splitCol })
        : renderSopBoardPresentHtml(content, false, { hideTrackHeader: shellMode, alignCards: splitCol })}
    </div>`;
  }
  const titleEl = editable
    ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title" data-placeholder="Titel…">${esc(content.title || '')}</div>`
    : `<h1 class="sop-pslide-title">${esc(content.title)}</h1>`;
  const subEl = editable
    ? `<div class="canvas-editable sop-pslide-sub" contenteditable="true" data-field="subtitle" data-placeholder="Untertitel…">${esc(content.subtitle || '')}</div>`
    : (content.subtitle ? `<p class="sop-pslide-sub">${esc(content.subtitle)}</p>` : '');
  const bodyEl = editable
    ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body" data-placeholder="Einleitungstext…">${esc(content.body || '')}</div>`
    : (content.body ? `<p class="sop-pslide-body">${esc(content.body).replace(/\n/g, '<br>')}</p>` : '');
  return `
    <div class="sop-pslide-section ${isTrack ? 'sop-pslide-track' : 'sop-pslide-phase'} ${esc(content.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
      <div class="sop-pslide-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(content.sopTrackLabel || 'SOP')}</div>
      ${titleEl}
      ${subEl}
      ${bodyEl}
      ${renderSopBoardPreview(content, editable)}
    </div>`;
}

function renderGroupTransitionHtml(c, editable = false, { shellMode = false } = {}) {
  const progress = c.sopDualProgress?.label || '';
  const bodyEl = editable
    ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
    : (c.body ? `<p class="ws-transition-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
  const inner = `<div class="ws-transition-card">
    <div class="ws-transition-icon"><i class="fa-solid fa-arrows-turn-right"></i></div>
    ${progress ? `<span class="ws-transition-badge ws-pill ws-pill--orient">${esc(progress)}</span>` : ''}
    ${bodyEl}
  </div>`;
  return shellMode ? `<div class="ws-sop-main ws-sop-main--transition">${inner}</div>` : inner;
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
      <div class="sop-pslide-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(c.sopTrackLabel)} · ${esc(c.sopPhaseName)}</div>
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
  return `<div class="sop-track-results">${byCard.filter((g) => g.items.length).map((group) => {
    const head = isGenericCollectCardLabel(group.card)
      ? `<div class="sop-track-result-head"><strong>${esc(group.phase)}</strong></div>`
      : `<div class="sop-track-result-head"><span>${esc(group.phase)}</span><strong>${esc(group.card)}</strong></div>`;
    return `<div class="sop-track-result-group">
      ${head}
      <div class="sop-track-result-items">${group.items.map((item) => `<div class="sop-track-result-item">${renderUseCaseDisplayHtml(item.text, 'full')}</div>`).join('')}</div>
    </div>`;
  }).join('')}<div class="sop-track-result-total">${allItems.length} Use Cases gesammelt</div></div>`;
}

function renderSopContentHtml(c, editable = false, opts = {}) {
  const { shellMode = false } = opts;
  if (c.sopKind === 'card') return renderSopCardHtml(c, editable);
  if (c.sopAllTracksResults) {
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title)}</h1>`;
    const bodyEl = editable
      ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-pslide-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    const results = State.session ? renderAllTracksResultsHtml() : '<div class="present-wait-msg">Ergebnisse erscheinen in der Live-Session.</div>';
    return `
      <div class="sop-pslide-section sop-all-tracks-results-slide">
        <div class="sop-pslide-badge" style="background:#0f172a;color:#fff">Alle Tracks</div>
        ${titleEl}
        ${bodyEl}
        <div class="sop-track-results-wrap">${results}</div>
      </div>`;
  }
  if (c.sopTrackResults) {
    const theme = sopTrackTheme(c.sopTrackClass);
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title)}</h1>`;
    const bodyEl = editable
      ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-pslide-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    const results = State.session ? renderSopTrackResultsHtml(c.sopTrackKey) : '<div class="present-wait-msg">Ergebnisse erscheinen in der Live-Session.</div>';
    return `
      <div class="sop-pslide-section sop-track-results-slide ${esc(c.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
        <div class="sop-pslide-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(c.sopTrackLabel || 'Track')}</div>
        ${titleEl}
        ${bodyEl}
        ${renderSopBoardPreview(c, editable)}
        <div class="sop-track-results-wrap">${results}</div>
      </div>`;
  }
  // Zielbild-Folie — Workshop-Ziel mit Impact/Effort-Vorschau (Quick Wins als Ziel)
  if (c.sopKind === 'workshop-goal') {
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title || '')}</h1>`;
    const subEl = editable
      ? `<div class="canvas-editable sop-pslide-sub" contenteditable="true" data-field="subtitle">${esc(c.subtitle || '')}</div>`
      : (c.subtitle ? `<p class="sop-pslide-sub">${esc(c.subtitle)}</p>` : '');
    const bodyEl = editable
      ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-pslide-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    const bodyShell = c.body
      ? `<div class="ws-goal-copy">${String(c.body).split(/\n\n+/).filter(Boolean).map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}</div>`
      : '';
    const goalMatrix = renderGoalMatrixPreview();
    if (shellMode && !editable) {
      return `<div class="ws-sop-main ws-sop-main--goal">${bodyShell}<div class="ws-matrix-stage ws-matrix-stage--goal">${goalMatrix}</div></div>`;
    }
    const legacyMatrix = goalMatrix;
    return `
      <div class="sop-pslide-section sop-pslide-goal">
        <div class="sop-pslide-badge" style="background:var(--brand);color:#fff"><i class="fa-solid fa-bullseye"></i> Ziel</div>
        ${titleEl}
        ${subEl}
        ${bodyEl}
        ${legacyMatrix}
      </div>`;
  }
  // Instructions slide — structured ROOTS-Design layout
  if (c.sopKind === 'instructions') {
    const theme = { accent: '#206efb', soft: 'rgba(32,110,251,.08)', badgeBg: '#206efb', badgeColor: '#fff' };
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title || '')}</h1>`;
    const subEl = c.subtitle ? `<p class="sop-pslide-sub">${esc(c.subtitle)}</p>` : '';
    let instrHtml = '';
    if (c.body) {
      let mode = '';
      let avoidBuf = [];
      const flushAvoid = () => {
        if (avoidBuf.length) {
          instrHtml += `<div class="wi-avoid-tags">${avoidBuf
            .map((a) => `<span class="wi-avoid-tag">${esc(a)}</span>`)
            .join('')}</div>`;
          avoidBuf = [];
        }
      };
      // Formel: feste Komponenten-Labels (Was · KI-Feature · Voraussetzungen)
      const ucLabels = getUseCaseLabels();
      for (const line of c.body.split('\n')) {
        const t = line.trim();
        if (!t) { flushAvoid(); mode = ''; continue; }
        if (t.startsWith('Format:')) {
          flushAvoid();
          mode = '';
          const formula = t.replace(/^Format:\s*/, '').split('|').map((p) => p.trim()).filter(Boolean);
          instrHtml += `<div class="wi-formula">${formula.map((p, i) =>
            `${i > 0 ? '<span class="wi-formula-plus">+</span>' : ''}<span class="wi-formula-part"><i class="fa-solid ${['fa-lightbulb', 'fa-gear', 'fa-link'][i] || 'fa-circle'}"></i> ${esc(p)}</span>`
          ).join('')}</div>`;
        } else if (/^(Pro Eintrag|Je präziser)/i.test(t)) {
          continue;
        } else if (t === 'Gute Use Cases:') {
          flushAvoid();
          mode = 'good';
          instrHtml += `<div class="wi-section-head wi-section-good"><i class="fa-solid fa-circle-check"></i> <span>So sieht ein guter Use Case aus</span></div>`;
        } else if (t === 'Bitte vermeiden:') {
          flushAvoid();
          mode = 'avoid';
          instrHtml += `<div class="wi-section-head wi-section-avoid"><i class="fa-solid fa-circle-minus"></i> <span>Bitte vermeiden</span></div>`;
        } else if (mode === 'good' && (t.includes('|') || t.includes(' · '))) {
          instrHtml += `<div class="wi-example">${renderUseCasePillsHtml(t, 'full')}</div>`;
        } else if (mode === 'avoid') {
          avoidBuf.push(t);
        } else {
          flushAvoid();
          const introClass = /^(Pro Eintrag|Je präziser|Schreibt)/i.test(t) ? ' wi-intro' : '';
          instrHtml += `<p class="wi-note${introClass}">${esc(t)}</p>`;
        }
      }
      flushAvoid();
    }
    if (shellMode && !editable) {
      return `<div class="ws-sop-main ws-sop-main--instructions"><div class="workshop-instructions-card workshop-instructions-card--present">${instrHtml}</div></div>`;
    }
    return `
      <div class="sop-pslide-section sop-pslide-instructions" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
        <div class="sop-pslide-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">Workshop · So geht\'s</div>
        ${titleEl}
        ${subEl}
        <div class="workshop-instructions-card">${instrHtml}</div>
      </div>`;
  }
  // Next Steps — Quick Wins aus der Matrix als Action Log
  if (c.sopKind === 'next-steps') {
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title || '')}</h1>`;
    const bodyEl = editable
      ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-pslide-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    const log = renderNextStepsActionLogHtml({ editable: !!(State.user && shellMode) });
    if (shellMode && !editable) {
      return `<div class="ws-sop-main ws-sop-main--nextsteps">${log}</div>`;
    }
    return `
      <div class="sop-pslide-section sop-pslide-nextsteps">
        ${renderNextStepsPillHtml()}
        ${titleEl}
        ${bodyEl}
        ${log}
      </div>`;
  }
  // Pitch Session — alle Use Cases mit Autornamen + Timer
  if (c.sopKind === 'pitch-session') {
    const timerSec = Number(c.pitchTimerSec || getWorkshopSettings().pitchTimerSec || 120);
    const tMin = Math.floor(timerSec / 60);
    const tSec = timerSec % 60;
    const tLabel = tMin > 0 ? `${tMin}:${String(tSec).padStart(2, '0')} Min` : `${tSec} Sek`;
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title || '')}</h1>`;
    const subEl = c.subtitle ? `<p class="sop-pslide-sub">${esc(c.subtitle)}</p>` : '';
    // Kein globaler Timer mehr — jeder Use Case bekommt einen eigenen Timer (s.u.).
    // Im Editor nur die Dauer pro Pitch konfigurierbar.
    const configEl = editable
      ? `<div class="pitch-timer-edit"><i class="fa-solid fa-stopwatch"></i> Timer pro Pitch: <span contenteditable="true" class="canvas-editable pitch-timer-sec" data-field="pitchTimerSec">${timerSec}</span> Sekunden</div>`
      : `<p class="pitch-hint"><i class="fa-solid fa-circle-info"></i> <span>Jede Person pitcht ihren Use Case · ${esc(tLabel)} pro Pitch — Timer je Use Case über den Button starten und stoppen.</span></p>`;
    const useCasesHtml = State.session
      ? renderAllTracksUseCasesWithAuthors(timerSec)
      : '<div class="present-wait-msg">Use Cases mit Autornamen erscheinen in der Live-Session.</div>';
    if (shellMode && !editable) {
      return `<div class="ws-sop-main ws-sop-main--pitch"><div class="pitch-use-cases">${useCasesHtml}</div></div>`;
    }
    return `
      <div class="sop-pslide-section sop-pitch-session">
        ${renderFinalePillHtml()}
        ${titleEl}
        ${subEl}
        ${configEl}
        <div class="pitch-use-cases">${useCasesHtml}</div>
      </div>`;
  }
  // Phase Overview, Track Overview, Presentation Session
  // → rendern als sop-pslide-section mit Track-Farbe und Board-Vorschau
  if (c.sopKind === 'phase-overview' || c.sopKind === 'track-overview' || c.sopKind === 'track-presentation') {
    const theme = c.sopTrackClass
      ? sopTrackTheme(c.sopTrackClass)
      : { accent: '#206efb', soft: 'rgba(32,110,251,.08)', badgeBg: '#206efb', badgeColor: '#fff' };
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title || '')}</h1>`;
    const subEl = editable
      ? `<div class="canvas-editable sop-pslide-sub" contenteditable="true" data-field="subtitle">${esc(c.subtitle || '')}</div>`
      : (c.subtitle ? `<p class="sop-pslide-sub">${esc(c.subtitle)}</p>` : '');
    const bodyEl = editable
      ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-pslide-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    let top3Html = '';
    if (c.sopKind === 'track-presentation' && State.session && !editable) {
      const key = c.sopTrackKey || c.sopTrackClass;
      const topData = aggregateTopTrackVotedUseCases().find((t) => t.trackKey === key);
      if (topData?.items?.length) {
        top3Html = `<div class="sop-presentation-top3">
          <div class="sop-presentation-top3-head"><i class="fa-solid fa-trophy"></i> Top ${topData.items.length} aus der Track-Abstimmung</div>
          ${topData.items.map((it, i) => `<div class="sop-presentation-top3-item"><span class="sop-presentation-top3-rank">#${i + 1}</span>${renderUseCaseDisplayHtml(it.text, 'full')}${it.votes ? `<small>${it.votes}× gewählt</small>` : ''}</div>`).join('')}
        </div>`;
      }
    }
    if (shellMode && !editable) {
      return `<div class="ws-sop-main ws-sop-main--presentation">${top3Html}${bodyEl}${renderSopBoardPresentHtml(c, false, { hideTrackHeader: true, alignCards: true })}</div>`;
    }
    return `
      <div class="sop-pslide-section sop-pslide-${c.sopKind} ${esc(c.sopTrackClass || '')}" style="--sop-accent:${theme.accent};--sop-soft:${theme.soft}">
        <div class="sop-pslide-badge" style="background:${theme.badgeBg};color:${theme.badgeColor}">${esc(c.sopTrackLabel || 'SOP')}</div>
        ${titleEl}
        ${subEl}
        ${top3Html}
        ${bodyEl}
        ${renderSopBoardPreview(c, editable)}
      </div>`;
  }
  // SOP-Zuweisung — live aus QR-Teilnehmern (Present) / Platzhalter (Editor)
  if (c.sopKind === 'participants') {
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : `<h1 class="sop-pslide-title">${esc(c.title || '')}</h1>`;
    const subEl = editable
      ? `<div class="canvas-editable sop-pslide-sub" contenteditable="true" data-field="subtitle">${esc(c.subtitle || '')}</div>`
      : (c.subtitle ? `<p class="sop-pslide-sub">${esc(c.subtitle)}</p>` : '');
    const assignBoard = renderSopAssignBoardHtml({ large: true });
    const editorHint = `<p class="sop-assign-editor-hint"><i class="fa-solid fa-qrcode"></i> Im Live-Modus erscheinen hier alle per QR-Code beigetretenen Teilnehmer — der Host weist sie Internal oder Consulting zu.</p>`;
    if (shellMode && !editable) {
      return `<div class="ws-sop-main ws-sop-main--participants">${assignBoard}</div>`;
    }
    return `
      <div class="sop-pslide-section sop-pslide-participants">
        <div class="sop-pslide-badge" style="background:var(--brand);color:#fff"><i class="fa-solid fa-user-group"></i> Zuweisung</div>
        ${titleEl}
        ${subEl}
        ${editable ? editorHint : assignBoard || editorHint}
      </div>`;
  }
  // Generischer SOP-Content-Fallback (sonst wuerde eine unbekannte sopKind-Folie leer rendern).
  {
    const titleEl = editable
      ? `<div class="canvas-editable sop-pslide-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
      : (c.title ? `<h1 class="sop-pslide-title">${esc(c.title)}</h1>` : '');
    const subEl = editable
      ? `<div class="canvas-editable sop-pslide-sub" contenteditable="true" data-field="subtitle">${esc(c.subtitle || '')}</div>`
      : (c.subtitle ? `<p class="sop-pslide-sub">${esc(c.subtitle)}</p>` : '');
    const bodyEl = editable
      ? `<div class="canvas-editable sop-pslide-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
      : (c.body ? `<p class="sop-pslide-body">${esc(c.body).replace(/\n/g, '<br>')}</p>` : '');
    if (!c.title && !c.subtitle && !c.body && !editable) return '';
    if (shellMode && !editable) {
      return `<div class="ws-sop-main">${bodyEl}</div>`;
    }
    return `
      <div class="sop-pslide-section sop-pslide-${esc(c.sopKind || 'content')}">
        ${titleEl}
        ${subEl}
        ${bodyEl}
      </div>`;
  }
}

function isWorkshopClosingSlide(slide) {
  if (!slide) return false;
  const c = slide.content || {};
  if (c.sopKind === 'workshop-close') return true;
  if (slide.settings?.presentationClosing) return true;
  if (c.isHeroSlide && /danke|abschluss|thank/i.test(String(c.title || ''))) return true;
  return false;
}

function isWorkshopOpeningSlide(slide) {
  if (!slide?.content?.isHeroSlide) return false;
  return !isWorkshopClosingSlide(slide);
}

function getWorkshopCloseStats() {
  const { allItems } = aggregateAllTracksUseCases();
  const useCases = allItems.length;
  const participants = State.participants?.length || 0;
  const tracks = new Set(allItems.map((i) => i.trackKey).filter(Boolean)).size;
  return { useCases, participants, tracks };
}

function renderClosingSlideHtml(c, editable = false, opts = {}) {
  const { shellMode = false, presentFx = false, hideChrome = false } = opts;
  const bodyHtml = editable
    ? `<div class="canvas-editable pslide-hero-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
    : `<div class="ws-closing-body">${esc(c.body || '').replace(/\n/g, '<br>')}</div>`;
  if (shellMode && !editable && presentFx) {
    const stats = State.session ? getWorkshopCloseStats() : null;
    const statsHtml = stats && (stats.useCases || stats.participants)
      ? `<div class="ws-closing-stats">
          ${stats.useCases ? `<span class="ws-closing-stat"><strong>${stats.useCases}</strong> Use Cases</span>` : ''}
          ${stats.participants ? `<span class="ws-closing-stat"><strong>${stats.participants}</strong> Teilnehmer</span>` : ''}
          ${stats.tracks ? `<span class="ws-closing-stat"><strong>${stats.tracks}</strong> Tracks</span>` : ''}
        </div>`
      : '';
    return `
      <div class="ws-closing-stage">
        <canvas class="ws-closing-ai-canvas" aria-hidden="true"></canvas>
        <div class="ws-closing-sparkles" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="ws-closing-glow ws-closing-glow--a" aria-hidden="true"></div>
        <div class="ws-closing-glow ws-closing-glow--b" aria-hidden="true"></div>
        <div class="ws-closing-content">
          <div class="ws-closing-icon-ring"><i class="fa-solid fa-champagne-glasses"></i></div>
          ${hideChrome ? '' : `<h1 class="ws-closing-title ws-closing-title--shimmer">${esc(c.title || 'Danke!')}</h1>`}
          ${statsHtml}
          ${bodyHtml}
        </div>
      </div>`;
  }
  if (shellMode && !editable) return bodyHtml;
  const titleEl = editable
    ? `<div class="canvas-editable pslide-hero-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="pslide-hero-title">${esc(c.title || '')}</h1>`;
  return `
    <div class="pslide-hero pslide-hero--closing">
      <div class="pslide-hero-icon"><i class="fa-solid fa-heart"></i></div>
      ${titleEl}
      ${bodyHtml.replace('ws-closing-body', 'pslide-hero-body')}
    </div>`;
}

function stopClosingAiFx() {
  if (State.closingAiRaf) {
    cancelAnimationFrame(State.closingAiRaf);
    State.closingAiRaf = 0;
  }
}

function cleanupParticipantClosingFx() {
  const wrap = document.querySelector('#participant-root .ws-closing-stage');
  wrap?._closingAiCleanup?.();
  $('#screen-participant')?.classList.remove('participant-closing-active');
}

function participantClosingHeroKey(slide, slideIndex) {
  return `${slide?.id || 'x'}:${slideIndex}`;
}

function isParticipantClosingHeroSlide(slide) {
  return slide?.content?.sopKind === 'workshop-close' || isWorkshopClosingSlide(slide);
}

function mountParticipantClosingHero(hostSlide, slideIndex, root, finishParticipant) {
  const key = participantClosingHeroKey(hostSlide, slideIndex);
  const mobileFx = isParticipantMobileLayout();
  const screen = $('#screen-participant');
  screen?.classList.toggle('participant-closing-active', mobileFx);

  if (State._participantClosingMountKey === key && root.querySelector('.participant-closing-hero .ws-closing-stage')) {
    requestAnimationFrame(() => initClosingAiFx(root, { reuse: true }));
    finishParticipant();
    return true;
  }

  State._participantClosingMountKey = key;
  cleanupParticipantClosingFx();

  const closingHtml = renderClosingSlideHtml(hostSlide.content || {}, false, { shellMode: true, presentFx: true });
  const fullscreenClass = mobileFx ? ' participant-closing-fullscreen' : '';
  root.innerHTML = wrapParticipantSlide(`
    <div class="participant-wait-block participant-closing-block participant-closing-hero${fullscreenClass}">
      ${closingHtml}
      <p class="participant-sop-wait participant-sop-wait--closing"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p>
    </div>`, slideIndex);

  requestAnimationFrame(() => initClosingAiFx(root));
  maybeLaunchClosingCelebration(hostSlide);
  finishParticipant();
  return true;
}

function initClosingAiFx(stage, opts = {}) {
  const { reuse = false } = opts;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  const wrap = stage?.querySelector('.ws-closing-stage');
  const canvas = wrap?.querySelector('.ws-closing-ai-canvas');
  if (!wrap || !canvas) return;
  if (reuse && wrap._closingAiRunning && State._closingAiWrap === wrap && State.closingAiRaf) return;
  wrap._closingAiCleanup?.();
  stopClosingAiFx();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  State._closingAiWrap = wrap;
  wrap._closingAiRunning = true;
  const particles = [];
  const colors = ['#206efb', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4'];
  let lastW = 0;
  let lastH = 0;
  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (w === lastW && h === lastH && particles.length) return;
    lastW = w;
    lastH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) {
      const count = Math.min(72, Math.max(32, Math.floor(w / 18)));
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.48,
          vy: 0.28 + Math.random() * 0.72,
          r: 2 + Math.random() * 3.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          a: 0.32 + Math.random() * 0.58,
        });
      }
    }
  };
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(wrap);
  const tick = () => {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; }
      if (p.x < -8) p.x = w + 8;
      if (p.x > w + 8) p.x = -8;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.a;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    State.closingAiRaf = requestAnimationFrame(tick);
  };
  State.closingAiRaf = requestAnimationFrame(tick);
  wrap._closingAiCleanup = () => {
    wrap._closingAiRunning = false;
    if (State._closingAiWrap === wrap) State._closingAiWrap = null;
    stopClosingAiFx();
    ro?.disconnect();
  };
}

function maybeLaunchClosingCelebration(slide) {
  if (!isWorkshopClosingSlide(slide)) return;
  if (State.closingCelebrationSlideId === slide.id) return;
  State.closingCelebrationSlideId = slide.id;
  launchResultsConfetti(4800);
}

function renderEditorUseCaseFieldsPreviewHtml() {
  const L = getUseCaseLabels();
  return `<div class="editor-uc-fields-preview">
    <p class="editor-uc-fields-head"><i class="fa-solid fa-mobile-screen-button"></i> Teilnehmer-Eingabe · drei Felder</p>
    <div class="editor-uc-field"><span class="editor-uc-field-label">${esc(L.formula[0])}</span><span class="editor-uc-field-ph">Was wollt ihr umsetzen?</span></div>
    <div class="editor-uc-field"><span class="editor-uc-field-label">${esc(L.formula[1])}</span><span class="editor-uc-field-ph">Was soll die KI tun?</span></div>
    <div class="editor-uc-field"><span class="editor-uc-field-label">${esc(L.formula[2])}</span><span class="editor-uc-field-ph">Was muss vorhanden sein?</span></div>
  </div>`;
}

function renderHeroSlideHtml(c, editable = false, opts = {}) {
  const { shellMode = false, presentFx = false, hideChrome = false } = opts;
  const bodyEl = editable
    ? `<div class="canvas-editable pslide-hero-body" contenteditable="true" data-field="body">${esc(c.body || '')}</div>`
    : `<div class="ws-hero-body">${esc(c.body || '').replace(/\n/g, '<br>')}</div>`;
  if (shellMode && !editable && presentFx) {
    return `
      <div class="ws-hero-stage">
        <canvas class="ws-hero-ai-canvas" aria-hidden="true"></canvas>
        <div class="ws-hero-ai-grid" aria-hidden="true"></div>
        <div class="ws-hero-glow ws-hero-glow--a" aria-hidden="true"></div>
        <div class="ws-hero-glow ws-hero-glow--b" aria-hidden="true"></div>
        <div class="ws-hero-content">
          <div class="ws-hero-icon-ring"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          ${hideChrome ? '' : `<h1 class="ws-hero-title ws-hero-title--shimmer">${esc(c.title || '')}</h1>`}
          ${bodyEl.replace('ws-hero-body', 'ws-hero-body ws-hero-lead')}
        </div>
      </div>`;
  }
  if (shellMode && !editable) return bodyEl;
  const titleEl = editable
    ? `<div class="canvas-editable pslide-hero-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>`
    : `<h1 class="pslide-hero-title">${esc(c.title)}</h1>`;
  return `
    <div class="pslide-hero">
      <div class="pslide-hero-icon"><i class="fa-solid fa-signal"></i></div>
      ${titleEl}
      ${bodyEl}
    </div>`;
}

function stopHeroAiFx() {
  if (State.heroAiRaf) {
    cancelAnimationFrame(State.heroAiRaf);
    State.heroAiRaf = 0;
  }
}

function cleanupParticipantHeroFx() {
  const wrap = document.querySelector('#participant-root .ws-hero-stage');
  wrap?._heroAiCleanup?.();
  $('#screen-participant')?.classList.remove('participant-hero-active');
}

function participantOpeningHeroKey(slide, slideIndex) {
  return `${slide?.id || 'x'}:${slideIndex}`;
}

function isParticipantOpeningHeroSlide(slide) {
  return slide?.content?.isHeroSlide && isWorkshopOpeningSlide(slide);
}

function mountParticipantOpeningHero(hostSlide, slideIndex, root, finishParticipant) {
  const key = participantOpeningHeroKey(hostSlide, slideIndex);
  const mobileFx = isParticipantMobileLayout();
  const screen = $('#screen-participant');
  screen?.classList.toggle('participant-hero-active', mobileFx);

  if (State._participantHeroMountKey === key && root.querySelector('.participant-opening-hero .ws-hero-stage')) {
    requestAnimationFrame(() => initHeroAiFx(root, { reuse: true }));
    finishParticipant();
    return true;
  }

  State._participantHeroMountKey = key;
  cleanupParticipantHeroFx();

  const heroHtml = renderHeroSlideHtml(hostSlide.content, false, { shellMode: true, presentFx: true });
  const fullscreenClass = mobileFx ? ' participant-hero-fullscreen' : '';
  root.innerHTML = wrapParticipantSlide(`
    <div class="participant-wait-block participant-opening-hero${fullscreenClass}">
      ${heroHtml}
      <p class="participant-sop-wait participant-sop-wait--hero"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p>
    </div>`, slideIndex);

  requestAnimationFrame(() => initHeroAiFx(root));
  finishParticipant();
  return true;
}

function initHeroAiFx(stage, opts = {}) {
  const { reuse = false } = opts;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  const wrap = stage?.querySelector('.ws-hero-stage');
  const canvas = wrap?.querySelector('.ws-hero-ai-canvas');
  if (!wrap || !canvas) return;
  if (reuse && wrap._heroAiRunning && State._heroAiWrap === wrap && State.heroAiRaf) return;
  wrap._heroAiCleanup?.();
  stopHeroAiFx();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  State._heroAiWrap = wrap;
  wrap._heroAiRunning = true;
  const particles = [];
  let lastW = 0;
  let lastH = 0;
  const resize = () => {
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (w === lastW && h === lastH && particles.length) return;
    lastW = w;
    lastH = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) {
      const count = Math.min(88, Math.max(42, Math.floor(w / 16)));
      for (let i = 0; i < count; i += 1) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.62,
          vy: (Math.random() - 0.5) * 0.62,
          r: 1.6 + Math.random() * 3.4,
          a: 0.28 + Math.random() * 0.55,
        });
      }
    }
  };
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(wrap);
  const tick = () => {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = `rgba(32,110,251,${p.a})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          ctx.strokeStyle = `rgba(32,110,251,${(1 - dist / 140) * 0.26})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    State.heroAiRaf = requestAnimationFrame(tick);
  };
  State.heroAiRaf = requestAnimationFrame(tick);
  wrap._heroAiCleanup = () => {
    wrap._heroAiRunning = false;
    if (State._heroAiWrap === wrap) State._heroAiWrap = null;
    stopHeroAiFx();
    ro?.disconnect();
  };
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

function getDashSelectedIds() {
  if (!(State.dashSelectedIds instanceof Set)) State.dashSelectedIds = new Set();
  return State.dashSelectedIds;
}

function clearDashSelection() {
  getDashSelectedIds().clear();
  State.dashLastSelectedId = null;
  syncDashSelectionUi();
}

function toggleDashSelection(id) {
  const ids = getDashSelectedIds();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  State.dashLastSelectedId = id;
  syncDashSelectionUi();
}

function selectDashRange(fromId, toId) {
  const list = filteredPresentations();
  const i1 = list.findIndex((p) => p.id === fromId);
  const i2 = list.findIndex((p) => p.id === toId);
  if (i1 < 0 || i2 < 0) {
    toggleDashSelection(toId);
    return;
  }
  const [a, b] = i1 < i2 ? [i1, i2] : [i2, i1];
  for (let i = a; i <= b; i += 1) getDashSelectedIds().add(list[i].id);
  State.dashLastSelectedId = toId;
  syncDashSelectionUi();
}

function syncDashSelectionUi() {
  const ids = getDashSelectedIds();
  const grid = $('#presentations-grid');
  grid?.querySelectorAll('.board-card').forEach((card) => {
    const on = ids.has(card.dataset.id);
    card.classList.toggle('is-selected', on);
    card.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const count = ids.size;
  const toolbar = $('.dash-toolbar');
  let bar = $('#dash-selection-bar');
  if (!count) {
    bar?.remove();
    toolbar?.classList.remove('has-selection');
    return;
  }
  toolbar?.classList.add('has-selection');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'dash-selection-bar';
    bar.className = 'dash-selection-bar';
    toolbar?.insertBefore(bar, toolbar.querySelector('.dash-search-wrap'));
  }
  bar.innerHTML = `
    <span class="dash-selection-count"><strong>${count}</strong> ausgewählt</span>
    <button type="button" class="btn-ghost dash-selection-clear" data-clear-selection><i class="fa-solid fa-xmark"></i> Aufheben</button>
    <button type="button" class="btn-danger dash-selection-delete" data-bulk-delete><i class="fa-solid fa-trash"></i> Löschen</button>`;
}

async function deletePresentationsByIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return;
  const n = unique.length;
  const desc = n === 1
    ? 'Die Präsentation und alle Folien werden dauerhaft entfernt.'
    : `${n} Präsentationen und alle zugehörigen Folien werden dauerhaft entfernt.`;
  if (!await lpConfirm({
    title: n === 1 ? 'Präsentation löschen?' : `${n} Präsentationen löschen?`,
    desc,
    okLabel: 'Löschen',
    variant: 'danger',
    icon: 'fa-trash',
  })) return;
  const { error } = await sb.from('lp_presentations').delete().in('id', unique);
  if (error) { toast(error.message, 'error'); return; }
  unique.forEach((id) => getDashSelectedIds().delete(id));
  if (!getDashSelectedIds().size) State.dashLastSelectedId = null;
  await loadPresentations();
  renderDashboard();
  toast(n === 1 ? 'Präsentation gelöscht' : `${n} Präsentationen gelöscht`, 'success');
}

function bindDashboardSelection() {
  if (State.dashSelectionBound) return;
  State.dashSelectionBound = true;

  const content = $('.dash-content');
  const toolbar = $('.dash-toolbar');
  if (!content) return;

  let marqueeEl = null;
  let marqueeActive = false;
  let cardDrag = null;
  let startX = 0;
  let startY = 0;
  let marqueeAdditive = false;
  let marqueeBase = new Set();
  const DRAG_THRESHOLD = 5;

  const beginMarquee = (clientX, clientY, additive) => {
    marqueeActive = true;
    startX = clientX;
    startY = clientY;
    marqueeAdditive = additive;
    marqueeBase = additive ? new Set(getDashSelectedIds()) : new Set();
    if (!additive) getDashSelectedIds().clear();
    marqueeEl = document.createElement('div');
    marqueeEl.className = 'dash-marquee';
    marqueeEl.setAttribute('aria-hidden', 'true');
    content.appendChild(marqueeEl);
    content.classList.add('dash-selecting');
  };

  const rectsIntersect = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

  const updateMarqueeSelection = (clientX, clientY) => {
    const contentRect = content.getBoundingClientRect();
    const scrollTop = content.scrollTop;
    const selRect = {
      left: Math.min(startX, clientX) - contentRect.left,
      top: Math.min(startY, clientY) - contentRect.top + scrollTop,
      right: Math.max(startX, clientX) - contentRect.left,
      bottom: Math.max(startY, clientY) - contentRect.top + scrollTop,
    };
    if (marqueeEl) {
      marqueeEl.style.left = `${selRect.left}px`;
      marqueeEl.style.top = `${selRect.top}px`;
      marqueeEl.style.width = `${selRect.right - selRect.left}px`;
      marqueeEl.style.height = `${selRect.bottom - selRect.top}px`;
    }
    const hitIds = new Set(marqueeBase);
    content.querySelectorAll('.board-card').forEach((card) => {
      const cr = card.getBoundingClientRect();
      const cardRect = {
        left: cr.left - contentRect.left,
        top: cr.top - contentRect.top + scrollTop,
        right: cr.right - contentRect.left,
        bottom: cr.bottom - contentRect.top + scrollTop,
      };
      if (rectsIntersect(selRect, cardRect)) hitIds.add(card.dataset.id);
    });
    State.dashSelectedIds = hitIds;
    syncDashSelectionUi();
  };

  content.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (!$('#screen-dashboard')?.classList.contains('active')) return;
    if (e.target.closest('.board-action-btn')) return;
    if (e.target.closest('#card-create')) return;
    if (e.target.closest('#dash-selection-bar')) return;

    const card = e.target.closest('.board-card');
    marqueeAdditive = e.metaKey || e.ctrlKey;
    if (card && !marqueeAdditive) {
      cardDrag = { x: e.clientX, y: e.clientY };
      return;
    }
    if (card && marqueeAdditive) return;

    beginMarquee(e.clientX, e.clientY, marqueeAdditive);
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (cardDrag && !marqueeActive) {
      const dx = Math.abs(e.clientX - cardDrag.x);
      const dy = Math.abs(e.clientY - cardDrag.y);
      if (dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD) {
        beginMarquee(cardDrag.x, cardDrag.y, false);
        cardDrag = null;
      } else {
        return;
      }
    }
    if (!marqueeActive) return;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) return;
    State.dashMarqueeDragging = true;
    updateMarqueeSelection(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', () => {
    cardDrag = null;
    if (!marqueeActive) return;
    marqueeActive = false;
    marqueeEl?.remove();
    marqueeEl = null;
    content.classList.remove('dash-selecting');
    setTimeout(() => { State.dashMarqueeDragging = false; }, 0);
  });

  toolbar?.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear-selection]')) {
      e.preventDefault();
      clearDashSelection();
      return;
    }
    if (e.target.closest('[data-bulk-delete]')) {
      e.preventDefault();
      void deletePresentationsByIds([...getDashSelectedIds()]);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!$('#screen-dashboard')?.classList.contains('active')) return;
    if (e.key === 'Escape' && getDashSelectedIds().size) {
      clearDashSelection();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && getDashSelectedIds().size) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      void deletePresentationsByIds([...getDashSelectedIds()]);
    }
  });
}

function renderDashboard() {
  const grid = $('#presentations-grid');
  if (!grid) return;
  const list = filteredPresentations();
  const selected = getDashSelectedIds();
  const visibleIds = new Set(list.map((p) => p.id));
  selected.forEach((id) => { if (!visibleIds.has(id)) selected.delete(id); });

  grid.innerHTML = `
    <div class="create-card" id="card-create"><i class="fa-solid fa-plus"></i><span>Neue Präsentation</span></div>
    ${list.map((p) => {
      const isSel = selected.has(p.id);
      return `
      <article class="board-card${isSel ? ' is-selected' : ''}" data-id="${p.id}" aria-selected="${isSel ? 'true' : 'false'}">
        <span class="board-select-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
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
      </article>`;
    }).join('')}`;
  grid.querySelector('#card-create')?.addEventListener('click', () => createPresentation());
  grid.querySelectorAll('.board-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.board-action-btn')) return;
      if (State.dashMarqueeDragging) { e.preventDefault(); return; }
      const id = card.dataset.id;
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta) {
        e.preventDefault();
        toggleDashSelection(id);
        return;
      }
      if (e.shiftKey && State.dashLastSelectedId) {
        e.preventDefault();
        selectDashRange(State.dashLastSelectedId, id);
        return;
      }
      if (getDashSelectedIds().size) clearDashSelection();
      openEditor(id);
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
      const title = await lpPrompt({ title: 'Präsentation umbenennen', label: 'Neuer Titel', value: p.title, okLabel: 'Speichern' });
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
      await deletePresentationsByIds([card.dataset.id]);
    });
  });
  syncDashSelectionUi();
  bindDashboardSelection();
}

async function createPresentation(templateKey) {
  const tpl = window.LP_TEMPLATES.find((t) => t.key === templateKey);
  const { data: pres, error } = await sb.from('lp_presentations').insert({
    owner_id: State.user.id,
    title: tpl?.name || 'Neue Präsentation',
    status: 'draft',
    settings: tpl?.slides?.length ? { workshop: { ...window.LP_WORKSHOP_SETTINGS } } : {},
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
    <button type="button" class="template-card${t.recommended ? ' template-card--rec' : ''}" data-key="${t.key}">
      ${t.recommended ? '<span class="template-rec">Empfohlen</span>' : ''}
      <h3>${esc(t.name)}</h3>
      <p class="template-tagline">${esc(t.tagline || t.desc || '')}</p>
      <div class="template-meta">
        <span><i class="fa-solid fa-clock"></i> ${esc(t.duration)}</span>
        <span><i class="fa-solid fa-users"></i> ${esc(t.group)}</span>
      </div>
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
  State.slides = normalizeSlides(slides);
  await stripWorkshopFeedbackSlides();
  if (presentationHasWorkshopFlow()) {
    const ws = getWorkshopSettings();
    await syncWorkshopSettingsToSlides({
      brainstormMaxResponses: ws.brainstormMaxResponses,
      trackVoteCount: ws.trackVoteCount,
      finalPriorityCount: ws.finalPriorityCount,
      pitchTimerSec: ws.pitchTimerSec,
    });
  }
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
  syncSimulationPill();
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
    if (!await lpConfirm({ title: 'Folie löschen?', desc: 'Diese Folie wird dauerhaft entfernt.', okLabel: 'Löschen', variant: 'danger', icon: 'fa-trash' })) return;
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
  const current = getPresentationSettings();
  const merged = { ...current, ...partial };
  if (partial.workshop) {
    merged.workshop = { ...(current.workshop || {}), ...partial.workshop };
  }
  State.presentation.settings = merged;
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

function pitchFmt(s) {
  const v = Math.max(0, s);
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
}

function buildPitchItemsList() {
  const items = [];
  const { byTrack } = aggregateAllTracksUseCases();
  let n = 0;
  byTrack.forEach((trk) => {
    trk.phases.forEach((p) => {
      p.items.forEach((item) => {
        n += 1;
        const author = getParticipantForDisplay(item.participant_id);
        items.push({
          n,
          id: item.id,
          text: item.text,
          trackLabel: trk.trackLabel || '',
          phase: p.phase || '',
          participant_id: item.participant_id || null,
          authorName: author?.display_name || item.authorName || 'Unbekannt',
        });
      });
    });
  });
  return items;
}

function getParticipantPitchItems() {
  if (State.participant && !State.user && Array.isArray(State.pitchItems) && State.pitchItems.length) {
    return State.pitchItems;
  }
  return buildPitchItemsList();
}

function computePitchRemainingFromSync(sync) {
  if (!sync) return 0;
  const base = Math.max(0, Number(sync.remaining) || 0);
  if (!sync.running) return base;
  const elapsed = Math.max(0, (Date.now() - (Number(sync.at) || Date.now())) / 1000);
  return Math.max(0, Math.floor(base - elapsed));
}

function broadcastPitchSessionData(slide) {
  if (!slide) return;
  const isPitch = slide.content?.sopKind === 'pitch-session' || slide.settings?.sopPitchSession;
  if (!isPitch) return;
  const items = buildPitchItemsList();
  const sig = items.map((i) => i.id).join(',');
  if (State._lastPitchItemsSig !== sig) State._lastPitchItemsSig = sig;
  State.pitchItems = items;
  const sync = State.pitchSync || null;
  const syncSig = sync ? `${sync.activeKey}:${sync.running}:${sync.remaining}:${sync.at}` : 'idle';
  const payloadSig = `${sig}|${syncSig}`;
  if (State._lastPitchBroadcastSig === payloadSig) return;
  State._lastPitchBroadcastSig = payloadSig;
  try {
    State.sessionChannel?.send({
      type: 'broadcast',
      event: 'session_sync',
      payload: { pitchItems: items, pitchSync: sync },
    });
  } catch {}
}

function pushPitchTimerSync(key) {
  const st = State.pitchTimers?.[key];
  if (!st) return;
  State.pitchSync = {
    activeKey: st.running ? key : null,
    remaining: Math.max(0, st.remaining ?? 0),
    running: !!st.running,
    total: st.total || 120,
    at: Date.now(),
  };
  State._lastPitchBroadcastSig = null;
  try {
    State.sessionChannel?.send({
      type: 'broadcast',
      event: 'session_sync',
      payload: { pitchSync: State.pitchSync },
    });
  } catch {}
}

function broadcastQuickWinItems(slide) {
  if (slide?.content?.sopKind !== 'next-steps' && !slide?.settings?.sopNextSteps) return;
  const items = getQuickWinMatrixUseCases();
  const sig = items.map((i) => i.id).join(',');
  if (State._lastQuickWinSig === sig) return;
  State._lastQuickWinSig = sig;
  State.quickWinItems = items;
  try {
    State.sessionChannel?.send({
      type: 'broadcast',
      event: 'session_sync',
      payload: { quickWinItems: items },
    });
  } catch {}
}

function getParticipantQuickWinItems() {
  if (State.participant && !State.user && Array.isArray(State.quickWinItems) && State.quickWinItems.length) {
    return State.quickWinItems;
  }
  return getQuickWinMatrixUseCases();
}

function stopParticipantPitchClock() {
  if (State.participantPitchPoll) {
    clearInterval(State.participantPitchPoll);
    State.participantPitchPoll = null;
  }
}

function updateParticipantPitchTimerDom() {
  const el = document.querySelector('.participant-pitch-focus-timer .participant-pitch-timer-val');
  if (!el || !State.pitchSync?.running) return;
  el.textContent = pitchFmt(computePitchRemainingFromSync(State.pitchSync));
  if (computePitchRemainingFromSync(State.pitchSync) <= 0) {
    el.closest('.participant-pitch-focus-timer')?.classList.add('is-done');
  }
}

function startParticipantPitchClock() {
  stopParticipantPitchClock();
  if (!State.participant || State.user) return;
  State.participantPitchPoll = setInterval(updateParticipantPitchTimerDom, 250);
}

function renderParticipantPitchCard(item, { focused = false, sync = null } = {}) {
  const author = getParticipantForDisplay(item.participant_id) || { display_name: item.authorName };
  const trackLine = [item.trackLabel, item.phase].filter(Boolean).join(' · ');
  const timerHtml = focused && sync
    ? `<div class="participant-pitch-focus-timer${sync.running ? ' is-running' : ''}${computePitchRemainingFromSync(sync) <= 0 && !sync.running ? ' is-done' : ''}" aria-live="polite">
        <span class="participant-pitch-timer-label"><i class="fa-solid fa-stopwatch"></i> Pitch-Timer</span>
        <span class="participant-pitch-timer-val">${pitchFmt(computePitchRemainingFromSync(sync))}</span>
      </div>`
    : '';
  return `<article class="participant-pitch-card${focused ? ' participant-pitch-card--focus' : ''}" data-pitch-id="${esc(item.id)}">
    <div class="participant-pitch-card-head">
      <span class="participant-pitch-num">${item.n}</span>
      ${trackLine ? `<span class="participant-pitch-track">${esc(trackLine)}</span>` : ''}
    </div>
    <div class="participant-pitch-text">${renderUseCaseDisplayHtml(item.text, 'full')}</div>
    <div class="participant-pitch-author">
      ${participantAvatarHtml(author, 'sm')}
      <span>Eingebracht von <strong>${esc(item.authorName || author.display_name || 'Unbekannt')}</strong></span>
    </div>
    ${timerHtml}
  </article>`;
}

function renderParticipantNextStepsHtml() {
  const items = getParticipantQuickWinItems();
  const actions = getNextStepActions();
  if (!items.length) {
    return `<div class="participant-nextsteps-empty"><i class="fa-solid fa-table-cells-large"></i><p>Quick Wins aus der Matrix erscheinen hier, sobald der Host sie pflegt.</p></div>`;
  }
  const statusLabel = (id) => NEXT_STEP_STATUSES.find((s) => s.id === id)?.label || 'Geplant';
  const cards = items.map((it, i) => {
    const a = { ...defaultNextStepAction(), ...(actions[it.id] || {}) };
    const meta = [it.trackLabel, it.phase].filter(Boolean).join(' · ');
    return `<article class="participant-ns-card">
      <div class="participant-ns-card-head">
        <span class="participant-ns-rank">${i + 1}</span>
        <span class="participant-ns-status ns-status ns-status--${esc(a.status || 'planned')}">${esc(statusLabel(a.status))}</span>
      </div>
      <div class="participant-ns-uc">${renderUseCaseDisplayHtml(it.text, 'full')}</div>
      ${meta ? `<div class="participant-ns-meta">${esc(meta)}</div>` : ''}
      <dl class="participant-ns-fields">
        <div class="participant-ns-field"><dt>Verantwortlich</dt><dd>${a.owner ? esc(a.owner) : '–'}</dd></div>
        <div class="participant-ns-field"><dt>Bis wann</dt><dd>${a.dueDate ? esc(formatNextStepDate(a.dueDate)) : '–'}</dd></div>
        <div class="participant-ns-field participant-ns-field--full"><dt>Nächster Schritt</dt><dd>${a.nextStep ? esc(a.nextStep) : '–'}</dd></div>
        ${a.notes ? `<div class="participant-ns-field participant-ns-field--full"><dt>Notiz</dt><dd>${esc(a.notes)}</dd></div>` : ''}
      </dl>
    </article>`;
  }).join('');
  return `<div class="participant-nextsteps-list">${cards}</div>`;
}

function renderParticipantGoalMatrixHtml(slide) {
  const c = slide?.content || {};
  const bodyParts = String(c.body || '').split(/\n\n+/).filter(Boolean);
  const bodyHtml = bodyParts.length
    ? `<div class="participant-goal-copy">${bodyParts.map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}</div>`
    : '';
  return `${bodyHtml}<div class="participant-matrix-intro-preview">${renderGoalMatrixPreview()}</div>`;
}

function renderAllTracksUseCasesWithAuthors(timerSec = 120) {
  const { byTrack } = aggregateAllTracksUseCases();
  if (!byTrack.length) return '<div class="present-wait-msg">Noch keine Use Cases gesammelt.</div>';
  let html = `<div class="ws-table ws-table--pitch">
    <div class="ws-row ws-row--head">
      <span class="ws-c-rank">#</span>
      <span class="ws-c-uc">Use Case</span>
      <span class="ws-c-author">Eingebracht von</span>
      <span class="ws-c-action">Pitch-Timer</span>
    </div>`;
  let n = 0;
  byTrack.forEach((trk) => {
    trk.phases.forEach((p) => {
      p.items.forEach((item) => {
        n += 1;
        const author = getParticipantForDisplay(item.participant_id);
        const authorName = author?.display_name || item.authorName || '–';
        html += `<div class="ws-row" data-pitch-row="${esc(item.id)}">
          <span class="ws-c-rank">${n}</span>
          <span class="ws-c-uc">
            <span class="ws-uc-text">${renderUseCaseDisplayHtml(item.text, 'full')}</span>
          </span>
          <span class="ws-c-author">${participantAvatarHtml(author || { display_name: authorName }, 'xs')}<span class="ws-author-name">${esc(authorName)}</span></span>
          <span class="ws-c-action ws-timer" data-pitch-key="${esc(item.id)}" data-total="${timerSec}">
            <span class="ws-time" aria-live="polite">${pitchFmt(getPitchTimerRemaining(item.id, timerSec))}</span>
            <button type="button" class="ws-timer-btn" data-pitch-toggle aria-label="Pitch-Timer starten / stoppen"><i class="fa-solid fa-play"></i></button>
          </span>
        </div>`;
      });
    });
  });
  html += '</div>';
  return html;
}

function getPitchTimerRemaining(key, total) {
  const st = State.pitchTimers?.[key];
  if (!st) return total;
  return Math.max(0, st.remaining ?? total);
}

function syncPitchTimerIntervals() {
  Object.values(State.pitchTimers || {}).forEach((st) => {
    if (st.interval) {
      clearInterval(st.interval);
      st.interval = null;
    }
  });
}

// Bindet pro Use Case einen eigenen Start/Stop-Countdown (überlebt Present-Re-Renders).
function bindPitchTimers(stage) {
  if (!State.pitchTimers) State.pitchTimers = {};
  const timers = stage?.querySelectorAll('.ws-timer[data-pitch-key]');
  if (!timers?.length) return;
  syncPitchTimerIntervals();
  timers.forEach((timerEl) => {
    const key = timerEl.dataset.pitchKey;
    const total = parseInt(timerEl.dataset.total, 10) || 120;
    const timeEl = timerEl.querySelector('.ws-time');
    const btn = timerEl.querySelector('[data-pitch-toggle]');
    if (!key || !timeEl || !btn) return;
    let st = State.pitchTimers[key];
    if (!st || st.total !== total) {
      st = { remaining: total, running: false, total, interval: null };
      State.pitchTimers[key] = st;
    }
    const setIcon = (name) => { btn.innerHTML = `<i class="fa-solid ${name}"></i>`; };
    const paint = () => {
      timeEl.textContent = pitchFmt(Math.max(0, st.remaining));
      timerEl.classList.toggle('is-running', !!st.running);
      timerEl.classList.toggle('is-done', st.remaining <= 0 && !st.running);
      setIcon(st.running ? 'fa-stop' : (st.remaining <= 0 ? 'fa-rotate-left' : 'fa-play'));
    };
    const halt = () => {
      if (st.interval) { clearInterval(st.interval); st.interval = null; }
      st.running = false;
      paint();
    };
    const start = () => {
      Object.entries(State.pitchTimers || {}).forEach(([k, o]) => {
        if (k !== key && o?.running) {
          if (o.interval) { clearInterval(o.interval); o.interval = null; }
          o.running = false;
        }
      });
      if (st.remaining <= 0) {
        st.remaining = total;
        timerEl.classList.remove('is-done');
      }
      st.running = true;
      paint();
      st.interval = setInterval(() => {
        st.remaining -= 1;
        timeEl.textContent = pitchFmt(Math.max(0, st.remaining));
        if (st.remaining <= 0) {
          halt();
          timerEl.classList.add('is-done');
          setIcon('fa-rotate-left');
          pushPitchTimerSync(key);
        }
      }, 1000);
    };
    btn.onclick = () => {
      if (st.running) halt();
      else start();
      pushPitchTimerSync(key);
    };
    if (st.running && !st.interval) {
      st.interval = setInterval(() => {
        st.remaining -= 1;
        timeEl.textContent = pitchFmt(Math.max(0, st.remaining));
        if (st.remaining <= 0) {
          halt();
          timerEl.classList.add('is-done');
          setIcon('fa-rotate-left');
          pushPitchTimerSync(key);
        }
      }, 1000);
    }
    paint();
  });
}

function renderParticipantPitchHtml() {
  const items = getParticipantPitchItems();
  if (!items.length) {
    return `<div class="participant-pitch-empty"><p>Noch keine Use Cases gesammelt.</p></div>`;
  }
  const sync = State.pitchSync;
  const activeId = sync?.running && sync.activeKey ? sync.activeKey : null;
  if (activeId) {
    const item = items.find((i) => i.id === activeId);
    if (item) {
      return `<div class="participant-pitch-list participant-pitch-list--focus">
        <p class="participant-pitch-hint participant-pitch-hint--live"><i class="fa-solid fa-microphone"></i> Jetzt am Pitch: Use Case ${item.n}</p>
        ${renderParticipantPitchCard(item, { focused: true, sync })}
      </div>`;
    }
  }
  const cards = items.map((item) => renderParticipantPitchCard(item)).join('');
  return `<div class="participant-pitch-list">
    <p class="participant-pitch-hint"><i class="fa-solid fa-person-chalkboard"></i> Pitch-Runde — ${items.length} Use Cases · wer pitcht welchen?</p>
    ${cards}
  </div>`;
}

// Split-View: beide SOPs nebeneinander auf Track-Intro + Brainstorm bis zur Gesamt-Priorisierung.
function supportsSopSplit(slide) {
  if (!isDualSopParallelWorkshop() || isFinaleSlide(slide)) return false;
  if (slide?.settings?.sopAllTracksVote || slide?.settings?.sopDualHiddenNav) return false;
  const k = slide?.content?.sopKind;
  if (k === 'dual-pair-orient' || k === 'dual-pair-collect') return true;
  const c = slide?.content || {};
  if (slide?.slide_type === 'brainstorm' && (c.sopGroup === 'internal' || c.sopGroup === 'consulting')) return true;
  if (slide?.slide_type === 'section' && c.sopKind === 'track' && c.sopGroup) return true;
  return false;
}

function shouldUseSopSplit(slide) {
  return supportsSopSplit(slide);
}

function shouldUseDualSopWideStage(slide) {
  if (!isDualSopWorkshop() || !slide) return false;
  if (isFinaleSlide(slide)) return false;
  const c = slide.content || {};
  if (shouldUseSopSplit(slide)) return true;
  if (c.sopKind === 'dual-pair-collect' || c.sopKind === 'dual-pair-orient') return true;
  if (c.sopGroup && (slide.slide_type === 'brainstorm' || (slide.slide_type === 'section' && c.sopTrackClass))) {
    return true;
  }
  return false;
}

function applyPresentStageLayout(stage, slide, { splitOn = false } = {}) {
  if (!stage) return;
  const wide = shouldUseDualSopWideStage(slide);
  const singleSop = wide && !splitOn && !!slide?.content?.sopGroup;
  const body = document.body;
  body.classList.toggle('sop-split-stage', splitOn);
  body.classList.toggle('sop-single-sop-stage', singleSop);
  body.classList.toggle('dual-sop-wide-stage', wide);
  stage.dataset.splitOn = splitOn ? '1' : '';
}

function clearPresentStageLayout(stage) {
  if (!stage) return;
  document.body.classList.remove('sop-split-stage', 'sop-single-sop-stage', 'dual-sop-wide-stage');
  stage.classList.remove('ws-hero-present-stage', 'ws-closing-present-stage');
  stage.dataset.splitOn = '';
}

function bindPresentParticipantAssign() {
  if (document.body.dataset.sopAssignBound) return;
  document.body.dataset.sopAssignBound = '1';
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sop-assign]');
    if (!btn) return;
    e.preventDefault();
    void assignParticipantSopGroup(btn.dataset.participantId, btn.dataset.sopAssign);
  });
}

function finalizePresentUi(slide) {
  updatePresentToolbarUi(slide);
  bindResultsDisplayToggle($('#present-stage'));
  maybeLaunchResultsConfetti(slide);
  maybeLaunchClosingCelebration(slide);
  bindPitchTimers($('#present-stage'));
  bindPresentParticipantAssign();
  if (slide?.content?.sopKind === 'next-steps' || slide?.settings?.sopNextSteps) {
    bindNextStepsActionLog($('#present-stage'));
  }
  if (isWorkshopOpeningSlide(slide)) initHeroAiFx($('#present-stage'));
  else stopHeroAiFx();
  if (isWorkshopClosingSlide(slide)) initClosingAiFx($('#present-stage'));
  else stopClosingAiFx();
  initSopBoardAutoScroll($('#present-stage'));
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
  if (slide.slide_type === 'content' && c.sopKind === 'dual-pair-orient') {
    canvas.classList.remove('is-centered');
    const meta = getSlideShellMeta(slide);
    const chips = [{ icon: 'fa-table-columns', label: 'Parallel' }, { icon: 'fa-map', label: `Track ${(getDualSopPairIndex(slide) || 0) + 1}` }];
    canvas.innerHTML = `${wrapSlide(renderWsSlideShell({
      ...meta, title: c.title, chips, lead: getWsPresentLead(slide), main: renderDualPairOrientSplitView(slide),
    }), State.slides.findIndex((s) => s.id === slide.id))}<div class="canvas-hint"><i class="fa-solid fa-eye"></i> Split-View im Präsentationsmodus · SOP-Boards aus Track-Daten</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (isBrainstormCollectSlide(slide)) {
    canvas.classList.remove('is-centered');
    if (shouldUseSopSplit(slide)) {
      const meta = getSlideShellMeta(slide);
      canvas.innerHTML = `${wrapSlide(renderWsSlideShell({
        ...meta,
        title: getWsPresentTitle(slide),
        chips: getWsPresentChips(slide),
        lead: getWsPresentLead(slide),
        main: renderBrainstormSplitViz(slide),
      }), State.slides.findIndex((s) => s.id === slide.id))}<div class="canvas-hint"><i class="fa-solid fa-eye"></i> Split-View · SOP-Boards + Live-Eingaben</div>`;
    } else {
      canvas.innerHTML = `${wrapSlide(renderWorkshopCardCollectHtml(c, true), State.slides.findIndex((s) => s.id === slide.id))}${renderEditorUseCaseFieldsPreviewHtml()}<div class="canvas-hint"><i class="fa-solid fa-pen"></i> Freitext sammeln · Teilnehmer füllen drei Felder aus${hasCollectChain(slide) ? ' · Ranking & Ergebnis folgen automatisch' : ''}</div>`;
    }
    bindCanvasInlineEdit();
    return;
  }
  if (shouldUseVoteWorkshopUi(slide)) {
    canvas.classList.remove('is-centered');
    const max = slide.settings?.brainstormVoteMax || slide.settings?.slideAttachVoteMax || slide.settings?.sopVoteMax || slide.content?.maxSelections || 2;
    canvas.innerHTML = `${renderWorkshopModeBadge('decide')}
      <div class="canvas-editable canvas-title pslide-q-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>
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
      <div class="canvas-editable canvas-title pslide-q-title" contenteditable="true" data-field="title">${esc(c.title || '')}</div>
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
    canvas.innerHTML = `${renderClosingSlideHtml(c, true)}
      <div class="canvas-hint"><i class="fa-solid fa-champagne-glasses"></i> Abschlussfolie · Celebration-Layout im Present-Modus</div>`;
    bindCanvasInlineEdit();
    return;
  }
  if (slide.slide_type === 'content' && (c.isHeroSlide || c.sopKind || c.sopTrackResults || c.sopKind === 'card-results') && c.sopKind !== 'dual-pair-orient') {
    const html = isWorkshopClosingSlide(slide)
      ? renderClosingSlideHtml(c, true)
      : (c.isHeroSlide ? renderHeroSlideHtml(c, true) : renderSopContentHtml(c, true));
    if (html) {
      canvas.classList.toggle('is-centered', isWorkshopClosingSlide(slide) || isWorkshopOpeningSlide(slide) || useCenteredLayout(slide));
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
    <div class="canvas-editable canvas-title ${c.isQuestionSlide ? 'pslide-q-title' : ''}" contenteditable="true" data-field="title" data-placeholder="Titel…">${esc(c.title || c.prompt || 'Folie')}</div>
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

// Lesbarer Folientyp (Icon + Label) für Editor-Anzeige
function editorSlideTypeMeta(slide) {
  if (!slide) return { icon: 'fa-file', label: 'Folie' };
  const t = slide.slide_type;
  if (slide.settings?.presentationResults) return { icon: 'fa-chart-column', label: 'Session-Ergebnis' };
  if (slide.settings?.presentationClosing) return { icon: 'fa-heart', label: 'Abschlussfolie' };
  if (slide.settings?.sopAllTracksMatrix || t === 'priority_matrix') return { icon: 'fa-table-cells-large', label: 'Priorisierungs-Matrix' };
  if (isBrainstormCollectSlide(slide)) return { icon: 'fa-lightbulb', label: 'Brainstorming · Sammeln' };
  if (shouldUseVoteWorkshopUi(slide)) return { icon: 'fa-square-check', label: 'Priorisierung · Abstimmung' };
  if (isCardResultsSlide?.(slide) || isSlideResultsLinkedSlide?.(slide)) return { icon: 'fa-trophy', label: 'Ergebnis-Folie' };
  const meta = (window.LP_SLIDE_TYPES || []).find((x) => x.type === t);
  if (meta) return { icon: meta.icon, label: meta.label };
  return { icon: 'fa-file', label: t || 'Folie' };
}

// Optionen für die Matrix-Quellfolien-Auswahl (vorausgehende Sammel-Folien)
function brainstormSourceOptionsHtml(matrixSlide, selectedId) {
  const idx = (State.slides || []).findIndex((s) => s.id === matrixSlide.id);
  const opts = [];
  (State.slides || []).forEach((s, i) => {
    if (i >= idx) return;
    if (!['brainstorm', 'open', 'wordcloud'].includes(s.slide_type)) return;
    const label = (s.content?.title || s.slide_type) + ` (Folie ${i + 1})`;
    opts.push(`<option value="${esc(s.id)}" ${s.id === selectedId ? 'selected' : ''}>${esc(label)}</option>`);
  });
  if (!opts.length) return '<option value="">— keine Brainstorm-Folie davor —</option>';
  return '<option value="">— automatisch (nächste davor) —</option>' + opts.join('');
}

function renderEditorProps() {
  const slide = currentSlide();
  panel = $('#editor-props');
  if (!slide) { panel.innerHTML = ''; return; }
  const c = { ...defaultStyle(), ...slide.content };
  const s = { ...window.LP_DEFAULT_SETTINGS, ...slide.settings };

  let optionsHtml = '';
  if (OPTION_TYPES.has(slide.slide_type)) {
    const sopScope = getVoteSlideScope(slide);
    const isSopScoped = !!sopScope && sopScope.kind !== 'brainstorm';
    const importOn = isBrainstormVoteSlide(slide);
    const canImport = slide.slide_type === 'mc_multi' || slide.slide_type === 'mc_single';

    if (isSopScoped) {
      // SOP-Vorlage: Optionen automatisch aus den Brainstorming-Folien der
      // Phase/des Tracks — Logik im Editor sichtbar (read-only).
      const scopeLabel = sopScope.kind === 'phase' ? `der Phase „${esc(sopScope.phaseName || '')}"`
        : sopScope.kind === 'track' ? 'dieses Tracks'
          : sopScope.kind === 'card' ? `der Karte „${esc(sopScope.cardName || '')}"`
            : 'aller Tracks';
      const isAllTracks = sopScope.kind === 'all-tracks';
      const voteMaxLabel = isAllTracks
        ? 'Anzahl Top Use Cases (→ Matrix)'
        : 'Max. Auswahl pro Person';
      const wsFinal = getWorkshopSettings().finalPriorityCount || 10;
      optionsHtml = `
      <div class="props-section">Antwortoptionen · importiert</div>
      <p class="props-hint"><i class="fa-solid fa-link"></i> Auswahloptionen werden automatisch aus den Brainstorming-Folien ${scopeLabel} übernommen. Mit <strong>„Live-Ergebnisse"</strong> erscheint nach dem Ausfüllen das Leaderboard.</p>
      <div class="props-label">${voteMaxLabel}</div><input id="prop-sop-vote-max" type="number" min="1" max="30" value="${sopScope.maxSelections || wsFinal}" />
      ${isAllTracks ? '<p class="props-hint"><i class="fa-solid fa-circle-info"></i> Entspricht der Workshop-Einstellung oben. Jede Person wählt so viele Favoriten; die meistgewählten Use Cases dieser Anzahl wandern in die Impact/Effort-Matrix.</p>' : ''}`;
    } else {
      const importCtrl = canImport ? `
      <label class="props-toggle-row"><input type="checkbox" id="prop-import-brainstorm" ${importOn ? 'checked' : ''}><span><i class="fa-solid fa-link"></i> Optionen aus Brainstorming-Folie importieren</span></label>
      <div id="prop-import-src-wrap" style="${importOn ? '' : 'display:none'}">
        <div class="props-label">Quell-Brainstorming</div>
        <select id="prop-import-src">${brainstormSourceOptionsHtml(slide, c.brainstormSourceId)}</select>
        <div class="props-label">Max. Auswahl pro Person</div><input id="prop-import-max" type="number" min="1" max="10" value="${s.brainstormVoteMax || c.maxSelections || 3}" />
        <p class="props-hint"><i class="fa-solid fa-trophy"></i> Optionen = gesammelte Ideen der Quell-Folie. „Live-Ergebnisse" zeigt nach dem Ausfüllen das Leaderboard.</p>
      </div>` : '';
      const manualHtml = importOn ? '' : `
      ${(c.options || []).map((o, i) => `
        <div class="option-row">
          <input type="color" class="opt-color" data-opt="color" data-idx="${i}" value="${esc(o.color || c.accentColor || '#206efb')}" title="Farbe" />
          <input data-opt="text" data-idx="${i}" value="${esc(o.text)}" placeholder="Optionstext" />
          ${slide.slide_type === 'quiz' ? `<label class="opt-correct" title="Richtig"><input type="checkbox" data-opt="correct" data-idx="${i}" ${o.correct ? 'checked' : ''} /></label>` : ''}
          <button type="button" class="opt-rm" data-rm-opt="${i}"><i class="fa-solid fa-xmark"></i></button>
        </div>`).join('')}
      <button type="button" class="btn-secondary btn-sm" id="btn-add-option"><i class="fa-solid fa-plus"></i> Option</button>
      ${slide.slide_type === 'mc_multi' ? `<div class="props-label">Max. Auswahl</div><input id="prop-max-sel" type="number" min="1" value="${c.maxSelections || 3}" />` : ''}`;
      optionsHtml = `
      <div class="props-section">Antwortoptionen</div>
      ${importCtrl}${manualHtml}`;
    }
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

  // ─── Priorisierungs-Matrix-Konfiguration ───
  let matrixPropsHtml = '';
  if (slide.slide_type === 'priority_matrix') {
    const isSopMatrix = !!s.sopAllTracksMatrix;
    const src = c.matrixSource || 'auto';
    const manualText = (c.manualItems || []).map((t) => (typeof t === 'string' ? t : (t.text || ''))).join('\n');
    const q = (k, fb) => esc((c.quadrants && c.quadrants[k] && c.quadrants[k].label) || fb);
    const hasFinalVote = (State.slides || []).some((sl) => sl.settings?.sopAllTracksVote);
    const mxCount = s.sopMatrixCount || getWorkshopSettings().finalPriorityCount || 10;
    matrixPropsHtml = `
    <div class="props-section">Priorisierungs-Matrix</div>
    ${isSopMatrix ? `
    <p class="props-hint"><i class="fa-solid fa-link"></i> Diese Matrix übernimmt automatisch die <strong>final priorisierten Top Use Cases</strong> des SOP-Workshops.</p>
    ${hasFinalVote
      ? '<p class="props-hint"><i class="fa-solid fa-circle-info"></i> Die Anzahl folgt der Workshop-Einstellung „Use Cases in finale Priorisierung & Matrix".</p>'
      : `<div class="props-label">Anzahl Use Cases in der Matrix</div><input id="prop-mx-count" type="number" min="1" max="30" value="${mxCount}" />`}
    ` : `
    <div class="props-label">Use Cases beziehen aus</div>
    <select id="prop-mx-source">
      <option value="auto" ${src === 'auto' ? 'selected' : ''}>Automatisch · vorherige Brainstorm-Folie</option>
      <option value="brainstorm" ${src === 'brainstorm' ? 'selected' : ''}>Bestimmte Brainstorm-Folie</option>
      <option value="manual" ${src === 'manual' ? 'selected' : ''}>Manuelle Liste</option>
    </select>
    <div id="prop-mx-srcid-wrap" style="${src === 'brainstorm' ? '' : 'display:none'}">
      <div class="props-label">Quell-Folie</div>
      <select id="prop-mx-srcid">${brainstormSourceOptionsHtml(slide, c.brainstormSourceId)}</select>
    </div>
    <div id="prop-mx-manual-wrap" style="${src === 'manual' ? '' : 'display:none'}">
      <div class="props-label">Items · eine Zeile = ein Use Case</div>
      <textarea id="prop-mx-items" rows="5" placeholder="Use Case A&#10;Use Case B&#10;Use Case C">${esc(manualText)}</textarea>
    </div>
    <p class="props-hint"><i class="fa-solid fa-circle-info"></i> Bei „Automatisch" muss <strong>vor</strong> dieser Folie eine Brainstorm- oder Offene-Frage-Folie liegen — deren Antworten werden zu Matrix-Items.</p>`}
    <div class="props-label">Achsenbeschriftung</div>
    <div class="props-row-2"><input id="prop-mx-yaxis" value="${esc(c.yAxisLabel || 'Impact')}" placeholder="Y-Achse (vertikal)" /><input id="prop-mx-xaxis" value="${esc(c.xAxisLabel || 'Aufwand')}" placeholder="X-Achse (horizontal)" /></div>
    <div class="props-label">Quadranten (Namen)</div>
    <input id="prop-mx-qw" value="${q('qw', 'Quick Win')}" placeholder="hoher Impact · niedriger Aufwand" style="margin-bottom:.4rem" />
    <input id="prop-mx-sb" value="${q('sb', 'Strategic Bet')}" placeholder="hoher Impact · hoher Aufwand" style="margin-bottom:.4rem" />
    <input id="prop-mx-ts" value="${q('ts', 'Time Sink')}" placeholder="niedriger Impact · hoher Aufwand" style="margin-bottom:.4rem" />
    <input id="prop-mx-dr" value="${q('dr', 'Drop')}" placeholder="niedriger Impact · niedriger Aufwand" />`;
  }

  // ─── Sammel-Limits (Brainstorm / Offen / Wortwolke) ───
  let collectLimitsHtml = '';
  if (['brainstorm', 'open', 'wordcloud'].includes(slide.slide_type)) {
    collectLimitsHtml = `
    <div class="props-section">Eingabe-Limits</div>
    <div class="props-row-2">
      <div><div class="props-label">Max. Antworten / Person</div><input id="prop-max-responses" type="number" min="0" value="${Number(c.maxResponsesPerUser || s.responseLimit || 0)}" placeholder="0 = ∞" /></div>
      <div><div class="props-label">Zeichenlimit</div><input id="prop-char-limit" type="number" min="0" value="${Number(c.charLimit || 0)}" placeholder="0 = aus" /></div>
    </div>
    <p class="props-hint"><i class="fa-solid fa-circle-info"></i> 0 = keine Begrenzung.</p>`;
  }

  let workshopSettingsHtml = '';
  if (presentationHasWorkshopFlow()) {
    const ws = getWorkshopSettings();
    workshopSettingsHtml = `
    <div class="props-section">Workshop-Einstellungen</div>
    <p class="props-hint" style="margin-top:0">Gilt für finale Priorisierung, Impact/Effort-Matrix und Next Steps dieser Vorlage.</p>
    <div class="props-label">Use Cases in finale Priorisierung & Matrix</div>
    <input id="prop-ws-final-count" type="number" min="1" max="30" value="${ws.finalPriorityCount || 10}" />
    <p class="props-hint"><i class="fa-solid fa-circle-info"></i> So viele Use Cases werden am Ende priorisiert und in die Matrix übernommen. Aus der Matrix gehen nur Quick Wins in die Next Steps.</p>
    <div class="props-row-2">
      <div><div class="props-label">Top N je Track (Zwischen-Vote)</div><input id="prop-ws-track-count" type="number" min="1" max="15" value="${ws.trackVoteCount || 3}" /></div>
      <div><div class="props-label">Pitch-Timer (Sek.)</div><input id="prop-ws-pitch-sec" type="number" min="15" max="600" step="15" value="${ws.pitchTimerSec || 120}" /></div>
    </div>
    <div class="props-row-2">
      <div><div class="props-label">Max. Use Cases pro Person (Sammeln)</div><input id="prop-ws-max-responses" type="number" min="1" max="10" value="${ws.brainstormMaxResponses || 2}" /></div>
      <div><div class="props-label">Sammelzeit (Sek., 0 = aus)</div><input id="prop-ws-time-limit" type="number" min="0" value="${ws.brainstormTimeLimitSec ?? 300}" /></div>
    </div>`;
  }

  const _typeMeta = editorSlideTypeMeta(slide);
  panel.innerHTML = `
    <div class="props-head">
      <span class="props-head-type"><i class="fa-solid ${_typeMeta.icon}"></i> ${esc(_typeMeta.label)}</span>
      <button type="button" class="btn-ghost props-close-mobile" id="props-close-mobile"><i class="fa-solid fa-xmark"></i></button>
    </div>
    ${workshopSettingsHtml}
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
    ${matrixPropsHtml}
    ${collectLimitsHtml}
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
      // Body nur bei nicht-interaktiven Inhalts-/SOP-Folien aus dem Prompt-Feld
      // spiegeln. Bei interaktiven Folien (Brainstorm, Offen, MC …) ist das
      // Prompt-Feld die Frage — sonst landet die Frage doppelt in body+prompt.
      body: (['content', 'section'].includes(slideObj.slide_type)
        || (slideObj.content.sopKind && !(window.LP_INTERACTIVE_TYPES || new Set()).has(slideObj.slide_type)))
        ? ($('#prop-prompt')?.value || slideObj.content.body)
        : slideObj.content.body,
      imageUrl: $('#prop-image')?.value ?? slideObj.content.imageUrl,
      min: Number($('#prop-min')?.value ?? slideObj.content.min ?? 1),
      max: Number($('#prop-max')?.value ?? slideObj.content.max ?? 10),
      minLabel: $('#prop-min-label')?.value ?? slideObj.content.minLabel,
      maxLabel: $('#prop-max-label')?.value ?? slideObj.content.maxLabel,
      maxSelections: Number($('#prop-max-sel')?.value ?? slideObj.content.maxSelections ?? 3),
    };
    // ── Priorisierungs-Matrix-Felder ──
    if (slideObj.slide_type === 'priority_matrix') {
      if ($('#prop-mx-count')) slideObj.settings.sopMatrixCount = Number($('#prop-mx-count').value || getWorkshopSettings().finalPriorityCount || 10);
      if ($('#prop-mx-source')) slideObj.content.matrixSource = $('#prop-mx-source').value;
      if ($('#prop-mx-srcid')) slideObj.content.brainstormSourceId = $('#prop-mx-srcid').value || null;
      if ($('#prop-mx-items')) {
        slideObj.content.manualItems = $('#prop-mx-items').value.split('\n').map((l) => l.trim()).filter(Boolean);
      }
      if ($('#prop-mx-yaxis')) slideObj.content.yAxisLabel = $('#prop-mx-yaxis').value;
      if ($('#prop-mx-xaxis')) slideObj.content.xAxisLabel = $('#prop-mx-xaxis').value;
      const qd = slideObj.content.quadrants || {
        qw: { label: 'Quick Win', icon: '🚀', desc: 'hoher Impact · niedriger Aufwand' },
        sb: { label: 'Strategic Bet', icon: '⭐', desc: 'hoher Impact · hoher Aufwand' },
        ts: { label: 'Time Sink', icon: '🔧', desc: 'niedriger Impact · hoher Aufwand' },
        dr: { label: 'Drop', icon: '❌', desc: 'niedriger Impact · niedriger Aufwand' },
      };
      ['qw', 'sb', 'ts', 'dr'].forEach((k) => {
        const el = $(`#prop-mx-${k}`);
        if (el && qd[k]) qd[k] = { ...qd[k], label: el.value };
      });
      slideObj.content.quadrants = qd;
    }
    // ── Sammel-Limits (Brainstorm/Offen/Wortwolke) ──
    if (['brainstorm', 'open', 'wordcloud'].includes(slideObj.slide_type)) {
      const maxResponses = Number($('#prop-max-responses')?.value || 0);
      slideObj.content.maxResponsesPerUser = maxResponses;
      if (maxResponses > 0) {
        slideObj.settings.responseLimit = maxResponses;
        slideObj.settings.multipleResponses = maxResponses > 1;
      }
      if ($('#prop-char-limit')) slideObj.content.charLimit = Number($('#prop-char-limit').value || 0);
    }
    // ── mc_multi/mc_single: Optionen aus Brainstorming importieren ──
    if ($('#prop-import-brainstorm')) {
      const on = $('#prop-import-brainstorm').checked;
      slideObj.settings.brainstormVote = on;
      if (on) {
        let src = $('#prop-import-src')?.value || '';
        if (!src) { const prev = findPrecedingCollectSlide(slideObj); src = prev?.id || ''; }
        slideObj.content.brainstormSourceId = src || null;
        slideObj.settings.brainstormVoteMax = Number($('#prop-import-max')?.value || 3);
      } else {
        slideObj.content.brainstormSourceId = null;
      }
    }
    // ── SOP-Vote: Max. Auswahl pro Person ──
    if ($('#prop-sop-vote-max')) slideObj.settings.sopVoteMax = Number($('#prop-sop-vote-max').value || 3);
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

  const saveWorkshopSettings = debounce(async () => {
    if (!State.presentation || !$('#prop-ws-final-count')) return;
    const ws = getWorkshopSettings();
    const next = {
      brainstormTimeLimitSec: Math.max(0, Number($('#prop-ws-time-limit')?.value ?? ws.brainstormTimeLimitSec ?? 300)),
      brainstormMaxResponses: Math.max(1, Number($('#prop-ws-max-responses')?.value ?? ws.brainstormMaxResponses ?? 2)),
      trackVoteCount: Math.min(15, Math.max(1, Number($('#prop-ws-track-count')?.value ?? ws.trackVoteCount ?? 3))),
      finalPriorityCount: Math.min(30, Math.max(1, Number($('#prop-ws-final-count')?.value ?? ws.finalPriorityCount ?? 10))),
      pitchTimerSec: Math.max(15, Number($('#prop-ws-pitch-sec')?.value ?? ws.pitchTimerSec ?? 120)),
    };
    await persistPresentationSettings({ workshop: next });
    await syncWorkshopSettingsToSlides({
      finalPriorityCount: next.finalPriorityCount,
      trackVoteCount: next.trackVoteCount,
      pitchTimerSec: next.pitchTimerSec,
      brainstormMaxResponses: next.brainstormMaxResponses,
    });
    renderEditorCanvas();
    toast('Workshop-Einstellungen gespeichert', 'success');
  }, 650);

  panel.querySelectorAll('input,textarea,select').forEach((el) => {
    if (el.id?.startsWith('prop-ws-')) {
      el.addEventListener('input', saveWorkshopSettings);
      el.addEventListener('change', saveWorkshopSettings);
      return;
    }
    el.addEventListener('input', saveContent);
    el.addEventListener('change', saveContent);
  });
  // Matrix-Quelle: Sichtbarkeit der Unterfelder umschalten + Canvas aktualisieren
  $('#prop-mx-source')?.addEventListener('change', () => {
    const v = $('#prop-mx-source').value;
    const srcWrap = $('#prop-mx-srcid-wrap');
    const manWrap = $('#prop-mx-manual-wrap');
    if (srcWrap) srcWrap.style.display = v === 'brainstorm' ? '' : 'none';
    if (manWrap) manWrap.style.display = v === 'manual' ? '' : 'none';
    saveContent();
    setTimeout(renderEditorCanvas, 60);
  });
  // Optionen aus Brainstorming importieren: Toggle → speichern + Panel neu aufbauen
  // (blendet manuelle Optionen aus/ein) + Canvas-Vorschau aktualisieren
  $('#prop-import-brainstorm')?.addEventListener('change', async () => {
    const on = $('#prop-import-brainstorm').checked;
    const slideObj = currentSlide();
    if (!slideObj) return;
    slideObj.settings.brainstormVote = on;
    if (on) {
      let src = $('#prop-import-src')?.value || '';
      if (!src) { const prev = findPrecedingCollectSlide(slideObj); src = prev?.id || ''; }
      slideObj.content.brainstormSourceId = src || null;
      slideObj.settings.brainstormVoteMax = Number($('#prop-import-max')?.value || slideObj.content.maxSelections || 3);
    } else {
      slideObj.content.brainstormSourceId = null;
    }
    await persistSlide(slideObj);
    renderEditorProps();
    renderEditorCanvas();
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
  grid.querySelectorAll('.type-card').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      // Spezialfolien (Session-Ergebnis / Abschluss) direkt ein-/ausschalten.
      if (type === 'presentation_results' || type === 'presentation_closing') {
        closeModal('modal-add-slide');
        await togglePresentationClosureCard(type);
        return;
      }
      // Reguläre Folie mit sinnvollen Defaults hinzufügen — alle weiteren
      // Einstellungen macht der Nutzer danach in der rechten Seitenleiste.
      const base = JSON.parse(JSON.stringify(window.LP_DEFAULT_CONTENT[type] || { title: 'Neu' }));
      const settings = { ...window.LP_DEFAULT_SETTINGS };
      const content = { ...defaultStyle(), ...base };
      if (type === 'section') content.layout = 'center';
      else if (type === 'content') content.layout = 'default';
      const { data } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: State.slides.length,
        slide_type: type,
        content,
        settings,
      }).select().single();
      State.slides.push(data);
      State.selectedSlideId = data.id;
      closeModal('modal-add-slide');
      renderEditor();
    });
  });
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
  if (!ver) return;
  if (!await lpConfirm({ title: 'Version wiederherstellen?', desc: 'Die aktuellen Folien werden durch diese Version ersetzt.', okLabel: 'Ersetzen', variant: 'warning', icon: 'fa-clock-rotate-left' })) return;
  const snap = ver.snapshot;
  const oldIds = State.slides.map((s) => s.id);
  const rows = (snap.slides || []).map((s, i) => ({
    presentation_id: State.presentation.id,
    sort_order: i,
    slide_type: s.slide_type,
    content: s.content,
    settings: s.settings || { ...window.LP_DEFAULT_SETTINGS },
  }));
  // Erst neue Folien einfuegen, dann alte loeschen — schlaegt der Insert fehl, bleibt die Praesentation intakt.
  const { data: inserted, error: insErr } = await sb.from('lp_slides').insert(rows).select('*');
  if (insErr || !inserted) { toast('Wiederherstellung fehlgeschlagen – nichts geaendert', 'error'); return; }
  if (oldIds.length) await sb.from('lp_slides').delete().in('id', oldIds);
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
  State.showPresentCode = true;
  syncPresentCodeBar(true);
  renderPresentParticipants();
  renderPresent();
  bindPresentToolbar();
  void renderQrCode();
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
  State.participants = normalizeParticipantsList(participants || []);
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
// DEBUG SIMULATOR — simulierte Teilnehmer & Antworten für Tests
// ════════════════════════════════════════════════════════════════

function resolveSimUseCasesForSlide(slide) {
  const c = slide?.content || {};
  const byPhase = window.LP_DEBUG_PHASE_USE_CASES || {};
  const generic = window.LP_SIM_GENERIC_USE_CASES || [];
  const phaseName = c.sopPhaseName || '';

  if (phaseName && byPhase[phaseName]?.length) return byPhase[phaseName];

  const trackKey = c.sopTrackClass || c.sopTrackKey;
  if (c.sopKind === 'track-collect' && trackKey) {
    const tracks = [
      ...(window.SOP_TOOL_TRACKS || []),
      ...(window.MARKETING_SOP_TRACKS || []),
      ...(window.INTERNAL_SOP_TRACKS || []),
    ];
    const track = tracks.find((t) => t.class === trackKey);
    if (track?.phases?.length) {
      const merged = track.phases.flatMap((p) => byPhase[p.name] || []).filter(Boolean);
      if (merged.length) {
        const seed = String(slide.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
        return merged.slice(seed % merged.length).concat(merged.slice(0, seed % merged.length)).slice(0, 6);
      }
    }
  }

  if (c.title && byPhase[c.title]?.length) return byPhase[c.title];

  if (!generic.length) return [];
  const seed = String(slide.id).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const offset = seed % generic.length;
  return generic.slice(offset).concat(generic.slice(0, offset)).slice(0, 6);
}

// Eindeutigkeits-Schlüssel eines simulierten Use Case = normalisierte "Use Case Idee".
// So gelten zwei Einträge mit gleicher Idee (auch bei abweichendem Feature/Abhängigkeit)
// als Dublette und werden in der Simulation nie doppelt vergeben.
function simUseCaseKey(text) {
  return parseUseCaseParts(text).summary.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Globaler Pool aller verfügbaren Sim-Use-Cases (alle Phasen + generische), dedupliziert.
// Dient als Nachschub, falls die folienspezifische Liste durch bereits vergebene
// Use Cases zu klein wird.
function buildGlobalSimUseCasePool() {
  const byPhase = window.LP_DEBUG_PHASE_USE_CASES || {};
  const generic = window.LP_SIM_GENERIC_USE_CASES || [];
  const pool = [];
  const seen = new Set();
  const add = (t) => {
    const k = simUseCaseKey(t);
    if (!k || seen.has(k)) return;
    seen.add(k);
    pool.push(t);
  };
  Object.values(byPhase).forEach((list) => (list || []).forEach(add));
  generic.forEach(add);
  return pool;
}

// Erzeugt aus einem Use Case eine eindeutige Variante, indem die "Use Case Idee"
// um einen Kontext-Zusatz (Phase/Track) ergänzt wird. Wird nur genutzt, wenn der
// Pool einzigartiger Use Cases erschöpft ist — so entstehen nie wörtliche Dubletten.
function makeUseCaseVariant(text, suffix) {
  const parts = parseUseCaseParts(text);
  if (!parts.hasParts) return `${text} (${suffix})`;
  const summary = `${parts.summary} (${suffix})`;
  return [summary, parts.feature, parts.dependencies].filter(Boolean).join(' | ');
}

// Wählt für eine Brainstorm-Folie ausschließlich Use Cases, deren Idee in dieser
// Session noch NICHT vergeben wurde. Reicht die folienspezifische Liste nicht aus
// (weil viele Einträge bereits anderswo benutzt wurden), wird aus dem globalen Pool
// aufgefüllt. Ist auch dieser erschöpft, werden kontextualisierte Varianten gebildet.
// `usedKeys` wird dabei fortgeschrieben (Session-weite Eindeutigkeit).
function pickUniqueSimUseCases(slide, usedKeys, globalPool, targetCount, contextLabel = '') {
  const resolved = resolveSimUseCasesForSlide(slide);
  const target = Math.max(1, targetCount || resolved.length);
  const chosen = [];
  const take = (text) => {
    const k = simUseCaseKey(text);
    if (!k || usedKeys.has(k)) return false;
    usedKeys.add(k);
    chosen.push(text);
    return true;
  };
  resolved.forEach((t) => { if (chosen.length < target) take(t); });
  if (chosen.length < target) {
    globalPool.forEach((t) => { if (chosen.length < target) take(t); });
  }
  // Pool erschöpft → eindeutige Varianten mit Kontext-Suffix bilden.
  if (chosen.length < target && globalPool.length) {
    const ctx = String(contextLabel || 'Variante').trim() || 'Variante';
    let round = 2;
    while (chosen.length < target) {
      let progressed = false;
      for (const base of globalPool) {
        if (chosen.length >= target) break;
        const suffix = round > 2 ? `${ctx} ${round}` : ctx;
        if (take(makeUseCaseVariant(base, suffix))) progressed = true;
      }
      round += 1;
      if (!progressed && round > 50) break; // Sicherheitsnetz gegen Endlosschleife
    }
  }
  return chosen;
}

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
    this.ensureAllParticipants();
    this.prepareResponses();
    this.dripNextParticipant();
    this.schedule(() => this.catchUpDripsThrough(State.session?.current_slide_index || 0), 400);
    try { toast(`🧪 Simulation gestartet — simulierte Teilnehmer joinen zeitversetzt`, 'info'); } catch {}
  },

  stop() {
    this.active = false;
    if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
    this.pendingTimers.forEach((t) => clearTimeout(t));
    this.pendingTimers = [];
  },

  schedule(fn, ms) {
    const scaled = Math.max(35, ms / this.speed);
    const t = setTimeout(() => {
      this.pendingTimers = this.pendingTimers.filter((x) => x !== t);
      if (this.active) fn();
    }, scaled);
    this.pendingTimers.push(t);
    return t;
  },

  ensureAllParticipants() {
    const defs = simParticipantDefs();
    const sessionId = State.session?.id;
    defs.forEach((p, idx) => pushSimParticipant(simParticipantRecord(idx, sessionId, p)));
  },

  ensureDebugParticipant(fakeP) {
    const m = String(fakeP || '').match(/^debug-p-(\d+)-/);
    if (!m) return;
    const idx = Number(m[1]);
    const defs = window.LP_DEBUG_PARTICIPANTS || [];
    const sessionId = State.session?.id;
    if (!sessionId) return;
    pushSimParticipant(simParticipantRecord(idx, sessionId, defs[idx]));
  },

  // ─── Teilnehmer drip-by-drip joinen lassen ──────────────────
  dripNextParticipant() {
    if (!this.active) return;
    const defs = simParticipantDefs();
    if (this.joinIdx >= defs.length) return;
    const p = defs[this.joinIdx];
    const sessionId = State.session?.id;
    const fake = pushSimParticipant(simParticipantRecord(this.joinIdx, sessionId, p));
    if (fake) {
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
    const defs = simParticipantDefs();
    const sessionId = State.session?.id;
    const now = Date.now();
    function pseudoRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

    // First pass: brainstorm slides — Use Cases im Instruktions-Format (Use Case | Feature | Abhängigkeiten)
    // Session-weite Eindeutigkeit: jede Use-Case-Idee wird in der gesamten Simulation
    // nur EINMAL vergeben — kein Teilnehmer und keine Folie bekommt eine Dublette.
    const allCollected = [];
    const usedUseCaseKeys = new Set();
    const globalSimPool = buildGlobalSimUseCasePool();
    State.slides.forEach((slide) => {
      if (slide.slide_type !== 'brainstorm') return;
      const c = slide.content || {};
      // Parallel-Vorlage: die sichtbare Sammel-Anker-Folie (dual-pair-collect) ist NICHT
      // der echte Sammel-Bucket — Teilnehmer schreiben in die versteckten Gruppen-Folien.
      // Daher hier überspringen, sonst entstünden doppelte/phantom Use Cases.
      if (c.sopKind === 'dual-pair-collect') return;
      const phaseName = c.sopPhaseName || c.title || '';
      const responseLimit = getCollectResponseLimit(slide);
      // Wie viele Use Cases passen realistisch auf diese Folie?
      const designed = resolveSimUseCasesForSlide(slide).length;
      const capacity = responseLimit > 0 ? defs.length * responseLimit : designed;
      const targetCount = Math.max(1, Math.min(designed || capacity, capacity));
      const contextLabel = c.sopPhaseName || c.sopTrackLabel || c.title || '';
      const useCases = pickUniqueSimUseCases(slide, usedUseCaseKeys, globalSimPool, targetCount, contextLabel);
      if (!useCases.length) return;
      const queue = [];
      const perParticipantCount = new Map();
      useCases.forEach((text, i) => {
        const pIdx = i % defs.length;
        const fakeP = `debug-p-${pIdx}-${sessionId}`;
        const pDef = defs[pIdx] || {};
        const sent = perParticipantCount.get(fakeP) || 0;
        if (responseLimit > 0 && sent >= responseLimit) return;
        perParticipantCount.set(fakeP, sent + 1);
        // Sicherstellen, dass der (simulierte) Autor in State.participants existiert —
        // sonst hätten Use Cases von noch nicht "beigetretenen" Teilnehmern keinen Autor.
        pushSimParticipant(simParticipantRecord(pIdx, sessionId, pDef));
        const respId = `debug-r-${slide.id}-${i}`;
        const response = {
          id: respId,
          session_id: sessionId,
          slide_id: slide.id,
          participant_id: fakeP,
          response: { text, _author: pDef.name },
          is_hidden: false,
          created_at: new Date(now + i * 100).toISOString(),
          updated_at: new Date(now + i * 100).toISOString(),
        };
        // Drip-Delay (Collect wird ohnehin per flushCollectSlide fast eingespielt)
        const delayMs = 250 + i * (180 + Math.random() * 120);
        queue.push({ response, delayMs });
        allCollected.push({
          slideId: slide.id,
          respId,
          text,
          phaseName,
          participantId: fakeP,
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
          if (st.sopCardVote || st.sopPhaseVote || st.sopTrackVote || st.brainstormVote || st.sopAllTracksVote) {
            const max = st.sopVoteMax || c.maxSelections || 2;
            let scopedCollected = st.sopTrackVote
              ? allCollected.filter((it) => it.trackKey === (c.sopTrackKey || c.sopTrackClass))
              : st.sopPhaseVote
                ? allCollected.filter((it) => it.trackKey === (c.sopTrackKey || c.sopTrackClass) && it.phaseName === c.sopPhaseName)
              : allCollected;
            // Fair Vote (wie echte Teilnehmer): nicht für eigene Use Cases stimmen.
            if (st.sopFairVote) scopedCollected = scopedCollected.filter((it) => it.participantId !== fakeP);
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
          if (st.sopAllTracksVote || st.sopTrackVote || st.sopPhaseVote) {
            const scopedCollected = st.sopTrackVote
              ? allCollected.filter((it) => it.trackKey === (c.sopTrackKey || c.sopTrackClass))
              : st.sopPhaseVote
                ? allCollected.filter((it) => it.trackKey === (c.sopTrackKey || c.sopTrackClass) && it.phaseName === c.sopPhaseName)
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
          queue.push({
            delayMs: 1000 + idx * (1400 + Math.random() * 1500),
            buildMatrix: { slideId: slide.id, fakeP, respId, participantIdx: idx },
          });
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

  buildSimMatrixResponse(slide, fakeP, respId, participantIdx) {
    const st = slide.settings || {};
    const quadrants = ['qw', 'sb', 'ts', 'dr'];
    const weights = [0.4, 0.3, 0.15, 0.15];
    function pseudoRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
    const mxCount = getFinalMatrixItemCount(slide);
    const allowTrackFallback = !getFinalAllTracksVoteSlide();
    const topItems = resolveFinalPriorityTopN(mxCount, { allowTrackFallback });
    if (!topItems.length) return null;
    const matrix = {};
    const meta = {};
    topItems.forEach((it, i) => {
      const r = pseudoRandom(participantIdx * 31 + i + String(respId).length);
      let acc = 0;
      let picked = 'qw';
      for (let q = 0; q < quadrants.length; q++) {
        acc += weights[q];
        if (r <= acc) { picked = quadrants[q]; break; }
      }
      matrix[it.id] = picked;
      meta[it.id] = { text: it.text, phase: it.phase, trackLabel: it.trackLabel };
    });
    if (!Object.keys(matrix).length) return null;
    const now = Date.now();
    return {
      id: respId,
      session_id: State.session?.id,
      slide_id: slide.id,
      participant_id: fakeP,
      response: { matrix, meta },
      is_hidden: false,
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString(),
    };
  },

  resolveQueueItemResponse(item, slide) {
    if (item.response) return item.response;
    if (item.buildMatrix && slide) {
      const { fakeP, respId, participantIdx } = item.buildMatrix;
      return this.buildSimMatrixResponse(slide, fakeP, respId, participantIdx);
    }
    return null;
  },

  ensureParticipantAndPush(item, slide, attempt = 0) {
    const response = this.resolveQueueItemResponse(item, slide);
    if (!response) return;
    this.ensureDebugParticipant(response.participant_id);
    if (!State.participants.find((p) => p.id === response.participant_id) && attempt < 8) {
      this.schedule(() => this.ensureParticipantAndPush(item, slide, attempt + 1), 250);
      return;
    }
    this.pushResponse(response);
  },

  flushCollectSlide(slide) {
    if (!slide || this.triggeredSlides.has(slide.id)) return;
    const queue = this.responsesBySlide.get(slide.id);
    if (!queue?.length) return;
    this.triggeredSlides.add(slide.id);
    const step = Math.max(12, 50 / this.speed);
    queue.forEach((item, i) => {
      if (!item.response) return;
      this.schedule(() => this.pushResponse(item.response), i * step);
    });
  },

  startSlideDrip(slide, baseOffset = 0) {
    if (!slide || this.triggeredSlides.has(slide.id)) return baseOffset;
    const queue = this.responsesBySlide.get(slide.id);
    if (!queue?.length) return baseOffset;
    this.triggeredSlides.add(slide.id);
    let maxEnd = baseOffset;
    queue.forEach((item, i) => {
      const when = baseOffset + (item.delayMs != null ? item.delayMs : i * 220);
      maxEnd = Math.max(maxEnd, when);
      this.schedule(() => this.ensureParticipantAndPush(item, slide), when);
    });
    return maxEnd + Math.max(80, 250 / this.speed);
  },

  catchUpDripsThrough(index) {
    if (!this.active || !Array.isArray(State.slides)) return;
    const end = Math.max(0, Math.min(index, State.slides.length - 1));
    const seen = [];
    for (let i = 0; i <= end; i++) seen.push(State.slides[i]);
    const isCollect = (s) => ['brainstorm', 'open', 'wordcloud'].includes(s.slide_type);
    const isVote = (s) => Boolean(
      s.settings?.sopAllTracksVote || s.settings?.sopTrackVote || s.settings?.sopPhaseVote
      || s.settings?.sopCardVote || s.settings?.brainstormVote
    );
    const isMatrix = (s) => Boolean(s.settings?.sopAllTracksMatrix || s.slide_type === 'priority_matrix');
    seen.filter(isCollect).forEach((slide) => this.flushCollectSlide(slide));
    let offset = Math.max(40, 120 / this.speed);
    const dripWaves = [
      seen.filter(isVote),
      seen.filter((s) => !isCollect(s) && !isVote(s) && !isMatrix(s)),
      seen.filter(isMatrix),
    ];
    dripWaves.forEach((wave) => {
      if (!wave.length) return;
      let waveEnd = offset;
      wave.forEach((slide) => { waveEnd = Math.max(waveEnd, this.startSlideDrip(slide, offset)); });
      offset = waveEnd + Math.max(80, 200 / this.speed);
    });
  },

  // ─── Drip-Funktion: läuft, wenn Host zu einem Slide wechselt ──
  maybeDripCurrentSlide() {
    if (!this.active) return;
    this.catchUpDripsThrough(State.session?.current_slide_index || 0);
  },

  pushResponse(response) {
    // Dedupe
    if (State.responses.find((r) => r.id === response.id)) return;
    State.responses.push(response);
    try { maybeRefreshMatrixBroadcastFromVote(response); } catch {}
    try { maybeRefreshVoteBroadcastFromResponse(response); } catch {}
    try { if (response.participant_id) pushPresentActivity(response.participant_id); } catch {}
    try {
      const p = State.participants.find((x) => x.id === response.participant_id);
      liveDebugLog('info', `[SIM] ${p?.display_name || 'Bot'} → ${responseSummary(response)} (lokal, kein DB-Write)`);
    } catch {}
    try { updatePresentStats(); } catch {}
    try { renderPresent(); } catch {}
  },

  setSpeed(s) {
    this.speed = Math.max(0.25, Math.min(10, Number(s) || 1));
    console.info(`[DebugSim] Speed = ${this.speed}x`);
    if (!this.active) return;
    this.pendingTimers.forEach((t) => clearTimeout(t));
    this.pendingTimers = [];
    const doneIds = new Set(
      (State.responses || []).filter((r) => String(r.id).startsWith('debug-r-')).map((r) => r.id)
    );
    this.triggeredSlides = new Set();
    this.responsesBySlide.forEach((queue, slideId) => {
      const slide = State.slides.find((sl) => sl.id === slideId);
      const allDone = queue.every((item) => {
        const resp = item.response || this.resolveQueueItemResponse(item, slide);
        return resp && doneIds.has(resp.id);
      });
      if (allDone && queue.length) this.triggeredSlides.add(slideId);
    });
    this.catchUpDripsThrough(State.session?.current_slide_index || 0);
  },

  // Sofort-Modus: alles auf einmal (für QA-Sprung)
  flushAll() {
    this.ensureAllParticipants();
    this.responsesBySlide.forEach((queue, slideId) => {
      this.triggeredSlides.add(slideId);
      const slide = State.slides.find((s) => s.id === slideId);
      queue.forEach((item) => {
        const response = this.resolveQueueItemResponse(item, slide);
        if (response && !State.responses.find((r) => r.id === response.id)) {
          State.responses.push(response);
          try { maybeRefreshMatrixBroadcastFromVote(response); } catch {}
          try { maybeRefreshVoteBroadcastFromResponse(response); } catch {}
        }
      });
    });
    const defs = simParticipantDefs();
    const sessionId = State.session?.id;
    defs.forEach((p, idx) => pushSimParticipant(simParticipantRecord(idx, sessionId, p)));
    this.joinIdx = defs.length;
    if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
    try { renderPresentParticipants(); updatePresentStats(); renderPresent(); } catch {}
    const matrixSlide = getMatrixSlide();
    if (matrixSlide) broadcastMatrixItems(matrixSlide);
    const curVoteSlide = currentSessionSlide();
    if (curVoteSlide && isVoteBroadcastSlide(curVoteSlide)) broadcastVoteOptions(curVoteSlide);
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
      <i class="fa-solid fa-grip-vertical lp-dbg-grip" title="Verschieben"></i>
      <span class="lp-dbg-badge"><i class="fa-solid fa-flask"></i></span>
      <span class="lp-dbg-title">Simulation</span>
      <button class="lp-debug-collapse" id="lp-dbg-collapse" title="Ein-/Ausblenden"><i class="fa-solid fa-chevron-up"></i></button>
    </div>
    <div class="lp-debug-body">
      <div class="lp-debug-row"><span>Status:</span><strong id="lp-dbg-status">aktiv</strong></div>
      <div class="lp-debug-row"><span>Teilnehmer:</span><strong id="lp-dbg-participants">0</strong></div>
      <div class="lp-debug-row" style="gap:.4rem"><span>Sim-Anzahl:</span>
        <input id="lp-dbg-pcount" type="number" min="1" max="${(window.LP_DEBUG_PARTICIPANTS || []).length || 12}" value="${Math.max(1, Math.min((window.LP_DEBUG_PARTICIPANTS || []).length || 12, Number(window.LP_SIM_PARTICIPANT_COUNT) || 6))}" style="width:3.4rem" />
      </div>
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
  // Sim-Teilnehmerzahl live ändern → Simulation neu starten (sauberer Reset).
  const pCountEl = panel.querySelector('#lp-dbg-pcount');
  if (pCountEl) {
    pCountEl.onchange = () => {
      const max = (window.LP_DEBUG_PARTICIPANTS || []).length || 12;
      const n = Math.max(1, Math.min(max, Number(pCountEl.value) || 6));
      pCountEl.value = n;
      window.LP_SIM_PARTICIPANT_COUNT = n;
      window.LP_resetDebug?.();
      window.LP_seedDebug?.();
    };
  }
  // Collapse-Toggle: speichert Status in localStorage
  const applyCollapse = (collapsed) => {
    panel.classList.toggle('collapsed', collapsed);
    const icon = panel.querySelector('#lp-dbg-collapse i');
    if (icon) icon.className = collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
    try { localStorage.setItem('lp_dbg_collapsed', collapsed ? '1' : '0'); } catch {}
  };
  applyCollapse(localStorage.getItem('lp_dbg_collapsed') === '1');
  panel.querySelector('#lp-dbg-collapse').onclick = () => applyCollapse(!panel.classList.contains('collapsed'));

  // ─── Gespeicherte Position wiederherstellen ───
  try {
    const pos = JSON.parse(localStorage.getItem('lp_dbg_pos') || 'null');
    if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
      panel.style.left = Math.max(0, Math.min(pos.left, window.innerWidth - 80)) + 'px';
      panel.style.top = Math.max(0, Math.min(pos.top, window.innerHeight - 60)) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }
  } catch {}

  // ─── Drag & Drop über den Kopf ───
  const head = panel.querySelector('.lp-debug-panel-head');
  let drag = null;
  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#lp-dbg-collapse')) return;
    const rect = panel.getBoundingClientRect();
    drag = { offX: e.clientX - rect.left, offY: e.clientY - rect.top, moved: false, sx: e.clientX, sy: e.clientY };
    head.setPointerCapture(e.pointerId);
    panel.classList.add('lp-dbg-dragging');
  });
  head.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
    const left = Math.max(0, Math.min(e.clientX - drag.offX, window.innerWidth - panel.offsetWidth));
    const top = Math.max(0, Math.min(e.clientY - drag.offY, window.innerHeight - 40));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });
  const endDrag = (e) => {
    if (!drag) return;
    panel.classList.remove('lp-dbg-dragging');
    try { head.releasePointerCapture(e.pointerId); } catch {}
    if (drag.moved) {
      const rect = panel.getBoundingClientRect();
      try { localStorage.setItem('lp_dbg_pos', JSON.stringify({ left: rect.left, top: rect.top })); } catch {}
    } else if (panel.classList.contains('collapsed')) {
      applyCollapse(false); // Klick (ohne Bewegung) im collapsed-Zustand → ausklappen
    }
    drag = null;
  };
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);
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
  const prevAssign = State.participant?.id
    ? State.session.settings?.dualSopAssignments?.[State.participant.id]
    : null;
  // Presenter→Teilnehmer: aufgelöste Matrix-Items übernehmen
  if (patch && patch.matrixItems && typeof patch.matrixItems === 'object') {
    State.matrixItemsBySlide = { ...(State.matrixItemsBySlide || {}), ...patch.matrixItems };
  }
  // Presenter→Teilnehmer: gebroadcastete Vote-Optionen übernehmen
  if (patch && patch.voteOptions && typeof patch.voteOptions === 'object') {
    State.voteOptionsBySlide = { ...(State.voteOptionsBySlide || {}), ...patch.voteOptions };
  }
  if (patch && Array.isArray(patch.pitchItems)) {
    State.pitchItems = patch.pitchItems;
  }
  if (patch && patch.pitchSync && typeof patch.pitchSync === 'object') {
    State.pitchSync = patch.pitchSync;
  }
  if (patch && Array.isArray(patch.quickWinItems)) {
    State.quickWinItems = patch.quickWinItems;
  }
  const { matrixItems, voteOptions, pitchItems, pitchSync, quickWinItems, ...rest } = patch || {};
  if (rest.settings) {
    rest.settings = { ...(State.session.settings || {}), ...rest.settings };
  }
  State.session = { ...State.session, ...rest };
  const newAssign = State.participant?.id
    ? State.session.settings?.dualSopAssignments?.[State.participant.id]
    : null;
  if (State.participant && newAssign && newAssign !== prevAssign && newAssign !== State.sopAssignSeen) {
    State.sopAssignSeen = newAssign;
    showSopAssignCelebration(newAssign);
  }
  const slide = State.slides?.[State.session.current_slide_index || 0];
  if (patch?.settings?.nextStepActions && slide && (slide.content?.sopKind === 'next-steps' || slide.settings?.sopNextSteps)) {
    if (State.participant) syncParticipantNextStepsDom();
  }
}

// Teilnehmer: Broadcast-Updates ohne Voll-Re-Render (verhindert Flackern bei Timer/Data-Sync).
function syncParticipantPitchFocusFromSync(prevSync) {
  const prevKey = prevSync?.running ? prevSync.activeKey : null;
  const newKey = State.pitchSync?.running ? State.pitchSync.activeKey : null;
  updateParticipantPitchTimerDom();
  if (prevKey !== newKey) void renderParticipantQuestion();
}

function syncParticipantNextStepsDom() {
  const block = document.querySelector('.participant-nextsteps-block .ws-body-inner, .participant-nextsteps-block .participant-nextsteps-list');
  if (!block) {
    void renderParticipantQuestion();
    return;
  }
  const hostSlide = State.slides[State.session?.current_slide_index || 0];
  if (!hostSlide) return;
  const inner = block.closest('.participant-nextsteps-block');
  if (!inner) return;
  const shell = inner.querySelector('.ws-body-inner');
  if (shell) shell.innerHTML = renderParticipantNextStepsHtml();
}

function participantVoteOptionsMountSig(voteOptions) {
  if (!voteOptions || typeof voteOptions !== 'object') return '';
  return Object.keys(voteOptions).sort().map((slideId) => {
    const groups = voteOptions[slideId] || [];
    const ids = groups.map((g) => (g.options || []).map((o) => o.id).join(',')).join('|');
    return `${slideId}:${ids}`;
  }).join(';');
}

function isParticipantVoteSelectionSlide(slide) {
  if (!slide || !State.participant || State.user) return false;
  if (hasAnsweredSlide(slide)) return false;
  return isVoteBroadcastSlide(slide);
}

function participantVoteSelectionKey(slide, slideIndex) {
  return `${slide?.id || 'x'}:${slideIndex}`;
}

function participantHasVoteSelectionDom(root) {
  return Boolean(root?.querySelector('.track-vote-grouped .track-vote-option--pick, .track-vote-grouped .track-vote-option--own'));
}

function shouldKeepParticipantVoteDom(hostSlide, slideIndex, root) {
  if (!isParticipantVoteSelectionSlide(hostSlide)) return false;
  if (State._participantVoteMountKey !== participantVoteSelectionKey(hostSlide, slideIndex)) return false;
  return participantHasVoteSelectionDom(root);
}

function shouldSkipParticipantBroadcastRender(payload, prevIndex, prevOpen) {
  if (!payload || State.session.current_slide_index !== prevIndex || State.session.question_open !== prevOpen) {
    return false;
  }
  const hostSlide = State.slides[State.session.current_slide_index || 0];
  const root = $('#participant-root');
  if (isParticipantOpeningHeroSlide(hostSlide)
      && !payload.voteOptions && !payload.matrixItems && !payload.pitchItems
      && payload.current_slide_index === undefined && payload.question_open === undefined) {
    return true;
  }
  if (isParticipantClosingHeroSlide(hostSlide)
      && !payload.voteOptions && !payload.matrixItems && !payload.pitchItems
      && payload.current_slide_index === undefined && payload.question_open === undefined) {
    return true;
  }
  if (isParticipantVoteSelectionSlide(hostSlide) && participantHasVoteSelectionDom(root)) {
    if (payload.voteOptions) {
      const sig = participantVoteOptionsMountSig(payload.voteOptions);
      if (State._participantVoteOptionsSig === sig) return true;
      State._participantVoteOptionsSig = sig;
      return true;
    }
    if (!payload.current_slide_index && payload.question_open === undefined && !payload.matrixItems && !payload.pitchItems) {
      return true;
    }
  }
  if (payload.pitchSync && !payload.pitchItems && !payload.voteOptions && !payload.matrixItems && !payload.quickWinItems && !payload.settings) {
    return true;
  }
  if (payload.pitchItems && !payload.pitchSync && !payload.voteOptions && !payload.matrixItems && !payload.settings) {
    return true;
  }
  if (payload.voteOptions) {
    const sig = participantVoteOptionsMountSig(payload.voteOptions);
    if (State._participantVoteOptionsSig === sig) return true;
    State._participantVoteOptionsSig = sig;
    if (participantHasActiveInput()) return true;
    if (participantHasVoteSelectionDom(root)) return true;
    return false;
  }
  if (payload.matrixItems) {
    const sig = JSON.stringify(payload.matrixItems);
    if (State._participantMatrixItemsSig === sig) return true;
    State._participantMatrixItemsSig = sig;
    if (participantHasActiveInput()) return true;
    return false;
  }
  if (payload.settings?.nextStepActions) {
    return true;
  }
  if (payload.quickWinItems) {
    const sig = JSON.stringify(payload.quickWinItems);
    if (State._participantQuickWinSig === sig) return true;
    State._participantQuickWinSig = sig;
    return true;
  }
  return false;
}

function handleParticipantBroadcastPayload(payload, { prevIndex, prevOpen } = {}) {
  if (!payload) return;
  const prevPitchSync = State.pitchSync ? { ...State.pitchSync } : null;
  applySessionPatch(payload);
  if (State.session.status === 'ended') {
    handleParticipantSessionEnd();
    return;
  }
  if (shouldSkipParticipantBroadcastRender(payload, prevIndex, prevOpen)) {
    if (payload.pitchSync) syncParticipantPitchFocusFromSync(prevPitchSync);
    if (payload.settings?.nextStepActions) syncParticipantNextStepsDom();
    return;
  }
  void renderParticipantQuestion();
}

function showSopAssignCelebration(group) {
  const meta = getSopGroupMeta(group);
  if (!meta) return;
  document.querySelector('.sop-assign-celebration')?.remove();
  const el = document.createElement('div');
  el.className = `sop-assign-celebration sop-assign-celebration--${group}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="sop-assign-celebration-card">
      <div class="sop-assign-celebration-icon"><i class="fa-solid ${meta.icon}"></i></div>
      <p class="sop-assign-celebration-kicker">Du bist dabei!</p>
      <h2 class="sop-assign-celebration-title">${esc(meta.label)}</h2>
      <p class="sop-assign-celebration-text">Der Host hat dich diesem SOP zugewiesen. Ab jetzt siehst du nur deine Tracks — bis Pitch, Priorisierung und Matrix gemeinsam laufen.</p>
      <button type="button" class="sop-assign-celebration-close">Los geht's</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));
  launchResultsConfetti(2600);
  const close = () => {
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 350);
  };
  el.querySelector('.sop-assign-celebration-close')?.addEventListener('click', close);
  setTimeout(close, 5200);
}

// Presenter: aufgelöste Matrix-Items an Teilnehmer broadcasten (nur bei Änderung)
function broadcastMatrixItems(slide, { force = false } = {}) {
  if (!slide) return;
  const isMatrix = slide.slide_type === 'priority_matrix' || slide.settings?.sopAllTracksMatrix;
  if (!isMatrix) return;
  const count = getFinalMatrixItemCount(slide);
  const allowTrackFallback = !getFinalAllTracksVoteSlide();
  let items = resolveFinalPriorityTopN(count, { allowTrackFallback });
  items = assertMatrixItemsIntegrity(items, slide, { count });
  const sig = slide.id + ':' + items.map((i) => i.id).join(',');
  if (!force && State._lastMatrixSig === sig) return;
  State._lastMatrixSig = sig;
  if (!items.length) {
    invalidateMatrixItemsCache(slide.id);
    return;
  }
  State.matrixItemsBySlide = { ...(State.matrixItemsBySlide || {}), [slide.id]: items };
  try { State.sessionChannel?.send({ type: 'broadcast', event: 'session_sync', payload: { matrixItems: { [slide.id]: items } } }); } catch {}
}

// Presenter: aufgelöste Vote-Optionen (gruppiert, inkl. participant_id für FairVote)
// an Teilnehmer broadcasten — analog zu broadcastMatrixItems. Damit sehen Teilnehmer
// dieselben Use Cases wie der Beamer, auch wenn ihre lokale Antwortliste leer ist
// (Simulation oder reduzierte Sichtbarkeit).
function isVoteBroadcastSlide(slide) {
  const st = slide?.settings || {};
  return !!(st.sopAllTracksVote || st.sopTrackVote || st.sopPhaseVote || st.sopCardVote || st.brainstormVote);
}

function broadcastVoteOptions(slide) {
  if (!slide || !isVoteBroadcastSlide(slide)) return;
  const groups = getTrackVoteOptionsGrouped(slide) || [];
  const clean = groups
    .map((g) => ({
      phase: g.phase || '',
      card: g.card || '',
      options: (g.options || [])
        .filter((o) => o && o.id && o.id !== 'none' && o.text)
        .map((o) => ({ id: o.id, text: o.text, participant_id: o.participant_id || null })),
    }))
    .filter((g) => g.options.length);
  const sig = slide.id + ':' + clean.map((g) => g.options.map((o) => o.id).join(',')).join('|');
  if (State._lastVoteSig === sig) return;
  State._lastVoteSig = sig;
  if (!clean.length) return;
  State.voteOptionsBySlide = { ...(State.voteOptionsBySlide || {}), [slide.id]: clean };
  try { State.sessionChannel?.send({ type: 'broadcast', event: 'session_sync', payload: { voteOptions: { [slide.id]: clean } } }); } catch {}
}

function maybeRefreshVoteBroadcastFromResponse(response) {
  if (!response) return;
  const cur = currentSessionSlide();
  if (cur && isVoteBroadcastSlide(cur)) broadcastVoteOptions(cur);
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
  syncParticipantMobileActionBar();
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

// ─── LIVE-DEBUG-TERMINAL (Hover über „Live"-Badge im Präsentations-Header) ───
// Zeigt in Echtzeit, ob Teilnehmer-Antworten in Supabase ankommen (= gespeichert)
// und meldet Verbindungs-/Realtime-Fehler.
function liveDebugLog(kind, msg) {
  if (!State.liveDebugLog) State.liveDebugLog = [];
  State.liveDebugLog.push({ t: Date.now(), kind, msg });
  if (State.liveDebugLog.length > 120) State.liveDebugLog = State.liveDebugLog.slice(-120);
  renderLiveTerminal();
}

function setLiveConn(state, note) {
  State.liveConn = state; // 'live' | 'warn' | 'err'
  if (note) liveDebugLog(state === 'err' ? 'err' : 'info', note);
  else renderLiveTerminal();
}

function responseSummary(r) {
  const resp = r?.response || {};
  if (resp.text) return `„${String(resp.text).slice(0, 44)}${String(resp.text).length > 44 ? '…' : ''}"`;
  if (Array.isArray(resp.values)) return `${resp.values.length} Stimme(n)`;
  if (resp.matrix) return `${Object.keys(resp.matrix).length} Einordnung(en)`;
  if (resp.points) return 'Punkte verteilt';
  if (resp.order) return 'Ranking';
  if (resp.pin) return 'Pin gesetzt';
  if (resp.emoji) return resp.emoji;
  if (resp.value !== undefined && resp.value !== null) return `Wert ${esc(String(resp.value))}`;
  return 'Antwort';
}

function renderLiveTerminal() {
  const el = document.getElementById('present-live-terminal');
  if (!el) return;
  const log = State.liveDebugLog || [];
  const okCount = log.filter((l) => l.kind === 'ok').length;
  const errCount = log.filter((l) => l.kind === 'err').length;
  const conn = State.liveConn || 'live';
  const connLabel = conn === 'live' ? 'Realtime verbunden' : conn === 'warn' ? 'Verbindung instabil' : 'Realtime getrennt';
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const ico = { ok: '✓', join: '+', info: '·', err: '✗' };
  const lines = log.slice(-80).reverse().map((l) =>
    `<div class="plt-line plt-${esc(l.kind)}"><span class="plt-time">${fmt(l.t)}</span><span class="plt-ico">${ico[l.kind] || '·'}</span><span class="plt-msg">${esc(l.msg)}</span></div>`
  ).join('');
  // DB-Abgleich: tatsächliche Zeilen in Supabase vs. lokal sichtbare (echte) Antworten
  const realLocal = (State.responses || []).filter((r) => !String(r.id).startsWith('debug-')).length;
  const dbCount = State.liveDbCount;
  const dbCls = dbCount == null ? '' : (dbCount >= realLocal ? 'is-ok' : 'is-warn');
  const dbStat = dbCount == null
    ? '<span class="plt-stat plt-db"><i class="fa-solid fa-database"></i> Supabase: prüfe …</span>'
    : `<span class="plt-stat plt-db ${dbCls}"><i class="fa-solid fa-database"></i> Supabase: <strong>${dbCount}</strong>${realLocal > dbCount ? ` (${realLocal - dbCount} offen)` : ' ✓'}</span>`;
  el.innerHTML = `
    <div class="present-live-term-head">
      <span class="present-live-term-title"><i class="fa-solid fa-terminal"></i> Supabase Live</span>
      ${dbStat}
      <span class="plt-stat"><strong>${errCount}</strong> Fehler</span>
      <span class="plt-conn is-${conn}">${esc(connLabel)}</span>
    </div>
    <div class="present-live-term-body">${lines || '<div class="plt-empty">Warte auf Live-Antworten …</div>'}</div>`;
}

// Abgleich mit Supabase: zählt die tatsächlich gespeicherten Zeilen und lädt nach,
// falls der Realtime-Stream Events verpasst hat (Self-Heal nach WLAN-Aussetzern).
async function verifyLivePersistence() {
  if (!State.user || !State.session?.id) return;            // nur Host …
  if (!['live', 'paused'].includes(State.session.status)) return; // … während laufender Session
  if (!document.getElementById('present-live-terminal')) return;
  try {
    const { count, error } = await sb.from('lp_responses')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', State.session.id);
    if (error) { setLiveConn('err', `DB-Check fehlgeschlagen: ${error.message}`); return; }
    State.liveDbCount = count ?? 0;
    const realLocal = (State.responses || []).filter((r) => !String(r.id).startsWith('debug-')).length;
    if (State.liveDbCount > realLocal) {
      // Realtime hat Antworten verpasst → frisch aus Supabase nachladen.
      liveDebugLog('info', `${State.liveDbCount - realLocal} Antwort(en) in Supabase, lokal noch nicht — lade nach …`);
      const { data } = await sb.from('lp_responses').select('*').eq('session_id', State.session.id).order('created_at');
      if (data) {
        const debugOnly = (State.responses || []).filter((r) => String(r.id).startsWith('debug-'));
        State.responses = [...data, ...debugOnly];
        try { renderPresent(); } catch {}
      }
    }
    renderLiveTerminal();
  } catch { /* transienter Netzwerkfehler — nächster Tick versucht erneut */ }
}

function subscribeSessionChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  const chName = sessionChannelName(State.session.id);
  State.liveDebugLog = [];
  State.liveConn = 'warn';
  liveDebugLog('info', `Verbinde mit Session ${State.session.code || ''} …`);
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
      if (!State.responses.some((r) => r.id === payload.new.id)) State.responses.push(payload.new);
      if (payload.new.participant_id) pushPresentActivity(payload.new.participant_id);
      const p = State.participants.find((x) => x.id === payload.new.participant_id);
      liveDebugLog('ok', `${esc(p?.display_name || 'Teilnehmer')} → ${responseSummary(payload.new)} gespeichert`);
      maybeRefreshMatrixBroadcastFromVote(payload.new);
      maybeRefreshVoteBroadcastFromResponse(payload.new);
      renderPresent();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      const idx = State.responses.findIndex((r) => r.id === payload.new.id);
      if (idx >= 0) State.responses[idx] = payload.new;
      else State.responses.push(payload.new);
      liveDebugLog('info', `Antwort aktualisiert (${payload.new.is_hidden ? 'verborgen' : 'freigegeben'})`);
      maybeRefreshMatrixBroadcastFromVote(payload.new);
      maybeRefreshVoteBroadcastFromResponse(payload.new);
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_participants', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      if (!State.participants.find((p) => p.id === payload.new.id)) {
        State.participants.push(normalizeParticipantAvatar(payload.new));
        pushPresentActivity(payload.new.id, 'ist beigetreten');
        liveDebugLog('join', `${esc(payload.new.display_name || 'Teilnehmer')} beigetreten`);
        // Spät beigetretene Teilnehmer: aktuelle Vote-/Matrix-Daten erneut senden.
        const cur = currentSessionSlide();
        if (cur) {
          State._lastVoteSig = null; State._lastMatrixSig = null; State._lastPitchBroadcastSig = null; State._lastQuickWinSig = null;
          try { broadcastVoteOptions(cur); } catch {}
          try { broadcastMatrixItems(cur); } catch {}
          try { broadcastPitchSessionData(cur); } catch {}
          try { broadcastQuickWinItems(cur); } catch {}
        }
      }
      updatePresentStats();
      renderPresentParticipants();
      renderPresent();
    })
    .on('system', {}, () => window.LP?.channelHeartbeat(chName))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { window.LP?.channelHeartbeat(chName); setLiveConn('live', 'Realtime verbunden — Antworten werden live gespeichert'); }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setLiveConn('err', `Realtime-Fehler: ${status}`);
      else if (status === 'CLOSED') setLiveConn('warn', 'Realtime-Kanal geschlossen');
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

let _presentRenderRaf = 0;

function renderPresent() {
  if (_presentRenderRaf) return;
  _presentRenderRaf = requestAnimationFrame(() => {
    _presentRenderRaf = 0;
    renderPresentNow();
  });
}

function renderPresentNow() {
  const slideIdx = State.session?.current_slide_index || 0;
  const slide = State.slides[slideIdx];
  if (slide && isNavHiddenSlide(slide)) {
    const next = advanceSlideIndex(slideIdx, 1);
    if (next !== slideIdx) {
      void goToSlide(next);
      return;
    }
  }
  const stage = $('#present-stage');
  if (!slide) { stage.innerHTML = '<h1>Keine Folien</h1>'; clearPresentStageLayout(stage); stopHeroAiFx(); stopClosingAiFx(); return; }
  stage.classList.toggle('ws-hero-present-stage', !!(isWorkshopOpeningSlide(slide) && isSopWorkshopPresentation()));
  stage.classList.toggle('ws-closing-present-stage', !!(isWorkshopClosingSlide(slide) && (isSopWorkshopPresentation() || slide.settings?.presentationClosing)));
  applyPresentStageLayout(stage, slide, { splitOn: shouldUseSopSplit(slide) });
  const c = slide.content || {};
  // DEBUG-Simulator: bei jedem Slide-Wechsel die Antworten für diesen Slide
  // zeitversetzt drippen (nur einmal pro Slide via triggeredSlides-Set)
  if (window.LP_DebugSim?.active) window.LP_DebugSim.maybeDripCurrentSlide();
  // Matrix-Items an Teilnehmer broadcasten, damit sie dieselben Items ziehen können
  const curIdx = State.session?.current_slide_index || 0;
  if (State._matrixNavIdx !== curIdx) {
    State._matrixNavIdx = curIdx;
    State._lastMatrixSig = null;
  }
  broadcastMatrixItems(slide);
  // Vote-Optionen an Teilnehmer broadcasten, damit sie alle Use Cases sehen + wählen können
  broadcastVoteOptions(slide);
  broadcastPitchSessionData(slide);
  broadcastQuickWinItems(slide);
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
    if (slide.settings?.sopCardVote || slide.settings?.sopPhaseVote || slide.settings?.brainstormVote) {
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
        const textHtml = isBrainstormCollectSlide(slide)
          ? renderUseCaseDisplayHtml(r.response?.text, 'full')
          : esc(r.response?.text || r.response?.value || JSON.stringify(r.response));
        return `
        <div class="present-mod-item">
          ${who}
          <span class="present-mod-text">${textHtml}</span>
          <button type="button" class="present-mod-btn" data-approve="${r.id}">Freigeben</button>
          <button type="button" class="present-mod-btn danger" data-hide="${r.id}">Verbergen</button>
        </div>`;
      }).join('')}
    </div>` : '';

  const slideInk = c.textColor || 'var(--ink)';
  const slideMuted = c.subtextColor || 'var(--muted)';

  if (slide.slide_type === 'content' && c.sopKind === 'dual-pair-orient') {
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: renderDualPairOrientSplitView(slide),
      splitOn: true,
    });
    return;
  }

  if (slide.slide_type === 'section' && c.sopKind === 'group-transition') {
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: renderGroupTransitionHtml(c, false, { shellMode: true }),
    });
    return;
  }

  if (slide.slide_type === 'section' && c.sopTrackClass) {
    const splitOn = shouldUseSopSplit(slide);
    const enriched = enrichSopContent(c);
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: splitOn ? renderSopSectionSplitView(slide) : renderSopSectionHtml(enriched, false, { shellMode: true }),
      splitOn,
    });
    return;
  }

  if (slide.slide_type === 'section' && useCenteredLayout(slide)) {
    applyPresentStageLayout(stage, slide, { splitOn: false });
    stage.innerHTML = wrapSlide(renderCenteredSlideHtml(c, false, { icon: 'fa-heading' }), State.session.current_slide_index || 0);
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    finalizePresentUi(slide);
    return;
  }

  if (slide.settings?.presentationResults || slide.settings?.presentationClosing || isSlideResultsLinkedSlide(slide)) {
    if (slide.settings?.presentationClosing && isSopWorkshopPresentation()) {
      stage.classList.toggle('ws-closing-present-stage', true);
      mountPresentWsSlide(stage, slide, slideIdx, {
        main: renderClosingSlideHtml(c, false, { shellMode: true, presentFx: true, hideChrome: true }),
      });
      return;
    }
    let html = '';
    if (slide.settings?.presentationResults) {
      html = `${renderCenteredSlideHtml(c, false, { icon: 'fa-chart-column' })}
        <div class="viz-wrap viz-wrap-present">${renderPresentationResultsPresentHtml()}</div>`;
    } else if (slide.settings?.presentationClosing) {
      html = renderClosingSlideHtml(c, false, { shellMode: true, presentFx: true });
    } else {
      const source = State.slides.find((s) => s.id === slide.content?.resultsSourceId);
      const srcVisible = source ? getVisibleResponses(source.id) : [];
      const srcDisplay = source ? getTrackVoteDisplaySlide(source) : null;
      const srcAgg = srcDisplay ? window.LPViz.aggregateResponses(srcDisplay, srcVisible) : { total: 0 };
      html = `${useCenteredLayout(slide) ? renderCenteredSlideHtml(c, false, { icon: 'fa-trophy' }) : `<h1 class="pslide-q-title">${esc(c.title || 'Ergebnis')}</h1><p class="pslide-q-prompt">${esc(c.body || '').replace(/\n/g, '<br>')}</p>`}
        <div class="viz-wrap viz-wrap-present">${srcDisplay ? window.LPViz.renderViz(srcDisplay, srcAgg, 'present', { displayMode: getResultsDisplayMode() }) : ''}</div>`;
    }
    applyPresentStageLayout(stage, slide, { splitOn: false });
    stage.classList.toggle('ws-closing-present-stage', !!slide.settings?.presentationClosing);
    stage.innerHTML = wrapSlide(html, State.session.current_slide_index || 0);
    updatePresentHeader();
    updatePresentStats();
    renderPresentParticipants();
    void renderQrCode();
    syncSopWorkshopShell('present', State.session.current_slide_index || 0);
    finalizePresentUi(slide);
    return;
  }

  if (isWorkshopClosingSlide(slide) && isSopWorkshopPresentation()) {
    stage.classList.toggle('ws-closing-present-stage', true);
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: renderClosingSlideHtml(c, false, { shellMode: true, presentFx: true, hideChrome: true }),
    });
    return;
  }

  if (isWorkshopOpeningSlide(slide) && isSopWorkshopPresentation() && !isCardResultsSlide(slide)) {
    stage.classList.toggle('ws-hero-present-stage', true);
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: renderHeroSlideHtml(c, false, { shellMode: true, presentFx: true, hideChrome: true }),
    });
    return;
  }

  if (isSopWorkshopPresentation() && slide.slide_type === 'content' && c.sopKind && c.sopKind !== 'dual-pair-orient') {
    const main = renderSopContentHtml(c, false, { shellMode: true });
    if (main) {
      mountPresentWsSlide(stage, slide, slideIdx, { main: `${main}${modPanel}` });
      stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
      stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
      return;
    }
  }

  if (isSopWorkshopPresentation() && slide.slide_type === 'open' && slide.settings?.anonymous) {
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: `<div class="present-wait-msg ws-feedback-wait">${State.session.question_open ? 'Teilnehmer geben anonym Feedback…' : 'Feedback-Runde beendet'}</div>${modPanel}`,
    });
    stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
    stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
    return;
  }

  if (slide.slide_type === 'content' && (c.isHeroSlide || c.sopKind || c.sopTrackResults || isCardResultsSlide(slide)) && c.sopKind !== 'dual-pair-orient') {
    let html;
    if (isCardResultsSlide(slide)) {
      html = `<h1 class="pslide-q-title">${esc(c.title || 'Ergebnis')}</h1>
        <p class="pslide-q-prompt">${esc(c.body || '').replace(/\n/g, '<br>')}</p>
        <div class="viz-wrap viz-wrap-present">${renderCardResultsPresentHtml(slide)}</div>`;
    } else {
      html = c.isHeroSlide ? renderHeroSlideHtml(c) : renderSopContentHtml(c);
    }
    if (html) {
      applyPresentStageLayout(stage, slide, { splitOn: false });
      stage.innerHTML = wrapSlide(html, State.session.current_slide_index || 0);
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
    applyPresentStageLayout(stage, slide, { splitOn: false });
    stage.innerHTML = wrapSlide(`${renderCenteredSlideHtml(c, false, { icon: 'fa-align-center' })}
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
  const workshopMode = getWorkshopMode(slide);

  if (isBrainstormCollectSlide(slide)) {
    const splitOn = shouldUseSopSplit(slide);
    const enriched = enrichSopContent(c);
    const visible = getVisibleResponses(slide.id);
    const hideBoard = visible.length > 0;
    const collectInner = splitOn
      ? renderBrainstormSplitViz(slide)
      : `${renderWorkshopCardCollectHtml(enriched, false, { shellMode: true, hideBoard, slide })}<div class="viz-wrap viz-wrap-present${hideBoard ? ' viz-wrap-present--solo' : ''}">${viz}</div>`;
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: `${collectInner}${modPanel}`,
      splitOn,
    });
    stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
    stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
    return;
  }

  if (shouldUseVoteWorkshopUi(slide)) {
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: `<div class="viz-wrap viz-wrap-present">${viz}</div>${modPanel}`,
    });
    stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
    stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
    return;
  }

  if (isFinaleSlide(slide)) {
    const isMatrix = slide.settings?.sopAllTracksMatrix || slide.slide_type === 'priority_matrix' || c.sopKind === 'final-matrix';
    const vizBlock = isMatrix
      ? `<div class="ws-matrix-stage"><div class="viz-wrap viz-wrap-present">${viz}</div></div>`
      : `<div class="viz-wrap viz-wrap-present">${viz}</div>`;
    mountPresentWsSlide(stage, slide, slideIdx, {
      main: `${vizBlock}${modPanel}`,
    });
    stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
    stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
    return;
  } else {
    applyPresentStageLayout(stage, slide, { splitOn: false });
    stage.innerHTML = wrapSlide(`
      ${!isSopWorkshopPresentation() && workshopMode ? renderWorkshopModeBadge(workshopMode) : ''}
      ${!isSopWorkshopPresentation() ? sopBadge : ''}
      <h1 class="pslide-q-title ${c.isQuestionSlide ? '' : 'present-slide-title'}" style="color:${esc(slideInk)}">${esc(c.title || c.prompt || 'Folie')}</h1>
      <p class="pslide-q-prompt ${c.isQuestionSlide ? '' : 'present-slide-body'}" style="color:${esc(slideMuted)}">${esc(c.prompt || c.body || '').replace(/\n/g, '<br>')}</p>
      <div class="viz-wrap viz-wrap-present">${viz}</div>${modPanel}`, slideIdx);
  }

  stage.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.approve, false)));
  stage.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderateResponse(btn.dataset.hide, true)));
  updatePresentHeader();
  updatePresentStats();
  renderPresentParticipants();
  void renderQrCode();
  syncPresentCodeBar(State.showPresentCode);
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
  const { n, total } = visibleSlideCounter(idx);
  const counter = $('#present-slide-counter');
  if (counter) counter.textContent = `${n} / ${total}`;

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

  const codeBtn = $('#present-show-code');
  if (codeBtn) {
    codeBtn.classList.toggle('is-active', !!State.showPresentCode);
    codeBtn.title = State.showPresentCode ? 'Teilnahme-Code ausblenden' : 'Teilnahme-Code anzeigen';
  }
}

function syncPresentCodeBar(visible = State.showPresentCode) {
  State.showPresentCode = visible !== false;
  $('#present-code-bar')?.classList.toggle('hidden', !State.showPresentCode);
  $('#present-show-code')?.classList.toggle('is-active', State.showPresentCode);
  setupPresentCodeBarDrag();
}

function setupPresentCodeBarDrag() {
  const bar = $('#present-code-bar');
  if (!bar || bar._dragBound) return;
  bar._dragBound = true;

  const clampToViewport = () => {
    const r = bar.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - r.width - 8);
    const maxTop = Math.max(8, window.innerHeight - r.height - 8);
    let left = parseFloat(bar.style.left);
    let top = parseFloat(bar.style.top);
    if (Number.isNaN(left)) left = r.left;
    if (Number.isNaN(top)) top = r.top;
    bar.style.left = `${Math.min(Math.max(8, left), maxLeft)}px`;
    bar.style.top = `${Math.min(Math.max(8, top), maxTop)}px`;
  };

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseLeft = 0;
  let baseTop = 0;
  let moved = false;

  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    bar.style.left = `${baseLeft + dx}px`;
    bar.style.top = `${baseTop + dy}px`;
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    bar.classList.remove('is-dragging');
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    clampToViewport();
  };

  bar.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    const r = bar.getBoundingClientRect();
    baseLeft = r.left;
    baseTop = r.top;
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    moved = false;
    bar.classList.add('is-positioned', 'is-dragging');
    bar.style.left = `${baseLeft}px`;
    bar.style.top = `${baseTop}px`;
    bar.style.right = 'auto';
    bar.style.bottom = 'auto';
    bar.style.transform = 'none';
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    e.preventDefault();
  });

  bar.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } });

  if (!bar._dragResizeBound) {
    bar._dragResizeBound = true;
    window.addEventListener('resize', () => { if (bar.classList.contains('is-positioned')) clampToViewport(); });
  }
}

function updatePresentStats() {
  const slide = currentSessionSlide();
  const count = getVisibleResponses(slide?.id).length;
  const pending = getPendingResponses(slide?.id).length;
  $('#present-stats').textContent = `${State.participants.length} Teilnehmer · ${count} Antworten${pending ? ` · ${pending} wartend` : ''}`;
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
  let dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(url)}`;
  try {
    if (typeof QRCode !== 'undefined' && QRCode.toDataURL) {
      dataUrl = await QRCode.toDataURL(url, {
        width: 280,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    }
  } catch { /* fallback url above */ }
  const targets = [...document.querySelectorAll('#present-qr')];
  targets.forEach((el) => {
    el.src = dataUrl;
    el.alt = `QR Code ${State.session.code}`;
  });
  if (img && !targets.includes(img)) {
    img.src = dataUrl;
    img.alt = `QR Code ${State.session.code}`;
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
    syncPresentCodeBar(!State.showPresentCode);
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
    if (!await lpConfirm({ title: 'Antworten zurücksetzen?', desc: 'Alle Antworten dieser Folie werden gelöscht.', okLabel: 'Zurücksetzen', variant: 'warning', icon: 'fa-arrow-rotate-left' })) return;
    const slide = currentSessionSlide();
    await sb.from('lp_responses').delete().eq('session_id', State.session.id).eq('slide_id', slide.id);
    State.responses = State.responses.filter((r) => r.slide_id !== slide.id);
    renderPresent();
  };
  $('#present-end').onclick = async () => {
    if (!await lpConfirm({ title: 'Session beenden?', desc: 'Die Live-Session wird beendet und die Ergebnisse angezeigt.', okLabel: 'Beenden', variant: 'danger', icon: 'fa-stop' })) return;
    await sb.from('lp_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', State.session.id);
    location.hash = `#results/${State.session.id}`;
    await openResults(State.session.id);
  };
}

async function changeSlide(delta) {
  const next = advanceSlideIndex(State.session.current_slide_index || 0, delta);
  if (next === State.session.current_slide_index) return;
  State.confettiSlideId = null;
  broadcastSessionPatch({ current_slide_index: next, question_open: true });
  renderPresent();
  await sb.from('lp_sessions').update({ current_slide_index: next, question_open: true }).eq('id', State.session.id);
}

async function goToSlide(index) {
  let next = clamp(index, 0, State.slides.length - 1);
  if (isNavHiddenSlide(State.slides[next])) next = advanceSlideIndex(next, index >= (State.session.current_slide_index || 0) ? 1 : -1);
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
  const needsTrackData = Boolean(slide?.settings?.sopTrackVote || slide?.settings?.sopPhaseVote || slide?.settings?.sopCardVote || slide?.settings?.brainstormVote || slide?.settings?.sopAllTracksVote || slide?.settings?.sopAllTracksMatrix || slide?.slide_type === 'priority_matrix');
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
  // Legacy-Kompat: vor dem Rename gespeicherte Slides nutzten mentiHero/mentiQuestion.
  const c = next.content;
  if (c && typeof c === 'object') {
    if (c.isHeroSlide === undefined && c.mentiHero !== undefined) c.isHeroSlide = c.mentiHero;
    if (c.isQuestionSlide === undefined && c.mentiQuestion !== undefined) c.isQuestionSlide = c.mentiQuestion;
    if (c.isHeroSlide && !c.sopKind && /danke|abschluss|thank/i.test(String(c.title || ''))) {
      c.sopKind = 'workshop-close';
    }
    if (c.sopKind === 'next-steps') {
      if (/konkrete actions/i.test(String(c.title || ''))) c.title = 'Next Steps';
      if (/priorisierung wird umsetzung/i.test(String(c.subtitle || ''))) c.subtitle = '';
      if (!c.body || /Wer übernimmt\?/i.test(String(c.body || ''))) {
        c.body = 'Was sind die nächsten Schritte für unsere Quick Wins? Pro Use Case legen wir Verantwortliche, Deadlines und konkrete Actions fest.';
      }
    }
  }
  const st = next.settings;
  if (st && typeof st === 'object' && ['brainstorm', 'open', 'wordcloud'].includes(next.slide_type)) {
    const fromContent = Number(next.content?.maxResponsesPerUser);
    if ((!st.responseLimit || st.responseLimit <= 0) && fromContent > 0) st.responseLimit = fromContent;
    if (st.responseLimit > 0 && st.multipleResponses == null) st.multipleResponses = st.responseLimit > 1;
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
  bindParticipantSettingsSheet();
  const saved = JSON.parse(localStorage.getItem('lp_join_profile') || 'null');
  const code = (codePrefill || parseJoinCodeFromHash() || '').trim().toUpperCase();
  const hasCode = Boolean(code);
  State.joinProfile = {
    name: saved?.name || '',
    emoji: saved?.emoji || LP_AVATAR_EMOJIS()[0],
    color: saved?.color || LP_AVATAR_COLORS()[0],
  };
  const root = $('#participant-root');
  root.innerHTML = `
    <div class="participant-join-page">
      <header class="participant-join-header">
        <div class="participant-join-logo" aria-hidden="true"><i class="fa-solid fa-signal"></i></div>
        <div class="participant-join-header-text">
          <h1>Live teilnehmen</h1>
          <p>${hasCode ? 'Session-Code ist hinterlegt — Name eingeben und los.' : 'Code eingeben und mitmachen.'}</p>
        </div>
      </header>
      <div class="participant-join-form">
        ${hasCode ? `
          <div class="join-code-badge"><i class="fa-solid fa-qrcode"></i> Session <strong>${esc(code)}</strong></div>
          <input type="hidden" id="join-code" value="${esc(code)}" />`
        : `<div class="participant-join-field">
            <label class="join-label" for="join-code">Session-Code</label>
            <input class="participant-code-input" id="join-code" maxlength="8" placeholder="CODE" autocomplete="one-time-code" value="${esc(code)}" />
          </div>`}
        <div class="participant-join-field">
          <label class="join-label" for="join-name">Dein Name <span class="req">*</span></label>
          <input id="join-name" placeholder="Vorname oder Nickname" class="participant-name-input" value="${esc(State.joinProfile.name)}" required autocomplete="name" />
        </div>
        <button type="button" class="participant-join-avatar-chip" id="join-avatar-chip" aria-label="Avatar anpassen">
          <span class="participant-join-avatar-chip-face" id="join-avatar-chip-face" style="background:${esc(State.joinProfile.color)}">${State.joinProfile.emoji}</span>
          <span class="participant-join-avatar-chip-text">
            <strong id="join-avatar-chip-name">${esc(State.joinProfile.name || 'Avatar wählen')}</strong>
            <span>Emoji &amp; Farbe in Einstellungen</span>
          </span>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
      <button type="button" class="btn-primary participant-submit participant-join-submit-hidden" id="join-submit"><i class="fa-solid fa-arrow-right"></i> Beitreten</button>
    </div>`;

  const updatePreview = () => {
    State.joinProfile.name = $('#join-name')?.value.trim() || '';
    syncJoinAvatarChipPreview();
  };

  $('#join-name')?.addEventListener('input', updatePreview);
  $('#join-avatar-chip')?.addEventListener('click', () => {
    State.joinProfile.name = $('#join-name')?.value.trim() || State.joinProfile.name;
    openParticipantSettingsSheet();
  });
  $('#join-code')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#join-name')?.focus(); });
  syncParticipantMobileActionBar();
  bindParticipantConnectivityHandlers();
  const submitJoin = () => {
    const joinCode = $('#join-code').value.trim().toUpperCase();
    const name = $('#join-name').value.trim();
    if (!joinCode) { toast('Bitte Code eingeben', 'warn'); return; }
    if (!name) { toast('Bitte Name eingeben', 'warn'); return; }
    State.joinProfile.name = name;
    if (!State.joinProfile.emoji || !LP_AVATAR_EMOJIS().includes(State.joinProfile.emoji)) { toast('Bitte Avatar wählen', 'warn'); return; }
    if (!State.joinProfile.color || !LP_AVATAR_COLORS().includes(State.joinProfile.color)) { toast('Bitte Avatar-Farbe wählen', 'warn'); return; }
    localStorage.setItem('lp_join_profile', JSON.stringify({ name, emoji: State.joinProfile.emoji, color: State.joinProfile.color }));
    void joinSession(joinCode, name, State.joinProfile.emoji, State.joinProfile.color);
  };
  const joinBtn = $('#join-submit');
  if (joinBtn) {
    let touchHandled = false;
    joinBtn.addEventListener('touchend', (e) => {
      touchHandled = true;
      e.preventDefault();
      submitJoin();
    }, { passive: false });
    joinBtn.addEventListener('click', () => {
      if (touchHandled) { touchHandled = false; return; }
      submitJoin();
    });
  }
  updatePreview();
  setTimeout(() => $('#join-name')?.focus(), 120);
}

async function joinSession(code, name, emoji, color) {
  const joinBtn = document.getElementById('join-submit');
  setButtonBusy(joinBtn, true, 'Beitreten…');
  const emojis = LP_AVATAR_EMOJIS();
  const colors = LP_AVATAR_COLORS();
  if (!emoji || !emojis.includes(emoji)) { toast('Bitte Avatar wählen', 'error'); setButtonBusy(joinBtn, false); return; }
  if (!color || !colors.includes(color)) { toast('Bitte Avatar-Farbe wählen', 'error'); setButtonBusy(joinBtn, false); return; }
  try {
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
    State.participant = normalizeParticipantAvatar(part);
    State.sopAssignSeen = getParticipantSopGroup(part.id);
    State.responses = [];
    loadAnsweredSlides(session.id);
    const { data: slides } = await sb.from('lp_slides').select('*').eq('presentation_id', session.presentation_id).order('sort_order');
    State.slides = normalizeSlides(slides);
    bindParticipantConnectivityHandlers();
    subscribeParticipantChannel();
    hapticFeedback('success');
    await renderParticipantQuestion();
    maybeShowPwaInstallHint();
  } finally {
    setButtonBusy(joinBtn, false);
  }
}

// Hat der Teilnehmer gerade eine laufende Eingabe/Auswahl, die ein Re-Render
// zerstören würde? (Checkbox gewählt, Text getippt, Matrix-Item platziert)
function participantHasActiveInput() {
  const root = $('#participant-root');
  const bar = $('#participant-action-bar');
  const scope = bar ? [root, bar] : [root];
  for (const el of scope) {
    if (!el) continue;
    if (el.querySelector('.track-vote-option--pick.is-selected, #multi-wrap input:checked')) return true;
    const ta = el.querySelectorAll('textarea, input[type="text"], input[type="number"]');
    for (const f of ta) { if (String(f.value || '').trim()) return true; }
  }
  // Matrix: bereits platzierte Items
  const cur = State.slides?.[State.session?.current_slide_index || 0];
  if (cur && (cur.slide_type === 'priority_matrix' || cur.settings?.sopAllTracksMatrix)) {
    const placed = loadMatrixLocal(cur.id);
    if (placed && Object.keys(placed).length) return true;
  }
  return false;
}

function subscribeParticipantChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  const chName = sessionChannelName(State.session.id);
  State.sessionChannel = sb.channel(chName)
    .on('broadcast', { event: 'session_sync' }, ({ payload }) => {
      window.LP?.channelHeartbeat(chName);
      const prevIndex = State.session.current_slide_index;
      const prevOpen = State.session.question_open;
      handleParticipantBroadcastPayload(payload || {}, { prevIndex, prevOpen });
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      window.LP?.channelHeartbeat(chName);
      const prevIndex = State.session.current_slide_index;
      const prevOpen = State.session.question_open;
      applySessionPatch(payload.new || {});
      if (State.session.status === 'ended') {
        handleParticipantSessionEnd();
        return;
      }
      const slide = State.slides[State.session.current_slide_index || 0];
      const root = $('#participant-root');
      if (slide && State.session.current_slide_index === prevIndex && State.session.question_open === prevOpen
          && (shouldKeepParticipantVoteDom(slide, prevIndex, root)
            || (isParticipantOpeningHeroSlide(slide) && root?.querySelector('.participant-opening-hero .ws-hero-stage'))
            || (isParticipantClosingHeroSlide(slide) && root?.querySelector('.participant-closing-hero .ws-closing-stage')))) {
        return;
      }
      void renderParticipantQuestion();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, () => {
      window.LP?.channelHeartbeat(chName);
      void (async () => {
        await ensureParticipantResponses(true);
        const slide = State.slides[State.session.current_slide_index || 0];
        // Nur neu rendern, wenn die Ansicht fremde Beitraege zeigt — sonst gehen laufende Eingaben verloren.
        if (slide?.settings?.sopTrackVote || slide?.settings?.sopPhaseVote || slide?.settings?.sopCardVote || slide?.settings?.brainstormVote || slide?.slide_type === 'qa') await renderParticipantQuestion();
      })();
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, () => {
      window.LP?.channelHeartbeat(chName);
      void (async () => {
        await ensureParticipantResponses(true);
        const slide = State.slides[State.session.current_slide_index || 0];
        if (slide?.settings?.sopTrackVote || slide?.settings?.sopPhaseVote || slide?.settings?.sopCardVote || slide?.settings?.brainstormVote || slide?.slide_type === 'qa') await renderParticipantQuestion();
      })();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        window.LP?.channelHeartbeat(chName);
        setParticipantConnStatus(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setParticipantConnStatus(false);
      }
    });
  window.LP?.registerChannel(chName, () => subscribeParticipantChannel());
  startParticipantSync();
}

async function loadQaResponses(slideId) {
  const { data } = await sb.from('lp_responses').select('*').eq('session_id', State.session.id).eq('slide_id', slideId).eq('is_hidden', false);
  return (data || []).filter((r) => r.response?.text);
}

function getCollectResponseLimit(slide) {
  if (!slide) return 1;
  if (presentationHasWorkshopFlow() && (isBrainstormCollectSlide(slide) || COLLECT_CHAIN_TYPES.has(slide.slide_type))) {
    return Math.max(1, Math.min(10, Math.floor(Number(getWorkshopSettings().brainstormMaxResponses) || 1)));
  }
  const st = slide.settings || {};
  const c = slide.content || {};
  const fromSettings = Number(st.responseLimit);
  if (Number.isFinite(fromSettings) && fromSettings > 0) return Math.floor(fromSettings);
  const fromContent = Number(c.maxResponsesPerUser);
  if (Number.isFinite(fromContent) && fromContent > 0) return Math.floor(fromContent);
  return Math.max(1, Math.floor(Number(getWorkshopSettings().brainstormMaxResponses) || 1));
}

function getCollectPromptForSlide(slide) {
  return patchMaxUseCasesInText(slide?.content?.prompt, getCollectResponseLimit(slide));
}

function getPatchedWorkshopSubtitle(text) {
  if (!text || !presentationHasWorkshopFlow()) return text;
  if (/max\.\s*\d+/i.test(String(text))) {
    return patchMaxUseCasesInText(text, getWorkshopSettings().brainstormMaxResponses);
  }
  return text;
}

function collectLimitPillLabel(slide) {
  return collectLimitLabel(getCollectResponseLimit(slide));
}

function patchCollectPromptLimit(prompt, limit) {
  const label = collectLimitLabel(limit);
  const text = String(prompt || '');
  if (/max\.\s*\d+/i.test(text)) return patchMaxUseCasesInText(text, limit);
  if (!text.trim()) return `Max. ${label} pro Person.`;
  const lines = text.split('\n');
  lines.splice(1, 0, `Max. ${label} pro Person.`);
  return lines.join('\n');
}

function countParticipantTextResponses(slideId, participantId) {
  if (!slideId || !participantId) return 0;
  return (State.responses || []).filter((r) => (
    r.slide_id === slideId
    && r.participant_id === participantId
    && !r.is_hidden
    && String(r.response?.text || '').trim()
  )).length;
}

function isWorkshopFeedbackSlide(slide) {
  if (!slide || slide.slide_type !== 'open' || !slide.settings?.anonymous) return false;
  return /dein feedback/i.test(String(slide.content?.title || ''));
}

async function stripWorkshopFeedbackSlides() {
  if (!State.presentation?.id || !isSopWorkshopPresentation()) return;
  const toRemove = State.slides.filter(isWorkshopFeedbackSlide);
  if (!toRemove.length) return;
  for (const slide of toRemove) {
    await sb.from('lp_slides').delete().eq('id', slide.id);
  }
  State.slides = State.slides.filter((s) => !isWorkshopFeedbackSlide(s));
  State.slides.forEach((s, idx) => { s.sort_order = idx; });
  await persistSlideOrder();
}

function hasAnsweredSlide(slide) {
  const limit = getCollectResponseLimit(slide);
  const isCollect = isBrainstormCollectSlide(slide)
    || (COLLECT_CHAIN_TYPES.has(slide.slide_type) && limit > 0);
  if (isCollect && limit > 0) {
    const count = countParticipantTextResponses(slide.id, State.participant?.id);
    return count >= limit;
  }
  if (slide.settings?.multipleResponses) return false;
  return State.answeredSlides.has(slide.id);
}

async function renderParticipantQuestion() {
  const slideIndex = State.session.current_slide_index || 0;
  if (State._participantSlideRenderIdx !== slideIndex) {
    cleanupParticipantHeroFx();
    cleanupParticipantClosingFx();
    State._participantHeroMountKey = null;
    State._participantClosingMountKey = null;
    State._participantVoteMountKey = null;
    State._participantSlideRenderIdx = slideIndex;
    State._participantVoteOptionsSig = null;
    State._participantMatrixItemsSig = null;
    State._participantQuickWinSig = null;
  }
  const hostSlide = State.slides[slideIndex];
  const slide = resolveParticipantSlide(hostSlide) || hostSlide;
  const isMatrixSlide = slide?.slide_type === 'priority_matrix' || slide?.settings?.sopAllTracksMatrix;
  const root = $('#participant-root');
  if (shouldKeepParticipantVoteDom(hostSlide, slideIndex, root)) {
    syncParticipantMobileActionBar();
    syncSopWorkshopShell('participant', slideIndex);
    return;
  }
  if (isSopVoteSlide(slide) || isMatrixSlide) await ensureParticipantResponses(true);
  if (isBrainstormCollectSlide(slide) || (COLLECT_CHAIN_TYPES.has(slide?.slide_type) && getCollectResponseLimit(slide) > 0)) {
    await ensureParticipantResponses(true);
  }
  const finishParticipant = () => {
    syncSopWorkshopShell('participant', slideIndex);
    syncParticipantMobileActionBar();
  };
  if (!hostSlide?.settings?.sopTrackVote) State.participantVoteExpert = false;
  if (!hostSlide) { root.innerHTML = '<div class="participant-card"><p>Warte auf Folie…</p></div>'; finishParticipant(); return; }
  if (!State.session.question_open) {
    cleanupParticipantHeroFx();
    cleanupParticipantClosingFx();
    root.innerHTML = `<div class="participant-card"><h1>${esc(hostSlide.content?.title || 'Warte…')}</h1><p>Die Frage ist geschlossen. Bitte warte auf die nächste Karte…</p></div>`;
    finishParticipant();
    return;
  }
  if (isParticipantOpeningHeroSlide(hostSlide)) {
    mountParticipantOpeningHero(hostSlide, slideIndex, root, finishParticipant);
    return;
  }
  cleanupParticipantHeroFx();
  cleanupParticipantClosingFx();
  if (hostSlide?.content?.sopKind === 'participants') {
    root.innerHTML = wrapParticipantSlide(renderParticipantSopWaitHtml({
      title: 'SOP-Zuweisung läuft',
      lead: 'Der Host ordnet dich gleich Internal oder Consulting zu. Danach siehst du nur dein SOP — bis Pitch, Priorisierung und Matrix.',
    }), slideIndex);
    finishParticipant();
    return;
  }
  if (participantNeedsSopAssignment(hostSlide)) {
    root.innerHTML = wrapParticipantSlide(renderParticipantSopWaitHtml({
      title: 'SOP-Zuweisung',
      lead: 'Der Host weist dich gleich Internal oder Consulting zu.',
    }), slideIndex);
    finishParticipant();
    return;
  }
  if (participantOnWrongSopGroup(hostSlide)) {
    const assigned = getParticipantSopGroup(State.participant?.id);
    const meta = assigned ? getSopGroupMeta(assigned) : null;
    root.innerHTML = wrapParticipantSlide(renderParticipantSopWaitHtml({
      title: meta ? `Dein SOP: ${meta.label}` : 'Andere SOP-Runde',
      lead: meta
        ? `Du bist ${meta.label} zugewiesen. Bitte warte, bis eure Runde auf dem Beamer aktiv ist.`
        : 'Bitte auf den Host achten…',
    }), slideIndex);
    finishParticipant();
    return;
  }
  if (hostSlide?.content?.sopKind === 'pitch-session' || hostSlide?.settings?.sopPitchSession) {
    startParticipantPitchClock();
    const sync = State.pitchSync;
    const inFocus = sync?.running && sync.activeKey;
    root.innerHTML = wrapParticipantSlide(`
      <div class="participant-ws-slide-wrap participant-pitch-block${inFocus ? ' participant-pitch-block--focus' : ''}">
        ${renderWsSlideShell({
          ...getSlideShellMeta(hostSlide),
          title: getWsPresentTitle(hostSlide),
          chips: getWsPresentChips(hostSlide),
          lead: inFocus ? 'Live-Pitch — Timer läuft' : (getWsPresentLead(hostSlide) || 'Überblick: wer pitcht welchen Use Case?'),
          main: renderParticipantPitchHtml(),
        })}
        ${inFocus ? '' : '<p class="participant-sop-wait participant-sop-wait--compact"><i class="fa-solid fa-eye"></i> Der Host startet die Pitch-Timer — dann siehst du hier den aktiven Use Case live.</p>'}
      </div>`, slideIndex);
    finishParticipant();
    return;
  }
  stopParticipantPitchClock();
  if (hostSlide?.content?.sopKind === 'workshop-goal') {
    root.innerHTML = wrapParticipantSlide(`
      <div class="participant-ws-slide-wrap participant-matrix-intro-block">
        ${renderWsSlideShell({
          ...getSlideShellMeta(hostSlide),
          title: getWsPresentTitle(hostSlide),
          chips: getWsPresentChips(hostSlide),
          lead: getWsPresentLead(hostSlide) || 'Impact vs. Aufwand — so priorisieren wir',
          main: renderParticipantGoalMatrixHtml(hostSlide),
        })}
      </div>`, slideIndex);
    finishParticipant();
    return;
  }
  if (hostSlide?.content?.sopKind === 'next-steps' || hostSlide?.settings?.sopNextSteps) {
    root.innerHTML = wrapParticipantSlide(`
      <div class="participant-ws-slide-wrap participant-nextsteps-block">
        ${renderWsSlideShell({
          ...getSlideShellMeta(hostSlide),
          title: getWsPresentTitle(hostSlide),
          chips: getWsPresentChips(hostSlide),
          lead: getWsPresentLead(hostSlide) || 'Quick Wins → konkrete Actions',
          main: renderParticipantNextStepsHtml(),
        })}
        <p class="participant-sop-wait participant-sop-wait--compact"><i class="fa-solid fa-eye"></i> Der Host pflegt das Action Log live.</p>
      </div>`, slideIndex);
    finishParticipant();
    return;
  }
  if (isParticipantClosingHeroSlide(hostSlide)) {
    mountParticipantClosingHero(hostSlide, slideIndex, root, finishParticipant);
    return;
  }
  if (hostSlide?.content?.sopKind === 'dual-pair-orient') {
    root.innerHTML = wrapParticipantSlide(`
      <div class="participant-wait-block ws-slide ws-slide--orient">
        <header class="ws-slide-head"><span class="ws-pill ws-pill--orient"><i class="fa-solid fa-map"></i> Track</span></header>
        <h1 class="ws-title">${esc(hostSlide.content?.title || 'Überblick')}</h1>
        <p class="ws-lead"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p>
      </div>`, slideIndex);
    finishParticipant();
    return;
  }
  if (hostSlide?.content?.sopKind === 'group-transition') {
    root.innerHTML = wrapParticipantSlide(`
      <div class="participant-wait-block">
        ${renderGroupTransitionHtml(hostSlide.content || {}, false)}
        <p class="participant-sop-wait"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p>
      </div>`, slideIndex);
    finishParticipant();
    return;
  }
  if (!isInteractive(slide.slide_type)) {
    if (slide.slide_type === 'section' && slide.content?.sopTrackClass) {
      root.innerHTML = wrapParticipantSlide(`
        <div class="participant-wait-block">
          ${renderSopSectionHtml(slide.content, false, { participantCompact: true })}
          <p class="participant-sop-wait"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p>
        </div>`, slideIndex);
      finishParticipant();
      return;
    }
    if (slide.slide_type === 'content' && (slide.content?.isHeroSlide || slide.content?.sopKind === 'workshop-close' || slide.content?.sopKind || slide.content?.sopTrackResults || isSopCardResultsSlide(slide))) {
      const html = isWorkshopClosingSlide(slide)
        ? renderClosingSlideHtml(slide.content, false, { shellMode: true, presentFx: true })
        : (slide.content.isHeroSlide
          ? renderHeroSlideHtml(slide.content, false, { shellMode: true, presentFx: true })
          : (isSopCardResultsSlide(slide) ? '' : renderSopContentHtml(slide.content)));
      if (html || isSopCardResultsSlide(slide)) {
        root.innerHTML = wrapParticipantSlide(`
          <div class="participant-wait-block">${html || `<h1 class="pslide-q-title">${esc(slide.content?.title || 'Ergebnis')}</h1><p class="pslide-q-prompt">${esc(slide.content?.body || '')}</p>`}
          <p class="participant-sop-wait"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p></div>`, slideIndex);
        finishParticipant();
        return;
      }
    }
    root.innerHTML = `<div class="participant-card"><h1>${esc(slide.content?.title || 'Folie')}</h1><p>${esc(slide.content?.body || slide.content?.prompt || '')}</p><p class="participant-sop-wait participant-sop-wait--compact"><i class="fa-solid fa-eye"></i> Bitte auf die Präsentation achten…</p></div>`;
    finishParticipant();
    return;
  }
  if (hasAnsweredSlide(slide)) {
    root.innerHTML = wrapParticipantSlide(`
      <div class="participant-sent-card">
        <div class="participant-sent-icon"><i class="fa-solid fa-check"></i></div>
        <h1 class="pslide-q-title">Antwort gesendet</h1>
        <p class="pslide-q-prompt">Danke! Bitte warte auf die nächste Karte…</p>
      </div>`, slideIndex);
    finishParticipant();
    return;
  }

  const c = slide.content || {};
  const type = slide.slide_type;
  const timeLimit = slide.settings?.timeLimitSec || 0;
  const isCollectSlide = isBrainstormCollectSlide(slide);
  const collectLimit = isCollectSlide ? getCollectResponseLimit(slide) : 0;
  const collectSubmitted = isCollectSlide ? countParticipantTextResponses(slide.id, State.participant?.id) : 0;
  const collectDisplayContent = isCollectSlide
    ? { ...c, prompt: patchCollectPromptLimit(c.prompt, collectLimit) }
    : c;
  let input = '';

  if (type === 'mc_single' || type === 'quiz' || type === 'yesno') {
    const opts = type === 'yesno'
      ? [{ id: 'yes', text: 'Ja' }, { id: 'no', text: 'Nein' }]
      : (slide.settings?.sopTrackVote ? getTrackVoteOptions(slide) : (c.options || []));
    // Zweistufig: erst auswählen (markieren), dann unten „Senden" bestätigen —
    // verhindert versehentliches Absenden durch Fehl-Tap (wichtig bei Quiz).
    input = `<div id="choice-wrap" class="participant-choice-wrap">${opts.map((o) => `<button type="button" class="participant-option" data-val="${esc(o.id)}" aria-pressed="false" style="border-color:${esc(o.color || c.accentColor || 'var(--line)')}">${esc(o.text)}</button>`).join('')}</div>
      <button type="button" class="btn-primary participant-submit" id="submit-choice" disabled>Senden</button>`;
  } else if (type === 'mc_multi') {
    if (isSopVoteSlide(slide)) {
      input = renderParticipantTrackVoteHtml(slide);
    } else {
      input = `<div id="multi-wrap">${(c.options || []).map((o) => `<label class="props-check"><input type="checkbox" value="${esc(o.id)}"> ${esc(o.text)}</label>`).join('')}</div><button type="button" class="btn-primary participant-submit" id="submit-multi">Senden</button>`;
    }
  } else if (type === 'wordcloud' || type === 'open' || type === 'brainstorm') {
    const isCollect = isCollectSlide;
    const lim = Number(c.charLimit || 0);
    const maxAttr = lim > 0 ? ` maxlength="${lim}"` : '';
    const counter = lim > 0 ? `<div class="p-char-counter"><span id="p-char-n">0</span>/${lim}</div>` : '';
    if (isCollect) {
      const ucL = getUseCaseLabels();
      const collectQuotaHtml = collectLimit > 1
        ? `<div class="participant-collect-quota" role="status" aria-live="polite">
            <span class="participant-collect-quota-badge"><i class="fa-solid fa-layer-group"></i> Use Case ${collectSubmitted + 1} von ${collectLimit}</span>
            <span class="participant-collect-quota-hint">Alle drei Felder unten = ein Use Case</span>
          </div>`
        : '';
      // charLimit gilt pro Feld (konsistent, kein verwirrender Summen-Counter).
      input = `<div class="participant-collect-fields participant-collect-fields--structured">
        ${collectQuotaHtml}
        <label class="join-label" for="p-uc-summary">${esc(ucL.summary)}</label>
        <textarea id="p-uc-summary" rows="2" class="participant-textarea participant-textarea-lg"${maxAttr} placeholder="Was wollt ihr umsetzen oder verbessern?"></textarea>
        <label class="join-label" for="p-uc-feature">${esc(ucL.feature)}</label>
        <textarea id="p-uc-feature" rows="2" class="participant-textarea"${maxAttr} placeholder="Was soll die KI konkret tun?"></textarea>
        <label class="join-label" for="p-uc-deps">${esc(ucL.dependencies)}</label>
        <textarea id="p-uc-deps" rows="2" class="participant-textarea"${maxAttr} placeholder="Was muss im Team schon vorhanden sein?"></textarea>
        <button type="button" class="btn-primary participant-submit participant-submit-lg" id="submit-text">Use Case senden</button>
      </div>`;
    } else {
      input = `<textarea id="p-text" rows="3" class="participant-textarea"${maxAttr} placeholder="${esc(c.prompt || 'Antwort')}"></textarea>${counter}<button type="button" class="btn-primary participant-submit" id="submit-text">Senden</button>`;
    }
  } else if (type === 'qa') {
    input = `<textarea id="p-text" rows="2" class="participant-textarea" placeholder="Deine Frage…"></textarea><button type="button" class="btn-primary participant-submit" id="submit-text">Frage senden</button><div id="qa-list" class="qa-list"></div>`;
  } else if (type === 'scale') {
    input = `<div class="scale-labels"><span>${esc(c.minLabel || c.min || 1)}</span><span>${esc(c.maxLabel || c.max || 10)}</span></div>
      <input id="p-range" type="range" min="${c.min ?? 1}" max="${c.max ?? 10}" value="${Math.round(((c.min ?? 1) + (c.max ?? 10)) / 2)}" class="participant-range" aria-label="${esc(c.title || c.prompt || 'Skala')}" aria-valuetext="${Math.round(((c.min ?? 1) + (c.max ?? 10)) / 2)}" />
      <div id="p-range-val" style="text-align:center;font-size:1.5rem;font-weight:700;margin:.5rem 0" aria-hidden="true">${Math.round(((c.min ?? 1) + (c.max ?? 10)) / 2)}</div>
      <button type="button" class="btn-primary participant-submit" id="submit-num">Senden</button>`;
  } else if (type === 'number_guess') {
    input = `<input id="p-num" type="number" class="participant-num-input" placeholder="Deine Schätzung"><button type="button" class="btn-primary participant-submit" id="submit-num" style="margin-top:.75rem">Senden</button>`;
  } else if (type === 'reaction') {
    input = `<div class="participant-reaction-grid">${['👍', '👎', '❤️', '😂', '😮', '👏'].map((e) => `<button type="button" class="participant-emoji" data-emoji="${e}" aria-label="Reaktion ${e}">${e}</button>`).join('')}</div>`;
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
        <div id="split-total" style="font-weight:700;margin:.5rem 0" role="status" aria-live="polite">Summe: 0 / 100</div>
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
  const isCollect = isCollectSlide;
  const isDecide = shouldUseVoteWorkshopUi(slide);
  const isMatrixInteract = type === 'priority_matrix' || !!slide?.settings?.sopAllTracksMatrix;
  const assignedGroup = isDualSopWorkshop() ? getParticipantSopGroup(State.participant?.id) : null;
  const teamBadge = assignedGroup && isCollect
    ? `<div class="participant-team-badge ws-pill ws-pill--orient"><i class="fa-solid ${getSopGroupMeta(assignedGroup).icon}"></i> Dein Team: ${esc(getSopGroupMeta(assignedGroup).label)}</div>`
    : '';
  const cardClass = [
    'participant-card',
    c.isQuestionSlide || isWorkshop ? 'participant-pslide-q' : '',
    getWorkshopMode(slide) ? `participant-mode-${getWorkshopMode(slide)}` : '',
    isWorkshop ? 'participant-card-pslide' : '',
  ].filter(Boolean).join(' ');

  root.innerHTML = wrapParticipantSlide(isCollect ? `
    <div class="participant-ws-slide-wrap">
      ${renderWsSlideShell({
        ...getSlideShellMeta(slide),
        title: getWsPresentTitle(slide),
        chips: getWsPresentChips(slide),
        lead: getWsPresentLead(slide),
        main: `${teamBadge}${renderWorkshopCardCollectHtml(collectDisplayContent, false, { participantMode: true, shellWrapped: true, slide })}${input}`,
      })}
    </div>` : isMatrixInteract ? `
    <div class="participant-ws-slide-wrap participant-matrix-block">
      ${renderWsSlideShell({
        ...getSlideShellMeta(slide),
        title: getWsPresentTitle(slide),
        chips: getWsPresentChips(slide),
        lead: getWsPresentLead(slide) || (c.prompt ? String(c.prompt).split('\n')[0] : 'Ordne Use Cases in die Matrix ein'),
        main: input,
      })}
    </div>` : isDecide ? `
    <div class="participant-ws-slide-wrap">
      ${renderWsSlideShell({
        ...getSlideShellMeta(slide),
        title: getWsPresentTitle(slide),
        chips: getWsPresentChips(slide),
        lead: getWsPresentLead(slide),
        main: `${teamBadge}${input}`,
      })}
    </div>` : `
    <div class="${cardClass}">
      ${!isWorkshop ? `<div class="participant-header-row">
        ${participantAvatarHtml(State.participant, 'md')}
        <div><div class="participant-meta">Code ${esc(State.session.code)}${slide.settings?.anonymous ? ' · Anonym' : ''}</div><div class="participant-you">${esc(State.participant?.display_name || '')}</div></div>
      </div>` : ''}
      ${teamBadge}
      ${!isCollect && !isDecide ? `<h1 class="pslide-q-title">${esc(c.title || c.prompt || participantTypeFallbackTitle(type))}</h1>` : ''}
      ${!isCollect && !isDecide && c.prompt && c.title ? `<p class="pslide-q-prompt">${esc(c.prompt).replace(/\n/g, '<br>')}</p>` : ''}
      ${timeLimit ? `<div id="p-timer" class="p-timer">${timeLimit}s</div>` : ''}
      ${input}
    </div>`, slideIndex);

  if (timeLimit) startQuestionTimer(timeLimit);
  if (isParticipantVoteSelectionSlide(slide)) {
    State._participantVoteMountKey = participantVoteSelectionKey(slide, slideIndex);
  } else {
    State._participantVoteMountKey = null;
  }
  bindParticipantHandlers(slide);
  syncParticipantMobileActionBar();
  finishParticipant();
}

function participantTypeFallbackTitle(type) {
  const map = {
    mc_single: 'Bitte wählen', quiz: 'Quiz', yesno: 'Ja oder Nein?',
    mc_multi: 'Mehrfachauswahl', scale: 'Deine Einschätzung', number_guess: 'Deine Schätzung',
    reaction: 'Deine Reaktion', ranking: 'Deine Reihenfolge', percent_split: 'Punkte verteilen',
    pin_image: 'Setze deinen Pin', open: 'Deine Antwort', wordcloud: 'Dein Stichwort',
    brainstorm: 'Deine Idee', qa: 'Deine Frage', priority_matrix: 'Priorisierung',
  };
  return map[type] || 'Deine Antwort';
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
      $('#participant-root').innerHTML = '<div class="participant-card"><h1>Zeit abgelaufen</h1><p>Bitte warte auf die nächste Karte…</p></div>';
      syncParticipantMobileActionBar();
    }
  }, 1000);
}

// Finde die nächste vorausgehende Sammel-Folie (Brainstorm/Offen/Wortwolke)
// vor der Matrix — für automatisches Item-Sourcing.
function findPrecedingCollectSlide(matrixSlide) {
  const idx = (State.slides || []).findIndex((s) => s.id === matrixSlide.id);
  if (idx < 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const s = State.slides[i];
    if (s.slide_type === 'brainstorm' || s.slide_type === 'open' || s.slide_type === 'wordcloud') return s;
  }
  return null;
}

function getMatrixItems(slide, { fresh = false } = {}) {
  // 0. Vom Presenter gebroadcastete Items (Teilnehmer sehen exakt dieselben
  //    Items wie der Presenter — funktioniert auch im Simulationsmodus).
  if (!fresh) {
    const pushed = getPushedMatrixItems(slide);
    if (pushed?.length) {
      const isParticipantView = Boolean(State.participant && !State.user);
      if (isParticipantView) return sanitizeMatrixItemsList(pushed, slide);
      return assertMatrixItemsIntegrity(pushed, slide);
    }
  }

  // 1. SOP-Workshop-Matrix: NUR die final priorisierten Use Cases (Top-N) übernehmen.
  //    Strikte Quelle: Gesamt-Priorisierung (sopAllTracksVote). Kein Fallback auf
  //    Sammel-Reihenfolge — verhindert falsche Items (z. B. nicht gewählte Use Cases).
  if (slide?.settings?.sopAllTracksMatrix) {
    const count = getFinalMatrixItemCount(slide);
    const allowTrackFallback = !getFinalAllTracksVoteSlide();
    const items = resolveFinalPriorityTopN(count, { allowTrackFallback });
    return assertMatrixItemsIntegrity(items, slide, { count });
  }

  const c = slide?.content || {};
  const source = c.matrixSource || 'auto'; // 'auto' | 'brainstorm' | 'manual'

  // 2. Aus einem Brainstorm/Sammel-Slide (explizit verknüpft oder automatisch der Vorgänger).
  if (source !== 'manual') {
    let srcId = c.brainstormSourceId;
    if (!srcId) {
      const prev = findPrecedingCollectSlide(slide);
      srcId = prev?.id || null;
    }
    if (srcId) {
      const { items } = aggregateBrainstormItems(srcId);
      // Dedupe nach Text, jüngste zuerst, sinnvoll begrenzen.
      const seen = new Set();
      const deduped = [];
      for (let i = items.length - 1; i >= 0; i--) {
        const key = items[i].text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push({ id: items[i].id, text: items[i].text, phase: '', trackLabel: '' });
      }
      return deduped.slice(0, 24);
    }
    // 'auto' ohne Vorgänger → fällt auf manuelle Items zurück (s.u.)
    if (source === 'brainstorm') return [];
  }

  // 3. Manuelle Items aus slide.content.manualItems.
  return (c.manualItems || []).map((t, i) => ({ id: `it-${i}`, text: typeof t === 'string' ? t : (t.text || ''), phase: '', trackLabel: '' }));
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
  const fairVote = isMatrixFairVote(slide);
  const quadrants = c.quadrants || {
    qw: { label: 'Quick Win', icon: 'fa-rocket', desc: 'hoher Impact · niedriger Aufwand' },
    sb: { label: 'Strategic Bet', icon: 'fa-star', desc: 'hoher Impact · hoher Aufwand' },
    ts: { label: 'Time Sink', icon: 'fa-screwdriver-wrench', desc: 'niedriger Impact · hoher Aufwand' },
    dr: { label: 'Drop', icon: 'fa-ban', desc: 'niedriger Impact · niedriger Aufwand' },
  };
  if (!items.length) {
    const hasBroadcastPending = Boolean(State.participant && !State.user && getFinalAllTracksVoteSlide());
    const msg = hasBroadcastPending
      ? 'Die priorisierten Use Cases werden geladen… Bitte kurz warten.'
      : 'Noch keine priorisierten Use Cases. Bitte warte, bis die finale Priorisierung abgeschlossen ist.';
    return `<div class="participant-wait-block"><p class="participant-sop-wait"><i class="fa-solid fa-clock"></i> ${msg}</p></div>`;
  }
  const placeableItems = fairVote ? items.filter((it) => !isOwnMatrixItem(it, slide)) : items;
  const ownItems = fairVote ? items.filter((it) => isOwnMatrixItem(it, slide)) : [];
  const fairHint = fairVote
    ? `<p class="vote-mode-hint matrix-fair-hint"><i class="fa-solid fa-scale-balanced"></i> Ordne <strong>fremde Use Cases</strong> ein — eigene Beiträge (${ownItems.length}) werden vom Team eingeordnet.</p>`
    : '';
  const placements = loadMatrixLocal(slide.id);
  const inQuadrant = (q) => placeableItems.filter((it) => placements[it.id] === q);
  const inPool = placeableItems.filter((it) => !placements[it.id]);
  const itemCard = (it, { readonly = false } = {}) => {
    const origin = [it.trackLabel, it.phase].filter(Boolean).join(' · ');
    const ownCls = readonly ? ' lp-mx-item--own' : '';
    const ownBadge = readonly ? '<span class="vote-own-badge">Mein Beitrag</span>' : '';
    return `<div class="lp-mx-item${ownCls}" data-item-id="${esc(it.id)}" data-text="${esc(it.text)}"${readonly ? ' data-readonly="1"' : ''} title="${esc(useCaseCollectLabel(it.text))}${origin ? ' — ' + esc(origin) : ''}">
    <span class="lp-mx-item-text">${renderUseCaseDisplayHtml(it.text, 'collect')}</span>
    ${origin ? `<span class="lp-mx-item-origin">${esc(origin)}</span>` : ''}
    ${ownBadge}
  </div>`;
  };
  const QICON = { qw: 'fa-rocket', sb: 'fa-star', ts: 'fa-screwdriver-wrench', dr: 'fa-ban' };
  const cellHead = (q) => `<div class="lp-mx-quad-head"><span class="lp-mx-quad-ico"><i class="fa-solid ${QICON[q]}"></i></span><strong>${esc(quadrants[q].label)}</strong></div>`;
  const quad = (q) => `<div class="lp-mx-quad lp-q-${q} lp-mx-cell" data-drop="${q}">${cellHead(q)}<div class="lp-mx-quad-body lp-mx-cell-items">${inQuadrant(q).map((it) => itemCard(it)).join('')}</div></div>`;
  const gridHtml = `${quad('qw')}${quad('sb')}${quad('dr')}${quad('ts')}`;
  const frame = window.LPViz.renderMatrixFrame({
    yLabel: c.yAxisLabel || 'Impact',
    xLabel: c.xAxisLabel || 'Aufwand',
    gridHtml,
  });
  return `<div class="lp-mx-wrap" data-slide-id="${esc(slide.id)}" data-fair-vote="${fairVote ? '1' : '0'}">
    ${fairHint}
    <div class="lp-mx-instructions ws-pill ws-pill--brand"><i class="fa-solid fa-hand-pointer"></i> Use Cases in die Matrix ziehen</div>
    ${frame}
    <div class="lp-mx-pool" data-drop="pool">
      <div class="lp-mx-pool-head"><span class="ws-pill ws-pill--muted"><i class="fa-solid fa-layer-group"></i> Pool</span> <span class="lp-mx-pool-count" id="lp-mx-pool-count">${inPool.length} / ${placeableItems.length}</span></div>
      <div class="lp-mx-pool-items">${inPool.map((it) => itemCard(it)).join('')}</div>
    </div>
    ${ownItems.length ? `<div class="lp-mx-own-section"><div class="lp-mx-pool-head"><span class="ws-pill ws-pill--muted"><i class="fa-solid fa-user"></i> Eigene Beiträge</span></div><div class="lp-mx-pool-items lp-mx-own-items">${ownItems.map((it) => itemCard(it, { readonly: true })).join('')}</div></div>` : ''}
    <div class="lp-mx-mobile">
      <div class="lp-mx-mobile-hint"><i class="fa-solid fa-circle-info"></i> Wähle pro Use Case den passenden Quadranten.</div>
      ${placeableItems.map((it) => {
        const origin = [it.trackLabel, it.phase].filter(Boolean).join(' · ');
        return `<div class="lp-mxm-item" data-item-id="${esc(it.id)}">
          <div class="lp-mxm-text">${renderUseCaseDisplayHtml(it.text, 'collect')}${origin ? `<span class="lp-mxm-origin">${esc(origin)}</span>` : ''}</div>
          <div class="lp-mxm-choices">${['qw', 'sb', 'ts', 'dr'].map((q) => `<button type="button" class="lp-mxm-btn lp-q-${q}${placements[it.id] === q ? ' is-active' : ''}" data-item="${esc(it.id)}" data-q="${q}" aria-label="${esc(quadrants[q].label)}" title="${esc(quadrants[q].label)}"><i class="fa-solid ${QICON[q] || 'fa-square'}"></i></button>`).join('')}</div>
        </div>`;
      }).join('')}
      ${ownItems.map((it) => {
        const origin = [it.trackLabel, it.phase].filter(Boolean).join(' · ');
        return `<div class="lp-mxm-item lp-mxm-item--own" data-item-id="${esc(it.id)}">
          <div class="lp-mxm-text">${renderUseCaseDisplayHtml(it.text, 'collect')}${origin ? `<span class="lp-mxm-origin">${esc(origin)}</span>` : ''}<span class="vote-own-badge">Mein Beitrag</span></div>
        </div>`;
      }).join('')}
    </div>
    <div class="lp-mx-actions">
      <button type="button" class="btn-ghost" id="lp-mx-reset"><i class="fa-solid fa-rotate-left"></i> Zurücksetzen</button>
      <button type="button" class="btn-primary participant-submit" id="lp-mx-submit"><i class="fa-solid fa-paper-plane"></i> Senden <span class="lp-mx-progress">(<span id="lp-mx-progress-n">${Math.max(0, placeableItems.length - inPool.length)}</span>/${placeableItems.length})</span></button>
    </div>
  </div>`;
}

// ─── DRAG-AND-DROP MATRIX (pointer events, mobile+desktop) ─────────
function setupMatrixDragDrop(slide) {
  const wrap = document.querySelector('.lp-mx-wrap[data-slide-id="' + slide.id + '"]');
  if (!wrap) return;
  if (State._matrixDnDAbort) State._matrixDnDAbort.abort(); // alte window-Listener entfernen
  State._matrixDnDAbort = new AbortController();
  const matrixDnDSignal = State._matrixDnDAbort.signal;
  const items = getMatrixItems(slide);
  const placeableItems = isMatrixFairVote(slide)
    ? items.filter((it) => !isOwnMatrixItem(it, slide))
    : items;
  const itemMeta = {};
  items.forEach((it) => { itemMeta[it.id] = { text: it.text, phase: it.phase, trackLabel: it.trackLabel }; });

  let placements = loadMatrixLocal(slide.id);
  // Fair Vote: eigene Einordnungen aus lokalem Entwurf entfernen
  if (isMatrixFairVote(slide)) {
    items.filter((it) => isOwnMatrixItem(it, slide)).forEach((it) => { delete placements[it.id]; });
    saveMatrixLocal(slide.id, placements);
  }

  function countPlaced() {
    return placeableItems.filter((it) => placements[it.id] && placements[it.id] !== 'pool').length;
  }

  function updateProgress() {
    const placed = countPlaced();
    const total = placeableItems.length;
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
    const item = items.find((it) => it.id === itemId);
    if (item && isOwnMatrixItem(item, slide)) return;
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
    if (dragging || item.dataset.readonly === '1') return;
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
      if (item.dataset.readonly === '1') return;
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
  }, { signal: matrixDnDSignal });

  window.addEventListener('pointerup', (e) => {
    if (longpressTimer) { clearTimeout(longpressTimer); longpressTimer = null; }
    if (dragging) endDrag(e);
  }, { signal: matrixDnDSignal });
  window.addEventListener('pointercancel', (e) => {
    if (longpressTimer) { clearTimeout(longpressTimer); longpressTimer = null; }
    if (dragging) endDrag(e);
  }, { signal: matrixDnDSignal });

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

  // ── Mobile: direkte Quadranten-Buttons pro Item (1 Tap statt Cyclen) ──
  function syncMobileItem(itemId) {
    wrap.querySelectorAll(`.lp-mxm-btn[data-item="${cssEscapeLP(itemId)}"]`).forEach((b) => {
      b.classList.toggle('is-active', placements[itemId] === b.dataset.q);
    });
  }
  wrap.querySelectorAll('.lp-mxm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.item;
      const q = btn.dataset.q;
      const next = placements[itemId] === q ? 'pool' : q; // erneuter Tap = abwählen
      setPlacement(itemId, next);
      syncMobileItem(itemId);
      // Grid-DOM ebenfalls aktualisieren, falls sichtbar
      const gridItem = wrap.querySelector(`.lp-mx-grid .lp-mx-item[data-item-id="${cssEscapeLP(itemId)}"]`)
        || wrap.querySelector(`.lp-mx-pool .lp-mx-item[data-item-id="${cssEscapeLP(itemId)}"]`);
      if (gridItem) moveItemToDom(gridItem, next);
    });
  });

  // Reset
  document.getElementById('lp-mx-reset')?.addEventListener('click', () => {
    placements = {};
    saveMatrixLocal(slide.id, placements);
    // Move all items back to pool (Grid)
    const pool = wrap.querySelector('.lp-mx-pool-items');
    if (pool) wrap.querySelectorAll('.lp-mx-grid .lp-mx-item').forEach((it) => pool.appendChild(it));
    // Mobile-Buttons zurücksetzen
    wrap.querySelectorAll('.lp-mxm-btn.is-active').forEach((b) => b.classList.remove('is-active'));
    updateProgress();
  });

  // Submit
  document.getElementById('lp-mx-submit')?.addEventListener('click', () => {
    const placed = countPlaced();
    if (!placed) {
      toast(isMatrixFairVote(slide) ? 'Bitte mindestens einen fremden Use Case einordnen' : 'Bitte mindestens 1 Use Case einsortieren', 'warn');
      return;
    }
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
    hapticFeedback('select');
    rankOrder.push(btn.dataset.id);
    btn.classList.add('is-selected');
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
    const n = $$('.track-vote-option--pick.is-selected').length;
    const el = $('#fav-counter') || $('#top3-counter');
    if (el) {
      el.textContent = `${n} / ${favMax} gewählt`;
      el.style.color = n > favMax ? 'var(--danger)' : n >= 1 && n <= favMax ? 'var(--success)' : 'var(--muted)';
    }
  };
  $$('.track-vote-option--pick').forEach((btn) => btn.addEventListener('click', () => {
    const on = btn.classList.toggle('is-selected');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    hapticFeedback('select');
    if ($$('.track-vote-option--pick.is-selected').length > favMax) {
      btn.classList.remove('is-selected');
      btn.setAttribute('aria-pressed', 'false');
      toast(`Maximal ${favMax} Use Cases`, 'warn');
    }
    updateFavCounter();
  }));
  updateFavCounter();

  const submitFavorites = () => {
    const values = $$('.track-vote-option--pick.is-selected').map((b) => b.dataset.voteId).filter(Boolean);
    const check = validateVoteValues(slide, values);
    if (!check.ok) { toast(check.error, 'warn'); return; }
    submitResponse({ values: check.values });
  };
  $('#submit-favorites')?.addEventListener('click', submitFavorites);
  $('#submit-top3')?.addEventListener('click', submitFavorites);

  $('#vote-mode-toggle')?.addEventListener('click', () => {
    State.participantVoteExpert = !State.participantVoteExpert;
    void renderParticipantQuestion();
  });

  // Auswahlfragen (mc_single / quiz / yesno): markieren → unten „Senden"
  const choiceWrap = $('#choice-wrap');
  if (choiceWrap) {
    let selectedVal = null;
    const submitChoiceBtn = $('#submit-choice');
    choiceWrap.querySelectorAll('.participant-option[data-val]').forEach((btn) => {
      btn.onclick = () => {
        hapticFeedback('select');
        selectedVal = btn.dataset.val;
        choiceWrap.querySelectorAll('.participant-option').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-selected', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (submitChoiceBtn) submitChoiceBtn.disabled = false;
      };
    });
    const sendChoice = () => {
      if (!selectedVal) { toast('Bitte zuerst eine Option wählen', 'warn'); return; }
      submitResponse({ value: selectedVal });
    };
    if (submitChoiceBtn) {
      submitChoiceBtn.addEventListener('click', sendChoice);
    }
  }
  $('#participant-root').querySelectorAll('.participant-reaction-grid [data-emoji]').forEach((btn) => {
    btn.onclick = () => submitResponse({ emoji: btn.dataset.emoji });
  });
  // Zeichen-Counter aktualisieren
  const charN = $('#p-char-n');
  if (charN) {
    const structured = ['#p-uc-summary', '#p-uc-feature', '#p-uc-deps'];
    const fields = structured.some((sel) => $(sel)) ? structured.map((sel) => $(sel)).filter(Boolean) : [$('#p-text')].filter(Boolean);
    const upd = () => {
      charN.textContent = String(fields.reduce((n, el) => n + (el?.value || '').length, 0));
    };
    fields.forEach((el) => el?.addEventListener('input', upd));
    upd();
  }
  const submitText = () => {
    const isCollect = isBrainstormCollectSlide(slide);
    const rawText = readParticipantUseCaseInput(slide);
    const text = filterProfanity(rawText, slide.settings?.profanityFilter !== false);
    if (!text && (slide.settings?.required || isCollect)) {
      toast(isCollect ? 'Bitte Use Case Idee eingeben' : 'Antwort erforderlich', 'warn');
      return;
    }
    const lim = Number(slide.content?.charLimit || 0);
    if (lim > 0 && text.length > lim) { toast(`Maximal ${lim} Zeichen erlaubt`, 'warn'); return; }
    if (isCollect) {
      const maxUc = getCollectResponseLimit(slide);
      if (maxUc > 0 && countParticipantTextResponses(slide.id, State.participant?.id) >= maxUc) {
        toast(`Maximal ${maxUc} Use Case${maxUc === 1 ? '' : 's'} pro Runde`, 'warn');
        return;
      }
    }
    submitResponse({ text, upvotes: 0 });
  };
  const submitTextBtn = $('#submit-text');
  if (submitTextBtn) {
    let touchHandled = false;
    submitTextBtn.addEventListener('touchend', (e) => {
      touchHandled = true;
      e.preventDefault();
      submitText();
    }, { passive: false });
    submitTextBtn.addEventListener('click', () => {
      if (touchHandled) { touchHandled = false; return; }
      submitText();
    });
  }
  $('#submit-num')?.addEventListener('click', () => {
    const val = type === 'scale' ? Number($('#p-range')?.value) : Number($('#p-num')?.value);
    if (!Number.isFinite(val)) { toast('Bitte Zahl eingeben', 'warn'); return; }
    submitResponse({ value: val });
  });
  $('#p-range')?.addEventListener('input', () => {
    const r = $('#p-range');
    const el = $('#p-range-val');
    if (el) el.textContent = r.value;
    r.setAttribute('aria-valuetext', r.value);
  });
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

function getQaUpvotedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(`lp_qa_voted_${State.session?.id || ''}`) || '[]')); }
  catch { return new Set(); }
}

function markQaUpvoted(id) {
  const set = getQaUpvotedIds();
  set.add(id);
  localStorage.setItem(`lp_qa_voted_${State.session?.id || ''}`, JSON.stringify([...set]));
}

async function renderQaList(slide) {
  const list = await loadQaResponses(slide.id);
  const el = $('#qa-list');
  if (!el) return;
  const voted = getQaUpvotedIds();
  const myId = State.participant?.id;
  el.innerHTML = list.length
    ? list.sort((a, b) => (b.response?.upvotes || 0) - (a.response?.upvotes || 0)).slice(0, 10).map((r) => {
      const isOwn = myId && r.participant_id === myId;
      const hasVoted = voted.has(r.id);
      const disabled = isOwn || hasVoted ? ' disabled' : '';
      const title = isOwn ? 'Eigene Frage' : hasVoted ? 'Bereits gevotet' : 'Hochstimmen';
      return `
      <div class="qa-item${isOwn ? ' qa-item--own' : ''}">
        <span>${esc(r.response.text)}${isOwn ? ' <em class="qa-own-tag">(deine Frage)</em>' : ''}</span>
        <button type="button" class="qa-up${hasVoted ? ' is-voted' : ''}" data-id="${r.id}" data-votes="${Number(r.response.upvotes) || 0}" title="${title}"${disabled}>▲ ${Number(r.response.upvotes) || 0}</button>
      </div>`;
    }).join('')
    : '<p style="color:var(--muted);font-size:.85rem">Noch keine Fragen</p>';
  el.querySelectorAll('.qa-up:not([disabled])').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    if (getQaUpvotedIds().has(id)) return;
    const votes = Number(btn.dataset.votes || 0) + 1;
    const row = list.find((r) => r.id === id);
    if (!row) return;
    markQaUpvoted(id);
    await sb.from('lp_responses').update({ response: { ...row.response, upvotes: votes } }).eq('id', id);
    void renderQaList(slide);
  }));
}

// Einheitlicher „Antwort gesendet"-Zustand (gleiches Design wie hasAnsweredSlide).
function showParticipantSentState(message) {
  const slideIndex = State.session?.current_slide_index || 0;
  const root = $('#participant-root');
  if (!root) return;
  root.innerHTML = wrapParticipantSlide(`
    <div class="participant-sent-card">
      <div class="participant-sent-icon"><i class="fa-solid fa-check"></i></div>
      <h1 class="pslide-q-title">Antwort gesendet</h1>
      <p class="pslide-q-prompt">${esc(message || 'Danke! Bitte warte auf die nächste Karte…')}</p>
    </div>`, slideIndex);
  syncParticipantMobileActionBar();
}

async function submitResponse(response) {
  const hostSlide = State.slides[State.session.current_slide_index || 0];
  const slide = resolveParticipantSlide(hostSlide) || hostSlide;
  if (!slide || !State.session.question_open) return;
  if (State._submitting) return; // Doppel-Tap / langsames Netz: kein Zweit-Insert

  if (slide.settings?.askName && !State.participant?.display_name) {
    toast('Bitte mit Namen beitreten', 'warn');
    enterParticipantJoin();
    return;
  }
  if (response.text) response.text = filterProfanity(response.text, slide.settings?.profanityFilter !== false);

  const isCollectText = Boolean(response?.text) && isBrainstormCollectSlide(slide);
  const collectLimit = isCollectText ? getCollectResponseLimit(slide) : 0;
  if (isCollectText && collectLimit > 0) {
    const existing = countParticipantTextResponses(slide.id, State.participant?.id);
    if (existing >= collectLimit) {
      toast(`Maximal ${collectLimit} Use Case${collectLimit === 1 ? '' : 's'} pro Runde`, 'warn');
      return;
    }
  }

  // Quiz: Korrektheit + Punkte in die Antwort schreiben — das Leaderboard liest response.correct/score.
  if (slide.slide_type === 'quiz' && response && typeof response === 'object') {
    const correctId = (slide.content.options || []).find((o) => o.correct)?.id;
    response.correct = response.value === correctId;
    response.score = response.correct ? 100 : 0;
  }

  if (isSopVoteSlide(slide) && response?.values) {
    const voteCheck = validateVoteValues(slide, response.values);
    if (!voteCheck.ok) { toast(voteCheck.error, 'warn'); return; }
    response = { ...response, values: voteCheck.values };
  }

  const isMatrixSlide = slide.slide_type === 'priority_matrix' || slide.settings?.sopAllTracksMatrix;
  if (isMatrixSlide && response?.matrix) {
    const allowedItems = getMatrixItems(slide);
    const allowedIds = new Set(allowedItems.map((i) => i.id));
    let placements = sanitizeMatrixPlacements(response.matrix, allowedIds);
    // Fair Vote: eigene Use Cases dürfen nicht eingeordnet werden
    if (isMatrixFairVote(slide) && State.participant?.id) {
      allowedItems.filter((it) => isOwnMatrixItem(it, slide)).forEach((it) => { delete placements[it.id]; });
    }
    const placeable = isMatrixFairVote(slide)
      ? allowedItems.filter((it) => !isOwnMatrixItem(it, slide))
      : allowedItems;
    if (!Object.keys(placements).length) {
      toast(isMatrixFairVote(slide) ? 'Bitte mindestens einen fremden Use Case einordnen' : 'Bitte mindestens 1 Use Case einsortieren', 'warn');
      return;
    }
    if (placeable.length && !Object.keys(placements).some((id) => placeable.some((p) => p.id === id))) {
      toast('Eigene Beiträge können nicht eingeordnet werden — bitte fremde Use Cases wählen', 'warn');
      return;
    }
    const meta = {};
    allowedItems.forEach((it) => {
      if (placements[it.id]) meta[it.id] = { text: it.text, phase: it.phase, trackLabel: it.trackLabel };
    });
    response = { matrix: placements, meta };
  }

  // Autor-Name direkt in der Antwort speichern (Snapshot), damit "Eingebracht von"
  // robust ist — unabhängig davon, ob der Teilnehmer beim Host gerade in
  // State.participants vorliegt (Realtime-Lücken o. Ä.).
  const responsePayload = (response && typeof response === 'object' && !Array.isArray(response) && State.participant?.display_name)
    ? { ...response, _author: State.participant.display_name }
    : response;

  const row = {
    session_id: State.session.id,
    slide_id: slide.id,
    participant_id: State.participant?.id || null,
    response: responsePayload,
    is_hidden: !!slide.settings?.moderation,
  };

  State._submitting = true;
  const submitBtn = document.querySelector('#participant-action-bar .participant-action-bar-btn, #participant-action-bar [id^="submit-"]');
  setButtonBusy(submitBtn, true, 'Senden…');
  try {
  const { data, error } = await sb.from('lp_responses').insert(row).select().single();
  if (error) {
    State.pendingQueue.push(row);
    localStorage.setItem('lp_pending_queue', JSON.stringify(State.pendingQueue));
    toast('Offline gespeichert – wird nachgereicht', 'warn');
    // View sperren, damit kein versehentliches Doppel-Senden passiert.
    markAnswered(slide.id);
    showParticipantSentState('Offline gespeichert – wird automatisch nachgereicht.');
    return;
  }
  if (data) {
    const idx = State.responses.findIndex((r) => r.id === data.id);
    if (idx >= 0) State.responses[idx] = data;
    else State.responses.push(data);
    maybeRefreshMatrixBroadcastFromVote(data);
  }

  const submittedCount = isCollectText ? countParticipantTextResponses(slide.id, State.participant?.id) : 0;
  const canSubmitMore = isCollectText && collectLimit > 1 && submittedCount < collectLimit;
  if (canSubmitMore) {
    toast(`Use Case ${submittedCount}/${collectLimit} gespeichert — du kannst noch ${collectLimit - submittedCount} eingeben`, 'success');
    void renderParticipantQuestion();
    return;
  }
  markAnswered(slide.id);
  hapticFeedback('success');
  const modMsg = slide.settings?.moderation
    ? 'Zur Freigabe gesendet. Bitte warte auf die nächste Karte…'
    : 'Danke! Bitte warte auf die nächste Karte…';
  showParticipantSentState(modMsg);
  } finally {
    State._submitting = false;
    setButtonBusy(submitBtn, false);
  }
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

// Periodischer Supabase-Abgleich (Host-Präsentation): bestätigt Persistenz + Self-Heal.
setInterval(() => { void verifyLivePersistence(); }, 12000);
window.addEventListener('online', () => { void verifyLivePersistence(); });

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
    State.showPresentCode = true;
    syncPresentCodeBar(true);
    renderPresentParticipants();
    renderPresent();
    bindPresentToolbar();
    void renderQrCode();
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
  $('#btn-add-session-result')?.addEventListener('click', async () => {
    await togglePresentationClosureCard('presentation_results');
    renderEditor();
  });
  bindAddSlideModalControls();
  $('#btn-save-version')?.addEventListener('click', saveVersionSnapshot);
  $('#btn-show-versions')?.addEventListener('click', openVersionsModal);
  $('#editor-sim-toggle')?.addEventListener('click', toggleSimulationMode);
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

function exposeLpAppGlobals() {
  const api = {
    State,
    toast,
    lpConfirm,
    lpPrompt,
    renderDashboard,
    loadPresentations,
    renderPresent,
    renderPresentNow,
    renderParticipantQuestion,
    broadcastSessionPatch,
    applySessionPatch,
    routeFromHash,
    openEditor,
    goDashboard,
    currentSessionSlide,
    changeSlide,
    nextSlide: () => changeSlide(1),
    prevSlide: () => changeSlide(-1),
    deletePresentationsByIds,
    clearDashSelection,
    getDashSelectedIds,
    toggleDashSelection,
    selectDashRange,
    bindDashboardSelection,
    closeModal,
    getSopGroupMeta,
    renderSopEmptyState,
    getDualSopProgress,
    getDualPairTrackLabel,
  };
  window.LPApp = api;
  window.toast = toast;
  window.lpConfirm = lpConfirm;
  window.lpPrompt = lpPrompt;
  window.renderDashboard = renderDashboard;
  window.loadPresentations = loadPresentations;
  window.renderPresent = renderPresent;
  window.renderPresentNow = renderPresentNow;
  window.renderParticipantQuestion = renderParticipantQuestion;
  window.broadcastSessionPatch = broadcastSessionPatch;
  window.applySessionPatch = applySessionPatch;
  window.routeFromHash = routeFromHash;
  window.openEditor = openEditor;
  window.goDashboard = goDashboard;
  window.currentSessionSlide = currentSessionSlide;
  window.changeSlide = changeSlide;
  window.nextSlide = api.nextSlide;
  window.prevSlide = api.prevSlide;
  window.closeModal = closeModal;
  window.LP = window.LP || {};
  window.LP.app = api;
  window.LP.boot = { ok: true, at: Date.now(), build: window.LP_BUILD };
  try {
    window.dispatchEvent(new CustomEvent('lp-app-ready', { detail: { app: api } }));
  } catch (_) { /* noop */ }
}

ensureParticipantActionBarOnBody();
if (PARTICIPANT_MOBILE_MQ) {
  const onParticipantLayoutChange = () => {
    if (!$('#screen-participant')?.classList.contains('active')) return;
    if (State.participant) void renderParticipantQuestion();
    else if (isJoinRoute()) renderParticipantEntry(parseJoinCodeFromHash());
  };
  if (typeof PARTICIPANT_MOBILE_MQ.addEventListener === 'function') {
    PARTICIPANT_MOBILE_MQ.addEventListener('change', onParticipantLayoutChange);
  } else if (typeof PARTICIPANT_MOBILE_MQ.addListener === 'function') {
    PARTICIPANT_MOBILE_MQ.addListener(onParticipantLayoutChange);
  }
}

exposeLpAppGlobals();
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

bindParticipantSettingsSheet();

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
