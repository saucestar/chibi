/* Small native raid screen layered over the shipped app bundle. Three members plan together. */
(function () {
  'use strict';
  const storageKey = 'chibi.reapers-run.party.v1';
  const txt = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pv = value => Number(value).toLocaleString(document.documentElement.lang || 'fr');
  function healthBar(hp, maxHp, label) {
    const ratio = Math.min(100, Math.max(0, 100 * hp / Math.max(1, maxHp)));
    return `<div class="raid-health" role="meter" aria-label="${txt(label)}" aria-valuemin="0" aria-valuemax="${Number(maxHp)}" aria-valuenow="${Number(hp)}"><i style="width:${ratio}%"></i></div>`;
  }
  function profile() { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; } }
  function mountBossSprite(host, id, large = false) {
    const spec = window.ChibiRaidSprites?.enemies?.[id]; if (!host || !spec?.atlasFrames?.length) return;
    const previous = host.querySelector('canvas'); if (previous?._raidTimer) clearInterval(previous._raidTimer);
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
    canvas.width = spec.frameWidth; canvas.height = spec.frameHeight; canvas.className = large ? 'raid-boss-pixel-art' : 'raid-monster-pixel-art';
    if (!context) return;
    canvas.setAttribute('aria-hidden', 'true'); context.imageSmoothingEnabled = false;
    const pages = new Map(), frames = spec.atlasFrames; let index = 0, ready = false;
    Promise.all([...new Set(frames.map(frame => frame[0]))].map(async page => pages.set(page, await window.ChibiRaidSprites.loadPage(page))))
      .then(() => { if (!host.isConnected) return; host.replaceChildren(canvas); ready = true; draw(); canvas._raidTimer = setInterval(() => { index = (index + 1) % frames.length; draw(); }, Math.max(100, 1000 / (spec.fps || 4))); })
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
    if (document.querySelector('.raid-overlay')) return;
    if (!window.ChibiSocial?.ready()) return window.alert('Connecte-toi avec Discord pour ouvrir les Raids.');
    const overlay = document.createElement('div'); overlay.className = 'raid-overlay'; document.body.appendChild(overlay);
    let faction = null, factions = [], rooms = [], selected = null, stop = null, activeStop = null;
    let partySprites = [], previousFrame = null, draftKey = '', draft = {}, sendingKey = '', syncActions = null;
    const clearSpriteTimers = () => overlay.querySelectorAll('canvas').forEach(canvas => { if (canvas._raidTimer) clearInterval(canvas._raidTimer); });
    const clearBattleSprites = () => { clearSpriteTimers(); partySprites.forEach(unmount => unmount()); partySprites = []; };
    const close = () => { stop?.(); activeStop?.(); clearBattleSprites(); overlay.remove(); };
    overlay.onclick = event => { if (event.target === overlay) close(); };
    const renderHall = (notice = '') => {
      if (!overlay.isConnected) return;
      clearBattleSprites();
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
      ChibiSocial.watchRaidRoom(roomId, room => { if (room) renderBattle(room, roomId); }, error => renderHall(error.message || 'Connexion à la salle interrompue.')).then(off => {
        if (overlay.isConnected) activeStop = off; else off();
      }).catch(err => renderHall(err.message));
    }
    function renderBattle(room, roomId) {
      if (!overlay.isConnected) return;
      const openPicker = overlay.querySelector('.raid-action-picker[open]')?.dataset.picker;
      clearBattleSprites();
      syncActions = null;
      const uid = String(window.ChibiGameSync?.accountId);
      const result = compute(room);
      const mine = result.squads[uid] || [];
      const round = room.actions?.[result.turn] || {};
      const submitted = Boolean(round[uid]?.plans);
      const done = result.won || result.lost;
      const waiting = result.ids.length < 3;
      const choosing = !waiting && !done && !submitted;
      const key = `${roomId}:${result.turn}`;
      if (draftKey !== key) { draftKey = key; draft = {}; }
      const previous = previousFrame?.roomId === roomId ? previousFrame.result : null;
      const damage = previous ? Math.max(0, previous.hp - result.hp) : 0;
      previousFrame = { roomId, result };
      const bossName = txt(room.meta.bossName);
      const bossArt = window.ChibiGameCatalog.enemies.find(enemy => enemy.id === room.meta.bossId)?.sprite;
      const status = result.won ? 'Boss vaincu !' : result.lost ? 'Raid terminé' :
        waiting ? 'En attente des autres joueurs de la faction' :
        submitted ? 'Actions envoyées · en attente du groupe' : 'Choisis une action par personnage debout';

      const groups = Array.from({ length: 3 }, (_, index) => {
        const id = result.ids[index];
        if (!id) return '<article class="raid-squad raid-squad-empty"><b>Place libre</b></article>';
        return `<article class="raid-squad">
          <div class="raid-party-art" data-squad="${index}" aria-hidden="true"></div>
          <div class="raid-squad-title"><b>${txt(room.players[id].name)}${id === uid ? ' · Toi' : ''}</b>
          ${!waiting && !done ? `<small>${round[id]?.plans ? 'Prêt' : 'En cours'}</small>` : ''}</div>
          ${result.squads[id].map(fighter => `<div class="raid-unit ${fighter.hp <= 0 ? 'raid-unit-down' : ''}">
            <div><b>${txt(fighter.name)}</b><small>${pv(fighter.hp)}/${pv(fighter.maxHp)} PV</small></div>
            ${healthBar(fighter.hp, fighter.maxHp, fighter.name)}
          </div>`).join('')}
        </article>`;
      }).join('');

      const plans = choosing ? mine.map((fighter, index) => {
        if (fighter.hp <= 0) return `<fieldset disabled><legend>${txt(fighter.name)}</legend><small>Hors combat</small></fieldset>`;
        const choices = fighter.loadout.flatMap(id => {
          const pin = window.ChibiGameCatalog.badges[id];
          return pin ? [[id, pin.name]] : [];
        });
        choices.push(['guard', 'Défendre']);
        return `<details class="raid-action-picker" name="raid-actions" data-picker="${index}" ${openPicker === String(index) && sendingKey !== key ? 'open' : ''}>
          <summary><small>${txt(fighter.name)}</small><b data-selection>${txt(choices.find(([id]) => id === draft[index])?.[1] || 'Choisir une action')}</b></summary>
          <div class="raid-psych-list">
          ${choices.map(([id, label]) => `<button type="button" data-action="${index}" data-choice="${txt(id)}" aria-pressed="false">${txt(label)}</button>`).join('')}
        </div></details>`;
      }).join('') : '';

      overlay.innerHTML = `<section class="raid-native raid-battle">
        <header class="topbar raid-combat-bar"><div><small>RAID DE FACTION · ${result.ids.length}/3</small>
          <h1>${bossName}</h1></div><span class="raid-turn">Tour ${result.turn}</span>
          <button type="button" class="raid-native-close" aria-label="Quitter l’arène">×</button>
        </header>
        <div class="arena raid-arena">
          <div class="raid-boss-hud"><b>Boss · Niv. 200</b>${healthBar(result.hp, room.meta.bossHp, room.meta.bossName)}
            <small>${pv(result.hp)} / ${pv(room.meta.bossHp)} PV</small></div>
          <div class="raid-boss-actor" aria-hidden="true"><span class="raid-boss-sprite">${bossArt ? `<img src="${txt(bossArt)}" alt="">` : '☠'}</span>
            ${damage ? `<b class="raid-damage">−${pv(damage)}</b>` : ''}</div>
          <div class="raid-squads">${groups}</div>
        </div>
        <section class="raid-command" aria-label="Actions de raid">
          <p class="raid-round-status" role="status">${txt(status)}</p>
          ${choosing ? `<div class="raid-actions">${plans}</div><button type="button" class="raid-native-submit" disabled>Valider les actions</button>` : ''}
          ${done ? '' : '<button type="button" class="raid-native-forfeit">Abandonner le raid</button>'}
        </section>
      </section>`;

      overlay.querySelector('.raid-native-close').onclick = close;
      mountBossSprite(overlay.querySelector('.raid-boss-sprite'), room.meta.bossId, true);
      overlay.querySelectorAll('[data-squad]').forEach(host => {
        const fighters = result.squads[result.ids[Number(host.dataset.squad)]] || [];
        const unmount = window.ChibiRaidSprites?.mountParty(host, fighters.filter(fighter => fighter.hp > 0).map(fighter => fighter.name));
        if (unmount) partySprites.push(unmount);
      });

      if (choosing) {
        const buttons = [...overlay.querySelectorAll('[data-action]')];
        const submit = overlay.querySelector('.raid-native-submit');
        const sync = () => {
          buttons.forEach(button => {
            button.setAttribute('aria-pressed', String(draft[button.dataset.action] === button.dataset.choice));
            button.disabled = sendingKey === key;
          });
          submit.disabled = sendingKey === key || mine.some((fighter, index) => fighter.hp > 0 && !draft[index]);
        };
        syncActions = sync;
        buttons.forEach(button => button.onclick = () => {
          draft[button.dataset.action] = button.dataset.choice;
          const picker = button.closest('details');
          picker.querySelector('[data-selection]').textContent = button.textContent;
          picker.open = false;
          picker.querySelector('summary').focus();
          sync();
        });
        submit.onclick = async () => {
          if (submit.disabled) return;
          sendingKey = key;
          sync();
          const actions = Object.fromEntries(mine.map((fighter, index) => {
            const choice = fighter.hp > 0 ? draft[index] : 'guard';
            return [index, choice === 'guard' ? { kind: 'guard' } : { kind: 'psych', pin: choice }];
          }));
          try {
            await ChibiSocial.submitRaidAction(roomId, result.turn, actions);
          } catch (error) {
            if (sendingKey === key) sendingKey = '';
            const message = overlay.querySelector('.raid-round-status');
            if (message && draftKey === key && syncActions) {
              syncActions();
              message.textContent = error.message || 'Envoi impossible';
            }
          }
        };
        sync();
      }
      const forfeit = overlay.querySelector('.raid-native-forfeit');
      if (forfeit) forfeit.onclick = async () => {
        forfeit.disabled = true;
        try { await ChibiSocial.forfeitRaid(roomId); close(); }
        catch (error) {
          if (!forfeit.isConnected) return;
          forfeit.disabled = false;
          overlay.querySelector('.raid-round-status').textContent = error.message || 'Abandon impossible';
        }
      };
    }
    async function refreshFaction() {
      stop?.(); stop = null; faction = await ChibiSocial.myFaction();
      if (faction) {
        const off = await ChibiSocial.watchRaidRooms(value => { rooms = value; renderHall(); }, error => renderHall(error.message || 'La liste des Raids est inaccessible.'));
        if (overlay.isConnected) stop = off; else off();
      }
      else { rooms = []; factions = await ChibiSocial.factionList(); }
    }
    refreshFaction().then(() => renderHall()).catch(err => renderHall(err.message || 'La liste des Raids est inaccessible.'));
    renderHall();
  }
  window.ChibiRaid = { open };
})();
