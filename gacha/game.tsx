const { useEffect, useMemo, useState } = React;
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

type EnemyKind = "frog" | "wolf" | "shinigami" | "jey-pengi" | "electro-pengi" | "psyche-fox";

type Enemy = {
  id: number;
  name: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  attack: number;
  boss: boolean;
};

type Fighter = {
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  sprite: string;
  accent: string;
  frames?: number;
  frameWidth?: number;
  frameHeight?: number;
  attackSprite?: string;
  attackFrames?: number;
};

const characterRoster: Fighter[] = [
  { name: "NEKU", role: "PSYCH USER", hp: 118, maxHp: 118, sprite: nekuSprite, accent: "#ff5f29", frames: 6, frameWidth: 80, frameHeight: 116, attackSprite: nekuAttackSprite, attackFrames: 7 },
  { name: "BEAT", role: "BRAWLER", hp: 142, maxHp: 142, sprite: beatSprite, accent: "#f8d742", frames: 6, frameWidth: 80, frameHeight: 116, attackSprite: beatAttackSprite, attackFrames: 5 },
  { name: "SHIKI", role: "THREAD USER", hp: 108, maxHp: 108, sprite: shikiSprite, accent: "#ff70ae", frames: 3, frameWidth: 80, frameHeight: 116, attackSprite: shikiAttackSprite, attackFrames: 7 },
  { name: "JOSHUA", role: "ANGEL USER", hp: 96, maxHp: 96, sprite: joshuaSprite, accent: "#92dcce", frames: 10, frameWidth: 80, frameHeight: 116 },
];


const Icon = ({ name }: { name: "bolt" | "target" | "heart" | "guard" | "coin" | "star" }) => {
  const paths = {
    bolt: <path d="m13 2-8 11h6l-1 9 8-12h-6l1-8Z" />,
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    guard: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.7-.7-1.6-1-3-1-1.7 0-3 .8-3 2s1 1.8 3 2.2 3 1 3 2.3-1.3 2.5-3 2.5c-1.4 0-2.5-.4-3.2-1.2M12 5v14" />
      </>
    ),
    star: (
      <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

const enemyCatalog: Record<EnemyKind, { name: string; frames: number; frameWidth: number; frameHeight: number; hp: number; attack: number }> = {
  frog: { name: "BIG BANG FROG", frames: 4, frameWidth: 68, frameHeight: 72, hp: 50, attack: 10 },
  wolf: { name: "GARAGE WOLF", frames: 4, frameWidth: 82, frameHeight: 78, hp: 72, attack: 15 },
  shinigami: { name: "SHINIGAMI", frames: 5, frameWidth: 46, frameHeight: 76, hp: 92, attack: 17 },
  "jey-pengi": { name: "JEY PENGI", frames: 14, frameWidth: 42, frameHeight: 65, hp: 64, attack: 12 },
  "electro-pengi": { name: "ELECTRO PENGI", frames: 14, frameWidth: 42, frameHeight: 65, hp: 82, attack: 16 },
  "psyche-fox": { name: "PSYCHE FOX", frames: 6, frameWidth: 169, frameHeight: 205, hp: 126, attack: 21 },
};
const enemyKinds: EnemyKind[] = ["frog", "wolf", "jey-pengi", "electro-pengi", "shinigami", "psyche-fox"];
const isBossWave = (wave: number) => wave % 5 === 0;

function EnemySprite({ kind, boss }: { kind: EnemyKind; boss: boolean }) {
  const spec = enemyCatalog[kind];
  const [frame, setFrame] = useState(0);
  const displayFrameWidth = (92 * spec.frameWidth) / spec.frameHeight;

  useEffect(() => {
    setFrame(0);
    if (spec.frames < 2) return;
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % spec.frames);
    }, 1000 / spec.frames);
    return () => window.clearInterval(timer);
  }, [kind, spec.frames]);

  return (
    <img
      className={`pixel-sprite enemy-sprite ${boss ? "boss-noise" : ""}`}
      src={`./assets/game/enemy-frames/${kind}-${frame}.png`}
      alt=""
      draggable={false}
      style={{
        width: `${displayFrameWidth}px`,
        height: "92px",
      }}
    />
  );
}

