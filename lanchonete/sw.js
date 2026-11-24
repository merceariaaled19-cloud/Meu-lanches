/* Meu Lanche Pro — service worker */
var CACHE = 'ml-pro-v18';
var ARQ = ['./', 'index.html', 'admin.html', 'estilo.css?v=2', 'comum.js?v=9', 'loja.js?v=4', 'dono.js?v=11', 'admin.js?v=6', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ARQ); }).catch(function(){}));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('ml-pro-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/Meu-lanches/lanchonete/') !== 0) return;
  /* rede primeiro (sempre a versão nova), cache se estiver sem internet */
  e.respondWith(fetch(r).then(function(res){
    if (res && res.ok){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, cp); }); }
    return res;
  }).catch(function(){
    return caches.match(r).then(function(m){ return m || caches.match(r, {ignoreSearch: true}); }).then(function(m){ return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); });
  }));
});
