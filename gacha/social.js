/* Reapers' Run social bridge: public profiles, friends and direct Casual PVP invitations. */
(function () {
  'use strict';
  const db = () => window.firebase && firebase.database();
  const identity = () => window.ChibiGameSync && window.ChibiGameSync.identity;
  const clean = value => JSON.parse(JSON.stringify(value));
  function ready() { return Boolean(db() && firebase.auth().currentUser && identity()); }
  function mine() { const who = identity(); if (!who) throw Error('Connecte-toi à Discord pour utiliser Social.'); return who; }
  async function publish(profile) {
    const who = mine();
    const value = clean({ ...profile, uid: who.id, name: who.name, updatedAt: firebase.database.ServerValue.TIMESTAMP });
    await db().ref('socialProfiles/' + who.id).set(value);
  }
  async function state() {
    const who = mine();
    const [profiles, friends, requests, invites] = await Promise.all([
      db().ref('socialProfiles').get(), db().ref('friends/' + who.id).get(),
      db().ref('friendRequests/' + who.id).get(), db().ref('pvpInvites/' + who.id).get()
    ]);
    const others = Object.values(profiles.val() || {}).filter(item => item && String(item.uid) !== String(who.id));
    return { profiles: others, friends: Object.values(friends.val() || {}), requests: Object.values(requests.val() || {}), invites: Object.values(invites.val() || {}) };
  }
  function watch(update, error) {
    const who = identity(); if (!who || !db()) return () => {};
    const refs = ['socialProfiles', 'friends/' + who.id, 'friendRequests/' + who.id, 'pvpInvites/' + who.id].map(path => db().ref(path));
    let queued = false;
    const refresh = () => { if (queued) return; queued = true; Promise.resolve().then(() => { queued = false; state().then(update).catch(error); }); };
    refs.forEach(ref => ref.on('value', refresh, error));
    return () => refs.forEach(ref => ref.off('value', refresh));
  }
  async function request(uid, name) {
    const who = mine(); if (String(uid) === String(who.id)) return;
    await db().ref('friendRequests/' + uid + '/' + who.id).set({ uid: who.id, name: who.name, createdAt: firebase.database.ServerValue.TIMESTAMP });
  }
  async function acceptRequest(player) {
    const who = mine(), now = firebase.database.ServerValue.TIMESTAMP, update = {};
    update['friends/' + who.id + '/' + player.uid] = { uid: player.uid, name: player.name, since: now };
    update['friends/' + player.uid + '/' + who.id] = { uid: who.id, name: who.name, since: now };
    update['friendRequests/' + who.id + '/' + player.uid] = null;
    await db().ref().update(update);
  }
  async function declineRequest(uid) { const who = mine(); await db().ref('friendRequests/' + who.id + '/' + uid).remove(); }
  async function removeFriend(uid) {
    const who = mine(), update = {};
    update['friends/' + who.id + '/' + uid] = null; update['friends/' + uid + '/' + who.id] = null;
    await db().ref().update(update);
  }
  async function invite(uid, team) {
    const who = mine();
    const rating = window.ChibiPvp ? await window.ChibiPvp.rating(who.id) : { rating: 1000 };
    await db().ref('pvpInvites/' + uid + '/' + who.id).set({ uid: who.id, name: who.name, rating: Number(rating.rating) || 1000, team: clean(team), createdAt: firebase.database.ServerValue.TIMESTAMP });
  }
  async function acceptInvite(invitation, team) {
    const who = mine();
    const matchId = await window.ChibiPvp.direct(team, invitation);
    await db().ref('pvpInvites/' + who.id + '/' + invitation.uid).remove();
    if (!matchId) throw Error('Cette invitation est déjà en cours de traitement.');
    return matchId;
  }
  async function declineInvite(uid) { const who = mine(); await db().ref('pvpInvites/' + who.id + '/' + uid).remove(); }

  const chatKey = 'twewy.chat.ecdh.v1.';
  const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const un64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  async function identityKeys() {
    const who = mine(), storageKey = chatKey + who.id;
    let pair = null;
    try { pair = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch {}
    let privateKey, publicJwk;
    if (pair?.privateKey && pair?.publicKey) {
      privateKey = await crypto.subtle.importKey('jwk', pair.privateKey, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
      publicJwk = pair.publicKey;
    } else {
      const generated = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
      privateKey = await crypto.subtle.importKey('jwk', await crypto.subtle.exportKey('jwk', generated.privateKey), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
      publicJwk = await crypto.subtle.exportKey('jwk', generated.publicKey);
      localStorage.setItem(storageKey, JSON.stringify({ privateKey: await crypto.subtle.exportKey('jwk', generated.privateKey), publicKey: publicJwk }));
    }
    await db().ref('chatPublicKeys/' + who.id).set({ publicKey: publicJwk, updatedAt: firebase.database.ServerValue.TIMESTAMP });
    return { privateKey, publicJwk };
  }
  async function deriveWrapKey(privateKey, publicJwk, groupId) {
    const publicKey = await crypto.subtle.importKey('jwk', publicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
    const material = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode(groupId), info: new TextEncoder().encode('TWEWY group chat key v1') }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function makeGroupKeyPacket(groupId, rawKey, owner, recipientPublic) {
    const keyPair = await identityKeys(), wrapKey = await deriveWrapKey(keyPair.privateKey, recipientPublic, groupId), iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, rawKey);
    return { owner: owner.id, ownerPublic: keyPair.publicJwk, iv: b64(iv), data: b64(encrypted) };
  }
  async function unlockGroupKey(groupId, packet) {
    const keyPair = await identityKeys(), wrapKey = await deriveWrapKey(keyPair.privateKey, packet.ownerPublic, groupId);
    const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: un64(packet.iv) }, wrapKey, un64(packet.data));
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  async function createChatGroup(name, memberIds) {
    const who = mine(), keys = await identityKeys(), members = [...new Set([String(who.id), ...memberIds.map(String)])];
    if (members.length < 2 || members.length > 16) throw Error('Un groupe doit réunir de 2 à 16 personnes.');
    const groupId = 'chat-' + crypto.randomUUID(), groupKey = crypto.getRandomValues(new Uint8Array(32)), packets = {};
    for (const uid of members) {
      const publicValue = uid === String(who.id) ? keys.publicJwk : (await db().ref('chatPublicKeys/' + uid).get()).val()?.publicKey;
      if (!publicValue) throw Error('Un membre doit ouvrir Social une première fois pour activer son chiffrement.');
      packets[uid] = await makeGroupKeyPacket(groupId, groupKey, who, publicValue);
    }
    const safeName = String(name || 'Discussion').trim().slice(0, 48) || 'Discussion', now = firebase.database.ServerValue.TIMESTAMP, updates = {};
    await db().ref('chatGroups/' + groupId).set({ id: groupId, name: safeName, createdBy: String(who.id), createdAt: now, members: Object.fromEntries(members.map(uid => [uid, true])), packets });
    await Promise.all(members.map(uid => db().ref('chatMembership/' + uid + '/' + groupId).set(true)));
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') await startChatNotifications();
    return groupId;
  }
  async function chatGroups() {
    const who = mine(); await identityKeys();
    const index = (await db().ref('chatMembership/' + who.id).get()).val() || {}, groups = await Promise.all(Object.keys(index).map(async id => (await db().ref('chatGroups/' + id).get()).val()));
    return groups.filter(Boolean).map(group => ({ id: group.id, name: group.name, members: group.members, createdAt: group.createdAt }));
  }
  async function readChat(groupId, limit = 100) {
    const who = mine(), group = (await db().ref('chatGroups/' + groupId).get()).val();
    if (!group?.members?.[who.id]) throw Error('Tu ne fais pas partie de ce groupe.');
    const packet = group.packets?.[who.id]; if (!packet) throw Error('Clé de groupe absente pour cet appareil.');
    const key = await unlockGroupKey(groupId, packet), raw = (await db().ref('chatMessages/' + groupId).orderByChild('createdAt').limitToLast(limit).get()).val() || {};
    return Promise.all(Object.entries(raw).map(async ([id, message]) => {
      try { const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: un64(message.iv) }, key, un64(message.ciphertext)); return { id, sender: message.sender, senderName: message.senderName, createdAt: message.createdAt, text: new TextDecoder().decode(plain) }; } catch { return { id, sender: message.sender, senderName: message.senderName, createdAt: message.createdAt, text: '[Message impossible à déchiffrer sur cet appareil]' }; }
    }));
  }
  async function sendChat(groupId, text) {
    const who = mine(), content = String(text || '').trim(); if (!content || content.length > 2000) throw Error('Le message doit contenir entre 1 et 2 000 caractères.');
    const group = (await db().ref('chatGroups/' + groupId).get()).val(); if (!group?.members?.[who.id]) throw Error('Tu ne fais pas partie de ce groupe.');
    const key = await unlockGroupKey(groupId, group.packets[who.id]), iv = crypto.getRandomValues(new Uint8Array(12)), ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(content)), ref = db().ref('chatMessages/' + groupId).push();
    await ref.set({ sender: String(who.id), senderName: String(who.name).slice(0, 64), iv: b64(iv), ciphertext: b64(ciphertext), createdAt: firebase.database.ServerValue.TIMESTAMP });
    notifyChatRecipients(groupId, ref.key);
  }
  function watchChat(groupId, update, error) {
    const ref = db().ref('chatMessages/' + groupId).orderByChild('createdAt').limitToLast(100);
    const refresh = () => readChat(groupId).then(update).catch(error);
    ref.on('value', refresh, error); return () => ref.off('value', refresh);
  }
  let notificationStops = [], notificationStart = null;
  async function startChatNotifications() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (notificationStart) return notificationStart;
    notificationStart = (async () => {
      notificationStops.forEach(stop => stop()); notificationStops = [];
      const groups = await chatGroups(), who = mine();
      groups.forEach(group => {
        let initialized = false, known = new Set();
        const stop = watchChat(group.id, messages => {
          if (initialized) messages.forEach(message => {
            if (!known.has(message.id) && String(message.sender) !== String(who.id)) {
              const options = { body: 'Un message chiffré t’attend dans le chat.', tag: 'twewy-chat-' + group.id + '-' + message.id, icon: new URL('../icons/player-pin.webp', location.href).href, data: { groupId: group.id } };
              const show = () => { try { new Notification(group.name, options); } catch {} };
              if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(reg => reg?.showNotification ? reg.showNotification(group.name, options) : show()).catch(show); else show();
            }
          });
          known = new Set(messages.map(message => message.id)); initialized = true;
        }, () => {});
        notificationStops.push(stop);
      });
    })().finally(() => { notificationStart = null; });
    return notificationStart;
  }
  async function factionList() { const value = (await db().ref('factions').get()).val() || {}; return Object.values(value); }
  async function myFaction() { const who = mine(), value = (await db().ref('factionMembership/' + who.id).get()).val(); return value ? (await db().ref('factions/' + value.id).get()).val() : null; }
  async function createFaction(name) {
    const who = mine(), safeName = String(name || '').trim().slice(0, 32); if (safeName.length < 3) throw Error('Le nom de faction doit contenir au moins 3 caractères.');
    if (await myFaction()) throw Error('Tu es déjà dans une faction.');
    const id = 'faction-' + crypto.randomUUID(), now = firebase.database.ServerValue.TIMESTAMP;
    await db().ref('factions/' + id).set({ id, name: safeName, leader: String(who.id), createdAt: now, members: { [who.id]: { uid: String(who.id), name: who.name, joinedAt: now } } });
    await db().ref('factionMembership/' + who.id).set({ id, name: safeName }); return id;
  }
  async function joinFaction(faction) {
    const who = mine(); if (await myFaction()) throw Error('Tu es déjà dans une faction.');
    const value = (await db().ref('factions/' + faction.id).get()).val(); if (!value) throw Error('Cette faction n’existe plus.');
    await db().ref('factions/' + faction.id + '/members/' + who.id).set({ uid: String(who.id), name: who.name, joinedAt: firebase.database.ServerValue.TIMESTAMP });
    await db().ref('factionMembership/' + who.id).set({ id: faction.id, name: value.name });
  }
  async function leaveFaction() {
    const who = mine(), membership = await myFaction(); if (!membership) return;
    if (membership.leader === String(who.id)) throw Error('Le chef doit transférer sa faction avant de la quitter.');
    const updates = {}; updates['factions/' + membership.id + '/members/' + who.id] = null; updates['factionMembership/' + who.id] = null; await db().ref().update(updates);
  }
  async function raidRooms() {
    const faction = await myFaction(); if (!faction) throw Error('Tu dois être dans une faction pour ouvrir les Raids.');
    const raw = (await db().ref('raidRooms/' + faction.id).get()).val() || {};
    return Object.entries(raw).filter(([, room]) => room && room.meta).map(([id, room]) => ({ ...room, id })).sort((a, b) => (b.meta.createdAt || 0) - (a.meta.createdAt || 0));
  }
  async function createRaidRoom(boss, team) {
    const who = mine(), faction = await myFaction(); if (!faction) throw Error('Tu dois être dans une faction pour ouvrir les Raids.');
    if (!Array.isArray(team) || team.length !== 2 || team.some(f => !Array.isArray(f.loadout) || !f.loadout.length)) throw Error('Prépare un duo avec ses psychs dans Team.');
    const id = 'raid-' + crypto.randomUUID(), meta = { id, bossId: String(boss.id), bossName: String(boss.name).slice(0, 80), bossHp: Math.max(18000, Math.min(70000, Math.round(Number(boss.hp) * 8))), bossAttack: Math.max(120, Math.round(Number(boss.attack) * 5)), bossElements: Array.isArray(boss.elements) ? boss.elements : ['normal'], bossSpeed: Math.max(1, Number(boss.speed) || 1), createdBy: String(who.id), createdAt: firebase.database.ServerValue.TIMESTAMP };
    await db().ref('raidRooms/' + faction.id + '/' + id + '/meta').set(meta);
    try { await joinRaidRoom(id, team); } catch (error) { await db().ref('raidRooms/' + faction.id + '/' + id + '/meta').remove().catch(() => {}); throw error; }
    return id;
  }
  async function joinRaidRoom(roomId, team) {
    const who = mine(), faction = await myFaction(); if (!faction) throw Error('Tu dois être dans une faction pour rejoindre les Raids.');
    const path = 'raidRooms/' + faction.id + '/' + roomId, roomRef = db().ref(path), room = (await roomRef.get()).val();
    if (!room?.meta) throw Error('Cette salle de Raid n’existe plus.');
    if (!Array.isArray(team) || team.length !== 2 || team.some(f => !Array.isArray(f.loadout) || !f.loadout.length)) throw Error('Prépare un duo avec ses psychs dans Team.');
    if (Object.values(room.slots || {}).includes(String(who.id))) {
      if (!room.players?.[who.id]) await roomRef.child('players/' + who.id).set(clean({ uid: String(who.id), name: String(who.name).slice(0, 64), team }));
      return roomId;
    }
    for (let slot = 0; slot < 3; slot++) {
      const claim = await roomRef.child('slots/' + slot).transaction(current => current == null ? String(who.id) : undefined, undefined, false);
      if (!claim.committed) continue;
      const snapshot = clean({ uid: String(who.id), name: String(who.name).slice(0, 64), team });
      await roomRef.child('players/' + who.id).set(snapshot);
      return roomId;
    }
    throw Error('Cette salle est complète.');
  }
  async function watchRaidRoom(roomId, update, error) {
    const who = mine(), faction = await myFaction(); if (!faction) throw Error('Tu dois être dans une faction pour rejoindre les Raids.');
    const ref = db().ref('raidRooms/' + faction.id + '/' + roomId), listener = snapshot => update(snapshot.val());
    ref.on('value', listener, error); return () => ref.off('value', listener);
  }
  async function watchRaidRooms(update, error) {
    const who = mine(), faction = await myFaction(); if (!faction) throw Error('Tu dois être dans une faction pour ouvrir les Raids.');
    const ref = db().ref('raidRooms/' + faction.id), listener = snapshot => update(Object.entries(snapshot.val() || {}).filter(([, room]) => room && room.meta).map(([id, room]) => ({ ...room, id })).sort((a, b) => (b.meta.createdAt || 0) - (a.meta.createdAt || 0)));
    ref.on('value', listener, error); return () => ref.off('value', listener);
  }
  async function submitRaidAction(roomId, turn, plans) {
    const who = mine(), faction = await myFaction(); if (!faction) throw Error('Tu dois être dans une faction pour participer aux Raids.');
    await db().ref('raidRooms/' + faction.id + '/' + roomId + '/actions/' + turn + '/' + who.id).set({ plans, at: firebase.database.ServerValue.TIMESTAMP });
  }
  async function forfeitRaid(roomId) {
    const who = mine(), faction = await myFaction(); if (!faction) return;
    await db().ref('raidRooms/' + faction.id + '/' + roomId + '/forfeits/' + who.id).set(true);
  }
  async function registerPushEndpoint(subscription) {
    const who = mine();
    if (!subscription || typeof subscription.endpoint !== 'string' || !subscription.keys?.p256dh || !subscription.keys?.auth) throw Error('Abonnement push invalide.');
    const key = btoa(unescape(encodeURIComponent(subscription.endpoint))).replace(/[.#$\[\]/]/g, '_').slice(-120);
    await db().ref('chatPushEndpoints/' + who.id + '/' + key).set({ endpoint: subscription.endpoint, keys: subscription.keys, updatedAt: firebase.database.ServerValue.TIMESTAMP });
  }
  async function enableChatPush(publicKey) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw Error('Les notifications push ne sont pas prises en charge par ce navigateur.');
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodePushKey(publicKey) });
    await registerPushEndpoint(subscription.toJSON());
    return subscription;
  }
  function decodePushKey(value) { const s = String(value).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(s + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0)); }
  async function removePushEndpoint(key) { const who = mine(); await db().ref('chatPushEndpoints/' + who.id + '/' + key).remove(); }
  async function notifyChatRecipients(groupId, messageId) {
    const who = mine(), token = await firebase.auth().currentUser.getIdToken();
    const workerUrl = window.ChibiAuth?.workerUrl || 'https://chibi-auth.lucasdele77220.workers.dev';
    try { await fetch(workerUrl + '/chat/notify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ groupId: String(groupId), messageId: String(messageId) }) }); } catch (_) {}
  }
  window.ChibiSocial = { ready, publish, state, watch, request, acceptRequest, declineRequest, removeFriend, invite, acceptInvite, declineInvite, identityKeys, createChatGroup, chatGroups, readChat, sendChat, watchChat, startChatNotifications, factionList, myFaction, createFaction, joinFaction, leaveFaction, raidRooms, watchRaidRooms, createRaidRoom, joinRaidRoom, watchRaidRoom, submitRaidAction, forfeitRaid, registerPushEndpoint, enableChatPush, removePushEndpoint, notifyChatRecipients };
})();
