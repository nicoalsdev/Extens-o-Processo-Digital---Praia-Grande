// Função auxiliar para aguardar milissegundos
const delay = ms => new Promise(res => setTimeout(res, ms));

function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}


// ==========================================
// MÓDULO 1: EMPENHOS (Com Trava de Loop Infinito)
// ==========================================
async function buscarTodosEmpenhos() {
    const idLicitacao = document.getElementById('frm_id_licitacao') ? document.getElementById('frm_id_licitacao').value : '';
    const idFornecedor = document.getElementById('frm_id_fornecedor') ? document.getElementById('frm_id_fornecedor').value : '';

    if (!idLicitacao || !idFornecedor) {
        console.error("❌ IDs de Licitação ou Fornecedor estão vazios na tela original.");
        return [];
    }

    let pagina = 1;
    let buscando = true;
    const todosEmpenhos = [];
    const idsExtraidos = new Set(); // Mémoria para evitar loop infinito

    console.log("🔍 Iniciando varredura de páginas de empenho...");

    // Adicionei uma trava de segurança de máximo 50 páginas (pag <= 50) só por garantia
    while (buscando && pagina <= 50) { 
        const urlBusca = `/ic/ic_buscar.php?nome_busca=busca_empenho&acao=buscar&cont=0&pag=${pagina}&callback=0&frm_id_licitacao=${idLicitacao}&frm_id_fornecedor=${idFornecedor}&frm_mgc_empenho_numero=&frm_mgc_empenho_exercicio=&btn_aplicar_filtro=`;

        try {
            const resposta = await fetch(urlBusca);

if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
}

const buffer = await resposta.arrayBuffer();

const utf8 = new TextDecoder('utf-8').decode(buffer);
const win1252 = new TextDecoder('windows-1252').decode(buffer);
const iso88591 = new TextDecoder('iso-8859-1').decode(buffer);

let html;

// Primeiro tenta UTF-8 de forma rigorosa.
// Se houver bytes inválidos, lança erro.
try {
    html = new TextDecoder('utf-8', {
        fatal: true
    }).decode(buffer);

} catch (e) {

    // Se não for UTF-8, provavelmente é o charset antigo do MGC
    html = new TextDecoder('windows-1252').decode(buffer);
}
            
            const regexScripts = /retorno\[\d+\]\[0\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[1\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[2\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[3\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[4\]\s*=\s*"([^"]+)";/g;
            
            let match;
            let empenhosNovosNestaPagina = 0;
            
            while ((match = regexScripts.exec(html)) !== null) {
                const idEmpenho = match[1];
                
                // Só adiciona se o ID for inédito
                if (!idsExtraidos.has(idEmpenho)) {
                    idsExtraidos.add(idEmpenho);
                    todosEmpenhos.push({
                        id: match[1], numero: match[2], exercicio: match[3], descricao: match[4], valor: match[5]
                    });
                    empenhosNovosNestaPagina++;
                }
            }

            // Se a página não trouxe nenhum empenho NOVO (ou seja, repetiu tudo ou veio vazia)
            if (empenhosNovosNestaPagina === 0) {
                buscando = false; 
                console.log(`📄 Fim da paginação (Página repetida detectada). Total extraído: ${todosEmpenhos.length}`);
            } else {
                console.log(`✔️ Página ${pagina} extraída com sucesso (${empenhosNovosNestaPagina} novos empenhos). Indo para a próxima...`);
                pagina++; 
                await delay(300); 
            }

        } catch (error) {
            console.error(`Erro ao buscar a página ${pagina}:`, error);
            buscando = false; 
        }
    }

    return todosEmpenhos;
}

async function automatizarEmpenhos() {
    console.log("🟢 Iniciando Automação de Empenhos...");
    const todosEmpenhos = await buscarTodosEmpenhos();

    if (todosEmpenhos.length === 0) {
        alert("Nenhum empenho encontrado automaticamente.");
        return;
    }

    for (const emp of todosEmpenhos) {
        document.getElementById('frm_id_empenho').value = emp.id;
        document.getElementById('frm_numero_empenho').value = emp.numero;
        document.getElementById('frm_exercicio_empenho').value = emp.exercicio;
        document.getElementById('frm_descricao_empenho').value = emp.descricao;
        document.getElementById('frm_valor_empenho').value = emp.valor;
        
        await delay(300);
        if (window.oManipulador_empenho) window.oManipulador_empenho.efetuar_adicao_item();
        await delay(500); 
    }
    console.log("🏁 Automação de empenhos finalizada!");
}

// ==========================================
// MÓDULO 2: FUNÇÕES DE BUSCA (Reaproveitáveis)
// ==========================================
async function buscarDadosGestor(nomeBusca) {
    const nomeLimpo = normalizarTexto(nomeBusca);

    const urlBusca =
        `/ic/ic_buscar.php?` +
        `nome_busca=busca_gestor` +
        `&acao=buscar` +
        `&cont=0` +
        `&pag=1` +
        `&callback=0` +
        `&frm_ocn_resumo_responsavel_nome=${encodeURIComponent(nomeLimpo)}` +
        `&frm_codigo_orgao=` +
        `&frm_ocn_orgao_nome=` +
        `&btn_aplicar_filtro=`;

    try {
        console.log(`🔎 Buscando gestor: ${nomeBusca}`);

      const resposta = await fetch(urlBusca);

if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
}

const buffer = await resposta.arrayBuffer();
const html = new TextDecoder('windows-1252').decode(buffer);

        const encontrados = [];

        /*
         * Estrutura real:
         *
         * retorno[n][0] = ID
         * retorno[n][1] = NOME
         * retorno[n][2] = EMAIL
         * retorno[n][3] = COD_ORGAO COD_UNIDADE COD_SUBUNIDADE
         * retorno[n][4] = ORGAO
         * retorno[n][5] = CARGO
         */

        const regex =
            /retorno\[\s*(\d+)\s*\]\[0\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[1\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[2\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[3\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[4\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[5\]\s*=\s*"([^"]*)";/g;

        let match;

        while ((match = regex.exec(html)) !== null) {

            const indice = match[1];
            const id = match[2].trim();
            const nome = match[3].trim();
            const email = match[4].trim();
            const codigos = match[5].trim();
            const orgao = match[6].trim();
            const cargo = match[7].trim();

            /*
             * "6 5 0"
             *  ↑
             *  código do órgão
             */
            const partesCodigo = codigos.split(/\s+/);

            const codOrgao = partesCodigo[0] || "";
            const codUnidade = partesCodigo[1] || "";
            const codSubUnidade = partesCodigo[2] || "";

            encontrados.push({
                indice,
                id,
                nome,
                email,
                codOrgao,
                codUnidade,
                codSubUnidade,
                orgao,
                cargo
            });
        }

        console.log(
            `📋 ${encontrados.length} resultado(s) encontrado(s) para ${nomeBusca}:`,
            encontrados
        );

        return encontrados;

    } catch (erro) {
        console.error(`❌ Erro ao buscar gestor "${nomeBusca}":`, erro);
        return [];
    }
}

async function buscarDadosResponsavel(nomeBusca) {
    const urlBusca = `/ic/ic_buscar.php?nome_busca=busca_resp_contrate&acao=buscar&cont=0&pag=1&callback=0&frm_ocn_servidor_nome_servidor=${encodeURIComponent(nomeBusca)}&frm_ocn_resumo_responsavel_numero_documento=&btn_aplicar_filtro=`;
    try {
        const resposta = await fetch(urlBusca);
        const html = await resposta.text();
        const regexScripts = /retorno\[\d+\]\[0\]\s*=\s*"([^"]*)";\s*retorno\[\d+\]\[1\]\s*=\s*"([^"]*)";\s*retorno\[\d+\]\[2\]\s*=\s*"([^"]*)";\s*retorno\[\d+\]\[3\]\s*=\s*"([^"]*)";\s*retorno\[\d+\]\[4\]\s*=\s*"([^"]*)";/g;
        
        const encontrados = [];
        let match;
        while ((match = regexScripts.exec(html)) !== null) {
            encontrados.push({ id: match[1], nome: match[2], cpf: match[3], emailProf: match[4], emailPess: match[5] });
        }
        return encontrados;
    } catch (e) { return []; }
}

// ==========================================
// MÓDULO 3: INJEÇÃO DUPLA EM LOTE (Gestor + Responsável)
// ==========================================
async function automatizarGestores(evento) {

    const nomesSelecionados = evento.detail;
    console.log(`🟢 Iniciando automação de Gestores para ${nomesSelecionados.length} pessoa(s).`);

    let adicionados = 0;
    let ignorados = 0;

    for (const nomeSelecionado of nomesSelecionados) {

        console.log(`\n-----------------------------------------`);
        console.log(`➡️ Processando Gestor: ${nomeSelecionado}`);

        const resultados = await buscarDadosGestor(nomeSelecionado);

        if (resultados.length === 0) {
            console.warn(`⚠️ Nenhum registro encontrado para: ${nomeSelecionado}`);
            ignorados++;
            continue;
        }

        const nomeNormalizado = normalizarTexto(nomeSelecionado);

        // 1º TENTATIVA: Procura alguém com o nome exato E que TENHA e-mail preenchido
        let gestor = resultados.find(
            item => normalizarTexto(item.nome) === nomeNormalizado && item.email.trim() !== ""
        );

        // 2º TENTATIVA: Se não achou nome exato com e-mail, pega o PRIMEIRO resultado geral que TENHA e-mail
        if (!gestor) {
            gestor = resultados.find(item => item.email.trim() !== "");
        }

        // 3º TENTATIVA (Fallback): Se absolutamente nenhum resultado da tabela tiver e-mail, 
        // pega o nome exato ou o 1º da lista para não travar o processo.
        if (!gestor) {
            console.warn(`⚠️ Nenhum gestor retornado para "${nomeSelecionado}" possui e-mail. Usando o primeiro encontrado.`);
            gestor = resultados.find(item => normalizarTexto(item.nome) === nomeNormalizado) || resultados[0];
        }

        if (!gestor) {
            console.warn(`⚠️ Não foi possível determinar o Gestor correto para ${nomeSelecionado}.`, resultados);
            ignorados++;
            continue;
        }

        console.log(`✅ Gestor selecionado:`, gestor);

        // ==========================================
        // PREENCHER FORMULÁRIO
        // ==========================================

        const campoId = document.getElementById('frm_id_gestor_orgao');
        const campoNome = document.getElementById('frm_nome_pessoa');
        const campoCargo = document.getElementById('frm_cargo');
        const campoEmail = document.getElementById('frm_email');
        const campoCodigoOrgao = document.getElementById('frm_codigo_orgao');
        const campoOrgao = document.getElementById('frm_orgao');

        if (!campoId || !campoNome || !campoCargo || !campoEmail || !campoCodigoOrgao || !campoOrgao) {
            console.error("❌ Um ou mais campos do formulário de Gestor não foram encontrados.");
            continue; // Se não achar os campos, pula para o próximo da lista em vez de travar tudo
        }

        campoId.value = gestor.id;
        campoNome.value = gestor.nome;
        campoCargo.value = gestor.cargo;
        campoEmail.value = gestor.email;
        campoCodigoOrgao.value = gestor.codOrgao;
        campoOrgao.value = gestor.orgao;

        console.log("📝 Formulário preenchido:", {
            id: campoId.value,
            nome: campoNome.value,
            cargo: campoCargo.value,
            email: campoEmail.value,
            codOrgao: campoCodigoOrgao.value,
            orgao: campoOrgao.value
        });

        // ==========================================
        // ADICIONAR NA LISTA
        // ==========================================

        await delay(400);

        if (window.oManipulador_gestor && typeof window.oManipulador_gestor.efetuar_adicao_item === 'function') {
            window.oManipulador_gestor.efetuar_adicao_item();
            console.log(`✅ ${gestor.nome} adicionado à lista de Gestores.`);
            adicionados++;
        } else {
            console.error("❌ oManipulador_gestor não está disponível.");
            ignorados++;
        }

        // Dá tempo para o sistema original processar a inclusão
        await delay(800);
    }
}


async function buscarDadosResponsavel(nomeBusca) {
    const nomeLimpo = normalizarTexto(nomeBusca);

    const urlBusca =
        `/ic/ic_buscar.php?` +
        `nome_busca=busca_resp_contrate` +
        `&acao=buscar` +
        `&cont=0` +
        `&pag=1` +
        `&callback=0` +
        `&frm_ocn_servidor_nome_servidor=${encodeURIComponent(nomeLimpo)}` +
        `&frm_ocn_resumo_responsavel_numero_documento=` +
        `&btn_aplicar_filtro=`;

    try {
        console.log(`🔎 Buscando responsável: ${nomeBusca}`);

        const resposta = await fetch(urlBusca);

        if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
        }

        // Mesmo tratamento de charset usado na busca de Gestores
        const buffer = await resposta.arrayBuffer();
        const html = new TextDecoder('windows-1252').decode(buffer);

        const encontrados = [];

        /*
         * Estrutura:
         *
         * retorno[n][0] = ID
         * retorno[n][1] = NOME
         * retorno[n][2] = CPF
         */

        const regex =
            /retorno\[\s*(\d+)\s*\]\[0\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[1\]\s*=\s*"([^"]*)";[\s\S]*?retorno\[\s*\1\s*\]\[2\]\s*=\s*"([^"]*)";/g;

        let match;

        while ((match = regex.exec(html)) !== null) {

            encontrados.push({
                indice: match[1],
                id: match[2].trim(),
                nome: match[3].trim(),
                cpf: match[4].trim()
            });
        }

        console.log(
            `📋 ${encontrados.length} resultado(s) encontrado(s) para ${nomeBusca}:`,
            encontrados
        );

        return encontrados;

    } catch (erro) {

        console.error(
            `❌ Erro ao buscar responsável "${nomeBusca}":`,
            erro
        );

        return [];
    }
}


async function adicionarResponsavel(nomeSelecionado) {

    console.log(`\n-----------------------------------------`);
    console.log(`➡️ Processando Responsável: ${nomeSelecionado}`);

    const resultados = await buscarDadosResponsavel(nomeSelecionado);

    if (resultados.length === 0) {

        console.warn(
            `⚠️ Nenhum responsável encontrado para: ${nomeSelecionado}`
        );

        return false;
    }

    const nomeNormalizado = normalizarTexto(nomeSelecionado);

    // Primeiro tenta correspondência exata do nome
    let responsavel = resultados.find(
        item => normalizarTexto(item.nome) === nomeNormalizado
    );

    // Se não encontrar, usa o primeiro resultado
    if (!responsavel) {
        responsavel = resultados[0];
    }

    console.log(`✅ Responsável selecionado:`, responsavel);

    const campoId =
        document.getElementById('frm_id_pessoa_contratante');

    const campoNome =
        document.getElementById('frm_nome_resp_contratante');

    const campoCpf =
        document.getElementById('frm_cpf_resp_contratante');

    const campoEmail =
        document.getElementById('frm_email_resp_contratante');

    const campoEmailPessoal =
        document.getElementById('frm_email_profis_resp_contratante');

    const campoAssinou = 
        document.getElementById('frm_assinou_resp_contratante');

    if (
        !campoId ||
        !campoNome ||
        !campoCpf ||
        !campoEmail ||
        !campoEmailPessoal
    ) {

        console.error(
            '❌ Campos do formulário de Responsável não encontrados.'
        );

        return false;
    }

    /*
     * Preenche os dados encontrados.
     *
     * A busca de responsável só fornece:
     * ID, Nome e CPF.
     *
     * Os dois e-mails ficam vazios.
     */

    campoId.value = responsavel.id;
    campoNome.value = responsavel.nome;
    campoCpf.value = responsavel.cpf;
    campoEmail.value = '';
    campoEmailPessoal.value = '';

    // NOVA LÓGICA: Força o "Sim" e trava mudanças
    if (campoAssinou) {
        // Define como 'S' (ou adapte para '1' ou 'Sim' dependendo do padrão do MGC)
        campoAssinou.value = 'S'; 
        
        // Adiciona um escutador que reverte imediatamente qualquer tentativa de mudança
        campoAssinou.addEventListener('change', function() {
            this.value = 'S';
            console.log("🔒 Campo 'Assinou' revertido para Sim automaticamente.");
        });
    }

    console.log(`📝 Formulário de Responsável preenchido:`, {
        id: campoId.value,
        nome: campoNome.value,
        cpf: campoCpf.value,
        email: campoEmail.value,
        emailPessoal: campoEmailPessoal.value
    });

    await delay(400);

    if (
        window.oManipulador_responsavel_contratante &&
        typeof window.oManipulador_responsavel_contratante.efetuar_adicao_item === 'function'
    ) {

        window.oManipulador_responsavel_contratante.efetuar_adicao_item();

        console.log(
            `✅ ${responsavel.nome} adicionado à lista de Responsáveis.`
        );

        await delay(800);

        return true;

    } else {

        console.error(
            '❌ oManipulador_responsavel_contratante não está disponível.'
        );

        return false;
    }
}


document.addEventListener('AUTO_RESPONSAVEIS', async (evento) => {

    const nomesSelecionados = evento.detail;

    console.log(
        `🟢 Iniciando automação de Responsáveis para ${nomesSelecionados.length} pessoa(s).`
    );

    let adicionados = 0;
    let ignorados = 0;

    for (const nome of nomesSelecionados) {

        const sucesso = await adicionarResponsavel(nome);

        if (sucesso) {
            adicionados++;
        } else {
            ignorados++;
        }
    }

});


// ==========================================
// ESCUTADORES DE EVENTOS
// ==========================================

document.addEventListener('AUTO_EMPENHOS', automatizarEmpenhos);
//document.addEventListener('AUTO_PESSOA_DUPLA', automatizarPessoaDupla);
document.addEventListener('AUTO_GESTORES', automatizarGestores);


