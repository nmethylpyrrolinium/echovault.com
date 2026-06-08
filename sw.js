importScripts('version.js');

// Keep every cache tied to the shared release so GitHub Pages updates purge old local assets together.
const RELEASE = self.ECHOVAULT_RELEASE;
const CACHE_PREFIX = 'echovault-';
const PRECACHE_CACHE = `${CACHE_PREFIX}precache-${RELEASE}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${RELEASE}`;

const toScopeUrl = (path) => new URL(path, self.registration.scope).toString();
const PRECACHE = [
  './',
  'index.html',
  'version.js',
  'styles.css',
  'phase2-emotional-intelligence.js',
  'script.js',
  'manifest.json',
  'icons/icon.svg',
  'wrapped-cinematic-module.js'
];
const PRECACHE_URLS = PRECACHE.map(toScopeUrl);
const FALLBACK_INDEX = toScopeUrl('index.html');
const ICON_URL = toScopeUrl('icons/icon.svg');

function canCache(response) {
  return Boolean(response && response.ok && (response.type === 'basic' || response.type === 'cors'));
}

async function putRuntime(request, response) {
  if (!canCache(response)) return;
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response.clone());
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    await putRuntime(request, response);
    return response;
  } catch (error) {
    return (await caches.match(request))
      || (fallbackUrl ? await caches.match(fallbackUrl) : null)
      || new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await putRuntime(request, response);
    return response;
  } catch (error) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Claim clients only after removing prior EchoVault releases; unrelated origin caches remain untouched.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && ![PRECACHE_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true }))
      .then((clients) => clients.forEach((client) => client.postMessage({
        type: 'SW_ACTIVATED',
        release: RELEASE,
        caches: [PRECACHE_CACHE, RUNTIME_CACHE]
      })))
  );
});

// Runtime-cache only same-origin shell assets; cross-origin CDNs remain network-managed.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, FALLBACK_INDEX));
    return;
  }

  const isCodeAsset = ['script', 'style', 'worker'].includes(request.destination)
    || /\.(?:css|js)$/i.test(url.pathname);
  if (isCodeAsset) {
    event.respondWith(networkFirst(request));
    return;
  }

  const isStaticAsset = ['font', 'image'].includes(request.destination)
    || /\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$/i.test(url.pathname);
  if (isStaticAsset) event.respondWith(cacheFirst(request));
});

self.addEventListener('push', (event) => {
  let data = { title: 'EchoVault', body: 'A feeling is waiting.' };
  try {
    data = { ...data, ...(event.data?.json() || {}) };
  } catch (error) {
    const body = event.data?.text();
    if (body) data.body = body;
  }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: ICON_URL, badge: ICON_URL, tag: 'echovault' }));
});
