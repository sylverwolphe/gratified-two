// ===== MENU CONFIG LOADER =====
// Loads menu items from menu-config.json for easy editing
let menuConfig = null;
let drinkDetails = {};

async function loadMenuConfig() {
    try {
        const response = await fetch('config/menu-config.json');
        menuConfig = await response.json();

        // Build drinkDetails object from config
        menuConfig.drinks.forEach(drink => {
            drinkDetails[drink.id] = {
                name: drink.name,
                desc: drink.fullDesc,
                extras: drink.extras.map(e => `<p>${e}</p>`).join('')
            };
        });

        // Render menu cards
        renderMenuCards();

        // Re-initialize drink card click handlers after rendering
        initDrinkCardHandlers();

        return menuConfig;
    } catch (error) {
        console.error('Failed to load menu config:', error);
        return null;
    }
}

function renderMenuCards() {
    const drinksScroll = document.querySelector('.drinks-scroll');
    if (!drinksScroll || !menuConfig) return;

    // Clear existing cards
    drinksScroll.innerHTML = '';

    // Render each drink from config
    menuConfig.drinks.forEach(drink => {
        const card = document.createElement('div');
        card.className = 'drink-card';
        card.setAttribute('data-drink', drink.id);

        const iconSvg = menuConfig.icons[drink.icon] || menuConfig.icons['surprise'];

        card.innerHTML = `
            <div class="drink-illustration">
                ${iconSvg}
            </div>
            <div class="drink-info">
                <div class="drink-name">${drink.name}</div>
                <div class="drink-desc">${drink.shortDesc}</div>
            </div>
        `;

        drinksScroll.appendChild(card);
    });
}

function initDrinkCardHandlers() {
    document.querySelectorAll('.drink-card[data-drink]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const drinkId = card.dataset.drink;

            if (window.setLiquidDrink) window.setLiquidDrink(drinkId);
            if (window.setSpiceColors) window.setSpiceColors(drinkId);
            if (window.setLogoColor) window.setLogoColor(drinkId);

            document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (window.showDrinkDetail) window.showDrinkDetail(drinkId, card);
        });
    });
}

// Load menu config when DOM is ready
document.addEventListener('DOMContentLoaded', loadMenuConfig);

// ===== PARTNER LOGOS LOADER =====
// Loads partner logos from partners/partners.json
async function loadPartnerLogos() {
    const container = document.getElementById('partnersLogos');
    if (!container) return;

    try {
        const response = await fetch('partners/partners.json');
        const data = await response.json();

        // Filter out the _readme entry and check if we have real partners
        const partners = data.partners.filter(p => p.logo && p.logo !== 'example-logo.png');

        if (partners.length === 0) {
            // Keep the placeholder if no partners
            return;
        }

        // Clear placeholder
        container.innerHTML = '';

        // Add each partner logo
        partners.forEach(partner => {
            const logoWrapper = document.createElement('a');
            logoWrapper.className = 'partner-logo';
            logoWrapper.title = partner.name;

            if (partner.url) {
                logoWrapper.href = partner.url;
                logoWrapper.target = '_blank';
                logoWrapper.rel = 'noopener noreferrer';
            } else {
                logoWrapper.style.cursor = 'default';
            }

            const img = document.createElement('img');
            img.src = `partners/${partner.logo}`;
            img.alt = partner.name;
            img.loading = 'lazy';

            logoWrapper.appendChild(img);
            container.appendChild(logoWrapper);
        });
    } catch (error) {
        console.log('No partner logos configured yet');
    }
}

document.addEventListener('DOMContentLoaded', loadPartnerLogos);

