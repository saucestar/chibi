const {
  useEffect,
  useMemo,
  useState
} = React;
const nekuSprite = "./assets/game/neku-idle.png";
const beatSprite = "./assets/game/beat-idle.png";
const shikiSprite = "./assets/game/shiki-idle.png";
const joshuaSprite = "./assets/game/joshua-idle.png";
const nekuAttackSprite = "./assets/game/neku-attack.png";
const beatAttackSprite = "./assets/game/beat-attack.png";
const shikiAttackSprite = "./assets/game/shiki-attack.png";
const fierySpiritPin = "./assets/game/pin-fiery-spirit.png";
const masamunePin = "./assets/game/pin-masamune.png";
const konohanaPin = "./assets/game/pin-konohana.png";
const battleBackground = "./assets/game/battle-bg.jpg";
const elementNames = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Électrik",
  grass: "Plante",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Ténèbres",
  steel: "Acier",
  fairy: "Fée"
};
const typeChart = {
  normal: [[], ["rock", "steel"], ["ghost"]],
  fire: [["grass", "ice", "bug", "steel"], ["fire", "water", "rock", "dragon"], []],
  water: [["fire", "ground", "rock"], ["water", "grass", "dragon"], []],
  electric: [["water", "flying"], ["electric", "grass", "dragon"], ["ground"]],
  grass: [["water", "ground", "rock"], ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"], []],
  ice: [["grass", "ground", "flying", "dragon"], ["fire", "water", "ice", "steel"], []],
  fighting: [["normal", "ice", "rock", "dark", "steel"], ["poison", "flying", "psychic", "bug", "fairy"], ["ghost"]],
  poison: [["grass", "fairy"], ["poison", "ground", "rock", "ghost"], ["steel"]],
  ground: [["fire", "electric", "poison", "rock", "steel"], ["grass", "bug"], ["flying"]],
  flying: [["grass", "fighting", "bug"], ["electric", "rock", "steel"], []],
  psychic: [["fighting", "poison"], ["psychic", "steel"], ["dark"]],
  bug: [["grass", "psychic", "dark"], ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"], []],
  rock: [["fire", "ice", "flying", "bug"], ["fighting", "ground", "steel"], []],
  ghost: [["psychic", "ghost"], ["dark"], ["normal"]],
  dragon: [["dragon"], ["steel"], ["fairy"]],
  dark: [["psychic", "ghost"], ["fighting", "dark", "fairy"], []],
  steel: [["ice", "rock", "fairy"], ["fire", "water", "electric", "steel"], []],
  fairy: [["fighting", "dragon", "dark"], ["fire", "poison", "steel"], []]
};
const characterElements = {
  NEKU: ["psychic"],
  SHIKI: ["normal"],
  BEAT: ["fighting"],
  JOSHUA: ["psychic", "flying"],
  CLOUD: ["fighting", "steel"],
  AERITH: ["grass", "fairy"],
  "2B": ["steel", "fighting"],
  A2: ["steel", "dark"],
  SORA: ["normal", "fairy"],
  RIKU: ["dark", "psychic"],
  NOCTIS: ["dark", "steel"],
  PROMPTO: ["electric"],
  IGNIS: ["fire"],
  GLADIO: ["rock", "fighting"]
};
const enemyElements = {
  frog: ["water"],
  wolf: ["dark"],
  shinigami: ["dark", "flying"],
  "jey-pengi": ["water", "ice"],
  "electro-pengi": ["electric"],
  "psyche-fox": ["psychic"]
};
function effectiveness(attack, defense) {
  const [strong, weak, immune] = typeChart[attack];
  return defense.reduce((v, t) => v * (immune.includes(t) ? 0 : strong.includes(t) ? 2 : weak.includes(t) ? .5 : 1), 1);
}
function typedDamage(base, attack, defense) {
  const scale = effectiveness(attack, defense);
  return scale === 0 ? 0 : Math.max(1, Math.round(base * scale));
}
function affinityText(scale) {
  return scale === 0 ? "Sans effet" : scale > 1 ? `Super efficace ×${scale}` : scale < 1 ? `Résisté ×${scale}` : "×1";
}
function badgeElement(pin) {
  const power = pin.psych,
    name = pin.name;
  if (pin.id === "armiger") return "steel";
  if (pin.id === "machinery") return "electric";
  if (pin.id === "elemental-daggers") return "fire";
  if (pin.id === "shield-of-the-king") return "rock";
  if (["buster-sword", "virtuous-contract", "type-40-blade"].includes(pin.id)) return "steel";
  if (pin.id === "kingdom-key") return "fairy";
  if (pin.id === "way-to-dawn") return "dark";
  if (pin.kind === "heal" || /Healing|Cure|Holy|Subconscious|Vent guérisseur/.test(power)) return "fairy";
  if (/Pyrokinesis|Flame|Ignition|Fire|Explosion|Time Bomb/.test(power)) return "fire";
  if (/Aqua|Splash/.test(power) || /Aqua|Water/.test(name)) return "water";
  if (/Lightning|Thunder|Spark|Discharge|Laser/.test(power)) return "electric";
  if (/Freeze|Frostbite/.test(power) || /Ice |Frozen|Blizzard/.test(name)) return "ice";
  if (/Earthquake|Pressure Mine/.test(power)) return "ground";
  if (/Rock Bind|Lode/.test(power)) return "rock";
  if (/Entanglement/.test(power)) return "grass";
  if (/Black Hole|Dark Barrier|Doomed/.test(power)) return "dark";
  if (/Invisibility|Summon Rhyme|Grave Marker|Mr. Mew/.test(power)) return pin.id === "groove-pawn" ? "normal" : "ghost";
  if (/Twister|Vortex Saber/.test(power)) return "flying";
  if (/Crawler|Sweeper/.test(power)) return "bug";
  if (/Psychokinesis|Teleport|Chute d’objets/.test(power)) return "psychic";
  if (/Sword|Lance|Spear/.test(power)) return "steel";
  if (/SK8|Shockwave|Vulcan|Massive Hit|Velocity/.test(power)) return "fighting";
  if (/Irregular Note|Street Jam|Stellar/.test(power)) return "fairy";
  return "normal";
}
function TypeChips({
  elements
}) {
  return React.createElement("span", {
    className: "type-chips"
  }, elements.map(t => React.createElement("span", {
    key: t,
    className: `element element-${t}`
  }, elementNames[t])));
}
const characterRoster = [{
  name: "NOCTIS",
  role: "LUCIS",
  hp: 130,
  maxHp: 130,
  sprite: "./assets/game/noctis-idle.png",
  accent: "#586d9d",
  frames: 16,
  frameWidth: 56,
  frameHeight: 77,
  portraitCenter: 28,
  portraitTop: 24
}, {
  name: "PROMPTO",
  role: "CROWNSGUARD",
  hp: 108,
  maxHp: 108,
  sprite: "./assets/game/prompto-idle.png",
  accent: "#f5d36b",
  frames: 4,
  frameWidth: 54,
  frameHeight: 76,
  portraitCenter: 27,
  portraitTop: 24
}, {
  name: "IGNIS",
  role: "CROWNSGUARD",
  hp: 114,
  maxHp: 114,
  sprite: "./assets/game/ignis-idle.png",
  accent: "#b8a56d",
  frames: 4,
  frameWidth: 56,
  frameHeight: 79,
  portraitCenter: 28,
  portraitTop: 24
}, {
  name: "GLADIO",
  role: "CROWNSGUARD",
  hp: 148,
  maxHp: 148,
  sprite: "./assets/game/gladio-idle.png",
  accent: "#9a724e",
  frames: 4,
  frameWidth: 75,
  frameHeight: 83,
  portraitCenter: 38,
  portraitTop: 26
}, {
  name: "2B",
  role: "YORHA",
  hp: 128,
  maxHp: 128,
  sprite: "./assets/game/2b-idle.png",
  accent: "#d2cce0",
  frames: 4,
  frameWidth: 176,
  frameHeight: 160,
  portraitCenter: 88,
  portraitTop: 40
}, {
  name: "A2",
  role: "YORHA",
  hp: 132,
  maxHp: 132,
  sprite: "./assets/game/a2-idle.png",
  accent: "#b8b1be",
  frames: 4,
  frameWidth: 144,
  frameHeight: 160,
  portraitCenter: 72,
  portraitTop: 40
}, {
  name: "SORA",
  role: "KEYBLADE",
  hp: 122,
  maxHp: 122,
  sprite: "./assets/game/sora-idle.png",
  accent: "#ffd25c",
  frames: 4,
  frameWidth: 144,
  frameHeight: 160,
  portraitCenter: 72,
  portraitTop: 40
}, {
  name: "RIKU",
  role: "KEYBLADE",
  hp: 126,
  maxHp: 126,
  sprite: "./assets/game/riku-idle.png",
  accent: "#9b9ce9",
  frames: 4,
  frameWidth: 144,
  frameHeight: 160,
  portraitCenter: 72,
  portraitTop: 40
}, {
  name: "CLOUD",
  portraitCenter: 64,
  role: "EX-SOLDAT",
  hp: 138,
  maxHp: 138,
  sprite: "./assets/game/cloud-idle.png",
  accent: "#88b9ff",
  frames: 20,
  frameWidth: 128,
  frameHeight: 116
}, {
  name: "AERITH",
  portraitCenter: 40,
  role: "CETRA",
  hp: 104,
  maxHp: 104,
  sprite: "./assets/game/aerith-idle.png",
  accent: "#ffb1c5",
  frames: 4,
  frameWidth: 80,
  frameHeight: 116
}, {
  name: "NEKU",
  role: "PSYCH USER",
  hp: 118,
  maxHp: 118,
  sprite: nekuSprite,
  accent: "#ff5f29",
  frames: 6,
  frameWidth: 80,
  frameHeight: 116,
  attackSprite: nekuAttackSprite,
  attackFrames: 7
}, {
  name: "BEAT",
  role: "BRAWLER",
  hp: 142,
  maxHp: 142,
  sprite: beatSprite,
  accent: "#f8d742",
  frames: 6,
  frameWidth: 80,
  frameHeight: 116,
  attackSprite: beatAttackSprite,
  attackFrames: 5
}, {
  name: "SHIKI",
  role: "THREAD USER",
  hp: 108,
  maxHp: 108,
  sprite: shikiSprite,
  accent: "#ff70ae",
  frames: 3,
  frameWidth: 80,
  frameHeight: 116,
  attackSprite: shikiAttackSprite,
  attackFrames: 7
}, {
  name: "JOSHUA",
  role: "ANGEL USER",
  hp: 96,
  maxHp: 96,
  sprite: joshuaSprite,
  accent: "#92dcce",
  frames: 10,
  frameWidth: 80,
  frameHeight: 116
}];
const Icon = ({
  name
}) => {
  const paths = {
    bolt: React.createElement("path", {
      d: "m13 2-8 11h6l-1 9 8-12h-6l1-8Z"
    }),
    target: React.createElement(React.Fragment, null, React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "8"
    }), React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    }), React.createElement("path", {
      d: "M12 2v3M22 12h-3M12 22v-3M2 12h3"
    })),
    heart: React.createElement("path", {
      d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
    }),
    guard: React.createElement("path", {
      d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
    }),
    coin: React.createElement(React.Fragment, null, React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "9"
    }), React.createElement("path", {
      d: "M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 .8-3 2s1 1.8 3 2.2 3 1 3 2.3-1.3 2.5-3 2.5c-1.4 0-2.5-.4-3.2-1.2M12 5v14"
    })),
    star: React.createElement("path", {
      d: "m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z"
    })
  };
  return React.createElement("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, paths[name]);
};
const ffbeBestiary = typeof ffbeEnemyList === "undefined" ? [] : ffbeEnemyList;
const ffbePageCache = new Map();
function ffbePage(index) {
  const existing = ffbePageCache.get(index);
  if (existing) {
    ffbePageCache.delete(index);
    ffbePageCache.set(index, existing);
    return existing;
  }
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      ffbePageCache.delete(index);
      reject(Error("Image du bestiaire indisponible"));
    };
    image.src = `./assets/game/ffbe/idle-${String(index).padStart(3, "0")}.webp`;
  });
  ffbePageCache.set(index, promise);
  while (ffbePageCache.size > 6) ffbePageCache.delete(ffbePageCache.keys().next().value);
  return promise;
}
const enemyTraitNames = {
  none: "Attaque standard",
  armored: "Cuirassé · −15 % de dégâts reçus",
  hunter: "Chasseur · vise le personnage au plus faible ratio de PV",
  vampire: "Absorption · récupère 15 % des dégâts infligés",
  berserk: "Rage · +35 % d’ATK sous 40 % de PV"
};
function enemyDamageTaken(enemy, amount) {
  return amount === 0 ? 0 : Math.max(1, Math.round(amount * (enemy.trait === "armored" ? .85 : 1)));
}
function enemyAttackPower(enemy) {
  return enemy.attack * (enemy.trait === "berserk" && enemy.hp / enemy.maxHp <= .4 ? 1.35 : 1);
}
function encounterHash(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function ffbeWaveKinds(wave, count, seed) {
  const tier = difficultyAt(wave).tier - 1,
    boss = isBossWave(wave);
  const regular = ffbeBestiary.filter(m => m.enabled && !m.boss && m.tier <= tier && m.tier >= Math.max(0, tier - 4));
  const bosses = ffbeBestiary.filter(m => m.enabled && m.boss && m.tier <= tier + 2 && m.tier >= Math.max(0, tier - 2));
  const pool = regular.length ? regular : ffbeBestiary.filter(m => m.enabled && !m.boss && m.tier <= tier);
  if (!pool.length) return [];
  const result = [];
  for (let i = 0; i < count; i++) {
    const source = boss && i === 0 && bosses.length ? bosses : pool;
    let choice = source[encounterHash(`${seed}:${wave}:${i}`) % source.length];
    for (let n = 1; n < source.length && result.includes(choice.id); n++) choice = source[(encounterHash(`${seed}:${wave}:${i}`) + n) % source.length];
    result.push(choice.id);
  }
  return result;
}
const enemyCatalog = {
  frog: {
    name: "BIG BANG FROG",
    frames: 2,
    frameWidth: 68,
    frameHeight: 72,
    hp: 50,
    attack: 10
  },
  wolf: {
    name: "GARAGE WOLF",
    frames: 6,
    frameWidth: 102,
    frameHeight: 78,
    hp: 72,
    attack: 15
  },
  shinigami: {
    name: "SHINIGAMI",
    frames: 5,
    frameWidth: 52,
    frameHeight: 76,
    hp: 92,
    attack: 17
  },
  "jey-pengi": {
    name: "JEY PENGI",
    frames: 14,
    frameWidth: 42,
    frameHeight: 65,
    hp: 64,
    attack: 12
  },
  "electro-pengi": {
    name: "ELECTRO PENGI",
    frames: 14,
    frameWidth: 42,
    frameHeight: 65,
    hp: 82,
    attack: 16
  },
  "psyche-fox": {
    name: "PSYCHE FOX",
    frames: 6,
    frameWidth: 169,
    frameHeight: 205,
    hp: 126,
    attack: 21
  }
};
function registerFfbeEntries() {
  for (const entry of ffbeBestiary) {
    enemyCatalog[entry.id] = {
      ...entry,
      name: entry.name || `FFBE #${entry.sourceId}`,
      frames: entry.frames.length,
      atlasFrames: entry.frames
    };
    enemyElements[entry.id] = entry.elements;
  }
}
registerFfbeEntries();
const eventHeroes = Object.fromEntries(characterRoster.map(f => ["event-" + f.name, f]));
for (const [kind, f] of Object.entries(eventHeroes)) {
  enemyCatalog[kind] = {
    name: f.name,
    frames: f.frames || 1,
    frameWidth: f.frameWidth || 80,
    frameHeight: f.frameHeight || 116,
    hp: f.maxHp,
    attack: 1
  };
  enemyElements[kind] = characterElements[f.name];
}
const enemyKinds = ["frog", "wolf", "jey-pengi", "electro-pengi", "shinigami", "psyche-fox"];
const isBossWave = wave => wave % 5 === 0;
function EnemySprite({
  kind,
  boss,
  combat = false
}) {
  const spec = enemyCatalog[kind];
  const canvas = React.useRef(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    let timer,
      disposed = false,
      frame = 0;
    context.imageSmoothingEnabled = false;
    if (spec.atlasFrames) {
      const pages = new Map();
      const draw = () => {
        if (disposed || document.hidden) return;
        const [page, x, y] = spec.atlasFrames[frame],
          atlas = pages.get(page);
        if (!atlas) return;
        context.clearRect(0, 0, spec.frameWidth, spec.frameHeight);
        context.save();
        if (combat) {
          context.translate(spec.frameWidth, 0);
          context.scale(-1, 1);
        }
        context.drawImage(atlas, x, y, spec.frameWidth, spec.frameHeight, 0, 0, spec.frameWidth, spec.frameHeight);
        context.restore();
      };
      Promise.all([...new Set(spec.atlasFrames.map(f => f[0]))].map(async page => pages.set(page, await ffbePage(page)))).then(() => {
        if (disposed) return;
        draw();
        if (spec.frames > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) timer = window.setInterval(() => {
          frame = (frame + 1) % spec.frames;
          draw();
        }, 1000 / (spec.fps || 4));
      }).catch(() => {});
    } else {
      const atlas = new Image(),
        draw = () => {
          if (disposed || document.hidden) return;
          context.clearRect(0, 0, spec.frameWidth, spec.frameHeight);
          context.drawImage(atlas, frame * spec.frameWidth, 0, spec.frameWidth, spec.frameHeight, 0, 0, spec.frameWidth, spec.frameHeight);
        };
      atlas.onload = () => {
        if (disposed) return;
        draw();
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = window.setInterval(() => {
          frame = (frame + 1) % spec.frames;
          draw();
        }, 1000 / Math.min(spec.frames, 8));
      };
      atlas.src = eventHeroes[kind]?.sprite || `./assets/game/enemy-atlases/${kind}.png`;
    }
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [kind, spec, combat]);
  return React.createElement("canvas", {
    ref: canvas,
    width: spec.frameWidth,
    height: spec.frameHeight,
    "aria-hidden": "true",
    className: `pixel-sprite enemy-sprite ${boss ? "boss-noise" : ""}`,
    style: {
      width: `${92 * spec.frameWidth / spec.frameHeight}px`,
      height: "92px"
    }
  });
}
function difficultyAt(floor) {
  const wave = Math.max(1, Math.min(100, Math.floor(floor)));
  const tier = Math.floor((wave - 1) / 10),
    step = (wave - 1) % 10;
  return {
    tier: tier + 1,
    hp: 1.35 + tier * .85 + tier * tier * .08 + step * .07,
    attack: 1.30 + tier * .32 + tier * tier * .025 + step * .025,
    xp: 1 + tier * .48 + tier * tier * .025 + step * .04,
    speed: tier * 3 + Math.floor(step / 3),
    bossHp: wave % 10 === 0 ? 2.8 : 2.1,
    bossAttack: wave % 10 === 0 ? 1.7 : 1.45
  };
}
const makeWave = (wave, seed = "legacy") => {
  const bossWave = isBossWave(wave);
  const count = bossWave ? wave >= 40 ? 4 : wave >= 10 ? 3 : 2 : wave <= 2 ? 2 : wave <= 9 ? 3 : 4;
  const scale = difficultyAt(wave);
  const ffbeKinds = ffbeWaveKinds(wave, count, seed);
  return Array.from({
    length: count
  }, (_, index) => {
    const boss = bossWave && index === 0;
    const kind = (ffbeKinds[index] && encounterHash(`${seed}:${wave}:${index}:noise`) % 13 !== 0 ? ffbeKinds[index] : null) || (boss ? Math.floor(wave / 5) % 2 === 0 ? "psyche-fox" : "shinigami" : enemyKinds[(wave * 3 + index * 2 + Math.floor(wave / 5)) % enemyKinds.length]);
    const template = enemyCatalog[kind];
    const maxHp = Math.round(template.hp * scale.hp * (boss ? scale.bossHp : 1));
    return {
      id: wave * 10 + index,
      name: boss ? `${template.name} // BOSS` : template.name,
      kind,
      trait: boss ? "berserk" : template.trait || "none",
      hp: maxHp,
      maxHp,
      level: wave,
      speed: (template.speed ?? {
        frog: 9,
        wolf: 23,
        shinigami: 19,
        "jey-pengi": 13,
        "electro-pengi": 17,
        "psyche-fox": 21
      }[kind]) + scale.speed,
      xp: Math.round((10 + template.hp * .15) * scale.xp * (boss ? 3 : 1)),
      attack: Math.round(template.attack * scale.attack * (boss ? scale.bossAttack : 1)),
      boss
    };
  });
};
function SpritePreview({
  fighter,
  maximumScale = 1
}) {
  const ref = React.useRef(null);
  const [scale, setScale] = useState(1);
  React.useLayoutEffect(() => {
    const element = ref.current;
    const fit = () => {
      setScale(Math.min(maximumScale, element.clientWidth / (fighter.frameWidth || 80), element.clientHeight / (fighter.frameHeight || 116)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fighter.frameWidth, fighter.frameHeight, maximumScale]);
  return React.createElement("span", {
    className: "sprite-preview",
    ref: ref
  }, React.createElement("span", {
    className: "sprite-preview-inner",
    style: {
      transform: `scale(${scale})`
    }
  }, React.createElement(Sprite, {
    fighter: fighter
  })));
}
function Sprite({
  fighter,
  action = null,
  combat = false
}) {
  const isAttacking = combat && !!fighter.attackSprite && ["pyro", "shockwave", "burst"].includes(action ?? "");
  const sprite = isAttacking && fighter.attackSprite ? fighter.attackSprite : fighter.sprite;
  const frameCount = isAttacking ? fighter.attackFrames : fighter.frames;
  return React.createElement("div", {
    className: `pixel-sprite hero-sprite ${frameCount ? `sprite-frames-${frameCount}` : ""} ${isAttacking ? "attack-sprite" : ""}`,
    style: {
      backgroundImage: `url(${sprite})`,
      ...(frameCount ? {
        backgroundSize: `${frameCount * 100}% 100%`
      } : {}),
      ...(fighter.frameWidth ? {
        width: `${fighter.frameWidth}px`,
        height: `${fighter.frameHeight}px`
      } : {})
    },
    role: "img",
    "aria-label": fighter.name
  });
}
const pinRankScales = {
  E: .8,
  D: .9,
  C: 1,
  B: 1.15,
  A: 1.3,
  Reaper: 1.45,
  Angel: 1.6
};
function pinRankMultiplier(pin) {
  return pinRankScales[pin.grade || ""] ?? 1;
}
function scaledPinEffect(pin, base) {
  return base > 0 ? Math.max(1, Math.round(base * pinRankMultiplier(pin))) : 0;
}
function pinShieldReduction(pin) {
  return Math.min(.75, .55 * pinRankMultiplier(pin));
}
function PinRankInfo({
  pin
}) {
  const label = pin.grade && pin.grade !== "---" ? `Classe ${pin.grade}` : "Sans classe";
  return React.createElement("span", null, label, " \xB7 Effets \xD7", pinRankMultiplier(pin).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR"));
}
const basePsych = {
  NEKU: "pin266",
  SHIKI: "groove-pawn",
  BEAT: "sk8-combo",
  JOSHUA: "joshua-phone",
  CLOUD: "buster-sword",
  AERITH: "healing-wind",
  "2B": "virtuous-contract",
  A2: "type-40-blade",
  SORA: "kingdom-key",
  RIKU: "way-to-dawn",
  NOCTIS: "armiger",
  PROMPTO: "machinery",
  IGNIS: "elemental-daggers",
  GLADIO: "shield-of-the-king"
};
const partnerPsychs = [{
  id: "virtuous-contract",
  name: "Virtuous Contract",
  psych: "Lame YoRHa",
  kind: "physical",
  power: 28
}, {
  id: "type-40-blade",
  name: "Type-40 Blade",
  psych: "Lame YoRHa",
  kind: "physical",
  power: 31
}, {
  id: "kingdom-key",
  name: "Kingdom Key",
  psych: "Lumière de la Keyblade",
  kind: "physical",
  power: 27
}, {
  id: "way-to-dawn",
  name: "Way to the Dawn",
  psych: "Lame de l’aube",
  kind: "special",
  power: 29
}, {
  id: "buster-sword",
  name: "Buster Sword",
  psych: "Braver",
  kind: "physical",
  power: 30
}, {
  id: "healing-wind",
  name: "Healing Wind",
  psych: "Vent guérisseur",
  kind: "heal",
  power: 45
}, {
  id: "groove-pawn",
  name: "Groove Pawn",
  psych: "Mr. Mew",
  kind: "special",
  power: 22
}, {
  id: "sk8-combo",
  name: "Beat Partner Pin",
  psych: "SK8 Combo",
  kind: "physical",
  power: 22
}, {
  id: "joshua-phone",
  name: "Joshua Partner Pin",
  psych: "Chute d’objets",
  kind: "special",
  power: 22
}, {
  id: "armiger",
  name: "Armiger",
  psych: "Armes royales",
  kind: "physical",
  power: 31
}, {
  id: "machinery",
  name: "Machinery",
  psych: "Tir de précision",
  kind: "special",
  power: 27
}, {
  id: "elemental-daggers",
  name: "Elemental Daggers",
  psych: "Lames élémentaires",
  kind: "special",
  power: 29
}, {
  id: "shield-of-the-king",
  name: "Shield of the King",
  psych: "Bouclier royal",
  kind: "physical",
  power: 33
}].map(pin => ({
  ...pin,
  number: "",
  row: -1,
  col: 0,
  drain: false,
  cost: 1
}));
const psychs = Object.fromEntries([...pinList, ...partnerPsychs].map(pin => [pin.id, {
  ...pin,
  element: badgeElement(pin)
}]));
const signaturePins = Object.fromEntries(characterRoster.map(hero => {
  const base = psychs[basePsych[hero.name]];
  const pin = {
    ...base,
    id: "signature-" + base.id,
    grade: "A",
    name: base.name.replace(" (Pin)", "") + " · Signature",
    number: "★"
  };
  psychs[pin.id] = pin;
  return [hero.name, pin];
}));
const collectionPins = [...pinList, ...Object.values(signaturePins)];
const types = {
  physical: "ATK",
  special: "ATK SPE",
  heal: "Soin",
  guard: "Protection",
  support: "Soutien"
};
function PinIcon({
  pin
}) {
  if (pin.row < 0) return React.createElement("i", {
    "aria-hidden": "true",
    style: {
      display: "grid",
      placeItems: "center",
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "var(--indigo)",
      color: "white",
      fontStyle: "normal"
    }
  }, {
    "groove-pawn": "♟",
    "sk8-combo": "★",
    "joshua-phone": "☎",
    "buster-sword": "⚔",
    "healing-wind": "✿",
    "virtuous-contract": "⚔",
    "type-40-blade": "⚔",
    "kingdom-key": "✦",
    "way-to-dawn": "☾",
    armiger: "✧",
    machinery: "⌁",
    "elemental-daggers": "♨",
    "shield-of-the-king": "⬟"
  }[pin.id.replace(/^signature-/, "")]);
  return React.createElement("i", {
    "aria-hidden": "true",
    style: {
      display: "inline-block",
      width: 28,
      height: 28,
      flex: "none",
      imageRendering: "pixelated",
      backgroundImage: `url(./assets/pins/row-${pin.row}.webp)`,
      backgroundPosition: `-${pin.col * 28}px 0`
    }
  });
}
const portals = {
  shibuya: "Shibuya",
  partners: "Partenaires",
  reality: "From another reality",
  apocalyptic: "Apocalyptic Future",
  destiny: "Destiny Islands",
  eosDawn: "Eos · Noctis & Prompto",
  eosDusk: "Eos · Ignis & Gladio"
};
const portalReleaseAt = {
  eosDawn: Date.parse("2026-11-25T00:00:00+01:00"),
  eosDusk: Date.parse("2026-11-25T00:00:00+01:00")
};
const portalAvailable = id => !portalReleaseAt[id] || Date.now() >= portalReleaseAt[id];
const bases = {
  NEKU: [24, 32, 14],
  SHIKI: [22, 26, 20],
  BEAT: [34, 18, 12],
  JOSHUA: [19, 36, 16],
  CLOUD: [36, 21, 15],
  AERITH: [16, 38, 18],
  "2B": [32, 24, 21],
  A2: [35, 21, 19],
  SORA: [29, 29, 20],
  RIKU: [27, 32, 21],
  NOCTIS: [32, 25, 20],
  PROMPTO: [20, 34, 22],
  IGNIS: [24, 32, 19],
  GLADIO: [38, 17, 13]
};
const maxLevel = 99;
function xpAtLevel(level) {
  const n = level - 1;
  return 100 * n + 35 * n * (n - 1) / 2 + 5 * n * (n - 1) * (2 * n - 1) / 6;
}
function experience(total) {
  const xp = Math.min(xpAtLevel(maxLevel), Math.max(0, Math.floor(Number(total) || 0)));
  let level = 1;
  while (level < maxLevel && xp >= xpAtLevel(level + 1)) level++;
  const current = xp - xpAtLevel(level);
  const required = level === maxLevel ? 0 : xpAtLevel(level + 1) - xpAtLevel(level);
  return {
    xp,
    level,
    current,
    required
  };
}
function legacyExperience(wins) {
  const count = Math.max(0, Math.floor(Number(wins) || 0));
  const level = Math.min(maxLevel, 1 + Math.floor(count / 3));
  return level === maxLevel ? xpAtLevel(maxLevel) : xpAtLevel(level) + Math.floor(count % 3 / 3 * (xpAtLevel(level + 1) - xpAtLevel(level)));
}
function gainExperience(f, amount) {
  const progress = experience((f.xp || 0) + amount);
  const oldLevel = (f.level || 1) - 1,
    newLevel = progress.level - 1;
  const scale = 1.2 ** (f.battleRank || 0),
    [atk, mag, speed] = bases[f.name],
    hpBase = characterRoster.find(hero => hero.name === f.name).maxHp;
  const delta = (base, step) => Math.round((base + newLevel * step) * scale) - Math.round((base + oldLevel * step) * scale);
  const hpGain = delta(hpBase, 5);
  return {
    ...f,
    xp: progress.xp,
    level: progress.level,
    atk: f.atk + delta(atk, 2),
    mag: f.mag + delta(mag, 2),
    speed: f.speed + delta(speed, 1),
    maxHp: f.maxHp + hpGain,
    hp: f.hp > 0 ? f.hp + hpGain : 0
  };
}
function XpProgress({
  xp
}) {
  const p = experience(xp);
  return React.createElement("div", {
    className: "xp-progress"
  }, React.createElement("span", null, "Niv. ", p.level, " \xB7 ", p.required ? `${p.current} / ${p.required} XP` : "MAX"), React.createElement("progress", {
    "aria-label": "Progression du niveau",
    max: p.required || 1,
    value: p.required ? p.current : 1
  }));
}
function trained(f, xp, awake, rank = 0) {
  const progress = experience(xp),
    n = progress.level - 1,
    [atk, mag, speed] = bases[f.name];
  const scale = v => Math.round(v * 1.2 ** rank);
  const maxHp = scale(f.maxHp + n * 5) + (awake ? 20 : 0);
  return {
    ...f,
    xp: progress.xp,
    level: progress.level,
    battleRank: rank,
    atk: scale(atk + n * 2),
    mag: scale(mag + n * 2),
    speed: scale(speed + n),
    hp: maxHp,
    maxHp
  };
}
const gachaView = new URLSearchParams(location.search).get("vue") === "gacha";
const ranks = ["E", "D", "C", "B", "A", "etoile"];
function RankBadge({
  level
}) {
  return React.createElement("img", {
    className: "rank-badge",
    src: `./assets/bingo/rang-${ranks[level]}.webp`,
    alt: `Rang ${level === 5 ? "étoile" : ranks[level]}`
  });
}
function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}
const offensive = id => ["physical", "special"].includes(psychs[id]?.kind);
function validWishEvent(e) {
  try {
    return e && typeof e.id === "string" && /^[a-zA-Z0-9-]+$/.test(e.id) && typeof e.portal === "string" && Number.isFinite(e.at) && [1, 10].includes(e.count) && [e.freeUsed, e.coinsPaid, e.coinsBefore, e.coinsAfter, e.freeBefore, e.freeAfter, e.first, e.last].every(n => Number.isSafeInteger(n) && n >= 0) && typeof e.drawsJson === "string" && Array.isArray(JSON.parse(e.drawsJson)) && JSON.parse(e.drawsJson).length === e.count;
  } catch {
    return false;
  }
}
function historyFull(p) {
  return p.wishEvents.length >= 50 || JSON.stringify(p.wishEvents).length > 28000;
}
function makeWishEvent(p, next, id, count, free, cost, draws) {
  const at = Date.now();
  return {
    id: `${at}-${next.wishesMade}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
    at,
    portal: id,
    count,
    freeUsed: free,
    coinsPaid: cost,
    coinsBefore: p.coins,
    coinsAfter: next.coins,
    freeBefore: p.freeWishes,
    freeAfter: next.freeWishes,
    first: p.wishesMade + 1,
    last: next.wishesMade,
    drawsJson: JSON.stringify(draws.map(draw => "pin" in draw ? {
      pinId: draw.pin.id
    } : {
      name: draw.name,
      rank: draw.rank,
      copies: draw.copies
    }))
  };
}
function WishHistory({
  profile,
  embedded = false
}) {
  const Panel = embedded ? InlinePanel : WishDialog;
  const [open, setOpen] = useState(false),
    [items, setItems] = useState([]),
    [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [cursor, setCursor] = useState(null),
    [more, setMore] = useState(false);
  const load = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      if (!window.ChibiGameSync?.historyPage) throw Error("L’historique distant est indisponible. Les invocations en attente restent conservées ici.");
      const result = await window.ChibiGameSync.historyPage(reset ? null : cursor);
      setItems(old => reset ? result.items.filter(validWishEvent) : [...old, ...result.items.filter(validWishEvent)]);
      setCursor(result.cursor);
      setMore(result.more);
    } catch (e) {
      setError(String(e.message || "Historique indisponible"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (embedded) load(true);
  }, [embedded]);
  const events = [...new Map([...items, ...profile.wishEvents].map(event => [event.id, event])).values()].sort((a, b) => b.id.localeCompare(a.id));
  const pending = new Set(profile.wishEvents.map(e => e.id));
  return React.createElement(React.Fragment, null, !embedded && React.createElement("button", {
    onClick: () => {
      setOpen(true);
      setSelected(null);
      load(true);
    }
  }, "Historique des v\u0153ux"), (open || embedded) && React.createElement(Panel, {
    className: "wish-history",
    title: "Historique des v\u0153ux",
    close: () => setOpen(false)
  }, React.createElement("div", {
    key: selected?.id || "list",
    className: "wish-history-view"
  }, selected ? React.createElement(React.Fragment, null, React.createElement("p", null, React.createElement("b", null, portals[selected.portal] || selected.portal), " \xB7 ", new Date(selected.at).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    timeZone: "Europe/Paris"
  })), React.createElement("p", null, "V\u0153ux ", selected.first, "\u2013", selected.last, " \xB7 ", selected.freeUsed, " gratuits \xB7 ", selected.coinsPaid, " pi\xE8ces"), React.createElement("p", null, "Solde : ", selected.coinsBefore, " \u2192 ", selected.coinsAfter, " pi\xE8ces \xB7 Gratuits : ", selected.freeBefore, " \u2192 ", selected.freeAfter), React.createElement("div", {
    className: "wish-history-list"
  }, JSON.parse(selected.drawsJson).map((draw, i) => {
    const pin = psychs[draw.pinId];
    return React.createElement("article", {
      key: i
    }, pin ? React.createElement(PinIcon, {
      pin: pin
    }) : React.createElement("span", null, "\u2605"), React.createElement("div", null, React.createElement("b", null, pin?.name || draw.name || "Récompense"), React.createElement("small", null, pin ? "Badge" : `Personnage · Rang ${draw.rank === 5 ? "étoile" : ranks[draw.rank]} · ${draw.copies} doublon(s)`)));
  })), React.createElement("button", {
    onClick: () => setSelected(null)
  }, "Retour \xE0 l\u2019historique")) : React.createElement(React.Fragment, null, React.createElement("p", null, profile.wishesMade, " invocations comptabilis\xE9es \xB7 ", profile.freeWishSpent, " v\u0153ux gratuits consomm\xE9s"), profile.wishHistoryBaseline > 0 && React.createElement("p", null, profile.wishHistoryBaseline, " invocations ant\xE9rieures : total connu, d\xE9tails non enregistr\xE9s \xE0 l\u2019\xE9poque."), error && React.createElement("p", {
    role: "status"
  }, error), React.createElement("div", {
    className: "wish-history-list"
  }, events.map(event => React.createElement("button", {
    key: event.id,
    onClick: () => setSelected(event)
  }, React.createElement("b", null, event.count, " ", event.count > 1 ? "vœux" : "vœu", " \xB7 ", portals[event.portal] || event.portal), React.createElement("small", null, new Date(event.at).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    timeZone: "Europe/Paris"
  }), " \xB7 ", event.freeUsed, " gratuits \xB7 ", event.coinsPaid, " pi\xE8ces"), pending.has(event.id) && React.createElement("small", null, "En attente de synchronisation"))), !events.length && !loading && React.createElement("p", null, "Aucune invocation d\xE9taill\xE9e enregistr\xE9e pour le moment.")), React.createElement("div", {
    className: "dialog-actions"
  }, React.createElement("button", {
    disabled: loading,
    onClick: () => load(true)
  }, "Actualiser"), more && React.createElement("button", {
    disabled: loading,
    onClick: () => load()
  }, "Charger plus")))), !embedded && React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer")));
}
function validRun(raw, owned, copies = {}, awakened = []) {
  try {
    const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
    if (!raw || raw.version !== 1 || typeof raw.id !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(raw.id) || !integer(raw.seq, 0, 1000000) || !["active", "lost", "complete", "abandoned"].includes(raw.status) || !integer(raw.wave, 1, 100) || !integer(raw.turn, 1, 100000) || !integer(raw.energy, 0, 3) || !integer(raw.groove, 0, 100) || JSON.stringify(raw).length > 18000) return null;
    if (!Array.isArray(raw.team) || raw.team.length !== 2 || new Set(raw.team.map(f => f.name)).size !== 2) return null;
    const team = raw.team.map(f => {
      const base = characterRoster.find(b => b.name === f.name);
      if (!base || !owned.includes(f.name) || !["hp", "maxHp", "atk", "mag", "speed", "xp", "level"].every(k => integer(f[k], k === "hp" || k === "xp" ? 0 : 1, 10000000)) || f.hp > f.maxHp) throw Error();
      const oldRank = integer(f.battleRank, 0, 5) ? f.battleRank : 0;
      if (raw.status === "active" && copies[f.name] > oldRank) {
        const current = trained(base, f.xp, awakened.includes(f.name), copies[f.name]);
        return {
          ...current,
          hp: f.hp > 0 ? Math.max(1, Math.round(current.maxHp * f.hp / f.maxHp)) : 0
        };
      }
      return {
        ...base,
        battleRank: oldRank,
        ...Object.fromEntries(["hp", "maxHp", "atk", "mag", "speed", "xp", "level"].map(k => [k, f[k]]))
      };
    });
    if (!Array.isArray(raw.enemies) || raw.enemies.length < 1 || raw.enemies.length > 4 || new Set(raw.enemies.map(e => e.id)).size !== raw.enemies.length) return null;
    for (const e of raw.enemies) if (!enemyCatalog[e.kind] || !["id", "hp", "maxHp", "attack", "speed", "xp"].every(k => integer(e[k], 0, 10000000)) || e.hp > e.maxHp || Math.floor(e.id / 10) !== raw.wave) return null;
    const names = team.map(f => f.name),
      loadout = Object.fromEntries(names.map(name => [name, raw.loadout?.[name]]));
    if (!Object.values(loadout).every(ids => Array.isArray(ids) && ids.length > 0 && ids.length <= 3 && ids.every(id => psychs[id])) || new Set(Object.values(loadout).flat()).size !== Object.values(loadout).flat().length) return null;
    const pending = raw.pending || null;
    if (pending) {
      if (!Array.isArray(pending.steps) || pending.steps.length > 6 || !integer(pending.index, 0, pending.steps.length) || !Array.isArray(pending.shields) || pending.shields.some(([name, n]) => !names.includes(name) || !Number.isFinite(n) || n < 0 || n > .75) || !Array.isArray(pending.performed) || pending.performed.some(n => !names.includes(n))) return null;
      for (const step of pending.steps) if (step.side === "ally" ? !names.includes(step.name) || !pending.choices?.[step.name] : step.side !== "enemy" || !raw.enemies.some(e => e.id === step.id)) return null;
      for (const name of names) {
        const plan = pending.choices?.[name];
        if (plan && (!["guard", "burst", "psych"].includes(plan.kind) || plan.kind === "psych" && !loadout[name].includes(plan.pin))) return null;
      }
    }
    const status = raw.status === "active" && team.every(f => f.hp <= 0) ? "lost" : raw.status;
    return {
      ...raw,
      team,
      loadout,
      status,
      pending: status === "active" ? pending : null,
      reward: raw.reward === true,
      earnedXp: integer(raw.earnedXp, 0, 10000000) ? raw.earnedXp : 0,
      loot: Array.isArray(raw.loot) ? raw.loot.filter(n => typeof n === "string").slice(0, 400) : [],
      awarded: Array.isArray(raw.awarded) ? raw.awarded.filter(n => raw.enemies.some(e => e.id === n)) : []
    };
  } catch {
    return null;
  }
}
function newRun(profile) {
  const names = profile.equipped.filter(Boolean),
    id = `run-${Date.now()}-${crypto.randomUUID()}`;
  return {
    version: 1,
    id,
    seq: 0,
    status: "active",
    updatedAt: Date.now(),
    wave: 1,
    turn: 1,
    team: names.map(name => trained(characterRoster.find(f => f.name === name), profile.xp[name] || 0, profile.awakened.includes(name), profile.copies[name] || 0)),
    enemies: makeWave(1, id),
    loadout: Object.fromEntries(names.map(name => [name, [...profile.loadout[name]]])),
    energy: 3,
    groove: 28,
    reward: false,
    earnedXp: 0,
    loot: [],
    awarded: [],
    pending: null
  };
}
function applyRunCheckpoint(p, snapshot, gains = {}) {
  if (!p.run || p.run.id !== snapshot.id || p.run.status !== "active" || snapshot.seq <= p.run.seq) return p;
  const xp = {
    ...p.xp
  };
  if (gains.xp) for (const f of snapshot.team) xp[f.name] = experience((xp[f.name] || 0) + gains.xp).xp;
  return {
    ...p,
    run: snapshot,
    xp,
    pins: [...new Set([...p.pins, ...(gains.pins || [])])],
    coins: p.coins + (gains.victory ? 5 : 0),
    hasPlayed: true,
    bestFloor: Math.max(p.bestFloor, snapshot.wave),
    floorRecoveryAvailable: p.floorRecoveryAvailable && snapshot.wave < 10
  };
}
const profileKey = "chibi.reapers-run.party.v1";
function equippedBy(profile, name, id) {
  return profile.equipped.find(partner => partner && partner !== name && profile.loadout[partner]?.includes(id));
}
function availablePsychs(profile, name) {
  return [...new Set([basePsych[name], ...profile.pins])].filter(id => Boolean(psychs[id]));
}
function grantStarterNeku(p) {
  if (p.owned.includes("NEKU")) return p.starterNekuGranted ? p : {
    ...p,
    starterNekuGranted: true
  };
  return {
    ...p,
    starterNekuGranted: true,
    owned: [...p.owned, "NEKU"],
    copies: {
      ...p.copies,
      NEKU: 0
    },
    levels: {
      ...p.levels,
      NEKU: 0
    },
    xp: {
      ...p.xp,
      NEKU: 0
    }
  };
}
function assignBasePsychs(profile) {
  profile = grantStarterNeku(profile);
  const counts = Object.fromEntries(profile.owned.map(name => [name, Math.min(5, Math.max(0, Math.floor(Number(profile.copies[name]) || 0)))]));
  profile = {
    ...profile,
    copies: counts,
    levels: {
      ...counts
    },
    awakened: profile.awakened.filter(name => counts[name] === 5)
  };
  const pins = [...profile.pins];
  if (profile.owned.includes("NEKU") && !pins.includes(basePsych.NEKU)) pins.push(basePsych.NEKU);
  const loadout = {};
  for (const name of profile.owned) {
    const saved = profile.loadout[name];
    const ids = Array.isArray(saved) ? saved : typeof saved === "string" ? [saved] : [];
    const allowed = availablePsychs({
      ...profile,
      pins
    }, name);
    const equipped = [...new Set(ids)].filter(id => allowed.includes(id)).slice(0, 3);
    loadout[name] = equipped.length ? equipped : [basePsych[name]];
  }
  const used = new Set();
  for (const name of profile.equipped.filter(Boolean)) {
    loadout[name] = (loadout[name] || []).filter(id => !used.has(id));
    if (!loadout[name].length) {
      const replacement = availablePsychs({
        ...profile,
        pins
      }, name).find(id => !used.has(id));
      if (replacement) loadout[name] = [replacement];
    }
    loadout[name].forEach(id => used.add(id));
  }
  return {
    ...profile,
    pins,
    loadout
  };
}
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
    const owned = characterRoster.map(f => f.name).filter(name => saved.owned.includes(name));
    const equipped = [0, 1].map(i => {
      const name = saved.equipped?.[i];
      return owned.includes(name) && (i === 0 || name !== saved.equipped[0]) ? name : "";
    });
    const pins = [...new Set(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}).flat())].filter(id => psychs[id] && (psychs[id].row >= 0 || id.startsWith("signature-")));
    const copies = Object.fromEntries(owned.map(name => {
      const value = saved.copies?.[name];
      const count = value !== undefined && Number.isFinite(Number(value)) ? Math.min(5, Math.max(0, Math.floor(Number(value)))) : saved.awakened?.includes(name) || Number(saved.levels?.[name]) === 5 ? 5 : 0;
      return [name, count];
    }));
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 10 ? saved.wishStep : 0;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return accrueDailyWishes(assignBasePsychs({
      specialRunRecoveries: Array.isArray(saved.specialRunRecoveries) ? [...new Set(saved.specialRunRecoveries.filter(id => typeof id === "string" && id.length < 100))] : [],
      eventRun: readEvent(saved.eventRun, owned, copies, Array.isArray(saved.awakened) ? saved.awakened : []),
      run: validRun(saved.run, owned, copies, Array.isArray(saved.awakened) ? saved.awakened : []),
      wishEvents: Array.isArray(saved.wishEvents) ? saved.wishEvents.filter(validWishEvent) : [],
      wishHistoryStartedAt: Number(saved.wishHistoryStartedAt) || 0,
      wishHistoryBaseline: Number(saved.wishHistoryBaseline) || 0,
      freeWishVersion: saved.freeWishVersion === 1 ? 1 : 0,
      freeWishSpent: Number.isSafeInteger(saved.freeWishSpent) && saved.freeWishSpent >= 0 ? saved.freeWishSpent : 0,
      freeWishDaySpent: Number.isSafeInteger(saved.freeWishDaySpent) && saved.freeWishDaySpent >= 0 ? saved.freeWishDaySpent : 0,
      pcMissionCoins: Object.fromEntries(Object.entries(saved.pcMissionCoins || {}).filter(([day, n]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= 100000)),
      starterNekuGranted: saved.starterNekuGranted === true,
      starterWishesGranted: saved.starterWishesGranted === true,
      hasPlayed: saved.hasPlayed === true || Number(saved.bestFloor) > 0 || Object.values(saved.xp || saved.wins || {}).some(x => Number(x) > 0),
      wishesMade: Number.isSafeInteger(saved.wishesMade) && saved.wishesMade >= 0 ? saved.wishesMade : Math.max(owned.filter(n => !saved.starterNekuGranted || n !== "NEKU").length, Number(saved.wishStep) || 0, (saved.pins || []).some(id => !saved.starterNekuGranted || id !== basePsych.NEKU) ? 1 : 0),
      freeWishes: Number.isSafeInteger(saved.freeWishes) && saved.freeWishes >= 0 ? saved.freeWishes : 0,
      lastFreeWishDay: typeof saved.lastFreeWishDay === "string" ? saved.lastFreeWishDay : "",
      bestFloor: Math.min(100, Math.max(0, Math.floor(Number(saved.bestFloor ?? saved.highestFloor ?? 0) || 0))),
      claimedQuests: Array.isArray(saved.claimedQuests) ? [...new Set(saved.claimedQuests.filter(id => typeof id === "string"))] : [],
      floorRecoveryAvailable: saved.floorRecoveryAvailable === true || saved.floorRecoveryAvailable !== false && saved.bestFloor === undefined && owned.length > 0,
      owned,
      equipped,
      pins,
      wishStep,
      copies,
      xp: Object.fromEntries(owned.map(n => [n, Number.isSafeInteger(saved.xp?.[n]) && saved.xp[n] >= 0 ? experience(saved.xp[n]).xp : legacyExperience(saved.wins?.[n])])),
      levels: {
        ...copies
      },
      awakened: owned.filter(name => copies[name] === 5 && saved.awakened?.includes(name)),
      loadout: saved.loadout || {},
      coins: saved.coins
    }));
  } catch {}
  return accrueDailyWishes(assignBasePsychs({
    specialRunRecoveries: [],
    run: null,
    wishEvents: [],
    wishHistoryStartedAt: 0,
    wishHistoryBaseline: 0,
    freeWishVersion: 0,
    freeWishSpent: 0,
    freeWishDaySpent: 0,
    pcMissionCoins: {},
    starterNekuGranted: false,
    starterWishesGranted: false,
    hasPlayed: false,
    wishesMade: 0,
    freeWishes: 0,
    lastFreeWishDay: "",
    bestFloor: 0,
    claimedQuests: [],
    floorRecoveryAvailable: false,
    pins: [],
    wishStep: 0,
    copies: {},
    xp: {},
    levels: {},
    awakened: [],
    owned: [],
    equipped: ["", ""],
    loadout: {},
    coins: 180
  }));
}
const freeWishStartDay = "2026-11-18";
function parisDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  return ["year", "month", "day"].map(key => parts.find(p => p.type === key).value).join("-");
}
function dayIndex(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? Date.parse(day + "T00:00:00Z") / 86400000 : NaN;
}
const freeWishNoStackDay = "2026-11-25";
function accrueDailyWishes(p, now = new Date()) {
  const today = parisDay(now),
    end = dayIndex(today),
    start = dayIndex(freeWishStartDay),
    previous = dayIndex(p.lastFreeWishDay);
  if (end < start || Number.isFinite(previous) && previous > end) return p;
  const active = p.wishesMade > 0 || p.wishStep > 0 || Object.values(p.copies).some(n => n > 0) || p.owned.some(n => n !== "NEKU") || p.pins.some(id => id !== basePsych.NEKU);
  let spent = p.freeWishSpent,
    daySpent = p.lastFreeWishDay === today ? p.freeWishDaySpent : 0;
  if (p.freeWishVersion !== 1) {
    if (today < freeWishNoStackDay) {
      const knownDay = Number.isFinite(previous) ? Math.max(start, previous) : end;
      const earned = 10 + (knownDay - start + 1) * 3;
      spent = active && (!Number.isFinite(previous) || p.freeWishes >= earned) ? earned : Number.isFinite(previous) ? Math.max(0, earned - p.freeWishes) : 0;
    } else daySpent = p.lastFreeWishDay === today ? Math.max(0, 3 - Math.min(3, p.freeWishes)) : 0;
  }
  const balance = today >= freeWishNoStackDay ? Math.max(0, 3 - daySpent) : Math.max(0, 10 + (end - start + 1) * 3 - spent);
  return {
    ...p,
    wishHistoryStartedAt: p.wishHistoryStartedAt || now.getTime(),
    wishHistoryBaseline: p.wishHistoryStartedAt ? p.wishHistoryBaseline : p.wishesMade,
    freeWishVersion: 1,
    freeWishSpent: spent,
    freeWishDaySpent: daySpent,
    freeWishes: balance,
    lastFreeWishDay: today,
    starterWishesGranted: true
  };
}
function wishQuote(p, count) {
  const free = Math.min(count, p.freeWishes),
    paid = count - free;
  return {
    free,
    paid,
    cost: paid * 100,
    starter: false
  };
}
const characterChance = 0.10;
function portalRoster(id) {
  const names = id === "partners" ? ["BEAT", "JOSHUA"] : id === "eosDawn" ? ["NOCTIS", "PROMPTO"] : id === "eosDusk" ? ["IGNIS", "GLADIO"] : id === "apocalyptic" ? ["2B", "A2"] : id === "destiny" ? ["SORA", "RIKU"] : id === "reality" ? ["CLOUD", "AERITH"] : id === "shibuya" ? ["NEKU", "SHIKI"] : ["NEKU", "SHIKI"];
  return characterRoster.filter(f => names.includes(f.name));
}
function portalPool(id, _profile) {
  const roster = portalRoster(id);
  return id === "partners" ? [...roster, ...roster.filter(f => ["BEAT", "JOSHUA"].includes(f.name))] : roster;
}
const gameSound = (() => {
  const key = "chibi.reapers-run.audio-muted";
  const volumes = {
    music: 32,
    sfx: 55
  };
  let muted = false,
    visible = false,
    track = null;
  let music = null,
    cue = null,
    clickSound = null;
  const clickUrl = "./assets/audio/menu-click.mp3";
  let context = null,
    clickBuffer = null,
    clickGain = null;
  let clickSource = null;
  function prepareClick() {
    const Engine = window.AudioContext || window.webkitAudioContext;
    if (!Engine || location.protocol === "file:") {
      prepareFallback();
      return;
    }
    try {
      const engine = new Engine({
        latencyHint: "interactive"
      });
      context = engine;
      engine.onstatechange = () => {
        if (engine.state === "running") mix();
      };
      clickGain = engine.createGain();
      clickGain.connect(engine.destination);
      fetch(clickUrl).then(r => {
        if (!r.ok) throw Error();
        return r.arrayBuffer();
      }).then(bytes => engine.decodeAudioData(bytes)).then(buffer => {
        clickBuffer = buffer;
      }).catch(prepareFallback);
    } catch {
      prepareFallback();
    }
  }
  function prepareFallback() {
    if (!clickSound) {
      clickSound = new Audio();
      clickSound.preload = "auto";
      clickSound.src = clickUrl;
      clickSound.load();
    }
  }
  function stopClick() {
    clickSource?.stop();
    clickSource = null;
    clickSound?.pause();
  }
  const gains = new WeakMap();
  try {
    muted = localStorage.getItem(key) === "1";
    for (const channel of ["music", "sfx"]) {
      const stored = localStorage.getItem("chibi.reapers-run.volume." + channel);
      if (stored !== null && /^\d{1,3}$/.test(stored) && Number(stored) <= 100) volumes[channel] = Number(stored);
    }
  } catch {}
  function level(player, volume) {
    if (!player) return;
    let gain = gains.get(player);
    if (!gain && context?.state === "running") {
      gain = context.createGain();
      context.createMediaElementSource(player).connect(gain);
      gain.connect(context.destination);
      gains.set(player, gain);
    }
    if (gain) {
      player.volume = 1;
      gain.gain.value = volume;
    } else player.volume = volume;
    player.muted = muted || volume === 0;
  }
  function mix() {
    if (clickGain) clickGain.gain.value = muted ? 0 : volumes.sfx / 100 * .62;
    level(music, volumes.music / 100);
    level(cue, volumes.sfx / 100);
    level(clickSound, volumes.sfx / 100 * .62);
  }
  function sync() {
    if (!visible || document.hidden || muted) {
      music?.pause();
      cue?.pause();
      stopClick();
      return;
    }
    if (!track || !volumes.music) {
      music?.pause();
      return;
    }
    if (!music) music = new Audio();
    if (music.dataset.track !== track) {
      music.dataset.track = track;
      music.src = "./assets/audio/" + track + ".mp3";
      music.loop = track !== "victory";
    }
    level(music, volumes.music / 100);
    if (music.paused && !music.ended) music.play().catch(() => {});
  }
  function preview() {
    if (muted || !visible || document.hidden || !volumes.sfx) return;
    if (clickBuffer && context && clickGain) {
      if (context.state !== "running") context.resume().catch(() => {});
      stopClick();
      clickGain.gain.value = volumes.sfx / 100 * .62;
      const source = context.createBufferSource();
      source.buffer = clickBuffer;
      source.connect(clickGain);
      source.onended = () => {
        source.disconnect();
        if (clickSource === source) clickSource = null;
      };
      clickSource = source;
      source.start();
      return;
    }
    prepareFallback();
    if (!clickSound) return;
    level(clickSound, volumes.sfx / 100 * .62);
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }
  function effect(id) {
    if (muted || !visible || document.hidden || !volumes.sfx) return;
    if (!cue) cue = new Audio();
    cue.src = "./assets/audio/" + id + ".mp3";
    level(cue, volumes.sfx / 100);
    cue.play().catch(() => {});
  }
  function setVolume(channel, value) {
    if (!Number.isFinite(value)) return;
    volumes[channel] = Math.min(100, Math.max(0, Math.round(value)));
    try {
      localStorage.setItem("chibi.reapers-run.volume." + channel, String(volumes[channel]));
    } catch {}
    if (context?.state === "suspended") context.resume().then(mix).catch(() => {});
    mix();
    sync();
  }
  function toggle() {
    muted = !muted;
    try {
      localStorage.setItem(key, muted ? "1" : "0");
    } catch {}
    mix();
    sync();
    if (!muted) preview();
    window.dispatchEvent(new Event("chibi:audio-setting"));
  }
  function connect() {
    if (!context && !clickSound) prepareClick();
    function interact() {
      if (context?.state === "suspended") context.resume().then(mix).catch(() => {});
      sync();
    }
    const eligible = event => {
      const button = event.target?.closest?.("button");
      return button && !button.matches(":disabled,[aria-disabled=true],.audio-control") ? button : null;
    };
    let pressed = null;
    const down = event => {
      pressed = null;
      if (!event.isPrimary || event.button !== 0) return;
      if (context?.state === "suspended") context.resume().catch(() => {});
      if (event.pointerType === "mouse" && (pressed = eligible(event))) preview();
    };
    const click = event => {
      const button = eligible(event);
      if (button && (event.detail === 0 || button !== pressed)) preview();
      pressed = null;
      interact();
    };
    const frame = window.frameElement;
    const host = frame?.ownerDocument;
    const opening = () => {
      if (frame?.getClientRects().length) {
        visible = true;
        interact();
      }
    };
    host?.addEventListener("click", opening);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", interact, true);
    document.addEventListener("pointerup", interact, true);
    document.addEventListener("visibilitychange", sync);
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    });
    observer.observe(document.documentElement);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", down, true);
      host?.removeEventListener("click", opening);
      document.removeEventListener("pointerup", interact, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", interact, true);
      document.removeEventListener("visibilitychange", sync);
      visible = false;
      sync();
    };
  }
  return {
    connect,
    toggle,
    effect,
    preview,
    setVolume,
    volumes,
    get muted() {
      return muted;
    },
    scene(next) {
      track = next;
      sync();
    }
  };
})();
function AudioSettings({
  back
}) {
  const [values, setValues] = useState({
    ...gameSound.volumes
  });
  return React.createElement("section", {
    className: "hub-panel audio-settings"
  }, React.createElement("h1", null, "Param\xE8tres"), ["music", "sfx"].map(channel => React.createElement("label", {
    key: channel
  }, React.createElement("span", null, channel === "music" ? "Musique" : "Effets sonores"), React.createElement("output", null, values[channel], " %"), React.createElement("input", {
    type: "range",
    min: "0",
    max: "100",
    step: "1",
    value: values[channel],
    "aria-label": channel === "music" ? "Musique" : "Effets sonores",
    onChange: event => {
      gameSound.setVolume(channel, Number(event.currentTarget.value));
      setValues({
        ...gameSound.volumes
      });
    },
    onPointerUp: () => {
      if (channel === "sfx") gameSound.preview();
    },
    onKeyUp: event => {
      if (channel === "sfx" && /^(Arrow|Home|End|Page)/.test(event.key)) gameSound.preview();
    }
  }))), React.createElement("button", {
    onClick: back
  }, "Retour au menu"));
}
function useMusic(track) {
  useEffect(() => {
    gameSound.scene(track);
    return () => gameSound.scene(null);
  }, [track]);
}
function SoundToggle() {
  const [muted, setMuted] = useState(gameSound.muted);
  useEffect(() => {
    const changed = () => setMuted(gameSound.muted);
    window.addEventListener("chibi:audio-setting", changed);
    return () => window.removeEventListener("chibi:audio-setting", changed);
  }, []);
  return React.createElement("button", {
    className: "audio-control",
    "aria-label": "Audio",
    "aria-pressed": !muted,
    onClick: gameSound.toggle
  }, muted ? "🔇" : "🔊");
}
function PortalVideo({
  src,
  poster
}) {
  const ref = React.useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const video = ref.current;
    let visible = true,
      disposed = false;
    const resume = () => {
      if (disposed) return;
      if (document.hidden || !visible) {
        video.pause();
        setPlaying(false);
        return;
      }
      if (video.ended) video.currentTime = 0;
      video.play().catch(() => {
        if (!disposed) setPlaying(false);
      });
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      resume();
    });
    observer.observe(video);
    document.addEventListener("visibilitychange", resume);
    resume();
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", resume);
      video.pause();
    };
  }, [src]);
  return React.createElement(React.Fragment, null, React.createElement("img", {
    className: "portal-art",
    src: poster,
    alt: "",
    "aria-hidden": "true"
  }), React.createElement("video", {
    ref: ref,
    className: "portal-art",
    src: src,
    poster: poster,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    "aria-hidden": "true",
    style: {
      opacity: playing ? 1 : 0
    },
    onPlaying: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onWaiting: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onError: () => setPlaying(false)
  }));
}
function Capsule() {
  const canvas = React.useRef(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const size = 96,
      pixels = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const nx = (x + .5 - size / 2) / (size / 2),
        ny = (size / 2 - y - .5) / (size / 2);
      const radius = nx * nx + ny * ny;
      if (radius >= 1) continue;
      const nz = Math.sqrt(1 - radius);
      const latitude = ny * .95 - nx * .24 + nz * .16;
      const band = Math.abs(latitude) < .09;
      const base = band ? [181, 164, 143] : latitude > 0 ? [233, 75, 49] : [235, 224, 199];
      const light = Math.max(0, -nx * .42 + ny * .64 + nz * .64);
      const gloss = Math.pow(Math.max(0, -nx * .24 + ny * .36 + nz * .90), band ? 18 : 65);
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) pixels.data[i + c] = base[c] * (.31 + .7 * light) + 210 * gloss;
      pixels.data[i + 3] = Math.min(255, (1 - Math.sqrt(radius)) * size * 255);
    }
    ctx.putImageData(pixels, 0, 0);
  }, []);
  return React.createElement("canvas", {
    width: 96,
    height: 96,
    ref: canvas,
    "aria-hidden": "true"
  });
}
function WishDialog({
  title,
  close,
  children,
  className = ""
}) {
  const ref = React.useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return React.createElement("dialog", {
    className: `wish-dialog ${className}`,
    ref: ref,
    "aria-labelledby": "wish-title",
    onCancel: e => {
      e.preventDefault();
      close?.();
    }
  }, React.createElement("h2", {
    id: "wish-title"
  }, title), children);
}
function RewardReveal({
  draws,
  close
}) {
  const [index, setIndex] = useState(0);
  const draw = draws[index],
    pin = "pin" in draw ? draw.pin : null;
  const fighter = "name" in draw ? characterRoster.find(f => f.name === draw.name) : null;
  const uses = {
    physical: "Attaque physique",
    special: "Attaque spéciale",
    heal: "Soin",
    guard: "Protection",
    support: "Soutien"
  };
  return React.createElement("div", {
    className: "reward-reveal"
  }, React.createElement("div", {
    key: index,
    className: "reward-sun",
    "aria-live": "polite"
  }, React.createElement("h3", null, pin ? pin.name.replace(" (Pin)", "") : fighter?.name), React.createElement("div", {
    className: "reward-object"
  }, pin ? React.createElement(PinIcon, {
    pin: pin
  }) : fighter && React.createElement(Sprite, {
    fighter: fighter
  })), React.createElement("div", {
    className: "reward-facts"
  }, pin ? React.createElement(React.Fragment, null, React.createElement("b", null, React.createElement(PinRankInfo, {
    pin: pin
  })), React.createElement("span", null, uses[pin.kind], " \xB7 ", pin.cost, " EN")) : "rank" in draw && React.createElement(React.Fragment, null, React.createElement(RankBadge, {
    level: draw.rank
  }), React.createElement("span", null, draw.copies ? `Doublon ${draw.copies}/5` : "Nouvelle recrue", " \xB7 ", psychs[basePsych[draw.name]].name.replace(" (Pin)", ""))))), React.createElement("div", {
    className: "reveal-footer"
  }, draws.length > 1 && React.createElement("span", null, index + 1, " / ", draws.length), React.createElement("button", {
    onClick: () => index + 1 < draws.length ? setIndex(index + 1) : close()
  }, index + 1 < draws.length ? "Suivant" : "Fermer")));
}
function BadgeArt({
  pin
}) {
  if (pin.row < 0) return React.createElement("span", {
    className: "partner-pin-art"
  }, React.createElement(PinIcon, {
    pin: pin
  }));
  return React.createElement("span", {
    "aria-hidden": "true",
    className: "badge-art",
    style: {
      backgroundImage: `url(./assets/pins/row-${pin.row}.webp)`,
      backgroundPosition: `-${pin.col * 84}cqw 0`
    }
  });
}
function PsychEquipment({
  name,
  profile,
  save
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const [page, setPage] = useState(0);
  const [inspected, setInspected] = useState(null);
  const available = availablePsychs(profile, name);
  const pages = Math.max(1, Math.ceil(available.length / 16));
  const equipped = profile.loadout[name] || [];
  const inspect = inspected ? psychs[inspected] : null;
  const toggle = id => {
    setInspected(id);
    if (equippedBy(profile, name, id)) return;
    setDraft(old => old.includes(id) ? old.filter(value => value !== id) : old.length < 3 ? [...old, id] : old);
  };
  const start = () => {
    setDraft([...equipped]);
    setPage(0);
    setInspected(null);
    setOpen(true);
  };
  return React.createElement("div", {
    className: "psych-loadout"
  }, React.createElement("h2", null, "Psychs \xB7 ", name), React.createElement("div", {
    className: "psych-equipment-slots"
  }, [0, 1, 2].map(index => React.createElement("button", {
    key: index,
    onClick: start,
    "aria-label": `Équiper les psychs de ${name}, emplacement ${index + 1}`
  }, equipped[index] ? React.createElement(React.Fragment, null, React.createElement(PinIcon, {
    pin: psychs[equipped[index]]
  }), React.createElement("small", null, psychs[equipped[index]].name.replace(" (Pin)", ""))) : React.createElement("span", {
    "aria-hidden": "true"
  }, "+")))), open && React.createElement(WishDialog, {
    className: "badge-book",
    title: `Psychs · ${name}`,
    close: () => setOpen(false)
  }, React.createElement("p", {
    className: "equipment-count"
  }, draft.length, " / 3 \xE9quip\xE9s"), React.createElement("div", {
    className: "psych-equipment-slots"
  }, [0, 1, 2].map(i => React.createElement("button", {
    key: i,
    disabled: !draft[i],
    "aria-label": draft[i] ? `Retirer ${psychs[draft[i]].name}` : `Emplacement ${i + 1} vide`,
    onClick: () => toggle(draft[i])
  }, draft[i] ? React.createElement(PinIcon, {
    pin: psychs[draft[i]]
  }) : React.createElement("span", null, "+")))), React.createElement("div", {
    className: "badge-slots"
  }, Array.from({
    length: 16
  }, (_, i) => {
    const id = available[page * 16 + i],
      pin = psychs[id];
    return pin ? React.createElement("button", {
      key: id,
      className: "badge-slot",
      "aria-label": `${pin.name}${equippedBy(profile, name, id) ? ` · Équipé par ${equippedBy(profile, name, id)}` : ""}`,
      disabled: Boolean(equippedBy(profile, name, id)),
      "aria-pressed": draft.includes(id),
      onClick: () => toggle(id)
    }, React.createElement(BadgeArt, {
      pin: pin
    }), equippedBy(profile, name, id) && React.createElement("small", {
      className: "badge-owner"
    }, equippedBy(profile, name, id))) : React.createElement("span", {
      key: i,
      className: "badge-slot",
      "aria-hidden": "true"
    });
  })), inspect && React.createElement("p", {
    className: "badge-info"
  }, React.createElement("b", null, inspect.name.replace(" (Pin)", "")), " \xB7 ", types[inspect.kind], " \xB7 ", inspect.cost, " EN \xB7 ", React.createElement(PinRankInfo, {
    pin: inspect
  }), " ", React.createElement(TypeChips, {
    elements: [inspect.element || badgeElement(inspect)]
  }), equippedBy(profile, name, inspect.id) && React.createElement("span", null, " \xB7 \xC9quip\xE9 par ", equippedBy(profile, name, inspect.id))), draft.length === 3 && React.createElement("p", {
    className: "equipment-help"
  }, "Retire un psych \xE9quip\xE9 pour le remplacer."), !draft.length && React.createElement("p", {
    className: "equipment-help"
  }, "\xC9quipe au moins 1 psych."), React.createElement("nav", {
    "aria-label": "Pages des psychs"
  }, React.createElement("button", {
    disabled: !page,
    onClick: () => setPage(page - 1),
    "aria-label": "Page pr\xE9c\xE9dente"
  }, "\u2039"), React.createElement("span", null, page + 1, " / ", pages), React.createElement("button", {
    disabled: page + 1 >= pages,
    onClick: () => setPage(page + 1),
    "aria-label": "Page suivante"
  }, "\u203A")), React.createElement("div", {
    className: "dialog-actions"
  }, React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Annuler"), React.createElement("button", {
    disabled: !draft.length,
    onClick: () => {
      save(draft);
      setOpen(false);
    }
  }, "Enregistrer"))));
}
function BadgeCatalogue({
  owned,
  embedded = false
}) {
  const Panel = embedded ? InlinePanel : WishDialog;
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const collected = collectionPins.filter(pin => owned.includes(pin.id));
  const pages = Math.ceil(collectionPins.length / 16);
  const move = delta => {
    setPage(page + delta);
    setSelected(null);
  };
  return React.createElement(React.Fragment, null, !embedded && React.createElement("button", {
    onClick: () => {
      setPage(0);
      setSelected(null);
      setOpen(true);
    }
  }, "Catalogue des badges"), (open || embedded) && React.createElement(Panel, {
    className: "badge-book",
    title: "Badges",
    close: () => setOpen(false)
  }, React.createElement("div", {
    className: "badge-counter"
  }, collected.length, " / ", collectionPins.length, " obtenus"), React.createElement("div", {
    className: "badge-slots"
  }, Array.from({
    length: 16
  }, (_, i) => {
    const index = page * 16 + i,
      pin = collected[index];
    if (!pin) return React.createElement("span", {
      key: index,
      className: "badge-slot",
      "aria-hidden": "true"
    });
    return React.createElement("button", {
      key: pin.id,
      className: "badge-slot",
      "aria-label": pin.name,
      "aria-pressed": selected?.id === pin.id,
      onClick: () => setSelected(pin)
    }, React.createElement(BadgeArt, {
      pin: pin
    }));
  })), selected && React.createElement("p", {
    className: "badge-info",
    "aria-live": "polite"
  }, React.createElement("b", null, "#", selected.number, " ", selected.name), " \xB7 ", types[selected.kind], " \xB7 ", selected.cost, " EN \xB7 ", React.createElement(PinRankInfo, {
    pin: selected
  }), " ", React.createElement(TypeChips, {
    elements: [selected.element || badgeElement(selected)]
  })), React.createElement("nav", {
    "aria-label": "Pages du catalogue"
  }, React.createElement("button", {
    disabled: !page,
    "aria-label": "Page pr\xE9c\xE9dente",
    onClick: () => move(-1)
  }, "\u2039"), React.createElement("span", {
    "aria-live": "polite"
  }, page + 1, " / ", pages), React.createElement("button", {
    disabled: page + 1 >= pages,
    "aria-label": "Page suivante",
    onClick: () => move(1)
  }, "\u203A")), !embedded && React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer"), React.createElement("small", null, "Visuels DS \xB7 NightOwl35. Donn\xE9es \xB7 TWEWY Wiki.")));
}
const maxFloor = 100;
function questsFor(p) {
  const badges = new Set(p.pins.filter(id => psychs[id] && (psychs[id].row >= 0 || id.startsWith("signature-")))).size;
  const bestLevel = Math.max(1, ...Object.values(p.xp).map(x => experience(x).level));
  return [...Array.from({
    length: 10
  }, (_, i) => ({
    id: `floor-${(i + 1) * 10}`,
    title: `Atteindre l’étage ${(i + 1) * 10}`,
    progress: p.bestFloor,
    goal: (i + 1) * 10,
    reward: 100
  })), ...Array.from({
    length: Math.floor(collectionPins.length / 10)
  }, (_, i) => ({
    id: `badges-${(i + 1) * 10}`,
    title: `Collectionner ${(i + 1) * 10} badges`,
    progress: badges,
    goal: (i + 1) * 10,
    reward: 20
  })), ...[2, 4, 6].map(n => ({
    id: `recruits-${n}`,
    title: `Débloquer ${n} personnages`,
    progress: p.owned.length,
    goal: n,
    reward: n * 25
  })), ...[5, 10, 25].map(n => ({
    id: `level-${n}`,
    title: `Monter un personnage au niveau ${n}`,
    progress: bestLevel,
    goal: n,
    reward: n * 10
  })), {
    id: "awaken-1",
    title: "Éveiller 1 personnage",
    progress: p.awakened.length,
    goal: 1,
    reward: 150
  }];
}
function applyPcMissionCoins(p, scores) {
  const paid = {
    ...p.pcMissionCoins
  };
  let coins = 0;
  for (const [day, score] of Object.entries(scores)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(score) || score < 0 || score > 1000000) continue;
    const total = Math.floor(score / 10),
      previous = paid[day] || 0;
    if (total > previous) {
      coins += total - previous;
      paid[day] = total;
    }
  }
  return coins ? {
    ...p,
    coins: p.coins + coins,
    pcMissionCoins: paid
  } : p;
}
function claimQuests(p, ids) {
  const ready = questsFor(p).filter(q => ids.includes(q.id) && q.progress >= q.goal && !p.claimedQuests.includes(q.id));
  return {
    ...p,
    coins: p.coins + ready.reduce((sum, q) => sum + q.reward, 0),
    claimedQuests: [...p.claimedQuests, ...ready.map(q => q.id)]
  };
}
function QuestMenu({
  profile,
  save,
  embedded = false
}) {
  const Panel = embedded ? InlinePanel : WishDialog;
  const [missionStatus, setMissionStatus] = useState(() => window.ChibiGameSync?.missionState || "idle");
  useEffect(() => {
    const update = () => setMissionStatus(window.ChibiGameSync?.missionState || "idle");
    window.addEventListener("chibi:mission-scores", update);
    return () => window.removeEventListener("chibi:mission-scores", update);
  }, []);
  const [open, setOpen] = useState(false);
  const quests = questsFor(profile),
    ready = quests.filter(q => q.progress >= q.goal && !profile.claimedQuests.includes(q.id));
  const [category, setCategory] = useState("floor");
  return React.createElement(React.Fragment, null, !embedded && React.createElement("button", {
    onClick: () => setOpen(true)
  }, "Qu\xEAtes", ready.length ? ` · ${ready.length}` : ""), (open || embedded) && React.createElement(Panel, {
    className: "quest-menu",
    title: "Qu\xEAtes",
    close: () => setOpen(false)
  }, React.createElement("p", null, "R\xE9compenses uniques \xB7 Progression r\xE9troactive"), profile.floorRecoveryAvailable && React.createElement("button", {
    className: "floor-recovery",
    onClick: () => save(p => ({
      ...p,
      bestFloor: Math.max(p.bestFloor, 10),
      floorRecoveryAvailable: false
    }))
  }, "Rattraper mon ancien \xE9tage 10"), React.createElement("div", {
    className: "quest-tabs"
  }, [["floor", "Étages"], ["badges", "Collection"], ["other", "Personnages"], ["pc", "Missions PC"]].map(([id, name]) => React.createElement("button", {
    key: id,
    "aria-pressed": category === id,
    onClick: () => setCategory(id)
  }, name))), category === "pc" ? React.createElement("div", {
    className: "quest-list pc-mission-coins"
  }, React.createElement("p", null, "Score PC \xF7 10 = pi\xE8ces \xB7 Cr\xE9dit automatique"), missionStatus === "error" && React.createElement("p", {
    role: "alert"
  }, "Missions PC indisponibles. Les cr\xE9dits pr\xE9c\xE9dents sont conserv\xE9s ; v\xE9rifie la connexion et les r\xE8gles Firebase."), React.createElement("p", null, "Total re\xE7u : ", Object.values(profile.pcMissionCoins).reduce((a, b) => a + b, 0), " pi\xE8ces"), Object.keys(profile.pcMissionCoins).length ? Object.entries(profile.pcMissionCoins).sort(([a], [b]) => b.localeCompare(a)).map(([day, coins]) => React.createElement("article", {
    key: day
  }, React.createElement("b", null, day.split("-").reverse().join("/")), React.createElement("span", null, coins, " pi\xE8ces cr\xE9dit\xE9es"))) : React.createElement("p", null, "Ouvre le jeu connect\xE9 au m\xEAme compte que sur PC pour r\xE9cup\xE9rer tes missions pass\xE9es.")) : React.createElement("div", {
    className: "quest-list"
  }, quests.filter(q => category === "other" ? !/^(floor|badges)-/.test(q.id) : q.id.startsWith(category + "-")).map(q => {
    const claimed = profile.claimedQuests.includes(q.id),
      done = q.progress >= q.goal;
    return React.createElement("article", {
      key: q.id
    }, React.createElement("div", null, React.createElement("b", null, q.title), React.createElement("small", null, Math.min(q.goal, q.progress), " / ", q.goal, " \xB7 ", q.reward, " pi\xE8ces"), React.createElement("progress", {
      max: q.goal,
      value: Math.min(q.goal, q.progress),
      "aria-label": q.title
    })), React.createElement("button", {
      disabled: claimed || !done,
      onClick: () => save(p => claimQuests(p, [q.id]))
    }, claimed ? "Récupéré" : "Récupérer"));
  })), React.createElement("div", {
    className: "dialog-actions"
  }, React.createElement("button", {
    disabled: !ready.length,
    onClick: () => save(p => claimQuests(p, questsFor(p).map(q => q.id)))
  }, "Tout r\xE9cup\xE9rer \xB7 ", ready.reduce((sum, q) => sum + q.reward, 0), " pi\xE8ces"), !embedded && React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer"))));
}
function applyCetrucRecovery(p, identity) {
  if (!identity || !/^\d{1,25}$/.test(identity.id) || identity.name.normalize("NFKC").trim().toLocaleLowerCase("fr-FR") !== "cetruc") return p;
  const flag = `cetruc-tier-5-v2-${identity.id}`;
  if (p.specialRunRecoveries.includes(flag) || !p.hasPlayed) return p;
  const marked = [...p.specialRunRecoveries, flag];
  if (p.run?.status === "complete" || p.run?.status === "active" && p.run.wave >= 41) return {
    ...p,
    specialRunRecoveries: marked
  };
  if (p.equipped.filter(Boolean).length !== 2 || !p.equipped.every(name => p.loadout[name]?.length)) return p;
  const base = newRun(p),
    run = {
      ...base,
      wave: 41,
      enemies: makeWave(41, base.id)
    };
  return {
    ...p,
    run,
    bestFloor: Math.max(p.bestFloor, 41),
    specialRunRecoveries: marked
  };
}
function combatFingerprint(p) {
  return JSON.stringify([p.owned, p.equipped, p.loadout, p.xp, p.awakened, p.levels, p.run ? [p.run.id, p.run.seq, p.run.status] : null, p.eventRun ? [p.eventRun.run.id, p.eventRun.run.seq] : null]);
}
function InlinePanel({
  title,
  children,
  className = ""
}) {
  return React.createElement("section", {
    className: `hub-panel ${className}`
  }, React.createElement("h2", null, title), children);
}
function gameFullscreen() {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: "chibi:fullscreen",
      action: "toggle"
    }, location.protocol === "file:" ? "*" : location.origin);
    return;
  }
  if (document.fullscreenElement) document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(() => {});
}
const hubScreens = [["home", "Accueil", "⌂"], ["team", "Team", "♟"], ["summon", "Invocations", "✦"], ["collection", "Collection", "▦"], ["menu", "Menu", "☰"]];
function GameHub({
  profile,
  screen,
  navigate,
  children
}) {
  useMusic("hub");
  const content = React.useRef(null);
  useEffect(() => {
    content.current?.scrollTo({
      top: 0
    });
  }, [screen]);
  return React.createElement("div", {
    className: "game-hub game-shell"
  }, React.createElement("header", {
    className: "hub-header"
  }, React.createElement("button", {
    className: "hub-brand",
    onClick: () => navigate("home"),
    "aria-label": "Accueil du jeu"
  }, "TWEWY ", React.createElement("span", null, "REAPERS\u2019 RUN")), React.createElement("div", {
    className: "hub-wallet"
  }, React.createElement("span", {
    "aria-label": `${profile.coins} pièces`
  }, React.createElement(Icon, {
    name: "coin"
  }), profile.coins.toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")), React.createElement("small", null, "\u2726 ", profile.freeWishes, " gratuits")), React.createElement(SoundToggle, null), React.createElement("button", {
    className: "hub-fullscreen",
    onClick: gameFullscreen,
    "aria-label": "Basculer le plein \xE9cran"
  }, "\u26F6")), React.createElement("div", {
    className: "hub-content",
    ref: content
  }, React.createElement("div", {
    className: "hub-screen",
    key: screen
  }, children)), React.createElement("nav", {
    className: "hub-nav",
    "aria-label": "Navigation du jeu"
  }, hubScreens.map(([id, label, icon]) => React.createElement("button", {
    key: id,
    "aria-current": screen === id ? "page" : undefined,
    onClick: () => navigate(id)
  }, React.createElement("span", {
    "aria-hidden": "true"
  }, icon), React.createElement("b", null, label)))));
}
function CharacterDossier({
  fighter,
  profile,
  base = false,
  rate
}) {
  const owned = profile.owned.includes(fighter.name),
    reference = base || !owned;
  const stats = trained(fighter, reference ? 0 : profile.xp[fighter.name] || 0, !reference && profile.awakened.includes(fighter.name), reference ? 0 : profile.copies[fighter.name] || 0);
  const rank = reference ? 0 : profile.levels[fighter.name] || 0,
    pin = psychs[basePsych[fighter.name]];
  return React.createElement("article", {
    className: "character-dossier",
    style: {
      "--character-accent": fighter.accent
    }
  }, React.createElement("header", null, React.createElement("small", null, fighter.role), React.createElement("h3", null, fighter.name), React.createElement(TypeChips, {
    elements: characterElements[fighter.name]
  })), React.createElement("div", {
    className: "dossier-art"
  }, React.createElement("span", {
    className: "dossier-orbit",
    "aria-hidden": "true"
  }), React.createElement(SpritePreview, {
    fighter: fighter,
    maximumScale: 2.6
  }), React.createElement(RankBadge, {
    level: rank
  })), React.createElement("div", {
    className: "dossier-stats"
  }, React.createElement("p", null, reference ? "Stats de base · Niveau 1 · Rang E" : `Ta progression · Niveau ${stats.level} · Rang ${rank === 5 ? "étoile" : ranks[rank]}`), React.createElement("dl", null, [["PV", stats.maxHp], ["ATK", stats.atk], ["ATK SPE", stats.mag], ["SPE", stats.speed]].map(([name, value]) => React.createElement("div", {
    key: name
  }, React.createElement("dt", null, name), React.createElement("dd", null, value)))), React.createElement("div", {
    className: "dossier-psych"
  }, React.createElement(PinIcon, {
    pin: pin
  }), React.createElement("span", null, React.createElement("small", null, "Psych de d\xE9part"), React.createElement("b", null, pin.name.replace(" (Pin)", "")))), rate !== undefined && React.createElement("p", {
    className: "dossier-rate"
  }, "Prochain v\u0153u \xB7 ", (rate * 100).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    maximumFractionDigits: 3
  }), " %"), !reference && React.createElement("p", null, profile.copies[fighter.name] || 0, " / 5 doublons", profile.awakened.includes(fighter.name) ? " · Éveillé" : "")));
}
function CharacterCollection({
  profile,
  awaken
}) {
  const [onlyOwned, setOnlyOwned] = useState(false),
    [selected, setSelected] = useState(null);
  return React.createElement("section", {
    className: "hub-panel character-collection"
  }, React.createElement("h1", null, "Personnages"), React.createElement("p", null, profile.owned.length, " / ", characterRoster.length, " d\xE9bloqu\xE9s"), React.createElement("div", {
    className: "hub-tabs"
  }, React.createElement("button", {
    "aria-pressed": !onlyOwned,
    onClick: () => setOnlyOwned(false)
  }, "Tous"), React.createElement("button", {
    "aria-pressed": onlyOwned,
    onClick: () => setOnlyOwned(true)
  }, "D\xE9bloqu\xE9s")), React.createElement("div", {
    className: "character-grid"
  }, characterRoster.filter(f => !onlyOwned || profile.owned.includes(f.name)).map(f => {
    const owned = profile.owned.includes(f.name);
    return React.createElement("button", {
      key: f.name,
      className: owned ? "" : "not-owned",
      onClick: () => setSelected(f),
      "aria-label": `Fiche de ${f.name}${owned ? "" : " · Non obtenu"}`
    }, React.createElement(HudPortrait, {
      fighter: f
    }), React.createElement("b", null, f.name), React.createElement("small", null, owned ? `Niv. ${experience(profile.xp[f.name] || 0).level} · ${ranks[profile.levels[f.name] || 0]}` : "Non obtenu"));
  })), selected && React.createElement(WishDialog, {
    className: "character-sheet-dialog",
    title: `Fiche · ${selected.name}`,
    close: () => setSelected(null)
  }, React.createElement(CharacterDossier, {
    fighter: selected,
    profile: profile
  }), profile.copies[selected.name] === 5 && !profile.awakened.includes(selected.name) && React.createElement("button", {
    onClick: () => awaken(selected.name)
  }, "\xC9veiller \xB7 +20 PV"), React.createElement("button", {
    onClick: () => setSelected(null)
  }, "Retour \xE0 la collection")));
}
function eventWave(boss, stage, seed) {
  if (stage < 3) {
    const scale = difficultyAt(100);
    return makeWave(99, seed + "-" + boss + "-" + stage).slice(0, stage + 1).map((enemy, i) => {
      const spec = enemyCatalog[enemy.kind],
        hp = Math.max(1500, Math.round(spec.hp * scale.hp));
      return {
        ...enemy,
        id: stage * 10 + i,
        level: 100,
        maxHp: hp,
        hp,
        attack: Math.max(150, Math.round(spec.attack * scale.attack)),
        speed: Math.max(90, (spec.speed ?? 18) + scale.speed),
        xp: 0
      };
    });
  }
  const hero = characterRoster.find(f => f.name === boss),
    stats = bases[boss],
    hp = (hero.maxHp + 99 * 5) * 8;
  return [{
    id: 30,
    kind: "event-" + boss,
    name: boss,
    hp,
    maxHp: hp,
    attack: Math.round((Math.max(stats[0], stats[1]) + 198) * 1.35),
    speed: stats[2] + 115,
    level: 100,
    boss: true,
    trait: "berserk",
    xp: 0
  }];
}
function readEvent(raw, owned, copies, awake) {
  if (!raw || !characterRoster.some(f => f.name === raw.boss)) return null;
  const run = validRun(raw.run, owned, copies, awake);
  if (!run || run.wave > 3 || run.enemies.some(e => e.level !== 100) || run.wave === 3 && !run.enemies.every(e => e.kind === "event-" + raw.boss)) return null;
  return {
    boss: raw.boss,
    run,
    prize: ["character", "pin"].includes(raw.prize) ? raw.prize : "none"
  };
}
function eventCheckpoint(p, snapshot) {
  const active = p.eventRun;
  if (!active || active.run.status !== "active" || snapshot.id !== active.run.id || snapshot.seq <= active.run.seq) return p;
  let prize = "none",
    next = p;
  if (snapshot.wave === 3 && snapshot.status === "complete" && snapshot.enemies.every(e => e.hp === 0)) {
    const roll = Math.random(),
      name = active.boss;
    prize = roll < .01 ? "character" : roll < .06 ? "pin" : "none";
    if (prize === "pin") next = {
      ...p,
      pins: [...new Set([...p.pins, signaturePins[name].id])]
    };
    if (prize === "character") {
      const copies = p.owned.includes(name) ? Math.min(5, (p.copies[name] || 0) + 1) : 0;
      next = {
        ...p,
        owned: [...new Set([...p.owned, name])],
        copies: {
          ...p.copies,
          [name]: copies
        },
        levels: {
          ...p.levels,
          [name]: copies
        }
      };
    }
  }
  return {
    ...next,
    eventRun: {
      ...active,
      run: snapshot,
      prize
    }
  };
}
function EventHall({
  profile,
  start,
  navigate,
  abandon
}) {
  const rail = React.useRef(null),
    [confirm, setConfirm] = useState(false);
  const current = profile.eventRun,
    active = current?.run.status === "active" ? current : null;
  const ready = profile.equipped.filter(Boolean).length === 2 && profile.equipped.every(n => profile.loadout[n]?.length) && profile.equipped.some(n => profile.loadout[n]?.some(offensive));
  function scroll(direction) {
    const el = rail.current;
    if (!el) return;
    const cards = Array.from(el.children);
    const here = cards.reduce((a, b) => Math.abs(b.offsetLeft - el.scrollLeft) < Math.abs(a.offsetLeft - el.scrollLeft) ? b : a);
    el.scrollTo({
      left: cards[Math.max(0, Math.min(cards.length - 1, cards.indexOf(here) + direction))].offsetLeft,
      behavior: "smooth"
    });
  }
  return React.createElement("section", {
    className: "hub-panel event-hall"
  }, React.createElement("header", null, React.createElement("h1", null, "\xC9v\xE9nement"), React.createElement("div", null, React.createElement("button", {
    "aria-label": "Pr\xE9c\xE9dent",
    onClick: () => scroll(-1)
  }, "\u2039"), React.createElement("button", {
    "aria-label": "Suivant",
    onClick: () => scroll(1)
  }, "\u203A"))), React.createElement("p", null, "2 vagues puis le boss \xB7 Tous les ennemis niveau 100"), active && React.createElement("div", {
    className: "event-resume"
  }, React.createElement("button", {
    onClick: () => start(active.boss)
  }, "Reprendre \xB7 ", active.boss, " \xB7 ", active.run.wave, "/3"), React.createElement("button", {
    onClick: () => setConfirm(true)
  }, "Abandonner")), confirm && React.createElement(WishDialog, {
    title: "Abandonner cet \xE9v\xE9nement ?",
    close: () => setConfirm(false)
  }, React.createElement("button", {
    onClick: () => setConfirm(false)
  }, "Annuler"), React.createElement("button", {
    onClick: () => {
      abandon();
      setConfirm(false);
    }
  }, "Confirmer")), !ready && !active && React.createElement("button", {
    onClick: () => navigate("team")
  }, "Pr\xE9parer le duo"), React.createElement("div", {
    className: "event-rail",
    ref: rail,
    "aria-label": "\xC9v\xE9nements"
  }, characterRoster.map(hero => React.createElement("article", {
    key: hero.name
  }, React.createElement("div", {
    className: "event-preview"
  }, React.createElement(SpritePreview, {
    fighter: hero,
    maximumScale: 2.4
  })), React.createElement("h2", null, hero.name), React.createElement(TypeChips, {
    elements: characterElements[hero.name]
  }), React.createElement("p", null, React.createElement("b", null, "5 %"), " \xB7 ", signaturePins[hero.name].name, React.createElement("br", null), React.createElement("b", null, "1 %"), " \xB7 ", hero.name), React.createElement("button", {
    disabled: active ? active.boss !== hero.name : !ready,
    onClick: () => start(hero.name)
  }, active?.boss === hero.name ? "Reprendre" : "Défier")))));
}
function HubHome({
  profile,
  navigate
}) {
  const names = profile.equipped.filter(Boolean),
    duo = (names.length ? names : ["NEKU"]).map(name => characterRoster.find(f => f.name === name));
  const rewards = questsFor(profile).filter(q => q.progress >= q.goal && !profile.claimedQuests.includes(q.id)).length;
  const modeRail = React.useRef(null);
  const moveMode = direction => {
    const rail = modeRail.current;
    if (!rail) return;
    const cards = Array.from(rail.children);
    if (!cards.length) return;
    const current = cards.reduce((nearest, card, index) => Math.abs(card.offsetLeft - rail.scrollLeft) < Math.abs(cards[nearest].offsetLeft - rail.scrollLeft) ? index : nearest, 0);
    const next = (current + direction + cards.length) % cards.length;
    rail.scrollTo({
      left: cards[next].offsetLeft,
      behavior: "smooth"
    });
  };
  return React.createElement("section", {
    className: "hub-home"
  }, React.createElement("div", {
    className: "hub-home-heading"
  }, React.createElement("small", null, "SHIBUYA \xB7 REAPERS\u2019 GAME"), React.createElement("h1", null, "\xC0 toi de jouer."), React.createElement("span", null, "Record \xB7 \xC9tage ", profile.bestFloor, " / 100")), React.createElement("div", {
    className: "hub-home-stage"
  }, React.createElement("div", {
    className: "hub-home-halo",
    "aria-hidden": "true"
  }), duo.map(f => React.createElement(SpritePreview, {
    key: f.name,
    fighter: f,
    maximumScale: 2.5
  }))), React.createElement("div", {
    className: "home-mode-switcher"
  }, React.createElement("button", {
    className: "home-mode-arrow",
    "aria-label": "Voir le mode pr\xE9c\xE9dent",
    onClick: () => moveMode(-1)
  }, "\u2039"), React.createElement("div", {
    className: "home-modes",
    ref: modeRail,
    "aria-label": "Choisir un mode de jeu"
  }, React.createElement("button", {
    className: "hub-play home-mode-card",
    onClick: () => navigate("roguelike")
  }, React.createElement("small", null, "MODE DE JEU"), React.createElement("b", null, "Roguelike"), React.createElement("span", null, "Gravis les 100 \xE9tages")), React.createElement("button", {
    className: "hub-play home-mode-card",
    onClick: () => navigate("events")
  }, React.createElement("small", null, "MODE DE JEU"), React.createElement("b", null, "\xC9v\xE9nement"), React.createElement("span", null, "D\xE9fie les personnages"))), React.createElement("button", {
    className: "home-mode-arrow",
    "aria-label": "Voir le mode suivant",
    onClick: () => moveMode(1)
  }, "\u203A")), React.createElement("div", {
    className: "hub-shortcuts"
  }, React.createElement("button", {
    onClick: () => navigate("quests")
  }, React.createElement("span", null, "\u25C7"), React.createElement("b", null, "Qu\xEAtes"), React.createElement("small", null, rewards ? `${rewards} récompense${rewards > 1 ? "s" : ""}` : "Ta progression")), React.createElement("button", {
    onClick: () => navigate("summon")
  }, React.createElement("span", null, "\u2726"), React.createElement("b", null, "Invocations"), React.createElement("small", null, profile.freeWishes, " v\u0153ux gratuits")), React.createElement("button", {
    onClick: () => navigate("collection")
  }, React.createElement("span", null, "\u25A6"), React.createElement("b", null, "Collection"), React.createElement("small", null, profile.owned.length, " personnages"))));
}
function AwakeningPanel({
  profile,
  awaken
}) {
  const owned = characterRoster.filter(f => profile.owned.includes(f.name));
  return React.createElement("section", {
    className: "awakening-panel"
  }, React.createElement("header", null, React.createElement("h2", null, "\xC9veil"), React.createElement("p", null, "Obtiens 5 doublons pour \xE9veiller un personnage et d\xE9bloquer son bonus permanent.")), !owned.length ? React.createElement("p", null, "D\xE9bloque des personnages dans les invocations pour suivre leur \xE9veil.") : React.createElement("div", {
    className: "awakening-list"
  }, owned.map(fighter => {
    const copies = Math.min(5, profile.copies[fighter.name] || 0),
      awakened = profile.awakened.includes(fighter.name);
    return React.createElement("article", {
      key: fighter.name
    }, React.createElement(HudPortrait, {
      fighter: fighter
    }), React.createElement("div", null, React.createElement("b", null, fighter.name), React.createElement("small", null, awakened ? "Éveillé · bonus actif" : `${copies} / 5 doublons`), React.createElement("div", {
      className: "awakening-ranks",
      "aria-label": `${fighter.name} : ${copies} doublons`
    }, ranks.map((_, rank) => React.createElement("span", {
      key: rank,
      className: rank <= copies ? "" : "locked"
    }, React.createElement(RankBadge, {
      level: rank
    }))))), !awakened && React.createElement("button", {
      disabled: copies < 5,
      onClick: () => awaken(fighter.name)
    }, copies < 5 ? `${5 - copies} manquant${5 - copies > 1 ? "s" : ""}` : "Éveiller"));
  })));
}
function RoguelikeLaunch({
  profile,
  navigate,
  start,
  resume,
  abandon
}) {
  const [confirm, setConfirm] = useState(false),
    fighters = profile.equipped.filter(Boolean),
    ready = fighters.length === 2 && fighters.every(name => profile.loadout[name]?.length) && fighters.some(name => profile.loadout[name]?.some(offensive)),
    run = profile.run?.status === "active" ? profile.run : null;
  return React.createElement("section", {
    className: "hub-panel roguelike-launch"
  }, React.createElement("h1", null, "Roguelike"), React.createElement("p", null, "Choisis ton duo et ses psychs dans Team, puis tente l\u2019ascension de 100 \xE9tages."), React.createElement("div", {
    className: "roguelike-party"
  }, fighters.map(name => {
    const fighter = characterRoster.find(f => f.name === name);
    return React.createElement("article", {
      key: name
    }, React.createElement("div", {
      className: "roguelike-fighter-art"
    }, React.createElement(SpritePreview, {
      fighter: fighter,
      maximumScale: 2.25
    })), React.createElement("b", null, name), React.createElement(TypeChips, {
      elements: characterElements[name]
    }), React.createElement("small", null, profile.loadout[name]?.length || 0, " psych(s) \xE9quip\xE9s"));
  }), fighters.length < 2 && React.createElement("p", null, "Il manque ", 2 - fighters.length, " personnage(s) dans ta Team.")), !ready && !run && React.createElement("button", {
    onClick: () => navigate("team")
  }, "Pr\xE9parer Team"), run ? React.createElement(React.Fragment, null, React.createElement("p", {
    className: "run-status"
  }, "Run sauvegard\xE9e \xB7 \xC9tage ", run.wave, " \xB7 Palier ", difficultyAt(run.wave).tier, " \xB7 ", run.team.map(f => f.name).join(" / ")), React.createElement("div", {
    className: "dialog-actions"
  }, React.createElement("button", {
    className: "pull-button",
    onClick: resume
  }, "Reprendre l\u2019\xE9tage ", run.wave), React.createElement("button", {
    onClick: () => setConfirm(true)
  }, "Abandonner la run"))) : React.createElement("button", {
    className: "pull-button",
    disabled: !ready,
    onClick: start
  }, "Commencer le roguelike"), profile.run?.status === "lost" && React.createElement("p", null, "Run perdue \xB7 Une nouvelle run commence \xE0 l\u2019\xE9tage 1."), confirm && React.createElement(WishDialog, {
    title: "Abandonner la run ?",
    close: () => setConfirm(false)
  }, React.createElement("p", null, "La reprise de cette run sera supprim\xE9e. Tes personnages, tes badges et tes r\xE9compenses d\xE9j\xE0 gagn\xE9es sont conserv\xE9s."), React.createElement("div", {
    className: "dialog-actions"
  }, React.createElement("button", {
    onClick: () => setConfirm(false)
  }, "Annuler"), React.createElement("button", {
    onClick: () => {
      abandon();
      setConfirm(false);
    }
  }, "Abandonner"))));
}
function HubMenu({
  profile,
  navigate
}) {
  return React.createElement("section", {
    className: "hub-panel"
  }, React.createElement("h1", null, "Menu"), React.createElement("div", {
    className: "hub-menu-links"
  }, [["settings", "Paramètres", "Musique et effets sonores"], ["bestiary", "Bestiaire", "Créatures, boss, types et comportements"], ["quests", "Quêtes", "Étages, collection et missions PC"], ["journal", "Historique des vœux", "Résultats, coûts et soldes"], ["collection", "Collection", "Personnages et badges"], ["team", "Team & psychs", "Duo, psychs et éveils"], ["roguelike", "Roguelike", "Lancer ou reprendre une run"]].map(([id, title, desc]) => React.createElement("button", {
    key: id,
    onClick: () => navigate(id)
  }, React.createElement("b", null, title), React.createElement("small", null, desc), React.createElement("span", {
    "aria-hidden": "true"
  }, "\u203A")))), React.createElement("section", {
    className: "hub-help"
  }, React.createElement("h2", null, "Guide du jeu"), React.createElement("p", null, "Forme une Team de 2 personnages et \xE9quipe jusqu\u2019\xE0 3 psychs chacun. Choisis toutes les actions, puis lance le tour : les portraits en haut indiquent l\u2019ordre de vitesse. Touche 2 fois un ennemi pour consulter ses stats."), React.createElement("p", null, "Chaque vague vaincue rapporte 5 pi\xE8ces. Les invocations ont 10 % de chances de donner un personnage et chaque 10e v\u0153u en garantit un. Les taux d\xE9taill\xE9s et les fiches sont accessibles sur chaque portail."), React.createElement("p", null, "Les psychs ne peuvent pas \xEAtre partag\xE9s entre partenaires. Les doublons font progresser le rang d\u2019un personnage jusqu\u2019\xE0 l\u2019\xE9toile, \xE0 5 doublons.")));
}
function BestiaryMenu() {
  const [filter, setFilter] = useState("known"),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(null);
  const entries = ffbeBestiary.filter(m => filter === "reserve" ? !m.enabled : m.enabled && (filter === "boss" ? m.boss : filter === "regular" ? !m.boss : true));
  const pages = Math.max(1, Math.ceil(entries.length / 12));
  return React.createElement("section", {
    className: "hub-panel monster-book"
  }, React.createElement("h1", null, "Bestiaire"), React.createElement("p", null, ffbeBestiary.filter(m => m.enabled).length, " entr\xE9es identifi\xE9es \xB7 ", ffbeBestiary.filter(m => !m.enabled).length, " en r\xE9serve \xB7 Animations idle uniquement"), React.createElement("div", {
    className: "hub-tabs monster-filters"
  }, [["known", "Tous"], ["regular", "Créatures"], ["boss", "Boss"], ["reserve", "À identifier"]].map(([id, label]) => React.createElement("button", {
    key: id,
    "aria-pressed": filter === id,
    onClick: () => {
      setFilter(id);
      setPage(0);
    }
  }, label))), React.createElement("div", {
    className: "monster-grid"
  }, entries.slice(page * 12, page * 12 + 12).map(m => React.createElement("button", {
    key: m.id,
    onClick: () => setSelected(m)
  }, React.createElement(EnemySprite, {
    kind: m.id,
    boss: false
  }), React.createElement("b", null, m.name || `FFBE #${m.sourceId}`), React.createElement("small", null, m.enabled ? m.boss ? "Boss" : "Créature" : "Nom à identifier")))), React.createElement("nav", {
    className: "hub-tabs",
    "aria-label": "Pages du bestiaire"
  }, React.createElement("button", {
    disabled: !page,
    onClick: () => setPage(page - 1),
    "aria-label": "Page pr\xE9c\xE9dente"
  }, "\u2039"), React.createElement("span", null, page + 1, " / ", pages), React.createElement("button", {
    disabled: page + 1 >= pages,
    onClick: () => setPage(page + 1),
    "aria-label": "Page suivante"
  }, "\u203A")), selected && React.createElement(WishDialog, {
    title: selected.name || `FFBE #${selected.sourceId}`,
    close: () => setSelected(null)
  }, React.createElement("div", {
    className: "monster-preview"
  }, React.createElement(EnemySprite, {
    kind: selected.id,
    boss: selected.boss
  })), React.createElement(TypeChips, {
    elements: selected.elements
  }), React.createElement("p", null, "PV de base ", selected.hp, " \xB7 ATK ", selected.attack, " \xB7 SPE ", selected.speed), React.createElement("p", null, enemyTraitNames[selected.trait]), React.createElement("p", null, selected.enabled ? `Apparaît à partir du palier ${Math.max(1, selected.tier + 1 - (selected.boss ? 2 : 0))}. Ses stats augmentent avec l’étage.` : "Cette silhouette reste hors des rencontres tant que son nom n’est pas identifié."), React.createElement("small", null, "Identifiant source \xB7 ", selected.sourceId), React.createElement("button", {
    onClick: () => setSelected(null)
  }, "Fermer")));
}
function App() {
  useEffect(gameSound.connect, []);
  const [profile, displayProfile] = useState(loadProfile);
  const profileRef = React.useRef(profile);
  profileRef.current = profile;
  const runSignature = React.useRef(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [battleLoadout, setBattleLoadout] = useState({});
  const [resumeRun, setResumeRun] = useState(null);
  const [party, setParty] = useState(null);
  const [result, setResult] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [portal, setPortal] = useState("shibuya");
  const [phase, setPhase] = useState("ready");
  const turning = React.useRef(false);
  const [screen, setScreen] = useState(gachaView ? "summon" : "home");
  const [rateFighter, setRateFighter] = useState(null);
  const navigate = next => {
    if (turning.current) return;
    setRateFighter(null);
    setPhase("ready");
    setScreen(next);
  };
  const navigationRef = React.useRef({
    party,
    navigate
  });
  navigationRef.current = {
    party,
    navigate
  };
  useEffect(() => {
    const receive = event => {
      if (event.source !== window.parent || event.origin !== location.origin && !(location.protocol === "file:" && event.origin === "null") || event.data?.type !== "chibi:game-navigate" || navigationRef.current.party) return;
      if (["home", "team", "summon", "collection", "quests", "journal", "bestiary", "menu"].includes(event.data.screen)) navigationRef.current.navigate(event.data.screen);
    };
    window.addEventListener("message", receive);
    if (window.parent !== window) window.parent.postMessage({
      type: "chibi:game-ready"
    }, location.protocol === "file:" ? "*" : location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
      if (saved && (!saved.xp || Object.values(saved.loadout || {}).some(value => !Array.isArray(value)))) localStorage.setItem(profileKey, JSON.stringify(loadProfile()));
    } catch {
      setSaveError(true);
    }
  }, []);
  useEffect(() => {
    const sync = event => {
      if (event.key === profileKey) displayProfile(loadProfile());
    };
    const cloudLoaded = () => {
      const incoming = loadProfile(),
        changed = combatFingerprint(incoming) !== combatFingerprint(profileRef.current);
      if (runSignature.current !== null && combatFingerprint(incoming) !== runSignature.current || changed) {
        setParty(null);
        setResult([]);
        setPhase("ready");
        turning.current = false;
        runSignature.current = null;
      }
      displayProfile(incoming);
    };
    window.addEventListener("chibi:save-loaded", cloudLoaded);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("chibi:save-loaded", cloudLoaded);
    };
  }, []);
  const setProfile = update => {
    if (window.ChibiGameSync && !window.ChibiGameSync.state.ready) return;
    let current = profile;
    try {
      if (localStorage.getItem(profileKey)) current = loadProfile();
    } catch {}
    const next = assignBasePsychs(update(accrueDailyWishes(applyCetrucRecovery(current, window.ChibiGameSync?.identity))));
    if (JSON.stringify(next) === JSON.stringify(current) && localStorage.getItem(profileKey) === JSON.stringify(next)) return;
    try {
      localStorage.setItem(profileKey, JSON.stringify(next));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
    if (runSignature.current !== null && runSignature.current === combatFingerprint(current)) runSignature.current = combatFingerprint(next);
    displayProfile(next);
    window.ChibiGameSync?.save(next);
  };
  useEffect(() => {
    const credit = () => setProfile(p => accrueDailyWishes(p));
    credit();
    const timer = window.setInterval(credit, 60000);
    window.addEventListener("focus", credit);
    document.addEventListener("visibilitychange", credit);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", credit);
      document.removeEventListener("visibilitychange", credit);
    };
  }, []);
  useEffect(() => {
    const credit = () => {
      const scores = window.ChibiGameSync?.missionScores;
      if (scores) setProfile(p => applyPcMissionCoins(p, scores));
    };
    window.addEventListener("chibi:mission-scores", credit);
    credit();
    return () => window.removeEventListener("chibi:mission-scores", credit);
  }, []);
  const wishCost = (p, n = quantity) => wishQuote(p, n).cost;
  useEffect(() => {
    const prune = event => {
      const ids = new Set(event?.detail?.ids || window.ChibiGameSync?.archivedWishIds || []);
      if (ids.size) setProfile(p => ({
        ...p,
        wishEvents: p.wishEvents.filter(e => !ids.has(e.id))
      }));
    };
    window.addEventListener("chibi:wish-archived", prune);
    prune();
    return () => window.removeEventListener("chibi:wish-archived", prune);
  }, []);
  const price = wishCost(profile);
  const openWish = (id, count) => {
    setQuantity(count);
    setPortal(id);
    setPhase("confirm");
  };
  const pool = portalPool(portal, profile);
  const guaranteed = profile.wishStep === 9;
  const percent = v => v.toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    style: "percent",
    maximumFractionDigits: 3
  });
  const portalName = portal === "shibuya" ? "First Week #1" : portals[portal];
  const closeDialog = () => setPhase("ready");
  const recruit = (id, count) => {
    if (turning.current || historyFull(profile)) return;
    const draws = [];
    setProfile(p => {
      if (historyFull(p) || p.coins !== profile.coins || wishCost(p, count) !== price || p.coins < price) return p;
      const quote = wishQuote(p, count);
      const next = {
        ...p,
        wishesMade: p.wishesMade + count,
        freeWishes: p.freeWishes - quote.free,
        freeWishSpent: p.freeWishSpent + quote.free,
        freeWishDaySpent: p.freeWishDaySpent + quote.free,
        pins: [...p.pins],
        coins: p.coins - quote.cost,
        owned: [...p.owned],
        levels: {
          ...p.levels
        },
        copies: {
          ...p.copies
        }
      };
      for (let i = 0; i < count; i++) {
        next.wishStep = (next.wishStep + 1) % 10;
        if (next.wishStep !== 0 && Math.random() >= characterChance) {
          const pin = pick(pinList);
          if (!next.pins.includes(pin.id)) next.pins.push(pin.id);
          draws.push({
            pin
          });
          continue;
        }
        const name = pick(portalPool(id, next)).name;
        if (next.owned.includes(name)) next.copies[name] = Math.min(5, (next.copies[name] || 0) + 1);else {
          next.owned.push(name);
          next.copies[name] = 0;
        }
        next.levels[name] = next.copies[name];
        draws.push({
          name,
          rank: next.levels[name],
          copies: next.copies[name]
        });
      }
      next.wishEvents = [...p.wishEvents, makeWishEvent(p, next, id, count, quote.free, quote.cost, draws)];
      return assignBasePsychs(next);
    });
    if (draws.length) {
      turning.current = true;
      setPortal(id);
      setQuantity(count);
      setResult(draws);
      setPhase("crank");
    }
  };
  const awaken = name => setProfile(p => p.copies[name] === 5 && !p.awakened.includes(name) ? {
    ...p,
    awakened: [...p.awakened, name]
  } : p);
  const fighters = profile.equipped.filter(Boolean);
  function chooseFighter(name) {
    if (editingSlot === null) return;
    setProfile(p => {
      if (name && (!p.owned.includes(name) || p.equipped[1 - editingSlot] === name)) return p;
      const equipped = [...p.equipped];
      equipped[editingSlot] = name;
      return {
        ...p,
        equipped
      };
    });
    setEditingSlot(null);
  }
  const resume = () => {
    const run = loadProfile().run;
    if (!run || run.status !== "active") return;
    runSignature.current = combatFingerprint(loadProfile());
    setResumeRun(run);
    setBattleLoadout(run.loadout);
    setParty(run.team);
  };
  const startRun = () => {
    let created = null;
    setProfile(p => {
      if (p.run?.status === "active" || p.equipped.filter(Boolean).length !== 2 || !p.equipped.every(name => p.loadout[name]?.length)) return p;
      created = newRun(p);
      return {
        ...p,
        run: created,
        hasPlayed: true,
        bestFloor: Math.max(1, p.bestFloor)
      };
    });
    if (created) {
      runSignature.current = combatFingerprint(loadProfile());
      setResumeRun(created);
      setBattleLoadout(created.loadout);
      setParty(created.team);
    }
  };
  const startEvent = boss => {
    let chosen = null;
    setProfile(p => {
      if (p.eventRun?.run.status === "active") {
        if (p.eventRun.boss === boss) chosen = p.eventRun.run;
        return p;
      }
      if (!characterRoster.some(f => f.name === boss) || p.equipped.filter(Boolean).length !== 2 || !p.equipped.every(n => p.loadout[n]?.length) || !p.equipped.some(n => p.loadout[n]?.some(offensive))) return p;
      const run = newRun(p);
      run.enemies = eventWave(boss, 1, run.id);
      chosen = run;
      return {
        ...p,
        eventRun: {
          boss,
          run,
          prize: "none"
        }
      };
    });
    if (chosen) {
      runSignature.current = combatFingerprint(loadProfile());
      setResumeRun(chosen);
      setBattleLoadout(chosen.loadout);
      setParty(chosen.team);
    }
  };
  const event = resumeRun && profile.eventRun?.run.id === resumeRun.id ? profile.eventRun : null;
  if (party && resumeRun) return React.createElement(Battle, {
    key: resumeRun.id,
    event: event,
    initialRun: resumeRun,
    initialTeam: party,
    loadout: battleLoadout,
    coins: profile.coins,
    onCheckpoint: (snapshot, gains) => setProfile(p => event ? eventCheckpoint(p, snapshot) : applyRunCheckpoint(p, snapshot, gains)),
    leave: () => {
      runSignature.current = null;
      setParty(null);
      setResumeRun(null);
      setScreen(event ? "events" : "roguelike");
      setResult([]);
    }
  });
  const hub = content => React.createElement(GameHub, {
    profile: profile,
    screen: screen,
    navigate: navigate
  }, content);
  if (screen === "home") return hub(React.createElement(HubHome, {
    profile: profile,
    navigate: navigate
  }));
  if (screen === "roguelike") return hub(React.createElement(RoguelikeLaunch, {
    profile: profile,
    navigate: navigate,
    start: startRun,
    resume: resume,
    abandon: () => setProfile(p => p.run?.status === "active" ? {
      ...p,
      run: {
        ...p.run,
        status: "abandoned",
        seq: p.run.seq + 1,
        pending: null,
        updatedAt: Date.now()
      }
    } : p)
  }));
  if (screen === "events") return hub(React.createElement(EventHall, {
    profile: profile,
    start: startEvent,
    navigate: navigate,
    abandon: () => setProfile(p => p.eventRun?.run.status === "active" ? eventCheckpoint(p, {
      ...p.eventRun.run,
      status: "abandoned",
      pending: null,
      seq: p.eventRun.run.seq + 1,
      updatedAt: Date.now()
    }) : p)
  }));
  if (screen === "settings") return hub(React.createElement(AudioSettings, {
    back: () => navigate("menu")
  }));
  if (screen === "menu") return hub(React.createElement(HubMenu, {
    profile: profile,
    navigate: navigate
  }));
  if (screen === "bestiary") return hub(React.createElement(BestiaryMenu, null));
  if (screen === "quests") return hub(React.createElement(QuestMenu, {
    embedded: true,
    profile: profile,
    save: setProfile
  }));
  if (screen === "journal") return hub(React.createElement(WishHistory, {
    embedded: true,
    key: window.ChibiGameSync?.accountId || "local",
    profile: profile
  }));
  if (screen === "collection") return hub(React.createElement(React.Fragment, null, React.createElement(CharacterCollection, {
    profile: profile,
    awaken: awaken
  }), React.createElement(BadgeCatalogue, {
    embedded: true,
    owned: profile.pins
  })));
  if (screen === "summon") return hub(React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h1", null, "Invocations"), React.createElement("p", null, profile.coins, " pi\xE8ces \xB7 ", profile.owned.length, " / ", characterRoster.length, " personnages d\xE9bloqu\xE9s \xB7 Garantie dans ", 10 - profile.wishStep, " ", profile.wishStep === 9 ? "vœu" : "vœux"), historyFull(profile) && React.createElement("p", {
    role: "status"
  }, "Synchronise l\u2019historique avant de continuer \xE0 invoquer. Tes r\xE9sultats sont conserv\xE9s."), React.createElement("div", {
    className: "lobby-tools"
  }, React.createElement("button", {
    onClick: () => navigate("journal")
  }, "Historique des v\u0153ux"), React.createElement("button", {
    onClick: () => navigate("collection")
  }, "Collection"), React.createElement("button", {
    onClick: () => navigate("quests")
  }, "Qu\xEAtes")), React.createElement("p", {
    className: "daily-wishes"
  }, "V\u0153ux gratuits \xB7 ", React.createElement("b", null, profile.freeWishes), React.createElement("small", null, parisDay() >= freeWishNoStackDay ? "3 par jour · Renouvelés à minuit (Paris)" : "10 de départ + 3 par jour · Cumul jusqu’au 24/11 inclus")), React.createElement("div", {
    className: "portal-list"
  }, Object.entries(portals).filter(([id]) => portalAvailable(id)).map(([id, title]) => React.createElement("article", {
    key: id,
    className: "portal-card",
    "aria-label": title
  }, React.createElement("div", {
    className: "portal-scene scene-" + id
  }, id === "shibuya" && !matchMedia("(prefers-reduced-motion: reduce)").matches && React.createElement(PortalVideo, {
    src: "./assets/bingo/first-week-clean.mp4",
    poster: "./assets/bingo/first-week-clean.webp"
  }), id === "reality" && React.createElement(React.Fragment, null, !matchMedia("(prefers-reduced-motion: reduce)").matches && React.createElement(PortalVideo, {
    src: "./assets/bingo/from-another-reality.mp4",
    poster: "./assets/bingo/from-another-reality.webp"
  })), (id === "apocalyptic" || id === "destiny") && (matchMedia("(prefers-reduced-motion: reduce)").matches ? React.createElement("img", {
    className: "portal-art",
    src: `./assets/bingo/${id}.webp`,
    alt: ""
  }) : React.createElement(PortalVideo, {
    src: `./assets/bingo/${id}.mp4`,
    poster: `./assets/bingo/${id}.webp`
  })), (id === "partners" || id === "eosDawn" || id === "eosDusk") && React.createElement("div", {
    className: "portal-duo"
  }, portalRoster(id).map(f => React.createElement(SpritePreview, {
    key: f.name,
    fighter: f,
    maximumScale: 1.6
  }))), React.createElement("h3", null, id === "shibuya" ? "First Week #1" : title), React.createElement("button", {
    className: "portal-rates",
    onClick: () => {
      setPortal(id);
      setRateFighter(null);
      setPhase("rates");
    },
    "aria-label": `Taux de ${id === "shibuya" ? "First Week #1" : title}`
  }, "Taux"), React.createElement("div", {
    className: "bingo-machine"
  }, React.createElement("img", {
    className: "bingo-body",
    src: "./assets/bingo/machine.webp",
    alt: "Bingo Kai"
  }), React.createElement("span", {
    className: "bingo-crank",
    "aria-hidden": "true"
  })), React.createElement("div", {
    className: "wish-commands"
  }, [1, 10].map(n => React.createElement("div", {
    key: n,
    className: "wish-option"
  }, React.createElement("button", {
    "aria-describedby": `wish-price-${id}-${n}`,
    disabled: historyFull(profile) || phase !== "ready" || profile.coins < wishCost(profile, n),
    onClick: () => openWish(id, n)
  }, React.createElement("strong", null, n, " ", n === 1 ? "vœu" : "vœux")), React.createElement("span", {
    className: "wish-price",
    id: `wish-price-${id}-${n}`,
    "aria-label": `${wishCost(profile, n)} pièces requises`
  }, React.createElement(Icon, {
    name: "coin"
  }), React.createElement("span", null, "\xD7 ", wishCost(profile, n).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR"))), wishQuote(profile, n).free > 0 && React.createElement("small", {
    className: "wish-free"
  }, wishQuote(profile, n).free, " ", wishQuote(profile, n).free > 1 ? "gratuits" : "gratuit", " inclus")))), React.createElement("p", {
    className: "portal-caption"
  }, id === "shibuya" ? "Retrouve Neku, Shiki et les badges psych de Shibuya." : id === "reality" ? "Cloud, Aerith et les badges psych · Des alliés venus d’une autre réalité." : id === "apocalyptic" ? "2B, A2 et les badges psych · Un futur à reconstruire." : id === "destiny" ? "Sora, Riku et les badges psych · Les liens qui traversent les mondes." : id === "eosDawn" ? "Noctis et Prompto · Les armes royales de Lucis." : id === "eosDusk" ? "Ignis et Gladio · Les gardiens de la couronne." : "Beat et Joshua · Les partenaires de la Reapers’ Game."))))), phase === "rates" && React.createElement(WishDialog, {
    key: "rates",
    className: rateFighter ? "character-sheet-dialog" : "portal-rates-dialog",
    title: rateFighter ? `Fiche · ${rateFighter}` : `Taux · ${portalName}`,
    close: closeDialog
  }, rateFighter ? React.createElement(React.Fragment, null, React.createElement(CharacterDossier, {
    fighter: characterRoster.find(f => f.name === rateFighter),
    profile: profile,
    base: true,
    rate: pool.filter(x => x.name === rateFighter).length / pool.length * (guaranteed ? 1 : characterChance)
  }), React.createElement("button", {
    onClick: () => setRateFighter(null)
  }, "Retour aux taux")) : React.createElement(React.Fragment, null, React.createElement("p", null, "V\u0153u ordinaire \xB7 ", percent(characterChance), " personnage, ", percent(1 - characterChance), " badge. Chaque 10e v\u0153u garantit un personnage."), React.createElement("h3", null, "Prochain v\u0153u", guaranteed ? " · garanti" : ""), React.createElement("p", null, "Touche un personnage pour voir sa fiche."), React.createElement("div", {
    className: "rates-character-list"
  }, portalRoster(portal).map(f => React.createElement("button", {
    key: f.name,
    onClick: () => setRateFighter(f.name),
    "aria-label": `Fiche de ${f.name}`
  }, React.createElement(HudPortrait, {
    fighter: f
  }), React.createElement("span", null, React.createElement("b", null, f.name), React.createElement("small", null, "Stats & psych de d\xE9part")), React.createElement("strong", null, percent(pool.filter(x => x.name === f.name).length / pool.length * (guaranteed ? 1 : characterChance))), React.createElement("span", {
    "aria-hidden": "true"
  }, "\u203A")))), React.createElement("p", null, "Badges psych \xB7 ", React.createElement("b", null, percent(guaranteed ? 0 : 1 - characterChance))), React.createElement("p", null, "Les ", pinList.length, " badges sont \xE9quiprobables. Les taux par personnage sont fixes : obtenir un personnage ou l\u2019\xE9veiller ne modifie pas sa probabilit\xE9.")), React.createElement("button", {
    onClick: closeDialog
  }, "Fermer")), phase === "confirm" && React.createElement(WishDialog, {
    key: "confirm",
    title: "Confirmer l\u2019invocation",
    close: closeDialog
  }, React.createElement("p", null, "Invoquer sur ", portalName, " pour ", quantity, " ", quantity === 1 ? "vœu" : "vœux", " ?"), React.createElement("dl", null, React.createElement("dt", null, "V\u0153ux gratuits utilis\xE9s"), React.createElement("dd", null, wishQuote(profile, quantity).free), React.createElement("dt", null, "V\u0153ux gratuits restants"), React.createElement("dd", null, profile.freeWishes - wishQuote(profile, quantity).free), React.createElement("dt", null, "Solde actuel"), React.createElement("dd", null, profile.coins, " pi\xE8ces"), React.createElement("dt", null, "Co\xFBt"), React.createElement("dd", null, price, " pi\xE8ces"), React.createElement("dt", null, "Solde apr\xE8s invocation"), React.createElement("dd", null, price <= profile.coins ? `${profile.coins - price} pièces` : "Solde insuffisant")), React.createElement("div", {
    className: "dialog-actions"
  }, React.createElement("button", {
    onClick: closeDialog
  }, "Annuler"), React.createElement("button", {
    disabled: profile.coins < price,
    onClick: () => recruit(portal, quantity)
  }, "Confirmer"))), ["crank", "spin", "drop", "reveal"].includes(phase) && React.createElement(WishDialog, {
    key: "invocation",
    title: phase === "reveal" ? "Résultat de l’invocation" : portalName,
    close: phase === "reveal" ? closeDialog : undefined
  }, phase === "reveal" ? React.createElement(RewardReveal, {
    draws: result,
    close: closeDialog
  }) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "invocation-stage"
  }, React.createElement("div", {
    className: "bingo-machine"
  }, React.createElement("img", {
    className: "bingo-body",
    src: "./assets/bingo/machine.webp",
    alt: "Bingo Kai"
  }), React.createElement("button", {
    autoFocus: true,
    "aria-label": "Tourner la manivelle",
    className: "bingo-crank " + (phase === "spin" ? "turning" : ""),
    disabled: phase !== "crank",
    onClick: () => setPhase("spin"),
    onAnimationEnd: e => {
      if (e.animationName === "bingo-turn") setPhase("drop");
    }
  }), phase === "drop" && React.createElement("span", {
    className: "bingo-ball capsule",
    onAnimationEnd: e => {
      if (e.animationName === "bingo-drop") {
        turning.current = false;
        gameSound.effect("pin");
        setPhase("reveal");
      }
    }
  }, React.createElement(Capsule, null)))), React.createElement("p", {
    "aria-live": "polite"
  }, phase === "crank" ? "Appuie sur la manivelle." : phase === "spin" ? "La manivelle tourne…" : "La capsule tombe…"))), saveError && React.createElement("p", {
    role: "alert"
  }, "Sauvegarde locale indisponible."))));
  return hub(React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h1", null, "Team"), React.createElement("div", {
    className: "team-slots"
  }, profile.equipped.map((name, index) => {
    const fighter = characterRoster.find(f => f.name === name);
    const stats = fighter && trained(fighter, profile.xp[name] || 0, profile.awakened.includes(name), profile.copies[name] || 0);
    return React.createElement("button", {
      key: index,
      "aria-label": `Emplacement ${index + 1} · ${name || "Choisir un personnage"}`,
      onClick: () => setEditingSlot(index)
    }, fighter && stats ? React.createElement(React.Fragment, null, React.createElement(SpritePreview, {
      fighter: fighter
    }), React.createElement("strong", null, name), React.createElement(TypeChips, {
      elements: characterElements[name]
    }), React.createElement(RankBadge, {
      level: profile.levels[name]
    }), React.createElement("small", null, "PV ", stats.maxHp, React.createElement("br", null), "ATK ", stats.atk, " \xB7 ATK SPE ", stats.mag, " \xB7 SPE ", stats.speed), React.createElement(XpProgress, {
      xp: stats.xp
    })) : React.createElement("span", {
      "aria-hidden": "true"
    }, "+"));
  })), editingSlot !== null && React.createElement(WishDialog, {
    title: `Choisir un personnage · ${editingSlot + 1} / 2`,
    close: () => setEditingSlot(null)
  }, profile.owned.length === 0 && React.createElement("p", null, "D\xE9bloque ton premier personnage dans ", React.createElement("a", {
    href: "../app.html#gacha",
    target: "_top"
  }, "l\u2019onglet Gacha"), "."), React.createElement("div", {
    className: "party-list"
  }, characterRoster.filter(f => profile.owned.includes(f.name)).map(f => React.createElement("button", {
    key: f.name,
    disabled: profile.equipped[1 - editingSlot] === f.name,
    onClick: () => chooseFighter(f.name)
  }, React.createElement(SpritePreview, {
    fighter: f
  }), React.createElement("strong", null, f.name), profile.equipped[1 - editingSlot] === f.name && React.createElement("small", null, "D\xE9j\xE0 \xE9quip\xE9")))), React.createElement("div", {
    className: "dialog-actions"
  }, profile.equipped[editingSlot] && React.createElement("button", {
    onClick: () => chooseFighter("")
  }, "Retirer"), React.createElement("button", {
    onClick: () => setEditingSlot(null)
  }, "Fermer"))), fighters.map(name => React.createElement(PsychEquipment, {
    key: name,
    name: name,
    profile: profile,
    save: ids => setProfile(p => assignBasePsychs({
      ...p,
      loadout: {
        ...p.loadout,
        [name]: ids
      }
    }))
  })), fighters.length === 2 && !fighters.some(name => profile.loadout[name]?.some(offensive)) && React.createElement("p", null, "\xC9quipe au moins un psych offensif."), React.createElement(AwakeningPanel, {
    profile: profile,
    awaken: awaken
  }), saveError && React.createElement("p", {
    role: "alert"
  }, "La sauvegarde locale est indisponible dans ce navigateur."))));
}
function HudPortrait({
  fighter,
  enemy
}) {
  const ref = React.useRef(null);
  useEffect(() => {
    const context = ref.current?.getContext("2d"),
      image = new Image();
    let disposed = false;
    const spec = enemy ? enemyCatalog[enemy.kind] : null;
    const width = spec?.frameWidth || fighter?.frameWidth || 80,
      height = spec?.frameHeight || fighter?.frameHeight || 116;
    const ready = (image, sx = 0, sy = 0) => {
      if (disposed || !context) return;
      const sample = document.createElement("canvas");
      sample.width = width;
      sample.height = height;
      const scan = sample.getContext("2d");
      scan.drawImage(image, sx, sy, width, height, 0, 0, width, height);
      let left = width,
        right = 0,
        top = height,
        bottom = 0;
      try {
        const pixels = scan.getImageData(0, 0, width, height).data;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (pixels[(y * width + x) * 4 + 3] > 64) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      } catch {
        left = 0;
        right = width;
        top = 0;
        bottom = height;
      }
      const crop = Math.max(1, Math.min(width, (bottom - top + 1) * .45)),
        x = Math.max(0, Math.min(width - crop, (fighter?.portraitCenter ?? (left + right) / 2) - crop / 2));
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 64, 64);
      context.drawImage(image, sx + x, sy + (fighter?.portraitTop ?? top), crop, crop, 0, 0, 64, 64);
    };
    if (spec?.atlasFrames) {
      const [page, x, y] = spec.atlasFrames[0];
      ffbePage(page).then(image => ready(image, x, y)).catch(() => {});
    } else {
      image.onload = () => ready(image);
      image.src = enemy ? eventHeroes[enemy.kind]?.sprite || `./assets/game/enemy-atlases/${enemy.kind}.png` : fighter.sprite;
    }
    return () => {
      disposed = true;
    };
  }, [fighter?.sprite, enemy?.kind]);
  return React.createElement("canvas", {
    ref: ref,
    width: 64,
    height: 64,
    "aria-hidden": "true"
  });
}
function turnOrder(team, enemies, turn) {
  const living = team.filter(f => f.hp > 0);
  return [...living.map(f => ({
    key: f.name,
    side: "ally",
    name: f.name,
    speed: f.speed || 0
  })), ...enemies.filter(e => e.hp > 0).map((e, i) => ({
    key: `enemy-${e.id}`,
    side: "enemy",
    name: e.name,
    id: e.id,
    speed: e.speed,
    target: (e.trait === "hunter" ? [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : living[(turn - 1 + i) % living.length])?.name
  }))].sort((a, b) => b.speed - a.speed || (a.side === b.side ? 0 : a.side === "ally" ? -1 : 1));
}
const planCost = plan => plan?.kind === "psych" ? psychs[plan.pin]?.cost || 0 : 0;
const planName = plan => !plan ? "Choisir une action" : plan.kind === "guard" ? "Défense" : plan.kind === "burst" ? "Sync Burst" : psychs[plan.pin].name;
function Battle({
  event,
  initialRun,
  initialTeam,
  loadout,
  coins,
  onCheckpoint,
  leave
}) {
  const finalWave = event ? 3 : maxFloor;
  const checkpointSeq = React.useRef(initialRun.seq);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const receive = event => {
      if (event.source === window.parent && event.data?.type === "chibi:fullscreen-state") setFullscreen(Boolean(event.data.active));
    };
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("message", receive);
    document.addEventListener("fullscreenchange", sync);
    return () => {
      window.removeEventListener("message", receive);
      document.removeEventListener("fullscreenchange", sync);
      if (window.parent !== window) window.parent.postMessage({
        type: "chibi:fullscreen",
        action: "exit"
      }, "*");
    };
  }, []);
  const toggleFullscreen = async () => {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: "chibi:fullscreen",
        action: "toggle"
      }, "*");
      return;
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFullscreen(false);
    } else {
      try {
        await document.documentElement.requestFullscreen();
      } catch {}
      setFullscreen(true);
    }
  };
  const [orderDetail, setOrderDetail] = useState(null);
  const [inspectedId, setInspectedId] = useState(null);
  const lastTap = React.useRef({
    id: -1,
    time: 0
  });
  const awarded = React.useRef(new Set(initialRun.awarded));
  const clearedWave = React.useRef(initialRun.reward);
  const [earnedXp, setEarnedXp] = useState(initialRun.earnedXp);
  const [wave, setWave] = useState(initialRun.wave);
  const [team, setTeam] = useState(initialTeam);
  const [enemies, setEnemies] = useState(initialRun.enemies);
  const [selected, setSelected] = useState(initialRun.enemies.find(e => e.hp > 0)?.id || initialRun.wave * 10);
  const [energy, setEnergy] = useState(initialRun.energy);
  const [groove, setGroove] = useState(initialRun.groove);
  const [turn, setTurn] = useState(initialRun.turn);
  const [message, setMessage] = useState("Choisis 1 action par personnage, puis lance le tour.");
  const [busy, setBusy] = useState(false);
  const [hitFeedback, setHitFeedback] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loot, setLoot] = useState(initialRun.loot);
  const [dropReveal, setDropReveal] = useState([]);
  const [reward, setReward] = useState(initialRun.reward);
  const [actor, setActor] = useState("");
  const [activeAction, setActiveAction] = useState(null);
  const inspected = enemies.find(enemy => enemy.id === inspectedId);
  function selectEnemy(enemy) {
    if (enemy.hp <= 0) return;
    setSelected(enemy.id);
    const time = performance.now();
    if (lastTap.current.id === enemy.id && time - lastTap.current.time <= 400) {
      setInspectedId(enemy.id);
      lastTap.current = {
        id: -1,
        time: 0
      };
    } else lastTap.current = {
      id: enemy.id,
      time
    };
  }
  const livingEnemies = enemies.filter(enemy => enemy.hp > 0);
  const totalEnemyHp = livingEnemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  const threat = useMemo(() => {
    if (totalEnemyHp > 190) return "HIGH";
    if (totalEnemyHp > 80) return "MED";
    return "LOW";
  }, [totalEnemyHp]);
  useEffect(() => {
    if (!livingEnemies.some(enemy => enemy.id === selected) && livingEnemies[0]) {
      setSelected(livingEnemies[0].id);
    }
  }, [enemies, livingEnemies, selected]);
  const [plans, setPlans] = useState({});
  const [chooser, setChooser] = useState(null);
  const [targetPin, setTargetPin] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const running = React.useRef(false);
  const generation = React.useRef(0);
  useEffect(() => () => {
    generation.current++;
  }, []);
  const livingTeam = team.filter(f => f.hp > 0);
  const order = busy ? queue : turnOrder(team, enemies, turn);
  const reserved = livingTeam.reduce((sum, f) => sum + planCost(plans[f.name]), 0);
  const ready = livingTeam.length > 0 && livingTeam.every(f => plans[f.name]) && reserved <= energy;
  const choosing = team.find(f => f.name === chooser);
  const otherCost = livingTeam.filter(f => f.name !== chooser).reduce((sum, f) => sum + planCost(plans[f.name]), 0);
  const burstReserved = Object.entries(plans).some(([name, p]) => name !== chooser && p.kind === "burst");
  const openChooser = name => {
    if (busy || reward) return;
    setTargetPin(null);
    setChooser(name);
  };
  const choose = plan => {
    if (!chooser || busy || planCost(plan) + otherCost > energy) return;
    setPlans(old => ({
      ...old,
      [chooser]: plan
    }));
    setChooser(null);
    setTargetPin(null);
  };
  const resetPlanning = () => {
    setPlans({});
    setQueue([]);
    setQueueIndex(-1);
    setChooser(null);
    setTargetPin(null);
    setActor("");
    setActiveAction(null);
    setImpact(null);
    setHitFeedback(null);
  };
  const saveCheckpoint = (snapshot, gains = {}) => onCheckpoint({
    ...snapshot,
    version: 1,
    id: initialRun.id,
    seq: ++checkpointSeq.current,
    updatedAt: Date.now(),
    loadout
  }, gains);
  const resolveRound = async (recovery = null) => {
    if (running.current || busy || reward || !recovery && !ready) return;
    running.current = true;
    const token = generation.current;
    const steps = recovery?.steps || turnOrder(team, enemies, turn);
    const choices = recovery?.choices || {
      ...plans
    };
    let fighters = team.map(f => ({
        ...f
      })),
      monsters = enemies.map(e => ({
        ...e
      })),
      en = recovery ? energy : energy - reserved,
      sync = groove;
    const shields = new Map(recovery?.shields || []);
    const performed = new Set(recovery?.performed || []);
    const drops = [];
    let xp = 0;
    const pause = () => new Promise(resolve => setTimeout(resolve, 700));
    const publish = () => {
      setTeam([...fighters]);
      setEnemies([...monsters]);
      setEnergy(en);
      setGroove(sync);
    };
    const healParty = amount => {
      fighters = fighters.map(f => f.hp > 0 ? {
        ...f,
        hp: Math.min(f.maxHp, f.hp + amount)
      } : f);
    };
    const passiveBonus = (pattern, base) => Math.max(0, ...fighters.filter(f => f.hp > 0).flatMap(f => (loadout[f.name] || []).map(id => psychs[id]).filter(pin => pattern.test(pin.psych)).map(pin => base * pinRankMultiplier(pin))));
    const persist = (pending, gains = {}, nextTurn = turn) => saveCheckpoint({
      status: fighters.every(f => f.hp <= 0) ? "lost" : wave === finalWave && monsters.every(e => e.hp <= 0) ? "complete" : "active",
      wave,
      turn: nextTurn,
      team: fighters,
      enemies: monsters,
      energy: en,
      groove: sync,
      reward: monsters.every(e => e.hp <= 0),
      earnedXp: earnedXp + xp,
      loot: [...loot, ...drops.map(pin => pin.name)],
      awarded: [...awarded.current],
      pending: fighters.every(f => f.hp <= 0) || monsters.every(e => e.hp <= 0) ? null : pending
    }, gains);
    setBusy(true);
    setQueue(steps);
    setEnergy(en);
    persist({
      steps,
      choices,
      index: recovery?.index || 0,
      shields: [...shields],
      performed: [...performed]
    });
    for (let index = recovery?.index || 0; index < steps.length; index++) {
      if (token !== generation.current) return;
      if (!monsters.some(e => e.hp > 0) || !fighters.some(f => f.hp > 0)) break;
      const gains = {};
      const step = steps[index];
      setQueueIndex(index);
      setHitFeedback(null);
      setImpact(null);
      setActiveAction(null);
      setActor("");
      if (step.side === "enemy") {
        const attacker = monsters.find(e => e.id === step.id);
        if (attacker.hp <= 0) continue;
        const target = fighters.find(f => f.name === step.target && f.hp > 0) || fighters.find(f => f.hp > 0);
        const attackType = enemyElements[attacker.kind][0],
          scale = effectiveness(attackType, characterElements[target.name]);
        const damage = Math.random() < Math.min(.30, (target.speed || 0) / 200) ? 0 : typedDamage(Math.max(3, Math.round(enemyAttackPower(attacker) * (1 - (shields.get(target.name) || 0)))), attackType, characterElements[target.name]);
        setHitFeedback({
          side: "ally",
          target: target.name,
          label: scale === 0 ? "Sans effet" : `${damage} PV · ${affinityText(scale)}`
        });
        fighters = fighters.map(f => f.name === target.name ? {
          ...f,
          hp: Math.max(0, f.hp - damage)
        } : f);
        if (attacker.trait === "vampire" && damage > 0) monsters = monsters.map(e => e.id === attacker.id ? {
          ...e,
          hp: Math.min(e.maxHp, e.hp + Math.ceil(damage * .15))
        } : e);
        sync = Math.min(100, sync + 12);
        if (damage) gameSound.effect("hit");
        setMessage(damage ? `${attacker.name} attaque ${target.name} · −${damage} PV` : `${target.name} esquive ${attacker.name}.`);
      } else {
        const fighter = fighters.find(f => f.name === step.name);
        const plan = choices[step.name];
        if (fighter.hp <= 0) continue;
        performed.add(fighter.name);
        setActor(fighter.name);
        if (plan.kind === "guard") {
          shields.set(fighter.name, Math.max(shields.get(fighter.name) || 0, .55));
          en = Math.min(3, en + 1);
          setActiveAction("guard");
          setMessage(`${fighter.name} se protège jusqu’à la fin du tour · +1 EN`);
        } else if (plan.kind === "burst") {
          sync = 0;
          monsters = monsters.map(e => ({
            ...e,
            hp: Math.max(0, e.hp - enemyDamageTaken(e, typedDamage(58, "normal", enemyElements[e.kind])))
          }));
          setActiveAction("burst");
          setMessage(`${fighter.name} · Sync Burst · 58 dégâts sur tous les ennemis !`);
        } else {
          const pin = psychs[plan.pin];
          if (pin.kind === "heal") {
            const amount = scaledPinEffect(pin, (fighter.mag || 1) * pin.power / 50 * (1 + passiveBonus(/^Cure Boost/, .3)));
            healParty(amount);
            setActiveAction("heal");
            setMessage(`${fighter.name} · ${pin.name} · +${amount} PV au duo`);
          } else if (pin.kind === "guard" || pin.kind === "support") {
            fighters.filter(f => f.hp > 0).forEach(f => shields.set(f.name, Math.max(shields.get(f.name) || 0, pinShieldReduction(pin))));
            if (pin.kind === "support") {
              if (/Turbo|Supply/.test(pin.psych)) en = Math.min(3, en + scaledPinEffect(pin, 2));else if (/Cure Boost|Subconscious|Life/.test(pin.psych)) healParty(scaledPinEffect(pin, (fighter.mag || 1) / 2));else sync = Math.min(100, sync + scaledPinEffect(pin, 18));
            }
            setActiveAction("guard");
            setMessage(`${fighter.name} · ${pin.name} · Duo protégé pour ce tour`);
          } else {
            const target = monsters.find(e => e.id === plan.target && e.hp > 0) || monsters.find(e => e.hp > 0);
            const physical = pin.kind === "physical";
            const amount = scaledPinEffect(pin, (physical ? fighter.atk || 1 : fighter.mag || 1) * (.7 + pin.power / 100));
            const scale = effectiveness(pin.element, enemyElements[target.kind]);
            const damage = enemyDamageTaken(target, typedDamage(Math.max(1, Math.round(amount * (1 + passiveBonus(/^Resonance/, .15))) + Math.floor(Math.random() * 7) - 3), pin.element, enemyElements[target.kind]));
            setHitFeedback({
              side: "enemy",
              target: String(target.id),
              label: scale === 0 ? "Sans effet" : `${damage} dégâts · ${affinityText(scale)}`
            });
            monsters = monsters.map(e => e.id === target.id ? {
              ...e,
              hp: Math.max(0, e.hp - damage)
            } : e);
            if (pin.drain) healParty(Math.ceil(damage / 4));
            if (damage) gameSound.effect("hit");
            sync = Math.min(100, sync + 18);
            setSelected(target.id);
            setImpact(target.id);
            setActiveAction(physical ? "shockwave" : "pyro");
            setMessage(`${fighter.name} · ${pin.name} → ${target.name} · ${damage} dégâts`);
          }
        }
        const defeated = monsters.filter(e => e.hp <= 0 && !awarded.current.has(e.id));
        defeated.forEach(e => awarded.current.add(e.id));
        const earned = defeated.reduce((sum, e) => sum + e.xp, 0);
        if (earned) {
          xp += earned;
          gains.xp = earned;
          fighters = fighters.map(f => gainExperience(f, earned));
        }
        const found = event ? [] : defeated.filter(() => Math.random() < .25).map(() => pick(pinList));
        if (found.length) {
          drops.push(...found);
          gains.pins = found.map(pin => pin.id);
        }
      }
      if (monsters.every(e => e.hp <= 0) && !clearedWave.current) {
        clearedWave.current = true;
        gains.victory = true;
      }
      persist({
        steps,
        choices,
        index: index + 1,
        shields: [...shields],
        performed: [...performed]
      }, gains);
      publish();
      await pause();
    }
    if (token !== generation.current) return;
    const unused = Object.entries(choices).reduce((sum, [name, plan]) => sum + (performed.has(name) ? 0 : planCost(plan)), 0);
    en = Math.min(3, en + unused + 2);
    persist(null, {}, fighters.some(f => f.hp > 0) && monsters.some(e => e.hp > 0) ? turn + 1 : turn);
    publish();
    resetPlanning();
    if (xp) setEarnedXp(old => old + xp);
    if (drops.length) {
      gameSound.effect("pin");
      setLoot(old => [...old, ...drops.map(pin => pin.name)]);
      setDropReveal(drops.map(pin => ({
        pin
      })));
    }
    if (!monsters.some(e => e.hp > 0)) {
      setReward(true);
      setMessage("Vague terminée !");
    } else if (fighters.some(f => f.hp > 0)) {
      setTurn(old => old + 1);
      setMessage("Choisis 1 action par personnage, puis lance le tour.");
    }
    setBusy(false);
    running.current = false;
  };
  useEffect(() => {
    if (initialRun.pending) {
      const timer = setTimeout(() => resolveRound(initialRun.pending), 0);
      return () => clearTimeout(timer);
    }
  }, []);
  const nextWave = () => {
    if (wave >= finalWave || busy || !reward) return;
    const next = wave + 1,
      heal = difficultyAt(next).tier > difficultyAt(wave).tier;
    const nextTeam = team.map(f => ({
        ...f,
        hp: heal ? f.maxHp : f.hp
      })),
      nextEnemies = event ? eventWave(event.boss, next, initialRun.id) : makeWave(next, initialRun.id);
    saveCheckpoint({
      status: "active",
      wave: next,
      turn: 1,
      team: nextTeam,
      enemies: nextEnemies,
      energy,
      groove,
      reward: false,
      earnedXp: 0,
      loot: [],
      awarded: [],
      pending: null
    });
    setTeam(nextTeam);
    resetPlanning();
    setLoot([]);
    setEarnedXp(0);
    setInspectedId(null);
    lastTap.current = {
      id: -1,
      time: 0
    };
    awarded.current.clear();
    clearedWave.current = false;
    setWave(next);
    setTurn(1);
    setEnemies(nextEnemies);
    setSelected(next * 10);
    setReward(false);
    setMessage(heal ? `Palier ${difficultyAt(next).tier} · Team entièrement soignée.` : `Étage ${next} · PV conservés.`);
  };
  const teamDefeated = team.every(fighter => fighter.hp <= 0);
  useMusic(teamDefeated ? null : reward ? "victory" : (event ? wave === 3 : isBossWave(wave)) ? "boss" : "battle");
  const routeStart = Math.floor((wave - 1) / 5) * 5 + 1;
  const sector = Math.floor((wave - 1) / 5) + 1;
  return React.createElement("main", {
    className: "game-shell combat-hud"
  }, React.createElement("header", {
    className: "topbar"
  }, React.createElement("div", {
    className: "brand-lockup"
  }, React.createElement("div", {
    className: "brand-mark"
  }, "R"), React.createElement("div", null, React.createElement("strong", null, "REAPER'S RUN"), React.createElement("span", null, "SHIBUYA / DAY 01"))), React.createElement("div", {
    className: "run-stats"
  }, React.createElement("button", {
    className: "fullscreen-button",
    onClick: toggleFullscreen,
    "aria-pressed": fullscreen
  }, fullscreen ? "Quitter plein écran" : "Plein écran"), React.createElement("span", null, React.createElement(Icon, {
    name: "star"
  }), " SCORE ", React.createElement("b", null, String((wave - 1) * 2350).padStart(6, "0"))), React.createElement("span", {
    className: "currency"
  }, React.createElement(Icon, {
    name: "coin"
  }), " ", coins), React.createElement("button", {
    className: "currency",
    disabled: busy,
    onClick: leave,
    title: event ? "Retour aux événements" : "Mettre la run en pause et revenir à Team"
  }, event ? "Pause" : "Mon duo"), React.createElement(SoundToggle, null))), React.createElement("section", {
    className: "game-grid"
  }, React.createElement("aside", {
    className: "squad-panel"
  }, React.createElement("div", {
    className: "section-label"
  }, React.createElement("span", null, "PLAYER SQUAD"), React.createElement("b", null, String(team.length).padStart(2, "0"), " / 02")), team.map((fighter, index) => React.createElement("article", {
    className: `fighter-card ${fighter.hp <= 0 ? "down" : ""}`,
    key: fighter.name
  }, React.createElement("div", {
    className: "portrait",
    style: {
      "--accent": fighter.accent
    }
  }, React.createElement(HudPortrait, {
    fighter: fighter
  })), React.createElement("div", {
    className: "fighter-info"
  }, React.createElement("small", null, fighter.role), React.createElement("h2", null, fighter.name), React.createElement(TypeChips, {
    elements: characterElements[fighter.name]
  }), React.createElement(XpProgress, {
    xp: fighter.xp || 0
  }), React.createElement("div", {
    className: "health-readout"
  }, React.createElement("span", null, "HP"), React.createElement("b", null, fighter.hp), React.createElement("em", null, "/ ", fighter.maxHp)), React.createElement("div", {
    className: "bar"
  }, React.createElement("i", {
    style: {
      width: `${fighter.hp / fighter.maxHp * 100}%`
    }
  }))))), React.createElement("div", {
    className: "groove-card"
  }, React.createElement("div", null, React.createElement("span", null, "TEAM GROOVE"), React.createElement("b", null, groove, "%")), React.createElement("div", {
    className: "groove-bar"
  }, React.createElement("i", {
    style: {
      width: `${groove}%`
    }
  })), React.createElement("button", {
    disabled: groove < 100 || busy || reward || teamDefeated,
    onClick: () => openChooser(livingTeam[0].name)
  }, React.createElement(Icon, {
    name: "bolt"
  }), " SYNC BURST")), React.createElement("div", {
    className: "energy-card",
    "aria-label": `Énergie disponible : ${busy ? energy : energy - (chooser ? otherCost : reserved)} sur 3`
  }, React.createElement("div", null, React.createElement("span", null, "\xC9NERGIE"), React.createElement("b", null, busy ? energy : energy - (chooser ? otherCost : reserved), " / 3 EN")), React.createElement("div", {
    className: "energy-pips",
    "aria-hidden": "true"
  }, [0, 1, 2].map(pip => React.createElement("i", {
    key: pip,
    className: pip < (busy ? energy : energy - (chooser ? otherCost : reserved)) ? "full" : ""
  }))))), React.createElement("section", {
    className: "battle-column"
  }, React.createElement("div", {
    className: "battle-heading"
  }, React.createElement("div", null, React.createElement("small", null, "ENCOUNTER"), React.createElement("h1", null, event ? "Événement" : "ÉTAGE", " ", String(wave).padStart(2, "0"), " ", React.createElement("small", {
    className: "tier-label"
  }, event ? `${event.boss} · ${wave}/3` : `Palier ${difficultyAt(wave).tier} / 10`))), React.createElement("div", {
    className: `threat threat-${threat.toLowerCase()}`
  }, React.createElement("span", null, "THREAT"), React.createElement("b", null, threat))), React.createElement("nav", {
    className: "turn-order",
    "aria-label": `Ordre du tour ${turn}, selon la SPE`
  }, React.createElement("span", {
    className: "hud-turn"
  }, "Tour ", turn), React.createElement("ol", null, order.map((entry, index) => {
    const fighter = team.find(f => f.name === entry.name),
      enemy = enemies.find(e => e.id === entry.id);
    const description = `${index + 1}. ${entry.name} · SPE ${entry.speed} · ${entry.side === "enemy" ? `Attaque → ${entry.target}` : planName(plans[entry.name])}`;
    return React.createElement("li", {
      key: entry.key,
      className: `${entry.side} ${busy && index === queueIndex ? "playing" : ""} ${busy && index < queueIndex ? "played" : ""}`,
      "aria-current": busy && index === queueIndex ? "step" : undefined
    }, React.createElement("button", {
      title: description,
      "aria-label": description,
      onClick: () => setOrderDetail(entry.key)
    }, React.createElement(HudPortrait, {
      fighter: fighter,
      enemy: enemy
    }), React.createElement("span", {
      className: "turn-number"
    }, index + 1)));
  }))), React.createElement("div", {
    className: "arena",
    style: {
      backgroundImage: `linear-gradient(180deg, rgba(15,20,21,.04), rgba(9,12,13,.42)), url(${battleBackground})`
    }
  }, React.createElement("div", {
    className: "turn-badge"
  }, "TURN ", String(turn).padStart(2, "0")), React.createElement("div", {
    className: `enemy-line enemies-count-${enemies.length}`
  }, enemies.map(enemy => React.createElement("button", {
    key: enemy.id,
    className: `enemy-unit ${selected === enemy.id ? "selected" : ""} ${enemy.hp <= 0 ? "defeated" : ""} ${impact === enemy.id ? "hit" : ""}`,
    onClick: () => targetPin && !busy ? choose({
      kind: "psych",
      pin: targetPin,
      target: enemy.id
    }) : selectEnemy(enemy),
    onDoubleClick: () => enemy.hp > 0 && setInspectedId(enemy.id),
    "aria-label": `${enemy.name} · ${enemy.hp} / ${enemy.maxHp} PV. Deux appuis pour les statistiques.`,
    title: "Deux appuis pour les statistiques"
  }, React.createElement(EnemySprite, {
    kind: enemy.kind,
    boss: enemy.boss,
    combat: true
  }), hitFeedback?.side === "enemy" && hitFeedback.target === String(enemy.id) && React.createElement("span", {
    className: "hit-feedback",
    key: queueIndex
  }, hitFeedback.label), React.createElement("span", {
    className: "enemy-hp",
    "aria-hidden": "true"
  }, React.createElement("i", {
    style: {
      width: `${100 * enemy.hp / enemy.maxHp}%`
    }
  }))))), React.createElement("div", {
    className: "player-line"
  }, team.map(fighter => React.createElement("div", {
    className: `arena-hero ${fighter.hp <= 0 ? "defeated" : ""}`,
    key: fighter.name
  }, React.createElement(Sprite, {
    fighter: fighter,
    action: activeAction === "burst" || fighter.name === actor ? activeAction : null,
    combat: true
  }), React.createElement("span", null, fighter.name), hitFeedback?.side === "ally" && hitFeedback.target === fighter.name && React.createElement("span", {
    className: "hit-feedback",
    key: queueIndex
  }, hitFeedback.label)))), React.createElement("p", {
    className: "combat-status",
    role: "status"
  }, message)), React.createElement("section", {
    className: `round-planner ${choosing ? "choosing-action" : ""}`,
    "aria-label": "Pr\xE9parer les actions"
  }, choosing ? React.createElement("div", {
    key: `${choosing.name}-${targetPin || "actions"}`,
    className: "inline-action-menu",
    "aria-label": `Actions de ${choosing.name}`
  }, targetPin ? React.createElement(React.Fragment, null, React.createElement("p", null, React.createElement("b", null, psychs[targetPin].name), " \xB7 Choisir la cible"), React.createElement("div", {
    className: "target-menu"
  }, livingEnemies.map((enemy, i) => React.createElement("button", {
    key: enemy.id,
    onClick: () => choose({
      kind: "psych",
      pin: targetPin,
      target: enemy.id
    })
  }, React.createElement(HudPortrait, {
    enemy: enemy
  }), React.createElement("b", null, enemy.name), React.createElement("span", null, enemy.hp, " / ", enemy.maxHp, " PV \xB7 ", affinityText(effectiveness(psychs[targetPin].element, enemyElements[enemy.kind]))), React.createElement(TypeChips, {
    elements: enemyElements[enemy.kind]
  })))), React.createElement("button", {
    onClick: () => setTargetPin(null)
  }, "Retour aux actions")) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "psych-action-menu"
  }, (loadout[choosing.name] || []).map(id => {
    const pin = psychs[id];
    return React.createElement("button", {
      key: id,
      disabled: pin.cost + otherCost > energy,
      onClick: () => offensive(id) ? setTargetPin(id) : choose({
        kind: "psych",
        pin: id
      })
    }, React.createElement(PinIcon, {
      pin: pin
    }), React.createElement("b", null, pin.name), React.createElement("span", null, elementNames[pin.element || badgeElement(pin)], " \xB7 ", types[pin.kind], " \xB7 ", pin.cost, " EN"));
  }), React.createElement("button", {
    onClick: () => choose({
      kind: "guard"
    })
  }, React.createElement(Icon, {
    name: "guard"
  }), React.createElement("b", null, "D\xE9fense"), React.createElement("span", null, "0 EN \xB7 Protection \xB7 +1 EN")), groove >= 100 && React.createElement("button", {
    disabled: burstReserved,
    onClick: () => choose({
      kind: "burst"
    })
  }, React.createElement(Icon, {
    name: "bolt"
  }), React.createElement("b", null, "Sync Burst"), React.createElement("span", null, "100% Groove \xB7 Tous les ennemis"))), React.createElement("button", {
    onClick: () => setChooser(null)
  }, "Annuler"))) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "planned-actions"
  }, team.map(f => {
    const plan = plans[f.name],
      target = enemies.find(e => e.id === plan?.target);
    return React.createElement("button", {
      key: f.name,
      disabled: busy || reward || f.hp <= 0,
      onClick: () => openChooser(f.name)
    }, React.createElement("b", null, f.name), React.createElement("span", null, f.hp <= 0 ? "K.O." : planName(plan)), React.createElement("small", null, plan ? target ? `→ ${target.name}` : plan.kind === "guard" ? "Protection personnelle" : "Duo / tous les ennemis" : "Choisir"), plan && React.createElement("small", null, planCost(plan), " EN \xB7 Modifier"));
  })), React.createElement("button", {
    className: "resolve-round",
    disabled: busy || reward || !ready || teamDefeated,
    onClick: () => resolveRound()
  }, busy ? "Tour en cours…" : "Lancer le tour")))), React.createElement("aside", {
    className: "route-panel"
  }, React.createElement("div", {
    className: "section-label"
  }, React.createElement("span", null, "RUN PROGRESS"), React.createElement("b", null, "SECTOR ", String(sector).padStart(2, "0"))), React.createElement("div", {
    className: "route"
  }, Array.from({
    length: 5
  }, (_, index) => routeStart + index).map(node => React.createElement("div", {
    className: node < wave ? "complete" : node === wave ? "current" : "",
    key: node
  }, React.createElement("span", null, node < wave ? "✓" : String(node).padStart(2, "0")), React.createElement("p", null, isBossWave(node) ? "BOSS SIGNAL" : node === wave ? "CURRENT WAVE" : "NOISE WAVE")))), React.createElement("div", {
    className: "tip-card"
  }, React.createElement("small", null, "REAPER TIP"), React.createElement("p", null, "Pr\xE9pare les actions du duo et leurs cibles. La SPE d\xE9termine l\u2019ordre. \xC0 100% de Groove, choisis Sync Burst dans les actions."), React.createElement("a", {
    href: "https://twewy.fandom.com/wiki/TWEWY/Pin_List",
    target: "_blank",
    rel: "noreferrer"
  }, "PIN DATABASE \u2197")))), orderDetail && React.createElement(WishDialog, {
    title: "Ordre du tour",
    close: () => setOrderDetail(null)
  }, (() => {
    const entry = order.find(e => e.key === orderDetail);
    return entry ? React.createElement("p", null, React.createElement("b", null, entry.name), " \xB7 SPE ", entry.speed, React.createElement("br", null), entry.side === "enemy" ? `Attaque → ${entry.target}` : planName(plans[entry.name])) : React.createElement("p", null, "Cette action est termin\xE9e.");
  })(), React.createElement("button", {
    className: "fullscreen-button",
    onClick: () => setOrderDetail(null)
  }, "Fermer")), inspected && React.createElement(WishDialog, {
    title: inspected.name,
    close: () => setInspectedId(null)
  }, React.createElement("div", {
    className: "enemy-inspection"
  }, React.createElement(EnemySprite, {
    kind: inspected.kind,
    boss: inspected.boss
  })), React.createElement("dl", null, React.createElement("dt", null, "Niveau"), React.createElement("dd", null, inspected.level), React.createElement("dt", null, "PV"), React.createElement("dd", null, inspected.hp, " / ", inspected.maxHp), React.createElement("dt", null, "ATK"), React.createElement("dd", null, inspected.attack), React.createElement("dt", null, "SPE"), React.createElement("dd", null, inspected.speed), React.createElement("dt", null, "XP par personnage"), React.createElement("dd", null, inspected.xp), React.createElement("dt", null, "\xC9l\xE9ments"), React.createElement("dd", null, React.createElement(TypeChips, {
    elements: enemyElements[inspected.kind]
  })), React.createElement("dt", null, "Type"), React.createElement("dd", null, inspected.boss ? "Boss" : "Noise")), React.createElement("button", {
    className: "pull-button",
    onClick: () => setInspectedId(null)
  }, "Fermer"), React.createElement("p", null, enemyTraitNames[inspected.trait || "none"])), dropReveal.length > 0 && React.createElement(WishDialog, {
    title: "Butin de combat",
    close: () => setDropReveal([])
  }, React.createElement(RewardReveal, {
    draws: dropReveal,
    close: () => setDropReveal([])
  })), loot.length > 0 && React.createElement("p", {
    role: "status"
  }, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), reward && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal reward-modal"
  }, React.createElement("small", null, "WAVE ", String(wave).padStart(2, "0"), " COMPLETE"), event ? React.createElement(React.Fragment, null, React.createElement("h2", null, wave === 3 ? event.boss : "Vague terminée !"), wave === 3 ? React.createElement(React.Fragment, null, React.createElement("p", null, event.prize === "character" ? `Personnage obtenu · ${event.boss}` : event.prize === "pin" ? signaturePins[event.boss].name : "Aucun butin cette fois."), React.createElement("button", {
    onClick: leave
  }, "Retour aux \xE9v\xE9nements")) : React.createElement("button", {
    onClick: nextWave
  }, wave === 1 ? "Vague suivante" : "Affronter le boss")) : React.createElement(React.Fragment, null, React.createElement("h2", null, wave === maxFloor ? "Étage 100 · Ascension terminée !" : "CHOOSE YOUR DROP"), React.createElement("p", null, "+5 pi\xE8ces \xB7 +", earnedXp, " XP par personnage."), loot.length > 0 && React.createElement("p", null, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), wave < maxFloor ? React.createElement(React.Fragment, null, React.createElement("p", null, difficultyAt(wave + 1).tier > difficultyAt(wave).tier ? "Nouveau palier : soin complet de la Team." : "Les PV sont conservés. Prochain soin au changement de palier."), React.createElement("button", {
    className: "fullscreen-button",
    onClick: nextWave
  }, "Continuer \xB7 \xC9tage ", wave + 1)) : React.createElement("button", {
    className: "fullscreen-button",
    onClick: leave
  }, "Retour \xE0 Team \xB7 Voir les qu\xEAtes")))), teamDefeated && !busy && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal game-over"
  }, React.createElement("small", null, "RUN TERMINATED"), React.createElement("h2", null, "ERASED"), React.createElement("p", null, "You reached wave ", wave, ". The streets will remember your score."), React.createElement("p", null, "La reprise de cette run a \xE9t\xE9 supprim\xE9e."), React.createElement("button", {
    onClick: leave
  }, event ? "Retour aux événements" : "Retour à Team"))));
}
document.addEventListener("click", event => {
  const button = event.target?.closest?.("button");
  if (!button || button.disabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  button.animate([{
    filter: "brightness(1.23)"
  }, {
    filter: "brightness(1)"
  }], {
    duration: 240,
    easing: "ease-out"
  });
}, true);
function SaveBoundary() {
  const [catalogReady, setCatalogReady] = useState(ffbeBestiary.length > 0),
    [catalogError, setCatalogError] = useState(false);
  useEffect(() => {
    if (catalogReady) return;
    let disposed = false;
    const script = document.createElement("script");
    script.src = "./bestiary.js?v=ffbe1";
    script.onload = () => {
      if (disposed) return;
      if (typeof ffbeEnemyList !== "undefined" && ffbeEnemyList.length) {
        ffbeBestiary.push(...ffbeEnemyList);
        registerFfbeEntries();
        setCatalogReady(true);
      } else setCatalogError(true);
    };
    script.onerror = () => {
      if (!disposed) setCatalogError(true);
    };
    document.head.appendChild(script);
    return () => {
      disposed = true;
      script.remove();
    };
  }, [catalogReady]);
  const [status, setStatus] = useState(() => window.ChibiGameSync?.state || {
    ready: true,
    kind: "local",
    message: ""
  });
  useEffect(() => {
    const update = () => setStatus({
      ...window.ChibiGameSync.state
    });
    window.addEventListener("chibi:save-state", update);
    return () => window.removeEventListener("chibi:save-state", update);
  }, []);
  if (!catalogReady) return React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h1", null, "Bestiaire"), React.createElement("p", {
    role: "status"
  }, catalogError ? "Chargement des données indisponible. Ta sauvegarde reste intacte." : "Chargement du bestiaire…"), catalogError && React.createElement("button", {
    onClick: () => location.reload()
  }, "R\xE9essayer")));
  if (!status.ready) return React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h1", null, "Progression"), React.createElement("p", {
    role: "status"
  }, status.message), React.createElement("p", null, "La progression du t\xE9l\xE9phone est prioritaire. Aucune sauvegarde locale n\u2019a \xE9t\xE9 supprim\xE9e."), React.createElement("button", {
    onClick: () => location.reload()
  }, "R\xE9essayer"), React.createElement("a", {
    href: "../app.html",
    target: "_top"
  }, "Retour \xE0 l\u2019application")));
  return React.createElement(React.Fragment, null, status.kind !== "synced" && status.kind !== "saving" && status.message && React.createElement("p", {
    className: "save-sync-notice",
    role: "status"
  }, status.message), React.createElement(App, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SaveBoundary));
