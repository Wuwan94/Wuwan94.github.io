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
    document.dispatchEvent(new CustomEvent('ww-route', { detail: route }));
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

/* ---------- drivable island on the about page ---------- */
(function () {
  'use strict';
  const canvas = document.getElementById('islandCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('islandStage');
  const hud = document.getElementById('islandCount');
  const card = document.getElementById('islandCard');
  const cardTitle = document.getElementById('islandCardTitle');
  const cardCopy = document.getElementById('islandCardCopy');
  const cardLink = document.getElementById('islandCardLink');
  const WW = 1000, WH = 620, CX = 500, CY = 310, RX = 452, RY = 258;

  const landmarks = [
    { id: 'home', x: 330, y: 305, glyph: '屋', name: '雾晚的小屋', kind: 'box', roof: '#e2574c', title: '雾晚的小屋', copy: '你好，我是雾晚，一名开发者，也是终身学习者。这座小岛就是我的关于页——开车逛一圈，六个地方，六件我正在做的事。「好奇心会带我们走得更远。」', link: null },
    { id: 'workshop', x: 435, y: 155, glyph: '工', name: 'wanBox 工坊', kind: 'box', roof: '#007bff', title: 'wanBox 工坊', copy: 'wanBox for Android 在这里打磨：基于 sing-box 核心的客户端加 Root 模块，瘦身到 26MB 以内，一个版本一个版本往前推。', link: { href: '#/projects', label: '去项目页看看 →' } },
    { id: 'tower', x: 700, y: 185, glyph: '塔', name: '汉字塔防', kind: 'tower', roof: '#8a5cff', title: '汉字塔防', copy: '《汉字塔防》是我做的文字塔防小游戏，已经上架 TapTap，点开就能玩。', link: { href: 'https://www.taptap.cn/app/1019120', label: '去 TapTap 看看 ↗' } },
    { id: 'lighthouse', x: 872, y: 300, glyph: '灯', name: '电报灯塔', kind: 'lighthouse', roof: '#f2b44c', title: '电报灯塔', copy: '想找我聊天，来 Telegram：@wanwuyy。技术、合作，或者交换最近学到的新东西，都欢迎。', link: { href: 'https://t.me/wanwuyy?direct', label: '去 Telegram ↗' } },
    { id: 'konbini', x: 745, y: 415, glyph: '店', name: '雨夜便利店', kind: 'box', roof: '#00b39a', title: '雨夜便利店街角', copy: '一个能拖动旋转的 3D 小场景：下雨的夜里，街角便利店的灯还亮着。', link: { href: '/konbini/', label: '进店里坐坐 →' } },
    { id: 'shop', x: 520, y: 465, glyph: '摊', name: '阿婉的小店', kind: 'box', roof: '#ff8a3d', title: '阿婉的 AI 对接', copy: '我自己开的小店，卖 AI 成品号等虚拟商品，自动发货。', link: { href: 'https://www.16688.com.cn/shop/S809062', label: '去逛小店 ↗' } }
  ];
  const visited = new Set();
  let cardFor = null, suppressed = null;

  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rand = rng(20261122);
  const inside = (x, y, f) => ((x - CX) / (RX * f)) ** 2 + ((y - CY) / (RY * f)) ** 2 <= 1;
  const trees = [], rocks = [];
  for (let i = 0; i < 30 && trees.length < 26; i++) {
    const x = 60 + rand() * 880, y = 60 + rand() * 500;
    if (!inside(x, y, 0.9)) continue;
    if (landmarks.some((l) => Math.hypot(l.x - x, l.y - y) < 82)) continue;
    if (Math.hypot(300 - x, 390 - y) < 64) continue;
    trees.push({ x, y, s: 0.8 + rand() * 0.7 });
  }
  for (let i = 0; i < 16 && rocks.length < 8; i++) {
    const x = 60 + rand() * 880, y = 60 + rand() * 500;
    if (!inside(x, y, 0.92)) continue;
    if (landmarks.some((l) => Math.hypot(l.x - x, l.y - y) < 70)) continue;
    rocks.push({ x, y, s: 5 + rand() * 8 });
  }

  const car = { x: 300, y: 390, heading: -0.5, speed: 0 };
  const keys = new Set();
  let target = null, running = false, raf = 0, last = 0;

  const keymap = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keydown', (e) => {
    if (!running || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = keymap[e.code];
    if (k) { keys.add(k); target = null; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => { const k = keymap[e.code]; if (k) keys.delete(k); });
  stage.querySelectorAll('.island-pad button').forEach((b) => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); keys.add(k); target = null; };
    const off = () => keys.delete(k);
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('pointercancel', off);
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const wx = (e.clientX - r.left) / r.width * WW, wy = (e.clientY - r.top) / r.height * WH;
    const near = landmarks.find((l) => Math.hypot(l.x - wx, l.y - wy) < 76);
    target = near ? { x: near.x, y: near.y } : { x: wx, y: wy };
  });
  document.getElementById('islandCardClose').addEventListener('click', () => {
    suppressed = cardFor; card.hidden = true; cardFor = null;
  });

  function showCard(lm) {
    cardFor = lm.id;
    cardTitle.textContent = lm.title;
    cardCopy.textContent = lm.copy;
    if (lm.link) {
      cardLink.hidden = false;
      cardLink.href = lm.link.href;
      cardLink.textContent = lm.link.label;
      if (/^https?:/.test(lm.link.href)) { cardLink.target = '_blank'; cardLink.rel = 'noopener'; } else { cardLink.removeAttribute('target'); }
    } else cardLink.hidden = true;
    card.hidden = false;
    if (!visited.has(lm.id)) {
      visited.add(lm.id);
      hud.textContent = visited.size >= landmarks.length ? '全岛探索完成 · 6 / 6' : `已探索 ${visited.size} / 6`;
    }
  }

  function step(dt) {
    let steer = 0, throttle = 0;
    if (keys.has('left')) steer -= 1;
    if (keys.has('right')) steer += 1;
    if (keys.has('up')) throttle += 1;
    if (keys.has('down')) throttle -= 1;
    if (target) {
      const dx = target.x - car.x, dy = target.y - car.y, dist = Math.hypot(dx, dy);
      if (dist < 30) target = null;
      else {
        let diff = Math.atan2(dy, dx) - car.heading;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        steer = Math.max(-1, Math.min(1, diff * 2.2));
        throttle = Math.abs(diff) > 2.4 ? -0.6 : 1;
      }
    }
    car.speed += throttle * 300 * dt;
    car.speed -= car.speed * 1.6 * dt;
    car.speed = Math.max(-80, Math.min(195, car.speed));
    if (Math.abs(car.speed) > 2) car.heading += steer * 1.9 * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 90);
    car.x += Math.cos(car.heading) * car.speed * dt;
    car.y += Math.sin(car.heading) * car.speed * dt;
    const e = ((car.x - CX) / RX) ** 2 + ((car.y - CY) / RY) ** 2;
    if (e > 1) {
      const s = 1 / Math.sqrt(e);
      car.x = CX + (car.x - CX) * s; car.y = CY + (car.y - CY) * s;
      car.speed *= 0.45;
    }
    let nearest = null, nd = 1e9;
    for (const lm of landmarks) { const d = Math.hypot(lm.x - car.x, lm.y - car.y); if (d < nd) { nd = d; nearest = lm; } }
    if (nearest && nd < 68) { if (cardFor !== nearest.id && suppressed !== nearest.id) showCard(nearest); }
    else {
      if (suppressed && nd > 100) suppressed = null;
      if (cardFor && nd > 100) { card.hidden = true; cardFor = null; }
    }
  }

  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function draw(t) {
    const dark = document.documentElement.dataset.theme !== 'light';
    const w = canvas.width, h = canvas.height;
    ctx.setTransform(w / WW, 0, 0, h / WH, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, WH);
    if (dark) { g.addColorStop(0, '#0a1a2e'); g.addColorStop(1, '#0e2a47'); } else { g.addColorStop(0, '#bfe0ff'); g.addColorStop(1, '#8fc6f7'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, WW, WH);
    ctx.strokeStyle = dark ? 'rgba(140,190,255,.20)' : 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const y = 40 + i * 84;
      for (let x = -10; x <= WW + 10; x += 26) ctx.lineTo(x, y + Math.sin(x / 90 + t / 1400 + i * 1.7) * 5);
      ctx.stroke();
    }
    ctx.fillStyle = dark ? '#3d5a3a' : '#5d8a52';
    ctx.beginPath(); ctx.ellipse(CX, CY + 14, RX + 14, RY + 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark ? '#d9c491' : '#ecd9a4';
    ctx.beginPath(); ctx.ellipse(CX, CY + 6, RX + 8, RY + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = dark ? '#6f9e63' : '#7fae72';
    ctx.beginPath(); ctx.ellipse(CX, CY, RX - 12, RY - 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(217,196,145,.55)'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(330, 305); ctx.quadraticCurveTo(390, 220, 435, 155); ctx.quadraticCurveTo(580, 130, 700, 185); ctx.quadraticCurveTo(800, 230, 872, 300); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(330, 305); ctx.quadraticCurveTo(430, 420, 520, 465); ctx.quadraticCurveTo(640, 470, 745, 415); ctx.stroke();
    for (const r of rocks) { ctx.fillStyle = dark ? '#8b8f94' : '#a7adb3'; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.s, r.s * 0.62, 0.4, 0, Math.PI * 2); ctx.fill(); }
    for (const tr of trees) {
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(tr.x, tr.y + 4, 13 * tr.s, 5 * tr.s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5d4630'; ctx.fillRect(tr.x - 2 * tr.s, tr.y - 6 * tr.s, 4 * tr.s, 9 * tr.s);
      ctx.fillStyle = dark ? '#2e6b34' : '#35793d';
      ctx.beginPath(); ctx.arc(tr.x, tr.y - 14 * tr.s, 12 * tr.s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = dark ? '#3a8142' : '#45904e';
      ctx.beginPath(); ctx.arc(tr.x - 6 * tr.s, tr.y - 9 * tr.s, 8 * tr.s, 0, Math.PI * 2); ctx.fill();
    }
    for (const lm of landmarks) drawBuilding(lm, dark);
    if (target) {
      ctx.strokeStyle = '#007bff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(target.x, target.y, 14 + Math.sin(t / 220) * 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.save();
    ctx.translate(car.x, car.y); ctx.rotate(car.heading);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(-16, -6, 34, 19, 7); ctx.fill();
    ctx.fillStyle = '#141416';
    rr(-13, -11, 9, 4, 2); ctx.fill(); rr(5, -11, 9, 4, 2); ctx.fill(); rr(-13, 7, 9, 4, 2); ctx.fill(); rr(5, 7, 9, 4, 2); ctx.fill();
    ctx.fillStyle = '#007bff'; rr(-17, -9, 34, 18, 6); ctx.fill();
    ctx.fillStyle = '#9fd0ff'; rr(-4, -6, 11, 12, 3); ctx.fill();
    ctx.fillStyle = '#eaf6ff'; ctx.beginPath(); ctx.arc(16, -5, 2.2, 0, Math.PI * 2); ctx.arc(16, 5, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawBuilding(lm, dark) {
    const { x, y } = lm;
    ctx.fillStyle = 'rgba(0,0,0,.20)';
    ctx.beginPath(); ctx.ellipse(x, y + 5, 40, 11, 0, 0, Math.PI * 2); ctx.fill();
    if (lm.kind === 'lighthouse') {
      ctx.fillStyle = '#e8e4da'; rr(x - 11, y - 74, 22, 74, 4); ctx.fill();
      ctx.fillStyle = '#d64541'; rr(x - 11, y - 56, 22, 13, 2); ctx.fill(); rr(x - 11, y - 30, 22, 13, 2); ctx.fill();
      ctx.fillStyle = '#f2b44c'; ctx.beginPath(); ctx.arc(x, y - 84, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(242,180,76,.30)'; ctx.beginPath(); ctx.arc(x, y - 84, 17, 0, Math.PI * 2); ctx.fill();
    } else if (lm.kind === 'tower') {
      ctx.fillStyle = '#4a3f63'; rr(x - 17, y - 26, 34, 26, 3); ctx.fill();
      ctx.fillStyle = lm.roof;
      for (let i = 0; i < 3; i++) {
        const wdt = 52 - i * 11, yy = y - 26 - i * 17;
        ctx.beginPath(); ctx.moveTo(x - wdt / 2, yy); ctx.lineTo(x + wdt / 2, yy); ctx.lineTo(x + wdt / 4, yy - 11); ctx.lineTo(x - wdt / 4, yy - 11); ctx.closePath(); ctx.fill();
        if (i < 2) { ctx.fillStyle = '#4a3f63'; ctx.fillRect(x - 12 + i * 2, yy - 15, 24 - i * 4, 5); ctx.fillStyle = lm.roof; }
      }
    } else {
      const w = 58, hgt = 36;
      ctx.fillStyle = dark ? '#2c2f36' : '#e8e6e0'; rr(x - w / 2, y - hgt, w, hgt, 3); ctx.fill();
      ctx.fillStyle = lm.roof;
      ctx.beginPath(); ctx.moveTo(x - w / 2 - 5, y - hgt); ctx.lineTo(x + w / 2 + 5, y - hgt); ctx.lineTo(x + w / 4, y - hgt - 14); ctx.lineTo(x - w / 4, y - hgt - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd98a'; rr(x - 7, y - 22, 14, 16, 2); ctx.fill();
    }
    const seen = visited.has(lm.id);
    ctx.beginPath(); ctx.arc(x, y - 108, 13.5, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#0e0e10' : '#ffffff'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = seen ? '#007bff' : (dark ? 'rgba(255,255,255,.4)' : 'rgba(20,20,22,.3)'); ctx.stroke();
    ctx.fillStyle = dark ? '#f4f4f2' : '#141416';
    ctx.font = '600 13px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(lm.glyph, x, y - 107);
    ctx.font = '600 13px "PingFang SC","Noto Sans SC",sans-serif';
    const tw = ctx.measureText(lm.name).width + 18;
    ctx.fillStyle = dark ? 'rgba(10,10,12,.82)' : 'rgba(255,255,255,.88)';
    rr(x - tw / 2, y + 13, tw, 22, 11); ctx.fill();
    ctx.fillStyle = dark ? '#f4f4f2' : '#141416';
    ctx.fillText(lm.name, x, y + 24.5);
  }

  function frame(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    step(dt);
    draw(ts);
    raf = requestAnimationFrame(frame);
  }
  function resize() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.width * (WH / WW) * dpr);
  }
  function start() {
    if (running) return;
    resize();
    running = true; last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); keys.clear(); target = null; }
  window.addEventListener('resize', () => { if (running) { resize(); draw(performance.now()); } });
  document.addEventListener('ww-route', (e) => { if (e.detail === 'about') start(); else stop(); });
  if (!document.querySelector('[data-view="about"]').hidden) start();
})();
