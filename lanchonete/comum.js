/* Meu Lanche Pro — funções comuns */
var FB = {apiKey:"AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM",authDomain:"pdv-mercadinho-1c882.firebaseapp.com",projectId:"pdv-mercadinho-1c882",storageBucket:"pdv-mercadinho-1c882.firebasestorage.app",messagingSenderId:"572967904689",appId:"1:572967904689:web:e162701eeab1bc0be48990"};
firebase.initializeApp(FB);
var db = firebase.firestore(), au = firebase.auth();
var ADMINS = ['alexprotasgohan@gmail.com','merceariaaled19@gmail.com','alexprotasioficial@gmail.com'];
var ZAP_ADMIN = '5592995015662';
var BASE_URL = 'https://merceariaaled19-cloud.github.io/Meu-lanches/lanchonete/';

function $(i){ return document.getElementById(i); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function brl(v){ v = Number(v) || 0; return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d),)/g, '.'); }
function num(s){ if (typeof s === 'number') return s; s = String(s || '').replace(/[^\d,.-]/g, ''); if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); var n = parseFloat(s); return isNaN(n) ? 0 : n; }
function soNum(z){ return String(z || '').replace(/\D/g, ''); }
function zapNum(z){ z = soNum(z); if (z && z.length <= 11) z = '55' + z; return z; }
function zapLink(n, t){ return 'https://wa.me/' + zapNum(n) + '?text=' + encodeURIComponent(t || ''); }
function abreZap(n, t){ var u = zapLink(n, t); var w = window.open(u, '_blank'); if (!w) location.href = u; }
function slugify(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'lanchonete'; }
function toast(t, ms){ var d = $('toast'); if (!d){ d = document.createElement('div'); d.id = 'toast'; document.body.appendChild(d); } d.textContent = t; d.className = 'on'; clearTimeout(d._t); d._t = setTimeout(function(){ d.className = ''; }, ms || 2600); }
function copiar(t, msg){
  function ok(){ toast(msg || 'Copiado!'); }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, velho); else velho();
  function velho(){ var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch (e) { prompt('Copie:', t); } a.remove(); }
}
function linkLoja(slug){ return BASE_URL + '?l=' + encodeURIComponent(slug); }

/* ---------- temas ---------- */
var TEMAS = {
  laranja: {nome:'Laranja', p:'#ff6a00', p2:'#ffb300', bg:'#fff8f1', card:'#ffffff', tx:'#2b1a0e', esc:false},
  vermelho:{nome:'Vermelho', p:'#e11d2e', p2:'#ff7a45', bg:'#fff5f5', card:'#ffffff', tx:'#2a0f12', esc:false},
  verde:   {nome:'Verde', p:'#16a34a', p2:'#a3e635', bg:'#f3fbf4', card:'#ffffff', tx:'#0f2416', esc:false},
  roxo:    {nome:'Roxo', p:'#7c3aed', p2:'#f472b6', bg:'#f7f3ff', card:'#ffffff', tx:'#1e1236', esc:false},
  azul:    {nome:'Azul', p:'#2563eb', p2:'#22d3ee', bg:'#f2f7ff', card:'#ffffff', tx:'#0e1b33', esc:false},
  noite:   {nome:'Noite dourada', p:'#f5b301', p2:'#ff6a00', bg:'#121212', card:'#1e1e1e', tx:'#f5f5f5', esc:true}
};
function aplicaTema(k){
  var t = TEMAS[k] || TEMAS.laranja, r = document.documentElement.style;
  r.setProperty('--p', t.p); r.setProperty('--p2', t.p2); r.setProperty('--bg', t.bg); r.setProperty('--card', t.card); r.setProperty('--tx', t.tx);
  r.setProperty('--sub', t.esc ? '#b8b8b8' : '#6b5d52'); r.setProperty('--linha', t.esc ? '#333' : '#eee3d9');
  var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t.p;
}

