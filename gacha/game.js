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
// Modern 18-type chart: attacker -> [super effective, resisted, immune].
// https://ph.portal-pokemon.com/game/type-chart/
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
  GLADIO: ["rock", "fighting"],
  X: ["steel", "electric"],
  SONIC: ["normal", "electric"],
  ZERO: ["steel", "fire"],
  SHADOW: ["dark", "psychic"],
  KNUCKLES: ["fighting", "ground"],
  TAILS: ["flying", "electric"],
  MARLUXIA: ["grass", "dark"],
  LEXAEUS: ["rock", "fighting"],
  AXEL: ["fire", "dark"],
  LARXENE: ["electric", "dark"]
};
const characterPassives = {
  NEKU: { name: "Psych Sync", description: "Ses psychs frappent 10 % plus fort.", damageKind: "special", damageBonus: .10 },
  SHIKI: { name: "Mr. Mew protecteur", description: "Les soins de Shiki rendent 15 % de PV supplémentaires.", healing: .15 },
  BEAT: { name: "Street Brawler", description: "Ses attaques physiques infligent 10 % de dégâts supplémentaires.", damageKind: "physical", damageBonus: .10 },
  JOSHUA: { name: "Contrôle du temps", description: "Sa maîtrise du temps lui donne 12 % de chances d’esquiver une attaque.", dodge: .12 },
  CLOUD: { name: "Bravoure désespérée", description: "Sous la moitié de ses PV, ses attaques physiques gagnent 20 % de puissance.", damageKind: "physical", damageBonus: .20, damageCondition: "lowHp" },
  AERITH: { name: "Vent guérisseur", description: "Les soins d’Aerith rendent 20 % de PV supplémentaires.", healing: .20 },
  "2B": { name: "Protocole YoRHa", description: "Son blindage réduit de 10 % les dégâts reçus.", defense: .10 },
  A2: { name: "Mode berserk", description: "Sous la moitié de ses PV, ses attaques infligent 20 % de dégâts supplémentaires.", damageKind: "all", damageBonus: .20, damageCondition: "lowHp" },
  SORA: { name: "Liens du cœur", description: "Tant que son partenaire tient debout, ses attaques gagnent 10 % de puissance.", damageKind: "all", damageBonus: .10, damageCondition: "partnerAlive" },
  RIKU: { name: "Gardien des ténèbres", description: "Sa résistance aux ténèbres réduit de 12 % les dégâts reçus.", defense: .12 },
  NOCTIS: { name: "Roi éveillé", description: "Son Sync Burst inflige 15 % de dégâts supplémentaires.", damageKind: "burst", damageBonus: .15 },
  PROMPTO: { name: "Tir précis", description: "Ses psychs infligent 12 % de dégâts supplémentaires.", damageKind: "special", damageBonus: .12 },
  IGNIS: { name: "Stratège royal", description: "Sa préparation réduit de 10 % les dégâts qu’il reçoit.", defense: .10 },
  GLADIO: { name: "Bouclier du roi", description: "Réduit de 16 % les dégâts qu’il reçoit.", defense: .16 },
  X: { name: "Tir chargé", description: "Ses psychs infligent 10 % de dégâts supplémentaires.", damageKind: "special", damageBonus: .10 },
  SONIC: { name: "Vitesse supersonique", description: "Sa vitesse lui donne 15 % de chances d’esquiver une attaque.", dodge: .15 },
  ZERO: { name: "Z-Saber", description: "Ses attaques physiques infligent 12 % de dégâts supplémentaires.", damageKind: "physical", damageBonus: .12 },
  SHADOW: { name: "Chaos Control", description: "Le Chaos Control lui donne 12 % de chances d’esquiver une attaque.", dodge: .12 },
  KNUCKLES: { name: "Poings de l’échidné", description: "Ses attaques physiques infligent 15 % de dégâts supplémentaires.", damageKind: "physical", damageBonus: .15 },
  TAILS: { name: "Génie mécanicien", description: "Ses soins rendent 15 % de PV supplémentaires.", healing: .15 },
  MARLUXIA: { name: "Faucheur floral", description: "Ses psychs infligent 12 % de dégâts supplémentaires.", damageKind: "special", damageBonus: .12 },
  LEXAEUS: { name: "Puissance terrestre", description: "Ses attaques physiques infligent 18 % de dégâts supplémentaires.", damageKind: "physical", damageBonus: .18 },
  AXEL: { name: "Rafale de flammes", description: "Ses psychs infligent 12 % de dégâts supplémentaires.", damageKind: "special", damageBonus: .12 },
  LARXENE: { name: "Éclair fulgurant", description: "Ses psychs infligent 10 % de dégâts supplémentaires.", damageKind: "special", damageBonus: .10 }
};
function passiveDamageMultiplier(name, kind, hp, maxHp, partnerAlive = true) {
  const passive = characterPassives[name];
  if (!passive?.damageBonus || passive.damageKind !== kind && passive.damageKind !== "all") return 1;
  if (passive.damageCondition === "lowHp" && (hp === undefined || maxHp === undefined || hp / maxHp > .5)) return 1;
  if (passive.damageCondition === "partnerAlive" && !partnerAlive) return 1;
  return 1 + passive.damageBonus;
}
function passiveDamageReduction(name) { return characterPassives[name]?.defense || 0; }
function passiveDodgeChance(name) { return characterPassives[name]?.dodge || 0; }
function passiveHealingMultiplier(name) { return 1 + (characterPassives[name]?.healing || 0); }
function deterministicChance(chance, key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return (hash >>> 0) / 4294967296 < chance;
}
function stabMultiplier(fighter, pin) {
  return ["physical", "special"].includes(pin.kind) && characterElements[fighter.name]?.includes(pin.element || badgeElement(pin)) ? 1.2 : 1;
}
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
  const signatureElements = {
    "x-buster": "electric",
    "sonic-wind": "flying",
    "z-saber": "steel",
    "chaos-spear": "psychic",
    "meteor-punch": "fighting",
    "energy-ball": "electric",
    "graceful-dahlia": "grass",
    skysplitter: "rock",
    "eternal-flames": "fire",
    "fulgurant-lightning": "electric"
  };
  if (signatureElements[pin.id.replace(/^signature-/, "")]) return signatureElements[pin.id.replace(/^signature-/, "")];
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
  return /*#__PURE__*/React.createElement("span", {
    className: "type-chips"
  }, elements.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: `element element-${t}`
  }, elementNames[t])));
}
const characterRoster = [{
  name: "X",
  role: "MAVERICK HUNTER",
  hp: 140,
  maxHp: 140,
  sprite: "./assets/game/x-idle.png",
  accent: "#39a7ff",
  frames: 10,
  frameWidth: 122,
  frameHeight: 116
}, {
  name: "SONIC",
  role: "SPEED HERO",
  hp: 118,
  maxHp: 118,
  sprite: "./assets/game/sonic-idle.png",
  accent: "#176cff",
  frames: 7,
  frameWidth: 152,
  frameHeight: 156
}, {
  name: "ZERO",
  role: "MAVERICK HUNTER",
  hp: 136,
  maxHp: 136,
  sprite: "./assets/game/zero-idle.png",
  accent: "#ff3b32",
  frames: 4,
  frameWidth: 177,
  frameHeight: 168
}, {
  name: "SHADOW",
  role: "ULTIMATE LIFEFORM",
  hp: 128,
  maxHp: 128,
  sprite: "./assets/game/shadow-idle.png",
  accent: "#d9273e",
  frames: 6,
  frameWidth: 213,
  frameHeight: 204
}, {
  name: "KNUCKLES",
  role: "GUARDIAN",
  hp: 148,
  maxHp: 148,
  sprite: "./assets/game/knuckles-idle.png",
  accent: "#ed3037",
  frames: 6,
  frameWidth: 178,
  frameHeight: 194
}, {
  name: "TAILS",
  role: "MECHANIC",
  hp: 110,
  maxHp: 110,
  sprite: "./assets/game/tails-idle.png",
  accent: "#ffb52f",
  frames: 9,
  frameWidth: 130,
  frameHeight: 90
}, {
  name: "MARLUXIA",
  role: "ORGANISATION XIII",
  hp: 132,
  maxHp: 132,
  sprite: "./assets/game/marluxia-idle.png",
  accent: "#e980b6",
  frames: 4,
  frameWidth: 296,
  frameHeight: 292
}, {
  name: "LEXAEUS",
  role: "ORGANISATION XIII",
  hp: 160,
  maxHp: 160,
  sprite: "./assets/game/lexaeus-idle.png",
  accent: "#c36b38",
  frames: 8,
  frameWidth: 174,
  frameHeight: 204
}, {
  name: "AXEL",
  role: "ORGANISATION XIII",
  hp: 138,
  maxHp: 138,
  sprite: "./assets/game/axel-idle.png",
  accent: "#ff4e32",
  frames: 6,
  frameWidth: 217,
  frameHeight: 170
}, {
  name: "LARXENE",
  role: "ORGANISATION XIII",
  hp: 112,
  maxHp: 112,
  sprite: "./assets/game/larxene-idle.png",
  accent: "#ffe43b",
  frames: 5,
  frameWidth: 198,
  frameHeight: 369
}, {
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
  portraitTop: 5
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
  portraitTop: 5
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
  portraitTop: 6
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
  portraitTop: 7
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
  frames: 6,
  frameWidth: 32,
  frameHeight: 72,
  portraitCenter: 16,
  portraitTop: 0
}];
// Visible opaque bounds of the idle frames. Source sheets use very different
// resolutions and transparent margins, so native pixels cannot define size.
const fighterVisualBounds = {
  X: [70, 92],
  SONIC: [104, 132],
  ZERO: [129, 144],
  SHADOW: [155, 180],
  KNUCKLES: [130, 170],
  TAILS: [82, 66],
  MARLUXIA: [248, 268],
  LEXAEUS: [124, 180],
  AXEL: [169, 146],
  LARXENE: [140, 345],
  NOCTIS: [42, 66],
  PROMPTO: [42, 66],
  IGNIS: [42, 68],
  GLADIO: [65, 73],
  "2B": [119, 142],
  A2: [96, 128],
  SORA: [108, 102],
  RIKU: [89, 103],
  CLOUD: [86, 92],
  AERITH: [75, 90],
  NEKU: [46, 98],
  BEAT: [71, 94],
  SHIKI: [45, 92],
  JOSHUA: [27, 56]
};
// Each source sheet has different transparent margins. Bounds below normalize
// them; this common multiplier then keeps every fighter at one visual scale.
const fighterDisplayScale = {};
const fighterRenderScale = name => fighterDisplayScale[name] ?? .9;
// Eos is scheduled for a later reveal: retain its data and portals, but do not expose it yet.
const hiddenCollectionAndEventCharacters = new Set(["NOCTIS", "PROMPTO", "IGNIS", "GLADIO"]);
const secondWaveReleaseAt = Date.parse("2026-12-01T00:00:00+01:00");
const secondWaveCharacters = new Set(["X", "SONIC", "ZERO", "SHADOW", "KNUCKLES", "TAILS", "MARLUXIA", "LEXAEUS", "AXEL", "LARXENE"]);
const characterReleaseWave = Object.freeze(Object.fromEntries(characterRoster.map(fighter => [fighter.name, secondWaveCharacters.has(fighter.name) ? 2 : 1])));
// Wave 1 stays viable; Wave 2 gets a measured baseline advantage before rank,
// level, types and psychs are applied.
const powerCreepMultiplier = name => characterReleaseWave[name] >= 2 ? 1.08 : .92;
const visibleCollectionRoster = () => characterRoster.filter(f => !hiddenCollectionAndEventCharacters.has(f.name) && (!secondWaveCharacters.has(f.name) || Date.now() >= secondWaveReleaseAt));
const Icon = ({
  name
}) => {
  const paths = {
    bolt: /*#__PURE__*/React.createElement("path", {
      d: "m13 2-8 11h6l-1 9 8-12h-6l1-8Z"
    }),
    target: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "8"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 2v3M22 12h-3M12 22v-3M2 12h3"
    })),
    heart: /*#__PURE__*/React.createElement("path", {
      d: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
    }),
    guard: /*#__PURE__*/React.createElement("path", {
      d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
    }),
    coin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "9"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 .8-3 2s1 1.8 3 2.2 3 1 3 2.3-1.3 2.5-3 2.5c-1.4 0-2.5-.4-3.2-1.2M12 5v14"
    })),
    star: /*#__PURE__*/React.createElement("path", {
      d: "m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z"
    })
  };
  return /*#__PURE__*/React.createElement("svg", {
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
  return /*#__PURE__*/React.createElement("canvas", {
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
  const nightmare = Math.max(0, wave - 49);
  const hpWall = nightmare ? 1.8 + (nightmare - 1) * .035 : 1;
  const attackWall = nightmare ? 1.55 + (nightmare - 1) * .025 : 1;
  return {
    tier: tier + 1,
    hp: (1.35 + tier * .85 + tier * tier * .08 + step * .07) * hpWall,
    attack: (1.30 + tier * .32 + tier * tier * .025 + step * .025) * attackWall,
    xp: 1 + tier * .48 + tier * tier * .025 + step * .04,
    speed: tier * 3 + Math.floor(step / 3) + (nightmare ? 8 + Math.floor(nightmare / 4) : 0),
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
  const [visualWidth, visualHeight] = fighterVisualBounds[fighter.name] || [fighter.frameWidth || 80, fighter.frameHeight || 116];
  React.useLayoutEffect(() => {
    const element = ref.current;
    const displayScale = fighterRenderScale(fighter.name);
    const fit = () => {
      setScale(Math.min(maximumScale * 100 / visualHeight * displayScale, element.clientWidth / visualWidth, element.clientHeight / visualHeight));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fighter.name, visualWidth, visualHeight, maximumScale]);
  return /*#__PURE__*/React.createElement("span", {
    className: "sprite-preview",
    ref: ref
  }, /*#__PURE__*/React.createElement("span", {
    className: "sprite-preview-inner",
    style: {
      transform: `scale(${scale})`
    }
  }, /*#__PURE__*/React.createElement(Sprite, {
    fighter: fighter
  })));
}
const fighterAtlases = window.ChibiFighterAnimations || {};
const fighterSheetCache = new Map();
function fighterSheet(src) {
  if (fighterSheetCache.has(src)) return fighterSheetCache.get(src);
  if (fighterSheetCache.size >= 20) fighterSheetCache.delete(fighterSheetCache.keys().next().value);
  const sheet = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  }).catch(error => {
    if (fighterSheetCache.get(src) === sheet) fighterSheetCache.delete(src);
    throw error;
  });
  fighterSheetCache.set(src, sheet);
  return sheet;
}

function fighterClipState(combat, action, hpRatio, victory) {
  if (!combat) return "idle";
  if (hpRatio <= 0) return "dead";
  if (action === "burst") return "limit_atk";
  if (action === "shockwave") return "atk";
  if (action === "pyro" || action === "heal") return "magic_atk";
  if (action === "guard") return "standby";
  if (victory) return "win";
  return hpRatio <= .25 ? "dying" : "idle";
}
function fighterClipTiming(clip, state) {
  if (!clip) return { duration: 0, impact: 0 };
  const timing = {
    atk: [20, 28, .45],
    magic_atk: [12, 18, .67],
    limit_atk: [27, 38, .59],
    win: [16, 22, 0]
  }[state];
  if (!timing) return { duration: 0, impact: 0 };
  const [baseFps, maxFps, fraction] = timing;
  const fps = Math.min(maxFps, Math.max(baseFps, clip.frames / 3.2));
  const duration = Math.round(1000 * clip.frames / fps);
  const impactFrame = Math.round((clip.frames - 1) * fraction);
  return { duration, impact: Math.round(1000 * impactFrame / fps) };
}
function fighterAtlasPlacement(atlas, clip, width, frameHeight, visualHeight) {
  const scale = visualHeight / atlas.idleHeight;
  const [idleWidth, idleHeight] = atlas.idleCell;
  const [idleX, idleY] = atlas.clips.idle.pivot;
  const [x, y] = clip.pivot;
  return {
    scale,
    left: (idleX - idleWidth / 2 + width / 2 - x) * scale,
    top: (frameHeight + visualHeight) / 2 + (idleY - (idleHeight - 5) - y) * scale
  };
}
function fighterActionTiming(name, action) {
  const state = fighterClipState(true, action, 1, false);
  const clip = fighterAtlases[name]?.clips[state];
  return fighterClipTiming(clip, state);
}
function playBattleVfx(selector, targetKeys, cue, actorKey) {
  const arena = document.querySelector(selector);
  if (!arena || !window.ChibiBattleVfx) return;
  const units = [...arena.querySelectorAll('[data-fx-unit]')];
  const targets = new Set(targetKeys.map(String));
  window.ChibiBattleVfx.play(arena, units.filter(unit => targets.has(unit.dataset.fxUnit)), cue,
    units.find(unit => unit.dataset.fxUnit === actorKey));
}
async function prepareFighterAction(name, action) {
  const state = fighterClipState(true, action, 1, false);
  const clip = fighterAtlases[name]?.clips[state];
  if (!clip) return;
  let timer;
  try {
    await Promise.race([fighterSheet(clip.src), new Promise(resolve => { timer = setTimeout(resolve, 240); })]);
  } catch (_) {
    // The legacy sprite remains available if the sheet cannot be loaded.
  } finally {
    clearTimeout(timer);
  }
}

function Sprite({
  fighter,
  action = null,
  combat = false,
  hpRatio = fighter.maxHp ? fighter.hp / fighter.maxHp : 1,
  victory = false,
  actionKey = null
}) {
  const isAttacking = combat && !!fighter.attackSprite && ["pyro", "shockwave", "burst"].includes(action ?? "");
  const sprite = isAttacking && fighter.attackSprite ? fighter.attackSprite : fighter.sprite;
  const frameCount = isAttacking ? fighter.attackFrames : fighter.frames;
  const visualHeight = (fighterVisualBounds[fighter.name] || [0, fighter.frameHeight || 116])[1];
  const atlas = fighterAtlases[fighter.name];
  const state = fighterClipState(combat, action, hpRatio, victory);
  const clip = atlas?.clips[state];
  const canvas = React.useRef(null);
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    if (!combat || !atlas) return;
    for (const state of ["atk", "magic_atk"]) fighterSheet(atlas.clips[state].src).catch(() => {});
  }, [atlas, combat]);
  useEffect(() => {
    if (!clip) return;
    const surface = canvas.current;
    let current = true, request = 0;
    fighterSheet(clip.src).then(image => {
      if (!current || !surface) return;
      const context = surface.getContext("2d");
      if (!context) return;
      const width = image.width / clip.columns, height = image.height / clip.rows;
      const { scale, left, top } = fighterAtlasPlacement(atlas, clip, width, fighter.frameHeight || 116, visualHeight);
      surface.width = width;
      surface.height = height;
      surface.style.width = width * scale + "px";
      surface.style.height = height * scale + "px";
      surface.style.left = `calc(50% + ${left}px)`;
      surface.style.top = top + "px";
      context.imageSmoothingEnabled = false;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { duration } = fighterClipTiming(clip, state);
      const start = performance.now();
      let last = -1;
      function draw(time) {
        const elapsed = time - start;
        const frame = reduced ? 0 : duration ? Math.min(clip.frames - 1, Math.floor(elapsed / duration * clip.frames)) : Math.floor(elapsed / 130) % clip.frames;
        if (frame !== last) {
          context.clearRect(0, 0, width, height);
          context.drawImage(image, frame % clip.columns * width, Math.floor(frame / clip.columns) * height, width, height, 0, 0, width, height);
          last = frame;
        }
        if (!reduced && clip.frames > 1 && (!duration || frame < clip.frames - 1)) request = requestAnimationFrame(draw);
      }
      draw(start);
      setLoaded(clip.src);
    }).catch(() => {});
    return () => { current = false; cancelAnimationFrame(request); };
  }, [atlas, clip, state, actionKey, visualHeight, fighter.frameHeight]);
  const showAtlas = clip && loaded !== null;
  return /*#__PURE__*/React.createElement("div", {
    className: `pixel-sprite hero-sprite hero-${fighter.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} ${frameCount ? `sprite-frames-${frameCount}` : ""} ${isAttacking ? "attack-sprite" : ""} ${showAtlas ? "fighter-atlas-active" : ""}`,
    style: {
      backgroundImage: `url(${sprite})`,
      "--fighter-normalize": `${100 / visualHeight * fighterRenderScale(fighter.name)}`,
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
  }, atlas && React.createElement("canvas", { ref: canvas, className: "fighter-atlas-frame", hidden: !showAtlas, "aria-hidden": true }));
}
// Rank scales the effect once; base wiki power and saved inventories stay unchanged.
const pinRankScales = {
  "---": 1,
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
  return /*#__PURE__*/React.createElement("span", null, label, " \xB7 Effets \xD7", pinRankMultiplier(pin).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR"));
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
  GLADIO: "shield-of-the-king",
  X: "x-buster",
  SONIC: "sonic-wind",
  ZERO: "z-saber",
  SHADOW: "chaos-spear",
  KNUCKLES: "meteor-punch",
  TAILS: "energy-ball",
  MARLUXIA: "graceful-dahlia",
  LEXAEUS: "skysplitter",
  AXEL: "eternal-flames",
  LARXENE: "fulgurant-lightning"
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
}, {
  id: "x-buster",
  name: "X-Buster",
  psych: "Tir chargé",
  kind: "special",
  power: 32
}, {
  id: "sonic-wind",
  name: "Sonic Wind",
  psych: "Vortex Saber",
  kind: "special",
  power: 30,
  target: "aoe"
}, {
  id: "z-saber",
  name: "Z-Saber",
  psych: "Burst Sword",
  kind: "physical",
  power: 35,
  target: "aoe"
}, {
  id: "chaos-spear",
  name: "Chaos Spear",
  psych: "Piercing Pillar",
  kind: "special",
  power: 34,
  target: "aoe"
}, {
  id: "meteor-punch",
  name: "Meteor Punch",
  psych: "Massive Hit",
  kind: "physical",
  power: 36
}, {
  id: "energy-ball",
  name: "Energy Ball",
  psych: "Energy Rounds",
  kind: "special",
  power: 29
}, {
  id: "graceful-dahlia",
  name: "Graceful Dahlia",
  psych: "Entanglement",
  kind: "special",
  power: 34,
  target: "aoe"
}, {
  id: "skysplitter",
  name: "Skysplitter",
  psych: "Earthquake",
  kind: "physical",
  power: 38,
  target: "aoe"
}, {
  id: "eternal-flames",
  name: "Eternal Flames",
  psych: "Pyrokinesis",
  kind: "special",
  power: 35,
  target: "aoe"
}, {
  id: "fulgurant-lightning",
  name: "Fulgurant Lightning",
  psych: "Thundercloud",
  kind: "special",
  power: 35,
  target: "aoe"
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
  if (pin.row < 0) return /*#__PURE__*/React.createElement("i", {
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
    "shield-of-the-king": "⬟",
    "x-buster": "◎",
    "sonic-wind": "◉",
    "z-saber": "⚔",
    "chaos-spear": "✦",
    "meteor-punch": "◆",
    "energy-ball": "●",
    "graceful-dahlia": "✿",
    skysplitter: "⬢",
    "eternal-flames": "♨",
    "fulgurant-lightning": "ϟ"
  }[pin.id.replace(/^signature-/, "")] || "✦");
  return /*#__PURE__*/React.createElement("i", {
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
  eosDusk: "Eos · Ignis & Gladio",
  sonicx: "Final Fantasy Sonic X",
  xiii: "XIII"
};
const portalReleaseAt = {
  eosDawn: Date.parse("2026-11-25T00:00:00+01:00"),
  eosDusk: Date.parse("2026-11-25T00:00:00+01:00"),
  sonicx: secondWaveReleaseAt,
  xiii: secondWaveReleaseAt
};
const portalAvailable = id => !portalReleaseAt[id] || Date.now() >= portalReleaseAt[id];
const bases = {
  NEKU: [24, 32, 14],
  SHIKI: [22, 26, 20],
  BEAT: [34, 18, 22],
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
  GLADIO: [38, 17, 13],
  X: [30, 34, 18],
  SONIC: [32, 28, 30],
  ZERO: [38, 25, 21],
  SHADOW: [34, 36, 28],
  KNUCKLES: [40, 18, 17],
  TAILS: [20, 36, 25],
  MARLUXIA: [28, 38, 22],
  LEXAEUS: [42, 16, 12],
  AXEL: [32, 36, 24],
  LARXENE: [24, 40, 30]
};
const maxLevel = 99;
// Server-managed edits are applied before React mounts; internal IDs remain stable for saves.
const applyAdminGameConfig = config => {
  if (!config || typeof config !== "object") return;
  for (const [id, edit] of Object.entries(config.characters || {})) {
    const fighter = characterRoster.find(item => item.name === id);
    if (!fighter || !edit || typeof edit !== "object") continue;
    if (typeof edit.displayName === "string") fighter.displayName = edit.displayName.slice(0, 48);
    for (const key of ["maxHp", "hp"]) if (Number.isFinite(edit[key])) fighter[key] = Math.max(1, Math.min(100000, Math.round(edit[key])));
    if (Array.isArray(edit.elements)) characterElements[id] = edit.elements.filter(type => Object.hasOwn(elementNames, type)).slice(0, 2);
    if (Array.isArray(edit.bases)) bases[id] = edit.bases.map(value => Math.max(1, Math.min(100000, Math.round(Number(value) || 1))));
    if (edit.passive && characterPassives[id]) {
      if (typeof edit.passive.name === "string") characterPassives[id].name = edit.passive.name.slice(0, 64);
      if (typeof edit.passive.description === "string") characterPassives[id].description = edit.passive.description.slice(0, 240);
      for (const key of ["damageBonus", "healing", "defense", "dodge"]) if (Number.isFinite(edit.passive[key])) characterPassives[id][key] = Math.max(0, Math.min(2, edit.passive[key]));
    }
  }
  for (const [id, edit] of Object.entries(config.badges || {})) {
    const pin = psychs[id];
    if (!pin || !edit || typeof edit !== "object") continue;
    if (typeof edit.displayName === "string") pin.name = edit.displayName.slice(0, 64);
    if (Number.isFinite(edit.power)) pin.power = Math.max(0, Math.min(100000, Math.round(edit.power)));
    if (Number.isFinite(edit.cost)) pin.cost = Math.max(0, Math.min(3, Math.round(edit.cost)));
    if (["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"].includes(edit.element)) pin.element = edit.element;
    if (["single","duo","aoe"].includes(edit.target)) pin.target = edit.target;
  }
  for (const [id, edit] of Object.entries(config.enemies || {})) {
    const enemy = ffbeBestiary.find(item => item.id === id);
    if (!enemy || !edit || typeof edit !== "object") continue;
    if (typeof edit.displayName === "string") enemy.name = edit.displayName.slice(0, 80);
    for (const key of ["hp", "attack", "level"]) if (Number.isFinite(edit[key])) enemy[key] = Math.max(1, Math.min(100000000, Math.round(edit[key])));
  }
};
applyAdminGameConfig(window.ChibiAdminGameConfig);
const characterLabel = name => characterRoster.find(item => item.name === name)?.displayName || name;
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
function rebirthXpMultiplier(rebirths = 0) {
  return 1 + Math.min(20, Math.max(0, Number(rebirths) || 0)) * .15;
}
function gainExperience(f, amount, rebirths = 0) {
  const progress = experience((f.xp || 0) + Math.round(amount * rebirthXpMultiplier(rebirths)));
  const oldLevel = (f.level || 1) - 1,
    newLevel = progress.level - 1;
  const scale = 1.2 ** (f.battleRank || 0),
    creep = powerCreepMultiplier(f.name),
    [atk, mag, speed] = bases[f.name],
    hpBase = characterRoster.find(hero => hero.name === f.name).maxHp;
  const delta = (base, step) => Math.round((base + newLevel * step) * creep * scale) - Math.round((base + oldLevel * step) * creep * scale);
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
  return /*#__PURE__*/React.createElement("div", {
    className: "xp-progress"
  }, /*#__PURE__*/React.createElement("span", null, "Niv. ", p.level, " \xB7 ", p.required ? `${p.current} / ${p.required} XP` : "MAX"), /*#__PURE__*/React.createElement("progress", {
    "aria-label": "Progression du niveau",
    max: p.required || 1,
    value: p.required ? p.current : 1
  }));
}
const awakeningHpBonus = name => Math.round(20 * powerCreepMultiplier(name));
function trained(f, xp, awake, rank = 0) {
  const progress = experience(xp),
    n = progress.level - 1,
    [atk, mag, speed] = bases[f.name];
  const creep = powerCreepMultiplier(f.name);
  const scale = v => Math.round(v * creep * 1.2 ** rank);
  const maxHp = scale(f.maxHp + n * 5) + (awake ? awakeningHpBonus(f.name) : 0);
  return {
    ...f,
    xp: progress.xp,
    level: progress.level,
    battleRank: rank,
    battleAwakened: !!awake,
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
  return /*#__PURE__*/React.createElement("img", {
    className: "rank-badge",
    src: `./assets/bingo/rang-${ranks[level]}.webp`,
    alt: `Rang ${level === 5 ? "étoile" : ranks[level]}`
  });
}
function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}
const offensive = id => ["physical", "special"].includes(psychs[id]?.kind);
const pinGradeWeights = {
  "---": 36,
  C: 27,
  B: 18,
  A: 10,
  Reaper: 6,
  Angel: 3
};
function pinGrade(pin) {
  return pin.grade && pin.grade !== "---" ? pin.grade : "---";
}
function rebirthGradeWeight(grade, weight, rebirths = 0) {
  const boost = 1 + Math.min(8, Math.max(0, rebirths)) * .5;
  return grade === "Angel" || grade === "Reaper" ? weight * boost : grade === "A" ? weight * Math.sqrt(boost) : weight;
}
function weightedPinPick(rebirths = 0) {
  const groups = Object.entries(pinGradeWeights).map(([grade, weight]) => ({
    grade,
    weight: rebirthGradeWeight(grade, weight, rebirths),
    pins: pinList.filter(pin => pinGrade(pin) === grade)
  })).filter(group => group.pins.length);
  const total = groups.reduce((sum, group) => sum + group.weight, 0),
    roll = Math.random() * total;
  let cursor = 0;
  for (const group of groups) {
    cursor += group.weight;
    if (roll < cursor) return pick(group.pins);
  }
  return pick(groups.at(-1).pins);
}
function pinGradeRates(rebirths = 0) {
  const active = Object.entries(pinGradeWeights).filter(([grade]) => pinList.some(pin => pinGrade(pin) === grade)).map(([grade, weight]) => [grade, rebirthGradeWeight(grade, weight, rebirths)]),
    total = active.reduce((sum, [, weight]) => sum + weight, 0);
  return active.map(([grade, weight]) => ({
    grade,
    rate: weight / total
  }));
}
function pinTargetMode(pin) {
  if (pin.target) return pin.target;
  return /Earthquake|Pyrokinesis|Explosion|Time Bomb|Pressure Mine|Thundercloud|Street Jam|Piercing Pillar|Psychokinesis|Vortex Saber|Entanglement|Bullet Sword|Burst Sword|Sweeper|Black Hole|Flame Blast|Discharge|Shockwave/i.test(pin.psych) ? "aoe" : "single";
}
function pinTargetLabel(pin) {
  return ["physical", "special"].includes(pin.kind) ? pinTargetMode(pin) === "aoe" ? "AoE" : "Monocible" : "Duo";
}
function PinTargetBadge({
  pin
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `badge-target badge-target-${pinTargetLabel(pin).toLowerCase()}`
  }, pinTargetLabel(pin));
}
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
function auditedDuplicateCompensation(profile) {
  if (profile.duplicateAuditVersion === 1) return profile;
  const pulls = {};
  for (const event of Array.isArray(profile.wishEvents) ? profile.wishEvents : []) {
    try {
      for (const draw of JSON.parse(event.drawsJson || "[]")) if (draw?.name && characterRoster.some(f => f.name === draw.name)) pulls[draw.name] = (pulls[draw.name] || 0) + 1;
    } catch {}
  }
  // One initial acquisition is not a duplicate.  Each tracked pull after the
  // fifth duplicate becomes a 1,000-coin reimbursement. This works for every
  // affected account without guessing a player-specific number.
  const overStar = Object.values(pulls).reduce((sum, count) => sum + Math.max(0, count - 6), 0);
  return { ...profile, duplicateAuditVersion: 1, coins: profile.coins + overStar * 1000 };
}
function duplicateCompensationFromEvents(events) {
  const pulls = {};
  for (const event of events || []) {
    try {
      for (const draw of JSON.parse(event?.drawsJson || "[]")) if (draw?.name && characterRoster.some(fighter => fighter.name === draw.name)) pulls[draw.name] = (pulls[draw.name] || 0) + 1;
    } catch {}
  }
  return Object.values(pulls).reduce((sum, count) => sum + Math.max(0, count - 6) * 1000, 0);
}
function recordedDuplicateCompensation(events) {
  let paid = 0;
  for (const event of events || []) {
    try { for (const draw of JSON.parse(event?.drawsJson || "[]")) paid += Math.max(0, Math.floor(Number(draw?.compensation) || 0)); } catch {}
  }
  return paid;
}
function reconcileArchivedDuplicateCompensation(profile, archive) {
  if (profile.duplicateArchiveAuditVersion === 1) return profile;
  const events = new Map();
  for (const event of [...(archive || []), ...(profile.wishEvents || [])]) if (validWishEvent(event)) events.set(event.id, event);
  const allEvents = [...events.values()], totalOwed = duplicateCompensationFromEvents(allEvents);
  const automaticallyPaid = recordedDuplicateCompensation(allEvents);
  // Version 1 had already paid the same calculation for the local event window.
  // Credit only what that limited audit could not see, then stamp the account.
  const paidByLocalAudit = profile.duplicateAuditVersion === 1 ? duplicateCompensationFromEvents(profile.wishEvents || []) : 0;
  const compensation = Math.max(0, totalOwed - automaticallyPaid - paidByLocalAudit);
  return { ...profile, duplicateAuditVersion: 1, duplicateArchiveAuditVersion: 1, duplicateArchiveCompensation: compensation, coins: profile.coins + compensation };
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
      copies: draw.copies,
      compensation: draw.compensation || 0
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, !embedded && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setOpen(true);
      setSelected(null);
      load(true);
    }
  }, "Historique des v\u0153ux"), (open || embedded) && /*#__PURE__*/React.createElement(Panel, {
    className: "wish-history",
    title: "Historique des v\u0153ux",
    close: () => setOpen(false)
  }, /*#__PURE__*/React.createElement("div", {
    key: selected?.id || "list",
    className: "wish-history-view"
  }, selected ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, portals[selected.portal] || selected.portal), " \xB7 ", new Date(selected.at).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    timeZone: "Europe/Paris"
  })), /*#__PURE__*/React.createElement("p", null, "V\u0153ux ", selected.first, "\u2013", selected.last, " \xB7 ", selected.freeUsed, " gratuits \xB7 ", selected.coinsPaid, " pi\xE8ces"), /*#__PURE__*/React.createElement("p", null, "Solde : ", selected.coinsBefore, " \u2192 ", selected.coinsAfter, " pi\xE8ces \xB7 Gratuits : ", selected.freeBefore, " \u2192 ", selected.freeAfter), /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "wish-history-list"
  }, JSON.parse(selected.drawsJson).map((draw, i) => {
    const pin = psychs[draw.pinId];
    return /*#__PURE__*/React.createElement("article", {
      key: i
    }, pin ? /*#__PURE__*/React.createElement(PinIcon, {
      pin: pin
    }) : /*#__PURE__*/React.createElement("span", null, "\u2605"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, pin?.name || draw.name || "Récompense"), /*#__PURE__*/React.createElement("small", null, pin ? "Badge" : draw.compensation ? `Rang étoile · +${draw.compensation} pièces` : `Personnage · Rang ${draw.rank === 5 ? "étoile" : ranks[draw.rank]} · ${draw.copies} doublon(s)`)));
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelected(null)
  }, "Retour \xE0 l\u2019historique")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, profile.wishesMade, " invocations comptabilis\xE9es \xB7 ", profile.freeWishSpent, " v\u0153ux gratuits consomm\xE9s"), profile.wishHistoryBaseline > 0 && /*#__PURE__*/React.createElement("p", null, profile.wishHistoryBaseline, " invocations ant\xE9rieures : total connu, d\xE9tails non enregistr\xE9s \xE0 l\u2019\xE9poque."), error && /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, error), /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "wish-history-list"
  }, events.map(event => /*#__PURE__*/React.createElement("button", {
    key: event.id,
    onClick: () => setSelected(event)
  }, /*#__PURE__*/React.createElement("b", null, event.count, " ", event.count > 1 ? "vœux" : "vœu", " \xB7 ", portals[event.portal] || event.portal), /*#__PURE__*/React.createElement("small", null, new Date(event.at).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    timeZone: "Europe/Paris"
  }), " \xB7 ", event.freeUsed, " gratuits \xB7 ", event.coinsPaid, " pi\xE8ces"), pending.has(event.id) && /*#__PURE__*/React.createElement("small", null, "En attente de synchronisation"))), !events.length && !loading && /*#__PURE__*/React.createElement("p", null, "Aucune invocation d\xE9taill\xE9e enregistr\xE9e pour le moment.")), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: loading,
    onClick: () => load(true)
  }, "Actualiser"), more && /*#__PURE__*/React.createElement("button", {
    disabled: loading,
    onClick: () => load()
  }, "Charger plus")))), !embedded && /*#__PURE__*/React.createElement("button", {
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
      const isAwakened = awakened.includes(f.name);
      if (raw.status === "active" && copies[f.name] > oldRank) {
        const current = trained(base, f.xp, isAwakened, copies[f.name]);
        return {
          ...current,
          hp: f.hp > 0 ? Math.max(1, Math.round(current.maxHp * f.hp / f.maxHp)) : 0
        };
      }
      // Old checkpoints had no marker. Only upgrade a legacy HP total when
      // it matches the unawakened total, so existing bonuses are never doubled.
      const missingAwakening = raw.status === "active" && isAwakened &&
        (f.battleAwakened === false || (f.battleAwakened !== true && f.maxHp === trained(base, f.xp, false, oldRank).maxHp));
      return {
        ...base,
        battleRank: oldRank,
        ...Object.fromEntries(["hp", "atk", "mag", "speed", "xp", "level"].map(k => [k, f[k]])),
        maxHp: f.maxHp + (missingAwakening ? awakeningHpBonus(f.name) : 0),
        battleAwakened: f.battleAwakened === true || (raw.status === "active" && isAwakened)
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
    ctbTimeline: {},
    pending: null
  };
}
function rollbackRunToTierSix(run) {
  const wave = 51;
  return {
    ...run,
    seq: run.seq + 1,
    updatedAt: Date.now(),
    wave,
    turn: 1,
    team: run.team.map(f => ({
      ...f,
      hp: f.maxHp
    })),
    enemies: makeWave(wave, run.id),
    energy: 3,
    reward: false,
    earnedXp: 0,
    loot: [],
    awarded: [],
    ctbTimeline: {},
    pending: null
  };
}
function applyRunCheckpoint(p, snapshot, gains = {}) {
  if (!p.run || p.run.id !== snapshot.id || p.run.status !== "active" || snapshot.seq <= p.run.seq) return p;
  const xp = {
    ...p.xp
  };
  if (gains.xp) for (const f of snapshot.team) xp[f.name] = experience((xp[f.name] || 0) + gains.xp).xp;
  const playerBefore = experience(p.playerXp || 0), playerAfter = experience((p.playerXp || 0) + (gains.xp || 0));
  const levelCoins = Math.max(0, playerAfter.level - playerBefore.level) * 100;
  const rebirthUnlock = snapshot.wave === 100 && snapshot.status === "complete" && gains.victory && !p.rebirthReady;
  return advanceDailyProgress(grantPins({
    ...p,
    run: snapshot,
    xp,
    coins: p.coins + (gains.victory ? 5 : 0) + (rebirthUnlock ? 5000 : 0) + levelCoins,
    playerXp: playerAfter.xp,
    rebirthReady: p.rebirthReady || rebirthUnlock,
    hasPlayed: true,
    bestFloor: Math.max(p.bestFloor, snapshot.wave),
    floorRecoveryAvailable: p.floorRecoveryAvailable && snapshot.wave < 10
  }, gains.pins || []), gains);
}
const profileKey = "chibi.reapers-run.party.v1";
function grantPins(profile, ids) {
  const pinCopies = {
      ...profile.pinCopies
    },
    pins = [...profile.pins];
  for (const id of ids) {
    if (!psychs[id]) continue;
    if (!pins.includes(id)) pins.push(id);
    pinCopies[id] = Math.max(0, pinCopies[id] || 0) + 1;
  }
  return {
    ...profile,
    pins,
    pinCopies
  };
}
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
  const awakened = [...new Set((Array.isArray(profile.awakened) ? profile.awakened : []).filter(name => profile.owned.includes(name)))];
  const counts = Object.fromEntries(profile.owned.map(name => [name, awakened.includes(name) ? 5 : Math.min(5, Math.max(0, Math.floor(Number(profile.copies[name]) || 0)))]));
  profile = {
    ...profile,
    copies: counts,
    levels: {
      ...counts
    },
    awakened
  };
  const pins = [...profile.pins];
  if (profile.owned.includes("NEKU") && !pins.includes(basePsych.NEKU)) pins.push(basePsych.NEKU);
  const pinCopies = {
    ...profile.pinCopies
  };
  pins.forEach(id => pinCopies[id] = Math.max(1, Math.floor(Number(pinCopies[id]) || 0)));
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
    pinCopies,
    loadout
  };
}
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
    if (!saved || typeof saved !== "object") throw Error("Save missing");
    const savedOwned = Array.isArray(saved.owned) ? saved.owned : [];
    const owned = characterRoster.map(f => f.name).filter(name => savedOwned.includes(name));
    const awakened = owned.filter(name => Array.isArray(saved.awakened) && saved.awakened.includes(name));
    // Older builds could keep values past ★. Convert every excess once, then
    // cap the stored count so the inventory and rank stay unambiguous.
    const legacyDuplicateCoins = saved.duplicateRefundVersion === 1 ? 0 : owned.reduce((sum, name) => {
      const raw = Math.max(0, Math.floor(Number(saved.copies?.[name]) || 0));
      return sum + Math.max(0, raw - 5) * 1000;
    }, 0);
    const equipped = [0, 1].map(i => {
      const name = saved.equipped?.[i];
      return owned.includes(name) && (i === 0 || name !== saved.equipped[0]) ? name : "";
    });
    const pins = [...new Set(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}).flat())].filter(id => psychs[id] && (psychs[id].row >= 0 || id.startsWith("signature-")));
    const pinCopies = Object.fromEntries(pins.map(id => [id, Math.max(1, Math.min(999999, Math.floor(Number(saved.pinCopies?.[id]) || 1)))]));
    const copies = Object.fromEntries(owned.map(name => {
      const value = saved.copies?.[name];
      // A recorded awakening is permanent, including when an old save lost its duplicate count.
      const count = awakened.includes(name) ? 5 : value !== undefined && Number.isFinite(Number(value))
        ? Math.min(5, Math.max(0, Math.floor(Number(value)))) : Number(saved.levels?.[name]) === 5 ? 5 : 0;
      return [name, count];
    }));
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 100 ? saved.wishStep : 0;
    const bestFloor = Math.min(100, Math.max(0, Math.floor(Number(saved.bestFloor ?? saved.highestFloor ?? 0) || 0)));
    const legacyRebirthUnlock = saved.rebirthReady === undefined && bestFloor >= 100;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return auditedDuplicateCompensation(accrueDailyWishes(refreshDailyQuests(assignBasePsychs({
      dailyQuestDay: typeof saved.dailyQuestDay === "string" ? saved.dailyQuestDay : "",
      dailyQuestProgress: {
        waves: Math.max(0, Math.floor(Number(saved.dailyQuestProgress?.waves) || 0)),
        enemies: Math.max(0, Math.floor(Number(saved.dailyQuestProgress?.enemies) || 0)),
        bursts: Math.max(0, Math.floor(Number(saved.dailyQuestProgress?.bursts) || 0))
      },
      claimedDailyQuests: Array.isArray(saved.claimedDailyQuests) ? [...new Set(saved.claimedDailyQuests.filter(id => typeof id === "string"))] : [],
      specialRunRecoveries: Array.isArray(saved.specialRunRecoveries) ? [...new Set(saved.specialRunRecoveries.filter(id => typeof id === "string" && id.length < 100))] : [],
      eventRun: readEvent(saved.eventRun, owned, copies, awakened),
      run: validRun(saved.run, owned, copies, awakened),
      wishEvents: Array.isArray(saved.wishEvents) ? saved.wishEvents.filter(validWishEvent) : [],
      wishHistoryStartedAt: Number(saved.wishHistoryStartedAt) || 0,
      wishHistoryBaseline: Number(saved.wishHistoryBaseline) || 0,
      freeWishVersion: saved.freeWishVersion === 1 ? 1 : 0,
      freeWishSpent: Number.isSafeInteger(saved.freeWishSpent) && saved.freeWishSpent >= 0 ? saved.freeWishSpent : 0,
      freeWishDaySpent: Number.isSafeInteger(saved.freeWishDaySpent) && saved.freeWishDaySpent >= 0 ? saved.freeWishDaySpent : 0,
      duplicateRefundVersion: 1,
      duplicateAuditVersion: saved.duplicateAuditVersion === 1 ? 1 : 0,
      duplicateArchiveAuditVersion: saved.duplicateArchiveAuditVersion === 1 ? 1 : 0,
      pcMissionCoins: Object.fromEntries(Object.entries(saved.pcMissionCoins || {}).filter(([day, n]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isSafeInteger(n) && Number(n) >= 0 && Number(n) <= 100000)),
      starterNekuGranted: saved.starterNekuGranted === true,
      starterWishesGranted: saved.starterWishesGranted === true,
      hasPlayed: saved.hasPlayed === true || Number(saved.bestFloor) > 0 || Object.values(saved.xp || saved.wins || {}).some(x => Number(x) > 0),
      wishesMade: Number.isSafeInteger(saved.wishesMade) && saved.wishesMade >= 0 ? saved.wishesMade : Math.max(owned.filter(n => !saved.starterNekuGranted || n !== "NEKU").length, Number(saved.wishStep) || 0, (saved.pins || []).some(id => !saved.starterNekuGranted || id !== basePsych.NEKU) ? 1 : 0),
      freeWishes: Number.isSafeInteger(saved.freeWishes) && saved.freeWishes >= 0 ? saved.freeWishes : 0,
      eventWishes: Number.isSafeInteger(saved.eventWishes) && saved.eventWishes >= 0 ? saved.eventWishes : 0,
      secondWaveWishesGranted: saved.secondWaveWishesGranted === true,
      lastFreeWishDay: typeof saved.lastFreeWishDay === "string" ? saved.lastFreeWishDay : "",
      bestFloor,
      rebirths: Number.isSafeInteger(saved.rebirths) && saved.rebirths >= 0 ? Math.min(99, saved.rebirths) : 0,
      playerXp: Number.isSafeInteger(saved.playerXp) && saved.playerXp >= 0 ? saved.playerXp : 0,
      avatar: typeof saved.avatar === "string" && owned.includes(saved.avatar) ? saved.avatar : equipped.find(Boolean) || owned[0] || "NEKU",
      rebirthReady: saved.rebirthReady === true || legacyRebirthUnlock,
      claimedQuests: Array.isArray(saved.claimedQuests) ? [...new Set(saved.claimedQuests.filter(id => typeof id === "string"))] : [],
      floorRecoveryAvailable: saved.floorRecoveryAvailable === true || saved.floorRecoveryAvailable !== false && saved.bestFloor === undefined && owned.length > 0,
      owned,
      equipped,
      pins,
      pinCopies,
      wishStep,
      copies,
      xp: Object.fromEntries(owned.map(n => [n, Number.isSafeInteger(saved.xp?.[n]) && saved.xp[n] >= 0 ? experience(saved.xp[n]).xp : legacyExperience(saved.wins?.[n])])),
      levels: {
        ...copies
      },
      awakened,
      loadout: saved.loadout || {},
      coins: saved.coins + (legacyRebirthUnlock ? 5000 : 0) + legacyDuplicateCoins
    }))));
  } catch {}
  return accrueDailyWishes(refreshDailyQuests(assignBasePsychs({
    dailyQuestDay: "",
    dailyQuestProgress: {
      waves: 0,
      enemies: 0,
      bursts: 0
    },
    claimedDailyQuests: [],
    specialRunRecoveries: [],
    run: null,
    wishEvents: [],
    wishHistoryStartedAt: 0,
    wishHistoryBaseline: 0,
    freeWishVersion: 0,
    freeWishSpent: 0,
    freeWishDaySpent: 0,
    duplicateRefundVersion: 1,
    duplicateAuditVersion: 1,
    duplicateArchiveAuditVersion: 1,
    pcMissionCoins: {},
    starterNekuGranted: false,
    starterWishesGranted: false,
    hasPlayed: false,
    wishesMade: 0,
    freeWishes: 0,
    eventWishes: 0,
    secondWaveWishesGranted: false,
    lastFreeWishDay: "",
    bestFloor: 0,
    rebirths: 0,
    playerXp: 0,
    avatar: "NEKU",
    rebirthReady: false,
    claimedQuests: [],
    floorRecoveryAvailable: false,
    pins: [],
    pinCopies: {},
    wishStep: 0,
    copies: {},
    xp: {},
    levels: {},
    awakened: [],
    owned: [],
    equipped: ["", ""],
    loadout: {},
    coins: 180
  })));
}
function applyRebirth(profile) {
  if (!profile.rebirthReady) return profile;
  const protectedPins = new Set(profile.owned.map(name => basePsych[name]).filter(Boolean));
  const pins = profile.pins.filter(id => protectedPins.has(id) || ["Reaper", "Angel"].includes(pinGrade(psychs[id])));
  const pinCopies = Object.fromEntries(Object.entries(profile.pinCopies).filter(([id]) => pins.includes(id) || protectedPins.has(id)));
  const copies = Object.fromEntries(profile.owned.map(name => [name, profile.awakened.includes(name) ? profile.copies[name] || 5 : 0]));
  const loadout = Object.fromEntries(profile.owned.map(name => [name, (profile.loadout[name] || []).filter(id => protectedPins.has(id) || pins.includes(id))]));
  return assignBasePsychs({
    ...profile,
    run: null,
    eventRun: null,
    bestFloor: 0,
    rebirths: profile.rebirths + 1,
    rebirthReady: false,
    floorRecoveryAvailable: false,
    pins,
    pinCopies,
    copies,
    levels: {
      ...copies
    },
    loadout
  });
}

