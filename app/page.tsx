'use client';
import {useState,useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowRight,ChevronDown,Check, X,Utensils, Moon,Heart,Mountain,CalendarDays,Shirt,Download} from 'lucide-react';
import {experienceDownloads} from '../lib/experience-downloads';
const sleepoverDetailsNotice = 'The organiser will share pricing and room details.';

const options=[{id:'dinner',bookingLabel:'Booking the dinner only',image:'/dinner.webp',n:'01',title:'Dinner with Barbie',tag:'THE DINNER DATE',description:'A seat at the table, a birthday toast and all the magic of a night together.',details:'Join Barbie for dinner on 20 February at 8:00 PM at Hotel Vallunga, Campo Tartano. This experience includes dinner only, with no overnight stay.',icon:Utensils,includes:['Dinner on 20 February','A birthday evening together'],time:'20 FEB · FROM 8:00 PM'},{id:'sleepover',bookingLabel:'Booking the full experience',image:'/sleepover.webp',n:'02',title:'Barbie Sleepover',tag:'STAY A LITTLE LONGER',description:'Dinner is just the beginning. Stay the night, surrounded by mountains and pink dreams.',details:'Make a night of it: dinner on 20 February and an overnight stay at Hotel Vallunga, checking out on 21 February. ' + sleepoverDetailsNotice,icon:Moon,includes:['Everything in Dinner with Barbie','Overnight stay, 20–21 February'],time:'20–21 FEB · DINNER + STAY'},{id:'note',bookingLabel:'Sending love',image:'/note.webp',n:'03',title:'Love Note for Barbie',tag:'WITH LOVE, FROM AFAR',description:'Can’t make it? Send a little love and let Barbie know you’ll be there in spirit.',details:'Sorry, I can’t make it. Choose this option to let Barbie know you won’t be joining the celebration. We’ll save your name as a decline, with love — no dinner or overnight stay will be booked.',icon:Heart,includes:[],time:'SENDING LOVE · NOT ATTENDING'}];

const venueMapsUrl = "https://www.google.com/maps/search/?api=1&query=Hotel+Vallunga+Campo+Tartano";

type ReservationReceipt = {
  id: string;
  firstName: string;
  lastName?: string;
  experience: string;
  existing?: boolean;
  editToken?: string;
  allergyDetails?: string | null;
};

function Confirmation({receipt, onDietarySaved}: {receipt: ReservationReceipt; onDietarySaved: (notes: string | null) => void}) {
  const experience = options.find(option => option.id === receipt.experience);
  const links = experienceDownloads(receipt.experience);
  const guestName = [receipt.firstName, receipt.lastName].filter(Boolean).join(' ');

  return (
    <section id="confirmed" className="confirmation" tabIndex={-1} aria-labelledby="confirmation-title">
      {experience && <img className="confirmation-cover" src={experience.image} alt="" width={970} height={489}/>}
      <div className="eyebrow">{receipt.existing ? 'YOUR EXISTING RSVP' : links ? 'RESERVATION CONFIRMED' : 'RSVP RECEIVED'}</div>
      <h2 id="confirmation-title">{experience?.title ?? 'Your RSVP'}</h2>
      <p className="confirmation-guest">{guestName} · RSVP {receipt.id.slice(0, 8).toUpperCase()}</p>

      {links ? <>
        <dl className="confirmation-details">
          <div>
            <dt>When</dt>
            <dd><strong><time dateTime="2027-02-20">Saturday, 20 February 2027</time></strong></dd>
            <dd>Dinner at <time dateTime="2027-02-20T20:00:00+01:00">20:00</time>{receipt.experience === 'sleepover' && <> · Checkout <time dateTime="2027-02-21">Sunday, 21 February</time></>}</dd>
            {receipt.experience === 'sleepover' && <dd>{sleepoverDetailsNotice}</dd>}
          </div>
          <div>
            <dt>Where</dt>
            <dd><strong>Hotel Vallunga, Campo Tartano</strong></dd>
            <dd><a className="text-link confirmation-map" href={venueMapsUrl} target="_blank" rel="noreferrer">Open in Maps <ArrowUpRight size={14}/></a></dd>
          </div>
          <div>
            <dt>Dress code</dt>
            <dd><strong>Think pink!</strong></dd>
          </div>
        </dl>

        <div id="confirmation-actions" className="confirmation-actions">
          <a className="button confirmation-pdf" href={links.pdf} download><Download size={17}/> Download experience PDF</a>
          <a className="button confirmation-calendar" href={links.google} target="_blank" rel="noopener noreferrer">Google Calendar <ArrowUpRight size={15}/></a>
          <a className="button confirmation-calendar" href={links.ics} download aria-describedby="calendar-download-help"><CalendarDays size={15} aria-hidden="true"/> Download for Apple Calendar</a>
          <small id="calendar-download-help">
            On iPhone, find the calendar file in Safari’s Downloads. To add the event, open the file as an attachment in Apple Mail.
          </small>
        </div>
      </> : <div className="confirmation-declined">
        <h3>We’ll miss you, {receipt.firstName}.</h3>
        <p>Thanks for letting us know you can’t make it.</p>
      </div>}

      {links && <DietaryManager receipt={receipt} onSaved={onDietarySaved}/>}
      <div className="confirmation-footer">
        {receipt.existing && <p role="status">You already sent an RSVP. This is your saved response.</p>}
        <p>{links ? 'To change the experience itself, contact the organiser. Food allergy details can be edited above when editing access is available.' : 'To change your RSVP, contact the organiser.'}</p>
      </div>
    </section>
  );
}


