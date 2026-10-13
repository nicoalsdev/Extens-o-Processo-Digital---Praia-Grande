// ==========================================
// 1. INJETAR ESTILOS DA SIDEBAR (Padrão Bootstrap 5)
// ==========================================
// ==========================================
// 1. INJETAR ESTILOS DA SIDEBAR (Isolado e Blindado)
// ==========================================
const style = document.createElement('style');
style.innerHTML = `
    #mgc-sidebar {
        position: fixed !important;
        top: 0 !important;
        right: -340px !important;
        width: 340px !important;
        height: 100vh !important;
        z-index: 999999 !important;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        background-color: #f8f9fa !important;
        color: #ffffff !important;
        box-shadow: -4px 0 15px rgba(0,0,0,0.3) !important;
        display: flex !important;
        flex-direction: column !important;
        font-family: inherit !important;
    }
    
    #mgc-sidebar.aberta { 
        right: 0 !important; 
    }
    
    #mgc-sidebar-toggle {
        position: absolute !important;
        top: 50% !important;
        left: -40px !important;
        width: 40px !important;
        height: 80px !important;
        border-radius: 0.5rem 0 0 0.5rem !important;
        border: 1px solid #ccc !important;
        border-right: none !important;
        background: #fff !important;
        color: #333 !important;
        cursor: pointer !important;
        transform: translateY(-50%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    #mgc-sidebar-header {
        padding: 1rem !important;
        text-align: center !important;
        font-weight: bold !important;
        border-bottom: 1px solid #dee2e6 !important;
        background: #ffffff !important;
        color: #212529 !important;
        font-size: 1.25rem !important;
    }
    
    #mgc-sidebar-content {
        padding: 1rem !important;
        flex-grow: 1 !important;
        overflow-y: auto !important;
    }

    #mgc-lista-secretarios {
        max-height: 600px !important;
        overflow-y: auto !important;
        background: #fff !important;
        border-radius: 0.375rem !important;
        border: 1px solid #dee2e6 !important;
    }
    
    .secretaria-row {
        cursor: pointer !important;
        user-select: none !important;
        transition: background-color 0.15s ease-in-out !important;
        font-size: 0.825rem !important;
        padding: 0.5rem 0.75rem !important;
        display: flex !important;
        align-items: center !important;
        border-bottom: 1px solid #f1f1f1 !important;
        color: #212529 !important; /* Letras escuras legíveis dentro da lista branca */
    }
    
    .secretaria-row:hover {
        background-color: #f8f9fa !important;
    }

    .secretaria-row.selecionada {
        background-color: #e7f1ff !important;
        border-color: #b6d4fe !important;
        color: #0d6efd !important;
        font-weight: 600 !important;
    }

    .sec-col-nome {
        flex-grow: 1 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        color: inherit !important;
    }

    .chk-secretario { 
        display: none !important; 
    }
    
    /* Utilitários rápidos para os rótulos internos */
    #mgc-sidebar label {
        font-size: 0.75rem !important;
        font-weight: bold !important;
        text-transform: uppercase !important;
        color: #6c757d !important;
        display: block !important;
        margin-bottom: 0.5rem !important;
        letter-spacing: 0.5px !important;
    }
`;
document.head.appendChild(style);

// ==========================================
// 2. CRIAR ESTRUTURA HTML DA SIDEBAR
// ==========================================
const sidebar = document.createElement('div');
sidebar.id = 'mgc-sidebar';
sidebar.className = 'bg-light text-dark shadow d-flex flex-column border-start';

sidebar.innerHTML = `
    <button id="mgc-sidebar-toggle" class="btn btn-light border shadow-sm d-flex align-items-center justify-content-center" title="Abrir/Fechar Automação">
        <span class="fs-5">◀</span>
    </button>
    
    <div id="mgc-sidebar-header" class="p-3 text-center fw-bold border-bottom bg-white fs-5">
        Automação MGC
    </div>
    
    <div id="mgc-sidebar-content" class="p-3 flex-grow-1 overflow-auto">
        <div class="mb-4">
            <label class="form-label text-uppercase text-secondary fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 0.5px;">Ações Gerais</label>
            <div class="row g-2">
                <div class="col-6">
                    <button id="btn-empenhos" class="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2">
                        <span>🔄</span> Empenhos
                    </button>
                </div>
                <div class="col-6">
                    <button id="btn-salvar-dados" class="btn btn-warning w-100 fw-semibold text-dark d-flex align-items-center justify-content-center gap-2">
                        <span>💾</span> Salvar
                    </button>
                </div>
            </div>
        </div>
        
        <hr class="my-3 text-secondary opacity-25">
        
        <div class="mb-3">
            <label class="form-label text-uppercase text-secondary fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 0.5px;">Responsáveis Contratante</label>
            <div id="mgc-lista-secretarios" class="list-group shadow-sm mb-3"></div>
            <div class="btn-group w-100 shadow-sm" role="group">
                <button id="btn-marcar-todos" class="btn btn-outline-secondary btn-sm fw-semibold">☑️ Marcar Todos</button>
                <button id="btn-injetar-pessoa" class="btn btn-success btn-sm fw-semibold">➕ Injetar</button>
            </div>
        </div>
    </div>
`;
document.body.appendChild(sidebar);

