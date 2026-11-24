/* Oferta Okê — locutores, texto, voz (Gemini TTS), efeitos e música (Web Audio) */
var VOZES = [
  {id: 'bene', nome: 'Seu Bené', estilo: 'Grave de rádio', desc: 'Voz grossa de locutor das antigas, com eco de rádio.', gem: 'Charon',
   prompt: 'Fale como um locutor de rádio veterano, voz grave, firme e encorpada, com entusiasmo de oferta de supermercado',
   fx: {rate: 0.97, hp: 70, low: 5, mid: -1, pres: 2, high: -1, drive: 0.05, eco: 0.2, ecoT: 0.12, eco2: 0.25, room: 0.12}},
  {id: 'ze', nome: 'Zé do Feirão', estilo: 'Animado de feirão', desc: 'Empolgado, rápido, aquele grito de oferta!', gem: 'Puck',
   prompt: 'Fale como um locutor de feirão de supermercado, muito animado, rápido e empolgado, gritando a oferta com alegria',
   fx: {rate: 1.03, hp: 110, low: 2, mid: 1, pres: 5, high: 2, drive: 0.28, eco: 0.08, ecoT: 0.08, eco2: 0.15, room: 0.05}},
  {id: 'leo', nome: 'Léo Turbo', estilo: 'Jovem e moderno', desc: 'Descontraído, estilo propaganda de internet.', gem: 'Fenrir',
   prompt: 'Fale como um locutor jovem e moderno, descontraído e animado, estilo propaganda de internet',
   fx: {rate: 1.04, hp: 100, low: 1, mid: 0, pres: 3, high: 4, drive: 0.1, eco: 0, ecoT: 0.05, eco2: 0, room: 0.03}},
  {id: 'cida', nome: 'Dona Cida', estilo: 'Mulher simpática', desc: 'Calorosa e sorridente, jeito de mercado do bairro.', gem: 'Sulafat',
   prompt: 'Fale como uma locutora simpática e acolhedora, sorridente, tom caloroso de propaganda de mercado do bairro',
   fx: {rate: 1.0, hp: 120, low: 2, mid: 1, pres: 2, high: 1.5, drive: 0, eco: 0.06, ecoT: 0.06, eco2: 0.1, room: 0.1}},
  {id: 'kelly', nome: 'Kelly Show', estilo: 'Mulher animada', desc: 'Cheia de energia, clima de feirão de ofertas!', gem: 'Laomedeia',
   prompt: 'Fale como uma locutora muito animada e alegre, cheia de energia, estilo feirão de ofertas',
   fx: {rate: 1.04, hp: 130, low: 0, mid: 1, pres: 4, high: 3, drive: 0.15, eco: 0.06, ecoT: 0.07, eco2: 0.12, room: 0.05}}
];
function vozPorId(id){ for (var i = 0; i < VOZES.length; i++) if (VOZES[i].id == id) return VOZES[i]; return VOZES[0]; }

