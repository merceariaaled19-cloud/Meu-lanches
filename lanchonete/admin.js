/* Meu Lanche Pro — painel do administrador */
var LOJAS = [], FILTRO = 'pendente', unA = null, unPg = null, PAGS = [], PAGS_OK = false;
function msg(t){ $('msg').textContent = t; }
$('bG').onclick = function(){ var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt: 'select_account'}); msg('Abrindo o Google…'); var cel = /Android|iPhone/i.test(navigator.userAgent); if (cel){ au.signInWithRedirect(p).catch(function(e){ msg('Não entrou: ' + e.code); }); return; } au.signInWithPopup(p).catch(function(e){ if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment' || e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') au.signInWithRedirect(p); else msg('Não entrou: ' + e.code); }); };
$('bE').onclick = function(){ au.signInWithEmailAndPassword($('em').value.trim(), $('se').value).catch(function(e){ msg('Não entrou: ' + e.code); }); };
$('sair').onclick = function(){ au.signOut(); };
au.getRedirectResult().catch(function(e){ msg('Não entrou: ' + (e.code || e.message)); });
au.onAuthStateChanged(function(u){
  if (unA){ unA(); unA = null; } if (unPg){ unPg(); unPg = null; } PAGS = []; PAGS_OK = false;
  var adm = u && ADMINS.indexOf((u.email || '').toLowerCase()) >= 0;
  $('login').style.display = adm ? 'none' : 'block'; $('app').style.display = adm ? 'block' : 'none'; $('sair').style.display = u ? 'block' : 'none';
  if (u && !adm) msg('A conta ' + u.email + ' não é de administrador. Saia e entre com a conta certa.');
  if (adm) inicia();
});
function inicia(){
  db.collection('ml_publico').doc('pix').get().then(function(d){ var c = d.exists ? d.data() : {}; $('pxChave').value = c.chave || ''; $('pxNome').value = c.nome || ''; if (c.cidade) $('pxCid').value = c.cidade; $('pxMsg').textContent = c.chave ? '✅ Pix configurado.' : 'Ainda não configurado.'; }).catch(function(){});
  if (unPg) unPg();
  unPg = db.collection('ml_pagamentos').where('status', '==', 'aguardando').onSnapshot(function(s){
    var antes = PAGS.length; PAGS = s.docs.map(function(d){ var x = d.data(); x.id = d.id; x.t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : Date.now(); return x; }).sort(function(a, b){ return a.t - b.t; });
    if (PAGS_OK && PAGS.length > antes){ toast('💰 Chegou comprovante de pagamento!', 5000); try { navigator.vibrate && navigator.vibrate([300, 100, 300]); } catch (e) {} }
    PAGS_OK = true; desenhaPags();
  }, function(e){ $('listaPags').innerHTML = '<div class="aviso no">Erro: ' + esc(e.code) + '</div>'; });
  db.collection('ml_config').doc('geral').get().then(function(d){ var c = d.exists ? d.data() : {}; if (!$('geminiKey').value) $('geminiKey').value = c.geminiKey || ''; $('gMod').value = c.geminiModelo || ''; $('gMsg').textContent = c.geminiKey ? '✅ Chave salva.' : '⚠️ Sem chave: os donos só conseguem cadastrar lanches na mão.'; });
  unA = db.collection('ml_lojas').onSnapshot(function(s){
    LOJAS = s.docs.map(function(d){ var x = d.data(); x.id = d.id; x.t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : 0; return x; });
    LOJAS.sort(function(a, b){ return b.t - a.t; }); desenha();
  }, function(e){ $('lista').innerHTML = '<div class="aviso no">Erro: ' + esc(e.code) + '</div>'; });
}
$('gSalva').onclick = function(){
  db.collection('ml_config').doc('geral').set({geminiKey: $('geminiKey').value.trim(), geminiModelo: $('gMod').value.trim(), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()}, {merge: true})
    .then(function(){ $('gMsg').textContent = '✅ Chave salva.'; toast('Salvo!'); }, function(e){ $('gMsg').textContent = 'Erro: ' + e.code; });
};
$('gTesta').onclick = function(){
  var k = $('geminiKey').value.trim(); if (!k) return ($('gMsg').textContent = 'Cole a chave primeiro.');
  $('gMsg').textContent = 'Testando…';
  fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=' + encodeURIComponent(k)).then(function(r){ return r.json().then(function(j){ return {st: r.status, j: j}; }); }).then(function(x){
    if (x.st !== 200) return ($('gMsg').textContent = '❌ Chave não funcionou (' + x.st + '): ' + ((x.j.error && x.j.error.message) || ''));
    var fl = (x.j.models || []).map(function(m){ return m.name.replace('models/', ''); }).filter(function(n){ return /flash/.test(n) && !/tts|audio|image|live|embedding/.test(n); });
    $('gMsg').textContent = '✅ Chave funcionando. Modelos rápidos disponíveis: ' + fl.slice(0, 8).join(', ');
  }).catch(function(){ $('gMsg').textContent = 'Sem internet.'; });
};
function situacao(x){
  var ven = x.validade && x.validade.toDate && x.validade.toDate() < new Date();
  if (x.status === 'liberado' && ven) return ['vencido', 'Vencida', 'no'];
  if (x.status === 'liberado' && x.plano === 'teste') return ['liberado', 'Teste grátis', 'esp'];
  if (x.status === 'liberado') return ['liberado', 'Liberada' + (planoPorId(x.plano) ? ' • ' + planoPorId(x.plano).nome : ''), 'ok'];
  if (x.status === 'bloqueado') return ['bloqueado', 'Bloqueada', 'no'];
  return ['pendente', 'Esperando', 'esp'];
}
function desenha(){
  var cont = {pendente: 0, liberado: 0, bloq: 0};
  LOJAS.forEach(function(x){ var s = situacao(x)[0]; if (s === 'pendente') cont.pendente++; else if (s === 'liberado') cont.liberado++; else cont.bloq++; });
  $('tP').textContent = cont.pendente; $('tL').textContent = cont.liberado; $('tB').textContent = cont.bloq;
  $('filtros').innerHTML = [['pendente', 'Esperando'], ['liberado', 'Liberadas'], ['bloq', 'Bloqueadas'], ['todas', 'Todas']].map(function(f){ return '<label class="' + (FILTRO === f[0] ? 'on' : '') + '" onclick="FILTRO=\'' + f[0] + '\';desenha()">' + f[1] + '</label>'; }).join('');
  var b = $('bus').value.trim().toLowerCase();
  var l = LOJAS.filter(function(x){
    var s = situacao(x)[0];
    if (FILTRO === 'pendente' && s !== 'pendente') return false;
    if (FILTRO === 'liberado' && s !== 'liberado') return false;
    if (FILTRO === 'bloq' && (s === 'pendente' || s === 'liberado')) return false;
    return !b || [x.nome, x.dono, x.email, x.zap, x.slug].join(' ').toLowerCase().indexOf(b) >= 0;
  });
  var h = l.length ? '' : '<div class="vazio">Nada por aqui.</div>';
  l.forEach(function(x){
    var s = situacao(x), val = x.validade && x.validade.toDate ? x.validade.toDate() : null;
    h += '<div class="itemadm" style="flex-wrap:wrap">' + (x.logo ? '<img src="' + x.logo + '">' : '<div class="semft">🍔</div>') +
      '<div class="tx"><b>' + esc(x.nome) + ' <span class="tag ' + s[2] + '">' + s[1] + '</span></b><div class="sub">' + esc(x.dono || '') + ' • ' + esc(x.email || '') + '<br>📱 ' + esc(x.zap || '') + (x.t ? '<br>🕒 Cadastro: ' + new Date(x.t).toLocaleDateString('pt-BR') + ' às ' + new Date(x.t).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '') +
      (s[0] === 'liberado' || s[0] === 'vencido' ? '<br>Validade: ' + (val ? val.toLocaleDateString('pt-BR') : 'sem prazo') : '') + '</div></div>' +
      '<div class="row" style="flex-basis:100%;margin-top:6px">' +
      '<button class="mini" onclick="libera(\'' + x.id + '\')">✅ ' + (s[0] === 'liberado' ? 'Renovar' : 'Liberar') + '</button>' +
      (s[0] !== 'bloqueado' ? '<button class="mini btr" onclick="bloqueia(\'' + x.id + '\')">🔒 Bloquear</button>' : '') +
      '<button class="mini btz" onclick="avisa(\'' + x.id + '\')">💬 WhatsApp</button>' +
      '<a class="bt mini bt3" target="_blank" href="' + esc(linkLoja(x.slug)) + '">👀 Loja</a>' +
      '<button class="mini btr" style="flex-basis:100%;background:#7f1d1d" onclick="exclui(\'' + x.id + '\')">🗑️ Excluir conta</button></div></div>';
  });
  $('lista').innerHTML = h;
}
$('bus').oninput = desenha;
function acha(id){ return LOJAS.filter(function(x){ return x.id === id; })[0]; }
function libera(id){
  var x = acha(id); if (!x) return;
  $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)fechaM()"><div class="folha"><button class="fecha" onclick="fechaM()">✕</button><h2>Liberar ' + esc(x.nome) + '</h2><p class="sub">Por quanto tempo?</p>' +
    [[7, 'Teste 7 dias'], [30, '30 dias'], [90, '3 meses'], [180, '6 meses'], [365, '1 ano'], [0, 'Sem prazo']].map(function(o){ return '<button class="full" style="margin:5px 0" onclick="confirmaLib(\'' + id + '\',' + o[0] + ')">' + o[1] + '</button>'; }).join('') + '</div></div>';
}
function fechaM(){ $('modal').innerHTML = ''; }
function confirmaLib(id, dias){
  var x = acha(id), base = Date.now();
  if (x && x.status === 'liberado' && x.validade && x.validade.toMillis && x.validade.toMillis() > base) base = x.validade.toMillis();
  var val = dias ? firebase.firestore.Timestamp.fromMillis(base + dias * 864e5) : null;
  db.collection('ml_lojas').doc(id).update({status: 'liberado', validade: val, liberadoEm: firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    fechaM(); toast('Liberada! ✅');
    if (confirm('Mandar aviso no WhatsApp do dono?')) avisa(id, true, val);
  }, function(e){ toast('Erro: ' + e.code, 4000); });
}
function bloqueia(id){ var x = acha(id); if (x && confirm('Bloquear ' + x.nome + '? A loja sai do ar e o dono não acessa o painel.')) db.collection('ml_lojas').doc(id).update({status: 'bloqueado'}).then(function(){ toast('Bloqueada'); }, function(e){ toast('Erro: ' + e.code); }); }
function avisa(id, lib, val){
  var x = acha(id); if (!x) return;
  var t = lib ? 'Olá, ' + (x.dono || '').split(' ')[0] + '! Seu acesso ao Meu Lanche foi liberado' + (val ? ' até ' + val.toDate().toLocaleDateString('pt-BR') : '') + '. 🎉 Entre em ' + BASE_URL + ' com seu e-mail e senha para montar seu cardápio. O link da sua loja é: ' + linkLoja(x.slug)
    : 'Olá, ' + (x.dono || '').split(' ')[0] + '! Aqui é do Meu Lanche, sobre a lanchonete ' + x.nome + '.';
  abreZap(x.zap, t);
}
$('bR').onclick = function(){ var e = $('em').value.trim().toLowerCase(); if (ADMINS.indexOf(e) < 0) return msg('Digite seu e-mail de administrador no campo acima.'); au.sendPasswordResetEmail(e).then(function(){ msg('Pronto! Abra o e-mail que chegou em ' + e + ', crie a senha e volte aqui para entrar com e-mail e senha.'); }, function(x){ msg('Não enviou: ' + x.code); }); };

