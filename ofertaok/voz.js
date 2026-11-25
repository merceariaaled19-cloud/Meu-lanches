/* Oferta Okê — locutores, texto, voz (Gemini TTS), efeitos e música (Web Audio) */
var VOZES = [
  {id: 'bene', nome: 'Seu Bené', estilo: 'Grave de rádio', desc: 'Vozeirão de locutor das antigas, animado, com eco de rádio.', gem: 'Algenib',
   perfil: 'Seu Bené, a deep-voiced veteran MALE Brazilian radio announcer, booming, proud and very enthusiastic',
   fx: {rate: 1.03, hp: 70, low: 5, mid: -1, pres: 3, high: 0, drive: 0.08, eco: 0.18, ecoT: 0.11, eco2: 0.22, room: 0.1}},
  {id: 'ze', nome: 'Zé do Feirão', estilo: 'Animado de feirão', desc: 'Explosivo, rápido, aquele grito de oferta!', gem: 'Puck',
   perfil: 'Zé do Feirão, a MALE Brazilian street-market (feirão) announcer with explosive energy, shouting the deals with joy',
   fx: {rate: 1.08, hp: 110, low: 2, mid: 1, pres: 5, high: 2, drive: 0.28, eco: 0.08, ecoT: 0.08, eco2: 0.15, room: 0.05}},
  {id: 'leo', nome: 'Léo Turbo', estilo: 'Jovem e acelerado', desc: 'Empolgado, ritmo turbo de propaganda de internet.', gem: 'Fenrir',
   perfil: 'Léo Turbo, a young hyped MALE Brazilian announcer, fast and punchy like a viral internet ad',
   fx: {rate: 1.08, hp: 100, low: 1, mid: 0, pres: 4, high: 4, drive: 0.12, eco: 0, ecoT: 0.05, eco2: 0, room: 0.03}},
  {id: 'toninho', nome: 'Toninho do Som', estilo: 'Carro de som', desc: 'O clássico do carro de som: alto, rápido, "olha a promoção!"', gem: 'Sadachbia',
   perfil: 'Toninho do Som, a loud festive MALE Brazilian sound-truck (carro de som) announcer, fast and full of energy',
   fx: {rate: 1.07, hp: 160, low: 0, mid: 3, pres: 6, high: 1, drive: 0.22, eco: 0.14, ecoT: 0.09, eco2: 0.2, room: 0.06}},
  {id: 'kelly', nome: 'Kelly Show', estilo: 'Mulher animada', desc: 'A locutora: cheia de energia, clima de feirão!', gem: 'Laomedeia',
   perfil: 'Kelly Show, a bubbly FEMALE Brazilian supermarket announcer with explosive energy and a big smile',
   fx: {rate: 1.06, hp: 130, low: 0, mid: 1, pres: 4, high: 3, drive: 0.15, eco: 0.06, ecoT: 0.07, eco2: 0.12, room: 0.05}}
];
/* comerciais antigos com 'Dona Cida' (saiu na v5) usam a locutora que ficou */
var VOZ_ANTIGA = {cida: 'kelly'};
/* instruções de estilo no formato que o Gemini TTS NÃO lê em voz alta (na v4 ele lia "Fale como..." e atrasava tudo) */
function promptTTS(voz, texto){
  return '# AUDIO PROFILE: ' + voz.perfil + '\n' +
    "## THE SCENE: A sound truck (carro de som) driving through a busy Brazilian neighborhood, announcing the supermarket's big sale on a loudspeaker.\n" +
    "### DIRECTOR'S NOTES\n" +
    'Style: Extremely excited Brazilian supermarket sale announcer ("olha a promoção!"), very high energy, a big smile you can hear, shouting the deals with joy, punchy emphasis on product names and prices.\n' +
    'Pace: Fast and lively, never dragging. Make a clear pause of about one second between each line of the transcript.\n' +
    'Accent: Brazilian Portuguese (Brazil), popular and friendly.\n' +
    'Only speak the transcript below, exactly as written. Never read these notes aloud.\n' +
    '#### TRANSCRIPT\n' + texto;
}
function vozPorId(id){ id = VOZ_ANTIGA[id] || id; for (var i = 0; i < VOZES.length; i++) if (VOZES[i].id == id) return VOZES[i]; return VOZES[0]; }

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
  if (of.end) fecha += ' Fica na ' + of.end.replace(/^(na|no|em)\s+/i, '').replace(/\s+-\s+/g, ', ') + '.';
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
/* base64 -> bytes sem travar a tela (o navegador decodifica por dentro) */
async function b64Bytes(b){ try { var r = await fetch('data:application/octet-stream;base64,' + b); return new Uint8Array(await r.arrayBuffer()); } catch (e) { return b64u8(b); } }
function espera(ms, conta){ return new Promise(function(r, ruim){ var fim = Date.now() + ms, iv = setInterval(function(){ if (conta) conta(Math.max(0, Math.ceil((fim - Date.now()) / 1000))); }, 1000), t = setTimeout(function(){ clearInterval(iv); window.cancelaEspera = null; r(); }, ms);
  window.cancelaEspera = function(motivo){ clearTimeout(t); clearInterval(iv); window.cancelaEspera = null; ruim(new Error(motivo || 'oculto')); }; }); }
