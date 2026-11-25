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
function msgCliente(url){ return 'Olá! 👋 Quer um comercial com locutor para o seu negócio? 🎤\nToque no link, escolha o seu ramo, faça o cadastro e mande as fotos e os preços que eu preparo o vídeo pra você:\n' + url; }

/* ---------- link para o cliente ---------- */
function pintaLinkBox(url, quem){
  $('lkSai').innerHTML = '<div class="cod" style="padding:10px"><small style="margin:0;font-size:15px">' + (quem ? 'Link de <b style="font-family:inherit;font-size:16px;display:inline;letter-spacing:0">' + esc(quem) + '</b>' : 'Link geral (serve para qualquer cliente)') + '</small><small style="color:#ffd400;font-size:16px">' + esc(url) + '</small></div>' +
    '<div class="lin"><button class="bt cz peq" id="lkCopia">📋 Copiar</button><a class="bt vd peq" id="lkZap" target="_blank" rel="noopener">💬 WhatsApp</a></div>';
  $('lkCopia').onclick = function(){ copia(msgCliente(url)); };
  $('lkZap').href = 'https://wa.me/?text=' + encodeURIComponent(msgCliente(url));
}
function segLink(){ var s = SEG_ID; return SEGS[s] ? s : 'mercado'; }
function linkGeral(){ var s = segLink(); return s == 'mercado' ? CLI_CURTO : CLI_BASE + '?c=alex&s=' + s; }
$('bLinkCli').onclick = function(){ var b = $('linkBox'), abre = b.classList.contains('oculto'); b.classList.toggle('oculto', !abre); if (abre){ pintaLinkBox(linkGeral(), ''); $('lkNome').value = ''; $('lkLoja').value = ''; $('lkSeg').textContent = 'O link já abre no ramo ' + SEGS[segLink()].emoji + ' ' + segNome(segLink()) + ' (troque lá em cima se quiser). O cliente pode escolher outro ramo no próprio link.'; } };
$('lkCria').onclick = async function(){
  var nome = $('lkNome').value.trim(), loja = $('lkLoja').value.trim(); if (!nome && !loja){ toast('Digite o nome do cliente ou da loja.', '#b91c1c'); return; }
  var b = this; b.disabled = true;
  try { var id = await PDB.criaLink({cliente: nome.slice(0, 60), loja: loja.slice(0, 50), seg: segLink()}); pintaLinkBox(CLI_BASE + '?c=' + id, nome || loja); toast('Link criado ✅'); }
  catch (x) { toast('Não criou o link: ' + (x.code == 'permission-denied' ? 'sem permissão (regras ainda não publicadas ou conta sem acesso).' : (x.code || x.message)), '#b91c1c', 5000); }
  b.disabled = false;
};

/* ---------- lista de pedidos ---------- */
/* status: novo → aceito → feito; ou recusado (com motivo). 'aberto' (versão antiga) = aceito. */
var RECUSANDO = -1;
function stPed(p){ return p.status == 'aberto' ? 'aceito' : (p.status || 'novo'); }
function segPed(p){ var pr = (p.produtos || [])[0] || {}, s = String(pr.seg || ''); return SEGS[s] ? s : 'mercado'; }
function segPedNome(p){ var s = segPed(p), pr = (p.produtos || [])[0] || {}; return s == 'outro' && pr.segNome ? String(pr.segNome) : segDe(s).nome; }
function resumoPed(p){ var pr = p.produtos || [];
  if (segPed(p) == 'festa'){ var F = (pr[0] && pr[0].festa) || {}; return '🎉 ' + (F.nome || pr[0] && pr[0].nome || 'Festa') + (F.dia ? ' • ' + String(F.dia).split('-').reverse().join('/') : '') + (F.hora ? ' ' + F.hora : '') + (F.local ? ' • ' + F.local : ''); }
  return pr.length + ' ' + (pr.length > 1 ? segDe(segPed(p)).itens || 'itens' : segDe(segPed(p)).item || 'item') + ': ' + pr.map(function(x){ return x.nome + ' R$ ' + precoBR(x.preco); }).join(', '); }
