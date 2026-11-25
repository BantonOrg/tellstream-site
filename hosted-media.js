// Use hosted copies for assets that have actually been migrated.
// New/unarchived member uploads retain their original URLs until a secure
// Cloudflare write/delete service replaces Supabase Storage.
(function (root) {
    'use strict';
    const folders = new Set(['flyers', 'member-photos']);
    const promises = new Map();
    const base = '/src/assets/';

    function validPath(path) {
        return typeof path === 'string' &&
            path.length > 0 && path.length <= 1024 &&
            !/[\x00-\x1f\\]/.test(path) &&
            path.split('/').every(part => part && part !== '.' && part !== '..');
    }
    function hostedUrl(bucket, path) {
        if (!folders.has(bucket) || !validPath(path)) return null;
        return base + bucket + '/' +
            path.split('/').map(part => encodeURIComponent(part)).join('/');
    }
    async function manifest(bucket) {
        if (!folders.has(bucket)) return new Set();
        if (!promises.has(bucket)) {
            const promise = fetch(base + bucket + '/manifest.json?v=20261125-media1', {
                cache: 'no-cache'
            }).then(async response => {
                if (!response.ok) throw new Error('Manifest unavailable');
                const data = await response.json();
                if (!data || !Array.isArray(data.files)) throw new Error('Invalid manifest');
                return new Set(data.files.map(entry => entry.path).filter(validPath));
            }).catch(error => {
                console.warn('TellStream hosted media fallback:', bucket, error);
                promises.delete(bucket);
                return new Set();
            });
            promises.set(bucket, promise);
        }
        return promises.get(bucket);
    }
    function filenameFromUrl(bucket, originalUrl) {
        if (!folders.has(bucket) || !originalUrl) return null;
        try {
            const url = new URL(originalUrl, root.location.href);
            if (url.hostname !== 'vegwferwmyuunwvfqpsf.supabase.co') return null;
            const prefix = '/storage/v1/object/public/' + bucket + '/';
            if (!url.pathname.startsWith(prefix)) return null;
            const path = url.pathname.slice(prefix.length).split('/').map(decodeURIComponent).join('/');
            return validPath(path) ? path : null;
        } catch (_) {
            return null;
        }
    }
    async function resolveFile(bucket, filename, fallbackUrl) {
        const files = await manifest(bucket);
        if (validPath(filename) && files.has(filename)) {
            return hostedUrl(bucket, filename);
        }
        return fallbackUrl || '';
    }
    async function resolveUrl(bucket, originalUrl) {
        return resolveFile(bucket, filenameFromUrl(bucket, originalUrl), originalUrl);
    }
    async function listHosted(bucket) {
        return Array.from(await manifest(bucket));
    }
    root.TellStreamHostedMedia = Object.freeze({
        hostedUrl, resolveFile, resolveUrl, listHosted
    });
})(window);
