const ORIGINAL_MAIN_URL = './main.original.js?v=a2c464abdb06c7798f47a4c1cc3ce3ba1c6a2ca5';

const replacements = [
  [
`function getLogoFileName(baseName) {
    if (!baseName) return "";
    const clean = baseName.toLowerCase().trim().replace(/\\s+/g, '_');
    const specialMap = {
        'fari_ras': 'farl_ras',
        'fada_b': 'father_b',
        'fire_ras': 'fyah_ras',
        'wayne_irie': 'wayne_lrie',
        'sandra_b': 'sandra_bee',
        'stinger_blinger': 'stinger_binger',
        'milo_medina': 'milo_medina_int'
    };
    const mapped = specialMap[clean] || clean;
    return mapped + '.png';
}`,
`function normalizeLogoBaseName(baseName) {
    return String(baseName || '').toLowerCase().trim().replace(/\\s+/g, '_');
}

const legacyLogoMap = {
    'fari_ras': 'farl_ras',
    'fada_b': 'father_b',
    'fire_ras': 'fyah_ras',
    'wayne_irie': 'wayne_lrie',
    'sandra_b': 'sandra_bee',
    'stinger_blinger': 'stinger_binger',
    'milo_medina': 'milo_medina_int'
};

function getLogoFileName(baseName) {
    if (!baseName) return "";
    return normalizeLogoBaseName(baseName) + '.png';
}

function getLegacyLogoCandidates(baseName) {
    const clean = normalizeLogoBaseName(baseName);
    if (!clean) return [];

    const candidates = [];
    const mappedFull = legacyLogoMap[clean];
    if (mappedFull) candidates.push(mappedFull + '.png');

    const words = clean.split('_').filter(Boolean);
    if (words.length > 2) {
        const firstTwo = words.slice(0, 2).join('_');
        candidates.push(firstTwo + '.png');
        const mappedTwo = legacyLogoMap[firstTwo];
        if (mappedTwo) candidates.push(mappedTwo + '.png');
    }

    const canonical = clean + '.png';
    return [...new Set(candidates.filter(name => name && name !== canonical))];
}`
  ],
  [
`    // 1. Try matching by first two words of both names
    if (words.length >= 2) {
        const targetTwo = \`\${words[0]} \${words[1]}\`;
        const match = Object.values(profilesCache).find(p => 
            getFirstWords(p.username, 2) === targetTwo
        );
        if (match) return match;
    }

    // 2. Try matching by first word of both names (fallback for single-name DJs)
    const targetOne = words[0];
    const matchOne = Object.values(profilesCache).find(p => 
        getFirstWords(p.username, 1) === targetOne
    );
    if (matchOne) return matchOne;

    // 3. Fallback to exact match check
    const exactMatch = Object.values(profilesCache).find(p => 
        p.username.toLowerCase() === cleanName
    );
    if (exactMatch) return exactMatch;`,
`    // 1. Exact full-name match first.
    const exactMatch = Object.values(profilesCache).find(p =>
        p.username.toLowerCase() === cleanName
    );
    if (exactMatch) return exactMatch;

    // 2. Then try the first two words for older schedule labels.
    if (words.length >= 2) {
        const targetTwo = \`\${words[0]} \${words[1]}\`;
        const match = Object.values(profilesCache).find(p =>
            getFirstWords(p.username, 2) === targetTwo
        );
        if (match) return match;
    }

    // 3. Last-resort single-name fallback.
    const targetOne = words[0];
    const matchOne = Object.values(profilesCache).find(p =>
        getFirstWords(p.username, 1) === targetOne
    );
    if (matchOne) return matchOne;`
  ],
  [
`        const words = matchedName.trim().split(/\\s+/);
        const nameToUse = (words.length >= 2) ? \`\${words[0]} \${words[1]}\` : words[0];
        const safeFileName = getLogoFileName(nameToUse);`,
`        const safeFileName = getLogoFileName(matchedName);
        const legacyLogoCandidates = getLegacyLogoCandidates(matchedName);`
  ],
  [
`        const { data } = supabase_db.storage.from('dj-logos').getPublicUrl(safeFileName);
        const imgCloudUrl = data.publicUrl + '?v=' + Date.now();

        const imageProbe = new Image();`,
`        const { data } = supabase_db.storage.from('dj-logos').getPublicUrl(safeFileName);
        const imgCloudUrl = data.publicUrl + '?v=' + Date.now();
        let resolvedImageUrl = imgCloudUrl;
        let legacyCandidateIndex = 0;

        const imageProbe = new Image();`
  ],
  [
`            logoImg.src = imgCloudUrl;`,
`            logoImg.src = resolvedImageUrl;`
  ],
  [
`        imageProbe.onerror = function () {
            // STATE A: NO IMAGE FOUND -> Fallback completely to structural text parameters`,
`        imageProbe.onerror = function () {
            // Canonical full-name file is always tried first. If an older alias/truncated
            // filename still exists in storage, use it as a compatibility fallback.
            if (legacyCandidateIndex < legacyLogoCandidates.length) {
                const legacyFileName = legacyLogoCandidates[legacyCandidateIndex++];
                const { data: legacyData } = supabase_db.storage.from('dj-logos').getPublicUrl(legacyFileName);
                resolvedImageUrl = legacyData.publicUrl + '?v=' + Date.now();
                imageProbe.src = resolvedImageUrl;
                return;
            }

            // STATE A: NO IMAGE FOUND -> Fallback completely to structural text parameters`
  ]
];

async function runTellstreamMain() {
    try {
        const response = await fetch(ORIGINAL_MAIN_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Could not load original Tellstream main.js (${response.status})`);

        let source = await response.text();
        let applied = 0;

        for (const [before, after] of replacements) {
            if (!source.includes(before)) {
                throw new Error(`DJ logo fix could not find replacement block ${applied + 1}.`);
            }
            source = source.replace(before, after);
            applied++;
        }

        const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        try {
            await import(blobUrl);
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    } catch (error) {
        console.error('[Tellstream] DJ logo compatibility fix could not be applied. Loading untouched original main.js.', error);
        await import(ORIGINAL_MAIN_URL);
    }
}

await runTellstreamMain();
