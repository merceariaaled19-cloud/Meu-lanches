/* Oferta Okê — 🎉 FESTAS E EVENTOS (anúncio de festa com locutor por cima da música, legenda e arte).
   Usa o mesmo motor do app: voz Gemini TTS (geraFala/cortaFala/cadeiaFx de voz.js), desenho e gravação de vídeo (video.js),
   fotos (foto.js). Locutores e estilos são próprios e fictícios (nunca imitam pessoa real; sem bordão de famoso). */

/* ---------- vozes (Gemini TTS, pt-BR) ---------- */
var VOZES_FESTA = {
  marcao: {nome: 'Marcão do Som', sexo: 'M', gem: 'Alnilam', jeito: 'voz firme e forte'},
  ricardo: {nome: 'Ricardo FM', sexo: 'M', gem: 'Iapetus', jeito: 'voz clara de rádio'},
  duda: {nome: 'Duda Folia', sexo: 'F', gem: 'Pulcherrima', jeito: 'voz animada e para frente'},
  raio: {nome: 'DJ Raio', sexo: 'M', gem: 'Fenrir', jeito: 'voz empolgada de festa'},
  ze: {nome: 'Zé Sanfona', sexo: 'M', gem: 'Achird', jeito: 'voz amiga e alegre'},
  lia: {nome: 'Lia Show', sexo: 'F', gem: 'Zephyr', jeito: 'voz brilhante de show'},
  bia: {nome: 'Tia Bia', sexo: 'F', gem: 'Leda', jeito: 'voz jovem e doce'},
  carla: {nome: 'Carla Parabéns', sexo: 'F', gem: 'Autonoe', jeito: 'voz alegre e brilhante'},
  henrique: {nome: 'Henrique Gala', sexo: 'M', gem: 'Algieba', jeito: 'voz suave e elegante'},
  ruth: {nome: 'Irmã Ruth', sexo: 'F', gem: 'Sulafat', jeito: 'voz calorosa e acolhedora'},
  fabio: {nome: 'Fábio Abertura', sexo: 'M', gem: 'Orus', jeito: 'voz firme e confiante'}
};

/* ---------- estilos de locução (pesquisa: chamada curta, o quê/quando/onde nos primeiros segundos,
   desacelera em data/hora/local, repete nome + data + local no fim, cama musical baixa sob a voz) ---------- */
