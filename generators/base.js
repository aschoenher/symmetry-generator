// Base motif generator with seeded randomness.
// Creates random geometric shapes within a fundamental domain.

// Seedable PRNG (mulberry32)
class SeededRandom {
    constructor(seed) {
        this._state = seed | 0;
    }

    // Returns [0, 1)
    random() {
        let t = this._state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    uniform(a, b) {
        return a + this.random() * (b - a);
    }

    randint(a, b) {
        return a + Math.floor(this.random() * (b - a + 1));
    }

    choice(arr) {
        return arr[Math.floor(this.random() * arr.length)];
    }
}

// HSL to hex color conversion
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

class ColorPalette {
    constructor(colors, background = null) {
        this.colors = colors;
        this.background = background;
    }

    static fromSeed(seed, numColors = 5, harmony = null) {
        const rng = new SeededRandom(seed);
        const harmonies = ['analogous', 'complementary', 'triadic', 'split_complementary', 'monochromatic'];
        if (!harmony) harmony = harmonies[Math.floor(rng.random() * harmonies.length)];

        const baseHue = rng.random() * 360;
        const baseSat = rng.uniform(55, 85);
        const colors = [];

        if (harmony === 'monochromatic') {
            for (let i = 0; i < numColors; i++) {
                let sat = baseSat + rng.uniform(-15, 15);
                sat = Math.max(30, Math.min(95, sat));
                let light = 25 + (i / Math.max(1, numColors - 1)) * 50;
                light += rng.uniform(-5, 5);
                colors.push(hslToHex(baseHue, sat, light));
            }
        } else if (harmony === 'analogous') {
            const spread = rng.uniform(20, 40);
            for (let i = 0; i < numColors; i++) {
                const offset = (i - Math.floor(numColors / 2)) * spread / numColors;
                const hue = (baseHue + offset + 360) % 360;
                const sat = baseSat + rng.uniform(-10, 10);
                const light = rng.uniform(35, 65);
                colors.push(hslToHex(hue, sat, light));
            }
        } else if (harmony === 'complementary') {
            const hues = [baseHue, (baseHue + 180) % 360];
            for (let i = 0; i < numColors; i++) {
                const hue = (hues[i % 2] + rng.uniform(-10, 10) + 360) % 360;
                const sat = baseSat + rng.uniform(-10, 10);
                const light = 35 + Math.floor(i / 2) * 15 + rng.uniform(-5, 5);
                colors.push(hslToHex(hue, sat, light));
            }
        } else if (harmony === 'triadic') {
            const hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];
            for (let i = 0; i < numColors; i++) {
                const hue = (hues[i % 3] + rng.uniform(-8, 8) + 360) % 360;
                const sat = baseSat + rng.uniform(-10, 10);
                const light = 40 + Math.floor(i / 3) * 12 + rng.uniform(-5, 5);
                colors.push(hslToHex(hue, sat, light));
            }
        } else if (harmony === 'split_complementary') {
            const hues = [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
            for (let i = 0; i < numColors; i++) {
                const hue = (hues[i % 3] + rng.uniform(-8, 8) + 360) % 360;
                const sat = baseSat + rng.uniform(-10, 10);
                const light = 40 + Math.floor(i / 3) * 12 + rng.uniform(-5, 5);
                colors.push(hslToHex(hue, sat, light));
            }
        } else {
            // tetradic
            const hues = [baseHue, (baseHue + 60) % 360, (baseHue + 180) % 360, (baseHue + 240) % 360];
            for (let i = 0; i < numColors; i++) {
                const hue = (hues[i % 4] + rng.uniform(-8, 8) + 360) % 360;
                const sat = baseSat + rng.uniform(-10, 10);
                const light = 40 + Math.floor(i / 4) * 12 + rng.uniform(-5, 5);
                colors.push(hslToHex(hue, sat, light));
            }
        }

        const bgLight = rng.uniform(92, 98);
        const bgSat = rng.uniform(5, 20);
        const bg = hslToHex(baseHue, bgSat, bgLight);

        return new ColorPalette(colors, bg);
    }

