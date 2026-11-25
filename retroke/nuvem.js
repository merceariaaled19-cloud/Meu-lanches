/* Retrô Okê — salvamentos na nuvem (2026-11-25)
   Login opcional (Firebase pdv-mercadinho-1c882: Google no site, e-mail e senha em todo lugar).
   Sem login: salva só no aparelho, como antes.
   Firestore: rk_saves/{uid}/estados/{chave} = {t, sys, nome, n, z, tam, img}
              rk_saves/{uid}/partes/{chave}_{i} = {d: bytes ≤ 700 KB}   (até 4 partes, compactado com gzip) */
(function(){
var RK = window.RK, N = RK.nuvem = {};
var FB = {apiKey:'AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM', authDomain:'pdv-mercadinho-1c882.firebaseapp.com', projectId:'pdv-mercadinho-1c882',
  storageBucket:'pdv-mercadinho-1c882.firebasestorage.app', messagingSenderId:'572967904689', appId:'1:572967904689:web:e162701eeab1bc0be48990'};
var V = 'https://www.gstatic.com/firebasejs/10.12.2/', PARTE = 700000, MAXP = 4;
var app = null, au = null, db = null, carregando = null, ultSobe = {};

function js(u){ return new Promise(function(ok, erro){ var s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = function(){ erro(new Error('sem internet')); }; document.head.appendChild(s); }); }
function tempo(p, ms, msg){ return new Promise(function(ok, erro){ var t = setTimeout(function(){ erro(new Error(msg || 'sem internet')); }, ms); p.then(function(x){ clearTimeout(t); ok(x); }, function(e){ clearTimeout(t); erro(e); }); }); }

/* carrega o Firebase só quando precisa (quem nunca entrou não baixa nada) */
N.carrega = function(){
  if (carregando) return carregando;
  carregando = (window.firebase && firebase.firestore ? Promise.resolve() :
    js(V + 'firebase-app-compat.js').then(function(){ return Promise.all([js(V + 'firebase-auth-compat.js'), js(V + 'firebase-firestore-compat.js')]); }))
  .then(function(){
    app = firebase.apps.filter(function(a){ return a.name === 'retroke'; })[0] || firebase.initializeApp(FB, 'retroke');
    au = app.auth(); au.languageCode = 'pt';
    db = app.firestore();
    try { db.settings({experimentalAutoDetectLongPolling:true, merge:true}); } catch (e) {}
    return new Promise(function(ok){ var f = au.onAuthStateChanged(function(u){ f(); ok(u); }); });
  }).then(function(u){ N.marca(u); au.onAuthStateChanged(N.marca); return au; },
    function(e){ carregando = null; throw e; });
  return carregando;
};
N.marca = function(u){
  if (u) { localStorage.rkNuvem = '1'; localStorage.rkNuvemEmail = u.email || ''; }
  else { delete localStorage.rkNuvem; delete localStorage.rkNuvemEmail; }
  N.aoMudar && N.aoMudar(u);
};
N.ligado = function(){ return localStorage.rkNuvem === '1'; };
N.email = function(){ return localStorage.rkNuvemEmail || ''; };
/* usuário atual (carrega o Firebase só se a pessoa já tinha entrado) */
N.usuario = function(){
  if (!N.ligado()) return Promise.resolve(null);
  if (navigator.onLine === false) return Promise.resolve(null);
  return tempo(N.carrega(), 15000).then(function(){ return au.currentUser; }, function(){ return null; });
};

/* ---------- entrar / sair ---------- */
N.erro = function(e){
  var c = (e && (e.code || e.message)) || String(e);
  if (/invalid-credential|wrong-password|INVALID_LOGIN|user-not-found/.test(c)) return 'E-mail ou senha errados. Se nunca criou senha, toque em "Esqueci a senha".';
  if (/email-already-in-use/.test(c)) return 'Esse e-mail já tem conta. Toque em Entrar (ou "Esqueci a senha").';
  if (/invalid-email/.test(c)) return 'Esse e-mail não parece certo. Confira.';
  if (/weak-password/.test(c)) return 'A senha precisa ter pelo menos 6 letras ou números.';
  if (/too-many-requests/.test(c)) return 'Muitas tentativas. Espere uns minutos e tente de novo.';
  if (/network|sem internet|unavailable/.test(c)) return 'Sem internet agora. Conecte e tente de novo.';
  if (/popup-closed|cancelled-popup/.test(c)) return 'A janela do Google foi fechada antes de terminar.';
  if (/operation-not-supported|disallowed|web-storage/.test(c)) return 'O Google não deixa entrar por dentro deste app. Use e-mail e senha.';
  return 'Não deu certo (' + c + ').';
};
N.entrarEmail = function(em, se){ return N.carrega().then(function(){ return au.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){}); }).then(function(){ return au.signInWithEmailAndPassword(em.trim(), se); }); };
N.criar = function(em, se){ return N.carrega().then(function(){ return au.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){}); }).then(function(){ return au.createUserWithEmailAndPassword(em.trim(), se); }); };
N.esqueci = function(em){ return N.carrega().then(function(){ return au.sendPasswordResetEmail(em.trim()); }); };
N.entrarGoogle = function(){
  return N.carrega().then(function(){
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
    return au.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){}).then(function(){ return au.signInWithPopup(p); })
      .catch(function(e){ if (/popup-blocked/.test(e && e.code)) return au.signInWithRedirect(p); throw e; });
  });
};
N.sair = function(){ return N.carrega().then(function(){ return au.signOut(); }); };

