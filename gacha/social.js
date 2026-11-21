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
  window.ChibiSocial = { ready, publish, state, watch, request, acceptRequest, declineRequest, removeFriend, invite, acceptInvite, declineInvite };
})();
