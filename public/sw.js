const CACHE_NAME = 'pokeguess-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/app.css',
  '/manifest.json',
  '/Terms%20Of%20Service%20-%20PokeGuesser.pdf',
  '/Privacy%20Policy%20-%20PokeGuesser.pdf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});