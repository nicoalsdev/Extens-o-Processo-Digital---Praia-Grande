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

    // Cria as listas de autocompletar dinâmicas
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

    // Carrega os dados salvos previamente e preenche as listas
    carregarListasContratados();

    // Evento de clique no botão para salvar os dados
    btnSalvar.addEventListener('click', () => {
        const doc = inputDoc.value.trim();
        const nome = inputNome.value.trim();

        if (doc && nome) {
            chrome.storage.local.get(['contratados_salvos'], (result) => {
                let contratados = result.contratados_salvos || [];
                
                // Verifica se já existe o documento para evitar duplicatas
                const index = contratados.findIndex(c => c.doc === doc);
                if (index === -1) {
                    contratados.push({ doc, nome }); // Adiciona novo
                } else {
                    contratados[index].nome = nome; // Atualiza o nome se o documento já existir
                }

                // Salva no banco da extensão e atualiza as listas no HTML
                chrome.storage.local.set({ contratados_salvos: contratados }, () => {
                    atualizarDatalists(contratados);
                });
            });
        }
    });

    // Autopreenchimento cruzado: seleciona o nome e preenche o documento
    inputNome.addEventListener('input', (e) => {
        chrome.storage.local.get(['contratados_salvos'], (result) => {
            const contratados = result.contratados_salvos || [];
            const selecionado = contratados.find(c => c.nome === e.target.value);
            if (selecionado) inputDoc.value = selecionado.doc;
        });
    });

    // Autopreenchimento cruzado: seleciona o documento e preenche o nome
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

    // Limpa as opções atuais
    dataListDoc.innerHTML = '';
    dataListNome.innerHTML = '';

    // Insere as novas opções baseadas no armazenamento local
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
// 1. INJETAR ESTILOS DA SIDEBAR (CSS)
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
            background-color: #f8f9fa !important; /* Cor de fundo sólida */
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
            background-color: #ffffff !important; /* Garante fundo branco nos cards */
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
// 2. INICIALIZAR A BARRA LATERAL DA AUDESP
// ==========================================
function initSidebarAudesp() {
    injetarEstilosSidebar();

    const sidebar = document.createElement('div');
    sidebar.id = 'mgc-sidebar-audesp';
    sidebar.className = 'bg-light text-dark shadow d-flex flex-column border-start';

    sidebar.innerHTML = `
        <button id="mgc-sidebar-toggle-audesp" class="btn btn-light border shadow-sm d-flex align-items-center justify-content-center" title="Abrir/Fechar Lista de Contratos">
            <span class="fs-5">◀</span>
        </button>
        
        <div class="p-3 text-center fw-bold border-bottom bg-white fs-5 d-flex justify-content-between align-items-center">
            <span>Contratos Salvos</span>
            <button id="btn-atualizar-contratos" class="btn btn-sm btn-outline-primary" title="Atualizar Lista">🔄</button>
        </div>
        
        <div class="p-3 flex-grow-1 overflow-auto">
            <div id="mgc-lista-contratos-salvos" class="list-group shadow-sm">
                <!-- Itens injetados via JS -->
            </div>
        </div>
    `;
    document.body.appendChild(sidebar);

    // Toggle de Abertura/Fechamento
    const btnToggle = document.getElementById('mgc-sidebar-toggle-audesp');
    btnToggle.addEventListener('click', () => {
        sidebar.classList.toggle('aberta');
        btnToggle.querySelector('span').innerText = sidebar.classList.contains('aberta') ? '▶' : '◀';
    });

    // Botão de recarregar a lista
    document.getElementById('btn-atualizar-contratos').addEventListener('click', renderizarListaContratos);

    // Primeira renderização dos itens salvos
    renderizarListaContratos();
}