// First mobile game integration: 2026-11-18 (repository history).
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
function refreshDailyQuests(p, now = new Date()) {
  const today = parisDay(now);
  return p.dailyQuestDay === today ? p : {
    ...p,
    dailyQuestDay: today,
    dailyQuestProgress: {
      waves: 0,
      enemies: 0,
      bursts: 0
    },
    claimedDailyQuests: []
  };
}
function advanceDailyProgress(p, gains) {
  const current = refreshDailyQuests(p),
    progress = {
      ...current.dailyQuestProgress
    };
  if (gains.victory) progress.waves += 1;
  progress.enemies += gains.defeated || 0;
  progress.bursts += gains.bursts || 0;
  return {
    ...current,
    dailyQuestProgress: progress
  };
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
      // A full pack on an already active legacy account is a replay, not a new player gift.
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
// Launch gifts are deliberately separate from the three daily wishes. That
// avoids the daily refresh replacing an unspent event reward on the next day.
function grantSecondWaveWishes(p, now = Date.now()) {
  if (now < secondWaveReleaseAt || p.secondWaveWishesGranted) return p;
  return {
    ...p,
    secondWaveWishesGranted: true,
    eventWishes: Math.max(0, Number(p.eventWishes) || 0) + 50
  };
}
function inboxEntries(profile, now = Date.now()) {
  const entries = [];
  if (now >= secondWaveReleaseAt && !profile.secondWaveWishesGranted) entries.push({
    id: "wave-2-wishes",
    title: "Vague 2 · Cadeau de lancement",
    text: "50 vœux offerts pour les portails Final Fantasy Sonic X et XIII.",
    reward: "50 vœux",
    claim: "wave-2"
  });
  return entries;
}
function wishQuote(p, count) {
  const dailyFree = Math.min(count, p.freeWishes || 0),
    eventFree = Math.min(count - dailyFree, p.eventWishes || 0),
    free = dailyFree + eventFree,
    paid = count - free;
  return {
    free,
    dailyFree,
    eventFree,
    paid,
    cost: paid * 100,
    starter: false
  };
}
const availableFreeWishes = p => Math.max(0, Number(p.freeWishes) || 0) + Math.max(0, Number(p.eventWishes) || 0);
const characterChance = 0.10;
function portalRoster(id) {
  const names = id === "sonicx" ? ["X", "SONIC", "ZERO", "SHADOW", "KNUCKLES", "TAILS"] : id === "xiii" ? ["MARLUXIA", "LEXAEUS", "AXEL", "LARXENE"] : id === "partners" ? ["BEAT", "JOSHUA"] : id === "eosDawn" ? ["NOCTIS", "PROMPTO"] : id === "eosDusk" ? ["IGNIS", "GLADIO"] : id === "apocalyptic" ? ["2B", "A2"] : id === "destiny" ? ["SORA", "RIKU"] : id === "reality" ? ["CLOUD", "AERITH"] : id === "shibuya" ? ["NEKU", "SHIKI"] : ["NEKU", "SHIKI"];
  return characterRoster.filter(f => names.includes(f.name));
}
function portalPool(id, _profile) {
  const roster = portalRoster(id);
  // Fixed weights: ownership, duplicates and awakening never change the odds.
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
  // Decode during loading. Starting a buffer in the input handler avoids a media seek on first press.
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
      // Touch activation is confirmed on release so that scrolling a menu stays silent.
      if (event.pointerType === "mouse" && (pressed = eligible(event))) preview();
    };
    const click = event => {
      const button = eligible(event);
      if (button && (event.detail === 0 || button !== pressed)) preview();
      pressed = null;
      interact();
    };
    // Retry inside the launch gesture when the embedding page already loaded the game.
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
  const adminSlot = React.useRef(null);
  useEffect(() => window.ChibiAdmin?.mountLauncher(adminSlot.current), []);
  const [values, setValues] = useState({
    ...gameSound.volumes
  });
  return /*#__PURE__*/React.createElement("section", {
    className: "hub-panel audio-settings"
  }, /*#__PURE__*/React.createElement("h1", null, "Param\xE8tres"), ["music", "sfx"].map(channel => /*#__PURE__*/React.createElement("label", {
    key: channel
  }, /*#__PURE__*/React.createElement("span", null, channel === "music" ? "Musique" : "Effets sonores"), /*#__PURE__*/React.createElement("output", null, values[channel], " %"), /*#__PURE__*/React.createElement("input", {
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
  }))), /*#__PURE__*/React.createElement("div", { className: "settings-admin-slot", ref: adminSlot }), /*#__PURE__*/React.createElement("button", {
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
  return /*#__PURE__*/React.createElement("button", {
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    className: "portal-art",
    src: poster,
    alt: "",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("video", {
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
  return /*#__PURE__*/React.createElement("canvas", {
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
  return /*#__PURE__*/React.createElement("dialog", {
    className: `wish-dialog ${className}`,
    ref: ref,
    "aria-labelledby": "wish-title",
    onCancel: e => {
      e.preventDefault();
      close?.();
    }
  }, /*#__PURE__*/React.createElement("h2", {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "reward-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "reward-sun",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("h3", null, pin ? pin.name.replace(" (Pin)", "") : fighter?.name), draw.compensation && /*#__PURE__*/React.createElement("p", {
    className: "reward-compensation"
  }, "Rang étoile atteint · +", draw.compensation, " pièces"), /*#__PURE__*/React.createElement("div", {
    className: "reward-object"
  }, pin ? /*#__PURE__*/React.createElement(PinIcon, {
    pin: pin
  }) : fighter && /*#__PURE__*/React.createElement(SpritePreview, {
    fighter: fighter,
    maximumScale: 1
  })), /*#__PURE__*/React.createElement("div", {
    className: "reward-facts"
  }, pin ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("b", null, /*#__PURE__*/React.createElement(PinRankInfo, {
    pin: pin
  })), /*#__PURE__*/React.createElement("span", null, uses[pin.kind], " \xB7 ", pin.cost, " EN")) : "rank" in draw && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RankBadge, {
    level: draw.rank
  }), /*#__PURE__*/React.createElement("span", null, draw.copies ? `Doublon ${draw.copies}/5` : "Nouvelle recrue", " \xB7 ", psychs[basePsych[draw.name]].name.replace(" (Pin)", ""))))), /*#__PURE__*/React.createElement("div", {
    className: "reveal-footer"
  }, draws.length > 1 && /*#__PURE__*/React.createElement("span", null, index + 1, " / ", draws.length), /*#__PURE__*/React.createElement("button", {
    onClick: () => index + 1 < draws.length ? setIndex(index + 1) : close()
  }, index + 1 < draws.length ? "Suivant" : "Fermer")));
}
function BadgeArt({
  pin
}) {
  if (pin.row < 0) return /*#__PURE__*/React.createElement("span", {
    className: "partner-pin-art"
  }, /*#__PURE__*/React.createElement(PinIcon, {
    pin: pin
  }));
  return /*#__PURE__*/React.createElement("span", {
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
  const [sort, setSort] = useState("number");
  const available = availablePsychs(profile, name);
  const sorted = [...available].sort((left, right) => {
    const a = psychs[left],
      b = psychs[right];
    return sort === "grade" ? (badgeGradeOrder[pinGrade(a)] ?? 0) - (badgeGradeOrder[pinGrade(b)] ?? 0) || a.name.localeCompare(b.name) : sort === "element" ? elementNames[a.element || badgeElement(a)].localeCompare(elementNames[b.element || badgeElement(b)]) || a.name.localeCompare(b.name) : sort === "power" ? b.power - a.power || a.name.localeCompare(b.name) : (Number.parseInt(a.number) || 9999) - (Number.parseInt(b.number) || 9999) || a.name.localeCompare(b.name);
  });
  const pages = Math.max(1, Math.ceil(sorted.length / 16));
  const equipped = profile.loadout[name] || [];
  const inspect = inspected ? psychs[inspected] : null;
  const toggle = id => {
    if (inspected !== id) {
      setInspected(id);
      return;
    }
    if (equippedBy(profile, name, id)) return;
    setDraft(old => old.includes(id) ? old.filter(value => value !== id) : old.length < 3 ? [...old, id] : old);
  };
  const start = () => {
    setDraft([...equipped]);
    setPage(0);
    setInspected(null);
    setOpen(true);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "psych-loadout"
  }, /*#__PURE__*/React.createElement("h2", null, "Psychs \xB7 ", name), /*#__PURE__*/React.createElement("div", {
    className: "psych-equipment-slots"
  }, [0, 1, 2].map(index => /*#__PURE__*/React.createElement("button", {
    key: index,
    onClick: start,
    "aria-label": `Équiper les psychs de ${name}, emplacement ${index + 1}`
  }, equipped[index] ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PinIcon, {
    pin: psychs[equipped[index]]
  }), /*#__PURE__*/React.createElement("small", null, psychs[equipped[index]].name.replace(" (Pin)", ""), (profile.pinCopies[equipped[index]] || 1) > 1 ? ` ×${profile.pinCopies[equipped[index]]}` : ""), /*#__PURE__*/React.createElement("small", {
    className: "psych-target"
  }, pinTargetLabel(psychs[equipped[index]]))) : /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "+")))), open && /*#__PURE__*/React.createElement(WishDialog, {
    className: "badge-book",
    title: `Psychs · ${name}`,
    close: () => setOpen(false)
  }, /*#__PURE__*/React.createElement("p", {
    className: "equipment-count"
  }, draft.length, " / 3 \xE9quip\xE9s"), /*#__PURE__*/React.createElement("div", {
    className: "psych-equipment-slots"
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("button", {
    key: i,
    disabled: !draft[i],
    "aria-label": draft[i] ? `Retirer ${psychs[draft[i]].name}` : `Emplacement ${i + 1} vide`,
    onClick: () => toggle(draft[i])
  }, draft[i] ? /*#__PURE__*/React.createElement(PinIcon, {
    pin: psychs[draft[i]]
  }) : /*#__PURE__*/React.createElement("span", null, "+")))), /*#__PURE__*/React.createElement("div", {
    className: "badge-sort",
    "aria-label": "Trier les psychs"
  }, [["number", "N°"], ["grade", "Classe"], ["element", "Type"], ["power", "Puissance"]].map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    "aria-pressed": sort === id,
    onClick: () => {
      setSort(id);
      setPage(0);
      setInspected(null);
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "badge-slots"
  }, Array.from({
    length: 16
  }, (_, i) => {
    const id = sorted[page * 16 + i],
      pin = psychs[id];
    return pin ? /*#__PURE__*/React.createElement("button", {
      key: id,
      className: "badge-slot",
      "aria-label": `${pin.name} · ${pinTargetLabel(pin)} · ${profile.pinCopies[id] || 1} exemplaire(s)${equippedBy(profile, name, id) ? ` · Équipé par ${equippedBy(profile, name, id)}` : ""}`,
      disabled: Boolean(equippedBy(profile, name, id)),
      "aria-pressed": draft.includes(id),
      onClick: () => toggle(id)
    }, /*#__PURE__*/React.createElement(BadgeArt, {
      pin: pin
    }), /*#__PURE__*/React.createElement(PinTargetBadge, {
      pin: pin
    }), (profile.pinCopies[id] || 1) > 1 && /*#__PURE__*/React.createElement("span", {
      className: "badge-copy"
    }, "\xD7", profile.pinCopies[id]), equippedBy(profile, name, id) && /*#__PURE__*/React.createElement("small", {
      className: "badge-owner"
    }, equippedBy(profile, name, id))) : /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "badge-slot",
      "aria-hidden": "true"
    });
  })), inspect && /*#__PURE__*/React.createElement("p", {
    className: "badge-info"
  }, /*#__PURE__*/React.createElement("b", null, inspect.name.replace(" (Pin)", "")), " \xB7 ", types[inspect.kind], " \xB7 ", pinTargetLabel(inspect), " \xB7 ", inspect.cost, " EN \xB7 ", /*#__PURE__*/React.createElement(PinRankInfo, {
    pin: inspect
  }), " ", /*#__PURE__*/React.createElement(TypeChips, {
    elements: [inspect.element || badgeElement(inspect)]
  }), equippedBy(profile, name, inspect.id) && /*#__PURE__*/React.createElement("span", null, " \xB7 \xC9quip\xE9 par ", equippedBy(profile, name, inspect.id)), /*#__PURE__*/React.createElement("small", null, " \xB7 Retouche ce badge pour ", draft.includes(inspect.id) ? "le retirer" : "l’équiper", ".")), draft.length === 3 && /*#__PURE__*/React.createElement("p", {
    className: "equipment-help"
  }, "Retire un psych \xE9quip\xE9 pour le remplacer."), !draft.length && /*#__PURE__*/React.createElement("p", {
    className: "equipment-help"
  }, "\xC9quipe au moins 1 psych."), /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Pages des psychs"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: !page,
    onClick: () => setPage(page - 1),
    "aria-label": "Page pr\xE9c\xE9dente"
  }, "\u2039"), /*#__PURE__*/React.createElement("span", null, page + 1, " / ", pages), /*#__PURE__*/React.createElement("button", {
    disabled: page + 1 >= pages,
    onClick: () => setPage(page + 1),
    "aria-label": "Page suivante"
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    disabled: !draft.length,
    onClick: () => {
      save(draft);
      setOpen(false);
    }
  }, "Enregistrer"))));
}
const badgeGradeOrder = {
  "---": 0,
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
  Reaper: 6,
  Angel: 7
};
function BadgeCatalogue({
  owned,
  copies = {},
  embedded = false
}) {
  const Panel = embedded ? InlinePanel : WishDialog;
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState("number");
  const collected = collectionPins.filter(pin => owned.includes(pin.id));
  const sorted = [...collected].sort((a, b) => sort === "grade" ? (badgeGradeOrder[pinGrade(a)] ?? 0) - (badgeGradeOrder[pinGrade(b)] ?? 0) || a.name.localeCompare(b.name) : sort === "element" ? elementNames[a.element || badgeElement(a)].localeCompare(elementNames[b.element || badgeElement(b)]) || a.name.localeCompare(b.name) : sort === "power" ? b.power - a.power || a.name.localeCompare(b.name) : (Number.parseInt(a.number) || 9999) - (Number.parseInt(b.number) || 9999));
  const pages = Math.max(1, Math.ceil(sorted.length / 16));
  const move = delta => {
    setPage(page + delta);
    setSelected(null);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, !embedded && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setPage(0);
      setSelected(null);
      setOpen(true);
    }
  }, "Catalogue des badges"), (open || embedded) && /*#__PURE__*/React.createElement(Panel, {
    className: "badge-book",
    title: "Badges",
    close: () => setOpen(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "badge-counter"
  }, collected.length, " / ", collectionPins.length, " obtenus"), /*#__PURE__*/React.createElement("div", {
    className: "badge-sort",
    "aria-label": "Trier les badges"
  }, [["number", "N°"], ["grade", "Classe"], ["element", "Type"], ["power", "Puissance"]].map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    "aria-pressed": sort === id,
    onClick: () => {
      setSort(id);
      setPage(0);
      setSelected(null);
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "badge-slots"
  }, Array.from({
    length: 16
  }, (_, i) => {
    const index = page * 16 + i,
      pin = sorted[index];
    if (!pin) return /*#__PURE__*/React.createElement("span", {
      key: index,
      className: "badge-slot",
      "aria-hidden": "true"
    });
    return /*#__PURE__*/React.createElement("button", {
      key: pin.id,
      className: "badge-slot",
      "aria-label": `${pin.name} · ${pinTargetLabel(pin)} · ${copies[pin.id] || 1} exemplaire(s)`,
      "aria-pressed": selected?.id === pin.id,
      onClick: () => setSelected(pin)
    }, /*#__PURE__*/React.createElement(BadgeArt, {
      pin: pin
    }), /*#__PURE__*/React.createElement(PinTargetBadge, {
      pin: pin
    }), (copies[pin.id] || 1) > 1 && /*#__PURE__*/React.createElement("span", {
      className: "badge-copy"
    }, "\xD7", copies[pin.id]));
  })), selected && /*#__PURE__*/React.createElement("p", {
    className: "badge-info",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("b", null, "#", selected.number, " ", selected.name), " \xB7 ", types[selected.kind], " \xB7 ", pinTargetLabel(selected), " \xB7 ", selected.cost, " EN \xB7 ", /*#__PURE__*/React.createElement(PinRankInfo, {
    pin: selected
  }), " ", /*#__PURE__*/React.createElement(TypeChips, {
    elements: [selected.element || badgeElement(selected)]
  })), /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Pages du catalogue"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: !page,
    "aria-label": "Page pr\xE9c\xE9dente",
    onClick: () => move(-1)
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    "aria-live": "polite"
  }, page + 1, " / ", pages), /*#__PURE__*/React.createElement("button", {
    disabled: page + 1 >= pages,
    "aria-label": "Page suivante",
    onClick: () => move(1)
  }, "\u203A")), !embedded && /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer"), /*#__PURE__*/React.createElement("small", null, "Visuels DS \xB7 NightOwl35. Donn\xE9es \xB7 TWEWY Wiki.")));
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
function dailyQuestsFor(p) {
  const progress = refreshDailyQuests(p).dailyQuestProgress;
  return [{
    id: "daily-wave",
    title: "Remporter 1 vague",
    progress: progress.waves,
    goal: 1,
    reward: 50
  }, {
    id: "daily-enemies",
    title: "Vaincre 5 ennemis",
    progress: progress.enemies,
    goal: 5,
    reward: 50
  }, {
    id: "daily-burst",
    title: "Déclencher 1 Sync Burst",
    progress: progress.bursts,
    goal: 1,
    reward: 100
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
function claimDailyQuests(p, ids) {
  const current = refreshDailyQuests(p),
    ready = dailyQuestsFor(current).filter(q => ids.includes(q.id) && q.progress >= q.goal && !current.claimedDailyQuests.includes(q.id));
  return {
    ...current,
    coins: current.coins + ready.reduce((sum, q) => sum + q.reward, 0),
    claimedDailyQuests: [...current.claimedDailyQuests, ...ready.map(q => q.id)]
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
    daily = dailyQuestsFor(profile),
    ready = quests.filter(q => q.progress >= q.goal && !profile.claimedQuests.includes(q.id)),
    dailyReady = daily.filter(q => q.progress >= q.goal && !profile.claimedDailyQuests.includes(q.id));
  const [category, setCategory] = useState("daily");
  return /*#__PURE__*/React.createElement(React.Fragment, null, !embedded && /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(true)
  }, "Qu\xEAtes", ready.length ? ` · ${ready.length}` : ""), (open || embedded) && /*#__PURE__*/React.createElement(Panel, {
    className: "quest-menu",
    title: "Qu\xEAtes",
    close: () => setOpen(false)
  }, /*#__PURE__*/React.createElement("p", null, category === "daily" ? "3 missions par jour · 200 pièces au total" : "Récompenses uniques · Progression rétroactive"), profile.floorRecoveryAvailable && /*#__PURE__*/React.createElement("button", {
    className: "floor-recovery",
    onClick: () => save(p => ({
      ...p,
      bestFloor: Math.max(p.bestFloor, 10),
      floorRecoveryAvailable: false
    }))
  }, "Rattraper mon ancien \xE9tage 10"), /*#__PURE__*/React.createElement("div", {
    className: "quest-tabs"
  }, [["daily", "Quotidiennes"], ["floor", "Étages"], ["badges", "Collection"], ["other", "Personnages"], ["pc", "Missions PC"]].map(([id, name]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    "aria-pressed": category === id,
    onClick: () => setCategory(id)
  }, name))), category === "pc" ? /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "quest-list pc-mission-coins"
  }, /*#__PURE__*/React.createElement("p", null, "Score PC \xF7 10 = pi\xE8ces \xB7 Cr\xE9dit automatique"), missionStatus === "error" && /*#__PURE__*/React.createElement("p", {
    role: "alert"
  }, "Missions PC indisponibles. Les cr\xE9dits pr\xE9c\xE9dents sont conserv\xE9s ; v\xE9rifie la connexion et les r\xE8gles Firebase."), /*#__PURE__*/React.createElement("p", null, "Total re\xE7u : ", Object.values(profile.pcMissionCoins).reduce((a, b) => a + b, 0), " pi\xE8ces"), Object.keys(profile.pcMissionCoins).length ? Object.entries(profile.pcMissionCoins).sort(([a], [b]) => b.localeCompare(a)).map(([day, coins]) => /*#__PURE__*/React.createElement("article", {
    key: day
  }, /*#__PURE__*/React.createElement("b", null, day.split("-").reverse().join("/")), /*#__PURE__*/React.createElement("span", null, coins, " pi\xE8ces cr\xE9dit\xE9es"))) : /*#__PURE__*/React.createElement("p", null, "Ouvre le jeu connect\xE9 au m\xEAme compte que sur PC pour r\xE9cup\xE9rer tes missions pass\xE9es.")) : /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "quest-list"
  }, (category === "daily" ? daily : quests.filter(q => category === "other" ? !/^(floor|badges)-/.test(q.id) : q.id.startsWith(category + "-"))).map(q => {
    const claimed = category === "daily" ? profile.claimedDailyQuests.includes(q.id) : profile.claimedQuests.includes(q.id),
      done = q.progress >= q.goal;
    return /*#__PURE__*/React.createElement("article", {
      key: q.id
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, q.title), /*#__PURE__*/React.createElement("small", null, Math.min(q.goal, q.progress), " / ", q.goal, " \xB7 ", q.reward, " pi\xE8ces"), /*#__PURE__*/React.createElement("progress", {
      max: q.goal,
      value: Math.min(q.goal, q.progress),
      "aria-label": q.title
    })), /*#__PURE__*/React.createElement("button", {
      disabled: claimed || !done,
      onClick: () => save(p => category === "daily" ? claimDailyQuests(p, [q.id]) : claimQuests(p, [q.id]))
    }, claimed ? "Récupéré" : "Récupérer"));
  })), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: category === "daily" ? !dailyReady.length : !ready.length,
    onClick: () => save(p => category === "daily" ? claimDailyQuests(p, dailyQuestsFor(p).map(q => q.id)) : claimQuests(p, questsFor(p).map(q => q.id)))
  }, "Tout r\xE9cup\xE9rer \xB7 ", (category === "daily" ? dailyReady : ready).reduce((sum, q) => sum + q.reward, 0), " pi\xE8ces"), !embedded && /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(false)
  }, "Fermer"))));
}

