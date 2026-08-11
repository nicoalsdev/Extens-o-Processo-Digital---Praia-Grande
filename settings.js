// Arquivo: settings.js (VERSÃO FINAL COMPLETA)


// =========================================================================
// FUNÇÕES DE ALERTA (SweetAlert2) - Precisa que sweetalert2.min.js esteja no settings.html
// =========================================================================

/**
 * Exibe uma notificação Toast.
 * @param {string} icon - Ícone do toast ('success', 'error', 'warning', 'info', 'question').
 * @param {string} title - Mensagem do toast.
 */
function showToast(icon, title) {
    if (typeof Swal === 'undefined') {
        console.error(`Swal não está definido. Toast de ${icon}: ${title}`);
        return;
    }
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({
        icon: icon,
        title: title
    });
}

function alternarTexto() {
  document.querySelectorAll('.btn-text').forEach(el => {
    el.classList.toggle('d-none');
});
}
alternarTexto();

/**
 * Exibe um alerta de confirmação centralizado e retorna uma Promise.
 * Utiliza swal.fire
 * @returns {Promise<boolean>} Retorna true se o usuário confirmar.
 */
function showConfirmation(title, text, confirmButtonText, icon = 'warning') {
    if (typeof Swal === 'undefined') {
        console.error(`Swal não está definido. Confirmação: ${title}`);
        return Promise.resolve(confirm(title + '\n' + text)); // Fallback simples
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


const DEFAULT_SETTINGS = {
    sortHomepage: true,
    sortFolders: true,
    showTags: true,
    menuType: 'Avancado',//'Simples',
    darkMode: false, // 👈 adicionar
    showBoard: true

};

const PREDEFINED_TAGS_KEY = 'predefinedTags';
// NOVA CHAVE: para as tags aplicadas aos processos
const PROCESS_TAGS_KEY = 'processTags';
const PROCESS_DATA = 'processData';

// --- FUNÇÕES AUXILIARES ---

function escapeHtml(s) {
    return String(s || '').replace(/[&<>\"'/]/g, function(c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '\"': '&quot;',
            "\'": '&#39;',
            '/': '&#47;'
        } [c];
    });
}

// 1. Carrega as configurações salvas e atualiza os inputs
function loadSettings() {
    chrome.storage.local.get('userSettings', (data) => {
        const settings = { ...DEFAULT_SETTINGS, ...data.userSettings };
        //console.log(settings);
        // Switches originais   
        document.getElementById('sortHomepage').checked = settings.sortHomepage;
        document.getElementById('sortFolders').checked = settings.sortFolders;
        document.getElementById('showTags').checked = settings.showTags;
        document.getElementById('darkMode').checked = settings.darkMode;
        document.getElementById('showBoard').checked = settings.showBoard;

          const isDark = document.getElementById('darkMode').checked;

        // Define o ícone inicial correto
        if (isDark) {
            themeIcon.className = 'fa-solid fa-moon text-dark';
        } else {
            themeIcon.className = 'fa-solid fa-sun text-dark';
        }


        if (document.getElementById('menuType')) {
            document.getElementById('menuType').value = settings.menuType;
        }
    });
}


// 2. Salva uma única configuração
function saveSetting(key, value) {
    
    chrome.storage.local.get('userSettings', (data) => {
        const currentSettings = data.userSettings || {};
        currentSettings[key] = value;
        chrome.storage.local.set({
            userSettings: currentSettings
        }, () => {
            // Notifica o content script que as configurações mudaram (para recarregar)
            //showToast('success', 'Configurações salvas com sucesso!');
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'settingsUpdated'
                        }).catch(() => {
                        /* Ignora erro se content.js não estiver na aba */ });
                        }
                    });
            });
        });
    });
}


// --- GERENCIAMENTO DE TAGS PRÉ-DEFINIDAS ---

// Carrega as tags e renderiza na lista
function loadPredefinedTags() {
    chrome.storage.local.get(PREDEFINED_TAGS_KEY, (data) => {
        const predefinedTags = data[PREDEFINED_TAGS_KEY] || [];
        updatePredefinedTagsDisplay(predefinedTags);
    });
}

