/**
 * Main JavaScript for Agency Portfolio
 * Uses Three.js r128 and GSAP 3.12.5 + ScrollTrigger
 */

(function () {
    // Register GSAP Plugins
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- State & Variables ---
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let mouseX = 0;
    let mouseY = 0;
    let normMouseX = 0;
    let normMouseY = 0;

    // --- Utils ---
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;
    
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Track mouse globally
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        normMouseX = (e.clientX / windowWidth) * 2 - 1;
        normMouseY = -(e.clientY / windowHeight) * 2 + 1;
    });

    const debouncedResize = debounce(() => {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
    }, 250);
    window.addEventListener('resize', debouncedResize);


    // --- 1. Loader ---
    function initLoader() {
        const loader = document.getElementById('loader');
        const loaderBarFill = document.querySelector('.loader-bar-fill');
        const loaderCounter = document.querySelector('.loader-counter');

        if (!loader || prefersReducedMotion) {
            if (loader) {
                loader.style.display = 'none';
            }
            initHeroAnimations();
            return;
        }

        let progress = { value: 0 };
        
        gsap.to(progress, {
            value: 100,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: () => {
                if (loaderCounter) {
                    loaderCounter.textContent = Math.floor(progress.value);
                }
                if (loaderBarFill) {
                    loaderBarFill.style.width = progress.value + '%';
                }
            },
            onComplete: () => {
                loader.classList.add('done');
                setTimeout(() => {
                    loader.style.display = 'none';
                    initHeroAnimations();
                }, 500);
            }
        });
    }

    // --- 2. Custom Cursor ---
    function initCursor() {
        if (prefersReducedMotion || windowWidth <= 768) return;

        const cursor = document.getElementById('cursor');
        const dot = document.querySelector('.cursor-dot');
        const ring = document.querySelector('.cursor-ring');
        
        if (!cursor || !dot || !ring) return;

        let dotX = mouseX;
        let dotY = mouseY;
        let ringX = mouseX;
        let ringY = mouseY;

        // Hover state variables
        let isHovering = false;
        let ringScale = 1;
        let ringOpacity = 1;

        const interactables = document.querySelectorAll('a, button, .magnetic, [data-magnetic]');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => isHovering = true);
            el.addEventListener('mouseleave', () => isHovering = false);
        });

        function renderCursor() {
            if (windowWidth <= 768) return; // Disable on resize to small screen

            dotX = lerp(dotX, mouseX, 0.15);
            dotY = lerp(dotY, mouseY, 0.15);
            
            ringX = lerp(ringX, mouseX, 0.08);
            ringY = lerp(ringY, mouseY, 0.08);

            const targetScale = isHovering ? 1.5 : 1;
            const targetOpacity = isHovering ? 0.5 : 1;

            ringScale = lerp(ringScale, targetScale, 0.1);
            ringOpacity = lerp(ringOpacity, targetOpacity, 0.1);

            dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
            ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;
            ring.style.opacity = ringOpacity;

            requestAnimationFrame(renderCursor);
        }
        
        requestAnimationFrame(renderCursor);
    }


    // --- 3. Three.js 3D Scene ---
    function initThreeScene() {
        const canvas = document.getElementById('three-canvas');
        if (!canvas || typeof THREE === 'undefined' || prefersReducedMotion) return;

        const scene = new THREE.Scene();
        
        const camera = new THREE.PerspectiveCamera(75, windowWidth / windowHeight, 0.1, 1000);
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setSize(windowWidth, windowHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group for scroll rotation/push
        const globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // Globe
        const geometry = new THREE.IcosahedronGeometry(15, 3);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: 0x6366f1, opacity: 0.15, transparent: true });
        const globe = new THREE.LineSegments(edges, material);
        globeGroup.add(globe);

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 600;
        const posArray = new Float32Array(particlesCount * 3);

        for(let i = 0; i < particlesCount * 3; i+=3) {
            // Random point in sphere
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = Math.cbrt(Math.random()) * 80;

            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i+1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i+2] = r * Math.cos(phi);
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.3,
            color: 0x6366f1,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // ScrollTrigger to push globe away
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.to(globeGroup.position, {
                z: -50,
                ease: 'none',
                scrollTrigger: {
                    trigger: document.body,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1
                }
            });
        }

        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);

            // Auto rotation
            globe.rotation.y += 0.001;
            globe.rotation.x += 0.0005;
            
            particlesMesh.rotation.y -= 0.0005;

            // Mouse parallax
            camera.position.x += (normMouseX * 5 - camera.position.x) * 0.02;
            camera.position.y += (normMouseY * 5 - camera.position.y) * 0.02;

            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
        animate();

        // Resize handler
        window.addEventListener('resize', debounce(() => {
            camera.aspect = windowWidth / windowHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(windowWidth, windowHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }, 250));
    }


    // --- 4. Navigation Scroll Effect ---
    function initNavScroll() {
        const nav = document.getElementById('nav');
        if (!nav) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.classList.add('nav-scrolled');
            } else {
                nav.classList.remove('nav-scrolled');
            }
        }, { passive: true });
    }


    // --- 5. Hero Entrance Animation ---
    function initHeroAnimations() {
        if (prefersReducedMotion) return;

        const tl = gsap.timeline();

        const titleWords = document.querySelectorAll('.hero-title .word');
        if (titleWords.length) {
            tl.fromTo(titleWords, 
                { y: '120%', opacity: 0 },
                { y: '0%', opacity: 1, duration: 1, stagger: 0.15, ease: 'power4.out' }
            );
        }

        const overline = document.querySelector('.hero-overline');
        if (overline) {
            tl.fromTo(overline,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
                "<0.5"
            );
        }

        const sub = document.querySelector('.hero-sub');
        if (sub) {
            tl.fromTo(sub,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
                "<0.2"
            );
        }

        const scrollHint = document.querySelector('.hero-scroll');
        if (scrollHint) {
            tl.fromTo(scrollHint,
                { opacity: 0 },
                { opacity: 1, duration: 1 },
                "<0.8"
            );
        }
    }


    // --- 6. Services Horizontal Scroll ---
    function initServicesHorizontal() {
        const servicesSection = document.querySelector('.services');
        const track = document.querySelector('.services-track');
        const panels = document.querySelectorAll('.service-panel');

        if (!servicesSection || !track || panels.length === 0 || prefersReducedMotion) return;

        // Horizontal scroll
        const scrollTween = gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: {
                trigger: servicesSection,
                pin: true,
                scrub: 1,
                end: () => '+=' + (track.scrollWidth - window.innerWidth)
            }
        });

        // Animations inside panels
        panels.forEach((panel) => {
            const inner = panel.querySelector('.panel-inner');
            const number = panel.querySelector('.panel-number');

            if (inner) {
                gsap.fromTo(inner, 
                    { opacity: 0, y: 30 },
                    { 
                        opacity: 1, 
                        y: 0, 
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: panel,
                            containerAnimation: scrollTween,
                            start: 'left center',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
            }

            if (number) {
                gsap.to(number, {
                    x: 100, // Parallax move
                    ease: 'none',
                    scrollTrigger: {
                        trigger: panel,
                        containerAnimation: scrollTween,
                        start: 'left right',
                        end: 'right left',
                        scrub: true
                    }
                });
            }
        });
    }


    // --- 7. Work Cards Scroll Animation ---
    function initWorkCards() {
        if (prefersReducedMotion) return;

        const cards = document.querySelectorAll('.work-card');
        
        cards.forEach(card => {
            const mockup = card.querySelector('.card-mockup');
            const info = card.querySelector('.card-info');

            // Card entrance
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: card,
                    start: 'top 80%',
                }
            });

            tl.fromTo(card, 
                { opacity: 0, y: 80, rotateX: 5 },
                { opacity: 1, y: 0, rotateX: 0, duration: 1, ease: 'power3.out' }
            );

            // Stagger internals if they exist
            const internals = [];
            if (mockup) internals.push(mockup);
            if (info) internals.push(info);

            if (internals.length) {
                tl.fromTo(internals,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power2.out' },
                    "-=0.5"
                );
            }

            // Parallax on mockup
            if (mockup) {
                gsap.to(mockup, {
                    y: -50,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true
                    }
                });
            }
        });
    }


    // --- 8. Tech Grid Reveal ---
    function initTechGrid() {
        if (prefersReducedMotion) return;

        const techSection = document.querySelector('.tech');
        const items = document.querySelectorAll('.tech-item');

        if (!techSection || items.length === 0) return;

        ScrollTrigger.create({
            trigger: techSection,
            start: 'top 60%',
            onEnter: () => {
                items.forEach((item, index) => {
                    const delay = item.getAttribute('data-delay') || (index * 0.08);
                    
                    gsap.fromTo(item,
                        { opacity: 0, y: 20, filter: 'blur(10px)' },
                        { 
                            opacity: 1, 
                            y: 0, 
                            filter: 'blur(0px)', 
                            duration: 0.8, 
                            delay: parseFloat(delay),
                            ease: 'power2.out',
                            onComplete: () => item.classList.add('visible')
                        }
                    );
                });
            }
        });
    }


    // --- 9. Why Section - Progressive Highlight ---
    function initWhySection() {
        const whySection = document.querySelector('.why');
        const points = document.querySelectorAll('.why-point');

        if (!whySection || points.length === 0) return;

        ScrollTrigger.create({
            trigger: whySection,
            start: 'top bottom',
            end: 'bottom top',
            onUpdate: () => {
                let closestPoint = null;
                let minDistance = Infinity;
                const centerY = windowHeight / 2;

                points.forEach(point => {
                    const rect = point.getBoundingClientRect();
                    const pointCenterY = rect.top + rect.height / 2;
                    const distance = Math.abs(centerY - pointCenterY);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPoint = point;
                    }
                });

                points.forEach(point => {
                    if (point === closestPoint) {
                        point.classList.add('active');
                    } else {
                        point.classList.remove('active');
                    }
                });
            }
        });
    }


    // --- 10. CTA Title Animation ---
    function initCtaTitle() {
        if (prefersReducedMotion) return;

        const ctaWords = document.querySelectorAll('.cta-title .word');
        if (ctaWords.length === 0) return;

        gsap.fromTo(ctaWords,
            { y: '100%', opacity: 0 },
            { 
                y: '0%', 
                opacity: 1, 
                duration: 1, 
                stagger: 0.1, 
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.cta-title',
                    start: 'top 70%'
                }
            }
        );
    }


    // --- 11. Magnetic Button Effect ---
    function initMagneticButtons() {
        if (prefersReducedMotion || windowWidth <= 768) return;

        const magneticEls = document.querySelectorAll('[data-magnetic], .cta-btn');

        magneticEls.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const btnCenterX = rect.left + rect.width / 2;
                const btnCenterY = rect.top + rect.height / 2;
                
                const distanceX = e.clientX - btnCenterX;
                const distanceY = e.clientY - btnCenterY;
                
                // If within roughly 100px of center (simplified threshold)
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                if (distance < 100) {
                    const moveX = (distanceX / 100) * 15;
                    const moveY = (distanceY / 100) * 15;
                    
                    gsap.to(btn, { x: moveX, y: moveY, duration: 0.3, ease: 'power2.out' });
                }
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
            });
        });
    }


    // --- Initialize All ---
    function init() {
        initThreeScene();
        initNavScroll();
        initLoader(); // This will trigger initHeroAnimations on completion
        initCursor();
        initServicesHorizontal();
        initWorkCards();
        initTechGrid();
        initWhySection();
        initCtaTitle();
        initMagneticButtons();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
