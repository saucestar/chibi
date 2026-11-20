declare global { interface Window { ChibiGameSync?: any; } }
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

type ElementType = "normal"|"fire"|"water"|"electric"|"grass"|"ice"|"fighting"|"poison"|"ground"|"flying"|"psychic"|"bug"|"rock"|"ghost"|"dragon"|"dark"|"steel"|"fairy";
const elementNames:Record<ElementType,string>={normal:"Normal",fire:"Feu",water:"Eau",electric:"Électrik",grass:"Plante",ice:"Glace",fighting:"Combat",poison:"Poison",ground:"Sol",flying:"Vol",psychic:"Psy",bug:"Insecte",rock:"Roche",ghost:"Spectre",dragon:"Dragon",dark:"Ténèbres",steel:"Acier",fairy:"Fée"};
// Modern 18-type chart: attacker -> [super effective, resisted, immune].
// https://ph.portal-pokemon.com/game/type-chart/
const typeChart:Record<ElementType,[ElementType[],ElementType[],ElementType[]]>={
 normal:[[],["rock","steel"],["ghost"]],
 fire:[["grass","ice","bug","steel"],["fire","water","rock","dragon"],[]],
 water:[["fire","ground","rock"],["water","grass","dragon"],[]],
 electric:[["water","flying"],["electric","grass","dragon"],["ground"]],
 grass:[["water","ground","rock"],["fire","grass","poison","flying","bug","dragon","steel"],[]],
 ice:[["grass","ground","flying","dragon"],["fire","water","ice","steel"],[]],
 fighting:[["normal","ice","rock","dark","steel"],["poison","flying","psychic","bug","fairy"],["ghost"]],
 poison:[["grass","fairy"],["poison","ground","rock","ghost"],["steel"]],
 ground:[["fire","electric","poison","rock","steel"],["grass","bug"],["flying"]],
 flying:[["grass","fighting","bug"],["electric","rock","steel"],[]],
 psychic:[["fighting","poison"],["psychic","steel"],["dark"]],
 bug:[["grass","psychic","dark"],["fire","fighting","poison","flying","ghost","steel","fairy"],[]],
 rock:[["fire","ice","flying","bug"],["fighting","ground","steel"],[]],
 ghost:[["psychic","ghost"],["dark"],["normal"]],
 dragon:[["dragon"],["steel"],["fairy"]],
 dark:[["psychic","ghost"],["fighting","dark","fairy"],[]],
 steel:[["ice","rock","fairy"],["fire","water","electric","steel"],[]],
 fairy:[["fighting","dragon","dark"],["fire","poison","steel"],[]]
};
const characterElements:Record<string,ElementType[]>={NEKU:["psychic"],SHIKI:["normal"],BEAT:["fighting"],JOSHUA:["psychic","flying"],CLOUD:["fighting","steel"],AERITH:["grass","fairy"],"2B":["steel","fighting"],A2:["steel","dark"],SORA:["normal","fairy"],RIKU:["dark","psychic"]};
const enemyElements:Record<EnemyKind,ElementType[]>={frog:["water"],wolf:["dark"],shinigami:["dark","flying"],"jey-pengi":["water","ice"],"electro-pengi":["electric"],"psyche-fox":["psychic"]};
function effectiveness(attack:ElementType,defense:ElementType[]):number {
 const [strong,weak,immune]=typeChart[attack];
 return defense.reduce((v,t)=>v*(immune.includes(t)?0:strong.includes(t)?2:weak.includes(t)?.5:1),1);
}
function typedDamage(base:number,attack:ElementType,defense:ElementType[]):number {
 const scale=effectiveness(attack,defense);return scale===0?0:Math.max(1,Math.round(base*scale));
}
function affinityText(scale:number):string {return scale===0?"Sans effet":scale>1?`Super efficace ×${scale}`:scale<1?`Résisté ×${scale}`:"×1";}
function badgeElement(pin:Pin):ElementType {
 const power=pin.psych,name=pin.name;
 if(["buster-sword","virtuous-contract","type-40-blade"].includes(pin.id))return "steel";
 if(pin.id==="kingdom-key")return "fairy";
 if(pin.id==="way-to-dawn")return "dark";
 if(pin.kind==="heal"||/Healing|Cure|Holy|Subconscious|Vent guérisseur/.test(power))return "fairy";
 if(/Pyrokinesis|Flame|Ignition|Fire|Explosion|Time Bomb/.test(power))return "fire";
 if(/Aqua|Splash/.test(power)||/Aqua|Water/.test(name))return "water";
 if(/Lightning|Thunder|Spark|Discharge|Laser/.test(power))return "electric";
 if(/Freeze|Frostbite/.test(power)||/Ice |Frozen|Blizzard/.test(name))return "ice";
 if(/Earthquake|Pressure Mine/.test(power))return "ground";
 if(/Rock Bind|Lode/.test(power))return "rock";
 if(/Entanglement/.test(power))return "grass";
 if(/Black Hole|Dark Barrier|Doomed/.test(power))return "dark";
 if(/Invisibility|Summon Rhyme|Grave Marker|Mr. Mew/.test(power))return pin.id==="groove-pawn"?"normal":"ghost";
 if(/Twister|Vortex Saber/.test(power))return "flying";
 if(/Crawler|Sweeper/.test(power))return "bug";
 if(/Psychokinesis|Teleport|Chute d’objets/.test(power))return "psychic";
 if(/Sword|Lance|Spear/.test(power))return "steel";
 if(/SK8|Shockwave|Vulcan|Massive Hit|Velocity/.test(power))return "fighting";
 if(/Irregular Note|Street Jam|Stellar/.test(power))return "fairy";
 return "normal";
}
function TypeChips({elements}:{elements:ElementType[]}) {return <span className="type-chips">{elements.map(t=><span key={t} className={`element element-${t}`}>{elementNames[t]}</span>)}</span>;}

type EnemyKind = string;

type Enemy = {
  id: number;
  name: string;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  level: number;
  xp: number;
  boss: boolean;
  trait?:string;
};

type Fighter = {
  xp?:number; level?:number; atk?:number; mag?:number; speed?:number; portraitCenter?:number; portraitTop?:number;
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
  {name:"2B",role:"YORHA",hp:128,maxHp:128,sprite:"./assets/game/2b-idle.png",accent:"#d2cce0",frames:4,frameWidth:176,frameHeight:160,portraitCenter:88,portraitTop:40},
  {name:"A2",role:"YORHA",hp:132,maxHp:132,sprite:"./assets/game/a2-idle.png",accent:"#b8b1be",frames:4,frameWidth:144,frameHeight:160,portraitCenter:72,portraitTop:40},
  {name:"SORA",role:"KEYBLADE",hp:122,maxHp:122,sprite:"./assets/game/sora-idle.png",accent:"#ffd25c",frames:4,frameWidth:144,frameHeight:160,portraitCenter:72,portraitTop:40},
  {name:"RIKU",role:"KEYBLADE",hp:126,maxHp:126,sprite:"./assets/game/riku-idle.png",accent:"#9b9ce9",frames:4,frameWidth:144,frameHeight:160,portraitCenter:72,portraitTop:40},

  {name:"CLOUD",portraitCenter:64,role:"EX-SOLDAT",hp:138,maxHp:138,sprite:"./assets/game/cloud-idle.png",accent:"#88b9ff",frames:20,frameWidth:128,frameHeight:116},
  {name:"AERITH",portraitCenter:40,role:"CETRA",hp:104,maxHp:104,sprite:"./assets/game/aerith-idle.png",accent:"#ffb1c5",frames:4,frameWidth:80,frameHeight:116},

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

type FfbeEnemySpec={id:string;sourceId:string;name:string|null;enabled:boolean;frameWidth:number;frameHeight:number;frames:number[][];fps:number;elements:ElementType[];role:string;tier:number;boss:boolean;trait:string;hp:number;attack:number;speed:number};
declare const ffbeEnemyList:FfbeEnemySpec[];
const ffbeBestiary:FfbeEnemySpec[]=typeof ffbeEnemyList==="undefined"?[]:ffbeEnemyList;
const ffbePageCache=new Map<number,Promise<HTMLImageElement>>();
function ffbePage(index:number):Promise<HTMLImageElement> {
 const existing=ffbePageCache.get(index);if(existing){ffbePageCache.delete(index);ffbePageCache.set(index,existing);return existing;}
 const promise=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{ffbePageCache.delete(index);reject(Error("Image du bestiaire indisponible"));};image.src=`./assets/game/ffbe/idle-${String(index).padStart(3,"0")}.webp`;});
 ffbePageCache.set(index,promise);while(ffbePageCache.size>6)ffbePageCache.delete(ffbePageCache.keys().next().value!);return promise;
}
const enemyTraitNames:Record<string,string>={none:"Attaque standard",armored:"Cuirassé · −15 % de dégâts reçus",hunter:"Chasseur · vise le personnage au plus faible ratio de PV",vampire:"Absorption · récupère 15 % des dégâts infligés",berserk:"Rage · +35 % d’ATK sous 40 % de PV"};
function enemyDamageTaken(enemy:Enemy,amount:number):number {return amount===0?0:Math.max(1,Math.round(amount*(enemy.trait==="armored"?.85:1)));}
function enemyAttackPower(enemy:Enemy):number {return enemy.attack*(enemy.trait==="berserk"&&enemy.hp/enemy.maxHp<=.4?1.35:1);}
function encounterHash(seed:string):number {let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function ffbeWaveKinds(wave:number,count:number,seed:string):EnemyKind[] {
 const tier=difficultyAt(wave).tier-1,boss=isBossWave(wave);
 const regular=ffbeBestiary.filter(m=>m.enabled&&!m.boss&&m.tier<=tier&&m.tier>=Math.max(0,tier-4));
 const bosses=ffbeBestiary.filter(m=>m.enabled&&m.boss&&m.tier<=tier+2&&m.tier>=Math.max(0,tier-2));
 const pool=regular.length?regular:ffbeBestiary.filter(m=>m.enabled&&!m.boss&&m.tier<=tier);
 if(!pool.length)return [];
 const result:string[]=[];
 for(let i=0;i<count;i++){
  const source=boss&&i===0&&bosses.length?bosses:pool;
  let choice=source[encounterHash(`${seed}:${wave}:${i}`)%source.length];
  for(let n=1;n<source.length&&result.includes(choice.id);n++)choice=source[(encounterHash(`${seed}:${wave}:${i}`)+n)%source.length];
  result.push(choice.id);
 }
 return result;
}

const enemyCatalog: Record<EnemyKind, { name: string; frames: number; frameWidth: number; frameHeight: number; hp: number; attack: number; speed?:number; atlasFrames?:number[][]; fps?:number; trait?:string }> = {
  frog: { name: "BIG BANG FROG", frames: 2, frameWidth: 68, frameHeight: 72, hp: 50, attack: 10 },
  wolf: { name: "GARAGE WOLF", frames: 6, frameWidth: 102, frameHeight: 78, hp: 72, attack: 15 },
  shinigami: { name: "SHINIGAMI", frames: 5, frameWidth: 52, frameHeight: 76, hp: 92, attack: 17 },
  "jey-pengi": { name: "JEY PENGI", frames: 14, frameWidth: 42, frameHeight: 65, hp: 64, attack: 12 },
  "electro-pengi": { name: "ELECTRO PENGI", frames: 14, frameWidth: 42, frameHeight: 65, hp: 82, attack: 16 },
  "psyche-fox": { name: "PSYCHE FOX", frames: 6, frameWidth: 169, frameHeight: 205, hp: 126, attack: 21 },
};
function registerFfbeEntries(){for(const entry of ffbeBestiary){enemyCatalog[entry.id]={...entry,name:entry.name||`FFBE #${entry.sourceId}`,frames:entry.frames.length,atlasFrames:entry.frames};enemyElements[entry.id]=entry.elements;}}
registerFfbeEntries();
const enemyKinds: EnemyKind[] = ["frog", "wolf", "jey-pengi", "electro-pengi", "shinigami", "psyche-fox"];
const isBossWave = (wave: number) => wave % 5 === 0;

function EnemySprite({kind,boss,combat=false}:{kind:EnemyKind;boss:boolean;combat?:boolean}) {
  const spec=enemyCatalog[kind];
  const canvas=React.useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const context=canvas.current?.getContext("2d");
    if(!context) return;
    let timer:number|undefined,disposed=false,frame=0;
    context.imageSmoothingEnabled=false;
    if(spec.atlasFrames){
      const pages=new Map<number,HTMLImageElement>();
      const draw=()=>{if(disposed||document.hidden)return;const [page,x,y]=spec.atlasFrames![frame],atlas=pages.get(page);if(!atlas)return;context.clearRect(0,0,spec.frameWidth,spec.frameHeight);context.save();if(combat){context.translate(spec.frameWidth,0);context.scale(-1,1);}context.drawImage(atlas,x,y,spec.frameWidth,spec.frameHeight,0,0,spec.frameWidth,spec.frameHeight);context.restore();};
      Promise.all([...new Set(spec.atlasFrames.map(f=>f[0]))].map(async page=>pages.set(page,await ffbePage(page)))).then(()=>{if(disposed)return;draw();if(spec.frames>1&&!matchMedia("(prefers-reduced-motion: reduce)").matches)timer=window.setInterval(()=>{frame=(frame+1)%spec.frames;draw();},1000/(spec.fps||4));}).catch(()=>{});
    }else{
      const atlas=new Image(),draw=()=>{if(disposed||document.hidden)return;context.clearRect(0,0,spec.frameWidth,spec.frameHeight);context.drawImage(atlas,frame*spec.frameWidth,0,spec.frameWidth,spec.frameHeight,0,0,spec.frameWidth,spec.frameHeight);};
      atlas.onload=()=>{if(disposed)return;draw();if(!matchMedia("(prefers-reduced-motion: reduce)").matches)timer=window.setInterval(()=>{frame=(frame+1)%spec.frames;draw();},1000/Math.min(spec.frames,8));};atlas.src=`./assets/game/enemy-atlases/${kind}.png`;
    }
    return ()=>{disposed=true;window.clearInterval(timer);};
  },[kind,spec,combat]);
  return <canvas ref={canvas} width={spec.frameWidth} height={spec.frameHeight} aria-hidden="true"
    className={`pixel-sprite enemy-sprite ${boss?"boss-noise":""}`}
    style={{width:`${92*spec.frameWidth/spec.frameHeight}px`,height:"92px"}}/>;
}

