const C='loto-v3';self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','dados.json','icon-192.png','icon-512.png'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x.startsWith('loto')).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;if(u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(u.pathname.endsWith('dados.json')?'dados.json':e.request,c));return r}).catch(()=>caches.match(u.pathname.endsWith('dados.json')?'dados.json':e.request)))});
