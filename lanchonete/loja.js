/* Meu Lanche Pro — loja do cliente */
var LJ = null, LJID = null, ITENS = [], CAR = {}, CLI = {}, LOC = null;

function abreLoja(slug){
  window.__naoRecarregar = true;
  try { CLI = JSON.parse(localStorage.getItem('ml_cliente') || '{}'); } catch (e) { CLI = {}; }
  if (CLI.lat != null) LOC = {lat: CLI.lat, lng: CLI.lng};
  db.collection('ml_lojas').where('slug', '==', slug).limit(1).get().then(function(s){
    if (s.empty) return lojaErro('Não achamos essa lanchonete. Confira o link.');
    LJ = s.docs[0].data(); LJID = s.docs[0].id;
    var ven = LJ.validade && LJ.validade.toDate && LJ.validade.toDate() < new Date();
    if (LJ.status !== 'liberado' || ven) return lojaErro('Esta lanchonete está indisponível no momento.');
    aplicaTema(LJ.tema); document.title = LJ.nome || 'Meu Lanche';
    try { CAR = JSON.parse(sessionStorage.getItem('ml_car_' + LJID) || '{}'); } catch (e) { CAR = {}; }
    return db.collection('ml_lojas').doc(LJID).collection('itens').get().then(function(si){
      ITENS = si.docs.map(function(d){ var x = d.data(); x.id = d.id; return x; }).filter(function(x){ return x.ativo !== false; });
      ITENS.sort(ordemItens); desenhaLoja();
    });
  }).catch(function(e){ lojaErro('Sem conexão. Verifique a internet e abra de novo. (' + (e.code || e.message) + ')'); });
}
function ordemItens(a, b){
  var co = (LJ && LJ.catOrdem) || [], ia = co.indexOf(a.cat), ib = co.indexOf(b.cat);
  if (ia < 0) ia = 999; if (ib < 0) ib = 999;
  if (ia !== ib) return ia - ib;
  if ((a.cat || '') !== (b.cat || '')) return (a.cat || '').localeCompare(b.cat || '');
  return (a.ordem || 0) - (b.ordem || 0) || (a.nome || '').localeCompare(b.nome || '');
}
function lojaErro(t){ $('raiz').innerHTML = '<div class="hero"><div class="ico">🍔</div><h2>Ops!</h2><p class="sub">' + esc(t) + '</p></div>'; }
function cats(){ var c = []; ITENS.forEach(function(i){ var k = i.cat || 'Cardápio'; if (c.indexOf(k) < 0) c.push(k); }); return c; }