var ESTILOS_FESTA = [
  {id: 'carro', emoji: '📢', nome: 'Carro de som animado', desc: 'O clássico da rua: alto, com eco e "atenção, atenção!".', voz: 'marcao', bed: 'animada', duck: 0.13, musLvl: 0.6,
   papel: 'sound-truck (carro de som) party announcer, loud, festive and very energetic', cena: 'A loudspeaker on a sound truck driving slowly through a Brazilian neighborhood, announcing a party.',
   notas: 'Loud, festive carro de som announcer, big energy, stretches the first word of each call ("atenção, atenção!"), slows down a bit on the date, time and place so everyone understands.', ritmo: 'Lively, slightly slower on date, time and place.',
   fx: {rate: 1.04, hp: 240, low: -2, mid: 4, pres: 6, high: -2, drive: 0.25, eco: 0.2, ecoT: 0.14, eco2: 0.3, room: 0.12}, cor: {a: '#d0101f', b: '#7a0010', c: '#ff3b3b'},
   chamadas: ['Atenção, atenção, moradores do bairro!', 'Alô, alô, comunidade! Atenção para este aviso!', 'Atenção, galera! Para tudo e escuta!'],
   bordoes: ['Vai ser a festa do ano!', 'Não fica de fora não!', 'Chama a família, chama os amigos!'],
   fechas: ['Não perca!', 'Te esperamos lá!', 'Vem com a gente!'], titulo: 'ATENÇÃO!',
   ia: 'Estilo carro de som de bairro: chamadas curtas e repetidas ("Atenção, atenção!"), tom de rua, festa para a comunidade. Repita nome, data e local no fim.'},
  {id: 'radio', emoji: '📻', nome: 'Rádio FM', desc: 'Chamada de rádio: voz limpa, ritmo de spot, vinheta no começo.', voz: 'ricardo', bed: 'radio', duck: 0.2, musLvl: 0.55,
   papel: 'FM radio announcer reading a polished event spot', cena: 'A Brazilian FM radio station studio, a polished 30-second event spot over a radio jingle bed.',
   notas: 'Smooth, clear and confident FM radio announcer, warm smile, professional rhythm like a radio spot.', ritmo: 'Steady radio pace, clear diction.',
   fx: {rate: 1.02, hp: 80, low: 3, mid: 0, pres: 3, high: 2, drive: 0.05, eco: 0, ecoT: 0.05, eco2: 0, room: 0.05}, cor: {a: '#2563eb', b: '#0b1f4d', c: '#60a5fa'},
   chamadas: ['Tá chegando!', 'Anota aí na agenda!', 'Prepare-se!'],
   bordoes: ['Um evento para ninguém esquecer.', 'Uma noite especial espera por você.', 'Garanta já o seu lugar.'],
   fechas: ['Te vejo lá!', 'Não perca!', 'Garanta o seu lugar!'], titulo: 'TÁ CHEGANDO',
   ia: 'Estilo spot de rádio FM: abertura curta de impacto, frases limpas, profissional, assinatura no fim com nome do evento, data e local.'},
  {id: 'carnaval', emoji: '🎭', nome: 'Carnaval / Bloco', desc: 'Clima de folia, batucada e marchinha.', voz: 'duda', bed: 'carnaval', duck: 0.15, musLvl: 0.62,
   papel: 'carnival street-block (bloco de carnaval) announcer, joyful and loud', cena: 'A Brazilian street carnival (bloco) with drums, the announcer calling the crowd on a microphone.',
   notas: 'Super joyful carnival party voice, playful and loud, like inviting everyone to the street parade; big smile.', ritmo: 'Fast and bouncy, slower on date, time and place.',
   fx: {rate: 1.05, hp: 120, low: 1, mid: 2, pres: 5, high: 2, drive: 0.12, eco: 0.08, ecoT: 0.09, eco2: 0.15, room: 0.08}, cor: {a: '#9333ea', b: '#3b0764', c: '#f59e0b'},
   chamadas: ['Alô, foliões! O bloco vai passar!', 'Atenção, folia! Separa a fantasia!', 'É carnaval, minha gente!'],
   bordoes: ['Traz o confete e a serpentina!', 'Vem pular com a gente!', 'Ninguém fica parado!'],
   fechas: ['Vem pra folia!', 'Te espero no bloco!', 'Bora pular!'], titulo: 'É FOLIA!',
   ia: 'Estilo carnaval/bloco de rua: alegria, confete, fantasia, batucada, "vem pular"; sem citar marchinhas ou bordões de artistas.'},
  {id: 'aparelhagem', emoji: '🔊', nome: 'Aparelhagem / Festa do Norte', desc: 'Tecnomelody e aparelhagem: grave, eco forte, energia lá em cima.', voz: 'raio', bed: 'aparelhagem', duck: 0.12, musLvl: 0.65,
   papel: 'northern Brazil sound-system (aparelhagem) party MC, huge hype, big echo', cena: 'A giant northern Brazil sound system party (aparelhagem, tecnomelody) with lights and smoke, the MC on the microphone with heavy echo.',
   notas: 'Huge hype party MC voice, deep and powerful, drags the big words, shouts the name of the party with pride; heavy echo.', ritmo: 'Punchy, with dramatic pauses before the party name.',
   fx: {rate: 1.03, hp: 90, low: 5, mid: 0, pres: 5, high: 3, drive: 0.18, eco: 0.3, ecoT: 0.18, eco2: 0.38, room: 0.14}, cor: {a: '#e11d48', b: '#0f0a1e', c: '#22d3ee'},
   chamadas: ['Atenção, galera do Norte!', 'Prepara o coração, que a festa vai tremer!', 'Liga o som, que a aparelhagem chegou!'],
   bordoes: ['O som mais pesado da região!', 'Luz, fumaça e muita festa!', 'É pra tremer o chão!'],
   fechas: ['Vem pra festa!', 'Bora curtir!', 'Te espero lá!'], titulo: 'AGITA!',
   ia: 'Estilo aparelhagem/festa do Norte (tecnomelody, brega): muita energia, luz e som, "vai tremer o chão"; NÃO cite nomes de aparelhagens, DJs ou bordões reais.'},
  {id: 'forro', emoji: '🪗', nome: 'Forró / São João', desc: 'Arraiá, sanfona, zabumba e triângulo.', voz: 'ze', bed: 'forro', duck: 0.16, musLvl: 0.6,
   papel: 'cheerful northeastern Brazil forró / São João party announcer', cena: 'A Brazilian June festival (arraiá, São João) with forró band, bonfire and flags.',
   notas: 'Warm, joyful country forró announcer, friendly and playful, festa junina mood.', ritmo: 'Bouncy and lively, slower on date, time and place.',
   fx: {rate: 1.04, hp: 110, low: 2, mid: 2, pres: 4, high: 1, drive: 0.1, eco: 0.08, ecoT: 0.1, eco2: 0.15, room: 0.08}, cor: {a: '#ea580c', b: '#431407', c: '#facc15'},
   chamadas: ['Arrocha, minha gente! Tem forró!', 'Ô, sanfoneiro! Atenção, povo do arraiá!', 'Atenção, forrozeiros!'],
   bordoes: ['Vai ter forró pé de serra a noite toda!', 'Traz seu par pra dançar!', 'É pra arrastar o pé!'],
   fechas: ['Vem dançar com a gente!', 'Te espero no arraiá!', 'Bora arrastar o pé!'], titulo: 'TEM FORRÓ!',
   ia: 'Estilo forró / festa junina: arraiá, sanfona, quadrilha, fogueira, "arrastar o pé"; sem bordões de artistas.'},
  {id: 'show', emoji: '🎤', nome: 'Show / Balada', desc: 'Show, balada e noite: chamada de impacto.', voz: 'lia', bed: 'aparelhagem', duck: 0.14, musLvl: 0.62,
   papel: 'club and live-show event announcer, bright and hyped', cena: 'A big concert / nightclub event, bright lights, the announcer hyping the crowd.',
   notas: 'Bright, hyped show announcer, confident and exciting, stresses the attractions and the date.', ritmo: 'Fast with strong emphasis, slower on date and place.',
   fx: {rate: 1.04, hp: 110, low: 1, mid: 0, pres: 5, high: 4, drive: 0.1, eco: 0.12, ecoT: 0.12, eco2: 0.2, room: 0.08}, cor: {a: '#db2777', b: '#1e1b4b', c: '#a855f7'},
   chamadas: ['Prepare-se, que a noite promete!', 'É hoje? Não! Mas tá chegando!', 'Atenção, galera! Grande show!'],
   bordoes: ['Uma noite inesquecível!', 'Vai lotar!', 'Garanta já o seu ingresso!'],
   fechas: ['Te vejo lá!', 'Não fica de fora!', 'Corre que vai lotar!'], titulo: 'GRANDE SHOW',
   ia: 'Estilo show/balada: impacto, atrações em destaque, ingresso, "vai lotar"; não cite bordões de artistas.'},
  {id: 'infantil', emoji: '🎈', nome: 'Festa infantil', desc: 'Doce e divertido, para crianças e famílias.', voz: 'bia', bed: 'infantil', duck: 0.22, musLvl: 0.55,
   papel: 'kids party host, sweet, playful and cheerful', cena: 'A colorful children\'s birthday party with balloons, games and happy kids.',
   notas: 'Sweet, playful and cheerful kids-party host voice, like talking to children and parents, very friendly, never shouting.', ritmo: 'Moderate and clear, playful.',
   fx: {rate: 1.03, hp: 120, low: 0, mid: 0, pres: 3, high: 3, drive: 0, eco: 0, ecoT: 0.05, eco2: 0, room: 0.06}, cor: {a: '#0ea5e9', b: '#1e3a8a', c: '#f472b6'},
   chamadas: ['Ei, criançada! Tem festa!', 'Olá, papais e mamães! Tem novidade!', 'Atenção, turminha!'],
   bordoes: ['Vai ter brincadeira, bolo e muita alegria!', 'Diversão garantida para toda a família!', 'Traz a criançada!'],
   fechas: ['Vem brincar com a gente!', 'Esperamos vocês!', 'Até lá!'], titulo: 'TEM FESTA!',
   ia: 'Estilo festa infantil / aniversário de criança: doce, divertido, família, brincadeiras, bolo; linguagem leve.'},
  {id: 'aniversario', emoji: '🎂', nome: 'Aniversário', desc: 'Convite alegre de aniversário.', voz: 'carla', bed: 'radio', duck: 0.18, musLvl: 0.58,
   papel: 'cheerful birthday party announcer', cena: 'A joyful Brazilian birthday celebration with friends and family.',
   notas: 'Happy and warm birthday-invite voice, celebratory and friendly.', ritmo: 'Lively and clear.',
   fx: {rate: 1.03, hp: 100, low: 1, mid: 0, pres: 4, high: 3, drive: 0.04, eco: 0.04, ecoT: 0.07, eco2: 0.1, room: 0.06}, cor: {a: '#e11d48', b: '#4c0519', c: '#fbbf24'},
   chamadas: ['Atenção, amigos e família!', 'Tem aniversário chegando!', 'Bora comemorar!'],
   bordoes: ['Vai ter muita alegria e parabéns pra você!', 'Sua presença é o melhor presente!', 'Vem celebrar com a gente!'],
   fechas: ['Conto com você!', 'Te espero lá!', 'Vem comemorar!'], titulo: 'PARABÉNS!',
   ia: 'Estilo convite de aniversário: alegre, carinhoso, "sua presença é o melhor presente".'},
  {id: 'elegante', emoji: '🥂', nome: 'Elegante (casamento / formatura)', desc: 'Voz suave e sofisticada, música calma.', voz: 'henrique', bed: 'suave', duck: 0.24, musLvl: 0.5,
   papel: 'elegant ceremony and gala announcer, smooth and refined', cena: 'An elegant wedding or graduation gala, soft piano and strings.',
   notas: 'Smooth, refined and warm voice, elegant and calm, never shouting, with gentle emphasis on names and the date.', ritmo: 'Calm and unhurried, elegant pauses.',
   fx: {rate: 1.0, hp: 70, low: 3, mid: -1, pres: 2, high: 2, drive: 0, eco: 0, ecoT: 0.05, eco2: 0, room: 0.12}, cor: {a: '#a16207', b: '#1c1917', c: '#d6b25e'},
   chamadas: ['Com muita alegria, convidamos você.', 'Um momento especial merece a sua presença.', 'É com carinho que fazemos este convite.'],
   bordoes: ['Será uma noite inesquecível.', 'Celebre conosco este momento.', 'Sua presença tornará tudo mais especial.'],
   fechas: ['Esperamos por você.', 'Contamos com a sua presença.', 'Será uma honra receber você.'], titulo: 'CONVITE',
   ia: 'Estilo elegante (casamento, formatura, gala): convite refinado, calmo, sem gritaria nem gírias, "contamos com a sua presença".'},
  {id: 'gospel', emoji: '🙏', nome: 'Gospel / Evento religioso', desc: 'Acolhedor e respeitoso: culto, congresso, campanha.', voz: 'ruth', bed: 'gospel', duck: 0.22, musLvl: 0.52,
   papel: 'warm and respectful church event announcer', cena: 'A welcoming Brazilian church event invitation over a soft worship music bed.',
   notas: 'Warm, welcoming and respectful voice, joyful but calm, community tone, inviting the whole family.', ritmo: 'Calm and clear.',
   fx: {rate: 1.0, hp: 80, low: 2, mid: 0, pres: 2, high: 2, drive: 0, eco: 0, ecoT: 0.05, eco2: 0, room: 0.14}, cor: {a: '#0369a1', b: '#0c1e3a', c: '#fcd34d'},
   chamadas: ['Você e sua família estão convidados!', 'Venha participar com a gente!', 'Um convite especial para você!'],
   bordoes: ['Um tempo de louvor, palavra e comunhão.', 'Traga quem você ama.', 'Entrada aberta para toda a família.'],
   fechas: ['Esperamos você!', 'Venha participar!', 'Será uma bênção receber você!'], titulo: 'CONVITE',
   ia: 'Estilo evento religioso (culto, congresso, campanha, show gospel): acolhedor, respeitoso, comunitário, "traga quem você ama"; sem prometer milagre ou cura.'},
  {id: 'inauguracao', emoji: '🎀', nome: 'Inauguração', desc: 'Abertura de loja ou espaço: festiva e convidativa.', voz: 'fabio', bed: 'animada', duck: 0.16, musLvl: 0.6,
   papel: 'store grand-opening announcer, confident and festive', cena: 'A Brazilian store grand opening with balloons, music and a crowd at the door.',
   notas: 'Confident, festive and welcoming grand-opening announcer; stress the name, the opening date and the address.', ritmo: 'Lively, slower on date, time and address.',
   fx: {rate: 1.03, hp: 100, low: 2, mid: 1, pres: 4, high: 2, drive: 0.1, eco: 0.08, ecoT: 0.1, eco2: 0.15, room: 0.08}, cor: {a: '#16a34a', b: '#052e16', c: '#facc15'},
   chamadas: ['Atenção! Tem inauguração no bairro!', 'Chegou! Grande inauguração!', 'É festa de abertura!'],
   bordoes: ['Venha conhecer o novo espaço!', 'Vai ter surpresas para quem chegar!', 'Estamos de portas abertas para você!'],
   fechas: ['Vem conhecer!', 'Esperamos sua visita!', 'Te esperamos na inauguração!'], titulo: 'INAUGURAÇÃO',
   ia: 'Estilo inauguração: grande abertura, novo espaço, convite para conhecer; só fale de brindes/descontos se estiverem nos dados.'}
];
function estiloFesta(id){ for (var i = 0; i < ESTILOS_FESTA.length; i++) if (ESTILOS_FESTA[i].id == id) return ESTILOS_FESTA[i]; return ESTILOS_FESTA[0]; }
function vozFestaObj(est, vozId){
  var v = VOZES_FESTA[vozId] || VOZES_FESTA[est.voz];
  return {id: 'f_' + est.id + '_' + (vozId || est.voz), nome: v.nome, gem: v.gem, perfil: v.nome + ', a ' + (v.sexo == 'F' ? 'FEMALE' : 'MALE') + ' Brazilian ' + est.papel + ' (' + v.jeito + ')',
    cena: est.cena, notas: est.notas, ritmo: est.ritmo, fx: est.fx};
}
/* músicas de fundo do app (feitas no próprio celular, sem direitos autorais) */
var MUSICAS_FESTA = [{id: 'animada', nome: '🎺 Animada (palmas e metais)'}, {id: 'grave', nome: '📻 Batida grave'}, {id: 'radio', nome: '🎵 Pop de rádio'}, {id: 'carnaval', nome: '🥁 Batucada de carnaval'},
  {id: 'forro', nome: '🪗 Forró (zabumba e triângulo)'}, {id: 'aparelhagem', nome: '🔊 Eletrônica / aparelhagem'}, {id: 'infantil', nome: '🎈 Infantil (sininhos)'}, {id: 'suave', nome: '🎹 Suave / elegante'}, {id: 'gospel', nome: '🙏 Gospel suave'}];

