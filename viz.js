(function () {
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
      return { ...base, items: visible.map((r) => r.response?.text || '').filter(Boolean) };
    }

    if (type === 'scale' || type === 'number_guess') {
      const nums = visible.map((r) => Number(r.response?.value)).filter((n) => Number.isFinite(n));
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = nums.length ? sum / nums.length : 0;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
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

    return base;
  }

  function renderViz(slide, agg, mode) {
    const light = mode === 'editor' || mode === 'results' || mode === 'present';
    const textColor = light ? 'var(--ink)' : 'var(--ink)';
    const trackBg = light ? 'rgba(15,23,42,.08)' : 'rgba(15,23,42,.08)';
    const itemBg = light ? 'var(--surface)' : 'var(--surface)';
    const itemBorder = light ? 'var(--line)' : 'var(--line)';
    const wordColor = light ? 'var(--brand)' : 'var(--brand)';

    if (agg.type === 'mc_single' || agg.type === 'mc_multi' || agg.type === 'yesno' || agg.type === 'quiz' || agg.type === 'reaction') {
      const options = slide.content.options || [];
      const entries = agg.type === 'yesno'
        ? [{ id: 'yes', text: 'Ja' }, { id: 'no', text: 'Nein' }]
        : agg.type === 'reaction'
          ? Object.keys(agg.counts || {}).map((k) => ({ id: k, text: k }))
          : options;
      const max = Math.max(1, ...entries.map((o) => agg.counts?.[o.id] || 0));
      const correctId = agg.type === 'quiz' ? (options.find((o) => o.correct)?.id) : null;
      return `<div class="viz-bars">${entries.map((o) => {
        const n = agg.counts?.[o.id] || 0;
        const pct = Math.round((n / max) * 100);
        const highlight = correctId && o.id === correctId ? ' viz-bar-correct' : '';
        return `<div class="viz-bar-row${highlight}"><span>${esc(o.text || o.id)}</span><div class="viz-bar-track" style="background:${trackBg}"><div class="viz-bar-fill" style="width:${pct}%"></div></div><strong>${n}</strong></div>`;
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
      return `<div class="viz-open-list">${(agg.items || []).slice(-20).map((t) => `<div class="viz-open-item" style="background:${itemBg};border-color:${itemBorder}">${esc(t)}</div>`).join('')}</div>`;
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
      return `<div class="viz-bars">${entries.map((e) => {
        const pct = Math.round((e.val / max) * 100);
        return `<div class="viz-bar-row"><span>${esc(e.label)}</span><div class="viz-bar-track" style="background:${trackBg}"><div class="viz-bar-fill" style="width:${pct}%"></div></div><strong>${Math.round(e.val)}</strong></div>`;
      }).join('')}</div>`;
    }

    if (agg.type === 'pin_image' && slide.content.imageUrl) {
      const pins = agg.pins || [];
      return `<div style="position:relative;max-width:720px;margin:0 auto"><img src="${esc(slide.content.imageUrl)}" alt="" style="max-width:100%;border-radius:12px">${pins.map((p) => `<span style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);font-size:1.5rem">📍</span>`).join('')}</div>`;
    }

    if (agg.type === 'content' || agg.type === 'section') {
      return `<div style="color:var(--muted)">Inhaltsfolie</div>`;
    }

    return `<div style="color:var(--muted)">${agg.total || 0} Antworten</div>`;
  }

  window.LPViz = { aggregateResponses, renderViz, esc };
})();
