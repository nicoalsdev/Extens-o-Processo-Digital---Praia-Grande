// content.js - menu flutuante, tags, ordenação de processos
(function() {

    // =========================================================================
    // VARIÁVEIS DE ESTADO
    // =========================================================================
    let ordemAtual = 'asc';
    let isDragging = false; // Flag para indicar quando o usuário está arrastando
    let ordenarTimeout = null;
    // AGORA INCLUIMOS menuType no default
    let currentSettings = {
        sortHomepage: true,
        sortFolders: true,
        showTags: true,
        menuType: 'Avancado',//'Simples'
<<<<<<< HEAD
        showBoard: true
=======
        showBoard: true;
>>>>>>> ce2067a4e12f76fe94193bb7d7c0baba3ccb5960
    };
    let isMenuOpening = false; // Flag para evitar que o clique feche o menu imediatamente
    let observer = null;
    let hasSortedHomepage = false; // 🧠 nova flag para impedir loop de ordenação
    //MENU
    let menuResizeObserver = null;
    let repositionTimeout = null;
    let lastMenuAnchor = null; // { clientX, clientY, scrollY }
    const kanbanUrl = chrome.runtime.getURL("kanban.html");
    const assinadorUrl = chrome.runtime.getURL("lista_assinador.html");
    //IMGS
    const kanbanImg = chrome.runtime.getURL("imgs/kanban.png");
    const assinadorImg = chrome.runtime.getURL("imgs/assinador.png");
    //Modificador do tipo Doc
    let tbodyCache = null;
    let pollingInterval = null;

    //Destino
    const EXPEDIENTE = 'SEAD-5111';

    // Tipos DOc
    const TIPOS_DOCUMENTOS = [{"codigo":"47","nome":"ABAIXO-ASSINADO"},{"codigo":"48","nome":"ACÓRDÃO"},{"codigo":"49","nome":"ACORDO"},{"codigo":"50","nome":"ALVARÁ"},{"codigo":"310","nome":"ALVARÁ DE REGULARIZAÇÃO"},{"codigo":"267","nome":"ANÁLISE DE AMOSTRA"},{"codigo":"263","nome":"ANTEPROJETO"},{"codigo":"308","nome":"APÓLICE"},{"codigo":"29","nome":"APRESENTAÇÃO"},{"codigo":"302","nome":"ART / RRT"},{"codigo":"51","nome":"ASSENTO"},{"codigo":"19","nome":"ATA"},{"codigo":"307","nome":"ATA DE ASSEMBLEIA"},{"codigo":"266","nome":"ATA DE REGISTRO DE PREÇOS"},{"codigo":"52","nome":"ATESTADO"},{"codigo":"53","nome":"ATO"},{"codigo":"54","nome":"AUTO"},{"codigo":"229","nome":"AUTO DE ARREMATAÇÃO"},{"codigo":"15","nome":"AUTORIZAÇÃO"},{"codigo":"274","nome":"AUTORIZAÇÃO CONTRATAÇÃO DIRETA"},{"codigo":"283","nome":"AUTORIZAÇÃO DE FORNECIMENTO"},{"codigo":"293","nome":"AVALIAÇÃO"},{"codigo":"304","nome":"AVCB"},{"codigo":"55","nome":"AVISO"},{"codigo":"271","nome":"AVISO DE CONTRATAÇÃO DIRETA"},{"codigo":"22","nome":"BALANCETE"},{"codigo":"56","nome":"BANDO"},{"codigo":"57","nome":"BILHETE"},{"codigo":"253","nome":"BOLETIM DE OCORRÊNCIA"},{"codigo":"10","nome":"BOLETO"},{"codigo":"58","nome":"BREVE"},{"codigo":"59","nome":"CARTA"},{"codigo":"60","nome":"CARTA ABERTA"},{"codigo":"230","nome":"CARTA DE ARREMATAÇÃO"},{"codigo":"61","nome":"CARTA DE CHAMADA"},{"codigo":"62","nome":"CARTA DE LEI"},{"codigo":"63","nome":"CARTA DE PERDÃO"},{"codigo":"64","nome":"CARTA DE SESMARIA"},{"codigo":"65","nome":"CARTA DE VALIDADE"},{"codigo":"66","nome":"CARTA DECLARATÓRIA"},{"codigo":"67","nome":"CARTA INTERNACIONAL"},{"codigo":"68","nome":"CARTA OU MEMORANDO DIPLOMÁTICO"},{"codigo":"69","nome":"CARTA PARTIDA OU DE DEFERIMENTO"},{"codigo":"70","nome":"CARTA PATENTE"},{"codigo":"71","nome":"CARTA PATENTE OU CARTA DE AUTORIZAÇÃO"},{"codigo":"72","nome":"CARTA PRECATÓRIA"},{"codigo":"73","nome":"CARTA RÉGIA"},{"codigo":"74","nome":"CARTA REVERSAL"},{"codigo":"75","nome":"CARTA TESTEMUNHÁVEL"},{"codigo":"9","nome":"CARTA/AR"},{"codigo":"76","nome":"CARTÃO DE CRÉDITO"},{"codigo":"77","nome":"CARTÃO DE PONTO"},{"codigo":"79","nome":"CARTÃO DE VISITA, DE CONTATO COMERCIAL OU PROFISSIONAL"},{"codigo":"78","nome":"CARTAZ"},{"codigo":"80","nome":"CÉDULA DE ELEIÇÃO"},{"codigo":"81","nome":"CÉDULA DE IDENTIDADE"},{"codigo":"82","nome":"CENSO"},{"codigo":"21","nome":"CERTIDÃO"},{"codigo":"303","nome":"CERTIDÃO DE ÓBITO"},{"codigo":"305","nome":"CERTIDÃO NEGATIVA CARTÓRIO"},{"codigo":"84","nome":"CERTIFICADO"},{"codigo":"289","nome":"CERTIFICADO DE REGISTRO CADASTRAL"},{"codigo":"85","nome":"CHEQUE"},{"codigo":"86","nome":"CIRCULAR"},{"codigo":"87","nome":"CITAÇÃO"},{"codigo":"247","nome":"CNPJ"},{"codigo":"246","nome":"CÓDIGO"},{"codigo":"88","nome":"COMPROMISSO"},{"codigo":"284","nome":"COMPROVANTE"},{"codigo":"255","nome":"COMPROVANTE DE INSCRIÇÃO"},{"codigo":"242","nome":"COMPROVANTE DE PAGAMENTO"},{"codigo":"8","nome":"COMPROVANTE DE RESIDÊNCIA"},{"codigo":"89","nome":"COMUNICAÇÃO/PAPER"},{"codigo":"90","nome":"COMUNICADO"},{"codigo":"298","nome":"CONCILIAÇÃO BANCÁRIA"},{"codigo":"91","nome":"CONSTITUIÇÃO"},{"codigo":"92","nome":"CONSULTA"},{"codigo":"93","nome":"CONTA"},{"codigo":"94","nome":"CONTA CORRENTE"},{"codigo":"6","nome":"CONTRATO"},{"codigo":"268","nome":"CONTRATO ADMINISTRATIVO"},{"codigo":"95","nome":"CONVENÇÃO"},{"codigo":"96","nome":"CONVÊNIO"},{"codigo":"97","nome":"CONVITE"},{"codigo":"98","nome":"CONVOCAÇÃO"},{"codigo":"99","nome":"CÓPIA AUTÊNTICA"},{"codigo":"100","nome":"CORRESPONDÊNCIA INTERNA"},{"codigo":"1","nome":"COTA"},{"codigo":"248","nome":"CPF"},{"codigo":"101","nome":"CRACHÁ"},{"codigo":"102","nome":"CRONOGRAMA"},{"codigo":"31","nome":"CROQUIS"},{"codigo":"103","nome":"CURRÍCULO DE CURSO"},{"codigo":"104","nome":"CURRICULUM VITAE"},{"codigo":"105","nome":"DEBÊNTURE"},{"codigo":"44","nome":"DECENDIAIS"},{"codigo":"106","nome":"DECISÃO"},{"codigo":"4","nome":"DECLARAÇÃO"},{"codigo":"107","nome":"DECRETO"},{"codigo":"108","nome":"DECRETO-LEI"},{"codigo":"109","nome":"DELIBERAÇÃO"},{"codigo":"23","nome":"DEMONSTRATIVO"},{"codigo":"110","nome":"DEPOIMENTO"},{"codigo":"42","nome":"DEPÓSITO"},{"codigo":"290","nome":"DESCRITIVO"},{"codigo":"111","nome":"DESIGNAÇÃO"},{"codigo":"112","nome":"DESPACHO"},{"codigo":"306","nome":"DEVOLUÇÃO CARTÓRIO"},{"codigo":"113","nome":"DEVOLUTIVA"},{"codigo":"114","nome":"DIÁRIO"},{"codigo":"115","nome":"DIPLOMA"},{"codigo":"116","nome":"DIRETRIZES ORÇAMENTÁRIAS"},{"codigo":"117","nome":"DISSERTAÇÃO"},{"codigo":"291","nome":"DOCUMENTO"},{"codigo":"262","nome":"DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA (DFD)"},{"codigo":"5","nome":"DOCUMENTO DE IDENTIFICAÇÃO"},{"codigo":"118","nome":"DOSSIÊ"},{"codigo":"119","nome":"EDITAL"},{"codigo":"11","nome":"E-MAIL"},{"codigo":"120","nome":"EMBARGO"},{"codigo":"121","nome":"EMENDA"},{"codigo":"122","nome":"EMENTA"},{"codigo":"299","nome":"ENCARGOS TRABALHISTAS"},{"codigo":"123","nome":"ESCALA"},{"codigo":"124","nome":"ESCRITO DE SECRETÁRIO"},{"codigo":"125","nome":"ESCRITURA"},{"codigo":"240","nome":"ESPELHO DE DECRETO"},{"codigo":"28","nome":"ESPELHO DO IPTU"},{"codigo":"126","nome":"ESTATUTO"},{"codigo":"254","nome":"ESTUDO"},{"codigo":"260","nome":"ESTUDO TÉCNICO PRELIMINAR - (ETP)"},{"codigo":"258","nome":"EXAME MÉDICO"},{"codigo":"127","nome":"EXPEDIENTE"},{"codigo":"128","nome":"EXPOSIÇÃO DE MOTIVOS"},{"codigo":"7","nome":"EXTRATO"},{"codigo":"129","nome":"EXTRATO BANCÁRIO"},{"codigo":"130","nome":"FATURA"},{"codigo":"131","nome":"FÉ DE OFÍCIO"},{"codigo":"132","nome":"FICHA"},{"codigo":"309","nome":"FICHA TÉCNICA"},{"codigo":"133","nome":"FILIPETA"},{"codigo":"134","nome":"FLUXOGRAMA"},{"codigo":"135","nome":"FOLHA"},{"codigo":"43","nome":"FOLHA DE PAGAMENTO"},{"codigo":"136","nome":"FOLHETO/FOLDER"},{"codigo":"137","nome":"FORAL"},{"codigo":"138","nome":"FÓRMULA/FORMULÁRIO"},{"codigo":"13","nome":"FORMULÁRIO"},{"codigo":"139","nome":"GRADE CURRICULAR"},{"codigo":"140","nome":"GUIA"},{"codigo":"141","nome":"HISTÓRICO ESCOLAR"},{"codigo":"300","nome":"HOLERITE"},{"codigo":"142","nome":"HOMOLOGAÇÃO"},{"codigo":"12","nome":"IMAGEM"},{"codigo":"276","nome":"IMPUGNAÇÃO EDITAL"},{"codigo":"143","nome":"INDICAÇÃO"},{"codigo":"270","nome":"INDICAÇÃO DE AGENTE DE CONTRATAÇÃO/EQUIPE DE APOIO"},{"codigo":"144","nome":"INFORMAÇÃO"},{"codigo":"145","nome":"INFORMAÇÃO COMERCIAL"},{"codigo":"146","nome":"INFORMAÇÃO DE SERVIÇO"},{"codigo":"147","nome":"INFORME"},{"codigo":"148","nome":"INSTRUÇÃO DE SERVIÇO"},{"codigo":"149","nome":"INSTRUÇÃO NORMATIVA"},{"codigo":"150","nome":"INVENTÁRIO"},{"codigo":"151","nome":"INVENTÁRIO POST MORTEM"},{"codigo":"252","nome":"JUSTIFICATIVA"},{"codigo":"152","nome":"LANÇAMENTO"},{"codigo":"241","nome":"LANÇAMENTO DE DECRETO"},{"codigo":"153","nome":"LAUDO"},{"codigo":"154","nome":"LAYOUT"},{"codigo":"33","nome":"LEGISLAÇÃO"},{"codigo":"155","nome":"LEI"},{"codigo":"37","nome":"LEIAUTE"},{"codigo":"156","nome":"LEMBRETE"},{"codigo":"157","nome":"LEVANTAMENTO ESTATÍSTICO"},{"codigo":"158","nome":"LEVANTAMENTO TOPOGRÁFICO"},{"codigo":"256","nome":"LICENÇA"},{"codigo":"39","nome":"LISTA DE PRESENÇA"},{"codigo":"288","nome":"LISTA DE VERIFICAÇÃO CONTRATAÇÃO DIRETA"},{"codigo":"287","nome":"LISTA DE VERIFICAÇÃO LICITAÇÃO"},{"codigo":"159","nome":"LISTA/LISTAGEM"},{"codigo":"245","nome":"MANIFESTAÇÃO"},{"codigo":"231","nome":"MANIFESTAÇÃO JURÍDICA"},{"codigo":"38","nome":"MANUAL"},{"codigo":"30","nome":"MAPA"},{"codigo":"232","nome":"MATRICULA C.R.I."},{"codigo":"275","nome":"MATRIZ DE RISCOS"},{"codigo":"36","nome":"MEMORANDO"},{"codigo":"301","nome":"MEMORIAL DESCRITIVO"},{"codigo":"32","nome":"MINUTA"},{"codigo":"269","nome":"MINUTA DE EDITAL"},{"codigo":"238","nome":"NOTA DE CANCELAMENTO DE RESTOS A PAGAR"},{"codigo":"239","nome":"NOTA DE DEDUÇÃO DE RECEITA"},{"codigo":"234","nome":"NOTA DE EMPENHO"},{"codigo":"237","nome":"NOTA DE ESTORNO DE EMPENHO"},{"codigo":"235","nome":"NOTA DE LIQUIDAÇÃO"},{"codigo":"20","nome":"NOTA FISCAL"},{"codigo":"24","nome":"NOTIFICAÇÃO"},{"codigo":"14","nome":"OFÍCIO"},{"codigo":"160","nome":"ORÇAMENTO"},{"codigo":"236","nome":"ORDEM DE PAGAMENTO"},{"codigo":"35","nome":"ORDEM DE SERVIÇO"},{"codigo":"161","nome":"ORDEM DO DIA"},{"codigo":"162","nome":"ORDENAÇÕES"},{"codigo":"163","nome":"ORGANOGRAMA"},{"codigo":"251","nome":"ORTOFOTO"},{"codigo":"46","nome":"PAGAMENTO"},{"codigo":"164","nome":"PANFLETO"},{"codigo":"165","nome":"PAPELETA"},{"codigo":"297","nome":"PARECER DO CONSELHO"},{"codigo":"295","nome":"PARECER JURÍDICO"},{"codigo":"294","nome":"PARECER TÉCNICO"},{"codigo":"167","nome":"PARTILHA DE SUCESSÃO"},{"codigo":"168","nome":"PARTITURA"},{"codigo":"169","nome":"PASSAPORTE"},{"codigo":"170","nome":"PAUTA"},{"codigo":"257","nome":"PESQUISA"},{"codigo":"286","nome":"PESQUISA DE PREÇOS"},{"codigo":"171","nome":"PETIÇÃO"},{"codigo":"172","nome":"PLANILHA"},{"codigo":"173","nome":"PLANO"},{"codigo":"174","nome":"PLANTA"},{"codigo":"34","nome":"PORTARIA"},{"codigo":"175","nome":"PORTULANO"},{"codigo":"176","nome":"POSTURA"},{"codigo":"177","nome":"PRECATÓRIO"},{"codigo":"178","nome":"PRESTAÇÃO DE CONTAS"},{"codigo":"292","nome":"PROCESSO FÍSICO"},{"codigo":"180","nome":"PROCURAÇÃO"},{"codigo":"181","nome":"PROGRAMA"},{"codigo":"182","nome":"PROJETO"},{"codigo":"264","nome":"PROJETO BÁSICO"},{"codigo":"265","nome":"PROJETO EXECUTIVO"},{"codigo":"183","nome":"PRONTUÁRIO"},{"codigo":"184","nome":"PRONUNCIAMENTO"},{"codigo":"185","nome":"PROPOSIÇÃO"},{"codigo":"186","nome":"PROPOSTA"},{"codigo":"187","nome":"PROSPECTO"},{"codigo":"188","nome":"PROTOCOLADO"},{"codigo":"27","nome":"PROTOCOLO"},{"codigo":"189","nome":"PROVA"},{"codigo":"190","nome":"PROVISÃO"},{"codigo":"25","nome":"PUBLICAÇÃO"},{"codigo":"191","nome":"QUADRO"},{"codigo":"249","nome":"QUADRO DE DESCRIÇÃO DE ITEM"},{"codigo":"250","nome":"QUADRO DE DESCRIÇÃO DE SERVIÇOS"},{"codigo":"192","nome":"QUESTIONÁRIO"},{"codigo":"193","nome":"RASCUNHO"},{"codigo":"194","nome":"RAZÃO"},{"codigo":"195","nome":"RECEITA"},{"codigo":"196","nome":"RECENSEAMENTO"},{"codigo":"41","nome":"RECIBO"},{"codigo":"197","nome":"RECOMENDAÇÃO"},{"codigo":"198","nome":"RECORTE/CLIP"},{"codigo":"199","nome":"RECURSO"},{"codigo":"277","nome":"RECURSO ADMINISTRATIVO"},{"codigo":"200","nome":"REGIMENTO"},{"codigo":"201","nome":"REGISTRO"},{"codigo":"202","nome":"REGISTRO CIVIL"},{"codigo":"203","nome":"REGISTRO PAROQUIAL"},{"codigo":"204","nome":"REGULAMENTO"},{"codigo":"205","nome":"RELAÇÃO"},{"codigo":"206","nome":"RELAÇÃO DE REMESSA"},{"codigo":"18","nome":"RELATÓRIO"},{"codigo":"278","nome":"RELATÓRIO E DESPACHO DE IMPUGNAÇÃO"},{"codigo":"279","nome":"RELATÓRIO E DESPACHO DE RECURSO ADMINISTRATIVO"},{"codigo":"207","nome":"RELEASE"},{"codigo":"3","nome":"REPRESENTAÇÃO"},{"codigo":"2","nome":"REQUERIMENTO"},{"codigo":"233","nome":"REQUERIMENTO DESARQUIVAMENTO"},{"codigo":"208","nome":"REQUISIÇÃO"},{"codigo":"244","nome":"REQUISIÇÃO DE COMPRAS"},{"codigo":"296","nome":"RESCISÃO TRABALHISTA"},{"codigo":"209","nome":"RESIDÊNCIA"},{"codigo":"210","nome":"RESOLUÇÃO"},{"codigo":"281","nome":"RESPOSTA DE ESCLARECIMENTO"},{"codigo":"211","nome":"RESUMO"},{"codigo":"212","nome":"ROL"},{"codigo":"213","nome":"ROTEIRO"},{"codigo":"214","nome":"SINOPSE"},{"codigo":"215","nome":"SOLICITAÇÃO"},{"codigo":"285","nome":"SOLICITAÇÃO DE EMPENHO"},{"codigo":"280","nome":"SOLICITAÇÃO DE ESCLARECIMENTO"},{"codigo":"216","nome":"TABELA"},{"codigo":"217","nome":"TALONÁRIO"},{"codigo":"218","nome":"TELEGRAMA"},{"codigo":"219","nome":"TERMO"},{"codigo":"40","nome":"TERMO DE CONFISSÃO DE DÍVIDA E ACORDO DE PARCELAMENTO"},{"codigo":"282","nome":"TERMO DE HOMOLOGAÇÃO"},{"codigo":"17","nome":"TERMO DE NOTIFICAÇÃO"},{"codigo":"272","nome":"TERMO DE RATIFICAÇÃO DE DISPENSA"},{"codigo":"273","nome":"TERMO DE RATIFICAÇÃO DE INEXIGIBILIDADE"},{"codigo":"261","nome":"TERMO DE REFERÊNCIA (TR)"},{"codigo":"243","nome":"TERMO DE RETIFICAÇÃO"},{"codigo":"220","nome":"TESE"},{"codigo":"221","nome":"TESTAMENTO"},{"codigo":"222","nome":"TESTE"},{"codigo":"259","nome":"TÍTULO"},{"codigo":"223","nome":"TÍTULO DE CRÉDITO"},{"codigo":"224","nome":"TRABALHO DE CONCLUSÃO DE CURSO (TCC)"},{"codigo":"16","nome":"TRANSFERÊNCIA DE RESPONSABILIDADE"},{"codigo":"225","nome":"TRASLADO"},{"codigo":"226","nome":"VALE"},{"codigo":"227","nome":"VOLANTE"},{"codigo":"228","nome":"WARRANT"}];

    const estiloPopover = document.createElement('style');
    estiloPopover.textContent = `
    /* Esconde absolutamente qualquer popover que contenha este título específico */
    .popover:has(.popover-title:contains("Cadastro de e-mails")),
    .popover:has(h3:contains("Cadastro de e-mails")),
    div[id^="popover"]:has(h3) { 
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
    `;
    document.head.appendChild(estiloPopover);


// Cria um observador para detectar e remover o popover assim que ele surgir no HTML
    const monitorarEApagarPopover = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
            // Verifica se o nó adicionado é uma div de popover
                if (node.nodeType === 1 && node.classList.contains('popover')) {
                    const titulo = node.querySelector('.popover-title');
                    if (titulo && titulo.textContent.includes('Cadastro de e-mails')) {
                        console.log('🛡️ Extensão bloqueou e removeu o popover automático.');
                    node.remove(); // Remove o elemento do HTML na hora
                }
            }
        });
        });
    });

    const linkEmail = document.getElementById('emailPopover');
    if (linkEmail) {
    // Remove completamente os gatilhos que o Bootstrap usa para ler e criar o popover
        linkEmail.removeAttribute('data-toggle');
        linkEmail.removeAttribute('data-trigger');
        linkEmail.removeAttribute('data-original-title');
        linkEmail.removeAttribute('data-content');

    // Substitui por um título nativo comum do navegador caso ainda queira um mini-tooltip padrão
        linkEmail.title = "Gerenciar E-mails"; 
    }

