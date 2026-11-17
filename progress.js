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

  // read errors are kept (shown on the page) instead of looking like "no data": a refused read means the
  // database rules for coop/ and missions/ are not the published ones
  function why(e){ const m = String(e && (e.code || e.message) || e || ''); return /permission|denied/i.test(m) ? 'lecture refusée par la base (règles Firebase)' : (m || 'erreur inconnue'); }
  async function get(db, path, errs){
    try { const s = await db.ref(path).get(); return s && s.exists() ? s.val() : null; }
    catch (e) { errs.push(path.split('/')[0] + ' : ' + why(e)); return null; }
  }

  // discordId: one player's profile; null: every published profile (leaderboard)
  async function load(db, discordId){
    const errs = [];
    const days = []; for (let i = 0; i < 7; i++){ const d = new Date(); d.setDate(d.getDate() - i); days.push({ key: dayKey(d), date: d, offset: i }); }
    const [coopV, assignV, ...missionV] = await Promise.all([
      get(db, discordId ? 'coop/' + discordId : 'coop', errs),
      get(db, 'assignments', errs),
      ...days.map(d => get(db, 'missions/' + d.key, errs)),
    ]);
    const chibiOf = {};
    Object.entries(assignV || {}).forEach(([chibi, a]) => { if (a && a.discordId) chibiOf[a.discordId] = chibi; });
    days.forEach((d, i) => {
      d.rows = Object.entries(missionV[i] || {}).map(([id, e]) => ({ id, name: e.name || 'joueur', score: +e.score || 0, kills: +e.kills || 0, battles: +e.battles || 0, quests: +e.quests || 0, start: +e.start || 0, updated: +e.updatedAt || 0 }))
        .sort((a, b) => b.score - a.score || a.start - b.start);
    });
    const out = { days, chibiOf, assign: assignV || {}, errors: Array.from(new Set(errs)) };
    if (discordId) out.coop = coopV;
    else out.all = coopV || {};
    return out;
  }

  function playerLink(chibiOf, id, name){
    const c = chibiOf[id];
    return c ? `<a href="membre.html?id=${encodeURIComponent(c)}">@${esc(name)}</a>` : '@' + esc(name);
  }

  // level / XP / counts of a published profile (null when the launcher never published one)
  function stats(data){
    if (!data.coop) return null;
    const info = parse(data.coop.progress), all = build(info), un = data.coop.unlocked || {};
    let xp = +data.coop.bonusXp || 0, n = 0; all.forEach(a => { if (un[a.id] != null){ xp += a.xp; n++; } });
    return Object.assign({ xp, n, total: all.length, all, un, updated: +data.coop.updatedAt || 0 }, level(xp));
  }

  // ---- the launcher's dark lists (PunkRows): accent header, alternating ink rows, section bands, coloured dots
  function list(cols, rows, empty){
    let h = `<div class="lp-list" style="--cols:${cols.map(c => c.w || 'minmax(0,1fr)').join(' ')}"><div class="lp-hrow">`;
    cols.forEach(c => h += `<span class="${c.r ? 'r' : ''}">${c.t}</span>`);
    h += `</div><div class="lp-body">`;
    if (!rows.length) h += `<div class="lp-empty">${empty}</div>`;
    rows.forEach(r => {
      if (r.sec){ h += `<div class="lp-sec"><span>✦ ${esc(r.sec)}</span><b>${r.count || ''}</b></div>`; return; }
      h += `<div class="lp-row${r.me ? ' me' : ''}"${r.tip ? ` title="${esc(r.tip)}"` : ''}>`;
      r.cells.forEach((c, i) => {
        h += `<span class="${cols[i].r ? 'r ' : ''}${i && r.dim ? 'dim' : i ? 'hi' : ''}">${i === 0 ? `<i class="dot ${r.dot || ''}"></i>` : ''}${c}</span>`;
      });
      h += `</div>`;
    });
    return h + `</div></div>`;
  }

  function achList(data){
    const st = stats(data);
    if (!st) return list([{ t: 'Succès' }], [], 'pas encore de succès publiés : le launcher TWEWY Co-op les publie après la connexion Discord');
    const rows = [];
    // same order as the launcher: badges, brands, story
    const order = ['COLLECTION DE BADGES', 'MARQUES', 'HISTOIRE'];
    order.forEach(sec => {
      const l = st.all.filter(a => a.sec === sec);
      if (!l.length) return;
      rows.push({ sec, count: l.filter(a => st.un[a.id] != null).length + ' / ' + l.length });
      l.forEach(a => {
        const ok = st.un[a.id] != null;
        rows.push({ dot: ok ? 'acid' : '', dim: !ok, tip: a.desc,
          cells: [esc(a.name), '+' + a.xp + ' XP', ok ? esc(st.un[a.id] || '✔') : a.prog ? a.prog[0] + '/' + a.prog[1] : '—'] });
      });
    });
    if (!st.all.some(a => a.sec === 'MARQUES')){
      rows.splice(rows.findIndex(r => r.sec === 'HISTOIRE'), 0, { sec: 'MARQUES' },
        { dim: true, cells: ['Collection de chaque marque', '+300 XP', '—'], tip: 'apparaît quand le jeu a exporté la collection' });
    }
    return list([{ t: 'Succès' }, { t: 'XP', w: '88px' }, { t: 'Obtenu', w: '96px' }], rows, '');
  }

  function boardList(day, discordId, chibiOf){
    const rows = day.rows.map((r, i) => ({
      me: r.id === discordId,
      dot: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '',
      cells: ['#' + (i + 1) + '  ' + playerLink(chibiOf, r.id, r.name), r.score + ' pts', String(r.kills), r.quests + '/3'],
    }));
    return list([{ t: 'Joueur' }, { t: 'Points', w: '86px' }, { t: 'Ennemis', w: '72px', r: true }, { t: 'Quêtes', w: '60px', r: true }], rows,
      day.offset === 0 ? "Personne n'a encore fait la mission aujourd'hui." : "Personne n'a fait la mission ce jour-là.");
  }

  function historyList(data, discordId){
    const rows = [];
    data.days.forEach(d => {
      const i = d.rows.findIndex(r => r.id === discordId);
      const label = d.offset === 0 ? "Aujourd'hui" : DAYS[d.date.getDay()] + ' ' + d.date.getDate() + '/' + (d.date.getMonth() + 1);
      if (i < 0) rows.push({ dim: true, cells: [label, '—', '', ''] });
      else { const r = d.rows[i]; rows.push({ dot: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'acid', cells: [label, '#' + (i + 1) + ' / ' + d.rows.length, r.score + ' pts', r.kills + ' · ' + r.quests + '/3'] }); }
    });
    return list([{ t: 'Jour' }, { t: 'Place', w: '74px' }, { t: 'Points', w: '82px' }, { t: 'Ennemis · quêtes', w: '120px', r: true }], rows, '');
  }

  // a run lasts 24 min from the save load: still running / finished
  function missionState(r){
    if (!r.start) return { t: '—', dim: true };
    const left = r.start + 24 * 60000 - Date.now();
    if (left > 0){ const m = Math.floor(left / 60000), s2 = Math.floor(left / 1000) % 60; return { t: 'reste ' + m + ':' + String(s2).padStart(2, '0'), live: true }; }
    return { t: 'terminée' };
  }

  function missionBoard(day, chibiOf, me){
    const rows = day.rows.map((r, i) => {
      const st = missionState(r);
      return { me: r.id === me, dot: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '',
        cells: ['#' + (i + 1) + '  ' + playerLink(chibiOf, r.id, r.name), r.score + ' pts', String(r.kills), r.quests + '/3', st.t] };
    });
    return list([{ t: 'Joueur' }, { t: 'Points', w: '90px' }, { t: 'Ennemis', w: '70px', r: true }, { t: 'Quêtes', w: '60px', r: true }, { t: 'Mission', w: '96px', r: true }], rows,
      day.offset === 0 ? "Personne n'a encore fait la mission aujourd'hui : à toi de jouer !" : "Personne n'a fait la mission ce jour-là.");
  }

  // everybody's level from the profiles their launcher published, best first
  function levelBoard(all, chibiOf, assign, me){
    const nameOf = id => { const c = chibiOf[id]; const a = c && assign[c]; return (a && (a.discordUsername || a.name)) || null; };
    const players = Object.entries(all || {}).map(([id, c]) => {
      const st = stats({ coop: c });
      return { id, name: nameOf(id) || c.name || 'joueur', st, version: c.version || '' };
    }).sort((a, b) => b.st.xp - a.st.xp || a.name.localeCompare(b.name));
    const rows = players.map((p, i) => ({ me: p.id === me, dot: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'acid',
      tip: 'launcher ' + p.version + (p.st.updated ? ' · màj ' + ago(p.st.updated) : ''),
      cells: ['#' + (i + 1) + '  ' + playerLink(chibiOf, p.id, p.name), 'NIV. ' + p.st.lv, p.st.xp + ' XP', p.st.n + '/' + p.st.total, p.st.updated ? ago(p.st.updated) : '—'] }));
    return { html: list([{ t: 'Joueur' }, { t: 'Niveau', w: '64px' }, { t: 'XP', w: '76px', r: true }, { t: 'Succès', w: '62px', r: true }, { t: 'Màj', w: '96px', r: true }], rows,
      "Aucun profil publié pour l'instant : il apparaît après la connexion Discord dans le launcher."), count: players.length };
  }

  function dayLabel(d){ return (d.offset === 0 ? "Aujourd'hui" : d.offset === 1 ? 'Hier' : DAYS[d.date.getDay()]) + '  ·  ' + String(d.date.getDate()).padStart(2, '0') + '/' + String(d.date.getMonth() + 1).padStart(2, '0'); }

  window.CoopProgress = { load, stats, achList, boardList, historyList, missionBoard, levelBoard, dayLabel, ago, parse, build, level, esc };
})();