function difficultyAt(floor:number) {
  const wave=Math.max(1,Math.min(100,Math.floor(floor)));
  const tier=Math.floor((wave-1)/10),step=(wave-1)%10;
  return {tier:tier+1,hp:1.35+tier*.85+tier*tier*.08+step*.07,
    attack:1.30+tier*.32+tier*tier*.025+step*.025,
    xp:1+tier*.48+tier*tier*.025+step*.04,speed:tier*3+Math.floor(step/3),
    bossHp:wave%10===0?2.8:2.1,bossAttack:wave%10===0?1.7:1.45};
}
const makeWave = (wave: number,seed:string="legacy"): Enemy[] => {
  const bossWave = isBossWave(wave);
  const count = bossWave ? (wave>=40?4:wave>=10?3:2) : wave<=2?2:wave<=9?3:4;
  const scale=difficultyAt(wave);
  const ffbeKinds=ffbeWaveKinds(wave,count,seed);
  return Array.from({ length: count }, (_, index) => {
    const boss = bossWave && index === 0;
    const kind: EnemyKind = (ffbeKinds[index]&&encounterHash(`${seed}:${wave}:${index}:noise`)%13!==0?ffbeKinds[index]:null) || (boss
      ? Math.floor(wave / 5) % 2 === 0 ? "psyche-fox" : "shinigami"
      : enemyKinds[(wave * 3 + index * 2 + Math.floor(wave / 5)) % enemyKinds.length]);
    const template = enemyCatalog[kind];
    const maxHp = Math.round(template.hp * scale.hp * (boss ? scale.bossHp : 1));
    return {
      id: wave * 10 + index,
      name: boss ? `${template.name} // BOSS` : template.name,
      kind,
      trait:boss?"berserk":template.trait||"none",
      hp: maxHp,
      maxHp,
      level: wave,
      speed: (template.speed ?? ({frog:9,wolf:23,shinigami:19,"jey-pengi":13,"electro-pengi":17,"psyche-fox":21}[kind]))+scale.speed,
      xp: Math.round((10+template.hp*.15)*scale.xp*(boss?3:1)),
      attack: Math.round(template.attack * scale.attack * (boss ? scale.bossAttack : 1)),
      boss,
    };
  });
};

type Action = "pyro" | "shockwave" | "heal" | "guard" | "burst" | null;

function SpritePreview({fighter,maximumScale=1}:{fighter:Fighter;maximumScale?:number}) {
  const ref=React.useRef<HTMLSpanElement>(null);
  const [scale,setScale]=useState(1);
  React.useLayoutEffect(()=>{
    const element=ref.current!;
    const fit=()=>{setScale(Math.min(maximumScale,element.clientWidth/(fighter.frameWidth||80),element.clientHeight/(fighter.frameHeight||116)));};
    fit();const observer=new ResizeObserver(fit);observer.observe(element);
    return()=>observer.disconnect();
  },[fighter.frameWidth,fighter.frameHeight,maximumScale]);
  return <span className="sprite-preview" ref={ref}><span className="sprite-preview-inner" style={{transform:`scale(${scale})`}}><Sprite fighter={fighter}/></span></span>;
}

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

type Pin = { element?:ElementType; grade?:string; id:string; number:string; name:string; psych:string; kind:string; power:number; drain:boolean; row:number; col:number; cost:number };
// Rank scales the effect once; base wiki power and saved inventories stay unchanged.
const pinRankScales:Record<string,number>={E:.8,D:.9,C:1,B:1.15,A:1.3,Reaper:1.45,Angel:1.6};
function pinRankMultiplier(pin:Pin):number {return pinRankScales[pin.grade||""]??1;}
function scaledPinEffect(pin:Pin,base:number):number {return base>0?Math.max(1,Math.round(base*pinRankMultiplier(pin))):0;}
function pinShieldReduction(pin:Pin):number {return Math.min(.75,.55*pinRankMultiplier(pin));}
function PinRankInfo({pin}:{pin:Pin}) {
 const label=pin.grade&&pin.grade!=="---"?`Classe ${pin.grade}`:"Sans classe";
 return <span>{label} · Effets ×{pinRankMultiplier(pin).toLocaleString("fr-FR")}</span>;
}
declare const pinList: Pin[];
const basePsych:Record<string,string> = {NEKU:"pin266", SHIKI:"groove-pawn", BEAT:"sk8-combo", JOSHUA:"joshua-phone",CLOUD:"buster-sword",AERITH:"healing-wind","2B":"virtuous-contract",A2:"type-40-blade",SORA:"kingdom-key",RIKU:"way-to-dawn"};
const partnerPsychs:Pin[] = [
  {id:"virtuous-contract",name:"Virtuous Contract",psych:"Lame YoRHa",kind:"physical",power:28},
  {id:"type-40-blade",name:"Type-40 Blade",psych:"Lame YoRHa",kind:"physical",power:31},
  {id:"kingdom-key",name:"Kingdom Key",psych:"Lumière de la Keyblade",kind:"physical",power:27},
  {id:"way-to-dawn",name:"Way to the Dawn",psych:"Lame de l’aube",kind:"special",power:29},

  {id:"buster-sword",name:"Buster Sword",psych:"Braver",kind:"physical",power:30},
  {id:"healing-wind",name:"Healing Wind",psych:"Vent guérisseur",kind:"heal",power:45},

  {id:"groove-pawn",name:"Groove Pawn",psych:"Mr. Mew",kind:"special",power:22},
  {id:"sk8-combo",name:"Beat Partner Pin",psych:"SK8 Combo",kind:"physical",power:22},
  {id:"joshua-phone",name:"Joshua Partner Pin",psych:"Chute d’objets",kind:"special",power:22},
].map(pin=>({...pin,number:"",row:-1,col:0,drain:false,cost:1}));
const psychs: Record<string, Pin> = Object.fromEntries([...pinList,...partnerPsychs].map(pin => [pin.id,{...pin,element:badgeElement(pin)}]));
type Psych = string;
const types = { physical:"ATK", special:"ATK SPE", heal:"Soin", guard:"Protection", support:"Soutien" };
function PinIcon({ pin }: {pin:Pin}) {
  if(pin.row<0) return <i aria-hidden="true" style={{display:"grid",placeItems:"center",width:28,height:28,borderRadius:"50%",background:"var(--indigo)",color:"white",fontStyle:"normal"}}>{{"groove-pawn":"♟","sk8-combo":"★","joshua-phone":"☎","buster-sword":"⚔","healing-wind":"✿","virtuous-contract":"⚔","type-40-blade":"⚔","kingdom-key":"✦","way-to-dawn":"☾"}[pin.id]}</i>;
  return <i aria-hidden="true" style={{display:"inline-block",width:28,height:28,flex:"none",imageRendering:"pixelated",backgroundImage:`url(./assets/pins/row-${pin.row}.webp)`,backgroundPosition:`-${pin.col*28}px 0`}}/>;
}
const portals = { shibuya:"Shibuya", partners:"Partenaires",reality:"From another reality",apocalyptic:"Apocalyptic Future",destiny:"Destiny Islands" };
const bases = { NEKU:[24,32,14], SHIKI:[22,26,20], BEAT:[34,18,12], JOSHUA:[19,36,16],CLOUD:[36,21,15],AERITH:[16,38,18],"2B":[32,24,21],A2:[35,21,19],SORA:[29,29,20],RIKU:[27,32,21] };
const maxLevel=99;
function xpAtLevel(level:number) {
  const n=level-1;
  return 100*n+35*n*(n-1)/2+5*n*(n-1)*(2*n-1)/6;
}
function experience(total:number) {
  const xp=Math.min(xpAtLevel(maxLevel),Math.max(0,Math.floor(Number(total)||0)));
  let level=1;
  while(level<maxLevel && xp>=xpAtLevel(level+1)) level++;
  const current=xp-xpAtLevel(level);
  const required=level===maxLevel?0:xpAtLevel(level+1)-xpAtLevel(level);
  return {xp,level,current,required};
}
function legacyExperience(wins:number) {
  const count=Math.max(0,Math.floor(Number(wins)||0));
  const level=Math.min(maxLevel,1+Math.floor(count/3));
  return level===maxLevel?xpAtLevel(maxLevel):xpAtLevel(level)+Math.floor((count%3)/3*(xpAtLevel(level+1)-xpAtLevel(level)));
}
function gainExperience(f:Fighter,amount:number):Fighter {
  const progress=experience((f.xp||0)+amount);
  const levels=progress.level-(f.level||1);
  return {...f,xp:progress.xp,level:progress.level,atk:f.atk+levels*2,mag:f.mag+levels*2,speed:f.speed+levels,maxHp:f.maxHp+levels*5,hp:f.hp>0?f.hp+levels*5:0};
}
function XpProgress({xp}:{xp:number}) {
  const p=experience(xp);
  return <div className="xp-progress"><span>Niv. {p.level} · {p.required?`${p.current} / ${p.required} XP`:"MAX"}</span>
    <progress aria-label="Progression du niveau" max={p.required||1} value={p.required?p.current:1}/></div>;
}
function trained(f:Fighter, xp:number, awake:boolean) {
  const progress=experience(xp), n=progress.level-1, [atk,mag,speed]=bases[f.name];
  const maxHp=f.maxHp+n*5+(awake?20:0);
  return {...f,xp:progress.xp,level:progress.level,atk:atk+n*2,mag:mag+n*2,speed:speed+n,hp:maxHp,maxHp};
}
const gachaView = new URLSearchParams(location.search).get("vue") === "gacha";
const ranks = ["E", "D", "C", "B", "A", "etoile"];
function RankBadge({ level }: { level: number }) {
  return <img className="rank-badge" src={`./assets/bingo/rang-${ranks[level]}.webp`} alt={`Rang ${level === 5 ? "étoile" : ranks[level]}`} />;
}
type Wish = { pin: Pin } | { name:string; rank:number; copies:number };
function pick<T,>(items:T[]):T { return items[Math.floor(Math.random()*items.length)]; }
const offensive = (id:string) => ["physical","special"].includes(psychs[id]?.kind);
type WishEvent = {id:string;at:number;portal:string;count:number;freeUsed:number;coinsPaid:number;coinsBefore:number;coinsAfter:number;freeBefore:number;freeAfter:number;first:number;last:number;drawsJson:string};
function validWishEvent(e:any):e is WishEvent {
 try{return e&&typeof e.id==="string"&&/^[a-zA-Z0-9-]+$/.test(e.id)&&typeof e.portal==="string"&&Number.isFinite(e.at)&&[1,10].includes(e.count)&&[e.freeUsed,e.coinsPaid,e.coinsBefore,e.coinsAfter,e.freeBefore,e.freeAfter,e.first,e.last].every(n=>Number.isSafeInteger(n)&&n>=0)&&typeof e.drawsJson==="string"&&Array.isArray(JSON.parse(e.drawsJson))&&JSON.parse(e.drawsJson).length===e.count;}catch{return false;}
}
function historyFull(p:Profile):boolean {return p.wishEvents.length>=50||JSON.stringify(p.wishEvents).length>28000;}
function makeWishEvent(p:Profile,next:Profile,id:string,count:number,free:number,cost:number,draws:Wish[]):WishEvent {
 const at=Date.now();return {id:`${at}-${next.wishesMade}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}`,at,portal:id,count,freeUsed:free,coinsPaid:cost,coinsBefore:p.coins,coinsAfter:next.coins,freeBefore:p.freeWishes,freeAfter:next.freeWishes,first:p.wishesMade+1,last:next.wishesMade,
 drawsJson:JSON.stringify(draws.map(draw=>"pin" in draw?{pinId:draw.pin.id}:{name:draw.name,rank:draw.rank,copies:draw.copies}))};
}
function WishHistory({profile,embedded=false}:{profile:Profile;embedded?:boolean}) {
 const Panel=embedded?InlinePanel:WishDialog;
 const [open,setOpen]=useState(false),[items,setItems]=useState<WishEvent[]>([]),[selected,setSelected]=useState<WishEvent|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState(""),[cursor,setCursor]=useState<string|null>(null),[more,setMore]=useState(false);
 const load=async(reset=false)=>{
  if(loading)return;setLoading(true);setError("");
  try{
   if(!window.ChibiGameSync?.historyPage)throw Error("L’historique distant est indisponible. Les invocations en attente restent conservées ici.");
   const result=await window.ChibiGameSync.historyPage(reset?null:cursor);
   setItems(old=>reset?result.items.filter(validWishEvent):[...old,...result.items.filter(validWishEvent)]);setCursor(result.cursor);setMore(result.more);
  }catch(e){setError(String((e as Error).message||"Historique indisponible"));}finally{setLoading(false);}
 };
 useEffect(()=>{if(embedded)load(true);},[embedded]);
 const events=[...new Map([...items,...profile.wishEvents].map(event=>[event.id,event])).values()].sort((a,b)=>b.id.localeCompare(a.id));
 const pending=new Set(profile.wishEvents.map(e=>e.id));
 return <>{!embedded&&<button onClick={()=>{setOpen(true);setSelected(null);load(true);}}>Historique des vœux</button>}
 {(open||embedded)&&<Panel className="wish-history" title="Historique des vœux" close={()=>setOpen(false)}>
  <div key={selected?.id||"list"} className="wish-history-view">
  {selected?<>
   <p><b>{portals[selected.portal]||selected.portal}</b> · {new Date(selected.at).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})}</p>
   <p>Vœux {selected.first}–{selected.last} · {selected.freeUsed} gratuits · {selected.coinsPaid} pièces</p>
   <p>Solde : {selected.coinsBefore} → {selected.coinsAfter} pièces · Gratuits : {selected.freeBefore} → {selected.freeAfter}</p>
   <div className="wish-history-list">{JSON.parse(selected.drawsJson).map((draw:any,i:number)=>{
    const pin=psychs[draw.pinId];return <article key={i}>{pin?<PinIcon pin={pin}/>:<span>★</span>}<div><b>{pin?.name||draw.name||"Récompense"}</b><small>{pin?"Badge":`Personnage · Rang ${draw.rank===5?"étoile":ranks[draw.rank]} · ${draw.copies} doublon(s)`}</small></div></article>;
   })}</div>
   <button onClick={()=>setSelected(null)}>Retour à l’historique</button>
  </>:<>
   <p>{profile.wishesMade} invocations comptabilisées · {profile.freeWishSpent} vœux gratuits consommés</p>
   {profile.wishHistoryBaseline>0&&<p>{profile.wishHistoryBaseline} invocations antérieures : total connu, détails non enregistrés à l’époque.</p>}
   {error&&<p role="status">{error}</p>}
   <div className="wish-history-list">{events.map(event=><button key={event.id} onClick={()=>setSelected(event)}>
    <b>{event.count} vœu{event.count>1?"x":""} · {portals[event.portal]||event.portal}</b>
    <small>{new Date(event.at).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})} · {event.freeUsed} gratuits · {event.coinsPaid} pièces</small>
    {pending.has(event.id)&&<small>En attente de synchronisation</small>}
   </button>)}{!events.length&&!loading&&<p>Aucune invocation détaillée enregistrée pour le moment.</p>}</div>
   <div className="dialog-actions"><button disabled={loading} onClick={()=>load(true)}>Actualiser</button>{more&&<button disabled={loading} onClick={()=>load()}>Charger plus</button>}</div>
  </>}
  </div>{!embedded&&<button onClick={()=>setOpen(false)}>Fermer</button>}
 </Panel>}
 </>;
}