// Inicia o monitoramento no body da página
    monitorarEApagarPopover.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ===== Floating menu creation (Mantido) =====
    const tagMenu = document.createElement('div');
    tagMenu.id = 'tag-floating-menu';
    if (tagMenu) tagMenu.style.display = 'none';
    Object.assign(tagMenu.style, {
        position: 'absolute',
        display: 'none',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '6px 10px',
        zIndex: '2147483647',
        minWidth: '160px',
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif'
    });
    document.body.appendChild(tagMenu);



//Tipo DOc
    function getTbodyElement() {
        if (tbodyCache) return tbodyCache;

        let tbody = document.getElementById('documentos'); 

        if (!tbody) {
            const table = document.getElementById('tbArquivos');
            if (table) {
                tbody = table.querySelector('tbody');
            }
        }

        if (tbody) {
            tbodyCache = tbody;
            return tbody;
        }

        return null;
    }

    function sortPredefinedTags(tags) {
      return [...tags].sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : 999;
        const orderB = typeof b.order === 'number' ? b.order : 999;
        return orderA - orderB;
    });
  }

    // ------------------------------------------------
    // 3. FUNÇÃO CRÍTICA: Lógica de seleção e Forçar Mudança de Evento
    // (Lógica atualizada com priorização)
    // ------------------------------------------------
  function forceSelectChange(indice, nomeArquivoOriginal, selectElement) {
        // Limpa o nome do arquivo para melhor correspondência (remove extensão, espaços)
    const nomeArquivoLimpo = nomeArquivoOriginal.split('.')[0].trim().toUpperCase();
        // Adiciona espaços nas bordas para facilitar a busca por palavras inteiras (ex: ' ATA ')
    const nomeArquivoComEspacos = ' ' + nomeArquivoLimpo + ' '; 

    let tipoEncontrado = null;
    let melhorMatchLength = 0;

        // --- 1. REGRAS DE PRIORIDADE MÁXIMA (ATA e COTA como palavras inteiras) ---
        // A. Verifica ATA (Código 19) - Se estiver cercada de espaços, é prioridade.
    if (nomeArquivoComEspacos.includes('COTA ')) {
        tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '1');
        console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: COTA (Código 1).`);
    } 
        // B. Verifica COTA (Código 1) - Se estiver cercada de espaços, é prioridade.
    else if (nomeArquivoComEspacos.includes(' ATA ')) {
        tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '19');
        console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: ATA (Código 19).`);
    }
    else if (nomeArquivoComEspacos.includes('DOM ') || nomeArquivoComEspacos.includes('DOU ') || nomeArquivoComEspacos.includes('DOE ')) {
        tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '25');
        console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: PUBLICAÇÃO (Código 25).`);
    }
    else if (nomeArquivoComEspacos.includes('AF ') || nomeArquivoComEspacos.includes('CF ')) {
        tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '283');
        console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: AUTORIZAÇÃO DE FORNECIMENTO (Código 283).`);
    }
    else if (nomeArquivoComEspacos.includes('RG ') || nomeArquivoComEspacos.includes('CPF ') || nomeArquivoComEspacos.includes('CNH ')) {
        tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '291');
        console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: DOCUMENTO (Código 291).`);
    }
    else if (nomeArquivoComEspacos.includes('RELATORIO ') || nomeArquivoComEspacos.includes('RELATORIOS ') || nomeArquivoComEspacos.includes('RELATÓRIO ')|| nomeArquivoComEspacos.includes('RELATÓRIOS ')) {
        tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '18');
        console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: RELATÓRIO (Código 18).`);
    }
    else if(nomeArquivoComEspacos.includes('Tribunal de Contas do Estado de São Paulo') || nomeArquivoComEspacos.includes('AUDESP')){
       tipoEncontrado = TIPOS_DOCUMENTOS.find(doc => doc.codigo === '284');
       console.log(` ✨ [MATCH EXATO] Documento ${indice}: Prioridade máxima: COMPROVANTE (Código 284).`);
   }

        // --- 2. REGRA GERAL (Maior comprimento de match) ---
   if (!tipoEncontrado) {

    TIPOS_DOCUMENTOS.forEach(doc => {
                // Remove acentos e padroniza o nome do documento
        const nomeDoc = doc.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

                // Verifica se o NOME DO DOCUMENTO ESTÁ CONTIDO no nome do arquivo
        if (nomeArquivoLimpo.includes(nomeDoc)) {

                    // CRITÉRIO DE ESPECIFICIDADE: O match mais longo é o mais específico (ex: "CONTRATO" vence "ATO")
            if (nomeDoc.length > melhorMatchLength) {
                melhorMatchLength = nomeDoc.length;
                tipoEncontrado = doc;
            }
        }
    });

    if(tipoEncontrado) {
     console.log(`      ✨ [MATCH LONGO] Documento ${indice}: Arquivo "${nomeArquivoOriginal}" corresponde a "${tipoEncontrado.nome}" (Código: ${tipoEncontrado.codigo})`);
 }
}


if (tipoEncontrado) {
            // 2. Define o valor no SELECT
    selectElement.value = tipoEncontrado.codigo;

            // 3. Dispara Eventos de Mudança
            // Crucial para o JS nativo da página reconhecer a alteração
    ['change', 'input'].forEach(eventType => {
        const event = new Event(eventType, { bubbles: true });
        selectElement.dispatchEvent(event);
    });

} else {
    console.warn(`      🚫 [NO MATCH] Documento ${indice}: Não foi encontrado tipo correspondente para "${nomeArquivoOriginal}".`);
            // Deixa o valor padrão
}
}


    // ------------------------------------------------
    // 4. LÓGICA DE PROCESSAMENTO DE DOCUMENTOS
    // ------------------------------------------------

    // Função principal que busca e inicia o processamento dos documentos pendentes
function processarDocumentosPendentes() {
    const tbody = getTbodyElement();
    if (!tbody) {
            // Aviso de que o elemento ainda não está disponível
        setTimeout(processarDocumentosPendentes, 500);
        return;
    }

        // Seletor: Busca TRs que NÃO foram processadas E contêm o SELECT do tipo documento
    const linhasPendentes = tbody.querySelectorAll('tr:not([data-processed]) select[name^="codigoTipoDocumento."]');

    if (linhasPendentes.length === 0) {
        return;
    }

    console.log(`\n🟢 [PROCESSAMENTO] ${linhasPendentes.length} documento(s) pendente(s) encontrado(s)!`);

    linhasPendentes.forEach(selectTipoDocumento => {
        const linhaDocumento = selectTipoDocumento.closest('tr');

            // Evita iniciar o processamento se já estiver em andamento
        if (linhaDocumento && linhaDocumento.getAttribute('data-processing') === 'true') {
            return;
        }

            // Marca a linha como em processamento
        if (linhaDocumento) linhaDocumento.setAttribute('data-processing', 'true');

            // Extrai o índice (o número no final do atributo name="codigoTipoDocumento.N")
        const indiceMatch = selectTipoDocumento.name.match(/\.(\d+)$/);
        const indice = indiceMatch ? indiceMatch[1] : 'N/A';

            // Inicia o processo de polling de input
        selecionarDocumento(linhaDocumento, indice, () => {
                // Callback de conclusão
            if (linhaDocumento) {
                linhaDocumento.removeAttribute('data-processing');
                    linhaDocumento.setAttribute('data-processed', 'true'); // Marca como concluído
                    console.log(`   ✅ [CONCLUSÃO] Documento ${indice} marcado como processado.`);
                }
            });
    });
}

    // Função que faz o polling para esperar o nome do arquivo ser preenchido
function selecionarDocumento(linha, indice, onCompleteCallback) {
    const selectTipoDocumento = linha.querySelector(`select[name="codigoTipoDocumento.${indice}"]`);
    const inputDescricao = linha.querySelector(`input[name="descricao.${indice}"]`);

    if (!selectTipoDocumento || !inputDescricao) {
     console.error(`   ❌ [SETUP] Documento ${indice}: SELECT ou INPUT não encontrados.`);
     if (onCompleteCallback) onCompleteCallback(); 
     return;
 }

 let attempts = 0;
        const maxAttempts = 60; // 3 segundos (60 * 50ms)

        const checkInputAndSelect = () => {
            attempts++;
            const nomeArquivoOriginal = inputDescricao.value;

            // Condição de sucesso: Input (nome do arquivo) foi preenchido
            if (nomeArquivoOriginal) {
                console.log(`   ✅ [POLLING] Documento ${indice}: Input preenchido na tentativa ${attempts}. Nome: "${nomeArquivoOriginal}"`);

                // DELAY DE SEGURANÇA (100ms) antes de tentar a seleção
                setTimeout(() => {
                    forceSelectChange(indice, nomeArquivoOriginal, selectTipoDocumento);
                    if (onCompleteCallback) onCompleteCallback(); // Chama o callback após a tentativa de seleção
                }, 100);
                return;
            }
            
            // Condição de falha: Tempo limite atingido
            if (attempts > maxAttempts) {
                console.error(`   ❌ [POLLING] Documento ${indice}: Tempo limite (3s) atingido. Não foi possível obter nome do arquivo.`);
                if (onCompleteCallback) onCompleteCallback(); 
                return; 
            }
            
            // Continua o polling
            setTimeout(checkInputAndSelect, 50); 
        }; 

        checkInputAndSelect();
    } // Fim de selecionarDocumento


    // ------------------------------------------------
    // 5. INICIADOR E OBSERVER
    // ------------------------------------------------

    function inicializarAutoSelecao() {

        if(!isPastaUrl3()){return;}

        const tbody = getTbodyElement(); 
        if (!tbody) {
            // Tenta de novo se o TBODY ainda não estiver pronto
            setTimeout(inicializarAutoSelecao, 500);
            return;
        }
        
        console.log("🟢 [INÍCIO] Monitoramento da tabela de documentos iniciado no:", tbody.id || tbody.tagName);

        // 1. Inicia o processamento imediatamente
        processarDocumentosPendentes();

        // 2. Cria um Polling (a cada 500ms) como backup
        pollingInterval = setInterval(processarDocumentosPendentes, 500);

        // 3. O MutationObserver dispara o processamento quando um novo TR é adicionado
        const observerConfig = { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] };

        const observer = new MutationObserver((mutationsList) => {
            console.log(`   🔄 [OBSERVER] Alteração detectada. Verificando documentos pendentes...`);
            processarDocumentosPendentes();
        });

        observer.observe(tbody, observerConfig);
    }