function DietaryManager({receipt, onSaved}: {receipt: ReservationReceipt; onSaved: (notes: string | null) => void}) {
  const [current, setCurrent] = useState<string | null>(receipt.allergyDetails ?? null);
  const [choice, setChoice] = useState<'yes' | 'no'>(receipt.allergyDetails ? 'yes' : 'no');
  const [notes, setNotes] = useState(receipt.allergyDetails ?? '');
  const [consent, setConsent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(Boolean(receipt.editToken));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!receipt.editToken) return;
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/api/rsvp/manage', {
          method:'POST', headers:{'Content-Type':'application/json'}, cache:'no-store',
          body:JSON.stringify({id:receipt.id, editToken:receipt.editToken})
        });
        const data = await response.json() as {error?:string; reservation?:{allergyDetails:string | null}};
        if (!response.ok || !data.reservation) throw Error(data.error || 'Could not load your dietary details.');
        if (cancelled) return;
        const saved = data.reservation.allergyDetails;
        setCurrent(saved);
        setChoice(saved ? 'yes' : 'no');
        setNotes(saved ?? '');
        onSaved(saved);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your dietary details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {cancelled = true;};
  // The access credential identifies this booking. A local note update must not refetch the same booking.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.id, receipt.editToken]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receipt.editToken || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/rsvp/manage', {
        method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          id:receipt.id,editToken:receipt.editToken,hasAllergies:choice==='yes',
          allergyDetails:choice==='yes' ? notes : '',dietaryConsent:choice==='yes' && consent
        })
      });
      const data = await response.json() as {error?:string;allergyDetails?:string|null};
      if (!response.ok) throw Error(data.error || 'Could not update dietary details.');
      const saved = data.allergyDetails ?? null;
      setCurrent(saved);
      setNotes(saved ?? '');
      setChoice(saved ? 'yes' : 'no');
      setEditing(false);
      setConsent(false);
      setNotice('Your dietary details have been saved.');
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your dietary details.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="dietary-manage" aria-labelledby="dietary-heading">
    <h3 id="dietary-heading">Food allergies & intolerances</h3>
    {!receipt.editToken ? <p>To review or change dietary details for a booking made before this update, please contact the organiser.</p>
      : loading ? <p role="status">Loading your dietary details…</p>
      : editing ? <form onSubmit={save}>
        <fieldset className="dietary-question">
          <legend>Do you have any food allergies or intolerances?</legend>
          <div className="dietary-radio-options">
            <label><input type="radio" name="editAllergies" checked={choice==='yes'} onChange={()=>setChoice('yes')}/> Yes</label>
            <label><input type="radio" name="editAllergies" checked={choice==='no'} onChange={()=>setChoice('no')}/> No</label>
          </div>
        </fieldset>
        {choice==='yes' && <>
          <label className="dietary-description">Describe your allergies or intolerances
            <textarea value={notes} onChange={event=>setNotes(event.target.value)} rows={4} minLength={3} maxLength={1000} required placeholder="E.g. peanuts, lactose, gluten…"/>
          </label>
          <label className="dietary-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} required/>
            <span>I explicitly consent to my dietary details being used to organise my meal and shared with the organiser and venue kitchen if necessary.</span>
          </label>
        </>}
        <div className="dietary-buttons">
          <button className="button" type="submit" disabled={saving}>{saving?'Saving…':'Save dietary details'}</button>
          <button className="back" type="button" disabled={saving} onClick={()=>{setEditing(false);setError('');setChoice(current?'yes':'no');setNotes(current??'');}}>Cancel</button>
        </div>
      </form> : <>
        <p className="dietary-summary">{current ? <>Reported: <strong>{current}</strong></> : 'No food allergies or intolerances reported.'}</p>
        <button className="button dietary-edit-button" type="button" onClick={()=>{setEditing(true);setError('');setNotice('');setConsent(false);}}>Edit allergies / intolerances</button>
      </>}
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p role="status" className="dietary-notice">{notice}</p>}
  </section>;
}

