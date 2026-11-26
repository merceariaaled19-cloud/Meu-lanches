/* confirma-sair.js — pergunta "Quer mesmo sair?" antes de sair (pedido do Alex, 2026-11-25).
   Uso: confirmaSair(function(){ ...sai de verdade... }, {titulo:'Quer mesmo sair?', texto:'...'});
   Celular: toque. TV/controle: setas trocam o botão, OK confirma, Voltar/Esc = Cancelar (Cancelar já vem com foco).
   Cópia igual em cada app (assim funciona offline e dentro do APK). Versão 1. */
(function(){
  if (window.confirmaSair) return;
  var box = null, aoSim = null, focoAntes = null;
  function css(){
    if (document.getElementById('cfsCss')) return;
    var s = document.createElement('style'); s.id = 'cfsCss';
    s.textContent =
      '#cfsFundo{position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:18px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-tap-highlight-color:transparent;animation:cfsIn .15s ease-out}' +
      '#cfsCaixa{background:#fff;color:#1b1b1b;border-radius:22px;max-width:460px;width:100%;padding:26px 22px 22px;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.5);animation:cfsPop .18s ease-out}' +
      '#cfsCaixa .cfsIco{font-size:54px;line-height:1;margin-bottom:8px}' +
      '#cfsCaixa h2{margin:0 0 8px;font-size:28px;font-weight:800;line-height:1.2;color:#1b1b1b}' +
      '#cfsCaixa p{margin:0 0 18px;font-size:19px;line-height:1.35;color:#444}' +
      '#cfsCaixa .cfsBts{display:flex;gap:12px;flex-wrap:wrap}' +
      '#cfsCaixa button{flex:1 1 150px;min-height:62px;border:0;border-radius:16px;font-size:22px;font-weight:800;cursor:pointer;outline:none;transition:transform .1s,box-shadow .1s;font-family:inherit}' +
      '#cfsCaixa .cfsNao{background:#e8eef5;color:#1b1b1b}' +
      '#cfsCaixa .cfsSim{background:#d83a3a;color:#fff}' +
      '#cfsCaixa button:focus,#cfsCaixa button:focus-visible{box-shadow:0 0 0 5px #ffd400,0 0 0 8px #1b1b1b;transform:scale(1.04)}' +
      '#cfsCaixa button:active{transform:scale(.97)}' +
      '@keyframes cfsIn{from{opacity:0}to{opacity:1}}@keyframes cfsPop{from{transform:scale(.9);opacity:0}to{transform:none;opacity:1}}';
    (document.head || document.documentElement).appendChild(s);
  }
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function fecha(){
    if (!box) return;
    document.removeEventListener('keydown', tecla, true);
    box.parentNode && box.parentNode.removeChild(box); box = null; aoSim = null;
  }
  function cancelar(){
    if (!box) return false;
    var f = focoAntes; fecha();
    try { if (f && f.focus) f.focus(); } catch (e) {}
    return true;
  }
  function sim(){
    var fn = aoSim; fecha();
    if (fn) try { fn(); } catch (e) { setTimeout(function(){ throw e; }); }
  }
  function tecla(ev){
    if (!box) return;
    var k = ev.keyCode, bts = box.querySelectorAll('button'), at = document.activeElement;
    var parar = function(){ ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); };
    if (k === 27 || k === 8 || k === 461 || k === 10009 || k === 4 || ev.key === 'GoBack' || ev.key === 'BrowserBack') { parar(); cancelar(); return; }
    if (k >= 37 && k <= 40) { parar(); (at === bts[0] ? bts[1] : bts[0]).focus(); return; }
    if (k === 13 || k === 23 || k === 32) { parar(); (at === bts[1] ? bts[1] : bts[0]).click(); return; }
    if (k === 9) { parar(); (at === bts[0] ? bts[1] : bts[0]).focus(); return; }
    parar(); /* nada mais chega ao app enquanto a pergunta está aberta */
  }
  window.confirmaSair = function(onSim, o){
    o = o || {}; css(); if (box) fecha();
    focoAntes = document.activeElement; aoSim = onSim;
    box = document.createElement('div'); box.id = 'cfsFundo';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div id="cfsCaixa"><div class="cfsIco">' + (o.icone || '🚪') + '</div>' +
      '<h2>' + esc(o.titulo || 'Quer mesmo sair?') + '</h2>' +
      (o.texto === '' ? '' : '<p>' + esc(o.texto || 'Toque em "Sim, sair" para sair ou em "Cancelar" para continuar aqui.') + '</p>') +
      '<div class="cfsBts"><button type="button" class="cfsNao ' + (o.classe || '') + '">' + esc(o.nao || 'Cancelar') + '</button>' +
      '<button type="button" class="cfsSim ' + (o.classe || '') + '">' + esc(o.sim || 'Sim, sair') + '</button></div></div>';
    box.addEventListener('click', function(ev){ if (ev.target === box) cancelar(); });
    box.querySelector('.cfsNao').onclick = function(ev){ ev.stopPropagation(); cancelar(); };
    box.querySelector('.cfsSim').onclick = function(ev){ ev.stopPropagation(); sim(); };
    document.body.appendChild(box);
    document.addEventListener('keydown', tecla, true);
    var n = box.querySelector('.cfsNao'); n.focus(); setTimeout(function(){ if (box) n.focus(); }, 40);
    return false;
  };
  window.confirmaSair.aberto = function(){ return !!box; };
  window.confirmaSair.cancelar = cancelar;
})();