// Multi-Mode Particle System with drink-based colors
// Modes: 'dots' (original), 'diamonds', 'steam'
(function initParticleSystem() {
    const canvas = document.getElementById('spice-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    // Current particle mode - can be toggled
    let particleMode = 'steam'; // 'dots', 'diamonds', 'steam', 'dust', 'grounds'
    const PARTICLE_COUNTS = { dots: 200, diamonds: 200, steam: 120, dust: 150, grounds: 100 };

    // Logo colors for each drink - theme awarthree for accessibility
    const drinkLogoColorsLight = {
        'default': '#2d2926',      // Charcoal ink (original)
        'pour-over': '#8a6035',    // Darker amber for light bg
        'cappuccino': '#4a2a1a',   // Dark espresso
        'latte': '#6b4d35',        // Darker milky coffee
        'mocha': '#3d2015',        // Dark chocolate coffee
        'hot-chocolate': '#351a10', // Rich chocolate
        'matcha-latte': '#4a5c30', // Darker matcha green
        'moroccan-mint': '#3d5a3d', // Darker mint
        'something-different': '#8a4a5a' // Darker dusty rose
    };

    const drinkLogoColorsDark = {
        'default': '#d4cdc5',      // Light warm gray
        'pour-over': '#d4a870',    // Light amber
        'cappuccino': '#c4a080',   // Light espresso cream
        'latte': '#c9b090',        // Light milky coffee
        'mocha': '#b08060',        // Light chocolate
        'hot-chocolate': '#c49070', // Light cocoa
        'matcha-latte': '#9ab070', // Light matcha
        'moroccan-mint': '#80b080', // Light mint
        'something-different': '#d4a0b0' // Light rose
    };

    // Mobile navbar colors for each drink (5 colors for 5 buttons)
    const drinkNavbarColors = {
        'default': ['#6B5740', '#D2691E', '#C08497', '#CD7F32', '#E8A317'], // olive-bronze, orange, rose, bronze, saffron (matches CSS)
        'pour-over': ['#8a6035', '#c28c50', '#d4a870', '#b8860b', '#daa520'],
        'cappuccino': ['#4a2a1a', '#6b4423', '#8b5a2b', '#a0522d', '#cd853f'],
        'latte': ['#6b4d35', '#8b7355', '#a08060', '#c4a484', '#d2b48c'],
        'mocha': ['#3d2015', '#5c3317', '#6b4423', '#8b4513', '#a0522d'],
        'hot-chocolate': ['#351a10', '#4a2c2a', '#6b4423', '#8b4513', '#cd853f'],
        'matcha-latte': ['#4a5c30', '#6b8e23', '#7cba3d', '#8fbc8f', '#9acd32'],
        'moroccan-mint': ['#3d5a3d', '#4a7c59', '#5f9e6e', '#71bc78', '#90ee90'],
        'something-different': ['#8a4a5a', '#b06070', '#c08497', '#d4a0b0', '#e6b8c2']
    };

    // Helper to get current theme
    function getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // Get the appropriate logo color based on theme
    function getLogoColor(drinkId) {
        const theme = getCurrentTheme();
        const colors = theme === 'dark' ? drinkLogoColorsDark : drinkLogoColorsLight;
        return colors[drinkId] || colors['default'];
    }

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
    const activeFrameInterval = 1000 / 60;  // 60fps
    const inactiveFrameInterval = 1000 / 10; // 10fps when inactive

    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;
    });

    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
    }, { passive: true });

    function resize() {
        const oldWidth = canvas.width || window.innerWidth;
        const oldHeight = canvas.height || window.innerHeight;
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Scale existing particle positions proportionally
        if (particles.length > 0 && oldWidth > 0 && oldHeight > 0) {
            const scaleX = newWidth / oldWidth;
            const scaleY = newHeight / oldHeight;

            particles.forEach(p => {
                // Scale position proportionally
                p.x *= scaleX;
                p.y *= scaleY;

                // Ensure particles stay within bounds
                p.x = Math.max(0, Math.min(p.x, newWidth));
                p.y = Math.max(0, Math.min(p.y, newHeight));
            });
        }
    }

    function createParticle(randomizeLife = true) {
        const color = currentColors[Math.floor(Math.random() * currentColors.length)];

        // Base particle properties shared across modes
        const particle = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: { ...color },
            targetColor: { ...color },
            colorIndex: Math.floor(Math.random() * currentColors.length)
        };

        // Mode-specific properties
        if (particleMode === 'dots') {
            particle.size = Math.random() * 4 + 2;
            particle.speedX = (Math.random() - 0.5) * 0.3;
            particle.speedY = Math.random() * 0.2 + 0.05; // Falling down
            particle.opacity = Math.random() * 0.25 + 0.08;
            particle.wobble = Math.random() * Math.PI * 2;
            particle.wobbleSpeed = Math.random() * 0.02 + 0.005;
        } else if (particleMode === 'diamonds') {
            particle.size = Math.random() * 4 + 2;
            particle.speedX = (Math.random() - 0.5) * 0.3;
            particle.speedY = Math.random() * 0.2 + 0.05; // Falling down
            particle.opacity = Math.random() * 0.25 + 0.08;
            particle.wobble = Math.random() * Math.PI * 2;
            particle.wobbleSpeed = Math.random() * 0.02 + 0.005;
            particle.rotation = Math.random() * Math.PI * 2;
        } else if (particleMode === 'steam') {
            particle.size = Math.random() * 6 + 3;
            particle.originalSize = particle.size;
            particle.y = canvas.height + Math.random() * 50; // Start from bottom
            particle.speedY = -(Math.random() * 0.4 + 0.2); // Rising up
            particle.curlOffset = Math.random() * Math.PI * 2;
            particle.curlSpeed = Math.random() * 0.008 + 0.003;
            particle.curlAmplitude = Math.random() * 40 + 20;
            particle.life = randomizeLife ? Math.floor(Math.random() * 400) : 0;
            particle.maxLife = Math.random() * 400 + 300;
        } else if (particleMode === 'dust') {
            particle.size = Math.random() * 3 + 1.5; // Smaller, matte particles
            particle.opacity = Math.random() * 0.35 + 0.15; // More visible, no glow
            // Mostly horizontal drift with gentle vertical
            particle.speedX = (Math.random() - 0.5) * 0.4;
            particle.speedY = (Math.random() - 0.5) * 0.15;
            // Swirl parameters - like dust caught in light
            particle.swirlPhase = Math.random() * Math.PI * 2;
            particle.swirlSpeed = Math.random() * 0.01 + 0.005;
            particle.swirlRadius = Math.random() * 15 + 5;
            // Occasional direction changes
            particle.directionTimer = Math.floor(Math.random() * 200);
            particle.directionInterval = Math.floor(Math.random() * 300) + 200;
        } else if (particleMode === 'grounds') {
            // Coffee grounds - irregular sizes, very slow, some sink some float
            particle.size = Math.random() * 2.5 + 1; // Small irregular particles
            particle.opacity = Math.random() * 0.4 + 0.2; // More visible
            // Very slow movement
            particle.speedX = (Math.random() - 0.5) * 0.08;
            // Most sink slowly, some float up slightly
            particle.speedY = Math.random() < 0.7
                ? Math.random() * 0.12 + 0.02  // Sinking (70%)
                : -(Math.random() * 0.05 + 0.01); // Floating up (30%)
            // Irregular wobble
            particle.wobble = Math.random() * Math.PI * 2;
            particle.wobbleSpeed = Math.random() * 0.008 + 0.002;
            particle.wobbleAmount = Math.random() * 0.3 + 0.1;
            // Rotation for non-circular appearance
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.01;
            // Elongation factor for irregular shapes
            particle.stretch = Math.random() * 0.5 + 0.8;
        }

        return particle;
    }

    function init() {
        resize();
        particles = [];
        const count = PARTICLE_COUNTS[particleMode] || 150;
        for (let i = 0; i < count; i++) {
            particles.push(createParticle(true));
        }
    }

    // Switch particle mode and reinitialize
    window.setParticleMode = function(mode) {
        if (['dots', 'diamonds', 'steam', 'dust', 'grounds'].includes(mode)) {
            particleMode = mode;
            init();
            updateToggleButton();
        }
    };

    window.getParticleMode = function() {
        return particleMode;
    };

    function updateToggleButton() {
        const btn = document.getElementById('particleToggle');
        if (btn) {
            const labels = { dots: 'Dots', diamonds: 'Diamonds', steam: 'Steam', dust: 'Spice Dust', grounds: 'Coffee Grounds' };
            btn.textContent = `Particles: ${labels[particleMode]}`;
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

        particles.forEach((p) => {
            // Smoothly transition particle color toward target
            p.color = lerpColor(p.color, p.targetColor, colorTransitionSpeed);

            if (particleMode === 'dots') {
                // === DOTS MODE ===
                p.wobble += p.wobbleSpeed;
                p.x += p.speedX + Math.sin(p.wobble) * 0.2;
                p.y += p.speedY;

                // Wrap edges
                if (p.y > canvas.height + 10) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.x < -10) p.x = canvas.width + 10;

                const depthFactor = (p.size / 6) * parallaxStrength;
                const parallaxOffsetY = scrollY * depthFactor;

                const colorStr = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y - parallaxOffsetY, p.size, 0, Math.PI * 2);
                ctx.fillStyle = colorStr;
                ctx.shadowColor = colorStr;
                ctx.shadowBlur = p.size * 2;
                ctx.fill();

            } else if (particleMode === 'diamonds') {
                // === DIAMONDS MODE ===
                p.wobble += p.wobbleSpeed;
                p.x += p.speedX + Math.sin(p.wobble) * 0.2;
                p.y += p.speedY;

                // Wrap edges
                if (p.y > canvas.height + 10) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.x < -10) p.x = canvas.width + 10;

                const depthFactor = (p.size / 6) * parallaxStrength;
                const parallaxOffsetY = scrollY * depthFactor;
                const x = p.x;
                const y = p.y - parallaxOffsetY;
                const size = p.size * 1.5;

                const colorStr = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${p.opacity})`;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.PI / 4 + p.wobble * 0.1);
                ctx.beginPath();
                ctx.rect(-size / 2, -size / 2, size, size);
                ctx.fillStyle = colorStr;
                ctx.shadowColor = colorStr;
                ctx.shadowBlur = p.size * 2;
                ctx.fill();
                ctx.restore();

            } else if (particleMode === 'steam') {
                // === STEAM MODE ===
                p.life++;
                p.curlOffset += p.curlSpeed;
                const curlX = Math.sin(p.curlOffset) * p.curlAmplitude * (p.life / p.maxLife);
                p.y += p.speedY;

                const lifeRatio = p.life / p.maxLife;
                let opacity;
                if (lifeRatio < 0.1) {
                    opacity = (lifeRatio / 0.1) * 0.15;
                } else if (lifeRatio > 0.7) {
                    opacity = ((1 - lifeRatio) / 0.3) * 0.15;
                } else {
                    opacity = 0.15;
                }

                p.size = p.originalSize * (1 + lifeRatio * 0.5);

                if (p.life >= p.maxLife || p.y < -50) {
                    p.x = Math.random() * canvas.width;
                    p.y = canvas.height + Math.random() * 50;
                    p.life = 0;
                    p.maxLife = Math.random() * 400 + 300;
                    p.curlOffset = Math.random() * Math.PI * 2;
                    p.curlAmplitude = Math.random() * 40 + 20;
                    p.size = p.originalSize;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }

                const depthFactor = (p.originalSize / 8) * parallaxStrength;
                const parallaxOffsetY = scrollY * depthFactor;
                const x = p.x + curlX;
                const y = p.y - parallaxOffsetY;

                const colorStr = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${opacity})`;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size);
                gradient.addColorStop(0, colorStr);
                gradient.addColorStop(0.5, `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${opacity * 0.5})`);
                gradient.addColorStop(1, `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, 0)`);

                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

            } else if (particleMode === 'dust') {
                // === SPICE DUST MODE ===
                // Update swirl phase
                p.swirlPhase += p.swirlSpeed;

                // Occasional direction changes (like air currents)
                p.directionTimer++;
                if (p.directionTimer >= p.directionInterval) {
                    p.directionTimer = 0;
                    p.directionInterval = Math.floor(Math.random() * 300) + 200;
                    // Gentle direction shift
                    p.speedX += (Math.random() - 0.5) * 0.2;
                    p.speedY += (Math.random() - 0.5) * 0.1;
                    // Clamp speeds
                    p.speedX = Math.max(-0.5, Math.min(0.5, p.speedX));
                    p.speedY = Math.max(-0.2, Math.min(0.2, p.speedY));
                }

                // Apply swirl motion (dust caught in light beams)
                const swirlX = Math.sin(p.swirlPhase) * p.swirlRadius * 0.02;
                const swirlY = Math.cos(p.swirlPhase * 0.7) * p.swirlRadius * 0.01;

                p.x += p.speedX + swirlX;
                p.y += p.speedY + swirlY;

                // Wrap edges smoothly
                if (p.x > canvas.width + 20) {
                    p.x = -20;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }
                if (p.x < -20) {
                    p.x = canvas.width + 20;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }
                if (p.y > canvas.height + 20) {
                    p.y = -20;
                }
                if (p.y < -20) {
                    p.y = canvas.height + 20;
                }

                const depthFactor = (p.size / 4) * parallaxStrength;
                const parallaxOffsetY = scrollY * depthFactor;

                // Draw matte particle (no glow, solid fill)
                const colorStr = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y - parallaxOffsetY, p.size, 0, Math.PI * 2);
                ctx.fillStyle = colorStr;
                ctx.fill();

            } else if (particleMode === 'grounds') {
                // === COFFEE GROUNDS MODE ===
                // Update wobble and rotation
                p.wobble += p.wobbleSpeed;
                p.rotation += p.rotationSpeed;

                // Very slow drift with subtle wobble
                p.x += p.speedX + Math.sin(p.wobble) * p.wobbleAmount;
                p.y += p.speedY;

                // Wrap edges - respawn at top if sinking, bottom if floating
                if (p.y > canvas.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }
                if (p.y < -20) {
                    p.y = canvas.height + 20;
                    p.x = Math.random() * canvas.width;
                    p.colorIndex = Math.floor(Math.random() * targetColors.length);
                    p.targetColor = { ...targetColors[p.colorIndex] };
                }
                if (p.x > canvas.width + 20) p.x = -20;
                if (p.x < -20) p.x = canvas.width + 20;

                const depthFactor = (p.size / 3) * parallaxStrength;
                const parallaxOffsetY = scrollY * depthFactor;
                const x = p.x;
                const y = p.y - parallaxOffsetY;

                // Draw irregular shaped particle (stretched ellipse)
                const colorStr = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${p.opacity})`;

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(p.rotation);
                ctx.scale(1, p.stretch); // Stretch to make irregular

                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fillStyle = colorStr;
                ctx.fill();

                ctx.restore();
            }
        });

        // Reset shadow after dots/diamonds
        if (particleMode === 'dots' || particleMode === 'diamonds') {
            ctx.shadowBlur = 0;
        }

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

    // Track current drink for theme change updates
    let currentDrinkTheme = 'default';

    // Elements that should be themed with drink colors
    const getThemedElements = () => ({
        logos: document.querySelectorAll('.logo'),
        menuTitle: document.querySelector('#menu .section-title'),
        projectsTitle: document.querySelector('#projects .section-title'),
        teamTitle: document.querySelector('#team .section-title'),
        drinkDetailName: document.querySelector('.drink-detail-name'),
        drinkDetailBack: document.querySelector('.drink-detail-back'),
        drinkDetailIllustration: document.querySelector('.drink-detail-illustration'),
        menuSection: document.querySelector('#menu'),
        projectsSection: document.querySelector('#projects'),
        teamSection: document.querySelector('#team'),
        drinkCards: document.querySelectorAll('.drink-card'),
        projectCards: document.querySelectorAll('.project-card'),
        teamMembers: document.querySelectorAll('.team-member'),
        footerLinks: document.querySelectorAll('.footer-link'),
        themeToggle: document.querySelector('.theme-toggle'),
        // Navigation elements
        mainNav: document.querySelector('.main-nav'),
        navLinks: document.querySelectorAll('.nav-link'),
        mobileNavbar: document.querySelector('.mobile-navbar'),
        mobileNavIcons: document.querySelectorAll('.mobile-nav-icon')
    });

    // Apply drink theme colors to all relevant elements
    window.setDrinkTheme = function(drinkId) {
        currentDrinkTheme = drinkId;
        const elements = getThemedElements();
        const color = drinkId === 'default' ? '' : getLogoColor(drinkId);

        // All logos across pages
        elements.logos.forEach(logo => {
            logo.style.color = color;
        });

        // Section titles and drink detail name
        [elements.menuTitle, elements.projectsTitle, elements.teamTitle, elements.drinkDetailName].forEach(title => {
            if (title) {
                title.style.color = color;
            }
        });

        // Drink detail back button (using CSS variable for hover state support)
        if (elements.drinkDetailBack) {
            if (color) {
                elements.drinkDetailBack.style.setProperty('--btn-color', color);
            } else {
                elements.drinkDetailBack.style.removeProperty('--btn-color');
            }
        }

        // Drink detail illustration box
        if (elements.drinkDetailIllustration) {
            elements.drinkDetailIllustration.style.borderColor = color || '';
        }

        // Section borders (the ::before pseudo-element border)
        [elements.menuSection, elements.projectsSection, elements.teamSection].forEach(section => {
            if (section) {
                section.style.setProperty('--drink-accent', color || 'var(--dusty-rose)');
            }
        });

        // Drink card borders
        elements.drinkCards.forEach(card => {
            card.style.borderColor = color || '';
        });

        // Project card borders
        elements.projectCards.forEach(card => {
            card.style.borderColor = color || '';
        });

        // Team member borders
        elements.teamMembers.forEach(member => {
            member.style.borderColor = color || '';
        });

        // Theme toggle border
        if (elements.themeToggle) {
            elements.themeToggle.style.borderColor = color || '';
        }

        // Desktop navigation active link styling
        elements.navLinks.forEach(link => {
            // Only style active links with the drink color
            if (link.classList.contains('active')) {
                link.style.color = color || '';
            } else {
                link.style.color = '';
            }
        });

        // Mobile navigation
        const navColors = drinkNavbarColors[drinkId] || drinkNavbarColors['default'];
        if (elements.mobileNavbar) {
            if (drinkId === 'default') {
                // Reset to solid border
                elements.mobileNavbar.style.borderImage = '';
                elements.mobileNavbar.style.borderColor = '';
            } else {
                // Apply gradient border
                elements.mobileNavbar.style.borderImage = `linear-gradient(to right, ${navColors[0]}, ${navColors[1]}, ${navColors[2]}, ${navColors[3]}, ${navColors[4]}) 1`;
            }
        }


        // Update mobile nav icon colors based on drink palette
        document.documentElement.style.setProperty('--drink-nav-color-1', navColors[0]);
        document.documentElement.style.setProperty('--drink-nav-color-2', navColors[1]);
        document.documentElement.style.setProperty('--drink-nav-color-3', navColors[2]);
        document.documentElement.style.setProperty('--drink-nav-color-4', navColors[3]);
        document.documentElement.style.setProperty('--drink-nav-color-5', navColors[4]);
    };

    // Keep setLogoColor as alias for backwards compatibility
    window.setLogoColor = function(drinkId) {
        window.setDrinkTheme(drinkId);
    };

    // Update all themed elements when theme changes
    const themeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'data-theme' && currentDrinkTheme !== 'default') {
                window.setDrinkTheme(currentDrinkTheme);
            }
        });
    });
    themeObserver.observe(document.documentElement, { attributes: true });

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

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
['hostModal', 'foodModal', 'artModal', 'teamModal', 'unlimitedModal', 'investorModal'].forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(modalId);
            }
        });
    }
});

// Google Forms submission configuration
// To set up: Create a Google Form, get the form ID and entry IDs from the form's pre-filled link
const googleFormsConfig = {
    'hostForm': {
        formId: 'YOUR_HOST_FORM_ID', // Replace with actual Google Form ID
        fields: {
            'name': 'entry.XXXXXXXXX',      // Replace with actual entry IDs
            'email': 'entry.XXXXXXXXX',
            'spaceType': 'entry.XXXXXXXXX',
            'location': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'hosting inquiry'
    },
    'foodForm': {
        formId: 'YOUR_FOOD_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'business': 'entry.XXXXXXXXX',
            'foodType': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'food partnership inquiry'
    },
    'artForm': {
        formId: 'YOUR_ART_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'artType': 'entry.XXXXXXXXX',
            'portfolio': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'art collaboration inquiry'
    },
    'teamForm': {
        formId: 'YOUR_TEAM_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'role': 'entry.XXXXXXXXX',
            'portfolio': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX'
        },
        successMessage: 'application'
    },
    'unlimitedForm': {
        formId: 'YOUR_UNLIMITED_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'phone': 'entry.XXXXXXXXX',
            'source': 'entry.XXXXXXXXX'
        },
        successMessage: 'unlimited membership signup'
    },
    'investorForm': {
        formId: 'YOUR_INVESTOR_FORM_ID',
        fields: {
            'name': 'entry.XXXXXXXXX',
            'email': 'entry.XXXXXXXXX',
            'phone': 'entry.XXXXXXXXX',
            'details': 'entry.XXXXXXXXX',
            'linkedin': 'entry.XXXXXXXXX'
        },
        successMessage: 'investor inquiry'
    }
};

// Submit form data to Google Forms via hidden iframe
function submitToGoogleForm(formId, formData) {
    const config = googleFormsConfig[formId];
    if (!config || config.formId.includes('YOUR_')) {
        // If not configured, just show success (for testing)
        console.log('Google Form not configured for:', formId, formData);
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        // Create hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hidden_iframe_' + Date.now();
        document.body.appendChild(iframe);

        // Create form targeting the iframe
        const submitForm = document.createElement('form');
        submitForm.target = iframe.name;
        submitForm.method = 'POST';
        submitForm.action = `https://docs.google.com/forms/d/e/${config.formId}/formResponse`;

        // Map form fields to Google Form entry IDs
        Object.keys(config.fields).forEach(fieldName => {
            if (formData[fieldName] !== undefined) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = config.fields[fieldName];
                input.value = formData[fieldName] || '';
                submitForm.appendChild(input);
            }
        });

        document.body.appendChild(submitForm);
        submitForm.submit();

        // Clean up after submission
        setTimeout(() => {
            document.body.removeChild(iframe);
            document.body.removeChild(submitForm);
            resolve();
        }, 1000);
    });
}