/* ---------- sintetizador das músicas ---------- */
function musicaFesta(ctx, dest, dur, bed){
  if (bed == 'animada' || bed == 'grave' || !bed) return musica(ctx, dest, dur, bed == 'grave' ? 'grave' : '');
  var bus = ctx.createGain(); bus.gain.value = 1; bus.connect(dest); var nz = ruido(ctx, 0.5);
  function tom(t, f, len, tipo, vol, corte, ataque){ var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = tipo || 'sine'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = corte || 4000;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (ataque || 0.008)); g.gain.exponentialRampToValueAtTime(0.0008, t + len); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + len + 0.03); }
  function bumbo(t, f0, f1, vol, len){ var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + len * 0.5); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); o.connect(g); g.connect(bus); o.start(t); o.stop(t + len + 0.02); }
  function chiado(t, tipo, f, vol, len, q){ var s = ctx.createBufferSource(); s.buffer = nz; var fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; if (q) fl.Q.value = q; var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t); s.stop(t + len + 0.02); }
  var C = {I: [261.6, 329.6, 392.0], V: [196.0, 246.9, 293.7], vi: [220.0, 261.6, 329.6], IV: [174.6, 220.0, 261.6]}, prog = [C.I, C.V, C.vi, C.IV], raiz = [65.41, 49.0, 55.0, 43.65];
  var cfg = {radio: 112, carnaval: 104, forro: 112, aparelhagem: 140, infantil: 120, suave: 72, gospel: 84}, bpm = cfg[bed] || 120, bt = 60 / bpm;
  for (var b = 0, t = 0; t < dur; b++, t = b * bt){
    var cp = Math.floor(b / 4) % 4, ch = prog[cp], rz = raiz[cp];
    if (bed == 'radio'){ bumbo(t, 140, 48, 0.8, 0.22); if (b % 2) chiado(t, 'bandpass', 1800, 0.35, 0.12, 0.8); chiado(t + bt / 2, 'highpass', 7000, 0.08, 0.04);
      tom(t, rz, bt * 0.45, 'triangle', 0.45, 800); tom(t + bt / 2, rz * 2, bt * 0.3, 'triangle', 0.3, 800); ch.forEach(function(f){ tom(t + bt / 2, f, bt * 0.35, 'square', 0.035, 2400); }); }
    else if (bed == 'carnaval'){ /* surdo de marcação no 2º tempo, caixa e tamborim em semicolcheias, metais a cada compasso */
      bumbo(t, 90, 55, b % 2 ? 0.95 : 0.55, 0.35); for (var k = 0; k < 4; k++) chiado(t + k * bt / 4, 'bandpass', 3200, k == 2 ? 0.22 : (k % 2 ? 0.08 : 0.13), 0.05, 2);
      if (b % 2) chiado(t + bt * 0.5, 'bandpass', 1500, 0.28, 0.09, 1); tom(t, rz * 2, bt * 0.4, 'triangle', 0.4, 900);
      if (b % 4 == 0) ch.forEach(function(f){ tom(t, f * 2, bt * 0.5, 'sawtooth', 0.05, 3000); }); if (b % 4 == 3) ch.forEach(function(f, j){ tom(t + j * bt / 3, f * 2, bt * 0.25, 'sawtooth', 0.045, 3200); }); }
    else if (bed == 'forro'){ /* baião: zabumba (1 e "e" do 2), triângulo em colcheias, sanfona nos acordes */
      bumbo(t, 110, 60, 0.8, 0.25); if (b % 2) bumbo(t + bt * 0.75, 110, 60, 0.55, 0.2); chiado(t + bt * 0.5, 'bandpass', 900, 0.12, 0.06, 1);
      for (var k2 = 0; k2 < 2; k2++) tom(t + k2 * bt / 2, 2600, 0.12, 'sine', k2 ? 0.07 : 0.11, 9000);
      tom(t, rz, bt * 0.4, 'triangle', 0.45, 700); if (b % 2 == 0) ch.forEach(function(f){ var o = ctx.createOscillator(), g = ctx.createGain(), lf = ctx.createOscillator(), lg = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; lf.frequency.value = 5.5; lg.gain.value = 3; lf.connect(lg); lg.connect(o.frequency);
        var fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1800; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04, t + 0.05); g.gain.setValueAtTime(0.04, t + bt * 1.6); g.gain.linearRampToValueAtTime(0.0001, t + bt * 1.9); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + bt * 2); lf.start(t); lf.stop(t + bt * 2); }); }
    else if (bed == 'aparelhagem'){ bumbo(t, 150, 42, 1, 0.26); chiado(t + bt / 2, 'highpass', 6500, 0.16, 0.08); if (b % 2) chiado(t, 'bandpass', 1500, 0.32, 0.1, 0.9);
      tom(t + bt / 2, rz * 2, bt * 0.4, 'sawtooth', 0.22, 500); for (var k3 = 0; k3 < 4; k3++) tom(t + k3 * bt / 4, ch[(b + k3) % 3] * 2, bt * 0.2, 'sawtooth', 0.035, 3800); }
    else if (bed == 'infantil'){ if (b % 2 == 0) bumbo(t, 120, 60, 0.45, 0.18); chiado(t + bt / 2, 'highpass', 8000, 0.06, 0.05);
      tom(t, ch[b % 3] * 2, bt * 0.9, 'sine', 0.12, 8000); tom(t, ch[b % 3] * 4, bt * 0.5, 'sine', 0.04, 9000); tom(t + bt / 2, ch[(b + 1) % 3] * 2, bt * 0.6, 'sine', 0.08, 8000); tom(t, rz * 2, bt * 0.5, 'triangle', 0.3, 700); }
    else if (bed == 'suave' || bed == 'gospel'){
      if (b % 4 == 0) ch.concat([ch[0] / 2]).forEach(function(f){ [-5, 5].forEach(function(dt){ var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; fl.type = 'lowpass'; fl.frequency.value = 1200;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.018, t + bt * 1.2); g.gain.setValueAtTime(0.018, t + bt * 3.4); g.gain.linearRampToValueAtTime(0.0001, t + bt * 4.2); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + bt * 4.3); }); });
      tom(t, ch[b % 3] * (bed == 'suave' ? 2 : 1), bt * 1.6, 'triangle', 0.12, 2500, 0.004); tom(t, rz * 2, bt * 1.2, 'sine', 0.25, 600);
      if (bed == 'gospel'){ if (b % 2 == 0) bumbo(t, 110, 50, 0.4, 0.2); if (b % 2) chiado(t, 'bandpass', 2200, 0.12, 0.08, 1.5); } }
  }
  return bus;
}
function previaMusica(id){ return (async function(){ var sr = 44100, ctx = new OfflineAudioContext(2, sr * 8, sr), g = ctx.createGain(); g.gain.setValueAtTime(0.7, 0); g.gain.setValueAtTime(0.7, 7); g.gain.linearRampToValueAtTime(0, 7.9); g.connect(ctx.destination); musicaFesta(ctx, g, 8, id); return ctx.startRendering(); })(); }

