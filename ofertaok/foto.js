/* Oferta Okê — fotos: deixar perfeita (tira fundo, recorta, ilumina, nitidez) e achar foto oficial do produto */
var FOTOS_PROXY = 'https://script.google.com/macros/s/AKfycbwMg_Zn40b89fUGAKZfj3_-qPeXgvRsDjbVjs_ErUaX2PDjn5zshjQUOtnLWm9_JSI/exec';
function novaTela(w, h){ var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function carregaImg(src, cors){ return new Promise(function(ok, ruim){ var i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.onload = function(){ ok(i); }; i.onerror = function(){ ruim(new Error('img')); }; i.src = src; }); }
/* arquivo -> canvas (no máx. lado px) */
async function arquivoParaTela(arq, lado){
  lado = lado || 1280; var url = URL.createObjectURL(arq), im;
  try { im = await carregaImg(url); } finally { setTimeout(function(){ URL.revokeObjectURL(url); }, 2000); }
  var k = Math.min(1, lado / Math.max(im.naturalWidth, im.naturalHeight)), c = novaTela(im.naturalWidth * k, im.naturalHeight * k);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); return c;
}
function telaParaBlob(c, tipo, q){ return new Promise(function(ok){ c.toBlob(ok, tipo || 'image/png', q || 0.92); }); }
/* dataURL pequeno (para salvar no Firestore) */
function telaParaDado(c, maxLado, alvoBytes, alfa){
  maxLado = maxLado || 640; alvoBytes = alvoBytes || 110000;
  var k = Math.min(1, maxLado / Math.max(c.width, c.height)), t = novaTela(c.width * k, c.height * k), g = t.getContext('2d');
  if (!alfa){ g.fillStyle = '#fff'; g.fillRect(0, 0, t.width, t.height); }
  g.drawImage(c, 0, 0, t.width, t.height);
  var q = 0.86, u = t.toDataURL('image/webp', q);
  if (u.indexOf('data:image/webp') != 0) u = alfa ? t.toDataURL('image/png') : t.toDataURL('image/jpeg', q);
  while (u.length * 0.75 > alvoBytes && q > 0.4){ q -= 0.1; u = t.toDataURL(u.indexOf('webp') > 0 ? 'image/webp' : 'image/jpeg', q); }
  if (u.length * 0.75 > alvoBytes && maxLado > 320) return telaParaDado(c, maxLado - 120, alvoBytes, alfa);
  return u;
}

