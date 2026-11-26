/* CenaSua — áudio: música sintetizada própria (sem direitos autorais), voz da IA (Gemini TTS, com espera no limite grátis)
   e gravação da própria voz. */
(function(){
var CK = window.CK || (window.CK = {});

/* ---------- chave da IA (opcional) ---------- */
var FB = {apiKey: 'AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM', authDomain: 'pdv-mercadinho-1c882.firebaseapp.com', projectId: 'pdv-mercadinho-1c882', storageBucket: 'pdv-mercadinho-1c882.firebasestorage.app', messagingSenderId: '572967904689', appId: '1:572967904689:web:e162701eeab1bc0be48990'};
CK.chave = async function(){
  var k = localStorage.getItem('ck_chave') || '';
  if (k) return k;
  /* se o dono já entrou no Oferta Okê/Meu Lanche neste celular, a chave vem do painel (mesmo site) */
  try {
    if (!window.firebase) return '';
    if (!firebase.apps.length) firebase.initializeApp(FB);
    var u = await new Promise(function(r){ var off = firebase.auth().onAuthStateChanged(function(x){ off(); r(x); }); setTimeout(function(){ r(null); }, 4000); });
    if (!u) return '';
    var d = await firebase.firestore().collection('ml_config').doc('geral').get();
    return d.exists ? (d.data().geminiKey || '') : '';
  } catch (e) { return ''; }
};
CK.entrarDono = async function(){
  if (!firebase.apps.length) firebase.initializeApp(FB);
  var p = new firebase.auth.GoogleAuthProvider();
  try { await firebase.auth().signInWithPopup(p); } catch (e) { if (/popup/i.test(e.code || '')) await firebase.auth().signInWithRedirect(p); else throw e; }
};

/* ---------- utilidades ---------- */
function wavDePcm(u8, rate){
  var h = new ArrayBuffer(44), v = new DataView(h), n = u8.length;
  function w(o, s){ for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n, true);
  var o = new Uint8Array(44 + n); o.set(new Uint8Array(h), 0); o.set(u8, 44); return o.buffer;
}
async function b64Bytes(b){ var r = await fetch('data:application/octet-stream;base64,' + b); return new Uint8Array(await r.arrayBuffer()); }
CK.espera = function(ms, conta, sinal){ return new Promise(function(r, ruim){ var fim = Date.now() + ms, iv = setInterval(function(){ if (sinal && sinal.cancelado){ clearInterval(iv); clearTimeout(t); ruim(new Error('cancelado')); return; } if (conta) conta(Math.max(0, Math.ceil((fim - Date.now()) / 1000))); }, 500), t = setTimeout(function(){ clearInterval(iv); r(); }, ms); }); };
function pede(url, corpo, ms, sinal){
  var ctl = new AbortController(), motivo = '';
  var t = setTimeout(function(){ motivo = 'tempo'; ctl.abort(); }, ms);
  var iv = setInterval(function(){ if (sinal && sinal.cancelado){ motivo = 'cancelado'; ctl.abort(); } }, 300);
  return fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: corpo, signal: ctl.signal})
    .then(function(r){ return r.status == 200 ? r.json().then(function(j){ return {status: 200, j: j}; }) : {status: r.status}; })
    .catch(function(){ if (motivo == 'cancelado') throw new Error('cancelado'); return {status: motivo || 'rede'}; })
    .finally(function(){ clearTimeout(t); clearInterval(iv); });
}
CK.pedeGemini = pede;

