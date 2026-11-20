// Phone app (app.html) language: French (default) or English. The choice is kept in localStorage ("appLang");
// with none, the phone's language decides. Static text, attributes (placeholder, title, aria-label, alt) and the
// tables built by progress.js are translated in place by exact match (D) or by pattern (R); strings app.html builds
// itself go through L(fr, en). Anything under translate="no" (track titles, posts, names) is left alone.
(function(){
  let lang = null;
  try{ lang = localStorage.getItem('appLang'); }catch(e){}
  if(lang !== 'fr' && lang !== 'en') lang = /^fr/i.test(navigator.language || 'fr') ? 'fr' : 'en';
  window.LANG = lang;
  window.L = (fr, en) => lang === 'en' ? en : fr;
  window.setLang = l => { try{ localStorage.setItem('appLang', l); }catch(e){} location.reload(); };
  document.documentElement.lang = lang;
  if(lang !== 'en') return;

  const D = {
    // header, tabs, menus
    'pièces': 'coins', 'Accueil': 'Home', 'Musique': 'Music', 'Classement': 'Ranking', 'Autre': 'More', 'Profil': 'Profile', 'Amis': 'Friends',
    'Ouvrir le jeu': 'Open the game', 'Badge Joueur': 'Player Pin', 'couleur': 'colour', 'langue': 'language',
    // home
    'COMPTE DISCORD': 'DISCORD ACCOUNT', "AUJOURD'HUI": 'TODAY', 'FEED': 'FEED', 'mon profil': 'my profile', 'le site': 'the website', 'déconnexion': 'log out',
    'chargement…': 'loading…', 'pas encore de chibi': 'no chibi yet',
    // music
    'YOUTUBE': 'YOUTUBE', 'LECTEUR': 'PLAYER', 'recherche, lien YouTube, Spotify ou Apple Music': 'search, YouTube, Spotify or Apple Music link',
    'choisis une musique ou colle un lien YouTube': 'pick a song or paste a YouTube link',
    "Sur téléphone : écoute solo. YouTube coupe le son si l'écran s'éteint.": 'On the phone: solo listening. YouTube stops the sound when the screen turns off.',
    // ranking
    'CLASSEMENTS': 'RANKINGS', 'Choisis ton classement.': 'Pick a ranking.', 'Roguelike · Étage le plus loin': 'Roguelike · Furthest floor',
    'Co-op · Missions et niveaux': 'Co-op · Missions and levels', 'CLASSEMENT MOBILE': 'MOBILE RANKING', 'CLASSEMENT PC': 'PC RANKING',
    'Retour aux classements': 'Back to rankings', 'Retour': 'Back', 'Actualiser le classement': 'Refresh the ranking', 'Actualiser': 'Refresh',
    'Le plus haut étage atteint · 100 étages maximum': 'Highest floor reached · 100 floors max',
    "Seuls les joueurs ayant lancé le roguelike ou effectué une invocation apparaissent. Les joueurs à égalité d’étage partagent le même rang.":
      'Only players who started the roguelike or made a summon appear. Players on the same floor share the same rank.',
    'MISSION DU JOUR': 'DAILY MISSION', 'NIVEAUX': 'LEVELS', 'voir les règles': 'see the rules',
    'Ton score de mission rapporte des pièces au jeu mobile : 10 points = 1 pièce, avec rattrapage des anciennes missions à l’ouverture du jeu ou du gacha.':
      'Your mission score earns coins in the mobile game: 10 points = 1 coin, past missions included when you open the game or the gacha.',
    // friends, profile
    'AMIS': 'FRIENDS', 'STATS MUSICALES': 'MUSIC STATS', 'mes stats musicales': 'my music stats', 'PROFIL': 'PROFILE',
    'Joue une partie en co-op en ligne (les deux launchers à jour) : tes partenaires apparaîtront ici.': 'Play an online co-op game (both launchers up to date): your partners will show up here.',
    // rules
    'RÈGLES // MISSION DU JOUR': 'RULES // DAILY MISSION', 'Le chrono': 'The timer',
    'Charge ta sauvegarde en jeu : un chrono de 24 minutes démarre (une seule fois par jour, en temps réel, même si tu fermes le jeu).':
      'Load your save in the game: a 24-minute timer starts (once a day, in real time, even if you close the game).',
    'Quêtes du jour · 300 pts chacune': 'Daily quests · 300 pts each',
    'Lancer le jeu, remporter 5 combats, récupérer 15 badges (doublons compris). Une quête terminée avant la fin du chrono rapporte 300 points.':
      'Start the game, win 5 battles, collect 15 pins (duplicates count). A quest finished before the timer ends earns 300 points.',
    'Ennemis · 50 pts': 'Enemies · 50 pts',
    'Chaque Noise éliminé pendant la mission rapporte 50 points, y compris dans les combats enchaînés.': 'Every Noise erased during the mission earns 50 points, chained battles included.',
    'Rang du combat': 'Battle rank', 'Chaque combat gagné ajoute des points selon son rang :': 'Every battle won adds points based on its rank:',
    'Rang E': 'Rank E', 'Rang D': 'Rank D', 'Rang C': 'Rank C', 'Rang B': 'Rank B', 'Rang A': 'Rank A', 'Rang étoile': 'Star rank', 'compris !': 'got it!',
    // login
    'se connecter avec Discord': 'log in with Discord',
    ': le launcher sur ton téléphone. Connecte-toi avec Discord (réservé aux membres du serveur).': ': the launcher on your phone. Log in with Discord (server members only).',
    // worker / login errors
    'connecte-toi': 'log in first', 'introuvable': 'not found', 'jeton Discord invalide ou expiré': 'Discord token invalid or expired', 'jeton manquant': 'missing token',
    'origine refusée': 'origin refused', 'reconnecte-toi : il manque l’autorisation « serveurs »': 'log in again: the “servers” permission is missing',
    'requête invalide': 'invalid request', 'réponse Discord invalide': 'invalid Discord answer', 'réservé aux membres du serveur Discord': 'Discord server members only',
    'trop de tentatives, réessaie dans une minute': 'too many attempts, try again in a minute', 'vérification Discord impossible': 'Discord check failed',
    'lien Spotify non reconnu': 'Spotify link not recognized', 'lien Apple Music non reconnu': 'Apple Music link not recognized',
    'playlist Spotify illisible (privée ?)': 'unreadable Spotify playlist (private?)', 'playlist Apple Music illisible (privée ?)': 'unreadable Apple Music playlist (private?)',
    'playlist Spotify introuvable ou privée': 'Spotify playlist not found or private', 'aucun titre lisible dans cette playlist Apple Music': 'no readable track in this Apple Music playlist',
    // progress.js tables
    'Succès': 'Achievements', 'Obtenu': 'Unlocked', 'Joueur': 'Player', 'Points': 'Points', 'Ennemis': 'Enemies', 'Quêtes': 'Quests', 'Mission': 'Mission',
    'Niveau': 'Level', 'Màj': 'Updated', 'Jour': 'Day', 'Place': 'Place', 'Ennemis · quêtes': 'Enemies · quests',
    'COLLECTION DE BADGES': 'PIN COLLECTION', 'MARQUES': 'BRANDS', 'HISTOIRE': 'STORY', 'Le chapitre secret': 'The secret chapter',
    'Ouvrir le chapitre secret.': 'Open the secret chapter.', 'Obtenir tous les badges.': 'Get every pin.',
    'Collection de chaque marque': 'Each brand collection', 'apparaît quand le jeu a exporté la collection': 'shows up once the game has exported the collection',
    'pas encore de succès publiés : le launcher TWEWY Co-op les publie après la connexion Discord': 'no achievements published yet: the TWEWY Co-op launcher publishes them after the Discord login',
    "Personne n'a encore fait la mission aujourd'hui : à toi de jouer !": 'Nobody has done the mission today yet: your turn!',
    "Personne n'a encore fait la mission aujourd'hui.": 'Nobody has done the mission today yet.',
    "Personne n'a fait la mission ce jour-là.": 'Nobody did the mission that day.',
    "Aucun profil publié pour l'instant : il apparaît après la connexion Discord dans le launcher.": 'No profile published yet: it shows up after the Discord login in the launcher.',
    'terminée': 'finished', "Aujourd'hui": 'Today', 'Hier': 'Yesterday', "à l'instant": 'just now',
    'lecture refusée par la base (règles Firebase)': 'read refused by the database (Firebase rules)', 'erreur inconnue': 'unknown error',
  };
  const DAY = { 'dim.': 'Sun', 'lun.': 'Mon', 'mar.': 'Tue', 'mer.': 'Wed', 'jeu.': 'Thu', 'ven.': 'Fri', 'sam.': 'Sat' };
  const R = [
    [/^Fin de la semaine de (\w+)$/, (m, w) => 'End of ' + w + "'s week"],
    [/^Semaine de (\w+)  \/\/  Jour (\d+)$/, (m, w, d) => w + "'s week  //  Day " + d],
    [/^Terminer le jour (\d+) de la semaine de (\w+)\.$/, (m, d, w) => 'Finish day ' + d + ' of ' + w + "'s week."],
    [/^Collection complète  \/\/  (\d+) badges$/, (m, n) => 'Full collection  //  ' + n + ' pins'],
    [/^Collection  \/\/  (\d+) badges$/, (m, n) => 'Collection  //  ' + n + ' pins'],
    [/^Obtenir (\d+) badges différents\.$/, (m, n) => 'Get ' + n + ' different pins.'],
    [/^Obtenir les (\d+) badges de la marque (.+)\.$/, (m, n, b) => 'Get the ' + n + ' pins of the ' + b + ' brand.'],
    [/^marque (\d+)$/, (m, n) => 'brand ' + n],
    [/^Collection marque (\d+)$/, (m, n) => 'Collection brand ' + n],
    [/^✦ (.+)$/, (m, x) => D[x] ? '✦ ' + D[x] : m],
    [/^reste (\d+:\d\d)$/, (m, t) => t + ' left'],
    [/^NIV\. (\d+)$/, (m, n) => 'LV. ' + n],
    [/^il y a (\d+) (min|h|j)$/, (m, n, u) => n + ' ' + (u === 'j' ? 'd' : u) + ' ago'],
    [/^(Aujourd'hui|Hier|dim\.|lun\.|mar\.|mer\.|jeu\.|ven\.|sam\.)(  ·  \d\d\/\d\d)$/, (m, d, rest) => (D[d] || DAY[d]) + rest],
    [/^(dim\.|lun\.|mar\.|mer\.|jeu\.|ven\.|sam\.) (\d+\/\d+)$/, (m, d, rest) => DAY[d] + ' ' + rest],
    [/^launcher (.*) · màj (.+)$/, (m, v, a) => 'launcher ' + v + ' · updated ' + tr(a)],
  ];
  function tr(s){
    const t = s.trim();
    if(!t) return s;
    let o = D[t];
    if(o == null) for(const [re, f] of R){ if(re.test(t)){ o = t.replace(re, f); break; } }
    return o == null ? s : s.replace(t, o);
  }
  window.T = tr;
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function skip(el){ return el && el.closest && el.closest('[translate="no"],script,style'); }
  function run(root){
    if(root.nodeType === 3){ if(!skip(root.parentElement)){ const v = tr(root.nodeValue); if(v !== root.nodeValue) root.nodeValue = v; } return; }
    if(root.nodeType !== 1 || skip(root)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for(let n = root; n; n = w.nextNode()){
      if(n.nodeType === 3){ if(!skip(n.parentElement)){ const v = tr(n.nodeValue); if(v !== n.nodeValue) n.nodeValue = v; } }
      else if(!skip(n)) ATTRS.forEach(a => { const v = n.getAttribute(a); if(v){ const t = tr(v); if(t !== v) n.setAttribute(a, t); } });
    }
  }
  function start(){
    run(document.body);
    new MutationObserver(ms => ms.forEach(m => {
      if(m.type === 'characterData') run(m.target);
      else if(m.type === 'attributes') run(m.target.nodeType === 1 ? m.target : m.target.parentNode);
      else m.addedNodes.forEach(run);
    })).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if(document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  document.title = document.title.replace('le launcher', 'the launcher');
})();
