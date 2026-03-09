const CACHE_NAME = 'pokeguess-cache-v5'; 
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching nye filer...');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Sletter gammel cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  const isRender = url.hostname.includes('onrender.com');
  const isApi = url.pathname.startsWith('/content') || 
                url.pathname.startsWith('/user') || 
                url.pathname.startsWith('/status');
  const isPdf = url.pathname.toLowerCase().endsWith('.pdf');

  if (isRender || isApi || isPdf) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: "Kunne ikke koble til serveren" }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});