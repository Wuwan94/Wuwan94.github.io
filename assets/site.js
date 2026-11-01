(() => {
  const root = document.documentElement;
  const gate = document.getElementById('geoGate');
  const retry = gate?.querySelector('.gate-retry');
  const contact = gate?.querySelector('.gate-contact');

  let theme = 'dark';
  try { theme = localStorage.getItem('wuwan-theme') === 'light' ? 'light' : 'dark'; } catch (_) {}
  const setTheme = (next) => {
    theme = next;
    if (theme === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      const label = theme === 'light' ? '切换到深色主题' : '切换到浅色主题';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.textContent = theme === 'light' ? '深色' : '浅色';
    });
    try { localStorage.setItem('wuwan-theme', theme); } catch (_) {}
  };
  setTheme(theme);
  document.querySelectorAll('.theme-toggle').forEach((button) => button.addEventListener('click', () => setTheme(theme === 'light' ? 'dark' : 'light')));

  const menu = document.querySelector('.mobile-nav');
  menu?.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => { menu.open = false; }));

  if (window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches && 'IntersectionObserver' in window) {
    document.body.classList.add('has-motion');
    const reveal = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    document.querySelectorAll('[data-reveal]').forEach((element) => reveal.observe(element));
  }

  const downloadLinks = [...document.querySelectorAll('[data-latest-bundle]')];
  if (downloadLinks.length) {
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
      if (!bundle?.asset?.browser_download_url) throw new Error('no matching release bundle');
      downloadLinks.forEach((link) => {
        link.href = bundle.asset.browser_download_url;
        link.title = `自动指向最新版本：${bundle.release.tag_name}`;
        link.setAttribute('aria-label', `下载 wanBox 最新合并包（${bundle.release.tag_name}）`);
      });
    }).catch(() => {
      // Keep the known GitHub release listing as a useful fallback.
    });
  }

  if (!gate) return;
  const setGate = (title, detail, canRetry = false) => {
    const heading = gate.querySelector('h2');
    const paragraph = gate.querySelector(':scope > .gate-box > p');
    if (heading) heading.textContent = title;
    if (paragraph) paragraph.textContent = detail;
    if (retry) retry.hidden = !canRetry;
    if (contact) contact.hidden = !canRetry;
  };
  const allow = () => {
    gate.hidden = true;
    gate.setAttribute('aria-hidden', 'true');
  };
  const localPreviewHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (localPreviewHost) {
    allow();
    return;
  }

  const fetchCountry = async (url, parse) => {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) throw new Error('location service unavailable');
    const country = parse(await response.text());
    if (!/^[A-Z]{2}$/.test(country)) throw new Error('location unavailable');
    return country;
  };
  const checkRegion = async () => {
    setGate('正在确认访问地区', '请稍候。若验证服务暂不可用，可以稍后重试。');
    const checks = await Promise.allSettled([
      fetchCountry('https://www.cloudflare.com/cdn-cgi/trace', (text) => text.match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/)?.[1] || ''),
      fetchCountry('https://ipapi.co/country/', (text) => text.trim().toUpperCase())
    ]);
    const countries = [...new Set(checks.filter((item) => item.status === 'fulfilled').map((item) => item.value))];
    if (countries.length > 1) {
      setGate('暂时无法确认访问地区', '网络定位结果不一致。请稍后重新检查，或联系站长。', true);
      return;
    }
    if (!countries.length) {
      setGate('地区验证暂不可用', '定位服务没有返回结果。请检查网络后重试。', true);
      return;
    }
    if (countries[0] === 'CN') {
      allow();
      return;
    }
    setGate('本站暂不开放此地区访问', '网站目前仅面向中国大陆访问。若你认为这是误判，可联系站长。', true);
  };
  retry?.addEventListener('click', checkRegion);
  checkRegion();
})();