// ==========================================
// 3. RENDERIZAR LISTA DE CONTRATOS DA EXTENSÃO
// ==========================================
function renderizarListaContratos() {
    const listaContainer = document.getElementById('mgc-lista-contratos-salvos');

    if (!listaContainer) {
        console.error('❌ [AUDESP] Container da lista não encontrado.');
        return;
    }

    console.log('🔎 [AUDESP] Iniciando leitura dos contratos...');
    console.log('🔎 [AUDESP] Extension ID:', chrome.runtime.id);
    console.log('🔎 [AUDESP] chrome.storage disponível:', !!chrome.storage);
    console.log('🔎 [AUDESP] chrome.storage.local disponível:', !!chrome.storage?.local);

    if (!chrome.storage || !chrome.storage.local) {
        listaContainer.innerHTML = `
            <div class="alert alert-danger small">
                <strong>Erro da extensão</strong><br>
                A API de armazenamento não está disponível neste contexto.
            </div>
        `;

        console.error('❌ [AUDESP] chrome.storage.local não está disponível.');
        return;
    }

    chrome.storage.local.get('mgc_dados_contratos', (result) => {

        if (chrome.runtime.lastError) {
            console.error(
                '❌ [AUDESP] Erro ao ler storage:',
                chrome.runtime.lastError
            );

            listaContainer.innerHTML = `
                <div class="alert alert-danger small">
                    <strong>Erro ao acessar os dados.</strong><br>
                    ${chrome.runtime.lastError.message}
                </div>
            `;

            return;
        }

        console.log('📦 [AUDESP] Resultado completo:', result);
        console.log('📄 [AUDESP] mgc_dados_contratos:', result.mgc_dados_contratos);

        const bancoDados = result.mgc_dados_contratos;

        listaContainer.innerHTML = '';

        if (!bancoDados || typeof bancoDados !== 'object') {
            console.warn('⚠️ [AUDESP] Nenhum mgc_dados_contratos encontrado.');

            listaContainer.innerHTML = `
                <div class="text-center p-3 text-muted small">
                    Nenhum contrato salvo encontrado na Extensão.
                </div>
            `;

            return;
        }

        const chaves = Object.keys(bancoDados);

        console.log(`📊 [AUDESP] Contratos encontrados: ${chaves.length}`);
        console.log('📋 [AUDESP] Chaves:', chaves);

        if (chaves.length === 0) {
            listaContainer.innerHTML = `
                <div class="text-center p-3 text-muted small">
                    Nenhum contrato salvo encontrado na Extensão.
                </div>
            `;
            return;
        }

        chaves.forEach(chave => {

            const dadosContrato = bancoDados[chave];

            console.log(`📂 [AUDESP] Criando item: ${chave}`, dadosContrato);

            const item = document.createElement('div');

            item.className =
                'list-group-item list-group-item-action contrato-row py-2 px-3 border rounded mb-2';

            const numLic = dadosContrato.numero_licitacao
                ? `${dadosContrato.numero_licitacao}/${dadosContrato.ano_licitacao || ''}`
                : 'S/N';

            const qtdResp = Array.isArray(dadosContrato.responsaveis)
                ? dadosContrato.responsaveis.length
                : 0;

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="text-primary fs-6">
                        Contrato ${chave}
                    </strong>

                    <span class="badge bg-secondary">
                        ${dadosContrato.data_assinatura || 'Sem Data'}
                    </span>
                </div>

                <div class="text-muted small" style="font-size: 0.75rem;">
                    <div>
                        <b>Licitação:</b> ${numLic}
                    </div>

                    <div>
                        <b>Responsáveis:</b> ${qtdResp} selecionado(s)
                    </div>
                </div>
            `;

            item.addEventListener('click', () => {

                document
                    .querySelectorAll('.contrato-row')
                    .forEach(el => el.classList.remove('ativa'));

                item.classList.add('ativa');

                console.log(
                    `📂 [AUDESP] Carregando contrato ${chave}:`,
                    dadosContrato
                );

                carregarDadosFormulario(dadosContrato);
            });

            listaContainer.appendChild(item);
        });

        console.log('✅ [AUDESP] Lista de contratos renderizada.');
    });
}

// ==========================================
// 4. PREENCHIMENTO DOS CAMPOS NA PÁGINA (A DEFINIR)
// ==========================================
function carregarDadosFormulario(dados) {
    if (!dados) return;

    // Helper para preencher inputs e disparar eventos de alteração (vital em formulários dinâmicos)
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

    // Preenche os campos principais do contratado/contratante originais[cite: 1]
    preencherCampo('#numDocContratante', dados.cpf_contratante);
    preencherCampo('#nomeContratante', dados.nome_contratante);
    preencherCampo('#numDocContratado', dados.cpf_contratado || dados.cnpj_contratado);
    preencherCampo('#nomeContratadoConclusao', dados.nome_contratado);
    
    // Mapeamento extra (Licitação)[cite: 1]
    preencherCampo('input[name="numeroLicitacao"]', dados.numero_licitacao);
    preencherCampo('input[name="anoLicitacao"]', dados.ano_licitacao);
    
    // Novos campos mapeados para o Audesp 
    preencherCampo('#anoContrato', dados.ano_contrato);
    preencherCampo('#clausulasFinanceiras', dados.clausulas_financeiras);
    preencherCampo('#clausulasPenais', dados.clausulas_penais);
    preencherCampo('#dtInicioVigencia', dados.inicio_vigencia);
    preencherCampo('#dtAssinatura', dados.data_assinatura);
    preencherCampo('#numContrato', dados.numero_contrato);
    preencherCampo('#objetoContrato', dados.objeto_licitacao);
    preencherCampo('#dtFimVigencia', dados.termino_vigencia);

    // Selects obrigatórios e inalteráveis travados conforme a regra de negócio
    preencherCampo('#exigenciaClausulasPenais', 'true');
    preencherCampo('#tipoVigenciaId', '1');
}
