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

//Tracker
const ALARM_MONITOR_NAME = "monitorAssinaturas";
const MAX_MONITORAMENTO = 10;



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
    // NOVO: Dispara a verificação das assinaturas
    if (alarm.name === ALARM_MONITOR_NAME) {
        verificarProcessosMonitorados();
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


case "mostrar_notificacao":
    // Chama a função passando os parâmetros recebidos da mensagem
    criarNotificacao(msg.titulo, msg.texto, msg.link);
    sendResponse({ status: "Notificação disparada com link!" });
    break;


case "trackProcess":
    chrome.storage.local.get(['processosMonitorados'], (result) => {
        let monitorados = result.processosMonitorados || [];
        
        // Verifica se o processo já está na lista
        const existeIndex = monitorados.findIndex(p => p.idAssinador === msg.doc.idAssinador);
        
        if (existeIndex > -1) {
            // Se já existe, removemos (efeito de Ligar/Desligar)
            monitorados.splice(existeIndex, 1);
            chrome.storage.local.set({ processosMonitorados: monitorados });
            sendResponse({ success: true, status: "removido" });
        } else {
            // Se não existe, verifica o limite de 6
            if (monitorados.length >= MAX_MONITORAMENTO) {
                sendResponse({ success: false, error: "Você já está monitorando "+MAX_MONITORAMENTO+" processos. Remova algum para adicionar outro." });
                return;
            }

            // Adiciona o novo processo
            monitorados.push({
                idAssinador: msg.doc.idAssinador,
                titulo: msg.doc.titulo,
                contagemTotal: msg.doc.contagemTotal,
                assinantesJaRegistrados: msg.doc.assinantesIniciais || [],
                todosAssinaram: false
            });
            
            chrome.storage.local.set({ processosMonitorados: monitorados });
            
            // Garante que o alarme de checagem a cada 3 minutos está rodando
            chrome.alarms.create(ALARM_MONITOR_NAME, { periodInMinutes: 3 }); 
            sendResponse({ success: true, status: "adicionado" });
        }
    });
    return true; // Mantém porta aberta para resposta assíncrona


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


// ========================================================================
//  SISTEMA DE NOTIFICAÇÕES COM LINK
// ========================================================================

// Objeto para guardar os links associados ao ID de cada notificação
const notificationLinks = {};

/**
 * Função global para disparar notificações
 * @param {string} titulo - Título da notificação
 * @param {string} texto - Mensagem da notificação
 * @param {string} link - URL para abrir ao clicar (opcional)
 */
function criarNotificacao(titulo, texto, link, idParaPararMonitoramento) {
    const notifId = `notificacao_${Date.now()}`;

    // Agora guardamos o link e o ID do processo que deve ser interrompido
    notificationData[notifId] = { 
        link: link, 
        idAssinador: idParaPararMonitoramento 
    };

    chrome.notifications.create(notifId, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: titulo || 'Aviso',
        message: texto || '',
        priority: 2,
        requireInteraction: true // 🔥 Faz a notificação ficar na tela até você clicar ou fechar!
    });
}

// Quando o usuário CLICA na notificação
chrome.notifications.onClicked.addListener((notifId) => {
    const data = notificationData[notifId];
    if (data) {
        // 1. Abre a aba com o processo
        if (data.link) {
            chrome.tabs.create({ url: data.link });
        }
        
        // 2. 🔥 PARA DE MONITORAR AUTOMATICAMENTE
        if (data.idAssinador) {
            chrome.storage.local.get(['processosMonitorados'], (result) => {
                let monitorados = result.processosMonitorados || [];
                // Filtra a lista removendo o processo clicado
                monitorados = monitorados.filter(p => p.idAssinador !== data.idAssinador);
                chrome.storage.local.set({ processosMonitorados: monitorados });
            });
        }
        
        chrome.notifications.clear(notifId);
        delete notificationData[notifId];
    }
});

// Limpeza de memória caso o usuário FECHE a notificação sem clicar (no "X")
chrome.notifications.onClosed.addListener((notifId) => {
    if (notificationData[notifId]) {
        delete notificationData[notifId];
    }
});


// FUNÇÃO QUE RODA NO FUNDO VERIFICANDO ASSINATURAS
async function verificarProcessosMonitorados() {
    const result = await chrome.storage.local.get(['processosMonitorados']);
    let monitorados = result.processosMonitorados || [];
    
    if (monitorados.length === 0) return;

    for (let processo of monitorados) {
        try {
            const url = `https://assinadordigitalexterno.praiagrande.sp.gov.br/sign/pades/signers/${processo.idAssinador}`;
            const res = await fetch(url);
            
            if (!res.ok) continue;
            
            const assinaturas = await res.json();
            if (!Array.isArray(assinaturas)) continue;

            const nomesAtuais = assinaturas.map(a => a.responsavel.trim().toUpperCase());
            const termoBusca = processo.titulo;
            const linkAcesso = chrome.runtime.getURL("lista_assinador.html") + "?busca=" + encodeURIComponent(termoBusca);

            // 1. Compara quem assinou agora com a nossa foto inicial
            const novosAssinantes = nomesAtuais.filter(nome => !processo.assinantesJaRegistrados.includes(nome));
            
            for (let novoNome of novosAssinantes) {
                criarNotificacao(
                    "Nova Assinatura no Processo!",
                    `📝 ${novoNome} acabou de assinar o processo: ${processo.titulo}`,
                    linkAcesso,
                    processo.idAssinador // 🔥 Passa o ID para que o clique mate o monitoramento
                );
                
                // 💡 PULO DO GATO: Nós NÃO atualizamos o "processo.assinantesJaRegistrados" aqui.
                // Se você não clicar na notificação, na próxima rodada de 3 minutos,
                // ele vai encontrar a assinatura de novo e te avisar novamente!
            }

            // 2. Verifica Conclusão
            if (!processo.todosAssinaram && nomesAtuais.length >= processo.contagemTotal) {
                criarNotificacao(
                    "Processo Concluído! ✅",
                    `Todas as ${processo.contagemTotal} assinaturas foram realizadas em: ${processo.titulo}`,
                    linkAcesso,
                    processo.idAssinador // 🔥 Passa o ID para parar
                );
            }

        } catch (e) {
            console.error("Erro ao verificar monitoramento:", e);
        }
    }
}