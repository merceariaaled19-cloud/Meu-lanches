/* Oferta Okê — robô das fotos (roda num Web Worker, fora da tela principal, para o celular não travar)
   Modelo: MediaPipe Interactive Segmenter (toque no centro + risco no produto recortado) "MagicTouch" (~6 MB) + motor wasm (~9,6 MB), baixados só quando o usuário toca em Perfeita.
   Entrada {img: ImageData, modo: 'perfeita'|'melhora'}
   Saída   {tipo:'prog', txt} | {tipo:'ok', img: ImageData, recorte: bool, ms} | {tipo:'erro', msg} */
var VER = '0.10.22-rc.20250304', BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + VER;
var MODELO = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';
var WASM = BASE + '/wasm/vision_wasm_internal.wasm';
var CACHE_ROBO = 'okrobo-v1';
var SEG = null;
function prog(t){ self.postMessage({tipo: 'prog', txt: t}); }

async function baixa(urls, aoProgresso){
  var cache = null; try { cache = await caches.open(CACHE_ROBO); } catch (e) {}
  var saida = [], faltam = [];
  for (var i = 0; i < urls.length; i++){ var m = cache ? await cache.match(urls[i]) : null; if (m) saida[i] = await m.arrayBuffer(); else faltam.push(i); }
  if (!faltam.length) return saida;
  var total = 0, feito = 0, resps = [];
  for (var k = 0; k < faltam.length; k++){ var r = await fetch(urls[faltam[k]]); if (!r.ok) throw new Error('baixar ' + r.status); resps.push(r); total += +(r.headers.get('content-length') || 0); }
  for (k = 0; k < resps.length; k++){
    var rd = resps[k].body.getReader(), partes = [], n = 0;
    for (;;){ var x = await rd.read(); if (x.done) break; partes.push(x.value); n += x.value.length; feito += x.value.length; if (total) aoProgresso(Math.min(99, Math.round(feito / total * 100))); }
    var buf = new Uint8Array(n), o = 0; partes.forEach(function(p){ buf.set(p, o); o += p.length; });
    saida[faltam[k]] = buf.buffer;
    if (cache) try { await cache.put(urls[faltam[k]], new Response(buf.slice(0), {headers: {'Content-Type': 'application/octet-stream'}})); } catch (e) {}
  }
  self.BAIXADO = feito;
  return saida;
}

async function carregaRobo(){
  if (SEG) return SEG;
  prog('Baixando o robô… 0%');
  self.module = {exports: {}}; self.exports = self.module.exports;
  /* o CDN manda o .cjs com tipo errado; lê como texto e carrega por blob */
  var js = await (await fetch(BASE + '/vision_bundle.cjs')).text();
  importScripts(URL.createObjectURL(new Blob([js], {type: 'text/javascript'})));
  var V = self.module.exports;
  var bufs = await baixa([MODELO, WASM], function(p){ prog('Baixando o robô… ' + p + '%'); });
  var wasmUrl = URL.createObjectURL(new Blob([bufs[1]], {type: 'application/wasm'}));
  prog('Ligando o robô…');
  SEG = await V.InteractiveSegmenter.createFromOptions({wasmLoaderPath: BASE + '/wasm/vision_wasm_internal.js', wasmBinaryPath: wasmUrl},
    {baseOptions: {modelAssetBuffer: new Uint8Array(bufs[0]), delegate: 'CPU'}, outputCategoryMask: false, outputConfidenceMasks: true});
  return SEG;
}