/* ---------- tirar fundo (roda no próprio celular, grátis) ---------- */
var BGR = null;
function carregaRemovedor(){ if (!BGR) BGR = import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm').catch(function(e){ BGR = null; throw e; }); return BGR; }
async function tiraFundo(c, prog){
  var m = await carregaRemovedor(), b = await telaParaBlob(c, 'image/png');
  var out = await m.removeBackground(b, {model: 'isnet_quint8', output: {format: 'image/png'}, progress: function(k, a, t){ if (prog && t) prog(/fetch/.test(k) ? 'Baixando o robô das fotos… ' + Math.round(a / t * 100) + '%' : 'Tirando o fundo…'); }});
  var u = URL.createObjectURL(out), im = await carregaImg(u); URL.revokeObjectURL(u);
  var r = novaTela(im.naturalWidth, im.naturalHeight); r.getContext('2d').drawImage(im, 0, 0); return r;
}
/* caixa do que não é transparente */
function caixaAlfa(c){
  var g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 24){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null; return {x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1};
}
/* corta, ajusta luz/contraste/cor e dá nitidez */
function melhoraRecorte(c){
  var bx = caixaAlfa(c); if (!bx || bx.w * bx.h < c.width * c.height * 0.01) return null;
  var pad = Math.round(Math.max(bx.w, bx.h) * 0.04), t = novaTela(bx.w + pad * 2, bx.h + pad * 2), g = t.getContext('2d');
  g.drawImage(c, bx.x, bx.y, bx.w, bx.h, pad, pad, bx.w, bx.h);
  var im = g.getImageData(0, 0, t.width, t.height), d = im.data, hist = new Uint32Array(256), n = 0;
  for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 128){ hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++; n++; }
  var lo = 0, hi = 255, a = 0; while (lo < 255 && (a += hist[lo]) < n * 0.01) lo++; a = 0; while (hi > 0 && (a += hist[hi]) < n * 0.01) hi--;
  if (hi - lo < 60){ lo = Math.max(0, lo - 30); hi = Math.min(255, hi + 30); }
  var esc = 255 / Math.max(1, hi - lo), media = 0; for (var v = 0; v < 256; v++) media += v * hist[v]; media = n ? media / n : 128;
  var gama = media < 100 ? 0.82 : (media > 175 ? 1.1 : 0.95);
  var lut = new Uint8ClampedArray(256); for (v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(Math.min(1, Math.max(0, (v - lo) * esc / 255)), gama));
  for (i = 0; i < d.length; i += 4){ var r = lut[d[i]], gg = lut[d[i + 1]], b = lut[d[i + 2]], l = 0.299 * r + 0.587 * gg + 0.114 * b, s = 1.18;
    d[i] = l + (r - l) * s; d[i + 1] = l + (gg - l) * s; d[i + 2] = l + (b - l) * s; }
  /* nitidez (unsharp 3x3) */
  var w = t.width, h = t.height, o = new Uint8ClampedArray(d), amt = 0.55;
  for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++){ var p = (y * w + x) * 4; if (d[p + 3] < 10) continue;
    for (var ch = 0; ch < 3; ch++){ var viz = (d[p - 4 + ch] + d[p + 4 + ch] + d[p - w * 4 + ch] + d[p + w * 4 + ch]) / 4; o[p + ch] = d[p + ch] + (d[p + ch] - viz) * amt * 2; } }
  im.data.set(o); g.putImageData(im, 0, 0); return t;
}
/* foto do produto num fundo limpo com sombra (para mostrar e para miniatura) */
function compoeLimpo(src, tipo, lado){
  lado = lado || 600; var t = novaTela(lado, lado), g = t.getContext('2d');
  var gr = g.createRadialGradient(lado / 2, lado * 0.42, lado * 0.05, lado / 2, lado / 2, lado * 0.75); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e9eef5');
  g.fillStyle = gr; g.fillRect(0, 0, lado, lado);
  var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  if (tipo == 'foto'){ var k = Math.max(lado / sw, lado / sh); g.drawImage(src, (lado - sw * k) / 2, (lado - sh * k) / 2, sw * k, sh * k); return t; }
  var m = tipo == 'recorte' ? 0.8 : 0.9, k2 = Math.min(lado * m / sw, lado * m / sh), w = sw * k2, h = sh * k2, x = (lado - w) / 2, y = (lado - h) / 2 - (tipo == 'recorte' ? lado * 0.03 : 0);
  if (tipo == 'recorte'){
    g.save(); g.fillStyle = 'rgba(0,0,0,.22)'; g.filter = 'blur(' + Math.round(lado * 0.02) + 'px)'; g.beginPath(); g.ellipse(lado / 2, y + h + lado * 0.012, w * 0.42, lado * 0.025, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = lado * 0.04; g.shadowOffsetY = lado * 0.015; g.drawImage(src, x, y, w, h); g.restore();
  } else g.drawImage(src, x, y, w, h);
  return t;
}

/* ---------- código de barras ---------- */
var BDPOLI = null;
async function leCodigoBarras(c){
  var fmts = ['ean_13', 'ean_8', 'upc_a', 'upc_e'], det = null;
  try { if ('BarcodeDetector' in window){ var ok = await BarcodeDetector.getSupportedFormats(); if (ok.indexOf('ean_13') >= 0) det = new BarcodeDetector({formats: fmts}); } } catch (e) {}
  if (!det){ try { if (!BDPOLI) BDPOLI = import('https://cdn.jsdelivr.net/npm/barcode-detector@2.3.1/+esm'); var m = await BDPOLI; det = new m.BarcodeDetector({formats: fmts}); } catch (e) { return ''; } }
  try { var r = await det.detect(c); for (var i = 0; i < r.length; i++){ var v = String(r[i].rawValue || '').replace(/\D/g, ''); if (v.length >= 8) return v; } } catch (e) {}
  return '';
}

/* ---------- Gemini lê o rótulo ---------- */
var GEM_TEXTO = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];
async function leRotulo(c, key){
  if (!key) return null;
  var dado = telaParaDado(c, 768, 250000).split(','), mime = dado[0].match(/data:([^;]+)/)[1];
  var corpo = {contents: [{parts: [{inlineData: {mimeType: mime, data: dado[1]}}, {text: 'Esta é a foto de um produto de supermercado. Leia o rótulo e diga qual é o produto. Responda só o JSON.'}]}],
    generationConfig: {responseMimeType: 'application/json', responseSchema: {type: 'OBJECT', properties: {nome: {type: 'STRING', description: 'nome curto como aparece em encarte, ex: Arroz Tio João 5kg'}, marca: {type: 'STRING'}, ean: {type: 'STRING', description: 'código de barras se aparecer legível, senão vazio'}}, required: ['nome']}}};
  for (var volta = 0; volta < 2; volta++) for (var i = 0; i < GEM_TEXTO.length; i++){
    try {
      var r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEM_TEXTO[i] + ':generateContent?key=' + encodeURIComponent(key), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo)});
      if (!r.ok) continue;
      var j = await r.json(), t = j.candidates[0].content.parts.map(function(p){ return p.text || ''; }).join('');
      var o = JSON.parse(t); if (o && o.nome) return o;
    } catch (e) {}
  }
  return null;
}