/* ---------- datas, horas e valores falados ---------- */
var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
var SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'], SEM3 = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
function dataObj(dia){ if (!/^\d{4}-\d{2}-\d{2}$/.test(dia || '')) return null; var d = new Date(dia + 'T12:00:00'); return isNaN(d) ? null : d; }
function diaFalado(dia){ var d = dataObj(dia); if (!d) return ''; var n = d.getDate(); return SEMANA[d.getDay()] + ', dia ' + (n == 1 ? 'primeiro' : extenso(n)) + ' de ' + MESES[d.getMonth()]; }
function diaCurtoFalado(dia){ var d = dataObj(dia); if (!d) return ''; var n = d.getDate(); return 'dia ' + (n == 1 ? 'primeiro' : extenso(n)) + ' de ' + MESES[d.getMonth()]; }
function diaArte(dia){ var d = dataObj(dia); if (!d) return ''; return SEM3[d.getDay()] + ' ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }
function horaFalada(h, inicio){
  var m = /^(\d{1,2}):(\d{2})$/.exec(h || ''); if (!m) return ''; var hh = +m[1], mm = +m[2], per, n;
  if (hh == 0){ return (inicio ? 'a partir da ' : 'à ') + 'meia-noite' + (mm ? ' e ' + (mm == 30 ? 'meia' : extenso(mm)) : ''); }
  if (hh == 12){ return (inicio ? 'a partir do ' : 'ao ') + 'meio-dia' + (mm ? ' e ' + (mm == 30 ? 'meia' : extenso(mm)) : ''); }
  n = hh > 12 ? hh - 12 : hh; per = hh < 12 ? ' da manhã' : hh < 18 ? ' da tarde' : ' da noite';
  var num = extenso(n, true), art = n == 1 ? (inicio ? 'a partir da ' : 'à ') : (inicio ? 'a partir das ' : 'às ');
  return art + num + (mm ? ' e ' + (mm == 30 ? 'meia' : extenso(mm)) : '') + per;
}
function horaArte(h){ var m = /^(\d{1,2}):(\d{2})$/.exec(h || ''); if (!m) return ''; return +m[1] + 'H' + (+m[2] ? m[2] : ''); }
function valorFalado(t){ return String(t || '').replace(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/gi, function(x, v){ return precoExtenso(lePreco(v)); }); }
function foneFalado(z){ var d = String(z || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''); if (d.length == 11) return d.slice(0, 2) + ', ' + d.slice(2, 3) + ' ' + d.slice(3, 7) + ', ' + d.slice(7); if (d.length == 10) return d.slice(0, 2) + ', ' + d.slice(2, 6) + ', ' + d.slice(6); return z; }
function contatoFalado(c){ c = String(c || '').trim(); return /^[\d\s()+\-.]{8,}$/.test(c) ? foneFalado(c) : c; }

/* ---------- texto do locutor (pronto na hora; a IA melhora) ---------- */
function linhasTemplate(F, est, s){
  function P(a){ return sorteia(a, s); }
  var L = [], nome = F.nome || 'a festa', dia = diaFalado(F.dia), hora = horaFalada(F.hora, true);
  L.push(P(est.chamadas));
  L.push(est.id == 'elegante' || est.id == 'gospel' ? nome + '.' : sorteia(['Vem aí: ' + nome + '!', 'Vai rolar: ' + nome + '!', 'Não perca: ' + nome + '!'], s + 1));
  if (dia || hora) L.push(cap((dia ? dia : '') + (dia && hora ? ', ' : '') + (hora || '')) + '.');
  if (F.local) L.push('Local: ' + F.local + '.');
  if (F.atracoes) L.push((est.id == 'elegante' || est.id == 'gospel' ? 'Com ' : 'Com ') + F.atracoes + (est.id == 'elegante' || est.id == 'gospel' ? '.' : '!'));
  if (F.entrada) L.push('Entrada: ' + valorFalado(F.entrada) + '.');
  L.push(P(est.bordoes));
  var rep = ['Anota aí', 'Repetindo', 'Não esquece'][s % 3]; if (est.id == 'elegante' || est.id == 'gospel') rep = 'Anote';
  var dcur = diaCurtoFalado(F.dia), hcur = horaFalada(F.hora, false);
  L.push(rep + ': ' + nome + (dcur ? ', ' + dcur : '') + (hcur ? ', ' + hcur : '') + (F.local ? ', no local ' + F.local : '') + '.');
  if (F.contato) L.push('Informações: ' + contatoFalado(F.contato) + '.');
  L.push(P(est.fechas));
  return L;
}
function cap(t){ t = String(t || ''); return t.charAt(0).toUpperCase() + t.slice(1); }
async function iaFesta(F, est, avisa){
  var dados = {nome_da_festa: F.nome, dia_falado: diaFalado(F.dia), hora_falada: horaFalada(F.hora, true), dia_curto: diaCurtoFalado(F.dia), hora_curta: horaFalada(F.hora, false), local: F.local, atracoes: F.atracoes || '', entrada_falada: valorFalado(F.entrada || ''), contato_falado: F.contato ? contatoFalado(F.contato) : ''};
  var prompt = 'Você é redator de chamadas de festa para carro de som e rádio no Brasil. Escreva o texto que o LOCUTOR vai falar (20 a 40 segundos), português do Brasil, popular e fácil de entender na rua.\n' +
    'Estilo: ' + est.nome + '. ' + est.ia + '\n' +
    'Dados (use exatamente estas formas faladas, sem algarismos): ' + JSON.stringify(dados) + '\n' +
    'Regras: devolva de 6 a 10 LINHAS curtas (no máximo 16 palavras cada); a 1ª é a chamada de atenção; nas primeiras linhas diga o quê, quando (dia_falado e hora_falada) e onde (local); fale as atrações e a entrada se houver; ' +
    'perto do fim REPITA nome, dia_curto, hora_curta e local; se houver contato, uma linha com contato_falado; última linha é a chamada final curta. ' +
    'Bordões só genéricos (nunca de pessoa famosa, artista, DJ, aparelhagem ou programa real). Não invente brinde, desconto, horário, preço, atração ou local que não está nos dados. Sem emojis.';
  var o = await gemTexto(prompt, {type: 'OBJECT', properties: {linhas: {type: 'ARRAY', items: {type: 'STRING'}}}, required: ['linhas']}, avisa);
  var L = (o.linhas || []).map(function(x){ return String(x || '').replace(/\s+/g, ' ').trim(); }).filter(Boolean).slice(0, 12);
  if (L.length < 4) throw new Error('resposta curta');
  var tudo = L.join(' ').toLowerCase(), pn = (F.nome || '').toLowerCase().split(/\s+/)[0] || '', pl = (F.local || '').toLowerCase().split(/\s+/)[0] || '';
  var d = dataObj(F.dia), nDia = d ? (d.getDate() == 1 ? 'primeiro' : extenso(d.getDate())) : '';
  /* confere o essencial; se faltar, completa com a linha de repetição do modelo */
  if ((pn && tudo.indexOf(pn) < 0) || (pl && tudo.indexOf(pl) < 0) || (nDia && tudo.indexOf(nDia) < 0)){ var T = linhasTemplate(F, est, 0); L.splice(Math.max(1, L.length - 1), 0, T.filter(function(x){ return /^(Anota aí|Anote|Repetindo|Não esquece):/.test(x); })[0] || T[2]); }
  return L;
}

/* ---------- mixagem: locutor por cima da música, música abaixa na fala (ducking) e sobe no fim ---------- */
var FT_INTRO = 2.2, FT_FIM = 3.6, FT_VAO = 0.32;
async function mixarFesta(falaWav, voz, est, linhas, mus){
  var tmp = new OfflineAudioContext(1, 1, 44100), fala = falaWav ? await tmp.decodeAudioData(falaWav.slice(0)) : null, pos = [], t = FT_INTRO;
  if (fala){ var rate = voz.fx.rate || 1, cortes = cortaFala(fala.getChannelData(0), fala.sampleRate, linhas); if (!cortes) throw new Error('voz-vazia');
    cortes.forEach(function(c){ var dur = (c.fim - c.ini) / rate; pos.push({t: t, dur: dur, ini: c.ini, fim: c.fim}); t += dur + FT_VAO; }); }
  else linhas.forEach(function(l){ var dur = Math.max(1.6, l.length / 15); pos.push({t: t, dur: dur}); t += dur + FT_VAO; });
  var falaFim = t - FT_VAO, total = falaFim + FT_FIM, sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
  var lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.1;
  var master = ctx.createGain(); master.gain.value = 0.9; master.connect(lim); lim.connect(ctx.destination);
  var mg = ctx.createGain(); mg.connect(master);
  if (mus && mus.buf){ var ms = ctx.createBufferSource(); ms.buffer = mus.buf; ms.loop = true; var nm = ctx.createGain(); nm.gain.value = mus.norm || 1; ms.connect(nm); nm.connect(mg); ms.start(0); ms.stop(total); }
  else musicaFesta(ctx, mg, total, (mus && mus.bed) || est.bed);
  var alto = est.musLvl || 0.6, baixo = fala ? (est.duck || 0.16) : alto * 0.8, g = mg.gain, p0 = pos.length ? pos[0].t : FT_INTRO;
  g.setValueAtTime(0, 0); g.linearRampToValueAtTime(alto, 0.15); g.setValueAtTime(alto, Math.max(0.2, p0 - 0.35)); g.linearRampToValueAtTime(baixo, p0 - 0.05);
  /* pausas maiores que 0,9 s entre falas: a música respira um pouco */
  for (var i = 1; i < pos.length; i++){ var fimAnt = pos[i - 1].t + pos[i - 1].dur, gap = pos[i].t - fimAnt; if (gap > 0.9){ g.setValueAtTime(baixo, fimAnt + 0.05); g.linearRampToValueAtTime(Math.min(alto, baixo * 2), fimAnt + 0.3); g.setValueAtTime(Math.min(alto, baixo * 2), pos[i].t - 0.25); g.linearRampToValueAtTime(baixo, pos[i].t - 0.05); } }
  g.setValueAtTime(baixo, falaFim + 0.05); g.linearRampToValueAtTime(alto, falaFim + 0.5); g.setValueAtTime(alto, total - 1.2); g.linearRampToValueAtTime(0, total - 0.05);
  if (fala){ var vg = ctx.createGain(); vg.gain.value = 1; vg.connect(master); var ent = cadeiaFx(ctx, voz.fx, vg);
    pos.forEach(function(p){ var src = ctx.createBufferSource(); src.buffer = fala; src.playbackRate.value = voz.fx.rate || 1; src.connect(ent); src.start(p.t, p.ini, p.fim - p.ini); }); }
  /* vinheta: whoosh + metais (ou sininho na infantil; suave nas calmas) */
  var sfx = ctx.createGain(); sfx.gain.value = est.id == 'elegante' || est.id == 'gospel' ? 0.35 : 0.8; sfx.connect(master);
  efeitoSom(ctx, sfx, 0.05, 'whoosh'); if (est.id == 'infantil' || est.id == 'elegante' || est.id == 'gospel') efeitoSom(ctx, sfx, 0.5, 'ding'); else metais(ctx, sfx, 0.35, true);
  efeitoSom(ctx, sfx, Math.max(0, falaFim + 0.1), est.id == 'infantil' ? 'ding' : 'whoosh');
  var buf = await ctx.startRendering();
  return {buf: buf, total: total, legendas: pos.map(function(p, k){ return {t0: +p.t.toFixed(2), t1: +(p.t + p.dur).toFixed(2), txt: linhas[k]}; })};
}
/* AudioBuffer -> WAV (mono 16 bits, abre em qualquer celular) */
function bufParaWav(b){
  var n = b.length, sr = b.sampleRate, ch = b.numberOfChannels, d0 = b.getChannelData(0), d1 = ch > 1 ? b.getChannelData(1) : d0, out = new DataView(new ArrayBuffer(44 + n * 2));
  function w(o, s){ for (var i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); }
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
  for (var i = 0, o = 44; i < n; i++, o += 2){ var v = (d0[i] + d1[i]) / 2; v = Math.max(-1, Math.min(1, v)); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
  return new Blob([out.buffer], {type: 'audio/wav'});
}

/* ---------- arte animada da festa (vídeo) ---------- */
function legendaAgora(P, t){ var L = P.legendas || [], a = null; for (var i = 0; i < L.length; i++){ if (t >= L[i].t0 - 0.05) a = L[i]; } if (a && t > a.t1 + 0.6 && (!L[L.indexOf(a) + 1])) return null; return a; }
function desenhaFesta(g, W, H, t, P){
  var S = Math.min(W, H) / 720, ver = H > W, F = P.F || {}, est = P.est, baixo = 52 * S;
  fundo(g, W, H, t, S);
  /* confete */
  var cores = ['#ffd400', '#ffffff', VC.c, '#22d3ee', '#a3e635'];
  for (var k = 0; k < 34; k++){ var x = ((k * 173) % 100) / 100 * W + Math.sin(t * 1.5 + k) * 18 * S, y = (((k * 89) % 100) / 100 * H + t * (60 + (k % 5) * 22) * S) % (H + 20 * S) - 10 * S;
    g.save(); g.translate(x, y); g.rotate(t * 3 + k); g.fillStyle = cores[k % cores.length]; g.fillRect(-5 * S, -3 * S, 10 * S, 6 * S); g.restore(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  var e1 = eBack(t / 0.6), tit = (F.nome || 'FESTA').toUpperCase();
  var colX = ver ? W / 2 : W * 0.27, colW = ver ? W * 0.9 : W * 0.46;
  var y = ver ? 120 * S : 70 * S;
  g.save(); g.translate(colX, y); g.scale(e1, e1); g.font = Math.round(44 * S) + 'px ' + FONTE; cabeTexto(g, est.emoji + ' ' + est.titulo, colW, 44 * S); textoContorno(g, est.emoji + ' ' + est.titulo, 0, 0, '#ffd400', VC.b, 8 * S); g.restore();
  y += (ver ? 70 : 55) * S;
  /* título (até 2 linhas) */
  g.font = Math.round(96 * S) + 'px ' + FONTE; var tl = cabeTexto(g, tit, colW, ver ? 96 * S : 80 * S), ls = [tit];
  if (tl < 62 * S){ g.font = Math.round(76 * S) + 'px ' + FONTE; ls = quebra(g, tit, colW).slice(0, 2); tl = ver ? 76 * S : 64 * S; ls.forEach(function(l){ tl = Math.min(tl, cabeTexto(g, l, colW, ver ? 76 * S : 64 * S)); }); }
  y += tl * 0.5;
  g.save(); var e2 = eBack((t - 0.3) / 0.6); g.translate(colX, y + (ls.length - 1) * tl * 0.54); g.scale(e2, e2);
  g.font = Math.round(tl) + 'px ' + FONTE; ls.forEach(function(l, i){ textoContorno(g, l, 0, (i - (ls.length - 1) / 2) * tl * 1.08 + Math.sin(t * 3) * 2 * S, '#fff', VC.b, 11 * S); }); g.restore();
  y += tl * 1.08 * ls.length - tl * 0.5 + 30 * S;
  /* foto (opcional) ou selo grande do estilo */
  var bxC = ver ? W / 2 : W * 0.75, byC, bw0 = ver ? W * 0.56 : W * 0.38, bh0 = ver ? (P.foto ? Math.min(H * 0.2, bw0 * 0.75) : 225 * S) : H * 0.5;
  byC = ver ? y + bh0 / 2 : 95 * S + bh0 / 2;
  if (P.foto){ var im = P.foto, fw = bw0, fh = bh0;
    var ef = eOut((t - 0.5) / 0.6); g.save(); g.globalAlpha = ef; g.translate(bxC, byC); g.rotate(-0.03 + Math.sin(t) * 0.01); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 24 * S; g.fillStyle = '#fff'; rr(g, -fw / 2 - 8 * S, -fh / 2 - 8 * S, fw + 16 * S, fh + 16 * S, 20 * S); g.fill(); g.shadowBlur = 0;
      rr(g, -fw / 2, -fh / 2, fw, fh, 14 * S); g.clip(); var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, kk = Math.max(fw / iw, fh / ih); g.drawImage(im, -iw * kk / 2, -ih * kk / 2, iw * kk, ih * kk); g.restore(); }
  else { var ee = eBack((t - 0.5) / 0.6), rr0 = (ver ? 92 : 150) * S * ee * (1 + 0.04 * Math.sin(t * 4)); if (rr0 > 1){
      g.save(); g.translate(bxC, byC); g.rotate(t * 0.4); g.fillStyle = '#ffd400'; estrela(g, 0, 0, rr0 * 1.15, rr0, 18, 0); g.fill(); g.restore();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bxC, byC, rr0 * 0.82, 0, Math.PI * 2); g.fill(); g.font = Math.round(rr0 * 1.0) + 'px sans-serif'; g.fillText(est.emoji, bxC, byC + rr0 * 0.06); } }
  if (ver) y += bh0 + 30 * S; else y += 10 * S;
  /* informações (só as que cabem acima da legenda) */
  var info = []; var dA = diaArte(F.dia), hA = horaArte(F.hora); if (dA || hA) info.push(['📅', dA + (dA && hA ? '  •  ' : '') + (hA ? '⏰ ' + hA : '')]);
  if (F.local) info.push(['📍', F.local]); if (F.atracoes) info.push(['🎤', F.atracoes]); if (F.entrada) info.push(['🎟️', F.entrada]); if (F.contato) info.push(['📞', /^[\d\s()+\-.]{8,}$/.test(F.contato) ? foneBonito(F.contato) : F.contato]);
  var hh = (ver ? 56 : 50) * S, iy = y + hh / 2, ix = colX, iw2 = ver ? W * 0.9 : W * 0.48, limite = H - baixo - (ver ? 150 + 70 : 110 + 48) * S - 8 * S;
  info.forEach(function(it, i){ if (iy + hh / 2 > limite) return; var a = eOut((t - 0.8 - i * 0.3) / 0.4); if (a > 0){ g.save(); g.globalAlpha = a; g.translate((1 - a) * 60 * S, 0);
    var tx = it[0] + ' ' + it[1]; g.font = 'bold ' + Math.round(30 * S) + 'px ' + FONTE2; cabeTexto(g, tx, iw2 - 36 * S, 30 * S, 'bold', FONTE2); var tw = Math.min(iw2, g.measureText(tx).width + 40 * S);
    g.fillStyle = i == 0 ? '#ffd400' : 'rgba(0,0,0,.42)'; rr(g, ix - tw / 2, iy - hh / 2, tw, hh, hh / 2); g.fill(); g.fillStyle = i == 0 ? '#1b0006' : '#fff'; g.fillText(tx, ix, iy + 2 * S); g.restore(); }
    iy += hh + (ver ? 10 : 12) * S; });
  /* legenda acompanhando a fala */
  var lg = legendaAgora(P, t);
  if (lg){ var by = H - baixo - (ver ? 150 : 110) * S, bw = W * 0.92, bh = (ver ? 140 : 96) * S; g.save(); g.fillStyle = 'rgba(0,0,0,.62)'; rr(g, (W - bw) / 2, by - bh / 2, bw, bh, 18 * S); g.fill();
    var fs = (ver ? 36 : 32) * S; g.font = 'bold ' + Math.round(fs) + 'px ' + FONTE2; var lin = quebra(g, lg.txt, bw - 40 * S); while (lin.length > (ver ? 3 : 2) && fs > 18 * S){ fs *= 0.9; g.font = 'bold ' + Math.round(fs) + 'px ' + FONTE2; lin = quebra(g, lg.txt, bw - 40 * S); }
    var pal = lg.txt.split(/\s+/).length, fr = Math.max(0, Math.min(1, (t - lg.t0) / Math.max(0.3, lg.t1 - lg.t0))), ditas = Math.ceil(fr * pal), cont = 0;
    lin.forEach(function(l, i){ var ws = l.split(' '), ly = by + (i - (lin.length - 1) / 2) * fs * 1.2, lw = g.measureText(l).width, lx = W / 2 - lw / 2; g.textAlign = 'left';
      ws.forEach(function(w){ cont++; g.fillStyle = cont <= ditas ? '#ffd400' : '#fff'; g.fillText(w, lx, ly); lx += g.measureText(w + ' ').width; }); });
    g.restore(); }
  faixaBaixo(g, W, H, S, t, (F.nome || 'FESTA').toUpperCase() + (dA ? ' ★ ' + dA : '') + (hA ? ' ★ ' + hA : '') + (F.local ? ' ★ ' + F.local.toUpperCase() : ''));
}

/* ---------- músicas do celular (guardadas só no aparelho) ---------- */
function idbM(){ return new Promise(function(ok, ruim){ var r = indexedDB.open('ofertaok_mus', 1); r.onupgradeneeded = function(){ r.result.createObjectStore('m'); }; r.onsuccess = function(){ ok(r.result); }; r.onerror = function(){ ruim(r.error); }; }); }
function musGet(k){ return idbM().then(function(d){ return new Promise(function(ok){ var q = d.transaction('m').objectStore('m').get(k); q.onsuccess = function(){ ok(q.result || null); }; q.onerror = function(){ ok(null); }; }); }).catch(function(){ return null; }); }
function musPut(k, v){ return idbM().then(function(d){ d.transaction('m', 'readwrite').objectStore('m').put(v, k); }).catch(function(){}); }
async function decodificaMusica(ab){ var c = new OfflineAudioContext(2, 44100, 44100), b = await c.decodeAudioData(ab.slice(0)); var pk = 0, d = b.getChannelData(0); for (var i = 0; i < d.length; i += 97) pk = Math.max(pk, Math.abs(d[i])); return {buf: b, norm: pk > 0.05 ? Math.min(2, 0.8 / pk) : 1}; }

/* ---------- editor da festa ---------- */
var MUS_CEL = null; /* {buf, norm, nome, k} da música enviada */
var FESTA_IA = {ult: '', t: 0, timer: null}, FVID = {};
function novaFesta(){ editarFesta({seg: 'festa', festa: {nome: '', dia: '', hora: '', local: '', atracoes: '', entrada: '', contato: '', foto: ''}, estilo: 'carro', vozF: '', musica: {tipo: 'app', bed: ''}, linhas: null, textoEditado: false}); }
function editarFesta(o){
  OF = o; OF.seg = 'festa'; OF.festa = OF.festa || {}; TEMP = {}; VID = {}; FVID = {}; sujo = false; MUS_CEL = null; FESTA_IA.ult = '';
  mostra('festaEd'); var F = OF.festa;
  ['nome', 'dia', 'hora', 'local', 'atracoes', 'entrada', 'contato'].forEach(function(k){ $('f_' + k).value = F[k] || ''; });
  pintaFotoFesta(); pintaEstilos(); pintaVozesF(); pintaMusicas(); $('fVids').innerHTML = ''; $('fAudio').innerHTML = ''; $('fSt').textContent = ''; $('fIaSt').textContent = '';
  $('fApagar').classList.toggle('oculto', !OF.id);
  if (OF.musica && OF.musica.tipo == 'arq' && OF.musica.k) musGet(OF.musica.k).then(async function(ab){ if (ab && OF.musica && OF.musica.k){ try { var d = await decodificaMusica(ab); MUS_CEL = {buf: d.buf, norm: d.norm, nome: OF.musica.nome, k: OF.musica.k}; } catch (e) {} } pintaMusicas(); });
  if (!OF.linhas || !OF.linhas.length) refazTextoFesta(false); else pintaTextoFesta();
}
function leFesta(){ var F = OF.festa; ['nome', 'dia', 'hora', 'local', 'atracoes', 'entrada', 'contato'].forEach(function(k){ F[k] = $('f_' + k).value.trim(); }); }
function pintaFotoFesta(){ var f = OF.festa.foto; $('fFotoPrev').innerHTML = f ? '<img src="' + f + '">' : '🎉'; $('fFotoTira').classList.toggle('oculto', !f); }
function pintaEstilos(){
  $('fEstilos').innerHTML = ESTILOS_FESTA.map(function(e){ var v = VOZES_FESTA[e.voz]; return '<div class="voz est' + (OF.estilo == e.id ? ' on' : '') + '" onclick="escEstilo(\'' + e.id + '\')"><div class="tx"><b>' + e.emoji + ' ' + esc(e.nome) + '</b><small>' + esc(e.desc) + '</small><small class="vn">🎙️ ' + esc(v.nome) + ' (' + (v.sexo == 'F' ? 'voz feminina' : 'voz masculina') + ')</small></div><button class="ouvir" onclick="event.stopPropagation();ouvirEstilo(\'' + e.id + '\',this)">▶️ Ouvir amostra</button></div>'; }).join('');
}
function pintaVozesF(){
  var est = estiloFesta(OF.estilo); $('fVoz').innerHTML = '<option value="">Voz do estilo: ' + esc(VOZES_FESTA[est.voz].nome) + '</option>' + Object.keys(VOZES_FESTA).filter(function(k){ return k != est.voz; }).map(function(k){ var v = VOZES_FESTA[k]; return '<option value="' + k + '"' + (OF.vozF == k ? ' selected' : '') + '>' + (v.sexo == 'F' ? '👩 ' : '👨 ') + esc(v.nome) + ' — ' + esc(v.jeito) + '</option>'; }).join('');
  if (OF.vozF == est.voz) OF.vozF = '';
}
function pintaMusicas(){
  var m = OF.musica || {tipo: 'app', bed: ''}, est = estiloFesta(OF.estilo), atual = m.tipo == 'arq' ? 'arq' : (m.bed || est.bed);
  $('fMus').innerHTML = MUSICAS_FESTA.map(function(x){ return '<option value="' + x.id + '"' + (m.tipo != 'arq' && atual == x.id ? ' selected' : '') + '>' + esc(x.nome) + (x.id == est.bed ? ' (combina com o estilo)' : '') + '</option>'; }).join('') +
    (m.tipo == 'arq' ? '<option value="arq" selected>📁 ' + esc(m.nome || 'Música do celular') + (MUS_CEL ? '' : ' (envie de novo neste aparelho)') + '</option>' : '');
}
window.escEstilo = function(id){ OF.estilo = id; OF.vozF = ''; if (OF.musica && OF.musica.tipo != 'arq') OF.musica = {tipo: 'app', bed: ''}; sujo = true; pintaEstilos(); pintaVozesF(); pintaMusicas(); if (!OF.textoEditado) refazTextoFesta(true); };
var OUV_F = null;
window.ouvirEstilo = function(id, b){
  if (OUV_F){ var era = OUV_F.id; try { OUV_F.a.pause(); } catch (e) {} OUV_F = null; pintaEstilos(); if (era == id) return; }
  var a = new Audio('festas/' + id + '.mp3?v=1'); b.textContent = '⏳ …'; OUV_F = {id: id, a: a};
  a.onplaying = function(){ b.textContent = '⏹️ Parar'; }; a.onended = function(){ if (OUV_F && OUV_F.a === a){ OUV_F = null; b.textContent = '▶️ Ouvir amostra'; } };
  a.onerror = function(){ b.textContent = '▶️ Ouvir amostra'; OUV_F = null; toast('Não tocou a amostra. Confira a internet.', '#b91c1c'); };
  a.play().catch(function(){ b.textContent = '▶️ Ouvir amostra'; });
};
function refazTextoFesta(comIA){
  leFesta(); var est = estiloFesta(OF.estilo); OF.linhas = linhasTemplate(OF.festa, est, OF.semente || (OF.semente = Math.floor(Math.random() * 1000))); OF.textoEditado = false; OF.textoIA = false; pintaTextoFesta();
  if (comIA) agendaIA();
}
function pintaTextoFesta(){ $('fTexto').value = (OF.linhas || []).join('\n'); }
function festaPronta(){ var F = OF.festa; return F.nome && F.dia && F.hora && F.local; }
function agendaIA(){ clearTimeout(FESTA_IA.timer); FESTA_IA.timer = setTimeout(function(){ if (festaPronta() && !OF.textoEditado) textoIA(true); }, 2500); }
async function textoIA(auto){
  leFesta(); if (!festaPronta()){ if (!auto) toast('Preencha nome, dia, hora e local da festa.', '#b91c1c', 3500); return; }
  var est = estiloFesta(OF.estilo), k = JSON.stringify([OF.festa.nome, OF.festa.dia, OF.festa.hora, OF.festa.local, OF.festa.atracoes, OF.festa.entrada, OF.festa.contato, OF.estilo]);
  if (auto && (k == FESTA_IA.ult || Date.now() - FESTA_IA.t < 15000)) return; FESTA_IA.ult = k; FESTA_IA.t = Date.now();
  var b = $('fIA'); b.disabled = true; $('fIaSt').textContent = '🤖 A IA está escrevendo no estilo ' + est.nome + '…';
  try { var L = await iaFesta(OF.festa, est, function(m){ $('fIaSt').textContent = m; });
    if (auto && OF.textoEditado){ $('fIaSt').textContent = ''; b.disabled = false; return; }
    OF.linhas = L; OF.textoIA = true; OF.textoEditado = false; pintaTextoFesta(); sujo = true; $('fIaSt').textContent = '✅ Texto da IA pronto. Pode mudar o que quiser na caixa (cada linha vira uma legenda).'; }
  catch (x) { $('fIaSt').textContent = '⚠️ A IA não respondeu agora (' + (x.message == 'sem-chave' ? 'chave da IA não salva' : x.message) + '). Deixei o texto pronto do app; pode mudar à vontade.'; }
  b.disabled = false;
}
function leTextoFesta(){ OF.linhas = $('fTexto').value.split('\n').map(function(l){ return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean).slice(0, 16); }
function validaFesta(){ leFesta(); leTextoFesta(); var F = OF.festa;
  if (!F.nome) return 'Digite o nome da festa.'; if (!F.dia) return 'Escolha o dia da festa.'; if (!F.hora) return 'Digite a hora da festa.'; if (!F.local) return 'Digite o local da festa.';
  if (!OF.linhas.length) return 'O texto do locutor está vazio.'; return ''; }

/* ligações dos campos */
(function(){
  ['nome', 'dia', 'hora', 'local', 'atracoes', 'entrada', 'contato'].forEach(function(k){ $('f_' + k).addEventListener('input', function(){ if (!OF || OF.seg != 'festa') return; sujo = true; leFesta(); if (!OF.textoEditado){ var est = estiloFesta(OF.estilo); OF.linhas = linhasTemplate(OF.festa, est, OF.semente || 1); OF.textoIA = false; pintaTextoFesta(); agendaIA(); } }); });
  $('fTexto').addEventListener('input', function(){ OF.textoEditado = true; sujo = true; leTextoFesta(); clearTimeout(FESTA_IA.timer); });
  $('fIA').onclick = function(){ FESTA_IA.ult = ''; OF.textoEditado = false; textoIA(false); };
  $('fRefaz').onclick = function(){ OF.semente = Math.floor(Math.random() * 1000); refazTextoFesta(false); sujo = true; toast('Texto novo pronto ✅'); };
  $('fVoz').onchange = function(){ OF.vozF = this.value; sujo = true; };
  $('fMus').onchange = function(){ var v = this.value; if (v == 'arq') return; OF.musica = {tipo: 'app', bed: v}; sujo = true; };
  $('fMusOuvir').onclick = async function(){ var b = this; if (OUV_F){ try { OUV_F.a.pause(); } catch (e) {} OUV_F = null; } if (b._src){ try { b._src.stop(); } catch (e) {} b._src = null; b.textContent = '▶️ Ouvir a música'; return; }
    var ac = audioCtx(), m = OF.musica || {}, buf; b.textContent = '⏳ …';
    try { if (m.tipo == 'arq'){ if (!MUS_CEL) throw new Error('sem'); buf = MUS_CEL.buf; } else buf = await previaMusica(m.bed || estiloFesta(OF.estilo).bed);
      var s = ac.createBufferSource(), gg = ac.createGain(); gg.gain.value = m.tipo == 'arq' ? MUS_CEL.norm * 0.6 : 1; s.buffer = buf; s.connect(gg); gg.connect(ac.destination); s.start(); if (m.tipo == 'arq') s.stop(ac.currentTime + 10); b._src = s; b.textContent = '⏹️ Parar'; s.onended = function(){ if (b._src === s){ b._src = null; b.textContent = '▶️ Ouvir a música'; } }; }
    catch (e) { b.textContent = '▶️ Ouvir a música'; toast(e.message == 'sem' ? 'Envie a música de novo neste celular.' : 'Não tocou.', '#b91c1c'); } };
  $('fMusEnviar').onclick = function(){ $('fMusArq').click(); };
  $('fMusArq').onchange = async function(){ var f = this.files[0]; this.value = ''; if (!f) return;
    if (f.size > 20 * 1048576){ toast('Música muito grande (máx. 20 MB).', '#b91c1c', 4000); return; }
    $('fMusSt').textContent = '⏳ Abrindo a música…';
    try { var ab = await f.arrayBuffer(), d = await decodificaMusica(ab), k = 'm' + hash(f.name + f.size); await musPut(k, ab);
      MUS_CEL = {buf: d.buf, norm: d.norm, nome: f.name.slice(0, 60), k: k}; OF.musica = {tipo: 'arq', nome: MUS_CEL.nome, k: k}; sujo = true; pintaMusicas();
      $('fMusSt').textContent = '✅ Música "' + MUS_CEL.nome + '" pronta (' + Math.round(d.buf.duration) + ' s). Ela fica guardada só neste celular. Use só músicas que você pode usar (sem direitos de terceiros).'; }
    catch (e) { $('fMusSt').textContent = '❌ Não consegui abrir essa música. Tente um arquivo MP3 ou M4A.'; } };
  $('fFotoBt').onclick = function(){ $('fFotoArq').click(); };
  $('fFotoTira').onclick = function(){ OF.festa.foto = ''; sujo = true; pintaFotoFesta(); };
  $('fFotoArq').onchange = async function(){ var f = this.files[0]; this.value = ''; if (!f) return; try { var c = await arquivoParaTela(f, 1024); OF.festa.foto = telaParaDado(c, 720, 110000, false); sujo = true; pintaFotoFesta(); } catch (e) { toast('Não abriu essa foto.', '#b91c1c'); } };
  $('fVoltar').onclick = function(){ if (!sujo){ abreHome(); return; } confirmaSair(function(){ sujo = false; abreHome(); }, {titulo: 'Sair sem salvar?', texto: 'As mudanças deste anúncio ainda não foram salvas.'}); };
  $('fSalvar').onclick = function(){ salvarFesta(false); };
  $('fApagar').onclick = async function(){ if (!OF.id || !confirm('Apagar este anúncio de festa?')) return; try { await DB.apaga(OF.id); toast('Apagado'); sujo = false; abreHome(); } catch (x) { toast('Não apagou: ' + (x.code || x.message), '#b91c1c'); } };
  $('fGerar').onclick = function(){ gerarFesta({}); };
})();
async function salvarFesta(quieto){
  var e = validaFesta(); if (e && !quieto){ toast(e, '#b91c1c', 4000); return; }
  var c = JSON.parse(JSON.stringify(OF)); delete c.semente;
  try { var id = await DB.salva(c); if (!OF.id){ OF.id = id; $('fApagar').classList.remove('oculto'); } sujo = false; if (!quieto) toast('💾 Salvo!'); } catch (x) { toast('Não salvou: ' + (x.code || x.message), '#b91c1c', 4000); }
}

/* ---------- gerar: áudio (locutor + música + ducking) e vídeo com a arte e legenda ---------- */
var GERA_F = null;
window.cancelaFesta = function(){ if (!GERA_F) return; GERA_F.cancelado = true; if (window.cancelaEspera) window.cancelaEspera('cancelado'); if (window.cancelaGravacao) window.cancelaGravacao('cancelado'); };
window.gerarFestaDeNovo = function(o){ gerarFesta(o || {}); };
function fst(t, p){ $('fSt').textContent = t; if (p != null) $('fPr').style.width = Math.round(p * 100) + '%'; }
async function gerarFesta(o){
  if (GERA_F) return; var e = validaFesta(); if (e){ toast(e, '#b91c1c', 4000); return; }
  var fmts = []; if ($('ffV').checked) fmts.push({nome: 'vertical', w: 720, h: 1280, bits: 2200000}); if ($('ffH').checked) fmts.push({nome: 'horizontal', w: 1280, h: 720, bits: 2400000});
  if (o.vozF){ OF.vozF = o.vozF; pintaVozesF(); }
  var est = estiloFesta(OF.estilo), voz = vozFestaObj(est, OF.vozF), ac = audioCtx(), G = GERA_F = {cancelado: false}, wav = null, b = $('fGerar');
  b.disabled = true; GRAVANDO = true; $('fGerando').classList.remove('oculto'); $('fAc').innerHTML = '<button class="bt cz peq" onclick="cancelaFesta()">✖️ Cancelar</button>'; $('fVids').innerHTML = ''; $('fAudio').innerHTML = '';
  $('fGerando').scrollIntoView({block: 'center', behavior: 'smooth'});
  try {
    var linhas = OF.linhas.slice(), texto = linhas.join('\n\n');
    fst('🎙️ Gerando a voz de ' + voz.nome + '…', 0.03);
    if (!o.semVoz){ var ck = 'f1|' + voz.id + '|' + hash(texto); wav = await idbGet(ck);
      if (!wav){ var t0 = Date.now(), key = await comTempo(pegaChave(), 15000, 'sem-chave'); wav = await geraFala(texto, voz, key, function(m){ fst(m, 0.03 + Math.min(0.2, (Date.now() - t0) / 150000 * 0.2)); }); idbPut(ck, wav); } }
    if (G.cancelado) throw new Error('cancelado');
    fst('🎵 Juntando a voz com a música (a música abaixa quando o locutor fala)…', 0.26); await respira();
    var mus = OF.musica && OF.musica.tipo == 'arq' ? (MUS_CEL ? {buf: MUS_CEL.buf, norm: MUS_CEL.norm} : null) : {bed: (OF.musica && OF.musica.bed) || est.bed};
    if (OF.musica && OF.musica.tipo == 'arq' && !MUS_CEL) toast('A música do celular não está neste aparelho; usei a música do estilo.', '#b45309', 5000);
    var mix = await comTempo(mixarFesta(wav, voz, est, linhas, mus), 90000, 'tempo-mix'); window.OK_FESTA = {legendas: mix.legendas, total: mix.total, voz: voz.nome, gem: voz.gem, estilo: est.id};
    var wavBlob = bufParaWav(mix.buf); FVID.audio = wavBlob; mostraAudioFesta(wavBlob, mix.legendas);
    if (G.cancelado) throw new Error('cancelado');
    if (fmts.length){
      fst('🖼️ Preparando a arte…', 0.32); aplicaVisualFesta(est); limpaCacheVideo();
      var foto = OF.festa.foto ? await comTempo(carregaImg(OF.festa.foto), 15000, 'img').catch(function(){ return null; }) : null;
      var P = {festa: true, F: OF.festa, est: est, foto: foto, legendas: mix.legendas, total: mix.total, cenas: [{tipo: 'festa', t0: 0, t1: mix.total}], of: {produtos: []}};
      var res = await gravaVideos(ac, P, mix.buf, fmts, function(p, n, tot, f){ fst('🎬 Montando vídeo' + (tot > 1 ? ' ' + (n + 1) + ' de ' + tot : '') + ' (' + (f.nome == 'vertical' ? '📱 celular' : '📺 TV') + ')… ' + Math.round(p * 100) + '% — falta ~' + Math.max(0, Math.ceil(P.total * (1 - p))) + ' s', 0.35 + 0.65 * (n + p) / tot); });
      FVID.videos = res.videos; FVID.tipo = res.tipo; mostraVideosFesta();
    }
    fst('✅ Pronto!', 1); $('fAc').innerHTML = ''; toast('Anúncio pronto! 🎉'); await salvarFesta(true);
  } catch (x) {
    var m = x && x.message || 'falhou';
    if (/^oculto|^saiu/.test(m)){ fst('⚠️ Parou porque o app saiu da tela. Deixe esta tela aberta até terminar.', 0); $('fAc').innerHTML = '<button class="bt peq" onclick="gerarFestaDeNovo()">🔄 Tentar de novo</button>'; }
    else if (m == 'cancelado'){ fst('Cancelado.', 0); $('fAc').innerHTML = '<button class="bt peq" onclick="gerarFestaDeNovo()">🔄 Gerar de novo</button>'; }
    else { console.error(x); var outra = Object.keys(VOZES_FESTA).filter(function(k){ return k != (OF.vozF || est.voz); })[0];
      fst('❌ ' + msgErro(m), 0);
      $('fAc').innerHTML = '<button class="bt peq" onclick="gerarFestaDeNovo()">🔄 Tentar de novo</button>' + (!wav && m != 'sem-chave' ? '<button class="bt az peq" onclick="gerarFestaDeNovo({vozF:\'' + outra + '\'})">🎙️ Tentar com ' + esc(VOZES_FESTA[outra].nome) + '</button>' : '') + (!wav ? '<button class="bt cz peq" onclick="gerarFestaDeNovo({semVoz:true})">🎵 Só música com legenda (sem locutor)</button>' : ''); }
  } finally { GERA_F = null; GRAVANDO = false; b.disabled = false; }
}
function aplicaVisualFesta(est){ VC.a = est.cor.a; VC.b = est.cor.b; VC.c = est.cor.c; }
function nomeArqF(ext, qual){ return 'festa-' + (OF.festa.nome || 'evento').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + (qual ? '-' + qual : '') + '.' + ext; }
function mostraAudioFesta(bl, legs){
  var u = URL.createObjectURL(bl);
  $('fAudio').innerHTML = '<div class="vid"><b>🎧 Áudio do anúncio</b> <small class="d">' + (bl.size / 1048576).toFixed(1) + ' MB • WAV</small><audio id="fAud" src="' + u + '" controls style="width:100%;margin:8px 0"></audio><div class="legenda" id="fLeg">▶️ Toque no play: a legenda acompanha a fala.</div>' +
    '<div class="lin"><a class="bt vd peq" href="' + u + '" download="' + nomeArqF('wav') + '">⬇️ Baixar áudio</a><button class="bt az peq" onclick="compartilhaFesta(\'audio\')">📤 WhatsApp</button></div></div>';
  var a = $('fAud'), leg = $('fLeg'), raf = null;
  function at(){ var t = a.currentTime, l = null; legs.forEach(function(x){ if (t >= x.t0 - 0.05 && t <= x.t1 + 0.4) l = x; }); leg.textContent = l ? l.txt : (t < (legs[0] || {}).t0 ? '🎵' : ''); if (!a.paused) raf = requestAnimationFrame(at); }
  a.onplay = function(){ cancelAnimationFrame(raf); at(); }; a.onseeked = at; a.onpause = function(){ cancelAnimationFrame(raf); };
}
function mostraVideosFesta(){
  var h = ''; ['vertical', 'horizontal'].forEach(function(f){ var bl = FVID.videos && FVID.videos[f]; if (!bl) return; var u = URL.createObjectURL(bl), ext = /mp4/.test(FVID.tipo) ? 'mp4' : 'webm';
    h += '<div class="vid"><b>' + (f == 'vertical' ? '📱 Vídeo celular (em pé)' : '📺 Vídeo TV (deitado)') + '</b> <small class="d">' + (bl.size / 1048576).toFixed(1) + ' MB</small><video src="' + u + '" controls playsinline></video>' +
      '<div class="lin"><a class="bt vd peq" href="' + u + '" download="' + nomeArqF(ext, f == 'vertical' ? 'celular' : 'tv') + '">⬇️ Baixar</a><button class="bt az peq" onclick="compartilhaFesta(\'' + f + '\')">📤 WhatsApp / Insta</button></div></div>'; });
  $('fVids').innerHTML = h;
}
window.compartilhaFesta = async function(f){
  var bl = f == 'audio' ? FVID.audio : FVID.videos && FVID.videos[f]; if (!bl) return;
  var ext = f == 'audio' ? 'wav' : (/mp4/.test(FVID.tipo) ? 'mp4' : 'webm'), arq = new File([bl], nomeArqF(ext, f == 'audio' ? '' : f == 'vertical' ? 'celular' : 'tv'), {type: bl.type});
  if (navigator.canShare && navigator.canShare({files: [arq]})){ try { await navigator.share({files: [arq], title: OF.festa.nome, text: OF.festa.nome + ' 🎉'}); } catch (e) {} }
  else toast('Este celular não deixa compartilhar direto. Toque em ⬇️ Baixar e mande pelo WhatsApp.', '#b45309', 5000);
};
