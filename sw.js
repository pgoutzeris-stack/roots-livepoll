// ROOTS Live Poll – Service Worker
// Strategy: network-first for HTML/JS/CSS, cache-first for assets
// Cache name versioned via __BUILD__ placeholder (replaced by deploy workflow)

const CACHE_NAME = 'lp-cache-__BUILD__';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './templates.js',
  './viz.js',
  './lp-core.js',
  './lp-features.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k.startsWith('lp-cache-')).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Don't intercept Supabase/realtime/auth — must be fresh
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in') ||
    url.protocol === 'ws:' || url.protocol === 'wss:'
  ) return;

  // Network-first for app shell (HTML, JS, CSS)
  const isShell = APP_SHELL.some((p) => url.pathname.endsWith(p.replace('./', '/')));
  if (isShell || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Cache-first for images, fonts, icons
  if (req.destination === 'image' || req.destination === 'font' || url.pathname.includes('/fonts/')) {
    event.respondWith(cacheFirst(req));
    return;
  }
});

async function networkFirst(req) {
  try {
    const resp = await fetch(req);
    if (resp && resp.ok && resp.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, resp.clone()).catch(() => {});
    }
    return resp;
  } catch (e) {
    const cached = await caches.match(req);
    return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp && resp.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, resp.clone()).catch(() => {});
    }
    return resp;
  } catch (e) {
    return cached || Response.error();
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
