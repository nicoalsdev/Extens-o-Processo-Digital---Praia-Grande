(function () {
  function preventPopover() {
    // 1. Remove os atributos do HTML para desativar o gatilho nativo do Bootstrap
    const emailPopoverEl = document.getElementById('emailPopover');
    if (emailPopoverEl) {
      emailPopoverEl.removeAttribute('data-toggle');
      emailPopoverEl.removeAttribute('data-trigger');
      emailPopoverEl.removeAttribute('data-original-title');
      emailPopoverEl.removeAttribute('title');
    }

    // 2. Se o jQuery e o Bootstrap já tiverem sido carregados
    if (window.jQuery) {
      const $ = window.jQuery;
      const $el = $('#emailPopover');

      if ($el.length) {
        // Se o popover já foi inicializado, destrói a instância
        if ($el.data('bs.popover')) {
          $el.popover('destroy');
        }

        // Sobrescreve o método .popover no elemento para ignorar chamadas futuras (como o .popover('show'))
        const originalPopover = $.fn.popover;
        $.fn.popover = function (option) {
          if (this.is('#emailPopover')) {
            return this; // Intercepta e ignora qualquer comando no #emailPopover
          }
          return originalPopover.apply(this, arguments);
        };
      }
    }
  }

  // Executa imediatamente e acompanha alterações no DOM
  preventPopover();

  // Executa novamente quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', preventPopover);

  // Observador para o caso do elemento ser inserido dinamicamente via Ajax
  const observer = new MutationObserver(() => {
    if (document.getElementById('emailPopover')) {
      preventPopover();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();