    static preset(name) {
        const presets = {
            sunset:      new ColorPalette(['#ff6b35', '#ff8c61', '#ffd166', '#ef476f', '#9b2335'], '#fff5f0'),
            autumn:      new ColorPalette(['#d4a373', '#bc6c25', '#606c38', '#283618', '#dda15e'], '#fefae0'),
            coral:       new ColorPalette(['#ff6b6b', '#ee6c4d', '#f4a261', '#e9c46a', '#2a9d8f'], '#f0f9f7'),
            ocean:       new ColorPalette(['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8'], '#e8f4f8'),
            arctic:      new ColorPalette(['#5e60ce', '#6930c3', '#7b68ee', '#4ea8de', '#9d4edd'], '#f0f4ff'),
            twilight:    new ColorPalette(['#7400b8', '#6930c3', '#5e60ce', '#5390d9', '#4ea8de'], '#f5f0ff'),
            forest:      new ColorPalette(['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d'], '#f0fff4'),
            meadow:      new ColorPalette(['#606c38', '#283618', '#7c6a0a', '#dda15e', '#bc6c25'], '#fefae0'),
            earth:       new ColorPalette(['#5c4033', '#6f4e37', '#8b5a2b', '#a0785a', '#8b7355'], '#f5f0e8'),
            vibrant:     new ColorPalette(['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b'], '#ffffff'),
            neon:        new ColorPalette(['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'], '#f8f8ff'),
            pop:         new ColorPalette(['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'], '#ffffff'),
            berry:       new ColorPalette(['#4a0d4a', '#7b2d8e', '#9c4daa', '#c77dff', '#e0aaff'], '#fdf0ff'),
            wine:        new ColorPalette(['#590d22', '#800f2f', '#a4133c', '#c9184a', '#ff4d6d'], '#fff0f3'),
            sage:        new ColorPalette(['#4a5759', '#7d8471', '#9ca692', '#c2c5aa', '#e9edc9'], '#fefae0'),
            mono_blue:   new ColorPalette(['#03045e', '#023e8a', '#0077b6', '#0096c7', '#48cae4'], '#f0f8ff'),
            mono_green:  new ColorPalette(['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d'], '#f0fff4'),
            mono_purple: new ColorPalette(['#240046', '#3c096c', '#5a189a', '#7b2cbf', '#9d4edd'], '#faf0ff'),
            mono_gray:   new ColorPalette(['#212529', '#343a40', '#495057', '#6c757d', '#adb5bd'], '#f8f9fa'),
        };
        return presets[name] || presets.vibrant;
    }
}

class MotifGenerator {
    constructor(seed = null, palette = null) {
        this.seed = seed != null ? seed : Math.floor(Math.random() * 2147483647);
        this.rng = new SeededRandom(this.seed);
        this.palette = palette || ColorPalette.fromSeed(this.seed);
    }

    randomColor() {
        return this.rng.choice(this.palette.colors);
    }

    randomStyle(filled = null) {
        if (filled === null) filled = this.rng.random() > 0.5;
        const color = this.randomColor();
        if (filled) {
            return new Style(
                this.rng.random() > 0.3 ? color : null,
                this.rng.uniform(1.5, 4.0),
                color,
                this.rng.uniform(0.6, 1.0)
            );
        }
        return new Style(color, this.rng.uniform(2.0, 6.0), null, this.rng.uniform(0.7, 1.0));
    }

    generateInTriangle(p1, p2, p3, complexity = 5) {
        const shapes = [];
        for (let i = 0; i < complexity; i++) {
            const type = this.rng.choice(['line', 'arc', 'bezier', 'circle', 'polygon']);
            if (type === 'line') shapes.push(this._randomLineInTriangle(p1, p2, p3));
            else if (type === 'arc') shapes.push(this._randomArcInTriangle(p1, p2, p3));
            else if (type === 'bezier') shapes.push(this._randomBezierInTriangle(p1, p2, p3));
            else if (type === 'circle') shapes.push(this._randomCircleInTriangle(p1, p2, p3));
            else shapes.push(this._randomPolygonInTriangle(p1, p2, p3));
        }
        return shapes;
    }

