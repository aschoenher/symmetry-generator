// WebGL Kaleidoscope Tunnel Effect
// Maps the kaleidoscope pattern onto a 3D cone for infinite zoom effect

class KaleidoscopeTunnel {
    constructor(container, svgContent) {
        this.container = container;
        this.svgContent = svgContent;
        this.animationId = null;
        this.time = 0;
        this.speed = 1.0;
        this.aspectRatio = 1.0;

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        // Get WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Create shaders and program
        this.createShaders();
        this.createGeometry();
        this.loadTexture();
    }

    resize() {
        // Check if in fullscreen mode
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        const dpr = window.devicePixelRatio || 1;

        let width, height, cssWidth, cssHeight;
        if (isFullscreen) {
            // Use viewport dimensions for fullscreen
            cssWidth = window.innerWidth;
            cssHeight = window.innerHeight;
        } else {
            // Use container dimensions
            const rect = this.container.getBoundingClientRect();
            cssWidth = rect.width;
            cssHeight = rect.height;
        }

        width = cssWidth * dpr;
        height = cssHeight * dpr;

        // Store aspect ratio for shader
        this.aspectRatio = cssWidth / cssHeight;

        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;

        // Update canvas CSS size for fullscreen
        if (isFullscreen) {
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = cssWidth + 'px';
            this.canvas.style.height = cssHeight + 'px';
            this.canvas.style.zIndex = '9999';
        }

        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
        }
    }

    createShaders() {
        const gl = this.gl;

        // Vertex shader - creates a cone tunnel
        const vsSource = `
            attribute vec2 aPosition;
            varying vec2 vUv;

            void main() {
                vUv = aPosition * 0.5 + 0.5;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;

        // Fragment shader - Three-mirror kaleidoscope (equilateral triangle)
        // Based on Demeulenaere's paper "Simulation of a particular reflexion group"
        // Creates infinite tiling pattern using triangular fundamental domain
        const fsSource = `
            precision highp float;

            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform float uSpeed;
            uniform float uAspectRatio;

            #define PI 3.14159265359
            #define SQRT3 1.73205080757

            // Reflect point p across line from origin with direction d
            vec2 reflectAcrossLine(vec2 p, vec2 d) {
                vec2 n = vec2(-d.y, d.x); // perpendicular
                return p - 2.0 * dot(p, n) * n;
            }

            void main() {
                // Center coordinates and apply aspect ratio
                vec2 uv = vUv - 0.5;
                uv.x *= uAspectRatio;

                // Scale for tiling - each hex cell size
                float scale = 0.35;
                vec2 p = uv / scale;

                // Animation: gentle drift of the view
                p += vec2(
                    sin(uTime * uSpeed * 0.02) * 0.15,
                    cos(uTime * uSpeed * 0.025) * 0.15
                );

                // === HEXAGONAL TILING ===
                // Convert to axial hex coordinates
                // Hex grid with pointy-top orientation
                float q = (SQRT3/3.0 * p.x - 1.0/3.0 * p.y);
                float r = (2.0/3.0 * p.y);

                // Round to nearest hex center
                float x = q;
                float z = r;
                float y = -x - z;

                float rx = floor(x + 0.5);
                float ry = floor(y + 0.5);
                float rz = floor(z + 0.5);

                // Fix rounding errors
                float dx = abs(rx - x);
                float dy = abs(ry - y);
                float dz = abs(rz - z);

                if (dx > dy && dx > dz) {
                    rx = -ry - rz;
                } else if (dy > dz) {
                    ry = -rx - rz;
                } else {
                    rz = -rx - ry;
                }

                // Get position within hex cell
                vec2 hexCenter = vec2(
                    SQRT3 * rx + SQRT3/2.0 * rz,
                    1.5 * rz
                );
                vec2 local = p - hexCenter;

                // === TRIANGULAR SUBDIVISION ===
                // Divide hexagon into 6 equilateral triangles
                // Each triangle is further divided by reflections

                // Get angle to determine which sextant we're in
                float angle = atan(local.y, local.x);
                angle = mod(angle + PI, 2.0 * PI) - PI; // normalize to [-PI, PI]

                // Sextant index (0-5), each is PI/3 wide
                float sextant = floor((angle + PI) / (PI / 3.0));
                sextant = mod(sextant, 6.0);

                // Rotate to align with first sextant
                float rotAngle = -sextant * PI / 3.0;
                float c = cos(rotAngle);
                float s = sin(rotAngle);
                vec2 rotated = vec2(
                    c * local.x - s * local.y,
                    s * local.x + c * local.y
                );

                // Now we're in first sextant (0 to PI/3)
                // Triangle vertices: center (0,0), and two edges

                // Mirror across the angle bisector (PI/6 line) if needed
                float localAngle = atan(rotated.y, rotated.x);
                if (localAngle > PI / 6.0) {
                    // Reflect across PI/6 line
                    vec2 bisector = vec2(cos(PI/6.0), sin(PI/6.0));
                    rotated = reflectAcrossLine(rotated, bisector);
                }

                // Now in fundamental domain: triangle from center to edge
                // Map to texture coordinates

                // The fundamental domain is a 30-60-90 triangle
                // Map it to sample from the texture

                // Convert back to texture coordinates
                // Scale and center in texture space
                float radius = length(rotated);
                float texAngle = atan(rotated.y, rotated.x);

                // Map the triangular region to texture
                vec2 texCoord = vec2(
                    rotated.x * 1.2 + 0.5,
                    rotated.y * 1.2 + 0.5
                );

                // Boundary reflection to keep in valid range
                texCoord = max(min(texCoord, 2.0 - texCoord), -texCoord);
                texCoord = clamp(texCoord, 0.01, 0.99);

                vec4 color = texture2D(uTexture, texCoord);
                gl_FragColor = color;
            }
        `;

        // Compile shaders
        const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader program failed:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Get locations
        this.aPosition = gl.getAttribLocation(this.program, 'aPosition');
        this.uTexture = gl.getUniformLocation(this.program, 'uTexture');
        this.uTime = gl.getUniformLocation(this.program, 'uTime');
        this.uSpeed = gl.getUniformLocation(this.program, 'uSpeed');
        this.uAspectRatio = gl.getUniformLocation(this.program, 'uAspectRatio');
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createGeometry() {
        const gl = this.gl;

        // Full-screen quad
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    }

    loadTexture() {
        const gl = this.gl;

        // Create texture from SVG
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Placeholder while loading
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255]));

        // Convert SVG to image
        const img = new Image();
        const svgBlob = new Blob([this.svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            // Create a canvas to render SVG at higher resolution
            const renderCanvas = document.createElement('canvas');
            renderCanvas.width = 1024;
            renderCanvas.height = 1024;
            const ctx = renderCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 1024, 1024);

            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, renderCanvas);

            // Set texture parameters - use CLAMP to avoid edge artifacts
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Extract background color from rendered canvas
            const pixelData = ctx.getImageData(0, 0, 1, 1).data;
            this.bgColor = [pixelData[0] / 255, pixelData[1] / 255, pixelData[2] / 255];

            URL.revokeObjectURL(url);

            // Start animation
            this.animate();
        };

        img.src = url;
    }

    animate() {
        const gl = this.gl;

        this.time += 0.016; // ~60fps

        // Use extracted background color or white as fallback
        const bg = this.bgColor || [1, 1, 1];
        gl.clearColor(bg[0], bg[1], bg[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uTexture, 0);

        // Set uniforms
        gl.uniform1f(this.uTime, this.time);
        gl.uniform1f(this.uSpeed, this.speed);
        gl.uniform1f(this.uAspectRatio, this.aspectRatio || 1.0);

        // Bind geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.aPosition);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Export for use
window.KaleidoscopeTunnel = KaleidoscopeTunnel;
