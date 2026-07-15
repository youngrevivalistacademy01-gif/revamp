(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- mobile nav ---
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');

  navToggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
      header.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // --- scroll reveals ---
  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // --- stat count-up ---
  const stats = document.querySelectorAll('.stat-num');
  function animateStat(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    if (reduceMotion) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(tick);
    }
  }

  if (stats.length && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(el => statObserver.observe(el));
  }

  // --- ember particles in the hero ---
  const canvas = document.getElementById('emberCanvas');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  let embers = [];
  let width, height, dpr;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeEmber() {
    return {
      x: Math.random() * width,
      y: height + Math.random() * 60,
      r: Math.random() * 1.6 + 0.5,
      speed: Math.random() * 0.4 + 0.15,
      drift: (Math.random() - 0.5) * 0.3,
      flicker: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.5 + 0.3,
    };
  }

  function initEmbers() {
    const count = Math.min(Math.floor(width / 18), 70);
    embers = Array.from({ length: count }, makeEmber);
  }

  function drawEmbers(time) {
    ctx.clearRect(0, 0, width, height);
    for (const e of embers) {
      e.y -= e.speed;
      e.x += e.drift;
      e.flicker += 0.03;
      if (e.y < -10) Object.assign(e, makeEmber(), { y: height + 10 });

      const flicker = (Math.sin(e.flicker) + 1) / 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(233, 195, 122, ${e.alpha * (0.5 + flicker * 0.5)})`;
      ctx.fill();
    }
    requestAnimationFrame(drawEmbers);
  }

  resizeCanvas();
  initEmbers();
  requestAnimationFrame(drawEmbers);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeCanvas();
      initEmbers();
    }, 200);
  });
})();