export default function Home(){const [selected,setSelected]=useState<string|null>(null),[booking,setBooking]=useState(false),[hasAllergies,setHasAllergies]=useState<'yes'|'no'|''>(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState<ReservationReceipt|null>(null);const scrollToConfirmation=useRef(false);const requestId=useRef('');const close=useRef<HTMLButtonElement>(null);const trigger=useRef<HTMLElement|null>(null);
useEffect(()=>{try{const r=localStorage.getItem('fdb-confirmation');if(r)setReceipt(JSON.parse(r));}catch{}},[]);
useEffect(()=>{if(!selected)return;trigger.current=document.activeElement as HTMLElement;document.body.style.overflow='hidden';close.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null);if(e.key==='Tab'){const els=Array.from(document.querySelectorAll<HTMLElement>('.modal button:not([disabled]),.modal input,.modal textarea,.modal a'));const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow='';document.removeEventListener('keydown',key);trigger.current?.focus()}},[selected]);
useEffect(() => {
  if (!receipt || selected || !scrollToConfirmation.current) return;
  scrollToConfirmation.current = false;
  const target = document.getElementById('confirmed');
  target?.focus({preventScroll:true});
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target?.scrollIntoView({behavior:reduceMotion ? 'instant' : 'smooth', block:'start'});
}, [receipt, selected]);

function saveDietaryLocally(allergyDetails: string | null) {
 setReceipt(previous=>{
  if (!previous) return previous;
  const updated={...previous,allergyDetails};
  try{localStorage.setItem('fdb-confirmation',JSON.stringify(updated))}catch{}
  return updated;
 });
}
const opt=options.find(o=>o.id===selected);function open(id:string){requestId.current='';setBooking(false);setHasAllergies('');setError('');setSelected(id)}
async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;setBusy(true);setError('');const f=new FormData(e.currentTarget);requestId.current ||=crypto.randomUUID();const payload={firstName:f.get('firstName'),lastName:f.get('lastName'),experience:selected,requestId:requestId.current,accept:f.get('accept')==='on',website:f.get('website'),hasAllergies:selected==='note'?false:hasAllergies==='yes',allergyDetails:hasAllergies==='yes'?f.get('allergyDetails'):'',dietaryConsent:f.get('dietaryConsent')==='on'};try{const res=await fetch('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await res.json() as {id:string;error?:string;existing?:boolean;reservation?:ReservationReceipt};if(!res.ok)throw Error(data.error);const r={...(data.reservation??{id:data.id,firstName:String(payload.firstName ?? ''),lastName:String(payload.lastName ?? ''),experience:selected ?? ''}),existing:!!data.existing};scrollToConfirmation.current=true;setReceipt(r);try{localStorage.setItem('fdb-confirmation',JSON.stringify(r))}catch{}setSelected(null)}catch(err){setError(err instanceof Error?err.message:'Connection unavailable. Please try again.')}finally{setBusy(false)}}
return <><header><a className="brand" href="#">FDB<span>♡</span><small>BIRTHDAY CLUB</small></a><nav><a href="#experience">The experiences</a><a href="#details">The invitation</a></nav><a className="nav-cta" href={receipt?'#confirmed':'#experience'}>{receipt?'Your RSVP':'Will you join us?'} <ArrowUpRight size={15}/></a></header><main>
<section className="hero"><div className="hero-copy"><div className="eyebrow"><span/> VOL. 01 · THE WINTER BIRTHDAY EDITION</div><p className="script pretitle">You’re invited to</p><h1>Barbie<br/><em>Après-Ski</em><span className="star">✧</span></h1><div className="birthday"><span className="rule"/> THE PINK <b>30s</b> <span className="rule"/></div><p className="intro">Thirty candles. A hideaway in the mountains.<br/>And you, in your pinkest era yet.</p><a href={receipt ? '#confirmed' : '#experience'} className="button">{receipt ? 'See your experience' : 'Choose your Experience'} <ArrowDownIcon/></a><div className="hero-meta"><CalendarDays size={17}/><span>20–21 FEBRUARY 2027</span><i/> <span>CAMPO TARTANO</span></div></div><div className="poster-wrap"><div className="poster-top">A WEEKEND TO REMEMBER <span>♡</span></div><img className="poster" src="/invitation-updated.webp" alt="Barbie Après-Ski invitation, Pink 30s, Hotel Vallunga in Campo Tartano, 20–21 February 2027 at 8:00 PM, dress code Think Pink"/><div className="round-sticker">THINK<br/><b>pink!</b><Heart size={16}/></div><div className="poster-bottom">SNOWFLAKES, BIRTHDAY WISHES & A LITTLE PINK MAGIC.</div></div></section>
<PinkBanner/>
<section id="experience" className="experiences"><div className="section-top"><div><div className="eyebrow">YOUR INVITATION, YOUR WAY</div><h2>Choose your <em>Experience</em><span>♡</span></h2></div><p>Choose your way to celebrate and bring some pink!</p></div><div className="cards">{options.map(o=><button className={'experience '+o.id} key={o.id} onClick={()=>open(o.id)}><div className="card-top"><span>No. {o.n}</span><span>{o.id==='sleepover'?'THE FULL EXPERIENCE':o.id==='note'?'LOVE FROM AFAR':'Dinner only'}</span></div><img src={o.image} alt={o.title} style={{width:"100%",height:"auto",display:"block"}} loading="lazy"/><div className="card-content"><div className="eyebrow">{o.tag}</div><h3>{o.title}</h3><p>{o.description}</p><div className="card-footer"><span>{o.time}</span><span className="circle"><ArrowUpRight size={20}/></span></div></div></button>)}</div><p className="footnote"><Heart size={14}/> One RSVP per person, so every name has its own special place.</p></section>
{receipt && <Confirmation receipt={receipt} onDietarySaved={saveDietaryLocally}/>}
<section className="details" id="details"><div className="details-heading"><div className="eyebrow">SAVE THE DATE, DARLING</div><h2>Your weekend<br/><em>in shades of pink.</em></h2><p>Mountain air, cosy vibes and a birthday to remember. All that’s missing is your RSVP.</p><a className="text-link" href={venueMapsUrl} target="_blank" rel="noreferrer">Find the venue <ArrowUpRight size={17}/></a></div><div className="detail-list"><article><CalendarDays/><div><small>WHEN</small><h3>20–21 February 2027</h3><p>It all begins on 20 February at 8:00 PM.</p></div><span>01</span></article><article><Mountain/><div><small>WHERE</small><h3>Hotel Vallunga</h3><p>Campo Tartano · a dreamy mountain setting.</p></div><span>02</span></article><article><Shirt/><div><small>DRESS CODE</small><h3>Think pink!</h3><p>A little detail or a head-to-toe look. Let your pink shine.</p></div><span>03</span></article></div></section><PinkBanner/></main><footer><a className="brand" href="#">FDB<span>♡</span></a><p>MADE WITH LOVE, SNOW & A LOT OF PINK.</p><a href="/admin">Organiser area <ArrowUpRight size={13}/></a></footer>
{opt&&<div className="overlay" onClick={e=>{if(e.target===e.currentTarget&&!busy)setSelected(null)}}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal"><button className="close" aria-label="Close" ref={close} onClick={()=>setSelected(null)} disabled={busy}><X/></button><div className="eyebrow">EXPERIENCE No. {opt.n}</div><opt.icon className="modal-icon" size={42} strokeWidth={1}/><h2 id="modal-title">{opt.title}</h2><p>{opt.details}</p>{!booking?<><ul>{opt.includes.map(i=><li key={i}><Check size={16}/>{i}</li>)}</ul>{receipt?<div className="pink-note">You’ve already sent an RSVP from this device. To change your response, please contact the organiser.</div>:<button className="button" onClick={()=>setBooking(true)}>{opt.bookingLabel} <ArrowRight size={18}/></button>}</>:<form onSubmit={submit}><div className="pink-note">♡ No alter egos, darling — we want the real you! Please use your <b>real first and last name</b> so Barbie knows who’s replying.</div><div className="fields"><label>First name<input name="firstName" autoComplete="given-name" minLength={2} maxLength={60} required placeholder="Your first name"/></label><label>Last name<input name="lastName" autoComplete="family-name" minLength={2} maxLength={60} required placeholder="Your last name"/></label></div>
{opt.id!=='note' && <fieldset className="dietary-question">
 <legend>Do you have any food allergies or intolerances?</legend>
 <div className="dietary-radio-options">
  <label><input type="radio" name="hasAllergies" value="yes" checked={hasAllergies==='yes'} onChange={()=>setHasAllergies('yes')} required/> Yes</label>
  <label><input type="radio" name="hasAllergies" value="no" checked={hasAllergies==='no'} onChange={()=>setHasAllergies('no')} required/> No</label>
 </div>
 {hasAllergies==='yes' && <>
  <label className="dietary-description">Please tell us about your allergies / intolerances
   <textarea name="allergyDetails" rows={4} minLength={3} maxLength={1000} required placeholder="E.g. peanuts, lactose, gluten…"/>
  </label>
  <label className="dietary-consent"><input name="dietaryConsent" type="checkbox" required/>
   <span>I explicitly consent to these food allergy / intolerance details being used to organise my meal and shared with the organiser and venue kitchen if necessary.</span>
  </label>
 </>}
</fieldset>}
<label className="trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><label className="consent"><input type="checkbox" name="accept" required/> <span>I understand that my name and RSVP choice will only be used to organise this party, will be visible in the private organiser area, and will be kept for as long as needed to organise the event. For changes or deletion, I can contact the person who sent me this invitation.</span></label>{error&&<p className="error" role="alert">{error}</p>}<button className="button" disabled={busy}>{busy?'Saving your RSVP…':opt.id==='note'?'Sorry, I can’t make it':'Confirm my attendance'} <Heart size={17}/></button><button type="button" className="back" onClick={()=>setBooking(false)} disabled={busy}>Back to details</button></form>}</section></div>}</>}
function PinkBanner() {
  return <div className="ticker" aria-hidden="true"><span>THIRTY, FLIRTY & FROSTY</span> ✧ <span>THINK PINK</span> ♡ <span>MEET ME IN THE MOUNTAINS</span> ✧ <span>THIRTY, FLIRTY & FROSTY</span> ♡</div>;
}

function ArrowDownIcon(){return <ChevronDown size={18}/>}
