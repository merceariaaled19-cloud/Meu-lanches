/* Oferta Okê — página do cliente (sem login): o cliente manda loja, fotos e preços; vira pedido em ok_pedidos para o Alex.
   ok_links/{CÓDIGO} = {loja, cliente, ativo} (link por cliente, criado no app do Alex). Código 'alex' = link geral (não precisa de documento).
   ok_pedidos/{id} = {codigo, cliente (nome da pessoa), loja, zap, end, endr, logo, produtos[{nome,preco,de,un,temFoto,seg,segNome?,festa?}], nFotos, status:'novo', criadoEm}
   O ramo vai em cada produto (seg). Festas e Eventos: 1 item com seg:'festa' e festa:{nome,dia,hora,local,atracoes,entrada,contato} (foto em fotos/0).
   No app: status novo → aceito → feito (ou recusado, com motivo). As regras do Firestore não mudaram.
   ok_pedidos/{id}/fotos/{n} = {d: 'data:image/jpeg;base64,...'} (n = número do produto, 0 a 5) */
var FB = {apiKey: 'AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM', authDomain: 'pdv-mercadinho-1c882.firebaseapp.com', projectId: 'pdv-mercadinho-1c882', storageBucket: 'pdv-mercadinho-1c882.firebasestorage.app', messagingSenderId: '572967904689', appId: '1:572967904689:web:e162701eeab1bc0be48990'};
var TESTE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]teste=1/.test(location.search);
var $ = function(i){ return document.getElementById(i); };
var COD = ((location.search.match(/[?&]c=([A-Za-z0-9_-]{1,40})/) || [])[1] || 'alex');
if (/^alex$/i.test(COD)) COD = 'alex';
var PRODS = [], LOGO = '', ALVO = 0, LINK = null, db = null;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
function precoBR(v){ return (Math.round((+v || 0) * 100) / 100).toFixed(2).replace('.', ','); }
function lePreco(s){ s = String(s || '').replace(/[^\d,\.]/g, ''); if (!s) return NaN; if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s); }


/* ---------- ramo da loja (o link pode vir com seg; o geral aceita ?s=) ---------- */
var UNS = {kg: 'quilo (kg)', un: 'unidade', pacote: 'pacote', litro: 'litro', duzia: 'dúzia', bandeja: 'bandeja', caixa: 'caixa', fardo: 'fardo', mes: 'por mês', trimestre: 'trimestre', semestre: 'semestre', ano: 'plano anual', aula: 'por aula', diaria: 'diária', dia: 'por dia', semana: 'por semana', hora: 'por hora', fds: 'fim de semana',
  m2: 'metro quadrado (m²)', m3: 'metro cúbico (m³)', saco: 'saco', milheiro: 'milheiro', metro: 'metro', barra: 'barra', lata: 'lata', consulta: 'consulta', sessao: 'sessão', exame: 'exame', procedimento: 'procedimento', servico: 'serviço', combo: 'combo', porcao: 'porção', prato: 'prato', peca: 'peça', conjunto: 'conjunto', par: 'par', banho: 'banho', avista: 'à vista', pessoa: 'por pessoa', pacote2: 'pacote'};
