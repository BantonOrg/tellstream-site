const DJ_LOGO_FILES = Object.freeze({
    'big_john': 'big_john.png',
    'bullett_movements': 'bullett_movements.png',
    'bullet_movements': 'bullett_movements.png',
    'cassette_jones': 'cassette_jones.png',
    'daddy_crucial': 'daddy_crucial.png',
    'delete': 'delete.png',
    'delly_ranx': 'delly_ranx.png',
    'dj_cruss': 'dj_cruss.png',
    'cruss': 'dj_cruss.png',
    'dj_denco': 'dj_denco.png',
    'denco': 'dj_denco.png',
    'fari_ras': 'fari_ras.png',
    'fada_b': 'fada_b.png',
    'father_b': 'fada_b.png',
    'fire_ras': 'fyah_ras.png',
    'fyah_ras': 'fyah_ras.png',
    'jacko_melody': 'jacko_melody.png',
    'mikey_d': 'mikey_d.png',
    'milo_medina': 'milo_medina_int.png',
    'president_kennedy': 'president_kennedy.png',
    'sandra_b': 'sandra_bee.png',
    'sandra_bee': 'sandra_bee.png',
    'silverstar_sound': 'silverstar_sound.png',
    'stinger_blinger': 'stinger_blinger.png'
});

const DJ_LOGO_PATH_FIXES = Object.freeze({
    'farl_ras.png': 'fari_ras.png',
    'father_b.png': 'fada_b.png',
    'stinger_binger.png': 'stinger_blinger.png'
});

function normalizeFirstTwoDjWords(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join('_');
}

// Shared DJ image filenames for both the live on-air banner and DJ gallery.
// PNG files are original, unmodified images hosted under /src/assets/djs/.
export function resolveDjShowcaseLogoFile(name) {
    const key = normalizeFirstTwoDjWords(name);
    return DJ_LOGO_FILES[key] || (key ? key + '.png' : '');
}
