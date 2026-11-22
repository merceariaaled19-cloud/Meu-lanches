#!/usr/bin/env python3
"""Robô de avisos do Compra Certa (Web Push / VAPID).
Lê as inscrições em Firestore cc_inscricoes (login do robô), compara os favoritos de cada
celular com as promoções de compras/dados/precos.json e manda notificação só do que é NOVO
(produto + loja + preço ainda não avisado para aquele celular). Guarda o que já foi avisado
em compras/dados/avisados.json (só códigos, sem dados pessoais).
Segredos vêm do ambiente (GitHub Secrets): CC_ROBO_SENHA e VAPID_PRIVATE_KEY. Nada é impresso."""
import json, os, re, sys, hashlib, unicodedata, urllib.request
from datetime import datetime, timedelta, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
PRECOS = os.path.join(AQUI, 'dados', 'precos.json')
AVISADOS = os.path.join(AQUI, 'dados', 'avisados.json')
API_KEY = 'AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM'   # chave pública do app web Firebase (não é segredo)
PROJ = 'pdv-mercadinho-1c882'
ROBO = 'robo.compracerta@merceariaaled19.app'
BASE = 'https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents' % PROJ
HOJE = datetime.now(timezone(timedelta(hours=-4))).date()
POR_VEZ = 4          # no máximo 4 notificações por celular por rodada
PARADAS = {'de', 'da', 'do', 'das', 'dos', 'e', 'com', 'em', 'a', 'o'}