/* [emoji, título, nome do item, ex. loja, ex. item, ex. preço, unidades, rótulo da unidade, nome do ramo]  — exemplos 100% inventados (nenhuma loja, pessoa ou marca real) */
var CSEG = {
  mercado: ['🛒', 'Seus produtos', 'produto', 'Ex.: Mercadinho Sol Nascente', 'Ex.: Arroz tipo 1 pacote 5kg', '7,99', 'kg un pacote litro duzia bandeja caixa fardo', 'Vende por', 'Mercadinho'],
  festa: ['🎉', 'Sua festa', 'festa', 'Ex.: Eventos Lua Cheia', '', '', '', '', 'Festas e Eventos'],
  veiculos: ['🚗', 'Seus veículos', 'veículo', 'Ex.: Estrela Azul Veículos', 'Ex.: Hatch 1.0 completo 2021', '69.900,00', 'avista', 'Condição', 'Veículos'],
  academia: ['💪', 'Seus planos', 'plano', 'Ex.: Academia Pulso Forte', 'Ex.: Plano mensal musculação', '89,90', 'mes trimestre semestre ano aula diaria', 'Cobrado', 'Academia'],
  aluguel: ['🏠', 'O que você aluga', 'item', 'Ex.: Aluga Fácil Ipê', 'Ex.: Casa 2 quartos / Betoneira 400 L', '1.200,00', 'mes dia diaria semana hora fds', 'Cobrado', 'Aluguéis'],
  construcao: ['🧱', 'Seus produtos', 'produto', 'Ex.: Depósito Tijolo Firme', 'Ex.: Cimento saco 50kg', '36,90', 'un saco m2 m3 metro barra milheiro lata kg', 'Vende por', 'Construção'],
  clinica: ['🩺', 'Seus serviços', 'serviço', 'Ex.: Clínica Vida Plena', 'Ex.: Consulta com clínico geral', '120,00', 'consulta exame sessao procedimento', 'Cobrado por', 'Clínica'],
  salao: ['💇', 'Seus serviços', 'serviço', 'Ex.: Barbearia Navalha de Ouro', 'Ex.: Corte + barba', '45,00', 'servico sessao pacote2', 'Cobrado por', 'Salão / Barbearia'],
  lanchonete: ['🍔', 'Seu cardápio', 'item', 'Ex.: Lanche da Esquina Feliz', 'Ex.: X-Tudo + suco', '24,90', 'un combo porcao prato kg', 'Vende por', 'Lanchonete'],
  roupas: ['👗', 'Suas peças', 'peça', 'Ex.: Moda Flor do Campo', 'Ex.: Vestido floral', '79,90', 'peca conjunto par', 'Vende por', 'Roupas'],
  pet: ['🐾', 'Produtos e serviços', 'item', 'Ex.: Pet Patinha Feliz', 'Ex.: Ração adulto 15kg / Banho e tosa', '139,90', 'un kg pacote banho servico consulta', 'Vende por', 'Pet'],
  eletronicos: ['📱', 'Seus produtos', 'produto', 'Ex.: Conecta Cell Norte', 'Ex.: Celular 128GB tela 6,5"', '999,00', 'un avista', 'Vende por', 'Eletrônicos'],
  oficina: ['🔧', 'Seus serviços', 'serviço', 'Ex.: Oficina Motor Bom', 'Ex.: Troca de óleo + filtro', '149,90', 'servico hora peca', 'Cobrado por', 'Oficina'],
  outro: ['✏️', 'Produtos e serviços', 'item', 'Ex.: Nome do seu negócio', 'Ex.: Nome do produto ou serviço', '50,00', 'un servico mes dia hora pacote2 kg pessoa', 'Vende por', 'Outro']};
