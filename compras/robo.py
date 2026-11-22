#!/usr/bin/env python3
"""Robô do Compra Certa: junta preços de Manaus e grava compras/dados/precos.json.
Fontes: ofertasmanaus.com (encartes em texto) e novaeranet.com.br (site VTEX).
Sem dependências externas. Nunca inventa preço: só grava o que leu na fonte."""
import json, re, html, os, sys, unicodedata, urllib.request, urllib.parse
from datetime import datetime, timedelta, timezone, date

MANAUS = timezone(timedelta(hours=-4))
AGORA = datetime.now(MANAUS)
HOJE = AGORA.date()
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, 'dados', 'precos.json')
UA = {'User-Agent': 'Mozilla/5.0 (CompraCerta robo; +https://merceariaaled19-cloud.github.io/Meu-lanches/compras/)'}

TERMOS_NE = ['coca-cola', 'guaraná antarctica', 'fanta', 'sprite', 'kuat', 'pepsi', 'cerveja skol', 'brahma',
             'cerveja antarctica', 'budweiser', 'cerveja original', 'spaten', 'stella artois', 'bohemia', 'heineken', 'michelob', 'corona', 'amstel', 'eisenbahn', 'devassa', 'petra', 'colorado', 'beck', 'patagonia', 'itaipava', 'crystal', 'kaiser', 'tiger',
             'itaipava', 'amstel', 'água mineral', 'açúcar', 'arroz', 'feijão', 'óleo de soja', 'café', 'leite',
             'leite em pó', 'farinha', 'macarrão', 'sal', 'margarina', 'frango', 'carne', 'linguiça', 'sabão',
             'detergente', 'papel higiênico', 'água sanitária', 'biscoito', 'ovos']
