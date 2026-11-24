/* Oferta Okê — desenho animado do comercial (canvas) e gravação do vídeo */
var FONTE = '"Anton", "Arial Black", Impact, sans-serif', FONTE2 = '"Poppins", Arial, sans-serif';
function eOut(x){ x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); }
function eBack(x){ x = Math.min(1, Math.max(0, x)); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
function eElast(x){ x = Math.min(1, Math.max(0, x)); if (x == 0 || x == 1) return x; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; }
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function estrela(g, cx, cy, ro, ri, n, rot){ g.beginPath(); for (var i = 0; i < n * 2; i++){ var r = i % 2 ? ri : ro, a = rot + i * Math.PI / n; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); }
function cabeTexto(g, txt, maxW, tam, peso, fam){ var t = tam; do { g.font = (peso || '') + ' ' + Math.round(t) + 'px ' + (fam || FONTE); if (g.measureText(txt).width <= maxW) break; t *= 0.92; } while (t > 8); return t; }
function quebra(g, txt, maxW){ var p = String(txt).split(/\s+/), l = [], a = ''; p.forEach(function(w){ var t = a ? a + ' ' + w : w; if (g.measureText(t).width > maxW && a){ l.push(a); a = w; } else a = t; }); if (a) l.push(a); return l; }
function textoContorno(g, txt, x, y, cor, contorno, lw){ g.lineJoin = 'round'; if (contorno){ g.lineWidth = lw; g.strokeStyle = contorno; g.strokeText(txt, x, y); } g.fillStyle = cor; g.fillText(txt, x, y); }

/* fundo: vermelho com raios girando, faixas e brilhos */
function fundo(g, W, H, t, S){
  var gr = g.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, Math.max(W, H) * 0.8); gr.addColorStop(0, '#ff3b3b'); gr.addColorStop(0.55, '#d0101f'); gr.addColorStop(1, '#7a0010');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H * 0.45); g.rotate(t * 0.15); g.fillStyle = 'rgba(255,214,0,.10)';
  for (var i = 0; i < 16; i++){ g.beginPath(); g.moveTo(0, 0); var a = i * Math.PI / 8; g.arc(0, 0, Math.max(W, H), a, a + Math.PI / 16); g.closePath(); g.fill(); }
  g.restore();
  for (var k = 0; k < 18; k++){ var sx = (k * 197 % 100) / 100 * W, sy = ((k * 131 % 100) / 100 * H + t * 30 * (1 + k % 3)) % H, a2 = 0.3 + 0.3 * Math.sin(t * 3 + k);
    g.fillStyle = 'rgba(255,255,255,' + a2.toFixed(2) + ')'; estrela(g, sx, sy, 6 * S, 2 * S, 4, t + k); g.fill(); }
}
function faixaTopo(g, W, H, S, loja, t){
  var h = 74 * S; g.fillStyle = '#ffd400'; g.fillRect(0, 0, W, h); g.fillStyle = '#7a0010'; g.fillRect(0, h, W, 8 * S);
  g.save(); g.beginPath(); g.rect(0, 0, W, h); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; var x = ((t * 0.5) % 1.6 - 0.3) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60 * S, 0); g.lineTo(x + 20 * S, h); g.lineTo(x - 40 * S, h); g.fill(); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'middle'; var tm = cabeTexto(g, loja.toUpperCase(), W - 40 * S, 50 * S); textoContorno(g, loja.toUpperCase(), W / 2, h / 2 + 2 * S, '#c8001a', null);
}
function faixaBaixo(g, W, H, S, t, txt){
  var h = 52 * S, y = H - h; g.fillStyle = '#1b0006'; g.fillRect(0, y, W, h); g.fillStyle = '#ffd400'; g.fillRect(0, y, W, 5 * S);
  g.font = Math.round(30 * S) + 'px ' + FONTE; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#fff';
  var u = txt + '   ★   ', w = g.measureText(u).width, x = -((t * 140 * S) % w); for (; x < W; x += w) g.fillText(u, x, y + h / 2 + 3 * S);
}
/* etiqueta de preço estilo encarte */
function etiquetaPreco(g, cx, cy, R, p, t, ap){
  var s = eElast(ap) * (1 + 0.04 * Math.sin(t * 7)); if (s <= 0.01) return;
  g.save(); g.translate(cx, cy); g.scale(s, s); g.rotate(-0.08);
  g.save(); g.rotate(t * 0.6); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = R * 0.12; g.shadowOffsetY = R * 0.05; g.fillStyle = '#ffd400'; estrela(g, 0, 0, R, R * 0.84, 22, 0); g.fill(); g.restore();
  g.fillStyle = '#ffe866'; g.beginPath(); g.arc(0, 0, R * 0.74, 0, Math.PI * 2); g.fill();
  var v = (Math.round((+p.preco || 0) * 100) / 100).toFixed(2).split('.'), re = v[0], ce = ',' + v[1];
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = '#d0101f';
  var tamR = R * (re.length >= 3 ? 0.62 : re.length == 2 ? 0.82 : 0.95); g.font = Math.round(tamR) + 'px ' + FONTE; var wR = g.measureText(re).width;
  g.font = Math.round(R * 0.38) + 'px ' + FONTE; var wC = g.measureText(ce).width; g.font = Math.round(R * 0.22) + 'px ' + FONTE; var wS = g.measureText('R$').width;
  var tot = wS + R * 0.04 + wR + R * 0.02 + Math.max(wC, R * 0.3), x0 = -tot / 2, base = tamR * 0.34;
  g.fillStyle = '#7a0010'; g.font = Math.round(R * 0.22) + 'px ' + FONTE; g.fillText('R$', x0, base - tamR * 0.46);
  g.fillStyle = '#d0101f'; g.font = Math.round(tamR) + 'px ' + FONTE; g.fillText(re, x0 + wS + R * 0.04, base);
  g.font = Math.round(R * 0.38) + 'px ' + FONTE; g.fillText(ce, x0 + wS + R * 0.06 + wR, base - tamR * 0.4);
  var un = UNI_TAG[p.un || ''] || ''; if (un){ g.fillStyle = '#7a0010'; g.font = Math.round(R * 0.17) + 'px ' + FONTE2; g.font = 'bold ' + g.font; g.textAlign = 'center'; g.fillText(un.toUpperCase(), 0, base + R * 0.26); }
  g.restore();
}
function seloDe(g, x, y, S, p, ap){
  if (!(p.de && +p.de > +p.preco) || ap <= 0) return; var a = eBack(ap);
  g.save(); g.translate(x, y); g.scale(a, a); g.rotate(-0.12); var w = 210 * S, h = 62 * S; g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 10 * S; rr(g, -w / 2, -h / 2, w, h, 12 * S); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#333'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = Math.round(30 * S) + 'px ' + FONTE; var tx = 'DE R$ ' + precoBR(p.de); cabeTexto(g, tx, w - 20 * S, 30 * S); g.fillText(tx, 0, 2 * S);
  g.strokeStyle = '#d0101f'; g.lineWidth = 5 * S; g.beginPath(); g.moveTo(-w * 0.42, h * 0.18); g.lineTo(w * 0.42, -h * 0.18); g.stroke(); g.restore();
}
function cartaoProduto(g, x, y, w, h, img, tipo, S, t){
  g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30 * S; g.shadowOffsetY = 12 * S; g.fillStyle = '#fff'; rr(g, x, y, w, h, 28 * S); g.fill(); g.restore();
  g.save(); rr(g, x + 8 * S, y + 8 * S, w - 16 * S, h - 16 * S, 22 * S); g.clip();
  var gr = g.createRadialGradient(x + w / 2, y + h * 0.42, 10, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#e8eef6'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  if (img){ var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (tipo == 'foto'){ var k = Math.max(w / iw, h / ih) * (1.04 + 0.03 * Math.sin(t)); g.drawImage(img, x + (w - iw * k) / 2, y + (h - ih * k) / 2, iw * k, ih * k); }
    else { var m = tipo == 'recorte' ? 0.8 : 0.88, k2 = Math.min(w * m / iw, h * m / ih) * (1 + 0.025 * Math.sin(t * 2)), dw = iw * k2, dh = ih * k2, dx = x + (w - dw) / 2, dy = y + (h - dh) / 2 - (tipo == 'recorte' ? h * 0.03 : 0);
      if (tipo == 'recorte'){ g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x + w / 2, dy + dh + 6 * S, dw * 0.42, 14 * S, 0, 0, Math.PI * 2); g.fill(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 18 * S; g.shadowOffsetY = 8 * S; }
      g.drawImage(img, dx, dy, dw, dh); } }
  g.restore();
}
function faixaNome(g, cx, cy, maxW, S, nome, ap){
  if (ap <= 0) return; var a = eOut(ap); g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 40 * S);
  g.textAlign = 'center'; g.textBaseline = 'middle'; var tam = cabeTexto(g, nome.toUpperCase(), maxW - 50 * S, 50 * S); var linhas = [nome.toUpperCase()];
  if (tam < 34 * S){ g.font = Math.round(36 * S) + 'px ' + FONTE; linhas = quebra(g, nome.toUpperCase(), maxW - 50 * S).slice(0, 2); tam = 36 * S; linhas.forEach(function(l){ tam = Math.min(tam, cabeTexto(g, l, maxW - 50 * S, 36 * S)); }); }
  var h = tam * 1.15 * linhas.length + 26 * S, w = 0; g.font = Math.round(tam) + 'px ' + FONTE; linhas.forEach(function(l){ w = Math.max(w, g.measureText(l).width); }); w = Math.min(maxW, w + 60 * S);
  g.fillStyle = '#1b0006'; rr(g, cx - w / 2, cy - h / 2, w, h, 16 * S); g.fill(); g.fillStyle = '#ffd400'; g.fillRect(cx - w / 2 + 14 * S, cy + h / 2 - 7 * S, w - 28 * S, 4 * S);
  g.fillStyle = '#fff'; linhas.forEach(function(l, i){ g.fillText(l, cx, cy - (linhas.length - 1) * tam * 0.575 + i * tam * 1.15 + 3 * S); }); g.restore();
}

