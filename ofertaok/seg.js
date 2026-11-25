/* Oferta Okê — SEGMENTOS (ramo da loja). Carrega depois de voz.js/foto.js/video.js e antes do app.js.
   Cada segmento muda: textos do locutor, unidades, dicas dos campos, cores/títulos do vídeo, jeito de falar (TTS) e o pedido para a IA.
   'mercado' é o padrão e continua igual ao que já existia. 'festa' abre o editor de Festas e Eventos (festa.js). */

/* unidades novas (as de mercado continuam iguais em voz.js) */
(function(){
  var U = {mes: ['por mês', '/MÊS'], trimestre: ['no trimestre', '/TRIMESTRE'], semestre: ['no semestre', '/SEMESTRE'], ano: ['no plano anual', 'PLANO ANUAL'], aula: ['por aula', 'A AULA'],
    diaria: ['a diária', 'A DIÁRIA'], dia: ['por dia', '/DIA'], semana: ['por semana', '/SEMANA'], hora: ['por hora', '/HORA'], fds: ['no fim de semana', 'FIM DE SEMANA'],
    m2: ['o metro quadrado', 'O M²'], m3: ['o metro cúbico', 'O M³'], saco: ['o saco', 'O SACO'], milheiro: ['o milheiro', 'O MILHEIRO'], metro: ['o metro', 'O METRO'], barra: ['a barra', 'A BARRA'], lata: ['a lata', 'A LATA'],
    consulta: ['a consulta', 'A CONSULTA'], sessao: ['a sessão', 'A SESSÃO'], exame: ['o exame', 'O EXAME'], procedimento: ['o procedimento', 'PROCEDIMENTO'],
    servico: ['o serviço', 'O SERVIÇO'], combo: ['o combo', 'O COMBO'], porcao: ['a porção', 'A PORÇÃO'], prato: ['o prato', 'O PRATO'],
    peca: ['a peça', 'A PEÇA'], conjunto: ['o conjunto', 'O CONJUNTO'], par: ['o par', 'O PAR'], banho: ['o banho', 'O BANHO'], avista: ['à vista', 'À VISTA'], pessoa: ['por pessoa', 'POR PESSOA'], pacote2: ['o pacote', 'O PACOTE']};
  for (var k in U){ UNIDADES[k] = U[k][0]; UNI_TAG[k] = U[k][1]; }
})();
var UN_ROT = {'': '— (não falar)', kg: 'quilo (kg)', un: 'unidade', pacote: 'pacote', litro: 'litro', duzia: 'dúzia', bandeja: 'bandeja', caixa: 'caixa', fardo: 'fardo',
  mes: 'por mês', trimestre: 'trimestre', semestre: 'semestre', ano: 'plano anual', aula: 'por aula', diaria: 'diária', dia: 'por dia', semana: 'por semana', hora: 'por hora', fds: 'fim de semana',
  m2: 'metro quadrado (m²)', m3: 'metro cúbico (m³)', saco: 'saco', milheiro: 'milheiro', metro: 'metro', barra: 'barra', lata: 'lata', consulta: 'consulta', sessao: 'sessão', exame: 'exame', procedimento: 'procedimento',
  servico: 'serviço', combo: 'combo', porcao: 'porção', prato: 'prato', peca: 'peça', conjunto: 'conjunto', par: 'par', banho: 'banho', avista: 'à vista', pessoa: 'por pessoa', pacote2: 'pacote'};

