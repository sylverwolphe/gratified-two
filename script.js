// Spice Dust Particle System with drink-based colors
(function initSpiceDust() {
    const canvas = document.getElementById('spice-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 600;

    // Logo colors for each drink (matches drink base colors)
    const drinkLogoColors = {
        'default': '#2d2926',      // Charcoal ink (original)
        'pour-over': '#c28d5a',    // Light amber
        'cappuccino': '#593320',   // Dark espresso
        'latte': '#8c6241',        // Milky coffee
        'mocha': '#472618',        // Dark chocolate coffee
        'hot-chocolate': '#401f14', // Rich chocolate
        'matcha-latte': '#738c4d', // Matcha green
        'moroccan-mint': '#598059', // Mint tea green
        'something-different': '#bf7389' // Dusty rose
    };

    // Color palettes for each drink
    const drinkSpiceColors = {
        'default': [
            { r: 232, g: 163, b: 23 },   // Saffron
            { r: 114, g: 47, b: 55 },    // Burgundy/Paprika
            { r: 210, g: 105, b: 30 },   // Cinnamon
            { r: 192, g: 132, b: 151 },  // Dusty Rose
            { r: 139, g: 115, b: 85 },   // Olive/Brown
            { r: 204, g: 85, b: 0 },     // Burnt Orange
        ],
        'pour-over': [
            { r: 194, g: 140, b: 89 },   // Light amber
            { r: 217, g: 179, b: 128 },  // Golden
            { r: 166, g: 113, b: 67 },   // Warm brown
            { r: 232, g: 200, b: 150 },  // Pale gold
            { r: 180, g: 130, b: 80 },   // Honey
        ],
        'cappuccino': [
            { r: 89, g: 51, b: 31 },     // Dark espresso
            { r: 242, g: 235, b: 224 },  // Foam white
            { r: 139, g: 90, b: 60 },    // Medium brown
            { r: 200, g: 180, b: 160 },  // Cream
            { r: 70, g: 40, b: 25 },     // Deep coffee
        ],
        'latte': [
            { r: 140, g: 97, b: 64 },    // Milky coffee
            { r: 230, g: 217, b: 199 },  // Cream swirl
            { r: 180, g: 145, b: 110 },  // Latte tan
            { r: 210, g: 190, b: 165 },  // Steamed milk
            { r: 160, g: 115, b: 80 },   // Coffee accent
        ],
        'mocha': [
            { r: 71, g: 38, b: 26 },     // Dark chocolate
            { r: 115, g: 64, b: 38 },    // Chocolate brown
            { r: 89, g: 51, b: 31 },     // Espresso
            { r: 140, g: 90, b: 60 },    // Milk chocolate
            { r: 50, g: 30, b: 20 },     // Deep cocoa
        ],
        'hot-chocolate': [
            { r: 64, g: 31, b: 20 },     // Rich chocolate
            { r: 242, g: 230, b: 217 },  // Marshmallow
            { r: 100, g: 55, b: 35 },    // Cocoa
            { r: 220, g: 200, b: 180 },  // Cream
            { r: 80, g: 45, b: 30 },     // Dark cocoa
        ],
        'matcha-latte': [
            { r: 115, g: 140, b: 77 },   // Matcha green
            { r: 230, g: 235, b: 217 },  // Oat milk
            { r: 140, g: 160, b: 100 },  // Light matcha
            { r: 90, g: 115, b: 60 },    // Deep green
            { r: 200, g: 210, b: 180 },  // Creamy green
        ],
        'moroccan-mint': [
            { r: 89, g: 128, b: 89 },    // Mint green
            { r: 204, g: 217, b: 179 },  // Light tea
            { r: 115, g: 150, b: 110 },  // Fresh mint
            { r: 70, g: 100, b: 70 },    // Deep mint
            { r: 180, g: 200, b: 160 },  // Pale green
        ],
        'something-different': [
            { r: 192, g: 115, b: 140 },  // Dusty rose
            { r: 230, g: 191, b: 153 },  // Golden accent
            { r: 170, g: 100, b: 120 },  // Mauve
            { r: 210, g: 160, b: 140 },  // Blush
            { r: 150, g: 90, b: 110 },   // Deep rose
        ]
    };

    let currentColors = drinkSpiceColors['default'];
    let targetColors = drinkSpiceColors['default'];
    const colorTransitionSpeed = 0.02;

    // Parallax effect based on scroll
    let scrollY = 0;
    let targetScrollY = 0;
    const parallaxStrength = 0.15; // How much particles shift based on scroll

    // Tab visibility - reduce updates when tab is hidden
    let isTabActive = true;
    let lastFrameTime = 0;
    const activeFrameInterval = 1000 / 60;  // 60fps when active
    const inactiveFrameInterval = 1000 / 1; // 10fps when inactive

    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;
    });

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    }, { passive: true });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        const color = currentColors[Math.floor(Math.random() * currentColors.length)];
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,           // Thicker: was 2 + 0.5, now 3 + 1
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: Math.random() * 0.2 + 0.05,
            opacity: Math.random() * 0.35 + 0.1,   // Slightly softer opacity for blur effect
            blur: Math.random() * 3 + 2,           // Blur radius for each particle (increased)
            color: { ...color },
            targetColor: { ...color },
            colorIndex: Math.floor(Math.random() * currentColors.length),
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.005
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    // Lerp helper for color transitions
    function lerpColor(current, target, t) {
        return {
            r: current.r + (target.r - current.r) * t,
            g: current.g + (target.g - current.g) * t,
            b: current.b + (target.b - current.b) * t
        };
    }

    function animate(currentTime) {
        // Throttle frame rate when tab is inactive
        const frameInterval = isTabActive ? activeFrameInterval : inactiveFrameInterval;
        if (currentTime - lastFrameTime < frameInterval) {
            requestAnimationFrame(animate);
            return;
        }
        lastFrameTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Smooth scroll interpolation for parallax
        scrollY += (targetScrollY - scrollY) * 0.1;

        particles.forEach(p => {
            p.wobble += p.wobbleSpeed;

            // Smoothly transition particle color toward target
            p.color = lerpColor(p.color, p.targetColor, colorTransitionSpeed);

            // Move
            p.x += p.speedX + Math.sin(p.wobble) * 0.2;
            p.y += p.speedY;

            // Wrap edges
            if (p.y > canvas.height + 10) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
                // When particle resets, pick new target color from current palette
                p.colorIndex = Math.floor(Math.random() * targetColors.length);
                p.targetColor = { ...targetColors[p.colorIndex] };
            }
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.x < -10) p.x = canvas.width + 10;

            // Apply parallax offset based on particle depth (size as proxy for depth)
            // Larger particles move more (appear closer), smaller particles move less (appear farther)
            const depthFactor = (p.size / 4) * parallaxStrength;
            const parallaxOffsetY = scrollY * depthFactor;

            // Draw with blur
            ctx.save();
            ctx.filter = `blur(${p.blur}px)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y - parallaxOffsetY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${p.opacity})`;
            ctx.fill();
            ctx.restore();
        });

        requestAnimationFrame(animate);
    }

    // Expose function to change spice colors based on drink
    window.setSpiceColors = function(drinkId) {
        if (drinkSpiceColors[drinkId]) {
            targetColors = drinkSpiceColors[drinkId];
            // Update all particles' target colors
            particles.forEach(p => {
                p.colorIndex = Math.floor(Math.random() * targetColors.length);
                p.targetColor = { ...targetColors[p.colorIndex] };
            });
        }
    };

    // Expose function to change logo color based on drink
    window.setLogoColor = function(drinkId) {
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.style.transition = 'color 0.5s ease';
            if (drinkId === 'default' || !drinkLogoColors[drinkId]) {
                // Reset to CSS variable (respects light/dark theme)
                logo.style.color = '';
            } else {
                logo.style.color = drinkLogoColors[drinkId];
            }
        }
    };

    window.addEventListener('resize', resize);

    init();
    animate();
})();