const makeWave = (wave: number): Enemy[] => {
  const bossWave = isBossWave(wave);
  const count = bossWave ? 2 + Math.min(1, Math.floor(wave / 25)) : Math.min(2 + Math.floor((wave - 1) / 2), 4);
  const growth = 1 + (wave - 1) * 0.08;
  return Array.from({ length: count }, (_, index) => {
    const boss = bossWave && index === 0;
    const kind: EnemyKind = boss
      ? Math.floor(wave / 5) % 2 === 0 ? "psyche-fox" : "shinigami"
      : enemyKinds[(wave * 3 + index * 2 + Math.floor(wave / 5)) % enemyKinds.length];
    const template = enemyCatalog[kind];
    const maxHp = Math.round(template.hp * growth * (boss ? 2.5 : 1));
    return {
      id: wave * 10 + index,
      name: boss ? `${template.name} // BOSS` : template.name,
      kind,
      hp: maxHp,
      maxHp,
      attack: Math.round(template.attack * growth * (boss ? 1.55 : 1)),
      boss,
    };
  });
};

type Action = "pyro" | "shockwave" | "heal" | "guard" | "burst" | null;

function Sprite({
  fighter,
  action = null,
  combat = false,
}: {
  fighter: Fighter;
  action?: Action;
  combat?: boolean;
}) {
  const isAttacking = combat && !!fighter.attackSprite && ["pyro", "shockwave", "burst"].includes(action ?? "");
  const sprite = isAttacking && fighter.attackSprite ? fighter.attackSprite : fighter.sprite;
  const frameCount = isAttacking ? fighter.attackFrames : fighter.frames;

  return (
    <div
      className={`pixel-sprite hero-sprite ${frameCount ? `sprite-frames-${frameCount}` : ""} ${isAttacking ? "attack-sprite" : ""}`}
      style={{
        backgroundImage: `url(${sprite})`,
        ...(frameCount ? { backgroundSize: `${frameCount * 100}% 100%` } : {}),
        ...(fighter.frameWidth ? { width: `${fighter.frameWidth}px`, height: `${fighter.frameHeight}px` } : {}),
      }}
      role="img"
      aria-label={fighter.name}
    />
  );
}

const psychs = {
  pyro: { name: "Fiery Spirit", image: fierySpiritPin, cost: 1 },
  shockwave: { name: "Masamune", image: masamunePin, cost: 2 },
  heal: { name: "Konohana", image: konohanaPin, cost: 2 },
};
type Psych = keyof typeof psychs;
const gachaView = new URLSearchParams(location.search).get("vue") === "gacha";
type Profile = { owned: string[]; equipped: string[]; loadout: Record<string, Psych>; coins: number };
const profileKey = "chibi.reapers-run.party.v1";

function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
    const owned = characterRoster.map(f => f.name).filter(name => saved.owned.includes(name));
    const equipped = [...new Set<string>(saved.equipped)].filter(name => owned.includes(name)).slice(0, 2);
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return { owned, equipped, loadout: Object.fromEntries(Object.entries(saved.loadout || {}).filter(([, id]) => Object.hasOwn(psychs, String(id)))), coins: saved.coins };
  } catch {}
  return { owned: [], equipped: [], loadout: {}, coins: 180 };
}

