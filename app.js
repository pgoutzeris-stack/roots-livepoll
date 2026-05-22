/* ROOTS Live Poll – Hauptanwendung */
const SUPABASE_URL = 'https://csmguwcvzreefluhahyu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWd1d2N2enJlZWZsdWhhaHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjM0ODcsImV4cCI6MjA5MjUzOTQ4N30.Fiafx7XBaQZXUX3bKQIBH7znBHx3B51yL-bftOHsL4Q';
const JOIN_BASE = `${location.origin}${location.pathname}#join/`;
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, storage: window.localStorage },
});
window.__rootsSupabaseClient = sb;

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
  saveTimer: null,
  session: null,
  sessionChannel: null,
  responses: [],
  participants: [],
  participant: null,
  deviceId: localStorage.getItem('lp_device_id') || crypto.randomUUID(),
  pendingQueue: JSON.parse(localStorage.getItem('lp_pending_queue') || '[]'),
  dragSlideId: null,
};

localStorage.setItem('lp_device_id', State.deviceId);

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const uid = () => crypto.randomUUID();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function toast(msg, type = 'info') {
  const c = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function showScreen(name) {
  $$('.screen').forEach((s) => s.classList.remove('active'));
  const el = $(`#screen-${name}`);
  if (el) el.classList.add('active');
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

async function loadProfile(user) {
  const { data } = await sb.schema('users').from('profiles')
    .select('id,email,full_name,position,avatar_url,app_role')
    .eq('id', user.id).maybeSingle();
  State.profile = data || { id: user.id, email: user.email, full_name: user.email?.split('@')[0] };
}

/* ─── AUTH ─── */
async function onAuthSession(session) {
  State.user = session.user;
  await loadProfile(session.user);
  if (location.hash.startsWith('#join')) {
    showScreen('participant');
    renderParticipantEntry();
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
        content: s.content,
        settings: { ...window.LP_DEFAULT_SETTINGS, ...(s.settings || {}) },
      }))
    : [{
        presentation_id: pres.id, sort_order: 0, slide_type: 'content',
        content: { title: 'Willkommen', body: 'Füge interaktive Folien hinzu.' },
        settings: { ...window.LP_DEFAULT_SETTINGS },
      }];
  await sb.from('lp_slides').insert(slides);
  closeModal('modal-templates');
  openEditor(pres.id);
}

async function duplicatePresentation(id) {
  const src = State.presentations.find((p) => p.id === id);
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
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:.35rem">${esc(t.category)}</div>
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.desc)}</p>
      <p style="margin-top:.35rem;font-size:.72rem;color:var(--brand)">${esc(t.duration)} · ${esc(t.group)} Pers.</p>
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
}