/* L = loja. Frases sem promessa exagerada; clínica com linguagem de saúde responsável. */
var SEGS = {
  mercado: {emoji: '🛒', nome: 'Mercadinho', item: 'produto', itens: 'produtos', titItens: 'Os produtos', exLoja: 'Ex.: Mercadinho Sol Nascente', exItem: 'Ex.: Arroz tipo 1 pacote 5kg', exPreco: '7,99',
    un: ['', 'kg', 'un', 'pacote', 'litro', 'duzia', 'bandeja', 'caixa', 'fardo'], oficial: true, parcelas: false,
    cor: {a: '#d0101f', b: '#7a0010', c: '#ff3b3b'}, vt: {}, ia: 'Mercadinho / supermercado de bairro: clima de feirão, preço baixo, economia.'},
  veiculos: {emoji: '🚗', nome: 'Veículos', item: 'veículo', itens: 'veículos', titItens: 'Os veículos', exLoja: 'Ex.: Estrela Azul Veículos', exItem: 'Ex.: Hatch 1.0 completo 2021', exPreco: '69.900,00',
    un: ['', 'avista'], oficial: false, parcelas: true, aPartir: true,
    abre: ['Atenção! Tá na hora de trocar de carro no {L}!', 'Quer sair de carro novo? Vem pro {L}!', 'Seu próximo veículo está no {L}!'],
    item: 'veículo', frase: ['{N}, {P}{U}!', '{N}: {P}{U}. Confira!', 'Tem {N} por {P}{U}!'],
    fecha: ['Vem fazer seu test drive no {L}!', 'Avaliamos seu usado na troca. Vem pro {L}!', 'Faça uma simulação sem compromisso no {L}!'],
    aviso: 'Condições sujeitas à aprovação de crédito. Fotos ilustrativas.', fala: 'Condições sujeitas à aprovação de crédito.',
    cor: {a: '#1d4ed8', b: '#0b1f4d', c: '#3b82f6'}, vt: {t1: 'FEIRÃO', t2: 'DE VEÍCULOS!', f1: 'SEU CARRO NOVO', f2: 'SÓ NO', f2b: 'FAÇA SEU TEST DRIVE', fim: 'VEM PRO', f3: 'ACEITAMOS SEU USADO', emoji: '🚗'},
    cena: 'A punchy Brazilian radio commercial for a car dealership (loja de veículos) weekend sale.', notas: 'Confident, energetic car-dealer announcer, upbeat and persuasive but clear; stress the model, the price and the number of installments.',
    ia: 'Loja de automóveis/veículos: fale modelo, ano, versão, preço à vista ou "a partir de", entrada e parcelas quando houver, avaliação do usado na troca, test drive. Nunca prometa aprovação de crédito garantida.'},
  academia: {emoji: '💪', nome: 'Academia', item: 'plano', itens: 'planos', titItens: 'Os planos', exLoja: 'Ex.: Academia Pulso Forte', exItem: 'Ex.: Plano mensal musculação', exPreco: '89,90',
    un: ['mes', 'trimestre', 'semestre', 'ano', 'aula', 'diaria', ''], unPadrao: 'mes', oficial: false, parcelas: false, aPartir: true,
    abre: ['Bora treinar? A {L} está com planos especiais!', 'Chegou a hora de sair do sofá! Vem pra {L}!', 'Atenção, galera! Matrícula com condição especial na {L}!'],
    frase: ['{N}: {P}{U}!', '{N} por apenas {P}{U}!', 'Tem {N} a {P}{U}!'],
    fecha: ['Vem fazer uma aula experimental na {L}!', 'Sua melhor versão começa hoje. Vem pra {L}!', 'Bora! Te esperamos na {L}!'],
    aviso: 'Consulte condições e horários. Procure orientação profissional.', fala: '',
    cor: {a: '#ea580c', b: '#1c1917', c: '#f97316'}, vt: {t1: 'BORA', t2: 'TREINAR!', f1: 'PLANOS ESPECIAIS', f2: 'SÓ NA', f2b: 'MATRÍCULA ABERTA', fim: 'VEM PRA', f3: 'AULA EXPERIMENTAL', emoji: '💪'},
    cena: 'An energetic Brazilian gym (academia) radio spot with a pumping workout beat.', notas: 'Motivating fitness coach energy, strong and positive, like a personal trainer hyping a class; stress the plan and the monthly price.',
    ia: 'Academia: planos com preço por mês (R$/mês), matrícula, aula experimental, modalidades (musculação, funcional, dança, lutas), horários. Motivação positiva, sem prometer resultado de corpo, peso ou saúde.'},
  aluguel: {emoji: '🏠', nome: 'Aluguéis', item: 'item para alugar', itens: 'itens', titItens: 'O que está para alugar', exLoja: 'Ex.: Aluga Fácil Ipê', exItem: 'Ex.: Casa 2 quartos no Centro / Betoneira 400 L', exPreco: '1.200,00',
    un: ['mes', 'dia', 'diaria', 'semana', 'hora', 'fds', ''], unPadrao: 'mes', oficial: false, parcelas: false, aPartir: true,
    abre: ['Procurando onde morar ou o que alugar? Fala com a {L}!', 'Atenção! Tem aluguel com preço bom na {L}!', 'Precisa alugar? A {L} resolve!'],
    frase: ['{N}: {P}{U}!', '{N} por {P}{U}!', 'Tem {N}, aluguel de {P}{U}!'],
    fecha: ['Agende sua visita com a {L}!', 'Chama a {L} e garanta o seu!', 'Fale agora com a {L}!'],
    aviso: 'Valores sujeitos a análise de cadastro e disponibilidade.', fala: 'Sujeito a disponibilidade.',
    cor: {a: '#0f766e', b: '#073b36', c: '#14b8a6'}, vt: {t1: 'ALUGA-SE', t2: 'PREÇO BOM!', f1: 'ALUGUEL FÁCIL', f2: 'FALE COM', f2b: 'AGENDE SUA VISITA', fim: 'FALE COM', f3: 'DISPONIBILIDADE LIMITADA', emoji: '🏠'},
    cena: 'A friendly Brazilian radio spot for a rental business (imóveis e equipamentos para alugar).', notas: 'Warm, trustworthy and upbeat announcer, clear and easy to understand; stress what is for rent, the price per month or per day, and how to contact.',
    ia: 'Aluguel de imóveis ou equipamentos: diga o que é, onde fica ou para que serve, valor por mês/dia/diária, como agendar visita ou reservar. Sem promessas de aprovação.'},
  construcao: {emoji: '🧱', nome: 'Material de construção', item: 'produto', itens: 'produtos', titItens: 'Os produtos', exLoja: 'Ex.: Depósito Tijolo Firme', exItem: 'Ex.: Cimento saco 50kg', exPreco: '36,90',
    un: ['', 'un', 'saco', 'm2', 'm3', 'metro', 'barra', 'milheiro', 'lata', 'kg'], oficial: false, parcelas: true,
    abre: ['Vai construir ou reformar? Vem pro {L}!', 'Atenção, construtor! Tem oferta no {L}!', 'Obra boa começa no {L}!'],
    frase: ['{N}, por apenas {P}{U}!', '{N}: só {P}{U}!', 'E tem {N} por {P}{U}!'],
    fecha: ['Entregamos na sua obra. Chama o {L}!', 'Corre pro {L} e economize na sua obra!', 'Tudo para sua obra no {L}!'],
    aviso: 'Ofertas válidas enquanto durarem os estoques.', fala: 'Ofertas válidas enquanto durarem os estoques.',
    cor: {a: '#c2410c', b: '#44200b', c: '#f59e0b'}, vt: {t1: 'OFERTAS', t2: 'PARA SUA OBRA!', f1: 'CONSTRUA E REFORME', f2: 'SÓ NO', f2b: 'ENTREGAMOS NA OBRA', fim: 'CORRE PRO', f3: 'TUDO PARA SUA OBRA', emoji: '🧱'},
    cena: 'A lively Brazilian radio spot for a building-materials store (material de construção).', notas: 'Strong, popular and enthusiastic announcer, practical and clear; stress product, price and unit (saco, metro, milheiro).',
    ia: 'Material de construção: produto, medida/unidade (saco, m², milheiro, barra), preço, entrega na obra, parcelamento quando houver.'},
  clinica: {emoji: '🩺', nome: 'Clínica', item: 'serviço', itens: 'serviços', titItens: 'Os serviços', exLoja: 'Ex.: Clínica Vida Plena', exItem: 'Ex.: Consulta com clínico geral', exPreco: '120,00',
    un: ['consulta', 'exame', 'sessao', 'procedimento', ''], unPadrao: 'consulta', oficial: false, parcelas: false, aPartir: true, saude: true,
    abre: ['Cuide da sua saúde com a {L}.', 'A {L} está pertinho de você.', 'Atendimento com carinho e respeito na {L}.'],
    frase: ['{N}: {P}{U}.', '{N}, valor de {P}{U}.', 'Temos {N}, por {P}{U}.'],
    fecha: ['Agende seu horário com a {L}.', 'Marque sua consulta com a {L}.', 'Fale com a {L} e agende.'],
    aviso: 'Valores para particular. Agende. Responsável técnico na clínica.', fala: 'Consulte as condições.',
    cor: {a: '#0369a1', b: '#0c2a44', c: '#38bdf8'}, vt: {t1: 'CUIDE', t2: 'DA SUA SAÚDE', f1: 'ATENDIMENTO PARTICULAR', f2: '', f2b: 'AGENDE SEU HORÁRIO', fim: 'AGENDE NA', f3: 'MARQUE SUA CONSULTA', emoji: '🩺'},
    cena: 'A calm, warm and trustworthy Brazilian radio spot for a health clinic. Gentle background music.', notas: 'Calm, kind and reassuring professional voice, friendly smile, NEVER shouting, no hype; clear and respectful.', ritmo: 'Moderate and calm, clear diction.',
    ia: 'Clínica de saúde: linguagem responsável. PROIBIDO prometer cura, resultado, "sem dor", "garantido", "100%", "milagre", antes e depois, ou usar urgência agressiva. Diga o serviço, o valor (particular) e como agendar. Tom calmo e acolhedor.'},
  salao: {emoji: '💇', nome: 'Salão / Barbearia', item: 'serviço', itens: 'serviços', titItens: 'Os serviços', exLoja: 'Ex.: Barbearia Navalha de Ouro', exItem: 'Ex.: Corte + barba', exPreco: '45,00',
    un: ['', 'servico', 'sessao', 'pacote2'], oficial: false, parcelas: false, aPartir: true,
    abre: ['Bora ficar no estilo? Vem pro {L}!', 'Atenção! Tem promoção no {L}!', 'Seu visual merece o {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: só {P}{U}!', 'E tem {N} a {P}{U}!'],
    fecha: ['Agende seu horário no {L}!', 'Chama no zap e marca seu horário no {L}!', 'Te esperamos no {L}!'],
    aviso: 'Agende seu horário.', fala: '',
    cor: {a: '#9333ea', b: '#3b0764', c: '#c084fc'}, vt: {t1: 'NOVO', t2: 'VISUAL!', f1: 'AGENDE SEU HORÁRIO', f2: 'SÓ NO', f2b: 'BELEZA E ESTILO', fim: 'VEM PRO', f3: 'HORÁRIOS LIMITADOS', emoji: '💇'},
    cena: 'A stylish, upbeat Brazilian radio spot for a beauty salon / barbershop.', notas: 'Cool, friendly and confident voice, upbeat and modern; stress the service and price.',
    ia: 'Salão de beleza ou barbearia: serviço (corte, barba, escova, unhas, coloração), preço, agendamento, combos.'},
  lanchonete: {emoji: '🍔', nome: 'Lanchonete / Restaurante', item: 'item do cardápio', itens: 'itens', titItens: 'O cardápio', exLoja: 'Ex.: Lanche da Esquina Feliz', exItem: 'Ex.: X-Tudo + suco', exPreco: '24,90',
    un: ['', 'un', 'combo', 'porcao', 'prato', 'kg'], oficial: false, parcelas: false,
    abre: ['Bateu a fome? Vem pro {L}!', 'Atenção! Promoção deliciosa no {L}!', 'Hoje tem sabor e preço bom no {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: só {P}{U}!', 'Olha que delícia: {N} a {P}{U}!'],
    fecha: ['Pede já pelo zap do {L}!', 'Vem comer no {L}! Tem entrega também!', 'Corre pro {L}!'],
    aviso: 'Promoção válida enquanto durar. Imagens ilustrativas.', fala: '',
    cor: {a: '#dc2626', b: '#431407', c: '#fb923c'}, vt: {t1: 'BATEU', t2: 'A FOME?', f1: 'PROMOÇÃO DO DIA', f2: 'SÓ NO', f2b: 'PEÇA PELO ZAP', fim: 'PEÇA NO', f3: 'DELIVERY E BALCÃO', emoji: '🍔'},
    cena: 'A mouth-watering, cheerful Brazilian radio spot for a snack bar / restaurant.', notas: 'Happy, hungry-sounding, tasty voice, upbeat; stress the dish and the price.',
    ia: 'Lanchonete/restaurante: prato ou lanche, acompanhamentos, combos, preço, delivery/zap, horário.'},
  roupas: {emoji: '👗', nome: 'Loja de roupas', item: 'peça', itens: 'peças', titItens: 'As peças', exLoja: 'Ex.: Moda Flor do Campo', exItem: 'Ex.: Vestido floral', exPreco: '79,90',
    un: ['', 'peca', 'conjunto', 'par'], oficial: false, parcelas: true,
    abre: ['Novidades fresquinhas na {L}!', 'Atenção! Liquida na {L}!', 'Renove o guarda-roupa na {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: só {P}{U}!', 'Tem {N} a {P}{U}!'],
    fecha: ['Vem conferir na {L}!', 'Chama no zap da {L} e garanta o seu!', 'Corre pra {L}!'],
    aviso: 'Enquanto durarem os estoques. Consulte tamanhos.', fala: 'Enquanto durarem os estoques.',
    cor: {a: '#db2777', b: '#500724', c: '#f472b6'}, vt: {t1: 'NOVA', t2: 'COLEÇÃO!', f1: 'MODA COM PREÇO BOM', f2: 'SÓ NA', f2b: 'VEM CONFERIR', fim: 'CORRE PRA', f3: 'CONSULTE TAMANHOS', emoji: '👗'},
    cena: 'A trendy, upbeat Brazilian radio spot for a clothing store.', notas: 'Fashionable, cheerful and charming voice; stress the piece and the price.',
    ia: 'Loja de roupas/calçados: peça, tamanhos, cores, preço, parcelamento, novidades e liquidação.'},
  pet: {emoji: '🐾', nome: 'Pet shop', item: 'produto ou serviço', itens: 'itens', titItens: 'Produtos e serviços', exLoja: 'Ex.: Pet Patinha Feliz', exItem: 'Ex.: Ração adulto 15kg / Banho e tosa', exPreco: '139,90',
    un: ['', 'un', 'kg', 'pacote', 'banho', 'servico', 'consulta'], oficial: true, parcelas: false,
    abre: ['Seu pet merece! Vem pro {L}!', 'Atenção, tutores! Tem oferta no {L}!', 'Carinho e preço bom para seu pet no {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: só {P}{U}!', 'E tem {N} a {P}{U}!'],
    fecha: ['Traz seu bichinho pro {L}!', 'Chama no zap do {L}!', 'Corre pro {L}!'],
    aviso: 'Ofertas válidas enquanto durarem os estoques.', fala: '',
    cor: {a: '#16a34a', b: '#052e16', c: '#4ade80'}, vt: {t1: 'OFERTAS', t2: 'PARA SEU PET!', f1: 'AMOR DE PET', f2: 'SÓ NO', f2b: 'BANHO E TOSA', fim: 'VEM PRO', f3: 'SEU PET MERECE', emoji: '🐾'},
    cena: 'A sweet, cheerful Brazilian radio spot for a pet shop.', notas: 'Warm, playful and caring voice, cheerful; stress the product/service and price.',
    ia: 'Pet shop: ração, acessórios, banho e tosa, vacinas (sem prometer saúde), preço, cuidado com o pet.'},
  eletronicos: {emoji: '📱', nome: 'Eletrônicos / Celulares', item: 'produto', itens: 'produtos', titItens: 'Os produtos', exLoja: 'Ex.: Conecta Cell Norte', exItem: 'Ex.: Celular 128GB tela 6,5"', exPreco: '999,00',
    un: ['', 'un', 'avista'], oficial: false, parcelas: true,
    abre: ['Atenção! Tecnologia com preço baixo na {L}!', 'Quer celular novo? Vem pra {L}!', 'Chegou oferta tecnológica na {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: só {P}{U}!', 'Tem {N} a {P}{U}!'],
    fecha: ['Vem pra {L}! Tem assistência também!', 'Chama no zap da {L}!', 'Corre pra {L}!'],
    aviso: 'Enquanto durarem os estoques. Garantia conforme fabricante.', fala: 'Enquanto durarem os estoques.',
    cor: {a: '#4f46e5', b: '#1e1b4b', c: '#818cf8'}, vt: {t1: 'OFERTAS', t2: 'TECNOLOGIA!', f1: 'CELULARES E ACESSÓRIOS', f2: 'SÓ NA', f2b: 'PARCELE NO CARTÃO', fim: 'CORRE PRA', f3: 'GARANTIA DE FÁBRICA', emoji: '📱'},
    cena: 'A modern, fast Brazilian radio spot for an electronics and cell phone store.', notas: 'Modern, fast and exciting tech-store voice; stress model, memory and price, and installments.',
    ia: 'Eletrônicos/celulares: modelo, memória, preço à vista e parcelas, acessórios, assistência técnica.'},
  oficina: {emoji: '🔧', nome: 'Oficina / Serviços', item: 'serviço', itens: 'serviços', titItens: 'Os serviços', exLoja: 'Ex.: Oficina Motor Bom', exItem: 'Ex.: Troca de óleo + filtro', exPreco: '149,90',
    un: ['', 'servico', 'hora', 'peca'], oficial: false, parcelas: true, aPartir: true,
    abre: ['Seu carro precisa de cuidado? Leva na {L}!', 'Atenção, motorista! Promoção na {L}!', 'Serviço bem feito é na {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: {P}{U}!', 'Tem {N} a {P}{U}!'],
    fecha: ['Agende na {L}!', 'Chama no zap da {L} e faça seu orçamento!', 'Passa na {L}!'],
    aviso: 'Valores podem variar conforme o modelo. Faça seu orçamento.', fala: 'Valores podem variar conforme o modelo.',
    cor: {a: '#ca8a04', b: '#1f2937', c: '#facc15'}, vt: {t1: 'SERVIÇO', t2: 'DE CONFIANÇA', f1: 'FAÇA SEU ORÇAMENTO', f2: 'SÓ NA', f2b: 'AGENDE JÁ', fim: 'LEVA NA', f3: 'ORÇAMENTO SEM COMPROMISSO', emoji: '🔧'},
    cena: 'A solid, friendly Brazilian radio spot for an auto repair shop / service provider.', notas: 'Trustworthy, down-to-earth and energetic voice; stress service and price.',
    ia: 'Oficina ou prestador de serviço: serviço, preço ou "a partir de", orçamento sem compromisso, agendamento. Sem garantias exageradas.'},
  festa: {emoji: '🎉', nome: 'Festas e Eventos', festa: true, item: 'festa', itens: 'festas', cor: {a: '#9d174d', b: '#2e1065', c: '#ec4899'}, vt: {}, ia: ''},
  outro: {emoji: '✏️', nome: 'Outro', item: 'produto ou serviço', itens: 'itens', titItens: 'Produtos e serviços', exLoja: 'Ex.: Nome do seu negócio', exItem: 'Ex.: Nome do produto ou serviço', exPreco: '50,00',
    un: ['', 'un', 'servico', 'mes', 'dia', 'hora', 'pacote2', 'kg', 'pessoa'], oficial: false, parcelas: true, aPartir: true,
    abre: ['Atenção! Tem promoção no {L}!', 'Olha a novidade no {L}!', 'Hoje é dia de aproveitar no {L}!'],
    frase: ['{N} por apenas {P}{U}!', '{N}: só {P}{U}!', 'E tem {N} a {P}{U}!'],
    fecha: ['Vem pro {L}!', 'Chama no zap do {L}!', 'Aproveite no {L}!'],
    aviso: 'Consulte condições.', fala: '',
    cor: {a: '#d0101f', b: '#7a0010', c: '#ff3b3b'}, vt: {t1: 'OFERTAS', t2: 'ESPECIAIS!', f1: 'APROVEITE', f2: 'SÓ NO', f2b: 'APROVEITE', fim: 'VEM PRO', f3: 'CONSULTE CONDIÇÕES', emoji: '⭐'},
    ia: ''}
};
var SEG_ORDEM = ['mercado', 'festa', 'veiculos', 'academia', 'aluguel', 'construcao', 'clinica', 'salao', 'lanchonete', 'roupas', 'pet', 'eletronicos', 'oficina', 'outro'];
var VT_PADRAO = JSON.parse(JSON.stringify(VT));

