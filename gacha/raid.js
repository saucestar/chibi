/* Small native raid screen layered over the shipped app bundle. Three members plan together. */
(function () {
  'use strict';
  const storageKey = 'chibi.reapers-run.party.v1';
  const txt = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function profile() { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; } }
  function team() {
    const save = profile(), catalog = window.ChibiGameCatalog;
    return (save.equipped || []).filter(Boolean).slice(0, 2).map(name => {
      const base = catalog?.characters.find(item => item.name === name), stats = catalog?.bases[name];
      if (!base || !stats || !(save.loadout?.[name] || []).length) return null;
      const level = Math.max(1, Math.min(99, Number(save.levels?.[name] || 1))), rank = Math.max(0, Math.min(5, Number(save.copies?.[name] || 0))), scale = 1.2 ** rank;
      return { name, hp: Math.round((base.maxHp + (level - 1) * 5) * scale), maxHp: Math.round((base.maxHp + (level - 1) * 5) * scale), atk: Math.round((stats[0] + (level - 1) * 2) * scale), mag: Math.round((stats[1] + (level - 1) * 2) * scale), speed: Math.round((stats[2] + level - 1) * scale), loadout: [...save.loadout[name]].slice(0, 3) };
    }).filter(Boolean);
  }
  function mountMode() {
    const rail = document.querySelector('.home-modes');
    if (rail && !rail.querySelector('.raid-mode-card')) {
      const card = document.createElement('button'); card.className = 'hub-play home-mode-card raid-mode-card';
      card.innerHTML = '<small>MODE COOPÉRATIF</small><b>Raid · 3 vs Boss</b><span>Combat de faction</span>'; card.onclick = open;
      rail.appendChild(card);
    }
    const links = document.querySelector('.hub-menu-links');
    if (links && !links.querySelector('.raid-menu-link')) {
      const item = document.createElement('button'); item.className = 'raid-menu-link'; item.innerHTML = '<b>Raid</b><small>Combat coopératif de faction · 3 vs Boss</small><span aria-hidden="true">›</span>'; item.onclick = open; links.appendChild(item);
    }
  }
  new MutationObserver(mountMode).observe(document.getElementById('root'), { childList: true, subtree: true });
  function open() {
    if (!window.ChibiSocial?.ready()) return window.alert('Connecte-toi avec Discord pour ouvrir les Raids.');
    if (!team().length || team().length !== 2) return window.alert('Équipe deux personnages avec leurs psychs dans Team avant le Raid.');
    const overlay = document.createElement('div'); overlay.className = 'raid-overlay'; document.body.appendChild(overlay);
    let faction = null, rooms = [], selected = null, stop = null, activeStop = null;
    const close = () => { stop?.(); activeStop?.(); overlay.remove(); };
    overlay.onclick = event => { if (event.target === overlay) close(); };
    const renderHall = (notice = '') => {
      const bosses = (window.ChibiGameCatalog?.enemies || []).filter(x => x.enabled && x.boss).sort((a, b) => b.hp - a.hp).slice(0, 18);
      overlay.innerHTML = `<section class="raid-native"><header><div><small>COOPÉRATION · FACTION</small><h1>Raid · 3 joueurs contre Boss</h1><p>${txt(faction?.name || 'Rejoins une faction dans Social pour lancer un Raid.')}</p></div><button class="raid-native-close">×</button></header>${!faction ? '<button class="raid-native-open-social">Ouvrir Social / Factions</button>' : `<div class="raid-native-boss-list">${bosses.map(b => `<button data-boss="${txt(b.id)}" aria-pressed="${selected?.id === b.id}"><span class="raid-monster-art">${b.sprite ? `<img src="${txt(b.sprite)}">` : '◆'}</span><b>${txt(b.displayName || b.name || b.id)}</b><small>Niveau 200 · ${Number(b.hp).toLocaleString()} PV</small></button>`).join('')}</div>${selected ? `<div class="raid-native-selected"><b>${txt(selected.displayName || selected.name || selected.id)}</b><span>Boss niveau 200 · ${Math.max(18000, Math.min(70000, Number(selected.hp) * 8)).toLocaleString()} PV</span><button class="raid-native-create">Créer une salle</button></div>` : ''}<h2>Salles de ta faction</h2><div class="raid-native-rooms">${rooms.map(r => { const ids = Object.values(r.slots || {}), joined = ids.includes(String(window.ChibiGameSync?.accountId)); return `<article><b>${txt(r.meta.bossName)}</b><span>${ids.length}/3 joueurs</span><button data-join="${txt(r.id)}" ${ids.length >= 3 && !joined ? 'disabled' : ''}>${joined ? 'Reprendre' : 'Rejoindre'}</button></article>`; }).join('') || '<p>Aucune salle. Choisis un boss pour la créer.</p>'}</div>`}${notice ? `<p class="raid-native-notice" role="status">${txt(notice)}</p>` : ''}</section>`;
      overlay.querySelector('.raid-native-close').onclick = close;
      overlay.querySelector('.raid-native-open-social')?.addEventListener('click', () => { close(); document.querySelector('.hub-nav button:nth-child(5)')?.click(); });
      overlay.querySelectorAll('[data-boss]').forEach(button => button.onclick = () => { selected = bosses.find(b => b.id === button.dataset.boss); renderHall(); });
      overlay.querySelector('.raid-native-create')?.addEventListener('click', async event => { event.currentTarget.disabled = true; try { const roomId = await ChibiSocial.createRaidRoom(selected, team()); enter(roomId); } catch (err) { renderHall(err.message || 'Impossible de créer la salle.'); } });
      overlay.querySelectorAll('[data-join]').forEach(button => button.onclick = async () => { try { const room = rooms.find(item => item.id === button.dataset.join), joined = Object.values(room?.slots || {}).includes(String(window.ChibiGameSync?.accountId)); if (!joined) await ChibiSocial.joinRaidRoom(button.dataset.join, team()); enter(button.dataset.join); } catch (err) { renderHall(err.message || 'Impossible de rejoindre la salle.'); } });
    };
    function compute(room) {
      const ids = Object.entries(room.slots || {}).sort(([a], [b]) => Number(a) - Number(b)).map(([, id]) => id).filter(id => room.players?.[id]);
      const squads = Object.fromEntries(ids.map(id => [id, room.players[id].team.map(f => ({ ...f }))])); let hp = Number(room.meta.bossHp), turn = 1, won = false;
      for (; turn < 100 && ids.length === 3; turn++) {
        const round = room.actions?.[turn] || {}; if (!ids.every(id => round[id]?.plans)) break;
        const guarded = new Set();
        for (const id of ids) for (let n = 0; n < 2; n++) {
          const fighter = squads[id][n], plan = round[id].plans[n]; if (!fighter || fighter.hp <= 0 || !plan) continue;
          if (plan.kind === 'guard') { guarded.add(id + ':' + n); continue; }
          const pin = window.ChibiGameCatalog.badges[plan.pin]; if (!pin) continue;
          if (pin.kind === 'heal') { const partner = squads[id][1 - n]; if (partner && partner.hp > 0) partner.hp = Math.min(partner.maxHp, partner.hp + Math.round(fighter.mag * Number(pin.power || 1) / 50)); continue; }
          if (pin.kind !== 'physical' && pin.kind !== 'special') continue;
          const stat = pin.kind === 'physical' ? fighter.atk : fighter.mag, element = pin.element || 'normal', types = window.ChibiGameCatalog.elements[fighter.name] || [];
          hp = Math.max(0, hp - Math.max(1, Math.round(stat * (.7 + Number(pin.power || 0) / 100) * (types.includes(element) ? 1.2 : 1))));
        }
        if (hp <= 0) { won = true; break; }
        for (const id of ids) {
          const alive = squads[id].map((f, i) => ({ f, i })).filter(x => x.f.hp > 0); if (!alive.length) continue;
          const target = alive[(turn + ids.indexOf(id)) % alive.length], cut = guarded.has(id + ':' + target.i) ? .6 : 0;
          target.f.hp = Math.max(0, target.f.hp - Math.round(target.f.maxHp * .22 * (1 - cut)));
        }
        if (ids.every(id => squads[id].every(f => f.hp <= 0))) break;
      }
      return { ids, squads, hp, turn, won, lost: ids.length === 3 && ids.every(id => squads[id].every(f => f.hp <= 0)) || Object.values(room.forfeits || {}).some(Boolean) };
    }
    function enter(roomId) {
      stop?.(); activeStop?.(); activeStop = null;
      ChibiSocial.watchRaidRoom(roomId, room => { if (!room) return; renderBattle(room); }, error => renderHall(error.message || 'Connexion à la salle interrompue.')).then(off => activeStop = off).catch(err => renderHall(err.message));
    }
    function renderBattle(room) {
      const uid = String(window.ChibiGameSync?.accountId), me = room.players?.[uid], result = compute(room), mine = result.squads[uid] || me?.team || [], round = room.actions?.[result.turn] || {}, chosen = {};
      const complete = result.ids.length === 3 && result.ids.every(id => round[id]?.plans), done = result.won || result.lost;
      overlay.innerHTML = `<section class="raid-native raid-live"><header><div><small>RAID DE FACTION · ${result.ids.length}/3</small><h1>${txt(room.meta.bossName)}</h1><p>Tour ${result.turn} · Niveau 200</p></div><button class="raid-native-close">×</button></header><div class="raid-native-boss"><span>☠</span><b>${txt(room.meta.bossName)}</b><i><u style="width:${Math.max(0,100*result.hp/room.meta.bossHp)}%"></u></i><small>${Math.max(0,result.hp).toLocaleString()} / ${Number(room.meta.bossHp).toLocaleString()} PV</small></div><div class="raid-native-parties">${result.ids.map(id => `<article><h3>${txt(room.players[id].name)}${id===uid?' · Toi':''}</h3><div>${(result.squads[id]||[]).map(f=>`<span>${txt(f.name)}<i>${f.hp}/${f.maxHp} PV</i></span>`).join('')}</div><small>${round[id]?.plans?'Actions envoyées':'Choix en cours'}</small></article>`).join('')}</div><h2>Tes actions</h2><div class="raid-native-plans">${mine.map((f,i)=>`<article><b>${txt(f.name)} · ${f.hp}/${f.maxHp} PV</b><select data-action="${i}" ${round[uid]?.plans||done||f.hp<=0?'disabled':''}><option value="">Choisir un psych</option>${f.loadout.map(id=>{const pin=window.ChibiGameCatalog.badges[id];return pin?`<option value="${txt(id)}">${txt(pin.name)} · ${txt(pin.cost)} EN</option>`:''}).join('')}<option value="guard">Défendre</option></select></article>`).join('')}</div><button class="raid-native-submit" ${round[uid]?.plans||done?'disabled':''}>${done?(result.won?'Boss vaincu':'Raid terminé'):round[uid]?.plans?'Actions validées · attente du groupe':'Valider les deux actions'}</button><button class="raid-native-forfeit">Abandonner le Raid</button></section>`;
      overlay.querySelector('.raid-native-close').onclick = close;
      overlay.querySelectorAll('[data-action]').forEach(select => select.onchange = () => { chosen[select.dataset.action] = select.value === 'guard' ? { kind: 'guard' } : { kind: 'psych', pin: select.value }; });
      overlay.querySelector('.raid-native-submit').onclick = async event => { const selects = [...overlay.querySelectorAll('[data-action]')]; if (selects.some(s => !s.value)) return; event.currentTarget.disabled = true; try { await ChibiSocial.submitRaidAction(roomId, result.turn, Object.fromEntries(selects.map(s => [s.dataset.action, s.value === 'guard' ? { kind: 'guard' } : { kind: 'psych', pin: s.value }]))); } catch (err) { renderBattle(room); overlay.querySelector('.raid-native-notice')?.replaceChildren(document.createTextNode(err.message || 'Envoi impossible')); } };
      overlay.querySelector('.raid-native-forfeit').onclick = async () => { await ChibiSocial.forfeitRaid(roomId); close(); };
    }
    ChibiSocial.myFaction().then(value => { faction = value; if (!value) return renderHall(); return ChibiSocial.watchRaidRooms(value => { rooms = value; renderHall(); }); }).then(off => { if (typeof off === 'function') stop = off; }).catch(err => renderHall(err.message || 'La liste des Raids est inaccessible.'));
    renderHall();
  }
})();
