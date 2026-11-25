/* Account save bridge. Only a phone may import the pre-sync local save. */
(function () {
  'use strict';
  const key = 'chibi.reapers-run.party.v1';
  const pendingKey = key + '.pending-cloud';
  const ownerKey = key + '.account';
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const client = 'device-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
  let activeUid = null, activeName = "Joueur";
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
  function rememberEndedRun(profile,uid){
    const run=profile?.run;if(!uid||!run||run.status==='active'||!['lost','complete','abandoned'].includes(run.status))return;
    const keyName=key+'.ended-runs.'+uid,ended=read(keyName)||{};
    ended[run.id]=run.status;localStorage.setItem(keyName,JSON.stringify(ended));
  }
  function protectEndedRun(profile,uid){
    const run=profile?.run,ended=read(key+'.ended-runs.'+uid)||{};
    return run&&run.status==='active'&&ended[run.id]?{...profile,run:{...run,status:ended[run.id],pending:null}}:profile;
  }
  function protectFreeWishes(profile,uid) {
    profile=protectEndedRun(profile,uid);
    const receipt=read(key+'.free-receipt.'+uid);
    if(!receipt||receipt.version!==1)return profile;
    return {...profile,freeWishVersion:1,starterWishesGranted:true,
      freeWishSpent:Math.max(Number(profile.freeWishSpent)||0,receipt.spent||0),
      lastFreeWishDay:receipt.day>String(profile.lastFreeWishDay||"")?receipt.day:profile.lastFreeWishDay,
      freeWishDaySpent:receipt.day>String(profile.lastFreeWishDay||"")?receipt.daySpent:profile.lastFreeWishDay===receipt.day?Math.max(Number(profile.freeWishDaySpent)||0,receipt.daySpent||0):Number(profile.freeWishDaySpent)||0};
  }
  function rememberFreeWishes(profile,uid) {
    rememberEndedRun(profile,uid);
    if(profile.freeWishVersion!==1)return;
    const old=read(key+'.free-receipt.'+uid);
    const newer=old&&old.day>profile.lastFreeWishDay;
    localStorage.setItem(key+'.free-receipt.'+uid,JSON.stringify({version:1,
      spent:Math.max(Number(profile.freeWishSpent)||0,old?.spent||0),
      day:newer?old.day:profile.lastFreeWishDay,
      daySpent:newer?old.daySpent:old?.day===profile.lastFreeWishDay?Math.max(old.daySpent||0,profile.freeWishDaySpent||0):profile.freeWishDaySpent||0}));
  }

  function install(record, uid) {
    if (!record || !Number.isSafeInteger(record.rev)) throw Error('Sauvegarde distante invalide');
    const profile = protectFreeWishes(JSON.parse(record.profileJson),uid);
    if (!valid(profile)) throw Error('Progression distante invalide');
    backup();
    rememberFreeWishes(profile,uid);
    localStorage.setItem(key, JSON.stringify(profile));
    localStorage.setItem(ownerKey, uid);
    revision = record.rev;
    window.dispatchEvent(new CustomEvent('chibi:save-loaded'));
    // Same-origin game/gacha frames receive the ordinary storage event too.
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }
  function record(profile, rev, initialSource) {
    return { version: 1, rev, initialSource, profileJson: JSON.stringify(protectFreeWishes(profile,activeUid)), client,
      updatedAt: firebase.database.ServerValue.TIMESTAMP };
  }
  let missionScores={}, missionRefs=[], missionTimer=null, missionNotify=null, missionUser=null;
  let missionState='idle';
  function notifyMissions(){
    window.dispatchEvent(new CustomEvent('chibi:mission-scores',{detail:{scores:{...missionScores},state:missionState}}));
  }
  function stopMissions(){
    missionRefs.forEach(({ref,listener})=>ref.off('value',listener));missionRefs=[];
    clearInterval(missionTimer);clearTimeout(missionNotify);missionTimer=null;missionScores={};missionUser=null;missionState='idle';
  }
  function missionDay(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
  }
  async function watchMissions(user,uid,token){
    missionUser=user;missionState='loading';
    const subscribe=day=>{
      if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||missionRefs.some(x=>x.day===day))return;
      const ref=firebase.database().ref('missions/'+day+'/'+uid);
      const listener=snapshot=>{
        if(token!==generation)return;
        const score=Number(snapshot.val()?.score);
        if(Number.isFinite(score)&&score>=0&&score<=1000000)missionScores[day]=Math.floor(score);
        missionState='ready';clearTimeout(missionNotify);missionNotify=setTimeout(notifyMissions,150);
      };
      missionRefs.push({day,ref,listener});
      ref.on('value',listener,()=>{missionState='error';notifyMissions();});
    };
    const scan=async()=>{
      if(token!==generation)return;
      subscribe(missionDay());subscribe(missionDay(new Date(Date.now()-86400000)));
      try{
        // Read only day keys, then subscribe only to this account's own score.
        const auth=await user.getIdToken();
        const url=firebase.database().ref('missions').toString()+'.json?shallow=true&auth='+encodeURIComponent(auth);
        const response=await fetch(url,{cache:'no-store'});
        if(!response.ok)throw Error('Missions indisponibles');
        const days=await response.json();if(token!==generation)return;
        Object.keys(days||{}).forEach(subscribe);
        missionState='ready';notifyMissions();
      }catch(_){if(token===generation){missionState='error';notifyMissions();}}
    };
    await scan();
    if(token!==generation)return;
    missionTimer=setInterval(()=>{
      subscribe(missionDay());subscribe(missionDay(new Date(Date.now()-86400000)));
    },60000);
  }
  async function publishLeaderboard(profile) {
    const tracked=typeof profile.hasPlayed==='boolean' && Number.isSafeInteger(profile.wishesMade);
    const participated=tracked ? profile.hasPlayed || profile.wishesMade>0 :
      Number(profile.bestFloor)>0 || (profile.owned||[]).some(name=>!profile.starterNekuGranted||name!=='NEKU') ||
      (profile.pins||[]).some(id=>!profile.starterNekuGranted||id!=='pin266') || Object.values(profile.xp||profile.wins||{}).some(x=>Number(x)>0);
    if(!activeUid || !participated)return;
    const uid=activeUid,name=activeName;
    const floor=Math.min(100,Math.max(0,Math.floor(Number(profile.bestFloor)||0)));
    await firebase.database().ref('mobileLeaderboard/'+uid).transaction(current=>({
      name,participated:true,bestFloor:Math.max(floor,Math.min(100,Number(current?.bestFloor)||0)),
      updatedAt:firebase.database.ServerValue.TIMESTAMP
    }),undefined,false);
  }
  function project(profile) {
    publishLeaderboard(profile).catch(()=>window.dispatchEvent(new CustomEvent('chibi:leaderboard-state',{detail:{kind:'error',message:'Classement indisponible : vérifie les règles Firebase.'}})));
  }
  const archiving=new Set(),archived=new Set();
  let historyState='idle';
  async function archiveHistory(events,uid,token){
    const done=[];historyState='saving';
    for(const event of events||[]){
      if(token!==generation)return;
      if(archiving.has(event.id))continue;
      archiving.add(event.id);
      try{
        const target=firebase.database().ref('wishHistory/'+uid+'/'+event.id);
        const result=await target.transaction(current=>current?undefined:event,undefined,false);
        if(result.committed||result.snapshot.val())done.push(event.id);
      }catch(_){historyState='error';}finally{archiving.delete(event.id);}
    }
    if(token!==generation)return;
    done.forEach(id=>archived.add(id));
    if(done.length)window.dispatchEvent(new CustomEvent('chibi:wish-archived',{detail:{ids:done}}));
    if(historyState!=='error')historyState='ready';
  }
  async function historyPage(before){
    if(!activeUid||!ref)throw Error('Connecte-toi au même compte Discord pour consulter les archives.');
    const token=generation;
    // Refresh also retries receipts retained after a connection or rules failure.
    const saved=(await ref.get()).val();
    if(token!==generation)throw Error('Le compte a changé. Rouvre l’historique.');
    if(saved)await archiveHistory(JSON.parse(saved.profileJson).wishEvents,activeUid,token);
    let query=firebase.database().ref('wishHistory/'+activeUid).orderByKey();
    if(before)query=query.endBefore(before);
    const snapshot=await query.limitToLast(20).get();
    if(token!==generation)throw Error('Le compte a changé. Rouvre l’historique.');
    const items=Object.values(snapshot.val()||{}).sort((a,b)=>b.id.localeCompare(a.id));
    return {items,cursor:items.length?items[items.length-1].id:null,more:items.length===20};
  }
  async function allWishHistory(){
    if(!activeUid||!ref)throw Error('Connecte-toi au même compte Discord pour vérifier les compensations.');
    const snapshot=await firebase.database().ref('wishHistory/'+activeUid).get();
    return Object.values(snapshot.val()||{});
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
        rememberFreeWishes(JSON.parse(result.snapshot.val().profileJson),uid);
        archiveHistory(JSON.parse(result.snapshot.val().profileJson).wishEvents,uid,token);
        project(profile);
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
    historyPage, allWishHistory,
    get accountId(){return activeUid;},
    get identity(){return activeUid?{id:activeUid,name:activeName}:undefined;},
    get archivedWishIds(){return [...archived];},
    get state() { return state; },
    get missionScores(){return {...missionScores};},
    get missionState(){return missionState;},
    save(profile) {
      if (!ref || !state.ready || !valid(profile)) return;
      rememberEndedRun(profile,activeUid);
      // A browser may play before the account has a phone-backed cloud save.
      // Keep that progress local until a phone creates the authoritative save.
      if (state.kind === 'browser-local') return;
      queue = [profile];
      localStorage.setItem(pendingKey,JSON.stringify({uid:activeUid,baseRev:revision,client,profile}));
      flush(activeUid, generation);
    }
  };
  async function connect(user) {
    const token = ++generation;
    archived.clear();
    stopMissions();
    if (ref && listener) ref.off('value', listener);
    ref = null; queue = []; revision = 0; activeUid=null;
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
      activeName=String(claims.discordName || user.displayName || "Joueur").slice(0,64) || "Joueur";
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
        archiveHistory(JSON.parse(remote.profileJson).wishEvents,String(uid),token);
        project(JSON.parse(remote.profileJson));
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
        announce({ ready: true, kind: 'browser-local', message: 'Progression navigateur locale · tu peux jouer maintenant. Dès qu’une sauvegarde téléphone existe, elle reste prioritaire et sera synchronisée ici.' });
      }
      listener = snapshot => {
        if (token !== generation) return;
        const next = snapshot.val();
        if (!next || next.rev <= revision || (writing && next.client === client)) return;
        // Let the transaction detect a competing writer; never overwrite it blindly.
        if (writing) return;
        try {
          install(next, String(uid));
          archiveHistory(JSON.parse(next.profileJson).wishEvents,String(uid),token);
          announce({ ready: true, kind: 'synced', message: 'Progression synchronisée' });
        } catch (_) { announce({ ready: false, kind: 'error', message: 'Sauvegarde distante illisible. Progression locale conservée.' }); }
      };
      target.on('value', listener, () => announce({ ready: false, kind: 'error', message: 'Accès à la sauvegarde refusé. Les règles Firebase doivent être publiées.' }));
      watchMissions(user,String(uid),token).catch(()=>{if(token===generation){missionState='error';notifyMissions();}});
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
