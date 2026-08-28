function isPastaUrl() {
    const url = window.location.href;
    const pastaBaseUrl = 'https://assinadordigitalexterno.praiagrande.sp.gov.br/';
    return url.startsWith(pastaBaseUrl);
}

// ======================================================
// FUNÇÃO: Aguardar até encontrar um campo no DOM real
// ======================================================
function waitField(originalId, timeout = 8000) {
    return new Promise((resolve) => {
        const start = Date.now();

        const timer = setInterval(() => {
            const el = document.querySelector(`[originalid="${originalId}"]`);

            if (el) {
                clearInterval(timer);
                resolve(el);
            }

            if (Date.now() - start > timeout) {
                clearInterval(timer);
                resolve(null);
            }
        }, 200);
    });
}

// Impede execução duplicada
let preenchimentoExecutado = false;

// ======================================================
// Marcar Secretarias
// ======================================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function marcarSetores(container, setores) {
    const checkboxes = container.querySelectorAll("input[type='checkbox'][value]");

    for (const setor of setores) {
        let marcado = false;

        for (const cb of checkboxes) {
            const title = cb.getAttribute("title")?.trim();
            const value = cb.getAttribute("value")?.trim();

            if (title === setor || value === setor) {
                cb.checked = true; 
                cb.focus();
                cb.dispatchEvent(new Event("input", { bubbles: true })); 
                cb.dispatchEvent(new Event("click", { bubbles: true }));
                cb.dispatchEvent(new Event("change", { bubbles: true }));

                console.log("🟢 Setor marcado:", setor);
                marcado = true;
                break;
            }
        }
        
        if (marcado) {
            await sleep(300);
        } else {
            console.warn(`Setor não encontrado: ${setor}`);
        }
    }
}

// ======================================================
// LISTENER PRINCIPAL
// ======================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.action !== "preencher_sead") return;

    if (preenchimentoExecutado) {
        console.log("⚠ Ignorando: preenchimento já executado.");
        sendResponse({ status: "ignorado", detalhes: "preenchimento já executado" });
        return; 
    }
    
    preenchimentoExecutado = true;
    console.log("🔵 Mensagem recebida:", msg);

    showLoadingOverlay();

    (async () => {
        try {
            const idTitulo = "V1_I1_T1";
            const idLink = "V1_I1_T2";
            const idCheckboxes = "V1_I1_MSC8";
            const idCheckboxes2 = "V1_I1_MSC9";
            
            const idCategoria = "V1_I1_D3"; 
            const idData = "V1_I1_T4";      

            console.log("⏳ Aguardando campos do formulário...");

            const tituloEl = await waitField(idTitulo);
            const linkEl = await waitField(idLink);
            const categoriaEl = await waitField(idCategoria);
            const dataEl = await waitField(idData);

            if (!tituloEl) throw new Error("❌ Campo TÍTULO não encontrado");
            if (!linkEl) throw new Error("❌ Campo LINK não encontrado");

            preencherCampo(tituloEl, msg.titulo);
            preencherCampo(linkEl, msg.link);
            
            if (msg.categoria) {
               await selecionarDropdown(idCategoria, msg.categoria); 
            }
            if (dataEl && msg.data) {
                preencherCampo(dataEl, msg.data);
            }

            const listaEl = await waitField(idCheckboxes);
            if (listaEl && msg.setores?.length) {
                await marcarSetores(listaEl, msg.setores); 
            }
            
            const listaEl2 = await waitField(idCheckboxes2); 
            if (listaEl2 && msg.setores?.length) {
                await marcarSetores(listaEl2, msg.setores); 
            }

            if (msg.autoSave) {
                console.log("⏳ Aguardando botão de salvar (auto-save ativado)...");
                const idBotaoSalvar = "V1_I1_PB12"; 
                const btnSalvar = await waitField(idBotaoSalvar);

                if (btnSalvar) {
        // Aguarda 1.5s para garantir que eventos de Dropdown/Blur do InfoPath foram concluídos
                    await sleep(1500);
                    btnSalvar.click();
                    console.log("🟢 Botão de salvar clicado com sucesso!");
                } else {
                    console.warn("❌ Botão de salvar não encontrado.");
                }
            }
            
            console.log("🟢 Preenchido com sucesso!");
            sendResponse({ status: "sucesso", titulo: msg.titulo });

        } catch (error) {
            console.error("❌ Erro durante o preenchimento:", error.message);
            sendResponse({ status: "erro", detalhes: error.message });
        } finally {
            hideLoadingOverlay();
        }
    })();

    return true; 
});

