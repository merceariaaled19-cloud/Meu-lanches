/* CenaSua — cenas prontas. Todas as imagens foram criadas por IA com personagens fictícios.
   Nada de obra real, personagem famoso, logo ou figurino marcante.
   fala = o que o personagem (você) fala na cena; leg = legenda na tela. */
(function(){
var CK = window.CK || (window.CK = {});
CK.CATS = [
 {id: 'novela', nome: 'Novela', emo: '💔', cor: '#c2185b', modelos: [
  {id: 'novela_casamento', nome: 'O Casamento Interrompido', mus: 'drama', cenas: [
   {img: 'novela_casamento_1', leg: 'O grande dia chegou…', fala: 'Hoje é o dia mais feliz da minha vida. Nada pode dar errado!'},
   {img: 'novela_casamento_2', leg: '…até alguém gritar: EU ME OPONHO!', fala: 'Como assim, você se opõe?! Isso não vai ficar assim!'}]},
  {id: 'novela_heranca', nome: 'A Herança da Fazenda', mus: 'drama', cenas: [
   {img: 'novela_heranca_1', leg: 'Uma carta antiga revelou tudo…', fala: 'Esta carta muda tudo. A fazenda sempre foi minha!'},
   {img: 'novela_heranca_2', leg: 'E agora a fazenda tem dono.', fala: 'Podem vir todos. Daqui eu não saio nunca mais!'}]}
 ]},
 {id: 'mini', nome: 'Minissérie', emo: '🎬', cor: '#5e35b1', serie: 'O Mistério da Taberna', modelos: [
  {id: 'mini_ep1', ep: 1, nome: 'Episódio 1 — O Mapa', mus: 'misterio', cenas: [
   {img: 'mini_ep1_1', leg: 'Uma noite comum na taberna…', fala: 'Mais uma noite tranquila aqui no balcão. Ou será que não?'},
   {img: 'mini_ep1_2', leg: 'Até aparecer um mapa misterioso.', fala: 'Um mapa escondido atrás da prateleira? Isso é um tesouro!'}]},
  {id: 'mini_ep2', ep: 2, nome: 'Episódio 2 — O Rio', mus: 'misterio', cenas: [
   {img: 'mini_ep2_1', leg: 'O mapa apontava para o rio.', fala: 'O mapa diz para seguir o rio no escuro. Vamos nessa!'},
   {img: 'mini_ep2_2', leg: 'A trilha na mata guardava segredos.', fala: 'Ouvi um barulho na mata. Tem alguém me seguindo!'}]},
  {id: 'mini_ep3', ep: 3, nome: 'Episódio 3 — O Tesouro', mus: 'festa', cenas: [
   {img: 'mini_ep3_1', leg: 'Finalmente… o baú!', fala: 'Eu sabia! O tesouro era verdade!'},
   {img: 'mini_ep3_2', leg: 'E a festa foi na beira do rio!', fala: 'Hoje a festa é por minha conta, pessoal!'}]}
 ]},
 {id: 'acao', nome: 'Ação', emo: '💥', cor: '#e65100', modelos: [
  {id: 'acao_ponte', nome: 'Perseguição na Ponte', mus: 'acao', cenas: [
   {img: 'acao_ponte_1', leg: 'Eles estão logo atrás!', fala: 'Segura firme! Eles estão chegando!'},
   {img: 'acao_ponte_2', leg: 'Missão cumprida na ponte.', fala: 'Missão cumprida. Ninguém escapa de mim.'}]},
  {id: 'acao_resgate', nome: 'Resgate no Rio', mus: 'acao', cenas: [
   {img: 'acao_resgate_1', leg: 'Tempestade no rio!', fala: 'Ninguém fica para trás! Acelera essa lancha!'},
   {img: 'acao_resgate_2', leg: 'A busca continua na mata.', fala: 'Encontrei a trilha. Todo mundo vai voltar para casa!'}]}
 ]},
 {id: 'comedia', nome: 'Comédia', emo: '😂', cor: '#2e7d32', modelos: [
  {id: 'comedia_churrasco', nome: 'O Churrasco que Deu Errado', mus: 'comedia', cenas: [
   {img: 'comedia_churrasco_1', leg: 'Hoje eu sou o churrasqueiro!', fala: 'Pode deixar comigo, eu sou profissional na churrasqueira!'},
   {img: 'comedia_churrasco_2', leg: 'Ponto da carne: carvão.', fala: 'Bem passada, do jeito que vocês gostam… né?'}]},
  {id: 'comedia_academia', nome: 'Primeiro Dia na Academia', mus: 'comedia', cenas: [
   {img: 'comedia_academia_1', leg: 'Primeiro dia: só o peso leve.', fala: 'Esse peso aqui é só o aquecimento, viu?'},
   {img: 'comedia_academia_2', leg: 'Cinco minutos depois…', fala: 'Alguém chama a ambulância… ou um suco.'}]}
 ]},
 {id: 'memes', nome: 'Memes', emo: '🤣', cor: '#f9a825', meme: true, modelos: [
  {id: 'meme_fiado', nome: 'Eu quando o cliente pede fiado', mus: 'meme', cenas: [
   {img: 'meme_fiado_1', leg: 'EU QUANDO O CLIENTE PEDE FIADO', fala: 'Fiado? Só amanhã, meu amor.'}]},
  {id: 'meme_segunda', nome: 'Segunda-feira de manhã', mus: 'meme', cenas: [
   {img: 'meme_segunda_1', leg: 'EU NA SEGUNDA ÀS 6 DA MANHÃ', fala: 'Não. Hoje não. Cinco minutinhos.'}]},
  {id: 'meme_pix', nome: 'Quando o Pix cai', mus: 'meme', cenas: [
   {img: 'meme_pix_1', leg: 'QUANDO O PIX CAI NA CONTA', fala: 'Caiu! O Pix caiu! Hoje tem!'}]}
 ]},
 {id: 'cinema', nome: 'Cenas de cinema recriadas', emo: '🎞️', cor: '#37474f', modelos: [
  {id: 'cine_perseguicao', nome: 'Perseguição de Carro', mus: 'acao', cenas: [
   {img: 'cine_perseguicao_1', leg: 'Uma noite. Uma estrada. Uma fuga.', fala: 'Aperta o cinto. Essa noite vai ser longa.'},
   {img: 'cine_perseguicao_2', leg: 'Ninguém me alcança.', fala: 'Eles nunca vão me alcançar.'}]},
  {id: 'cine_chuva', nome: 'Encontro na Chuva', mus: 'romance', cenas: [
   {img: 'cine_chuva_1', leg: 'Debaixo da chuva…', fala: 'Eu esperei a vida inteira por esse momento.'},
   {img: 'cine_chuva_2', leg: '…o reencontro.', fala: 'Você voltou. Agora ninguém separa a gente.'}]},
  {id: 'cine_heroi', nome: 'Herói Salvando a Cidade', mus: 'heroi', cenas: [
   {img: 'cine_heroi_1', leg: 'A cidade precisava de alguém…', fala: 'Essa cidade pode contar comigo.'},
   {img: 'cine_heroi_2', leg: '…e esse alguém sou eu!', fala: 'Pode dormir tranquila, cidade. Eu estou de plantão!'}]}
 ]},
 {id: 'desenho', nome: 'Desenho de família na TV', emo: '📺', cor: '#0288d1', estilo: 'desenho', modelos: [
  {id: 'desenho_familia', nome: 'Noite de Família', mus: 'sitcom', cenas: [
   {img: 'desenho_familia_1', leg: 'Noite de família no sofá.', fala: 'Ninguém mexe no controle da TV hoje!'},
   {img: 'desenho_familia_2', leg: 'Hoje eu faço a janta!', fala: 'Panqueca bem passada é a especialidade da casa!'}]}
 ]},
 {id: 'anime', nome: 'Anime de luta', emo: '⚡', cor: '#1565c0', estilo: 'anime', modelos: [
  {id: 'anime_luta', nome: 'O Poder Despertou', mus: 'anime', cenas: [
   {img: 'anime_luta_1', leg: 'O poder despertou!', fala: 'Esse é o meu poder máximo! Aaaah!'},
   {img: 'anime_luta_2', leg: 'Golpe final!', fala: 'Prepare-se! Esse é o meu golpe final!'}]}
 ]}
];
CK.modelo = function(id){ for (var i = 0; i < CK.CATS.length; i++) for (var j = 0; j < CK.CATS[i].modelos.length; j++) if (CK.CATS[i].modelos[j].id == id) return {cat: CK.CATS[i], m: CK.CATS[i].modelos[j]}; return null; };
})();
