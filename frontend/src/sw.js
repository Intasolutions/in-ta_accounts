import { precacheAndRoute } from 'workbox-precaching';

// Precache resources
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen to push events
self.addEventListener('push', function(event) {
  let data = { title: 'New Notification', body: 'You have a new update.', url: '/' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Error parsing push data', e);
  }

  const options = {
    body: data.body,
    icon: '/favicon-square.png',
    badge: '/favicon-square.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: {
      url: data.url
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
