// Kaleidoscope pattern generator.
// Creates circular kaleidoscope patterns with rotational and reflection symmetry.

class KaleidoscopeGenerator {
    static PRESETS = {
        '*333': [6, true],
        '*236': [12, true],
        '*244': [8, true],
        '*235': [10, true],
        '*234': [8, true],
        '*237': [14, true],
        '*466': [6, true],
        '*555': [5, true],
    };

    constructor(triangleType = '*236', seed = null, palette = null) {
        this.triangleType = triangleType;
        if (KaleidoscopeGenerator.PRESETS[triangleType]) {
            [this.defaultSegments, this.defaultReflect] = KaleidoscopeGenerator.PRESETS[triangleType];
        } else {
            this.defaultSegments = 12;
            this.defaultReflect = true;
        }
        this.motifGen = new MotifGenerator(seed, palette);
    }

    get palette() { return this.motifGen.palette; }

    generate(size = 200, complexity = 6, iterations = 4, center = [0, 0], segments = null) {
        if (segments === null) segments = this.defaultSegments;
        const [cx, cy] = center;
        const wedgeAngle = Math.PI / segments;
        const allShapes = [];

        for (let ring = 0; ring < iterations; ring++) {
            const rInner = (ring / iterations) * size * 0.1;
            const rOuter = ((ring + 1) / iterations) * size;
            const motif = this.motifGen.generateInWedge(
                cx, cy, rInner, rOuter, 0, wedgeAngle,
                Math.max(2, Math.floor(complexity / iterations) + 1)
            );

            for (let i = 0; i < segments; i++) {
                const rotationAngle = i * 2 * Math.PI / segments;
                const rot = tfRotate(rotationAngle, cx, cy);
                for (const shape of motif) {
                    allShapes.push(shape.transform(rot));
                }
                if (this.defaultReflect) {
                    const refl = tfReflect(0, cx, cy);
                    const rotRefl = tfRotate(rotationAngle + wedgeAngle, cx, cy);
                    const combined = rotRefl.compose(refl);
                    for (const shape of motif) {
                        allShapes.push(shape.transform(combined));
                    }
                }
            }
        }

        return allShapes;
    }
}
