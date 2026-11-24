/* Oferta Okê — service worker */
var CACHE = 'ofertaok-v1';
var ARQ = ['./', 'index.html', 'app.js?v=1', 'voz.js?v=1', 'foto.js?v=1', 'video.js?v=1', 'okv.js?v=1', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png',
  'vozes/bene.jpg', 'vozes/ze.jpg', 'vozes/leo.jpg', 'vozes/cida.jpg', 'vozes/kelly.jpg', 'vozes/bene.mp3', 'vozes/ze.mp3', 'vozes/leo.mp3', 'vozes/cida.mp3', 'vozes/kelly.mp3'];
self.addEventListener('install', function(e){ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(ARQ.map(function(u){ return c.add(u).catch(function(){}); })); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('ofertaok-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/Meu-lanches/ofertaok/') !== 0) return;
  e.respondWith(fetch(r).then(function(res){ if (res && res.ok){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, cp); }); } return res; })
    .catch(function(){ return caches.match(r).then(function(m){ return m || caches.match(r, {ignoreSearch: true}); }).then(function(m){ return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); }); }));
});
