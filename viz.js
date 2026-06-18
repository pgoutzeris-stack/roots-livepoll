(function () {
  const BUBBLE_COLORS = ['#dbeafe', '#dcfce7', '#cffafe', '#e0e7ff', '#e0f2fe', '#ccfbf1', '#eef2ff', '#d1fae5'];

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function normalizeBubbleItems(items) {
    return (items || []).map((item, i) => {
      if (typeof item === 'string') return { id: `t-${i}-${item.slice(0, 24)}`, text: item };
      return { id: item.id || `t-${i}-${String(item.text || '').slice(0, 24)}`, text: String(item.text || '').trim() };
    }).filter((item) => item.text);
  }

  function renderBrainstormBubbles(items, options = {}) {
    const { mode = 'present', maxItems = 80, newIds = null } = options;
    const normalized = normalizeBubbleItems(items).slice(-maxItems);
    if (!normalized.length) {
      return mode === 'present'
        ? '<div class="viz-bubble-cloud viz-bubble-cloud--empty"><div class="viz-bubble-empty">Antworten werden gesammelt…</div></div>'
        : '<div class="viz-open-list"></div>';
    }
    const bubbles = normalized.map((item, i) => {
      const h = hashStr(String(item.id) + item.text + i);
      const color = BUBBLE_COLORS[h % BUBBLE_COLORS.length];
      const scale = 0.88 + (h % 28) / 100;
      const delay = (h % 16) * 0.055;
      const rotate = (h % 11) - 5;
      const isNew = newIds?.has?.(item.id) ? ' viz-bubble--new' : '';
      return `<div class="viz-bubble${isNew}" data-bubble-id="${esc(item.id)}" style="--bubble-bg:${color};--bubble-scale:${scale};--bubble-delay:${delay}s;--bubble-rotate:${rotate}deg"><span class="viz-bubble-text">${esc(item.text)}</span></div>`;
    }).join('');
    return `<div class="viz-bubble-cloud viz-bubble-cloud--${mode}">${bubbles}</div>`;
  }

  function aggregateResponses(slide, responses) {
    const visible = responses.filter((r) => !r.is_hidden);
    const type = slide.slide_type;
    const base = { total: visible.length, type };

    if (type === 'mc_single' || type === 'yesno' || type === 'quiz') {
      const counts = {};
      (slide.content.options || []).forEach((o) => { counts[o.id] = 0; });
      if (type === 'yesno') { counts.yes = 0; counts.no = 0; }
      visible.forEach((r) => {
        const v = r.response?.value;
        if (v != null) counts[v] = (counts[v] || 0) + 1;
      });
      return { ...base, counts };
    }

    if (type === 'mc_multi') {
      const counts = {};
      (slide.content.options || []).forEach((o) => { counts[o.id] = 0; });
      visible.forEach((r) => {
        (r.response?.values || []).forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      });
      return { ...base, counts };
    }

    if (type === 'wordcloud') {
      const counts = {};
      visible.forEach((r) => {
        const w = String(r.response?.text || '').trim().toLowerCase();
        if (!w) return;
        counts[w] = (counts[w] || 0) + 1;
      });
      return { ...base, words: counts };
    }

    if (type === 'open' || type === 'brainstorm') {
      return {
        ...base,
        items: visible
          .map((r) => ({ id: r.id, text: String(r.response?.text || '').trim() }))
          .filter((item) => item.text),
      };
    }

    if (type === 'scale' || type === 'number_guess') {
      const nums = visible.map((r) => Number(r.response?.value)).filter((n) => Number.isFinite(n));
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = nums.length ? sum / nums.length : 0;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = !sorted.length ? 0 : sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      return { ...base, avg, median: mid, values: nums };
    }

    if (type === 'reaction') {
      const counts = {};
      visible.forEach((r) => {
        const e = r.response?.emoji || '👍';
        counts[e] = (counts[e] || 0) + 1;
      });
      return { ...base, counts };
    }

    if (type === 'qa') {
      const items = visible.map((r) => ({
        text: r.response?.text || '',
        upvotes: Number(r.response?.upvotes || 0),
        id: r.id,
      })).filter((i) => i.text);
      items.sort((a, b) => b.upvotes - a.upvotes || a.text.localeCompare(b.text));
      return { ...base, items };
    }

    if (type === 'ranking') {
      const scores = {};
      (slide.content.options || []).forEach((o) => { scores[o.id] = 0; });
      visible.forEach((r) => {
        (r.response?.order || []).forEach((id, idx) => {
          scores[id] = (scores[id] || 0) + ((slide.content.options || []).length - idx);
        });
      });
      return { ...base, scores };
    }

    if (type === 'percent_split') {
      const totals = {};
      (slide.content.options || []).forEach((o) => { totals[o.id] = 0; });
      visible.forEach((r) => {
        const map = r.response?.points || {};
        Object.entries(map).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + Number(v || 0); });
      });
      return { ...base, totals };
    }

    if (type === 'pin_image') {
      return { ...base, pins: visible.map((r) => r.response?.pin).filter(Boolean) };
    }

    if (type === 'priority_matrix') {
      // Pro Item: Verteilung über die 4 Quadranten zählen
      const itemPlacements = {}; // itemId -> { qw: n, sb: n, ts: n, dr: n }
      const itemMeta = {}; // itemId -> { text }
      visible.forEach((r) => {
        const m = r.response?.matrix || {};
        const meta = r.response?.meta || {};
        Object.entries(m).forEach(([itemId, q]) => {
          if (!['qw', 'sb', 'ts', 'dr'].includes(q)) return;
          if (!itemPlacements[itemId]) itemPlacements[itemId] = { qw: 0, sb: 0, ts: 0, dr: 0 };
          itemPlacements[itemId][q]++;
          if (meta[itemId] && !itemMeta[itemId]) itemMeta[itemId] = meta[itemId];
        });
      });
      return { ...base, itemPlacements, itemMeta };
    }

    return base;
  }

  function renderViz(slide, agg, mode, options = {}) {
    const displayMode = options.displayMode || 'percent';
    const textColor = 'var(--ink)';
    const trackBg = 'rgba(15,23,42,.08)';
    const itemBg = 'var(--surface)';
    const itemBorder = 'var(--line)';
    const wordColor = 'var(--brand)';

    if (agg.type === 'mc_single' || agg.type === 'mc_multi' || agg.type === 'yesno' || agg.type === 'quiz' || agg.type === 'reaction') {
      const options = slide.content.options || [];
      const entries = agg.type === 'yesno'
        ? [{ id: 'yes', text: 'Ja' }, { id: 'no', text: 'Nein' }]
        : agg.type === 'reaction'
          ? Object.keys(agg.counts || {}).map((k) => ({ id: k, text: k }))
          : options;
      const max = Math.max(1, ...entries.map((o) => agg.counts?.[o.id] || 0));
      const total = Math.max(1, agg.total || 0);
      const correctId = agg.type === 'quiz' ? (options.find((o) => o.correct)?.id) : null;
      return `<div class="viz-bars">${entries.map((o) => {
        const n = agg.counts?.[o.id] || 0;
        const pct = Math.round((n / total) * 100);
        const barPct = displayMode === 'count' ? Math.round((n / max) * 100) : pct;
        const valueLabel = displayMode === 'count' ? String(n) : `${pct}%`;
        const highlight = correctId && o.id === correctId ? ' viz-bar-correct' : '';
        return `<div class="viz-bar-row${highlight}"><span>${esc(o.text || o.id)}</span><div class="viz-bar-track" style="background:${trackBg}"><div class="viz-bar-fill" style="width:${barPct}%"></div></div><strong>${valueLabel}</strong></div>`;
      }).join('')}</div>`;
    }

    if (agg.type === 'wordcloud') {
      const words = Object.entries(agg.words || {}).sort((a, b) => b[1] - a[1]).slice(0, 40);
      const max = words[0]?.[1] || 1;
      return `<div class="viz-wordcloud">${words.map(([w, c]) => {
        const size = 0.85 + (c / max) * 1.6;
        return `<span class="viz-word" style="font-size:${size}rem;color:${wordColor}">${esc(w)}</span>`;
      }).join('')}</div>`;
    }

    if (agg.type === 'open' || agg.type === 'brainstorm') {
      if (mode === 'present') {
        return renderBrainstormBubbles(agg.items || [], { mode: 'present', maxItems: 100 });
      }
      const list = normalizeBubbleItems(agg.items || []);
      return `<div class="viz-open-list">${list.slice(-20).map((item) => `<div class="viz-open-item" style="background:${itemBg};border-color:${itemBorder}">${esc(item.text)}</div>`).join('')}</div>`;
    }

    if (agg.type === 'scale' || agg.type === 'number_guess') {
      const sub = 'var(--muted)';
      return `<div style="font-size:2.5rem;font-weight:800;color:${textColor}">Ø ${(agg.avg || 0).toFixed(1)} · Median ${agg.median || 0}<div style="font-size:.9rem;color:${sub};margin-top:.5rem">${agg.total} Antworten</div></div>`;
    }

    if (agg.type === 'qa') {
      return `<div class="viz-open-list">${(agg.items || []).slice(0, 12).map((i) => `<div class="viz-open-item" style="background:${itemBg};border-color:${itemBorder}"><strong>${i.upvotes}▲</strong> ${esc(i.text)}</div>`).join('')}</div>`;
    }

    if (agg.type === 'ranking' || agg.type === 'percent_split') {
      const data = agg.scores || agg.totals || {};
      const entries = Object.entries(data).map(([id, val]) => {
        const label = (slide.content.options || []).find((o) => o.id === id)?.text || id;
        return { id, label, val };
      }).sort((a, b) => b.val - a.val);
      const max = Math.max(1, ...entries.map((e) => e.val));
      const total = Math.max(1, entries.reduce((sum, e) => sum + e.val, 0));
      return `<div class="viz-bars">${entries.map((e) => {
        const pct = Math.round((e.val / total) * 100);
        const barPct = displayMode === 'count' ? Math.round((e.val / max) * 100) : pct;
        const valueLabel = displayMode === 'count' ? String(Math.round(e.val)) : `${pct}%`;
        return `<div class="viz-bar-row"><span>${esc(e.label)}</span><div class="viz-bar-track" style="background:${trackBg}"><div class="viz-bar-fill" style="width:${barPct}%"></div></div><strong>${valueLabel}</strong></div>`;
      }).join('')}</div>`;
    }

    if (agg.type === 'priority_matrix') {
      // Aggregierte Matrix: jedes Item landet im Quadranten mit den meisten Votes.
      // ROOTS-Design, Font-Awesome-Icons, feste Quadranten-Farben (kein Gelb).
      const itemPlacements = agg.itemPlacements || {};
      const itemMeta = agg.itemMeta || {};
      const quadrants = slide.content.quadrants || {};
      const QICON = { qw: 'fa-rocket', sb: 'fa-star', ts: 'fa-screwdriver-wrench', dr: 'fa-ban' };
      const QLABEL = {
        qw: quadrants.qw?.label || 'Quick Win',
        sb: quadrants.sb?.label || 'Strategic Bet',
        ts: quadrants.ts?.label || 'Time Sink',
        dr: quadrants.dr?.label || 'Drop',
      };
      const byQuadrant = { qw: [], sb: [], ts: [], dr: [] };
      Object.entries(itemPlacements).forEach(([id, counts]) => {
        const max = Math.max(counts.qw, counts.sb, counts.ts, counts.dr);
        if (max === 0) return;
        // Bei Gleichstand: deterministische Priorität qw > sb > ts > dr (kein Split-Block).
        const order = ['qw', 'sb', 'ts', 'dr'];
        const winner = order.find((q) => counts[q] === max);
        const text = itemMeta[id]?.text || id;
        const total = counts.qw + counts.sb + counts.ts + counts.dr;
        byQuadrant[winner].push({ id, text, max, total });
      });
      const renderItems = (q) => byQuadrant[q].length
        ? byQuadrant[q].sort((a, b) => b.max - a.max).map((it, i) => {
            const pct = Math.round((it.max / Math.max(1, it.total)) * 100);
            return `<div class="lp-matrix-result-item" style="--i:${i}" title="${esc(it.text)} – ${it.max}/${it.total} Stimmen">
              <span class="lp-matrix-result-text">${esc(it.text)}</span>
              <span class="lp-matrix-result-pct">${pct}%</span>
            </div>`;
          }).join('')
        : '<div class="lp-matrix-result-empty"><i class="fa-regular fa-circle-dot"></i> noch leer</div>';
      const cell = (q) => `<div class="lp-matrix-result-cell lp-q-${q}">
          <div class="lp-matrix-cell-title"><span class="lp-matrix-cell-ico"><i class="fa-solid ${QICON[q]}"></i></span>${esc(QLABEL[q])}<span class="lp-matrix-cell-count">${byQuadrant[q].length}</span></div>
          <div class="lp-matrix-cell-items">${renderItems(q)}</div>
        </div>`;
      return `<div class="lp-matrix-result">
        <div class="lp-matrix-result-axes">
          <div class="lp-matrix-result-y-label"><i class="fa-solid fa-arrow-up"></i> ${esc(slide.content.yAxisLabel || 'Impact')}</div>
          <div class="lp-matrix-result-grid">
            ${cell('qw')}
            ${cell('sb')}
            ${cell('dr')}
            ${cell('ts')}
          </div>
          <div class="lp-matrix-result-x-label"><span class="lp-matrix-axis-low">niedrig</span> ${esc(slide.content.xAxisLabel || 'Aufwand')} <span class="lp-matrix-axis-high">hoch</span></div>
        </div>
        <div class="lp-matrix-result-total"><i class="fa-solid fa-users"></i> ${agg.total} Teilnehmer · <i class="fa-solid fa-layer-group"></i> ${Object.keys(itemPlacements).length} Use Cases priorisiert</div>
      </div>`;
    }

    if (agg.type === 'pin_image' && slide.content.imageUrl) {
      const pins = agg.pins || [];
      return `<div style="position:relative;max-width:720px;margin:0 auto"><img src="${esc(slide.content.imageUrl)}" alt="" style="max-width:100%;border-radius:12px">${pins.map((p) => `<span style="position:absolute;left:${+p.x || 0}%;top:${+p.y || 0}%;transform:translate(-50%,-50%);font-size:1.5rem">📍</span>`).join('')}</div>`;
    }

    if (agg.type === 'content' || agg.type === 'section') {
      return `<div style="color:var(--muted)">Inhaltsfolie</div>`;
    }

    return `<div style="color:var(--muted)">${agg.total || 0} Antworten</div>`;
  }

  window.LPViz = { aggregateResponses, renderViz, renderBrainstormBubbles, esc };
})();
