import {sameOrigin} from '../../../../lib/admin-auth';
import {sessionCookie} from '../../../../lib/admin-session';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({error: 'Invalid request.'}, {status: 403});
  return Response.json({ok: true}, {headers: {'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie('', 0)}});
}
