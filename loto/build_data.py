import json,urllib.request,sys,os
J=['megasena','quina','lotofacil','duplasena','lotomania','timemania','diadesorte','maismilionaria','supersete']
out={}
for j in J:
    p='/tmp/l_'+j+'.json'
    if len(sys.argv)>1 and sys.argv[1]=='net' or not os.path.exists(p):
        d=json.load(urllib.request.urlopen('https://loteriascaixa-api.herokuapp.com/api/'+j,timeout=60))
    else: d=json.load(open(p))
    d=sorted([x for x in d if x.get('dezenas')],key=lambda x:x['concurso'])
    draws=[]
    for x in d:
        dz=x['dezenas']
        if j=='supersete': draws.append(''.join(str(int(n)) for n in dz)); continue
        dz=[int(n) for n in dz]
        if j=='duplasena': draws.append([sorted(dz[:6]),sorted(dz[6:12])])
        else: draws.append(sorted(dz))
    x=d[-1]
    o={'ultimo':x['concurso'],'data':x['data'],'prox':x.get('dataProximoConcurso'),'premio':x.get('valorEstimadoProximoConcurso'),'acumulou':x.get('acumulou'),
       'dezenas':[int(n) for n in x['dezenas']] if j!='supersete' else [int(n) for n in x['dezenas']],'n':len(d)}
    if j=='maismilionaria':
        tr={}
        for y in d:
            for t in y.get('trevos') or []: tr[int(t)]=tr.get(int(t),0)+1
        o['trevosFreq']=tr;o['trevos']=[int(t) for t in x.get('trevos') or []]
    if j=='diadesorte':
        ms={}
        for y in d:
            m=y.get('mesSorte')
            if m: ms[m]=ms.get(m,0)+1
        o['mesFreq']=ms;o['mes']=x.get('mesSorte')
    if j=='timemania':
        tc={}
        for y in d:
            m=y.get('timeCoracao')
            if m: tc[m.strip()]=tc.get(m.strip(),0)+1
        o['timeFreq']=dict(sorted(tc.items(),key=lambda a:-a[1])[:15]);o['time']=x.get('timeCoracao')
    if j=='supersete':
        o['sorteios']=draws
    elif j=='duplasena':
        o['sorteios']=[' '.join('%02d'%n for n in s) for pair in draws for s in pair]
    else:
        o['sorteios']=[' '.join('%02d'%n for n in s) for s in draws]
    out[j]=o
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'dados.json'),'w'),separators=(',',':'),ensure_ascii=False)
print({k:(v['ultimo'],len(v['sorteios'])) for k,v in out.items()})
