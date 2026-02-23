// Primitive shapes for geometric pattern generation.
// Each shape can be transformed and rendered to SVG.

class Style {
    constructor(stroke = '#000000', strokeWidth = 1.0, fill = null, opacity = 1.0) {
        this.stroke = stroke;
        this.strokeWidth = strokeWidth;
        this.fill = fill;
        this.opacity = opacity;
    }

    toSvgAttrs() {
        const attrs = [];
        attrs.push(this.stroke ? `stroke="${this.stroke}"` : 'stroke="none"');
        attrs.push(`stroke-width="${this.strokeWidth}"`);
        attrs.push(this.fill ? `fill="${this.fill}"` : 'fill="none"');
        if (this.opacity < 1.0) attrs.push(`opacity="${this.opacity}"`);
        return attrs.join(' ');
    }
}

class Shape {
    constructor(style = null) {
        this.style = style || new Style();
    }
    transform(t) { throw new Error('Not implemented'); }
    toSvg() { throw new Error('Not implemented'); }
    getBounds() { throw new Error('Not implemented'); }
}

class Line extends Shape {
    constructor(x1, y1, x2, y2, style = null) {
        super(style);
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
    }
    transform(t) {
        const [nx1, ny1] = t.apply(this.x1, this.y1);
        const [nx2, ny2] = t.apply(this.x2, this.y2);
        return new Line(nx1, ny1, nx2, ny2, this.style);
    }
    toSvg() {
        return `<line x1="${this.x1.toFixed(3)}" y1="${this.y1.toFixed(3)}" x2="${this.x2.toFixed(3)}" y2="${this.y2.toFixed(3)}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        return [Math.min(this.x1, this.x2), Math.min(this.y1, this.y2),
                Math.max(this.x1, this.x2), Math.max(this.y1, this.y2)];
    }
}

class Circle extends Shape {
    constructor(cx, cy, r, style = null) {
        super(style);
        this.cx = cx; this.cy = cy; this.r = r;
    }
    transform(t) {
        const [ncx, ncy] = t.apply(this.cx, this.cy);
        const scale = Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
        return new Circle(ncx, ncy, this.r * scale, this.style);
    }
    toSvg() {
        return `<circle cx="${this.cx.toFixed(3)}" cy="${this.cy.toFixed(3)}" r="${this.r.toFixed(3)}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        return [this.cx - this.r, this.cy - this.r, this.cx + this.r, this.cy + this.r];
    }
}

