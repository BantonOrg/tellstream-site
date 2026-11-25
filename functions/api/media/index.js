// Pages Function: /api/media. The R2 MEDIA binding is private.
// Every write is verified server-side against TellStream's password RPC.
// Never accept a claimed privilege, ownership, or R2 key from the browser.
const PROJECT_URL = 'https://vegwferwmyuunwvfqpsf.supabase.co';
const MAX_UPLOAD = { flyer: 8 * 1024 * 1024, avatar: 1024 * 1024, 'member-photo': 3 * 1024 * 1024, dj: 4 * 1024 * 1024 };
const IMAGE_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function reply(value, status) {
    return new Response(JSON.stringify(value), {
        status: status || 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        }
    });
}
function fail(message, status) { return reply({ error: message }, status || 400); }
function sameOrigin(request) {
    const origin = request.headers.get('Origin');
    return !origin || origin === new URL(request.url).origin;
}
function liveHost(request) {
    // Preview branches must never write to the production Supabase tables.
    return new URL(request.url).hostname === 'tellstream.banton.org';
}
function credentials(context) {
    const key = context.env.SUPABASE_ANON_KEY;
    if (!key || !context.env.MEDIA) return null;
    return {
        url: context.env.SUPABASE_URL || PROJECT_URL,
        headers: {
            apikey: key,
            Authorization: 'Bearer ' + key,
            'Content-Type': 'application/json'
        }
    };
}
async function database(connection, path, options) {
    const res = await fetch(connection.url + '/rest/v1/' + path, {
        ...options,
        headers: { ...connection.headers, ...(options && options.headers || {}) }
    });
    if (!res.ok) {
        console.error('[media] Supabase request failed', res.status, path.split('?')[0]);
        throw new Error('Database request failed');
    }
    const raw = await res.text();
    return raw ? JSON.parse(raw) : null;
}
function query(table, filters, select) {
    const params = new URLSearchParams();
    params.set('select', select || '*');
    for (const [key, value] of Object.entries(filters || {})) params.set(key, 'eq.' + value);
    return table + '?' + params.toString();
}
async function authenticate(connection, username, password) {
    if (typeof username !== 'string' || !/^[A-Za-z0-9 _-]{1,60}$/.test(username) ||
        typeof password !== 'string' || password.length < 1 || password.length > 180) {
        return null;
    }
    const verified = await database(connection, 'rpc/verify_user_passkey', {
        method: 'POST', body: JSON.stringify({ p_username: username, p_passkey: password })
    });
    if (verified !== true) return null;
    const rows = await database(connection,
        query('secured_profiles', { username }, 'username,power_level,hover_title'));
    const profile = Array.isArray(rows) ? rows[0] : null;
    if (!profile || profile.username !== username) return null;
    const level = Number(profile.power_level) || 0;
    const hover = String(profile.hover_title || '').toUpperCase();
    const isVip = level >= 1 || hover === 'VIP' || hover === 'VIP|PERMANENT' ||
        (hover.startsWith('VIP|') && Number.isFinite(Date.parse(hover.slice(4))) &&
         Date.parse(hover.slice(4)) > Date.now());
    return { username, level, isVip };
}
function imageKind(bytes) {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
    if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 &&
        bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 &&
        bytes[6] === 26 && bytes[7] === 10) return 'png';
    if (bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 &&
        bytes[3] === 70 && bytes[8] === 87 && bytes[9] === 69 &&
        bytes[10] === 66 && bytes[11] === 80) return 'webp';
    return null;
}
function publicUrl(key) {
    return '/api/media/file?key=' + encodeURIComponent(key);
}
function encodedName(name) { return encodeURIComponent(name); }
async function putFile(bucket, key, bytes, ext) {
    await bucket.put(key, bytes, {
        httpMetadata: { contentType: IMAGE_TYPES[ext], cacheControl: 'public,max-age=60' }
    });
}
async function allKeys(bucket, prefix) {
    const found = [];
    let cursor;
    do {
        const result = await bucket.list({ prefix, limit: 500, ...(cursor ? { cursor } : {}) });
        found.push(...result.objects.map(item => item.key));
        cursor = result.truncated ? result.cursor : null;
    } while (cursor && found.length < 3000);
    return found;
}
function safeFlyerName(raw) {
    const name = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_');
    return /^\d{6}_[a-z0-9_-]{1,90}$/.test(name) ? name : null;
}
function isOwnedPhoto(username, fileName) {
    return typeof fileName === 'string' && fileName.startsWith(username + '/') &&
        /^img_[0-9a-f-]{8,45}\.jpg$/i.test(fileName.slice(username.length + 1));
}
async function authenticated(context, username, password) {
    const connection = credentials(context);
    if (!connection) return { error: fail('Media service not configured', 503) };
    try {
        const identity = await authenticate(connection, username, password);
        if (!identity) return { error: fail('Incorrect sign-in or permission denied', 403) };
        return { connection, identity };
    } catch (err) {
        console.error('[media] Server-side authentication unavailable');
        return { error: fail('Sign-in verification temporarily unavailable', 503) };
    }
}

