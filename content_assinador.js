// content_assinador.js
(function () {
    let uploadQueueMemoria = [];
    let loteEmExecucao = false;
    function isPastaUrl() {
        const url = window.location.href;
        const pastaBaseUrl = 'https://assinadordigitalexterno.praiagrande.sp.gov.br/';
        return url.startsWith(pastaBaseUrl);
    }



    const SIGNED_DOCUMENTS_KEY = "signedDocuments";

    // ==========================================================
    // FUNÇÃO TOAST SWEETALERT2
    // ==========================================================
    function showToast(icon, title) {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: "#2f2f2f",
            color: "#fff",
        });

        Toast.fire({ icon, title });
    }

    chrome.runtime.sendMessage({ action: "getBatchRunning" }, (res) => {
        if (res && res.running) {
            console.log("🔒 Lote em andamento - restaurando bloqueio");

        // pequeno delay para garantir que o DOM carregou
            setTimeout(() => {
                mostrarBloqueioLote("Upload em lote em andamento...");
            }, 500);
        }
    });


    // ==========================================================
    // 1) PEGAR A URL REAL DO lista.html VIA BACKGROUND
    // ==========================================================
    chrome.runtime.sendMessage({ action: "getListaURL" }, (response) => {
        if (!isPastaUrl()) return;



        const ul = localizarMenu();
        if (!ul) return false;

        if (document.getElementById("btnMinhaLista")) return true;

        if (!response || !response.url) {
            console.error("❌ Não consegui obter a URL da lista.html via background.js");
            return;
        }

        const urlLista = response.url;

        function localizarMenu() {
            return (
                document.querySelector('.navbar-nav.ml-2') ||
                document.querySelector('.navbar-nav.ms-auto') ||
                document.querySelector('.navbar-nav.me-auto') ||
                document.querySelector('.navbar-nav') ||
                document.querySelector('ul.navbar-nav') ||
                null
                );
        }

        function inserirBotaoLista(urlLista) {
            if (!isPastaUrl()) return;

            const ul = localizarMenu();
            if (!ul) return false;

            if (document.getElementById("btnMinhaLista")) return true;

    // BOTÃO UPLOAD
            const liUpload = document.createElement("li");
            liUpload.className = "nav-item";

            liUpload.innerHTML = `
        <button id="btnUploadLote" class="ml-2 btn btn btn-outline-light fw-bold">
            Upload em Lote
        </button>
            `;

            ul.appendChild(liUpload);

            document.getElementById("btnUploadLote")
            .addEventListener("click", iniciarUploadSequencial);

    // BOTÃO LISTA
            const li = document.createElement("li");
            li.className = "nav-item";
            li.id = "btnMinhaLista";

            li.innerHTML = `
        <button id="btnOpenLista" class="ml-2 btn btn-outline-light fw-bold">
            Minha Lista
        </button>
            `;

            ul.appendChild(li);

            document.getElementById("btnOpenLista")
            .addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: "openMinhaLista" });
            });

            return true;
        }

        function esperarMenu(urlLista) {
            const menu = localizarMenu();
            if (menu) {
                inserirBotaoLista(urlLista);
                return;
            }

            const observer = new MutationObserver(() => {
                const menu2 = localizarMenu();
                if (menu2) {
                    observer.disconnect();
                    inserirBotaoLista(urlLista);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        esperarMenu(urlLista);
    });

    // ==========================================================
    // 3) PARSE DE DESCRIÇÃO
    // ==========================================================
   function parseDescricaoArquivo(texto) {
    let resto = texto.trim();
    let eTCN = false;

    // 1. Mapeamento dos termos encontrados para os nomes exatos das Categorias
    const mapaCategorias = {
        "termo de ata": "Termo de Ata",
        "termo de prorrogação": "Prorrogação",
        "prorrogação": "Prorrogação",
        "termo de ajuste": "Ajuste",
        "termo de rescisão": "Encerramento",
        "encerramento": "Encerramento",
        "contrato": "Contrato",
        "aditivo": "Aditivo",
        "apostilamento": "Apostilamento",
        "retificação": "Retificação",
        "termo de retificação": "Retificação"
    };

    // 2. Identifica TCN
    if (/\bTCN\b/i.test(resto) || /termo de ci[eê]ncia e notifica[çc][ãa]o/i.test(resto)) {
        eTCN = true;
        resto = resto.replace(/\bTCN\b/gi, "")
                     .replace(/termo de ci[eê]ncia e notifica[çc][ãa]o/gi, "")
                     .trim();
    }

    let tipoDocumento = eTCN ? "Termo de ciência e notificação" : null;

    // 3. Se não for TCN, busca pelos outros tipos mapeados
    if (!tipoDocumento) {
        for (const chave in mapaCategorias) {
            const re = new RegExp("^(" + chave.replace(/ /g, "\\s+") + ")(\\s+\\d+)?", "i");
            const found = resto.match(re);
            if (found) {
                // Converte o termo capturado para a categoria padronizada
                tipoDocumento = mapaCategorias[chave]; 
                resto = resto.replace(re, "").trim();
                break;
            }
        }
    }

    // Limpa traços e espaços no início do resto do texto
    resto = resto.replace(/^[\s-]+/, "").trim();

    // 4. Procura o número do Processo
    const regexProcesso = /\b(\d{3,6}-\d{2}|\d{4}\/\d{2}|\d{2}\.\d{3}\/\d{4})\b/;
    const matchProc = resto.match(regexProcesso);

    if (!matchProc) {
        return {
            tipoDocumento: tipoDocumento || "Não Definido",
            empresa: resto.replace(/^[\s-]+|[\s-]+$/g, "") || null,
            processo: null,
            objeto: resto || texto.trim()
        };
    }

    const processo = matchProc[0];
    const [antesProcesso, depoisProcesso] = resto.split(processo);

    // 5. Extrai Empresa
    let empresa = antesProcesso.trim();
    if (empresa.includes("-")) {
        const partes = empresa.split("-");
        empresa = partes[partes.length - 1].trim();
    }
    empresa = empresa.replace(/^[\s-]+|[\s-]+$/g, "");

    // 6. Extrai Objeto
    const objeto = (depoisProcesso || "").trim().replace(/^[\s-]+/, "");

    return {
        tipoDocumento: tipoDocumento || "Não Definido",
        empresa: empresa || null,
        processo: processo || null,
        objeto: objeto || texto.trim()
    };
}

    // ==========================================================
    // 4) EXTRATOR PRINCIPAL
    // ==========================================================


    function extractDocumentData() {

        const codigoInput = document.querySelector("#CodigoVerificador");
        const codigo = codigoInput ? codigoInput.value.trim() : null;

        let linkCorreto = window.location.href;
        if (codigo) {
            linkCorreto = `https://assinadordigitalexterno.praiagrande.sp.gov.br/assinar/${codigo}?cv=true`;
        }

        const span = document.querySelector("p[data-id] span");
        if (!span) return null;

        let nomeArquivo = span.textContent.trim().replace(/^Nome:\s*/i, "");

        const pageText = document.body.innerText;
        const procMatch = pageText.match(/(\d{3,6}-\d{2}|\d{4}\/\d{2}|\d{2}\.\d{3}\/\d{4})/);
        const processo = procMatch ? procMatch[1] : "Não Encontrado";

        const parsed = parseDescricaoArquivo(`${nomeArquivo} ${processo}`);

        const idFinal = codigo || Date.now().toString();

        return {
            id: idFinal,
            link: linkCorreto,
            tipo: parsed.tipoDocumento || "Não Definido",
            empresa: parsed.empresa || "Não Identificada",
            processo: parsed.processo || processo,
            objeto: parsed.objeto || nomeArquivo,
            dataSalvo: new Date().toISOString()
        };
    }

    function extractDocumentDataFromLi(li) {

        const codigoInput = li.querySelector('input[name="CodigoVerificador"]');
        const codigo = codigoInput ? codigoInput.value.trim() : null;
        if (!codigo) return null;

        const spanNome = li.querySelector('p[name="arquivo"] span');
        if (!spanNome) return null;

        const nomeArquivo = spanNome.textContent
        .replace(/^Nome:\s*/i, "")
        .trim();

        const parsed = parseDescricaoArquivo(nomeArquivo);

        const link = `https://assinadordigitalexterno.praiagrande.sp.gov.br/assinar/${codigo}?cv=true`;

        return {
            id: codigo,
            link,
            tipo: parsed.tipoDocumento || "Não Definido",
            empresa: parsed.empresa || "Não Identificada",
            processo: parsed.processo || "Não Encontrado",
            objeto: parsed.objeto || nomeArquivo,
            dataSalvo: new Date().toISOString()
        };
    }

    function salvarTodosOsDocumentosDaLista() {
        const itens = document.querySelectorAll("li.doc-container");

        itens.forEach(li => {
            const docData = extractDocumentDataFromLi(li);
            if (docData) {
                saveDocument(docData);
            }
        });
    }

    function observarListaDeDocumentos() {
        const lista = document.querySelector("#docList");
        if (!lista) return;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (
                        node.nodeType === 1 &&
                        node.matches("li.doc-container")
                        ) {
                        const docData = extractDocumentDataFromLi(node);
                    if (docData) saveDocument(docData);
                }
            });
            });
        });

        observer.observe(lista, {
            childList: true
        });
    }

    // ==========================================================
    // 5) SALVAR DOCUMENTO  (AGORA COM TOAST)
    // ==========================================================
    async function saveDocument(documentData) {

        try {
            const result = await chrome.storage.local.get([SIGNED_DOCUMENTS_KEY]);
            let documents = result[SIGNED_DOCUMENTS_KEY] || [];

            if (documents.some(doc => doc.id === documentData.id)) {
                console.log("ℹ Documento já salvo anteriormente.");

                // 🔵 Toast: já existia
                showToast("info", "Este documento já está salvo!");

                return;
            }

            documents.push(documentData);
            documents.sort((a, b) => new Date(b.dataSalvo) - new Date(a.dataSalvo));
            //documents = documents.slice(0, 50);

            await chrome.storage.local.set({ [SIGNED_DOCUMENTS_KEY]: documents });

            console.log("🟢 Documento salvo:", documentData);

            // 🟢 Toast de sucesso
            showToast("success", "Documento salvo com sucesso!");

        } catch (error) {
            console.error("❌ Erro ao salvar:", error);

            // 🔴 Toast de erro
            showToast("error", "Erro ao salvar documento!");
        }
    }
    const codigosProcessados = new Set();

    function observarMultiplosUploads() {
        const codigoInput = document.querySelector("#CodigoVerificador");
        if (!codigoInput) return;

    // salva o valor inicial, se existir
        if (codigoInput.value) {
            codigosProcessados.add(codigoInput.value);
            const docData = extractDocumentData();
            if (docData) saveDocument(docData);
        }

        const observer = new MutationObserver(() => {
            const novoCodigo = codigoInput.value?.trim();
            if (!novoCodigo) return;

            if (codigosProcessados.has(novoCodigo)) return;

            codigosProcessados.add(novoCodigo);

            const docData = extractDocumentData();
            if (docData) saveDocument(docData);
        });

        observer.observe(codigoInput, {
            attributes: true,
            attributeFilter: ["value"]
        });
    }

