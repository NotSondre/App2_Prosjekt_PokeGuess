const CACHE_NAME = 'pokeguess-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets...');
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => console.error('Feilet ved caching av:', url, err));
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});