const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


function normalizarTexto(texto) {
    if (!texto) return "";

    return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}


// ============================================================
// MÓDULO 1: EMPENHOS
// ============================================================

async function buscarTodosEmpenhos() {

    console.log("");
    console.log("==============================================");
    console.log("🔎 INICIANDO BUSCA AUTOMÁTICA DE EMPENHOS");
    console.log("==============================================");

    // --------------------------------------------------------
    // IDENTIFICA SE É CONTRATO OU ADITAMENTO
    // --------------------------------------------------------

    const isAditamento = window.location.href.includes("mgc_aditamento.php");

    console.log("📄 URL atual:", window.location.href);
    console.log("📌 É aditamento?", isAditamento);


    // --------------------------------------------------------
    // PEGA OS CAMPOS DA TELA
    // --------------------------------------------------------

    const campoIdLicitacao = document.getElementById("frm_id_licitacao");
    const campoIdFornecedor = document.getElementById("frm_id_fornecedor");

    const campoNumeroEmpenho = document.getElementById("frm_numero_empenho");
    const campoExercicioEmpenho = document.getElementById("frm_exercicio_empenho");


    const idLicitacao = campoIdLicitacao
    ? campoIdLicitacao.value.trim()
    : "";

    const idFornecedor = campoIdFornecedor
    ? campoIdFornecedor.value.trim()
    : "";

    const numeroEmpenho = campoNumeroEmpenho
    ? campoNumeroEmpenho.value.trim()
    : "";

    const exercicioEmpenho = campoExercicioEmpenho
    ? campoExercicioEmpenho.value.trim()
    : "";


    // --------------------------------------------------------
    // DEBUG
    // --------------------------------------------------------

    console.log("----------------------------------------------");
    console.log("📋 CAMPOS ENCONTRADOS");
    console.log("----------------------------------------------");

    console.log("frm_id_licitacao:", idLicitacao);
    console.log("frm_id_fornecedor:", idFornecedor);
    console.log("frm_numero_empenho:", numeroEmpenho);
    console.log("frm_exercicio_empenho:", exercicioEmpenho);

    console.log("----------------------------------------------");


    // --------------------------------------------------------
    // VERIFICA SE OS ELEMENTOS EXISTEM
    // --------------------------------------------------------

    if (!campoIdLicitacao) {
        console.warn("⚠️ Campo #frm_id_licitacao não encontrado.");
    }

    if (!campoIdFornecedor) {
        console.warn("⚠️ Campo #frm_id_fornecedor não encontrado.");
    }


    // --------------------------------------------------------
    // MONTA A URL DA BUSCA
    // --------------------------------------------------------

    let pagina = 1;

    let buscando = true;

    const todosEmpenhos = [];

    const idsExtraidos = new Set();


    while (buscando && pagina <= 50) {

        let urlBusca;


        // ====================================================
        // CONTRATO NORMAL
        // ====================================================

        if (!isAditamento) {

            urlBusca =
        `/ic/ic_buscar.php` +
    `?nome_busca=busca_empenho` +
`&acao=buscar` +
`&cont=0` +
`&pag=${pagina}` +
`&callback=0` +
`&frm_id_licitacao=${encodeURIComponent(idLicitacao)}` +
`&frm_id_fornecedor=${encodeURIComponent(idFornecedor)}` +
`&frm_mgc_empenho_numero=` +
`&frm_mgc_empenho_exercicio=` +
`&btn_aplicar_filtro=`;

}


        // ====================================================
        // ADITAMENTO
        // ====================================================

else {

            /*
             * No aditamento o popup nativo está sendo aberto
             * inicialmente com uma URL semelhante a:
             *
             * /ic/ic_buscar.php?
             * nome_busca=busca_empenho
             * &acao=buscar
             * &cont=0
             * &pag=1
             * &callback=0
             * &frm_mgc_empenho_numero=
             * &frm_mgc_empenho_exercicio=
             * &btn_aplicar_filtro=
             *
             * Portanto, aqui vamos reproduzir essa chamada.
             */

    urlBusca =
`/ic/ic_buscar.php` +
`?nome_busca=busca_empenho` +
`&acao=buscar` +
`&cont=0` +
`&pag=${pagina}` +
`&callback=0` +
`&frm_mgc_empenho_numero=${encodeURIComponent(numeroEmpenho)}` +
`&frm_mgc_empenho_exercicio=${encodeURIComponent(exercicioEmpenho)}` +
`&btn_aplicar_filtro=`;


            /*
             * Porém, se os IDs de licitação e fornecedor
             * estiverem preenchidos na tela, vamos adicioná-los.
             *
             * Isso permite testar os dois comportamentos.
             */

if (idLicitacao) {

    urlBusca +=
`&frm_id_licitacao=${encodeURIComponent(idLicitacao)}`;

}

if (idFornecedor) {

    urlBusca +=
`&frm_id_fornecedor=${encodeURIComponent(idFornecedor)}`;

}

}


        // ----------------------------------------------------
        // DEBUG DA URL
        // ----------------------------------------------------

console.log("");
console.log(`📄 Página ${pagina}`);
console.log("🔗 URL da busca:");
console.log(urlBusca);


        // ----------------------------------------------------
        // FAZ A REQUISIÇÃO
        // ----------------------------------------------------

try {

    const resposta = await fetch(urlBusca, {
        method: "GET",
        credentials: "include"
    });


    console.log(
    `📡 HTTP ${resposta.status} - ${resposta.statusText}`
);


    if (!resposta.ok) {

        throw new Error(
        `HTTP ${resposta.status}`
    );

    }


            // ------------------------------------------------
            // LÊ A RESPOSTA
            // ------------------------------------------------

    const buffer = await resposta.arrayBuffer();

    let html;


    try {

        html = new TextDecoder(
            "utf-8",
            {
                fatal: true
            }
        ).decode(buffer);

    } catch (erroUTF8) {

        console.warn(
            "⚠️ UTF-8 falhou. Tentando Windows-1252..."
        );

        html = new TextDecoder(
            "windows-1252"
        ).decode(buffer);

    }


    console.log(
    `📦 Resposta recebida: ${html.length} caracteres`
);


            // ------------------------------------------------
            // MOSTRA UM TRECHO DA RESPOSTA
            // ------------------------------------------------

    console.log(
        "📝 Início da resposta:",
        html.substring(0, 500)
    );


            // ------------------------------------------------
            // PROCURA OS RETORNOS
            // ------------------------------------------------

    const regexScripts =
    /retorno\[\d+\]\[0\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[1\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[2\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[3\]\s*=\s*"([^"]+)";\s*retorno\[\d+\]\[4\]\s*=\s*"([^"]+)";/g;


    let match;

    let empenhosNovosNestaPagina = 0;


    while ((match = regexScripts.exec(html)) !== null) {

        const idEmpenho = match[1];

        const numero = match[2];

        const exercicio = match[3];

        const descricao = match[4];

        const valor = match[5];


        console.log(
            "💰 Empenho encontrado:",
            {
                id: idEmpenho,
                numero: numero,
                exercicio: exercicio,
                descricao: descricao,
                valor: valor
            }
        );


                // --------------------------------------------
                // EVITA DUPLICADOS
                // --------------------------------------------

        if (!idsExtraidos.has(idEmpenho)) {

            idsExtraidos.add(idEmpenho);


            todosEmpenhos.push({

                id: idEmpenho,

                numero: numero,

                exercicio: exercicio,

                descricao: descricao,

                valor: valor

            });


            empenhosNovosNestaPagina++;

        }

    }


            // ------------------------------------------------
            // VERIFICA SE ENCONTROU EMPENHOS
            // ------------------------------------------------

    console.log(
    `📊 Novos empenhos encontrados nesta página: ${empenhosNovosNestaPagina}`
);


    if (empenhosNovosNestaPagina === 0) {

        console.log(
            "🛑 Nenhum novo empenho encontrado. Encerrando paginação."
        );

        buscando = false;

    } else {

        pagina++;

        await delay(300);

    }


} catch (error) {

    console.error(
    `❌ Erro ao buscar a página ${pagina}:`,
    error
);

    buscando = false;

}

}


    // ========================================================
    // RESULTADO FINAL
    // ========================================================

console.log("");
console.log("==============================================");
console.log("🏁 BUSCA DE EMPENHOS FINALIZADA");
console.log("==============================================");

console.log(
    "📊 Total de empenhos encontrados:",
    todosEmpenhos.length
);

console.log(
    "📦 Empenhos:",
    todosEmpenhos
);

console.log("==============================================");
console.log("");


return todosEmpenhos;
}


// ============================================================
// ADICIONA OS EMPENHOS NA TELA
// ============================================================

async function automatizarEmpenhos() {

    console.log("");
    console.log("==============================================");
    console.log("🟢 INICIANDO AUTOMAÇÃO DE EMPENHOS");
    console.log("==============================================");


    const todosEmpenhos = await buscarTodosEmpenhos();


    // --------------------------------------------------------
    // NENHUM EMPENHO
    // --------------------------------------------------------

    if (todosEmpenhos.length === 0) {

        console.warn(
            "⚠️ Nenhum empenho encontrado automaticamente."
        );

        alert(
            "Nenhum empenho encontrado automaticamente."
        );

        return;

    }


    // --------------------------------------------------------
    // VERIFICA OS CAMPOS DA TELA
    // --------------------------------------------------------

    const campoId = document.getElementById(
        "frm_id_empenho"
    );

    const campoNumero = document.getElementById(
        "frm_numero_empenho"
    );

    const campoExercicio = document.getElementById(
        "frm_exercicio_empenho"
    );

    const campoDescricao = document.getElementById(
        "frm_descricao_empenho"
    );

    const campoValor = document.getElementById(
        "frm_valor_empenho"
    );


    if (
        !campoId ||
        !campoNumero ||
        !campoExercicio ||
        !campoDescricao ||
        !campoValor
    ) {

        console.error(
            "❌ Um ou mais campos de empenho não foram encontrados."
        );

        console.log({
            campoId,
            campoNumero,
            campoExercicio,
            campoDescricao,
            campoValor
        });

        alert(
            "Não foi possível localizar os campos de empenho na página."
        );

        return;

    }


    // --------------------------------------------------------
    // ADICIONA CADA EMPENHO
    // --------------------------------------------------------

    for (const emp of todosEmpenhos) {

        console.log("");
        console.log(
            "➕ Adicionando empenho:",
            emp
        );


        campoId.value = emp.id;

        campoNumero.value = emp.numero;

        campoExercicio.value = emp.exercicio;

        campoDescricao.value = emp.descricao;

        campoValor.value = emp.valor;


        // ----------------------------------------------------
        // DISPARA EVENTOS DOS INPUTS
        // ----------------------------------------------------

        campoId.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

        campoNumero.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

        campoExercicio.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

        campoDescricao.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

        campoValor.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );


        await delay(300);


        // ----------------------------------------------------
        // CHAMA O MÉTODO NATIVO DA PÁGINA
        // ----------------------------------------------------

        if (
            window.oManipulador_empenho &&
            typeof window.oManipulador_empenho.efetuar_adicao_item === "function"
        ) {

            console.log(
                "🟢 Chamando oManipulador_empenho.efetuar_adicao_item()"
            );


            window.oManipulador_empenho.efetuar_adicao_item();


        } else {

            console.warn(
                "⚠️ window.oManipulador_empenho não encontrado."
            );

        }


        await delay(500);

    }


    console.log("");
    console.log("==============================================");
    console.log("🏁 AUTOMAÇÃO DE EMPENHOS FINALIZADA");
    console.log("==============================================");

}


// ============================================================
// EVENTO RECEBIDO PELO content_contrato.js
// ============================================================

document.addEventListener(
    "AUTO_EMPENHOS",
    automatizarEmpenhos
);



// ==========================================
// MÓDULO: INJEÇÃO DE GESTORES
// Utiliza os dados completos da lista local
// ==========================================

async function automatizarGestores(evento) {

    const selecionados = evento.detail || [];

    console.log(
        `🟢 Iniciando injeção de ${selecionados.length} gestor(es).`
    );

    let adicionados = 0;
    let ignorados = 0;

    for (const gestor of selecionados) {

        console.log("-----------------------------------------");
        console.log("➡️ Processando gestor:", gestor);

        const campoId = document.getElementById('frm_id_gestor_orgao');
        const campoNome = document.getElementById('frm_nome_pessoa');
        const campoCargo = document.getElementById('frm_cargo');
        const campoEmail = document.getElementById('frm_email');
        const campoCodigoOrgao = document.getElementById('frm_codigo_orgao');
        const campoOrgao = document.getElementById('frm_orgao');

        if (
            !campoId ||
            !campoNome ||
            !campoCargo ||
            !campoEmail ||
            !campoCodigoOrgao ||
            !campoOrgao
        ) {
            console.error("❌ Campos do formulário de Gestores não encontrados.");
            ignorados++;
            continue;
        }

        // Compatibilidade: aceita objeto ou nome antigo
        if (typeof gestor !== 'object' || !gestor) {
            console.error("❌ Registro de gestor inválido:", gestor);
            ignorados++;
            continue;
        }

        // O código_orgao original vem, por exemplo, como "1 0 0"
        const codigos = String(gestor.codigo_orgao || '').trim().split(/\s+/);

        campoId.value = gestor.id_gestor_orgao || '';
        campoNome.value = gestor.nome || '';
        campoCargo.value = gestor.cargo || '';
        campoEmail.value = gestor.email || '';
        campoCodigoOrgao.value = codigos[0] || '';
        campoOrgao.value = gestor.orgao || '';

        console.log("📝 Dados preenchidos:", {
            id: campoId.value,
            nome: campoNome.value,
            cargo: campoCargo.value,
            email: campoEmail.value,
            codigoOrgao: campoCodigoOrgao.value,
            orgao: campoOrgao.value
        });

        await delay(400);

        if (
            window.oManipulador_gestor &&
            typeof window.oManipulador_gestor.efetuar_adicao_item === 'function'
        ) {

            window.oManipulador_gestor.efetuar_adicao_item();

            adicionados++;

            console.log(`✅ Gestor adicionado: ${gestor.nome}`);

            await delay(800);

        } else {

            console.error(
                "❌ oManipulador_gestor não está disponível."
            );

            ignorados++;
        }
    }

    console.log("🏁 Injeção de gestores finalizada:", {
        adicionados,
        ignorados
    });
}

// ==========================================
// BUSCA DE RESPONSÁVEL NO CADASTRO DO MGC
// ==========================================

async function buscarDadosResponsavel(nome) {

    const url = 'https://prefeitura.praiagrande.sp.gov.br/ic/ic_busca_automatica.php';

    const parametros = new URLSearchParams({
        type: 'POST',
        acao: 'ajax',
        nome_busca: 'busca_resp_contrate',
        frm_nome_resp_contratante: nome
    });

    try {

        console.log('🔎 Consultando cadastro MGC:', nome);

        const resposta = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: parametros.toString()
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const conteudo = await resposta.text();

        console.log('📥 Resposta original da busca MGC:', conteudo);

        try {
            const json = JSON.parse(conteudo);
            
            // Verifica se a resposta tem a estrutura de sucesso e valor esperada
            if (json.sucesso && json.valor) {
                // Retorna como array contendo um objeto com as chaves que o adicionarResponsavel() espera
                return [{
                    id: json.valor.frm_id_pessoa_contratante,
                    nome: json.valor.frm_nome_resp_contratante,
                    cpf: json.valor.frm_cpf_resp_contratante
                }];
            }
            
            return [];
            
        } catch (erro) {
            console.warn(
                '⚠️ A resposta não é JSON. Precisamos analisar o HTML retornado.'
            );

            return [];
        }

    } catch (erro) {

        console.error('❌ Erro ao consultar responsável no MGC:', erro);

        return [];
    }
}


// ==========================================
// INJEÇÃO DE RESPONSÁVEIS CONTRATANTE
// ==========================================

async function adicionarResponsavel(dados) {

    const nomeSelecionado =
        typeof dados === 'string'
            ? dados
            : dados?.nome;

    if (!nomeSelecionado) {
        console.error("❌ Nome do responsável não informado.");
        return false;
    }

    console.log("-----------------------------------------");
    console.log("➡️ Processando responsável:", nomeSelecionado);

    // Busca o ID e CPF no cadastro original do MGC
    const resultados = await buscarDadosResponsavel(nomeSelecionado);

    if (!resultados || resultados.length === 0) {

        console.warn(
            `⚠️ Nenhum responsável encontrado para: ${nomeSelecionado}`
        );

        return false;
    }

    const nomeNormalizado = normalizarTexto(nomeSelecionado);

    let responsavel = resultados.find(
        item => normalizarTexto(item.nome) === nomeNormalizado
    );

    if (!responsavel) {
        responsavel = resultados[0];
    }

    console.log("✅ Responsável encontrado:", responsavel);

    const campoId = document.getElementById('frm_id_pessoa_contratante');
    const campoNome = document.getElementById('frm_nome_resp_contratante');
    const campoCpf = document.getElementById('frm_cpf_resp_contratante');
    const campoEmail = document.getElementById('frm_email_resp_contratante');
    const campoEmailPessoal = document.getElementById('frm_email_profis_resp_contratante');
    const campoAssinou = document.getElementById('frm_assinou_resp_contratante');

    if (
        !campoId ||
        !campoNome ||
        !campoCpf ||
        !campoEmail ||
        !campoEmailPessoal
    ) {
        console.error("❌ Campos do formulário de Responsáveis não encontrados.");
        return false;
    }

    campoId.value = responsavel.id || '';
    campoNome.value = responsavel.nome || '';
    campoCpf.value = responsavel.cpf || '';

    // O cadastro consultado não fornece os e-mails
    campoEmail.value = '';
    campoEmailPessoal.value = '';

    if (campoAssinou) {
        campoAssinou.value = 'S';
    }

    console.log("📝 Responsável preenchido:", {
        id: campoId.value,
        nome: campoNome.value,
        cpf: campoCpf.value
    });

    await delay(400);

    if (
        window.oManipulador_responsavel_contratante &&
        typeof window.oManipulador_responsavel_contratante.efetuar_adicao_item === 'function'
    ) {

        window.oManipulador_responsavel_contratante.efetuar_adicao_item();

        console.log(`✅ Responsável adicionado: ${responsavel.nome}`);

        await delay(800);

        return true;

    } else {

        console.error(
            "❌ oManipulador_responsavel_contratante não está disponível."
        );

        return false;
    }
}

document.addEventListener('AUTO_RESPONSAVEIS', async (evento) => {

    const selecionados = evento.detail || [];

    console.log(
        `🟢 Iniciando automação de Responsáveis para ${selecionados.length} pessoa(s).`
    );

    let adicionados = 0;
    let ignorados = 0;

    for (const dados of selecionados) {

        const sucesso = await adicionarResponsavel(dados);

        if (sucesso) {
            adicionados++;
        } else {
            ignorados++;
        }
    }

    console.log("🏁 Injeção de responsáveis finalizada:", {
        adicionados,
        ignorados
    });

});

document.addEventListener('AUTO_EMPENHOS', automatizarEmpenhos);
document.addEventListener('AUTO_GESTORES', automatizarGestores);