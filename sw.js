const CACHE_NAME = 'esquina-bar-pages-v5';
const BASE_URL = self.registration.scope;
const SHELL_PATHS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const SHELL_URLS = SHELL_PATHS.map(path => new URL(path, BASE_URL).toString());

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('esquina-bar-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const basePath = new URL(BASE_URL).pathname;
  if (url.origin !== self.location.origin || !url.pathname.startsWith(basePath)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(new URL('./index.html', BASE_URL).toString(), copy));
        }
        return response;
      }).catch(async () => {
        return (await caches.match(request)) ||
          (await caches.match(new URL('./', BASE_URL).toString())) ||
          (await caches.match(new URL('./index.html', BASE_URL).toString()));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        }
        return response;
      });
    })
  );
});
