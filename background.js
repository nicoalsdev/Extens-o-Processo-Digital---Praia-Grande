// ========================================================================
//  Gerenciador Processo Digital — background.js (CLEAN CODE)
// ========================================================================

// ========================================================================
//  CONSTANTES GERAIS
// ========================================================================
const PROCESS_TAGS_KEY = "processTags";
const SIGNED_DOCUMENTS_KEY = "signedDocuments";
const CLEANUP_ALARM_NAME = "dailyTagCleanup";

const DAYS_TO_KEEP = 40;
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const THRESHOLD_MS = DAYS_TO_KEEP * MS_IN_DAY;
//
let uploadQueue = [];
let filaBatch = [];
// Rastreia popups abertos por abas específicas
const popupTracker = {};
const logss = false;
console.log("🔧 background.js iniciado.");


// ========================================================================
//  UTIL: Log formatado
// ========================================================================
function log(...args) {
 if(logss) {console.log("[BG]", ...args);}
}


// ========================================================================
//  FUNÇÃO: Limpar Tags Antigas (>40 dias)
// ========================================================================
function cleanupOldTags() {
    log(`Iniciando limpeza de tags antigas (> ${DAYS_TO_KEEP} dias)`);

    chrome.storage.local.get([PROCESS_TAGS_KEY], (result) => {
        const allTags = result[PROCESS_TAGS_KEY] || {};
        const now = Date.now();
        const updatedTags = {};
        let removedCount = 0;

        for (const tagId of Object.keys(allTags)) {

            const parts = tagId.split("-");
            const timestampStr = parts.pop();

            if (!/^\d{10,}$/.test(timestampStr)) {
                updatedTags[tagId] = allTags[tagId];
                continue;
            }

            const timestamp = Number(timestampStr);

            if (now - timestamp > THRESHOLD_MS) {
                removedCount++;
            } else {
                updatedTags[tagId] = allTags[tagId];
            }
        }

        if (removedCount > 0) {
            chrome.storage.local.set({ [PROCESS_TAGS_KEY]: updatedTags }, () => {
                log(`Limpeza concluída. ${removedCount} tags removidas.`);
            });
        } else {
            log("Nenhuma tag antiga para remover.");
        }
    });
}


// ========================================================================
//  ALARME DIÁRIO PARA LIMPEZA AUTOMÁTICA
// ========================================================================
chrome.runtime.onInstalled.addListener(() => {
    log("Extensão instalada. Agendando alarme de limpeza automática.");

    chrome.alarms.create(CLEANUP_ALARM_NAME, {
        delayInMinutes: 1,
        periodInMinutes: 24 * 60
    });

    chrome.tabs.create({
        url: chrome.runtime.getURL("bem-vindo.html")
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CLEANUP_ALARM_NAME) {
        cleanupOldTags();
    }
});


// ========================================================================
//  FUNÇÃO: Criar Popup para Tags / Processos
// ========================================================================
function openPopupForProcess(msg, sender) {
    const { processId, processNumber } = msg;

    // Fecha popup anterior relacionado a esta aba
    const existingPopup = popupTracker[sender.tab.id];
    if (existingPopup) {
        chrome.windows.remove(existingPopup).catch(() => {});
    }

    chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 480,
        height: 650
    }, (win) => {
        if (!win || !win.tabs) return;

        popupTracker[sender.tab.id] = win.id;

        setTimeout(() => {
            chrome.tabs.sendMessage(win.tabs[0].id, {
                action: "setProcessData",
                processId,
                processNumber: processNumber ?? null
            }).catch(e => log("Erro ao enviar dados ao popup:", e));
        }, 300);
    });
}


// ========================================================================
//  CONTROLE: Fechar popup se aba navegar / fechar
// ========================================================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && popupTracker[tabId]) {
        chrome.windows.remove(popupTracker[tabId]).catch(() => {});
        delete popupTracker[tabId];
        log(`Popup fechado pois a aba ${tabId} mudou de URL.`);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (popupTracker[tabId]) {
        chrome.windows.remove(popupTracker[tabId]).catch(() => {});
        delete popupTracker[tabId];
        log(`Popup removido pois a aba ${tabId} foi fechada.`);
    }
});

chrome.windows.onRemoved.addListener((windowId) => {
    for (const tabId in popupTracker) {
        if (popupTracker[tabId] === windowId) {
            delete popupTracker[tabId];
            log(`Popup removido manualmente (janela fechada).`);
            break;
        }
    }
});

