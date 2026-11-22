/* Meu Lanche Pro — painel do dono */
var U = null, LD = null, IT = [], PEDS = [], ABA = 'pedidos', CFG = null, unL = null, unI = null, unP = null, pedVistos = null, REV = [], fotoCb = null;

function abreDono(){
  aplicaTema('laranja');
  au.onAuthStateChanged(function(u){
    U = u; [unL, unI, unP].forEach(function(f){ if (f) f(); }); unL = unI = unP = null; LD = null; pedVistos = null;
    if (!u) return telaLogin();
    unL = db.collection('ml_lojas').doc(u.uid).onSnapshot(function(d){
      if (!d.exists) return telaNovaLoja();
      var antes = LD; LD = d.data(); aplicaTema(LD.tema);
      var ven = LD.validade && LD.validade.toDate && LD.validade.toDate() < new Date();
      if (LD.status !== 'liberado' || ven) return telaEspera(ven);
      if (!unI) iniciaPainel(); else if (!antes || antes.status !== LD.status || !$('conteudo')) desenhaPainel(); else { atualizaTopo(); if (ABA !== 'pedidos' && !$('modal').innerHTML) desenhaAba(); }
    }, function(e){ $('raiz').innerHTML = '<div class="wrap"><div class="aviso no">Erro ao carregar: ' + esc(e.code || e.message) + '</div><button onclick="au.signOut()">Sair</button></div>'; });
  });
}

