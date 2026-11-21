/* ELO Karaokê TV - ajustes injetados pelo app (atualiza sozinho) */
(function(){
 if(window.__eloTV)return;window.__eloTV=1;
 var css=document.createElement('style');
 css.textContent='*{text-shadow:none!important;transition:none!important;animation:none!important}#statusMic{display:none!important}'+
 '[id*="netlify"],[class*="netlify"],[id^="nf-"],[class^="nf-"]{display:none!important}'+
 '#eloQtd{padding:12px;border-radius:10px;border:2px solid #ffaa00;background:#000;color:#fff;font-size:16px;font-weight:bold}#eloQtd:focus{outline:4px solid #ffaa00}';
 document.head.appendChild(css);
 function tiraNetlify(){var a=document.querySelectorAll('body > *');for(var i=0;i<a.length;i++){var e=a[i];if(e.id==='topo'||e.id==='layout'||e.tagName==='SCRIPT'||e.tagName==='STYLE')continue;var t=(e.innerText||'')+(e.shadowRoot?'netlify':'');if(/netlify/i.test(t)||/netlify/i.test(e.outerHTML.slice(0,300)))e.style.display='none';}}
 setInterval(tiraNetlify,3000);tiraNetlify();

 // botao do microfone so com o icone
 var bm=document.querySelector('button[onclick*="iniciarMic"]');if(bm){bm.textContent='🎤';bm.title='Microfone';bm.style.minWidth='56px';}
 var tv=document.getElementById('tv-aviso');if(tv)tv.style.setProperty('display','none','important');
 // busca mais firme no controle remoto
 var inp=document.getElementById('busca'),fb=document.getElementById('form-busca');
 function faz(){try{if(inp)inp.blur();buscar();var l=document.getElementById('lista');if(l)l.scrollTop=0;}catch(x){}}
 if(fb){var bb=fb.querySelector('button');if(bb){bb.type='button';bb.onclick=function(e){e.preventDefault();faz();};}}
 if(inp){inp.setAttribute('enterkeyhint','search');inp.addEventListener('keydown',function(e){if(e.key==='Enter'||e.keyCode===13||e.keyCode===66){e.preventDefault();faz();}});
  inp.addEventListener('focus',function(){try{inp.select();}catch(x){}});}
 // quantas musicas tocar em sequencia
 var QTD=parseInt(localStorage.eloQtd||'1',10),tocadas=0,auto=false;
 var sel=document.createElement('select');sel.id='eloQtd';sel.title='Quantas músicas tocar seguidas';
 [['1','🎵 1 música'],['3','🎵 3 músicas'],['5','🎵 5 músicas'],['10','🎵 10 músicas'],['99','🎵 Todas da lista']].forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];if(+o[0]===QTD)op.selected=true;sel.appendChild(op);});
 sel.onchange=function(){QTD=parseInt(sel.value,10);localStorage.eloQtd=QTD;tocadas=0;};
 var topo=document.getElementById('topo');if(topo)topo.appendChild(sel);
 var orig=window.tocar;
 if(orig){window.tocar=function(i){if(!auto)tocadas=0;auto=false;return orig(i);};}
 function liga(){
  if(typeof player==='undefined'||!player||!player.addEventListener){return setTimeout(liga,1000);}
  try{player.addEventListener('onStateChange',function(e){
   var d=e&&e.data!==undefined?e.data:e;
   if(d===0){tocadas++;if(tocadas<QTD&&typeof atual==='number'&&typeof resultados!=='undefined'&&atual+1<resultados.length){auto=true;setTimeout(function(){window.tocar(atual+1);},1500);}}
  });}catch(x){}
  try{player.setPlaybackQuality&&player.setPlaybackQuality('medium');}catch(x){}
 }
 liga();
})();
