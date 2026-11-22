# TV Certa - robo de filmes e series gratis (canais oficiais gratuitos no YouTube)
import subprocess, json, re, os, urllib.request, concurrent.futures as cf, xml.etree.ElementTree as ET
YTD = os.environ.get('YTD', 'yt-dlp')
ARQ = 'tv/filmes.json'
CH = [l.split(' ', 1) for l in open('tv/yt_canais.txt', encoding='utf8').read().strip().splitlines()]
velho = {}
if os.path.exists(ARQ):
    for x in json.load(open(ARQ, encoding='utf8'))['itens']: velho[x['id']] = x
def lista(c):
    cid, n = c[0], c[1].strip()
    try:
        p = subprocess.run([YTD, '--flat-playlist', '-j', '--extractor-args', 'youtube:lang=pt', 'https://www.youtube.com/playlist?list=UU' + cid[2:]], capture_output=True, text=True, timeout=300)
        out = []
        for i, l in enumerate(p.stdout.splitlines()):
            d = json.loads(l); out.append({'id': d['id'], 't': d.get('title') or '', 'dur': d.get('duration') or 0, 'ch': n, 'pos': i})
        return out
    except Exception as e:
        print('falhou', n, e); return []
def rss(c):
    ns = {'a': 'http://www.w3.org/2005/Atom', 'm': 'http://search.yahoo.com/mrss/', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
    try:
        x = ET.fromstring(urllib.request.urlopen('https://www.youtube.com/feeds/videos.xml?channel_id=' + c[0], timeout=30).read())
        return {e.find('yt:videoId', ns).text: (e.find('m:group/m:description', ns).text or '') for e in x.findall('a:entry', ns)}
    except Exception: return {}
with cf.ThreadPoolExecutor(9) as ex:
    if os.environ.get('FLAT'):
        brutos, cont = [], {}
        for x in json.load(open(os.environ['FLAT'], encoding='utf8')):
            if x['ch'] == 'NetMovies Global': continue
            x['pos'] = cont.get(x['ch'], 0); cont[x['ch']] = x['pos'] + 1; x['dur'] = x['dur'] or 0; x['t'] = x['t'] or ''; brutos.append(x)
    else:
        brutos = [x for o in ex.map(lista, CH) for x in o]
    descs = {}
    for d in ex.map(rss, CH): descs.update(d)
GEN = [('Terror', r'terror|horror'), ('Suspense', r'suspense|thriller|mist[ée]rio'), ('Ação', r'a[çc][ãa]o'), ('Comédia', r'com[ée]dia'),
       ('Romance', r'romance|rom[âa]ntic'), ('Faroeste', r'faroeste|western'), ('Ficção', r'fic[çc][ãa]o'), ('Guerra', r'guerra'),
       ('Policial', r'policial|crime'), ('Animação', r'anima[çc][ãa]o|desenho'), ('Natal', r'natal'), ('Drama', r'drama'),
       ('Documentário', r'document[áa]rio'), ('Família', r'fam[íi]lia')]
def limpar(t):
    t = re.split(r'\s*[|]\s*|\s+[-–]\s+(?=filme|trailer|completo)', t, flags=re.I)[0]
    t = re.split(r'[\U0001F300-\U0001FAFF\u2600-\u27BF]', t)[0]
    t = re.sub(r'(?i)\b(filme( de \w+)?|completo|dublado|legendado|em portugu[êe]s|hd|gr[áa]tis)\b', '', t)
    return re.sub(r'\s{2,}', ' ', t).strip(' -–:|') or 'Filme'
def sinopse(t):
    if not t: return ''
    m = re.search(r'(?i)sinopse\s*:\s*(.+)', t)
    if m: return m.group(1).strip()[:400]
    if not re.search(r'(?i)inscreva|http|netmovies', t) and len(t) > 40 and '\n' not in t.strip(): return t.strip()[:400]
    bons = [p.strip() for p in re.split(r'\n+', t) if len(p.strip()) > 60 and not re.search(r'(?i)inscreva|http|www\.|netmovies|#|siga|redes sociais|direitos', p)]
    return bons[0][:400] if bons else ''
def mais_sinopses(lst, n=400):
    falta = [i for i in lst if not i['s']][:n]
    def f(i):
        try:
            b = json.dumps({'context': {'client': {'clientName': 'WEB', 'clientVersion': '2.20251101.00.00', 'hl': 'pt', 'gl': 'BR'}}, 'videoId': i['id']}).encode()
            r = urllib.request.Request('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', b, {'Content-Type': 'application/json'})
            d = json.loads(urllib.request.urlopen(r, timeout=20).read())
            i['s'] = sinopse(d.get('videoDetails', {}).get('shortDescription', ''))
        except Exception: pass
    with cf.ThreadPoolExecutor(8) as ex: list(ex.map(f, falta))
itens, vistos, titulos = [], set(), set()
for x in brutos:
    if x['id'] in vistos or re.search(r'(?i)trailer|full movie|in english|ingl[êe]s|\bfree\b', x['t']): continue
    serie = x['ch'] == 'Séries' or re.search(r'(?i)epis[óo]dio|\bep\.?\s?\d|temporada', x['t'])
    if serie and x['dur'] < 900: continue
    if not serie and x['dur'] < 2700: continue
    vistos.add(x['id'])
    chave = (limpar(x['t']).lower(), serie and x['t'])
    if chave in titulos: continue
    titulos.add(chave)
    tl = x['t'].lower()
    g = next((n for n, r in GEN if re.search(r, tl)), None) or {'Ação': 'Ação', 'Comédia': 'Comédia', 'Drama': 'Drama', 'Família': 'Família', 'Infantil': 'Animação'}.get(x['ch'], 'Drama')
    v = velho.get(x['id'], {})
    sin = descs.get(x['id']) or v.get('s', '')
    sin = sinopse(sin)
    if re.search(r'(?i)\b(the|and|with|of)\b.*\b(the|and|with|of)\b', sin): sin = ''
    itens.append({'id': x['id'], 't': limpar(x['t']), 'g': g, 'tipo': 'Série' if serie else 'Filme', 'min': x['dur'] // 60,
                  'kids': x['ch'] == 'Infantil', 'ch': x['ch'], 'novo': x['pos'] < 8, 's': sin})
for k, v in velho.items():
    if k not in vistos and v.get('ch') != 'NetMovies Global': itens.append(v)
if os.environ.get('SINOPSES'): mais_sinopses(itens)
if len(itens) >= 50:
    json.dump({'itens': itens}, open(ARQ, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(len(brutos), 'videos,', len(itens), 'no catalogo,', sum(1 for i in itens if i['s']), 'com sinopse')