/* segmento escolhido (guardado no aparelho; cada comercial também guarda o seu) */
var SEG_ID = (function(){ try { var s = localStorage.getItem('ok_seg'); return SEGS[s] ? s : 'mercado'; } catch (e) { return 'mercado'; } })();
function segOutroNome(){ try { return localStorage.getItem('ok_seg_outro') || ''; } catch (e) { return ''; } }
function segDe(id){ return SEGS[id] || SEGS.mercado; }
function segAtualId(){ return (window.OF && OF.seg && SEGS[OF.seg]) ? OF.seg : SEG_ID; }
function segAtual(){ return segDe(segAtualId()); }
function segNome(id){ id = id || segAtualId(); if (id == 'outro'){ var n = (window.OF && OF.segNome) || segOutroNome(); return n || 'Outro'; } return segDe(id).nome; }

/* aplica cores e textos do vídeo */
function aplicaVisualSeg(id){
  var s = segDe(id); VC.a = s.cor.a; VC.b = s.cor.b; VC.c = s.cor.c;
  for (var k in VT_PADRAO) VT[k] = VT_PADRAO[k]; for (var j in (s.vt || {})) VT[j] = s.vt[j];
  if (s.aviso) VT.aviso = s.aviso;
}
/* locutor com o jeito de falar do segmento (mesmos locutores, mesma voz do Gemini) */
function vozComSeg(v, id){ var s = segDe(id), o = {}; for (var k in v) o[k] = v[k]; if (s.cena) o.cena = s.cena; if (s.notas) o.notas = s.notas; if (s.ritmo) o.ritmo = s.ritmo; return o; }

