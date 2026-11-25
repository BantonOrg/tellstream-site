import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost, onRequestDelete } from '../functions/api/media/index.js';

class FakeBucket {
  constructor() { this.items = new Map(); }
  async put(key, bytes, options) { this.items.set(key, { bytes, options }); }
  async delete(key) { this.items.delete(key); }
  async list({ prefix }) {
    return {
      objects: [...this.items.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })),
      truncated: false
    };
  }
}

function setup() {
  const bucket = new FakeBucket();
  const photos = [];
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (target, options = {}) => {
    const url = new URL(target);
    const path = url.pathname;
    if (path.endsWith('/rpc/verify_user_passkey')) {
      const body = JSON.parse(options.body);
      return Response.json(body.p_passkey === 'pass');
    }
    if (path.endsWith('/secured_profiles')) {
      const username = (url.searchParams.get('username') || '').slice(3);
      if (options.method === 'PATCH') return new Response(null, { status: 204 });
      return Response.json([{
        username, power_level: username === 'Admin' ? 2 : username === 'Vip' ? 1 : 0,
        hover_title: ''
      }]);
    }
    if (path.endsWith('/member_photos')) {
      const username = (url.searchParams.get('username') || '').slice(3);
      if (options.method === 'POST') {
        photos.push({ id: photos.length + 1, ...JSON.parse(options.body) });
        return new Response(null, { status: 201 });
      }
      if (options.method === 'DELETE') {
        const id = Number((url.searchParams.get('id') || '').slice(3));
        const index = photos.findIndex(photo => photo.id === id && photo.username === username);
        if (index >= 0) photos.splice(index, 1);
        return new Response(null, { status: 204 });
      }
      const file = (url.searchParams.get('file_name') || '').slice(3);
      return Response.json(photos.filter(photo => photo.username === username && (!file || photo.file_name === file)));
    }
    throw new Error('Unexpected Supabase endpoint: ' + path);
  };
  return { bucket, photos, restore() { globalThis.fetch = previousFetch; } };
}
function context(bucket, action, payload = {}, base = 'https://tellstream.banton.org') {
  const url = base + '/api/media' + (action === 'GET' ? '?kind=flyers' : '');
  let request;
  if (action === 'POST') {
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (key === 'file') form.set(key, value, 'image.png');
      else form.set(key, value);
    }
    request = new Request(url, { method: 'POST', body: form, headers: { Origin: base } });
  } else if (action === 'DELETE') {
    request = new Request(url, { method: 'DELETE', headers: {
      Origin: base, 'Content-Type': 'application/json'
    }, body: JSON.stringify(payload) });
  } else request = new Request(url);
  return { request, env: { MEDIA: bucket, SUPABASE_ANON_KEY: 'public-anon-for-tests' } };
}
function png() { const x = new Uint8Array(64); x.set([137, 80, 78, 71, 13, 10, 26, 10]); return new Blob([x], { type: 'image/png' }); }
function jpeg() { const x = new Uint8Array(64); x.set([255, 216, 255]); return new Blob([x], { type: 'image/jpeg' }); }

test('R2 media requires valid credentials and the right privileges', async () => {
  const ctx = setup();
  try {
    const denied = await onRequestPost(context(ctx.bucket, 'POST', {
      username: 'Admin', password: 'invalid', kind: 'flyer', name: '010127_test', file: png()
    }));
    assert.equal(denied.status, 403);
    const notAdmin = await onRequestPost(context(ctx.bucket, 'POST', {
      username: 'Vip', password: 'pass', kind: 'flyer', name: '010127_test', file: png()
    }));
    assert.equal(notAdmin.status, 403);
    assert.equal(ctx.bucket.items.size, 0);
  } finally { ctx.restore(); }
});

test('Admin can upload, list and delete dated R2 flyers', async () => {
  const ctx = setup();
  try {
    const uploaded = await onRequestPost(context(ctx.bucket, 'POST', {
      username: 'Admin', password: 'pass', kind: 'flyer', name: '010127_test', file: png()
    }));
    assert.equal(uploaded.status, 201);
    assert.equal(ctx.bucket.items.has('flyers/010127_test.png'), true);
    const listed = await (await onRequestGet(context(ctx.bucket, 'GET'))).json();
    assert.deepEqual(listed.files.map(f => f.name), ['010127_test.png']);
    const deleted = await onRequestDelete(context(ctx.bucket, 'DELETE', {
      username: 'Admin', password: 'pass', kind: 'flyer', name: '010127_test.png'
    }));
    assert.equal(deleted.status, 200);
    assert.equal(ctx.bucket.items.has('flyers/010127_test.png'), false);
    const hidden = await (await onRequestGet(context(ctx.bucket, 'GET'))).json();
    assert.deepEqual(hidden.deleted, ['010127_test.png']);
  } finally { ctx.restore(); }
});

test('Owner can delete a member image but another user cannot', async () => {
  const ctx = setup();
  try {
    const uploaded = await onRequestPost(context(ctx.bucket, 'POST', {
      username: 'Vip', password: 'pass', kind: 'member-photo', file: jpeg()
    }));
    assert.equal(uploaded.status, 201);
    const body = await uploaded.json();
    assert.equal(ctx.photos.length, 1);
    const denied = await onRequestDelete(context(ctx.bucket, 'DELETE', {
      username: 'Admin', password: 'pass', kind: 'member-photo', file_name: body.file_name
    }));
    assert.equal(denied.status, 403);
    assert.equal(ctx.photos.length, 1);
    const deleted = await onRequestDelete(context(ctx.bucket, 'DELETE', {
      username: 'Vip', password: 'pass', kind: 'member-photo', file_name: body.file_name
    }));
    assert.equal(deleted.status, 200);
    assert.equal(ctx.photos.length, 0);
  } finally { ctx.restore(); }
});

test('Preview branch cannot mutate live R2 or Supabase data', async () => {
  const ctx = setup();
  try {
    const result = await onRequestPost(context(ctx.bucket, 'POST', {
      username: 'Admin', password: 'pass', kind: 'flyer', name: '010127_test', file: png()
    }, 'https://branch.tellstream-site.pages.dev'));
    assert.equal(result.status, 403);
    assert.equal(ctx.bucket.items.size, 0);
  } finally { ctx.restore(); }
});