/* ---------- fotos oficiais ---------- */
function palavras(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/(\d)\s+(kg|g|ml|l)\b/g, '$1$2').split(/[^a-z0-9]+/).filter(function(w){ return w.length > 1 && ['de', 'da', 'do', 'com', 'tipo', 'em', 'para'].indexOf(w) < 0; }); }
/* nota de parecença: palavras em comum, menos palavras sobrando; tipo do produto (1ª palavra) diferente pesa muito (ex.: 'Farinha de arroz' x 'Arroz') */
function nota(q, nome){ var a = palavras(q), b = palavras(nome); if (!a.length || !b.length) return 0; var hit = 0; a.forEach(function(w){ if (b.indexOf(w) >= 0) hit++; });
  var n = hit / a.length - Math.max(0, b.length - hit) * 0.05; if (a.indexOf(b[0]) < 0) n -= 0.3; return n; }
function jsonTempo(u, ms){ var ac = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if (ac) ac.abort(); }, ms || 15000);
  return fetch(u, ac ? {signal: ac.signal} : {}).then(function(r){ clearTimeout(t); return r.ok ? r.json() : null; }).catch(function(){ clearTimeout(t); return null; }); }
async function buscaOficiais(o){
  var ean = String(o.ean || '').replace(/\D/g, ''), q = String(o.nome || '').trim(), lista = [], vistos = {};
  function add(img, nome, fonte, pontos){ if (!img) return; var k = img.split('?')[0]; if (vistos[k]) return; vistos[k] = 1; lista.push({img: img, nome: nome || '', fonte: fonte, pontos: pontos}); }
  var tarefas = [];
  if (ean){
    tarefas.push(jsonTempo('https://world.openfoodfacts.org/api/v2/product/' + ean + '.json?fields=product_name,product_name_pt,brands,quantity,image_front_url,selected_images').then(function(d){
      if (!d || !d.product) return; var p = d.product, nm = (p.product_name_pt || p.product_name || '') + (p.quantity ? ' ' + p.quantity : '');
      if (!q && nm) q = nm.trim(); var f = p.selected_images && p.selected_images.front && p.selected_images.front.display;
      add((f && (f.pt || f.en || f[Object.keys(f)[0]])) || p.image_front_url, nm, 'Open Food Facts', 2); }));
    tarefas.push(jsonTempo(FOTOS_PROXY + '?ean=' + ean, 20000).then(function(d){ (d && d.itens || []).forEach(function(it){ if (!q) q = it.nome; add(it.img, it.nome, it.loja, 2.5); }); }));
    await Promise.all(tarefas); tarefas = [];
  }
  if (q && lista.length < 6){
    tarefas.push(jsonTempo(FOTOS_PROXY + '?q=' + encodeURIComponent(q), 20000).then(function(d){ (d && d.itens || []).forEach(function(it){ add(it.img, it.nome, it.loja, nota(q, it.nome) + 0.3); }); }));
    tarefas.push(jsonTempo('https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(q) + '&json=1&page_size=8&countries_tags_en=brazil&fields=code,product_name,brands,quantity,image_front_url').then(function(d){
      (d && d.products || []).forEach(function(p){ var nm = (p.product_name || '') + (p.quantity ? ' ' + p.quantity : ''); add(p.image_front_url, nm, 'Open Food Facts', nota(q, nm + ' ' + (p.brands || ''))); }); }));
    await Promise.all(tarefas);
  }
  lista.sort(function(a, b){ return b.pontos - a.pontos; });
  return {nome: q, ean: ean, itens: lista.filter(function(x){ return x.pontos >= 0.3; }).slice(0, 6)};
}
/* imagem de fora -> canvas (direto com CORS; se falhar, pelo wsrv.nl) */
async function oficialParaTela(u){
  var im;
  try { im = await carregaImg(u, true); var t = novaTela(1, 1); t.getContext('2d').drawImage(im, 0, 0); t.getContext('2d').getImageData(0, 0, 1, 1); }
  catch (e) { im = await carregaImg('https://wsrv.nl/?url=' + encodeURIComponent(u.replace(/^https?:\/\//, '')) + '&w=900&h=900&fit=inside&output=png', true); }
  var k = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), c = novaTela(im.naturalWidth * k, im.naturalHeight * k), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); return aparaBranco(c);
}
/* tira as bordas brancas sobrando da foto oficial */
function aparaBranco(c){
  var g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data, w = c.width, h = c.height, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y += 2) for (var x = 0; x < w; x += 2){ var p = (y * w + x) * 4; if (d[p] < 238 || d[p + 1] < 238 || d[p + 2] < 238){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0 || (x1 - x0) < w * 0.2) return c;
  var pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  var t = novaTela(x1 - x0 + 1, y1 - y0 + 1); t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height); return t;
}
