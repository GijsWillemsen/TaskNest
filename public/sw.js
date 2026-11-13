// TaskNest Service Worker - Web Push & PWA Notification Handler

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle Push Notifications (Apple Web Push & Android / Desktop)
self.addEventListener('push', (event) => {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: 'TaskNest', body: event.data.text() }
    }
  }

  const title = data.title || 'TaskNest'
  const options = {
    body: data.body || 'Nieuwe update in jouw gezin!',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    tag: data.tag || 'tasknest-notification',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Focus or open app window when notification is tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl)
          }
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
