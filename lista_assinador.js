
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

//console.log(API_URL);
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

//console.log(SEARCH_ENDPOINT);
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
    // 1. Inicializa os grupos e elementos visuais de interface
    atualizarSelectGrupos();
    injetarElementosDeInterface();
    inicializarDelegacaoCliques();

    // 2. Executa a carga principal dos documentos APENAS UMA VEZ
    loadAssinador().then(() => {
        verificarParametrosURL();
    });

    // 3. Configuração do Botão Voltar
    const btnVoltar = document.getElementById('VoltaAssinador');
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (event) => {
            event.preventDefault();
            chrome.storage.local.remove("assinador_preferencia", () => {
                chrome.runtime.sendMessage({ action: "goToOriginalAssinador" });
            });
        });
    }

    // 4. Configurações de Eventos Globais
    document.getElementById('btnCriarGrupo')?.addEventListener('click', criarNovoGrupo);
    document.getElementById('btnGerenciarGrupos')?.addEventListener('click', deletarGrupoAtual);
    document.getElementById("selectGrupo")?.addEventListener("change", filtrarMisto);

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
        assinaturas_feitas.map(a => normalize(corrigirNomeAssinante(a.responsavel)))
    );
    
    // 2. Mapa de Lookups (Local da API -> Dados da Secretaria e Nome -> Dados da Secretaria)
    const localParaSecretariaMap = new Map();
    const nomeParaSecretariaMap = new Map(); // 🚨 NOVO: Mapa para identificar de onde é um signatário extra

    secretarias_map.forEach(sec => {
        localParaSecretariaMap.set(normalize(sec.abreviacao), sec);
        localParaSecretariaMap.set(normalize(sec.secretaria), sec);
        nomeParaSecretariaMap.set(normalize(sec.nome), sec); // Associa o nome à respectiva secretaria

        // Mapeamentos manuais...
        if (sec.abreviacao === "GP") { localParaSecretariaMap.set(normalize("GERAL DO GABINETE"), sec); }
        if (sec.abreviacao === "Ações da Cidadania") { localParaSecretariaMap.set(normalize("SUBS. DE AÇÕES DE CIDADANIA"), sec); }
        if (sec.abreviacao === "Assuntos da Juventude") { localParaSecretariaMap.set(normalize("SUBS. DE ASSUNTOS DA JUVENTUDE"), sec); }
        if (sec.abreviacao === "Controle Interno") { localParaSecretariaMap.set(normalize("SUBS. DE CONTROLE INTERNO"), sec); }
        if (sec.abreviacao === "Comunicação Social") { localParaSecretariaMap.set(normalize("SUBS. DE COMUNICACAO SOCIAL"), sec); }
    });

    const resultado = [];
    
    // 3. Rastreamento:
    const chavesRequeridasProcessadas = new Set(); 
    const responsaveis_accounted_for = new Set(); 

    // 4. Lógica de ITENS REQUERIDOS (Mapeados ou Não)
    for (const local of locais_necessarios) {
        const localNorm = normalize(local);
        const sec = localParaSecretariaMap.get(localNorm);

        if (sec) {
            const chave = sec.abreviacao;
            if (chavesRequeridasProcessadas.has(chave)) continue;
            chavesRequeridasProcessadas.add(chave);
            
            const nomeResponsavelNorm = normalize(sec.nome);
            const assinado = responsaveis_que_assinaram.has(nomeResponsavelNorm);
            
            if (assinado) {
                responsaveis_accounted_for.add(nomeResponsavelNorm); 
            }
            
            resultado.push({
                abreviacao: sec.abreviacao,
                secretaria: sec.secretaria,
                assinado: assinado,
                responsavel: assinado ? sec.nome : null
            });
            
        } else {
            const chave = localNorm; 
            if (chavesRequeridasProcessadas.has(chave)) continue;
            chavesRequeridasProcessadas.add(chave); 

            resultado.push({
                abreviacao: local, 
                secretaria: local, 
                assinado: false,
                responsavel: "Não mapeado (Pendente)"
            });
        }
    }
    
    // 5. Lógica de ITENS EXTRAS
    const extraSignersAdded = new Set(); 

    for (const assinatura of assinaturas_feitas) {
        const signatarioNomeOriginal = assinatura.responsavel;
        const signatarioNome = corrigirNomeAssinante(signatarioNomeOriginal);
        const signatarioNorm = normalize(signatarioNome);

        if (responsaveis_accounted_for.has(signatarioNorm)) {
            continue; 
        }

        if (signatarioNome === "SORAIA M. MILAN") {
            resultado.push({
                abreviacao: "SORAIA M. MILAN",
                secretaria: "Assinatura Aprovada",
                assinado: true, 
                responsavel: "SORAIA M. MILAN"
            });
            continue; 
        }

        if (extraSignersAdded.has(signatarioNorm)) {
            continue; 
        }
        extraSignersAdded.add(signatarioNorm);

        // 🚨 NOVO: Checa se este "Signatário Extra" pertence a alguma secretaria conhecida
        const secExtra = nomeParaSecretariaMap.get(signatarioNorm);

        if (secExtra) {
            // É um signatário extra que pertence a uma secretaria/sub
            resultado.push({
                abreviacao: secExtra.abreviacao, // Exibe o nome da Secretaria no badge
                secretaria: secExtra.secretaria,
                assinado: true, 
                responsavel: "Signatário Extra" // Mantém essa string para disparar o badge amarelo
            });
        } else {
            // Signatário não mapeado em nenhuma secretaria, mostra o nome original
            resultado.push({
                abreviacao: signatarioNomeOriginal, 
                secretaria: "Assinatura Especial",
                assinado: true, 
                responsavel: "Signatário Extra" 
            });
        }
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

function generateAssinaturaTooltipContent(status_assinaturas, agrupadas = {}, ultimaAssinaturaStr = "") {

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

    tooltipHtml += badgesHtml;

    // 🔥 Adiciona a última assinatura na base do Tooltip usando apenas classes do Bootstrap
    if (ultimaAssinaturaStr) {
        tooltipHtml += `<hr class='m-1 border-secondary'>`;
        tooltipHtml += `<span class='d-block text-center mt-1 small'>Ultima Assinatura: ${ultimaAssinaturaStr}</span>`;
    }

    return tooltipHtml;
}
async function buscarAssinaturasTabela(id, elementoDestino, doc) {
    if (!id || !elementoDestino) return;
    const listatotal = doc.Locais.results;
    const assinaturas = await buscarAssinaturas(id);

    // 🚨 DEBUG: Pressione F12 no navegador e olhe o Console para ver os campos exatos que a API retorna
    //console.log(`🔍 Assinaturas retornadas para o doc ${id}:`, assinaturas);

    const agrupadas = agruparAssinaturas(assinaturas);
    const concluidos = Object.keys(agrupadas).length;
    const total = Number(doc.Contagem) || 0;

    const status_assinaturas = verificarAssinaturasPendentes(listatotal, assinaturas, secretarias);

    // 🔥 NOVA LÓGICA: Busca inteligente de data
    let ultimaAssinaturaStr = "";
    if (assinaturas && assinaturas.length > 0) {
        let datasEncontradas = [];

        assinaturas.forEach(a => {
            // Tenta os nomes de campos de data mais comuns
            const dataDireta = a.dataHora || a.data || a.created || a.dataAssinatura || a.Data || a.signedAt;
            if (dataDireta) {
                datasEncontradas.push(new Date(dataDireta));
            }

            // Fallback: Varre os valores do objeto procurando strings no formato de data (ex: 2023-10-25...)
            Object.values(a).forEach(valor => {
                if (typeof valor === 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/)) {
                    const d = new Date(valor);
                    if (!isNaN(d.getTime())) datasEncontradas.push(d);
                }
            });
        });

        // Filtra datas inválidas
        const datasValidas = datasEncontradas.filter(d => !isNaN(d.getTime()) && d.getTime() > 0);

        if (datasValidas.length > 0) {
            // Pega a maior data (mais recente)
            const dataMaisRecente = new Date(Math.max(...datasValidas));
            
            const dia = String(dataMaisRecente.getDate()).padStart(2, '0');
            const mes = String(dataMaisRecente.getMonth() + 1).padStart(2, '0');
            const ano = dataMaisRecente.getFullYear();
            
            // Extrai a hora e os minutos garantindo os 2 dígitos
            const horas = String(dataMaisRecente.getHours()).padStart(2, '0');
            const minutos = String(dataMaisRecente.getMinutes()).padStart(2, '0');
            
            // Monta a string final com a hora
            ultimaAssinaturaStr = `${dia}/${mes}/${ano} ${horas}:${minutos}`;
        }
    }

    const required_statuses = status_assinaturas.filter(status => {
        return !(status.abreviacao === status.secretaria && status.responsavel === 'Não mapeado (Pendente)');
    });

    // Passa a string da data para o tooltip
    const tooltipContent = generateAssinaturaTooltipContent(status_assinaturas, agrupadas, ultimaAssinaturaStr);

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

    elementoDestino.innerHTML = finalHtml;

    if (concluidos > 0) {
        const botao = elementoDestino.closest("tr").querySelector(".btn-enviar");
        if (botao) botao.remove();
    }
}