/**
 * Determina se uma cor HEX é CLARA.
 *
 * @param {string} hexColor O código de cor HEX (ex: "#FFFFFF", "FF0000").
 * @returns {boolean} Retorna 'true' se a cor for clara, 'false' se for escura.
 */
    function isColorLight(hexColor) {
    // 1. Limpeza e Validação (Mantida)
        const hex = hexColor.replace('#', '');
        if (hex.length !== 6 && hex.length !== 3) {
            throw new Error("Código HEX inválido. Deve ter 3 ou 6 caracteres.");
        }

        let r, g, b;

    // Expansão do HEX curto
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
        // Extração dos componentes RGB
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }

    // 2. Cálculo da Luminosidade Ponderada (Mantido)
    // Fórmula W3C/YIQ: (0.299 * R) + (0.587 * G) + (0.114 * B)
        const luminosity = (0.299 * r + 0.587 * g + 0.114 * b);

    // 3. Determinação e Retorno Booleano
    // Retorna TRUE se a luminosidade for maior que o limite (128).
        const threshold = 128; 

        return luminosity > threshold;
    }


    function repositionTagMenu() {
        if (!lastMenuAnchor) return;
        const margin = 10;
        const menuRect = tagMenu.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        let x = lastMenuAnchor.clientX + margin;
        let y = lastMenuAnchor.clientY + lastMenuAnchor.scrollY;

        // Ajuste horizontal
        if (x + menuRect.width + margin > winW) {
            x = winW - menuRect.width - margin;
        }
        if (x < margin) x = margin;

        // Ajuste vertical: abre pra cima se faltar espaço
        const bottomSpace = winH - lastMenuAnchor.clientY;
        if (bottomSpace < menuRect.height + margin) {
            y = (lastMenuAnchor.clientY + lastMenuAnchor.scrollY) - menuRect.height - margin;
        }
        if (y < margin) y = margin;

        tagMenu.style.left = `${Math.round(x)}px`;
        tagMenu.style.top = `${Math.round(y)}px`;
    }

    function showToast(icon, title) {
        // 1. Definição do mixin para Toast (configurações padrão de um toast)
        const Toast = Swal.mixin({
            toast: true, // Define como modo toast
            position: 'bottom-end', // Posição no canto superior direito
            showConfirmButton: false, // Sem botão de confirmação
            timer: 3000, // Duração de 3 segundos
            timerProgressBar: true, // Barra de progresso do timer
            // Pausa o timer ao passar o mouse e retoma ao sair
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        // 2. Dispara o toast
        Toast.fire({
            icon: icon, // Ex: 'success', 'error'
            title: title
        });
    }

    function getProcessNumber(processElement) {
        if (isProcessoDetailUrl()) {
            const spanElemento = document.getElementById('numero-processo');

            return spanElemento.textContent;
        }
        // Procura pela tag <b> com a classe 'title' dentro do elemento do processo
        const titleElement = processElement ? processElement.querySelector('b.title') : null;
        if (titleElement) {
            // Extrai o texto, remove espaços em branco e retorna.

            return titleElement.textContent.trim();
        }
        return null;
    }

    function showConfirmation(title, text, confirmButtonText, icon = 'warning') {
        if (typeof Swal === 'undefined') {
            return Promise.resolve(false);
        }
        return Swal.fire({
            title: title,
            text: text,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmButtonText,
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            return result.isConfirmed;
        });
    }

    // =========================================================================
    // FUNÇÕES AUXILIARES (omitidas por brevidade, mas devem estar no arquivo)
    // =========================================================================

    function isGerenciarPastaUrl() {
        const url = window.location.href.toLowerCase();
        return url.includes('/CaixaEntrada/GerenciarPastas');
    }

    function isPastaUrl() {
        const url = window.location.href;
        const pastaBaseUrl = 'https://processodigital.praiagrande.sp.gov.br/CaixaEntrada/Pasta?codigo=';
        return url.startsWith(pastaBaseUrl) && url.length > pastaBaseUrl.length;
    }

    function isPastaUrl2() {
        const url = window.location.href;
        return url.endsWith('/CaixaEntrada') || url.endsWith('/CaixaEntrada#') || url.includes('/CaixaEntrada/Recebidos') || url.endsWith('/CaixaEntrada/Index');
    }
    function isPastaUrl3() {
        const url = window.location.href;
        const pastaBaseUrl = 'https://processodigital.praiagrande.sp.gov.br/documentos/';
        return url.startsWith(pastaBaseUrl) && url.length > pastaBaseUrl.length;
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function isProcessoDetailUrl() {
        const url = window.location.href;
        const processoBaseUrl = 'https://processodigital.praiagrande.sp.gov.br/processo/';
        return url.startsWith(processoBaseUrl) && url.length > processoBaseUrl.length;
    }

    function isProcessoDigital() {
        const url = window.location.href;
        const processoBaseUrl = 'https://processodigital.praiagrande.sp.gov.br';
        return url.startsWith(processoBaseUrl);
    }

    function getProcessoIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/\/processo\/(\d+)/);
        return match ? match[1] : null;
    }

    /**
     * Extrai o ID numérico do processo da URL de Detalhes do Processo (/processo/XXXXX).
     * @returns {string|null} O ID do processo ou null se não encontrado.
     */
    function getProcessIdFromDetailUrl() {
        // A URL deve ser no formato: .../processo/12345
        const match = window.location.href.match(/\/processo\/(\d+)/);
        // Retorna a primeira captura do grupo (o número do processo)
        return match ? match[1] : null;
    }

    function getProcessIdFromListElement(processoEl) {
        if (!processoEl) return null;

        const idEl = processoEl.querySelector('.pd-inbox-item-id');
        if (idEl) {
            let id = idEl.getAttribute('data-processo');
            if (id) return id;

            const textContent = idEl.textContent.trim();
            const match = textContent.match(/\d+$/);
            if (match) return match[0];
        }

        if (processoEl.getAttribute('data-processo')) {
            return processoEl.getAttribute('data-processo');
        }

        return null;
    }

    // Função para extrair e converter a data do texto do processo
    function parseDate(text) {
        // Regex: DD/MM/YYYY seguido por um espaço e HH:MM (opcionalmente)
        // Captura 1: Dia, 2: Mês, 3: Ano, 4: Hora, 5: Minuto
        const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
        if (!match) return null;

        // Desestruturação com valores padrão para hora e minuto
        const [, dia, mes, ano, hora = '00', minuto = '00'] = match;

        // Cria objeto Date de forma robusta: (ano, mês-indexado-em-zero, dia, hora, minuto)
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), parseInt(hora), parseInt(minuto), 0);
    }


    async function carregarEAgruparTodasAsPaginas() {
    // 1. Verifica se a ordenação está ativa nas configurações
        const isRecebidos = isPastaUrl2();
        const isPasta = isPastaUrl();
        const sortAtivo = (isRecebidos && currentSettings.sortHomepage) || 
        (isPasta && currentSettings.sortFolders);

        if (!sortAtivo) return;

    // 2. Captura as URLs das outras páginas
        const paginationLinks = Array.from(document.querySelectorAll('.pd-pagination a'));
        const urlAtualObj = new URL(window.location.href);

        const urls = [...new Set(paginationLinks.map(a => a.href))].filter(link => {
            if (!link || link.includes('javascript') || link === '#') return false;
            try {
                const linkUrl = new URL(link);
            // Ignora a página atual
                return linkUrl.pathname + linkUrl.search !== urlAtualObj.pathname + urlAtualObj.search;
            } catch (e) { return false; }
        });

        if (urls.length === 0) return;

        const containerPrincipal = document.querySelector('.pd-inbox-col-right');
        if (!containerPrincipal) return;

        console.log(`Buscando processos em ${urls.length} páginas adicionais...`);

        for (const url of urls) {
            try {
                const response = await fetch(url);
                const htmlText = await response.text();
                const parser = new DOMParser();
                const docAlvo = parser.parseFromString(htmlText, 'text/html');
                const novosItens = docAlvo.querySelectorAll('a.pd-inbox-item');

                novosItens.forEach(item => {
                    const itemHref = item.getAttribute('href');
                // SÓ ANEXA SE NÃO EXISTIR NA TELA (Evita duplicados da página 2, 3, etc)
                    if (!document.querySelector(`a.pd-inbox-item[href="${itemHref}"]`)) {
                        const nodeImportado = document.importNode(item, true);
                        containerPrincipal.appendChild(nodeImportado);
                    }
                });
            } catch (err) {
                console.error("Erro ao carregar página: " + url, err);
            }
        }

    // --- IMPORTANTE: REMOVIDO O COMANDO QUE ESCONDIA A PAGINAÇÃO ---

    // Resetamos a flag para permitir que a ordenação processe os novos itens
        hasSortedHomepage = false; 

    // Forçamos a reinicialização dos botões da extensão para garantir que apareçam
        initializeFeatures(); 

        if (typeof ordenarProcessosExt === 'function') {
            applyAllTags();
            ordenarProcessosExt(); 
        }
    }



    // CORREÇÃO: Lógica de ordenação (garante que currentSettings seja respeitado)
    function ordenarProcessosExt() {
        if (hasSortedHomepage) {
            console.log('⚠️ Ordenação da homepage já foi executada — ignorando novas chamadas.');
            return;
        }
        hasSortedHomepage = true; // Marca como feita

        if (isPastaUrl2() && isDragging) {
            console.log('⏸️ Ignorando ordenação: usuário está arrastando.');
            return;
        }
        // As verificações de settings garantem que a ordenação só ocorre se o usuário ativou para o contexto atual
        // 1. Determina o contexto da URL
        // isPastaUrl() e isPastaUrl2() (que checam /app/pasta/ e /app/pastas/) indicam Páginas de Pasta.
        const isFolderPage = isPastaUrl();
        const isHomepage = isPastaUrl2(); // Homepage é quando não é uma página de pasta.

        // 2. Verifica as configurações para o contexto e, se desativado, retorna
        if (isFolderPage && !currentSettings.sortFolders) {
            console.log('Ordenação de Pastas desativada nas configurações. Ignorando.');
            return;
        }
        if (isHomepage && !currentSettings.sortHomepage) {
            console.log('Ordenação da Homepage desativada nas configurações. Ignorando.');
            return;
        }

        const container = document.querySelector('.pd-inbox-col-right');
        if (!container) return;

        const processos = Array.from(container.querySelectorAll('a.pd-inbox-item'));
        if (processos.length === 0) return;

        // Se a lógica da ordenação já está ocorrendo (com base no flag), saia.
        // Já não usamos ordenacaoEmCurso, mas sim containerProcessado na função de chamada
        // Mapeia os processos para um array de objetos com o elemento e a data
        const processosComData = processos.map(a => {

            let dataTexto = '';
            const meta = a.querySelector('.col-metadados-custom');

            if (meta) {
                const match = meta.textContent.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/);

                if (match) {
                    dataTexto = match[0];
                }
            }

            const data = dataTexto ? parseDate(dataTexto) : null;

            return {
                elemento: a,
                data: data
            };

        });
        // Ordena com base no estado de 'ordemAtual'
        processosComData.sort((a, b) => {

            const timeA = a.data ? a.data.getTime() : 0;
            const timeB = b.data ? b.data.getTime() : 0;

            const diff = timeA - timeB;

            return ordemAtual === 'asc' ? diff : -diff;
        });

        // **REMOÇÃO CRÍTICA:** REMOVEMOS O DISCONNECT/OBSERVE DAQUI.
        // O Observer agora só é reativado se houver uma mutação relevante.
        // Se houver loop aqui, a solução do "containerProcessado" na função chamadora irá parar.

        // Re-insere os elementos no container na nova ordem
        processosComData.forEach(item => container.appendChild(item.elemento));

        applyAllTags();
        if (isHomepage && processosComData.length > 0) {
            const primeiroProcesso = processosComData[0].elemento;

            // Remove qualquer estilo de margem anterior de todos os itens (limpeza)
            processosComData.forEach(item => {
                item.elemento.style.marginTop = '';
            });

            // Aplica a margem superior de 40px ao primeiro item
            primeiroProcesso.style.marginTop = '40px';
            //console.log('✨ Ajuste visual: Margem de 40px aplicada ao primeiro processo da Homepage.');
        }
        console.log(`✅ ${processosComData.length} processos reordenados. Ordem: ${ordemAtual}.`);
        showToast('success', `Processos reordenados. Ordem: ${ordemAtual}.`);
    }

    function adicionarBotao() {

        const isFolderPage = isPastaUrl();
        const isHomepage = isPastaUrl2(); // Homepage é quando não é uma página de pasta.
        
        // 1. Verifica as configurações para o contexto e, se desativado, retorna
        if (isFolderPage && !currentSettings.sortFolders) {
            console.log('Ordenação de Pastas desativada nas configurações. Ignorando.');
            return;
        }
        if (isHomepage && !currentSettings.sortHomepage)  {
            console.log('Ordenação da Homepage desativada nas configurações. Ignorando.');
            return;
        }

        // Procura o local onde o botão será inserido (o btn-group dentro da paginação)
        const btnGroup = document.querySelector('.pd-inbox-header .pd-pagination .btn-group');
        if (!btnGroup) {
            return;
        }

       // Remove QUALQUER paginação duplicada ANTES de criar o botão
 // --- MUDANÇA CRUCIAL AQUI: Usa querySelectorAll para pegar todos ---
        const allPagination = document.querySelectorAll('.pd-inbox-header .pd-pagination');

        // 2. Determina qual é o contêiner "Principal" e qual deve ser ocultado
        let pdPagination = null;

        if (allPagination.length > 0) {
            // Assume que queremos usar o PRIMEIRO contêiner encontrado
            pdPagination = allPagination[0];

            // Oculta todos os outros contêineres de paginação, se existirem
            for (let i = 1; i < allPagination.length; i++) {
                // Oculta o contêiner de forma suave
                allPagination[i].style.display = 'none';
                console.log(`❌ Contêiner de Paginação adicional ocultado (Índice ${i}).`);
            }
        }

        // Se o botão já foi adicionado, não precisa recriar
        if (document.getElementById('btn-ordenar-data')) {
            return;
        }

        if (!pdPagination) {
            return;
        }

        // --- MUDANÇA CRUCIAL AQUI: Limpa todo o conteúdo existente do btn-group ---
        // Isso é necessário porque o site pode injetar botões de paginação aqui.
        btnGroup.innerHTML = '';
        // --------------------------------------------------------------------------

        // Cria o botão
        const botao = document.createElement('a');
        botao.id = 'btn-ordenar-data';
        botao.className = 'btn btn-default text-dark bg-white';
        botao.title = 'Ordenar por data de recebimento';
        // Conteúdo inicial (define o estado inicial como Mais Recentes)
        botao.innerHTML = '<i class="fa fa-sort" aria-hidden="true"></i> <div class="filter-option-inner-inner" style="display: inline-block;">Mais Recentes Primeiro</div>';

        // Adiciona o evento de clique ao botão
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            // Alterna a ordem: se era 'desc' (mais recente), vira 'asc' (mais antigo), e vice-versa
            ordemAtual = (ordemAtual === 'desc') ? 'asc' : 'desc';

            // Executa a ordenação
            hasSortedHomepage = false;
            applyAllTags();
            ordenarProcessosExt();

            // Atualiza o texto do botão para mostrar a nova ordem
            const textoBotao = botao.querySelector('.filter-option-inner-inner');
            if (ordemAtual === 'asc') {
                textoBotao.textContent = 'Mais Antigos Primeiro';
            } else {
                textoBotao.textContent = 'Mais Recentes Primeiro';
            }
        });

        // Insere o novo botão no contêiner agora vazio
        btnGroup.appendChild(botao);
        console.log('🔘 Botão de ordenação adicionado.');
    }


    function removeAllTags(idProcesso, processTags) {

    // 🔒 Clona para evitar efeitos colaterais
        const updatedTags = { ...processTags };
        const keysToRemove = [];

    // 1️⃣ Remove TODAS as tags do processo
        Object.keys(updatedTags).forEach(tagInstanceId => {
            if (
                tagInstanceId.startsWith(idProcesso + '-') ||
                tagInstanceId.startsWith(idProcesso + '_')
                ) {
                keysToRemove.push(tagInstanceId);
            delete updatedTags[tagInstanceId];
        }
    });

        if (keysToRemove.length === 0) return;

    // 2️⃣ Remove também os dados do card (prazo, descrição, board, histórico)
        chrome.storage.local.get(['processData'], (result) => {
            const processData = result.processData || {};

            if (processData[idProcesso]) {
                delete processData[idProcesso];
            }

        // 3️⃣ Salva tudo limpo
            chrome.storage.local.set({
                processTags: updatedTags,
                processData
            });
        });
    }



    // =========================================================================
    // LÓGICA DE REMOÇÃO DE TAGS NA PÁGINA DE DETALHES (COM CONDIÇÃO DE DESTINO)
    // =========================================================================

    /**
     * Verifica o destino atual na página de detalhes e, se não for o destino excluído,
     * dispara o alerta para remoção de tags do processo.
     */
    function checkAndPromptTagRemovalOnDetail() {
    // 1. Verifica se estamos na URL correta (Página de Detalhes do Processo).
        const idProcesso = getProcessIdFromTramiteNovoUrl() || getProcessIdFromDetailUrl(); 
        if (!idProcesso) {
            return;
        }

    // 2. OBTÉM O DESTINO/UNIDADE ATUAL exibido na tela.
        const seEncontraEmSpan = Array.from(document.querySelectorAll('span.text-primary'))
        .find(span => span.textContent.trim() === 'Se encontra em:');

        let destinoAtual = 'Destino Desconhecido';

        if (seEncontraEmSpan) {
            const destinoSpan = seEncontraEmSpan.nextElementSibling;
            if (destinoSpan && destinoSpan.tagName === 'SPAN') {
                destinoAtual = destinoSpan.textContent.trim();
            }
        }

    // Buscamos ambos os dados no storage ao mesmo tempo para evitar múltiplos aninhamentos
        chrome.storage.local.get(['dadosPessoais', 'processTags'], (resultado) => {

        // 3. CONDIÇÃO DE EXCLUSÃO: Verifica se o destino bate
            if (resultado.dadosPessoais) {
                const destinoCapturado = resultado.dadosPessoais.destino;
                if (destinoCapturado && destinoAtual === destinoCapturado.trim()) {
                    console.log(`[Tags] Destino atual é ${destinoCapturado}. A remoção de tags é ignorada.`);
                return; // Agora este return funciona logicamente porque impede a execução do código abaixo
            }
        }

        // 4. Se o destino NÃO bateu, verifica se há tags e exibe o alerta.
        const allTags = resultado.processTags || {};

        // Verifica se existe pelo menos uma tag associada a este processo.
        const hasTags = Object.keys(allTags).some(tagInstanceId =>
            tagInstanceId.startsWith(idProcesso + '-')
            );

        if (!hasTags) {
            return;
        }

        const confirmationTitle = 'Tags Customizadas Detectadas';
        const confirmationText = `O processo ${idProcesso} possui tags customizadas. O destino atual é: ${destinoAtual}. \n\nDeseja remover TODAS as tags associadas a ele?`;
        const confirmationButtonText = 'Sim, Remover Tags';

        showConfirmation(
            confirmationTitle,
            confirmationText,
            confirmationButtonText,
            'warning'
            ).then(confirmed => {
                if (confirmed) {
                // Remove as tags do storage e da visualização
                    removeAllTags(idProcesso, allTags);

                // Notificação de sucesso após a remoção
                    const numero = allTags[Object.keys(allTags).find(k => k.startsWith(idProcesso + '-'))]?.processNumber || idProcesso;
                    showToast('success', `Todas as tags do processo ${numero} foram removidas.`);
                } else {
                // Notifica que as tags foram mantidas.
                    showToast('info', `As tags do processo ${idProcesso} foram mantidas.`);
                }
            });
        });
    }


    /**
     * Extrai o ID do processo da URL de Novo Trâmite.
     * @returns {string|null} O ID do processo ou null.
     */
    function getProcessIdFromTramiteNovoUrl() {
        const url = window.location.href;
        // Regex para capturar o número após 'processo='
        const match = url.match(/processo=(\d+)/i);
        return match ? match[1] : null;
    }


    // =========================================================================
    // LÓGICA DE TAGS NA PÁGINA DE DETALHES DO PROCESSO (Omitida por brevidade)
    // =========================================================================

    async function initializeProcessoDetailTags() {
        if (!currentSettings.showTags || !isProcessoDetailUrl()) {
            const existingRow = document.getElementById('processo-detail-tag-container');
            if (existingRow) existingRow.remove();
            return;
        }

        const idProcesso = getProcessoIdFromUrl();
        if (!idProcesso) return;

        const requerenteSpan = document.getElementById('requerente');
        if (!requerenteSpan) return;


        const processNumber = getProcessNumber(idProcesso);




        const firstCol = requerenteSpan.closest('.col-sm-6');
        if (!firstCol) return;

        const rowParent = firstCol.parentElement;
        if (!rowParent || !rowParent.classList.contains('row') || rowParent.children.length < 2) return;



        const targetCol = rowParent.children[1];
        if (!targetCol || !targetCol.classList.contains('col-sm-6')) return;



        let existingRow = document.getElementById('processo-detail-tag-container');
        let tagsContainer = existingRow ? existingRow.querySelector(`[data-processo]`) : null;



        // O código pressupõe que 'targetCol' (o col-sm-6 à direita) e 'idProcesso' já foram definidos.
        // tagsContainer é onde você estava anexando o bloco de tags (botão) anteriormente.
        /*
        // 1. Cria a nova linha INTERNA para o Prazo e Descrição
        const innerRow = document.createElement('div');
        innerRow.className = 'row mt-2';
        innerRow.style.marginTop = '10px'; // Garante separação visual das tags

        targetCol.appendChild(innerRow);

        // 2. Cria a coluna do PRAZO (Ocupa 6/12 da largura interna)
        const prazoCol = document.createElement('div');
        prazoCol.className = 'col-sm-6'; // Alterado para col-sm-6 para ficar lado a lado
        prazoCol.id = `processo-prazo-${idProcesso}`;
        prazoCol.innerHTML = "";

        // 3. Cria a coluna da DESCRIÇÃO (Ocupa os outros 6/12 da largura interna)
        const descCol = document.createElement('div');
        descCol.className = 'col-sm-6 '; // Alterado para col-sm-6 para ficar lado a lado
        descCol.id = `processo-descricao-${idProcesso}`;
        descCol.innerHTML = "";

        innerRow.appendChild(prazoCol);
        innerRow.appendChild(descCol);

        // --- IMPORTANTE: adiciona fora da div das tags ---
        targetCol.appendChild(innerRow);
        */
        // Carregar conteúdo
        loadExtraKanbanData(idProcesso);

        if (!tagsContainer) {

            const tagRow = document.createElement('div');
            tagRow.id = 'processo-detail-tag-container';
            tagRow.className = 'row form-group';

            tagsContainer = document.createElement('div');
            tagsContainer.id = `tags-container-processo-${idProcesso}`;
            tagsContainer.setAttribute('data-processo', idProcesso);
            tagsContainer.className = 'col-sm-12';

            tagsContainer.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; min-height: 28px; padding-left: 0; margin-top: 25px;';

            const titleSpan = document.createElement('span');
            
            titleSpan.className = 'text-info';

            titleSpan.textContent = '';
            tagsContainer.appendChild(titleSpan);

            // NOVO: Botão de Tags para página de detalhes
            const contextButton = document.createElement('button');
            contextButton.style.cssText = 'background:none; border:none; cursor:pointer; padding:0 5px; margin-left:10px; font-size:18px; line-height:1;';
            contextButton.innerHTML = `<i class="fa fa-tags fa-2x text-muted" aria-hidden="true"></i>`;
            contextButton.title = 'Tags (Clique Esquerdo: Adicionar Rápido / Botão Direito: Gerenciar)';

            // NOVO: Clique Esquerdo (abre o popup de adição rápida)
            contextButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                // Na página de detalhes, clique normal abre o popup de adição rápida
                chrome.storage.local.set({
                    lastProcessId: idProcesso
                }, () => {
                    chrome.runtime.sendMessage({
                        action: 'openPopupWithProcess',
                        processId: idProcesso,
                        processNumber: processNumber
                    });
                });
            });

            // NOVO: Botão Direito (abre o Tag Manager Avançado, conforme pedido)
            contextButton.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                // Na página de detalhes, SEMPRE abre o Tag Manager Avançado
                chrome.runtime.sendMessage({
                    action: 'openTagManager',
                    processId: idProcesso,
                    processNumber: processNumber
                });
            });

            tagsContainer.appendChild(contextButton);

            tagRow.appendChild(tagsContainer);
            targetCol.appendChild(tagRow);

            // NOVO: Adiciona listener de contexto no container para abrir o Tag Manager 
            tagsContainer.addEventListener('contextmenu', (event) => {
                if (event.target !== contextButton && !event.target.closest('.tag')) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    chrome.runtime.sendMessage({
                        action: 'openTagManager',
                        processId: idProcesso,
                        processNumber: processNumber
                    });
                }
            });



        } else {
            tagsContainer.setAttribute('data-processo', idProcesso);
        }

        applyAllTags();

        console.log('Adicionando paginação');