function pegaMascara(r){ var m = r.confidenceMasks && r.confidenceMasks[0]; return m ? {w: m.width, h: m.height, d: new Float32Array(m.getAsFloat32Array())} : null; }
function umaMascara(seg, img, x, y){
  var out = null;
  seg.segment(img, {keypoint: {x: x, y: y}}, function(r){ out = pegaMascara(r); });
  if (!out) throw new Error('sem máscara');
  return out;
}
/* recorta um pedaço da foto (ImageData) */
function pedaco(img, x0, y0, w, h){
  var W = img.width, o = new Uint8ClampedArray(w * h * 4);
  for (var y = 0; y < h; y++) o.set(img.data.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x0 + w) * 4), y * w * 4);
  return new ImageData(o, w, h);
}
/* pedaço principal (ligado, perto do centro) com limiar t: devolve marcas + caixa */
function principal(m, t){
  var w = m.w, h = m.h, d = m.d, vis = new Uint8Array(w * h), fila = new Int32Array(w * h), melhor = null, melhorN = 0;
  for (var s = 0; s < w * h; s++){ if (vis[s] || d[s] < t) continue;
    var ini = 0, fim = 0, cx = 0, cy = 0; fila[fim++] = s; vis[s] = 1;
    while (ini < fim){ var p = fila[ini++], x = p % w, y = (p / w) | 0; cx += x; cy += y;
      if (x > 0 && !vis[p - 1] && d[p - 1] >= t){ vis[p - 1] = 1; fila[fim++] = p - 1; }
      if (x < w - 1 && !vis[p + 1] && d[p + 1] >= t){ vis[p + 1] = 1; fila[fim++] = p + 1; }
      if (y > 0 && !vis[p - w] && d[p - w] >= t){ vis[p - w] = 1; fila[fim++] = p - w; }
      if (y < h - 1 && !vis[p + w] && d[p + w] >= t){ vis[p + w] = 1; fila[fim++] = p + w; } }
    var dx = cx / fim / w - 0.5, dy = cy / fim / h - 0.5, nota = fim * (1 - Math.min(0.8, Math.sqrt(dx * dx + dy * dy)));
    if (nota > melhorN){ melhorN = nota; melhor = fila.slice(0, fim); } }
  if (!melhor) return null;
  var mk = new Uint8Array(w * h), x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var i = 0; i < melhor.length; i++){ var q = melhor[i], qx = q % w, qy = (q / w) | 0; mk[q] = 1; if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy; }
  return {mk: mk, n: melhor.length, x0: x0, y0: y0, x1: x1, y1: y1};
}
/* 1) toca no centro da foto  2) recorta em volta do produto (com folga) e passa um risco pelo meio dele, de ponta a ponta.
   Olhando de perto e com o risco, o robô pega tampinha, alça, gargalo e rótulo que ficavam de fora. */
function mascara(seg, img){
  var m = umaMascara(seg, img, 0.5, 0.5), w = m.w, h = m.h;
  self.TAM_MASCARA = w + 'x' + h; self.REFINO = 'não';
  var p = principal(m, 0.5); if (!p || p.n < w * h * 0.01) return m;
  var bw = p.x1 - p.x0 + 1, bh = p.y1 - p.y0 + 1, em = Math.max(bw, bh);
  var cx0 = Math.max(0, Math.round(p.x0 - Math.max(bw * 0.5, em * 0.15))), cx1 = Math.min(w - 1, Math.round(p.x1 + Math.max(bw * 0.5, em * 0.15)));
  var cy0 = Math.max(0, Math.round(p.y0 - Math.max(bh * 0.25, em * 0.15))), cy1 = Math.min(h - 1, Math.round(p.y1 + Math.max(bh * 0.25, em * 0.15)));
  var cw = cx1 - cx0 + 1, ch = cy1 - cy0 + 1;
  if (cw * ch > w * h * 0.9) cw = 0; /* produto já ocupa a foto toda: o risco direto basta */
  /* riscos pelo eixo comprido do produto, passando pelo meio de cada ponta (acompanha produto torto).
     O robô é sensível ao risco exato, então tenta 3 riscos parecidos e junta os que passam na conferência. */
  var deitado = bw > bh * 1.15;
  function meio(f){ var a, soma = 0, n = 0, k;
    if (!deitado){ a = Math.round(p.y0 + f * (bh - 1)); for (k = p.x0; k <= p.x1; k++) if (p.mk[a * w + k]){ soma += k; n++; } return n ? [soma / n, a] : null; }
    a = Math.round(p.x0 + f * (bw - 1)); for (k = p.y0; k <= p.y1; k++) if (p.mk[k * w + a]){ soma += k; n++; } return n ? [a, soma / n] : null; }
  var riscos = [[0.05, 0.95], [0.05, 0.5, 0.95], [0.03, 0.97]].map(function(fs){ return fs.map(meio).filter(Boolean); }).filter(function(r){ return r.length >= 2; });
  if (!riscos.length) return m;
  var ox = cw ? cx0 : 0, oy = cw ? cy0 : 0, iw = cw || w, ih = cw ? ch : h, alvo = cw ? pedaco(img, cx0, cy0, cw, ch) : img;
  var uniao = new Float32Array(w * h), usados = 0, info = [], i, x, y;
  riscos.forEach(function(pts){
    var r = null;
    try { seg.segment(alvo, {scribble: pts.map(function(q){ return {x: (q[0] - ox + 0.5) / iw, y: (q[1] - oy + 0.5) / ih}; })}, function(z){ r = pegaMascara(z); }); } catch (e) { r = null; }
    if (!r){ info.push('falhou'); return; }
    /* põe o resultado de volta no tamanho da foto */
    var n2 = new Float32Array(w * h), sx = r.w / iw, sy = r.h / ih;
    for (y = 0; y < ih; y++){ var ry = Math.min(r.h - 1, (y * sy) | 0); for (x = 0; x < iw; x++) n2[(y + oy) * w + x + ox] = r.d[ry * r.w + Math.min(r.w - 1, (x * sx) | 0)]; }
    /* confere: tem que cobrir quase todo o produto do 1º toque e não pode inchar demais (senão pegou fundo) */
    var p2 = principal({w: w, h: h, d: n2}, 0.5); if (!p2){ info.push('vazio'); return; }
    var cobre = 0; for (i = 0; i < w * h; i++) if (p.mk[i] && p2.mk[i]) cobre++;
    var c1 = cobre / p.n, cr = p2.n / p.n, al = (p2.y1 - p2.y0 + 1) / bh, lg = (p2.x1 - p2.x0 + 1) / bw;
    var ok = c1 >= 0.85 && cr <= 1.4 && al <= 1.3 && lg <= 1.3;
    info.push(c1.toFixed(2) + '/' + cr.toFixed(2) + '/' + al.toFixed(2) + '/' + lg.toFixed(2) + (ok ? '' : 'x'));
    if (!ok) return; usados++;
    for (i = 0; i < w * h; i++) if (p2.mk[i] && n2[i] > uniao[i]) uniao[i] = n2[i];
  });
  self.REFINO = info.join(' ');
  if (!usados) return m;
  for (i = 0; i < w * h; i++) if (uniao[i] > m.d[i]) m.d[i] = uniao[i];
  return m;
}
/* borda macia: média 5x5 do alfa */
function suaviza(a, w, h){
  var t = new Uint8ClampedArray(a.length), o = new Uint8ClampedArray(a.length), r = 2, x, y, k, s;
  for (y = 0; y < h; y++){ s = 0; for (k = -r; k <= r; k++) s += a[y * w + Math.min(w - 1, Math.max(0, k))];
    for (x = 0; x < w; x++){ t[y * w + x] = s / (2 * r + 1); s += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)]; } }
  for (x = 0; x < w; x++){ s = 0; for (k = -r; k <= r; k++) s += t[Math.min(h - 1, Math.max(0, k)) * w + x];
    for (y = 0; y < h; y++){ o[y * w + x] = s / (2 * r + 1); s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; } }
  return o;
}
/* fica só com a parte grande ligada perto do centro (tira pedaços soltos do fundo) e deixa a borda macia */
/* fica só com o pedaço principal; deixa crescer para as bordas onde o robô tem um pouco menos de certeza (>= 0.35)
   desde que encostado no produto: assim partes finas (tampinha, alça) não somem e o fundo solto não entra. Borda macia. */
