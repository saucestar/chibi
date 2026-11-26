/* GPU presentation layer. Gameplay remains owned by game.js; Pixi only renders ambience and impact light. */
(function () {
  'use strict';
  const active = new WeakMap();
  const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  async function mount(arena) {
    if (!window.PIXI || active.has(arena) || reduceMotion()) return;
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
    }
  }

  function scan(root) {
    (root || document).querySelectorAll?.('.arena, .pvp-battlefield').forEach(mount);
  }
  function cleanup(node) {
    const instance = active.get(node);
    if (!instance) return;
    instance.observer.disconnect();
    instance.app.destroy(true, { children: true, texture: false, textureSource: false });
    active.delete(node);
  }
  window.ShinigamiPixi = { mount, scan };
  document.addEventListener('DOMContentLoaded', () => {
    scan();
    new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('.arena, .pvp-battlefield')) mount(node);
        scan(node);
      });
      record.removedNodes.forEach(node => node.nodeType === 1 && cleanup(node));
    })).observe(document.body, { childList: true, subtree: true });
  });
})();