// ======================================================
// Preenche o campo de forma estável
// ======================================================
function preencherCampo(campo, valor) {
    campo.value = valor;

    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
    campo.dispatchEvent(new Event("blur", { bubbles: true }));

    console.log("🟢 Preenchido:", campo.getAttribute("originalid"), valor);

    setTimeout(() => {
        const originalId = campo.getAttribute("originalid");
        const novoCampo = document.querySelector(`[originalid="${originalId}"]`);
        if (!novoCampo) return;

        novoCampo.value = valor;
        novoCampo.dispatchEvent(new Event("input", { bubbles: true }));
        novoCampo.dispatchEvent(new Event("change", { bubbles: true }));
        novoCampo.dispatchEvent(new Event("blur", { bubbles: true }));

        console.log("🟢 Valor reforçado:", originalId);
    }, 1000);
}

// ======================================================
// FUNÇÕES DE BLOQUEIO DE TELA
// ======================================================
function showLoadingOverlay(message = "Preenchendo formulário automaticamente...") {
    const overlay = document.createElement('div');
    overlay.id = 'extension-loading-overlay';
    
    const style = document.createElement('style');
    style.textContent = `
        #extension-loading-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6); z-index: 99999; 
            display: flex; justify-content: center; align-items: center;
            flex-direction: column; color: white; font-size: 1.2rem;
            font-family: Arial, sans-serif; text-align: center;
        }
        #extension-loading-overlay .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #4CAF50; border-radius: 50%;
            width: 50px; height: 50px; animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    overlay.appendChild(style);

    overlay.innerHTML += `<div class="spinner"></div><p>${message}</p>`;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('extension-loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// ======================================================
// Preenche campos do tipo Select (Dropdown) no InfoPath
// ======================================================
async function selecionarDropdown(originalId, valor) {
    console.log(`🔎 Aguardando dropdown carregar as opções. Procurando por: [${valor}]`);
    
    if (!originalId || !valor) return;

    let selectEl = null;
    let indexEncontrado = -1;
    let valorReal = "";

    const limparString = (str) => {
        if (!str) return "";
        return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
    };

    const valorBuscado = limparString(valor);

    // Loop de espera: tenta por até 5 segundos (25 tentativas de 200ms)
    for (let tentativa = 0; tentativa < 25; tentativa++) {
        selectEl = document.querySelector(`[originalid="${originalId}"]`);
        
        if (selectEl) {
            // "Cutuca" o InfoPath com um evento de foco para forçá-lo a carregar a lista
            selectEl.dispatchEvent(new Event("focus", { bubbles: true }));
            selectEl.dispatchEvent(new Event("mousedown", { bubbles: true }));
            
            const options = selectEl.options || selectEl.querySelectorAll("option");
            
            // Se tiver mais de 1 opção (a vazia + as opções reais), as opções carregaram!
            if (options.length > 1) {
                for (let i = 0; i < options.length; i++) {
                    const valOption = limparString(options[i].value);
                    const textoOption = limparString(options[i].textContent || options[i].innerText);

                    if (valOption === valorBuscado || textoOption === valorBuscado) {
                        indexEncontrado = i;
                        valorReal = options[i].value;
                        break;
                    }
                }

                if (indexEncontrado !== -1) {
                    break; // Encontrou a opção correta, sai do loop de espera!
                }
            }
        }
        // Espera 200ms antes de verificar de novo
        await sleep(200);
    }

    if (!selectEl) {
        console.warn(`⚠ Dropdown [${originalId}] não apareceu na tela.`);
        return;
    }

    if (indexEncontrado !== -1) {
        const options = selectEl.options || selectEl.querySelectorAll("option");
        
        selectEl.dispatchEvent(new Event("focus", { bubbles: true }));
        selectEl.selectedIndex = indexEncontrado;
        if(options[indexEncontrado]) options[indexEncontrado].selected = true;
        selectEl.value = valorReal; 
        
        selectEl.dispatchEvent(new Event("input", { bubbles: true }));
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
        selectEl.dispatchEvent(new Event("blur", { bubbles: true }));
        
        console.log(`🟢 Dropdown preenchido com sucesso: "${valorReal}"`);
        
        // Reforço
        setTimeout(() => {
            const novoSelect = document.querySelector(`[originalid="${originalId}"]`);
            if (novoSelect && novoSelect.selectedIndex !== indexEncontrado) {
                novoSelect.dispatchEvent(new Event("focus", { bubbles: true }));
                novoSelect.selectedIndex = indexEncontrado;
                novoSelect.value = valorReal;
                novoSelect.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }, 1000);

    } else {
        // Se após 5 segundos as opções não carregaram ou não achou o valor
        console.warn(`❌ Valor "[${valor}]" não encontrado! O select tinha apenas:`);
        const options = selectEl.options || selectEl.querySelectorAll("option");
        for (let i = 0; i < options.length; i++) {
            console.log(`- Opção ${i}: value="${options[i].value}", texto="${options[i].textContent || options[i].innerText}"`);
        }
        
        // Tentativa de "força bruta" injetando o valor na marra
        console.log(`🛠️ Tentando forçar o valor na marra...`);
        selectEl.value = valor;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
}