export const ADMIN_COOKIE = '__Host-fdb-admin';
export const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

export async function safeEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([left, right].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < x.length; i++) difference |= x[i] ^ y[i];
  return difference === 0;
}

export async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function createAdminSession(secret: string, now = Date.now()): Promise<string> {
  const expiry = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expiry}.${await sign(`fdb-admin:${expiry}`, secret)}`;
}

export async function verifyAdminSession(token: string, secret: string, now = Date.now()): Promise<boolean> {
  if (!secret || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expiry, signature] = token.split('.');
  const remaining = Number(expiry) - Math.floor(now / 1000);
  if (remaining <= 0 || remaining > SESSION_SECONDS) return false;
  return safeEqual(signature, await sign(`fdb-admin:${expiry}`, secret));
}

export function readAdminCookie(request: Request): string {
  const cookies = request.headers.get('cookie') ?? '';
  return cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1) ?? '';
}

export function sessionCookie(value: string, maxAge = SESSION_SECONDS): string {
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
