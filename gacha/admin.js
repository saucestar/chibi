/* Private, role-checked game data editor. Writes only the admin-owned gameConfig node. */
(function () {
  'use strict';
  const boot = async () => {
    const user = window.firebase?.auth?.().currentUser;
    if (!user) return;
    let claims;
    try { claims = (await user.getIdTokenResult()).claims; } catch (_) { return; }
    if (claims.admin !== true) return;
    const button = document.createElement('button');
    button.className = 'admin-launch'; button.type = 'button'; button.textContent = 'ADMIN'; button.setAttribute('aria-label', 'Ouvrir les outils administrateur');
    document.body.appendChild(button);
    button.addEventListener('click', open);
  };
  function open() {
    const catalog = window.ChibiGameCatalog;
    if (!catalog) return;
    const shade = document.createElement('div'); shade.className = 'admin-shade';
    const panel = document.createElement('section'); panel.className = 'admin-window'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Administration du jeu');
    let config = JSON.parse(JSON.stringify(window.ChibiAdminGameConfig || { characters: {}, badges: {}, enemies: {} }));
    config.characters ||= {}; config.badges ||= {}; config.enemies ||= {};
    let category = 'characters', selected = '', query = '';
    const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const render = () => {
      const items = category === 'characters' ? catalog.characters.map(x => ({ id: x.name, label: x.displayName || x.name, base: x })) : category === 'badges' ? Object.values(catalog.badges).map(x => ({ id: x.id, label: x.name, base: x })) : (catalog.enemies || []).map(x => ({ id: x.id, label: x.name || x.id, base: x }));
      const filtered = items.filter(x => (x.label + ' ' + x.id).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
      if (!filtered.some(x => x.id === selected)) selected = filtered[0]?.id || '';
      const item = filtered.find(x => x.id === selected), values = item ? config[category][selected] || {} : {};
      const field = (label, key, value, type = 'text', min = '', max = '', step = '1') => `<label>${label}<input data-field="${key}" type="${type}" value="${safe(value)}" ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''} step="${step}"></label>`;
      panel.innerHTML = `<header><div><small>REAPERS’ RUN · OUTILS PRIVÉS</small><h1>Administration du jeu</h1><p>Les identifiants techniques restent fixes pour préserver les sauvegardes.</p></div><button class="admin-close" aria-label="Fermer">×</button></header><nav>${[['characters','Personnages'],['badges','Psychs / badges'],['enemies','Ennemis']].map(([id,name]) => `<button data-category="${id}" aria-pressed="${id === category}">${name}</button>`).join('')}</nav><div class="admin-editor"><aside><input class="admin-search" value="${safe(query)}" placeholder="Rechercher"><div class="admin-items">${filtered.map(x => `<button data-select="${safe(x.id)}" aria-pressed="${x.id === selected}">${safe(x.label)}</button>`).join('')}</div></aside><form class="admin-fields">${!item ? '<p>Choisis une entrée.</p>' : category === 'characters' ? `${field('Nom affiché','displayName',values.displayName ?? item.base.displayName ?? item.id)}${field('PV de base','maxHp',values.maxHp ?? item.base.maxHp,'number',1,100000)}${field('ATK de base','atk',values.bases?.[0] ?? catalog.bases[item.id]?.[0],'number',1,100000)}${field('MAG de base','mag',values.bases?.[1] ?? catalog.bases[item.id]?.[1],'number',1,100000)}${field('Vitesse de base','speed',values.bases?.[2] ?? catalog.bases[item.id]?.[2],'number',1,100000)}${field('Types (séparés par virgule)','elements',(values.elements ?? catalog.elements[item.id] ?? []).join(','))}${field('Nom du passif','passiveName',values.passive?.name ?? catalog.passives[item.id]?.name ?? '')}${field('Description du passif','passiveDescription',values.passive?.description ?? catalog.passives[item.id]?.description ?? '')}${field('Bonus dégâts du passif','damageBonus',values.passive?.damageBonus ?? catalog.passives[item.id]?.damageBonus ?? 0,'number',0,2,'0.01')}${field('Bonus soin','healing',values.passive?.healing ?? catalog.passives[item.id]?.healing ?? 0,'number',0,2,'0.01')}${field('Réduction dégâts','defense',values.passive?.defense ?? catalog.passives[item.id]?.defense ?? 0,'number',0,2,'0.01')}${field('Esquive','dodge',values.passive?.dodge ?? catalog.passives[item.id]?.dodge ?? 0,'number',0,2,'0.01')}` : category === 'badges' ? `${field('Nom affiché','displayName',values.displayName ?? item.base.name)}${field('Puissance','power',values.power ?? item.base.power,'number',0,100000)}${field('Coût EN','cost',values.cost ?? item.base.cost,'number',0,3)}${field('Type élémentaire','element',values.element ?? item.base.element)}${field('Cible (single / duo / aoe)','target',values.target ?? item.base.target ?? '')}` : `${field('Nom','displayName',values.displayName ?? item.base.name)}${field('PV','hp',values.hp ?? item.base.hp,'number',1,100000000)}${field('ATQ','attack',values.attack ?? item.base.attack,'number',1,10000000)}${field('Niveau conseillé','level',values.level ?? item.base.level ?? 200,'number',1,1000)}`}<button class="admin-save" type="submit" ${item ? '' : 'disabled'}>Enregistrer les réglages</button><p class="admin-status" role="status"></p></form></div><footer>Les modifications sont partagées après publication des règles Firebase mises à jour.</footer>`;
      panel.querySelector('.admin-close').onclick = () => shade.remove();
      panel.querySelectorAll('[data-category]').forEach(el => el.onclick = () => { category = el.dataset.category; selected = ''; render(); });
      panel.querySelectorAll('[data-select]').forEach(el => el.onclick = () => { selected = el.dataset.select; render(); });
      panel.querySelector('.admin-search').oninput = event => { query = event.target.value; render(); const input = panel.querySelector('.admin-search'); input.focus(); input.setSelectionRange(query.length, query.length); };
      panel.querySelector('.admin-fields').onsubmit = async event => {
        event.preventDefault();
        const values = Object.fromEntries([...panel.querySelectorAll('[data-field]')].map(el => [el.dataset.field, el.value]));
        if (category === 'characters') {
          const old = config.characters[selected] || {}; config.characters[selected] = { ...old, displayName: values.displayName.slice(0,48), maxHp: Number(values.maxHp), bases: [Number(values.atk),Number(values.mag),Number(values.speed)], elements: values.elements.split(',').map(x=>x.trim()).filter(Boolean).slice(0,2), passive: { ...(old.passive || {}), name: values.passiveName.slice(0,64), description: values.passiveDescription.slice(0,240), damageBonus: Number(values.damageBonus), healing: Number(values.healing), defense: Number(values.defense), dodge: Number(values.dodge) } };
        } else if (category === 'badges') config.badges[selected] = { ...config.badges[selected], displayName: values.displayName.slice(0,64), power: Number(values.power), cost: Number(values.cost), element: values.element, target: values.target };
        else config.enemies[selected] = { ...config.enemies[selected], displayName: values.displayName.slice(0,80), hp: Number(values.hp), attack: Number(values.attack), level: Number(values.level) };
        try {
          const user = firebase.auth().currentUser;
          if (!user) throw Error('Session Firebase expirée. Reconnecte-toi puis réessaie.');
          const token = await user.getIdTokenResult(true);
          if (token.claims.admin !== true) throw Error('Ton compte n’a plus le rôle administrateur. Reconnecte-toi avec le compte admin.');
          config.updatedAt = Date.now(); await firebase.database().ref('gameConfig/v1').set(config);
          window.ChibiAdminGameConfig = config; const status = panel.querySelector('.admin-status'); status.textContent = 'Enregistré. Rechargement du jeu…';
          setTimeout(() => location.reload(), 700);
        } catch (error) {
          const message = String(error?.message || error);
          panel.querySelector('.admin-status').textContent = /permission.denied|permission_denied/i.test(message)
            ? 'Firebase refuse l’écriture. Publie à nouveau database.rules.json : gameConfig/v1 doit autoriser auth.token.admin === true.'
            : 'Échec Firebase : ' + message;
        }
      };
    };
    shade.appendChild(panel); document.body.appendChild(shade); render();
    shade.addEventListener('click', event => { if (event.target === shade) shade.remove(); });
  }
  const ready = () => boot().catch(() => {});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
