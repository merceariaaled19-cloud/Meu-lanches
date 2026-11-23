// Gohan Import — produtos. Para mudar preço/nome, edite aqui.
// busca = termo usado para abrir o fornecedor já filtrado pelos MAIS VENDIDOS / melhor avaliados.
window.LOJA = {
  nome: "Gohan Import",
  whatsapp: "5592995015662",
  frete: "Frete grátis para todo o Brasil",
  prazo: "Entrega de 7 a 20 dias úteis",
};
window.PRODUTOS = [
  {id:"fone", nome:"Fone Bluetooth HTC NE20 com Tela", desc:"Bluetooth 6, tela no estojo, tradutor com IA e microfone com redução de ruído.", preco:179.90, de:249.90, custo:104.02, foto:"img/fone.webp", emoji:"🎧", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005009278845385.html", busca:"fone bluetooth tws"},
  {id:"watch", nome:"Smartwatch Esportivo 2.01" com Chamadas", desc:"Faz e atende ligações pelo relógio, lanterna, batimentos e modos de esporte.", preco:119.90, de:179.90, custo:61.21, foto:"img/watch.webp", emoji:"⌚", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005006997324750.html", busca:"smartwatch"},
  {id:"caixa", nome:"Caixa de Som Bluetooth Ortizan 40W", desc:"Grave reforçado, 30 horas de bateria, à prova d"água IPX7, Bluetooth 5.3.", preco:329.90, de:449.90, custo:196.01, foto:"img/caixa.webp", emoji:"🔊", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005007357456579.html", busca:"caixa de som bluetooth portatil"},
  {id:"power", nome:"Power Bank 10.000 mAh 23W", desc:"Bateria portátil com carga rápida e cabos embutidos.", preco:109.90, de:159.90, custo:60.69, foto:"img/power.webp", emoji:"🔋", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005010051122475.html", busca:"power bank 10000mah"},
  {id:"carreg", nome:"Carregador Turbo 25W + Cabo USB-C", desc:"Carregamento super rápido para Samsung Galaxy e outros com USB-C.", preco:39.90, de:69.90, custo:12.84, foto:"img/carreg.webp", emoji:"⚡", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005007580277409.html", busca:"carregador turbo usb c"},
  {id:"camera", nome:"Câmera Lâmpada Wi‑Fi 360° 5MP", desc:"Encaixa no bocal E27, gira 360°, visão noturna, vê pelo app Tuya/Smart Life.", preco:239.90, de:329.90, custo:142.54, foto:"img/camera.webp", emoji:"📹", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005008406191577.html", busca:"camera lampada wifi 360"},
  {id:"proj", nome:"Projetor Magcubic HY300 PRO Android", desc:"Android 14, Wi‑Fi 6, Bluetooth, Netflix e YouTube direto na parede.", preco:529.90, de:699.90, custo:314.63, foto:"img/proj.webp", emoji:"📽️", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005006967585012.html", busca:"mini projetor portatil"},
  {id:"led", nome:"Fita LED RGB 5 metros", desc:"Fita colorida 5050 flexível para quarto, sala, gamer e decoração.", preco:59.90, de:99.90, custo:19.18, foto:"img/led.webp", emoji:"🌈", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/32906423190.html", busca:"fita led rgb 5 metros"},
  {id:"ring", nome:"Ring Light 18" com Tripé de 2 m", desc:"Luz profissional bicolor para vídeo, live, maquiagem e foto, com controle.", preco:799.90, de:999.90, custo:507.85, foto:"img/ring.webp", emoji:"💡", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005006994434932.html", busca:"ring light com tripe"},
  {id:"suporte", nome:"Suporte Veicular Magnético 360°", desc:"Ventosa no painel ou espelho, gira 360°, dobrável e firme.", preco:34.90, de:59.90, custo:11.84, foto:"img/suporte.webp", emoji:"🚗", cor:"#1e293b", fornecedor:"https://pt.aliexpress.com/item/1005009384397085.html", busca:"suporte celular veicular magnetico"},
];
// custo = preço no AliExpress em 22/11/2026 (variação mais barata do anúncio; confira antes de comprar)
// Fornecedores, já abrindo pelos mais vendidos/mais bem avaliados
window.FORNECEDORES = [
  {nome:"Shopee", cor:"#ee4d2d", url:t=>"https://shopee.com.br/search?keyword="+encodeURIComponent(t)+"&sortBy=sales"},
  {nome:"AliExpress", cor:"#e62e04", url:t=>"https://pt.aliexpress.com/w/wholesale-"+encodeURIComponent(t.replace(/ /g,'-'))+".html?SortType=total_tranpro_desc"},
  {nome:"Amazon", cor:"#ff9900", url:t=>"https://www.amazon.com.br/s?k="+encodeURIComponent(t)+"&s=review-rank"},
];
