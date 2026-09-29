document.addEventListener("click", function (event) {

    const link = event.target.closest('a[href^="/prn/"]');

    if (!link) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const url = new URL(
        link.getAttribute("href"),
        window.location.origin
    ).href;

    chrome.runtime.sendMessage({
        action: "baixarArquivoInterno",
        url: url
    });

}, true);