function corrigirNomeAssinante(nome) {
    if (!nome) return "";
    
    // Padroniza a verificação removendo espaços extras
    const nomeTrim = nome.trim();
    
    if (nomeTrim === "SORAIA MOURAO MILAN") {
        return "SORAIA M. MILAN";
    }
    
    // Você pode adicionar outros mapeamentos aqui se precisar no futuro:
    // if (nomeTrim === "OUTRO NOME COMPLETO") { return "OUTRO N. ABREVIADO"; }

    return nomeTrim;
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
        // 🔽 Aplica a correção do nome antes de normalizar
        let nomeTratado = corrigirNomeAssinante(a.responsavel);
        const nome = normalize(nomeTratado);

        if (!contagem[nome]) {
            contagem[nome] = {
                nomeOriginal: nomeTratado, // Mantém o nome corrigido/original
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
       // console.log(`⚡ Cache local carregado: ${cache.length} registros`);
        listaBusca = cache;

        // Atualiza em background (sem travar)
        atualizarCacheEmBackground(cache);

        return listaBusca;
    }

    // 3️⃣ Não tem cache → busca tudo
    //console.log("🌐 Cache vazio, buscando lista completa...");
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
        //console.log("🔄 Atualizando cache em background...");

        const listaNova = await buscarListaCompletaDoServidor();

        if (listaNova.length === 0) return;

        // Mescla por ID
        const map = new Map(cacheAtual.map(item => [item.ID, item]));
        listaNova.forEach(item => map.set(item.ID, item));

        const listaMesclada = Array.from(map.values());

        // Atualiza memória + IndexedDB
        listaBusca = listaMesclada;
        await salvarListaCache(listaMesclada);

       // console.log(`✅ Cache atualizado: ${listaMesclada.length} registros`);
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
    const select = document.getElementById("selectGrupo"); 
    if (!select) return;

    const listaGrupos = obterGrupos();
    const criadores = [...new Set(todosDocumentos.map(doc => doc.Author?.Title?.split(/ - | RF/i)[0].trim()).filter(Boolean))].sort();

    let html = '<option value="todos">📁 Todos os Documentos</option>';
    
    // 🔥 NOVA OPÇÃO: Processos Monitorados
    html += '<option value="monitorados" style="color: #ff9800; font-weight: bold;">🔔 Processos Monitorados</option>';

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

    // 🔥 NOVA LÓGICA: Filtrar pelos processos com sininho ativo
    if (valorSelecionado === "monitorados") {
        
        // Pega a lista da memória através de uma Promise
        const monitorados = await new Promise((resolve) => {
            chrome.storage.local.get(['processosMonitorados'], (result) => {
                resolve(result.processosMonitorados || []);
            });
        });

        // Extrai apenas os IDs de assinatura
        const idsMonitorados = monitorados.map(m => String(m.idAssinador));

        // Filtra a lista atual
        filtrados = todosDocumentos.filter(doc => {
            const link = sanitizeLinkField(doc.Link_x0020_Documento);
            const idDoc = extrairIdAssinador(link);
            return idsMonitorados.includes(String(idDoc));
        });
        
        // Se a quantidade na tela for menor que a quantidade monitorada, busca na lista completa (Cache 10k)
        if (filtrados.length < idsMonitorados.length) {
            const listaCache = await buscarListaCompleta();
            filtrados = listaCache.filter(doc => {
                const link = sanitizeLinkField(doc.Link_x0020_Documento);
                const idDoc = extrairIdAssinador(link);
                return idsMonitorados.includes(String(idDoc));
            });
        }
    } 
    // Lógica antiga de Grupos
    else if (valorSelecionado.startsWith("grupo:")) {
        const nomeGrupo = valorSelecionado.replace("grupo:", "");
        const listaGrupos = obterGrupos();
        const idsNoGrupo = (listaGrupos[nomeGrupo] || []).map(id => String(id));
        
        filtrados = todosDocumentos.filter(doc => idsNoGrupo.includes(String(doc.ID)));
        
        if (filtrados.length < idsNoGrupo.length) {
            const listaCache = await buscarListaCompleta();
            filtrados = listaCache.filter(doc => idsNoGrupo.includes(String(doc.ID)));
        }
    } 
    // Lógica antiga de Criadores
    else if (valorSelecionado.startsWith("criador:")) {
        const nomeCriador = valorSelecionado.replace("criador:", "");
        filtrados = todosDocumentos.filter(doc => {
            const nomeBruto = doc.Author?.Title || "";
            return nomeBruto.includes(nomeCriador);
        });
    }

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
// RENDERIZAÇÃO EM TABELA (SEM CHECKBOX, CLIQUE NA LINHA)
// ===================================================
function renderTabela(lista) {
    const container = document.getElementById("documents-list");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Tabela limpa
    let html = `
    <table id="documents-table" class="table table-bordered table-striped shadow-sm table-hover">
        <thead class="table-dark">
            <tr>
                <th class='d-none'>ID</th>
                <th class='text-center'>Editar</th>
                <th>Título</th>
                <th class='text-center text-withe'>Categoria</th>
                <th class='text-center'>Assinaturas</th>
                <th class='text-center'>Ações</th>
            </tr>
        </thead>
        <tbody>
    `;

    for (const doc of lista) {
        const link = sanitizeLinkField(doc.Link_x0020_Documento);
        const idAssinador = extrairIdAssinador(link);
        
        const criadoPor = doc.Author?.Title || "-";
        const dataCriacao = doc.Created ? formatarData(doc.Created) : "-";
        const editadoPor = doc.Editor?.Title || "-";
        const dataEdicao = doc.Modified ? formatarData(doc.Modified) : "-";
        
        const escapedTitle = doc.Title ? doc.Title.replace(/"/g, '&quot;') : "";

        // Removemos o checkbox e o cursor indica que a linha é clicável
        html += `
            <tr data-id="${idAssinador || ''}" data-docid="${doc.ID}" data-titulo="${escapedTitle}" data-contagem="${doc.Contagem}" data-link="${link}" style="cursor: pointer; transition: background-color 0.2s;">
                
                <td class='d-none'>${doc.ID}</td>
                
                <td class='text-center'>
                    <a target="_blank" href="http://www.intra.pg/SEAD/_layouts/15/listform.aspx?PageType=6&ListId=%7BDA67FC64%2D1B63%2D4608%2DB859%2D8DE4BC9B1FD8%7D&ID=${doc.ID}" class="btn btn-sm btn-secondary">
                       <i class="fa fa-cog" aria-hidden="true"></i>
                    </a>
                </td>

                 <td class="td-titulo position-relative fw-bold">
                    <a class="text-dark" href="${link || '#'}" target="_blank">
                        ${doc.Title}
                    </a>
                    <i class="fa-solid fa-circle-info info-icon text-muted ms-1" data-bs-toggle="tooltip" data-bs-placement="right" data-bs-html="true" data-bs-title="<b>Criado:</b> ${criadoPor} - <b>Data:</b> ${dataCriacao}<br><hr class='m-1'><b>Editado:</b> ${editadoPor} - <b>Data:</b> ${dataEdicao}"></i>
                </td>

                <td class='text-center text-dark'>${doc.Categoria || ""}</td>

                <td class="td-assinaturas text-center">
                    Carregando...
                </td>
                
            <td class='align-middle' style="min-width: 120px;">
                    <!-- w-100 faz usar toda a largura e justify-content-evenly divide o espaço igualmente -->
                    <div class="d-flex justify-content-evenly align-items-center w-100">
                        
                        <!-- Botão de Visualizar -->
                        <a target="_blank" class="d-flex align-items-center justify-content-center text-info-emphasis text-decoration-none p-0 m-0" style="width: 32px; height: 32px; line-height: 1;" href="https://assinadordigitalexterno.praiagrande.sp.gov.br/pdfjs-4.5/web/viewer.html?file=/impressao/${idAssinador}" title="Visualizar">
                            <i class="fa fa-eye fa-lg m-0 p-0" aria-hidden="true"></i>
                        </a>
                        
                        <!-- Divisória Centralizada -->
                        <div style="width: 1px; height: 20px; background-color: #6c757d; opacity: 0.5;"></div>
                        
                        <!-- Botão de Copiar Link -->
                        <button type="button" class="btn-copy-link border-0 bg-transparent p-0 m-0 d-flex align-items-center justify-content-center text-info-emphasis" style="width: 32px; height: 32px; line-height: 1; cursor: pointer;" data-link="${link}" title="Copiar Link">
                            <i class="fa-solid fa-link fa-lg m-0 p-0"></i>
                        </button>

                    </div>
                </td>
            </tr>
        `;
    }

    html += "</tbody></table>";
    documentsList.innerHTML = html;

    atualizarSinosMonitoramento();
    startRealSignaturesUpdateTabela(lista);
}
// ===================================================
// LÓGICA DE INJEÇÃO (MENU DIREITO + BARRA FLUTUANTE)
// ===================================================
function injetarElementosDeInterface() {
    if (document.getElementById('customContextMenu')) return;

    const uiHtml = `
    <style>
        /* ==========================================
           ESTILOS BASE (TEMA LIGHT - PADRÃO)
           O arquivo theme.js cuidará do Dark Mode
           ========================================== */
           
        /* Destaque visual da linha selecionada (Fundo levemente cinza) */
        tr.tr-selecionada > td {
            background-color: #e9ecef !important; 
            border-color: #dee2e6 !important;
        }
        
        /* Layout estrutural da Barra Flutuante */
        .floating-selection-bar {
            display: none; position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            z-index: 1060; align-items: center; gap: 15px;
            border-radius: 50px; 
            padding: 12px 25px;
            border: 1px solid #dee2e6;
        }
    </style>

    <!-- O Menu Flutuante (Usa dropdown-menu padrão do Bootstrap para o theme.js assumir) -->
    <ul id="customContextMenu" class="dropdown-menu shadow" style="display:none; position:absolute; z-index:1060; min-width: 230px;">
        <li><a class="dropdown-item" href="#" id="ctx-baixar"><i class="fa fa-download text-primary me-2" style="width:20px; text-align:center;"></i> Baixar Documento</a></li>
        <li><a class="dropdown-item" href="#" id="ctx-monitorar">
            <i class="fa-regular fa-bell text-warning me-2" id="ctx-monitor-icon" style="width:20px; text-align:center;"></i> 
            <span id="ctx-monitor-text">Ativar Monitoramento</span>
        </a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" id="ctx-add-grupo"><i class="fa fa-folder-plus text-success me-2" style="width:20px; text-align:center;"></i> Adicionar ao Grupo</a></li>
        <li id="ctx-rem-grupo-container" style="display: none;">
            <a class="dropdown-item" href="#" id="ctx-rem-grupo"><i class="fa fa-trash text-danger me-2" style="width:20px; text-align:center;"></i> Remover do Grupo</a>
        </li>
    </ul>

    <!-- A Barra de Seleção em Massa (Usa a classe .card para o theme.js trocar o fundo) -->
    <div id="floatingSelectionBar" class="floating-selection-bar card shadow-lg">
        <span id="selectionCount" class="fw-bold m-0 p-0 me-2 text-info">0 selecionados</span>
        <div class="vr bg-secondary opacity-25 mx-2"></div>
        <button id="btnBulkDownload" class="btn btn-primary btn-sm rounded-pill"><i class="fa fa-download"></i> Baixar Todos</button>
        <button id="btnBulkAddGroup" class="btn btn-success btn-sm rounded-pill"><i class="fa fa-folder-plus"></i> Adicionar ao Grupo</button>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', uiHtml);
}

// ===================================================
// AÇÕES E EVENTOS (CLIQUE, BOTÃO DIREITO)
// ===================================================

function atualizarBarraFlutuante() {
    const checkeds = document.querySelectorAll('.tr-selecionada');
    const barra = document.getElementById('floatingSelectionBar');
    if (checkeds.length > 0) {
        barra.style.display = 'flex';
        document.getElementById('selectionCount').innerText = `${checkeds.length} processo(s)`;
    } else {
        barra.style.display = 'none';
    }
}

// Ação de Clique Esquerdo (Selecionar Linha)
document.addEventListener('click', e => {
    // 1. Lógica de seleção visual
    const tr = e.target.closest('tr[data-id]');
    
    // Se clicou na linha e NÃO clicou em um link ou botão dentro dela
    if (tr && tr.closest('#documents-table') && !e.target.closest('a') && !e.target.closest('button') && !e.target.closest('.info-icon')) {
        tr.classList.toggle('tr-selecionada');
        atualizarBarraFlutuante();
    }

    // 2. Esconder menu de botão direito se clicar fora
    const menu = document.getElementById('customContextMenu');
    if (menu && !e.target.closest('#customContextMenu')) {
        menu.style.display = 'none';
    }

    // 3. Botão Copiar Link
    const btnCopy = e.target.closest('.btn-copy-link');
    if (btnCopy) {
        e.preventDefault();
        const link = btnCopy.getAttribute('data-link');
        if (link) navigator.clipboard.writeText(link).then(() => showToast("success", "Link copiado!"));
    }

    // 4. Barra Flutuante (Adicionar em Lote)
    if (e.target.closest('#btnBulkAddGroup')) {
        const selectedRows = Array.from(document.querySelectorAll('.tr-selecionada'));
        if (selectedRows.length === 0) return;

        const checkedsDocIDs = selectedRows.map(row => row.getAttribute('data-docid'));

        const listaGrupos = obterGrupos();
        const nomes = Object.keys(listaGrupos);
        
        if (nomes.length === 0) {
            Swal.fire('Nenhum grupo!', 'Crie um grupo primeiro no menu superior.', 'info');
            return;
        }

        Swal.fire({
            title: `Adicionar ${checkedsDocIDs.length} processo(s)`,
            input: 'select',
            inputOptions: nomes.reduce((acc, curr) => ({...acc, [curr]: curr}), {}),
            showCancelButton: true,
            confirmButtonText: 'Adicionar Todos'
        }).then(({ value: grupoAlvo }) => {
            if (grupoAlvo) {
                if (!listaGrupos[grupoAlvo]) listaGrupos[grupoAlvo] = [];
                let adicionados = 0;

                checkedsDocIDs.forEach(idStr => {
                    if (!listaGrupos[grupoAlvo].includes(String(idStr))) {
                        listaGrupos[grupoAlvo].push(String(idStr));
                        adicionados++;
                    }
                });

                salvarGrupos(listaGrupos);
                showToast("success", `${adicionados} processo(s) salvo(s) em ${grupoAlvo}`);
                
                // Limpa a seleção visual
                document.querySelectorAll('.tr-selecionada').forEach(row => row.classList.remove('tr-selecionada'));
                atualizarBarraFlutuante();
                
                if (document.getElementById("selectGrupo").value !== "todos") {
                    filtrarMisto(); 
                }
            }
        });
    }

    if (e.target.closest('#btnBulkDownload')) {
        const selectedRows = Array.from(document.querySelectorAll('.tr-selecionada'));
        if (selectedRows.length === 0) return;

        // Extrai os IDs do Assinador das linhas selecionadas
        const checkedsIDs = selectedRows.map(row => row.getAttribute('data-id')).filter(id => id);
        
        if (checkedsIDs.length === 0) return;

        showToast("info", `Iniciando o download de ${checkedsIDs.length} arquivo(s)...`);

        // Executa o download de cada um com um intervalo de 1 segundo (1000ms) entre eles
        // para evitar que o Google Chrome bloqueie downloads simultâneos de spam.
        checkedsIDs.forEach((idAssinador, index) => {
            setTimeout(() => {
                const linkPDF = `https://assinadordigitalexterno.praiagrande.sp.gov.br/impressao/${idAssinador}`;
                
                // Cria um iframe exclusivo para cada download e depois remove ele
                let iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.src = linkPDF;
                document.body.appendChild(iframe);
                
                // Limpa o iframe do código após 10 segundos para não pesar a memória
                setTimeout(() => { iframe.remove(); }, 10000);
                
            }, index * 1000); // 0ms, 1000ms, 2000ms, 3000ms...
        });

        // Tira a seleção das linhas e esconde a barra
        document.querySelectorAll('.tr-selecionada').forEach(row => row.classList.remove('tr-selecionada'));
        atualizarBarraFlutuante();
        return; // Impede que execute outras lógicas
    }

    // 5. Cliques nas opções do Menu de Botão Direito
    if (e.target.closest('#ctx-baixar')) {
        e.preventDefault();
        const idAssinador = menu.getAttribute('data-idassinador');
        const linkPDF = `https://assinadordigitalexterno.praiagrande.sp.gov.br/impressao/${idAssinador}`;
        
        // Cria um iframe invisível para baixar sem abrir nova guia
        let iframe = document.getElementById("hidden-downloader");
        if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.id = "hidden-downloader";
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }
        iframe.src = linkPDF;

        menu.style.display = 'none';
    }
    else if (e.target.closest('#ctx-add-grupo')) {
        e.preventDefault();
        adicionarProcessoAoGrupo(menu.getAttribute('data-docid'));
        menu.style.display = 'none';
    }
    else if (e.target.closest('#ctx-rem-grupo')) {
        e.preventDefault();
        removerProcessoDoGrupo(menu.getAttribute('data-docid'));
        menu.style.display = 'none';
    }
    else if (e.target.closest('#ctx-monitorar')) {
        e.preventDefault();
        const idAssinador = menu.getAttribute("data-idassinador");
        const titulo = menu.getAttribute("data-titulo");
        const contagem = parseInt(menu.getAttribute("data-contagem")) || 0;
        
        buscarAssinaturas(idAssinador).then(assinaturas => {
            const assinantesIniciais = assinaturas.map(a => a.responsavel.trim().toUpperCase());
            chrome.runtime.sendMessage({
                action: "trackProcess",
                doc: { idAssinador, titulo, contagemTotal: contagem, assinantesIniciais }
            }, (res) => {
                if (res.success) {
                    showToast("success", res.status === "adicionado" ? "Monitoramento Ativado!" : "Monitoramento Removido.");
                    atualizarSinosMonitoramento(); 
                } else {
                    Swal.fire("Limite Atingido", res.error, "warning");
                }
            });
        });
        menu.style.display = 'none';
    }
});


