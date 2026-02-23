// Wallpaper group pattern generator.
// Implements all 17 wallpaper groups (2D crystallographic groups).

class WallpaperGenerator {
    static GROUPS = [
        'p1', 'p2', 'pm', 'pg', 'cm', 'pmm', 'pmg', 'pgg', 'cmm',
        'p4', 'p4m', 'p4g', 'p3', 'p3m1', 'p31m', 'p6', 'p6m'
    ];

    constructor(group = 'p6m', seed = null, palette = null) {
        this.group = group;
        this.motifGen = new MotifGenerator(seed, palette);
    }

    get palette() { return this.motifGen.palette; }

    _getLatticeVectors(cellSize) {
        const g = this.group;
        if (g === 'p1' || g === 'p2')
            return [[cellSize, 0], [cellSize * 0.3, cellSize * 0.9]];
        if (g === 'pm' || g === 'pg' || g === 'pmm' || g === 'pmg' || g === 'pgg')
            return [[cellSize, 0], [0, cellSize]];
        if (g === 'cm' || g === 'cmm')
            return [[cellSize, 0], [cellSize / 2, cellSize * 0.866]];
        if (g === 'p4' || g === 'p4m' || g === 'p4g')
            return [[cellSize, 0], [0, cellSize]];
        if (g === 'p3' || g === 'p3m1' || g === 'p31m' || g === 'p6' || g === 'p6m')
            return [[cellSize, 0], [cellSize / 2, cellSize * Math.sqrt(3) / 2]];
        return [[cellSize, 0], [0, cellSize]];
    }

