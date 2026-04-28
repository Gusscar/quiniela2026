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

  // Don't intercept cross-origin requests (e.g. flag images from flagcdn.com)
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

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

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Quiniela Mundial 2026', body: event.data.text() };
  }

  const { title, body, icon, url } = payload;

  event.waitUntil(
    self.registration.showNotification(title ?? 'Quiniela Mundial 2026', {
      body,
      icon: icon ?? '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: url ?? '/predictions' },
      vibrate: [200, 100, 200],
    })
  );
});

// Open app when user taps notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/predictions';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
