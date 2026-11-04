// ============================================================================
// Contador de visitas (Google Analytics 4) + aviso de cookies (LGPD)
// ============================================================================
// Propriedade "Cascavel de Ouro" na conta Steelmol do Google Analytics.
// Modo de consentimento: começa NEGADO. Sem o "Aceitar", o Google só recebe
// sinais sem cookie (conta a visita de forma anônima e estimada). Com o
// "Aceitar", passa a contar completo. A escolha fica salva neste navegador.
// Nenhum dado pessoal (nome, e-mail, CPF) é enviado ao Google por aqui.
(function () {
  "use strict";

  var ID = "G-768S4CGZZ1";
  var CHAVE = "cascavel_cookies";

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var escolha = "";
  try { escolha = localStorage.getItem(CHAVE) || ""; } catch (e) {}

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: escolha === "aceito" ? "granted" : "denied"
  });
  gtag("js", new Date());
  gtag("config", ID);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);

  // ------------------------------------------------------------ eventos
  function evento(nome, extra) { try { gtag("event", nome, extra || {}); } catch (e) {} }

  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("a, button") : null;
    if (!el) return;
    var href = el.getAttribute("href") || "";
    if (el.id === "btnComprar") {
      evento("begin_checkout", { currency: "BRL", items: [{ item_name: "Ingresso Camarote Box Connection" }] });
    } else if (href.indexOf("ingresso.html") !== -1) {
      evento("clique_ingresso");
    } else if (href.indexOf("wa.me") !== -1) {
      var txt = "";
      try { txt = decodeURIComponent((href.split("text=")[1] || "")); } catch (e) {}
      var m = txt.match(/cota\s+(OURO|PRATA|BRONZE)/i);
      evento("clique_whatsapp", { assunto: m ? "cota " + m[1].toLowerCase() : (/ingresso/i.test(txt) ? "ingresso" : "patrocinio") });
    } else if (/\.pdf($|\?)/i.test(href)) {
      evento("baixou_midia_kit");
    }
  }, true);

  // Página de obrigado: registra o resultado da volta do Mercado Pago.
  if (/obrigado/.test(location.pathname)) {
    try {
      var q = new URLSearchParams(location.search);
      var st = (q.get("status") || q.get("collection_status") || "").toLowerCase();
      if (st) evento(st === "approved" ? "compra_aprovada" : "compra_nao_aprovada", { status: st });
    } catch (e) {}
  }

  // ------------------------------------------------------- aviso de cookies
  if (escolha) return;

  function montarAviso() {
    var caixa = document.createElement("div");
    caixa.setAttribute("role", "dialog");
    caixa.setAttribute("aria-label", "Aviso de cookies");
    caixa.style.cssText = "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;" +
      "background:#0b0b0b;color:#f2f2f2;border:1px solid #F57C1F;border-radius:10px;padding:16px 18px;" +
      "font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.6)";

    var p = document.createElement("p");
    p.style.cssText = "margin:0 0 12px";
    p.textContent = "Usamos cookies do Google Analytics para saber quantas pessoas visitam o site e o que mais interessa. " +
      "Nenhum dado pessoal seu é coletado por aqui. Você aceita?";

    var linha = document.createElement("div");
    linha.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end";

    function botao(texto, principal, valor) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = texto;
      b.style.cssText = "cursor:pointer;border-radius:6px;padding:9px 16px;font:600 14px system-ui,sans-serif;" +
        (principal ? "background:#F57C1F;color:#0b0b0b;border:1px solid #F57C1F"
                   : "background:transparent;color:#f2f2f2;border:1px solid #555");
      b.addEventListener("click", function () {
        try { localStorage.setItem(CHAVE, valor); } catch (e) {}
        if (valor === "aceito") gtag("consent", "update", { analytics_storage: "granted" });
        caixa.parentNode && caixa.parentNode.removeChild(caixa);
      });
      return b;
    }

    linha.appendChild(botao("Recusar", false, "recusado"));
    linha.appendChild(botao("Aceitar", true, "aceito"));
    caixa.appendChild(p);
    caixa.appendChild(linha);
    document.body.appendChild(caixa);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montarAviso);
  else montarAviso();
})();