function App() {
  const [profile, displayProfile] = useState(loadProfile);
  const [party, setParty] = useState<Fighter[] | null>(null);
  const [result, setResult] = useState("");
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === profileKey) displayProfile(loadProfile());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setProfile = (update: (old: Profile) => Profile) => {
    let next = update(profile);
    try {
      next = update(localStorage.getItem(profileKey) ? loadProfile() : profile);
      localStorage.setItem(profileKey, JSON.stringify(next));
      setSaveError(false);
    } catch { setSaveError(true); }
    displayProfile(next);
  };

  const missing = characterRoster.filter(f => !profile.owned.includes(f.name));
  const price = profile.owned.length < 2 ? 0 : 100;
  const recruit = () => {
    if (!missing.length || profile.coins < price) return;
    const recruit = missing[Math.floor(Math.random() * missing.length)];
    setProfile(p => p.owned.includes(recruit.name) || p.coins < price ? p : ({ ...p, coins: p.coins - price, owned: [...p.owned, recruit.name] }));
    setResult(recruit.name);
  };
  const equip = (name: string) => {
    const selected = profile.equipped.includes(name);
    if (!profile.owned.includes(name) || (!selected && profile.equipped.length >= 2)) return;
    setProfile(p => ({ ...p, equipped: selected ? p.equipped.filter(n => n !== name) : [...p.equipped, name].slice(0, 2) }));
  };
  if (party) return <Battle initialTeam={party} loadout={profile.loadout} coins={profile.coins}
    setCoins={(update) => setProfile(p => ({ ...p, coins: update(p.coins) }))}
    leave={() => { setParty(null); setResult(""); }} />;
  if (gachaView) return <main className="game-shell party-lobby"><section>
    <h2>Gacha personnages</h2>
    <p>{profile.coins} pièces · {profile.owned.length} / {characterRoster.length} personnages débloqués</p>
    {missing.length > 0 && <><p>Tire un personnage parmi ceux qui te manquent. Les deux premiers tirages sont gratuits.</p>
      <button className="pull-button" disabled={profile.coins < price} onClick={recruit}>
        {price === 0 ? "Tirage gratuit" : "Tirer · 100 pièces"}</button></>}
    <div aria-live="polite">{result && <div key={result} className="recruit-reveal">
      <Sprite fighter={characterRoster.find(f => f.name === result)!}/><strong>{result}</strong><span>Recrue débloquée</span>
    </div>}</div>
    {saveError && <p role="alert">Sauvegarde locale indisponible.</p>}
  </section></main>;
  return <main className="game-shell party-lobby"><section><h1>Préparer le duo</h1>
    {profile.owned.length < 2 && <p>Débloque deux personnages dans <a href="../app.html#gacha" target="_top">l’onglet Gacha</a>.</p>}
    <h2>Ton duo · {profile.equipped.length} / 2</h2>
    <div className="party-list">{characterRoster.map(f => {
      const owned = profile.owned.includes(f.name), selected = profile.equipped.includes(f.name);
      return <button key={f.name} aria-pressed={selected} onClick={() => equip(f.name)}
        disabled={!owned || (!selected && profile.equipped.length === 2)}>
        <Sprite fighter={f}/><strong>{f.name}</strong>
        <span>{selected ? "Équipé · Retirer" : owned ? "Équiper" : "À débloquer"}</span>
      </button>;
    })}</div>
    {profile.equipped.map(name => <label className="psych-choice" key={name}>Psych de {name}
      <select value={profile.loadout[name] || ""} onChange={e => {
        const psych = e.target.value as Psych;
        setProfile(p => ({ ...p, loadout: { ...p.loadout, [name]: psych } }));
      }}><option value="" disabled>Choisir un psych</option>
        {Object.entries(psychs).map(([id, item]) => <option key={id} value={id}>{item.name} · {item.cost} EN</option>)}
      </select></label>)}
    {profile.equipped.length === 2 && profile.equipped.every(n => profile.loadout[n] === "heal") && <p>Équipe au moins un psych offensif.</p>}
    <button className="pull-button" disabled={profile.equipped.length !== 2 || !profile.equipped.every(n => profile.loadout[n]) || profile.equipped.every(n => profile.loadout[n] === "heal")}
      onClick={() => setParty(profile.equipped.map(name => characterRoster.find(f => f.name === name)!))}>Lancer le roguelike</button>
    {saveError && <p role="alert">La sauvegarde locale est indisponible dans ce navigateur.</p>}
  </section></main>;
}

