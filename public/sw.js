const CACHE_NAME = 'quiniela-v2';
const PRECACHE = ['/', '/predictions', '/rankings', '/teams', '/rules'];

// Activate immediately — no waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Remove old caches
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      // Take control of all open tabs immediately
      clients.claim(),
    ]).then(() => {
      // Tell every open tab: new version is live
      return clients.matchAll({ type: 'window' }).then((all) => {
        all.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Network-first for HTML navigation — always get fresh pages
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      }).catch(() => cached);

      return cached || network;
    })
  );
});
