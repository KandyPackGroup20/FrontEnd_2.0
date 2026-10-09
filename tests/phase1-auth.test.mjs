import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { afterEach, mock, test } from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const source = await readFile(new URL('../lib/edge-auth.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const compiledModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, compiledModule, compiledModule.exports);
const { middleware } = compiledModule.exports;
const request = (url, token) => new NextRequest(url, { headers: token ? { cookie: `kandypack_session=${token}` } : {} });
const session = (role, force_password_reset = false) => mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ user_id: 1, role, force_password_reset }), { status: 200 }));
afterEach(() => mock.restoreAll());

test('admin hostname protects root, warehouse and arbitrary pages; login stays accessible', async () => {
  for (const path of ['/', '/warehouse', '/anything']) {
    const res = await middleware(request(`https://admin.kandypack.lk${path}`));
    assert.equal(res.status, 307);
    assert.equal(new URL(res.headers.get('location')).pathname, '/login');
  }
  assert.equal((await middleware(request('https://admin.kandypack.lk/login'))).status, 200);
});
test('admin registration and authenticated customers are forbidden with an HTML screen', async () => {
  assert.equal((await middleware(request('https://admin.kandypack.lk/register'))).status, 403);
  session('CUSTOMER');
  for (const path of ['/', '/login', '/profile', '/admin/users']) {
    const res = await middleware(request(`https://admin.kandypack.lk${path}`, 'valid-customer'));
    assert.equal(res.status, 403);
    assert.match(res.headers.get('content-type'), /text\/html/);
  }
});
test('forged token is rejected based on backend verification, not decoded claims', async () => {
  mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.match(options.headers.cookie, /kandypack_session=/);
    assert.equal(options.cache, 'no-store');
    return new Response('{}', { status: 401 });
  });
  const token = `e30.${Buffer.from(JSON.stringify({ role: 'SUPERADMIN' })).toString('base64url')}.fake`;
  assert.equal((await middleware(request('https://admin.kandypack.lk/admin/users', token))).status, 307);
});
test('backend failure fails closed with 503', async () => {
  mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  assert.equal((await middleware(request('https://kandypack.lk/warehouse', 'token'))).status, 503);
});
test('staff role gates and forced reset match backend policy', async () => {
  session('DISPATCHER');
  assert.equal((await middleware(request('https://admin.kandypack.lk/admin/users', 'token'))).status, 403);
  assert.equal((await middleware(request('https://admin.kandypack.lk/admin/roster', 'token'))).status, 200);
  mock.restoreAll();
  session('SUPERADMIN', true);
  const res = await middleware(request('https://admin.kandypack.lk/admin/users', 'token'));
  assert.equal(new URL(res.headers.get('location')).pathname, '/profile');
  assert.equal((await middleware(request('https://admin.kandypack.lk/profile', 'token'))).status, 200);
});
test('superadmin login redirects to reused staff management page', async () => {
  session('SUPERADMIN');
  const res = await middleware(request('https://admin.kandypack.lk/login', 'token'));
  assert.equal(new URL(res.headers.get('location')).pathname, '/admin/users');
});
