  const SIGNED_DOCUMENTS_KEY = 'signedDocuments';
  const documentsList = document.getElementById('documents-list');
  const emptyMessage = document.getElementById('empty-message');


        //let documentosAgrupados = {}; // ← acessível em todo o código
        // A função showToast agora utiliza o SweetAlert2 (Swal)
        /**
         * Exibe um toast de notificação simples usando SweetAlert2.
         * @param {string} message A mensagem a ser exibida.
         * @param {('success'|'error'|'info'|'warning')} icon O ícone do toast.
         */


  function renderGroupCard(processo, grupo, docMaisRecente) {

    const cardWrapper = document.createElement("div");
    cardWrapper.className = "col-12 col-sm-6 col-md-4 col-lg-3";

    const card = document.createElement("div");
    card.className = "card shadow-sm h-100";

    const dateStr = formatDateTime(docMaisRecente.dataSalvo);

    card.innerHTML = `
        <div class="card-body d-flex flex-column">
        
            <h6 class="fw-bold text-primary">
                ${grupo[0].empresa || "EMPRESA DESCONHECIDA"}<br>
                Processo: ${processo}
            </h6>

            <p class="text-muted small flex-grow-1">
                ${grupo.length} documento(s) salvo(s)
            </p>

            <div class="text-muted small mb-3">
                <span class="text-secondary">ÚLTIMO: ${dateStr}</span>
            </div>

            <div class="d-flex justify-content-between">
                <button 
                    class="btn btn-sm btn-secondary view-process-btn"
                    data-processo="${processo}"
                >
                    Ver Processo
                </button>

                <button 
                    class="btn btn-sm btn-danger delete-process-btn"
                    data-processo="${processo}"
                >
                    Excluir
                </button>
            </div>

        </div>
    `;

    cardWrapper.appendChild(card);
    documentsList.appendChild(cardWrapper);
}


async function renderAll() {
    const result = await chrome.storage.local.get([SIGNED_DOCUMENTS_KEY]);
    let documents = result[SIGNED_DOCUMENTS_KEY] || [];

    // Ordenar os docs dentro de cada grupo
    documents.sort((a, b) => new Date(b.dataSalvo) - new Date(a.dataSalvo));

    // 🔵 AGRUPA POR PROCESSO
    //documentosAgrupados = agruparDocumentosPorProcesso(documents);

    // Limpa a área
    documentsList.innerHTML = '';

    if (documents.length === 0) {
        emptyMessage.style.display = 'block';
        document.getElementById('clear-all-btn').style.display = 'none';
        return;
    }

    emptyMessage.style.display = 'none';
    document.getElementById('clear-all-btn').style.display = 'inline-block';

    // 🔵 Agora renderizamos por processo (e não mais item por item)
    Object.keys(documentosAgrupados).forEach(processo => {
        const grupo = documentosAgrupados[processo];

        // Pega o documento mais recente do grupo
        const docMaisRecente = grupo[0];

        //renderGroupCard(processo, grupo, docMaisRecente);
    });
}




function renderList() {
    const list = document.getElementById("savedList");
    list.innerHTML = "";

    savedItems.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item";

        li.innerHTML = `
            <strong>${item.empresa} - ${item.processo}</strong><br>
            ${item.objeto}<br>
            <small>${item.tipo} - salvo em ${item.dataSalvo}</small>

            <div class="mt-3 d-flex gap-2">
                <button class="btn btn-primary btn-sm enviar-btn" data-index="${index}">
                    Enviar
                </button>

                <button class="btn btn-danger btn-sm excluir-btn" data-index="${index}">
                    Excluir
                </button>
            </div>
        `;

        list.appendChild(li);
    });
}


function showToast(message, icon = 'info') {
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: icon,
        title: message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
}

function createItemHTML(item, index) {
    return `
        <li class="list-group-item">

            <strong>${item.empresa} - ${item.processo}</strong><br>
            ${item.objeto}<br>
            <small>${item.tipo} - salvo em ${item.data}</small><br><br>

            <button class="btn btn-primary btn-sm enviar-btn" data-index="${index}">
                Enviar
            </button>

            <button class="btn btn-danger btn-sm excluir-btn" data-index="${index}">
                Excluir
            </button>

        </li>
    `;
}


        /**
         * Formata a data para um formato legível (DD/MM/YYYY HH:MM)
         * @param {string} isoString Data em formato ISO.
         * @returns {string} Data e hora formatadas.
         */