// Ação de Clique Direito (Abrir Menu)
document.addEventListener('contextmenu', e => {
    const tr = e.target.closest('tr[data-id]');
    if (tr && tr.closest('#documents-table')) {
        e.preventDefault(); 
        
        injetarElementosDeInterface(); 
        const menu = document.getElementById('customContextMenu');
        const idAssinador = tr.getAttribute('data-id');
        
        // Passa os dados para o menu HTML
        menu.setAttribute('data-idassinador', idAssinador);
        menu.setAttribute('data-docid', tr.getAttribute('data-docid'));
        menu.setAttribute('data-titulo', tr.getAttribute('data-titulo'));
        menu.setAttribute('data-contagem', tr.getAttribute('data-contagem'));

        // 1. Mostrar "Remover do Grupo" apenas se estiver filtrando por grupo
        const filtroAtivo = document.getElementById("selectGrupo")?.value || "todos";
        document.getElementById('ctx-rem-grupo-container').style.display = filtroAtivo.startsWith("grupo:") ? 'block' : 'none';

        // 2. Atualizar o visual do botão "Monitorar" lendo a memória instantaneamente
        chrome.storage.local.get(['processosMonitorados'], (result) => {
            const monitorados = result.processosMonitorados || [];
            const sendoVigiado = monitorados.some(p => String(p.idAssinador) === String(idAssinador));
            
            const txtSino = document.getElementById('ctx-monitor-text');
            const iconSino = document.getElementById('ctx-monitor-icon');

            if (sendoVigiado) {
                txtSino.innerText = "Parar de Acompanhar";
                iconSino.className = "fa-solid fa-bell-slash text-secondary me-2"; // Ícone cortado e cinza
            } else {
                txtSino.innerText = "Ativar Monitoramento";
                iconSino.className = "fa-regular fa-bell text-warning me-2"; // Sino amarelo padrão
            }

            // 3. Exibe e ajusta a posição (CORRIGIDO PARA SCROLL LONGO)
            menu.style.display = 'block';
            
            let x = e.pageX;
            let y = e.pageY;
            
            // Calcula o limite total somando a janela visível + o scroll atual
            const limiteX = window.innerWidth + window.scrollX;
            const limiteY = window.innerHeight + window.scrollY;
            
            // Se o menu for vazar para a direita ou para baixo, empurra ele de volta
            if (x + 230 > limiteX) x = limiteX - 240; 
            if (y + 160 > limiteY) y = limiteY - 170; 
            
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
        });
    }
});


