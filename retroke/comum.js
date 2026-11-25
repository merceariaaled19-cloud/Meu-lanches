/* Retrô Okê — código comum (biblioteca, capas, controle, sala pelo celular) */
var RK = window.RK = {};
RK.SITE = 'https://merceariaaled19-cloud.github.io/Meu-lanches/retroke/';
RK.B = window.L || null;                       // ponte Java (só nos APKs)
RK.modo = RK.B ? RK.B.modo() : 'web';          // 'tv' | 'cel' | 'web'
RK.SYS = {
  nes:  {nome:'Nintendinho', sub:'NES / Famicom', core:'fceumm', cor:'#e4002b', cor2:'#7a0014', ico:'🕹️',
         ext:['nes','fds','unf','unif','zip','7z'], repo:'Nintendo_-_Nintendo_Entertainment_System', ok:8, seg:0},
  snes: {nome:'Super Nintendo', sub:'SNES', core:'snes9x', cor:'#6c4cd6', cor2:'#2b1a73', ico:'🎮',
         ext:['smc','sfc','fig','swc','bs','zip','7z'], repo:'Nintendo_-_Super_Nintendo_Entertainment_System', ok:0, seg:8},
  n64:  {nome:'Nintendo 64', sub:'N64', core:'mupen64plus_next', cor:'#16a34a', cor2:'#064e22', ico:'🎯',
         ext:['n64','z64','v64','zip','7z'], repo:'Nintendo_-_Nintendo_64', ok:0, seg:1},
  psx:  {nome:'PlayStation', sub:'PS1', core:'pcsx_rearmed', cor:'#2563eb', cor2:'#0b2a6b', ico:'💿',
         ext:['chd','pbp','bin','iso','img','m3u','zip','7z'], repo:'Sony_-_PlayStation', ok:0, seg:8}
};
RK.ORDEM = ['nes','snes','n64','psx'];
/* nomes dos botões de cada console (índice do RetroPad -> nome no console) */
RK.NOMES = {
  nes:{0:'B',8:'A',2:'SELECT',3:'START'},
  snes:{0:'B',8:'A',1:'Y',9:'X',10:'L',11:'R',2:'SELECT',3:'START'},
  n64:{0:'A',1:'B',12:'Z',10:'L',11:'R',3:'START',23:'C▲',22:'C▼',21:'C◀',20:'C▶'},
  psx:{0:'✕',8:'○',1:'□',9:'△',10:'L1',11:'R1',12:'L2',13:'R2',2:'SELECT',3:'START'}
};