// Função interna para executar a clonagem
 // --- LÓGICA DE PAGINAÇÃO REFORÇADA ---
        const clonarPaginacao = () => {
            const destino = document.getElementById('documentos-processo-interno') || document.getElementById('documentos-processo');
            const original = document.querySelector('.paginacao-simples:not(#paginacao-clonada-footer)');

            if (!destino || !original) return;

            const textoAtual = original.innerText;
            const cloneExistente = document.getElementById('paginacao-clonada-footer');

            if (!cloneExistente || cloneExistente.dataset.originalText !== textoAtual) {
                cloneExistente?.remove();

                const clone = original.cloneNode(true);
                clone.id = 'paginacao-clonada-footer';
                clone.classList.add('justify-content-end');
                clone.dataset.originalText = textoAtual;

            // CSS AJUSTADO PARA ALINHAMENTO À DIREITA
                clone.style.cssText = `
                margin-top: 25px !important;
                border-top: 1px solid #ddd !important;
                padding-top: 15px !important;
                display: flex !important;
                justify-content: flex-end !important;
                align-items: center !important;
                gap: 10px !important;
                width: 100% !important;
                clear: both !important;
                `;

                destino.appendChild(clone);

            // Sincroniza cliques
                clone.querySelectorAll('a[page-documento-processo]').forEach((btn, idx) => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        const originais = document.querySelectorAll('.paginacao-simples:not(#paginacao-clonada-footer) a[page-documento-processo]');
                        if (originais[idx]) originais[idx].click();
                    };
                });
            }
        };

    // Mantemos os gatilhos de atualização
        const paginacaoInterval = setInterval(clonarPaginacao, 1000);
        setTimeout(() => clearInterval(paginacaoInterval), 10000);

        const containerParaObservar = document.getElementById('documentos-processo') || document.body;
        if (containerParaObservar && !containerParaObservar.dataset.observerPaginacaoSet) {
            const observer = new MutationObserver(() => clonarPaginacao());
            observer.observe(containerParaObservar, { childList: true, subtree: true, characterData: true });
            containerParaObservar.dataset.observerPaginacaoSet = "true";
        }

    }

    /*
     // 🔹 NOVO: bloco do PRAZO
            const prazoRow = document.createElement('div');
            prazoRow.className = 'row mt-2';

            const prazoCol = document.createElement('div');
            prazoCol.className = 'col-12';
            prazoCol.id = `processo-prazo-${idProcesso}`;
            prazoCol.innerHTML = ""; // preenchido depois

            prazoRow.appendChild(prazoCol);
            tagsContainer.appendChild(prazoRow);

            // 🔹 NOVO: bloco da DESCRIÇÃO
            const descRow = document.createElement('div');
            descRow.className = 'row mt-2';

            const descCol = document.createElement('div');
            descCol.className = 'col-12';
            descCol.id = `processo-descricao-${idProcesso}`;
            descCol.innerHTML = ""; // preenchido depois

            descRow.appendChild(descCol);
            tagsContainer.appendChild(descRow);

            tagRow.appendChild(tagsContainer);
            targetCol.appendChild(tagRow);

            // carregar dados extras
            loadExtraKanbanData(idProcesso);
            */




    function adicionarBotaoKanban() {

        if (!isProcessoDigital()) {
            return;
        }
        const menuSuperior = document.querySelector("#_pg-icon-menu");
        const menuLateral = document.querySelector("#_pg-icon-navmenu");

        const menus = [menuSuperior, menuLateral];

        menus.forEach(menu => {
            if (!menu) return;

            // evita inserir repetido
            if (menu.querySelector(".menu-kanban-item")) return;

            const li = document.createElement("li");
            li.classList.add("dropdown");

            li.innerHTML = `
            <a href="${kanbanUrl}" target="_blank" title="Kanban" class='dropdown-toggle' id="item-menu-parâmetros">
            <img src="${kanbanImg}" style="width: 64px; height: 64px; margin-bottom: 5px;">
            <span class="text-primary fw-bold">Kanban</span>
            </a>
            `;

            menu.appendChild(li);

            console.log("✔ Kanban adicionado no menu:", menu.id);
        });
    }

    function adicionarBotaoAssinador() {

        chrome.storage.local.get(['dadosPessoais', 'processTags'], (resultado) => {

            if(resultado.dadosPessoais != EXPEDIENTE){
                return;
            }

        });


        if (!isProcessoDigital()) {
            return;
        }


        const menuSuperior = document.querySelector("#_pg-icon-menu");
        const menuLateral = document.querySelector("#_pg-icon-navmenu");

        const menus = [menuSuperior, menuLateral];

        menus.forEach(menu => {
            if (!menu) return;

            // evita inserir repetido
            if (menu.querySelector(".menu-assinador-item")) return;

            const li = document.createElement("li");
            li.classList.add("dropdown");

            li.innerHTML = `
            <a href="${assinadorUrl}" target="_blank" title="Assinador" class='dropdown-toggle' id="item-menu-parâmetros">
            <img src="${assinadorImg}" style="width: 64px; height: 64px; margin-bottom: 5px;">
            <span class="text-primary fw-bold">Assinador</span>
            </a>
            `;

            menu.appendChild(li);

            console.log("✔ Assinador adicionado no menu:", menu.id);
        });
    }




    


    function esperarMenuEAdicionarKanban() {
    // >> OTIMIZAÇÃO: Tenta encontrar o menu IMEDIATAMENTE <<
        const menuSuperior = document.querySelector("#_pg-icon-menu");
        const menuLateral = document.querySelector("#_pg-icon-navmenu");

        if (menuSuperior || menuLateral) {
        // ✅ SUCESSO! O menu já estava pronto, adicionamos e SAÍMOS.
            adicionarBotaoKanban();
            adicionarBotaoAssinador();
            return;
        }

    // ⬇️ FALLBACK: Se não encontrou de imediato, configura o observador
        const observer = new MutationObserver((mutationsList, obs) => {
        // O MutationObserver precisa buscar novamente a cada mudança
            const mSuperior = document.querySelector("#_pg-icon-menu");
            const mLateral = document.querySelector("#_pg-icon-navmenu");

            if (mSuperior || mLateral) {
                adicionarBotaoKanban();
                adicionarBotaoAssinador();
            obs.disconnect(); // Usa o 'obs' passado no callback
        }
    });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }




    function loadExtraKanbanData(idProcesso) {
    // 1. Tenta buscar os elementos na tela
    let divPrazo = document.getElementById(`processo-prazo-${idProcesso}`);
    let divDescricao = document.getElementById(`processo-descricao-${idProcesso}`);

    chrome.storage.local.get('processData', (result) => {
        const processData = result.processData || {};
        const processo = processData[idProcesso] || {};
        
        const dataPrazoRaw = processo.dataPrazo || '';
        const descricaoRaw = processo.description || '';

        // Formata a data ISO (2026-06-20) para o padrão BR (20/06/2026)
        const dataFormatada = dataPrazoRaw && dataPrazoRaw.includes('-') 
            ? dataPrazoRaw.split('-').reverse().join('/') 
            : dataPrazoRaw;

        // SE JÁ EXISTIREM NA TELA: Apenas atualiza o conteúdo interno (Evita Duplicação)
        if (divPrazo && divDescricao) {
            divPrazo.innerHTML = `
                <i class="fa fa-calendar fa-2x text-muted"></i>
                <span class="ms-2"><strong>Prazo:</strong> ${dataFormatada || 'Não definido'}</span>
            `;
            divDescricao.innerHTML = `
                <i class="fa fa-quote-left fa-2x text-muted"></i>
                <span class="ms-2">${descricaoRaw || 'Sem comentários'}</span>
            `;
            return; // Para a execução aqui pois já atualizou
        }

        // SE NÃO EXISTIREM NA TELA: Vamos criar a estrutura completa pela primeira vez
        // Procura o container de tags para injetar logo abaixo dele
        const tagContainer = document.getElementById('processo-detail-tag-container');
        if (!tagContainer) return; // Se não achar o ponto de inserção do próprio site, cancela

        // Cria a linha principal (row) para as informações extras do Kanban
        const rowExtra = document.createElement('div');
        rowExtra.className = 'row mt-2';
        
        rowExtra.innerHTML = `
            <div class="col-sm-12 mb-3">
                <div class="row">
                    <div class="col-sm-6" id="processo-prazo-${idProcesso}">
                        <i class="fa fa-calendar fa-2x text-muted"></i>
                        <span class="ms-2"><strong>Prazo:</strong> ${dataFormatada || 'Não definido'}</span>
                    </div>
                    <div class="col-sm-6" id="processo-descricao-${idProcesso}">
                        <i class="fa fa-quote-left fa-2x text-muted"></i>
                        <span class="ms-2">${descricaoRaw || 'Sem comentários'}</span>
                    </div>
                </div>
            </div>
        `;

        // Injeta na página logo após o bloco de tags do processo
        tagContainer.parentElement.appendChild(rowExtra);
    });
}




    // =========================================================================
    // LÓGICA DE TAGS (APLICAR) (Omitida por brevidade)
    // =========================================================================

    function applyTagToPage(tagInstanceId, data) {
        const idBase = tagInstanceId.split('-')[0];

        if (!currentSettings.showTags) {
            const detailContainer = document.getElementById(`tags-container-processo-${idBase}`);
            if (detailContainer) {
                Array.from(detailContainer.querySelectorAll('.tag')).forEach(t => t.remove());
            }

            const el = document.querySelector('[data-processo="' + idBase + '"]');
            if (el) {
                let area = el.querySelector('div[name="areasituacao"]');

                if (!area) {
                    const parent = el.closest('a') || el.parentElement;
                    if (parent) area = parent.querySelector('div[name="areasituacao"]');
                }
                if (area) {
                    const tagsContainer = area.querySelector('.tag-container');
                    if (tagsContainer) tagsContainer.remove();
                }
            }
            return;
        }

        let tagsContainer = document.getElementById(`tags-container-processo-${idBase}`);
        let isDetailPage = !!tagsContainer;

        if (!isDetailPage) {
            const el = document.querySelector('[data-processo="' + idBase + '"]');
            if (!el) return;

            let area = el.querySelector('div[name="areasituacao"]');
            if (!area) {
                const parent = el.closest('a') || el.parentElement;
                if (parent) area = parent.querySelector('div[name="areasituacao"]');
            }
            if (!area) return;

            area.querySelectorAll('span').forEach(span => {
                if (!span.classList.contains('tag-container')) {
                    span.style.marginRight = '5px';
                    span.classList.add('tags');
                }
            });
            area.querySelectorAll('b').forEach(b => {
                if (!b.classList.contains('tag-container')) {
                    b.style.marginRight = '5px';
                }
            });

            tagsContainer = area.querySelector('.tag-container');
            if (!tagsContainer) {
                tagsContainer = document.createElement('span');
                tagsContainer.className = 'tag-container';
                tagsContainer.style.cssText = 'display: contents;';
                area.appendChild(tagsContainer);

                area.style.display = 'flex';
                area.style.alignItems = 'center';
                area.style.flexWrap = 'wrap';
            }
        }

        if (!tagsContainer) return;

        let existing = tagsContainer.querySelector(`div[data-ytag-id="${tagInstanceId}"]`);

        if (!data) {
            if (existing) existing.remove();
            if (!isDetailPage && tagsContainer.children.length === 0 && tagsContainer.parentElement) {
                tagsContainer.remove();
            }
            return;
        }

        if (!existing) {
            existing = document.createElement('div');
            existing.setAttribute('data-ytag-id', tagInstanceId);
            existing.className = 'tag';
            tagsContainer.appendChild(existing);
        }

        // Estilização para o item da lista ou detalhe (visualização solicitada)
        let colortext = '';
        
        if(isColorLight(data.color)){
            colortext = "#3B3B3B";
        }else{
            colortext = "#f1f1f1";
        }

        existing.style.cssText = `background-color:${data.color}; color: ${colortext}; border-radius:4px; padding:2px 8px; margin-left:5px; margin-top: 2px; margin-bottom: 2px; font-size: 11px;`;
        existing.setAttribute('data-toggle', 'popover');
        existing.setAttribute('data-original-title', `${escapeHtml(data.name)}`);
        existing.innerHTML = `<span class='tags'>${escapeHtml(data.name)}</span>`;
    }

    async function applyAllTags() {

        if (!currentSettings.showTags) return;

        isApplyingTags = true;

        const processos = [...document.querySelectorAll('.pd-inbox-item')];

        for (const item of processos) {
            reestruturarLayoutProcesso(item);

            const areaSituacao = item.querySelector('div[name="areasituacao"]');
            if (!areaSituacao) continue;

            let tagContainer = areaSituacao.querySelector('.tag-container');

            if (!tagContainer) {
                tagContainer = document.createElement('div');
                tagContainer.className = 'tag-container';
                tagContainer.style.display = 'inline-flex';
                tagContainer.style.gap = '4px';
                tagContainer.style.marginLeft = '5px';
                areaSituacao.appendChild(tagContainer);
            }
        }

        chrome.storage.local.get('processTags', ({ processTags }) => {
            processTags = processTags || {};
            Object.keys(processTags).forEach(tagInstanceId => {
                applyTagToPage(tagInstanceId, processTags[tagInstanceId]);
            });

            isApplyingTags = false;
        });
    }

    async function reestruturarLayoutProcesso(item) {
        const areaSituacao = item.querySelector('div[name="areasituacao"]');
        if (!areaSituacao) return;

    // 1. Ajusta a áreasituação para alinhar tudo à ESQUERDA (Situação + Tags)
        areaSituacao.classList.remove('pull-right');
        Object.assign(areaSituacao.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '0px'
        });

    // 2. Filtra os metadados e REMOVE o hífen indesejado
        const nodes = Array.from(areaSituacao.childNodes);
        const metadadosParaMover = nodes.filter(node => {
            const isSituacao = node.nodeType === 1 && node.classList.contains('situacao-caixa-entrada');
            const isTagContainer = node.nodeType === 1 && node.classList.contains('tag-container');

        // --- NOVO: Lógica para identificar e remover o hífen ---
            const isHifen = (node.nodeType === 1 && node.textContent.trim() === '-') || 
            (node.nodeType === 3 && node.textContent.trim() === '-');

            if (isHifen) {
            node.remove(); // Remove o elemento do DOM permanentemente
            return false;
        }

        return !isSituacao && !isTagContainer;
    });

        if (metadadosParaMover.length === 0) return;

    // 3. Localiza o ponto de inserção
        const colRequerente = item.querySelector('.col-sm-8.cxEntrada');
        if (colRequerente) {
            let novaCol = item.querySelector('.col-metadados-custom');
            if (!novaCol) {
                novaCol = document.createElement('div');
                novaCol.className = 'col-sm-4 col-metadados-custom';

                Object.assign(novaCol.style, {
                    fontSize: '11px',
                    color: '#666',
                textAlign: 'right', // Alinha o texto à direita
                float: 'right',     // Flutua a div para a direita
                marginTop: '2px'
            });

                colRequerente.parentNode.insertBefore(novaCol, colRequerente.nextSibling);
            }
            metadadosParaMover.forEach(node => novaCol.appendChild(node));
        }
    }



    function toggleTag(idProcesso, tagName, tagColor) {

        chrome.storage.local.get(
          ['processTags', 'predefinedTags'],
          (result) => {

            const processTags = result.processTags || {};
            const predefinedTags = result.predefinedTags || [];

        // Número do processo
            let processNumber = null;
            const processoEl = document.querySelector(`[data-processo="${idProcesso}"]`);
            if (processoEl) {
                processNumber = getProcessNumber(processoEl);
            }
            processNumber = processNumber || idProcesso;

        // Descobre se a tag já existe
            let tagInstanceIdToRemove = null;

            Object.keys(processTags).forEach(tagInstanceId => {
                if (
                  tagInstanceId.startsWith(idProcesso + '-') &&
                  processTags[tagInstanceId].name === tagName
                  ) {
                    tagInstanceIdToRemove = tagInstanceId;
            }
        });

        // ================= REMOVER =================
            if (tagInstanceIdToRemove) {

                delete processTags[tagInstanceIdToRemove];

                chrome.storage.local.set({ processTags }, () => {
                    chrome.runtime.sendMessage({
                        action: 'updateTag',
                        processoIdInstance: tagInstanceIdToRemove,
                        nome: null,
                        cor: null
                    });
                });

                return;
            }

        // ================= ADICIONAR =================

            const predefined = predefinedTags.find(t => t.name === tagName);
            const isBoardTag = predefined?.showOnBoard === true;

            const newTagInstanceId = `${idProcesso}-${Date.now()}`;

            processTags[newTagInstanceId] = {
                processId: idProcesso,
                name: tagName,
                color: tagColor,
                processNumber,
            isBoardTag   // ✅ agora correto
        };

        chrome.storage.local.set({ processTags }, () => {
            chrome.runtime.sendMessage({
                action: 'addTagToProcess',
                processoIdInstance: newTagInstanceId,
                nome: tagName,
                cor: tagColor,
                processNumber
            });
        });
    });
    }


    // =========================================================================
    // LÓGICA DE INTERFACE (Menus) - CORRIGIDA
    // =========================================================================

    // --- Versão SIMPLES do Menu (Apenas atalhos para Popup e Tag Manager) ---
    function loadMenuContentSimples(idProcesso, processTags, processNumber) {
        tagMenu.innerHTML = '';

        // 1. Título
        const title = document.createElement('div');
        title.textContent = 'Processo: ' + idProcesso;
        // O estilo usa as configurações definidas no tagMenu
        title.style.cssText = 'font-size: 12px; margin-bottom: 6px; color: #333;';
        tagMenu.appendChild(title);

        // 2. Botão Adicionar Tag (AZUL)
        const btnAdd = document.createElement('button');
        btnAdd.innerHTML = ' <i class="fa fa-tag"></i> Adicionar Tag';
        Object.assign(btnAdd.style, {
            width: '100%',
            padding: '8px 10px',
            background: '#0d6efd',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
        });

        btnAdd.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            tagMenu.style.display = 'none';
            chrome.storage.local.set({
                lastProcessId: idProcesso
            }, () => {
                // Abre o popup
                // CRÍTICO: Checagem de contexto para evitar "Extension context invalidated"
                if (chrome.runtime.lastError) {
                    console.warn("[Contexto Inválido] Não foi possível abrir o popup.");
                    return;
                }
                chrome.runtime.sendMessage({
                    action: 'openPopupWithProcess',
                    processId: idProcesso,
                    processNumber: processNumber
                });
            });
        };
        tagMenu.appendChild(btnAdd);

        // 3. Verifica se há tags existentes para mostrar as opções avançadas
        const hasExistingTags = Object.keys(processTags).some(tagInstanceId =>
            tagInstanceId.startsWith(idProcesso + '-')
            );

        if (hasExistingTags) {
            // Botão Alterar Tags (Gerenciar Avançado) (AMARELO)
            const btnAlterar = document.createElement('button');
            btnAlterar.innerHTML = ' <i class="fa fa-edit"></i> Alterar Tags';
            Object.assign(btnAlterar.style, {
                width: '100%',
                padding: '8px 10px',
                marginTop: '8px',
                background: '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
            });

            btnAlterar.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                tagMenu.style.display = 'none';

                // CRÍTICO: Checagem de contexto
                if (chrome.runtime.lastError) {
                    console.warn("[Contexto Inválido] Não foi possível abrir o Tag Manager.");
                    return;
                }
                // Abre o Tag Manager
                chrome.runtime.sendMessage({
                    action: 'openTagManager',
                    processId: idProcesso,
                    processNumber: processNumber
                });
            };
            tagMenu.appendChild(btnAlterar);

            // Botão Remover Todas as Tags (VERMELHO)
            const btnRem = document.createElement('button');
            btnRem.innerHTML = ' <i class="fa fa-trash"></i> Remover Tags (Todas)';
            Object.assign(btnRem.style, {
                width: '100%',
                padding: '8px 10px',
                marginTop: '8px',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
            });

            btnRem.onclick = function(e) {
                e.stopPropagation();
                e.preventDefault();
                tagMenu.style.display = 'none';
                let numeroProcesso = null;
                const processoEl = document.querySelector(`[data-processo="${idProcesso}"]`);
                if (processoEl) {
                    numeroProcesso = getProcessNumber(processoEl);
                }

                // Fallback: usa o ID se não encontrar número
                numeroProcesso = numeroProcesso || idProcesso;

                // ATUALIZAÇÃO: Substitui window.confirm por showConfirmation (swal.fire)
                showConfirmation(
                    'Confirmar Exclusão em Massa',
                `Tem certeza que deseja remover TODAS as tags associadas ao processo: ${numeroProcesso}? Esta ação não pode ser desfeita.`,
                'Sim, Remover TODAS!'
                ).then(confirmed => {
                    if (!confirmed) {
                        // Notifica que a ação foi cancelada
                        showToast('info', 'A remoção em massa foi cancelada.');
                        return;
                    }

                    // Lógica de remoção inline (agora dentro do .then)
                    chrome.storage.local.get('processTags', ({
                        processTags: currentProcessTags
                    }) => {

                        // CRÍTICO: Checagem de contexto no callback do storage
                        if (chrome.runtime.lastError) {
                            showToast('error', 'Falha na comunicação: Contexto da extensão inválido.');
                            return;
                        }

                        currentProcessTags = currentProcessTags || {};
                        let tagsRemoved = false;

                        Object.keys(currentProcessTags).forEach(tagInstanceId => {
                            if (tagInstanceId.startsWith(idProcesso + '-')) {
                                delete currentProcessTags[tagInstanceId];
                                // applyTagToPage remove a visualização na lista
                                applyTagToPage(tagInstanceId, null);
                                tagsRemoved = true;
                            }
                        });

                        if (tagsRemoved) {
                            chrome.storage.local.set({
                                processTags: currentProcessTags
                            }, () => {
                                // ATUALIZAÇÃO: Substitui alert() por showToast()
                                showToast('success', `Todas as tags do processo foram removidas.`);
                            });
                        } else {
                            // ATUALIZAÇÃO: Substitui alert() por showToast()
                            showToast('warning', `Nenhuma tag encontrada para o processo.`);
                        }
                    });
                });
                // Fim da lógica do btnRem.onclick
            };
            tagMenu.appendChild(btnRem);
        }
    }
    // --- Versão AVANÇADA do Menu (Com Quick Tags) ---
    function loadMenuContentAvancado(idProcesso, processTags, processNumber) {
        tagMenu.innerHTML = '';

        // SEÇÃO DE OPÇÕES PRINCIPAIS
        const mainOptionsDiv = document.createElement('div');
        mainOptionsDiv.style.marginBottom = '10px';

        const titleOptions = document.createElement('p');
        titleOptions.style.cssText = 'margin: 0 0 5px 0; font-weight: bold;';
        titleOptions.textContent = 'Opções Principais:';
        mainOptionsDiv.appendChild(titleOptions);

        const hasExistingTags = Object.keys(processTags).some(tagInstanceId =>
            tagInstanceId.startsWith(idProcesso + '-')
            );

        // =======================================================
        // 1. ADICIONAR TAG
        // =======================================================
        const addLink = document.createElement('a');
        addLink.href = '#';
        addLink.innerHTML = '<i class="fa fa-plus-circle" style="margin-right: 5px;"></i> Adicionar Tag'; // ÍCONE
        addLink.style.cssText = 'display: block; color: #198754; text-decoration: none; padding: 2px 0; font-size: 12px; font-weight: bold;';
        addLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Abre o Popup de Adição
            chrome.storage.local.set({
                lastProcessId: idProcesso
            }, () => {
                // CRÍTICO: Checagem de contexto
                if (chrome.runtime.lastError) {
                    showToast('error', 'Falha na comunicação: Contexto da extensão inválido.');
                    return;
                }
                chrome.runtime.sendMessage({
                    action: 'openPopupWithProcess',
                    processId: idProcesso,
                    processNumber: processNumber
                });
                tagMenu.style.display = 'none';
            });
        });
        mainOptionsDiv.appendChild(addLink);

        // =======================================================
        // 2. GERENCIAMENTO (OPÇÕES CONDICIONAIS)
        // =======================================================

        // A. Se já houver tags, adiciona os links de Gerenciar e Remover
        if (hasExistingTags) {

            // Link para Gerenciar Tags (para editar/excluir)
            const manageLink = document.createElement('a');
            manageLink.href = '#';
            manageLink.innerHTML = '<i class="fa fa-cogs" style="margin-right: 5px;"></i> Gerenciar Tags';
            manageLink.style.cssText = 'display: block; color: #1976d2; text-decoration: none; padding: 2px 0; font-size: 11px; margin-top: 5px;';
            manageLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Abre o Tag Manager
                // CRÍTICO: Checagem de contexto
                if (chrome.runtime.lastError) {
                    showToast('error', 'Falha na comunicação: Contexto da extensão inválido.');
                    return;
                }
                chrome.runtime.sendMessage({
                    action: 'openTagManager',
                    processId: idProcesso,
                    processNumber: processNumber
                });
                tagMenu.style.display = 'none';
            });
            mainOptionsDiv.appendChild(manageLink);

            // Link para Remover Todas as Tags
            const removeAllLink = document.createElement('a');
            removeAllLink.href = '#';
            removeAllLink.innerHTML = '<i class="fa fa-trash-o" style="margin-right: 5px;"></i>Remover Todas as Tags';
            removeAllLink.style.cssText = 'display: block; color: #dc3545; text-decoration: none; padding: 2px 0; font-size: 11px; margin-top: 5px;';

            // ATUALIZAÇÃO: Substituição de confirm() por showConfirmation()
            removeAllLink.addEventListener('click', (e) => {
                e.preventDefault();
                tagMenu.style.display = 'none';
                let numeroProcesso = null;
                const processoEl = document.querySelector(`[data-processo="${idProcesso}"]`);
                if (processoEl) {
                    numeroProcesso = getProcessNumber(processoEl);
                }

                // Fallback: usa o ID se não encontrar número
                numeroProcesso = numeroProcesso || idProcesso;

                // ATUALIZAÇÃO: Substitui window.confirm por showConfirmation (swal.fire)
                showConfirmation(
                    'Confirmar Exclusão em Massa',
                `Tem certeza que deseja remover TODAS as tags associadas ao processo: ${numeroProcesso}? Esta ação não pode ser desfeita.`,
                'Sim, Remover TODAS!'
                ).then(confirmed => {
                    if (!confirmed) {

                        showToast('info', 'A remoção em massa foi cancelada.');
                        return;
                    }

                    // Chamada à função auxiliar de remoção, que deve estar definida no content.js
                    // O `removeAllTags` DEVE se encarregar de notificar o storage e a UI.
                    removeAllTags(idProcesso, processTags);

                    let numeroProcesso = null;
                    const processoEl = document.querySelector(`[data-processo="${idProcesso}"]`);
                    if (processoEl) {
                        numeroProcesso = getProcessNumber(processoEl);
                    }

                    // Fallback: usa o ID se não encontrar número
                    numeroProcesso = numeroProcesso || idProcesso;
                    showToast('success', `Todas as tags do processo ${numeroProcesso} foram removidas.`);
                }).catch(error => {
                    // Caso haja erro na Promise (muito raro, mas garante a segurança)
                    console.error("Erro no processo de confirmação de remoção:", error);
                    showToast('error', 'Ocorreu um erro ao tentar remover as tags.');
                });

            });
            mainOptionsDiv.appendChild(removeAllLink);

        } else {
            // Se NÃO houver tags, exibe apenas a opção de Gerenciar (Fallback)
            const managerLink = document.createElement('a');
            managerLink.href = '#';
            managerLink.innerHTML = '<i class="fa fa-cogs" style="margin-right: 5px;"></i> Gerenciar Tags';
            managerLink.style.cssText = 'display: block; color: #1976d2; text-decoration: none; padding: 2px 0; font-size: 11px; margin-top: 5px;';
            managerLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Abre o Tag Manager
                // CRÍTICO: Checagem de contexto
                if (chrome.runtime.lastError) {
                    showToast('error', 'Falha na comunicação: Contexto da extensão inválido.');
                    return;
                }
                chrome.runtime.sendMessage({
                    action: 'openTagManager',
                    processId: idProcesso,
                    processNumber: processNumber
                });
                tagMenu.style.display = 'none';
            });
            mainOptionsDiv.appendChild(managerLink);
        }

        tagMenu.appendChild(mainOptionsDiv);

        const hr = document.createElement('hr');
        hr.style.cssText = 'margin: 5px 0; border-color: #eee;';
        tagMenu.appendChild(hr);

        // SEÇÃO DE QUICK TAGS
        const titleQuickTags = document.createElement('p');
        titleQuickTags.style.cssText = 'margin: 5px 0 5px 0; font-weight: bold;';
        titleQuickTags.textContent = 'Tags Rápidas:';
        tagMenu.appendChild(titleQuickTags);

        const tagsDiv = document.createElement('div');
        tagsDiv.id = 'quickTagsMenu';
        tagsDiv.textContent = 'Carregando...';
        tagMenu.appendChild(tagsDiv);

        // Renderiza as Tags Rápidas
        chrome.storage.local.get('predefinedTags', ({ predefinedTags = [] }) => {

          if (chrome.runtime.lastError) {
            console.warn("[Contexto Inválido] Falha ao buscar tags pré-definidas.");
            tagsDiv.innerHTML =
            '<p style="margin:0;color:#999;font-size:11px;">Erro ao carregar tags.</p>';
            return;
        }

        tagsDiv.innerHTML = '';

  // 🔒 1. CLONA (quebra referência com o storage/memória)
        let tags = predefinedTags.map(tag => ({
            ...tag,
    // 🔁 Compatibilidade com tags antigas (SEM mutar o original)
            showInAdvancedMenu:
            typeof tag.showInAdvancedMenu === 'boolean'
            ? tag.showInAdvancedMenu
            : true
        }));

  // 🔒 2. ORDENA SEMPRE EM CIMA DO CLONE
        tags = tags.sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });

  // 🔒 3. FILTRA DEPOIS
        tags = tags.filter(tag => tag.showInAdvancedMenu === true);

        if (tags.length === 0) {
            tagsDiv.innerHTML =
            '<p style="margin:0;color:#999;font-size:11px;">Sem tags pré-definidas.</p>';
            return;
        }

  // 🔒 4. RENDER FINAL
        tags.forEach(tag => {
            const isApplied = Object.keys(processTags).some(tagInstanceId =>
              tagInstanceId.startsWith(idProcesso + '-') &&
              processTags[tagInstanceId].name === tag.name
              );

            const tagElement = document.createElement('a');
            tagElement.href = '#';
            tagElement.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:4px 0;
      margin:2px 0;
      font-size:12px;
      text-decoration:none;
      color:${isApplied ? '#000' : '#333'};
            `;

            tagElement.innerHTML = `
      <div style="display:flex;align-items:center;">
        <span style="
          width:8px;
          height:8px;
          border-radius:50%;
          background:${tag.color};
          margin-right:8px;
        "></span>
        ${escapeHtml(tag.name)}
      </div>
      ${isApplied ? '<i class="fa fa-check" style="color:#198754"></i>' : ''}
            `;

            tagElement.addEventListener('click', e => {
              e.preventDefault();
              toggleTag(idProcesso, tag.name, tag.color);
              tagMenu.style.display = 'none';
          });

            tagsDiv.appendChild(tagElement);
        });
    });

    }

    // --- Função de Controle do Menu Flutuante (showTagMenu) ---
    function showTagMenu(event, idProcesso, processNumber) {
        chrome.storage.local.get(['processTags', 'userSettings'], ({
            processTags,
            userSettings
        }) => {
            processTags = processTags || {};
            const menuType = (userSettings && userSettings.menuType) ? userSettings.menuType : 'Simples';

            // Carrega conteúdo do menu (simples/avançado)
            if (menuType === 'Simples') {
                loadMenuContentSimples(idProcesso, processTags, processNumber);
            } else {
                loadMenuContentAvancado(idProcesso, processTags, processNumber);
            }

            // Guarda âncora do clique para reposicionar depois
            lastMenuAnchor = {
                clientX: event.clientX,
                clientY: event.clientY,
                scrollY: window.scrollY
            };

            // Exibe temporariamente fora da tela para permitir medir conteúdo carregado async
            tagMenu.style.left = '-9999px';
            tagMenu.style.top = '-9999px';
            tagMenu.style.display = 'block';
            tagMenu.style.visibility = 'hidden'; // evita flicker visível ao usuário

            // posição inicial com o tamanho atual (pode crescer depois)
            // chama com micro-tick para garantir rendering
            setTimeout(() => {
                repositionTagMenu();
                // torna visível
                tagMenu.style.visibility = 'visible';
                isMenuOpening = true;
                setTimeout(() => (isMenuOpening = false), 50);
            }, 0);

            // --- OBSERVER: ajusta a posição sempre que o menu muda de tamanho (ex: quickTags carregaram) ---
            if (menuResizeObserver) {
                try {
                    menuResizeObserver.disconnect();
                } catch (e) {
                /* ignore */ }
                    menuResizeObserver = null;
                }

                menuResizeObserver = new ResizeObserver(entries => {
                // debounce para evitar reposicionamentos múltiplos rápidos
                    if (repositionTimeout) clearTimeout(repositionTimeout);
                    repositionTimeout = setTimeout(() => {
                        repositionTagMenu();
                    }, 60);
                });

            // Observa alterações de tamanho no menu
                menuResizeObserver.observe(tagMenu);
            });
    }

    // =========================================================================
    // LÓGICA PRINCIPAL E LISTENERS
    // =========================================================================

    function initializeObserver() {
        if (observer) observer.disconnect();

        const container = document.querySelector('.pd-inbox-col-right');
        if (!container) return;

        if (isPastaUrl2()) {
            console.log('👀 Observer desativado na página principal (evita reordenação infinita).');
            return;
        }
        observer = new MutationObserver((mutationsList, observer) => {
            let shouldProcess = false;
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                    if (Array.from(mutation.addedNodes).some(node => node.className === 'tag')) continue;
                    shouldProcess = true;
                    break;
                }
            }
            if (shouldProcess) {
                applyAllTags();
                ordenarProcessosExt();
                adicionarBotao();

            }
        });

        observer.observe(container, {
            childList: true,
            subtree: false
        });
    }

    //
    //    TOAST
    //
    function fixToastPosition() {

        const toastEl = document.getElementById('toast');
        if (toastEl) {
            // Aplica a correção CSS diretamente
            let posttt = 'absolute';
            toastEl.style.position = posttt;
            // Opcional: remover os estilos conflitantes, como bottom/left/right se for o caso
            toastEl.style.bottom = 'auto';
            console.log(`✅ Posição do Toast corrigida para ${posttt}.`);
            // Após a correção, podemos parar de monitorar o toast
            if (toastObserver) {
                toastObserver.disconnect();
                toastObserver = null;
            }
        }
    }
    // Inicializa o observer do toast
    let toastObserver = new MutationObserver(function(mutationsList, observer) {
        // Tenta aplicar a correção a cada mutação (o fixToastPosition só executa uma vez)
        fixToastPosition();
    });

    function initializeFeatures() {

        const container = document.querySelector('.pd-inbox-col-right');

        //Tags        
        applyAllTags();
        //Botão Order
        adicionarBotao();
        //Ordenar Processos
        ordenarProcessosExt();
        //Observador
        initializeObserver();
        //Tipo DOc
        inicializarAutoSelecao();
        //

        // 🚧 Bloqueia a ordenação durante o arraste APENAS na página principal
        if (isPastaUrl2() && container) {
            container.addEventListener('dragstart', () => {
                isDragging = true;
                console.log('🚫 Ordenação pausada durante arraste na página principal.');
                if (ordenarTimeout) clearTimeout(ordenarTimeout); // cancela timers anteriores
            });

            container.addEventListener('dragend', () => {
                isDragging = false;
                console.log('⌛ Aguardando estabilização antes de reordenar...');
                if (ordenarTimeout) clearTimeout(ordenarTimeout);
                ordenarTimeout = setTimeout(() => {
                    console.log('✅ Reordenando após o arraste.');
                    applyAllTags();
                    ordenarProcessosExt();
                }, 1000); // 1 segundo de espera após soltar
            });
        }

        if (!container) {
            return;
        }
        
    }

    // CORREÇÃO: Inicializa currentSettings com o default correto e prioriza as settings salvas.
    function loadSettings(reInitialize = false) {
        chrome.storage.local.get(['userSettings', 'ordemAtual'], (data) => {
            const DEFAULT_SETTINGS = {
                sortHomepage: true,
                sortFolders: true,
                showTags: true,
                menuType: 'Simples'
            };
            currentSettings = {
                ...DEFAULT_SETTINGS,
                ...data.userSettings
            };
            ordemAtual = data.ordemAtual || 'asc';
            if (reInitialize) {
                initializeFeatures();
            }
        });
    }

    async function executarMovimentacaoLote(direcao) {
        cancelarOperacao = false;
        const botoesMarcados = Array.from(document.querySelectorAll('.botao-publicacao-documento.ativo'))
        .filter(btn => btn.getAttribute('data-codigo'));
        const todosOsBotoesCheck = document.querySelectorAll('.botao-publicacao-documento[data-codigo]');

        if (botoesMarcados.length === 0) return showToast('warning', 'Selecione documentos.');

    // Validação: não move se todos estiverem selecionados
        if (botoesMarcados.length === todosOsBotoesCheck.length && todosOsBotoesCheck.length > 0) {
            showToast('error', 'Todos os itens selecionados. A movimentação não alteraria a ordem.');
            return;
        }

        const ehPassoUnico = (direcao === 'cima' || direcao === 'baixo');
        if (!ehPassoUnico) {
            const confirmou = await showConfirmation('Mover Documentos', `Mover ${botoesMarcados.length} itens?`, 'Sim, iniciar');
            if (!confirmou) return;
        }

        const encerrarBloqueio = ativarBloqueioNavegacao();
        let itensProcessamento = [...botoesMarcados];
        if (direcao === 'baixo' || direcao === 'final') itensProcessamento.reverse();

        try {
            for (let i = 0; i < itensProcessamento.length; i++) {
                if (cancelarOperacao) break;

                showProgressToast('A mover documentos', i + 1, itensProcessamento.length);

                const id = itensProcessamento[i].getAttribute('data-codigo');
                let concluido = false;

                while (!concluido && !cancelarOperacao) {
                    const linha = document.querySelector(`.linha-documento-grupo[data-codigo="${id}"]`);
                    if (!linha) break;

                // SCROLL REMOVIDO DAQUI

                    const acaoBotao = (direcao === 'topo' || direcao === 'cima') ? 'cima' : 'baixo';
                    const btnAcao = linha.querySelector(`button[data-para="${acaoBotao}"]`);

                    if (!btnAcao || btnAcao.hasAttribute('disabled')) {
                        concluido = true;
                        break;
                    }

                    btnAcao.click();
                await new Promise(r => setTimeout(r, 380)); // Delay para estabilidade
                if (ehPassoUnico) concluido = true;
            }
        }
    } finally {
        encerrarBloqueio();
        Swal.close();
        if (cancelarOperacao) showToast('warning', 'Interrompido pelo utilizador.');
        else showToast('success', 'Concluído!');
    }
}

async function organizarLoteAZ() {
    cancelarOperacao = false;
    
    // 1. Obtém apenas os botões marcados que possuem código de documento
    const botoesMarcados = Array.from(document.querySelectorAll('.botao-publicacao-documento.ativo'))
    .filter(btn => btn.getAttribute('data-codigo'));

    // --- VALIDAÇÃO: Precisa de pelo menos dois para ordenar ---
    if (botoesMarcados.length < 2) {
        showToast('warning', 'Selecione pelo menos 2 documentos para organizar de A a Z.');
        return;
    }

    const confirmou = await showConfirmation(
        'Organizar Selecionados', 
    `Deseja ordenar alfabeticamente apenas os ${botoesMarcados.length} documentos selecionados?`, 
    'Sim, organizar'
    );
    if (!confirmou) return;

    const encerrarBloqueio = ativarBloqueioNavegacao();
    
    try {
        let houveMudanca = true;
        
        while (houveMudanca && !cancelarOperacao) {
            houveMudanca = false;
            
            // Recalcula a lista de linhas atuais para refletir as mudanças no DOM
            const todasAsLinhas = Array.from(document.querySelectorAll('.linha-documento-grupo'));
            
            // Filtra para encontrar as linhas que pertencem ao lote selecionado
            const linhasSelecionadas = todasAsLinhas.filter(linha => {
                const btn = linha.querySelector('.botao-publicacao-documento');
                return btn && btn.classList.contains('ativo');
            });

            // Cálculo de progresso para o Toast
            let paresErrados = 0;
            for (let i = 0; i < linhasSelecionadas.length - 1; i++) {
                if (linhasSelecionadas[i].innerText.trim().toUpperCase() > linhasSelecionadas[i+1].innerText.trim().toUpperCase()) {
                    paresErrados++;
                }
            }

            if (paresErrados === 0) break; // Tudo ordenado!

            const progresso = linhasSelecionadas.length - paresErrados;
            showProgressToast('Organizando Selecionados (A-Z)', progresso, linhasSelecionadas.length);

            // Bubble sort aplicado apenas aos elementos do subconjunto selecionado
            for (let i = 0; i < linhasSelecionadas.length - 1; i++) {
                if (cancelarOperacao) break;

                const nomeA = linhasSelecionadas[i].innerText.trim().toUpperCase();
                const nomeB = linhasSelecionadas[i + 1].innerText.trim().toUpperCase();

                if (nomeA > nomeB) {
                    // Se o de cima é "maior" que o de baixo, ele precisa descer
                    const btnDescer = linhasSelecionadas[i].querySelector('button[data-para="baixo"]');
                    
                    if (btnDescer && !btnDescer.hasAttribute('disabled')) {
                        btnDescer.click();
                        houveMudanca = true;
                        // Aguarda o sistema processar a troca de posição
                        await new Promise(r => setTimeout(r, 200));
                        break; // Reinicia a verificação após o movimento
                    }
                }
            }
        }
    } finally {
        encerrarBloqueio();
        Swal.close();
        if (!cancelarOperacao) showToast('success', 'Documentos selecionados organizados!');
    }
}


let cancelarOperacao = false; // Flag global para interromper processos
// Impede fechar a aba ou atualizar
function ativarBloqueioNavegacao() {
    const avisoCuidado = (e) => {
        if (!cancelarOperacao) {
            e.preventDefault();
            e.returnValue = 'Operação em curso. Deseja realmente sair?';
            return e.returnValue;
        }
    };
    window.addEventListener('beforeunload', avisoCuidado);
    return () => window.removeEventListener('beforeunload', avisoCuidado);
}

// Certifique-se que sua função showToast aceite um tempo (duration)
// Se duration for 0, o toast não deve sumir automaticamente (depende da sua biblioteca de toast)
// Exemplo genérico se usar SweetAlert para toast:
function showToast(icon, title, duration = 3000) {
    Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: duration || null, // Se for 0, o timer é anulado
        timerProgressBar: !!duration,
    }).fire({ icon, title });
}

function showProgressToast(titulo, progresso, total) {
    const percentual = total > 0 ? Math.round((progresso / total) * 100) : 0;
    const mensagem = total > 1 ? `Item ${progresso} de ${total}` : 'A processar...';

    // Configurações comuns para evitar repetição
    const configHtml = `
        <div style="margin-bottom: 10px;">${mensagem}</div>
        <div style="width: 100%; background: #eee; border-radius: 10px; overflow: hidden; height: 10px;">
            <div style="width: ${percentual}%; background: #28a745; height: 100%; transition: width 0.3s;"></div>
        </div>
        <button id="btn-stop-op" class="btn btn-xs btn-danger" style="margin-top: 15px; font-weight: bold; padding: 5px 10px;">
            <i class="fa fa-stop"></i> PARAR
        </button>
    `;

    if (Swal.isVisible() && Swal.getPopup().classList.contains('swal2-toast')) {
        Swal.update({
            title: titulo,
            html: configHtml
        });
        
        // Reatribui o evento do botão de parar
        const btnStop = document.getElementById('btn-stop-op');
        if (btnStop) {
            btnStop.onclick = () => {
                cancelarOperacao = true;
                btnStop.innerText = "A parar...";
                btnStop.disabled = true;
            };
        }
    } else {
        Swal.fire({
            title: titulo,
            html: configHtml,
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: false,
            // REMOVE AS ANIMAÇÕES AQUI
            showClass: {
                popup: '', // Sem animação de entrada
                backdrop: ''
            },
            hideClass: {
                popup: '', // Sem animação de saída
            },
            didOpen: () => {
                const btnStop = document.getElementById('btn-stop-op');
                if (btnStop) {
                    btnStop.onclick = () => {
                        cancelarOperacao = true;
                        btnStop.innerText = "A parar...";
                        btnStop.disabled = true;
                    };
                }
            }
        });
    }
}

// =========================================================================
// CSS REVISADO
// =========================================================================
const styleOrdem = document.createElement('style');
styleOrdem.innerHTML = `
    #btnJuntadaBaixo { display: none !important; visibility: hidden !important; }
    .meu-menu-flutuante {
        position: fixed !important;
        top: 10px !important;
        right: 20px !important;
        z-index: 2147483640 !important;
        background: white !important;
        padding: 8px !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
        border: 1px solid #ccc !important;
        display: flex !important;
        gap: 4px !important;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-in-out;
    }
    .meu-menu-flutuante.ativo {
        opacity: 1;
        pointer-events: auto;
    }
    /* Classe para esconder o menu via CSS quando o PDF abre */
    body.visualizador-pdf-aberto .meu-menu-flutuante { display: none !important; }
`;
document.head.appendChild(styleOrdem);

// =========================================================================
// FUNÇÃO DE INJEÇÃO COM FILTRO DE PÁGINA (#dg922)
// =========================================================================
function injetarBotoesMoverLote() {
    // 1. FILTRO DE SEGURANÇA: Só executa se a URL contiver #dg922
    // Se quiser permitir em outras, basta adicionar no IF
    if (!window.location.hash.includes('#dg922')) {
        // Se o menu existir e estivermos na página errada (#dp), removemos
        document.getElementById('grupo-ordenacao-flutuante')?.remove();
        document.getElementById('grupo-ordenacao-estatico')?.remove();
        return;
    }


    const btnExcluir = document.querySelector('a[data-toggle="remover-selecionados"]');
    if (!btnExcluir || document.getElementById('grupo-ordenacao-estatico')) return;

    // 2. CONFIGURAÇÃO DOS BOTÕES NO RODAPÉ
    btnExcluir.classList.add('pull-left', 'ms-2');

    const menuEstatico = criarTemplateBotoes('grupo-ordenacao-estatico');
    menuEstatico.classList.add('pull-right', 'me-2'); 
    btnExcluir.after(menuEstatico);

    // 3. MENU FLUTUANTE
    let menuFlutuante = document.getElementById('grupo-ordenacao-flutuante');
    if (!menuFlutuante) {
        menuFlutuante = criarTemplateBotoes('grupo-ordenacao-flutuante');
        menuFlutuante.classList.add('meu-menu-flutuante');
        document.body.appendChild(menuFlutuante);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const flutuante = document.getElementById('grupo-ordenacao-flutuante');
            const estatico = document.getElementById('grupo-ordenacao-estatico');
            if (!flutuante || !estatico) return;

            const atualizarVisibilidade = () => {
                // Se mudou de página via AJAX/Hash para uma que não seja #dg922, aborta
                if (!window.location.hash.includes('#dg922')) {
                    flutuante.classList.remove('ativo');
                    estatico.style.display = 'none';
                    return;
                }

                const temSelecao = document.querySelector('.botao-publicacao-documento.ativo') !== null;
                const estaForaDeVisao = !entry.isIntersecting;
                const scrollSuficiente = window.scrollY > 200;
                const visualizadorAberto = document.querySelector('.pd-painel-visualizador:not([style*="display: none"])') !== null;

                // Controle Estático (Rodapé)
                estatico.style.display = temSelecao ? 'inline-flex' : 'none';

                // Controle Flutuante (Topo)
                if (estaForaDeVisao && temSelecao && scrollSuficiente && !visualizadorAberto) {
                    flutuante.classList.add('ativo');
                } else {
                    flutuante.classList.remove('ativo');
                }
            };

            atualizarVisibilidade();

            // Monitor de cliques na lista
            const listaDocs = document.querySelector('#docList');
            if (listaDocs && !listaDocs.dataset.monitorado) {
                listaDocs.addEventListener('click', () => setTimeout(atualizarVisibilidade, 150));
                listaDocs.dataset.monitorado = "true";
            }
            window.addEventListener('click', () => setTimeout(atualizarVisibilidade, 300));
        });
    }, { threshold: 0 });

    observer.observe(btnExcluir);
}

// Template comum para os botões
function criarTemplateBotoes(id) {
    const div = document.createElement('div');
    div.id = id;
    div.style.display = 'inline-flex';
    div.style.gap = '4px';
    div.style.alignItems = 'center';

    const botoes = [
        { label: 'A-Z', icon: 'fa-sort-alpha-asc', acao: 'az', cor: 'btn-dark' },
        { label: 'Topo', icon: 'fa-angle-double-up', acao: 'topo', cor: 'btn-primary' },
        { label: 'Subir 1', icon: 'fa-chevron-up', acao: 'cima', cor: 'btn-success' },
        { label: 'Descer 1', icon: 'fa-chevron-down', acao: 'baixo', cor: 'btn-warning' },
        { label: 'Final', icon: 'fa-angle-double-down', acao: 'final', cor: 'btn-info' }
    ];

    botoes.forEach(b => {
        const btn = document.createElement('a');
        btn.href = "javascript:void(0)";
        btn.className = `btn btn-sm ${b.cor}`;
        btn.style.fontWeight = 'bold';
        btn.style.height = '32px';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.innerHTML = `<i class="fa ${b.icon}"></i> <span style="margin-left:5px">${b.label}</span>`;
        
        btn.onclick = (e) => {
            e.preventDefault();
            if (b.acao === 'az') organizarLoteAZ();
            else executarMovimentacaoLote(b.acao);
        };
        div.appendChild(btn);
    });

    return div;
}


// 1. Função solicitada para capturar o ID do processo na URL de trâmite
function getProcessIdFromTramiteNovoUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('processo');
}

// 2. Verifica se a URL atual é a de novo trâmite
function isTramiteNovoUrl() {
    return window.location.pathname.includes('/Tramite/Novo');
}

// 3. Injeta os botões de atalho abaixo da descrição
function injetarAtalhosDescricao() {
    // Evita duplicados caso o script rode mais de uma vez
    if (document.getElementById('container-atalhos-tramite')) return;

    const campoDescricao = document.getElementById('descricaoTramite');
    if (!campoDescricao) return;

    const container = document.createElement('div');
    container.id = 'container-atalhos-tramite';
    container.style.marginTop = '10px';
    container.style.display = 'flex';
    container.style.gap = '8px';

    const sugestoes = [
        "Segue para as demais providências.",
        "Segue a pedido."
    ];

    sugestoes.forEach(texto => {
        const btn = document.createElement('button');
        btn.type = 'button'; // Garante que não dê submit no form
        btn.innerText = texto;
        
        // Estilo: Fundo branco, texto e borda pretos
        Object.assign(btn.style, {
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #000000',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background 0.2s'
        });

        // Efeito hover
        btn.onmouseover = () => btn.style.backgroundColor = '#f2f2f2';
        btn.onmouseout = () => btn.style.backgroundColor = '#ffffff';

        // Ao clicar, define o valor no textarea
        btn.onclick = (e) => {
            e.preventDefault();
            campoDescricao.value = texto;
            campoDescricao.focus();
        };

        container.appendChild(btn);
    });

    // Insere logo abaixo do textarea no DOM
    campoDescricao.insertAdjacentElement('afterend', container);
}










function addSearchProcess() {


    chrome.storage.local.get(['dadosPessoais', 'processTags'], (resultado) => {

        if(resultado.dadosPessoais != EXPEDIENTE){
            return;
        }

    });

    // pega o número do processo da tela
    const numeroProcessoEl = document.getElementById('numero-processo');
    if (!numeroProcessoEl) return;

    let numeroOriginal = numeroProcessoEl.textContent.trim();
    if (!numeroOriginal) return;

// 1️⃣ Remove sufixo de anexo (-1, -2, -10, etc)
    numeroOriginal = numeroOriginal.replace(/-\d+$/, '');

// 2️⃣ Converte o ano
// 11.249/2025 -> 11.249-25
// 11.249/2024 -> 11.249-24
    const numeroProcesso = numeroOriginal.replace(
        /\/(\d{4})$/,
        (_, ano) => `-${ano.slice(-2)}`
        );



    // caso precise apenas do primeiro valor (ex: 11.249/2025)
    const procss = numeroProcesso.split(' ');
    const url = chrome.runtime.getURL(
`lista_assinador.html?busca=${procss[0]}`
);

    // cria o botão
    const btn = document.createElement('a');
    btn.className = 'btn btn-default ms-1';
    btn.href = url;
    btn.target = '_blank'; // abre em nova aba (opcional)
    btn.title = 'Buscar no Assinador';



    btn.innerHTML = `
        <i class="fa fa-search" aria-hidden="true"></i>
        <span>Assinador</span>
    `;

    // local onde já existe o botão "Recibo"
    //const btnGroup = document.querySelector('.panel-body .btn-group.pull-right');
    //if (!btnGroup) return;


    const btnAnotacoes = document.getElementById('btnAnotacoes');

    // evita duplicar o botão
    if (btnAnotacoes.querySelector('.fa-search')) return;

    btnAnotacoes.insertAdjacentElement('afterend', btn);
}

function adicionarBotaoPastaMenu() {
    if (!isProcessoDigital()) {
        return;
    }

    const idProcesso = getProcessIdFromDetailUrl();
    if (!idProcesso) return;

    consultarPastaDoProcesso(idProcesso).then((pasta) => {
        if (!pasta) {
            console.log("🔍 [Extensão] Este processo não pertence a nenhuma pasta monitorada.");
            return;
        }

        const nomePasta = pasta.nomePasta;
        const codigoPasta = pasta.codigoPasta;

        // Localiza especificamente o botão "Recibo" nativo da página
        const btnRecibo = document.querySelector('a[data-target="#modal-recibo"]');
        if (!btnRecibo) {
            console.warn("⚠️ Botão Recibo não foi encontrado para ancoragem.");
            return;
        }

        if (document.querySelector('.btn-pasta-atual-processo')) return;

        const btn = document.createElement('a');
        btn.className = 'btn btn-default btn-pasta-atual-processo';
        btn.href = '#';
        btn.addEventListener('click', (e) => e.preventDefault()); 
        btn.title = `Pasta Atual do Processo: ${nomePasta.toUpperCase()}`;
        btn.style.cursor = 'default';

        btn.innerHTML = `
            <i class="fa fa-folder-open" aria-hidden="true"></i>
            <span>Pasta: ${nomePasta.toUpperCase()}</span>
        `;

        btnRecibo.insertAdjacentElement('afterend', btn);
        console.log(`✔ Botão da Pasta Atual (${nomePasta}) injetado com sucesso.`);
    });
}

async function adicionarSelectPastaMenu() {
    if (!isProcessoDigital()) return;

    const idProcesso = String(getProcessIdFromDetailUrl()).trim();
    if (!idProcesso) return;

    try {
        // 1. Acessa o cache do chrome.storage da sua extensão
        const resultado = await new Promise((resolve) => {
            chrome.storage.local.get(['mapeamentoPastasProcessos'], (res) => {
                resolve(res || {});
            });
        });

        const estruturaPastas = resultado.mapeamentoPastasProcessos || {};
        
        let pastaAtual = null;
        let todasAsPastasMapeadas = [];

        // 2. Varre a estrutura para extrair a pasta atual e mapear as outras
        for (const [codigoGrupo, pastas] of Object.entries(estruturaPastas)) {
            for (const [nomePasta, dadosPasta] of Object.entries(pastas)) {

                // Evita colocar na lista se for lixo ou mapeamento inválido da própria caixa de entrada
                if (!dadosPasta.codigo || String(dadosPasta.codigo) === '0' || nomePasta.toUpperCase() === 'CAIXA DE ENTRADA') continue;

                todasAsPastasMapeadas.push({
                    codigo: dadosPasta.codigo,
                    nome: nomePasta
                });

                if (dadosPasta.processos && dadosPasta.processos.length > 0) {
                    const encontrou = dadosPasta.processos.some(p => String(p.id).trim() === idProcesso);
                    if (encontrou) {
                        pastaAtual = {
                            nomePasta: nomePasta,
                            codigoPasta: dadosPasta.codigo
                        };
                    }
                }
            }
        }

        // Localiza o botão "Recibo" nativo na página para ancoragem
        const btnRecibo = document.querySelector('a[data-target="#modal-recibo"]');
        if (!btnRecibo) {
            console.warn("⚠️ Botão Recibo não foi encontrado para ancoragem.");
            return;
        }

        // Evita duplicar o componente na tela
        if (document.querySelector('.btn-pasta-atual-processo-container')) return;

        const textoPastaExibicao = pastaAtual ? pastaAtual.nomePasta.toUpperCase() : 'CAIXA DE ENTRADA';

        // 3. Criação do CONTAINER que imita perfeitamente o seu botão original
        const btnContainer = document.createElement('div');
        btnContainer.className = 'btn btn-default btn-pasta-atual-processo-container';
        btnContainer.title = `Pasta Atual do Processo: ${textoPastaExibicao}`;
        btnContainer.style.display = 'inline-block';
        btnContainer.style.marginLeft = '5px';
        btnContainer.style.position = 'relative'; 
        btnContainer.style.verticalAlign = 'middle';
        btnContainer.style.cursor = 'pointer';

        // 4. Injeta exatamente o HTML do design original
        btnContainer.innerHTML = `
            <i class="fa fa-folder-open" aria-hidden="true"></i>
            <span>Pasta: ${textoPastaExibicao}</span>
        `;

        // 5. Elemento SELECT camuflado (Fica invisível por cima do botão)
        const select = document.createElement('select');
        select.style.position = 'absolute';
        select.style.top = '0';
        select.style.left = '0';
        select.style.width = '100%';
        select.style.height = '100%';
        select.style.opacity = '0'; 
        select.style.cursor = 'pointer';
        select.style.appearance = 'none'; 
        select.style.webkitAppearance = 'none';

        // Option informativa padrão
        const optPadrao = document.createElement('option');
        optPadrao.value = '';
        optPadrao.textContent = `📋 Pasta Atual: ${textoPastaExibicao}`;
        optPadrao.selected = true;
        select.appendChild(optPadrao);

        // 6. Opção ÚNICA de Caixa de Entrada (Apenas se já estiver em alguma pasta)
        if (pastaAtual) {
            const optDesvincular = document.createElement('option');
            optDesvincular.value = 'DESVINCULAR';
            optDesvincular.textContent = '📥 Mover para: CAIXA DE ENTRADA';
            select.appendChild(optDesvincular);
        }

        // Divisor visual interno das opções
        if (todasAsPastasMapeadas.length > 0) {
            const optDivider = document.createElement('option');
            optDivider.textContent = '──────── Mover para Pasta ─────────';
            optDivider.disabled = true; 
            optDivider.style.textAlign = 'center'; 
            select.appendChild(optDivider);
        }

        // 7. Popula o menu com as pastas do seu cache (Sem duplicar a atual)
        todasAsPastasMapeadas.forEach(pasta => {
            if (pastaAtual && String(pastaAtual.codigoPasta) === String(pasta.codigo)) return;

            const opt = document.createElement('option');
            opt.value = pasta.codigo;
            opt.textContent = `📁 ${pasta.nome.toUpperCase()}`;
            select.appendChild(opt);
        });

        // 8. Evento de escuta para mudanças no Select com atualização dinâmica de cache
        select.addEventListener('change', async (e) => {
            const valorSelecionado = e.target.value;
            if (!valorSelecionado) return;

            select.disabled = true;

            try {
                if (valorSelecionado === 'DESVINCULAR') {
                    if (pastaAtual && pastaAtual.codigoPasta) {
                        console.log(`⏳ Removendo processo ${idProcesso} da pasta...`);
                        await removerProcessoDaPasta(idProcesso, pastaAtual.codigoPasta);
                        await atualizarCacheProcessoPasta(idProcesso, pastaAtual.codigoPasta, null, estruturaPastas);
                        console.log('✔ Processo movido para a Caixa de Entrada.');
                    }
                } 
                else {
                    if (pastaAtual && pastaAtual.codigoPasta) {
                        console.log(`⏳ Desvinculando da pasta anterior antes de mudar...`);
                        await removerProcessoDaPasta(idProcesso, pastaAtual.codigoPasta);
                    }

                    console.log(`⏳ Vinculando processo ${idProcesso} à pasta de código ${valorSelecionado}...`);
                    await adicionarProcessoAPasta(idProcesso, valorSelecionado);
                    
                    const codigoAntigo = pastaAtual ? pastaAtual.codigoPasta : null;
                    await atualizarCacheProcessoPasta(idProcesso, codigoAntigo, valorSelecionado, estruturaPastas);
                    console.log('✔ Processo vinculado com sucesso.');
                }

                setTimeout(() => {
                    window.location.reload();
                }, 1000);

            } catch (error) {
                console.error('❌ Erro durante a transição de pastas do processo:', error);
                alert('Ocorreu um erro ao atualizar a pasta. Por favor, tente novamente.');
                select.disabled = false;
                select.value = '';
            }
        });

        // Adiciona o select oculto dentro do botão e injeta após o Recibo
        btnContainer.appendChild(select);
        btnRecibo.insertAdjacentElement('afterend', btnContainer);
        console.log(`✔ Botão interativo (${textoPastaExibicao}) injetado.`);

        // [CORREÇÃO]: Chamar a função de injeção dos botões rápidos KANBAN 
        // APÓS o contêiner já estar devidamente inserido no DOM da página
        adicionarBotoesCamposRapidosKanban(idProcesso, btnContainer);

    } catch (err) {
        console.error('❌ Erro geral ao processar o select de pastas:', err);
    }
}

// =========================================================================
// BOTÕES DE EDIÇÃO RÁPIDA: PRAZO E COMENTÁRIOS DO KANBAN
// =========================================================================
function garantirProcessData(processData, processId) {
    if (!processData[processId]) {
        processData[processId] = {
            processNumber: "",
            board: "",
            description: "",
            dataPrazo: "",
            enteredBoardAt: Date.now(),
            lastMove: Date.now(),
            history: []
        };
    }

    if (!processData[processId].history) {
        processData[processId].history = [];
    }

    return processData[processId];
}

// Converte de AAAA-MM-DD para DD/MM/AAAA
function formatarParaDataBR(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    if (partes.length === 3) {
        const [ano, mes, dia] = partes;
        return `${dia}/${mes}/${ano}`;
    }
    return dataISO;
}

function adicionarBotoesCamposRapidosKanban(idProcesso, selectPastaContainer) {
    if (!selectPastaContainer || document.getElementById('btn-editar-prazo-rapido')) return;

    // ==========================
    // BOTÃO PRAZO
    // ==========================
    const btnPrazo = document.createElement('button');
    btnPrazo.id = 'btn-editar-prazo-rapido';
    btnPrazo.className = 'btn btn-default';
    btnPrazo.title = 'Prazo do Kanban';
    btnPrazo.innerHTML = `
        <i class="fa fa-calendar text-muted" aria-hidden="true"></i>
        <span>Prazo</span>
    `;

    btnPrazo.addEventListener('click', (e) => {
        e.preventDefault();

        chrome.storage.local.get('processData', (result) => {
            const processData = result.processData || {};
            const currentData = processData[idProcesso] || {};
            const currentVal = currentData.dataPrazo || '';
           

            Swal.fire({
                title: 'Prazo do Kanban',
                html: `
                    <div style="text-align:left;font-size:14px;margin-bottom:8px;">
                        Selecione a data limite do processo:
                    </div>
                    <input
                        type="date"
                        id="swal-input-date"
                        class="swal2-input"
                        style="margin-top:0;"
                       value="${currentVal ? currentVal.split('-').reverse().join('/') : ''}">
        `,
                    showCancelButton: true,
                    showDenyButton: !!currentVal ? currentVal.split('-').reverse().join('/') : '',
                    confirmButtonText: 'Salvar',
                    denyButtonText: 'Remover Data',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3085d6',
                    denyButtonColor: '#d33',
                    focusConfirm: false,
                    preConfirm: () => {
                        return document.getElementById('swal-input-date').value;
                    }
                }).then((res) => {

                    if (res.isConfirmed) {

                       let dataPrazo = res.value || ''; 

// Se a data vier no formato brasileiro (DD/MM/AAAA), converte para ISO (AAAA-MM-DD)
if (dataPrazo && dataPrazo.includes('/')) {
    const partes = dataPrazo.split('/');
    if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        dataPrazo = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
}
                        const processo = garantirProcessData(processData, idProcesso);

                        processo.dataPrazo = dataPrazo;
                        processo.lastMove = Date.now();

                        processo.history.push({
                            date: Date.now(),
                            action: `Prazo alterado para ${dataPrazo}`
                        });

                        chrome.storage.local.set({ processData }, () => {
                            showToast('success', 'Prazo salvo!');

                            if (typeof loadExtraKanbanData === 'function') {
                                loadExtraKanbanData(idProcesso);
                            }
                        });

                    } else if (res.isDenied) {

                        const processo = garantirProcessData(processData, idProcesso);

                        processo.dataPrazo = '';
                        processo.lastMove = Date.now();

                        processo.history.push({
                            date: Date.now(),
                            action: 'Prazo removido'
                        });

                        chrome.storage.local.set({ processData }, () => {
                            showToast('success', 'Prazo removido.');

                            if (typeof loadExtraKanbanData === 'function') {
                                loadExtraKanbanData(idProcesso);
                            }
                        });
                    }
                });
            });
    });

    // ==========================
    // BOTÃO COMENTÁRIO
    // ==========================
    const btnComment = document.createElement('button');
    btnComment.id = 'btn-editar-comment-rapido';
    btnComment.className = 'btn btn-default';
    btnComment.title = 'Comentários do Kanban';
    btnComment.innerHTML = `
        <i class="fa fa-comment text-muted" aria-hidden="true"></i>
        <span>Comentário</span>
    `;

    btnComment.addEventListener('click', (e) => {
        e.preventDefault();

        chrome.storage.local.get('processData', (result) => {
            const processData = result.processData || {};
            const currentData = processData[idProcesso] || {};
            const currentVal = currentData.description || '';

            Swal.fire({
                title: 'Comentários do Kanban',
                html: `
                    <textarea
                        id="swal-input-comment"
                        class="swal2-textarea"
                        style="width:90%;height:140px;margin:0 auto;font-family:sans-serif;font-size:14px;"
                        placeholder="Escreva anotações internas para o quadro Kanban..."
                    >${currentVal}</textarea>
                    `,
                    showCancelButton: true,
                    showDenyButton: !!currentVal,
                    confirmButtonText: 'Salvar',
                    denyButtonText: 'Remover Texto',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3085d6',
                    denyButtonColor: '#d33',
                    focusConfirm: false,
                    preConfirm: () => {
                        return document.getElementById('swal-input-comment').value;
                    }
                }).then((res) => {

                    if (res.isConfirmed) {

                        const texto = res.value || '';

                        const processo = garantirProcessData(processData, idProcesso);

                        processo.description = texto;
                        processo.lastMove = Date.now();

                        processo.history.push({
                            date: Date.now(),
                            action: 'Descrição alterada'
                        });

                        chrome.storage.local.set({ processData }, () => {
                            showToast('success', 'Comentário salvo!');

                            if (typeof loadExtraKanbanData === 'function') {
                                loadExtraKanbanData(idProcesso);
                            }
                        });

                    } else if (res.isDenied) {

                        const processo = garantirProcessData(processData, idProcesso);

                        processo.description = '';
                        processo.lastMove = Date.now();

                        processo.history.push({
                            date: Date.now(),
                            action: 'Descrição removida'
                        });

                        chrome.storage.local.set({ processData }, () => {
                            showToast('success', 'Comentário removido.');

                            if (typeof loadExtraKanbanData === 'function') {
                                loadExtraKanbanData(idProcesso);
                            }
                        });
                    }
                });
            });
    });

    // ==========================
    // INSERÇÃO DOS BOTÕES
    // ==========================
    selectPastaContainer.parentNode.insertBefore(btnPrazo, selectPastaContainer);
    selectPastaContainer.parentNode.insertBefore(btnComment, selectPastaContainer);
}

// Executa o Ajax exato fornecido para a vinculação, injetando o código dinâmico direto no window
async function adicionarProcessoAPasta(idProcesso, valorSelecionado) {
    return new Promise((resolve, reject) => {
        try {
            const disparador = document.createElement('div');
            disparador.setAttribute('onclick', `
                $.ajax({
                    url: '/CaixaEntrada/VincularProcessoAPasta',
                    data: { pasta: "${valorSelecionado}", processo: "${idProcesso}" },
                    success: function (result) {
                        if (result === 'False') {
                            if (typeof window.addAlert === 'function') window.addAlert('warning', 'Processo não pertence ao grupo da pasta');
                        }
                        else if (result === 'True') {
                            if (typeof window.addAlert === 'function') window.addAlert('success', 'Processo adicionado a pasta com sucesso');
                        }
                        else if (result === 'Erro') {
                            if (typeof window.addAlert === 'function') window.addAlert('warning', 'Não foi possível inserir o processo na pasta');
                        }
                        document.dispatchEvent(new CustomEvent('AJAX_VINCULO_CONCLUIDO', { detail: { sucesso: true } }));
                    },
                    error: function () {
                        if (typeof window.addAlert === 'function') window.addAlert('warning', 'Não foi possível inserir o processo na pasta');
                        document.dispatchEvent(new CustomEvent('AJAX_VINCULO_CONCLUIDO', { detail: { sucesso: false } }));
                    }
                });
            `);

            const checarRetorno = (e) => {
                document.removeEventListener('AJAX_VINCULO_CONCLUIDO', checarRetorno);
                resolve();
            };
            document.addEventListener('AJAX_VINCULO_CONCLUIDO', checarRetorno);

            document.body.appendChild(disparador);
            disparador.click();
            disparador.remove();
        } catch (err) {
            reject(err);
        }
    });
}

async function removerProcessoDaPasta(idProcesso, codigoPasta) {
    return new Promise((resolve, reject) => {
        try {
            const disparador = document.createElement('div');
            
            // CORREÇÃO DEFINITIVA: Força o caminho absoluto correto (/CaixaEntrada/DesvincularProcessoAPasta)
            // mantendo a estrutura exata do payload que o servidor espera { codigoPasta, codigoProcesso }
            disparador.setAttribute('onclick', `
                $.ajax({
                    url: "/CaixaEntrada/DesvincularProcessoAPasta",
                    type: "GET", // Altere para "POST" se notar no DevTools que o site usa POST nesta rota
                    data: { 
                        codigoPasta: "${codigoPasta}", 
                        codigoProcesso: "${idProcesso}" 
                    },
                    success: function (result) {
                        if (typeof window.addAlert === 'function') {
                            window.addAlert('success', 'Processo removido da pasta com sucesso');
                        }
                        document.dispatchEvent(new CustomEvent('AJAX_DESVINCULO_CONCLUIDO', { detail: { sucesso: true } }));
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error("Erro na requisição de desvínculo:", textStatus, errorThrown);
                        if (typeof window.addAlert === 'function') {
                            window.addAlert('warning', 'Não foi possível remover o processo da pasta');
                        }
                        document.dispatchEvent(new CustomEvent('AJAX_DESVINCULO_CONCLUIDO', { detail: { sucesso: false } }));
                    }
                });
            `);

            const checarRetorno = (e) => {
                document.removeEventListener('AJAX_DESVINCULO_CONCLUIDO', checarRetorno);
                resolve(); // Avança para atualizar o cache local do chrome.storage
            };
            document.addEventListener('AJAX_DESVINCULO_CONCLUIDO', checarRetorno);

            document.body.appendChild(disparador);
            disparador.click();
            disparador.remove();
        } catch (err) {
            reject(err);
        }
    });
}

async function atualizarCacheProcessoPasta(idProcesso, codigoPastaAntiga, codigoPastaNova, estruturaPastas) {
    let alterouCache = false;
    const idProcNum = Number(idProcesso);

    // 1. Se estava em uma pasta antiga, remove o processo de lá de dentro no cache
    if (codigoPastaAntiga) {
        for (const [grupo, pastas] of Object.entries(estruturaPastas)) {
            for (const [nomePasta, dadosPasta] of Object.entries(pastas)) {
                if (String(dadosPasta.codigo) === String(codigoPastaAntiga) && dadosPasta.processos) {
                    const index = dadosPasta.processos.findIndex(p => Number(p.id) === idProcNum || String(p.id).trim() === idProcesso);
                    if (index !== -1) {
                        dadosPasta.processos.splice(index, 1);
                        alterouCache = true;
                    }
                }
            }
        }
    }

    // 2. Se foi definido para uma nova pasta, adiciona o processo nela no cache
    if (codigoPastaNova) {
        for (const [grupo, pastas] of Object.entries(estruturaPastas)) {
            for (const [nomePasta, dadosPasta] of Object.entries(pastas)) {
                if (String(dadosPasta.codigo) === String(codigoPastaNova)) {
                    if (!dadosPasta.processos) dadosPasta.processos = [];
                    
                    // Evita duplicar por segurança
                    const jaExiste = dadosPasta.processos.some(p => Number(p.id) === idProcNum);
                    if (!jaExiste) {
                        dadosPasta.processos.push({ id: idProcNum });
                        alterouCache = true;
                    }
                }
            }
        }
    }

    // 3. Salva a nova estrutura de volta para o chrome storage se houve mudanças
    if (alterouCache) {
        await new Promise((resolve) => {
            chrome.storage.local.set({ mapeamentoPastasProcessos: estruturaPastas }, () => {
                resolve();
            });
        });
        console.log(`🔄 Cache local atualizado: Processo ${idProcesso} mapeado da pasta [${codigoPastaAntiga}] para [${codigoPastaNova}].`);
    }
}

// 1. FUNÇÃO CORRIGIDA: Extrai a estrutura usando Regex (mais seguro que URLSearchParams em strings parciais)
function extrairEstruturaPastas() {
    const estruturaPastas = {};
    
    // Injeta manualmente a Caixa de Entrada Principal
    estruturaPastas["PRINCIPAL"] = {
        "CAIXA DE ENTRADA": {
            codigo: "0",
            url: "https://processodigital.praiagrande.sp.gov.br/CaixaEntrada",
            processos: []
        }
    };

    // Seleciona os blocos de títulos de abas de pastas
    const itensLista = document.querySelectorAll('li.titulo-aba-pasta');

    itensLista.forEach(li => {
        const linkGerenciar = li.querySelector('a[href*="/CaixaEntrada/GerenciarPastas"]');
        if (!linkGerenciar) return;

        // Expressão regular para pegar o número logo após "codigo="
        const hrefGrupo = linkGerenciar.getAttribute('href');
        const matchGrupo = hrefGrupo.match(/codigo=(\d+)/);
        const codigoGrupo = matchGrupo ? matchGrupo[1] : null;

        if (codigoGrupo) {
            if (!estruturaPastas[codigoGrupo]) {
                estruturaPastas[codigoGrupo] = {};
            }
            
            // Procura os cards de pastas dentro do container irmão ou filho da LI
            // Mudança importante: buscar no documento ou no elemento correto caso estejam fora da LI
            const cardsPastas = li.parentElement ? li.parentElement.querySelectorAll('.nome-pasta') : li.querySelectorAll('.nome-pasta');

            cardsPastas.forEach(card => {
                const linkPasta = card.querySelector('a[href*="/CaixaEntrada/Pasta"]');
                if (!linkPasta) return;

                const hrefPasta = linkPasta.getAttribute('href');
                const matchPasta = hrefPasta.match(/codigo=(\d+)/);
                const codigoPasta = matchPasta ? matchPasta[1] : null;
                const nomePasta = linkPasta.textContent.replace(/\s+/g, ' ').trim();

                if (codigoPasta && nomePasta) {
                    estruturaPastas[codigoGrupo][nomePasta] = {
                        codigo: codigoPasta,
                        url: `https://processodigital.praiagrande.sp.gov.br/CaixaEntrada/Pasta?codigo=${codigoPasta}`,
                        processos: [] 
                    };
                }
            });
        }
    });

    return estruturaPastas;
}

