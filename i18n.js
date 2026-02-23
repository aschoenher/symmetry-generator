// Internationalization: English / French
// Auto-detects browser locale, defaults to English.

const TRANSLATIONS = {
    en: {
        title: 'Geometric Pattern Generator',
        subtitle: 'Create mathematical symmetry patterns',
        pattern_type: 'Pattern Type',
        rosette: 'Rosette',
        kaleidoscope: 'Kaleidoscope',
        wallpaper: 'Wallpaper',
        frieze: 'Frieze',
        rotational_order: 'Rotational Order (n)',
        symmetry_type: 'Symmetry Type',
        dn_desc: 'Dn (rotation + reflection)',
        cn_desc: 'Cn (rotation only)',
        triangle_type: 'Triangle Type',
        iterations: 'Iterations',
        tunnel_3d: '3D Tunnel Effect',
        speed: 'Speed',
        wallpaper_group: 'Wallpaper Group',
        group_hexagonal: 'Hexagonal',
        group_square: 'Square',
        group_rectangular: 'Rectangular',
        group_oblique: 'Oblique',
        repetitions: 'Repetitions',
        complexity: 'Complexity',
        color_palette: 'Color Palette',
        random_harmony: 'Random Harmony',
        pal_vibrant: 'Vibrant',
        pal_warm: 'Warm',
        pal_cool: 'Cool',
        pal_nature: 'Nature',
        pal_elegant: 'Elegant',
        pal_monochrome: 'Monochrome',
        vibrant: 'Vibrant',
        neon: 'Neon',
        pop: 'Pop',
        sunset: 'Sunset',
        autumn: 'Autumn',
        coral: 'Coral',
        ocean: 'Ocean',
        arctic: 'Arctic',
        twilight: 'Twilight',
        forest: 'Forest',
        meadow: 'Meadow',
        earth: 'Earth',
        berry: 'Berry',
        wine: 'Wine',
        sage: 'Sage',
        mono_blue: 'Blue',
        mono_green: 'Green',
        mono_purple: 'Purple',
        mono_gray: 'Gray',
        seed: 'Seed',
        dice: 'Dice',
        btn_random: 'Random',
        btn_regenerate: 'Regenerate',
        btn_download: 'Download PNG',
        auto_play: 'Auto-play',
        fullscreen: 'Fullscreen',
        settings: 'Settings',
        generating: 'Generating...',
        seed_label: 'Seed:',
        footer: 'Based on mathematical symmetry groups from "The Symmetries of Things"',
        alert_generate_first: 'Please generate a pattern first.',
        frieze_p2mm: 'p2mm (spinning sidle)',
        frieze_p2mg: 'p2mg (spinning jump)',
        frieze_p2gg: 'p2gg (step)',
        frieze_p2: 'p2 (spinning hop)',
        frieze_p1m1: 'p1m1 (sidle)',
        frieze_p11m: 'p11m (jump)',
        frieze_p1: 'p1 (hop)',
        triangle_236: '*236 (30-60-90)',
        triangle_333: '*333 (60-60-60)',
        triangle_244: '*244 (45-45-90)',
        triangle_235: '*235 (Icosahedral)',
        triangle_234: '*234 (Octahedral)',
        triangle_237: '*237 (Hyperbolic)',
    },
    fr: {
        title: 'Generateur de Motifs Geometriques',
        subtitle: 'Creez des motifs a symetrie mathematique',
        pattern_type: 'Type de motif',
        rosette: 'Rosette',
        kaleidoscope: 'Kaleidoscope',
        wallpaper: 'Papier peint',
        frieze: 'Frise',
        rotational_order: 'Ordre de rotation (n)',
        symmetry_type: 'Type de symetrie',
        dn_desc: 'Dn (rotation + reflexion)',
        cn_desc: 'Cn (rotation seule)',
        triangle_type: 'Type de triangle',
        iterations: 'Iterations',
        tunnel_3d: 'Effet tunnel 3D',
        speed: 'Vitesse',
        wallpaper_group: 'Groupe de pavage',
        group_hexagonal: 'Hexagonal',
        group_square: 'Carre',
        group_rectangular: 'Rectangulaire',
        group_oblique: 'Oblique',
        repetitions: 'Repetitions',
        complexity: 'Complexite',
        color_palette: 'Palette de couleurs',
        random_harmony: 'Harmonie aleatoire',
        pal_vibrant: 'Vif',
        pal_warm: 'Chaud',
        pal_cool: 'Froid',
        pal_nature: 'Nature',
        pal_elegant: 'Elegant',
        pal_monochrome: 'Monochrome',
        vibrant: 'Vif',
        neon: 'Neon',
        pop: 'Pop',
        sunset: 'Coucher de soleil',
        autumn: 'Automne',
        coral: 'Corail',
        ocean: 'Ocean',
        arctic: 'Arctique',
        twilight: 'Crepuscule',
        forest: 'Foret',
        meadow: 'Prairie',
        earth: 'Terre',
        berry: 'Baie',
        wine: 'Vin',
        sage: 'Sauge',
        mono_blue: 'Bleu',
        mono_green: 'Vert',
        mono_purple: 'Violet',
        mono_gray: 'Gris',
        seed: 'Graine',
        dice: 'De',
        btn_random: 'Aleatoire',
        btn_regenerate: 'Regenerer',
        btn_download: 'Telecharger PNG',
        auto_play: 'Lecture auto',
        fullscreen: 'Plein ecran',
        settings: 'Parametres',
        generating: 'Generation...',
        seed_label: 'Graine :',
        footer: 'Base sur les groupes de symetrie mathematiques de "The Symmetries of Things"',
        alert_generate_first: 'Veuillez d\'abord generer un motif.',
        frieze_p2mm: 'p2mm (glissement tournant)',
        frieze_p2mg: 'p2mg (saut tournant)',
        frieze_p2gg: 'p2gg (pas)',
        frieze_p2: 'p2 (saut perilleux)',
        frieze_p1m1: 'p1m1 (glissement)',
        frieze_p11m: 'p11m (saut)',
        frieze_p1: 'p1 (bond)',
        triangle_236: '*236 (30-60-90)',
        triangle_333: '*333 (60-60-60)',
        triangle_244: '*244 (45-45-90)',
        triangle_235: '*235 (Icosaedrique)',
        triangle_234: '*234 (Octaedrique)',
        triangle_237: '*237 (Hyperbolique)',
    }
};

// Detect language
const LANG = (navigator.language || navigator.userLanguage || 'en').startsWith('fr') ? 'fr' : 'en';

// Get a translation string
function T(key) {
    return (TRANSLATIONS[LANG] && TRANSLATIONS[LANG][key]) || TRANSLATIONS.en[key] || key;
}

// Apply translations to all elements with data-i18n attributes
function applyTranslations() {
    document.documentElement.lang = LANG;
    document.title = T('title');

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = T(el.getAttribute('data-i18n'));
    });

    // Optgroup labels
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
        el.label = T(el.getAttribute('data-i18n-label'));
    });

    // Button titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = T(el.getAttribute('data-i18n-title'));
    });
}