/* desenha um quadro */
function desenhaQuadro(g, W, H, t, P){
  var S = Math.min(W, H) / 720, ver = H > W, of = P.of, cena = P.cenas[0];
  for (var i = 0; i < P.cenas.length; i++) if (t >= P.cenas[i].t0) cena = P.cenas[i];
  fundo(g, W, H, t, S);
  var loja = of.loja || 'Oferta', u = t - cena.t0, d = Math.max(0.5, cena.t1 - cena.t0), topo = 82 * S, baixo = 52 * S;
  if (cena.tipo == 'abre'){
    var a = eBack(u / 0.6); g.save(); g.translate(W / 2, H * 0.42); g.scale(a, a); g.rotate(Math.sin(t * 3) * 0.03);
    g.fillStyle = '#ffd400'; estrela(g, 0, 0, 300 * S, 250 * S, 26, t * 0.5); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = Math.round(150 * S) + 'px ' + FONTE; textoContorno(g, 'OFERTAS', 0, -30 * S, '#d0101f', '#fff', 14 * S);
    g.font = Math.round(56 * S) + 'px ' + FONTE; textoContorno(g, 'IMPERDÍVEIS!', 0, 80 * S, '#1b0006', null); g.restore();
    var b = eBack((u - 0.5) / 0.5); if (b > 0){ g.save(); g.translate(W / 2, H * (ver ? 0.72 : 0.83)); g.scale(b, b); g.textAlign = 'center'; g.textBaseline = 'middle';
      var tm = cabeTexto(g, loja.toUpperCase(), W * 0.86, 80 * S); textoContorno(g, loja.toUpperCase(), 0, 0, '#fff', '#7a0010', 10 * S); g.restore(); }
    faixaBaixo(g, W, H, S, t, 'OFERTAS DA SEMANA ★ ' + loja.toUpperCase()); return;
  }
  if (cena.tipo == 'prod'){
    var p = of.produtos[cena.i] || {}, img = P.imgs[cena.i], ent = eBack(u / 0.5), sai = Math.max(0, (u - (d - 0.25)) / 0.25), lado = cena.i % 2 ? 1 : -1;
    faixaTopo(g, W, H, S, loja, t);
    var cw, ch, cx, cy, px, py, pr, nx, ny, nw;
    if (ver){ cw = W * 0.8; ch = Math.min(H * 0.42, cw); cx = (W - cw) / 2; cy = topo + 40 * S; nx = W / 2; ny = cy + ch + 70 * S; nw = W * 0.9; pr = 170 * S; px = W / 2; py = Math.min(H - baixo - pr - 20 * S, ny + 70 * S + pr); }
    else { ch = H - topo - baixo - 125 * S; cw = Math.min(W * 0.5, ch * 1.08); cx = W * 0.05; cy = topo + 30 * S; nx = cx + cw / 2; ny = cy + ch + 55 * S; nw = cw + 60 * S; pr = 190 * S; px = W * 0.75; py = topo + (H - topo - baixo) / 2 + 10 * S; }
    g.save(); g.translate(lado * (1 - ent) * W * 0.8 + (sai > 0 ? -lado * sai * W : 0), Math.sin(t * 2) * 5 * S); cartaoProduto(g, cx, cy, cw, ch, img, p.tipoFoto || 'foto', S, t); g.restore();
    if (sai < 1){ faixaNome(g, nx, ny, nw, S, p.nome || '', (u - 0.25) / 0.4);
      var apr = (u - Math.min(0.75, d * 0.3)) / 0.7; if (sai > 0) apr = 1 - sai;
      seloDe(g, px + (ver ? -pr * 0.75 : -pr * 0.6), py - pr * 0.95, S, p, (u - 0.4) / 0.4);
      etiquetaPreco(g, px, py, pr, p, t, apr);
      if (apr > 0.6){ for (var k = 0; k < 8; k++){ var an = k / 8 * Math.PI * 2 + t, rd = pr * (1.12 + 0.08 * Math.sin(t * 5 + k)); g.fillStyle = 'rgba(255,255,255,.85)'; estrela(g, px + Math.cos(an) * rd, py + Math.sin(an) * rd, 9 * S, 3 * S, 4, t * 2); g.fill(); } } }
    var n = of.produtos.length; if (n > 1){ for (var j = 0; j < n; j++){ g.fillStyle = j == cena.i ? '#ffd400' : 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(W / 2 + (j - (n - 1) / 2) * 26 * S, H - baixo - 18 * S, 7 * S, 0, Math.PI * 2); g.fill(); } }
    faixaBaixo(g, W, H, S, t, 'SÓ NO ' + loja.toUpperCase() + ' ★ APROVEITE');
    var fl = 1 - u / 0.15; if (fl > 0){ g.fillStyle = 'rgba(255,255,255,' + (fl * 0.6).toFixed(2) + ')'; g.fillRect(0, 0, W, H); }
    return;
  }
  /* fim */
  var e = eBack(u / 0.55), y = H * (ver ? 0.25 : 0.2); g.textAlign = 'center'; g.textBaseline = 'middle';
  if (P.logo){ var lr = (ver ? 110 : 85) * S * e; g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 20 * S; g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, y, lr, 0, Math.PI * 2); g.fill(); g.restore();
    g.save(); g.beginPath(); g.arc(W / 2, y, lr * 0.92, 0, Math.PI * 2); g.clip(); var li = P.logo, lk = Math.max(lr * 2 / li.naturalWidth, lr * 2 / li.naturalHeight); g.drawImage(li, W / 2 - li.naturalWidth * lk / 2, y - li.naturalHeight * lk / 2, li.naturalWidth * lk, li.naturalHeight * lk); g.restore(); y += lr + 70 * S; }
  else { g.save(); g.translate(W / 2, y); g.scale(e, e); g.font = Math.round(60 * S) + 'px ' + FONTE; textoContorno(g, 'CORRE PRO', 0, 0, '#ffd400', '#7a0010', 8 * S); g.restore(); y += 90 * S; }
  g.save(); g.translate(W / 2, y); var s2 = eBack((u - 0.2) / 0.5) * (1 + 0.03 * Math.sin(t * 6)); g.scale(s2, s2); g.font = Math.round(100 * S) + 'px ' + FONTE;
  var tl = cabeTexto(g, loja.toUpperCase(), W * 0.9, 110 * S), ls = [loja.toUpperCase()]; if (tl < 60 * S){ g.font = Math.round(80 * S) + 'px ' + FONTE; ls = quebra(g, loja.toUpperCase(), W * 0.88).slice(0, 2); tl = 80 * S; ls.forEach(function(l){ tl = Math.min(tl, cabeTexto(g, l, W * 0.88, 80 * S)); }); }
  g.font = Math.round(tl) + 'px ' + FONTE; ls.forEach(function(l, i){ textoContorno(g, l, 0, (i - (ls.length - 1) / 2) * tl * 1.1, '#fff', '#7a0010', 10 * S); }); g.restore(); y += tl * 0.6 * ls.length + 60 * S;
  var info = []; if (of.end) info.push(['📍', of.end]); if (of.zap) info.push(['📞', foneBonito(of.zap)]);
  info.forEach(function(it, i){ var a3 = eOut((u - 0.6 - i * 0.25) / 0.4); if (a3 <= 0) return; g.save(); g.globalAlpha = a3; g.font = 'bold ' + Math.round(34 * S) + 'px ' + FONTE2; cabeTexto(g, it[0] + ' ' + it[1], W * 0.86, 34 * S, 'bold', FONTE2);
    var tw = g.measureText(it[0] + ' ' + it[1]).width + 40 * S, hh = 58 * S; g.fillStyle = it[0] == '📞' ? '#16a34a' : 'rgba(0,0,0,.35)'; rr(g, W / 2 - tw / 2, y - hh / 2, tw, hh, hh / 2); g.fill(); g.fillStyle = '#fff'; g.fillText(it[0] + ' ' + it[1], W / 2, y + 2 * S); g.restore(); y += 74 * S; });
  g.font = Math.round(22 * S) + 'px ' + FONTE2; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText('Ofertas válidas enquanto durarem os estoques.', W / 2, H - baixo - 30 * S);
  faixaBaixo(g, W, H, S, t, 'CORRE QUE ACABA ★ ' + loja.toUpperCase());
}
function foneBonito(z){ z = String(z || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''); if (z.length == 11) return '(' + z.slice(0, 2) + ') ' + z.slice(2, 7) + '-' + z.slice(7); if (z.length == 10) return '(' + z.slice(0, 2) + ') ' + z.slice(2, 6) + '-' + z.slice(6); return z; }