/* ---------- entrar / cadastro ---------- */
var modoLogin = 'entrar';
function telaLogin(){
  var h = '<div class="topo"><div class="lin"><img class="logo" src="icon-192.png" alt=""><div><h1>Meu Lanche</h1><small>Seu cardápio digital com pedidos no WhatsApp</small></div></div></div><div class="wrap">';
  h += '<div class="abas" style="position:static;padding:10px 0"><button class="' + (modoLogin === 'entrar' ? 'on' : '') + '" onclick="modoLogin=\'entrar\';telaLogin()">Já tenho cadastro</button><button class="' + (modoLogin === 'criar' ? 'on' : '') + '" onclick="modoLogin=\'criar\';telaLogin()">Quero me cadastrar</button></div><div class="card">';
  if (modoLogin === 'criar'){
    h += '<h2>Cadastre sua lanchonete</h2><p class="sub">Depois do cadastro, a gente libera seu acesso rapidinho.</p>' +
      '<label>Seu nome</label><input id="lDono" placeholder="Seu nome">' +
      '<label>Nome da lanchonete</label><input id="lNome" placeholder="Ex.: Lanches do Zé">' +
      '<label>WhatsApp da lanchonete</label><input id="lZap" type="tel" placeholder="(92) 99999-9999">';
  } else h += '<h2>Entrar</h2>';
  h += '<label>E-mail</label><input id="lEm" type="email" autocomplete="username" placeholder="seuemail@gmail.com">' +
    '<label>Senha</label><input id="lSe" type="password" autocomplete="' + (modoLogin === 'criar' ? 'new-password' : 'current-password') + '" placeholder="' + (modoLogin === 'criar' ? 'Crie uma senha (mínimo 6)' : 'Sua senha') + '">' +
    '<p id="lMsg" style="color:var(--erro);min-height:18px"></p>' +
    '<button class="full" id="lBt" onclick="' + (modoLogin === 'criar' ? 'criaConta()' : 'entra()') + '">' + (modoLogin === 'criar' ? 'Fazer meu cadastro' : 'Entrar') + '</button>';
  if (modoLogin === 'entrar') h += '<p style="text-align:center"><a href="#" onclick="esqueci();return false">Esqueci minha senha</a></p>';
  h += '</div><p class="sub" style="text-align:center">É cliente e quer fazer pedido? Peça o link do cardápio para a lanchonete. 😉</p></div>';
  $('raiz').innerHTML = h;
}
function erroAuth(e){
  var m = {'auth/invalid-email':'E-mail inválido.','auth/user-not-found':'E-mail não cadastrado.','auth/wrong-password':'Senha errada.','auth/invalid-credential':'E-mail ou senha errados.','auth/invalid-login-credentials':'E-mail ou senha errados.','auth/email-already-in-use':'Esse e-mail já tem cadastro. Toque em "Já tenho cadastro".','auth/weak-password':'A senha precisa ter pelo menos 6 letras ou números.','auth/too-many-requests':'Muitas tentativas. Espere um pouco.','auth/network-request-failed':'Sem internet.'};
  $('lMsg').textContent = m[e.code] || ('Não deu certo (' + (e.code || e.message) + ').'); $('lBt').disabled = false;
}
function entra(){ $('lBt').disabled = true; au.signInWithEmailAndPassword($('lEm').value.trim(), $('lSe').value).catch(erroAuth); }
var PEND_CAD = null;
function criaConta(){
  var dono = $('lDono').value.trim(), nome = $('lNome').value.trim(), zap = soNum($('lZap').value);
  if (!dono || !nome) return ($('lMsg').textContent = 'Preencha seu nome e o nome da lanchonete.');
  if (zap.length < 10) return ($('lMsg').textContent = 'Digite o WhatsApp com DDD.');
  PEND_CAD = {dono: dono, nome: nome, zap: zap};
  $('lBt').disabled = true;
  au.createUserWithEmailAndPassword($('lEm').value.trim(), $('lSe').value).catch(erroAuth);
}
function esqueci(){
  var e = $('lEm').value.trim(); if (!e) return ($('lMsg').textContent = 'Digite seu e-mail acima e toque de novo.');
  au.sendPasswordResetEmail(e).then(function(){ toast('Mandamos um e-mail para trocar a senha. Veja também o spam.', 4500); }, erroAuth);
}
function slugLivre(base, uid){
  var tenta = function(n){
    var s = n ? base + '-' + n : base;
    return db.collection('ml_lojas').where('slug', '==', s).limit(1).get().then(function(q){ if (q.empty || q.docs[0].id === uid) return s; return tenta((n || 1) + 1); });
  };
  return tenta(0);
}
function telaNovaLoja(){
  var c = PEND_CAD;
  if (c){ PEND_CAD = null; return criaLoja(c.dono, c.nome, c.zap); }
  var h = '<div class="wrap"><div class="hero"><div class="ico">🍔</div><h2>Quase lá!</h2><p class="sub">Complete o cadastro da sua lanchonete.</p></div><div class="card">' +
    '<label>Seu nome</label><input id="lDono" value="' + esc(U.displayName || '') + '">' +
    '<label>Nome da lanchonete</label><input id="lNome" placeholder="Ex.: Lanches do Zé">' +
    '<label>WhatsApp da lanchonete</label><input id="lZap" type="tel" placeholder="(92) 99999-9999"><p id="lMsg" style="color:var(--erro)"></p>' +
    '<button class="full" id="lBt" onclick="var z=soNum($(\'lZap\').value);if(!$(\'lNome\').value.trim()||z.length<10){$(\'lMsg\').textContent=\'Preencha o nome e o WhatsApp com DDD.\';return}this.disabled=true;criaLoja($(\'lDono\').value.trim(),$(\'lNome\').value.trim(),z)">Enviar cadastro</button>' +
    '<p style="text-align:center"><a href="#" onclick="au.signOut();return false">Sair</a></p></div></div>';
  $('raiz').innerHTML = h;
}
function criaLoja(dono, nome, zap){
  $('raiz').innerHTML = '<div class="hero"><div class="ico">🍔</div><p class="sub">Criando seu cadastro…</p></div>';
  slugLivre(slugify(nome), U.uid).then(function(slug){
    return db.collection('ml_lojas').doc(U.uid).set({
      status: 'pendente', validade: null, email: U.email || '', dono: dono, nome: nome, slug: slug, zap: zap, logo: '', tema: 'laranja', layout: 'grade',
      endereco: '', lat: null, lng: null, aviso: '', pedMin: 0, horario: horarioPadrao(),
      faixas: [{km: 2, valor: 3}, {km: 3, valor: 5}, {km: 5, valor: 8}], retirada: true, semEntrega: false,
      pag: {dinheiro: true, cartao: true, pix: false, pixTipo: 'Celular', pixChave: '', pixNome: ''},
      msgs: MSGS_PADRAO, catOrdem: [], criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(function(e){ $('raiz').innerHTML = '<div class="wrap"><div class="aviso no">Não deu para criar o cadastro (' + esc(e.code || e.message) + ').</div><button onclick="location.reload()">Tentar de novo</button></div>'; });
}
function telaEspera(vencido){
  var bloq = LD.status === 'bloqueado', t;
  if (vencido) t = 'Seu acesso venceu. Fale com a gente para renovar.';
  else if (bloq) t = 'Seu acesso está pausado. Fale com a gente para saber mais.';
  else t = 'Recebemos seu cadastro! Assim que seu acesso for liberado, esta tela abre sozinha o seu painel.';
  var msg = 'Olá! Fiz o cadastro no Meu Lanche. Lanchonete: ' + LD.nome + ' • E-mail: ' + (LD.email || '') + '. Pode liberar meu acesso?';
  $('raiz').innerHTML = '<div class="wrap"><div class="hero"><div class="ico">' + (vencido || bloq ? '🔒' : '⏳') + '</div><h2>' + esc(LD.nome) + '</h2><p>' + t + '</p></div>' +
    '<div class="card"><a class="bt btz full" href="' + zapLink(ZAP_ADMIN, msg) + '" target="_blank">💬 Pedir liberação no WhatsApp</a><p></p><button class="bt3 full" onclick="au.signOut()">Sair</button></div></div>';
}

/* ---------- painel ---------- */
function iniciaPainel(){
  db.collection('ml_config').doc('geral').get().then(function(d){ CFG = d.exists ? d.data() : {}; }).catch(function(){ CFG = {}; });
  unI = db.collection('ml_lojas').doc(U.uid).collection('itens').onSnapshot(function(s){
    IT = s.docs.map(function(d){ var x = d.data(); x.id = d.id; return x; });
    IT.sort(function(a, b){ var co = LD.catOrdem || [], ia = co.indexOf(a.cat), ib = co.indexOf(b.cat); if (ia < 0) ia = 999; if (ib < 0) ib = 999; return ia - ib || (a.cat || '').localeCompare(b.cat || '') || (a.ordem || 0) - (b.ordem || 0); });
    if (ABA === 'cardapio') desenhaAba();
  });
  unP = db.collection('ml_pedidos').where('lojaId', '==', U.uid).onSnapshot(function(s){
    PEDS = s.docs.map(function(d){ var x = d.data(); x.id = d.id; x.t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : Date.now(); return x; });
    PEDS.sort(function(a, b){ return b.t - a.t; });
    var novos = 0;
    if (pedVistos){ PEDS.forEach(function(p){ if (!pedVistos[p.id]){ novos++; p._novo = true; } }); }
    pedVistos = {}; PEDS.forEach(function(p){ pedVistos[p.id] = 1; });
    if (novos){ bip(); toast('🔔 Novo pedido chegou!', 4000); }
    atualizaContador(); if (ABA === 'pedidos') desenhaAba();
  }, function(e){ if (ABA === 'pedidos') $('conteudo').innerHTML = '<div class="aviso no">Não deu para ler os pedidos (' + esc(e.code) + ').</div>'; });
  desenhaPainel();
}
function bip(){ try { var c = new (window.AudioContext || window.webkitAudioContext)(); [0, .18, .36].forEach(function(t, i){ var o = c.createOscillator(), g = c.createGain(); o.frequency.value = [880, 1175, 1568][i]; g.gain.setValueAtTime(.25, c.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + t + .16); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + .17); }); } catch (e) {} if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
var ABAS = [['pedidos','🧾 Pedidos'],['cardapio','🍔 Cardápio'],['loja','🎨 Loja'],['entrega','🛵 Entrega'],['pagamento','💳 Pagamento'],['horario','🕒 Horário'],['mensagens','💬 Mensagens']];
function desenhaPainel(){
  var h = '<div class="topo" id="topo"></div><div class="abas" id="abas">';
  ABAS.forEach(function(a){ h += '<button id="ab_' + a[0] + '" onclick="vaiAba(\'' + a[0] + '\')">' + a[1] + '</button>'; });
  h += '</div><div class="wrap" id="conteudo"></div>';
  $('raiz').innerHTML = h; atualizaTopo(); vaiAba(ABA);
}
function atualizaTopo(){
  if (!$('topo')) return;
  var link = linkLoja(LD.slug);
  $('topo').innerHTML = '<div class="lin">' + (LD.logo ? '<img class="logo" src="' + LD.logo + '">' : '<img class="logo" src="icon-192.png">') + '<div style="flex:1;min-width:0"><h1>' + esc(LD.nome) + '</h1><small>' + (abertoAgora(LD.horario) ? '🟢 Aberto agora' : '🔴 Fechado agora') + '</small></div><button class="mini bt3" onclick="if(confirm(\'Sair da conta?\'))au.signOut()">Sair</button></div>' +
    '<div style="max-width:760px;margin:12px auto 0"><div class="linkbox" style="background:rgba(255,255,255,.95);color:#222">🔗 <span style="flex:1">' + esc(link) + '</span></div>' +
    '<div class="row" style="margin-top:8px"><button class="mini bt3" onclick="copiar(linkLoja(LD.slug),\'Link copiado!\')">📋 Copiar link</button><button class="mini btz" onclick="abreZap(\'\',\'Peça seu lanche aqui: \'+linkLoja(LD.slug))">📲 Compartilhar</button><a class="bt mini bt3" href="' + esc(link) + '" target="_blank">👀 Ver loja</a></div></div>';
}
function atualizaContador(){ var b = $('ab_pedidos'); if (!b) return; var n = PEDS.filter(function(p){ return p.status === 'novo'; }).length; b.textContent = '🧾 Pedidos' + (n ? ' (' + n + ')' : ''); }
function vaiAba(a){ ABA = a; ABAS.forEach(function(x){ var b = $('ab_' + x[0]); if (b) b.className = x[0] === a ? 'on' : ''; }); atualizaContador(); desenhaAba(); }
function desenhaAba(){
  var c = $('conteudo'); if (!c) return;
  ({pedidos: abaPedidos, cardapio: abaCardapio, loja: abaLoja, entrega: abaEntrega, pagamento: abaPagamento, horario: abaHorario, mensagens: abaMensagens}[ABA] || abaPedidos)(c);
}
function salva(campos, msg){ return db.collection('ml_lojas').doc(U.uid).update(campos).then(function(){ toast(msg || 'Salvo! ✅'); }, function(e){ toast('Não salvou: ' + (e.code || e.message), 4000); }); }

/* ---------- pedidos ---------- */
var filtroPed = 'hoje';
var STATUS = {novo:['Novo','esp'], recebido:['Recebido','ok'], preparo:['Em preparo','esp'], saiu:['Saiu p/ entrega','ok'], pronto:['Pronto p/ retirar','ok'], entregue:['Finalizado','']};
function abaPedidos(c){
  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  var lista = PEDS.filter(function(p){ return filtroPed === 'todos' || p.t >= hoje.getTime(); }).slice(0, 150);
  var totDia = PEDS.filter(function(p){ return p.t >= hoje.getTime(); }).reduce(function(s, p){ return s + (p.total || 0); }, 0);
  var h = '<div class="row"><div class="card" style="margin:6px 0;text-align:center"><b style="font-size:22px">' + PEDS.filter(function(p){ return p.t >= hoje.getTime(); }).length + '</b><div class="sub">pedidos hoje</div></div><div class="card" style="margin:6px 0;text-align:center"><b style="font-size:22px">' + brl(totDia) + '</b><div class="sub">vendido hoje</div></div></div>';
  h += '<div class="opc" style="margin:6px 0">' + ['hoje', 'todos'].map(function(f){ return '<label class="' + (filtroPed === f ? 'on' : '') + '" onclick="filtroPed=\'' + f + '\';desenhaAba()">' + (f === 'hoje' ? 'Hoje' : 'Todos') + '</label>'; }).join('') + '</div>';
  if (!lista.length) h += '<div class="vazio"><div style="font-size:50px">🧾</div>Nenhum pedido ' + (filtroPed === 'hoje' ? 'hoje ' : '') + 'ainda.<br>Compartilhe o link da sua loja no WhatsApp! 😉</div>';
  lista.forEach(function(p, i){
    var c2 = p.cliente || {}, st = STATUS[p.status] || [p.status, ''], d = new Date(p.t);
    h += '<div class="card ped' + (p._novo ? ' novo' : '') + '"><div class="row" style="justify-content:space-between"><b style="flex:0 0 auto">Nº ' + esc(p.numero) + '</b><span class="tag ' + st[1] + '" style="flex:0 0 auto">' + st[0] + '</span><span class="sub" style="flex:0 0 auto">' + d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) + '</span></div>' +
      '<div style="margin:6px 0"><b>' + esc(c2.nome) + '</b> • ' + esc(c2.tel) + '</div><div class="sub">' +
      (p.itens || []).map(function(it){ return it.qtd + 'x ' + esc(it.nome); }).join('<br>') + (p.obs ? '<br>📝 ' + esc(p.obs) : '') + '</div>' +
      '<div style="margin:6px 0">' + (p.entrega === 'entrega' ? '🛵 ' + esc([c2.rua, c2.num].filter(Boolean).join(', ')) + (c2.bairro ? ' — ' + esc(c2.bairro) : '') + (c2.ref ? '<br><span class="sub">Ref.: ' + esc(c2.ref) + '</span>' : '') : '🛍️ Retirada no local') + '</div>' +
      '<div>' + ({dinheiro: '💵 Dinheiro' + (p.pag && p.pag.troco ? ' (troco p/ ' + brl(p.pag.troco) + ')' : ''), cartao: '💳 Cartão', pix: '💠 Pix'}[p.pag && p.pag.tipo] || '') + ' • <b style="color:var(--p);font-size:18px">' + brl(p.total) + '</b>' + (p.entrega === 'entrega' ? ' <span class="sub">(entrega ' + (p.taxaCombinar ? 'a combinar' : brl(p.taxa)) + ')</span>' : '') + '</div>' +
      '<div class="msgs">' + (LD.msgs || MSGS_PADRAO).map(function(m, mi){ return '<button class="mini btz" onclick="mandaMsg(' + i + ',' + mi + ')">' + esc(m.nome) + '</button>'; }).join('') + '</div>' +
      '<div class="row" style="margin-top:8px"><button class="mini bt3" onclick="copiaPed(' + i + ')">📋 Copiar</button>' + (c2.lat != null ? '<a class="bt mini bt3" target="_blank" href="https://maps.google.com/?q=' + c2.lat + ',' + c2.lng + '">🗺️ Mapa</a>' : '') +
      '<select class="mini" style="padding:8px" onchange="mudaStatus(' + i + ',this.value)">' + Object.keys(STATUS).map(function(k){ return '<option value="' + k + '"' + (p.status === k ? ' selected' : '') + '>' + STATUS[k][0] + '</option>'; }).join('') + '</select><button class="mini btr" style="flex:0 0 auto" onclick="apagaPed(' + i + ')">🗑️</button></div></div>';
  });
  c.innerHTML = h; LISTA_PED = lista;
}
var LISTA_PED = [];
var MSG_STATUS = {recebido: 'recebido', preparo: 'preparo', saiu: 'saiu', pronto: 'pronto', obrigado: 'entregue'};
function mandaMsg(i, mi){
  var p = LISTA_PED[i], m = (LD.msgs || MSGS_PADRAO)[mi]; if (!p || !m) return;
  abreZap((p.cliente || {}).tel, montaMsg(m.txt, p, LD));
  var ns = MSG_STATUS[m.id]; if (ns && p.status !== ns) db.collection('ml_pedidos').doc(p.id).update({status: ns}).catch(function(){});
}
function mudaStatus(i, v){ var p = LISTA_PED[i]; if (p) db.collection('ml_pedidos').doc(p.id).update({status: v}).then(function(){ toast('Situação atualizada'); }, function(e){ toast('Erro: ' + e.code); }); }
function copiaPed(i){ var p = LISTA_PED[i]; if (p) copiar(textoPedido(p, LD), 'Pedido copiado!'); }
function apagaPed(i){ var p = LISTA_PED[i]; if (p && confirm('Apagar o pedido nº ' + p.numero + '?')) db.collection('ml_pedidos').doc(p.id).delete().catch(function(e){ toast('Erro: ' + e.code); }); }

/* ---------- cardápio ---------- */
function abaCardapio(c){
  var h = '<div class="card" style="background:linear-gradient(135deg,var(--p),var(--p2));color:#fff;border:0"><h2>📸 Importar cardápio por foto</h2><p style="margin:4px 0 10px">Tire uma foto do seu cardápio de papel e o app monta tudo sozinho: nomes, preços e até as fotos dos lanches.</p>' +
    '<div class="row"><button class="bt3" onclick="importa(true)">📷 Tirar foto</button><button class="bt3" onclick="importa(false)">🖼️ Da galeria</button></div></div>';
  h += '<button class="bt2 full" onclick="editaItem(null)">➕ Adicionar lanche</button>';
  if (!IT.length) h += '<div class="vazio">Seu cardápio está vazio. Importe pela foto ou adicione os lanches um por um.</div>';
  var cat = null;
  IT.forEach(function(i, k){
    if ((i.cat || 'Cardápio') !== cat){
      cat = i.cat || 'Cardápio';
      var ci = catsDono().indexOf(cat);
      h += (k ? '</div>' : '') + '<div class="card"><div class="row" style="justify-content:space-between"><h3 style="flex:1">' + esc(cat) + '</h3><button class="mini bt3" style="flex:0 0 auto" onclick="moveCat(' + ci + ',-1)">⬆️</button><button class="mini bt3" style="flex:0 0 auto" onclick="moveCat(' + ci + ',1)">⬇️</button></div>';
    }
    h += '<div class="itemadm" style="' + (i.ativo === false ? 'opacity:.5' : '') + '">' + (i.foto ? '<img src="' + i.foto + '">' : '<div class="semft">🍔</div>') +
      '<div class="tx"><b>' + esc(i.nome) + '</b><span class="sub">' + brl(i.preco) + (i.ativo === false ? ' • esgotado' : '') + '</span></div>' +
      '<button class="mini bt3" onclick="editaItem(\'' + i.id + '\')">✏️</button></div>';
  });
  if (IT.length) h += '</div>';
  c.innerHTML = h;
}
function catsDono(){ var c = []; (LD.catOrdem || []).forEach(function(x){ if (c.indexOf(x) < 0) c.push(x); }); IT.forEach(function(i){ var k = i.cat || 'Cardápio'; if (c.indexOf(k) < 0) c.push(k); }); return c; }
function moveCat(i, d){
  var c = catsDono(), j = i + d; if (i < 0 || j < 0 || j >= c.length) return;
  var t = c[i]; c[i] = c[j]; c[j] = t; LD.catOrdem = c; salva({catOrdem: c}, 'Ordem salva'); 
  IT.sort(function(a, b){ return c.indexOf(a.cat || 'Cardápio') - c.indexOf(b.cat || 'Cardápio') || (a.ordem || 0) - (b.ordem || 0); }); desenhaAba();
}
function pedeFoto(cam, cb){
  fotoCb = cb; var inp = $(cam ? 'arqCam' : 'arqGal'); inp.value = '';
  inp.onchange = function(){ var f = inp.files[0]; if (!f) return; toast('Melhorando a foto…'); fotoDeArquivo(f, 600).then(function(d){ fotoCb && fotoCb(d); }, function(){ toast('Não deu para abrir essa foto.'); }); };
  inp.click();
}
var EDIT = null;
function editaItem(id){
  var i = id ? IT.filter(function(x){ return x.id === id; })[0] : null;
  EDIT = i ? JSON.parse(JSON.stringify(i)) : {nome: '', desc: '', preco: '', cat: catsDono()[0] || 'Lanches', foto: '', ativo: true};
  desenhaEdit();
}
function desenhaEdit(){
  var e = EDIT, cs = catsDono();
  var h = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha"><button class="fecha" onclick="fechaModal()">✕</button><h2>' + (e.id ? 'Editar lanche' : 'Novo lanche') + '</h2>' +
    '<div style="text-align:center">' + (e.foto ? '<img src="' + e.foto + '" style="width:200px;height:200px;object-fit:cover;border-radius:18px">' : '<div style="width:200px;height:200px;border-radius:18px;margin:auto;background:var(--linha);display:flex;align-items:center;justify-content:center;font-size:70px">🍔</div>') + '</div>' +
    '<div class="row" style="margin-top:8px"><button class="mini bt3" onclick="lerEdit();pedeFoto(true,function(d){EDIT.foto=d;desenhaEdit()})">📷 Câmera</button><button class="mini bt3" onclick="lerEdit();pedeFoto(false,function(d){EDIT.foto=d;desenhaEdit()})">🖼️ Galeria</button>' + (e.foto ? '<button class="mini bt3" onclick="lerEdit();EDIT.foto=\'\';desenhaEdit()">Tirar foto</button>' : '') + '</div>' +
    '<label>Nome</label><input id="eNome" value="' + esc(e.nome) + '" placeholder="Ex.: X-Tudo">' +
    '<label>Descrição</label><textarea id="eDesc" placeholder="Ex.: pão, hambúrguer, ovo, bacon, queijo, salada">' + esc(e.desc) + '</textarea>' +
    '<div class="row"><div><label>Preço (R$)</label><input id="ePreco" inputmode="decimal" value="' + (e.preco !== '' ? String(e.preco).replace('.', ',') : '') + '" placeholder="0,00"></div>' +
    '<div><label>Categoria</label><input id="eCat" list="listaCats" value="' + esc(e.cat) + '"><datalist id="listaCats">' + cs.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></div></div>' +
    '<div class="switch"><span>Disponível para venda</span><input type="checkbox" id="eAtivo"' + (e.ativo !== false ? ' checked' : '') + '></div>' +
    '<button class="full" style="margin-top:14px" id="eSalva" onclick="salvaItem()">Salvar</button>' + (e.id ? '<p></p><button class="btr full" onclick="apagaItem()">Apagar este lanche</button>' : '') + '</div></div>';
  $('modal').innerHTML = h;
}
function lerEdit(){ if (!$('eNome')) return; EDIT.nome = $('eNome').value.trim(); EDIT.desc = $('eDesc').value.trim(); EDIT.preco = $('ePreco').value; EDIT.cat = $('eCat').value.trim() || 'Cardápio'; EDIT.ativo = $('eAtivo').checked; }
function salvaItem(){
  lerEdit(); var e = EDIT; if (!e.nome) return toast('Digite o nome do lanche.');
  var d = {nome: e.nome, desc: e.desc, preco: num(e.preco), cat: e.cat, foto: e.foto || '', ativo: e.ativo};
  $('eSalva').disabled = true;
  var ref = db.collection('ml_lojas').doc(U.uid).collection('itens');
  var pr = e.id ? ref.doc(e.id).update(d) : (d.ordem = Date.now(), ref.add(d));
  pr.then(function(){ garanteCat(d.cat); fechaModal(); toast('Lanche salvo! ✅'); }, function(x){ $('eSalva').disabled = false; toast('Não salvou: ' + (x.code || x.message), 4000); });
}
function garanteCat(c){ var co = (LD.catOrdem || []).slice(); if (co.indexOf(c) < 0){ co.push(c); salva({catOrdem: co}, 'Salvo! ✅'); } }
function apagaItem(){ if (!confirm('Apagar ' + EDIT.nome + '?')) return; db.collection('ml_lojas').doc(U.uid).collection('itens').doc(EDIT.id).delete().then(function(){ fechaModal(); toast('Apagado'); }); }

/* ---------- importar por foto (Gemini) ---------- */
var PROMPT_CARD = 'Você recebe a foto de um cardápio de lanchonete brasileira. Extraia TODOS os itens à venda. ' +
  'Responda SOMENTE em JSON no formato {"itens":[{"categoria":"","nome":"","descricao":"","preco":0,"box_2d":null}]}. ' +
  'Regras: "categoria" é o título da seção onde o item está (ex.: Lanches, Hambúrgueres, Bebidas, Porções, Sucos); se não houver, use "Lanches". ' +
  '"nome" com as palavras como estão no cardápio (corrija só erros óbvios de leitura). "descricao" com os ingredientes/detalhes escritos (ou ""). ' +
  '"preco" é número em reais com ponto decimal (ex.: 18.5); se o item tiver vários tamanhos/preços, crie um item para cada tamanho, com o tamanho no nome. ' +
  '"box_2d": se existir uma FOTO/IMAGEM desse lanche específico no cardápio, dê a caixa da foto como [ymin, xmin, ymax, xmax] normalizada de 0 a 1000; se não houver foto dele, use null. ' +
  'Não invente itens nem preços que não estão na imagem.';
function importa(cam){
  if (CFG === null){ toast('Carregando… tente de novo em 2 segundos.'); return; }
  if (!CFG.geminiKey){
    $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" style="text-align:center"><div style="font-size:50px">🤖</div><h2>Leitura por foto ainda não ativada</h2><p>A leitura automática do cardápio ainda não foi ligada pelo administrador. Enquanto isso, você pode cadastrar os lanches um por um — é rapidinho!</p><button class="full" onclick="fechaModal();editaItem(null)">➕ Adicionar lanche</button><p></p><a class="bt btz full" target="_blank" href="' + zapLink(ZAP_ADMIN, 'Olá! Quero usar a leitura do cardápio por foto no Meu Lanche (' + LD.nome + ').') + '">Avisar o administrador</a></div></div>';
    return;
  }
  var inp = $(cam ? 'arqCardCam' : 'arqCard'); inp.value = '';
  inp.onchange = function(){ var fs = Array.prototype.slice.call(inp.files || []); if (fs.length) processaFotos(fs); };
  inp.click();
}
function telaProg(t, pct){
  $('modal').innerHTML = '<div class="fundo"><div class="folha" style="text-align:center"><div class="hero" style="padding:10px"><div class="ico">🤖</div></div><h2>Lendo seu cardápio…</h2><p id="pTxt">' + esc(t) + '</p><div class="prog"><i id="pBar" style="width:' + (pct || 5) + '%"></i></div><p class="sub">Pode levar até 1 minuto por foto. Não feche o app.</p></div></div>';
}
function prog(t, pct){ if ($('pTxt')) $('pTxt').textContent = t; if ($('pBar')) $('pBar').style.width = pct + '%'; }
function processaFotos(fs){
  var novos = [], k = 0;
  telaProg('Preparando a foto 1 de ' + fs.length + '…', 5);
  function prox(){
    if (k >= fs.length) return fimImport(novos);
    var f = fs[k], n = k + 1; k++;
    prog('Preparando a foto ' + n + ' de ' + fs.length + '…', Math.round((n - 1) / fs.length * 100) + 5);
    arquivoParaCanvas(f, 2000).then(function(cv){
      prog('Lendo a foto ' + n + ' de ' + fs.length + ' (nomes, preços e fotos)…', Math.round((n - .6) / fs.length * 100));
      var b64 = cv.toDataURL('image/jpeg', 0.88).split(',')[1];
      return chamaGemini(b64).then(function(r){
        prog('Recortando e melhorando as fotos dos lanches…', Math.round((n - .2) / fs.length * 100));
        (r.itens || []).forEach(function(it){
          if (!it || !it.nome) return;
          var foto = '';
          var b = it.box_2d;
          if (b && b.length === 4 && b.every(function(v){ return typeof v === 'number'; })){
            var y0 = b[0] / 1000 * cv.height, x0 = b[1] / 1000 * cv.width, y1 = b[2] / 1000 * cv.height, x1 = b[3] / 1000 * cv.width;
            var w = x1 - x0, h = y1 - y0;
            if (w > 30 && h > 30 && w < cv.width * 0.95 && h < cv.height * 0.95){
              var px = w * 0.02, py = h * 0.02;
              x0 = Math.max(0, x0 - px); y0 = Math.max(0, y0 - py); w = Math.min(cv.width - x0, w + 2 * px); h = Math.min(cv.height - y0, h + 2 * py);
              try { foto = melhoraFoto(cv, x0, y0, w, h, 600); } catch (e) { foto = ''; }
            }
          }
          novos.push({ok: true, nome: String(it.nome).trim(), desc: String(it.descricao || '').trim(), preco: num(it.preco), cat: String(it.categoria || 'Lanches').trim(), foto: foto});
        });
      });
    }).then(prox, function(e){
      var m = e && e.message || String(e);
      if (!confirm('Não deu para ler a foto ' + n + ': ' + m + '\n\nContinuar com as outras?')) return fimImport(novos);
      prox();
    });
  }
  prox();
}
function chamaGemini(b64){
  var mods = [];
  if (CFG.geminiModelo) mods.push(CFG.geminiModelo);
  ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'].forEach(function(m){ if (mods.indexOf(m) < 0) mods.push(m); });
  var body = JSON.stringify({contents: [{parts: [{inline_data: {mime_type: 'image/jpeg', data: b64}}, {text: PROMPT_CARD}]}], generationConfig: {responseMimeType: 'application/json', temperature: 0.1}});
  var i = 0;
  function tenta(){
    var m = mods[i++];
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent?key=' + encodeURIComponent(CFG.geminiKey), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: body})
      .then(function(r){ return r.json().then(function(j){ return {st: r.status, j: j}; }); })
      .then(function(x){
        if (x.st === 404 || (x.st === 400 && /not found|not supported/i.test(JSON.stringify(x.j)))){ if (i < mods.length) return tenta(); throw new Error('Modelo de leitura indisponível.'); }
        if (x.st === 429) throw new Error('Muitas leituras seguidas. Espere 1 minuto e tente de novo.');
        if (x.st === 400 && /API key|API_KEY/i.test(JSON.stringify(x.j))) throw new Error('A chave de leitura está errada. Avise o administrador.');
        if (x.st === 403) throw new Error('A chave de leitura não tem permissão. Avise o administrador.');
        if (x.st >= 500 && i < mods.length) return tenta();
        if (x.st !== 200) throw new Error('Erro ' + x.st + ' na leitura.');
        var t = '';
        try { t = x.j.candidates[0].content.parts.map(function(p){ return p.text || ''; }).join(''); } catch (e) { throw new Error('A leitura voltou vazia. Tente uma foto mais nítida.'); }
        t = t.replace(/^```(json)?/i, '').replace(/```\s*$/, '').trim();
        var o; try { o = JSON.parse(t); } catch (e) { var a = t.indexOf('{'), z = t.lastIndexOf('}'); o = JSON.parse(t.slice(a, z + 1)); }
        if (Array.isArray(o)) o = {itens: o};
        return o;
      });
  }
  return tenta();
}
function fimImport(novos){
  REV = REV.concat(novos);
  if (!REV.length){ $('modal').innerHTML = '<div class="fundo"><div class="folha" style="text-align:center"><h2>Não achamos lanches na foto 😕</h2><p>Tente outra foto, bem de frente, com boa luz e sem cortar as bordas.</p><button class="full" onclick="fechaModal()">OK</button></div></div>'; return; }
  desenhaRev();
}
function desenhaRev(){
  var n = REV.filter(function(r){ return r.ok; }).length, comFoto = REV.filter(function(r){ return r.foto; }).length;
  var h = '<div class="fundo"><div class="folha"><button class="fecha" onclick="if(confirm(\'Descartar a leitura?\')){REV=[];fechaModal()}">✕</button><h2>Confira seu cardápio</h2>' +
    '<p class="sub">Achamos ' + REV.length + ' itens' + (comFoto ? ' (' + comFoto + ' com foto)' : '') + '. Corrija o que precisar, desmarque o que não quiser e toque em Salvar. Toque na foto para trocar.</p>';
  REV.forEach(function(r, i){
    h += '<div class="rev" style="' + (r.ok ? '' : 'opacity:.45') + '"><input type="checkbox"' + (r.ok ? ' checked' : '') + ' onchange="lerRev();REV[' + i + '].ok=this.checked;desenhaRev()">' +
      (r.foto ? '<img src="' + r.foto + '" onclick="fotoRev(' + i + ')">' : '<div class="semft" onclick="fotoRev(' + i + ')">📷</div>') +
      '<div class="tx"><input id="rN' + i + '" value="' + esc(r.nome) + '" placeholder="Nome"><textarea id="rD' + i + '" placeholder="Descrição">' + esc(r.desc) + '</textarea>' +
      '<div class="row"><input id="rP' + i + '" inputmode="decimal" value="' + String(r.preco).replace('.', ',') + '" placeholder="Preço"><input id="rC' + i + '" value="' + esc(r.cat) + '" placeholder="Categoria"></div></div></div>';
  });
  h += '<div class="row" style="margin-top:12px;position:sticky;bottom:0;background:var(--bg);padding:8px 0"><button class="bt3" onclick="lerRev();importa(false)">➕ Mais fotos</button><button id="rSalva" onclick="salvaRev()" style="flex:2">Salvar ' + n + ' itens</button></div></div></div>';
  var y = document.querySelector('.folha') ? document.querySelector('.folha').scrollTop : 0;
  $('modal').innerHTML = h; document.querySelector('.folha').scrollTop = y;
}
function lerRev(){ REV.forEach(function(r, i){ if (!$('rN' + i)) return; r.nome = $('rN' + i).value.trim(); r.desc = $('rD' + i).value.trim(); r.preco = num($('rP' + i).value); r.cat = $('rC' + i).value.trim() || 'Lanches'; }); }
function fotoRev(i){
  lerRev();
  var esc2 = confirm('OK = tirar foto com a câmera\nCancelar = escolher da galeria');
  pedeFoto(esc2, function(d){ REV[i].foto = d; desenhaRev(); });
}
function salvaRev(){
  lerRev();
  var sel = REV.filter(function(r){ return r.ok && r.nome; }); if (!sel.length) return toast('Marque pelo menos um item.');
  $('rSalva').disabled = true; $('rSalva').textContent = 'Salvando…';
  var ref = db.collection('ml_lojas').doc(U.uid).collection('itens'), base = Date.now(), k = 0, erros = 0;
  var co = (LD.catOrdem || []).slice(); sel.forEach(function(r){ if (co.indexOf(r.cat) < 0) co.push(r.cat); });
  function prox(){
    if (k >= sel.length){
      salva({catOrdem: co}, erros ? ('Salvo, mas ' + erros + ' itens deram erro.') : (sel.length + ' itens salvos! 🎉'));
      REV = []; fechaModal(); vaiAba('cardapio'); return;
    }
    var r = sel[k], o = k; k++; $('rSalva').textContent = 'Salvando ' + k + ' de ' + sel.length + '…';
    ref.add({nome: r.nome, desc: r.desc, preco: r.preco, cat: r.cat, foto: r.foto || '', ativo: true, ordem: base + o}).then(prox, function(){ erros++; prox(); });
  }
  prox();
}

/* ---------- loja / layout ---------- */
function abaLoja(c){
  var h = '<div class="card"><h3>Nome e logo</h3><div style="text-align:center">' + (LD.logo ? '<img src="' + LD.logo + '" style="width:110px;height:110px;border-radius:24px;object-fit:cover">' : '<div style="font-size:70px">🍔</div>') + '</div>' +
    '<div class="row"><button class="mini bt3" onclick="pedeLogo(true)">📷 Câmera</button><button class="mini bt3" onclick="pedeLogo(false)">🖼️ Galeria</button>' + (LD.logo ? '<button class="mini bt3" onclick="salva({logo:\'\'})">Tirar logo</button>' : '') + '</div>' +
    '<label>Nome da lanchonete</label><input id="sNome" value="' + esc(LD.nome) + '">' +
    '<label>Nome no link</label><input id="sSlug" value="' + esc(LD.slug) + '"><p class="sub">Seu link: ' + esc(BASE_URL) + '?l=<b>' + esc(LD.slug) + '</b></p>' +
    '<label>WhatsApp que recebe os pedidos</label><input id="sZap" type="tel" value="' + esc(LD.zap) + '">' +
    '<label>Aviso no topo da loja (opcional)</label><input id="sAviso" value="' + esc(LD.aviso || '') + '" placeholder="Ex.: Promoção: 2 X-Burguer por R$ 25!">' +
    '<label>Pedido mínimo (R$, 0 = sem mínimo)</label><input id="sMin" inputmode="decimal" value="' + String(LD.pedMin || 0).replace('.', ',') + '">' +
    '<button class="full" style="margin-top:12px" onclick="salvaLoja()">Salvar</button></div>';
  h += '<div class="card"><h3>Cores</h3><div class="temas">' + Object.keys(TEMAS).map(function(k){ var t = TEMAS[k]; return '<button class="' + (LD.tema === k ? 'on' : '') + '" onclick="salva({tema:\'' + k + '\'},\'Cores trocadas!\')"><i style="background:linear-gradient(135deg,' + t.p + ',' + t.p2 + ')"></i>' + t.nome + '</button>'; }).join('') + '</div>' +
    '<h3 style="margin-top:14px">Jeito do cardápio</h3><div class="opc"><label class="' + (LD.layout !== 'lista' ? 'on' : '') + '" onclick="salva({layout:\'grade\'})">🔲 Fotos grandes<br>(2 por linha)</label><label class="' + (LD.layout === 'lista' ? 'on' : '') + '" onclick="salva({layout:\'lista\'})">📃 Lista<br>(1 por linha)</label></div></div>';
  h += '<div class="card"><h3>Endereço e localização</h3><label>Endereço da lanchonete</label><input id="sEnd" value="' + esc(LD.endereco || '') + '" placeholder="Rua, número, bairro">' +
    '<p class="sub">A localização serve para calcular a distância e a taxa de entrega.</p>' +
    (LD.lat != null ? '<div class="aviso ok">📍 Localização salva. <a target="_blank" href="https://maps.google.com/?q=' + LD.lat + ',' + LD.lng + '">Ver no mapa</a></div>' : '<div class="aviso">Ainda sem localização. Sem ela a taxa de entrega fica "a combinar".</div>') +
    '<button class="bt2 full" onclick="localLoja()">📍 Estou na lanchonete: usar minha localização</button>' +
    '<label>ou cole o link do Google Maps da lanchonete</label><div class="row"><input id="sMaps" placeholder="https://maps.google.com/..."><button class="mini" style="flex:0 0 auto" onclick="linkMaps()">Usar</button></div>' +
    '<button class="full" style="margin-top:12px" onclick="salva({endereco:$(\'sEnd\').value.trim()})">Salvar endereço</button></div>';
  c.innerHTML = h;
}
function pedeLogo(cam){
  var inp = $(cam ? 'arqCam' : 'arqGal'); inp.value = '';
  inp.onchange = function(){ var f = inp.files[0]; if (!f) return; toast('Ajustando o logo…'); logoDeArquivo(f).then(function(d){ salva({logo: d}, 'Logo salvo!'); }); };
  inp.click();
}
function salvaLoja(){
  var nome = $('sNome').value.trim(), slug = slugify($('sSlug').value), zap = soNum($('sZap').value);
  if (!nome) return toast('Digite o nome.'); if (zap.length < 10) return toast('WhatsApp com DDD, por favor.');
  var campos = {nome: nome, zap: zap, aviso: $('sAviso').value.trim(), pedMin: num($('sMin').value)};
  if (slug === LD.slug) return salva(campos);
  db.collection('ml_lojas').where('slug', '==', slug).limit(1).get().then(function(q){
    if (!q.empty && q.docs[0].id !== U.uid){ toast('Esse nome de link já está em uso. Escolha outro.', 4000); return; }
    if (!confirm('Trocar o link da loja? O link antigo vai parar de funcionar.')) return;
    campos.slug = slug; salva(campos).then(atualizaTopo);
  });
}
function localLoja(){
  if (!navigator.geolocation) return toast('Este celular não permite pegar a localização.');
  toast('Pegando a localização…', 6000);
  navigator.geolocation.getCurrentPosition(function(p){ salva({lat: p.coords.latitude, lng: p.coords.longitude}, 'Localização salva! 📍'); }, function(){ toast('Não deu. Ative o GPS e permita o acesso.', 4000); }, {enableHighAccuracy: true, timeout: 20000});
}
function linkMaps(){ var c2 = coordsDoLink($('sMaps').value); if (!c2) return toast('Não achei a localização nesse link. Use o link completo do Maps ou o botão de localização.', 5000); salva({lat: c2.lat, lng: c2.lng}, 'Localização salva! 📍'); }

/* ---------- entrega ---------- */
function abaEntrega(c){
  var f = (LD.faixas || []).slice().sort(function(a, b){ return a.km - b.km; });
  var h = '<div class="card"><h3>Taxa de entrega por distância</h3><p class="sub">Ex.: até 2 km = R$ 3,00. Quem estiver mais longe que a última faixa não consegue pedir entrega.</p><div id="fx">';
  f.forEach(function(x, i){ h += '<div class="faixa"><span>até</span><input id="fk' + i + '" inputmode="decimal" value="' + String(x.km).replace('.', ',') + '"><span>km =</span><span>R$</span><input id="fv' + i + '" inputmode="decimal" value="' + String(x.valor).replace('.', ',') + '"><button class="mini btr" style="flex:0 0 auto" onclick="tiraFaixa(' + i + ')">✕</button></div>'; });
  h += '</div><button class="bt2 full" onclick="addFaixa()">➕ Adicionar faixa</button>' +
    '<div class="switch"><span>Aceito retirada no local</span><input type="checkbox" id="eRet"' + (LD.retirada !== false ? ' checked' : '') + '></div>' +
    '<div class="switch"><span>Não faço entrega (só retirada)</span><input type="checkbox" id="eSem"' + (LD.semEntrega ? ' checked' : '') + '></div>' +
    '<button class="full" style="margin-top:12px" onclick="salvaFaixas()">Salvar</button>' +
    (LD.lat == null ? '<div class="aviso">Falta salvar a localização da lanchonete (aba Loja) para calcular a distância.</div>' : '') +
    '<p class="sub">A distância é medida em linha reta do cliente até a lanchonete.</p></div>';
  c.innerHTML = h; FX = f;
}
var FX = [];
function lerFaixas(){ FX = FX.map(function(x, i){ return {km: num($('fk' + i).value), valor: num($('fv' + i).value)}; }); }
function addFaixa(){ lerFaixas(); var u = FX[FX.length - 1]; FX.push({km: u ? u.km + 1 : 2, valor: u ? u.valor + 2 : 3}); LD.faixas = FX; abaEntrega($('conteudo')); }
function tiraFaixa(i){ lerFaixas(); FX.splice(i, 1); LD.faixas = FX; abaEntrega($('conteudo')); }
function salvaFaixas(){ lerFaixas(); var f = FX.filter(function(x){ return x.km > 0; }).sort(function(a, b){ return a.km - b.km; }); salva({faixas: f, retirada: $('eRet').checked, semEntrega: $('eSem').checked}); }

/* ---------- pagamento ---------- */
function abaPagamento(c){
  var p = LD.pag || {};
  var h = '<div class="card"><h3>Formas de pagamento</h3><p class="sub">O cliente escolhe e paga direto com você.</p>' +
    '<div class="switch"><span>💵 Dinheiro (pergunta o troco)</span><input type="checkbox" id="pDin"' + (p.dinheiro ? ' checked' : '') + '></div>' +
    '<div class="switch"><span>💳 Cartão na entrega (maquininha)</span><input type="checkbox" id="pCar"' + (p.cartao ? ' checked' : '') + '></div>' +
    '<div class="switch"><span>💠 Pix</span><input type="checkbox" id="pPix"' + (p.pix ? ' checked' : '') + '></div>' +
    '<label>Tipo da chave Pix</label><select id="pTipo">' + ['Celular', 'CPF', 'CNPJ', 'E-mail', 'Chave aleatória'].map(function(t){ return '<option' + (p.pixTipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
    '<label>Chave Pix</label><input id="pChave" value="' + esc(p.pixChave || '') + '">' +
    '<label>Nome de quem recebe</label><input id="pNome" value="' + esc(p.pixNome || '') + '" placeholder="Como aparece no banco">' +
    '<button class="full" style="margin-top:12px" onclick="salvaPag()">Salvar</button></div>';
  c.innerHTML = h;
}
function salvaPag(){
  var p = {dinheiro: $('pDin').checked, cartao: $('pCar').checked, pix: $('pPix').checked, pixTipo: $('pTipo').value, pixChave: $('pChave').value.trim(), pixNome: $('pNome').value.trim()};
  if (!p.dinheiro && !p.cartao && !p.pix) return toast('Deixe pelo menos uma forma de pagamento.');
  if (p.pix && !p.pixChave) return toast('Digite a chave Pix.');
  salva({pag: p});
}

/* ---------- horário ---------- */
function abaHorario(c){
  var hr = LD.horario || horarioPadrao();
  var h = '<div class="card"><h3>Horário de funcionamento</h3><p class="sub">Fora do horário a loja mostra "Fechado" e não aceita pedidos. Se fecha depois da meia-noite, é só colocar, por exemplo, 18:00 até 02:00.</p>';
  [1, 2, 3, 4, 5, 6, 0].forEach(function(d){ var x = hr[d] || {aberto: false, ini: '18:00', fim: '23:00'};
    h += '<div class="dia"><input type="checkbox" id="hA' + d + '"' + (x.aberto ? ' checked' : '') + '><b>' + DIAS[d] + '</b><input type="time" id="hI' + d + '" value="' + x.ini + '"><span>até</span><input type="time" id="hF' + d + '" value="' + x.fim + '"></div>'; });
  h += '<div class="row" style="margin-top:10px"><button class="bt3 mini" onclick="copiaSeg()">Copiar horário de segunda para todos</button></div><button class="full" style="margin-top:12px" onclick="salvaHor()">Salvar</button></div>';
  c.innerHTML = h;
}
function copiaSeg(){ for (var d = 0; d < 7; d++){ if (d === 1) continue; $('hI' + d).value = $('hI1').value; $('hF' + d).value = $('hF1').value; } toast('Copiado. Agora toque em Salvar.'); }
function salvaHor(){ var hr = {}; for (var d = 0; d < 7; d++) hr[d] = {aberto: $('hA' + d).checked, ini: $('hI' + d).value || '00:00', fim: $('hF' + d).value || '23:59'}; salva({horario: hr}).then(atualizaTopo); }

/* ---------- mensagens ---------- */
var MS = [];
function abaMensagens(c){
  MS = JSON.parse(JSON.stringify(LD.msgs || MSGS_PADRAO));
  var h = '<div class="card"><h3>Mensagens prontas</h3><p class="sub">Aparecem como botões em cada pedido e abrem o WhatsApp do cliente com o texto pronto. Use: <b>{nome}</b> (nome do cliente), <b>{total}</b>, <b>{pedido}</b> (número), <b>{loja}</b>, <b>{pix}</b> (sua chave Pix).</p>';
  MS.forEach(function(m, i){ h += '<div style="border-top:1px solid var(--linha);padding-top:8px;margin-top:8px"><div class="row"><input id="mN' + i + '" value="' + esc(m.nome) + '" style="flex:3"><button class="mini btr" style="flex:0 0 auto" onclick="lerMs();MS.splice(' + i + ',1);LD.msgs=MS;abaMensagens($(\'conteudo\'))">✕</button></div><textarea id="mT' + i + '">' + esc(m.txt) + '</textarea></div>'; });
  h += '<button class="bt2 full" style="margin-top:10px" onclick="lerMs();MS.push({id:\'m\'+Date.now(),nome:\'Nova mensagem\',txt:\'Olá, {nome}! \'});LD.msgs=MS;abaMensagens($(\'conteudo\'))">➕ Nova mensagem</button>' +
    '<button class="full" style="margin-top:10px" onclick="lerMs();salva({msgs:MS})">Salvar</button><p></p><button class="bt3 full mini" onclick="if(confirm(\'Voltar às mensagens originais?\'))salva({msgs:MSGS_PADRAO}).then(function(){abaMensagens($(\'conteudo\'))})">Voltar às mensagens originais</button></div>';
  c.innerHTML = h;
}
function lerMs(){ MS.forEach(function(m, i){ if ($('mN' + i)){ m.nome = $('mN' + i).value.trim() || 'Mensagem'; m.txt = $('mT' + i).value; } }); }
