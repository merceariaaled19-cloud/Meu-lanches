/* Oferta Okê — app (login, editor, lista, TelaOkê) */
var FB = {apiKey: 'AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM', authDomain: 'pdv-mercadinho-1c882.firebaseapp.com', projectId: 'pdv-mercadinho-1c882', storageBucket: 'pdv-mercadinho-1c882.firebasestorage.app', messagingSenderId: '572967904689', appId: '1:572967904689:web:e162701eeab1bc0be48990'};
var ADMINS = ['alexprotasgohan@gmail.com', 'alexprotasioficial@gmail.com', 'merceariaaled19@gmail.com'];
var TESTE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]teste=1/.test(location.search);
var $ = function(i){ return document.getElementById(i); };
var db = null, au = null, U = null, OF = null, TEMP = {}, VID = {}, CHAVE = null, LOJAS = [], AC = null, ALVO = 0, OUVINDO = null;
function toast(t, cor, ms){ var e = $('toast'); e.textContent = t; e.style.background = cor || '#16a34a'; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function(){ e.style.display = 'none'; }, ms || 2800); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
function mostra(id){ if (id != 'editor') paraTudo('saiu'); ['entrar', 'home', 'editor'].forEach(function(s){ $(s).classList.toggle('oculto', s != id); }); window.scrollTo(0, 0); }
function audioCtx(){ if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state == 'suspended') AC.resume(); return AC; }
function hoje(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function addD(s, n){ var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function nz(z){ z = String(z || '').replace(/\D/g, ''); if (z.length == 10 || z.length == 11) z = '55' + z; return z; }
function ms(t){ return t && t.toMillis ? t.toMillis() : (t && t.seconds ? t.seconds * 1000 : (+t || 0)); }
function copia(t){ function ok(){ toast('Copiado! ✅'); } if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function(){ prompt('Copie:', t); }); else prompt('Copie:', t); }

/* ================= dados ================= */
var DB = TESTE ? (function(){
  var MEM = {ofertas: {}, lojas: [{id: 'L1', nome: 'Mercadinho Bom Preço', venc: '', pausado: false}], anuncios: {}, videos: {}};
  window.MEM = MEM;
  return {
    chave: function(){ return Promise.resolve('TESTE'); },
    lista: function(){ return Promise.resolve(Object.keys(MEM.ofertas).map(function(k){ return MEM.ofertas[k]; })); },
    salva: function(o){ if (!o.id) o.id = 'T' + Date.now(); MEM.ofertas[o.id] = JSON.parse(JSON.stringify(o)); return Promise.resolve(o.id); },
    apaga: function(id){ delete MEM.ofertas[id]; return Promise.resolve(); },
    lojas: function(){ return Promise.resolve(MEM.lojas.slice()); },
    novaLoja: function(o){ o.id = 'L' + Date.now(); MEM.lojas.push(o); return Promise.resolve(o.id); },
    anuncio: function(id, o){ id = id || 'A' + Date.now(); MEM.anuncios[id] = o; return Promise.resolve(id); },
    sobeVideo: function(blob, meta, prog){ var id = OKV.novoId(); MEM.videos[id] = {blob: blob, meta: meta}; if (prog) prog(1); return Promise.resolve(id); },
    apagaVideo: function(id){ delete MEM.videos[id]; return Promise.resolve(); }
  };
})() : {
  chave: function(){ return db.collection('ml_config').doc('geral').get().then(function(d){ return d.exists ? (d.data().geminiKey || '') : ''; }); },
  lista: function(){ return db.collection('ok_ofertas').get().then(function(s){ return s.docs.map(function(d){ var x = d.data(); x.id = d.id; return x; }); }); },
  salva: function(o){ var c = JSON.parse(JSON.stringify(o)), id = c.id; delete c.id; c.atualizadoEm = firebase.firestore.FieldValue.serverTimestamp();
    if (id) return db.collection('ok_ofertas').doc(id).set(c).then(function(){ return id; });
    c.criadoEm = firebase.firestore.FieldValue.serverTimestamp(); c.dono = U ? U.uid : ''; return db.collection('ok_ofertas').add(c).then(function(r){ return r.id; }); },
  apaga: function(id){ return db.collection('ok_ofertas').doc(id).delete(); },
  lojas: function(){ return db.collection('to_lojas').get().then(function(s){ return s.docs.map(function(d){ var x = d.data(); x.id = d.id; return x; }); }); },
  novaLoja: function(o){ o.dono = U.uid; o.pags = []; o.criadoEm = firebase.firestore.FieldValue.serverTimestamp(); o.atualizadoEm = firebase.firestore.FieldValue.serverTimestamp(); return db.collection('to_lojas').add(o).then(function(r){ return r.id; }); },
  anuncio: function(id, o){ o.atualizadoEm = firebase.firestore.FieldValue.serverTimestamp();
    if (id) return db.collection('to_anuncios').doc(id).get().then(function(d){ if (d.exists) return db.collection('to_anuncios').doc(id).set(o, {merge: true}).then(function(){ return id; }); return DB.anuncio(null, o); });
    o.dono = U.uid; o.criadoEm = firebase.firestore.FieldValue.serverTimestamp(); return db.collection('to_anuncios').add(o).then(function(r){ return r.id; }); },
  sobeVideo: function(blob, meta, prog){ return OKV.sobe(db, blob, meta, prog); },
  apagaVideo: function(id){ return OKV.apaga(db, id); }
};
function pegaChave(){ if (CHAVE) return Promise.resolve(CHAVE); return DB.chave().then(function(k){ CHAVE = k; return k; }).catch(function(){ return ''; }); }

/* ================= login ================= */
function entrou(u){
  U = u; var adm = u && (TESTE || ADMINS.indexOf((u.email || '').toLowerCase()) >= 0);
  $('bSair').classList.toggle('oculto', !u);
  if (!u){ mostra('entrar'); return; }
  if (!adm){ $('msgLogin').textContent = 'A conta ' + u.email + ' não tem permissão. Entre com uma conta de administrador.'; mostra('entrar'); return; }
  abreHome();
}
if (TESTE){ setTimeout(function(){ entrou({uid: 'teste', email: 'teste@exemplo.com'}); }, 50); }
else {
  firebase.initializeApp(FB); db = firebase.firestore(); au = firebase.auth();
  au.getRedirectResult().catch(function(e){ $('msgLogin').textContent = 'Não entrou: ' + (e.code || e); });
  au.onAuthStateChanged(entrou);
}
$('bGoogle').onclick = function(){ var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt: 'select_account'});
  /* No celular o login por redirecionamento volta sem entrar (Chrome separa os dados do site do Google). Por isso abre a janela do Google primeiro em qualquer aparelho. */
  $('msgLogin').textContent = 'Abrindo o Google… escolha sua conta.';
  au.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){}).then(function(){ return au.signInWithPopup(p); })
    .then(function(){ $('msgLogin').textContent = ''; })
    .catch(function(e){ var c = (e && e.code) || '';
      if (/popup-closed|cancelled-popup/.test(c)){ $('msgLogin').textContent = 'A janela do Google fechou antes de terminar. Toque de novo em Entrar com Google.'; return; }
      if (/popup-blocked|not-supported|web-storage/.test(c)){ $('msgLogin').textContent = 'Abrindo o Google nesta tela…'; au.signInWithRedirect(p); return; }
      if (/network/.test(c)){ $('msgLogin').textContent = 'Sem internet. Confira a conexão e tente de novo.'; return; }
      $('msgLogin').textContent = 'Não entrou: ' + (c || e); }); };
