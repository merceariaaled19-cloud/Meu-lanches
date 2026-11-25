/* Oferta Okê — service worker. O robô das fotos (modelo e motor) NUNCA é pré-baixado aqui: só vem quando o usuário toca em Perfeita. */
var CACHE = 'ofertaok-v11';
var ARQ = ['./', 'index.html', 'app.js?v=10', 'seg.js?v=1', 'festa.js?v=1', 'confirma-sair.js?v=1', 'voltar-pergunta.js?v=1', 'pedidos.js?v=2', 'cliente.html', 'cliente.js?v=2', 'voz.js?v=6', 'foto.js?v=3', 'video.js?v=4', 'okv.js?v=2', 'robo.js?v=3', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png',
  'vozes/bene.jpg?v=5', 'vozes/ze.jpg?v=5', 'vozes/leo.jpg?v=5', 'vozes/toninho.jpg?v=5', 'vozes/kelly.jpg?v=5', 'vozes/bene.mp3?v=5', 'vozes/ze.mp3?v=5', 'vozes/leo.mp3?v=5', 'vozes/toninho.mp3?v=5', 'vozes/kelly.mp3?v=5'];
/* amostras dos estilos de festa (festas/*.mp3) vêm da internet na hora de ouvir e ficam guardadas depois */
self.addEventListener('install', function(e){ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(ARQ.map(function(u){ return c.add(u).catch(function(){}); })); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('ofertaok-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/Meu-lanches/ofertaok/') !== 0) return;
  if (/\.(apk|mp4)$/i.test(u.pathname)) return; /* arquivos grandes: direto da internet, sem guardar */
  e.respondWith(fetch(r).then(function(res){ if (res && res.ok){ var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, cp); }); } return res; })
    .catch(function(){ return caches.match(r).then(function(m){ return m || caches.match(r, {ignoreSearch: true}); }).then(function(m){ return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); }); }));
});
