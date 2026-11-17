import {getDb} from '../../../db';
import {reservations} from '../../../db/schema';
import {eq, isNull, or} from 'drizzle-orm';
import {cleanName, guestKey} from '../../../lib/rsvp-identity';
const headers = {'Cache-Control': 'no-store'};
const receipt = (row: typeof reservations.$inferSelect, existing: boolean) => Response.json({id: row.id, existing, reservation: {id: row.id, firstName: row.firstName, lastName: row.lastName, experience: row.experience}}, {status: existing ? 200 : 201, headers});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid request.'},{status:403});
 try{
 const raw=await req.json();if(!raw||typeof raw!=='object')return Response.json({error:'Invalid data.'},{status:400});const b=raw as Record<string,any>;
 const firstName=cleanName(b.firstName),lastName=cleanName(b.lastName);
 if(![firstName,lastName].every(v=>v.length>=2&&v.length<=60&&/^[\p{L}\p{M} '\u2019-]+$/u.test(v))||!['dinner','sleepover','note'].includes(b.experience)||!/^[-a-f0-9]{36}$/.test(b.requestId)||b.accept!==true)return Response.json({error:'Please enter your real first and last name and choose an RSVP option.'},{status:400});
 if(b.website)return Response.json({error:'Invalid request.'},{status:400});
 const db=getDb();
 const key=guestKey(firstName,lastName);
 // requestId preserves safe retries; the unique key protects simultaneous submissions.
 const candidates=await db.select().from(reservations).where(or(eq(reservations.guestKey,key),eq(reservations.requestId,b.requestId),isNull(reservations.guestKey)));
 const previous=candidates.find(row=>row.guestKey===key||guestKey(row.firstName,row.lastName)===key);
 if(previous)return receipt(previous,true);
 // A reused retry identifier must never disclose an unrelated guest's reservation.
 if(candidates.some(row=>row.requestId===b.requestId))return Response.json({error:'Please reopen the experience and try again.'},{status:409,headers});
 const id=crypto.randomUUID();
 const inserted=await db.insert(reservations).values({id,firstName,lastName,guestKey:key,experience:b.experience,createdAt:new Date().toISOString(),requestId:b.requestId}).onConflictDoNothing().returning().get();
 if(inserted)return receipt(inserted,false);
 const concurrent=await db.select().from(reservations).where(eq(reservations.guestKey,key)).get();
 if(concurrent)return receipt(concurrent,true);
 return Response.json({error:'Please reopen the experience and try again.'},{status:409,headers});
 }catch{return Response.json({error:'We couldn’t save your RSVP. Please try again; your response won’t be duplicated.'},{status:503,headers});}
}
