// CHIBI auth worker (Cloudflare Workers, free plan)
//
// POST /session  { accessToken }  ->  { firebaseToken, user }
// POST /yt/search { q }            ->  { items: [{ id, title, channel, length, sec }] }   (members only, see below)
// POST /spotify   { ref }          ->  { name, tracks: [{ t, a, d }] }  Spotify or Apple Music (members only)
//   The phone app (PWA) can't read YouTube / Spotify pages itself (the browser blocks it): the worker does.
//   Both need "Authorization: Bearer <Firebase ID token>" of a signed-in member, checked with Google's keys.
//   1. asks Discord who owns the OAuth access token            (GET /users/@me)
//   2. checks that this user is a member of the Discord server   (GET /users/@me/guilds/{GUILD_ID}/member)
//   3. signs a Firebase custom token for uid "discord:<id>" with the claims
//      { discordId, discordName, admin } that the Realtime Database rules rely on.
//
// The Firebase service-account key never leaves this worker (secret FIREBASE_PRIVATE_KEY).
//
// Variables (wrangler.toml [vars]):  GUILD_ID, ADMIN_IDS ("id1,id2"), ALLOWED_ORIGINS ("https://x.github.io,...")
// Secrets (wrangler secret put):     FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

const DISCORD = 'https://discord.com/api/v10';
const FIREBASE_AUDIENCE = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';

let cachedKey = null;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = list(env.ALLOWED_ORIGINS);
    const cors = {
      'Access-Control-Allow-Origin': origin && allowed.includes(origin) ? origin : (allowed[0] || ''),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    // browsers always send Origin: only the site may call us from a browser (the launcher sends none)
    if (origin && !allowed.includes(origin)) return json({ error: 'origine refusée' }, 403, cors);
    if (request.method === 'POST' && (url.pathname === '/yt/search' || url.pathname === '/spotify')) {
      const who = await verifyIdToken(env, (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
      if (!who) return json({ error: 'connecte-toi' }, 401, cors);
      let b;
      try { b = await request.json(); } catch { return json({ error: 'requête invalide' }, 400, cors); }
      try {
        if (url.pathname === '/yt/search') return json(await ytSearch(String(b.q || '').slice(0, 200)), 200, cors);
        return json(await spotify(String(b.ref || '')), 200, cors);
      } catch (e) { return json({ error: String(e && e.message || e).slice(0, 200) }, 502, cors); }
    }
    if (request.method === 'POST' && url.pathname === '/chat/notify') {
      const who = await verifyIdToken(env, (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
      if (!who) return json({ error: 'connecte-toi' }, 401, cors);
      if (!env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY || !env.FIREBASE_DATABASE_URL) return json({ error: 'notifications push non configurées' }, 503, cors);
      try {
        const body = await request.json(), groupId = String(body.groupId || ''), messageId = String(body.messageId || '');
        if (!/^chat-[0-9a-f-]{20,60}$/i.test(groupId) || !/^[A-Za-z0-9_-]{8,40}$/.test(messageId)) return json({ error: 'message invalide' }, 400, cors);
        const token = await firebaseAccessToken(env), read = path => firebaseRead(env, token, path);
        const [group, message] = await Promise.all([read('chatGroups/' + groupId), read('chatMessages/' + groupId + '/' + messageId)]);
        const sender = String(who.discordId || who.user_id || '');
        if (!group?.members?.[sender] || String(message?.sender || '') !== sender) return json({ error: 'message inaccessible' }, 403, cors);
        let sent = 0, stale = [];
        for (const uid of Object.keys(group.members)) {
          if (uid === sender) continue;
          const endpoints = await read('chatPushEndpoints/' + uid) || {};
          for (const [key, sub] of Object.entries(endpoints)) {
            if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) continue;
            const result = await sendWebPush(env, sub, { title: 'Nouveau message', body: 'Un message chiffré t’attend dans le chat.', data: { groupId } });
            if (result.status === 404 || result.status === 410) stale.push('chatPushEndpoints/' + uid + '/' + key);
            else if (result.ok) sent++;
          }
        }
        if (stale.length) await firebaseDelete(env, token, stale);
        return json({ sent }, 200, cors);
      } catch (e) { return json({ error: String(e && e.message || e).slice(0, 180) }, 502, cors); }
    }
    if (request.method === 'POST' && url.pathname === '/pvp/notify') {
      const who = await verifyIdToken(env, (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''));
      if (!who) return json({ error: 'connecte-toi' }, 401, cors);
      if (!env.VAPID_PRIVATE_JWK || !env.VAPID_PUBLIC_KEY || !env.FIREBASE_DATABASE_URL) return json({ error: 'notifications push non configurées' }, 503, cors);
      try {
        const body = await request.json(), recipientId = String(body.recipientId || ''), sender = String(who.discordId || who.user_id || '');
        if (!/^\d{1,25}$/.test(recipientId) || !/^\d{1,25}$/.test(sender)) return json({ error: 'destinataire invalide' }, 400, cors);
        const token = await firebaseAccessToken(env), invitation = await firebaseRead(env, token, 'pvpInvites/' + recipientId + '/' + sender);
        if (!invitation || String(invitation.uid) !== sender) return json({ error: 'défi introuvable' }, 403, cors);
        const endpoints = await firebaseRead(env, token, 'chatPushEndpoints/' + recipientId) || {};
        let sent = 0, stale = [];
        for (const [key, sub] of Object.entries(endpoints)) {
          if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) continue;
          const result = await sendWebPush(env, sub, { title: (String(invitation.name || 'Un joueur').slice(0, 64)) + ' vous a défié !', body: 'Match privé Casual · ouvre PVP pour accepter.', data: { screen: 'pvp' } });
          if (result.status === 404 || result.status === 410) stale.push('chatPushEndpoints/' + recipientId + '/' + key);
          else if (result.ok) sent++;
        }
        if (stale.length) await firebaseDelete(env, token, stale);
        return json({ sent }, 200, cors);
      } catch (e) { return json({ error: String(e && e.message || e).slice(0, 180) }, 502, cors); }
    }
    if (request.method !== 'POST' || url.pathname !== '/session') return json({ error: 'introuvable' }, 404, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'requête invalide' }, 400, cors); }
    const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
    if (!accessToken || accessToken.length > 512) return json({ error: 'jeton manquant' }, 400, cors);

    const auth = { Authorization: 'Bearer ' + accessToken };
    const meRes = await fetch(DISCORD + '/users/@me', { headers: auth });
    if (!meRes.ok) return json({ error: 'jeton Discord invalide ou expiré' }, 401, cors);
    const me = await meRes.json();
    if (!me || !/^\d{5,25}$/.test(me.id || '')) return json({ error: 'réponse Discord invalide' }, 502, cors);

    const memberRes = await fetch(DISCORD + '/users/@me/guilds/' + env.GUILD_ID + '/member', { headers: auth });
    if (memberRes.status === 404) return json({ error: 'réservé aux membres du serveur Discord' }, 403, cors);
    if (memberRes.status === 401 || memberRes.status === 403)
      return json({ error: 'reconnecte-toi : il manque l’autorisation « serveurs »' }, 403, cors);
    if (memberRes.status === 429) return json({ error: 'trop de tentatives, réessaie dans une minute' }, 429, cors);
    if (!memberRes.ok) return json({ error: 'vérification Discord impossible' }, 502, cors);

    const name = String(me.global_name || me.username || 'membre').slice(0, 64);
    const admin = list(env.ADMIN_IDS).includes(me.id);
    const firebaseToken = await customToken(env, 'discord:' + me.id, { discordId: me.id, discordName: name, admin });
    return json({ firebaseToken, user: { id: me.id, username: name, admin } }, 200, cors);
  },
};

