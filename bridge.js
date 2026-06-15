// bridge.js - Roda no contexto do site (MAIN world) e tem acesso livre às funções nativas
window.addEventListener("DISPARAR_ACAO_NATIVA_SITE", (e) => {
    const { acao, idProcesso, codigoPasta } = e.detail;

    try {
        if (acao === 'DESVINCULAR') {
            if (typeof Desvincular === "function") {
                Desvincular(idProcesso, codigoPasta);
            }
        } else if (acao === 'VINCULAR') {
            if (typeof vincularProcessoAPasta === "function") {
                vincularProcessoAPasta(idProcesso, codigoPasta);
            }
        }
        
        // Dá um pequeno tempo para as requisições internas do site finalizarem antes do reload
        setTimeout(() => location.reload(), 300);
    } catch (err) {
        console.error("❌ Erro ao executar função nativa no MAIN world:", err);
    }
});