class Arc extends Shape {
    constructor(cx, cy, r, startAngle, endAngle, style = null) {
        super(style);
        this.cx = cx; this.cy = cy; this.r = r;
        this.startAngle = startAngle; this.endAngle = endAngle;
    }
    transform(t) {
        const [ncx, ncy] = t.apply(this.cx, this.cy);
        const scale = Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
        const rotation = Math.atan2(t.b, t.a);
        const det = t.a * t.d - t.b * t.c;
        let newStart, newEnd;
        if (det < 0) {
            newStart = rotation - this.endAngle;
            newEnd = rotation - this.startAngle;
        } else {
            newStart = this.startAngle + rotation;
            newEnd = this.endAngle + rotation;
        }
        return new Arc(ncx, ncy, this.r * scale, newStart, newEnd, this.style);
    }
    toSvg() {
        const x1 = this.cx + this.r * Math.cos(this.startAngle);
        const y1 = this.cy + this.r * Math.sin(this.startAngle);
        const x2 = this.cx + this.r * Math.cos(this.endAngle);
        const y2 = this.cy + this.r * Math.sin(this.endAngle);
        const angleDiff = this.endAngle - this.startAngle;
        const largeArc = Math.abs(angleDiff) > Math.PI ? 1 : 0;
        const sweep = angleDiff > 0 ? 1 : 0;
        return `<path d="M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${this.r.toFixed(3)} ${this.r.toFixed(3)} 0 ${largeArc} ${sweep} ${x2.toFixed(3)} ${y2.toFixed(3)}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        return [this.cx - this.r, this.cy - this.r, this.cx + this.r, this.cy + this.r];
    }
}

class Bezier extends Shape {
    constructor(x1, y1, cx1, cy1, cx2, cy2, x2, y2, style = null) {
        super(style);
        this.x1 = x1; this.y1 = y1;
        this.cx1 = cx1; this.cy1 = cy1;
        this.cx2 = cx2; this.cy2 = cy2;
        this.x2 = x2; this.y2 = y2;
    }
    transform(t) {
        const [nx1, ny1] = t.apply(this.x1, this.y1);
        const [ncx1, ncy1] = t.apply(this.cx1, this.cy1);
        const [ncx2, ncy2] = t.apply(this.cx2, this.cy2);
        const [nx2, ny2] = t.apply(this.x2, this.y2);
        return new Bezier(nx1, ny1, ncx1, ncy1, ncx2, ncy2, nx2, ny2, this.style);
    }
    toSvg() {
        return `<path d="M ${this.x1.toFixed(3)} ${this.y1.toFixed(3)} C ${this.cx1.toFixed(3)} ${this.cy1.toFixed(3)}, ${this.cx2.toFixed(3)} ${this.cy2.toFixed(3)}, ${this.x2.toFixed(3)} ${this.y2.toFixed(3)}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        const xs = [this.x1, this.cx1, this.cx2, this.x2];
        const ys = [this.y1, this.cy1, this.cy2, this.y2];
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
}

class QuadraticBezier extends Shape {
    constructor(x1, y1, cx, cy, x2, y2, style = null) {
        super(style);
        this.x1 = x1; this.y1 = y1;
        this.cx = cx; this.cy = cy;
        this.x2 = x2; this.y2 = y2;
    }
    transform(t) {
        const [nx1, ny1] = t.apply(this.x1, this.y1);
        const [ncx, ncy] = t.apply(this.cx, this.cy);
        const [nx2, ny2] = t.apply(this.x2, this.y2);
        return new QuadraticBezier(nx1, ny1, ncx, ncy, nx2, ny2, this.style);
    }
    toSvg() {
        return `<path d="M ${this.x1.toFixed(3)} ${this.y1.toFixed(3)} Q ${this.cx.toFixed(3)} ${this.cy.toFixed(3)}, ${this.x2.toFixed(3)} ${this.y2.toFixed(3)}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        const xs = [this.x1, this.cx, this.x2];
        const ys = [this.y1, this.cy, this.y2];
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
}

class Polygon extends Shape {
    constructor(points, style = null) {
        super(style);
        this.points = points;
    }
    transform(t) {
        return new Polygon(t.applyPoints(this.points), this.style);
    }
    toSvg() {
        const pts = this.points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
        return `<polygon points="${pts}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        const xs = this.points.map(p => p[0]);
        const ys = this.points.map(p => p[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
}

class Polyline extends Shape {
    constructor(points, style = null) {
        super(style);
        this.points = points;
    }
    transform(t) {
        return new Polyline(t.applyPoints(this.points), this.style);
    }
    toSvg() {
        const pts = this.points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
        return `<polyline points="${pts}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        const xs = this.points.map(p => p[0]);
        const ys = this.points.map(p => p[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
}

class PathShape extends Shape {
    constructor(d, style = null) {
        super(style);
        this.d = d;
    }
    transform(t) {
        return new TransformedShape(this, t);
    }
    toSvg() {
        return `<path d="${this.d}" ${this.style.toSvgAttrs()}/>`;
    }
    getBounds() {
        return [0, 0, 100, 100];
    }
}

class TransformedShape extends Shape {
    constructor(shape, transform) {
        super(shape.style);
        this.shape = shape;
        this._transform = transform;
    }
    transform(t) {
        return new TransformedShape(this.shape, t.compose(this._transform));
    }
    toSvg() {
        const inner = this.shape.toSvg();
        if (inner.startsWith('<')) {
            const tagEnd = inner.indexOf(' ');
            return `${inner.slice(0, tagEnd)} transform="${this._transform.toSvgMatrix()}"${inner.slice(tagEnd)}`;
        }
        return inner;
    }
    getBounds() {
        const bounds = this.shape.getBounds();
        const corners = [
            [bounds[0], bounds[1]], [bounds[2], bounds[1]],
            [bounds[0], bounds[3]], [bounds[2], bounds[3]]
        ];
        const transformed = this._transform.applyPoints(corners);
        const xs = transformed.map(p => p[0]);
        const ys = transformed.map(p => p[1]);
        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
}

class Group extends Shape {
    constructor(shapes = [], style = null) {
        super(style);
        this.shapes = shapes;
    }
    add(shape) {
        this.shapes.push(shape);
        return this;
    }
    transform(t) {
        return new Group(this.shapes.map(s => s.transform(t)), this.style);
    }
    toSvg() {
        const inner = this.shapes.map(s => s.toSvg()).join('\n  ');
        return `<g>\n  ${inner}\n</g>`;
    }
    getBounds() {
        if (!this.shapes.length) return [0, 0, 0, 0];
        const bounds = this.shapes.map(s => s.getBounds());
        return [
            Math.min(...bounds.map(b => b[0])),
            Math.min(...bounds.map(b => b[1])),
            Math.max(...bounds.map(b => b[2])),
            Math.max(...bounds.map(b => b[3]))
        ];
    }
}