/* ---------- vozes ---------- */
CK.VOZES = {m: [{id: 'Puck', nome: 'Animado'}, {id: 'Charon', nome: 'Grave'}, {id: 'Fenrir', nome: 'Forte'}], f: [{id: 'Kore', nome: 'Firme'}, {id: 'Aoede', nome: 'Leve'}, {id: 'Leda', nome: 'Jovem'}]};
var TTS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-flash-preview-tts'];
var ESTILO = {drama: 'Dramatic Brazilian telenovela acting, intense emotion, theatrical pauses.', misterio: 'Mysterious suspense mini-series acting, low and intriguing.', festa: 'Happy, celebrating, joyful.', acao: 'Action movie hero, urgent, breathless, determined.', comedia: 'Comedy, playful and funny timing, a bit exaggerated.', meme: 'Funny everyday Brazilian meme voice, sarcastic and relaxed.', romance: 'Romantic movie, soft, emotional.', heroi: 'Confident superhero, warm and brave.', sitcom: 'Cartoon sitcom character, cheerful and goofy.', anime: 'Dubbed action anime fighter, shouting with energy and power.'};
/* gera a fala de todas as cenas num pedido só (a cota grátis é por pedido). Devolve AudioBuffer + trechos por cena. */
CK.falaIA = async function(ctx, linhas, voz, mus, avisa, sinal){
  var key = await CK.chave(); if (!key) throw new Error('sem-chave');
  var txt = '# AUDIO PROFILE: A Brazilian actor playing the main character of a short fun video.\n### DIRECTOR\'S NOTES\nStyle: ' + (ESTILO[mus] || ESTILO.comedia) +
    '\nAccent: Brazilian Portuguese (Brazil).\nPace: natural, lively. Make a clear pause of about one second between each line of the transcript.\nOnly speak the transcript below, exactly as written. Never read these notes aloud.\n#### TRANSCRIPT\n' + linhas.join('\n');
  var corpo = JSON.stringify({contents: [{parts: [{text: txt}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: voz}}}}});
  var inicio = Date.now(), ultimo = '';
  for (var volta = 0; volta < 3; volta++){
    var todos429 = true;
    for (var i = 0; i < TTS.length; i++){
      if (Date.now() - inicio > 150000){ ultimo = 'tempo'; break; }
      if (avisa) avisa('🎙️ A IA está gravando sua voz de personagem…');
      var r = await pede('https://generativelanguage.googleapis.com/v1beta/models/' + TTS[i] + ':generateContent?key=' + encodeURIComponent(key), corpo, 45000, sinal);
      if (r.status == 429){ ultimo = 'limite'; continue; }
      todos429 = false;
      if (r.status != 200){ ultimo = 'erro ' + r.status; continue; }
      var part = r.j && r.j.candidates && r.j.candidates[0] && r.j.candidates[0].content && r.j.candidates[0].content.parts && r.j.candidates[0].content.parts[0];
      if (!part || !part.inlineData){ ultimo = 'vazio'; continue; }
      var mime = part.inlineData.mimeType || '', u8 = await b64Bytes(part.inlineData.data), ab;
      if (/wav/i.test(mime)) ab = u8.buffer; else ab = wavDePcm(u8, +((mime.match(/rate=(\d+)/) || [])[1] || 24000));
      var buf = await ctx.decodeAudioData(ab);
      return {buf: buf, trechos: CK.cortaFala(buf.getChannelData(0), buf.sampleRate, linhas)};
    }
    if (!todos429) break;
    if (Date.now() - inicio > 100000) break;
    await CK.espera(40000, function(s){ if (avisa) avisa('⏳ A voz grátis da IA está ocupada (limite por minuto). Tentando de novo em ' + s + ' s…'); }, sinal);
  }
  throw new Error(ultimo || 'falhou');
};
/* divide a fala em N trechos pelos silêncios (mesma ideia do Oferta Okê) */
CK.cortaFala = function(d, sr, partes){
  var win = Math.floor(sr * 0.01), n = Math.floor(d.length / win), rms = new Float32Array(n), mx = 0, i, j;
  for (i = 0; i < n; i++){ var s = 0; for (j = i * win; j < (i + 1) * win; j++) s += d[j] * d[j]; rms[i] = Math.sqrt(s / win); if (rms[i] > mx) mx = rms[i]; }
  var lim = Math.max(0.004, mx * 0.05), ini = 0, fim = n - 1;
  while (ini < n && rms[ini] < lim) ini++; while (fim > ini && rms[fim] < lim) fim--;
  var K = partes.length, T0 = ini * 0.01, T1 = (fim + 1) * 0.01;
  if (K < 2 || fim <= ini) return [{ini: Math.max(0, T0 - 0.03), fim: T1 + 0.1}];
  var sil = [], run = 0;
  for (var k = ini; k <= fim + 1; k++){ if (k <= fim && rms[k] < lim) run++; else { if (run >= 15) sil.push({a: (k - run) * 0.01, b: k * 0.01, len: run * 0.01}); run = 0; } }
  var tam = partes.map(function(p){ return Math.max(8, p.length); }), tot = tam.reduce(function(a, b){ return a + b; }, 0), est = [], ac = 0;
  for (i = 0; i < K - 1; i++){ ac += tam[i]; est.push(T0 + ac / tot * (T1 - T0)); }
  var cortes = [], usado = {};
  est.forEach(function(e){ var best = null, bs = -1e9; sil.forEach(function(c, q){ if (usado[q]) return; var m = (c.a + c.b) / 2, sc = c.len * 3 - Math.abs(m - e) / (T1 - T0) * 12; if (sc > bs){ bs = sc; best = q; } }); if (best != null){ usado[best] = 1; cortes.push(sil[best]); } else cortes.push({a: e, b: e}); });
  cortes.sort(function(a, b){ return a.a - b.a; });
  var r = [], st = Math.max(0, T0 - 0.03);
  for (k = 0; k < K; k++){ var c2 = cortes[k]; r.push({ini: st, fim: c2 ? c2.a + 0.08 : T1 + 0.1}); if (c2) st = Math.max(c2.a, c2.b - 0.05); }
  return r;
};

