// Service Worker: push notifications + offline caching for appointments

const CACHE_NAME = 'wellness-crm-v1';
const APPOINTMENTS_CACHE = 'appointments-cache-v1';

// Cache these static assets for offline use
const STATIC_ASSETS = ['/dashboard', '/appointments', '/favicon.ico'];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_ASSETS).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== APPOINTMENTS_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for appointments API ────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache appointments API responses (stale-while-revalidate)
  if (url.pathname.startsWith('/api/appointments') && event.request.method === 'GET') {
    event.respondWith(
      caches.open(APPOINTMENTS_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request)
          .then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);

        // Return cached immediately, update in background
        return cached || networkPromise;
      })
    );
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Wellness CRM', body: event.data.text() };
  }

  const { title = 'Wellness CRM', body = '', icon, badge, data = {} } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      data,
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// ── Notification click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
