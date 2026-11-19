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
const characterRoster = [{
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
    frames: 4,
    frameWidth: 68,
    frameHeight: 72,
    hp: 50,
    attack: 10
  },
  wolf: {
    name: "GARAGE WOLF",
    frames: 4,
    frameWidth: 82,
    frameHeight: 78,
    hp: 72,
    attack: 15
  },
  shinigami: {
    name: "SHINIGAMI",
    frames: 5,
    frameWidth: 46,
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
  const [frame, setFrame] = useState(0);
  const displayFrameWidth = 92 * spec.frameWidth / spec.frameHeight;
  useEffect(() => {
    setFrame(0);
    if (spec.frames < 2) return;
    const timer = window.setInterval(() => {
      setFrame(current => (current + 1) % spec.frames);
    }, 1000 / spec.frames);
    return () => window.clearInterval(timer);
  }, [kind, spec.frames]);
  return React.createElement("img", {
    className: `pixel-sprite enemy-sprite ${boss ? "boss-noise" : ""}`,
    src: `./assets/game/enemy-frames/${kind}-${frame}.png`,
    alt: "",
    draggable: false,
    style: {
      width: `${displayFrameWidth}px`,
      height: "92px"
    }
  });
}
const makeWave = wave => {
  const bossWave = isBossWave(wave);
  const count = bossWave ? 2 + Math.min(1, Math.floor(wave / 25)) : Math.min(2 + Math.floor((wave - 1) / 2), 4);
  const growth = 1 + (wave - 1) * 0.08;
  return Array.from({
    length: count
  }, (_, index) => {
    const boss = bossWave && index === 0;
    const kind = boss ? Math.floor(wave / 5) % 2 === 0 ? "psyche-fox" : "shinigami" : enemyKinds[(wave * 3 + index * 2 + Math.floor(wave / 5)) % enemyKinds.length];
    const template = enemyCatalog[kind];
    const maxHp = Math.round(template.hp * growth * (boss ? 2.5 : 1));
    return {
      id: wave * 10 + index,
      name: boss ? `${template.name} // BOSS` : template.name,
      kind,
      hp: maxHp,
      maxHp,
      attack: Math.round(template.attack * growth * (boss ? 1.55 : 1)),
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
const psychs = Object.fromEntries(pinList.map(pin => [pin.id, pin]));
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
  partners: "Partenaires"
};
const bases = {
  NEKU: [24, 32, 14],
  SHIKI: [22, 26, 20],
  BEAT: [34, 18, 12],
  JOSHUA: [19, 36, 16]
};
function trained(f, wins, awake) {
  const n = Math.floor(wins / 3),
    [atk, mag, speed] = bases[f.name];
  const maxHp = f.maxHp + n * 5 + (awake ? 20 : 0);
  return {
    ...f,
    wins,
    level: n + 1,
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
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
    const owned = characterRoster.map(f => f.name).filter(name => saved.owned.includes(name));
    const equipped = [...new Set(saved.equipped)].filter(name => owned.includes(name)).slice(0, 2);
    const pins = [...new Set(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}))].filter(id => Object.hasOwn(psychs, id));
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 10 ? saved.wishStep : 0;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return {
      owned,
      equipped,
      pins,
      wishStep,
      copies: Object.fromEntries(owned.map(n => [n, saved.awakened?.includes(n) || saved.levels?.[n] === 5 ? 5 : Math.min(5, Math.max(0, Math.floor(Number(saved.copies?.[n]) || 0)))])),
      wins: Object.fromEntries(owned.map(n => [n, Math.max(0, Math.floor(Number(saved.wins?.[n]) || 0))])),
      levels: Object.fromEntries(owned.map(name => [name, ranks[saved.levels?.[name]] ? Number(saved.levels[name]) : 0])),
      awakened: owned.filter(name => saved.levels?.[name] === 5 && saved.awakened?.includes(name)),
      loadout: Object.fromEntries(Object.entries(saved.loadout || {}).filter(([, id]) => pins.includes(String(id)))),
      coins: saved.coins
    };
  } catch {}
  return {
    pins: [],
    wishStep: 0,
    copies: {},
    wins: {},
    levels: {},
    awakened: [],
    owned: [],
    equipped: [],
    loadout: {},
    coins: 180
  };
}
function App() {
  const [profile, displayProfile] = useState(loadProfile);
  const [party, setParty] = useState(null);
  const [result, setResult] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [portal, setPortal] = useState("shibuya");
  const [phase, setPhase] = useState("ready");
  const turning = React.useRef(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const sync = event => {
      if (event.key === profileKey) displayProfile(loadProfile());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setProfile = update => {
    let current = profile;
    try {
      if (localStorage.getItem(profileKey)) current = loadProfile();
    } catch {}
    const next = update(current);
    try {
      localStorage.setItem(profileKey, JSON.stringify(next));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
    displayProfile(next);
  };
  const starter = p => p.owned.length < 2 || !p.pins.some(offensive);
  const wishCost = (p, n = quantity) => n === 1 && starter(p) ? 0 : 100 * n;
  const price = wishCost(profile);
  const recruit = (id, count) => {
    if (turning.current) return;
    const draws = [];
    setProfile(p => {
      if (p.coins < wishCost(p, count)) return p;
      const next = {
        ...p,
        pins: [...p.pins],
        coins: p.coins - wishCost(p, count),
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
        if (next.wishStep !== 0 && Math.random() >= 0.10) {
          const pin = pick(pinList);
          if (!next.pins.includes(pin.id)) next.pins.push(pin.id);
          draws.push({
            pin
          });
          continue;
        }
        const missing = characterRoster.filter(f => !next.owned.includes(f.name));
        const available = characterRoster.filter(f => (next.copies[f.name] || 0) < 5);
        const pool = missing.length ? missing : available.length ? available : characterRoster;
        const weighted = id === "partners" ? [...pool, ...pool.filter(f => ["BEAT", "JOSHUA"].includes(f.name))] : pool;
        const name = weighted[Math.floor(Math.random() * weighted.length)].name;
        const roll = Math.random(),
          rank = roll < .5 ? 0 : roll < .78 ? 1 : roll < .92 ? 2 : roll < .98 ? 3 : 4;
        if (next.owned.includes(name)) next.copies[name] = Math.min(5, (next.copies[name] || 0) + 1);else {
          next.owned.push(name);
          next.copies[name] = 0;
        }
        next.levels[name] = next.copies[name] === 5 ? 5 : Math.max(next.levels[name] || 0, rank);
        draws.push({
          name,
          rank,
          copies: next.copies[name]
        });
      }
      return next;
    });
    if (draws.length) {
      turning.current = true;
      setPortal(id);
      setQuantity(count);
      setResult(draws);
      setPhase("spin");
    }
  };
  const awaken = name => setProfile(p => p.copies[name] === 5 && !p.awakened.includes(name) ? {
    ...p,
    awakened: [...p.awakened, name]
  } : p);
  const equip = name => {
    const selected = profile.equipped.includes(name);
    if (!profile.owned.includes(name) || !selected && profile.equipped.length >= 2) return;
    setProfile(p => ({
      ...p,
      equipped: selected ? p.equipped.filter(n => n !== name) : [...p.equipped, name].slice(0, 2)
    }));
  };
  if (party) return React.createElement(Battle, {
    initialTeam: party,
    loadout: profile.loadout,
    coins: profile.coins,
    onDrops: ids => setProfile(p => ({
      ...p,
      pins: [...new Set([...p.pins, ...ids])]
    })),
    onVictory: () => setProfile(p => ({
      ...p,
      coins: p.coins + 5,
      wins: {
        ...p.wins,
        ...Object.fromEntries(party.map(f => [f.name, (p.wins[f.name] || 0) + 1]))
      }
    })),
    leave: () => {
      setParty(null);
      setResult([]);
    }
  });
  if (gachaView) return React.createElement("main", {
    className: "game-shell party-lobby"
  }, React.createElement("section", null, React.createElement("h2", null, "Bingo Kai"), React.createElement("p", null, profile.coins, " pi\xE8ces \xB7 ", profile.owned.length, " / ", characterRoster.length, " personnages d\xE9bloqu\xE9s \xB7 Garantie dans ", 10 - profile.wishStep, " ", profile.wishStep === 9 ? "vœu" : "vœux"), React.createElement("div", {
    className: "portal-list"
  }, Object.entries(portals).map(([id, title]) => React.createElement("article", {
    key: id,
    className: "portal-card",
    "aria-label": title
  }, React.createElement("div", {
    className: "portal-scene scene-" + id
  }, id === "shibuya" && !matchMedia("(prefers-reduced-motion: reduce)").matches && React.createElement("video", {
    className: "portal-art",
    src: "./assets/bingo/first-week-clean.mp4",
    poster: "./assets/bingo/first-week-clean.webp",
    autoPlay: true,
    muted: true,
    playsInline: true,
    "aria-hidden": "true"
  }), id === "partners" && React.createElement("div", {
    className: "portal-duo"
  }, characterRoster.filter(f => ["BEAT", "JOSHUA"].includes(f.name)).map(f => React.createElement(Sprite, {
    key: f.name,
    fighter: f
  }))), React.createElement("h3", null, id === "shibuya" ? "First Week #1" : title), React.createElement("div", {
    className: "bingo-machine"
  }, React.createElement("img", {
    className: "bingo-body",
    src: "./assets/bingo/machine.webp",
    alt: "Bingo Kai"
  }), React.createElement("button", {
    className: "bingo-crank " + (id === portal && phase === "spin" ? "turning" : ""),
    disabled: phase !== "ready" || profile.coins < price,
    "aria-label": `Faire ${quantity} vœu(x) sur ${title} pour ${price} pièces`,
    onClick: () => recruit(id, quantity),
    onAnimationEnd: e => {
      if (e.animationName === "bingo-turn") setPhase("drop");
    }
  }), id === portal && phase === "drop" && React.createElement("span", {
    className: "bingo-ball",
    onAnimationEnd: () => {
      turning.current = false;
      setPhase("ready");
    }
  })), React.createElement("div", {
    className: "wish-commands"
  }, [1, 10].map(n => React.createElement("button", {
    key: n,
    disabled: phase !== "ready" || profile.coins < wishCost(profile, n),
    onClick: () => recruit(id, n)
  }, React.createElement("strong", null, n === 1 ? "Un vœu" : "Dix vœux"), React.createElement("small", null, wishCost(profile, n), " pi\xE8ces")))), React.createElement("p", {
    className: "portal-caption"
  }, id === "shibuya" ? "Tous les personnages disponibles ont la même chance d’être recrutés." : "Beat et Joshua ont deux fois plus de chances d’être recrutés que les autres personnages disponibles.")), id === portal && React.createElement("div", {
    "aria-live": "polite"
  }, phase === "ready" && result.map((draw, i) => "pin" in draw ? React.createElement("div", {
    className: "recruit-reveal",
    key: i
  }, React.createElement(PinIcon, {
    pin: draw.pin
  }), React.createElement("strong", null, draw.pin.name), React.createElement("span", null, "Psych \xB7 ", types[draw.pin.kind])) : React.createElement("div", {
    className: "recruit-reveal",
    key: i
  }, React.createElement(Sprite, {
    fighter: characterRoster.find(f => f.name === draw.name)
  }), React.createElement("strong", null, draw.name), React.createElement(RankBadge, {
    level: draw.rank
  }), React.createElement("span", null, draw.copies ? `Doublon ${draw.copies}/5` : "Nouvelle recrue"))))))), phase === "ready" && profile.owned.map(name => React.createElement("div", {
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
  }, React.createElement("section", null, React.createElement("h1", null, "Pr\xE9parer le duo"), profile.owned.length < 2 && React.createElement("p", null, "D\xE9bloque deux personnages dans ", React.createElement("a", {
    href: "../app.html#gacha",
    target: "_top"
  }, "l\u2019onglet Gacha"), "."), React.createElement("h2", null, "Ton duo \xB7 ", profile.equipped.length, " / 2"), React.createElement("div", {
    className: "party-list"
  }, characterRoster.map(f => {
    const stats = trained(f, profile.wins[f.name] || 0, profile.awakened.includes(f.name));
    const owned = profile.owned.includes(f.name),
      selected = profile.equipped.includes(f.name);
    return React.createElement("button", {
      key: f.name,
      "aria-pressed": selected,
      onClick: () => equip(f.name),
      disabled: !owned || !selected && profile.equipped.length === 2
    }, React.createElement(Sprite, {
      fighter: f
    }), React.createElement("strong", null, f.name), owned && React.createElement("small", null, "Niv. ", stats.level, " \xB7 PV ", stats.maxHp, " \xB7 ATK ", stats.atk, " \xB7 ATK SPE ", stats.mag, " \xB7 SPE ", stats.speed), React.createElement("span", null, owned && React.createElement(RankBadge, {
      level: profile.levels[f.name]
    })), React.createElement("span", null, selected ? "Équipé · Retirer" : owned ? "Équiper" : "À débloquer"));
  })), React.createElement("details", null, React.createElement("summary", null, "Catalogue \xB7 ", profile.pins.length, " / ", pinList.length, " badges obtenus"), React.createElement("div", {
    className: "pin-catalog"
  }, pinList.map(pin => React.createElement("div", {
    key: pin.id
  }, React.createElement(PinIcon, {
    pin: pin
  }), " #", pin.number, " ", pin.name, " \xB7 ", types[pin.kind], " \xB7 ", profile.pins.includes(pin.id) ? "Obtenu" : "À découvrir"))), React.createElement("small", null, "Visuels DS \xB7 NightOwl35. Donn\xE9es \xB7 TWEWY Wiki.")), profile.equipped.map(name => React.createElement("label", {
    className: "psych-choice",
    key: name
  }, "Psych de ", name, React.createElement("select", {
    value: profile.loadout[name] || "",
    onChange: e => {
      const psych = e.target.value;
      setProfile(p => p.pins.includes(psych) ? {
        ...p,
        loadout: {
          ...p.loadout,
          [name]: psych
        }
      } : p);
    }
  }, React.createElement("option", {
    value: "",
    disabled: true
  }, "Choisir un psych"), profile.pins.map(id => [id, psychs[id]]).map(([id, item]) => React.createElement("option", {
    key: id,
    value: id
  }, "#", item.number, " ", item.name, " \xB7 ", types[item.kind], " \xB7 ", item.cost, " EN"))))), profile.equipped.length === 2 && profile.equipped.every(n => !["physical", "special"].includes(psychs[profile.loadout[n]]?.kind)) && React.createElement("p", null, "\xC9quipe au moins un psych offensif."), React.createElement("button", {
    className: "pull-button",
    disabled: profile.equipped.length !== 2 || !profile.equipped.every(n => profile.loadout[n]) || profile.equipped.every(n => !["physical", "special"].includes(psychs[profile.loadout[n]]?.kind)),
    onClick: () => setParty(profile.equipped.map(name => {
      const f = characterRoster.find(f => f.name === name);
      return trained(f, profile.wins[name] || 0, profile.awakened.includes(name));
    }))
  }, "Lancer le roguelike"), saveError && React.createElement("p", {
    role: "alert"
  }, "La sauvegarde locale est indisponible dans ce navigateur.")));
}
function Battle({
  initialTeam,
  loadout,
  coins,
  onDrops,
  onVictory,
  leave
}) {
  const [wave, setWave] = useState(1);
  const [team, setTeam] = useState(initialTeam);
  const [enemies, setEnemies] = useState(() => makeWave(1));
  const [selected, setSelected] = useState(10);
  const [energy, setEnergy] = useState(3);
  const [groove, setGroove] = useState(28);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Noise detected. Choose your move.");
  const [busy, setBusy] = useState(false);
  const [impact, setImpact] = useState(null);
  const [loot, setLoot] = useState([]);
  const [reward, setReward] = useState(false);
  const [actor, setActor] = useState("");
  const [guarded, setGuarded] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
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
  const enemyTurn = (updatedEnemies, wasGuarded = guarded) => {
    const defeated = updatedEnemies.filter((enemy, i) => enemy.hp === 0 && enemies[i].hp > 0);
    const drops = defeated.filter(() => Math.random() < 0.25).map(() => pick(pinList));
    if (drops.length) {
      onDrops(drops.map(pin => pin.id));
      setLoot(old => [...old, ...drops.map(pin => pin.name)]);
    }
    const attackers = updatedEnemies.filter(enemy => enemy.hp > 0);
    if (!attackers.length) {
      setTimeout(() => {
        onVictory();
        setTeam(prev => prev.map(f => {
          const wins = (f.wins || 0) + 1;
          if (wins % 3) return {
            ...f,
            wins
          };
          return {
            ...f,
            wins,
            level: f.level + 1,
            atk: f.atk + 2,
            mag: f.mag + 2,
            speed: f.speed + 1,
            maxHp: f.maxHp + 5,
            hp: f.hp > 0 ? f.hp + 5 : 0
          };
        }));
        setReward(true);
        setBusy(false);
        setActiveAction(null);
        setMessage("Wave cleared. Your drop is ready.");
      }, 500);
      return;
    }
    setTimeout(() => {
      const attacker = attackers[Math.floor(Math.random() * attackers.length)];
      const livingFighters = team.map((fighter, index) => ({
        fighter,
        index
      })).filter(({
        fighter
      }) => fighter.hp > 0);
      if (!livingFighters.length) {
        setBusy(false);
        return;
      }
      const target = livingFighters[Math.floor(Math.random() * livingFighters.length)];
      const damage = Math.random() < Math.min(.30, target.fighter.speed / 200) ? 0 : Math.max(3, Math.round(attacker.attack * (wasGuarded ? 0.45 : 1)));
      setTeam(current => current.map((fighter, index) => index === target.index ? {
        ...fighter,
        hp: Math.max(0, fighter.hp - damage)
      } : fighter));
      setMessage(`${attacker.name} strikes ${target.fighter.name} for ${damage}.`);
      setEnergy(value => Math.min(3, value + 1));
      setGroove(value => Math.min(100, value + 12));
      setTurn(value => value + 1);
      setGuarded(false);
      setActiveAction(null);
      setBusy(false);
    }, 650);
  };
  const dealDamage = (amount, label, cost, grooveGain, action, drain = false) => {
    if (busy || reward || energy < cost) return;
    const target = livingEnemies.find(enemy => enemy.id === selected);
    if (!target) return;
    setBusy(true);
    setActiveAction(action);
    setEnergy(value => value - cost);
    const variance = Math.floor(Math.random() * 7) - 3;
    const boost = team.some(f => f.hp > 0 && psychs[loadout[f.name]].psych.startsWith("Resonance")) ? 1.15 : 1;
    const damage = Math.max(1, Math.round(amount * boost) + variance);
    const updated = enemies.map(enemy => enemy.id === selected ? {
      ...enemy,
      hp: Math.max(0, enemy.hp - damage)
    } : enemy);
    setEnemies(updated);
    if (drain) setTeam(current => current.map(f => ({
      ...f,
      hp: Math.min(f.maxHp, f.hp + Math.ceil(damage / 4))
    })));
    setImpact(selected);
    setGroove(value => Math.min(100, value + grooveGain));
    setMessage(`${label} hits ${target.name} for ${damage}!`);
    setTimeout(() => setImpact(null), 380);
    enemyTurn(updated);
  };
  const heal = (amount, cost) => {
    if (busy || energy < cost) return;
    setBusy(true);
    setActiveAction("heal");
    setEnergy(value => value - cost);
    setTeam(current => current.map(fighter => ({
      ...fighter,
      hp: Math.min(fighter.maxHp, fighter.hp + amount)
    })));
    setMessage(`Soin du duo · +${amount} PV`);
    enemyTurn(enemies);
  };
  const guard = () => {
    if (busy) return;
    setBusy(true);
    setActiveAction("guard");
    setGuarded(true);
    setMessage("Team braces. Incoming damage reduced.");
    enemyTurn(enemies, true);
  };
  const unleash = () => {
    if (busy || groove < 100) return;
    setBusy(true);
    setActiveAction("burst");
    setGroove(0);
    const updated = enemies.map(enemy => ({
      ...enemy,
      hp: Math.max(0, enemy.hp - 58)
    }));
    setEnemies(updated);
    setMessage("SYNC BURST! Every Noise takes 58 damage.");
    enemyTurn(updated);
  };
  const nextWave = boost => {
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
    setLoot([]);
    setWave(next);
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
    setLoot([]);
    setWave(1);
    setTurn(1);
    const saved = loadProfile();
    setTeam(initialTeam.map(f => trained(characterRoster.find(base => base.name === f.name), saved.wins[f.name] || 0, saved.awakened.includes(f.name))));
    setEnemies(makeWave(1));
    setSelected(10);
    setEnergy(3);
    setGroove(28);
    setMessage("Noise detected. Choose your move.");
  };
  return React.createElement("main", {
    className: "game-shell"
  }, React.createElement("header", {
    className: "topbar"
  }, React.createElement("div", {
    className: "brand-lockup"
  }, React.createElement("div", {
    className: "brand-mark"
  }, "R"), React.createElement("div", null, React.createElement("strong", null, "REAPER'S RUN"), React.createElement("span", null, "SHIBUYA / DAY 01"))), React.createElement("div", {
    className: "run-stats"
  }, React.createElement("span", null, React.createElement(Icon, {
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
  }, React.createElement(Sprite, {
    fighter: fighter
  }), React.createElement("span", null, "0", index + 1)), React.createElement("div", {
    className: "fighter-info"
  }, React.createElement("small", null, fighter.role), React.createElement("h2", null, fighter.name), React.createElement("div", {
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
    disabled: groove < 100 || busy,
    onClick: unleash
  }, React.createElement(Icon, {
    name: "bolt"
  }), " SYNC BURST"))), React.createElement("section", {
    className: "battle-column"
  }, React.createElement("div", {
    className: "battle-heading"
  }, React.createElement("div", null, React.createElement("small", null, "ENCOUNTER"), React.createElement("h1", null, "WAVE ", String(wave).padStart(2, "0"))), React.createElement("div", {
    className: `threat threat-${threat.toLowerCase()}`
  }, React.createElement("span", null, "THREAT"), React.createElement("b", null, threat))), React.createElement("div", {
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
    onClick: () => enemy.hp > 0 && setSelected(enemy.id),
    "aria-label": `Target ${enemy.name}`
  }, React.createElement(EnemySprite, {
    kind: enemy.kind,
    boss: enemy.boss
  }), React.createElement("div", {
    className: "enemy-tag"
  }, React.createElement("strong", null, enemy.name), React.createElement("span", null, enemy.hp, " / ", enemy.maxHp), React.createElement("div", null, React.createElement("i", {
    style: {
      width: `${enemy.hp / enemy.maxHp * 100}%`
    }
  }))), selected === enemy.id && enemy.hp > 0 && React.createElement("span", {
    className: "target-reticle"
  }, React.createElement(Icon, {
    name: "target"
  })), impact === enemy.id && React.createElement("b", {
    className: "damage-flash"
  }, "HIT!")))), React.createElement("div", {
    className: "player-line"
  }, team.map(fighter => React.createElement("div", {
    className: `arena-hero ${fighter.hp <= 0 ? "defeated" : ""}`,
    key: fighter.name
  }, React.createElement(Sprite, {
    fighter: fighter,
    action: activeAction === "burst" || fighter.name === actor ? activeAction : null,
    combat: true
  }), React.createElement("span", null, fighter.name)))), React.createElement("div", {
    className: "message-strip"
  }, React.createElement("span", null, busy ? "RESOLVING" : "YOUR MOVE"), React.createElement("p", null, message))), React.createElement("div", {
    className: "action-dock"
  }, React.createElement("div", {
    className: "energy-readout"
  }, React.createElement("span", null, "ENERGY"), React.createElement("div", null, [0, 1, 2].map(pip => React.createElement("i", {
    key: pip,
    className: pip < energy ? "full" : ""
  })))), React.createElement("div", {
    className: "actions"
  }, team.map(f => {
    const id = loadout[f.name],
      pin = psychs[id];
    return React.createElement("button", {
      key: f.name,
      disabled: busy || f.hp <= 0 || energy < pin.cost,
      onClick: () => {
        setActor(f.name);
        if (pin.kind === "heal") heal(Math.max(1, Math.round(f.mag * pin.power / 50 * (team.some(ally => psychs[loadout[ally.name]].psych.startsWith("Cure Boost")) ? 1.3 : 1))), pin.cost);else if (pin.kind === "guard" || pin.kind === "support") {
          setEnergy(v => v - pin.cost);
          if (pin.kind === "support") {
            if (/Turbo|Supply/.test(pin.psych)) setEnergy(v => Math.min(3, v + 2));else if (/Cure Boost|Subconscious|Life/.test(pin.psych)) setTeam(old => old.map(ally => ({
              ...ally,
              hp: Math.min(ally.maxHp, ally.hp + Math.ceil(f.mag / 2))
            })));else setGroove(v => Math.min(100, v + 18));
          }
          guard();
        } else {
          const slash = pin.kind === "physical";
          dealDamage(Math.round((slash ? f.atk : f.mag) * (0.7 + pin.power / 100)), pin.name, pin.cost, 18, slash ? "shockwave" : "pyro", pin.drain);
        }
      }
    }, React.createElement("span", {
      className: "action-icon pin-badge"
    }, React.createElement(PinIcon, {
      pin: pin
    })), React.createElement("b", null, pin.name), React.createElement("small", null, f.name, " \xB7 ", pin.cost, " EN"));
  }), React.createElement("button", {
    disabled: busy,
    onClick: guard
  }, React.createElement("span", {
    className: "action-icon gray"
  }, React.createElement(Icon, {
    name: "guard"
  })), React.createElement("b", null, "DEFEND"), React.createElement("small", null, "BLOCK + CHARGE"))))), React.createElement("aside", {
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
  }, React.createElement("small", null, "REAPER TIP"), React.createElement("p", null, "Build Groove by landing attacks. At 100%, unleash a Sync Burst."), React.createElement("a", {
    href: "https://twewy.fandom.com/wiki/TWEWY/Pin_List",
    target: "_blank",
    rel: "noreferrer"
  }, "PIN DATABASE \u2197")))), loot.length > 0 && React.createElement("p", {
    role: "status"
  }, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), reward && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal reward-modal"
  }, React.createElement("small", null, "WAVE ", String(wave).padStart(2, "0"), " COMPLETE"), React.createElement("h2", null, "CHOOSE YOUR DROP"), React.createElement("p", null, "+5 pi\xE8ces \xB7 +1 XP par personnage. Un niveau tous les 3 XP."), loot.length > 0 && React.createElement("p", null, "Psychs r\xE9cup\xE9r\xE9s \xB7 ", loot.join(", ")), React.createElement("div", {
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
  }), React.createElement("b", null, "FULL CHARGE"), React.createElement("span", null, "Restore HP & Energy"))))), teamDefeated && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal game-over"
  }, React.createElement("small", null, "RUN TERMINATED"), React.createElement("h2", null, "ERASED"), React.createElement("p", null, "You reached wave ", wave, ". The streets will remember your score."), React.createElement("button", {
    onClick: retry
  }, "RESTART RUN"), React.createElement("button", {
    onClick: leave
  }, "Changer de duo"))));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
