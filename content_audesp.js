window.addEventListener('load', () => {
    initSecretariasAutocomplete();
    initContratadosAutocomplete();
    initSidebarAudesp();
});

// ==========================================
// 1. LÓGICA DAS SECRETARIAS (Dados Estáticos)
// ==========================================
function initSecretariasAutocomplete() {
    const inputDoc = document.querySelector('input[name="numDocContratante"]') || document.getElementById('numDocContratante');
    const inputNome = document.querySelector('input[name="nomeContratante"]') || document.getElementById('nomeContratante');

    if (!inputDoc || !inputNome) {
        setTimeout(initSecretariasAutocomplete, 1500);
        return;
    }

    const dataListNome = document.createElement('datalist');
    dataListNome.id = 'lista-nomes-secretarios';
    
    const dataListDoc = document.createElement('datalist');
    dataListDoc.id = 'lista-docs-secretarios';

    secretarias.forEach(sec => {
        const optionNome = document.createElement('option');
        optionNome.value = sec.nome;
        optionNome.textContent = sec.secretaria; 
        dataListNome.appendChild(optionNome);

        const optionDoc = document.createElement('option');
        optionDoc.value = sec.cpf; 
        optionDoc.textContent = sec.nome;
        dataListDoc.appendChild(optionDoc);
    });

    document.body.appendChild(dataListNome);
    document.body.appendChild(dataListDoc);

    inputNome.setAttribute('list', dataListNome.id);
    inputDoc.setAttribute('list', dataListDoc.id);
    inputNome.setAttribute('autocomplete', 'off');
    inputDoc.setAttribute('autocomplete', 'off');

    inputNome.addEventListener('input', (e) => {
        const selecionado = secretarias.find(s => s.nome === e.target.value);
        if (selecionado) inputDoc.value = selecionado.cpf;
    });

    inputDoc.addEventListener('input', (e) => {
        const valorDigitado = e.target.value.trim();
        const selecionado = secretarias.find(s => s.cpf === valorDigitado || s.cpf.replace(/\D/g, '') === valorDigitado.replace(/\D/g, ''));
        if (selecionado) inputNome.value = selecionado.nome;
    });
}

// ==========================================
// 2. LÓGICA DOS CONTRATADOS (Dados Dinâmicos)
// ==========================================
function initContratadosAutocomplete() {
    const inputDoc = document.getElementById('numDocContratado') || document.querySelector('input[name="numDocContratado"]');
    const inputNome = document.getElementById('nomeContratadoConclusao') || document.querySelector('input[name="nomeContratadoConclusao"]');
    const btnSalvar = document.getElementById('ajusteConclusaoContratadoBtn');

    if (!inputDoc || !inputNome || !btnSalvar) {
        setTimeout(initContratadosAutocomplete, 1500);
        return;
    }

    const dataListDoc = document.createElement('datalist');
    dataListDoc.id = 'lista-docs-contratados';
    
    const dataListNome = document.createElement('datalist');
    dataListNome.id = 'lista-nomes-contratados';

    document.body.appendChild(dataListDoc);
    document.body.appendChild(dataListNome);

    inputDoc.setAttribute('list', dataListDoc.id);
    inputNome.setAttribute('list', dataListNome.id);
    inputDoc.setAttribute('autocomplete', 'off');
    inputNome.setAttribute('autocomplete', 'off');

    carregarListasContratados();

    btnSalvar.addEventListener('click', () => {
        const doc = inputDoc.value.trim();
        const nome = inputNome.value.trim();

        if (doc && nome) {
            chrome.storage.local.get(['contratados_salvos'], (result) => {
                let contratados = result.contratados_salvos || [];
                const index = contratados.findIndex(c => c.doc === doc);
                if (index === -1) {
                    contratados.push({ doc, nome }); 
                } else {
                    contratados[index].nome = nome; 
                }

                chrome.storage.local.set({ contratados_salvos: contratados }, () => {
                    atualizarDatalists(contratados);
                });
            });
        }
    });

    inputNome.addEventListener('input', (e) => {
        chrome.storage.local.get(['contratados_salvos'], (result) => {
            const contratados = result.contratados_salvos || [];
            const selecionado = contratados.find(c => c.nome === e.target.value);
            if (selecionado) inputDoc.value = selecionado.doc;
        });
    });

    inputDoc.addEventListener('input', (e) => {
        chrome.storage.local.get(['contratados_salvos'], (result) => {
            const contratados = result.contratados_salvos || [];
            const selecionado = contratados.find(c => c.doc === e.target.value);
            if (selecionado) inputNome.value = selecionado.nome;
        });
    });
}

