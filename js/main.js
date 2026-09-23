/**
 * umarsofiyaan.shop — v4 Visual Narrative Engine
 * Scroll-driven cinematic showcase: Code → Inbox → Dashboard → Terminal
 * Each scene lives inside a persistent window frame.
 */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let wW = window.innerWidth, wH = window.innerHeight;
  let mouseX = 0, mouseY = 0, normX = 0, normY = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; normX = (e.clientX / wW) * 2 - 1; normY = -(e.clientY / wH) * 2 + 1; });
  window.addEventListener('resize', debounce(() => { wW = window.innerWidth; wH = window.innerHeight; }, 250));

  /* ════════════════════════════════════════
     LOADER
     ════════════════════════════════════════ */
  function initLoader() {
    const el = document.getElementById('loader');
    const fill = document.querySelector('.loader-bar-fill');
    const ctr = document.querySelector('.loader-counter');
    if (!el) return;
    if (RM) { el.style.display = 'none'; heroIn(); return; }
    const p = { v: 0 };
    gsap.to(p, {
      v: 100, duration: 1.8, ease: 'power2.inOut',
      onUpdate: () => { if (ctr) ctr.textContent = Math.floor(p.v); if (fill) fill.style.width = p.v + '%'; },
      onComplete: () => { el.classList.add('done'); setTimeout(() => { el.style.display = 'none'; heroIn(); }, 500); }
    });
  }

  /* ════════════════════════════════════════
     CURSOR
     ════════════════════════════════════════ */
  function initCursor() {
    if (RM || wW <= 768) return;
    const c = document.getElementById('cursor');
    const dot = c?.querySelector('.cursor-dot'), ring = c?.querySelector('.cursor-ring');
    if (!c || !dot || !ring) return;
    let dx = 0, dy = 0, rx = 0, ry = 0, sc = 1, op = 1, hov = false;
    document.querySelectorAll('a,button,[data-magnetic]').forEach(el => {
      el.addEventListener('mouseenter', () => { hov = true; c.classList.add('hovering'); });
      el.addEventListener('mouseleave', () => { hov = false; c.classList.remove('hovering'); });
    });
    (function tick() {
      dx = lerp(dx, mouseX, .15); dy = lerp(dy, mouseY, .15);
      rx = lerp(rx, mouseX, .08); ry = lerp(ry, mouseY, .08);
      sc = lerp(sc, hov ? 1.5 : 1, .1); op = lerp(op, hov ? .5 : 1, .1);
      dot.style.transform = `translate3d(${dx}px,${dy}px,0) translate(-50%,-50%)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${sc})`;
      ring.style.opacity = op;
      requestAnimationFrame(tick);
    })();
  }

  /* ════════════════════════════════════════
     THREE.JS
     ════════════════════════════════════════ */
  function initThree() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined' || RM) return;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(75, wW / wH, 0.1, 1000);
    cam.position.z = 50;
    const ren = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    ren.setSize(wW, wH); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
    const grp = new THREE.Group(); scene.add(grp);
    const geo = new THREE.IcosahedronGeometry(15, 3);
    const globe = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x6366f1, opacity: 0.12, transparent: true }));
    grp.add(globe);
    const pGeo = new THREE.BufferGeometry(); const cnt = 500; const pos = new Float32Array(cnt * 3);
    for (let i = 0; i < cnt * 3; i += 3) { const u = Math.random(), v = Math.random(), th = u * Math.PI * 2, ph = Math.acos(2 * v - 1), r = Math.cbrt(Math.random()) * 70; pos[i] = r * Math.sin(ph) * Math.cos(th); pos[i + 1] = r * Math.sin(ph) * Math.sin(th); pos[i + 2] = r * Math.cos(ph); }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .3, color: 0x6366f1, transparent: true, opacity: .35, blending: THREE.AdditiveBlending }));
    scene.add(pts);
    gsap.to(grp.position, { z: -60, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 } });
    (function anim() { requestAnimationFrame(anim); globe.rotation.y += .001; globe.rotation.x += .0005; pts.rotation.y -= .0004; cam.position.x += (normX * 5 - cam.position.x) * .02; cam.position.y += (normY * 3 - cam.position.y) * .02; cam.lookAt(scene.position); ren.render(scene, cam); })();
    window.addEventListener('resize', debounce(() => { cam.aspect = wW / wH; cam.updateProjectionMatrix(); ren.setSize(wW, wH); }, 250));
  }

  /* ════════════════════════════════════════
     NAV
     ════════════════════════════════════════ */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => nav.classList.toggle('nav-scrolled', scrollY > 80), { passive: true });
  }

  /* ════════════════════════════════════════
     HERO ENTRANCE
     ════════════════════════════════════════ */
  function heroIn() {
    if (RM) return;
    const tl = gsap.timeline();
    const w = document.querySelectorAll('.hero-title .word');
    if (w.length) tl.fromTo(w, { y: '120%', opacity: 0 }, { y: '0%', opacity: 1, duration: 1, stagger: .15, ease: 'power4.out' });
    tl.fromTo('.hero-overline', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, '<.5');
    tl.fromTo('.hero-sub', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, '<.2');
    tl.fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 1 }, '<.5');
  }

  /* ════════════════════════════════════════
     SERVICES HORIZONTAL SCROLL
     ════════════════════════════════════════ */
  function initServices() {
    const sec = document.querySelector('.services');
    const track = document.querySelector('.services-track');
    if (!sec || !track || RM) return;
    const tw = gsap.to(track, { x: () => -(track.scrollWidth - wW), ease: 'none', scrollTrigger: { trigger: sec, pin: true, scrub: 1, end: () => '+=' + (track.scrollWidth - wW), invalidateOnRefresh: true } });
    document.querySelectorAll('.service-panel').forEach(p => {
      const inner = p.querySelector('.panel-inner');
      if (inner) gsap.fromTo(inner, { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'power2.out', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 80%', toggleActions: 'play none none reverse' } });
    });
  }

  /* ════════════════════════════════════════
     ★ SHOWCASE — THE SCROLL-DRIVEN VISUAL FILM ★
     One master GSAP timeline, scrubbed over ~10,000px.
     The "window" stays pinned; its content morphs.
     ════════════════════════════════════════ */
  function initShowcase() {
    const sec = document.getElementById('showcase');
    if (!sec) return;
    if (RM) { document.getElementById('s-code').style.opacity = 1; return; }

    const barTitle = document.getElementById('sc-bar-title');
    const tl = gsap.timeline();

    // Helper: show/hide text callout
    const showTxt = (id, pos) => tl.fromTo(id, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, pos);
    const hideTxt = (id, pos) => tl.to(id, { opacity: 0, y: -20, duration: .25, ease: 'power2.in' }, pos);

    // Helper: crossfade scenes
    const fadeIn = (id, pos) => tl.to(id, { opacity: 1, duration: .35 }, pos);
    const fadeOut = (id, pos) => tl.to(id, { opacity: 0, duration: .3 }, pos);

    // ──────────────────────────────────────────────
    // PHASE 1: CODE EDITOR (timeline 0 – 2.5)
    // ──────────────────────────────────────────────
    tl.addLabel('code', 0);

    // Window slides in
    tl.fromTo('#sc-window', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' }, 'code');

    // Show code scene
    fadeIn('#s-code', 'code');

    // "Every product starts with code" text
    showTxt('#txt-code', 'code+=0.2');

    // Code lines type in (staggered)
    tl.to('#s-code .cl', { opacity: 1, duration: .08, stagger: .08, ease: 'none' }, 'code+=0.5');

    // Terminal lines appear
    tl.to('#s-code .term-line', { opacity: 1, duration: .1, stagger: .15 }, 'code+=1.5');

    // "Building..." text
    hideTxt('#txt-code', 'code+=1.8');
    showTxt('#txt-build', 'code+=2.0');

    // Hold
    tl.to({}, { duration: .4 }, 'code+=2.3');

    // ──────────────────────────────────────────────
    // PHASE 2: CODE → INBOX TRANSITION (2.7 – 3.5)
    // ──────────────────────────────────────────────
    tl.addLabel('to-inbox', 'code+=2.7');

    hideTxt('#txt-build', 'to-inbox');
    fadeOut('#s-code', 'to-inbox+=0.1');

    // Change bar title
    tl.add(() => { if (barTitle) barTitle.textContent = 'Inbox — 7,283 unread'; }, 'to-inbox+=0.3');

    fadeIn('#s-inbox', 'to-inbox+=0.3');

    // Show "7,283" mega text
    showTxt('#txt-smc-problem', 'to-inbox+=0.5');

    // ──────────────────────────────────────────────
    // PHASE 3: INBOX CHAOS (3.5 – 4.5)
    // ──────────────────────────────────────────────
    tl.addLabel('inbox-chaos', 'to-inbox+=1.0');

    // Emails pulse/highlight to show chaos
    tl.fromTo('.email-row', { opacity: .6 }, { opacity: 1, duration: .1, stagger: .05 }, 'inbox-chaos');

    // Hold the chaos
    tl.to({}, { duration: .6 }, 'inbox-chaos+=0.5');

    // ──────────────────────────────────────────────
    // PHASE 4: SCAN + SORT + DELETE (4.5 – 7.0)
    // ──────────────────────────────────────────────
    tl.addLabel('smc-solve', 'inbox-chaos+=1.2');

    // Hide problem text
    hideTxt('#txt-smc-problem', 'smc-solve');

    // Scan line sweeps top to bottom
    tl.fromTo('#scan-line',
      { opacity: 1, top: '0%' },
      { top: '100%', duration: .8, ease: 'power1.inOut' },
      'smc-solve+=0.2'
    );
    tl.to('#scan-line', { opacity: 0, duration: .1 }, 'smc-solve+=1.0');

    // Emails get sorted (colored left border)
    const emailRows = document.querySelectorAll('.email-row');
    const sortColors = ['#6366f1', '#22c55e', '#6366f1', '#ef4444', '#f59e0b', '#22c55e'];
    emailRows.forEach((row, i) => {
      tl.to(row, {
        borderLeft: `3px solid ${sortColors[i] || '#6366f1'}`,
        duration: .05,
      }, `smc-solve+=${1.1 + i * 0.08}`);
    });

    // Hold sorted state
    tl.to({}, { duration: .3 }, 'smc-solve+=1.7');

    // Delete promo/spam emails (rows 0, 3)
    [0, 3].forEach((idx, i) => {
      const row = emailRows[idx];
      if (row) {
        tl.to(row, { opacity: 0, x: 40, height: 0, padding: 0, duration: .2, ease: 'power2.in' }, `smc-solve+=${2.0 + i * 0.15}`);
      }
    });

    // Show toast
    tl.to('#inbox-toast', { opacity: 1, duration: .2, ease: 'power2.out' }, 'smc-solve+=2.5');

    // Show SMC product text
    showTxt('#txt-smc-solution', 'smc-solve+=2.7');

    // Hold for product showcase
    tl.to({}, { duration: 1.0 }, 'smc-solve+=3.0');

    // ──────────────────────────────────────────────
    // PHASE 5: INBOX → DASHBOARD (7.0 – 8.0)
    // ──────────────────────────────────────────────
    tl.addLabel('to-dash', 'smc-solve+=4.0');

    hideTxt('#txt-smc-solution', 'to-dash');
    tl.to('#inbox-toast', { opacity: 0, duration: .15 }, 'to-dash');
    fadeOut('#s-inbox', 'to-dash+=0.2');

    // Change bar title with brief fade
    tl.add(() => { if (barTitle) barTitle.textContent = 'WorkspaceForge — Admin Console'; }, 'to-dash+=0.4');

    fadeIn('#s-dash', 'to-dash+=0.4');

    // ──────────────────────────────────────────────
    // PHASE 6: DASHBOARD (8.0 – 10.5)
    // ──────────────────────────────────────────────
    tl.addLabel('dash', 'to-dash+=0.8');

    // Show WF text
    showTxt('#txt-wf', 'dash');

    // Dashboard cards animate in with stagger
    tl.to('.d-card', { opacity: 1, y: 0, duration: .2, stagger: .12, ease: 'power2.out' }, 'dash+=0.2');

    // Counter animations for dashboard metrics
    const counters = [
      { el: 'd-users', target: 2847, suffix: '' },
      { el: 'd-score', target: 94, suffix: '%' },
      { el: 'd-policies', target: 3, suffix: '' },
    ];
    counters.forEach((c, i) => {
      const obj = { v: 0 };
      const domEl = document.getElementById(c.el);
      if (!domEl) return;
      tl.to(obj, {
        v: c.target, duration: .4, ease: 'power2.out',
        onUpdate: () => { domEl.textContent = Math.floor(obj.v).toLocaleString() + c.suffix; }
      }, `dash+=${0.4 + i * 0.12}`);
    });

    // Activity log rows
    tl.to('.log-row', { opacity: 1, x: 0, duration: .15, stagger: .1, ease: 'power2.out' }, 'dash+=0.8');

    // AI bubble appears
    tl.to('#ai-bubble', { opacity: 1, y: 0, duration: .3, ease: 'back.out(1.5)' }, 'dash+=1.2');

    // Hold
    tl.to({}, { duration: 1.0 }, 'dash+=1.5');

    // ──────────────────────────────────────────────
    // PHASE 7: DASHBOARD → TERMINAL (10.5 – 11.5)
    // ──────────────────────────────────────────────
    tl.addLabel('to-term', 'dash+=2.5');

    hideTxt('#txt-wf', 'to-term');
    tl.to('#ai-bubble', { opacity: 0, duration: .15 }, 'to-term');
    fadeOut('#s-dash', 'to-term+=0.2');

    tl.add(() => { if (barTitle) barTitle.textContent = 'dns-lookup — smartmailboxcleaner.com'; }, 'to-term+=0.4');

    fadeIn('#s-term', 'to-term+=0.4');

    // ──────────────────────────────────────────────
    // PHASE 8: TERMINAL / DNS (11.5 – 14.0)
    // ──────────────────────────────────────────────
    tl.addLabel('term', 'to-term+=0.8');

    // Show DNS text
    showTxt('#txt-dns', 'term');

    // Terminal lines type in with stagger
    tl.to('#s-term .tl', { opacity: 1, duration: .1, stagger: .12, ease: 'none' }, 'term+=0.3');

    // Hold
    tl.to({}, { duration: 1.2 }, 'term+=1.5');

    // ──────────────────────────────────────────────
    // PHASE 9: OUTRO (14.0 – 15.0)
    // ──────────────────────────────────────────────
    tl.addLabel('outro', 'term+=2.7');

    hideTxt('#txt-dns', 'outro');

    // Window scales down and fades
    tl.to('#sc-window', { scale: .85, opacity: .6, duration: .5, ease: 'power2.in' }, 'outro+=0.3');
    fadeOut('#s-term', 'outro+=0.5');
    tl.to('#sc-window', { opacity: 0, duration: .3 }, 'outro+=0.7');

    // ──────────────────────────────────────────────
    // SCROLLTRIGGER — Pin & Scrub
    // ──────────────────────────────────────────────
    ScrollTrigger.create({
      trigger: sec,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: '+=10000',
      animation: tl,
      invalidateOnRefresh: true
    });
  }

  /* ════════════════════════════════════════
     TECH GRID
     ════════════════════════════════════════ */
  function initTech() {
    if (RM) return;
    const items = document.querySelectorAll('.tech-item');
    if (!items.length) return;
    ScrollTrigger.create({
      trigger: '.tech', start: 'top 60%', once: true,
      onEnter: () => items.forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 80))
    });
  }

  /* ════════════════════════════════════════
     WHY — Progressive highlight
     ════════════════════════════════════════ */
  function initWhy() {
    if (RM) return;
    document.querySelectorAll('.why-point').forEach(p => {
      ScrollTrigger.create({
        trigger: p, start: 'top 65%', end: 'bottom 35%',
        onEnter: () => p.classList.add('active'),
        onLeave: () => p.classList.remove('active'),
        onEnterBack: () => p.classList.add('active'),
        onLeaveBack: () => p.classList.remove('active')
      });
    });
  }

  /* ════════════════════════════════════════
     CTA TITLE
     ════════════════════════════════════════ */
  function initCta() {
    if (RM) return;
    const w = document.querySelectorAll('.cta-title .word');
    if (!w.length) return;
    gsap.fromTo(w, { y: '100%', opacity: 0 }, { y: '0%', opacity: 1, duration: 1, stagger: .1, ease: 'power4.out', scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
  }

  /* ════════════════════════════════════════
     MAGNETIC BUTTONS
     ════════════════════════════════════════ */
  function initMagnetic() {
    if (RM || wW <= 768) return;
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) gsap.to(btn, { x: (dx / 120) * 18, y: (dy / 120) * 18, duration: .3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.3)' }));
    });
  }

  /* ════════════════════════════════════════
     INIT
     ════════════════════════════════════════ */
  function init() {
    initThree();
    initNav();
    initLoader();
    initCursor();
    initServices();
    initShowcase();
    initTech();
    initWhy();
    initCta();
    initMagnetic();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