    generateInRectangle(x, y, width, height, complexity = 5) {
        const shapes = [];
        for (let i = 0; i < complexity; i++) {
            const type = this.rng.choice(['line', 'arc', 'bezier', 'circle', 'polygon']);
            if (type === 'line') shapes.push(this._randomLineInRect(x, y, width, height));
            else if (type === 'arc') shapes.push(this._randomArcInRect(x, y, width, height));
            else if (type === 'bezier') shapes.push(this._randomBezierInRect(x, y, width, height));
            else if (type === 'circle') shapes.push(this._randomCircleInRect(x, y, width, height));
            else shapes.push(this._randomPolygonInRect(x, y, width, height));
        }
        return shapes;
    }

    generateInWedge(cx, cy, rInner, rOuter, angleStart, angleEnd, complexity = 5) {
        const shapes = [];
        for (let i = 0; i < complexity; i++) {
            const type = this.rng.choice(['line', 'arc', 'bezier', 'circle', 'polygon']);
            if (type === 'line') shapes.push(this._randomLineInWedge(cx, cy, rInner, rOuter, angleStart, angleEnd));
            else if (type === 'arc') shapes.push(this._randomArcInWedge(cx, cy, rInner, rOuter, angleStart, angleEnd));
            else if (type === 'bezier') shapes.push(this._randomBezierInWedge(cx, cy, rInner, rOuter, angleStart, angleEnd));
            else if (type === 'circle') shapes.push(this._randomCircleInWedge(cx, cy, rInner, rOuter, angleStart, angleEnd));
            else shapes.push(this._randomPolygonInWedge(cx, cy, rInner, rOuter, angleStart, angleEnd));
        }
        return shapes;
    }

    _pointInTriangle(p1, p2, p3) {
        let r1 = this.rng.random();
        let r2 = this.rng.random();
        if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
        const r3 = 1 - r1 - r2;
        return [r1 * p1[0] + r2 * p2[0] + r3 * p3[0],
                r1 * p1[1] + r2 * p2[1] + r3 * p3[1]];
    }

    _pointInRect(x, y, w, h) {
        return [x + this.rng.random() * w, y + this.rng.random() * h];
    }

    _pointInWedge(cx, cy, rIn, rOut, aStart, aEnd) {
        const r = Math.sqrt(this.rng.uniform(rIn * rIn, rOut * rOut));
        const angle = this.rng.uniform(aStart, aEnd);
        return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    }

    // Line generators
    _randomLineInTriangle(p1, p2, p3) {
        const pt1 = this._pointInTriangle(p1, p2, p3);
        const pt2 = this._pointInTriangle(p1, p2, p3);
        return new Line(pt1[0], pt1[1], pt2[0], pt2[1], this.randomStyle(false));
    }
    _randomLineInRect(x, y, w, h) {
        const pt1 = this._pointInRect(x, y, w, h);
        const pt2 = this._pointInRect(x, y, w, h);
        return new Line(pt1[0], pt1[1], pt2[0], pt2[1], this.randomStyle(false));
    }
    _randomLineInWedge(cx, cy, rIn, rOut, aS, aE) {
        const pt1 = this._pointInWedge(cx, cy, rIn, rOut, aS, aE);
        const pt2 = this._pointInWedge(cx, cy, rIn, rOut, aS, aE);
        return new Line(pt1[0], pt1[1], pt2[0], pt2[1], this.randomStyle(false));
    }