// Salva o array de tags
function savePredefinedTags(tags, callback) {
    chrome.storage.local.set({
        [PREDEFINED_TAGS_KEY]: tags
    }, () => {
        // Notifica o popup e o content script para atualizar as listas
        chrome.runtime.sendMessage({
            action: 'predefinedTagsUpdated'
        }).catch(e => console.log('Erro ao notificar update:', e));

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'settingsUpdated'
                    }).catch(() => {
                    /* Ignora erro */ });
                    }
                });
        });

        if (callback) callback();
    });
}

// Adiciona uma nova tag
function addTag() {
    const nameInput = document.getElementById('newTagName');
    const colorInput = document.getElementById('newTagColor');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name || !color) {
        // alert('O nome da tag não pode ser vazio.');
        showToast('warning', 'O nome da tag não pode ser vazio.');
        nameInput.focus();
        return;
    }

    chrome.storage.local.get(PREDEFINED_TAGS_KEY, (data) => {
        const predefinedTags = data[PREDEFINED_TAGS_KEY] || [];

        // Evita duplicatas pelo nome
        if (predefinedTags.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
            // alert(`A tag "${name}" já existe.`);
            showToast('warning', `A tag "${name}" já existe.`);
            return;
        }

        predefinedTags.push({
            name: name,
            color: color,
            showOnBoard: true,          // default
            showInAdvancedMenu: true    // default
        });
        savePredefinedTags(predefinedTags, () => {
            nameInput.value = ''; // Limpa o input
            colorInput.value = '#0d6efd'; // Reseta a cor (opcional)
            updatePredefinedTagsDisplay(predefinedTags);
        });
        // alert(`Tag "${name}" adicionada com sucesso!`);
        showToast('success', `Tag "${name}" adicionada com sucesso!`);

    });
}

// Remove uma tag


// Remove uma tag
function removeTag(tagName) {

    /*
    if (!confirm(`Tem certeza que deseja remover a tag "${tagName}"?`)) {
        return;
    }
    */
    showConfirmation(
        'Confirmar Exclusão',
    `Tem certeza que deseja deletar a tag rápida? Esta ação não afetará tags já aplicadas a processos.`,
    'Sim, Deletar Tag'
    ).then(isConfirmed => {
        if (!isConfirmed) {
            return;
        }
        chrome.storage.local.get(PREDEFINED_TAGS_KEY, (data) => {
            let predefinedTags = data[PREDEFINED_TAGS_KEY] || [];

            // Filtra para remover a tag
            predefinedTags = predefinedTags.filter(tag => tag.name !== tagName);

            savePredefinedTags(predefinedTags, () => {
                updatePredefinedTagsDisplay(predefinedTags);
            });
            showToast('info', `Tag deletada com sucesso.`);
        });
    });
}

function togglePredefinedTagConfig(tagName, key, value) {
    chrome.storage.local.get('predefinedTags', data => {
        const tags = data.predefinedTags || [];

        const tag = tags.find(t => t.name === tagName);
        if (!tag) return;

        tag[key] = value;

        chrome.storage.local.set({ predefinedTags: tags });
    });
}

function sortPredefinedTags(tags) {
  return [...tags].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : 999;
    const orderB = typeof b.order === 'number' ? b.order : 999;
    return orderA - orderB;
});
}