/* ---------- chave do jogo na nuvem (igual em todos os aparelhos) ---------- */
N.chave = function(j){
  if (j.cat) return j.id;
  var n = RK.norm(j.arq || j.nome).replace(/ /g, '-');
  return (j.sys + '_' + n).replace(/[^a-z0-9_-]/g, '').slice(0, 90) || (j.sys + '_jogo');
};
function zip(u8){
  if (!window.CompressionStream) return Promise.resolve({d:u8, z:false});
  try { var s = new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(s).arrayBuffer().then(function(b){ return {d:new Uint8Array(b), z:true}; }, function(){ return {d:u8, z:false}; }); }
  catch (e) { return Promise.resolve({d:u8, z:false}); }
}
function unzip(u8){
  var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(s).arrayBuffer().then(function(b){ return new Uint8Array(b); });
}
function u8de(x){ if (!x) return null; if (x instanceof Uint8Array) return x; if (x instanceof ArrayBuffer) return new Uint8Array(x); if (x.buffer) return new Uint8Array(x.buffer); return null; }

/* manda o salvamento do jogo para a nuvem. Resposta: 'ok' | 'fora' (sem login) | 'grande' | 'igual' */
N.sobe = function(j, est, forca){
  if (!N.ligado()) return Promise.resolve('fora');
  var dados = u8de(est && est.data); if (!dados) return Promise.resolve('igual');
  var ch = N.chave(j);
  if (!forca && ultSobe[ch] && Date.now() - ultSobe[ch] < 240000) return Promise.resolve('igual');
  return N.usuario().then(function(u){
    if (!u) return 'fora';
    return zip(dados).then(function(c){
      var n = Math.ceil(c.d.length / PARTE) || 1;
      if (n > MAXP) return 'grande';
      var b = db.batch(), base = db.collection('rk_saves').doc(u.uid);
      for (var i = 0; i < n; i++) b.set(base.collection('partes').doc(ch + '_' + i), {d:firebase.firestore.Blob.fromUint8Array(c.d.subarray(i * PARTE, (i + 1) * PARTE))});
      var img = est.img && est.img.length < 60000 ? est.img : '';
      b.set(base.collection('estados').doc(ch), {t:est.t || Date.now(), sys:j.sys, nome:String(j.nome || '').slice(0, 80), n:n, z:c.z, tam:c.d.length, img:img});
      return tempo(b.commit(), 25000).then(function(){ ultSobe[ch] = Date.now(); return 'ok'; });
    });
  });
};
/* traz da nuvem se lá estiver mais novo. Resposta: true se trouxe */
N.puxa = function(j, meta){
  if (!N.ligado()) return Promise.resolve(false);
  var ch = N.chave(j);
  return N.usuario().then(function(u){
    if (!u) return false;
    var base = db.collection('rk_saves').doc(u.uid);
    return (meta ? Promise.resolve(meta) : tempo(base.collection('estados').doc(ch).get(), 15000).then(function(d){ return d.exists ? d.data() : null; }))
    .then(function(m){
      if (!m || !m.n) return false;
      return RK.get('estados', j.id).then(function(loc){
        if (loc && loc.t >= m.t) return false;
        var ps = []; for (var i = 0; i < m.n; i++) ps.push(tempo(base.collection('partes').doc(ch + '_' + i).get(), 20000));
        return Promise.all(ps).then(function(ds){
          var tot = 0, pedacos = ds.map(function(d){ var x = d.data().d.toUint8Array(); tot += x.length; return x; });
          var tudo = new Uint8Array(tot), p = 0; pedacos.forEach(function(x){ tudo.set(x, p); p += x.length; });
          return (m.z ? unzip(tudo) : Promise.resolve(tudo));
        }).then(function(dados){
          return RK.put('estados', {data:dados, img:m.img || (loc && loc.img) || null, t:m.t, nuvem:1}, j.id);
        }).then(function(){ if (!j.ult || j.ult < m.t) { j.ult = m.t; return RK.guarda(j); } }).then(function(){ return true; });
      });
    });
  });
};
/* lista o que tem na nuvem: {chave: meta} */
N.lista = function(){
  return N.usuario().then(function(u){
    if (!u) return null;
    return tempo(db.collection('rk_saves').doc(u.uid).collection('estados').get(), 20000).then(function(q){ var r = {}; q.forEach(function(d){ r[d.id] = d.data(); }); return r; });
  });
};
/* sincroniza tudo: traz o que está mais novo na nuvem e manda o que está mais novo aqui */
N.sincroniza = function(prog){
  return N.lista().then(function(metas){
    if (!metas) return null;
    return RK.jogos().then(function(L){
      var r = {trouxe:0, mandou:0, grande:0}, p = Promise.resolve();
      L.forEach(function(j){ var ch = N.chave(j), m = metas[ch];
        p = p.then(function(){ return RK.get('estados', j.id); }).then(function(loc){
          if (m && (!loc || loc.t < m.t)) { prog && prog('Trazendo ' + j.nome + '…'); return N.puxa(j, m).then(function(t){ if (t) r.trouxe++; }); }
          if (loc && loc.data && (!m || m.t < loc.t)) { prog && prog('Mandando ' + j.nome + '…'); return N.sobe(j, loc, true).then(function(s){ if (s === 'ok') r.mandou++; if (s === 'grande') r.grande++; }); }
        }).catch(function(){}); });
      return p.then(function(){ return r; });
    });
  });
};
})();
