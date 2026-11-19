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
  AERITH: ["grass", "fairy"]
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
  if (pin.id === "buster-sword") return "steel";
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
const enemyKinds = ["frog", "wolf", "jey-pengi", "electro-pengi", "shinigami", "psyche-fox"];
const isBossWave = wave => wave % 5 === 0;
function EnemySprite({
  kind,
  boss
}) {
  const spec = enemyCatalog[kind];
  const canvas = React.useRef(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const atlas = new Image();
    let timer,
      disposed = false,
      frame = 0;
    context.imageSmoothingEnabled = false;
    const draw = () => {
      context.clearRect(0, 0, spec.frameWidth, spec.frameHeight);
      context.drawImage(atlas, frame * spec.frameWidth, 0, spec.frameWidth, spec.frameHeight, 0, 0, spec.frameWidth, spec.frameHeight);
    };
    atlas.onload = () => {
      if (disposed) return;
      draw();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timer = window.setInterval(() => {
          frame = (frame + 1) % spec.frames;
          draw();
        }, 1000 / Math.min(spec.frames, 8));
      }
    };
    atlas.src = `./assets/game/enemy-atlases/${kind}.png`;
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [kind, spec]);
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
    hp: 1 + tier * .44 + tier * tier * .028 + step * .035,
    attack: 1 + tier * .16 + tier * tier * .008 + step * .012,
    xp: 1 + tier * .48 + tier * tier * .025 + step * .04,
    speed: tier * 2 + Math.floor(step / 4),
    bossHp: wave % 10 === 0 ? 2.25 : 1.7,
    bossAttack: wave % 10 === 0 ? 1.25 : 1.12
  };
}
const makeWave = wave => {
  const bossWave = isBossWave(wave);
  const count = bossWave ? wave >= 40 ? 3 : 2 : wave <= 4 ? 2 : wave <= 19 ? 3 : 4;
  const scale = difficultyAt(wave);
  return Array.from({
    length: count
  }, (_, index) => {
    const boss = bossWave && index === 0;
    const kind = boss ? Math.floor(wave / 5) % 2 === 0 ? "psyche-fox" : "shinigami" : enemyKinds[(wave * 3 + index * 2 + Math.floor(wave / 5)) % enemyKinds.length];
    const template = enemyCatalog[kind];
    const maxHp = Math.round(template.hp * scale.hp * (boss ? scale.bossHp : 1));
    return {
      id: wave * 10 + index,
      name: boss ? `${template.name} // BOSS` : template.name,
      kind,
      hp: maxHp,
      maxHp,
      level: wave,
      speed: {
        frog: 9,
        wolf: 23,
        shinigami: 19,
        "jey-pengi": 13,
        "electro-pengi": 17,
        "psyche-fox": 21
      }[kind] + scale.speed,
      xp: Math.round((10 + template.hp * .15) * scale.xp * (boss ? 3 : 1)),
      attack: Math.round(template.attack * scale.attack * (boss ? scale.bossAttack : 1)),
      boss
    };
  });
};
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
const basePsych = {
  NEKU: "pin266",
  SHIKI: "groove-pawn",
  BEAT: "sk8-combo",
  JOSHUA: "joshua-phone",
  CLOUD: "buster-sword",
  AERITH: "healing-wind"
};
const partnerPsychs = [{
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
    "healing-wind": "✿"
  }[pin.id]);
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
  reality: "From another reality"
};
const bases = {
  NEKU: [24, 32, 14],
  SHIKI: [22, 26, 20],
  BEAT: [34, 18, 12],
  JOSHUA: [19, 36, 16],
  CLOUD: [36, 21, 15],
  AERITH: [16, 38, 18]
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
  const levels = progress.level - (f.level || 1);
  return {
    ...f,
    xp: progress.xp,
    level: progress.level,
    atk: f.atk + levels * 2,
    mag: f.mag + levels * 2,
    speed: f.speed + levels,
    maxHp: f.maxHp + levels * 5,
    hp: f.hp > 0 ? f.hp + levels * 5 : 0
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
function trained(f, xp, awake) {
  const progress = experience(xp),
    n = progress.level - 1,
    [atk, mag, speed] = bases[f.name];
  const maxHp = f.maxHp + n * 5 + (awake ? 20 : 0);
  return {
    ...f,
    xp: progress.xp,
    level: progress.level,
    atk: atk + n * 2,
    mag: mag + n * 2,
    speed: speed + n,
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
    const pins = [...new Set(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}).flat())].filter(id => psychs[id]?.row >= 0);
    const copies = Object.fromEntries(owned.map(name => {
      const value = saved.copies?.[name];
      const count = value !== undefined && Number.isFinite(Number(value)) ? Math.min(5, Math.max(0, Math.floor(Number(value)))) : saved.awakened?.includes(name) || Number(saved.levels?.[name]) === 5 ? 5 : 0;
      return [name, count];
    }));
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 10 ? saved.wishStep : 0;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return assignBasePsychs({
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
    });
  } catch {}
  return assignBasePsychs({
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
  });
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
    start = dayIndex(freeWishStartDay);
  if (end < start) return p;
  const previous = dayIndex(p.lastFreeWishDay);
  if (Number.isFinite(previous) && previous > end) return p;
  if (today >= freeWishNoStackDay) {
    if (p.lastFreeWishDay !== today) return {
      ...p,
      freeWishes: 3,
      lastFreeWishDay: today,
      starterWishesGranted: true
    };
    return p.starterWishesGranted ? p : {
      ...p,
      freeWishes: Math.min(3, p.freeWishes),
      starterWishesGranted: true
    };
  }
  const days = Number.isFinite(previous) ? Math.max(0, end - Math.max(previous, start - 1)) : end - start + 1;
  const starter = p.starterWishesGranted ? 0 : 10;
  return days > 0 || starter > 0 ? {
    ...p,
    freeWishes: p.freeWishes + days * 3 + starter,
    lastFreeWishDay: today,
    starterWishesGranted: true
  } : p;
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
  const names = id === "reality" ? ["CLOUD", "AERITH"] : id === "shibuya" ? ["NEKU", "SHIKI"] : ["NEKU", "SHIKI", "BEAT", "JOSHUA"];
  return characterRoster.filter(f => names.includes(f.name));
}
function portalPool(id, _profile) {
  const roster = portalRoster(id);
  return id === "partners" ? [...roster, ...roster.filter(f => ["BEAT", "JOSHUA"].includes(f.name))] : roster;
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
  }, pin ? React.createElement(React.Fragment, null, React.createElement("b", null, pin.grade === "---" ? "Sans classe" : `Classe ${pin.grade}`), React.createElement("span", null, uses[pin.kind], " \xB7 ", pin.cost, " EN")) : "rank" in draw && React.createElement(React.Fragment, null, React.createElement(RankBadge, {
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
  }, React.createElement("b", null, inspect.name.replace(" (Pin)", "")), " \xB7 ", types[inspect.kind], " \xB7 ", inspect.cost, " EN ", React.createElement(TypeChips, {
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
  owned
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const collected = pinList.filter(pin => owned.includes(pin.id));
  const pages = Math.ceil(pinList.length / 16);
  const move = delta => {
    setPage(page + delta);
    setSelected(null);
  };
  return React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => {
      setPage(0);
      setSelected(null);
      setOpen(true);
    }
  }, "Catalogue des badges"), open && React.createElement(WishDialog, {
    className: "badge-book",
    title: "Badges",
    close: () => setOpen(false)
  }, React.createElement("div", {
    className: "badge-counter"
  }, collected.length, " / ", pinList.length, " obtenus"), React.createElement("div", {
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
  }, React.createElement("b", null, "#", selected.number, " ", selected.name), " \xB7 ", types[selected.kind], " \xB7 ", selected.cost, " EN ", React.createElement(TypeChips, {
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
  }, "\u203A")), React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer"), React.createElement("small", null, "Visuels DS \xB7 NightOwl35. Donn\xE9es \xB7 TWEWY Wiki.")));
}
const maxFloor = 100;
function questsFor(p) {
  const badges = new Set(p.pins.filter(id => psychs[id]?.row >= 0)).size;
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
    length: Math.floor(pinList.length / 10)
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
  save
}) {
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
  return React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setOpen(true)
  }, "Qu\xEAtes", ready.length ? ` · ${ready.length}` : ""), open && React.createElement(WishDialog, {
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
  }, "Tout r\xE9cup\xE9rer \xB7 ", ready.reduce((sum, q) => sum + q.reward, 0), " pi\xE8ces"), React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer"))));
}
function combatFingerprint(p) {
  return JSON.stringify([p.owned, p.equipped, p.loadout, p.xp, p.awakened, p.levels]);
}
function App() {
  const [profile, displayProfile] = useState(loadProfile);
  const profileRef = React.useRef(profile);
  profileRef.current = profile;
  const runSignature = React.useRef(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [battleLoadout, setBattleLoadout] = useState({});
  const [party, setParty] = useState(null);
  const [result, setResult] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [portal, setPortal] = useState("shibuya");
  const [phase, setPhase] = useState("ready");
  const turning = React.useRef(false);
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
    const next = assignBasePsychs(update(accrueDailyWishes(current)));
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
  const price = wishCost(profile);
  const openWish = (id, count) => {
    setQuantity(count);
    setPortal(id);
    setPhase("confirm");
  };
  const pool = portalPool(portal, profile);
  const guaranteed = profile.wishStep === 9;
  const percent = v => v.toLocaleString("fr-FR", {
    style: "percent",
    maximumFractionDigits: 3
  });
  const portalName = portal === "shibuya" ? "First Week #1" : portals[portal];
  const closeDialog = () => setPhase("ready");
  const recruit = (id, count) => {
    if (turning.current) return;
    const draws = [];
    setProfile(p => {
      if (p.coins !== profile.coins || wishCost(p, count) !== price || p.coins < price) return p;
      const quote = wishQuote(p, count);
      const next = {
        ...p,
        wishesMade: p.wishesMade + count,
        freeWishes: p.freeWishes - quote.free,
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
  if (party) return React.createElement(Battle, {
    initialTeam: party,
    loadout: battleLoadout,
    coins: profile.coins,
    onDrops: ids => setProfile(p => ({
      ...p,
      pins: [...new Set([...p.pins, ...ids])]
    })),
    onExperience: amount => setProfile(p => ({
      ...p,
      xp: {
        ...p.xp,
        ...Object.fromEntries(party.map(f => [f.name, experience((p.xp[f.name] || 0) + amount).xp]))
      }
    })),
    onReach: floor => setProfile(p => ({
      ...p,
      hasPlayed: true,
      bestFloor: Math.max(p.bestFloor, Math.min(100, floor))
    })),
    onVictory: floor => setProfile(p => ({
      ...p,
      coins: p.coins + 5,
      hasPlayed: true,
      bestFloor: Math.max(p.bestFloor, Math.min(100, floor)),
      floorRecoveryAvailable: p.floorRecoveryAvailable && floor < 10
    })),
    leave: () => {
      runSignature.current = null;
      setParty(null);
      setResult([]);
    }
  });
  if (gachaView) return React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h2", null, "Bingo Kai"), React.createElement("p", null, profile.coins, " pi\xE8ces \xB7 ", profile.owned.length, " / ", characterRoster.length, " personnages d\xE9bloqu\xE9s \xB7 Garantie dans ", 10 - profile.wishStep, " ", profile.wishStep === 9 ? "vœu" : "vœux"), React.createElement("div", {
    className: "lobby-tools"
  }, React.createElement(BadgeCatalogue, {
    owned: profile.pins
  }), React.createElement(QuestMenu, {
    profile: profile,
    save: setProfile
  })), React.createElement("p", {
    className: "daily-wishes"
  }, "V\u0153ux gratuits \xB7 ", React.createElement("b", null, profile.freeWishes), React.createElement("small", null, parisDay() >= freeWishNoStackDay ? "3 par jour · Renouvelés à minuit (Paris)" : "10 de départ + 3 par jour · Cumul jusqu’au 24/11 inclus")), React.createElement("div", {
    className: "portal-list"
  }, Object.entries(portals).map(([id, title]) => React.createElement("article", {
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
  })), id === "partners" && React.createElement("div", {
    className: "portal-duo"
  }, characterRoster.filter(f => ["BEAT", "JOSHUA"].includes(f.name)).map(f => React.createElement(Sprite, {
    key: f.name,
    fighter: f
  }))), React.createElement("h3", null, id === "shibuya" ? "First Week #1" : title), React.createElement("button", {
    className: "portal-rates",
    onClick: () => {
      setPortal(id);
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
    disabled: phase !== "ready" || profile.coins < wishCost(profile, n),
    onClick: () => openWish(id, n)
  }, React.createElement("strong", null, n, " ", n === 1 ? "vœu" : "vœux")), React.createElement("span", {
    className: "wish-price",
    id: `wish-price-${id}-${n}`,
    "aria-label": `${wishCost(profile, n)} pièces requises`
  }, React.createElement(Icon, {
    name: "coin"
  }), React.createElement("span", null, "\xD7 ", wishCost(profile, n).toLocaleString("fr-FR"))), wishQuote(profile, n).free > 0 && React.createElement("small", {
    className: "wish-free"
  }, wishQuote(profile, n).free, " gratuit", wishQuote(profile, n).free > 1 ? "s" : "", " inclus")))), React.createElement("p", {
    className: "portal-caption"
  }, id === "shibuya" ? "Retrouve Neku, Shiki et les badges psych de Shibuya." : id === "reality" ? "Cloud, Aerith et les badges psych · Des alliés venus d’une autre réalité." : "Beat et Joshua ont 2 fois plus de chances d’être recrutés que les autres personnages disponibles."))))), phase === "rates" && React.createElement(WishDialog, {
    key: "rates",
    title: `Taux · ${portalName}`,
    close: closeDialog
  }, React.createElement("p", null, "V\u0153u ordinaire \xB7 ", percent(characterChance), " personnage, ", percent(1 - characterChance), " badge. Chaque 10e v\u0153u garantit un personnage."), React.createElement("h3", null, "Prochain v\u0153u", guaranteed ? " · garanti" : ""), React.createElement("ul", null, portalRoster(portal).map(f => React.createElement("li", {
    key: f.name
  }, f.name, React.createElement("b", null, percent(pool.filter(x => x.name === f.name).length / pool.length * (guaranteed ? 1 : characterChance))))), React.createElement("li", null, "Badges psych", React.createElement("b", null, percent(guaranteed ? 0 : 1 - characterChance)))), React.createElement("p", null, "Les ", pinList.length, " badges sont \xE9quiprobables. Les taux par personnage sont fixes : obtenir un personnage ou l\u2019\xE9veiller ne modifie pas sa probabilit\xE9."), React.createElement("button", {
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
        setPhase("reveal");
      }
    }
  }, React.createElement(Capsule, null)))), React.createElement("p", {
    "aria-live": "polite"
  }, phase === "crank" ? "Appuie sur la manivelle." : phase === "spin" ? "La manivelle tourne…" : "La capsule tombe…"))), phase === "ready" && profile.owned.map(name => React.createElement("div", {
    className: "bingo-member",
    key: name
  }, React.createElement(RankBadge, {
    level: profile.levels[name]
  }), React.createElement("b", null, name), React.createElement("span", null, profile.copies[name] || 0, "/5 doublons"), profile.awakened.includes(name) ? React.createElement("span", null, "\xC9veill\xE9 \xB7 +20 PV") : profile.levels[name] === 5 && React.createElement("button", {
    onClick: () => awaken(name)
  }, "\xC9veiller \xB7 +20 PV"))), saveError && React.createElement("p", {
    role: "alert"
  }, "Sauvegarde locale indisponible.")));
  return React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h1", null, "Team"), React.createElement("div", {
    className: "team-slots"
  }, profile.equipped.map((name, index) => {
    const fighter = characterRoster.find(f => f.name === name);
    const stats = fighter && trained(fighter, profile.xp[name] || 0, profile.awakened.includes(name));
    return React.createElement("button", {
      key: index,
      "aria-label": `Emplacement ${index + 1} · ${name || "Choisir un personnage"}`,
      onClick: () => setEditingSlot(index)
    }, fighter && stats ? React.createElement(React.Fragment, null, React.createElement(Sprite, {
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
  }, React.createElement(Sprite, {
    fighter: f
  }), React.createElement("strong", null, f.name), profile.equipped[1 - editingSlot] === f.name && React.createElement("small", null, "D\xE9j\xE0 \xE9quip\xE9")))), React.createElement("div", {
    className: "dialog-actions"
  }, profile.equipped[editingSlot] && React.createElement("button", {
    onClick: () => chooseFighter("")
  }, "Retirer"), React.createElement("button", {
    onClick: () => setEditingSlot(null)
  }, "Fermer"))), React.createElement("div", {
    className: "lobby-tools"
  }, React.createElement(BadgeCatalogue, {
    owned: profile.pins
  }), React.createElement(QuestMenu, {
    profile: profile,
    save: setProfile
  })), fighters.map(name => React.createElement(PsychEquipment, {
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
  })), fighters.length === 2 && !fighters.some(name => profile.loadout[name]?.some(offensive)) && React.createElement("p", null, "\xC9quipe au moins un psych offensif."), React.createElement("button", {
    className: "pull-button",
    disabled: fighters.length !== 2 || !fighters.every(name => profile.loadout[name]?.length) || !fighters.some(name => profile.loadout[name]?.some(offensive)),
    onClick: () => {
      setProfile(p => ({
        ...p,
        hasPlayed: true,
        bestFloor: Math.max(1, p.bestFloor)
      }));
      runSignature.current = combatFingerprint(profile);
      setBattleLoadout(Object.fromEntries(fighters.map(name => [name, [...profile.loadout[name]]])));
      setParty(fighters.map(name => {
        const f = characterRoster.find(f => f.name === name);
        return trained(f, profile.xp[name] || 0, profile.awakened.includes(name));
      }));
    }
  }, "Lancer le roguelike"), saveError && React.createElement("p", {
    role: "alert"
  }, "La sauvegarde locale est indisponible dans ce navigateur.")));
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
    image.onload = () => {
      if (disposed || !context) return;
      const sample = document.createElement("canvas");
      sample.width = width;
      sample.height = height;
      const scan = sample.getContext("2d");
      scan.drawImage(image, 0, 0, width, height, 0, 0, width, height);
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
      context.drawImage(image, x, top, crop, crop, 0, 0, 64, 64);
    };
    image.src = enemy ? `./assets/game/enemy-atlases/${enemy.kind}.png` : fighter.sprite;
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
    target: living[(turn - 1 + i) % living.length]?.name
  }))].sort((a, b) => b.speed - a.speed || (a.side === b.side ? 0 : a.side === "ally" ? -1 : 1));
}
const planCost = plan => plan?.kind === "psych" ? psychs[plan.pin]?.cost || 0 : 0;
const planName = plan => !plan ? "Choisir une action" : plan.kind === "guard" ? "Défense" : plan.kind === "burst" ? "Sync Burst" : psychs[plan.pin].name;
function Battle({
  initialTeam,
  loadout,
  coins,
  onDrops,
  onExperience,
  onReach,
  onVictory,
  leave
}) {
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
  const awarded = React.useRef(new Set());
  const clearedWave = React.useRef(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [wave, setWave] = useState(1);
  const [team, setTeam] = useState(initialTeam);
  const [enemies, setEnemies] = useState(() => makeWave(1));
  const [selected, setSelected] = useState(10);
  const [energy, setEnergy] = useState(3);
  const [groove, setGroove] = useState(28);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Choisis 1 action par personnage, puis lance le tour.");
  const [busy, setBusy] = useState(false);
  const [hitFeedback, setHitFeedback] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loot, setLoot] = useState([]);
  const [dropReveal, setDropReveal] = useState([]);
  const [reward, setReward] = useState(false);
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
  const resolveRound = async () => {
    if (running.current || busy || reward || !ready) return;
    running.current = true;
    const token = generation.current;
    const steps = turnOrder(team, enemies, turn);
    const choices = {
      ...plans
    };
    let fighters = team.map(f => ({
        ...f
      })),
      monsters = enemies.map(e => ({
        ...e
      })),
      en = energy - reserved,
      sync = groove;
    const shields = new Set();
    const performed = new Set();
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
    const hasPassive = pattern => fighters.some(f => f.hp > 0 && (loadout[f.name] || []).some(id => pattern.test(psychs[id].psych)));
    setBusy(true);
    setQueue(steps);
    setEnergy(en);
    for (let index = 0; index < steps.length; index++) {
      if (token !== generation.current) return;
      if (!monsters.some(e => e.hp > 0) || !fighters.some(f => f.hp > 0)) break;
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
        const damage = Math.random() < Math.min(.30, (target.speed || 0) / 200) ? 0 : typedDamage(Math.max(3, Math.round(attacker.attack * (shields.has(target.name) ? .45 : 1))), attackType, characterElements[target.name]);
        setHitFeedback({
          side: "ally",
          target: target.name,
          label: scale === 0 ? "Sans effet" : `${damage} PV · ${affinityText(scale)}`
        });
        fighters = fighters.map(f => f.name === target.name ? {
          ...f,
          hp: Math.max(0, f.hp - damage)
        } : f);
        sync = Math.min(100, sync + 12);
        setMessage(damage ? `${attacker.name} attaque ${target.name} · −${damage} PV` : `${target.name} esquive ${attacker.name}.`);
      } else {
        const fighter = fighters.find(f => f.name === step.name);
        const plan = choices[step.name];
        if (fighter.hp <= 0) continue;
        performed.add(fighter.name);
        setActor(fighter.name);
        if (plan.kind === "guard") {
          shields.add(fighter.name);
          en = Math.min(3, en + 1);
          setActiveAction("guard");
          setMessage(`${fighter.name} se protège jusqu’à la fin du tour · +1 EN`);
        } else if (plan.kind === "burst") {
          sync = 0;
          monsters = monsters.map(e => ({
            ...e,
            hp: Math.max(0, e.hp - typedDamage(58, "normal", enemyElements[e.kind]))
          }));
          setActiveAction("burst");
          setMessage(`${fighter.name} · Sync Burst · 58 dégâts sur tous les ennemis !`);
        } else {
          const pin = psychs[plan.pin];
          if (pin.kind === "heal") {
            const amount = Math.max(1, Math.round((fighter.mag || 1) * pin.power / 50 * (hasPassive(/^Cure Boost/) ? 1.3 : 1)));
            healParty(amount);
            setActiveAction("heal");
            setMessage(`${fighter.name} · ${pin.name} · +${amount} PV au duo`);
          } else if (pin.kind === "guard" || pin.kind === "support") {
            fighters.filter(f => f.hp > 0).forEach(f => shields.add(f.name));
            if (pin.kind === "support") {
              if (/Turbo|Supply/.test(pin.psych)) en = Math.min(3, en + 2);else if (/Cure Boost|Subconscious|Life/.test(pin.psych)) healParty(Math.ceil((fighter.mag || 1) / 2));else sync = Math.min(100, sync + 18);
            }
            setActiveAction("guard");
            setMessage(`${fighter.name} · ${pin.name} · Duo protégé pour ce tour`);
          } else {
            const target = monsters.find(e => e.id === plan.target && e.hp > 0) || monsters.find(e => e.hp > 0);
            const physical = pin.kind === "physical";
            const amount = Math.round((physical ? fighter.atk || 1 : fighter.mag || 1) * (.7 + pin.power / 100));
            const scale = effectiveness(pin.element, enemyElements[target.kind]);
            const damage = typedDamage(Math.max(1, Math.round(amount * (hasPassive(/^Resonance/) ? 1.15 : 1)) + Math.floor(Math.random() * 7) - 3), pin.element, enemyElements[target.kind]);
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
          onExperience(earned);
          fighters = fighters.map(f => gainExperience(f, earned));
        }
        const found = defeated.filter(() => Math.random() < .25).map(() => pick(pinList));
        if (found.length) {
          drops.push(...found);
          onDrops(found.map(pin => pin.id));
        }
      }
      publish();
      await pause();
    }
    if (token !== generation.current) return;
    const unused = Object.entries(choices).reduce((sum, [name, plan]) => sum + (performed.has(name) ? 0 : planCost(plan)), 0);
    en = Math.min(3, en + unused + 2);
    publish();
    resetPlanning();
    if (xp) setEarnedXp(old => old + xp);
    if (drops.length) {
      setLoot(old => [...old, ...drops.map(pin => pin.name)]);
      setDropReveal(drops.map(pin => ({
        pin
      })));
    }
    if (!monsters.some(e => e.hp > 0)) {
      if (!clearedWave.current) {
        clearedWave.current = true;
        onVictory(wave);
        setReward(true);
      }
      setMessage("Vague terminée !");
    } else if (fighters.some(f => f.hp > 0)) {
      setTurn(old => old + 1);
      setMessage("Choisis 1 action par personnage, puis lance le tour.");
    }
    setBusy(false);
    running.current = false;
  };
  const nextWave = boost => {
    if (wave >= maxFloor) return;
    if (boost === "vitality") {
      setTeam(current => current.map(fighter => ({
        ...fighter,
        maxHp: fighter.maxHp + 18,
        hp: fighter.maxHp + 18
      })));
    } else if (boost === "power") {
      setGroove(value => Math.min(100, value + 35));
      setTeam(current => current.map(fighter => ({
        ...fighter,
        hp: fighter.maxHp
      })));
    } else {
      setEnergy(3);
      setTeam(current => current.map(fighter => ({
        ...fighter,
        hp: fighter.maxHp
      })));
    }
    const next = wave + 1;
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
    onReach(next);
    setTurn(1);
    setEnemies(makeWave(next));
    setSelected(next * 10);
    setReward(false);
    setMessage(isBossWave(next) ? `Wave ${next}. A boss Noise is closing in.` : `Wave ${next}. New Noise closing in.`);
  };
  const teamDefeated = team.every(fighter => fighter.hp <= 0);
  const routeStart = Math.floor((wave - 1) / 5) * 5 + 1;
  const sector = Math.floor((wave - 1) / 5) + 1;
  const retry = () => {
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
    setWave(1);
    setTurn(1);
    const saved = loadProfile();
    setTeam(initialTeam.map(f => trained(characterRoster.find(base => base.name === f.name), saved.xp[f.name] || 0, saved.awakened.includes(f.name))));
    setEnemies(makeWave(1));
    setSelected(10);
    setEnergy(3);
    setGroove(28);
    setMessage("Choisis 1 action par personnage, puis lance le tour.");
  };
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
    onClick: () => {
      if (window.confirm("Quitter cette partie et revenir au duo ?")) leave();
    }
  }, "Mon duo"), React.createElement("button", {
    className: "sound-button",
    "aria-label": "Sound settings"
  }, React.createElement("i", null), React.createElement("i", null), React.createElement("i", null)))), React.createElement("section", {
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
  }, React.createElement("div", null, React.createElement("small", null, "ENCOUNTER"), React.createElement("h1", null, "\xC9TAGE ", String(wave).padStart(2, "0"), " ", React.createElement("small", {
    className: "tier-label"
  }, "Palier ", difficultyAt(wave).tier, " / 10"))), React.createElement("div", {
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
    boss: enemy.boss
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
    onClick: resolveRound
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
  }, "Fermer")), dropReveal.length > 0 && React.createElement(WishDialog, {
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
  }, React.createElement("small", null, "WAVE ", String(wave).padStart(2, "0"), " COMPLETE"), React.createElement("h2", null, wave === maxFloor ? "Étage 100 · Ascension terminée !" : "CHOOSE YOUR DROP"), React.createElement("p", null, "+5 pi\xE8ces \xB7 +", earnedXp, " XP par personnage."), loot.length > 0 && React.createElement("p", null, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), wave < maxFloor ? React.createElement("div", {
    className: "reward-grid"
  }, React.createElement("button", {
    onClick: () => nextWave("power")
  }, React.createElement(Icon, {
    name: "bolt"
  }), React.createElement("b", null, "HOT STREAK"), React.createElement("span", null, "Start with +35 Groove")), React.createElement("button", {
    onClick: () => nextWave("vitality")
  }, React.createElement(Icon, {
    name: "heart"
  }), React.createElement("b", null, "SECOND WIND"), React.createElement("span", null, "Max HP +18")), React.createElement("button", {
    onClick: () => nextWave("energy")
  }, React.createElement(Icon, {
    name: "star"
  }), React.createElement("b", null, "FULL CHARGE"), React.createElement("span", null, "Restore HP & Energy"))) : React.createElement("button", {
    className: "fullscreen-button",
    onClick: leave
  }, "Retour \xE0 Team \xB7 Voir les qu\xEAtes"))), teamDefeated && !busy && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal game-over"
  }, React.createElement("small", null, "RUN TERMINATED"), React.createElement("h2", null, "ERASED"), React.createElement("p", null, "You reached wave ", wave, ". The streets will remember your score."), React.createElement("button", {
    onClick: retry
  }, "RESTART RUN"), React.createElement("button", {
    onClick: leave
  }, "Changer de duo"))));
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