type RunPending={steps:TurnEntry[];choices:Record<string,PlannedAction>;index:number;shields:[string,number][];performed:string[]};
type RunSave={version:1;id:string;seq:number;status:"active"|"lost"|"complete"|"abandoned";updatedAt:number;wave:number;turn:number;team:Fighter[];enemies:Enemy[];loadout:Record<string,string[]>;energy:number;groove:number;reward:boolean;earnedXp:number;loot:string[];awarded:number[];pending:RunPending|null};
type RunGains={xp?:number;pins?:string[];victory?:boolean};
function validRun(raw:any,owned:string[]):RunSave|null {
 try{
  const integer=(n:any,min:number,max:number)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  if(!raw||raw.version!==1||typeof raw.id!=="string"||!/^[a-zA-Z0-9-]{1,100}$/.test(raw.id)||!integer(raw.seq,0,1000000)||!["active","lost","complete","abandoned"].includes(raw.status)||!integer(raw.wave,1,100)||!integer(raw.turn,1,100000)||!integer(raw.energy,0,3)||!integer(raw.groove,0,100)||JSON.stringify(raw).length>18000)return null;
  if(!Array.isArray(raw.team)||raw.team.length!==2||new Set(raw.team.map((f:any)=>f.name)).size!==2)return null;
  const team=raw.team.map((f:any)=>{const base=characterRoster.find(b=>b.name===f.name);if(!base||!owned.includes(f.name)||!["hp","maxHp","atk","mag","speed","xp","level"].every(k=>integer(f[k],k==="hp"||k==="xp"?0:1,10000000))||f.hp>f.maxHp)throw Error();return {...base,...Object.fromEntries(["hp","maxHp","atk","mag","speed","xp","level"].map(k=>[k,f[k]]))} as Fighter;});
  if(!Array.isArray(raw.enemies)||raw.enemies.length<1||raw.enemies.length>4||new Set(raw.enemies.map((e:any)=>e.id)).size!==raw.enemies.length)return null;
  for(const e of raw.enemies)if(!enemyCatalog[e.kind]||!["id","hp","maxHp","attack","speed","xp"].every(k=>integer(e[k],0,10000000))||e.hp>e.maxHp||Math.floor(e.id/10)!==raw.wave)return null;
  const names=team.map(f=>f.name),loadout=Object.fromEntries(names.map(name=>[name,raw.loadout?.[name]]));
  if(!Object.values(loadout).every(ids=>Array.isArray(ids)&&ids.length>0&&ids.length<=3&&ids.every(id=>psychs[id]))||new Set(Object.values(loadout).flat()).size!==Object.values(loadout).flat().length)return null;
  const pending=raw.pending||null;
  if(pending){
   if(!Array.isArray(pending.steps)||pending.steps.length>6||!integer(pending.index,0,pending.steps.length)||!Array.isArray(pending.shields)||pending.shields.some(([name,n]:[string,number])=>!names.includes(name)||!Number.isFinite(n)||n<0||n>.75)||!Array.isArray(pending.performed)||pending.performed.some(n=>!names.includes(n)))return null;
   for(const step of pending.steps)if(step.side==="ally"?(!names.includes(step.name)||!pending.choices?.[step.name]):step.side!=="enemy"||!raw.enemies.some(e=>e.id===step.id))return null;
   for(const name of names){const plan=pending.choices?.[name];if(plan&&(!["guard","burst","psych"].includes(plan.kind)||(plan.kind==="psych"&&!loadout[name].includes(plan.pin))))return null;}
  }
  const status=raw.status==="active"&&team.every(f=>f.hp<=0)?"lost":raw.status;
  return {...raw,team,loadout,status,pending:status==="active"?pending:null,reward:raw.reward===true,earnedXp:integer(raw.earnedXp,0,10000000)?raw.earnedXp:0,loot:Array.isArray(raw.loot)?raw.loot.filter(n=>typeof n==="string").slice(0,400):[],awarded:Array.isArray(raw.awarded)?raw.awarded.filter(n=>raw.enemies.some(e=>e.id===n)):[]};
 }catch{return null;}
}
function newRun(profile:Profile):RunSave {
 const names=profile.equipped.filter(Boolean),id=`run-${Date.now()}-${crypto.randomUUID()}`;
 return {version:1,id,seq:0,status:"active",updatedAt:Date.now(),wave:1,turn:1,team:names.map(name=>trained(characterRoster.find(f=>f.name===name)!,profile.xp[name]||0,profile.awakened.includes(name))),enemies:makeWave(1,id),loadout:Object.fromEntries(names.map(name=>[name,[...profile.loadout[name]]])),energy:3,groove:28,reward:false,earnedXp:0,loot:[],awarded:[],pending:null};
}
function applyRunCheckpoint(p:Profile,snapshot:RunSave,gains:RunGains={}):Profile {
 if(!p.run||p.run.id!==snapshot.id||p.run.status!=="active"||snapshot.seq<=p.run.seq)return p;
 const xp={...p.xp};if(gains.xp)for(const f of snapshot.team)xp[f.name]=experience((xp[f.name]||0)+gains.xp).xp;
 return {...p,run:snapshot,xp,pins:[...new Set([...p.pins,...(gains.pins||[])])],coins:p.coins+(gains.victory?5:0),hasPlayed:true,bestFloor:Math.max(p.bestFloor,snapshot.wave),floorRecoveryAvailable:p.floorRecoveryAvailable&&snapshot.wave<10};
}

type Profile = { specialRunRecoveries:string[]; run:RunSave|null; wishEvents:WishEvent[]; wishHistoryStartedAt:number; wishHistoryBaseline:number; freeWishVersion:number; freeWishSpent:number; freeWishDaySpent:number; pcMissionCoins:Record<string,number>; starterNekuGranted:boolean; starterWishesGranted:boolean; hasPlayed:boolean; wishesMade:number; freeWishes:number; lastFreeWishDay:string; bestFloor:number; claimedQuests:string[]; floorRecoveryAvailable:boolean; pins:string[]; wishStep:number; copies:Record<string,number>; xp:Record<string,number>; levels: Record<string, number>; awakened: string[]; owned: string[]; equipped: string[]; loadout: Record<string, Psych[]>; coins: number };
const profileKey = "chibi.reapers-run.party.v1";

function equippedBy(profile:Profile,name:string,id:string):string|undefined {
 return profile.equipped.find(partner=>partner&&partner!==name&&profile.loadout[partner]?.includes(id));
}
function availablePsychs(profile:Profile,name:string):string[] {
  return [...new Set([basePsych[name],...profile.pins])].filter(id=>Boolean(psychs[id]));
}
function grantStarterNeku(p:Profile):Profile {
  if(p.owned.includes("NEKU"))return p.starterNekuGranted?p:{...p,starterNekuGranted:true};
  return {...p,starterNekuGranted:true,owned:[...p.owned,"NEKU"],copies:{...p.copies,NEKU:0},levels:{...p.levels,NEKU:0},xp:{...p.xp,NEKU:0}};
}
function assignBasePsychs(profile:Profile):Profile {
  profile=grantStarterNeku(profile);
  const counts=Object.fromEntries(profile.owned.map(name=>[name,Math.min(5,Math.max(0,Math.floor(Number(profile.copies[name])||0)))]));
  profile={...profile,copies:counts,levels:{...counts},awakened:profile.awakened.filter(name=>counts[name]===5)};
  const pins=[...profile.pins];
  if(profile.owned.includes("NEKU") && !pins.includes(basePsych.NEKU)) pins.push(basePsych.NEKU);
  const loadout:Record<string,string[]>={};
  for(const name of profile.owned){
    const saved=profile.loadout[name] as string[]|string|undefined;
    const ids=Array.isArray(saved)?saved:typeof saved==="string"?[saved]:[];
    const allowed=availablePsychs({...profile,pins},name);
    const equipped=[...new Set(ids)].filter(id=>allowed.includes(id)).slice(0,3);
    loadout[name]=equipped.length?equipped:[basePsych[name]];
  }
  const used=new Set<string>();
  for(const name of profile.equipped.filter(Boolean)){
    loadout[name]=(loadout[name]||[]).filter(id=>!used.has(id));
    if(!loadout[name].length){const replacement=availablePsychs({...profile,pins},name).find(id=>!used.has(id));if(replacement)loadout[name]=[replacement];}
    loadout[name].forEach(id=>used.add(id));
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
    const pins = [...new Set<string>(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}).flat())].filter(id=>psychs[id]?.row>=0);
    const copies=Object.fromEntries(owned.map(name=>{
      const value=saved.copies?.[name];
      // An explicit duplicate count is authoritative; only old saves lacking it use legacy star data.
      const count=value!==undefined && Number.isFinite(Number(value))?Math.min(5,Math.max(0,Math.floor(Number(value)))):
        saved.awakened?.includes(name)||Number(saved.levels?.[name])===5?5:0;
      return [name,count];
    }));
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 10 ? saved.wishStep : 0;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return accrueDailyWishes(assignBasePsychs({specialRunRecoveries:Array.isArray(saved.specialRunRecoveries)?[...new Set<string>(saved.specialRunRecoveries.filter(id=>typeof id==="string"&&id.length<100))]:[],run:validRun(saved.run,owned),wishEvents:Array.isArray(saved.wishEvents)?saved.wishEvents.filter(validWishEvent):[],wishHistoryStartedAt:Number(saved.wishHistoryStartedAt)||0,wishHistoryBaseline:Number(saved.wishHistoryBaseline)||0,freeWishVersion:saved.freeWishVersion===1?1:0,freeWishSpent:Number.isSafeInteger(saved.freeWishSpent)&&saved.freeWishSpent>=0?saved.freeWishSpent:0,freeWishDaySpent:Number.isSafeInteger(saved.freeWishDaySpent)&&saved.freeWishDaySpent>=0?saved.freeWishDaySpent:0,pcMissionCoins:Object.fromEntries(Object.entries(saved.pcMissionCoins||{}).filter(([day,n])=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=100000)),starterNekuGranted:saved.starterNekuGranted===true,starterWishesGranted:saved.starterWishesGranted===true,hasPlayed:saved.hasPlayed===true || Number(saved.bestFloor)>0 || Object.values(saved.xp||saved.wins||{}).some(x=>Number(x)>0),wishesMade:Number.isSafeInteger(saved.wishesMade)&&saved.wishesMade>=0?saved.wishesMade:Math.max(owned.filter(n=>!saved.starterNekuGranted||n!=="NEKU").length,Number(saved.wishStep)||0,(saved.pins||[]).some(id=>!saved.starterNekuGranted||id!==basePsych.NEKU)?1:0),freeWishes:Number.isSafeInteger(saved.freeWishes)&&saved.freeWishes>=0?saved.freeWishes:0,lastFreeWishDay:typeof saved.lastFreeWishDay==="string"?saved.lastFreeWishDay:"",bestFloor:Math.min(100,Math.max(0,Math.floor(Number(saved.bestFloor??saved.highestFloor??0)||0))), claimedQuests:Array.isArray(saved.claimedQuests)?[...new Set<string>(saved.claimedQuests.filter(id=>typeof id==="string"))]:[], floorRecoveryAvailable:saved.floorRecoveryAvailable===true || (saved.floorRecoveryAvailable!==false && saved.bestFloor===undefined && owned.length>0), owned, equipped, pins, wishStep,
      copies,
      xp:Object.fromEntries(owned.map(n=>[n,Number.isSafeInteger(saved.xp?.[n]) && saved.xp[n]>=0 ? experience(saved.xp[n]).xp : legacyExperience(saved.wins?.[n])])),

      levels: {...copies},
      awakened: owned.filter(name => copies[name]===5 && saved.awakened?.includes(name)), loadout: saved.loadout || {}, coins: saved.coins }));
  } catch {}
  return accrueDailyWishes(assignBasePsychs({specialRunRecoveries:[],run:null,wishEvents:[],wishHistoryStartedAt:0,wishHistoryBaseline:0,freeWishVersion:0,freeWishSpent:0,freeWishDaySpent:0,pcMissionCoins:{},starterNekuGranted:false,starterWishesGranted:false,hasPlayed:false,wishesMade:0,freeWishes:0,lastFreeWishDay:"",bestFloor:0,claimedQuests:[],floorRecoveryAvailable:false,pins:[], wishStep:0, copies:{}, xp:{}, levels: {}, awakened: [], owned: [], equipped: ["",""], loadout: {}, coins: 180 }));
}

// First mobile game integration: 2026-11-18 (repository history).
const freeWishStartDay="2026-11-18";
function parisDay(now:Date=new Date()):string {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 return ["year","month","day"].map(key=>parts.find(p=>p.type===key)!.value).join("-");
}
function dayIndex(day:string):number {return /^\d{4}-\d{2}-\d{2}$/.test(day)?Date.parse(day+"T00:00:00Z")/86400000:NaN;}
const freeWishNoStackDay="2026-11-25";
function accrueDailyWishes(p:Profile,now:Date=new Date()):Profile {
 const today=parisDay(now),end=dayIndex(today),start=dayIndex(freeWishStartDay),previous=dayIndex(p.lastFreeWishDay);
 if(end<start || (Number.isFinite(previous)&&previous>end))return p;
 const active=p.wishesMade>0||p.wishStep>0||Object.values(p.copies).some(n=>n>0)||p.owned.some(n=>n!=="NEKU")||p.pins.some(id=>id!==basePsych.NEKU);
 let spent=p.freeWishSpent,daySpent=p.lastFreeWishDay===today?p.freeWishDaySpent:0;
 if(p.freeWishVersion!==1){
   if(today<freeWishNoStackDay){
     const knownDay=Number.isFinite(previous)?Math.max(start,previous):end;
     const earned=10+(knownDay-start+1)*3;
     // A full pack on an already active legacy account is a replay, not a new player gift.
     spent=active&&(!Number.isFinite(previous)||p.freeWishes>=earned)?earned:
       Number.isFinite(previous)?Math.max(0,earned-p.freeWishes):0;
   }else daySpent=p.lastFreeWishDay===today?Math.max(0,3-Math.min(3,p.freeWishes)):0;
 }
 const balance=today>=freeWishNoStackDay?Math.max(0,3-daySpent):Math.max(0,10+(end-start+1)*3-spent);
 return {...p,wishHistoryStartedAt:p.wishHistoryStartedAt||now.getTime(),wishHistoryBaseline:p.wishHistoryStartedAt?p.wishHistoryBaseline:p.wishesMade,freeWishVersion:1,freeWishSpent:spent,freeWishDaySpent:daySpent,freeWishes:balance,lastFreeWishDay:today,starterWishesGranted:true};
}
function wishQuote(p:Profile,count:number) {
 const free=Math.min(count,p.freeWishes),paid=count-free;
 return {free,paid,cost:paid*100,starter:false};
}

