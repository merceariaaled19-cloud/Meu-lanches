/* CenaSua — rosto.js
   Tudo no aparelho: pontos do rosto (MediaPipe FaceLandmarker), troca de rosto por malha de triângulos (WebGL),
   ajuste de cor, estilo desenho/anime e o "rosto falante" (boca, piscar e balanço da cabeça).
   A selfie nunca sai do celular. */
(function(){
var CK = window.CK || (window.CK = {});
var MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3';
var MODELO = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/* índices fixos da malha do MediaPipe (468 pontos) */
var OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
var LAB_IN_CIMA = [78,191,80,81,82,13,312,311,310,415,308];
var LAB_IN_BAIXO = [324,318,402,317,14,87,178,88,95];
var LAB_IN = LAB_IN_CIMA.concat(LAB_IN_BAIXO);
var LAB_FORA_BAIXO = [146,91,181,84,17,314,405,321,375];
var LAB_MEIO_BAIXO = [77,90,180,85,16,315,404,320,307,96,89,179,86,15,316,403,319,325];
var OLHO_D_CIMA = [246,161,160,159,158,157,173], OLHO_D_BAIXO = [7,163,144,145,153,154,155];
var OLHO_E_CIMA = [466,388,387,386,385,384,398], OLHO_E_BAIXO = [249,390,373,374,380,381,382];
var DOBRA_D = [247,30,29,27,28,56,190], DOBRA_E = [467,260,259,257,258,286,414];
CK.IDX = {OVAL: OVAL, LAB_IN: LAB_IN};

/* ---------- MediaPipe ---------- */
var flImg = null, flVid = null, carregando = null;
CK.carregaRosto = function(aviso){
  if (carregando) return carregando;
  carregando = (async function(){
    if (aviso) aviso('Baixando o robô do rosto (só na 1ª vez)…');
    var v = await import(MP + '/vision_bundle.mjs');
    var fs = await v.FilesetResolver.forVisionTasks(MP + '/wasm');
    async function cria(modo, gpu){
      return v.FaceLandmarker.createFromOptions(fs, {baseOptions: {modelAssetPath: MODELO, delegate: gpu ? 'GPU' : 'CPU'}, runningMode: modo, numFaces: 2,
        outputFaceBlendshapes: true, outputFacialTransformationMatrixes: false, minFaceDetectionConfidence: 0.35, minFacePresenceConfidence: 0.35});
    }
    try { flImg = await cria('IMAGE', false); } catch (e) { flImg = await cria('IMAGE', false); }
    CK._vision = v; CK._fs = fs; CK._cria = cria;
    return true;
  })();
  carregando.catch(function(){ carregando = null; });
  return carregando;
};
CK.rostoVideo = async function(){
  await CK.carregaRosto();
  if (!flVid){ try { flVid = await CK._cria('VIDEO', true); } catch (e) { flVid = await CK._cria('VIDEO', false); } }
  return flVid;
};
function blend(r, i){ var o = {}; if (r.faceBlendshapes && r.faceBlendshapes[i]) r.faceBlendshapes[i].categories.forEach(function(c){ o[c.categoryName] = c.score; }); return o; }
/* devolve {pts:[[x,y]...468 em pixels], bs:{...}, n: quantos rostos} do maior rosto */
CK.pontos = async function(img){
  await CK.carregaRosto();
  var W = img.naturalWidth || img.videoWidth || img.width, H = img.naturalHeight || img.videoHeight || img.height;
  var r = melhor(flImg.detect(img), W, H);
  if (r) return r;
  /* rosto pequeno na foto: procura em pedaços ampliados */
  var cv = document.createElement('canvas'), L = 640; cv.width = L; cv.height = L; var x = cv.getContext('2d');
  var tams = [Math.min(W, H), Math.round(Math.min(W, H) * 0.62), Math.round(Math.min(W, H) * 0.42)], achou = null;
  for (var t = 0; t < tams.length && !achou; t++){
    var S = tams[t], passo = Math.max(1, Math.round(S * 0.5));
    for (var y0 = 0; y0 <= H - S && !achou; y0 += passo) for (var x0 = 0; x0 <= W - S + 1 && !achou; x0 += passo){
      x.clearRect(0, 0, L, L); x.drawImage(img, x0, y0, S, S, 0, 0, L, L);
      var q = melhor(flImg.detect(cv), L, L);
      if (q){ var k = S / L; q.pts = q.pts.map(function(p){ return [x0 + p[0] * k, y0 + p[1] * k]; }); q.W = W; q.H = H; achou = q; }
      if (x0 + S >= W) break;
    }
  }
  return achou;
};
CK.pontosVideo = function(video, ts){
  if (!flVid) return null;
  var r = flVid.detectForVideo(video, ts);
  return melhor(r, video.videoWidth, video.videoHeight);
};
function melhor(r, W, H){
  if (!r || !r.faceLandmarks || !r.faceLandmarks.length) return null;
  var best = -1, area = 0;
  r.faceLandmarks.forEach(function(l, i){ var b = caixa(l.map(function(p){ return [p.x * W, p.y * H]; })); var a = b.w * b.h; if (a > area){ area = a; best = i; } });
  var lm = r.faceLandmarks[best];
  return {pts: lm.slice(0, 468).map(function(p){ return [p.x * W, p.y * H]; }), bs: blend(r, best), n: r.faceLandmarks.length, W: W, H: H};
}
function caixa(p){ var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; p.forEach(function(q){ if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }); return {x: x0, y: y0, w: x1 - x0, h: y1 - y0}; }
CK.caixa = caixa;
/* virada da cabeça: -1 (esquerda) .. 1 (direita), ~0 de frente */
CK.virada = function(p){ var l = p[234], r = p[454], n = p[1]; var dl = Math.hypot(n[0] - l[0], n[1] - l[1]), dr = Math.hypot(r[0] - n[0], r[1] - n[1]); return (dl - dr) / (dl + dr); };
CK.olhosAbertos = function(p){ function ab(c, b, a1, a2){ return Math.hypot(p[c][0] - p[b][0], p[c][1] - p[b][1]) / Math.hypot(p[a1][0] - p[a2][0], p[a1][1] - p[a2][1]); } return (ab(159, 145, 33, 133) + ab(386, 374, 263, 362)) / 2; };

/* ---------- Delaunay (Bowyer-Watson) ---------- */
function delaunay(P){
  var n = P.length, b = caixa(P), d = Math.max(b.w, b.h) * 20, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  var pts = P.concat([[cx - d, cy - d], [cx + d, cy - d], [cx, cy + d]]);
  var tris = [[n, n + 1, n + 2]];
  function circ(t){ var A = pts[t[0]], B = pts[t[1]], C = pts[t[2]]; var D = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
    if (Math.abs(D) < 1e-12) return {x: 0, y: 0, r: 1e30};
    var a2 = A[0] * A[0] + A[1] * A[1], b2 = B[0] * B[0] + B[1] * B[1], c2 = C[0] * C[0] + C[1] * C[1];
    var x = (a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / D, y = (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / D;
    return {x: x, y: y, r: (A[0] - x) * (A[0] - x) + (A[1] - y) * (A[1] - y)}; }
  var cc = [circ(tris[0])];
  for (var i = 0; i < n; i++){
    var p = pts[i], ruins = [], bons = [], bonsC = [];
    for (var t = 0; t < tris.length; t++){ var c = cc[t]; if ((p[0] - c.x) * (p[0] - c.x) + (p[1] - c.y) * (p[1] - c.y) < c.r) ruins.push(tris[t]); else { bons.push(tris[t]); bonsC.push(c); } }
    var ar = {};
    ruins.forEach(function(T){ [[T[0], T[1]], [T[1], T[2]], [T[2], T[0]]].forEach(function(e){ var k = e[0] < e[1] ? e[0] + '_' + e[1] : e[1] + '_' + e[0]; ar[k] = ar[k] ? null : e; }); });
    for (var k in ar) if (ar[k]){ var nt = [ar[k][0], ar[k][1], i]; bons.push(nt); bonsC.push(circ(nt)); }
    tris = bons; cc = bonsC;
  }
  return tris.filter(function(T){ return T[0] < n && T[1] < n && T[2] < n; });
}
CK.delaunay = delaunay;

/* ---------- WebGL: desenha triângulos de uma textura para outra posição ---------- */
var VS = 'attribute vec2 aP; attribute vec2 aT; uniform vec2 uR; varying vec2 vT; void main(){ vT = aT; vec2 c = aP / uR * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }';
var FS = 'precision mediump float; varying vec2 vT; uniform sampler2D uS; uniform vec4 uC; uniform float uSol; void main(){ gl_FragColor = uSol > 0.5 ? uC : texture2D(uS, vT); }';
function criaGL(W, H){
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var gl = c.getContext('webgl', {premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: true});
  if (!gl) throw new Error('sem-webgl');
  function sh(t, s){ var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  var o = {c: c, gl: gl, pr: pr, aP: gl.getAttribLocation(pr, 'aP'), aT: gl.getAttribLocation(pr, 'aT'), uR: gl.getUniformLocation(pr, 'uR'), uC: gl.getUniformLocation(pr, 'uC'), uSol: gl.getUniformLocation(pr, 'uSol'),
    bP: gl.createBuffer(), bT: gl.createBuffer(), tex: gl.createTexture()};
  gl.uniform2f(o.uR, W, H); gl.viewport(0, 0, W, H);
  return o;
}
function textura(o, img){
  var gl = o.gl; gl.bindTexture(gl.TEXTURE_2D, o.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
function desenha(o, pos, uv, modo){
  var gl = o.gl;
  gl.uniform1f(o.uSol, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.bP); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(o.aP); gl.vertexAttribPointer(o.aP, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.bT); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(o.aT); gl.vertexAttribPointer(o.aT, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(modo || gl.TRIANGLES, 0, pos.length / 2);
}
function solido(o, pos, cor){
  var gl = o.gl; gl.uniform1f(o.uSol, 1); gl.uniform4f(o.uC, cor[0], cor[1], cor[2], cor[3]);
  gl.bindBuffer(gl.ARRAY_BUFFER, o.bP); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(o.aP); gl.vertexAttribPointer(o.aP, 2, gl.FLOAT, false, 0, 0);
  gl.disableVertexAttribArray(o.aT); gl.vertexAttrib2f(o.aT, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, pos.length / 2);
}
function triBuf(tris, P, nrm){ var a = new Float32Array(tris.length * 6), k = 0; tris.forEach(function(T){ for (var j = 0; j < 3; j++){ var q = P[T[j]]; a[k++] = nrm ? q[0] / nrm[0] : q[0]; a[k++] = nrm ? q[1] / nrm[1] : q[1]; } }); return a; }

/* ---------- troca de rosto ---------- */
/* cena: imagem/canvas da cena; lmCena: 468 pontos (px da cena); selfie + lmSelfie idem.
   opt.estilo: '' | 'desenho' | 'anime'. Devolve um canvas do tamanho da cena. */
CK.trocaRosto = function(cena, lmCena, selfie, lmSelfie, opt){
  opt = opt || {};
  var W = cena.naturalWidth || cena.width, H = cena.naturalHeight || cena.height;
  var sW = selfie.naturalWidth || selfie.width, sH = selfie.naturalHeight || selfie.height;
  var tris = delaunay(lmCena);
  var g = criaGL(W, H), gl = g.gl;
  textura(g, selfie);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  desenha(g, triBuf(tris, lmCena), triBuf(tris, lmSelfie, [sW, sH]));
  var b = caixa(lmCena), pad = Math.round(Math.max(b.w, b.h) * 0.25);
  var bx = Math.max(0, Math.floor(b.x - pad)), by = Math.max(0, Math.floor(b.y - pad)), bw = Math.min(W - bx, Math.ceil(b.w + pad * 2)), bh = Math.min(H - by, Math.ceil(b.h + pad * 2));
  /* rosto torcido em canvas 2D */
  var f = document.createElement('canvas'); f.width = bw; f.height = bh; var fx = f.getContext('2d', {willReadFrequently: true});
  fx.drawImage(g.c, bx, by, bw, bh, 0, 0, bw, bh);
  var cen = document.createElement('canvas'); cen.width = bw; cen.height = bh; var cx = cen.getContext('2d', {willReadFrequently: true});
  cx.drawImage(cena, bx, by, bw, bh, 0, 0, bw, bh);
  /* máscara do oval (encolhida e esfumada) */
  var cxm = 0, cym = 0; OVAL.forEach(function(i){ cxm += lmCena[i][0]; cym += lmCena[i][1]; }); cxm /= OVAL.length; cym /= OVAL.length;
  function mascara(enc, borra){
    var m = document.createElement('canvas'); m.width = bw; m.height = bh; var mx = m.getContext('2d');
    mx.filter = borra > 0 ? 'blur(' + borra + 'px)' : 'none'; mx.fillStyle = '#fff'; mx.beginPath();
    OVAL.forEach(function(i, k){ var x = cxm + (lmCena[i][0] - cxm) * enc - bx, y = cym + (lmCena[i][1] - cym) * enc * (lmCena[i][1] < cym ? (opt.estilo ? 0.86 : 0.95) : 1) - by; k ? mx.lineTo(x, y) : mx.moveTo(x, y); });
    mx.closePath(); mx.fill(); return m;
  }
  var mDur = mascara(0.86, 0), mDurD = mDur.getContext('2d').getImageData(0, 0, bw, bh).data;
  var fd = fx.getImageData(0, 0, bw, bh), cd = cx.getImageData(0, 0, bw, bh).data, d = fd.data;
  /* ajuste de cor: média e desvio por canal (só dentro do rosto) */
  var sA = [0,0,0], sB = [0,0,0], qA = [0,0,0], qB = [0,0,0], n = 0, i, c;
  for (i = 0; i < d.length; i += 4){ if (mDurD[i + 3] < 128 || d[i + 3] < 200) continue; n++; for (c = 0; c < 3; c++){ sA[c] += d[i + c]; qA[c] += d[i + c] * d[i + c]; sB[c] += cd[i + c]; qB[c] += cd[i + c] * cd[i + c]; } }
  if (n > 50){
    var mA = [], dA = [], mB = [], dB = [], forca = opt.estilo ? 0.9 : 0.75;
    for (c = 0; c < 3; c++){ mA[c] = sA[c] / n; mB[c] = sB[c] / n; dA[c] = Math.sqrt(Math.max(1, qA[c] / n - mA[c] * mA[c])); dB[c] = Math.sqrt(Math.max(1, qB[c] / n - mB[c] * mB[c])); }
    for (i = 0; i < d.length; i += 4){ if (!d[i + 3]) continue; for (c = 0; c < 3; c++){ var v = (d[i + c] - mA[c]) * (opt.estilo ? Math.min(1.0, Math.max(0.7, dB[c] / dA[c])) : Math.min(1.6, Math.max(0.6, dB[c] / dA[c]))) + mB[c]; d[i + c] = Math.max(0, Math.min(255, d[i + c] * (1 - forca) + v * forca)); } }
  }
  if (opt.estilo) desenhoFiltro(fd, bw, bh, opt.estilo);
  fx.putImageData(fd, 0, 0);
  var m = mascara(0.93, Math.max(2, Math.round(b.w * 0.045)));
  fx.globalCompositeOperation = 'destination-in'; fx.drawImage(m, 0, 0); fx.globalCompositeOperation = 'source-over';
  var out = document.createElement('canvas'); out.width = W; out.height = H; var ox = out.getContext('2d');
  ox.drawImage(cena, 0, 0, W, H); ox.drawImage(f, bx, by);
  try { gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext(); } catch (e) {}
  return out;
};
/* desenho/anime: pele lisa, luz em poucos degraus (mantém a cor), contorno escuro fino */
function borraCaixa(src, w, h, r){
  var tmp = new Float32Array(src.length), out = new Float32Array(src.length), x, y, c, k;
  for (c = 0; c < 3; c++){
    for (y = 0; y < h; y++){ var s = 0, n = 0; for (x = -r; x < w + r; x++){ if (x + r < w){ s += src[(y * w + x + r) * 3 + c]; n++; } if (x - r - 1 >= 0){ s -= src[(y * w + x - r - 1) * 3 + c]; n--; } if (x >= 0 && x < w) tmp[(y * w + x) * 3 + c] = s / n; } }
    for (x = 0; x < w; x++){ var s2 = 0, n2 = 0; for (y = -r; y < h + r; y++){ if (y + r < h){ s2 += tmp[((y + r) * w + x) * 3 + c]; n2++; } if (y - r - 1 >= 0){ s2 -= tmp[((y - r - 1) * w + x) * 3 + c]; n2--; } if (y >= 0 && y < h) out[(y * w + x) * 3 + c] = s2 / n2; } }
  }
  return out;
}
function desenhoFiltro(img, w, h, estilo){
  var d = img.data, N = estilo == 'anime' ? 4 : 5, i, x, y, c;
  var src = new Float32Array(w * h * 3); for (i = 0; i < w * h; i++) for (c = 0; c < 3; c++) src[i * 3 + c] = d[i * 4 + c];
  var r = Math.max(2, Math.round(Math.min(w, h) / 60)), sm = borraCaixa(borraCaixa(src, w, h, r), w, h, r);
  var r2 = Math.max(1, Math.round(r / 3)), sm2 = borraCaixa(src, w, h, r2);
  var L = new Float32Array(w * h), L2 = new Float32Array(w * h);
  for (i = 0; i < w * h; i++){ L[i] = sm[i * 3] * 0.3 + sm[i * 3 + 1] * 0.59 + sm[i * 3 + 2] * 0.11; L2[i] = sm2[i * 3] * 0.3 + sm2[i * 3 + 1] * 0.59 + sm2[i * 3 + 2] * 0.11; }
  var lim = estilo == 'anime' ? 38 : 40;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++){
    var k = y * w + x, p = k * 4, l = Math.max(1, L[k]);
    var q = Math.round(l / 255 * N) / N * 255; q = l * 0.6 + q * 0.4;
    var f = Math.max(0.7, Math.min(1.35, q / l));
    for (c = 0; c < 3; c++){ var v = sm[k * 3 + c]; v = l + (v - l) * 1.25; d[p + c] = Math.max(0, Math.min(255, v * f + 6)); }
    if (x > 0 && y > 0 && x < w - 1 && y < h - 1){
      var gx = L2[k + 1 - w] + 2 * L2[k + 1] + L2[k + 1 + w] - L2[k - 1 - w] - 2 * L2[k - 1] - L2[k - 1 + w];
      var gy = L2[k - 1 + w] + 2 * L2[k + w] + L2[k + 1 + w] - L2[k - 1 - w] - 2 * L2[k - w] - L2[k + 1 - w];
      var e = Math.sqrt(gx * gx + gy * gy);
      if (e > lim){ var a = Math.min(1, (e - lim) / (lim * 1.5)) * 0.85; d[p] *= 1 - a; d[p + 1] *= 1 - a; d[p + 2] *= 1 - a; }
    }
  }
}

/* ---------- rosto falante ---------- */
/* img: canvas da cena já com o rosto; pts: 468 pontos (px). Devolve objeto com .quadro(boca 0..1, piscar 0..1, t segundos) que redesenha em .c */
CK.Falante = function(img, pts){
  var W = img.width, H = img.height, g = criaGL(W, H), gl = g.gl;
  textura(g, img);
  var b = caixa(pts), cx = b.x + b.w / 2, cy = b.y + b.h / 2, R = Math.max(b.w, b.h) / 2;
  var P = pts.map(function(p){ return [p[0], p[1]]; });
  /* anel fixo em volta do rosto para a deformação sumir suave */
  var nAnel = 24, i;
  for (i = 0; i < nAnel; i++){ var a = i / nAnel * Math.PI * 2; P.push([cx + Math.cos(a) * b.w * 0.95, cy + Math.sin(a) * b.h * 0.85]); }
  for (i = 0; i < 16; i++){ var a2 = i / 16 * Math.PI * 2; P.push([cx + Math.cos(a2) * b.w * 1.5, cy + Math.sin(a2) * b.h * 1.3]); }
  var NF = 468, fixo = P.length;
  var interno = {}; LAB_IN.forEach(function(k){ interno[k] = 1; });
  var tris = delaunay(P).filter(function(T){ return !(interno[T[0]] && interno[T[1]] && interno[T[2]]); });
  var uv = triBuf(tris, P, [W, H]);
  var full = new Float32Array([0,0, W,0, 0,H, W,0, W,H, 0,H]), fullUV = new Float32Array([0,0, 1,0, 0,1, 1,0, 1,1, 0,1]);
  /* eixos do rosto */
  var topo = pts[10], queixo = pts[152], fH = Math.hypot(queixo[0] - topo[0], queixo[1] - topo[1]);
  var dn = [(queixo[0] - topo[0]) / fH, (queixo[1] - topo[1]) / fH], pp = [-dn[1], dn[0]];
  var mc = [(pts[13][0] + pts[14][0]) / 2, (pts[13][1] + pts[14][1]) / 2];
  var larg = Math.hypot(pts[291][0] - pts[61][0], pts[291][1] - pts[61][1]);
  var peso = new Float32Array(NF), pesoCima = new Float32Array(NF);
  var baixo = {}; LAB_IN_BAIXO.concat(LAB_FORA_BAIXO, LAB_MEIO_BAIXO).forEach(function(k){ baixo[k] = 1; });
  function sst(a, b2, x){ var t = Math.max(0, Math.min(1, (x - a) / (b2 - a))); return t * t * (3 - 2 * t); }
  for (i = 0; i < NF; i++){
    var vx = P[i][0] - mc[0], vy = P[i][1] - mc[1], s = (vx * dn[0] + vy * dn[1]) / fH, x = (vx * pp[0] + vy * pp[1]) / fH;
    var lat = Math.pow(Math.max(0, 1 - Math.abs(x) / 0.42), 1.4);
    if (LAB_IN_CIMA.indexOf(i) >= 0 && i != 78 && i != 308) pesoCima[i] = lat;
    if (baixo[i]) peso[i] = lat;
    else if (s > 0) peso[i] = lat * sst(0.03, 0.14, s);
  }
  var olhos = [[OLHO_D_CIMA, OLHO_D_BAIXO, DOBRA_D, 159, 145], [OLHO_E_CIMA, OLHO_E_BAIXO, DOBRA_E, 386, 374]];
  var piv = [queixo[0] + dn[0] * fH * 0.35, queixo[1] + dn[1] * fH * 0.35];
  var Q = P.map(function(p){ return [p[0], p[1]]; });
  var self = {c: g.c, W: W, H: H, rosto: b};
  self.quadro = function(boca, pisca, t, mexe){
    var A = fH * 0.11 * Math.max(0, Math.min(1, boca)), k;
    for (k = 0; k < fixo; k++){ Q[k][0] = P[k][0]; Q[k][1] = P[k][1]; }
    for (k = 0; k < NF; k++){ var w = peso[k] - pesoCima[k] * 0.15; if (w){ Q[k][0] += dn[0] * A * w; Q[k][1] += dn[1] * A * w; } }
    if (pisca > 0) olhos.forEach(function(o){
      o[0].forEach(function(j, n){ var lo = P[o[1][n]], dx = lo[0] - P[j][0], dy = lo[1] - P[j][1];
        Q[j][0] += dx * 0.92 * pisca; Q[j][1] += dy * 0.92 * pisca;
        var dj = o[2][n]; if (dj != null){ Q[dj][0] += dx * 0.45 * pisca; Q[dj][1] += dy * 0.45 * pisca; } }); });
    if (mexe !== false){
      var ang = (Math.sin(t * 2 * Math.PI / 3.3) * 2.2 + Math.sin(t * 2 * Math.PI / 1.7) * 0.6) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
      var nod = Math.sin(t * 2 * Math.PI / 2.4) * fH * 0.008 + A * 0.12;
      for (k = 0; k < NF; k++){ var rx = Q[k][0] - piv[0], ry = Q[k][1] - piv[1]; Q[k][0] = piv[0] + rx * ca - ry * sa + dn[0] * nod; Q[k][1] = piv[1] + rx * sa + ry * ca + dn[1] * nod; }
    }
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    desenha(g, full, fullUV);
    if (A > 0.5){
      /* boca por dentro: escuro + faixa de dentes */
      var bocaP = LAB_IN.map(function(j){ return Q[j]; }), cxb = 0, cyb = 0; bocaP.forEach(function(q){ cxb += q[0]; cyb += q[1]; }); cxb /= bocaP.length; cyb /= bocaP.length;
      var fan = []; for (k = 0; k < bocaP.length; k++){ var q1 = bocaP[k], q2 = bocaP[(k + 1) % bocaP.length]; fan.push(cxb, cyb, q1[0], q1[1], q2[0], q2[1]); }
      solido(g, new Float32Array(fan), [0.16, 0.03, 0.04, 1]);
      var dent = [], hD = Math.min(A * 0.38, fH * 0.022);
      for (k = 0; k < LAB_IN_CIMA.length - 1; k++){ var a1 = Q[LAB_IN_CIMA[k]], a3 = Q[LAB_IN_CIMA[k + 1]];
        dent.push(a1[0], a1[1], a3[0], a3[1], a1[0] + dn[0] * hD, a1[1] + dn[1] * hD, a3[0], a3[1], a3[0] + dn[0] * hD, a3[1] + dn[1] * hD, a1[0] + dn[0] * hD, a1[1] + dn[1] * hD); }
      solido(g, new Float32Array(dent), [0.93, 0.91, 0.86, 1]);
    }
    desenha(g, triBuf(tris, Q), uv);
    return g.c;
  };
  self.fecha = function(){ try { gl.getExtension('WEBGL_lose_context').loseContext(); } catch (e) {} };
  self.quadro(0, 0, 0, false);
  return self;
};

/* envelope de volume da fala (0..1) por quadro, para a boca */
CK.envelope = function(buf, fps){
  var d = buf.getChannelData(0), sr = buf.sampleRate, win = Math.round(sr / fps), n = Math.ceil(d.length / win), e = new Float32Array(n), mx = 0, i, j;
  for (i = 0; i < n; i++){ var s = 0, c = 0; for (j = i * win; j < Math.min(d.length, (i + 1) * win); j++){ s += d[j] * d[j]; c++; } e[i] = c ? Math.sqrt(s / c) : 0; if (e[i] > mx) mx = e[i]; }
  var o = new Float32Array(n), ant = 0;
  for (i = 0; i < n; i++){ var v = mx ? e[i] / mx : 0; v = v < 0.08 ? 0 : Math.min(1, (v - 0.08) / 0.6); v = Math.pow(v, 0.8); ant = v > ant ? ant + (v - ant) * 0.75 : ant + (v - ant) * 0.45; o[i] = ant; }
  return o;
};
/* piscadas naturais: devolve 0..1 para o tempo t */
CK.piscada = function(t, sem){ var per = 3.4 + ((sem || 0) % 7) * 0.13, f = (t + (sem || 0) * 0.77) % per; return f < 0.18 ? Math.sin(f / 0.18 * Math.PI) : 0; };
})();
