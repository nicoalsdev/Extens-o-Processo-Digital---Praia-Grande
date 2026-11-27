document.addEventListener('EXT_PUBLICAR_CONTRATO_AUDESP', function(e) {
    const idContrato = e.detail && e.detail.id;
    if (!idContrato) return;

    // 1. Tenta no window principal
    if (typeof window.publicarContrato === 'function') {
        window.publicarContrato(idContrato);
        return;
    }

    // 2. Procura dentro de possíveis iframes da página
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
        try {
            if (iframe.contentWindow && typeof iframe.contentWindow.publicarContrato === 'function') {
                iframe.contentWindow.publicarContrato(idContrato);
                return;
            }
        } catch (err) {
            // Ignora iframes de origem cruzada (cross-origin)
        }
    }

    // 3. Fallback: localiza o botão pelo ID e tenta disparar o evento/atributo
    const btn = document.getElementById(`btn_enviar_contrato_${idContrato}`);
    if (btn) {
        // Caso tenha listener jQuery anexado ao elemento
        if (window.jQuery) {
            window.jQuery(btn).trigger('click');
            return;
        }
        btn.click();
        return;
    }

    console.error('[Extensão AUDESP] Não foi possível localizar publicarContrato nem o botão para o ID:', idContrato);
});