const characterChance = 0.10;
function portalRoster(id:string):Fighter[] {
  const names=id==="apocalyptic"?["2B","A2"]:id==="destiny"?["SORA","RIKU"]:id==="reality"?["CLOUD","AERITH"]:id==="shibuya"?["NEKU","SHIKI"]:["NEKU","SHIKI","BEAT","JOSHUA"];
  return characterRoster.filter(f=>names.includes(f.name));
}
function portalPool(id:string, _profile?:Profile) {
  const roster=portalRoster(id);
  // Fixed weights: ownership, duplicates and awakening never change the odds.
  return id==="partners" ? [...roster,...roster.filter(f=>["BEAT","JOSHUA"].includes(f.name))] : roster;
}
function PortalVideo({src,poster}:{src:string;poster:string}) {
  const ref=React.useRef<HTMLVideoElement>(null);
  const [playing,setPlaying]=useState(false);
  useEffect(()=>{
    const video=ref.current!;let visible=true,disposed=false;
    const resume=()=>{
      if(disposed)return;
      if(document.hidden||!visible){video.pause();setPlaying(false);return;}
      if(video.ended)video.currentTime=0;
      video.play().catch(()=>{if(!disposed)setPlaying(false);});
    };
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();});
    observer.observe(video);document.addEventListener("visibilitychange",resume);resume();
    return ()=>{disposed=true;observer.disconnect();document.removeEventListener("visibilitychange",resume);video.pause();};
  },[src]);
  return <>
    <img className="portal-art" src={poster} alt="" aria-hidden="true"/>
    <video ref={ref} className="portal-art" src={src} poster={poster} autoPlay muted loop playsInline aria-hidden="true"
      style={{opacity:playing?1:0}} onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onWaiting={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>setPlaying(false)}/>
  </>;
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
        <b><PinRankInfo pin={pin}/></b>
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
function BadgeArt({pin}:{pin:Pin}) {
  if(pin.row<0) return <span className="partner-pin-art"><PinIcon pin={pin}/></span>;
  return <span aria-hidden="true" className="badge-art" style={{backgroundImage:`url(./assets/pins/row-${pin.row}.webp)`,backgroundPosition:`-${pin.col*84}cqw 0`}}/>;
}
function PsychEquipment({name,profile,save}:{name:string;profile:Profile;save:(ids:string[])=>void}) {
  const [open,setOpen]=useState(false);
  const [draft,setDraft]=useState<string[]>([]);
  const [page,setPage]=useState(0);
  const [inspected,setInspected]=useState<string|null>(null);
  const available=availablePsychs(profile,name);
  const pages=Math.max(1,Math.ceil(available.length/16));
  const equipped=profile.loadout[name]||[];
  const inspect=inspected?psychs[inspected]:null;
  const toggle=(id:string)=>{
    setInspected(id);
    if(equippedBy(profile,name,id))return;
    setDraft(old=>old.includes(id)?old.filter(value=>value!==id):old.length<3?[...old,id]:old);
  };
  const start=()=>{setDraft([...equipped]);setPage(0);setInspected(null);setOpen(true);};
  return <div className="psych-loadout"><h2>Psychs · {name}</h2>
    <div className="psych-equipment-slots">{[0,1,2].map(index=><button key={index} onClick={start} aria-label={`Équiper les psychs de ${name}, emplacement ${index+1}`}>
      {equipped[index]?<><PinIcon pin={psychs[equipped[index]]}/><small>{psychs[equipped[index]].name.replace(" (Pin)","")}</small></>:<span aria-hidden="true">+</span>}
    </button>)}</div>
    {open && <WishDialog className="badge-book" title={`Psychs · ${name}`} close={()=>setOpen(false)}>
      <p className="equipment-count">{draft.length} / 3 équipés</p>
      <div className="psych-equipment-slots">{[0,1,2].map(i=><button key={i} disabled={!draft[i]} aria-label={draft[i]?`Retirer ${psychs[draft[i]].name}`:`Emplacement ${i+1} vide`} onClick={()=>toggle(draft[i])}>
        {draft[i]?<PinIcon pin={psychs[draft[i]]}/>:<span>+</span>}
      </button>)}</div>
      <div className="badge-slots">{Array.from({length:16},(_,i)=>{
        const id=available[page*16+i],pin=psychs[id];
        return pin?<button key={id} className="badge-slot" aria-label={`${pin.name}${equippedBy(profile,name,id)?` · Équipé par ${equippedBy(profile,name,id)}`:""}`} disabled={Boolean(equippedBy(profile,name,id))} aria-pressed={draft.includes(id)} onClick={()=>toggle(id)}><BadgeArt pin={pin}/>{equippedBy(profile,name,id)&&<small className="badge-owner">{equippedBy(profile,name,id)}</small>}</button>:<span key={i} className="badge-slot" aria-hidden="true"/>;
      })}</div>
      {inspect && <p className="badge-info"><b>{inspect.name.replace(" (Pin)","")}</b> · {types[inspect.kind]} · {inspect.cost} EN · <PinRankInfo pin={inspect}/> <TypeChips elements={[inspect.element||badgeElement(inspect)]}/>{equippedBy(profile,name,inspect.id)&&<span> · Équipé par {equippedBy(profile,name,inspect.id)}</span>}</p>}
      {draft.length===3 && <p className="equipment-help">Retire un psych équipé pour le remplacer.</p>}
      {!draft.length && <p className="equipment-help">Équipe au moins 1 psych.</p>}
      <nav aria-label="Pages des psychs"><button disabled={!page} onClick={()=>setPage(page-1)} aria-label="Page précédente">‹</button><span>{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(page+1)} aria-label="Page suivante">›</button></nav>
      <div className="dialog-actions"><button onClick={()=>setOpen(false)}>Annuler</button><button disabled={!draft.length} onClick={()=>{save(draft);setOpen(false);}}>Enregistrer</button></div>
    </WishDialog>}
  </div>;
}
function BadgeCatalogue({owned,embedded=false}:{owned:string[];embedded?:boolean}) {
  const Panel=embedded?InlinePanel:WishDialog;
  const [open,setOpen]=useState(false);
  const [page,setPage]=useState(0);
  const [selected,setSelected]=useState<Pin|null>(null);
  const collected=pinList.filter(pin=>owned.includes(pin.id));
  const pages=Math.ceil(pinList.length/16);
  const move=(delta:number)=>{setPage(page+delta);setSelected(null);};
  return <>
    {!embedded&&<button onClick={()=>{setPage(0);setSelected(null);setOpen(true);}}>Catalogue des badges</button>}
    {(open||embedded) && <Panel className="badge-book" title="Badges" close={()=>setOpen(false)}>
      <div className="badge-counter">{collected.length} / {pinList.length} obtenus</div>
      <div className="badge-slots">
        {Array.from({length:16},(_,i)=>{
          const index=page*16+i, pin=collected[index];
          if(!pin) return <span key={index} className="badge-slot" aria-hidden="true"/>;
          return <button key={pin.id} className="badge-slot" aria-label={pin.name} aria-pressed={selected?.id===pin.id} onClick={()=>setSelected(pin)}>
            <BadgeArt pin={pin}/>
          </button>;
        })}
      </div>
      {selected && <p className="badge-info" aria-live="polite"><b>#{selected.number} {selected.name}</b> · {types[selected.kind]} · {selected.cost} EN · <PinRankInfo pin={selected}/> <TypeChips elements={[selected.element||badgeElement(selected)]}/></p>}
      <nav aria-label="Pages du catalogue"><button disabled={!page} aria-label="Page précédente" onClick={()=>move(-1)}>‹</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page+1>=pages} aria-label="Page suivante" onClick={()=>move(1)}>›</button></nav>
      {!embedded&&<button onClick={()=>setOpen(false)}>Fermer</button>}
      <small>Visuels DS · NightOwl35. Données · TWEWY Wiki.</small>
    </Panel>}
  </>;
}
type Quest = {id:string;title:string;progress:number;goal:number;reward:number};
const maxFloor=100;
function questsFor(p:Profile):Quest[] {
 const badges=new Set(p.pins.filter(id=>psychs[id]?.row>=0)).size;
 const bestLevel=Math.max(1,...Object.values(p.xp).map(x=>experience(x).level));
 return [
  ...Array.from({length:10},(_,i)=>({id:`floor-${(i+1)*10}`,title:`Atteindre l’étage ${(i+1)*10}`,progress:p.bestFloor,goal:(i+1)*10,reward:100})),
  ...Array.from({length:Math.floor(pinList.length/10)},(_,i)=>({id:`badges-${(i+1)*10}`,title:`Collectionner ${(i+1)*10} badges`,progress:badges,goal:(i+1)*10,reward:20})),
  ...[2,4,6].map(n=>({id:`recruits-${n}`,title:`Débloquer ${n} personnages`,progress:p.owned.length,goal:n,reward:n*25})),
  ...[5,10,25].map(n=>({id:`level-${n}`,title:`Monter un personnage au niveau ${n}`,progress:bestLevel,goal:n,reward:n*10})),
  {id:"awaken-1",title:"Éveiller 1 personnage",progress:p.awakened.length,goal:1,reward:150}
 ];
}
function applyPcMissionCoins(p:Profile,scores:Record<string,number>):Profile {
 const paid={...p.pcMissionCoins};let coins=0;
 for(const [day,score] of Object.entries(scores)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(score)||score<0||score>1000000)continue;
  const total=Math.floor(score/10),previous=paid[day]||0;
  if(total>previous){coins+=total-previous;paid[day]=total;}
 }
 return coins?{...p,coins:p.coins+coins,pcMissionCoins:paid}:p;
}

function claimQuests(p:Profile,ids:string[]):Profile {
 const ready=questsFor(p).filter(q=>ids.includes(q.id)&&q.progress>=q.goal&&!p.claimedQuests.includes(q.id));
 return {...p,coins:p.coins+ready.reduce((sum,q)=>sum+q.reward,0),claimedQuests:[...p.claimedQuests,...ready.map(q=>q.id)]};
}
function QuestMenu({profile,save,embedded=false}:{profile:Profile;save:(fn:(p:Profile)=>Profile)=>void;embedded?:boolean}) {
 const Panel=embedded?InlinePanel:WishDialog;
  const [missionStatus,setMissionStatus]=useState(()=>window.ChibiGameSync?.missionState||"idle");
  useEffect(()=>{const update=()=>setMissionStatus(window.ChibiGameSync?.missionState||"idle");window.addEventListener("chibi:mission-scores",update);return()=>window.removeEventListener("chibi:mission-scores",update);},[]);

 const [open,setOpen]=useState(false);
 const quests=questsFor(profile),ready=quests.filter(q=>q.progress>=q.goal&&!profile.claimedQuests.includes(q.id));
 const [category,setCategory]=useState("floor");
 return <>
  {!embedded&&<button onClick={()=>setOpen(true)}>Quêtes{ready.length?` · ${ready.length}`:""}</button>}
  {(open||embedded)&&<Panel className="quest-menu" title="Quêtes" close={()=>setOpen(false)}>
   <p>Récompenses uniques · Progression rétroactive</p>
   {profile.floorRecoveryAvailable&&<button className="floor-recovery" onClick={()=>save(p=>({...p,bestFloor:Math.max(p.bestFloor,10),floorRecoveryAvailable:false}))}>Rattraper mon ancien étage 10</button>}
   <div className="quest-tabs">{[["floor","Étages"],["badges","Collection"],["other","Personnages"],["pc","Missions PC"]].map(([id,name])=><button key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{name}</button>)}</div>
   {category==="pc"?<div className="quest-list pc-mission-coins">
    <p>Score PC ÷ 10 = pièces · Crédit automatique</p>
    {missionStatus==="error"&&<p role="alert">Missions PC indisponibles. Les crédits précédents sont conservés ; vérifie la connexion et les règles Firebase.</p>}
    <p>Total reçu : {Object.values(profile.pcMissionCoins).reduce((a,b)=>a+b,0)} pièces</p>
    {Object.keys(profile.pcMissionCoins).length?Object.entries(profile.pcMissionCoins).sort(([a],[b])=>b.localeCompare(a)).map(([day,coins])=><article key={day}><b>{day.split("-").reverse().join("/")}</b><span>{coins} pièces créditées</span></article>):<p>Ouvre le jeu connecté au même compte que sur PC pour récupérer tes missions passées.</p>}
   </div>:<div className="quest-list">{quests.filter(q=>category==="other"?!/^(floor|badges)-/.test(q.id):q.id.startsWith(category+"-")).map(q=>{
    const claimed=profile.claimedQuests.includes(q.id),done=q.progress>=q.goal;
    return <article key={q.id}><div><b>{q.title}</b><small>{Math.min(q.goal,q.progress)} / {q.goal} · {q.reward} pièces</small><progress max={q.goal} value={Math.min(q.goal,q.progress)} aria-label={q.title}/></div>
     <button disabled={claimed||!done} onClick={()=>save(p=>claimQuests(p,[q.id]))}>{claimed?"Récupéré":"Récupérer"}</button></article>;
   })}</div>}
   <div className="dialog-actions"><button disabled={!ready.length} onClick={()=>save(p=>claimQuests(p,questsFor(p).map(q=>q.id)))}>Tout récupérer · {ready.reduce((sum,q)=>sum+q.reward,0)} pièces</button>{!embedded&&<button onClick={()=>setOpen(false)}>Fermer</button>}</div>
  </Panel>}
 </>;
}

