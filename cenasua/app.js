/* CenaSua — app principal. Português simples, tudo no aparelho, sem login. */
(function(){
var CK = window.CK, $ = function(id){ return document.getElementById(id); };
var TESTE = /[?&]teste=1/.test(location.search);
CK.LINK = 'https://is.gd/cenasua';

/* ---------- banco no aparelho (IndexedDB) ---------- */
var dbP = null;
function db(){ if (dbP) return dbP; dbP = new Promise(function(r, e){ var q = indexedDB.open('cenasua', 1); q.onupgradeneeded = function(){ q.result.createObjectStore('kv'); q.result.createObjectStore('videos', {keyPath: 'id'}); }; q.onsuccess = function(){ r(q.result); }; q.onerror = function(){ e(q.error); }; }); return dbP; }
function tx(st, modo, fn){ return db().then(function(d){ return new Promise(function(r, e){ var t = d.transaction(st, modo), s = t.objectStore(st), res = fn(s); t.oncomplete = function(){ r(res instanceof IDBRequest ? res.result : res); }; t.onerror = function(){ e(t.error); }; }); }); }
var KV = {get: function(k){ return tx('kv', 'readonly', function(s){ return s.get(k); }); }, set: function(k, v){ return tx('kv', 'readwrite', function(s){ s.put(v, k); }); }, del: function(k){ return tx('kv', 'readwrite', function(s){ s.delete(k); }); }};
CK.KV = KV;

/* ---------- telas e Voltar ---------- */
var pilha = ['tInicio'];
function mostra(id, sem){ document.querySelectorAll('.tela').forEach(function(t){ t.classList.toggle('on', t.id == id); }); if (!sem){ if (pilha[pilha.length - 1] != id) pilha.push(id); } window.scrollTo(0, 0); if (id != 'tSelfie') paraCamera(); }
function volta(){ if (pilha.length <= 1) return false; pilha.pop(); var id = pilha[pilha.length - 1]; mostra(id, true); return true; }
function inicio(){ pilha = ['tInicio']; mostra('tInicio', true); desenhaInicio(); }
window.voltarDentro = function(){ if ($('espera').classList.contains('on')) { cancelaEspera(); return true; } return volta(); };
document.querySelectorAll('.voltar').forEach(function(b){ b.onclick = function(){ if ($('tRes').classList.contains('on')) inicio(); else volta(); }; });
CK.mostra = mostra;

/* ---------- robô esperando ---------- */
var sinal = null, dicaIv = null;
var DICAS = ['🎬 Arrumando a luz do cenário…', '💄 Passando a maquiagem do personagem…', '🎥 Posicionando as câmeras…', '🍿 Já pode ir pegando a pipoca!', '🤖 O robô diretor está caprichando…', '✨ Ajustando a cor do seu rosto…'];
function espera(msg){ sinal = {cancelado: false}; $('espera').classList.add('on'); $('esMsg').textContent = msg; $('esBar').style.width = '0%'; var k = 0; clearInterval(dicaIv); $('esDica').textContent = DICAS[0]; dicaIv = setInterval(function(){ $('esDica').textContent = DICAS[++k % DICAS.length]; }, 3500); return sinal; }
function esperaMsg(m, p){ if (m) $('esMsg').textContent = m; if (p != null) $('esBar').style.width = Math.round(p * 100) + '%'; }
function fechaEspera(){ $('espera').classList.remove('on'); clearInterval(dicaIv); }
function cancelaEspera(){ if (sinal) sinal.cancelado = true; fechaEspera(); }
$('esCancela').onclick = cancelaEspera;
function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
function carregaImg(src){ return new Promise(function(r, e){ var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function(){ r(i); }; i.onerror = function(){ e(new Error('imagem')); }; i.src = src; }); }

/* ---------- estado ---------- */
var EU = {fonte: null, pts: null, url: '', gen: localStorage.getItem('ck_gen') || 'm'};
async function carregaEu(){
  var b = await KV.get('fonte'), p = await KV.get('fontePts');
  if (!b || !p){ EU.fonte = null; return; }
  if (EU.url) URL.revokeObjectURL(EU.url);
  EU.url = URL.createObjectURL(b); EU.fonte = await carregaImg(EU.url); EU.pts = p;
}

/* ---------- início ---------- */
function desenhaInicio(){
  var tem = !!EU.fonte;
  $('cSemSelfie').style.display = tem ? 'none' : 'block';
  $('cComSelfie').style.display = tem ? 'block' : 'none';
  $('areaCats').style.display = tem ? 'block' : 'none';
  if (tem) $('imgEu').src = EU.url;
  document.querySelectorAll('#chGen .chip').forEach(function(c){ c.classList.toggle('on', c.dataset.g == EU.gen); });
  listaVideos();
}
document.querySelectorAll('#chGen .chip').forEach(function(c){ c.onclick = function(){ EU.gen = c.dataset.g; localStorage.setItem('ck_gen', EU.gen); desenhaInicio(); }; });
function desenhaCats(){
  $('gCats').innerHTML = CK.CATS.map(function(c){ return '<div class="cat" data-c="' + c.id + '" style="background:linear-gradient(160deg,' + c.cor + ',#1a0830)"><span class="e">' + c.emo + '</span>' + esc(c.nome) + '</div>'; }).join('');
  document.querySelectorAll('#gCats .cat').forEach(function(d){ d.onclick = function(){ abreCat(d.dataset.c); }; });
}
$('bSair').onclick = function(){ confirmaSair(function(){ window.sairApp ? window.sairApp() : window.close(); }, {titulo: 'Quer mesmo sair?', texto: 'Toque em "Sim, sair" para fechar o CenaSua ou em "Cancelar" para continuar.'}); };
$('bAjustes').onclick = function(){ mostra('tAjustes'); ajustes(); };

/* ---------- selfie ao vivo com prova de vida ---------- */
var stream = null, laco = 0;
function paraCamera(){ cancelAnimationFrame(laco); laco = 0; if (stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; } }
$('bSelfie1').onclick = $('bSelfie2').onclick = abreSelfie;
function marcaPasso(i, est){ var e = $('p' + i); e.classList.remove('feito', 'agora'); if (est) e.classList.add(est); }
async function abreSelfie(){
  mostra('tSelfie'); $('selErro').innerHTML = ''; $('instr').textContent = 'Abrindo a câmera…'; [1, 2, 3, 4].forEach(function(i){ marcaPasso(i, ''); });
  var v = $('cam');
  try {
    stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user', width: {ideal: 720}, height: {ideal: 960}}, audio: false});
    v.srcObject = stream; await v.play();
  } catch (e) { $('instr').textContent = '📷 Não consegui abrir a câmera'; $('selErro').innerHTML = '<div class="erro">Permita o uso da câmera para o CenaSua (toque no cadeado ou nos ⋮ do navegador → Permissões → Câmera) e tente de novo.</div>'; return; }
  $('instr').textContent = '🤖 Preparando o robô do rosto…';
  try { await CK.rostoVideo(); } catch (e) { $('instr').textContent = 'Sem internet para baixar o robô do rosto'; $('selErro').innerHTML = '<div class="erro">Na primeira vez o app precisa de internet para baixar o robô do rosto (~18 MB). Conecte no Wi-Fi e tente de novo.</div>'; return; }
  var meio = Math.random() < 0.5 ? ['piscar', 'virar'] : ['virar', 'piscar'], passos = ['rosto'].concat(meio, ['frente']), at = 0, desde = 0, fechou = false, abriu = false, ultT = 0, iniPasso = performance.now();
  var NOMES = {rosto: 1, piscar: 2, virar: 3, frente: 4};
  marcaPasso(1, 'agora');
  function texto(t){ if ($('instr').textContent != t) $('instr').textContent = t; }
  function prox(){ marcaPasso(NOMES[passos[at]], 'feito'); at++; desde = 0; iniPasso = performance.now(); if (at < passos.length) marcaPasso(NOMES[passos[at]], 'agora'); if (navigator.vibrate) navigator.vibrate(60); }
  async function tick(){
    if (!stream) return;
    laco = requestAnimationFrame(tick);
    var agora = performance.now(); if (agora - ultT < 70 || v.readyState < 2) return; ultT = agora;
    var r = null; try { r = CK.pontosVideo(v, agora); } catch (e) {}
    var ok = false;
    if (!r){ texto('🙂 Coloque seu rosto dentro do oval'); $('oval').classList.remove('ok'); return; }
    if (r.n > 1){ texto('👤 Só você na câmera, por favor'); return; }
    var b = CK.caixa(r.pts), cx = (b.x + b.w / 2) / r.W, larg = b.w / r.W;
    ok = cx > 0.25 && cx < 0.75 && larg > 0.26;
    $('oval').classList.toggle('ok', ok);
    var bl = ((r.bs.eyeBlinkLeft || 0) + (r.bs.eyeBlinkRight || 0)) / 2, olho = CK.olhosAbertos(r.pts), vir = CK.virada(r.pts);
    var p = passos[at];
    if (agora - iniPasso > 25000 && p != 'frente') $('selErro').innerHTML = '<div class="aviso">Dica: fique num lugar com boa luz, segure o celular na altura do rosto e faça o movimento devagar.</div>';
    if (!ok && p != 'virar'){ texto(larg <= 0.26 ? '🔍 Chegue mais perto da câmera' : '🙂 Centralize o rosto no oval'); return; }
    if (p == 'rosto'){ texto('🙂 Isso! Fique paradinho…'); if (!desde) desde = agora; if (agora - desde > 700) prox(); }
    else if (p == 'piscar'){ texto('👁️ Agora PISQUE os olhos'); if (bl > 0.45 || olho < 0.12) fechou = true; else if (fechou && bl < 0.25 && olho > 0.17){ abriu = true; prox(); } }
    else if (p == 'virar'){ texto('↔️ Vire a cabeça devagar para um lado'); if (Math.abs(vir) > 0.25) prox(); }
    else if (p == 'frente'){ texto('📸 Agora olhe de frente para a câmera'); if (Math.abs(vir) < 0.08 && bl < 0.3 && olho > 0.17){ if (!desde) desde = agora; if (agora - desde > 450){ cancelAnimationFrame(laco); laco = 0; marcaPasso(4, 'feito'); await capturaVivo(v, r.pts); } } else desde = 0; }
  }
  tick();
}
async function capturaVivo(v, pts){
  if (!$('ckMeu').checked){ $('selErro').innerHTML = '<div class="erro">Marque “Este rosto é meu” para continuar. O CenaSua só aceita o rosto da própria pessoa.</div>'; abreSelfie(); return; }
  $('instr').textContent = '✅ Pronto! Guardando sua selfie…';
  var W = v.videoWidth, H = v.videoHeight, b = CK.caixa(pts), lado = Math.max(b.w, b.h) * 2.3, cx = b.x + b.w / 2, cy = b.y + b.h / 2 - b.h * 0.05;
  var cw = Math.min(W, lado), ch = Math.min(H, lado * 1.25), x0 = Math.max(0, Math.min(W - cw, cx - cw / 2)), y0 = Math.max(0, Math.min(H - ch, cy - ch / 2));
  var c = document.createElement('canvas'), esc2 = Math.min(1, 720 / cw); c.width = Math.round(cw * esc2); c.height = Math.round(ch * esc2);
  c.getContext('2d').drawImage(v, x0, y0, cw, ch, 0, 0, c.width, c.height);
  paraCamera();
  var blob = await new Promise(function(r){ c.toBlob(r, 'image/jpeg', 0.92); });
  var img = await carregaImg(URL.createObjectURL(blob)), q = await CK.pontos(img);
  if (!q){ $('selErro').innerHTML = '<div class="erro">Não consegui ver bem o rosto na foto. Vamos tentar de novo com mais luz.</div>'; abreSelfie(); return; }
  await KV.set('vivo', blob); await KV.set('vivoPts', q.pts); await KV.del('vivoDesc');
  await KV.set('fonte', blob); await KV.set('fontePts', q.pts); await KV.set('vivoEm', Date.now());
  await carregaEu(); inicio();
}

/* ---------- foto da galeria: só se for a mesma pessoa da selfie ---------- */
var faceapi = null;
async function carregaFaceApi(){
  if (faceapi) return faceapi;
  var m = await import('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js');
  try { await m.tf.setBackend('webgl'); } catch (e) { await m.tf.setBackend('cpu'); }
  await m.tf.ready();
  var U = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';
  await m.nets.tinyFaceDetector.loadFromUri(U); await m.nets.faceLandmark68Net.loadFromUri(U); await m.nets.faceRecognitionNet.loadFromUri(U);
  faceapi = m; return m;
}
async function descritores(img){ var fa = await carregaFaceApi(); return fa.detectAllFaces(img, new fa.TinyFaceDetectorOptions({inputSize: 416, scoreThreshold: 0.4})).withFaceLandmarks().withFaceDescriptors(); }
CK.confereGaleria = async function(foto){
  var vivo = await KV.get('vivo'); if (!vivo) return {ok: false, msg: 'Tire primeiro a selfie ao vivo.'};
  var dv = await KV.get('vivoDesc');
  if (!dv){ var iv = await carregaImg(URL.createObjectURL(vivo)), rv = await descritores(iv); if (!rv.length) return {ok: false, msg: 'Não consegui ler sua selfie ao vivo. Tire uma nova selfie.'}; dv = Array.from(rv[0].descriptor); await KV.set('vivoDesc', dv); }
  var rs = await descritores(foto);
  if (!rs.length) return {ok: false, msg: '🙂 Não achei um rosto nessa foto. Escolha uma foto em que seu rosto apareça bem, de frente.'};
  var best = null, dist = 9; rs.forEach(function(r){ var d = faceapi.euclideanDistance(dv, r.descriptor); if (d < dist){ dist = d; best = r; } });
  if (dist > 0.5) return {ok: false, dist: dist, msg: '🙈 Essa foto não parece ser você (o rosto não bateu com a sua selfie ao vivo). No CenaSua só vale o seu próprio rosto. Escolha uma foto sua ou use a selfie.'};
  return {ok: true, dist: dist, box: best.detection.box};
};
$('bGaleria').onclick = function(){ $('fGal').value = ''; $('fGal').click(); };
$('fGal').onchange = async function(){
  var f = this.files && this.files[0]; if (!f) return;
  var s = espera('🔎 Conferindo se a foto é sua…');
  try {
    var img = await carregaImg(URL.createObjectURL(f));
    var r = await CK.confereGaleria(img);
    if (s.cancelado) return;
    if (!r.ok){ fechaEspera(); confirmaSair(function(){}, {icone: '🙈', titulo: 'Foto não aceita', texto: r.msg, sim: 'Entendi', nao: 'Fechar'}); return; }
    var b = r.box, lado = Math.max(b.width, b.height) * 2.4, W = img.naturalWidth, H = img.naturalHeight, cw = Math.min(W, lado), ch = Math.min(H, lado * 1.25);
    var x0 = Math.max(0, Math.min(W - cw, b.x + b.width / 2 - cw / 2)), y0 = Math.max(0, Math.min(H - ch, b.y + b.height / 2 - ch / 2));
    var c = document.createElement('canvas'), k = Math.min(1, 720 / cw); c.width = Math.round(cw * k); c.height = Math.round(ch * k); c.getContext('2d').drawImage(img, x0, y0, cw, ch, 0, 0, c.width, c.height);
    var blob = await new Promise(function(rr){ c.toBlob(rr, 'image/jpeg', 0.92); }), im2 = await carregaImg(URL.createObjectURL(blob)), q = await CK.pontos(im2);
    if (!q){ fechaEspera(); alert('Não consegui marcar o rosto nessa foto. Tente outra foto de frente.'); return; }
    await KV.set('fonte', blob); await KV.set('fontePts', q.pts); await carregaEu(); fechaEspera(); inicio();
  } catch (e) { fechaEspera(); alert('Não deu para conferir a foto agora (precisa de internet na 1ª vez). ' + e.message); }
};

/* ---------- categorias e modelos ---------- */
var LM = null; async function lm(){ if (!LM) LM = await (await fetch('cenas/lm.json')).json(); return LM; }
function abreCat(id){
  var c = CK.CATS.filter(function(x){ return x.id == id; })[0]; mostra('tCat');
  $('catNome').textContent = c.emo + ' ' + c.nome;
  $('catDesc').innerHTML = c.serie ? '<div class="card"><h2>📺 Série: ' + esc(c.serie) + '</h2><p>3 episódios. Faça um por um e poste em sequência!</p></div>' : '';
  $('lModelos').innerHTML = c.modelos.map(function(m){ return '<div class="modelo" data-m="' + m.id + '"><img loading="lazy" src="cenas/' + m.cenas[0].img + '_' + EU.gen + '.jpg" alt=""><div><b>' + esc(m.nome) + '</b><small>' + m.cenas.length + (m.cenas.length > 1 ? ' cenas' : ' cena') + ' · ' + esc(m.cenas[0].leg) + '</small></div></div>'; }).join('');
  document.querySelectorAll('#lModelos .modelo').forEach(function(d){ d.onclick = function(){ abreModelo(d.dataset.m); }; });
}

/* ---------- montagem ---------- */
var CR = null; /* {titulo, sub, emo, ep, meme, mus, estilo, cenas:[{c, pts, leg, fala}], modeloId} */
async function abreModelo(id){
  var M = CK.modelo(id), s = espera('🎭 Colocando seu rosto nas cenas…');
  try {
    var L = await lm(); await CK.carregaRosto(function(m){ esperaMsg(m); });
    var cenas = [];
    for (var i = 0; i < M.m.cenas.length; i++){
      if (s.cancelado) return;
      esperaMsg('🎭 Colocando seu rosto na cena ' + (i + 1) + ' de ' + M.m.cenas.length + '…', (i + 0.5) / M.m.cenas.length);
      var cc = M.m.cenas[i], nome = cc.img + '_' + EU.gen, im = await carregaImg('cenas/' + nome + '.jpg');
      await new Promise(function(r){ setTimeout(r, 30); });
      var cv = CK.trocaRosto(im, L[nome], EU.fonte, EU.pts, {estilo: M.cat.estilo || ''});
      cenas.push({c: cv, pts: L[nome], leg: cc.leg, fala: cc.fala});
    }
    CR = {modeloId: id, titulo: M.m.nome, sub: M.cat.serie ? M.cat.serie : M.cat.nome, emo: M.cat.emo, ep: M.m.ep, meme: !!M.cat.meme, mus: M.m.mus, estilo: M.cat.estilo || '', cenas: cenas};
    fechaEspera(); abreCriar();
  } catch (e) { fechaEspera(); alert('Não deu para montar a cena: ' + e.message); }
}
var VOZ = {tipo: 'ia', timbre: '', gravado: null};
function abreCriar(){
  mostra('tCriar'); $('crNome').textContent = CR.emo + ' ' + CR.titulo; $('crErro').innerHTML = '';
  var box = $('crCenas'); box.innerHTML = '';
  CR.cenas.forEach(function(c){ var f = CK.fotoFinal(c.c, c.leg, CR.meme); f.style.height = '260px'; box.appendChild(f); });
  var tem = CR.cenas.some(function(c){ return c.fala; });
  VOZ.gravado = null; $('gravInfo').innerHTML = '';
  if (!tem && VOZ.tipo == 'ia') VOZ.tipo = 'nada';
  var vs = CK.VOZES[EU.gen]; if (!VOZ.timbre || !vs.some(function(v){ return v.id == VOZ.timbre; })) VOZ.timbre = vs[0].id;
  $('chTimbre').innerHTML = vs.map(function(v){ return '<span class="chip' + (v.id == VOZ.timbre ? ' on' : '') + '" data-t="' + v.id + '">🗣️ ' + v.nome + '</span>'; }).join('');
  document.querySelectorAll('#chTimbre .chip').forEach(function(c){ c.onclick = function(){ VOZ.timbre = c.dataset.t; abreCriarVoz(); }; });
  abreCriarVoz();
}
function abreCriarVoz(){
  document.querySelectorAll('#chVoz .chip').forEach(function(c){ c.classList.toggle('on', c.dataset.v == VOZ.tipo); });
  document.querySelectorAll('#chTimbre .chip').forEach(function(c){ c.classList.toggle('on', c.dataset.t == VOZ.timbre); });
  $('vozIA').style.display = VOZ.tipo == 'ia' ? 'block' : 'none';
  $('vozMinha').style.display = VOZ.tipo == 'minha' ? 'block' : 'none';
  $('falasLer').innerHTML = CR.cenas.map(function(c, i){ return '<div class="fala"><b>Cena ' + (i + 1) + ':</b> ' + esc(c.fala) + '</div>'; }).join('');
  $('falasEdit').innerHTML = VOZ.tipo == 'ia' ? '<p style="margin-top:10px"><b>Falas</b> (pode mudar):</p>' + CR.cenas.map(function(c, i){ return '<input type="text" class="inFala" data-i="' + i + '" maxlength="120" value="' + esc(c.fala) + '" style="margin:4px 0">'; }).join('') : '';
  document.querySelectorAll('.inFala').forEach(function(inp){ inp.onchange = function(){ var t = inp.value.trim(), f = CK.filtro(t || 'fala ok aqui'); if (!f.ok && f.tipo != 'curto'){ alert(f.msg); inp.value = CR.cenas[+inp.dataset.i].fala; return; } CR.cenas[+inp.dataset.i].fala = t; }; });
}
document.querySelectorAll('#chVoz .chip').forEach(function(c){ c.onclick = function(){ VOZ.tipo = c.dataset.v; abreCriarVoz(); }; });
var grav = null;
$('bGravar').onclick = async function(){
  if (grav){ var blob = await grav.para(); grav = null; $('bGravar').textContent = '🎤 Gravar de novo'; $('bGravar').className = 'bt verde grande';
    try { var ctx = new AudioContext(), buf = await ctx.decodeAudioData(await blob.arrayBuffer()); ctx.close();
      VOZ.gravado = {buf: buf, trechos: CK.cortaFala(buf.getChannelData(0), buf.sampleRate, CR.cenas.map(function(c){ return c.fala; }))};
      $('gravInfo').innerHTML = '<p>✅ Voz gravada (' + buf.duration.toFixed(1) + ' s). Agora é só fazer o vídeo!</p>'; } catch (e) { $('gravInfo').innerHTML = '<div class="erro">Não consegui ler a gravação. Tente de novo.</div>'; }
    return; }
  try { grav = await CK.gravaVoz(); $('bGravar').textContent = '⏹️ Parar a gravação'; $('bGravar').className = 'bt verm grande'; $('gravInfo').innerHTML = '<p>🔴 Gravando… leia as falas com calma.</p>'; }
  catch (e) { $('gravInfo').innerHTML = '<div class="erro">Permita o microfone para gravar sua voz.</div>'; }
};
$('bFotos').onclick = async function(){
  var arqs = [];
  for (var i = 0; i < CR.cenas.length; i++){ var f = CK.fotoFinal(CR.cenas[i].c, CR.cenas[i].leg, CR.meme), b = await new Promise(function(r){ f.toBlob(r, 'image/jpeg', 0.9); }); arqs.push(new File([b], 'cenasua-' + (i + 1) + '.jpg', {type: 'image/jpeg'})); }
  if (navigator.canShare && navigator.canShare({files: arqs})){ try { await navigator.share({files: arqs, text: 'Feito com IA no CenaSua 🎬 ' + CK.LINK}); return; } catch (e) { if (e.name == 'AbortError') return; } }
  arqs.forEach(function(a){ baixa(a, a.name); });
};
function baixa(blob, nome){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); }, 1000); }