function formatDateTime(isoString) {
    if (!isoString) return 'Data Desconhecida';
    const date = new Date(isoString);
    
            // Opções de formatação para data e hora
    const options = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        hour12: false
    };
    
    try {
        return date.toLocaleTimeString('pt-BR', options);
    } catch (e) {
        return date.toLocaleTimeString(undefined, options);
    }
}

function buscarAssinaturas(id, cardElement) {

    chrome.runtime.sendMessage(
        { action: "getSignatures", id },
        (response) => {

            if (!response || !response.ok) {
                console.warn("Erro ao buscar assinaturas:", response?.error);
                return;
            }

            const assinaturas = response.data || [];
            const total = assinaturas.length;

            // Badge de assinaturas
            const badge = document.createElement("div");
            badge.className = "badge bg-secondary mt-2";
            badge.textContent = `Assinaturas: ${total}`;
            cardElement.appendChild(badge);

            // Se houver uma ou mais assinaturas → remover botão ENVIAR
            if (total > 0) {
                const btnEnviar = cardElement.querySelector(".enviar-btn");
                if (btnEnviar) {
                    btnEnviar.remove();
                    console.log(`🔵 Botão ENVIAR removido para ID ${id} (já possui ${total} assinatura(s))`);
                }
            }

        }
        );
}

/**
 * Agrupa a lista plana de documentos por número de processo.
 * @param {Array<Object>} documentos - A lista completa de documentos.
 * @returns {Object} Um objeto onde as chaves são os números de processo.
 */
function agruparDocumentosPorProcesso(documentos) {
    return documentos.reduce((acc, doc) => {
        const key = doc.processo || "SEM_PROCESSO";
        if (!acc[key]) acc[key] = [];
        acc[key].push(doc);
        return acc;
    }, {});
}


        /**
         * Renderiza um único item da lista.
         * @param {Object} doc O objeto do documento.
         */
function renderDocumentItem(doc) {
    const dateStr = formatDateTime(doc.dataSalvo);

    const cardWrapper = document.createElement('div');
    cardWrapper.className = "col-12 col-sm-6 col-md-4 col-lg-3"; // 👈 4 por linha

    const card = document.createElement('div');
    card.className = "card shadow-sm h-100";
    card.id = `doc-${doc.id}`;

    card.innerHTML = `
        <div class="card-body d-flex flex-column">

            <h6 class="fw-bold text-primary">
            <a href="${doc.link}" target="_blank" class="text-decoration-none text-primary">
                ${doc.empresa || "EMPRESA DESCONHECIDA"} - ${doc.processo}
                </a>
            </h6>

            <p class="text-muted small mt-2 flex-grow-1">
                ${doc.objeto || "Objeto não informado"}
            </p>

            <div class="text-muted small mb-3">
                ${doc.tipo || "Tipo não definido"}<br>
                <span class="text-secondary">SALVO EM: ${dateStr}</span>
            </div>

            <div class="d-flex justify-content-between">
     

                <button 
                    class="btn btn-sm btn-danger delete-btn"
                    data-action="delete"
                    data-id="${doc.id}"
                    data-processo="${doc.processo}"
                >
                    Excluir
                </button>

                 <button 
                    class="btn btn-sm btn-primary enviar-btn"
                    data-index="${doc.index}"
                    data-empresa="${doc.empresa}"
                    data-processo="${doc.processo}"
                    data-link="${doc.link}"
                >
                    Enviar
                </button>
            </div>

        </div>
    `;

    cardWrapper.appendChild(card);
    documentsList.appendChild(cardWrapper);

    buscarAssinaturas(doc.id, card);
}

async function deleteProcess(processo) {
    const result = await chrome.storage.local.get([SIGNED_DOCUMENTS_KEY]);
    let docs = result[SIGNED_DOCUMENTS_KEY] || [];

    docs = docs.filter(d => d.processo !== processo);

    await chrome.storage.local.set({ [SIGNED_DOCUMENTS_KEY]: docs });

    showToast("Processo removido!", "success");
    //renderAll();
}


