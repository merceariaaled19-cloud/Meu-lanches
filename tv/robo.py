# TV Certa - robo que testa os canais gratuitos e salva so os que abrem
import re, json, ssl, urllib.request, concurrent.futures as cf, datetime
FONTES = ['https://iptv-org.github.io/iptv/countries/br.m3u']
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
ordem = ['Amazonas', 'Notícias', 'Variedades', 'Esportes', 'Filmes e Séries', 'Infantil', 'Música', 'Educação e Cultura', 'Religiosos']
saida = []
for c in ok:
    nome = re.sub(r'\s*\(\d+p\)', '', c['nome']).replace('[Not 24/7]', '').strip()
    saida.append({'nome': nome, 'cat': categoria(c), 'logo': c['logo'], 'url': c['url']})
saida.sort(key=lambda c: (ordem.index(c['cat']), c['nome'].lower()))
if len(saida) >= 10:
    json.dump({'atualizado': datetime.datetime.now(datetime.timezone.utc).isoformat()[:16], 'canais': saida}, open('tv/canais.json', 'w'), ensure_ascii=False, indent=0)
print(len(unicos), 'testados,', len(saida), 'funcionando')
