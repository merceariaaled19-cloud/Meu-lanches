/* Botão Voltar do celular: pergunta "Quer mesmo sair?" antes de fechar o app. */
(function(){
  if (!window.history || !history.pushState) return;
  var armado = false, saindo = false;
  function arma(){ if (armado || saindo) return; try { history.pushState({okGuard: Date.now()}, ''); armado = true; } catch(e){} }
  ['pointerdown','touchstart','keydown','click'].forEach(function(t){ window.addEventListener(t, arma, true); });
  arma();
  window.addEventListener('popstate', function(){
    if (saindo) return;
    armado = false;
    if (window.confirmaSair && confirmaSair.aberto()) { confirmaSair.cancelar(); arma(); return; }
    arma();
    if (!window.confirmaSair) return;
    confirmaSair(function(){
      saindo = true;
      history.go(-2);
      setTimeout(function(){ try { window.close(); } catch(e){} }, 400);
    }, {titulo: 'Quer mesmo sair?', texto: 'Toque em "Sim, sair" para fechar o Oferta Okê ou em "Cancelar" para continuar.'});
  });
})();