// ---- members only: Firebase ID token (RS256, Google's public keys), project from FIREBASE_PROJECT_ID (default chibi-be98b)
let jwks = null, jwksUntil = 0;
async function verifyIdToken(env, token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const dec = s => JSON.parse(new TextDecoder().decode(b64urlDecode(s)));
    const header = dec(parts[0]), p = dec(parts[1]);
    const project = env.FIREBASE_PROJECT_ID || 'chibi-be98b';
    const now = Math.floor(Date.now() / 1000);
    if (header.alg !== 'RS256' || p.aud !== project || p.iss !== 'https://securetoken.google.com/' + project) return null;
    if (!(p.exp > now) || !(p.iat <= now + 300) || !p.sub) return null;
    if (!jwks || Date.now() > jwksUntil) {
      const r = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
      jwks = (await r.json()).keys || [];
      jwksUntil = Date.now() + 3600 * 1000;
    }
    const jwk = jwks.find(k => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlDecode(parts[2]), utf8(parts[0] + '.' + parts[1]));
    return ok ? p : null;
  } catch { return null; }
}

let accessTokenCache = { token: '', expires: 0 };
async function firebaseAccessToken(env) {
  if (accessTokenCache.token && accessTokenCache.expires > Date.now() + 60000) return accessTokenCache.token;
  const now = Math.floor(Date.now() / 1000), header = { alg: 'RS256', typ: 'JWT' }, payload = { iss: env.FIREBASE_CLIENT_EMAIL, sub: env.FIREBASE_CLIENT_EMAIL, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600, scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email' };
  const data = b64url(utf8(JSON.stringify(header))) + '.' + b64url(utf8(JSON.stringify(payload))), key = await signingKey(env.FIREBASE_PRIVATE_KEY), signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(data));
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: data + '.' + b64url(new Uint8Array(signature)) }) });
  const result = await response.json(); if (!response.ok || !result.access_token) throw Error('Firebase service authorization failed');
  accessTokenCache = { token: result.access_token, expires: Date.now() + (Number(result.expires_in) || 3600) * 1000 }; return result.access_token;
}
async function firebaseRead(env, token, path) {
  const base = String(env.FIREBASE_DATABASE_URL).replace(/\/$/, ''), response = await fetch(base + '/' + path + '.json?access_token=' + encodeURIComponent(token));
  if (!response.ok) throw Error('Firebase read failed'); return response.json();
}
async function firebaseDelete(env, token, paths) {
  const base = String(env.FIREBASE_DATABASE_URL).replace(/\/$/, ''), updates = Object.fromEntries(paths.map(path => [path, null]));
  await fetch(base + '/.json?access_token=' + encodeURIComponent(token), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
}
function fromB64url(text) { const s = String(text).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(s + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0)); }
async function hkdfExtract(salt, ikm) { const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', key, ikm)); }
async function hkdfExpand(prk, info, length) {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); let previous = new Uint8Array(), out = new Uint8Array(), counter = 1;
  while (out.length < length) { const block = new Uint8Array(previous.length + info.length + 1); block.set(previous); block.set(info, previous.length); block[block.length - 1] = counter++; previous = new Uint8Array(await crypto.subtle.sign('HMAC', key, block)); const next = new Uint8Array(out.length + previous.length); next.set(out); next.set(previous, out.length); out = next; }
  return out.slice(0, length);
}
async function sendWebPush(env, subscription, payload) {
  const endpoint = new URL(subscription.endpoint), clientPublic = fromB64url(subscription.keys.p256dh), auth = fromB64url(subscription.keys.auth), salt = crypto.getRandomValues(new Uint8Array(16));
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']), serverRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const clientKey = await crypto.subtle.importKey('raw', clientPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []), secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, pair.privateKey, 256));
  const authPrk = await hkdfExtract(auth, secret), context = new Uint8Array(14 + clientPublic.length + serverRaw.length); context.set(utf8('WebPush: info\0')); context.set(clientPublic, 14); context.set(serverRaw, 14 + clientPublic.length);
  const inputKey = await hkdfExpand(authPrk, context, 32), prk = await hkdfExtract(salt, inputKey), cek = await hkdfExpand(prk, utf8('Content-Encoding: aes128gcm\0'), 16), nonce = await hkdfExpand(prk, utf8('Content-Encoding: nonce\0'), 12);
  const content = new Uint8Array(utf8(JSON.stringify(payload)).length + 1); content.set(utf8(JSON.stringify(payload))); content[content.length - 1] = 2;
  const aes = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']), encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, content));
  const body = new Uint8Array(salt.length + 4 + 1 + serverRaw.length + encrypted.length); let offset = 0; body.set(salt, offset); offset += salt.length; body.set([0,0,16,0], offset); offset += 4; body[offset++] = serverRaw.length; body.set(serverRaw, offset); offset += serverRaw.length; body.set(encrypted, offset);
  const vapid = await vapidAuthorization(env, endpoint.origin), response = await fetch(endpoint.href, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', 'TTL': '86400', 'Urgency': 'normal', 'Authorization': 'vapid t=' + vapid.token + ', k=' + env.VAPID_PUBLIC_KEY }, body });
  return response;
}
async function vapidAuthorization(env, audience) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK), now = Math.floor(Date.now() / 1000), data = b64url(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))) + '.' + b64url(utf8(JSON.stringify({ aud: audience, exp: now + 43200, sub: 'mailto:' + (env.VAPID_CONTACT || 'support@example.com') })));
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']), sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(data));
  return { token: data + '.' + b64url(new Uint8Array(sig)) };
}

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

