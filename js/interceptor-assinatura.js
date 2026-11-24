(function () {
  let recuperandoSessao = false;
  let aguardandoConfirmacaoSucesso = false;
  let tentativasNaSessao = 0;
  const MAX_TENTATIVAS = 2;

  const TERMOS_ERRO = [
    "conjunto de chaves não está definido",
    "keyset does not exist"
  ];

  // Helper para exibir SweetAlert2 Toast
  function mostrarToast(icone, titulo, texto = "", duracao = 4000) {
    if (typeof Swal === "undefined") {
      console.warn(`[Toast ${icone}] ${titulo}: ${texto}`);
      return;
    }

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: duracao,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });

    Toast.fire({
      icon: icone,
      title: titulo,
      text: texto
    });
  }

  function isErroDeChave(texto) {
    if (!texto) return false;
    const msg = String(texto).toLowerCase();
    return TERMOS_ERRO.some((termo) => msg.includes(termo));
  }

  async function recuperarContextoToken() {
    if (recuperandoSessao) return;

    if (tentativasNaSessao >= MAX_TENTATIVAS) {
      aguardandoConfirmacaoSucesso = false;
      mostrarToast(
        "error",
        "Falha na recuperação do Token",
        "Reconecte o token USB manualmente e tente novamente.",
        6000
      );
      return;
    }

    recuperandoSessao = true;
    aguardandoConfirmacaoSucesso = true;
    tentativasNaSessao++;

    // 1. Toast avisando que deu erro e está tentando corrigir
    mostrarToast(
      "warning",
      "Sessão do token perdida",
      `Reconectando certificado automaticamente (${tentativasNaSessao}/${MAX_TENTATIVAS})...`,
      4500
    );

    try {
      // Aguarda 1.5s para o middleware PKCS#11/CSP liberar o handle travado
      await new Promise((r) => setTimeout(r, 1500));

      // Se a página usa Lacuna Web PKI, força a reinicialização e relistagem dos certificados
      if (typeof LacunaWebPKI !== "undefined") {
        const pki = new LacunaWebPKI();
        await new Promise((resolve) => {
          pki.init({
            ready: () => {
              pki.listCertificates()
                .success(() => resolve())
                .fail(() => resolve());
            },
            defaultError: () => resolve()
          });
        });
      }

      // Reaciona o botão de assinatura
      const clicou = reexecutarBotaoAssinatura();

      // 2. Toast confirmando que o contexto foi restaurado e a assinatura retomada
      if (clicou) {
        setTimeout(() => {
          // Só mostra sucesso se não disparou outro erro imediatamente
          if (aguardandoConfirmacaoSucesso) {
            mostrarToast(
              "success",
              "Token reconectado!",
              "Assinatura retomada automaticamente.",
              4000
            );
            aguardandoConfirmacaoSucesso = false;
          }
        }, 1200);
      }
    } finally {
      recuperandoSessao = false;
    }
  }

  function reexecutarBotaoAssinatura() {
    const seletoresBotoes = [
      'button[id*="assinar" i]:not([disabled])',
      'button[class*="assinar" i]:not([disabled])',
      '.modal.show button.btn-primary:not([disabled])',
      '#btnAssinar:not([disabled])'
    ];

    for (const seletor of seletoresBotoes) {
      const btn = document.querySelector(seletor);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  // Intercepta console.error do batch-signature.js
  const originalConsoleError = console.error;
  console.error = function (...args) {
    originalConsoleError.apply(console, args);
    const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
    if (isErroDeChave(msg)) {
      recuperarContextoToken();
    }
  };

  // Intercepta mensagens postMessage do ContentScript do assinador
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    try {
      const payload = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
      if (isErroDeChave(payload)) {
        recuperarContextoToken();
      }
    } catch (_) {}
  });

  // Intercepta Promises rejeitadas não tratadas
  window.addEventListener("unhandledrejection", (event) => {
    const motivo = event.reason?.message || event.reason || "";
    if (isErroDeChave(motivo)) {
      recuperarContextoToken();
    }
  });

  // Reseta tentativas ao trocar de documento (#dg922)
  window.addEventListener("hashchange", () => {
    tentativasNaSessao = 0;
    aguardandoConfirmacaoSucesso = false;
  });
})();