$('bFazer').onclick = async function(){
  $('crErro').innerHTML = '';
  var s = espera('🎬 Preparando seu vídeo…'), voz = null;
  try {
    if (VOZ.tipo == 'ia' && CR.cenas.some(function(c){ return c.fala; })){
      var ctx = new AudioContext();
      try { voz = await CK.falaIA(ctx, CR.cenas.map(function(c){ return c.fala || '…'; }), VOZ.timbre, CR.mus, function(m){ esperaMsg(m); }, s); }
      catch (e) {
        if (s.cancelado) return;
        var porque = e.message == 'sem-chave' ? 'A voz da IA precisa da chave do Gemini (em ⚙️ Ajustes).' : e.message == 'limite' ? 'A voz grátis da IA está no limite agora (por minuto ou do dia).' : 'A voz da IA não respondeu (' + e.message + ').';
        fechaEspera();
        var segue = await new Promise(function(r){ confirmaSair(function(){ r(true); }, {icone: '🎙️', titulo: 'Sem voz da IA agora', texto: porque + ' Quer fazer o vídeo só com música? (Ou volte e escolha “Minha voz”.)', sim: 'Fazer só com música', nao: 'Voltar'}); var t = setInterval(function(){ if (!confirmaSair.aberto()){ clearInterval(t); r(false); } }, 300); });
        if (!segue) return;
        s = espera('🎬 Fazendo o vídeo só com música…');
      }
      try { ctx.close(); } catch (e2) {}
    } else if (VOZ.tipo == 'minha'){
      if (!VOZ.gravado){ fechaEspera(); $('crErro').innerHTML = '<div class="erro">Grave sua voz primeiro (botão 🎤) ou escolha outra opção.</div>'; return; }
      voz = VOZ.gravado;
    }
    esperaMsg('🎬 Gravando o vídeo… deixe o app aberto', 0);
    var r = await CK.fazVideo(CR.cenas, {titulo: CR.titulo, sub: CR.sub, emo: CR.emo, ep: CR.ep, meme: CR.meme, mus: CR.mus, voz: voz, sinal: s, avisa: function(p, T){ esperaMsg('🎬 Gravando o vídeo… ' + Math.round(p * 100) + '% (deixe o app aberto)', p); }});
    fechaEspera();
    var item = {id: 'v' + Date.now(), titulo: CR.titulo, data: Date.now(), blob: r.blob, tipo: r.tipo, modelo: CR.modeloId};
    await salvaVideo(item); abreResultado(item);
  } catch (e) { fechaEspera(); if (e.message == 'cancelado') return; $('crErro').innerHTML = '<div class="erro">O vídeo não ficou pronto (' + esc(e.message) + '). Tente de novo com o app aberto na tela.</div>'; }
};

