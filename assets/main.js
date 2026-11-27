'use strict';

// Theme preferences stay local; the page needs no external fonts or libraries.
const themeToggle = document.querySelector('[data-theme-toggle]');
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  themeToggle.setAttribute('aria-label', isDark ? '切换浅色主题' : '切换深色主题');
  themeToggle.querySelector('.theme-label').textContent = isDark ? '浅色' : '深色';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#171d19' : '#f5f3ec';
}
setTheme(document.documentElement.dataset.theme);
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try { localStorage.setItem('wuwan-theme', next); } catch (_) { /* Storage may be disabled. */ }
});
themeMedia.addEventListener('change', (event) => {
  let saved;
  try { saved = localStorage.getItem('wuwan-theme'); } catch (_) {}
  if (saved !== 'dark' && saved !== 'light') setTheme(event.matches ? 'dark' : 'light');
});

const navLinks = [...document.querySelectorAll('.topbar nav a')];
function updateNavigation() {
  const marker = window.scrollY + 160;
  const current = [...document.querySelectorAll('main > section[id]')]
    .filter(section => section.offsetTop <= marker).pop();
  navLinks.forEach(link => {
    if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { updateNavigation(); scrollPending = false; });
}, { passive: true });
window.addEventListener('resize', updateNavigation);
updateNavigation();

// Preserve old view URLs when replacing the previous online version.
function migrateHash() {
  if (!location.hash.startsWith('#/')) return;
  const id = location.hash.slice(2) || 'home';
  const target = document.getElementById(id);
  if (target) { history.replaceState(null, '', '#' + id); target.scrollIntoView(); }
}
migrateHash();
window.addEventListener('hashchange', migrateHash);

// Keep the real bundled download as a fallback if the GitHub API is unavailable.
async function updateLatestBundle() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('https://api.github.com/repos/Wuwan94/wanBoxForAndroid/releases?per_page=20', { signal: controller.signal });
    if (!response.ok) throw new Error('Release lookup failed');
    const releases = await response.json();
    if (!Array.isArray(releases)) return;
    const bundles = releases.filter(release => !release.draft)
      .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at))
      .flatMap(release => (release.assets || []).filter(asset => /with-manager.*\.zip$/i.test(asset.name)));
    const url = bundles[0] && bundles[0].browser_download_url;
    if (url && url.startsWith('https://github.com/Wuwan94/wanBoxForAndroid/releases/download/')) {
      document.querySelectorAll('[data-latest-bundle]').forEach(link => { link.href = url; });
    }
  } catch (_) { /* The static download remains usable. */ }
  finally { clearTimeout(timeout); }
}
updateLatestBundle();

// geoGate: non-CN IPs are blocked outright, with no way to continue
// (owner's rule, set 2026-11-27). Client-side gate; detection errors
// and timeouts fail open so a lookup failure never locks anyone out.
async function geoGate() {
  const gate = document.getElementById('geoGate');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    let country;
    let ip;
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Trace unavailable');
      const text = await response.text();
      const locMatch = text.match(/^loc=([A-Z]{2})\s*$/m);
      if (!locMatch) throw new Error('Country unavailable');
      country = locMatch[1];
      const ipMatch = text.match(/^ip=(.+)$/m);
      if (ipMatch) ip = ipMatch[1].trim();
    } catch (error) {
      if (controller.signal.aborted) return;
      const response = await fetch('https://ipapi.co/json/', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw error;
      const data = await response.json();
      country = (data.country_code || '').trim().toUpperCase();
      if (data.ip) ip = data.ip;
    }
    if (!controller.signal.aborted && /^[A-Z]{2}$/.test(country) && country !== 'CN') {
      if (ip) document.getElementById('geoIp').textContent = ip;
      gate.hidden = false;
      document.body.classList.add('gate-open');
      document.getElementById('main').inert = true;
      document.querySelector('.topbar').inert = true;
      document.querySelector('footer').inert = true;
    }
  } catch (_) { /* Unknown region: leave the page accessible. */ }
  finally { clearTimeout(timeout); }
}
geoGate();
