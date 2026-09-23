/* ========================================================================
   umarsofiyaan.shop — Main JavaScript
   Three.js 3D Scene + GSAP ScrollTrigger Animations
   ======================================================================== */

// ─── Three.js Scene Setup ────────────────────────────────────────────────────
let scene, camera, renderer, particles, geometries = [];
let mouseX = 0, mouseY = 0;
let windowW = window.innerWidth, windowH = window.innerHeight;

function initThreeScene() {
  const canvas = document.getElementById('three-canvas');
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(60, windowW / windowH, 0.1, 1000);
  camera.position.z = 50;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(windowW, windowH);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ─── Particle Field ──────────────────────────────────────────────
  const particleCount = 800;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    sizes[i] = Math.random() * 2 + 0.5;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    color: 0x6366f1,
    size: 0.5,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ─── Floating Geometries ─────────────────────────────────────────
  const geoConfigs = [
    { geo: new THREE.TorusGeometry(4, 1.2, 16, 100), color: 0x2c70a6, pos: [-20, 10, -10], speed: 0.005 },
    { geo: new THREE.IcosahedronGeometry(3.5, 0), color: 0x6366f1, pos: [18, -8, -15], speed: 0.007 },
    { geo: new THREE.OctahedronGeometry(3, 0), color: 0x10b981, pos: [-15, -12, -20], speed: 0.006 },
    { geo: new THREE.TorusKnotGeometry(2.5, 0.7, 100, 16), color: 0x6366f1, pos: [22, 15, -25], speed: 0.004 },
    { geo: new THREE.DodecahedronGeometry(2.5, 0), color: 0x2c70a6, pos: [-25, 5, -30], speed: 0.008 },
    { geo: new THREE.TetrahedronGeometry(3, 0), color: 0x10b981, pos: [10, 20, -12], speed: 0.006 },
  ];

  geoConfigs.forEach((config) => {
    const mat = new THREE.MeshBasicMaterial({
      color: config.color,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const mesh = new THREE.Mesh(config.geo, mat);
    mesh.position.set(...config.pos);
    mesh.userData = { speed: config.speed, originalPos: [...config.pos] };
    scene.add(mesh);
    geometries.push(mesh);
  });

  // Event listeners
  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  animate();
}

function onMouseMove(e) {
  mouseX = (e.clientX / windowW) * 2 - 1;
  mouseY = -(e.clientY / windowH) * 2 + 1;
}

function onResize() {
  windowW = window.innerWidth;
  windowH = window.innerHeight;
  camera.aspect = windowW / windowH;
  camera.updateProjectionMatrix();
  renderer.setSize(windowW, windowH);
}

function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;

  // Rotate particles slowly
  if (particles) {
    particles.rotation.y = time * 0.03;
    particles.rotation.x = time * 0.015;
  }

  // Animate floating geometries
  geometries.forEach((mesh, i) => {
    const { speed, originalPos } = mesh.userData;
    mesh.rotation.x += speed;
    mesh.rotation.y += speed * 0.7;

    // Floating motion
    mesh.position.y = originalPos[1] + Math.sin(time * 0.5 + i) * 2;
    mesh.position.x = originalPos[0] + Math.cos(time * 0.3 + i * 0.5) * 1.5;

    // Mouse parallax
    mesh.position.x += mouseX * 2 * (i % 2 === 0 ? 1 : -1);
    mesh.position.y += mouseY * 1.5 * (i % 2 === 0 ? -1 : 1);
  });

  // Camera subtle mouse follow
  camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
  camera.position.y += (mouseY * 2 - camera.position.y) * 0.02;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

// ─── GSAP Animations ─────────────────────────────────────────────────────────

function initGSAPAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // ─── Loader ──────────────────────────────────────────────────────
  const loader = document.querySelector('.loader');
  if (loader) {
    gsap.to(loader, {
      opacity: 0,
      duration: 0.6,
      delay: 0.8,
      onComplete: () => {
        loader.classList.add('hidden');
        animateHero();
      }
    });
  } else {
    animateHero();
  }

  // ─── Nav scroll effect ──────────────────────────────────────────
  ScrollTrigger.create({
    start: 'top -80',
    onUpdate: (self) => {
      const nav = document.querySelector('.nav');
      if (self.direction === 1 && self.progress > 0) {
        nav.classList.add('scrolled');
      }
      if (self.progress === 0) {
        nav.classList.remove('scrolled');
      }
    }
  });

  // ─── About section ──────────────────────────────────────────────
  const aboutTextEls = document.querySelectorAll('.about-text > *');
  if (aboutTextEls.length) {
    gsap.from(aboutTextEls, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  // Skill tags staggered entrance
  const skillTags = document.querySelectorAll('.skill-tag');
  if (skillTags.length) {
    gsap.to(skillTags, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.06,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.about-skills',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  // Stat cards
  const statCards = document.querySelectorAll('.stat-card');
  if (statCards.length) {
    gsap.from(statCards, {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-stats',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  // ─── Projects section ────────────────────────────────────────────
  const projectsHeader = document.querySelector('.projects-header');
  if (projectsHeader) {
    gsap.from(projectsHeader.children, {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.projects',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  const projectCards = document.querySelectorAll('.project-card');
  if (projectCards.length) {
    projectCards.forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });
    });
  }

  // ─── Tech section ────────────────────────────────────────────────
  const techSection = document.querySelector('.tech-section');
  if (techSection) {
    gsap.from(techSection.querySelector('h2'), {
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.tech-section',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  // ─── CTA section ─────────────────────────────────────────────────
  const ctaSection = document.querySelector('.cta-section');
  if (ctaSection) {
    gsap.from('.cta-section .section-inner > *', {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  // ─── Scroll-linked 3D geometry scatter ───────────────────────────
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    onUpdate: (self) => {
      const progress = self.progress;
      geometries.forEach((mesh, i) => {
        const scatter = progress * 30;
        const dir = i % 2 === 0 ? 1 : -1;
        mesh.userData.originalPos[2] = mesh.userData.originalPos[2] || mesh.position.z;
        mesh.position.z = (mesh.userData.originalPos[2] || -15) - scatter * dir;
        mesh.material.opacity = 0.25 * (1 - progress * 0.6);
      });
      // Fade particles
      if (particles) {
        particles.material.opacity = 0.6 * (1 - progress * 0.5);
      }
    }
  });
}

// ─── Hero Animation Timeline ─────────────────────────────────────────────────

function animateHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Glitch effect on name
  const heroName = document.querySelector('.hero-name');
  if (heroName) {
    heroName.classList.add('glitch', 'active');
    setTimeout(() => heroName.classList.remove('active'), 800);
  }

  tl.to('.hero-overline', { opacity: 1, y: 0, duration: 0.6 }, 0.2)
    .to('.hero-name', { opacity: 1, y: 0, duration: 0.8 }, 0.4)
    .to('.hero-tagline', { opacity: 1, y: 0, duration: 0.7 }, 0.7)
    .to('.hero-cta-group', { opacity: 1, y: 0, duration: 0.6 }, 1.0);

  // Typewriter for tagline
  const tagline = document.querySelector('.hero-tagline');
  if (tagline) {
    const fullText = tagline.textContent;
    tagline.textContent = '';
    tagline.style.opacity = 1;

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        tagline.textContent += fullText[charIndex];
        charIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 35);

    // Start typing after name appears
    setTimeout(() => {
      tagline.textContent = '';
      charIndex = 0;
    }, 700);
  }
}

// ─── 3D Card Tilt Effect ──────────────────────────────────────────────────────

function initCardTilt() {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// ─── Smooth Reveal on Scroll (fallback for elements without GSAP) ─────────

function initRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── Initialize Everything ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  initGSAPAnimations();
  initCardTilt();
  initRevealObserver();
});