// ==========================================================
// SISTEMA DE UPLOAD EM LOTE PERSISTENTE
// ==========================================================

    async function iniciarUploadSequencial() {
        chrome.runtime.sendMessage({ action: "setBatchRunning", value: true });
        const seletor = document.createElement("input");
        seletor.type = "file";
        seletor.accept = "application/pdf";
        seletor.multiple = true;

        seletor.onchange = async () => {
            const files = Array.from(seletor.files);
            if (!files.length) return;

            showToast("info", "Preparando lote...");
        loteEmExecucao = true; // Bloqueia outras execuções automáticas

        const prepared = await Promise.all(files.map(async (f) => {
            return {
                name: f.name,
                base64: await new Promise(r => {
                    const reader = new FileReader();
                    reader.onload = () => r(reader.result);
                    reader.readAsDataURL(f);
                })
            };
        }));
        loteEmExecucao = true;

        chrome.runtime.sendMessage({ action: "setBatchRunning", value: true });
        mostrarBloqueioLote("Preparando arquivos...");
        // Grava a fila no background
        chrome.runtime.sendMessage({ action: "setBatchQueue", files: prepared }, () => {
            // Após gravar, recarregamos ou chamamos a verificação
            verificarCicloDeUpload();
        });
    };
    seletor.click();
}

