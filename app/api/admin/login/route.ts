import {getDb} from '../../../../db';
import {adminLoginAttempts} from '../../../../db/schema';
import {sql, lt} from 'drizzle-orm';
import {adminConfig, sameOrigin} from '../../../../lib/admin-auth';
import {safeEqual, sign, createAdminSession, sessionCookie} from '../../../../lib/admin-session';
const headers = {'Cache-Control': 'no-store'};
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error: 'Invalid request.'}, {status: 403, headers});
  const {username, password, secret} = adminConfig();
  if (!username || !password || !secret) return Response.json({error: 'Admin sign-in is not configured.'}, {status: 503, headers});
  try {
    const input = await request.json() as {username?: unknown; password?: unknown};
    if (!input || typeof input.username !== 'string' || typeof input.password !== 'string' || input.username.length > 100 || input.password.length > 200) {
      return Response.json({error: 'Please enter your username and password.'}, {status: 400, headers});
    }
    const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
    const key = await sign(`login:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`, secret);
    const db = getDb();
    await db.delete(adminLoginAttempts).where(lt(adminLoginAttempts.bucket, bucket - 96));
    const attempt = await db.insert(adminLoginAttempts).values({id: key, bucket, attempts: 1}).onConflictDoUpdate({
      target: adminLoginAttempts.id,
      set: {
        bucket,
        attempts: sql`CASE WHEN ${adminLoginAttempts.bucket} = ${bucket} THEN ${adminLoginAttempts.attempts} + 1 ELSE 1 END`,
      },
    }).returning({attempts: adminLoginAttempts.attempts}).get();
    if (!attempt || attempt.attempts > 10) return Response.json({error: 'Too many sign-in attempts. Please try again in 15 minutes.'}, {status: 429, headers: {...headers, 'Retry-After': '900'}});
    const [validUsername, validPassword] = await Promise.all([safeEqual(input.username, username), safeEqual(input.password, password)]);
    if (!validUsername || !validPassword) return Response.json({error: 'Incorrect username or password.'}, {status: 401, headers});
    const token = await createAdminSession(secret);
    return Response.json({ok: true}, {headers: {...headers, 'Set-Cookie': sessionCookie(token)}});
  } catch {
    return Response.json({error: 'Unable to sign in. Please try again.'}, {status: 503, headers});
  }
}
