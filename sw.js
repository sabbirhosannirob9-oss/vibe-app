/* ============================================
   VIBE — Service Worker (v2)
   ============================================
   Offline caching + faster loads
============================================ */

const CACHE_NAME = 'vibe-v2.0.1';
const RUNTIME_CACHE = 'vibe-runtime-v2';

// Files to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/setup.html',
  '/app.html',
  '/manifest.json',

  // CSS
  '/css/global.css',
  '/css/auth.css',
  '/css/app.css',
  '/css/theme.css',
  '/css/premium.css',
  '/css/posts.css',

  // JS
  '/js/config.js',
  '/js/supabase-client.js',
  '/js/theme.js',
  '/js/icons.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/setup.js',
  '/js/gifts.js',
  '/js/posts.js',
  '/js/app.js',
  '/js/pwa.js',

  // Icons
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/favicon.ico',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/favicon-32x32.png'
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing v2...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 SW: Pre-caching files');
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`⚠️ SW: Failed to cache ${url}`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE
// ============================================
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating v2...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map(name => {
              console.log('🗑️ SW: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// FETCH
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('fonts.googleapis.com')) return;
  if (url.hostname.includes('fonts.gstatic.com')) return;
  if (url.hostname.includes('cdn.jsdelivr.net')) return;
  if (url.protocol === 'chrome-extension:') return;

  // HTML pages → Network first
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)
          .then(cached => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // Static assets → Cache first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200) return response;

            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
            return response;
          })
          .catch(() => {
            if (request.destination === 'image') {
              return new Response('', { status: 404 });
            }
          });
      })
  );
});

// ============================================
// MESSAGE
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});