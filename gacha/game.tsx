declare global { interface Window { ChibiGameSync?: any; ChibiPvp?: any; ChibiSocial?: any; } }
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
const characterElements:Record<string,ElementType[]>={NEKU:["psychic"],SHIKI:["normal"],BEAT:["fighting"],JOSHUA:["psychic","flying"],CLOUD:["fighting","steel"],AERITH:["grass","fairy"],"2B":["steel","fighting"],A2:["steel","dark"],SORA:["normal","fairy"],RIKU:["dark","psychic"],NOCTIS:["dark","steel"],PROMPTO:["electric"],IGNIS:["fire"],GLADIO:["rock","fighting"],X:["steel","electric"],SONIC:["normal","electric"],ZERO:["steel","fire"],SHADOW:["dark","psychic"],KNUCKLES:["fighting","ground"],TAILS:["flying","electric"],MARLUXIA:["grass","dark"],LEXAEUS:["rock","fighting"],AXEL:["fire","dark"],LARXENE:["electric","dark"]};
type PassiveKind="physical"|"special"|"burst"|"all";
type CharacterPassive={name:string;description:string;damageKind?:PassiveKind;damageBonus?:number;damageCondition?:"lowHp"|"partnerAlive";defense?:number;dodge?:number;healing?:number};
const characterPassives:Record<string,CharacterPassive>={
 NEKU:{name:"Psych Sync",description:"Ses psychs frappent 10 % plus fort.",damageKind:"special",damageBonus:.10},
 SHIKI:{name:"Mr. Mew protecteur",description:"Les soins de Shiki rendent 15 % de PV supplémentaires.",healing:.15},
 BEAT:{name:"Street Brawler",description:"Ses attaques physiques infligent 10 % de dégâts supplémentaires.",damageKind:"physical",damageBonus:.10},
 JOSHUA:{name:"Contrôle du temps",description:"Sa maîtrise du temps lui donne 12 % de chances d’esquiver une attaque.",dodge:.12},
 CLOUD:{name:"Bravoure désespérée",description:"Sous la moitié de ses PV, ses attaques physiques gagnent 20 % de puissance.",damageKind:"physical",damageBonus:.20,damageCondition:"lowHp"},
 AERITH:{name:"Vent guérisseur",description:"Les soins d’Aerith rendent 20 % de PV supplémentaires.",healing:.20},
 "2B":{name:"Protocole YoRHa",description:"Son blindage réduit de 10 % les dégâts reçus.",defense:.10},
 A2:{name:"Mode berserk",description:"Sous la moitié de ses PV, ses attaques infligent 20 % de dégâts supplémentaires.",damageKind:"all",damageBonus:.20,damageCondition:"lowHp"},
 SORA:{name:"Liens du cœur",description:"Tant que son partenaire tient debout, ses attaques gagnent 10 % de puissance.",damageKind:"all",damageBonus:.10,damageCondition:"partnerAlive"},
 RIKU:{name:"Gardien des ténèbres",description:"Sa résistance aux ténèbres réduit de 12 % les dégâts reçus.",defense:.12},
 NOCTIS:{name:"Roi éveillé",description:"Son Sync Burst inflige 15 % de dégâts supplémentaires.",damageKind:"burst",damageBonus:.15},
 PROMPTO:{name:"Tir précis",description:"Ses psychs infligent 12 % de dégâts supplémentaires.",damageKind:"special",damageBonus:.12},
 IGNIS:{name:"Stratège royal",description:"Sa préparation réduit de 10 % les dégâts qu’il reçoit.",defense:.10},
 GLADIO:{name:"Bouclier du roi",description:"Réduit de 16 % les dégâts qu’il reçoit.",defense:.16},
 X:{name:"Tir chargé",description:"Ses psychs infligent 10 % de dégâts supplémentaires.",damageKind:"special",damageBonus:.10},
 SONIC:{name:"Vitesse supersonique",description:"Sa vitesse lui donne 15 % de chances d’esquiver une attaque.",dodge:.15},
 ZERO:{name:"Z-Saber",description:"Ses attaques physiques infligent 12 % de dégâts supplémentaires.",damageKind:"physical",damageBonus:.12},
 SHADOW:{name:"Chaos Control",description:"Le Chaos Control lui donne 12 % de chances d’esquiver une attaque.",dodge:.12},
 KNUCKLES:{name:"Poings de l’échidné",description:"Ses attaques physiques infligent 15 % de dégâts supplémentaires.",damageKind:"physical",damageBonus:.15},
 TAILS:{name:"Génie mécanicien",description:"Ses soins rendent 15 % de PV supplémentaires.",healing:.15},
 MARLUXIA:{name:"Faucheur floral",description:"Ses psychs infligent 12 % de dégâts supplémentaires.",damageKind:"special",damageBonus:.12},
 LEXAEUS:{name:"Puissance terrestre",description:"Ses attaques physiques infligent 18 % de dégâts supplémentaires.",damageKind:"physical",damageBonus:.18},
 AXEL:{name:"Rafale de flammes",description:"Ses psychs infligent 12 % de dégâts supplémentaires.",damageKind:"special",damageBonus:.12},
 LARXENE:{name:"Éclair fulgurant",description:"Ses psychs infligent 10 % de dégâts supplémentaires.",damageKind:"special",damageBonus:.10}
};
function passiveDamageMultiplier(name:string,kind:PassiveKind,hp?:number,maxHp?:number,partnerAlive=true):number {const p=characterPassives[name];if(!p?.damageBonus||p.damageKind!==kind&&p.damageKind!=="all")return 1;if(p.damageCondition==="lowHp"&&(hp===undefined||maxHp===undefined||hp/maxHp>.5))return 1;if(p.damageCondition==="partnerAlive"&&!partnerAlive)return 1;return 1+p.damageBonus;}
function passiveDamageReduction(name:string):number {return characterPassives[name]?.defense||0;}
function passiveDodgeChance(name:string):number {return characterPassives[name]?.dodge||0;}
function passiveHealingMultiplier(name:string):number {return 1+(characterPassives[name]?.healing||0);}
function deterministicChance(chance:number,key:string):boolean {let hash=2166136261;for(let i=0;i<key.length;i++)hash=Math.imul(hash^key.charCodeAt(i),16777619);return (hash>>>0)/4294967296<chance;}
function stabMultiplier(fighter:Fighter,pin:Pin):number {return ["physical","special"].includes(pin.kind)&&characterElements[fighter.name]?.includes(pin.element||badgeElement(pin))?1.2:1;}
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
 const signatureElements:Record<string,ElementType>={"x-buster":"electric","sonic-wind":"flying","z-saber":"steel","chaos-spear":"psychic","meteor-punch":"fighting","energy-ball":"electric","graceful-dahlia":"grass",skysplitter:"rock","eternal-flames":"fire","fulgurant-lightning":"electric"};
 if(signatureElements[pin.id.replace(/^signature-/,"")])return signatureElements[pin.id.replace(/^signature-/,"")];
 if(pin.id==="armiger")return "steel";
 if(pin.id==="machinery")return "electric";
 if(pin.id==="elemental-daggers")return "fire";
 if(pin.id==="shield-of-the-king")return "rock";
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
  battleRank?:number;
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
  {name:"X",role:"MAVERICK HUNTER",hp:140,maxHp:140,sprite:"./assets/game/x-idle.png",accent:"#39a7ff",frames:10,frameWidth:122,frameHeight:116},
  {name:"SONIC",role:"SPEED HERO",hp:118,maxHp:118,sprite:"./assets/game/sonic-idle.png",accent:"#176cff",frames:7,frameWidth:152,frameHeight:156},
  {name:"ZERO",role:"MAVERICK HUNTER",hp:136,maxHp:136,sprite:"./assets/game/zero-idle.png",accent:"#ff3b32",frames:4,frameWidth:177,frameHeight:168},
  {name:"SHADOW",role:"ULTIMATE LIFEFORM",hp:128,maxHp:128,sprite:"./assets/game/shadow-idle.png",accent:"#d9273e",frames:6,frameWidth:213,frameHeight:204},
  {name:"KNUCKLES",role:"GUARDIAN",hp:148,maxHp:148,sprite:"./assets/game/knuckles-idle.png",accent:"#ed3037",frames:6,frameWidth:178,frameHeight:194},
  {name:"TAILS",role:"MECHANIC",hp:110,maxHp:110,sprite:"./assets/game/tails-idle.png",accent:"#ffb52f",frames:9,frameWidth:130,frameHeight:90},
  {name:"MARLUXIA",role:"ORGANISATION XIII",hp:132,maxHp:132,sprite:"./assets/game/marluxia-idle.png",accent:"#e980b6",frames:4,frameWidth:296,frameHeight:292},
  {name:"LEXAEUS",role:"ORGANISATION XIII",hp:160,maxHp:160,sprite:"./assets/game/lexaeus-idle.png",accent:"#c36b38",frames:8,frameWidth:174,frameHeight:204},
  {name:"AXEL",role:"ORGANISATION XIII",hp:138,maxHp:138,sprite:"./assets/game/axel-idle.png",accent:"#ff4e32",frames:6,frameWidth:217,frameHeight:170},
  {name:"LARXENE",role:"ORGANISATION XIII",hp:112,maxHp:112,sprite:"./assets/game/larxene-idle.png",accent:"#ffe43b",frames:5,frameWidth:198,frameHeight:369},
  {name:"NOCTIS",role:"LUCIS",hp:130,maxHp:130,sprite:"./assets/game/noctis-idle.png",accent:"#586d9d",frames:16,frameWidth:56,frameHeight:77,portraitCenter:28,portraitTop:5},
  {name:"PROMPTO",role:"CROWNSGUARD",hp:108,maxHp:108,sprite:"./assets/game/prompto-idle.png",accent:"#f5d36b",frames:4,frameWidth:54,frameHeight:76,portraitCenter:27,portraitTop:5},
  {name:"IGNIS",role:"CROWNSGUARD",hp:114,maxHp:114,sprite:"./assets/game/ignis-idle.png",accent:"#b8a56d",frames:4,frameWidth:56,frameHeight:79,portraitCenter:28,portraitTop:6},
  {name:"GLADIO",role:"CROWNSGUARD",hp:148,maxHp:148,sprite:"./assets/game/gladio-idle.png",accent:"#9a724e",frames:4,frameWidth:75,frameHeight:83,portraitCenter:38,portraitTop:7},
  {name:"2B",role:"YORHA",hp:128,maxHp:128,sprite:"./assets/game/2b-idle.png",accent:"#d2cce0",frames:4,frameWidth:176,frameHeight:160,portraitCenter:88,portraitTop:40},
  {name:"A2",role:"YORHA",hp:132,maxHp:132,sprite:"./assets/game/a2-idle.png",accent:"#b8b1be",frames:4,frameWidth:144,frameHeight:160,portraitCenter:72,portraitTop:40},
  {name:"SORA",role:"KEYBLADE",hp:122,maxHp:122,sprite:"./assets/game/sora-idle.png",accent:"#ffd25c",frames:4,frameWidth:144,frameHeight:160,portraitCenter:72,portraitTop:40},
  {name:"RIKU",role:"KEYBLADE",hp:126,maxHp:126,sprite:"./assets/game/riku-idle.png",accent:"#9b9ce9",frames:4,frameWidth:144,frameHeight:160,portraitCenter:72,portraitTop:40},

  {name:"CLOUD",portraitCenter:64,role:"EX-SOLDAT",hp:138,maxHp:138,sprite:"./assets/game/cloud-idle.png",accent:"#88b9ff",frames:20,frameWidth:128,frameHeight:116},
  {name:"AERITH",portraitCenter:40,role:"CETRA",hp:104,maxHp:104,sprite:"./assets/game/aerith-idle.png",accent:"#ffb1c5",frames:4,frameWidth:80,frameHeight:116},

  { name: "NEKU", role: "PSYCH USER", hp: 118, maxHp: 118, sprite: nekuSprite, accent: "#ff5f29", frames: 6, frameWidth: 80, frameHeight: 116, attackSprite: nekuAttackSprite, attackFrames: 7 },
  { name: "BEAT", role: "BRAWLER", hp: 142, maxHp: 142, sprite: beatSprite, accent: "#f8d742", frames: 6, frameWidth: 80, frameHeight: 116, attackSprite: beatAttackSprite, attackFrames: 5 },
  { name: "SHIKI", role: "THREAD USER", hp: 108, maxHp: 108, sprite: shikiSprite, accent: "#ff70ae", frames: 3, frameWidth: 80, frameHeight: 116, attackSprite: shikiAttackSprite, attackFrames: 7 },
  { name: "JOSHUA", role: "ANGEL USER", hp: 96, maxHp: 96, sprite: joshuaSprite, accent: "#92dcce", frames: 6, frameWidth: 32, frameHeight: 72, portraitCenter:16, portraitTop:0 },
];
// Visible opaque bounds of the idle frames. Source sheets use very different
// resolutions and transparent margins, so native pixels cannot define size.
const fighterVisualBounds:Record<string,[number,number]>={
  X:[70,92],SONIC:[104,132],ZERO:[129,144],SHADOW:[155,180],KNUCKLES:[130,170],TAILS:[82,66],
  MARLUXIA:[248,268],LEXAEUS:[124,180],AXEL:[169,146],LARXENE:[140,345],
  NOCTIS:[42,66],PROMPTO:[42,66],IGNIS:[42,68],GLADIO:[65,73],"2B":[119,142],A2:[96,128],
  SORA:[108,102],RIKU:[89,103],CLOUD:[86,92],AERITH:[75,90],NEKU:[46,98],BEAT:[71,94],SHIKI:[45,92],JOSHUA:[27,56]
};
const fighterDisplayScale:Record<string,number>={X:.82,SONIC:.82,ZERO:.82,SHADOW:.82,KNUCKLES:.82,TAILS:.82};
// Eos is scheduled for a later reveal: retain its data and portals, but do not expose it yet.
const hiddenCollectionAndEventCharacters = new Set(["NOCTIS","PROMPTO","IGNIS","GLADIO"]);
const secondWaveReleaseAt=Date.parse("2026-12-01T00:00:00+01:00");
const secondWaveCharacters=new Set(["X","SONIC","ZERO","SHADOW","KNUCKLES","TAILS","MARLUXIA","LEXAEUS","AXEL","LARXENE"]);
const visibleCollectionRoster = () => characterRoster.filter(f=>!hiddenCollectionAndEventCharacters.has(f.name)&&(!secondWaveCharacters.has(f.name)||Date.now()>=secondWaveReleaseAt));


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
const eventHeroes:Record<string,Fighter>=Object.fromEntries(characterRoster.map(f=>["event-"+f.name,f]));
for(const [kind,f] of Object.entries(eventHeroes)){
  enemyCatalog[kind]={name:f.name,frames:f.frames||1,frameWidth:f.frameWidth||80,frameHeight:f.frameHeight||116,hp:f.maxHp,attack:1};
  enemyElements[kind]=characterElements[f.name];
}
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
      atlas.onload=()=>{if(disposed)return;draw();if(!matchMedia("(prefers-reduced-motion: reduce)").matches)timer=window.setInterval(()=>{frame=(frame+1)%spec.frames;draw();},1000/Math.min(spec.frames,8));};atlas.src=eventHeroes[kind]?.sprite||`./assets/game/enemy-atlases/${kind}.png`;
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
  const nightmare=Math.max(0,wave-49);
  const hpWall=nightmare?1.8+(nightmare-1)*.035:1;
  const attackWall=nightmare?1.55+(nightmare-1)*.025:1;
  return {tier:tier+1,hp:(1.35+tier*.85+tier*tier*.08+step*.07)*hpWall,
    attack:(1.30+tier*.32+tier*tier*.025+step*.025)*attackWall,
    xp:1+tier*.48+tier*tier*.025+step*.04,speed:tier*3+Math.floor(step/3)+(nightmare?8+Math.floor(nightmare/4):0),
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
  const [visualWidth,visualHeight]=fighterVisualBounds[fighter.name]||[fighter.frameWidth||80,fighter.frameHeight||116];
  React.useLayoutEffect(()=>{
    const element=ref.current!;
    const displayScale=fighterDisplayScale[fighter.name]||1;
    const fit=()=>{setScale(Math.min(maximumScale*100/visualHeight*displayScale,element.clientWidth/visualWidth,element.clientHeight/visualHeight));};
    fit();const observer=new ResizeObserver(fit);observer.observe(element);
    return()=>observer.disconnect();
  },[fighter.name,visualWidth,visualHeight,maximumScale]);
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
  const visualHeight=(fighterVisualBounds[fighter.name]||[0,fighter.frameHeight||116])[1];

  return (
    <div
      className={`pixel-sprite hero-sprite hero-${fighter.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")} ${frameCount ? `sprite-frames-${frameCount}` : ""} ${isAttacking ? "attack-sprite" : ""}`}
      style={{
        backgroundImage: `url(${sprite})`,
        "--fighter-normalize": `${100/visualHeight*(fighterDisplayScale[fighter.name]||1)}`,
        ...(frameCount ? { backgroundSize: `${frameCount * 100}% 100%` } : {}),
        ...(fighter.frameWidth ? { width: `${fighter.frameWidth}px`, height: `${fighter.frameHeight}px` } : {}),
      } as React.CSSProperties}
      role="img"
      aria-label={fighter.name}
    />
  );
}

