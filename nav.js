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