/* ---------- vídeos salvos (só no aparelho, os 6 últimos) ---------- */
async function salvaVideo(it){ var todos = await tx('videos', 'readonly', function(s){ return s.getAll(); }); todos.sort(function(a, b){ return b.data - a.data; }); var sobra = todos.slice(5); await tx('videos', 'readwrite', function(s){ sobra.forEach(function(v){ s.delete(v.id); }); s.put(it); }); }
async function listaVideos(){
  var todos = []; try { todos = await tx('videos', 'readonly', function(s){ return s.getAll(); }); } catch (e) {}
  todos.sort(function(a, b){ return b.data - a.data; });
  var el = $('lVideos'); if (!todos.length){ el.innerHTML = '<p>Nenhum vídeo ainda.</p>'; return; }
  el.innerHTML = ''; todos.forEach(function(v){ var d = document.createElement('div'); d.className = 'vid';
    d.innerHTML = '<video muted playsinline preload="metadata"></video><div class="t"><b>' + esc(v.titulo) + '</b><br><small>' + new Date(v.data).toLocaleString('pt-BR') + '</small></div><button class="bt peq verde">▶️</button><button class="bt peq cinza">🗑️</button>';
    d.querySelector('video').src = URL.createObjectURL(v.blob);
    var bs = d.querySelectorAll('button'); bs[0].onclick = function(){ abreResultado(v); };
    bs[1].onclick = function(){ confirmaSair(async function(){ await tx('videos', 'readwrite', function(s){ s.delete(v.id); }); listaVideos(); }, {icone: '🗑️', titulo: 'Apagar este vídeo?', texto: 'Ele sai só deste celular.', sim: 'Sim, apagar', nao: 'Cancelar'}); };
    el.appendChild(d); });
}
var ATUAL = null;
function abreResultado(it){
  ATUAL = it; mostra('tRes'); $('vRes').src = URL.createObjectURL(it.blob);
  var M = it.modelo ? CK.modelo(it.modelo) : null, prox = M && M.m.ep && M.m.ep < 3 ? 'mini_ep' + (M.m.ep + 1) : '';
  $('bProxEp').style.display = prox ? 'block' : 'none'; $('bProxEp').onclick = function(){ abreModelo(prox); };
}
function nomeArq(it){ return 'cenasua-' + new Date(it.data).toISOString().slice(0, 10) + (/mp4/.test(it.tipo) ? '.mp4' : '.webm'); }
$('bZap').onclick = async function(){
  var f = new File([ATUAL.blob], nomeArq(ATUAL), {type: ATUAL.tipo}), txt = 'Olha eu nessa cena! 😂🎬 (feito com IA no CenaSua) ' + CK.LINK;
  if (navigator.canShare && navigator.canShare({files: [f]})){ try { await navigator.share({files: [f], text: txt}); return; } catch (e) { if (e.name == 'AbortError') return; } }
  baixa(f, f.name);
  setTimeout(function(){ location.href = 'https://wa.me/?text=' + encodeURIComponent(txt); }, 800);
  alert('O vídeo foi salvo no celular. No WhatsApp, toque no 📎 e escolha o vídeo da galeria.');
};
$('bBaixar').onclick = function(){ baixa(ATUAL.blob, nomeArq(ATUAL)); };
$('bOutro').onclick = inicio;