/* ---------- horário ---------- */
var DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
function horarioPadrao(){ var h = {}; for (var i = 0; i < 7; i++) h[i] = {aberto: true, ini: '18:00', fim: '23:30'}; return h; }
function hm(s){ var p = String(s || '0:0').split(':'); return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0); }
function abertoAgora(h, agora){
  if (!h) return true; agora = agora || new Date();
  var d = agora.getDay(), m = agora.getHours() * 60 + agora.getMinutes();
  var hoje = h[d], ont = h[(d + 6) % 7];
  if (hoje && hoje.aberto){ var a = hm(hoje.ini), f = hm(hoje.fim); if (f > a ? (m >= a && m < f) : (m >= a)) return true; }
  if (ont && ont.aberto){ var a2 = hm(ont.ini), f2 = hm(ont.fim); if (f2 <= a2 && m < f2) return true; }
  return false;
}
function proximaAbertura(h){
  if (!h) return ''; var agora = new Date(), d = agora.getDay(), m = agora.getHours() * 60 + agora.getMinutes();
  for (var k = 0; k < 8; k++){
    var dd = (d + k) % 7, x = h[dd]; if (!x || !x.aberto) continue;
    if (k === 0 && hm(x.ini) <= m) continue;
    return (k === 0 ? 'hoje' : k === 1 ? 'amanhã' : DIAS[dd].toLowerCase()) + ' às ' + x.ini;
  }
  return '';
}

/* ---------- entrega ---------- */
function distKm(a, b, c, d){ var R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; var s = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * R * Math.asin(Math.sqrt(s)); }
function taxaPorDist(faixas, km){ var f = (faixas || []).slice().sort(function(a, b){ return a.km - b.km; }); for (var i = 0; i < f.length; i++) if (km <= f[i].km) return f[i]; return null; }
function coordsDoLink(t){ t = String(t || ''); var m = t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || t.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || t.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/); return m ? {lat: parseFloat(m[1]), lng: parseFloat(m[2])} : null; }

/* ---------- mensagens ---------- */
var MSGS_PADRAO = [
  {id:'recebido', nome:'✅ Pedido recebido', txt:'Olá, {nome}! Recebemos seu pedido nº {pedido} no valor de {total}. Já já começamos a preparar! 😋'},
  {id:'preparo', nome:'👨‍🍳 Em preparo', txt:'{nome}, seu pedido nº {pedido} já está sendo preparado! 🍔🔥'},
  {id:'saiu', nome:'🛵 Saiu para entrega', txt:'{nome}, seu pedido nº {pedido} saiu para entrega! Total: {total}. Logo chega aí! 🛵'},
  {id:'pronto', nome:'🛍️ Pronto para retirar', txt:'{nome}, seu pedido nº {pedido} está pronto para retirar aqui na {loja}! 😉'},
  {id:'pix', nome:'💠 Chave Pix', txt:'{nome}, o total do seu pedido é {total}. Chave Pix: {pix}. Pode mandar o comprovante aqui. Obrigado!'},
  {id:'obrigado', nome:'🙏 Obrigado', txt:'Obrigado pela preferência, {nome}! Volte sempre na {loja}! ❤️'}
];
function montaMsg(txt, p, loja){
  return String(txt || '').replace(/\{nome\}/g, (p.cliente && p.cliente.nome || '').split(' ')[0] || 'cliente').replace(/\{total\}/g, brl(p.total)).replace(/\{pedido\}/g, p.numero || '').replace(/\{loja\}/g, loja && loja.nome || 'lanchonete').replace(/\{pix\}/g, loja && loja.pag && loja.pag.pixChave || '');
}
function textoPedido(p, loja){
  var L = [];
  L.push('🍔 *NOVO PEDIDO nº ' + p.numero + '*' + (loja && loja.nome ? ' — ' + loja.nome : ''));
  L.push('');
  (p.itens || []).forEach(function(i){ L.push(i.qtd + 'x ' + i.nome + ' — ' + brl(i.preco * i.qtd)); });
  if (p.obs) L.push('📝 Obs.: ' + p.obs);
  L.push('');
  L.push('Subtotal: ' + brl(p.subtotal));
  if (p.entrega === 'entrega') L.push('Entrega: ' + (p.taxaCombinar ? 'a combinar' : brl(p.taxa)) + (p.dist != null ? ' (' + p.dist.toFixed(1).replace('.', ',') + ' km)' : ''));
  L.push('*Total: ' + brl(p.total) + '*');
  L.push('');
  var c = p.cliente || {};
  L.push('👤 ' + (c.nome || '') + ' — ' + (c.tel || ''));
  if (p.entrega === 'entrega'){
    L.push('🏠 ' + [c.rua, c.num].filter(Boolean).join(', ') + (c.bairro ? ' — ' + c.bairro : ''));
    if (c.ref) L.push('📍 Referência: ' + c.ref);
    if (c.lat != null) L.push('🗺️ Localização: https://maps.google.com/?q=' + c.lat.toFixed(6) + ',' + c.lng.toFixed(6));
  } else L.push('🛍️ Vou retirar no local');
  var pg = p.pag || {};
  var pt = {dinheiro:'💵 Dinheiro', cartao:'💳 Cartão na entrega', pix:'💠 Pix'}[pg.tipo] || pg.tipo;
  L.push('Pagamento: ' + pt + (pg.tipo === 'dinheiro' ? (pg.troco ? ' — troco para ' + brl(pg.troco) : ' — sem troco') : ''));
  return L.join('\n');
}

