const {
  useEffect,
  useMemo,
  useState
} = React;
const nekuSprite = "./assets/game/neku-idle.png";
const beatSprite = "./assets/game/beat-idle.png";
const shikiSprite = "./assets/game/shiki-idle.png";
const joshuaSprite = "./assets/game/joshua-idle.png";
const frogSprite = "./assets/game/frog-idle.png";
const wolfSprite = "./assets/game/wolf-idle.png";
const shinigamiSprite = "./assets/game/shinigami-idle.png";
const jeyPengiSprite = "./assets/game/jey-pengi-idle.png";
const electroPengiSprite = "./assets/game/electro-pengi-idle.png";
const psycheFoxSprite = "./assets/game/psyche-fox-idle.png";
const nekuAttackSprite = "./assets/game/neku-attack.png";
const beatAttackSprite = "./assets/game/beat-attack.png";
const fierySpiritPin = "./assets/game/pin-fiery-spirit.png";
const masamunePin = "./assets/game/pin-masamune.png";
const konohanaPin = "./assets/game/pin-konohana.png";
const battleBackground = "./assets/game/battle-bg.jpg";
const initialTeam = [{
  name: "NEKU",
  role: "PSYCH USER",
  hp: 118,
  maxHp: 118,
  sprite: nekuSprite,
  accent: "#ff5f29",
  frames: 6,
  frameWidth: 46,
  frameHeight: 92
}, {
  name: "BEAT",
  role: "BRAWLER",
  hp: 142,
  maxHp: 142,
  sprite: beatSprite,
  accent: "#f8d742",
  frames: 6,
  frameWidth: 71,
  frameHeight: 92
}, {
  name: "SHIKI",
  role: "THREAD USER",
  hp: 108,
  maxHp: 108,
  sprite: shikiSprite,
  accent: "#ff70ae",
  frames: 3,
  frameWidth: 32,
  frameHeight: 92
}, {
  name: "JOSHUA",
  role: "ANGEL USER",
  hp: 96,
  maxHp: 96,
  sprite: joshuaSprite,
  accent: "#92dcce",
  frames: 10,
  frameWidth: 48,
  frameHeight: 92
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
    sprite: frogSprite,
    frames: 4,
    hp: 50,
    attack: 10
  },
  wolf: {
    name: "GARAGE WOLF",
    sprite: wolfSprite,
    frames: 4,
    hp: 72,
    attack: 15
  },
  shinigami: {
    name: "SHINIGAMI",
    sprite: shinigamiSprite,
    frames: 5,
    hp: 92,
    attack: 17
  },
  "jey-pengi": {
    name: "JEY PENGI",
    sprite: jeyPengiSprite,
    frames: 5,
    hp: 64,
    attack: 12
  },
  "electro-pengi": {
    name: "ELECTRO PENGI",
    sprite: electroPengiSprite,
    frames: 5,
    hp: 82,
    attack: 16
  },
  "psyche-fox": {
    name: "PSYCHE FOX",
    sprite: psycheFoxSprite,
    frames: 5,
    hp: 126,
    attack: 21
  }
};
const enemyKinds = ["frog", "wolf", "jey-pengi", "electro-pengi", "shinigami", "psyche-fox"];
const isBossWave = wave => wave % 5 === 0;
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
  const isAttacking = combat && (fighter.name === "NEKU" && ["pyro", "shockwave", "heal", "burst"].includes(action ?? "") || fighter.name === "BEAT" && ["shockwave", "burst"].includes(action ?? ""));
  const sprite = isAttacking ? fighter.name === "NEKU" ? nekuAttackSprite : beatAttackSprite : fighter.sprite;
  return React.createElement("div", {
    className: `pixel-sprite hero-sprite ${fighter.frames && !isAttacking ? `character-idle-${fighter.frames}` : ""} ${isAttacking ? "attack-sprite" : ""}`,
    style: {
      backgroundImage: `url(${sprite})`,
      ...(fighter.frames ? {
        backgroundSize: `${fighter.frames * 100}% 100%`
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
function App() {
  const [wave, setWave] = useState(1);
  const [team, setTeam] = useState(initialTeam);
  const [enemies, setEnemies] = useState(() => makeWave(1));
  const [selected, setSelected] = useState(10);
  const [energy, setEnergy] = useState(3);
  const [groove, setGroove] = useState(28);
  const [coins, setCoins] = useState(180);
  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Noise detected. Choose your move.");
  const [busy, setBusy] = useState(false);
  const [impact, setImpact] = useState(null);
  const [reward, setReward] = useState(false);
  const [summon, setSummon] = useState(false);
  const [summonResult, setSummonResult] = useState(null);
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
    const attackers = updatedEnemies.filter(enemy => enemy.hp > 0);
    if (!attackers.length) {
      setTimeout(() => {
        setCoins(value => value + 45 + wave * 10);
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
      const damage = Math.max(3, Math.round(attacker.attack * (wasGuarded ? 0.45 : 1)));
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
  const dealDamage = (amount, label, cost, grooveGain, action) => {
    if (busy || reward || energy < cost) return;
    const target = livingEnemies.find(enemy => enemy.id === selected);
    if (!target) return;
    setBusy(true);
    setActiveAction(action);
    setEnergy(value => value - cost);
    const variance = Math.floor(Math.random() * 7) - 3;
    const damage = Math.max(1, amount + variance);
    const updated = enemies.map(enemy => enemy.id === selected ? {
      ...enemy,
      hp: Math.max(0, enemy.hp - damage)
    } : enemy);
    setEnemies(updated);
    setImpact(selected);
    setGroove(value => Math.min(100, value + grooveGain));
    setMessage(`${label} hits ${target.name} for ${damage}!`);
    setTimeout(() => setImpact(null), 380);
    enemyTurn(updated);
  };
  const heal = () => {
    if (busy || energy < 2) return;
    setBusy(true);
    setActiveAction("heal");
    setEnergy(value => value - 2);
    setTeam(current => current.map(fighter => ({
      ...fighter,
      hp: Math.min(fighter.maxHp, fighter.hp + 30)
    })));
    setMessage("Konohana activates Cure Drink. Team restored by 30 HP.");
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
    setWave(next);
    setTurn(1);
    setEnemies(makeWave(next));
    setSelected(next * 10);
    setReward(false);
    setMessage(isBossWave(next) ? `Wave ${next}. A boss Noise is closing in.` : `Wave ${next}. New Noise closing in.`);
  };
  const pull = () => {
    if (coins < 100) return;
    setCoins(value => value - 100);
    const result = Math.random() > 0.7 ? "RARE PIN: BLACK METEOR" : "PIN: SHOCKWAVE";
    setSummonResult(result);
    if (result.startsWith("RARE")) setGroove(100);else setEnergy(3);
  };
  const teamDefeated = team.every(fighter => fighter.hp <= 0);
  const routeStart = Math.floor((wave - 1) / 5) * 5 + 1;
  const sector = Math.floor((wave - 1) / 5) + 1;
  const retry = () => {
    setWave(1);
    setTurn(1);
    setTeam(initialTeam);
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
  }), " SCORE ", React.createElement("b", null, String((wave - 1) * 2350).padStart(6, "0"))), React.createElement("button", {
    className: "currency",
    onClick: () => {
      setSummon(true);
      setSummonResult(null);
    }
  }, React.createElement(Icon, {
    name: "coin"
  }), " ", coins, " ", React.createElement("small", null, "SUMMON")), React.createElement("button", {
    className: "sound-button",
    "aria-label": "Sound settings"
  }, React.createElement("i", null), React.createElement("i", null), React.createElement("i", null)))), React.createElement("section", {
    className: "game-grid"
  }, React.createElement("aside", {
    className: "squad-panel"
  }, React.createElement("div", {
    className: "section-label"
  }, React.createElement("span", null, "PLAYER SQUAD"), React.createElement("b", null, "04 / 04")), team.map((fighter, index) => React.createElement("article", {
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
    className: "enemy-line"
  }, enemies.map(enemy => React.createElement("button", {
    key: enemy.id,
    className: `enemy-unit ${selected === enemy.id ? "selected" : ""} ${enemy.hp <= 0 ? "defeated" : ""} ${impact === enemy.id ? "hit" : ""}`,
    onClick: () => enemy.hp > 0 && setSelected(enemy.id),
    "aria-label": `Target ${enemy.name}`
  }, React.createElement("div", {
    className: `pixel-sprite enemy-sprite ${enemy.kind}-sprite ${enemy.boss ? "boss-noise" : ""}`,
    style: {
      backgroundImage: `url(${enemyCatalog[enemy.kind].sprite})`,
      backgroundSize: `${enemyCatalog[enemy.kind].frames * 100}% 100%`
    }
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
    action: activeAction,
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
  }, React.createElement("button", {
    disabled: busy || energy < 1,
    onClick: () => dealDamage(24, "FIERY SPIRIT", 1, 18, "pyro"),
    title: "Fiery Spirit, Spirited Fire (#155) \u2014 Pyrokinesis"
  }, React.createElement("span", {
    className: "action-icon pin-badge"
  }, React.createElement("img", {
    src: fierySpiritPin,
    alt: "Fiery Spirit pin"
  })), React.createElement("b", null, "FIERY SPIRIT"), React.createElement("small", null, "PYROKINESIS \xB7 1 EN")), React.createElement("button", {
    disabled: busy || energy < 2,
    onClick: () => dealDamage(44, "MASAMUNE", 2, 28, "shockwave"),
    title: "Masamune (#081) \u2014 Shockwave"
  }, React.createElement("span", {
    className: "action-icon pin-badge"
  }, React.createElement("img", {
    src: masamunePin,
    alt: "Masamune pin"
  })), React.createElement("b", null, "MASAMUNE"), React.createElement("small", null, "SHOCKWAVE \xB7 2 EN")), React.createElement("button", {
    disabled: busy || energy < 2,
    onClick: heal,
    title: "Konohana (#101) \u2014 Cure Drink"
  }, React.createElement("span", {
    className: "action-icon pin-badge"
  }, React.createElement("img", {
    src: konohanaPin,
    alt: "Konohana pin"
  })), React.createElement("b", null, "KONOHANA"), React.createElement("small", null, "CURE DRINK \xB7 2 EN")), React.createElement("button", {
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
  }, "PIN DATABASE \u2197")))), reward && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal reward-modal"
  }, React.createElement("small", null, "WAVE ", String(wave).padStart(2, "0"), " COMPLETE"), React.createElement("h2", null, "CHOOSE YOUR DROP"), React.createElement("p", null, "Pick one upgrade for the rest of this run."), React.createElement("div", {
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
  }), React.createElement("b", null, "FULL CHARGE"), React.createElement("span", null, "Restore HP & Energy"))))), summon && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal summon-modal"
  }, React.createElement("button", {
    className: "close",
    onClick: () => setSummon(false)
  }, "\xD7"), React.createElement("small", null, "UNDERGROUND GACHA"), React.createElement("h2", null, "PIN DROP"), React.createElement("div", {
    className: `pin-orb ${summonResult ? "revealed" : ""}`
  }, React.createElement(Icon, {
    name: summonResult?.startsWith("RARE") ? "star" : "bolt"
  })), summonResult ? React.createElement(React.Fragment, null, React.createElement("strong", null, summonResult), React.createElement("p", null, summonResult.startsWith("RARE") ? "Groove instantly charged to 100%." : "Energy restored to maximum.")) : React.createElement("p", null, "Spend 100\xA5 for a random combat pin."), React.createElement("button", {
    className: "pull-button",
    onClick: pull,
    disabled: coins < 100
  }, React.createElement(Icon, {
    name: "coin"
  }), " ", summonResult ? "PULL AGAIN · 100" : "SUMMON · 100"))), teamDefeated && React.createElement("div", {
    className: "overlay"
  }, React.createElement("div", {
    className: "modal game-over"
  }, React.createElement("small", null, "RUN TERMINATED"), React.createElement("h2", null, "ERASED"), React.createElement("p", null, "You reached wave ", wave, ". The streets will remember your score."), React.createElement("button", {
    onClick: retry
  }, "RESTART RUN"))));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
