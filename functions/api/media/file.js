// Pages Function: GET /api/media/file?key=kind/path.png
// Pictures are already public on TellStream; writes are private to /api/media.
const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
function validKey(key) {
    if (typeof key !== 'string' || key.length < 8 || key.length > 400 ||
        /[\x00-\x1f\\]/.test(key) || key.includes('..') || key.includes('//')) return false;
    if (!/^(flyers|avatars|member-photos|djs)\//.test(key)) return false;
    const ext = key.split('.').at(-1).toLowerCase();
    if (!types[ext]) return false;
    return key.split('/').every(part => part.length > 0);
}
export async function onRequestGet(context) {
    if (!context.env.MEDIA) return new Response('Media unavailable', { status: 503 });
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');
    if (!validKey(key)) return new Response('Bad media path', { status: 400 });
    try {
        const object = await context.env.MEDIA.get(key);
        if (!object) return new Response('Image not found', { status: 404 });
        const ext = key.split('.').at(-1).toLowerCase();
        const headers = new Headers({
            'Content-Type': types[ext],
            'X-Content-Type-Options': 'nosniff',
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Cache-Control': 'no-store',
            'Content-Disposition': 'inline'
        });
        if (object.size != null) headers.set('Content-Length', String(object.size));
        return new Response(object.body, { headers });
    } catch (_) {
        return new Response('Image unavailable', { status: 503 });
    }
}
