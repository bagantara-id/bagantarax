const CACHE_NAME = 'bagantara-core-v4'; // Pembaruan Versi Cache

const staticAssets = [
    './',
    './index.html',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/logo-3d.png'
];

self.addEventListener('install', async event => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(staticAssets);
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const req = event.request;
    
    // TAKTIK LIVE-FETCH (Anti-Cache mutlak untuk JSON / Google Sheets)
    if (req.url.includes('.json') || req.url.includes('docs.google.com')) {
        event.respondWith(networkFirst(req));
    } else {
        event.respondWith(cacheFirst(req));
    }
});

async function cacheFirst(req) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    // Jika gagal mencari di cache atau internet, fallback ke index.html
    return cached || fetch(req).catch(() => caches.match('./index.html'));
}

async function networkFirst(req) {
    try {
        const fresh = await fetch(req, { cache: 'no-store' });
        return fresh;
    } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(req);
    }
}
