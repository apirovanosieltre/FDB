import {env} from 'cloudflare:workers';
import {readAdminCookie, verifyAdminSession} from './admin-session';
export function adminConfig() {
  const values = env as unknown as Record<string, string | undefined>;
  return {username: values.ADMIN_USERNAME, password: values.ADMIN_PASSWORD, secret: values.ADMIN_SESSION_SECRET};
}
export async function isAdmin(request: Request) {
  const {secret} = adminConfig();
  return !!secret && verifyAdminSession(readAdminCookie(request), secret);
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
