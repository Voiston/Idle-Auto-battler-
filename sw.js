// GOLEM.EXE — Service Worker v1.0
const CACHE_NAME = 'golem-exe-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap',
];

// ── Install: cache core assets ─────────────────────────────────
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(ASSETS.filter(u => !u.startsWith('http')));
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────────
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for local, network-first for fonts ──────
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);

  // Network-first for Google Fonts
  if (url.hostname.includes('fonts.g')) {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(evt.request, clone));
          return res;
        })
        .catch(() => caches.match(evt.request))
    );
    return;
  }

  // Cache-first for everything else
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(evt.request, clone));
        return res;
      });
    })
  );
});

// ── Background Sync: save game state when back online ─────────
self.addEventListener('sync', (evt) => {
  if (evt.tag === 'sync-save') {
    console.log('[SW] Background sync: saving game state');
  }
});

// ── Push Notifications (future wave alerts) ───────────────────
self.addEventListener('push', (evt) => {
  const data = evt.data?.json() || { title: 'GOLEM.EXE', body: 'Une nouvelle vague approche!' };
  evt.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'wave-alert',
      renotify: true,
    })
  );
});