/* ---------- texto do locutor por segmento (pronto na hora, sem internet) ---------- */
var _montaRoteiroMercado = montaRoteiro;
function falaPreco(p){
  var u = UNIDADES[p.un || ''] ? ' ' + UNIDADES[p.un || ''] : '', t = (p.aPartir ? 'a partir de ' : '') + precoExtenso(p.preco) + u;
  if (p.pn > 1 && p.pv > 0) t += ', ou ' + extenso(p.pn) + ' vezes de ' + precoExtenso(p.pv);
  return t;
}
montaRoteiro = function(of, semente){
  var id = (of && of.seg) || 'mercado', s = segDe(id);
  if (id == 'mercado' || !s.abre){
    var r0 = _montaRoteiroMercado(of, semente);
    if (id != 'mercado') r0.fecha = r0.fecha.replace(' Ofertas válidas enquanto durarem os estoques.', s.fala ? ' ' + s.fala : '');
    /* mercado também fala "a partir de" e parcelas se a pessoa marcar */
    (of.produtos || []).forEach(function(p, i){ if ((p.aPartir || p.pn > 1) && p.preco){ r0.itens[i] = nomeFalado(p.nome) + ', ' + falaPreco(p) + '!'; } });
    return r0;
  }
  var sm = semente == null ? Math.floor(Math.random() * 1000) : semente, loja = (of.loja || 'nossa loja').trim();
  function L(t){ return t.replace(/\{L\}/g, loja); }
  var abre = L(sorteia(s.abre, sm));
  var itens = (of.produtos || []).map(function(p, i){
    var nome = nomeFalado(p.nome) || s.item, pt = falaPreco(p), t;
    if (p.de && +p.de > +p.preco) t = sorteia(['{N}! De ' + precoCurto(p.de) + ', por ' + pt + '!', '{N}: era ' + precoCurto(p.de) + ', agora ' + pt + '!'], sm + i).replace('{N}', nome);
    else t = sorteia(s.frase, sm + i).replace('{N}', nome).replace('{P}{U}', pt);
    t = t.replace(/\b(por apenas|por|só|a|valor de|aluguel de)\s+a partir de\b/i, 'a partir de');
    if (s.saude) t = t.replace(/!/g, '.');
    return t;
  });
  var fecha = L(sorteia(s.fecha, sm));
  if (of.end) fecha += ' Fica na ' + of.end.replace(/^(na|no|em)\s+/i, '').replace(/\s+-\s+/g, ', ') + '.';
  if (of.zap) fecha += s.saude ? ' Também pelo WhatsApp.' : ' Chama no zap!';
  if (s.fala) fecha += ' ' + s.fala;
  return {abre: abre, itens: itens, fecha: fecha};
};

