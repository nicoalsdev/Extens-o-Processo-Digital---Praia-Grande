
// ==========================================
// 1. INJETAR ESTILOS DA SIDEBAR (CSS)
// ==========================================
// ==========================================
// 1. INJETAR ESTILOS DA SIDEBAR (Padrão Bootstrap 5)
// ==========================================
const style = document.createElement('style');
style.innerHTML = `
    #mgc-sidebar {
        position: fixed;
        top: 0;
        right: -340px;
        width: 340px;
        height: 100vh;
        z-index: 999999;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #mgc-sidebar.aberta { right: 0; }
    
    #mgc-sidebar-toggle {
        position: absolute;
        top: 50%;
        left: -40px;
        width: 40px;
        height: 80px;
        border-radius: 0.5rem 0 0 0.5rem;
        border-right: none !important;
        cursor: pointer;
        transform: translateY(-50%);
        transition: background-color 0.2s;
    }

    /* Container Tabela / List Group */
    #mgc-lista-secretarios {
        max-height: 600px;
        overflow-y: auto;
    }
    
    .secretaria-row {
        cursor: pointer;
        user-select: none;
        transition: background-color 0.15s ease-in-out;
        font-size: 0.825rem;
    }
    
    .secretaria-row:hover {
        background-color: #f8f9fa;
    }

    /* Efeito de Seleção Limpo estilo Bootstrap */
    .secretaria-row.selecionada {
        background-color: #e7f1ff !important;
        border-color: #b6d4fe !important;
        color: #084298;
        font-weight: 600;
    }

    .sec-col-abrev {
        width: 65px;
        font-weight: 700;
        color: #0d6efd;
        flex-shrink: 0;
    }
    
    .sec-col-nome {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chk-secretario { display: none; }
`;
document.head.appendChild(style);

// ==========================================
// 2. CRIAR ESTRUTURA HTML DA SIDEBAR (Organizada com Form Groups & Grids)
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
        
        <!-- GRUPO: Ações Gerais -->
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
                <!-- Espaço para futuros botões de ações gerais: basta adicionar mais <div class="col-12"> aqui -->
            </div>
        </div>
        
        <hr class="my-3 text-secondary opacity-25">
        
        <!-- GRUPO: Responsáveis Contratante -->
        <div class="mb-3">
            <label class="form-label text-uppercase text-secondary fw-bold mb-2" style="font-size: 0.75rem; letter-spacing: 0.5px;">Responsáveis Contratante</label>
            
            <!-- Lista com estilo List Group -->
            <div id="mgc-lista-secretarios" class="list-group shadow-sm mb-3"></div>
            
            <!-- Grupo de Ações da Lista -->
            <div class="btn-group w-100 shadow-sm" role="group">
                <button id="btn-marcar-todos" class="btn btn-outline-secondary btn-sm fw-semibold">☑️ Marcar Todos</button>
                <button id="btn-injetar-pessoa" class="btn btn-success btn-sm fw-semibold">➕ Injetar</button>
            </div>
        </div>
        
    </div>
