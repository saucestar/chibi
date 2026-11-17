// TWEWY Co-op: site texts edited from the admin page (settings/texts/<page>_<field>), applied over the page's own.
// Fields: marquee (scrolling strip), title (first h1), subtitle (first p.subtitle).
(function(){
  const FIELDS = { marquee: '.marquee', title: 'h1', subtitle: 'p.subtitle' };
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
  window.SiteTexts = { FIELDS };
  if(typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !firebase.auth) return;
  firebase.auth().onAuthStateChanged(async user => {
    if(!user) return;
    try{
      const snap = await firebase.database().ref('settings/texts').get();
      const t = snap.exists() ? snap.val() : {};
      Object.keys(FIELDS).forEach(f => {
        const v = t[page + '_' + f];
        if(typeof v !== 'string' || !v.trim()) return;
        const els = f === 'marquee' ? document.querySelectorAll(FIELDS[f]) : [document.querySelector(FIELDS[f])];
        els.forEach(el => { if(el) el.textContent = v; });
      });
    }catch(e){}
  });
})();
