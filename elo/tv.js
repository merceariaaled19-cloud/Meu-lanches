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
 '#tkIntro{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 50% 45%,#5b1aa8,#14002b 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;transition:opacity .6s}',
 '#tkIntro.sai{opacity:0}',
 '#tkMic{font-size:30vmin;animation:tkMic 1.2s ease-in-out infinite alternate}@keyframes tkMic{0%{transform:rotate(-14deg)}100%{transform:rotate(14deg) translateY(-18px) scale(1.08)}}',
 '#tkTit{font-size:13vmin;font-weight:900;color:#fff;letter-spacing:2px;transform:scale(0);animation:tkTit .8s .8s cubic-bezier(.2,1.6,.4,1) forwards}@keyframes tkTit{to{transform:scale(1)}}',
 '#tkSub{color:#ffd54a;font-size:4.5vmin;opacity:0;animation:tkSub .6s 1.6s forwards}@keyframes tkSub{to{opacity:1}}',
 '.tkLuz{position:absolute;top:-10%;width:30vw;height:130%;background:linear-gradient(transparent,rgba(255,63,164,.25),transparent);transform-origin:top;animation:tkLuz 2.4s ease-in-out infinite alternate}@keyframes tkLuz{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}',
 /* QR e recados */
 '#tkQR{position:absolute;top:8px;right:8px;z-index:20;background:#fff;border-radius:10px;padding:5px;text-align:center;color:#2a0a55;font:bold 11px Arial;width:118px}',
 '#tkQR img{width:108px;height:108px;display:block}',
 '#tkFeed{position:absolute;left:10px;bottom:38%;z-index:21;display:flex;flex-direction:column;gap:6px;max-width:60%;pointer-events:none}',
 '.tkMsg{background:rgba(20,6,40,.88);border:2px solid #ff3fa4;color:#fff;padding:6px 12px;border-radius:16px;font-size:20px;font-weight:bold;transition:opacity .8s}',
 '.tkMsg b{color:#ffd54a}',
 '.tkFig{position:absolute;z-index:22;font-size:64px;pointer-events:none;transition:transform 3s linear,opacity 3s}',
 '#tkVoto{position:absolute;top:140px;right:8px;z-index:20;background:rgba(20,6,40,.88);color:#ffd54a;border-radius:10px;padding:4px 8px;font:bold 14px Arial;display:none}',
 /* nota final */
 '#tkFinal{position:fixed;inset:0;z-index:9000;background:rgba(11,4,24,.92);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center}',
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
 var topo=$('topo');if(topo)topo.appendChild(sel);

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
     if(tocadas<QTD&&typeof atual==='number'&&typeof resultados!=='undefined'&&atual+1<resultados.length){auto=true;window.tocar(atual+1);}
   });}
  });}catch(x){}
 }
 liga();

 /* QR da galera (PeerJS) */
 var pa=$('player-area');
 var cod=localStorage.tkCod||(localStorage.tkCod=String(Math.floor(1000+Math.random()*9000)));
 var feed=document.createElement('div');feed.id='tkFeed';
 var vt=document.createElement('div');vt.id='tkVoto';
 if(pa){pa.appendChild(feed);pa.appendChild(vt);}
 function mostraVoto(){if(!votos.length){vt.style.display='none';return;}var s=0;votos.forEach(function(v){s+=v});vt.style.display='block';vt.textContent='⭐ '+(s/votos.length).toFixed(1)+' ('+votos.length+')';}
 function limpa(t,n){return String(t||'').replace(/\s+/g,' ').slice(0,n)}
 function recado(nome,txt){var m=document.createElement('div');m.className='tkMsg';var b=document.createElement('b');b.textContent=limpa(nome,14)+': ';m.appendChild(b);m.appendChild(document.createTextNode(limpa(txt,70)));feed.appendChild(m);while(feed.children.length>3)feed.firstChild.remove();setTimeout(function(){m.style.opacity=0;setTimeout(function(){m.remove()},900)},8000);}
 var FIGS=['🔥','👏','😍','😂','🎤','⭐','💃','🍻','❤️','👑','🤘','😱'];
 function figura(f){if(FIGS.indexOf(f)<0||!pa)return;var e=document.createElement('div');e.className='tkFig';e.textContent=f;e.style.left=(10+Math.random()*70)+'%';e.style.top='70%';pa.appendChild(e);setTimeout(function(){e.style.transform='translateY(-260px) scale(1.4)';e.style.opacity=0;},50);setTimeout(function(){e.remove()},3200);}
 var conns=[];function envia(o){conns.forEach(function(c){try{c.send(o)}catch(x){}})}
 function montaQR(){
  if(!pa||$('tkQR'))return;
  var url=PHONE+'?tv='+cod;
  var q=document.createElement('div');q.id='tkQR';
  q.innerHTML='<img alt="QR" src="https://api.qrserver.com/v1/create-qr-code/?size=216x216&margin=4&data='+encodeURIComponent(url)+'"><div>📱 Mande figurinha!</div><div>Sala '+cod+'</div>';
  pa.appendChild(q);
 }
 function peer(){
  var s=document.createElement('script');s.src='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  s.onload=function(){
   var p;try{p=new Peer('tudookeTV-'+cod);}catch(x){return;}
   p.on('open',montaQR);
   p.on('connection',function(c){conns.push(c);
    c.on('data',function(d){if(!d||typeof d!=='object')return;
     if(d.t==='fig')figura(d.v);
     else if(d.t==='msg')recado(d.n||'Alguém',d.v);
     else if(d.t==='voto'){var v=parseInt(d.v,10);if(v>=1&&v<=5){votos.push(v);mostraVoto();figura('⭐');}}
    });
    c.on('close',function(){conns=conns.filter(function(x){return x!==c})});
    c.on('open',function(){try{c.send({t:'ok',musica:(typeof atual==='number'&&typeof resultados!=='undefined'&&resultados[atual])?resultados[atual].titulo:''})}catch(x){}});
   });
   p.on('error',function(e){if(e&&e.type==='unavailable-id'){/* outra TV com o mesmo codigo */localStorage.tkCod=String(Math.floor(1000+Math.random()*9000));setTimeout(function(){location.reload()},1500);}});
   p.on('disconnected',function(){setTimeout(function(){try{p.reconnect()}catch(x){}},3000)});
  };
  document.head.appendChild(s);
 }
 peer();
})();
