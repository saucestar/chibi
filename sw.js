// TWEWY Co-op app (PWA): pages and site files come from the network first (always up to date) and fall back to the
// last copy when offline; data (Firebase, Discord, YouTube, the auth worker) is never cached here.
const CACHE = 'twewy-coop-v6';
const SHELL = ['app.html', 'i18n.js', 'language.js', 'english.js', 'language.css', 'auth.js', 'avatar.js', 'progress.js', 'chibi-data.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windows.some(client => client.visibilityState === 'visible')) return;
    let message = {};
    try { message = event.data ? event.data.json() : {}; } catch (_) {}
    await self.registration.showNotification(message.title || 'Nouveau message', {
      body: message.body || 'Un message chiffré t’attend dans le chat.',
      icon: './icons/player-pin.webp', badge: './icons/player-pin.webp',
      tag: message.data?.groupId ? 'twewy-chat-' + message.data.groupId : 'twewy-chat',
      data: message.data || {}
    });
  })());
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clients.some(client => client.visibilityState === 'visible')) return;
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (_) {}
    await self.registration.showNotification(payload.title || 'Nouveau message', {
      body: payload.body || 'Un message chiffré t’attend dans le chat.',
      icon: './icons/player-badge.webp', badge: './icons/player-badge.webp',
      tag: payload.data?.groupId ? 'twewy-chat-' + payload.data.groupId : 'twewy-chat',
      data: payload.data || {}
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) { await client.focus(); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow('./app.html');
  })());
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
