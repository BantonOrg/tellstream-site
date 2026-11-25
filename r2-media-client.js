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
    root.TellStreamR2Media = Object.freeze({ upload, remove, flyers });
})(window);