function tipoGravacao(){
  var op = ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4;codecs=avc1,opus', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  for (var i = 0; i < op.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported(op[i])) return op[i];
  return '';
}
async function carregaFontes(){ try { await Promise.all([document.fonts.load('80px Anton'), document.fonts.load('bold 30px Poppins')]); } catch (e) {} }
/* grava os formatos pedidos ao mesmo tempo. formatos: [{nome:'vertical',w:720,h:1280}, ...] */
async function gravaVideos(ac, P, audio, formatos, prog){
  await carregaFontes();
  var tipo = tipoGravacao(); if (!tipo) throw new Error('sem-gravador');
  if (ac.state == 'suspended') try { await ac.resume(); } catch (e) {}
  var dest = ac.createMediaStreamDestination(), src = ac.createBufferSource(); src.buffer = audio; src.connect(dest);
  var trilha = dest.stream.getAudioTracks()[0], grav = formatos.map(function(f){
    var c = novaTela(f.w, f.h), g = c.getContext('2d'); desenhaQuadro(g, f.w, f.h, 0, P);
    var st = c.captureStream(30); st.addTrack(trilha);
    var rec = new MediaRecorder(st, {mimeType: tipo, videoBitsPerSecond: f.bits || 2200000, audioBitsPerSecond: 128000}), pedacos = [];
    rec.ondataavailable = function(e){ if (e.data && e.data.size) pedacos.push(e.data); };
    var pronto = new Promise(function(ok){ rec.onstop = function(){ ok(new Blob(pedacos, {type: tipo.split(';')[0]})); }; });
    return {f: f, c: c, g: g, rec: rec, pronto: pronto};
  });
  var trava = null; try { if (navigator.wakeLock) trava = await navigator.wakeLock.request('screen'); } catch (e) {}
  var cancelado = '', acaba = null;
  function limpa(){ grav.forEach(function(x){ try { if (x.rec.state != 'inactive') x.rec.stop(); } catch (e) {} });
    try { src.stop(); } catch (e) {} try { trilha.stop(); } catch (e) {}
    if (trava){ try { trava.release(); } catch (e) {} trava = null; } window.cancelaGravacao = null; }
  /* app escondido / saiu da tela no meio do vídeo: para tudo e avisa */
  window.cancelaGravacao = function(motivo){ cancelado = motivo || 'oculto'; limpa(); if (acaba) acaba(); };
  grav.forEach(function(x){ x.rec.start(1000); });
  var t0 = ac.currentTime + 0.15; src.start(t0);
  await new Promise(function(fim){
    acaba = fim;
    function passo(){
      if (cancelado) return;
      var t = ac.currentTime - t0;
      grav.forEach(function(x){ desenhaQuadro(x.g, x.f.w, x.f.h, Math.max(0, t), P); });
      if (prog) prog(Math.min(1, Math.max(0, t / P.total)));
      if (t >= P.total + 0.25){ fim(); return; }
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  });
  if (cancelado) throw new Error(cancelado);
  limpa();
  var out = {};
  for (var i = 0; i < grav.length; i++) out[grav[i].f.nome] = await grav[i].pronto;
  return {videos: out, tipo: tipo};
}
