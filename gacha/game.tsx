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
  wins?:number; level?:number; atk?:number; mag?:number; speed?:number;
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

type Pin = { grade?:string; id:string; number:string; name:string; psych:string; kind:string; power:number; drain:boolean; row:number; col:number; cost:number };
declare const pinList: Pin[];
const basePsych:Record<string,string> = {NEKU:"pin266", SHIKI:"groove-pawn", BEAT:"sk8-combo", JOSHUA:"joshua-phone"};
const partnerPsychs:Pin[] = [
  {id:"groove-pawn",name:"Groove Pawn",psych:"Mr. Mew",kind:"special",power:22},
  {id:"sk8-combo",name:"Beat Partner Pin",psych:"SK8 Combo",kind:"physical",power:22},
  {id:"joshua-phone",name:"Joshua Partner Pin",psych:"Chute d’objets",kind:"special",power:22},
].map(pin=>({...pin,number:"",row:-1,col:0,drain:false,cost:1}));
const psychs: Record<string, Pin> = Object.fromEntries([...pinList,...partnerPsychs].map(pin => [pin.id,pin]));
type Psych = string;
const types = { physical:"ATK", special:"ATK SPE", heal:"Soin", guard:"Protection", support:"Soutien" };
function PinIcon({ pin }: {pin:Pin}) {
  if(pin.row<0) return <i aria-hidden="true" style={{display:"grid",placeItems:"center",width:28,height:28,borderRadius:"50%",background:"var(--indigo)",color:"white",fontStyle:"normal"}}>{{"groove-pawn":"♟","sk8-combo":"★","joshua-phone":"☎"}[pin.id]}</i>;
  return <i aria-hidden="true" style={{display:"inline-block",width:28,height:28,flex:"none",imageRendering:"pixelated",backgroundImage:`url(./assets/pins/row-${pin.row}.webp)`,backgroundPosition:`-${pin.col*28}px 0`}}/>;
}
const portals = { shibuya:"Shibuya", partners:"Partenaires" };
const bases = { NEKU:[24,32,14], SHIKI:[22,26,20], BEAT:[34,18,12], JOSHUA:[19,36,16] };
function trained(f:Fighter, wins:number, awake:boolean) {
  const n = Math.floor(wins/3), [atk,mag,speed] = bases[f.name];
  const maxHp = f.maxHp + n*5 + (awake ? 20 : 0);
  return {...f, wins, level:n+1, atk:atk+n*2, mag:mag+n*2, speed:speed+n, hp:maxHp, maxHp};
}
const gachaView = new URLSearchParams(location.search).get("vue") === "gacha";
const ranks = ["E", "D", "C", "B", "A", "etoile"];
function RankBadge({ level }: { level: number }) {
  return <img className="rank-badge" src={`./assets/bingo/rang-${ranks[level]}.webp`} alt={`Rang ${level === 5 ? "étoile" : ranks[level]}`} />;
}
type Wish = { pin: Pin } | { name:string; rank:number; copies:number };
function pick<T,>(items:T[]):T { return items[Math.floor(Math.random()*items.length)]; }
const offensive = (id:string) => ["physical","special"].includes(psychs[id]?.kind);
type Profile = { pins:string[]; wishStep:number; copies:Record<string,number>; wins:Record<string,number>; levels: Record<string, number>; awakened: string[]; owned: string[]; equipped: string[]; loadout: Record<string, Psych>; coins: number };
const profileKey = "chibi.reapers-run.party.v1";

