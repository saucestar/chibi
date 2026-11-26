/* GPU presentation layer. Gameplay remains owned by game.js; Pixi only renders ambience and impact light. */
(function () {
  'use strict';
  const active = new WeakMap();
  const menuActive = new WeakMap();
  const pending = new WeakSet();
  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  async function mount(arena) {
    if (!window.PIXI || active.has(arena) || pending.has(arena) || reduceMotion()) return;
    pending.add(arena);
    try {
      const app = new PIXI.Application();
      await app.init({
        resizeTo: arena,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        preference: 'webgl'
      });
      if (!arena.isConnected) { app.destroy(true, { children: true }); return; }
      const canvas = app.canvas;
      canvas.className = 'pixi-combat-fx';
      canvas.setAttribute('aria-hidden', 'true');
      arena.prepend(canvas);

      const rings = new PIXI.Container();
      const sparks = new PIXI.Container();
      app.stage.addChild(rings, sparks);
      const palette = [0xff2f7d, 0xffa126, 0x42d6ff, 0xa77bff];
      const particles = Array.from({ length: 16 }, (_, index) => ({
        angle: (Math.PI * 2 * index) / 16,
        radius: 0.2 + (index % 5) * 0.12,
        phase: index * 0.47,
        color: palette[index % palette.length]
      }));

      const redraw = () => {
        const width = app.renderer.width / app.renderer.resolution;
        const height = app.renderer.height / app.renderer.resolution;
        const cx = width / 2;
        const cy = height * 0.54;
        rings.removeChildren().forEach(item => item.destroy());
        for (let index = 0; index < 3; index++) {
          const ring = new PIXI.Graphics();
          ring.circle(cx, cy, Math.min(width, height) * (0.16 + index * 0.09));
          ring.stroke({ color: palette[index], width: 1.2, alpha: 0.22 - index * 0.04 });
          rings.addChild(ring);
        }
      };
      redraw();
      const observer = new ResizeObserver(redraw);
      observer.observe(arena);
      let elapsed = 0;
      app.ticker.add(ticker => {
        elapsed += ticker.deltaTime / 60;
        const width = app.renderer.width / app.renderer.resolution;
        const height = app.renderer.height / app.renderer.resolution;
        const cx = width / 2;
        const cy = height * 0.54;
        rings.children.forEach((ring, index) => {
          ring.alpha = 0.55 + Math.sin(elapsed * 1.5 + index) * 0.2;
          ring.scale.set(1 + Math.sin(elapsed * 1.15 + index) * 0.025);
        });
        if (!sparks.children.length) particles.forEach(particle => {
          const spark = new PIXI.Graphics();
          spark.circle(0, 0, 2);
          spark.fill({ color: particle.color, alpha: 0.8 });
          spark.__particle = particle;
          sparks.addChild(spark);
        });
        sparks.children.forEach(spark => {
          const particle = spark.__particle;
          const radius = Math.min(width, height) * particle.radius;
          const angle = particle.angle + elapsed * (0.28 + particle.radius * 0.22);
          spark.position.set(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.44);
          spark.alpha = 0.28 + Math.sin(elapsed * 2 + particle.phase) * 0.18;
        });
      });
      active.set(arena, { app, observer });
    } catch (_) {
      /* The DOM battle remains fully playable if GPU initialization is unavailable. */
    } finally {
      pending.delete(arena);
    }
  }

  function scan(root) {
    (root || document).querySelectorAll?.('.arena, .pvp-battlefield').forEach(mount);
  }

  async function mountMenu(hub) {
    if (!window.PIXI || menuActive.has(hub) || pending.has(hub) || reduceMotion()) return;
    pending.add(hub);
    try {
      const app = new PIXI.Application();
      await app.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 1.5),
        preference: 'webgl'
      });
      if (!hub.isConnected) { app.destroy(true, { children: true }); return; }
      const canvas = app.canvas;
      canvas.className = 'pixi-menu-fx';
      canvas.setAttribute('aria-hidden', 'true');
      hub.prepend(canvas);
      const resize = () => app.renderer.resize(hub.clientWidth || 1, hub.clientHeight || 1);
      const sizeObserver = new ResizeObserver(resize);
      sizeObserver.observe(hub);
      resize();
      app.ticker.maxFPS = 45;
      const decor = new PIXI.Container();
      const pulses = new PIXI.Container();
      app.stage.addChild(decor, pulses);
      const motes = Array.from({ length: 20 }, (_, index) => ({
        x: ((index * 43) % 100) / 100,
        y: .12 + ((index * 71) % 100) / 135,
        size: 1 + index % 3,
        speed: .04 + index % 5 * .012,
        phase: index * .65,
        color: index % 3 === 0 ? 0xff2d79 : index % 3 === 1 ? 0xff9a26 : 0x6d8cff
      }));
      // The overlay leaves the central reading area clear.
      motes.forEach((mote, index) => {
        mote.x = index % 2 ? .97 - mote.x * .025 : .03 + mote.x * .025;
      });
      motes.forEach(mote => {
        const dot = new PIXI.Graphics();
        dot.circle(0, 0, mote.size);
        dot.fill({ color: mote.color, alpha: .22 });
        dot.__mote = mote;
        decor.addChild(dot);
      });
      const sweep = new PIXI.Graphics();
      sweep.poly([0, 0, 180, 0, 147, 3, 0, 3]).fill(0xff367b);
      sweep.poly([22, 8, 92, 8, 76, 10, 22, 10]).fill(0xffae40);
      sweep.alpha = 0;
      app.stage.addChild(sweep);
      const portalLight = new PIXI.Graphics();
      portalLight.alpha = 0;
      app.stage.addChild(portalLight);
      let portalLightLife = 0, lastRail = null, lastScroll = 0;
      const lightPortalEdge = event => {
        const rail = event.target;
        if (!rail.matches?.('.portal-carousel .portal-list')) return;
        const scroll = rail.scrollLeft;
        const delta = scroll - (lastRail === rail ? lastScroll : Math.round(scroll / rail.clientWidth) * rail.clientWidth);
        lastRail = rail;
        lastScroll = scroll;
        if (Math.abs(delta) < 1) return;
        const edge = rail.getBoundingClientRect(), frame = hub.getBoundingClientRect();
        if (!frame.width || !frame.height) return;
        const scaleX = app.screen.width / frame.width, scaleY = app.screen.height / frame.height;
        const x = ((delta > 0 ? edge.right : edge.left) - frame.left) * scaleX;
        const top = Math.max(edge.top, frame.top);
        const bottom = Math.min(edge.bottom, frame.bottom);
        if (bottom <= top) return;
        const y = (top - frame.top) * scaleY, h = (bottom - top) * scaleY;
        const inward = delta > 0 ? -1 : 1;
        portalLight.clear()
          .poly([x, y, x + inward * 22, y + h * .44, x, y + h]).fill({ color: 0xff367b, alpha: .22 })
          .moveTo(x, y + h * .16).lineTo(x + inward * 8, y + h * .5).lineTo(x, y + h * .84)
          .stroke({ color: 0xffbe62, width: 2, alpha: .7 });
        portalLightLife = 1;
      };
      let sweepLife = 0;
      const routeObserver = new MutationObserver(() => { sweepLife = 1; });
      routeObserver.observe(hub, { attributes: true, attributeFilter: ['data-screen'] });
      let elapsed = 0;
      app.ticker.add(ticker => {
        elapsed += ticker.deltaTime / 60;
        const width = app.renderer.width / app.renderer.resolution;
        const height = app.renderer.height / app.renderer.resolution;
        decor.children.forEach(dot => {
          const mote = dot.__mote;
          dot.position.set(mote.x * width + Math.sin(elapsed * mote.speed + mote.phase) * 4, mote.y * height + Math.cos(elapsed * mote.speed + mote.phase) * 9);
          dot.alpha = .12 + Math.sin(elapsed * .8 + mote.phase) * .08;
        });
        pulses.children.slice().forEach(pulse => {
          pulse.__life -= ticker.deltaMS / 260;
          pulse.scale.set(1 + (1 - pulse.__life) * 1.6);
          pulse.alpha = Math.max(0, pulse.__life) * .48;
          if (pulse.__life <= 0) { pulses.removeChild(pulse); pulse.destroy(); }
        });
        portalLightLife = Math.max(0, portalLightLife - ticker.deltaMS / 220);
        portalLight.alpha = portalLightLife;
        sweepLife = Math.max(0, sweepLife - ticker.deltaMS / 280);
        sweep.position.set(-180 + (1 - sweepLife) * (width + 180), hub.querySelector('.hub-header')?.offsetHeight || 0);
        sweep.alpha = sweepLife * .75;
      });
      const pulse = event => {
        const target = event.target.closest?.('button');
        if (!target || target.disabled || !hub.contains(target) || !event.isPrimary) return;
        const bounds = hub.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const ring = new PIXI.Graphics();
        ring.circle(0, 0, 13);
        ring.stroke({ color: target.closest('.hub-nav') ? 0xff2d79 : 0xffcc63, width: 2, alpha: .85 });
        ring.position.set((event.clientX - bounds.left) * app.screen.width / bounds.width,
          (event.clientY - bounds.top) * app.screen.height / bounds.height);
        ring.__life = 1;
        pulses.addChild(ring);
      };
      const input = new AbortController();
      const passive = { passive: true, signal: input.signal };
      const updateDepth = event => {
        const hero = event.target.closest?.('.home-reapers-hero');
        if (!hero || event.pointerType === 'touch') return;
        const bounds = hero.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        hero.style.setProperty('--hero-rotate-x', `${-y * 5}deg`);
        hero.style.setProperty('--hero-rotate-y', `${x * 7}deg`);
      };
      const resetDepth = event => {
        const hero = event.target.closest?.('.home-reapers-hero');
        if (!hero || hero.contains(event.relatedTarget)) return;
        hero.style.removeProperty('--hero-rotate-x');
        hero.style.removeProperty('--hero-rotate-y');
      };
      hub.addEventListener('scroll', lightPortalEdge, { ...passive, capture: true });
      hub.addEventListener('pointerdown', pulse, passive);
      hub.addEventListener('pointermove', updateDepth, passive);
      hub.addEventListener('pointerout', resetDepth, passive);
      menuActive.set(hub, { app, input, sizeObserver, routeObserver });
    } catch (_) {
      /* Menus retain their full DOM treatment if the GPU path is unavailable. */
    } finally {
      pending.delete(hub);
    }
  }
  function cleanup(node) {
    if (node.isConnected) return;
    const menu = menuActive.get(node);
    if (menu) {
      menu.input.abort();
      menu.sizeObserver.disconnect();
      menu.routeObserver.disconnect();
      menu.app.destroy(true, { children: true });
      menuActive.delete(node);
    }
    const instance = active.get(node);
    if (!instance) return;
    instance.observer.disconnect();
    instance.app.destroy(true, { children: true, texture: false, textureSource: false });
    active.delete(node);
  }
  window.ShinigamiPixi = { mount, mountMenu, scan };
  document.addEventListener('DOMContentLoaded', () => {
    scan();
    document.querySelectorAll('.game-hub').forEach(mountMenu);
    new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('.arena, .pvp-battlefield')) mount(node);
        if (node.matches?.('.game-hub')) mountMenu(node);
        scan(node);
        node.querySelectorAll?.('.game-hub').forEach(mountMenu);
      });
      record.removedNodes.forEach(node => {
        if (node.nodeType !== 1 || node.isConnected) return;
        cleanup(node);
        node.querySelectorAll('.arena, .pvp-battlefield, .game-hub').forEach(cleanup);
      });
    })).observe(document.body, { childList: true, subtree: true });
  });
})();
