/* Oferta Okê — link para o cliente e pedidos dos clientes (ok_links, ok_pedidos). Carrega depois do app.js. */
var CLI_BASE = 'https://merceariaaled19-cloud.github.io/Meu-lanches/ofertaok/cliente.html';
var CLI_CURTO = 'https://is.gd/ofertaokecliente'; /* = cliente.html?c=alex (link geral) */
var PEDIDOS = [];
var PDB = TESTE ? {
  pedidos: function(){ var P = JSON.parse(localStorage.getItem('okteste_pedidos') || '{}'); return Promise.resolve(Object.keys(P).map(function(k){ var x = JSON.parse(JSON.stringify(P[k])); delete x.fotos; x.id = k; return x; })); },
  fotos: function(id){ var P = JSON.parse(localStorage.getItem('okteste_pedidos') || '{}'); return Promise.resolve((P[id] && P[id].fotos) || {}); },
  muda: function(id, o){ var P = JSON.parse(localStorage.getItem('okteste_pedidos') || '{}'); if (P[id]) for (var k in o) P[id][k] = o[k]; localStorage.setItem('okteste_pedidos', JSON.stringify(P)); return Promise.resolve(); },
  apaga: function(id){ var P = JSON.parse(localStorage.getItem('okteste_pedidos') || '{}'); delete P[id]; localStorage.setItem('okteste_pedidos', JSON.stringify(P)); return Promise.resolve(); },
  criaLink: function(o){ var L = JSON.parse(localStorage.getItem('okteste_links') || '{}'), id = OKV.novoId(); o.ativo = true; L[id] = o; localStorage.setItem('okteste_links', JSON.stringify(L)); return Promise.resolve(id); }
} : {
  pedidos: function(){ return db.collection('ok_pedidos').get().then(function(s){ return s.docs.map(function(d){ var x = d.data(); x.id = d.id; return x; }); }); },
  fotos: function(id){ return db.collection('ok_pedidos').doc(id).collection('fotos').get().then(function(s){ var r = {}; s.docs.forEach(function(d){ r[d.id] = d.data().d; }); return r; }); },
  muda: function(id, o){ return db.collection('ok_pedidos').doc(id).update(o); },
  apaga: function(id){ var ref = db.collection('ok_pedidos').doc(id); return ref.collection('fotos').get().then(function(s){ return Promise.all(s.docs.map(function(d){ return d.ref.delete(); })); }).then(function(){ return ref.delete(); }); },
  criaLink: function(o){ var id = OKV.novoId(); o.ativo = true; o.criadoEm = firebase.firestore.FieldValue.serverTimestamp(); return db.collection('ok_links').doc(id).set(o).then(function(){ return id; }); }
};
function imgOk(u){ return typeof u == 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(u) ? u : ''; }
function msgCliente(url){ return 'Olá! 👋 Quer um comercial com locutor para as ofertas da sua loja? 🎤\nToque no link, mande as fotos e os preços dos produtos que eu preparo o vídeo pra você:\n' + url; }

