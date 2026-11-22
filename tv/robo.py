# TV Certa - robo que testa os canais gratuitos e salva so os que abrem
import re, json, ssl, urllib.request, concurrent.futures as cf, datetime
FONTES = ['https://iptv-org.github.io/iptv/countries/br.m3u', 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br_samsung.m3u']
PLUTO = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br_pluto.m3u'
ORIGEM = 'https://merceariaaled19-cloud.github.io'
UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
def baixar(u):
    r = urllib.request.Request(u, headers={'User-Agent': UA})
    return urllib.request.urlopen(r, timeout=40).read().decode('utf8', 'ignore')
def ler(txt):
    itens, cur = [], None
    for l in txt.splitlines():
        if l.startswith('#EXTINF'):
            g = re.search(r'group-title="([^"]*)"', l); lg = re.search(r'tvg-logo="([^"]*)"', l)
            cur = {'nome': l.rsplit(',', 1)[-1].strip(), 'g': g.group(1) if g else '', 'logo': lg.group(1) if lg else ''}
        elif l.startswith('#EXTVLCOPT') or l.startswith('#KODIPROP'):
            if cur: cur['opt'] = 1
        elif l.strip() and not l.startswith('#') and cur:
            cur['url'] = l.strip(); itens.append(cur); cur = None
    return itens
def categoria(c):
    n, g = c['nome'].lower(), c['g'].lower()
    if re.search(r'a critica|amazon sat', n): return 'Amazonas'
    if 'news' in g or 'legislative' in g: return 'Notícias'
    if 'sport' in g: return 'Esportes'
    if re.search(r'kids|animation|classic', g) or 'cartoon' in n: return 'Infantil'
    if 'religious' in g: return 'Religiosos'
    if re.search(r'movies|series|comedy', g): return 'Filmes e Séries'
    if 'music' in g: return 'Música'
    if re.search(r'education|culture|public', g): return 'Educação e Cultura'
    return 'Variedades'
ctx = ssl.create_default_context()
def testar(c):
    if not c['url'].startswith('https') or c.get('opt'): return None
    try:
        r = urllib.request.Request(c['url'], headers={'User-Agent': UA, 'Origin': ORIGEM})
        with urllib.request.urlopen(r, timeout=12, context=ctx) as x:
            b = x.read(4000).decode('utf8', 'ignore'); co = x.headers.get('Access-Control-Allow-Origin')
            if '#EXTM3U' in b and co in ('*', ORIGEM): return c
    except Exception: return None
todos = []
for f in FONTES:
    try: todos += ler(baixar(f))
    except Exception as e: print('fonte falhou', f, e)
vistos, unicos = set(), []
for c in todos:
    if c['url'] not in vistos: vistos.add(c['url']); unicos.append(c)
with cf.ThreadPoolExecutor(40) as ex: ok = [c for c in ex.map(testar, unicos) if c]
ordem = ['Amazonas', 'Notícias', 'Variedades', 'Esportes', 'Filmes e Séries', 'Infantil', 'Música', 'Educação e Cultura', 'Religiosos', 'Desenhos e Anime 24h', 'Comédia 24h', 'Séries 24h', 'Filmes 24h', 'Grátis em outros sites']
saida = []
for c in ok:
    nome = re.sub(r'\s*\(\d+p\)', '', c['nome']).replace('[Not 24/7]', '').strip()
    saida.append({'nome': nome, 'cat': categoria(c), 'logo': c['logo'], 'url': c['url']})
# Pluto TV 24h: gratis e oficial, abre no site da Pluto (ela bloqueia tocar dentro de outro app)
def cat_pluto(n):
    l = n.lower()
    if re.search(r'anime|naruto|boruto|one piece|pok[ée]mon|dragon|death note|hunter|inuyasha|jojo|yu-gi|beyblade|tokusato|super onze|desenho|bob esponja|kids|junior|nick|toons|padrinhos|smurfs|oggy|popeye|moranguinho|baby|teletubbies|turma da m|cocoric|reino infantil|avatar|bugiganga', l): return 'Desenhos e Anime 24h'
    if re.search(r'com[ée]dia|south park|kenan|arnold|feiticeira|pegadinhas|failarmy|icarly', l): return 'Comédia 24h'
    if re.search(r'cine|filmes|netmovies|runtime|filmelier|adrenalina|bang bang|terror|suspense', l): return 'Filmes 24h'
    if re.search(r'news|jovem pan|record|cnbc|euronews|bm&c|uol|times brasil|cultura', l): return None
    return 'Séries 24h'
try:
    for c in ler(baixar(PLUTO)):
        m = re.search(r'plu-([0-9a-f]{24})', c['url'])
        k = cat_pluto(c['nome'])
        if m and k: saida.append({'nome': re.sub(r'\s*\(\d+p\)', '', c['nome']), 'cat': k, 'logo': 'https://images.pluto.tv/channels/%s/colorLogoPNG.png' % m.group(1), 'url': '', 'ext': 'https://pluto.tv/br/live-tv/' + m.group(1)})
except Exception as e: print('pluto falhou', e)
# Pluto TV e outros: gratis e oficiais, mas so tocam no site deles (bloqueiam dentro de outros apps)
saida += [{'nome': 'Pluto TV - canais ao vivo', 'cat': 'Grátis em outros sites', 'logo': 'logo-pluto.png', 'url': '', 'ext': 'https://pluto.tv/br/live-tv'},
          {'nome': 'Pluto TV - filmes e séries', 'cat': 'Grátis em outros sites', 'logo': 'logo-pluto.png', 'url': '', 'ext': 'https://pluto.tv/br/on-demand'},
          {'nome': 'Libreflix - filmes brasileiros', 'cat': 'Grátis em outros sites', 'logo': 'logo-libreflix.png', 'url': '', 'ext': 'https://libreflix.org'},
          {'nome': 'Samsung TV Plus', 'cat': 'Grátis em outros sites', 'logo': 'logo-samsung.png', 'url': '', 'ext': 'https://www.samsungtvplus.com'}]
saida.sort(key=lambda c: (ordem.index(c['cat']), c['nome'].lower()))
if len([c for c in saida if c['url']]) >= 10:
    json.dump({'atualizado': datetime.datetime.now(datetime.timezone.utc).isoformat()[:16], 'canais': saida}, open('tv/canais.json', 'w'), ensure_ascii=False, indent=0)
print(len(unicos), 'testados,', len(saida), 'funcionando')
