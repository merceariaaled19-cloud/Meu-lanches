/* voltar-pergunta.js — Versão 2 (2026-11-26). Botão Voltar do celular / controle da TV:
   - dentro de uma janela ou subtela: volta para a tela anterior (não pergunta);
   - na tela inicial do app: pergunta "Quer mesmo sair?" (Sim, sair / Cancelar, Cancelar com foco).
   Precisa de confirma-sair.js antes. Uma cópia igual em cada pasta de app (fonte: shared/).
   Uso: <script src="confirma-sair.js?v=1"></script><script src="voltar-pergunta.js?v=2" data-nome="Meu App"></script>
   Ganchos opcionais (definir antes ou depois do script):
     window.voltarDentro = function(){ return true se voltou para uma tela anterior dentro do app; false se está na tela inicial };
     window.voltarDesligado = function(){ return true para não fazer nada agora (ex.: app tem Voltar próprio nesta tela) };
   Sem voltarDentro: procura uma janela/tela aberta com botão visível "Voltar", "Fechar", "Cancelar", "✕", "←" e toca nele.
   data-pular-ua="Texto": não liga quando o navegador tem esse texto no userAgent (APK nativo com Voltar próprio).
   data-abas="nav button": abas do app; Voltar numa aba que não é a primeira volta para a primeira.
   Botões com data-voltar-ignora não são tocados; elemento com data-voltar="1" é o preferido. */