function erroLogin(c){ return /wrong-password|invalid-credential|invalid-login/.test(c) ? 'E-mail ou senha errados. Se ainda não tem senha, toque em Criar senha.' : /user-not-found/.test(c) ? 'Esse e-mail ainda não tem senha. Toque em Criar senha.' : /too-many/.test(c) ? 'Muitas tentativas. Espere uns minutos.' : /network/.test(c) ? 'Sem internet. Confira a conexão.' : /invalid-email/.test(c) ? 'Confira o e-mail digitado.' : 'Não entrou: ' + c; }
$('bEmail').onclick = function(){ var em = $('lEm').value.trim().toLowerCase(), se = $('lSe').value; if (!em || !se){ $('msgLogin').textContent = 'Digite o e-mail e a senha.'; return; }
  $('msgLogin').textContent = 'Entrando…'; au.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(){}).then(function(){ return au.signInWithEmailAndPassword(em, se); })
    .then(function(){ $('msgLogin').textContent = ''; }).catch(function(e){ $('msgLogin').textContent = erroLogin((e && e.code) || String(e)); }); };
$('bSenha').onclick = function(){ var em = $('lEm').value.trim().toLowerCase(); if (!em){ $('msgLogin').textContent = 'Digite seu e-mail primeiro, depois toque aqui.'; return; }
  if (ADMINS.indexOf(em) < 0){ $('msgLogin').textContent = 'Use um dos e-mails de administrador.'; return; }
  au.languageCode = 'pt'; au.sendPasswordResetEmail(em).then(function(){ $('msgLogin').textContent = 'Pronto! Mandei um e-mail para ' + em + '. Abra, toque no link, crie a senha e volte aqui para entrar. (Olhe também no Spam.)'; })
    .catch(function(e){ var c = (e && e.code) || ''; if (/user-not-found/.test(c)) au.createUserWithEmailAndPassword(em, Math.random().toString(36).slice(2) + 'Aa9!').then(function(){ return au.signOut(); }).then(function(){ return au.sendPasswordResetEmail(em); }).then(function(){ $('msgLogin').textContent = 'Pronto! Mandei um e-mail para ' + em + '. Abra, crie a senha e volte aqui. (Olhe no Spam.)'; }).catch(function(x){ $('msgLogin').textContent = erroLogin(x.code || String(x)); });
      else $('msgLogin').textContent = erroLogin(c); }); };
$('bSair').onclick = function(){ if (TESTE) return; if (confirm('Sair da conta?')) au.signOut(); };

/* ================= lista ================= */
function abreHome(){
  mostra('home'); $('lista').innerHTML = '<p class="vazio">Carregando…</p>';
  DB.lista().then(function(L){
    L.sort(function(a, b){ return ms(b.atualizadoEm) - ms(a.atualizadoEm); });
    if (!L.length){ $('lista').innerHTML = '<p class="vazio">Nenhum comercial ainda. Toque em <b>➕ Fazer comercial novo</b>.</p>'; return; }
    window.LISTA = L;
    $('lista').innerHTML = L.map(function(o, i){ var p = (o.produtos || [])[0], d = ms(o.atualizadoEm);
      return '<div class="item" onclick="abreOferta(' + i + ')">' + (p && p.foto ? '<img src="' + p.foto + '">' : '<div class="ph">🛒</div>') +
        '<div><b>' + esc(o.loja || 'Sem nome') + '</b><small>' + (o.produtos || []).length + ' produto(s) • ' + esc(vozPorId(o.voz).nome) + (d ? ' • ' + new Date(d).toLocaleDateString('pt-BR') : '') + '</small>' +
        (o.videos && o.videos.h ? '<br><span class="tag">📺 código ' + esc(o.videos.h.id) + '</span>' : '') + (o.anuncioId ? '<span class="tag">no TelaOkê</span>' : '') + '</div></div>'; }).join('');
  }).catch(function(e){ $('lista').innerHTML = '<p class="erro">Não carregou: ' + esc(e.code || e.message || e) + '</p>'; });
}
window.abreOferta = function(i){ editar(JSON.parse(JSON.stringify(window.LISTA[i]))); };
$('bNovo').onclick = function(){ editar({loja: '', zap: '', end: '', logo: '', produtos: [{nome: '', preco: null, de: null, un: '', foto: '', tipoFoto: ''}], voz: 'ze', roteiro: null, roteiroEditado: false}); };
$('bVoltar').onclick = function(){ if (sujo && !confirm('Sair sem salvar as mudanças?')) return; abreHome(); };

/* ================= endereço (CEP -> rua, bairro, cidade) ================= */
var CAMPOS_END = ['eCep', 'eRua', 'eBairro', 'eCidade', 'eUf', 'eNum', 'eComp'];
function montaEnd(e){ /* texto final: "Rua X, 10 - Bairro" */
  var t = (e.rua || '').trim(); if (e.num) t += (t ? ', ' : '') + e.num.trim(); if (e.comp) t += (t ? ', ' : '') + e.comp.trim();
  if (e.bairro) t += (t ? ' - ' : '') + e.bairro.trim(); return t.slice(0, 90);
}
function pintaEndereco(){
  var e = OF.endr || null;
  if (!e){ e = {cep: '', rua: OF.end || '', num: '', comp: '', bairro: '', cidade: '', uf: ''}; } /* comercial antigo: o texto salvo fica no campo Rua e continua igual */
  $('eCep').value = e.cep || ''; $('eRua').value = e.rua || ''; $('eBairro').value = e.bairro || ''; $('eCidade').value = e.cidade || ''; $('eUf').value = e.uf || ''; $('eNum').value = e.num || ''; $('eComp').value = e.comp || '';
  $('cepSt').textContent = ''; mostraEndPrev();
}
function leEndereco(){
  var e = {cep: $('eCep').value.trim(), rua: $('eRua').value.trim(), num: $('eNum').value.trim(), comp: $('eComp').value.trim(), bairro: $('eBairro').value.trim(), cidade: $('eCidade').value.trim(), uf: $('eUf').value.trim().toUpperCase()};
  var vazio = !e.cep && !e.rua && !e.num && !e.comp && !e.bairro && !e.cidade && !e.uf;
  if (vazio){ delete OF.endr; OF.end = ''; } else { OF.endr = e; OF.end = montaEnd(e); }
  mostraEndPrev();
}
function mostraEndPrev(){ $('endPrev').textContent = OF.end ? '📍 Vai aparecer assim: ' + OF.end : ''; }
function jsonCurto(u, ms){ var ac = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if (ac) ac.abort(); }, ms || 8000);
  return fetch(u, ac ? {signal: ac.signal} : {}).then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; }).catch(function(){ clearTimeout(t); return null; }); }
