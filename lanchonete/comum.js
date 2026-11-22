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