function limpaMascara(m){
  var w = m.w, h = m.h, d = m.d, p = principal(m, 0.5); if (!p) return null;
  var manter = p.mk, fila = new Int32Array(w * h), fim = 0, ini = 0, n = p.n, i;
  for (i = 0; i < w * h; i++) if (manter[i]) fila[fim++] = i;
  while (ini < fim){ var q = fila[ini++], x = q % w;
    var viz = [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, q >= w ? q - w : -1, q < w * (h - 1) ? q + w : -1];
    for (var k = 0; k < 4; k++){ var v = viz[k]; if (v >= 0 && !manter[v] && d[v] >= 0.35){ manter[v] = 1; fila[fim++] = v; n++; } } }
  var a = new Uint8ClampedArray(w * h);
  for (i = 0; i < w * h; i++){ var c = d[i];
    if (manter[i]) a[i] = c >= 0.7 ? 255 : Math.round(255 * (0.55 + (c - 0.35) * 1.28));
    else if (c > 0.2){ var x2 = i % w, enc = (x2 > 0 && manter[i - 1]) || (x2 < w - 1 && manter[i + 1]) || (i >= w && manter[i - w]) || (i < w * (h - 1) && manter[i + w]); a[i] = enc ? Math.round(255 * Math.min(0.5, (c - 0.2) / 0.15 * 0.5)) : 0; }
  }
  return {w: w, h: h, a: a, n: n};
}
function redimensionaAlfa(m, W, H){ if (m.w == W && m.h == H) return m.a; var o = new Uint8ClampedArray(W * H);
  for (var y = 0; y < H; y++){ var fy = Math.min(m.h - 1.001, y * m.h / H), y0 = fy | 0, ty = fy - y0;
    for (var x = 0; x < W; x++){ var fx = Math.min(m.w - 1.001, x * m.w / W), x0 = fx | 0, tx = fx - x0, i = y0 * m.w + x0;
      o[y * W + x] = (m.a[i] * (1 - tx) + m.a[i + 1] * tx) * (1 - ty) + (m.a[i + m.w] * (1 - tx) + m.a[i + m.w + 1] * tx) * ty; } }
  return o; }