// Form submission handlers for all modals
Object.keys(googleFormsConfig).forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            const config = googleFormsConfig[formId];
            const modalId = formId.replace('Form', 'Modal');

            // Disable submit button while processing
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            try {
                await submitToGoogleForm(formId, data);
                alert(`Thanks ${data.name}! We've received your ${config.successMessage}. We'll get back to you within a few days.`);
                closeModal(modalId);
                this.reset();
            } catch (error) {
                console.error('Form submission error:', error);
                alert('There was an error submitting the form. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
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
        if (!this.container) return;

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
const projectModalEl = document.getElementById('projectModal');
if (projectModalEl) {
    projectModalEl.addEventListener('click', function(e) {
        if (e.target === this) closeProjectModal();
    });
}

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

// ===== DRINK DETAIL DATA =====
// drinkDetails is now loaded from menu-config.json (see top of file)

// ===== DRINK DETAIL VIEW =====
(function initDrinkDetailView() {
    const detailView = document.getElementById('drinkDetailView');
    const scrollWrapper = document.getElementById('menuScrollWrapper');
    const backButton = document.getElementById('drinkDetailBack');
    const detailIllustration = document.getElementById('drinkDetailIllustration');
    const detailName = document.getElementById('drinkDetailName');
    const detailDesc = document.getElementById('drinkDetailDesc');
    const detailExtras = document.getElementById('drinkDetailExtras');

    if (!detailView || !scrollWrapper || !backButton) return;

    // Show detail view for a drink
    window.showDrinkDetail = function(drinkId, cardElement) {
        const details = drinkDetails[drinkId];
        if (!details) return;

        // Copy the SVG from the card
        const svg = cardElement.querySelector('.drink-svg');
        if (svg) {
            detailIllustration.innerHTML = svg.outerHTML;
        }

        // Set the content
        detailName.textContent = details.name;
        detailDesc.textContent = details.desc;
        detailExtras.innerHTML = details.extras;

        // Hide scroll wrapper, show detail view
        scrollWrapper.classList.add('hidden');
        detailView.classList.add('active');

        // Trigger animation after display change
        requestAnimationFrame(() => {
            detailView.style.opacity = '1';
            detailView.style.transform = 'translateY(0)';
        });
    };

    // Hide detail view and show scroll menu
    window.hideDrinkDetail = function() {
        detailView.classList.remove('active');
        scrollWrapper.classList.remove('hidden');

        // Reset liquid shader and colors
        if (window.setLiquidDrink) setLiquidDrink('none');
        if (window.setSpiceColors) setSpiceColors('default');
        if (window.setLogoColor) setLogoColor('default');

        // Remove selected state from cards
        document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('selected'));
    };

    // Back button handler
    backButton.addEventListener('click', (e) => {
        e.stopPropagation();
        hideDrinkDetail();
    });
})();

// ===== MENU SLIDER CONTROL =====
(function initMenuSlider() {
    const slider = document.getElementById('menuSlider');
    const scrollContainer = document.querySelector('.drinks-scroll');
    if (!slider || !scrollContainer) return;

    let isSliderActive = false;

    // Update slider when scrolling manually (only if slider not being used)
    scrollContainer.addEventListener('scroll', () => {
        if (isSliderActive) return;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (maxScroll > 0) {
            slider.value = (scrollContainer.scrollLeft / maxScroll) * 100;
        }
    });

    // Disable scroll-snap while dragging slider for smooth movement
    slider.addEventListener('mousedown', () => {
        isSliderActive = true;
        scrollContainer.style.scrollSnapType = 'none';
        scrollContainer.style.scrollBehavior = 'auto';
    });

    slider.addEventListener('touchstart', () => {
        isSliderActive = true;
        scrollContainer.style.scrollSnapType = 'none';
        scrollContainer.style.scrollBehavior = 'auto';
    }, { passive: true });

    // Re-enable scroll-snap when done
    const endSliderDrag = () => {
        if (!isSliderActive) return;
        isSliderActive = false;
        // Small delay before re-enabling snap to let the scroll settle
        setTimeout(() => {
            scrollContainer.style.scrollSnapType = 'x mandatory';
            scrollContainer.style.scrollBehavior = 'smooth';
        }, 150);
    };

    window.addEventListener('mouseup', endSliderDrag);
    window.addEventListener('touchend', endSliderDrag);

    // Scroll when slider changes
    slider.addEventListener('input', () => {
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        scrollContainer.scrollLeft = (slider.value / 100) * maxScroll;
    });
})();

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

            // Create zigzag/sawtooth diamond-like surface pattern
            float waveStrength = 0.035;
            // Triangle wave function for sharp zigzag peaks
            float triWave1 = abs(mod(uv.x * 8.0 + time * 0.5, 2.0) - 1.0) * waveStrength;
            float triWave2 = abs(mod(uv.x * 12.0 - time * 0.3, 2.0) - 1.0) * waveStrength * 0.5;
            float surfaceWave = triWave1 + triWave2 - waveStrength * 0.75;

            // The liquid fill level (0 = bottom, 1 = top)
            float liquidSurface = u_fillLevel + surfaceWave;

            // Smooth edges for anti-aliasing but sharp zigzag shape
            float inLiquid = smoothstep(0.0, 0.005, uv.y) * smoothstep(liquidSurface + 0.003, liquidSurface - 0.003, uv.y);

            // Stroke line at the top of the liquid (using secondary color)
            float strokeWidth = 0.008;
            float inStroke = smoothstep(liquidSurface - strokeWidth - 0.002, liquidSurface - strokeWidth, uv.y)
                           * smoothstep(liquidSurface + 0.002, liquidSurface - 0.002, uv.y);

            // Empty state (when fillLevel is 0)
            if (u_fillLevel < 0.01) {
                gl_FragColor = vec4(0.0);
                return;
            }

            // === LIQUID RENDERING ===
            vec3 liquidColor = u_baseColor;

            // Swirl patterns (if enabled)
            if (u_hasSwirl > 0.5) {
                // Create distributed swirl pattern without center glow
                vec2 center = vec2(0.5, u_fillLevel * 0.5);
                vec2 toCenter = uv - center;
                float dist = length(toCenter);
                float angle = atan(toCenter.y, toCenter.x);

                // Spiral ribbons that don't concentrate at center
                float spiral = sin(angle * 4.0 + dist * 15.0 - time * 1.2) * 0.5 + 0.5;
                // Ring-shaped mask instead of center-focused
                float swirlMask = smoothstep(0.05, 0.15, dist) * smoothstep(0.5, 0.2, dist) * spiral;

                // Cream swirl mixing into coffee
                float creamSwirl = fbm(vec2(angle * 2.0 + time * 0.5, dist * 5.0 - time * 0.3)) * swirlMask;
                liquidColor = mix(liquidColor, u_secondaryColor, creamSwirl * 0.5);
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

            // === COMBINE ===
            vec3 finalColor = vec3(0.0);
            float finalAlpha = 0.0;

            if (inLiquid > 0.01) {
                finalColor = liquidColor;
                finalAlpha = inLiquid * 0.4;
            }

            // Add stroke line at top in secondary color (darker version for contrast)
            if (inStroke > 0.01) {
                vec3 strokeColor = u_secondaryColor * 0.7; // Slightly darker for visibility
                finalColor = mix(finalColor, strokeColor, inStroke * 0.9);
                finalAlpha = max(finalAlpha, inStroke * 0.6);
            }

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
                resize(); // Re-calculate size when becoming visible
                startAnimation();
            }
        });
    }, { threshold: 0.01 }); // Lower threshold to trigger sooner

    if (menuEl) {
        observer.observe(menuEl);
    }

    // Start animation
    startAnimation();

    // Note: Drink card click handlers are now initialized in initDrinkCardHandlers()
    // after menu cards are dynamically loaded from menu-config.json
})();