// ==========================================
// 3. PREENCHER LISTA DE SECRETÁRIOS
// ==========================================
const listaSecretariosDiv = document.getElementById('mgc-lista-secretarios');

secretarias.forEach((sec, index) => {
    const div = document.createElement('div');
    div.className = 'list-group-item list-group-item-action secretaria-row d-flex align-items-center py-2 px-3';
    const checkboxId = `chk-sec-${index}`;
    
    div.innerHTML = `
        <input type="checkbox" class="chk-secretario" value="${sec.nome}" id="${checkboxId}">
        <div class="sec-col-nome" title="${sec.nome}">${sec.nome}</div>
    `;
    
    div.addEventListener('click', function(e) {
        const chk = this.querySelector('.chk-secretario');
        chk.checked = !chk.checked;
        if (chk.checked) this.classList.add('selecionada');
        else this.classList.remove('selecionada');
    });

    div.addEventListener('dblclick', function(e) {
        e.preventDefault(); 
        console.log(`⚡ Injeção rápida disparada para: ${sec.nome}`);
        document.dispatchEvent(new CustomEvent('AUTO_GESTORES', { detail: [sec.nome] }));
        document.dispatchEvent(new CustomEvent('AUTO_RESPONSAVEIS', { detail: [sec.nome] }));
    });

    listaSecretariosDiv.appendChild(div);
});

// ==========================================
// 4. LÓGICA DA INTERFACE E EVENTOS
// ==========================================
const btnToggle = document.getElementById('mgc-sidebar-toggle');
btnToggle.addEventListener('click', () => {
    sidebar.classList.toggle('aberta');
    btnToggle.innerText = sidebar.classList.contains('aberta') ? '▶' : '◀';
});

const btnMarcarTodos = document.getElementById('btn-marcar-todos');
let todosMarcados = false;
btnMarcarTodos.addEventListener('click', () => {
    todosMarcados = !todosMarcados;
    document.querySelectorAll('.chk-secretario').forEach(chk => {
        chk.checked = todosMarcados;
        const linha = chk.closest('.secretaria-row');
        if (todosMarcados) linha.classList.add('selecionada');
        else linha.classList.remove('selecionada');
    });
    btnMarcarTodos.innerHTML = todosMarcados ? "🔲 Desmarcar Todos" : "☑️ Marcar Todos";
});

// Injeção do script externo (preservado do seu código)
const scriptExt = document.createElement('script');
scriptExt.src = chrome.runtime.getURL('inject_novo_contrato.js');
scriptExt.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(scriptExt);

document.getElementById('btn-empenhos').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('AUTO_EMPENHOS'));
});

document.getElementById('btn-injetar-pessoa').addEventListener('click', () => {
    const selecionados = Array.from(document.querySelectorAll('.chk-secretario:checked')).map(chk => chk.value);
    if (selecionados.length === 0) {
        alert("⚠️ Por favor, selecione pelo menos um responsável na lista.");
        return;
    }
    document.dispatchEvent(new CustomEvent('AUTO_GESTORES', { detail: selecionados }));
    document.dispatchEvent(new CustomEvent('AUTO_RESPONSAVEIS', { detail: selecionados }));
});

// ==========================================
// 5. DETECÇÃO DE CONTEXTO E SALVAMENTO UNIFICADO
// ==========================================
const isAditamento = window.location.href.includes('mgc_aditamento.php');
let contratoBaseAditamento = "S/N";

if (isAditamento) {
    const tabelas = document.querySelectorAll('.textoPadrao');
    tabelas.forEach(tabela => {
        if (tabela.innerHTML.includes('Contrato') && tabela.innerHTML.includes('Licitação')) {
            const celulas = tabela.querySelectorAll('tr:nth-child(2) td');
            if (celulas.length > 0) {
                contratoBaseAditamento = celulas[0].innerText.trim();
            }
        }
    });
}