/* ---------- banco no aparelho (IndexedDB) ---------- */
RK.db = function(){
  if (RK._db) return RK._db;
  RK._db = new Promise(function(ok, erro){
    var r = indexedDB.open('retroke', 1);
    r.onupgradeneeded = function(){ var d = r.result;
      d.createObjectStore('jogos', {keyPath:'id'}); d.createObjectStore('roms'); d.createObjectStore('estados'); d.createObjectStore('cache'); };
    r.onsuccess = function(){ ok(r.result); }; r.onerror = function(){ erro(r.error); };
  });
  return RK._db;
};
RK.tx = function(loja, modo, fn){
  return RK.db().then(function(d){ return new Promise(function(ok, erro){
    var t = d.transaction(loja, modo), s = t.objectStore(loja), res; var q = fn(s);
    if (q) q.onsuccess = function(){ res = q.result; };
    t.oncomplete = function(){ ok(res); }; t.onerror = function(){ erro(t.error); }; t.onabort = function(){ erro(t.error); };
  }); });
};
RK.get = function(loja, k){ return RK.tx(loja, 'readonly', function(s){ return s.get(k); }); };
RK.put = function(loja, v, k){ return RK.tx(loja, 'readwrite', function(s){ return k === undefined ? s.put(v) : s.put(v, k); }); };
RK.del = function(loja, k){ return RK.tx(loja, 'readwrite', function(s){ return s.delete(k); }); };
RK.todos = function(loja){ return RK.tx(loja, 'readonly', function(s){ return s.getAll(); }); };
RK.jogos = function(sys){ return RK.todos('jogos').then(function(l){ return (l||[]).filter(function(j){ return !sys || j.sys === sys; }); }); };
RK.novoId = function(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

/* ---------- JOGOS EM NUVEM (2026-11-25) ----------
   O catálogo (catalogo.json no site) lista os jogos grátis com licença livre. Todos aparecem na lista
   como se estivessem instalados; o arquivo só baixa quando a pessoa toca para jogar e fica guardado
   no aparelho (store 'roms', mesma chave do id). Dá para jogo novo sem atualizar o APK. */
RK.URL = function(rel){ return /^https?:/.test(rel) ? rel : (RK.B ? RK.SITE + rel : rel); };
RK._cat = null;
RK.catalogo = function(){
  if (RK._cat) return RK._cat;
  function salvo(){ try { var c = JSON.parse(localStorage.rkCat || 'null'); if (c && c.jogos) return c; } catch (e) {} return null; }
  function rede(u, ms){ return new Promise(function(ok, erro){ var t = setTimeout(function(){ erro(new Error('demora')); }, ms);
    fetch(u, {cache:'no-store'}).then(function(r){ if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(function(c){ clearTimeout(t); ok(c); }, function(e){ clearTimeout(t); erro(e); }); }); }
  var guardado = salvo();
  var fresco = (navigator.onLine === false ? Promise.reject(new Error('sem internet')) : rede(RK.URL('catalogo.json') + '?t=' + Math.floor(Date.now() / 6e5), guardado ? 4000 : 9000))
    .then(function(c){ if (!c || !c.jogos) throw new Error('catálogo vazio'); localStorage.rkCat = JSON.stringify(c); return c; });
  RK._cat = fresco.catch(function(){
    if (guardado) return guardado;
    return fetch('catalogo.json').then(function(r){ return r.json(); }).catch(function(){ return {jogos:[], links:[]}; }); /* cópia de dentro do APK */
  }).then(function(c){ c.porId = {}; (c.jogos || []).forEach(function(x){ c.porId[x.id] = x; }); return c; });
  return RK._cat;
};
/* junta o que vem do catálogo com o que está guardado no aparelho (última vez jogado, baixado) */
RK.doCat = function(x, st){
  st = st || {};
  return {id:x.id, sys:x.sys, nome:x.nome, desc:x.desc, autor:x.autor, lic:x.lic, pag:x.pag, arq:x.arq.split('/').pop(), url:RK.URL(x.arq), tam:x.tam,
    capaUrl:x.capa ? RK.URL(x.capa) : '', capa:st.capaD || '', cat:1, origem:'nuvem', baixado:st.baixado || 0, ult:st.ult || 0, add:st.add || 0};
};
RK.jogos = function(sys){
  return Promise.all([RK.todos('jogos'), RK.catalogo()]).then(function(r){
    var L = r[0] || [], C = r[1], meus = {}, out = [];
    L.forEach(function(j){ meus[j.id] = j; });
    (C.jogos || []).forEach(function(x){ out.push(RK.doCat(x, meus[x.id])); delete meus[x.id]; });
    for (var k in meus) { var j = meus[k]; if (j.demo && (j.origem === 'url') && /^demos\//.test(j.url || '')) continue; /* demo antigo que saiu do catálogo */ out.push(j); }
    return out.filter(function(j){ return !sys || j.sys === sys; });
  });
};
RK.jogo = function(id){ return RK.jogos().then(function(L){ for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }); };
/* guarda só o que é do aparelho (o resto vem sempre do catálogo) */
RK.guarda = function(j){
  if (!j.cat) return RK.put('jogos', j);
  return RK.get('jogos', j.id).then(function(st){ st = st && st.cat ? st : {id:j.id, sys:j.sys, cat:1};
    st.ult = j.ult || st.ult || 0; st.baixado = j.baixado || 0; if (j.capa && /^data:/.test(j.capa)) st.capaD = j.capa; return RK.put('jogos', st); });
};
/* baixa o arquivo do jogo (com progresso 0..1) e guarda no aparelho */
RK.baixa = function(j, prog){
  if (navigator.onLine === false) return Promise.reject(new Error('sem internet'));
  return fetch(j.url, {cache:'no-store'}).then(function(r){
    if (!r.ok) throw new Error('o site respondeu ' + r.status);
    var total = +r.headers.get('content-length') || j.tam || 0;
    if (!r.body || !r.body.getReader) return r.blob();
    var rd = r.body.getReader(), partes = [], rec = 0;
    return (function le(){ return rd.read().then(function(x){
      if (x.done) return new Blob(partes);
      partes.push(x.value); rec += x.value.length; prog && prog(total ? Math.min(1, rec / total) : 0, rec, total); return le(); }); })();
  }).then(function(b){
    if (!b.size) throw new Error('arquivo vazio');
    j.baixado = Date.now(); j.tam = b.size; prog && prog(1, b.size, b.size);
    return RK.put('roms', b, j.id).then(function(){ return RK.guarda(j); }).then(function(){ return b; });
  });
};
/* arquivo do jogo: do aparelho; se for da nuvem e ainda não baixou, baixa agora */
RK.arquivo = function(j, prog){
  if (j.origem === 'url') return Promise.resolve(j.url);
  return RK.get('roms', j.id).then(function(b){
    if (b) return (b instanceof File && b.name === j.arq) ? b : new File([b], j.arq);
    if (j.origem !== 'nuvem') throw new Error('arquivo sumiu');
    return RK.baixa(j, prog).then(function(b2){ return new File([b2], j.arq); });
  });
};
/* liberar espaço: apaga só o arquivo baixado (o jogo continua na lista e o salvamento fica) */
RK.libera = function(j){ j.baixado = 0; return RK.del('roms', j.id).then(function(){ return RK.guarda(j); }); };
RK.baixados = function(){ return RK.jogos().then(function(L){ return L.filter(function(j){ return j.cat && j.baixado; }); }); };
/* capa do catálogo: guarda uma cópia pequena no aparelho para aparecer sem internet */
RK.guardaCapas = function(L){
  if (navigator.onLine === false || RK._capando) return;
  var fila = L.filter(function(j){ return j.cat && !j.capa && j.capaUrl; }); if (!fila.length) return;
  RK._capando = true;
  (function prox(){ var j = fila.shift(); if (!j) { RK._capando = false; return; }
    RK.imgParaDados(j.capaUrl, 256).then(function(d){ j.capa = d; return RK.guarda(j); }).catch(function(){}).then(prox); })();
};
RK.semeia = function(){ return Promise.resolve(); }; /* antigo: demos agora vêm do catálogo */

/* ---------- descobrir o console pelo arquivo ---------- */
RK.extDe = function(n){ var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; };
RK.sysDoArquivo = function(nome, padrao){
  var e = RK.extDe(nome);
  if (e === 'zip' || e === '7z') return padrao || null;
  for (var i = 0; i < RK.ORDEM.length; i++) { var s = RK.ORDEM[i]; if (RK.SYS[s].ext.indexOf(e) >= 0) return s; }
  return null;
};
RK.nomeBonito = function(arq){
  return (arq || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/\s*[\[(][^\])]*[\])]/g, '').replace(/\s+/g, ' ').trim() || arq;
};

/* ---------- capas automáticas (libretro-thumbnails) ---------- */
RK.norm = function(s){
  s = (s || '').toLowerCase().replace(/\.[a-z0-9]{1,4}$/, '');
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
  s = s.replace(/[\[(][^\])]*[\])]/g, ' ').replace(/&/g, ' and ').replace(/[_\-:;,.!'’?~]/g, ' ');
  s = s.replace(/\b(the|a|an)\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
};
RK._listas = {};
RK.lista = function(sys){
  if (RK._listas[sys]) return RK._listas[sys];
  RK._listas[sys] = fetch(RK.URL('capas/' + sys + '.txt')).then(function(r){ return r.text(); }).then(function(t){
    return t.split('\n').filter(Boolean).map(function(n){ return {n:n, k:RK.norm(n)}; });
  }).catch(function(){ RK._listas[sys] = null; return []; });
  return RK._listas[sys];
};
function bigr(s){ var b = {}, n = 0; s = ' ' + s + ' '; for (var i = 0; i < s.length - 1; i++) { var g = s.substr(i, 2); b[g] = (b[g]||0) + 1; n++; } return {b:b, n:n}; }
function dice(a, b){ var c = 0; for (var g in a.b) if (b.b[g]) c += Math.min(a.b[g], b.b[g]); return 2 * c / (a.n + b.n || 1); }
RK.pesoRegiao = function(n, arq){
  var p = 0, l = n.toLowerCase(), a = (arq||'').toLowerCase();
  ['brazil','usa','world','europe','japan'].forEach(function(r, i){ if (l.indexOf(r) >= 0) p += (5 - i) * 0.004; if (a.indexOf(r) >= 0 && l.indexOf(r) >= 0) p += 0.03; });
  if (/beta|proto|demo|sample|kiosk|virtual console|switch online|classic mini|rev /.test(l)) p -= 0.02;
  return p;
};
/* devolve as melhores capas candidatas [{n, nota}] */
RK.candidatas = function(sys, arq, qtd){
  var alvo = RK.norm(arq), A = bigr(alvo), toks = alvo.split(' ');
  return RK.lista(sys).then(function(L){
    var r = [];
    for (var i = 0; i < L.length; i++) {
      var it = L[i], nota;
      if (it.k === alvo) nota = 1.5;
      else {
        if (!it.k) continue;
        if (it.k.charAt(0) !== alvo.charAt(0) && Math.abs(it.k.length - alvo.length) > 12) { /* atalho */ }
        nota = dice(A, bigr(it.k));
        var t2 = it.k.split(' '), comum = 0; toks.forEach(function(t){ if (t2.indexOf(t) >= 0) comum++; });
        nota += 0.15 * comum / Math.max(toks.length, t2.length);
      }
      r.push({n:it.n, nota:nota + RK.pesoRegiao(it.n, arq)});
    }
    r.sort(function(a, b){ return b.nota - a.nota; });
    return r.slice(0, qtd || 1);
  });
};
RK.urlCapa = function(sys, nome){
  return 'https://raw.githubusercontent.com/libretro-thumbnails/' + RK.SYS[sys].repo + '/master/Named_Boxarts/' + encodeURIComponent(nome) + '.png';
};
RK.imgParaDados = function(url, larg){
  return fetch(url).then(function(r){ if (!r.ok) throw new Error('sem capa'); return r.blob(); }).then(function(b){
    return new Promise(function(ok, erro){
      var u = URL.createObjectURL(b), im = new Image();
      im.onload = function(){ var w = larg || 256, h = Math.round(im.height * w / im.width), c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.82)); };
      im.onerror = function(){ URL.revokeObjectURL(u); erro(new Error('imagem')); };
      im.src = u;
    });
  });
};
/* procura a capa de um jogo e guarda no aparelho */
RK.buscaCapa = function(j){
  if (j.cat || j.capa || j.semCapa) return Promise.resolve(j);
  return RK.candidatas(j.sys, j.arq || j.nome, 3).then(function(c){
    var lista = c.filter(function(x){ return x.nota >= 0.72; });
    if (!lista.length) { j.semCapa = 1; return RK.put('jogos', j).then(function(){ return j; }); }
    var tenta = function(i){
      if (i >= lista.length) { j.semCapa = 1; return RK.put('jogos', j).then(function(){ return j; }); }
      return RK.imgParaDados(RK.urlCapa(j.sys, lista[i].n)).then(function(d){
        j.capa = d; j.capaNome = lista[i].n; if (!j.nomeFixo) j.nome = lista[i].n.replace(/\s*\(.*$/, '');
        return RK.put('jogos', j).then(function(){ return j; });
      }, function(){ return navigator.onLine === false ? j : tenta(i + 1); });
    };
    return tenta(0);
  });
};

/* ---------- adicionar jogos ---------- */
RK.addArquivo = function(file, sys){
  sys = RK.sysDoArquivo(file.name, sys);
  if (!sys) return Promise.reject(new Error('Tipo de arquivo não reconhecido: ' + file.name));
  var j = {id:RK.novoId(), sys:sys, nome:RK.nomeBonito(file.name), arq:file.name, tam:file.size, origem:'idb', add:Date.now()};
  return RK.put('roms', file, j.id).then(function(){ return RK.put('jogos', j); }).then(function(){ return j; });
};
RK.addCaminho = function(p, nome, tam, sys){
  sys = RK.sysDoArquivo(nome, sys);
  if (!sys) return Promise.reject(new Error('tipo'));
  return RK.jogos().then(function(l){
    for (var i = 0; i < l.length; i++) if (l[i].caminho === p) return l[i];
    var j = {id:RK.novoId(), sys:sys, nome:RK.nomeBonito(nome), arq:nome, tam:tam, origem:'url', caminho:p, url:'/f/' + encodeURIComponent(nome) + '?p=' + encodeURIComponent(p), add:Date.now()};
    return RK.put('jogos', j).then(function(){ return j; });
  });
};
RK.remover = function(j){
  if (j.cat) return RK.libera(j);
  return RK.del('jogos', j.id).then(function(){ return RK.del('roms', j.id); }).then(function(){ return RK.del('estados', j.id); });
};
RK.tamanho = function(b){ if (!b) return ''; return b > 1048576 ? (b / 1048576).toFixed(b > 104857600 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; };
RK.quando = function(t){ if (!t) return ''; var d = new Date(t), h = new Date(), z = function(n){ return (n < 10 ? '0' : '') + n; };
  var hr = z(d.getHours()) + ':' + z(d.getMinutes());
  if (d.toDateString() === h.toDateString()) return 'hoje às ' + hr;
  var o = new Date(h - 864e5); if (d.toDateString() === o.toDateString()) return 'ontem às ' + hr;
  return z(d.getDate()) + '/' + z(d.getMonth() + 1) + ' às ' + hr; };

/* ---------- código da sala (celular como controle / mandar jogo / amigo) ---------- */
RK.codigo = function(){
  var c = localStorage.rkCod;
  if (!c) { var L = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; c = ''; for (var i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)]; localStorage.rkCod = c; }
  return c;
};
RK.linkPad = function(extra){ return RK.SITE + 'pad.html?c=' + RK.codigo() + (extra || ''); };
RK.qr = function(txt, tam){ return 'https://api.qrserver.com/v1/create-qr-code/?size=' + (tam || 300) + 'x' + (tam || 300) + '&margin=8&data=' + encodeURIComponent(txt); };
/* abre a sala no aparelho que mostra o jogo (TV). handlers: onConn(conn), onMsg(conn,msg) */
RK.sala = function(h){
  if (!window.Peer) return null;
  var S = {conns:[], peer:null, vivo:true, tent:0};
  function abre(){
    if (!S.vivo) return;
    var p = new Peer('retroke-' + RK.codigo(), {debug:0});
    S.peer = p;
    p.on('open', function(){ S.tent = 0; h.onOpen && h.onOpen(); });
    p.on('connection', function(c){
      c.on('open', function(){ S.conns.push(c); h.onConn && h.onConn(c); });
      c.on('data', function(m){ h.onMsg && h.onMsg(c, m); });
      c.on('close', function(){ S.conns = S.conns.filter(function(x){ return x !== c; }); h.onClose && h.onClose(c); });
      c.on('error', function(){});
    });
    p.on('error', function(e){
      if (e && e.type === 'unavailable-id') { try { p.destroy(); } catch (x) {} setTimeout(abre, 2500 + S.tent++ * 1500); return; }
      if (e && (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' || e.type === 'socket-closed')) { try { p.destroy(); } catch (x) {} setTimeout(abre, 5000); }
    });
    p.on('disconnected', function(){ if (S.vivo) { try { p.reconnect(); } catch (x) {} } });
  }
  abre();
  S.manda = function(m){ S.conns.forEach(function(c){ try { c.send(m); } catch (e) {} }); };
  S.fecha = function(){ S.vivo = false; try { S.peer && S.peer.destroy(); } catch (e) {} };
  window.addEventListener('pagehide', S.fecha);
  return S;
};
/* recebe arquivo mandado pelo celular (pedaços) */
RK.recebedor = function(aoTerminar, aoProgresso){
  var em = {};
  return function(conn, m){
    if (!m || typeof m !== 'object') return false;
    if (m.t === 'f0') { em[conn.peer] = {nome:m.nome, tam:m.tam, sys:m.sys, partes:[], rec:0}; aoProgresso && aoProgresso(m.nome, 0); return true; }
    if (m.t === 'fp') { var e = em[conn.peer]; if (!e) return true; var d = m.d instanceof ArrayBuffer ? m.d : (m.d && m.d.buffer ? m.d.buffer : m.d);
      e.partes.push(d); e.rec += d.byteLength || 0; aoProgresso && aoProgresso(e.nome, e.tam ? e.rec / e.tam : 0);
      if (m.n % 16 === 0) conn.send({t:'fa', rec:e.rec}); return true; }
    if (m.t === 'f1') { var f = em[conn.peer]; delete em[conn.peer]; if (!f) return true;
      var file; try { file = new File(f.partes, f.nome); } catch (x) { file = new Blob(f.partes); file.name = f.nome; }
      RK.addArquivo(file, f.sys).then(function(j){ conn.send({t:'fok', nome:j.nome}); aoTerminar && aoTerminar(j); },
        function(er){ conn.send({t:'ferro', msg:String(er && er.message || er)}); });
      return true; }
    return false;
  };
};

/* ---------- navegação com setas (controle remoto / controle) ---------- */
RK.nav = function(raizFn){
  function vis(){ var r = raizFn(); return [].slice.call(r.querySelectorAll('.f')).filter(function(b){ return b.offsetParent !== null && !b.disabled; }); }
  function move(dir){
    var bs = vis(), a = document.activeElement;
    if (!bs.length) return;
    if (bs.indexOf(a) < 0) { bs[0].focus(); return; }
    var r = a.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = null, bd = 1e9;
    bs.forEach(function(b){ if (b === a) return; var q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2, dx = x - cx, dy = y - cy;
      var ok = dir === 'l' ? dx < -5 : dir === 'r' ? dx > 5 : dir === 'u' ? dy < -5 : dy > 5; if (!ok) return;
      var prim = (dir === 'l' || dir === 'r') ? Math.abs(dx) : Math.abs(dy), sec = (dir === 'l' || dir === 'r') ? Math.abs(dy) : Math.abs(dx);
      var d = prim + sec * 2.2; if (d < bd) { bd = d; best = b; } });
    if (best) { best.focus(); best.scrollIntoView({block:'nearest', inline:'nearest', behavior:'smooth'}); RK.bip && RK.bip(520, .03); }
  }
  RK.move = move;
  document.addEventListener('keydown', function(ev){
    if (RK.semNav) return;
    var k = ev.keyCode, dir = {37:'l', 38:'u', 39:'r', 40:'d'}[k];
    if (ev.target && ev.target.tagName === 'INPUT' && ev.target.type !== 'checkbox' && (k === 37 || k === 39)) return;
    if (dir) { ev.preventDefault(); move(dir); }
  });
  /* controle (Gamepad API) no navegador da TV/PC */
  var ant = {}, rep = 0;
  function poll(){
    var gs = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < gs.length; i++) { var g = gs[i]; if (!g || RK.semNav) continue;
      var b = function(n){ return g.buttons[n] && g.buttons[n].pressed; };
      var est = {u:b(12) || g.axes[1] < -.6, d:b(13) || g.axes[1] > .6, l:b(14) || g.axes[0] < -.6, r:b(15) || g.axes[0] > .6, ok:b(0), vo:b(1)};
      var A = ant[i] || {}; var agora = Date.now();
      ['u','d','l','r'].forEach(function(k){ if (est[k] && (!A[k] || agora - rep > 220)) { if (!A[k] || agora - rep > 220) { move(k); rep = agora; } } });
      if (est.ok && !A.ok && document.activeElement) document.activeElement.click();
      if (est.vo && !A.vo && window.voltar) window.voltar();
      ant[i] = est; }
    requestAnimationFrame(poll);
  }
  if (!RK.B) requestAnimationFrame(poll);
};

/* sons curtinhos */
RK.bip = function(f, d, tipo){
  try { var C = RK._ac || (RK._ac = new (window.AudioContext || window.webkitAudioContext)()); var o = C.createOscillator(), g = C.createGain();
    o.type = tipo || 'square'; o.frequency.value = f; g.gain.value = .05; o.connect(g); g.connect(C.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, C.currentTime + (d || .08)); o.stop(C.currentTime + (d || .08) + .02); } catch (e) {}
};
RK.toast = function(t, ms){
  var e = document.getElementById('toast'); if (!e) { e = document.createElement('div'); e.id = 'toast'; document.body.appendChild(e); }
  e.textContent = t; e.className = 'on'; clearTimeout(RK._tt); RK._tt = setTimeout(function(){ e.className = ''; }, ms || 3200);
};
RK.esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
