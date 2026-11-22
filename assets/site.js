/* 雾晚个人主页脚本 — 2026-11-22 整站改版：主题切换、哈希路由、页首生成画、
   wanBox 下载直链自动更新、地区软门（规则与旧版一致）。 */
(function () {
  'use strict';

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const applyTheme = (t) => { root.dataset.theme = t; };
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('wuwan-theme', next); } catch (_) {}
    drawArt();
  }));

  /* ---------- loader ---------- */
  const loader = document.getElementById('loader');
  const doneLoader = () => { if (loader) loader.classList.add('done'); };
  window.addEventListener('load', () => window.setTimeout(doneLoader, 450));
  window.setTimeout(doneLoader, 2600);

  /* ---------- generative header art ---------- */
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const W = (op) => `stroke="var(--water)" stroke-opacity="${op}"`;
  const M = (op) => `stroke="var(--muted)" stroke-opacity="${op}"`;
  const art = {
    flow(seed) {
      const r = rng(seed); let p = '';
      for (let i = 0; i < 30; i++) {
        const y = -20 + i * 15 + r() * 8, bend = 60 + r() * 120, up = r() * 90 - 45;
        p += `<path d="M-10 ${y} C 380 ${y - bend * .3}, 700 ${190 + up}, 1210 ${150 + up * .6}" fill="none" ${i % 4 === 0 ? M(.35) : W(.16 + r() * .3)} stroke-width="${1 + r() * 1.4}"/>`;
      }
      return p;
    },
    dots(seed) {
      const r = rng(seed); let c = '';
      for (let x = 24; x < 1200; x += 34) for (let y = 22; y < 400; y += 34) {
        const d = Math.hypot(x - 1010, y - 60) / 620, rad = Math.max(.4, (1 - d) * 5.2);
        if (rad > .5) c += `<circle cx="${x}" cy="${y}" r="${rad.toFixed(1)}" fill="${r() > .82 ? 'var(--water)' : 'var(--ink)'}" fill-opacity="${(.16 + (1 - d) * .5).toFixed(2)}"/>`;
      }
      return c;
    },
    confetti(seed) {
      const r = rng(seed); let s = '';
      for (let i = 0; i < 80; i++) {
        const x = r() * 1180 + 10, y = r() * 380 + 10, a = r() * Math.PI, l = 10 + r() * 16;
        s += `<line x1="${x}" y1="${y}" x2="${x + Math.cos(a) * l}" y2="${y + Math.sin(a) * l}" ${r() > .45 ? W(.25 + r() * .45) : M(.3)} stroke-width="3.4" stroke-linecap="round"/>`;
      }
      return s;
    },
    wave(seed) {
      let p = '';
      for (let i = 0; i < 13; i++) {
        const y = 30 + i * 30, amp = 8 + (i % 4) * 4;
        p += `<path d="M-10 ${y} Q 300 ${y - amp}, 600 ${y} T 1210 ${y}" fill="none" ${i % 3 === 0 ? W(.4) : M(.28)} stroke-width="1.6"/>`;
      }
      return p;
    },
    bubbles(seed) {
      const r = rng(seed); let c = '';
      for (let i = 0; i < 30; i++) {
        const x = r() * 1180 + 10, y = r() * 380 + 10, rad = 4 + r() * 30;
        c += `<circle cx="${x}" cy="${y}" r="${rad}" fill="var(--water)" fill-opacity="${(.04 + r() * .08).toFixed(2)}" stroke="var(--water)" stroke-opacity="${(.2 + r() * .3).toFixed(2)}"/>`;
      }
      return c;
    }
  };
  function drawArt() {
    document.querySelectorAll('[data-art]').forEach((el, i) => {
      const kind = el.dataset.art;
      if (!art[kind]) return;
      el.innerHTML = `<svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${art[kind](1234 + i * 77 + kind.length * 131)}</svg>`;
    });
  }
  drawArt();

  /* ---------- hash router ---------- */
  const titles = { home: '雾晚 — 开发者 · 终身学习者', about: '关于 — 雾晚', projects: '项目 — 雾晚', works: '作品 — 雾晚', sites: '网页 — 雾晚', contact: '联系 — 雾晚' };
  const legacy = { '#about': 'about', '#projects': 'projects', '#works': 'works', '#websites': 'sites', '#contact': 'contact' };
  function currentRoute() {
    const h = location.hash;
    if (legacy[h]) return legacy[h];
    const m = h.match(/^#\/(\w*)$/);
    const name = m ? m[1] : '';
    return titles[name] !== undefined ? name : 'home';
  }
  function render() {
    const route = currentRoute();
    document.querySelectorAll('[data-view]').forEach((v) => { v.hidden = v.dataset.view !== route; });
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === route));
    document.title = titles[route];
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  render();

  /* ---------- back to top ---------- */
  const toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 600), { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- wanBox latest bundle link ---------- */
  const bundleLinks = [...document.querySelectorAll('[data-latest-bundle]')];
  if (bundleLinks.length) {
    fetch('https://api.github.com/repos/Wuwan94/wanBoxForAndroid/releases?per_page=10', { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => { if (!r.ok) throw new Error('releases http ' + r.status); return r.json(); })
      .then((releases) => {
        const bundle = releases
          .flatMap((release) => release.assets
            .filter((asset) => asset.name.toLowerCase().includes('with-manager') && asset.name.toLowerCase().endsWith('.zip'))
            .map((asset) => ({ asset, release })))
          .sort((a, b) => new Date(b.release.published_at || b.release.created_at) - new Date(a.release.published_at || a.release.created_at))[0];
        if (!bundle || !bundle.asset || !bundle.asset.browser_download_url) throw new Error('no matching bundle asset');
        bundleLinks.forEach((a) => { a.href = bundle.asset.browser_download_url; });
      }).catch(() => { /* keep the static link already in the page */ });
  }

  /* ---------- geo gate: China-only, trace -> ipapi fallback, fail-open after 2.5s ---------- */
  const gate = document.getElementById('geoGate');
  if (!gate) return;
  const allow = () => { gate.style.display = 'none'; };
  let visitorIp = '';
  const block = () => {
    const detail = visitorIp ? `<p>${visitorIp}</p>` : '';
    gate.innerHTML = `<div class="box"><h2>此 IP 已被拉黑</h2>${detail}<p>本站仅向中国地区 IP 开放。</p></div>`;
  };
  const fromTrace = () => fetch('https://www.cloudflare.com/cdn-cgi/trace').then((r) => r.text()).then((text) => {
    const country = text.match(/loc=([A-Z]{2})/);
    if (!country) throw new Error('no loc');
    const ip = text.match(/ip=([^\n]+)/);
    if (ip) visitorIp = ip[1].trim();
    return country[1];
  });
  const fromIpapi = () => fetch('https://ipapi.co/country/').then((r) => r.text()).then((text) => {
    const country = text.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) throw new Error('bad country');
    return country;
  });
  const firstOk = (ps) => new Promise((res, rej) => { let n = ps.length; ps.forEach((p) => p.then(res, () => { if (--n === 0) rej(new Error('all failed')); })); });
  firstOk([fromTrace(), fromIpapi()]).then((country) => (country === 'CN' ? allow() : block())).catch(allow);
  window.setTimeout(() => {
    if (gate.style.display !== 'none' && gate.querySelector('h2') && gate.querySelector('h2').textContent.startsWith('正在确认')) allow();
  }, 2500);
})();
