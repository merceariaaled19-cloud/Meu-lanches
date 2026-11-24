/* Meu Lanche Pro — painel do dono */
var U = null, LD = null, IT = [], PEDS = [], ABA = 'pedidos', CFG = null, unL = null, unI = null, unP = null, pedVistos = null, REV = [], fotoCb = null;

function abreDono(){
  aplicaTema('laranja');
  au.onAuthStateChanged(function(u){
    U = u; [unL, unI, unP, unPg].forEach(function(f){ if (f) f(); }); unPg = null; PAGS = []; PLANO_SEL = null; unL = unI = unP = null; LD = null; pedVistos = null;
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
    h += '<p class="sub" style="margin:4px 0">▶️ Vídeo: como cadastrar e configurar</p><video controls preload="none" playsinline poster="videos/capa-cadastro.jpg" src="videos/tutorial-cadastro.mp4?v=2" style="width:100%;border-radius:12px;background:#000;margin-bottom:10px"></video>' +
      '<h2>Cadastre sua lanchonete</h2><p class="sub">Você ganha 7 dias grátis para testar tudo.</p>' +
      '<label>Seu nome</label><input id="lDono" placeholder="Seu nome">' +
      '<label>Nome da lanchonete</label><input id="lNome" placeholder="Ex.: Lanches do Zé">' +
      '<label>WhatsApp da lanchonete</label><input id="lZap" type="tel" placeholder="(92) 99999-9999">' + htmlTipos(TIPOS_SEL);
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
  if (!TIPOS_SEL.length) return ($('lMsg').textContent = 'Marque pelo menos um tipo de lanche que você vende.');
  PEND_CAD = {dono: dono, nome: nome, zap: zap, tipos: TIPOS_SEL.slice()};
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
  if (c){ PEND_CAD = null; return criaLoja(c.dono, c.nome, c.zap, c.tipos); }
  var h = '<div class="wrap"><div class="hero"><div class="ico">🍔</div><h2>Quase lá!</h2><p class="sub">Complete o cadastro da sua lanchonete.</p></div><div class="card">' +
    '<label>Seu nome</label><input id="lDono" value="' + esc(U.displayName || '') + '">' +
    '<label>Nome da lanchonete</label><input id="lNome" placeholder="Ex.: Lanches do Zé">' +
    '<label>WhatsApp da lanchonete</label><input id="lZap" type="tel" placeholder="(92) 99999-9999">' + htmlTipos(TIPOS_SEL) + '<p id="lMsg" style="color:var(--erro)"></p>' +
    '<button class="full" id="lBt" onclick="var z=soNum($(\'lZap\').value);if(!$(\'lNome\').value.trim()||z.length<10){$(\'lMsg\').textContent=\'Preencha o nome e o WhatsApp com DDD.\';return}if(!TIPOS_SEL.length){$(\'lMsg\').textContent=\'Marque pelo menos um tipo de lanche.\';return}this.disabled=true;criaLoja($(\'lDono\').value.trim(),$(\'lNome\').value.trim(),z,TIPOS_SEL.slice())">Enviar cadastro</button>' +
    '<p style="text-align:center"><a href="#" onclick="au.signOut();return false">Sair</a></p></div></div>';
  $('raiz').innerHTML = h;
}
/* ---------- tipo da lanchonete (vários) ---------- */
var TIPOS_SEL = [];
function htmlTipos(sel){
  return '<label>O que você vende? (pode marcar vários)</label><div class="tipos" id="boxTipos">' + TIPOS_ORDEM.map(function(t){
    return '<button type="button" class="' + (sel.indexOf(t) >= 0 ? 'on' : '') + '" onclick="togTipo(\'' + t + '\',this)"><i>' + TIPOS[t].ico + '</i>' + esc(TIPOS[t].nome) + '</button>';
  }).join('') + '</div><p class="sub" id="tiposCats">' + cTiposTxt(sel) + '</p>';
}
function cTiposTxt(sel){ var c = catsDosTipos(sel); return c.length ? 'Categorias que vamos criar no cardápio: ' + esc(c.join(', ')) : ''; }
function togTipo(t, b){ var p = TIPOS_SEL.indexOf(t); if (p >= 0) TIPOS_SEL.splice(p, 1); else TIPOS_SEL.push(t); b.className = p >= 0 ? '' : 'on'; if ($('tiposCats')) $('tiposCats').innerHTML = cTiposTxt(TIPOS_SEL); }
function criaLoja(dono, nome, zap, tipos){
  tipos = tipos || [];
  $('raiz').innerHTML = '<div class="hero"><div class="ico">🍔</div><p class="sub">Criando seu cadastro…</p></div>';
  slugLivre(slugify(nome), U.uid).then(function(slug){
    return db.collection('ml_lojas').doc(U.uid).set({
      status: 'liberado', plano: 'teste', validade: firebase.firestore.Timestamp.fromMillis(Date.now() + TESTE_HORAS * 36e5), email: U.email || '', dono: dono, nome: nome, slug: slug, zap: zap, logo: '', tema: 'laranja', layout: 'grade',
      endereco: '', lat: null, lng: null, aviso: '', pedMin: 0, horario: horarioPadrao(),
      faixas: [{km: 2, valor: 3}, {km: 3, valor: 5}, {km: 5, valor: 8}], retirada: true, semEntrega: false,
      pag: {dinheiro: true, cartao: true, pix: false, pixTipo: 'Celular', pixChave: '', pixNome: ''},
      msgs: MSGS_PADRAO, tipos: tipos, catOrdem: catsDosTipos(tipos), criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(function(e){ $('raiz').innerHTML = '<div class="wrap"><div class="aviso no">Não deu para criar o cadastro (' + esc(e.code || e.message) + ').</div><button onclick="location.reload()">Tentar de novo</button></div>'; });
}
function telaEspera(vencido){
  if (vencido && LD.status === 'liberado'){ $('raiz').innerHTML = '<div class="wrap"><div class="hero"><div class="ico">⭐</div><h2>' + esc(LD.nome) + '</h2><p>' + (LD.plano === 'teste' ? 'Seus 7 dias grátis acabaram. Escolha um plano para continuar — tudo que você montou continua salvo.' : 'Seu plano venceu. Renove para continuar — tudo que você montou continua salvo.') + '</p></div><video controls preload="none" playsinline poster="videos/capa-pagamento.jpg" src="videos/tutorial-pagamento.mp4?v=2" style="width:100%;border-radius:12px;background:#000;margin-bottom:10px"></video><div id="planos"></div><p style="text-align:center"><a href="#" onclick="au.signOut();return false">Sair</a></p></div>'; return mostraPlanos(); }
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
    if (novos){ bip(); toast('🔔 Novo pedido chegou!', 4000); autoImprime(PEDS.filter(function(p){ return p._novo && p.status === 'novo'; })); }
    atualizaContador(); if (ABA === 'pedidos') desenhaAba();
  }, function(e){ if (ABA === 'pedidos') $('conteudo').innerHTML = '<div class="aviso no">Não deu para ler os pedidos (' + esc(e.code) + ').</div>'; });
  desenhaPainel();
}
function bip(){ try { var c = new (window.AudioContext || window.webkitAudioContext)(); [0, .18, .36].forEach(function(t, i){ var o = c.createOscillator(), g = c.createGain(); o.frequency.value = [880, 1175, 1568][i]; g.gain.setValueAtTime(.25, c.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + t + .16); o.connect(g); g.connect(c.destination); o.start(c.currentTime + t); o.stop(c.currentTime + t + .17); }); } catch (e) {} if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
var ABAS = [['pedidos','🧾 Pedidos'],['cardapio','🍔 Cardápio'],['loja','🎨 Loja'],['entrega','🛵 Entrega'],['pagamento','💳 Pagamento'],['horario','🕒 Horário'],['cupons','🎟️ Cupons'],['mensagens','💬 Mensagens']];
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
    faixaPlano() + '<div style="max-width:760px;margin:12px auto 0"><div class="linkbox" style="background:rgba(255,255,255,.95);color:#222">🔗 <span style="flex:1">' + esc(link) + '</span></div>' +
    '<div class="row" style="margin-top:8px"><button class="mini bt3" onclick="copiar(linkLoja(LD.slug),\'Link copiado!\')">📋 Copiar link</button><button class="mini btz" onclick="abreZap(\'\',\'Peça seu lanche aqui: \'+linkLoja(LD.slug))">📲 Compartilhar</button><a class="bt mini bt3" href="' + esc(link) + '" target="_blank">👀 Ver loja</a></div></div>';
}
function atualizaContador(){ var b = $('ab_pedidos'); if (!b) return; var n = PEDS.filter(function(p){ return p.status === 'novo'; }).length; b.textContent = '🧾 Pedidos' + (n ? ' (' + n + ')' : ''); }
function vaiAba(a){ ABA = a; ABAS.forEach(function(x){ var b = $('ab_' + x[0]); if (b) b.className = x[0] === a ? 'on' : ''; }); atualizaContador(); desenhaAba(); }
function desenhaAba(){
  var c = $('conteudo'); if (!c) return;
  ({pedidos: abaPedidos, cardapio: abaCardapio, loja: abaLoja, entrega: abaEntrega, pagamento: abaPagamento, horario: abaHorario, cupons: abaCupons, mensagens: abaMensagens}[ABA] || abaPedidos)(c);
}
function salva(campos, msg){ return db.collection('ml_lojas').doc(U.uid).update(campos).then(function(){ toast(msg || 'Salvo! ✅'); }, function(e){ toast('Não salvou: ' + (e.code || e.message), 4000); }); }

/* ---------- assinatura: planos, Pix e comprovante ---------- */
var unPg = null, PIXCFG = null, PLANO_SEL = null, PAGS = [];
function faixaPlano(){
  var v = LD.validade && LD.validade.toDate ? LD.validade.toDate() : null; if (!v) return '';
  var resta = v - new Date(), dias = Math.ceil(resta / 864e5);
  if (LD.plano !== 'teste' && dias > 5) return '';
  var quando = v.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' às ' + v.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  return '<div style="max-width:760px;margin:10px auto 0;background:#fff3cd;color:#5c4400;border-radius:12px;padding:8px 10px;display:flex;gap:8px;align-items:center"><span style="flex:1">' +
    (LD.plano === 'teste' ? '🎁 Teste grátis até ' + quando : '⏳ Seu plano vence ' + quando) + '</span><button class="mini" style="flex:0 0 auto" onclick="abrePlanos()">⭐ Assinar</button></div>';
}
function abrePlanos(){
  $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)fechaPlanos()"><div class="folha"><button class="fecha" onclick="fechaPlanos()">✕</button><h2>⭐ Planos Meu Lanche</h2><p class="sub">O tempo do plano soma com o que ainda falta. Nada do que você montou se perde.</p><p class="sub" style="margin:4px 0">▶️ Vídeo: como assinar e pagar</p><video controls preload="none" playsinline poster="videos/capa-pagamento.jpg" src="videos/tutorial-pagamento.mp4?v=2" style="width:100%;border-radius:12px;background:#000;margin-bottom:10px"></video><div id="planos"></div></div></div>';
  mostraPlanos();
}
function fechaPlanos(){ if (unPg){ unPg(); unPg = null; } fechaModal(); }
function mostraPlanos(){
  if (!PIXCFG) db.collection('ml_publico').doc('pix').get().then(function(d){ PIXCFG = d.exists ? d.data() : {}; desenhaPlanos(); }, function(){ PIXCFG = {}; desenhaPlanos(); });
  if (unPg) unPg();
  unPg = db.collection('ml_pagamentos').where('lojaId', '==', U.uid).onSnapshot(function(s){
    PAGS = s.docs.map(function(d){ var x = d.data(); x.id = d.id; x.t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : Date.now(); return x; }).sort(function(a, b){ return b.t - a.t; });
    desenhaPlanos();
  }, function(){ PAGS = []; desenhaPlanos(); });
  desenhaPlanos();
}
function desenhaPlanos(){
  var c = $('planos'); if (!c) return;
  var esp = PAGS.filter(function(p){ return p.status === 'aguardando'; })[0], ult = PAGS[0];
  if (esp){
    var pl = planoPorId(esp.plano) || {};
    c.innerHTML = '<div class="card" style="text-align:center"><div style="font-size:46px">⏳</div><h3>Comprovante enviado!</h3><p>Plano ' + esc(pl.nome || esp.plano) + ' • ' + brl(esp.valor) + '</p><p class="sub">Assim que o pagamento for confirmado, seu acesso libera sozinho nesta tela. Normalmente leva poucos minutos no horário comercial.</p>' +
      '<a class="bt btz full" target="_blank" href="' + zapLink(ZAP_ADMIN, 'Olá! Paguei o plano ' + (pl.nome || '') + ' (' + brl(esp.valor) + ') do Meu Lanche e enviei o comprovante. Lanchonete: ' + LD.nome + ' • ' + (LD.email || '')) + '">💬 Avisar no WhatsApp</a></div>';
    return;
  }
  if (!PIXCFG){ c.innerHTML = '<p class="sub" style="text-align:center">Carregando…</p>'; return; }
  var h = (ult && ult.status === 'recusado') ? '<div class="aviso no">O último comprovante não foi confirmado. Confira o pagamento e envie de novo, ou fale com a gente no WhatsApp.</div>' : '';
  if (!PLANO_SEL){
    PLANOS.forEach(function(p){
      h += '<div class="card" style="display:flex;align-items:center;gap:10px;cursor:pointer" onclick="PLANO_SEL=\'' + p.id + '\';desenhaPlanos()"><div style="flex:1"><b style="font-size:18px">' + p.nome + '</b>' + (p.selo ? ' <span class="tag ok">' + p.selo + '</span>' : '') + '<div class="sub">' + p.dias + ' dias de acesso</div></div><div style="text-align:right"><b style="color:var(--p);font-size:20px">' + brl(p.valor) + '</b><div class="sub">' + (p.dias > 30 ? brl(p.valor / (p.dias / 30)) + '/mês' : 'por mês') + '</div></div></div>';
    });
    c.innerHTML = h; return;
  }
  var pl = planoPorId(PLANO_SEL);
  if (!PIXCFG.chave){ c.innerHTML = h + '<div class="card"><p>Pagamento ainda não configurado. Fale com a gente:</p><a class="bt btz full" target="_blank" href="' + zapLink(ZAP_ADMIN, 'Olá! Quero assinar o plano ' + pl.nome + ' do Meu Lanche (' + LD.nome + ').') + '">💬 WhatsApp</a></div>'; return; }
  var cc = pixCopiaCola(PIXCFG.chave, PIXCFG.nome, PIXCFG.cidade, pl.valor, 'ML' + U.uid.slice(0, 10));
  window._PIXCC = cc;
  h += '<div class="card"><button class="mini bt3" onclick="PLANO_SEL=null;desenhaPlanos()">← Trocar plano</button><h3 style="margin-top:10px">Plano ' + pl.nome + ' — ' + brl(pl.valor) + '</h3>' +
    '<p><b>1.</b> Pague pelo Pix no app do seu banco:</p>' +
    '<button class="full" onclick="copiar(window._PIXCC,\'Pix copia e cola copiado! Cole no app do banco.\')">📋 Copiar Pix copia e cola</button>' +
    '<p class="sub" style="margin:8px 0">Ou use a chave Pix: <b>' + esc(PIXCFG.chave) + '</b> <a href="#" onclick="copiar(' + esc(JSON.stringify(PIXCFG.chave)) + ',\'Chave copiada!\');return false">copiar</a>' + (PIXCFG.nome ? '<br>Em nome de: ' + esc(PIXCFG.nome) : '') + '<br>Valor: <b>' + brl(pl.valor) + '</b></p>' +
    '<p><b>2.</b> Depois de pagar, mande o comprovante (foto ou print):</p>' +
    '<input type="file" id="arqComp" accept="image/*" class="esc" onchange="enviaComprovante(this.files[0])"><button class="full btz" id="btComp" onclick="$(\'arqComp\').click()">📎 Enviar comprovante</button>' +
    '<p class="sub" id="compMsg"></p></div>';
  c.innerHTML = h;
}
function enviaComprovante(f){
  if (!f) return; var pl = planoPorId(PLANO_SEL); if (!pl) return;
  var b = $('btComp'); if (b){ b.disabled = true; b.textContent = 'Enviando…'; }
  arquivoParaCanvas(f, 1100).then(function(cv){
    var q = 0.7, img = cv.toDataURL('image/jpeg', q);
    while (img.length > 700000 && q > 0.3){ q -= 0.15; img = cv.toDataURL('image/jpeg', q); }
    return db.collection('ml_pagamentos').add({lojaId: U.uid, loja: LD.nome || '', email: LD.email || '', zap: LD.zap || '', plano: pl.id, dias: pl.dias, valor: pl.valor, comprovante: img, status: 'aguardando', criadoEm: firebase.firestore.FieldValue.serverTimestamp()});
  }).then(function(){ PLANO_SEL = null; toast('Comprovante enviado! ✅', 4000); }, function(e){ if (b){ b.disabled = false; b.textContent = '📎 Enviar comprovante'; } if ($('compMsg')) $('compMsg').textContent = 'Não enviou: ' + (e.code || e.message) + '. Tente de novo.'; });
}

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
      '<div class="row" style="margin-top:8px"><button class="mini bt3" onclick="escolheImp(' + i + ')">🖨️ Imprimir</button><button class="mini bt3" onclick="copiaPed(' + i + ')">📋 Copiar</button>' + (c2.lat != null ? '<a class="bt mini bt3" target="_blank" href="https://maps.google.com/?q=' + c2.lat + ',' + c2.lng + '">🗺️ Mapa</a>' : '') +
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

/* ---------- impressão (impressora térmica 58/80 mm) ---------- */
function impCfg(){ try { return JSON.parse(localStorage.getItem('mlImp') || '{}'); } catch(e){ return {}; } }
function escolheImp(i){
  var p = LISTA_PED[i]; if (!p) return; var c = impCfg(), larg = c.larg || 58;
  $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha"><button class="fecha" onclick="fechaModal()">✕</button><h2>🖨️ Imprimir pedido nº ' + esc(p.numero) + '</h2>' +
    '<p class="sub">Tamanho da bobina da impressora:</p><div class="opc">' + [58, 80].map(function(l){ return '<label class="' + (larg === l ? 'on' : '') + '" onclick="var c=impCfg();c.larg=' + l + ';localStorage.setItem(\'mlImp\',JSON.stringify(c));escolheImp(' + i + ')">' + l + ' mm</label>'; }).join('') + '</div><p></p>' +
    '<button class="full" onclick="imprimePed(' + i + ',\'cozinha\')">👨‍🍳 Comanda da cozinha</button><p class="sub" style="margin:4px 0 12px">Letra grande, só itens e observações, para o chapeiro.</p>' +
    '<button class="full bt3" onclick="imprimePed(' + i + ',\'completo\')">🧾 Pedido completo</button><p class="sub" style="margin:4px 0 12px">Com cliente, endereço, valores e pagamento, para o entregador ou cliente.</p>' +
    '<button class="full bt3" onclick="imprimePed(' + i + ',\'ambos\')">📄 Os dois</button>' +
    '<hr style="margin:14px 0"><h3>⚡ Direto na térmica (app RawBT)</h3><p class="sub">Imprime na hora, sem abrir a tela de impressão.</p>' +
    '<button class="full btz" onclick="rawbtImprime(LISTA_PED[' + i + '],impCfg().via||\'ambos\');fechaModal()">⚡ Imprimir direto</button>' +
    '<p class="sub" style="margin:10px 0 4px">O que sai no papel:</p><div class="opc">' + [['cozinha','Cozinha'],['completo','Completo'],['ambos','Os dois']].map(function(v){ return '<label class="' + ((c.via || 'ambos') === v[0] ? 'on' : '') + '" onclick="var c=impCfg();c.via=\'' + v[0] + '\';localStorage.setItem(\'mlImp\',JSON.stringify(c));escolheImp(' + i + ')">' + v[1] + '</label>'; }).join('') + '</div>' +
    '<label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" style="width:auto"' + (c.auto ? ' checked' : '') + ' onchange="var c=impCfg();c.auto=this.checked;localStorage.setItem(\'mlImp\',JSON.stringify(c));toast(this.checked?\'Impressão automática ligada\':\'Impressão automática desligada\')"> <b>Imprimir sozinho quando chegar pedido</b></label>' +
    '<p class="sub">Deixe esta tela do Meu Lanche aberta, com o celular ligado e conectado na impressora pelo RawBT.</p>' +
    '<p class="sub" style="margin-top:12px">Impressora Bluetooth no celular: instale o app <b>RawBT</b> (ou o app da sua impressora) e escolha ele na hora de imprimir.</p>' +
    '</div></div>';
}
function htmlComanda(p, tipo){
  var c = p.cliente || {}, d = new Date(p.t), hora = d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  var h = '<div class="tk">';
  if (tipo === 'cozinha'){
    h += '<div class="c g">COZINHA</div><div class="c gg">Nº ' + esc(p.numero) + '</div><div class="c">' + hora + '</div><div class="c">' + (p.entrega === 'entrega' ? 'ENTREGA' : 'RETIRADA') + ' • ' + esc(c.nome || '') + '</div><hr>';
    (p.itens || []).forEach(function(it){ h += '<div class="it"><b>' + it.qtd + 'x</b> ' + esc(it.nome) + '</div>'; });
    if (p.obs) h += '<hr><div class="it"><b>OBS:</b> ' + esc(p.obs) + '</div>';
    h += '<hr><div class="c">--- fim ---</div>';
  } else {
    h += '<div class="c g">' + esc(LD.nome || 'Meu Lanche') + '</div><div class="c gg">Pedido Nº ' + esc(p.numero) + '</div><div class="c">' + hora + '</div><hr>';
    (p.itens || []).forEach(function(it){ h += '<div class="ln"><span>' + it.qtd + 'x ' + esc(it.nome) + '</span><span>' + brl(it.preco * it.qtd) + '</span></div>'; });
    if (p.obs) h += '<div>Obs.: ' + esc(p.obs) + '</div>';
    h += '<hr><div class="ln"><span>Subtotal</span><span>' + brl(p.subtotal) + '</span></div>';
    if (p.desconto) h += '<div class="ln"><span>Cupom ' + esc(p.cupom || '') + '</span><span>- ' + brl(p.desconto) + '</span></div>';
    if (p.entrega === 'entrega') h += '<div class="ln"><span>Entrega</span><span>' + (p.taxaCombinar ? 'a combinar' : brl(p.taxa)) + '</span></div>';
    h += '<div class="ln g"><span>TOTAL</span><span>' + brl(p.total) + '</span></div><hr>';
    var pg = p.pag || {}, pt = {dinheiro: 'Dinheiro', cartao: 'Cartão na entrega', pix: 'Pix'}[pg.tipo] || pg.tipo || '';
    h += '<div>Pagamento: ' + esc(pt) + (pg.tipo === 'dinheiro' ? (pg.troco ? ' (troco p/ ' + brl(pg.troco) + ')' : ' (sem troco)') : '') + '</div><hr>';
    h += '<div><b>' + esc(c.nome || '') + '</b> ' + esc(c.tel || '') + '</div>';
    if (p.entrega === 'entrega'){ h += '<div>' + esc([c.rua, c.num].filter(Boolean).join(', ')) + (c.bairro ? ' - ' + esc(c.bairro) : '') + '</div>'; if (c.ref) h += '<div>Ref.: ' + esc(c.ref) + '</div>'; }
    else h += '<div>Retirada no local</div>';
    h += '<hr><div class="c">Obrigado pela preferência!</div>';
  }
  return h + '</div>';
}
function semAcento(t){ return String(t == null ? '' : t).replace(/\u00a0/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E\n]/g, ''); }
function escposPed(p, tipo, larg){
  var W = larg === 80 ? 48 : 32, E = '\x1b', G = '\x1d', B = E + '!\x08', N = E + '!\x00', DG = G + '!\x11', NN = G + '!\x00', C = E + 'a\x01', Lf = E + 'a\x00';
  var c = p.cliente || {}, d = new Date(p.t), hora = d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  var tr = '-'.repeat(W) + '\n';
  function ln(a, b){ a = semAcento(a); b = semAcento(b); var esp = W - a.length - b.length; if (esp < 1){ return a + '\n' + ' '.repeat(Math.max(0, W - b.length)) + b + '\n'; } return a + ' '.repeat(esp) + b + '\n'; }
  var t = E + '@';
  if (tipo === 'cozinha'){
    t += C + DG + 'COZINHA\n' + 'N ' + p.numero + '\n' + NN + hora + '\n' + semAcento((p.entrega === 'entrega' ? 'ENTREGA' : 'RETIRADA') + ' - ' + (c.nome || '')) + '\n' + Lf + tr;
    (p.itens || []).forEach(function(it){ t += DG + semAcento(it.qtd + 'x ' + it.nome) + '\n' + NN; });
    if (p.obs) t += tr + B + 'OBS: ' + semAcento(p.obs) + N + '\n';
  } else {
    t += C + B + semAcento(LD.nome || 'Meu Lanche') + N + '\n' + DG + 'PEDIDO N ' + p.numero + '\n' + NN + hora + '\n' + Lf + tr;
    (p.itens || []).forEach(function(it){ t += ln(it.qtd + 'x ' + it.nome, brl(it.preco * it.qtd)); });
    if (p.obs) t += 'Obs.: ' + semAcento(p.obs) + '\n';
    t += tr + ln('Subtotal', brl(p.subtotal));
    if (p.desconto) t += ln('Cupom ' + (p.cupom || ''), '- ' + brl(p.desconto));
    if (p.entrega === 'entrega') t += ln('Entrega', p.taxaCombinar ? 'a combinar' : brl(p.taxa));
    t += B + ln('TOTAL', brl(p.total)) + N + tr;
    var pg = p.pag || {}, pt = {dinheiro: 'Dinheiro', cartao: 'Cartao na entrega', pix: 'Pix'}[pg.tipo] || pg.tipo || '';
    t += semAcento('Pagamento: ' + pt + (pg.tipo === 'dinheiro' ? (pg.troco ? ' (troco p/ ' + brl(pg.troco) + ')' : ' (sem troco)') : '')) + '\n' + tr;
    t += semAcento((c.nome || '') + ' ' + (c.tel || '')) + '\n';
    if (p.entrega === 'entrega'){ t += semAcento([c.rua, c.num].filter(Boolean).join(', ') + (c.bairro ? ' - ' + c.bairro : '')) + '\n'; if (c.ref) t += semAcento('Ref.: ' + c.ref) + '\n'; }
    else t += 'Retirada no local\n';
    t += tr + C + 'Obrigado pela preferencia!\n' + Lf;
  }
  return t + '\n\n\n\n' + G + 'V\x42\x00';
}
function rawbtImprime(p, via){
  if (!p) return; var larg = impCfg().larg || 58;
  var t = via === 'ambos' ? escposPed(p, 'cozinha', larg) + escposPed(p, 'completo', larg) : escposPed(p, via || 'cozinha', larg);
  location.href = 'rawbt:base64,' + btoa(t);
  if (p.status === 'novo') db.collection('ml_pedidos').doc(p.id).update({status: 'preparo'}).catch(function(){});
}
function autoImprime(lista){
  var c = impCfg(); if (!c.auto || !lista.length) return;
  lista.slice().reverse().forEach(function(p, k){ setTimeout(function(){ rawbtImprime(p, c.via || 'ambos'); }, k * 4000); });
}
function imprimePed(i, tipo){
  var p = LISTA_PED[i]; if (!p) return; var larg = impCfg().larg || 58;
  var corpo = tipo === 'ambos' ? htmlComanda(p, 'cozinha') + '<div class="corte"></div>' + htmlComanda(p, 'completo') : htmlComanda(p, tipo);
  var css = '@page{size:' + larg + 'mm auto;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#000;width:' + larg + 'mm}' +
    '.tk{padding:2mm 3mm 6mm;font-size:' + (larg === 80 ? 13 : 11) + 'px;line-height:1.3}.c{text-align:center}.g{font-weight:bold;font-size:1.25em}.gg{font-weight:bold;font-size:1.9em}' +
    '.it{font-size:1.45em;margin:3px 0}.ln{display:flex;justify-content:space-between;gap:6px}.ln span:last-child{white-space:nowrap}hr{border:0;border-top:1px dashed #000;margin:4px 0}.corte{page-break-after:always;break-after:page;height:4mm}';
  var f = document.getElementById('frImp'); if (f) f.remove();
  f = document.createElement('iframe'); f.id = 'frImp'; f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  var dd = f.contentWindow.document; dd.open(); dd.write('<!doctype html><html><head><meta charset="utf-8"><title>Pedido ' + esc(p.numero) + '</title><style>' + css + '</style></head><body>' + corpo + '</body></html>'); dd.close();
  setTimeout(function(){ try { f.contentWindow.focus(); f.contentWindow.print(); } catch(e){ toast('Não deu para abrir a impressão.'); } }, 300);
  fechaModal();
  if (p.status === 'novo') db.collection('ml_pedidos').doc(p.id).update({status: 'preparo'}).catch(function(){});
}

/* ---------- cardápio ---------- */
function catsLista(){ var c = catsDono(); catsDosTipos(LD.tipos).forEach(function(x){ if (c.indexOf(x) < 0) c.push(x); }); if (!c.length) c.push('Lanches'); return c; }
function abaCardapio(c){
  var h = '<div class="card imp"><h2>🤖 Robôs que montam seu cardápio</h2><p style="margin:4px 0 10px">Mande uma foto do cardápio de papel ou fotos dos seus lanches. Os robôs leem, recortam, melhoram as fotos e separam por categoria. Você confere antes de salvar.</p>' +
    '<div class="modos"><button onclick="importa(\'cardapio\')"><i>📋</i><b>Foto do cardápio</b><small>nomes, preços e fotos</small></button><button onclick="importa(\'lanches\')"><i>🍔</i><b>Fotos dos lanches</b><small>várias de uma vez — a IA reconhece</small></button></div></div>';
  h += '<button class="bt2 full" onclick="editaItem(null)">➕ Adicionar item</button>';
  var cs = catsDono();
  if (!IT.length && !cs.length) h += '<div class="vazio">Seu cardápio está vazio. Use os robôs ou adicione os itens um por um.<br>Dica: escolha o tipo da sua lanchonete na aba Loja para criar as categorias.</div>';
  cs.forEach(function(cat, ci){
    var its = IT.filter(function(i){ return (i.cat || 'Cardápio') === cat; });
    h += '<div class="card"><div class="row" style="justify-content:space-between"><h3 style="flex:1">' + icoCat(cat) + ' ' + esc(cat) + ' <small class="sub">(' + its.length + ')</small></h3><button class="mini bt3" style="flex:0 0 auto" onclick="moveCat(' + ci + ',-1)">⬆️</button><button class="mini bt3" style="flex:0 0 auto" onclick="moveCat(' + ci + ',1)">⬇️</button>' +
      (!its.length ? '<button class="mini bt3" style="flex:0 0 auto" title="Tirar categoria" onclick="tiraCat(' + ci + ')">✕</button>' : '') + '</div>';
    its.forEach(function(i){
      h += '<div class="itemadm" style="' + (i.ativo === false ? 'opacity:.5' : '') + '">' + (i.foto ? '<img src="' + i.foto + '">' : '<div class="semft">' + icoCat(i.cat) + '</div>') +
        '<div class="tx"><b>' + esc(i.nome) + '</b><span class="sub">' + (i.tamanhos && i.tamanhos.length ? i.tamanhos.map(function(t){ return esc(t.nome) + ' ' + brl(t.preco); }).join(' • ') : brl(i.preco)) +
        (i.adicionais && i.adicionais.length ? ' • ➕ ' + i.adicionais.length + ' adicionais' : '') + (i.meioMeio ? ' • ½ meio a meio' : '') + (i.ativo === false ? ' • pausado/esgotado' : '') + '</span></div>' +
        '<button class="mini bt3" onclick="editaItem(\'' + i.id + '\')">✏️</button></div>';
    });
    h += '<button class="mini bt3 full" style="margin-top:8px" onclick="editaItem(null,' + ci + ')">➕ Adicionar em ' + esc(cat) + '</button></div>';
  });
  c.innerHTML = h;
}
function catsDono(){ var c = []; (LD.catOrdem || []).forEach(function(x){ if (c.indexOf(x) < 0) c.push(x); }); IT.forEach(function(i){ var k = i.cat || 'Cardápio'; if (c.indexOf(k) < 0) c.push(k); }); return c; }
function moveCat(i, d){
  var c = catsDono(), j = i + d; if (i < 0 || j < 0 || j >= c.length) return;
  var t = c[i]; c[i] = c[j]; c[j] = t; LD.catOrdem = c; salva({catOrdem: c}, 'Ordem salva');
  IT.sort(function(a, b){ return c.indexOf(a.cat || 'Cardápio') - c.indexOf(b.cat || 'Cardápio') || (a.ordem || 0) - (b.ordem || 0); }); desenhaAba();
}
function tiraCat(i){ var c = catsDono(), n = c[i]; if (!n || !confirm('Tirar a categoria "' + n + '" (está vazia)?')) return; c.splice(i, 1); LD.catOrdem = c; salva({catOrdem: c}, 'Categoria removida'); desenhaAba(); }
function pedeFoto(cam, cb){
  fotoCb = cb; var inp = $(cam ? 'arqCam' : 'arqGal'); inp.value = '';
  inp.onchange = function(){ var f = inp.files[0]; if (!f) return; toast('Melhorando a foto…'); fotoDeArquivo(f, 600).then(function(d){ fotoCb && fotoCb(d); }, function(){ toast('Não deu para abrir essa foto.'); }); };
  inp.click();
}

/* ---------- editar item ---------- */
var EDIT = null;
function editaItem(id, ci){
  var i = id ? IT.filter(function(x){ return x.id === id; })[0] : null;
  var cs = catsLista(), cat = ci != null ? catsDono()[ci] : cs[0];
  EDIT = i ? JSON.parse(JSON.stringify(i)) : {nome: '', desc: '', preco: '', cat: cat || 'Lanches', foto: '', ativo: true};
  EDIT.tamanhos = EDIT.tamanhos || []; EDIT.adicionais = EDIT.adicionais || []; EDIT.meioMeio = !!EDIT.meioMeio;
  desenhaEdit();
}
function desenhaEdit(){
  var e = EDIT, cs = catsLista().slice(); if (e.cat && cs.indexOf(e.cat) < 0) cs.push(e.cat);
  var h = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" id="folhaEd"><button class="fecha" onclick="fechaModal()">✕</button><h2>' + (e.id ? 'Editar item' : 'Novo item') + '</h2>' +
    '<div style="text-align:center">' + (e.foto ? '<img src="' + e.foto + '" style="width:200px;height:200px;object-fit:cover;border-radius:18px">' : '<div style="width:200px;height:200px;border-radius:18px;margin:auto;background:var(--linha);display:flex;align-items:center;justify-content:center;font-size:70px">' + icoCat(e.cat) + '</div>') + '</div>' +
    '<div class="row" style="margin-top:8px"><button class="mini bt3" onclick="lerEdit();pedeFoto(true,function(d){EDIT.foto=d;desenhaEdit()})">📷 Câmera</button><button class="mini bt3" onclick="lerEdit();pedeFoto(false,function(d){EDIT.foto=d;desenhaEdit()})">🖼️ Galeria</button>' + (e.foto ? '<button class="mini bt3" onclick="lerEdit();EDIT.foto=\'\';desenhaEdit()">Tirar foto</button>' : '') + '</div>' +
    '<button class="mini bt2 full" id="eFotoIA" style="margin-top:8px" onclick="gerarFotoEdit()">🎨 Criar foto com IA (pelos ingredientes)</button>' +
    '<label>Nome</label><input id="eNome" value="' + esc(e.nome) + '" placeholder="Ex.: X-Tudo">' +
    '<div class="row" style="align-items:flex-end"><label style="flex:1">Descrição</label><button class="mini bt2" style="flex:0 0 auto;margin-bottom:4px" id="eIA" onclick="gerarDescIA()">✨ Gerar descrição com IA</button></div>' +
    '<textarea id="eDesc" placeholder="Ex.: pão, hambúrguer, ovo, bacon, queijo, salada">' + esc(e.desc) + '</textarea>' +
    '<label>Categoria</label><select id="eCat" onchange="if(this.value===\'__nova\'){var n=prompt(\'Nome da nova categoria:\');lerEdit();if(n&&n.trim())EDIT.cat=n.trim();desenhaEdit()}else{lerEdit();desenhaEdit()}">' +
    cs.map(function(c){ return '<option value="' + esc(c) + '"' + (c === e.cat ? ' selected' : '') + '>' + icoCat(c) + ' ' + esc(c) + '</option>'; }).join('') + '<option value="__nova">➕ Criar nova categoria…</option></select>';
  if (!e.tamanhos.length) h += '<label>Preço (R$)</label><input id="ePreco" inputmode="decimal" value="' + (e.preco !== '' && e.preco != null ? String(e.preco).replace('.', ',') : '') + '" placeholder="0,00">';
  var mostraTam = ehPizza(e.cat) || e.tamanhos.length;
  if (mostraTam){
  h += '<div class="card" style="margin-top:12px"><h3>📏 Tamanhos com preços diferentes</h3>';
  if (!e.tamanhos.length) h += '<p class="sub">Pizza: preencha só os tamanhos que você faz. Broto 1 sabor, Pequena e Média até 2, Grande até 3, Família até 4.</p>';
  e.tamanhos.forEach(function(t, k){ h += '<div class="faixa"><input id="eTn' + k + '" value="' + esc(t.nome) + '" placeholder="Tamanho" style="flex:2"><span>R$</span><input id="eTp' + k + '" inputmode="decimal" value="' + (t.preco !== '' && t.preco != null ? String(t.preco).replace('.', ',') : '') + '" placeholder="0,00"><button class="mini btr" style="flex:0 0 auto" onclick="lerEdit();EDIT.tamanhos.splice(' + k + ',1);desenhaEdit()">✕</button></div>'; });
  h += '<div class="row"><button class="mini bt3" onclick="lerEdit();EDIT.tamanhos.push({nome:\'\',preco:\'\'});desenhaEdit()">➕ Tamanho</button><button class="mini bt3" onclick="tamPizza()">🍕 Broto / P / M / G / Família</button></div>';
  if (ehPizza(e.cat)) h += '<p class="sub">🍕 Esta pizza aparece no "Monte sua pizza" do cliente.</p>';
  h += '</div>';
  }
  h += '<div class="card"><h3>➕ Adicionais (opcional)</h3><p class="sub">O cliente pode marcar. Ex.: bacon R$ 3,00, borda de catupiry R$ 8,00.</p>';
  e.adicionais.forEach(function(a, k){ h += '<div class="faixa"><input id="eAn' + k + '" value="' + esc(a.nome) + '" placeholder="Ex.: Bacon" style="flex:2"><span>R$</span><input id="eAp' + k + '" inputmode="decimal" value="' + (a.preco !== '' && a.preco != null ? String(a.preco).replace('.', ',') : '') + '" placeholder="0,00"><button class="mini btr" style="flex:0 0 auto" onclick="lerEdit();EDIT.adicionais.splice(' + k + ',1);desenhaEdit()">✕</button></div>'; });
  h += '<button class="mini bt3 full" onclick="lerEdit();EDIT.adicionais.push({nome:\'\',preco:\'\'});desenhaEdit()">➕ Adicional</button></div>' +
    '<div class="switch"><span>Disponível para venda</span><input type="checkbox" id="eAtivo"' + (e.ativo !== false ? ' checked' : '') + '></div>' +
    '<button class="full" style="margin-top:14px" id="eSalva" onclick="salvaItem()">Salvar</button>' + (e.id ? '<p></p><button class="btr full" onclick="apagaItem()">Apagar este item</button>' : '') + '</div></div>';
  var y = $('folhaEd') ? $('folhaEd').scrollTop : 0; $('modal').innerHTML = h; $('folhaEd').scrollTop = y;
}
function tamPizza(){ lerEdit(); var base = EDIT.tamanhos.length ? EDIT.tamanhos : (num(EDIT.preco) > 0 ? [{nome: 'Média', preco: EDIT.preco}] : []); var v = {}; base.forEach(function(t){ v[chaveTam(t.nome)] = t.preco; }); EDIT.tamanhos = TAM_PIZZA.map(function(n){ var k = chaveTam(n); return {nome: n, preco: v[k] != null ? v[k] : ''}; }); EDIT.meioMeio = true; desenhaEdit(); }
function lerEdit(){
  if (!$('eNome')) return; EDIT.nome = $('eNome').value.trim(); EDIT.desc = $('eDesc').value.trim(); if ($('ePreco')) EDIT.preco = $('ePreco').value;
  var c = $('eCat').value; if (c && c !== '__nova') EDIT.cat = c; EDIT.ativo = $('eAtivo').checked; if ($('eMeio')) EDIT.meioMeio = $('eMeio').checked;
  EDIT.tamanhos.forEach(function(t, k){ if ($('eTn' + k)){ t.nome = $('eTn' + k).value.trim(); t.preco = $('eTp' + k).value; } });
  EDIT.adicionais.forEach(function(a, k){ if ($('eAn' + k)){ a.nome = $('eAn' + k).value.trim(); a.preco = $('eAp' + k).value; } });
}
function salvaItem(){
  lerEdit(); var e = EDIT; if (!e.nome) return toast('Digite o nome do item.');
  var tams = limpaOpcoes(e.tamanhos).filter(function(t){ return t.preco > 0; }), adds = limpaOpcoes(e.adicionais);
  if (tams.some(function(t){ return !(t.preco > 0); })) return toast('Coloque o preço de cada tamanho.');
  var d = {nome: e.nome, desc: e.desc, preco: tams.length ? precoMin({tamanhos: tams}) : num(e.preco), cat: e.cat || 'Cardápio', foto: e.foto || '', ativo: e.ativo,
    tamanhos: tams, adicionais: adds, meioMeio: ehPizza(e.cat)};
  $('eSalva').disabled = true;
  var ref = db.collection('ml_lojas').doc(U.uid).collection('itens');
  var pr = e.id ? ref.doc(e.id).update(d) : (d.ordem = Date.now(), ref.add(d));
  pr.then(function(){ garanteCat(d.cat); fechaModal(); toast('Item salvo! ✅'); }, function(x){ $('eSalva').disabled = false; toast('Não salvou: ' + (x.code || x.message), 4000); });
}
function garanteCat(c){ var co = (LD.catOrdem || []).slice(); if (co.indexOf(c) < 0){ co.push(c); salva({catOrdem: co}, 'Salvo! ✅'); } }
function apagaItem(){ if (!confirm('Apagar ' + EDIT.nome + '?')) return; db.collection('ml_lojas').doc(U.uid).collection('itens').doc(EDIT.id).delete().then(function(){ fechaModal(); toast('Apagado'); }); }
function iaPronta(){
  if (CFG === null){ toast('Carregando… tente de novo em 2 segundos.'); return false; }
  if (!CFG.geminiKey){
    $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" style="text-align:center"><div style="font-size:50px">🤖</div><h2>Robôs ainda não ativados</h2><p>A leitura com IA ainda não foi ligada pelo administrador. Enquanto isso, você pode cadastrar os itens um por um — é rapidinho!</p><button class="full" onclick="fechaModal();editaItem(null)">➕ Adicionar item</button><p></p><a class="bt btz full" target="_blank" href="' + zapLink(ZAP_ADMIN, 'Olá! Quero usar os robôs de leitura por foto no Meu Lanche (' + LD.nome + ').') + '">Avisar o administrador</a></div></div>';
    return false;
  }
  return true;
}
function gerarDescIA(){
  lerEdit(); var e = EDIT;
  if (!e.nome && !e.foto) return toast('Digite o nome ou coloque uma foto primeiro.');
  if (CFG === null || !CFG.geminiKey) return toast(CFG === null ? 'Carregando… tente de novo.' : 'A IA ainda não foi ativada pelo administrador.', 3500);
  var b = $('eIA'); b.disabled = true; b.textContent = '✨ Pensando…';
  var parts = [];
  if (e.foto && e.foto.indexOf('data:') === 0){ var m = e.foto.match(/^data:([^;]+);base64,(.*)$/); if (m) parts.push({inline_data: {mime_type: m[1], data: m[2]}}); }
  parts.push({text: 'Você escreve cardápios de lanchonetes brasileiras. ' + ctxLoja() + '\nItem: "' + (e.nome || '(sem nome, veja a foto)') + '"' + (e.desc ? ' — anotação do dono: "' + e.desc + '"' : '') + (parts.length ? ' (a foto anexa é deste item).' : '.') +
    '\nEscreva "descricao": 1 frase apetitosa e honesta (até 140 caracteres) em português do Brasil, citando os ingredientes típicos ou visíveis, sem exageros e sem emojis. ' +
    '"nome": o nome curto comercial (mantenha o do dono se ele deu). "categoria": uma das categorias da loja.'});
  chamaGemini(parts, SCHEMA_DESC).then(function(o){
    lerEdit();
    if (o.descricao) EDIT.desc = String(o.descricao).trim();
    if (!EDIT.nome && o.nome) EDIT.nome = String(o.nome).trim();
    if (!EDIT.id && o.categoria) EDIT.cat = casaCat(o.categoria, catsLista());
    desenhaEdit(); toast('Descrição pronta! Confira e ajuste se quiser ✨');
  }, function(x){ b.disabled = false; b.textContent = '✨ Gerar descrição com IA'; toast(x.message || 'Não deu certo.', 4500); });
}

/* ---------- robôs: importar por foto (Gemini) ---------- */
var SCHEMA_ITEM = {type: 'OBJECT', properties: {
  nome: {type: 'STRING'}, descricao: {type: 'STRING'}, tipo: {type: 'STRING', enum: ['pizza', 'pizza_doce', 'borda', 'hamburguer', 'sanduiche', 'kikao', 'pastel', 'pastel_doce', 'marmita', 'prato', 'porcao', 'refrigerante', 'suco', 'agua', 'bebida', 'sobremesa', 'combo', 'adicional', 'outro']}, categoria: {type: 'STRING'}, preco: {type: 'NUMBER', nullable: true},
  tamanhos: {type: 'ARRAY', items: {type: 'OBJECT', properties: {nome: {type: 'STRING'}, preco: {type: 'NUMBER'}}, required: ['nome', 'preco']}},
  box_2d: {type: 'ARRAY', nullable: true, items: {type: 'INTEGER'}}
}, required: ['nome', 'descricao', 'tipo', 'categoria', 'preco', 'tamanhos'], propertyOrdering: ['nome', 'descricao', 'tipo', 'categoria', 'preco', 'tamanhos', 'box_2d']};
var SCHEMA_ITENS = {type: 'OBJECT', properties: {itens: {type: 'ARRAY', items: SCHEMA_ITEM}}, required: ['itens']};
var SCHEMA_DESC = {type: 'OBJECT', properties: {nome: {type: 'STRING'}, descricao: {type: 'STRING'}, categoria: {type: 'STRING'}}, required: ['nome', 'descricao', 'categoria']};
function ctxLoja(){
  var t = nomesTipos(LD.tipos);
  return (t.length ? 'A lanchonete vende: ' + t.join(', ') + '. ' : '') + 'Categorias do cardápio desta loja (use exatamente um destes nomes sempre que fizer sentido): ' + catsLista().join(' | ') + '.';
}
function promptCardapio(){
  return 'Você é especialista em ler cardápios de lanchonetes brasileiras (papel, banner, quadro, panfleto ou print de tela). ' + ctxLoja() +
    '\nExtraia TODOS os itens à venda que aparecem na imagem, na ordem em que aparecem. Para cada item:' +
    '\n- nome: como está escrito (corrija só erros óbvios de leitura; mantenha nomes como "X-Tudo", "X-Salada", "Misto"). Não coloque preço nem tamanho no nome.' +
    '\n- descricao: ingredientes/legenda escritos junto do item; se não houver, "" (não invente).' +
    '\n- tipo: O QUE O PRODUTO É de verdade, pelo nome, pelos ingredientes e pela foto (NÃO pelo título da seção do cardápio). Ex.: "Calabresa" numa seção "Lanches" mas com fatias/borda de pizza = pizza; "X-Tudo" = hamburguer; "Misto quente" = sanduiche; "Cachorro-quente"/"Kikão" = kikao; "Coca 2L" = refrigerante; pizza de chocolate = pizza_doce.' +
    '\n- categoria: a categoria da loja que combina com o tipo (ex.: pizza -> Pizzas Salgadas); se não houver, um nome simples no plural (Pizzas, Hambúrgueres, Sanduíches, Kikão, Pastéis, Bebidas).' +
    '\n- preco: preço em reais como número (ex.: 18.5); se não aparecer, null.' +
    '\n- tamanhos: se o item tiver preços diferentes por tamanho (P/M/G/Família, Broto/Grande, Pequena/Média/Grande, 300ml/500ml, 1L/2L, Simples/Duplo), liste [{nome, preco}] e ponha em preco o menor valor; senão []. Para pizza use Broto, Pequena, Média, Grande e Família (só os que o cardápio tiver). Em tabelas com os tamanhos no cabeçalho das colunas, ligue cada preço à coluna certa.' +
    '\n- box_2d: se houver uma FOTO deste item específico, a caixa [ymin, xmin, ymax, xmax] normalizada de 0 a 1000 cobrindo só a foto da comida (sem o texto); se não houver foto dele, null.' +
    '\nNão invente itens nem preços. Ignore telefone, endereço, logotipo, horário e propaganda. Preços como "15,90" viram 15.9.';
}
function promptLanche(){
  return 'Esta é a foto de comida de uma lanchonete brasileira (normalmente sem texto). ' + ctxLoja() +
    '\nReconheça a comida e devolva em "itens" um item para cada lanche/prato DIFERENTE que aparece (quase sempre só 1):' +
    '\n- nome: nome comercial curto, comum no Brasil (ex.: "X-Tudo", "X-Salada", "Pizza de Calabresa", "Pastel de Carne", "Kikão Completo", "Marmita de Frango Grelhado", "Coca-Cola Lata").' +
    '\n- descricao: 1 frase apetitosa e honesta (até 140 caracteres), citando os ingredientes que dá para ver. Sem emojis.' +
    '\n- tipo: O QUE O PRODUTO É de verdade, pelo nome, pelos ingredientes e pela foto (NÃO pelo título da seção do cardápio). Ex.: "Calabresa" numa seção "Lanches" mas com fatias/borda de pizza = pizza; "X-Tudo" = hamburguer; "Misto quente" = sanduiche; "Cachorro-quente"/"Kikão" = kikao; "Coca 2L" = refrigerante; pizza de chocolate = pizza_doce.' +
    '\n- categoria: a categoria da loja que combina com o tipo.' +
    '\n- preco: null (o dono vai preencher), a não ser que um preço esteja escrito na foto. tamanhos: [].' +
    '\n- box_2d: caixa [ymin, xmin, ymax, xmax] de 0 a 1000 em volta do lanche, com pequena folga.' +
    '\nSe a foto não for de comida ou bebida, devolva "itens": [].';
}
var MODO_IMP = 'cardapio';
function importa(modo, origem){
  if (modo) MODO_IMP = modo;
  if (!iaPronta()) return;
  if (!origem){
    var lan = MODO_IMP === 'lanches';
    $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)voltaImp()"><div class="folha" style="text-align:center"><div style="font-size:50px">' + (lan ? '🍔' : '📋') + '</div><h2>' + (lan ? 'Fotos dos lanches' : 'Foto do cardápio') + '</h2>' +
      '<p class="sub">' + (lan ? 'Pode escolher várias fotos de uma vez. Uma foto por lanche, bem de perto e com boa luz. Os robôs reconhecem cada um, escrevem a descrição e deixam a foto bonita. O preço você coloca depois.' : 'Foto bem de frente, com boa luz, sem cortar as bordas. Se o cardápio tiver várias páginas, escolha todas da galeria.') + '</p>' +
      '<div class="row"><button onclick="importa(null,\'cam\')">📷 Tirar foto</button><button onclick="importa(null,\'gal\')">🖼️ Da galeria</button></div><p></p><button class="bt3 full" onclick="voltaImp()">Voltar</button></div></div>';
    return;
  }
  var inp = $(origem === 'cam' ? 'arqCardCam' : 'arqCard'); inp.value = '';
  inp.onchange = function(){ var fs = Array.prototype.slice.call(inp.files || []); if (fs.length) processaFotos(fs, MODO_IMP); };
  inp.click();
}
function voltaImp(){ if (REV.length) desenhaRev(); else fechaModal(); }

var ROBOS = [
  {id: 'leitor', nome: 'Leitor', cor: '#3b82f6', fun: {cardapio: 'lê nomes, preços e ingredientes', lanches: 'descobre que lanche é'}},
  {id: 'fotografo', nome: 'Fotógrafo', cor: '#ec4899', fun: {cardapio: 'acha e recorta as fotos dos lanches', lanches: 'enquadra o lanche na foto'}},
  {id: 'caprichoso', nome: 'Caprichoso', cor: '#f59e0b', fun: {cardapio: 'deixa as fotos mais bonitas', lanches: 'deixa a foto com cara de cardápio'}},
  {id: 'organizador', nome: 'Organizador', cor: '#10b981', fun: {cardapio: 'separa tudo por categoria', lanches: 'escolhe a categoria certa'}}
];
function svgRobo(cor){
  return '<svg viewBox="0 0 64 72" width="58" height="66" aria-hidden="true"><line x1="32" y1="4" x2="32" y2="13" stroke="' + cor + '" stroke-width="3"/><circle class="ant" cx="32" cy="5" r="4" fill="' + cor + '"/>' +
    '<rect x="10" y="13" width="44" height="30" rx="10" fill="' + cor + '"/><rect x="15" y="18" width="34" height="19" rx="7" fill="#fff"/>' +
    '<g class="olhos"><circle cx="25" cy="27" r="4" fill="#222"/><circle cx="39" cy="27" r="4" fill="#222"/></g><path class="boca" d="M27 33 Q32 36 37 33" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<rect x="16" y="46" width="32" height="20" rx="7" fill="' + cor + '"/><circle cx="32" cy="56" r="4" fill="#fff" opacity=".8"/>' +
    '<rect class="braco b1" x="4" y="48" width="9" height="5" rx="2.5" fill="' + cor + '"/><rect class="braco b2" x="51" y="48" width="9" height="5" rx="2.5" fill="' + cor + '"/></svg>';
}
function telaRobos(total, modo){
  var h = '<div class="fundo"><div class="folha robos-tela"><h2 style="text-align:center">' + (modo === 'lanches' ? '🍔 Os robôs estão olhando seus lanches' : '📋 Os robôs estão lendo seu cardápio') + '</h2>' +
    '<p class="sub" style="text-align:center" id="pTxt">Preparando…</p><div class="prog"><i id="pBar" style="width:3%"></i></div><div class="robos">';
  ROBOS.forEach(function(r){
    h += '<div class="robo esp" id="rb_' + r.id + '">' + svgRobo(r.cor) + '<b>' + r.nome + '</b><small>' + r.fun[modo] + '</small><span class="rst" id="rs_' + r.id + '">esperando…</span><div class="prog mini"><i id="rp_' + r.id + '" style="background:' + r.cor + '"></i></div></div>';
  });
  h += '</div><p class="sub" style="text-align:center">' + total + ' foto' + (total > 1 ? 's' : '') + '. Pode levar até 1 minuto por foto. Não feche o app.</p></div></div>';
  $('modal').innerHTML = h;
}
function setRobo(id, est, txt, pct){
  var b = $('rb_' + id); if (!b) return;
  b.className = 'robo ' + est; if (txt != null) $('rs_' + id).textContent = txt; if (pct != null) $('rp_' + id).style.width = Math.max(0, Math.min(100, pct)) + '%';
}
function prog(t, pct){ if ($('pTxt')) $('pTxt').textContent = t; if ($('pBar')) $('pBar').style.width = pct + '%'; }
function pausa(ms){ return new Promise(function(ok){ setTimeout(ok, ms); }); }
function perguntaErro(msg, n, tot){
  return new Promise(function(ok){
    window.__respErro = function(v){ ok(v); };
    $('modal').innerHTML = '<div class="fundo"><div class="folha" style="text-align:center"><div class="robo erro" style="margin:auto;display:inline-flex">' + svgRobo('#9ca3af') + '</div><h2>Ops! Um robô tropeçou</h2><p>' + esc(msg) + '</p><p class="sub">Foto ' + n + ' de ' + tot + '.</p>' +
      '<button class="full" onclick="__respErro(\'tenta\')">🔄 Tentar de novo</button><p></p>' + (n < tot ? '<button class="bt3 full" onclick="__respErro(\'pula\')">Pular esta foto</button><p></p>' : '') +
      '<button class="bt3 full" onclick="__respErro(\'para\')">' + (REV.length ? 'Parar e revisar o que já foi lido' : 'Parar') + '</button></div></div>';
  });
}
function processaFotos(fs, modo){
  var novos = [], k = 0, N = fs.length, cats = catsLista(), lan = modo === 'lanches';
  telaRobos(N, modo);
  function pctG(n, f){ return Math.round(((n - 1) + f) / N * 100); }
  function prox(){
    if (k >= N){ ROBOS.forEach(function(r){ setRobo(r.id, 'ok', 'pronto! ✅', 100); }); prog('Tudo pronto! Abrindo a revisão…', 100); return pausa(900).then(function(){ fimImport(novos); }); }
    var f = fs[k], n = k + 1, cv;
    if (!$('rb_leitor')) telaRobos(N, modo);
    ROBOS.forEach(function(r){ setRobo(r.id, 'esp', 'esperando…', 0); });
    setRobo('leitor', 'trab', 'abrindo a foto ' + n + '…', 10); prog('Foto ' + n + ' de ' + N, pctG(n, .05));
    return arquivoParaCanvas(f, 2000).then(function(c){
      cv = c; setRobo('leitor', 'trab', lan ? 'olhando o lanche…' : 'lendo nomes e preços…', 35); prog('Foto ' + n + ' de ' + N + ': ' + (lan ? 'reconhecendo…' : 'lendo…'), pctG(n, .15));
      var tk = setInterval(function(){ var e = $('rp_leitor'); if (e){ var w = parseFloat(e.style.width) || 35; if (w < 92) e.style.width = (w + 3) + '%'; } }, 1200);
      var b64 = cv.toDataURL('image/jpeg', 0.88).split(',')[1];
      return chamaGemini([{inline_data: {mime_type: 'image/jpeg', data: b64}}, {text: lan ? promptLanche() : promptCardapio()}], SCHEMA_ITENS, function(seg){
        setRobo('leitor', 'trab', 'descansando ' + seg + 's (limite da IA)…'); prog('Os robôs estão tomando um fôlego… voltam em ' + seg + 's', pctG(n, .3));
      }).then(function(r){ clearInterval(tk); return r; }, function(e){ clearInterval(tk); throw e; });
    }).then(function(r){
      var its = (r && r.itens) || [];
      setRobo('leitor', 'ok', its.length ? 'achei ' + its.length + ' ite' + (its.length > 1 ? 'ns' : 'm') + ' ✅' : 'não achei itens 😕', 100);
      /* fotógrafo: acha as caixas */
      setRobo('fotografo', 'trab', 'procurando fotos…', 20); prog('Foto ' + n + ' de ' + N + ': recortando…', pctG(n, .6));
      var cxs = its.map(function(it){
        var c = caixaPx(it && it.box_2d, cv.width, cv.height, lan ? 1.01 : 0.95);
        if (!c && lan){ var l = Math.min(cv.width, cv.height); c = {x: (cv.width - l) / 2, y: (cv.height - l) / 2, w: l, h: l}; }
        return c;
      });
      var nf = cxs.filter(Boolean).length;
      return pausa(350).then(function(){
        setRobo('fotografo', 'ok', nf ? nf + ' foto' + (nf > 1 ? 's' : '') + ' recortada' + (nf > 1 ? 's' : '') + ' ✅' : 'sem fotos no cardápio', 100);
        setRobo('caprichoso', nf ? 'trab' : 'ok', nf ? 'melhorando 0 de ' + nf + '…' : 'nada para melhorar', nf ? 5 : 100);
        var fotos = [], j = 0, feitas = 0;
        function cap(){
          if (j >= cxs.length) return Promise.resolve();
          var c = cxs[j], jj = j; j++;
          if (!c){ fotos[jj] = ''; return cap(); }
          return pausa(30).then(function(){
            try { fotos[jj] = melhoraFoto(cv, c.x, c.y, c.w, c.h, 600); } catch (e) { fotos[jj] = ''; }
            feitas++; setRobo('caprichoso', 'trab', 'melhorando ' + feitas + ' de ' + nf + '…', feitas / nf * 100);
            return cap();
          });
        }
        return cap().then(function(){
          if (nf) setRobo('caprichoso', 'ok', 'fotos caprichadas ✅', 100);
          setRobo('organizador', 'trab', 'separando por categoria…', 40); prog('Foto ' + n + ' de ' + N + ': organizando…', pctG(n, .9));
          return pausa(300).then(function(){
            var porCat = {};
            its.forEach(function(it, q){ var x = itemDaIA(it, cats); if (!x) return; x.foto = fotos[q] || ''; novos.push(x); porCat[x.cat] = (porCat[x.cat] || 0) + 1; });
            var ks = Object.keys(porCat);
            setRobo('organizador', 'ok', ks.length ? ks.length + ' categoria' + (ks.length > 1 ? 's' : '') + ' ✅' : 'nada a organizar', 100);
            k++; return pausa(lan && k < N ? 700 : 300).then(prox);
          });
        });
      });
    }, function(e){
      var m = e && e.message || String(e);
      return perguntaErro(m, n, N).then(function(v){
        if (v === 'tenta'){ telaRobos(N, modo); return prox(); }
        if (v === 'pula'){ k++; telaRobos(N, modo); return prox(); }
        return fimImport(novos);
      });
    });
  }
  prox();
}
/* chama o Gemini com JSON + schema; troca de modelo se faltar; espera e tenta de novo no limite (429) */
function chamaGemini(parts, schema, onEspera){
  var mods = [];
  if (CFG.geminiModelo) mods.push(CFG.geminiModelo);
  ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash'].forEach(function(m){ if (mods.indexOf(m) < 0) mods.push(m); });
  var i = 0, rodada = 0, semSchema = {}, limite = false;
  function corpo(m){
    var gc = {responseMimeType: 'application/json', temperature: 0.15, maxOutputTokens: 24576};
    if (schema && !semSchema[m]) gc.responseSchema = schema;
    return JSON.stringify({contents: [{role: 'user', parts: parts}], generationConfig: gc});
  }
  function proxModelo(){
    if (i < mods.length) return tenta();
    if (limite && rodada < 2){
      rodada++; i = 0; limite = false; var s = rodada === 1 ? 20 : 40;
      return new Promise(function(ok){ (function conta(){ if (onEspera) onEspera(s); if (s-- <= 0) return ok(); setTimeout(conta, 1000); })(); }).then(tenta);
    }
    if (limite) throw new Error('Os robôs bateram no limite de leituras grátis da IA. Espere 1 ou 2 minutos e toque em "Tentar de novo".');
    throw new Error('A IA está ocupada agora. Tente de novo daqui a pouco.');
  }
  function tenta(){
    var m = mods[i++];
    var ac = window.AbortController ? new AbortController() : null, tmo = ac ? setTimeout(function(){ ac.abort(); }, 75000) : 0;
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent?key=' + encodeURIComponent(CFG.geminiKey), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: corpo(m), signal: ac ? ac.signal : undefined})
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return {st: r.status, j: j}; }); }, function(e){ clearTimeout(tmo); if (e && e.name === 'AbortError') return {st: 504, j: {}}; throw new Error('Sem internet. Confira a conexão e tente de novo.'); })
      .then(function(x){
        var txt = JSON.stringify(x.j || {});
        clearTimeout(tmo);
        if (x.st === 404 || (x.st === 400 && /not found|not supported|is not available|no longer available/i.test(txt))) return proxModelo();
        if (x.st === 400 && schema && !semSchema[m] && /schema|response_schema|responseSchema|Invalid JSON payload|Unknown name/i.test(txt)){ semSchema[m] = 1; i--; return tenta(); }
        if (x.st === 400 && /API key|API_KEY/i.test(txt)) throw new Error('A chave da IA está errada. Avise o administrador.');
        if (x.st === 403) throw new Error('A chave da IA não tem permissão. Avise o administrador.');
        if (x.st === 429 || x.st === 503 || x.st === 500){ limite = true; return proxModelo(); }
        if (x.st >= 500) return proxModelo();
        if (x.st !== 200) throw new Error('Erro ' + x.st + ' na IA. Tente de novo.');
        var c0 = x.j.candidates && x.j.candidates[0];
        if (!c0 || !c0.content || !c0.content.parts){
          if (c0 && /SAFETY|PROHIBITED|BLOCK/i.test(c0.finishReason || '')) throw new Error('A IA não quis ler esta foto. Tente outra.');
          throw new Error('A leitura voltou vazia. Tente uma foto mais nítida.');
        }
        var o = lerJsonIA(c0.content.parts.map(function(p){ return p.thought ? '' : (p.text || ''); }).join(''));
        if (!o) return proxModelo();
        if (Array.isArray(o)) o = {itens: o};
        return o;
      });
  }
  return tenta();
}
function fimImport(novos){
  REV = REV.concat(novos);
  if (!REV.length){ $('modal').innerHTML = '<div class="fundo"><div class="folha" style="text-align:center"><div class="robo esp" style="margin:auto;display:inline-flex">' + svgRobo('#9ca3af') + '</div><h2>Os robôs não acharam itens 😕</h2><p>Tente outra foto: bem de frente, com boa luz e sem cortar as bordas.</p><button class="full" onclick="fechaModal()">OK</button></div></div>'; return; }
  desenhaRev();
}
function desenhaRev(){
  var n = REV.filter(function(r){ return r.ok; }).length, comFoto = REV.filter(function(r){ return r.foto; }).length, cs = catsLista().slice();
  REV.forEach(function(r){ if (r.cat && cs.indexOf(r.cat) < 0) cs.push(r.cat); });
  var h = '<div class="fundo"><div class="folha" id="folhaRev"><button class="fecha" onclick="if(confirm(\'Descartar a leitura?\')){REV=[];fechaModal()}">✕</button><h2>Confira antes de salvar</h2>' +
    '<p class="sub">Os robôs acharam ' + REV.length + ' itens' + (comFoto ? ' (' + comFoto + ' com foto)' : '') + '. Corrija o que precisar, desmarque o que não quiser e toque em Salvar. Toque na foto para trocar.</p>' +
    '<datalist id="listaCatsRev">' + cs.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>';
  REV.forEach(function(r, i){
    var semP = r.ok && !r.tamanhos.length && !(num(r.preco) > 0);
    h += '<div class="rev" style="' + (r.ok ? '' : 'opacity:.45') + '"><input type="checkbox"' + (r.ok ? ' checked' : '') + ' onchange="lerRev();REV[' + i + '].ok=this.checked;desenhaRev()">' +
      (r.foto ? '<img src="' + r.foto + '" onclick="fotoRev(' + i + ')">' : '<div class="semft" onclick="fotoRev(' + i + ')">📷</div>') +
      '<div class="tx"><input id="rN' + i + '" value="' + esc(r.nome) + '" placeholder="Nome"><textarea id="rD' + i + '" placeholder="Descrição">' + esc(r.desc) + '</textarea>' +
      '<input id="rC' + i + '" list="listaCatsRev" value="' + esc(r.cat) + '" placeholder="Categoria">' +
      (r.foto ? '' : '<button class="mini bt2" id="rF' + i + '" onclick="gerarFotoRev(' + i + ')">🎨 Criar foto</button>');
    if (r.tamanhos.length){
      r.tamanhos.forEach(function(t, k){ h += '<div class="row tam"><input id="rTn' + i + '_' + k + '" value="' + esc(t.nome) + '" placeholder="Tamanho"><input id="rTp' + i + '_' + k + '" inputmode="decimal" value="' + String(t.preco).replace('.', ',') + '" placeholder="Preço"><button class="mini bt3" style="flex:0 0 auto" onclick="lerRev();REV[' + i + '].tamanhos.splice(' + k + ',1);desenhaRev()">✕</button></div>'; });
      if (!ehPizza(r.cat)) h += '<button class="mini bt3" onclick="lerRev();var r=REV[' + i + '];r.preco=precoMin({tamanhos:r.tamanhos.filter(function(t){return num(t.preco)>0})})||r.preco;r.tamanhos=[];desenhaRev()">✕ tirar tamanhos</button>';
    } else {
      h += '<div class="row"><input id="rP' + i + '" inputmode="decimal" value="' + (r.preco === '' ? '' : String(r.preco).replace('.', ',')) + '" placeholder="Preço (R$)"' + (semP ? ' style="border-color:#f59e0b"' : '') + '>' + (ehPizza(r.cat) ? '<button class="mini bt3" style="flex:0 0 auto" onclick="lerRev();var r=REV[' + i + '];r.tamanhos=tamanhosPizza([],r.preco);desenhaRev()">🍕 P/M/G</button>' : '') + '</div>' +
        (semP ? '<span class="tag esp">⚠️ falta o preço</span>' : '');
    }
    h += '</div></div>';
  });
  h += '<div class="row" style="margin-top:12px;position:sticky;bottom:0;background:var(--bg);padding:8px 0"><button class="bt3" onclick="lerRev();importa(null)">➕ Mais fotos</button><button id="rSalva" onclick="salvaRev()" style="flex:2">Salvar ' + n + ' itens</button></div></div></div>';
  var y = $('folhaRev') ? $('folhaRev').scrollTop : 0;
  $('modal').innerHTML = h; $('folhaRev').scrollTop = y;
}
function lerRev(){
  REV.forEach(function(r, i){
    if (!$('rN' + i)) return; r.nome = $('rN' + i).value.trim(); r.desc = $('rD' + i).value.trim(); r.cat = $('rC' + i).value.trim() || 'Lanches';
    if ($('rP' + i)) r.preco = $('rP' + i).value.trim() === '' ? '' : num($('rP' + i).value);
    r.tamanhos.forEach(function(t, k){ if ($('rTn' + i + '_' + k)){ t.nome = $('rTn' + i + '_' + k).value.trim(); t.preco = num($('rTp' + i + '_' + k).value); } });
  });
}
function fotoRev(i){
  lerRev();
  var esc2 = confirm('OK = tirar foto com a câmera\nCancelar = escolher da galeria');
  pedeFoto(esc2, function(d){ REV[i].foto = d; desenhaRev(); });
}
function salvaRev(){
  lerRev();
  var sel = REV.filter(function(r){ return r.ok && r.nome; }); if (!sel.length) return toast('Marque pelo menos um item.');
  sel.forEach(function(r){ r._t = limpaOpcoes(r.tamanhos).filter(function(t){ return t.preco > 0; }); });
  var semPreco = sel.filter(function(r){ return !r._t.length && !(num(r.preco) > 0); }).length;
  if (semPreco && !confirm(semPreco + ' item(ns) estão sem preço. Eles serão salvos como PAUSADOS (o cliente não vê) até você colocar o preço no Cardápio. Continuar?')) return;
  $('rSalva').disabled = true; $('rSalva').textContent = 'Salvando…';
  var ref = db.collection('ml_lojas').doc(U.uid).collection('itens'), base = Date.now(), k = 0, erros = 0;
  var co = (LD.catOrdem || []).slice(); sel.forEach(function(r){ if (co.indexOf(r.cat) < 0) co.push(r.cat); });
  function prox(){
    if (k >= sel.length){
      salva({catOrdem: co}, erros ? ('Salvo, mas ' + erros + ' itens deram erro.') : (sel.length + ' itens salvos! 🎉'));
      REV = []; fechaModal(); vaiAba('cardapio'); return;
    }
    var r = sel[k], o = k; k++; $('rSalva').textContent = 'Salvando ' + k + ' de ' + sel.length + '…';
    var t = r._t.length > 1 ? r._t : [], preco = t.length ? precoMin({tamanhos: t}) : (r._t.length === 1 ? r._t[0].preco : num(r.preco));
    ref.add({nome: r.nome, desc: r.desc, preco: preco, cat: r.cat, foto: r.foto || '', ativo: preco > 0, ordem: base + o,
      tamanhos: t, adicionais: [], meioMeio: !!(t.length && ehPizza(r.cat))}).then(prox, function(){ erros++; prox(); });
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
  TIPOS_SEL = (LD.tipos || []).slice();
  h += '<div class="card"><h3>Tipo da lanchonete</h3>' + htmlTipos(TIPOS_SEL) + '<p class="sub">Isso cria categorias sugeridas no cardápio, aparece na sua loja e ajuda os robôs a lerem as fotos.</p><button class="full" onclick="salvaTipos()">Salvar tipos</button></div>';
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
function salvaTipos(){
  if (!TIPOS_SEL.length) return toast('Marque pelo menos um tipo.');
  var co = (LD.catOrdem || []).slice(), novas = 0;
  catsDosTipos(TIPOS_SEL).forEach(function(c){ if (co.indexOf(c) < 0){ co.push(c); novas++; } });
  salva({tipos: TIPOS_SEL.slice(), catOrdem: co}, novas ? 'Salvo! ' + novas + ' categorias novas no cardápio ✅' : 'Salvo! ✅');
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


/* ---------- cupons ---------- */
var CUP = [];
function abaCupons(c){
  CUP = JSON.parse(JSON.stringify(LD.cupons || []));
  var h = '<div class="card"><h3>🎟️ Cupons de desconto</h3><p class="sub">Crie um código (ex.: BEMVINDO10) e divulgue. O cliente digita no carrinho e o desconto entra no pedido.</p>';
  if (!CUP.length) h += '<div class="vazio">Nenhum cupom ainda.</div>';
  CUP.forEach(function(x, i){
    h += '<div style="border-top:1px solid var(--linha);padding-top:8px;margin-top:8px">' +
      '<label>Código</label><input id="cC' + i + '" value="' + esc(x.cod) + '" style="text-transform:uppercase" placeholder="BEMVINDO10">' +
      '<div class="row"><div><label>Tipo</label><select id="cT' + i + '"><option value="pct"' + (x.tipo === 'pct' ? ' selected' : '') + '>% de desconto</option><option value="rs"' + (x.tipo === 'rs' ? ' selected' : '') + '>R$ de desconto</option></select></div>' +
      '<div><label>Valor</label><input id="cV' + i + '" inputmode="decimal" value="' + (x.valor ? String(x.valor).replace('.', ',') : '') + '" placeholder="10"></div></div>' +
      '<label>Pedido mínimo (opcional)</label><input id="cM' + i + '" inputmode="decimal" value="' + (x.min ? String(x.min).replace('.', ',') : '') + '" placeholder="Ex.: 30">' +
      '<div class="switch"><span>Cupom ligado</span><input type="checkbox" id="cA' + i + '"' + (x.ativo !== false ? ' checked' : '') + '></div>' +
      '<button class="mini btr" onclick="lerCup();CUP.splice(' + i + ',1);LD.cupons=CUP;abaCupons($(\'conteudo\'))">Apagar cupom</button></div>';
  });
  h += '<button class="bt2 full" style="margin-top:10px" onclick="lerCup();CUP.push({cod:\'\',tipo:\'pct\',valor:10,min:0,ativo:true});LD.cupons=CUP;abaCupons($(\'conteudo\'))">+ Novo cupom</button>' +
    '<button class="full" style="margin-top:10px" onclick="salvaCup()">Salvar</button></div>';
  c.innerHTML = h;
}
function lerCup(){ CUP.forEach(function(x, i){ if ($('cC' + i)){ x.cod = $('cC' + i).value.trim().toUpperCase().replace(/\s+/g, ''); x.tipo = $('cT' + i).value; x.valor = num($('cV' + i).value); x.min = num($('cM' + i).value); x.ativo = $('cA' + i).checked; } }); }
function salvaCup(){
  lerCup();
  for (var i = 0; i < CUP.length; i++){ var x = CUP[i];
    if (!x.cod) return toast('Digite o código do cupom.');
    if (!(x.valor > 0)) return toast('Digite o valor do desconto do cupom ' + x.cod + '.');
    if (x.tipo === 'pct' && x.valor > 100) return toast('O desconto não pode passar de 100%.');
    for (var j = 0; j < i; j++) if (CUP[j].cod === x.cod) return toast('Tem dois cupons com o código ' + x.cod + '.');
  }
  LD.cupons = CUP; salva({cupons: CUP}, 'Cupons salvos! ✅');
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

/* ---------- 🎨 criar foto do lanche com IA ---------- */
var SCHEMA_PROMPT = {type: 'OBJECT', properties: {prompt: {type: 'STRING'}}, required: ['prompt']};
function promptFoto(nome, desc, cat){
  var base = 'professional food photography of ' + nome + (desc ? ', ' + desc : '') + ', appetizing, restaurant menu photo, soft light, no text';
  if (!CFG || !CFG.geminiKey) return Promise.resolve(base);
  return chamaGemini([{text: 'Write a short English prompt (max 60 words) for an AI image generator to create a REALISTIC, appetizing photo of this Brazilian snack bar menu item, showing exactly its ingredients. Item: "' + nome + '". Description: "' + (desc || '') + '". Category: "' + (cat || '') + '". Mention how it is served (ex.: whole pizza on a wooden board seen from above; burger on a board with the bun open showing layers; hot dog in a bun; soda can with ice). End with: professional food photography, soft natural light, shallow depth of field, no text, no logo.'}], SCHEMA_PROMPT)
    .then(function(o){ return o && o.prompt ? String(o.prompt) : base; }, function(){ return base; });
}
function imgDeBlob(b){ return new Promise(function(ok, ruim){ var u = URL.createObjectURL(b), im = new Image(); im.onload = function(){ ok(im); }; im.onerror = function(){ ruim(new Error('img')); }; im.src = u; }); }
function fotoDaImg(im, cortaBaixo){
  var w = im.naturalWidth, h = im.naturalHeight - (cortaBaixo || 0), l = Math.min(w, h);
  var c = document.createElement('canvas'); c.width = l; c.height = l; c.getContext('2d').drawImage(im, (w - l) / 2, 0, l, l, 0, 0, l, l);
  return melhoraFoto(c, 0, 0, l, l, 600);
}
/* 1º tenta a IA de imagem do Google (só funciona com cobrança ativa); se não der, usa a gratuita (Pollinations) */
function fotoGoogle(prompt){
  var mods = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'], i = 0;
  function tenta(){
    var m = mods[i++]; if (!m) return Promise.reject(new Error('sem'));
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent?key=' + encodeURIComponent(CFG.geminiKey), {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({contents: [{parts: [{text: prompt}]}], generationConfig: {responseModalities: ['IMAGE'], imageConfig: {aspectRatio: '1:1'}}})})
      .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error('st' + r.status)); })
      .then(function(j){ var ps = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [], d = null;
        ps.forEach(function(p){ var x = p.inlineData || p.inline_data; if (x && x.data && !d) d = 'data:' + (x.mimeType || x.mime_type || 'image/png') + ';base64,' + x.data; });
        if (!d) throw new Error('vazio'); return fetch(d).then(function(r){ return r.blob(); }); })
      .then(imgDeBlob).then(function(im){ return fotoDaImg(im, 0); })
      .catch(function(){ return tenta(); });
  }
  if (!CFG || !CFG.geminiKey || CFG.semFotoGoogle) return Promise.reject(new Error('sem'));
  return tenta().catch(function(e){ CFG.semFotoGoogle = true; throw e; });
}
function fotoGratis(prompt, onEspera){
  var tent = 0, seed = Math.floor(Math.random() * 99999);
  function vai(){
    tent++;
    var u = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt.slice(0, 700)) + '?width=768&height=816&nologo=true&seed=' + seed;
    var ac = window.AbortController ? new AbortController() : null, tmo = ac ? setTimeout(function(){ ac.abort(); }, 90000) : 0;
    return fetch(u, {signal: ac ? ac.signal : undefined}).then(function(r){
      clearTimeout(tmo);
      if (r.ok && /image/.test(r.headers.get('content-type') || '')) return r.blob().then(imgDeBlob).then(function(im){ return fotoDaImg(im, Math.round(im.naturalHeight * 0.06)); });
      var esp = Math.min(50, Math.max(10, parseInt(r.headers.get('retry-after') || '0', 10) || (r.status === 402 || r.status === 429 ? 46 : 12)));
      if (tent >= 4) throw new Error('A IA de fotos grátis está ocupada. Tente de novo em 1 minuto.');
      return new Promise(function(ok){ var s = esp; (function c(){ if (onEspera) onEspera(s); if (s-- <= 0) return ok(); setTimeout(c, 1000); })(); }).then(vai);
    }, function(){ clearTimeout(tmo); if (tent >= 3) throw new Error('Sem internet ou a IA de fotos demorou demais.'); return vai(); });
  }
  return vai();
}
function criaFotoIA(nome, desc, cat, onEspera){
  return promptFoto(nome, desc, cat).then(function(p){ return fotoGoogle(p).catch(function(){ return fotoGratis(p, onEspera); }); });
}
function gerarFotoEdit(){
  lerEdit(); var e = EDIT;
  if (!e.nome) return toast('Digite o nome do lanche primeiro.');
  if (e.foto && !confirm('Trocar a foto atual por uma criada pela IA?')) return;
  var b = $('eFotoIA'); b.disabled = true; b.textContent = '🎨 Criando a foto… (até 1 min)';
  criaFotoIA(e.nome, e.desc, e.cat, function(s){ if ($('eFotoIA')) $('eFotoIA').textContent = '🎨 Fila da IA grátis… ' + s + 's'; })
    .then(function(d){ lerEdit(); EDIT.foto = d; EDIT.fotoIA = true; desenhaEdit(); toast('Foto criada! É uma ilustração: confira se ficou parecida ✨', 4500); },
      function(x){ var bb = $('eFotoIA'); if (bb){ bb.disabled = false; bb.textContent = '🎨 Criar foto com IA (pelos ingredientes)'; } toast(x.message || 'Não deu certo. Tente de novo.', 4500); });
}
function gerarFotoRev(i){
  lerRev(); var r = REV[i]; if (!r || !r.nome) return toast('Coloque o nome primeiro.');
  var b = $('rF' + i); if (b){ b.disabled = true; b.textContent = '🎨 Criando…'; }
  criaFotoIA(r.nome, r.desc, r.cat, function(s){ var bb = $('rF' + i); if (bb) bb.textContent = '⏳ ' + s + 's'; })
    .then(function(d){ lerRev(); REV[i].foto = d; desenhaRev(); }, function(x){ var bb = $('rF' + i); if (bb){ bb.disabled = false; bb.textContent = '🎨 Criar foto'; } toast(x.message || 'Não deu certo.', 4500); });
}
