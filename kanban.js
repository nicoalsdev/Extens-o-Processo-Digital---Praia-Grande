 let isRefreshing = false;
 let cachedBoards = [];
// NOVO: Controle para garantir que o listener de refresh só seja anexado uma vez
 let autoRefreshListenerAttached = false;
//LOAD

const DEFAULT_SETTINGS = {
    sortHomepage: true,
    sortFolders: true,
    showTags: true,
    menuType: 'Avancado',//'Simples',
    darkMode: false, // 👈 adicionar
    showBoard: true


};
var view_board = DEFAULT_SETTINGS.showBoard;
// --- CÓDIGO EXISTENTE NO KANBAN.JS ---
chrome.storage.local.get('userSettings', (data) => {
    const settings = { ...DEFAULT_SETTINGS, ...data.userSettings };
    console.log(settings);
    view_board = settings.showBoard;
});

// --- ADICIONE ESTE BLOCO LOGO ABAIXO ---
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.userSettings) {
            const newSettings = changes.userSettings.newValue || {};
            // Atualiza a variável de controle da visualização
            if (typeof newSettings.showBoard !== 'undefined') {
                view_board = newSettings.showBoard;
                
                // Se a função init existir, recarrega o quadro com a nova configuração
                if (typeof init === 'function') {
                    init();
                }
            }
        }
    });
}
 // MOCK do storage (substitua por chrome.storage.local na extensão)
 const mockStorage = {
   predefinedTags: [{}
         /*
         name: "Em análise", color: "#0d6efd" },
         { name: "Em andamento", color: "#198754" },
         { name: "Concluído", color: "#6c757d"
         */
   ],
   processTags: {},
     // processData armazena dataPrazo, board e description (separado das tags)
   processData: {}
};

let modalDirty = false;

function sortPredefinedTags(tags) {
  return [...tags].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : 999;
    const orderB = typeof b.order === 'number' ? b.order : 999;
    return orderA - orderB;
});
}

   

// Abrir modal ao clicar no botão "+"
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-task-btn")) {
    const board = e.target.dataset.board;
    document.getElementById("createProcessModal").dataset.board = board;

    document.getElementById("newProcessNumber").value = "";
    document.getElementById("newProcessNumber").focus();

    new bootstrap.Modal(document.getElementById("createProcessModal")).show();
}
});

// Adiciona o evento ao documento (ou a um container pai fixo)
document.addEventListener('auxclick', function(e) {
    // Verifica se é o botão do meio (scroll)
    if (e.button === 1) {

        // Tenta encontrar a div .task mais próxima do clique
        const taskElement = e.target.closest(".task");

        // Se encontrou a task e ela tem o atributo data-process-id
        if (taskElement && taskElement.dataset.processId) {

            const processId = taskElement.dataset.processId;
            const url = `https://processodigital.praiagrande.sp.gov.br/processo/${processId}`;

            
            // Impede o comportamento de scroll do navegador
            e.preventDefault();
            
            // Abre o link em nova guia
            window.open(url, '_blank');
        }
    }
});

// Evita que o ícone de "setas de rolagem" apareça ao clicar
document.addEventListener('mousedown', function(e) {
    if (e.button === 1 && e.target.closest(".task")) {
        e.preventDefault();
    }
});


// Salvar processo manual
document.getElementById("saveNewProcess").addEventListener("click", async () => {
  const modal = document.getElementById("createProcessModal");
  const board = modal.dataset.board;
  console.log(modal);

  const processNumber = document.getElementById("newProcessNumber").value.trim();

  if (!processNumber) {
    alert("Digite o número do processo!");
    return;
}

const data = await getStorageData();
if (!data.processData) data.processData = {};
if (!data.processTags) data.processTags = {};

    // 🔥 PEGAR A COR DO BOARD CORRETA
const boardInfo = data.predefinedTags.find(
  b => b.name === board && b.showOnBoard
  );

if (!boardInfo) {
  console.error("Board não encontrado:", board);
  alert("Erro: não foi possível localizar o board.");
  return;
}

    // criar ID único
const processId = "manual-" + Date.now();

    // cria processData
data.processData[processId] = {
  processNumber,
  board,
  type:"manual",
        boardColor: boardInfo.color,   // <-- COR CAPTURADA AQUI
        description: "",
        dataPrazo: "",
        enteredBoardAt: Date.now(),
        lastMove: Date.now(),
        history: [
            {
              date: Date.now(),
              action: `Processo criado manualmente no board '${board}'`
          }
      ]
  };

    // cria uma tag artificial para ser compatível com seu render atual
  data.processTags[`${processId}-${Date.now()}`] = {
    processId,
    processNumber,
    name: board,
    color: boardInfo.color || "#777777", // usa cor do board
    isBoardTag: true // 🔥 CORREÇÃO ESSENCIAL
};

await setStorageData(data);

bootstrap.Modal.getInstance(modal).hide();

    // recarregar a UI
await init();
});


