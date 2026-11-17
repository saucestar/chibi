// TWEWY Co-op: round avatars like the launcher's: the chibi's HEAD cropped from the full-body image, filling the circle.
// Same detection as the launcher (Community.HeadBox): figure extent from the alpha, then in the band 4%..24% below its top
// the widest opaque run of each row is the head/hair -> its average centre gives x; square of 44% of the figure height.
// Any <img> inside an avatar circle on any page is swapped for its head crop (cached per image).
(function(){
  const SIZE = 192;
  const SEL = '.feed-avatar-inner img, .msg-avatar-inner img, .mini-avatar-inner img, .avatar-inner img, img.chibi-head';
  const cache = new Map();   // source -> Promise<data url>
  const made = new Set();    // crops already produced (never cropped again)

  function headBox(a, w, h){
    let y0 = -1, y1 = -1;
    for (let y = 0; y < h; y++){
      let n = 0;
      for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 40) n++;
      if (n > 2){ if (y0 < 0) y0 = y; y1 = y; }
    }
    if (y0 < 0) return { x: 0, y: 0, s: Math.min(w, h) };
    const fh = y1 - y0 + 1;
    let sum = 0, rows = 0;
    for (let y = y0 + Math.floor(fh * .04); y < Math.min(h, y0 + Math.floor(fh * .24)); y++){
      let best = 0, cur = 0, start = 0, bs = 0;
      for (let x = 0; x < w; x++){
        if (a[(y * w + x) * 4 + 3] > 40){ if (cur === 0) start = x; cur++; if (cur > best){ best = cur; bs = start; } }
        else cur = 0;
      }
      if (best > 3){ sum += bs + best / 2; rows++; }
    }
    const cx = rows ? sum / rows : w / 2, s = Math.floor(fh * .44);
    return { x: Math.floor(cx - s / 2), y: Math.floor(y0 - fh * .01), s };
  }

  function crop(src){
    if (!src) return Promise.resolve('');
    if (cache.has(src)) return cache.get(src);
    const p = new Promise(resolve => {
      const im = new Image();
      im.onload = () => {
        try {
          const w = im.naturalWidth, h = im.naturalHeight;
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
          const b = headBox(g.getImageData(0, 0, w, h).data, w, h);
          const o = document.createElement('canvas'); o.width = o.height = SIZE;
          const og = o.getContext('2d'); og.imageSmoothingQuality = 'high';
          og.drawImage(im, b.x, b.y, b.s, b.s, 0, 0, SIZE, SIZE);
          const url = o.toDataURL('image/png'); made.add(url); resolve(url);
        } catch (e) { resolve(src); }   // unreadable image: keep the full one
      };
      im.onerror = () => resolve(src);
      im.src = src;
    });
    cache.set(src, p);
    return p;
  }

  function fix(img){
    if (img.dataset.head) return;
    const src = img.getAttribute('src');
    if (!src || made.has(src)) return;
    img.dataset.head = '1';
    crop(src).then(url => { if (img.getAttribute('src') === src) img.src = url; img.classList.add('head-ready'); });
  }
  function scan(root){
    if (root.matches && root.matches(SEL)) fix(root);
    if (root.querySelectorAll) root.querySelectorAll(SEL).forEach(fix);
  }
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'attributes'){ if (m.target.matches(SEL) && !made.has(m.target.getAttribute('src'))){ delete m.target.dataset.head; m.target.classList.remove('head-ready'); fix(m.target); } }
    else m.addedNodes.forEach(n => n.nodeType === 1 && scan(n));
  })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  document.addEventListener('DOMContentLoaded', () => scan(document));
  window.ChibiHead = { crop };
})();
