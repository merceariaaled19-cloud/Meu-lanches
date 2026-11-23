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
    Object.keys(CAR).forEach(function(k){ if (typeof CAR[k] === 'number') CAR[k] = {id: k, qtd: CAR[k], adds: []}; else if (!CAR[k] || !CAR[k].id) delete CAR[k]; });
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
  if ((LJ.tipos || []).length) h += '<div class="tiposloja">' + TIPOS_ORDEM.filter(function(t){ return LJ.tipos.indexOf(t) >= 0; }).map(function(t){ return '<span>' + TIPOS[t].ico + ' ' + esc(TIPOS[t].nome.replace(/ \(.*\)/, '')) + '</span>'; }).join('') + '</div>';
  if (cs.length > 1){ h += '<div class="chips">'; cs.forEach(function(c, i){ h += '<a href="#cat' + i + '"><i>' + icoCat(c) + '</i>' + esc(c) + '</a>'; }); h += '</div>'; }
  if (!ITENS.length) h += '<div class="vazio">O cardápio ainda está sendo montado. Volte daqui a pouco!</div>';
  var monteFeito = false;
  cs.forEach(function(c, ci){
    h += '<h2 id="cat' + ci + '" class="tcat"><span>' + icoCat(c) + '</span>' + esc(c) + '</h2>';
    if (!monteFeito && aberto && ehPizza(c) && tamsPizzaLoja().length){ monteFeito = true; h += '<button class="full" style="margin:0 0 12px" onclick="abreMonte()">🍕 Monte sua pizza (até 4 sabores)</button>'; }
    h += '<div class="grade ' + (LJ.layout === 'lista' ? 'lista' : '') + '">';
    ITENS.filter(function(i){ return (i.cat || 'Cardápio') === c; }).forEach(function(i){
      var op = temOpcoes(i);
      h += '<div class="prod"' + (op && aberto ? ' onclick="if(event.target.tagName!==\'BUTTON\')abreOpcoes(\'' + i.id + '\')"' : '') + '>' + (i.foto ? '<img class="ft" loading="lazy" src="' + i.foto + '" alt="">' : '<div class="ft">' + icoCat(i.cat) + '</div>') +
        '<div class="in"><b>' + esc(i.nome) + '</b><p>' + esc(i.desc || '') + '</p>' + (i.tamanhos && i.tamanhos.length ? '<small class="tams">' + i.tamanhos.map(function(t){ return esc(t.nome); }).join(' • ') + '</small>' : '') +
        '<div class="pr"><span>' + (i.tamanhos && i.tamanhos.length > 1 ? '<small>a partir de</small> ' : '') + brl(precoMin(i)) + '</span>' + botaoQtd(i, aberto) + '</div></div></div>';
    });
    h += '</div>';
  });
  h += '<p class="sub" style="text-align:center;margin-top:30px">' + (LJ.zap ? '<a href="' + zapLink(LJ.zap, 'Olá!') + '" target="_blank">💬 Falar no WhatsApp</a>' : '') + '</p></div>';
  h += '<div id="barra"></div>';
  $('raiz').innerHTML = h; barra();
}
function botaoQtd(i, aberto){
  if (!aberto) return '';
  var id = i.id;
  if (temOpcoes(i)){ var n = qtdDoItem(id); return '<button class="mini" onclick="abreOpcoes(\'' + id + '\')">' + (n ? '✓ ' + n + ' • +' : '+ Escolher') + '</button>'; }
  var q = CAR[id] ? CAR[id].qtd : 0;
  if (!q) return '<button class="mini" onclick="mais(\'' + id + '\')">+ Adicionar</button>';
  return '<span class="qtd"><button onclick="menos(\'' + id + '\')">−</button><b>' + q + '</b><button onclick="mais(\'' + id + '\')">+</button></span>';
}
function salvaCar(){ try { sessionStorage.setItem('ml_car_' + LJID, JSON.stringify(CAR)); } catch (e) {} }
function qtdDoItem(id){ var n = 0; Object.keys(CAR).forEach(function(k){ if (CAR[k].id === id) n += CAR[k].qtd; }); return n; }
function mais(id){ if (!CAR[id]) CAR[id] = {id: id, qtd: 0, adds: []}; CAR[id].qtd++; salvaCar(); atualizaQtd(); }
function menos(id){ if (!CAR[id]) return; CAR[id].qtd--; if (CAR[id].qtd <= 0) delete CAR[id]; salvaCar(); atualizaQtd(); }
var LINHAS = [];
function maisL(k){ var c = LINHAS[k]; if (c && CAR[c]){ CAR[c].qtd++; salvaCar(); atualizaQtd(); } }
function menosL(k){ var c = LINHAS[k]; if (c && CAR[c]){ CAR[c].qtd--; if (CAR[c].qtd <= 0) delete CAR[c]; salvaCar(); atualizaQtd(); } }
function itemPorId(id){ return ITENS.filter(function(x){ return x.id === id; })[0]; }