function salvarDadosMGC(callback = null) {
    const responsaveisAssinatura = [];
    document.querySelectorAll('.chk-secretario:checked').forEach(chk => {
        const nomeSelecionado = chk.value;
        const dadosSecretario = window.secretarias ? window.secretarias.find(sec => sec.nome === nomeSelecionado) : null;
        if (dadosSecretario) {
            responsaveisAssinatura.push({ nome: dadosSecretario.nome, cpf: dadosSecretario.cpf });
        }
    });

    let chaveRegistro = "";
    let dadosSalvar = { responsaveis: responsaveisAssinatura };
    let storageKey = "";

    if (isAditamento) {
        storageKey = 'mgc_dados_aditamentos';
        const numAdit = document.getElementById('frm_numero') ? document.getElementById('frm_numero').value.trim() : '000';
        const anoAdit = document.getElementById('frm_ano') ? document.getElementById('frm_ano').value.trim() : new Date().getFullYear();
        
        chaveRegistro = `aditamento ${numAdit}/${anoAdit} do contrato: ${contratoBaseAditamento}`;
        
        dadosSalvar = {
            ...dadosSalvar,
            tipo: 'aditamento',
            contrato_base: contratoBaseAditamento,
            numero_aditamento: numAdit,
            ano_aditamento: anoAdit,
            data_assinatura: document.getElementById('frm_data_assinatura') ? document.getElementById('frm_data_assinatura').value : '',
            inicio_vigencia: document.getElementById('frm_inicio_vigencia') ? document.getElementById('frm_inicio_vigencia').value : '',
            termino_vigencia: document.getElementById('frm_termino_vigencia') ? document.getElementById('frm_termino_vigencia').value : ''
        };
    } else {
        storageKey = 'mgc_dados_contratos';
        const numContratoInput = document.getElementById('frm_numero_contrato');
        const anoContratoInput = document.getElementById('frm_ano_contrato');
        const numContrato = numContratoInput && numContratoInput.value.trim() !== '' ? numContratoInput.value.trim() : '00000';
        const anoContrato = anoContratoInput && anoContratoInput.value.trim() !== '' ? anoContratoInput.value.trim() : new Date().getFullYear();
        
        chaveRegistro = `${numContrato}/${anoContrato}`;
        
        dadosSalvar = {
            ...dadosSalvar,
            tipo: 'contrato',
            numero_contrato: numContrato,
            ano_contrato: anoContrato,
            id_licitacao: document.getElementById('frm_id_licitacao') ? document.getElementById('frm_id_licitacao').value : '',
            numero_licitacao: document.getElementById('frm_numero_licitacao') ? document.getElementById('frm_numero_licitacao').value : '',
            ano_licitacao: document.getElementById('frm_ano_licitacao') ? document.getElementById('frm_ano_licitacao').value : '',
            id_modalidade: document.getElementById('frm_id_modalidade') ? document.getElementById('frm_id_modalidade').value : '',
            objeto_licitacao: document.getElementById('frm_objeto_licitacao') ? document.getElementById('frm_objeto_licitacao').value : '',
            id_fornecedor: document.getElementById('frm_id_fornecedor') ? document.getElementById('frm_id_fornecedor').value : '',
            data_cadastro: document.getElementById('frm_data_cadastro') ? document.getElementById('frm_data_cadastro').value : '',
            data_assinatura: document.getElementById('frm_data_assinatura') ? document.getElementById('frm_data_assinatura').value : '',
            inicio_vigencia: document.getElementById('frm_inicio_vigencia') ? document.getElementById('frm_inicio_vigencia').value : '',
            termino_vigencia: document.getElementById('frm_termino_vigencia') ? document.getElementById('frm_termino_vigencia').value : '',
            clausulas_financeiras: document.getElementById('frm_descritivo_clausula_financeira') ? document.getElementById('frm_descritivo_clausula_financeira').value : '',
            clausulas_penais: document.getElementById('frm_descricao_clausula_penal') ? document.getElementById('frm_descricao_clausula_penal').value : '',
            tipo_contratacao: document.getElementById('frm_id_tipo_contratacao') ? document.getElementById('frm_id_tipo_contratacao').value : '',
            plano_contas: document.getElementById('frm_id_plano_contas') ? document.getElementById('frm_id_plano_contas').value : ''
        };
    }

    chrome.storage.local.get([storageKey], (result) => {
        let bancoDados = result[storageKey] || {};
        bancoDados[chaveRegistro] = dadosSalvar;

        chrome.storage.local.set({ [storageKey]: bancoDados }, () => {
            console.log(`💾 JSON Atualizado no chrome.storage (${storageKey}):`, bancoDados);
            if (callback) {
                callback(); 
            } else {
                alert(`✅ Dados salvos com sucesso na Extensão: ${chaveRegistro}`);
            }
        });
    });
}