// 2. FUNÇÃO ATUALIZADA: Separa por prioridade e processa as monitoradas primeiro
async function mapearProcessosDasPastas(estruturaMapeada) {
    chrome.storage.local.get(['mapeamentoPastasProcessos', 'pastasMonitoradas'], async (result) => {
        const dadosAntigos = result.mapeamentoPastasProcessos || {};
        const pastasMonitoradas = result.pastasMonitoradas || {};
        const novaEstruturaSalvar = JSON.parse(JSON.stringify(dadosAntigos));

        // Criamos duas filas distintas para controlar a ordem de execução
        const filaAltaPrioridade = [];
        const filaBaixaPrioridade = [];

        console.log("🗂️ Organizando fila de mapeamento por prioridade...");

        // 1. SEPARAÇÃO DAS PASTAS
        for (const [codigoGrupo, pastas] of Object.entries(estruturaMapeada)) {
            if (!novaEstruturaSalvar[codigoGrupo]) {
                novaEstruturaSalvar[codigoGrupo] = {};
            }

            for (const [nomePasta, dadosPasta] of Object.entries(pastas)) {
                const codigoPasta = dadosPasta.codigo;
                const ehMonitorada = codigoPasta === "0" || !!pastasMonitoradas[codigoPasta];

                const itemFila = { codigoGrupo, nomePasta, dadosPasta, ehMonitorada };

                if (ehMonitorada) {
                    filaAltaPrioridade.push(itemFila);
                } else {
                    filaBaixaPrioridade.push(itemFila);
                }
            }
        }

        // Unimos as duas filas: as de Alta Prioridade entram primeiro obrigatoriamente
        const filaCompletaExecucao = [...filaAltaPrioridade, ...filaBaixaPrioridade];

        console.log(`🚀 Iniciando execução ordenada. [Alta Prioridade: ${filaAltaPrioridade.length}] | [Baixa Prioridade: ${filaBaixaPrioridade.length}]`);

        // 2. EXECUÇÃO DA FILA ORDENADA
        for (const tarefa of filaCompletaExecucao) {
            const { codigoGrupo, nomePasta, dadosPasta, ehMonitorada } = tarefa;
            const codigoPasta = dadosPasta.codigo;

            try {
                console.log(`🌐 [${ehMonitorada ? '⚡ PRIORIDADE' : '🐢 BACKGROUND'}] Mapeando pasta: [${nomePasta}]`);
                
                const response = await fetch(dadosPasta.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const htmlTexto = await response.text();
                const parser = new DOMParser();
                const docVirtual = parser.parseFromString(htmlTexto, 'text/html');
                
                const cardsProcessos = docVirtual.querySelectorAll('a.pd-inbox-item');
                const processosAtuais = [];

                cardsProcessos.forEach(card => {
                    const idProcesso = card.getAttribute('data-processo');
                    const tagTitulo = card.querySelector('b.title');
                    const numProcesso = tagTitulo ? tagTitulo.textContent.replace(/\s+/g, ' ').trim() : null;
                    const hrefRelativo = card.getAttribute('href');

                    if (idProcesso && numProcesso) {
                        const baseUrl = "https://processodigital.praiagrande.sp.gov.br";
                        processosAtuais.push({
                            id: String(idProcesso).trim(),
                            numero: numProcesso,
                            url: baseUrl + (hrefRelativo.startsWith('/') ? hrefRelativo : '/' + hrefRelativo)
                        });
                    }
                });

                const pastaAntiga = dadosAntigos[codigoGrupo]?.[nomePasta] || {};
                let alertaNovo = false;

                if (ehMonitorada) {
                    alertaNovo = pastaAntiga.alertaNovo || false;
                    const processosAntigos = pastaAntiga.processos || [];
                    const idsAntigos = new Set(processosAntigos.map(p => p.id));
                    const entraram = processosAtuais.filter(p => !idsAntigos.has(p.id));

                    if (entraram.length > 0) {
                        console.log(`📥 [${nomePasta}] Novos processos detectados nas prioritárias.`);
                        alertaNovo = true;
                    }
                }

                // Salva os dados no objeto temporário
                novaEstruturaSalvar[codigoGrupo][nomePasta] = {
                    codigo: codigoPasta,
                    url: dadosPasta.url,
                    processos: processosAtuais,
                    alertaNovo: alertaNovo 
                };

                // Se acabaram as pastas de alta prioridade, salva o estado parcial para atualizar os badges na tela imediatamente
                if (ehMonitorada && filaAltaPrioridade.indexOf(tarefa) === filaAltaPrioridade.length - 1) {
                    chrome.storage.local.set({ mapeamentoPastasProcessos: novaEstruturaSalvar }, () => {
                        console.log("💾 [Checkpoint] Badges das pastas prioritárias atualizados no Storage.");
                        if (typeof atualizarBadgesPastas === "function") atualizarBadgesPastas();
                    });
                }

            } catch (erro) {
                console.error(`❌ Erro ao buscar pasta ${nomePasta}:`, erro);
                if (dadosAntigos[codigoGrupo]?.[nomePasta]) {
                    novaEstruturaSalvar[codigoGrupo][nomePasta] = dadosAntigos[codigoGrupo][nomePasta];
                }
            }
        }

        // 3. GRAVAÇÃO FINAL DO BANCO DE DADOS COMPLETO
        chrome.storage.local.set({ mapeamentoPastasProcessos: novaEstruturaSalvar }, () => {
            console.log("💾 Mapeamento completo (Monitoradas + Background) finalizado e salvo.");
            if (typeof atualizarBadgesPastas === "function") atualizarBadgesPastas();
        });
    });
}

// 3. FUNÇÃO: Consulta com Logs para ver o cruzamento de IDs
function consultarPastaDoProcesso(idProcesso) {
    return new Promise((resolve) => {
        // Remove espaços e garante texto puro
        const idProcurado = String(idProcesso).trim();
        console.log(`🔍 [Consulta] Buscando qual pasta possui o ID: "${idProcurado}"`);

        chrome.storage.local.get(['mapeamentoPastasProcessos'], (resultado) => {
            const estruturaPastas = resultado.mapeamentoPastasProcessos;
            
            if (!estruturaPastas) {
                console.warn("⚠️ Mapeamento vazio no storage.");
                return resolve(null);
            }

            for (const [codigoGrupo, pastas] of Object.entries(estruturaPastas)) {
                for (const [nomePasta, dadosPasta] of Object.entries(pastas)) {

                    if (!dadosPasta.processos || dadosPasta.processos.length === 0) continue;
                    
                    // Mostra quais IDs existem na pasta para você comparar visualmente no console
                    console.log(`📂 Checando pasta [${nomePasta}]. IDs disponíveis nela:`, dadosPasta.processos.map(p => p.id));

                    const encontrou = dadosPasta.processos.some(p => String(p.id).trim() === idProcurado);
                    
                    if (encontrou) {
                        console.log(`🎯 Sucesso! ID "${idProcurado}" encontrado na pasta [${nomePasta}]`);
                        return resolve({
                            nomePasta: nomePasta,
                            codigoPasta: dadosPasta.codigo
                        });
                    }
                }
            }
            
            console.warn(`❌ Fim da busca. O ID "${idProcurado}" não foi achado em nenhuma das listagens acima.`);
            return resolve(null);
        });
    });
}

/**
 * CRIA UMA NOVA COLUNA E INJETA OS CONTROLES ON/OFF COMPATÍVEIS
 */
function injetarSwitchesGerenciamento() {
    const tabela = document.querySelector('.table');
    if (!tabela) return;

    // 1. Injeta o cabeçalho TH se não existir
    const cabecalhoLinha = tabela.querySelector('thead tr');
    if (cabecalhoLinha && !tabela.querySelector('.th-monitorar-ext')) {
        const th = document.createElement('th');
        th.className = 'text-center th-monitorar-ext';
        th.innerText = 'Monitorar (Badge)';
        th.style.verticalAlign = 'middle';
        
        const colAcoesHead = cabecalhoLinha.querySelector('th:last-child');
        cabecalhoLinha.insertBefore(th, colAcoesHead);
    }

    // 2. Injeta as células TD com o switch nativo pedido
    const linhasTabela = tabela.querySelectorAll('tbody tr');
    chrome.storage.local.get(['pastasMonitoradas'], (result) => {
        const pastasMonitoradas = result.pastasMonitoradas || {};

        linhasTabela.forEach(linha => {
            if (linha.querySelector('.td-monitorar-ext')) return;

            const linkAcao = linha.querySelector('a[href*="codigo="]');
            if (!linkAcao) return;

            const urlParams = new URLSearchParams(linkAcao.href.split('?')[1]);
            const pastaId = urlParams.get('codigo');
            if (!pastaId) return;

            const isMonitored = !!pastasMonitoradas[pastaId];

            const td = document.createElement('td');
            td.className = 'text-center td-monitorar-ext col-xs-1';
            td.style.verticalAlign = 'middle';

            // Estrutura nativa do Bootstrap 5 com switch de checkbox
            td.innerHTML = `
                <div class="d-inline-block">
                    <input type="checkbox" id="switch-pasta-${pastaId}" data-id="${pastaId}" ${isMonitored ? 'checked' : ''} style="cursor: pointer; left:0; position:relative;">
                </div>
            `;

            const input = td.querySelector('input');
            input.addEventListener('change', (e) => {
                chrome.storage.local.get(['pastasMonitoradas'], (res) => {
                    const atual = res.pastasMonitoradas || {};
                    atual[pastaId] = e.target.checked;
                    chrome.storage.local.set({ pastasMonitoradas: atual }, () => {
                        atualizarBadgesPastas();
                    });
                });
            });

            const celulaAcoes = linha.querySelector('td:last-child');
            linha.insertBefore(td, celulaAcoes);
        });
    });
}

/**
 * DETECTA E INJETA OS BADGES NA LISTAGEM LATERAL DO SISTEMA
 */
/**
 * DETECTA E INJETA OS BADGES NA LISTAGEM LATERAL DO SISTEMA
 */
function atualizarBadgesPastas() {
    chrome.storage.local.get(['pastasMonitoradas', 'mapeamentoPastasProcessos'], (result) => {
        const pastasMonitoradas = result.pastasMonitoradas || {};
        const dadosMapeados = result.mapeamentoPastasProcessos || {};

        // Remove badges antigos para evitar duplicações
        document.querySelectorAll('.badge-monitoramento-pasta').forEach(el => el.remove());

        // Localiza os links das pastas na barra lateral baseando-se no padrão real do sistema (li.titulo-aba-pasta)
        // Buscamos qualquer link que aponte para uma pasta com o parâmetro codigo=
        const linksPastas = document.querySelectorAll('li.titulo-aba-pasta a[href*="codigo="], .nav-sidebar a[href*="codigo="]');

        linksPastas.forEach(link => {
            const urlParams = new URLSearchParams(link.href.split('?')[1]);
            const pastaId = urlParams.get('codigo');

            // Se não houver ID ou se o usuário optou por não monitorar essa pasta, ignora
            if (!pastaId || !pastasMonitoradas[pastaId]) return;

            let quantidadeAtual = 0;
            let encontrouNoMapeamento = false;

            // Varre a estrutura real multinível gerada pelo seu mapeador (Grupo -> NomePasta)
          let temAlerta = false; // Inicializa a flag de alerta como falsa

          for (const codigoGrupo in dadosMapeados) {
            const grupo = dadosMapeados[codigoGrupo];
            for (const nomePasta in grupo) {
                const dadosPasta = grupo[nomePasta];
                if (String(dadosPasta.codigo) === String(pastaId)) {
                    if (dadosPasta.processos && Array.isArray(dadosPasta.processos)) {
                        quantidadeAtual = dadosPasta.processos.length;
                            temAlerta = dadosPasta.alertaNovo || false; // 🚨 Captura o estado de alerta salvo no storage
                            encontrouNoMapeamento = true;
                            break;
                        }
                    }
                }
                if (encontrouNoMapeamento) break;
            }

            // Fallback: Se a home ainda não mapeou, tenta extrair o número entre parênteses do próprio texto nativo (Ex: "Minha Pasta (5)")
            if (!encontrouNoMapeamento) {
                const matchTexto = link.innerText.match(/\((\d+)\)/);
                quantidadeAtual = matchTexto ? parseInt(matchTexto[1]) : 0;
                temAlerta = false; // Sem dados mapeados, assume padrão sem alerta
            }

            // Cria o Badge usando a estrutura e estilização de classe nativa do Bootstrap 5 / AdminLTE
            const badge = document.createElement('span');
            
            // Define a estilização base (alinhamento, tamanho e float)
            badge.className = 'badge badge-monitoramento-pasta ms-2 align-middle';
            badge.style.float = 'right';
            badge.style.fontSize = '11px';
            badge.style.fontWeight = 'bold';
            badge.textContent = quantidadeAtual;
            
            // 🎨 LÓGICA DE ALTERAÇÃO DO BACKGROUND (WARNING vs DARK)
            if (temAlerta && quantidadeAtual > 0) {
                // 1. Limpamos de forma estrita as clases do modo escuro/normal
                badge.classList.remove('bg-dark', 'text-light');
                
                // 2. Aplicamos as clases de aviso (Fondo amarelo, texto escuro)
                badge.classList.add('bg-warning', 'text-dark');
                badge.title = "Novos processos recebidos recentemente!";
                
                // FORZAR ESTILO INLINE (Garantía extra para o Modo Claro)
                // Se o CSS do sistema fose moi agresivo, isto asegura o contraste:
                badge.style.setProperty('color', '#000000', 'important');
                badge.style.setProperty('background-color', '#ffc107', 'important');
            } else {
                // 1. Limpamos as clases de aviso
                badge.classList.remove('bg-warning', 'text-dark');
                
                // 2. Volvemos ao estado estándar (Fondo escuro, texto claro)
                badge.classList.add('bg-dark', 'text-light');
                badge.removeAttribute('title');
                
                // Limpamos os estilos inline para que volva ao deseño por defecto
                badge.style.removeProperty('color');
                badge.style.removeProperty('background-color');
            }

            link.appendChild(badge);

            //limpa alerta
            link.addEventListener('click', () => {
                limparAlertaDaPasta(pastaId);
            });
        });
    });
}

// Função para remover o estado de alerta de uma pasta específica após o clique do usuário
function limparAlertaDaPasta(pastaId) {
    chrome.storage.local.get(['mapeamentoPastasProcessos'], (result) => {
        const dadosMapeados = result.mapeamentoPastasProcessos || {};
        let houveAlteracao = false;

        // Procura a pasta correspondente ao ID para desligar o alerta
        for (const codigoGrupo in dadosMapeados) {
            const grupo = dadosMapeados[codigoGrupo];
            for (const nomePasta in grupo) {
                if (String(grupo[nomePasta].codigo) === String(pastaId)) {
                    if (grupo[nomePasta].alertaNovo) {
                        grupo[nomePasta].alertaNovo = false; // 🔓 Remove o alerta
                        houveAlteracao = true;
                    }
                    break;
                }
            }
            if (houveAlteracao) break;
        }

        // Se realmente mudou o estado, salva no storage e atualiza o visual na hora
        if (houveAlteracao) {
            chrome.storage.local.set({ mapeamentoPastasProcessos: dadosMapeados }, () => {
                console.log(`🧼 Alerta removido para a pasta ID: ${pastaId}`);
                atualizarBadgesPastas(); // Atualiza a tela tirando o bg-warning
            });
        }
    });
}





















//FIM DAS FUNÇÕES




    // --- LISTENERS DE EVENTOS ---

    // Listener para fechar o menu ao clicar fora
document.addEventListener('click', (event) => {
    if (isMenuOpening) return;
    if (!tagMenu.contains(event.target)) {
        tagMenu.style.display = 'none';
            tagMenu.style.visibility = 'visible'; // restaura caso tenha sido alterado
            lastMenuAnchor = null;
            if (menuResizeObserver) {
                try {
                    menuResizeObserver.disconnect();
                } catch (e) {}
                menuResizeObserver = null;
            }
            if (repositionTimeout) {
                clearTimeout(repositionTimeout);
                repositionTimeout = null;
            }
        }
    });

    // Listener de contextmenu (Botão Direito) para abrir o menu flutuante
document.addEventListener('contextmenu', function(event) {
    if (isProcessoDetailUrl()) return;

    if (!currentSettings.showTags) {
        tagMenu.style.display = 'none';
        return;
    }
    const processoEl = event.target.closest && event.target.closest('a.pd-inbox-item');

    if (processoEl) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const id = getProcessIdFromListElement(processoEl);
        const processNumber = getProcessNumber(processoEl);

        if (id) {
            showTagMenu(event, id, processNumber);
        }
    } else {
        tagMenu.style.display = 'none';
    }
}, true);

    // Listener para o storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.processTags) {
        const newV = changes.processTags.newValue || {};
        const oldV = changes.processTags.oldValue || {};

        const keys = new Set([...Object.keys(newV), ...Object.keys(oldV)]);
        keys.forEach(tagInstanceId => {
            const item = newV[tagInstanceId];
            if (item) applyTagToPage(tagInstanceId, item);
            else applyTagToPage(tagInstanceId, null);
        });

        if (tagMenu.style.display !== 'none') {
                // Tenta pegar o ID do processo do menu
            const currentId = tagMenu.querySelector('[id^="tags-container-processo-"]')?.getAttribute('data-processo') ||
            document.querySelector('a.pd-inbox-item.active .pd-inbox-item-id')?.getAttribute('data-processo');
                const processNumber = getProcessNumber(processElement); // <-- NOVO
                if (currentId) {
                    // Recarrega o conteúdo do menu (que chamará o Simples ou Avançado)
                    showTagMenu({
                        clientX: tagMenu.offsetLeft,
                        clientY: tagMenu.offsetTop - window.scrollY
                    }, currentId);
                }
            }
        }
        // Quando as settings mudam (incluindo menuType)
        if (changes.userSettings) {
            loadSettings(true);
        }
    });

    // Listener para mensagens de outros scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'addTagToProcess' || msg.action === 'updateTag') {
            //const data = msg.nome && msg.cor ? { name: msg.nome, color: msg.cor } : null;

        const data = (msg.nome && msg.cor) ? {
            name: msg.nome,
            color: msg.cor,
                processNumber: msg.processNumber // <-- NOVO CAMPO INCLUÍDO
            } : null;
            // O 'applyTagToPageAsync' deve retornar uma Promise
            applyTagToPageAsync(msg.processoIdInstance, data)
            .then(() => {
                    // SUCESSO: Chama sendResponse dentro da Promise.
                sendResponse({
                    status: 'ok',
                    successMessage: msg.successMessage
                });
            })
            .catch(error => {
                    // FALHA: SEMPRE chama sendResponse em caso de erro!
                sendResponse({
                    status: 'error',
                    errorMessage: error.message
                });
            });

            // IMPORTANTE: Retorne TRUE para manter a porta aberta
            return true;
        }

       // Localize o listener chrome.runtime.onMessage.addListener e ajuste a ação:
        if (msg.action === 'removeTagFromProcess') {
            chrome.storage.local.get(['processTags', 'processData'], (data) => {
                let tags = data.processTags || {};
                let pData = data.processData || {};

                const tag = tags[msg.tagInstanceId];
                if (tag) {
                    const processId = tag.processId;

            // Se for tag de board, executa a limpeza profunda que você solicitou
                    if (tag.isBoardTag) {
                // 1. Remove todas as tags do processo
                        for (const key of Object.keys(tags)) {
                            if (key.startsWith(processId + "-")) {
                                delete tags[key];
                            }
                        }
                // 2. Remove os dados (Descrição, Prazo, Board)
                        if (pData[processId]) {
                            delete pData[processId];
                        }
                    } else {
                // Se for tag comum, remove só ela
                        delete tags[msg.tagInstanceId];
                    }

                    chrome.storage.local.set({ processTags: tags, processData: pData }, () => {
                        showToast('info', 'Tag e dados do Kanban removidos com sucesso');
                // Reload para limpar o estado visual da página (badges de prazo, etc)
                        setTimeout(() => location.reload(), 1000);
                    });
                }
            });
            return true;
        }

        if (msg.action === 'settingsUpdated') {
            loadSettings(true);
            return false;
        }
    });

    // 1. Carrega as configurações no início, o que chama initializeFeatures
  // 1. Carrega as configurações no início