/* ---------- link para o cliente ---------- */
function pintaLinkBox(url, quem){
  $('lkSai').innerHTML = '<div class="cod" style="padding:10px"><small style="margin:0;font-size:15px">' + (quem ? 'Link de <b style="font-family:inherit;font-size:16px;display:inline;letter-spacing:0">' + esc(quem) + '</b>' : 'Link geral (serve para qualquer cliente)') + '</small><small style="color:#ffd400;font-size:16px">' + esc(url) + '</small></div>' +
    '<div class="lin"><button class="bt cz peq" id="lkCopia">📋 Copiar</button><a class="bt vd peq" id="lkZap" target="_blank" rel="noopener">💬 WhatsApp</a></div>';
  $('lkCopia').onclick = function(){ copia(msgCliente(url)); };
  $('lkZap').href = 'https://wa.me/?text=' + encodeURIComponent(msgCliente(url));
}
function segLink(){ var s = SEG_ID; return SEGS[s] && !SEGS[s].festa ? s : 'mercado'; }
function linkGeral(){ var s = segLink(); return s == 'mercado' ? CLI_CURTO : CLI_BASE + '?c=alex&s=' + s; }
$('bLinkCli').onclick = function(){ var b = $('linkBox'), abre = b.classList.contains('oculto'); b.classList.toggle('oculto', !abre); if (abre){ pintaLinkBox(linkGeral(), ''); $('lkNome').value = ''; $('lkLoja').value = ''; $('lkSeg').textContent = SEGS[SEG_ID].festa ? 'O link do cliente é para lojas mandarem produtos e preços (vai como 🛒 Mercadinho). Para outro ramo, escolha o ramo lá em cima.' : 'Ramo do link: ' + SEGS[segLink()].emoji + ' ' + segNome(segLink()) + ' (troque lá em cima se quiser).'; } };
$('lkCria').onclick = async function(){
  var nome = $('lkNome').value.trim(), loja = $('lkLoja').value.trim(); if (!nome && !loja){ toast('Digite o nome do cliente ou da loja.', '#b91c1c'); return; }
  var b = this; b.disabled = true;
  try { var id = await PDB.criaLink({cliente: nome.slice(0, 60), loja: loja.slice(0, 50), seg: segLink()}); pintaLinkBox(CLI_BASE + '?c=' + id, nome || loja); toast('Link criado ✅'); }
  catch (x) { toast('Não criou o link: ' + (x.code == 'permission-denied' ? 'sem permissão (regras ainda não publicadas ou conta sem acesso).' : (x.code || x.message)), '#b91c1c', 5000); }
  b.disabled = false;
};

/* ---------- lista de pedidos ---------- */
function carregaPedidos(){
  $('pedidos').innerHTML = '<p class="vazio">Carregando…</p>';
  return PDB.pedidos().then(function(L){
    L.sort(function(a, b){ return (a.status == 'novo' ? 0 : 1) - (b.status == 'novo' ? 0 : 1) || ms(b.criadoEm) - ms(a.criadoEm); }); PEDIDOS = L;
    var n = L.filter(function(p){ return p.status == 'novo'; }).length;
    $('nNovos').textContent = n ? n + (n > 1 ? ' novos' : ' novo') : ''; $('nNovos').classList.toggle('oculto', !n);
    if (!L.length){ $('pedidos').innerHTML = '<p class="vazio">Nenhum pedido ainda. Toque em <b>🔗 Link para o cliente</b> e mande para seus clientes.</p>'; return; }
    $('pedidos').innerHTML = L.map(function(p, i){ var d = ms(p.criadoEm), pr = p.produtos || [];
      return '<div class="item ped' + (p.status == 'novo' ? ' novo' : '') + '"><div class="ph">' + (p.status == 'novo' ? '📥' : p.status == 'feito' ? '✅' : '📝') + '</div><div style="flex:1;min-width:0" onclick="abrePedido(' + i + ')">' +
        '<b>' + esc(p.loja || 'Sem nome') + '</b>' + (p.status == 'novo' ? '<span class="tag novo">NOVO</span>' : p.status == 'feito' ? '<span class="tag">feito</span>' : '<span class="tag am">aberto</span>') +
        '<small style="display:block">' + pr.length + ' produto(s): ' + esc(pr.map(function(x){ return x.nome + ' R$ ' + precoBR(x.preco); }).join(', ').slice(0, 90)) + '</small>' +
        '<small>' + (d ? new Date(d).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '') + (p.cliente ? ' • ' + esc(p.cliente) : '') + '</small></div>' +
        '<div class="pacs"><button class="bt peq" onclick="abrePedido(' + i + ')">🎬</button>' + (p.zap ? '<a class="bt vd peq" target="_blank" rel="noopener" href="https://wa.me/' + nz(p.zap) + '">💬</a>' : '') + '<button class="bt cz peq" onclick="apagaPedido(' + i + ')">🗑️</button></div></div>'; }).join('');
  }).catch(function(e){ $('nNovos').classList.add('oculto'); $('pedidos').innerHTML = '<p class="erro" style="color:#fff">Não carregou os pedidos: ' + esc(e.code == 'permission-denied' ? 'sem permissão (as regras novas ainda não foram publicadas).' : (e.code || e.message || e)) + '</p>'; });
}
var _abreHome = abreHome;
abreHome = function(){ _abreHome(); $('linkBox').classList.add('oculto'); carregaPedidos(); };
window.apagaPedido = async function(i){ var p = PEDIDOS[i]; if (!p || !confirm('Apagar o pedido de ' + (p.loja || 'cliente') + '? (O comercial feito com ele continua salvo.)')) return;
  try { await PDB.apaga(p.id); toast('Pedido apagado'); carregaPedidos(); } catch (x) { toast('Não apagou: ' + (x.code || x.message), '#b91c1c'); } };
