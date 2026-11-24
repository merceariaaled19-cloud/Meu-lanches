/* Oferta Okê — vídeos guardados no Firestore em pedaços (sem Firebase Storage).
   ok_videos/{ID} = {mime, tam, partes, dur, w, h, titulo, criadoEm}
   ok_videos/{ID}/p/{n} = {d: Bytes (até 900 KB), i}
   Qualquer um pode ler (TV do TelaOkê e link do vídeo); só as contas admin gravam. */
var OKV = (function(){
  var CH = 900 * 1024, BASE = 'https://merceariaaled19-cloud.github.io/Meu-lanches/ofertaok/v.html?id=', CACHE = 'okv-1';
  function novoId(){ var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; var r = new Uint32Array(6); (self.crypto || window.crypto).getRandomValues(r); for (var i = 0; i < 6; i++) s += a[r[i] % a.length]; return s; }
  function link(id){ return BASE + id; }
  function idDoLink(u){ var m = String(u || '').match(/ofertaok\/v\.html\?(?:[^#]*&)?id=([A-Za-z0-9]{4,12})/); return m ? m[1].toUpperCase() : ''; }
  function chave(id){ return location.origin + '/okv-cache/' + id; }
  function sobe(db, blob, meta, prog){
    var id = novoId(), ref = db.collection('ok_videos').doc(id);
    return blob.arrayBuffer().then(function(ab){
      var u8 = new Uint8Array(ab), n = Math.ceil(u8.length / CH), i = 0;
      function proxima(){
        if (i >= n) return Promise.resolve();
        var parte = u8.subarray(i * CH, Math.min(u8.length, (i + 1) * CH)), k = i;
        return ref.collection('p').doc(String(k)).set({d: firebase.firestore.Blob.fromUint8Array(parte), i: k}).then(function(){ i++; if (prog) prog(i / n); return proxima(); });
      }
      return proxima().then(function(){
        var m = {mime: blob.type || 'video/mp4', tam: u8.length, partes: n, criadoEm: firebase.firestore.FieldValue.serverTimestamp()};
        for (var k in meta) m[k] = meta[k];
        return ref.set(m);
      }).then(function(){ guardaCache(id, blob); return id; });
    });
  }
  function guardaCache(id, blob){ try { if (self.caches) caches.open(CACHE).then(function(c){ c.put(chave(id), new Response(blob, {headers: {'Content-Type': blob.type || 'video/mp4'}})); }).catch(function(){}); } catch (e) {} }
  function doCache(id){ if (!self.caches) return Promise.resolve(null); return caches.open(CACHE).then(function(c){ return c.match(chave(id)); }).then(function(r){ return r ? r.blob() : null; }).catch(function(){ return null; }); }
  function baixa(db, id, prog){
    return doCache(id).then(function(b){
      if (b && b.size) return {blob: b, meta: {mime: b.type}};
      var ref = db.collection('ok_videos').doc(id);
      return ref.get().then(function(d){
        if (!d.exists) throw new Error('nao-existe');
        var meta = d.data(), n = meta.partes || 0, partes = [], i = 0;
        function proxima(){
          if (i >= n) return Promise.resolve();
          return ref.collection('p').doc(String(i)).get().then(function(p){ if (!p.exists) throw new Error('parte-faltando'); partes.push(p.data().d.toUint8Array()); i++; if (prog) prog(i / n); return proxima(); });
        }
        return proxima().then(function(){ var bl = new Blob(partes, {type: meta.mime || 'video/mp4'}); guardaCache(id, bl); return {blob: bl, meta: meta}; });
      });
    });
  }
  function apaga(db, id){
    var ref = db.collection('ok_videos').doc(id);
    return ref.get().then(function(d){ var n = d.exists ? (d.data().partes || 0) : 0, ps = [];
      for (var i = 0; i < n; i++) ps.push(ref.collection('p').doc(String(i)).delete());
      return Promise.all(ps).then(function(){ return ref.delete(); });
    }).catch(function(){});
  }
  return {novoId: novoId, link: link, idDoLink: idDoLink, sobe: sobe, baixa: baixa, apaga: apaga, guardaCache: guardaCache};
})();