/* ---------- gravar a própria voz ---------- */
CK.gravaVoz = async function(){
  var st = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}});
  var tipo = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].filter(function(t){ return MediaRecorder.isTypeSupported(t); })[0];
  var rec = new MediaRecorder(st, tipo ? {mimeType: tipo} : undefined), ped = [];
  rec.ondataavailable = function(e){ if (e.data && e.data.size) ped.push(e.data); };
  rec.start(250);
  return {para: function(){ return new Promise(function(r){ rec.onstop = function(){ st.getTracks().forEach(function(t){ t.stop(); }); r(new Blob(ped, {type: rec.mimeType || 'audio/webm'})); }; rec.stop(); }); },
    cancela: function(){ try { rec.stop(); } catch (e) {} st.getTracks().forEach(function(t){ t.stop(); }); }};
};

/* ---------- música própria por estilo ---------- */
function ruidoBuf(ctx){ var b = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; }
var EST = {
  drama:   {bpm: 70, prog: [[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7],[164.8,207.7,246.9]], pad: 0.09, arp: 'sine', bat: 0, piano: 1},
  misterio:{bpm: 84, prog: [[220,261.6,329.6],[233.1,277.2,349.2],[220,261.6,329.6],[207.7,246.9,311.1]], pad: 0.08, arp: 'triangle', bat: 1, tic: 1},
  festa:   {bpm: 124, prog: [[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]], pad: 0.05, arp: 'square', bat: 3, palma: 1},
  acao:    {bpm: 140, prog: [[146.8,174.6,220],[146.8,174.6,220],[116.5,146.8,174.6],[130.8,164.8,196]], pad: 0.05, arp: 'sawtooth', bat: 2, osti: 1},
  comedia: {bpm: 118, prog: [[261.6,329.6,392],[174.6,220,261.6],[196,246.9,293.7],[261.6,329.6,392]], pad: 0.03, arp: 'triangle', bat: 1, pizz: 1},
  meme:    {bpm: 105, prog: [[196,246.9,293.7],[261.6,329.6,392],[196,246.9,293.7],[220,277.2,329.6]], pad: 0.03, arp: 'square', bat: 1, pizz: 1},
  romance: {bpm: 66, prog: [[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]], pad: 0.1, arp: 'sine', bat: 0, piano: 1},
  heroi:   {bpm: 112, prog: [[196,246.9,293.7],[261.6,329.6,392],[293.7,370,440],[196,246.9,293.7]], pad: 0.08, arp: 'sawtooth', bat: 2, metal: 1},
  sitcom:  {bpm: 120, prog: [[261.6,329.6,392],[220,261.6,329.6],[293.7,349.2,440],[196,246.9,293.7]], pad: 0.03, arp: 'triangle', bat: 1, palma: 1, pizz: 1},
  anime:   {bpm: 150, prog: [[164.8,196,246.9],[130.8,164.8,196],[146.8,185,220],[123.5,146.8,185]], pad: 0.04, arp: 'sawtooth', bat: 2, osti: 1, guit: 1}
};
CK.musica = function(ctx, dest, dur, estilo){
  var e = EST[estilo] || EST.comedia, bt = 60 / e.bpm, nz = ruidoBuf(ctx), bus = ctx.createGain(); bus.gain.value = 0.9; bus.connect(dest);
  function env(t, f, len, tipo, vol, corte, ataque){ var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = tipo; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = corte || 3000;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (ataque || 0.01)); g.gain.exponentialRampToValueAtTime(0.0008, t + len); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + len + 0.05); }
  function hit(t, tipo, f, vol, len){ var s = ctx.createBufferSource(); s.buffer = nz; var fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + len + 0.02); }
  function kick(t, v){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3); }
  var t0 = ctx.currentTime + 0.05;
  for (var b = 0; b * bt < dur; b++){
    var t = t0 + b * bt, comp = Math.floor(b / 4) % 4, ch = e.prog[comp], raiz = ch[0] / 2;
    if (b % 4 == 0) ch.forEach(function(f){ env(t, f, bt * 4.2, 'sawtooth', e.pad, 1200, bt * 0.8); env(t, f * 1.003, bt * 4.2, 'triangle', e.pad * 0.8, 1800, bt * 0.8); });
    if (e.piano) [0, 1, 2, 1].forEach(function(k, q){ env(t + q * bt / 4, ch[k] * 2, bt * 1.2, 'sine', 0.07, 4000, 0.005); });
    if (e.bat >= 1){ kick(t, e.bat >= 2 ? 0.9 : 0.6); if (e.bat >= 2 && b % 2 == 1) kick(t + bt / 2, 0.7); }
    if (e.bat >= 1 && b % 2 == 1) hit(t, 'bandpass', 1800, 0.3, 0.12);
    if (e.bat >= 1) for (var h = 0; h < (e.bat >= 2 ? 4 : 2); h++) hit(t + h * bt / (e.bat >= 2 ? 4 : 2), 'highpass', 8000, 0.05, 0.03);
    if (e.palma && b % 2 == 1) [0, 0.012, 0.024].forEach(function(dd){ hit(t + dd, 'bandpass', 1400, 0.22, 0.08); });
    if (e.tic) hit(t + bt / 2, 'highpass', 6000, 0.05, 0.02);
    env(t, raiz, bt * 0.8, 'triangle', 0.32, 700);
    if (e.osti) for (var o = 1; o < 4; o++) env(t + o * bt / 4, raiz * (o == 2 ? 2 : 1), bt * 0.2, 'sawtooth', 0.12, 900);
    if (e.pizz) env(t + bt / 2, ch[(b) % 3] * 2, bt * 0.25, 'triangle', 0.12, 2500, 0.004);
    if (e.guit && b % 2 == 0) ch.forEach(function(f){ env(t, f, bt * 0.9, 'square', 0.035, 2200); });
    if (e.metal && b % 8 == 0) ch.concat([ch[0] * 2]).forEach(function(f){ env(t, f, bt * 1.8, 'sawtooth', 0.05, 2400, 0.03); });
  }
  return bus;
};
})();
