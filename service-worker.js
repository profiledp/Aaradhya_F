const CACHE_NAME = 'aaradhya-mart-pwa-v1';
const CORE = ['./', './index.html', './manifest.json'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const req = event.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') { event.respondWith(fetch(req).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)); return res; }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))); return; }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => { if(res.ok){const copy=res.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));} return res; })));
});