function msgRecusa(p){ return 'Olá' + (p.cliente ? ', ' + p.cliente : '') + '! Recebi o seu pedido de comercial' + (p.loja ? ' (' + p.loja + ')' : '') + ', mas desta vez não vou conseguir fazer.' + (p.motivo ? '\nMotivo: ' + p.motivo : '') + '\nQualquer dúvida, é só chamar. 🙏'; }
function msgAceito(p){ return 'Olá' + (p.cliente ? ', ' + p.cliente : '') + '! ✅ Recebi o seu pedido de comercial' + (p.loja ? ' (' + p.loja + ')' : '') + ' e já estou preparando. Logo te mando o vídeo! 🎬'; }
function pintaPedidos(){
  var L = PEDIDOS, n = L.filter(function(p){ return stPed(p) == 'novo'; }).length;
  $('nNovos').textContent = n ? n + (n > 1 ? ' novos' : ' novo') : ''; $('nNovos').classList.toggle('oculto', !n);
  if (!L.length){ $('pedidos').innerHTML = '<p class="vazio">Nenhum pedido ainda. Toque em <b>🔗 Link para o cliente</b> e mande para seus clientes.</p>'; return; }
  $('pedidos').innerHTML = L.map(function(p, i){ var d = ms(p.criadoEm), st = stPed(p), sg = segDe(segPed(p));
    var tag = st == 'novo' ? '<span class="tag novo">NOVO</span>' : st == 'aceito' ? '<span class="tag am">aceito</span>' : st == 'feito' ? '<span class="tag">feito</span>' : '<span class="tag rc">recusado</span>';
    var corpo = '<div class="item ped ' + st + '"><div class="ph">' + sg.emoji + '</div><div style="flex:1;min-width:0"' + (st == 'recusado' ? '' : ' onclick="' + (st == 'novo' ? 'aceitaPedido' : 'abrePedido') + '(' + i + ')"') + '>' +
      '<b>' + esc(p.loja || 'Sem nome') + '</b>' + tag +
      '<small style="display:block;font-weight:700;color:#1b0006">' + sg.emoji + ' ' + esc(segPedNome(p)) + (p.cliente ? ' • 👤 ' + esc(p.cliente) : '') + '</small>' +
      '<small style="display:block">' + esc(resumoPed(p).slice(0, 110)) + '</small>' +
      (st == 'recusado' && p.motivo ? '<small style="display:block;color:#b91c1c">Motivo: ' + esc(p.motivo) + '</small>' : '') +
      '<small>' + (d ? new Date(d).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '') + '</small>';
    if (st == 'novo') corpo += '<div class="lin pedac"><button class="bt vd peq" onclick="event.stopPropagation();aceitaPedido(' + i + ')">✅ Aceitar</button><button class="bt cz peq" onclick="event.stopPropagation();recusaPedido(' + i + ')">❌ Recusar</button></div>';
    if (RECUSANDO == i) corpo += '<div class="recbox" onclick="event.stopPropagation()"><label class="l" style="margin-top:6px">Motivo <small class="d">(opcional, vai na mensagem para o cliente)</small></label><input id="recMot" maxlength="120" placeholder="Ex.: foto sem qualidade / agenda cheia">' +
      '<div class="lin pedac"><button class="bt peq" onclick="confirmaRecusa(' + i + ')">❌ Recusar pedido</button><button class="bt cz peq" onclick="RECUSANDO=-1;pintaPedidos()">Voltar</button></div></div>';
    if (st == 'recusado' && p.zap) corpo += '<div class="lin pedac"><a class="bt vd peq" target="_blank" rel="noopener" href="https://wa.me/' + nz(p.zap) + '?text=' + encodeURIComponent(msgRecusa(p)) + '">💬 Avisar o cliente</a></div>';
    corpo += '</div><div class="pacs">' + (st == 'aceito' || st == 'feito' ? '<button class="bt peq" title="Abrir o anúncio" onclick="abrePedido(' + i + ')">🎬</button>' : '') +
      (p.zap ? '<a class="bt vd peq" title="WhatsApp do cliente" target="_blank" rel="noopener" href="https://wa.me/' + nz(p.zap) + (st == 'aceito' ? '?text=' + encodeURIComponent(msgAceito(p)) : '') + '">💬</a>' : '') +
      '<button class="bt cz peq" title="Apagar" onclick="apagaPedido(' + i + ')">🗑️</button></div></div>';
    return corpo; }).join('');
  if (RECUSANDO >= 0 && $('recMot')) $('recMot').focus();
}
function carregaPedidos(){
  $('pedidos').innerHTML = '<p class="vazio">Carregando…</p>'; RECUSANDO = -1;
  var ordem = {novo: 0, aceito: 1, feito: 2, recusado: 3};
  return PDB.pedidos().then(function(L){
    L.sort(function(a, b){ return ordem[stPed(a)] - ordem[stPed(b)] || ms(b.criadoEm) - ms(a.criadoEm); }); PEDIDOS = L; pintaPedidos();
  }).catch(function(e){ $('nNovos').classList.add('oculto'); $('pedidos').innerHTML = '<p class="erro" style="color:#fff">Não carregou os pedidos: ' + esc(e.code == 'permission-denied' ? 'sem permissão (as regras novas ainda não foram publicadas).' : (e.code || e.message || e)) + '</p>'; });
}
window.pintaPedidos = pintaPedidos;
window.aceitaPedido = async function(i){ var p = PEDIDOS[i]; if (!p) return;
  try { await PDB.muda(p.id, {status: 'aceito', aceitoEm: Date.now()}); p.status = 'aceito'; } catch (x) { toast('Não aceitou: ' + (x.code || x.message), '#b91c1c', 4000); return; }
  toast('✅ Pedido aceito! Abrindo o anúncio…', '#16a34a', 3000); abrePedido(i); };
