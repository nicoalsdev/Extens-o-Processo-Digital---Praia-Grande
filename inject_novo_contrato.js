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