/* ---------- descreva sua cena ---------- */
var EST_DESC = '';
$('bDescreva').onclick = function(){ mostra('tDesc'); $('dsErro').innerHTML = ''; };
document.querySelectorAll('#chEst .chip').forEach(function(c){ c.onclick = function(){ EST_DESC = c.dataset.e; document.querySelectorAll('#chEst .chip').forEach(function(x){ x.classList.toggle('on', x === c); }); }; });
var GEM_TEXTO = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite'];
async function iaTexto(txt, sinal2){
  var key = await CK.chave(); if (!key) return null;
  var pr = 'Você é o moderador e roteirista do app de diversão CenaSua. O usuário quer colocar o PRÓPRIO rosto como personagem principal numa cena criada por IA. Pedido: "' + txt + '".\n' +
    'Regras: recuse (ok=false) se citar pessoa real, famoso, político, ator, influenciador ou qualquer pessoa identificável; obra real (filme, série, novela, desenho, anime, jogo, personagem, marca, logo, time); conteúdo sexual ou nudez; violência explícita; golpe, fraude ou se passar por alguém; humilhar ou ofender outras pessoas. ' +
    'Se ok, escreva: prompt_en (descrição da cena em inglês para gerar imagem, personagens fictícios, sem nomes, o personagem principal olhando para a câmera, rosto visível, roupa normal); legenda (frase curta e divertida em português, máx 60 letras); fala (o que o personagem fala, em português, primeira pessoa, máx 90 letras). Se não ok, motivo em português simples e gentil.';
  var corpo = JSON.stringify({contents: [{parts: [{text: pr}]}], generationConfig: {responseMimeType: 'application/json', responseSchema: {type: 'OBJECT', properties: {ok: {type: 'BOOLEAN'}, motivo: {type: 'STRING'}, prompt_en: {type: 'STRING'}, legenda: {type: 'STRING'}, fala: {type: 'STRING'}}, required: ['ok']}}});
  for (var i = 0; i < GEM_TEXTO.length; i++){
    var r = await CK.pedeGemini('https://generativelanguage.googleapis.com/v1beta/models/' + GEM_TEXTO[i] + ':generateContent?key=' + encodeURIComponent(key), corpo, 25000, sinal2);
    if (r.status != 200) continue;
    try { return JSON.parse(r.j.candidates[0].content.parts[0].text); } catch (e) {}
  }
  return null;
}
var SUF = {'': 'photorealistic cinematic film still, natural light', desenho: 'flat 2D TV sitcom cartoon style, thick clean outlines, bright flat colors, natural human skin tones, original characters', anime: '1990s action anime style, cel shading, original character, energy effects'};
async function geraImagemCena(prompt, sinal2){
  var key = await CK.chave();
  if (key && !sessionStorage.getItem('ck_semimg')){
    esperaMsg('🎨 A IA está desenhando a cena…');
    var corpo = JSON.stringify({contents: [{parts: [{text: prompt + '. Vertical 9:16 image.'}]}], generationConfig: {responseModalities: ['IMAGE', 'TEXT']}});
    var r = await CK.pedeGemini('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=' + encodeURIComponent(key), corpo, 40000, sinal2);
    if (r.status == 200){ try { var p = r.j.candidates[0].content.parts.filter(function(x){ return x.inlineData; })[0]; if (p) return await carregaImg('data:' + p.inlineData.mimeType + ';base64,' + p.inlineData.data); } catch (e) {} }
    else if (r.status == 429 || r.status == 403 || r.status == 400) sessionStorage.setItem('ck_semimg', '1');
  }
  /* reserva grátis: Pollinations (sem chave, ~1 imagem a cada 45 s por internet) */
  for (var t = 0; t < 4; t++){
    if (sinal2.cancelado) throw new Error('cancelado');
    esperaMsg('🎨 A IA grátis está desenhando a cena… (tentativa ' + (t + 1) + ' de 4)');
    var url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt.slice(0, 900)) + '?width=576&height=1024&nologo=true&safe=true&seed=' + Math.floor(Math.random() * 1e6);
    try {
      var ctl = new AbortController(), to = setTimeout(function(){ ctl.abort(); }, 90000);
      var resp = await fetch(url, {signal: ctl.signal}); clearTimeout(to);
      if (resp.ok && /image/.test(resp.headers.get('content-type') || '')){ var bl = await resp.blob(); return await carregaImg(URL.createObjectURL(bl)); }
    } catch (e) {}
    if (t < 3) await CK.espera(46000, function(s2){ esperaMsg('⏳ O desenhista grátis está ocupado. Tentando de novo em ' + s2 + ' s…'); }, sinal2);
  }
  throw new Error('sem-imagem');
}
$('bCriarDesc').onclick = async function(){
  var txt = $('txDesc').value.trim(), f = CK.filtro(txt);
  $('dsErro').innerHTML = '';
  if (!f.ok){ $('dsErro').innerHTML = '<div class="erro">' + esc(f.msg) + '</div>'; return; }
  var s = espera('🤖 Lendo sua ideia…');
  try {
    var ia = null; try { ia = await iaTexto(txt, s); } catch (e) { if (e.message == 'cancelado') return; }
    if (ia && ia.ok === false){ fechaEspera(); $('dsErro').innerHTML = '<div class="erro">' + esc(ia.motivo || 'Esse pedido não segue as regras do CenaSua.') + '</div>'; return; }
    var quem = EU.gen == 'f' ? 'the main character is a Brazilian woman' : 'the main character is a Brazilian man';
    var base = (ia && ia.prompt_en) ? ia.prompt_en : txt;
    var prompt = base + ', ' + quem + ', fully clothed, ' + SUF[EST_DESC] + ', the main character looks straight at the camera, face clearly visible, frontal, eyes open, mouth closed, head and shoulders in the upper half, vertical portrait, fictional people only, no text, no logos';
    var cena = null, pts = null;
    for (var k = 0; k < 2 && !pts; k++){
      var img = await geraImagemCena(prompt, s);
      var c = document.createElement('canvas'); c.width = 720; c.height = 1280; var x = c.getContext('2d');
      var r = Math.max(720 / img.naturalWidth, 1280 / img.naturalHeight), w = img.naturalWidth * r, h = img.naturalHeight * r; x.drawImage(img, (720 - w) / 2, (1280 - h) / 2, w, h);
      esperaMsg('🔎 Procurando o rosto do personagem…');
      var q = await CK.pontos(c); if (q){ pts = q.pts; cena = c; }
    }
    if (!pts){ fechaEspera(); $('dsErro').innerHTML = '<div class="erro">A IA desenhou a cena, mas o rosto do personagem não ficou bem visível. Tente descrever de outro jeito (ex.: “olhando para a câmera”) ou escolha uma cena pronta.</div>'; return; }
    esperaMsg('🎭 Colocando seu rosto na cena…');
    var cv = CK.trocaRosto(cena, pts, EU.fonte, EU.pts, {estilo: EST_DESC});
    var leg = (ia && ia.legenda) || (txt.length > 60 ? txt.slice(0, 57) + '…' : txt), fala = (ia && ia.fala) || '';
    CR = {modeloId: '', titulo: 'Minha cena', sub: 'Cena criada por você', emo: '✍️', ep: 0, meme: false, mus: EST_DESC == 'anime' ? 'anime' : EST_DESC == 'desenho' ? 'sitcom' : 'drama', estilo: EST_DESC, cenas: [{c: cv, pts: pts, leg: leg, fala: fala}]};
    if (!fala) VOZ.tipo = 'nada';
    fechaEspera(); abreCriar();
  } catch (e) { fechaEspera(); if (e.message == 'cancelado') return; $('dsErro').innerHTML = '<div class="erro">' + (e.message == 'sem-imagem' ? 'O desenhista grátis de IA está muito ocupado agora. Tente daqui a alguns minutos ou escolha uma cena pronta.' : 'Não deu para criar agora: ' + esc(e.message)) + '</div>'; }
};

