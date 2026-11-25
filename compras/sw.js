const C = 'compras-v7';
const BASE = self.registration.scope;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'confirma-sair.js?v=1', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'dados/precos.json']))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x.startsWith('compras')).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/compras/')) return;
  const chave = u.pathname.endsWith('precos.json') ? 'dados/precos.json' : (u.pathname.endsWith('/compras/') ? './' : e.request);
  // rede primeiro (preço novo); sem internet usa o último guardado
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(C).then(x => x.put(chave, c)); } return r; })
    .catch(() => caches.match(chave, {ignoreSearch: true})));
});
// aviso que chega do robô (Web Push), mesmo com o app fechado
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = {body: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || '🛒 Compra Certa', {
    body: d.body || 'Tem promoção nos seus favoritos.', icon: 'icon-192.png', badge: 'icon-192.png',
    tag: d.tag || 'cc', renotify: true, data: {q: d.q || ''}
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const q = (e.notification.data && e.notification.data.q) || '';
  const url = BASE + (q ? '?q=' + encodeURIComponent(q) : '');
  e.waitUntil(clients.matchAll({type: 'window', includeUncontrolled: true}).then(cs => {
    for (const c of cs) if (c.url.startsWith(BASE) && 'focus' in c) { c.postMessage({busca: q}); return c.focus(); }
    return clients.openWindow(url);
  }));
});