// Theme Toggle Functionality
(function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    }

    if (toggle) {
        toggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') {
                html.setAttribute('data-theme', 'dark');
            } else {
                html.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', newTheme);
        });
    }
})();

// Team Section Toggle
function toggleTeam() {
    const content = document.getElementById('teamContent');
    const arrow = document.getElementById('teamToggle');
    content.classList.toggle('expanded');
    arrow.classList.toggle('expanded');
}

// Mobile Navbar - Scroll to Section
function scrollToSection(sectionId) {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
        const navbarHeight = 80; // Account for mobile navbar height
        const sectionTop = section.offsetTop - 20;
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });

        // If scrolling to team, expand it
        if (sectionId === 'team') {
            const teamContent = document.getElementById('teamContent');
            if (!teamContent.classList.contains('expanded')) {
                toggleTeam();
            }
        }
    }
}

// Booking Modal Functions
function openBookingModal() {
    document.getElementById('bookingModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.getElementById('bookingModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeBookingModal();
    }
});

// Simple pricing calculator
function updateEstimate() {
    const form = document.getElementById('bookingForm');
    const durationText = form.duration.value;
    const attendees = parseInt(form.attendees.value) || 0;
    const eventType = form.eventType.value;

    // Extract hours from duration text
    let duration = 0;
    if (durationText.includes('1 hour')) duration = 1;
    else if (durationText.includes('2 hours')) duration = 2;
    else if (durationText.includes('3 hours')) duration = 3;
    else if (durationText.includes('4+')) duration = 4;

    if (duration && attendees >= 5) {
        // Basic pricing: $8 per person per hour
        let basePrice = duration * attendees * 8;

        // Event type multipliers
        const multipliers = {
            'Corporate Event': 1.2,
            'Wedding/Celebration': 1.3,
            'Private Party': 1.0,
            'Community Event': 0.9,
            'Other': 1.0
        };

        if (eventType && multipliers[eventType]) {
            basePrice *= multipliers[eventType];
        }

        // Minimum charge
        basePrice = Math.max(basePrice, 200);

        document.getElementById('estimateAmount').textContent = `$${Math.round(basePrice)}`;
        document.getElementById('estimateDisplay').style.display = 'block';
    } else {
        document.getElementById('estimateDisplay').style.display = 'none';
    }
}

