// 2D Transformation matrices and operations.
// Uses homogeneous coordinates for composable transforms.

class Transform {
    constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
        this.a = a; // scale x
        this.b = b; // skew y
        this.c = c; // skew x
        this.d = d; // scale y
        this.e = e; // translate x
        this.f = f; // translate y
    }

    apply(x, y) {
        return [
            this.a * x + this.c * y + this.e,
            this.b * x + this.d * y + this.f
        ];
    }

    applyPoints(points) {
        return points.map(([x, y]) => this.apply(x, y));
    }

    compose(other) {
        return new Transform(
            this.a * other.a + this.c * other.b,
            this.b * other.a + this.d * other.b,
            this.a * other.c + this.c * other.d,
            this.b * other.c + this.d * other.d,
            this.a * other.e + this.c * other.f + this.e,
            this.b * other.e + this.d * other.f + this.f
        );
    }

    inverse() {
        const det = this.a * this.d - this.b * this.c;
        if (Math.abs(det) < 1e-10) throw new Error("Transform is not invertible");
        const inv = 1.0 / det;
        return new Transform(
            this.d * inv,
            -this.b * inv,
            -this.c * inv,
            this.a * inv,
            (this.c * this.f - this.d * this.e) * inv,
            (this.b * this.e - this.a * this.f) * inv
        );
    }

    toSvgMatrix() {
        return `matrix(${this.a.toFixed(6)},${this.b.toFixed(6)},${this.c.toFixed(6)},${this.d.toFixed(6)},${this.e.toFixed(6)},${this.f.toFixed(6)})`;
    }

    static identity() {
        return new Transform();
    }
}

function tfRotate(angle, cx = 0, cy = 0) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    if (cx === 0 && cy === 0) {
        return new Transform(cosA, sinA, -sinA, cosA);
    }
    return new Transform(
        cosA, sinA, -sinA, cosA,
        cx - cosA * cx + sinA * cy,
        cy - sinA * cx - cosA * cy
    );
}

function tfReflect(angle = 0, px = 0, py = 0) {
    const cos2a = Math.cos(2 * angle);
    const sin2a = Math.sin(2 * angle);
    const t = new Transform(cos2a, sin2a, sin2a, -cos2a);
    if (px === 0 && py === 0) return t;
    return tfTranslate(px, py).compose(t).compose(tfTranslate(-px, -py));
}

function tfReflectAcrossLine(x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    return tfReflect(angle, x1, y1);
}

function tfTranslate(tx, ty) {
    return new Transform(1, 0, 0, 1, tx, ty);
}

function tfScale(sx, sy = null, cx = 0, cy = 0) {
    if (sy === null) sy = sx;
    if (cx === 0 && cy === 0) return new Transform(sx, 0, 0, sy);
    return new Transform(sx, 0, 0, sy, cx - sx * cx, cy - sy * cy);
}

function tfCompose(...transforms) {
    if (transforms.length === 0) return Transform.identity();
    let result = transforms[transforms.length - 1];
    for (let i = transforms.length - 2; i >= 0; i--) {
        result = transforms[i].compose(result);
    }
    return result;
}

function tfGlideReflect(angle, distance, px = 0, py = 0) {
    const refl = tfReflect(angle, px, py);
    const glide = tfTranslate(distance * Math.cos(angle), distance * Math.sin(angle));
    return glide.compose(refl);
}
