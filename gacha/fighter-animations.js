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
  // Ground pivots in source-cell pixels, in the order above. For stationary clips
  // this is the cast shadow, or the feet/body baseline when there is no shadow.
  const groundPivots = {
    PROMPTO: [[27,66], [162,72], [53,56], [27,58], [264,130], [29,110], [29,29], [37,27]],
    AERITH: [[35,56], [146,110], [43,57], [28,56], [394,358], [39,54], [33,40], [30,25]],
    CLOUD: [[59,60], [102,92], [34,65], [28,58], [244,222], [28,68], [59,44], [62,30]],
    NOCTIS: [[28,66], [196,150], [54,64], [58,60], [306,382], [68,76], [28,38], [34,22]],
    GLADIO: [[35,72], [150,114], [64,60], [34,102], [255,154], [29,68], [34,35], [38,31]],
    IGNIS: [[28,68], [198,70], [32,80], [28,60], [206,190], [66,114], [35,30], [39,26]],
    RIKU: [[24,64], [150,84], [38,56], [28,67], [292,245], [31,64], [24,42], [37,25]],
    SORA: [[28,62], [195,108], [71,60], [28,58], [256,198], [28,62], [28,40], [34,36]],
    '2B': [[35,74], [266,184], [44,72], [38,72], [304,302], [40,72], [28,60], [42,31]],
    A2: [[26,72], [200,184], [43,68], [30,56], [115,128], [26,62], [36,52], [34,53]]
  };
  // Cell size of the original supplied idle. Its visible placement is the
  // reference for every clip, including the ones with oversized effect margins.
  const idleCells = {
    PROMPTO: [54,76], AERITH: [63,67], CLOUD: [86,69], NOCTIS: [56,77],
    GLADIO: [75,83], IGNIS: [56,79], RIKU: [48,69], SORA: [60,73],
    '2B': [69,85], A2: [61,82]
  };
  window.ChibiFighterAnimations = Object.fromEntries(Object.entries(packs).map(([name, [folder, idleHeight, ...clips]]) => [
    name,
    {
      idleHeight,
      idleCell: idleCells[name],
      clips: Object.fromEntries(states.map((state, index) => {
        const [rows, frames, columns = 3] = clips[index] || [1, 1, 1];
        return [state, { rows, frames, columns, pivot: groundPivots[name][index], src: './assets/game/fighter-animations/' + folder + '/' + state + '.png' }];
      }))
    }
  ]));
})();
