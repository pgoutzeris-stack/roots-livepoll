/* ════════════════════════════════════════════════════════════════
   ROOTS Live Poll – Feature Layer
   Wird NACH app.js geladen. Erweitert die State + UI um:
   - Timer / Countdown
   - Quiz-Leaderboard
   - Q&A-Upvoting
   - Reaction-Stream (Floating Emojis)
   - Auto-Advance
   - Anonymous-Mode pro Slide
   - Slide-Notes (privat für Präsentator)
   - Self-Paced Hinweise
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── INTEGRATION HOOKS ────────────────────────────────────────
  // Wir hooken uns in renderPresent + renderParticipantQuestion ein,
  // ohne den Original-Code zu überschreiben.

  const origRenderPresent = window.renderPresent;
  const origRenderParticipantQuestion = window.renderParticipantQuestion;
  const State = window.State || {};

  // ═════════════════════════════════════════════════════════════
  // 1) TIMER / COUNTDOWN
  // ═════════════════════════════════════════════════════════════
  const Timer = {
    intervalId: null,
    endsAt: null,
    slideId: null,
    expired: false,

    start(slide) {
      this.stop();
      const seconds = Number(slide?.settings?.timer?.seconds || 0);
      if (!seconds) return;
      this.slideId = slide.id;
      this.endsAt = Date.now() + seconds * 1000;
      this.expired = false;
      this.render();
      this.intervalId = setInterval(() => this.render(), 250);
    },

    stop() {
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
      this.endsAt = null;
      this.slideId = null;
      this.expired = false;
      const bar = document.getElementById('lp-timer-bar');
      if (bar) bar.remove();
    },

    render() {
      if (!this.endsAt) return;
      const remaining = Math.max(0, this.endsAt - Date.now());
      const seconds = Number(State.slides?.find(s => s.id === this.slideId)?.settings?.timer?.seconds || 0);
      const percent = seconds > 0 ? (remaining / (seconds * 1000)) * 100 : 0;
      let bar = document.getElementById('lp-timer-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'lp-timer-bar';
        bar.className = 'lp-timer-bar';
        bar.innerHTML = `<div class="lp-timer-fill"></div><div class="lp-timer-label"></div>`;
        const stage = document.getElementById('present-stage');
        (stage || document.body).appendChild(bar);
      }
      const fill = bar.querySelector('.lp-timer-fill');
      const label = bar.querySelector('.lp-timer-label');
      if (fill) {
        fill.style.width = percent + '%';
        fill.classList.toggle('warn', percent < 30 && percent > 10);
        fill.classList.toggle('danger', percent <= 10);
      }
      if (label) {
        const secLeft = Math.ceil(remaining / 1000);
        const mins = Math.floor(secLeft / 60);
        const s = secLeft % 60;
        label.textContent = mins > 0 ? `${mins}:${String(s).padStart(2, '0')}` : `${s}s`;
      }
      if (remaining <= 0 && !this.expired) {
        this.expired = true;
        const slide = State.slides?.find(s => s.id === this.slideId);
        if (slide?.settings?.timer?.autoClose && typeof window.broadcastSessionPatch === 'function') {
          window.broadcastSessionPatch({ question_open: false });
          if (window.State) window.State.session = { ...window.State.session, question_open: false };
        }
        try { navigator.vibrate?.(120); } catch (_) {}
        playBeep();
      }
    },
  };
  window.LP_Timer = Timer;

  function playBeep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(); const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.value = 880; g.gain.value = 0.04;
      o.start(); setTimeout(() => { o.stop(); ac.close(); }, 180);
    } catch (_) { /* no audio */ }
  }

  // ═════════════════════════════════════════════════════════════
  // 2) QUIZ-LEADERBOARD
  // ═════════════════════════════════════════════════════════════
  function computeLeaderboard() {
    const quizSlides = (State.slides || []).filter(s => s.slide_type === 'quiz');
    if (!quizSlides.length) return [];
    const slideIds = new Set(quizSlides.map(s => s.id));
    const scores = new Map();
    (State.responses || []).forEach(r => {
      if (!slideIds.has(r.slide_id) || r.is_hidden) return;
      const pid = r.participant_id; if (!pid) return;
      const rec = scores.get(pid) || { participantId: pid, correct: 0, answered: 0, score: 0, lastAt: 0 };
      rec.answered++;
      if (r.response?.correct === true) rec.correct++;
      rec.score += Number(r.response?.score || (r.response?.correct ? 100 : 0));
      const ts = new Date(r.created_at).getTime();
      if (ts > rec.lastAt) rec.lastAt = ts;
      scores.set(pid, rec);
    });
    const result = Array.from(scores.values()).map(s => {
      const p = (State.participants || []).find(x => x.id === s.participantId);
      return { ...s, name: p?.display_name || 'Gast', emoji: p?.avatar_emoji || '🦊', color: p?.avatar_color || '#206efb' };
    });
    result.sort((a, b) => b.score - a.score || b.correct - a.correct || a.lastAt - b.lastAt);
    return result;
  }

  function renderLeaderboard(maxN = 10) {
    const board = computeLeaderboard().slice(0, maxN);
    if (!board.length) return '';
    const rowsHtml = board.map((r, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `<span class="lp-lb-rank">${rank}</span>`;
      return `
        <div class="lp-lb-row" data-rank="${rank}">
          <div class="lp-lb-medal">${medal}</div>
          <div class="lp-lb-avatar" style="background:${r.color}">${r.emoji}</div>
          <div class="lp-lb-name">${escapeHtml(r.name)}</div>
          <div class="lp-lb-stats">${r.correct}/${r.answered} richtig</div>
          <div class="lp-lb-score">${Math.round(r.score)}</div>
        </div>`;
    }).join('');
    return `
      <div class="lp-leaderboard">
        <div class="lp-lb-head"><i class="fa-solid fa-trophy"></i> Leaderboard</div>
        <div class="lp-lb-body">${rowsHtml}</div>
      </div>`;
  }
  window.LP_renderLeaderboard = renderLeaderboard;

  // ═════════════════════════════════════════════════════════════
  // 3) Q&A UPVOTING
  // ═════════════════════════════════════════════════════════════
  const QnaUpvotes = {
    cache: new Map(), // responseId -> count
    myVotes: new Set(JSON.parse(localStorage.getItem('lp_qna_upvotes') || '[]')),

    async loadForSession(sessionId) {
      if (!window.sb) return;
      try {
        const slideIds = (State.slides || []).filter(s => s.slide_type === 'qa').map(s => s.id);
        if (!slideIds.length) return;
        const respIds = (State.responses || []).filter(r => slideIds.includes(r.slide_id)).map(r => r.id);
        if (!respIds.length) return;
        const { data } = await window.sb.from('lp_qna_upvotes').select('response_id').in('response_id', respIds);
        this.cache.clear();
        (data || []).forEach(row => {
          this.cache.set(row.response_id, (this.cache.get(row.response_id) || 0) + 1);
        });
      } catch (e) { console.warn('[QnA Upvotes load]', e); }
    },

    count(responseId) { return this.cache.get(responseId) || 0; },
    didVote(responseId) { return this.myVotes.has(responseId); },

    async vote(responseId) {
      if (this.myVotes.has(responseId)) return;
      const deviceId = State.deviceId || localStorage.getItem('lp_device_id');
      try {
        const { error } = await window.sb.from('lp_qna_upvotes').insert({ response_id: responseId, device_id: deviceId });
        if (!error) {
          this.myVotes.add(responseId);
          this.cache.set(responseId, (this.cache.get(responseId) || 0) + 1);
          localStorage.setItem('lp_qna_upvotes', JSON.stringify(Array.from(this.myVotes)));
          this.rerender();
          try { navigator.vibrate?.(30); } catch (_) {}
        }
      } catch (e) { console.warn('[QnA upvote]', e); }
    },

    rerender() {
      document.querySelectorAll('[data-qna-upvote]').forEach(btn => {
        const id = btn.dataset.qnaUpvote;
        const count = this.count(id);
        const voted = this.didVote(id);
        btn.classList.toggle('voted', voted);
        const span = btn.querySelector('.upvote-count');
        if (span) span.textContent = count;
      });
    },

    bindParticipant(root) {
      (root || document).querySelectorAll('[data-qna-upvote]').forEach(btn => {
        btn.onclick = () => this.vote(btn.dataset.qnaUpvote);
      });
    },
  };
  window.LP_QnaUpvotes = QnaUpvotes;

  // ═════════════════════════════════════════════════════════════
  // 4) REACTION STREAM (Floating Emojis)
  // ═════════════════════════════════════════════════════════════
  const Reactions = {
    container: null,

    ensureContainer() {
      if (this.container && document.body.contains(this.container)) return this.container;
      this.container = document.createElement('div');
      this.container.id = 'lp-reaction-stream';
      this.container.className = 'lp-reaction-stream';
      this.container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.container);
      return this.container;
    },

    spawn(emoji) {
      const c = this.ensureContainer();
      const el = document.createElement('div');
      el.className = 'lp-reaction';
      el.textContent = emoji;
      el.style.left = (10 + Math.random() * 80) + '%';
      el.style.fontSize = (24 + Math.random() * 16) + 'px';
      el.style.animationDuration = (2.2 + Math.random() * 1.4) + 's';
      c.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    },

    broadcast(emoji) {
      this.spawn(emoji);
      try {
        State.sessionChannel?.send({ type: 'broadcast', event: 'reaction', payload: { emoji } });
      } catch (_) {}
    },
  };
  window.LP_Reactions = Reactions;

  // ═════════════════════════════════════════════════════════════
  // 5) AUTO-ADVANCE
  // ═════════════════════════════════════════════════════════════
  function maybeAutoAdvance() {
    const slide = window.currentSessionSlide?.();
    if (!slide) return;
    const targetPct = Number(slide.settings?.autoAdvance || 0);
    if (!targetPct || targetPct < 1) return;
    const totalParticipants = (State.participants || []).length;
    if (totalParticipants < 1) return;
    const visible = (State.responses || []).filter(r => r.slide_id === slide.id && !r.is_hidden);
    const uniqueParts = new Set(visible.map(r => r.participant_id).filter(Boolean)).size;
    const pct = (uniqueParts / totalParticipants) * 100;
    if (pct >= targetPct && !slide._advanced) {
      slide._advanced = true;
      setTimeout(() => {
        if (typeof window.nextSlide === 'function') window.nextSlide();
      }, 800);
    }
  }
  window.LP_maybeAutoAdvance = maybeAutoAdvance;

  // ═════════════════════════════════════════════════════════════
  // 6) PARTICIPANT OPTIMISTIC UI
  // ═════════════════════════════════════════════════════════════
  // Patches: bei submitResponse zeige sofort "✓ Empfangen" Animation
  window.LP_showOptimisticConfirm = function (root) {
    const r = root || document.getElementById('participant-root') || document.body;
    const el = document.createElement('div');
    el.className = 'lp-submit-confirm';
    el.innerHTML = '<i class="fa-solid fa-check"></i> Antwort gesendet';
    r.appendChild(el);
    setTimeout(() => el.remove(), 1800);
    try { navigator.vibrate?.(50); } catch (_) {}
  };

  // ═════════════════════════════════════════════════════════════
  // 7) HOOK INTO RENDER PIPELINE
  // ═════════════════════════════════════════════════════════════
  function wrappedRenderPresent(...args) {
    const result = typeof origRenderPresent === 'function' ? origRenderPresent(...args) : undefined;
    try {
      const slide = window.currentSessionSlide?.();
      if (!slide) { Timer.stop(); return result; }

      // Start timer on slide change (if open + has timer)
      if (State.session?.question_open && slide.settings?.timer?.seconds) {
        if (Timer.slideId !== slide.id) Timer.start(slide);
      } else {
        Timer.stop();
      }

      // Inject leaderboard for quiz slides (presenter view)
      if (slide.slide_type === 'quiz' && slide.settings?.showLeaderboard !== false) {
        const stage = document.getElementById('present-stage');
        if (stage && !stage.querySelector('.lp-leaderboard')) {
          stage.insertAdjacentHTML('beforeend', renderLeaderboard(5));
        }
      }

      // Inject quiz overall leaderboard on "results" closure slide
      if (slide.slide_type === 'content' && slide.content?.kind === 'session_results') {
        const stage = document.getElementById('present-stage');
        if (stage && !stage.querySelector('.lp-leaderboard')) {
          stage.insertAdjacentHTML('beforeend', renderLeaderboard(10));
        }
      }

      // Auto-advance check
      maybeAutoAdvance();

      // Q&A upvotes load
      if (slide.slide_type === 'qa') QnaUpvotes.loadForSession(State.session?.id).then(() => QnaUpvotes.rerender());
    } catch (e) { console.warn('[LP wrappedRenderPresent]', e); }
    return result;
  }

  async function wrappedRenderParticipantQuestion(...args) {
    const result = typeof origRenderParticipantQuestion === 'function' ? await origRenderParticipantQuestion(...args) : undefined;
    try {
      const slide = window.currentSessionSlide?.();
      if (!slide) return result;
      // Timer also visible on participant side
      if (State.session?.question_open && slide.settings?.timer?.seconds) {
        if (Timer.slideId !== slide.id) Timer.start(slide);
      } else {
        Timer.stop();
      }
      // Q&A upvote buttons
      if (slide.slide_type === 'qa') {
        await QnaUpvotes.loadForSession(State.session?.id);
        QnaUpvotes.rerender();
        QnaUpvotes.bindParticipant(document.getElementById('participant-root'));
      }
    } catch (e) { console.warn('[LP wrappedRenderParticipantQuestion]', e); }
    return result;
  }

  // Install wrappers (deferred so app.js fully loaded)
  function installHooks() {
    if (typeof window.renderPresent === 'function') {
      window.renderPresent = wrappedRenderPresent;
    }
    if (typeof window.renderParticipantQuestion === 'function') {
      window.renderParticipantQuestion = wrappedRenderParticipantQuestion;
    }
  }
  if (document.readyState === 'complete') installHooks();
  else window.addEventListener('load', installHooks);

  // ═════════════════════════════════════════════════════════════
  // 8) REACTION BROADCAST LISTENER
  // ═════════════════════════════════════════════════════════════
  // Wenn die Session-Channel via app.js subscribed wird, fügen wir
  // einen Reaction-Listener nachträglich an. Wir warten auf Channel.
  setInterval(() => {
    const ch = State.sessionChannel;
    if (!ch || ch._lpReactionsBound) return;
    try {
      ch.on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (payload?.emoji) Reactions.spawn(payload.emoji);
      });
      ch._lpReactionsBound = true;
    } catch (_) { /* not subscribable yet */ }
  }, 1500);

  // ═════════════════════════════════════════════════════════════
  // 9) UI: REACTION QUICK-BAR (Presenter)
  // ═════════════════════════════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.screen === 'present' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const map = { '1': '👍', '2': '❤️', '3': '🎉', '4': '😂', '5': '😮', '6': '👏', '7': '🔥' };
      if (map[e.key]) Reactions.broadcast(map[e.key]);
    }
  });

  // ─── Helper ───────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Set body data-attribute for screen-specific shortcuts
  const screenObserver = new MutationObserver(() => {
    const active = document.querySelector('.screen.active');
    if (active) document.body.dataset.screen = active.id.replace('screen-', '');
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.screen').forEach(s => screenObserver.observe(s, { attributes: true, attributeFilter: ['class'] }));
  });
})();
