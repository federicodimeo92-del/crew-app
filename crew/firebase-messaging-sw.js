// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD-hemzJowgkYTDuSxdrZH7SbY3-rO6aQw",
  authDomain: "eventi-organizzati.firebaseapp.com",
  projectId: "eventi-organizzati",
  storageBucket: "eventi-organizzati.firebasestorage.app",
  messagingSenderId: "645333051282",
  appId: "1:645333051282:web:fef0e06f12283bd48c034b"
});

const messaging = firebase.messaging();

// ── CACHE ─────────────────────────────────────────────────────
const CACHE = 'crew-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Installa: metti in cache l'app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Attiva: rimuovi cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first per shell, network-first per Firebase/API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora richieste non GET e richieste a Firebase/API esterne
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('firestore') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) return;

  // Stale-while-revalidate per index.html
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match('/').then(cached => {
          const fetchPromise = fetch(event.request).then(res => {
            cache.put('/', res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Cache-first per icone e manifest
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── BADGE ─────────────────────────────────────────────────────
let badgeCount = 0;

function setBadge(count) {
  badgeCount = count;
  if ('setAppBadge' in self.navigator) {
    if (count > 0) self.navigator.setAppBadge(count).catch(() => {});
    else self.navigator.clearAppBadge().catch(() => {});
  }
}

// Push nativo per badge su MIUI
self.addEventListener('push', () => {
  badgeCount++;
  setBadge(badgeCount);
});

// Firebase gestisce la notifica visiva
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Crew', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.eventId || 'crew-notif',
    data: payload.data || {},
    vibrate: [200, 100, 200],
  });
});

// ── NOTIFICA CLICK ─────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  setBadge(0);
  const eventId = event.notification.data?.eventId;
  const url = eventId ? `/?event=${eventId}` : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'CLEAR_BADGE' });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── MESSAGGI DALL'APP ─────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_BADGE') setBadge(0);
  if (event.data?.type === 'SET_BADGE') setBadge(event.data.count || 0);
});
