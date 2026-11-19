'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,Download,RefreshCw,Heart,Pencil} from 'lucide-react';
type Row={id:string;firstName:string;lastName:string;experience:string;createdAt:string};
const experienceLabel=(id:string)=>id==='dinner'?'Dinner with Barbie':id==='sleepover'?'Barbie Sleepover':'Love Note for Barbie · Not attending';
export default function Admin(){const[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[denied,setDenied]=useState(false),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[signingIn,setSigningIn]=useState(false),[loginError,setLoginError]=useState('');async function load(){setLoading(true);setError('');try{const r=await fetch('/api/admin',{cache:'no-store'});const d=await r.json() as Row[] & {error?:string};if(!r.ok){setDenied(r.status===401);throw Error(d.error)}setRows(d);setDenied(false)}catch(e){setError(e instanceof Error?e.message:'Connection unavailable.')}finally{setLoading(false)}}useEffect(()=>{load()},[]);async function login(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(signingIn)return;setSigningIn(true);setLoginError('');const form=event.currentTarget;const data=new FormData(form);try{const response=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:data.get('username'),password:data.get('password')})});const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error);form.reset();await load()}catch(e){setLoginError(e instanceof Error?e.message:'Unable to sign in. Please try again.')}finally{setSigningIn(false)}}
async function logout(){try{const response=await fetch('/api/admin/logout',{method:'POST'});if(!response.ok)throw Error('Unable to sign out. Please try again.');setRows([]);setEditing(null);setEditError('');setEditNotice('');setQuery('');setFilter('all');setDenied(true);setError('Please sign in to access the guest list.')}catch(e){setError(e instanceof Error?e.message:'Connection unavailable.')}}
const [editing, setEditing] = useState<{id:string; experience:string} | null>(null);
const [saving, setSaving] = useState(false);
const [editError, setEditError] = useState('');
const [editNotice, setEditNotice] = useState('');

async function saveExperience(event: React.FormEvent<HTMLFormElement>, row: Row) {
  event.preventDefault();
  if (!editing || editing.id !== row.id || saving) return;
  setSaving(true);
  setEditError('');
  try {
    const response = await fetch('/api/admin', {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(editing),
    });
    const result = await response.json() as {id:string; experience:string; error?:string};
    if (!response.ok) throw Error(result.error || 'Could not save the experience.');
    setRows(previous => previous.map(guest => guest.id === result.id ? {...guest, experience:result.experience} : guest));
    setEditing(null);
    setEditNotice(`Saved ${row.firstName} ${row.lastName}’s RSVP as ${experienceLabel(result.experience)}.`);
  } catch (error) {
    setEditError(error instanceof Error ? error.message : 'Could not save the experience.');
  } finally {
    setSaving(false);
  }
}

