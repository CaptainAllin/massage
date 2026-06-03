// Service Worker: app shell caching + push notifications

const CACHE_VERSION = 'v2';
const SHELL_CACHE = `wellness-shell-${CACHE_VERSION}`;
const API_CACHE = `wellness-api-${CACHE_VERSION}`;

// Pages to pre-cache for instant navigation
const SHELL_PAGES = ['/dashboard', '/appointments', '/clients', '/favicon.ico'];

// API routes to serve stale-while-revalidate
const CACHED_API_PREFIXES = [
  '/api/dashboard',
  '/api/appointments',
  '/api/clients',
  '/api/therapists',
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_PAGES)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API routes: stale-while-revalidate
  const isApiRoute = CACHED_API_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (isApiRoute) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached);
        // Return cached immediately, update in background
        return cached ?? networkFetch;
      })
    );
    return;
  }

  // Navigation requests: network-first, fall back to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((r) => r ?? caches.match('/dashboard'))
      )
    );
    return;
  }

  // Static JS/CSS/_next assets: cache-first (they have content hashes)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone()).catch(() => {});
        return res;
      })
    );
    return;
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Iris', body: event.data.text() };
  }

  const { title = 'Iris', body = '', icon, badge, data = {} } = payload;

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