(function(){
  if (window.__voltarPergunta) return; window.__voltarPergunta = 2;
  if (!window.history || !history.pushState) return;
  var sc = document.currentScript || {}, ds = sc.dataset || {};
  var NOME = ds.nome || document.title || 'o app';
  /* data-pular-ua="TelaOkeTV": dentro do APK nativo que já cuida do Voltar, não faz nada */
  if (ds.pularUa && navigator.userAgent.indexOf(ds.pularUa) >= 0) return;
  var armado = false, saindo = false, ultimo = 0;
  function arma(){ if (armado || saindo) return; try { history.pushState({vpGuard: Date.now()}, ''); armado = true; } catch(e){} }
  ['pointerdown','touchstart','keydown','click'].forEach(function(t){ window.addEventListener(t, arma, true); });
  arma();

  function visivel(el){
    if (!el || !el.getClientRects || !el.getClientRects().length) return false;
    var r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return false;
    for (var e = el; e && e.nodeType === 1; e = e.parentElement){
      var s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    }
    return true;
  }
  var PALAVRA = /^(voltar|fechar|cancelar|ok, fechar)(\s*\(esc\))?$|^voltar\b|^(←|⬅|⇠|‹|«|◀|◂|🔙|↩)/i;
  var SIMBOLO = /^(✕|×|✖|❌|x|X)$/;
  var PERIGO = /splice|tira[A-Z(]|remov|apag|exclu|delet|limpa[A-Z(]|cancelarVenda|cancelarFeita|fecharCaixa|confirm\(|logout|signOut|confirmaSair|sair/i;
  var NAO = /sair|logout|excluir|apagar|deslogar|desconectar|caixa|venda|\?/i;
  function camada(el){ /* janela por cima: ancestral fixo e maior z-index */
    var z = 0, fixo = false;
    for (var e = el; e && e.nodeType === 1 && e !== document.body; e = e.parentElement){
      var s = getComputedStyle(e);
      if (s.position === 'fixed') fixo = true;
      var zi = parseInt(s.zIndex, 10); if (!isNaN(zi) && zi > z && s.position !== 'static') z = zi;
    }
    return (fixo ? 100000 : 0) + z;
  }
  function serve(el){
    if (el.closest && (el.closest('#cfsFundo') || el.closest('[data-voltar-ignora]'))) return false;
    if (el.disabled) return false;
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    var oc = el.getAttribute('onclick') || '', id = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '');
    var al = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    if (PERIGO.test(oc) || NAO.test(t)) return false;
    var ok = PALAVRA.test(t) || /^(fechar|voltar)$/i.test(al) ||
      (SIMBOLO.test(t) && (/fech|close|volt|(^|[^a-z])x([^a-z]|$)/i.test(id + ' ' + oc) || /^(fechar|voltar)$/i.test(al)));
    if (!ok) return false;
    if (el.tagName === 'A'){ var h = el.getAttribute('href') || ''; if (h && h.charAt(0) !== '#' && h.indexOf('javascript:') !== 0) return false; }
    return visivel(el);
  }
  function voltaGenerico(){
    var pref = document.querySelectorAll('[data-voltar="1"]');
    for (var i = 0; i < pref.length; i++) if (visivel(pref[i])) { pref[i].click(); return true; }
    var els = document.querySelectorAll('button,a,[role=button],[onclick],.fecha,.fechar,.close,.btn-voltar,.voltar');
    var melhor = null, mz = -1;
    for (var j = 0; j < els.length; j++){
      var el = els[j];
      if (!serve(el)) continue;
      var z = camada(el);
      if (z > mz){ mz = z; melhor = el; }
    }
    if (melhor){ melhor.click(); return true; }
    return voltaAba();
  }
  /* data-abas="nav button": se a aba aberta não é a primeira, volta para a primeira (tela inicial) */
  function voltaAba(){
    if (!ds.abas) return false;
    var bts = [].filter.call(document.querySelectorAll(ds.abas), visivel);
    if (bts.length < 2) return false;
    var at = null;
    for (var i = 0; i < bts.length; i++){
      var c = typeof bts[i].className === 'string' ? bts[i].className : '';
      if (/(^|\s)(on|at|ativo|ativa|active|sel|selecionad[oa])(\s|$)/.test(c) || bts[i].getAttribute('aria-selected') === 'true'){ at = bts[i]; break; }
    }
    if (at && at !== bts[0]){ bts[0].click(); return true; }
    return false;
  }
  window.voltaAba = voltaAba;
  window.voltaGenerico = voltaGenerico;

  function toast(msg){
    var d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;left:50%;bottom:9%;transform:translateX(-50%);z-index:2147483601;background:rgba(20,20,20,.92);color:#fff;padding:14px 20px;border-radius:14px;font:700 18px system-ui,sans-serif;max-width:88%;text-align:center';
    document.body.appendChild(d); setTimeout(function(){ d.parentNode && d.parentNode.removeChild(d); }, 3500);
  }
  window.sairApp = function(){
    saindo = 1;
    try { window.close(); } catch(e){}
    setTimeout(function(){ try { history.back(); } catch(e){} }, 60); /* tira a trava; o popstate dela volta mais 1 */
    setTimeout(function(){
      if (document.visibilityState === 'hidden') return;
      /* ainda aqui (app instalado na primeira tela): sem trava, o próximo Voltar fecha */
      toast('Aperte Voltar de novo para fechar');
      setTimeout(function(){ saindo = false; armado = false; }, 3500);
    }, 900);
  };

  function aoVoltar(){
    if (window.voltarDesligado && window.voltarDesligado()) return;
    if (window.confirmaSair && confirmaSair.aberto()) { confirmaSair.cancelar(); return; }
    try { if (window.voltarDentro ? window.voltarDentro() : voltaGenerico()) return; } catch(e){}
    if (!window.confirmaSair) return;
    confirmaSair(function(){ window.sairApp(); }, {titulo: 'Quer mesmo sair?', texto: 'Toque em "Sim, sair" para fechar o ' + NOME + ' ou em "Cancelar" para continuar.'});
  }
  window.voltarPergunta = aoVoltar;
  window.addEventListener('popstate', function(){
    if (saindo === 1){ saindo = 2; setTimeout(function(){ try { history.back(); } catch(e){} }, 40); return; }
    if (saindo) return;
    armado = false;
    if (window.voltarDesligado && window.voltarDesligado()) return; /* o app cuida do Voltar nesta tela */
    arma();
    aoVoltar();
  });
  /* TV smart pelo navegador (LG webOS 461, Samsung Tizen 10009): tecla Voltar não muda o histórico */
  document.addEventListener('keydown', function(ev){
    var k = ev.keyCode;
    if (k !== 461 && k !== 10009 && ev.key !== 'GoBack' && ev.key !== 'BrowserBack') return;
    if (window.confirmaSair && confirmaSair.aberto()) return; /* confirma-sair.js trata (Cancelar) */
    var a = Date.now(); if (a - ultimo < 250) return; ultimo = a;
    ev.preventDefault(); ev.stopPropagation();
    aoVoltar();
  }, true);
})();