// Form submission via Google Forms using iframe method
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    // Parse the date
    let year = '', month = '', day = '';
    if (data.date) {
        const eventDate = new Date(data.date);
        if (!isNaN(eventDate.getTime())) {
            year = eventDate.getFullYear();
            month = eventDate.getMonth() + 1;
            day = eventDate.getDate();
        }
    }

    // Create a hidden iframe for submission
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'hidden_iframe';
    document.body.appendChild(iframe);

    // Create a form that targets the iframe
    const submitForm = document.createElement('form');
    submitForm.target = 'hidden_iframe';
    submitForm.method = 'POST';
    submitForm.action = 'https://docs.google.com/forms/d/e/1FAIpQLSfD05y3ArWCKtll47Ldcgqhhoq8NFnmNAsBtEZk2WRXjyL8QQ/formResponse';

    // Field mapping
    const fields = {
        'entry.967764436': data.name || '',
        'entry.730489725': data.email || '',
        'entry.316028121_year': year,
        'entry.316028121_month': month,
        'entry.316028121_day': day,
        'entry.659088047': data.duration || '',
        'entry.682142952': data.attendees || '',
        'entry.1436995149': data.eventType || '',
        'entry.579753193': data.location || '',
        'entry.457948607': data.details || ''
    };

    Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        submitForm.appendChild(input);
    });

    document.body.appendChild(submitForm);
    submitForm.submit();

    // Clean up and show success message
    setTimeout(() => {
        document.body.removeChild(iframe);
        document.body.removeChild(submitForm);
        alert(`Thanks ${data.name}! We'll get back to you about your ${data.eventType || 'event'} within 24 hours.`);
        closeBookingModal();
        this.reset();
        document.getElementById('estimateDisplay').style.display = 'none';
    }, 1000);
});