/* ---------- ajustes ---------- */
async function ajustes(){
  $('ajChave').textContent = 'Verificando…';
  var k = await CK.chave();
  $('ajChave').innerHTML = k ? '✅ IA ligada neste celular.' : '⚪ IA desligada. As cenas prontas funcionam normalmente.';
}
$('bSalvaChave').onclick = function(){ var v = $('inChave').value.trim(); if (v.length < 20){ alert('Essa chave parece incompleta.'); return; } localStorage.setItem('ck_chave', v); $('inChave').value = ''; ajustes(); };
$('bTiraChave').onclick = function(){ localStorage.removeItem('ck_chave'); ajustes(); };
$('bEntrar').onclick = async function(){ try { await CK.entrarDono(); ajustes(); } catch (e) { alert('Não deu para entrar: ' + (e.message || e)); } };
$('bApagar').onclick = function(){ confirmaSair(async function(){ ['vivo', 'vivoPts', 'vivoDesc', 'fonte', 'fontePts', 'vivoEm'].forEach(function(k){ KV.del(k); }); await tx('videos', 'readwrite', function(s){ s.clear(); }); EU.fonte = null; inicio(); }, {icone: '🗑️', titulo: 'Apagar tudo?', texto: 'Sua selfie e seus vídeos serão apagados deste celular.', sim: 'Sim, apagar', nao: 'Cancelar'}); };

/* ---------- começo ---------- */
desenhaCats();
carregaEu().catch(function(){}).then(function(){ inicio(); setTimeout(function(){ var a = $('abertura'); a.style.opacity = 0; setTimeout(function(){ a.remove(); }, 500); }, TESTE ? 50 : 2300); });
if ('serviceWorker' in navigator && !TESTE) navigator.serviceWorker.register('sw.js').catch(function(){});
if (TESTE) window.CKT = {KV: KV, carregaEu: carregaEu, abreModelo: abreModelo, inicio: inicio, VOZ: VOZ, get CR(){ return CR; }};
})();