async function fixCorruptedKanbanData() {
    console.log("🛠️ INICIANDO CORREÇÃO DE DADOS PERMANENTES DO KANBAN...");
    
    // 1. Obter dados atuais do Chrome Storage
    const data = await new Promise(resolve => {
        // Verifica se a API do Chrome Storage está disponível
        (typeof chrome !== 'undefined' && chrome.storage.local) ? 
        chrome.storage.local.get(['processData', 'processTags'], resolve) : 
        resolve({ processData: {}, processTags: {} });
    });

    let { processData, processTags } = data;
    
    if (!processData) {
        console.error("❌ Não foi possível carregar 'processData'. O script foi interrompido.");
        return;
    }

    console.log(`Processos encontrados: ${Object.keys(processData).length}`);
    
    const correctedTags = {};
    let boardsToUpdateCount = 0;

    // 2. Iterar sobre processData para LIMPAR tags de board antigas e GERAR novas
    for (const processId in processData) {
        if (!processData.hasOwnProperty(processId)) continue;
        
        const processEntry = processData[processId];
        const currentBoard = processEntry.board; // O board que ele está ATUALMENTE em processData

        if (currentBoard) {
            boardsToUpdateCount++;
            
            // A) LIMPEZA: Remove tags de board (isBoardTag: true) antigas para este processo
            for (const tagKey in processTags) {
                if (tagKey.startsWith(processId + "-") && processTags[tagKey].isBoardTag === true) {
                    delete processTags[tagKey];
                }
            }

            // B) CRIAÇÃO: Cria uma nova Tag de Board correta e fresca (com timestamp novo)
            const tagId = `${processId}-${Date.now() + boardsToUpdateCount}`; // Adiciona offset para garantir ordem
            
            correctedTags[tagId] = {
                name: currentBoard, // Usa o board atual como o nome da tag
                color: "#000000", // Cor placeholder
                processId: processId,
                processNumber: processEntry.processNumber || processId,
                isBoardTag: true // CRÍTICO: Marca como tag de board
            };

            // ⚠️ O processo 46917/2025 será corrigido aqui, garantindo que "Em Andamento" seja a tag de board mais recente.

        }
    }
    
    // 3. Consolida as novas processTags (mantém tags NÃO-BOARD existentes + tags BOARD corrigidas)
    const newProcessTags = {
        ...processTags, // Tags não-board que sobraram (ex: "Aguardando Resposta Cliente")
        ...correctedTags // Novas tags de board
    };
    
    // 4. Salvar os dados de volta no storage
    console.log(`✅ ${boardsToUpdateCount} processos corrigidos. Salvando no storage...`);
    
    await new Promise(resolve => {
     (typeof chrome !== 'undefined' && chrome.storage.local) ? 
     chrome.storage.local.set({ processData: processData, processTags: newProcessTags }, resolve) : 
     resolve();
 });

    console.log("🎉 CORREÇÃO CONCLUÍDA! O Kanban será re-inicializado.");
    
    // 5. Força a re-inicialização do Kanban
    // Assumindo que a função init() está no escopo global
    if (typeof init === 'function') {
        init();
    } else {
        console.warn("⚠️ A função 'init()' não está acessível globalmente. Por favor, recarregue a página do Kanban manualmente para aplicar as alterações.");
    }
}


async function clearAllKanbanTasks() {
    console.log("🛠️ INICIANDO LIMPEZA DE TODAS AS TASKS (cards) DO KANBAN...");
    
    // 1. Obter dados atuais do Chrome Storage
    const data = await new Promise(resolve => {
        // Verifica se a API do Chrome Storage está disponível
        (typeof chrome !== 'undefined' && chrome.storage.local) ? 
        chrome.storage.local.get(['processData', 'processTags', 'predefinedTags'], resolve) : 
        resolve({ processData: {}, processTags: {}, predefinedTags: [] });
    });

    let { processTags, predefinedTags } = data;
    
    // 2. Cria um novo objeto processData vazio
    const newProcessData = {};

    console.log(`Processos encontrados antes da limpeza: ${Object.keys(data.processData || {}).length}`);
    console.log(`Tags de Processo mantidas: ${Object.keys(processTags || {}).length}`);
    
    // 3. Salvar os dados limpos de volta no storage (apenas processData é zerado)
    console.log("✅ Limpando 'processData' (tasks/cards)...");
    
    await new Promise(resolve => {
     (typeof chrome !== 'undefined' && chrome.storage.local) ? 
     chrome.storage.local.set({ 
                processData: newProcessData, // Dados zerados
                processTags: processTags,    // Tags mantidas
                predefinedTags: predefinedTags // Tags pré-definidas mantidas
            }, resolve) : 
     resolve();
 });

    console.log("🎉 LIMPEZA CONCLUÍDA! O Kanban será re-inicializado, e todos os cards desaparecerão.");
    
    // 4. Força a re-inicialização do Kanban para atualizar a visualização
    if (typeof init === 'function') {
        init();
    } else {
        console.warn("⚠️ A função 'init()' não está acessível globalmente. Por favor, recarregue a página do Kanban manualmente para ver as alterações.");
    }
}



// =========================================================================
// SCRIPT DE LIMPEZA GERAL DE DADOS DO KANBAN (Execute no F12)
// ZERA: processData (tasks/cards) e processTags (tags manuais e de board)
// PRESERVA: predefinedTags (Tags Rápidas)
// =========================================================================

async function fullKanbanCleanup() {
    console.log("🛠️ INICIANDO LIMPEZA GERAL DE DADOS DE PROCESSOS E TAGS MANUAIS...");
    
    // 1. Obter dados atuais do Chrome Storage para PRESERVAR Tags Rápidas
    const data = await new Promise(resolve => {
        // Verifica se a API do Chrome Storage está disponível
        (typeof chrome !== 'undefined' && chrome.storage.local) ? 
        chrome.storage.local.get(['processData', 'processTags', 'predefinedTags'], resolve) : 
        resolve({ processData: {}, processTags: {}, predefinedTags: [] });
    });

    // Mantém as tags rápidas (predefinedTags)
    const { predefinedTags } = data;
    
    // 2. Cria novos objetos vazios para os dados que serão zerados
    const newProcessData = {}; // Zera todas as tasks/cards
    const newProcessTags = {};  // Zera todas as tags manuais e de board

    console.log(`Processos removidos: ${Object.keys(data.processData || {}).length}`);
    console.log(`Tags de Processo removidas: ${Object.keys(data.processTags || {}).length}`);
    console.log(`Tags Rápidas (predefinedTags) preservadas: ${predefinedTags.length || 0}`);
    
    // 3. Salvar os dados limpos de volta no storage
    console.log("✅ Limpeza concluída. Salvando no storage...");
    
    await new Promise(resolve => {
     (typeof chrome !== 'undefined' && chrome.storage.local) ? 
     chrome.storage.local.set({ 
        processData: newProcessData, 
        processTags: newProcessTags, 
                predefinedTags: predefinedTags // PRESERVADO!
            }, resolve) : 
     resolve();
 });

    console.log("🎉 LIMPEZA GERAL CONCLUÍDA! O Kanban será re-inicializado.");
    
    // 4. Força a re-inicialização do Kanban para atualizar a visualização
    if (typeof init === 'function') {
        init();
    } else {
        console.warn("⚠️ A função 'init()' não está acessível globalmente. Por favor, recarregue a página do Kanban manualmente para aplicar as alterações.");
    }
}