function carregarListasContratados() {
    chrome.storage.local.get(['contratados_salvos'], (result) => {
        const contratados = result.contratados_salvos || [];
        atualizarDatalists(contratados);
    });
}

function atualizarDatalists(contratados) {
    const dataListDoc = document.getElementById('lista-docs-contratados');
    const dataListNome = document.getElementById('lista-nomes-contratados');
    
    if (!dataListDoc || !dataListNome) return;

    dataListDoc.innerHTML = '';
    dataListNome.innerHTML = '';

    contratados.forEach(c => {
        const optionDoc = document.createElement('option');
        optionDoc.value = c.doc;
        optionDoc.textContent = c.nome;
        dataListDoc.appendChild(optionDoc);

        const optionNome = document.createElement('option');
        optionNome.value = c.nome;
        optionNome.textContent = `Documento: ${c.doc}`;
        dataListNome.appendChild(optionNome);
    });
}

// ==========================================
// 3. INJETAR ESTILOS DA SIDEBAR
// ==========================================
function injetarEstilosSidebar() {
    if (document.getElementById('mgc-sidebar-style')) return;

    const style = document.createElement('style');
    style.id = 'mgc-sidebar-style';
    style.innerHTML = `
        #mgc-sidebar-audesp {
            position: fixed;
            top: 0;
            right: -360px;
            width: 360px;
            height: 100vh;
            z-index: 999999;
            background-color: #f8f9fa !important; 
            opacity: 1 !important;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15) !important;
        }
        #mgc-sidebar-audesp.aberta { right: 0; }
        
        #mgc-sidebar-toggle-audesp {
            position: absolute;
            top: 50%;
            left: -40px;
            width: 40px;
            height: 80px;
            background-color: #ffffff !important;
            border-radius: 0.5rem 0 0 0.5rem;
            border-right: none !important;
            cursor: pointer;
            transform: translateY(-50%);
            transition: background-color 0.2s;
        }

        #mgc-lista-contratos-salvos {
            max-height: calc(100vh - 160px);
            overflow-y: auto;
        }
        
        .contrato-row {
            cursor: pointer;
            user-select: none;
            transition: all 0.15s ease-in-out;
            font-size: 0.825rem;
            background-color: #ffffff !important; 
        }
        
        .contrato-row:hover {
            background-color: #e9ecef !important;
            border-color: #ced4da !important;
        }

        .contrato-row.ativa {
            background-color: #e7f1ff !important;
            border-color: #b6d4fe !important;
            color: #084298;
        }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 4. INICIALIZAR A BARRA LATERAL DA AUDESP
// ==========================================
function initSidebarAudesp() {
    injetarEstilosSidebar();

    const sidebar = document.createElement('div');
    sidebar.id = 'mgc-sidebar-audesp';
    sidebar.className = 'bg-light text-dark shadow d-flex flex-column border-start';

    sidebar.innerHTML = `
        <button id="mgc-sidebar-toggle-audesp" class="btn btn-light border shadow-sm d-flex align-items-center justify-content-center" title="Abrir/Fechar Lista">
            <span class="fs-5">◀</span>
        </button>
        
        <div class="p-3 text-center fw-bold border-bottom bg-white fs-5 d-flex justify-content-between align-items-center">
            <span id="titulo-sidebar-audesp">Carregando...</span>
            <button id="btn-atualizar-contratos" class="btn btn-sm btn-outline-primary" title="Atualizar Lista">🔄</button>
        </div>
        
        <div class="p-3 flex-grow-1 overflow-auto">
            <div id="mgc-lista-contratos-salvos" class="list-group shadow-sm">
                <!-- Itens injetados via JS -->
            </div>
        </div>
    `;
    document.body.appendChild(sidebar);

    const btnToggle = document.getElementById('mgc-sidebar-toggle-audesp');
    btnToggle.addEventListener('click', () => {
        sidebar.classList.toggle('aberta');
        btnToggle.querySelector('span').innerText = sidebar.classList.contains('aberta') ? '▶' : '◀';
    });

    document.getElementById('btn-atualizar-contratos').addEventListener('click', renderizarListaContratos);

    renderizarListaContratos();
}

// Variável global para armazenar a instância nativa do Modal do Bootstrap
let modalEdicaoInstancia = null;

// ==========================================
// 5. RENDERIZAR LISTA DE CONTRATOS/ADITAMENTOS
// ==========================================
function renderizarListaContratos() {
    const listaContainer = document.getElementById('mgc-lista-contratos-salvos');
    if (!listaContainer) return;

    const isAudespAditamento = window.location.href.includes('iniciarTermoAditivo.do');
    const storageKey = isAudespAditamento ? 'mgc_dados_aditamentos' : 'mgc_dados_contratos';
    
    document.getElementById('titulo-sidebar-audesp').innerText = isAudespAditamento ? 'Aditamentos Salvos' : 'Contratos Salvos';

    chrome.storage.local.get(storageKey, (result) => {
        const bancoDados = result[storageKey];
        listaContainer.innerHTML = '';

        if (!bancoDados || Object.keys(bancoDados).length === 0) {
            listaContainer.innerHTML = `<div class="text-center p-3 text-muted small">Nenhum registro salvo.</div>`;
            return;
        }

        Object.keys(bancoDados).forEach(chave => {
            const dadosRegistro = bancoDados[chave];
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action contrato-row p-3 mb-2 border rounded shadow-sm';
            
            const infoExtra = isAudespAditamento 
                ? `<b>Base:</b> ${dadosRegistro.contrato_base || 'N/A'}` 
                : `<b>Licitação:</b> ${dadosRegistro.numero_licitacao || 'S/N'}/${dadosRegistro.ano_licitacao || ''}`;
            
            const qtdResp = Array.isArray(dadosRegistro.responsaveis) ? dadosRegistro.responsaveis.length : 0;

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="text-primary fs-6">${isAudespAditamento ? chave : `Contrato ${chave}`}</strong>
                    <span class="badge bg-secondary">${dadosRegistro.data_assinatura || 'Sem Data'}</span>
                </div>
                <div class="text-muted small mb-3 lh-sm">
                    <div>${infoExtra}</div>
                    <div><b>Responsáveis:</b> ${qtdResp} selecionado(s)</div>
                </div>
                <div class="d-flex justify-content-end gap-2 border-top pt-2">
                    <button class="btn btn-sm btn-outline-primary btn-editar">Editar</button>
                    <button class="btn btn-sm btn-outline-danger btn-remover">Remover</button>
                </div>
            `;

            // Selecionar (preencher formulário)
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return; 
                document.querySelectorAll('.contrato-row').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                carregarDadosFormulario(dadosRegistro);
            });

            // Remover
            item.querySelector('.btn-remover').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Tem certeza que deseja remover ${isAudespAditamento ? chave : `Contrato ${chave}`}?`)) {
                    delete bancoDados[chave];
                    chrome.storage.local.set({ [storageKey]: bancoDados }, renderizarListaContratos);
                }
            });

            // Editar
            item.querySelector('.btn-editar').addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModalEdicao(chave, dadosRegistro, storageKey, bancoDados);
            });

            listaContainer.appendChild(item);
        });
    });
}

// ==========================================
// 5.1 LÓGICA DO MODAL DE EDIÇÃO (BOOTSTRAP NATIVO)
// ==========================================
function injetarModalBase() {
    if (document.getElementById('mgc-modal-edicao')) return;

    // HTML Oficial do Modal do Bootstrap
    const modalHTML = `
        <div class="modal fade" id="mgc-modal-edicao" tabindex="-1" aria-labelledby="mgc-modal-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content shadow-lg border-0">
                    <div class="modal-header bg-light border-bottom-0">
                        <h5 class="modal-title fw-bold text-dark" id="mgc-modal-title">Editar Dados</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4" id="mgc-modal-edicao-body">
                        <!-- Campos injetados via JS -->
                    </div>
                    <div class="modal-footer bg-light border-top-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary px-4" id="mgc-modal-salvar">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Inicializa a instância nativa do Bootstrap vinculada ao HTML criado
    const modalEl = document.getElementById('mgc-modal-edicao');
    modalEdicaoInstancia = new bootstrap.Modal(modalEl);
}

