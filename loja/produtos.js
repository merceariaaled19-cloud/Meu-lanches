// Gohan Import — produtos. Para mudar preço/nome, edite aqui.
// busca = termo usado para abrir o fornecedor já filtrado pelos MAIS VENDIDOS / melhor avaliados.
window.LOJA = {
  nome: "Gohan Import",
  whatsapp: "5592995015662",
  frete: "Frete grátis para todo o Brasil",
  prazo: "Entrega de 7 a 20 dias úteis",
};
window.PRODUTOS = [
  {id:"fone", nome:"Fone Bluetooth TWS com estojo", desc:"Som estéreo, microfone para chamadas, toque nos fones, estojo carregador.", preco:79.90, de:129.90, emoji:"🎧", cor:"#3b82f6", busca:"fone bluetooth tws"},
  {id:"watch", nome:"Smartwatch Esportivo", desc:"Notificações do WhatsApp, passos, batimentos, sono e vários modos de treino.", preco:119.90, de:199.90, emoji:"⌚", cor:"#a855f7", busca:"smartwatch"},
  {id:"caixa", nome:"Caixa de Som Bluetooth Portátil", desc:"Grave forte, resistente a respingos, rádio FM e entrada USB/cartão.", preco:89.90, de:149.90, emoji:"🔊", cor:"#ef4444", busca:"caixa de som bluetooth portatil"},
  {id:"power", nome:"Power Bank 10.000 mAh", desc:"Carregador portátil fino, carrega o celular até 3 vezes, 2 saídas USB.", preco:69.90, de:109.90, emoji:"🔋", cor:"#22c55e", busca:"power bank 10000mah"},
  {id:"carreg", nome:"Carregador Turbo USB-C + Cabo", desc:"Carregamento rápido para Android e iPhone, cabo reforçado de 1 metro.", preco:39.90, de:69.90, emoji:"⚡", cor:"#eab308", busca:"carregador turbo usb c"},
  {id:"camera", nome:"Câmera Wi‑Fi 360° Lâmpada", desc:"Encaixa no bocal da lâmpada, visão noturna, vê pelo celular de qualquer lugar.", preco:99.90, de:169.90, emoji:"📹", cor:"#06b6d4", busca:"camera lampada wifi 360"},
  {id:"proj", nome:"Mini Projetor Portátil", desc:"Filmes e jogos na parede, conecta no celular, TV Box e pen drive.", preco:299.90, de:449.90, emoji:"📽️", cor:"#f97316", busca:"mini projetor portatil"},
  {id:"led", nome:"Fita LED RGB 5 metros", desc:"Muda de cor pelo controle ou celular, pisca no ritmo da música.", preco:49.90, de:89.90, emoji:"🌈", cor:"#ec4899", busca:"fita led rgb 5 metros"},
  {id:"ring", nome:"Ring Light com Tripé", desc:"Luz para foto, vídeo e live, 3 tons de luz, suporte para celular.", preco:79.90, de:139.90, emoji:"💡", cor:"#f59e0b", busca:"ring light com tripe"},
  {id:"suporte", nome:"Suporte Veicular Magnético", desc:"Celular firme no carro ou moto, gira 360°, encaixe no painel ou ar.", preco:34.90, de:59.90, emoji:"🚗", cor:"#64748b", busca:"suporte celular veicular magnetico"},
];
// Fornecedores, já abrindo pelos mais vendidos/mais bem avaliados
window.FORNECEDORES = [
  {nome:"Shopee", cor:"#ee4d2d", url:t=>"https://shopee.com.br/search?keyword="+encodeURIComponent(t)+"&sortBy=sales"},
  {nome:"AliExpress", cor:"#e62e04", url:t=>"https://pt.aliexpress.com/w/wholesale-"+encodeURIComponent(t.replace(/ /g,'-'))+".html?SortType=total_tranpro_desc"},
  {nome:"Amazon", cor:"#ff9900", url:t=>"https://www.amazon.com.br/s?k="+encodeURIComponent(t)+"&s=review-rank"},
];
