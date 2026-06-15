
// ================================================
// lista_assinador.js — versão corrigida
// ================================================
let tooltipRetryCount = 0;
const MAX_RETRIES = 15; 

// ================================
// IndexedDB — Cache da lista pesada
// ================================
const DB_NAME = "assinadorDB";
const DB_VERSION = 1;
const STORE_DOCS = "documentos";
const STORE_META = "meta";

const urlParams = new URLSearchParams(window.location.search);
const termoPesquisado = urlParams.get('busca');

if (termoPesquisado) {
    //console.log("O usuário pesquisou por:", termoPesquisado);
    document.title = termoPesquisado + " Documentos a Assinar";
    // Aqui você executa a lógica para filtrar sua lista
}

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

            if (!db.objectStoreNames.contains(STORE_DOCS)) {
                db.createObjectStore(STORE_DOCS, { keyPath: "ID" });
            }

            if (!db.objectStoreNames.contains(STORE_META)) {
                db.createObjectStore(STORE_META, { keyPath: "key" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function salvarListaCache(lista) {
    const db = await abrirDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_DOCS, STORE_META], "readwrite");
        const storeDocs = tx.objectStore(STORE_DOCS);
        const storeMeta = tx.objectStore(STORE_META);

        for (const item of lista) {
            storeDocs.put(item);
        }

        storeMeta.put({
            key: "lastUpdate",
            value: Date.now()
        });

        tx.oncomplete = () => {
            console.log(`💾 Cache salvo com sucesso (${lista.length} itens)`);
            resolve();
        };

        tx.onerror = () => {
            console.error("❌ Erro ao salvar cache IndexedDB", tx.error);
            reject(tx.error);
        };
    });
}
async function lerListaCache() {
    const db = await abrirDB();

    return new Promise((resolve) => {
        const tx = db.transaction(STORE_DOCS, "readonly");
        const store = tx.objectStore(STORE_DOCS);
        const req = store.getAll();

        req.onsuccess = () => {
            console.log(`📦 Cache lido: ${req.result.length} itens`);
            resolve(req.result || []);
        };

        req.onerror = () => {
            console.warn("⚠️ Falha ao ler cache");
            resolve([]);
        };
    });
}


function initializeTooltips() {
    // Busca todos os elementos que deveriam ser tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');

    // Tenta usar a classe Tooltip do Bootstrap
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        tooltipRetryCount = MAX_RETRIES; // Sucesso: impede novas tentativas
        
        // Inicializa os tooltips
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        // console.log("✅ Tooltips inicializados com sucesso.");
        return;

    } else if (tooltipRetryCount < MAX_RETRIES) {
        // Tenta novamente em 200ms
        tooltipRetryCount++;
        setTimeout(initializeTooltips, 200);
        
    } else {
        // Falha após todas as tentativas
        console.error("❌ Erro: Bootstrap JS Tooltip class não está disponível.");
    }
}

const documentsList = document.getElementById("documents-list");
const loadingModal = document.getElementById("loading-modal"); // 🚨 NOVO: Referência ao modal
const countDocsElement = document.getElementById("countDocs"); // 🚨 NOVO: Referência ao elemento de contagem
// variáveis globais
let todosDocumentos = []; // documentos usados para os cards (filtrados do assinador)
let listaBusca = [];      // lista completa usada pela busca (10k)

// ENDPOINT OFICIAL (lista do assinador)
const API_URL =
"https://www.intra.pg/SEAD/_api/web/lists(guid'DA67FC64-1B63-4608-B859-8DE4BC9B1FD8')/items" +
"?$filter=Finalidado eq false" +
"&$select=" +
[
  "ID",
  "Title",
  "Link_x0020_Documento",

  // Seus campos atuais
  "ContentType/Id",
  "Contagem",
  "Concluidos",
  "Categoria",
  "Locais",
  "ContagemSelecionados",
  "Calculado",

  // 🔽 NOVOS CAMPOS
  "Created",
  "Modified",
  "Author/Title",
  "Editor/Title"

].join(",") +

"&$expand=ContentType,Author,Editor" +
"&$top=30000";

console.log(API_URL);
// Endpoint para busca completa (10k)
const SEARCH_ENDPOINT =
"https://www.intra.pg/SEAD/_api/web/lists/getbyID('da67fc64-1b63-4608-b859-8de4bc9b1fd8')/items" +
"?$select=" +
[
  "ID",
  "Title",
  "Link_x0020_Documento",

  // campos da lista
  "ContentType/Id",
  "Contagem",
  "Concluidos",
  "Categoria",
  "Locais",
  "ContagemSelecionados",
  "Calculado",

  // 🔽 autor / edição
  "Created",
  "Modified",
  "Author/Title",
  "Editor/Title"

].join(",") +

"&$expand=ContentType,Author,Editor" +
"&$orderby=Modified desc" +   // 🔥 opcional (melhor UX)
"&$top=30000";

console.log(SEARCH_ENDPOINT);
// Contêiner onde será exibida a lista (cards)


function showToast(icon, title) {
    const Toast = Swal.mixin({
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#fff",
        color: "#000",
    });

    Toast.fire({ icon, title });
}

// ------------------------------
// Utilitários
// ------------------------------
function showLoading() {

    if (loadingModal) {
        loadingModal.style.display = "block";
    } else {
        // Fallback simples se o modal não for encontrado
        documentsList.innerHTML = "<p>Carregando documentos...</p>";
    }
}

function hideLoading() {
    if (loadingModal) {
        loadingModal.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicia app principal
    loadAssinador().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const termoBusca = urlParams.get('busca');
        if (termoBusca) {
            setTimeout(() => executarBusca(termoBusca), 500);
        }
    });

    // Configuração Botão Voltar (Extensão)
    const btnVoltar = document.getElementById('VoltaAssinador');
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (event) => {
            event.preventDefault();
            chrome.storage.local.remove("assinador_preferencia", () => {
                chrome.runtime.sendMessage({ action: "goToOriginalAssinador" });
            });
        });
    }

    // Configuração Botões do Menu Superior de Grupos
    document.getElementById('btnCriarGrupo')?.addEventListener('click', criarNovoGrupo);
    document.getElementById('btnGerenciarGrupos')?.addEventListener('click', deletarGrupoAtual);

    // Listener do select de filtros
    document.getElementById("selectGrupo")?.addEventListener("change", filtrarMisto);


    // Input de busca por Enter
    document.getElementById("Busca")?.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            executarBusca();
        }
    });
});

