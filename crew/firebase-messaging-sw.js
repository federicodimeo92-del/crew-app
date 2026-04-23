// firebase-messaging-sw.js
// Service Worker per notifiche push in background (FCM)

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

// Gestione notifiche in background (quando app è chiusa/nascosta)
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Notifica ricevuta in background:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'Crew', {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.eventId || 'crew-notif',
    data: payload.data || {},
    vibrate: [200, 100, 200]
  });
});

// Click sulla notifica → apri/porta in primo piano l'app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const eventId = event.notification.data?.eventId;
  const url = eventId ? `/?event=${eventId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
