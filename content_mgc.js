(function inicializarPainelAudesp() {
    // Garante que só rode na página específica
    if (!window.location.href.includes('mgc_painel_audesp.php')) return;

    const tabela = document.querySelector('table.table.table-striped');
    if (!tabela) return;

    const thead = tabela.querySelector('thead');
    const tbody = tabela.querySelector('tbody');
    if (!thead || !tbody) return;

    // ==========================================
    // 1. ESTILOS AUXILIARES (Hover e Ordenação)
    // ==========================================
    const style = document.createElement('style');
    style.innerHTML = `
        .audesp-sortable {
            cursor: pointer;
            user-select: none;
            transition: background-color 0.15s;
        }
        .audesp-sortable:hover {
            background-color: rgba(0, 0, 0, 0.05) !important;
        }
        .audesp-sort-icon {
            font-size: 0.8em;
            margin-left: 5px;
            opacity: 0.4;
        }
        .audesp-sortable.asc .audesp-sort-icon,
        .audesp-sortable.desc .audesp-sort-icon {
            opacity: 1;
            color: #0d6efd;
        }
        tr.audesp-row-selected {
            background-color: #e7f1ff !important;
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 2. BARRA DE CONTROLE SUPERIOR (BOOTSTRAP)
    // ==========================================
    const barraControle = document.createElement('div');
    barraControle.className = 'card shadow-sm mb-3 border-0 bg-light';
    barraControle.innerHTML = `
        <div class="card-body py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div class="d-flex align-items-center gap-2">
                <span class="fw-bold text-secondary small text-uppercase">Automação AUDESP:</span>
                <button type="button" id="ext-btn-marcar-todos" class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-check-square"></i> Selecionar Todos (Aptos)
                </button>
                <button type="button" id="ext-btn-desmarcar-todos" class="btn btn-outline-secondary btn-sm">
                    <i class="far fa-square"></i> Desmarcar Todos
                </button>
            </div>

            <div class="d-flex align-items-center gap-3">
                <span id="ext-contador-selecionados" class="badge bg-secondary rounded-pill fs-6 px-3 py-2">
                    0 selecionado(s)
                </span>
                <button type="button" id="ext-btn-enviar-lote" class="btn btn-success btn-sm fw-bold shadow-sm" disabled>
                    <i class="fas fa-paper-plane"></i> Enviar Selecionados
                </button>
            </div>
        </div>
    `;
    tabela.parentNode.insertBefore(barraControle, tabela);

    // ==========================================
    // 3. PREPARAR CABEÇALHO (CHECKBOX E ORDENADORES)
    // ==========================================
    const trHead = thead.querySelector('tr');
    const tdsHead = trHead.querySelectorAll('td');

    const tdCheckMaster = document.createElement('td');
    tdCheckMaster.width = '3%';
    tdCheckMaster.align = 'center';
    tdCheckMaster.innerHTML = `
        <input class="form-check-input" type="checkbox" id="ext-chk-master" title="Selecionar/Desmarcar todos os aptos" style="cursor: pointer;">
    `;
    trHead.insertBefore(tdCheckMaster, trHead.firstChild);

    const colunasOrdenaveis = [
        { el: tdsHead[1], chave: 'contrato', titulo: 'Contrato' },
        { el: tdsHead[2], chave: 'licitacao', titulo: 'Licitação' },
        { el: tdsHead[3], chave: 'fornecedor', titulo: 'Fornecedor' }
    ];

    colunasOrdenaveis.forEach(col => {
        if (!col.el) return;
        col.el.classList.add('audesp-sortable');
        col.el.dataset.sortKey = col.chave;
        col.el.innerHTML = `<b>${col.titulo}</b> <span class="audesp-sort-icon">⇅</span>`;
    });

    // ==========================================
    // 4. PREPARAR LINHAS DO TBODY
    // ==========================================
    const linhasOriginais = Array.from(tbody.querySelectorAll('tr'));

    linhasOriginais.forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 5) return;

        const contratoTexto = tds[1].innerText.trim();
        const licitacaoTexto = tds[2].innerText.trim();
        const fornecedorTexto = tds[3].innerText.trim();

        const btnPublicar = tr.querySelector('a[id^="btn_enviar_contrato_"]');
        const btnBloqueado = tr.querySelector('a[id^="btn_enviar_anexo_"]');
        const podeEnviar = Boolean(btnPublicar);

        let idContrato = '';
        if (btnPublicar) {
            const matchId = btnPublicar.id.match(/btn_enviar_contrato_(\d+)/)
                || (btnPublicar.getAttribute('href') || '').match(/publicarContrato\((\d+)\)/);
            if (matchId) idContrato = matchId[1];
        }

        tr.dataset.contrato = contratoTexto;
        tr.dataset.licitacao = licitacaoTexto;
        tr.dataset.fornecedor = fornecedorTexto;
        tr.dataset.idContrato = idContrato;
        tr.dataset.apto = (podeEnviar && idContrato) ? '1' : '0';

        const tdCheck = document.createElement('td');
        tdCheck.align = 'center';

        if (podeEnviar && idContrato) {
            tdCheck.innerHTML = `
                <input class="form-check-input ext-chk-linha" type="checkbox" style="cursor: pointer;">
            `;
        } else {
            const onclickStr = btnBloqueado ? (btnBloqueado.getAttribute('onclick') || '') : '';
            const matchMotivo = onclickStr.match(/audespAlert\("([^"]+)"/);
            const motivo = matchMotivo ? matchMotivo[1] : 'Pendente de envio ao PNCP ou provisório';

            tdCheck.innerHTML = `
                <input class="form-check-input" type="checkbox" disabled title="Bloqueado: ${motivo}">
            `;
        }

        tr.insertBefore(tdCheck, tr.firstChild);

        if (podeEnviar && idContrato) {
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', (e) => {
                if (e.target.closest('a') || e.target.closest('input')) return;
                const chk = tr.querySelector('.ext-chk-linha');
                if (chk && !chk.disabled) {
                    chk.checked = !chk.checked;
                    chk.dispatchEvent(new Event('change'));
                }
            });
        }
    });

    // ==========================================
    // 5. LÓGICA DE SELEÇÃO E CONTAGEM
    // ==========================================
    const chkMaster = document.getElementById('ext-chk-master');
    const btnMarcarTodos = document.getElementById('ext-btn-marcar-todos');
    const btnDesmarcarTodos = document.getElementById('ext-btn-desmarcar-todos');
    const btnEnviarLote = document.getElementById('ext-btn-enviar-lote');
    const badgeContador = document.getElementById('ext-contador-selecionados');

    function atualizarEstadoSelecao() {
        const todosCheckboxes = Array.from(tbody.querySelectorAll('.ext-chk-linha:not(:disabled)'));
        const marcados = todosCheckboxes.filter(c => c.checked);

        tbody.querySelectorAll('.ext-chk-linha').forEach(chk => {
            const tr = chk.closest('tr');
            if (chk.checked) {
                tr.classList.add('audesp-row-selected');
            } else {
                tr.classList.remove('audesp-row-selected');
            }
        });

        const qtd = marcados.length;
        badgeContador.textContent = `${qtd} selecionado(s)`;
        badgeContador.className = qtd > 0
            ? 'badge bg-primary rounded-pill fs-6 px-3 py-2'
            : 'badge bg-secondary rounded-pill fs-6 px-3 py-2';

        btnEnviarLote.disabled = qtd === 0;
        btnEnviarLote.innerHTML = qtd > 0
            ? `<i class="fas fa-paper-plane"></i> Enviar Selecionados (${qtd})`
            : `<i class="fas fa-paper-plane"></i> Enviar Selecionados`;

        if (todosCheckboxes.length > 0 && qtd === todosCheckboxes.length) {
            chkMaster.checked = true;
            chkMaster.indeterminate = false;
        } else if (qtd > 0) {
            chkMaster.checked = false;
            chkMaster.indeterminate = true;
        } else {
            chkMaster.checked = false;
            chkMaster.indeterminate = false;
        }
    }

    tbody.addEventListener('change', (e) => {
        if (e.target.classList.contains('ext-chk-linha')) {
            atualizarEstadoSelecao();
        }
    });

    function definirTodos(estado) {
        tbody.querySelectorAll('.ext-chk-linha:not(:disabled)').forEach(chk => {
            chk.checked = estado;
        });
        atualizarEstadoSelecao();
    }

    chkMaster.addEventListener('change', (e) => definirTodos(e.target.checked));
    btnMarcarTodos.addEventListener('click', () => definirTodos(true));
    btnDesmarcarTodos.addEventListener('click', () => definirTodos(false));

    // ==========================================
    // 6. LÓGICA DE ORDENAÇÃO (NATURAL SORT)
    // ==========================================
    let ordemAtual = { chave: 'contrato', direcao: 'asc' };

    function normalizarChaveOrdenacao(valor, chave) {
        if (chave === 'contrato' || chave === 'licitacao') {
            const match = valor.match(/^([A-Za-z\s]*?)(\d+)[A-Za-z]*\/(\d{4})$/);
            if (match) {
                const prefixo = match[1].trim();
                const numero = match[2].padStart(6, '0');
                const ano = match[3];
                return `${ano}_${prefixo}_${numero}`;
            }
        }
        return valor.toLowerCase();
    }

    function ordenarTabela(chave, direcao) {
        const linhas = Array.from(tbody.querySelectorAll('tr'));

        linhas.sort((a, b) => {
            const valA = normalizarChaveOrdenacao(a.dataset[chave] || '', chave);
            const valB = normalizarChaveOrdenacao(b.dataset[chave] || '', chave);

            if (valA < valB) return direcao === 'asc' ? -1 : 1;
            if (valA > valB) return direcao === 'asc' ? 1 : -1;
            return 0;
        });

        linhas.forEach(tr => tbody.appendChild(tr));

        colunasOrdenaveis.forEach(col => {
            if (!col.el) return;
            col.el.classList.remove('asc', 'desc');
            const icon = col.el.querySelector('.audesp-sort-icon');
            if (col.chave === chave) {
                col.el.classList.add(direcao);
                icon.textContent = direcao === 'asc' ? '▲' : '▼';
            } else {
                icon.textContent = '⇅';
            }
        });

        ordemAtual = { chave, direcao };
    }

    colunasOrdenaveis.forEach(col => {
        if (!col.el) return;
        col.el.addEventListener('click', () => {
            const novaDirecao = (ordemAtual.chave === col.chave && ordemAtual.direcao === 'asc')
                ? 'desc'
                : 'asc';
            ordenarTabela(col.chave, novaDirecao);
        });
    });

    ordenarTabela('contrato', 'asc');

    // ==========================================
    // 7. ENVIO DIRETO VIA FETCH (REPLICANDO audesp.js)
    // ==========================================
    async function enviarContratoAudespAPI(idContrato) {
        const response = await fetch("/rest/mgc/audesp/contrato/enviar/", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify([{
                "id_contrato": Number(idContrato)
            }]),
            redirect: 'follow'
        });
        return await response.json();
    }

    btnEnviarLote.addEventListener('click', async () => {
        const marcados = Array.from(tbody.querySelectorAll('.ext-chk-linha:checked'));
        if (marcados.length === 0) return;

        const confirmar = confirm(
            `Deseja iniciar a publicação de ${marcados.length} contrato(s) selecionado(s) no AUDESP?`
        );
        if (!confirmar) return;

        btnEnviarLote.disabled = true;
        btnMarcarTodos.disabled = true;
        btnDesmarcarTodos.disabled = true;

        let processados = 0;
        let sucessos = 0;
        let erros = 0;

        for (const chk of marcados) {
            const tr = chk.closest('tr');
            const idContrato = tr.dataset.idContrato;
            const btnOriginal = tr.querySelector(`#btn_enviar_contrato_${idContrato}`)
                || tr.querySelector(`#btn_enviar_${idContrato}`);

            if (!idContrato) continue;

            processados++;
            btnEnviarLote.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Enviando ${processados}/${marcados.length}...`;

            tr.style.outline = '2px solid #0d6efd';
            tr.scrollIntoView({ behavior: 'smooth', block: 'center' });

            try {
                const result = await enviarContratoAudespAPI(idContrato);

                if (result && result.data && result.data.status === 'OK') {
                    sucessos++;
                    // Replica exatamente o feedback visual nativo do audesp.js
                    if (btnOriginal) {
                        btnOriginal.parentElement.insertAdjacentHTML(
                            'beforeend',
                            "<div class='containerPncp'><div class='animatedDot'></div></div>"
                        );
                        btnOriginal.remove();
                    }
                    // Desabilita o checkbox da linha já enviada
                    chk.checked = false;
                    chk.disabled = true;
                    tr.style.cursor = 'default';
                    tr.dataset.apto = '0';
                } else {
                    erros++;
                    const msgErro = (result && result.error) ? result.error : 'Erro desconhecido ao enviar';
                    console.warn(`[AUDESP] Falha no contrato ${tr.dataset.contrato} (ID ${idContrato}):`, msgErro);

                    // Exibe badge de erro ao lado do botão para fácil visualização sem travar o lote
                    if (btnOriginal && !btnOriginal.parentElement.querySelector('.ext-erro-audesp')) {
                        btnOriginal.parentElement.insertAdjacentHTML(
                            'beforeend',
                            `<span class="badge bg-danger ms-1 ext-erro-audesp" title="${msgErro}"><i class="fas fa-exclamation-triangle"></i> Erro</span>`
                        );
                    }
                    chk.checked = false;
                }
            } catch (error) {
                erros++;
                console.error(`[AUDESP] Erro de rede no contrato ${idContrato}:`, error);
                chk.checked = false;
            }

            atualizarEstadoSelecao();

            // Pausa curta entre requisições
            await new Promise(resolve => setTimeout(resolve, 600));
            tr.style.outline = '';
        }

        btnMarcarTodos.disabled = false;
        btnDesmarcarTodos.disabled = false;
        atualizarEstadoSelecao();

        alert(
            `✅ Envio em lote concluído!

` +
            `• Enviados com sucesso: ${sucessos}
` +
            `• Com erro/impedimento: ${erros}`
        );
    });

})();