// Load Substack Posts
async function loadSubstackPosts() {
    try {
        const res = await fetch('/latest-posts.json');
        if (!res.ok) throw new Error('Network response not ok');

        const posts = await res.json();
        const ul = document.getElementById('substack-posts');
        ul.innerHTML = '';

        posts.forEach(post => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = post.link;
            a.textContent = post.title;
            a.target = '_blank';
            li.appendChild(a);
            ul.appendChild(li);
        });
    } catch (err) {
        console.error('Failed to load Substack posts:', err);
        document.getElementById('substack-posts').innerHTML = '<li>Could not load posts.</li>';
    }
}

loadSubstackPosts();

// Dollar Ticker Class
class DollarTicker {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentValue = 0;
        this.targetValue = options.targetValue || 10000;
        this.duration = options.duration || 3000;
        this.hasStarted = false;

        this.render();
        this.setupIntersectionObserver();
    }

    formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    render() {
        const formatted = this.formatNumber(this.currentValue);
        const chars = formatted.split('');

        this.container.innerHTML = '';
        chars.forEach((char) => {
            const digitDiv = document.createElement('div');
            if (char === ',' || char === '.') {
                digitDiv.className = 'ticker-digit separator';
                digitDiv.textContent = char;
            } else {
                digitDiv.className = 'ticker-digit';
                const wrapper = document.createElement('div');
                wrapper.className = 'digit-wrapper';
                wrapper.textContent = char;
                digitDiv.appendChild(wrapper);
            }
            this.container.appendChild(digitDiv);
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasStarted) {
                    this.hasStarted = true;
                    this.animate();
                }
            });
        }, { threshold: 0.5 });

        observer.observe(this.container);
    }

    animate() {
        const startTime = Date.now();
        const startValue = this.currentValue;

        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            // Easing function for smooth animation
            const easeOutQuad = progress * (2 - progress);

            this.currentValue = startValue + (this.targetValue - startValue) * easeOutQuad;
            this.render();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                this.currentValue = this.targetValue;
                this.render();
            }
        };

        requestAnimationFrame(step);
    }
}

// Initialize ticker
const ticker = new DollarTicker('ticker', {
    targetValue: 455,
    duration: 3000
});

