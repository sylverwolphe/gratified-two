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
