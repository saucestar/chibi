// TWEWY Co-op: top bar shared by every page, adjusted to the signed-in member.
//  - once a member adopted a chibi, the Chibis tab is replaced by "Mon profil" (and chibis.html sends them there)
//  - admins get an Admin tab (admin.html); the old gear of the chibis page is gone
(function(){
  const nav = document.querySelector('.site-nav');
  if(!nav) return;
  const page = (location.pathname.split('/').pop() || 'index.html');
  const gear = document.getElementById('adminGear');
  if(gear) gear.style.display = 'none';
  if(typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !firebase.auth) return;

  firebase.auth().onAuthStateChanged(async user => {
    if(!user) return;
    let admin = false, id = '';
    try{ const t = await user.getIdTokenResult(); admin = t.claims.admin === true; id = String(t.claims.discordId || ''); }catch(e){ return; }

    if(admin && !nav.querySelector('a[href="admin.html"]')){
      const a = document.createElement('a');
      a.href = 'admin.html'; a.textContent = '⚙ Admin';
      if(page === 'admin.html') a.className = 'active';
      nav.appendChild(a);
    }
    if(!id) return;
    let mine = null;
    try{
      const snap = await firebase.database().ref('assignments').get();
      const all = snap.exists() ? snap.val() : {};
      const hit = Object.entries(all).find(([, a]) => a && a.discordId === id);
      if(hit) mine = hit[0];
    }catch(e){ return; }
    if(!mine) return;
    const profile = 'membre.html?id=' + encodeURIComponent(mine);
    if(page === 'chibis.html'){ location.replace(profile); return; }

    const old = document.getElementById('myProfileBtn');
    if(old) old.remove();
    const tab = nav.querySelector('a[href="chibis.html"]');
    if(tab){
      tab.href = profile;
      tab.textContent = '🌸 Mon profil';
      tab.className = page === 'membre.html' && new URLSearchParams(location.search).get('id') === mine ? 'active' : '';
    }
  });
})();

// ---- phone app (PWA): install tags, offline shell, bottom tab bar
(function(){
  const head = document.head;
  function tag(name, attrs){
    if(head.querySelector(name + '[' + Object.keys(attrs)[0] + '="' + attrs[Object.keys(attrs)[0]] + '"]')) return;
    const el = document.createElement(name);
    for(const k in attrs) el.setAttribute(k, attrs[k]);
    head.appendChild(el);
  }
  tag('link', { rel: 'manifest', href: 'manifest.webmanifest' });
  tag('meta', { name: 'theme-color', content: '#141217' });
  tag('link', { rel: 'apple-touch-icon', href: 'icons/apple-touch-icon.png' });
  tag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  tag('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  tag('meta', { name: 'apple-mobile-web-app-title', content: 'TWEWY Co-op' });
  tag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' });
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  // "install the app": Android/Chrome gives a prompt event, iPhone needs Share > Add to Home Screen
  window.TwewyInstall = { prompt: null, standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); TwewyInstall.prompt = e; document.dispatchEvent(new Event('twewy-installable')); });

  const page = (location.pathname.split('/').pop() || 'index.html');
  const nav = document.querySelector('.site-nav');
  // top bar (computer): the app's new pages next to Classement
  if(nav){
    const after = nav.querySelector('a[href="classement.html"]');
    [].forEach(([href, label]) => {
      if(nav.querySelector('a[href="' + href + '"]')) return;
      const a = document.createElement('a'); a.href = href; a.textContent = label;
      if(page === href) a.className = 'active';
      if(after && after.nextSibling) nav.insertBefore(a, after.nextSibling); else nav.appendChild(a);
    });
  }

  // the phone app is app.html (the launcher, without the game): one link in the top bar
  if(nav && !nav.querySelector('a[href="app.html"]')){
    const a = document.createElement('a'); a.href = 'app.html'; a.textContent = '📱 Appli';
    nav.appendChild(a);
  }

  if(nav && !nav.querySelector('a[href="jeu.html"]')){
    const a = document.createElement('a'); a.href = 'jeu.html'; a.textContent = '🎮 Jeu test';
    if(page === 'jeu.html') a.className = 'active';
    nav.appendChild(a);
  }
})();
