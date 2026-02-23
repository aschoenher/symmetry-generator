// SVG rendering utilities.

class SVGRenderer {
    constructor(width = 512, height = 512, background = null) {
        this.width = width;
        this.height = height;
        this.background = background;
    }

    render(shapes, title = 'Generated Pattern') {
        const vb = [0, 0, this.width, this.height];
        const viewboxStr = vb.map(v => v.toFixed(3)).join(' ');

        const lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="${viewboxStr}">`,
            `  <title>${title}</title>`
        ];

        if (this.background) {
            lines.push(`  <rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${this.background}"/>`);
        }

        for (const shape of shapes) {
            const svg = shape.toSvg();
            for (const line of svg.split('\n')) {
                lines.push(`  ${line}`);
            }
        }

        lines.push('</svg>');
        return lines.join('\n');
    }
}
