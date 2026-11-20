(() => {
  'use strict';
  const key = 'appLang';
  const choices = ['fr','en'];
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  let selected = read();
  const dictionary = new Map((window.ChibiEnglish || '').trim().split('\n').filter(Boolean).map(line => {
    const [source, english] = line.split('|');
    return [source.toLocaleLowerCase('fr'), english];
  }));
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const words = Array.from(dictionary.keys()).sort((a,b) => b.length-a.length).map(escape);
  const phrases = new RegExp('(?<![\\p{L}\\p{N}])(?:' + words.join('|') + ')(?![\\p{L}\\p{N}])','giu');
  const attributes = ['aria-label','title','alt','placeholder'];
  const originals = new WeakMap();
  const skip = 'script,style,textarea,input:not([placeholder]),[translate="no"],[contenteditable="true"],#hName,#pName,.mobile-rank-name,.post,.who,#tracks .it .t,#lists .it .t,#queue .it .t,#now,.lp-name,.trk strong,.monster-grid button>b,.rates-character-list b,.character-grid b';
  function english(text) {
    return text.replace(phrases, source => {
      const result = dictionary.get(source.toLocaleLowerCase('fr'));
      return source.length > 1 && source === source.toUpperCase() ? result.toUpperCase() : result;
    });
  }
  function localize(node, attr) {
    const value = attr ? node.getAttribute(attr) : node.data;
    if (!value || !value.trim()) return;
    const record = originals.get(node) || {};
    const previous = record[attr];
    const source = previous && previous.output === value ? previous.source : value;
    const output = selected === 'en' ? english(source) : source;
    if (value !== output) {
      if (attr) node.setAttribute(attr,output); else node.data = output;
    }
    if (source !== output) { record[attr] = {source,output}; originals.set(node,record); }
    else delete record[attr];
  }
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement?.closest(skip)) localize(node,'');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.closest(skip)) return;
    attributes.forEach(a => { if (node.hasAttribute(a)) localize(node,a); });
    for (const child of node.childNodes) visit(child);
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'language-picker';
  dialog.translate = false;
  dialog.setAttribute('aria-labelledby','language-title');
  dialog.innerHTML = '<h2 id="language-title"><span lang="fr">Choisis ta langue</span><small lang="en">Choose your language</small></h2><div><button lang="fr" value="fr">Français</button><button lang="en" value="en">English</button></div>';
  document.body.append(dialog);
  const open = () => { if (!dialog.open) dialog.showModal(); };
  dialog.addEventListener('cancel', e => { if (!choices.includes(selected)) e.preventDefault(); });
  function apply(lang) {
    if (!choices.includes(lang)) return;
    selected = lang;
    document.documentElement.lang = lang;
    if (!window.setLang) visit(document.body);
    document.querySelectorAll('[data-language-name]').forEach(el => el.textContent = lang === 'en' ? 'English' : 'Français');
    dialog.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b.value === lang)));
    if (dialog.open) dialog.close();
    for (const frame of document.querySelectorAll('iframe.game-frame')) {
      try { frame.contentWindow.ChibiLanguage?.apply(lang); } catch {}
    }
  }
  window.ChibiLanguage = {apply,open,get current(){return selected;}};
  dialog.addEventListener('click', e => {
    const lang = e.target.value;
    if (!choices.includes(lang)) return;
    try { localStorage.setItem(key,lang); } catch {}
    if (window.setLang && window.LANG !== lang && read() === lang) window.setLang(lang);
    else apply(lang);
  });
  document.addEventListener('click', e => { if(e.target.closest('[data-language-open]')) open(); });
  window.addEventListener('storage', e => { if(e.key !== key || !choices.includes(e.newValue)) return; if(window.setLang && window.LANG !== e.newValue) location.reload(); else apply(e.newValue); });
  new MutationObserver(changes => {
    if (window.setLang || selected !== 'en') return;
    for (const change of changes) {
      if (change.type === 'childList') change.addedNodes.forEach(visit);
      else if (change.type === 'characterData') visit(change.target);
      else if (!change.target.closest(skip)) localize(change.target,change.attributeName);
    }
  }).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attributes});
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-language-name]').forEach(el => el.textContent = selected === 'en' ? 'English' : 'Français');
  }, {once:true});
  let host;
  try { if(parent !== window) host = parent.ChibiLanguage; } catch {}
  if (choices.includes(host?.current || selected)) apply(host?.current || selected);
  else if (!host) open();
})();