/* ---------- IA (Gemini texto, mesma chave do app) ---------- */
async function gemTexto(prompt, schema, avisa){
  var key = await pegaChave(); if (!key) throw new Error('sem-chave');
  var corpo = JSON.stringify({contents: [{parts: [{text: prompt}]}], generationConfig: {responseMimeType: 'application/json', responseSchema: schema, temperature: 0.9}});
  var ini = Date.now(), ult = '';
  for (var volta = 0; volta < 2; volta++) for (var i = 0; i < GEM_TEXTO.length; i++){
    if (Date.now() - ini > 70000) throw new Error('tempo');
    if (avisa) avisa('🤖 A IA está escrevendo… ' + Math.round((Date.now() - ini) / 1000) + ' s');
    var ac = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if (ac) ac.abort(); }, 22000);
    try {
      var r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEM_TEXTO[i] + ':generateContent?key=' + encodeURIComponent(key), {method: 'POST', headers: {'Content-Type': 'application/json'}, body: corpo, signal: ac ? ac.signal : undefined});
      clearTimeout(t); if (!r.ok){ ult = 'erro ' + r.status; continue; }
      var j = await r.json(), ps = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || [], tx = ps.map(function(p){ return p.text || ''; }).join('');
      var o = JSON.parse(tx); window.OK_MODELO_TEXTO = GEM_TEXTO[i]; return o;
    } catch (e) { clearTimeout(t); ult = (e && e.name == 'AbortError') ? 'tempo' : 'rede'; }
  }
  throw new Error(ult || 'falhou');
}
var PROIBIDO_SAUDE = /\b(cura|curar|curamos|garantid[oa]s?|garantimos|100 ?%|sem dor|milagr\w*|definitiv[oa]|resultado(s)? (imediato|garantido)|antes e depois|elimin[ae]\w*)\b/i;
async function iaRoteiro(of, avisa){
  var id = of.seg || 'mercado', s = segDe(id), nome = segNome(id);
  var prods = of.produtos.map(function(p, i){ return {n: i + 1, nome: nomeFalado(p.nome), preco_falado: falaPreco(p), preco_antigo: p.de && +p.de > +p.preco ? precoCurto(p.de) : ''}; });
  var prompt = 'Você é redator de comerciais de rádio/carro de som no Brasil. Escreva o texto que o LOCUTOR vai falar num comercial curto (20 a 40 segundos) em português do Brasil, popular e fácil.\n' +
    'Ramo do negócio: ' + nome + '. ' + (s.ia || 'Comércio local.') + '\n' +
    'Nome do negócio: ' + (of.loja || 'nossa loja') + (of.end ? '. Endereço: ' + of.end : '') + (of.zap ? '. Tem WhatsApp.' : '.') + '\n' +
    'Itens (use cada preço EXATAMENTE como está em preco_falado, por extenso, sem números): ' + JSON.stringify(prods) + '\n' +
    'Regras: 1 frase de abertura chamando atenção com o nome do negócio; 1 frase por item, na mesma ordem, com o nome e o preço falado (se tiver preço antigo, diga "de ... por ..."); 1 frase de fechamento com chamada para ação' + (of.end ? ' e o endereço' : '') + (of.zap ? ' e "chama no zap"' : '') + '. Frases curtas. Sem emojis, sem números escritos com algarismos, sem siglas, sem bordões de pessoas famosas. ' +
    (s.fala ? 'Termine com: "' + s.fala + '". ' : '') + (s.saude ? 'Saúde: tom calmo, NUNCA prometa cura, resultado, "sem dor", "garantido" ou "100%". ' : '') + 'Não invente preços, descontos, brindes ou condições que não foram dados.';
  var o = await gemTexto(prompt, {type: 'OBJECT', properties: {abre: {type: 'STRING'}, itens: {type: 'ARRAY', items: {type: 'STRING'}}, fecha: {type: 'STRING'}}, required: ['abre', 'itens', 'fecha']}, avisa);
  var base = montaRoteiro(of, Math.floor(Math.random() * 1000)), r = {abre: String(o.abre || '').trim() || base.abre, itens: [], fecha: String(o.fecha || '').trim() || base.fecha};
  /* confere: cada item precisa falar o preço certo; saúde não pode ter promessa */
  of.produtos.forEach(function(p, i){ var t = String((o.itens || [])[i] || '').trim(), pf = precoExtenso(p.preco);
    r.itens.push(t && t.indexOf(pf) >= 0 && !/\d/.test(t) ? t : base.itens[i]); });
  if (/\d/.test(r.abre)) r.abre = base.abre; if (/\d/.test(r.fecha)) r.fecha = base.fecha;
  if (s.saude){ if (PROIBIDO_SAUDE.test(r.abre)) r.abre = base.abre; if (PROIBIDO_SAUDE.test(r.fecha)) r.fecha = base.fecha; r.itens = r.itens.map(function(t, i){ return PROIBIDO_SAUDE.test(t) ? base.itens[i] : t; }); }
  return r;
}