function abrirModalEdicao(chave, dadosRegistro, storageKey, bancoDados) {
    injetarModalBase();
    
    const modalBody = document.getElementById('mgc-modal-edicao-body');
    const btnSalvar = document.getElementById('mgc-modal-salvar');
    
    modalBody.innerHTML = ''; 

    // Gera os campos
    Object.keys(dadosRegistro).forEach(key => {
        if (typeof dadosRegistro[key] === 'object' && dadosRegistro[key] !== null) return;

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'mb-3';
        fieldDiv.innerHTML = `
            <label class="form-label small fw-semibold text-secondary mb-1">${key.replace(/_/g, ' ').toUpperCase()}</label>
            <input type="text" class="form-control mgc-edit-input" data-key="${key}" value="${dadosRegistro[key] || ''}">
        `;
        modalBody.appendChild(fieldDiv);
    });

    // Abre o modal usando a API nativa do Bootstrap
    modalEdicaoInstancia.show();

    // Renova o botão salvar para evitar duplicação de cliques
    const novoBtnSalvar = btnSalvar.cloneNode(true);
    btnSalvar.parentNode.replaceChild(novoBtnSalvar, btnSalvar);

    novoBtnSalvar.addEventListener('click', () => {
        document.getElementById('mgc-modal-edicao-body').querySelectorAll('.mgc-edit-input').forEach(input => {
            dadosRegistro[input.getAttribute('data-key')] = input.value;
        });

        bancoDados[chave] = dadosRegistro;
        
        chrome.storage.local.set({ [storageKey]: bancoDados }, () => {
            modalEdicaoInstancia.hide(); // Fecha o modal usando a API nativa
            renderizarListaContratos();  // Atualiza a listagem
        });
    });
}