window.pedidoFeito = function(pid){ if (!pid) return; PDB.muda(pid, {status: 'feito', ofertaId: OF && OF.id || ''}).catch(function(){}); };

/* ---------- abrir pedido = comercial pronto ---------- */
function dadoParaBlob(u){ var p = u.split(','), b = atob(p[1]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Blob([a], {type: p[0].split(':')[1].split(';')[0]}); }
window.abrePedido = async function(i){
  var p = PEDIDOS[i]; if (!p) return;
  if (p.ofertaId){ var L = await DB.lista().catch(function(){ return []; }), o = L.filter(function(x){ return x.id == p.ofertaId; })[0];
    if (o){ toast('Abrindo o comercial deste pedido…'); editar(o); return; } }
  toast('⏳ Montando o comercial…', '#2563eb', 6000);
  var F = {}; try { F = await PDB.fotos(p.id); } catch (x) { toast('Não baixou as fotos: ' + (x.code || x.message) + '. Vou montar sem elas.', '#b45309', 5000); }
  var prods = (p.produtos || []).slice(0, 6).map(function(x, k){ return {nome: String(x.nome || '').slice(0, 60), preco: +x.preco || null, de: +x.de || null, un: (x.un && UN_ROT[x.un]) ? x.un : '', foto: '', tipoFoto: '', _f: imgOk(F[String(k)])}; });
  if (!prods.length) prods = [{nome: '', preco: null, de: null, un: '', foto: '', tipoFoto: ''}];
  for (var k = 0; k < prods.length; k++){ if (prods[k]._f){ try { var im = await carregaImg(prods[k]._f), c = novaTela(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0); prods[k].foto = telaParaDado(c, 640, 110000, false); prods[k].tipoFoto = 'foto'; } catch (e) {} } }
  var fs = prods.map(function(x){ var f = x._f; delete x._f; return f; });
  var e = p.endr && typeof p.endr == 'object' ? {cep: String(p.endr.cep || ''), rua: String(p.endr.rua || ''), num: String(p.endr.num || ''), comp: String(p.endr.comp || ''), bairro: String(p.endr.bairro || ''), cidade: String(p.endr.cidade || ''), uf: String(p.endr.uf || '')} : null;
  var sgp = String(((p.produtos || [])[0] || {}).seg || ''); if (!SEGS[sgp] || SEGS[sgp].festa) sgp = 'mercado';
  var of = {seg: sgp, loja: String(p.loja || '').slice(0, 50), zap: String(p.zap || '').slice(0, 20), end: String(p.end || '').slice(0, 90), logo: imgOk(p.logo), produtos: prods, voz: 'ze', roteiro: null, roteiroEditado: false, pedidoId: p.id, cliente: p.cliente || ''};
  if (e && (e.rua || e.cep || e.bairro)) of.endr = e;
  editar(of);
  /* oferece ✨ Perfeita e a foto oficial, mas deixa marcada a foto que o cliente mandou */
  fs.forEach(function(f, k){ if (f) setTimeout(function(){ if (OF && OF.pedidoId == p.id) trataFoto(k, dadoParaBlob(f), true); }, 300 * k); });
  await salvar(true);
  if (OF.id) PDB.muda(p.id, {status: p.status == 'feito' ? 'feito' : 'aberto', ofertaId: OF.id}).catch(function(){});
  p.ofertaId = OF.id;
  $('pedAviso').innerHTML = '📥 Comercial montado com o pedido de <b>' + esc(of.loja) + '</b>. Agora é só <b>escolher o locutor</b> (passo 3), mudar a fala se quiser (passo 4) e tocar em <b>🎬 Gerar o vídeo</b>.';
  $('pedAviso').classList.remove('oculto');
  toast('Comercial pronto! Escolha o locutor 🎤', '#16a34a', 4000);
  setTimeout(function(){ $('vozes').scrollIntoView({behavior: 'smooth', block: 'start'}); }, 400);
};