loadSettings(true);


    // CHAMADA DE INICIALIZAÇÃO COM SEGURANÇA E ASYNC
   // CHAMADA DE INICIALIZAÇÃO NO FINAL DO CONTENT.JS
setTimeout(async () => {
    chrome.storage.local.get(['settings'], async (result) => {
        if (result.settings) currentSettings = result.settings;

        initializeFeatures();
        fixToastPosition();
        esperarMenuEAdicionarKanban();

// Função para validar se deve rodar a lógica de documentos
        function deveExecutarOrdenacao() {
            return window.location.href.includes('/processo/') && window.location.hash.includes('#dg922');
        }




// Escuta mudanças de hash (ex: de #dp para #dg922) sem recarregar a página
        window.addEventListener('hashchange', () => {
            if (deveExecutarOrdenacao()) {
        // Pequeno delay para o sistema renderizar o HTML novo
                setTimeout(injetarBotoesMoverLote, 500);
            } else {
        // Se saiu do #dg922, limpa os menus
                document.getElementById('grupo-ordenacao-flutuante')?.remove();
                document.getElementById('grupo-ordenacao-estatico')?.remove();
            }
        });

// Seu Observer existente melhorado
        if (window.location.href.includes('/processo/')) {
            const observerDocumentos = new MutationObserver(() => {
                if (deveExecutarOrdenacao()) {
            // Verifica se o container de documentos apareceu
                    if (document.querySelector('#docList .linha-documento-grupo')) {
                        injetarBotoesMoverLote();
                    }
                }
            });

            observerDocumentos.observe(document.body, { childList: true, subtree: true });
        }

        if (isTramiteNovoUrl()) {
            injetarAtalhosDescricao();

    // Se precisar usar o ID do processo para algo:
            const idProcesso = getProcessIdFromTramiteNovoUrl();
            if (idProcesso) console.log("Processo em trâmite:", idProcesso);
        }

        if (isPastaUrl2() || isPastaUrl()) {


            await carregarEAgruparTodasAsPaginas();
            initializeFeatures();
        }


            // Exemplo de execução
        if (window.location.href.includes('/CaixaEntrada')) {
                // 1. Extrai a lista do HTML atual da home
            console.log("🏁 Página inicial detectada. Atualizando processos...");

                // 1. Extrai a lista do HTML atual da página
            const estruturaMapeada = extrairEstruturaPastas();

                // 2. Se encontrou pastas na página, executa a busca e armazenamento
            if (Object.keys(estruturaMapeada).length > 0) {
                mapearProcessosDasPastas(estruturaMapeada);
            }
        }


        if (window.location.href.includes('/CaixaEntrada/GerenciarPastas')) {
            console.log('Injetando controle de Badges na Tabela...');
            injetarSwitchesGerenciamento();
        }

    // Executa a renderização dos Badges
        atualizarBadgesPastas();



        
        if (isProcessoDetailUrl()) {
            initializeProcessoDetailTags();
            checkAndPromptTagRemovalOnDetail();
            addSearchProcess();
            //adicionarBotaoPastaMenu();
            adicionarSelectPastaMenu();
        }
    });
}, 150);

})(); // Fim da IIFE