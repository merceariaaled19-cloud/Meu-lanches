# Busca vagas reais abertas em Manaus nos portais oficiais das empresas
# e grava me-contrata/vagas.json. Roda todo dia pelo GitHub Actions.
import json, re, html, datetime, os, urllib.request

UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "ignore")

# subdominio gupy -> (nome, categoria, emoji)
GUPY = {
    "honda": ("HONDA", "industria", "🏍️"),
    "yamaha": ("YAMAHA", "industria", "🏍️"),
    "caloi": ("CALOI", "industria", "🚲"),
    "daikinbrasil": ("DAIKIN", "industria", "❄️"),
    "solarcocacola": ("SOLAR COCA-COLA", "industria", "🥤"),
    "bemol": ("BEMOL", "loja", "🏪"),
    "assai": ("ASSAÍ", "supermercado", "🛒"),
}
PANDAPE = {
    "https://panasonicdobrasil.pandape.infojobs.com.br": ("PANASONIC", "industria", "📺"),
    "https://mondial.pandape.catho.com.br": ("MONDIAL", "industria", "🔌"),
    "https://philcoeletronicos.pandape.infojobs.com.br": ("PHILCO", "industria", "📺"),
}
JABIL = ("JABIL", "industria", "💻")

def limpa(t):
    return re.sub(r"\s+", " ", html.unescape(t or "")).strip()

def gupy(sub):
    s = get(f"https://{sub}.gupy.io/")
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
    jobs = json.loads(m.group(1))["props"]["pageProps"].get("jobs", []) if m else []
    out = []
    for j in jobs:
        ad = ((j.get("workplace") or {}).get("address") or {})
        if (ad.get("city") or "").strip().lower() != "manaus":
            continue
        tipo = (j.get("type") or "").replace("vacancy_type_", "")
        out.append({"cargo": limpa(j.get("title")), "local": "Manaus" + (" - " + ad["district"] if ad.get("district") else ""),
                    "tipo": {"effective": "Efetivo", "apprentice": "Aprendiz", "internship": "Estágio", "temporary": "Temporário", "talent_pool": "Banco de talentos"}.get(tipo, ""),
                    "link": f"https://{sub}.gupy.io/jobs/{j['id']}"})
    return out

def pandape(base):
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
            txt = limpa(re.sub(r"<[^>]+>", " ", corpo))
            if "Manaus" not in txt:
                continue
            out.append({"cargo": limpa(tit.group(1)) if tit else "", "local": "Manaus", "tipo": "", "link": base + href})
    return out

def jabil():
    out, vistos = [], set()
    for p in [4]:
        s = get("https://jobs.jabil.com/en/location/manaus-jobs/626/3469034-3665361-3663517/%d" % p)
        itens = re.findall(r'href="(/en/job/manaus/[^"]+)"[^>]*>([^<]+)</a>', s)
        novos = [i for i in itens if i[0] not in vistos]
        if not novos:
            break
        for href, tit in novos:
            vistos.add(href)
            out.append({"cargo": limpa(tit), "local": "Manaus", "tipo": "", "link": "https://jobs.jabil.com" + href})
    return out

empresas, erros = [], []
fontes = [(lambda s=s: gupy(s), GUPY[s]) for s in GUPY] + [(lambda b=b: pandape(b), PANDAPE[b]) for b in PANDAPE] + [(jabil, JABIL)]
for fn, (nome, cat, emoji) in fontes:
    try:
        vagas = fn()
    except Exception as e:
        erros.append(nome)
        continue
    vagas = [v for v in vagas if v["cargo"]]
    if vagas:
        empresas.append({"empresa": nome, "cat": cat, "emoji": emoji, "vagas": vagas})

empresas.sort(key=lambda e: -len(e["vagas"]))
agora = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
dados = {"atualizado": agora.strftime("%d/%m/%Y %H:%M"), "empresas": empresas, "fontes_com_erro": erros}
destino = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vagas.json")
json.dump(dados, open(destino, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(sum(len(e["vagas"]) for e in empresas), "vagas em", len(empresas), "empresas; erros:", erros)