function formatElapsedTime(timestamp) {
  if (!timestamp) return "—";

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours   = Math.floor(diff / (1000 * 60 * 60));
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days} dia(s) e ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  if (minutes > 0) return `${minutes}min`;
  return `${seconds}s`;
}

async function renderBoardTime(processId) {
  const container = document.getElementById("boardTimeInfo");
  if (!container) return;

  const data = await getStorageData();
  const info = data.processData?.[processId];

  if (!info || !info.enteredBoardAt) {
    container.innerHTML = "<span class='text-muted'>Sem informação.</span>";
    return;
}

const entered = info.enteredBoardAt;
const dateStr = formatDateTime(entered);
const elapsed = formatElapsedTime(entered);

container.innerHTML = `
  <div><strong>Entrou no board:</strong> ${dateStr}</div>
  <div><strong>Tempo parado:</strong> ${elapsed}</div>
`;
}



function daysBetween(date1, date2) {
  const d1 = new Date(date1).setHours(0,0,0,0);
  const d2 = new Date(date2).setHours(0,0,0,0);
  return Math.floor((d1 - d2) / (1000*60*60*24));
}

function isSameWeek(date) {
  const now = new Date();
  const dt = new Date(date);

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return dt >= start && dt <= end;
}

async function computeLoadForecast() {
  const data = await getStorageData();
  const processData = data.processData || {};

  const today = new Date();

  let vencemHoje = 0;
  let vencemAmanha = 0;
  let vencem3dias = 0;
  let vencemSemana = 0;
  let vencidos = 0;

  const boardsCount = {};

  for (const [processId, p] of Object.entries(processData)) {
    const prazo = p.dataPrazo;
    const board = p.board || "Sem board";

    if (!boardsCount[board]) boardsCount[board] = 0;
    boardsCount[board]++;

    if (prazo) {
      const diff = daysBetween(prazo, today);

      if (diff === 0) vencemHoje++;
      if (diff === 1) vencemAmanha++;
      if (diff > 1 && diff <= 3) vencem3dias++;
      if (isSameWeek(prazo)) vencemSemana++;
      if (diff < 0) vencidos++;
  }
}

renderLoadForecast({
    vencemHoje,
    vencemAmanha,
    vencem3dias,
    vencemSemana,
    vencidos,
    boardsCount
});
}

function renderLoadForecast(data) {
  const div = document.getElementById("loadForecast");
  if (!div) return;

  const boardLines = Object.entries(data.boardsCount)
  .map(([board, count]) => `<div>${board}: <strong>${count}</strong></div>`)
  .join("");

  div.innerHTML = `
  <h5 style="margin:0 0 8px 0;">📊 Previsão de Carga</h5>

  <div>Hoje: <strong>${data.vencemHoje}</strong></div>
  <div>Amanhã: <strong>${data.vencemAmanha}</strong></div>
  <div>Próximos 3 dias: <strong>${data.vencem3dias}</strong></div>
  <div>Esta semana: <strong>${data.vencemSemana}</strong></div>
  <div style="color:#f55">Vencidos: <strong>${data.vencidos}</strong></div>

  <hr style="background:#333">

  <h6 style="margin:6px 0 4px 0;">📌 Por Board:</h6>
  ${boardLines}
  `;
}



function formatDateTime(timestamp) {
  const dt = new Date(timestamp);
  return dt.toLocaleString("pt-BR");
}

async function renderHistory(processId) {
  const container = document.getElementById("historyList");
  if (!container) return;

  const data = await getStorageData();
  const history = data.processData?.[processId]?.history || [];

  if (history.length === 0) {
    container.innerHTML = "<span class='text-muted'>Nenhum histórico registrado.</span>";
    return;
}

const sorted = history.slice().sort((a, b) => b.date - a.date);

container.innerHTML = sorted.map(h => `
    <div style="padding:4px 0; border-bottom:1px solid #2a2a2a">
    <strong>${formatDateTime(h.date)}</strong><br>
    ${h.action}
    </div>
`).join("");
}





//
function filterTasks(term) {
  const normalizedTerm = normalizeText(term);

  document.querySelectorAll(".task").forEach(task => {
    const text = normalizeText(task.innerText);
    task.style.display = text.includes(normalizedTerm) ? "block" : "none";
});
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);

  if (days > 0) return `${days} dia(s)`;
  if (hrs > 0) return `${hrs} hora(s)`;
  if (min > 0) return `${min} minuto(s)`;
  return `${sec} segundo(s)`;
}

document.getElementById("kanbanFilterInput").addEventListener("input", e => {
  filterTasks(e.target.value);
});

function normalizeText(str) {
  if (!str) return "";
  return str
    .normalize("NFD")                      // quebra acentos
    .replace(/[\u0300-\u036f]/g, "")       // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, "")        // remove pontuação
    .replace(/\s+/g, " ")                  // colapsa espaços
    .trim()
    .toLowerCase();
}



