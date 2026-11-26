/* CenaSua — monta o vídeo 9:16 (720x1280) no próprio celular: cenas com o rosto falando, movimento suave,
   legendas, música, voz e a marca "feito com IA · CenaSua" sempre visível. */
(function(){
var CK = window.CK || (window.CK = {});
var W = 720, H = 1280, MARCA = 'feito com IA · CenaSua';
CK.MARCA = MARCA;

function quebra(x, txt, larg){ var ps = String(txt).split(/\s+/), ls = [], l = ''; ps.forEach(function(p){ var t = l ? l + ' ' + p : p; if (x.measureText(t).width > larg && l){ ls.push(l); l = p; } else l = t; }); if (l) ls.push(l); return ls; }
function pilula(x, px, py, w, h, r){ x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
/* marca d'água: sempre no canto de cima, por cima de tudo */
CK.marca = function(x, w, h){
  var s = w / 720; x.save(); x.font = '700 ' + Math.round(25 * s) + 'px system-ui, Roboto, Arial, sans-serif';
  var tw = x.measureText(MARCA).width, pw = tw + 30 * s, ph = 44 * s, px = w - pw - 18 * s, py = 18 * s;
  x.globalAlpha = 0.62; x.fillStyle = '#000'; pilula(x, px, py, pw, ph, ph / 2); x.fill();
  x.globalAlpha = 0.95; x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText(MARCA, px + 15 * s, py + ph / 2 + 1);
  x.restore();
};
function legenda(x, txt, meme, alpha){
  if (!txt) return; x.save(); x.globalAlpha = alpha == null ? 1 : alpha;
  if (meme){
    x.font = '900 64px Impact, "Arial Black", system-ui, sans-serif'; x.textAlign = 'center'; x.lineJoin = 'round';
    var ls = quebra(x, txt.toUpperCase(), W - 70), y = 150;
    ls.forEach(function(l, i){ x.lineWidth = 12; x.strokeStyle = '#000'; x.strokeText(l, W / 2, y + i * 72); x.fillStyle = '#fff'; x.fillText(l, W / 2, y + i * 72); });
  } else {
    x.font = '800 44px system-ui, Roboto, Arial, sans-serif'; x.textAlign = 'center';
    var ls2 = quebra(x, txt, W - 110), lh = 54, bh = ls2.length * lh + 36, by = H - 150 - bh;
    x.fillStyle = 'rgba(0,0,0,.62)'; pilula(x, 34, by, W - 68, bh, 26); x.fill();
    x.fillStyle = '#fff'; x.textBaseline = 'middle'; ls2.forEach(function(l, i){ x.fillText(l, W / 2, by + 18 + lh / 2 + i * lh); });
  }
  x.restore();
}
CK.legenda = legenda;
/* foto final (para salvar/compartilhar) */
CK.fotoFinal = function(canvas, leg, meme){
  var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
  x.drawImage(canvas, 0, 0, W, H); legenda(x, leg, meme); CK.marca(x, W, H);
  return c;
};

/* cenas: [{c: canvas da cena com o rosto, pts, leg, fala}] ; o: {titulo, sub, ep, meme, mus, voz:{buf, trechos}|null, avisa, sinal} */
CK.fazVideo = async function(cenas, o){
  var out = document.createElement('canvas'); out.width = W; out.height = H; var x = out.getContext('2d');
  var ctx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 48000});
  if (ctx.state == 'suspended') try { await ctx.resume(); } catch (e) {}
  var dest = ctx.createMediaStreamDestination();
  var FPS = 24, INTRO = 1.8, OUTRO = 1.7, i;
  /* tempos */
  var voz = o.voz, durs = [], ini = [], t = INTRO, envs = null;
  if (voz){ envs = CK.envelope(voz.buf, 50); }
  for (i = 0; i < cenas.length; i++){
    var d = o.meme ? 5 : 4.2;
    if (voz && voz.trechos[i]) d = Math.max(3.2, voz.trechos[i].fim - voz.trechos[i].ini + 1.0);
    ini.push(t); durs.push(d); t += d;
  }
  var T = t + OUTRO;
  /* falantes (um WebGL por cena) */
  var fal = cenas.map(function(c){ return CK.Falante(c.c, c.pts); });
  var fundo = document.createElement('canvas'); fundo.width = W; fundo.height = H; var fx = fundo.getContext('2d');
  fx.filter = 'blur(18px) brightness(.55)'; fx.drawImage(cenas[0].c, -40, -40, W + 80, H + 80); fx.filter = 'none';
  /* áudio */
  var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -8; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.12; lim.connect(dest); lim.connect(ctx.destination);
  var mix = ctx.createGain(); mix.gain.value = 0.9; mix.connect(lim);
  var musG = ctx.createGain(); musG.gain.value = voz ? 0.34 : 0.6; musG.connect(mix);
  var t0 = ctx.currentTime + 0.25;
  CK.musica(ctx, musG, T + 0.5, o.mus);
  musG.gain.setValueAtTime(musG.gain.value, t0 + T - 1.2); musG.gain.linearRampToValueAtTime(0.0001, t0 + T);
  if (voz) for (i = 0; i < cenas.length; i++){ var tr = voz.trechos[i]; if (!tr) continue;
    var s = ctx.createBufferSource(); s.buffer = voz.buf; var vg = ctx.createGain(); vg.gain.value = 1.15; s.connect(vg); vg.connect(mix);
    s.start(t0 + ini[i] + 0.4, tr.ini, Math.max(0.1, tr.fim - tr.ini)); }
  /* gravador */
  var st = out.captureStream(FPS); dest.stream.getAudioTracks().forEach(function(a){ st.addTrack(a); });
  var tipos = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  var tipo = tipos.filter(function(q){ return window.MediaRecorder && MediaRecorder.isTypeSupported(q); })[0];
  var rec = new MediaRecorder(st, {mimeType: tipo, videoBitsPerSecond: 2600000, audioBitsPerSecond: 128000}), ped = [];
  rec.ondataavailable = function(e){ if (e.data && e.data.size) ped.push(e.data); };
  function quadro(tt){
    x.globalAlpha = 1; x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    if (tt < INTRO){
      x.drawImage(fundo, 0, 0); var a = Math.min(1, tt / 0.4);
      x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.fillStyle = '#fff';
      x.font = '120px system-ui'; x.fillText(o.emo || '🎬', W / 2, 470);
      x.font = '700 34px system-ui, Roboto, Arial'; x.fillStyle = '#ffd54f'; x.fillText((o.sub || '').toUpperCase(), W / 2, 560);
      x.font = '900 62px system-ui, Roboto, Arial'; x.fillStyle = '#fff'; quebra(x, o.titulo || '', W - 80).forEach(function(l, k){ x.fillText(l, W / 2, 650 + k * 72); });
      x.font = '700 36px system-ui, Roboto, Arial'; x.fillStyle = '#ffffffcc'; x.fillText('estrelando: VOCÊ ⭐', W / 2, 860);
      x.restore();
    } else if (tt < T - OUTRO){
      var k = cenas.length - 1; for (i = 0; i < cenas.length; i++) if (tt < ini[i] + durs[i]){ k = i; break; }
      var tl = tt - ini[k], boca = 0;
      if (voz && voz.trechos[k]){ var tv = tl - 0.4; if (tv >= 0 && tv <= voz.trechos[k].fim - voz.trechos[k].ini){ var idx = Math.floor((voz.trechos[k].ini + tv) * 50); boca = envs[Math.min(envs.length - 1, idx)] || 0; } }
      var g = fal[k].quadro(boca, CK.piscada(tl + 0.6, k + 1), tl, true);
      var r = fal[k].rosto, fxC = (r.x + r.w / 2) / W, fyC = (r.y + r.h / 2) / H, z = 1 + 0.09 * (tl / durs[k]);
      var dw = W * z, dh = H * z, ox = (W - dw) * fxC, oy = (H - dh) * fyC;
      x.drawImage(g, ox, oy, dw, dh);
      if (tl < 0.35) { x.fillStyle = 'rgba(0,0,0,' + (1 - tl / 0.35) + ')'; x.fillRect(0, 0, W, H); }
      if (o.ep){ x.save(); x.font = '800 30px system-ui, Roboto, Arial'; x.fillStyle = 'rgba(0,0,0,.55)'; pilula(x, 18, 18, 190, 44, 22); x.fill(); x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.fillText('EPISÓDIO ' + o.ep, 34, 41); x.restore(); }
      legenda(x, cenas[k].leg, o.meme, Math.min(1, Math.max(0, (tl - 0.25) / 0.3)));
      if (o.ep && k == cenas.length - 1 && tl > durs[k] - 1.6 && o.ep < 3){ x.save(); x.font = '800 34px system-ui'; x.textAlign = 'center'; x.fillStyle = '#ffd54f'; x.fillText('Continua no próximo episódio…', W / 2, H - 70); x.restore(); }
    } else {
      var to = tt - (T - OUTRO); x.drawImage(fundo, 0, 0);
      x.save(); x.globalAlpha = Math.min(1, to / 0.3); x.textAlign = 'center';
      x.font = '900 92px system-ui, Roboto, Arial'; x.fillStyle = '#fff'; x.fillText('CenaSua', W / 2, 600);
      x.font = '700 36px system-ui, Roboto, Arial'; x.fillStyle = '#ffd54f'; x.fillText('Coloque seu rosto em cenas de IA', W / 2, 670);
      x.font = '700 30px system-ui, Roboto, Arial'; x.fillStyle = '#ffffffcc'; x.fillText('Vídeo feito com inteligência artificial', W / 2, 740);
      x.fillText('Personagens e cenas fictícios', W / 2, 785);
      x.restore();
    }
    CK.marca(x, W, H);
  }
  quadro(0);
  rec.start(500);
  var fim = await new Promise(function(res){
    var parado = 0, ult = -1;
    function loop(){
      if (o.sinal && o.sinal.cancelado){ res('cancelado'); return; }
      var tt = ctx.currentTime - t0;
      if (tt >= T){ res('ok'); return; }
      if (tt >= 0) quadro(tt);
      if (o.avisa) o.avisa(Math.max(0, Math.min(1, tt / T)), T);
      if (tt === ult){ if (++parado > 240){ res('travou'); return; } } else { parado = 0; ult = tt; }
      if (document.hidden) setTimeout(loop, 40); else requestAnimationFrame(loop);
    }
    loop();
  });
  quadro(T - 0.01);
  var blob = await new Promise(function(res){ rec.onstop = function(){ res(new Blob(ped, {type: (rec.mimeType || tipo || 'video/webm').split(';')[0]})); }; try { rec.stop(); } catch (e) { res(null); } });
  st.getTracks().forEach(function(q){ q.stop(); });
  fal.forEach(function(f){ f.fecha(); });
  try { await ctx.close(); } catch (e) {}
  if (fim != 'ok') throw new Error(fim);
  return {blob: blob, tipo: blob.type, dur: T};
};
})();
