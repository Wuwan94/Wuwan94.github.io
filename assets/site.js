(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const currentPage = document.body.dataset.page;

  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  let savedTheme = null;
  try { savedTheme = localStorage.getItem('wuwan-theme'); } catch (_) {}
  if (savedTheme === 'light') root.dataset.theme = 'light';

  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    if (next === 'light') root.dataset.theme = 'light';
    else delete root.dataset.theme;
    try { localStorage.setItem('wuwan-theme', next); } catch (_) {}
  });

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? '打开导航' : '关闭导航');
    nav?.classList.toggle('is-open', !isOpen);
  });

  // Preserve the original China-only gate: allow CN, otherwise show the same block notice.
  const gate = document.getElementById('geoGate');
  if (!gate) return;
  const allow = () => { gate.style.display = 'none'; };
  let visitorIp = '';
  const block = () => {
    const detail = visitorIp ? `<p>${visitorIp}</p>` : '';
    gate.innerHTML = `<div class="box"><h2>此 IP 已被拉黑</h2>${detail}<p>本站仅向中国地区 IP 开放。</p></div>`;
  };
  const fromTrace = () => fetch('https://www.cloudflare.com/cdn-cgi/trace')
    .then((r) => r.text())
    .then((text) => {
      const country = text.match(/loc=([A-Z]{2})/);
      if (!country) throw new Error('no loc');
      const ip = text.match(/ip=([^\n]+)/);
      if (ip) visitorIp = ip[1].trim();
      return country[1];
    });
  const fromIpapi = () => fetch('https://ipapi.co/country/')
    .then((r) => r.text())
    .then((text) => {
      const country = text.trim().toUpperCase();
      if (!/^[A-Z]{2}$/.test(country)) throw new Error('bad country');
      return country;
    });

  fromTrace().catch(fromIpapi).then((country) => {
    if (country === 'CN') allow();
    else block();
  }).catch(allow);
  setTimeout(() => {
    if (gate.style.display !== 'none' && gate.querySelector('h2')?.textContent.startsWith('正在确认')) allow();
  }, 6000);
})();
