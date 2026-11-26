// PVFX Foundry strict sheets use the manifest's rectangles, cadence and pivot.
(() => {
  'use strict';
  const cache = new Map();
  const mounted = new WeakMap();
  const ranged = new Set(['PROMPTO','X','TAILS']);
  const tech = new Set(['2B','A2','X','ZERO','PROMPTO','TAILS']);
  const melee = {
    CLOUD: 'melee-greatsword-sweep', GLADIO: 'melee-greatsword-sweep',
    SORA: 'melee-sword-combo', RIKU: 'melee-sword-combo', NOCTIS: 'melee-sword-combo',
    IGNIS: 'melee-dagger-slash', '2B': 'scifi-laser-sword-slash', A2: 'scifi-laser-sword-slash',
    ZERO: 'scifi-laser-sword-slash', SONIC: 'wind-sonic-boom', SHADOW: 'wind-sonic-boom',
    KNUCKLES: 'impacts-punch-hit', BEAT: 'impacts-punch-hit',
    LEXAEUS: 'melee-hammer-smash', LARXENE: 'melee-dagger-slash', MARLUXIA: 'melee-scythe-reap'
  };
  const elements = {
    fire: 'fire-fireball-impact', ice: 'explosions-frost-explosion', electric: 'lightning-lightning-strike',
    water: 'water-water-splash', flying: 'wind-air-burst', ground: 'nature-earth-spike', rock: 'nature-earth-spike',
    poison: 'explosions-toxic-explosion', dark: 'shadow-shadow-burst', ghost: 'shadow-shadow-burst',
    fairy: 'holy-holy-smite', grass: 'nature-leaf-storm'
  };
  const bursts = {
    fire: 'explosions-fire-nova', electric: 'lightning-static-burst',
    dark: 'shadow-void-implosion', grass: 'nature-leaf-storm'
  };
  function choose({ name, kind, element }) {
    if (kind === 'heal') return name === 'AERITH' ? 'nature-bloom-heal' : 'holy-holy-heal';
    if (kind === 'guard' || kind === 'support') return tech.has(name) ? 'scifi-energy-shield' : 'holy-barrier-block';
    if (kind === 'burst') return bursts[element] || elements[element] || 'explosions-arcane-burst';
    if (kind === 'physical' && melee[name]) return melee[name];
    if (kind === 'physical' && ranged.has(name)) return name === 'PROMPTO' ? 'scifi-bullet-impact' : 'scifi-plasma-impact';
    return elements[element] || (kind === 'physical' ? 'impacts-punch-hit' :
      ranged.has(name) || (tech.has(name) && element === 'steel') ? 'scifi-plasma-impact' : 'impacts-magic-hit');
  }
  function load(key) {
    if (cache.has(key)) return cache.get(key);
    const base = './assets/game/pvfx/' + key + '/';
    const image = new Image();
    const ready = Promise.all([
      fetch(base + 'manifest.json').then(res => {
        if (!res.ok) throw Error('VFX manifest unavailable');
        return res.json();
      }),
      new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = base + 'sprite-sheet.png';
      })
    ]).then(([manifest]) => ({ manifest, image })).catch(() => {
      cache.delete(key);
      return null;
    });
    cache.set(key, ready);
    return ready;
  }
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function warm(cue) {
    if (!reduced()) return load(choose(cue));
  }
  async function play(arena, targets, cue, actor) {
    if (!arena?.isConnected || reduced() || !targets.length) return;
    const art = await load(choose(cue));
    if (!art || !arena.isConnected || reduced()) return;
    const { manifest, image } = art;
    const [width,height] = manifest.source_size;
    const [pivotX,pivotY] = manifest.pivot;
    const frames = manifest.frames;
    const rect = arena.getBoundingClientRect();
    if (!rect.width || !rect.height || !frames.length) return;
    const source = actor?.getBoundingClientRect();
    const ground = ['heal','guard','support'].includes(cue.kind);
    const size = Math.min(cue.kind === 'burst' ? 168 : 126, rect.width * (cue.kind === 'burst' ? .42 : .33));
    const scale = size / Math.max(width,height);
    const effects = mounted.get(arena) || new Set();
    mounted.set(arena,effects);
    for (const target of targets.slice(0,6)) {
      if (!target.isConnected) continue;
      if (effects.size >= 8) effects.values().next().value();
      const bounds = target.getBoundingClientRect();
      const x = bounds.left + bounds.width / 2;
      const y = bounds.top + bounds.height * (ground ? .87 : .49);
      const mirror = !ground && source && source.left + source.width / 2 < x;
      const canvas = document.createElement('canvas');
      canvas.className = 'battle-vfx-sheet';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.width = width;
      canvas.height = height;
      Object.assign(canvas.style, {
        position: 'absolute', pointerEvents: 'none', imageRendering: 'pixelated', zIndex: '4', opacity: '.86',
        width: width * scale + 'px', height: height * scale + 'px',
        left: x - rect.left - (mirror ? width - pivotX : pivotX) * scale + 'px',
        top: y - rect.top - pivotY * scale + 'px',
        transform: mirror ? 'scaleX(-1)' : ''
      });
      const context = canvas.getContext('2d');
      if (!context) continue;
      context.imageSmoothingEnabled = false;
      arena.appendChild(canvas);
      let next = 0, drawn = -1, end = 0, request = 0;
      const start = performance.now();
      const dispose = () => {
        cancelAnimationFrame(request);
        effects.delete(dispose);
        canvas.remove();
      };
      effects.add(dispose);
      const animate = now => {
        if (!canvas.isConnected) { dispose(); return; }
        while (next < frames.length && now - start >= end) {
          const frame = frames[next++];
          end += frame.duration.numerator_ms / frame.duration.denominator;
        }
        if (next === frames.length && now - start >= end) { dispose(); return; }
        if (drawn !== next) {
          const { x, y, width, height } = frames[next - 1].sheet;
          context.clearRect(0,0,canvas.width,canvas.height);
          context.drawImage(image,x,y,width,height,0,0,canvas.width,canvas.height);
          drawn = next;
        }
        request = requestAnimationFrame(animate);
      };
      animate(start);
    }
  }
  window.ChibiBattleVfx = { choose, warm, play };
})();