document.getElementById('btn-salvar-dados').addEventListener('click', () => salvarDadosMGC());

// ==========================================
// 6. ONLOAD: INTERCEPTADORES E PREENCHIMENTOS
// ==========================================
window.addEventListener('load', () => {
    // Intercepta os botões contornando o bloqueio de CSP (Content Security Policy)
    ['link_confirmar', 'link_continuar'].forEach(id => {
        const btnOriginal = document.getElementById(id);
        
        // Verifica se o botão existe e se possui um onclick nativo
        if (btnOriginal && btnOriginal.getAttribute('onclick')) {
            
            // 1. Cria um clone exato do botão para a interface
            const btnClone = btnOriginal.cloneNode(true);
            btnClone.id = id + '_ext_clone'; // Altera o ID para não causar conflitos
            btnClone.removeAttribute('onclick'); // Remove a ação original do clone
            
            // 2. Oculta o botão original na tela, mantendo-o no DOM
            btnOriginal.style.display = 'none';
            
            // 3. Insere o clone visualmente no exato local do original
            btnOriginal.parentNode.insertBefore(btnClone, btnOriginal.nextSibling);
            
            // 4. Adiciona o nosso evento de salvar no botão clonado
            btnClone.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Feedback visual de carregamento
                const textoOriginal = btnClone.innerHTML;
                btnClone.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Salvando...';
                btnClone.disabled = true;

                // Executa a nossa rotina de salvamento
                salvarDadosMGC(() => {
                    // Restaura o botão clonado
                    btnClone.innerHTML = textoOriginal;
                    btnClone.disabled = false;
                    
                    // Clica programaticamente no botão original oculto.
                    // Isso aciona as funções nativas (submeter_formulario) sem violar o CSP!
                    btnOriginal.click();
                });
            });
        }
    });

    console.log("🟢 Iniciando preenchimento automático...");

    // 1. Gerar a Data de Hoje no formato DD/MM/AAAA
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear(); 
    const dataAtual = `${dia}/${mes}/${ano}`;

    // Função auxiliar para preencher inputs de texto/ocultos
    const setValor = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.value = valor;
    };

    // Função auxiliar para marcar checkboxes/radios
    const checkRadio = (id) => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
    };


    if (!isAditamento) {
        setValor('frm_ano_contrato', '2026');
        setValor('frm_data_cadastro', dataAtual);
        setValor('frm_descritivo_clausula_financeira', 'Cláusula Quinta e Cláusula Décima Segunda');
        setValor('frm_descricao_clausula_penal', 'Cláusula Décima');
        checkRadio('frm_permite_aditamento_n');
        checkRadio('frm_exigencia_garantia_n');
        
        const radioExigenciaS = document.getElementById('frm_exigencia_s');
        if (radioExigenciaS) radioExigenciaS.click();
        
        setValor('frm_id_indice_financeiro', '1'); 
        setValor('frm_abreviacao_moeda', 'R$');
        setValor('frm_nome_moeda', 'Real');
    }
    
    setValor('frm_data_assinatura', dataAtual);
    setValor('frm_inicio_vigencia', dataAtual);

    const inputAssinatura = document.getElementById('frm_data_assinatura');
    const inputVigencia = document.getElementById('frm_inicio_vigencia');

    if (inputAssinatura && inputVigencia) {
        const espelharData = (e) => {
            inputVigencia.value = e.target.value;
            inputVigencia.dispatchEvent(new Event('input', { bubbles: true }));
            inputVigencia.dispatchEvent(new Event('change', { bubbles: true }));
        };
        inputAssinatura.addEventListener('input', espelharData);
        inputAssinatura.addEventListener('change', espelharData);
    }

    const campoNotificarSelect = document.getElementById('frm_notificar_termino_vigencia');
    if (campoNotificarSelect) {
        campoNotificarSelect.value = 'N'; 
        campoNotificarSelect.addEventListener('change', (e) => {
            if (e.target.value !== 'N') {
                e.target.value = 'N'; 
                console.log("🔒 Sistema tentou alterar 'Notificar Término'. Revertido para 'Não'.");
            }
        });
    }
});