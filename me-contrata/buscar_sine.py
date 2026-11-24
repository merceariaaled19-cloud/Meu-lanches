# Busca as vagas do SINE nas fontes OFICIAIS e grava me-contrata/sine/sine.json
#  - SINE AMAZONAS (Governo do AM / Setemp): portal oficial portaldotrabalhador.am.gov.br/jobs
#    (lista das vagas abertas agora; cada vaga tem pagina propria no portal)
#  - SINE MANAUS (Prefeitura / Semtepi): noticia diaria "Sine Manaus oferta N vagas ... DD/MM" em manaus.am.gov.br
#    (so entra a lista do dia de hoje ou de amanha; lista velha nao entra)
# Separado do buscar_vagas.py de proposito. Roda pelo GitHub Actions (.github/workflows/sine.yml).
# Se uma fonte falhar, ela simplesmente nao aparece (nunca reaproveita lista antiga).
import json, re, html, datetime, os, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
TZ = datetime.timezone(datetime.timedelta(hours=-4))  # Manaus
AGORA = datetime.datetime.now(TZ)
HOJE = AGORA.date()

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "pt-BR"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "ignore")

def txt(h):
    h = re.sub(r"<script.*?</script>|<style.*?</style>", " ", h or "", flags=re.S)
    h = re.sub(r"<br\s*/?>|</p>|</div>|</li>|</h\d>", "\n", h)
    h = html.unescape(re.sub(r"<[^>]+>", " ", h))
    return "\n".join(re.sub(r"[ \t\xa0]+", " ", l).strip() for l in h.split("\n") if l.strip())

def curto(t, n=260):
    t = re.sub(r"\s+", " ", t or "").strip()
    return t if len(t) <= n else t[:n].rsplit(" ", 1)[0] + "..."

# ---------------- SINE AMAZONAS (portal oficial) ----------------
PT = "https://www.portaldotrabalhador.am.gov.br"
COMO_SINE_AM = ("Vá à Casa do Trabalhador do Sine Amazonas (Galeria+, Av. Djalma Batista, 1018, entre o Amazonas Shopping "
                "e o Manaus Plaza), de segunda a sexta, das 8h às 13h. Leve currículo e documentos originais: RG, CPF, PIS, "
                "Carteira de Trabalho, comprovante de escolaridade e de residência. Também atende nos PACs Studio 5, "
                "Alvorada e Via Norte, no Shopping Cidade Leste e no SindMetal. Ou toque em \"Quero me candidatar\" "
                "no site oficial (precisa de cadastro no Sine).")

def sine_am_detalhe(href):
    try:
        t = txt(get(PT + href))
    except Exception:
        return {}
    linhas = t.split("\n")
    cidade = ""
    try:
        i = linhas.index("Vagas de Emprego") if "Vagas de Emprego" in linhas else -1
        # depois do titulo vem "Cidade" , "Brasil"
        for j in range(max(i, 0), min(len(linhas), i + 8)):
            if linhas[j] == "," and j > 0:
                cidade = linhas[j - 1]
                break
    except Exception:
        pass
    m = re.search(r"Brasil\n(.*?)\nQuero me candidatar", t, re.S)
    info = m.group(1) if m else ""
    return {"cidade": cidade, "info": curto(info.replace("\n", " "))}

def sine_amazonas():
    s = get(PT + "/jobs")
    blocos = re.findall(r'<div class="setemp-vaga"[^>]*data-publish="on"[^>]*>(.*?)</address>', s, re.S)
    itens = []
    for b in blocos:
        a = re.search(r'href="(/jobs/detail/[^"]+)"\s*>\s*<span>(.*?)</span>', b, re.S)
        q = re.search(r'setemp-vagas-badge">\s*(\d+)', b)
        if not a:
            continue
        itens.append({"href": a.group(1), "cargo": curto(html.unescape(a.group(2)), 120), "qtd": int(q.group(1)) if q else 0})
    with ThreadPoolExecutor(8) as ex:
        dets = list(ex.map(lambda i: sine_am_detalhe(i["href"]), itens))
    porCidade = {}
    for i, d in zip(itens, dets):
        cidade = d.get("cidade") or "Manaus"
        porCidade.setdefault(cidade, []).append({
            "cargo": i["cargo"], "qtd": i["qtd"], "local": cidade + " - Sine Amazonas",
            "tipo": "PcD" if re.search(r"pcd|defici", i["cargo"], re.I) else "",
            "info": d.get("info", ""), "link": PT + i["href"]})
    return {cidade: [{"empresa": "SINE AMAZONAS", "orgao": "Governo do Amazonas (Setemp)", "cat": "outros", "emoji": "🏛️",
                      "fonte": PT + "/jobs", "como": COMO_SINE_AM, "dia": HOJE.isoformat(),
                      "valido_ate": (HOJE + datetime.timedelta(days=1)).isoformat(), "vagas": v}]
            for cidade, v in porCidade.items()}

