// STEM Workshop – Stale-While-Revalidate Service Worker
// Caches all local assets + Google Fonts for 100% offline operation.

const CACHE_NAME = 'stem-workshop-v1';

// Install: pre-cache the app shell using relative paths for subfolder compatibility
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './favicon.svg'
      ]);
    })
  );
});

// Activate: claim clients and purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML/navigation, Stale-While-Revalidate for other static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' || 
                       request.url.endsWith('/') || 
                       request.url.endsWith('index.html');

  if (isNavigation) {
    // Network-First strategy to ensure latest script bundle hash when online
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  } else {
    // Stale-While-Revalidate strategy for static assets (JS, CSS, SVGs, Fonts)
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Cache both successful (200) and opaque (0) cross-origin assets like Google Fonts
              if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
  }
});