def norm(s):
    s = unicodedata.normalize('NFD', (s or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def casa(fav_palavras, nome_norm):
    pal = nome_norm.split()
    # a 1ª palavra do favorito tem que estar no começo do nome (evita 'açúcar' casar com 'Coca sem açúcar')
    if not any(p.startswith(fav_palavras[0]) for p in pal[:3]): return False
    return all(any(p.startswith(f) for p in pal) for f in fav_palavras)


def chave_item(it):
    return hashlib.sha1(('%s|%s|%.2f' % (norm(it['produto']), it['loja'], it['preco'])).encode()).hexdigest()[:14]


def req(url, dados=None, metodo=None, token=None):
    h = {'Content-Type': 'application/json'}
    if token: h['Authorization'] = 'Bearer ' + token
    r = urllib.request.Request(url, data=json.dumps(dados).encode() if dados is not None else None, headers=h, method=metodo)
    with urllib.request.urlopen(r, timeout=30) as x:
        b = x.read()
        return json.loads(b) if b else {}


def valor(v):
    if 'stringValue' in v: return v['stringValue']
    if 'integerValue' in v: return int(v['integerValue'])
    if 'doubleValue' in v: return v['doubleValue']
    if 'arrayValue' in v: return [valor(x) for x in v['arrayValue'].get('values', [])]
    if 'mapValue' in v: return {k: valor(x) for k, x in v['mapValue'].get('fields', {}).items()}
    return None


def inscricoes(token):
    docs, pt = [], None
    while True:
        u = BASE + '/cc_inscricoes?pageSize=300' + ('&pageToken=' + pt if pt else '')
        j = req(u, token=token)
        for d in j.get('documents', []):
            f = {k: valor(v) for k, v in d.get('fields', {}).items()}
            f['_nome'] = d['name']; f['_id'] = d['name'].rsplit('/', 1)[1]
            docs.append(f)
        pt = j.get('nextPageToken')
        if not pt: return docs


def promos_para(favs, itens):
    """Para cada favorito, lista de itens em promoção que combinam (mais barato primeiro)."""
    res = {}
    for fav in favs[:10]:
        fp = [w for w in norm(fav).split() if w not in PARADAS]
        if not fp: continue
        m = [it for it in itens if casa(fp, it['_n'])]
        if m: res[fav] = sorted(m, key=lambda x: x['preco'])
    return res


def reais(v):
    return 'R$ ' + ('%.2f' % v).replace('.', ',')


def main(enviar=True):
    senha, vapid = os.environ.get('CC_ROBO_SENHA'), os.environ.get('VAPID_PRIVATE_KEY')
    if not senha or not vapid:
        print('Segredos CC_ROBO_SENHA/VAPID_PRIVATE_KEY ausentes; avisos pulados.'); return
    from pywebpush import webpush, WebPushException
    dados = json.load(open(PRECOS, encoding='utf-8'))
    itens = []
    for it in dados['itens']:
        if not it.get('promo'): continue
        if it.get('validade') and it['validade'] < HOJE.isoformat(): continue
        it['_n'] = norm(it['produto']); itens.append(it)
    try:
        avis = json.load(open(AVISADOS, encoding='utf-8'))
    except Exception:
        avis = {}
    tok = req('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY,
              {'email': ROBO, 'password': senha, 'returnSecureToken': True})['idToken']
    subs = inscricoes(tok)
    enviados = apagados = 0
    novos_avis = {}
    for s in subs:
        sid = hashlib.sha256(s['_id'].encode()).hexdigest()[:16]
        ja = avis.get(sid, {})
        sub = s.get('sub') or {}
        if not sub.get('endpoint') or not (sub.get('keys') or {}).get('p256dh'):
            novos_avis[sid] = ja; continue
        msgs = []
        for fav, lista in promos_para(s.get('favs') or [], itens).items():
            novos = [it for it in lista if chave_item(it) not in ja]
            for it in lista: ja.setdefault(chave_item(it), HOJE.isoformat())
            if novos:
                it = novos[0]
                corpo = '%s em promoção no %s: %s' % (it['produto'], it['loja'], reais(it['preco']))
                extra = []
                if it.get('preco_app'): extra.append('no app ' + reais(it['preco_app']))
                if it.get('preco_cartao'): extra.append('app+cartão ' + reais(it['preco_cartao']))
                if extra: corpo += ' (' + ', '.join(extra) + ')'
                if len(novos) > 1: corpo += ' · +%d oferta%s' % (len(novos) - 1, 's' if len(novos) > 2 else '')
                msgs.append({'title': '🛒 ' + fav.strip().capitalize() + ' em promoção', 'body': corpo,
                             'q': fav.strip(), 'tag': 'cc-' + norm(fav).replace(' ', '-')[:40]})
        if len(msgs) > POR_VEZ:
            resto = msgs[POR_VEZ - 1:]
            msgs = msgs[:POR_VEZ - 1] + [{'title': '🛒 Mais promoções dos seus favoritos',
                                          'body': ', '.join(m['q'] for m in resto) + '. Toque para ver.', 'q': '', 'tag': 'cc-mais'}]
        morto = False
        for m in msgs:
            if not enviar: print('[teste]', m['title'], '|', m['body']); continue
            try:
                webpush(subscription_info={'endpoint': sub['endpoint'], 'keys': sub['keys']},
                        data=json.dumps(m, ensure_ascii=False), vapid_private_key=vapid,
                        vapid_claims={'sub': 'mailto:merceariaaled19@gmail.com'}, ttl=12 * 3600)
                enviados += 1
            except WebPushException as e:
                st = getattr(e.response, 'status_code', 0) if e.response is not None else 0
                if st in (404, 410):
                    morto = True; break
                print('push falhou (status %s)' % st)
        if morto:
            try: req('https://firestore.googleapis.com/v1/' + s['_nome'], metodo='DELETE', token=tok); apagados += 1
            except Exception: pass
            continue
        limite = (HOJE - timedelta(days=30)).isoformat()
        novos_avis[sid] = {k: v for k, v in ja.items() if v >= limite}
    if not enviar:
        print('[teste] nada gravado.'); return
    with open(AVISADOS, 'w', encoding='utf-8') as f:
        json.dump(novos_avis, f, separators=(',', ':'), sort_keys=True)
    print('Avisos: %d celulares, %d notificações, %d inscrições vencidas apagadas.' % (len(subs), enviados, apagados))


if __name__ == '__main__':
    main(enviar='--teste' not in sys.argv)