/* ---------- escolher tamanho / meio a meio / adicionais ---------- */
var OPC = null;
function abreOpcoes(id){ var i = itemPorId(id); if (!i) return; OPC = {id: id, tam: i.tamanhos && i.tamanhos.length ? 0 : null, meio: '', adds: [], qtd: 1}; desenhaOpcoes(); }
function ehSabor(x){ return x && x.ativo !== false && (x.meioMeio || ehPizza(x.cat)); }
function saboresMeio(i){
  if (!ehSabor(i)) return [];
  var tn = i.tamanhos && i.tamanhos.length ? (i.tamanhos[OPC.tam] || {}).nome : null;
  return ITENS.filter(function(x){ return x.id !== i.id && ehSabor(x) && (!tn || (x.tamanhos || []).some(function(t){ return chaveTam(t.nome) === chaveTam(tn); })); });
}
function maxDoOpc(i){ return i.tamanhos && i.tamanhos.length ? maxSabores((i.tamanhos[OPC.tam] || {}).nome) : 2; }
function outrosOpc(){ return (OPC.meio ? OPC.meio.split(',') : []).map(itemPorId).filter(Boolean); }
function togSab(id){
  var i = itemPorId(OPC.id), l = OPC.meio ? OPC.meio.split(',') : [], p = l.indexOf(id);
  if (p >= 0) l.splice(p, 1); else { if (l.length + 1 >= maxDoOpc(i)) return toast('Esse tamanho aceita até ' + maxDoOpc(i) + ' sabor' + (maxDoOpc(i) > 1 ? 'es' : '') + '.'); l.push(id); }
  OPC.meio = l.join(','); desenhaOpcoes();
}
/* Monte sua pizza: escolhe o tamanho e depois os sabores */
function tamsPizzaLoja(){
  var m = {}; ITENS.forEach(function(x){ if (ehSabor(x) && ehPizza(x.cat)) (x.tamanhos || []).forEach(function(t){ var k = chaveTam(t.nome); if (MAX_SAB[k] && !m[k]) m[k] = t.nome; }); });
  return ['broto', 'p', 'm', 'g', 'fam'].filter(function(k){ return m[k]; }).map(function(k){ return {k: k, nome: m[k]}; });
}
var MONTE = null;
function abreMonte(){ var ts = tamsPizzaLoja(); if (!ts.length) return; MONTE = {k: ts[Math.min(2, ts.length - 1)].k, sab: [], qtd: 1}; desenhaMonte(); }
function sabMonte(){ return ITENS.filter(function(x){ return ehSabor(x) && ehPizza(x.cat) && (x.tamanhos || []).some(function(t){ return chaveTam(t.nome) === MONTE.k; }); }); }
function togMonte(id){ var p = MONTE.sab.indexOf(id), mx = MAX_SAB[MONTE.k] || 2; if (p >= 0) MONTE.sab.splice(p, 1); else { if (MONTE.sab.length >= mx){ if (mx === 1) MONTE.sab = []; else return toast('Esse tamanho aceita até ' + mx + ' sabores.'); } MONTE.sab.push(id); } desenhaMonte(); }
function desenhaMonte(){
  var ts = tamsPizzaLoja(), mx = MAX_SAB[MONTE.k] || 2, ss = sabMonte();
  MONTE.sab = MONTE.sab.filter(function(id){ return ss.some(function(x){ return x.id === id; }); }).slice(0, mx);
  var esc1 = MONTE.sab.map(itemPorId), p = 0, tn = (ts.filter(function(t){ return t.k === MONTE.k; })[0] || {}).nome;
  esc1.forEach(function(x){ p = Math.max(p, precoNoTam(x, tn, 0)); });
  var h = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" id="folhaOpc"><button class="fecha" onclick="fechaModal()">✕</button><h2>🍕 Monte sua pizza</h2>' +
    '<div class="card"><h3>1. Tamanho</h3><div class="opc">' + ts.map(function(t){ return '<label class="' + (MONTE.k === t.k ? 'on' : '') + '" onclick="MONTE.k=\'' + t.k + '\';desenhaMonte()"><b>' + esc(t.nome) + '</b><br><small>' + MAX_SAB[t.k] + ' sabor' + (MAX_SAB[t.k] > 1 ? 'es' : '') + '</small></label>'; }).join('') + '</div></div>' +
    '<div class="card"><h3>2. Sabores <small class="sub">(' + MONTE.sab.length + ' de ' + mx + ')</small></h3>' +
    ss.map(function(x){ var on = MONTE.sab.indexOf(x.id) >= 0; return '<div class="switch" onclick="togMonte(\'' + x.id + '\')"><span>' + esc(x.nome) + ' <b>' + brl(precoNoTam(x, tn, 0)) + '</b>' + (x.desc ? '<br><small class="sub">' + esc(x.desc) + '</small>' : '') + '</span><input type="checkbox"' + (on ? ' checked' : '') + ' onclick="event.stopPropagation();togMonte(\'' + x.id + '\')"></div>'; }).join('') +
    '<p class="sub">Com mais de um sabor, vale o preço do sabor mais caro.</p></div>' +
    '<div class="row" style="margin-top:12px"><span class="qtd" style="flex:0 0 auto"><button onclick="if(MONTE.qtd>1){MONTE.qtd--;desenhaMonte()}">−</button><b>' + MONTE.qtd + '</b><button onclick="MONTE.qtd++;desenhaMonte()">+</button></span>' +
    '<button style="flex:1"' + (MONTE.sab.length ? '' : ' disabled') + ' onclick="addMonte()">' + (MONTE.sab.length ? 'Adicionar • ' + brl(p * MONTE.qtd) : 'Escolha os sabores') + '</button></div></div></div>';
  var y = $('folhaOpc') ? $('folhaOpc').scrollTop : 0; $('modal').innerHTML = h; $('folhaOpc').scrollTop = y;
}
function addMonte(){
  if (!MONTE.sab.length) return;
  var i = itemPorId(MONTE.sab[0]), tam = 0; (i.tamanhos || []).forEach(function(t, k){ if (chaveTam(t.nome) === MONTE.k) tam = k; });
  var o = {tam: i.tamanhos && i.tamanhos.length ? tam : null, meio: MONTE.sab.slice(1).join(','), adds: []}, k = chaveLinha(i.id, o);
  if (!CAR[k]) CAR[k] = {id: i.id, tam: o.tam, meio: o.meio, adds: [], qtd: 0};
  CAR[k].qtd += MONTE.qtd; salvaCar(); fechaModal(); atualizaQtd(); toast('Pizza adicionada! 🍕');
}
function desenhaOpcoes(){
  var i = itemPorId(OPC.id); if (!i) return fechaModal();
  var sab = saboresMeio(i), mx = maxDoOpc(i);
  OPC.meio = (OPC.meio ? OPC.meio.split(',') : []).filter(function(id){ return sab.some(function(x){ return x.id === id; }); }).slice(0, Math.max(0, mx - 1)).join(',');
  var outro = outrosOpc(), pu = precoLinha(i, OPC, outro);
  var h = '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" id="folhaOpc"><button class="fecha" onclick="fechaModal()">✕</button>' +
    (i.foto ? '<img src="' + i.foto + '" style="width:100%;max-height:230px;object-fit:cover;border-radius:16px">' : '') + '<h2>' + esc(i.nome) + '</h2>' + (i.desc ? '<p class="sub">' + esc(i.desc) + '</p>' : '');
  if (i.tamanhos && i.tamanhos.length){
    h += '<div class="card"><h3>Tamanho</h3><div class="opc">' + i.tamanhos.map(function(t, k){ return '<label class="' + (OPC.tam === k ? 'on' : '') + '" onclick="OPC.tam=' + k + ';desenhaOpcoes()"><b>' + esc(t.nome) + '</b><br>' + brl(t.preco) + '</label>'; }).join('') + '</div></div>';
  }
  if (sab.length && mx > 1){
    h += '<div class="card"><h3>🍕 Mais sabores? <small class="sub">(até ' + mx + ' no total)</small></h3>' + sab.map(function(x){ var on = OPC.meio.split(',').indexOf(x.id) >= 0; return '<div class="switch" onclick="togSab(\'' + x.id + '\')"><span>' + esc(x.nome) + '</span><input type="checkbox"' + (on ? ' checked' : '') + ' onclick="event.stopPropagation();togSab(\'' + x.id + '\')"></div>'; }).join('') + '<p class="sub">Com mais de um sabor, vale o preço do sabor mais caro.</p></div>';
  }
  if (i.adicionais && i.adicionais.length){
    h += '<div class="card"><h3>Adicionais <small class="sub">(opcional)</small></h3>' + i.adicionais.map(function(a, k){ var on = OPC.adds.indexOf(k) >= 0; return '<div class="switch" onclick="togAdd(' + k + ')"><span>' + esc(a.nome) + ' <b>+ ' + brl(a.preco) + '</b></span><input type="checkbox"' + (on ? ' checked' : '') + ' onclick="event.stopPropagation();togAdd(' + k + ')"></div>'; }).join('') + '</div>';
  }
  h += '<div class="row" style="margin-top:12px"><span class="qtd" style="flex:0 0 auto"><button onclick="if(OPC.qtd>1){OPC.qtd--;desenhaOpcoes()}">−</button><b>' + OPC.qtd + '</b><button onclick="OPC.qtd++;desenhaOpcoes()">+</button></span>' +
    '<button style="flex:1" onclick="addOpcoes()">Adicionar • ' + brl(pu * OPC.qtd) + '</button></div></div></div>';
  var y = $('folhaOpc') ? $('folhaOpc').scrollTop : 0; $('modal').innerHTML = h; $('folhaOpc').scrollTop = y;
}
function togAdd(k){ var p = OPC.adds.indexOf(k); if (p >= 0) OPC.adds.splice(p, 1); else OPC.adds.push(k); desenhaOpcoes(); }
function addOpcoes(){
  var o = {tam: OPC.tam, meio: OPC.meio || '', adds: OPC.adds.slice().sort(function(a, b){ return a - b; })}, k = chaveLinha(OPC.id, o);
  if (!CAR[k]) CAR[k] = {id: OPC.id, tam: o.tam, meio: o.meio, adds: o.adds, qtd: 0};
  CAR[k].qtd += OPC.qtd; salvaCar(); fechaModal(); atualizaQtd(); toast('Adicionado ao pedido! 🛒');
}
function atualizaQtd(){ var y = window.scrollY; desenhaLoja(); window.scrollTo(0, y); if ($('folhaCar')) desenhaCarrinho(); }
function itensCar(){
  var r = [];
  Object.keys(CAR).forEach(function(k){
    var c = CAR[k], i = itemPorId(c.id); if (!i || !(c.qtd > 0)) return;
    var outro = (c.meio ? String(c.meio).split(',') : []).map(itemPorId).filter(Boolean), o = {tam: c.tam, meio: outro.length ? outro.map(function(x){ return x.id; }).join(',') : '', adds: c.adds || []};
    r.push({k: k, id: i.id, nome: nomeLinha(i, o, outro), preco: precoLinha(i, o, outro), qtd: c.qtd});
  });
  return r;
}
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
  var t = calcTaxa(), sub = subtotal(), cu = descCupom(LJ, EST.cupom, sub), tot = sub - cu.d + (t.taxa || 0), h = '';
  h += '<div class="fundo" onclick="if(event.target===this)fechaModal()"><div class="folha" id="folhaCar"><button class="fecha" onclick="fechaModal()">✕</button><h2>🛒 Seu pedido</h2>';
  LINHAS = its.map(function(i){ return i.k; });
  its.forEach(function(i, n){ h += '<div class="linhaitem"><div><b>' + esc(i.nome) + '</b><div class="sub">' + brl(i.preco) + ' cada</div></div><span class="qtd"><button onclick="menosL(' + n + ')">−</button><b>' + i.qtd + '</b><button onclick="maisL(' + n + ')">+</button></span><b style="min-width:78px;text-align:right">' + brl(i.preco * i.qtd) + '</b></div>'; });
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

  if ((LJ.cupons || []).some(function(x){ return x.ativo !== false; })){
    h += '<div class="card"><h3>🎟️ Tem cupom?</h3><div class="row"><input id="cCup" value="' + esc(EST.cupom || '') + '" placeholder="Digite o cupom" style="flex:2;text-transform:uppercase"><button class="bt2" onclick="aplicaCupom()">Aplicar</button></div>';
    if (EST.cupom && cu.erro) h += '<div class="aviso no">' + esc(cu.erro) + '</div>';
    else if (cu.d) h += '<div class="aviso ok">Cupom ' + esc(cu.cod) + ' aplicado: ' + cu.txt + ' de desconto 🎉</div>';
    h += '</div>';
  }
  h += '<div class="card"><div class="linhaitem"><span>Subtotal</span><b>' + brl(sub) + '</b></div>';
  if (cu.d) h += '<div class="linhaitem"><span>Cupom ' + esc(cu.cod) + '</span><b style="color:#16a34a">- ' + brl(cu.d) + '</b></div>';
  if (EST.entrega === 'entrega') h += '<div class="linhaitem"><span>Entrega</span><b>' + (t.combinar ? 'a combinar' : t.fora ? '—' : brl(t.taxa)) + '</b></div>';
  h += '<div class="linhaitem" style="font-size:20px"><span>Total</span><b style="color:var(--p)">' + brl(tot) + '</b></div></div>';
  if (LJ.pedMin && sub < LJ.pedMin) h += '<div class="aviso no">Pedido mínimo: ' + brl(LJ.pedMin) + '</div>';
  h += '<button class="btz full" id="btFin" style="font-size:18px;padding:16px" onclick="finaliza()">Enviar pedido pelo WhatsApp</button></div></div>';
  var y = $('folhaCar') ? $('folhaCar').scrollTop : 0;
  $('modal').innerHTML = h; $('folhaCar').scrollTop = y;
}
function aplicaCupom(){ guardaCampos(); EST.cupom = ($('cCup').value || '').trim().toUpperCase(); var r = descCupom(LJ, EST.cupom, subtotal()); if (r.erro) toast(r.erro); else if (r.d) toast('Cupom aplicado! 🎉'); desenhaCarrinho(); }
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
  var cu = descCupom(LJ, EST.cupom, sub); if (EST.cupom && cu.erro) return toast(cu.erro + ' Apague o cupom ou corrija.');
  var tot = sub - cu.d + (t.taxa || 0);
  if (troco && troco < tot) return toast('O troco precisa ser maior que o total (' + brl(tot) + ').');
  var salvo = {nome: CLI.nome, tel: CLI.tel, rua: CLI.rua || '', num: CLI.num || '', bairro: CLI.bairro || '', ref: CLI.ref || ''};
  if (LOC){ salvo.lat = LOC.lat; salvo.lng = LOC.lng; }
  try { localStorage.setItem('ml_cliente', JSON.stringify(salvo)); } catch (e) {}
  var cli = {nome: CLI.nome, tel: CLI.tel};
  if (EST.entrega === 'entrega'){ cli.rua = CLI.rua; cli.num = CLI.num; cli.bairro = CLI.bairro; cli.ref = CLI.ref || ''; if (LOC){ cli.lat = LOC.lat; cli.lng = LOC.lng; } }
  var d = new Date(), numero = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(Math.floor(Math.random() * 90 + 10));
  var p = {lojaId: LJID, numero: numero, itens: itensCar().map(function(i){ return {nome: i.nome, qtd: i.qtd, preco: i.preco}; }), obs: (EST.obs || '').trim(),
    subtotal: sub, desconto: cu.d || 0, cupom: cu.d ? cu.cod : '', taxa: t.taxa || 0, taxaCombinar: !!t.combinar, dist: t.dist != null ? Math.round(t.dist * 10) / 10 : null, total: tot,
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
