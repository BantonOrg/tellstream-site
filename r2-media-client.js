// Browser-side helper for the verified same-origin Cloudflare media API.
// No R2 tokens or private credentials appear in this file.
(function (root) {
    'use strict';
    function account() {
        const username = localStorage.getItem('tellstream_saved_username') || '';
        const password = username && localStorage.getItem('tellstream_key_' + username) || '';
        if (!username || !password) {
            throw new Error('Sign in to your TellStream chat name before managing photographs.');
        }
        return { username, password };
    }
    async function responseJson(response) {
        let payload = {};
        try { payload = await response.json(); } catch (_) {}
        if (!response.ok || payload.error) {
            throw new Error(payload.error || 'Media request failed (' + response.status + ')');
        }
        return payload;
    }
    async function upload(kind, file, options) {
        const auth = account();
        if (!file || typeof file.size !== 'number') throw new Error('Select an image first');
        const form = new FormData();
        form.set('kind', kind);
        form.set('username', auth.username);
        form.set('password', auth.password);
        form.set('file', file, file.name || 'picture.png');
        if (options && options.name) form.set('name', options.name);
        if (options && options.filename) form.set('filename', options.filename);
        const result = await fetch('/api/media', {
            method: 'POST', body: form, credentials: 'same-origin', cache: 'no-store'
        });
        return responseJson(result);
    }
    async function remove(kind, fields) {
        const auth = account();
        const result = await fetch('/api/media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            cache: 'no-store',
            body: JSON.stringify({ kind, username: auth.username, password: auth.password, ...(fields || {}) })
        });
        return responseJson(result);
    }
    async function flyers() {
        const res = await fetch('/api/media?kind=flyers', {
            credentials: 'same-origin', cache: 'no-store'
        });
        return responseJson(res);
    }
    // The gallery and on-air banner share the original filename resolver.
    // R2 overrides hosted static PNGs. A deleted-name marker suppresses both.
    let djCache = null;
    let djExpiry = 0;
    function invalidateDjs() { djCache = null; djExpiry = 0; }
    async function djImages(options = {}) {
        if (options.fresh) invalidateDjs();
        if (djCache && Date.now() < djExpiry) return djCache;
        djExpiry = Date.now() + 30000;
        djCache = fetch('/api/media?kind=djs', {
            credentials: 'same-origin', cache: 'no-store'
        }).then(responseJson).then(data => ({
            files: new Set((data.files || []).map(item => item.name)),
            deleted: new Set(data.deleted || [])
        })).catch(error => {
            // A missing preview/Cloudflare function must not blank the old images.
            invalidateDjs();
            console.warn('[TellStream DJ images] R2 lookup unavailable; using site assets:', error.message);
            return null;
        });
        return djCache;
    }
    async function djImage(filename) {
        if (!/^[a-z0-9_]{1,90}\.png$/.test(String(filename || ''))) return null;
        const state = await djImages();
        if (state && state.deleted.has(filename)) return null;
        if (state && state.files.has(filename)) {
            return '/api/media/file?key=' + encodeURIComponent('djs/' + filename);
        }
        return '/src/assets/djs/' + encodeURIComponent(filename);
    }
    root.TellStreamR2Media = Object.freeze({
        upload, remove, flyers, djImage, djImages, invalidateDjs
    });
})(window);
