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

let badgeCount = 0;

function setBadge(count) {
  badgeCount = count;
  if ('setAppBadge' in self.navigator) {
    if (count > 0) self.navigator.setAppBadge(count).catch(() => {});
    else self.navigator.clearAppBadge().catch(() => {});
  }
}

// Intercetta push nativo PRIMA di Firebase — necessario per badge su MIUI
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

self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_BADGE') setBadge(0);
  if (event.data?.type === 'SET_BADGE') setBadge(event.data.count || 0);
});