# ---------------- SINE MANAUS (Prefeitura, noticia diaria) ----------------
WP = "https://www.manaus.am.gov.br/wp-json/wp/v2/posts"
COMO_SINE_MAO = ("Vá a um posto do Sine Manaus (Prefeitura): Av. Constantino Nery, 1272, São Geraldo; ou Shopping Phelippe "
                 "Daou, Av. Camapuã, 2939, Cidade de Deus, das 8h às 14h. Leve currículo, certificados e documentos originais: RG, CPF, PIS, "
                 "Carteira de Trabalho, comprovante de escolaridade e de residência. Não pode entrar de bermuda, short, "
                 "regata ou chinelo.")

def data_titulo(t, publicado):
    m = re.search(r"(\d{1,2})/(\d{1,2})(?:/(\d{4}))?", t)
    if not m:
        return None
    ano = int(m.group(3)) if m.group(3) else publicado.year
    try:
        d = datetime.date(ano, int(m.group(2)), int(m.group(1)))
    except ValueError:
        return None
    if d < publicado - datetime.timedelta(days=200):  # virada de ano
        d = d.replace(year=ano + 1)
    return d

def sine_manaus():
    q = WP + "?search=" + urllib.parse.quote("sine manaus") + "&per_page=10&orderby=date&_fields=id,date,link,title"
    posts = json.loads(get(q))
    escolhido = None
    for p in posts:
        tit = txt(p["title"]["rendered"])
        if not re.search(r"sine manaus.*vagas", tit, re.I):
            continue
        pub = datetime.date.fromisoformat(p["date"][:10])
        dia = data_titulo(tit, pub)
        if dia and HOJE <= dia <= HOJE + datetime.timedelta(days=1):
            if not escolhido or dia < escolhido[1]:   # prefere a lista de HOJE
                escolhido = (p, dia, tit)
    if not escolhido:
        return {}
    p, dia, tit = escolhido
    full = json.loads(get(WP + "/" + str(p["id"]) + "?_fields=content,link"))
    ps = [txt(x) for x in re.findall(r"<p[^>]*>(.*?)</p>", full["content"]["rendered"], re.S)]
    vagas, atual, secao = [], None, ""
    for s in ps:
        s1 = s.replace("\n", " ").strip()
        m = re.match(r"^(\d+)\s+vagas?\s*[–-]\s*(.+)$", s1)
        if s1.upper().startswith("VAGAS ") and not m:
            secao = s1
            continue
        if m:
            cargo = m.group(2)
            pcd = bool(re.search(r"pcd|defici", cargo + " " + secao, re.I))
            cargo = re.sub(r"\s*[–-]\s*Vagas? (exclusivas?|destinadas?) para Pessoas? com Defici[êe]ncia.*$", "", cargo, flags=re.I)
            atual = {"cargo": curto(cargo, 120), "qtd": int(m.group(1)), "local": "Manaus - Sine Manaus",
                     "tipo": "PcD" if pcd else "", "info": [], "link": full["link"], "ate": dia.isoformat()}
            vagas.append(atual)
            continue
        if not atual:
            continue
        a = re.match(r"^Dispon[íi]vel at[ée]\s+(\d{1,2})/(\d{1,2})/(\d{4})", s1)
        if a:
            atual["ate"] = datetime.date(int(a.group(3)), int(a.group(2)), int(a.group(1))).isoformat()
            continue
        if re.match(r"^(Escolaridade|Experi[êe]ncia|Requisitos|Atividades)", s1):
            atual["info"].append(s1)
    for v in vagas:
        v["info"] = curto(" ".join(v["info"]), 300)
    vagas = [v for v in vagas if v["ate"] >= HOJE.isoformat()]
    if not vagas:
        return {}
    return {"Manaus": [{"empresa": "SINE MANAUS", "orgao": "Prefeitura de Manaus (Semtepi)", "cat": "outros", "emoji": "🏛️",
                        "fonte": full["link"], "titulo": tit, "como": COMO_SINE_MAO, "dia": dia.isoformat(),
                        "valido_ate": max(v["ate"] for v in vagas), "vagas": vagas}]}

# ---------------- junta e grava ----------------
saida = {"atualizado": AGORA.strftime("%d/%m/%Y %H:%M"), "coletado": AGORA.isoformat(timespec="minutes"), "AM": {}}
for nome, fn in (("SINE AMAZONAS", sine_amazonas), ("SINE MANAUS", sine_manaus)):
    try:
        r = fn()
    except Exception as e:
        print(nome, "falhou:", e)
        r = {}
    for cidade, lista in r.items():
        saida["AM"].setdefault(cidade, []).extend(lista)
    print(nome, sum(len(e["vagas"]) for l in r.values() for e in l), "cargos")

pasta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sine")
os.makedirs(pasta, exist_ok=True)
json.dump(saida, open(os.path.join(pasta, "sine.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