function assignBasePsychs(profile:Profile):Profile {
  const pins=[...profile.pins], loadout={...profile.loadout};
  if(profile.owned.includes("NEKU") && !pins.includes(basePsych.NEKU)) pins.push(basePsych.NEKU);
  for(const name of profile.owned){
    if(!pins.includes(loadout[name]) && loadout[name]!==basePsych[name]) loadout[name]=basePsych[name];
  }
  return {...profile,pins,loadout};
}
function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
    const owned = characterRoster.map(f => f.name).filter(name => saved.owned.includes(name));
    const equipped=[0,1].map(i=>{
      const name=saved.equipped?.[i];
      return owned.includes(name) && (i===0 || name!==saved.equipped[0]) ? name : "";
    });
    const pins = [...new Set<string>(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}))].filter(id=>psychs[id]?.row>=0);
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 10 ? saved.wishStep : 0;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return assignBasePsychs({ owned, equipped, pins, wishStep,
      copies:Object.fromEntries(owned.map(n=>[n,saved.awakened?.includes(n) || saved.levels?.[n] === 5 ? 5 : Math.min(5,Math.max(0,Math.floor(Number(saved.copies?.[n])||0)))])),
      wins:Object.fromEntries(owned.map(n=>[n,Math.max(0,Math.floor(Number(saved.wins?.[n])||0))])),

      levels: Object.fromEntries(owned.map(name => [name, ranks[saved.levels?.[name]] ? Number(saved.levels[name]) : 0])),
      awakened: owned.filter(name => saved.levels?.[name] === 5 && saved.awakened?.includes(name)), loadout: Object.fromEntries(Object.entries(saved.loadout || {}).filter(([name,id])=>owned.includes(name) && (pins.includes(String(id)) || basePsych[name]===id))), coins: saved.coins });
  } catch {}
  return { pins:[], wishStep:0, copies:{}, wins:{}, levels: {}, awakened: [], owned: [], equipped: ["",""], loadout: {}, coins: 180 };
}