function dispararBaixar(linkPDF) {
    Swal.fire({
        title: 'Deseja baixar o documento?',
        text: "O documento será aberto para download.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, baixar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            window.open(linkPDF, '_blank');
        }
    });
}

// ===================================================
// ATUALIZAÇÃO VISUAL DOS SININHOS DE MONITORAMENTO
// ===================================================
function atualizarSinosMonitoramento() {
    chrome.storage.local.get(['processosMonitorados'], (result) => {
        const monitorados = result.processosMonitorados || [];
        // Converte tudo para string para garantir o match (100% seguro)
        const idsMonitorados = monitorados.map(p => String(p.idAssinador));

        // Limpa os ícones antigos se a tabela for re-renderizada
        document.querySelectorAll('.badge-monitorado').forEach(el => el.remove());

        // Percorre todas as linhas da tabela
        document.querySelectorAll('#documents-table tbody tr').forEach(tr => {
            const idAssinador = String(tr.getAttribute('data-id'));
            
            // Se este documento estiver sendo vigiado
            if (idsMonitorados.includes(idAssinador)) {
                // Pegamos o ícone de info específico desta linha
                const iconeInfo = tr.querySelector('.info-icon');
                if (iconeInfo) {
                    // Coloca o sininho IMEDIATAMENTE ANTES do ícone de informação (beforebegin)
                    iconeInfo.insertAdjacentHTML('beforebegin', '<i class="fa-solid fa-bell text-warning me-2 badge-monitorado" style="font-size: 0.9em; cursor: help;" title="Você está monitorando este processo"></i>');
                }
            }
        });
    });
}

