// Keep these version constants declared once only; duplicate consts break service-worker startup after merge regressions.
const APP_VERSION = 'bug-audit-reliability';
const CACHE = 'echovault-v19-bug-audit-reliability';

const toScopeUrl = (path) => new URL(path, self.registration.scope).toString();
const PRECACHE = ['./', 'index.html', 'styles.css', 'phase2-emotional-intelligence.js', 'script.js', 'manifest.json', 'icons/icon.svg', 'wrapped-cinematic-module.js'];
const PRECACHE_URLS = PRECACHE.map(toScopeUrl);
const FALLBACK_INDEX = toScopeUrl('index.html');
const ICON_URL = toScopeUrl('icons/icon.svg');

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE_URLS).catch(() => c.addAll([FALLBACK_INDEX])))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'SW_ACTIVATED', appVersion: APP_VERSION, cache: CACHE })))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then((r) => {
          if (r.ok) {
            const c = r.clone();
            caches.open(CACHE).then((ca) => ca.put(FALLBACK_INDEX, c));
          }
          return r;
        })
        .catch(() => caches.match(FALLBACK_INDEX).then((cached) => cached || new Response('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EchoVault Offline</title><style>body{font-family:system-ui;background:#050508;color:#f3e7c5;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center}p{opacity:.85;max-width:28rem}</style></head><body><main><h1>EchoVault is offline</h1><p>Your local echoes are still safe. Reconnect to sync cloud features.</p></main></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  const isFreshAsset = ['script', 'style', 'worker'].includes(e.request.destination)
    || /\.(?:css|js)$/i.test(url.pathname);

  if (isFreshAsset) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then((r) => {
          if (r.ok) {
            const c = r.clone();
            caches.open(CACHE).then((ca) => ca.put(e.request, c));
          }
          return r;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || new Response('', { status: 503 })))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request)
      .then((cached) => cached || fetch(e.request).then((r) => {
        if (r.ok) {
          const c = r.clone();
          caches.open(CACHE).then((ca) => ca.put(e.request, c));
        }
        return r;
      }).catch(() => new Response('', { status: 503 })))
  );
});

self.addEventListener('push', (e) => {
  let data = { title: 'EchoVault', body: 'A feeling is waiting.' };
  try {
    data = { ...data, ...(e.data?.json() || {}) };
  } catch (error) {
    const body = e.data?.text();
    if (body) data.body = body;
  }
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: ICON_URL, badge: ICON_URL, tag: 'echovault' }));
});