// Renderiza a lista de tags
function updatePredefinedTagsDisplay(tags) {
    const list = document.getElementById('predefinedTagsList');
    list.innerHTML = '';

    if (tags.length === 0) {
        list.innerHTML = '<p class="note">Nenhuma Tag Rápida cadastrada. Use o formulário acima para adicionar.</p>';
        return;
    }

    tags = sortPredefinedTags(tags);
    tags.forEach(tag => {

        if (typeof tag.showOnBoard !== 'boolean') tag.showOnBoard = true;
        if (typeof tag.showInAdvancedMenu !== 'boolean') tag.showInAdvancedMenu = true;

        const li = document.createElement('li');
        // AJUSTE: Padding lateral de 12px para não encostar na borda
        li.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px; 
            border-bottom: 1px solid #eee;
            gap: 10px;
        `;

        // === Nome + cor ===
        const nameColorDiv = document.createElement('div');
        // AJUSTE: overflow hidden para nomes muito longos
        nameColorDiv.style.cssText = 'display: flex; align-items: center; gap: 10px; flex-grow: 1; overflow: hidden;';

        const colorSpan = document.createElement('span');
        // AJUSTE: flex-shrink: 0 impede que a bolinha seja esmagada
        colorSpan.style.cssText = `
            background-color: ${escapeHtml(tag.color)};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 1px solid #ccc;
            flex-shrink: 0; 
        `;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = escapeHtml(tag.name);
        nameSpan.style.fontWeight = 'bold';
        nameSpan.style.fontSize = '13px';
        nameSpan.style.whiteSpace = 'nowrap';
        nameSpan.style.overflow = 'hidden';
        nameSpan.style.textOverflow = 'ellipsis'; // Adiciona "..." se o nome for gigante

        nameColorDiv.appendChild(colorSpan);
        nameColorDiv.appendChild(nameSpan);

        // === Checkboxes ===
        const optionsDiv = document.createElement('div');
        optionsDiv.style.cssText = 'display: flex; gap: 12px; align-items: center; flex-shrink: 0;';

        const boardLabel = document.createElement('label');
        boardLabel.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:12px; cursor:pointer;';
        const boardCheckbox = document.createElement('input');
        boardCheckbox.type = 'checkbox';
        boardCheckbox.checked = tag.showOnBoard;
        boardCheckbox.addEventListener('change', e => togglePredefinedTagConfig(tag.name, 'showOnBoard', e.target.checked));
        boardLabel.appendChild(boardCheckbox);
        boardLabel.appendChild(document.createTextNode('Board'));

        const menuLabel = document.createElement('label');
        menuLabel.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:12px; cursor:pointer;';
        const menuCheckbox = document.createElement('input');
        menuCheckbox.type = 'checkbox';
        menuCheckbox.checked = tag.showInAdvancedMenu;
        menuCheckbox.addEventListener('change', e => togglePredefinedTagConfig(tag.name, 'showInAdvancedMenu', e.target.checked));
        menuLabel.appendChild(menuCheckbox);
        menuLabel.appendChild(document.createTextNode('Menu'));

        optionsDiv.appendChild(boardLabel);
        optionsDiv.appendChild(menuLabel);

        // === Botão remover ===
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fa fa-trash"></i>';
        removeBtn.classList.add('bg-danger');
        removeBtn.style.cssText = `
            padding: 5px 8px;
            border-radius: 4px;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 12px;
            flex-shrink: 0;
        `;
        removeBtn.addEventListener('click', () => removeTag(tag.name));

        li.appendChild(nameColorDiv);
        li.appendChild(optionsDiv);
        li.appendChild(removeBtn);
        list.appendChild(li);
    });

    chrome.storage.local.set({ predefinedTags: tags });
}


// Funções de UI

// 3. LÓGICA DO MENU COLLAPSIBLE (CORRIGIDA)
function toggleCollapsible(headerId, contentId) {
    const header = document.getElementById(headerId);
    const content = document.getElementById(contentId);
    const icon = header ? header.querySelector('.collapse-icon') : null;

    if (!header || !content || !icon) return;

    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        // Para fechar com transição: define a altura atual e depois zera
        content.style.maxHeight = content.scrollHeight + 'px';
        content.offsetHeight; // Força o reflow
        content.style.maxHeight = '0'; // Inicia a transição de fechar
        content.classList.remove('expanded');
        header.setAttribute('aria-expanded', 'false');
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Para expandir: define a altura de rolagem
        content.style.maxHeight = content.scrollHeight + 'px';
        content.classList.add('expanded');
        header.setAttribute('aria-expanded', 'true');
        icon.style.transform = 'rotate(90deg)';

        // Timeout para remover o maxHeight e garantir que o conteúdo dinâmico não seja cortado
        setTimeout(() => {
            if (header.getAttribute('aria-expanded') === 'true') {
                content.style.maxHeight = '500px'; // Altura grande o suficiente
            }
        }, 300); // 300ms = tempo da transição no CSS
    }
}



// --- NOVO: FUNÇÕES DE EXPORTAÇÃO E IMPORTAÇÃO (ATUALIZADAS PARA INCLUIR PROCESS_TAGS) ---

/**
 * Exporta as tags pré-definidas E as tags de processos para um arquivo JSON.
 */
function exportTags() {
    // Busca AMBOS os objetos do storage
    chrome.storage.local.get([PREDEFINED_TAGS_KEY, PROCESS_TAGS_KEY, PROCESS_DATA], (data) => {

        const tagsToExport = {
            predefinedTags: data[PREDEFINED_TAGS_KEY] || [], // Array
            processTags: data[PROCESS_TAGS_KEY] || {}, // Objeto (ID-Timestamp: Tag)
            processData: data[PROCESS_DATA] || {}
        };

        // Formata o JSON com indentação para ser legível
        const jsonContent = JSON.stringify(tagsToExport, null, 2);

        const blob = new Blob([jsonContent], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);

        // Cria e clica em um link para iniciar o download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup_tags_extensao.json';
        document.body.appendChild(a);
        a.click();

        // Limpeza
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        //alert('Backup das Tags Rápidas e Tags de Processos concluído com sucesso!');
        //
        showToast('success', 'Backup das Tags Rápidas e Tags de Processos concluído com sucesso!');
    });
}

/**
 * Importa tags a partir de um arquivo JSON.
 * @param {File} file - O arquivo JSON a ser lido.
 */
function importTags(file) {
    const reader = new FileReader();
    const importMessage = document.getElementById('importMessage');

    // Reseta a mensagem
    importMessage.style.display = 'none';

    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);

            const predefinedTags = importedData.predefinedTags;
            const processTags = importedData.processTags;
            const processData = importedData.processData;

            // --- VALIDAÇÃO ---

            if (!predefinedTags || !Array.isArray(predefinedTags)) {
                importMessage.textContent = 'Erro: O arquivo não contém o array "predefinedTags" válido.';
                importMessage.style.display = 'block';
                importMessage.style.color = '#dc3545'; // Vermelho
                return;
            }

            // processTags deve ser um objeto, mas não um array
            if (!processTags || typeof processTags !== 'object' || Array.isArray(processTags)) {
                importMessage.textContent = 'Erro: O arquivo não contém o objeto "processTags" válido.';
                importMessage.style.display = 'block';
                importMessage.style.color = '#dc3545'; // Vermelho
                return;
            }

            if (!processData || typeof processData !== 'object' || Array.isArray(processData)) {
                importMessage.textContent = 'Erro: O arquivo não contém o objeto "processData" válido.';
                importMessage.style.display = 'block';
                importMessage.style.color = '#dc3545'; // Vermelho
                return;
            }

            // Validação simples de estrutura das Tags Rápidas
            const tagsRapidasValidas = predefinedTags.every(tag =>
                tag.name && typeof tag.name === 'string' &&
                tag.color && typeof tag.color === 'string' &&
                tag.color.startsWith('#')
                );
            if (!tagsRapidasValidas) {
                importMessage.textContent = 'Erro: Tags Rápidas inválidas encontradas.';
                importMessage.style.display = 'block';
                importMessage.style.color = '#dc3545';
                return;
            }

            // Validação simples de estrutura das Tags de Processos
            const tagsProcessoValidas = Object.values(processTags).every(tag =>
                tag.name && typeof tag.name === 'string' &&
                tag.color && typeof tag.color === 'string' &&
                tag.color.startsWith('#')
                );
            if (!tagsProcessoValidas) {
                importMessage.textContent = 'Erro: Tags de Processo inválidas encontradas.';
                importMessage.style.display = 'block';
                importMessage.style.color = '#dc3545';
                return;
            }

            // --- SALVAMENTO ---

            // Cria o objeto para salvar AMBOS no storage
            const dataToSave = {
                [PREDEFINED_TAGS_KEY]: predefinedTags,
                [PROCESS_TAGS_KEY]: processTags,
                [PROCESS_DATA]: processData
            };

            // Salva TODAS as tags no storage
            chrome.storage.local.set(dataToSave, () => {

                // Recarrega a lista na página (Tags Rápidas)
                loadPredefinedTags();

                // Notifica o popup/content script para atualizar as listas
                chrome.runtime.sendMessage({
                    action: 'predefinedTagsUpdated'
                }).catch(e => console.log('Erro ao notificar update:', e));
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            // Manda mensagem para o content.js
                            chrome.tabs.sendMessage(tab.id, {
                                action: 'settingsUpdated'
                            }).catch(() => {
                            /* Ignora erro se content.js não estiver na aba */ });
                            }
                        });
                });

                const processCount = Object.keys(processTags).length;
                const predefinedCount = predefinedTags.length;

                importMessage.innerHTML = `Sucesso! <br>Tags Rápidas: ${predefinedCount} importadas. <br>Tags de Processos: ${processCount} importadas/atualizadas.`;
                importMessage.style.display = 'block';
                importMessage.style.color = '#198754'; // Verde

                showToast('success', `Importação concluída. ${newTagsCount} novas tags e ${updatedTagsCount} tags atualizadas.`);
            });

        } catch (error) {
            importMessage.textContent = 'Erro ao processar o arquivo: JSON malformado ou estrutura incorreta.';
            importMessage.style.display = 'block';
            importMessage.style.color = '#dc3545';
            console.error('Erro de importação:', error);
            showToast('error', 'Erro ao processar o arquivo de importação.');
        }
    };

    reader.onerror = (error) => {
        importMessage.textContent = 'Erro ao ler o arquivo.';
        importMessage.style.display = 'block';
        importMessage.style.color = '#dc3545';
        console.error('Erro de leitura:', error);
        showToast('error', 'Erro: O arquivo não é um JSON de tags válido.');

    };

    reader.readAsText(file);
}





// Compara se a versão remota é maior que a local (ex: "1.2" > "1.0")
function isNewerVersion(local, remote) {
    const pLocal = local.split('.').map(Number);
    const pRemote = remote.split('.').map(Number);
    for (let i = 0; i < Math.max(pLocal.length, pRemote.length); i++) {
        const l = pLocal[i] || 0;
        const r = pRemote[i] || 0;
        if (r > l) return true;
        if (r < l) return false;
    }
    return false;
}

// Verifica o manifest.json do repositório uma vez por dia
function verificarAtualizacaoDiaria(localVersion, infoEl) {
    const repo = "nicoalsdev/Extens-o-Processo-Digital---Praia-Grande";
    const hoje = new Date().toDateString(); 
    
    // Texto padrão que aparece primeiro
    infoEl.textContent = `Versão ${localVersion} • ©Gerenciador Processo Digital`;

    chrome.storage.local.get(['lastUpdateCheckDate', 'latestGithubVersion'], async (data) => {
        let latestVersion = data.latestGithubVersion;

        // Faz a requisição apenas se a data de hoje for diferente da última verificação
        if (data.lastUpdateCheckDate !== hoje) {
            try {
                // Acessa o arquivo manifest.json direto da branch padrão
                const response = await fetch(`https://api.github.com/repos/${repo}/contents/manifest.json`);
                if (response.ok) {
                    const json = await response.json();
                    
                    // A API do GitHub devolve o conteúdo em Base64, precisamos decodificar
                    const manifestString = decodeURIComponent(escape(atob(json.content)));
                    const manifestRemoto = JSON.parse(manifestString);
                    latestVersion = manifestRemoto.version;

                    // Salva a versão encontrada e a data de hoje para não consultar mais
                    chrome.storage.local.set({
                        lastUpdateCheckDate: hoje,
                        latestGithubVersion: latestVersion
                    });
                }
            } catch (e) {
                console.error("Erro ao checar atualização silenciosa:", e);
            }
        }

        // Se houver uma versão no GitHub e ela for maior que a local, substitui o texto pelo botão
       if (latestVersion && isNewerVersion(localVersion, latestVersion)) {
            // Rota direta para baixar o ZIP da branch principal (main ou master)
            const zipDownloadUrl = `https://github.com/${repo}/archive/refs/heads/main.zip`;

            infoEl.innerHTML = `Versão ${localVersion} • 
                <a href="${zipDownloadUrl}" class="btn btn-sm btn-success text-white px-2 py-0 ms-1" style="font-size: 0.85rem; text-decoration: none;">
                    <i class="fa fa-file-zipper"></i> Baixar Atualização v${latestVersion}
                </a>`;
        }
    });
}