// Explicit one-time recovery requested for Cetruc: difficulty tier 5 begins on floor 41.
function applyCetrucRecovery(p:Profile,identity?:{id:string;name:string}):Profile {
 if(!identity||!/^\d{1,25}$/.test(identity.id)||identity.name.normalize("NFKC").trim().toLocaleLowerCase("fr-FR")!=="cetruc")return p;
 const flag=`cetruc-tier-5-v2-${identity.id}`;
 if(p.specialRunRecoveries.includes(flag) || !p.hasPlayed) return p;
  const marked = [...p.specialRunRecoveries, flag];
  if (p.run?.status === "complete" || (p.run?.status === "active" && p.run.wave >= 41)) return {...p, specialRunRecoveries:marked};
  if (p.equipped.filter(Boolean).length!==2||!p.equipped.every(name=>p.loadout[name]?.length))return p;
 const base=newRun(p),run={...base,wave:41,enemies:makeWave(41,base.id)};
 return {...p,run,bestFloor:Math.max(p.bestFloor,41),specialRunRecoveries:marked};
}
function combatFingerprint(p:Profile):string {return JSON.stringify([p.owned,p.equipped,p.loadout,p.xp,p.awakened,p.levels,p.run?[p.run.id,p.run.seq,p.run.status]:null]);}
type GameScreen="home"|"team"|"summon"|"collection"|"quests"|"journal"|"bestiary"|"menu";
function InlinePanel({title,children,className=""}:{title:string;children:React.ReactNode;className?:string;close?:()=>void}) {return <section className={`hub-panel ${className}`}><h2>{title}</h2>{children}</section>;}
function gameFullscreen(){
 if(window.parent!==window){window.parent.postMessage({type:"chibi:fullscreen",action:"toggle"},location.protocol==="file:"?"*":location.origin);return;}
 if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});
}
const hubScreens:[GameScreen,string,string][]=[["home","Accueil","⌂"],["team","Team","♟"],["summon","Invocations","✦"],["collection","Collection","▦"],["menu","Menu","☰"]];
function GameHub({profile,screen,navigate,children}:{profile:Profile;screen:GameScreen;navigate:(screen:GameScreen)=>void;children:React.ReactNode}) {
 const content=React.useRef<HTMLDivElement>(null);
 useEffect(()=>{content.current?.scrollTo({top:0});},[screen]);
 return <div className="game-hub game-shell">
  <header className="hub-header"><button className="hub-brand" onClick={()=>navigate("home")} aria-label="Accueil du jeu">TWEWY <span>REAPERS’ RUN</span></button><div className="hub-wallet"><span aria-label={`${profile.coins} pièces`}><Icon name="coin"/>{profile.coins.toLocaleString("fr-FR")}</span><small>✦ {profile.freeWishes} gratuits</small></div><button className="hub-fullscreen" onClick={gameFullscreen} aria-label="Basculer le plein écran">⛶</button></header>
  <div className="hub-content" ref={content}><div className="hub-screen" key={screen}>{children}</div></div>
  <nav className="hub-nav" aria-label="Navigation du jeu">{hubScreens.map(([id,label,icon])=><button key={id} aria-current={screen===id?"page":undefined} onClick={()=>navigate(id)}><span aria-hidden="true">{icon}</span><b>{label}</b></button>)}</nav>
 </div>;
}
function CharacterDossier({fighter,profile,base=false,rate}:{fighter:Fighter;profile:Profile;base?:boolean;rate?:number}) {
 const owned=profile.owned.includes(fighter.name),reference=base||!owned;
 const stats=trained(fighter,reference?0:profile.xp[fighter.name]||0,!reference&&profile.awakened.includes(fighter.name));
 const rank=reference?0:profile.levels[fighter.name]||0,pin=psychs[basePsych[fighter.name]];
 return <article className="character-dossier" style={{"--character-accent":fighter.accent} as React.CSSProperties}>
  <header><small>{fighter.role}</small><h3>{fighter.name}</h3><TypeChips elements={characterElements[fighter.name]}/></header>
  <div className="dossier-art"><span className="dossier-orbit" aria-hidden="true"/><SpritePreview fighter={fighter} maximumScale={2.6}/><RankBadge level={rank}/></div>
  <div className="dossier-stats"><p>{reference?"Stats de base · Niveau 1 · Rang E":`Ta progression · Niveau ${stats.level} · Rang ${rank===5?"étoile":ranks[rank]}`}</p>
   <dl>{[["PV",stats.maxHp],["ATK",stats.atk],["ATK SPE",stats.mag],["SPE",stats.speed]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
   <div className="dossier-psych"><PinIcon pin={pin}/><span><small>Psych de départ</small><b>{pin.name.replace(" (Pin)","")}</b></span></div>
   {rate!==undefined&&<p className="dossier-rate">Prochain vœu · {(rate*100).toLocaleString("fr-FR",{maximumFractionDigits:3})} %</p>}
   {!reference&&<p>{profile.copies[fighter.name]||0} / 5 doublons{profile.awakened.includes(fighter.name)?" · Éveillé":""}</p>}
  </div>
 </article>;
}
function CharacterCollection({profile}:{profile:Profile}) {
 const [onlyOwned,setOnlyOwned]=useState(false),[selected,setSelected]=useState<Fighter|null>(null);
 return <section className="hub-panel character-collection"><h1>Personnages</h1><p>{profile.owned.length} / {characterRoster.length} débloqués</p>
  <div className="hub-tabs"><button aria-pressed={!onlyOwned} onClick={()=>setOnlyOwned(false)}>Tous</button><button aria-pressed={onlyOwned} onClick={()=>setOnlyOwned(true)}>Débloqués</button></div>
  <div className="character-grid">{characterRoster.filter(f=>!onlyOwned||profile.owned.includes(f.name)).map(f=>{const owned=profile.owned.includes(f.name);return <button key={f.name} className={owned?"":"not-owned"} onClick={()=>setSelected(f)} aria-label={`Fiche de ${f.name}${owned?"":" · Non obtenu"}`}><HudPortrait fighter={f}/><b>{f.name}</b><small>{owned?`Niv. ${experience(profile.xp[f.name]||0).level} · ${ranks[profile.levels[f.name]||0]}`:"Non obtenu"}</small></button>;})}</div>
  {selected&&<WishDialog className="character-sheet-dialog" title={`Fiche · ${selected.name}`} close={()=>setSelected(null)}><CharacterDossier fighter={selected} profile={profile}/><button onClick={()=>setSelected(null)}>Retour à la collection</button></WishDialog>}
 </section>;
}
function HubHome({profile,navigate}:{profile:Profile;navigate:(screen:GameScreen)=>void}) {
 const names=profile.equipped.filter(Boolean),duo=(names.length?names:["NEKU"]).map(name=>characterRoster.find(f=>f.name===name)!);
 const rewards=questsFor(profile).filter(q=>q.progress>=q.goal&&!profile.claimedQuests.includes(q.id)).length;
 return <section className="hub-home"><div className="hub-home-heading"><small>SHIBUYA · REAPERS’ GAME</small><h1>À toi de jouer.</h1><span>Record · Étage {profile.bestFloor} / 100</span></div>
  <div className="hub-home-stage"><div className="hub-home-halo" aria-hidden="true"/>{duo.map(f=><SpritePreview key={f.name} fighter={f} maximumScale={2.5}/>)}</div>
  <button className="hub-play" onClick={()=>navigate("team")}><small>ROGUELIKE</small><b>{profile.run?.status==="active"?`Reprendre · Étage ${profile.run.wave}`:names.length===2?"Préparer le combat":"Former ma Team"}</b><span>100 étages à défier →</span></button>
  <div className="hub-shortcuts"><button onClick={()=>navigate("quests")}><span>◇</span><b>Quêtes</b><small>{rewards?`${rewards} récompense${rewards>1?"s":""}`:"Ta progression"}</small></button><button onClick={()=>navigate("summon")}><span>✦</span><b>Invocations</b><small>{profile.freeWishes} vœux gratuits</small></button><button onClick={()=>navigate("collection")}><span>▦</span><b>Collection</b><small>{profile.owned.length} personnages</small></button></div>
 </section>;
}
function HubMenu({profile,navigate}:{profile:Profile;navigate:(screen:GameScreen)=>void}) {
 return <section className="hub-panel"><h1>Menu</h1><div className="hub-menu-links">{[["bestiary","Bestiaire","Créatures, boss, types et comportements"],["quests","Quêtes","Étages, collection et missions PC"],["journal","Historique des vœux","Résultats, coûts et soldes"],["collection","Collection","Personnages et badges"],["team","Team & psychs","2 personnages · 3 psychs chacun"]].map(([id,title,desc])=><button key={id} onClick={()=>navigate(id as GameScreen)}><b>{title}</b><small>{desc}</small><span aria-hidden="true">›</span></button>)}</div><section className="hub-help"><h2>Guide du jeu</h2><p>Forme une Team de 2 personnages et équipe jusqu’à 3 psychs chacun. Choisis toutes les actions, puis lance le tour : les portraits en haut indiquent l’ordre de vitesse. Touche 2 fois un ennemi pour consulter ses stats.</p><p>Chaque vague vaincue rapporte 5 pièces. Les invocations ont 10 % de chances de donner un personnage et chaque 10e vœu en garantit un. Les taux détaillés et les fiches sont accessibles sur chaque portail.</p><p>Les psychs ne peuvent pas être partagés entre partenaires. Les doublons font progresser le rang d’un personnage jusqu’à l’étoile, à 5 doublons.</p></section></section>;
}

function BestiaryMenu(){
 const [filter,setFilter]=useState("known"),[page,setPage]=useState(0),[selected,setSelected]=useState<FfbeEnemySpec|null>(null);
 const entries=ffbeBestiary.filter(m=>filter==="reserve"?!m.enabled:m.enabled&&(filter==="boss"?m.boss:filter==="regular"?!m.boss:true));
 const pages=Math.max(1,Math.ceil(entries.length/12));
 return <section className="hub-panel monster-book"><h1>Bestiaire</h1><p>{ffbeBestiary.filter(m=>m.enabled).length} entrées identifiées · {ffbeBestiary.filter(m=>!m.enabled).length} en réserve · Animations idle uniquement</p>
  <div className="hub-tabs monster-filters">{[["known","Tous"],["regular","Créatures"],["boss","Boss"],["reserve","À identifier"]].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setPage(0);}}>{label}</button>)}</div>
  <div className="monster-grid">{entries.slice(page*12,page*12+12).map(m=><button key={m.id} onClick={()=>setSelected(m)}><EnemySprite kind={m.id} boss={false}/><b>{m.name||`FFBE #${m.sourceId}`}</b><small>{m.enabled?m.boss?"Boss":"Créature":"Nom à identifier"}</small></button>)}</div>
  <nav className="hub-tabs" aria-label="Pages du bestiaire"><button disabled={!page} onClick={()=>setPage(page-1)} aria-label="Page précédente">‹</button><span>{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(page+1)} aria-label="Page suivante">›</button></nav>
  {selected&&<WishDialog title={selected.name||`FFBE #${selected.sourceId}`} close={()=>setSelected(null)}><div className="monster-preview"><EnemySprite kind={selected.id} boss={selected.boss}/></div><TypeChips elements={selected.elements}/><p>PV de base {selected.hp} · ATK {selected.attack} · SPE {selected.speed}</p><p>{enemyTraitNames[selected.trait]}</p><p>{selected.enabled?`Apparaît à partir du palier ${Math.max(1,selected.tier+1-(selected.boss?2:0))}. Ses stats augmentent avec l’étage.`:"Cette silhouette reste hors des rencontres tant que son nom n’est pas identifié."}</p><small>Identifiant source · {selected.sourceId}</small><button onClick={()=>setSelected(null)}>Fermer</button></WishDialog>}
 </section>;
}

