/**
 * umarsofiyaan.shop — v3 Motion Graphics Engine
 * Scroll-driven cinematic storytelling with Three.js + GSAP
 */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let wW = window.innerWidth, wH = window.innerHeight;
  let mouseX = 0, mouseY = 0, normX = 0, normY = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    normX = (e.clientX / wW) * 2 - 1;
    normY = -(e.clientY / wH) * 2 + 1;
  });
  window.addEventListener('resize', debounce(() => { wW = window.innerWidth; wH = window.innerHeight; }, 250));

  /* ================================================================
     1. LOADER
     ================================================================ */
  function initLoader() {
    const loader = document.getElementById('loader');
    const fill = document.querySelector('.loader-bar-fill');
    const counter = document.querySelector('.loader-counter');
    if (!loader) return;
    if (prefersReduced) { loader.style.display = 'none'; initHero(); return; }

    const p = { v: 0 };
    gsap.to(p, {
      v: 100, duration: 1.8, ease: 'power2.inOut',
      onUpdate: () => {
        if (counter) counter.textContent = Math.floor(p.v);
        if (fill) fill.style.width = p.v + '%';
      },
      onComplete: () => {
        loader.classList.add('done');
        setTimeout(() => { loader.style.display = 'none'; initHero(); }, 500);
      }
    });
  }

  /* ================================================================
     2. CURSOR
     ================================================================ */
  function initCursor() {
    if (prefersReduced || wW <= 768) return;
    const cur = document.getElementById('cursor');
    const dot = cur?.querySelector('.cursor-dot');
    const ring = cur?.querySelector('.cursor-ring');
    if (!cur || !dot || !ring) return;

    let dx = 0, dy = 0, rx = 0, ry = 0, sc = 1, op = 1, hover = false;
    document.querySelectorAll('a,button,[data-magnetic]').forEach(el => {
      el.addEventListener('mouseenter', () => { hover = true; cur.classList.add('hovering'); });
      el.addEventListener('mouseleave', () => { hover = false; cur.classList.remove('hovering'); });
    });

    (function tick() {
      dx = lerp(dx, mouseX, 0.15); dy = lerp(dy, mouseY, 0.15);
      rx = lerp(rx, mouseX, 0.08); ry = lerp(ry, mouseY, 0.08);
      sc = lerp(sc, hover ? 1.5 : 1, 0.1);
      op = lerp(op, hover ? 0.5 : 1, 0.1);
      dot.style.transform = `translate3d(${dx}px,${dy}px,0) translate(-50%,-50%)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%) scale(${sc})`;
      ring.style.opacity = op;
      requestAnimationFrame(tick);
    })();
  }

  /* ================================================================
     3. THREE.JS — Globe + Particles
     ================================================================ */
  function initThree() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined' || prefersReduced) return;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(75, wW / wH, 0.1, 1000);
    cam.position.z = 50;

    const ren = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    ren.setSize(wW, wH);
    ren.setPixelRatio(Math.min(devicePixelRatio, 2));

    const group = new THREE.Group();
    scene.add(group);

    // Globe wireframe
    const geo = new THREE.IcosahedronGeometry(15, 3);
    const edges = new THREE.EdgesGeometry(geo);
    const globe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x6366f1, opacity: 0.12, transparent: true }));
    group.add(globe);

    // Particles in sphere
    const pGeo = new THREE.BufferGeometry();
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const u = Math.random(), v = Math.random();
      const th = u * Math.PI * 2, ph = Math.acos(2 * v - 1);
      const r = Math.cbrt(Math.random()) * 70;
      pos[i] = r * Math.sin(ph) * Math.cos(th);
      pos[i + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i + 2] = r * Math.cos(ph);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.3, color: 0x6366f1, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
    scene.add(pts);

    // Scroll push
    gsap.to(group.position, { z: -60, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 } });

    (function animate() {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.001;
      globe.rotation.x += 0.0005;
      pts.rotation.y -= 0.0004;
      cam.position.x += (normX * 5 - cam.position.x) * 0.02;
      cam.position.y += (normY * 3 - cam.position.y) * 0.02;
      cam.lookAt(scene.position);
      ren.render(scene, cam);
    })();

    window.addEventListener('resize', debounce(() => {
      cam.aspect = wW / wH;
      cam.updateProjectionMatrix();
      ren.setSize(wW, wH);
    }, 250));
  }

  /* ================================================================
     4. NAV SCROLL
     ================================================================ */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 80);
    }, { passive: true });
  }

  /* ================================================================
     5. HERO ENTRANCE
     ================================================================ */
  function initHero() {
    if (prefersReduced) return;
    const tl = gsap.timeline();
    const words = document.querySelectorAll('.hero-title .word');
    if (words.length) tl.fromTo(words, { y: '120%', opacity: 0 }, { y: '0%', opacity: 1, duration: 1, stagger: 0.15, ease: 'power4.out' });
    const ol = document.querySelector('.hero-overline');
    if (ol) tl.fromTo(ol, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '<0.5');
    const sub = document.querySelector('.hero-sub');
    if (sub) tl.fromTo(sub, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '<0.2');
    const sc = document.querySelector('.hero-scroll');
    if (sc) tl.fromTo(sc, { opacity: 0 }, { opacity: 1, duration: 1 }, '<0.5');
  }

  /* ================================================================
     6. SERVICES HORIZONTAL SCROLL
     ================================================================ */
  function initServices() {
    const sec = document.querySelector('.services');
    const track = document.querySelector('.services-track');
    if (!sec || !track || prefersReduced) return;

    const tween = gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: { trigger: sec, pin: true, scrub: 1, end: () => '+=' + (track.scrollWidth - window.innerWidth), invalidateOnRefresh: true }
    });

    document.querySelectorAll('.service-panel').forEach(panel => {
      const inner = panel.querySelector('.panel-inner');
      if (inner) {
        gsap.fromTo(inner, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, ease: 'power2.out',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 80%', toggleActions: 'play none none reverse' }
        });
      }
    });
  }

  /* ================================================================
     7. WORK INTRO
     ================================================================ */
  function initWorkIntro() {
    const lines = document.querySelectorAll('.wi-line');
    if (!lines.length || prefersReduced) return;
    gsap.fromTo(lines, { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.work-intro', start: 'top 70%' }
    });
  }

  /* ================================================================
     8. STORY ENGINE — The motion graphics core
     
     Each .story section is pinned. Inside, .sf frames are
     sequenced via a scrubbed GSAP timeline. Each frame:
       1. Enters (opacity 0→1, scale/translate)
       2. Holds (visible)
       3. Exits (opacity 1→0, scale/translate)
     ================================================================ */

  /**
   * Build a timeline for a single story frame.
   * @param {string} id - element ID
   * @param {object} opts - { enter, hold, exit } durations + custom props
   */
  function frame(tl, id, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return tl;

    const enter = opts.enter || {};
    const exit = opts.exit || {};
    const hold = opts.hold ?? 0.6;

    // Default entrance: scale up + fade in
    const enterFrom = { opacity: 0, scale: enter.scale ?? 0.7, y: enter.y ?? 40, rotation: enter.rotation ?? 0, ...enter.from };
    const enterTo = { opacity: 1, scale: 1, y: 0, rotation: 0, duration: enter.dur ?? 0.5, ease: enter.ease ?? 'power3.out', ...enter.to };

    // Default exit: scale up more + fade out (zoom through effect)
    const exitTo = { opacity: 0, scale: exit.scale ?? 1.8, y: exit.y ?? 0, duration: exit.dur ?? 0.4, ease: exit.ease ?? 'power2.in', ...exit.to };

    tl.fromTo(el, enterFrom, enterTo);
    if (hold > 0) tl.to(el, { duration: hold });  // hold visible
    tl.to(el, exitTo);

    return tl;
  }

  /* ── SMC Story ── */
  function initStorySMC() {
    const sec = document.getElementById('story-smc');
    if (!sec || prefersReduced) return;

    const tl = gsap.timeline();

    // 📧 emoji spins in
    frame(tl, 'smc-1', {
      enter: { scale: 0.2, from: { rotation: -180 }, dur: 0.6 },
      hold: 0.3,
      exit: { scale: 3, to: { rotation: 30 } }
    });

    // "YOUR INBOX IS A MESS."
    frame(tl, 'smc-2', {
      enter: { y: 80, scale: 0.8, dur: 0.5 },
      hold: 0.8,
      exit: { scale: 2.5, dur: 0.5 }
    });

    // "7,283" — big number
    frame(tl, 'smc-3', {
      enter: { scale: 0.3, dur: 0.6, ease: 'back.out(1.5)' },
      hold: 0.7,
      exit: { scale: 4, dur: 0.6 }
    });

    // "7 CATEGORIES."
    frame(tl, 'smc-4', {
      enter: { y: 100, scale: 0.9 },
      hold: 0.4,
      exit: { y: -60, scale: 1.1, dur: 0.3 }
    });

    // "ONE SCAN."
    frame(tl, 'smc-5', {
      enter: { y: 60, scale: 0.95 },
      hold: 0.4,
      exit: { y: -50, dur: 0.3 }
    });

    // "SORTED." — accent
    frame(tl, 'smc-6', {
      enter: { scale: 0.5, dur: 0.4, ease: 'back.out(2)' },
      hold: 0.5,
      exit: { scale: 3, dur: 0.5 }
    });

    // "BULK DELETE?"
    frame(tl, 'smc-7', {
      enter: { scale: 1.5, from: { opacity: 0 }, dur: 0.4 },
      hold: 0.5,
      exit: { scale: 0.8, to: { y: -30 }, dur: 0.3 }
    });

    // "WE GOT YOU."
    frame(tl, 'smc-8', {
      enter: { y: 60, scale: 0.85, dur: 0.5 },
      hold: 0.8,
      exit: { scale: 2, dur: 0.5 }
    });

    // "OOPS?"
    frame(tl, 'smc-9', {
      enter: { scale: 2, dur: 0.3 },
      hold: 0.3,
      exit: { scale: 0.5, dur: 0.3 }
    });

    // "30-DAY UNDO."
    frame(tl, 'smc-10', {
      enter: { y: 50, scale: 0.9, dur: 0.5 },
      hold: 0.8,
      exit: { scale: 1.5, dur: 0.5 }
    });

    // Product CTA
    frame(tl, 'smc-11', {
      enter: { y: 40, scale: 0.95, dur: 0.6 },
      hold: 1.2,
      exit: { to: { opacity: 0 }, dur: 0.4 }
    });

    ScrollTrigger.create({
      trigger: sec,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: '+=5000',
      animation: tl
    });
  }

  /* ── WorkspaceForge Story ── */
  function initStoryWF() {
    const sec = document.getElementById('story-wf');
    if (!sec || prefersReduced) return;

    const tl = gsap.timeline();

    // "YOUR ADMIN CONSOLE"
    frame(tl, 'wf-1', {
      enter: { y: 80, scale: 0.85 },
      hold: 0.6,
      exit: { y: -40, dur: 0.3 }
    });

    // "IS STUCK IN 2015." — dim
    frame(tl, 'wf-2', {
      enter: { scale: 0.9, dur: 0.4 },
      hold: 0.6,
      exit: { scale: 2.5, dur: 0.5 }
    });

    // "50+" — mega number
    frame(tl, 'wf-3', {
      enter: { scale: 0.2, dur: 0.6, ease: 'back.out(1.7)' },
      hold: 0.8,
      exit: { scale: 4, dur: 0.6 }
    });

    // "MEET YOUR AI ADMIN."
    frame(tl, 'wf-4', {
      enter: { y: 60, scale: 0.9 },
      hold: 0.5,
      exit: { y: -50, dur: 0.3 }
    });

    // "POWERED BY GEMINI."
    frame(tl, 'wf-5', {
      enter: { scale: 0.8, dur: 0.5 },
      hold: 0.8,
      exit: { scale: 1.8, dur: 0.5 }
    });

    // Product CTA
    frame(tl, 'wf-6', {
      enter: { y: 40, scale: 0.95, dur: 0.6 },
      hold: 1.2,
      exit: { to: { opacity: 0 }, dur: 0.4 }
    });

    ScrollTrigger.create({
      trigger: sec,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: '+=3500',
      animation: tl
    });
  }

  /* ── DNS Story ── */
  function initStoryDNS() {
    const sec = document.getElementById('story-dns');
    if (!sec || prefersReduced) return;

    const tl = gsap.timeline();

    // "MX? SPF? DKIM? DMARC?"
    frame(tl, 'dns-1', {
      enter: { scale: 0.7, dur: 0.5 },
      hold: 0.6,
      exit: { y: -50, dur: 0.3 }
    });

    // "BIMI? PTR?"
    frame(tl, 'dns-2', {
      enter: { y: 60 },
      hold: 0.6,
      exit: { scale: 2, dur: 0.4 }
    });

    // "ONE LOOKUP."
    frame(tl, 'dns-3', {
      enter: { scale: 0.5, dur: 0.5, ease: 'back.out(2)' },
      hold: 0.8,
      exit: { scale: 1.5, dur: 0.4 }
    });

    // Product CTA
    frame(tl, 'dns-4', {
      enter: { y: 40, scale: 0.95, dur: 0.6 },
      hold: 1.2,
      exit: { to: { opacity: 0 }, dur: 0.4 }
    });

    ScrollTrigger.create({
      trigger: sec,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: '+=2500',
      animation: tl
    });
  }

  /* ── Story Transitions ── */
  function initTransitions() {
    document.querySelectorAll('.story-transition .sf').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: el.parentElement, start: 'top 70%', toggleActions: 'play none none reverse' }
        }
      );
    });
  }

  /* ================================================================
     9. TECH GRID
     ================================================================ */
  function initTech() {
    if (prefersReduced) return;
    const items = document.querySelectorAll('.tech-item');
    if (!items.length) return;

    ScrollTrigger.create({
      trigger: '.tech',
      start: 'top 60%',
      onEnter: () => {
        items.forEach((item, i) => {
          setTimeout(() => item.classList.add('visible'), i * 80);
        });
      },
      once: true
    });
  }

  /* ================================================================
     10. WHY — Progressive highlight
     ================================================================ */
  function initWhy() {
    if (prefersReduced) return;
    const points = document.querySelectorAll('.why-point');
    if (!points.length) return;

    points.forEach((point, i) => {
      ScrollTrigger.create({
        trigger: point,
        start: 'top 65%',
        end: 'bottom 35%',
        onEnter: () => point.classList.add('active'),
        onLeave: () => point.classList.remove('active'),
        onEnterBack: () => point.classList.add('active'),
        onLeaveBack: () => point.classList.remove('active')
      });
    });
  }

  /* ================================================================
     11. CTA TITLE
     ================================================================ */
  function initCta() {
    if (prefersReduced) return;
    const words = document.querySelectorAll('.cta-title .word');
    if (!words.length) return;
    gsap.fromTo(words, { y: '100%', opacity: 0 }, {
      y: '0%', opacity: 1, duration: 1, stagger: 0.1, ease: 'power4.out',
      scrollTrigger: { trigger: '.cta', start: 'top 70%' }
    });
  }

  /* ================================================================
     12. MAGNETIC BUTTONS
     ================================================================ */
  function initMagnetic() {
    if (prefersReduced || wW <= 768) return;
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          gsap.to(btn, { x: (dx / 120) * 18, y: (dy / 120) * 18, duration: 0.3, ease: 'power2.out' });
        }
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1,0.3)' });
      });
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    initThree();
    initNav();
    initLoader();
    initCursor();
    initServices();
    initWorkIntro();
    initStorySMC();
    initStoryWF();
    initStoryDNS();
    initTransitions();
    initTech();
    initWhy();
    initCta();
    initMagnetic();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