function desenhaLoja(){
  var aberto = abertoAgora(LJ.horario), h = '';
  h += '<div class="topo"><div class="lin">' + (LJ.logo ? '<img class="logo" src="' + LJ.logo + '" alt="">' : '<div style="font-size:46px">🍔</div>') +
    '<div><h1>' + esc(LJ.nome || 'Lanchonete') + '</h1><small>' + (aberto ? '🟢 Aberto agora' : '🔴 Fechado') + (LJ.endereco ? ' • ' + esc(LJ.endereco) : '') + '</small></div></div></div>';
  h += '<div class="wrap">';
  if (!aberto){ var pa = proximaAbertura(LJ.horario); h += '<div class="fechado">Estamos fechados agora' + (pa ? ' — abrimos ' + esc(pa) : '') + '. Você pode olhar o cardápio à vontade! 😉</div>'; }
  if (LJ.aviso) h += '<div class="aviso">' + esc(LJ.aviso) + '</div>';
  var cs = cats();
  if (cs.length > 1){ h += '<div class="chips">'; cs.forEach(function(c, i){ h += '<a href="#cat' + i + '">' + esc(c) + '</a>'; }); h += '</div>'; }
  if (!ITENS.length) h += '<div class="vazio">O cardápio ainda está sendo montado. Volte daqui a pouco!</div>';
  cs.forEach(function(c, ci){
    h += '<h2 id="cat' + ci + '" style="margin:18px 2px 8px;font-size:19px">' + esc(c) + '</h2><div class="grade ' + (LJ.layout === 'lista' ? 'lista' : '') + '">';
    ITENS.filter(function(i){ return (i.cat || 'Cardápio') === c; }).forEach(function(i){
      h += '<div class="prod">' + (i.foto ? '<img class="ft" loading="lazy" src="' + i.foto + '" alt="">' : '<div class="ft">🍔</div>') +
        '<div class="in"><b>' + esc(i.nome) + '</b><p>' + esc(i.desc || '') + '</p><div class="pr"><span>' + brl(i.preco) + '</span>' + botaoQtd(i.id, aberto) + '</div></div></div>';
    });
    h += '</div>';
  });
  h += '<p class="sub" style="text-align:center;margin-top:30px">' + (LJ.zap ? '<a href="' + zapLink(LJ.zap, 'Olá!') + '" target="_blank">💬 Falar no WhatsApp</a>' : '') + '</p></div>';
  h += '<div id="barra"></div>';
  $('raiz').innerHTML = h; barra();
}
function botaoQtd(id, aberto){
  if (!aberto) return '';
  var q = CAR[id] || 0;
  if (!q) return '<button class="mini" onclick="mais(\'' + id + '\')">+ Adicionar</button>';
  return '<span class="qtd"><button onclick="menos(\'' + id + '\')">−</button><b>' + q + '</b><button onclick="mais(\'' + id + '\')">+</button></span>';
}
function salvaCar(){ try { sessionStorage.setItem('ml_car_' + LJID, JSON.stringify(CAR)); } catch (e) {} }
function mais(id){ CAR[id] = (CAR[id] || 0) + 1; salvaCar(); atualizaQtd(); }
function menos(id){ CAR[id] = (CAR[id] || 0) - 1; if (CAR[id] <= 0) delete CAR[id]; salvaCar(); atualizaQtd(); }
function atualizaQtd(){ var y = window.scrollY; desenhaLoja(); window.scrollTo(0, y); if ($('folhaCar')) desenhaCarrinho(); }
function itensCar(){ return ITENS.filter(function(i){ return CAR[i.id]; }).map(function(i){ return {id: i.id, nome: i.nome, preco: Number(i.preco) || 0, qtd: CAR[i.id]}; }); }
function subtotal(){ return itensCar().reduce(function(s, i){ return s + i.preco * i.qtd; }, 0); }
function barra(){
  var n = itensCar().reduce(function(s, i){ return s + i.qtd; }, 0);
  $('barra').innerHTML = n ? '<div class="carrinho" onclick="desenhaCarrinho()"><span>🛒 ' + n + ' ' + (n > 1 ? 'itens' : 'item') + '</span><span>Ver pedido • ' + brl(subtotal()) + '</span></div>' : '';
}

