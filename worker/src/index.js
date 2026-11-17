// CHIBI auth worker (Cloudflare Workers, free plan)
//
// POST /session  { accessToken }  ->  { firebaseToken, user }
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/session') return json({ error: 'introuvable' }, 404, cors);
    // browsers always send Origin: only the site may call us from a browser (the launcher sends none)
    if (origin && !allowed.includes(origin)) return json({ error: 'origine refusée' }, 403, cors);

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
