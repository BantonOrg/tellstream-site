const DJ_LOGO_ALIAS_FIXES = Object.freeze({
    'farl_ras.png': 'fari_ras.png',
    'father_b.png': 'fada_b.png',
    'fyah_ras.png': 'fire_ras.png',
    'wayne_lrie.png': 'wayne_irie.png',
    'sandra_bee.png': 'sandra_b.png',
    'stinger_binger.png': 'stinger_blinger.png',
    'milo_medina_int.png': 'milo_medina.png'
});

function canonicalDjLogoFileName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_') + '.png';
}

function fixKnownDjLogoPath(path) {
    const raw = String(path || '');
    const slash = raw.lastIndexOf('/');
    const prefix = slash >= 0 ? raw.slice(0, slash + 1) : '';
    const file = slash >= 0 ? raw.slice(slash + 1) : raw;
    return prefix + (DJ_LOGO_ALIAS_FIXES[file.toLowerCase()] || file);
}

function currentShowLogoPath(fallbackPath) {
    const display = document.getElementById('stream-name-display');
    const label = display ? String(display.textContent || '').trim() : '';
    const liveName = label.replace(/\s*-\s*LIVE\s*$/i, '').trim();

    if (liveName && !/^TELLSTREAM(?:\s+NON\s+STOP)?$/i.test(liveName)) {
        return canonicalDjLogoFileName(liveName);
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