window.recusaPedido = function(i){ RECUSANDO = i; pintaPedidos(); };
window.confirmaRecusa = async function(i){ var p = PEDIDOS[i]; if (!p) return; var mot = ($('recMot') && $('recMot').value.trim() || '').slice(0, 120);
  try { await PDB.muda(p.id, {status: 'recusado', motivo: mot, recusadoEm: Date.now()}); p.status = 'recusado'; p.motivo = mot; RECUSANDO = -1; toast('Pedido recusado. Toque em 💬 Avisar o cliente para mandar a mensagem.', '#b45309', 4500); carregaPedidos(); }
  catch (x) { toast('Não recusou: ' + (x.code || x.message), '#b91c1c', 4000); } };
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
    if (o){ toast('Abrindo o anúncio deste pedido…'); if (o.seg == 'festa') editarFesta(o); else editar(o); return; } }
  if (stPed(p) == 'novo'){ PDB.muda(p.id, {status: 'aceito', aceitoEm: Date.now()}).catch(function(){}); p.status = 'aceito'; }
  if (segPed(p) == 'festa'){ abrePedidoFesta(p); return; }
  toast('⏳ Montando o comercial…', '#2563eb', 6000);
  var F = {}; try { F = await PDB.fotos(p.id); } catch (x) { toast('Não baixou as fotos: ' + (x.code || x.message) + '. Vou montar sem elas.', '#b45309', 5000); }
  var prods = (p.produtos || []).slice(0, 6).map(function(x, k){ return {nome: String(x.nome || '').slice(0, 60), preco: +x.preco || null, de: +x.de || null, un: (x.un && UN_ROT[x.un]) ? x.un : '', foto: '', tipoFoto: '', _f: imgOk(F[String(k)])}; });
  if (!prods.length) prods = [{nome: '', preco: null, de: null, un: '', foto: '', tipoFoto: ''}];
  for (var k = 0; k < prods.length; k++){ if (prods[k]._f){ try { var im = await carregaImg(prods[k]._f), c = novaTela(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0); prods[k].foto = telaParaDado(c, 640, 110000, false); prods[k].tipoFoto = 'foto'; } catch (e) {} } }
  var fs = prods.map(function(x){ var f = x._f; delete x._f; return f; });
  var e = p.endr && typeof p.endr == 'object' ? {cep: String(p.endr.cep || ''), rua: String(p.endr.rua || ''), num: String(p.endr.num || ''), comp: String(p.endr.comp || ''), bairro: String(p.endr.bairro || ''), cidade: String(p.endr.cidade || ''), uf: String(p.endr.uf || '')} : null;
  var sgp = segPed(p); if (SEGS[sgp].festa) sgp = 'mercado';
  var of = {seg: sgp, segNome: sgp == 'outro' ? String(((p.produtos || [])[0] || {}).segNome || '').slice(0, 30) || undefined : undefined, loja: String(p.loja || '').slice(0, 50), zap: String(p.zap || '').slice(0, 20), end: String(p.end || '').slice(0, 90), logo: imgOk(p.logo), produtos: prods, voz: 'ze', roteiro: null, roteiroEditado: false, pedidoId: p.id, cliente: p.cliente || ''};
  if (e && (e.rua || e.cep || e.bairro)) of.endr = e;
  editar(of);
  /* oferece ✨ Perfeita e a foto oficial, mas deixa marcada a foto que o cliente mandou */
  fs.forEach(function(f, k){ if (f) setTimeout(function(){ if (OF && OF.pedidoId == p.id) trataFoto(k, dadoParaBlob(f), true); }, 300 * k); });
  await salvar(true);
  if (OF.id) PDB.muda(p.id, {status: p.status == 'feito' ? 'feito' : 'aceito', ofertaId: OF.id}).catch(function(){});
  p.ofertaId = OF.id;
  $('pedAviso').innerHTML = '📥 Pedido aceito: comercial montado no ramo <b>' + SEGS[sgp].emoji + ' ' + esc(of.segNome || SEGS[sgp].nome) + '</b> com o pedido de <b>' + esc(of.loja) + '</b>. Agora é só <b>escolher o locutor</b> (passo 3), mudar a fala se quiser (passo 4) e tocar em <b>🎬 Gerar o vídeo</b>.';
  $('pedAviso').classList.remove('oculto');
  toast('Comercial pronto! Escolha o locutor 🎤', '#16a34a', 4000);
  setTimeout(function(){ $('vozes').scrollIntoView({behavior: 'smooth', block: 'start'}); }, 400);
};

