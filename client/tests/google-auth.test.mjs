import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(relativePath, dependencies = {}, globals = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, URL, URLSearchParams,
    require(name) { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name]; },
    ...globals
  });
  return exports;
}
function createHarness(signIn = async () => ({ data: { url: 'https://accounts.google.com/' }, error: null })) {
  const values = new Map();
  const storage = { setItem: (k, v) => values.set(k, v), getItem: (k) => values.get(k) ?? null, removeItem: (k) => values.delete(k) };
  const helpers = loadModule('../src/lib/auth-redirect.ts', {}, { sessionStorage: storage });
  let request;
  const service = loadModule('../src/services/auth.service.ts', {
    '../lib/supabase': { supabase: { auth: { signInWithOAuth: async (input) => { request = input; return signIn(input); } } } },
    '../lib/auth-redirect': helpers
  }, { window: { location: { origin: 'http://localhost:5173' } } });
  return { helpers, service, values, request: () => request };
}

test('return destinations preserve valid local pages, queries and anchors', () => {
  const { helpers } = createHarness();
  for (const path of ['/cart', '/checkout', '/seller/orders?group=active#latest', '/products?search=red%20shoes']) {
    assert.equal(helpers.safeReturnPath(path), path);
  }
});

test('external, malformed and auth-loop return paths are rejected', () => {
  const { helpers } = createHarness();
  for (const path of [null, {}, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/%5cevil.test', '/%2f%2fevil.test', '/\nevil.test', '/%00', '/%zz', '/login', '/LOGIN///', '/register?next=/cart', '/auth/callback#access_token=secret', '/x/../reset-password']) {
    assert.equal(helpers.safeReturnPath(path), '/', String(path));
  }
});

test('Google initiates through Supabase with only identity scopes and our callback', async () => {
  const { service, helpers, request } = createHarness();
  await service.signInWithGoogle('/checkout');
  assert.equal(helpers.readOAuthReturnPath(), '/checkout');
  const input = request();
  assert.equal(input.provider, 'google');
  assert.equal(input.options.redirectTo, 'http://localhost:5173/auth/callback');
  assert.equal(input.options.scopes, 'openid email profile');
  assert.equal(input.options.queryParams.prompt, 'select_account');
  assert.equal(input.options.queryParams.access_type, undefined);
  assert.ok(!('data' in input.options)); // No client-supplied roles or profile mutation.
});

test('return paths cannot leak across failed Google attempts', async () => {
  for (const failure of [async () => ({ error: { message: 'Provider unavailable' } }), async () => { throw new Error('Network unavailable'); }]) {
    const { service, helpers, values } = createHarness(failure);
    try { await service.signInWithGoogle('/admin'); } catch { /* Both failure shapes are supported. */ }
    assert.equal(helpers.readOAuthReturnPath(), '/');
    assert.equal(values.size, 0);
  }
});

test('blocked session storage falls back to home without blocking sign-in', () => {
  const blocked = () => { throw new Error('Storage disabled'); };
  const helpers = loadModule('../src/lib/auth-redirect.ts', {}, { sessionStorage: { getItem: blocked, setItem: blocked, removeItem: blocked } });
  assert.doesNotThrow(() => helpers.saveOAuthReturnPath('/cart'));
  assert.equal(helpers.readOAuthReturnPath(), '/');
  assert.doesNotThrow(() => helpers.clearOAuthReturnPath());
});

test('provider errors are recognized but untrusted descriptions are never displayed', () => {
  const { helpers } = createHarness();
  assert.match(helpers.googleCallbackError('?error=access_denied', ''), /cancelled/);
  assert.match(helpers.googleCallbackError('', '#error=access_denied'), /cancelled/);
  for (const query of ['?error=server_error&error_description=private-token', '?error_description=private-token', '?error_code=403']) {
    const message = helpers.googleCallbackError(query, '');
    assert.match(message, /could not be completed/);
    assert.ok(!message.includes('private-token'));
  }
  assert.equal(helpers.googleCallbackError('?next=https://evil.test', '#access_token=private-token'), null);
});
