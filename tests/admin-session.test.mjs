import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminSession, verifyAdminSession, safeEqual, readAdminCookie, sessionCookie, SESSION_SECONDS} from '../lib/admin-session.ts';
const secret = 'test-only-secret-never-used-for-production';
const now = 1_800_000_000_000;
test('accepts a valid signed session only with its secret', async () => {
  const token = await createAdminSession(secret, now);
  assert.equal(await verifyAdminSession(token, secret, now), true);
  assert.equal(await verifyAdminSession(token, 'different-secret', now), false);
});
test('rejects expired sessions and tampered expiry or signature', async () => {
  const token = await createAdminSession(secret, now);
  assert.equal(await verifyAdminSession(token, secret, now + SESSION_SECONDS * 1000), false);
  const [expiry, signature] = token.split('.');
  assert.equal(await verifyAdminSession(`${Number(expiry) + 1}.${signature}`, secret, now), false);
  assert.equal(await verifyAdminSession(`${expiry}.${signature.slice(0, 63)}${signature.endsWith('0') ? '1' : '0'}`, secret, now), false);
});
test('rejects malformed or unsigned cookies and missing configuration', async () => {
  for (const token of ['', 'admin=true', '123.abc', 'not-a-session']) {
    assert.equal(await verifyAdminSession(token, secret, now), false);
  }
  assert.equal(await verifyAdminSession(await createAdminSession(secret, now), '', now), false);
});
test('credential comparisons remain exact and case sensitive', async () => {
  assert.equal(await safeEqual('example-user', 'example-user'), true);
  assert.equal(await safeEqual('example-user', 'Example-user'), false);
  assert.equal(await safeEqual('test-password', 'wrong-password'), false);
});
test('only reads the exact protected cookie name', () => {
  assert.equal(readAdminCookie(new Request('https://example.test', {headers: {Cookie: 'other=1; __Host-fdb-admin=abc; another=2'}})), 'abc');
  assert.equal(readAdminCookie(new Request('https://example.test', {headers: {Cookie: '__Host-fdb-admin-extra=abc'}})), '');
});
test('session and logout cookies have security flags', () => {
  const cookie = sessionCookie('test-token');
  for (const flag of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict', `Max-Age=${SESSION_SECONDS}`]) assert.ok(cookie.includes(flag));
  assert.ok(sessionCookie('', 0).includes('Max-Age=0'));
});