/* um pedido ao Gemini com tempo limite; cancelável (sair da tela / botão Cancelar) */
function pedeGemini(url, corpo, ms){
  var ctl = window.AbortController ? new AbortController() : null, motivo = '';
  var t = setTimeout(function(){ motivo = 'tempo'; if (ctl) ctl.abort(); }, ms);
  window.cancelaEspera = function(m){ motivo = m || 'oculto'; if (ctl) ctl.abort(); };
  return fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: corpo, signal: ctl ? ctl.signal : undefined})
    .then(function(r){ return r.status == 200 ? r.json().then(function(j){ return {status: 200, j: j}; }) : {status: r.status}; })
    .catch(function(e){ if (motivo == 'tempo') return {status: 'tempo'}; if (motivo) throw new Error(motivo); return {status: 'rede'}; })
    .finally(function(){ clearTimeout(t); window.cancelaEspera = null; });
}
/* devolve ArrayBuffer de um WAV. avisa(texto) mostra o que está acontecendo.
   Limites: cada pedido no máx. 45 s; tudo junto no máx. ~2 min 30 s. */
var TTS_TEMPO_PEDIDO = 45000, TTS_TEMPO_TOTAL = 150000, TTS_ESPERA_429 = 40000;
async function geraFala(texto, voz, key, avisa, modelos){
  if (!key) throw new Error('sem-chave');
  modelos = modelos || TTS_MODELOS;
  var corpo = JSON.stringify({contents: [{parts: [{text: promptTTS(voz, texto)}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voz.gem}}}}});
  var ultimo = '', inicio = Date.now();
  for (var volta = 0; volta < 3; volta++){
    var todos429 = true;
    for (var i = 0; i < modelos.length; i++){
      var resta = TTS_TEMPO_TOTAL - (Date.now() - inicio); if (resta < 5000){ ultimo = 'tempo'; break; }
      var m = modelos[i], t0 = Date.now(), tic = null;
      if (avisa){ var rot = function(){ avisa('🎙️ Gerando a voz de ' + voz.nome + '… ' + Math.round((Date.now() - t0) / 1000) + ' s' + (i ? ' (tentativa ' + (i + 1) + ')' : '')); }; rot(); tic = setInterval(rot, 1000); }
      var r = await pedeGemini('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent?key=' + encodeURIComponent(key), corpo, Math.min(TTS_TEMPO_PEDIDO, resta)).finally(function(){ clearInterval(tic); });
      if (r.status == 429){ ultimo = ultimo == 'tempo' ? 'tempo' : 'limite'; continue; }
      todos429 = false;
      if (r.status == 'tempo'){ ultimo = 'tempo'; continue; }
      if (r.status == 'rede'){ ultimo = 'sem internet'; continue; }
      if (r.status != 200){ ultimo = 'erro ' + r.status; continue; }
      var j = r.j, part = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0];
      if (!part || !part.inlineData){ ultimo = 'resposta vazia'; continue; }
      if (avisa) avisa('🎙️ Voz recebida! Preparando o áudio…');
      var mime = part.inlineData.mimeType || '', u8 = await b64Bytes(part.inlineData.data);
      window.OK_MODELO_TTS = m;
      if (/wav/i.test(mime) || (u8[0] == 82 && u8[1] == 73 && u8[2] == 70 && u8[3] == 70)) return u8.buffer;
      var rate = +((mime.match(/rate=(\d+)/) || [])[1] || 24000);
      return wavDePcm(u8, rate);
    }
    if (!todos429 || ultimo == 'tempo') break;
    if (TTS_TEMPO_TOTAL - (Date.now() - inicio) < TTS_ESPERA_429 + 10000) break;
    await espera(TTS_ESPERA_429, function(s){ if (avisa) avisa('⏳ A voz grátis está ocupada (limite por minuto). Tentando de novo em ' + s + ' s…'); });
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

