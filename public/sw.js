const CACHE_NAME = 'convortex-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.png',
  '/privacy',
  '/terms',
  '/help'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});