type Pin = { element?:ElementType; grade?:string; target?:"single"|"aoe"; id:string; number:string; name:string; psych:string; kind:string; power:number; drain:boolean; row:number; col:number; cost:number };
// Rank scales the effect once; base wiki power and saved inventories stay unchanged.
const pinRankScales:Record<string,number>={"---":1,E:.8,D:.9,C:1,B:1.15,A:1.3,Reaper:1.45,Angel:1.6};
function pinRankMultiplier(pin:Pin):number {return pinRankScales[pin.grade||""]??1;}
function scaledPinEffect(pin:Pin,base:number):number {return base>0?Math.max(1,Math.round(base*pinRankMultiplier(pin))):0;}
function pinShieldReduction(pin:Pin):number {return Math.min(.75,.55*pinRankMultiplier(pin));}
function PinRankInfo({pin}:{pin:Pin}) {
 const label=pin.grade&&pin.grade!=="---"?`Classe ${pin.grade}`:"Sans classe";
 return <span>{label} · Effets ×{pinRankMultiplier(pin).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")}</span>;
}
declare const pinList: Pin[];
const basePsych:Record<string,string> = {NEKU:"pin266", SHIKI:"groove-pawn", BEAT:"sk8-combo", JOSHUA:"joshua-phone",CLOUD:"buster-sword",AERITH:"healing-wind","2B":"virtuous-contract",A2:"type-40-blade",SORA:"kingdom-key",RIKU:"way-to-dawn",NOCTIS:"armiger",PROMPTO:"machinery",IGNIS:"elemental-daggers",GLADIO:"shield-of-the-king",X:"x-buster",SONIC:"sonic-wind",ZERO:"z-saber",SHADOW:"chaos-spear",KNUCKLES:"meteor-punch",TAILS:"energy-ball",MARLUXIA:"graceful-dahlia",LEXAEUS:"skysplitter",AXEL:"eternal-flames",LARXENE:"fulgurant-lightning"};
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
  {id:"armiger",name:"Armiger",psych:"Armes royales",kind:"physical",power:31},
  {id:"machinery",name:"Machinery",psych:"Tir de précision",kind:"special",power:27},
  {id:"elemental-daggers",name:"Elemental Daggers",psych:"Lames élémentaires",kind:"special",power:29},
  {id:"shield-of-the-king",name:"Shield of the King",psych:"Bouclier royal",kind:"physical",power:33},
  {id:"x-buster",name:"X-Buster",psych:"Tir chargé",kind:"special",power:32},
  {id:"sonic-wind",name:"Sonic Wind",psych:"Vortex Saber",kind:"special",power:30,target:"aoe"},
  {id:"z-saber",name:"Z-Saber",psych:"Burst Sword",kind:"physical",power:35,target:"aoe"},
  {id:"chaos-spear",name:"Chaos Spear",psych:"Piercing Pillar",kind:"special",power:34,target:"aoe"},
  {id:"meteor-punch",name:"Meteor Punch",psych:"Massive Hit",kind:"physical",power:36},
  {id:"energy-ball",name:"Energy Ball",psych:"Energy Rounds",kind:"special",power:29},
  {id:"graceful-dahlia",name:"Graceful Dahlia",psych:"Entanglement",kind:"special",power:34,target:"aoe"},
  {id:"skysplitter",name:"Skysplitter",psych:"Earthquake",kind:"physical",power:38,target:"aoe"},
  {id:"eternal-flames",name:"Eternal Flames",psych:"Pyrokinesis",kind:"special",power:35,target:"aoe"},
  {id:"fulgurant-lightning",name:"Fulgurant Lightning",psych:"Thundercloud",kind:"special",power:35,target:"aoe"},
].map(pin=>({...pin,number:"",row:-1,col:0,drain:false,cost:1} as Pin));
const psychs: Record<string, Pin> = Object.fromEntries([...pinList,...partnerPsychs].map(pin => [pin.id,{...pin,element:badgeElement(pin)}]));
const signaturePins:Record<string,Pin>=Object.fromEntries(characterRoster.map(hero=>{
 const base=psychs[basePsych[hero.name]];
 const pin={...base,id:"signature-"+base.id,grade:"A",name:base.name.replace(" (Pin)","")+" · Signature",number:"★"};
 psychs[pin.id]=pin;return [hero.name,pin];
}));
const collectionPins=[...pinList,...Object.values(signaturePins)];
type Psych = string;
const types = { physical:"ATK", special:"ATK SPE", heal:"Soin", guard:"Protection", support:"Soutien" };
function PinIcon({ pin }: {pin:Pin}) {
  if(pin.row<0) return <i aria-hidden="true" style={{display:"grid",placeItems:"center",width:28,height:28,borderRadius:"50%",background:"var(--indigo)",color:"white",fontStyle:"normal"}}>{{"groove-pawn":"♟","sk8-combo":"★","joshua-phone":"☎","buster-sword":"⚔","healing-wind":"✿","virtuous-contract":"⚔","type-40-blade":"⚔","kingdom-key":"✦","way-to-dawn":"☾",armiger:"✧",machinery:"⌁","elemental-daggers":"♨","shield-of-the-king":"⬟","x-buster":"◎","sonic-wind":"◉","z-saber":"⚔","chaos-spear":"✦","meteor-punch":"◆","energy-ball":"●","graceful-dahlia":"✿",skysplitter:"⬢","eternal-flames":"♨","fulgurant-lightning":"ϟ"}[pin.id.replace(/^signature-/,"")]||"✦"}</i>;
  return <i aria-hidden="true" style={{display:"inline-block",width:28,height:28,flex:"none",imageRendering:"pixelated",backgroundImage:`url(./assets/pins/row-${pin.row}.webp)`,backgroundPosition:`-${pin.col*28}px 0`}}/>;
}
const portals = { shibuya:"Shibuya", partners:"Partenaires",reality:"From another reality",apocalyptic:"Apocalyptic Future",destiny:"Destiny Islands",eosDawn:"Eos · Noctis & Prompto",eosDusk:"Eos · Ignis & Gladio",sonicx:"Final Fantasy Sonic X",xiii:"XIII" };
const portalReleaseAt:Record<string,number>={eosDawn:Date.parse("2026-11-25T00:00:00+01:00"),eosDusk:Date.parse("2026-11-25T00:00:00+01:00"),sonicx:secondWaveReleaseAt,xiii:secondWaveReleaseAt};
const portalAvailable=(id:string)=>!portalReleaseAt[id]||Date.now()>=portalReleaseAt[id];
const bases:Record<string,number[]> = { NEKU:[24,32,14], SHIKI:[22,26,20], BEAT:[34,18,12], JOSHUA:[19,36,16],CLOUD:[36,21,15],AERITH:[16,38,18],"2B":[32,24,21],A2:[35,21,19],SORA:[29,29,20],RIKU:[27,32,21],NOCTIS:[32,25,20],PROMPTO:[20,34,22],IGNIS:[24,32,19],GLADIO:[38,17,13],X:[30,34,18],SONIC:[32,28,30],ZERO:[38,25,21],SHADOW:[34,36,28],KNUCKLES:[40,18,17],TAILS:[20,36,25],MARLUXIA:[28,38,22],LEXAEUS:[42,16,12],AXEL:[32,36,24],LARXENE:[24,40,30] };
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
  const oldLevel=(f.level||1)-1,newLevel=progress.level-1;
  const scale=1.2**(f.battleRank||0),[atk,mag,speed]=bases[f.name],hpBase=characterRoster.find(hero=>hero.name===f.name)!.maxHp;
  const delta=(base:number,step:number)=>Math.round((base+newLevel*step)*scale)-Math.round((base+oldLevel*step)*scale);
  const hpGain=delta(hpBase,5);
  return {...f,xp:progress.xp,level:progress.level,atk:f.atk+delta(atk,2),mag:f.mag+delta(mag,2),speed:f.speed+delta(speed,1),maxHp:f.maxHp+hpGain,hp:f.hp>0?f.hp+hpGain:0};
}
function XpProgress({xp}:{xp:number}) {
  const p=experience(xp);
  return <div className="xp-progress"><span>Niv. {p.level} · {p.required?`${p.current} / ${p.required} XP`:"MAX"}</span>
    <progress aria-label="Progression du niveau" max={p.required||1} value={p.required?p.current:1}/></div>;
}
function trained(f:Fighter, xp:number, awake:boolean, rank=0) {
  const progress=experience(xp), n=progress.level-1, [atk,mag,speed]=bases[f.name];
  const scale=(v:number)=>Math.round(v*1.2**rank);
  const maxHp=scale(f.maxHp+n*5)+(awake?20:0);
  return {...f,xp:progress.xp,level:progress.level,battleRank:rank,atk:scale(atk+n*2),mag:scale(mag+n*2),speed:scale(speed+n),hp:maxHp,maxHp};
}
const gachaView = new URLSearchParams(location.search).get("vue") === "gacha";
const ranks = ["E", "D", "C", "B", "A", "etoile"];
function RankBadge({ level }: { level: number }) {
  return <img className="rank-badge" src={`./assets/bingo/rang-${ranks[level]}.webp`} alt={`Rang ${level === 5 ? "étoile" : ranks[level]}`} />;
}
type Wish = { pin: Pin } | { name:string; rank:number; copies:number };
function pick<T,>(items:T[]):T { return items[Math.floor(Math.random()*items.length)]; }
const offensive = (id:string) => ["physical","special"].includes(psychs[id]?.kind);
const pinGradeWeights:Record<string,number>={"---":36,C:27,B:18,A:10,Reaper:6,Angel:3};
function pinGrade(pin:Pin):string{return pin.grade&&pin.grade!=="---"?pin.grade:"---";}
function rebirthGradeWeight(grade:string,weight:number,rebirths=0):number {
 const boost=1+Math.min(8,Math.max(0,rebirths))*.5;
 return grade==="Angel"||grade==="Reaper"?weight*boost:grade==="A"?weight*Math.sqrt(boost):weight;
}
function weightedPinPick(rebirths=0):Pin {
 const groups=Object.entries(pinGradeWeights).map(([grade,weight])=>({grade,weight:rebirthGradeWeight(grade,weight,rebirths),pins:pinList.filter(pin=>pinGrade(pin)===grade)})).filter(group=>group.pins.length);
 const total=groups.reduce((sum,group)=>sum+group.weight,0),roll=Math.random()*total;
 let cursor=0;for(const group of groups){cursor+=group.weight;if(roll<cursor)return pick(group.pins);}return pick(groups.at(-1)!.pins);
}
function pinGradeRates(rebirths=0):{grade:string;rate:number}[]{
 const active=Object.entries(pinGradeWeights).filter(([grade])=>pinList.some(pin=>pinGrade(pin)===grade)).map(([grade,weight])=>[grade,rebirthGradeWeight(grade,weight,rebirths)] as [string,number]),total=active.reduce((sum,[,weight])=>sum+weight,0);
 return active.map(([grade,weight])=>({grade,rate:weight/total}));
}
function pinTargetMode(pin:Pin):"single"|"aoe" {
 if(pin.target)return pin.target;
 return /Earthquake|Pyrokinesis|Explosion|Time Bomb|Pressure Mine|Thundercloud|Street Jam|Piercing Pillar|Psychokinesis|Vortex Saber|Entanglement|Bullet Sword|Burst Sword|Sweeper|Black Hole|Flame Blast|Discharge|Shockwave/i.test(pin.psych)?"aoe":"single";
}
function pinTargetLabel(pin:Pin):string {return ["physical","special"].includes(pin.kind)?pinTargetMode(pin)==="aoe"?"AoE":"Monocible":"Duo";}
function PinTargetBadge({pin}:{pin:Pin}) {return <span className={`badge-target badge-target-${pinTargetLabel(pin).toLowerCase()}`}>{pinTargetLabel(pin)}</span>;}
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
   <p><b>{portals[selected.portal]||selected.portal}</b> · {new Date(selected.at).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR",{timeZone:"Europe/Paris"})}</p>
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
    <b>{event.count} {event.count>1?"vœux":"vœu"} · {portals[event.portal]||event.portal}</b>
    <small>{new Date(event.at).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR",{timeZone:"Europe/Paris"})} · {event.freeUsed} gratuits · {event.coinsPaid} pièces</small>
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
type RunGains={xp?:number;pins?:string[];victory?:boolean;defeated?:number;bursts?:number};
function validRun(raw:any,owned:string[],copies:Record<string,number>={},awakened:string[]=[]):RunSave|null {
 try{
  const integer=(n:any,min:number,max:number)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  if(!raw||raw.version!==1||typeof raw.id!=="string"||!/^[a-zA-Z0-9-]{1,100}$/.test(raw.id)||!integer(raw.seq,0,1000000)||!["active","lost","complete","abandoned"].includes(raw.status)||!integer(raw.wave,1,100)||!integer(raw.turn,1,100000)||!integer(raw.energy,0,3)||!integer(raw.groove,0,100)||JSON.stringify(raw).length>18000)return null;
  if(!Array.isArray(raw.team)||raw.team.length!==2||new Set(raw.team.map((f:any)=>f.name)).size!==2)return null;
  const team=raw.team.map((f:any)=>{const base=characterRoster.find(b=>b.name===f.name);if(!base||!owned.includes(f.name)||!["hp","maxHp","atk","mag","speed","xp","level"].every(k=>integer(f[k],k==="hp"||k==="xp"?0:1,10000000))||f.hp>f.maxHp)throw Error();const oldRank=integer(f.battleRank,0,5)?f.battleRank:0;
    if(raw.status==="active" && copies[f.name]>oldRank){
      const current=trained(base,f.xp,awakened.includes(f.name),copies[f.name]);
      return {...current,hp:f.hp>0?Math.max(1,Math.round(current.maxHp*f.hp/f.maxHp)):0};
    }
    return {...base,battleRank:oldRank,...Object.fromEntries(["hp","maxHp","atk","mag","speed","xp","level"].map(k=>[k,f[k]]))} as Fighter;});
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
 return {version:1,id,seq:0,status:"active",updatedAt:Date.now(),wave:1,turn:1,team:names.map(name=>trained(characterRoster.find(f=>f.name===name)!,profile.xp[name]||0,profile.awakened.includes(name),profile.copies[name]||0)),enemies:makeWave(1,id),loadout:Object.fromEntries(names.map(name=>[name,[...profile.loadout[name]]])),energy:3,groove:28,reward:false,earnedXp:0,loot:[],awarded:[],pending:null};
}
function rollbackRunToTierSix(run:RunSave):RunSave {
 const wave=51;
 return {...run,seq:run.seq+1,updatedAt:Date.now(),wave,turn:1,
  team:run.team.map(f=>({...f,hp:f.maxHp})),enemies:makeWave(wave,run.id),
  energy:3,reward:false,earnedXp:0,loot:[],awarded:[],pending:null};
}
function applyRunCheckpoint(p:Profile,snapshot:RunSave,gains:RunGains={}):Profile {
 if(!p.run||p.run.id!==snapshot.id||p.run.status!=="active"||snapshot.seq<=p.run.seq)return p;
 const xp={...p.xp};if(gains.xp)for(const f of snapshot.team)xp[f.name]=experience((xp[f.name]||0)+gains.xp).xp;
 const rebirthUnlock=snapshot.wave===100&&snapshot.status==="complete"&&gains.victory&&!p.rebirthReady;
 return advanceDailyProgress(grantPins({...p,run:snapshot,xp,coins:p.coins+(gains.victory?5:0)+(rebirthUnlock?5000:0),rebirthReady:p.rebirthReady||rebirthUnlock,hasPlayed:true,bestFloor:Math.max(p.bestFloor,snapshot.wave),floorRecoveryAvailable:p.floorRecoveryAvailable&&snapshot.wave<10},gains.pins||[]),gains);
}

type DailyQuestProgress={waves:number;enemies:number;bursts:number};
type Profile = { dailyQuestDay:string;dailyQuestProgress:DailyQuestProgress;claimedDailyQuests:string[];eventRun?:EventSave|null; specialRunRecoveries:string[]; run:RunSave|null; wishEvents:WishEvent[]; wishHistoryStartedAt:number; wishHistoryBaseline:number; freeWishVersion:number; freeWishSpent:number; freeWishDaySpent:number; pcMissionCoins:Record<string,number>; starterNekuGranted:boolean; starterWishesGranted:boolean; hasPlayed:boolean; wishesMade:number; freeWishes:number; lastFreeWishDay:string; bestFloor:number; rebirths:number; rebirthReady:boolean; claimedQuests:string[]; floorRecoveryAvailable:boolean; pins:string[]; pinCopies:Record<string,number>; wishStep:number; copies:Record<string,number>; xp:Record<string,number>; levels: Record<string, number>; awakened: string[]; awakenedMultiRefunds:Record<string,number>; owned: string[]; equipped: string[]; loadout: Record<string, Psych[]>; coins: number };
const profileKey = "chibi.reapers-run.party.v1";

function grantPins(profile:Profile,ids:string[]):Profile {
 const pinCopies={...profile.pinCopies},pins=[...profile.pins];
 for(const id of ids){if(!psychs[id])continue;if(!pins.includes(id))pins.push(id);pinCopies[id]=Math.max(0,pinCopies[id]||0)+1;}
 return {...profile,pins,pinCopies};
}

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
  const refunds={...(profile.awakenedMultiRefunds||{})};let retroactiveWishes=0;
  for(const name of profile.awakened.filter(name=>counts[name]===5)){
    const pulls=(profile.wishEvents||[]).flatMap(event=>{try{return (JSON.parse(event.drawsJson) as any[]).filter(draw=>draw?.name===name);}catch{return [];}}),maxedAt=pulls.findIndex(draw=>Number(draw.copies)>=5),earned=Math.max(0,maxedAt<0?0:pulls.length-maxedAt-1),already=Math.max(0,Math.floor(Number(refunds[name])||0));
    if(earned>already){retroactiveWishes+=(earned-already)*10;refunds[name]=earned;}
  }
  profile={...profile,copies:counts,levels:{...counts},awakened:profile.awakened.filter(name=>counts[name]===5),awakenedMultiRefunds:refunds,freeWishes:profile.freeWishes+retroactiveWishes};
  const pins=[...profile.pins];
  if(profile.owned.includes("NEKU") && !pins.includes(basePsych.NEKU)) pins.push(basePsych.NEKU);
  const pinCopies={...profile.pinCopies};pins.forEach(id=>pinCopies[id]=Math.max(1,Math.floor(Number(pinCopies[id])||0)));
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
  return {...profile,pins,pinCopies,loadout};
}
function loadProfile(): Profile {
  try {
    const saved = JSON.parse(localStorage.getItem(profileKey) || "null");
    const owned = characterRoster.map(f => f.name).filter(name => saved.owned.includes(name));
    const equipped=[0,1].map(i=>{
      const name=saved.equipped?.[i];
      return owned.includes(name) && (i===0 || name!==saved.equipped[0]) ? name : "";
    });
    const pins = [...new Set<string>(Array.isArray(saved.pins) ? saved.pins : Object.values(saved.loadout || {}).flat())].filter(id=>psychs[id]&&(psychs[id].row>=0||id.startsWith("signature-")));
    const pinCopies=Object.fromEntries(pins.map(id=>[id,Math.max(1,Math.min(999999,Math.floor(Number(saved.pinCopies?.[id])||1)))]));
    const copies=Object.fromEntries(owned.map(name=>{
      const value=saved.copies?.[name];
      // An explicit duplicate count is authoritative; only old saves lacking it use legacy star data.
      const count=value!==undefined && Number.isFinite(Number(value))?Math.min(5,Math.max(0,Math.floor(Number(value)))):
        saved.awakened?.includes(name)||Number(saved.levels?.[name])===5?5:0;
      return [name,count];
    }));
    const wishStep = Number.isInteger(saved.wishStep) && saved.wishStep >= 0 && saved.wishStep < 100 ? saved.wishStep : 0;
    const bestFloor=Math.min(100,Math.max(0,Math.floor(Number(saved.bestFloor??saved.highestFloor??0)||0)));
    const legacyRebirthUnlock=saved.rebirthReady===undefined&&bestFloor>=100;
    if (Number.isSafeInteger(saved.coins) && saved.coins >= 0) return accrueDailyWishes(refreshDailyQuests(assignBasePsychs({dailyQuestDay:typeof saved.dailyQuestDay==="string"?saved.dailyQuestDay:"",dailyQuestProgress:{waves:Math.max(0,Math.floor(Number(saved.dailyQuestProgress?.waves)||0)),enemies:Math.max(0,Math.floor(Number(saved.dailyQuestProgress?.enemies)||0)),bursts:Math.max(0,Math.floor(Number(saved.dailyQuestProgress?.bursts)||0))},claimedDailyQuests:Array.isArray(saved.claimedDailyQuests)?[...new Set<string>(saved.claimedDailyQuests.filter((id:any)=>typeof id==="string"))]:[],specialRunRecoveries:Array.isArray(saved.specialRunRecoveries)?[...new Set<string>(saved.specialRunRecoveries.filter(id=>typeof id==="string"&&id.length<100))]:[],eventRun:readEvent(saved.eventRun,owned,copies,Array.isArray(saved.awakened)?saved.awakened:[]),run:validRun(saved.run,owned,copies,Array.isArray(saved.awakened)?saved.awakened:[]),wishEvents:Array.isArray(saved.wishEvents)?saved.wishEvents.filter(validWishEvent):[],wishHistoryStartedAt:Number(saved.wishHistoryStartedAt)||0,wishHistoryBaseline:Number(saved.wishHistoryBaseline)||0,freeWishVersion:saved.freeWishVersion===1?1:0,freeWishSpent:Number.isSafeInteger(saved.freeWishSpent)&&saved.freeWishSpent>=0?saved.freeWishSpent:0,freeWishDaySpent:Number.isSafeInteger(saved.freeWishDaySpent)&&saved.freeWishDaySpent>=0?saved.freeWishDaySpent:0,pcMissionCoins:Object.fromEntries(Object.entries(saved.pcMissionCoins||{}).filter(([day,n])=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=100000)),starterNekuGranted:saved.starterNekuGranted===true,starterWishesGranted:saved.starterWishesGranted===true,hasPlayed:saved.hasPlayed===true || Number(saved.bestFloor)>0 || Object.values(saved.xp||saved.wins||{}).some(x=>Number(x)>0),wishesMade:Number.isSafeInteger(saved.wishesMade)&&saved.wishesMade>=0?saved.wishesMade:Math.max(owned.filter(n=>!saved.starterNekuGranted||n!=="NEKU").length,Number(saved.wishStep)||0,(saved.pins||[]).some(id=>!saved.starterNekuGranted||id!==basePsych.NEKU)?1:0),freeWishes:Number.isSafeInteger(saved.freeWishes)&&saved.freeWishes>=0?saved.freeWishes:0,lastFreeWishDay:typeof saved.lastFreeWishDay==="string"?saved.lastFreeWishDay:"",bestFloor,rebirths:Number.isSafeInteger(saved.rebirths)&&saved.rebirths>=0?Math.min(99,saved.rebirths):0,rebirthReady:saved.rebirthReady===true||legacyRebirthUnlock, claimedQuests:Array.isArray(saved.claimedQuests)?[...new Set<string>(saved.claimedQuests.filter(id=>typeof id==="string"))]:[], floorRecoveryAvailable:saved.floorRecoveryAvailable===true || (saved.floorRecoveryAvailable!==false && saved.bestFloor===undefined && owned.length>0), owned, equipped, pins,pinCopies, wishStep,
      copies,
      xp:Object.fromEntries(owned.map(n=>[n,Number.isSafeInteger(saved.xp?.[n]) && saved.xp[n]>=0 ? experience(saved.xp[n]).xp : legacyExperience(saved.wins?.[n])])),

      levels: {...copies},
      awakened: owned.filter(name => copies[name]===5 && saved.awakened?.includes(name)), awakenedMultiRefunds:Object.fromEntries(Object.entries(saved.awakenedMultiRefunds||{}).filter(([name,n])=>owned.includes(name)&&Number.isSafeInteger(n)&&Number(n)>=0)),loadout: saved.loadout || {}, coins: saved.coins+(legacyRebirthUnlock?5000:0) })));
  } catch {}
  return accrueDailyWishes(refreshDailyQuests(assignBasePsychs({dailyQuestDay:"",dailyQuestProgress:{waves:0,enemies:0,bursts:0},claimedDailyQuests:[],specialRunRecoveries:[],run:null,wishEvents:[],wishHistoryStartedAt:0,wishHistoryBaseline:0,freeWishVersion:0,freeWishSpent:0,freeWishDaySpent:0,pcMissionCoins:{},starterNekuGranted:false,starterWishesGranted:false,hasPlayed:false,wishesMade:0,freeWishes:0,lastFreeWishDay:"",bestFloor:0,rebirths:0,rebirthReady:false,claimedQuests:[],floorRecoveryAvailable:false,pins:[],pinCopies:{}, wishStep:0, copies:{}, xp:{}, levels: {}, awakened: [], awakenedMultiRefunds:{},owned: [], equipped: ["",""], loadout: {}, coins: 180 })));
}

function applyRebirth(profile:Profile):Profile {
 if(!profile.rebirthReady)return profile;
 const protectedPins=new Set(profile.owned.map(name=>basePsych[name]).filter(Boolean));
 const pins=profile.pins.filter(id=>protectedPins.has(id)||["Reaper","Angel"].includes(pinGrade(psychs[id])));
 const pinCopies=Object.fromEntries(Object.entries(profile.pinCopies).filter(([id])=>pins.includes(id)||protectedPins.has(id)));
 const copies=Object.fromEntries(profile.owned.map(name=>[name,profile.awakened.includes(name)?profile.copies[name]||5:0]));
 const loadout=Object.fromEntries(profile.owned.map(name=>[name,(profile.loadout[name]||[]).filter(id=>protectedPins.has(id)||pins.includes(id))]));
 return assignBasePsychs({...profile,run:null,eventRun:null,bestFloor:0,rebirths:profile.rebirths+1,rebirthReady:false,floorRecoveryAvailable:false,pins,pinCopies,copies,levels:{...copies},loadout});
}

// First mobile game integration: 2026-11-18 (repository history).
const freeWishStartDay="2026-11-18";
function parisDay(now:Date=new Date()):string {
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 return ["year","month","day"].map(key=>parts.find(p=>p.type===key)!.value).join("-");
}
function refreshDailyQuests(p:Profile,now:Date=new Date()):Profile {
 const today=parisDay(now);
 return p.dailyQuestDay===today?p:{...p,dailyQuestDay:today,dailyQuestProgress:{waves:0,enemies:0,bursts:0},claimedDailyQuests:[]};
}
function advanceDailyProgress(p:Profile,gains:RunGains):Profile {
 const current=refreshDailyQuests(p),progress={...current.dailyQuestProgress};
 if(gains.victory)progress.waves+=1;
 progress.enemies+=gains.defeated||0;
 progress.bursts+=gains.bursts||0;
 return {...current,dailyQuestProgress:progress};
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
  const names=id==="sonicx"?["X","SONIC","ZERO","SHADOW","KNUCKLES","TAILS"]:id==="xiii"?["MARLUXIA","LEXAEUS","AXEL","LARXENE"]:id==="partners"?["BEAT","JOSHUA"]:id==="eosDawn"?["NOCTIS","PROMPTO"]:id==="eosDusk"?["IGNIS","GLADIO"]:id==="apocalyptic"?["2B","A2"]:id==="destiny"?["SORA","RIKU"]:id==="reality"?["CLOUD","AERITH"]:id==="shibuya"?["NEKU","SHIKI"]:["NEKU","SHIKI"];
  return characterRoster.filter(f=>names.includes(f.name));
}
function portalPool(id:string, _profile?:Profile) {
  const roster=portalRoster(id);
  // Fixed weights: ownership, duplicates and awakening never change the odds.
  return id==="partners" ? [...roster,...roster.filter(f=>["BEAT","JOSHUA"].includes(f.name))] : roster;
}
type MusicTrack = "hub"|"battle"|"boss"|"victory";
type SoundCue = "execute"|"hit"|"pin";
type AudioChannel = "music"|"sfx";
const gameSound = (() => {
  const key="chibi.reapers-run.audio-muted";
  const volumes={music:32,sfx:55};
  let muted=false,visible=false,track:MusicTrack|null=null;
  let music:HTMLAudioElement|null=null, cue:HTMLAudioElement|null=null, clickSound:HTMLAudioElement|null=null;
  const clickUrl="./assets/audio/menu-click.mp3";
  let context:AudioContext|null=null,clickBuffer:AudioBuffer|null=null,clickGain:GainNode|null=null;
  let clickSource:AudioBufferSourceNode|null=null;
  // Decode during loading. Starting a buffer in the input handler avoids a media seek on first press.
  function prepareClick(){
    const Engine=window.AudioContext||(window as any).webkitAudioContext;
    if(!Engine || location.protocol==="file:"){prepareFallback();return;}
    try{
      const engine:AudioContext=new Engine({latencyHint:"interactive"});
      context=engine;engine.onstatechange=()=>{if(engine.state==="running")mix();};clickGain=engine.createGain();clickGain.connect(engine.destination);
      fetch(clickUrl).then(r=>{if(!r.ok)throw Error();return r.arrayBuffer();})
        .then(bytes=>engine.decodeAudioData(bytes)).then(buffer=>{clickBuffer=buffer;}).catch(prepareFallback);
    }catch{prepareFallback();}
  }
  function prepareFallback(){
    if(!clickSound){clickSound=new Audio();clickSound.preload="auto";clickSound.src=clickUrl;clickSound.load();}
  }
  function stopClick(){
    clickSource?.stop();clickSource=null;clickSound?.pause();
  }
  const gains=new WeakMap<HTMLAudioElement,GainNode>();
  try {
    muted=localStorage.getItem(key)==="1";
    for(const channel of ["music","sfx"] as const){
      const stored=localStorage.getItem("chibi.reapers-run.volume."+channel);
      if(stored!==null && /^\d{1,3}$/.test(stored) && Number(stored)<=100)volumes[channel]=Number(stored);
    }
  } catch {}
  function level(player:HTMLAudioElement|null,volume:number){
    if(!player)return;
    let gain=gains.get(player);
    if(!gain && context?.state==="running"){
      gain=context.createGain();context.createMediaElementSource(player).connect(gain);gain.connect(context.destination);
      gains.set(player,gain);
    }
    if(gain){player.volume=1;gain.gain.value=volume;}
    else player.volume=volume;
    player.muted=muted || volume===0;
  }
  function mix(){
    if(clickGain)clickGain.gain.value=muted?0:volumes.sfx/100*.62;
    level(music,volumes.music/100);level(cue,volumes.sfx/100);level(clickSound,volumes.sfx/100*.62);
  }
  function sync(){
    if(!visible||document.hidden||muted){music?.pause();cue?.pause();stopClick();return;}
    if(!track || !volumes.music){music?.pause();return;}
    if(!music)music=new Audio();
    if(music.dataset.track!==track){
      music.dataset.track=track;music.src="./assets/audio/"+track+".mp3";music.loop=track!=="victory";
    }
    level(music,volumes.music/100);
    if(music.paused && !music.ended)music.play().catch(()=>{});
  }
  function preview(){
    if(muted||!visible||document.hidden||!volumes.sfx)return;
    if(clickBuffer && context && clickGain){
      if(context.state!=="running")context.resume().catch(()=>{});
      stopClick();clickGain.gain.value=volumes.sfx/100*.62;
      const source=context.createBufferSource();source.buffer=clickBuffer;source.connect(clickGain);
      source.onended=()=>{source.disconnect();if(clickSource===source)clickSource=null;};
      clickSource=source;source.start();return;
    }
    prepareFallback();
    if(!clickSound)return;
    level(clickSound,volumes.sfx/100*.62);clickSound.currentTime=0;clickSound.play().catch(()=>{});
  }
  function effect(id:SoundCue){
    if(muted||!visible||document.hidden||!volumes.sfx)return;
    if(!cue)cue=new Audio();
    cue.src="./assets/audio/"+id+".mp3";level(cue,volumes.sfx/100);cue.play().catch(()=>{});
  }
  function setVolume(channel:AudioChannel,value:number){
    if(!Number.isFinite(value))return;
    volumes[channel]=Math.min(100,Math.max(0,Math.round(value)));
    try{localStorage.setItem("chibi.reapers-run.volume."+channel,String(volumes[channel]));}catch{}
    if(context?.state==="suspended")context.resume().then(mix).catch(()=>{});
    mix();sync();
  }
  function toggle(){
    muted=!muted;try{localStorage.setItem(key,muted?"1":"0");}catch{}
    mix();sync();if(!muted)preview();window.dispatchEvent(new Event("chibi:audio-setting"));
  }
  function connect(){
    if(!context&&!clickSound)prepareClick();
    function interact(){
      if(context?.state==="suspended")context.resume().then(mix).catch(()=>{});
      sync();
    }
    const eligible=(event:Event)=>{
      const button=(event.target as Element)?.closest?.("button");
      return button&&!button.matches(":disabled,[aria-disabled=true],.audio-control")?button:null;
    };
    let pressed:HTMLButtonElement|null=null;
    const down=(event:PointerEvent)=>{
      pressed=null;
      if(!event.isPrimary||event.button!==0)return;
      if(context?.state==="suspended")context.resume().catch(()=>{});
      // Touch activation is confirmed on release so that scrolling a menu stays silent.
      if(event.pointerType==="mouse" && (pressed=eligible(event)))preview();
    };
    const click=(event:MouseEvent)=>{
      const button=eligible(event);
      if(button && (event.detail===0 || button!==pressed))preview();
      pressed=null;interact();
    };
    // Retry inside the launch gesture when the embedding page already loaded the game.
    const frame=window.frameElement;
    const host=frame?.ownerDocument;
    const opening=()=>{if(frame?.getClientRects().length){visible=true;interact();}};
    host?.addEventListener("click",opening);
    document.addEventListener("pointerdown",down,true);
    document.addEventListener("click",click,true);document.addEventListener("keydown",interact,true);
    document.addEventListener("pointerup",interact,true);document.addEventListener("visibilitychange",sync);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});
    observer.observe(document.documentElement);
    return ()=>{observer.disconnect();document.removeEventListener("pointerdown",down,true);host?.removeEventListener("click",opening);document.removeEventListener("pointerup",interact,true);document.removeEventListener("click",click,true);document.removeEventListener("keydown",interact,true);document.removeEventListener("visibilitychange",sync);visible=false;sync();};
  }
  return {connect,toggle,effect,preview,setVolume,volumes,get muted(){return muted;},scene(next:MusicTrack|null){track=next;sync();}};
})();
function AudioSettings({back}:{back:()=>void}){
  const [values,setValues]=useState({...gameSound.volumes});
  return <section className="hub-panel audio-settings"><h1>Paramètres</h1>
    {(["music","sfx"] as const).map(channel=><label key={channel}>
      <span>{channel==="music"?"Musique":"Effets sonores"}</span><output>{values[channel]} %</output>
      <input type="range" min="0" max="100" step="1" value={values[channel]}
        aria-label={channel==="music"?"Musique":"Effets sonores"}
        onChange={event=>{gameSound.setVolume(channel,Number(event.currentTarget.value));setValues({...gameSound.volumes});}}
        onPointerUp={()=>{if(channel==="sfx")gameSound.preview();}}
        onKeyUp={event=>{if(channel==="sfx"&&/^(Arrow|Home|End|Page)/.test(event.key))gameSound.preview();}}/>
    </label>)}<button onClick={back}>Retour au menu</button></section>;
}
function useMusic(track:MusicTrack|null){
  useEffect(()=>{gameSound.scene(track);return ()=>gameSound.scene(null);},[track]);
}
function SoundToggle(){
  const [muted,setMuted]=useState(gameSound.muted);
  useEffect(()=>{const changed=()=>setMuted(gameSound.muted);window.addEventListener("chibi:audio-setting",changed);return ()=>window.removeEventListener("chibi:audio-setting",changed);},[]);
  return <button className="audio-control" aria-label="Audio" aria-pressed={!muted} onClick={gameSound.toggle}>{muted?"🔇":"🔊"}</button>;
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
      <div className="reward-object">{pin?<PinIcon pin={pin}/>:fighter && <SpritePreview fighter={fighter} maximumScale={1}/>}</div>
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
  const [sort,setSort]=useState<BadgeSort>("number");
  const available=availablePsychs(profile,name);
  const sorted=[...available].sort((left,right)=>{const a=psychs[left],b=psychs[right];return sort==="grade"?(badgeGradeOrder[pinGrade(a)]??0)-(badgeGradeOrder[pinGrade(b)]??0)||a.name.localeCompare(b.name):sort==="element"?elementNames[a.element||badgeElement(a)].localeCompare(elementNames[b.element||badgeElement(b)])||a.name.localeCompare(b.name):sort==="power"?b.power-a.power||a.name.localeCompare(b.name):(Number.parseInt(a.number)||9999)-(Number.parseInt(b.number)||9999)||a.name.localeCompare(b.name);});
  const pages=Math.max(1,Math.ceil(sorted.length/16));
  const equipped=profile.loadout[name]||[];
  const inspect=inspected?psychs[inspected]:null;
  const toggle=(id:string)=>{
    if(inspected!==id){setInspected(id);return;}
    if(equippedBy(profile,name,id))return;
    setDraft(old=>old.includes(id)?old.filter(value=>value!==id):old.length<3?[...old,id]:old);
  };
  const start=()=>{setDraft([...equipped]);setPage(0);setInspected(null);setOpen(true);};
  return <div className="psych-loadout"><h2>Psychs · {name}</h2>
    <div className="psych-equipment-slots">{[0,1,2].map(index=><button key={index} onClick={start} aria-label={`Équiper les psychs de ${name}, emplacement ${index+1}`}>
      {equipped[index]?<><PinIcon pin={psychs[equipped[index]]}/><small>{psychs[equipped[index]].name.replace(" (Pin)","")}{(profile.pinCopies[equipped[index]]||1)>1?` ×${profile.pinCopies[equipped[index]]}`:""}</small><small className="psych-target">{pinTargetLabel(psychs[equipped[index]])}</small></>:<span aria-hidden="true">+</span>}
    </button>)}</div>
    {open && <WishDialog className="badge-book" title={`Psychs · ${name}`} close={()=>setOpen(false)}>
      <p className="equipment-count">{draft.length} / 3 équipés</p>
      <div className="psych-equipment-slots">{[0,1,2].map(i=><button key={i} disabled={!draft[i]} aria-label={draft[i]?`Retirer ${psychs[draft[i]].name}`:`Emplacement ${i+1} vide`} onClick={()=>toggle(draft[i])}>
        {draft[i]?<PinIcon pin={psychs[draft[i]]}/>:<span>+</span>}
      </button>)}</div>
      <div className="badge-sort" aria-label="Trier les psychs">{[["number","N°"],["grade","Classe"],["element","Type"],["power","Puissance"]].map(([id,label])=><button key={id} aria-pressed={sort===id} onClick={()=>{setSort(id as BadgeSort);setPage(0);setInspected(null);}}>{label}</button>)}</div>
      <div className="badge-slots">{Array.from({length:16},(_,i)=>{
        const id=sorted[page*16+i],pin=psychs[id];
        return pin?<button key={id} className="badge-slot" aria-label={`${pin.name} · ${pinTargetLabel(pin)} · ${profile.pinCopies[id]||1} exemplaire(s)${equippedBy(profile,name,id)?` · Équipé par ${equippedBy(profile,name,id)}`:""}`} disabled={Boolean(equippedBy(profile,name,id))} aria-pressed={draft.includes(id)} onClick={()=>toggle(id)}><BadgeArt pin={pin}/><PinTargetBadge pin={pin}/>{(profile.pinCopies[id]||1)>1&&<span className="badge-copy">×{profile.pinCopies[id]}</span>}{equippedBy(profile,name,id)&&<small className="badge-owner">{equippedBy(profile,name,id)}</small>}</button>:<span key={i} className="badge-slot" aria-hidden="true"/>;
      })}</div>
      {inspect && <p className="badge-info"><b>{inspect.name.replace(" (Pin)","")}</b> · {types[inspect.kind]} · {pinTargetLabel(inspect)} · {inspect.cost} EN · <PinRankInfo pin={inspect}/> <TypeChips elements={[inspect.element||badgeElement(inspect)]}/>{equippedBy(profile,name,inspect.id)&&<span> · Équipé par {equippedBy(profile,name,inspect.id)}</span>}<small> · Retouche ce badge pour {draft.includes(inspect.id)?"le retirer":"l’équiper"}.</small></p>}
      {draft.length===3 && <p className="equipment-help">Retire un psych équipé pour le remplacer.</p>}
      {!draft.length && <p className="equipment-help">Équipe au moins 1 psych.</p>}
      <nav aria-label="Pages des psychs"><button disabled={!page} onClick={()=>setPage(page-1)} aria-label="Page précédente">‹</button><span>{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(page+1)} aria-label="Page suivante">›</button></nav>
      <div className="dialog-actions"><button onClick={()=>setOpen(false)}>Annuler</button><button disabled={!draft.length} onClick={()=>{save(draft);setOpen(false);}}>Enregistrer</button></div>
    </WishDialog>}
  </div>;
}
type BadgeSort="number"|"grade"|"element"|"power";
const badgeGradeOrder:Record<string,number>={"---":0,E:1,D:2,C:3,B:4,A:5,Reaper:6,Angel:7};
function BadgeCatalogue({owned,copies={},embedded=false}:{owned:string[];copies?:Record<string,number>;embedded?:boolean}) {
  const Panel=embedded?InlinePanel:WishDialog;
  const [open,setOpen]=useState(false);
  const [page,setPage]=useState(0);
  const [selected,setSelected]=useState<Pin|null>(null);
  const [sort,setSort]=useState<BadgeSort>("number");
  const collected=collectionPins.filter(pin=>owned.includes(pin.id));
  const sorted=[...collected].sort((a,b)=>sort==="grade"?(badgeGradeOrder[pinGrade(a)]??0)-(badgeGradeOrder[pinGrade(b)]??0)||a.name.localeCompare(b.name):sort==="element"?elementNames[a.element||badgeElement(a)].localeCompare(elementNames[b.element||badgeElement(b)])||a.name.localeCompare(b.name):sort==="power"?b.power-a.power||a.name.localeCompare(b.name):(Number.parseInt(a.number)||9999)-(Number.parseInt(b.number)||9999));
  const pages=Math.max(1,Math.ceil(sorted.length/16));
  const move=(delta:number)=>{setPage(page+delta);setSelected(null);};
  return <>
    {!embedded&&<button onClick={()=>{setPage(0);setSelected(null);setOpen(true);}}>Catalogue des badges</button>}
    {(open||embedded) && <Panel className="badge-book" title="Badges" close={()=>setOpen(false)}>
      <div className="badge-counter">{collected.length} / {collectionPins.length} obtenus</div>
      <div className="badge-sort" aria-label="Trier les badges">{[["number","N°"],["grade","Classe"],["element","Type"],["power","Puissance"]].map(([id,label])=><button key={id} aria-pressed={sort===id} onClick={()=>{setSort(id as BadgeSort);setPage(0);setSelected(null);}}>{label}</button>)}</div>
      <div className="badge-slots">
        {Array.from({length:16},(_,i)=>{
          const index=page*16+i, pin=sorted[index];
          if(!pin) return <span key={index} className="badge-slot" aria-hidden="true"/>;
          return <button key={pin.id} className="badge-slot" aria-label={`${pin.name} · ${pinTargetLabel(pin)} · ${copies[pin.id]||1} exemplaire(s)`} aria-pressed={selected?.id===pin.id} onClick={()=>setSelected(pin)}>
            <BadgeArt pin={pin}/><PinTargetBadge pin={pin}/>{(copies[pin.id]||1)>1&&<span className="badge-copy">×{copies[pin.id]}</span>}
          </button>;
        })}
      </div>
      {selected && <p className="badge-info" aria-live="polite"><b>#{selected.number} {selected.name}</b> · {types[selected.kind]} · {pinTargetLabel(selected)} · {selected.cost} EN · <PinRankInfo pin={selected}/> <TypeChips elements={[selected.element||badgeElement(selected)]}/></p>}
      <nav aria-label="Pages du catalogue"><button disabled={!page} aria-label="Page précédente" onClick={()=>move(-1)}>‹</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page+1>=pages} aria-label="Page suivante" onClick={()=>move(1)}>›</button></nav>
      {!embedded&&<button onClick={()=>setOpen(false)}>Fermer</button>}
      <small>Visuels DS · NightOwl35. Données · TWEWY Wiki.</small>
    </Panel>}
  </>;
}
type Quest = {id:string;title:string;progress:number;goal:number;reward:number};
const maxFloor=100;
function questsFor(p:Profile):Quest[] {
 const badges=new Set(p.pins.filter(id=>psychs[id]&&(psychs[id].row>=0||id.startsWith("signature-")))).size;
 const bestLevel=Math.max(1,...Object.values(p.xp).map(x=>experience(x).level));
 return [
  ...Array.from({length:10},(_,i)=>({id:`floor-${(i+1)*10}`,title:`Atteindre l’étage ${(i+1)*10}`,progress:p.bestFloor,goal:(i+1)*10,reward:100})),
  ...Array.from({length:Math.floor(collectionPins.length/10)},(_,i)=>({id:`badges-${(i+1)*10}`,title:`Collectionner ${(i+1)*10} badges`,progress:badges,goal:(i+1)*10,reward:20})),
  ...[2,4,6].map(n=>({id:`recruits-${n}`,title:`Débloquer ${n} personnages`,progress:p.owned.length,goal:n,reward:n*25})),
  ...[5,10,25].map(n=>({id:`level-${n}`,title:`Monter un personnage au niveau ${n}`,progress:bestLevel,goal:n,reward:n*10})),
  {id:"awaken-1",title:"Éveiller 1 personnage",progress:p.awakened.length,goal:1,reward:150}
 ];
}
function dailyQuestsFor(p:Profile):Quest[] {
 const progress=refreshDailyQuests(p).dailyQuestProgress;
 return [
  {id:"daily-wave",title:"Remporter 1 vague",progress:progress.waves,goal:1,reward:50},
  {id:"daily-enemies",title:"Vaincre 5 ennemis",progress:progress.enemies,goal:5,reward:50},
  {id:"daily-burst",title:"Déclencher 1 Sync Burst",progress:progress.bursts,goal:1,reward:100}
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
function claimDailyQuests(p:Profile,ids:string[]):Profile {
 const current=refreshDailyQuests(p),ready=dailyQuestsFor(current).filter(q=>ids.includes(q.id)&&q.progress>=q.goal&&!current.claimedDailyQuests.includes(q.id));
 return {...current,coins:current.coins+ready.reduce((sum,q)=>sum+q.reward,0),claimedDailyQuests:[...current.claimedDailyQuests,...ready.map(q=>q.id)]};
}
function QuestMenu({profile,save,embedded=false}:{profile:Profile;save:(fn:(p:Profile)=>Profile)=>void;embedded?:boolean}) {
 const Panel=embedded?InlinePanel:WishDialog;
  const [missionStatus,setMissionStatus]=useState(()=>window.ChibiGameSync?.missionState||"idle");
  useEffect(()=>{const update=()=>setMissionStatus(window.ChibiGameSync?.missionState||"idle");window.addEventListener("chibi:mission-scores",update);return()=>window.removeEventListener("chibi:mission-scores",update);},[]);

 const [open,setOpen]=useState(false);
 const quests=questsFor(profile),daily=dailyQuestsFor(profile),ready=quests.filter(q=>q.progress>=q.goal&&!profile.claimedQuests.includes(q.id)),dailyReady=daily.filter(q=>q.progress>=q.goal&&!profile.claimedDailyQuests.includes(q.id));
 const [category,setCategory]=useState("daily");
 return <>
  {!embedded&&<button onClick={()=>setOpen(true)}>Quêtes{ready.length?` · ${ready.length}`:""}</button>}
  {(open||embedded)&&<Panel className="quest-menu" title="Quêtes" close={()=>setOpen(false)}>
   <p>{category==="daily"?"3 missions par jour · 200 pièces au total":"Récompenses uniques · Progression rétroactive"}</p>
   {profile.floorRecoveryAvailable&&<button className="floor-recovery" onClick={()=>save(p=>({...p,bestFloor:Math.max(p.bestFloor,10),floorRecoveryAvailable:false}))}>Rattraper mon ancien étage 10</button>}
   <div className="quest-tabs">{[["daily","Quotidiennes"],["floor","Étages"],["badges","Collection"],["other","Personnages"],["pc","Missions PC"]].map(([id,name])=><button key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{name}</button>)}</div>
   {category==="pc"?<div className="quest-list pc-mission-coins">
    <p>Score PC ÷ 10 = pièces · Crédit automatique</p>
    {missionStatus==="error"&&<p role="alert">Missions PC indisponibles. Les crédits précédents sont conservés ; vérifie la connexion et les règles Firebase.</p>}
    <p>Total reçu : {Object.values(profile.pcMissionCoins).reduce((a,b)=>a+b,0)} pièces</p>
    {Object.keys(profile.pcMissionCoins).length?Object.entries(profile.pcMissionCoins).sort(([a],[b])=>b.localeCompare(a)).map(([day,coins])=><article key={day}><b>{day.split("-").reverse().join("/")}</b><span>{coins} pièces créditées</span></article>):<p>Ouvre le jeu connecté au même compte que sur PC pour récupérer tes missions passées.</p>}
   </div>:<div className="quest-list">{(category==="daily"?daily:quests.filter(q=>category==="other"?!/^(floor|badges)-/.test(q.id):q.id.startsWith(category+"-"))).map(q=>{
    const claimed=category==="daily"?profile.claimedDailyQuests.includes(q.id):profile.claimedQuests.includes(q.id),done=q.progress>=q.goal;
    return <article key={q.id}><div><b>{q.title}</b><small>{Math.min(q.goal,q.progress)} / {q.goal} · {q.reward} pièces</small><progress max={q.goal} value={Math.min(q.goal,q.progress)} aria-label={q.title}/></div>
     <button disabled={claimed||!done} onClick={()=>save(p=>category==="daily"?claimDailyQuests(p,[q.id]):claimQuests(p,[q.id]))}>{claimed?"Récupéré":"Récupérer"}</button></article>;
   })}</div>}
   <div className="dialog-actions"><button disabled={category==="daily"?!dailyReady.length:!ready.length} onClick={()=>save(p=>category==="daily"?claimDailyQuests(p,dailyQuestsFor(p).map(q=>q.id)):claimQuests(p,questsFor(p).map(q=>q.id)))}>Tout récupérer · {(category==="daily"?dailyReady:ready).reduce((sum,q)=>sum+q.reward,0)} pièces</button>{!embedded&&<button onClick={()=>setOpen(false)}>Fermer</button>}</div>
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
function combatFingerprint(p:Profile):string {return JSON.stringify([p.owned,p.equipped,p.loadout,p.xp,p.awakened,p.levels,p.run?[p.run.id,p.run.seq,p.run.status]:null,p.eventRun?[p.eventRun.run.id,p.eventRun.run.seq]:null]);}
type GameScreen="home"|"team"|"roguelike"|"summon"|"collection"|"social"|"quests"|"journal"|"bestiary"|"settings"|"events"|"pvp"|"raid"|"menu";
function InlinePanel({title,children,className=""}:{title:string;children:React.ReactNode;className?:string;close?:()=>void}) {return <section className={`hub-panel ${className}`}><h2>{title}</h2>{children}</section>;}
function gameFullscreen(){
 if(window.parent!==window){window.parent.postMessage({type:"chibi:fullscreen",action:"toggle"},location.protocol==="file:"?"*":location.origin);return;}
 if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});
}
const hubScreens:[GameScreen,string,string][]=[["home","Accueil","⌂"],["team","Team","♟"],["summon","Invocations","✦"],["collection","Collection","▦"],["social","Social","◎"],["menu","Menu","☰"]];
function GameHub({profile,screen,navigate,openNews,children}:{profile:Profile;screen:GameScreen;navigate:(screen:GameScreen)=>void;openNews:()=>void;children:React.ReactNode}) {
 useMusic("hub");
 const content=React.useRef<HTMLDivElement>(null);
 useEffect(()=>{content.current?.scrollTo({top:0});},[screen]);
 return <div className="game-hub game-shell">
  <header className="hub-header"><button className="hub-brand" onClick={()=>navigate("home")} aria-label="Accueil du jeu">TWEWY <span>REAPERS’ RUN</span></button><div className="hub-wallet"><span aria-label={`${profile.coins} pièces`}><Icon name="coin"/>{profile.coins.toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")}</span><small>✦ {profile.freeWishes} gratuits</small></div><button className="hub-news" onClick={openNews} aria-label="Consulter les nouveautés"><span aria-hidden="true">NEWS</span></button><button className="hub-fullscreen" onClick={gameFullscreen} aria-label="Basculer le plein écran">⛶</button></header>
  <div className="hub-content" ref={content}><div className="hub-screen" key={screen}>{children}</div></div>
  <nav className="hub-nav" aria-label="Navigation du jeu">{hubScreens.map(([id,label,icon])=><button key={id} aria-current={screen===id?"page":undefined} data-section-active={id==="menu"&&["settings","bestiary","quests","journal","raid","pvp"].includes(screen)||id==="home"&&["roguelike","events"].includes(screen)||undefined} onClick={()=>navigate(id)}><span className="hub-nav-orb" aria-hidden="true"><i>{icon}</i></span><b>{label}</b></button>)}</nav>
 </div>;
}
function CharacterDossier({fighter,profile,base=false,rate}:{fighter:Fighter;profile:Profile;base?:boolean;rate?:number}) {
 const owned=profile.owned.includes(fighter.name),reference=base||!owned;
 const stats=trained(fighter,reference?0:profile.xp[fighter.name]||0,!reference&&profile.awakened.includes(fighter.name),reference?0:profile.copies[fighter.name]||0);
 const rank=reference?0:profile.levels[fighter.name]||0,pin=psychs[basePsych[fighter.name]],passive=characterPassives[fighter.name];
 return <article className="character-dossier" style={{"--character-accent":fighter.accent} as React.CSSProperties}>
  <header><small>{fighter.role}</small><h3>{fighter.name}</h3><TypeChips elements={characterElements[fighter.name]}/></header>
  <div className="dossier-art"><span className="dossier-orbit" aria-hidden="true"/><SpritePreview fighter={fighter} maximumScale={2.6}/><RankBadge level={rank}/></div>
  <div className="dossier-stats"><p>{reference?"Stats de base · Niveau 1 · Rang E":`Ta progression · Niveau ${stats.level} · Rang ${rank===5?"étoile":ranks[rank]}`}</p>
   <dl>{[["PV",stats.maxHp],["ATK",stats.atk],["ATK SPE",stats.mag],["SPE",stats.speed]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
   <div className="dossier-passive"><span aria-hidden="true">✦</span><div><small>Passif · {passive.name}</small><b>{passive.description}</b></div></div>
   <div className="dossier-psych"><PinIcon pin={pin}/><span><small>Psych de départ</small><b>{pin.name.replace(" (Pin)","")}</b></span></div>
   {rate!==undefined&&<p className="dossier-rate">Prochain vœu · {(rate*100).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR",{maximumFractionDigits:3})} %</p>}
   {!reference&&<p>{profile.copies[fighter.name]||0} / 5 doublons{profile.awakened.includes(fighter.name)?" · Éveillé":""}</p>}
  </div>
 </article>;
}
function TeamCharacters({profile}:{profile:Profile}) {
 const owned=characterRoster.filter(fighter=>profile.owned.includes(fighter.name));
 return <section className="team-character-list" aria-label="Personnages obtenus">
  {!owned.length&&<p>Tu n’as pas encore obtenu de personnage.</p>}
  {owned.map(fighter=>{const stats=trained(fighter,profile.xp[fighter.name]||0,profile.awakened.includes(fighter.name),profile.copies[fighter.name]||0),rank=profile.levels[fighter.name]||0,passive=characterPassives[fighter.name];return <article className="team-character-card" key={fighter.name}>
    <div className="team-character-portrait"><HudPortrait fighter={fighter}/></div>
    <div className="team-character-main"><header><div><h3>{fighter.name}</h3><TypeChips elements={characterElements[fighter.name]}/></div><RankBadge level={rank}/></header>
     <small className="team-character-level">Niv. {stats.level} · Rang {rank===5?"étoile":ranks[rank]}{profile.awakened.includes(fighter.name)?" · Éveillé":""}</small>
     <dl className="team-character-stats">{[["PV",stats.maxHp],["ATK",stats.atk],["ATK SPE",stats.mag],["SPE",stats.speed]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
     <div className="team-character-psychs"><b>Psychs équipés</b><div>{(profile.loadout[fighter.name]||[]).map(id=>{const pin=psychs[id];return pin?<span key={id}><PinIcon pin={pin}/><small>{pin.name.replace(" (Pin","")} · {pinTargetLabel(pin)}</small></span>:null;})}</div></div>
     <div className="dossier-passive"><span aria-hidden="true">✦</span><div><small>Passif · {passive.name}</small><b>{passive.description}</b></div></div>
    </div>
   </article>;})}
 </section>;
}
function Collection({profile,awaken,openPortal,openEvent}:{profile:Profile;awaken:(name:string)=>void;openPortal:(id:string)=>void;openEvent:(name:string)=>void}) {
 const [tab,setTab]=useState<"characters"|"badges">("characters");
 return <section className="hub-panel collection-workspace"><h1>Collection</h1>
  <div className="hub-tabs noir-tabs" role="group" aria-label="Parcourir la collection">
   <button aria-pressed={tab==="characters"} onClick={()=>setTab("characters")}>Personnages</button>
   <button aria-pressed={tab==="badges"} onClick={()=>setTab("badges")}>Badges</button>
  </div>
  {tab==="characters"?<CharacterCollection profile={profile} awaken={awaken} openPortal={openPortal} openEvent={openEvent}/>:<BadgeCatalogue embedded owned={profile.pins} copies={profile.pinCopies}/>}
 </section>;
}
function CharacterCollection({profile,awaken,openPortal,openEvent}:{profile:Profile;awaken:(name:string)=>void;openPortal:(id:string)=>void;openEvent:(name:string)=>void}) {
 const [filter,setFilter]=useState("all"),[query,setQuery]=useState(""),[selected,setSelected]=useState<Fighter|null>(null);
 const roster=visibleCollectionRoster(),isOwned=(name:string)=>profile.owned.includes(name);
 const canAwaken=(name:string)=>isOwned(name)&&profile.copies[name]===5&&!profile.awakened.includes(name);
 const matches=roster.filter(fighter=>fighter.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())&&(
   filter==="owned"?isOwned(fighter.name):filter==="missing"?!isOwned(fighter.name):filter==="awakening"?canAwaken(fighter.name):true));
 const sources=selected?Object.entries(portals).filter(([id])=>portalAvailable(id)&&portalRoster(id).some(fighter=>fighter.name===selected.name)):[];
 return <section className="character-collection">
  <p>{roster.filter(fighter=>isOwned(fighter.name)).length} / {roster.length} débloqués</p>
  <label className="collection-search">Rechercher un personnage<input type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>
  <div className="hub-tabs noir-tabs" role="group" aria-label="Filtrer les personnages">
   {[["all","Tous"],["owned","Débloqués"],["missing","Non obtenus"],["awakening","Éveil disponible"]].map(([id,label])=>
    <button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}
  </div>
  {!matches.length&&<p role="status">Aucun personnage trouvé.</p>}
  <div className="character-grid">{matches.map(fighter=>{
   const owned=isOwned(fighter.name);
   return <button key={fighter.name} className={owned?"":"not-owned"} onClick={()=>setSelected(fighter)} aria-label={`Fiche de ${fighter.name}`}>
    <HudPortrait fighter={fighter}/><b>{fighter.name}</b>
    <small>{canAwaken(fighter.name)?"Éveil disponible":owned?`Niv. ${experience(profile.xp[fighter.name]||0).level} · ${ranks[profile.levels[fighter.name]||0]}`:"Non obtenu"}</small>
   </button>;
  })}</div>
  {selected&&<WishDialog className="character-sheet-dialog" title={`Fiche · ${selected.name}`} close={()=>setSelected(null)}>
   <CharacterDossier fighter={selected} profile={profile}/>
   {canAwaken(selected.name)&&<button onClick={()=>awaken(selected.name)}>Éveiller · +20 PV</button>}
   <section className="recruitment-sources"><h3>Sources d’obtention</h3>
    {sources.map(([id,title])=><button key={id} onClick={()=>openPortal(id)}><span>Portail</span> <strong>{id==="shibuya"?"First Week #1":title}</strong><span aria-hidden="true">›</span></button>)}
    <button onClick={()=>openEvent(selected.name)}><span>Événement</span> <strong>{selected.name}</strong><span aria-hidden="true">›</span></button>
   </section>
   <button onClick={()=>setSelected(null)}>Retour à la collection</button>
  </WishDialog>}
 </section>;
}
type EventPrize="character"|"pin"|"none";
type EventSave={boss:string;run:RunSave;prize:EventPrize};
function eventWave(boss:string,stage:number,seed:string):Enemy[]{
  if(stage<3){
    const scale=difficultyAt(100);
    return makeWave(99,seed+"-"+boss+"-"+stage).slice(0,stage+1).map((enemy,i)=>{
      const spec=enemyCatalog[enemy.kind],hp=Math.max(1500,Math.round(spec.hp*scale.hp));
      return {...enemy,id:stage*10+i,level:100,maxHp:hp,hp,attack:Math.max(150,Math.round(spec.attack*scale.attack)),speed:Math.max(90,(spec.speed??18)+scale.speed),xp:0};
    });
  }
  const hero=characterRoster.find(f=>f.name===boss)!,stats=bases[boss],hp=(hero.maxHp+199*5)*10;
  return [{id:30,kind:"event-"+boss,name:boss,hp,maxHp:hp,attack:Math.round((Math.max(stats[0],stats[1])+398)*1.5),speed:stats[2]+215,level:200,boss:true,trait:"berserk",xp:0}];
}
function readEvent(raw:any,owned:string[],copies:Record<string,number>,awake:string[]):EventSave|null{
  if(!raw||!characterRoster.some(f=>f.name===raw.boss))return null;
  const run=validRun(raw.run,owned,copies,awake);
  if(!run||run.wave>3||(run.wave<3&&run.enemies.some(e=>e.level!==100))||(run.wave===3&&!run.enemies.every(e=>e.kind==="event-"+raw.boss)))return null;
  const migrated=run.wave===3&&run.enemies.some(e=>e.level!==200)?{...run,enemies:eventWave(raw.boss,3,run.id).map((enemy,index)=>{const old=run.enemies[index];return {...enemy,hp:old?Math.max(0,Math.round(enemy.maxHp*old.hp/Math.max(1,old.maxHp))):enemy.hp};})}:run;
  return {boss:raw.boss,run:migrated,prize:["character","pin"].includes(raw.prize)?raw.prize:"none"};
}
function eventCheckpoint(p:Profile,snapshot:RunSave,gains:RunGains={}):Profile{
  const active=p.eventRun;
  if(!active||active.run.status!=="active"||snapshot.id!==active.run.id||snapshot.seq<=active.run.seq)return p;
  let prize:EventPrize="none",next=p;
  if(snapshot.wave===3&&snapshot.status==="complete"&&snapshot.enemies.every(e=>e.hp===0)){
    const roll=Math.random(),name=active.boss;
    prize=roll<.01?"character":roll<.06?"pin":"none";
    if(prize==="pin")next=grantPins(p,[signaturePins[name].id]);
    if(prize==="character"){
      const copies=p.owned.includes(name)?Math.min(5,(p.copies[name]||0)+1):0;
      next={...p,owned:[...new Set([...p.owned,name])],copies:{...p.copies,[name]:copies},levels:{...p.levels,[name]:copies}};
    }
  }
  return advanceDailyProgress({...next,eventRun:{...active,run:snapshot,prize}},gains);
}
function EventHall({profile,start,navigate,abandon,target}:{profile:Profile;start:(name:string)=>void;navigate:(screen:GameScreen)=>void;abandon:()=>void;target:string|null}){
 const rail=React.useRef<HTMLDivElement>(null),[confirm,setConfirm]=useState(false);
 const current=profile.eventRun,active=current?.run.status==="active"?current:null;
 const ready=profile.equipped.filter(Boolean).length===2 && profile.equipped.every(n=>profile.loadout[n]?.length) && profile.equipped.some(n=>profile.loadout[n]?.some(offensive));
 React.useLayoutEffect(()=>{
   const list=rail.current;
   const card=Array.from(list?.children||[]).find(child=>child.getAttribute("data-hero")===target);
   if(list&&card)list.scrollTop+=card.getBoundingClientRect().top-list.getBoundingClientRect().top;
 },[target]);
 function scroll(direction:number){
   const el=rail.current;if(!el?.children.length)return;
   const cards=Array.from(el.children) as HTMLElement[];
   const here=cards.reduce((a,b)=>Math.abs(b.offsetTop-el.scrollTop)<Math.abs(a.offsetTop-el.scrollTop)?b:a);
   el.scrollTo({top:cards[Math.max(0,Math.min(cards.length-1,cards.indexOf(here)+direction))].offsetTop,behavior:"smooth"});
 }
 return <section className="hub-panel event-hall"><header><h1>Événement</h1><div><button aria-label="Précédent" onClick={()=>scroll(-1)}>‹</button><button aria-label="Suivant" onClick={()=>scroll(1)}>›</button></div></header>
 <p>2 vagues niveau 100 puis un boss niveau 200</p>
 {active&&<div className="event-resume"><button onClick={()=>start(active.boss)}>Reprendre · {active.boss} · {active.run.wave}/3</button><button onClick={()=>setConfirm(true)}>Abandonner</button></div>}
 {confirm&&<WishDialog title="Abandonner cet événement ?" close={()=>setConfirm(false)}><button onClick={()=>setConfirm(false)}>Annuler</button><button onClick={()=>{abandon();setConfirm(false);}}>Confirmer</button></WishDialog>}
 {!ready&&!active&&<button onClick={()=>navigate("team")}>Préparer le duo</button>}
 <div className="event-rail" ref={rail} aria-label="Événements">{visibleCollectionRoster().map(hero=><article key={hero.name} data-hero={hero.name} data-selected={target===hero.name||undefined}>
 <div className="event-preview"><SpritePreview fighter={hero} maximumScale={2.4}/></div><h2>{hero.name}</h2><TypeChips elements={characterElements[hero.name]}/>
 <p><b>5 %</b> · {signaturePins[hero.name].name}<br/><b>1 %</b> · {hero.name}</p>
 <button disabled={active?active.boss!==hero.name:!ready} onClick={()=>start(hero.name)}>{active?.boss===hero.name?"Reprendre":"Défier"}</button>
 </article>)}</div></section>;
}
type PvpMode="casual"|"ranked";
type PvpPlan={kind:"psych"|"guard";pin?:string;target?:number};
type PvpFighter={name:string;hp:number;maxHp:number;atk:number;mag:number;speed:number;loadout:string[]};
type PvpRoom={mode:PvpMode;status:"active"|"finished";turn:number;host:string;guest:string;winner?:string|null;reason?:string;players:Record<string,{name:string;rating:number;team:PvpFighter[]}>;actions?:Record<string,{turn:number;plans:Record<string,PvpPlan>}>;updatedAt:number};
function pvpTeam(profile:Profile,mode:PvpMode):PvpFighter[]{return profile.equipped.filter(Boolean).map(name=>{const base=characterRoster.find(item=>item.name===name)!,fighter=mode==="casual"?trained(base,xpAtLevel(50),false,5):trained(base,profile.xp[name]||0,profile.awakened.includes(name),profile.copies[name]||0);return {name,hp:fighter.maxHp,maxHp:fighter.maxHp,atk:fighter.atk||1,mag:fighter.mag||1,speed:fighter.speed||1,loadout:[...(profile.loadout[name]||[])]};});}
function resolvePvpRoom(room:PvpRoom):PvpRoom {
 const ids=[room.host,room.guest],teams=Object.fromEntries(ids.map(uid=>[uid,room.players[uid].team.map(f=>({...f}))])) as Record<string,PvpFighter[]>;
 const shields=new Map<string,number>(),order=ids.flatMap(uid=>teams[uid].map((fighter,index)=>({uid,index,speed:fighter.speed}))).filter(item=>teams[item.uid][item.index].hp>0).sort((a,b)=>b.speed-a.speed||a.uid.localeCompare(b.uid));
 for(const step of order){
  const fighter=teams[step.uid][step.index],plan=room.actions?.[step.uid]?.plans?.[String(step.index)];if(!plan||fighter.hp<=0)continue;
  const rival=ids.find(uid=>uid!==step.uid)!,enemyTeam=teams[rival];
  if(plan.kind==="guard"){shields.set(`${step.uid}:${step.index}`,.55);continue;}
  const pin=psychs[plan.pin||""];if(!pin||!fighter.loadout.includes(pin.id))continue;
  if(pin.kind==="heal"){const amount=scaledPinEffect(pin,fighter.mag*pin.power/50*passiveHealingMultiplier(fighter.name));teams[step.uid]=teams[step.uid].map(member=>member.hp>0?{...member,hp:Math.min(member.maxHp,member.hp+amount)}:member);continue;}
  if(pin.kind==="guard"||pin.kind==="support"){teams[step.uid].forEach((member,index)=>member.hp>0&&shields.set(`${step.uid}:${index}`,Math.max(shields.get(`${step.uid}:${index}`)||0,pinShieldReduction(pin))));continue;}
  const kind:PassiveKind=pin.kind==="physical"?"physical":"special",partnerAlive=teams[step.uid].some((member,index)=>index!==step.index&&member.hp>0);
  const raw=scaledPinEffect(pin,(pin.kind==="physical"?fighter.atk:fighter.mag)*(.7+pin.power/100)*stabMultiplier(fighter as Fighter,pin)*passiveDamageMultiplier(fighter.name,kind,fighter.hp,fighter.maxHp,partnerAlive));
  const live=enemyTeam.map((member,index)=>({member,index})).filter(item=>item.member.hp>0),targets=(pinTargetMode(pin)==="aoe"?live:[live.find(item=>item.index===plan.target)||live[0]]).filter(Boolean) as {member:PvpFighter;index:number}[];
  targets.forEach(({member,index})=>{const reduction=Math.min(.8,(shields.get(`${rival}:${index}`)||0)+passiveDamageReduction(member.name)),evades=deterministicChance(passiveDodgeChance(member.name),`${room.turn}:${step.uid}:${fighter.name}:${member.name}:${pin.id}`),damage=evades?0:Math.max(1,Math.round(typedDamage(raw,pin.element||badgeElement(pin),characterElements[member.name])*(1-reduction)));enemyTeam[index]={...member,hp:Math.max(0,member.hp-damage)};});
 }
 const next={...room,turn:room.turn+1,actions:{},updatedAt:Date.now(),players:{...room.players}};
 ids.forEach(uid=>next.players[uid]={...room.players[uid],team:teams[uid]});
 const defeated=ids.filter(uid=>teams[uid].every(f=>f.hp<=0));
 if(defeated.length||next.turn>200){next.status="finished";next.winner=defeated.length===1?ids.find(uid=>uid!==defeated[0])!:null;next.reason=next.turn>200?"draw":"knockout";}
 return next;
}
function PvpFighterDossier({fighter}:{fighter:PvpFighter}){
 const base=characterRoster.find(item=>item.name===fighter.name)!;
 const passive=characterPassives[fighter.name];
 return <article className="pvp-inspect-card"><div className="pvp-inspect-portrait"><HudPortrait fighter={base}/></div><TypeChips elements={characterElements[fighter.name]}/><dl className="team-character-stats">{[["PV",fighter.maxHp],["ATK",fighter.atk],["ATK SPE",fighter.mag],["SPE",fighter.speed]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><section className="team-character-psychs"><b>Psychs équipés</b>{fighter.loadout.map(id=>{const pin=psychs[id];return pin?<span key={id}><PinIcon pin={pin}/><small>{pin.name.replace(" (Pin)","")} · {pinTargetLabel(pin)}</small></span>:null;})}</section><div className="dossier-passive"><span aria-hidden="true">✦</span><div><small>Passif · {passive.name}</small><b>{passive.description}</b></div></div></article>;
}
function PvpBattle({matchId,close}:{matchId:string;close:()=>void}){
 const service=window.ChibiPvp,uid=window.ChibiGameSync?.accountId as string;
 const [room,setRoom]=useState<PvpRoom|null>(null),[error,setError]=useState(""),[plans,setPlans]=useState<Record<string,PvpPlan>>({}),[choosing,setChoosing]=useState<number|null>(null),[targeting,setTargeting]=useState<{index:number;pin:string}|null>(null),[rating,setRating]=useState<any>(null),[inspected,setInspected]=useState<PvpFighter|null>(null);
 useEffect(()=>service.watch(matchId,(next:PvpRoom)=>setRoom(next),()=>setError("Connexion au combat interrompue.")),[matchId]);
 useEffect(()=>{if(!room||room.status!=="active")return;const ids=[room.host,room.guest];if(ids.every(id=>room.actions?.[id]?.turn===room.turn))service.resolve(matchId,room.turn,resolvePvpRoom).catch(()=>setError("Le tour n’a pas pu être résolu."));},[room?.turn,room?.actions,room?.status]);
 useEffect(()=>{if(room?.status==="finished"&&room.mode==="ranked")service.settle(matchId,room).then(setRating).catch(()=>{});},[room?.status]);
 useEffect(()=>{setPlans({});setChoosing(null);setTargeting(null);},[room?.turn]);
 if(!room)return <section className="pvp-panel"><h1>PVP</h1><p>{error||"Connexion à l’adversaire…"}</p></section>;
 const rival=room.host===uid?room.guest:room.host,mine=room.players[uid],enemy=room.players[rival],submitted=room.actions?.[uid]?.turn===room.turn;
 const living=mine.team.map((f,index)=>({f,index})).filter(x=>x.f.hp>0),reserved=Object.values(plans).reduce((sum,plan)=>sum+(plan.kind==="psych"?psychs[plan.pin||""]?.cost||0:0),0),ready=living.every(({index})=>plans[String(index)])&&reserved<=3;
 const choosePlan=(index:number,plan:PvpPlan)=>{setPlans(old=>({...old,[String(index)]:plan}));setChoosing(null);setTargeting(null);};
 const leave=async()=>{if(room.status==="active")await service.forfeit(matchId);await service.closeMatch();close();};
 const order=[...mine.team.map((fighter,index)=>({side:"ally",fighter,index})),...enemy.team.map((fighter,index)=>({side:"enemy",fighter,index}))].filter(entry=>entry.fighter.hp>0).sort((a,b)=>b.fighter.speed-a.fighter.speed||a.side.localeCompare(b.side));
 const status=submitted?"Actions envoyées · attente de l’adversaire":ready?"Actions prêtes":"Choisis une action par personnage";
 return <main className="game-shell combat-hud pvp-combat">
  <header className="topbar"><div className="brand-lockup"><div className="brand-mark">VS</div><div><strong>{room.mode==="ranked"?"RANKED PVP":"CASUAL PVP"}</strong><span>REAPERS’ NETWORK</span></div></div><div className="run-stats"><span className="currency">TOUR {String(room.turn).padStart(2,"0")}</span><button className="currency" onClick={leave}>Abandonner</button><SoundToggle/></div></header>
  <section className="game-grid">
   <aside className="squad-panel"><div className="section-label"><span>PLAYER SQUAD</span><b>02 / 02</b></div>{mine.team.map((fighter,index)=>{const base=characterRoster.find(f=>f.name===fighter.name)!;return <article className={`fighter-card ${fighter.hp<=0?"down":""}`} key={index}><div className="portrait" style={{"--accent":base.accent} as React.CSSProperties}><HudPortrait fighter={base}/></div><div className="fighter-info"><small>{mine.name}</small><h2>{fighter.name}</h2><TypeChips elements={characterElements[fighter.name]}/><div className="health-readout"><span>HP</span><b>{fighter.hp}</b><em>/ {fighter.maxHp}</em></div><div className="bar"><i style={{width:`${100*fighter.hp/fighter.maxHp}%`}}/></div></div></article>;})}<div className="groove-card pvp-state-card"><div><span>{room.mode==="ranked"?"RANKED":"CASUAL"}</span><b>{submitted?"SYNC":"LIVE"}</b></div><small>{status}</small></div><div className="energy-card"><div><span>ÉNERGIE</span><b>{3-reserved} / 3 EN</b></div><div className="energy-pips">{[0,1,2].map(pip=><i key={pip} className={pip<3-reserved?"full":""}/>)}</div></div></aside>
   <section className="battle-column"><div className="battle-heading"><div><small>ONLINE MATCH</small><h1>{mine.name} <small className="tier-label">VS {enemy.name}</small></h1></div><div className="threat threat-high"><span>TOUR</span><b>{room.turn}</b></div></div>
    <nav className="turn-order" aria-label={`Ordre du tour ${room.turn}`}><span className="hud-turn">Tour {room.turn}</span><ol>{order.map((entry,index)=><li key={`${entry.side}-${entry.index}`} className={entry.side}><button aria-label={`${index+1}. ${entry.fighter.name} · SPE ${entry.fighter.speed}`}><HudPortrait fighter={characterRoster.find(f=>f.name===entry.fighter.name)}/><span className="turn-number">{index+1}</span></button></li>)}</ol></nav>
    <div className="arena pvp-battlefield" style={{backgroundImage:`linear-gradient(180deg,rgba(15,20,21,.04),rgba(9,12,13,.42)),url(${battleBackground})`}}><div className="turn-badge">PVP · TURN {String(room.turn).padStart(2,"0")}</div><div className="enemy-line enemies-count-2">{enemy.team.map((fighter,index)=>{const base=characterRoster.find(f=>f.name===fighter.name)!;return <button type="button" aria-label={`Voir les stats de ${fighter.name}`} className={`pvp-arena-unit enemy-unit ${fighter.hp<=0?"defeated":""}`} key={index} onClick={()=>setInspected(fighter)}><Sprite fighter={base} combat/><span className="enemy-hp"><i style={{width:`${100*fighter.hp/fighter.maxHp}%`}}/></span><small>{fighter.name}</small></button>;})}</div><div className="player-line">{mine.team.map((fighter,index)=>{const base=characterRoster.find(f=>f.name===fighter.name)!;return <div className={`arena-hero ${fighter.hp<=0?"defeated":""}`} key={index}><Sprite fighter={base} combat/><span>{fighter.name}</span></div>;})}</div><p className="combat-status" role="status">{error||status}</p></div>
    <section className={`round-planner ${choosing!==null?"choosing-action":""}`} aria-label="Préparer les actions PVP">{choosing!==null?<div className="inline-action-menu">{targeting?<><p><b>{psychs[targeting.pin].name}</b> · Choisir la cible</p><div className="target-menu">{enemy.team.map((fighter,index)=><button disabled={fighter.hp<=0} key={index} onClick={()=>choosePlan(targeting.index,{kind:"psych",pin:targeting.pin,target:index})}><HudPortrait fighter={characterRoster.find(f=>f.name===fighter.name)}/><b>{fighter.name}</b><span>{fighter.hp} / {fighter.maxHp} PV</span><TypeChips elements={characterElements[fighter.name]}/></button>)}</div><button onClick={()=>setTargeting(null)}>Retour aux actions</button></>:<><div className="psych-action-menu">{mine.team[choosing].loadout.map(id=>{const pin=psychs[id],aoe=offensive(id)&&pinTargetMode(pin)==="aoe",old=plans[choosing],oldCost=old?.kind==="psych"?psychs[old.pin||""]?.cost||0:0;return <button key={id} disabled={pin.cost+reserved-oldCost>3} onClick={()=>offensive(id)&&!aoe?setTargeting({index:choosing,pin:id}):choosePlan(choosing,{kind:"psych",pin:id})}><PinIcon pin={pin}/><b>{pin.name}</b><span>{elementNames[pin.element||badgeElement(pin)]} · {pinTargetLabel(pin)} · {pin.cost} EN</span></button>;})}<button onClick={()=>choosePlan(choosing,{kind:"guard"})}><Icon name="guard"/><b>Défense</b><span>0 EN · Protection</span></button></div><button onClick={()=>setChoosing(null)}>Annuler</button></>}</div>:<><div className="planned-actions">{mine.team.map((fighter,index)=><button key={index} disabled={submitted||fighter.hp<=0} onClick={()=>setChoosing(index)}><b>{fighter.name}</b><span>{fighter.hp<=0?"K.O.":plans[index]?planName(plans[index] as PlannedAction):"Choisir une action"}</span><small>{plans[index]?.kind==="psych"?`${psychs[plans[index].pin||""].cost} EN · Modifier`:plans[index]?"0 EN · Modifier":"Choisir"}</small></button>)}</div><button className="resolve-round" disabled={submitted||!ready} onClick={()=>service.submit(matchId,room.turn,plans).catch(()=>setError("Envoi impossible."))}>{submitted?"En attente de l’adversaire…":"Valider le tour"}</button></>}</section>
   </section>
   <aside className="route-panel pvp-opponent-panel"><div className="section-label"><span>OPPONENT</span><b>{enemy.name}</b></div>{enemy.team.map((fighter,index)=>{const base=characterRoster.find(f=>f.name===fighter.name)!;return <button type="button" aria-label={`Voir les stats de ${fighter.name}`} className={`fighter-card ${fighter.hp<=0?"down":""}`} key={index} onClick={()=>setInspected(fighter)}><div className="portrait"><HudPortrait fighter={base}/></div><div className="fighter-info"><small>ADVERSAIRE · STATS</small><h2>{fighter.name}</h2><div className="health-readout"><span>HP</span><b>{fighter.hp}</b><em>/ {fighter.maxHp}</em></div><div className="bar"><i style={{width:`${100*fighter.hp/fighter.maxHp}%`}}/></div></div></button>;})}</aside>
  </section>
  {room.status==="finished"&&<div className="overlay"><div className="modal reward-modal"><small>PVP MATCH COMPLETE</small><h2>{room.winner==null?"ÉGALITÉ":room.winner===uid?"VICTOIRE":"DÉFAITE"}</h2>{room.mode==="ranked"&&<p>{rating?`Classement : ${rating.rating} Elo`:"Mise à jour du classement…"}</p>}<button onClick={leave}>Retour au PVP</button></div></div>}
  {inspected&&<WishDialog title={`Stats adversaire · ${inspected.name}`} close={()=>setInspected(null)}><PvpFighterDossier fighter={inspected}/><button onClick={()=>setInspected(null)}>Fermer</button></WishDialog>}
 </main>;
}
function PvpLobby({profile}:{profile:Profile}){
 const [mode,setMode]=useState<PvpMode>("casual"),[searching,setSearching]=useState(false),[matchId,setMatchId]=useState<string|null>(null),[message,setMessage]=useState(""),[rating,setRating]=useState<any>(null);
 const service=window.ChibiPvp,team=pvpTeam(profile,mode),ready=team.length===2&&team.every(f=>f.loadout.length>0)&&team.some(f=>f.loadout.some(offensive));
 const failure=(error:any)=>/permission.denied|permission_denied/i.test(String(error?.code||error?.message||error))?"Le serveur PVP attend la publication des nouvelles règles Firebase.":String(error?.message||error||"Matchmaking indisponible.");
 useEffect(()=>{if(service?.ready()){service.rating(window.ChibiGameSync.accountId).then(setRating).catch(()=>{});service.currentMatch().then((id:string|null)=>id&&setMatchId(id)).catch(()=>{});}return()=>{service?.cancel();};},[]);
 const search=async()=>{setMessage("");if(!ready)return setMessage("Prépare un duo complet avec au moins un psych offensif dans Team.");if(!service?.ready())return setMessage("Connecte-toi à Discord pour jouer en ligne.");setSearching(true);try{await service.join(mode,pvpTeam(profile,mode),{match:(id:string)=>{setMatchId(id);setSearching(false);},waiting:(count:number)=>setMessage(`${count} joueur${count>1?"s":""} dans la file…`),error:(error:any)=>{setSearching(false);setMessage(failure(error));}});}catch(error){setSearching(false);setMessage(failure(error));}};
 const cancel=async()=>{await service?.cancel();setSearching(false);setMessage("");};
 if(matchId)return <PvpBattle matchId={matchId} close={()=>{setMatchId(null);service.rating(window.ChibiGameSync.accountId).then(setRating).catch(()=>{});}}/>;
 return <section className="pvp-panel"><header><small>REAPERS’ NETWORK</small><h1>PVP</h1><p>Affronte le duo d’un autre joueur avec tes personnages et tes psychs équipés.</p></header><div className="pvp-modes"><button aria-pressed={mode==="casual"} disabled={searching} onClick={()=>setMode("casual")}><span>CASUAL</span><b>Niv. 50 · Rang étoile</b><small>Statistiques normalisées · aucun point perdu</small></button><button aria-pressed={mode==="ranked"} disabled={searching} onClick={()=>setMode("ranked")}><span>RANKED</span><b>{rating?.rating||1000} Elo</b><small>{rating?`${rating.wins} V · ${rating.losses} D · ${rating.draws} N`:"Niveaux et rangs réels"}</small></button></div><div className="pvp-party">{team.map(f=><article key={f.name}><HudPortrait fighter={characterRoster.find(x=>x.name===f.name)}/><b>{f.name}</b><small>{f.loadout.length} psych(s)</small></article>)}</div>{message&&<p role="status">{message}</p>}<button className="pvp-search" disabled={!ready||searching} onClick={search}>{searching?"Recherche en cours…":`Chercher en ${mode==="ranked"?"Ranked":"Casual"}`}</button>{searching&&<button onClick={cancel}>Annuler la recherche</button>}</section>;
}
function socialProfile(profile:Profile){
 const member=(name:string)=>({name,level:experience(profile.xp[name]||0).level,rank:Math.min(5,profile.copies[name]||0),awakened:profile.awakened.includes(name),loadout:[...(profile.loadout[name]||[])]});
 return {bestFloor:profile.bestFloor,rebirths:profile.rebirths,team:profile.equipped.filter(Boolean).map(member),owned:profile.owned.map(member)};
}
function requestChatNotificationPermission():Promise<NotificationPermission>{
 if(window.parent===window)return typeof Notification==="undefined"?Promise.resolve("denied"):Notification.requestPermission();
 const requestId=crypto.randomUUID();
 return new Promise(resolve=>{const timeout=window.setTimeout(()=>{window.removeEventListener("message",receive);resolve(typeof Notification==="undefined"?"denied":Notification.permission);},12000);const receive=(event:MessageEvent)=>{if(event.source!==window.parent||event.data?.type!=="chibi:notification-permission-result"||event.data?.requestId!==requestId)return;window.clearTimeout(timeout);window.removeEventListener("message",receive);resolve(event.data.permission);};window.addEventListener("message",receive);window.parent.postMessage({type:"chibi:notification-permission-request",requestId},location.protocol==="file:"?"*":location.origin);});
}
function ChatPanel({friends}:{friends:any[]}){
 const service=window.ChibiSocial,[groups,setGroups]=useState<any[]>([]),[active,setActive]=useState<any>(null),[messages,setMessages]=useState<any[]>([]),[draft,setDraft]=useState(""),[groupName,setGroupName]=useState(""),[selected,setSelected]=useState<string[]>([]),[notice,setNotice]=useState(""),[notifications,setNotifications]=useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
 useEffect(()=>{let live=true;service.chatGroups().then((items:any[])=>{if(live){setGroups(items);if(items.length)setActive(items[0]);}}).catch((error:any)=>setNotice(String(error?.message||error)));return()=>{live=false;};},[]);
 useEffect(()=>{if(!active)return;setMessages([]);return service.watchChat(active.id,(items:any[])=>setMessages(items),(error:any)=>setNotice(String(error?.message||error)));},[active?.id]);
 useEffect(()=>{if(notifications)social.startChatNotifications().catch(()=>{});},[notifications]);
 const enable=async()=>{try{const permission=await requestChatNotificationPermission();setNotifications(permission==="granted");if(permission!=="granted")setNotice("Autorise les notifications dans les réglages du navigateur.");else{await service.enableChatPush("BGk76ZiXSpYgtoNqx-LmvxxaQEiE9p4AtqqP10O2OLmBWFB0Pa7jMrSuFp38EWlmfXAPLXNuX57AJt4Q31mOV7E");setNotice("Notifications push activées sur cet appareil.");}}catch(error){setNotice(String((error as any)?.message||"Impossible d’activer les notifications."));}};
 const create=async()=>{try{const id=await service.createChatGroup(groupName,selected),items=await service.chatGroups();setGroups(items);setActive(items.find((item:any)=>item.id===id));setGroupName("");setSelected([]);if(typeof Notification!=="undefined"&&Notification.permission==="granted")await service.startChatNotifications();}catch(error){setNotice(String((error as any)?.message||error));}};
 const send=async(event:React.FormEvent)=>{event.preventDefault();if(!active||!draft.trim())return;const text=draft;setDraft("");try{await service.sendChat(active.id,text);}catch(error){setDraft(text);setNotice(String((error as any)?.message||error));}};
 return <section className="social-chat"><header><div><h2>Messages chiffrés</h2><p>Le texte est chiffré sur ton appareil avant son envoi.</p></div><button onClick={enable}>{notifications?"Notifications actives":"Activer les notifications"}</button></header><div className="chat-layout"><aside className="chat-groups"><b>Discussions</b>{groups.map(group=><button key={group.id} aria-pressed={active?.id===group.id} onClick={()=>setActive(group)}>{group.name}<small>{Object.keys(group.members||{}).length} membres</small></button>)}</aside><div className="chat-main">{active?<><div className="chat-message-list" aria-live="polite">{messages.map(item=><article key={item.id} className={String(item.sender)===String(window.ChibiGameSync?.accountId)?"mine":""}><b>{String(item.sender)===String(window.ChibiGameSync?.accountId)?"Toi":item.senderName}</b><p>{item.text}</p><time>{item.createdAt?new Date(item.createdAt).toLocaleString():"À l’instant"}</time></article>)}</div><form onSubmit={send}><textarea value={draft} onChange={event=>setDraft(event.target.value)} maxLength={2000} placeholder="Écrire un message…"/><button disabled={!draft.trim()}>Envoyer</button></form></>:<p>Crée une discussion avec un ami pour commencer.</p>}</div></div><details className="chat-create"><summary>Créer un groupe chiffré</summary><input value={groupName} maxLength={48} onChange={event=>setGroupName(event.target.value)} placeholder="Nom du groupe"/><div>{friends.map(player=><label key={player.uid}><input type="checkbox" checked={selected.includes(String(player.uid))} onChange={event=>setSelected(old=>event.target.checked?[...old,String(player.uid)]:old.filter(id=>id!==String(player.uid)))}/>{player.name}</label>)}</div><button disabled={!selected.length} onClick={create}>Créer · {selected.length+1} membres</button><small>Jusqu’à 15 amis. Ils doivent ouvrir Social une première fois pour activer leur clé publique.</small></details>{notice&&<p role="status">{notice}</p>}</section>;
}
function FactionPanel(){
 const service=window.ChibiSocial,[faction,setFaction]=useState<any>(null),[factions,setFactions]=useState<any[]>([]),[name,setName]=useState(""),[notice,setNotice]=useState("");
 const refresh=()=>Promise.all([service.myFaction(),service.factionList()]).then(([mine,list]:any[])=>{setFaction(mine);setFactions(list||[]);}).catch((error:any)=>setNotice(String(error?.message||error)));
 useEffect(()=>{refresh();},[]);
 const create=async(event:React.FormEvent)=>{event.preventDefault();try{await service.createFaction(name);setName("");await refresh();}catch(error){setNotice(String((error as any)?.message||error));}};
 return <section className="faction-panel"><header><small>REAPERS’ NETWORK</small><h2>Factions</h2><p>Tu dois faire partie d’une faction pour participer aux raids à trois joueurs.</p></header>{faction?<article className="faction-card"><h3>{faction.name}</h3><p>{Object.keys(faction.members||{}).length} membres</p><div>{Object.values(faction.members||{}).map((member:any)=><span key={member.uid}>{member.name}</span>)}</div></article>:<><form onSubmit={create}><input value={name} maxLength={32} onChange={event=>setName(event.target.value)} placeholder="Nom de la faction"/><button disabled={name.trim().length<3}>Créer une faction</button></form><h3>Rejoindre une faction</h3><div className="faction-list">{factions.map((item:any)=><article key={item.id}><b>{item.name}</b><small>{Object.keys(item.members||{}).length} membres</small><button onClick={()=>service.joinFaction(item).then(refresh).catch((error:any)=>setNotice(String(error?.message||error)))}>Rejoindre</button></article>)}</div></>}{notice&&<p role="status">{notice}</p>}</section>;
}
type RaidRoomData={id:string;meta:any;slots:Record<string,string>;players:Record<string,{uid:string;name:string;team:PvpFighter[]}>;actions?:Record<string,Record<string,{plans:Record<string,PvpPlan>}>>;forfeits?:Record<string,boolean>};
type RaidProgress={teams:Record<string,PvpFighter[]>;bossHp:number;turn:number;won:boolean;lost:boolean};
function resolveRaidProgress(room:RaidRoomData,boss:any):RaidProgress{
 const order=Object.entries(room.slots||{}).sort(([a],[b])=>Number(a)-Number(b)).map(([,uid])=>uid).filter(uid=>room.players?.[uid]);
 const teams=Object.fromEntries(order.map(uid=>[uid,room.players[uid].team.map(f=>({...f}))])) as Record<string,PvpFighter[]>;
 let bossHp=Number(room.meta.bossHp),turn=1,finished=false;
 for(;turn<=100&&!finished;turn++){
  const submitted=room.actions?.[String(turn)]||{};if(order.length!==3||!order.every(uid=>submitted[uid]?.plans))break;
  const guards=new Map<string,number>(),actions=order.flatMap(uid=>teams[uid].map((fighter,index)=>({uid,index,speed:fighter.speed}))).filter(x=>teams[x.uid][x.index].hp>0).sort((a,b)=>b.speed-a.speed||order.indexOf(a.uid)-order.indexOf(b.uid));
  for(const step of actions){const fighter=teams[step.uid][step.index],plan=submitted[step.uid].plans[String(step.index)];if(!plan||fighter.hp<=0)continue;
   if(plan.kind==="guard"){guards.set(`${step.uid}:${step.index}`,.6);continue;}
   const pin=psychs[plan.pin||""];if(!pin||!fighter.loadout.includes(pin.id))continue;
   if(pin.kind==="heal"){const partner=teams[step.uid].find((_,i)=>i!==step.index&&teams[step.uid][i].hp>0)||fighter,amount=scaledPinEffect(pin,fighter.mag*pin.power/50*passiveHealingMultiplier(fighter.name));partner.hp=Math.min(partner.maxHp,partner.hp+amount);continue;}
   if(pin.kind==="guard"||pin.kind==="support"){teams[step.uid].forEach((ally,index)=>ally.hp>0&&guards.set(`${step.uid}:${index}`,Math.max(guards.get(`${step.uid}:${index}`)||0,pinShieldReduction(pin))));continue;}
   const kind:PassiveKind=pin.kind==="physical"?"physical":"special",partnerAlive=teams[step.uid].some((x,i)=>i!==step.index&&x.hp>0);
   const raw=scaledPinEffect(pin,(pin.kind==="physical"?fighter.atk:fighter.mag)*(.7+pin.power/100)*stabMultiplier(fighter as Fighter,pin)*passiveDamageMultiplier(fighter.name,kind,fighter.hp,fighter.maxHp,partnerAlive));
   bossHp=Math.max(0,bossHp-typedDamage(raw,pin.element||badgeElement(pin),room.meta.bossElements||boss.elements||[]));if(bossHp<=0)break;
  }
  if(bossHp<=0){finished=true;break;}
  const living=order.flatMap(uid=>teams[uid].map((fighter,index)=>({uid,index,fighter}))).filter(x=>x.fighter.hp>0);
  if(!living.length){finished=true;break;}
  const attackRatio=.22+Math.min(.2,Number(room.meta.bossAttack||0)/3000);
  for(let hit=0;hit<Math.min(3,living.length);hit++){
   const target=living[(turn*3+hit-1)%living.length],guard=guards.get(`${target.uid}:${target.index}`)||0,reduction=Math.min(.8,guard+passiveDamageReduction(target.fighter.name));
   target.fighter.hp=Math.max(0,target.fighter.hp-Math.max(1,Math.round(target.fighter.maxHp*attackRatio*(1-reduction))));
  }
  if(order.every(uid=>teams[uid].every(f=>f.hp<=0))){finished=true;break;}
 }
 const forfeited=order.some(uid=>room.forfeits?.[uid]),won=bossHp<=0,lost=forfeited||(order.length===3&&order.every(uid=>teams[uid]?.every(f=>f.hp<=0)));
 return {teams,bossHp,turn:Math.min(turn,101),won,lost};
}
function RaidBattle({roomId,profile,close}:{roomId:string;profile:Profile;close:()=>void}){
 const social=window.ChibiSocial,uid=window.ChibiGameSync?.accountId as string,[room,setRoom]=useState<RaidRoomData|null>(null),[error,setError]=useState(""),[plans,setPlans]=useState<Record<string,PvpPlan>>({}),[choosing,setChoosing]=useState<number|null>(null),[submitted,setSubmitted]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{let stop:(()=>void)|undefined;social.watchRaidRoom(roomId,(value:RaidRoomData)=>setRoom(value),(reason:any)=>setError(String(reason?.message||reason))).then((off:()=>void)=>stop=off).catch((reason:any)=>setError(String(reason?.message||reason)));return()=>stop?.();},[roomId]);
 const boss=ffbeBestiary.find(m=>m.id===room?.meta?.bossId),progress=room&&boss?resolveRaidProgress(room,boss):null,player=room?.players?.[uid],turn=progress?.turn||1,turnActions=room?.actions?.[String(turn)]||{};
 useEffect(()=>{setPlans({});setChoosing(null);setSubmitted(Boolean(turnActions[uid]?.plans));},[turn,uid]);
 if(!room||!boss||!player||!progress)return <section className="raid-battle"><p>{error||"Connexion à la salle…"}</p><button onClick={close}>Retour</button></section>;
 const players=Object.entries(room.slots||{}).sort(([a],[b])=>Number(a)-Number(b)).map(([,id])=>id).filter(id=>room.players?.[id]),ownTeam=progress.teams[uid]||player.team,actionSet=turnActions,ownReserved=Object.values(plans).reduce((n,p)=>n+(p.kind==="psych"?psychs[p.pin||""]?.cost||0:0),0),ready=players.length===3&&ownTeam.every((fighter,index)=>fighter.hp<=0||Boolean(plans[String(index)]))&&ownReserved<=3,allSubmitted=players.length===3&&players.every(id=>actionSet[id]?.plans),done=progress.won||progress.lost||Boolean(room.forfeits&&Object.values(room.forfeits).some(Boolean));
 const choose=(index:number,plan:PvpPlan)=>{setPlans(old=>({...old,[String(index)]:plan}));setChoosing(null);};
 const submit=async()=>{setBusy(true);try{await social.submitRaidAction(roomId,turn,plans);setSubmitted(true);}catch(reason){setError(String((reason as any)?.message||reason));}finally{setBusy(false);}};
 const forfeit=async()=>{try{await social.forfeitRaid(roomId);}catch{}close();};
 return <main className="game-shell raid-battle"><header className="raid-battle-header"><div><small>RAID DE FACTION · {players.length}/3 JOUEURS</small><h1>{boss.name}</h1><span>NIVEAU 200 · TOUR {turn}</span></div><button onClick={forfeit}>Quitter le Raid</button></header><section className="raid-stage"><div className="raid-boss-stage"><EnemySprite kind={boss.id} boss combat/><h2>{boss.name}</h2><p>Boss · Niveau 200 · {boss.elements.map((e:string)=>elementNames[e as ElementType]||e).join(" / ")}</p><div className="raid-boss-hp"><i style={{width:`${Math.max(0,100*progress.bossHp/room.meta.bossHp)}%`}}/></div><b>{Math.max(0,progress.bossHp).toLocaleString()} / {Number(room.meta.bossHp).toLocaleString()} PV</b></div><div className="raid-players-board">{players.map(playerId=>{const p=room.players[playerId],team=progress.teams[playerId]||p.team;return <article key={playerId} className={playerId===uid?"is-you":""}><header><b>{p.name}</b><small>{actionSet[playerId]?.plans?"ACTIONS VALIDÉES":"CHOIX EN COURS"}</small></header><div>{team.map(fighter=><span key={fighter.name} className={fighter.hp<=0?"down":""}><HudPortrait fighter={characterRoster.find(x=>x.name===fighter.name)!}/><b>{fighter.name}</b><i>{fighter.hp}/{fighter.maxHp} PV</i></span>)}</div></article>;})}</div></section><section className="raid-planner"><header><h2>Tes actions</h2><span>Énergie {3-ownReserved}/3</span></header>{ownTeam.map((fighter,index)=><article key={fighter.name} className={fighter.hp<=0?"down":""}><div><HudPortrait fighter={characterRoster.find(x=>x.name===fighter.name)!}/><b>{fighter.name}</b><small>{fighter.hp<=0?"K.O.":plans[String(index)]?.kind==="psych"?psychs[plans[String(index)].pin||""]?.name:plans[String(index)]?"Défense":"Choisir un psych"}</small></div><div className="raid-actions">{fighter.hp>0&&fighter.loadout.map(id=>{const pin=psychs[id],old=plans[String(index)],oldCost=old?.kind==="psych"?psychs[old.pin||""]?.cost||0:0;return <button key={id} disabled={submitted||pin.cost+ownReserved-oldCost>3} onClick={()=>choose(index,{kind:"psych",pin:id})}><PinIcon pin={pin}/><b>{pin.name}</b><small>{pin.cost} EN · {pinTargetLabel(pin)}</small></button>;})}<button disabled={submitted} onClick={()=>choose(index,{kind:"guard"})}><b>Défendre</b><small>Protège des frappes du boss</small></button></div></article>)}<button className="raid-submit" disabled={!ready||submitted||busy||done} onClick={submit}>{players.length<3?"En attente de 3 factionnaires…":submitted?"Actions envoyées · attente des factionnaires":busy?"Envoi…":"Valider mes actions"}</button></section>{done&&<div className="overlay"><div className="modal reward-modal"><small>RAID DE FACTION</small><h2>{progress.won?"BOSS VAINCU":progress.lost?"RAID TERMINÉ":"RAID TERMINÉ"}</h2><p>{progress.won?"Les trois équipes ont terrassé le boss.":"Le groupe a été vaincu ou un joueur a quitté le combat."}</p><button onClick={close}>Retour à la salle des Raids</button></div></div>}{error&&<p className="raid-error" role="alert">{error}</p>}</main>;
}
function RaidHall({navigate,profile}:{navigate:(screen:GameScreen)=>void;profile:Profile}){
 const social=window.ChibiSocial,[faction,setFaction]=useState<any>(null),[rooms,setRooms]=useState<RaidRoomData[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[selectedBoss,setSelectedBoss]=useState<any>(null),[activeRoom,setActiveRoom]=useState<string|null>(null),[creating,setCreating]=useState(false);
 const team=pvpTeam(profile,"ranked"),ready=team.length===2&&team.every(f=>f.loadout.length>0)&&team.some(f=>f.loadout.some(offensive));
 const bosses=useMemo(()=>[...ffbeBestiary].filter(m=>m.enabled&&m.boss).sort((a,b)=>b.hp-a.hp).slice(0,12),[]);
 useEffect(()=>{let stop:(()=>void)|undefined;social.myFaction().then((mine:any)=>{setFaction(mine);if(!mine)throw Error("Tu dois être dans une faction pour participer aux Raids.");return social.watchRaidRooms(setRooms,(reason:any)=>setError(String(reason?.message||reason)));}).then((off:()=>void)=>stop=off).catch((reason:any)=>setError(String(reason?.message||reason))).finally(()=>setLoading(false));return()=>stop?.();},[]);
 const makeRoom=async()=>{if(!selectedBoss)return;setCreating(true);try{const id=await social.createRaidRoom(selectedBoss,team);setActiveRoom(id);}catch(reason){setError(String((reason as any)?.message||reason));}finally{setCreating(false);}};
 const join=async(room:RaidRoomData)=>{try{await social.joinRaidRoom(room.id,team);setActiveRoom(room.id);}catch(reason){setError(String((reason as any)?.message||reason));}};
 if(activeRoom)return <RaidBattle roomId={activeRoom} profile={profile} close={()=>setActiveRoom(null)}/>;
 return <section className="raid-hall hub-panel"><header><small>COOPÉRATION · FACTION</small><h1>Raid · 3 joueurs contre Boss</h1><p>Trois factionnaires, six personnages. Coordonnez vos actions et terrassez le boss de niveau 200.</p></header>{!faction?<section className="raid-gate"><h2>Rejoins une faction</h2><p>Le Raid est réservé aux joueurs affiliés à une faction.</p><button onClick={()=>navigate("social")}>Ouvrir Social · Factions</button></section>:<><section className="raid-boss-picker"><h2>Choisis un boss</h2><div>{bosses.map(boss=><button key={boss.id} aria-pressed={selectedBoss?.id===boss.id} onClick={()=>setSelectedBoss(boss)}><EnemySprite kind={boss.id} boss/><b>{boss.name}</b><small>Niv. 200 · {boss.elements.map((e:string)=>elementNames[e as ElementType]||e).join(" / ")}</small></button>)}</div></section>{selectedBoss&&<div className="raid-boss-card"><div className="raid-boss-art"><EnemySprite kind={selectedBoss.id} boss/></div><div><small>BOSS FFBE · NIVEAU 200</small><h2>{selectedBoss.name}</h2><p>PV {Math.max(18000,Math.min(70000,selectedBoss.hp*8)).toLocaleString()} · ATK {selectedBoss.attack.toLocaleString()} · {selectedBoss.elements.join(" / ")}</p></div></div>}<button className="raid-join-button" disabled={!ready||!selectedBoss||creating} onClick={makeRoom}>{creating?"Création de la salle…":"Créer une salle de Raid"}</button>{!ready&&<p>Prépare un duo complet avec ses psychs offensifs dans Team.</p>}<h2>Salles de ta faction</h2>{loading?<p>Chargement des salles…</p>:<div className="raid-room-list">{rooms.filter(room=>!room.forfeits||!Object.values(room.forfeits).every(Boolean)).map(room=>{const ids=Object.values(room.slots||{}),joined=ids.includes(String(window.ChibiGameSync?.accountId)),full=ids.length>=3;return <article key={room.id}><EnemySprite kind={room.meta.bossId} boss/><div><h3>{room.meta.bossName}</h3><p>{ids.length}/3 joueurs · {joined?"Tu es dans cette salle":full?"Salle complète":"En attente de factionnaires"}</p></div><button disabled={!ready||(!joined&&full)} onClick={()=>joined?setActiveRoom(room.id):join(room)}>{joined?"Reprendre":full?"Complète":"Rejoindre"}</button></article>;})}{!rooms.length&&<p>Aucune salle ouverte. Choisis un boss et crée la première salle.</p>}</div>}</>}{error&&<p role="alert">{error}</p>}</section>;
}
function SocialHub({profile}:{profile:Profile}){
 const service=window.ChibiSocial,pvp=window.ChibiPvp;
 const [tab,setTab]=useState<"players"|"friends"|"requests"|"invites"|"chat"|"faction">("players"),[data,setData]=useState<any>({profiles:[],friends:[],requests:[],invites:[]}),[selected,setSelected]=useState<any>(null),[message,setMessage]=useState(""),[matchId,setMatchId]=useState<string|null>(null),[sent,setSent]=useState<string[]>([]);
 const team=pvpTeam(profile,"casual"),canFight=team.length===2&&team.every(f=>f.loadout.length>0)&&team.some(f=>f.loadout.some(offensive));
 const fail=(error:any)=>/permission.denied|permission_denied/i.test(String(error?.code||error?.message||error))?"Social attend la publication des nouvelles règles Firebase.":String(error?.message||error||"Action impossible.");
 useEffect(()=>{
  if(!service?.ready())return;
  service.publish(socialProfile(profile)).catch((error:any)=>setMessage(fail(error)));
  const stop=service.watch(setData,(error:any)=>setMessage(fail(error)));
  const stopActive=pvp?.watchActive((id:string|null)=>id&&setMatchId(id),(error:any)=>setMessage(fail(error)));
  pvp?.currentMatch().then((id:string|null)=>id&&setMatchId(id)).catch(()=>{});
  return()=>{stop?.();stopActive?.();};
 },[]);
 if(matchId)return <PvpBattle matchId={matchId} close={()=>setMatchId(null)}/>;
 if(!service?.ready())return <section className="social-panel hub-panel"><header><small>REAPERS’ NETWORK</small><h1>Social</h1><p>Connecte-toi à Discord pour retrouver les autres joueurs, ajouter des amis et lancer des défis Casual.</p></header></section>;
 const profileById=(uid:string)=>data.profiles.find((item:any)=>String(item.uid)===String(uid));
 const friendIds=new Set(data.friends.map((item:any)=>String(item.uid)));
 const challenge=async(player:any)=>{setMessage("");if(!canFight)return setMessage("Prépare un duo complet avec un psych offensif dans Team.");try{await service.invite(player.uid,team);setMessage(`Invitation Casual envoyée à ${player.name}.`);}catch(error){setMessage(fail(error));}};
 const playerCard=(player:any,friend=false)=><article className="social-player" key={player.uid}><button className="social-player-main" onClick={()=>setSelected(profileById(player.uid)||player)}>{player.team?.[0]?<HudPortrait fighter={characterRoster.find(f=>f.name===player.team[0].name)}/>:<span className="social-avatar">◎</span>}<span><b>{player.name}</b><small>Étage {player.bestFloor||0} · Rebirth {player.rebirths||0}</small><em>{player.owned?.length||0} personnages · Voir le profil</em></span></button><div className="social-actions">{friend?<><button disabled={!canFight} onClick={()=>challenge(profileById(player.uid)||player)}>Défier</button><button className="quiet" onClick={()=>service.removeFriend(player.uid).catch((error:any)=>setMessage(fail(error)))}>Retirer</button></>:<button disabled={friendIds.has(String(player.uid))||sent.includes(String(player.uid))} onClick={()=>service.request(player.uid,player.name).then(()=>setSent(old=>[...old,String(player.uid)])).catch((error:any)=>setMessage(fail(error)))}>{friendIds.has(String(player.uid))?"Ami":sent.includes(String(player.uid))?"Envoyée":"Ajouter"}</button>}</div></article>;
 const shown=tab==="players"?data.profiles:tab==="friends"?data.friends:[];
 return <section className="social-panel hub-panel"><header><small>REAPERS’ NETWORK</small><h1>Social</h1><p>Ajoute des amis, inspecte leurs équipes et lance un combat Casual directement.</p></header>
  <div className="social-tabs">{([["players","Joueurs",data.profiles.length],["friends","Amis",data.friends.length],["requests","Demandes",data.requests.length],["invites","Défis",data.invites.length],["chat","Chat","✉"],["faction","Faction","⚑"]] as const).map(([id,label,count])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><b>{label}</b><span>{count}</span></button>)}</div>
  {message&&<p className="social-message" role="status">{message}</p>}
  {(tab==="players"||tab==="friends")&&<div className="social-list">{shown.length?shown.map((entry:any)=>playerCard(profileById(entry.uid)||entry,tab==="friends")):<p>Aucun joueur dans cette section pour le moment.</p>}</div>}
  {tab==="chat"&&<ChatPanel friends={data.friends}/>} {tab==="faction"&&<FactionPanel/>}
  {tab==="requests"&&<div className="social-list">{data.requests.length?data.requests.map((player:any)=><article className="social-request" key={player.uid}><b>{player.name}</b><span>veut devenir ton ami.</span><div><button onClick={()=>service.acceptRequest(player).catch((error:any)=>setMessage(fail(error)))}>Accepter</button><button className="quiet" onClick={()=>service.declineRequest(player.uid).catch((error:any)=>setMessage(fail(error)))}>Refuser</button></div></article>):<p>Aucune demande d’ami en attente.</p>}</div>}
  {tab==="invites"&&<div className="social-list">{data.invites.length?data.invites.map((invitation:any)=><article className="social-request social-challenge" key={invitation.uid}><b>{invitation.name}</b><span>te défie en Casual · Niv. 50 · Rang étoile.</span><div><button disabled={!canFight} onClick={()=>service.acceptInvite(invitation,team).then(setMatchId).catch((error:any)=>setMessage(fail(error)))}>Combattre</button><button className="quiet" onClick={()=>service.declineInvite(invitation.uid).catch((error:any)=>setMessage(fail(error)))}>Refuser</button></div></article>):<p>Aucun défi PVP en attente.</p>}</div>}
  {selected&&<WishDialog className="social-profile-dialog" title={`Profil · ${selected.name}`} close={()=>setSelected(null)}><div className="social-record"><span>Record <b>Étage {selected.bestFloor||0}</b></span><span>Rebirth <b>{selected.rebirths||0}</b></span><span>Collection <b>{selected.owned?.length||0}</b></span></div><h3>Team</h3><div className="social-team">{selected.team?.length?selected.team.map((member:any)=><article key={member.name}><div className="social-team-hero"><div className="social-character-art"><SpritePreview fighter={characterRoster.find(f=>f.name===member.name)!} maximumScale={1.15}/></div><span className="social-team-copy"><b>{member.name}</b><small>Niv. {member.level} · Rang {member.rank===5?"★":ranks[member.rank||0]}</small><TypeChips elements={characterElements[member.name]}/></span></div><div className="social-psychs">{member.loadout?.map((id:string)=>{const pin=psychs[id];return pin?<span key={id}><PinIcon pin={pin}/><small>{pin.name.replace(" (Pin)","")} · {pinTargetLabel(pin)}</small></span>:null;})}</div></article>):<p>Team non configurée.</p>}</div><h3>Personnages obtenus</h3><div className="social-collection">{selected.owned?.map((member:any)=>{const fighter=characterRoster.find(f=>f.name===member.name);return fighter?<span key={member.name}><HudPortrait fighter={fighter}/><b>{member.name}</b><small>Niv. {member.level} · {member.rank===5?"★":ranks[member.rank||0]}</small></span>:null;})}</div><button onClick={()=>setSelected(null)}>Fermer</button></WishDialog>}
 </section>;
}
function LaunchNews({navigate,close}:{navigate:(screen:GameScreen)=>void;close:()=>void}) {
 const open=(screen:GameScreen)=>{close();navigate(screen);};
 const previewNames=["X","SONIC","MARLUXIA","AXEL"];
 const rarePins=pinList.filter(pin=>["A","Reaper","Angel"].includes(pin.grade||"")).slice(0,3);
 return <WishDialog className="launch-news" title="Update Details"><div className="launch-news-feed">
  <button className="news-feature" onClick={()=>open("summon")}>
   <span className="news-kicker">CHECK!! · SECONDE VAGUE</span><strong>Final Fantasy Sonic X<br/><em>×</em> Organisation XIII</strong>
   <span className="news-feature-cast">{previewNames.map(name=><SpritePreview key={name} fighter={characterRoster.find(f=>f.name===name)!} maximumScale={.62}/>)}</span>
   <small>Publication le 1er décembre 2026 · Ouvrir les portails <b>→</b></small>
  </button>
  <section className="news-copy"><p>La mise à jour de la seconde vague est prête. Voici l’ensemble des changements :</p>
   <ol><li><b>Social</b> — profils joueurs, collections, équipes détaillées, amis et défis PVP Casual directs.</li><li><b>PVP en ligne</b> — Casual normalisé au niveau 50 et rang étoile, ou Ranked avec classement Elo et progression réelle.</li><li><b>Roguelike cauchemar</b> — difficulté fortement renforcée dès l’étage 50 et reprise plafonnée au palier 6 après avoir quitté une run plus avancée.</li><li><b>Rebirth</b> — vaincre l’étage 100 offre 5 000 pièces et débloque un nouveau cycle aux taux de badges rares renforcés.</li><li><b>2 nouveaux portails</b> — X, Sonic, Zero, Shadow, Knuckles et Tails dans « Final Fantasy Sonic X » ; Marluxia, Lexaeus, Axel et Larxene dans « XIII ».</li><li><b>Garantie débutant</b> — la toute première invocation du compte donne toujours un personnage, même dans un multi de 10.</li><li><b>Garantie revue</b> — un personnage garanti au 100e vœu, avec 10 % de chance sur chaque autre invocation.</li><li><b>Rareté graduelle</b> — les badges de rang supérieur deviennent plus rares dans les portails comme sur les ennemis.</li><li><b>Combat enrichi</b> — psychs monocibles ou AoE et Sync Burst égal à 5× la meilleure statistique offensive.</li><li><b>Quêtes quotidiennes</b> — 3 objectifs journaliers pour 200 pièces au total.</li></ol>
  </section>
  <button className="news-update news-daily" onClick={()=>open("quests")}><span className="news-update-art"><Icon name="coin"/><b>200</b></span><span><small>QUÊTES DU JOUR</small><b>3 missions · 2 vœux</b><em>Vague, ennemis et Sync Burst</em></span><i aria-hidden="true">→</i></button>
  <button className="news-update news-rates" onClick={()=>open("summon")}><span className="news-update-art news-pin-art">{rarePins.map(pin=><span className="news-pin-cell" key={pin.id}><BadgeArt pin={pin}/></span>)}</span><span><small>TAUX D’OBTENTION</small><b>1er vœu personnage garanti</b><em>Puis garantie au 100e · Les hauts rangs sont plus rares</em></span><i aria-hidden="true">→</i></button>
  <button className="news-update news-combat" onClick={()=>open("team")}><span className="news-update-art">{["ZERO","SHADOW"].map(name=><SpritePreview key={name} fighter={characterRoster.find(f=>f.name===name)!} maximumScale={.58}/>)}</span><span><small>SYSTÈME DE COMBAT</small><b>AoE · Cible · Burst ultime</b><em>Prépare tes psychs dans Team</em></span><i aria-hidden="true">→</i></button>
  <button className="news-update news-events" onClick={()=>open("events")}><span className="news-update-art">{["NEKU","AERITH"].map(name=><SpritePreview key={name} fighter={characterRoster.find(f=>f.name===name)!} maximumScale={.75}/>)}</span><span><small>ÉVÉNEMENTS</small><b>Boss niveau 200</b><em>Personnages et badges signature à gagner</em></span><i aria-hidden="true">→</i></button>
  <button className="news-update news-pvp" onClick={()=>open("pvp")}><span className="news-update-art"><b>VS</b></span><span><small>PVP EN LIGNE</small><b>Casual · Ranked</b><em>Niveau 50 normalisé ou classement Elo</em></span><i aria-hidden="true">→</i></button>
  <button className="news-update news-social" onClick={()=>open("social")}><span className="news-update-art"><b>◎</b></span><span><small>REAPERS’ NETWORK</small><b>Profils · Amis · Défis</b><em>Inspecte les Teams et lance un Casual direct</em></span><i aria-hidden="true">→</i></button>
  </div>
  <button className="launch-news-close" onClick={close}>Fermer</button>
 </WishDialog>;
}

function HubHome({profile,navigate}:{profile:Profile;navigate:(screen:GameScreen)=>void}) {
 const names=profile.equipped.filter(Boolean),duo=(names.length?names:["NEKU"]).map(name=>characterRoster.find(f=>f.name===name)!);
 const rewards=questsFor(profile).filter(q=>q.progress>=q.goal&&!profile.claimedQuests.includes(q.id)).length+dailyQuestsFor(profile).filter(q=>q.progress>=q.goal&&!profile.claimedDailyQuests.includes(q.id)).length;
 const modeRail=React.useRef<HTMLDivElement>(null);
 const moveMode=(direction:number)=>{
   const rail=modeRail.current;if(!rail)return;
   const cards=Array.from(rail.children) as HTMLElement[];if(!cards.length)return;
   const current=cards.reduce((nearest,card,index)=>Math.abs(card.offsetLeft-rail.scrollLeft)<Math.abs(cards[nearest].offsetLeft-rail.scrollLeft)?index:nearest,0);
   const next=(current+direction+cards.length)%cards.length;
   rail.scrollTo({left:cards[next].offsetLeft,behavior:"smooth"});
 };
 return <section className="hub-home"><div className="hub-home-heading"><small>SHIBUYA · REAPERS’ GAME</small><h1>À toi de jouer.</h1><span>Record · Étage {profile.bestFloor} / 100</span></div>
  <div className="hub-home-stage"><div className="hub-home-halo" aria-hidden="true"/>{duo.map(f=><SpritePreview key={f.name} fighter={f} maximumScale={2.5}/>)}</div>
  <div className="home-mode-switcher"><button className="home-mode-arrow" aria-label="Voir le mode précédent" onClick={()=>moveMode(-1)}>‹</button><div className="home-modes" ref={modeRail} aria-label="Choisir un mode de jeu"><button className="hub-play home-mode-card" onClick={()=>navigate("roguelike")}><small>MODE DE JEU</small><b>Roguelike</b><span>Gravis les 100 étages</span></button><button className="hub-play home-mode-card" onClick={()=>navigate("events")}><small>MODE DE JEU</small><b>Événement</b><span>Défie les personnages</span></button><button className="hub-play home-mode-card pvp-mode-card" onClick={()=>navigate("pvp")}><small>MODE EN LIGNE</small><b>PVP</b><span>Casual · Ranked</span></button><button className="hub-play home-mode-card raid-mode-card" onClick={()=>navigate("raid")}><small>MODE DE FACTION</small><b>Raid · 3 joueurs</b><span>Affronte un boss niveau 200</span></button></div><button className="home-mode-arrow" aria-label="Voir le mode suivant" onClick={()=>moveMode(1)}>›</button></div>
  <div className="hub-shortcuts"><button onClick={()=>navigate("quests")}><span>◇</span><b>Quêtes</b><small>{rewards?`${rewards} récompense${rewards>1?"s":""}`:"Ta progression"}</small></button><button onClick={()=>navigate("summon")}><span>✦</span><b>Invocations</b><small>{profile.freeWishes} vœux gratuits</small></button><button onClick={()=>navigate("collection")}><span>▦</span><b>Collection</b><small>{profile.owned.length} personnages</small></button></div>
 </section>;
}
function AwakeningPanel({profile,awaken}:{profile:Profile;awaken:(name:string)=>void}) {
 const owned=characterRoster.filter(f=>profile.owned.includes(f.name));
 return <section className="awakening-panel"><header><h2>Éveil</h2><p>Obtiens 5 doublons pour éveiller un personnage et débloquer son bonus permanent.</p></header>
  {!owned.length?<p>Débloque des personnages dans les invocations pour suivre leur éveil.</p>:<div className="awakening-list">{owned.map(fighter=>{
    const copies=Math.min(5,profile.copies[fighter.name]||0),awakened=profile.awakened.includes(fighter.name);
    return <article key={fighter.name}><HudPortrait fighter={fighter}/><div><b>{fighter.name}</b><small>{awakened?"Éveillé · bonus actif":`${copies} / 5 doublons`}</small><div className="awakening-ranks" aria-label={`${fighter.name} : ${copies} doublons`}>
      {ranks.map((_,rank)=><span key={rank} className={rank<=copies?"":"locked"}><RankBadge level={rank}/></span>)}
    </div></div>{!awakened&&<button disabled={copies<5} onClick={()=>awaken(fighter.name)}>{copies<5?`${5-copies} manquant${5-copies>1?"s":""}`:"Éveiller"}</button>}</article>;
  })}</div>}</section>;
}
function RoguelikeLaunch({profile,navigate,start,resume,abandon,rebirth}:{profile:Profile;navigate:(screen:GameScreen)=>void;start:()=>void;resume:()=>void;abandon:()=>void;rebirth:()=>void}) {
 const [confirm,setConfirm]=useState(false),[rebirthConfirm,setRebirthConfirm]=useState(false),fighters=profile.equipped.filter(Boolean),ready=fighters.length===2&&fighters.every(name=>profile.loadout[name]?.length)&&fighters.some(name=>profile.loadout[name]?.some(offensive)),run=profile.run?.status==="active"?profile.run:null;
 return <section className="hub-panel roguelike-launch"><h1>Roguelike</h1><p>Choisis ton duo et ses psychs dans Team, puis tente l’ascension de 100 étages.</p>
  <p className="run-status">Rebirth {profile.rebirths} · Bonus de rareté ×{(1+Math.min(8,profile.rebirths)*.5).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")}</p>
  <div className="roguelike-party">{fighters.map(name=>{const fighter=characterRoster.find(f=>f.name===name)!;return <article key={name}><div className="roguelike-fighter-art"><SpritePreview fighter={fighter} maximumScale={2.25}/></div><b>{name}</b><TypeChips elements={characterElements[name]}/><small>{profile.loadout[name]?.length||0} psych(s) équipés</small></article>})}{fighters.length<2&&<p>Il manque {2-fighters.length} personnage(s) dans ta Team.</p>}</div>
  {!ready&&!run&&<button onClick={()=>navigate("team")}>Préparer Team</button>}
  {run?<><p className="run-status">Run sauvegardée · Étage {run.wave} · Palier {difficultyAt(run.wave).tier} · {run.team.map(f=>f.name).join(" / ")}</p><div className="dialog-actions"><button className="pull-button" onClick={resume}>Reprendre l’étage {run.wave}</button><button onClick={()=>setConfirm(true)}>Abandonner la run</button></div></>:<button className="pull-button" disabled={!ready} onClick={start}>Commencer le roguelike</button>}
  {profile.run?.status==="lost"&&<p>Run perdue · Une nouvelle run commence à l’étage 1.</p>}
  {profile.rebirthReady&&<section className="rebirth-panel"><h2>Rebirth disponible</h2><p>L’étage 100 est vaincu et 5 000 pièces ont été ajoutées. Recommence l’ascension avec de meilleurs taux de badges rares.</p><button className="pull-button" disabled={Boolean(run)} onClick={()=>setRebirthConfirm(true)}>Activer le Rebirth</button>{run&&<small>Termine ou abandonne la run sauvegardée avant le Rebirth.</small>}</section>}
  {confirm&&<WishDialog title="Abandonner la run ?" close={()=>setConfirm(false)}><p>La reprise de cette run sera supprimée. Tes personnages, tes badges et tes récompenses déjà gagnées sont conservés.</p><div className="dialog-actions"><button onClick={()=>setConfirm(false)}>Annuler</button><button onClick={()=>{abandon();setConfirm(false);}}>Abandonner</button></div></WishDialog>}
  {rebirthConfirm&&<WishDialog title="Activer le Rebirth ?" close={()=>setRebirthConfirm(false)}><p>Les personnages non éveillés reviennent au rang E. Les badges sous les rangs Reaper et Ange sont retirés, à l’exception des psychs de base nécessaires. Les personnages éveillés, niveaux, monnaies et badges Reaper/Ange sont conservés.</p><div className="dialog-actions"><button onClick={()=>setRebirthConfirm(false)}>Annuler</button><button onClick={()=>{rebirth();setRebirthConfirm(false);}}>Confirmer le Rebirth</button></div></WishDialog>}
 </section>;
}
function HubMenu({navigate,quit}:{navigate:(screen:GameScreen)=>void;quit:()=>void}) {
 const groups:{label:string;links:[GameScreen,string,string][]}[]=[
  {label:"Activités",links:[["roguelike","Roguelike","Lancer ou reprendre une run"],["events","Événement","Défie les personnages"],["raid","Raid","Boss niveau 200 · Réservé aux factions"],["pvp","PVP","Casual normalisé et Ranked Elo"]]},
  {label:"Progression",links:[["quests","Quêtes","Étages, collection, quotidiennes et missions PC"],["journal","Historique des vœux","Résultats, coûts et soldes"],["bestiary","Bestiaire","Créatures, boss, types et comportements"],["collection","Collection","Personnages et badges"],["team","Team & psychs","Duo, psychs et éveils"]]},
  {label:"Communauté et options",links:[["social","Social","Amis, profils et défis Casual"],["settings","Paramètres","Musique et effets sonores"]]}
 ];
 return <section className="hub-panel menu-workspace"><h1>Menu</h1>{groups.map(({label,links})=><section className="menu-group" key={label}><h2>{label}</h2><div className="hub-menu-links">{links.map(([id,title,desc])=><button key={id} onClick={()=>navigate(id)}><b>{title}</b><small>{desc}</small><span aria-hidden="true">›</span></button>)}</div></section>)}<button className="quit-game" onClick={quit}><b>Quitter le jeu</b><small>Retour à l’application mobile</small><span aria-hidden="true">↩</span></button><section className="hub-help"><h2>Guide du jeu</h2><p>Forme une Team de 2 personnages et équipe jusqu’à 3 psychs chacun. Choisis toutes les actions, puis lance le tour : les portraits en haut indiquent l’ordre de vitesse. Touche 2 fois un ennemi pour consulter ses stats.</p><p>Une attaque du même type que son personnage reçoit le STAB : sa puissance est multipliée par 1,2.</p><p>La première invocation d’un nouveau compte garantit un personnage. Ensuite, chaque vœu a 10 % de chances d’en donner un et le 100e le garantit.</p><p>Les psychs ne peuvent pas être partagés entre partenaires. Les doublons font progresser le rang d’un personnage jusqu’à l’étoile, à 5 doublons.</p></section></section>;
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

function PortalSelector({portal,disabled,select}:{portal:string;disabled:boolean;select:(id:string)=>void}) {
 const rail=React.useRef<HTMLDivElement>(null);
 const entries=Object.entries(portals).filter(([id])=>portalAvailable(id));
 const current=entries.findIndex(([id])=>id===portal);
 React.useLayoutEffect(()=>{
  const list=rail.current;
  const button=list?.querySelector<HTMLElement>('[aria-pressed="true"]');
  if(!list||!button)return;
  const bounds=list.getBoundingClientRect(),target=button.getBoundingClientRect();
  if(target.left<bounds.left)list.scrollLeft+=target.left-bounds.left-4;
  if(target.right>bounds.right)list.scrollLeft+=target.right-bounds.right+4;
 },[portal]);
 return <div className="portal-picker">
  <button className="portal-arrow" type="button" aria-label="Portail précédent" disabled={disabled||current<=0} onClick={()=>select(entries[current-1][0])}>‹</button>
  <div className="portal-selector noir-tabs" ref={rail} role="group" aria-label="Choisir un portail">
   {entries.map(([id,title])=><button type="button" key={id} aria-pressed={portal===id} disabled={disabled} onClick={()=>select(id)}>{id==="shibuya"?"First Week #1":title}</button>)}
  </div>
  <button className="portal-arrow" type="button" aria-label="Portail suivant" disabled={disabled||current===entries.length-1} onClick={()=>select(entries[current+1][0])}>›</button>
 </div>;
}

function App() {
  useEffect(gameSound.connect,[]);
  const [profile, displayProfile] = useState(loadProfile);
  const profileRef=React.useRef(profile);profileRef.current=profile;
  const runSignature=React.useRef<string|null>(null);
  const [editingSlot,setEditingSlot]=useState<number|null>(null);
  const [teamSection,setTeamSection]=useState<"characters"|"awakening"|"team">("team");
  const [battleLoadout,setBattleLoadout]=useState<Record<string,string[]>>({});
  const [resumeRun,setResumeRun]=useState<RunSave|null>(null);
  const [party, setParty] = useState<Fighter[] | null>(null);
  const [result, setResult] = useState<Wish[]>([]);
  const [quantity,setQuantity]=useState(1);
  const [portal,setPortal]=useState("shibuya");
  const [eventTarget,setEventTarget]=useState<string|null>(null);
  const [phase, setPhase] = useState<"ready" | "rates" | "confirm" | "crank" | "spin" | "drop" | "reveal">("ready");
  const turning = React.useRef(false);
  const [screen,setScreen]=useState<GameScreen>(gachaView?"summon":"home");
  const [newsOpen,setNewsOpen]=useState(true);
  const [rateFighter,setRateFighter]=useState<string|null>(null);
  const navigate=(next:GameScreen)=>{if(turning.current)return;setRateFighter(null);setEventTarget(null);setPhase("ready");setScreen(next);};
  const navigationRef=React.useRef({party,navigate});navigationRef.current={party,navigate};
  useEffect(()=>{
   const receive=(event:MessageEvent)=>{if(event.source!==window.parent||(event.origin!==location.origin&&!(location.protocol==="file:"&&event.origin==="null"))||event.data?.type!=="chibi:game-navigate"||navigationRef.current.party)return;
    if(["home","team","summon","collection","social","quests","journal","bestiary","menu","raid"].includes(event.data.screen))navigationRef.current.navigate(event.data.screen);
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
    const next = assignBasePsychs(refreshDailyQuests(update(accrueDailyWishes(applyCetrucRecovery(current,window.ChibiGameSync?.identity)))));
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
  const guaranteed=profile.wishesMade===0||profile.wishStep===99;
  const percent=(v:number)=>v.toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR",{style:"percent",maximumFractionDigits:3});
  const portalName=portal==="shibuya"?"First Week #1":portals[portal];
  const closeDialog=()=>setPhase("ready");
  const recruit = (id:string,count:number) => {
    if (turning.current || historyFull(profile)) return;
    const draws:Wish[] = [];
    setProfile(p => {
      if (historyFull(p) || p.coins!==profile.coins || wishCost(p,count)!==price || p.coins<price) return p;
      const quote=wishQuote(p,count);
      const next={...p,wishesMade:p.wishesMade+count,freeWishes:p.freeWishes-quote.free,freeWishSpent:p.freeWishSpent+quote.free,freeWishDaySpent:p.freeWishDaySpent+quote.free,pins:[...p.pins],pinCopies:{...p.pinCopies},coins:p.coins-quote.cost,owned:[...p.owned],levels:{...p.levels},copies:{...p.copies}};
      for(let i=0;i<count;i++){
        const firstWishCharacter=p.wishesMade===0&&i===0;
        next.wishStep=(next.wishStep+1)%100;
        if(!firstWishCharacter&&next.wishStep!==0 && Math.random()>=characterChance){
          const pin=weightedPinPick(p.rebirths);
          if(!next.pins.includes(pin.id)) next.pins.push(pin.id);
          next.pinCopies[pin.id]=(next.pinCopies[pin.id]||0)+1;
          draws.push({pin});
          continue;
        }
        const name=pick(portalPool(id,next)).name;
        if(next.owned.includes(name)) {if(next.awakened.includes(name)){next.freeWishes+=10;next.awakenedMultiRefunds={...next.awakenedMultiRefunds,[name]:(next.awakenedMultiRefunds[name]||0)+1};}else next.copies[name]=Math.min(5,(next.copies[name]||0)+1);}
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
  const resume=()=>{const saved=loadProfile().run;if(!saved||saved.status!=="active")return;const run=saved.wave>60?rollbackRunToTierSix(saved):saved;if(run!==saved)setProfile(p=>p.run?.id===saved.id?{...p,run}:p);runSignature.current=combatFingerprint({...loadProfile(),run});setResumeRun(run);setBattleLoadout(run.loadout);setParty(run.team);};
  const startRun=()=>{
    let created:RunSave|null=null;
    setProfile(p=>{if(p.run?.status==="active"||p.equipped.filter(Boolean).length!==2||!p.equipped.every(name=>p.loadout[name]?.length))return p;created=newRun(p);return {...p,run:created,hasPlayed:true,bestFloor:Math.max(1,p.bestFloor)};});
    if(created){runSignature.current=combatFingerprint(loadProfile());setResumeRun(created);setBattleLoadout(created.loadout);setParty(created.team);}
  };
  const startEvent=(boss:string)=>{
    let chosen:RunSave|null=null;
    setProfile(p=>{
      if(p.eventRun?.run.status==="active"){if(p.eventRun.boss===boss)chosen=p.eventRun.run;return p;}
      if(!characterRoster.some(f=>f.name===boss)||p.equipped.filter(Boolean).length!==2||!p.equipped.every(n=>p.loadout[n]?.length)||!p.equipped.some(n=>p.loadout[n]?.some(offensive)))return p;
      const run=newRun(p);run.enemies=eventWave(boss,1,run.id);chosen=run;return {...p,eventRun:{boss,run,prize:"none"}};
    });
    if(chosen){runSignature.current=combatFingerprint(loadProfile());setResumeRun(chosen);setBattleLoadout(chosen.loadout);setParty(chosen.team);}
  };
  const event=resumeRun&&profile.eventRun?.run.id===resumeRun.id?profile.eventRun:null;
  if (party && resumeRun) return <Battle key={resumeRun.id} event={event} initialRun={resumeRun} initialTeam={party} loadout={battleLoadout} coins={profile.coins} rebirths={profile.rebirths}
    onCheckpoint={(snapshot,gains)=>setProfile(p=>event?eventCheckpoint(p,snapshot,gains):applyRunCheckpoint(p,snapshot,gains))}
    leave={() => { runSignature.current=null;setParty(null);setResumeRun(null);setScreen(event?"events":"roguelike"); setResult([]); }} />;
  const hub=(content:React.ReactNode)=><GameHub profile={profile} screen={screen} navigate={navigate} openNews={()=>setNewsOpen(true)}>{<>{content}{newsOpen&&<LaunchNews navigate={navigate} close={()=>setNewsOpen(false)}/>}</>}</GameHub>;
  if(screen==="home")return hub(<HubHome profile={profile} navigate={navigate}/>);
  if(screen==="roguelike")return hub(<RoguelikeLaunch profile={profile} navigate={navigate} start={startRun} resume={resume} abandon={()=>setProfile(p=>p.run?.status==="active"?{...p,run:{...p.run,status:"abandoned",seq:p.run.seq+1,pending:null,updatedAt:Date.now()}}:p)} rebirth={()=>setProfile(applyRebirth)}/>);
  if(screen==="events")return hub(<EventHall target={eventTarget} profile={profile} start={startEvent} navigate={navigate} abandon={()=>setProfile(p=>p.eventRun?.run.status==="active"?eventCheckpoint(p,{...p.eventRun.run,status:"abandoned",pending:null,seq:p.eventRun.run.seq+1,updatedAt:Date.now()}):p)}/>);
  if(screen==="raid")return hub(<RaidHall profile={profile} navigate={navigate}/>);
  if(screen==="pvp")return hub(<PvpLobby profile={profile}/>);
  if(screen==="social")return hub(<SocialHub profile={profile}/>);
  if(screen==="settings")return hub(<AudioSettings back={()=>navigate("menu")}/>);
  if(screen==="menu")return hub(<HubMenu navigate={navigate} quit={()=>window.parent!==window&&window.parent.postMessage({type:"chibi:game-exit"},"*")}/>);
  if(screen==="bestiary")return hub(<BestiaryMenu/>);
  if(screen==="quests")return hub(<QuestMenu embedded profile={profile} save={setProfile}/>);
  if(screen==="journal")return hub(<WishHistory embedded key={window.ChibiGameSync?.accountId||"local"} profile={profile}/>);
  if(screen==="collection")return hub(<Collection profile={profile} awaken={awaken} openPortal={id=>{navigate("summon");setPortal(id);}} openEvent={name=>{navigate("events");setEventTarget(name);}}/>);
  if (screen==="summon") return hub(<main className="game-shell party-lobby summon-workspace"><section>
    <h1>Invocations</h1>
    <p>{profile.coins} pièces · {profile.owned.length} / {visibleCollectionRoster().length} personnages disponibles · Garantie dans {100-profile.wishStep} {profile.wishStep===99?"vœu":"vœux"}</p>
    {historyFull(profile)&&<p role="status">Synchronise l’historique avant de continuer à invoquer. Tes résultats sont conservés.</p>}
    <div className="lobby-tools"><button onClick={()=>navigate("journal")}>Historique des vœux</button><button onClick={()=>navigate("collection")}>Collection</button><button onClick={()=>navigate("quests")}>Quêtes</button></div>
    <p className="daily-wishes">Vœux gratuits · <b>{profile.freeWishes}</b><small>{parisDay()>=freeWishNoStackDay?"3 par jour · Renouvelés à minuit (Paris)":"10 de départ + 3 par jour · Cumul jusqu’au 24/11 inclus"}</small></p>
    <PortalSelector portal={portal} disabled={phase!=="ready"} select={setPortal}/>
    <div className="portal-list">{Object.entries(portals).filter(([id])=>id===portal&&portalAvailable(id)).map(([id,title])=><article key={id} className="portal-card" aria-label={title}>
      <div className={"portal-scene scene-"+id}>
        {id==="shibuya" && !matchMedia("(prefers-reduced-motion: reduce)").matches &&
          <PortalVideo src="./assets/bingo/first-week-clean.mp4" poster="./assets/bingo/first-week-clean.webp"/>}
        {id==="reality" && <>
          {!matchMedia("(prefers-reduced-motion: reduce)").matches && <PortalVideo src="./assets/bingo/from-another-reality.mp4" poster="./assets/bingo/from-another-reality.webp"/>}
        </>}
        {(id==="apocalyptic"||id==="destiny") && (matchMedia("(prefers-reduced-motion: reduce)").matches
          ? <img className="portal-art" src={`./assets/bingo/${id}.webp`} alt=""/>
          : <PortalVideo src={`./assets/bingo/${id}.mp4`} poster={`./assets/bingo/${id}.webp`}/>)}
        {(id==="partners"||id==="eosDawn"||id==="eosDusk") && <div className="portal-duo">{portalRoster(id).map(f=><SpritePreview key={f.name} fighter={f} maximumScale={1}/>)}</div>}
        {(id==="sonicx"||id==="xiii") && <div className={`portal-cast portal-cast-${id}`}>{portalRoster(id).map(f=><SpritePreview key={f.name} fighter={f} maximumScale={1}/>)}</div>}
        <h3>{id==="shibuya"?"First Week #1":title}</h3>
        <button className="portal-rates" onClick={()=>{setPortal(id);setRateFighter(null);setPhase("rates");}} aria-label={`Taux de ${id==="shibuya"?"First Week #1":title}`}>Taux</button>
        <div className="bingo-machine">
          <img className="bingo-body" src="./assets/bingo/machine.webp" alt="Bingo Kai"/>
          <span className="bingo-crank" aria-hidden="true"/>
        </div>
        <div className="wish-commands">{[1,10].map(n=><div key={n} className="wish-option">
          <button aria-describedby={`wish-price-${id}-${n}`} disabled={historyFull(profile) || phase!=="ready" || profile.coins<wishCost(profile,n)} onClick={()=>openWish(id,n)}><strong>{n} {n===1?"vœu":"vœux"}</strong></button>
          <span className="wish-price" id={`wish-price-${id}-${n}`} aria-label={`${wishCost(profile,n)} pièces requises`}><Icon name="coin"/><span>× {wishCost(profile,n).toLocaleString(document.documentElement.lang === "en" ? "en-GB" : "fr-FR")}</span></span>
          {wishQuote(profile,n).free>0&&<small className="wish-free">{wishQuote(profile,n).free} {wishQuote(profile,n).free>1?"gratuits":"gratuit"} inclus</small>}
        </div>)}</div>
        <p className="portal-caption">{id==="shibuya" ? "Retrouve Neku, Shiki et les badges psych de Shibuya." : id==="reality" ? "Cloud, Aerith et les badges psych · Des alliés venus d’une autre réalité." : id==="apocalyptic" ? "2B, A2 et les badges psych · Un futur à reconstruire." : id==="destiny" ? "Sora, Riku et les badges psych · Les liens qui traversent les mondes." : id==="eosDawn" ? "Noctis et Prompto · Les armes royales de Lucis." : id==="eosDusk" ? "Ignis et Gladio · Les gardiens de la couronne." : id==="sonicx" ? "X, Zero, Sonic, Shadow, Knuckles et Tails · La seconde vague entre en action." : id==="xiii" ? "Marluxia, Lexaeus, Axel et Larxene · L’Organisation XIII se rassemble." : "Beat et Joshua · Les partenaires de la Reapers’ Game."}</p>
      </div>

    </article>)}</div>
    {phase==="rates" && <WishDialog key="rates" className={rateFighter?"character-sheet-dialog":"portal-rates-dialog"} title={rateFighter?`Fiche · ${rateFighter}`:`Taux · ${portalName}`} close={closeDialog}>
      {rateFighter?<><CharacterDossier fighter={characterRoster.find(f=>f.name===rateFighter)!} profile={profile} base rate={pool.filter(x=>x.name===rateFighter).length/pool.length*(guaranteed?1:characterChance)}/><button onClick={()=>setRateFighter(null)}>Retour aux taux</button></>:<>
      <p>{profile.wishesMade===0?"Première invocation du compte · personnage garanti.":<>Vœu ordinaire · {percent(characterChance)} personnage, {percent(1-characterChance)} badge.</>} Chaque 100e vœu garantit aussi un personnage.</p>
      <h3>Prochain vœu{guaranteed?" · garanti":""}</h3><p>Touche un personnage pour voir sa fiche.</p>
      <div className="rates-character-list">{portalRoster(portal).map(f=><button key={f.name} onClick={()=>setRateFighter(f.name)} aria-label={`Fiche de ${f.name}`}><HudPortrait fighter={f}/><span><b>{f.name}</b><small>Stats & psych de départ</small></span><strong>{percent(pool.filter(x=>x.name===f.name).length/pool.length*(guaranteed?1:characterChance))}</strong><span aria-hidden="true">›</span></button>)}</div>
      <p>Badges psych · <b>{percent(guaranteed?0:1-characterChance)}</b></p>
      <div className="pin-rarity-rates">{pinGradeRates(profile.rebirths).map(item=><span key={item.grade}><b>{item.grade==="---"?"Sans classe":item.grade}</b> {percent(item.rate*(guaranteed?0:1-characterChance))}</span>)}</div>
      <p><b>Sans classe</b> · effets ×1, comme la classe C, mais avec la fréquence d’obtention la plus élevée.</p>
      <p>Les badges d’une même rareté sont équiprobables. Plus leur rang est élevé, plus ils sont rares. Les taux par personnage restent fixes après un drop ou un éveil.</p></>}
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
          {phase==="drop" && <span className="bingo-ball capsule" onAnimationEnd={e=>{if(e.animationName==="bingo-drop"){turning.current=false;gameSound.effect("pin");setPhase("reveal");}}}><Capsule/></span>}
        </div></div><p aria-live="polite">{phase==="crank"?"Appuie sur la manivelle.":phase==="spin"?"La manivelle tourne…":"La capsule tombe…"}</p></>}
    </WishDialog>}
    {saveError && <p role="alert">Sauvegarde locale indisponible.</p>}
  </section></main>);
  return hub(<main className="game-shell party-lobby"><section><h1>Team</h1>
    <nav className="team-sections" aria-label="Sections Team">{([["team","Team builder"],["characters","Personnages"],["awakening","Éveil"]] as const).map(([id,label])=><button key={id} aria-pressed={teamSection===id} onClick={()=>setTeamSection(id)}>{label}</button>)}</nav>
    {teamSection==="characters"&&<TeamCharacters profile={profile}/>}
    {teamSection==="awakening"&&<AwakeningPanel profile={profile} awaken={awaken}/>}
    {teamSection==="team"&&<>
    <div className="team-slots">{profile.equipped.map((name,index)=>{
      const fighter=characterRoster.find(f=>f.name===name);
      const stats=fighter && trained(fighter,profile.xp[name]||0,profile.awakened.includes(name),profile.copies[name]||0);
      return <button key={index} aria-label={`Emplacement ${index+1} · ${name||"Choisir un personnage"}`} onClick={()=>setEditingSlot(index)}>
        {fighter && stats ? <><div className="team-slot-portrait"><HudPortrait fighter={fighter}/></div><strong>{name}</strong><TypeChips elements={characterElements[name]}/><RankBadge level={profile.levels[name]}/><small>PV {stats.maxHp}<br/>ATK {stats.atk} · ATK SPE {stats.mag} · SPE {stats.speed}</small><XpProgress xp={stats.xp}/></> : <span aria-hidden="true">+</span>}
      </button>;
    })}</div>
    {editingSlot!==null && <WishDialog title={`Choisir un personnage · ${editingSlot+1} / 2`} close={()=>setEditingSlot(null)}>
      {profile.owned.length===0 && <p>Débloque ton premier personnage dans <a href="../app.html#gacha" target="_top">l’onglet Gacha</a>.</p>}
      <div className="party-list">{characterRoster.filter(f=>profile.owned.includes(f.name)).map(f=><button key={f.name} disabled={profile.equipped[1-editingSlot]===f.name} onClick={()=>chooseFighter(f.name)}>
        <div className="team-slot-portrait"><HudPortrait fighter={f}/></div><strong>{f.name}</strong>{profile.equipped[1-editingSlot]===f.name && <small>Déjà équipé</small>}
      </button>)}</div>
      <div className="dialog-actions">{profile.equipped[editingSlot] && <button onClick={()=>chooseFighter("")}>Retirer</button>}<button onClick={()=>setEditingSlot(null)}>Fermer</button></div>
    </WishDialog>}
    {fighters.map(name=><PsychEquipment key={name} name={name} profile={profile} save={ids=>setProfile(p=>assignBasePsychs({...p,loadout:{...p.loadout,[name]:ids}}))}/>)}
    {fighters.length===2 && !fighters.some(name=>profile.loadout[name]?.some(offensive)) && <p>Équipe au moins un psych offensif.</p>}
    </>}
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
    if(spec?.atlasFrames){const [page,x,y]=spec.atlasFrames[0];ffbePage(page).then(image=>ready(image,x,y)).catch(()=>{});}else{image.onload=()=>ready(image);image.src=enemy?(eventHeroes[enemy.kind]?.sprite||`./assets/game/enemy-atlases/${enemy.kind}.png`):fighter!.sprite;}
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

function Battle({ event,initialRun,initialTeam,loadout,coins,rebirths,onCheckpoint,leave }:{event?:EventSave|null;initialRun:RunSave;initialTeam:Fighter[];loadout:Record<string,Psych[]>;coins:number;rebirths:number;onCheckpoint:(snapshot:RunSave,gains?:RunGains)=>void;leave:()=>void}) {
  const finalWave=event?3:maxFloor;
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
    const healParty=(amount:number,sourceName?:string)=>{const boosted=Math.round(amount*passiveHealingMultiplier(sourceName||""));fighters=fighters.map(f=>f.hp>0?{...f,hp:Math.min(f.maxHp,f.hp+boosted)}:f);};
    const passiveBonus=(pattern:RegExp,base:number)=>Math.max(0,...fighters.filter(f=>f.hp>0).flatMap(f=>(loadout[f.name]||[]).map(id=>psychs[id]).filter(pin=>pattern.test(pin.psych)).map(pin=>base*pinRankMultiplier(pin))));
    const persist=(pending:RunPending|null,gains:RunGains={},nextTurn=turn)=>saveCheckpoint({status:fighters.every(f=>f.hp<=0)?"lost":wave===finalWave&&monsters.every(e=>e.hp<=0)?"complete":"active",wave,turn:nextTurn,team:fighters,enemies:monsters,energy:en,groove:sync,reward:monsters.every(e=>e.hp<=0),earnedXp:earnedXp+xp,loot:[...loot,...drops.map(pin=>pin.name)],awarded:[...awarded.current],pending:fighters.every(f=>f.hp<=0)||monsters.every(e=>e.hp<=0)?null:pending},gains);
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
        const evasion=Math.min(.65,(target.speed||0)/200+passiveDodgeChance(target.name)),reduction=Math.min(.8,(shields.get(target.name)||0)+passiveDamageReduction(target.name));
        const damage=Math.random()<evasion?0:typedDamage(Math.max(3,Math.round(enemyAttackPower(attacker)*(1-reduction))),attackType,characterElements[target.name]);
        setHitFeedback({side:"ally",target:target.name,label:scale===0?"Sans effet":`${damage} PV · ${affinityText(scale)}`});
        fighters=fighters.map(f=>f.name===target.name?{...f,hp:Math.max(0,f.hp-damage)}:f);
        if(attacker.trait==="vampire"&&damage>0)monsters=monsters.map(e=>e.id===attacker.id?{...e,hp:Math.min(e.maxHp,e.hp+Math.ceil(damage*.15))}:e);
        sync=Math.min(100,sync+12);
        if(damage)gameSound.effect("hit");
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
          const partnerAlive=fighters.some(f=>f.name!==fighter.name&&f.hp>0),damage=Math.round(Math.max(fighter.atk||1,fighter.mag||1)*5*passiveDamageMultiplier(fighter.name,"burst",fighter.hp,fighter.maxHp,partnerAlive));
          sync=0;monsters=monsters.map(e=>e.hp>0?({...e,hp:Math.max(0,e.hp-damage)}):e);setActiveAction("burst");gains.bursts=1;
          setMessage(`${fighter.name} · Sync Burst · ${damage} dégâts sur chaque ennemi !`);
        }else{
          const pin=psychs[plan.pin!];
          if(pin.kind==="heal"){
            const amount=scaledPinEffect(pin,(fighter.mag||1)*pin.power/50*(1+passiveBonus(/^Cure Boost/,.3)));
            healParty(amount,fighter.name);setActiveAction("heal");setMessage(`${fighter.name} · ${pin.name} · +${Math.round(amount*passiveHealingMultiplier(fighter.name))} PV au duo`);
          }else if(pin.kind==="guard"||pin.kind==="support"){
            fighters.filter(f=>f.hp>0).forEach(f=>shields.set(f.name,Math.max(shields.get(f.name)||0,pinShieldReduction(pin))));
            if(pin.kind==="support"){
              if(/Turbo|Supply/.test(pin.psych))en=Math.min(3,en+scaledPinEffect(pin,2));
              else if(/Cure Boost|Subconscious|Life/.test(pin.psych))healParty(scaledPinEffect(pin,(fighter.mag||1)/2),fighter.name);
              else sync=Math.min(100,sync+scaledPinEffect(pin,18));
            }
            setActiveAction("guard");setMessage(`${fighter.name} · ${pin.name} · Duo protégé pour ce tour`);
          }else{
            const physical=pin.kind==="physical",stab=stabMultiplier(fighter,pin);
            const partnerAlive=fighters.some(f=>f.name!==fighter.name&&f.hp>0),passive=passiveDamageMultiplier(fighter.name,physical?"physical":"special",fighter.hp,fighter.maxHp,partnerAlive);
            const amount=scaledPinEffect(pin,(physical?fighter.atk||1:fighter.mag||1)*(.7+pin.power/100)*stab*passive);
            const targets=pinTargetMode(pin)==="aoe"?monsters.filter(e=>e.hp>0):[monsters.find(e=>e.id===plan.target&&e.hp>0)||monsters.find(e=>e.hp>0)!];
            const damages=new Map(targets.map(target=>{const base=Math.max(1,Math.round(amount*(1+passiveBonus(/^Resonance/,.15)))+Math.floor(Math.random()*7)-3);return [target.id,enemyDamageTaken(target,typedDamage(base,pin.element!,enemyElements[target.kind]))];}));
            const total=[...damages.values()].reduce((sum,damage)=>sum+damage,0),primary=targets[0],primaryDamage=damages.get(primary.id)||0,scale=effectiveness(pin.element!,enemyElements[primary.kind]);
            setHitFeedback({side:"enemy",target:String(primary.id),label:scale===0?"Sans effet":`${primaryDamage} dégâts · ${affinityText(scale)}`});
            monsters=monsters.map(e=>damages.has(e.id)?{...e,hp:Math.max(0,e.hp-(damages.get(e.id)||0))}:e);
            if(pin.drain)healParty(Math.ceil(total/4),fighter.name);
            if(total)gameSound.effect("hit");
            sync=Math.min(100,sync+18);setSelected(primary.id);setImpact(primary.id);setActiveAction(physical?"shockwave":"pyro");
            setMessage((pinTargetMode(pin)==="aoe"?`${fighter.name} · ${pin.name} · ${total} dégâts répartis sur tous les ennemis`:`${fighter.name} · ${pin.name} → ${primary.name} · ${primaryDamage} dégâts`)+(stab>1?" · STAB ×1,2":""));
          }
        }
        const defeated=monsters.filter(e=>e.hp<=0&&!awarded.current.has(e.id));
        gains.defeated=defeated.length;
        defeated.forEach(e=>awarded.current.add(e.id));
        const earned=defeated.reduce((sum,e)=>sum+e.xp,0);
        if(earned){xp+=earned;gains.xp=earned;fighters=fighters.map(f=>gainExperience(f,earned));}
        const found=event?[]:defeated.filter(()=>Math.random()<Math.min(.75,.25+rebirths*.10)).map(()=>weightedPinPick(rebirths));
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
    if(drops.length){gameSound.effect("pin");setLoot(old=>[...old,...drops.map(pin=>pin.name)]);setDropReveal(drops.map(pin=>({pin})));}
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
    if(wave>=finalWave||busy||!reward)return;
    const next=wave+1,heal=difficultyAt(next).tier>difficultyAt(wave).tier;
    const nextTeam=team.map(f=>({...f,hp:heal?f.maxHp:f.hp})),nextEnemies=event?eventWave(event.boss,next,initialRun.id):makeWave(next,initialRun.id);
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
  useMusic(teamDefeated?null:reward?"victory":(event?wave===3:isBossWave(wave))?"boss":"battle");
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
          <button className="currency" disabled={busy} onClick={leave} title={event?"Retour aux événements":"Mettre la run en pause et revenir à Team"}>{event?"Pause":"Mon duo"}</button>
          <SoundToggle/>
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
              <h1>{event?"Événement":"ÉTAGE"} {String(wave).padStart(2, "0")} <small className="tier-label">{event?`${event.boss} · ${wave}/3`:`Palier ${difficultyAt(wave).tier} / 10`}</small></h1>
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
            const pin=psychs[id],aoe=offensive(id)&&pinTargetMode(pin)==="aoe";return <button key={id} disabled={pin.cost+otherCost>energy} onClick={()=>offensive(id)&&!aoe?setTargetPin(id):choose({kind:"psych",pin:id})}>
              <PinIcon pin={pin}/><b>{pin.name}</b><span>{elementNames[pin.element||badgeElement(pin)]} · {types[pin.kind]} · {offensive(id)?aoe?"AoE":"Monocible":"Duo"}{stabMultiplier(choosing,pin)>1?" · STAB ×1,2":""} · {pin.cost} EN</span>
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
            {event?<><h2>{wave===3?event.boss:"Vague terminée !"}</h2>{wave===3?<><p>{event.prize==="character"?`Personnage obtenu · ${event.boss}`:event.prize==="pin"?signaturePins[event.boss].name:"Aucun butin cette fois."}</p><button onClick={leave}>Retour aux événements</button></>:<button onClick={nextWave}>{wave===1?"Vague suivante":"Affronter le boss"}</button>}</>:<><h2>{wave===maxFloor?"Étage 100 · Ascension terminée !":"CHOOSE YOUR DROP"}</h2>
            <p>+5 pièces · +{earnedXp} XP par personnage.</p>
            {loot.length>0 && <p>Psychs récupérés · {loot.join(", ")}</p>}
            {wave<maxFloor?<><p>{difficultyAt(wave+1).tier>difficultyAt(wave).tier?"Nouveau palier : soin complet de la Team.":"Les PV sont conservés. Prochain soin au changement de palier."}</p><button className="fullscreen-button" onClick={nextWave}>Continuer · Étage {wave+1}</button></>:<button className="fullscreen-button" onClick={leave}>Retour à Team · Voir les quêtes</button>}</>}
          </div>
        </div>
      )}

      {teamDefeated && !busy && (
        <div className="overlay">
          <div className="modal game-over">
            <small>RUN TERMINATED</small>
            <h2>ERASED</h2>
            <p>You reached wave {wave}. The streets will remember your score.</p>
            <p>La reprise de cette run a été supprimée.</p><button onClick={leave}>{event?"Retour aux événements":"Retour à Team"}</button>
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