// ===================================================
// INICIALIZAÇÃO E BOOT
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    injetarElementosDeInterface();
    atualizarSelectGrupos();

    loadAssinador().then(() => {
        verificarParametrosURL();
    });

    const btnVoltar = document.getElementById('VoltaAssinador');
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (event) => {
            event.preventDefault();
            chrome.storage.local.remove("assinador_preferencia", () => {
                chrome.runtime.sendMessage({ action: "goToOriginalAssinador" });
            });
        });
    }

    document.getElementById('btnCriarGrupo')?.addEventListener('click', criarNovoGrupo);
    document.getElementById('btnGerenciarGrupos')?.addEventListener('click', deletarGrupoAtual);
    document.getElementById("selectGrupo")?.addEventListener("change", filtrarMisto);

    document.getElementById("Busca")?.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            executarBusca();
        }
    });
});

// ===================================================
// INICIALIZAÇÃO E BOOT
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    injetarElementosDeInterface();
    atualizarSelectGrupos();

    loadAssinador().then(() => {
        verificarParametrosURL();
    });

    const btnVoltar = document.getElementById('VoltaAssinador');
    if (btnVoltar) {
        btnVoltar.addEventListener("click", (event) => {
            event.preventDefault();
            chrome.storage.local.remove("assinador_preferencia", () => {
                chrome.runtime.sendMessage({ action: "goToOriginalAssinador" });
            });
        });
    }

    document.getElementById('btnCriarGrupo')?.addEventListener('click', criarNovoGrupo);
    document.getElementById('btnGerenciarGrupos')?.addEventListener('click', deletarGrupoAtual);
    document.getElementById("selectGrupo")?.addEventListener("change", filtrarMisto);

    document.getElementById("Busca")?.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            executarBusca();
        }
    });
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

    // Sincroniza o campo de busca visualmente se a busca veio por link (Notificação)
    if (termoManual && input) {
        input.value = termoManual;
    }

    const lista = await buscarListaCompleta();

    let resultados = lista.filter(item => {
        if (item.Categoria && String(item.Categoria).toLowerCase().trim() === "empenho") {
            return false;
        }
        
        // 1. Prepara a busca por título
        const tituloLimpo = normalizarParaBusca(item.Title);
        
        // 2. Prepara a busca pelo ID Exato do Assinador
        const link = sanitizeLinkField(item.Link_x0020_Documento);
        const idAssinadorItem = extrairIdAssinador(link);
        const idLimpo = normalizarParaBusca(idAssinadorItem);

        // Retorna se o termo bate com o Título OU com o ID do documento
        return tituloLimpo.includes(valorLimpo) || (idLimpo && idLimpo === valorLimpo);
    });
    
    // Aplica os filtros de grupo se existirem
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





