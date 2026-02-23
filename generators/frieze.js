// Frieze pattern generator.
// Implements all 7 frieze groups (1D crystallographic groups).

class FriezeGenerator {
    static GROUPS = ['p1', 'p11m', 'p1m1', 'p2', 'p2mm', 'p2mg', 'p2gg'];

    constructor(group = 'p2mm', seed = null, palette = null) {
        this.group = group;
        this.motifGen = new MotifGenerator(seed, palette);
    }

    get palette() { return this.motifGen.palette; }

    _getFundamentalDomain(cellWidth, cellHeight) {
        const g = this.group;
        if (g === 'p1') return [0, 0, cellWidth, cellHeight];
        if (g === 'p11m') return [0, 0, cellWidth, cellHeight / 2];
        if (g === 'p1m1') return [0, 0, cellWidth / 2, cellHeight];
        if (g === 'p2') return [0, 0, cellWidth / 2, cellHeight];
        if (g === 'p2mm') return [0, 0, cellWidth / 2, cellHeight / 2];
        if (g === 'p2mg') return [0, 0, cellWidth / 2, cellHeight / 2];
        if (g === 'p2gg') return [0, 0, cellWidth / 2, cellHeight / 2];
        return [0, 0, cellWidth, cellHeight];
    }

    _generateUnitCell(cellWidth, cellHeight, complexity) {
        const g = this.group;
        const [x, y, w, h] = this._getFundamentalDomain(cellWidth, cellHeight);
        const motif = this.motifGen.generateInRectangle(x, y, w, h, complexity);
        let allShapes = [...motif];

        if (g === 'p1') {
            // no additional symmetry
        } else if (g === 'p11m') {
            const reflH = tfReflect(0, 0, cellHeight / 2);
            allShapes.push(...motif.map(s => s.transform(reflH)));
        } else if (g === 'p1m1') {
            const reflV = tfReflect(Math.PI / 2, cellWidth / 2, 0);
            allShapes.push(...motif.map(s => s.transform(reflV)));
        } else if (g === 'p2') {
            const rot180 = tfRotate(Math.PI, cellWidth / 2, cellHeight / 2);
            allShapes.push(...motif.map(s => s.transform(rot180)));
        } else if (g === 'p2mm') {
            const reflH = tfReflect(0, 0, cellHeight / 2);
            const reflV = tfReflect(Math.PI / 2, cellWidth / 2, 0);
            const temp = [...motif, ...motif.map(s => s.transform(reflV))];
            allShapes = [...temp, ...temp.map(s => s.transform(reflH))];
        } else if (g === 'p2mg') {
            const reflV = tfReflect(Math.PI / 2, cellWidth / 2, 0);
            const temp = [...motif, ...motif.map(s => s.transform(reflV))];
            const glideH = tfGlideReflect(0, cellWidth / 2, 0, cellHeight / 2);
            allShapes = [...temp, ...temp.map(s => s.transform(glideH))];
        } else if (g === 'p2gg') {
            const glideH = tfGlideReflect(0, cellWidth / 4, 0, cellHeight / 2);
            const glideV = tfGlideReflect(Math.PI / 2, cellWidth / 2, cellWidth / 4, 0);
            const temp = [...motif, ...motif.map(s => s.transform(glideV))];
            allShapes = [...temp, ...temp.map(s => s.transform(glideH))];
        }

        return allShapes;
    }

    generate(cellWidth = 80, cellHeight = 60, complexity = 5, repetitions = 6, offset = [0, 0]) {
        const unitCell = this._generateUnitCell(cellWidth, cellHeight, complexity);
        const allShapes = [];
        const [ox, oy] = offset;

        for (let i = 0; i < repetitions; i++) {
            const tr = tfTranslate(ox + i * cellWidth, oy);
            for (const shape of unitCell) {
                allShapes.push(shape.transform(tr));
            }
        }

        return allShapes;
    }
}
