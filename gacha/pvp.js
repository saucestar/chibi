/* Reapers' Run realtime PVP bridge. Firebase stores matchmaking and match state;
   combat rules stay in game.tsx so both clients render the same battle. */
(function () {
  'use strict';
  let queueRef = null, queueListener = null, activeRef = null, activeListener = null;
  const db = () => window.firebase && firebase.database();
  const identity = () => window.ChibiGameSync && window.ChibiGameSync.identity;
  const safeMode = mode => mode === 'ranked' ? 'ranked' : 'casual';
  const clean = value => JSON.parse(JSON.stringify(value));
  function ready() { return Boolean(db() && firebase.auth().currentUser && identity()); }
  async function rating(uid) {
    const ref = db().ref('pvpRatings/' + uid);
    let value = (await ref.get()).val();
    if ((!value || !Number.isFinite(value.rating)) && identity() && identity().id === uid) {
      await ref.transaction(current => current || { name: identity().name, rating: 1000, wins: 0, losses: 0, draws: 0, games: 0, updatedAt: firebase.database.ServerValue.TIMESTAMP });
      value = (await ref.get()).val();
    }
    return value && Number.isFinite(value.rating) ? value : { rating: 1000, wins: 0, losses: 0, draws: 0, games: 0 };
  }
  async function clearQueue() {
    if (queueRef && identity()) await queueRef.remove().catch(() => {});
    if (queueRef && queueListener) queueRef.off('value', queueListener);
    if (activeRef && activeListener) activeRef.off('value', activeListener);
    queueRef = queueListener = activeRef = activeListener = null;
  }
  async function createMatch(mode, me, rival) {
    const pair = [me.uid, rival.uid].sort(), pairKey = pair.join('-'), now = Date.now();
    const lock = db().ref('pvpPairLocks/' + mode + '/' + pairKey);
    const matchId = mode + '-' + pairKey + '-' + now;
    const claimed = await lock.transaction(current => !current || Number(current.expiresAt) < now ? { id: matchId, expiresAt: now + 30000 } : undefined, undefined, false);
    if (!claimed.committed || claimed.snapshot.val().id !== matchId) return null;
    const players = {};
    players[me.uid] = { name: me.name, rating: me.rating, team: me.team };
    players[rival.uid] = { name: rival.name, rating: rival.rating, team: rival.team };
    const match = { version: 1, mode, status: 'active', turn: 1, host: me.uid, guest: rival.uid, players, actions: {}, settled: {}, createdAt: firebase.database.ServerValue.TIMESTAMP, updatedAt: firebase.database.ServerValue.TIMESTAMP };
    await db().ref('pvpMatches/' + matchId).set(match);
    const update = {};
    update['pvpActive/' + me.uid] = matchId;
    update['pvpActive/' + rival.uid] = matchId;
    update['pvpQueue/' + mode + '/' + me.uid] = null;
    await db().ref().update(update);
    return matchId;
  }
  async function join(mode, team, callbacks) {
    mode = safeMode(mode);
    if (!ready()) throw Error('Connecte-toi à Discord pour jouer en ligne.');
    await clearQueue();
    const who = identity(), currentRating = await rating(who.id);
    const entry = { uid: who.id, name: who.name, rating: currentRating.rating, team: clean(team), joinedAt: firebase.database.ServerValue.TIMESTAMP };
    queueRef = db().ref('pvpQueue/' + mode + '/' + who.id);
    activeRef = db().ref('pvpActive/' + who.id);
    const existing = (await activeRef.get()).val();
    if (existing) { callbacks.match(existing); return; }
    await queueRef.set(entry);
    queueRef.onDisconnect().remove();
    activeListener = snapshot => { if (snapshot.val()) { callbacks.match(snapshot.val()); clearQueue(); } };
    activeRef.on('value', activeListener, callbacks.error);
    const queue = db().ref('pvpQueue/' + mode);
    queueListener = async snapshot => {
      const entries = Object.values(snapshot.val() || {}).filter(item => item && item.uid && Array.isArray(item.team));
      entries.sort((a, b) => Number(a.joinedAt || 0) - Number(b.joinedAt || 0) || String(a.uid).localeCompare(String(b.uid), undefined, { numeric: true }));
      const mine = entries.findIndex(item => String(item.uid) === String(who.id));
      if (mine < 0) return callbacks.waiting(entries.length);
      // Every client sees the same ordered queue and therefore the same pairs:
      // positions 0/1, 2/3, etc. Both peers may try to create the room, while
      // pvpPairLocks guarantees that exactly one transaction wins.
      const pairStart = mine - mine % 2;
      if (pairStart + 1 >= entries.length) return callbacks.waiting(entries.length);
      const first = entries[pairStart], second = entries[pairStart + 1];
      createMatch(mode, first.uid === who.id ? first : second, first.uid === who.id ? second : first).catch(callbacks.error);
      callbacks.waiting(entries.length);
    };
    queue.on('value', queueListener, callbacks.error);
  }
  async function cancel() { await clearQueue(); }
  function watch(matchId, update, error) {
    const ref = db().ref('pvpMatches/' + matchId), listener = snapshot => update(snapshot.val());
    ref.on('value', listener, error);
    return () => ref.off('value', listener);
  }
  async function submit(matchId, turn, plans) {
    const who = identity(); if (!who) throw Error('Compte déconnecté.');
    await db().ref('pvpMatches/' + matchId + '/actions/' + who.id).set({ turn, plans: clean(plans), submittedAt: firebase.database.ServerValue.TIMESTAMP });
  }
  async function resolve(matchId, turn, resolver) {
    return db().ref('pvpMatches/' + matchId).transaction(room => {
      if (!room || room.status !== 'active' || room.turn !== turn) return;
      const ids = [room.host, room.guest], actions = room.actions || {};
      if (!ids.every(uid => actions[uid] && actions[uid].turn === turn)) return;
      return clean(resolver(room));
    }, undefined, false);
  }
  async function forfeit(matchId) {
    const who = identity(); if (!who) return;
    await db().ref('pvpMatches/' + matchId).transaction(room => {
      if (!room || room.status !== 'active' || ![room.host, room.guest].includes(who.id)) return;
      room.status = 'finished'; room.winner = room.host === who.id ? room.guest : room.host;
      room.reason = 'forfeit'; room.finishedAt = Date.now(); room.updatedAt = Date.now(); return room;
    });
  }
  async function closeMatch() {
    const who = identity(); if (who) await db().ref('pvpActive/' + who.id).remove().catch(() => {});
  }
  async function currentMatch() {
    const who = identity(); if (!who || !db()) return null;
    return (await db().ref('pvpActive/' + who.id).get()).val() || null;
  }
  function watchActive(update, error) {
    const who = identity();
    if (!who || !db()) return () => {};
    const ref = db().ref('pvpActive/' + who.id), listener = snapshot => update(snapshot.val() || null);
    ref.on('value', listener, error);
    return () => ref.off('value', listener);
  }
  async function direct(team, rival) {
    if (!ready()) throw Error('Connecte-toi à Discord pour jouer en ligne.');
    if (!rival || !rival.uid || !Array.isArray(rival.team)) throw Error('Invitation PVP invalide.');
    const who = identity(), currentRating = await rating(who.id);
    const me = { uid: who.id, name: who.name, rating: currentRating.rating, team: clean(team) };
    return createMatch('casual', me, { uid: rival.uid, name: rival.name || 'Joueur', rating: Number(rival.rating) || 1000, team: clean(rival.team) });
  }
  async function settle(matchId, room) {
    const who = identity();
    if (!who || !room || room.status !== 'finished' || room.mode !== 'ranked') return null;
    const marker = db().ref('pvpMatches/' + matchId + '/settled/' + who.id);
    const claimed = await marker.transaction(value => value ? undefined : Date.now(), undefined, false);
    if (!claimed.committed) return rating(who.id);
    const rivalId = room.host === who.id ? room.guest : room.host;
    const mine = Number(room.players[who.id].rating) || 1000, rival = Number(room.players[rivalId].rating) || 1000;
    const score = room.winner == null ? .5 : room.winner === who.id ? 1 : 0;
    const expected = 1 / (1 + Math.pow(10, (rival - mine) / 400));
    const nextRating = Math.max(100, Math.round(mine + 32 * (score - expected)));
    await db().ref('pvpRatings/' + who.id).transaction(current => ({
      name: who.name, rating: nextRating,
      wins: Number(current && current.wins || 0) + (score === 1 ? 1 : 0),
      losses: Number(current && current.losses || 0) + (score === 0 ? 1 : 0),
      draws: Number(current && current.draws || 0) + (score === .5 ? 1 : 0),
      games: Number(current && current.games || 0) + 1,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    }));
    return rating(who.id);
  }
  window.ChibiPvp = { ready, rating, currentMatch, watchActive, direct, join, cancel, watch, submit, resolve, forfeit, closeMatch, settle };
})();
