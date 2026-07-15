 (() => {
  'use strict';
  const SUPABASE_URL ='https://rnmiwvunzlrjwfjfrofa.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_secret_lTuy1WI_toG3psJPfRbuwg_hDuOzx1L';
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
  const REDIRECT_ON_SUCCESS = isAdmin ? 'admin-dashboard.html' : 'dashboard.html';

  const supabaseClient = (SUPABASE_URL.startsWith('http') && window.supabase)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- admin mode (via ?admin=1) ----------
  if (isAdmin) {
    document.body.classList.add('admin-mode');
    document.getElementById('cardEyebrow').textContent = 'Restricted Access';
    document.getElementById('cardHeading').textContent = 'Admin Sign In.';
    document.getElementById('cardSub').textContent = 'Enter your administrator credentials to manage the Academy.';
    const adminLink = document.getElementById('adminLink');
    if (adminLink) { adminLink.textContent = ''; adminLink.remove(); }
  }

  // ---------- cinematic intro sequence ----------
  const introOverlay = document.getElementById('introOverlay');
  const authCard = document.getElementById('authCard');

  function endIntro() {
    introOverlay.classList.add('is-hidden');
    authCard.classList.add('is-revealed');
  }

  if (reduceMotion) {
    endIntro();
  } else {
    const introTimer = setTimeout(endIntro, 2400);
    introOverlay.addEventListener('click', () => { clearTimeout(introTimer); endIntro(); });
    window.addEventListener('keydown', function skipOnce(e) {
      clearTimeout(introTimer);
      endIntro();
      window.removeEventListener('keydown', skipOnce);
    }, { once: true });
  }

  // ---------- lamp parallax on pointer movement ----------
  const lampGlowEl = document.getElementById('lampGlow');
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    window.addEventListener('mousemove', (e) => {
      const xPct = (e.clientX / window.innerWidth - 0.5) * 24;
      const yPct = (e.clientY / window.innerHeight - 0.5) * 24;
      lampGlowEl.style.marginLeft = xPct + 'px';
      lampGlowEl.style.marginTop = yPct + 'px';
    });
  }

  // ---------- lamp glow: brightens as the form fills in ----------
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const lampGlow = document.getElementById('lampGlow');

  function updateLampIntensity() {
    const filled = [emailInput.value.trim(), passwordInput.value.trim()].filter(Boolean).length;
    lampGlow.classList.toggle('is-brighter', filled > 0);
  }
  emailInput.addEventListener('input', updateLampIntensity);
  passwordInput.addEventListener('input', updateLampIntensity);
  emailInput.addEventListener('focus', updateLampIntensity);
  passwordInput.addEventListener('focus', updateLampIntensity);

  // ---------- password visibility toggle ----------
  const toggleBtn = document.getElementById('passwordToggle');
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });

  // ---------- form submission ----------
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorBox = document.getElementById('authError');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle('is-loading', isLoading);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Enter both your email and password to continue.');
      return;
    }

    if (!supabaseClient) {
      showError('Sign-in isn\'t connected yet — add your Supabase URL and anon key in login.js.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        showError(error.message === 'Invalid login credentials'
          ? 'That email and password don\'t match our records.'
          : error.message);
        setLoading(false);
        return;
      }
      window.location.href = REDIRECT_ON_SUCCESS;
    } catch (err) {
      showError('Something went wrong. Check your connection and try again.');
      setLoading(false);
    }
  });

  // ---------- ambient dust particles ----------
  const canvas = document.getElementById('dustCanvas');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  let motes = [];
  let width, height, dpr;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeMote() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.3,
      speed: Math.random() * 0.12 + 0.03,
      drift: (Math.random() - 0.5) * 0.08,
      flicker: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.35 + 0.1,
    };
  }

  function initMotes() {
    const count = Math.min(Math.floor((width * height) / 14000), 90);
    motes = Array.from({ length: count }, makeMote);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const m of motes) {
      m.y -= m.speed;
      m.x += m.drift;
      m.flicker += 0.015;
      if (m.y < -5) Object.assign(m, makeMote(), { y: height + 5 });

      const flicker = (Math.sin(m.flicker) + 1) / 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(217, 169, 78, ${m.alpha * (0.4 + flicker * 0.6)})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  initMotes();
  requestAnimationFrame(draw);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { resize(); initMotes(); }, 200);
  });
})();