async function buscaCep(cep){
  var d = await jsonCurto('https://viacep.com.br/ws/' + cep + '/json/');
  if (d && !d.erro && (d.logradouro || d.localidade)) return {rua: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', uf: d.uf || ''};
  d = await jsonCurto('https://brasilapi.com.br/api/cep/v1/' + cep);
  if (d && (d.street || d.city)) return {rua: d.street || '', bairro: d.neighborhood || '', cidade: d.city || '', uf: d.state || ''};
  return null;
}
var CEP_ULTIMO = '';
async function procuraCep(forcar){
  var cep = $('eCep').value.replace(/\D/g, '');
  if (cep.length != 8){ if (forcar) $('cepSt').textContent = 'O CEP tem 8 números (ex.: 69000-000).'; return; }
  if (cep == CEP_ULTIMO && !forcar) return; CEP_ULTIMO = cep;
  $('eCep').value = cep.slice(0, 5) + '-' + cep.slice(5); $('cepSt').textContent = '🔎 Procurando o CEP…';
  var r = await buscaCep(cep);
  if ($('eCep').value.replace(/\D/g, '') != cep) return;
  if (!r){ $('cepSt').textContent = 'Não achei esse CEP. Pode digitar a rua e o bairro aqui embaixo.'; $('eRua').focus(); leEndereco(); return; }
  if (r.rua) $('eRua').value = r.rua; if (r.bairro) $('eBairro').value = r.bairro; $('eCidade').value = r.cidade; $('eUf').value = r.uf;
  $('cepSt').textContent = r.rua ? '✅ Achei! Agora digite o número da casa.' : '✅ Achei a cidade. Este CEP não tem rua, digite a rua e o bairro.';
  leEndereco(); sujo = true; mudouDados(); (r.rua ? $('eNum') : $('eRua')).focus();
}
$('eCep').addEventListener('input', function(){ if (this.value.replace(/\D/g, '').length == 8) procuraCep(false); });
$('bCep').onclick = function(){ procuraCep(true); };

/* ================= parar tudo ao sair da tela ou esconder o app ================= */
var GRAVANDO = false;
function paraTudo(motivo){
  try { paraRobo(motivo || 'saiu'); } catch (e) {}
  if (OUVINDO){ try { OUVINDO.stop(); } catch (e) {} OUVINDO = null; if (OF && $('vozes').innerHTML) pintaVozes(); }
  clearTimeout(MD_T);
  if (window.cancelaGravacao) window.cancelaGravacao(motivo || 'saiu');
  if (window.cancelaEspera) window.cancelaEspera();
  if (AC && AC.state == 'running') try { AC.suspend(); } catch (e) {}
}
document.addEventListener('visibilitychange', function(){ if (document.hidden) paraTudo('oculto'); });
window.addEventListener('pagehide', function(){ paraTudo('oculto'); });

/* ================= editor ================= */
var sujo = false;
function editar(o){
  OF = o; TEMP = {}; VID = {}; sujo = false; mostra('editor');
  $('eLoja').value = o.loja || ''; $('eZap').value = o.zap || ''; pintaEndereco();
  pintaLogo(); pintaProdutos(); pintaVozes(); if (!OF.roteiro) refazRoteiro(); else pintaRoteiro();
  $('vids').innerHTML = ''; $('tCod').innerHTML = OF.videos && OF.videos.h ? caixaCodigo(OF.videos.h.id) : ''; $('tSt').textContent = '';
  $('bApagar').classList.toggle('oculto', !OF.id); carregaLojas();
}
['eLoja', 'eZap'].concat(CAMPOS_END).forEach(function(id){ $(id).addEventListener('input', function(){ OF.loja = $('eLoja').value.trim(); OF.zap = $('eZap').value.trim(); leEndereco(); sujo = true; mudouDados(); }); });
function pintaLogo(){ $('logoPrev').innerHTML = OF.logo ? '<img src="' + OF.logo + '">' : '🏪'; $('bLogoTira').classList.toggle('oculto', !OF.logo); }
$('bLogo').onclick = function(){ $('fLogo').click(); };
$('bLogoTira').onclick = function(){ OF.logo = ''; sujo = true; pintaLogo(); };
$('fLogo').onchange = async function(){ var f = this.files[0]; this.value = ''; if (!f) return; var c = await arquivoParaTela(f, 600); OF.logo = telaParaDado(c, 300, 45000, false); sujo = true; pintaLogo(); };

/* ---------- produtos ---------- */
function pintaProdutos(){
  $('prods').innerHTML = OF.produtos.map(function(p, i){
    return '<div class="prod" id="pr' + i + '"><div class="tp"><span>Produto ' + (i + 1) + '</span>' + (OF.produtos.length > 1 ? '<button class="bt cz peq" style="width:auto;margin:0" onclick="tiraProd(' + i + ')">🗑️</button>' : '') + '</div>' +
      '<div class="pfoto" id="pf' + i + '">' + (p.foto ? '<img src="' + p.foto + '">' : '📦') + '</div>' +
      '<div class="lin"><button class="bt peq" onclick="pedeFoto(' + i + ',1)">📷 Tirar foto</button><button class="bt cz peq" onclick="pedeFoto(' + i + ',0)">🖼️ Galeria</button></div>' +
      '<div class="st" id="ps' + i + '"></div><div class="esc oculto" id="pe' + i + '"></div>' +
      '<label class="l">Nome do produto *</label><input id="pn' + i + '" maxlength="60" value="' + esc(p.nome) + '" placeholder="Ex.: Arroz Tio João 5kg">' +
      '<button class="bt cz peq" onclick="procuraOficial(' + i + ')">🔎 Procurar foto oficial pelo nome</button>' +
      '<div class="lin"><div><label class="l">Preço (R$) *</label><input id="pp' + i + '" inputmode="decimal" value="' + (p.preco ? precoBR(p.preco) : '') + '" placeholder="7,99"></div>' +
      '<div><label class="l">Preço antigo <small class="d">(de)</small></label><input id="pd' + i + '" inputmode="decimal" value="' + (p.de ? precoBR(p.de) : '') + '" placeholder="opcional"></div></div>' +
      '<label class="l">Vende por</label><select id="pu' + i + '">' + [['', '— (não falar)'], ['kg', 'quilo (kg)'], ['un', 'unidade'], ['pacote', 'pacote'], ['litro', 'litro'], ['duzia', 'dúzia'], ['bandeja', 'bandeja'], ['caixa', 'caixa'], ['fardo', 'fardo']].map(function(u){ return '<option value="' + u[0] + '"' + (p.un == u[0] ? ' selected' : '') + '>' + u[1] + '</option>'; }).join('') + '</select></div>';
  }).join('');
  OF.produtos.forEach(function(p, i){
    ['pn', 'pp', 'pd', 'pu'].forEach(function(k){ $(k + i).addEventListener(k == 'pu' ? 'change' : 'input', function(){ leProd(i); sujo = true; mudouDados(); }); });
    if (TEMP[i]) pintaEscolha(i);
  });
  $('bAddProd').classList.toggle('oculto', OF.produtos.length >= 6);
}
function leProd(i){ var p = OF.produtos[i]; p.nome = $('pn' + i).value.trim(); p.preco = lePreco($('pp' + i).value) || null; p.de = lePreco($('pd' + i).value) || null; p.un = $('pu' + i).value; }
$('bAddProd').onclick = function(){ if (OF.produtos.length >= 6) return; OF.produtos.push({nome: '', preco: null, de: null, un: '', foto: '', tipoFoto: ''}); sujo = true; pintaProdutos(); mudouDados(); setTimeout(function(){ $('pr' + (OF.produtos.length - 1)).scrollIntoView({behavior: 'smooth'}); }, 50); };
window.tiraProd = function(i){ if (!confirm('Tirar o produto ' + (i + 1) + '?')) return; OF.produtos.splice(i, 1); var nt = {}; Object.keys(TEMP).forEach(function(k){ k = +k; if (k < i) nt[k] = TEMP[k]; else if (k > i) nt[k - 1] = TEMP[k]; }); TEMP = nt; sujo = true; pintaProdutos(); mudouDados(); };
window.pedeFoto = function(i, cam){ ALVO = i; (cam ? $('fCam') : $('fGal')).click(); };
$('fCam').onchange = $('fGal').onchange = function(){ var f = this.files[0]; this.value = ''; if (f) trataFoto(ALVO, f); };

/* foto: mostra opções (sua foto, perfeita, oficiais) */
function pintaEscolha(i){
  var T = TEMP[i], box = $('pe' + i); if (!T || !box) return; box.classList.remove('oculto');
  box.innerHTML = T.ops.map(function(o, k){
    if (o.botao) return '<div class="op perf" onclick="fazPerfeita(' + i + ')"><div class="sp">✨<br>' + esc(o.rotulo) + '</div>' + esc(o.titulo) + '</div>';
    if (o.carregando) return '<div class="op"><div class="sp">⏳ ' + esc(o.rotulo) + '</div>' + esc(o.titulo) + '</div>';
    return '<div class="op' + (T.esc == k ? ' on' : '') + '" onclick="escolhe(' + i + ',' + k + ')"><img src="' + o.prev + '">' + esc(o.titulo) + '</div>';
  }).join('');
  $('ps' + i).textContent = T.status || '';
}
window.escolhe = function(i, k){ var T = TEMP[i]; T.esc = k; T.tocou = true; aplicaEscolha(i); pintaEscolha(i); sujo = true; };
function aplicaEscolha(i){
  var T = TEMP[i], o = T.ops[T.esc], p = OF.produtos[i]; if (!o || o.carregando || o.botao) return;
  p.tipoFoto = o.tipo; p.foto = telaParaDado(o.c, 640, 110000, o.tipo == 'recorte');
  $('pf' + i).innerHTML = '<img src="' + o.prev + '">';
}
function addOp(i, o){ var T = TEMP[i]; if (o.c) o.prev = compoeLimpo(o.c, o.tipo, 300).toDataURL('image/jpeg', 0.85); T.ops.push(o); return T.ops.length - 1; }
function trocaOp(i, k, o){ if (o.c) o.prev = compoeLimpo(o.c, o.tipo, 300).toDataURL('image/jpeg', 0.85); TEMP[i].ops[k] = o; }
function melhorPadrao(i){
  /* foto oficial só vem marcada quando é com certeza o mesmo produto: achada pelo código de barras, ou nome quase igual ao que ele digitou / à marca lida no rótulo */
  var T = TEMP[i]; if (T.tocou) return; var best = 0, bp = -1;
  T.ops.forEach(function(o, k){ if (o.carregando || o.botao) return; var pts;
    if (o.tipo == 'oficial'){ var certo = o.pontos >= 2 || (o.pontos >= 0.85 && (T.fonteNome == 'digitado' || (T.marca && palavras(T.marca).every(function(w){ return palavras(o.nome).indexOf(w) >= 0; })))); pts = certo ? 3 - (o.pontos >= 2 ? 0 : 0.5) : 0.5; }
    else pts = o.tipo == 'recorte' ? 2 : 1;
    if (pts > bp){ bp = pts; best = k; } });
  T.esc = best; aplicaEscolha(i);
}
async function trataFoto(i, arq){
  var c; try { c = await arquivoParaTela(arq, 1024); } catch (e) { toast('Não abriu essa foto.', '#b91c1c'); return; }
  if (TEMP[i] && TEMP[i].rodando) paraRobo('trocou');
  var T = TEMP[i] = {ops: [], esc: 0, tocou: false, orig: c, status: 'Procurando a foto oficial… Para tirar o fundo, toque em ✨ Perfeita.'};
  addOp(i, {tipo: 'foto', c: c, titulo: '📷 Sua foto', base: true}); aplicaEscolha(i);
  T.ops.push({botao: true, perf: true, titulo: '✨ Perfeita', rotulo: 'Toque para tirar o fundo'}); pintaEscolha(i); sujo = true;
  await buscaParaProduto(i, c);
  if (TEMP[i] !== T) return;
  var escolhida = T.ops[T.esc]; T.ops = T.ops.filter(function(o){ return !o.carregando || o.perf; }); T.esc = Math.max(0, T.ops.indexOf(escolhida));
  melhorPadrao(i);
  var nOf = T.ops.filter(function(o){ return o.tipo == 'oficial'; }).length;
  if (!T.rodando) T.status = (nOf ? 'Achei ' + nOf + ' foto(s) oficial(is). ' : 'Não achei foto oficial deste produto. ') + 'Toque na foto que ficou melhor (a marcada ✓ é a que vai no vídeo).' + (T.avisoPerf ? ' ' + T.avisoPerf : (T.ops.some(function(o){ return o.tipo == 'recorte'; }) ? '' : ' ✨ Perfeita tira o fundo.'));
  pintaEscolha(i);
}
/* ✨ Perfeita: só quando o usuário toca. Robô num worker; se falhar, melhora a luz da própria foto */
window.fazPerfeita = async function(i){
  var T = TEMP[i]; if (!T || T.rodando || !T.orig) return;
  var ph = T.ops.filter(function(o){ return o.perf; })[0]; if (!ph) return;
  ph.botao = false; ph.carregando = true; ph.rotulo = 'Começando…'; T.rodando = true;
  T.status = '✨ Tirando o fundo… Pode continuar preenchendo o preço enquanto isso.'; pintaEscolha(i);
  try {
    var cut = await tiraFundo(T.orig, function(s){ ph.rotulo = s.replace('Baixando o robô', 'Baixando'); pintaEscolha(i); });
    if (TEMP[i] !== T) return;
    var k = T.ops.indexOf(ph), o = {tipo: 'recorte', c: cut, titulo: '✨ Perfeita', perf: true};
    trocaOp(i, k, o); T.esc = k; T.tocou = true; aplicaEscolha(i);
    T.avisoPerf = ''; T.status = '✅ Pronto! A foto ✨ Perfeita está marcada ✓. Se preferir outra, é só tocar nela.';
  } catch (e) {
    console.log('perfeita', e && e.message);
    if (TEMP[i] !== T){ return; }
    ph.carregando = false; ph.botao = true; ph.rotulo = 'Tocar para tentar de novo';
    if (/saiu|trocou|oculto/.test(e && e.message || '')){ T.status = 'O robô parou porque você saiu da tela. Toque em ✨ Perfeita para tentar de novo.'; }
    else {
      T.status = T.avisoPerf = (e && e.message == 'demorou' ? 'O robô demorou demais e eu parei para o celular não travar. ' : 'Não deu para tirar o fundo desta foto. ') + 'Deixei a sua foto mais clara e bonita. Dica: tire a foto com o produto no meio e um fundo liso.';
      try { var mc = await melhoraSimples(T.orig); if (TEMP[i] === T){ var kb = -1; T.ops.forEach(function(x, j){ if (x.base) kb = j; }); if (kb >= 0){ trocaOp(i, kb, {tipo: 'foto', c: mc, titulo: '📷 Sua foto', base: true}); if (T.esc == kb) aplicaEscolha(i); } } } catch (x) {}
    }
  }
  T.rodando = false; pintaEscolha(i);
};
/* identifica o produto (código de barras > nome digitado > IA lendo o rótulo) e busca fotos oficiais */
async function buscaParaProduto(i, c){
  var T = TEMP[i], ean = '', nome = $('pn' + i) ? $('pn' + i).value.trim() : ''; T.fonteNome = nome ? 'digitado' : ''; T.marca = '';
  if (c){ ean = await leCodigoBarras(c); if (ean){ T.fonteNome = 'ean'; T.status = 'Li o código de barras ' + ean + '. Procurando a foto oficial…'; pintaEscolha(i); } }
  if (!ean && !nome && c){ T.status = 'Lendo o rótulo do produto…'; pintaEscolha(i);
    var k = await pegaChave(), r = await leRotulo(c, k); if (r){ nome = r.nome; T.fonteNome = 'ia'; T.marca = (r.marca || '').trim(); if (r.ean && /^\d{8,14}$/.test(r.ean)) ean = r.ean; } }
  if (!ean && !nome) return;
  var kL = addOp(i, {carregando: true, rotulo: 'Procurando…', titulo: '🏷️ Oficial'}); pintaEscolha(i);
  var res = await buscaOficiais({ean: ean, nome: nome});
  T.ops.splice(kL, 1);
  if (res.nome && $('pn' + i) && !$('pn' + i).value.trim()){ $('pn' + i).value = limpaNome(res.nome); leProd(i); mudouDados(); }
  var feitos = 0;
  for (var j = 0; j < res.itens.length && feitos < 4; j++){
    try { var oc = await oficialParaTela(res.itens[j].img); addOp(i, {tipo: 'oficial', c: oc, titulo: '🏷️ ' + res.itens[j].fonte, pontos: res.itens[j].pontos, nome: res.itens[j].nome}); feitos++; pintaEscolha(i); } catch (e) {}
  }
}
function limpaNome(n){ n = String(n || '').replace(/\s+/g, ' ').trim(); return n.length > 60 ? n.slice(0, 60) : n; }
window.procuraOficial = async function(i){
  leProd(i); if (!OF.produtos[i].nome){ toast('Digite o nome do produto primeiro.', '#b91c1c'); return; }
  if (!TEMP[i]){ TEMP[i] = {ops: [], esc: 0, tocou: false}; if (OF.produtos[i].foto){ try { var im = await carregaImg(OF.produtos[i].foto); var c = novaTela(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0); addOp(i, {tipo: OF.produtos[i].tipoFoto || 'foto', c: c, titulo: '📷 Atual'}); } catch (e) {} } }
  var T = TEMP[i]; T.ops = T.ops.filter(function(o){ return o.tipo != 'oficial'; }); T.status = 'Procurando foto oficial…'; T.tocou = false; pintaEscolha(i);
  await buscaParaProduto(i, null);
  var nOf = T.ops.filter(function(o){ return o.tipo == 'oficial'; }).length;
  if (nOf){ melhorPadrao(i); T.status = 'Achei ' + nOf + ' foto(s). Toque na melhor.'; } else T.status = 'Não achei foto oficial com esse nome. Tente escrever a marca e o tamanho (ex.: Café Santa Clara 500g).';
  pintaEscolha(i);
};

/* ---------- locutores ---------- */
function pintaVozes(){
  $('vozes').innerHTML = VOZES.map(function(v){ return '<div class="voz' + (OF.voz == v.id ? ' on' : '') + '" onclick="escVoz(\'' + v.id + '\')"><img src="vozes/' + v.id + '.jpg?v=5" alt=""><div class="tx"><b>' + v.nome + '</b><small>' + v.estilo + ' — ' + v.desc + '</small></div><button class="ouvir" onclick="event.stopPropagation();ouvir(\'' + v.id + '\',this)">▶️ Ouvir</button></div>'; }).join('');
}
window.escVoz = function(id){ OF.voz = id; sujo = true; pintaVozes(); };
window.ouvir = async function(id, b){
  var ac = audioCtx(); if (OUVINDO){ try { OUVINDO.stop(); } catch (e) {} var era = OUVINDO.id; OUVINDO = null; pintaVozes(); if (era == id) return; }
  b.textContent = '⏳ …';
  try { var ab = await (await fetch('vozes/' + id + '.mp3?v=5')).arrayBuffer(), buf = await ac.decodeAudioData(ab), v = vozPorId(id), s = ac.createBufferSource(); s.buffer = buf; s.playbackRate.value = v.fx.rate || 1;
    s.connect(cadeiaFx(ac, v.fx, ac.destination)); s.start(); s.id = id; OUVINDO = s; b.textContent = '⏹️ Parar'; s.onended = function(){ if (OUVINDO == s){ OUVINDO = null; b.textContent = '▶️ Ouvir'; } }; OF.voz = id; pintaVozes(); var bb = document.querySelector('.voz.on .ouvir'); if (bb) bb.textContent = '⏹️ Parar'; }
  catch (e) { b.textContent = '▶️ Ouvir'; toast('Não tocou.', '#b91c1c'); }
};

/* ---------- roteiro ---------- */
function refazRoteiro(){ OF.roteiro = montaRoteiro(OF); OF.roteiroEditado = false; pintaRoteiro(); }
function pintaRoteiro(){
  var r = OF.roteiro, h = '<label class="l">Abertura</label><textarea id="r_a">' + esc(r.abre) + '</textarea>';
  OF.produtos.forEach(function(p, i){ h += '<label class="l">Produto ' + (i + 1) + (p.nome ? ' — ' + esc(p.nome) : '') + '</label><textarea id="r_' + i + '">' + esc(r.itens[i] || '') + '</textarea>'; });
  h += '<label class="l">Final</label><textarea id="r_f">' + esc(r.fecha) + '</textarea>'; $('rot').innerHTML = h;
  [].forEach.call($('rot').querySelectorAll('textarea'), function(t){ t.addEventListener('input', function(){ leRoteiro(); OF.roteiroEditado = true; sujo = true; }); });
}
function leRoteiro(){ var r = OF.roteiro; r.abre = $('r_a').value.trim(); r.fecha = $('r_f').value.trim(); r.itens = OF.produtos.map(function(p, i){ return $('r_' + i) ? $('r_' + i).value.trim() : ''; }); }
var MD_T = null;
function mudouDados(){ clearTimeout(MD_T); MD_T = setTimeout(function(){
  if (!OF.roteiroEditado || (OF.roteiro && OF.roteiro.itens.length != OF.produtos.length)){ OF.roteiro = montaRoteiro(OF, OF.semente || (OF.semente = Math.floor(Math.random() * 1000))); OF.roteiroEditado = false; pintaRoteiro(); } }, 500); }
$('bRot').onclick = function(){ OF.semente = Math.floor(Math.random() * 1000); OF.roteiro = montaRoteiro(OF, OF.semente); OF.roteiroEditado = false; pintaRoteiro(); sujo = true; toast('Texto novo pronto ✅'); };

/* ---------- validação ---------- */
function valida(){
  OF.loja = $('eLoja').value.trim(); OF.zap = $('eZap').value.trim(); leEndereco(); OF.produtos.forEach(function(p, i){ leProd(i); }); leRoteiro();
  if (OF.loja.length < 2) return 'Digite o nome da loja (passo 1).';
  for (var i = 0; i < OF.produtos.length; i++){ var p = OF.produtos[i]; if (!p.nome) return 'Digite o nome do produto ' + (i + 1) + '.'; if (!(p.preco > 0)) return 'Digite o preço do produto ' + (i + 1) + ' (ex.: 7,99).'; }
  return '';
}

/* ---------- cache da voz (IndexedDB) ---------- */
function idb(){ return new Promise(function(ok, ruim){ var r = indexedDB.open('ofertaok', 1); r.onupgradeneeded = function(){ r.result.createObjectStore('voz'); }; r.onsuccess = function(){ ok(r.result); }; r.onerror = function(){ ruim(r.error); }; }); }
function idbGet(k){ return idb().then(function(d){ return new Promise(function(ok){ var q = d.transaction('voz').objectStore('voz').get(k); q.onsuccess = function(){ ok(q.result || null); }; q.onerror = function(){ ok(null); }; }); }).catch(function(){ return null; }); }
function idbPut(k, v){ return idb().then(function(d){ d.transaction('voz', 'readwrite').objectStore('voz').put(v, k); }).catch(function(){}); }
function hash(s){ var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

/* ---------- gerar vídeo ---------- */
function st(t, p){ $('gSt').textContent = t; if (p != null) $('gPr').style.width = Math.round(p * 100) + '%'; }
function etapa(n, txt){ $('gEt').innerHTML = ['Voz do locutor', 'Juntar voz e música', 'Montar o vídeo'].map(function(e, i){ return '<span class="' + (i < n ? 'ok' : i == n ? 'ag' : '') + '">' + (i < n ? '✅' : i == n ? '⏳' : '⚪') + ' ' + e + '</span>'; }).join(''); }
function acoes(h){ $('gAc').innerHTML = h || ''; }
function comTempo(pr, ms, erro){ return Promise.race([pr, new Promise(function(_, ruim){ setTimeout(function(){ ruim(new Error(erro)); }, ms); })]); }
function respira(){ return new Promise(function(r){ setTimeout(r, 30); }); }
var GERA = null;
$('bGerar').onclick = function(){ gerar({}); };
var ULT_O = {};
window.gerarDeNovo = function(o){ gerar(o || ULT_O); };
window.cancelaGerar = function(){ if (!GERA) return; GERA.cancelado = true; if (window.cancelaEspera) window.cancelaEspera('cancelado'); if (window.cancelaGravacao) window.cancelaGravacao('cancelado'); };
function outraVoz(id){ var i = 0; for (; i < VOZES.length; i++) if (VOZES[i].id == id) break; return VOZES[(i + 1) % VOZES.length]; }
function msgErro(m){
  return {'sem-chave': 'A chave da IA (Gemini) não está salva no ADM do Meu Lanche.', 'limite': 'A voz grátis chegou no limite agora (muita gente usando).', 'tempo': 'A voz demorou demais para responder.', 'sem internet': 'Sem internet na hora de gerar a voz.',
    'som-parado': 'O som do celular não começou a tocar.', 'tempo-video': 'O vídeo demorou demais para ficar pronto.', 'tempo-mix': 'Juntar voz e música demorou demais.', 'gravador': 'O celular não conseguiu gravar o vídeo.', 'sem-gravador': 'Este navegador não grava vídeo. Use o Chrome.'}[m] || ('Deu um erro (' + m + ').');
}
async function gerar(o){
  if (GERA) return;
  var e = valida(); if (e){ toast(e, '#b91c1c', 4000); return; }
  var fmts = []; if ($('fV').checked) fmts.push({nome: 'vertical', w: 720, h: 1280, bits: 2200000}); if ($('fH').checked) fmts.push({nome: 'horizontal', w: 1280, h: 720, bits: 2400000});
  if (!fmts.length){ toast('Marque pelo menos um tipo de vídeo.', '#b91c1c'); return; }
  ULT_O = o;
  if (o.vozId){ OF.voz = o.vozId; sujo = true; pintaVozes(); }
  var ac = audioCtx(), b = $('bGerar'), G = GERA = {cancelado: false}; b.disabled = true; GRAVANDO = true; $('gerando').classList.remove('oculto'); $('gAv').classList.remove('oculto'); $('vids').innerHTML = '';
  acoes('<button class="bt cz peq" onclick="cancelaGerar()">✖️ Cancelar</button>'); $('gerando').scrollIntoView({block: 'center', behavior: 'smooth'});
  var voz = vozPorId(OF.voz), wav = null;
  try {
    var r = OF.roteiro, partes = [r.abre].concat(r.itens).concat([r.fecha]), texto = partes.join('\n\n'), mix;
    etapa(0); st('🎙️ Gerando a voz de ' + voz.nome + '…', 0.03); await respira();
    if (!o.semVoz){
      var ck = 'v5|' + voz.id + '|' + hash(texto); wav = await idbGet(ck);
      if (!wav){
        G.t0v = Date.now(); var key = await comTempo(pegaChave(), 15000, 'sem-chave');
        wav = await geraFala(texto, voz, key, function(m){ st(m, 0.03 + Math.min(0.2, (Date.now() - G.t0v) / 150000 * 0.2)); });
        idbPut(ck, wav);
      }
    }
    if (G.cancelado) throw new Error('cancelado');
    etapa(1); st('🎵 Juntando voz, música e efeitos…', 0.25); await respira();
    mix = await comTempo(wav ? mixar(wav, voz, partes, OF.produtos.length) : mixarSemVoz(OF.produtos.length), 90000, 'tempo-mix');
    window.OK_PLANO = mix.plano;
    if (G.cancelado) throw new Error('cancelado');
    etapa(2); st('🖼️ Preparando as fotos…', 0.3); await respira();
    var imgs = []; for (var i = 0; i < OF.produtos.length; i++){ var f = OF.produtos[i].foto; imgs.push(f ? await comTempo(carregaImg(f), 15000, 'img').catch(function(){ return null; }) : null); }
    var logo = OF.logo ? await comTempo(carregaImg(OF.logo), 15000, 'img').catch(function(){ return null; }) : null;
    if (G.cancelado) throw new Error('cancelado');
    var P = {of: OF, imgs: imgs, logo: logo, cenas: mix.plano.cenas, total: mix.plano.total};
    var res = await gravaVideos(ac, P, mix.buf, fmts, function(p, n, tot, f){
      var qual = f.nome == 'vertical' ? '📱 celular' : '📺 TV', fal = Math.max(0, Math.ceil(P.total * (1 - p)));
      st('🎬 Montando vídeo' + (tot > 1 ? ' ' + (n + 1) + ' de ' + tot : '') + ' (' + qual + ')… ' + Math.round(p * 100) + '% — falta ~' + fal + ' s', 0.3 + 0.7 * (n + p) / tot); });
    VID = res.videos; VID.tipo = res.tipo; etapa(3); st('✅ Pronto!', 1); acoes('');
    mostraVideos(); toast('Vídeo pronto! 🎉');
    if (!wav) $('vids').insertAdjacentHTML('afterbegin', '<div class="aviso">Este vídeo saiu sem locutor (só música).</div>');
    salvar(true);
  } catch (x) {
    var m = x && x.message || 'falhou';
    if (/^oculto|^saiu/.test(m)){ st('⚠️ Cancelado: o app saiu da tela.', 0); toast('A gravação foi cancelada porque o app saiu da tela. Deixe a tela aberta até terminar.', '#b45309', 7000);
      acoes('<div class="aviso">⚠️ Parou porque o app saiu da tela (ou a tela apagou). Deixe esta tela aberta até terminar.</div><button class="bt peq" onclick="gerarDeNovo()">🔄 Tentar de novo</button>'); }
    else if (m == 'cancelado'){ st('Cancelado.', 0); acoes('<button class="bt peq" onclick="gerarDeNovo()">🔄 Gerar de novo</button>'); }
    else {
      console.error(x);
      var naVoz = !wav && !o.semVoz, ov = outraVoz(voz.id);
      st('❌ ' + msgErro(m), 0); var ag = $('gEt').querySelector('.ag'); if (ag){ ag.className = 'er'; ag.textContent = ag.textContent.replace('⏳', '❌'); }
      acoes('<button class="bt peq" onclick="gerarDeNovo()">🔄 Tentar de novo</button>' +
        (naVoz && m != 'sem-chave' ? '<button class="bt az peq" onclick="gerarDeNovo({vozId:\'' + ov.id + '\'})">🎙️ Tentar com outro locutor (' + ov.nome + ')</button>' : '') +
        (naVoz ? '<button class="bt cz peq" onclick="gerarDeNovo({semVoz:true})">🎵 Fazer só com música (sem locutor)</button>' : '') +
        (!naVoz && fmts.length > 1 ? '<div class="aviso">Dica: marque só um tipo de vídeo (📱 ou 📺) para ficar mais leve.</div>' : ''));
    }
  } finally { GERA = null; GRAVANDO = false; b.disabled = false; $('gAv').classList.add('oculto'); }
}
function nomeArq(fmt){ var ext = /mp4/.test(VID.tipo) ? 'mp4' : 'webm'; return 'oferta-' + (OF.loja || 'loja').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + (fmt == 'vertical' ? 'celular' : 'tv') + '.' + ext; }
function mostraVideos(){
  var h = ''; ['vertical', 'horizontal'].forEach(function(f){ var bl = VID[f]; if (!bl) return; var u = URL.createObjectURL(bl);
    h += '<div class="vid"><b>' + (f == 'vertical' ? '📱 Celular (em pé)' : '📺 TV (deitado)') + '</b> <small class="d">' + (bl.size / 1048576).toFixed(1) + ' MB • ' + (/mp4/.test(VID.tipo) ? 'MP4' : 'WEBM') + '</small><video src="' + u + '" controls playsinline></video>' +
      '<div class="lin"><a class="bt vd peq" href="' + u + '" download="' + nomeArq(f) + '">⬇️ Baixar</a><button class="bt az peq" onclick="compartilha(\'' + f + '\')">📤 WhatsApp / Insta</button></div></div>'; });
  if (VID.tipo && !/mp4/.test(VID.tipo)) h = '<div class="aviso">Este aparelho só grava em WEBM. Toca no TelaOkê e no Chrome, mas o WhatsApp pode não aceitar.</div>' + h;
  $('vids').innerHTML = h;
}
window.compartilha = async function(f){
  var bl = VID[f], arq = new File([bl], nomeArq(f), {type: bl.type});
  if (navigator.canShare && navigator.canShare({files: [arq]})){ try { await navigator.share({files: [arq], title: 'Oferta ' + OF.loja, text: 'Ofertas do ' + OF.loja + '!'}); } catch (e) {} }
  else { toast('Este celular não deixa compartilhar direto. Toque em ⬇️ Baixar e mande pelo WhatsApp.', '#b45309', 5000); }
};

/* ---------- TelaOkê ---------- */
function carregaLojas(){
  $('tLoja').innerHTML = '<option value="">Carregando…</option>';
  DB.lojas().then(function(L){ LOJAS = L.sort(function(a, b){ return (a.nome || '').localeCompare(b.nome || ''); }); pintaLojas(); })
    .catch(function(){ $('tLoja').innerHTML = '<option value="">(não carregou os anunciantes)</option>'; });
}
function pintaLojas(sel){
  var nome = ($('eLoja').value || '').trim().toLowerCase(), achou = '';
  LOJAS.forEach(function(l){ if ((l.nome || '').trim().toLowerCase() == nome) achou = l.id; });
  sel = sel || OF.toLojaId || achou;
  $('tLoja').innerHTML = '<option value="">— escolha o anunciante —</option>' + LOJAS.map(function(l){ return '<option value="' + l.id + '"' + (l.id == sel ? ' selected' : '') + '>' + esc(l.nome) + (l.pausado ? ' (pausado)' : '') + '</option>'; }).join('') + '<option value="+novo">➕ Cadastrar "' + esc($('eLoja').value.trim() || 'esta loja') + '" como anunciante</option>';
}
$('eLoja').addEventListener('change', function(){ if (LOJAS.length) pintaLojas(); });
function caixaCodigo(id){ var l = OKV.link(id); return '<div class="cod">Código do vídeo<b>' + id + '</b><small>' + l + '</small></div><div class="lin"><button class="bt cz peq" onclick="copia(\'' + l + '\')">📋 Copiar link</button><button class="bt cz peq" onclick="copia(\'' + id + '\')">📋 Copiar código</button></div><p class="st">No ADM do TelaOkê: Anúncios ➜ Vídeo ➜ cole este link.</p>'; }
function tProg(p){ $('tProg').classList.toggle('oculto', p == null); if (p != null) $('tPr').style.width = Math.round(p * 100) + '%'; }
async function sobeTv(){
  var bl = VID.horizontal || VID.vertical; if (!bl) throw new Error('Gere o vídeo primeiro (passo 5). Para TV marque 📺 TV (deitado).');
  var fmt = VID.horizontal ? 'h' : 'v'; if (OF.videos && OF.videos[fmt] && OF.videos[fmt].blob === bl) return OF.videos[fmt].id;
  $('tSt').textContent = 'Enviando o vídeo… (' + (bl.size / 1048576).toFixed(1) + ' MB)'; tProg(0);
  var antigo = OF.videos && OF.videos[fmt] && OF.videos[fmt].id;
  var id = await DB.sobeVideo(bl, {titulo: 'Oferta ' + OF.loja, formato: fmt == 'h' ? '16:9' : '9:16', ofertaId: OF.id || ''}, function(p){ tProg(p); });
  OF.videos = OF.videos || {}; OF.videos[fmt] = {id: id, link: OKV.link(id)}; Object.defineProperty(OF.videos[fmt], 'blob', {value: bl, enumerable: false});
  if (antigo && antigo != id) DB.apagaVideo(antigo);
  tProg(null); return id;
}
$('bLink').onclick = async function(){ var b = this; b.disabled = true; try { var id = await sobeTv(); $('tCod').innerHTML = caixaCodigo(id); $('tSt').textContent = '✅ Código pronto.'; await salvar(true); } catch (e) { tProg(null); $('tSt').textContent = '❌ ' + (e.message || e.code || e); } b.disabled = false; };
$('bTela').onclick = async function(){
  var b = this, e = valida(); if (e){ toast(e, '#b91c1c', 4000); return; }
  if (!VID.horizontal){ toast(VID.vertical ? 'Para a TV gere o vídeo 📺 TV (deitado) (passo 5).' : 'Gere o vídeo primeiro (passo 5).', '#b91c1c', 4500); return; }
  var lid = $('tLoja').value; if (!lid){ toast('Escolha o anunciante.', '#b91c1c'); return; }
  b.disabled = true;
  try {
    var l;
    if (lid == '+novo'){
      $('tSt').textContent = 'Cadastrando o anunciante…'; var ini = hoje();
      var o = {nome: OF.loja, zap: nz(OF.zap), categoria: '', obs: 'Cadastrado pelo Oferta Okê', preco: 49.99, inicio: ini, gratis: true, venc: addD(ini, 30), pausado: false};
      lid = await DB.novaLoja(o); o.id = lid; LOJAS.push(o); l = o; pintaLojas(lid);
    } else l = LOJAS.filter(function(x){ return x.id == lid; })[0];
    OF.toLojaId = lid;
    var id = await sobeTv();
    $('tSt').textContent = 'Criando o anúncio no TelaOkê…';
    var an = {lojaId: lid, lojaNome: l.nome, lojaVenc: l.venc || '', lojaPausada: !!l.pausado, titulo: 'Oferta Okê • ' + (OF.produtos.map(function(p){ return p.nome; }).join(', ')).slice(0, 80), ativo: true, telas: [], inicio: '', fim: '', tipo: 'mp4', url: OKV.link(id), yt: '', img: '', tempo: 0};
    OF.anuncioId = await DB.anuncio(OF.anuncioId || null, an);
    $('tCod').innerHTML = caixaCodigo(id); $('tSt').textContent = '✅ Pronto! O anúncio já está ligado em todas as TVs do TelaOkê' + (l.pausado ? ' (mas o anunciante está pausado)' : '') + '.';
    await salvar(true); toast('📺 Mandado para o TelaOkê!');
  } catch (x) { tProg(null); $('tSt').textContent = '❌ Não deu: ' + (x.code == 'permission-denied' ? 'sem permissão (confira se entrou com uma conta de administrador).' : (x.message || x.code || x)); }
  b.disabled = false;
};

/* ---------- salvar / apagar ---------- */
function tamanhoDoc(o){ return JSON.stringify(o).length; }
async function salvar(quieto){
  var e = valida(); if (e && !quieto){ toast(e, '#b91c1c', 4000); return; }
  var c = JSON.parse(JSON.stringify(OF)); delete c.semente;
  if (tamanhoDoc(c) > 950000){ for (var i = 0; i < OF.produtos.length; i++){ var im = await carregaImg(OF.produtos[i].foto).catch(function(){ return null; }); if (im){ var t = novaTela(im.naturalWidth, im.naturalHeight); t.getContext('2d').drawImage(im, 0, 0); c.produtos[i].foto = telaParaDado(t, 420, 60000, OF.produtos[i].tipoFoto == 'recorte'); } } }
  try { var id = await DB.salva(c); if (!OF.id){ OF.id = id; $('bApagar').classList.remove('oculto'); } sujo = false; if (!quieto) toast('💾 Salvo!'); }
  catch (x) { toast('Não salvou: ' + (x.code || x.message), '#b91c1c', 4000); }
}
$('bSalvar').onclick = function(){ salvar(false); };
$('bApagar').onclick = async function(){ if (!OF.id || !confirm('Apagar este comercial? (O anúncio no TelaOkê continua lá; apague pelo ADM se quiser.)')) return;
  try { await DB.apaga(OF.id); toast('Apagado'); sujo = false; abreHome(); } catch (x) { toast('Não apagou: ' + (x.code || x.message), '#b91c1c'); } };
window.copia = copia;
window.addEventListener('beforeunload', function(e){ if (sujo){ e.preventDefault(); e.returnValue = ''; } });
if ('serviceWorker' in navigator && !TESTE){
  navigator.serviceWorker.register('sw.js').catch(function(){});
  /* versão nova chegou: recarrega sozinho (só se não tiver nada pela metade) */
  var RECARREGOU = false; navigator.serviceWorker.addEventListener('controllerchange', function(){ if (RECARREGOU || sujo || GRAVANDO) return; RECARREGOU = true; location.reload(); });
}
