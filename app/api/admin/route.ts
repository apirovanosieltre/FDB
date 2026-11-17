import {isAdmin} from '../../../lib/admin-auth';
import {getDb} from '../../../db';
import {reservations} from '../../../db/schema';
import {desc} from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!await isAdmin(request))return Response.json({error:'Please sign in to access the guest list.'},{status:401,headers:{'Cache-Control':'no-store'}});
 try{return Response.json(await getDb().select({id:reservations.id,firstName:reservations.firstName,lastName:reservations.lastName,experience:reservations.experience,createdAt:reservations.createdAt}).from(reservations).orderBy(desc(reservations.createdAt)),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'The guest list is unavailable. Please try again.'},{status:503})}}
