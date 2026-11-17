import {getDb} from '../../../db';
import {reservations} from '../../../db/schema';
import {eq} from 'drizzle-orm';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request.'},{status:403});
 try{
 const raw=await req.json();if(!raw||typeof raw!=='object')return Response.json({error:'Invalid data.'},{status:400});const b=raw as Record<string,any>;const clean=(v:unknown)=>typeof v==='string'?v.trim().replace(/\s+/g,' '):'';
 const firstName=clean(b.firstName),lastName=clean(b.lastName);
 if(![firstName,lastName].every(v=>v.length>=2&&v.length<=60&&/^[\p{L}\p{M} '\u2019-]+$/u.test(v))||!['dinner','sleepover','note'].includes(b.experience)||!/^[-a-f0-9]{36}$/.test(b.requestId)||b.accept!==true)return Response.json({error:'Please enter your real first and last name and choose an RSVP option.'},{status:400});
 if(b.website)return Response.json({error:'Invalid request.'},{status:400});
 const db=getDb();const previous=await db.select().from(reservations).where(eq(reservations.requestId,b.requestId)).get();
 if(previous)return Response.json({id:previous.id});
 const id=crypto.randomUUID();await db.insert(reservations).values({id,firstName,lastName,experience:b.experience,createdAt:new Date().toISOString(),requestId:b.requestId}).onConflictDoNothing();
 return Response.json({id},{status:201});
 }catch{return Response.json({error:'We couldn’t save your RSVP. Please try again; your response won’t be duplicated.'},{status:503});}
}
