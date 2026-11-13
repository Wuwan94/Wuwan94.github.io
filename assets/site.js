(() => {
  'use strict';

  const root = document.documentElement;

  /* ========================================================
     1. Theme Management (雾 / 晚 · Day / Night)
     ======================================================== */
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const sysLightQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  let storedTheme = null;
  try { storedTheme = localStorage.getItem('wuwan-theme'); } catch (_) {}

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'light' ? '#f4f6fa' : '#090b10');
    }
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const modeText = btn.querySelector('.theme-mode-text');
      if (modeText) {
        modeText.textContent = theme === 'light' ? '雾 · 白天' : '晚 · 深夜';
      }
      btn.setAttribute('aria-label', theme === 'light' ? '当前白天模式（雾），切换到黑夜模式' : '当前黑夜模式（晚），切换到白天模式');
    });
  };

  const initialTheme = storedTheme === 'light' || storedTheme === 'dark' 
    ? storedTheme 
    : (sysLightQuery && sysLightQuery.matches ? 'light' : 'dark');
  applyTheme(initialTheme);

  if (sysLightQuery) {
    const handleSysChange = (e) => {
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    };
    if (sysLightQuery.addEventListener) sysLightQuery.addEventListener('change', handleSysChange);
    else if (sysLightQuery.addListener) sysLightQuery.addListener(handleSysChange);
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      storedTheme = next;
      try { localStorage.setItem('wuwan-theme', next); } catch (_) {}
      applyTheme(next);
    });
  });

  /* ========================================================
     2. Interactive Spotlight & Mouse Tracking
     ======================================================== */
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    root.style.setProperty('--mouse-x', `${mouseX}px`);
    root.style.setProperty('--mouse-y', `${mouseY}px`);
  }, { passive: true });

  /* ========================================================
     3. Ambient Mist & Starlight Canvas
     ======================================================== */
  const canvas = document.getElementById('mistCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let particles = [];
    const count = Math.min(85, Math.max(35, Math.floor(window.innerWidth / 20)));

    const colorsDark = [
      '56, 189, 248',  // Electric Cyan
      '168, 85, 247',  // Cosmic Violet
      '251, 191, 36',  // Warm Amber
      '52, 211, 153',  // Emerald Mint
      '244, 114, 182'  // Neon Pink
    ];

    const colorsLight = [
      '2, 132, 199',   // Cobalt Blue
      '147, 51, 234',  // Purple
      '217, 119, 6',   // Deep Amber
      '16, 185, 129',  // Emerald
      '219, 39, 119'   // Rose
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });
    resize();

    class Particle {
      constructor() {
        this.colorIdx = Math.floor(Math.random() * colorsDark.length);
        this.reset(true);
      }
      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.size = Math.random() * 2.2 + 0.8;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(Math.random() * 0.45 + 0.18);
        this.alpha = Math.random() * 0.6 + 0.25;
        this.baseAlpha = this.alpha;
        this.pulse = Math.random() * Math.PI;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += 0.02;
        this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.2;

        // Mouse proximity interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          const force = (1 - dist / 160) * 1.2;
          this.x -= (dx / dist) * force;
          this.y -= (dy / dist) * force;
          this.alpha = Math.min(1.0, this.alpha + 0.4);
        }

        if (this.y < -20 || this.x < -20 || this.x > width + 20) {
          this.reset(false);
        }
      }
      draw(isDark) {
        const rgb = isDark ? colorsDark[this.colorIdx] : colorsLight[this.colorIdx];
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.12, this.alpha * (isDark ? 0.75 : 0.65))})`;
        ctx.shadowBlur = isDark ? 10 : 5;
        ctx.shadowColor = `rgba(${rgb}, ${isDark ? 0.55 : 0.35})`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    let animId = null;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = root.dataset.theme !== 'light';

      // Connect close particles with delicate faint lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 95) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const lineAlpha = (1 - dist / 105) * (isDark ? 0.15 : 0.1);
            const rgb = isDark ? colorsDark[particles[i].colorIdx] : colorsLight[particles[i].colorIdx];
            ctx.strokeStyle = `rgba(${rgb}, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw(isDark);
      });

      if (!document.hidden) {
        animId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(render);
      }
    });

    render();
  }

  /* ========================================================
     4. Navigation & Active ScrollSpy
     ======================================================== */
  const navLinks = [...document.querySelectorAll('[data-nav-target]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileNavToggle && navMenu) {
    mobileNavToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      mobileNavToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        mobileNavToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ScrollSpy with IntersectionObserver
  if ('IntersectionObserver' in window && sections.length) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, observerOptions);

    sections.forEach((sec) => sectionObserver.observe(sec));
  }

  /* ========================================================
     5. GitHub Release Latest Bundle Dynamic Follower
     ======================================================== */
  const bundleLinks = [...document.querySelectorAll('[data-latest-bundle]')];
  if (bundleLinks.length) {
    const applyBundle = (url, tag) => {
      bundleLinks.forEach((link) => {
        link.href = url;
        if (tag) {
          link.title = `自动拉取最新产物：${tag}`;
          link.dataset.releaseTag = tag;
        }
      });
    };

    fetch('https://api.github.com/repos/Wuwan94/wanBoxForAndroid/releases?per_page=10', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('release lookup failed'))))
      .then((releases) => {
        const bundle = releases
          .filter((rel) => !rel.draft && Array.isArray(rel.assets))
          .flatMap((rel) =>
            rel.assets
              .filter((asset) => asset.name.toLowerCase().includes('with-manager') && asset.name.toLowerCase().endsWith('.zip'))
              .map((asset) => ({ asset, rel }))
          )
          .sort((a, b) => new Date(b.rel.published_at || b.rel.created_at) - new Date(a.rel.published_at || a.rel.created_at))[0];

        if (bundle && bundle.asset && bundle.asset.browser_download_url) {
          applyBundle(bundle.asset.browser_download_url, bundle.rel.tag_name);
        }
      })
      .catch(() => { /* keep default static link */ });
  }

  /* ========================================================
     6. Geo Gate (China-only with clean fail-open fallback)
     ======================================================== */
  const gate = document.getElementById('geoGate');
  if (gate) {
    const allow = () => { gate.style.display = 'none'; };
    if (window.location.search.includes('preview=1') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      allow();
      return;
    }
    let visitorIp = '';
    const block = () => {
      const detail = visitorIp ? `<p style="font-family:var(--font-mono);font-size:0.85rem;color:var(--accent);margin-bottom:8px;">IP: ${visitorIp}</p>` : '';
      gate.innerHTML = `
        <div class="box">
          <h2>访问区域受限</h2>
          ${detail}
          <p>本站目前仅对中国大陆地区 IP 开放访问。感谢您的理解与关注！</p>
        </div>`;
    };

    const fromTrace = () =>
      fetch('https://www.cloudflare.com/cdn-cgi/trace')
        .then((r) => r.text())
        .then((text) => {
          const country = text.match(/loc=([A-Z]{2})/);
          if (!country) throw new Error('no loc');
          const ip = text.match(/ip=([^\n]+)/);
          if (ip) visitorIp = ip[1].trim();
          return country[1];
        });

    const fromIpapi = () =>
      fetch('https://ipapi.co/country/')
        .then((r) => r.text())
        .then((text) => {
          const country = text.trim().toUpperCase();
          if (!/^[A-Z]{2}$/.test(country)) throw new Error('bad country');
          return country;
        });

    const firstOk = (promises) =>
      new Promise((resolve, reject) => {
        let count = promises.length;
        promises.forEach((p) => p.then(resolve, () => { if (--count === 0) reject(new Error('all failed')); }));
      });

    firstOk([fromTrace(), fromIpapi()])
      .then((country) => (country === 'CN' ? allow() : block()))
      .catch(allow);

    window.setTimeout(() => {
      if (gate.style.display !== 'none' && gate.querySelector('h2') && gate.querySelector('h2').textContent.startsWith('正在确认')) {
        allow();
      }
    }, 2400);
  }
})();