/* ---------- números por extenso ---------- */
var UN = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
var DZ = ['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
var CT = ['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
function ate999(n, fem){
  if (n == 0) return '';
  if (n == 100) return 'cem';
  var c = Math.floor(n / 100), r = n % 100, p = [];
  if (c) p.push(CT[c]);
  if (r){ if (r < 20) p.push(UN[r]); else { var d = Math.floor(r / 10), u = r % 10; p.push(DZ[d] + (u ? ' e ' + UN[u] : '')); } }
  var s = p.join(' e ');
  if (fem) s = s.replace(/\bum\b/g, 'uma').replace(/\bdois\b/g, 'duas').replace(/zentos\b/g, 'zentas');
  return s;
}
function extenso(n, fem){
  n = Math.floor(Math.abs(n)); if (n == 0) return 'zero';
  var mi = Math.floor(n / 1000000), mil = Math.floor((n % 1000000) / 1000), r = n % 1000, p = [];
  if (mi) p.push(mi == 1 ? 'um milhão' : ate999(mi) + ' milhões');
  if (mil) p.push(mil == 1 ? 'mil' : ate999(mil, fem) + ' mil');
  if (r) p.push(ate999(r, fem));
  if (p.length > 1){ var ult = p[p.length - 1]; if (r && (r < 100 || r % 100 == 0)) { p[p.length - 1] = 'e ' + ult; } }
  return p.join(' ').replace(/ e e /g, ' e ');
}
function precoExtenso(v){
  v = Math.round((+v || 0) * 100); var r = Math.floor(v / 100), c = v % 100, s = '';
  if (r) s = extenso(r) + (r == 1 ? ' real' : (r % 1000000 == 0 ? ' de reais' : ' reais'));
  if (c) s += (r ? ' e ' : '') + extenso(c) + (c == 1 ? ' centavo' : ' centavos');
  return s || 'zero reais';
}
/* jeito curto, como locutor fala o preço antigo: "nove e noventa" */
function precoCurto(v){
  v = Math.round((+v || 0) * 100); var r = Math.floor(v / 100), c = v % 100;
  if (!c) return extenso(r) + (r == 1 ? ' real' : ' reais');
  if (!r) return extenso(c) + ' centavos';
  return extenso(r) + ' e ' + extenso(c);
}
function precoBR(v){ return (Math.round((+v || 0) * 100) / 100).toFixed(2).replace('.', ','); }
function lePreco(s){ s = String(s || '').replace(/[^\d,\.]/g, ''); if (!s) return NaN; if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.'); return parseFloat(s); }

/* nome do produto do jeito que se fala: 5kg -> 5 quilos */
function nomeFalado(n){
  return String(n || '').replace(/(\d+(?:[.,]\d+)?)\s*kg\b/gi, function(m, x){ return x + (x == '1' ? ' quilo' : ' quilos'); })
    .replace(/(\d+)\s*g\b/gi, '$1 gramas').replace(/(\d+)\s*ml\b/gi, '$1 mililitros')
    .replace(/(\d+(?:[.,]\d+)?)\s*l\b/gi, function(m, x){ return x + (x == '1' ? ' litro' : ' litros'); })
    .replace(/\bun\b\.?/gi, 'unidade').replace(/\bpct\b\.?/gi, 'pacote').replace(/\bcx\b\.?/gi, 'caixa').replace(/\bdz\b\.?/gi, 'dúzia')
    .replace(/\s+/g, ' ').trim();
}
var UNIDADES = {'': '', kg: 'o quilo', un: 'a unidade', pacote: 'o pacote', litro: 'o litro', duzia: 'a dúzia', bandeja: 'a bandeja', caixa: 'a caixa', fardo: 'o fardo'};
var UNI_TAG = {'': '', kg: 'o kg', un: 'cada', pacote: 'pacote', litro: 'o litro', duzia: 'a dúzia', bandeja: 'bandeja', caixa: 'caixa', fardo: 'fardo'};
function sorteia(a, i){ return a[(i == null ? Math.floor(Math.random() * a.length) : i) % a.length]; }

function montaRoteiro(of, semente){
  var s = semente == null ? Math.floor(Math.random() * 1000) : semente, loja = (of.loja || 'nossa loja').trim();
  var abre = sorteia(['Olha a oferta! Atenção, freguesia do ' + loja + '!', 'Atenção, atenção! É dia de oferta no ' + loja + '!', 'Corre, minha gente, que hoje tem preço baixo no ' + loja + '!', 'Alô, freguesia! Chegou a hora da economia no ' + loja + '!'], s);
  var itens = (of.produtos || []).map(function(p, i){
    var nome = nomeFalado(p.nome) || 'produto', pr = precoExtenso(p.preco), u = UNIDADES[p.un || ''] ? ' ' + UNIDADES[p.un || ''] : '';
    if (p.de && +p.de > +p.preco) return sorteia([nome + '! De ' + precoCurto(p.de) + ', por apenas ' + pr + u + '!', 'Olha só: ' + nome + '. Era ' + precoCurto(p.de) + ', agora só ' + pr + u + '!'], s + i);
    return sorteia([nome + ', por apenas ' + pr + u + '!', 'Olha só: ' + nome + ', só ' + pr + u + '!', 'E tem mais: ' + nome + ' por apenas ' + pr + u + '!', nome + '? Tá saindo por ' + pr + u + '!'], s + i);
  });
  var fecha = sorteia(['Corre pro ' + loja + '!', loja + ': o preço baixo tá aqui! Corre que acaba!', 'Não perde não! Corre pro ' + loja + '!'], s);
  if (of.end) fecha += ' Fica na ' + of.end.replace(/^(na|no|em)\s+/i, '') + '.';
  if (of.zap) fecha += ' Chama no zap!';
  fecha += ' Ofertas válidas enquanto durarem os estoques.';
  return {abre: abre, itens: itens, fecha: fecha};
}

/* ---------- Gemini TTS ---------- */
var TTS_MODELOS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'];
function wavDePcm(u8, rate){
  var h = new ArrayBuffer(44), v = new DataView(h), n = u8.length;
  function w(o, s){ for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n, true);
  var o = new Uint8Array(44 + n); o.set(new Uint8Array(h), 0); o.set(u8, 44); return o.buffer;
}
function b64u8(b){ var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function espera(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
/* devolve ArrayBuffer de um WAV */
async function geraFala(texto, voz, key, avisa){
  if (!key) throw new Error('sem-chave');
  var corpo = {contents: [{parts: [{text: voz.prompt + ':\n' + texto}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voz.gem}}}}};
  var ultimo = '';
  for (var volta = 0; volta < 3; volta++){
    var todos429 = true;
    for (var i = 0; i < TTS_MODELOS.length; i++){
      var m = TTS_MODELOS[i], r;
      try {
        r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent?key=' + encodeURIComponent(key), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo)});
      } catch (e) { ultimo = 'sem internet'; todos429 = false; continue; }
      if (r.status == 429){ ultimo = 'limite'; continue; }
      todos429 = false;
      if (!r.ok){ ultimo = 'erro ' + r.status; continue; }
      var j = await r.json(), part = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0];
      if (!part || !part.inlineData){ ultimo = 'resposta vazia'; continue; }
      var mime = part.inlineData.mimeType || '', u8 = b64u8(part.inlineData.data);
      window.OK_MODELO_TTS = m;
      if (/wav/i.test(mime) || (u8[0] == 82 && u8[1] == 73 && u8[2] == 70 && u8[3] == 70)) return u8.buffer;
      var rate = +((mime.match(/rate=(\d+)/) || [])[1] || 24000);
      return wavDePcm(u8, rate);
    }
    if (!todos429) break;
    if (avisa) avisa('A voz está ocupada (limite grátis por minuto). Esperando 40 segundos…');
    await espera(40000);
  }
  throw new Error(ultimo == 'limite' ? 'limite' : (ultimo || 'falhou'));
}

/* ---------- efeitos de voz ---------- */
function curvaDrive(k){ var n = 1024, c = new Float32Array(n); for (var i = 0; i < n; i++){ var x = i * 2 / n - 1; c[i] = (1 + k * 4) * x / (1 + k * 4 * Math.abs(x)); } return c; }
function impulso(ctx, seg, dec){ var len = Math.floor(ctx.sampleRate * seg), b = ctx.createBuffer(2, len, ctx.sampleRate); for (var ch = 0; ch < 2; ch++){ var d = b.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, dec); } return b; }
/* liga fonte -> cadeia -> destino; devolve o nó de entrada */
function cadeiaFx(ctx, fx, destino){
  var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = fx.hp || 80;
  var lo = ctx.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 180; lo.gain.value = fx.low || 0;
  var mi = ctx.createBiquadFilter(); mi.type = 'peaking'; mi.frequency.value = 500; mi.Q.value = 1; mi.gain.value = fx.mid || 0;
  var pr = ctx.createBiquadFilter(); pr.type = 'peaking'; pr.frequency.value = 3200; pr.Q.value = 0.9; pr.gain.value = fx.pres || 0;
  var hi = ctx.createBiquadFilter(); hi.type = 'highshelf'; hi.frequency.value = 7500; hi.gain.value = fx.high || 0;
  var sh = ctx.createWaveShaper(); sh.curve = curvaDrive(fx.drive || 0); sh.oversample = '2x';
  var co = ctx.createDynamicsCompressor(); co.threshold.value = -24; co.knee.value = 6; co.ratio.value = 4; co.attack.value = 0.004; co.release.value = 0.15;
  var mk = ctx.createGain(); mk.gain.value = 1.5;
  hp.connect(lo); lo.connect(mi); mi.connect(pr); pr.connect(hi); hi.connect(sh); sh.connect(co); co.connect(mk); mk.connect(destino);
  if (fx.eco){ var dl = ctx.createDelay(1); dl.delayTime.value = fx.ecoT || 0.1; var fb = ctx.createGain(); fb.gain.value = fx.eco2 || 0.2; var em = ctx.createGain(); em.gain.value = fx.eco;
    var ef = ctx.createBiquadFilter(); ef.type = 'bandpass'; ef.frequency.value = 1800; ef.Q.value = 0.5;
    mk.connect(dl); dl.connect(ef); ef.connect(fb); fb.connect(dl); ef.connect(em); em.connect(destino); }
  if (fx.room){ var cv = ctx.createConvolver(); cv.buffer = impulso(ctx, 0.9, 3); var rg = ctx.createGain(); rg.gain.value = fx.room; mk.connect(cv); cv.connect(rg); rg.connect(destino); }
  return hp;
}

/* tira silêncio do começo e do fim; acha pausas */
function analisaFala(buf){
  var d = buf.getChannelData(0), sr = buf.sampleRate, win = Math.floor(sr * 0.02), n = Math.floor(d.length / win), rms = new Float32Array(n), mx = 0;
  for (var i = 0; i < n; i++){ var s = 0; for (var j = i * win; j < (i + 1) * win; j++) s += d[j] * d[j]; rms[i] = Math.sqrt(s / win); if (rms[i] > mx) mx = rms[i]; }
  var lim = Math.max(0.008, mx * 0.06), ini = 0, fim = n - 1;
  while (ini < n && rms[ini] < lim) ini++; while (fim > ini && rms[fim] < lim) fim--;
  var pausas = [], k = ini, corrida = 0;
  for (k = ini; k <= fim; k++){ if (rms[k] < lim) corrida++; else { if (corrida >= 9) pausas.push((k - corrida / 2) * 0.02 - ini * 0.02); corrida = 0; } }
  return {ini: Math.max(0, ini * 0.02 - 0.03), fim: Math.min(buf.duration, (fim + 1) * 0.02 + 0.08), pausas: pausas};
}

/* tempos de cada parte do texto, ajustados nas pausas da fala */
function tempos(partes, falaDur, pausas){
  var tot = 0, ls = partes.map(function(p){ var l = Math.max(8, p.length); tot += l; return l; }), acc = 0, cortes = [];
  for (var i = 0; i < ls.length - 1; i++){ acc += ls[i]; var est = acc / tot * falaDur, melhor = est, md = 1.3;
    pausas.forEach(function(p){ var dd = Math.abs(p - est); if (dd < md && (!cortes.length || p > cortes[cortes.length - 1] + 0.6)){ md = dd; melhor = p; } });
    cortes.push(melhor); }
  var r = [], a = 0; cortes.concat([falaDur]).forEach(function(c){ r.push([a, c]); a = c; }); return r;
}

/* ---------- música de fundo sintetizada (sem direitos autorais) ---------- */
function ruido(ctx, seg){ var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seg), ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function musica(ctx, dest, dur, estilo){
  var bpm = estilo == 'grave' ? 112 : 124, bt = 60 / bpm, nz = ruido(ctx, 0.5);
  var prog = [[261.6, 329.6, 392.0], [196.0, 246.9, 293.7], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6]], raiz = [65.41, 49.0, 55.0, 43.65];
  var bus = ctx.createGain(); bus.gain.value = 1; bus.connect(dest);
  function kick(t){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.26); }
  function ruidoHit(t, tipo, f, vol, len){ var s = ctx.createBufferSource(); s.buffer = nz; var fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + len + 0.02); }
  function nota(t, f, len, tipo, vol, corte){ var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = tipo; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = corte; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + len + 0.02); }
  for (var b = 0, t = 0; t < dur; b++, t = b * bt){
    var comp = Math.floor(b / 4) % 4, ch = prog[comp];
    kick(t); ruidoHit(t + bt / 2, 'highpass', 7000, 0.12, 0.04); ruidoHit(t, 'highpass', 8000, 0.05, 0.03);
    if (b % 2 == 1) ruidoHit(t, 'bandpass', 1600, 0.35, 0.14);
    nota(t, raiz[comp], bt * 0.45, 'triangle', 0.5, 900); nota(t + bt / 2, raiz[comp] * 2, bt * 0.4, 'triangle', 0.4, 900);
    ch.forEach(function(f){ nota(t + bt / 2, f, bt * 0.35, 'sawtooth', 0.07, 2400); });
    if (b % 8 == 7) nota(t + bt * 0.75, ch[2] * 2, bt * 0.3, 'square', 0.05, 3000);
  }
  return bus;
}
function efeitoSom(ctx, dest, t, tipo){
  if (tipo == 'ding'){ [1318.5, 1760, 2637].forEach(function(f, i){ var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22 / (i + 1), t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.72); }); return; }
  var s = ctx.createBufferSource(); s.buffer = ruido(ctx, 0.6); var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.4);
  var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5); s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + 0.6);
}