// Explicit one-time recovery requested for Cetruc: difficulty tier 5 begins on floor 41.
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
  return /*#__PURE__*/React.createElement("section", {
    className: `hub-panel ${className}`
  }, /*#__PURE__*/React.createElement("h2", null, title), children);
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
const hubScreens = [["home", "Accueil", "⌂"], ["team", "Team", "♟"], ["summon", "Invocations", "✦"], ["leaderboard", "Classement", "♛"], ["social", "Social", "◎"], ["menu", "Menu", "☰"]];
function PvpInviteNotifications() {
  const seen = React.useRef(new Set());
  useEffect(() => {
    const service = window.ChibiSocial;
    if (!service?.ready?.()) return;
    let first = true;
    const stop = service.watch(data => {
      const invites = Array.isArray(data.invites) ? data.invites : [];
      for (const invite of invites) {
        const key = `${invite.uid || ""}:${invite.createdAt || ""}`;
        if (!invite?.uid || seen.current.has(key)) continue;
        seen.current.add(key);
        if (!first && typeof Notification !== "undefined" && Notification.permission === "granted") {
          try { new Notification(`${invite.name || "Un joueur"} vous a défié !`, { body: "Match privé Casual · ouvre PVP pour accepter." }); } catch {}
        }
      }
      first = false;
    }, () => {});
    return () => stop?.();
  }, []);
  return null;
}
function InboxPanel({ profile, claim }) {
  const entries = inboxEntries(profile);
  return /*#__PURE__*/React.createElement("main", { className: "inbox-panel hub-panel" }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("small", null, "REAPERS’ MAIL"), /*#__PURE__*/React.createElement("h1", null, "Boîte de réception"), /*#__PURE__*/React.createElement("p", null, entries.length ? "Des cadeaux t’attendent. Récupère-les quand tu le souhaites." : "Aucun nouveau cadeau pour le moment.")), /*#__PURE__*/React.createElement(LandscapeRecords, { className: "inbox-list" }, entries.length ? entries.map(entry => /*#__PURE__*/React.createElement("article", { key: entry.id }, /*#__PURE__*/React.createElement("span", { className: "inbox-gift", "aria-hidden": "true" }, "✦"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "CADEAU"), /*#__PURE__*/React.createElement("h2", null, entry.title), /*#__PURE__*/React.createElement("p", null, entry.text), /*#__PURE__*/React.createElement("b", null, entry.reward)), /*#__PURE__*/React.createElement("button", { type: "button", onClick: () => claim(entry.claim) }, "Récupérer"))) : /*#__PURE__*/React.createElement("p", { className: "inbox-empty" }, "Tes prochaines récompenses apparaîtront ici.")));
}
// Keep long collections usable in landscape with a direct record picker.
function LandscapeRecords({className, children}) {
  const [key, select] = useState("");
  const landscape = React.useSyncExternalStore(subscribeLandscape, isLandscape);
  const rows = React.Children.toArray(children);
  if (!landscape || rows.length <= 4) return React.createElement("div", {className}, children);
  const records = rows.filter(row => React.isValidElement(row) && (row.type === "article" || row.type === "button"));
  if (records.length <= 4) return React.createElement("div", {className}, children);
  const current = records.find(row => String(row.key) === key) || records[0];
  const other = rows.filter(row => !records.includes(row));
  const options = records.map((row, i) => React.createElement("option", {key:row.key, value:String(row.key)},
    (i + 1) + " · " + recordText(row).slice(0,100)));
  return React.createElement("div", {className:className + " record-picker"}, ...other,
    React.createElement("select", {value:String(current.key), "aria-label":document.documentElement.lang === "en" ? "Select an entry" : "Choisir une entrée", onChange:event => select(event.target.value)}, options), current);
}
function recordText(node) {
  if (Array.isArray(node)) return node.map(recordText).filter(Boolean).join(" ");
  if (React.isValidElement(node)) return recordText(node.props.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}
function isLandscape() { return window.matchMedia("(orientation:landscape)").matches; }
function subscribeLandscape(change) {
  const media = window.matchMedia("(orientation:landscape)");
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}

// Refit measured content when a team, tab, font or the available viewport changes.
function fitHubPanel(area) {
  const panel = area.querySelector(".hub-screen > :is(.hub-panel,.pvp-panel)");
  if (!panel) return;
  const media = window.matchMedia("(orientation:landscape)");
  const fit = () => {
    if (!media.matches) {
      panel.style.removeProperty("--panel-scale");
      panel.style.removeProperty("--panel-height");
      return;
    }
    const height = area.clientHeight;
    if (!height) return;
    // Measure the intrinsic rows first. Container units inside CSS zoom can
    // change coordinate systems on WebKit and inflate the very rows being fitted.
    panel.style.setProperty("--panel-height", "0px");
    const fits = (scale) => {
      panel.style.setProperty("--panel-scale", String(scale));
      return area.scrollHeight <= height + 1 && area.scrollWidth <= area.clientWidth + 1;
    };
    let scale = 1;
    if (!fits(scale)) {
      let low = 0.25, high = 1;
      for (let step = 0; step < 7; step++) {
        const mid = (low + high) / 2;
        if (fits(mid)) low = mid;
        else high = mid;
      }
      scale = low;
      panel.style.setProperty("--panel-scale", String(scale));
    }
    panel.style.setProperty("--panel-height", Math.floor(height / scale) + "px");
  };
  fit();
  const resize = new ResizeObserver(fit);
  resize.observe(area);
  resize.observe(panel);
  const changes = new MutationObserver(fit);
  changes.observe(panel, {childList:true, characterData:true, subtree:true});
  area.addEventListener("load", fit, true);
  document.fonts?.addEventListener("loadingdone", fit);
  media.addEventListener("change", fit);
  return () => {
    resize.disconnect();
    changes.disconnect();
    area.removeEventListener("load", fit, true);
    document.fonts?.removeEventListener("loadingdone", fit);
    media.removeEventListener("change", fit);
  };
}

function GameHub({
  profile,
  screen,
  navigate,
  openNews,
  children
}) {
  useMusic("hub");
  const content = React.useRef(null);
  React.useLayoutEffect(() => {
    if (content.current && screen !== "menu") return fitHubPanel(content.current);
  }, [screen]);
  useEffect(() => { if (content.current) content.current.scrollTop = 0; }, [screen]);
  const inboxCount = inboxEntries(profile).length;
  const player = experience(profile.playerXp || 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "game-hub game-shell",
    "data-screen": screen
  }, /*#__PURE__*/React.createElement(PvpInviteNotifications, null), /*#__PURE__*/React.createElement("header", {
    className: "hub-header"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hub-profile",
    onClick: () => navigate("profile"),
    "aria-label": "Ouvrir mon profil"
  }, /*#__PURE__*/React.createElement(HudPortrait, { fighter: characterRoster.find(f => f.name === profile.avatar) || characterRoster[0] }), /*#__PURE__*/React.createElement("span", { className: "hub-profile-copy" },
    /*#__PURE__*/React.createElement("b", null, window.ChibiGameSync?.identity?.name || "Joueur"),
    /*#__PURE__*/React.createElement("small", null, "Niv. ", player.level),
    /*#__PURE__*/React.createElement("progress", { value: player.required ? player.current : 1, max: player.required || 1, "aria-label": "Progression du niveau" })
  )), /*#__PURE__*/React.createElement("div", {
    className: "hub-wallet"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-label": `${profile.coins} pièces`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin"
  }), profile.coins.toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")), /*#__PURE__*/React.createElement("small", null, "\u2726 ", availableFreeWishes(profile), " gratuits")), /*#__PURE__*/React.createElement("button", {
    className: "hub-inbox",
    "data-unread": inboxCount > 0 ? "true" : undefined,
    onClick: () => navigate("inbox"),
    "aria-label": inboxCount ? `${inboxCount} cadeau à récupérer` : "Ouvrir la boîte de réception"
  }, /*#__PURE__*/React.createElement("span", { "aria-hidden": "true" }, "✉"), inboxCount > 0 && /*#__PURE__*/React.createElement("b", null, inboxCount)), /*#__PURE__*/React.createElement("button", {
    className: "hub-news",
    onClick: openNews,
    "aria-label": "Consulter les nouveaut\xE9s"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "NEWS")), /*#__PURE__*/React.createElement("button", {
    className: "hub-fullscreen",
    onClick: gameFullscreen,
    "aria-label": "Basculer le plein \xE9cran"
  }, "\u26F6")), React.createElement("div", {className: "hub-content", ref: content}, React.createElement("div", {className: "hub-screen", key: screen}, children)), /*#__PURE__*/React.createElement("nav", {
    className: "hub-nav",
    "aria-label": "Navigation du jeu"
  }, hubScreens.map(([id, label, icon]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    "aria-current": screen === id ? "page" : undefined,
    "data-section-active": id === "menu" && ["collection","settings","bestiary","quests","journal","pvp"].includes(screen) || id === "home" && ["roguelike","events"].includes(screen) || undefined,
    onClick: () => navigate(id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "hub-nav-orb",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("i", null, icon)), /*#__PURE__*/React.createElement("b", null, label)))));
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
    pin = psychs[basePsych[fighter.name]],
    passive = characterPassives[fighter.name];
  return /*#__PURE__*/React.createElement("article", {
    className: "character-dossier",
    style: {
      "--character-accent": fighter.accent
    }
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("small", null, fighter.role), /*#__PURE__*/React.createElement("h3", null, characterLabel(fighter.name)), /*#__PURE__*/React.createElement(TypeChips, {
    elements: characterElements[fighter.name]
  })), /*#__PURE__*/React.createElement("div", {
    className: "dossier-art"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dossier-orbit",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement(SpritePreview, {
    fighter: fighter,
    maximumScale: 2.6
  }), /*#__PURE__*/React.createElement(RankBadge, {
    level: rank
  })), /*#__PURE__*/React.createElement("div", {
    className: "dossier-stats"
  }, /*#__PURE__*/React.createElement("p", null, reference ? "Stats de base · Niveau 1 · Rang E" : `Ta progression · Niveau ${stats.level} · Rang ${rank === 5 ? "étoile" : ranks[rank]}`), /*#__PURE__*/React.createElement("dl", null, [["PV", stats.maxHp], ["ATK", stats.atk], ["ATK SPE", stats.mag], ["SPE", stats.speed]].map(([name, value]) => /*#__PURE__*/React.createElement("div", {
    key: name
  }, /*#__PURE__*/React.createElement("dt", null, name), /*#__PURE__*/React.createElement("dd", null, value)))), /*#__PURE__*/React.createElement("div", {
    className: "dossier-passive"
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "✦"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "Passif · ", passive.name), /*#__PURE__*/React.createElement("b", null, passive.description))), /*#__PURE__*/React.createElement("div", {
    className: "dossier-psych"
  }, /*#__PURE__*/React.createElement(PinIcon, {
    pin: pin
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "Psych de d\xE9part"), /*#__PURE__*/React.createElement("b", null, pin.name.replace(" (Pin)", "")))), profile.owned.includes(fighter.name) && (profile.loadout[fighter.name] || []).length > 0 && /*#__PURE__*/React.createElement("div", { className: "dossier-equipped" }, /*#__PURE__*/React.createElement("small", null, "Psychs équipés"), (profile.loadout[fighter.name] || []).map(id => { const equipped = psychs[id]; return equipped ? /*#__PURE__*/React.createElement("span", { key: id }, /*#__PURE__*/React.createElement(PinIcon, { pin: equipped }), equipped.name.replace(" (Pin)", ""), " · ", pinTargetLabel(equipped)) : null; })), rate !== undefined && /*#__PURE__*/React.createElement("p", {
    className: "dossier-rate"
  }, "Prochain v\u0153u \xB7 ", (rate * 100).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    maximumFractionDigits: 3
  }), " %"), !reference && /*#__PURE__*/React.createElement("p", null, profile.copies[fighter.name] || 0, " / 5 doublons", profile.awakened.includes(fighter.name) ? " · Éveillé" : "")));
}
function Collection({
  profile,
  awaken,
  openPortal,
  openEvent
}) {
  const [tab, setTab] = useState("characters");
  return React.createElement("section", {
    className: "hub-panel collection-workspace"
  }, React.createElement("h1", null, "Collection"), React.createElement("div", {
    className: "hub-tabs noir-tabs",
    role: "group",
    "aria-label": "Parcourir la collection"
  }, React.createElement("button", {
    "aria-pressed": tab === "characters",
    onClick: () => setTab("characters")
  }, "Personnages"), React.createElement("button", {
    "aria-pressed": tab === "badges",
    onClick: () => setTab("badges")
  }, "Badges")), tab === "characters" ? React.createElement(CharacterCollection, {
    profile: profile,
    awaken: awaken,
    openPortal: openPortal,
    openEvent: openEvent
  }) : React.createElement(BadgeCatalogue, {
    embedded: true,
    owned: profile.pins,
    copies: profile.pinCopies
  }));
}
function CharacterCollection({
  profile,
  awaken,
  openPortal,
  openEvent
}) {
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(null);
  const roster = visibleCollectionRoster(),
    isOwned = name => profile.owned.includes(name);
  const canAwaken = name => isOwned(name) && profile.copies[name] === 5 && !profile.awakened.includes(name);
  const matches = roster.filter(fighter => [fighter.name, characterLabel(fighter.name)].some(name => name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) && (filter === "owned" ? isOwned(fighter.name) : filter === "missing" ? !isOwned(fighter.name) : filter === "awakening" ? canAwaken(fighter.name) : true));
  const sources = selected ? Object.entries(portals).filter(([id]) => portalAvailable(id) && portalRoster(id).some(fighter => fighter.name === selected.name)) : [];
  return React.createElement("section", {
    className: "character-collection"
  }, React.createElement("p", null, roster.filter(fighter => isOwned(fighter.name)).length, " / ", roster.length, " d\xE9bloqu\xE9s"), React.createElement("label", {
    className: "collection-search"
  }, "Rechercher un personnage", React.createElement("input", {
    type: "search",
    value: query,
    onChange: event => setQuery(event.target.value)
  })), React.createElement("div", {
    className: "hub-tabs noir-tabs",
    role: "group",
    "aria-label": "Filtrer les personnages"
  }, [["all", "Tous"], ["owned", "Débloqués"], ["missing", "Non obtenus"], ["awakening", "Éveil disponible"]].map(([id, label]) => React.createElement("button", {
    key: id,
    "aria-pressed": filter === id,
    onClick: () => setFilter(id)
  }, label))), !matches.length && React.createElement("p", {
    role: "status"
  }, "Aucun personnage trouv\xE9."), React.createElement("div", {
    className: "character-grid"
  }, matches.map(fighter => {
    const owned = isOwned(fighter.name);
    return React.createElement("button", {
      key: fighter.name,
      className: owned ? "" : "not-owned",
      onClick: () => setSelected(fighter),
      "aria-label": `Fiche de ${characterLabel(fighter.name)}`
    }, React.createElement(HudPortrait, {
      fighter: fighter
    }), React.createElement("b", null, characterLabel(fighter.name)), React.createElement("small", null, canAwaken(fighter.name) ? "Éveil disponible" : owned ? `Niv. ${experience(profile.xp[fighter.name] || 0).level} · ${ranks[profile.levels[fighter.name] || 0]}` : "Non obtenu"));
  })), selected && React.createElement(WishDialog, {
    className: "character-sheet-dialog",
    title: `Fiche · ${characterLabel(selected.name)}`,
    close: () => setSelected(null)
  }, React.createElement(CharacterDossier, {
    fighter: selected,
    profile: profile
  }), canAwaken(selected.name) && React.createElement("button", {
    onClick: () => awaken(selected.name)
  }, "\xC9veiller \xB7 +", awakeningHpBonus(selected.name), " PV max"), React.createElement("section", {
    className: "recruitment-sources"
  }, React.createElement("h3", null, "Sources d\u2019obtention"), sources.map(([id, title]) => React.createElement("button", {
    key: id,
    onClick: () => openPortal(id)
  }, React.createElement("span", null, "Portail"), " ", React.createElement("strong", null, id === "shibuya" ? "First Week #1" : title), React.createElement("span", {
    "aria-hidden": "true"
  }, "\u203A"))), React.createElement("button", {
    onClick: () => openEvent(selected.name)
  }, React.createElement("span", null, "\xC9v\xE9nement"), " ", React.createElement("strong", null, characterLabel(selected.name)), React.createElement("span", {
    "aria-hidden": "true"
  }, "\u203A"))), React.createElement("button", {
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
    hp = (hero.maxHp + 199 * 5) * 10;
  return [{
    id: 30,
    kind: "event-" + boss,
    name: boss,
    hp,
    maxHp: hp,
    attack: Math.round((Math.max(stats[0], stats[1]) + 398) * 1.5),
    speed: stats[2] + 215,
    level: 200,
    boss: true,
    trait: "berserk",
    xp: 0
  }];
}
function readEvent(raw, owned, copies, awake) {
  if (!raw || !characterRoster.some(f => f.name === raw.boss)) return null;
  const run = validRun(raw.run, owned, copies, awake);
  if (!run || run.wave > 3 || run.wave < 3 && run.enemies.some(e => e.level !== 100) || run.wave === 3 && !run.enemies.every(e => e.kind === "event-" + raw.boss)) return null;
  const migrated = run.wave === 3 && run.enemies.some(e => e.level !== 200) ? {
    ...run,
    enemies: eventWave(raw.boss, 3, run.id).map((enemy, index) => {
      const old = run.enemies[index];
      return {
        ...enemy,
        hp: old ? Math.max(0, Math.round(enemy.maxHp * old.hp / Math.max(1, old.maxHp))) : enemy.hp
      };
    })
  } : run;
  return {
    boss: raw.boss,
    run: migrated,
    prize: ["character", "pin"].includes(raw.prize) ? raw.prize : "none"
  };
}
function eventCheckpoint(p, snapshot, gains = {}) {
  const active = p.eventRun;
  if (!active || active.run.status !== "active" || snapshot.id !== active.run.id || snapshot.seq <= active.run.seq) return p;
  let prize = "none",
    next = p;
  if (snapshot.wave === 3 && snapshot.status === "complete" && snapshot.enemies.every(e => e.hp === 0)) {
    const roll = Math.random(),
      name = active.boss;
    prize = roll < .01 ? "character" : roll < .06 ? "pin" : "none";
    if (prize === "pin") next = grantPins(p, [signaturePins[name].id]);
    if (prize === "character") {
      const existing = Math.max(0, Math.floor(Number(p.copies[name]) || 0));
      const copies = p.owned.includes(name) ? Math.min(5, existing + 1) : 0;
      const compensation = p.owned.includes(name) && existing >= 5 ? 1000 : 0;
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
        },
        coins: p.coins + compensation
      };
    }
  }
  const before = experience(p.playerXp || 0), after = experience((p.playerXp || 0) + (gains.xp || 0));
  return advanceDailyProgress({
    ...next,
    playerXp: after.xp,
    coins: next.coins + Math.max(0, after.level - before.level) * 100,
    eventRun: {
      ...active,
      run: snapshot,
      prize
    }
  }, gains);
}
function EventHall({
  profile,
  start,
  navigate,
  abandon,
  target
}) {
  const rail = React.useRef(null),
    [confirm, setConfirm] = useState(false);
  const current = profile.eventRun,
    active = current?.run.status === "active" ? current : null;
  const ready = profile.equipped.filter(Boolean).length === 2 && profile.equipped.every(n => profile.loadout[n]?.length) && profile.equipped.some(n => profile.loadout[n]?.some(offensive));
  React.useLayoutEffect(() => {
    const list = rail.current;
    const card = Array.from(list?.children || []).find(child => child.getAttribute("data-hero") === target);
    if (list && card) list.scrollLeft += card.getBoundingClientRect().left - list.getBoundingClientRect().left;
  }, [target]);
  function scroll(direction) {
    const el = rail.current;
    if (!el?.children.length) return;
    const cards = Array.from(el.children);
    const here = cards.reduce((a, b) => Math.abs(b.offsetLeft - el.scrollLeft) < Math.abs(a.offsetLeft - el.scrollLeft) ? b : a);
    el.scrollTo({
      left: cards[Math.max(0, Math.min(cards.length - 1, cards.indexOf(here) + direction))].offsetLeft,
      behavior: "smooth"
    });
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "hub-panel event-hall"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h1", null, "\xC9v\xE9nement"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    "aria-label": "Pr\xE9c\xE9dent",
    onClick: () => scroll(-1)
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Suivant",
    onClick: () => scroll(1)
  }, "\u203A"))), /*#__PURE__*/React.createElement("p", null, "2 vagues niveau 100 puis un boss niveau 200"), active && /*#__PURE__*/React.createElement("div", {
    className: "event-resume"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => start(active.boss)
  }, "Reprendre \xB7 ", active.boss, " \xB7 ", active.run.wave, "/3"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirm(true)
  }, "Abandonner")), confirm && /*#__PURE__*/React.createElement(WishDialog, {
    title: "Abandonner cet \xE9v\xE9nement ?",
    close: () => setConfirm(false)
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirm(false)
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      abandon();
      setConfirm(false);
    }
  }, "Confirmer")), !ready && !active && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team")
  }, "Pr\xE9parer le duo"), /*#__PURE__*/React.createElement("div", {
    className: "event-rail",
    ref: rail,
    "aria-label": "\xC9v\xE9nements"
  }, visibleCollectionRoster().map(hero => /*#__PURE__*/React.createElement("article", {
    key: hero.name,
    "data-hero": hero.name,
    "data-selected": target === hero.name || undefined
  }, /*#__PURE__*/React.createElement("div", {
    className: "event-preview"
  }, /*#__PURE__*/React.createElement(SpritePreview, {
    fighter: hero,
    maximumScale: 2.4
  })), /*#__PURE__*/React.createElement("h2", null, characterLabel(hero.name)), /*#__PURE__*/React.createElement(TypeChips, {
    elements: characterElements[hero.name]
  }), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "5 %"), " \xB7 ", signaturePins[hero.name].name, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", null, "1 %"), " \xB7 ", characterLabel(hero.name)), /*#__PURE__*/React.createElement("button", {
    disabled: active ? active.boss !== hero.name : !ready,
    onClick: () => start(hero.name)
  }, active?.boss === hero.name ? "Reprendre" : "Défier")))));
}
// PvP has its own durable balance layer. It never changes PvE stats: a match
// starts with a larger health pool while every offensive psych is toned down.
const pvpBalance = Object.freeze({ hp: 1.55, damage: .55, maxSingleHit: .18, maxAoeHit: .12 });
function pvpTeam(profile, mode) {
  return profile.equipped.filter(Boolean).map(name => {
    const base = characterRoster.find(item => item.name === name),
      fighter = mode === "casual" ? trained(base, xpAtLevel(50), false, 5) : trained(base, profile.xp[name] || 0, profile.awakened.includes(name), profile.copies[name] || 0);
    const maxHp = Math.max(1, Math.round(fighter.maxHp * pvpBalance.hp));
    return {
      name,
      hp: maxHp,
      maxHp,
      atk: fighter.atk || 1,
      mag: fighter.mag || 1,
      speed: fighter.speed || 1,
      loadout: [...(profile.loadout[name] || [])]
    };
  });
}
function resolvePvpRoom(room) {
  const ids = [room.host, room.guest],
    teams = Object.fromEntries(ids.map(uid => [uid, room.players[uid].team.map(f => ({
      ...f
    }))]));
  const shields = new Map(),
    roundLog = [],
    order = ids.flatMap(uid => teams[uid].map((fighter, index) => ({
      uid,
      index,
      speed: fighter.speed
    }))).filter(item => teams[item.uid][item.index].hp > 0).sort((a, b) => b.speed - a.speed || a.uid.localeCompare(b.uid));
  for (const step of order) {
    const fighter = teams[step.uid][step.index],
      plan = room.actions?.[step.uid]?.plans?.[String(step.index)];
    if (!plan || fighter.hp <= 0) continue;
    const rival = ids.find(uid => uid !== step.uid),
      enemyTeam = teams[rival];
    if (plan.kind === "guard") {
      shields.set(`${step.uid}:${step.index}`, .55);
      roundLog.push({ type: "guard", actorUid: step.uid, actorIndex: step.index, actorName: fighter.name });
      continue;
    }
    const pin = psychs[plan.pin || ""];
    if (!pin || !fighter.loadout.includes(pin.id)) continue;
    if (pin.kind === "heal") {
      const amount = scaledPinEffect(pin, fighter.mag * pin.power / 50 * passiveHealingMultiplier(fighter.name));
      teams[step.uid] = teams[step.uid].map(member => member.hp > 0 ? {
        ...member,
        hp: Math.min(member.maxHp, member.hp + amount)
      } : member);
      roundLog.push({ type: "heal", actorUid: step.uid, actorIndex: step.index, actorName: fighter.name, pinName: pin.name, amount });
      continue;
    }
    if (pin.kind === "guard" || pin.kind === "support") {
      teams[step.uid].forEach((member, index) => member.hp > 0 && shields.set(`${step.uid}:${index}`, Math.max(shields.get(`${step.uid}:${index}`) || 0, pinShieldReduction(pin))));
      roundLog.push({ type: "support", actorUid: step.uid, actorIndex: step.index, actorName: fighter.name, pinName: pin.name });
      continue;
    }
    const kind = pin.kind === "physical" ? "physical" : "special",
      partnerAlive = teams[step.uid].some((member, index) => index !== step.index && member.hp > 0),
      raw = scaledPinEffect(pin, (pin.kind === "physical" ? fighter.atk : fighter.mag) * (.7 + pin.power / 100) * stabMultiplier(fighter, pin) * passiveDamageMultiplier(fighter.name, kind, fighter.hp, fighter.maxHp, partnerAlive) * pvpBalance.damage);
    const live = enemyTeam.map((member, index) => ({
        member,
        index
      })).filter(item => item.member.hp > 0),
      targets = (pinTargetMode(pin) === "aoe" ? live : [live.find(item => item.index === plan.target) || live[0]]).filter(Boolean);
    targets.forEach(({
      member,
      index
    }) => {
      const reduction = Math.min(.8, (shields.get(`${rival}:${index}`) || 0) + passiveDamageReduction(member.name)),
        evades = deterministicChance(passiveDodgeChance(member.name), `${room.turn}:${step.uid}:${fighter.name}:${member.name}:${pin.id}`),
        uncappedDamage = typedDamage(raw, pin.element || badgeElement(pin), characterElements[member.name]) * (1 - reduction),
        cap = member.maxHp * (pinTargetMode(pin) === "aoe" ? pvpBalance.maxAoeHit : pvpBalance.maxSingleHit),
        damage = evades ? 0 : Math.max(1, Math.min(Math.floor(cap), Math.round(uncappedDamage)));
      enemyTeam[index] = {
        ...member,
        hp: Math.max(0, member.hp - damage)
      };
      roundLog.push({ type: "attack", actorUid: step.uid, actorIndex: step.index, actorName: fighter.name, targetUid: rival, targetIndex: index, targetName: member.name, pinName: pin.name, damage, evaded });
    });
  }
  const next = {
    ...room,
    turn: room.turn + 1,
    actions: {},
    lastRoundLog: { turn: room.turn, events: roundLog },
    updatedAt: Date.now(),
    players: {
      ...room.players
    }
  };
  ids.forEach(uid => next.players[uid] = {
    ...room.players[uid],
    team: teams[uid]
  });
  const defeated = ids.filter(uid => teams[uid].every(f => f.hp <= 0));
  if (defeated.length || next.turn > 200) {
    next.status = "finished";
    next.winner = defeated.length === 1 ? ids.find(uid => uid !== defeated[0]) : null;
    next.reason = next.turn > 200 ? "draw" : "knockout";
  }
  return next;
}
function pvpSpriteAction(replay, uid, index) {
  if (replay?.actorUid !== uid || replay?.actorIndex !== index) return null;
  if (replay.type === "heal" || replay.type === "guard") return replay.type;
  if (replay.type !== "attack") return null;
  const pin = Object.values(psychs).find(pin => pin.name === replay.pinName);
  return pin?.kind === "special" ? "pyro" : "shockwave";
}
function PvpBattle({
  matchId,
  close
}) {
  const service = window.ChibiPvp,
    uid = window.ChibiGameSync?.accountId;
  const [room, setRoom] = useState(null),
    [error, setError] = useState(""),
    [plans, setPlans] = useState({}),
    [choosing, setChoosing] = useState(null),
    [targeting, setTargeting] = useState(null),
    [rating, setRating] = useState(null),
    [replay, setReplay] = useState(null),
    [replayImpact, setReplayImpact] = useState(null),
    [replayHealth, setReplayHealth] = useState(null);
  const replayedRounds = React.useRef(new Set());
  const receivedRoom = React.useRef(null);
  const startHealth = React.useRef(null);
  useEffect(() => {
    receivedRoom.current = null;
    startHealth.current = null;
    setReplayHealth(null);
    return service.watch(matchId, next => {
      const previous = receivedRoom.current;
      const turn = next?.lastRoundLog?.turn;
      if (next?.lastRoundLog?.events?.length && previous?.players && previous.turn === turn && previous.lastRoundLog?.turn !== turn) {
        const values = Object.fromEntries(Object.entries(previous.players).map(([id, player]) => [
          id, player.team.map(fighter => fighter.hp)
        ]));
        startHealth.current = { turn, values };
        setReplayHealth({ turn, values });
      }
      receivedRoom.current = next;
      setRoom(next);
    }, () => setError("Connexion au combat interrompue."));
  }, [matchId]);
  useEffect(() => {
    if (!room || room.status !== "active") return;
    const ids = [room.host, room.guest];
    if (ids.every(id => room.actions?.[id]?.turn === room.turn)) service.resolve(matchId, room.turn, resolvePvpRoom).catch(() => setError("Le tour n’a pas pu être résolu."));
  }, [room?.turn, room?.actions, room?.status]);
  useEffect(() => {
    if (room?.status === "finished" && room.mode === "ranked") service.settle(matchId, room).then(setRating).catch(() => {});
  }, [room?.status]);
  useEffect(() => {
    setPlans({});
    setChoosing(null);
    setTargeting(null);
  }, [room?.turn]);
  useEffect(() => {
    const log = room?.lastRoundLog;
    if (!log?.events?.length || replayedRounds.current.has(`${matchId}:${log.turn}`)) return;
    replayedRounds.current.add(`${matchId}:${log.turn}`);
    let cancelled = false;
    const play = async () => {
      let health = startHealth.current?.turn === log.turn ? startHealth.current.values : null;
      for (const event of log.events) {
        if (cancelled) return;
        const action = pvpSpriteAction(event, event.actorUid, event.actorIndex);
        const pin = event.pinName && Object.values(psychs).find(item => item.name === event.pinName);
        const cue = { name: event.actorName, kind: event.type === "attack" ? pin?.kind || "physical" : event.type, element: pin?.element || (pin && badgeElement(pin)) };
        if (event.type !== "attack" || event.damage > 0) window.ChibiBattleVfx?.warm(cue);
        const timing = fighterActionTiming(event.actorName, action);
        const impact = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : timing.impact;
        if (impact) await prepareFighterAction(event.actorName, action);
        if (cancelled) return;
        setReplay(event);
        setReplayImpact(null);
        if (impact) await new Promise(resolve => setTimeout(resolve, impact));
        if (cancelled) return;
        if (health?.[event.targetUid] && event.type === "attack") {
          health = { ...health, [event.targetUid]: health[event.targetUid].map((hp, index) =>
            index === event.targetIndex ? Math.max(0, hp - event.damage) : hp) };
        } else if (health?.[event.actorUid] && event.type === "heal") {
          health = { ...health, [event.actorUid]: health[event.actorUid].map((hp, index) =>
            hp > 0 ? Math.min(room.players[event.actorUid].team[index].maxHp, hp + event.amount) : hp) };
        }
        if (health) setReplayHealth({ turn: log.turn, values: health });
        setReplayImpact(event);
        const source = `${event.actorUid}:${event.actorIndex}`;
        if (event.type === "attack" && event.damage > 0) {
          playBattleVfx(".pvp-battlefield", [`${event.targetUid}:${event.targetIndex}`], cue, source);
        } else if (["heal", "guard", "support"].includes(event.type)) {
          const targets = event.type === "guard" ? [source] : room.players[event.actorUid].team
            .flatMap((fighter, index) => (health?.[event.actorUid]?.[index] ?? fighter.hp) > 0 ? [`${event.actorUid}:${index}`] : []);
          playBattleVfx(".pvp-battlefield", targets, cue, source);
        }
        if (event.type === "attack" && event.damage) gameSound.effect("hit");
        await new Promise(resolve => setTimeout(resolve, impact ? Math.max(280, timing.duration - impact) : event.type === "attack" ? 680 : 480));
      }
      if (!cancelled) { setReplay(null); setReplayImpact(null); setReplayHealth(null); }
    };
    play();
    return () => { cancelled = true; };
  }, [matchId, room?.lastRoundLog?.turn]);
  if (!room) return /*#__PURE__*/React.createElement("section", {
    className: "pvp-panel"
  }, /*#__PURE__*/React.createElement("h1", null, "PVP"), /*#__PURE__*/React.createElement("p", null, error || "Connexion à l’adversaire…"));
  const rival = room.host === uid ? room.guest : room.host,
    mine = room.players[uid],
    enemy = room.players[rival],
    submitted = room.actions?.[uid]?.turn === room.turn;
  const displayTeam = id => room.players[id].team.map((fighter, index) => ({
    ...fighter,
    hp: replayHealth?.turn === room.lastRoundLog?.turn ? replayHealth?.values[id]?.[index] ?? fighter.hp : fighter.hp
  }));
  const living = mine.team.map((f, index) => ({
      f,
      index
    })).filter(x => x.f.hp > 0),
    reserved = Object.values(plans).reduce((sum, plan) => sum + (plan.kind === "psych" ? psychs[plan.pin || ""]?.cost || 0 : 0), 0),
    ready = living.every(({
      index
    }) => plans[String(index)]) && reserved <= 3;
  const choosePlan = (index, plan) => {
    setPlans(old => ({
      ...old,
      [String(index)]: plan
    }));
    setChoosing(null);
    setTargeting(null);
  };
  const leave = async () => {
    if (room.status === "active") await service.forfeit(matchId);
    await service.closeMatch();
    close();
  };
  const order = [...mine.team.map((fighter, index) => ({
    side: "ally",
    fighter,
    index
  })), ...enemy.team.map((fighter, index) => ({
    side: "enemy",
    fighter,
    index
  }))].filter(entry => entry.fighter.hp > 0).sort((a, b) => b.fighter.speed - a.fighter.speed || a.side.localeCompare(b.side));
  const replayText = replayImpact?.type === "attack" ? `${replayImpact.actorName} · ${replayImpact.pinName} · ${replayImpact.evaded ? "Esquive !" : `−${replayImpact.damage} PV`}` : replayImpact?.type === "heal" ? `${replayImpact.actorName} · ${replayImpact.pinName} · +${replayImpact.amount} PV` : replay ? `${replay.actorName} · ${replay.pinName || "Défense"}` : "";
  const status = replayText || (submitted ? "Actions envoyées · attente de l’adversaire" : ready ? "Actions prêtes" : "Choisis une action par personnage");
  return /*#__PURE__*/React.createElement("main", {
    className: "game-shell combat-hud pvp-combat"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-lockup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "VS"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, room.mode === "ranked" ? "RANKED PVP" : "CASUAL PVP"), /*#__PURE__*/React.createElement("span", null, "REAPERS\u2019 NETWORK"))), /*#__PURE__*/React.createElement("div", {
    className: "run-stats"
  }, /*#__PURE__*/React.createElement("span", {
    className: "currency"
  }, "TOUR ", String(room.turn).padStart(2, "0")), /*#__PURE__*/React.createElement("button", {
    className: "currency",
    onClick: leave
  }, "Abandonner"), /*#__PURE__*/React.createElement(SoundToggle, null))), /*#__PURE__*/React.createElement("section", {
    className: "game-grid"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "squad-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, /*#__PURE__*/React.createElement("span", null, "PLAYER SQUAD"), /*#__PURE__*/React.createElement("b", null, "02 / 02")), displayTeam(uid).map((fighter, index) => {
    const base = characterRoster.find(f => f.name === fighter.name);
    return /*#__PURE__*/React.createElement("article", {
      className: `fighter-card ${fighter.hp <= 0 ? "down" : ""}`,
      key: index
    }, /*#__PURE__*/React.createElement("div", {
      className: "portrait",
      style: {
        "--accent": base.accent
      }
    }, /*#__PURE__*/React.createElement(HudPortrait, {
      fighter: base
    })), /*#__PURE__*/React.createElement("div", {
      className: "fighter-info"
    }, /*#__PURE__*/React.createElement("small", null, mine.name), /*#__PURE__*/React.createElement("h2", null, fighter.name), /*#__PURE__*/React.createElement(TypeChips, {
      elements: characterElements[fighter.name]
    }), /*#__PURE__*/React.createElement("div", {
      className: "health-readout"
    }, /*#__PURE__*/React.createElement("span", null, "HP"), /*#__PURE__*/React.createElement("b", null, fighter.hp), /*#__PURE__*/React.createElement("em", null, "/ ", fighter.maxHp)), /*#__PURE__*/React.createElement("div", {
      className: "bar"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: `${100 * fighter.hp / fighter.maxHp}%`
      }
    }))));
  }), /*#__PURE__*/React.createElement("div", {
    className: "groove-card pvp-state-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, room.mode === "ranked" ? "RANKED" : "CASUAL"), /*#__PURE__*/React.createElement("b", null, submitted ? "SYNC" : "LIVE")), /*#__PURE__*/React.createElement("small", null, status)), /*#__PURE__*/React.createElement("div", {
    className: "energy-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\xC9NERGIE"), /*#__PURE__*/React.createElement("b", null, 3 - reserved, " / 3 EN")), /*#__PURE__*/React.createElement("div", {
    className: "energy-pips"
  }, [0, 1, 2].map(pip => /*#__PURE__*/React.createElement("i", {
    key: pip,
    className: pip < 3 - reserved ? "full" : ""
  }))))), /*#__PURE__*/React.createElement("section", {
    className: "battle-column"
  }, /*#__PURE__*/React.createElement("div", {
    className: "battle-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "ONLINE MATCH"), /*#__PURE__*/React.createElement("h1", null, mine.name, " ", /*#__PURE__*/React.createElement("small", {
    className: "tier-label"
  }, "VS ", enemy.name))), /*#__PURE__*/React.createElement("div", {
    className: "threat threat-high"
  }, /*#__PURE__*/React.createElement("span", null, "TOUR"), /*#__PURE__*/React.createElement("b", null, room.turn))), /*#__PURE__*/React.createElement("nav", {
    className: "turn-order",
    "aria-label": `Ordre du tour ${room.turn}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "hud-turn"
  }, "Tour ", room.turn), /*#__PURE__*/React.createElement("ol", null, order.map((entry, index) => /*#__PURE__*/React.createElement("li", {
    key: `${entry.side}-${entry.index}`,
    className: entry.side
  }, /*#__PURE__*/React.createElement("button", {
    "aria-label": `${index + 1}. ${entry.fighter.name} · SPE ${entry.fighter.speed}`
  }, /*#__PURE__*/React.createElement(HudPortrait, {
    fighter: characterRoster.find(f => f.name === entry.fighter.name)
  }), /*#__PURE__*/React.createElement("span", {
    className: "turn-number"
  }, index + 1)))))), /*#__PURE__*/React.createElement("div", {
    className: "arena pvp-battlefield",
    style: {
      backgroundImage: `linear-gradient(180deg,rgba(15,20,21,.04),rgba(9,12,13,.42)),url(${battleBackground})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "turn-badge"
  }, "PVP \xB7 TURN ", String(room.turn).padStart(2, "0")), /*#__PURE__*/React.createElement("div", {
    className: "enemy-line enemies-count-2"
  }, displayTeam(rival).map((fighter, index) => {
    const base = characterRoster.find(f => f.name === fighter.name);
    return /*#__PURE__*/React.createElement("div", {
      className: `pvp-arena-unit enemy-unit ${fighter.hp <= 0 ? fighterAtlases[fighter.name] ? "fighter-atlas-ko" : "defeated" : ""} ${replayImpact?.targetUid === rival && replayImpact?.targetIndex === index ? "hit" : ""} ${replay?.actorUid === rival && replay?.actorIndex === index ? "acting" : ""}`,
      "data-fx-unit": `${rival}:${index}`,
      key: index
    }, /*#__PURE__*/React.createElement(Sprite, {
      fighter: base,
      combat: true,
      hpRatio: fighter.hp / fighter.maxHp,
      victory: !replay && room.status === "finished" && room.winner === rival,
      action: pvpSpriteAction(replay, rival, index),
      actionKey: replay?.actorUid === rival && replay?.actorIndex === index ? replay : null
    }), /*#__PURE__*/React.createElement("span", {
      className: "enemy-hp"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: `${100 * fighter.hp / fighter.maxHp}%`
      }
    })), replayImpact?.targetUid === rival && replayImpact?.targetIndex === index && /*#__PURE__*/React.createElement("b", { className: `pvp-damage-pop ${replayImpact.evaded ? "miss" : ""}` }, replayImpact.evaded ? "MISS" : `−${replayImpact.damage}`), /*#__PURE__*/React.createElement("small", null, fighter.name));
  })), /*#__PURE__*/React.createElement("div", {
    className: "player-line"
  }, displayTeam(uid).map((fighter, index) => {
    const base = characterRoster.find(f => f.name === fighter.name);
    return /*#__PURE__*/React.createElement("div", {
      className: `arena-hero ${fighter.hp <= 0 ? fighterAtlases[fighter.name] ? "fighter-atlas-ko" : "defeated" : ""} ${replayImpact?.targetUid === uid && replayImpact?.targetIndex === index ? "hit" : ""} ${replay?.actorUid === uid && replay?.actorIndex === index ? "acting" : ""}`,
      "data-fx-unit": `${uid}:${index}`,
      key: index
    }, /*#__PURE__*/React.createElement(Sprite, {
      fighter: base,
      combat: true,
      hpRatio: fighter.hp / fighter.maxHp,
      victory: !replay && room.status === "finished" && room.winner === uid,
      action: pvpSpriteAction(replay, uid, index),
      actionKey: replay?.actorUid === uid && replay?.actorIndex === index ? replay : null
    }), replayImpact?.targetUid === uid && replayImpact?.targetIndex === index && /*#__PURE__*/React.createElement("b", { className: `pvp-damage-pop ${replayImpact.evaded ? "miss" : ""}` }, replayImpact.evaded ? "MISS" : `−${replayImpact.damage}`), /*#__PURE__*/React.createElement("span", null, fighter.name));
  })), /*#__PURE__*/React.createElement("p", {
    className: "combat-status",
    role: "status"
  }, error || status)), /*#__PURE__*/React.createElement("section", {
    className: `round-planner ${choosing !== null ? "choosing-action" : ""}`,
    "aria-label": "Pr\xE9parer les actions PVP"
  }, choosing !== null ? /*#__PURE__*/React.createElement("div", {
    className: "inline-action-menu"
  }, targeting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, psychs[targeting.pin].name), " \xB7 Choisir la cible"), /*#__PURE__*/React.createElement("div", {
    className: "target-menu"
  }, enemy.team.map((fighter, index) => /*#__PURE__*/React.createElement("button", {
    disabled: fighter.hp <= 0,
    key: index,
    onClick: () => choosePlan(targeting.index, {
      kind: "psych",
      pin: targeting.pin,
      target: index
    })
  }, /*#__PURE__*/React.createElement(HudPortrait, {
    fighter: characterRoster.find(f => f.name === fighter.name)
  }), /*#__PURE__*/React.createElement("b", null, fighter.name), /*#__PURE__*/React.createElement("span", null, fighter.hp, " / ", fighter.maxHp, " PV"), /*#__PURE__*/React.createElement(TypeChips, {
    elements: characterElements[fighter.name]
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setTargeting(null)
  }, "Retour aux actions")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "psych-action-menu"
  }, mine.team[choosing].loadout.map(id => {
    const pin = psychs[id],
      aoe = offensive(id) && pinTargetMode(pin) === "aoe",
      old = plans[choosing],
      oldCost = old?.kind === "psych" ? psychs[old.pin || ""]?.cost || 0 : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      disabled: pin.cost + reserved - oldCost > 3,
      onClick: () => offensive(id) && !aoe ? setTargeting({
        index: choosing,
        pin: id
      }) : choosePlan(choosing, {
        kind: "psych",
        pin: id
      })
    }, /*#__PURE__*/React.createElement(PinIcon, {
      pin: pin
    }), /*#__PURE__*/React.createElement("b", null, pin.name), /*#__PURE__*/React.createElement("span", null, elementNames[pin.element || badgeElement(pin)], " \xB7 ", pinTargetLabel(pin), " \xB7 ", pin.cost, " EN"));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => choosePlan(choosing, {
      kind: "guard"
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "guard"
  }), /*#__PURE__*/React.createElement("b", null, "D\xE9fense"), /*#__PURE__*/React.createElement("span", null, "0 EN \xB7 Protection"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setChoosing(null)
  }, "Annuler"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "planned-actions"
  }, mine.team.map((fighter, index) => /*#__PURE__*/React.createElement("button", {
    key: index,
    disabled: submitted || fighter.hp <= 0,
    onClick: () => setChoosing(index)
  }, /*#__PURE__*/React.createElement("b", null, fighter.name), /*#__PURE__*/React.createElement("span", null, fighter.hp <= 0 ? "K.O." : plans[index] ? planName(plans[index]) : "Choisir une action"), /*#__PURE__*/React.createElement("small", null, plans[index]?.kind === "psych" ? `${psychs[plans[index].pin || ""].cost} EN · Modifier` : plans[index] ? "0 EN · Modifier" : "Choisir")))), /*#__PURE__*/React.createElement("button", {
    className: "resolve-round",
    disabled: submitted || !ready || !!replay || !!replayHealth,
    onClick: () => service.submit(matchId, room.turn, plans).catch(() => setError("Envoi impossible."))
  }, submitted ? "En attente de l’adversaire…" : "Valider le tour")))), /*#__PURE__*/React.createElement("aside", {
    className: "route-panel pvp-opponent-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, /*#__PURE__*/React.createElement("span", null, "OPPONENT"), /*#__PURE__*/React.createElement("b", null, enemy.name)), enemy.team.map((fighter, index) => {
    const base = characterRoster.find(f => f.name === fighter.name);
    return /*#__PURE__*/React.createElement("article", {
      className: `fighter-card ${fighter.hp <= 0 ? "down" : ""}`,
      key: index
    }, /*#__PURE__*/React.createElement("div", {
      className: "portrait"
    }, /*#__PURE__*/React.createElement(HudPortrait, {
      fighter: base
    })), /*#__PURE__*/React.createElement("div", {
      className: "fighter-info"
    }, /*#__PURE__*/React.createElement("small", null, "ADVERSAIRE"), /*#__PURE__*/React.createElement("h2", null, characterLabel(fighter.name)), /*#__PURE__*/React.createElement("div", {
      className: "health-readout"
    }, /*#__PURE__*/React.createElement("span", null, "HP"), /*#__PURE__*/React.createElement("b", null, fighter.hp), /*#__PURE__*/React.createElement("em", null, "/ ", fighter.maxHp)), /*#__PURE__*/React.createElement("div", {
      className: "bar"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: `${100 * fighter.hp / fighter.maxHp}%`
      }
    }))));
  }))), room.status === "finished" && !replay && !replayHealth && /*#__PURE__*/React.createElement("div", {
    className: "overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal reward-modal"
  }, /*#__PURE__*/React.createElement("small", null, "PVP MATCH COMPLETE"), /*#__PURE__*/React.createElement("h2", null, room.winner == null ? "ÉGALITÉ" : room.winner === uid ? "VICTOIRE" : "DÉFAITE"), room.mode === "ranked" && /*#__PURE__*/React.createElement("p", null, rating ? `Classement : ${rating.rating} Elo` : "Mise à jour du classement…"), /*#__PURE__*/React.createElement("button", {
    onClick: leave
  }, "Retour au PVP"))));
}
function PvpLobby({
  profile
}) {
  const [mode, setMode] = useState("casual"),
    [searching, setSearching] = useState(false),
    [matchId, setMatchId] = useState(null),
    [message, setMessage] = useState(""),
    [rating, setRating] = useState(null),
    [friends, setFriends] = useState([]),
    [privateInvites, setPrivateInvites] = useState([]);
  const service = window.ChibiPvp,
    team = pvpTeam(profile, mode),
    ready = team.length === 2 && team.every(f => f.loadout.length > 0) && team.some(f => f.loadout.some(offensive));
  const failure = error => /permission.denied|permission_denied/i.test(String(error?.code || error?.message || error)) ? "Le serveur PVP attend la publication des nouvelles règles Firebase." : String(error?.message || error || "Matchmaking indisponible.");
  useEffect(() => {
    if (service?.ready()) {
      service.rating(window.ChibiGameSync.accountId).then(setRating).catch(() => {});
      service.currentMatch().then(id => id && setMatchId(id)).catch(() => {});
    }
    window.ChibiSocial?.state?.().then(data => { setFriends(Array.isArray(data.friends) ? data.friends.filter(friend => friend?.uid) : []); setPrivateInvites(Array.isArray(data.invites) ? data.invites : []); }).catch(() => {});
    return () => {
      service?.cancel();
    };
  }, []);
  const search = async () => {
    setMessage("");
    if (!ready) return setMessage("Prépare un duo complet avec au moins un psych offensif dans Team.");
    if (!service?.ready()) return setMessage("Connecte-toi à Discord pour jouer en ligne.");
    setSearching(true);
    try {
      await service.join(mode, pvpTeam(profile, mode), {
        match: id => {
          setMatchId(id);
          setSearching(false);
        },
        waiting: count => setMessage(`${count} joueur${count > 1 ? "s" : ""} dans la file…`),
        error: error => {
          setSearching(false);
          setMessage(failure(error));
        }
      });
    } catch (error) {
      setSearching(false);
      setMessage(failure(error));
    }
  };
  const cancel = async () => {
    await service?.cancel();
    setSearching(false);
    setMessage("");
  };
  const privateMatch = async friend => {
    if (!ready) return setMessage("Prépare un duo complet avec au moins un psych offensif dans Team.");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") await requestChatNotificationPermission();
      await window.ChibiSocial.invite(friend.uid, pvpTeam(profile, "casual"));
      setMessage(`${friend.name} a été défié en match privé Casual.`);
    }
    catch (error) { setMessage(failure(error)); }
  };
  const acceptPrivate = async invite => { try { const id = await window.ChibiSocial.acceptInvite(invite, pvpTeam(profile, "casual")); setMatchId(id); } catch (error) { setMessage(failure(error)); } };
  if (matchId) return /*#__PURE__*/React.createElement(PvpBattle, {
    matchId: matchId,
    close: () => {
      setMatchId(null);
      service.rating(window.ChibiGameSync.accountId).then(setRating).catch(() => {});
    }
  });
  return /*#__PURE__*/React.createElement("section", {
    className: "pvp-panel"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("small", null, "REAPERS\u2019 NETWORK"), /*#__PURE__*/React.createElement("h1", null, "PVP"), /*#__PURE__*/React.createElement("p", null, "Affronte le duo d\u2019un autre joueur avec tes personnages et tes psychs \xE9quip\xE9s.")), /*#__PURE__*/React.createElement("div", {
    className: "pvp-modes"
  }, /*#__PURE__*/React.createElement("button", {
    "aria-pressed": mode === "casual",
    disabled: searching,
    onClick: () => setMode("casual")
  }, /*#__PURE__*/React.createElement("span", null, "CASUAL"), /*#__PURE__*/React.createElement("b", null, "Niv. 50 \xB7 Rang \xE9toile"), /*#__PURE__*/React.createElement("small", null, "Statistiques normalis\xE9es \xB7 aucun point perdu")), /*#__PURE__*/React.createElement("button", {
    "aria-pressed": mode === "ranked",
    disabled: searching,
    onClick: () => setMode("ranked")
  }, /*#__PURE__*/React.createElement("span", null, "RANKED"), /*#__PURE__*/React.createElement("b", null, rating?.rating || 1000, " Elo"), /*#__PURE__*/React.createElement("small", null, rating ? `${rating.wins} V · ${rating.losses} D · ${rating.draws} N` : "Niveaux et rangs réels"))), /*#__PURE__*/React.createElement("div", {
    className: "pvp-party"
  }, team.map(f => /*#__PURE__*/React.createElement("article", {
    key: f.name
  }, /*#__PURE__*/React.createElement(HudPortrait, {
    fighter: characterRoster.find(x => x.name === f.name)
  }), /*#__PURE__*/React.createElement("b", null, f.name), /*#__PURE__*/React.createElement("small", null, f.loadout.length, " psych(s)")))), message && /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, message), /*#__PURE__*/React.createElement("button", {
    className: "pvp-search",
    disabled: !ready || searching,
    onClick: search
  }, searching ? "Recherche en cours…" : `Chercher en ${mode === "ranked" ? "Ranked" : "Casual"}`), searching && /*#__PURE__*/React.createElement("button", {
    onClick: cancel
  }, "Annuler la recherche"), /*#__PURE__*/React.createElement("section", { className: "pvp-private" }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("small", null, "MATCH PRIVÉ"), /*#__PURE__*/React.createElement("h2", null, "Défier un ami"), /*#__PURE__*/React.createElement("p", null, "Casual · niveau 50 et rang étoile pour les deux joueurs.")), privateInvites.length > 0 && /*#__PURE__*/React.createElement(LandscapeRecords, { className: "pvp-private-list" }, privateInvites.map(invite => /*#__PURE__*/React.createElement("article", { key: invite.uid }, /*#__PURE__*/React.createElement("b", null, `${invite.name || "Joueur"} vous a défié !`), /*#__PURE__*/React.createElement("button", { disabled: !ready, onClick: () => acceptPrivate(invite) }, "Accepter")))), friends.length ? /*#__PURE__*/React.createElement(LandscapeRecords, { className: "pvp-private-list" }, friends.map(friend => /*#__PURE__*/React.createElement("article", { key: friend.uid }, /*#__PURE__*/React.createElement("b", null, friend.name || "Joueur"), /*#__PURE__*/React.createElement("button", { disabled: !ready, onClick: () => privateMatch(friend) }, "Défier")))) : /*#__PURE__*/React.createElement("p", null, "Ajoute des amis dans Social pour lancer un match privé.")));
}
function Leaderboard({ profile }) {
  const h = React.createElement;
  const [players, setPlayers] = useState([]), [notice, setNotice] = useState("");
  const load = async () => {
    try {
      const remote = window.ChibiSocial?.ready() ? await window.ChibiSocial.state() : { profiles: [] };
      const mine = { ...socialProfile(profile), uid: String(window.ChibiGameSync?.accountId || "local"), name: window.ChibiGameSync?.identity?.name || "Toi" };
      const pool = [...(Array.isArray(remote.profiles) ? remote.profiles : []), mine]
        .filter(player => Number(player.bestFloor || 0) > 0 || Number(player.wishesMade || 0) > 0)
        .filter((player, index, list) => list.findIndex(item => String(item.uid) === String(player.uid)) === index)
        .sort((a, b) => Number(b.bestFloor || 0) - Number(a.bestFloor || 0) || Number(b.rebirths || 0) - Number(a.rebirths || 0) || Number(b.owned?.length || 0) - Number(a.owned?.length || 0));
      setPlayers(pool); setNotice("");
    } catch (error) { setNotice(String(error?.message || "Classement indisponible.")); }
  };
  useEffect(() => { load(); }, []);
  return h("section", { className: "hub-panel leaderboard-panel" }, h("header", null, h("div", null, h("small", null, "REAPERS’ NETWORK"), h("h1", null, "Classement"), h("p", null, "Les joueurs ayant invoqué ou participé au Roguelike.")), h("button", { className: "leaderboard-refresh", type: "button", onClick: load, "aria-label": "Actualiser le classement", title: "Actualiser le classement" }, h("span", { "aria-hidden": true }, "↻"))), h(LandscapeRecords, { className: "leaderboard-list" }, players.length ? players.map((player, index) => h("article", { key: player.uid }, h("b", { className: "leaderboard-place" }, `#${index + 1}`), h("span", { className: "leaderboard-avatar", "aria-hidden": "true" }, (player.name || "?").slice(0, 1).toUpperCase()), h("div", null, h("b", null, player.name || "Joueur"), h("small", null, `${player.owned?.length || 0} personnages · Rebirth ${player.rebirths || 0}`)), h("strong", null, "Étage ", player.bestFloor || 0))) : h("p", null, "Aucun joueur classé pour le moment.")), notice && h("p", { role: "status" }, notice));
}
function PlayerProfile({ profile, save }) {
  const h = React.createElement, progress = experience(profile.playerXp || 0), owned = characterRoster.filter(fighter => profile.owned.includes(fighter.name));
  const [notice, setNotice] = useState("");
  const activateNotifications = async () => {
    try {
      const permission = await requestChatNotificationPermission();
      if (permission !== "granted") return setNotice("Notifications non autorisées sur cet appareil.");
      await window.ChibiSocial?.enableChatPush?.("BGk76ZiXSpYgtoNqx-LmvxxaQEiE9p4AtqqP10O2OLmBWFB0Pa7jMrSuFp38EWlmfXAPLXNuX57AJt4Q31mOV7E");
      setNotice("Notifications activées pour les messages et les défis privés.");
    } catch (error) { setNotice(String(error?.message || "Activation impossible.")); }
  };
  return h("section", { className: "hub-panel player-profile-panel" }, h("header", null, h(HudPortrait, { fighter: characterRoster.find(f => f.name === profile.avatar) || characterRoster[0] }), h("div", null, h("small", null, "REAPERS’ PROFILE"), h("h1", null, window.ChibiGameSync?.identity?.name || "Joueur"), h("p", null, `Niveau ${progress.level} · ${progress.required ? `${progress.current} / ${progress.required} XP` : "Niveau maximum"}`))), h("section", { className: "player-level-card" }, h("b", null, "Niveau joueur ", progress.level), h("progress", { max: progress.required || 1, value: progress.required ? progress.current : 1 }), h("small", null, "Chaque niveau offre 100 pièces.")), h("button", { className: "profile-notifications", type: "button", onClick: activateNotifications }, "Activer les notifications"), notice && h("p", { role: "status" }, notice), h("section", { className: "profile-avatar-picker" }, h("h2", null, "Personnage affiché"), h("p", null, "Choisis le personnage visible sur ton profil."), h("div", null, owned.map(fighter => h("button", { key: fighter.name, type: "button", "aria-pressed": profile.avatar === fighter.name, onClick: () => save(p => ({ ...p, avatar: fighter.name })) }, h(HudPortrait, { fighter }), h("span", null, characterLabel(fighter.name)))))));
}
function socialProfile(profile) {
  const member = name => ({
    name,
    level: experience(profile.xp[name] || 0).level,
    rank: Math.min(5, profile.copies[name] || 0),
    awakened: profile.awakened.includes(name),
    loadout: [...(profile.loadout[name] || [])]
  });
  return {
    bestFloor: profile.bestFloor,
    rebirths: profile.rebirths,
    wishesMade: profile.wishesMade,
    avatar: profile.avatar,
    team: profile.equipped.filter(Boolean).map(member),
    owned: profile.owned.map(member)
  };
}
function requestChatNotificationPermission() {
  if (window.parent === window) return typeof Notification === "undefined" ? Promise.resolve("denied") : Notification.requestPermission();
  const requestId = crypto.randomUUID();
  return new Promise(resolve => {
    const timeout = window.setTimeout(() => { window.removeEventListener("message", receive); resolve(typeof Notification === "undefined" ? "denied" : Notification.permission); }, 12000);
    const receive = event => { if (event.source !== window.parent || event.data?.type !== "chibi:notification-permission-result" || event.data?.requestId !== requestId) return; window.clearTimeout(timeout); window.removeEventListener("message", receive); resolve(event.data.permission); };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "chibi:notification-permission-request", requestId }, location.protocol === "file:" ? "*" : location.origin);
  });
}
class ChatPanelBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('Échec d’affichage du chat chiffré', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return React.createElement('section', { className: 'social-chat', role: 'alert' },
      React.createElement('h2', null, 'Le chat n’a pas pu s’ouvrir'),
      React.createElement('p', null, String(this.state.error?.message || this.state.error)),
      React.createElement('button', { onClick: () => this.setState({ error: null }) }, 'Réessayer'));
  }
}
class SocialHubBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('Échec de rendu Social', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return React.createElement('section', { className: 'social-panel hub-panel', role: 'alert' },
      React.createElement('h1', null, 'Social a rencontré une erreur'),
      React.createElement('p', null, String(this.state.error?.message || this.state.error)),
      React.createElement('button', { onClick: () => this.setState({ error: null }) }, 'Réessayer'));
  }
}
function ChatPanel({ friends = [] }) {
  const h = React.createElement, service = window.ChibiSocial;
  const [groups, setGroups] = useState([]), [active, setActive] = useState(null), [messages, setMessages] = useState([]), [draft, setDraft] = useState(""), [groupName, setGroupName] = useState(""), [selected, setSelected] = useState([]), [notice, setNotice] = useState(""), [notifications, setNotifications] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  useEffect(() => { let live = true; if (!service) { setNotice('Le service Social ne s’est pas chargé. Recharge le jeu.'); return () => { live = false; }; } service.chatGroups().then(items => { if (live) { const list = Array.isArray(items) ? items : []; setGroups(list); if (list.length) setActive(list[0]); } }).catch(error => { if (live) setNotice(String(error?.message || error)); }); return () => { live = false; }; }, []);
  useEffect(() => { if (!active || !service) return; setMessages([]); try { return service.watchChat(active.id, setMessages, error => setNotice(String(error?.message || error))); } catch (error) { setNotice(String(error?.message || error)); } }, [active?.id]);
  useEffect(() => { if (notifications) service.startChatNotifications().catch(() => {}); }, [notifications]);
  const create = async () => { try { const id = await service.createChatGroup(groupName, selected), items = await service.chatGroups(); setGroups(items); setActive(items.find(item => item.id === id)); setGroupName(""); setSelected([]); if (typeof Notification !== "undefined" && Notification.permission === "granted") await service.startChatNotifications(); } catch (error) { setNotice(String(error?.message || error)); } };
  const send = async event => { event.preventDefault(); if (!active || !draft.trim()) return; const text = draft; setDraft(""); try { await service.sendChat(active.id, text); } catch (error) { setDraft(text); setNotice(String(error?.message || error)); } };
  const enable = async () => { try { const permission = await requestChatNotificationPermission(); setNotifications(permission === "granted"); if (permission !== "granted") setNotice("Autorise les notifications dans les réglages du navigateur."); else { await service.enableChatPush("BGk76ZiXSpYgtoNqx-LmvxxaQEiE9p4AtqqP10O2OLmBWFB0Pa7jMrSuFp38EWlmfXAPLXNuX57AJt4Q31mOV7E"); setNotice("Notifications push activées sur cet appareil."); } } catch (error) { setNotice(String(error?.message || "Impossible d’activer les notifications.")); } };
  return h("section", { className: "social-chat" }, h("header", null, h("div", null, h("h2", null, "Messages chiffrés"), h("p", null, "Les messages sont chiffrés sur ton appareil.")), h("button", { onClick: enable }, notifications ? "Notifications actives" : "Activer les notifications")), h("div", { className: "chat-layout" }, h("aside", { className: "chat-groups" }, h("b", null, "Discussions"), groups.map(group => h("button", { key: group.id, "aria-pressed": active?.id === group.id, onClick: () => setActive(group) }, group.name, h("small", null, Object.keys(group.members || {}).length, " membres")))), h("div", { className: "chat-main" }, active ? h(React.Fragment, null, h("div", { className: "chat-message-list", "aria-live": "polite" }, messages.map(item => h("article", { key: item.id, className: String(item.sender) === String(window.ChibiGameSync?.accountId) ? "mine" : "" }, h("b", null, String(item.sender) === String(window.ChibiGameSync?.accountId) ? "Toi" : item.senderName), h("p", null, item.text), h("time", null, item.createdAt ? new Date(item.createdAt).toLocaleString() : "À l’instant")))), h("form", { onSubmit: send }, h("textarea", { value: draft, maxLength: 2000, placeholder: "Écrire un message…", onChange: event => setDraft(event.target.value) }), h("button", { disabled: !draft.trim() }, "Envoyer"))) : h("p", null, "Crée une discussion avec un ami pour commencer."))), h("details", { className: "chat-create" }, h("summary", null, "Créer un groupe chiffré"), h("input", { value: groupName, maxLength: 48, placeholder: "Nom du groupe", onChange: event => setGroupName(event.target.value) }), h("div", null, friends.map(player => h("label", { key: player.uid }, h("input", { type: "checkbox", checked: selected.includes(String(player.uid)), onChange: event => setSelected(old => event.target.checked ? [...old, String(player.uid)] : old.filter(id => id !== String(player.uid))) }), player.name))), h("button", { disabled: !selected.length, onClick: create }, "Créer · ", selected.length + 1, " membres"), h("small", null, "Les amis doivent ouvrir Chat une première fois pour publier leur clé publique.")), notice && h("p", { role: "status" }, notice));
}
function SafeChatPanel({ friends = [] }) {
  const h = React.createElement;
  const [groups, setGroups] = useState([]), [active, setActive] = useState(null), [messages, setMessages] = useState([]), [notice, setNotice] = useState(""), [draft, setDraft] = useState(""), [groupName, setGroupName] = useState(""), [selected, setSelected] = useState([]);
  const service = window.ChibiSocial;
  const safeFriends = Array.isArray(friends) ? friends.filter(friend => friend && friend.uid != null) : [];
  const refresh = async () => {
    if (!service?.chatGroups) return setNotice("Le service Chat n’est pas chargé. Recharge le jeu.");
    try { const list = await service.chatGroups(); setGroups(Array.isArray(list) ? list.filter(group => group && group.id) : []); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  // Open the inbox as soon as the tab is selected. Previously this safe
  // fallback only loaded after the user pressed Actualiser, which made Chat
  // appear empty or unresponsive on first use.
  useEffect(() => { refresh(); }, []);
  const open = async group => {
    setActive(group); setMessages([]);
    try { const list = await service.readChat(group.id); setMessages(Array.isArray(list) ? list : []); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  useEffect(() => {
    if (!active?.id || !service?.watchChat) return;
    try {
      return service.watchChat(active.id, list => setMessages(Array.isArray(list) ? list : []), error => setNotice(String(error?.message || error)));
    } catch (error) { setNotice(String(error?.message || error)); }
  }, [active?.id]);
  const create = async () => {
    try { const id = await service.createChatGroup(groupName, selected); setGroupName(""); setSelected([]); await refresh(); const list = await service.chatGroups(); const group = Array.isArray(list) && list.find(item => item?.id === id); if (group) await open(group); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  const send = async event => {
    event.preventDefault(); if (!active || !draft.trim()) return;
    const text = draft; setDraft("");
    try { await service.sendChat(active.id, text); await open(active); }
    catch (error) { setDraft(text); setNotice(String(error?.message || error)); }
  };
  return h("section", { className: "social-chat" },
    h("header", null, h("div", null, h("h2", null, "Messages chiffrés"), h("p", null, "Charge une discussion ou crée un groupe avec tes amis.")), h("button", { type: "button", onClick: refresh }, "Actualiser")),
    h("div", { className: "chat-layout" },
      h("aside", { className: "chat-groups" }, h("b", null, "Discussions"), groups.length ? groups.map(group => h("button", { key: group.id, type: "button", "aria-pressed": active?.id === group.id, onClick: () => open(group) }, group.name || "Discussion", h("small", null, Object.keys(group.members || {}).length, " membres"))) : h("small", null, "Aucune discussion chargée.")),
      h("div", { className: "chat-main" }, active ? h(React.Fragment, null, h("div", { className: "chat-message-list", "aria-live": "polite" }, messages.map(message => h("article", { key: message.id, className: String(message.sender) === String(window.ChibiGameSync?.accountId) ? "mine" : "" }, h("b", null, message.senderName || "Joueur"), h("p", null, message.text || "")))), h("form", { onSubmit: send }, h("textarea", { value: draft, maxLength: 2000, placeholder: "Écrire un message…", onChange: event => setDraft(event.target.value) }), h("button", { disabled: !draft.trim() }, "Envoyer"))) : h("p", null, "Sélectionne ou crée une discussion."))),
    h("details", { className: "chat-create" }, h("summary", null, "Créer un groupe chiffré"), h("input", { value: groupName, maxLength: 48, placeholder: "Nom du groupe", onChange: event => setGroupName(event.target.value) }), h("div", null, safeFriends.map(friend => h("label", { key: friend.uid }, h("input", { type: "checkbox", checked: selected.includes(String(friend.uid)), onChange: event => setSelected(old => event.target.checked ? [...old, String(friend.uid)] : old.filter(id => id !== String(friend.uid))) }), friend.name || "Joueur"))), h("button", { type: "button", disabled: !selected.length, onClick: create }, "Créer le groupe")),
    notice && h("p", { role: "status" }, notice));
}
function FactionPanel() {
  const h = React.createElement, service = window.ChibiSocial;
  const [faction, setFaction] = useState(null), [factions, setFactions] = useState([]), [name, setName] = useState(""), [notice, setNotice] = useState("");
  const refresh = () => Promise.all([service.myFaction(), service.factionList()]).then(([mine, list]) => { setFaction(mine); setFactions(list || []); }).catch(error => setNotice(String(error?.message || error)));
  useEffect(() => { refresh(); }, []);
  const create = async event => { event.preventDefault(); try { await service.createFaction(name); setName(""); await refresh(); } catch (error) { setNotice(String(error?.message || error)); } };
  return h("section", { className: "faction-panel" }, h("header", null, h("small", null, "REAPERS’ NETWORK"), h("h2", null, "Factions"), h("p", null, "Une faction est requise pour participer aux raids à trois.")), faction ? h("article", { className: "faction-card" }, h("h3", null, faction.name), h("p", null, Object.keys(faction.members || {}).length, " membres"), h("div", null, Object.values(faction.members || {}).map(member => h("span", { key: member.uid }, member.name)))) : h(React.Fragment, null, h("form", { onSubmit: create }, h("input", { value: name, maxLength: 32, placeholder: "Nom de la faction", onChange: event => setName(event.target.value) }), h("button", { disabled: name.trim().length < 3 }, "Créer une faction")), h("h3", null, "Rejoindre une faction"), h(LandscapeRecords, { className: "faction-list" }, factions.map(item => h("article", { key: item.id }, h("b", null, item.name), h("small", null, Object.keys(item.members || {}).length, " membres"), h("button", { onClick: () => service.joinFaction(item).then(refresh).catch(error => setNotice(String(error?.message || error))) }, "Rejoindre"))))), notice && h("p", { role: "status" }, notice));
}
function ClanPanel() {
  const h = React.createElement, service = window.ChibiSocial;
  const [faction, setFaction] = useState(null), [factions, setFactions] = useState([]), [name, setName] = useState(""), [notice, setNotice] = useState("");
  const refresh = async () => {
    if (!service?.myFaction) return setNotice("Le service Factions n’est pas chargé. Recharge le jeu.");
    try { const [mine, list] = await Promise.all([service.myFaction(), service.factionList()]); setFaction(mine || null); setFactions(Array.isArray(list) ? list.filter(item => item?.id) : []); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  const create = async event => { event.preventDefault(); try { await service.createFaction(name); setName(""); await refresh(); } catch (error) { setNotice(String(error?.message || error)); } };
  const join = async item => { try { await service.joinFaction(item); await refresh(); } catch (error) { setNotice(String(error?.message || error)); } };
  const members = Object.values(faction?.members || {});
  return h("section", { className: "clan-panel" },
    h("header", { className: "clan-hero" }, h("span", { className: "clan-crest", "aria-hidden": "true" }, "♜"), h("div", null, h("small", null, "REAPERS’ NETWORK"), h("h2", null, faction ? faction.name : "Trouve ton clan"), h("p", null, faction ? `${members.length} membre${members.length > 1 ? "s" : ""} · Raids coopératifs débloqués` : "Rejoins une faction pour ouvrir des Raids à trois.")), h("button", { type: "button", onClick: refresh }, "↻")),
    faction ? h(React.Fragment, null,
      h("div", { className: "clan-stats" }, h("article", null, h("small", null, "MEMBRES"), h("b", null, members.length, " / ∞")), h("article", null, h("small", null, "MODE"), h("b", null, "Raid · 3 joueurs")), h("article", null, h("small", null, "STATUT"), h("b", null, "Actif"))),
      h("section", { className: "clan-members" }, h("header", null, h("h3", null, "Membres"), h("small", null, "Escouade de raid")), members.map(member => h("article", { key: member.uid }, h("span", { className: "clan-member-avatar", "aria-hidden": "true" }, (member.name || "?").slice(0, 1).toUpperCase()), h("div", null, h("b", null, member.name || "Membre"), h("small", null, String(member.uid) === String(faction.leader) ? "Chef de faction" : "Membre")), String(member.uid) === String(faction.leader) && h("em", null, "CHEF")))),
      h("p", { className: "clan-tip" }, "Rendez-vous dans Raid pour choisir un boss, créer une salle et combattre à trois."))
      : h(React.Fragment, null,
        h("form", { className: "clan-create", onSubmit: create }, h("h3", null, "Créer un clan"), h("p", null, "Choisis un nom et invite tes amis à former une escouade."), h("input", { value: name, maxLength: 32, placeholder: "Nom de la faction", onChange: event => setName(event.target.value) }), h("button", { disabled: name.trim().length < 3 }, "Créer mon clan")),
        h("section", { className: "clan-directory" }, h("header", null, h("h3", null, "Recrutement"), h("small", null, factions.length, " clans disponibles")), factions.length ? factions.map(item => h("article", { key: item.id }, h("span", { className: "clan-member-avatar", "aria-hidden": "true" }, "♜"), h("div", null, h("b", null, item.name), h("small", null, Object.keys(item.members || {}).length, " membre(s) · Raids ouverts")), h("button", { type: "button", onClick: () => join(item) }, "Rejoindre"))) : h("p", null, "Aucun clan pour le moment. Crée le premier."))),
    notice && h("p", { className: "clan-notice", role: "status" }, notice));
}
// The social home deliberately does not subscribe to chat while it mounts: some
// browsers initialise WebCrypto lazily.  Every network action below is user
// initiated and errors remain inside the panel instead of taking down the game.
function MessengerChatPanel({ friends = [] }) {
  const h = React.createElement;
  const service = window.ChibiSocial;
  const [view, setView] = useState("chats"), [groups, setGroups] = useState([]), [active, setActive] = useState(null), [messages, setMessages] = useState([]), [draft, setDraft] = useState(""), [groupName, setGroupName] = useState(""), [selected, setSelected] = useState([]), [notice, setNotice] = useState("");
  const people = Array.isArray(friends) ? friends.filter(person => person?.uid != null) : [];
  const loadGroups = async () => {
    if (!service?.chatGroups) return setNotice("Le service Chat n’est pas disponible. Recharge le jeu.");
    try { const list = await service.chatGroups(); setGroups(Array.isArray(list) ? list.filter(group => group?.id) : []); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  const open = async group => {
    setActive(group); setMessages([]); setView("chats");
    try { const list = await service.readChat(group.id); setMessages(Array.isArray(list) ? list : []); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  const create = async (members = selected, name = groupName) => {
    if (!members.length) return setNotice("Choisis au moins un ami.");
    try {
      const id = await service.createChatGroup((name || "Discussion").trim(), members.map(String));
      setGroupName(""); setSelected([]); await loadGroups();
      const list = await service.chatGroups(); const group = Array.isArray(list) && list.find(item => item?.id === id);
      if (group) await open(group);
    } catch (error) { setNotice(String(error?.message || error)); }
  };
  const send = async event => {
    event.preventDefault(); if (!active || !draft.trim()) return;
    const text = draft; setDraft("");
    try { await service.sendChat(active.id, text); await open(active); }
    catch (error) { setDraft(text); setNotice(String(error?.message || error)); }
  };
  const direct = friend => create([String(friend.uid)], friend.name || "Discussion");
  const tab = (id, label) => h("button", { type: "button", "aria-pressed": view === id, onClick: () => setView(id) }, label);
  return h("section", { className: "social-chat messenger-chat" },
    h("header", null, h("div", null, h("h2", null, "Messages"), h("p", null, "Conversations privées avec tes amis.")), h("div", { className: "chat-toolbar" }, h("button", { type: "button", onClick: loadGroups }, "Actualiser"), h("button", { type: "button", onClick: () => setView("new") }, "Nouveau message"))),
    h("nav", { className: "chat-tabs", "aria-label": "Messagerie" }, tab("chats", `Discussions (${groups.length})`), tab("contacts", `Amis (${people.length})`), tab("new", "Nouveau groupe")),
    view === "contacts" && h("section", { className: "chat-contact-list" }, people.length ? people.map(friend => h("article", { key: friend.uid, className: "chat-contact" }, h("span", { className: "clan-member-avatar", "aria-hidden": "true" }, (friend.name || "?").slice(0, 1).toUpperCase()), h("div", null, h("b", null, friend.name || "Joueur"), h("small", null, "Ami · Message chiffré")), h("button", { type: "button", onClick: () => direct(friend) }, "Écrire"))) : h("p", { className: "chat-empty" }, "Ajoute un ami dans Social pour lui envoyer un message.")),
    view === "new" && h("section", { className: "chat-create chat-new" }, h("h3", null, "Nouveau groupe"), h("p", null, "Choisis tes amis. Chaque membre doit ouvrir Chat au moins une fois."), h("input", { value: groupName, maxLength: 48, placeholder: "Nom du groupe", onChange: event => setGroupName(event.target.value) }), h("div", { className: "chat-select-friends" }, people.map(friend => h("label", { key: friend.uid }, h("input", { type: "checkbox", checked: selected.includes(String(friend.uid)), onChange: event => setSelected(old => event.target.checked ? [...old, String(friend.uid)] : old.filter(uid => uid !== String(friend.uid))) }), friend.name || "Joueur"))), h("button", { type: "button", disabled: !selected.length, onClick: () => create() }, `Créer · ${selected.length + 1} membres`)),
    view === "chats" && h("div", { className: "chat-layout" }, h("aside", { className: "chat-groups" }, h("b", null, "Discussions"), groups.length ? groups.map(group => h("button", { key: group.id, type: "button", "aria-pressed": active?.id === group.id, onClick: () => open(group) }, group.name || "Discussion", h("small", null, Object.keys(group.members || {}).length, " membres"))) : h("p", { className: "chat-empty" }, "Appuie sur Actualiser pour charger tes discussions.")), h("div", { className: "chat-main" }, active ? h(React.Fragment, null, h("div", { className: "chat-message-list", "aria-live": "polite" }, messages.length ? messages.map(message => h("article", { key: message.id, className: String(message.sender) === String(window.ChibiGameSync?.accountId) ? "mine" : "" }, h("b", null, message.senderName || "Joueur"), h("p", null, message.text || ""))) : h("p", { className: "chat-empty" }, "Aucun message. Lance la conversation.")), h("form", { className: "chat-composer", onSubmit: send }, h("textarea", { value: draft, maxLength: 2000, placeholder: "Écrire un message…", onChange: event => setDraft(event.target.value) }), h("button", { disabled: !draft.trim() }, "Envoyer"))) : h("div", { className: "chat-empty" }, h("b", null, "Bienvenue dans Messages"), h("p", null, "Ouvre une discussion ou démarre un message avec un ami.")))),
    notice && h("p", { className: "clan-notice", role: "status" }, notice));
}
function ClashClanPanel() {
  const h = React.createElement, service = window.ChibiSocial;
  const [faction, setFaction] = useState(null), [factions, setFactions] = useState([]), [name, setName] = useState(""), [tab, setTab] = useState("home"), [notice, setNotice] = useState("");
  const refresh = async () => {
    if (!service?.myFaction) return setNotice("Le service Factions n’est pas disponible. Recharge le jeu.");
    try { const [mine, list] = await Promise.all([service.myFaction(), service.factionList()]); setFaction(mine || null); setFactions(Array.isArray(list) ? list.filter(item => item?.id) : []); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  useEffect(() => { refresh(); }, []);
  const create = async event => { event.preventDefault(); try { await service.createFaction(name.trim()); setName(""); await refresh(); setTab("home"); } catch (error) { setNotice(String(error?.message || error)); } };
  const join = async item => { try { await service.joinFaction(item); await refresh(); setTab("home"); } catch (error) { setNotice(String(error?.message || error)); } };
  const leave = async () => { if (!window.confirm("Quitter cette faction ?")) return; try { await service.leaveFaction(); await refresh(); setTab("join"); } catch (error) { setNotice(String(error?.message || error)); } };
  const members = Object.values(faction?.members || {}), mine = String(window.ChibiGameSync?.accountId || "");
  const nav = (id, label) => h("button", { type: "button", "aria-pressed": tab === id, onClick: () => setTab(id) }, label);
  return h("section", { className: "clan-panel clash-clan" },
    h("header", { className: "clan-hero" }, h("span", { className: "clan-crest", "aria-hidden": "true" }, "♜"), h("div", null, h("small", null, "REAPERS’ NETWORK"), h("h2", null, faction ? faction.name : "Factions"), h("p", null, faction ? `${members.length} membre${members.length > 1 ? "s" : ""} · raids à 3 débloqués` : "Crée ou rejoins une faction pour participer aux Raids.")), h("button", { type: "button", onClick: refresh }, "↻")),
    h("nav", { className: "clan-tabs", "aria-label": "Factions" }, faction ? [nav("home", "Accueil"), nav("members", `Membres (${members.length})`), nav("recruit", "Recrutement")] : [nav("create", "Créer"), nav("join", `Rejoindre (${factions.length})`)]),
    faction && tab === "home" && h("section", { className: "clan-home" }, h("div", { className: "clan-stats" }, h("article", null, h("small", null, "MEMBRES"), h("b", null, `${members.length} / ∞`)), h("article", null, h("small", null, "MODE"), h("b", null, "Raid · 3 joueurs")), h("article", null, h("small", null, "RÔLE"), h("b", null, String(faction.leader) === mine ? "Chef" : "Membre"))), h("div", { className: "clan-actions" }, h("button", { type: "button", onClick: () => setNotice("Ouvre Raid depuis l’accueil pour créer ou rejoindre une salle avec ta faction.") }, "Voir les Raids"), h("button", { type: "button", className: "quiet", onClick: leave }, String(faction.leader) === mine ? "Chef · transfert requis" : "Quitter la faction"))),
    faction && tab === "members" && h("section", { className: "clan-members" }, h("header", null, h("h3", null, "Membres"), h("small", null, "Escouade de raid")), members.map(member => h("article", { key: member.uid }, h("span", { className: "clan-member-avatar", "aria-hidden": "true" }, (member.name || "?").slice(0, 1).toUpperCase()), h("div", null, h("b", null, member.name || "Membre"), h("small", null, String(member.uid) === String(faction.leader) ? "Chef de faction" : "Membre")), String(member.uid) === String(faction.leader) && h("em", null, "CHEF")))),
    faction && tab === "recruit" && h("section", { className: "clan-recruitment" }, h("h3", null, "Recruter des joueurs"), h("p", null, "Partage le nom de ta faction avec tes amis : ils pourront la retrouver dans Rejoindre."), h("div", { className: "clan-share" }, h("b", null, faction.name), h("button", { type: "button", onClick: async () => { try { await navigator.clipboard?.writeText(faction.name); setNotice("Nom de faction copié."); } catch { setNotice("Copie le nom de faction manuellement."); } } }, "Copier"))),
    !faction && tab === "create" && h("form", { className: "clan-create", onSubmit: create }, h("h3", null, "Créer une faction"), h("p", null, "Fonde ton clan, recrute tes amis et ouvre des Raids coopératifs."), h("input", { value: name, maxLength: 32, placeholder: "Nom de la faction", onChange: event => setName(event.target.value) }), h("button", { disabled: name.trim().length < 3 }, "Créer ma faction")),
    !faction && tab === "join" && h("section", { className: "clan-directory" }, h("header", null, h("h3", null, "Recrutement"), h("small", null, factions.length, " factions disponibles")), factions.length ? factions.map(item => h("article", { key: item.id }, h("span", { className: "clan-member-avatar", "aria-hidden": "true" }, "♜"), h("div", null, h("b", null, item.name), h("small", null, Object.keys(item.members || {}).length, " membre(s) · Raids ouverts")), h("button", { type: "button", onClick: () => join(item) }, "Rejoindre"))) : h("p", { className: "chat-empty" }, "Aucune faction pour le moment. Crée la première.")),
    notice && h("p", { className: "clan-notice", role: "status" }, notice));
}
function SocialHub({
  profile
}) {
  const service = window.ChibiSocial,
    pvp = window.ChibiPvp;
  const [tab, setTab] = useState("players"),
    [data, setData] = useState({
      profiles: [],
      friends: [],
      requests: [],
      invites: []
    }),
    [selected, setSelected] = useState(null),
    [message, setMessage] = useState(""),
    [matchId, setMatchId] = useState(null),
    [sent, setSent] = useState([]);
  const team = pvpTeam(profile, "casual"),
    canFight = team.length === 2 && team.every(f => f.loadout.length > 0) && team.some(f => f.loadout.some(offensive));
  const fail = error => /permission.denied|permission_denied/i.test(String(error?.code || error?.message || error)) ? "Social attend la publication des nouvelles règles Firebase." : String(error?.message || error || "Action impossible.");
  useEffect(() => {
    if (!service?.ready()) return;
    service.publish(socialProfile(profile)).catch(error => setMessage(fail(error)));
    const stop = service.watch(setData, error => setMessage(fail(error)));
    const stopActive = pvp?.watchActive(id => id && setMatchId(id), error => setMessage(fail(error)));
    pvp?.currentMatch().then(id => id && setMatchId(id)).catch(() => {});
    return () => {
      stop?.();
      stopActive?.();
    };
  }, []);
  if (matchId) return /*#__PURE__*/React.createElement(PvpBattle, {
    matchId: matchId,
    close: () => setMatchId(null)
  });
  if (!service?.ready()) return /*#__PURE__*/React.createElement("section", {
    className: "social-panel hub-panel"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("small", null, "REAPERS\u2019 NETWORK"), /*#__PURE__*/React.createElement("h1", null, "Social"), /*#__PURE__*/React.createElement("p", null, "Connecte-toi \xE0 Discord pour retrouver les autres joueurs, ajouter des amis et lancer des d\xE9fis Casual.")));
  const profiles = Array.isArray(data.profiles) ? data.profiles.filter(item => item && typeof item === "object") : [];
  const friends = Array.isArray(data.friends) ? data.friends.filter(item => item && typeof item === "object") : [];
  const requests = Array.isArray(data.requests) ? data.requests.filter(item => item && typeof item === "object") : [];
  const invites = Array.isArray(data.invites) ? data.invites.filter(item => item && typeof item === "object") : [];
  const profileById = uid => profiles.find(item => item.uid != null && String(item.uid) === String(uid));
  const friendIds = new Set(friends.filter(item => item.uid != null).map(item => String(item.uid)));
  const challenge = async player => {
    setMessage("");
    if (!canFight) return setMessage("Prépare un duo complet avec un psych offensif dans Team.");
    try {
      await service.invite(player.uid, team);
      setMessage(`Invitation Casual envoyée à ${player.name}.`);
    } catch (error) {
      setMessage(fail(error));
    }
  };
  const playerCard = player => /*#__PURE__*/React.createElement("article", {
    className: "social-player",
    key: player.uid
  }, /*#__PURE__*/React.createElement("i", { className: player.online ? "presence-dot online" : "presence-dot", "aria-label": player.online ? "En ligne" : "Hors ligne" }), player.avatar || player.team?.[0] ? /*#__PURE__*/React.createElement(HudPortrait, {
    fighter: characterRoster.find(f => f.name === (player.avatar || player.team?.[0]?.name))
  }) : /*#__PURE__*/React.createElement("span", {
    className: "social-avatar"
  }, "\u25CE"), /*#__PURE__*/React.createElement("span", { className: "social-player-name" }, /*#__PURE__*/React.createElement("b", null, player.name)), /*#__PURE__*/React.createElement("button", { className: "social-view", onClick: () => setSelected(profileById(player.uid) || player) }, "Voir"));
  const shown = tab === "players" ? profiles : tab === "friends" ? friends : [];
  return /*#__PURE__*/React.createElement("section", {
    className: "social-panel hub-panel"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("small", null, "REAPERS\u2019 NETWORK"), /*#__PURE__*/React.createElement("h1", null, "Social"), /*#__PURE__*/React.createElement("p", null, "Ajoute des amis, inspecte leurs \xE9quipes et lance un combat Casual directement.")), /*#__PURE__*/React.createElement("div", {
    className: "social-tabs"
  }, [["players", "Joueurs", profiles.length], ["friends", "Amis", friends.length], ["requests", "Demandes", requests.length], ["invites", "Défis", invites.length], ["chat", "Chat", "✉"], ["factions", "Factions", "⚑"]].map(([id, label, count]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    "aria-pressed": tab === id,
    onClick: () => setTab(id)
  }, /*#__PURE__*/React.createElement("b", null, label), /*#__PURE__*/React.createElement("span", null, count)))), tab === "chat" && /*#__PURE__*/React.createElement(ChatPanelBoundary, null, /*#__PURE__*/React.createElement(MessengerChatPanel, {
    friends: friends.map(item => profileById(item.uid) || item)
  })), tab === "factions" && /*#__PURE__*/React.createElement(ClashClanPanel, null), message && /*#__PURE__*/React.createElement("p", {
    className: "social-message",
    role: "status"
  }, message), (tab === "players" || tab === "friends") && /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "social-list"
  }, shown.length ? shown.map(entry => playerCard(profileById(entry.uid) || entry)) : /*#__PURE__*/React.createElement("p", null, "Aucun joueur dans cette section pour le moment.")), tab === "requests" && /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "social-list"
  }, requests.length ? requests.map(player => /*#__PURE__*/React.createElement("article", {
    className: "social-request",
    key: player.uid
  }, /*#__PURE__*/React.createElement("b", null, player.name), /*#__PURE__*/React.createElement("span", null, "veut devenir ton ami."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => service.acceptRequest(player).catch(error => setMessage(fail(error)))
  }, "Accepter"), /*#__PURE__*/React.createElement("button", {
    className: "quiet",
    onClick: () => service.declineRequest(player.uid).catch(error => setMessage(fail(error)))
  }, "Refuser")))) : /*#__PURE__*/React.createElement("p", null, "Aucune demande d\u2019ami en attente.")), tab === "invites" && /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "social-list"
  }, invites.length ? invites.map(invitation => /*#__PURE__*/React.createElement("article", {
    className: "social-request social-challenge",
    key: invitation.uid
  }, /*#__PURE__*/React.createElement("b", null, invitation.name), /*#__PURE__*/React.createElement("span", null, "te d\xE9fie en Casual \xB7 Niv. 50 \xB7 Rang \xE9toile."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    disabled: !canFight,
    onClick: () => service.acceptInvite(invitation, team).then(setMatchId).catch(error => setMessage(fail(error)))
  }, "Combattre"), /*#__PURE__*/React.createElement("button", {
    className: "quiet",
    onClick: () => service.declineInvite(invitation.uid).catch(error => setMessage(fail(error)))
  }, "Refuser")))) : /*#__PURE__*/React.createElement("p", null, "Aucun d\xE9fi PVP en attente.")), selected && /*#__PURE__*/React.createElement(WishDialog, {
    className: "social-profile-dialog",
    title: `Profil · ${selected.name}`,
    close: () => setSelected(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "social-record"
  }, /*#__PURE__*/React.createElement("span", null, "Record ", /*#__PURE__*/React.createElement("b", null, "\xC9tage ", selected.bestFloor || 0)), /*#__PURE__*/React.createElement("span", null, "Rebirth ", /*#__PURE__*/React.createElement("b", null, selected.rebirths || 0)), /*#__PURE__*/React.createElement("span", null, "Collection ", /*#__PURE__*/React.createElement("b", null, selected.owned?.length || 0))), /*#__PURE__*/React.createElement("h3", null, "Team"), /*#__PURE__*/React.createElement("div", {
    className: "social-team"
  }, selected.team?.length ? selected.team.map(member => /*#__PURE__*/React.createElement("article", {
    key: member.name
  }, /*#__PURE__*/React.createElement("div", {
    className: "social-team-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "social-character-art"
  }, /*#__PURE__*/React.createElement(SpritePreview, {
    fighter: characterRoster.find(f => f.name === member.name),
    maximumScale: 1.15
  })), /*#__PURE__*/React.createElement("span", {
    className: "social-team-copy"
  }, /*#__PURE__*/React.createElement("b", null, member.name), /*#__PURE__*/React.createElement("small", null, "Niv. ", member.level, " \xB7 Rang ", member.rank === 5 ? "★" : ranks[member.rank || 0]), /*#__PURE__*/React.createElement(TypeChips, {
    elements: characterElements[member.name]
  }))), /*#__PURE__*/React.createElement("div", {
    className: "social-psychs"
  }, member.loadout?.map(id => {
    const pin = psychs[id];
    return pin ? /*#__PURE__*/React.createElement("span", {
      key: id
    }, /*#__PURE__*/React.createElement(PinIcon, {
      pin: pin
    }), /*#__PURE__*/React.createElement("small", null, pin.name.replace(" (Pin)", ""), " \xB7 ", pinTargetLabel(pin))) : null;
  })))) : /*#__PURE__*/React.createElement("p", null, "Team non configur\xE9e.")), /*#__PURE__*/React.createElement("h3", null, "Personnages obtenus"), /*#__PURE__*/React.createElement("div", {
    className: "social-collection"
  }, selected.owned?.map(member => {
    const fighter = characterRoster.find(f => f.name === member.name);
    return fighter ? /*#__PURE__*/React.createElement("span", {
      key: member.name
    }, /*#__PURE__*/React.createElement(HudPortrait, {
      fighter: fighter
    }), /*#__PURE__*/React.createElement("b", null, member.name), /*#__PURE__*/React.createElement("small", null, "Niv. ", member.level, " \xB7 ", member.rank === 5 ? "★" : ranks[member.rank || 0])) : null;
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelected(null)
  }, "Fermer")));
}
function LaunchNews({
  navigate,
  close
}) {
  const open = screen => {
    close();
    navigate(screen);
  };
  const previewNames = ["X", "SONIC", "MARLUXIA", "AXEL"];
  const rarePins = pinList.filter(pin => ["A", "Reaper", "Angel"].includes(pin.grade || "")).slice(0, 3);
  return /*#__PURE__*/React.createElement(WishDialog, {
    className: "launch-news",
    title: "Update Details"
  }, /*#__PURE__*/React.createElement("div", {
    className: "launch-news-feed"
  }, /*#__PURE__*/React.createElement("button", {
    className: "news-feature",
    onClick: () => open("summon")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-kicker"
  }, "CHECK!! \xB7 SECONDE VAGUE"), /*#__PURE__*/React.createElement("strong", null, "Final Fantasy Sonic X", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", null, "\xD7"), " Organisation XIII"), /*#__PURE__*/React.createElement("span", {
    className: "news-feature-cast"
  }, previewNames.map(name => /*#__PURE__*/React.createElement(SpritePreview, {
    key: name,
    fighter: characterRoster.find(f => f.name === name),
    maximumScale: .62
  }))), /*#__PURE__*/React.createElement("small", null, "1er décembre 2026 · 50 vœux offerts · Ouvrir les portails ", /*#__PURE__*/React.createElement("b", null, "\u2192"))), /*#__PURE__*/React.createElement("section", {
    className: "news-copy"
  }, /*#__PURE__*/React.createElement("p", null, "La mise \xE0 jour de la seconde vague est pr\xEAte. Voici l\u2019ensemble des changements :"), /*#__PURE__*/React.createElement("ol", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Social"), " \u2014 profils joueurs, collections, \xE9quipes d\xE9taill\xE9es, amis et d\xE9fis PVP Casual directs."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "PVP en ligne"), " \u2014 Casual normalis\xE9 au niveau 50 et rang \xE9toile, ou Ranked avec classement Elo et progression r\xE9elle."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Roguelike cauchemar"), " \u2014 difficult\xE9 fortement renforc\xE9e d\xE8s l\u2019\xE9tage 50 et reprise plafonn\xE9e au palier 6 apr\xE8s avoir quitt\xE9 une run plus avanc\xE9e."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Rebirth"), " \u2014 vaincre l\u2019\xE9tage 100 offre 5 000 pi\xE8ces et d\xE9bloque un nouveau cycle aux taux de badges rares renforc\xE9s."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "2 nouveaux portails"), " \u2014 X, Sonic, Zero, Shadow, Knuckles et Tails dans \xAB Final Fantasy Sonic X \xBB ; Marluxia, Lexaeus, Axel et Larxene dans \xAB XIII \xBB."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Garantie d\xE9butant"), " \u2014 la toute premi\xE8re invocation du compte donne toujours un personnage, m\xEAme dans un multi de 10."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Garantie revue"), " \u2014 un personnage garanti au 100e v\u0153u, avec 10 % de chance sur chaque autre invocation."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Raret\xE9 graduelle"), " \u2014 les badges de rang sup\xE9rieur deviennent plus rares dans les portails comme sur les ennemis."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Combat enrichi"), " \u2014 psychs monocibles ou AoE et Sync Burst \xE9gal \xE0 5\xD7 la meilleure statistique offensive."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Qu\xEAtes quotidiennes"), " \u2014 3 objectifs journaliers pour 200 pi\xE8ces au total."))), /*#__PURE__*/React.createElement("button", {
    className: "news-update news-daily",
    onClick: () => open("quests")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-update-art"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin"
  }), /*#__PURE__*/React.createElement("b", null, "200")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "QU\xCATES DU JOUR"), /*#__PURE__*/React.createElement("b", null, "3 missions \xB7 2 v\u0153ux"), /*#__PURE__*/React.createElement("em", null, "Vague, ennemis et Sync Burst")), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    className: "news-update news-rates",
    onClick: () => open("summon")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-update-art news-pin-art"
  }, rarePins.map(pin => /*#__PURE__*/React.createElement("span", {
    className: "news-pin-cell",
    key: pin.id
  }, /*#__PURE__*/React.createElement(BadgeArt, {
    pin: pin
  })))), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "TAUX D\u2019OBTENTION"), /*#__PURE__*/React.createElement("b", null, "1er v\u0153u personnage garanti"), /*#__PURE__*/React.createElement("em", null, "Puis garantie au 100e \xB7 Les hauts rangs sont plus rares")), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    className: "news-update news-combat",
    onClick: () => open("team")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-update-art"
  }, ["ZERO", "SHADOW"].map(name => /*#__PURE__*/React.createElement(SpritePreview, {
    key: name,
    fighter: characterRoster.find(f => f.name === name),
    maximumScale: .58
  }))), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "SYST\xC8ME DE COMBAT"), /*#__PURE__*/React.createElement("b", null, "AoE \xB7 Cible \xB7 Burst ultime"), /*#__PURE__*/React.createElement("em", null, "Pr\xE9pare tes psychs dans Team")), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    className: "news-update news-events",
    onClick: () => open("events")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-update-art"
  }, ["NEKU", "AERITH"].map(name => /*#__PURE__*/React.createElement(SpritePreview, {
    key: name,
    fighter: characterRoster.find(f => f.name === name),
    maximumScale: .75
  }))), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "\xC9V\xC9NEMENTS"), /*#__PURE__*/React.createElement("b", null, "Boss niveau 200"), /*#__PURE__*/React.createElement("em", null, "Personnages et badges signature \xE0 gagner")), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    className: "news-update news-pvp",
    onClick: () => open("pvp")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-update-art"
  }, /*#__PURE__*/React.createElement("b", null, "VS")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "PVP EN LIGNE"), /*#__PURE__*/React.createElement("b", null, "Casual \xB7 Ranked"), /*#__PURE__*/React.createElement("em", null, "Niveau 50 normalis\xE9 ou classement Elo")), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  }, "\u2192")), /*#__PURE__*/React.createElement("button", {
    className: "news-update news-social",
    onClick: () => open("social")
  }, /*#__PURE__*/React.createElement("span", {
    className: "news-update-art"
  }, /*#__PURE__*/React.createElement("b", null, "\u25CE")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("small", null, "REAPERS\u2019 NETWORK"), /*#__PURE__*/React.createElement("b", null, "Profils \xB7 Amis \xB7 D\xE9fis"), /*#__PURE__*/React.createElement("em", null, "Inspecte les Teams et lance un Casual direct")), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  }, "\u2192"))), /*#__PURE__*/React.createElement("button", {
    className: "launch-news-close",
    onClick: close
  }, "Fermer"));
}
function HubHome({
  profile,
  navigate
}) {
  const names = profile.equipped.filter(Boolean),
    duo = (names.length ? names : ["NEKU"]).map(name => characterRoster.find(f => f.name === name));
  const rewards = questsFor(profile).filter(q => q.progress >= q.goal && !profile.claimedQuests.includes(q.id)).length + dailyQuestsFor(profile).filter(q => q.progress >= q.goal && !profile.claimedDailyQuests.includes(q.id)).length;
  return /*#__PURE__*/React.createElement("section", {
    className: "hub-home home-reapers-layout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-reapers-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-reapers-art",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("button", {
    className: "home-hero-team-hit",
    type: "button",
    onClick: () => navigate("team"),
    "aria-label": "Configurer mon \xE9quipe"
  }), /*#__PURE__*/React.createElement("div", {
    className: "home-reapers-cast",
    "aria-hidden": "true"
  }, duo.map(f => /*#__PURE__*/React.createElement(SpritePreview, {
    key: f.name,
    fighter: f,
    maximumScale: 2.5
  }))), /*#__PURE__*/React.createElement("button", {
    className: "home-hero-play",
    type: "button",
    onClick: () => navigate("roguelike")
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u25C6"), /*#__PURE__*/React.createElement("b", null, "JOUER"), /*#__PURE__*/React.createElement("small", null, "Roguelike"))), /*#__PURE__*/React.createElement("div", {
    className: "home-mode-banners"
  }, /*#__PURE__*/React.createElement("button", {
    className: "home-mode-banner home-mode-event",
    onClick: () => navigate("events")
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2726"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "BOSS NIVEAU 200"), /*#__PURE__*/React.createElement("b", null, "\xC9v\xE9nement"), /*#__PURE__*/React.createElement("p", null, "Affronte les personnages du portail")), /*#__PURE__*/React.createElement("i", null, "\u203A")), /*#__PURE__*/React.createElement("button", {
    className: "home-mode-banner home-mode-raid",
    onClick: () => window.ChibiRaid?.open()
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u265C"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "COOP DE FACTION"), /*#__PURE__*/React.createElement("b", null, "Raid"), /*#__PURE__*/React.createElement("p", null, "3 joueurs contre un boss")), /*#__PURE__*/React.createElement("i", null, "\u203A"))), /*#__PURE__*/React.createElement("div", {
    className: "home-action-grid"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team")
  }, /*#__PURE__*/React.createElement("span", null, "\u25C8"), /*#__PURE__*/React.createElement("b", null, "\xC9quipe"), /*#__PURE__*/React.createElement("small", null, names.length ? `${names.length} partenaire${names.length > 1 ? "s" : ""}` : "Compose ton duo")), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("summon")
  }, /*#__PURE__*/React.createElement("span", null, "\u2726"), /*#__PURE__*/React.createElement("b", null, "Invocations"), /*#__PURE__*/React.createElement("small", null, availableFreeWishes(profile), " v\u0153ux gratuits")), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("social")
  }, /*#__PURE__*/React.createElement("span", null, "\u25CE"), /*#__PURE__*/React.createElement("b", null, "Social"), /*#__PURE__*/React.createElement("small", null, rewards ? `${rewards} r\xE9compense${rewards > 1 ? "s" : ""}` : "Amis et factions"))));
}
function TeamWorkspace({ profile, awaken, builder }) {
  const [tab, setTab] = useState("team");
  const tabs = [["characters", "Personnages"], ["awakening", "Éveil"], ["team", "Team"]];
  return /*#__PURE__*/React.createElement("section", { className: "team-workspace hub-panel" },
    /*#__PURE__*/React.createElement("header", { className: "team-workspace-heading" }, /*#__PURE__*/React.createElement("small", null, "REAPERS’ NETWORK"), /*#__PURE__*/React.createElement("h1", null, "Équipe"), /*#__PURE__*/React.createElement("p", null, "Consulte tes personnages, prépare leur éveil et compose ton duo.")),
    /*#__PURE__*/React.createElement("nav", { className: "team-workspace-tabs", "aria-label": "Sections de la Team" }, tabs.map(([id, label]) => /*#__PURE__*/React.createElement("button", { key: id, type: "button", "aria-pressed": tab === id, onClick: () => setTab(id) }, label))),
    tab === "characters" ? /*#__PURE__*/React.createElement(CharacterCollection, { profile: profile, awaken: awaken }) : tab === "awakening" ? /*#__PURE__*/React.createElement(AwakeningPanel, { profile: profile, awaken: awaken }) : builder);
}
function AwakeningPanel({
  profile,
  awaken
}) {
  const owned = characterRoster.filter(f => profile.owned.includes(f.name));
  return /*#__PURE__*/React.createElement("section", {
    className: "awakening-panel"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h2", null, "\xC9veil"), /*#__PURE__*/React.createElement("p", null, "Obtiens 5 doublons pour \xE9veiller un personnage et d\xE9bloquer son bonus permanent.")), !owned.length ? /*#__PURE__*/React.createElement("p", null, "D\xE9bloque des personnages dans les invocations pour suivre leur \xE9veil.") : /*#__PURE__*/React.createElement(LandscapeRecords, {
    className: "awakening-list"
  }, owned.map(fighter => {
    const copies = Math.min(5, profile.copies[fighter.name] || 0),
      awakened = profile.awakened.includes(fighter.name);
    return /*#__PURE__*/React.createElement("article", {
      key: fighter.name
    }, /*#__PURE__*/React.createElement(HudPortrait, {
      fighter: fighter
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, characterLabel(fighter.name)), /*#__PURE__*/React.createElement("small", null, awakened ? `Éveillé · +${awakeningHpBonus(fighter.name)} PV max` : `${copies} / 5 doublons`), /*#__PURE__*/React.createElement("div", {
      className: "awakening-ranks",
      "aria-label": `${fighter.name} : ${copies} doublons`
    }, ranks.map((_, rank) => /*#__PURE__*/React.createElement("span", {
      key: rank,
      className: rank <= copies ? "" : "locked"
    }, /*#__PURE__*/React.createElement(RankBadge, {
      level: rank
    }))))), !awakened && /*#__PURE__*/React.createElement("button", {
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
  abandon,
  rebirth
}) {
  const [confirm, setConfirm] = useState(false),
    [rebirthConfirm, setRebirthConfirm] = useState(false),
    fighters = profile.equipped.filter(Boolean),
    ready = fighters.length === 2 && fighters.every(name => profile.loadout[name]?.length) && fighters.some(name => profile.loadout[name]?.some(offensive)),
    run = profile.run?.status === "active" ? profile.run : null;
  return /*#__PURE__*/React.createElement("section", {
    className: "hub-panel roguelike-launch"
  }, /*#__PURE__*/React.createElement("h1", null, "Roguelike"), /*#__PURE__*/React.createElement("p", null, "Choisis ton duo et ses psychs dans Team, puis tente l\u2019ascension de 100 \xE9tages."), /*#__PURE__*/React.createElement("p", {
    className: "run-status"
  }, "Chaque run g\xE9n\xE8re ses rencontres depuis une seed. Les PV sont conserv\xE9s, l\u2019ordre suit la Timeline CTB et une d\xE9faite met fin \xE0 la run."), /*#__PURE__*/React.createElement("p", {
    className: "run-status"
  }, "Rebirth ", profile.rebirths, " \xB7 Bonus de raret\xE9 \xD7", (1 + Math.min(8, profile.rebirths) * .5).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR"), " · XP ×", rebirthXpMultiplier(profile.rebirths).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")), /*#__PURE__*/React.createElement("div", {
    className: "roguelike-party"
  }, fighters.map(name => {
    const fighter = characterRoster.find(f => f.name === name);
    return /*#__PURE__*/React.createElement("article", {
      key: name
    }, /*#__PURE__*/React.createElement("div", {
      className: "roguelike-fighter-art"
    }, /*#__PURE__*/React.createElement(SpritePreview, {
      fighter: fighter,
      maximumScale: 2.25
    })), /*#__PURE__*/React.createElement("b", null, name), /*#__PURE__*/React.createElement(TypeChips, {
      elements: characterElements[name]
    }), /*#__PURE__*/React.createElement("small", null, profile.loadout[name]?.length || 0, " psych(s) \xE9quip\xE9s"));
  }), fighters.length < 2 && /*#__PURE__*/React.createElement("p", null, "Il manque ", 2 - fighters.length, " personnage(s) dans ta Team.")), !ready && !run && /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("team")
  }, "Pr\xE9parer Team"), run ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "run-status"
  }, "Run sauvegard\xE9e \xB7 \xC9tage ", run.wave, " \xB7 Palier ", difficultyAt(run.wave).tier, " \xB7 ", run.team.map(f => f.name).join(" / ")), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pull-button",
    onClick: resume
  }, "Reprendre l\u2019\xE9tage ", run.wave), /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirm(true)
  }, "Abandonner la run"))) : /*#__PURE__*/React.createElement("button", {
    className: "pull-button",
    disabled: !ready,
    onClick: start
  }, "Commencer le roguelike"), profile.run?.status === "lost" && /*#__PURE__*/React.createElement("p", null, "Run perdue \xB7 Une nouvelle run commence \xE0 l\u2019\xE9tage 1."), profile.rebirthReady && /*#__PURE__*/React.createElement("section", {
    className: "rebirth-panel"
  }, /*#__PURE__*/React.createElement("h2", null, "Rebirth disponible"), /*#__PURE__*/React.createElement("p", null, "L\u2019\xE9tage 100 est vaincu et 5 000 pi\xE8ces ont \xE9t\xE9 ajout\xE9es. Recommence l\u2019ascension avec de meilleurs taux de badges rares."), /*#__PURE__*/React.createElement("button", {
    className: "pull-button",
    disabled: Boolean(run),
    onClick: () => setRebirthConfirm(true)
  }, "Activer le Rebirth"), run && /*#__PURE__*/React.createElement("small", null, "Termine ou abandonne la run sauvegard\xE9e avant le Rebirth.")), confirm && /*#__PURE__*/React.createElement(WishDialog, {
    title: "Abandonner la run ?",
    close: () => setConfirm(false)
  }, /*#__PURE__*/React.createElement("p", null, "La reprise de cette run sera supprim\xE9e. Tes personnages, tes badges et tes r\xE9compenses d\xE9j\xE0 gagn\xE9es sont conserv\xE9s."), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirm(false)
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      abandon();
      setConfirm(false);
    }
  }, "Abandonner"))), rebirthConfirm && /*#__PURE__*/React.createElement(WishDialog, {
    title: "Activer le Rebirth ?",
    close: () => setRebirthConfirm(false)
  }, /*#__PURE__*/React.createElement("p", null, "Les personnages non \xE9veill\xE9s reviennent au rang E. Les badges sous les rangs Reaper et Ange sont retir\xE9s, \xE0 l\u2019exception des psychs de base n\xE9cessaires. Les personnages \xE9veill\xE9s, niveaux, monnaies et badges Reaper/Ange sont conserv\xE9s."), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setRebirthConfirm(false)
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      rebirth();
      setRebirthConfirm(false);
    }
  }, "Confirmer le Rebirth"))));
}
function HubMenu({
  navigate
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const groups = [{
    label: "Activités",
    links: [["roguelike", "Roguelike", "Lancer ou reprendre une run"], ["events", "Événement", "Défie les personnages"], ["pvp", "PVP", "Casual normalisé et Ranked Elo"]]
  }, {
    label: "Progression",
    links: [["leaderboard", "Classement", "Records des joueurs et progression Roguelike"], ["quests", "Quêtes", "Étages, collection, quotidiennes et missions PC"], ["journal", "Historique des vœux", "Résultats, coûts et soldes"], ["bestiary", "Bestiaire", "Créatures, boss, types et comportements"], ["collection", "Collection", "Personnages et badges"], ["team", "Team & psychs", "Duo, psychs et éveils"]]
  }, {
    label: "Communauté et options",
    links: [["social", "Social", "Amis, profils et défis Casual"], ["settings", "Paramètres", "Musique et effets sonores"]]
  }];
  return React.createElement("section", {
    className: "hub-panel menu-workspace"
  }, React.createElement("h1", null, "Menu"), groups.map(({
    label,
    links
  }) => React.createElement("section", {
    className: "menu-group",
    key: label
  }, React.createElement("h2", null, label), React.createElement("div", {
    className: "hub-menu-links"
  }, links.map(([id, title, desc]) => React.createElement("button", {
    key: id,
    onClick: () => navigate(id)
  }, React.createElement("b", null, title), React.createElement("small", null, desc), React.createElement("span", {
    "aria-hidden": "true"
  }, "\u203A")))))), React.createElement("button", {className: "menu-guide", onClick: () => setGuideOpen(true)}, "Guide du jeu"), guideOpen && React.createElement(WishDialog, {title: "Guide du jeu", close: () => setGuideOpen(false)}, React.createElement("div", {className: "hub-help"}, React.createElement("p", null, "Forme une Team de 2 personnages et \xE9quipe jusqu\u2019\xE0 3 psychs chacun. Choisis toutes les actions, puis lance le tour : les portraits en haut indiquent l\u2019ordre de vitesse. Touche 2 fois un ennemi pour consulter ses stats."), React.createElement("p", null, "Une attaque du m\xEAme type que son personnage re\xE7oit le STAB : sa puissance est multipli\xE9e par 1,2."), React.createElement("p", null, "La premi\xE8re invocation d\u2019un nouveau compte garantit un personnage. Ensuite, chaque v\u0153u a 10 % de chances d\u2019en donner un et le 100e le garantit."), React.createElement("p", null, "Les psychs ne peuvent pas \xEAtre partag\xE9s entre partenaires. Les doublons font progresser le rang d\u2019un personnage jusqu\u2019\xE0 l\u2019\xE9toile, \xE0 5 doublons.")), React.createElement("button", {onClick: () => setGuideOpen(false)}, "Fermer")));
}
function BestiaryMenu() {
  const [filter, setFilter] = useState("known"),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(null);
  const entries = ffbeBestiary.filter(m => filter === "reserve" ? !m.enabled : m.enabled && (filter === "boss" ? m.boss : filter === "regular" ? !m.boss : true));
  const pages = Math.max(1, Math.ceil(entries.length / 12));
  return /*#__PURE__*/React.createElement("section", {
    className: "hub-panel monster-book"
  }, /*#__PURE__*/React.createElement("h1", null, "Bestiaire"), /*#__PURE__*/React.createElement("p", null, ffbeBestiary.filter(m => m.enabled).length, " entr\xE9es identifi\xE9es \xB7 ", ffbeBestiary.filter(m => !m.enabled).length, " en r\xE9serve \xB7 Animations idle uniquement"), /*#__PURE__*/React.createElement("div", {
    className: "hub-tabs monster-filters"
  }, [["known", "Tous"], ["regular", "Créatures"], ["boss", "Boss"], ["reserve", "À identifier"]].map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    "aria-pressed": filter === id,
    onClick: () => {
      setFilter(id);
      setPage(0);
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    className: "monster-grid"
  }, entries.slice(page * 12, page * 12 + 12).map(m => /*#__PURE__*/React.createElement("button", {
    key: m.id,
    onClick: () => setSelected(m)
  }, /*#__PURE__*/React.createElement(EnemySprite, {
    kind: m.id,
    boss: false
  }), /*#__PURE__*/React.createElement("b", null, m.name || `FFBE #${m.sourceId}`), /*#__PURE__*/React.createElement("small", null, m.enabled ? m.boss ? "Boss" : "Créature" : "Nom à identifier")))), /*#__PURE__*/React.createElement("nav", {
    className: "hub-tabs",
    "aria-label": "Pages du bestiaire"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: !page,
    onClick: () => setPage(page - 1),
    "aria-label": "Page pr\xE9c\xE9dente"
  }, "\u2039"), /*#__PURE__*/React.createElement("span", null, page + 1, " / ", pages), /*#__PURE__*/React.createElement("button", {
    disabled: page + 1 >= pages,
    onClick: () => setPage(page + 1),
    "aria-label": "Page suivante"
  }, "\u203A")), selected && /*#__PURE__*/React.createElement(WishDialog, {
    title: selected.name || `FFBE #${selected.sourceId}`,
    close: () => setSelected(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "monster-preview"
  }, /*#__PURE__*/React.createElement(EnemySprite, {
    kind: selected.id,
    boss: selected.boss
  })), /*#__PURE__*/React.createElement(TypeChips, {
    elements: selected.elements
  }), /*#__PURE__*/React.createElement("p", null, "PV de base ", selected.hp, " \xB7 ATK ", selected.attack, " \xB7 SPE ", selected.speed), /*#__PURE__*/React.createElement("p", null, enemyTraitNames[selected.trait]), /*#__PURE__*/React.createElement("p", null, selected.enabled ? `Apparaît à partir du palier ${Math.max(1, selected.tier + 1 - (selected.boss ? 2 : 0))}. Ses stats augmentent avec l’étage.` : "Cette silhouette reste hors des rencontres tant que son nom n’est pas identifié."), /*#__PURE__*/React.createElement("small", null, "Identifiant source \xB7 ", selected.sourceId), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelected(null)
  }, "Fermer")));
}
function PortalPoster({
  id
}) {
  const media = {
    shibuya: "first-week-clean",
    reality: "from-another-reality",
    apocalyptic: "apocalyptic",
    destiny: "destiny"
  }[id];
  if (!media) return null;
  const poster = `./assets/bingo/${media}.webp`;
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? React.createElement("img", {
    className: "portal-art",
    src: poster,
    alt: ""
  }) : React.createElement(PortalVideo, {
    src: `./assets/bingo/${media}.mp4`,
    poster: poster
  });
}
function PortalCarousel({
  portal,
  children
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const entries = Object.entries(portals).filter(([id]) => portalAvailable(id));
  const rail = React.useRef(null);
  const drag = React.useRef(null);
  const scrollToCard = (list, card) => {
    setActiveIndex(Array.from(list.children).indexOf(card));
    list.scrollTo({
      left: card.offsetLeft,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  };
  React.useLayoutEffect(() => {
    const list = rail.current;
    const card = list?.querySelector(`[data-portal="${portal}"]`);
    if (list && card) {
      list.scrollLeft = card.offsetLeft;
      setActiveIndex(Array.from(list.children).indexOf(card));
    }
  }, [portal]);
  const move = direction => {
    const list = rail.current;
    if (!list) return;
    const cards = Array.from(list.querySelectorAll(".portal-card"));
    const target = direction > 0 ? cards.find(card => card.offsetLeft > list.scrollLeft + 4) : cards.reverse().find(card => card.offsetLeft < list.scrollLeft - 4);
    if (target) scrollToCard(list, target);
  };
  const startDrag = event => {
    if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("button,a,input")) return;
    const list = event.currentTarget;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      left: list.scrollLeft,
      moved: false
    };
    list.setPointerCapture(event.pointerId);
  };
  const dragPortal = event => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const distance = state.x - event.clientX;
    if (!state.moved && Math.abs(distance) < 6) return;
    state.moved = true;
    const list = event.currentTarget;
    list.dataset.dragging = "true";
    list.scrollLeft = state.left + distance;
  };
  const endDrag = event => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    const list = event.currentTarget;
    const distance = list.scrollLeft - state.left;
    delete list.dataset.dragging;
    if (!state.moved) return;
    const width = list.clientWidth;
    const index = Math.round(state.left / width);
    const step = Math.abs(distance) > Math.min(72, width * .17) ? Math.sign(distance) : 0;
    const cards = list.querySelectorAll(".portal-card");
    const target = cards[Math.max(0, Math.min(cards.length - 1, index + step))];
    if (target) scrollToCard(list, target);
  };
  const choose = index => {
    const list = rail.current,
      card = list?.querySelectorAll(".portal-card")[index];
    if (list && card) scrollToCard(list, card);
  };
  return React.createElement("div", {
    className: "portal-carousel"
  }, React.createElement("nav", {
    className: "portal-thumbnails",
    "aria-label": "Portails d\u2019invocation"
  }, entries.map(([id, title], index) => React.createElement("button", {
    key: id,
    type: "button",
    "data-portal-preview": id,
    "aria-current": index === activeIndex ? "true" : undefined,
    onClick: () => choose(index)
  }, React.createElement("span", {
    className: "portal-thumbnail-art",
    "aria-hidden": "true"
  }, portalRoster(id).slice(0, 2).map(fighter => React.createElement(HudPortrait, {
    key: fighter.name,
    fighter: fighter
  }))), React.createElement("span", null, id === "shibuya" ? "First Week #1" : title)))), React.createElement("div", {
    className: "portal-stage"
  }, React.createElement("button", {
    className: "portal-arrow portal-previous",
    type: "button",
    "aria-label": "Portail pr\xE9c\xE9dent",
    onClick: () => move(-1)
  }, "\u2039"), React.createElement("div", {
    className: "portal-list",
    ref: rail,
    tabIndex: 0,
    role: "region",
    "aria-label": "Portails d\u2019invocation",
    onScroll: event => {
      const list = event.currentTarget;
      if (list.clientWidth) setActiveIndex(Math.round(list.scrollLeft / list.clientWidth));
    },
    onPointerDown: startDrag,
    onPointerMove: dragPortal,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onLostPointerCapture: endDrag
  }, children), React.createElement("button", {
    className: "portal-arrow portal-next",
    type: "button",
    "aria-label": "Portail suivant",
    onClick: () => move(1)
  }, "\u203A")));
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
  const [eventTarget, setEventTarget] = useState(null);
  const [phase, setPhase] = useState("ready");
  const turning = React.useRef(false);
  const [screen, setScreen] = useState(gachaView ? "summon" : "home");
  const [newsOpen, setNewsOpen] = useState(true);
  const [rateFighter, setRateFighter] = useState(null);
  const navigate = next => {
    if (turning.current) return;
    setRateFighter(null);
    setEventTarget(null);
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
      if (["home", "team", "summon", "collection", "leaderboard", "social", "profile", "quests", "journal", "bestiary", "menu"].includes(event.data.screen)) navigationRef.current.navigate(event.data.screen);
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
    const next = assignBasePsychs(refreshDailyQuests(update(accrueDailyWishes(applyCetrucRecovery(current, window.ChibiGameSync?.identity)))));
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
    let cancelled = false;
    const reconcile = async () => {
      const sync = window.ChibiGameSync;
      if (!sync?.state?.ready || typeof sync.allWishHistory !== "function") return;
      try {
        const archive = await sync.allWishHistory();
        if (!cancelled) setProfile(p => reconcileArchivedDuplicateCompensation(p, archive));
      } catch {
        // The game stays playable offline; reconciliation retries after the next sync event.
      }
    };
    window.addEventListener("chibi:save-loaded", reconcile);
    window.addEventListener("chibi:save-state", reconcile);
    reconcile();
    return () => {
      cancelled = true;
      window.removeEventListener("chibi:save-loaded", reconcile);
      window.removeEventListener("chibi:save-state", reconcile);
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
  const guaranteed = profile.wishesMade === 0 || profile.wishStep === 99;
  const percent = v => v.toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR", {
    style: "percent",
    maximumFractionDigits: 3
  });
  const portalName = portal === "shibuya" ? "First Week #1" : portals[portal];
  const closeDialog = () => setPhase("ready");
  const recruit = (id, count) => {
    if (turning.current || historyFull(profile) || !portalAvailable(id)) return;
    const draws = [];
    setProfile(p => {
      if (historyFull(p) || !portalAvailable(id) || !Number.isInteger(count) || count < 1 || count > 10) return p;
      const quote = wishQuote(p, count);
      if (p.coins < quote.cost) return p;
      const candidates = portalPool(id, p);
      if (!candidates.length) return p;
      const next = {
        ...p,
        wishesMade: p.wishesMade + count,
        freeWishes: p.freeWishes - quote.dailyFree,
        eventWishes: Math.max(0, (p.eventWishes || 0) - quote.eventFree),
        freeWishSpent: p.freeWishSpent + quote.dailyFree,
        freeWishDaySpent: p.freeWishDaySpent + quote.dailyFree,
        pins: [...p.pins],
        pinCopies: {
          ...p.pinCopies
        },
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
        const firstWishCharacter = p.wishesMade === 0 && i === 0;
        next.wishStep = (next.wishStep + 1) % 100;
        if (!firstWishCharacter && next.wishStep !== 0 && Math.random() >= characterChance) {
          const pin = weightedPinPick(p.rebirths);
          if (!next.pins.includes(pin.id)) next.pins.push(pin.id);
          next.pinCopies[pin.id] = (next.pinCopies[pin.id] || 0) + 1;
          draws.push({
            pin
          });
          continue;
        }
        const chosen = pick(candidates);
        if (!chosen?.name) continue;
        const name = chosen.name;
        if (next.owned.includes(name) && (next.copies[name] || 0) >= 5) {
          next.coins += 1000;
          next.copies[name] = 5;
          draws.push({ name, rank: 5, copies: 5, compensation: 1000 });
          continue;
        }
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
  const awaken = name => setProfile(p => p.owned.includes(name) && p.copies[name] === 5 && !p.awakened.includes(name) ? {
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
    const saved = loadProfile().run;
    if (!saved || saved.status !== "active") return;
    const run = saved.wave > 60 ? rollbackRunToTierSix(saved) : saved;
    if (run !== saved) setProfile(p => p.run?.id === saved.id ? {
      ...p,
      run
    } : p);
    runSignature.current = combatFingerprint({
      ...loadProfile(),
      run
    });
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
  if (party && resumeRun) return /*#__PURE__*/React.createElement(Battle, {
    key: resumeRun.id,
    event: event,
    initialRun: resumeRun,
    initialTeam: party,
    loadout: battleLoadout,
    coins: profile.coins,
    rebirths: profile.rebirths,
    onCheckpoint: (snapshot, gains) => setProfile(p => event ? eventCheckpoint(p, snapshot, gains) : applyRunCheckpoint(p, snapshot, gains)),
    leave: () => {
      runSignature.current = null;
      setParty(null);
      setResumeRun(null);
      setScreen(event ? "events" : "roguelike");
      setResult([]);
    }
  });
  const hub = content => /*#__PURE__*/React.createElement(GameHub, {
    profile: profile,
    screen: screen,
    navigate: navigate,
    openNews: () => setNewsOpen(true)
  }, /*#__PURE__*/React.createElement(React.Fragment, null, content, newsOpen && /*#__PURE__*/React.createElement(LaunchNews, {
    navigate: navigate,
    close: () => setNewsOpen(false)
  })));
  if (screen === "inbox") return hub(/*#__PURE__*/React.createElement(InboxPanel, {
    profile: profile,
    claim: id => {
      if (id === "wave-2") setProfile(p => grantSecondWaveWishes(p));
    }
  }));
  if (screen === "home") return hub(/*#__PURE__*/React.createElement(HubHome, {
    profile: profile,
    navigate: navigate
  }));
  if (screen === "roguelike") return hub(/*#__PURE__*/React.createElement(RoguelikeLaunch, {
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
    } : p),
    rebirth: () => setProfile(applyRebirth)
  }));
  if (screen === "events") return hub(/*#__PURE__*/React.createElement(EventHall, {
    target: eventTarget,
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
  if (screen === "pvp") return hub(/*#__PURE__*/React.createElement(PvpLobby, {
    profile: profile
  }));
  if (screen === "social") return hub(/*#__PURE__*/React.createElement(SocialHubBoundary, null, /*#__PURE__*/React.createElement(SocialHub, {
    profile: profile
  })));
  if (screen === "settings") return hub(/*#__PURE__*/React.createElement(AudioSettings, {
    back: () => navigate("menu")
  }));
  if (screen === "menu") return hub(/*#__PURE__*/React.createElement(HubMenu, {
    navigate: navigate
  }));
  if (screen === "bestiary") return hub(/*#__PURE__*/React.createElement(BestiaryMenu, null));
  if (screen === "quests") return hub(/*#__PURE__*/React.createElement(QuestMenu, {
    embedded: true,
    profile: profile,
    save: setProfile
  }));
  if (screen === "journal") return hub(/*#__PURE__*/React.createElement(WishHistory, {
    embedded: true,
    key: window.ChibiGameSync?.accountId || "local",
    profile: profile
  }));
  if (screen === "leaderboard") return hub(/*#__PURE__*/React.createElement(Leaderboard, {
    profile: profile
  }));
  if (screen === "collection") return hub(React.createElement(Collection, {
    profile: profile,
    awaken: awaken,
    openPortal: id => {
      navigate("summon");
      setPortal(id);
    },
    openEvent: name => {
      navigate("events");
      setEventTarget(name);
    }
  }));
  if (screen === "profile") return hub(/*#__PURE__*/React.createElement(PlayerProfile, {
    profile: profile,
    save: setProfile
  }));
  if (screen === "summon") return hub(/*#__PURE__*/React.createElement("main", {
    className: "game-shell party-lobby summon-workspace"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h1", null, "Invocations"), /*#__PURE__*/React.createElement("p", null, profile.coins, " pi\xE8ces \xB7 ", profile.owned.length, " / ", visibleCollectionRoster().length, " personnages disponibles \xB7 Garantie dans ", 100 - profile.wishStep, " ", profile.wishStep === 99 ? "vœu" : "vœux"), historyFull(profile) && /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, "Synchronise l\u2019historique avant de continuer \xE0 invoquer. Tes r\xE9sultats sont conserv\xE9s."), /*#__PURE__*/React.createElement("p", {
    className: "daily-wishes"
  }, "V\u0153ux gratuits \xB7 ", /*#__PURE__*/React.createElement("b", null, availableFreeWishes(profile)), /*#__PURE__*/React.createElement("small", null, profile.eventWishes ? `${profile.eventWishes} Vœux Vague 2 + 3 quotidiens` : parisDay() >= freeWishNoStackDay ? "3 par jour · Renouvelés à minuit (Paris)" : "10 de départ + 3 par jour · Cumul jusqu’au 24/11 inclus")), /*#__PURE__*/React.createElement(PortalCarousel, {portal}, Object.entries(portals).filter(([id]) => portalAvailable(id)).map(([id, title]) => React.createElement("article", {
    key: id,
    className: "portal-card",
    "data-portal": id,
    "aria-label": title
  }, /*#__PURE__*/React.createElement("div", {
    className: "portal-scene scene-" + id
  }, React.createElement(PortalPoster, {id}), (id === "partners" || id === "eosDawn" || id === "eosDusk") && /*#__PURE__*/React.createElement("div", {
    className: "portal-duo"
  }, portalRoster(id).map(f => /*#__PURE__*/React.createElement(SpritePreview, {
    key: f.name,
    fighter: f,
    maximumScale: 1
  }))), (id === "sonicx" || id === "xiii") && /*#__PURE__*/React.createElement("div", {
    className: `portal-cast portal-cast-${id}`
  }, portalRoster(id).map(f => /*#__PURE__*/React.createElement(SpritePreview, {
    key: f.name,
    fighter: f,
    maximumScale: 1
  }))), /*#__PURE__*/React.createElement("h3", null, id === "shibuya" ? "First Week #1" : title), /*#__PURE__*/React.createElement("button", {
    className: "portal-rates",
    onClick: () => {
      setPortal(id);
      setRateFighter(null);
      setPhase("rates");
    },
    "aria-label": `Taux de ${id === "shibuya" ? "First Week #1" : title}`
  }, "Taux"), /*#__PURE__*/React.createElement("div", {
    className: "wish-commands"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lobby-tools"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("journal")
  }, "Historique des v\u0153ux"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("collection")
  }, "Collection"), /*#__PURE__*/React.createElement("button", {
    onClick: () => navigate("quests")
  }, "Qu\xEAtes")), [1, 10].map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    className: "wish-option"
  }, /*#__PURE__*/React.createElement("button", {
    "aria-describedby": `wish-price-${id}-${n}`,
    disabled: historyFull(profile) || phase !== "ready" || profile.coins < wishCost(profile, n),
    onClick: () => openWish(id, n)
  }, /*#__PURE__*/React.createElement("strong", null, n, " ", n === 1 ? "vœu" : "vœux")), /*#__PURE__*/React.createElement("span", {
    className: "wish-price",
    id: `wish-price-${id}-${n}`,
    "aria-label": `${wishCost(profile, n)} pièces requises`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin"
  }), /*#__PURE__*/React.createElement("span", null, "\xD7 ", wishCost(profile, n).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR"))), wishQuote(profile, n).free > 0 && /*#__PURE__*/React.createElement("small", {
    className: "wish-free"
  }, wishQuote(profile, n).free, " ", wishQuote(profile, n).free > 1 ? "gratuits" : "gratuit", " inclus")))), /*#__PURE__*/React.createElement("p", {
    className: "portal-caption"
  }, id === "shibuya" ? "Retrouve Neku, Shiki et les badges psych de Shibuya." : id === "reality" ? "Cloud, Aerith et les badges psych · Des alliés venus d’une autre réalité." : id === "apocalyptic" ? "2B, A2 et les badges psych · Un futur à reconstruire." : id === "destiny" ? "Sora, Riku et les badges psych · Les liens qui traversent les mondes." : id === "eosDawn" ? "Noctis et Prompto · Les armes royales de Lucis." : id === "eosDusk" ? "Ignis et Gladio · Les gardiens de la couronne." : id === "sonicx" ? "X, Zero, Sonic, Shadow, Knuckles et Tails · La seconde vague entre en action." : id === "xiii" ? "Marluxia, Lexaeus, Axel et Larxene · L’Organisation XIII se rassemble." : "Beat et Joshua · Les partenaires de la Reapers’ Game."))))), phase === "rates" && /*#__PURE__*/React.createElement(WishDialog, {
    key: "rates",
    className: rateFighter ? "character-sheet-dialog" : "portal-rates-dialog",
    title: rateFighter ? `Fiche · ${rateFighter}` : `Taux · ${portalName}`,
    close: closeDialog
  }, rateFighter ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CharacterDossier, {
    fighter: characterRoster.find(f => f.name === rateFighter),
    profile: profile,
    base: true,
    rate: pool.filter(x => x.name === rateFighter).length / pool.length * (guaranteed ? 1 : characterChance)
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setRateFighter(null)
  }, "Retour aux taux")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, profile.wishesMade === 0 ? "Première invocation du compte · personnage garanti." : /*#__PURE__*/React.createElement(React.Fragment, null, "V\u0153u ordinaire \xB7 ", percent(characterChance), " personnage, ", percent(1 - characterChance), " badge."), " Chaque 100e v\u0153u garantit aussi un personnage."), /*#__PURE__*/React.createElement("h3", null, "Prochain v\u0153u", guaranteed ? " · garanti" : ""), /*#__PURE__*/React.createElement("p", null, "Touche un personnage pour voir sa fiche."), /*#__PURE__*/React.createElement("div", {
    className: "rates-character-list"
  }, portalRoster(portal).map(f => /*#__PURE__*/React.createElement("button", {
    key: f.name,
    onClick: () => setRateFighter(f.name),
    "aria-label": `Fiche de ${f.name}`
  }, /*#__PURE__*/React.createElement(HudPortrait, {
    fighter: f
  }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, f.name), /*#__PURE__*/React.createElement("small", null, "Stats & psych de d\xE9part")), /*#__PURE__*/React.createElement("strong", null, percent(pool.filter(x => x.name === f.name).length / pool.length * (guaranteed ? 1 : characterChance))), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u203A")))), /*#__PURE__*/React.createElement("p", null, "Badges psych \xB7 ", /*#__PURE__*/React.createElement("b", null, percent(guaranteed ? 0 : 1 - characterChance))), /*#__PURE__*/React.createElement("div", {
    className: "pin-rarity-rates"
  }, pinGradeRates(profile.rebirths).map(item => /*#__PURE__*/React.createElement("span", {
    key: item.grade
  }, /*#__PURE__*/React.createElement("b", null, item.grade === "---" ? "Sans classe" : item.grade), " ", percent(item.rate * (guaranteed ? 0 : 1 - characterChance))))), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Sans classe"), " \xB7 effets \xD71, comme la classe C, mais avec la fr\xE9quence d\u2019obtention la plus \xE9lev\xE9e."), /*#__PURE__*/React.createElement("p", null, "Les badges d\u2019une m\xEAme raret\xE9 sont \xE9quiprobables. Plus leur rang est \xE9lev\xE9, plus ils sont rares. Les taux par personnage restent fixes apr\xE8s un drop ou un \xE9veil.")), /*#__PURE__*/React.createElement("button", {
    onClick: closeDialog
  }, "Fermer")), phase === "confirm" && /*#__PURE__*/React.createElement(WishDialog, {
    key: "confirm",
    title: "Confirmer l\u2019invocation",
    close: closeDialog
  }, /*#__PURE__*/React.createElement("p", null, "Invoquer sur ", portalName, " pour ", quantity, " ", quantity === 1 ? "vœu" : "vœux", " ?"), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "V\u0153ux gratuits utilis\xE9s"), /*#__PURE__*/React.createElement("dd", null, wishQuote(profile, quantity).free), /*#__PURE__*/React.createElement("dt", null, "V\u0153ux gratuits restants"), /*#__PURE__*/React.createElement("dd", null, profile.freeWishes - wishQuote(profile, quantity).free), /*#__PURE__*/React.createElement("dt", null, "Solde actuel"), /*#__PURE__*/React.createElement("dd", null, profile.coins, " pi\xE8ces"), /*#__PURE__*/React.createElement("dt", null, "Co\xFBt"), /*#__PURE__*/React.createElement("dd", null, price, " pi\xE8ces"), /*#__PURE__*/React.createElement("dt", null, "Solde apr\xE8s invocation"), /*#__PURE__*/React.createElement("dd", null, price <= profile.coins ? `${profile.coins - price} pièces` : "Solde insuffisant")), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: closeDialog
  }, "Annuler"), /*#__PURE__*/React.createElement("button", {
    disabled: profile.coins < price,
    onClick: () => recruit(portal, quantity)
  }, "Confirmer"))), ["crank", "spin", "drop", "reveal"].includes(phase) && /*#__PURE__*/React.createElement(WishDialog, {
    key: "invocation",
    title: phase === "reveal" ? "Résultat de l’invocation" : portalName,
    close: phase === "reveal" ? closeDialog : undefined
  }, phase === "reveal" ? /*#__PURE__*/React.createElement(RewardReveal, {
    draws: result,
    close: closeDialog
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "invocation-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bingo-machine"
  }, /*#__PURE__*/React.createElement("img", {
    className: "bingo-body",
    src: "./assets/bingo/machine.webp",
    alt: "Bingo Kai"
  }), /*#__PURE__*/React.createElement("button", {
    autoFocus: true,
    "aria-label": "Tourner la manivelle",
    className: "bingo-crank " + (phase === "spin" ? "turning" : ""),
    disabled: phase !== "crank",
    onClick: () => setPhase("spin"),
    onAnimationEnd: e => {
      if (e.animationName === "bingo-turn") setPhase("drop");
    }
  }), phase === "drop" && /*#__PURE__*/React.createElement("span", {
    className: "bingo-ball capsule",
    onAnimationEnd: e => {
      if (e.animationName === "bingo-drop") {
        turning.current = false;
        gameSound.effect("pin");
        setPhase("reveal");
      }
    }
  }, /*#__PURE__*/React.createElement(Capsule, null)))), /*#__PURE__*/React.createElement("p", {
    "aria-live": "polite"
  }, phase === "crank" ? "Appuie sur la manivelle." : phase === "spin" ? "La manivelle tourne…" : "La capsule tombe…"))), saveError && /*#__PURE__*/React.createElement("p", {
    role: "alert"
  }, "Sauvegarde locale indisponible."))));
  const teamBuilder = /*#__PURE__*/React.createElement("main", {
    className: "game-shell party-lobby"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h1", null, "Duo actif"), /*#__PURE__*/React.createElement("p", null, "Choisis deux personnages puis équipe leurs psychs."), /*#__PURE__*/React.createElement("div", {
    className: "team-slots"
  }, profile.equipped.map((name, index) => {
    const fighter = characterRoster.find(f => f.name === name);
    const stats = fighter && trained(fighter, profile.xp[name] || 0, profile.awakened.includes(name), profile.copies[name] || 0);
    return /*#__PURE__*/React.createElement("button", {
      key: index,
      "aria-label": `Emplacement ${index + 1} · ${name || "Choisir un personnage"}`,
      onClick: () => setEditingSlot(index)
    }, fighter && stats ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SpritePreview, {
      fighter: fighter
    }), /*#__PURE__*/React.createElement("strong", null, name), /*#__PURE__*/React.createElement(TypeChips, {
      elements: characterElements[name]
    }), /*#__PURE__*/React.createElement(RankBadge, {
      level: profile.levels[name]
    }), /*#__PURE__*/React.createElement("small", null, "PV ", stats.maxHp, /*#__PURE__*/React.createElement("br", null), "ATK ", stats.atk, " \xB7 ATK SPE ", stats.mag, " \xB7 SPE ", stats.speed), /*#__PURE__*/React.createElement(XpProgress, {
      xp: stats.xp
    })) : /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "+"));
  })), editingSlot !== null && /*#__PURE__*/React.createElement(WishDialog, {
    title: `Choisir un personnage · ${editingSlot + 1} / 2`,
    close: () => setEditingSlot(null)
  }, profile.owned.length === 0 && /*#__PURE__*/React.createElement("p", null, "D\xE9bloque ton premier personnage dans ", /*#__PURE__*/React.createElement("a", {
    href: "../app.html#gacha",
    target: "_top"
  }, "l\u2019onglet Gacha"), "."), /*#__PURE__*/React.createElement("div", {
    className: "party-list"
  }, characterRoster.filter(f => profile.owned.includes(f.name)).map(f => /*#__PURE__*/React.createElement("button", {
    key: f.name,
    disabled: profile.equipped[1 - editingSlot] === f.name,
    onClick: () => chooseFighter(f.name)
  }, /*#__PURE__*/React.createElement(SpritePreview, {
    fighter: f
  }), /*#__PURE__*/React.createElement("strong", null, f.name), profile.equipped[1 - editingSlot] === f.name && /*#__PURE__*/React.createElement("small", null, "D\xE9j\xE0 \xE9quip\xE9")))), /*#__PURE__*/React.createElement("div", {
    className: "dialog-actions"
  }, profile.equipped[editingSlot] && /*#__PURE__*/React.createElement("button", {
    onClick: () => chooseFighter("")
  }, "Retirer"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingSlot(null)
  }, "Fermer"))), fighters.map(name => /*#__PURE__*/React.createElement(PsychEquipment, {
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
  })), fighters.length === 2 && !fighters.some(name => profile.loadout[name]?.some(offensive)) && /*#__PURE__*/React.createElement("p", null, "\xC9quipe au moins un psych offensif."), saveError && /*#__PURE__*/React.createElement("p", {
    role: "alert"
  }, "La sauvegarde locale est indisponible dans ce navigateur.")));
  return hub(/*#__PURE__*/React.createElement(TeamWorkspace, { profile: profile, awaken: awaken, builder: teamBuilder }));
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
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    width: 64,
    height: 64,
    "aria-hidden": "true"
  });
}
const ctbDelay = plan => plan?.kind === "guard" ? .55 : plan?.kind === "burst" ? 1.7 : plan?.kind === "psych" ? 1 + Math.min(.45, (psychs[plan.pin]?.cost || 0) * .12) : 1;
function turnOrder(team, enemies, turn, choices = {}, timeline = {}) {
  const living = team.filter(f => f.hp > 0);
  return [...living.map(f => ({
    key: f.name,
    side: "ally",
    name: f.name,
    speed: f.speed || 0,
    guard: choices[f.name]?.kind === "guard",
    at: choices[f.name]?.kind === "guard" ? -1 : Number(timeline[f.name] || 0) + Math.round(10000 / Math.max(1, f.speed || 1))
  })), ...enemies.filter(e => e.hp > 0).map((e, i) => ({
    key: `enemy-${e.id}`,
    side: "enemy",
    name: e.name,
    id: e.id,
    speed: e.speed,
    at: Number(timeline[`enemy-${e.id}`] || 0) + Math.round(10000 / Math.max(1, e.speed || 1)),
    target: (e.trait === "hunter" ? [...living].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] : living[(turn - 1 + i) % living.length])?.name
  }))].sort((a, b) => (a.guard === b.guard ? a.at - b.at : a.guard ? -1 : 1) || (a.side === b.side ? 0 : a.side === "ally" ? -1 : 1));
}
const planCost = plan => plan?.kind === "psych" ? psychs[plan.pin]?.cost || 0 : 0;
const planName = plan => !plan ? "Choisir une action" : plan.kind === "guard" ? "Défense" : plan.kind === "burst" ? "Sync Burst" : psychs[plan.pin].name;
function Battle({
  event,
  initialRun,
  initialTeam,
  loadout,
  coins,
  rebirths,
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
  const [ctbTimeline, setCtbTimeline] = useState(initialRun.ctbTimeline && typeof initialRun.ctbTimeline === "object" ? initialRun.ctbTimeline : {});
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
  const order = busy ? queue : turnOrder(team, enemies, turn, plans, ctbTimeline);
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
    const steps = recovery?.steps || turnOrder(team, enemies, turn, recovery?.choices || plans, ctbTimeline);
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
      sync = groove,
      timeline = { ...ctbTimeline };
    const shields = new Map(recovery?.shields || []);
    const performed = new Set(recovery?.performed || []);
    const drops = [];
    let xp = 0;
    const pause = (duration = 700) => new Promise(resolve => setTimeout(resolve, duration));
    const publish = () => {
      setTeam([...fighters]);
      setEnemies([...monsters]);
      setEnergy(en);
      setGroove(sync);
      setCtbTimeline({ ...timeline });
    };
    const healParty = (amount, sourceName) => {
      const boosted = Math.round(amount * passiveHealingMultiplier(sourceName || ""));
      fighters = fighters.map(f => f.hp > 0 ? {
        ...f,
        hp: Math.min(f.maxHp, f.hp + boosted)
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
      ,ctbTimeline: timeline
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
      let recoveryDelay = 700;
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
        const evasion = Math.min(.65, (target.speed || 0) / 200 + passiveDodgeChance(target.name)),
          reduction = Math.min(.8, (shields.get(target.name) || 0) + passiveDamageReduction(target.name)),
          damage = Math.random() < evasion ? 0 : typedDamage(Math.max(3, Math.round(enemyAttackPower(attacker) * (1 - reduction))), attackType, characterElements[target.name]);
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
        if (damage) {
          gameSound.effect("hit");
          playBattleVfx(".pve-vfx-arena", [`ally:${target.name}`], { name: attacker.name, kind: "physical", element: attackType }, `enemy:${attacker.id}`);
        }
        timeline[step.key] = Math.round((timeline[step.key] || 0) + 10000 / Math.max(1, attacker.speed || 1));
        setMessage(damage ? `${attacker.name} attaque ${target.name} · −${damage} PV` : `${target.name} esquive ${attacker.name}.`);
      } else {
        const fighter = fighters.find(f => f.name === step.name);
        const plan = choices[step.name];
        if (fighter.hp <= 0) continue;
        const kind = plan.kind === "psych" ? psychs[plan.pin].kind : plan.kind;
        const actionPin = plan.kind === "psych" ? psychs[plan.pin] : null;
        const cue = { name: fighter.name, kind, element: actionPin?.element || (actionPin ? badgeElement(actionPin) : characterElements[fighter.name]?.[0]) };
        const source = `ally:${fighter.name}`;
        const showFx = targets => playBattleVfx(".pve-vfx-arena", targets, cue, source);
        window.ChibiBattleVfx?.warm(cue);
        const animation = { physical: "shockwave", special: "pyro", burst: "burst", heal: "heal", guard: "guard", support: "guard" }[kind] || "pyro";
        const timing = fighterActionTiming(fighter.name, animation);
        const impactDelay = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : timing.impact;
        if (impactDelay) await prepareFighterAction(fighter.name, animation);
        if (token !== generation.current) return;
        timeline[step.key] = Math.round((timeline[step.key] || 0) + 10000 / Math.max(1, fighter.speed || 1) * ctbDelay(plan));
        performed.add(fighter.name);
        setActor(fighter.name);
        setActiveAction(animation);
        if (impactDelay) {
          await pause(impactDelay);
          if (token !== generation.current) return;
          recoveryDelay = Math.max(280, timing.duration - impactDelay);
        }
        if (plan.kind === "guard") {
          showFx([source]);
          shields.set(fighter.name, Math.max(shields.get(fighter.name) || 0, .55));
          en = Math.min(3, en + 1);
          setMessage(`${fighter.name} se protège jusqu’à la fin du tour · +1 EN`);
        } else if (plan.kind === "burst") {
          showFx(monsters.filter(enemy => enemy.hp > 0).map(enemy => `enemy:${enemy.id}`));
          const partnerAlive = fighters.some(f => f.name !== fighter.name && f.hp > 0),
            damage = Math.round(Math.max(fighter.atk || 1, fighter.mag || 1) * 5 * passiveDamageMultiplier(fighter.name, "burst", fighter.hp, fighter.maxHp, partnerAlive));
          sync = 0;
          monsters = monsters.map(e => e.hp > 0 ? {
            ...e,
            hp: Math.max(0, e.hp - damage)
          } : e);
          const target = monsters.find(enemy => enemy.hp > 0) || monsters[0];
          if (target) {
            setImpact(target.id);
            setHitFeedback({ side: "enemy", target: String(target.id), label: `${damage} dégâts` });
          }
          if (damage) gameSound.effect("hit");
          gains.bursts = 1;
          setMessage(`${fighter.name} · Sync Burst · ${damage} dégâts sur chaque ennemi !`);
        } else {
          const pin = psychs[plan.pin];
          if (pin.kind === "heal") {
            showFx(fighters.filter(member => member.hp > 0).map(member => `ally:${member.name}`));
            const amount = scaledPinEffect(pin, (fighter.mag || 1) * pin.power / 50 * (1 + passiveBonus(/^Cure Boost/, .3)));
            healParty(amount, fighter.name);
            setMessage(`${fighter.name} · ${pin.name} · +${amount} PV au duo`);
          } else if (pin.kind === "guard" || pin.kind === "support") {
            showFx(fighters.filter(member => member.hp > 0).map(member => `ally:${member.name}`));
            fighters.filter(f => f.hp > 0).forEach(f => shields.set(f.name, Math.max(shields.get(f.name) || 0, pinShieldReduction(pin))));
            if (pin.kind === "support") {
              if (/Turbo|Supply/.test(pin.psych)) en = Math.min(3, en + scaledPinEffect(pin, 2));else if (/Cure Boost|Subconscious|Life/.test(pin.psych)) healParty(scaledPinEffect(pin, (fighter.mag || 1) / 2), fighter.name);else sync = Math.min(100, sync + scaledPinEffect(pin, 18));
            }
            setMessage(`${fighter.name} · ${pin.name} · Duo protégé pour ce tour`);
          } else {
            const physical = pin.kind === "physical",
              stab = stabMultiplier(fighter, pin);
            const partnerAlive = fighters.some(f => f.name !== fighter.name && f.hp > 0),
              passive = passiveDamageMultiplier(fighter.name, physical ? "physical" : "special", fighter.hp, fighter.maxHp, partnerAlive),
              amount = scaledPinEffect(pin, (physical ? fighter.atk || 1 : fighter.mag || 1) * (.7 + pin.power / 100) * stab * passive);
            const targets = pinTargetMode(pin) === "aoe" ? monsters.filter(e => e.hp > 0) : [monsters.find(e => e.id === plan.target && e.hp > 0) || monsters.find(e => e.hp > 0)];
            const damages = new Map(targets.map(target => {
              const base = Math.max(1, Math.round(amount * (1 + passiveBonus(/^Resonance/, .15))) + Math.floor(Math.random() * 7) - 3);
              return [target.id, enemyDamageTaken(target, typedDamage(base, pin.element, enemyElements[target.kind]))];
            }));
            const total = [...damages.values()].reduce((sum, damage) => sum + damage, 0),
              primary = targets[0],
              primaryDamage = damages.get(primary.id) || 0,
              scale = effectiveness(pin.element, enemyElements[primary.kind]);
            setHitFeedback({
              side: "enemy",
              target: String(primary.id),
              label: scale === 0 ? "Sans effet" : `${primaryDamage} dégâts · ${affinityText(scale)}`
            });
            monsters = monsters.map(e => damages.has(e.id) ? {
              ...e,
              hp: Math.max(0, e.hp - (damages.get(e.id) || 0))
            } : e);
            if (pin.drain) healParty(Math.ceil(total / 4), fighter.name);
            if (total) {
              gameSound.effect("hit");
              showFx(targets.filter(enemy => damages.get(enemy.id) > 0).map(enemy => `enemy:${enemy.id}`));
            }
            sync = Math.min(100, sync + 18);
            setSelected(primary.id);
            setImpact(primary.id);
            setMessage((pinTargetMode(pin) === "aoe" ? `${fighter.name} · ${pin.name} · ${total} dégâts répartis sur tous les ennemis` : `${fighter.name} · ${pin.name} → ${primary.name} · ${primaryDamage} dégâts`) + (stab > 1 ? " · STAB ×1,2" : ""));
          }
        }
        const defeated = monsters.filter(e => e.hp <= 0 && !awarded.current.has(e.id));
        gains.defeated = defeated.length;
        defeated.forEach(e => awarded.current.add(e.id));
        const earned = defeated.reduce((sum, e) => sum + e.xp, 0);
        if (earned) {
          xp += earned;
          gains.xp = earned;
          fighters = fighters.map(f => gainExperience(f, earned, rebirths));
        }
        const found = event ? [] : defeated.filter(() => Math.random() < Math.min(.75, .25 + rebirths * .10)).map(() => weightedPinPick(rebirths));
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
      await pause(recoveryDelay);
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
    const nextTimeline = {};
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
      ctbTimeline: nextTimeline,
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
    setCtbTimeline(nextTimeline);
    setEnemies(nextEnemies);
    setSelected(next * 10);
    setReward(false);
    setMessage(heal ? `Palier ${difficultyAt(next).tier} · Team entièrement soignée.` : `Étage ${next} · PV conservés.`);
  };
  const teamDefeated = team.every(fighter => fighter.hp <= 0);
  useMusic(teamDefeated ? null : reward ? "victory" : (event ? wave === 3 : isBossWave(wave)) ? "boss" : "battle");
  const routeStart = Math.floor((wave - 1) / 5) * 5 + 1;
  const sector = Math.floor((wave - 1) / 5) + 1;
  return /*#__PURE__*/React.createElement("main", {
    className: "game-shell combat-hud"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-lockup"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "R"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "REAPER'S RUN"), /*#__PURE__*/React.createElement("span", null, "SHIBUYA / DAY 01"))), /*#__PURE__*/React.createElement("div", {
    className: "run-stats"
  }, /*#__PURE__*/React.createElement("button", {
    className: "fullscreen-button",
    onClick: toggleFullscreen,
    "aria-pressed": fullscreen
  }, fullscreen ? "Quitter plein écran" : "Plein écran"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "star"
  }), " SCORE ", /*#__PURE__*/React.createElement("b", null, String((wave - 1) * 2350).padStart(6, "0"))), /*#__PURE__*/React.createElement("span", {
    className: "currency"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "coin"
  }), " ", coins), /*#__PURE__*/React.createElement("button", {
    className: "currency",
    disabled: busy,
    onClick: leave,
    title: event ? "Retour aux événements" : "Mettre la run en pause et revenir à Team"
  }, event ? "Pause" : "Mon duo"), /*#__PURE__*/React.createElement(SoundToggle, null))), /*#__PURE__*/React.createElement("section", {
    className: "game-grid"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "squad-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, /*#__PURE__*/React.createElement("span", null, "PLAYER SQUAD"), /*#__PURE__*/React.createElement("b", null, String(team.length).padStart(2, "0"), " / 02")), team.map((fighter, index) => /*#__PURE__*/React.createElement("article", {
    className: `fighter-card ${fighter.hp <= 0 ? "down" : ""}`,
    key: fighter.name
  }, /*#__PURE__*/React.createElement("div", {
    className: "portrait",
    style: {
      "--accent": fighter.accent
    }
  }, /*#__PURE__*/React.createElement(HudPortrait, {
    fighter: fighter
  })), /*#__PURE__*/React.createElement("div", {
    className: "fighter-info"
  }, /*#__PURE__*/React.createElement("small", null, fighter.role), /*#__PURE__*/React.createElement("h2", null, fighter.name), /*#__PURE__*/React.createElement(TypeChips, {
    elements: characterElements[fighter.name]
  }), /*#__PURE__*/React.createElement(XpProgress, {
    xp: fighter.xp || 0
  }), /*#__PURE__*/React.createElement("div", {
    className: "health-readout"
  }, /*#__PURE__*/React.createElement("span", null, "HP"), /*#__PURE__*/React.createElement("b", null, fighter.hp), /*#__PURE__*/React.createElement("em", null, "/ ", fighter.maxHp)), /*#__PURE__*/React.createElement("div", {
    className: "bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: `${fighter.hp / fighter.maxHp * 100}%`
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "groove-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "TEAM GROOVE"), /*#__PURE__*/React.createElement("b", null, groove, "%")), /*#__PURE__*/React.createElement("div", {
    className: "groove-bar"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: `${groove}%`
    }
  })), /*#__PURE__*/React.createElement("button", {
    disabled: groove < 100 || busy || reward || teamDefeated,
    onClick: () => openChooser(livingTeam[0].name)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bolt"
  }), " SYNC BURST")), /*#__PURE__*/React.createElement("div", {
    className: "energy-card",
    "aria-label": `Énergie disponible : ${busy ? energy : energy - (chooser ? otherCost : reserved)} sur 3`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "\xC9NERGIE"), /*#__PURE__*/React.createElement("b", null, busy ? energy : energy - (chooser ? otherCost : reserved), " / 3 EN")), /*#__PURE__*/React.createElement("div", {
    className: "energy-pips",
    "aria-hidden": "true"
  }, [0, 1, 2].map(pip => /*#__PURE__*/React.createElement("i", {
    key: pip,
    className: pip < (busy ? energy : energy - (chooser ? otherCost : reserved)) ? "full" : ""
  }))))), /*#__PURE__*/React.createElement("section", {
    className: "battle-column"
  }, /*#__PURE__*/React.createElement("div", {
    className: "battle-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "ENCOUNTER"), /*#__PURE__*/React.createElement("h1", null, event ? "Événement" : "ÉTAGE", " ", String(wave).padStart(2, "0"), " ", /*#__PURE__*/React.createElement("small", {
    className: "tier-label"
  }, event ? `${event.boss} · ${wave}/3` : `Palier ${difficultyAt(wave).tier} / 10`))), /*#__PURE__*/React.createElement("div", {
    className: `threat threat-${threat.toLowerCase()}`
  }, /*#__PURE__*/React.createElement("span", null, "THREAT"), /*#__PURE__*/React.createElement("b", null, threat))), /*#__PURE__*/React.createElement("nav", {
    className: "turn-order",
    "aria-label": `Timeline CTB ${turn}, selon la vitesse et le délai de chaque action`
  }, /*#__PURE__*/React.createElement("span", {
    className: "hud-turn"
  }, "CTB ", turn), /*#__PURE__*/React.createElement("ol", null, order.map((entry, index) => {
    const fighter = team.find(f => f.name === entry.name),
      enemy = enemies.find(e => e.id === entry.id);
    const description = `${index + 1}. ${entry.name} · SPE ${entry.speed} · ${entry.guard ? "Défense prioritaire · " : ""}délai ${Math.max(0, entry.at)} · ${entry.side === "enemy" ? `Attaque → ${entry.target}` : planName(plans[entry.name])}`;
    return /*#__PURE__*/React.createElement("li", {
      key: entry.key,
      className: `${entry.side} ${busy && index === queueIndex ? "playing" : ""} ${busy && index < queueIndex ? "played" : ""}`,
      "aria-current": busy && index === queueIndex ? "step" : undefined
    }, /*#__PURE__*/React.createElement("button", {
      title: description,
      "aria-label": description,
      onClick: () => setOrderDetail(entry.key)
    }, /*#__PURE__*/React.createElement(HudPortrait, {
      fighter: fighter,
      enemy: enemy
    }), /*#__PURE__*/React.createElement("span", {
      className: "turn-number"
    }, index + 1)));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "arena pve-vfx-arena",
    style: {
      backgroundImage: `linear-gradient(180deg, rgba(15,20,21,.04), rgba(9,12,13,.42)), url(${battleBackground})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "turn-badge"
  }, "TURN ", String(turn).padStart(2, "0")), /*#__PURE__*/React.createElement("div", {
    className: `enemy-line enemies-count-${enemies.length}`
  }, enemies.map(enemy => /*#__PURE__*/React.createElement("button", {
    key: enemy.id,
    "data-fx-unit": `enemy:${enemy.id}`,
    className: `enemy-unit ${selected === enemy.id ? "selected" : ""} ${enemy.hp <= 0 ? "defeated" : ""} ${impact === enemy.id ? "hit" : ""}`,
    onClick: () => targetPin && !busy ? choose({
      kind: "psych",
      pin: targetPin,
      target: enemy.id
    }) : selectEnemy(enemy),
    onDoubleClick: () => enemy.hp > 0 && setInspectedId(enemy.id),
    "aria-label": `${enemy.name} · ${enemy.hp} / ${enemy.maxHp} PV. Deux appuis pour les statistiques.`,
    title: "Deux appuis pour les statistiques"
  }, /*#__PURE__*/React.createElement(EnemySprite, {
    kind: enemy.kind,
    boss: enemy.boss,
    combat: true
  }), hitFeedback?.side === "enemy" && hitFeedback.target === String(enemy.id) && /*#__PURE__*/React.createElement("span", {
    className: "hit-feedback",
    key: queueIndex
  }, hitFeedback.label), /*#__PURE__*/React.createElement("span", {
    className: "enemy-hp",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: `${100 * enemy.hp / enemy.maxHp}%`
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "player-line"
  }, team.map(fighter => /*#__PURE__*/React.createElement("div", {
    className: `arena-hero ${fighter.hp <= 0 ? fighterAtlases[fighter.name] ? "fighter-atlas-ko" : "defeated" : ""}`,
    "data-fx-unit": `ally:${fighter.name}`,
    key: fighter.name
  }, /*#__PURE__*/React.createElement(Sprite, {
    fighter: fighter,
    action: fighter.name === actor ? activeAction : null,
    actionKey: fighter.name === actor && activeAction ? queueIndex : null,
    victory: reward,
    combat: true
  }), /*#__PURE__*/React.createElement("span", null, fighter.name), hitFeedback?.side === "ally" && hitFeedback.target === fighter.name && /*#__PURE__*/React.createElement("span", {
    className: "hit-feedback",
    key: queueIndex
  }, hitFeedback.label)))), /*#__PURE__*/React.createElement("p", {
    className: "combat-status",
    role: "status"
  }, message)), /*#__PURE__*/React.createElement("section", {
    className: `round-planner ${choosing ? "choosing-action" : ""}`,
    "aria-label": "Pr\xE9parer les actions"
  }, choosing ? /*#__PURE__*/React.createElement("div", {
    key: `${choosing.name}-${targetPin || "actions"}`,
    className: "inline-action-menu",
    "aria-label": `Actions de ${choosing.name}`
  }, targetPin ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, psychs[targetPin].name), " \xB7 Choisir la cible"), /*#__PURE__*/React.createElement("div", {
    className: "target-menu"
  }, livingEnemies.map((enemy, i) => /*#__PURE__*/React.createElement("button", {
    key: enemy.id,
    onClick: () => choose({
      kind: "psych",
      pin: targetPin,
      target: enemy.id
    })
  }, /*#__PURE__*/React.createElement(HudPortrait, {
    enemy: enemy
  }), /*#__PURE__*/React.createElement("b", null, enemy.name), /*#__PURE__*/React.createElement("span", null, enemy.hp, " / ", enemy.maxHp, " PV \xB7 ", affinityText(effectiveness(psychs[targetPin].element, enemyElements[enemy.kind]))), /*#__PURE__*/React.createElement(TypeChips, {
    elements: enemyElements[enemy.kind]
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setTargetPin(null)
  }, "Retour aux actions")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "psych-action-menu"
  }, (loadout[choosing.name] || []).map(id => {
    const pin = psychs[id],
      aoe = offensive(id) && pinTargetMode(pin) === "aoe";
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      disabled: pin.cost + otherCost > energy,
      onClick: () => offensive(id) && !aoe ? setTargetPin(id) : choose({
        kind: "psych",
        pin: id
      })
    }, /*#__PURE__*/React.createElement(PinIcon, {
      pin: pin
    }), /*#__PURE__*/React.createElement("b", null, pin.name), /*#__PURE__*/React.createElement("span", null, elementNames[pin.element || badgeElement(pin)], " \xB7 ", types[pin.kind], " \xB7 ", offensive(id) ? aoe ? "AoE" : "Monocible" : "Duo", stabMultiplier(choosing, pin) > 1 ? " · STAB ×1,2" : "", " \xB7 ", pin.cost, " EN"));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => choose({
      kind: "guard"
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "guard"
  }), /*#__PURE__*/React.createElement("b", null, "D\xE9fense"), /*#__PURE__*/React.createElement("span", null, "0 EN \xB7 Protection \xB7 +1 EN")), groove >= 100 && /*#__PURE__*/React.createElement("button", {
    disabled: burstReserved,
    onClick: () => choose({
      kind: "burst"
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bolt"
  }), /*#__PURE__*/React.createElement("b", null, "Sync Burst"), /*#__PURE__*/React.createElement("span", null, "100% Groove \xB7 Tous les ennemis"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setChooser(null)
  }, "Annuler"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "planned-actions"
  }, team.map(f => {
    const plan = plans[f.name],
      target = enemies.find(e => e.id === plan?.target);
    return /*#__PURE__*/React.createElement("button", {
      key: f.name,
      disabled: busy || reward || f.hp <= 0,
      onClick: () => openChooser(f.name)
    }, /*#__PURE__*/React.createElement("b", null, f.name), /*#__PURE__*/React.createElement("span", null, f.hp <= 0 ? "K.O." : planName(plan)), /*#__PURE__*/React.createElement("small", null, plan ? target ? `→ ${target.name}` : plan.kind === "guard" ? "Protection personnelle" : "Duo / tous les ennemis" : "Choisir"), plan && /*#__PURE__*/React.createElement("small", null, planCost(plan), " EN \xB7 Modifier"));
  })), /*#__PURE__*/React.createElement("button", {
    className: "resolve-round",
    disabled: busy || reward || !ready || teamDefeated,
    onClick: () => resolveRound()
  }, busy ? "Tour en cours…" : "Lancer le tour")))), /*#__PURE__*/React.createElement("aside", {
    className: "route-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-label"
  }, /*#__PURE__*/React.createElement("span", null, "RUN PROGRESS"), /*#__PURE__*/React.createElement("b", null, "SECTOR ", String(sector).padStart(2, "0"))), /*#__PURE__*/React.createElement("div", {
    className: "route"
  }, Array.from({
    length: 5
  }, (_, index) => routeStart + index).map(node => /*#__PURE__*/React.createElement("div", {
    className: node < wave ? "complete" : node === wave ? "current" : "",
    key: node
  }, /*#__PURE__*/React.createElement("span", null, node < wave ? "✓" : String(node).padStart(2, "0")), /*#__PURE__*/React.createElement("p", null, isBossWave(node) ? "BOSS SIGNAL" : node === wave ? "CURRENT WAVE" : "NOISE WAVE")))), /*#__PURE__*/React.createElement("div", {
    className: "tip-card"
  }, /*#__PURE__*/React.createElement("small", null, "REAPER TIP"), /*#__PURE__*/React.createElement("p", null, "Timeline CTB : Défense passe en priorité. La SPE et le délai de l’action déterminent les prochains passages. À 100% de Groove, choisis Sync Burst dans les actions."), /*#__PURE__*/React.createElement("a", {
    href: "https://twewy.fandom.com/wiki/TWEWY/Pin_List",
    target: "_blank",
    rel: "noreferrer"
  }, "PIN DATABASE \u2197")))), orderDetail && /*#__PURE__*/React.createElement(WishDialog, {
    title: "Ordre du tour",
    close: () => setOrderDetail(null)
  }, (() => {
    const entry = order.find(e => e.key === orderDetail);
    return entry ? /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, entry.name), " \xB7 SPE ", entry.speed, /*#__PURE__*/React.createElement("br", null), entry.guard ? "Défense prioritaire · " : "", "Délai CTB ", Math.max(0, entry.at), /*#__PURE__*/React.createElement("br", null), entry.side === "enemy" ? `Attaque → ${entry.target}` : planName(plans[entry.name])) : /*#__PURE__*/React.createElement("p", null, "Cette action est termin\xE9e.");
  })(), /*#__PURE__*/React.createElement("button", {
    className: "fullscreen-button",
    onClick: () => setOrderDetail(null)
  }, "Fermer")), inspected && /*#__PURE__*/React.createElement(WishDialog, {
    title: inspected.name,
    close: () => setInspectedId(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "enemy-inspection"
  }, /*#__PURE__*/React.createElement(EnemySprite, {
    kind: inspected.kind,
    boss: inspected.boss
  })), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Niveau"), /*#__PURE__*/React.createElement("dd", null, inspected.level), /*#__PURE__*/React.createElement("dt", null, "PV"), /*#__PURE__*/React.createElement("dd", null, inspected.hp, " / ", inspected.maxHp), /*#__PURE__*/React.createElement("dt", null, "ATK"), /*#__PURE__*/React.createElement("dd", null, inspected.attack), /*#__PURE__*/React.createElement("dt", null, "SPE"), /*#__PURE__*/React.createElement("dd", null, inspected.speed), /*#__PURE__*/React.createElement("dt", null, "XP par personnage"), /*#__PURE__*/React.createElement("dd", null, inspected.xp), /*#__PURE__*/React.createElement("dt", null, "\xC9l\xE9ments"), /*#__PURE__*/React.createElement("dd", null, /*#__PURE__*/React.createElement(TypeChips, {
    elements: enemyElements[inspected.kind]
  })), /*#__PURE__*/React.createElement("dt", null, "Type"), /*#__PURE__*/React.createElement("dd", null, inspected.boss ? "Boss" : "Noise")), /*#__PURE__*/React.createElement("button", {
    className: "pull-button",
    onClick: () => setInspectedId(null)
  }, "Fermer"), /*#__PURE__*/React.createElement("p", null, enemyTraitNames[inspected.trait || "none"])), dropReveal.length > 0 && /*#__PURE__*/React.createElement(WishDialog, {
    title: "Butin de combat",
    close: () => setDropReveal([])
  }, /*#__PURE__*/React.createElement(RewardReveal, {
    draws: dropReveal,
    close: () => setDropReveal([])
  })), loot.length > 0 && /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), reward && /*#__PURE__*/React.createElement("div", {
    className: "overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal reward-modal"
  }, /*#__PURE__*/React.createElement("small", null, "WAVE ", String(wave).padStart(2, "0"), " COMPLETE"), event ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", null, wave === 3 ? event.boss : "Vague terminée !"), wave === 3 ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, event.prize === "character" ? `Personnage obtenu · ${event.boss}` : event.prize === "pin" ? signaturePins[event.boss].name : "Aucun butin cette fois."), /*#__PURE__*/React.createElement("button", {
    onClick: leave
  }, "Retour aux \xE9v\xE9nements")) : /*#__PURE__*/React.createElement("button", {
    onClick: nextWave
  }, wave === 1 ? "Vague suivante" : "Affronter le boss")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", null, wave === maxFloor ? "Étage 100 · Ascension terminée !" : "CHOOSE YOUR DROP"), /*#__PURE__*/React.createElement("p", null, "+5 pi\xE8ces \xB7 +", earnedXp, " XP par personnage."), loot.length > 0 && /*#__PURE__*/React.createElement("p", null, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), wave < maxFloor ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, difficultyAt(wave + 1).tier > difficultyAt(wave).tier ? "Nouveau palier : soin complet de la Team." : "Les PV sont conservés. Prochain soin au changement de palier."), /*#__PURE__*/React.createElement("button", {
    className: "fullscreen-button",
    onClick: nextWave
  }, "Continuer \xB7 \xC9tage ", wave + 1)) : /*#__PURE__*/React.createElement("button", {
    className: "fullscreen-button",
    onClick: leave
  }, "Retour \xE0 Team \xB7 Voir les qu\xEAtes")))), teamDefeated && !busy && /*#__PURE__*/React.createElement("div", {
    className: "overlay"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal game-over"
  }, /*#__PURE__*/React.createElement("small", null, "RUN TERMINATED"), /*#__PURE__*/React.createElement("h2", null, "ERASED"), /*#__PURE__*/React.createElement("p", null, "You reached wave ", wave, ". The streets will remember your score."), /*#__PURE__*/React.createElement("p", null, "La reprise de cette run a \xE9t\xE9 supprim\xE9e."), /*#__PURE__*/React.createElement("button", {
    onClick: leave
  }, event ? "Retour aux événements" : "Retour à Team"))));
}

// Delegated feedback also applies to future game and gacha buttons.
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
  if (!catalogReady) return /*#__PURE__*/React.createElement("main", {
    className: "game-shell party-lobby"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h1", null, "Bestiaire"), /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, catalogError ? "Chargement des données indisponible. Ta sauvegarde reste intacte." : "Chargement du bestiaire…"), catalogError && /*#__PURE__*/React.createElement("button", {
    onClick: () => location.reload()
  }, "R\xE9essayer")));
  if (!status.ready) return /*#__PURE__*/React.createElement("main", {
    className: "game-shell party-lobby"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h1", null, "Progression"), /*#__PURE__*/React.createElement("p", {
    role: "status"
  }, status.message), /*#__PURE__*/React.createElement("p", null, "La progression du t\xE9l\xE9phone est prioritaire. Aucune sauvegarde locale n\u2019a \xE9t\xE9 supprim\xE9e."), /*#__PURE__*/React.createElement("button", {
    onClick: () => location.reload()
  }, "R\xE9essayer"), /*#__PURE__*/React.createElement("a", {
    href: "../app.html",
    target: "_top"
  }, "Retour \xE0 l\u2019application")));
  return /*#__PURE__*/React.createElement(React.Fragment, null, status.kind !== "synced" && status.kind !== "saving" && status.message && /*#__PURE__*/React.createElement("p", {
    className: "save-sync-notice",
    role: "status"
  }, status.message), /*#__PURE__*/React.createElement(App, null));
}
window.ChibiGameCatalog = { characters: characterRoster, bases, elements: characterElements, passives: characterPassives, badges: psychs, enemies: ffbeBestiary, awakeningHpBonus };
function raidPlanAnimation(plan) {
  const kind = plan?.kind === "guard" ? "guard" : psychs[plan?.pin]?.kind;
  return { physical: "shockwave", special: "pyro", heal: "heal", guard: "guard" }[kind];
}
window.ChibiRaidSprites = {
  loadPage: ffbePage,
  enemies: enemyCatalog,
  partyImpact(members, plans) {
    if (!plans || matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
    return Math.max(0, ...members.map(({ name, hp }, index) => {
      const action = raidPlanAnimation(plans[index]);
      return hp > 0 && (action === "shockwave" || action === "pyro") ? fighterActionTiming(name, action).impact : 0;
    }));
  },
  mountParty(host, members, victory, plans) {
    const root = ReactDOM.createRoot(host);
    const draw = round => root.render(members.map(({ name, hp, maxHp }, index) => {
      const fighter = characterRoster.find(character => character.name === name);
      const action = raidPlanAnimation(round?.[index]);
      return React.createElement("span", { key: index, className: "raid-party-sprite" },
        fighter && (hp > 0 || fighterAtlases[name]) ? React.createElement(Sprite, { fighter, combat: true, hpRatio: hp / maxHp, victory, action }) : null);
    }));
    draw(plans);
    const duration = Math.max(680, ...members.map(({name}, index) => fighterActionTiming(name, raidPlanAnimation(plans?.[index])).duration));
    const timer = plans && setTimeout(() => draw(null), matchMedia("(prefers-reduced-motion: reduce)").matches ? 680 : duration);
    return () => { clearTimeout(timer); root.unmount(); };
  }
};
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SaveBoundary));