function App() {
  const [profile, displayProfile] = useState(loadProfile);
  const profileRef=React.useRef(profile);profileRef.current=profile;
  const runSignature=React.useRef<string|null>(null);
  const [editingSlot,setEditingSlot]=useState<number|null>(null);
  const [battleLoadout,setBattleLoadout]=useState<Record<string,string[]>>({});
  const [resumeRun,setResumeRun]=useState<RunSave|null>(null);
  const [abandonConfirm,setAbandonConfirm]=useState(false);
  const [party, setParty] = useState<Fighter[] | null>(null);
  const [result, setResult] = useState<Wish[]>([]);
  const [quantity,setQuantity]=useState(1);
  const [portal,setPortal]=useState("shibuya");
  const [phase, setPhase] = useState<"ready" | "rates" | "confirm" | "crank" | "spin" | "drop" | "reveal">("ready");
  const turning = React.useRef(false);
  const [screen,setScreen]=useState<GameScreen>(gachaView?"summon":"home");
  const [rateFighter,setRateFighter]=useState<string|null>(null);
  const navigate=(next:GameScreen)=>{if(turning.current)return;setRateFighter(null);setPhase("ready");setScreen(next);};
  const navigationRef=React.useRef({party,navigate});navigationRef.current={party,navigate};
  useEffect(()=>{
   const receive=(event:MessageEvent)=>{if(event.source!==window.parent||(event.origin!==location.origin&&!(location.protocol==="file:"&&event.origin==="null"))||event.data?.type!=="chibi:game-navigate"||navigationRef.current.party)return;
    if(["home","team","summon","collection","quests","journal","bestiary","menu"].includes(event.data.screen))navigationRef.current.navigate(event.data.screen);
   };
   window.addEventListener("message",receive);
   if(window.parent!==window)window.parent.postMessage({type:"chibi:game-ready"},location.protocol==="file:"?"*":location.origin);
   return()=>window.removeEventListener("message",receive);
  },[]);
  const [saveError, setSaveError] = useState(false);
  useEffect(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem(profileKey)||"null");
      if(saved && (!saved.xp || Object.values(saved.loadout||{}).some(value=>!Array.isArray(value)))) localStorage.setItem(profileKey,JSON.stringify(loadProfile()));
    } catch { setSaveError(true); }
  },[]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === profileKey) displayProfile(loadProfile());
    };
    const cloudLoaded=()=>{
      const incoming=loadProfile(),changed=combatFingerprint(incoming)!==combatFingerprint(profileRef.current);
      if((runSignature.current!==null&&combatFingerprint(incoming)!==runSignature.current)||changed){
        setParty(null);setResult([]);setPhase("ready");turning.current=false;runSignature.current=null;
      }
      displayProfile(incoming);
    };
    window.addEventListener("chibi:save-loaded",cloudLoaded);
    window.addEventListener("storage", sync);
    return () => {window.removeEventListener("storage", sync);window.removeEventListener("chibi:save-loaded",cloudLoaded);};
  }, []);
  const setProfile = (update: (old: Profile) => Profile) => {
    if(window.ChibiGameSync && !window.ChibiGameSync.state.ready)return;
    let current = profile;
    try { if (localStorage.getItem(profileKey)) current = loadProfile(); } catch {}
    const next = assignBasePsychs(update(accrueDailyWishes(applyCetrucRecovery(current,window.ChibiGameSync?.identity))));
    if(JSON.stringify(next)===JSON.stringify(current) && localStorage.getItem(profileKey)===JSON.stringify(next))return;
    try { localStorage.setItem(profileKey, JSON.stringify(next)); setSaveError(false); }
    catch { setSaveError(true); }
    if(runSignature.current!==null&&runSignature.current===combatFingerprint(current))runSignature.current=combatFingerprint(next);
    displayProfile(next);
    window.ChibiGameSync?.save(next);
  };

  useEffect(()=>{
    const credit=()=>setProfile(p=>accrueDailyWishes(p));
    credit();
    const timer=window.setInterval(credit,60000);
    window.addEventListener("focus",credit);document.addEventListener("visibilitychange",credit);
    return ()=>{clearInterval(timer);window.removeEventListener("focus",credit);document.removeEventListener("visibilitychange",credit);};
  },[]);
  useEffect(()=>{
    const credit=()=>{const scores=window.ChibiGameSync?.missionScores;if(scores)setProfile(p=>applyPcMissionCoins(p,scores));};
    window.addEventListener("chibi:mission-scores",credit);credit();
    return ()=>window.removeEventListener("chibi:mission-scores",credit);
  },[]);
  const wishCost = (p:Profile,n=quantity) => wishQuote(p,n).cost;
  useEffect(()=>{
    const prune=(event?:Event)=>{
      const ids=new Set((event as CustomEvent)?.detail?.ids||window.ChibiGameSync?.archivedWishIds||[]);
      if(ids.size)setProfile(p=>({...p,wishEvents:p.wishEvents.filter(e=>!ids.has(e.id))}));
    };
    window.addEventListener("chibi:wish-archived",prune);prune();
    return()=>window.removeEventListener("chibi:wish-archived",prune);
  },[]);
  const price = wishCost(profile);
  const openWish=(id:string,count:number)=>{
    setQuantity(count); setPortal(id); setPhase("confirm");
  };
  const pool=portalPool(portal,profile);
  const guaranteed=profile.wishStep===9;
  const percent=(v:number)=>v.toLocaleString("fr-FR",{style:"percent",maximumFractionDigits:3});
  const portalName=portal==="shibuya"?"First Week #1":portals[portal];
  const closeDialog=()=>setPhase("ready");
  const recruit = (id:string,count:number) => {
    if (turning.current || historyFull(profile)) return;
    const draws:Wish[] = [];
    setProfile(p => {
      if (historyFull(p) || p.coins!==profile.coins || wishCost(p,count)!==price || p.coins<price) return p;
      const quote=wishQuote(p,count);
      const next={...p,wishesMade:p.wishesMade+count,freeWishes:p.freeWishes-quote.free,freeWishSpent:p.freeWishSpent+quote.free,freeWishDaySpent:p.freeWishDaySpent+quote.free,pins:[...p.pins],coins:p.coins-quote.cost,owned:[...p.owned],levels:{...p.levels},copies:{...p.copies}};
      for(let i=0;i<count;i++){
        next.wishStep=(next.wishStep+1)%10;
        if(next.wishStep!==0 && Math.random()>=characterChance){
          const pin=pick(pinList);
          if(!next.pins.includes(pin.id)) next.pins.push(pin.id);
          draws.push({pin});
          continue;
        }
        const name=pick(portalPool(id,next)).name;
        if(next.owned.includes(name)) next.copies[name]=Math.min(5,(next.copies[name]||0)+1);
        else { next.owned.push(name); next.copies[name]=0; }
        next.levels[name]=next.copies[name];
        draws.push({name,rank:next.levels[name],copies:next.copies[name]});
      }
      next.wishEvents=[...p.wishEvents,makeWishEvent(p,next,id,count,quote.free,quote.cost,draws)];
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
  const resume=()=>{const run=loadProfile().run;if(!run||run.status!=="active")return;runSignature.current=combatFingerprint(loadProfile());setResumeRun(run);setBattleLoadout(run.loadout);setParty(run.team);};
  const startRun=()=>{
    let created:RunSave|null=null;
    setProfile(p=>{if(p.run?.status==="active"||p.equipped.filter(Boolean).length!==2||!p.equipped.every(name=>p.loadout[name]?.length))return p;created=newRun(p);return {...p,run:created,hasPlayed:true,bestFloor:Math.max(1,p.bestFloor)};});
    if(created){runSignature.current=combatFingerprint(loadProfile());setResumeRun(created);setBattleLoadout(created.loadout);setParty(created.team);}
  };
  if (party && resumeRun) return <Battle key={resumeRun.id} initialRun={resumeRun} initialTeam={party} loadout={battleLoadout} coins={profile.coins}
    onCheckpoint={(snapshot,gains)=>setProfile(p=>applyRunCheckpoint(p,snapshot,gains))}
    leave={() => { runSignature.current=null;setParty(null);setResumeRun(null);setScreen("team"); setResult([]); }} />;
  const hub=(content:React.ReactNode)=><GameHub profile={profile} screen={screen} navigate={navigate}>{content}</GameHub>;
  if(screen==="home")return hub(<HubHome profile={profile} navigate={navigate}/>);
  if(screen==="menu")return hub(<HubMenu profile={profile} navigate={navigate}/>);
  if(screen==="bestiary")return hub(<BestiaryMenu/>);
  if(screen==="quests")return hub(<QuestMenu embedded profile={profile} save={setProfile}/>);
  if(screen==="journal")return hub(<WishHistory embedded key={window.ChibiGameSync?.accountId||"local"} profile={profile}/>);
  if(screen==="collection")return hub(<><CharacterCollection profile={profile}/><BadgeCatalogue embedded owned={profile.pins}/></>);
  if (screen==="summon") return hub(<main className="game-shell party-lobby"><section>
    <h1>Invocations</h1>
    <p>{profile.coins} pièces · {profile.owned.length} / {characterRoster.length} personnages débloqués · Garantie dans {10-profile.wishStep} {profile.wishStep===9?"vœu":"vœux"}</p>
    {historyFull(profile)&&<p role="status">Synchronise l’historique avant de continuer à invoquer. Tes résultats sont conservés.</p>}
    <div className="lobby-tools"><button onClick={()=>navigate("journal")}>Historique des vœux</button><button onClick={()=>navigate("collection")}>Collection</button><button onClick={()=>navigate("quests")}>Quêtes</button></div>
    <p className="daily-wishes">Vœux gratuits · <b>{profile.freeWishes}</b><small>{parisDay()>=freeWishNoStackDay?"3 par jour · Renouvelés à minuit (Paris)":"10 de départ + 3 par jour · Cumul jusqu’au 24/11 inclus"}</small></p>
    <div className="portal-list">{Object.entries(portals).map(([id,title])=><article key={id} className="portal-card" aria-label={title}>
      <div className={"portal-scene scene-"+id}>
        {id==="shibuya" && !matchMedia("(prefers-reduced-motion: reduce)").matches &&
          <PortalVideo src="./assets/bingo/first-week-clean.mp4" poster="./assets/bingo/first-week-clean.webp"/>}
        {id==="reality" && <>
          {!matchMedia("(prefers-reduced-motion: reduce)").matches && <PortalVideo src="./assets/bingo/from-another-reality.mp4" poster="./assets/bingo/from-another-reality.webp"/>}
        </>}
        {["partners","apocalyptic","destiny"].includes(id) && <div className="portal-duo">{characterRoster.filter(f=>(id==="partners"?["BEAT","JOSHUA"]:id==="apocalyptic"?["2B","A2"]:["SORA","RIKU"]).includes(f.name)).map(f=><SpritePreview key={f.name} fighter={f} maximumScale={1.6}/>)}</div>}
        <h3>{id==="shibuya"?"First Week #1":title}</h3>
        <button className="portal-rates" onClick={()=>{setPortal(id);setRateFighter(null);setPhase("rates");}} aria-label={`Taux de ${id==="shibuya"?"First Week #1":title}`}>Taux</button>
        <div className="bingo-machine">
          <img className="bingo-body" src="./assets/bingo/machine.webp" alt="Bingo Kai"/>
          <span className="bingo-crank" aria-hidden="true"/>
        </div>
        <div className="wish-commands">{[1,10].map(n=><div key={n} className="wish-option">
          <button aria-describedby={`wish-price-${id}-${n}`} disabled={historyFull(profile) || phase!=="ready" || profile.coins<wishCost(profile,n)} onClick={()=>openWish(id,n)}><strong>{n} {n===1?"vœu":"vœux"}</strong></button>
          <span className="wish-price" id={`wish-price-${id}-${n}`} aria-label={`${wishCost(profile,n)} pièces requises`}><Icon name="coin"/><span>× {wishCost(profile,n).toLocaleString("fr-FR")}</span></span>
          {wishQuote(profile,n).free>0&&<small className="wish-free">{wishQuote(profile,n).free} gratuit{wishQuote(profile,n).free>1?"s":""} inclus</small>}
        </div>)}</div>
        <p className="portal-caption">{id==="shibuya" ? "Retrouve Neku, Shiki et les badges psych de Shibuya." : id==="reality" ? "Cloud, Aerith et les badges psych · Des alliés venus d’une autre réalité." : id==="apocalyptic" ? "2B, A2 et les badges psych · Un futur à reconstruire." : id==="destiny" ? "Sora, Riku et les badges psych · Les liens qui traversent les mondes." : "Beat et Joshua ont 2 fois plus de chances d’être recrutés que les autres personnages disponibles."}</p>
      </div>

    </article>)}</div>
    {phase==="rates" && <WishDialog key="rates" className={rateFighter?"character-sheet-dialog":"portal-rates-dialog"} title={rateFighter?`Fiche · ${rateFighter}`:`Taux · ${portalName}`} close={closeDialog}>
      {rateFighter?<><CharacterDossier fighter={characterRoster.find(f=>f.name===rateFighter)!} profile={profile} base rate={pool.filter(x=>x.name===rateFighter).length/pool.length*(guaranteed?1:characterChance)}/><button onClick={()=>setRateFighter(null)}>Retour aux taux</button></>:<>
      <p>Vœu ordinaire · {percent(characterChance)} personnage, {percent(1-characterChance)} badge. Chaque 10e vœu garantit un personnage.</p>
      <h3>Prochain vœu{guaranteed?" · garanti":""}</h3><p>Touche un personnage pour voir sa fiche.</p>
      <div className="rates-character-list">{portalRoster(portal).map(f=><button key={f.name} onClick={()=>setRateFighter(f.name)} aria-label={`Fiche de ${f.name}`}><HudPortrait fighter={f}/><span><b>{f.name}</b><small>Stats & psych de départ</small></span><strong>{percent(pool.filter(x=>x.name===f.name).length/pool.length*(guaranteed?1:characterChance))}</strong><span aria-hidden="true">›</span></button>)}</div>
      <p>Badges psych · <b>{percent(guaranteed?0:1-characterChance)}</b></p>
      <p>Les {pinList.length} badges sont équiprobables. Les taux par personnage sont fixes : obtenir un personnage ou l’éveiller ne modifie pas sa probabilité.</p></>}
      <button onClick={closeDialog}>Fermer</button></WishDialog>}
    {phase==="confirm" && <WishDialog key="confirm" title="Confirmer l’invocation" close={closeDialog}>
      <p>Invoquer sur {portalName} pour {quantity} {quantity===1?"vœu":"vœux"} ?</p>
      <dl><dt>Vœux gratuits utilisés</dt><dd>{wishQuote(profile,quantity).free}</dd><dt>Vœux gratuits restants</dt><dd>{profile.freeWishes-wishQuote(profile,quantity).free}</dd><dt>Solde actuel</dt><dd>{profile.coins} pièces</dd><dt>Coût</dt><dd>{price} pièces</dd><dt>Solde après invocation</dt><dd>{price<=profile.coins?`${profile.coins-price} pièces`:"Solde insuffisant"}</dd></dl>
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
  </section></main>);
  return hub(<main className="game-shell party-lobby"><section><h1>Team</h1>
    <div className="team-slots">{profile.equipped.map((name,index)=>{
      const fighter=characterRoster.find(f=>f.name===name);
      const stats=fighter && trained(fighter,profile.xp[name]||0,profile.awakened.includes(name));
      return <button key={index} aria-label={`Emplacement ${index+1} · ${name||"Choisir un personnage"}`} onClick={()=>setEditingSlot(index)}>
        {fighter && stats ? <><SpritePreview fighter={fighter}/><strong>{name}</strong><TypeChips elements={characterElements[name]}/><RankBadge level={profile.levels[name]}/><small>PV {stats.maxHp}<br/>ATK {stats.atk} · ATK SPE {stats.mag} · SPE {stats.speed}</small><XpProgress xp={stats.xp}/></> : <span aria-hidden="true">+</span>}
      </button>;
    })}</div>
    {editingSlot!==null && <WishDialog title={`Choisir un personnage · ${editingSlot+1} / 2`} close={()=>setEditingSlot(null)}>
      {profile.owned.length===0 && <p>Débloque ton premier personnage dans <a href="../app.html#gacha" target="_top">l’onglet Gacha</a>.</p>}
      <div className="party-list">{characterRoster.filter(f=>profile.owned.includes(f.name)).map(f=><button key={f.name} disabled={profile.equipped[1-editingSlot]===f.name} onClick={()=>chooseFighter(f.name)}>
        <SpritePreview fighter={f}/><strong>{f.name}</strong>{profile.equipped[1-editingSlot]===f.name && <small>Déjà équipé</small>}
      </button>)}</div>
      <div className="dialog-actions">{profile.equipped[editingSlot] && <button onClick={()=>chooseFighter("")}>Retirer</button>}<button onClick={()=>setEditingSlot(null)}>Fermer</button></div>
    </WishDialog>}
    {historyFull(profile)&&<p role="status">Synchronise l’historique avant de continuer à invoquer. Tes résultats sont conservés.</p>}
    <div className="lobby-tools"><button onClick={()=>navigate("journal")}>Historique des vœux</button><button onClick={()=>navigate("collection")}>Collection</button><button onClick={()=>navigate("quests")}>Quêtes</button></div>
    {fighters.map(name=><PsychEquipment key={name} name={name} profile={profile} save={ids=>setProfile(p=>assignBasePsychs({...p,loadout:{...p.loadout,[name]:ids}}))}/>)}
    {fighters.length===2 && !fighters.some(name=>profile.loadout[name]?.some(offensive)) && <p>Équipe au moins un psych offensif.</p>}
    {profile.run?.status==="active"&&<div className="run-resume"><p>Run sauvegardée · Étage {profile.run.wave} · Palier {difficultyAt(profile.run.wave).tier} · {profile.run.team.map(f=>f.name).join(" / ")}</p><button className="pull-button" onClick={resume}>Reprendre l’étage {profile.run.wave}</button><button onClick={()=>setAbandonConfirm(true)}>Abandonner la run</button></div>}
    {profile.run?.status==="lost"&&<p>Run perdue · Une nouvelle run commence à l’étage 1.</p>}
    {abandonConfirm&&<WishDialog title="Abandonner la run ?" close={()=>setAbandonConfirm(false)}><p>La reprise de cette run sera supprimée. Tes personnages, tes badges et tes récompenses déjà gagnées sont conservés.</p><div className="dialog-actions"><button onClick={()=>setAbandonConfirm(false)}>Annuler</button><button onClick={()=>{setProfile(p=>p.run?.status==="active"?{...p,run:{...p.run,status:"abandoned",seq:p.run.seq+1,pending:null,updatedAt:Date.now()}}:p);setAbandonConfirm(false);}}>Abandonner</button></div></WishDialog>}
    <button className="pull-button" disabled={profile.run?.status==="active" || fighters.length!==2 || !fighters.every(name=>profile.loadout[name]?.length) || !fighters.some(name=>profile.loadout[name]?.some(offensive))}
      onClick={startRun}>Lancer le roguelike</button>
    {saveError && <p role="alert">La sauvegarde locale est indisponible dans ce navigateur.</p>}
  </section></main>);
}

function HudPortrait({fighter,enemy}:{fighter?:Fighter;enemy?:Enemy}) {
  const ref=React.useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const context=ref.current?.getContext("2d"),image=new Image();let disposed=false;
    const spec=enemy?enemyCatalog[enemy.kind]:null;
    const width=spec?.frameWidth||fighter?.frameWidth||80,height=spec?.frameHeight||fighter?.frameHeight||116;
    const ready=(image:HTMLImageElement,sx=0,sy=0)=>{
      if(disposed||!context)return;
      const sample=document.createElement("canvas");sample.width=width;sample.height=height;
      const scan=sample.getContext("2d")!;scan.drawImage(image,sx,sy,width,height,0,0,width,height);
      let left=width,right=0,top=height,bottom=0;
      try{const pixels=scan.getImageData(0,0,width,height).data;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>64){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}catch{left=0;right=width;top=0;bottom=height;}
      const crop=Math.max(1,Math.min(width,(bottom-top+1)*.45)),x=Math.max(0,Math.min(width-crop,(fighter?.portraitCenter??(left+right)/2)-crop/2));
      context.imageSmoothingEnabled=false;context.clearRect(0,0,64,64);context.drawImage(image,sx+x,sy+(fighter?.portraitTop??top),crop,crop,0,0,64,64);
    };
    if(spec?.atlasFrames){const [page,x,y]=spec.atlasFrames[0];ffbePage(page).then(image=>ready(image,x,y)).catch(()=>{});}else{image.onload=()=>ready(image);image.src=enemy?`./assets/game/enemy-atlases/${enemy.kind}.png`:fighter!.sprite;}
    return ()=>{disposed=true;};
  },[fighter?.sprite,enemy?.kind]);
  return <canvas ref={ref} width={64} height={64} aria-hidden="true"/>;
}
type PlannedAction = {kind:"psych"|"guard"|"burst";pin?:string;target?:number};
type TurnEntry = {key:string;side:"ally"|"enemy";name:string;speed:number;id?:number;target?:string};
function turnOrder(team:Fighter[],enemies:Enemy[],turn:number):TurnEntry[] {
  const living=team.filter(f=>f.hp>0);
  return [
    ...living.map(f=>({key:f.name,side:"ally" as const,name:f.name,speed:f.speed||0})),
    ...enemies.filter(e=>e.hp>0).map((e,i)=>({key:`enemy-${e.id}`,side:"enemy" as const,name:e.name,id:e.id,speed:e.speed,target:(e.trait==="hunter"?[...living].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]:living[(turn-1+i)%living.length])?.name}))
  ].sort((a,b)=>b.speed-a.speed || (a.side===b.side?0:a.side==="ally"?-1:1));
}
const planCost=(plan?:PlannedAction)=>plan?.kind==="psych"?psychs[plan.pin!]?.cost||0:0;
const planName=(plan?:PlannedAction)=>!plan?"Choisir une action":plan.kind==="guard"?"Défense":plan.kind==="burst"?"Sync Burst":psychs[plan.pin!].name;

