(() => {
  const root = document.documentElement;
  const body = document.body;
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const navLinks = [...document.querySelectorAll('[data-slide-link]')];
  if (!deck || slides.length !== 5) return;

  /* ---------- 雾 / 晚 : day and night ---------- */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const sysLight = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  let stored = null;
  try { stored = localStorage.getItem('wuwan-theme'); } catch (_) {}
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#e8ebee' : '#0b0c0f');
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'light' ? '当前白天模式（雾），切换到黑夜模式' : '当前黑夜模式（晚），切换到白天模式');
      btn.title = theme === 'light' ? '雾 · 白天' : '晚 · 黑夜';
    });
  };
  applyTheme(stored === 'light' || stored === 'dark' ? stored : (sysLight && sysLight.matches ? 'light' : 'dark'));
  if (sysLight) {
    const onSys = (e) => { if (stored !== 'light' && stored !== 'dark') applyTheme(e.matches ? 'light' : 'dark'); };
    if (sysLight.addEventListener) sysLight.addEventListener('change', onSys); else if (sysLight.addListener) sysLight.addListener(onSys);
  }
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    stored = next;
    try { localStorage.setItem('wuwan-theme', next); } catch (_) {}
    btn.classList.add('is-flipping');
    window.setTimeout(() => btn.classList.remove('is-flipping'), 360);
    applyTheme(next);
  }));

  /* ---------- deck ---------- */
  const activeIndex = () => Math.max(0, Math.min(slides.length - 1, Math.round(deck.scrollLeft / Math.max(1, deck.clientWidth))));
  const syncStatus = () => {
    const index = activeIndex();
    navLinks.forEach((link) => {
      const active = link.dataset.slideLink === slides[index].id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    if (body.classList.contains('in-deck')) slides[index].classList.add('is-in');
  };
  const goTo = (index, updateHash = true) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    deck.scrollTo({ left: target * deck.clientWidth, behavior: 'smooth' });
    if (updateHash) history.replaceState(null, '', `#${slides[target].id}`);
    slides[target].classList.add('is-in');
    syncStatus();
  };
  const enterDeck = (targetId, setHistory = true) => {
    const index = Math.max(0, slides.findIndex((slide) => slide.id === targetId));
    body.classList.add('in-deck');
    const prev = deck.style.scrollBehavior;
    deck.style.scrollBehavior = 'auto';
    deck.scrollLeft = index * deck.clientWidth;
    deck.style.scrollBehavior = prev;
    if (setHistory) history.replaceState(null, '', `#${slides[index].id}`);
    requestAnimationFrame(() => { slides[index].classList.add('is-in'); syncStatus(); });
    deck.focus({ preventScroll: true });
  };
  const leaveDeck = () => {
    body.classList.remove('in-deck');
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  };
  document.querySelectorAll('[data-enter]').forEach((link) => link.addEventListener('click', (event) => {
    if (link.dataset.dragged === '1') { event.preventDefault(); return; }
    event.preventDefault();
    enterDeck(link.dataset.enter);
  }));
  document.querySelectorAll('[data-show-cover]').forEach((link) => link.addEventListener('click', (event) => {
    if (!body.classList.contains('in-deck')) return;
    event.preventDefault();
    leaveDeck();
  }));
  navLinks.forEach((link) => link.addEventListener('click', (event) => {
    const index = slides.findIndex((slide) => slide.id === link.dataset.slideLink);
    if (index < 0) return;
    event.preventDefault();
    goTo(index);
  }));

  let frame = 0;
  let hashTimer = 0;
  deck.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      syncStatus();
      if (!body.classList.contains('in-deck')) return;
      window.clearTimeout(hashTimer);
      hashTimer = window.setTimeout(() => {
        const id = slides[activeIndex()].id;
        if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
      }, 180);
    });
  }, { passive: true });

  /* touch swipe between slides (vertical pans stay native for the slide's own scroll) */
  let touchStart = null;
  let suppressTouchClick = false;
  deck.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !body.classList.contains('in-deck')) return;
    touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  deck.addEventListener('pointerup', (event) => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    suppressTouchClick = true;
    goTo(activeIndex() + (dx < 0 ? 1 : -1));
    window.setTimeout(() => { suppressTouchClick = false; }, 350);
  });
  deck.addEventListener('pointercancel', (event) => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    /* a horizontal swipe can be cancelled by the browser; judge it on the last move */
    touchStart = null;
  });
  deck.addEventListener('touchend', (event) => {
    /* fallback for browsers that cancel pointers during a pan */
    const t = event.changedTouches && event.changedTouches[0];
    if (!t || !deck._touch) return;
    const dx = t.clientX - deck._touch.x;
    const dy = t.clientY - deck._touch.y;
    deck._touch = null;
    if (suppressTouchClick || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    suppressTouchClick = true;
    goTo(activeIndex() + (dx < 0 ? 1 : -1));
    window.setTimeout(() => { suppressTouchClick = false; }, 350);
  }, { passive: true });
  deck.addEventListener('touchstart', (event) => {
    const t = event.touches && event.touches[0];
    deck._touch = t ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  deck.addEventListener('click', (event) => {
    if (!suppressTouchClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  /* mouse wheel: scroll the slide's own text first, then turn the page */
  let wheelLocked = false;
  deck.addEventListener('wheel', (event) => {
    if (!body.classList.contains('in-deck')) return;
    const vertical = Math.abs(event.deltaY) > Math.abs(event.deltaX) * 1.15;
    if (!vertical || Math.abs(event.deltaY) < 18) return;
    const scroller = event.target.closest && event.target.closest('.slide-scroll');
    if (scroller) {
      const canDown = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2;
      const canUp = scroller.scrollTop > 2;
      if ((event.deltaY > 0 && canDown) || (event.deltaY < 0 && canUp)) return;
    }
    if (event.cancelable) event.preventDefault();
    if (wheelLocked) return;
    wheelLocked = true;
    goTo(activeIndex() + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => { wheelLocked = false; }, 720);
  }, { passive: false });

  document.addEventListener('keydown', (event) => {
    if (!body.classList.contains('in-deck')) return;
    const target = event.target;
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
    if (['ArrowRight', 'PageDown'].includes(event.key)) { event.preventDefault(); goTo(activeIndex() + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); goTo(activeIndex() - 1); }
    else if (event.key === 'Home') { event.preventDefault(); goTo(0); }
    else if (event.key === 'End') { event.preventDefault(); goTo(slides.length - 1); }
    else if (event.key === 'Escape') leaveDeck();
  });
  window.addEventListener('resize', () => {
    if (!body.classList.contains('in-deck')) return;
    deck.style.scrollBehavior = 'auto';
    deck.scrollLeft = activeIndex() * deck.clientWidth;
    deck.style.scrollBehavior = '';
  });

  /* ---------- the lit strip on the cover: drag it, the centre frame is lit ---------- */
  const strip = document.querySelector('.strip');
  if (strip) {
    const frames = [...strip.querySelectorAll('.frame')];
    const light = () => {
      const mid = strip.getBoundingClientRect().left + strip.clientWidth / 2;
      let best = null; let bestD = Infinity;
      frames.forEach((f) => { const r = f.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bestD) { bestD = d; best = f; } });
      frames.forEach((f) => f.classList.toggle('is-lit', f === best));
    };
    let lf = 0;
    strip.addEventListener('scroll', () => { if (!lf) lf = requestAnimationFrame(() => { lf = 0; light(); }); }, { passive: true });
    window.addEventListener('resize', light);
    light();
    let drag = null;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: strip.scrollLeft, moved: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; strip.classList.add('is-dragging'); }
      if (drag.moved) strip.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      strip.classList.remove('is-dragging');
      if (moved) {
        frames.forEach((f) => { f.dataset.dragged = '1'; });
        window.setTimeout(() => frames.forEach((f) => { delete f.dataset.dragged; }), 50);
      }
    });
    strip.addEventListener('dragstart', (e) => e.preventDefault());
  }

  const initial = location.hash.slice(1);
  if (slides.some((slide) => slide.id === initial)) enterDeck(initial, false);
  else syncStatus();

  /* ---------- download button follows the newest with-manager bundle ---------- */
  const bundleLinks = [...document.querySelectorAll('[data-latest-bundle]')];
  if (bundleLinks.length) {
    const applyBundle = (url, tag) => bundleLinks.forEach((link) => {
      link.href = url;
      if (tag) {
        link.title = `自动指向最新合并包：${tag}`;
        link.setAttribute('aria-label', `下载 wanBox 最新合并包（${tag}）`);
        link.dataset.releaseTag = tag;
      }
    });
    fetch('https://api.github.com/repos/Wuwan94/wanBoxForAndroid/releases?per_page=10', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    }).then((response) => {
      if (!response.ok) throw new Error('release lookup unavailable');
      return response.json();
    }).then((releases) => {
      const bundle = releases
        .filter((release) => !release.draft && Array.isArray(release.assets))
        .flatMap((release) => release.assets
          .filter((asset) => asset.name.toLowerCase().includes('with-manager') && asset.name.toLowerCase().endsWith('.zip'))
          .map((asset) => ({ asset, release })))
        .sort((a, b) => new Date(b.release.published_at || b.release.created_at) - new Date(a.release.published_at || a.release.created_at))[0];
      if (!bundle || !bundle.asset || !bundle.asset.browser_download_url) throw new Error('no matching bundle asset');
      applyBundle(bundle.asset.browser_download_url, bundle.release.tag_name);
    }).catch(() => { /* keep the static link already in the page */ });
  }

  /* ---------- geo gate: same China-only rule, fallback and fail-open timeout as the live site ---------- */
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
