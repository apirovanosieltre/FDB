import {getDb} from '../../../../db';
import {reservations} from '../../../../db/schema';
import {and, eq} from 'drizzle-orm';
import {hashEditToken, parseDietaryInput} from '../../../../lib/rsvp-dietary';

const headers = {'Cache-Control': 'no-store'};
async function authenticate(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return {error:'Invalid request.',status:403} as const;
  const raw: unknown = await request.json().catch(()=>null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return {error:'Invalid data.',status:400} as const;
  const body = raw as Record<string, unknown>;
  if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id) ||
      typeof body.editToken !== 'string' || !/^[0-9a-f]{64}$/i.test(body.editToken))
    return {error:'This device cannot edit this RSVP. Please contact the organiser.',status:403} as const;
  return {body, id:body.id, hash:await hashEditToken(body.editToken)} as const;
}
async function findReservation(id:string,hash:string) {
  return getDb().select().from(reservations).where(and(eq(reservations.id,id),eq(reservations.editTokenHash,hash))).get();
}
export async function POST(request: Request) {
  try {
    const auth = await authenticate(request);
    if ('error' in auth) return Response.json({error:auth.error},{status:auth.status,headers});
    const row = await findReservation(auth.id,auth.hash);
    if (!row) return Response.json({error:'Editing access is not available for this RSVP.'},{status:403,headers});
    return Response.json({reservation:{id:row.id,experience:row.experience,allergyDetails:row.dietaryNotes}},{headers});
  } catch (error) {
    console.error('RSVP dietary read failed',error);
    return Response.json({error:'Unable to load your dietary requirements.'},{status:503,headers});
  }
}
export async function PATCH(request: Request) {
  try {
    const auth = await authenticate(request);
    if ('error' in auth) return Response.json({error:auth.error},{status:auth.status,headers});
    const row = await findReservation(auth.id,auth.hash);
    if (!row) return Response.json({error:'Editing access is not available for this RSVP.'},{status:403,headers});
    if (row.experience === 'note')
      return Response.json({error:'Dietary details are only needed for dinner and sleepover.'},{status:409,headers});
    const parsed = parseDietaryInput(auth.body,true);
    if (parsed.error) return Response.json({error:parsed.error},{status:400,headers});
    const updated = await getDb().update(reservations)
      .set({dietaryNotes:parsed.notes})
      .where(and(eq(reservations.id,auth.id),eq(reservations.editTokenHash,auth.hash)))
      .returning({allergyDetails:reservations.dietaryNotes}).get();
    if (!updated) return Response.json({error:'Reservation not found.'},{status:404,headers});
    return Response.json(updated,{headers});
  } catch (error) {
    console.error('RSVP dietary update failed',error);
    return Response.json({error:'Unable to update your dietary requirements.'},{status:503,headers});
  }
}