/* ---------- imagens ---------- */
function lerArquivo(f){ return new Promise(function(ok, err){ var r = new FileReader(); r.onload = function(){ ok(r.result); }; r.onerror = err; r.readAsDataURL(f); }); }
function carregaImg(src){ return new Promise(function(ok, err){ var i = new Image(); i.onload = function(){ ok(i); }; i.onerror = function(){ err(new Error('Não abriu a imagem')); }; i.src = src; }); }
function arquivoParaCanvas(f, max){
  return lerArquivo(f).then(carregaImg).then(function(img){
    var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, (max || 2000) / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c;
  });
}
function nitidez(ctx, w, h, forca){
  var im = ctx.getImageData(0, 0, w, h), d = im.data, o = new Uint8ClampedArray(d), k = forca || 0.35;
  for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++){
    var i = (y * w + x) * 4;
    for (var c = 0; c < 3; c++){
      var v = o[i + c] * (1 + 4 * k) - k * (o[i - 4 + c] + o[i + 4 + c] + o[i - w * 4 + c] + o[i + w * 4 + c]);
      d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  ctx.putImageData(im, 0, 0);
}
/* recorta (sx,sy,sw,sh em px do canvas origem), amplia 2x até 600px, melhora e devolve webp base64 */
function melhoraFoto(src, sx, sy, sw, sh, maxLado){
  maxLado = maxLado || 600;
  sx = sx || 0; sy = sy || 0; sw = sw || src.width; sh = sh || src.height;
  var esc = Math.min(2, maxLado / Math.max(sw, sh)); if (esc <= 0) esc = 1;
  var w = Math.max(1, Math.round(sw * esc)), h = Math.max(1, Math.round(sh * esc));
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  try { x.filter = 'contrast(1.07) saturate(1.15) brightness(1.03)'; } catch (e) {}
  x.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
  try { x.filter = 'none'; } catch (e) {}
  nitidez(x, w, h, esc > 1.2 ? 0.4 : 0.25);
  var q = 0.82, out = c.toDataURL('image/webp', q);
  if (out.indexOf('data:image/webp') !== 0) out = c.toDataURL('image/jpeg', 0.8);
  while (out.length > 180000 && q > 0.4){ q -= 0.12; out = c.toDataURL(out.indexOf('webp') > 0 ? 'image/webp' : 'image/jpeg', q); }
  return out;
}
function fotoDeArquivo(f, maxLado){ return arquivoParaCanvas(f, 1600).then(function(c){ return melhoraFoto(c, 0, 0, c.width, c.height, maxLado || 600); }); }
function logoDeArquivo(f){ return arquivoParaCanvas(f, 1200).then(function(c){ var l = Math.min(c.width, c.height); return melhoraFoto(c, (c.width - l) / 2, (c.height - l) / 2, l, l, 256); }); }

/* ---------- service worker ---------- */
if ('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(r){ r.update(); setInterval(function(){ r.update(); }, 30 * 60 * 1000); }).catch(function(){});
    var recarregou = false, tinha = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function(){ if (recarregou || !tinha) return; recarregou = true; if (!window.__naoRecarregar) location.reload(); });
  });
}