async function runGlobalSearch(term) {
  const resultBox = document.getElementById("globalSearchResults");
  resultBox.innerHTML = "<p class='text-muted'>Buscando...</p>";

  const data = await getStorageData();
  const { processTags, processData } = data;

  term = normalizeText(term); // Normaliza o termo de busca logo no início

  if (!term) {
    resultBox.innerHTML = "";
    return;
}

const found = [];
  const addedIds = new Set(); // Controle para evitar duplicatas

  // Percorrer as tags de processo
  for (const [key, tag] of Object.entries(processTags || {})) {
    const processId = tag.processId || key.split("-")[0];
    
    // Se já adicionamos este processo, pula para a próxima tag
    if (addedIds.has(processId)) continue;

    const processNumber = tag.processNumber || "";
    const description = processData?.[processId]?.description || "";
    const board = processData?.[processId]?.board || "";

    // Criamos um super texto contendo tudo que pode ser pesquisado para esse processo
    // Incluímos todas as tags do mesmo processo na busca de uma vez
    const allTagsForThisProcess = Object.values(processTags)
    .filter(t => t.processId === processId)
    .map(t => t.name)
    .join(" ");

    const searchText = normalizeText(`
      ${processId}
      ${processNumber}
      ${allTagsForThisProcess}
      ${description}
      ${board}
    `);

    if (searchText.includes(term)) {
      found.push({ processId, processNumber, description, board });
      addedIds.add(processId); // Marca como adicionado
  }
}

  // Renderização dos resultados (mantida conforme seu original)
if (found.length === 0) {
    resultBox.innerHTML = "<p class='text-muted'>Nenhum resultado encontrado.</p>";
    return;
}

resultBox.innerHTML = "";
found.forEach(item => {
    const div = document.createElement("div");
    div.className = "p-2 search-item";
    div.style.cursor = "pointer";
    div.style.borderBottom = "1px solid #333";

    div.innerHTML = `
      <strong class='text-dark'>${item.processNumber || "(Sem número)"}</strong> — ${item.description || ""}
      <br><small class="text-muted">Board: ${item.board}</small>
    `;

    div.addEventListener("click", () => {
      bootstrap.Modal.getInstance(document.getElementById("globalSearchModal")).hide();
      
      const targetBoard = document.querySelector(`.board[data-board="${item.board}"]`);
      if (targetBoard) targetBoard.scrollIntoView({ behavior: "smooth" });

      setTimeout(() => {
        const taskEl = document.querySelector(`.task[data-process-id="${item.processId}"]`);

        if (taskEl) {
                // 1. Centraliza o card na tela
            taskEl.scrollIntoView({ behavior: "smooth", block: "center" });

                // 2. Define a cor de fundo atual para o CSS não "vazar" (opcional)
            const currentBg = window.getComputedStyle(taskEl).backgroundColor;
            taskEl.style.setProperty('--card-bg-color', currentBg);

                // 3. Adiciona a classe da borda animada
            taskEl.classList.add("task-highlight-search");

                // 4. Remove após 4 segundos (tempo suficiente para o usuário ver)
            setTimeout(() => {
                taskEl.classList.remove("task-highlight-search");
                taskEl.style.removeProperty('--card-bg-color');
            }, 4000);
        }
    }, 500);
  });

    resultBox.appendChild(div);
});
}
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key === "m") {
    e.preventDefault();

    const modalElement = document.getElementById("globalSearchModal");
    const modal = new bootstrap.Modal(modalElement);
    
    // Escuta o evento de "conclusão da abertura" do modal
    modalElement.addEventListener('shown.bs.modal', () => {
      const input = document.getElementById("globalSearchInput");
      input.focus();
      input.value = "";
      document.getElementById("globalSearchResults").innerHTML = "";
    }, { once: true }); // O 'once: true' evita que o listener se acumule

    modal.show();
}
});


document.getElementById("globalSearchInput").addEventListener("input", e => {
  runGlobalSearch(e.target.value);
});

window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("kanbanFilterInput")?.focus();
}, 200);
});


//


 // Função auxiliar: detectar se está em extensão
function isExtensionEnv() {
   return typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
}

async function getStorageData() {
  if (isExtensionEnv()) {
    return new Promise(resolve => {
      chrome.storage.local.get(["predefinedTags", "processTags", "processData"], result => {

                // Garante estruturas mínimas
        result.predefinedTags = result.predefinedTags || [];
        result.processTags = result.processTags || {};
        result.processData = result.processData || {};

    //            console.log(result);
        resolve(result);
    });
  });
} else {
    return mockStorage;
}
}


function renderGuide(boards) {
 const guide = document.getElementById("kanbanGuide");
 guide.innerHTML = "";

 boards.forEach(board => {
   const item = document.createElement("div");
   item.className = "kanban-guide-item";

   item.innerHTML = `
   <span class="kanban-color-dot" style="background:${board.color}"></span>
   <span>${board.name}</span>
   `;

   item.addEventListener("click", () => {
     const target = document.querySelector(`.board[data-board="${board.name}"]`);
     if (target) {
       target.scrollIntoView({
         behavior: "smooth",
         block: "start",
         inline: "center"
     });
   }
});

   guide.appendChild(item);
});
}


async function setStorageData(data) {
 if (isExtensionEnv()) {
   return new Promise(resolve => {
     chrome.storage.local.set(data, () => {
                 //console.log("📦 Dados salvos em chrome.storage.local:", data);
         resolve();
     });
 });
} else {
   Object.assign(mockStorage, data);
         //console.log("💾 Salvo no mockStorage:", data);
}
}

 // === helper: obtém processNumber real para um processId (procura nas tags do processo)
function getProcessNumberFor(processId, data) {
     // data = resultado de getStorageData()
 if (!data) return null;

     // procura todas as tags desse processo
 const entries = Object.entries(data.processTags || {})
 .filter(([key]) => key.startsWith(processId + "-"));

 if (entries.length) {
         // ordena por timestamp (parte após o "-"), do mais novo para o mais velho
     entries.sort((a, b) => {
       const at = Number(a[0].split("-")[1]) || 0;
       const bt = Number(b[0].split("-")[1]) || 0;
       return bt - at;
   });
     const latestTag = entries[0][1];
         // usa o processNumber da tag mais nova, se existir
     if (latestTag && latestTag.processNumber) return latestTag.processNumber;
 }

     // fallback para processData
 if (data.processData && data.processData[processId] && data.processData[processId].processNumber) {
   return data.processData[processId].processNumber;
}

return null;
}



 // =============================================================
 // FUNÇÃO DE ATUALIZAÇÃO DE TAGS AO MOVER DE BOARD
 // =============================================================
async function updateTagOnBoardChange(
  processId,
  oldBoard,
  newBoard,
  processNumber,
  options = {}
  ) {

  const source = options.source || 'manual';

  // 🔒 SOMENTE DRAG & DROP DO KANBAN
  if (source !== 'kanban') {
    console.log('[updateTagOnBoardChange] Ignorado — origem:', source);
    return;
}

const data = await getStorageData();
let { processTags = {}, predefinedTags = [] } = data;

const matchingBoard = predefinedTags.find(b => b.name === newBoard);
const finalColor = matchingBoard ? matchingBoard.color : "#6c757d";

  // 1️⃣ Remove APENAS tags de board deste processo
for (const [key, tag] of Object.entries({ ...processTags })) {

    if (tag.processId !== processId) continue;

    if (tag.isBoardTag === true) {
      console.log(`DELETING board tag: ${key} (${tag.name})`);
      delete processTags[key];
  }
}

  // 2️⃣ Cria a nova tag de board
const tagInstanceId = `${processId}-${Date.now()}`;

let finalProcessNumber = processNumber;
if (data.processData?.[processId]?.processNumber) {
    finalProcessNumber = data.processData[processId].processNumber;
}
if (!finalProcessNumber || finalProcessNumber === "(sem número)") {
    const oldNumber = getProcessNumberFor(processId, data);
    if (oldNumber) finalProcessNumber = oldNumber;
}

processTags[tagInstanceId] = {
    processId,
    name: newBoard,
    color: finalColor,
    processNumber: finalProcessNumber,
    isBoardTag: true
};

  // 3️⃣ Salva
await setStorageData({ processTags });
}





