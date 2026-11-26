/* Frame metadata for the supplied transparent sheets. Cells run left to right, then top to bottom. */
(() => {
  'use strict';
  const packs = {
    PROMPTO: ['prompto', 66, [2,4], [7,21], [2,4], [2,4], [26,77], [9,25]],
    AERITH: ['aerith', 57, [2,4], [9,26], [2,4], [2,4], [30,30,1], [2,4]],
    CLOUD: ['cloud', 59, [2,4], [4,12], [2,4], [2,4], [47,141], [7,20]],
    NOCTIS: ['noctis', 67, [6,16], [11,32], [6,16], [6,16], [21,61], [5,15]],
    GLADIO: ['gladio', 71, [2,4], [6,17], [2,4], [2,4], [12,35], [2,4]],
    IGNIS: ['ignis', 68, [2,4], [6,16], [2,4], [2,4], [14,41], [16,48]],
    RIKU: ['riku', 60, [2,4], [7,20], [2,4], [2,4], [27,81], [2,4]],
    SORA: ['sora', 63, [2,4], [7,19], [2,4], [2,4], [11,33], [2,6]],
    '2B': ['2b', 73, [2,4], [15,44], [2,4], [2,4], [17,50], [8,24]],
    A2: ['a2', 70, [2,4], [6,17], [2,4], [2,4], [15,45], [4,12]]
  };
  const states = ['idle', 'atk', 'magic_atk', 'standby', 'limit_atk', 'win', 'dying', 'dead'];
  window.ChibiFighterAnimations = Object.fromEntries(Object.entries(packs).map(([name, [folder, idleHeight, ...clips]]) => [
    name,
    {
      idleHeight,
      clips: Object.fromEntries(states.map((state, index) => {
        const [rows, frames, columns = 3] = clips[index] || [1, 1, 1];
        return [state, { rows, frames, columns, src: './assets/game/fighter-animations/' + folder + '/' + state + '.png' }];
      }))
    }
  ]));
})();
