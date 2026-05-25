/* ════════════════════════════════════════════════════════════════
   ROOTS Live Poll – Core Resilience & Foundation Layer
   Wird VOR app.js geladen. Definiert globale Utilities, die app.js
   verwendet bzw. die window-globalen Verhaltensmuster setzen.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── BUILD INFO ──────────────────────────────────────
  window.LP_BUILD = window.LP_BUILD || (document.querySelector('meta[name="lp-build"]')?.content || 'dev');

  // ─── GLOBAL ERROR REPORTER ───────────────────────────
  const errorBuffer = [];
  const MAX_ERR = 50;

  function reportError(err, context) {
    const entry = {
      ts: Date.now(),
      msg: err?.message || String(err),
      stack: err?.stack || null,
      context: context || null,
      url: location.href,
      ua: navigator.userAgent,
      build: window.LP_BUILD,
    };
    errorBuffer.push(entry);
    if (errorBuffer.length > MAX_ERR) errorBuffer.shift();
    try {
      localStorage.setItem('lp_error_log', JSON.stringify(errorBuffer.slice(-20)));
    } catch (_) { /* quota */ }
    // Mirror to console for dev
    console.error('[LP]', context || '', err);
  }

  window.addEventListener('error', (e) => {
    reportError(e.error || new Error(e.message), { kind: 'window.error', filename: e.filename, line: e.lineno });
  });
  window.addEventListener('unhandledrejection', (e) => {
    reportError(e.reason || new Error('Unhandled rejection'), { kind: 'unhandledrejection' });
  });

  // ─── SUPABASE WRAPPER ────────────────────────────────
  // Wraps a Supabase query promise — surfaces errors visibly + logs.
  // Usage:
  //   await LP.sb('loadPresentations', () => sb.from('lp_presentations').select('*'));
  async function sbCall(label, fn) {
    try {
      const r = await fn();
      if (r && r.error) {
        reportError(r.error, { kind: 'supabase', label });
        throw r.error;
      }
      return r;
    } catch (e) {
      reportError(e, { kind: 'supabase-throw', label });
      // Show toast only if it's a real error (not just no-rows)
      if (window.toast && (!e.code || e.code !== 'PGRST116')) {
        window.toast(`Fehler: ${e.message || e}`, 'error');
      }
      throw e;
    }
  }

  // ─── REALTIME RECONNECT MANAGER ──────────────────────
  // Heartbeat + automatic resubscribe with exponential backoff.
  const channelMonitors = new Map(); // channelName → { lastBeat, resubscribe, status }

  function registerChannel(name, resubscribeFn) {
    const monitor = channelMonitors.get(name) || {};
    monitor.name = name;
    monitor.resubscribe = resubscribeFn;
    monitor.lastBeat = Date.now();
    monitor.failCount = 0;
    monitor.status = 'subscribing';
    channelMonitors.set(name, monitor);
  }

  function channelHeartbeat(name) {
    const m = channelMonitors.get(name);
    if (m) {
      m.lastBeat = Date.now();
      m.status = 'live';
      m.failCount = 0;
      updateSyncBadge('live');
    }
  }

  function unregisterChannel(name) {
    channelMonitors.delete(name);
    if (channelMonitors.size === 0) updateSyncBadge('idle');
  }

  // Sync-Status-Badge im Header
  function updateSyncBadge(state) {
    const el = document.getElementById('roots-sync-status');
    if (!el) return;
    const map = {
      live: { icon: 'fa-circle', label: 'Verbunden', cls: 'live' },
      reconnecting: { icon: 'fa-rotate', label: 'Verbinde neu…', cls: 'reconnecting' },
      offline: { icon: 'fa-circle-exclamation', label: 'Offline', cls: 'offline' },
      idle: { icon: 'fa-circle-dot', label: '', cls: 'idle' },
    };
    const conf = map[state] || map.idle;
    el.dataset.state = state;
    if (state === 'idle' || !navigator.onLine && state !== 'offline') {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `<span class="lp-sync-pill lp-sync-${conf.cls}"><i class="fa-solid ${conf.icon}${conf.cls==='reconnecting'?' fa-spin':''}"></i> ${conf.label}</span>`;
  }

  // Online/Offline-Listener
  window.addEventListener('online', () => {
    updateSyncBadge('reconnecting');
    channelMonitors.forEach((m) => {
      if (typeof m.resubscribe === 'function') {
        try { m.resubscribe(); } catch (e) { reportError(e, { kind: 'auto-resubscribe' }); }
      }
    });
  });
  window.addEventListener('offline', () => updateSyncBadge('offline'));

  // Heartbeat-Watchdog: prüft alle 5 Sek ob Channel zu lange still ist
  setInterval(() => {
    if (!navigator.onLine) { updateSyncBadge('offline'); return; }
    channelMonitors.forEach((m) => {
      const age = Date.now() - m.lastBeat;
      if (age > 30000 && m.status !== 'reconnecting' && typeof m.resubscribe === 'function') {
        m.status = 'reconnecting';
        m.failCount++;
        const backoff = Math.min(30000, 1000 * Math.pow(2, m.failCount));
        updateSyncBadge('reconnecting');
        setTimeout(() => {
          try { m.resubscribe(); } catch (e) { reportError(e, { kind: 'watchdog-resub' }); }
        }, backoff);
      }
    });
  }, 5000);

  // ─── FOCUS TRAP FOR MODALS ───────────────────────────
  function trapFocus(modal) {
    const focusable = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    modal.addEventListener('keydown', handler);
    setTimeout(() => first.focus(), 0);
    return () => modal.removeEventListener('keydown', handler);
  }

  // ESC closes any visible modal
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = document.querySelector('.modal.is-open, .modal-overlay.visible');
    if (open) {
      const closeBtn = open.querySelector('[data-close]');
      if (closeBtn) closeBtn.click();
      else open.classList.remove('is-open', 'visible');
    }
  });

  // Observe modal open/close → auto trap focus
  const modalObserver = new MutationObserver((muts) => {
    muts.forEach((m) => {
      if (m.target.classList?.contains('is-open') || m.target.classList?.contains('visible')) {
        trapFocus(m.target);
      }
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal, .modal-overlay').forEach((mod) => {
      modalObserver.observe(mod, { attributes: true, attributeFilter: ['class'] });
    });
  });

  // ─── PROFANITY: STRONGER LIST ────────────────────────
  const PROFANITY_DE = ['fick','scheiß','scheiss','arsch','wichser','nutte','schwanz','huren','hure','bastard','idiot','depp'];
  const PROFANITY_EN = ['fuck','shit','asshole','bitch','cunt','dick','bastard','retard','slut','whore','pussy'];
  const PROFANE = new Set([...PROFANITY_DE, ...PROFANITY_EN]);

  window.LP_isProfane = function (text) {
    if (!text) return false;
    const lower = String(text).toLowerCase().replace(/[^a-zäöüß ]/g, ' ');
    return lower.split(/\s+/).some((w) => PROFANE.has(w));
  };

  // Better filterProfanity (overrides simpler version in app.js if loaded after)
  window.LP_filterProfanity = function (text, enabled) {
    if (!enabled || !text) return text;
    let out = String(text);
    PROFANE.forEach((w) => {
      const re = new RegExp(`\\b${w}\\w*\\b`, 'gi');
      out = out.replace(re, (m) => m[0] + '*'.repeat(Math.max(1, m.length - 1)));
    });
    return out;
  };

  // ─── PWA SERVICE WORKER REGISTRATION ─────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        // Update prompt when new SW is ready
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdatePrompt(reg);
            }
          });
        });
      }).catch((e) => reportError(e, { kind: 'sw-register' }));

      // Listen for controlling SW change → soft reload
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    });
  }

  function showUpdatePrompt(reg) {
    if (!window.toast) return;
    // Custom action toast
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'toast toast-update';
    el.innerHTML = `
      <span><i class="fa-solid fa-arrow-rotate-right"></i> Neue Version verfügbar.</span>
      <button type="button" class="btn-toast-update">Jetzt aktualisieren</button>
      <button type="button" class="btn-toast-dismiss" aria-label="Später"><i class="fa-solid fa-xmark"></i></button>
    `;
    el.querySelector('.btn-toast-update').onclick = () => {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      el.remove();
    };
    el.querySelector('.btn-toast-dismiss').onclick = () => el.remove();
    c.appendChild(el);
  }

  // ─── DEBUG HOOK ──────────────────────────────────────
  window.LP = {
    sb: sbCall,
    registerChannel,
    channelHeartbeat,
    unregisterChannel,
    updateSyncBadge,
    trapFocus,
    reportError,
    errors: () => errorBuffer.slice(),
    clearErrors: () => { errorBuffer.length = 0; localStorage.removeItem('lp_error_log'); },
  };

  // Boot-Banner für Debugging
  console.log(`%c ROOTS Live Poll %c build ${window.LP_BUILD} %c`,
    'background:#206efb;color:#fff;padding:3px 8px;border-radius:4px 0 0 4px;font-weight:700',
    'background:#0f172a;color:#fff;padding:3px 8px;border-radius:0 4px 4px 0',
    '');
})();