/* ---------- pedido de Festas e Eventos: abre o editor da festa já preenchido ---------- */
async function abrePedidoFesta(p){
  toast('⏳ Montando o anúncio da festa…', '#2563eb', 5000);
  var pr = (p.produtos || [])[0] || {}, F0 = pr.festa || {}, foto = '';
  if (pr.temFoto){ try { var Fs = await PDB.fotos(p.id), u = imgOk(Fs['0']); if (u){ var im = await carregaImg(u), c = novaTela(im.naturalWidth, im.naturalHeight); c.getContext('2d').drawImage(im, 0, 0); foto = telaParaDado(c, 720, 110000, false); } } catch (x) { toast('Não baixou a foto da festa. Vou montar sem ela.', '#b45309', 4000); } }
  var s = function(v, n){ return String(v || '').slice(0, n); };
  var dia = /^\d{4}-\d{2}-\d{2}$/.test(F0.dia || '') ? F0.dia : '';
  var o = {seg: 'festa', festa: {nome: s(F0.nome || pr.nome, 60), dia: dia, hora: s(F0.hora, 5), local: s(F0.local, 80), atracoes: s(F0.atracoes, 100), entrada: s(F0.entrada, 60), contato: s(F0.contato || p.zap, 60), foto: foto},
    estilo: 'carro', vozF: '', musica: {tipo: 'app', bed: ''}, linhas: null, textoEditado: false, pedidoId: p.id, cliente: s(p.cliente, 60), loja: s(p.loja, 50), zap: s(p.zap, 20)};
  editarFesta(o);
  try { var c2 = JSON.parse(JSON.stringify(OF)); delete c2.semente; var id = await DB.salva(c2); OF.id = id; if ($('fApagar')) $('fApagar').classList.remove('oculto'); sujo = false;
    PDB.muda(p.id, {status: p.status == 'feito' ? 'feito' : 'aceito', ofertaId: id}).catch(function(){}); p.ofertaId = id; } catch (x) {}
  toast('Anúncio da festa pronto! Escolha o estilo do locutor 🎉', '#16a34a', 4000);
}
/* quando o vídeo da festa fica pronto (festa.js salva em silêncio), marca o pedido como feito */
/* festa.js carrega depois deste arquivo: embrulha o salvarFesta quando a página termina de carregar */
document.addEventListener('DOMContentLoaded', function(){ if (typeof salvarFesta != 'function' || salvarFesta._ped) return; var _salvarFesta = salvarFesta; salvarFesta = async function(quieto){ var r = await _salvarFesta.apply(this, arguments); if (quieto && OF && OF.pedidoId && window.pedidoFeito) pedidoFeito(OF.pedidoId); return r; }; salvarFesta._ped = true; });