// ========== PAGE NAVIGATION SYSTEM (Scroll-Snap Based) ==========
(function initPageNavigation() {
    let currentPage = 'landing';
    let isScrolling = false;
    let scrollTimeout;

    // Get page from URL hash on load
    function getPageFromHash() {
        const hash = window.location.hash.replace('#', '');
        return hash || 'landing';
    }

    // Update active states on nav links
    function updateNavActiveStates(pageName) {
        // Desktop nav
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.dataset.page === pageName;
            link.classList.toggle('active', isActive);

            // Reset drink theme styling when switching pages
            if (isActive) {
                // Re-apply drink theme to active link if one is set
                if (window.currentDrinkTheme && window.currentDrinkTheme !== 'default') {
                    const color = window.getLogoColor ? window.getLogoColor(window.currentDrinkTheme) : '';
                    link.style.color = color || '';
                    link.style.borderColor = color || '';
                }
            } else {
                link.style.color = '';
                link.style.borderColor = '';
            }
        });

        // Mobile nav
        document.querySelectorAll('.mobile-nav-item').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });
    }

    // Navigate to a page by scrolling
    window.navigateTo = function(pageName) {
        const pageEl = document.getElementById(`page-${pageName}`);
        if (!pageEl) return;

        // Calculate scroll position (account for nav on desktop)
        const navHeight = window.innerWidth > 768 ? 70 : 0;
        const pageTop = pageEl.offsetTop - navHeight;

        // Scroll to page
        window.scrollTo({
            top: pageTop,
            behavior: 'smooth'
        });

        // Update URL hash without triggering scroll
        if (window.location.hash !== `#${pageName}`) {
            history.pushState(null, '', `#${pageName}`);
        }
    };

    // Detect which page is currently in view using IntersectionObserver
    const pages = document.querySelectorAll('.page');

    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px', // Trigger when page is roughly centered
        threshold: 0
    };

    const pageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageName = entry.target.dataset.page;
                if (pageName && pageName !== currentPage) {
                    currentPage = pageName;

                    // Update nav highlighting
                    updateNavActiveStates(pageName);

                    // Update URL hash (debounced to prevent rapid updates)
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        if (window.location.hash !== `#${pageName}`) {
                            history.replaceState(null, '', `#${pageName}`);
                        }
                    }, 100);
                }
            }
        });
    }, observerOptions);

    // Observe all pages
    pages.forEach(page => pageObserver.observe(page));

    // Handle nav link clicks
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.dataset.page;
            if (pageName) {
                navigateTo(pageName);
            }
        });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const pageName = getPageFromHash();
        navigateTo(pageName);
    });

    // Initialize on load - scroll to page from hash
    const initialPage = getPageFromHash();
    currentPage = initialPage;
    updateNavActiveStates(initialPage);

    // If there's a hash, scroll to that page after a brief delay
    if (initialPage !== 'landing') {
        setTimeout(() => {
            navigateTo(initialPage);
        }, 100);
    }

    // Scroll hint click handler
    const scrollHint = document.querySelector('.scroll-hint');
    if (scrollHint) {
        scrollHint.addEventListener('click', () => {
            navigateTo('menu');
        });
    }

})();
