# Busca vagas reais abertas em Manaus nos portais oficiais das empresas
# (Gupy, Workday, Pandape) e grava me-contrata/vagas.json.
# Roda todo dia pelo GitHub Actions. Empresa sem vaga em Manaus nao entra.
import json, re, html, datetime, os, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"

def get(url, data=None, headers=None):
    h = {"User-Agent": UA, "Accept-Language": "pt-BR"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

def limpa(t):
    return re.sub(r"\s+", " ", html.unescape(t or "")).strip()

TIPOS = {"effective": "Efetivo", "apprentice": "Aprendiz", "internship": "Estágio", "temporary": "Temporário",
         "talent_pool": "Banco de talentos", "associate": "Associado", "lecturer": "Professor", "trainee": "Trainee",
         "summer": "Temporário", "outsource": "Terceirizado", "freelancer": "Autônomo", "autonomous": "Autônomo",
         "legal_entity": "PJ", "volunteer": "Voluntário"}

# ---------- categoria e emoji ----------
REGRAS = [
    ("supermercado", "🛒", r"assa[ií]|atacad|supermerc|nova era|carrefour|\bdb\b|mercado|hiper"),
    ("outros", "🏨", r"hospitality|hotel"),
    ("saude", "🏥", r"hospital|hapvida|sa[uú]de|farm[aá]c|pague menos|sabin|unimed|cl[ií]nica|davita|drogar|check ?up|laborat|\brd\b|ach[eé]"),
    ("energia", "⚡", r"energ|enerwatt|fog[aá]s|g[aá]s|el[eé]tric|transformador|moura|eletro"),
    ("loja", "🏪", r"loja|bemol|renner|torra|ramsons|riachuelo|havan|magazine|vivara|joias|farm\b|colch|cacau|petz|camicado|taco|bagaggio|dress|iplace|claro|vivo|[oó]tica|granado|centauro|espa[cç]olaser|bio mundo|varejo|extra natal|dufry|duty|brasileirissima|monte carlo|cantu"),
    ("industria", "🏭", r"valgroup|ind[uú]stria|honda|yamaha|caloi|daikin|coca|panasonic|mondial|philco|jabil|samsung|lg\b|lg electronics|whirlpool|procter|p&g|michelin|elgin|positivo|weg|denso|tigre|crown|ccl|hana|itam|tesa|seb|bmw|eldorado|sidi|fortlev|dexco|votorantim|3cora|ambev|ind[uú]stria|f[aá]brica|tecnologia|electronics"),
]
def categoria(nome):
    n = nome.lower()
    for cat, emo, rx in REGRAS:
        if re.search(rx, n):
            return cat, emo
    return "outros", "🧰"

def nome_bonito(n):
    n = limpa(n)
    for sep in [" | ", " - O ", " #", " – "]:
        if sep in n:
            n = n.split(sep)[0]
    n = re.sub(r"^(Vagas|Carreiras|Trabalhe Conosco -|Trabalhe Conosco)\s+", "", n, flags=re.I).strip()
    return n.upper()

# ---------- GUPY: descobre empresas com vaga em cada estado pelo portal e le a pagina de cada uma ----------
UFS = {"AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas", "BA": "Bahia", "CE": "Ceará",
       "DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão", "MT": "Mato Grosso",
       "MS": "Mato Grosso do Sul", "MG": "Minas Gerais", "PA": "Pará", "PB": "Paraíba", "PR": "Paraná",
       "PE": "Pernambuco", "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
       "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina", "SP": "São Paulo",
       "SE": "Sergipe", "TO": "Tocantins"}
UF_POR_NOME = {v.lower(): k for k, v in UFS.items()}
TERMOS = ["", "operador", "auxiliar", "assistente", "tecnico", "analista", "vendedor", "atendente", "jovem aprendiz",
          "estagio", "motorista", "caixa", "repositor", "producao", "manutencao", "enfermagem", "consultor", "supervisor",
          "engenheiro", "logistica", "almoxarife", "eletricista", "promotor", "farmaceutico", "recepcionista", "cozinheiro",
          "seguranca", "administrativo", "coordenador", "mecanico", "montador", "inspetor", "banco de talentos", "pcd",
          "gerente", "especialista", "conferente", "balconista", "limpeza", "estoquista", "professor", "desenvolvedor",
          "comercial", "financeiro", "qualidade", "operacional", "loja", "agente", "ajudante", "garcom"]
TERMOS_UF = TERMOS[:25]   # outros estados: menos termos pra caber no tempo
EXTRA_GUPY = ["honda", "yamaha", "caloi", "daikinbrasil", "solarcocacola", "bemol", "assai", "lge", "novaera",
              "ambev", "positivotecnologia", "sejaelgin", "lojasrenner", "farmaciaspmenos", "hapvidandi"]

def portal(q):
    try:
        s = get("https://portal.gupy.io/job-search/" + q)
        m = re.search(r'__NEXT_DATA__[^>]*>(.*?)</script>', s, re.S)
        return (json.loads(m.group(1))["props"]["pageProps"].get("initialJobList") or {}).get("data", [])
    except Exception:
        return []

def descobrir_gupy():
    qs = []
    for p in range(1, 10):
        pg = "&page=%d" % p if p > 1 else ""
        for t in TERMOS:   # Manaus completo
            qs.append(("term=" + urllib.parse.quote(t) + "&" if t else "") + "city=Manaus" + pg)
        for uf, nome in UFS.items():
            for t in TERMOS_UF:
                qs.append(("term=" + urllib.parse.quote(t) + "&" if t else "") + "state=" + urllib.parse.quote(nome) + pg)
    subs = {s: None for s in EXTRA_GUPY}
    with ThreadPoolExecutor(16) as ex:
        for data in ex.map(portal, qs):
            for x in data:
                m = re.match(r"https://([a-z0-9-]+)\.gupy\.io", x.get("jobUrl") or "")
                if m:
                    subs[m.group(1)] = subs.get(m.group(1)) or x.get("careerPageName")
    return subs

NOMES = {"hapvidandi": "Hapvida NotreDame", "vagas-mrveco": "MRV&CO", "programadeestagiomrveco": "MRV&CO",
         "konicaminolta": "Konica Minolta", "consultordevendastahto": "Tahto", "areastecnicasvivo": "Vivo",
         "vivo": "Vivo", "lojasvivo": "Vivo", "vivodiversidade": "Vivo", "vempraftd": "FTD Educação",
         "lge": "LG Electronics", "valgroup": "Valgroup (indústria)", "novaera": "Supermercados Nova Era",
         "bagaggioextranatal": "Bagaggio", "extranatal-dressto": "Dress To", "extranatal": "Centauro",
         "centaurotalentos": "Centauro", "assai": "Assaí Atacadista", "yamaha": "Yamaha"}

def gupy_empresa(item):
    """devolve (nome, [vaga com uf e cidade])"""
    sub, nome_portal = item
    try:
        s = get("https://%s.gupy.io/" % sub)
    except Exception:
        return None
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
    if not m:
        return None
    jobs = json.loads(m.group(1))["props"]["pageProps"].get("jobs") or []
    nome = NOMES.get(sub) or nome_portal
    if not nome:
        t = re.search(r"<title>([^<]+)</title>", s)
        nome = t.group(1) if t else sub
    vagas = []
    for j in jobs:
        ad = ((j.get("workplace") or {}).get("address") or {})
        cidade = limpa(ad.get("city"))
        uf = (ad.get("stateShortName") or UF_POR_NOME.get((ad.get("state") or "").lower().strip()) or "").upper()
        if not cidade or uf not in UFS:
            continue
        tipo = (j.get("type") or "").replace("vacancy_type_", "")
        vagas.append({"uf": uf, "cidade": cidade, "cargo": limpa(j.get("title")),
                      "local": cidade + (" - " + limpa(ad["district"]) if ad.get("district") else ""),
                      "tipo": TIPOS.get(tipo, ""), "link": "https://%s.gupy.io/jobs/%s" % (sub, j["id"])})
    return (nome, vagas)

# ---------- WORKDAY ----------
WORKDAY = [  # (tenant, servidor, site, nome)
    ("sec", "wd3", "Samsung_Careers", "SAMSUNG"),
    ("jabil", "wd5", "Jabil_Careers", "JABIL"),
    ("pg", "wd5", "1000", "P&G (PROCTER & GAMBLE)"),
    ("michelinhr", "wd3", "Michelin", "MICHELIN"),
    ("flextronics", "wd1", "Careers", "FLEX"),
]
def workday(t):
    tenant, srv, site, nome = t
    base = "https://%s.%s.myworkdayjobs.com" % (tenant, srv)
    vagas, off = [], 0
    while off < 200:
        body = json.dumps({"appliedFacets": {}, "limit": 20, "offset": off, "searchText": "Manaus"}).encode()
        d = json.loads(get(base + "/wday/cxs/%s/%s/jobs" % (tenant, site), data=body,
                           headers={"Content-Type": "application/json", "Accept": "application/json"}))
        posts = d.get("jobPostings") or []
        for j in posts:
            loc, tit = j.get("locationsText") or "", j.get("title") or ""
            if "manaus" not in (loc + " " + tit).lower():
                continue
            vagas.append({"uf": "AM", "cidade": "Manaus", "cargo": limpa(tit), "local": "Manaus", "tipo": "",
                          "link": base + "/" + site + j.get("externalPath", "")})
        off += 20
        if len(posts) < 20:
            break
    return (nome, vagas)

# ---------- PANDAPE ----------
PANDAPE = [("https://panasonicdobrasil.pandape.infojobs.com.br", "PANASONIC"),
           ("https://mondial.pandape.catho.com.br", "MONDIAL"),
           ("https://philcoeletronicos.pandape.infojobs.com.br", "PHILCO")]
def pandape(t):
    base, nome = t
    out, vistos = [], set()
    for p in range(1, 11):
        s = get(base + "/?PageNumber=%d" % p)
        cards = re.findall(r'<a[^>]*class="card card-vacancy[^"]*"[^>]*href="(/Detail/\d+)">(.*?)</a>', s, re.S)
        novos = [c for c in cards if c[0] not in vistos]
        if not novos:
            break
        for href, corpo in novos:
            vistos.add(href)
            tit = re.search(r'<h3[^>]*title="([^"]+)"', corpo)
            if "Manaus" not in re.sub(r"<[^>]+>", " ", corpo):
                continue
            out.append({"uf": "AM", "cidade": "Manaus", "cargo": limpa(tit.group(1)) if tit else "", "local": "Manaus", "tipo": "", "link": base + href})
    return (nome, out)

def seguro(fn, x):
    try:
        return fn(x)
    except Exception:
        return None

# ---------- junta tudo ----------
resultados = []
subs = descobrir_gupy()
print("empresas gupy descobertas:", len(subs), flush=True)
with ThreadPoolExecutor(16) as ex:
    resultados += list(ex.map(lambda i: seguro(gupy_empresa, i), subs.items()))
    resultados += list(ex.map(lambda t: seguro(workday, t), WORKDAY))
    resultados += list(ex.map(lambda t: seguro(pandape, t), PANDAPE))

def chave_cidade(c):
    import unicodedata
    return unicodedata.normalize("NFKD", c).encode("ascii", "ignore").decode().lower().strip()

# estrutura: uf -> chave cidade -> {"nome": cidade, "empresas": {nome: {...}}}
porUF = {}
for r in resultados:
    if not r:
        continue
    nome, vagas = r
    nome = nome_bonito(nome)
    if "CONFIDENCIA" in nome or nome in ("RECRUTAMENTO", "TRABALHE CONOSCO", "PÁGINA DE CARREIRA"):
        continue
    cat, emo = categoria(nome)
    for v in vagas:
        if not v["cargo"]:
            continue
        cid = porUF.setdefault(v["uf"], {}).setdefault(chave_cidade(v["cidade"]), {"nome": v["cidade"], "empresas": {}})
        e = cid["empresas"].setdefault(nome, {"empresa": nome, "cat": cat, "emoji": emo, "vagas": [], "_l": set()})
        if v["link"] in e["_l"]:
            continue
        e["_l"].add(v["link"])
        e["vagas"].append({"cargo": v["cargo"], "local": v["local"], "tipo": v["tipo"], "link": v["link"]})

agora = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
quando = agora.strftime("%d/%m/%Y %H:%M")
pasta = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(pasta, "vagas"), exist_ok=True)
indice, total = {}, 0
for uf in UFS:
    cidades = porUF.get(uf, {})
    saida = {}
    for k, c in cidades.items():
        lista = [{kk: vv for kk, vv in e.items() if kk != "_l"} for e in c["empresas"].values()]
        lista.sort(key=lambda e: -len(e["vagas"]))
        saida[c["nome"]] = lista
    n = sum(len(e["vagas"]) for l in saida.values() for e in l)
    total += n
    indice[uf] = {"estado": UFS[uf], "vagas": n,
                  "cidades": sorted(([c, sum(len(e["vagas"]) for e in l)] for c, l in saida.items()), key=lambda x: -x[1])}
    json.dump({"atualizado": quando, "uf": uf, "cidades": saida},
              open(os.path.join(pasta, "vagas", uf + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump({"atualizado": quando, "estados": indice},
          open(os.path.join(pasta, "vagas", "index.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
# arquivo antigo (so Manaus) pra quem ainda tem a versao anterior do app
manaus = json.load(open(os.path.join(pasta, "vagas", "AM.json"), encoding="utf-8"))["cidades"].get("Manaus", [])
json.dump({"atualizado": quando, "empresas": manaus}, open(os.path.join(pasta, "vagas.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(total, "vagas no Brasil;", sum(len(e["vagas"]) for e in manaus), "em Manaus")
