// TraceNaira phone alerts. The server sends { title, body, url, tag } and this shows it.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try {
    const msg = e.data ? e.data.json() : {}
    d = msg.data || msg // Firebase wraps what we send in "data"
  } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(d.title || 'TraceNaira', {
      body: d.body || '',
      icon: '/icons/icon-192.png',
      tag: d.tag, // a newer alert for the same case replaces the older one
      data: { url: d.url || '/home' },
    })
  )
})

// Tapping the alert opens the case, reusing an open TraceNaira tab if there is one
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL(e.notification.data?.url || '/home', self.location.origin).href
  e.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const tab of tabs) {
        if (new URL(tab.url).origin !== self.location.origin) continue
        try {
          await tab.focus()
          await tab.navigate(url)
          return
        } catch (_) {}
      }
      await self.clients.openWindow(url)
    })()
  )
})