// Rosette pattern generator.
// Implements Cn (cyclic) and Dn (dihedral) point group symmetries.

class RosetteGenerator {
    constructor(n = 6, symmetryType = 'Dn', seed = null, palette = null) {
        if (n < 1) throw new Error('n must be at least 1');
        if (symmetryType !== 'Cn' && symmetryType !== 'Dn') throw new Error("symmetryType must be 'Cn' or 'Dn'");
        this.n = n;
        this.symmetryType = symmetryType;
        this.motifGen = new MotifGenerator(seed, palette);
    }

    get palette() { return this.motifGen.palette; }

    generate(size = 200, complexity = 8, center = [0, 0]) {
        const [cx, cy] = center;
        const rOuter = size;
        const rInner = size * 0.1;

        const wedgeAngle = this.symmetryType === 'Dn'
            ? Math.PI / this.n
            : 2 * Math.PI / this.n;

        const motifShapes = this.motifGen.generateInWedge(cx, cy, rInner, rOuter, 0, wedgeAngle, complexity);

        const allShapes = [];
        const rotationAngle = 2 * Math.PI / this.n;

        if (this.symmetryType === 'Dn') {
            for (let i = 0; i < this.n; i++) {
                const rot = tfRotate(i * rotationAngle, cx, cy);
                for (const shape of motifShapes) {
                    allShapes.push(shape.transform(rot));
                }
                const refl = tfReflect(0, cx, cy);
                for (const shape of motifShapes) {
                    const reflected = shape.transform(refl);
                    allShapes.push(reflected.transform(rot));
                }
            }
        } else {
            for (let i = 0; i < this.n; i++) {
                const rot = tfRotate(i * rotationAngle, cx, cy);
                for (const shape of motifShapes) {
                    allShapes.push(shape.transform(rot));
                }
            }
        }

        return allShapes;
    }
}