/* ---------- carrinho / finalizar ---------- */
var EST = {entrega: 'entrega', pag: '', troco: '', obs: ''};
function fechaModal(){ $('modal').innerHTML = ''; }
function calcTaxa(){
  if (EST.entrega !== 'entrega') return {taxa: 0};
  if (!LOC || LJ.lat == null) return {taxa: 0, combinar: true};
  var d = distKm(LJ.lat, LJ.lng, LOC.lat, LOC.lng), f = taxaPorDist(LJ.faixas, d);
  if (!f) return {taxa: 0, dist: d, fora: true};
  return {taxa: Number(f.valor) || 0, dist: d};
}
function desenhaCarrinho(){
  guardaCampos();
  var its = itensCar(); if (!its.length){ fechaModal(); return; }
  var pg = LJ.pag || {dinheiro: true, cartao: true, pix: false};
  if (!EST.pag) EST.pag = pg.pix ? 'pix' : pg.dinheiro ? 'dinheiro' : 'cartao';
  if (LJ.semEntrega) EST.entrega = 'retirada';
  if (LJ.retirada === false && !LJ.semEntrega) EST.entrega = 'entrega';
  var t = calcTaxa(), sub = subtotal(), tot = sub + (t.taxa || 0), h = '';
  h += '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" id="folhaCar"><button class="fecha" onclick="fechaModal()">✕</button><h2>🛒 Seu pedido</h2>';
  its.forEach(function(i){ h += '<div class="linhaitem"><div><b>' + esc(i.nome) + '</b><div class="sub">' + brl(i.preco) + ' cada</div></div><span class="qtd"><button onclick="menos(\'' + i.id + '\')">−</button><b>' + i.qtd + '</b><button onclick="mais(\'' + i.id + '\')">+</button></span><b style="min-width:78px;text-align:right">' + brl(i.preco * i.qtd) + '</b></div>'; });
  h += '<label>Alguma observação?</label><textarea id="cObs" placeholder="Ex.: sem cebola, maionese à parte" oninput="EST.obs=this.value">' + esc(EST.obs) + '</textarea>';

  h += '<div class="card"><h3>Seus dados</h3><p class="sub">Fica salvo neste celular para o próximo pedido.</p>' +
    '<label>Nome</label><input id="cNome" value="' + esc(CLI.nome || '') + '" placeholder="Seu nome" autocomplete="name">' +
    '<label>WhatsApp</label><input id="cTel" type="tel" value="' + esc(CLI.tel || '') + '" placeholder="(92) 99999-9999" autocomplete="tel"></div>';

  h += '<div class="card"><h3>Como quer receber?</h3><div class="opc">';
  if (!LJ.semEntrega) h += opc('ent', 'entrega', '🛵 Entrega', EST.entrega === 'entrega');
  if (LJ.retirada !== false || LJ.semEntrega) h += opc('ent', 'retirada', '🛍️ Retirar no local', EST.entrega === 'retirada');
  h += '</div>';
  if (EST.entrega === 'entrega'){
    h += '<label>Rua</label><input id="cRua" value="' + esc(CLI.rua || '') + '" placeholder="Rua / Avenida">' +
      '<div class="row"><div><label>Número</label><input id="cNum" value="' + esc(CLI.num || '') + '" placeholder="Nº"></div><div style="flex:2"><label>Bairro</label><input id="cBairro" value="' + esc(CLI.bairro || '') + '" placeholder="Bairro"></div></div>' +
      '<label>Ponto de referência</label><input id="cRef" value="' + esc(CLI.ref || '') + '" placeholder="Ex.: perto da escola, portão azul">' +
      '<button class="bt2 full" style="margin-top:12px" onclick="pegaLocal()">📍 ' + (LOC ? 'Atualizar minha localização' : 'Enviar minha localização') + '</button>';
    if (t.fora) h += '<div class="aviso no">Você está a ' + t.dist.toFixed(1).replace('.', ',') + ' km. Não entregamos tão longe' + (LJ.retirada !== false ? '. Você pode escolher retirar no local.' : '.') + '</div>';
    else if (t.dist != null) h += '<div class="aviso ok">Distância: ' + t.dist.toFixed(1).replace('.', ',') + ' km • Taxa de entrega: <b>' + brl(t.taxa) + '</b></div>';
    else h += '<div class="aviso">Toque em <b>Enviar minha localização</b> para calcular a taxa de entrega. Se não der, a taxa é combinada pelo WhatsApp.</div>';
  } else if (LJ.endereco) h += '<div class="aviso ok">Retirada em: ' + esc(LJ.endereco) + '</div>';
  h += '</div>';

  h += '<div class="card"><h3>Pagamento</h3><div class="opc">';
  if (pg.pix) h += opc('pag', 'pix', '💠 Pix', EST.pag === 'pix');
  if (pg.dinheiro) h += opc('pag', 'dinheiro', '💵 Dinheiro', EST.pag === 'dinheiro');
  if (pg.cartao) h += opc('pag', 'cartao', '💳 Cartão', EST.pag === 'cartao');
  h += '</div>';
  if (EST.pag === 'dinheiro') h += '<label>Troco para quanto? (deixe vazio se não precisa)</label><input id="cTroco" inputmode="decimal" value="' + esc(EST.troco) + '" placeholder="Ex.: 50" oninput="EST.troco=this.value">';
  if (EST.pag === 'pix' && pg.pixChave) h += '<div class="aviso ok">Chave Pix' + (pg.pixTipo ? ' (' + esc(pg.pixTipo) + ')' : '') + ': <b>' + esc(pg.pixChave) + '</b>' + (pg.pixNome ? '<br>Nome: ' + esc(pg.pixNome) : '') + '<br><button class="mini" style="margin-top:8px" onclick="copiar(LJ.pag.pixChave,\'Chave Pix copiada!\')">Copiar chave Pix</button></div>';
  if (EST.pag === 'cartao') h += '<p class="sub">O entregador leva a maquininha.</p>';
  h += '</div>';

  h += '<div class="card"><div class="linhaitem"><span>Subtotal</span><b>' + brl(sub) + '</b></div>';
  if (EST.entrega === 'entrega') h += '<div class="linhaitem"><span>Entrega</span><b>' + (t.combinar ? 'a combinar' : t.fora ? '—' : brl(t.taxa)) + '</b></div>';
  h += '<div class="linhaitem" style="font-size:20px"><span>Total</span><b style="color:var(--p)">' + brl(tot) + '</b></div></div>';
  if (LJ.pedMin && sub < LJ.pedMin) h += '<div class="aviso no">Pedido mínimo: ' + brl(LJ.pedMin) + '</div>';
  h += '<button class="btz full" id="btFin" style="font-size:18px;padding:16px" onclick="finaliza()">Enviar pedido pelo WhatsApp</button></div></div>';
  var y = $('folhaCar') ? $('folhaCar').scrollTop : 0;
  $('modal').innerHTML = h; $('folhaCar').scrollTop = y;
}
function opc(g, v, t, on){ return '<label class="' + (on ? 'on' : '') + '" onclick="escolhe(\'' + g + '\',\'' + v + '\')">' + t + '</label>'; }
function escolhe(g, v){ guardaCampos(); if (g === 'ent') EST.entrega = v; else EST.pag = v; desenhaCarrinho(); }
function guardaCampos(){
  ['Nome', 'Tel', 'Rua', 'Num', 'Bairro', 'Ref'].forEach(function(k){ var e = $('c' + k); if (e) CLI[k.toLowerCase()] = e.value.trim(); });
  if ($('cObs')) EST.obs = $('cObs').value; if ($('cTroco')) EST.troco = $('cTroco').value;
}
function pegaLocal(){
  if (!navigator.geolocation) return toast('Seu celular não permite pegar a localização.');
  guardaCampos(); toast('Pegando sua localização…', 6000);
  navigator.geolocation.getCurrentPosition(function(p){
    LOC = {lat: p.coords.latitude, lng: p.coords.longitude}; CLI.lat = LOC.lat; CLI.lng = LOC.lng; toast('Localização recebida! 📍'); desenhaCarrinho();
  }, function(){ toast('Não deu para pegar a localização. Ative o GPS e permita o acesso.', 4000); }, {enableHighAccuracy: true, timeout: 20000, maximumAge: 60000});
}
function finaliza(){
  guardaCampos();
  if (!abertoAgora(LJ.horario)) return toast('A lanchonete fechou agora há pouco. 😕');
  if (!CLI.nome) return toast('Digite seu nome.');
  if (soNum(CLI.tel).length < 10) return toast('Digite seu WhatsApp com DDD.');
  var t = calcTaxa(), sub = subtotal();
  if (LJ.pedMin && sub < LJ.pedMin) return toast('Pedido mínimo: ' + brl(LJ.pedMin));
  if (EST.entrega === 'entrega'){
    if (!CLI.rua || !CLI.num || !CLI.bairro) return toast('Preencha rua, número e bairro.');
    if (t.fora) return toast('Endereço fora da área de entrega.');
  }
  if (!EST.pag) return toast('Escolha a forma de pagamento.');
  var troco = EST.pag === 'dinheiro' ? num(EST.troco) : 0;
  var tot = sub + (t.taxa || 0);
  if (troco && troco < tot) return toast('O troco precisa ser maior que o total (' + brl(tot) + ').');
  var salvo = {nome: CLI.nome, tel: CLI.tel, rua: CLI.rua || '', num: CLI.num || '', bairro: CLI.bairro || '', ref: CLI.ref || ''};
  if (LOC){ salvo.lat = LOC.lat; salvo.lng = LOC.lng; }
  try { localStorage.setItem('ml_cliente', JSON.stringify(salvo)); } catch (e) {}
  var cli = {nome: CLI.nome, tel: CLI.tel};
  if (EST.entrega === 'entrega'){ cli.rua = CLI.rua; cli.num = CLI.num; cli.bairro = CLI.bairro; cli.ref = CLI.ref || ''; if (LOC){ cli.lat = LOC.lat; cli.lng = LOC.lng; } }
  var d = new Date(), numero = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(Math.floor(Math.random() * 90 + 10));
  var p = {lojaId: LJID, numero: numero, itens: itensCar().map(function(i){ return {nome: i.nome, qtd: i.qtd, preco: i.preco}; }), obs: (EST.obs || '').trim(),
    subtotal: sub, taxa: t.taxa || 0, taxaCombinar: !!t.combinar, dist: t.dist != null ? Math.round(t.dist * 10) / 10 : null, total: tot,
    entrega: EST.entrega, pag: {tipo: EST.pag, troco: troco || 0}, cliente: cli, status: 'novo', criadoEm: firebase.firestore.FieldValue.serverTimestamp()};
  var texto = textoPedido(p, LJ);
  $('btFin').disabled = true; $('btFin').textContent = 'Enviando…';
  var foi = false;
  function vai(){ if (foi) return; foi = true; CAR = {}; salvaCar(); fechaModal(); desenhaLoja(); obrigado(texto); location.href = zapLink(LJ.zap, texto); }
  db.collection('ml_pedidos').add(p).then(vai, vai); setTimeout(vai, 3500);
}
function obrigado(texto){
  $('modal').innerHTML = '<div class="fundo"><div class="folha" style="text-align:center"><div style="font-size:60px">🎉</div><h2>Pedido feito!</h2><p class="sub">Agora é só tocar em <b>Enviar</b> no WhatsApp da lanchonete.</p>' +
    '<a class="bt btz full" href="' + zapLink(LJ.zap, texto) + '">Abrir WhatsApp de novo</a><p></p><button class="bt3 full" onclick="fechaModal()">Voltar ao cardápio</button></div></div>';
}