// Delegação de cliques no container dinamico da lista/tabela
if (documentsList) {
    documentsList.addEventListener("click", (e) => {
        // Ações de grupos na Tabela
        const btnAddTab = e.target.closest(".btn-adicionar-ao-grupo");
        const btnRemTab = e.target.closest(".btn-remover-do-grupo");
        
        // Ações Utilitárias de link e cópia
        const btnCopy = e.target.closest('.btn-copy-link');

        if (btnAddTab) {
            e.preventDefault();
            adicionarProcessoAoGrupo(btnAddTab.getAttribute("data-id"));
        } else if (btnRemTab) {
            e.preventDefault();
            removerProcessoDoGrupo(btnRemTab.getAttribute("data-id"));
        }else if (btnCopy) {
            const link = btnCopy.getAttribute('data-link');
            if (link) {
                navigator.clipboard.writeText(link).then(() => showToast("success", "Link copiado!"));
            }
        }
    });
}



function sanitizeLinkField(raw) {
    if (!raw) return null;
    // se já for objeto com Url
    if (typeof raw === "object" && raw && raw.Url) return raw.Url;

    const str = String(raw);

    // tenta extrair href de <a ... href="...">
    const hrefMatch = str.match(/href=(?:"|')([^"']+)(?:"|')/i);
    if (hrefMatch && hrefMatch[1]) return hrefMatch[1].trim();

    // às vezes o campo tem onclick="document.getElementById('siframe').src='https://...'"
    const onclickMatch = str.match(/['"]https?:\/\/[^'"]+/i);
    if (onclickMatch) return onclickMatch[0].replace(/^['"]/, '').trim();

    // tenta extrair URL simples no meio do texto
    const urlMatch = str.match(/https?:\/\/[^\s'">]+/i);
    if (urlMatch) return urlMatch[0].trim();

    // em alguns casos o campo já é apenas o ID (apenas letras/números)
    const idOnlyMatch = str.match(/^[A-Z0-9_-]{10,}$/i);
    if (idOnlyMatch) return idOnlyMatch[0].trim();

    return null;
}

// Extrai o ID do assinador a partir da URL (pega a parte depois de /assinar/).
// Se o parâmetro já for um ID, devolve o ID.
function extrairIdAssinador(rawLink) {
    if (!rawLink) return null;

    let str = String(rawLink).trim();

    //
    // 1️⃣ Se já for só o ID
    //
    if (/^[A-Z0-9]{20,50}$/i.test(str)) {
        return str;
    }

    //
    // 2️⃣ Se houver HTML (extrair href)
    //
    const hrefMatch = str.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
        str = hrefMatch[1];
    }

    //
    // 3️⃣ Limpar onclick="... 'URL' ..."
    //
    const onclickMatch = str.match(/['"](https:\/\/assinadordigitalexterno[^'"]+)/i);
    if (onclickMatch) {
        str = onclickMatch[1];
    }

    //
    // 4️⃣ Extrair o ID após /assinar/
    //
    const tokenMatch = str.match(/\/assinar\/([A-Z0-9]+)(?=\?|$)/i);
    if (tokenMatch) {
        return tokenMatch[1];
    }

    //
    // 5️⃣ Procura por um token isolado
    //
    const fallback = str.match(/[A-Z0-9]{25,50}/i);
    if (fallback) {
        return fallback[0];
    }

    console.warn("extrairIdAssinador: não conseguiu extrair de", rawLink);
    return null;
}

// =======================================================================
// 🔥 FUNÇÃO CORRIGIDA: VERIFICA ASSINATURAS PENDENTES
// Resolve o problema de listar TODAS as secretarias e falha de mapeamento.
// =======================================================================
function verificarAssinaturasPendentes(locais_necessarios, assinaturas_feitas, secretarias_map) {
    const normalize = str =>
    (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

    // 1. Set de todos os nomes que REALMENTE ASSINARAM (para busca rápida)
    const responsaveis_que_assinaram = new Set(
        assinaturas_feitas.map(a => normalize(a.responsavel))
        );

    // 2. Mapa de Lookups (Local da API -> Dados da Secretaria)
    const localParaSecretariaMap = new Map();
    secretarias_map.forEach(sec => {
        localParaSecretariaMap.set(normalize(sec.abreviacao), sec);
        localParaSecretariaMap.set(normalize(sec.secretaria), sec);
        // Mapeamentos manuais... (inclua todos os seus mapeamentos aqui)
        if (sec.abreviacao === "GP") { localParaSecretariaMap.set(normalize("GERAL DO GABINETE"), sec); }
        if (sec.abreviacao === "Ações da Cidadania") { localParaSecretariaMap.set(normalize("SUBS. DE AÇÕES DE CIDADANIA"), sec); }
        if (sec.abreviacao === "Assuntos da Juventude") { localParaSecretariaMap.set(normalize("SUBS. DE ASSUNTOS DA JUVENTUDE"), sec); }
        if (sec.abreviacao === "Controle Interno") { localParaSecretariaMap.set(normalize("SUBS. DE CONTROLE INTERNO"), sec); }
        if (sec.abreviacao === "Comunicação Social") { localParaSecretariaMap.set(normalize("SUBS. DE COMUNICACAO SOCIAL"), sec); }
    });

    const resultado = [];
    
    // 3. Rastreamento:
    // a) Chaves de Secretarias Oficiais/Locais (para evitar duplicatas requeridas)
    const chavesRequeridasProcessadas = new Set(); 
    // b) Nomes dos signatários que cobriram uma assinatura REQUERIDA (para subtrair da lista de Extras)
    const responsaveis_accounted_for = new Set(); 

    // 4. Lógica de ITENS REQUERIDOS (Mapeados ou Não)
    for (const local of locais_necessarios) {
        const localNorm = normalize(local);
        const sec = localParaSecretariaMap.get(localNorm);

        if (sec) {
            // ITEM REQUERIDO MAPEADO
            const chave = sec.abreviacao;
            if (chavesRequeridasProcessadas.has(chave)) continue;
            chavesRequeridasProcessadas.add(chave);
            
            const nomeResponsavelNorm = normalize(sec.nome);
            const assinado = responsaveis_que_assinaram.has(nomeResponsavelNorm);
            
            if (assinado) {
                // Se o signatário oficial necessário assinou, ele está ACCOUNTED FOR.
                responsaveis_accounted_for.add(nomeResponsavelNorm); 
            }
            
            resultado.push({
                abreviacao: sec.abreviacao,
                secretaria: sec.secretaria,
                assinado: assinado,
                responsavel: assinado ? sec.nome : null
            });
            
        } else {
            // ITEM REQUERIDO NÃO MAPEADO (Vai aparecer como warning: Pendente/Desconhecido)
            const chave = localNorm; 
            // Evita duplicatas de nomes não mapeados que apareceram várias vezes no input
            if (chavesRequeridasProcessadas.has(chave)) continue;
            chavesRequeridasProcessadas.add(chave); 

            resultado.push({
                abreviacao: local, 
                secretaria: local, 
                assinado: false,
                responsavel: "Não mapeado (Pendente)" // Flag para Yellow badge
            });
        }
    }
    
    // 5. Lógica de ITENS EXTRAS (Signatários que ASSINARAM, mas não são responsáveis REQUERIDOS)
    const extraSignersAdded = new Set(); 

    for (const assinatura of assinaturas_feitas) {
        const signatarioNome = assinatura.responsavel;
        const signatarioNorm = normalize(signatarioNome);

        // Se o nome do signatário já cobriu um requisito, ignore.
        if (responsaveis_accounted_for.has(signatarioNorm)) {
            continue; 
        }

        // Evita duplicatas na lista de signatários extra
        if (extraSignersAdded.has(signatarioNorm)) {
            continue; 
        }
        extraSignersAdded.add(signatarioNorm);

        // É um signatário extra
        resultado.push({
            // Usamos o nome do signatário como a 'abreviação' para o badge
            abreviacao: signatarioNome, 
            secretaria: "Assinatura Especial",
            assinado: true, 
            responsavel: "Signatário Extra" // Flag para Yellow badge
        });
    }

    return resultado;
}

async function startRealSignaturesUpdateTabela(lista) {
    const linhas = document.querySelectorAll("#documents-list table tbody tr");
    if (!linhas.length) return;

    // Mapeia cada linha da tabela para uma Promessa de atualização de assinatura
    const updatePromises = [...linhas].map(row => {
        const idAssinador = row.getAttribute("data-id");
        const sigCell = row.querySelector(".td-assinaturas");

        const docId = row.querySelector("td")?.innerText;
        const doc = lista.find(x => String(x.ID) === String(docId));

        if (!idAssinador || !sigCell || !doc) return Promise.resolve();
        
        // Retorna a promessa da busca e renderização da linha (que injeta o SPAN)
        return buscarAssinaturasTabela(idAssinador, sigCell, doc);
    });

    // 💡 AGUARDA: Espera que todas as chamadas a buscarAssinaturasTabela terminem
    await Promise.all(updatePromises);

    // 🔥 PONTO CRÍTICO: Inicializa os tooltips para os elementos recém-criados
    initializeTooltips();
}

// =======================================================================
// 🔥 GARANTIDO: Aplica badge Amarelo/Warning para itens não mapeados
// =======================================================================
function generateAssinaturaTooltipContent(status_assinaturas, agrupadas = {}) {

    let tooltipHtml = `<span class='d-block text-center mb-1'>SECRETARIAS</span>`;
    
    const normalize = str =>
    (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

    const badgesHtml = status_assinaturas.map(status => {
        let label = status.abreviacao || status.secretaria;
        let type = 'secondary';

        const nomeComparacao = status.responsavel;

        const key = Object.keys(agrupadas).find(k =>
            k === normalize(nomeComparacao)
            );

        if (key && agrupadas[key].count > 1) {
            label = `${agrupadas[key].count}x ${label}`;
        }

        if (status.responsavel === "Não mapeado (Pendente)") {
            type = 'warning';
        } else if (status.responsavel === "Signatário Extra") {
            type = 'warning';
        } else if (status.assinado) {
            type = 'success';
        }

        return `<span class='badge text-bg-${type} d-inline-block me-1 mb-1'>${label}</span>`;
    }).join("");

    // 🔥 AGORA SIM junta tudo
    tooltipHtml += badgesHtml;

    // 🔥 E RETORNA
    return tooltipHtml;
}


async function buscarAssinaturasTabela(id, elementoDestino, doc) {
    if (!id || !elementoDestino) return;
    const listatotal = doc.Locais.results;
    const assinaturas = await buscarAssinaturas(id);

    const agrupadas = agruparAssinaturas(assinaturas);

// Conta apenas únicos
    const concluidos = Object.keys(agrupadas).length;

    const total = Number(doc.Contagem) || 0;

    // 1. Obtém o status de assinatura para todas as secretarias necessárias
    const status_assinaturas = verificarAssinaturasPendentes(
        listatotal,
        assinaturas,
        secretarias
        );

    const required_statuses = status_assinaturas.filter(status => {
        // Exclui a entrada de fallback "Não mapeado" (se implementada)
        return !(status.abreviacao === status.secretaria && status.responsavel === 'Não mapeado (Pendente)');
    });

    // Conta os concluídos (badges 'success')
    const display_concluidos = required_statuses.filter(s => s.assinado).length;

    // Conta o total de secretarias mapeadas/requeridas
    const display_total = required_statuses.length;
    // 2. Gera o HTML do conteúdo do Tooltip (lista de badges)
    const tooltipContent = generateAssinaturaTooltipContent(status_assinaturas, agrupadas);

    // 4. Monta o HTML final para a célula da tabela
    // Substitui aspas duplas internas por &quot; para evitar quebras no atributo data-bs-title.
    const escapedTooltipContent = tooltipContent.replace(/"/g, '&quot;');
    var colortextspan = "dark";
    if(concluidos > total){
        colortextspan = "success";
    }else if(concluidos == total){
        colortextspan = "primary";
    }
    const finalHtml = `
        <span
            class="fw-bold text-${colortextspan} "
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            data-bs-html="true"
            data-bs-title="${escapedTooltipContent}"
        >
            ${concluidos}/${total}
        </span>
    `;

    // 5. Atualiza o conteúdo da célula com o novo SPAN
    elementoDestino.innerHTML = finalHtml;

    // remove botão enviar se já houver assinaturas
    if (concluidos > 0) {
        const botao = elementoDestino.closest("tr").querySelector(".btn-enviar");
        if (botao) botao.remove();
    }
}

function agruparAssinaturas(assinaturas) {
    const normalize = str =>
    (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

    const contagem = {};

    assinaturas.forEach(a => {
        const nome = normalize(a.responsavel);

        if (!contagem[nome]) {
            contagem[nome] = {
                nomeOriginal: a.responsavel,
                count: 0
            };
        }

        contagem[nome].count++;
    });

    return contagem;
}


// Busca signers para um dado id. Trata 404 como "sem assinantes".
async function buscarAssinaturas(idOrLink) {

    // aceita id direto ou link que será sanitizado/extraído
    const possibleLink = sanitizeLinkField(idOrLink) || idOrLink;
    const id = extrairIdAssinador(possibleLink);

    if (!id) {
        // console.debug("buscarAssinaturas: id inválido para", idOrLink);
        return [];
    }

    const url = `https://assinadordigitalexterno.praiagrande.sp.gov.br/sign/pades/signers/${id}`;

    try {
        const res = await fetch(url, {
            method: "GET",
            credentials: "include"
        });

    // Se for 404, retornamos vazio imediatamente sem tentar ler o JSON
        if (res.status === 404) {
            return [];
        }

    // Se houver outro erro (500, 403, etc)
        if (!res.ok) {
            return [];
        }

        const data = await res.json();
        return Array.isArray(data) ? data : [];

    } catch (e) {
    // Erros de rede (DNS, offline, timeout) caem aqui
        console.error("Erro de conexão ao buscar assinaturas:", e);
        return [];
    }
}

// ------------------------------
// Data fetching
// ------------------------------

async function fetchDocuments() {
    try {
        const res = await fetch(API_URL, {
            method: "GET",
            headers: { "Accept": "application/json;odata=verbose" },
            credentials: "include"
        });
        

        if (!res.ok) {
            console.error("Erro ao buscar itens:", res.status, res.statusText);
            return [];
        }

        const data = await res.json();
        return data.d && data.d.results ? data.d.results : [];
    } catch (e) {
        console.error("fetchDocuments erro:", e);
        return [];
    }
}

async function buscarListaCompleta() {

    // 1️⃣ Se já está em memória (sessão atual), retorna
    if (listaBusca.length > 0) {
        return listaBusca;
    }

    // 2️⃣ Tenta ler do IndexedDB
    const cache = await lerListaCache();

    if (cache.length > 0) {
        console.log(`⚡ Cache local carregado: ${cache.length} registros`);
        listaBusca = cache;

        // Atualiza em background (sem travar)
        atualizarCacheEmBackground(cache);

        return listaBusca;
    }

    // 3️⃣ Não tem cache → busca tudo
    console.log("🌐 Cache vazio, buscando lista completa...");
    const lista = await buscarListaCompletaDoServidor();

    if (lista.length > 0) {
        listaBusca = lista;
        await salvarListaCache(lista);
    }

    return listaBusca;
}

async function buscarListaCompletaDoServidor() {
    try {
        const res = await fetch(SEARCH_ENDPOINT, {
            method: "GET",
            headers: { "Accept": "application/json;odata=verbose" },
            credentials: "include"
        });

        if (!res.ok) {
            console.error("Erro ao buscar lista completa:", res.status);
            return [];
        }

        const data = await res.json();
        return data.d?.results || [];
    } catch (e) {
        console.error("Erro fetch lista completa:", e);
        return [];
    }
}

async function atualizarCacheEmBackground(cacheAtual) {
    setTimeout(async () => {
        console.log("🔄 Atualizando cache em background...");

        const listaNova = await buscarListaCompletaDoServidor();

        if (listaNova.length === 0) return;

        // Mescla por ID
        const map = new Map(cacheAtual.map(item => [item.ID, item]));
        listaNova.forEach(item => map.set(item.ID, item));

        const listaMesclada = Array.from(map.values());

        // Atualiza memória + IndexedDB
        listaBusca = listaMesclada;
        await salvarListaCache(listaMesclada);

        console.log(`✅ Cache atualizado: ${listaMesclada.length} registros`);
    }, 200);
}



function preloadListaBusca() {
    // Se já carregou antes, não faz nada
    if (listaBusca.length > 0) return;

    // Roda em background sem travar a página
    setTimeout(() => {
        console.log("🔄 Pré-carregando lista de busca (10k) em background...");
        buscarListaCompleta().then(() => {
            console.log(`✅ Lista completa carregada (cache): ${listaBusca.length} registros`);
            showToast("success", "Página Carregada!");
        });
    }, 100);
}



// =======================================================================
// TRIANGULAÇÃO: SECRETARIAS x ASSINATADORES (função original do usuário)
// A função `verificarAssinaturasPendentes` acima é a recomendada para a tarefa.
// Esta função abaixo (mapearAssinaturasPorSecretaria) está mantida
// porque ela gera os badges HTML e pode ser usada em outro lugar do seu código.
// =======================================================================
function mapearAssinaturasPorSecretaria(assinaturas, secretarias, locaisProcesso) {

    // Normaliza textos
    const normalize = str =>
    (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

    // Lista com todos os nomes que assinaram
    const nomesAssinantes = assinaturas.map(a => normalize(a.responsavel));

    let secretariasProcesso = [];

    locaisProcesso.forEach(local => {
        const localNorm = normalize(local);

        // Verifica se o local existe na lista de secretarias oficiais
        const sec = secretarias.find(s => normalize(s.abreviacao) === localNorm);

        if (sec) {
            const assinou = nomesAssinantes.includes(normalize(sec.nome));

            secretariasProcesso.push({
                abreviacao: sec.abreviacao,
                nome: sec.nome,
                assinou,
                tipo: assinou ? "success" : "secondary"
            });

        } else {
            // Não existe no array oficial → warning
            secretariasProcesso.push({
                abreviacao: local,
                nome: local,
                assinou: false,
                tipo: "warning"
            });
        }
    });

    // Badges HTML
    const badgesHTML = secretariasProcesso.map(s => `
        <span class="badge text-bg-${s.tipo} me-1">${s.abreviacao}</span>
    `).join("");

    return {
        total: secretariasProcesso.length,
        assinadas: secretariasProcesso.filter(s => s.assinou).length,
        badgesHTML,
        secretariasProcesso
    };
}




//CRIADORES - GRUPOS - FILTROS


//FILTROS MISTOS
function renderizarOpcoesMistas() {
    const select = document.getElementById("selectGrupo"); // Usando o select que você já tem
    if (!select) return;

    const listaGrupos = obterGrupos();
    const criadores = [...new Set(todosDocumentos.map(doc => doc.Author?.Title?.split(/ - | RF/i)[0].trim()).filter(Boolean))].sort();

    let html = '<option value="todos">📁 Todos os Documentos</option>';

    // Seção de Grupos
    html += '<optgroup label="Seus Grupos">';
    for (const nome in listaGrupos) {
        const qtd = listaGrupos[nome].length;
        html += `<option value="grupo:${nome}">📂 ${nome} (${qtd})</option>`;
    }
    html += '</optgroup>';

    // Seção de Criadores
    html += '<optgroup label="Filtrar por Criador">';
    criadores.forEach(nome => {
        html += `<option value="criador:${nome}">👤 ${nome}</option>`;
    });
    html += '</optgroup>';

    select.innerHTML = html;
}

async function filtrarMisto() {
    const select = document.getElementById("selectGrupo");
    const valorSelecionado = select.value;

    if (valorSelecionado === "todos") {
        aplicarModoVisualizacao(todosDocumentos, false);
        return;
    }

    showLoading();
    let filtrados = [];

    if (valorSelecionado.startsWith("grupo:")) {
        const nomeGrupo = valorSelecionado.replace("grupo:", "");
        const listaGrupos = obterGrupos();
        const idsNoGrupo = (listaGrupos[nomeGrupo] || []).map(id => String(id));
        
        filtrados = todosDocumentos.filter(doc => idsNoGrupo.includes(String(doc.ID)));
        
        if (filtrados.length < idsNoGrupo.length) {
            const listaCache = await buscarListaCompleta();
            filtrados = listaCache.filter(doc => idsNoGrupo.includes(String(doc.ID)));
        }
    } else if (valorSelecionado.startsWith("criador:")) {
        const nomeCriador = valorSelecionado.replace("criador:", "");
        // Filtra os documentos originais pelo nome do autor
        filtrados = todosDocumentos.filter(doc => {
            const nomeBruto = doc.Author?.Title || "";
            return nomeBruto.includes(nomeCriador);
        });
    }

    // A função aplicarModoVisualizacao chamará renderTabela/renderLista 
    // que agora já possuem a lógica correta para checar o prefixo "grupo:"
    aplicarModoVisualizacao(filtrados, false);
    hideLoading();
}

// ================================================
// GERENCIAMENTO DE GRUPOS
// ================================================
// --- Estado Global dos Grupos ---
let grupos = JSON.parse(localStorage.getItem("assinador_grupos")) || {};

// --- Funções de Gestão de Dados ---
function obterGrupos() {
    try {
        const armazenado = localStorage.getItem("assinador_grupos");
        if (!armazenado || armazenado === "undefined" || armazenado === "null") return {};
        
        const dados = JSON.parse(armazenado);
        if (typeof dados !== 'object' || dados === null) return {};
        return dados;
    } catch (e) {
        return {};
    }
}

function salvarGrupos(novosGrupos) {
    // Se por algum motivo vier vazio, a gente recupera o que já existe ou salva vazio
    const dadoSeguro = (novosGrupos && typeof novosGrupos === 'object') ? novosGrupos : {};
    
    localStorage.setItem("assinador_grupos", JSON.stringify(dadoSeguro));
    renderizarOpcoesMistas();
}

function atualizarSelectGrupos() {
    const select = document.getElementById("selectGrupo");
    if (!select) return;
    
    const valorAtual = select.value;
    select.innerHTML = '<option value="todos">📁 Todos os Documentos</option>';
    
    Object.keys(grupos).forEach(nome => {
        const opt = document.createElement("option");
        opt.value = nome;
        opt.textContent = `📂 ${nome} (${grupos[nome].length})`;
        select.appendChild(opt);
    });
    select.value = valorAtual;
}

// --- Funções de Interface ---

async function criarNovoGrupo() {
    const { value: nomeGrupo } = await Swal.fire({
        title: 'Novo Grupo',
        input: 'text',
        inputPlaceholder: 'Nome do grupo...',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) return 'O nome não pode ser vazio!';
            const grupos = obterGrupos();
            if (grupos[value]) return 'Este grupo já existe!';
        }
    });

    if (nomeGrupo) {
        const gruposAtuais = obterGrupos();
        // IMPORTANTE: Criamos o grupo já com um array vazio
        gruposAtuais[nomeGrupo] = []; 
        
        salvarGrupos(gruposAtuais); // Aqui não vai mais dar erro de "inválido"
        
        await Swal.fire('Sucesso!', `Grupo "${nomeGrupo}" criado.`, 'success');
        
        // Seleciona e filtra automaticamente
        const select = document.getElementById("selectGrupo");
        if (select) {
            select.value = nomeGrupo;
            filtrarMisto();
        }
    }
}


async function deletarGrupoAtual() {
    const select = document.getElementById("selectGrupo");
    const valorSelecionado = select.value;

    // 🚨 VALIDAÇÃO: Impede excluir "Todos" ou filtros de "Criador"
    if (!valorSelecionado || valorSelecionado === "todos" || valorSelecionado.startsWith("criador:")) {
        Swal.fire({
            title: 'Não é possível excluir',
            text: 'Você só pode excluir grupos criados por você, não filtros de sistema ou criadores.',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    // Extrai o nome real do grupo (remove o prefixo "grupo:")
    const nomeGrupo = valorSelecionado.replace("grupo:", "");

    const { isConfirmed } = await Swal.fire({
        title: `Excluir "${nomeGrupo}"?`,
        text: "Os processos não serão apagados, apenas a pasta do grupo.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir'
    });

    if (isConfirmed) {
        const grupos = obterGrupos();
        delete grupos[nomeGrupo]; // Remove apenas o grupo do localStorage
        
        salvarGrupos(grupos); // Atualiza o cache e o select[cite: 2]
        
        select.value = "todos";
        filtrarMisto();
        showToast("success", "Grupo removido.");
    }
}

async function adicionarProcessoAoGrupo(idDoc) {
    const listaGrupos = obterGrupos();
    const nomes = Object.keys(listaGrupos);
    
    if (nomes.length === 0) {
        const { isConfirmed } = await Swal.fire({
            title: 'Nenhum grupo!',
            text: 'Crie um grupo primeiro no menu superior.',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Criar agora'
        });
        if (isConfirmed) document.getElementById('btnNovoGrupo')?.click();
        return;
    }

    const { value: grupoAlvo } = await Swal.fire({
        title: 'Adicionar ao Grupo',
        input: 'select',
        inputOptions: nomes.reduce((acc, curr) => ({...acc, [curr]: curr}), {}),
        showCancelButton: true,
        confirmButtonText: 'Adicionar'
    });

    if (grupoAlvo) {
        const idStr = String(idDoc);
        // Garante que o array do grupo existe
        if (!listaGrupos[grupoAlvo]) listaGrupos[grupoAlvo] = [];

        if (!listaGrupos[grupoAlvo].includes(idStr)) {
            listaGrupos[grupoAlvo].push(idStr);
            salvarGrupos(listaGrupos);
            showToast("success", `Adicionado a ${grupoAlvo}`);
            
            // Se estivermos vendo um grupo, atualiza a tela
            if (document.getElementById("selectGrupo").value !== "todos") {
                filtrarMisto();
            }
        } else {
            showToast("info", "Este processo já está no grupo.");
        }
    }
}

async function removerProcessoDoGrupo(idDoc) {
    const select = document.getElementById("selectGrupo");
    let valorSelecionado = select ? select.value : "todos";
    
    // Se não estiver em um modo de grupo, não há o que remover "do grupo"
    if (!valorSelecionado.startsWith("grupo:")) return;

    // Extrai o nome real (ex: "grupo:TESTE" vira "TESTE")
    const nomeGrupo = valorSelecionado.replace("grupo:", "");

    const { isConfirmed } = await Swal.fire({
        title: 'Remover do grupo?',
        text: `Remover este processo de "${nomeGrupo}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sim, remover'
    });

    if (isConfirmed) {
        let gruposAtuais = obterGrupos();
        const idStr = String(idDoc);

        if (gruposAtuais[nomeGrupo]) {
            // Filtra a lista removendo o ID
            gruposAtuais[nomeGrupo] = gruposAtuais[nomeGrupo].filter(id => String(id) !== idStr);
            
            // Salva no localStorage
            localStorage.setItem("assinador_grupos", JSON.stringify(gruposAtuais));
            
            // Atualiza a interface
            renderizarOpcoesMistas(); // Atualiza contadores no select
            select.value = valorSelecionado; // Mantém o grupo selecionado
            filtrarMisto(); // Recarrega a lista na tela
            
            showToast("success", "Removido do grupo");
        }
    }
}


// --- Delegação de Eventos (O segredo para extensões) ---

document.addEventListener('click', function(e) {
    // Verifica se clicou no botão de adicionar ao grupo (que terá a classe btn-add-grupo)
    const btnAdd = e.target.closest('.btn-add-grupo');
    if (btnAdd) {
        const idDoc = btnAdd.getAttribute('data-id');
        adicionarProcessoAoGrupo(idDoc);
    }
});


// Listener do Select
document.getElementById("selectGrupo")?.addEventListener("change", filtrarMisto);

// Listener para criar e apagar
document.getElementById('btnCriarGrupo')?.addEventListener('click', criarNovoGrupo);

// Versão limpa para deletar grupos
document.getElementById('btnGerenciarGrupos')?.addEventListener('click', deletarGrupoAtual);


// Inicialização
atualizarSelectGrupos();


function formatarData(dataISO) {
    if (!dataISO) return "-";

    const data = new Date(dataISO);

    if (isNaN(data)) return "-";

    return data.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}


// ===================================================
// RENDERIZAÇÃO EM TABELA (NOVO)
// ===================================================
function renderTabela(lista) {
    const container = document.getElementById("documents-list");
    if (!container) return;
    
    container.innerHTML = "";
    let html = `
    <table id="documents-table" class="table table-bordered table-striped shadow-sm">

        <thead class="table-dark">
            <tr>
                <th class='d-none'>ID</th>

                <th class='text-center' >Editar</th>
                <th>Título</th>
                <th class='text-center text-withe'>Categoria</th>
                <th class='text-center'>Assinaturas</th>
                <th class='text-center'> Ações </th>
            </tr>
        </thead>
        <tbody>
    `;

    for (const doc of lista) {

        const link = sanitizeLinkField(doc.Link_x0020_Documento);
        const idAssinador = extrairIdAssinador(link);
        const valorFiltroTabela = document.getElementById("selectGrupo")?.value || "todos";
// Verifica se o filtro ativo é de fato um GRUPO
        const modoLixeira = valorFiltroTabela.startsWith("grupo:");

// Define ícone e cor
        const iconeAcao = modoLixeira ? "fa-trash" : "fa-folder-plus";
        const classeCor = modoLixeira ? "btn-outline-danger" : "";
        const classeIdentificadora = modoLixeira ? "btn-remover-do-grupo" : "btn-adicionar-ao-grupo";

        const criadoPor = doc.Author?.Title || "-";
        const dataCriacao = doc.Created ? formatarData(doc.Created) : "-";

        const editadoPor = doc.Editor?.Title || "-";
        const dataEdicao = doc.Modified ? formatarData(doc.Modified) : "-";


        html += `
            <tr data-id="${idAssinador || ''}" >
                <td class='d-none'>${doc.ID}</td>
                <td class='text-center'>
                    <a target="_blank"
                        href="http://www.intra.pg/SEAD/_layouts/15/listform.aspx?PageType=6&ListId=%7BDA67FC64%2D1B63%2D4608%2DB859%2D8DE4BC9B1FD8%7D&ID=${doc.ID}"
                        class="btn btn-sm btn-secondary">
                       <i class="fa fa-cog" aria-hidden="true"></i>

                    </a>



                </td>

                 <td class="td-titulo position-relative fw-bold">

                    <a class="text-dark" href="${link || '#'}" target="_blank">
                        ${doc.Title}
                    </a>


    <i class="fa-solid fa-circle-info info-icon"
       data-bs-toggle="tooltip"
       data-bs-placement="right"
       data-bs-html="true"
       data-bs-title="
         <b>Criado:</b> ${criadoPor} -
         <b>Data:</b> ${dataCriacao}<br>
         <hr class='m-1'>
         <b>Editado:</b> ${editadoPor} -
         <b>Data:</b> ${dataEdicao}
       ">
    </i>


                </td>

                <td class='text-center text-dark'>${doc.Categoria || ""}</td>

                <td class="td-assinaturas text-center">
                    Carregando...
                </td>
                <td class='text-center'>

               <div class=" d-flex justify-content-around align-items-center w-100 " role="group" aria-label="Basic example">
              <a target="_blank" class='app-icon link-offset-2 link-underline link-underline-opacity-0'
                        href="https://assinadordigitalexterno.praiagrande.sp.gov.br/pdfjs-4.5/web/viewer.html?file=/impressao/${idAssinador}"
                        class="btn btn-sm ms-1">
                       <i class="fa fa-eye text-info-emphasis" aria-hidden="true"></i>

                    </a>
<div class="vr bg-dark"></div>
             <a target="_blank" class='app-icon link-offset-2 link-underline link-underline-opacity-0'
                        href="https://assinadordigitalexterno.praiagrande.sp.gov.br/impressao/${idAssinador}"
                        class="btn btn-sm text-primary-emphasis me-1">
                       <i class="fa fa-download text-info-emphasis" aria-hidden="true"></i>

                    </a>
<div class="vr bg-dark"></div>
                    <button type="button" 
            class="btn btn-sm btn-copy-link app-icon link-offset-2 link-underline link-underline-opacity-0 border-0 bg-transparent text-info-emphasis"
            data-link="${link}"
            title="Copiar Link">
        <i class="fa-solid fa-link text-info-emphasis"></i>
    </button>
            <div class="vr bg-dark d-none"></div>
              <button type="button" 
            class="btn btn-sm btn-print app-icon link-offset-2 link-underline link-underline-opacity-0 border-0 bg-transparent text-info-emphasis d-none"
            data-link="https://assinadordigitalexterno.praiagrande.sp.gov.br/pdfjs-4.5/web/viewer.html?file=/impressao/${idAssinador}"
            title="Imprimir">
        <i class="fa-solid fa-print text-info-emphasis"></i>
    </button>
 <div class="vr bg-dark"></div>
        <button class="btn btn-sm ${classeCor} ${classeIdentificadora} float-end" 
            data-id="${doc.ID}" 
            title="${modoLixeira ? 'Remover do grupo' : 'Adicionar ao grupo'}">
        <i class="fa ${iconeAcao}"></i>
    </button>
                </div>


                </td>

            </tr>
        `;
    }

    html += "</tbody></table>";

    documentsList.innerHTML = html;

    // 🔥 Atualiza assinaturas REAL-TIME
    startRealSignaturesUpdateTabela(lista);
}
// Delegação de evento global
document.addEventListener('click', function (e) {
    const btnCopy = e.target.closest('.btn-copy-link');
    const btnPrint = e.target.closest('.btn-print');

    // Lógica de Copiar (Mantida)
    if (btnCopy) {
        const link = btnCopy.getAttribute('data-link');
        if (link) {
            navigator.clipboard.writeText(link).then(() => {
                if (typeof showToast === 'function') showToast("success", "Link copiado!");
                else alert("Copiado!");
            });
        }
    }

    // Lógica de Imprimir (Nova Abordagem)
    if (btnPrint) {
        const linkPDF = btnPrint.getAttribute('data-link');

        // 1. Confirmação antes de qualquer ação
        Swal.fire({
            title: 'Deseja imprimir?',
            text: "O documento será aberto para impressão (2 vias).",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, imprimir!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // 2. Abre a janela IMEDIATAMENTE após o clique no OK
                // O navegador aceita melhor o comando de impressão se houver interação humana
                const win = window.open(linkPDF, '_blank');

                if (win) {
                    win.focus();

                    // 3. Aguarda o PDF.js carregar (4 segundos é o ideal para o portal da PG)
                    setTimeout(() => {
                        try {
                            // Primeira via
                            win.print();
                            
                            // Segunda via (dispara após a primeira ser fechada/confirmada)
                            setTimeout(() => {
                                win.print();
                            }, 1500);
                        } catch (err) {
                            console.warn("Bloqueio de segurança: O site da prefeitura impediu o comando automático.");
                            if (typeof showToast === 'function') {
                                showToast("info", "Use o ícone de impressora da página que abriu.");
                            }
                        }
                    }, 4000); 
                } else {
                    Swal.fire('Erro', 'O bloqueador de pop-ups impediu a impressão.', 'error');
                }
            }
        });
    }
});




// ------------------------------
// Busca (10k) -> filtra e renderiza como cards também
// ------------------------------
function normalizarParaBusca(str) {
    if (!str) return "";
    // Remove pontos, traços e barras e converte para minúsculo
    return str.toString().toLowerCase().replace(/[\.\-\/]/g, "").trim();
}



async function executarBusca(termoManual = null) {
    const input = document.getElementById("Busca");
    // Se termoManual existir, usa ele; senão, pega o valor do input
    const valorOriginal = termoManual !== null ? termoManual : (input ? input.value : "");
    const valorLimpo = normalizarParaBusca(valorOriginal);

    if (valorOriginal.trim() === "") {
        aplicarModoVisualizacao(todosDocumentos, false);
        return; 
    }

    showLoading();

    // Sincroniza o campo de busca visualmente se a busca veio por link
    if (termoManual && input) {
        input.value = termoManual;
    }

    const lista = await buscarListaCompleta();

    const resultados = lista.filter(item => {
        if (item.Categoria && String(item.Categoria).toLowerCase().trim() === "empenho") {
            return false;
        }
        
        // Compara o termo limpo com o título e ID também limpos
        const tituloLimpo = normalizarParaBusca(item.Title);
        const idString = String(item.ID);

        return tituloLimpo.includes(valorLimpo) || idString.includes(valorLimpo);
    });
    const filtroAtivo = document.getElementById("selectGrupo")?.value;
    if (filtroAtivo && filtroAtivo !== "todos") {
        if (filtroAtivo.startsWith("criador:")) {
            const nomeCriador = filtroAtivo.replace("criador:", "");
            resultados = resultados.filter(doc => doc.Author?.Title?.includes(nomeCriador));
        } else if (filtroAtivo.startsWith("grupo:")) {
            const nomeGrupo = filtroAtivo.replace("grupo:", "");
            const grupos = obterGrupos();
            const idsNoGrupo = (grupos[nomeGrupo] || []).map(id => String(id));
            resultados = resultados.filter(doc => idsNoGrupo.includes(String(doc.ID)));
        }
    }

    aplicarModoVisualizacao(resultados, false);
    hideLoading();
}

function atualizarContagem(count) { // 🚨 NOVO: Função para atualizar o texto do countDocs
    if (countDocsElement) {
        countDocsElement.textContent = `${count} Documento${count !== 1 ? 's' : ''}`;
    }
}
// ------------------------------
// Inicialização: carrega os itens do assinador e exibe cards
// ------------------------------
// ------------------------------
// Inicialização: carrega os itens do assinador e exibe cards
// ------------------------------
async function loadAssinador() {
    if (!documentsList) {
        console.error("Container 'documents-list' não encontrado no HTML.");
        return;
    }
    showLoading();
    documentsList.innerHTML = "<p>Carregando documentos...</p>";

    const items = await fetchDocuments();

    const SECRETARIAS_PROIBIDAS = [
        "SESAP", "SETRAN", "SEDUC", "SEFIN", "SUBJUV",
        "SEEL", "SEAS", "SEG", "GP", "SEHAB", "SEAD"
    ];
    
    const filtrados = (items || []).filter(doc => {
        // ... (Sua lógica de filtragem)
        if (doc.Categoria && String(doc.Categoria).toLowerCase().trim() == "empenho") {
            return false;
        }

        if (!doc.Title) return false;
        const titulo = String(doc.Title).toUpperCase().trim();
        if (/EMP/i.test(titulo)) return false; 
        if (/ESTORNO/i.test(titulo)) return false;
        const secretaria = titulo.split(" ")[0];
        if (SECRETARIAS_PROIBIDAS.includes(secretaria)) return false;
        return true;
    });

    todosDocumentos = filtrados;
    
    // 🚨 AQUI: Chame renderLista com TRUE para indicar que é a carga inicial
    // e que a atualização real deve ser disparada depois.
    //await renderLista(filtrados); 
    
    hideLoading();
    //console.log(todosDocumentos);
    renderizarOpcoesMistas();
    aplicarModoVisualizacao(todosDocumentos);

// 🚀 PRÉ-CARREGA A LISTA COMPLETA EM BACKGROUND PARA ACELERAR AS BUSCAS
    preloadListaBusca();
}


// função unificada que aplica o modo visual (recebe a lista a ser renderizada)
// isInitialLoad -> true somente quando é a primeira render após carregamento do SharePoint
function aplicarModoVisualizacao(listaParaExibir = todosDocumentos) {
    atualizarContagem(listaParaExibir.length);
    renderTabela(listaParaExibir || []);
}





// ------------------------------
// Eventos UI
// ------------------------------
const buscaInput = document.getElementById("Busca");
if (buscaInput) {
    buscaInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            executarBusca();
        }
    });
} else {
    console.warn("Campo de busca (#Busca) não encontrado — eventos não foram ligados.");
}



// Verifica se existe o parâmetro 'busca' na URL (Ex: lista.html?busca=123.456)
async function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const termoBusca = urlParams.get('busca');

    if (termoBusca) {
        // Aguarda um pouco para garantir que a carga inicial não sobreponha a busca
        setTimeout(() => {
            executarBusca(termoBusca);
        }, 500);
    }
}


loadAssinador().then(() => {
    verificarParametrosURL();
});



async function limparCacheBusca() {
    try {
        // 1. Limpa a variável global na memória do script
        listaBusca = [];

        // 2. Abre a conexão para limpar o banco de dados
        const db = await abrirDB();
        
        return new Promise((resolve, reject) => {
            // Criamos uma transação de escrita para as duas stores
            const tx = db.transaction([STORE_DOCS, STORE_META], "readwrite");
            
            tx.objectStore(STORE_DOCS).clear();
            tx.objectStore(STORE_META).clear();

            tx.oncomplete = () => {
                console.log("🧹 Cache do IndexedDB limpo com sucesso!");
                if (typeof showToast === "function") {
                    showToast("success", "Cache de busca limpo!");
                }
                resolve(true);
            };

            tx.onerror = () => {
                console.error("❌ Erro ao limpar o cache do IndexedDB:", tx.error);
                reject(tx.error);
            };
        });
    } catch (error) {
        console.error("Erro na rotina de limpeza de cache:", error);
    }
}


function garantirGrupo(boardName) {
    let grupos = JSON.parse(localStorage.getItem("assinador_grupos")) || {};
    if (!grupos[boardName]) {
        grupos[boardName] = [];
        localStorage.setItem("assinador_grupos", JSON.stringify(grupos));
    }
}


// Função para inicializar os componentes visuais de forma segura
function inicializarInterfaceModoVisual() {
    // 1. Liga o evento de clique no botão
    ligarToggleButton();
    
    // 2. Aplica o modo inicial que estava salvo no localStorage
    // Passa a lista atual se ela já existir, ou espera o carregamento do SharePoint
    const listaInicial = (typeof todosDocumentos !== 'undefined' && todosDocumentos) ? todosDocumentos : [];
    aplicarModoVisualizacao(listaInicial, true);
}

// Executa assim que o DOM básico estiver pronto
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarInterfaceModoVisual);
} else {
    inicializarInterfaceModoVisual();
}

// 🚨 SEGUNDA CAMADA DE PROTEÇÃO (Para injeções dinâmicas de HTML/SharePoint):
// Se o botão demorar para aparecer no DOM por causa de requisições assíncronas,
// tentamos ligar ele novamente a cada 1 segundo até encontrá-lo (máximo 5 tentativas)
let tentativasBotao = 0;
const checarBotaoInterval = setInterval(() => {
    const btn = document.getElementById("toggleView");
    if (btn) {
        //ligarToggleButton();
        // Atualiza o texto inicial do botão baseado no localStorage
        //btn.innerText = modoTabela ? "🗂 Visualizar como Cards" : "📄 Visualizar como Tabela";
        clearInterval(checarBotaoInterval);
    }
    tentativasBotao++;
    if (tentativasBotao >= 5) clearInterval(checarBotaoInterval);
}, 1000);



// 1. Configuração única e segura para os cliques de delegação do container principal
function inicializarDelegacaoCliques() {
    const container = document.getElementById("documents-list");
    if (!container) return;

    // Remove para evitar duplicados caso a função seja chamada mais de uma vez
    container.removeEventListener("click", tratarCliquesContainer);
    container.addEventListener("click", tratarCliquesContainer);
}

function tratarCliquesContainer(e) {
    // Identifica o botão clicado (mesmo se clicar no ícone interno)
    const btnAdd = e.target.closest(".btn-adicionar-ao-grupo");
    const btnRem = e.target.closest(".btn-remover-do-grupo");
    const btnCopy = e.target.closest('.btn-copy-link');

    if (btnAdd) {
        e.preventDefault();
        adicionarProcessoAoGrupo(btnAdd.getAttribute("data-id"));
    } 
    else if (btnRem) {
        e.preventDefault();
        removerProcessoDoGrupo(btnRem.getAttribute("data-id"));
    }
    else if (btnCardGrupo) {
        e.preventDefault();
        const id = btnCardGrupo.getAttribute("data-id");
        if (btnCardGrupo.getAttribute("data-modo") === "rem") {
            removerProcessoDoGrupo(id);
        } else {
            adicionarProcessoAoGrupo(id);
        }
    }
    else if (btnCopy) {
        e.preventDefault();
        const link = btnCopy.getAttribute('data-link');
        if (link) {
            navigator.clipboard.writeText(link).then(() => showToast("success", "Link copiado!"));
        }
    }
}

// 2. Ouvinte de verificação de parâmetros da URL pós-carga
async function verificarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const termoBusca = urlParams.get('busca');
    if (termoBusca) {
        setTimeout(() => {
            executarBusca(termoBusca);
        }, 500);
    }
}

// 3. ATIVAÇÃO COMPLETA NO FLUXO CORRETO DE CARREGAMENTO
// Removemos a chamada duplicada do fim do arquivo para centralizar tudo aqui
document.addEventListener('DOMContentLoaded', () => {
    
    // Inicializa a interface de grupos do localStorage antes do render
    atualizarSelectGrupos();

    // Executa a carga principal dos documentos vindos do SharePoint
    loadAssinador().then(() => {
        // Liga os eventos dinâmicos que dependem dos elementos renderizados
        inicializarDelegacaoCliques();
        ligarToggleButton();
        verificarParametrosURL();
    });

    // Configuração Botão Voltar (Extensão)
    const btnVoltar = document.getElementById('VoltaAssinador');
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (event) => {
            event.preventDefault();
            chrome.storage.local.remove("assinador_preferencia", () => {
                chrome.runtime.sendMessage({ action: "goToOriginalAssinador" });
            });
        });
    }

    // Configuração Botões Globais do Menu Superior
    document.getElementById('btnCriarGrupo')?.addEventListener('click', criarNovoGrupo);
    document.getElementById('btnGerenciarGrupos')?.addEventListener('click', deletarGrupoAtual);

    // Listener do select de filtros estruturado globalmente
    document.getElementById("selectGrupo")?.addEventListener("change", filtrarMisto);

    // Input de busca por Enter
    document.getElementById("Busca")?.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            executarBusca();
        }
    });
});

// Coloque isto dentro do seu init ou no final do arquivo
document.getElementById("documents-list")?.addEventListener("click", function(e) {
    // Identifica o botão clicado (mesmo se clicar no ícone interno)
    const btnAdd = e.target.closest(".btn-adicionar-ao-grupo");
    const btnRem = e.target.closest(".btn-remover-do-grupo");

    if (btnAdd) {
        e.preventDefault();
        const id = btnAdd.getAttribute("data-id");
        adicionarProcessoAoGrupo(id);
    } 
    else if (btnRem) {
        e.preventDefault();
        const id = btnRem.getAttribute("data-id");
        removerProcessoDoGrupo(id);
    }
});


