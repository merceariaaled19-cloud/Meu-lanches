/* TelaOkê Publicidades — service worker */
var CACHE = 'telaoke-v10';
var ARQ = ['./', 'index.html', 'tv.html', 'admin.html', 'confirma-sair.js?v=1', 'manifest.webmanifest', 'tv.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(ARQ.map(function(u){ return c.add(u).catch(function(){}); })); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('telaoke-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  var nosso = u.origin === location.origin && u.pathname.indexOf('/Meu-lanches/telaoke/') === 0;
  var fb = u.hostname === 'www.gstatic.com' && u.pathname.indexOf('/firebasejs/') === 0;
  if (!nosso && !fb) return;
  if (nosso && /\.mp4$/.test(u.pathname)) return; /* vídeos tutoriais: direto da rede */
  /* rede primeiro (versão nova), cache se estiver sem internet */
  e.respondWith(fetch(r).then(function(res){
    if (res && (res.ok || res.type === 'opaque')){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, cp); }); }
    return res;
  }).catch(function(){
    return caches.match(r).then(function(m){ return m || caches.match(r, {ignoreSearch: true}); }).then(function(m){ return m || (r.mode === 'navigate' ? caches.match(u.pathname.indexOf('tv.html') >= 0 ? 'tv.html' : 'index.html') : Response.error()); });
  }));
});
