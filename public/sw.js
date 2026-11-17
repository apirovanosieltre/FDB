/* Only public fallback assets are cached. Never cache guest data or submissions. */
const CACHE = 'fdb-public-v1';
const ASSETS = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png', '/icons/apple-touch-icon.png'];
const assetPaths = new Set(ASSETS);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async path => {
      const response = await fetch(new Request(new URL(path, self.location.origin), {cache: 'reload', credentials: 'same-origin'}));
      if (!response.ok || response.redirected || new URL(response.url).pathname !== path) throw new Error('Offline asset unavailable');
      await cache.put(path, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await Promise.all((await caches.keys()).filter(key => key.startsWith('fdb-public-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || ['/signin-with-chatgpt', '/signout-with-chatgpt', '/callback'].includes(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html', {cacheName: CACHE})) || new Response('You are offline. Reconnect to continue.', {status: 503, headers: {'Content-Type': 'text/plain'}})));
    return;
  }
  if (assetPaths.has(url.pathname) && !url.search) {
    event.respondWith(caches.match(request, {cacheName: CACHE}).then(cached => cached || fetch(request)));
  }
});