document.getElementById("taskModal").addEventListener("click", (e) => {
  const btn = e.target.closest(".tag-manager-btn");
  
    // Verifica se o clique foi no botão de Gerenciar Tags
  if (btn) {
        // Impede qualquer propagação de clique que possa interferir no modal
    e.stopPropagation(); 
    e.preventDefault();

    const processId = btn.dataset.processId;
    const processNumber = btn.dataset.processNumber;

        // Envia mensagem ao background para abrir a janela do Tag Manager
    chrome.runtime.sendMessage({
      action: "openTagManager", 
      processId,
      processNumber
  }, response => {
      if (chrome.runtime.lastError) {
        console.error("Erro ao enviar mensagem para abrir Tag Manager:", chrome.runtime.lastError.message);
    }
});

        // OPCIONAL: Se você quiser fechar o modal de detalhes após clicar no botão Gerenciar Tags, descomente a linha abaixo:
        // bootstrap.Modal.getInstance(document.getElementById("taskModal")).hide();
}
});


 // RENDER BOARDS
// RENDER BOARDS
function renderBoards(boards) {

  const container = document.getElementById("boardsContainer");
  container.innerHTML = "";

  // 🔒 Segurança extra: só boards válidos
  const validBoards = boards.filter(
    b => b && b.name && b.showOnBoard === true
    );

  validBoards.forEach(board => {

    const boardEl = document.createElement("div");
    boardEl.classList.add("board");
    boardEl.dataset.board = board.name;

    // ================= HEADER =================
    const header = document.createElement("div");
    header.classList.add(
      "board-header",
      "d-flex",
      "justify-content-between",
      "align-items-center"
      );

    header.style.backgroundColor = board.color;

    // Nome do board
    const titleSpan = document.createElement("span");
    titleSpan.style.textShadow = "-1px 1px 10px black";
    titleSpan.textContent = board.name;

    // Botão +
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-sm text-white fw-bold add-task-btn";
    addBtn.dataset.board = board.name;
    addBtn.textContent = "+";
    addBtn.style.fontSize = "20px";
    addBtn.style.borderRadius = "6px";

    header.appendChild(titleSpan);
    header.appendChild(addBtn);
    boardEl.appendChild(header);

    // ================= TASK LIST =================
    const taskList = document.createElement("div");
    taskList.classList.add("task-list");
    boardEl.appendChild(taskList);

    container.appendChild(boardEl);

    // ================= SORTABLE =================
    new Sortable(taskList, {
      group: "shared",
      animation: 150,

      onEnd: async evt => {

        const processId = evt.item.dataset.processId;
        const newBoard = evt.to.closest(".board")?.dataset.board;

        if (!processId || !newBoard) return;

        const data = await getStorageData();
        if (!data.processData) data.processData = {};
        if (!data.processData[processId]) data.processData[processId] = {};

        const oldBoard = data.processData[processId].board || "Nenhum";

        // 🚫 Se soltou no mesmo board, ignora
        if (oldBoard === newBoard) return;

        // 🔒 Garante que o destino ainda é um board válido
        const isValidTarget = validBoards.some(b => b.name === newBoard);
        if (!isValidTarget) {
          console.warn("Board inválido:", newBoard);
          return;
      }

        // ================= UPDATE STORAGE =================
      data.processData[processId].board = newBoard;
      data.processData[processId].enteredBoardAt = Date.now();
      data.processData[processId].lastMove = Date.now();

      if (!data.processData[processId].history)
          data.processData[processId].history = [];

      data.processData[processId].history.push({
          date: Date.now(),
          action: `Movido de ${oldBoard} para ${newBoard}`
      });

      await setStorageData({ processData: data.processData });

        // ================= TAG DE BOARD =================
      const processNumber =
      getProcessNumberFor(processId, data) || "(sem número)";

      await updateTagOnBoardChange(
          processId,
          oldBoard,
          newBoard,
          processNumber,
          { source: 'kanban' }
          );

        // 🔥 Garante permanência visual
      evt.to.appendChild(evt.item);

      computeLoadForecast();
  }
});
});
}


 // CRIA TASKS a partir de processTags (mantém apenas 1 task por processId)
function createTasks(processTags, processData = {}) {
  const tasks = [];

  // 1) a partir das tags (mantém apenas 1 task por processId)
  for (const [key, tag] of Object.entries(processTags || {})) {

    // 🔥 CORREÇÃO: Usar a propriedade processId salva no objeto tag
    const processId = tag.processId;

        // ignora tags corrompidas
    if (!processId || processId === "undefined" || !tag) {
      console.warn("Ignorando tag inválida:", key, tag);
      continue;
  }

        // evita duplicação
  if (processId && !tasks.find(t => t.processId === processId)) {
    tasks.push({
      processId,
      processNumber: tag.processNumber || "",
      color: tag.color || "#6c237d",
      name: tag.name || ""
  });
}
}

    // 2) incluir processos que EXISTEM só em processData (sem nenhuma tag)
for (const [processId, pdata] of Object.entries(processData || {})) {
  if (!tasks.find(t => t.processId === processId)) {
    tasks.push({
      processId,
      processNumber: pdata.processNumber || pdata.processNumber || "",
      color: "#6c237d",
      name: pdata.board || ""
  });
}
}

return tasks;
}