function Battle({ initialRun,initialTeam,loadout,coins,onCheckpoint,leave }:{initialRun:RunSave;initialTeam:Fighter[];loadout:Record<string,Psych[]>;coins:number;onCheckpoint:(snapshot:RunSave,gains?:RunGains)=>void;leave:()=>void}) {
  const checkpointSeq=React.useRef(initialRun.seq);
  const [fullscreen,setFullscreen]=useState(false);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{if(event.source===window.parent && event.data?.type==="chibi:fullscreen-state")setFullscreen(Boolean(event.data.active));};
    const sync=()=>setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("message",receive);document.addEventListener("fullscreenchange",sync);
    return ()=>{window.removeEventListener("message",receive);document.removeEventListener("fullscreenchange",sync);if(window.parent!==window)window.parent.postMessage({type:"chibi:fullscreen",action:"exit"},"*");};
  },[]);
  const toggleFullscreen=async()=>{
    if(window.parent!==window){window.parent.postMessage({type:"chibi:fullscreen",action:"toggle"},"*");return;}
    if(document.fullscreenElement){await document.exitFullscreen();setFullscreen(false);}
    else {try{await document.documentElement.requestFullscreen();}catch{}setFullscreen(true);}
  };
  const [orderDetail,setOrderDetail]=useState<string|null>(null);
  const [inspectedId,setInspectedId]=useState<number|null>(null);
  const lastTap=React.useRef({id:-1,time:0});
  const awarded=React.useRef(new Set<number>(initialRun.awarded));
  const clearedWave=React.useRef(initialRun.reward);
  const [earnedXp,setEarnedXp]=useState(initialRun.earnedXp);
  const [wave, setWave] = useState(initialRun.wave);
  const [team, setTeam] = useState(initialTeam);
  const [enemies, setEnemies] = useState(initialRun.enemies);
  const [selected, setSelected] = useState(initialRun.enemies.find(e=>e.hp>0)?.id||initialRun.wave*10);
  const [energy, setEnergy] = useState(initialRun.energy);
  const [groove, setGroove] = useState(initialRun.groove);

  const [turn, setTurn] = useState(initialRun.turn);
  const [message, setMessage] = useState("Choisis 1 action par personnage, puis lance le tour.");
  const [busy, setBusy] = useState(false);
  const [hitFeedback,setHitFeedback]=useState<{side:string;target:string;label:string}|null>(null);
  const [impact, setImpact] = useState<number | null>(null);
  const [loot,setLoot]=useState<string[]>(initialRun.loot);
  const [dropReveal,setDropReveal]=useState<Wish[]>([]);
  const [reward, setReward] = useState(initialRun.reward);
  const [actor, setActor] = useState("");

  const [activeAction, setActiveAction] = useState<Action>(null);

  const inspected=enemies.find(enemy=>enemy.id===inspectedId);
  function selectEnemy(enemy:Enemy) {
    if(enemy.hp<=0) return;
    setSelected(enemy.id);
    const time=performance.now();
    if(lastTap.current.id===enemy.id && time-lastTap.current.time<=400) {
      setInspectedId(enemy.id);
      lastTap.current={id:-1,time:0};
    } else lastTap.current={id:enemy.id,time};
  }
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

  const [plans,setPlans]=useState<Record<string,PlannedAction>>({});
  const [chooser,setChooser]=useState<string|null>(null);
  const [targetPin,setTargetPin]=useState<string|null>(null);
  const [queue,setQueue]=useState<TurnEntry[]>([]);
  const [queueIndex,setQueueIndex]=useState(-1);
  const running=React.useRef(false);
  const generation=React.useRef(0);
  useEffect(()=>()=>{generation.current++;},[]);
  const livingTeam=team.filter(f=>f.hp>0);
  const order=busy?queue:turnOrder(team,enemies,turn);
  const reserved=livingTeam.reduce((sum,f)=>sum+planCost(plans[f.name]),0);
  const ready=livingTeam.length>0 && livingTeam.every(f=>plans[f.name]) && reserved<=energy;
  const choosing=team.find(f=>f.name===chooser);
  const otherCost=livingTeam.filter(f=>f.name!==chooser).reduce((sum,f)=>sum+planCost(plans[f.name]),0);
  const burstReserved=Object.entries(plans).some(([name,p])=>name!==chooser&&p.kind==="burst");
  const openChooser=(name:string)=>{if(busy||reward)return;setTargetPin(null);setChooser(name);};
  const choose=(plan:PlannedAction)=>{
    if(!chooser||busy||planCost(plan)+otherCost>energy)return;
    setPlans(old=>({...old,[chooser]:plan}));setChooser(null);setTargetPin(null);
  };
  const resetPlanning=()=>{setPlans({});setQueue([]);setQueueIndex(-1);setChooser(null);setTargetPin(null);setActor("");setActiveAction(null);setImpact(null);setHitFeedback(null);};
  const saveCheckpoint=(snapshot:Omit<RunSave,"version"|"id"|"seq"|"updatedAt"|"loadout">,gains:RunGains={})=>onCheckpoint({...snapshot,version:1,id:initialRun.id,seq:++checkpointSeq.current,updatedAt:Date.now(),loadout},gains);
  const resolveRound=async(recovery:RunPending|null=null)=>{
    if(running.current||busy||reward||(!recovery&&!ready))return;
    running.current=true;
    const token=generation.current;
    const steps=recovery?.steps||turnOrder(team,enemies,turn);
    const choices=recovery?.choices||{...plans};
    let fighters=team.map(f=>({...f})),monsters=enemies.map(e=>({...e})),en=recovery?energy:energy-reserved,sync=groove;
    const shields=new Map<string,number>(recovery?.shields||[]);
    const performed=new Set<string>(recovery?.performed||[]);
    const drops:Pin[]=[];
    let xp=0;
    const pause=()=>new Promise(resolve=>setTimeout(resolve,700));
    const publish=()=>{setTeam([...fighters]);setEnemies([...monsters]);setEnergy(en);setGroove(sync);};
    const healParty=(amount:number)=>{fighters=fighters.map(f=>f.hp>0?{...f,hp:Math.min(f.maxHp,f.hp+amount)}:f);};
    const passiveBonus=(pattern:RegExp,base:number)=>Math.max(0,...fighters.filter(f=>f.hp>0).flatMap(f=>(loadout[f.name]||[]).map(id=>psychs[id]).filter(pin=>pattern.test(pin.psych)).map(pin=>base*pinRankMultiplier(pin))));
    const persist=(pending:RunPending|null,gains:RunGains={},nextTurn=turn)=>saveCheckpoint({status:fighters.every(f=>f.hp<=0)?"lost":wave===100&&monsters.every(e=>e.hp<=0)?"complete":"active",wave,turn:nextTurn,team:fighters,enemies:monsters,energy:en,groove:sync,reward:monsters.every(e=>e.hp<=0),earnedXp:earnedXp+xp,loot:[...loot,...drops.map(pin=>pin.name)],awarded:[...awarded.current],pending:fighters.every(f=>f.hp<=0)||monsters.every(e=>e.hp<=0)?null:pending},gains);
    setBusy(true);setQueue(steps);setEnergy(en);
    persist({steps,choices,index:recovery?.index||0,shields:[...shields],performed:[...performed]});
    for(let index=recovery?.index||0;index<steps.length;index++){
      if(token!==generation.current)return;
      if(!monsters.some(e=>e.hp>0)||!fighters.some(f=>f.hp>0))break;
      const gains:RunGains={};
      const step=steps[index];
      setQueueIndex(index);setHitFeedback(null);setImpact(null);setActiveAction(null);setActor("");
      if(step.side==="enemy"){
        const attacker=monsters.find(e=>e.id===step.id)!;
        if(attacker.hp<=0)continue;
        const target=fighters.find(f=>f.name===step.target&&f.hp>0)||fighters.find(f=>f.hp>0)!;
        const attackType=enemyElements[attacker.kind][0],scale=effectiveness(attackType,characterElements[target.name]);
        const damage=Math.random()<Math.min(.30,(target.speed||0)/200)?0:typedDamage(Math.max(3,Math.round(enemyAttackPower(attacker)*(1-(shields.get(target.name)||0)))),attackType,characterElements[target.name]);
        setHitFeedback({side:"ally",target:target.name,label:scale===0?"Sans effet":`${damage} PV · ${affinityText(scale)}`});
        fighters=fighters.map(f=>f.name===target.name?{...f,hp:Math.max(0,f.hp-damage)}:f);
        if(attacker.trait==="vampire"&&damage>0)monsters=monsters.map(e=>e.id===attacker.id?{...e,hp:Math.min(e.maxHp,e.hp+Math.ceil(damage*.15))}:e);
        sync=Math.min(100,sync+12);
        setMessage(damage?`${attacker.name} attaque ${target.name} · −${damage} PV`:`${target.name} esquive ${attacker.name}.`);
      }else{
        const fighter=fighters.find(f=>f.name===step.name)!;
        const plan=choices[step.name];
        if(fighter.hp<=0)continue;
        performed.add(fighter.name);
        setActor(fighter.name);
        if(plan.kind==="guard"){
          shields.set(fighter.name,Math.max(shields.get(fighter.name)||0,.55));en=Math.min(3,en+1);setActiveAction("guard");
          setMessage(`${fighter.name} se protège jusqu’à la fin du tour · +1 EN`);
        }else if(plan.kind==="burst"){
          sync=0;monsters=monsters.map(e=>({...e,hp:Math.max(0,e.hp-enemyDamageTaken(e,typedDamage(58,"normal",enemyElements[e.kind])))}));setActiveAction("burst");
          setMessage(`${fighter.name} · Sync Burst · 58 dégâts sur tous les ennemis !`);
        }else{
          const pin=psychs[plan.pin!];
          if(pin.kind==="heal"){
            const amount=scaledPinEffect(pin,(fighter.mag||1)*pin.power/50*(1+passiveBonus(/^Cure Boost/,.3)));
            healParty(amount);setActiveAction("heal");setMessage(`${fighter.name} · ${pin.name} · +${amount} PV au duo`);
          }else if(pin.kind==="guard"||pin.kind==="support"){
            fighters.filter(f=>f.hp>0).forEach(f=>shields.set(f.name,Math.max(shields.get(f.name)||0,pinShieldReduction(pin))));
            if(pin.kind==="support"){
              if(/Turbo|Supply/.test(pin.psych))en=Math.min(3,en+scaledPinEffect(pin,2));
              else if(/Cure Boost|Subconscious|Life/.test(pin.psych))healParty(scaledPinEffect(pin,(fighter.mag||1)/2));
              else sync=Math.min(100,sync+scaledPinEffect(pin,18));
            }
            setActiveAction("guard");setMessage(`${fighter.name} · ${pin.name} · Duo protégé pour ce tour`);
          }else{
            const target=monsters.find(e=>e.id===plan.target&&e.hp>0)||monsters.find(e=>e.hp>0)!;
            const physical=pin.kind==="physical";
            const amount=scaledPinEffect(pin,(physical?fighter.atk||1:fighter.mag||1)*(.7+pin.power/100));
            const scale=effectiveness(pin.element!,enemyElements[target.kind]);
            const damage=enemyDamageTaken(target,typedDamage(Math.max(1,Math.round(amount*(1+passiveBonus(/^Resonance/,.15)))+Math.floor(Math.random()*7)-3),pin.element!,enemyElements[target.kind]));
            setHitFeedback({side:"enemy",target:String(target.id),label:scale===0?"Sans effet":`${damage} dégâts · ${affinityText(scale)}`});
            monsters=monsters.map(e=>e.id===target.id?{...e,hp:Math.max(0,e.hp-damage)}:e);
            if(pin.drain)healParty(Math.ceil(damage/4));
            sync=Math.min(100,sync+18);setSelected(target.id);setImpact(target.id);setActiveAction(physical?"shockwave":"pyro");
            setMessage(`${fighter.name} · ${pin.name} → ${target.name} · ${damage} dégâts`);
          }
        }
        const defeated=monsters.filter(e=>e.hp<=0&&!awarded.current.has(e.id));
        defeated.forEach(e=>awarded.current.add(e.id));
        const earned=defeated.reduce((sum,e)=>sum+e.xp,0);
        if(earned){xp+=earned;gains.xp=earned;fighters=fighters.map(f=>gainExperience(f,earned));}
        const found=defeated.filter(()=>Math.random()<.25).map(()=>pick(pinList));
        if(found.length){drops.push(...found);gains.pins=found.map(pin=>pin.id);}
      }
      if(monsters.every(e=>e.hp<=0)&&!clearedWave.current){clearedWave.current=true;gains.victory=true;}
      persist({steps,choices,index:index+1,shields:[...shields],performed:[...performed]},gains);
      publish();await pause();
    }
    if(token!==generation.current)return;
    const unused=Object.entries(choices).reduce((sum,[name,plan])=>sum+(performed.has(name)?0:planCost(plan)),0);
    en=Math.min(3,en+unused+2);persist(null,{},fighters.some(f=>f.hp>0)&&monsters.some(e=>e.hp>0)?turn+1:turn);publish();resetPlanning();
    if(xp)setEarnedXp(old=>old+xp);
    if(drops.length){setLoot(old=>[...old,...drops.map(pin=>pin.name)]);setDropReveal(drops.map(pin=>({pin})));}
    if(!monsters.some(e=>e.hp>0)){
      setReward(true);
      setMessage("Vague terminée !");
    }else if(fighters.some(f=>f.hp>0)){
      setTurn(old=>old+1);setMessage("Choisis 1 action par personnage, puis lance le tour.");
    }
    setBusy(false);running.current=false;
  };

  useEffect(()=>{if(initialRun.pending){const timer=setTimeout(()=>resolveRound(initialRun.pending),0);return()=>clearTimeout(timer);}},[]);
  const nextWave = () => {
    if(wave>=maxFloor||busy||!reward)return;
    const next=wave+1,heal=difficultyAt(next).tier>difficultyAt(wave).tier;
    const nextTeam=team.map(f=>({...f,hp:heal?f.maxHp:f.hp})),nextEnemies=makeWave(next,initialRun.id);
    saveCheckpoint({status:"active",wave:next,turn:1,team:nextTeam,enemies:nextEnemies,energy,groove,reward:false,earnedXp:0,loot:[],awarded:[],pending:null});
    setTeam(nextTeam);
    resetPlanning();
    setLoot([]);
    setEarnedXp(0);
    setInspectedId(null);
    lastTap.current={id:-1,time:0};
    awarded.current.clear();
    clearedWave.current=false;
    setWave(next);
    setTurn(1);
    setEnemies(nextEnemies);
    setSelected(next * 10);
    setReward(false);
    setMessage(heal?`Palier ${difficultyAt(next).tier} · Team entièrement soignée.`:`Étage ${next} · PV conservés.`);
  };

  const teamDefeated = team.every((fighter) => fighter.hp <= 0);
  const routeStart = Math.floor((wave - 1) / 5) * 5 + 1;
  const sector = Math.floor((wave - 1) / 5) + 1;

  return (
    <main className="game-shell combat-hud">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">R</div>
          <div>
            <strong>REAPER'S RUN</strong>
            <span>SHIBUYA / DAY 01</span>
          </div>
        </div>
        <div className="run-stats">
          <button className="fullscreen-button" onClick={toggleFullscreen} aria-pressed={fullscreen}>{fullscreen?"Quitter plein écran":"Plein écran"}</button>
          <span>
            <Icon name="star" /> SCORE <b>{String((wave - 1) * 2350).padStart(6, "0")}</b>
          </span>
          <span className="currency"><Icon name="coin" /> {coins}</span>
          <button className="currency" disabled={busy} onClick={leave} title="Mettre la run en pause et revenir à Team">Mon duo</button>
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
                <HudPortrait fighter={fighter} />
              </div>
              <div className="fighter-info">
                <small>{fighter.role}</small>
                <h2>{fighter.name}</h2><TypeChips elements={characterElements[fighter.name]}/>
                <XpProgress xp={fighter.xp||0}/>
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
            <button disabled={groove < 100 || busy || reward || teamDefeated} onClick={()=>openChooser(livingTeam[0].name)}>
              <Icon name="bolt" /> SYNC BURST
            </button>
          </div>
          <div className="energy-card" aria-label={`Énergie disponible : ${busy?energy:energy-(chooser?otherCost:reserved)} sur 3`}>
            <div><span>ÉNERGIE</span><b>{busy?energy:energy-(chooser?otherCost:reserved)} / 3 EN</b></div>
            <div className="energy-pips" aria-hidden="true">{[0,1,2].map(pip=><i key={pip} className={pip<(busy?energy:energy-(chooser?otherCost:reserved))?"full":""}/>)}</div>
          </div>
        </aside>

        <section className="battle-column">
          <div className="battle-heading">
            <div>
              <small>ENCOUNTER</small>
              <h1>ÉTAGE {String(wave).padStart(2, "0")} <small className="tier-label">Palier {difficultyAt(wave).tier} / 10</small></h1>
            </div>
            <div className={`threat threat-${threat.toLowerCase()}`}>
              <span>THREAT</span>
              <b>{threat}</b>
            </div>
          </div>

          <nav className="turn-order" aria-label={`Ordre du tour ${turn}, selon la SPE`}>
            <span className="hud-turn">Tour {turn}</span>
            <ol>{order.map((entry,index)=>{
              const fighter=team.find(f=>f.name===entry.name),enemy=enemies.find(e=>e.id===entry.id);
              const description=`${index+1}. ${entry.name} · SPE ${entry.speed} · ${entry.side==="enemy"?`Attaque → ${entry.target}`:planName(plans[entry.name])}`;
              return <li key={entry.key} className={`${entry.side} ${busy&&index===queueIndex?"playing":""} ${busy&&index<queueIndex?"played":""}`} aria-current={busy&&index===queueIndex?"step":undefined}>
                <button title={description} aria-label={description} onClick={()=>setOrderDetail(entry.key)}><HudPortrait fighter={fighter} enemy={enemy}/><span className="turn-number">{index+1}</span></button>
              </li>;
            })}</ol>
          </nav>
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
                  onClick={()=>targetPin&&!busy?choose({kind:"psych",pin:targetPin,target:enemy.id}):selectEnemy(enemy)}
                  onDoubleClick={()=>enemy.hp>0 && setInspectedId(enemy.id)}
                  aria-label={`${enemy.name} · ${enemy.hp} / ${enemy.maxHp} PV. Deux appuis pour les statistiques.`}
                  title="Deux appuis pour les statistiques"
                >
                  <EnemySprite kind={enemy.kind} boss={enemy.boss} combat />
                  {hitFeedback?.side==="enemy"&&hitFeedback.target===String(enemy.id)&&<span className="hit-feedback" key={queueIndex}>{hitFeedback.label}</span>}
                  <span className="enemy-hp" aria-hidden="true"><i style={{width:`${100*enemy.hp/enemy.maxHp}%`}}/></span>

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
                  {hitFeedback?.side==="ally"&&hitFeedback.target===fighter.name&&<span className="hit-feedback" key={queueIndex}>{hitFeedback.label}</span>}
                </div>
              ))}
            </div>
            <p className="combat-status" role="status">{message}</p>

          </div>

          <section className={`round-planner ${choosing?"choosing-action":""}`} aria-label="Préparer les actions">
            {choosing?<div key={`${choosing.name}-${targetPin||"actions"}`} className="inline-action-menu" aria-label={`Actions de ${choosing.name}`}>
        {targetPin?<>
          <p><b>{psychs[targetPin].name}</b> · Choisir la cible</p>
          <div className="target-menu">{livingEnemies.map((enemy,i)=><button key={enemy.id} onClick={()=>choose({kind:"psych",pin:targetPin,target:enemy.id})}>
            <HudPortrait enemy={enemy}/><b>{enemy.name}</b><span>{enemy.hp} / {enemy.maxHp} PV · {affinityText(effectiveness(psychs[targetPin].element!,enemyElements[enemy.kind]))}</span><TypeChips elements={enemyElements[enemy.kind]}/>
          </button>)}</div>

          <button onClick={()=>setTargetPin(null)}>Retour aux actions</button>
        </>:<>
          <div className="psych-action-menu">{(loadout[choosing.name]||[]).map(id=>{
            const pin=psychs[id];return <button key={id} disabled={pin.cost+otherCost>energy} onClick={()=>offensive(id)?setTargetPin(id):choose({kind:"psych",pin:id})}>
              <PinIcon pin={pin}/><b>{pin.name}</b><span>{elementNames[pin.element||badgeElement(pin)]} · {types[pin.kind]} · {pin.cost} EN</span>
            </button>;
          })}
          <button onClick={()=>choose({kind:"guard"})}><Icon name="guard"/><b>Défense</b><span>0 EN · Protection · +1 EN</span></button>
          {groove>=100&&<button disabled={burstReserved} onClick={()=>choose({kind:"burst"})}><Icon name="bolt"/><b>Sync Burst</b><span>100% Groove · Tous les ennemis</span></button>}
          </div>
          <button onClick={()=>setChooser(null)}>Annuler</button>
        </>}
            </div>:<>
            <div className="planned-actions">{team.map(f=>{
              const plan=plans[f.name],target=enemies.find(e=>e.id===plan?.target);
              return <button key={f.name} disabled={busy||reward||f.hp<=0} onClick={()=>openChooser(f.name)}>
                <b>{f.name}</b><span>{f.hp<=0?"K.O.":planName(plan)}</span>
                <small>{plan?(target?`→ ${target.name}`:plan.kind==="guard"?"Protection personnelle":"Duo / tous les ennemis"):"Choisir"}</small>
                {plan&&<small>{planCost(plan)} EN · Modifier</small>}
              </button>;
            })}</div>
            <button className="resolve-round" disabled={busy||reward||!ready||teamDefeated} onClick={()=>resolveRound()}>{busy?"Tour en cours…":"Lancer le tour"}</button>
            </>}
          </section>
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
            <p>Prépare les actions du duo et leurs cibles. La SPE détermine l’ordre. À 100% de Groove, choisis Sync Burst dans les actions.</p>
            <a href="https://twewy.fandom.com/wiki/TWEWY/Pin_List" target="_blank" rel="noreferrer">
              PIN DATABASE ↗
            </a>
          </div>
        </aside>
      </section>

      {orderDetail && <WishDialog title="Ordre du tour" close={()=>setOrderDetail(null)}>
        {(()=>{const entry=order.find(e=>e.key===orderDetail);return entry?<p><b>{entry.name}</b> · SPE {entry.speed}<br/>{entry.side==="enemy"?`Attaque → ${entry.target}`:planName(plans[entry.name])}</p>:<p>Cette action est terminée.</p>;})()}
        <button className="fullscreen-button" onClick={()=>setOrderDetail(null)}>Fermer</button>
      </WishDialog>}
      {inspected && <WishDialog title={inspected.name} close={()=>setInspectedId(null)}>
        <div className="enemy-inspection"><EnemySprite kind={inspected.kind} boss={inspected.boss}/></div>
        <dl><dt>Niveau</dt><dd>{inspected.level}</dd><dt>PV</dt><dd>{inspected.hp} / {inspected.maxHp}</dd>
          <dt>ATK</dt><dd>{inspected.attack}</dd><dt>SPE</dt><dd>{inspected.speed}</dd><dt>XP par personnage</dt><dd>{inspected.xp}</dd><dt>Éléments</dt><dd><TypeChips elements={enemyElements[inspected.kind]}/></dd><dt>Type</dt><dd>{inspected.boss?"Boss":"Noise"}</dd></dl>
        <button className="pull-button" onClick={()=>setInspectedId(null)}>Fermer</button>
      <p>{enemyTraitNames[inspected.trait||"none"]}</p></WishDialog>}
      {dropReveal.length>0 && <WishDialog title="Butin de combat" close={()=>setDropReveal([])}>
        <RewardReveal draws={dropReveal} close={()=>setDropReveal([])}/>
      </WishDialog>}
      {loot.length>0 && <p role="status">Psychs récupérés · {loot.join(", ")}</p>}
      {reward && (
        <div className="overlay">
          <div className="modal reward-modal">
            <small>WAVE {String(wave).padStart(2, "0")} COMPLETE</small>
            <h2>{wave===maxFloor?"Étage 100 · Ascension terminée !":"CHOOSE YOUR DROP"}</h2>
            <p>+5 pièces · +{earnedXp} XP par personnage.</p>
            {loot.length>0 && <p>Psychs récupérés · {loot.join(", ")}</p>}
            {wave<maxFloor?<><p>{difficultyAt(wave+1).tier>difficultyAt(wave).tier?"Nouveau palier : soin complet de la Team.":"Les PV sont conservés. Prochain soin au changement de palier."}</p><button className="fullscreen-button" onClick={nextWave}>Continuer · Étage {wave+1}</button></>:<button className="fullscreen-button" onClick={leave}>Retour à Team · Voir les quêtes</button>}
          </div>
        </div>
      )}

      {teamDefeated && !busy && (
        <div className="overlay">
          <div className="modal game-over">
            <small>RUN TERMINATED</small>
            <h2>ERASED</h2>
            <p>You reached wave {wave}. The streets will remember your score.</p>
            <p>La reprise de cette run a été supprimée.</p><button onClick={leave}>Retour à Team</button>
          </div>
        </div>
      )}
    </main>
  );
}