const dinnerOnly = rows.filter(row => row.experience === 'dinner').length;
const sleepover = rows.filter(row => row.experience === 'sleepover').length;
const declined = rows.filter(row => row.experience === 'note').length;
const filtered=rows.filter(r=>(filter==='all'||r.experience===filter)&&`${r.firstName} ${r.lastName}`.toLocaleLowerCase('en').includes(query.toLocaleLowerCase('en')));function csv(){const cell=(s:string)=>'"'+s.replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';const content='\uFEFF'+[['First name','Last name','Experience','RSVP date'],...filtered.map(r=>[r.firstName,r.lastName,experienceLabel(r.experience),r.createdAt])].map(r=>r.map(cell).join(';')).join('\r\n');const u=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=u;a.download='FDB-RSVPs.csv';a.click();URL.revokeObjectURL(u)}return <><header><a href="/" className="brand">FDB<span>♡</span><small>BIRTHDAY CLUB</small></a><a href="/" className="text-link"><ArrowLeft size={15}/> Back to the invitation</a></header><main className="admin-main"><div className="eyebrow">BEHIND THE PINK SCENES</div><div className="admin-top"><h1 style={{fontSize:46,letterSpacing:-2,margin:'14px 0'}}>The pink guest list.</h1><div className="admin-actions">{!denied&&!error&&!loading&&<button className="back" onClick={logout} disabled={saving}>Sign out</button>}<button className="button" onClick={load} disabled={loading || saving}><RefreshCw size={15}/> Refresh</button></div></div><p>Birthday RSVPs · 20–21 February 2027</p>{loading?<div className="admin-empty" role="status">Loading the guest list…</div>:error?<div className="admin-empty"><Heart/><p role="alert">{error}</p>{denied?<form className="admin-login" onSubmit={login}><div className="fields"><label>Username<input name="username" autoComplete="username" required maxLength={100} placeholder="Your username"/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={200} placeholder="Your password"/></label></div>{loginError&&<p className="error" role="alert">{loginError}</p>}<button className="button" type="submit" disabled={signingIn}>{signingIn?'Signing in…':'Sign in'}</button></form>:<button className="button" onClick={load}>Try again</button>}</div>:<><div role="status">{editNotice}</div><div className="admin-stats" role="group" aria-label="RSVP headcount">
  <article><strong>{dinnerOnly}</strong><span>Dinner only</span></article>
  <article><strong>{sleepover}</strong><span>Sleepover</span></article>
  <article><strong>{dinnerOnly+sleepover}</strong><span>Total attending dinner</span></article>
  <article><strong>{declined}</strong><span>Declined</span></article>
</div><div className="admin-controls"><input aria-label="Search guests" placeholder="Search first or last name…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter RSVPs" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All RSVP options</option><option value="dinner">Dinner with Barbie</option><option value="sleepover">Barbie Sleepover</option><option value="note">Love Note · Not attending</option></select><button onClick={csv} className="button" disabled={!filtered.length}><Download size={15}/> Export CSV</button></div>{!filtered.length?<div className="admin-empty">{rows.length?'No guests match your search.':'The guest list is waiting for its first name. Responses will appear here. ♡'}</div>:<div className="table-wrap guest-list"><table aria-label="Guest reservations"><thead><tr><th scope="col">GUEST</th><th scope="col">EXPERIENCE</th><th scope="col">RESPONDED</th><th scope="col">ACTIONS</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td className="guest-name">{r.firstName} {r.lastName}</td><td className="guest-experience"><span className="status-tag">{experienceLabel(r.experience)}</span></td><td className="guest-response"><span className="guest-response-label">Responded </span><time dateTime={r.createdAt}><span>{new Date(r.createdAt).toLocaleDateString('en-GB',{timeZone:'Europe/Rome',day:'numeric',month:'short',year:'numeric'})}</span><span className="guest-response-time">{new Date(r.createdAt).toLocaleTimeString('en-GB',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'})}</span></time></td><td className="guest-edit">
  {editing?.id === r.id ? <form onSubmit={event => saveExperience(event, r)}>
    <label>Experience
      <select value={editing.experience} onChange={event => setEditing({id:r.id, experience:event.target.value})} disabled={saving}>
        <option value="dinner">Dinner with Barbie</option>
        <option value="sleepover">Barbie Sleepover</option>
        <option value="note">Not attending</option>
      </select>
    </label>
    <div className="guest-edit-buttons">
      <button className="button" type="submit" disabled={saving || editing.experience === r.experience}>{saving ? 'Saving…' : 'Save'}</button>
      <button className="back" type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
    </div>
    {editError && <p className="error" role="alert">{editError}</p>}
  </form> : <button className="button" type="button" aria-label={`Edit reservation for ${r.firstName} ${r.lastName}`} disabled={saving} onClick={() => {
    setEditing({id:r.id, experience:r.experience});
    setEditError('');
    setEditNotice('');
  }}><Pencil size={14}/> Edit</button>}
</td></tr>)}</tbody></table></div>}<p className="footnote">{filtered.length} of {rows.length} responses · One RSVP = one person · Sleepover includes dinner.</p></>}</main></>}
