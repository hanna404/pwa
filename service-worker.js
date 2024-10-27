// service-worker.js
const CACHE_NAME = 'pwa-cache-v45';
const urlsToCache = [
    '/pwa/index.html',
    '/pwa/app.js?t=4',
    '/pwa/style.css',
    '/pwa/navbar.html',
    '/pwa/fallback.html' // Add a fallback page
];

// Install Service Worker and cache necessary files
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            self.skipWaiting(),
            caches.open(CACHE_NAME).then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
        ])
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Use cacheName here
                    }
                })
            );
        }).then(() => {
            // Clear local storage when cache is updated
            clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'clearLocalStorage' });
                });
            });
        })
    );
});

// Cache-then-Network strategy for fetching resources
self.addEventListener('fetch', event => {
    if (event.request.method === 'GET') {
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse; // Return the network response
                });
            }).catch(() => {
                // If network request fails, try to serve from the cache
                return caches.match(event.request).then(cachedResponse => {
                    return cachedResponse || fetch('/fallback.html'); // Provide a fallback page
                });
            })
        );
    } else {
        // For non-GET requests (like POST), just fetch from the network
        event.respondWith(fetch(event.request));
    }
});