// Registra o evento do botão de busca (Deve ficar dentro do seu DOMContentLoaded atual)
document.addEventListener('DOMContentLoaded', () => {
    // ... seus outros listeners ...
    const btnFetch = document.getElementById('btnFetchCommits');
    if (btnFetch) {
        btnFetch.addEventListener('click', fetchGitHubCommits);
    }

    // Carrega o repo salvo, se existir
    chrome.storage.local.get('userSettings', (data) => {
        if (data.userSettings && data.userSettings.githubRepo) {
            const input = document.getElementById('githubRepo');
            if (input) input.value = data.userSettings.githubRepo;
        }
    });
});



const manifest = chrome.runtime.getManifest();

// Exibe nome e versão no console (opcional)
//console.log("📦 Extensão:", manifest.name, "Versão:", manifest.version);

// Exemplo de uso no HTM
// --- LISTENERS E INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadPredefinedTags();

  const infoEl = document.getElementById("extInfo");
    if (infoEl) {
        verificarAtualizacaoDiaria(manifest.version, infoEl);
    }

    // Listener para o tipo de menu
    const menuTypeSelect = document.getElementById('menuType');
    if (menuTypeSelect) {
        menuTypeSelect.addEventListener('change', (e) => {
            saveSetting('menuType', e.target.value);
        });
    }

    // Listeners dos switches 
    document.getElementById('sortHomepage').addEventListener('change', (e) => {
        saveSetting('sortHomepage', e.target.checked);
    });

    document.getElementById('sortFolders').addEventListener('change', (e) => {
        saveSetting('sortFolders', e.target.checked);
    });

    document.getElementById('showTags').addEventListener('change', (e) => {
        saveSetting('showTags', e.target.checked);
    });
    document.getElementById('showBoard').addEventListener('change', (e) => {
        saveSetting('showBoard', e.target.checked);
    });

