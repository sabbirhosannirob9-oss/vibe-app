/* ============================================
   VIBE — Service Worker
   ============================================
   Offline caching + faster loads
============================================ */

const CACHE_NAME = 'vibe-v1.0.0';
const RUNTIME_CACHE = 'vibe-runtime-v1';

// Files to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/setup.html',
  '/app.html',
  '/css/global.css',
  '/css/auth.css',
  '/css/app.css',
  '/js/config.js',
  '/js/supabase-client.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/setup.js',
  '/js/app.js',
  '/manifest.json',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/favicon.ico'
];

// ============================================
// INSTALL — Pre-cache essential files
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 SW: Pre-caching files');
        // Use individual adds so one failure doesn't break everything
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
// ACTIVATE — Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating...');

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
// FETCH — Serve from cache, fallback to network
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API calls (always use network — real-time data)
  if (url.hostname.includes('supabase.co')) return;

  // Skip Google Fonts API
  if (url.hostname.includes('fonts.googleapis.com')) return;

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') return;

  // ============================================
  // Strategy:
  // 1. HTML pages → Network first, cache fallback
  // 2. Static assets (CSS/JS/images) → Cache first, network fallback
  // ============================================

  if (request.mode === 'navigate' || request.destination === 'document') {
    // Network first for HTML
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

  // Cache first for static assets
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            // Only cache successful responses
            if (!response || response.status !== 200) return response;

            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
            return response;
          })
          .catch(() => {
            // Offline fallback for images
            if (request.destination === 'image') {
              return new Response('', { status: 404 });
            }
          });
      })
  );
});

// ============================================
// MESSAGE — Handle skip waiting
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});