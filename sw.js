// TWEWY Co-op app (PWA): pages and site files come from the network first (always up to date) and fall back to the
// last copy when offline; data (Firebase, Discord, YouTube, the auth worker) is never cached here.
const CACHE = 'twewy-coop-v4';
const SHELL = ['app.html', 'i18n.js', 'auth.js', 'avatar.js', 'progress.js', 'chibi-data.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // Firebase, Discord, YouTube, fonts: straight to the network
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {          // always check the server: a new version shows at once
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('app.html')))
  );
});
