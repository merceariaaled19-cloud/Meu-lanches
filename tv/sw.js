const C = 'tv-v10';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'confirma-sair.js?v=1', 'voltar-pergunta.js?v=2', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x.startsWith('tv-')).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/tv/')) return;
  const chave = u.pathname.endsWith('/tv/') ? './' : e.request;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(C).then(x => x.put(chave, c)); } return r; }).catch(() => caches.match(chave, {ignoreSearch: true})));
});
