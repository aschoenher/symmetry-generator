// Geometric Pattern Generator - Frontend JavaScript
// Fully client-side: no server required.

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const patternTypeSelect = document.getElementById('pattern-type');
    const generateBtn = document.getElementById('generate-btn');
    const randomGenerateBtn = document.getElementById('random-generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const randomSeedBtn = document.getElementById('random-seed');
    const seedInput = document.getElementById('seed');
    const svgContainer = document.getElementById('svg-container');
    const loading = document.getElementById('loading');
    const currentSeedDisplay = document.getElementById('current-seed');
    const autoModeCheckbox = document.getElementById('auto-mode');
    const autoIntervalSlider = document.getElementById('auto-interval');
    const autoIntervalValue = document.getElementById('auto-interval-value');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const previewContainer = document.getElementById('preview-container');
    const settingsToggle = document.getElementById('settings-toggle');
    const controlsPanel = document.querySelector('.controls');
    const controlsBackdrop = document.getElementById('controls-backdrop');

    // Pattern-specific option containers
    const optionContainers = {
        rosette: document.getElementById('rosette-options'),
        kaleidoscope: document.getElementById('kaleidoscope-options'),
        wallpaper: document.getElementById('wallpaper-options'),
        frieze: document.getElementById('frieze-options')
    };

    // Range inputs with value displays
    const rangeInputs = [
        { input: 'rosette-n', display: 'rosette-n-value' },
        { input: 'kaleidoscope-iterations', display: 'kaleidoscope-iterations-value' },
        { input: 'kaleidoscope-speed', display: 'kaleidoscope-speed-value' },
        { input: 'wallpaper-repeat', display: 'wallpaper-repeat-value', format: v => `${v}x${v}` },
        { input: 'frieze-repetitions', display: 'frieze-repetitions-value' },
        { input: 'complexity', display: 'complexity-value' }
    ];

    // WebGL tunnel instance
    let tunnelEffect = null;

    // Fullscreen canvas for static SVG rendering
    let fullscreenCanvas = null;

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Set up range input listeners
    rangeInputs.forEach(({ input, display, format }) => {
        const inputEl = document.getElementById(input);
        const displayEl = document.getElementById(display);
        if (inputEl && displayEl) {
            inputEl.addEventListener('input', function() {
                displayEl.textContent = format ? format(this.value) : this.value;
            });
        }
    });

    // Handle 3D tunnel checkbox - regenerate when toggled
    document.getElementById('kaleidoscope-animate').addEventListener('change', function() {
        if (patternTypeSelect.value === 'kaleidoscope') {
            generatePattern();
        }
    });

    // Pattern type change handler
    patternTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        Object.values(optionContainers).forEach(container => {
            container.style.display = 'none';
        });
        if (optionContainers[selectedType]) {
            optionContainers[selectedType].style.display = 'block';
        }
        if (tunnelEffect && selectedType !== 'kaleidoscope') {
            tunnelEffect.destroy();
            tunnelEffect = null;
        }
    });

    // Random seed button
    randomSeedBtn.addEventListener('click', function() {
        seedInput.value = Math.floor(Math.random() * 2147483647);
    });

    // Generate button (uses current seed)
    generateBtn.addEventListener('click', generatePattern);

    // Random + Generate button
    randomGenerateBtn.addEventListener('click', function() {
        seedInput.value = '';
        generatePattern();
    });

    // Download button
    downloadBtn.addEventListener('click', downloadPattern);

    // --- Mobile controls drawer ---
    if (settingsToggle) {
        settingsToggle.addEventListener('click', toggleControls);
    }
    if (controlsBackdrop) {
        controlsBackdrop.addEventListener('click', closeControls);
    }

    function toggleControls() {
        controlsPanel.classList.toggle('open');
        if (controlsBackdrop) controlsBackdrop.classList.toggle('active');
    }

    function closeControls() {
        controlsPanel.classList.remove('open');
        if (controlsBackdrop) controlsBackdrop.classList.remove('active');
    }

    function closeControlsIfMobile() {
        if (window.innerWidth <= 800) closeControls();
    }

    // --- Touch gestures on preview ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;

    previewContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    previewContainer.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        // Swipe detection (horizontal swipe > 60px, within 500ms)
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed < 500) {
            e.preventDefault();
            seedInput.value = '';
            generatePattern();
            return;
        }

        // Double-tap to toggle fullscreen (two taps within 300ms)
        const now = Date.now();
        if (now - lastTapTime < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            e.preventDefault();
            toggleFullscreen();
            lastTapTime = 0;
            return;
        }
        lastTapTime = now;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.target.matches('input, select, textarea')) return;

        if (e.key === 'Enter') {
            generatePattern();
        } else if (e.key === ' ') {
            e.preventDefault();
            if (autoModeCheckbox.checked) {
                autoModeCheckbox.checked = false;
                autoIntervalSlider.disabled = true;
                stopAutoPlay();
            }
            if (tunnelEffect) {
                tunnelEffect.stop();
                tunnelEffect = null;
                if (currentSvgData) svgContainer.innerHTML = currentSvgData;
                document.getElementById('kaleidoscope-animate').checked = false;
            }
        }
    });

    // Current SVG data for download
    let currentSvgData = null;
    let currentSeed = null;
    let autoPlayTimer = null;

    // Auto-play interval slider
    autoIntervalSlider.addEventListener('input', function() {
        autoIntervalValue.textContent = this.value + 's';
        if (autoModeCheckbox.checked) startAutoPlay();
    });

    // Auto-play toggle
    autoModeCheckbox.addEventListener('change', function() {
        autoIntervalSlider.disabled = !this.checked;
        if (this.checked) startAutoPlay();
        else stopAutoPlay();
    });

    // --- Fullscreen ---
    let fauxFullscreen = false;

    fullscreenBtn.addEventListener('click', function() {
        toggleFullscreen();
    });

    function toggleFullscreen() {
        const isFS = document.fullscreenElement || document.webkitFullscreenElement || fauxFullscreen;
        if (isFS) exitFullscreen();
        else enterFullscreen();
    }

    function enterFullscreen() {
        if (isIOS) {
            fauxFullscreen = true;
            previewContainer.classList.add('faux-fullscreen');
            document.body.classList.add('fullscreen-active');
            handleFullscreenEnter();
        } else if (previewContainer.requestFullscreen) {
            previewContainer.requestFullscreen();
        } else if (previewContainer.webkitRequestFullscreen) {
            previewContainer.webkitRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (fauxFullscreen) {
            fauxFullscreen = false;
            previewContainer.classList.remove('faux-fullscreen');
            document.body.classList.remove('fullscreen-active');
            handleFullscreenExit();
        } else if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        }
    }

    // Faux-fullscreen close button
    const fsCloseBtn = document.getElementById('fs-close-btn');
    if (fsCloseBtn) {
        fsCloseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            exitFullscreen();
        });
    }

    function handleFullscreenChange() {
        const isFS = document.fullscreenElement || document.webkitFullscreenElement;
        if (isFS) handleFullscreenEnter();
        else handleFullscreenExit();
    }

    function handleFullscreenEnter() {
        setTimeout(function() {
            if (tunnelEffect) {
                tunnelEffect.resize();
            } else if (currentSvgData) {
                renderSvgToFullscreenCanvas();
            }
        }, 150);
    }

    function handleFullscreenExit() {
        if (fullscreenCanvas) {
            fullscreenCanvas.remove();
            fullscreenCanvas = null;
        }
        if (currentSvgData && !tunnelEffect) {
            svgContainer.innerHTML = currentSvgData;
        }
    }

    function renderSvgToFullscreenCanvas() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        fullscreenCanvas = document.createElement('canvas');
        fullscreenCanvas.style.position = 'fixed';
        fullscreenCanvas.style.top = '0';
        fullscreenCanvas.style.left = '0';
        fullscreenCanvas.style.width = viewportWidth + 'px';
        fullscreenCanvas.style.height = viewportHeight + 'px';
        fullscreenCanvas.style.zIndex = '9999';
        fullscreenCanvas.width = viewportWidth * dpr;
        fullscreenCanvas.height = viewportHeight * dpr;

        const ctx = fullscreenCanvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([currentSvgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
            const scale = Math.max(viewportWidth / img.width, viewportHeight / img.height);
            const scaledWidth = img.width * scale * dpr;
            const scaledHeight = img.height * scale * dpr;
            const offsetX = (viewportWidth * dpr - scaledWidth) / 2;
            const offsetY = (viewportHeight * dpr - scaledHeight) / 2;
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
            URL.revokeObjectURL(url);
        };
        img.src = url;

        svgContainer.innerHTML = '';
        svgContainer.appendChild(fullscreenCanvas);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Exit fullscreen on click (native fullscreen only; faux uses close button)
    previewContainer.addEventListener('click', function() {
        if (document.fullscreenElement) document.exitFullscreen();
    });

    function startAutoPlay() {
        stopAutoPlay();
        const intervalMs = parseInt(autoIntervalSlider.value) * 1000;
        autoPlayTimer = setInterval(function() {
            seedInput.value = '';
            generatePattern();
        }, intervalMs);
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    // --- Client-side pattern generation (replaces server fetch) ---
    function generatePattern() {
        closeControlsIfMobile();

        const patternType = patternTypeSelect.value;
        const complexity = parseInt(document.getElementById('complexity').value);
        const paletteName = document.getElementById('palette').value;
        const size = 512;

        let seed = seedInput.value ? parseInt(seedInput.value) : null;
        if (seed === null || isNaN(seed)) {
            seed = Math.floor(Math.random() * 2147483647);
        }
        currentSeed = seed;
        seedInput.value = seed;

        // Get palette
        const palette = paletteName === 'random'
            ? ColorPalette.fromSeed(seed)
            : ColorPalette.preset(paletteName);

        const background = palette.background;

        // Show loading
        loading.classList.add('active');
        svgContainer.style.opacity = '0.5';

        // Use requestAnimationFrame so the loading indicator renders before heavy computation
        requestAnimationFrame(function() {
            try {
                let shapes = [];

                if (patternType === 'rosette') {
                    const n = parseInt(document.getElementById('rosette-n').value);
                    const symmetry = document.getElementById('rosette-symmetry').value;
                    const gen = new RosetteGenerator(n, symmetry, seed, palette);
                    shapes = gen.generate(size * 0.45, complexity, [size / 2, size / 2]);

                } else if (patternType === 'kaleidoscope') {
                    const triangleType = document.getElementById('kaleidoscope-triangle').value;
                    const iterations = parseInt(document.getElementById('kaleidoscope-iterations').value);
                    const gen = new KaleidoscopeGenerator(triangleType, seed, palette);
                    shapes = gen.generate(size * 0.48, complexity, iterations, [size / 2, size / 2]);

                } else if (patternType === 'wallpaper') {
                    const group = document.getElementById('wallpaper-group').value;
                    const repeat = parseInt(document.getElementById('wallpaper-repeat').value);
                    const cellSize = size / repeat;
                    const gen = new WallpaperGenerator(group, seed, palette);
                    const extra = 2;
                    shapes = gen.generate(cellSize, complexity, repeat + extra, repeat + extra,
                                          [-cellSize * 0.5, -cellSize * 0.5]);

                } else if (patternType === 'frieze') {
                    const group = document.getElementById('frieze-group').value;
                    const repetitions = parseInt(document.getElementById('frieze-repetitions').value);
                    const cellWidth = size / repetitions;
                    const cellHeight = size * 0.15;
                    const gen = new FriezeGenerator(group, seed, palette);
                    shapes = gen.generate(cellWidth, cellHeight, complexity, repetitions,
                                          [0, (size - cellHeight) / 2]);
                }

                // Render to SVG
                const renderer = new SVGRenderer(size, size, background);
                const svgText = renderer.render(shapes,
                    `Generated ${patternType.charAt(0).toUpperCase() + patternType.slice(1)} Pattern`);
                currentSvgData = svgText;

                // Clean up tunnel
                if (tunnelEffect) {
                    tunnelEffect.destroy();
                    tunnelEffect = null;
                }

                // Check 3D tunnel
                const use3D = patternType === 'kaleidoscope' &&
                              document.getElementById('kaleidoscope-animate').checked;

                if (use3D && window.KaleidoscopeTunnel) {
                    svgContainer.innerHTML = '';
                    const speed = parseFloat(document.getElementById('kaleidoscope-speed').value);
                    tunnelEffect = new KaleidoscopeTunnel(svgContainer, svgText);
                    tunnelEffect.setSpeed(speed);
                    document.getElementById('kaleidoscope-speed').onchange = function() {
                        if (tunnelEffect) tunnelEffect.setSpeed(parseFloat(this.value));
                    };
                } else {
                    const isFS = document.fullscreenElement || document.webkitFullscreenElement || fauxFullscreen;
                    if (isFS) {
                        renderSvgToFullscreenCanvas();
                    } else {
                        svgContainer.innerHTML = svgText;
                    }
                }

                currentSeedDisplay.textContent = currentSeed || 'unknown';

            } catch (error) {
                console.error('Error generating pattern:', error);
                svgContainer.innerHTML = `<p style="color: red; padding: 20px;">Error: ${error.message}</p>`;
            } finally {
                loading.classList.remove('active');
                svgContainer.style.opacity = '1';
            }
        });
    }

    function downloadPattern() {
        if (!currentSvgData) {
            alert('Please generate a pattern first.');
            return;
        }
        const blob = new Blob([currentSvgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pattern_${currentSeed || 'unknown'}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Generate initial pattern
    generatePattern();
});