    // Arc generators
    _randomArcInTriangle(p1, p2, p3) {
        const center = this._pointInTriangle(p1, p2, p3);
        const maxR = Math.min(
            Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1]),
            Math.abs(p3[0] - p1[0]), Math.abs(p3[1] - p1[1])
        ) / 3;
        const r = this.rng.uniform(maxR * 0.35, maxR);
        const start = this.rng.uniform(0, 2 * Math.PI);
        const extent = this.rng.uniform(Math.PI / 4, Math.PI);
        return new Arc(center[0], center[1], r, start, start + extent, this.randomStyle(false));
    }
    _randomArcInRect(x, y, w, h) {
        const center = this._pointInRect(x, y, w, h);
        const maxR = Math.min(w, h) / 3;
        const r = this.rng.uniform(maxR * 0.35, maxR);
        const start = this.rng.uniform(0, 2 * Math.PI);
        const extent = this.rng.uniform(Math.PI / 4, Math.PI);
        return new Arc(center[0], center[1], r, start, start + extent, this.randomStyle(false));
    }
    _randomArcInWedge(cx, cy, rIn, rOut, aS, aE) {
        const center = this._pointInWedge(cx, cy, rIn, rOut, aS, aE);
        const maxR = (rOut - rIn) / 3;
        const r = this.rng.uniform(maxR * 0.35, Math.max(maxR, 2));
        const start = this.rng.uniform(0, 2 * Math.PI);
        const extent = this.rng.uniform(Math.PI / 4, Math.PI);
        return new Arc(center[0], center[1], r, start, start + extent, this.randomStyle(false));
    }

    // Bezier generators
    _randomBezierInTriangle(p1, p2, p3) {
        const pts = Array.from({length: 4}, () => this._pointInTriangle(p1, p2, p3));
        return new Bezier(pts[0][0], pts[0][1], pts[1][0], pts[1][1],
                          pts[2][0], pts[2][1], pts[3][0], pts[3][1], this.randomStyle(false));
    }
    _randomBezierInRect(x, y, w, h) {
        const pts = Array.from({length: 4}, () => this._pointInRect(x, y, w, h));
        return new Bezier(pts[0][0], pts[0][1], pts[1][0], pts[1][1],
                          pts[2][0], pts[2][1], pts[3][0], pts[3][1], this.randomStyle(false));
    }
    _randomBezierInWedge(cx, cy, rIn, rOut, aS, aE) {
        const pts = Array.from({length: 4}, () => this._pointInWedge(cx, cy, rIn, rOut, aS, aE));
        return new Bezier(pts[0][0], pts[0][1], pts[1][0], pts[1][1],
                          pts[2][0], pts[2][1], pts[3][0], pts[3][1], this.randomStyle(false));
    }

    // Circle generators
    _randomCircleInTriangle(p1, p2, p3) {
        const center = this._pointInTriangle(p1, p2, p3);
        const maxR = Math.min(
            Math.abs(p2[0] - p1[0]), Math.abs(p2[1] - p1[1]),
            Math.abs(p3[0] - p1[0]), Math.abs(p3[1] - p1[1])
        ) / 4;
        const r = this.rng.uniform(maxR * 0.3, maxR);
        return new Circle(center[0], center[1], r, this.randomStyle());
    }
    _randomCircleInRect(x, y, w, h) {
        const center = this._pointInRect(x, y, w, h);
        const maxR = Math.min(w, h) / 4;
        const r = this.rng.uniform(maxR * 0.3, maxR);
        return new Circle(center[0], center[1], r, this.randomStyle());
    }
    _randomCircleInWedge(cx, cy, rIn, rOut, aS, aE) {
        const center = this._pointInWedge(cx, cy, rIn, rOut, aS, aE);
        const maxR = (rOut - rIn) / 4;
        const r = this.rng.uniform(maxR * 0.3, Math.max(maxR, 2));
        return new Circle(center[0], center[1], r, this.randomStyle());
    }

    // Polygon generators
    _randomPolygonInTriangle(p1, p2, p3) {
        const n = this.rng.randint(3, 6);
        const pts = Array.from({length: n}, () => this._pointInTriangle(p1, p2, p3));
        const cx = pts.reduce((s, p) => s + p[0], 0) / n;
        const cy = pts.reduce((s, p) => s + p[1], 0) / n;
        pts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
        return new Polygon(pts, this.randomStyle());
    }
    _randomPolygonInRect(x, y, w, h) {
        const n = this.rng.randint(3, 6);
        const pts = Array.from({length: n}, () => this._pointInRect(x, y, w, h));
        const cx = pts.reduce((s, p) => s + p[0], 0) / n;
        const cy = pts.reduce((s, p) => s + p[1], 0) / n;
        pts.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
        return new Polygon(pts, this.randomStyle());
    }
    _randomPolygonInWedge(cx, cy, rIn, rOut, aS, aE) {
        const n = this.rng.randint(3, 6);
        const pts = Array.from({length: n}, () => this._pointInWedge(cx, cy, rIn, rOut, aS, aE));
        const centerX = pts.reduce((s, p) => s + p[0], 0) / n;
        const centerY = pts.reduce((s, p) => s + p[1], 0) / n;
        pts.sort((a, b) => Math.atan2(a[1] - centerY, a[0] - centerX) - Math.atan2(b[1] - centerY, b[0] - centerX));
        return new Polygon(pts, this.randomStyle());
    }
}