var SEG_ORDEM = ['mercado', 'festa', 'veiculos', 'academia', 'aluguel', 'construcao', 'clinica', 'salao', 'lanchonete', 'roupas', 'pet', 'eletronicos', 'oficina', 'outro'];
var SEG_URL = ((location.search.match(/[?&]s=([a-z]{3,15})/) || [])[1] || ''); if (!CSEG[SEG_URL]) SEG_URL = '';
var SEG = SEG_URL || 'mercado';
function cs(){ return CSEG[SEG] || CSEG.mercado; }
function ehFesta(){ return SEG == 'festa'; }
function pintaSegs(){ $('segGrid').innerHTML = SEG_ORDEM.map(function(s){ return '<button type="button" data-s="' + s + '"' + (s == SEG ? ' class="on" aria-pressed="true"' : '') + ' onclick="escolheSeg(\'' + s + '\')"><span>' + CSEG[s][0] + '</span>' + esc(CSEG[s][8]) + '</button>'; }).join(''); }
window.escolheSeg = function(s){ if (!CSEG[s] || s == SEG){ return; } lePs(); SEG = s; aplicaSegCli(); pinta(); };
function aplicaSegCli(){ var c = cs();
  pintaSegs(); $('segOutroBox').classList.toggle('oculto', SEG != 'outro');
  $('prodCard').classList.toggle('oculto', ehFesta()); $('festaCard').classList.toggle('oculto', !ehFesta());
  $('lLoja').textContent = ehFesta() ? 'Nome da empresa ou de quem organiza *' : 'Nome da loja ou empresa *';
  $('cLoja').placeholder = c[3]; if (!LOGO) $('logoPrev').textContent = c[0];
  if (ehFesta()) return;
  $('tProds').textContent = c[0] + ' ' + c[1]; $('bAdd').textContent = '➕ Mais um' + (c[2] == 'peça' ? 'a peça' : ' ' + c[2]); }

/* ---------- dados (real ou teste) ---------- */
var DB = TESTE ? {
  link: function(c){ var L = JSON.parse(localStorage.getItem('okteste_links') || '{}'); return Promise.resolve(c == 'alex' ? {ativo: true} : (L[c] || null)); },
  envia: function(ped, fotos, prog){
    var P = JSON.parse(localStorage.getItem('okteste_pedidos') || '{}'), id = 'P' + Date.now();
    ped.criadoEm = Date.now(); ped.fotos = fotos; P[id] = ped;
    try { localStorage.setItem('okteste_pedidos', JSON.stringify(P)); } catch (e) { return Promise.reject(new Error('teste-cheio')); }
    prog(1); return new Promise(function(ok){ setTimeout(function(){ ok(id); }, 400); });
  }
} : {
  link: function(c){ if (c == 'alex') return Promise.resolve({ativo: true}); return db.collection('ok_links').doc(c).get().then(function(d){ return d.exists ? d.data() : null; }); },
  envia: function(ped, fotos, prog){
    ped.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    var ref = db.collection('ok_pedidos').doc(), ks = Object.keys(fotos), feitos = 0;
    return ref.set(ped).then(function(){
      prog(1 / (ks.length + 1));
      return ks.reduce(function(pr, k){ return pr.then(function(){ return ref.collection('fotos').doc(k).set({d: fotos[k]}).then(function(){ feitos++; prog((feitos + 1) / (ks.length + 1)); }); }); }, Promise.resolve());
    }).then(function(){ return ref.id; });
  }
};

