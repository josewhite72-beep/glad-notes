const CACHE = 'classlog-v2'; // versión nueva para forzar actualización de caché
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // HTML: red primero (para ver cambios), con respaldo en caché si no hay conexión
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const cl = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); return r;
      }).catch(() => caches.match(e.request).then(m => m || caches.match('./')))
    );
    return;
  }
  // Resto: caché primero
  e.respondWith(
    caches.match(e.request).then(m => m || fetch(e.request).then(r => {
      if (r.ok && r.url.startsWith(self.location.origin)) {
        const cl = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cl));
      }
      return r;
    }))
  );
});