`;
document.body.appendChild(sidebar);

// ==========================================
// 3. PREENCHER LISTA DE SECRETÁRIOS (Visual em Linha com Sigla + Nome)
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
    
    // Lógica de 1 clique: Seleciona/Desmarca a linha inteira
    div.addEventListener('click', function(e) {
        const chk = this.querySelector('.chk-secretario');
        chk.checked = !chk.checked;
        
        if (chk.checked) {
            this.classList.add('selecionada');
        } else {
            this.classList.remove('selecionada');
        }
    });

    // Lógica de 2 cliques: Dispara a injeção diretamente para este secretário
    div.addEventListener('dblclick', function(e) {
        e.preventDefault(); 
        
        console.log(`⚡ Injeção rápida disparada para: ${sec.nome}`);
        
        document.dispatchEvent(new CustomEvent('AUTO_GESTORES', { detail: [sec.nome] }));
        document.dispatchEvent(new CustomEvent('AUTO_RESPONSAVEIS', { detail: [sec.nome] }));
    });

    listaSecretariosDiv.appendChild(div);
});


// ==========================================
// 4. LÓGICA DE FUNCIONAMENTO DA INTERFACE
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
        
        // Atualiza o visual da linha inteira
        const linha = chk.closest('.secretaria-row');
        if (todosMarcados) {
            linha.classList.add('selecionada');
        } else {
            linha.classList.remove('selecionada');
        }
    });
    btnMarcarTodos.innerHTML = todosMarcados ? "🔲 Desmarcar Todos" : "☑️ Marcar Todos";
});

document.getElementById('btn-salvar-dados').addEventListener('click', () => {
    // 1. Captura o número e ano do processo para formar a chave. 
    const numProcesso = document.getElementById('frm_numero_processo') ? document.getElementById('frm_numero_processo').value : '00000';
    const anoProcesso = document.getElementById('frm_ano_processo') ? document.getElementById('frm_ano_processo').value : new Date().getFullYear();
    const chaveProcesso = `${numProcesso}/${anoProcesso}`;

    // 2. Coletar os secretários responsáveis (marcados na sidebar)
    const responsaveisAssinatura = [];
    document.querySelectorAll('.chk-secretario:checked').forEach(chk => {
        const nomeSelecionado = chk.value;
        
        // Busca o objeto completo na lista global de secretarias para pegar o CPF
        const dadosSecretario = window.secretarias.find(sec => sec.nome === nomeSelecionado);
        
        if (dadosSecretario) {
            responsaveisAssinatura.push({
                nome: dadosSecretario.nome,
                cpf: dadosSecretario.cpf
            });
        }
    });

    // 3. Coleta os dados dos campos do formulário e inclui o array de responsáveis
    const dadosContrato = {
        "numero contrato": document.getElementById('frm_numero_contrato') ? document.getElementById('frm_numero_contrato').value : '',
        "ano contrato": document.getElementById('frm_ano_contrato') ? document.getElementById('frm_ano_contrato').value : '',
        "Data de Assinatura": document.getElementById('frm_data_assinatura') ? document.getElementById('frm_data_assinatura').value : '',
        "Cláusulas Financeiras": document.getElementById('frm_descritivo_clausula_financeira') ? document.getElementById('frm_descritivo_clausula_financeira').value : '',
        "Cláusulas Penais": document.getElementById('frm_descricao_clausula_penal') ? document.getElementById('frm_descricao_clausula_penal').value : '',
        "Término Vigência": document.getElementById('frm_termino_vigencia') ? document.getElementById('frm_termino_vigencia').value : '',
        "Responsaveis": responsaveisAssinatura
    };

    // 4. Recupera o JSON existente no LocalStorage, insere/atualiza a chave e salva novamente
    let bancoDados = JSON.parse(localStorage.getItem('mgc_dados_contratos') || '{}');
    bancoDados[chaveProcesso] = dadosContrato;
    localStorage.setItem('mgc_dados_contratos', JSON.stringify(bancoDados));

    alert(`✅ Dados salvos com sucesso sob o processo: ${chaveProcesso}`);
    console.log("💾 JSON Atualizado no LocalStorage:", bancoDados);
});

// ==========================================
// 5. INJETAR O SCRIPT DE CÓDIGO E EVENTOS
// ==========================================
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject_novo_contrato.js');
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

document.getElementById('btn-empenhos').addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('AUTO_EMPENHOS'));
});

document.getElementById('btn-injetar-pessoa').addEventListener('click', () => {
    const selecionados = Array.from(document.querySelectorAll('.chk-secretario:checked')).map(chk => chk.value);
    
    if (selecionados.length === 0) {
        alert("⚠️ Por favor, selecione pelo menos um responsável na lista.");
        return;
    }
    
    // Dispara a busca tanto para gestores quanto para responsáveis (conforme seu original)
    document.dispatchEvent(new CustomEvent('AUTO_GESTORES', { detail: selecionados }));
    document.dispatchEvent(new CustomEvent('AUTO_RESPONSAVEIS', { detail: selecionados }));
});

window.addEventListener('load', () => {
    console.log("🟢 Iniciando preenchimento automático do contrato...");

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

    // 2. Preenchendo os campos solicitados
    setValor('frm_ano_contrato', '2026');
    setValor('frm_data_cadastro', dataAtual);
    setValor('frm_data_assinatura', dataAtual);
    setValor('frm_inicio_vigencia', dataAtual);

    setValor('frm_descritivo_clausula_financeira', 'Cláusula Quinta e Cláusula Décima Segunda');
    setValor('frm_descricao_clausula_penal', 'Cláusula Décima');

    // 3. Marcando os botões de rádio
    checkRadio('frm_permite_aditamento_n');
    checkRadio('frm_exigencia_s');
    checkRadio('frm_exigencia_garantia_n');

    // ==========================================
    // 4. Trava do campo Notificar Término de Vigência
    // ==========================================
    // NOTA: Se o MGC usar botões de rádio separados, o ID do "Não" geralmente termina com "_n".
    // Se for um <select>, ele captura pelo nome principal.
    const campoNotificarN = document.getElementById('frm_notificar_termino_vigencia_n'); 
    const campoNotificarSelect = document.getElementById('frm_notificar_termino_vigencia');

    function travarNotificar() {
        if (campoNotificarN) campoNotificarN.checked = true;
        if (campoNotificarSelect) campoNotificarSelect.value = 'N'; // Adapte para o valor que o MGC usa se for diferente de 'N'
        console.log("🔒 Campo 'Notificar Término' revertido para NÃO.");
    }

    // Executa a trava imediatamente
    travarNotificar();

    // Se o sistema MGC altera esse campo sozinho sempre que a data de vigência muda,
    // colocamos um "espião" na data de vigência para forçar o "Não" logo após a mudança.
    const inicioVigencia = document.getElementById('frm_inicio_vigencia');
    if (inicioVigencia) {
        inicioVigencia.addEventListener('change', () => {
            // Dá um atraso pequeno para o script original do MGC rodar primeiro, e depois revertemos
            setTimeout(travarNotificar, 200);
        });
    }

   // ==========================================
    // 5. Preenchimento da Moeda / Índice Financeiro
    // ==========================================
    // Injeta os valores diretamente nos campos que o MGC espera receber da lupa
    
    // ATENÇÃO: O ID '1' é o mais comum para "Real" na maioria dos bancos do MGC. 
    // Se ao salvar der erro de "Moeda Inválida", troque o '1' abaixo pelo ID correto do seu sistema.
    setValor('frm_id_indice_financeiro', '1'); 
    
    setValor('frm_abreviacao_moeda', 'R$');
    setValor('frm_nome_moeda', 'Real');

});