function Battle({ initialTeam, loadout, coins, setCoins, leave }: { initialTeam: Fighter[]; loadout: Record<string, Psych>; coins: number; setCoins: (update: (n: number) => number) => void; leave: () => void }) {
  const [wave, setWave] = useState(1);
  const [team, setTeam] = useState(initialTeam);
  const [enemies, setEnemies] = useState(() => makeWave(1));
  const [selected, setSelected] = useState(10);
  const [energy, setEnergy] = useState(3);
  const [groove, setGroove] = useState(28);

  const [turn, setTurn] = useState(1);
  const [message, setMessage] = useState("Noise detected. Choose your move.");
  const [busy, setBusy] = useState(false);
  const [impact, setImpact] = useState<number | null>(null);
  const [reward, setReward] = useState(false);
  const [actor, setActor] = useState("");
  const [guarded, setGuarded] = useState(false);
  const [activeAction, setActiveAction] = useState<Action>(null);

  const livingEnemies = enemies.filter((enemy) => enemy.hp > 0);
  const totalEnemyHp = livingEnemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  const threat = useMemo(() => {
    if (totalEnemyHp > 190) return "HIGH";
    if (totalEnemyHp > 80) return "MED";
    return "LOW";
  }, [totalEnemyHp]);

  useEffect(() => {
    if (!livingEnemies.some((enemy) => enemy.id === selected) && livingEnemies[0]) {
      setSelected(livingEnemies[0].id);
    }
  }, [enemies, livingEnemies, selected]);

  const enemyTurn = (updatedEnemies: Enemy[], wasGuarded = guarded) => {
    const attackers = updatedEnemies.filter((enemy) => enemy.hp > 0);
    if (!attackers.length) {
      setTimeout(() => {
        setCoins((value) => value + 45 + wave * 10);
        setReward(true);
        setBusy(false);
        setActiveAction(null);
        setMessage("Wave cleared. Your drop is ready.");
      }, 500);
      return;
    }
    setTimeout(() => {
      const attacker = attackers[Math.floor(Math.random() * attackers.length)];
      const livingFighters = team.map((fighter, index) => ({ fighter, index })).filter(({ fighter }) => fighter.hp > 0);
      if (!livingFighters.length) {
        setBusy(false);
        return;
      }
      const target = livingFighters[Math.floor(Math.random() * livingFighters.length)];
      const damage = Math.max(3, Math.round(attacker.attack * (wasGuarded ? 0.45 : 1)));
      setTeam((current) =>
        current.map((fighter, index) =>
          index === target.index ? { ...fighter, hp: Math.max(0, fighter.hp - damage) } : fighter,
        ),
      );
      setMessage(`${attacker.name} strikes ${target.fighter.name} for ${damage}.`);
      setEnergy((value) => Math.min(3, value + 1));
      setGroove((value) => Math.min(100, value + 12));
      setTurn((value) => value + 1);
      setGuarded(false);
      setActiveAction(null);
      setBusy(false);
    }, 650);
  };

  const dealDamage = (
    amount: number,
    label: string,
    cost: number,
    grooveGain: number,
    action: Action,
  ) => {
    if (busy || reward || energy < cost) return;
    const target = livingEnemies.find((enemy) => enemy.id === selected);
    if (!target) return;
    setBusy(true);
    setActiveAction(action);
    setEnergy((value) => value - cost);
    const variance = Math.floor(Math.random() * 7) - 3;
    const damage = Math.max(1, amount + variance);
    const updated = enemies.map((enemy) =>
      enemy.id === selected ? { ...enemy, hp: Math.max(0, enemy.hp - damage) } : enemy,
    );
    setEnemies(updated);
    setImpact(selected);
    setGroove((value) => Math.min(100, value + grooveGain));
    setMessage(`${label} hits ${target.name} for ${damage}!`);
    setTimeout(() => setImpact(null), 380);
    enemyTurn(updated);
  };

  const heal = () => {
    if (busy || energy < 2) return;
    setBusy(true);
    setActiveAction("heal");
    setEnergy((value) => value - 2);
    setTeam((current) =>
      current.map((fighter) => ({ ...fighter, hp: Math.min(fighter.maxHp, fighter.hp + 30) })),
    );
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
    const updated = enemies.map((enemy) => ({ ...enemy, hp: Math.max(0, enemy.hp - 58) }));
    setEnemies(updated);
    setMessage("SYNC BURST! Every Noise takes 58 damage.");
    enemyTurn(updated);
  };

  const nextWave = (boost: "power" | "vitality" | "energy") => {
    if (boost === "vitality") {
      setTeam((current) =>
        current.map((fighter) => ({
          ...fighter,
          maxHp: fighter.maxHp + 18,
          hp: fighter.maxHp + 18,
        })),
      );
    } else if (boost === "power") {
      setGroove((value) => Math.min(100, value + 35));
      setTeam((current) => current.map((fighter) => ({ ...fighter, hp: fighter.maxHp })));
    } else {
      setEnergy(3);
      setTeam((current) => current.map((fighter) => ({ ...fighter, hp: fighter.maxHp })));
    }
    const next = wave + 1;
    setWave(next);
    setTurn(1);
    setEnemies(makeWave(next));
    setSelected(next * 10);
    setReward(false);
    setMessage(isBossWave(next) ? `Wave ${next}. A boss Noise is closing in.` : `Wave ${next}. New Noise closing in.`);
  };

  const teamDefeated = team.every((fighter) => fighter.hp <= 0);
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

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">R</div>
          <div>
            <strong>REAPER'S RUN</strong>
            <span>SHIBUYA / DAY 01</span>
          </div>
        </div>
        <div className="run-stats">
          <span>
            <Icon name="star" /> SCORE <b>{String((wave - 1) * 2350).padStart(6, "0")}</b>
          </span>
          <span className="currency"><Icon name="coin" /> {coins}</span>
          <button className="currency" disabled={busy} onClick={() => { if (window.confirm("Quitter cette partie et revenir au duo ?")) leave(); }}>Mon duo</button>
          <button className="sound-button" aria-label="Sound settings">
            <i />
            <i />
            <i />
          </button>
        </div>
      </header>

      <section className="game-grid">
        <aside className="squad-panel">
          <div className="section-label">
            <span>PLAYER SQUAD</span>
            <b>{String(team.length).padStart(2, "0")} / 02</b>
          </div>
          {team.map((fighter, index) => (
            <article className={`fighter-card ${fighter.hp <= 0 ? "down" : ""}`} key={fighter.name}>
              <div
                className="portrait"
                style={{ "--accent": fighter.accent } as React.CSSProperties}
              >
                <Sprite fighter={fighter} />
                <span>0{index + 1}</span>
              </div>
              <div className="fighter-info">
                <small>{fighter.role}</small>
                <h2>{fighter.name}</h2>
                <div className="health-readout">
                  <span>HP</span>
                  <b>{fighter.hp}</b>
                  <em>/ {fighter.maxHp}</em>
                </div>
                <div className="bar">
                  <i style={{ width: `${(fighter.hp / fighter.maxHp) * 100}%` }} />
                </div>
              </div>
            </article>
          ))}
          <div className="groove-card">
            <div>
              <span>TEAM GROOVE</span>
              <b>{groove}%</b>
            </div>
            <div className="groove-bar">
              <i style={{ width: `${groove}%` }} />
            </div>
            <button disabled={groove < 100 || busy} onClick={unleash}>
              <Icon name="bolt" /> SYNC BURST
            </button>
          </div>
        </aside>

        <section className="battle-column">
          <div className="battle-heading">
            <div>
              <small>ENCOUNTER</small>
              <h1>WAVE {String(wave).padStart(2, "0")}</h1>
            </div>
            <div className={`threat threat-${threat.toLowerCase()}`}>
              <span>THREAT</span>
              <b>{threat}</b>
            </div>
          </div>

          <div
            className="arena"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(15,20,21,.04), rgba(9,12,13,.42)), url(${battleBackground})`,
            }}
          >
            <div className="turn-badge">TURN {String(turn).padStart(2, "0")}</div>
            <div className={`enemy-line enemies-count-${enemies.length}`}>
              {enemies.map((enemy) => (
                <button
                  key={enemy.id}
                  className={`enemy-unit ${selected === enemy.id ? "selected" : ""} ${enemy.hp <= 0 ? "defeated" : ""} ${impact === enemy.id ? "hit" : ""}`}
                  onClick={() => enemy.hp > 0 && setSelected(enemy.id)}
                  aria-label={`Target ${enemy.name}`}
                >
                  <EnemySprite kind={enemy.kind} boss={enemy.boss} />
                  <div className="enemy-tag">
                    <strong>{enemy.name}</strong>
                    <span>
                      {enemy.hp} / {enemy.maxHp}
                    </span>
                    <div>
                      <i style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
                    </div>
                  </div>
                  {selected === enemy.id && enemy.hp > 0 && (
                    <span className="target-reticle">
                      <Icon name="target" />
                    </span>
                  )}
                  {impact === enemy.id && <b className="damage-flash">HIT!</b>}
                </button>
              ))}
            </div>
            <div className="player-line">
              {team.map((fighter) => (
                <div
                  className={`arena-hero ${fighter.hp <= 0 ? "defeated" : ""}`}
                  key={fighter.name}
                >
                  <Sprite fighter={fighter} action={activeAction === "burst" || fighter.name === actor ? activeAction : null} combat />
                  <span>{fighter.name}</span>
                </div>
              ))}
            </div>
            <div className="message-strip">
              <span>{busy ? "RESOLVING" : "YOUR MOVE"}</span>
              <p>{message}</p>
            </div>
          </div>

          <div className="action-dock">
            <div className="energy-readout">
              <span>ENERGY</span>
              <div>
                {[0, 1, 2].map((pip) => (
                  <i key={pip} className={pip < energy ? "full" : ""} />
                ))}
              </div>
            </div>
            <div className="actions">
              {team.map(f => {
                const id = loadout[f.name], pin = psychs[id];
                return <button key={f.name} disabled={busy || f.hp <= 0 || energy < pin.cost} onClick={() => {
                  setActor(f.name);
                  if (id === "heal") heal();
                  else dealDamage(id === "pyro" ? 24 : 44, pin.name, pin.cost, id === "pyro" ? 18 : 28, id);
                }}>
                  <span className="action-icon pin-badge"><img src={pin.image} alt="" /></span>
                  <b>{pin.name}</b><small>{f.name} · {pin.cost} EN</small>
                </button>;
              })}
              <button disabled={busy} onClick={guard}>
                <span className="action-icon gray">
                  <Icon name="guard" />
                </span>
                <b>DEFEND</b>
                <small>BLOCK + CHARGE</small>
              </button>
            </div>
          </div>
        </section>

        <aside className="route-panel">
          <div className="section-label">
            <span>RUN PROGRESS</span>
            <b>SECTOR {String(sector).padStart(2, "0")}</b>
          </div>
          <div className="route">
            {Array.from({ length: 5 }, (_, index) => routeStart + index).map((node) => (
              <div className={node < wave ? "complete" : node === wave ? "current" : ""} key={node}>
                <span>{node < wave ? "✓" : String(node).padStart(2, "0")}</span>
                <p>{isBossWave(node) ? "BOSS SIGNAL" : node === wave ? "CURRENT WAVE" : "NOISE WAVE"}</p>
              </div>
            ))}
          </div>
          <div className="tip-card">
            <small>REAPER TIP</small>
            <p>Build Groove by landing attacks. At 100%, unleash a Sync Burst.</p>
            <a href="https://twewy.fandom.com/wiki/TWEWY/Pin_List" target="_blank" rel="noreferrer">
              PIN DATABASE ↗
            </a>
          </div>
        </aside>
      </section>

      {reward && (
        <div className="overlay">
          <div className="modal reward-modal">
            <small>WAVE {String(wave).padStart(2, "0")} COMPLETE</small>
            <h2>CHOOSE YOUR DROP</h2>
            <p>Pick one upgrade for the rest of this run.</p>
            <div className="reward-grid">
              <button onClick={() => nextWave("power")}>
                <Icon name="bolt" />
                <b>HOT STREAK</b>
                <span>Start with +35 Groove</span>
              </button>
              <button onClick={() => nextWave("vitality")}>
                <Icon name="heart" />
                <b>SECOND WIND</b>
                <span>Max HP +18</span>
              </button>
              <button onClick={() => nextWave("energy")}>
                <Icon name="star" />
                <b>FULL CHARGE</b>
                <span>Restore HP & Energy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {teamDefeated && (
        <div className="overlay">
          <div className="modal game-over">
            <small>RUN TERMINATED</small>
            <h2>ERASED</h2>
            <p>You reached wave {wave}. The streets will remember your score.</p>
            <button onClick={retry}>RESTART RUN</button><button onClick={leave}>Changer de duo</button>
          </div>
        </div>
      )}
    </main>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