/* apaga a lanchonete inteira: cadastro, cardápio e pedidos */
function exclui(id){
  var x = acha(id); if (!x) return;
  if (!confirm('Excluir a conta "' + x.nome + '" (' + (x.email || '') + ')?\n\nApaga a loja, o cardápio e os pedidos. Não dá para desfazer.\n\nTem certeza que quer excluir?')) return;
  toast('Excluindo…', 8000);
  var ref = db.collection('ml_lojas').doc(id);
  function apagaTudo(q){ return q.get().then(function(s){ var b = db.batch(), n = 0; s.docs.forEach(function(d){ b.delete(d.ref); n++; }); return n ? b.commit() : null; }); }
  apagaTudo(ref.collection('itens').limit(450)).then(function(){ return apagaTudo(ref.collection('itens').limit(450)); })
    .then(function(){ return apagaTudo(db.collection('ml_pedidos').where('lojaId', '==', id).limit(450)); })
    .then(function(){ return ref.delete(); })
    .then(function(){ toast('Conta excluída 🗑️'); }, function(e){ toast('Erro ao excluir: ' + (e.code || e.message), 5000); });
}


/* ---------- assinaturas: Pix e comprovantes ---------- */
$('pxSalva').onclick = function(){
  var c = {chave: $('pxChave').value.trim(), nome: $('pxNome').value.trim(), cidade: $('pxCid').value.trim() || 'Manaus', atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()};
  if (!c.chave) return ($('pxMsg').textContent = 'Digite a chave Pix.');
  db.collection('ml_publico').doc('pix').set(c, {merge: true}).then(function(){ $('pxMsg').textContent = '✅ Pix salvo.'; toast('Salvo!'); }, function(e){ $('pxMsg').textContent = 'Erro: ' + e.code; });
};
function desenhaPags(){
  $('nPags').textContent = PAGS.length;
  if (!PAGS.length){ $('listaPags').innerHTML = '<div class="vazio">Nenhum comprovante esperando.</div>'; return; }
  $('listaPags').innerHTML = PAGS.map(function(p){
    var pl = planoPorId(p.plano) || {nome: p.plano}, d = new Date(p.t);
    return '<div class="itemadm" style="flex-wrap:wrap"><img src="' + p.comprovante + '" style="cursor:pointer" onclick="verComp(\'' + p.id + '\')">' +
      '<div class="tx"><b>' + esc(p.loja || '') + '</b><div class="sub">' + esc(p.email || '') + '<br>Plano <b>' + esc(pl.nome) + '</b> • <b>' + brl(p.valor) + '</b><br>🕒 ' + d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) + '</div></div>' +
      '<div class="row" style="flex-basis:100%;margin-top:6px"><button class="mini" onclick="aprovaPag(\'' + p.id + '\')">✅ Caiu, liberar</button><button class="mini btr" onclick="recusaPag(\'' + p.id + '\')">❌ Não caiu</button><button class="mini bt3" onclick="verComp(\'' + p.id + '\')">🔍 Ver</button></div></div>';
  }).join('');
}
function achaPag(id){ for (var i = 0; i < PAGS.length; i++) if (PAGS[i].id === id) return PAGS[i]; return null; }
function verComp(id){ var p = achaPag(id); if (!p) return; $('modal').innerHTML = '<div class="fundo" onclick="fechaM()"><div class="folha" style="text-align:center"><button class="fecha" onclick="fechaM()">✕</button><h2>' + esc(p.loja || '') + ' — ' + brl(p.valor) + '</h2><img src="' + p.comprovante + '" style="max-width:100%;border-radius:10px"></div></div>'; }
function aprovaPag(id){
  var p = achaPag(id); if (!p) return; var pl = planoPorId(p.plano) || {nome: p.plano, dias: p.dias || 30};
  if (!confirm('O Pix de ' + brl(p.valor) + ' de "' + (p.loja || '') + '" caiu na sua conta?\n\nVai liberar o plano ' + pl.nome + ' (' + pl.dias + ' dias).')) return;
  var x = acha(p.lojaId), base = Date.now();
  if (x && x.status === 'liberado' && x.validade && x.validade.toMillis && x.validade.toMillis() > base) base = x.validade.toMillis();
  var val = firebase.firestore.Timestamp.fromMillis(base + pl.dias * 864e5), b = db.batch();
  b.update(db.collection('ml_lojas').doc(p.lojaId), {status: 'liberado', plano: p.plano, validade: val, liberadoEm: firebase.firestore.FieldValue.serverTimestamp()});
  b.update(db.collection('ml_pagamentos').doc(id), {status: 'aprovado', aprovadoEm: firebase.firestore.FieldValue.serverTimestamp(), validade: val});
  b.commit().then(function(){
    toast('Liberado! ✅ A loja abre sozinha para o cliente.', 4000);
    if (x && x.zap && confirm('Mandar confirmação no WhatsApp do cliente?')) abreZap(x.zap, 'Olá, ' + (x.dono || '').split(' ')[0] + '! Recebemos seu pagamento do plano ' + pl.nome + ' do Meu Lanche. ✅ Seu acesso está liberado até ' + val.toDate().toLocaleDateString('pt-BR') + '. É só abrir ' + BASE_URL + ' — tudo que você montou continua lá. Obrigado!');
  }, function(e){ toast('Erro: ' + e.code, 4000); });
}
function recusaPag(id){ var p = achaPag(id); if (p && confirm('Marcar que o Pix de "' + (p.loja || '') + '" NÃO caiu? O cliente vai ver o aviso para enviar de novo.')) db.collection('ml_pagamentos').doc(id).update({status: 'recusado'}).then(function(){ toast('Marcado como não confirmado'); }, function(e){ toast('Erro: ' + e.code); }); }

function textoConvite(){
  return 'Olá! Monte o cardápio digital da sua lanchonete e receba pedidos pelo WhatsApp com o Meu Lanche. 🍔\n\n' +
    '👉 Faça seu cadastro (7 dias grátis): ' + $('lkCad').value + '\n\n' +
    '▶️ Vídeo: como cadastrar e configurar: https://is.gd/meulanchecadastro\n' +
    '▶️ Vídeo: como assinar e pagar: https://is.gd/meulanchepagamento\n' +
    '📲 App para celular (Android): https://is.gd/meulancheapp';
}