document.getElementById('darkMode').addEventListener('change', (e) => {
    const isDark = e.target.checked;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');

    // 1. Atualiza o Texto e o Ícone
    if (isDark) {
        themeText.textContent = 'Modo Escuro';
        themeIcon.className = 'fa-regular fa-moon text-dark';
    } else {
        themeText.textContent = 'Modo Claro';
        themeIcon.className = 'fa-regular fa-sun text-dark';
    }

    // 2. Salva nas configurações gerais
    saveSetting('darkMode', isDark);

    // 3. Salva para o theme.js
    chrome.storage.local.set({ customTheme: { isDark: isDark } });

    // 4. Notifica a troca imediata
    chrome.runtime.sendMessage({
        action: 'toggleTheme',
        darkMode: isDark
    });
});

    // Listener para o botão Adicionar Tag
    document.getElementById('addTagBtn').addEventListener('click', addTag);

    // Listener para o menu collapsible (Tags)
    const tagsHeader = document.getElementById('tagsManagerHeader');
    if (tagsHeader) {
        tagsHeader.addEventListener('click', () => toggleCollapsible('tagsManagerHeader', 'tagsContent'));
    }

    // Listener para o menu collapsible (Geral) - Se houver
    const generalHeader = document.getElementById('generalSettingsHeader');
    if (generalHeader) {
        generalHeader.addEventListener('click', () => toggleCollapsible('generalSettingsHeader', 'generalContent'));
    }

    // NOVO: Listeners para Exportar/Importar Tags
    const exportBtn = document.getElementById('exportTagsBtn');
    const importBtn = document.getElementById('importTagsBtn');
    const importFileInput = document.getElementById('importFile');

    if (exportBtn) {
        exportBtn.addEventListener('click', exportTags);
    }

    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => {
            // Simula um clique no input file
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importTags(file);
            }
            // Limpa o valor para permitir a importação do mesmo arquivo novamente
            e.target.value = null;
        });
    }
});