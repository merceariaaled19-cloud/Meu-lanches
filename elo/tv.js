/* Busca só karaokê: acrescenta 'karaoke' e tira vídeo normal */
(function(){if(window.__tkKF)return;window.__tkKF=1;var of=window.fetch;if(!of)return;var KR=/karaok|videok|playback|sing ?along|cante junto|com letra/i;
 window.fetch=function(u,o){try{var s=typeof u==='string'?u:(u&&u.url)||'';if(s.indexOf('/api/buscar')>=0){var m=s.match(/[?&]q=([^&]*)/);if(m){var q=decodeURIComponent(m[1].replace(/\+/g,' '));if(!/karaok/i.test(q)){q+=' karaoke';s=s.replace(m[0],m[0].charAt(0)+'q='+encodeURIComponent(q));}}
  return of.call(window,s,o).then(function(r){if(!r.ok)return r;return r.clone().json().then(function(j){if(j&&j.videos)j.videos=j.videos.filter(function(v){return KR.test((v.titulo||'')+' '+(v.canal||''))});return new Response(JSON.stringify(j),{status:200,headers:{'Content-Type':'application/json'}});}).catch(function(){return r});});}}catch(e){}return of.apply(window,arguments);};})();
/* Licença TudoOkê TV: código do painel, preso ao ID do box */
(function(){
 if(window.__tkLic)return;window.__tkLic=1;
 var P='pdv-mercadinho-1c882',K='AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM';
 var BASE='https://firestore.googleapis.com/v1/projects/'+P+'/databases/(default)/documents';
 var ID='';try{if(window.TKApp&&TKApp.id)ID=String(TKApp.id()||'');}catch(e){}if(!ID){try{ID=localStorage.tkDevId||(localStorage.tkDevId='TV'+Date.now().toString(36)+Math.random().toString(36).slice(2,8));}catch(e){}}
 var IDC=ID?ID.slice(-8).toUpperCase():'';
 var ov=document.createElement('div');ov.id='tkLic';
 var st=document.createElement('style');st.textContent='#tkLic{position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:2147483000;background:radial-gradient(circle at 50% 40%,#3a0f73,#0b0418 75%);color:#fff;display:none;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:2vh;font-family:Arial,sans-serif;text-align:center}#tkLic h1{font-size:5vmin;margin:0;color:#ffd54a}#tkLic p{font-size:3vmin;margin:.6vmin;opacity:.9;max-width:80%}#tkLic input{font-size:5vmin;width:50vmin;text-align:center;letter-spacing:1vmin;padding:1.2vmin;border-radius:2vmin;border:3px solid #ff3fa4;background:#1a0636;color:#fff;text-transform:uppercase;margin:1vmin}#tkLic button{font-size:3.6vmin;padding:1.5vmin 5vmin;border-radius:2vmin;border:0;background:#ff3fa4;color:#fff;font-weight:bold}#tkLic button:focus,#tkLic input:focus{outline:4px solid #ffd54a}#tkLic .e{color:#ff8a8a;min-height:4vmin}#tkLic .id{margin-top:1vmin;font-size:2.6vmin;opacity:.7}#tkAviso{position:fixed;left:2vmin;bottom:2vmin;z-index:9400;background:#ff3fa4;color:#fff;padding:1vmin 2vmin;border-radius:1.5vmin;font:bold 2.4vmin Arial}';
 document.head.appendChild(st);document.body.appendChild(ov);
 function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
 function pausa(){try{document.querySelectorAll('video,audio').forEach(function(v){v.pause()});}catch(e){}try{if(window.player&&player.pauseVideo)player.pauseVideo();}catch(e){}try{document.querySelectorAll('iframe').forEach(function(f){f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}','*')});}catch(e){}}
 var pt;
 function trava(msg,podeCod){ov.innerHTML='';ov.style.display='flex';ov.appendChild(el('h1','','🎤 TudoOkê TV'));ov.appendChild(el('p','',msg));var er=el('p','e','');
  if(podeCod){var i=el('input');i.id='tkLicCod';i.maxLength=11;i.placeholder='CÓDIGO';var b=el('button','','Ativar');
   function vai(){var c=i.value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length<6){er.textContent='Digite o código completo';return;}er.textContent='Ativando...';ativa(c,er);}
   b.onclick=vai;b.tabIndex=0;i.tabIndex=0;i.onclick=function(){i.focus()};i.onkeydown=function(e){e.stopPropagation();if(e.keyCode==13){e.preventDefault();vai();}};ov.appendChild(i);ov.appendChild(b);setTimeout(function(){i.focus()},300);}
  ov.appendChild(er);ov.appendChild(el('div','id',IDC?'ID do aparelho: '+IDC:''));
  if(podeCod){var LK='https://merceariaaled19-cloud.github.io/Meu-lanches/tudooke-tv/assinar.html',qw=el('div','',null);qw.style.cssText='display:flex;align-items:center;gap:2vmin;margin-top:1.5vmin;background:#1a0636;padding:1.2vmin 2vmin;border-radius:2vmin';var qi=document.createElement('img');qi.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data='+encodeURIComponent(LK);qi.style.cssText='width:16vmin;height:16vmin;border-radius:1vmin;background:#fff';var qt=el('div','',null);qt.style.cssText='text-align:left;font-size:2.6vmin;max-width:50vmin';qt.innerHTML='<b style="color:#ffd54a">Não tem código ou venceu?</b><br>Aponte a câmera do celular: teste grátis e planos pelo Pix. O código chega na hora em que o pagamento for confirmado.';qw.appendChild(qi);qw.appendChild(qt);ov.appendChild(qw);}
  if(podeCod){var dica=el('p','','Use as setas do controle ou o mouse. OK abre o teclado.');dica.style.fontSize='2.4vmin';dica.style.opacity='.7';ov.appendChild(dica);
   if(!window.__tkLk){window.__tkLk=1;document.addEventListener('keydown',function(e){if(ov.style.display=='none'||(window.confirmaSair&&confirmaSair.aberto&&confirmaSair.aberto()))return;var I=document.getElementById('tkLicCod'),B=ov.querySelector('button');if(!I)return;var k=e.keyCode,a=document.activeElement;
    if(!ov.contains(a)){e.preventDefault();e.stopPropagation();I.focus();return;}
    if(k==40||(k==39&&a!==I)){e.preventDefault();e.stopPropagation();B.focus();}else if(k==38||(k==37&&a===B)){e.preventDefault();e.stopPropagation();I.focus();}
    else if((k==13||k==23)&&a===B){e.preventDefault();e.stopPropagation();B.click();}},true);
    setInterval(function(){if(ov.style.display=='none')return;var I=document.getElementById('tkLicCod');if(I&&!ov.contains(document.activeElement))I.focus();},1000);}}pausa();clearInterval(pt);pt=setInterval(pausa,1500);}
 function libera(exp){ov.style.display='none';clearInterval(pt);try{localStorage.tkExp=String(exp);}catch(e){}
  var d=Math.ceil((exp-AG())/864e5),dt=new Date(exp),z=function(n){return(n<10?'0':'')+n},ds=z(dt.getDate())+'/'+z(dt.getMonth()+1)+'/'+dt.getFullYear();var a=el('div','',null);a.id='tkAviso';a.textContent='✅ Licença ativa até '+ds+' • falta'+(d==1?' 1 dia':'m '+d+' dias');if(d>5)a.style.background='#16a34a';document.body.appendChild(a);setTimeout(function(){a.style.transition='opacity 1s';a.style.opacity=0;setTimeout(function(){a.remove()},1000)},d<=5?20000:10000);}
 function campos(j){var f=j.fields||{};return{dev:(f.device&&f.device.stringValue)||'',dias:+((f.dias&&(f.dias.integerValue||f.dias.doubleValue))||0),at:f.ativadoEm&&f.ativadoEm.timestampValue?ts(f.ativadoEm.timestampValue):0};}
 function ts(t){var m=String(t||'').match(/(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/);return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6]):0;}
 var OFF=0;try{OFF=+(localStorage.tkOff||0)||0;}catch(e){}function AG(){return Date.now()+OFF;}
 function pega(c){return fetch(BASE+':batchGet?key='+K,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({documents:['projects/'+P+'/databases/(default)/documents/licencas/'+c]})}).then(function(r){if(!r.ok)throw new Error('rede');return r.json();}).then(function(j){var x=j&&j[0]||{};var rt=ts(x.readTime);if(rt){OFF=rt-Date.now();try{localStorage.tkOff=String(OFF)}catch(e){}}return x.found?campos(x.found):null;});}
 function confere(l,c,er){if(!l){if(er)er.textContent='Código não existe';else{try{localStorage.removeItem('tkLic')}catch(e){}trava('Licença não encontrada. Digite um código novo.',true);}return;}
  if(l.dev&&l.dev!==ID){if(er)er.textContent='Esse código já está em uso em outro aparelho';else{try{localStorage.removeItem('tkLic')}catch(e){}trava('Esse código está ligado a outro aparelho. Digite um código novo.',true);}return;}
  var exp=l.at+l.dias*864e5;if(l.at&&AG()>exp){trava('Sua licença venceu. Renove pelo celular e digite o código novo.',true);return;}
  try{localStorage.tkLic=c;}catch(e){}libera(exp);}
 function ativa(c,er){pega(c).then(function(l){if(!l||l.dev){confere(l,c,er);return;}
   return fetch(BASE+':commit?key='+K,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({writes:[{update:{name:'projects/'+P+'/databases/(default)/documents/licencas/'+c,fields:{device:{stringValue:ID}}},updateMask:{fieldPaths:['device']},updateTransforms:[{fieldPath:'ativadoEm',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:true}}]})})
   .then(function(r){if(!r.ok)throw new Error('neg');return pega(c);}).then(function(l2){confere(l2,c,er);});
  }).catch(function(){er.textContent='Não deu pra ativar. Confira a internet e o código.';});}
 if(!ID){trava('Atualize o TudoOkê TV para a versão nova para continuar.',false);return;}
 var cod='';try{cod=localStorage.tkLic||'';}catch(e){}
 if(!cod){trava('Digite o código de ativação que você recebeu.',true);return;}
 pega(cod).then(function(l){confere(l,cod,null);}).catch(function(){var e=+(localStorage.tkExp||0);if(e>AG())libera(e);else trava('Sem internet para conferir a licença. Conecte e abra de novo.',false);});
})();
/* TudoOkê TV - visual, abertura, QR da galera e nota final (injetado pelo app, atualiza sozinho) */
(function(){
 if(window.__tkTV)return;window.__tkTV=1;
 var $=function(i){return document.getElementById(i)};
 var PHONE='https://merceariaaled19-cloud.github.io/Meu-lanches/tudooke-tv/celular.html';
 var css=document.createElement('style');
 css.textContent=[
 'body{background:radial-gradient(circle at 70% 20%,#2a0a55,#0b0418 70%)!important;font-family:Arial,sans-serif}',
 '#topo{background:linear-gradient(90deg,#1a0636,#2b0a4f)!important;border-bottom:3px solid #ff3fa4!important}',
 '#topo:before{content:"🎤 TudoOkê";font-weight:900;font-size:22px;color:#fff;margin-right:8px;white-space:nowrap}',
 '#topo input{border-color:#7c3aed!important;background:#12052a!important}',
 '.btn{background:#ff3fa4!important;color:#fff!important}',
 'button[onclick*="iniciarMic"]{background:#7c3aed!important;min-width:56px}',
 '#lista{background:rgba(20,6,40,.85)!important;border-right:2px solid #3b1a6e!important}',
 '.item{background:#1e0b3d!important;border:1px solid #3b1a6e}.item.ativo,.item:focus{background:#4a1d8a!important;border-color:#ff3fa4}',
 '#letra-box{background:linear-gradient(#0b0418,#2a0a55)!important;color:#ffd54a;text-shadow:none!important}',
 '#placar{background:#14062b!important;border-top:3px solid #ff3fa4!important}.score{color:#ffd54a!important}',
 '#voz-fill{background:linear-gradient(90deg,#7c3aed,#ff3fa4)!important}',
 '#statusMic,#tv-aviso{display:none!important}',
 '[id*="netlify"],[class*="netlify"],[id^="nf-"],[class^="nf-"]{display:none!important}',
 '.item,.btn,#voz-fill{transition:none!important}',
 '#eloQtd{padding:12px;border-radius:10px;border:2px solid #ffd54a;background:#12052a;color:#fff;font-size:16px;font-weight:bold}#eloQtd:focus{outline:4px solid #ffd54a}',
 /* abertura */
 '#tkIntro{position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:99999;background:radial-gradient(circle at 50% 45%,#5b1aa8,#14002b 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;transition:opacity .6s}',
 '#tkIntro.sai{opacity:0}',
 '#tkMic{font-size:30vmin;animation:tkMic 1.2s ease-in-out infinite alternate}@keyframes tkMic{0%{transform:rotate(-14deg)}100%{transform:rotate(14deg) translateY(-18px) scale(1.08)}}',
 '#tkTit{font-size:13vmin;font-weight:900;color:#fff;letter-spacing:2px;transform:scale(0);animation:tkTit .8s .8s cubic-bezier(.2,1.6,.4,1) forwards}@keyframes tkTit{to{transform:scale(1)}}',
 '#tkSub{color:#ffd54a;font-size:4.5vmin;opacity:0;animation:tkSub .6s 1.6s forwards}@keyframes tkSub{to{opacity:1}}',
 '.tkLuz{position:absolute;top:-10%;width:30vw;height:130%;background:linear-gradient(transparent,rgba(255,63,164,.25),transparent);transform-origin:top;animation:tkLuz 2.4s ease-in-out infinite alternate}@keyframes tkLuz{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}',
 /* QR e recados */
 '#player{width:calc(100% - 132px)!important}#player-area{background:#0b0418!important}#tkQR{position:absolute;top:8px;right:6px;z-index:20;background:#fff;border-radius:10px;padding:5px;text-align:center;color:#2a0a55;font:bold 11px Arial;width:118px}',
 '#tkQR img{width:108px;height:108px;display:block}',
 '#tkFeed{position:absolute;left:10px;top:10px;right:140px;z-index:21;display:flex;flex-direction:column;gap:6px;max-width:60%;pointer-events:none}',
 '.tkMsg{background:rgba(20,6,40,.88);border:2px solid #ff3fa4;color:#fff;padding:6px 12px;border-radius:16px;font-size:20px;font-weight:bold;transition:opacity .8s}',
 '.tkMsg b{color:#ffd54a}',
 '.tkFig{position:absolute;z-index:22;font-size:64px;pointer-events:none;transition:transform 3s linear,opacity 3s}',
 '#tkCont{position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:9500;background:radial-gradient(circle at 50% 45%,#5b1aa8,#14002b 72%);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}#tkCont .t{font-size:4vmin;color:#ffd54a;font-weight:bold;letter-spacing:.4vmin}#tkCont .q{font-size:10vmin;font-weight:900;margin:1vmin 0}#tkCont .m{font-size:3.6vmin;opacity:.85;max-width:80%}#tkCont .n{font-size:22vmin;font-weight:900;color:#ff3fa4;line-height:1.1}',
 '#tkFila{position:absolute;top:190px;right:6px;width:120px;z-index:20;background:rgba(20,6,40,.9);border:1px solid #ff3fa4;border-radius:10px;padding:5px;color:#fff;font:11px Arial;display:none}#tkFila b{color:#ffd54a;display:block;margin-bottom:3px}#tkFila div{margin-bottom:3px;line-height:1.2}',
 '#tkVoto{position:absolute;top:150px;right:6px;width:120px;text-align:center;z-index:20;background:rgba(20,6,40,.88);color:#ffd54a;border-radius:10px;padding:4px 8px;font:bold 14px Arial;display:none}',
 /* nota final */
 '#tkFinal{position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:9000;background:rgba(11,4,24,.92);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}',
 '#tkFinal .n{font-size:22vmin;font-weight:900;color:#ffd54a;line-height:1}',
 '#tkFinal .e{font-size:9vmin;letter-spacing:6px}#tkFinal .t{font-size:5vmin;font-weight:bold}#tkFinal .d{font-size:3vmin;opacity:.8;margin-top:10px}'
 ].join('\n');
 document.head.appendChild(css);

 /* abertura animada */
 if(!sessionStorage.tkIntro){sessionStorage.tkIntro=1;
  var it=document.createElement('div');it.id='tkIntro';
  it.innerHTML='<div class="tkLuz" style="left:5%"></div><div class="tkLuz" style="right:5%;animation-delay:1.2s"></div><div id="tkMic">🎤</div><div id="tkTit">TudoOkê</div><div id="tkSub">Karaokê com nota</div>';
  document.body.appendChild(it);
  var fim=function(){it.className='sai';setTimeout(function(){it.remove()},700)};
  setTimeout(fim,3800);it.onclick=fim;document.addEventListener('keydown',function k(){fim();document.removeEventListener('keydown',k)});
 }

 var lb=$('letra-box');if(lb&&/ELO/i.test(lb.innerText))lb.innerText='TudoOkê - Escolha uma música';
 document.title='TudoOkê TV';
 var bm=document.querySelector('button[onclick*="iniciarMic"]');if(bm){bm.textContent='🎤';bm.title='Microfone';}
 function tiraNetlify(){var a=document.querySelectorAll('body > *');for(var i=0;i<a.length;i++){var e=a[i];if(/^(topo|layout|tkIntro|tkFinal)$/.test(e.id)||e.tagName==='SCRIPT'||e.tagName==='STYLE')continue;if(/netlify/i.test(e.innerText||'')||/netlify/i.test(e.outerHTML.slice(0,300))||e.shadowRoot)e.style.display='none';}}
 setInterval(tiraNetlify,3000);tiraNetlify();

 /* busca firme no controle */
 var inp=$('busca'),fb=$('form-busca');
 function faz(){try{if(inp)inp.blur();buscar();var l=$('lista');if(l)l.scrollTop=0;}catch(x){}}
 if(fb){var bb=fb.querySelector('button');if(bb){bb.type='button';bb.onclick=function(e){e.preventDefault();faz();};}}
 if(inp){inp.addEventListener('keydown',function(e){if(e.key==='Enter'||e.keyCode===13||e.keyCode===66){e.preventDefault();faz();}});}

 /* quantas musicas seguidas */
 var QTD=parseInt(localStorage.eloQtd||'1',10),tocadas=0,auto=false;
 var sel=document.createElement('select');sel.id='eloQtd';
 [['1','🎵 1 música'],['3','🎵 3 músicas'],['5','🎵 5 músicas'],['10','🎵 10 músicas'],['99','🎵 Todas']].forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];if(+o[0]===QTD)op.selected=true;sel.appendChild(op);});
 sel.onchange=function(){QTD=parseInt(sel.value,10);localStorage.eloQtd=QTD;tocadas=0;};
 /* seletor de quantidade removido a pedido (fila pelo celular) */QTD=1;

 /* medidor de voz proprio (nota 0-100) */
 var amostras=0,cantando=0,somaForca=0,votos=[];
 function zera(){amostras=0;cantando=0;somaForca=0;votos=[];mostraVoto();}
 setInterval(function(){
  try{if(typeof micAtivo==='undefined'||!micAtivo||typeof analyser==='undefined'||!analyser)return;
   if(!(typeof player!=='undefined'&&player&&player.getPlayerState&&player.getPlayerState()==1))return;
   var d=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(d);
   var m=0;for(var i=0;i<d.length;i++)m+=d[i];m/=d.length;
   amostras++;if(m>18){cantando++;somaForca+=Math.min(m,90);}
  }catch(x){}
 },250);
 /* liga o microfone sozinho se o box tiver um */
 try{navigator.mediaDevices.enumerateDevices().then(function(l){if(l.some(function(d){return d.kind==='audioinput'})&&typeof iniciarMic==='function'){var a=window.alert;window.alert=function(){};iniciarMic().then(function(){window.alert=a},function(){window.alert=a});}});}catch(x){}

 var orig=window.tocar;
 if(orig){window.tocar=function(i){if(!auto)tocadas=0;auto=false;zera();return orig(i);};}

 /* nota final */
 var fin=document.createElement('div');fin.id='tkFinal';document.body.appendChild(fin);
 function notaFinal(cb){
  var voz=null;
  if(amostras>20){var pres=cantando/amostras,forca=cantando?somaForca/cantando/90:0;voz=Math.round(Math.min(100,40+pres*45+forca*15));}
  var gal=null;if(votos.length){var s=0;votos.forEach(function(v){s+=v});gal=Math.round(s/votos.length*20);}
  var n=voz!==null&&gal!==null?Math.round(voz*.7+gal*.3):(voz!==null?voz:gal);
  if(n===null){cb();return;}
  var est=n>=90?'⭐⭐⭐⭐⭐':n>=75?'⭐⭐⭐⭐':n>=60?'⭐⭐⭐':n>=45?'⭐⭐':'⭐';
  var t=n>=90?'ARRASOU! 🔥':n>=75?'Mandou bem! 👏':n>=60?'Boa! 🎶':'Bora treinar! 😅';
  var det=[];if(voz!==null)det.push('Voz: '+voz);if(gal!==null)det.push('Galera: '+gal+' ('+votos.length+' voto'+(votos.length>1?'s':'')+')');
  fin.innerHTML='<div class="t">NOTA FINAL</div><div class="n">'+n+'</div><div class="e">'+est+'</div><div class="t">'+t+'</div><div class="d">'+det.join(' • ')+'</div>';
  fin.style.display='flex';envia({t:'nota',v:n});
  var f=function(){fin.style.display='none';document.removeEventListener('keydown',f);cb();};
  setTimeout(f,7000);document.addEventListener('keydown',f);
 }
 function liga(){
  if(typeof player==='undefined'||!player||!player.addEventListener){return setTimeout(liga,1000);}
  try{player.addEventListener('onStateChange',function(e){
   var d=e&&e.data!==undefined?e.data:e;
   if(d===0){tocadas++;notaFinal(function(){
     if(fila.length){var prox=fila.shift();mostraFila();envia({t:'fila',l:fila.map(function(x){return x.titulo+(x.quem?' ('+x.quem+')':'')})});contagem(prox,function(){tocaVideo(prox);});return;}
     if(tocadas<QTD&&typeof atual==='number'&&typeof resultados!=='undefined'&&atual+1<resultados.length){auto=true;window.tocar(atual+1);}
   });}
  });}catch(x){}
 }
 liga();

 /* QR da galera (ntfy.sh) */
 var pa=$('player-area');
 var cod=localStorage.tkCod||(localStorage.tkCod=String(Math.floor(1000+Math.random()*9000)));
 var feed=document.createElement('div');feed.id='tkFeed';
 var vt=document.createElement('div');vt.id='tkVoto';
 if(pa){pa.appendChild(feed);pa.appendChild(vt);}
 function mostraVoto(){if(!votos.length){vt.style.display='none';return;}var s=0;votos.forEach(function(v){s+=v});vt.style.display='block';vt.textContent='⭐ '+(s/votos.length).toFixed(1)+' ('+votos.length+')';}
 var fila=[];
 function tocaVideo(v){resultados.push(v);auto=true;window.tocar(resultados.length-1);}
 var fl=document.createElement('div');fl.id='tkFila';if(pa)pa.appendChild(fl);
 function mostraFila(){if(!fila.length){fl.style.display='none';return;}fl.style.display='block';fl.innerHTML='';var h=document.createElement('b');h.textContent='Próximas ('+fila.length+')';fl.appendChild(h);fila.slice(0,4).forEach(function(v,i){var x=document.createElement('div');x.textContent=(i+1)+'. '+(v.quem?v.quem+': ':'')+v.titulo.slice(0,34);fl.appendChild(x);});}
 var cd=document.createElement('div');cd.id='tkCont';document.body.appendChild(cd);
 function contagem(v,cb){var n=10;function pinta(){cd.innerHTML='';var a=document.createElement('div');a.className='t';a.textContent='PRÓXIMO A CANTAR';var b=document.createElement('div');b.className='q';b.textContent='🎤 '+(v.quem||'Galera');var c=document.createElement('div');c.className='m';c.textContent=v.titulo;var e=document.createElement('div');e.className='n';e.textContent=n;cd.appendChild(a);cd.appendChild(b);cd.appendChild(c);cd.appendChild(e);}
  cd.style.display='flex';pinta();var it=setInterval(function(){n--;if(n<=0){clearInterval(it);cd.style.display='none';cb();}else pinta();},1000);}
 function limpa(t,n){return String(t||'').replace(/\s+/g,' ').slice(0,n)}
 function recado(nome,txt){var m=document.createElement('div');m.className='tkMsg';var b=document.createElement('b');b.textContent=limpa(nome,14)+': ';m.appendChild(b);m.appendChild(document.createTextNode(limpa(txt,70)));feed.appendChild(m);while(feed.children.length>3)feed.firstChild.remove();setTimeout(function(){m.style.opacity=0;setTimeout(function(){m.remove()},900)},8000);}
 var FIGS=['🔥','👏','🎉','🥳','😍','😂','🤮','💩','👍','👎','🎤','⭐','💃','🍻','❤️','👑','🤘','😱'];
 function figura(f){if(FIGS.indexOf(f)<0||!pa)return;var e=document.createElement('div');e.className='tkFig';var im=document.createElement('img');im.src='https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/'+Array.from(f).map(function(c){return c.codePointAt(0).toString(16)}).filter(function(h){return h!='fe0f'}).join('-')+'.png';im.style.width=im.style.height='64px';im.onerror=function(){e.textContent=f};e.appendChild(im);e.style.left=(10+Math.random()*70)+'%';e.style.top='70%';pa.appendChild(e);setTimeout(function(){e.style.transform='translateY(-260px) scale(1.4)';e.style.opacity=0;},50);setTimeout(function(){e.remove()},3200);}
 var TOP='tudooke-'+cod2();
 function cod2(){var c=localStorage.tkSala;if(!c||c.length<6){var ab='abcdefghjkmnpqrstuvwxyz23456789';c='';for(var i=0;i<6;i++)c+=ab[Math.floor(Math.random()*ab.length)];localStorage.tkSala=c;}return c;}
 function envia(o){try{o.de='tv';fetch('https://ntfy.sh/'+TOP,{method:'POST',body:JSON.stringify(o)});}catch(x){}}
 function trata(d){if(!d||typeof d!=='object'||d.de==='tv')return;
  if(d.t==='fig')figura(d.v);
  else if(d.t==='msg')recado(d.n||'Alguém',d.v);
  else if(d.t==='voto'){var v=parseInt(d.v,10);if(v>=1&&v<=5){votos.push(v);mostraVoto();figura('⭐');}}
  else if(d.t==='busca'){var q=limpa(d.q,60);if(!q)return;if(!/karaok/i.test(q))q+=' karaoke';
   fetch('/api/buscar?q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){var l=(j.videos||[]).slice(0,10).map(function(v){return {i:v.id,t:String(v.titulo).slice(0,70),c:String(v.canal||'').slice(0,20),d:v.duracao||''}});envia({t:'lista',para:d.u,l:l});},function(){envia({t:'lista',para:d.u,l:[],erro:1});});}
  else if(d.t==='pedir'){if(!/^[\w-]{6,15}$/.test(d.i||''))return;var v={id:d.i,titulo:limpa(d.tt,90),canal:'',duracao:'',thumb:'https://i.ytimg.com/vi/'+d.i+'/mqdefault.jpg',quem:limpa(d.cantor||d.n,18)};
   var tocando=typeof player!=='undefined'&&player&&player.getPlayerState&&[1,3].indexOf(player.getPlayerState())>=0;
   if(!tocando&&!fila.length){tocaVideo(v);}else{fila.push(v);mostraFila();recado(v.quem||'Alguém','entrou na fila 🎵');}
   envia({t:'fila',l:fila.map(function(x){return x.titulo+(x.quem?' ('+x.quem+')':'')})});}
  else if(d.t==='oi'){envia({t:'ok',musica:(typeof atual==='number'&&typeof resultados!=='undefined'&&resultados[atual])?resultados[atual].titulo:''});}
 }
 var vistos={};
 function ouvir(){
  try{var es=new EventSource('https://ntfy.sh/'+TOP+'/sse');
   es.onopen=function(){var q=$('tkQR');if(q)q.style.outline='4px solid #2ee59d';};
   es.onmessage=function(ev){try{var m=JSON.parse(ev.data);if(m.event!=='message'||vistos[m.id])return;vistos[m.id]=1;trata(JSON.parse(m.message));}catch(x){}};
   es.onerror=function(){var q=$('tkQR');if(q)q.style.outline='4px solid #ff3fa4';};
  }catch(x){}
 }
 function montaQR(){
  if(!pa||$('tkQR'))return;
  var url=PHONE+'?s='+cod2();
  var q=document.createElement('div');q.id='tkQR';
  q.innerHTML='<img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=216x216&margin=4&data='+encodeURIComponent(url)+'"><div>📱 Peça música e mande reações!</div>';
  pa.appendChild(q);
 }
 montaQR();
 ouvir();
})();
