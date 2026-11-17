// CHIBI - secure login shared by every page.
// Discord OAuth (token) -> auth worker (checks membership of the Discord server) -> Firebase custom token.
// The database rules trust only the Firebase identity, never what the page says.
(function(){
  // URL of the deployed auth worker (see worker/README.md)
  const WORKER_URL = 'https://chibi-auth.lucasdele77220.workers.dev';
  const CLIENT_ID = '1005172482539524286';
  const SCOPES = 'identify guilds.members.read';
  let lastError = '';

  // Discord only accepts the exact addresses registered in the app: "/chibi/" becomes "/chibi/index.html"
  function redirectUri(){
    let path = window.location.pathname;
    if(path.endsWith('/')) path += 'index.html';
    return window.location.origin + path;
  }

  function login(){
    const url = 'https://discord.com/api/oauth2/authorize?client_id=' + CLIENT_ID +
      '&redirect_uri=' + encodeURIComponent(redirectUri()) +
      '&response_type=token&scope=' + encodeURIComponent(SCOPES);
    window.location.href = url;
  }

  // back from Discord: trade the Discord token for a Firebase session (the token is dropped right away)
  async function handleRedirect(){
    if(!window.location.hash || window.location.hash.indexOf('access_token') < 0) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('access_token');
    history.replaceState(null, '', window.location.pathname + window.location.search);
    if(!token) return;
    try{
      const res = await fetch(WORKER_URL + '/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token })
      });
      const data = await res.json().catch(() => ({}));
      if(!res.ok || !data.firebaseToken){ lastError = data.error || 'connexion refusée'; return; }
      await firebase.auth().signInWithCustomToken(data.firebaseToken);
    }catch(e){
      lastError = 'serveur de connexion injoignable';
    }
  }

  // the signed-in member, read from the verified Firebase token (cannot be forged in the page)
  function current(){
    return new Promise(resolve => {
      const off = firebase.auth().onAuthStateChanged(async user => {
        off();
        if(!user){ resolve(null); return; }
        try{
          const t = await user.getIdTokenResult();
          resolve({ id: String(t.claims.discordId || ''), username: String(t.claims.discordName || ''), admin: t.claims.admin === true });
        }catch(e){ resolve(null); }
      });
    });
  }

  async function logout(){
    try{ await firebase.auth().signOut(); }catch(e){}
    window.location.reload();
  }

  // members-only: covers the page with a login card when nobody is signed in
  function gate(){
    if(document.getElementById('chibiAuthGate')) return;
    const box = document.createElement('div');
    box.id = 'chibiAuthGate';
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(20,16,40,.82);backdrop-filter:blur(6px);font-family:Montserrat,sans-serif';
    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border-radius:18px;padding:28px 30px;max-width:360px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35)';
    const title = document.createElement('h2');
    title.textContent = 'réservé aux membres ✧';
    title.style.cssText = 'margin:0 0 10px;color:#5a2d82';
    const p = document.createElement('p');
    p.textContent = 'Connecte-toi avec Discord : seuls les membres du serveur ont accès au site.';
    p.style.cssText = 'margin:0 0 16px;color:#3a2555;font-size:14px';
    const err = document.createElement('p');
    err.textContent = lastError ? '⚠ ' + lastError : '';
    err.style.cssText = 'margin:0 0 14px;color:#c0264b;font-size:13px;font-weight:700';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'se connecter avec Discord';
    btn.style.cssText = 'border:none;border-radius:12px;padding:12px 18px;color:#fff;font-weight:700;cursor:pointer;' +
      'background:linear-gradient(135deg,#7289da,#5865f2)';
    btn.addEventListener('click', login);
    card.appendChild(title); card.appendChild(p); if(lastError) card.appendChild(err); card.appendChild(btn);
    box.appendChild(card);
    document.body.appendChild(box);
  }

  window.ChibiAuth = { login, handleRedirect, current, logout, gate, get error(){ return lastError; } };
})();
