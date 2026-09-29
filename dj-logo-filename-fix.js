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
    'fada_b': 'father_b.png',
    'father_b': 'father_b.png',
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

function fixKnownDjLogoPath(path) {
    const raw = String(path || '');
    const slash = raw.lastIndexOf('/');
    const prefix = slash >= 0 ? raw.slice(0, slash + 1) : '';
    const file = slash >= 0 ? raw.slice(slash + 1) : raw;
    return prefix + (DJ_LOGO_PATH_FIXES[file.toLowerCase()] || file);
}

function currentShowLogoPath(fallbackPath) {
    const display = document.getElementById('stream-name-display');
    const label = display ? String(display.textContent || '').trim() : '';
    const liveName = label.replace(/\s*-\s*LIVE\s*$/i, '').trim();

    if (liveName && !/^TELLSTREAM(?:\s+NON\s+STOP)?$/i.test(liveName)) {
        const key = normalizeFirstTwoDjWords(liveName);
        return DJ_LOGO_FILES[key] || (key ? key + '.png' : fixKnownDjLogoPath(fallbackPath));
    }

    return fixKnownDjLogoPath(fallbackPath);
}

(function installDjLogoFilenameCompatibility() {
    const supabaseGlobal = window.supabase;
    if (!supabaseGlobal || typeof supabaseGlobal.createClient !== 'function') {
        console.error('[Tellstream] Supabase was not available for DJ logo filename compatibility.');
        return;
    }

    const originalCreateClient = supabaseGlobal.createClient.bind(supabaseGlobal);

    supabaseGlobal.createClient = function (...args) {
        const client = originalCreateClient(...args);
        if (!client?.storage || typeof client.storage.from !== 'function') return client;

        const originalStorageFrom = client.storage.from.bind(client.storage);

        client.storage.from = function (bucketName) {
            const bucket = originalStorageFrom(bucketName);
            if (bucketName !== 'dj-logos' || !bucket) return bucket;

            if (typeof bucket.getPublicUrl === 'function') {
                const originalGetPublicUrl = bucket.getPublicUrl.bind(bucket);
                bucket.getPublicUrl = function (path, ...rest) {
                    return originalGetPublicUrl(currentShowLogoPath(path), ...rest);
                };
            }

            if (typeof bucket.upload === 'function') {
                const originalUpload = bucket.upload.bind(bucket);
                bucket.upload = function (path, fileBody, ...rest) {
                    return originalUpload(fixKnownDjLogoPath(path), fileBody, ...rest);
                };
            }

            if (typeof bucket.remove === 'function') {
                const originalRemove = bucket.remove.bind(bucket);
                bucket.remove = function (paths, ...rest) {
                    const fixedPaths = Array.isArray(paths) ? paths.map(fixKnownDjLogoPath) : paths;
                    return originalRemove(fixedPaths, ...rest);
                };
            }

            return bucket;
        };

        return client;
    };
})();