    _getFundamentalDomain(cellSize) {
        const g = this.group;
        const [v1, v2] = this._getLatticeVectors(cellSize);
        const s3 = Math.sqrt(3);

        if (g === 'p1') return ['rect', [0, 0, v1[0], v2[1] !== 0 ? v2[1] : cellSize]];
        if (g === 'p2') return ['rect', [0, 0, v1[0] / 2, v2[1] !== 0 ? v2[1] : cellSize]];
        if (g === 'pm' || g === 'pg') return ['rect', [0, 0, cellSize / 2, cellSize]];
        if (g === 'cm') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 4, cellSize * 0.433]]];
        if (g === 'pmm') return ['rect', [0, 0, cellSize / 2, cellSize / 2]];
        if (g === 'pmg' || g === 'pgg') return ['rect', [0, 0, cellSize / 2, cellSize / 2]];
        if (g === 'cmm') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 4, cellSize * 0.433 / 2]]];
        if (g === 'p4') return ['rect', [0, 0, cellSize / 2, cellSize / 2]];
        if (g === 'p4m') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 2, cellSize / 2]]];
        if (g === 'p4g') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 4, cellSize / 4]]];
        if (g === 'p3') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 4, cellSize * s3 / 4]]];
        if (g === 'p3m1' || g === 'p31m') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 4, cellSize * s3 / 4]]];
        if (g === 'p6') return ['triangle', [[0, 0], [cellSize / 2, 0], [cellSize / 4, cellSize * s3 / 4]]];
        if (g === 'p6m') return ['triangle', [[0, 0], [cellSize / 4, 0], [cellSize / 4, cellSize * s3 / 4]]];
        return ['rect', [0, 0, cellSize, cellSize]];
    }

    _generateUnitCell(cellSize, complexity) {
        const g = this.group;
        const [domainType, domainParams] = this._getFundamentalDomain(cellSize);
        const s3 = Math.sqrt(3);

        let motif;
        if (domainType === 'rect') {
            const [x, y, w, h] = domainParams;
            motif = this.motifGen.generateInRectangle(x, y, w, h, complexity);
        } else {
            const [p1, p2, p3] = domainParams;
            motif = this.motifGen.generateInTriangle(p1, p2, p3, complexity);
        }

        let allShapes = [...motif];

        if (g === 'p1') {
            // no additional symmetry
        } else if (g === 'p2') {
            const rot180 = tfRotate(Math.PI, cellSize / 2, cellSize / 2);
            allShapes.push(...motif.map(s => s.transform(rot180)));
        } else if (g === 'pm') {
            const refl = tfReflect(Math.PI / 2, cellSize / 2, 0);
            allShapes.push(...motif.map(s => s.transform(refl)));
        } else if (g === 'pg') {
            const glide = tfGlideReflect(Math.PI / 2, cellSize / 2, cellSize / 2, 0);
            allShapes.push(...motif.map(s => s.transform(glide)));
        } else if (g === 'cm') {
            const refl = tfReflect(Math.PI / 2, cellSize / 4, 0);
            allShapes.push(...motif.map(s => s.transform(refl)));
            const half = allShapes.length;
            const tr = tfTranslate(cellSize / 2, cellSize * 0.433);
            allShapes.push(...allShapes.slice(0, half).map(s => s.transform(tr)));
        } else if (g === 'pmm') {
            const reflH = tfReflect(0, 0, cellSize / 2);
            const reflV = tfReflect(Math.PI / 2, cellSize / 2, 0);
            const temp = [...motif, ...motif.map(s => s.transform(reflV))];
            allShapes = [...temp, ...temp.map(s => s.transform(reflH))];
        } else if (g === 'pmg') {
            const reflV = tfReflect(Math.PI / 2, cellSize / 2, 0);
            const temp = [...motif, ...motif.map(s => s.transform(reflV))];
            const glide = tfGlideReflect(0, cellSize / 2, 0, cellSize / 4);
            allShapes = [...temp, ...temp.map(s => s.transform(glide))];
        } else if (g === 'pgg') {
            const glideH = tfGlideReflect(0, cellSize / 2, 0, cellSize / 4);
            const glideV = tfGlideReflect(Math.PI / 2, cellSize / 2, cellSize / 4, 0);
            const temp = [...motif, ...motif.map(s => s.transform(glideV))];
            allShapes = [...temp, ...temp.map(s => s.transform(glideH))];
        } else if (g === 'cmm') {
            const reflH = tfReflect(0, 0, cellSize * 0.433 / 2);
            const reflV = tfReflect(Math.PI / 2, cellSize / 4, 0);
            const temp = [...motif, ...motif.map(s => s.transform(reflV))];
            const withH = [...temp, ...temp.map(s => s.transform(reflH))];
            const tr = tfTranslate(cellSize / 2, cellSize * 0.433);
            allShapes = [...withH, ...withH.map(s => s.transform(tr))];
        } else if (g === 'p4') {
            const cx = cellSize / 2, cy = cellSize / 2;
            allShapes = [];
            for (let i = 0; i < 4; i++) {
                const rot = tfRotate(i * Math.PI / 2, cx, cy);
                allShapes.push(...motif.map(s => s.transform(rot)));
            }
        } else if (g === 'p4m') {
            const cx = cellSize / 2, cy = cellSize / 2;
            const refl = tfReflect(0, cx, cy);
            const temp = [...motif, ...motif.map(s => s.transform(refl))];
            allShapes = [];
            for (let i = 0; i < 4; i++) {
                const rot = tfRotate(i * Math.PI / 2, cx, cy);
                allShapes.push(...temp.map(s => s.transform(rot)));
            }
        } else if (g === 'p4g') {
            const cx = cellSize / 2, cy = cellSize / 2;
            const refl = tfReflect(Math.PI / 4, cx, cy);
            const temp = [...motif, ...motif.map(s => s.transform(refl))];
            allShapes = [];
            for (let i = 0; i < 4; i++) {
                const rot = tfRotate(i * Math.PI / 2, cx, cy);
                allShapes.push(...temp.map(s => s.transform(rot)));
            }
        } else if (g === 'p3') {
            const cx = cellSize / 2, cy = cellSize * s3 / 6;
            allShapes = [];
            for (let i = 0; i < 3; i++) {
                const rot = tfRotate(i * 2 * Math.PI / 3, cx, cy);
                allShapes.push(...motif.map(s => s.transform(rot)));
            }
        } else if (g === 'p3m1') {
            const cx = cellSize / 2, cy = cellSize * s3 / 6;
            const refl = tfReflect(0, cx, cy);
            const temp = [...motif, ...motif.map(s => s.transform(refl))];
            allShapes = [];
            for (let i = 0; i < 3; i++) {
                const rot = tfRotate(i * 2 * Math.PI / 3, cx, cy);
                allShapes.push(...temp.map(s => s.transform(rot)));
            }
        } else if (g === 'p31m') {
            const cx = cellSize / 2, cy = cellSize * s3 / 6;
            const refl = tfReflect(Math.PI / 6, cx, cy);
            const temp = [...motif, ...motif.map(s => s.transform(refl))];
            allShapes = [];
            for (let i = 0; i < 3; i++) {
                const rot = tfRotate(i * 2 * Math.PI / 3, cx, cy);
                allShapes.push(...temp.map(s => s.transform(rot)));
            }
        } else if (g === 'p6') {
            const cx = cellSize / 2, cy = cellSize * s3 / 6;
            allShapes = [];
            for (let i = 0; i < 6; i++) {
                const rot = tfRotate(i * Math.PI / 3, cx, cy);
                allShapes.push(...motif.map(s => s.transform(rot)));
            }
        } else if (g === 'p6m') {
            const cx = cellSize / 2, cy = cellSize * s3 / 6;
            const refl = tfReflect(0, cx, cy);
            const temp = [...motif, ...motif.map(s => s.transform(refl))];
            allShapes = [];
            for (let i = 0; i < 6; i++) {
                const rot = tfRotate(i * Math.PI / 3, cx, cy);
                allShapes.push(...temp.map(s => s.transform(rot)));
            }
        }

        return allShapes;
    }

    generate(cellSize = 100, complexity = 5, repeatX = 4, repeatY = 4, offset = [0, 0]) {
        const [v1, v2] = this._getLatticeVectors(cellSize);
        const unitCell = this._generateUnitCell(cellSize, complexity);
        const allShapes = [];
        const [ox, oy] = offset;

        const maxXShift = Math.abs(v2[0]) * repeatY;
        const extraCols = v2[0] !== 0
            ? Math.ceil(maxXShift / Math.max(Math.abs(v1[0]), 0.01)) + 1
            : 0;

        for (let j = 0; j < repeatY; j++) {
            for (let i = -extraCols; i < repeatX; i++) {
                const tx = ox + i * v1[0] + j * v2[0];
                const ty = oy + i * v1[1] + j * v2[1];
                const tr = tfTranslate(tx, ty);
                for (const shape of unitCell) {
                    allShapes.push(shape.transform(tr));
                }
            }
        }

        return allShapes;
    }
}