/* monta o áudio final: fala com efeito + música abaixando na fala + efeitos. Devolve {buf, plano} */
var T_INTRO = 1.4, T_FIM = 2.6;
async function mixar(falaWav, voz, partes, nProd){
  var tmp = new OfflineAudioContext(1, 1, 44100), fala = await tmp.decodeAudioData(falaWav.slice(0));
  var an = analisaFala(fala), rate = voz.fx.rate || 1, falaDur = (an.fim - an.ini) / rate;
  var pz = an.pausas.map(function(p){ return p / rate; }), tp = tempos(partes, falaDur, pz);
  var total = T_INTRO + falaDur + T_FIM, sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
  var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
  var master = ctx.createGain(); master.gain.value = 0.9; master.connect(lim); lim.connect(ctx.destination);
  var mg = ctx.createGain(); mg.connect(master);
  musica(ctx, mg, total, voz.id == 'bene' ? 'grave' : '');
  var g = mg.gain; g.setValueAtTime(0.0, 0); g.linearRampToValueAtTime(0.5, 0.15); g.setValueAtTime(0.5, T_INTRO - 0.25); g.linearRampToValueAtTime(0.16, T_INTRO + 0.05);
  g.setValueAtTime(0.16, T_INTRO + falaDur); g.linearRampToValueAtTime(0.5, T_INTRO + falaDur + 0.4); g.setValueAtTime(0.5, total - 1.0); g.linearRampToValueAtTime(0.0, total - 0.05);
  var src = ctx.createBufferSource(); src.buffer = fala; src.playbackRate.value = rate; var vg = ctx.createGain(); vg.gain.value = 1; vg.connect(master);
  src.connect(cadeiaFx(ctx, voz.fx, vg)); src.start(T_INTRO, an.ini, an.fim - an.ini);
  var sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
  efeitoSom(ctx, sfx, 0.05, 'whoosh');
  var cenas = [{tipo: 'abre', t0: 0, t1: T_INTRO + tp[0][1]}];
  for (var i = 0; i < nProd; i++){ var s = tp[i + 1]; if (!s) break; var t0 = T_INTRO + s[0], t1 = T_INTRO + s[1]; cenas.push({tipo: 'prod', i: i, t0: t0, t1: t1}); efeitoSom(ctx, sfx, Math.max(0, t0 - 0.2), 'whoosh'); efeitoSom(ctx, sfx, t0 + Math.min(0.75, (t1 - t0) * 0.3), 'ding'); }
  var ultimo = tp[tp.length - 1]; cenas.push({tipo: 'fim', t0: T_INTRO + ultimo[0], t1: total}); efeitoSom(ctx, sfx, Math.max(0, T_INTRO + ultimo[0] - 0.2), 'whoosh');
  var buf = await ctx.startRendering();
  return {buf: buf, plano: {cenas: cenas, total: total}};
}
/* música sozinha (se a voz falhar) */
async function mixarSemVoz(nProd){
  var porProd = 3.2, total = T_INTRO + 1.2 + nProd * porProd + T_FIM + 0.6, sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
  var mg = ctx.createGain(); mg.connect(ctx.destination); musica(ctx, mg, total, ''); mg.gain.setValueAtTime(0.55, 0); mg.gain.setValueAtTime(0.55, total - 1); mg.gain.linearRampToValueAtTime(0, total - 0.05);
  var cenas = [{tipo: 'abre', t0: 0, t1: T_INTRO + 1.2}], t = T_INTRO + 1.2;
  for (var i = 0; i < nProd; i++){ cenas.push({tipo: 'prod', i: i, t0: t, t1: t + porProd}); efeitoSom(ctx, mg, t + 0.6, 'ding'); t += porProd; }
  cenas.push({tipo: 'fim', t0: t, t1: total});
  return {buf: await ctx.startRendering(), plano: {cenas: cenas, total: total}};
}