// Project Modal Functions
function openProjectModal(projectData) {
    document.getElementById('projectTitle').textContent = projectData.title;
    document.getElementById('projectContent').innerHTML = projectData.content;
    document.getElementById('projectModal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // Start slideshow if it's the parallel project
    if (projectData.title === 'Parallel') {
        modalCurrentSlide = 0;
        setTimeout(startModalSlideshow, 100);
    }
}

function closeProjectModal() {
    clearInterval(modalSlideInterval);
    document.getElementById('projectModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close when clicking outside
document.getElementById('projectModal').addEventListener('click', function(e) {
    if (e.target === this) closeProjectModal();
});

// Project data
const projects = {
    bayword: {
        title: 'Bay Word',
        content: `
            <div class="project-icon" style="color: #ff4444;">~!</div>
            <p style="color: var(--charcoal-ink); line-height: 1.8; margin-bottom: 15px;">
                bay word is for the soft voices that haven't congealed quite enough for established publications. currently online+paper - maybe letterpress someday? write something+say hi
            </p>
            <a href="https://bay-word.vercel.app" target="_blank"
               style="display: inline-block; padding: 12px 24px; background: var(--dusty-rose);
                      color: var(--cream-parchment); text-decoration: none; margin-top: 10px;">
                Visit Bay Word →
            </a>
        `
    },
    parallel: {
        title: 'Parallel',
        content: `
            <div class="modal-slideshow">
                <img src="https://i.imgur.com/qbQNpPI.jpeg" class="modal-slide active">
                <img src="https://i.imgur.com/bPDVrAB.jpeg" class="modal-slide">
                <img src="https://i.imgur.com/4hmZSXS.jpeg" class="modal-slide">
                <img src="https://i.imgur.com/eaj9SPD.png" class="modal-slide">
                <img src="https://i.imgur.com/KCsdU31.jpeg" class="modal-slide rotated">
                <div class="slideshow-dots">
                    <span class="dot active" onclick="goToSlide(0)"></span>
                    <span class="dot" onclick="goToSlide(1)"></span>
                    <span class="dot" onclick="goToSlide(2)"></span>
                    <span class="dot" onclick="goToSlide(3)"></span>
                    <span class="dot" onclick="goToSlide(4)"></span>
                </div>
            </div>
            <p style="color: var(--charcoal-ink); line-height: 1.8; margin-top: 20px;">
                Ren is working on a retro futuristic, urban exploration, myst-like, speculative fiction game. The next development update will be posted on Dec 1st; expect dynamic, behind-the-scenes visuals and atmospheric music.
            </p>
            <a href="https://substack.com/@gratifiedwegrow" target="_blank">
                <p style="color: var(--olive-bronze); font-style: italic;">Follow Gratified's Substack for game updates</p>
            </a>
        `
    },
    accumulate: {
        title: 'Accumulate Dollars',
        content: `
            <p style="color: var(--charcoal-ink); line-height: 1.8; margin-bottom: 15px;">
                Nat is currently working for a couple clients in east bay and san francisco, and seeking more! When not serving matchas at coworking spaces, she has big dreams about the ceiling for PA excellence, and would love to chat about your needs and goals.
            </p>
            <p style="color: var(--olive-bronze); font-style: italic;">
                Text/Signal Leah at 4703546184 for an introduction
            </p>
        `
    }
};

// Modal slideshow functionality
let modalCurrentSlide = 0;
let modalSlideInterval = null;

function startModalSlideshow() {
    const slides = document.querySelectorAll('.modal-slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    if (slides.length === 0) return;

    modalSlideInterval = setInterval(() => {
        slides[modalCurrentSlide].classList.remove('active');
        dots[modalCurrentSlide].classList.remove('active');

        modalCurrentSlide = (modalCurrentSlide + 1) % slides.length;

        slides[modalCurrentSlide].classList.add('active');
        dots[modalCurrentSlide].classList.add('active');
    }, 3000);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.modal-slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    slides[modalCurrentSlide].classList.remove('active');
    dots[modalCurrentSlide].classList.remove('active');

    modalCurrentSlide = index;

    slides[modalCurrentSlide].classList.add('active');
    dots[modalCurrentSlide].classList.add('active');

    // Reset the interval
    clearInterval(modalSlideInterval);
    startModalSlideshow();
}

// ===== COFFEE CUP LIQUID SHADER =====
// Configurable drink properties - edit these to customize each drink's appearance
const drinkConfigs = {
    'none': {
        baseColor: [0.98, 0.97, 0.95],      // Empty cup (cream parchment)
        secondaryColor: [0.95, 0.94, 0.92],
        viscosity: 0.5,
        flowSpeed: 0.5,
        fillLevel: 0.0,                      // Empty
        foamHeight: 0.0,
        hasSwirl: false
    },
    'pour-over': {
        baseColor: [0.76, 0.55, 0.35],      // Light amber
        secondaryColor: [0.85, 0.70, 0.50], // Golden highlight
        viscosity: 0.3,                      // Thin, watery
        flowSpeed: 1.2,
        fillLevel: 0.85,                     // How full the cup is
        foamHeight: 0.02,                    // Minimal foam
        hasSwirl: true
    },
    'cappuccino': {
        baseColor: [0.35, 0.20, 0.12],      // Dark espresso
        secondaryColor: [0.95, 0.92, 0.88], // White foam
        viscosity: 0.6,
        flowSpeed: 0.8,
        fillLevel: 0.9,
        foamHeight: 0.15,                    // Thick foam layer
        hasSwirl: true
    },
    'latte': {
        baseColor: [0.55, 0.38, 0.25],      // Milky coffee
        secondaryColor: [0.90, 0.85, 0.78], // Cream swirl
        viscosity: 0.5,
        flowSpeed: 0.9,
        fillLevel: 0.88,
        foamHeight: 0.08,                    // Light foam
        hasSwirl: true
    },
    'mocha': {
        baseColor: [0.28, 0.15, 0.10],      // Dark chocolate coffee
        secondaryColor: [0.45, 0.25, 0.15], // Chocolate ribbon
        viscosity: 0.7,
        flowSpeed: 0.6,
        fillLevel: 0.85,
        foamHeight: 0.06,
        hasSwirl: true
    },
    'hot-chocolate': {
        baseColor: [0.25, 0.12, 0.08],      // Rich chocolate
        secondaryColor: [0.95, 0.90, 0.85], // Marshmallow cream
        viscosity: 0.9,                      // Thick
        flowSpeed: 0.4,
        fillLevel: 0.92,
        foamHeight: 0.12,                    // Cream/marshmallow top
        hasSwirl: false
    },
    'matcha-latte': {
        baseColor: [0.45, 0.55, 0.30],      // Matcha green
        secondaryColor: [0.90, 0.92, 0.85], // Oat milk
        viscosity: 0.5,
        flowSpeed: 0.85,
        fillLevel: 0.87,
        foamHeight: 0.1,
        hasSwirl: true
    },
    'moroccan-mint': {
        baseColor: [0.35, 0.50, 0.35],      // Mint tea green
        secondaryColor: [0.80, 0.85, 0.70], // Light tea
        viscosity: 0.25,                     // Very thin
        flowSpeed: 1.3,
        fillLevel: 0.8,
        foamHeight: 0.0,                     // No foam, it's tea
        hasSwirl: true
    },
    'something-different': {
        baseColor: [0.75, 0.45, 0.55],      // Dusty rose (mystery drink)
        secondaryColor: [0.90, 0.75, 0.60], // Golden accent
        viscosity: 0.5,
        flowSpeed: 1.0,
        fillLevel: 0.86,
        foamHeight: 0.05,
        hasSwirl: true
    }
};

// Default starting drink (empty/none)
const defaultDrink = 'none';

(function initLiquidShader() {
    const canvas = document.getElementById('liquid-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.warn('WebGL not supported, liquid effect disabled');
        return;
    }

    // Vertex shader
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    // Fragment shader - Coffee cup filling effect
    const fragmentShaderSource = `
        precision mediump float;

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec3 u_baseColor;
        uniform vec3 u_secondaryColor;
        uniform float u_viscosity;
        uniform float u_flowSpeed;
        uniform float u_fillLevel;
        uniform float u_foamHeight;
        uniform float u_hasSwirl;

        // Simple noise for color variation
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // FBM for more organic noise
        float fbm(vec2 p) {
            float f = 0.0;
            f += 0.5000 * noise(p); p *= 2.02;
            f += 0.2500 * noise(p); p *= 2.03;
            f += 0.1250 * noise(p); p *= 2.01;
            f += 0.0625 * noise(p);
            return f / 0.9375;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution;
            float aspect = u_resolution.x / u_resolution.y;

            float time = u_time * u_flowSpeed * 0.3;

            // Create wavy surface at the fill level
            float waveStrength = 0.02 * (1.0 - u_viscosity * 0.7);
            float wave1 = sin(uv.x * 8.0 + time * 2.0) * waveStrength;
            float wave2 = sin(uv.x * 12.0 - time * 1.5) * waveStrength * 0.5;
            float wave3 = sin(uv.x * 20.0 + time * 3.0) * waveStrength * 0.25;
            float surfaceWave = wave1 + wave2 + wave3;

            // The liquid fill level (0 = bottom, 1 = top)
            float liquidSurface = u_fillLevel + surfaceWave;

            // Foam sits on top of liquid
            float foamStart = liquidSurface;
            float foamEnd = liquidSurface + u_foamHeight;

            // Check if we're in the liquid, foam, or empty region
            // Sharper edges at the liquid surface
            float inLiquid = smoothstep(0.0, 0.01, uv.y) * smoothstep(liquidSurface + 0.005, liquidSurface - 0.005, uv.y);
            float inFoam = smoothstep(foamStart - 0.005, foamStart + 0.01, uv.y) * smoothstep(foamEnd + 0.005, foamEnd - 0.005, uv.y);

            // Empty state (when fillLevel is 0)
            if (u_fillLevel < 0.01) {
                gl_FragColor = vec4(0.0);
                return;
            }

            // === LIQUID RENDERING ===
            vec3 liquidColor = u_baseColor;

            // Swirl patterns (if enabled)
            if (u_hasSwirl > 0.5) {
                // Create rotating swirl pattern
                vec2 center = vec2(0.5, u_fillLevel * 0.5);
                vec2 toCenter = uv - center;
                float dist = length(toCenter);
                float angle = atan(toCenter.y, toCenter.x);

                // Spiral effect
                float spiral = sin(angle * 3.0 + dist * 10.0 - time * 1.5) * 0.5 + 0.5;
                float swirlMask = smoothstep(0.4, 0.0, dist) * spiral;

                // Cream swirl mixing into coffee
                float creamSwirl = fbm(vec2(angle * 2.0 + time * 0.5, dist * 5.0 - time * 0.3)) * swirlMask;
                liquidColor = mix(liquidColor, u_secondaryColor, creamSwirl * 0.6);
            }

            // Depth gradient - darker at bottom
            float depthGradient = smoothstep(0.0, liquidSurface, uv.y);
            liquidColor *= 0.85 + depthGradient * 0.15;

            // Subtle surface shimmer near the top
            float shimmerZone = smoothstep(liquidSurface - 0.15, liquidSurface, uv.y);
            float shimmer = noise(vec2(uv.x * 20.0 + time, uv.y * 10.0)) * 0.15 * shimmerZone;
            liquidColor += shimmer;

            // Gentle movement within liquid
            float movement = fbm(uv * 3.0 + time * 0.2);
            liquidColor = mix(liquidColor, liquidColor * 1.1, movement * 0.2);

            // === FOAM RENDERING ===
            vec3 foamColor = u_secondaryColor;

            // Foam texture - bubbly appearance
            float foamNoise = fbm(uv * 15.0 + time * 0.1);
            float bubbles = smoothstep(0.3, 0.7, noise(uv * 30.0 + time * 0.05));

            // Foam gets lighter and more textured
            foamColor = mix(foamColor, vec3(1.0), foamNoise * 0.3 + bubbles * 0.2);

            // Foam edge softness
            float foamEdge = smoothstep(foamStart, foamStart + u_foamHeight * 0.3, uv.y);
            foamColor *= 0.95 + foamEdge * 0.05;

            // Small bubble highlights
            float bubbleHighlight = smoothstep(0.6, 0.8, noise(uv * 50.0)) * 0.2;
            foamColor += bubbleHighlight;

            // === COMBINE ===
            vec3 finalColor = vec3(0.0);
            float finalAlpha = 0.0;

            if (inLiquid > 0.01) {
                finalColor = liquidColor;
                finalAlpha = inLiquid * 0.4;
            }

            if (inFoam > 0.01 && u_foamHeight > 0.01) {
                // Foam overlays liquid
                finalColor = mix(finalColor, foamColor, inFoam);
                finalAlpha = max(finalAlpha, inFoam * 0.5);
            }

            // Edge softness at the surface (tighter for sharper edge)
            float surfaceSoftness = smoothstep(liquidSurface + 0.01, liquidSurface - 0.005, uv.y);
            finalAlpha *= surfaceSoftness;

            gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
        }
    `;

    // Compile shader
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Create fullscreen quad
    const positions = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const uniforms = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        baseColor: gl.getUniformLocation(program, 'u_baseColor'),
        secondaryColor: gl.getUniformLocation(program, 'u_secondaryColor'),
        viscosity: gl.getUniformLocation(program, 'u_viscosity'),
        flowSpeed: gl.getUniformLocation(program, 'u_flowSpeed'),
        fillLevel: gl.getUniformLocation(program, 'u_fillLevel'),
        foamHeight: gl.getUniformLocation(program, 'u_foamHeight'),
        hasSwirl: gl.getUniformLocation(program, 'u_hasSwirl')
    };

    // Current and target values for smooth transitions
    let current = {
        ...drinkConfigs[defaultDrink],
        hasSwirl: drinkConfigs[defaultDrink].hasSwirl ? 1.0 : 0.0
    };
    let target = { ...drinkConfigs[defaultDrink] };
    const transitionSpeed = 0.03;

    // Visibility tracking for performance
    let isVisible = true;
    let animationId = null;

    // Lerp helper
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpColor(a, b, t) {
        return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    }

    // Resize handler
    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Set drink
    window.setLiquidDrink = function(drinkId) {
        if (drinkConfigs[drinkId]) {
            target = { ...drinkConfigs[drinkId] };
        }
    };

    // Animation loop
    let startTime = Date.now();

    function animate() {
        // Only animate when visible
        if (!isVisible) {
            animationId = null;
            return;
        }

        // Clear with transparent
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Smooth transition to target
        current.baseColor = lerpColor(current.baseColor, target.baseColor, transitionSpeed);
        current.secondaryColor = lerpColor(current.secondaryColor, target.secondaryColor, transitionSpeed);
        current.viscosity = lerp(current.viscosity, target.viscosity, transitionSpeed);
        current.flowSpeed = lerp(current.flowSpeed, target.flowSpeed, transitionSpeed);
        current.fillLevel = lerp(current.fillLevel, target.fillLevel, transitionSpeed);
        current.foamHeight = lerp(current.foamHeight, target.foamHeight, transitionSpeed);
        current.hasSwirl = lerp(current.hasSwirl, target.hasSwirl ? 1.0 : 0.0, transitionSpeed);

        // Set uniforms
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.time, (Date.now() - startTime) / 1000);
        gl.uniform3fv(uniforms.baseColor, current.baseColor);
        gl.uniform3fv(uniforms.secondaryColor, current.secondaryColor);
        gl.uniform1f(uniforms.viscosity, current.viscosity);
        gl.uniform1f(uniforms.flowSpeed, current.flowSpeed);
        gl.uniform1f(uniforms.fillLevel, current.fillLevel);
        gl.uniform1f(uniforms.foamHeight, current.foamHeight);
        gl.uniform1f(uniforms.hasSwirl, current.hasSwirl);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationId = requestAnimationFrame(animate);
    }

    // Start animation only when visible
    function startAnimation() {
        if (!animationId && isVisible) {
            animationId = requestAnimationFrame(animate);
        }
    }

    // Initialize
    resize();
    window.addEventListener('resize', resize);

    // Use Intersection Observer to pause/resume animation when out of view
    const menuEl = document.getElementById('menu');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
                startAnimation();
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% visible

    if (menuEl) {
        observer.observe(menuEl);
    }

    // Start animation
    startAnimation();

    // Add click handlers to drink cards
    document.querySelectorAll('.drink-card[data-drink]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent menu section click from firing
            const drinkId = card.dataset.drink;
            setLiquidDrink(drinkId);

            // Also change background spice colors and logo color
            if (window.setSpiceColors) {
                window.setSpiceColors(drinkId);
            }
            if (window.setLogoColor) {
                window.setLogoColor(drinkId);
            }

            // Visual feedback - highlight selected card
            document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    // Click anywhere else in the menu section resets to empty
    const menuSection = document.getElementById('menu');
    if (menuSection) {
        menuSection.addEventListener('click', (e) => {
            // Only reset if clicking directly on the section (not on cards)
            if (e.target === menuSection || e.target.closest('.menu-scroll-wrapper') && !e.target.closest('.drink-card')) {
                setLiquidDrink('none');
                if (window.setSpiceColors) {
                    window.setSpiceColors('default');
                }
                if (window.setLogoColor) {
                    window.setLogoColor('default');
                }
                document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
            }
        });
    }
})();