/* ---------- corta a fala em um trecho por parte (abertura, cada produto, encerramento) ----------
   A voz vem num pedido só (a cota grátis é de 10 pedidos por dia por modelo), com ~1 s de pausa entre as linhas.
   Aqui medimos os silêncios de verdade e escolhemos as N-1 pausas que separam as partes (as mais longas,
   perto de onde o tamanho do texto diz que cada parte acaba). Devolve [{ini, fim}] em segundos do áudio original. */
function cortaFala(d, sr, partes){
  var win = Math.floor(sr * 0.01), n = Math.floor(d.length / win), rms = new Float32Array(n), mx = 0, i, j;
  for (i = 0; i < n; i++){ var s = 0; for (j = i * win; j < (i + 1) * win; j++) s += d[j] * d[j]; rms[i] = Math.sqrt(s / win); }
  var sm = new Float32Array(n); for (i = 0; i < n; i++){ var a = 0, c = 0; for (j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++){ a += rms[j]; c++; } sm[i] = a / c; if (sm[i] > mx) mx = sm[i]; }
  var lim = Math.max(0.004, mx * 0.045), ini = 0, fim = n - 1;
  while (ini < n && sm[ini] < lim) ini++; while (fim > ini && sm[fim] < lim) fim--;
  if (fim <= ini) return null;
  /* silêncios dentro da fala (>= 0,12 s) */
  var sil = [], k = ini, run = 0;
  for (k = ini; k <= fim + 1; k++){ if (k <= fim && sm[k] < lim) run++; else { if (run >= 12) sil.push({a: (k - run) * 0.01, b: k * 0.01, len: run * 0.01}); run = 0; } }
  var K = partes.length, T0 = ini * 0.01, T1 = (fim + 1) * 0.01, D = T1 - T0;
  if (K < 2) return [{ini: Math.max(0, T0 - 0.03), fim: Math.min(d.length / sr, T1 + 0.1)}];
  var tam = partes.map(function(p){ return Math.max(10, String(p).replace(/\s+/g, ' ').length); }), tot = tam.reduce(function(x, y){ return x + y; }, 0), est = [], ac = 0;
  /* tempo de silêncio esperado entre as partes entra na conta da posição estimada */
  for (i = 0; i < K - 1; i++){ ac += tam[i]; est.push(T0 + ac / tot * D); }
  /* programação dinâmica: escolhe K-1 silêncios em ordem; pontua pausa longa e perto do estimado */
  function nota(c, kk){ var m = (c.a + c.b) / 2, dv = Math.abs(m - est[kk]) / D; return 3 * Math.min(c.len, 1.2) - 9 * dv - 14 * dv * dv; }
  var M = sil.length, NEG = -1e9, best = [], de = [];
  for (k = 0; k < K - 1; k++){ best.push(new Float64Array(M).fill(NEG)); de.push(new Int32Array(M).fill(-1)); }
  for (j = 0; j < M; j++) best[0][j] = (sil[j].a - T0 >= 0.4) ? nota(sil[j], 0) : NEG;
  for (k = 1; k < K - 1; k++) for (j = 0; j < M; j++){ var m2 = NEG, arg = -1;
    for (var q = 0; q < j; q++) if (best[k - 1][q] > NEG && sil[j].a - sil[q].b >= 0.4 && best[k - 1][q] > m2){ m2 = best[k - 1][q]; arg = q; }
    if (arg >= 0){ best[k][j] = m2 + nota(sil[j], k); de[k][j] = arg; } }
  var esc = null, top = NEG; for (j = 0; j < M; j++) if (best[K - 2][j] > top && T1 - sil[j].b >= 0.4){ top = best[K - 2][j]; esc = j; }
  var cortes = [];
  if (esc != null){ for (k = K - 2, j = esc; k >= 0; k--){ cortes.unshift(sil[j]); j = de[k][j]; } }
  else { /* poucos silêncios: corta onde o tamanho do texto manda */ for (k = 0; k < K - 1; k++) cortes.push({a: est[k], b: est[k], len: 0}); }
  var r = [], st = Math.max(0, T0 - 0.03);
  for (k = 0; k < K; k++){ var c2 = cortes[k]; var f = c2 ? Math.min(c2.b, c2.a + 0.1) : Math.min(d.length / sr, T1 + 0.1); r.push({ini: st, fim: f}); if (c2) st = Math.max(c2.a, c2.b - 0.05); }
  return r;
}

