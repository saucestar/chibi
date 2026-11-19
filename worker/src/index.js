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