// Auxiliar para converter arquivo
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function realizarUploadIndividual(arquivo) {
    return new Promise(async (resolve) => {
        console.log("⬆️ Enviando:", arquivo.name);
        
        const input = document.getElementById("Arquivo");
        const botao = document.querySelector("button[type='submit'], #enviar, .btn-success");

        if (!input || !botao) {
            showToast("error", "Elementos de upload não encontrados");
            return resolve();
        }

        // Injeta o arquivo no input
        const dt = new DataTransfer();
        dt.items.add(arquivo);
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));

        // Clicar no botão e esperar o processamento
        botao.click();

        // Espera o CodigoVerificador mudar (sinal de que o upload terminou)
        // e a página estar pronta para o próximo
        await esperarProximoCiclo();
        resolve();
    });
}


function esperarProximoCiclo() {
    return new Promise(resolve => {
        // Se o site NÃO recarrega a página (AJAX):
        const observer = new MutationObserver((mutations, obs) => {
            const codigoInput = document.querySelector("#CodigoVerificador");
            if (codigoInput && codigoInput.value) {
                obs.disconnect();
                setTimeout(resolve, 2000); // Pausa para estabilidade
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        
        // Se o site RECARREGA a página:
        // Você precisará mover essa lógica para o background.js 
        // enviando o arquivo via chrome.runtime.sendMessage
    });
}



function esperarProcessamentoCompleto(timeout = 10000) {
    return new Promise(resolve => {
        let resolvido = false;

        // fallback por tempo (garantia)
        const timer = setTimeout(() => {
            if (!resolvido) {
                console.warn("⏱ Timeout atingido, seguindo...");
                resolvido = true;
                resolve();
            }
        }, timeout);

        const observer = new MutationObserver(() => {
            const codigoInput = document.querySelector("#CodigoVerificador");

            if (codigoInput && codigoInput.value) {
                clearTimeout(timer);
                observer.disconnect();

                setTimeout(() => {
                    if (!resolvido) {
                        resolvido = true;
                        resolve();
                    }
                }, 1200);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
async function processarProximoDaFila() {


    chrome.runtime.sendMessage({ action: "getNextBatchFile" }, async (response) => {
        if (!response || !response.file) {
            if (response && response.file === null) {
                // Fila vazia, não faz nada ou avisa sucesso se acabou de terminar
            }
            return;
        }

        const { file } = response;
        console.log("⬆️ Processando próximo do lote:", file.name);

        // Converte Base64 de volta para File objeto
        const res = await fetch(file.base64);
        const blob = await res.blob();
        const arquivoFinal = new File([blob], file.name, { type: file.type });

        const input = document.getElementById("Arquivo");
        const botao = document.querySelector("button[type='submit'], #enviar, .btn-success");

        if (input && botao) {
            const dt = new DataTransfer();
            dt.items.add(arquivoFinal);
            input.files = dt.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));

            showToast("info", `Enviando: ${file.name}`);
            
            // Aguarda um pouco para o site processar o "change" e clica
            setTimeout(() => botao.click(), 1500);
        }
    });
}



// ======================================================
// PROTEÇÃO DE INTERFACE (BLOQUEIO DE TELA)
// ======================================================

function mostrarBloqueioLote(mensagem = "Upload em lote em andamento...") {
    // Remove se já existir um
    if (document.getElementById('lote-loading-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'lote-loading-overlay';
    
    const style = document.createElement('style');
    style.textContent = `
        #lote-loading-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); z-index: 100000; 
            display: flex; justify-content: center; align-items: center;
            flex-direction: column; color: white; font-size: 1.5rem;
            font-family: sans-serif; text-align: center;
            backdrop-filter: blur(4px);
        }
        #lote-loading-overlay .spinner-lote {
            border: 6px solid rgba(255, 255, 255, 0.3);
            border-top: 6px solid #f0ad4e; border-radius: 50%;
            width: 60px; height: 60px; animation: spin-lote 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin-lote {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    overlay.appendChild(style);
    overlay.innerHTML += `<div class="spinner-lote"></div><p><b>Aguarde</b><br>${mensagem}</p>`;
    document.body.appendChild(overlay);

    // Impede o usuário de fechar a aba acidentalmente
    window.onbeforeunload = function() {
        return "O upload em lote está em curso. Deseja realmente sair?";
    };
}

function removerBloqueioLote() {
    const overlay = document.getElementById('lote-loading-overlay');
    if (overlay) overlay.remove();
    window.onbeforeunload = null;
}

// ======================================================
// ATUALIZAÇÃO DO UPLOAD FÍSICO COM BLOQUEIO
// ======================================================

// 1. Modifique o executarUploadFisico para desativar o alerta antes do clique
async function executarUploadFisico(fileData) {
    try {
        mostrarBloqueioLote(`Processando: ${fileData.name}`);

        const res = await fetch(fileData.base64);
        const blob = await res.blob();
        const arquivo = new File([blob], fileData.name, { type: "application/pdf" });

        const input = document.getElementById("Arquivo");
        const botao = document.querySelector("button[type='submit'], #enviar, .btn-success");

        if (input && botao) {
            const dt = new DataTransfer();
            dt.items.add(arquivo);
            input.files = dt.files;
            input.dispatchEvent(new Event("change", { bubbles: true }));

            setTimeout(() => {
                window.onbeforeunload = null; // Remove proteção antes do clique
                botao.click();
            }, 2500); 
        }
    } catch (e) {
        console.error("Erro:", e);
        loteEmExecucao = false;
        removerBloqueioLote();
    }
}

// 2. Modifique o redirecionamento para também desativar o alerta
async function verificarCicloDeUpload() {
    // Se já houver um processo de envio a correr nesta aba, não faz nada
    chrome.runtime.sendMessage({ action: "getBatchRunning" }, (status) => {
        if (status?.running) {
            mostrarBloqueioLote("Upload em lote em andamento...");
        }
    });

    const urlHome = "https://assinadordigitalexterno.praiagrande.sp.gov.br/";
    const inputUpload = document.getElementById("Arquivo");
    
    // Verificamos se há itens na fila SEM remover (peek)
    chrome.runtime.sendMessage({ action: "getNextBatch", peek: true }, async (peekResponse) => {
        if (!peekResponse || !peekResponse.hasItems) {

        // 🔥 FINAL DO LOTE
            chrome.runtime.sendMessage({ action: "setBatchRunning", value: false });

        loteEmExecucao = false; // opcional, mas bom manter coerente
        removerBloqueioLote();

        console.log("✅ Lote finalizado");

        return;
    }

        // Se estamos na página de upload
    if (inputUpload) {
            loteEmExecucao = true; // Marca como ocupado
            chrome.runtime.sendMessage({ action: "getNextBatch" }, async (response) => {
                if (response && response.file) {
                    await executarUploadFisico(response.file);
                }
            });
        } else {
            // Se não estamos na home, mas a fila existe, redireciona
            window.onbeforeunload = null; 
            chrome.runtime.sendMessage({ action: "setBatchRunning", value: true });
            window.location.href = urlHome;
        }
    });
}

// Inicializador único: removemos o setTimeout de 800ms antigo para não conflitar
setTimeout(() => {
    if (isPastaUrl()) {
        verificarCicloDeUpload();
    }
}, 3000);

setTimeout(() => {
    if (!isPastaUrl()) return;

    salvarTodosOsDocumentosDaLista();
    observarListaDeDocumentos();

}, 800);



})();

