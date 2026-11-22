/* Wait for the saved Firebase session so remote admin balance edits load before the game data. */
(function () {
  'use strict';
  function add(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  async function config() {
    if (!window.firebase?.apps?.length) return;
    const user = await new Promise(resolve => {
      let off = () => {};
      const timer = setTimeout(() => { off(); resolve(null); }, 2500);
      off = firebase.auth().onAuthStateChanged(value => { clearTimeout(timer); off(); resolve(value); });
    });
    if (!user) return;
    try {
      const value = await Promise.race([
        firebase.database().ref('gameConfig/v1').get(),
        new Promise((_, reject) => setTimeout(() => reject(Error('timeout')), 1800))
      ]);
      window.ChibiAdminGameConfig = value.val() || null;
    } catch (_) { window.ChibiAdminGameConfig = null; }
  }
  config().finally(async () => {
    try { await add('./game.js?v=chat-manual-load1'); await add('./admin.js?v=admin-claim-refresh1'); await add('./raid.js?v=raid-faction2'); }
    catch (error) { const root = document.getElementById('root'); if (root) root.textContent = 'Impossible de charger le jeu. Recharge la page.'; }
  });
})();