document.addEventListener("click", function (e) {

    const btn = e.target.closest("button");
    if (!btn) return;

    // BOTÃO ENVIAR
    if (btn.classList.contains("enviar-btn")) {
        
        // --------------------------------------------------------
        // CORREÇÃO AQUI: BUSCA GLOBAL PARA OS SETORES
        // --------------------------------------------------------
        const setoresContainer = document.querySelector(".setores-container");
        let setoresMarcados = []; // Inicializa como array vazio

        if (setoresContainer) {
            // Busca todos os inputs marcados DENTRO do container global
            setoresMarcados = [...setoresContainer.querySelectorAll("input:checked")]
            .map(i => i.value);
        }
        
        console.log("Setores Marcados (Global):", setoresMarcados);


        // --------------------------------------------------------

// --- NOVA LÓGICA DE DATA ---
        const hoje = new Date();
        const dataPrazo = new Date(hoje);
        dataPrazo.setDate(hoje.getDate() + 7);

    // Formata para DD/MM/YYYY
        const prazoFormatado = dataPrazo.toLocaleDateString('pt-BR'); 
    // ---------------------------

        const empresa = btn.dataset.empresa || '';
        const processo = btn.dataset.processo || '';
        const link = btn.dataset.link || '';
        const titulo = `${empresa} - ${processo}`;
        const categoriaVal = document.getElementById('categoria').value; // Pega a categoria do select

        let dataFormatada = "";
        const dataVal = document.getElementById('data').value;
        if (dataVal) {
    // Converte de AAAA-MM-DD para DD/MM/AAAA (formato InfoPath)
            const partes = dataVal.split('-');
            dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`; 
        }
        const urlSharepoint =
        "https://www.intra.pg/SEAD/Lists/AssDigital/Item/newifs.aspx?List=da67fc64-1b63-4608-b859-8de4bc9b1fd8&Source=http%3A%2F%2Fwww.intra.pg%2FSEAD%2FSitePages%2Fassd2.aspx&RootFolder=&Web=8e1dc9f9-9ceb-4c32-9146-0572f2adb824";

        // Cria a aba
        chrome.tabs.create({ url: urlSharepoint }, function (tab) {
            if (!tab || !tab.id) {
                console.error("Falha ao criar aba.");
                return;
            }

            const tabId = tab.id;

            // Listener temporário que aguarda a aba ficar "complete"
            const onUpdated = function (updatedTabId, changeInfo, updatedTab) {
                if (updatedTabId !== tabId) return;

                // aguardamos status=complete (página carregada)
                if (changeInfo.status === 'complete') {
                    // envia a mensagem para o content script nessa aba
                    chrome.tabs.sendMessage(tabId, {
                        action: "preencher_sead",
                        titulo,
                        link,
                        prazo: prazoFormatado,
                setores: setoresMarcados, // Usa o array capturado globalmente
                categoria: categoriaVal,  // <-- NOVO CAMPO ADICIONADO
                data: dataFormatada       // <-- NOVO CAMPO ADICIONADO
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Erro sendMessage:", chrome.runtime.lastError.message);
                } else {
                    console.log("Resposta do content_sead:", response);
                }
            });

                    // remove o listener (uma vez enviado, não precisamos mais)
                    chrome.tabs.onUpdated.removeListener(onUpdated);
                }
            };

            // Adiciona o listener
            chrome.tabs.onUpdated.addListener(onUpdated);

            // Timeout de segurança: fallback
            setTimeout(() => {
                try {
                    chrome.tabs.sendMessage(tabId, {
                        action: "preencher_sead",
                        titulo,
                        link,
                       prazo: prazoFormatado,     // Adicionado aqui para manter igual ao principal
                       setores: setoresMarcados,
                categoria: categoriaVal,   // <-- NOVO CAMPO NO FALLBACK TAMBÉM
                data: dataFormatada        // <-- NOVO CAMPO NO FALLBACK TAMBÉM
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("Fallback sendMessage falhou:", chrome.runtime.lastError.message);
                } else {
                    console.log("Fallback resposta:", response);
                }
            });
                } catch (e) {
                    console.warn("Erro no fallback sendMessage:", e);
                }
                chrome.tabs.onUpdated.removeListener(onUpdated);
            }, 10000); // 10s timeout
        });
    }



    /*
    // --- NOVA LÓGICA: ABRIR O MODAL DO PROCESSO ---
    const viewBtn = e.target.closest(".view-process-btn");
    if (viewBtn) {
        const processo = viewBtn.dataset.processo;
        // 1. Pegue os documentos agrupados (assumindo que estão armazenados)
        const documentosDoProcesso = documentosAgrupados[processo] || [];

    const cardsHTML = gerarCardsParaModal(documentosDoProcesso);

    document.getElementById('process-cards-container').innerHTML = cardsHTML;
    document.getElementById('processModalLabel').textContent = 
        `Documentos do Processo: ${processo}`;

    const processModal = new bootstrap.Modal(document.getElementById('processModal'));
    processModal.show();
    return;
    }

    // --- NOVA LÓGICA: EXCLUIR PROCESSO ---
 const deleteBtn = e.target.closest(".delete-process-btn");
if (deleteBtn) {
    const processo = deleteBtn.dataset.processo;
    deleteProcess(processo);
    return;
}
});
*/
  // Botão EXCLUIR
    if (btn.dataset.action === "delete") {
        const id = btn.dataset.id;
        const processo = btn.dataset.processo;
        confirmDelete(id, processo);
    }

    // Botão LIMPAR TODOS
    if (btn.id === "clear-all-btn") {
        confirmClearAll();
    }
});

  document.addEventListener("DOMContentLoaded", function() {
    const selectAllBtn = document.getElementById("select-all-setores-btn");
    const setoresContainer = document.querySelector(".setores-container");
    let allChecked = false; // Estado inicial: nada marcado

    if (selectAllBtn && setoresContainer) {
        selectAllBtn.addEventListener("click", function() {
            const checkboxes = setoresContainer.querySelectorAll("input[type='checkbox']");

            allChecked = !allChecked; // Inverte o estado
            
            checkboxes.forEach(cb => {
                cb.checked = allChecked;
            });

            // Atualiza o texto do botão
            selectAllBtn.textContent = allChecked ? "Deselecionar Todos" : "Selecionar Todos";
            selectAllBtn.classList.toggle('btn-outline-success', !allChecked);
            selectAllBtn.classList.toggle('btn-outline-danger', allChecked);
        });
    }
    renderizarCheckboxes();

});

  function renderizarCheckboxes() {
    const container = document.getElementById('container-checkboxes-dinamicas');
    if (!container || typeof secretarias === 'undefined') return;

    // Limpa o container antes de renderizar
    container.innerHTML = '';

    secretarias.forEach((sec) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6';

        col.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" 
                       value="${sec.abreviacao}" 
                       id="check${sec.extra}${sec.abreviacao.replace(/\s+/g, '')}">
                <label class="form-check-label" for="check${sec.extra}${sec.abreviacao.replace(/\s+/g, '')}">
                   ${sec.extra} ${sec.abreviacao}
                </label>
            </div>
        `;
        container.appendChild(col);
    });
}

        /**
         * Carrega e exibe a lista de documentos.
         */
async function loadDocuments() {
    try {
                // Obtém a API de armazenamento da extensão.
        if (typeof chrome === 'undefined' || !chrome.storage) {
            console.error("API de chrome.storage não disponível.");
            emptyMessage.style.display = 'block';
            document.getElementById('clear-all-btn').style.display = 'none';
            return;
        }
        
        const result = await chrome.storage.local.get([SIGNED_DOCUMENTS_KEY]);
        const documents = result[SIGNED_DOCUMENTS_KEY] || [];

                // Limpa a lista antes de renderizar
        documentsList.innerHTML = '';

        if (documents.length === 0) {
            emptyMessage.style.display = 'block';
            document.getElementById('clear-all-btn').style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            document.getElementById('clear-all-btn').style.display = 'inline-block';
            
                    // Renderiza os documentos
            documents.forEach(renderDocumentItem);

        }

    } catch (error) {
        console.error("Erro ao carregar documentos:", error);
        showToast('Erro ao carregar a lista de documentos.', 'error');
    }
}

        /**
         * Confirma a exclusão de um único documento usando SweetAlert2.
         * @param {string} docId ID do documento (GUID ou Link Curto).
         * @param {string} docProcesso Número do processo para exibição.
         */
window.confirmDelete = function(docId, docProcesso) {
    Swal.fire({
        title: 'Tem certeza?',
        html: `Você deseja remover o documento <strong>${docProcesso}</strong> da sua lista?`,
        icon: 'warning',
        showCancelButton: true,
                confirmButtonColor: '#dc3545', // Cor vermelha customizada
                cancelButtonColor: '#6c757d', // Cor cinza (secondary)
                confirmButtonText: 'Sim, remover!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteDocument(docId);
                }
            });
        }

        /**
         * Exclui um documento pelo ID.
         */
        async function deleteDocument(docId) {
            try {
                const result = await chrome.storage.local.get([SIGNED_DOCUMENTS_KEY]);
                let documents = result[SIGNED_DOCUMENTS_KEY] || [];
                
                const initialLength = documents.length;
                
                // Filtra o array, removendo o documento com o ID correspondente
                documents = documents.filter(doc => doc.id !== docId);

                if (documents.length < initialLength) {
                    // Salva a lista atualizada
                    await chrome.storage.local.set({ [SIGNED_DOCUMENTS_KEY]: documents });
                    
                    // Remove o item do DOM
                    
                    //await renderAll();

                    showToast('Documento removido com sucesso!', 'success');
                    
                    // Verifica se a lista ficou vazia
                    if (documents.length === 0) {
                        emptyMessage.style.display = 'block';
                        document.getElementById('clear-all-btn').style.display = 'none';
                    }
                } else {
                    showToast('Erro: Documento não encontrado.', 'error');
                }

            } catch (error) {
                console.error("Erro ao excluir documento:", error);
                showToast('Erro ao excluir o documento.', 'error');
            }
        }

        /**
         * Confirma e executa a limpeza de toda a lista usando SweetAlert2.
         */
        window.confirmClearAll = function() {
            Swal.fire({
                title: 'Limpar Todos os Documentos?',
                html: 'ATENÇÃO: Você tem certeza que deseja remover <STRONG>Todos</STRONG> os documentos salvos da sua lista?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545', 
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sim, Limpar Tudo!',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    clearAllDocuments();
                }
            });
        }

        /**
         * Limpa todos os documentos salvos.
         */
        async function clearAllDocuments() {
            try {
                await chrome.storage.local.remove(SIGNED_DOCUMENTS_KEY);
                
                documentsList.innerHTML = '';
                emptyMessage.style.display = 'block';
                document.getElementById('clear-all-btn').style.display = 'none';
                
                showToast('Todos os documentos foram removidos da lista.', 'success');

            } catch (error) {
                console.error("Erro ao limpar todos os documentos:", error);
                showToast('Erro ao limpar todos os documentos.', 'error');
            }
        }


        document.addEventListener("click", function(e) {
            const btn = e.target.closest("button");

            if (!btn) return;

    // Botão EXCLUIR
            if (btn.dataset.action === "delete") {
                const id = btn.dataset.id;
                const processo = btn.dataset.processo;
                confirmDelete(id, processo);
            }

    // Botão LIMPAR TODOS
            if (btn.id === "clear-all-btn") {
                confirmClearAll();
            }
        });



        window.confirmDelete = confirmDelete;
        window.deleteDocument = deleteDocument;
        window.confirmClearAll = confirmClearAll;
        window.clearAllDocuments = clearAllDocuments;
        // Inicia o carregamento da lista
        document.addEventListener('DOMContentLoaded', loadDocuments);

/*
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[SIGNED_DOCUMENTS_KEY]) {
        //renderAll(); // 🔥 atualiza sempre que mudar
    }
});
*/

        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === "local" && changes[SIGNED_DOCUMENTS_KEY]) {
                loadDocuments(); 
            }
        });