function renderSlideList() {
  const list = $('#editor-slides');
  list.innerHTML = State.slides.map((s, i) => `
    <div class="slide-thumb ${s.id === State.selectedSlideId ? 'active' : ''}" draggable="true" data-id="${s.id}">
      <div class="slide-thumb-num">${i + 1} · ${esc(window.LP_SLIDE_TYPES.find((t) => t.type === s.slide_type)?.label || s.slide_type)}</div>
      <div class="slide-thumb-title">${esc(s.content?.title || s.content?.prompt || 'Folie')}</div>
    </div>`).join('');
  list.querySelectorAll('.slide-thumb').forEach((el) => {
    el.addEventListener('click', () => { State.selectedSlideId = el.dataset.id; renderEditor(); });
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
}

function currentSlide() {
  return State.slides.find((s) => s.id === State.selectedSlideId) || State.slides[0];
}

function renderEditorCanvas() {
  const slide = currentSlide();
  const canvas = $('#editor-canvas');
  if (!slide) { canvas.innerHTML = '<p>Keine Folien – füge eine hinzu.</p>'; return; }
  const c = slide.content || {};
  let body = '';
  if (slide.slide_type === 'content' || slide.slide_type === 'section') {
    body = `<p>${esc(c.body || c.subtitle || '')}</p>${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="" style="max-width:100%;border-radius:12px;margin-top:1rem">` : ''}`;
  } else if (['mc_single', 'mc_multi', 'quiz', 'ranking', 'percent_split'].includes(slide.slide_type)) {
    body = `<p>${esc(c.prompt || '')}</p><div style="margin-top:1rem;display:grid;gap:.5rem">${(c.options || []).map((o) => `<div style="padding:.75rem;border:1px solid var(--line);border-radius:10px">${esc(o.text)}</div>`).join('')}</div>`;
  } else {
    body = `<p>${esc(c.prompt || '')}</p>`;
  }
  canvas.innerHTML = `<h2>${esc(c.title || c.prompt || 'Folie')}</h2>${body}`;
}

function renderEditorProps() {
  const slide = currentSlide();
  const panel = $('#editor-props');
  if (!slide) { panel.innerHTML = ''; return; }
  const c = slide.content || {};
  const s = slide.settings || {};
  let optionsHtml = '';
  if (['mc_single', 'mc_multi', 'quiz', 'ranking', 'percent_split'].includes(slide.slide_type)) {
    optionsHtml = `<div class="props-label">Optionen</div>${(c.options || []).map((o, i) => `
      <div class="option-row">
        <input data-opt="text" data-idx="${i}" value="${esc(o.text)}" />
        ${slide.slide_type === 'quiz' ? `<input type="checkbox" data-opt="correct" data-idx="${i}" ${o.correct ? 'checked' : ''} title="Richtig" />` : ''}
        <button type="button" data-rm-opt="${i}"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join('')}<button type="button" class="btn-secondary" id="btn-add-option" style="width:100%;margin-top:.35rem">Option</button>`;
  }
  panel.innerHTML = `
    <div class="props-label">Titel</div><input id="prop-title" value="${esc(c.title || '')}" />
    <div class="props-label">Frage / Prompt</div><textarea id="prop-prompt">${esc(c.prompt || c.body || '')}</textarea>
    ${slide.slide_type === 'content' ? `<div class="props-label">Bild-URL</div><input id="prop-image" value="${esc(c.imageUrl || '')}" />` : ''}
    ${slide.slide_type === 'scale' ? `<div class="props-label">Skala</div><input id="prop-min" type="number" value="${c.min ?? 1}" style="width:48%;display:inline-block"> – <input id="prop-max" type="number" value="${c.max ?? 10}" style="width:48%;display:inline-block">` : ''}
    ${optionsHtml}
    <div class="props-label">Einstellungen</div>
    <label class="props-check"><input type="checkbox" id="set-anonymous" ${s.anonymous ? 'checked' : ''}> Anonym</label>
    <label class="props-check"><input type="checkbox" id="set-moderation" ${s.moderation ? 'checked' : ''}> Moderation</label>
    <label class="props-check"><input type="checkbox" id="set-live" ${s.showResultsLive !== false ? 'checked' : ''}> Live-Ergebnisse</label>
    <label class="props-check"><input type="checkbox" id="set-askname" ${s.askName ? 'checked' : ''}> Name abfragen</label>
    <div class="props-label">Zeitlimit (Sek.)</div><input id="set-time" type="number" min="0" value="${s.timeLimitSec || 0}" />`;

  const saveContent = debounce(async () => {
    const slideObj = currentSlide();
    if (!slideObj) return;
    slideObj.content = {
      ...slideObj.content,
      title: $('#prop-title')?.value || '',
      prompt: $('#prop-prompt')?.value || '',
      body: $('#prop-prompt')?.value || slideObj.content.body,
      imageUrl: $('#prop-image')?.value || slideObj.content.imageUrl,
      min: Number($('#prop-min')?.value ?? slideObj.content.min),
      max: Number($('#prop-max')?.value ?? slideObj.content.max),
    };
    slideObj.settings = {
      ...slideObj.settings,
      anonymous: $('#set-anonymous')?.checked,
      moderation: $('#set-moderation')?.checked,
      showResultsLive: $('#set-live')?.checked,
      askName: $('#set-askname')?.checked,
      timeLimitSec: Number($('#set-time')?.value || 0),
    };
    $('#editor-save-status').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Speichert…';
    await sb.from('lp_slides').update({ content: slideObj.content, settings: slideObj.settings }).eq('id', slideObj.id);
    await sb.from('lp_presentations').update({ updated_at: new Date().toISOString() }).eq('id', State.presentation.id);
    $('#editor-save-status').innerHTML = '<i class="fa-solid fa-cloud"></i> Gespeichert';
    renderEditorCanvas();
  }, 800);

  panel.querySelectorAll('input,textarea').forEach((el) => el.addEventListener('input', saveContent));
  panel.querySelectorAll('[data-rm-opt]').forEach((btn) => btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.rmOpt);
    currentSlide().content.options.splice(idx, 1);
    saveContent();
    renderEditorProps();
  }));
  $('#btn-add-option')?.addEventListener('click', () => {
    const slideObj = currentSlide();
    slideObj.content.options = slideObj.content.options || [];
    slideObj.content.options.push({ id: uid().slice(0, 8), text: 'Neue Option' });
    saveContent();
    renderEditorProps();
  });
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
      const sort = State.slides.length;
      const { data } = await sb.from('lp_slides').insert({
        presentation_id: State.presentation.id,
        sort_order: sort,
        slide_type: type,
        content: JSON.parse(JSON.stringify(window.LP_DEFAULT_CONTENT[type] || { title: 'Neu' })),
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

/* ─── SESSION / PRESENT ─── */
async function startPresentation() {
  let code = genCode();
  for (let i = 0; i < 5; i++) {
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
  location.hash = `#present/${session.id}`;
  showScreen('present');
  await loadSessionData();
  subscribeSessionChannel();
  renderPresent();
  bindPresentToolbar();
}

async function loadSessionData() {
  const [{ data: slides }, { data: responses }, { data: participants }] = await Promise.all([
    sb.from('lp_slides').select('*').eq('presentation_id', State.session.presentation_id).order('sort_order'),
    sb.from('lp_responses').select('*').eq('session_id', State.session.id),
    sb.from('lp_participants').select('*').eq('session_id', State.session.id),
  ]);
  State.slides = slides || [];
  State.responses = responses || [];
  State.participants = participants || [];
}

function subscribeSessionChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  State.sessionChannel = sb.channel(`lp-session-${State.session.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      State.session = { ...State.session, ...payload.new };
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_responses', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      State.responses.push(payload.new);
      renderPresent();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lp_participants', filter: `session_id=eq.${State.session.id}` }, (payload) => {
      State.participants.push(payload.new);
      updatePresentStats();
    })
    .subscribe();
}

function currentSessionSlide() {
  return State.slides[State.session?.current_slide_index || 0];
}

function renderPresent() {
  const slide = currentSessionSlide();
  const stage = $('#present-stage');
  if (!slide) { stage.innerHTML = '<h1>Keine Folien</h1>'; return; }
  const c = slide.content || {};
  const agg = window.LPViz.aggregateResponses(slide, State.responses.filter((r) => r.slide_id === slide.id));
  const viz = (slide.settings?.showResultsLive !== false && State.session.question_open)
    ? window.LPViz.renderViz(slide, agg, 'present')
    : `<div style="color:#64748b;margin-top:1rem">${State.session.question_open ? 'Antworten werden gesammelt…' : 'Frage geschlossen'}</div>`;
  stage.innerHTML = `
    <div style="font-size:.85rem;color:#64748b;margin-bottom:.5rem">Folie ${(State.session.current_slide_index || 0) + 1} / ${State.slides.length}</div>
    <h1>${esc(c.title || c.prompt || 'Folie')}</h1>
    <p style="color:#94a3b8;max-width:720px">${esc(c.prompt || c.body || '')}</p>
    <div class="viz-wrap">${viz}</div>`;
  updatePresentStats();
  renderQrCode();
}

function updatePresentStats() {
  const slide = currentSessionSlide();
  const count = State.responses.filter((r) => r.slide_id === slide?.id).length;
  $('#present-stats').textContent = `${State.participants.length} Teilnehmer · ${count} Antworten`;
}

function renderQrCode() {
  if (!State.session || typeof QRCode === 'undefined') return;
  const url = `${JOIN_BASE}${State.session.code}`;
  $('#present-join-url').textContent = url;
  $('#present-code-text').textContent = State.session.code;
  QRCode.toCanvas($('#present-qr'), url, { width: 120, margin: 1 });
}

function bindPresentToolbar() {
  const bar = $('#present-toolbar');
  let hideTimer;
  const showBar = () => { bar.classList.remove('hidden'); clearTimeout(hideTimer); hideTimer = setTimeout(() => bar.classList.add('hidden'), 3000); };
  document.addEventListener('mousemove', showBar);
  showBar();
  $('#present-prev').onclick = () => changeSlide(-1);
  $('#present-next').onclick = () => changeSlide(1);
  $('#present-toggle-question').onclick = async () => {
    await sb.from('lp_sessions').update({ question_open: !State.session.question_open }).eq('id', State.session.id);
    State.session.question_open = !State.session.question_open;
    renderPresent();
  };
  $('#present-show-code').onclick = () => $('#present-code-bar').classList.toggle('hidden');
  $('#present-end').onclick = async () => {
    if (!confirm('Session beenden?')) return;
    await sb.from('lp_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', State.session.id);
    location.hash = `#results/${State.session.id}`;
    await openResults(State.session.id);
  };
}

async function changeSlide(delta) {
  const next = clamp((State.session.current_slide_index || 0) + delta, 0, State.slides.length - 1);
  await sb.from('lp_sessions').update({ current_slide_index: next, question_open: true }).eq('id', State.session.id);
  State.session.current_slide_index = next;
  State.session.question_open = true;
  renderPresent();
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ─── PARTICIPANT ─── */
function renderParticipantEntry(codePrefill) {
  const root = $('#participant-root');
  root.innerHTML = `
    <div class="participant-card">
      <h1>Live teilnehmen</h1>
      <p>Code eingeben – kein Account nötig.</p>
      <input class="participant-code-input" id="join-code" maxlength="8" placeholder="CODE" value="${esc(codePrefill || '')}" />
      <input class="form-group input" id="join-name" placeholder="Name (optional)" style="width:100%;height:44px;padding:0 14px;border:1.5px solid var(--line);border-radius:10px;margin-bottom:1rem" />
      <button type="button" class="btn-primary participant-submit" id="join-submit"><i class="fa-solid fa-arrow-right"></i> Beitreten</button>
    </div>`;
  $('#join-submit').onclick = () => joinSession($('#join-code').value.trim().toUpperCase(), $('#join-name').value.trim());
  $('#join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#join-submit').click(); });
}

async function joinSession(code, name) {
  const { data: session, error } = await sb.from('lp_sessions').select('*').eq('code', code.toUpperCase()).in('status', ['live', 'paused']).maybeSingle();
  if (error || !session) { toast('Code ungültig oder Session beendet', 'error'); return; }
  if (session.join_locked) { toast('Beitritt gesperrt', 'error'); return; }
  const { data: part, error: pErr } = await sb.from('lp_participants').upsert({
    session_id: session.id,
    device_id: State.deviceId,
    display_name: name || null,
  }, { onConflict: 'session_id,device_id' }).select().single();
  if (pErr) { toast(pErr.message, 'error'); return; }
  State.session = session;
  State.participant = part;
  const { data: slides } = await sb.from('lp_slides').select('*').eq('presentation_id', session.presentation_id).order('sort_order');
  State.slides = slides || [];
  subscribeParticipantChannel();
  renderParticipantQuestion();
}

function subscribeParticipantChannel() {
  if (State.sessionChannel) sb.removeChannel(State.sessionChannel);
  State.sessionChannel = sb.channel(`lp-part-${State.session.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lp_sessions', filter: `id=eq.${State.session.id}` }, (payload) => {
      State.session = { ...State.session, ...payload.new };
      if (State.session.status === 'ended') {
        $('#participant-root').innerHTML = '<div class="participant-card"><h1>Session beendet</h1><p>Vielen Dank für deine Teilnahme.</p></div>';
        return;
      }
      renderParticipantQuestion();
    })
    .subscribe();
}

function renderParticipantQuestion() {
  const slide = State.slides[State.session.current_slide_index || 0];
  const root = $('#participant-root');
  if (!slide) { root.innerHTML = '<div class="participant-card"><p>Warte auf Folie…</p></div>'; return; }
  if (!State.session.question_open) {
    root.innerHTML = `<div class="participant-card"><h1>${esc(slide.content?.title || 'Warte…')}</h1><p>Die Frage ist geschlossen. Bitte warte auf die nächste Folie.</p></div>`;
    return;
  }
  const c = slide.content || {};
  const type = slide.slide_type;
  let input = '';
  if (type === 'mc_single' || type === 'quiz' || type === 'yesno') {
    const opts = type === 'yesno'
      ? [{ id: 'yes', text: 'Ja' }, { id: 'no', text: 'Nein' }]
      : (c.options || []);
    input = opts.map((o) => `<button type="button" class="participant-option" data-val="${esc(o.id)}">${esc(o.text)}</button>`).join('');
  } else if (type === 'mc_multi') {
    input = `<div id="multi-wrap">${(c.options || []).map((o) => `<label class="props-check"><input type="checkbox" value="${esc(o.id)}"> ${esc(o.text)}</label>`).join('')}</div><button type="button" class="btn-primary participant-submit" id="submit-multi">Senden</button>`;
  } else if (type === 'wordcloud' || type === 'open' || type === 'brainstorm' || type === 'qa') {
    input = `<textarea id="p-text" rows="3" style="width:100%;padding:.75rem;border:1.5px solid var(--line);border-radius:10px" placeholder="${esc(c.prompt || 'Antwort')}"></textarea><button type="button" class="btn-primary participant-submit" id="submit-text">Senden</button>`;
  } else if (type === 'scale' || type === 'number_guess') {
    input = `<input id="p-num" type="number" min="${c.min ?? 0}" max="${c.max ?? 100}" style="width:100%;height:48px;font-size:1.25rem;text-align:center;border:1.5px solid var(--line);border-radius:10px"><button type="button" class="btn-primary participant-submit" id="submit-num" style="margin-top:.75rem">Senden</button>`;
  } else if (type === 'reaction') {
    input = ['👍', '👎', '❤️', '😂', '😮', '👏'].map((e) => `<button type="button" class="participant-option" data-emoji="${e}" style="font-size:1.5rem">${e}</button>`).join('');
  } else {
    input = `<p style="color:var(--muted)">Diese Folie ist nur zur Anzeige.</p>`;
  }
  root.innerHTML = `<div class="participant-card"><div style="font-size:.78rem;color:var(--muted);margin-bottom:.35rem">Code ${esc(State.session.code)}</div><h1>${esc(c.title || c.prompt || 'Frage')}</h1><p>${esc(c.prompt || '')}</p>${input}</div>`;

  root.querySelectorAll('.participant-option[data-val]').forEach((btn) => {
    btn.onclick = () => submitResponse({ value: btn.dataset.val });
  });
  root.querySelectorAll('.participant-option[data-emoji]').forEach((btn) => {
    btn.onclick = () => submitResponse({ emoji: btn.dataset.emoji });
  });
  $('#submit-text')?.addEventListener('click', () => submitResponse({ text: $('#p-text').value.trim() }));
  $('#submit-num')?.addEventListener('click', () => submitResponse({ value: Number($('#p-num').value) }));
  $('#submit-multi')?.addEventListener('click', () => {
    const values = Array.from($('#multi-wrap').querySelectorAll('input:checked')).map((i) => i.value);
    submitResponse({ values });
  });
}

async function submitResponse(response) {
  const slide = State.slides[State.session.current_slide_index || 0];
  if (!slide) return;
  const row = {
    session_id: State.session.id,
    slide_id: slide.id,
    participant_id: State.participant?.id || null,
    response,
  };
  const { error } = await sb.from('lp_responses').insert(row);
  if (error) {
    State.pendingQueue.push(row);
    localStorage.setItem('lp_pending_queue', JSON.stringify(State.pendingQueue));
    toast('Offline gespeichert – wird nachgereicht', 'warn');
    return;
  }
  $('#participant-root').innerHTML = `<div class="participant-card"><h1>Danke!</h1><p>Antwort gesendet. Warte auf die nächste Frage…</p></div>`;
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

/* ─── RESULTS ─── */
async function openResults(sessionId) {
  const { data: session } = await sb.from('lp_sessions').select('*').eq('id', sessionId).single();
  State.session = session;
  await loadSessionData();
  showScreen('results');
  const content = $('#results-content');
  content.innerHTML = State.slides.map((slide) => {
    const agg = window.LPViz.aggregateResponses(slide, State.responses.filter((r) => r.slide_id === slide.id));
    return `<section style="background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:1.25rem;margin-bottom:1rem"><h2 style="margin-bottom:.75rem">${esc(slide.content?.title || 'Folie')}</h2>${window.LPViz.renderViz(slide, agg, 'editor')}</section>`;
  }).join('');
}

function exportCsv() {
  const rows = [['session_id', 'slide_id', 'participant_id', 'response', 'created_at']];
  State.responses.forEach((r) => rows.push([r.session_id, r.slide_id, r.participant_id, JSON.stringify(r.response), r.created_at]));
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `livepoll-${State.session?.code || 'export'}.csv`;
  a.click();
}

/* ─── MODALS / ROUTING ─── */
function openModal(id) { document.getElementById(id)?.classList.add('visible'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('visible'); }
window.closeModal = closeModal;

async function routeFromHash() {
  const hash = location.hash.replace(/^#/, '');
  if (hash.startsWith('join')) {
    const code = hash.split('/')[1] || '';
    showScreen('participant');
    renderParticipantEntry(code);
    return;
  }
  if (hash.startsWith('present/')) {
    const id = hash.split('/')[1];
    const { data: session } = await sb.from('lp_sessions').select('*').eq('id', id).maybeSingle();
    if (!session) return;
    State.session = session;
    await loadSessionData();
    showScreen('present');
    subscribeSessionChannel();
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
    await onAuthSession(session);
    await openEditor(hash.split('/')[1]);
    return;
  }
  const { data: { session } } = await sb.auth.getSession();
  if (session) await onAuthSession(session);
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
  $('#btn-join-as-participant')?.addEventListener('click', () => { location.hash = '#join'; showScreen('participant'); renderParticipantEntry(); });
  $('#editor-back')?.addEventListener('click', () => { location.hash = '#dashboard'; showScreen('dashboard'); loadPresentations().then(renderDashboard); });
  $('#btn-add-slide')?.addEventListener('click', () => { renderAddSlideModal(); openModal('modal-add-slide'); });
  $('#btn-save-version')?.addEventListener('click', saveVersionSnapshot);
  $('#btn-start-present')?.addEventListener('click', startPresentation);
  $('#editor-title')?.addEventListener('input', debounce(async (e) => {
    State.presentation.title = e.target.value;
    await sb.from('lp_presentations').update({ title: e.target.value }).eq('id', State.presentation.id);
  }, 500));
  $$('.modal-close').forEach((btn) => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));
  $('#results-back')?.addEventListener('click', () => { location.hash = '#dashboard'; showScreen('dashboard'); });
  $('#btn-export-csv')?.addEventListener('click', exportCsv);
}

window.addEventListener('hashchange', routeFromHash);
window.addEventListener('roots-auth-ready', (e) => { if (e.detail?.session) void onAuthSession(e.detail.session); });
sb.auth.onAuthStateChange((_ev, session) => { if (session) void onAuthSession(session); });

bindUi();
void flushPendingQueue();
void routeFromHash();
if (document.documentElement.classList.contains('in-iframe')) {
  const loginCard = $('#screen-login .login-card');
  if (loginCard) loginCard.innerHTML = '<p style="text-align:center;color:var(--muted)"><i class="fa-solid fa-spinner fa-spin"></i> Anmeldung über Intranet…</p>';
  void window.RootsUserBridge?.syncAuthFromParentStorage?.();
}