/* ---------- música de fundo sintetizada (sem direitos autorais) ---------- */
function ruido(ctx, seg){ var b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seg), ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
function musica(ctx, dest, dur, estilo){
  var bpm = estilo == 'grave' ? 120 : 132, bt = 60 / bpm, nz = ruido(ctx, 0.5);
  var prog = [[261.6, 329.6, 392.0], [196.0, 246.9, 293.7], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6]], raiz = [65.41, 49.0, 55.0, 43.65];
  var bus = ctx.createGain(); bus.gain.value = 1; bus.connect(dest);
  function kick(t){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.11); g.gain.setValueAtTime(0.95, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.25); }
  function ruidoHit(t, tipo, f, vol, len){ var s = ctx.createBufferSource(); s.buffer = nz; var fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + len + 0.02); }
  function palma(t, vol){ [0, 0.012, 0.025].forEach(function(d){ ruidoHit(t + d, 'bandpass', 1400, vol, 0.09); }); }
  function nota(t, f, len, tipo, vol, corte){ var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = tipo; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = corte; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + len + 0.02); }
  for (var b = 0, t = 0; t < dur; b++, t = b * bt){
    var comp = Math.floor(b / 4) % 4, ch = prog[comp];
    kick(t); if (b % 4 == 3) kick(t + bt * 0.75);
    for (var h = 0; h < 4; h++) ruidoHit(t + h * bt / 4, 'highpass', 8000, h == 2 ? 0.14 : 0.06, 0.03);
    if (b % 2 == 1) palma(t, 0.32);
    nota(t, raiz[comp], bt * 0.4, 'triangle', 0.5, 900); nota(t + bt / 2, raiz[comp] * 2, bt * 0.35, 'triangle', 0.42, 900); nota(t + bt * 0.75, raiz[comp] * 2, bt * 0.2, 'triangle', 0.3, 900);
    ch.forEach(function(f){ nota(t + bt / 2, f, bt * 0.3, 'sawtooth', 0.075, 2600); });
    if (b % 4 == 3) [0, 0.25, 0.5].forEach(function(d, k){ nota(t + d * bt, ch[k] * 2, bt * 0.22, 'square', 0.045, 3400); });
  }
  return bus;
}
/* "tchan!" de metais (acorde curto) para abrir e marcar cada produto */
function metais(ctx, dest, t, alto){
  var fs = alto ? [523.3, 659.3, 784.0, 1046.5] : [392.0, 493.9, 587.3, 784.0];
  fs.forEach(function(f){ [-6, 6].forEach(function(det){ var o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(600, t); fl.frequency.linearRampToValueAtTime(4200, t + 0.06); fl.frequency.exponentialRampToValueAtTime(1200, t + 0.45);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.02); g.gain.setValueAtTime(0.05, t + 0.22); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.6); }); });
}
function efeitoSom(ctx, dest, t, tipo){
  if (tipo == 'ding'){ [1318.5, 1760, 2637].forEach(function(f, i){ var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22 / (i + 1), t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7); o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.72); }); return; }
  var s = ctx.createBufferSource(); s.buffer = ruido(ctx, 0.6); var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.4);
  var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5); s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + 0.6);
}

