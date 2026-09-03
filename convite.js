// ============================================================================
// Painel de convites de convidado especial — Camarote Box Connection
// ============================================================================
// A senha NUNCA é conferida aqui no navegador: ela viaja no corpo da chamada e
// quem decide é a function no Firebase (segredo CONVITE_SENHA). Guardar em
// sessionStorage é só conveniência — some quando a aba fecha.
(function () {
  "use strict";

  var API = "https://us-central1-steelmol.cloudfunctions.net/cascavelIngresso";
  var CHAVE = "convite_cascavel_senha";

  var senhaGuardada = "";
  var ultimoPdf = "";      // base64 do PDF recém-emitido
  var ultimoNome = "";

  function $(id) { return document.getElementById(id); }

  function dizer(el, texto, classe) {
    el.className = "recado" + (classe ? " " + classe : "");
    el.textContent = texto;
    el.hidden = false;
  }
  function calar(el) { el.hidden = true; el.textContent = ""; }

  function mostrarTelas(logado) {
    $("telaSenha").hidden = logado;
    $("telaForm").hidden = !logado;
    $("telaLista").hidden = !logado;
  }

  // ------------------------------------------------------------ chamadas
  function chamar(acao, dados, aoTerminar) {
    var corpo = { senha: senhaGuardada };
    for (var k in dados) { if (Object.prototype.hasOwnProperty.call(dados, k)) corpo[k] = dados[k]; }

    var estadoHttp = 0;
    fetch(API + "?acao=" + acao, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo)
    }).then(function (r) {
      estadoHttp = r.status;
      return r.json().catch(function () { return {}; });
    }).then(function (d) {
      if (estadoHttp === 401 || (d && d.ok === false && d.motivo === "senha_invalida")) {
        senhaGuardada = "";
        try { sessionStorage.removeItem(CHAVE); } catch (e) {}
        mostrarTelas(false);
        dizer($("recadoSenha"), "Senha incorreta. Tente de novo.", "erro");
        aoTerminar(null);
        return;
      }
      aoTerminar(d || {});
    }).catch(function () {
      aoTerminar({ ok: false, motivo: "rede" });
    });
  }

  // ------------------------------------------------------------- emitir
  var MOTIVOS = {
    nome_invalido: "Escreva o nome completo do convidado (pelo menos 3 letras).",
    cpf_invalido: "O CPF precisa ter 11 números, ou pode ficar em branco.",
    email_invalido: "Esse e-mail não parece válido. Confira ou deixe em branco.",
    falha_pdf: "O convite não pôde ser gerado. Tente de novo.",
    rede: "Não deu para falar com o servidor. Confira a internet e tente de novo."
  };

  function emitir() {
    var nome = $("nome").value.trim();
    if (nome.length < 3) {
      dizer($("recadoForm"), MOTIVOS.nome_invalido, "erro");
      return;
    }
    var cpf = $("cpf").value.replace(/\D/g, "");
    if (cpf && cpf.length !== 11) {
      dizer($("recadoForm"), MOTIVOS.cpf_invalido, "erro");
      return;
    }

    var botao = $("btnEmitir");
    botao.disabled = true;
    botao.textContent = "Emitindo...";
    dizer($("recadoForm"), "Gerando o convite e enviando o e-mail. Pode levar alguns segundos.");

    chamar("convite", {
      nome: nome,
      cpf: cpf,
      email: $("email").value.trim(),
      quantidade: parseInt($("quantidade").value, 10) || 1,
      observacao: $("observacao").value.trim()
    }, function (d) {
      botao.disabled = false;
      botao.textContent = "Emitir convite";
      if (!d) { return; }                       // senha caiu: já tratado
      if (d.ok !== true) {
        dizer($("recadoForm"), MOTIVOS[d.motivo] || "Não deu certo. Tente de novo.", "erro");
        return;
      }
      calar($("recadoForm"));
      pintarResultado(d);
      carregarLista();
    });
  }

  function pintarResultado(d) {
    ultimoPdf = d.pdfBase64 || "";
    ultimoNome = d.nome || "convidado";

    $("rNome").textContent = d.nome || "";
    var pessoas = d.quantidade > 1 ? (d.quantidade + " pessoas") : "1 pessoa";
    $("rResumo").textContent = "Vale por " + pessoas + " · entrada " + (d.horario || "14:00 às 24:00");

    var caixa = $("rCodigos");
    caixa.textContent = "";
    (d.codigos || []).forEach(function (c) {
      var div = document.createElement("div");
      div.className = "codigo";
      div.textContent = c;
      caixa.appendChild(div);
    });

    var aviso = $("recadoResultado");
    if (d.emailEnviado === true) {
      dizer(aviso, "O convite foi enviado por e-mail para o convidado.", "bom");
    } else if (d.emailDonoEnviado === true) {
      dizer(aviso, "Sem e-mail do convidado: o PDF foi para a sua caixa (steelmolrs@gmail.com). "
        + "Baixe abaixo e mande pelo WhatsApp.");
    } else {
      dizer(aviso, "O convite foi criado e já vale na portaria, mas nenhum e-mail saiu. "
        + "Baixe o PDF abaixo e guarde.", "erro");
    }

    $("telaForm").hidden = true;
    $("telaResultado").hidden = false;
    window.scrollTo(0, 0);
  }

  function baixarPdf() {
    if (!ultimoPdf) { return; }
    var binario = atob(ultimoPdf);
    var bytes = new Uint8Array(binario.length);
    for (var i = 0; i < binario.length; i++) { bytes[i] = binario.charCodeAt(i); }
    var blob = new Blob([bytes], { type: "application/pdf" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "convite-" + ultimoNome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function outroConvite() {
    $("nome").value = "";
    $("cpf").value = "";
    $("email").value = "";
    $("observacao").value = "";
    $("quantidade").value = "1";
    ultimoPdf = "";
    calar($("recadoResultado"));
    $("telaResultado").hidden = true;
    $("telaForm").hidden = false;
    $("nome").focus();
  }

  // ------------------------------------------------------------- listagem
  function carregarLista() {
    $("resumoLista").textContent = "Carregando...";
    chamar("convites", {}, function (d) {
      if (!d || d.ok !== true) {
        $("resumoLista").textContent = "Não deu para carregar a lista agora.";
        return;
      }
      var convites = d.convites || [];
      $("resumoLista").textContent = convites.length === 0
        ? "Nenhum convite emitido ainda."
        : d.total + (d.total > 1 ? " convites emitidos" : " convite emitido") + " · " + d.pessoas + (d.pessoas > 1 ? " pessoas no total" : " pessoa no total");

      var alvo = $("tabelaLista");
      alvo.textContent = "";
      if (convites.length === 0) { return; }

      var tabela = document.createElement("table");
      tabela.className = "lista";
      var cab = document.createElement("tr");
      ["Convidado", "Pessoas", "Códigos", "Entrou"].forEach(function (t) {
        var th = document.createElement("th");
        th.textContent = t;
        cab.appendChild(th);
      });
      tabela.appendChild(cab);

      convites.forEach(function (c) {
        var tr = document.createElement("tr");

        var tdNome = document.createElement("td");
        tdNome.textContent = c.nome;
        if (c.email) {
          var pe = document.createElement("div");
          pe.style.color = "#5F5E59";
          pe.style.fontSize = "12px";
          pe.textContent = c.email;
          tdNome.appendChild(pe);
        }
        if (c.observacao) {
          var po = document.createElement("div");
          po.style.color = "#5F5E59";
          po.style.fontSize = "12px";
          po.textContent = c.observacao;
          tdNome.appendChild(po);
        }
        tr.appendChild(tdNome);

        var tdQtd = document.createElement("td");
        tdQtd.textContent = String(c.quantidade);
        tr.appendChild(tdQtd);

        var tdCod = document.createElement("td");
        tdCod.className = "cod";
        tdCod.textContent = (c.codigos || []).join(" ");
        tr.appendChild(tdCod);

        var tdUso = document.createElement("td");
        if (c.usados > 0) {
          tdUso.className = "marca-usado";
          tdUso.textContent = c.usados + " de " + c.quantidade;
        } else {
          tdUso.textContent = "—";
        }
        tr.appendChild(tdUso);

        tabela.appendChild(tr);
      });
      alvo.appendChild(tabela);
    });
  }

  // ---------------------------------------------------------------- entrar
  function entrar() {
    var v = $("senha").value.trim();
    if (!v) {
      dizer($("recadoSenha"), "Digite a senha do painel.", "erro");
      return;
    }
    senhaGuardada = v;
    try { sessionStorage.setItem(CHAVE, v); } catch (e) {}
    calar($("recadoSenha"));
    $("senha").value = "";
    mostrarTelas(true);
    $("nome").focus();
    carregarLista();          // a senha é conferida de verdade aqui
  }

  function sair() {
    senhaGuardada = "";
    try { sessionStorage.removeItem(CHAVE); } catch (e) {}
    mostrarTelas(false);
    $("telaResultado").hidden = true;
    calar($("recadoSenha"));
  }

  // ------------------------------------------------------------------ liga
  $("btnEntrar").addEventListener("click", entrar);
  $("senha").addEventListener("keydown", function (ev) { if (ev.key === "Enter") { entrar(); } });
  $("verSenha").addEventListener("change", function () {
    $("senha").type = this.checked ? "text" : "password";
  });
  $("btnEmitir").addEventListener("click", emitir);
  $("btnSair").addEventListener("click", sair);
  $("btnBaixar").addEventListener("click", baixarPdf);
  $("btnOutro").addEventListener("click", outroConvite);
  $("btnAtualizar").addEventListener("click", carregarLista);

  var salva = "";
  try { salva = sessionStorage.getItem(CHAVE) || ""; } catch (e) { salva = ""; }
  if (salva) {
    senhaGuardada = salva;
    mostrarTelas(true);
    carregarLista();
  }
})();
