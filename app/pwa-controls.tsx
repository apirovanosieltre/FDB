'use client';
import {useEffect, useRef, useState} from 'react';
import {Download, Heart} from 'lucide-react';
type InstallPrompt = Event & {prompt: () => Promise<void>; userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>};
export default function PwaControls() {
  const [installed, setInstalled] = useState(true);
  const [offline, setOffline] = useState(false);
  const [ready, setReady] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState('');
  const prompt = useRef<InstallPrompt | null>(null);
  const guide = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const updateInstalled = () => setInstalled(standalone.matches || !!(navigator as Navigator & {standalone?: boolean}).standalone);
    const updateConnection = () => setOffline(!navigator.onLine);
    const capture = (event: Event) => {event.preventDefault(); prompt.current = event as InstallPrompt; setReady(true)};
    const complete = () => {setInstalled(true); prompt.current = null; setReady(false)};
    updateInstalled(); updateConnection();
    standalone.addEventListener('change', updateInstalled);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', complete);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', {scope: '/', updateViaCache: 'none'}).catch(() => { /* Installation guidance still works if offline setup is unavailable. */ });
    return () => {
      standalone.removeEventListener('change', updateInstalled);
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', complete);
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);
  async function install() {
    const event = prompt.current;
    if (!event) {if (guide.current) guide.current.open = true; return}
    setInstalling(true); setMessage('');
    try {
      await event.prompt();
      const result = await event.userChoice;
      setMessage(result.outcome === 'accepted' ? 'Your browser is installing FDB-Birthday.' : 'No rush, darling. You can install it whenever you like.');
    } catch {setMessage('Use your browser menu to add FDB-Birthday to your home screen.'); if (guide.current) guide.current.open = true}
    finally {prompt.current = null; setReady(false); setInstalling(false)}
  }
  return <>{offline && <div className="connection-note" role="status">You’re offline. Reconnect to send your RSVP or view the guest list.</div>}{!installed && <aside className="pwa-panel" aria-label="Install FDB-Birthday"><div><span className="eyebrow">A LITTLE PINK, ALWAYS WITH YOU</span><h2>Take the party with you.<Heart size={23}/></h2><p>Add FDB-Birthday to your home screen for a little birthday magic, one tap away.</p></div><div className="pwa-actions"><button type="button" className="button" onClick={install} disabled={installing}><Download size={16}/>{installing?'Opening…':ready?'Install app':'Add to home screen'}</button><details ref={guide}><summary>How to install</summary><p><b>iPhone or iPad:</b> open this site in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> open the browser menu and choose Install app or Add to Home screen.</p><p><b>Desktop:</b> use the install icon in the address bar or your browser’s app menu, when available.</p><p>RSVPs and the organiser area need an internet connection.</p></details>{message && <p className="install-message" role="status">{message}</p>}</div></aside>}</>;
}