// ===================================================
// ATUALIZAÇÃO VISUAL DOS SININHOS DE MONITORAMENTO
// ===================================================
function atualizarSinosMonitoramento() {
    chrome.storage.local.get(['processosMonitorados'], (result) => {
        const monitorados = result.processosMonitorados || [];
        const idsMonitorados = monitorados.map(p => String(p.idAssinador));

        // Limpa os ícones antigos se a tabela for re-renderizada
        document.querySelectorAll('.badge-monitorado').forEach(el => el.remove());

        // Percorre todas as linhas da tabela
        document.querySelectorAll('#documents-table tbody tr').forEach(tr => {
            const idAssinador = String(tr.getAttribute('data-id'));
            
            // Se este documento estiver sendo vigiado
            if (idsMonitorados.includes(idAssinador)) {
                const iconeInfo = tr.querySelector('.info-icon');
                if (iconeInfo) {
                    // Injeta o sino com os MESMOS atributos do Bootstrap Tooltip usados no info-icon
                    // A classe ms-1 cria o mesmo espaçamento padrão
                    iconeInfo.insertAdjacentHTML('beforebegin', `
                        <i class="fa-solid fa-bell text-warning ms-1 badge-monitorado" 
                           data-bs-toggle="tooltip" 
                           data-bs-placement="right" 
                           data-bs-title="Processo sendo monitorado em tempo real">
                        </i>
                    `);
                }
            }
        });

        // 🔥 ESSENCIAL: Como acabamos de injetar novos elementos com tooltips no HTML,
        // precisamos avisar o Bootstrap para "ligar" eles, usando a função que você já tem!
        if (typeof initializeTooltips === 'function') {
            initializeTooltips();
        }
    });
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