/* ---------- fotos: comprime no próprio celular (≤ 1024 px, JPEG) ---------- */
function carregaImg(src){ return new Promise(function(ok, ruim){ var i = new Image(); i.onload = function(){ ok(i); }; i.onerror = function(){ ruim(new Error('img')); }; i.src = src; }); }
async function comprime(arq, lado, alvo){
  var url = URL.createObjectURL(arq), im; try { im = await carregaImg(url); } finally { setTimeout(function(){ URL.revokeObjectURL(url); }, 2000); }
  while (true){
    var k = Math.min(1, lado / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
    var q = 0.85, u = c.toDataURL('image/jpeg', q);
    while (u.length > alvo && q > 0.45){ q -= 0.1; u = c.toDataURL('image/jpeg', q); }
    if (u.length <= alvo || lado <= 400) return u;
    lado -= 160;
  }
}

/* ---------- produtos ---------- */
function cap(t){ t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
function novoProd(){ return {nome: '', preco: '', de: '', un: '', foto: ''}; }
function lePs(){ PRODS.forEach(function(p, i){ if (!$('pn' + i)) return; p.nome = $('pn' + i).value; p.preco = $('pp' + i).value; p.de = $('pd' + i).value; p.un = $('pu' + i).value; }); }
function pinta(){
  $('prods').innerHTML = PRODS.map(function(p, i){
    return '<div class="prod" id="pr' + i + '"><div class="tp"><span>' + cap(cs()[2]) + ' ' + (i + 1) + '</span>' + (PRODS.length > 1 ? '<button type="button" class="bt cz peq" style="width:auto;margin:0" onclick="tira(' + i + ')">🗑️ Tirar</button>' : '') + '</div>' +
      '<div class="pfoto" id="pf' + i + '">' + (p.foto ? '<img src="' + p.foto + '" alt="">' : cs()[0]) + '</div>' +
      '<div class="lin"><button type="button" class="bt peq" onclick="pede(' + i + ',1)">📷 Tirar foto</button><button type="button" class="bt cz peq" onclick="pede(' + i + ',0)">🖼️ Galeria</button></div>' +
      '<div class="st" id="ps' + i + '"></div>' +
      '<label class="l">Nome do ' + esc(cs()[2]) + ' *</label><input id="pn' + i + '" maxlength="60" value="' + esc(p.nome) + '" placeholder="' + esc(cs()[4]) + '">' +
      '<div class="lin"><div><label class="l">Preço R$ *</label><input id="pp' + i + '" inputmode="decimal" maxlength="10" value="' + esc(p.preco) + '" placeholder="' + esc(cs()[5]) + '"></div>' +
      '<div><label class="l">Antes era <small class="d">(opcional)</small></label><input id="pd' + i + '" inputmode="decimal" maxlength="10" value="' + esc(p.de) + '" placeholder="9,99"></div></div>' +
      '<label class="l">' + cs()[7] + '</label><select id="pu' + i + '">' + [['', '— escolha (opcional)']].concat(cs()[6].split(' ').map(function(u){ return [u, UNS[u] || u]; })).map(function(u){ return '<option value="' + u[0] + '"' + (p.un == u[0] ? ' selected' : '') + '>' + u[1] + '</option>'; }).join('') + '</select></div>';
  }).join('');
  $('bAdd').classList.toggle('oculto', PRODS.length >= 6);
}
window.tira = function(i){ lePs(); if (!confirm('Tirar o ' + cs()[2] + ' ' + (i + 1) + '?')) return; PRODS.splice(i, 1); pinta(); };
window.pede = function(i, cam){ lePs(); ALVO = i; (cam ? $('fCam') : $('fGal')).click(); };
$('bAdd').onclick = function(){ lePs(); if (PRODS.length >= 6) return; PRODS.push(novoProd()); pinta(); setTimeout(function(){ $('pr' + (PRODS.length - 1)).scrollIntoView({behavior: 'smooth'}); }, 50); };
$('fCam').onchange = $('fGal').onchange = async function(){
  var f = this.files[0], i = ALVO; this.value = ''; if (!f) return;
  if (i == 'festa'){ $('fFotoSt').textContent = '⏳ Preparando a foto…'; try { FFOTO = await comprime(f, 1024, 280000); pintaFFoto(); $('fFotoSt').textContent = '✅ Foto pronta.'; } catch (e) { $('fFotoSt').textContent = 'Não abriu essa foto. Tente outra.'; } return; }
  $('ps' + i).textContent = '⏳ Preparando a foto…';
  try { PRODS[i].foto = await comprime(f, 1024, 280000); $('pf' + i).innerHTML = '<img src="' + PRODS[i].foto + '" alt="">'; $('ps' + i).textContent = '✅ Foto pronta.'; }
  catch (e) { $('ps' + i).textContent = 'Não abriu essa foto. Tente outra.'; }
};
var FFOTO = '';
function pintaFFoto(){ $('fFotoPrev').innerHTML = FFOTO ? '<img src="' + FFOTO + '" alt="">' : '🎉'; }
$('fCamB').onclick = function(){ ALVO = 'festa'; $('fCam').click(); };
$('fGalB').onclick = function(){ ALVO = 'festa'; $('fGal').click(); };
$('bLogo').onclick = function(){ $('fLogo').click(); };
$('fLogo').onchange = async function(){ var f = this.files[0]; this.value = ''; if (!f) return;
  try { LOGO = await comprime(f, 400, 60000); $('logoPrev').innerHTML = '<img src="' + LOGO + '" alt="">'; } catch (e) { alert('Não abriu essa imagem.'); } };

/* ---------- CEP ---------- */
function jsonCurto(u){ var ac = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if (ac) ac.abort(); }, 8000);
  return fetch(u, ac ? {signal: ac.signal} : {}).then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; }).catch(function(){ clearTimeout(t); return null; }); }