/* ---------- tipos de lanchonete / categorias ---------- */
var TIPOS = {
  sanduiche: {nome: 'Sanduíches/Hambúrguer', ico: '🍔', cats: ['Hambúrgueres', 'Sanduíches', 'Porções', 'Adicionais']},
  kikao:     {nome: 'Kikão (cachorro-quente)', ico: '🌭', cats: ['Kikão', 'Adicionais']},
  pizza:     {nome: 'Pizza', ico: '🍕', cats: ['Pizzas Salgadas', 'Pizzas Doces', 'Bordas']},
  pastel:    {nome: 'Pastel', ico: '🥟', cats: ['Pastéis Salgados', 'Pastéis Doces']},
  comida:    {nome: 'Comida (marmita/pratos)', ico: '🍛', cats: ['Marmitas', 'Pratos', 'Acompanhamentos']},
  bebidas:   {nome: 'Bebidas', ico: '🥤', cats: ['Refrigerantes', 'Sucos', 'Água']}
};
var TIPOS_ORDEM = ['sanduiche', 'kikao', 'pizza', 'pastel', 'comida', 'bebidas'];
function catsDosTipos(tipos){
  var c = [];
  TIPOS_ORDEM.forEach(function(t){ if ((tipos || []).indexOf(t) >= 0) TIPOS[t].cats.forEach(function(x){ if (c.indexOf(x) < 0) c.push(x); }); });
  /* "Adicionais" sempre no fim */
  var a = c.indexOf('Adicionais'); if (a >= 0){ c.splice(a, 1); c.push('Adicionais'); }
  return c;
}
function nomesTipos(tipos){ return TIPOS_ORDEM.filter(function(t){ return (tipos || []).indexOf(t) >= 0; }).map(function(t){ return TIPOS[t].nome; }); }
function normTxt(s){ return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
var ICO_CAT = [
  [/pizza.*doce|doce.*pizza/, '🍫'], [/borda/, '🧀'], [/pizza/, '🍕'], [/kikao|cachorro|hot ?dog|dogao/, '🌭'],
  [/hamburg|burger|burguer|smash|^x | x /, '🍔'], [/sanduich|lanche|misto|baurU|beirute/i, '🥪'], [/pastel|pasteis/, '🥟'],
  [/marmit|prato|refeic|almoco|janta|executivo|comida/, '🍛'], [/acompanh|porc|batata|frita/, '🍟'], [/refri|refrigerante|lata|cola/, '🥤'],
  [/suco|vitamina|polpa/, '🧃'], [/agua/, '💧'], [/cerveja|chopp/, '🍺'], [/bebida|drink/, '🥤'], [/acai/, '🍇'],
  [/sobremesa|doce|bolo|sorvete|milk/, '🍰'], [/adiciona|extra|complement/, '➕'], [/combo|promo/, '🔥'], [/salada/, '🥗'], [/cafe/, '☕']
];
function icoCat(cat){ var n = ' ' + normTxt(cat) + ' '; for (var i = 0; i < ICO_CAT.length; i++) if (ICO_CAT[i][0].test(n)) return ICO_CAT[i][1]; return '🍽️'; }
/* escolhe a categoria da lista que mais combina com a sugerida (ex.: "refri" -> "Refrigerantes") */
var SIN_CAT = [
  [/refri|refrigerante|lata|coca|guarana|2 ?l/, 'refrigerantes'], [/suco|vitamina|polpa/, 'sucos'], [/agua/, 'agua'],
  [/pizza.*doce|doce.*pizza/, 'pizzas doces'], [/borda/, 'bordas'], [/pizza/, 'pizzas salgadas'],
  [/kikao|cachorro|hot ?dog|dogao/, 'kikao'], [/pastel.*doce|doce.*pastel/, 'pasteis doces'], [/pastel|pasteis/, 'pasteis salgados'],
  [/hamburg|burger|burguer|smash/, 'hamburgueres'], [/sanduich|lanche|misto|x /, 'sanduiches'], [/porc|batata|frita/, 'porcoes'],
  [/marmit|quentinha/, 'marmitas'], [/prato|refeic|executivo|almoco/, 'pratos'], [/acompanh|arroz|farofa/, 'acompanhamentos'], [/adiciona|extra/, 'adicionais']
];
function casaCat(cat, lista){
  lista = lista || []; var n = normTxt(cat);
  if (!n) return lista[0] || 'Lanches';
  var ns = lista.map(normTxt), i;
  for (i = 0; i < ns.length; i++) if (ns[i] === n) return lista[i];
  var sing = function(s){ return s.split(' ').map(function(w){ return w.replace(/(oes|aes)$/, 'ao').replace(/eis$/, 'el').replace(/s$/, ''); }).join(' '); };
  for (i = 0; i < ns.length; i++) if (sing(ns[i]) === sing(n)) return lista[i];
  for (i = 0; i < ns.length; i++) if (ns[i].length > 3 && (n.indexOf(ns[i]) >= 0 || ns[i].indexOf(n) >= 0) && n.length > 3) return lista[i];
  var nx = ' ' + n + ' ';
  for (var s = 0; s < SIN_CAT.length; s++) if (SIN_CAT[s][0].test(nx)){
    for (i = 0; i < ns.length; i++) if (ns[i] === SIN_CAT[s][1] || sing(ns[i]) === sing(SIN_CAT[s][1])) return lista[i];
  }
  return String(cat).trim().replace(/^\w/, function(c){ return c.toUpperCase(); });
}

/* ---------- tamanhos / adicionais / meio a meio ---------- */
var TAM_PIZZA = ['Broto', 'Pequena', 'Média', 'Grande', 'Família'];
/* chave do tamanho: broto | p | m | g | fam (P = Pequena, M = Média...) */
function chaveTam(n){ n = ' ' + normTxt(n) + ' '; if (/broto|mini|individual/.test(n)) return 'broto'; if (/familia|gigante|big|extra ?grande| gg /.test(n)) return 'fam'; if (/pequen| p /.test(n)) return 'p'; if (/medi| m /.test(n)) return 'm'; if (/grand| g /.test(n)) return 'g'; return n.trim(); }
var MAX_SAB = {broto: 1, p: 2, m: 2, g: 3, fam: 4};
function maxSabores(nomeTam){ var k = chaveTam(nomeTam); return MAX_SAB[k] || 2; }
function limpaOpcoes(a){ return (a || []).map(function(x){ return {nome: String(x && x.nome || '').trim(), preco: num(x && x.preco)}; }).filter(function(x){ return x.nome; }); }
function temOpcoes(i){ return !!(i && ((i.tamanhos && i.tamanhos.length) || (i.adicionais && i.adicionais.length) || i.meioMeio)); }
function precoMin(i){ if (i && i.tamanhos && i.tamanhos.length) return Math.min.apply(null, i.tamanhos.map(function(t){ return Number(t.preco) || 0; })); return Number(i && i.preco) || 0; }
function chaveLinha(id, o){ o = o || {}; var a = (o.adds || []).slice().sort(function(x, y){ return x - y; }); if (o.tam == null && !o.meio && !a.length) return id; return id + '|' + (o.tam == null ? '' : o.tam) + '|' + (o.meio || '') + '|' + a.join(','); }
function listaOutros(outro){ return !outro ? [] : (outro.length != null && !outro.id ? outro : [outro]).filter(Boolean); }
function precoNoTam(x, nomeTam, padrao){ if (!x.tamanhos || !x.tamanhos.length) return Number(x.preco) || 0; var k = chaveTam(nomeTam); var t = x.tamanhos.filter(function(y){ return chaveTam(y.nome) === k; })[0]; return t ? Number(t.preco) || 0 : padrao; }
/* preço de 1 unidade: tamanho escolhido (vários sabores = o sabor mais caro no mesmo tamanho) + adicionais */
function precoLinha(i, o, outro){
  o = o || {}; var p = Number(i.preco) || 0, t = null, os = listaOutros(outro);
  if (i.tamanhos && i.tamanhos.length){ t = i.tamanhos[o.tam] || i.tamanhos[0]; p = Number(t.preco) || 0; }
  if (o.meio) os.forEach(function(x){ p = Math.max(p, t ? precoNoTam(x, t.nome, p) : Number(x.preco) || 0); });
  (o.adds || []).forEach(function(k){ var a = (i.adicionais || [])[k]; if (a) p += Number(a.preco) || 0; });
  return Math.round(p * 100) / 100;
}
function nomeLinha(i, o, outro){
  o = o || {}; var n = i.nome, os = o.meio ? listaOutros(outro) : [];
  if (os.length){ var fr = ['', '', '½', '⅓', '¼'][os.length + 1] || ''; n = (os.length + 1) + ' sabores: ' + [i].concat(os).map(function(x){ return fr + ' ' + x.nome; }).join(' + '); }
  if (i.tamanhos && i.tamanhos.length){ var t = i.tamanhos[o.tam] || i.tamanhos[0]; n += ' (' + t.nome + ')'; }
  var ad = (o.adds || []).map(function(k){ return (i.adicionais || [])[k]; }).filter(Boolean).map(function(a){ return a.nome; });
  if (ad.length) n += ' + ' + ad.join(', ');
  return n;
}
/* tipo do produto (pela IA ou pelo nome) -> categoria certa da loja */
var TIPO_CAT = {pizza: ['Pizzas Salgadas', 'Pizzas'], pizza_doce: ['Pizzas Doces', 'Pizzas Doces'], borda: ['Bordas', 'Bordas'],
  hamburguer: ['Hambúrgueres', 'Hambúrgueres'], sanduiche: ['Sanduíches', 'Sanduíches'], kikao: ['Kikão', 'Kikão'],
  pastel: ['Pastéis Salgados', 'Pastéis'], pastel_doce: ['Pastéis Doces', 'Pastéis Doces'], marmita: ['Marmitas', 'Marmitas'], prato: ['Pratos', 'Pratos'],
  porcao: ['Porções', 'Porções'], refrigerante: ['Refrigerantes', 'Refrigerantes'], suco: ['Sucos', 'Sucos'], agua: ['Água', 'Água'],
  bebida: ['Bebidas', 'Bebidas'], sobremesa: ['Sobremesas', 'Sobremesas'], combo: ['Combos', 'Combos'], adicional: ['Adicionais', 'Adicionais']};
var TIPO_NOME = [
  [/pizza.*(chocolate|brigadeiro|banana|romeu|prestigio|doce|morango|nutella)|(chocolate|brigadeiro|banana|romeu|prestigio|morango|nutella).*pizza/, 'pizza_doce'],
  [/borda/, 'borda'], [/pizza|calabresa|mussarela|marguerita|portuguesa|quatro queijos|frango com catupiry|napolitana|toscana/, 'pizza'],
  [/kikao|cachorro|hot ?dog|dogao/, 'kikao'], [/pastel.*(chocolate|doce|banana|romeu)/, 'pastel_doce'], [/pastel|pasteis/, 'pastel'],
  [/combo/, 'combo'], [/hamburg|burger|burguer|smash|^x |\bx (tudo|salada|bacon|egg|frango|burg|calabresa)/, 'hamburguer'],
  [/sanduich|misto|bauru|beirute|americano|lanche/, 'sanduiche'], [/marmit|quentinha/, 'marmita'], [/prato|executivo|parmegiana|file|bife/, 'prato'],
  [/porc|batata frita|fritas|calabresa acebolada|isca/, 'porcao'],
  [/refri|refrigerante|coca|guarana|fanta|sprite|pepsi|lata|2 ?l\b|600 ?ml/, 'refrigerante'], [/suco|vitamina|polpa/, 'suco'], [/agua/, 'agua'],
  [/milk ?shake|sorvete|acai|sobremesa|pudim|bolo|brownie/, 'sobremesa'], [/cerveja|chopp|bebida|cha |cafe/, 'bebida']];
function tipoDoNome(t){ var n = ' ' + normTxt(t) + ' '; for (var i = 0; i < TIPO_NOME.length; i++) if (TIPO_NOME[i][0].test(n)) return TIPO_NOME[i][1]; return ''; }
function catDoTipo(tipo, cats, sugerida){
  var tc = TIPO_CAT[tipo]; if (!tc) return casaCat(sugerida || '', cats);
  var ns = (cats || []).map(normTxt), alvo = [tc[0], tc[1]];
  for (var a = 0; a < alvo.length; a++){ var k = ns.indexOf(normTxt(alvo[a])); if (k >= 0) return cats[k]; }
  if (tipo === 'pizza'){ for (var q = 0; q < ns.length; q++) if (/pizza/.test(ns[q]) && !/doce|borda/.test(ns[q])) return cats[q]; }
  if (tipo === 'hamburguer'){ var s = ns.indexOf('sanduiches'); if (s >= 0) return cats[s]; }
  if (tipo === 'sanduiche'){ var hb = ns.indexOf('hamburgueres'); if (hb >= 0) return cats[hb]; }
  return tc[1];
}
function ehPizza(cat){ var n = normTxt(cat); return /pizza/.test(n) && !/borda/.test(n); }
function ehPizzaTipo(t){ return t === 'pizza' || t === 'pizza_doce'; }
/* tamanhos de pizza: Broto / Pequena / Média / Grande / Família (os que o cardápio tiver; senão P/M/G em branco) */
function tamanhosPizza(tams, preco){
  var m = {}, ord = [['broto', 'Broto'], ['p', 'Pequena'], ['m', 'Média'], ['g', 'Grande'], ['fam', 'Família']];
  (tams || []).forEach(function(t){ var k = chaveTam(t.nome); if (MAX_SAB[k]) m[k] = t.preco; });
  if (!Object.keys(m).length){ m = {p: '', m: num(preco) > 0 ? num(preco) : '', g: ''}; }
  return ord.filter(function(o){ return o[0] in m; }).map(function(o){ return {nome: o[1], preco: m[o[0]]}; });
}
/* converte um item devolvido pela IA no formato da tela de revisão */
function itemDaIA(it, cats){
  if (!it || !String(it.nome || '').trim()) return null;
  var nome = String(it.nome).trim().replace(/\s+/g, ' '), desc = String(it.descricao || it.desc || '').trim();
  var tipo = String(it.tipo || '').toLowerCase();
  if (!TIPO_CAT[tipo]) tipo = tipoDoNome(nome) || tipoDoNome(it.categoria || '') || tipoDoNome(desc) || '';
  var tams = limpaOpcoes(it.tamanhos).filter(function(t){ return t.preco > 0; });
  var preco = Number(it.preco) > 0 ? Number(it.preco) : (typeof it.preco === 'string' && num(it.preco) > 0 ? num(it.preco) : '');
  if (!(preco > 0) && tams.length) preco = Math.min.apply(null, tams.map(function(t){ return t.preco; }));
  var cat = catDoTipo(tipo, cats, it.categoria || it.cat || '');
  if (ehPizzaTipo(tipo)) return {ok: true, nome: nome, desc: desc, preco: preco, tamanhos: tamanhosPizza(tams, preco), cat: cat, tipo: tipo, foto: ''};
  return {ok: true, nome: nome, desc: desc, preco: preco, tamanhos: [], cat: cat, tipo: tipo, foto: ''};
}
/* caixa da IA [ymin,xmin,ymax,xmax] 0-1000 -> retângulo em px com 2% de folga (null se inválida) */
function caixaPx(b, W, H, maxFrac){
  if (!b || b.length !== 4 || !b.every(function(v){ return typeof v === 'number' && isFinite(v); })) return null;
  var y0 = Math.min(b[0], b[2]) / 1000 * H, x0 = Math.min(b[1], b[3]) / 1000 * W, y1 = Math.max(b[0], b[2]) / 1000 * H, x1 = Math.max(b[1], b[3]) / 1000 * W;
  var w = x1 - x0, h = y1 - y0, mf = maxFrac || 0.95;
  if (w < 30 || h < 30 || (w > W * mf && h > H * mf)) return null;
  var px = w * 0.02, py = h * 0.02;
  x0 = Math.max(0, x0 - px); y0 = Math.max(0, y0 - py);
  return {x: x0, y: y0, w: Math.min(W - x0, w + 2 * px), h: Math.min(H - y0, h + 2 * py)};
}
/* lê o JSON devolvido pela IA (tira ``` e lixo em volta); null se não der */
function lerJsonIA(t){
  t = String(t || '').replace(/^\s*```(json)?/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  var a = t.indexOf('{'), z = t.lastIndexOf('}');
  if (a >= 0 && z > a){ try { return JSON.parse(t.slice(a, z + 1)); } catch (e) {} }
  /* resposta cortada: tenta fechar a lista de itens no último item completo */
  var u = t.lastIndexOf('},');
  if (a >= 0 && u > a){ try { return JSON.parse(t.slice(a, u + 1) + ']}'); } catch (e) {} }
  return null;
}

/* ---------- planos e Pix (assinatura) ---------- */
var PLANOS = [
  {id: 'mensal', nome: 'Mensal', dias: 30, valor: 29.90},
  {id: 'semestral', nome: 'Semestral', dias: 180, valor: 99.90, selo: 'Economize 44%'},
  {id: 'anual', nome: 'Anual', dias: 365, valor: 199.90, selo: 'Melhor preço'}
];
var TESTE_HORAS = 24;
function planoPorId(id){ for (var i = 0; i < PLANOS.length; i++) if (PLANOS[i].id === id) return PLANOS[i]; return null; }
function pixTxt(t, max){ return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 .\-]/g, '').toUpperCase().slice(0, max); }
function crc16(s){ var c = 0xFFFF; for (var i = 0; i < s.length; i++){ c ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return ('0000' + c.toString(16).toUpperCase()).slice(-4); }
function pixCopiaCola(chave, nome, cidade, valor, txid){
  function f(id, v){ return id + ('0' + v.length).slice(-2) + v; }
  var k = String(chave || '').trim(); if (/^[\d.\-\/ ]+$/.test(k)) k = soNum(k);
  var p = f('00', '01') + f('26', f('00', 'br.gov.bcb.pix') + f('01', k)) + f('52', '0000') + f('53', '986') + (valor ? f('54', Number(valor).toFixed(2)) : '') +
    f('58', 'BR') + f('59', pixTxt(nome, 25) || 'RECEBEDOR') + f('60', pixTxt(cidade, 15) || 'MANAUS') + f('62', f('05', (pixTxt(txid, 25).replace(/[^A-Z0-9]/g, '') || '***'))) + '6304';
  return p + crc16(p);
}
