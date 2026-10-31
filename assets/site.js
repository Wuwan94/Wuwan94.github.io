(() => {
  const root = document.documentElement;
  const body = document.body;
  const deck = document.getElementById('deck');
  const slides = [...document.querySelectorAll('.slide')];
  const navLinks = [...document.querySelectorAll('[data-slide-link]')];
  const currentLabel = document.getElementById('page-current');
  const dots = [...document.querySelectorAll('.progress-dots i')];
  const themeButtons = [...document.querySelectorAll('.theme-toggle')];
  if (!deck || slides.length !== 4) return;

  let savedTheme = null;
  try { savedTheme = localStorage.getItem('wuwan-theme'); } catch (_) {}
  if (savedTheme === 'light') root.dataset.theme = 'light';
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (next === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    try { localStorage.setItem('wuwan-theme', next); } catch (_) {}
  }));

  const activeIndex = () => Math.max(0, Math.min(slides.length - 1, Math.round(deck.scrollLeft / Math.max(1, deck.clientWidth))));
  const syncStatus = () => {
    const index = activeIndex();
    if (currentLabel) currentLabel.textContent = String(index + 1).padStart(2, '0');
    navLinks.forEach((link) => {
      const active = link.dataset.slideLink === slides[index].id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  };
  const goTo = (index, updateHash = true, smooth = true) => {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    deck.scrollTo({left: target * deck.clientWidth, behavior: smooth ? 'smooth' : 'instant'});
    if (updateHash) history.replaceState(null, '', `#${slides[target].id}`);
    syncStatus();
  };
  const enterDeck = (targetId, setHistory = true) => {
    const index = Math.max(0, slides.findIndex((slide) => slide.id === targetId));
    body.classList.add('in-deck');
    deck.scrollLeft = index * deck.clientWidth;
    if (setHistory) history.replaceState(null, '', `#${slides[index].id}`);
    syncStatus();
  };
  document.querySelectorAll('[data-enter]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    enterDeck(link.dataset.enter);
  }));
  document.querySelectorAll('[data-show-cover]').forEach((link) => link.addEventListener('click', (event) => {
    if (!body.classList.contains('in-deck')) return;
    event.preventDefault();
    body.classList.remove('in-deck');
    history.replaceState(null, '', `${location.pathname}${location.search}`);
  }));
  navLinks.forEach((link) => link.addEventListener('click', (event) => {
    const index = slides.findIndex((slide) => slide.id === link.dataset.slideLink);
    if (index < 0) return;
    event.preventDefault();
    goTo(index);
  }));
  document.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => goTo(activeIndex() + Number(button.dataset.step))));

  let frame = 0;
  let hashTimer = 0;
  deck.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      syncStatus();
      frame = 0;
      if (!body.classList.contains('in-deck')) return;
      window.clearTimeout(hashTimer);
      hashTimer = window.setTimeout(() => {
        const id = slides[activeIndex()].id;
        if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
      }, 180);
    });
  }, {passive: true});
  let touchStart = null;
  let suppressTouchClick = false;
  deck.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !body.classList.contains('in-deck')) return;
    touchStart = {id: event.pointerId, x: event.clientX, y: event.clientY};
    deck.setPointerCapture(event.pointerId);
  });
  deck.addEventListener('pointerup', (event) => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    event.preventDefault();
    suppressTouchClick = true;
    goTo(activeIndex() + (dx < 0 ? 1 : -1));
    window.setTimeout(() => { suppressTouchClick = false; }, 350);
  });
  deck.addEventListener('pointercancel', () => { touchStart = null; });
  deck.addEventListener('click', (event) => {
    if (!suppressTouchClick) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  let wheelLocked = false;
  deck.addEventListener('wheel', (event) => {
    if (!body.classList.contains('in-deck')) return;
    const vertical = Math.abs(event.deltaY) > Math.abs(event.deltaX) * 1.15;
    if (!vertical || Math.abs(event.deltaY) < 18) return;
    if (event.cancelable) event.preventDefault();
    if (wheelLocked) return;
    wheelLocked = true;
    goTo(activeIndex() + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => { wheelLocked = false; }, 720);
  }, {passive: false});
  document.addEventListener('keydown', (event) => {
    if (!body.classList.contains('in-deck')) return;
    const target = event.target;
    if (target?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(target?.tagName)) return;
    if (['ArrowRight','PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
      event.preventDefault(); goTo(activeIndex() + 1);
    } else if (['ArrowLeft','PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
      event.preventDefault(); goTo(activeIndex() - 1);
    } else if (event.key === 'Home') {
      event.preventDefault(); goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault(); goTo(slides.length - 1);
    } else if (event.key === 'Escape') {
      body.classList.remove('in-deck');
      history.replaceState(null, '', `${location.pathname}${location.search}`);
    }
  });
  window.addEventListener('resize', () => { if (body.classList.contains('in-deck')) deck.scrollLeft = activeIndex() * deck.clientWidth; });

  const initial = location.hash.slice(1);
  if (slides.some((slide) => slide.id === initial)) enterDeck(initial, false);
  else syncStatus();

  const downloadLinks = [...document.querySelectorAll('[data-latest-download]')];
  if (downloadLinks.length) {
    const releasesPage = 'https://github.com/Wuwan94/wanBoxForAndroid/releases';
    const applyRelease = (url, tag) => downloadLinks.forEach((link) => {
      link.href = url;
      if (tag) {
        link.title = `自动指向仓库最新发布：${tag}`;
        link.setAttribute('aria-label', `下载 wanBox 最新客户端（${tag}）`);
        link.dataset.releaseTag = tag;
      } else {
        link.title = '打开 GitHub Releases 查看最新客户端';
        delete link.dataset.releaseTag;
      }
    });
    fetch('https://api.github.com/repos/Wuwan94/wanBoxForAndroid/releases?per_page=10', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    }).then((response) => {
      if (!response.ok) throw new Error('release lookup unavailable');
      return response.json();
    }).then((releases) => {
      const apk = releases
        .filter((release) => !release.draft && Array.isArray(release.assets))
        .flatMap((release) => release.assets
          .filter((asset) => asset.name.toLowerCase().endsWith('.apk') && asset.name.toLowerCase().includes('arm64-v8a'))
          .map((asset) => ({ asset, release })))
        .sort((a, b) => new Date(b.release.published_at || b.release.created_at) - new Date(a.release.published_at || a.release.created_at))[0];
      if (!apk?.asset?.browser_download_url) throw new Error('no matching APK asset');
      applyRelease(apk.asset.browser_download_url, apk.release.tag_name);
    }).catch(() => {
      applyRelease(releasesPage, '');
    });
  }

  // Preserve the original China-only rule, fallback and six-second fail-open timeout.
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
  fromTrace().catch(fromIpapi).then((country) => country === 'CN' ? allow() : block()).catch(allow);
  window.setTimeout(() => {
    if (gate.style.display !== 'none' && gate.querySelector('h2')?.textContent.startsWith('正在确认')) allow();
  }, 6000);
})();