// ---- YouTube search (videos only), through YouTube's own web API: no key, no quota
async function ytSearch(q) {
  if (q.trim().length < 2) return { items: [] };
  const r = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Cookie': 'SOCS=CAI' },
    body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: '2.20241101.00.00', hl: 'fr', gl: 'FR' } }, query: q, params: 'EgIQAQ%3D%3D' }),
  });
  if (!r.ok) throw new Error('YouTube ' + r.status);
  const data = await r.json();
  const items = [];
  const walk = o => {
    if (!o || typeof o !== 'object' || items.length >= 25) return;
    if (Array.isArray(o)) { for (const x of o) walk(x); return; }
    const v = o.videoRenderer;
    if (v && v.videoId && v.lengthText) {
      const length = v.lengthText.simpleText || '';
      const sec = length.split(':').reduce((a, x) => a * 60 + (parseInt(x, 10) || 0), 0);
      items.push({ id: v.videoId, title: ((v.title || {}).runs || [{}])[0].text || '', channel: ((v.ownerText || {}).runs || [{}])[0].text || '', length, sec });
      return;
    }
    for (const k in o) walk(o[k]);
  };
  walk(data);
  return { items };
}

// ---- public Spotify playlist / album: title + artists + duration of each track (from the embed page)
async function spotify(ref) {
  if (ref.indexOf('am/') === 0) return appleMusic(ref);
  const m = /^(playlist|album)\/([A-Za-z0-9]{10,40})$/.exec(ref);
  if (!m) throw new Error('lien Spotify non reconnu');
  const r = await fetch('https://open.spotify.com/embed/' + m[1] + '/' + m[2], { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!r.ok) throw new Error('Spotify ' + r.status);
  const html = await r.text();
  const j = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  if (!j) throw new Error('playlist Spotify illisible (privée ?)');
  const e = (((((JSON.parse(j[1]).props || {}).pageProps || {}).state || {}).data || {}).entity) || null;
  if (!e) throw new Error('playlist Spotify introuvable ou privée');
  const tracks = (e.trackList || []).filter(t => t && t.title).slice(0, 300)
    .map(t => ({ t: t.title, a: String(t.subtitle || '').replace(/\u00a0/g, ' '), d: Math.round((t.duration || 0) / 1000) }));
  return { name: e.name || e.title || 'Spotify', tracks };
}

// ---- public Apple Music playlist / album ("am/<country>/<playlist|album>/<id>"): the page carries its tracks
async function appleMusic(ref) {
  const m = /^am\/([a-z]{2})\/(playlist|album)\/((?:pl\.)?[A-Za-z0-9.\-]{4,60})$/.exec(ref);
  if (!m) throw new Error('lien Apple Music non reconnu');
  const r = await fetch('https://music.apple.com/' + m[1] + '/' + m[2] + '/x/' + m[3], { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  if (!r.ok) throw new Error('Apple Music ' + r.status);
  const html = await r.text();
  const j = /<script type="application\/json" id="serialized-server-data">([\s\S]*?)<\/script>/.exec(html);
  if (!j) throw new Error('playlist Apple Music illisible (privée ?)');
  const tracks = [], seen = new Set();
  const walk = o => {
    if (!o || typeof o !== 'object' || tracks.length >= 300) return;
    if (Array.isArray(o)) { for (const x of o) walk(x); return; }
    if (o.title && o.artistName && typeof o.duration === 'number') {
      const k = o.artistName + '|' + o.title;
      if (!seen.has(k)) { seen.add(k); tracks.push({ t: String(o.title), a: String(o.artistName).replace(/ & /g, ', '), d: Math.round(o.duration / 1000) }); }
      return;
    }
    for (const k in o) walk(o[k]);
  };
  walk(JSON.parse(j[1]));
  const n = /<script[^>]*id="?schema:music-(?:playlist|album)"?[^>]*>([\s\S]*?)<\/script>/.exec(html);
  let name = 'Apple Music';
  try { if (n) name = JSON.parse(n[1]).name || name; } catch {}
  if (!tracks.length) throw new Error('aucun titre lisible dans cette playlist Apple Music');
  return { name, tracks };
}

function list(s) { return String(s || '').split(',').map(x => x.trim()).filter(Boolean); }

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
}

// ---- Firebase custom token (RS256 JWT signed with the service-account key)
async function customToken(env, uid, claims) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: env.FIREBASE_CLIENT_EMAIL, sub: env.FIREBASE_CLIENT_EMAIL, aud: FIREBASE_AUDIENCE, iat: now, exp: now + 3600, uid, claims };
  const data = b64url(utf8(JSON.stringify(header))) + '.' + b64url(utf8(JSON.stringify(payload)));
  const key = await signingKey(env.FIREBASE_PRIVATE_KEY);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(data));
  return data + '.' + b64url(new Uint8Array(sig));
}

async function signingKey(pem) {
  if (cachedKey) return cachedKey;
  const body = String(pem).replace(/\\n/g, '\n').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  cachedKey = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  return cachedKey;
}

function utf8(s) { return new TextEncoder().encode(s); }

function b64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
