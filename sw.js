/* ============================================
   VIBE — Service Worker
   Version: 2.2.0
   ============================================
   Offline caching + faster loads
   - Full-screen profile page
   - Post image support
   - Avatar + cover upload
============================================ */

const CACHE_NAME = 'vibe-v2.2.0';
const RUNTIME_CACHE = 'vibe-runtime-v2.2.0';

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
  '/js/upload.js',        // ← v2.2.0 — MISSING ছিল, এখন যোগ
  '/js/app.js',
  '/js/pwa.js',

  // Icons
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/message.mp3',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/favicon-32x32.png'
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing v2.2.0...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 SW: Pre-caching files (v2.2.0)');
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
  console.log('✅ SW: Activating v2.2.0...');

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

  // Only GET requests
  if (request.method !== 'GET') return;

  // Skip external services (Supabase API, Storage, CDN, fonts)
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('supabase.in')) return;
  if (url.hostname.includes('fonts.googleapis.com')) return;
  if (url.hostname.includes('fonts.gstatic.com')) return;
  if (url.hostname.includes('cdn.jsdelivr.net')) return;
  if (url.hostname.includes('cloudflare.com')) return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.protocol === 'blob:') return;
  if (url.protocol === 'data:') return;

  // HTML pages → Network first, cache fallback
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

  // Static assets → Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200) return response;
            if (response.type === 'opaque') return response;

            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
            return response;
          })
          .catch(() => {
            if (request.destination === 'image') {
              return new Response('', { status: 404 });
            }
            return new Response('', { status: 504 });
          });
      })
  );
});

// ============================================
// MESSAGE (for skipWaiting)
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================
// PUSH NOTIFICATIONS (future)
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Vibe';
    const options = {
      body: data.body || 'New message',
      icon: '/assets/icons/android-chrome-192x192.png',
      badge: '/assets/icons/android-chrome-192x192.png',
      tag: data.tag || 'vibe-notification',
      data: data.url || '/app.html'
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn('Push parse error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data || '/app.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

console.log('[Vibe] sw.js loaded v2.2.0');