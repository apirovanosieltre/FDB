import {isAdmin} from '../../../lib/admin-auth';
import {getDb} from '../../../db';
import {reservations} from '../../../db/schema';
import {desc, eq} from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!await isAdmin(request))return Response.json({error:'Please sign in to access the guest list.'},{status:401,headers:{'Cache-Control':'no-store'}});
 try{return Response.json(await getDb().select({id:reservations.id,firstName:reservations.firstName,lastName:reservations.lastName,experience:reservations.experience,createdAt:reservations.createdAt,dietaryNotes:reservations.dietaryNotes}).from(reservations).orderBy(desc(reservations.createdAt)),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'The guest list is unavailable. Please try again.'},{status:503})}}

export async function PATCH(request: Request) {
 const headers = {'Cache-Control': 'no-store'};
 if (!await isAdmin(request)) {
   return Response.json({error: 'Please sign in to edit reservations.'}, {status: 401, headers});
 }
 if (request.headers.get('origin') !== new URL(request.url).origin) {
   return Response.json({error: 'Invalid request.'}, {status: 403, headers});
 }

 const changes = await request.json().catch(() => null) as {id?: unknown; experience?: unknown} | null;
 if (typeof changes?.id !== 'string' || !changes.id ||
     typeof changes.experience !== 'string' || !['dinner', 'sleepover', 'note'].includes(changes.experience)) {
   return Response.json({error: 'Choose a valid RSVP option.'}, {status: 400, headers});
 }

 try {
   const updated = await getDb().update(reservations)
     .set({experience: changes.experience, ...(changes.experience === 'note' ? {dietaryNotes: null} : {})})
     .where(eq(reservations.id, changes.id))
     .returning({id: reservations.id, experience: reservations.experience, dietaryNotes: reservations.dietaryNotes})
     .get();
   if (!updated) return Response.json({error: 'Reservation not found. Refresh the guest list.'}, {status: 404, headers});
   return Response.json(updated, {headers});
 } catch {
   return Response.json({error: 'Could not save the experience. Please try again.'}, {status: 503, headers});
 }
}