// ==========================================
// 6. PREENCHIMENTO DOS CAMPOS NA PÁGINA
// ==========================================
function carregarDadosFormulario(dados) {
    if (!dados) return;

    const preencherCampo = (seletorOuEl, valor) => {
        if (valor === undefined || valor === null) return;
        const input = typeof seletorOuEl === 'string' 
            ? (document.querySelector(seletorOuEl) || document.getElementById(seletorOuEl))
            : seletorOuEl;

        if (input) {
            input.value = valor;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    preencherCampo('#numDocContratante', dados.cpf_contratante);
    preencherCampo('#nomeContratante', dados.nome_contratante);
    preencherCampo('#numDocContratado', dados.cpf_contratado || dados.cnpj_contratado);
    preencherCampo('#nomeContratadoConclusao', dados.nome_contratado);
    
    preencherCampo('input[name="numeroLicitacao"]', dados.numero_licitacao);
    preencherCampo('input[name="anoLicitacao"]', dados.ano_licitacao);
    
    preencherCampo('#anoContrato', dados.ano_contrato);
    preencherCampo('#clausulasFinanceiras', dados.clausulas_financeiras);
    preencherCampo('#clausulasPenais', dados.clausulas_penais);
    preencherCampo('#dtInicioVigencia', dados.inicio_vigencia);
    preencherCampo('#dtAssinatura', dados.data_assinatura);
    preencherCampo('#numContrato', dados.numero_contrato);
    preencherCampo('#objetoContrato', dados.objeto_licitacao);
    preencherCampo('#dtFimVigencia', dados.termino_vigencia);

    preencherCampo('#exigenciaClausulasPenais', 'true');
    preencherCampo('#tipoVigenciaId', '1');
}