const characterChance = 0.10;
function portalPool(id:string, profile:Profile) {
  const roster=characterRoster.filter(f=>id!=="shibuya" || ["NEKU","SHIKI"].includes(f.name));
  const missing=roster.filter(f=>!profile.owned.includes(f.name));
  const available=roster.filter(f=>(profile.copies[f.name]||0)<5);
  const pool=missing.length ? missing : available.length ? available : roster;
  return id==="partners" ? [...pool,...pool.filter(f=>["BEAT","JOSHUA"].includes(f.name))] : pool;
}
function Capsule() {
  const canvas=React.useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const ctx=canvas.current?.getContext("2d");
    if(!ctx) return;
    const size=96, pixels=ctx.createImageData(size,size);
    for(let y=0;y<size;y++) for(let x=0;x<size;x++){
      const nx=(x+.5-size/2)/(size/2), ny=(size/2-y-.5)/(size/2);
      const radius=nx*nx+ny*ny;
      if(radius>=1) continue;
      const nz=Math.sqrt(1-radius);
      const latitude=ny*.95-nx*.24+nz*.16;
      const band=Math.abs(latitude)<.09;
      const base=band ? [181,164,143] : latitude>0 ? [233,75,49] : [235,224,199];
      const light=Math.max(0,-nx*.42+ny*.64+nz*.64);
      const gloss=Math.pow(Math.max(0,-nx*.24+ny*.36+nz*.90),band?18:65);
      const i=(y*size+x)*4;
      for(let c=0;c<3;c++) pixels.data[i+c]=base[c]*(.31+.7*light)+210*gloss;
      pixels.data[i+3]=Math.min(255,(1-Math.sqrt(radius))*size*255);
    }
    ctx.putImageData(pixels,0,0);
  },[]);
  return <canvas width={96} height={96} ref={canvas} aria-hidden="true"/>;
}
function WishDialog({title,close,children,className=""}:{className?:string;title:string;close?:()=>void;children:React.ReactNode}) {
  const ref=React.useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!; dialog.showModal(); return ()=>dialog.close();},[]);
  return <dialog className={`wish-dialog ${className}`} ref={ref} aria-labelledby="wish-title" onCancel={e=>{e.preventDefault();close?.();}}>
    <h2 id="wish-title">{title}</h2>{children}
  </dialog>;
}
function RewardReveal({draws,close}:{draws:Wish[];close:()=>void}) {
  const [index,setIndex]=useState(0);
  const draw=draws[index], pin="pin" in draw ? draw.pin : null;
  const fighter="name" in draw ? characterRoster.find(f=>f.name===draw.name) : null;
  const uses={physical:"Attaque physique", special:"Attaque spéciale", heal:"Soin", guard:"Protection", support:"Soutien"};
  return <div className="reward-reveal">
    <div key={index} className="reward-sun" aria-live="polite">
      <h3>{pin ? pin.name.replace(" (Pin)","") : fighter?.name}</h3>
      <div className="reward-object">{pin?<PinIcon pin={pin}/>:fighter && <Sprite fighter={fighter}/>}</div>
      <div className="reward-facts">{pin ? <>
        <b>{pin.grade==="---"?"Sans classe":`Classe ${pin.grade}`}</b>
        <span>{uses[pin.kind]} · {pin.cost} EN</span>
      </> : "rank" in draw && <>
        <RankBadge level={draw.rank}/><span>{draw.copies ? `Doublon ${draw.copies}/5` : "Nouvelle recrue"} · {psychs[basePsych[draw.name]].name.replace(" (Pin)","")}</span>
      </>}</div>
    </div>
    <div className="reveal-footer">{draws.length>1 && <span>{index+1} / {draws.length}</span>}
      <button onClick={()=>index+1<draws.length?setIndex(index+1):close()}>{index+1<draws.length?"Suivant":"Fermer"}</button>
    </div>
  </div>;
}
function BadgeCatalogue({owned}:{owned:string[]}) {
  const [open,setOpen]=useState(false);
  const [page,setPage]=useState(0);
  const [selected,setSelected]=useState<Pin|null>(null);
  const collected=pinList.filter(pin=>owned.includes(pin.id));
  const pages=Math.ceil(pinList.length/16);
  const move=(delta:number)=>{setPage(page+delta);setSelected(null);};
  return <>
    <button onClick={()=>{setPage(0);setSelected(null);setOpen(true);}}>Catalogue des badges</button>
    {open && <WishDialog className="badge-book" title="Badges" close={()=>setOpen(false)}>
      <div className="badge-counter">{collected.length} / {pinList.length} obtenus</div>
      <div className="badge-slots">
        {Array.from({length:16},(_,i)=>{
          const index=page*16+i, pin=collected[index];
          if(!pin) return <span key={index} className="badge-slot" aria-hidden="true"/>;
          return <button key={pin.id} className="badge-slot" aria-label={pin.name} aria-pressed={selected?.id===pin.id} onClick={()=>setSelected(pin)}>
            <span aria-hidden="true" className="badge-art" style={{backgroundImage:`url(./assets/pins/row-${pin.row}.webp)`,backgroundPosition:`-${pin.col*84}cqw 0`}}/>
          </button>;
        })}
      </div>
      {selected && <p className="badge-info" aria-live="polite"><b>#{selected.number} {selected.name}</b> · {types[selected.kind]} · {selected.cost} EN</p>}
      <nav aria-label="Pages du catalogue"><button disabled={!page} aria-label="Page précédente" onClick={()=>move(-1)}>‹</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page+1>=pages} aria-label="Page suivante" onClick={()=>move(1)}>›</button></nav>
      <button onClick={()=>setOpen(false)}>Fermer</button>
      <small>Visuels DS · NightOwl35. Données · TWEWY Wiki.</small>
    </WishDialog>}
  </>;
}
function App() {
  const [profile, displayProfile] = useState(loadProfile);
  const [editingSlot,setEditingSlot]=useState<number|null>(null);
  const [party, setParty] = useState<Fighter[] | null>(null);
  const [result, setResult] = useState<Wish[]>([]);
  const [quantity,setQuantity]=useState(1);
  const [portal,setPortal]=useState("shibuya");
  const [phase, setPhase] = useState<"ready" | "rates" | "confirm" | "crank" | "spin" | "drop" | "reveal">("ready");
  const turning = React.useRef(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === profileKey) displayProfile(loadProfile());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const setProfile = (update: (old: Profile) => Profile) => {
    let current = profile;
    try { if (localStorage.getItem(profileKey)) current = loadProfile(); } catch {}
    const next = update(current);
    try { localStorage.setItem(profileKey, JSON.stringify(next)); setSaveError(false); }
    catch { setSaveError(true); }
    displayProfile(next);
  };

  const starter = (p:Profile) => p.owned.length < 2 || !(p.pins.some(offensive) || p.owned.some(name=>offensive(basePsych[name])));
  const wishCost = (p:Profile,n=quantity) => n === 1 && starter(p) ? 0 : 100 * n;
  const price = wishCost(profile);
  const openWish=(id:string,count:number)=>{
    setQuantity(count); setPortal(id); setPhase("confirm");
  };
  const pool=portalPool(portal,profile);
  const guaranteed=profile.wishStep===9;
  const percent=(v:number)=>v.toLocaleString("fr-FR",{style:"percent",maximumFractionDigits:3});
  const portalName=portal==="shibuya"?"First Week #1":"Partenaires";
  const closeDialog=()=>setPhase("ready");
  const recruit = (id:string,count:number) => {
    if (turning.current) return;
    const draws:Wish[] = [];
    setProfile(p => {
      if (p.coins!==profile.coins || wishCost(p,count)!==price || p.coins<price) return p;
      const next={...p,pins:[...p.pins],coins:p.coins-wishCost(p,count),owned:[...p.owned],levels:{...p.levels},copies:{...p.copies}};
      for(let i=0;i<count;i++){
        next.wishStep=(next.wishStep+1)%10;
        if(next.wishStep!==0 && Math.random()>=characterChance){
          const pin=pick(pinList);
          if(!next.pins.includes(pin.id)) next.pins.push(pin.id);
          draws.push({pin});
          continue;
        }
        const name=pick(portalPool(id,next)).name;
        const roll=Math.random(), rank=roll<.5?0:roll<.78?1:roll<.92?2:roll<.98?3:4;
        if(next.owned.includes(name)) next.copies[name]=Math.min(5,(next.copies[name]||0)+1);
        else { next.owned.push(name); next.copies[name]=0; }
        next.levels[name]=next.copies[name]===5 ? 5 : Math.max(next.levels[name]||0,rank);
        draws.push({name,rank,copies:next.copies[name]});
      }
      return assignBasePsychs(next);
    });
    if(draws.length){turning.current=true;setPortal(id);setQuantity(count);setResult(draws);setPhase("crank");}
  };
  const awaken = (name:string) => setProfile(p=>p.copies[name]===5 && !p.awakened.includes(name)
    ? {...p,awakened:[...p.awakened,name]} : p);
  const fighters=profile.equipped.filter(Boolean);
  function chooseFighter(name:string) {
    if(editingSlot===null) return;
    setProfile(p=>{
      if(name && (!p.owned.includes(name) || p.equipped[1-editingSlot]===name)) return p;
      const equipped=[...p.equipped]; equipped[editingSlot]=name;
      return {...p,equipped};
    });
    setEditingSlot(null);
  }
  if (party) return <Battle initialTeam={party} loadout={profile.loadout} coins={profile.coins}
    onDrops={(ids) => setProfile(p => ({...p,pins:[...new Set([...p.pins,...ids])]}))}
    onVictory={() => setProfile(p => ({ ...p, coins:p.coins+5, wins:{...p.wins,...Object.fromEntries(party.map(f=>[f.name,(p.wins[f.name]||0)+1]))} }))}
    leave={() => { setParty(null); setResult([]); }} />;
  if (gachaView) return <main className="game-shell party-lobby"><section>
    <h2>Bingo Kai</h2>
    <p>{profile.coins} pièces · {profile.owned.length} / {characterRoster.length} personnages débloqués · Garantie dans {10-profile.wishStep} {profile.wishStep===9?"vœu":"vœux"}</p>
    <BadgeCatalogue owned={profile.pins}/>
    <div className="portal-list">{Object.entries(portals).map(([id,title])=><article key={id} className="portal-card" aria-label={title}>
      <div className={"portal-scene scene-"+id}>
        {id==="shibuya" && !matchMedia("(prefers-reduced-motion: reduce)").matches &&
          <video className="portal-art" src="./assets/bingo/first-week-clean.mp4" poster="./assets/bingo/first-week-clean.webp" autoPlay muted playsInline aria-hidden="true"/>}
        {id==="partners" && <div className="portal-duo">{characterRoster.filter(f=>["BEAT","JOSHUA"].includes(f.name)).map(f=><Sprite key={f.name} fighter={f}/>)}</div>}
        <h3>{id==="shibuya"?"First Week #1":title}</h3>
        <button className="portal-rates" onClick={()=>{setPortal(id);setPhase("rates");}} aria-label={`Taux de ${id==="shibuya"?"First Week #1":title}`}>Taux</button>
        <div className="bingo-machine">
          <img className="bingo-body" src="./assets/bingo/machine.webp" alt="Bingo Kai"/>
          <span className="bingo-crank" aria-hidden="true"/>
        </div>
        <div className="wish-commands">{[1,10].map(n=><button key={n} disabled={phase!=="ready" || profile.coins<wishCost(profile,n)} onClick={()=>openWish(id,n)}>
          <strong>{n} {n===1?"vœu":"vœux"}</strong><small>{wishCost(profile,n)} pièces</small></button>)}</div>
        <p className="portal-caption">{id==="shibuya" ? "Retrouve Neku, Shiki et les badges psych de Shibuya." : "Beat et Joshua ont 2 fois plus de chances d’être recrutés que les autres personnages disponibles."}</p>
      </div>

    </article>)}</div>
    {phase==="rates" && <WishDialog key="rates" title={`Taux · ${portalName}`} close={closeDialog}>
      <p>Vœu ordinaire · {percent(characterChance)} personnage, {percent(1-characterChance)} badge. Chaque 10e vœu garantit un personnage.</p>
      <h3>Prochain vœu{guaranteed?" · garanti":""}</h3>
      <ul>{characterRoster.filter(f=>portal!=="shibuya" || ["NEKU","SHIKI"].includes(f.name)).map(f=><li key={f.name}>{f.name}<b>{percent(pool.filter(x=>x.name===f.name).length/pool.length*(guaranteed?1:characterChance))}</b></li>)}
      <li>Badges psych<b>{percent(guaranteed?0:1-characterChance)}</b></li></ul>
      <p>Les {pinList.length} badges sont équiprobables. Les personnages manquants ont priorité. Les taux sont recalculés après chaque vœu du lot.</p>
      <button onClick={closeDialog}>Fermer</button></WishDialog>}
    {phase==="confirm" && <WishDialog key="confirm" title="Confirmer l’invocation" close={closeDialog}>
      <p>Invoquer sur {portalName} pour {quantity} {quantity===1?"vœu":"vœux"} ?</p>
      <dl><dt>Solde actuel</dt><dd>{profile.coins} pièces</dd><dt>Coût</dt><dd>{price} pièces</dd><dt>Solde après invocation</dt><dd>{price<=profile.coins?`${profile.coins-price} pièces`:"Solde insuffisant"}</dd></dl>
      <div className="dialog-actions"><button onClick={closeDialog}>Annuler</button><button disabled={profile.coins<price} onClick={()=>recruit(portal,quantity)}>Confirmer</button></div>
    </WishDialog>}
    {["crank","spin","drop","reveal"].includes(phase) && <WishDialog key="invocation" title={phase==="reveal"?"Résultat de l’invocation":portalName} close={phase==="reveal"?closeDialog:undefined}>
      {phase==="reveal"?<RewardReveal draws={result} close={closeDialog}/>:<>
        <div className="invocation-stage"><div className="bingo-machine"><img className="bingo-body" src="./assets/bingo/machine.webp" alt="Bingo Kai"/>
          <button autoFocus aria-label="Tourner la manivelle" className={"bingo-crank "+(phase==="spin"?"turning":"")} disabled={phase!=="crank"} onClick={()=>setPhase("spin")}
            onAnimationEnd={e=>{if(e.animationName==="bingo-turn")setPhase("drop");}}/>
          {phase==="drop" && <span className="bingo-ball capsule" onAnimationEnd={e=>{if(e.animationName==="bingo-drop"){turning.current=false;setPhase("reveal");}}}><Capsule/></span>}
        </div></div><p aria-live="polite">{phase==="crank"?"Appuie sur la manivelle.":phase==="spin"?"La manivelle tourne…":"La capsule tombe…"}</p></>}
    </WishDialog>}
    {phase === "ready" && profile.owned.map(name => <div className="bingo-member" key={name}>
      <RankBadge level={profile.levels[name]}/><b>{name}</b><span>{profile.copies[name]||0}/5 doublons</span>
      {profile.awakened.includes(name) ? <span>Éveillé · +20 PV</span> : profile.levels[name] === 5 &&
      <button onClick={() => awaken(name)}>Éveiller · +20 PV</button>}
    </div>)}
    {saveError && <p role="alert">Sauvegarde locale indisponible.</p>}
  </section></main>;
  return <main className="game-shell party-lobby"><section><h1>Team</h1>
    <div className="team-slots">{profile.equipped.map((name,index)=>{
      const fighter=characterRoster.find(f=>f.name===name);
      const stats=fighter && trained(fighter,profile.wins[name]||0,profile.awakened.includes(name));
      return <button key={index} aria-label={`Emplacement ${index+1} · ${name||"Choisir un personnage"}`} onClick={()=>setEditingSlot(index)}>
        {fighter && stats ? <><Sprite fighter={fighter}/><strong>{name}</strong><RankBadge level={profile.levels[name]}/><small>Niv. {stats.level} · PV {stats.maxHp}<br/>ATK {stats.atk} · ATK SPE {stats.mag} · SPE {stats.speed}</small></> : <span aria-hidden="true">+</span>}
      </button>;
    })}</div>
    {editingSlot!==null && <WishDialog title={`Choisir un personnage · ${editingSlot+1} / 2`} close={()=>setEditingSlot(null)}>
      {profile.owned.length===0 && <p>Débloque ton premier personnage dans <a href="../app.html#gacha" target="_top">l’onglet Gacha</a>.</p>}
      <div className="party-list">{characterRoster.filter(f=>profile.owned.includes(f.name)).map(f=><button key={f.name} disabled={profile.equipped[1-editingSlot]===f.name} onClick={()=>chooseFighter(f.name)}>
        <Sprite fighter={f}/><strong>{f.name}</strong>{profile.equipped[1-editingSlot]===f.name && <small>Déjà équipé</small>}
      </button>)}</div>
      <div className="dialog-actions">{profile.equipped[editingSlot] && <button onClick={()=>chooseFighter("")}>Retirer</button>}<button onClick={()=>setEditingSlot(null)}>Fermer</button></div>
    </WishDialog>}
    <BadgeCatalogue owned={profile.pins}/>
    {fighters.map(name => <label className="psych-choice" key={name}>Psych de {name}
      <select value={profile.loadout[name] || ""} onChange={e => {
        const psych = e.target.value as Psych;
        setProfile(p => (p.pins.includes(psych) || basePsych[name]===psych) ? { ...p, loadout: { ...p.loadout, [name]: psych } } : p);
      }}><option value="" disabled>Choisir un psych</option>
        <option value={basePsych[name]}>{psychs[basePsych[name]].name.replace(" (Pin)","")} · Psych de base · {psychs[basePsych[name]].cost} EN</option>
        {profile.pins.filter(id=>id!==basePsych[name]).map(id=>[id,psychs[id]] as const).map(([id, item]) => <option key={id} value={id}>#{item.number} {item.name} · {types[item.kind]} · {item.cost} EN</option>)}
      </select></label>)}
    {fighters.length === 2 && fighters.every(n => !["physical","special"].includes(psychs[profile.loadout[n]]?.kind)) && <p>Équipe au moins un psych offensif.</p>}
    <button className="pull-button" disabled={fighters.length !== 2 || !fighters.every(n => profile.loadout[n]) || fighters.every(n => !["physical","special"].includes(psychs[profile.loadout[n]]?.kind))}
      onClick={() => setParty(fighters.map(name => { const f = characterRoster.find(f => f.name === name)!; return trained(f,profile.wins[name]||0,profile.awakened.includes(name)); }))}>Lancer le roguelike</button>
    {saveError && <p role="alert">La sauvegarde locale est indisponible dans ce navigateur.</p>}
  </section></main>;
}

function Battle({ initialTeam, loadout, coins, onDrops, onVictory, leave }: { initialTeam: Fighter[]; loadout: Record<string, Psych>; coins: number; onDrops:(ids:string[])=>void; onVictory: () => void; leave: () => void }) {
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
  const [loot,setLoot]=useState<string[]>([]);
  const [dropReveal,setDropReveal]=useState<Wish[]>([]);
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
    const defeated=updatedEnemies.filter((enemy,i)=>enemy.hp===0 && enemies[i].hp>0);
    const drops=defeated.filter(()=>Math.random()<0.25).map(()=>pick(pinList));
    if(drops.length){
      setDropReveal(drops.map(pin=>({pin})));
      onDrops(drops.map(pin=>pin.id));
      setLoot(old=>[...old,...drops.map(pin=>pin.name)]);
    }
    const attackers = updatedEnemies.filter((enemy) => enemy.hp > 0);
    if (!attackers.length) {
      setTimeout(() => {
        onVictory();
        setTeam(prev=>prev.map(f=>{
          const wins=(f.wins||0)+1;
          if(wins%3) return {...f,wins};
          return {...f,wins,level:f.level+1,atk:f.atk+2,mag:f.mag+2,speed:f.speed+1,maxHp:f.maxHp+5,hp:f.hp>0?f.hp+5:0};
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
      const livingFighters = team.map((fighter, index) => ({ fighter, index })).filter(({ fighter }) => fighter.hp > 0);
      if (!livingFighters.length) {
        setBusy(false);
        return;
      }
      const target = livingFighters[Math.floor(Math.random() * livingFighters.length)];
      const damage = Math.random()<Math.min(.30,target.fighter.speed/200) ? 0 : Math.max(3, Math.round(attacker.attack * (wasGuarded ? 0.45 : 1)));
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
    action: Action, drain = false,
  ) => {
    if (busy || reward || energy < cost) return;
    const target = livingEnemies.find((enemy) => enemy.id === selected);
    if (!target) return;
    setBusy(true);
    setActiveAction(action);
    setEnergy((value) => value - cost);
    const variance = Math.floor(Math.random() * 7) - 3;
    const boost=team.some(f=>f.hp>0 && psychs[loadout[f.name]].psych.startsWith("Resonance")) ? 1.15 : 1;
    const damage = Math.max(1,Math.round(amount*boost)+variance);
    const updated = enemies.map((enemy) =>
      enemy.id === selected ? { ...enemy, hp: Math.max(0, enemy.hp - damage) } : enemy,
    );
    setEnemies(updated);
    if(drain) setTeam(current=>current.map(f=>({...f,hp:Math.min(f.maxHp,f.hp+Math.ceil(damage/4))})));
    setImpact(selected);
    setGroove((value) => Math.min(100, value + grooveGain));
    setMessage(`${label} hits ${target.name} for ${damage}!`);
    setTimeout(() => setImpact(null), 380);
    enemyTurn(updated);
  };

  const heal = (amount:number,cost:number) => {
    if (busy || energy < cost) return;
    setBusy(true);
    setActiveAction("heal");
    setEnergy((value) => value - cost);
    setTeam((current) =>
      current.map((fighter) => ({ ...fighter, hp: Math.min(fighter.maxHp, fighter.hp + amount) })),
    );
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
    setLoot([]);
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
    setLoot([]);
    setWave(1);
    setTurn(1);
    const saved=loadProfile();
    setTeam(initialTeam.map(f=>trained(characterRoster.find(base=>base.name===f.name)!,saved.wins[f.name]||0,saved.awakened.includes(f.name))));
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
                  if (pin.kind==="heal") heal(Math.max(1,Math.round(f.mag*pin.power/50*(team.some(ally=>psychs[loadout[ally.name]].psych.startsWith("Cure Boost"))?1.3:1))),pin.cost);
                  else if (pin.kind==="guard" || pin.kind==="support") {
                    setEnergy(v=>v-pin.cost);
                    if(pin.kind==="support"){
                      if (/Turbo|Supply/.test(pin.psych)) setEnergy(v=>Math.min(3,v+2));
                      else if (/Cure Boost|Subconscious|Life/.test(pin.psych)) setTeam(old=>old.map(ally=>({...ally,hp:Math.min(ally.maxHp,ally.hp+Math.ceil(f.mag/2))})));
                      else setGroove(v=>Math.min(100,v+18));
                    }
                    guard();
                  } else {
                    const slash=pin.kind==="physical";
                    dealDamage(Math.round((slash?f.atk:f.mag)*(0.7+pin.power/100)),pin.name,pin.cost,18,slash?"shockwave":"pyro",pin.drain);
                  }
                }}>
                  <span className="action-icon pin-badge"><PinIcon pin={pin}/></span>
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

      {dropReveal.length>0 && <WishDialog title="Butin de combat" close={()=>setDropReveal([])}>
        <RewardReveal draws={dropReveal} close={()=>setDropReveal([])}/>
      </WishDialog>}
      {loot.length>0 && <p role="status">Psychs récupérés · {loot.join(", ")}</p>}
      {reward && (
        <div className="overlay">
          <div className="modal reward-modal">
            <small>WAVE {String(wave).padStart(2, "0")} COMPLETE</small>
            <h2>CHOOSE YOUR DROP</h2>
            <p>+5 pièces · +1 XP par personnage. Un niveau tous les 3 XP.</p>
            {loot.length>0 && <p>Psychs récupérés · {loot.join(", ")}</p>}
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