/* ---------- barra de segmentos (topo) ---------- */
function pintaSegBar(){
  var atual = segAtualId(), b = document.getElementById('segBar'); if (!b) return;
  b.innerHTML = SEG_ORDEM.map(function(id){ var s = SEGS[id]; return '<button class="segb' + (id == atual ? ' on' : '') + '" data-seg="' + id + '" onclick="escolheSeg(\'' + id + '\')">' + s.emoji + ' ' + esc(id == 'outro' && segOutroNome() ? segOutroNome() : s.nome) + '</button>'; }).join('');
  var on = b.querySelector('.on'); if (on && on.scrollIntoView) try { on.scrollIntoView({inline: 'center', block: 'nearest'}); } catch (e) {}
  var bo = document.getElementById('segOutro'); if (bo){ bo.classList.toggle('oculto', atual != 'outro'); if (atual == 'outro' && document.activeElement !== document.getElementById('segOutroTx')) document.getElementById('segOutroTx').value = (window.OF && OF.segNome) || segOutroNome(); }
  var bn = document.getElementById('bNovo'); if (bn) bn.textContent = SEGS[SEG_ID].festa ? '🎉 Fazer anúncio de festa' : '➕ Fazer comercial novo (' + SEGS[SEG_ID].emoji + ' ' + segNome(SEG_ID) + ')';
  var sl = document.getElementById('segLbl'); if (sl) sl.textContent = 'Seu ramo: ' + segDe(atual).emoji + ' ' + segNome(atual);
}
window.escolheSeg = function(id){
  if (!SEGS[id]) return;
  var noEditor = !document.getElementById('editor').classList.contains('oculto'), naFesta = document.getElementById('festaEd') && !document.getElementById('festaEd').classList.contains('oculto');
  if ((noEditor && SEGS[id].festa) || (naFesta && !SEGS[id].festa)){
    if (window.sujo && !confirm('Trocar para ' + SEGS[id].nome + '? O que não foi salvo aqui será perdido.')) return;
    SEG_ID = id; try { localStorage.setItem('ok_seg', id); } catch (e) {}
    window.sujo = false; if (SEGS[id].festa) novaFesta(); else $('bNovo').onclick();
    pintaSegBar(); return;
  }
  SEG_ID = id; try { localStorage.setItem('ok_seg', id); } catch (e) {}
  if (noEditor && window.OF){ OF.seg = id; if (id == 'outro') OF.segNome = segOutroNome(); else delete OF.segNome; window.sujo = true; aplicaSegEditor(true); }
  pintaSegBar(); toast(SEGS[id].emoji + ' ' + segNome(id) + ' escolhido', '#2563eb', 1600);
  if (id == 'outro' && !segOutroNome()) setTimeout(function(){ var t = document.getElementById('segOutroTx'); if (t) t.focus(); }, 100);
};
function salvaOutroNome(v){ v = String(v || '').trim().slice(0, 40); try { localStorage.setItem('ok_seg_outro', v); } catch (e) {} if (window.OF && OF.seg == 'outro'){ OF.segNome = v; window.sujo = true; } }

/* textos e campos do editor conforme o segmento */
function aplicaSegEditor(refazTexto){
  var s = segAtual();
  $('eLoja').placeholder = s.exLoja || SEGS.mercado.exLoja;
  var t = document.getElementById('tItens'); if (t) t.textContent = s.titItens || 'Os produtos';
  var d = document.getElementById('dItens'); if (d) d.textContent = s.oficial ? 'Tire a foto do produto. O app deixa a foto bonita e também procura a foto oficial do produto. Você toca na que achar melhor.' : 'Tire ou escolha uma foto (opcional). O app deixa a foto bonita; toque em ✨ Perfeita para tirar o fundo.';
  $('bAddProd').textContent = '➕ Adicionar ' + (s.item || 'produto');
  if (window.OF && OF.produtos){ pintaProdutos(); if (refazTexto && !OF.roteiroEditado){ OF.roteiro = montaRoteiro(OF, OF.semente); pintaRoteiro(); } }
  pintaSegBar();
}
