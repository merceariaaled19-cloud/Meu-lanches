/* Botão Voltar do celular: dentro de uma tela volta para a anterior; na tela inicial pergunta "Quer mesmo sair?".
   Mesmo jeito do Oferta Okê (voltar-pergunta.js) + gancho window.voltarDentro() do CenaSua. */
(function(){
  if (!window.history || !history.pushState) return;
  var armado = false, saindo = false;
  function arma(){ if (armado || saindo) return; try { history.pushState({ckGuard: Date.now()}, ''); armado = true; } catch(e){} }
  ['pointerdown','touchstart','keydown','click'].forEach(function(t){ window.addEventListener(t, arma, true); });
  arma();
  window.sairApp = function(){
    saindo = true;
    try { window.close(); } catch(e){}
    setTimeout(function(){ history.go(-(history.length - 1)); }, 150);
    setTimeout(function(){ try { window.close(); } catch(e){} }, 600);
  };
  window.addEventListener('popstate', function(){
    if (saindo) return;
    armado = false;
    if (window.confirmaSair && confirmaSair.aberto()) { confirmaSair.cancelar(); arma(); return; }
    arma();
    if (window.voltarDentro && window.voltarDentro()) return;
    if (!window.confirmaSair) return;
    confirmaSair(function(){ window.sairApp(); }, {titulo: 'Quer mesmo sair?', texto: 'Toque em "Sim, sair" para fechar o CenaSua ou em "Cancelar" para continuar.'});
  });
})();
