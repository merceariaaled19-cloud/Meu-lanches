/* Me Contrata - extras (arquivo separado de proposito):
   1) Vagas do SINE (lista oficial do dia, gerada por buscar_sine.py em sine/sine.json)
   2) Vagas de empresas locais (anunciadas gratis em anunciar.html e aprovadas no admin.html; Firestore mc_vagas)
   Funciona "por fora": depois que o index.html monta a lista, este arquivo coloca os cartoes extras no topo. */
(function () {
  var FB_PROJ = "pdv-mercadinho-1c882";
  var FB_KEY = "AIzaSyBxHBnTlyDTe4g13SG9cbsWv0FMM5KazwM";
  var SINE = null, LOCAIS = {}, pedindoSine = false, pedindoLocal = {};

  function e(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function sa(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
  function hojeISO() { var d = new Date(); d = new Date(d.getTime() - 4 * 3600000); return d.toISOString().slice(0, 10); } // horario de Manaus
  function br(iso) { if (!iso) return ""; var p = iso.slice(0, 10).split("-"); return p[2] + "/" + p[1]; }
  function idDe(n) { var h = 0; for (var i = 0; i < n.length; i++) { h = (h * 31 + n.charCodeAt(i)) % 1000000; } return h + 2000000; }
  function local() { return (typeof LOCAL !== "undefined" && LOCAL) ? LOCAL : { uf: "AM", cidade: "Manaus" }; }

  // ---------- dados ----------
  function carregarSine() {
    if (pedindoSine) return; pedindoSine = true;
    fetch("sine/sine.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { SINE = d; try { localStorage.setItem("mc_sine_cache", JSON.stringify(d)); } catch (x) {} desenhar(); })
      .catch(function () { try { SINE = JSON.parse(localStorage.getItem("mc_sine_cache")); } catch (x) {} desenhar(); })
      .then(function () { pedindoSine = false; });
  }
  function val(f) {
    if (!f) return null;
    if ("stringValue" in f) return f.stringValue;
    if ("timestampValue" in f) return f.timestampValue;
    if ("integerValue" in f) return +f.integerValue;
    if ("booleanValue" in f) return f.booleanValue;
    return null;
  }
  function carregarLocais(uf) {
    if (pedindoLocal[uf]) return; pedindoLocal[uf] = true;
    var url = "https://firestore.googleapis.com/v1/projects/" + FB_PROJ + "/databases/(default)/documents:runQuery?key=" + FB_KEY;
    var q = { structuredQuery: { from: [{ collectionId: "mc_vagas" }], where: { fieldFilter: { field: { fieldPath: "uf" }, op: "EQUAL", value: { stringValue: uf } } }, limit: 300 } };
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var out = [];
        (rows || []).forEach(function (row) {
          if (!row.document) return;
          var f = row.document.fields || {}, o = { id: row.document.name.split("/").pop() };
          for (var k in f) o[k] = val(f[k]);
          out.push(o);
        });
        LOCAIS[uf] = out; desenhar();
      })
      .catch(function () { LOCAIS[uf] = LOCAIS[uf] || []; })
      .then(function () { pedindoLocal[uf] = false; });
  }

  // ---------- cartoes ----------
  function cartaoSine(emp) {
    var hoje = hojeISO();
    var vs = (emp.vagas || []).filter(function (v) { return !v.ate || v.ate >= hoje; });
    if (!vs.length) return { html: "", n: 0 };
    var n = vs.reduce(function (s, v) { return s + (v.qtd || 1); }, 0);
    var id = idDe("sine " + emp.empresa);
    var busca = (emp.empresa + " sine " + vs.map(function (v) { return v.cargo; }).join(" ")).toLowerCase();
    var itens = vs.map(function (v) {
      return '<div class="vaga-item"><b>' + e(v.cargo) + '</b>' + (v.tipo ? ' <span class="canal canal-direto">' + e(v.tipo) + '</span>' : '') +
        '<p style="font-size:13px;color:#0a7a42;font-weight:bold">' + (v.qtd ? v.qtd + (v.qtd == 1 ? " vaga" : " vagas") : "") + (v.ate ? " • até " + br(v.ate) : "") + '</p>' +
        (v.info ? '<p style="font-size:13px;color:#555;margin-top:4px">' + e(v.info) + '</p>' : '') +
        '<div class="mini"><a class="cad" href="' + e(v.link) + '" target="_blank" rel="noopener">🏛️ Ver no site oficial</a></div></div>';
    }).join("");
    var como = '<div style="background:#fff8e1;border:1px solid #ffe08a;border-radius:10px;padding:10px;margin:8px 0;font-size:13px;line-height:1.4"><b>📋 Como se candidatar:</b> ' + e(emp.como) +
      ' <a href="' + e(emp.fonte) + '" target="_blank" rel="noopener">Ver lista oficial</a></div>';
    var dia = emp.dia === hoje ? "hoje" : "para " + br(emp.dia);
    var html = '<div class="card mc-extra" data-id="' + id + '" data-cat="outros" data-nome="' + e(busca) + '"><button type="button" class="fav-btn" onclick="toggleSalvar(' + id + ')">🤍</button>' +
      '<div class="top"><div class="logo">🏛️</div><div><h3>' + e(emp.empresa) + '</h3><small style="color:#666">' + e(emp.orgao || "") + '</small><br>' +
      '<span class="canal canal-cadastro">🏛️ Lista oficial do Sine ' + dia + '</span><br><small style="font-weight:bold;color:#0a7a42">✅ ' + n + ' vagas • ' + vs.length + ' cargos</small></div></div>' +
      '<details><summary>Ver as vagas e como ir ▼</summary>' + como + itens + '</details></div>';
    return { html: html, n: n };
  }
  function soDig(t) { return String(t || "").replace(/\D/g, ""); }
  function botaoComo(v) {
    var cargo = v.cargo || "vaga";
    if (v.comoTipo === "whatsapp") {
      var n = soDig(v.como); if (n.length <= 11) n = "55" + n;
      var u = (typeof usuario !== "undefined" && usuario && usuario.nome) ? usuario.nome : "";
      var msg = "Olá! Vi a vaga de " + cargo + " no app Me Contrata e tenho interesse." + (u ? " Meu nome é " + u + "." : "");
      return '<a class="cad" href="https://wa.me/' + n + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">💬 Chamar no WhatsApp</a>';
    }
    if (v.comoTipo === "email") {
      return '<a class="mail" href="mailto:' + e(v.como) + '?subject=' + encodeURIComponent("Currículo - " + cargo) + '">📧 Enviar currículo por e-mail</a>';
    }
    return '<a class="cad" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.como + ", " + (v.cidade || "") + " - " + (v.uf || "")) + '" target="_blank" rel="noopener">📍 Ver endereço no mapa</a>';
  }
  function cartaoLocal(v) {
    var id = idDe("local " + v.id);
    var busca = (v.empresa + " " + v.cargo + " " + (v.bairro || "") + " local").toLowerCase();
    var comoTxt = v.comoTipo === "whatsapp" ? "Chamar no WhatsApp " + v.como : v.comoTipo === "email" ? "Mandar currículo para " + v.como : "Ir pessoalmente: " + v.como;
    return '<div class="card mc-extra" data-id="' + id + '" data-cat="outros" data-nome="' + e(busca) + '"><button type="button" class="fav-btn" onclick="toggleSalvar(' + id + ')">🤍</button>' +
      '<div class="top"><div class="logo">🏠</div><div><h3>' + e(v.empresa) + '</h3>' +
      '<span class="canal canal-direto">📢 Vaga de empresa local</span><br><small style="font-weight:bold;color:#0a7a42">✅ ' + e(v.cargo) + '</small></div></div>' +
      '<details><summary>Ver a vaga ▼</summary><div class="vaga-item"><b>' + e(v.cargo) + '</b>' +
      '<p style="font-size:13px">' + e(v.cidade) + (v.bairro ? " - " + e(v.bairro) : "") + (v.tipo ? " • " + e(v.tipo) : "") + '</p>' +
      (v.descricao ? '<p style="font-size:13px;color:#555;margin-top:4px">' + e(v.descricao) + '</p>' : '') +
      '<p style="font-size:13px;margin-top:6px"><b>Como se candidatar:</b> ' + e(comoTxt) + '</p>' +
      '<div class="mini">' + botaoComo(v) + '</div>' +
      '<p style="font-size:11px;color:#888;margin-top:6px">Anunciada pela própria empresa' + (v.aprovadoEm ? " em " + br(v.aprovadoEm) : "") + '. Nunca pague para conseguir vaga.</p></div></details></div>';
  }

  // ---------- desenha no topo da lista ----------
  function desenhar() {
    var lista = document.getElementById("lista"); if (!lista) return;
    var antigos = lista.querySelectorAll(".mc-extra"); for (var i = 0; i < antigos.length; i++) antigos[i].remove();
    var L = local(), html = "", nSine = 0, nLocal = 0, hoje = hojeISO();
    (LOCAIS[L.uf] || []).forEach(function (v) {
      if (sa(v.cidade) !== sa(L.cidade)) return;
      if (v.expira && new Date(v.expira) < new Date()) return;
      html += cartaoLocal(v); nLocal++;
    });
    if (SINE && SINE[L.uf]) {
      var col = SINE.coletado ? new Date(SINE.coletado) : null;
      var fresco = col && (Date.now() - col.getTime()) < 2 * 86400000;
      for (var c in SINE[L.uf]) {
        if (sa(c) !== sa(L.cidade) || !fresco) continue;
        SINE[L.uf][c].forEach(function (emp) {
          if (emp.valido_ate && emp.valido_ate < hoje) return;
          var r = cartaoSine(emp); html += r.html; nSine += r.n;
        });
      }
    }
    if (html) {
      var vazio = lista.querySelector("p"); if (vazio && !lista.querySelector(".card:not(.mc-extra)") && /Nenhuma vaga/.test(vazio.innerText)) vazio.remove();
      lista.insertAdjacentHTML("afterbegin", html);
    }
    var res = document.getElementById("resumoVagas");
    if (res && res.getAttribute("data-base")) {
      var base = res.getAttribute("data-base");
      var extra = [];
      if (nSine) extra.push("🏛️ +" + nSine + " do Sine");
      if (nLocal) extra.push("📢 +" + nLocal + " de empresas locais");
      res.innerText = base + (extra.length ? " • " + extra.join(" • ") : "");
    }
    try { atualizarCoracoes(); filtrar(); } catch (x) {}
  }

  // botao "Anunciar vaga gratis"
  function botaoAnunciar() {
    if (document.getElementById("mcAnunciar")) return;
    var s = document.querySelector(".search"); if (!s) return;
    var d = document.createElement("div");
    d.id = "mcAnunciar"; d.style.cssText = "padding:0 12px 4px";
    d.innerHTML = '<a id="mcAnunciarLink" href="anunciar.html" style="display:block;text-align:center;background:#ffcc00;color:#222;font-weight:bold;padding:12px;border-radius:12px;text-decoration:none;font-size:14px">📢 Tem empresa ou comércio? Anuncie sua vaga grátis</a>';
    s.parentNode.insertBefore(d, s);
  }
  function linkAnunciar() {
    var a = document.getElementById("mcAnunciarLink"); if (!a) return;
    var L = local(); a.href = "anunciar.html?uf=" + encodeURIComponent(L.uf) + "&cidade=" + encodeURIComponent(L.cidade);
  }

  // liga no index.html: depois de cada montarLista, desenha os extras
  if (typeof window.montarLista === "function") {
    var original = window.montarLista;
    window.montarLista = function (d) {
      original(d);
      var res = document.getElementById("resumoVagas"); if (res) res.setAttribute("data-base", res.innerText);
      var L = local();
      linkAnunciar();
      if (!SINE) carregarSine();
      carregarLocais(L.uf);
      desenhar();
    };
  }
  botaoAnunciar(); linkAnunciar();
  carregarSine();
  carregarLocais(local().uf);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { carregarSine(); } });
  // se a lista ja tinha sido montada antes deste arquivo carregar
  if (typeof DADOS_UF !== "undefined" && DADOS_UF && typeof listaDaCidade === "function") { try { window.montarLista(listaDaCidade(DADOS_UF)); } catch (x) {} }
})();