chrome.omnibox.onInputEntered.addListener((text) => {
  // Isso cria algo como: chrome-extension://id-da-extensao/lista_assinador.html?busca=valor
  const newURL = chrome.runtime.getURL("lista_assinador.html") + "?busca=" + encodeURIComponent(text);
  
  chrome.tabs.update({ url: newURL });
});


// ========================================================================
//  LISTENER ÚNICO DE MENSAGENS (CLEAN CODE)
// ========================================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
const ORIGINAL_ASSINADOR_URL = "https://www.intra.pg/SEAD/SitePages/assd2.aspx"; // <--- MANTENHA O URL CORRETO AQUI!
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxduFhre4_KdwnZLhwsseSUOEBoQ1PtwvX4MwT5ctC1c0OFVGv7LaTW4B0ESfgEosaD/exec";

    // 🚨 CORREÇÃO ESSENCIAL: Define tabId usando o objeto sender
    // Se a mensagem não veio de uma aba (e.g., popup), sender.tab pode ser nulo.
    // Usamos um early return se não houver tabId para evitar erro.
if (!sender.tab || !sender.tab.id) {
        // log(`[BG] Mensagem da ação ${msg.action} ignorada: Não veio de uma aba.`);
        // return false ou ignorar
}
    // 🚨 CORREÇÃO ESSENCIAL: DEFINIR tabId AQUI
const tabId = sender.tab?.id;
if (!tabId) {
        // Se a mensagem não veio de uma aba válida (ex: veio do popup, mas não para o caso dele), 
        // ignora a execução para tabs.update
        // console.warn("Mensagem ignorada: tabId não encontrado.");
    return;
}

switch (msg.action) {

case "getListaURL":
    sendResponse({ url: chrome.runtime.getURL("lista.html") });
    break;

case "openPopupWithProcess":
    openPopupForProcess(msg, sender);
    break;

case "openTagManager":
    chrome.storage.local.set({
        currentProcessId: msg.processId,
        currentProcessNumber: msg.processNumber
    });

    chrome.windows.create({
        url: chrome.runtime.getURL(`tag_manager.html?processId=${msg.processId}`),
        type: "popup",
        width: 480,
        height: 550
    });
    break;

case "forceCleanup":
    cleanupOldTags();
    break;

case "openMinhaLista":
    chrome.tabs.create({
        url: chrome.runtime.getURL("lista.html")
    });
    break;

case "openUploader":
  chrome.tabs.create({
    url: "https://assinadordigitalexterno.praiagrande.sp.gov.br/"
}, tab => {
    sendResponse({ tabId: tab.id });
});
  break;

case "openNewViewTab":
 chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL("lista_assinador.html")
});

 break;


case "removerStatusSheets":
    fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
            acao: "remover", 
            id: msg.id 
        })
    })
    .then(res => res.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            sendResponse({ success: true, data });
        } catch (e) {
            // Se o Google redirecionou mas a exclusão ocorreu na planilha
            console.warn("⚠️ Resposta do Apps Script após remoção não veio em JSON puro:", text);
            sendResponse({ success: true, warning: "Removido na planilha com redirecionamento HTML" });
        }
    })
    .catch(err => {
        console.error("❌ Erro ao remover do Sheets:", err);
        sendResponse({ success: false, error: err.toString() });
    });

    return true; // Mantémanal aberto para a resposta assíncrona

break;
 
 
case "salvarStatusSheets":
    chrome.storage.local.get(['dadosPessoais'], (result) => {
        const dadosPessoais = result.dadosPessoais || {};
        const nomeUsuario = dadosPessoais.nome || "Usuário Interno";

        fetch(GOOGLE_SHEETS_WEBAPP_URL, {
            method: "POST",
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ 
                id: msg.id, 
                status: msg.status,
                usuario: nomeUsuario 
            })
        })
        .then(res => res.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                sendResponse({ success: true, data: data });
            } catch (e) {
                console.error("❌ Resposta inválida do Sheets:", text);
                sendResponse({ success: false, error: "Resposta não JSON do Sheets" });
            }
        })
        .catch(err => {
            console.error("❌ Erro no POST do Sheets:", err);
            sendResponse({ success: false, error: err.toString() });
        });
    });
    return true; // IMPRESCINDÍVEL: mantém a porta de comunicação aberta até o fetch responder!

