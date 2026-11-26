/* CenaSua — service worker. Guarda o app; as cenas prontas ficam guardadas depois de usadas. Robô do rosto vem do CDN (cache do navegador). */
var CACHE = 'cenasua-v1';
var ARQ = ['./', 'index.html', 'app.js?v=1', 'rosto.js?v=1', 'cenas.js?v=1', 'filtro.js?v=1', 'audio.js?v=1', 'video.js?v=1', 'confirma-sair.js?v=1', 'voltar-pergunta.js?v=1', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'cenas/lm.json'];
self.addEventListener('install', function(e){ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(ARQ.map(function(u){ return c.add(u).catch(function(){}); })); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('cenasua-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/Meu-lanches/cenasua/') !== 0) return;
  if (/\.(apk|mp4)$/i.test(u.pathname)) return;
  e.respondWith(fetch(r).then(function(res){ if (res && res.ok){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, cp); }); } return res; })
    .catch(function(){ return caches.match(r).then(function(m){ return m || caches.match(r, {ignoreSearch: true}); }).then(function(m){ return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); }); }));
});
