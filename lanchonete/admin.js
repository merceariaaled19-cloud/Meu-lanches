/* Meu Lanche Pro — painel do administrador */
var LOJAS = [], FILTRO = 'pendente', unA = null;
function msg(t){ $('msg').textContent = t; }
$('bG').onclick = function(){ var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt: 'select_account'}); au.signInWithPopup(p).catch(function(e){ if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') au.signInWithRedirect(p); else msg('Não entrou: ' + e.code); }); };
$('bE').onclick = function(){ au.signInWithEmailAndPassword($('em').value.trim(), $('se').value).catch(function(e){ msg('Não entrou: ' + e.code); }); };
$('sair').onclick = function(){ au.signOut(); };
au.getRedirectResult().catch(function(){});
au.onAuthStateChanged(function(u){
  if (unA){ unA(); unA = null; }
  var adm = u && ADMINS.indexOf((u.email || '').toLowerCase()) >= 0;
  $('login').style.display = adm ? 'none' : 'block'; $('app').style.display = adm ? 'block' : 'none'; $('sair').style.display = u ? 'block' : 'none';
  if (u && !adm) msg('A conta ' + u.email + ' não é de administrador. Saia e entre com a conta certa.');
  if (adm) inicia();
});
function inicia(){
  db.collection('ml_config').doc('geral').get().then(function(d){ var c = d.exists ? d.data() : {}; if (!$('geminiKey').value) $('geminiKey').value = c.geminiKey || ''; $('gMod').value = c.geminiModelo || ''; $('gMsg').textContent = c.geminiKey ? '✅ Chave salva.' : '⚠️ Sem chave: os donos só conseguem cadastrar lanches na mão.'; });
  unA = db.collection('ml_lojas').onSnapshot(function(s){
    LOJAS = s.docs.map(function(d){ var x = d.data(); x.id = d.id; x.t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : 0; return x; });
    LOJAS.sort(function(a, b){ return b.t - a.t; }); desenha();
  }, function(e){ $('lista').innerHTML = '<div class="aviso no">Erro: ' + esc(e.code) + '</div>'; });
}
$('gSalva').onclick = function(){
  db.collection('ml_config').doc('geral').set({geminiKey: $('geminiKey').value.trim(), geminiModelo: $('gMod').value.trim(), atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()}, {merge: true})
    .then(function(){ $('gMsg').textContent = '✅ Chave salva.'; toast('Salvo!'); }, function(e){ $('gMsg').textContent = 'Erro: ' + e.code; });
};
$('gTesta').onclick = function(){
  var k = $('geminiKey').value.trim(); if (!k) return ($('gMsg').textContent = 'Cole a chave primeiro.');
  $('gMsg').textContent = 'Testando…';
  fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=' + encodeURIComponent(k)).then(function(r){ return r.json().then(function(j){ return {st: r.status, j: j}; }); }).then(function(x){
    if (x.st !== 200) return ($('gMsg').textContent = '❌ Chave não funcionou (' + x.st + '): ' + ((x.j.error && x.j.error.message) || ''));
    var fl = (x.j.models || []).map(function(m){ return m.name.replace('models/', ''); }).filter(function(n){ return /flash/.test(n) && !/tts|audio|image|live|embedding/.test(n); });
    $('gMsg').textContent = '✅ Chave funcionando. Modelos rápidos disponíveis: ' + fl.slice(0, 8).join(', ');
  }).catch(function(){ $('gMsg').textContent = 'Sem internet.'; });
};
function situacao(x){
  var ven = x.validade && x.validade.toDate && x.validade.toDate() < new Date();
  if (x.status === 'liberado' && ven) return ['vencido', 'Vencida', 'no'];
  if (x.status === 'liberado') return ['liberado', 'Liberada', 'ok'];
  if (x.status === 'bloqueado') return ['bloqueado', 'Bloqueada', 'no'];
  return ['pendente', 'Esperando', 'esp'];
}
function desenha(){
  var cont = {pendente: 0, liberado: 0, bloq: 0};
  LOJAS.forEach(function(x){ var s = situacao(x)[0]; if (s === 'pendente') cont.pendente++; else if (s === 'liberado') cont.liberado++; else cont.bloq++; });
  $('tP').textContent = cont.pendente; $('tL').textContent = cont.liberado; $('tB').textContent = cont.bloq;
  $('filtros').innerHTML = [['pendente', 'Esperando'], ['liberado', 'Liberadas'], ['bloq', 'Bloqueadas'], ['todas', 'Todas']].map(function(f){ return '<label class="' + (FILTRO === f[0] ? 'on' : '') + '" onclick="FILTRO=\'' + f[0] + '\';desenha()">' + f[1] + '</label>'; }).join('');
  var b = $('bus').value.trim().toLowerCase();
  var l = LOJAS.filter(function(x){
    var s = situacao(x)[0];
    if (FILTRO === 'pendente' && s !== 'pendente') return false;
    if (FILTRO === 'liberado' && s !== 'liberado') return false;
    if (FILTRO === 'bloq' && (s === 'pendente' || s === 'liberado')) return false;
    return !b || [x.nome, x.dono, x.email, x.zap, x.slug].join(' ').toLowerCase().indexOf(b) >= 0;
  });
  var h = l.length ? '' : '<div class="vazio">Nada por aqui.</div>';
  l.forEach(function(x){
    var s = situacao(x), val = x.validade && x.validade.toDate ? x.validade.toDate() : null;
    h += '<div class="itemadm" style="flex-wrap:wrap">' + (x.logo ? '<img src="' + x.logo + '">' : '<div class="semft">🍔</div>') +
      '<div class="tx"><b>' + esc(x.nome) + ' <span class="tag ' + s[2] + '">' + s[1] + '</span></b><div class="sub">' + esc(x.dono || '') + ' • ' + esc(x.email || '') + '<br>📱 ' + esc(x.zap || '') + (x.t ? ' • cadastro ' + new Date(x.t).toLocaleDateString('pt-BR') : '') +
      (s[0] === 'liberado' || s[0] === 'vencido' ? '<br>Validade: ' + (val ? val.toLocaleDateString('pt-BR') : 'sem prazo') : '') + '</div></div>' +
      '<div class="row" style="flex-basis:100%;margin-top:6px">' +
      '<button class="mini" onclick="libera(\'' + x.id + '\')">✅ ' + (s[0] === 'liberado' ? 'Renovar' : 'Liberar') + '</button>' +
      (s[0] !== 'bloqueado' ? '<button class="mini btr" onclick="bloqueia(\'' + x.id + '\')">🔒 Bloquear</button>' : '') +
      '<button class="mini btz" onclick="avisa(\'' + x.id + '\')">💬 WhatsApp</button>' +
      '<a class="bt mini bt3" target="_blank" href="' + esc(linkLoja(x.slug)) + '">👀 Loja</a></div></div>';
  });
  $('lista').innerHTML = h;
}
$('bus').oninput = desenha;
function acha(id){ return LOJAS.filter(function(x){ return x.id === id; })[0]; }
function libera(id){
  var x = acha(id); if (!x) return;
  $('modal').innerHTML = '<div class="fundo" onclick="if(event.target===this)fechaM()"><div class="folha"><button class="fecha" onclick="fechaM()">✕</button><h2>Liberar ' + esc(x.nome) + '</h2><p class="sub">Por quanto tempo?</p>' +
    [[7, 'Teste 7 dias'], [30, '30 dias'], [90, '3 meses'], [180, '6 meses'], [365, '1 ano'], [0, 'Sem prazo']].map(function(o){ return '<button class="full" style="margin:5px 0" onclick="confirmaLib(\'' + id + '\',' + o[0] + ')">' + o[1] + '</button>'; }).join('') + '</div></div>';
}
function fechaM(){ $('modal').innerHTML = ''; }
function confirmaLib(id, dias){
  var x = acha(id), base = Date.now();
  if (x && x.status === 'liberado' && x.validade && x.validade.toMillis && x.validade.toMillis() > base) base = x.validade.toMillis();
  var val = dias ? firebase.firestore.Timestamp.fromMillis(base + dias * 864e5) : null;
  db.collection('ml_lojas').doc(id).update({status: 'liberado', validade: val, liberadoEm: firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    fechaM(); toast('Liberada! ✅');
    if (confirm('Mandar aviso no WhatsApp do dono?')) avisa(id, true, val);
  }, function(e){ toast('Erro: ' + e.code, 4000); });
}
function bloqueia(id){ var x = acha(id); if (x && confirm('Bloquear ' + x.nome + '? A loja sai do ar e o dono não acessa o painel.')) db.collection('ml_lojas').doc(id).update({status: 'bloqueado'}).then(function(){ toast('Bloqueada'); }, function(e){ toast('Erro: ' + e.code); }); }
function avisa(id, lib, val){
  var x = acha(id); if (!x) return;
  var t = lib ? 'Olá, ' + (x.dono || '').split(' ')[0] + '! Seu acesso ao Meu Lanche foi liberado' + (val ? ' até ' + val.toDate().toLocaleDateString('pt-BR') : '') + '. 🎉 Entre em ' + BASE_URL + ' com seu e-mail e senha para montar seu cardápio. O link da sua loja é: ' + linkLoja(x.slug)
    : 'Olá, ' + (x.dono || '').split(' ')[0] + '! Aqui é do Meu Lanche, sobre a lanchonete ' + x.nome + '.';
  abreZap(x.zap, t);
}