case "obterStatusSheets":
    fetch(GOOGLE_SHEETS_WEBAPP_URL, {
        method: "GET",
        redirect: "follow"
    })
    .then(res => res.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            sendResponse({ success: true, data: data });
        } catch (e) {
            console.error("❌ Erro ao parsear GET do Sheets:", text);
            sendResponse({ success: false, data: {} });
        }
    })
    .catch(err => {
        console.error("❌ Erro no GET do Sheets:", err);
        sendResponse({ success: false, data: {} });
    });
    return true; // IMPRESCINDÍVEL: mantém a porta de comunicação aberta até o fetch responder!

case "goToOriginalAssinador":
                // ATUALIZA a aba atual (tabId) com o URL externo (Original)
    chrome.tabs.update(tabId, {
        url: ORIGINAL_ASSINADOR_URL
    });
    break;

//////////////////////////////////////////////////////////////////////////////////////////


case "capturarDadosCompletos": {
    const destinoRaw = msg.destino;

    chrome.storage.local.get(['dadosPessoais'], (result) => {
        let dadosExistentes = result.dadosPessoais || {};

        // Se já tivermos o nome e CPF, apenas atualizamos o destino
        if (dadosExistentes.nome && dadosExistentes.nome !== "Não encontrado") {
            const dadosAtualizados = { ...dadosExistentes, destino: destinoRaw };
            chrome.storage.local.set({ 'dadosPessoais': dadosAtualizados }, () => {
                sendResponse(dadosAtualizados);
            });
        } else {
            // Caso contrário, busca na página de perfil (em background)
            fetch("https://loginunicointerno.praiagrande.sp.gov.br/DadosPessoais/EditarDados")
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Busca os valores nos IDs específicos que você forneceu
                    const nomeExtraido = doc.querySelector('#Nome')?.value || "Não encontrado";
                    const cpfExtraido = doc.querySelector('#cpf')?.value || "Não encontrado";

                    const novosDados = {
                        destino: destinoRaw,
                        nome: nomeExtraido,
                        cpf: cpfExtraido
                    };

                    chrome.storage.local.set({ 'dadosPessoais': novosDados }, () => {
                        console.log("Dados buscados remotamente e salvos!");
                        sendResponse(novosDados);
                    });
                })
                .catch(err => {
                    console.error("Erro ao buscar dados de perfil:", err);
                    sendResponse({ ...dadosExistentes, destino: destinoRaw, erro: "Falha na busca remota" });
                });
        }
    });
    return true; 
}
break;

case "prepareBatchUpload":
    // Recebe a lista de arquivos. Nota: Se forem muitos arquivos grandes, 
    // o ideal seria usar IndexedDB, mas para filas pequenas, a RAM do BG resolve.
    uploadQueue = msg.files; // msg.files deve conter { name, data (base64 ou blob) }
    sendResponse({ status: "Fila preparada", count: uploadQueue.length });
    break;

case "getNextBatchFile":
    if (uploadQueue.length > 0) {
        const nextFile = uploadQueue.shift();
        sendResponse({ file: nextFile, remaining: uploadQueue.length });
    } else {
        sendResponse({ file: null });
    }
    break;

case "clearBatchQueue":
    uploadQueue = [];
    sendResponse({ status: "Fila limpa" });
    break;
    
case "setBatchQueue":
    filaBatch = msg.files; // Array de arquivos em Base64
    sendResponse({ status: "Fila gravada", total: filaBatch.length });
    break;

case "getNextBatch":
    if (msg.peek) {
        // Apenas verifica se tem algo, sem dar shift
        sendResponse({ hasItems: filaBatch.length > 0 });
    } else if (filaBatch.length > 0) {
        const next = filaBatch.shift();
        sendResponse({ file: next, remaining: filaBatch.length });
    } else {
        sendResponse({ file: null });
    }
    break;

default:
            //log("Mensagem ignorada:", msg);
}
if (msg.action === "getSignatures") {

    const url = `https://assinadordigitalexterno.praiagrande.sp.gov.br/sign/pades/signers/${msg.id}`;

    fetch(url)
    .then(res => res.json())
    .then(data => {
        sendResponse({ ok: true, data });
    })
    .catch(err => {
        sendResponse({ ok: false, error: err.toString() });
    });

}

return true;
});


// ========================================================================
//  COMANDO DO TECLADO (Opcional)
// ========================================================================
chrome.commands?.onCommand.addListener((command) => {
    if (command === "inject-assinador") {
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
            if (!tab) return;
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["js/content_assinador.js"]
            }).then(() => log("Injeção forçada executada."));
        });
    }
});