# encartes que não são de mercado ou são de outra cidade
FORA = re.compile(r'pneu|info ?store|bemol|el[ée]trica|correias|celular|samsung|eletro|manacapuru|l.or[ée]al|fralda', re.I)
MESES = {'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7,
         'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12}


def get_json(url, tentativas=3):
    for i in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            erro = e
    print('falhou:', url[:90], erro, file=sys.stderr)
    return None


def limpa(t):
    t = re.sub(r'<[^>]+>', ' ', t or '')
    return re.sub(r'\s+', ' ', html.unescape(t)).strip()


def num(s):
    return round(float(s.replace('.', '').replace(',', '.')), 2)


def loja_de(titulo):
    t = limpa(titulo)
    t = re.sub(r'[^\w\s\-–&\'’/.]', '', t).strip()
    base = re.split(r'\s*[-–]\s*', t)[0].strip()
    b = base.lower()
    if re.search(r'\bdb\b', b) and 'açougue' not in b:
        return 'DB'
    if b.startswith('vitória') or b.startswith('vitoria'):
        return 'Vitória'
    if b.startswith('atacarejo supermix'):
        return 'SuperMix'
    return base


def datas_no_texto(txt, ano_padrao):
    """Devolve todas as datas (date) citadas no texto."""
    achou = []
    for d, m, a in re.findall(r'\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b', txt):
        try:
            a = int(a) if a else ano_padrao
            if a < 100: a += 2000
            achou.append(date(a, int(m), int(d)))
        except ValueError:
            pass
    for d, mes, a in re.findall(r'\b(\d{1,2}) de (\w+)(?: de (\d{4}))?', txt, re.I):
        mm = MESES.get(mes.lower())
        if mm:
            try: achou.append(date(int(a) if a else ano_padrao, mm, int(d)))
            except ValueError: pass
    return achou


def validade_do_post(c, pub):
    """Procura a validade no texto antes da tabela (ou na linha 'Validade do Encarte')."""
    intro = limpa(c.split('<table')[0])
    linha = re.search(r'Validade do Encarte:?\s*</td>.*?|Validade do Encarte:([^<]*)<', c)
    alvo = intro
    m = re.search(r'Validade do Encarte:([^<]*)<', c)
    if m: alvo += ' ' + m.group(1)
    trechos = re.findall(r'(?:válid|valid|até|ate )[^.;]{0,90}', alvo, re.I)
    ds = []
    for tr in trechos:
        ds += datas_no_texto(tr, pub.year)
    ds = [d for d in ds if pub - timedelta(days=40) <= d <= pub + timedelta(days=70)]
    return max(ds) if ds else None


def le_preco(txt):
    """Devolve dict com preco/preco_app/preco_cartao/atacado/obs ou None."""
    t = txt.strip()
    m = re.match(r'R\$\s*([\d.]+,\d{2})\s*\(Oferta\)\s*/\s*R\$\s*([\d.]+,\d{2})\s*\(APP\)\s*/\s*R\$\s*([\d.]+,\d{2})\s*\(APP \+ Cart', t)
    if m:
        return {'preco': num(m.group(1)), 'preco_app': num(m.group(2)), 'preco_cartao': num(m.group(3))}
    m = re.match(r'R\$\s*([\d.]+,\d{2})\s*\(Oferta\)\s*/\s*R\$\s*([\d.]+,\d{2})\s*\(APP\)', t)
    if m:
        return {'preco': num(m.group(1)), 'preco_app': num(m.group(2))}
    m = re.match(r'Unidade:\s*R\$\s*([\d.]+,\d{2})(.*)', t)
    if m:
        resto = m.group(2).strip(' |')
        return {'preco': num(m.group(1)), 'atacado': resto.replace(' | ', '; ') or None}
    m = re.match(r'(?:A partir de\s*)?R\$\s*([\d.]+,\d{2})(.*)', t)
    if m:
        r = {'preco': num(m.group(1))}
        if m.group(2).strip(): r['obs'] = t
        return r
    return None


def ofertas_manaus():
    desde = (AGORA - timedelta(days=10)).strftime('%Y-%m-%dT00:00:00')
    itens, lojas, pagina = [], set(), 1
    while pagina <= 3:
        q = urllib.parse.urlencode({'per_page': 100, 'page': pagina, 'after': desde, '_fields': 'id,date,slug,title,link,content'})
        posts = get_json('https://ofertasmanaus.com/wp-json/wp/v2/posts?' + q)
        if not posts: break
        for p in posts:
            titulo = limpa(p['title']['rendered'])
            if FORA.search(titulo): continue
            c = p['content']['rendered']
            if '<table' not in c: continue
            pub = datetime.fromisoformat(p['date']).date()
            val = validade_do_post(c, pub)
            if val and val < HOJE: continue                       # encarte vencido
            if not val and (HOJE - pub).days > 7: continue        # sem data e velho
            loja = loja_de(p['title']['rendered'])
            for prod, prc in re.findall(r'<tr>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>\s*</tr>', c, re.S):
                prod, prc = limpa(prod), limpa(prc)
                if not prod or not prc or re.match(r'(?i)produtos?$|validade', prod): continue
                pr = le_preco(prc)
                if not pr or pr['preco'] <= 0 or pr['preco'] > 800: continue
                it = {'produto': prod, 'loja': loja, 'encarte': titulo, 'preco': pr['preco'],
                      'preco_app': pr.get('preco_app'), 'preco_cartao': pr.get('preco_cartao'),
                      'atacado': pr.get('atacado'), 'obs': pr.get('obs'), 'promo': True,
                      'fonte': 'ofertasmanaus.com (encarte)', 'link': p['link'],
                      'validade': val.isoformat() if val else None, 'publicado': pub.isoformat(),
                      'coletado_em': AGORA.isoformat(timespec='minutes')}
                itens.append({k: v for k, v in it.items() if v is not None})
                lojas.add(loja)
        if len(posts) < 100: break
        pagina += 1
    return itens, lojas


def nova_era():
    itens, vistos = [], set()
    for termo in TERMOS_NE:
        dados = get_json('https://www.novaeranet.com.br/api/catalog_system/pub/products/search/' +
                         urllib.parse.quote(termo) + '?_from=0&_to=49')
        for p in dados or []:
            try:
                of = p['items'][0]['sellers'][0]['commertialOffer']
            except (KeyError, IndexError):
                continue
            preco, lista = of.get('Price') or 0, of.get('ListPrice') or 0
            if preco <= 0 or not of.get('IsAvailable', True) or p['productId'] in vistos: continue
            vistos.add(p['productId'])
            it = {'produto': p['productName'].strip(), 'loja': 'Nova Era', 'encarte': 'Site Nova Era Net',
                  'preco': round(preco, 2), 'promo': bool(lista and lista > preco + 0.009),
                  'fonte': 'novaeranet.com.br (site)', 'link': 'https://www.novaeranet.com.br/' + p['linkText'] + '/p',
                  'coletado_em': AGORA.isoformat(timespec='minutes')}
            if it['promo']: it['preco_de'] = round(lista, 2)
            ean = p['items'][0].get('ean')
            if ean: it['ean'] = ean
            itens.append(it)
    return itens


def main():
    om, lojas = ofertas_manaus()
    ne = nova_era()
    # tira repetido (mesmo produto + loja): fica o menor preço
    melhor = {}
    for it in om + ne:
        k = (it['produto'].lower(), it['loja'])
        if k not in melhor or it['preco'] < melhor[k]['preco']:
            melhor[k] = it
    itens = sorted(melhor.values(), key=lambda x: (x['produto'].lower(), x['preco']))
    if len(itens) < 50:
        print('Poucos itens (%d); mantendo o arquivo anterior.' % len(itens)); sys.exit(1)
    lojas = sorted(set(i['loja'] for i in itens))
    out = {'atualizado_em': AGORA.isoformat(timespec='minutes'), 'total': len(itens), 'lojas': lojas,
           'aviso': 'Preços de encartes e sites. Podem mudar; confirme na loja.', 'itens': itens}
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print('OK: %d itens, %d lojas (%s)' % (len(itens), len(lojas), ', '.join(lojas)))


if __name__ == '__main__':
    main()