// Delegated feedback also applies to future game and gacha buttons.
document.addEventListener("click",event=>{
  const button=(event.target as Element)?.closest?.("button");
  if(!button || button.disabled || matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  button.animate([{filter:"brightness(1.23)"},{filter:"brightness(1)"}],{duration:240,easing:"ease-out"});
},true);
function SaveBoundary() {
  const [catalogReady,setCatalogReady]=useState(ffbeBestiary.length>0),[catalogError,setCatalogError]=useState(false);
  useEffect(()=>{
    if(catalogReady)return;
    let disposed=false;const script=document.createElement("script");script.src="./bestiary.js?v=ffbe1";
    script.onload=()=>{if(disposed)return;if(typeof ffbeEnemyList!=="undefined"&&ffbeEnemyList.length){ffbeBestiary.push(...ffbeEnemyList);registerFfbeEntries();setCatalogReady(true);}else setCatalogError(true);};
    script.onerror=()=>{if(!disposed)setCatalogError(true);};document.head.appendChild(script);
    return()=>{disposed=true;script.remove();};
  },[catalogReady]);
  const [status,setStatus]=useState(()=>window.ChibiGameSync?.state||{ready:true,kind:"local",message:""});
  useEffect(()=>{const update=()=>setStatus({...window.ChibiGameSync.state});window.addEventListener("chibi:save-state",update);return()=>window.removeEventListener("chibi:save-state",update);},[]);
  if(!catalogReady)return <main className="game-shell party-lobby"><section><h1>Bestiaire</h1><p role="status">{catalogError?"Chargement des données indisponible. Ta sauvegarde reste intacte.":"Chargement du bestiaire…"}</p>{catalogError&&<button onClick={()=>location.reload()}>Réessayer</button>}</section></main>;
  if(!status.ready)return <main className="game-shell party-lobby"><section><h1>Progression</h1><p role="status">{status.message}</p><p>La progression du téléphone est prioritaire. Aucune sauvegarde locale n’a été supprimée.</p><button onClick={()=>location.reload()}>Réessayer</button><a href="../app.html" target="_top">Retour à l’application</a></section></main>;
  return <>{status.kind!=="synced"&&status.kind!=="saving"&&status.message&&<p className="save-sync-notice" role="status">{status.message}</p>}<App/></>;
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SaveBoundary));






