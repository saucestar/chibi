/* Small native raid screen layered over the shipped app bundle. Three members plan together. */
(function () {
  'use strict';
  const storageKey = 'chibi.reapers-run.party.v1';
  const txt = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function profile() { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; } }
  function mountBossSprite(host, id, large = false) {
    const spec = window.ChibiRaidSprites?.enemies?.[id]; if (!host || !spec?.atlasFrames?.length) return;
    const previous = host.querySelector('canvas'); if (previous?._raidTimer) clearInterval(previous._raidTimer);
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
    canvas.width = spec.frameWidth; canvas.height = spec.frameHeight; canvas.className = large ? 'raid-boss-pixel-art' : 'raid-monster-pixel-art';
    canvas.setAttribute('aria-hidden', 'true'); context.imageSmoothingEnabled = false; host.replaceChildren(canvas);
    const pages = new Map(), frames = spec.atlasFrames; let index = 0, ready = false;
    Promise.all([...new Set(frames.map(frame => frame[0]))].map(async page => pages.set(page, await window.ChibiRaidSprites.loadPage(page))))
      .then(() => { if (!canvas.isConnected) return; ready = true; draw(); canvas._raidTimer = setInterval(() => { index = (index + 1) % frames.length; draw(); }, Math.max(100, 1000 / (spec.fps || 4))); })
      .catch(() => {});
    function draw() {
      if (!ready || !canvas.isConnected) return;
      const [page, x, y] = frames[index], image = pages.get(page); if (!image) return;
      context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, x, y, spec.frameWidth, spec.frameHeight, 0, 0, canvas.width, canvas.height);
    }
  }
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
    const overlay = document.createElement('div'); overlay.className = 'raid-overlay'; document.body.appendChild(overlay);
    let faction = null, factions = [], rooms = [], selected = null, stop = null, activeStop = null;
    const clearSpriteTimers = () => overlay.querySelectorAll('canvas').forEach(canvas => { if (canvas._raidTimer) clearInterval(canvas._raidTimer); });
    const close = () => { stop?.(); activeStop?.(); clearSpriteTimers(); overlay.remove(); };
    overlay.onclick = event => { if (event.target === overlay) close(); };
    const renderHall = (notice = '') => {
      clearSpriteTimers();
      const bosses = (window.ChibiGameCatalog?.enemies || []).filter(x => x.enabled && x.boss).sort((a, b) => b.hp - a.hp).slice(0, 18);
      overlay.innerHTML = `<section class="raid-native"><header><div><small>COOPÉRATION · FACTION</small><h1>Raid · 3 joueurs contre Boss</h1><p>${txt(faction?.name || 'Rejoins une faction dans Social pour lancer un Raid.')}</p></div><button class="raid-native-close">×</button></header>${!faction ? '<button class="raid-native-open-social">Ouvrir Social / Factions</button>' : `<div class="raid-native-boss-list">${bosses.map(b => `<button data-boss="${txt(b.id)}" aria-pressed="${selected?.id === b.id}"><span class="raid-monster-art">${b.sprite ? `<img src="${txt(b.sprite)}">` : '◆'}</span><b>${txt(b.displayName || b.name || b.id)}</b><small>Niveau 200 · ${Number(b.hp).toLocaleString()} PV</small></button>`).join('')}</div>${selected ? `<div class="raid-native-selected"><b>${txt(selected.displayName || selected.name || selected.id)}</b><span>Boss niveau 200 · ${Math.max(18000, Math.min(70000, Number(selected.hp) * 8)).toLocaleString()} PV</span><button class="raid-native-create">Créer une salle</button></div>` : ''}<h2>Salles de ta faction</h2><div class="raid-native-rooms">${rooms.map(r => { const ids = Object.values(r.slots || {}), joined = ids.includes(String(window.ChibiGameSync?.accountId)); return `<article><b>${txt(r.meta.bossName)}</b><span>${ids.length}/3 joueurs</span><button data-join="${txt(r.id)}" ${ids.length >= 3 && !joined ? 'disabled' : ''}>${joined ? 'Reprendre' : 'Rejoindre'}</button></article>`; }).join('') || '<p>Aucune salle. Choisis un boss pour la créer.</p>'}</div>`}${notice ? `<p class="raid-native-notice" role="status">${txt(notice)}</p>` : ''}</section>`;
      overlay.querySelector('.raid-native-close').onclick = close;
      overlay.querySelectorAll('[data-boss]').forEach(button => mountBossSprite(button.querySelector('.raid-monster-art'), button.dataset.boss));
      if (!faction) {
        const setup = document.createElement('section'); setup.className = 'raid-faction-setup';
        setup.innerHTML = '<div><small>TON GROUPE</small><h2>Créer une faction</h2><p>Choisis un nom ou rejoins une faction existante pour combattre en Raid.</p></div><form><input name="name" minlength="3" maxlength="32" placeholder="Nom de la faction" required><button type="submit">Créer la faction</button></form><div class="raid-faction-list"></div>';
        overlay.querySelector('.raid-native').insertBefore(setup, overlay.querySelector('.raid-native-open-social'));
        const list = setup.querySelector('.raid-faction-list');
        if (!factions.length) list.innerHTML = '<p>Aucune faction pour le moment. Crée la première.</p>';
        factions.forEach(item => {
          const row = document.createElement('article'), title = document.createElement('b'), count = document.createElement('small'), join = document.createElement('button');
          title.textContent = item.name; count.textContent = `${Object.keys(item.members || {}).length} membre(s)`; join.textContent = 'Rejoindre'; row.append(title, count, join); list.appendChild(row);
          join.onclick = async () => { join.disabled = true; try { await ChibiSocial.joinFaction(item); await refreshFaction(); renderHall('Faction rejointe. Prépare ton duo pour lancer un Raid.'); } catch (err) { renderHall(err.message || 'Impossible de rejoindre la faction.'); } };
        });
        setup.querySelector('form').onsubmit = async event => { event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true; try { await ChibiSocial.createFaction(new FormData(event.currentTarget).get('name')); await refreshFaction(); renderHall('Faction créée. Prépare un duo pour ouvrir un Raid.'); } catch (err) { renderHall(err.message || 'Impossible de créer la faction.'); } };
      }
      overlay.querySelector('.raid-native-open-social')?.addEventListener('click', () => { close(); document.querySelector('.hub-nav button:nth-child(5)')?.click(); });
      overlay.querySelectorAll('[data-boss]').forEach(button => button.onclick = () => { selected = bosses.find(b => b.id === button.dataset.boss); renderHall(); });
      overlay.querySelector('.raid-native-create')?.addEventListener('click', async event => { if (team().length !== 2) return renderHall('Équipe deux personnages et leurs psychs dans Team avant le Raid.'); event.currentTarget.disabled = true; try { const roomId = await ChibiSocial.createRaidRoom(selected, team()); enter(roomId); } catch (err) { renderHall(err.message || 'Impossible de créer la salle.'); } });
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
      ChibiSocial.watchRaidRoom(roomId, room => { if (!room) return; renderBattle(room, roomId); }, error => renderHall(error.message || 'Connexion à la salle interrompue.')).then(off => activeStop = off).catch(err => renderHall(err.message));
    }
    function renderBattle(room, roomId) {
      clearSpriteTimers();
      const uid = String(window.ChibiGameSync?.accountId), me = room.players?.[uid], result = compute(room), mine = result.squads[uid] || me?.team || [], round = room.actions?.[result.turn] || {}, chosen = {};
      const complete = result.ids.length === 3 && result.ids.every(id => round[id]?.plans), done = result.won || result.lost;
      overlay.innerHTML = `<section class="raid-native raid-live"><header><div><small>RAID DE FACTION · ${result.ids.length}/3</small><h1>${txt(room.meta.bossName)}</h1><p>Tour ${result.turn} · Niveau 200</p></div><button class="raid-native-close">×</button></header><div class="raid-native-boss"><span>☠</span><b>${txt(room.meta.bossName)}</b><i><u style="width:${Math.max(0,100*result.hp/room.meta.bossHp)}%"></u></i><small>${Math.max(0,result.hp).toLocaleString()} / ${Number(room.meta.bossHp).toLocaleString()} PV</small></div><div class="raid-native-parties">${result.ids.map(id => `<article><h3>${txt(room.players[id].name)}${id===uid?' · Toi':''}</h3><div>${(result.squads[id]||[]).map(f=>`<span>${txt(f.name)}<i>${f.hp}/${f.maxHp} PV</i></span>`).join('')}</div><small>${round[id]?.plans?'Actions envoyées':'Choix en cours'}</small></article>`).join('')}</div><h2>Tes actions</h2><div class="raid-native-plans">${mine.map((f,i)=>`<article><b>${txt(f.name)} · ${f.hp}/${f.maxHp} PV</b><select data-action="${i}" ${round[uid]?.plans||done||f.hp<=0?'disabled':''}><option value="">Choisir un psych</option>${f.loadout.map(id=>{const pin=window.ChibiGameCatalog.badges[id];return pin?`<option value="${txt(id)}">${txt(pin.name)} · ${txt(pin.cost)} EN</option>`:''}).join('')}<option value="guard">Défendre</option></select></article>`).join('')}</div><button class="raid-native-submit" ${round[uid]?.plans||done?'disabled':''}>${done?(result.won?'Boss vaincu':'Raid terminé'):round[uid]?.plans?'Actions validées · attente du groupe':'Valider les deux actions'}</button><button class="raid-native-forfeit">Abandonner le Raid</button></section>`;
      overlay.querySelector('.raid-native-close').onclick = close;
      mountBossSprite(overlay.querySelector('.raid-native-boss>span'), room.meta.bossId, true);
      overlay.querySelectorAll('[data-action]').forEach(select => select.onchange = () => { chosen[select.dataset.action] = select.value === 'guard' ? { kind: 'guard' } : { kind: 'psych', pin: select.value }; });
      overlay.querySelector('.raid-native-submit').onclick = async event => { const selects = [...overlay.querySelectorAll('[data-action]')]; if (selects.some(s => !s.value)) return; event.currentTarget.disabled = true; try { await ChibiSocial.submitRaidAction(roomId, result.turn, Object.fromEntries(selects.map(s => [s.dataset.action, s.value === 'guard' ? { kind: 'guard' } : { kind: 'psych', pin: s.value }]))); } catch (err) { renderBattle(room, roomId); const notice = document.createElement('p'); notice.className = 'raid-native-notice'; notice.setAttribute('role', 'status'); notice.textContent = err.message || 'Envoi impossible'; overlay.querySelector('.raid-native').appendChild(notice); } };
      overlay.querySelector('.raid-native-forfeit').onclick = async () => { try { await ChibiSocial.forfeitRaid(roomId); close(); } catch (err) { const notice = document.createElement('p'); notice.className = 'raid-native-notice'; notice.setAttribute('role', 'status'); notice.textContent = err.message || 'Abandon impossible'; overlay.querySelector('.raid-native').appendChild(notice); } };
    }
    async function refreshFaction() {
      stop?.(); stop = null; faction = await ChibiSocial.myFaction();
      if (faction) stop = await ChibiSocial.watchRaidRooms(value => { rooms = value; renderHall(); }, error => renderHall(error.message || 'La liste des Raids est inaccessible.'));
      else { rooms = []; factions = await ChibiSocial.factionList(); }
    }
    refreshFaction().then(() => renderHall()).catch(err => renderHall(err.message || 'La liste des Raids est inaccessible.'));
    renderHall();
  }
})();