export async function onRequestGet(context) {
    if (!context.env.MEDIA) return fail('Media service not configured', 503);
    const url = new URL(context.request.url);
    const kind = url.searchParams.get('kind');
    if (kind !== 'flyers' && kind !== 'djs') return fail('Unsupported media listing', 400);
    try {
        const base = kind === 'djs' ? 'djs/' : 'flyers/';
        const tombstones = kind === 'djs' ? 'deleted-djs/' : 'deleted-flyers/';
        const [keys, hidden] = await Promise.all([
            allKeys(context.env.MEDIA, base),
            allKeys(context.env.MEDIA, tombstones)
        ]);
        const deleted = new Set(hidden.map(key => key.slice(tombstones.length)));
        const files = keys.map(key => key.slice(base.length))
            .filter(name => name && !name.includes('/') && !deleted.has(name))
            .map(name => ({ name, url: publicUrl(base + name) }));
        return reply({ files, deleted: Array.from(deleted) });
    } catch (_) { return fail('Cannot list event flyers', 503); }
}
export async function onRequestPost(context) {
    if (!liveHost(context.request)) return fail('Uploads require the live TellStream domain', 403);
    if (!sameOrigin(context.request)) return fail('Invalid request origin', 403);
    const length = Number(context.request.headers.get('Content-Length') || 0);
    if (length > 9 * 1024 * 1024) return fail('Image too large', 413);
    let form;
    try { form = await context.request.formData(); }
    catch (_) { return fail('Invalid upload form'); }
    const kind = form.get('kind');
    if (!Object.hasOwn(MAX_UPLOAD, kind)) return fail('Unsupported image type');
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function' ||
        !Number.isFinite(file.size) || file.size < 16 || file.size > MAX_UPLOAD[kind]) {
        return fail('Choose a valid image of the permitted size', 413);
    }
    const auth = await authenticated(context, form.get('username'), form.get('password'));
    if (auth.error) return auth.error;
    const { connection, identity } = auth;
    if ((kind === 'flyer' || kind === 'dj') && identity.level < 2) return fail('Station Admin required', 403);
    if (kind === 'member-photo' && !identity.isVip) return fail('VIP or DJ required', 403);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = imageKind(bytes);
    if (!ext) return fail('Only real PNG, JPEG or WebP images are accepted');
    if (kind === 'member-photo' && ext !== 'jpg') return fail('Member photographs must be JPEG');
    if (kind === 'dj' && ext !== 'png') return fail('DJ photographs must be PNG');
    if (kind === 'avatar' && ext !== 'png') return fail('Avatar photographs must be PNG');
    let key, recordName;
    if (kind === 'flyer') {
        const name = safeFlyerName(form.get('name'));
        if (!name) return fail('Flyer name must be DDMMYY_name');
        key = 'flyers/' + name + '.' + ext;
    } else if (kind === 'dj') {
        // Same canonical name as the first-two-word on-air image resolver.
        const filename = String(form.get('filename') || '').toLowerCase();
        if (!/^[a-z0-9_]{1,90}\.png$/.test(filename)) return fail('Invalid DJ image filename');
        key = 'djs/' + filename;
    } else if (kind === 'avatar') {
        key = 'avatars/' + encodedName(identity.username) + '/img_' + crypto.randomUUID() + '.png';
    } else {
        recordName = identity.username + '/img_' + crypto.randomUUID() + '.jpg';
        key = 'member-photos/' + encodedName(identity.username) + '/' +
            recordName.slice(identity.username.length + 1);
    }
    const url = publicUrl(key);
    try {
        if (kind === 'member-photo') {
            const rows = await database(connection,
                query('member_photos', { username: identity.username }, 'id,file_name') + '&order=created_at.asc');
            if (!Array.isArray(rows)) return fail('Cannot check current photo gallery', 503);
            await putFile(context.env.MEDIA, key, bytes, ext);
            try {
                await database(connection, 'member_photos', {
                    method: 'POST',
                    headers: { Prefer: 'return=minimal' },
                    body: JSON.stringify({ username: identity.username, file_name: recordName, public_url: url })
                });
            } catch (error) {
                await context.env.MEDIA.delete(key);
                throw error;
            }
            // Preserve the nine-photo policy without deleting an old image
            // until the replacement is stored and its database record exists.
            if (rows.length >= 9) {
                const old = rows[0];
                const result = await database(connection,
                    query('member_photos', { username: identity.username, id: String(old.id) }, 'id'),
                    { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
                if (isOwnedPhoto(identity.username, old.file_name)) {
                    const oldKey = 'member-photos/' + encodedName(identity.username) + '/' +
                        old.file_name.slice(identity.username.length + 1);
                    await context.env.MEDIA.delete(oldKey);
                }
            }
        } else {
            await putFile(context.env.MEDIA, key, bytes, ext);
            if (kind === 'avatar') {
                try {
                    await database(connection,
                        query('secured_profiles', { username: identity.username }, 'username'),
                        { method: 'PATCH', headers: { Prefer: 'return=minimal' },
                          body: JSON.stringify({ avatar_url: url }) });
                } catch (error) {
                    await context.env.MEDIA.delete(key);
                    throw error;
                }
            } else if (kind === 'flyer') {
                await context.env.MEDIA.delete('deleted-flyers/' + key.slice('flyers/'.length));
            } else if (kind === 'dj') {
                await context.env.MEDIA.delete('deleted-djs/' + key.slice('djs/'.length));
            }
        }
        return reply({ ok: true, url, file_name: recordName || key.split('/').slice(1).join('/'), kind }, 201);
    } catch (_) { return fail('Upload could not be saved', 503); }
}
export async function onRequestDelete(context) {
    if (!liveHost(context.request)) return fail('Deletions require the live TellStream domain', 403);
    if (!sameOrigin(context.request)) return fail('Invalid request origin', 403);
    let body;
    try { body = await context.request.json(); }
    catch (_) { return fail('Invalid delete request'); }
    if (!body || typeof body !== 'object') return fail('Invalid delete request');
    const auth = await authenticated(context, body.username, body.password);
    if (auth.error) return auth.error;
    const { connection, identity } = auth;
    if (body.kind === 'dj') {
        if (identity.level < 2) return fail('Station Admin required', 403);
        const filename = String(body.filename || '').toLowerCase();
        if (!/^[a-z0-9_]{1,90}\.png$/.test(filename)) return fail('Invalid DJ image filename');
        try {
            await context.env.MEDIA.delete('djs/' + filename);
            await context.env.MEDIA.put('deleted-djs/' + filename, 'removed', {
                httpMetadata: { contentType: 'text/plain' }
            });
            return reply({ ok: true, filename });
        } catch (_) { return fail('Could not delete DJ photograph', 503); }
    }
    if (body.kind === 'flyer') {
        if (identity.level < 2) return fail('Station Admin required', 403);
        const name = String(body.name || '');
        if (!/^\d{6}_[a-z0-9_-]{1,90}\.(jpg|jpeg|png|webp)$/.test(name)) {
            return fail('Invalid flyer filename');
        }
        try {
            await context.env.MEDIA.delete('flyers/' + name);
            await context.env.MEDIA.put('deleted-flyers/' + name, 'removed', {
                httpMetadata: { contentType: 'text/plain' }
            });
            return reply({ ok: true, name });
        } catch (_) { return fail('Could not delete flyer', 503); }
    }
    if (body.kind !== 'member-photo') return fail('Unsupported deletion');
    if (!isOwnedPhoto(identity.username, body.file_name)) return fail('Not your photo', 403);
    try {
        const rows = await database(connection,
            query('member_photos', { username: identity.username, file_name: body.file_name }, 'id,file_name'));
        if (!Array.isArray(rows) || rows.length !== 1) return fail('Photo not found', 404);
        const key = 'member-photos/' + encodedName(identity.username) + '/' +
            body.file_name.slice(identity.username.length + 1);
        // Deletion takes effect in R2 and in the existing member_photos DB.
        await context.env.MEDIA.delete(key);
        await database(connection,
            query('member_photos', { username: identity.username, id: String(rows[0].id) }, 'id'),
            { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
        return reply({ ok: true });
    } catch (_) { return fail('Could not delete photo', 503); }
}