/* ---------- ajustes (luz, contraste, cor, nitidez, corte), só com números ---------- */
function corta(src, w, h, x0, y0, cw, ch, pad, transparente){
  var W = cw + pad * 2, H = ch + pad * 2, o = new Uint8ClampedArray(W * H * 4);
  if (!transparente) o.fill(255);
  for (var y = 0; y < ch; y++){ var sy = y0 + y; if (sy < 0 || sy >= h) continue;
    for (var x = 0; x < cw; x++){ var sx = x0 + x; if (sx < 0 || sx >= w) continue; var s = (sy * w + sx) * 4, t = ((y + pad) * W + x + pad) * 4;
      o[t] = src[s]; o[t + 1] = src[s + 1]; o[t + 2] = src[s + 2]; o[t + 3] = src[s + 3]; } }
  return {w: W, h: H, d: o};
}
function ajusta(im){
  var d = im.d, w = im.w, h = im.h, hist = new Uint32Array(256), n = 0;
  for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 128){ hist[Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])]++; n++; }
  var lo = 0, hi = 255, a = 0; while (lo < 255 && (a += hist[lo]) < n * 0.01) lo++; a = 0; while (hi > 0 && (a += hist[hi]) < n * 0.01) hi--;
  if (hi - lo < 60){ lo = Math.max(0, lo - 30); hi = Math.min(255, hi + 30); }
  var esc = 255 / Math.max(1, hi - lo), media = 0; for (var v = 0; v < 256; v++) media += v * hist[v]; media = n ? media / n : 128;
  var gama = media < 100 ? 0.82 : (media > 175 ? 1.1 : 0.95), lut = new Uint8ClampedArray(256);
  for (v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(Math.min(1, Math.max(0, (v - lo) * esc / 255)), gama));
  for (i = 0; i < d.length; i += 4){ var r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]], l = 0.299 * r + 0.587 * g + 0.114 * b, s = 1.15;
    d[i] = l + (r - l) * s; d[i + 1] = l + (g - l) * s; d[i + 2] = l + (b - l) * s; }
  var o = new Uint8ClampedArray(d);
  for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++){ var p = (y * w + x) * 4; if (d[p + 3] < 10) continue;
    for (var ch = 0; ch < 3; ch++){ var viz = (d[p - 4 + ch] + d[p + 4 + ch] + d[p - w * 4 + ch] + d[p + w * 4 + ch]) / 4; o[p + ch] = d[p + ch] + (d[p + ch] - viz) * 0.6; } }
  im.d = o; return im;
}
function montaRecorte(img, alfa){
  var w = img.width, h = img.height, d = img.data, x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++){ var a = alfa[y * w + x]; d[(y * w + x) * 4 + 3] = a; if (a > 24){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return null; var cw = x1 - x0 + 1, ch = y1 - y0 + 1; if (cw * ch < w * h * 0.01) return null;
  return ajusta(corta(d, w, h, x0, y0, cw, ch, Math.round(Math.max(cw, ch) * 0.04), true));
}
function melhoraFoto(img){
  var w = img.width, h = img.height, cw = Math.round(w * 0.86), ch = Math.round(h * 0.86);
  if (cw > ch * 1.25) cw = Math.round(ch * 1.25); if (ch > cw * 1.25) ch = Math.round(cw * 1.25);
  return ajusta(corta(img.data, w, h, Math.round((w - cw) / 2), Math.round((h - ch) / 2), cw, ch, 0, false));
}

self.onmessage = async function(e){
  var q = e.data, t0 = Date.now();
  try {
    if (q.modo == 'melhora'){ var r0 = melhoraFoto(q.img); self.postMessage({tipo: 'ok', recorte: false, img: new ImageData(r0.d, r0.w, r0.h), ms: Date.now() - t0}, [r0.d.buffer]); return; }
    var seg = await carregaRobo(), t1 = Date.now();
    prog('Tirando o fundo…');
    var m = limpaMascara(mascara(seg, q.img)); if (!m || m.n < m.w * m.h * 0.01) throw new Error('não achou o produto');
    var r = montaRecorte(q.img, suaviza(redimensionaAlfa(m, q.img.width, q.img.height), q.img.width, q.img.height)); if (!r) throw new Error('recorte vazio');
    self.postMessage({tipo: 'ok', recorte: true, img: new ImageData(r.d, r.w, r.h), ms: Date.now() - t0, msRobo: Date.now() - t1, baixado: self.BAIXADO || 0, mascara: self.TAM_MASCARA, refino: self.REFINO}, [r.d.buffer]);
  } catch (x) { self.postMessage({tipo: 'erro', msg: String(x && x.message || x)}); }
};
