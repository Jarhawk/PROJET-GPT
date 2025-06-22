self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'MamaStock';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    data: { url: data.url },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const client of wins) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow && url) return self.clients.openWindow(url);
    })
  );
});
