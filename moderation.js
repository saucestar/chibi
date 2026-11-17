// CHIBI - image check before publishing (runs in the browser, free).
//  1. NSFW.js (MobileNetV2, bundled ~2.7 MB): porn / hentai / very suggestive pictures
//  2. CLIP zero-shot (transformers.js, model ~90 MB downloaded on the first publish, then cached):
//     compares the picture with descriptions -> hate symbols (swastika, nazi/SS flags), gore
// If the check cannot run, the post is refused (fail closed).
window.ChibiModeration = (function(){
  const TFJS = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  const NSFW_BASE = 'https://cdn.jsdelivr.net/npm/nsfwjs@4.4.0/dist/';
  // the browser bundle needs the model files as script tags before it (MobileNetV2, ~3.5 MB)
  const NSFW_SCRIPTS = [NSFW_BASE + 'models/mobilenet_v2/model.min.js', NSFW_BASE + 'models/mobilenet_v2/group1-shard1of1.min.js', NSFW_BASE + 'browser/nsfwjs.min.js'];
  const TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
  const CLIP_MODEL = 'Xenova/clip-vit-base-patch32';

  // [description given to CLIP, forbidden?, reason shown to the user]
  const LABELS = [
    ['a nazi swastika symbol', true, 'symbole haineux (croix gammée)'],
    ['a nazi flag, SS runes or hate symbol', true, 'symbole haineux'],
    ['a gory picture with blood, wounds or a dead body', true, 'image choquante (gore)'],
    ['a photo of a person', false],
    ['a selfie', false],
    ['an anime or cartoon drawing', false],
    ['a video game screenshot', false],
    ['a screenshot with text', false],
    ['a meme', false],
    ['a photo of an animal', false],
    ['a photo of food', false],
    ['a landscape or a city', false],
    ['an object or a logo', false],
  ];

  let nsfwModel = null, clipPipe = null;

  function loadScript(src){
    return new Promise((resolve, reject) => {
      if(document.querySelector('script[src="' + src + '"]')){ resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = () => resolve(); s.onerror = () => reject(new Error('chargement impossible : ' + src));
      document.head.appendChild(s);
    });
  }

  function loadImage(dataUrl){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img); img.onerror = () => reject(new Error('image illisible'));
      img.src = dataUrl;
    });
  }

  async function nsfw(){
    if(!nsfwModel){
      await loadScript(TFJS);
      for(const src of NSFW_SCRIPTS) await loadScript(src);
      nsfwModel = await window.nsfwjs.load('MobileNetV2');
    }
    return nsfwModel;
  }

  async function clip(){
    if(!clipPipe){
      const T = await import(TRANSFORMERS);
      clipPipe = await T.pipeline('zero-shot-image-classification', CLIP_MODEL);
    }
    return clipPipe;
  }

  // returns { ok: true } or { ok: false, reason }
  async function check(dataUrl, onStatus){
    const say = onStatus || function(){};
    try{
      say('vérification de l’image (1/2)…');
      const img = await loadImage(dataUrl);
      const preds = await (await nsfw()).classify(img);
      const p = {};
      preds.forEach(x => { p[x.className] = x.probability; });
      const porn = p.Porn || 0, hentai = p.Hentai || 0, sexy = p.Sexy || 0;
      if(porn > 0.5 || hentai > 0.6 || porn + hentai > 0.7 || sexy > 0.85)
        return { ok: false, reason: 'contenu sexuel' };

      say(clipPipe ? 'vérification de l’image (2/2)…' : 'vérification de l’image (2/2) — premier passage : téléchargement du détecteur (~90 Mo)…');
      const res = await (await clip())(dataUrl, LABELS.map(l => l[0]));
      let bad = 0, worst = null;
      res.forEach(r => {
        const l = LABELS.find(x => x[0] === r.label);
        if(l && l[1]){ bad += r.score; if(!worst || r.score > worst.score) worst = { score: r.score, reason: l[2] }; }
      });
      if(worst && (worst.score > 0.45 || bad > 0.6)) return { ok: false, reason: worst.reason };
      return { ok: true, scores: { porn, hentai, sexy, bad } };
    }catch(e){
      return { ok: false, reason: 'vérification impossible (' + (e && e.message ? e.message : e) + '), réessaie' };
    }
  }

  return { check, LABELS };
})();