/* monta o áudio final: cada parte da fala é um trecho com a duração REAL dela, colocado um depois do outro.
   As cenas (abertura, cada produto, final) começam exatamente quando o trecho daquela parte começa a tocar.
   Devolve {buf, plano}. plano.trechos guarda os tempos para conferência. */
var T_INTRO = 1.3, T_FIM = 2.4, T_VAO = 0.28, T_ANTES = 0.12;
async function mixar(falaWav, voz, partes, nProd){
  var tmp = new OfflineAudioContext(1, 1, 44100), fala = await tmp.decodeAudioData(falaWav.slice(0));
  var rate = voz.fx.rate || 1, cortes = cortaFala(fala.getChannelData(0), fala.sampleRate, partes);
  if (!cortes) throw new Error('voz-vazia');
  var pos = [], t = T_INTRO;
  cortes.forEach(function(c){ var dur = (c.fim - c.ini) / rate; pos.push({t: t, dur: dur, ini: c.ini, fim: c.fim}); t += dur + T_VAO; });
  var falaFim = t - T_VAO, total = falaFim + T_FIM, sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
  var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
  var master = ctx.createGain(); master.gain.value = 0.9; master.connect(lim); lim.connect(ctx.destination);
  var mg = ctx.createGain(); mg.connect(master);
  musica(ctx, mg, total, voz.id == 'bene' ? 'grave' : '');
  var g = mg.gain; g.setValueAtTime(0.0, 0); g.linearRampToValueAtTime(0.55, 0.12); g.setValueAtTime(0.55, T_INTRO - 0.25); g.linearRampToValueAtTime(0.2, T_INTRO + 0.05);
  g.setValueAtTime(0.2, falaFim); g.linearRampToValueAtTime(0.55, falaFim + 0.35); g.setValueAtTime(0.55, total - 0.9); g.linearRampToValueAtTime(0.0, total - 0.05);
  var vg = ctx.createGain(); vg.gain.value = 1; vg.connect(master); var entrada = cadeiaFx(ctx, voz.fx, vg);
  pos.forEach(function(p){ var src = ctx.createBufferSource(); src.buffer = fala; src.playbackRate.value = rate; src.connect(entrada); src.start(p.t, p.ini, p.fim - p.ini); });
  var sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
  efeitoSom(ctx, sfx, 0.05, 'whoosh'); metais(ctx, sfx, 0.3, true);
  var ini = function(k){ return Math.max(0, pos[k].t - T_ANTES); };
  var cenas = [{tipo: 'abre', t0: 0, t1: pos.length > 1 ? ini(1) : total}];
  for (var i = 0; i < nProd && i + 1 < pos.length - 1; i++){ var t0 = ini(i + 1), t1 = ini(i + 2); cenas.push({tipo: 'prod', i: i, t0: t0, t1: t1}); efeitoSom(ctx, sfx, Math.max(0, t0 - 0.2), 'whoosh'); metais(ctx, sfx, t0, i % 2 == 0); efeitoSom(ctx, sfx, t0 + Math.min(0.7, (t1 - t0) * 0.3), 'ding'); }
  var ul = pos.length - 1; cenas.push({tipo: 'fim', t0: ini(ul), t1: total}); efeitoSom(ctx, sfx, Math.max(0, ini(ul) - 0.2), 'whoosh');
  var buf = await ctx.startRendering();
  return {buf: buf, plano: {cenas: cenas, total: total, trechos: pos.map(function(p){ return [+p.t.toFixed(2), +(p.t + p.dur).toFixed(2)]; })}};
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