var CEP_ULT = '';
$('cCep').addEventListener('input', async function(){
  var cep = this.value.replace(/\D/g, ''); if (cep.length != 8 || cep == CEP_ULT) return; CEP_ULT = cep;
  this.value = cep.slice(0, 5) + '-' + cep.slice(5); $('cepSt').textContent = '🔎 Procurando o CEP…';
  var d = await jsonCurto('https://viacep.com.br/ws/' + cep + '/json/'), r = null;
  if (d && !d.erro && (d.logradouro || d.localidade)) r = {rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, uf: d.uf};
  else { d = await jsonCurto('https://brasilapi.com.br/api/cep/v1/' + cep); if (d && (d.street || d.city)) r = {rua: d.street, bairro: d.neighborhood, cidade: d.city, uf: d.state}; }
  if (!r){ $('cepSt').textContent = 'Não achei esse CEP. Digite a rua e o bairro.'; return; }
  if (r.rua) $('cRua').value = r.rua; if (r.bairro) $('cBairro').value = r.bairro; $('cCidade').value = r.cidade || ''; $('cUf').value = r.uf || '';
  $('cepSt').textContent = '✅ Achei! Agora digite o número.'; $('cNum').focus();
});

/* ---------- cadastro guardado no aparelho ---------- */
var CAD = null;
/* chave só do cliente (a antiga 'ok_cliente' é apagada e nunca lida: no mesmo site ficam dados do app do Alex) */
var CAD_K = 'okcli_cadastro_v2';
try { localStorage.removeItem('ok_cliente'); } catch (e) {}
function leCad(){ try { var g = JSON.parse(localStorage.getItem(CAD_K) || 'null'); return g && g.porCliente === 1 ? g : null; } catch (e) { return null; } }
function poeCad(g){
  $('cNome').value = g.nome || ''; $('cLoja').value = g.loja || ''; $('cZap').value = g.zap || '';
  if (g.endr){ $('cCep').value = g.endr.cep || ''; $('cRua').value = g.endr.rua || ''; $('cNum').value = g.endr.num || ''; $('cBairro').value = g.endr.bairro || ''; $('cCidade').value = g.endr.cidade || ''; $('cUf').value = g.endr.uf || ''; CEP_ULT = (g.endr.cep || '').replace(/\D/g, ''); }
  if (g.logo && /^data:image\//.test(g.logo)){ LOGO = g.logo; $('logoPrev').innerHTML = '<img src="' + LOGO + '" alt="">'; }
}
function endDe(endr){ var end = endr.rua; if (endr.num) end += (end ? ', ' : '') + endr.num; if (endr.bairro) end += (end ? ' - ' : '') + endr.bairro; return end; }
function pintaResumo(){
  if (!CAD || !CAD.loja || !CAD.zap){ $('cadResumo').classList.add('oculto'); $('cadForm').classList.remove('oculto'); return; }
  var e = CAD.endr ? endDe(CAD.endr) : '';
  $('cadResumo').innerHTML = '✅ <b>' + esc(CAD.loja) + '</b><br>' + (CAD.nome ? '👤 ' + esc(CAD.nome) + '<br>' : '') + '📱 ' + esc(CAD.zap) + (e ? '<br>📍 ' + esc(e) : '') + (CAD.logo ? '<br>🖼️ com logo' : '') +
    '<button type="button" class="bt cz peq" id="bMudaCad" style="margin-top:10px">✏️ Mudar cadastro</button>';
  $('bMudaCad').onclick = function(){ $('cadResumo').classList.add('oculto'); $('cadForm').classList.remove('oculto'); $('cNome').focus(); };
  $('cadResumo').classList.remove('oculto'); $('cadForm').classList.add('oculto');
}

/* ---------- enviar ---------- */
function erro(t){ $('erro').textContent = t; if (t) $('erro').scrollIntoView({block: 'center', behavior: 'smooth'}); }
function abreCad(){ $('cadResumo').classList.add('oculto'); $('cadForm').classList.remove('oculto'); }
$('form').onsubmit = async function(ev){
  ev.preventDefault(); lePs(); erro('');
  var nome = $('cNome').value.trim(), loja = $('cLoja').value.trim(), zap = $('cZap').value.trim(), segNome = '';
  if (SEG == 'outro'){ segNome = $('segOutro').value.trim().slice(0, 30); if (segNome.length < 2){ erro('Digite qual é o seu ramo.'); $('segOutro').focus(); return; } }
  if (nome.length < 2){ abreCad(); erro('Digite o seu nome.'); $('cNome').focus(); return; }
  if (loja.length < 2){ abreCad(); erro(ehFesta() ? 'Digite o nome da empresa ou de quem organiza.' : 'Digite o nome da loja ou empresa.'); $('cLoja').focus(); return; }
  if (zap.replace(/\D/g, '').length < 10){ abreCad(); erro('Digite o WhatsApp com DDD. Ex.: (92) 90000-0000'); $('cZap').focus(); return; }
  var prods = [], fotos = {};
  if (ehFesta()){
    var F = {nome: $('fNome').value.trim().slice(0, 60), dia: $('fDia').value, hora: $('fHora').value, local: $('fLocal').value.trim().slice(0, 80), atracoes: $('fAtracoes').value.trim().slice(0, 100), entrada: $('fEntrada').value.trim().slice(0, 60), contato: ($('fContato').value.trim() || zap).slice(0, 60)};
    if (F.nome.length < 2){ erro('Digite o nome da festa ou evento.'); $('fNome').focus(); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(F.dia)){ erro('Escolha o dia da festa.'); $('fDia').focus(); return; }
    if (!F.hora){ erro('Digite a hora da festa.'); $('fHora').focus(); return; }
    if (F.local.length < 2){ erro('Digite o local da festa.'); $('fLocal').focus(); return; }
    if (FFOTO) fotos['0'] = FFOTO;
    prods.push({nome: F.nome, preco: 0, de: null, un: '', temFoto: !!FFOTO, seg: 'festa', festa: F});
  } else {
    for (var i = 0; i < PRODS.length; i++){
      var p = PRODS[i], pnome = p.nome.trim(), pr = lePreco(p.preco), de = lePreco(p.de);
      if (!pnome && !(pr > 0) && !p.foto) continue; /* item vazio: ignora */
      if (!pnome){ erro('Digite o nome do ' + cs()[2] + ' ' + (i + 1) + '.'); $('pn' + i).focus(); return; }
      if (!(pr > 0) || pr > 9999999){ erro('Digite o preço do ' + cs()[2] + ' ' + (i + 1) + ' (ex.: ' + cs()[5] + ').'); $('pp' + i).focus(); return; }
      if (p.foto) fotos[String(prods.length)] = p.foto;
      var it = {nome: pnome.slice(0, 60), preco: Math.round(pr * 100) / 100, de: de > pr && de < 9999999 ? Math.round(de * 100) / 100 : null, un: cs()[6].split(' ').indexOf(p.un) >= 0 ? p.un : '', temFoto: !!p.foto, seg: SEG};
      if (segNome) it.segNome = segNome;
      prods.push(it);
    }
    if (!prods.length){ erro('Coloque pelo menos 1 ' + cs()[2] + ' com nome e preço.'); return; }
  }
  var endr = {cep: $('cCep').value.trim(), rua: $('cRua').value.trim(), num: $('cNum').value.trim(), comp: '', bairro: $('cBairro').value.trim(), cidade: $('cCidade').value.trim(), uf: $('cUf').value.trim().toUpperCase().slice(0, 2)};
  var end = endDe(endr);
  var ped = {codigo: COD, cliente: nome.slice(0, 60), loja: loja.slice(0, 50), zap: zap.slice(0, 20), end: end.slice(0, 90), endr: endr, logo: LOGO, produtos: prods, nFotos: prods.length, status: 'novo'};
  /* guarda o cadastro neste aparelho antes de enviar (se a internet cair, não perde) */
  CAD = {porCliente: 1, nome: ped.cliente, loja: ped.loja, zap: ped.zap, endr: endr, logo: LOGO, seg: SEG, segNome: segNome};
  try { localStorage.setItem(CAD_K, JSON.stringify(CAD)); } catch (e) { try { var c2 = JSON.parse(JSON.stringify(CAD)); c2.logo = ''; localStorage.setItem(CAD_K, JSON.stringify(c2)); } catch (e2) {} }
  $('bEnviar').disabled = true; $('enviando').classList.remove('oculto'); $('envSt').textContent = 'Enviando… não feche esta tela.'; $('envPr').style.width = '5%';
  try {
    await DB.envia(ped, fotos, function(p){ $('envPr').style.width = Math.round(p * 100) + '%'; });
    $('form').classList.add('oculto'); $('fim').classList.remove('oculto'); window.scrollTo(0, 0);
  } catch (x) {
    var c = (x && (x.code || x.message)) || '';
    erro(/unavailable|network|offline/.test(c) ? 'Sem internet. Confira a conexão e toque em Enviar de novo.' : /permission/.test(c) ? 'Não deu para enviar (o link pode ter vencido). Peça um link novo.' : 'Não deu para enviar (' + c + '). Toque em Enviar de novo.');
  }
  $('bEnviar').disabled = false; $('enviando').classList.add('oculto');
};
$('bOutro').onclick = function(){ PRODS = [novoProd()]; FFOTO = ''; pintaFFoto(); ['fNome', 'fDia', 'fHora', 'fLocal', 'fAtracoes', 'fEntrada', 'fContato'].forEach(function(k){ $(k).value = ''; }); pinta(); pintaResumo(); $('fim').classList.add('oculto'); $('form').classList.remove('oculto'); window.scrollTo(0, 0); };

/* ---------- início ---------- */
if (!TESTE){ firebase.initializeApp(FB); db = firebase.firestore(); }
PRODS = [novoProd()];
CAD = leCad();
if (CAD){ poeCad(CAD); if (!SEG_URL && CAD.seg && CSEG[CAD.seg]) SEG = CAD.seg; if (CAD.segNome) $('segOutro').value = CAD.segNome; }
aplicaSegCli(); pinta(); pintaResumo();
function mostraForm(){ $('carregando').classList.add('oculto'); $('form').classList.remove('oculto'); }
DB.link(COD).then(function(L){
  if (!L || L.ativo === false){ $('carregando').classList.add('oculto'); $('invalido').classList.remove('oculto'); return; }
  LINK = L; if (!SEG_URL && L.seg && CSEG[L.seg]) SEG = L.seg; aplicaSegCli(); pinta();
  /* nunca preenche nada com dados do link (nome, loja): o cadastro começa vazio, só com exemplos em cinza */
  mostraForm();
}).catch(function(){ LINK = {}; mostraForm(); /* se não conseguiu ler o link, deixa tentar enviar mesmo assim */ });
