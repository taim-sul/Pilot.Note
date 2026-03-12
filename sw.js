// Bump version to force cache clear on all devices
const CACHE = 'pilotnote-v4';

// Only cache the app shell — never Firebase or external CDN scripts
const SHELL = [
  './index.html',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always go to network for Firebase, Google APIs, and CDN scripts
  if (
    url.includes('firebasejs') ||
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('cdnjs')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
