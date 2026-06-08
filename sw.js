// ── Service Worker — Hydrate PWA ──────────────────────
const CACHE = 'hydrate-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.filter(a => !a.includes('icon'))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// ── Push notification handler ──────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '💧 Time to Hydrate!', {
      body:    data.body || 'Drink a glass of water right now 🌊',
      icon:    '/icons/icon-192.png',
      badge:   '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag:     'water',
      renotify: true,
      actions: [
        { action: 'log',  title: '✓ I drank water!' },
        { action: 'skip', title: 'Skip' }
      ]
    })
  );
});

// ── Notification click ────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'log') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        if (clients.length) {
          clients[0].focus();
          clients[0].postMessage({ type: 'LOG_WATER', amt: 250 });
        } else {
          self.clients.openWindow('/');
        }
      })
    );
  } else {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length) clients[0].focus();
        else self.clients.openWindow('/');
      })
    );
  }
});
