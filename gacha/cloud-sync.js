/* Account save bridge. Only a phone may import the pre-sync local save. */
(function () {
  'use strict';
  const key = 'chibi.reapers-run.party.v1';
  const pendingKey = key + '.pending-cloud';
  const ownerKey = key + '.account';
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const client = 'device-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  let activeUid = null;
  let ref = null, revision = 0, generation = 0, writing = false, queue = [], listener = null;
  let state = { ready: false, message: 'Connexion à la sauvegarde…', kind: 'loading' };
  function announce(next) {
    state = next;
    window.dispatchEvent(new CustomEvent('chibi:save-state', { detail: state }));
  }
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
  function valid(p) {
    return p && Number.isSafeInteger(p.coins) && p.coins >= 0 && Array.isArray(p.owned) &&
      Array.isArray(p.equipped) && p.loadout && typeof p.loadout === 'object';
  }
  function backup() {
    const value = localStorage.getItem(key);
    if (value && !localStorage.getItem(key + '.before-cloud.' + (mobile ? 'mobile' : 'browser')))
      localStorage.setItem(key + '.before-cloud.' + (mobile ? 'mobile' : 'browser'), value);
  }
  function install(record, uid) {
    if (!record || !Number.isSafeInteger(record.rev)) throw Error('Sauvegarde distante invalide');
    const profile = JSON.parse(record.profileJson);
    if (!valid(profile)) throw Error('Progression distante invalide');
    backup();
    localStorage.setItem(key, JSON.stringify(profile));
    localStorage.setItem(ownerKey, uid);
    revision = record.rev;
    window.dispatchEvent(new CustomEvent('chibi:save-loaded'));
    // Same-origin game/gacha frames receive the ordinary storage event too.
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }
  function record(profile, rev, initialSource) {
    return { version: 1, rev, initialSource, profileJson: JSON.stringify(profile), client,
      updatedAt: firebase.database.ServerValue.TIMESTAMP };
  }
  async function flush(uid, token) {
    if (writing || !ref || !queue.length) return;
    writing = true;
    while (queue.length && token === generation) {
      const profile = queue.shift(), expected = revision, target = ref;
      announce({ ready: true, kind: 'saving', message: 'Sauvegarde en cours…' });
      try {
        localStorage.setItem(pendingKey, JSON.stringify({ uid, baseRev: expected, client, profile }));
        const result = await target.transaction(current => {
          if (!current) return expected === 0 && mobile ? record(profile, 1, "mobile-v1") : undefined;
          if (current.rev !== expected) return;
          return record(profile, expected + 1, current.initialSource);
        }, undefined, false);
        if (token !== generation) break;
        if (!result.committed) {
          queue = [];
          const current = (await target.get()).val();
          if (token !== generation) break;
          if (current) install(current, uid);
          localStorage.removeItem(pendingKey);
          announce({ ready: true, kind: 'conflict', message: 'Progression actualisée depuis l’autre appareil. Relance la partie pour la reprendre.' });
          break;
        }
        revision = result.snapshot.val().rev;
        localStorage.setItem(ownerKey, uid);
        if(queue.length) localStorage.setItem(pendingKey, JSON.stringify({uid,baseRev:revision,client,profile:queue[queue.length-1]}));
        else localStorage.removeItem(pendingKey);
        if (!queue.length) announce({ ready: true, kind: 'synced', message: 'Progression synchronisée' });
      } catch (_) {
        queue = [];
        if (token === generation) announce({ ready: true, kind: 'error', message: 'Sauvegarde locale conservée. Synchronisation indisponible : vérifie la connexion et les règles Firebase.' });
        break;
      }
    }
    writing = false;
    if (queue.length && ref) flush(activeUid, generation);
  }
  window.ChibiGameSync = {
    get state() { return state; },
    save(profile) {
      if (!ref || !state.ready || !valid(profile)) return;
      queue = [profile];
      localStorage.setItem(pendingKey,JSON.stringify({uid:activeUid,baseRev:revision,client,profile}));
      flush(activeUid, generation);
    }
  };
  async function connect(user) {
    const token = ++generation;
    if (ref && listener) ref.off('value', listener);
    ref = null; queue = []; revision = 0;
    if (!user) {
      announce({ ready: true, kind: 'local', message: 'Progression locale · connecte-toi au même compte Discord sur les 2 appareils pour synchroniser.' });
      return;
    }
    announce({ ready: false, kind: 'loading', message: 'Récupération de la progression du téléphone…' });
    try {
      const claims = (await user.getIdTokenResult()).claims;
      if (token !== generation) return;
      const uid = claims.discordId;
      if (!uid || !/^[0-9]{1,25}$/.test(String(uid))) throw Error('Compte non identifié');
      activeUid = String(uid);
      const target = firebase.database().ref('gameSaves/' + uid);
      let remote = (await target.get()).val();
      if (token !== generation) return;
      if (!remote && mobile) {
        const owner = localStorage.getItem(ownerKey), local = read(key);
        if (owner && owner !== String(uid)) throw Error('Autre compte local');
        if (valid(local)) {
          // Transaction: a desktop cannot win a first-upload race against this phone.
          await target.transaction(current => current || record(local, 1, 'mobile-v1'), undefined, false);
          remote = (await target.get()).val();
        }
      }
      if (token !== generation) return;
      ref = target;
      if (remote) {
        const pending = read(pendingKey);
        install(remote, String(uid));
        announce({ ready: true, kind: 'synced', message: 'Progression synchronisée' });
        if (pending && pending.uid === String(uid) && (pending.baseRev === revision || (pending.client === remote.client && pending.baseRev + 1 === revision)) && valid(pending.profile)) {
          localStorage.setItem(key, JSON.stringify(pending.profile));
          window.dispatchEvent(new CustomEvent('chibi:save-loaded'));
          queue.push(pending.profile);
          flush(String(uid), token);
        } else localStorage.removeItem(pendingKey);
      } else if (mobile) {
        announce({ ready: true, kind: 'local', message: 'La progression de ce téléphone sera sauvegardée sur ton compte dès ta prochaine action.' });
      } else {
        announce({ ready: false, kind: 'waiting', message: 'Ouvre le jeu sur ton téléphone avec ce compte pour importer sa progression. La sauvegarde navigateur ne sera pas importée.' });
      }
      listener = snapshot => {
        if (token !== generation) return;
        const next = snapshot.val();
        if (!next || next.rev <= revision || (writing && next.client === client)) return;
        // Let the transaction detect a competing writer; never overwrite it blindly.
        if (writing) return;
        try {
          install(next, String(uid));
          announce({ ready: true, kind: 'synced', message: 'Progression synchronisée' });
        } catch (_) { announce({ ready: false, kind: 'error', message: 'Sauvegarde distante illisible. Progression locale conservée.' }); }
      };
      target.on('value', listener, () => announce({ ready: false, kind: 'error', message: 'Accès à la sauvegarde refusé. Les règles Firebase doivent être publiées.' }));
    } catch (_) {
      announce({ ready: false, kind: 'error', message: 'Synchronisation indisponible. Progression locale conservée : vérifie la connexion et les règles Firebase.' });
    }
  }
  window.addEventListener('online', () => { if (window.firebase) connect(firebase.auth().currentUser); });
  try {
    if (!window.firebase) throw Error('Firebase indisponible');
    if (!firebase.apps.length) firebase.initializeApp({
      apiKey: 'AIzaSyAZWsfrqCrmDFyvG5RNdQacEUbkAq2qXqM', authDomain: 'chibi-be98b.firebaseapp.com',
      databaseURL: 'https://chibi-be98b-default-rtdb.europe-west1.firebasedatabase.app', projectId: 'chibi-be98b'
    });
    firebase.auth().onAuthStateChanged(connect);
  } catch (_) {
    announce({ ready: false, kind: 'error', message: 'Synchronisation indisponible. Progression locale conservée.' });
  }
})();
