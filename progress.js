// TWEWY Co-op: a member's game progression on their profile page, from what their launcher publishes
// (coop/<discordId>: progress, unlocked, bonusXp, updatedAt, version) and the daily missions (missions/<day>/<discordId>).
// Achievements, XP and levels are computed exactly like the launcher (src/launcher/Profile.cs: Progression).
(function(){
  const WEEKS = ['Shiki', 'Joshua', 'Beat'];
  const GAME_PINS = 304, NO_BRAND = 14;

  function parse(raw){
    const p = { chapter: -1, cleared: false, pins: null, brand: null, brandNames: {} };
    let bits = null, brands = null;
    String(raw || '').split('\n').forEach(line => {
      const eq = line.indexOf('='); if (eq <= 0) return;
      const k = line.slice(0, eq), v = line.slice(eq + 1).trim();
      if (k === 'chapter') p.chapter = parseInt(v, 10);
      else if (k === 'cleared') p.cleared = v === '1';
      else if (k === 'pins') bits = v;
      else if (k === 'brands') brands = v;
      else if (k.startsWith('brandname.') && v) p.brandNames[parseInt(k.slice(10), 10)] = v;
    });
    if (isNaN(p.chapter)) p.chapter = -1;
    if (brands != null){
      p.brand = brands.split(',').map(x => { const n = parseInt(x, 10); return isNaN(n) ? NO_BRAND : n; });
      if (bits != null){
        p.pins = p.brand.map((_, i) => { const nib = parseInt(bits[i >> 2] || '', 16); return !isNaN(nib) && (nib & (8 >> (i % 4))) !== 0; });
      }
    }
    p.owned = p.pins ? p.pins.filter(Boolean).length : 0;
    p.brandCount = b => { let o = 0, t = 0; if (p.pins) p.brand.forEach((x, i) => { if (x === b){ t++; if (p.pins[i]) o++; } }); return { o, t }; };
    return p;
  }

  function build(p){
    const l = [];
    for (let w = 0; w < 3; w++) for (let d = 0; d < 7; d++){
      const idx = w * 7 + d, last = d === 6;
      l.push({ id: 'day' + (idx + 1), sec: 'HISTOIRE', xp: last ? 300 : 100,
        name: last ? 'Fin de la semaine de ' + WEEKS[w] : 'Semaine de ' + WEEKS[w] + '  //  Jour ' + (d + 1),
        desc: 'Terminer le jour ' + (d + 1) + ' de la semaine de ' + WEEKS[w] + '.' });
    }
    l.push({ id: 'secret', sec: 'HISTOIRE', xp: 500, name: 'Le chapitre secret', desc: 'Ouvrir le chapitre secret.' });
    const total = p.pins ? p.pins.length : GAME_PINS;
    const steps = [10, 30]; for (let s = 50; s < total; s += 50) steps.push(s);
    steps.filter(s => s < total).forEach(s => l.push({ id: 'pins' + s, sec: 'COLLECTION DE BADGES', need: s,
      xp: s === 10 ? 100 : s === 30 ? 150 : s === 50 ? 200 : 250,
      name: 'Collection  //  ' + s + ' badges', desc: 'Obtenir ' + s + ' badges différents.' }));
    l.push({ id: 'pinsall', sec: 'COLLECTION DE BADGES', need: total, xp: 1000, name: 'Collection complète  //  ' + total + ' badges', desc: 'Obtenir tous les badges.' });
    if (p.pins && p.brand) for (let b = 0; b < NO_BRAND; b++){
      const c = p.brandCount(b); if (!c.t) continue;
      const name = p.brandNames[b] || 'marque ' + (b + 1);
      l.push({ id: 'brand' + b, sec: 'MARQUES', brand: b, need: c.t, xp: 300, name: 'Collection ' + name, desc: 'Obtenir les ' + c.t + ' badges de la marque ' + name + '.' });
    }
    l.forEach(a => {
      if (a.need == null) a.prog = null;
      else if (a.brand != null){ const c = p.brandCount(a.brand); a.prog = [c.o, c.t]; }
      else a.prog = [Math.min(p.owned, a.need), a.need];
    });
    return l;
  }

  // level 1 -> 2 costs 200 XP, then +100 per level
  function level(xp){ let lv = 1, need = 200; while (xp >= need){ xp -= need; lv++; need += 100; } return { lv, into: xp, need }; }

  function dayKey(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function esc(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function ago(ms){
    if (!ms) return '';
    const m = (Date.now() - ms) / 60000;
    if (m < 1) return "à l'instant";
    if (m < 60) return 'il y a ' + Math.floor(m) + ' min';
    if (m < 1440) return 'il y a ' + Math.floor(m / 60) + ' h';
    if (m < 10080) return 'il y a ' + Math.floor(m / 1440) + ' j';
    return new Date(ms).toLocaleDateString('fr-FR');
  }
  function fmtDate(s){ const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : esc(s); }
  const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  async function load(db, discordId){
    const days = []; for (let i = 0; i < 7; i++){ const d = new Date(); d.setDate(d.getDate() - i); days.push({ key: dayKey(d), date: d }); }
    const [cSnap, aSnap, ...mSnaps] = await Promise.all([
      db.ref('coop/' + discordId).get().catch(() => null),
      db.ref('assignments').get().catch(() => null),
      ...days.map(d => db.ref('missions/' + d.key).get().catch(() => null)),
    ]);
    const coop = cSnap && cSnap.exists() ? cSnap.val() : null;
    const chibiOf = {};
    if (aSnap && aSnap.exists()) Object.entries(aSnap.val() || {}).forEach(([chibi, a]) => { if (a && a.discordId) chibiOf[a.discordId] = chibi; });
    days.forEach((d, i) => {
      const v = mSnaps[i] && mSnaps[i].exists() ? mSnaps[i].val() : {};
      d.rows = Object.entries(v || {}).map(([id, e]) => ({ id, name: e.name || 'joueur', score: +e.score || 0, kills: +e.kills || 0, quests: +e.quests || 0, start: +e.start || 0 }))
        .sort((a, b) => b.score - a.score || a.start - b.start);
    });
    return { coop, days, chibiOf };
  }

  function playerLink(chibiOf, id, name){
    const c = chibiOf[id];
    return c ? `<a href="membre.html?id=${encodeURIComponent(c)}">@${esc(name)}</a>` : '@' + esc(name);
  }

  // header strip (always visible): level badge + XP bar
  function summaryHtml(data){
    if (!data.coop) return `<div class="cp-summary cp-none">pas encore de progression : le launcher TWEWY Co-op la publie après la connexion Discord</div>`;
    const info = parse(data.coop.progress), all = build(info), un = data.coop.unlocked || {};
    let xp = +data.coop.bonusXp || 0, n = 0; all.forEach(a => { if (un[a.id] != null){ xp += a.xp; n++; } });
    const L = level(xp), pct = Math.round(L.into * 100 / L.need);
    return `<div class="cp-summary">
      <span class="cp-level">NIVEAU ${L.lv}</span>
      <div class="cp-bar" title="${L.into} / ${L.need} XP"><i style="width:${pct}%"></i><span>${L.into} / ${L.need} XP</span></div>
      <div class="cp-sub">${xp} XP au total · ${n}/${all.length} succès${data.coop.updatedAt ? ' · màj ' + ago(+data.coop.updatedAt) : ''}</div>
    </div>`;
  }

  function progressionHtml(data, discordId){
    let h = '';
    // ---- leaderboard
    const today = data.days[0];
    const myRank = today.rows.findIndex(r => r.id === discordId);
    h += `<h3 class="cp-h">✦ MISSION DU JOUR</h3>`;
    if (!today.rows.length) h += `<div class="cp-empty">Personne n'a encore fait la mission aujourd'hui.</div>`;
    else {
      h += `<div class="cp-note">${myRank >= 0 ? `<b>#${myRank + 1}</b> sur ${today.rows.length} joueur${today.rows.length > 1 ? 's' : ''} · <b>${today.rows[myRank].score} pts</b>` : `Pas encore de mission aujourd'hui · ${today.rows.length} joueur${today.rows.length > 1 ? 's' : ''} classé${today.rows.length > 1 ? 's' : ''}`}</div>`;
      h += `<table class="cp-table"><thead><tr><th>#</th><th>Joueur</th><th>Pts</th><th>Ennemis</th><th>Quêtes</th></tr></thead><tbody>`;
      today.rows.forEach((r, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        h += `<tr class="${r.id === discordId ? 'me' : ''}"><td>${medal}</td><td>${playerLink(data.chibiOf, r.id, r.name)}</td><td>${r.score}</td><td>${r.kills}</td><td>${r.quests}/3</td></tr>`;
      });
      h += `</tbody></table>`;
    }
    // ---- last 7 days of this player
    const hist = data.days.map(d => { const i = d.rows.findIndex(r => r.id === discordId); return i < 0 ? null : { d, rank: i + 1, of: d.rows.length, r: d.rows[i] }; }).filter(Boolean);
    h += `<h3 class="cp-h">✦ 7 DERNIERS JOURS</h3>`;
    if (!hist.length) h += `<div class="cp-empty">Aucune mission sur les 7 derniers jours.</div>`;
    else {
      const best = hist.reduce((a, b) => (b.rank < a.rank || (b.rank === a.rank && b.r.score > a.r.score)) ? b : a);
      h += `<div class="cp-note">${hist.length} mission${hist.length > 1 ? 's' : ''} · meilleur classement <b>#${best.rank}</b> (${DAYS[best.d.date.getDay()]} ${best.d.date.getDate()})</div>`;
      h += `<table class="cp-table"><thead><tr><th>Jour</th><th>Place</th><th>Pts</th><th>Ennemis</th><th>Quêtes</th></tr></thead><tbody>`;
      hist.forEach(x => {
        h += `<tr><td>${x.d === today ? "aujourd'hui" : DAYS[x.d.date.getDay()] + ' ' + x.d.date.getDate()}</td><td>#${x.rank} / ${x.of}</td><td>${x.r.score}</td><td>${x.r.kills}</td><td>${x.r.quests}/3</td></tr>`;
      });
      h += `</tbody></table>`;
    }
    // ---- achievements
    if (!data.coop){ h += `<h3 class="cp-h">✦ SUCCÈS</h3><div class="cp-empty">Pas encore de succès publiés.</div>`; return h; }
    const info = parse(data.coop.progress), all = build(info), un = data.coop.unlocked || {};
    let sec = null;
    all.forEach(a => {
      if (a.sec !== sec){
        if (sec) h += `</div>`;
        sec = a.sec;
        const list = all.filter(x => x.sec === sec), got = list.filter(x => un[x.id] != null).length;
        h += `<h3 class="cp-h">✦ ${sec} <span>${got}/${list.length}</span></h3><div class="cp-achs">`;
      }
      const ok = un[a.id] != null;
      const prog = !ok && a.prog ? `<div class="cp-pbar"><i style="width:${Math.round(a.prog[0] * 100 / Math.max(1, a.prog[1]))}%"></i></div><span class="cp-ptext">${a.prog[0]}/${a.prog[1]}</span>` : '';
      h += `<div class="cp-ach ${ok ? 'ok' : ''}">
        <div class="cp-ico">${ok ? '★' : '☆'}</div>
        <div class="cp-txt"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${prog}</div>
        <div class="cp-xp">+${a.xp} XP${ok && un[a.id] ? `<small>${fmtDate(un[a.id])}</small>` : ''}</div>
      </div>`;
    });
    if (sec) h += `</div>`;
    if (+data.coop.bonusXp) h += `<div class="cp-note">+ ${+data.coop.bonusXp} XP gagnés avec les quêtes du jour</div>`;
    return h;
  }

  window.CoopProgress = { load, summaryHtml, progressionHtml, parse, build, level };
})();