function getTwoBusinessDaysAhead() {
   const date = new Date();
   let daysToAdd = 2;

   while (daysToAdd > 0) {
     date.setDate(date.getDate() + 1);
     const day = date.getDay();
         if (day !== 0 && day !== 6) { // pula fim de semana
           daysToAdd--;
       }
   }
   date.setHours(0, 0, 0, 0);
   return date;
}

 // RENDER TASKS em seus boards (usando processData para board e dataprazo/description)
 // RENDER TASKS em seus boards (usando processData para board e dataprazo/description)
async function renderTasks(tasks, processData) {
    // limpa listas
    document.querySelectorAll(".task-list").forEach(l => l.innerHTML = "");

    // helper: normaliza nomes (remove acentos, minuscula, trim)
    function normalizeName(s){
      if (!s) return "";
      return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  const allBoards = [...document.querySelectorAll(".board")];

  for (const task of tasks) {
      let boardName = (processData && processData[task.processId] && processData[task.processId].board);

    // 🔥 CORREÇÃO 1: Bloqueio imediato se o board estiver desativado
      if (!view_board && (!boardName || boardName === "Em análise" || boardName === "Sem Board")) {
        continue;
    }
    
    if (!boardName) boardName = "Em análise";

    let boardEl = allBoards.find(b => b.dataset.board === boardName);

    if (!boardEl) {
        const targetNorm = normalizeName(boardName);
        boardEl = allBoards.find(b => normalizeName(b.dataset.board) === targetNorm);
    }

        // Se ainda não encontrou o board (ex: board deletado mas task ainda aponta pra ele)

    if (!boardEl) {
        // Se view_board é false, NÃO permitimos fallback para o primeiro board da lista
        if (!view_board) {
            continue; // Ignora a task em vez de jogar no allBoards[0]
        }
        
        boardEl = allBoards[0];
        if (!boardEl) continue;
    }

    const taskList = boardEl.querySelector(".task-list");
    if (!taskList) continue;

    const prazo = processData?.[task.processId]?.dataPrazo || "";
    const description = processData?.[task.processId]?.description || "";

    let formattedDate = "";
        let colortask = "#444A4F"; // padrão cinza

        chrome.storage.local.get(['userSettings', 'customTheme'], (data) => {
        // Tenta pegar de 'customTheme' ou 'userSettings'
            const isDark = data.customTheme?.isDark || data.userSettings?.darkMode || false;
            if(isDark=== false){colortask="#444A4F"}else{colortask="#fff"}
        });

        if (prazo) {
          const parts = prazo.split('-').map(Number);
          if (parts.length === 3) {
            const expiryDate = new Date(parts[0], parts[1] - 1, parts[2]);
            expiryDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const twoBusinessDaysAhead = getTwoBusinessDaysAhead();

            const day = String(expiryDate.getDate()).padStart(2, '0');
            const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
            const year = expiryDate.getFullYear();
            formattedDate = `${day}/${month}/${year}`;

            if (expiryDate.getTime() <= today.getTime()) {
                    colortask = "#940D0D"; // vermelho - vencido
                } else if (expiryDate.getTime() <= twoBusinessDaysAhead.getTime()) {
                    colortask = "#FF9900"; // amarelo - 2 dias úteis restantes
                } else {
                    colortask = "#444A4F"; // cinza - ok
                }
            }
        }

        // cria elementos
        const taskEl = document.createElement("div");
        taskEl.classList.add("task");
        taskEl.style.setProperty('border-left', `6px solid ${colortask}`, 'important');

        taskEl.dataset.processId = task.processId;

        taskEl.innerHTML = `
        <div class="task-content" style="max-width: 100%; overflow: hidden;">
        <span style="" class=''><strong>${task.processNumber || "(Sem número)"}</strong></span>
          ${description ? `
            <br>
            <small class="text-secondary text-truncate d-inline-block w-100" title="${description}">
                <i class="fa fa-quote-left"></i> ${description}
            </small>
            ` : ''}

            ${formattedDate ? `
            <br><i class="fa fa-calendar" aria-hidden="true"></i>
            <small class="due-date">Prazo: ${formattedDate}</small>
                ` : ''}
        </div>
            `;

            taskEl.dataset.description = description;
            taskEl.addEventListener("click", () =>
              openModal(task, {
                dataPrazo: prazo,
                description
            })
              );

            taskList.appendChild(taskEl);
            updateTaskElement(task.processId, prazo, description);
        }
    }

    document.getElementById("taskModal").addEventListener("hide.bs.modal", event => {
      if (modalDirty) {
    event.preventDefault(); // impede fechar
    
    Swal.fire({
      title: "Descartar alterações?",
      text: "Você fez alterações que não foram salvas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Descartar",
      cancelButtonText: "Voltar",
      reverseButtons: true
  }).then(result => {
      if (result.isConfirmed) {
        modalDirty = false;
        const modalEl = document.getElementById("taskModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide(); // agora fecha de verdade
    }
});
}
});


    let currentTask = null;

    function openModal(task, dataFromStorage = {}) {
     currentTask = task;
     document.getElementById("modalProcessId").textContent = task.processId;
     document.getElementById("modalProcessNumber").textContent = task.processNumber;
     document.getElementById("modalDataPrazo").value = dataFromStorage.dataPrazo || "";
     document.getElementById("modalDescription").value = dataFromStorage.description || "";
     const modal = new bootstrap.Modal(document.getElementById("taskModal"));
     modal.show();

     // 🔹 Exibir as tags no modal
     renderTagsInsideModal(task.processId,task.processNumber,task.type);

     renderHistory(task.processId);
     renderBoardTime(task.processId);

         modalDirty = false; // reset ao abrir o modal

         const prazoInput = document.getElementById("modalDataPrazo");
         const descInput = document.getElementById("modalDescription");

         function markDirty() {
          modalDirty = true;
      }

      prazoInput.addEventListener("input", markDirty);
      descInput.addEventListener("input", markDirty);


  }



 // =============================================================
 // RENDERIZA AS TAGS DO PROCESSO DENTRO DO MODAL
 // =============================================================
  async function renderTagsInsideModal(processId, processNumber) {
    const container = document.getElementById("tagsListModal");
    if (!container) return;

    const data = await getStorageData();
    const processTags = data.processTags || {};
    const processInfo = data.processData ? data.processData[processId] : null;

    // Verifica se é manual pelo atributo type que criamos acima
    const isManual = processInfo && processInfo.type === 'manual';

    // Filtramos as tags (aceitando os dois tipos de separadores por segurança)
    const tagsForProcess = Object.entries(processTags)
    .filter(([key]) => key.startsWith(processId + "-") || key.startsWith(processId + "_"))
    .map(([key, tag]) => ({ id: key, name: tag.name, color: tag.color }));

    container.innerHTML = "";

    // Criamos o botão de engrenagem
    const gearBtn = document.createElement("button");
    gearBtn.className = `btn btn-sm p-0 tag-manager-btn ${isManual ? 'disabled' : ''}`;
    gearBtn.dataset.processId = processId;
    gearBtn.dataset.processNumber = processNumber || "(Sem número)";
    gearBtn.title = isManual ? "Processos manuais não podem ser editados" : "Gerenciar Tags";
    
    // Estilo do botão
    gearBtn.style.cssText = `
        flex-shrink: 0; background: none; border: none;
        color: ${isManual ? '#d3d3d3' : '#6c757d'}; 
        cursor: ${isManual ? 'not-allowed' : 'pointer'};
        opacity: ${isManual ? '0.5' : '0.7'};
        margin-right: 8px;
    `;

    // BLOQUEIO REAL: Se for manual, desativamos o botão
    if (isManual) {
        gearBtn.disabled = true;
        gearBtn.onclick = (e) => { e.preventDefault(); return false; };
    }

    gearBtn.innerHTML = '<i class="fa-solid fa-gear"></i>';
    container.appendChild(gearBtn);

    // Renderiza as tags ao lado do botão
    if (tagsForProcess.length === 0) {
        container.insertAdjacentHTML('beforeend', '<span class="text-muted small">Sem tags.</span>');
    } else {
        tagsForProcess.forEach(tag => {
            const tagSpan = document.createElement("span");
            tagSpan.className = "badge";
            tagSpan.style.cssText = `background-color: ${tag.color}; margin-left: 4px; font-weight: normal;`;
            tagSpan.textContent = tag.name;
            container.appendChild(tagSpan);
        });
    }
}



 // =============================================================
 // BOTÃO ABRIR PROCESSO — Abre a URL do processo em nova aba
 // =============================================================
document.getElementById("openProcessBtn").addEventListener("click", () => {
   if (!currentTask) return;
   const processNumber = currentTask.processNumber || "";
   const processId = currentTask.processId;

     // Monte sua URL conforme o sistema que usa
   const url = `https://processodigital.praiagrande.sp.gov.br/processo/${processId}`;
   window.open(url, "_blank");
});

document.getElementById("SearchProcessBtn").addEventListener("click", () => {
   if (!currentTask) return;
   const processNumber = currentTask.processNumber || "";
   const procss = processNumber.split("/");
   const processId = currentTask.processId;

     // Monte sua URL conforme o sistema que usa
   const url = chrome.runtime.getURL(`lista_assinador.html?busca=${procss[0]}`);;
   window.open(url, "_blank");
});


// =========================================================================
// NO ARQUIVO: kanban.js
// =========================================================================

document.getElementById("removeTaskBtn").addEventListener("click", async () => {
 if (!currentTask) return;

 const confirm = await Swal.fire({
   title: "Remover processo e dados?",
   text: "Isso removerá as tags, o prazo e a descrição deste processo.",
   icon: "warning",
   showCancelButton: true,
   confirmButtonColor: "#d33",
   cancelButtonColor: "#6c757d",
   confirmButtonText: "Sim, remover tudo",
   cancelButtonText: "Cancelar"
});

 if (confirm.isConfirmed) {
   const data = await getStorageData();
   const processId = currentTask.processId;

       // 1. Remove todas as tags do processo
   for (const key of Object.keys(data.processTags || {})) {
     if (key.startsWith(processId + "-")) {
       delete data.processTags[key];
   }
}

       // 2. CORREÇÃO: Remove também os dados (Descrição, Prazo, Board)
if (data.processData && data.processData[processId]) {
 delete data.processData[processId];
}

       // Salva tudo limpo
await setStorageData({
 processTags: data.processTags,
 processData: data.processData
});

Swal.fire({
 title: "Removido!",
 text: "O processo foi removido do quadro.",
 icon: "success",
 timer: 1500,
 showConfirmButton: false
});

       // Fecha o modal e atualiza a tela
document.querySelector("#taskModal .btn-close")?.click();
await init();
}
});



 // Salva dataPrazo e description em processData e re-renderiza
document.getElementById("saveTaskBtn").addEventListener("click", async () => {
  if (!currentTask) return;

  const dataPrazo = document.getElementById("modalDataPrazo").value || "";
  const description = document.getElementById("modalDescription").value || "";
  const processId = currentTask.processId;

  const data = await getStorageData();
  if (!data.processData) data.processData = {};
  if (!data.processData[processId]) {
    data.processData[processId] = {
      processNumber: getProcessNumberFor(processId, data) || "",
        board: oldBoard,       // garante que o board exista ANTES da troca
        description: "",
        dataPrazo: "",
        enteredBoardAt: Date.now(),
        lastMove: Date.now(),
        history: []
    };
}

  // salvar dados
data.processData[processId].dataPrazo = dataPrazo;
data.processData[processId].description = description;

  // histórico
if (!data.processData[processId].history) {
    data.processData[processId].history = [];
}

data.processData[processId].history.push({
    date: Date.now(),
    action: `Alterou dados: prazo (${dataPrazo || "vazio"}) e/ou descrição`
});

  // salvar no storage
await setStorageData({ processData: data.processData });

  // atualizar task na UI
updateTaskElement(processId, dataPrazo, description);

modalDirty = false;
computeLoadForecast();

document.querySelector("#taskModal .btn-close")?.click();
});


function updateTaskElement(processId, dataPrazo, description) {
   const taskEl = document.querySelector(`.task[data-process-id="${processId}"]`);
   if (!taskEl) {
     console.warn("❌ Task não encontrada para processId:", processId);
     return;
 }

     //console.log("✅ Atualizando task:", processId, "com prazo:", dataPrazo);

     // Atualiza a descrição no dataset (mantém compatível com modal)
 taskEl.dataset.description = description || "";

 let formattedDate = "";
 let colortask = "#6c757d";

 if (dataPrazo) {
   const parts = dataPrazo.split('-').map(Number);
   if (parts.length === 3) {
     const expiryDate = new Date(parts[0], parts[1] - 1, parts[2]);
     expiryDate.setHours(0, 0, 0, 0);

     const today = new Date();
     today.setHours(0, 0, 0, 0);

     const twoBusinessDaysAhead = getTwoBusinessDaysAhead();

     const day = String(expiryDate.getDate()).padStart(2, '0');
     const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
     const year = expiryDate.getFullYear();
     formattedDate = `${day}/${month}/${year}`;

     if (expiryDate.getTime() <= today.getTime()) {
                 colortask = "#dc3545"; // vencido - vermelho
             } else if (expiryDate.getTime() <= twoBusinessDaysAhead.getTime()) {
                 colortask = "#ffc107"; // expira em até 2 dias úteis - amarelo
             } else {
                 colortask = "#6c757d"; // dentro do prazo - cinza
             }

             //console.log("🟢 Cor aplicada:", colortask);
         }
     }

     // Aplica a borda lateral colorida
     taskEl.style.borderLeft = `6px solid ${colortask}`;

     // Atualiza ou cria o elemento que exibe o prazo
     let dueDateEl = taskEl.querySelector(".due-date");
     if (!dueDateEl) {
       dueDateEl = document.createElement("div");
       dueDateEl.className = "due-date small text-muted";
       taskEl.appendChild(dueDateEl);
   }

   dueDateEl.textContent = formattedDate ? `Prazo: ${formattedDate}` : "";
}




async function init() {
  const data = await getStorageData();

  let predefinedTags = data.predefinedTags || [];
  predefinedTags = sortPredefinedTags(predefinedTags);

     //let predefined = data.predefinedTags || [];

  const predefined = predefinedTags.filter(tag => tag.showOnBoard === true);
  cachedBoards = predefined;
// Corrige tags que não possuem processId
  for (const [key, tag] of Object.entries(data.processTags || {})) {
      const pid = key.split("-")[0];
      if (!tag.processId) {
        tag.processId = pid;
        data.processTags[key] = tag;
    }
}

// Salva correção
await setStorageData({ processTags: data.processTags });

renderGuide(predefined);

     // 🔹 Garante que o primeiro board "Em análise" exista
const defaultBoardName = "Em análise";
if (view_board) {
    if (!predefined.some(b => b.name === defaultBoardName)) {
        predefined.unshift({
            name: defaultBoardName,
            color: "#0d6efd",
            showOnBoard: true
        });
    }
}

     // 🔹 Cria tasks a partir das tags existentes
const tasks = createTasks(data.processTags || {});

     // 🔹 Define board de cada processo conforme tags
const processData = data.processData || {};

    // define board de cada processo conforme tags
// Não recalcular o board pelas tags.
// Se o processo não tiver board ainda, assume o default.

// === CORREÇÃO DEFINITIVA PARA O BOARD ENTRAR CERTO ===
for (const task of tasks) {
    const processId = task.processId;

    if (!processData[processId]) {
        processData[processId] = {};
    }

    // Se já tem board salvo, respeita
    if (processData[processId].board) continue;//

    // Busca a tag mais recente do processo
    const tagEntry = Object.entries(data.processTags || {})
    .filter(([key]) => key.startsWith(processId + "-"))
    .sort((a, b) => Number(b[0].split("-")[1]) - Number(a[0].split("-")[1]))[0];

    if (tagEntry) {
        const tagObj = tagEntry[1];
        processData[processId].board = tagObj.name || defaultBoardName;
    } else {
        // 🔥 ALTERAÇÃO AQUI:
        // Se view_board for false, não atribuímos "Em análise" como fallback
        processData[processId].board = view_board ? defaultBoardName : "Sem Board";
    }
}

     // 🔹 Atualiza storage local com possíveis ajustes
await setStorageData({
   processData
});

     // 🔹 Renderiza a interface
renderBoards(predefined);


await renderTasks(tasks, processData);
computeLoadForecast();
     // 🚀 SOLUÇÃO: Ativa o listener de refresh automático
enableAutoRefresh();
}


// kanban.js

function enableAutoRefresh() {

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {

    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName !== "local") return;

      const modalEl = document.getElementById("taskModal");
      const isModalOpen = modalEl && modalEl.classList.contains("show") && currentTask;

            // Atualiza apenas o modal
      if (isModalOpen && changes.processTags) {
          renderTagsInsideModal(currentTask.processId, currentTask.processNumber,currentTask.type);
          renderHistory(currentTask.processId);
          renderBoardTime(currentTask.processId);
      }

            // 🔥 SINCRONIZAÇÃO TAG → BOARD
      if (changes.processTags) {
          const data = await getStorageData();

          for (const [fullKey, tag] of Object.entries(data.processTags || {})) {
            const [processId] = fullKey.split("-");

                    // verifica se a tag corresponde a um board existente
            if (!tag.isBoardTag) continue;

                    // ✔ Só sincronizar se for realmente uma tag de board
            const boardObj = (data.predefinedTags || []).find(b => b.name === tag.name);
            if (!boardObj) continue;

            if (!data.processData[processId]) {
              data.processData[processId] = {};
          }

                    // se já está correto, pula
          if (data.processData[processId].board === boardObj.name) continue;

                    // atualiza board
          data.processData[processId].board = boardObj.name;
          data.processData[processId].enteredBoardAt = Date.now();
          data.processData[processId].lastMove = Date.now();

          if (!data.processData[processId].history) {
              data.processData[processId].history = [];
          }

          data.processData[processId].history.push({
              date: Date.now(),
              action: `Board atualizado automaticamente para '${boardObj.name}' devido à tag.`
          });
      }

      await setStorageData({ processData: data.processData });
  }

            // 🔄 Atualização automática do Kanban
  if (isRefreshing) return;

  isRefreshing = true;
  init().then(() => {
      setTimeout(() => (isRefreshing = false), 200);
  });

});

} else {

        // modo Mock — não gera loop
    setInterval(() => {
      if (isRefreshing) return;

      isRefreshing = true;
      init().then(() => {
        isRefreshing = false;
    });
  }, 1500);
}
}


enableAutoRefresh();
init();