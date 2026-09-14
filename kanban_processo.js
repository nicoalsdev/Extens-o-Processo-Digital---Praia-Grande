const urlParams = new URLSearchParams(window.location.search);
const processId = urlParams.get('processId');
const processNumber = urlParams.get('processNumber') || processId;

document.getElementById('tituloProcesso').textContent = processNumber;

let empresasData = {}; 

document.addEventListener('DOMContentLoaded', async () => {
    if (!processId) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Erro', 'ID do processo não encontrado na URL.', 'error').then(() => window.close());
        } else {
            alert('ID do processo não encontrado na URL.');
            window.close();
        }
        return;
    }

    // Valida se o ID realmente existe persistido no storage antes de abrir
    const existeNoStorage = await new Promise(resolve => {
        chrome.storage.local.get(['subKanbanData'], (result) => {
            const allSub = result.subKanbanData || {};
            resolve(!!allSub[processId]);
        });
    });

    if (!existeNoStorage) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Aviso', 'Este ID de subkanban não existe ou foi removido.', 'warning').then(() => window.close());
        } else {
            alert('Este ID de subkanban não existe ou foi removido.');
            window.close();
        }
        return;
    }

    document.getElementById('tituloProcesso').textContent = processNumber;
    await carregarDados();
    inicializarSortables();
});


async function carregarDados() {
    return new Promise(resolve => {
        chrome.storage.local.get(['subKanbanData'], (result) => {
            empresasData = (result.subKanbanData || {})[processId] || {};
            renderizarCards();
            resolve();
        });
    });
}

async function salvarDados() {
    return new Promise(resolve => {
        chrome.storage.local.get(['subKanbanData'], (result) => {
            const allSubKanbans = result.subKanbanData || {};
            allSubKanbans[processId] = empresasData;
            chrome.storage.local.set({ subKanbanData: allSubKanbans }, () => resolve());
        });
    });
}

let currentEmpresaId = null;

function renderizarCards() {
    document.querySelectorAll('.task-list').forEach(col => col.innerHTML = '');

    const empresasArray = Object.values(empresasData);
    
    empresasArray.sort((a, b) => {
        const ataA = a.ata ? String(a.ata) : '';
        const ataB = b.ata ? String(b.ata) : '';
        return ataA.localeCompare(ataB, undefined, { numeric: true, sensitivity: 'base' });
    });

    empresasArray.forEach(empresa => {
        const status = empresa.status || 'Pendente';
        let colId = '';
        
        if (status === 'Pendente') colId = 'col-pendente';
        else if (status === 'Convocada') colId = 'col-convocada';
        else if (status === 'Assinada') colId = 'col-assinada';
        else if (status === 'NaoAssinara') colId = 'col-nao-assinara';

        const colElement = document.getElementById(colId);
        if (colElement) {
            const card = document.createElement('div');
            card.className = 'task'; 
            card.dataset.id = empresa.id;
            
            let borderColor = '#6c757d'; 
            if (status === 'Convocada') borderColor = '#ffc107';
            if (status === 'Assinada') borderColor = '#198754';
            if (status === 'NaoAssinara') borderColor = '#dc3545';
            
            card.style.setProperty('border-left', `6px solid ${borderColor}`, 'important');

            const tituloCard = empresa.ata ? `${empresa.ata} - ${empresa.nomeAbreviado}` : empresa.nomeAbreviado;
            const comentario = empresa.description || '';

            card.innerHTML = `
                <div class="task-content" style="min-width: 0; overflow: hidden;">
                    <span style="font-size: 13px;"><strong>${tituloCard.toUpperCase()}</strong></span>
                    
                    ${comentario ? `
                    <small class="text-secondary" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 2px;" title="${comentario}">
                        <i class="fa fa-quote-left"></i> ${comentario}
                    </small>` : ''}
                    
                    ${empresa.dataAssinatura ? `<small class="due-date text-success" style="display: block; margin-top: 2px;"><i class="fa fa-check"></i> Assinado: ${empresa.dataAssinatura}</small>` : ''}
                </div>
            `;
            
            card.addEventListener('click', () => abrirModalEmpresa(empresa.id));
            colElement.appendChild(card);
        }
    });
}

// B) Atualização ao abrir o Modal (Carrega o comentário salvo)
function abrirModalEmpresa(id) {
    currentEmpresaId = id;
    const empresa = empresasData[id];

    document.getElementById('modalEmpresaAta').textContent = empresa.ata || '-';
    document.getElementById('modalEmpresaNome').textContent = empresa.nomeAbreviado || '-';
    document.getElementById('modalEmpresaCnpj').textContent = empresa.cnpj || '-';
    
    // Carrega o comentário no Textarea
    document.getElementById('modalEmpresaComentario').value = empresa.description || '';

    // Checkboxes (Toggles)
    document.getElementById('toggleAssinaturaAjuste').checked = !!empresa.assinaturaAjuste;
    document.getElementById('toggleAssinaturaTCN').checked = !!empresa.assinaturaTCN;

    // Data Assinatura
    const inputData = document.getElementById('modalEmpresaDataAssinatura');
    const dataSalva = empresa.dataAssinatura; 
    
    if (dataSalva && dataSalva.includes('/')) {
        const [dia, mes, ano] = dataSalva.split('/');
        inputData.value = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    } else {
        inputData.value = '';
    }

    const bs = window.bootstrap || bootstrap;
    if (bs) new bs.Modal(document.getElementById('empresaModal')).show();
}

// C) Atualização no botão de Salvar do Modal (Salva o comentário)
document.getElementById('btnSalvarEdicaoEmpresa').addEventListener('click', async () => {
    if (!currentEmpresaId) return;

    // Salva data
    const inputDataVal = document.getElementById('modalEmpresaDataAssinatura').value;
    let dataFormatada = "";
    if (inputDataVal) {
        const [ano, mes, dia] = inputDataVal.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
    }
    empresasData[currentEmpresaId].dataAssinatura = dataFormatada;

    // Salva o Comentário
    empresasData[currentEmpresaId].description = document.getElementById('modalEmpresaComentario').value.trim();

    // Salva toggles
    empresasData[currentEmpresaId].assinaturaAjuste = document.getElementById('toggleAssinaturaAjuste').checked;
    empresasData[currentEmpresaId].assinaturaTCN = document.getElementById('toggleAssinaturaTCN').checked;

    await salvarDados();
    renderizarCards();

    const bs = window.bootstrap || bootstrap;
    if (bs) {
        const modalInstance = bs.Modal.getInstance(document.getElementById('empresaModal'));
        if (modalInstance) modalInstance.hide();
    }

    if(typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000, icon: 'success', title: 'Salvo com sucesso!'});
});

document.getElementById('btnRemoverEmpresa').addEventListener('click', async () => {
    if (!currentEmpresaId) return;

    const confirm = await Swal.fire({
        title: "Remover Empresa?",
        text: "Tem certeza que deseja remover esta empresa do quadro?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sim",
        cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
        delete empresasData[currentEmpresaId];
        await salvarDados();
        renderizarCards();
        
        const bs = window.bootstrap || bootstrap;
        if (bs) bs.Modal.getInstance(document.getElementById('empresaModal')).hide();
        Swal.fire({ title: "Removida!", icon: "success", timer: 1500, showConfirmButton: false });
    }
});

function inicializarSortables() {
    const colunas = document.querySelectorAll('.task-list');
    colunas.forEach(coluna => {
        new Sortable(coluna, {
            group: 'empresas',
            animation: 150,
            // Adiciona a classe no body ao começar a arrastar
            onStart: () => {
                document.body.classList.add('is-dragging-mode');
            },
            onEnd: async (evt) => {
                // Remove a classe ao soltar
                document.body.classList.remove('is-dragging-mode');

                const itemEl = evt.item;
                const empresaId = itemEl.dataset.id;
                const novoStatus = evt.to.closest('.board').dataset.status;

                if (empresasData[empresaId]) {
                    empresasData[empresaId].status = novoStatus;
                    
                    if (novoStatus === 'Assinada') {
                        // Preenche a data de hoje apenas se estiver vazia (preserva a edição manual)
                        if (!empresasData[empresaId].dataAssinatura) {
                            empresasData[empresaId].dataAssinatura = new Date().toLocaleDateString('pt-BR');
                        }
                        // Liga os toggles de assinatura automaticamente
                        empresasData[empresaId].assinaturaAjuste = true;
                        empresasData[empresaId].assinaturaTCN = true;
                    } 
                    // Removido: O código que apagava a data se saísse de 'Assinada'. 
                    // Agora a data se mantém inalterada a menos que seja editada.

                    await salvarDados();
                    renderizarCards(); 
                }
            }
        });
    });
}

document.getElementById('excelUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet);

        let empresasImportadas = 0;

        json.forEach(row => {
            const ata = row['Ata'] || '';
            const nomeComp = row['Razão Social'] || 'Empresa Sem Nome';
            const nomeAb = row['abrev'] || nomeComp.substring(0, 15);
            
            const cnpj = row['CNPJ'] || '';
            const email = row['Email'] || '';
            const responsavel = row['Responsável'] || '';

            const id = 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            empresasData[id] = {
                id, nomeAbreviado: nomeAb, nomeCompleto: nomeComp, ata, cnpj, email, responsavel,
                dataAssinatura: '', status: 'Pendente',
                assinaturaAjuste: false, assinaturaTCN: false // Adicionado estado inicial
            };
            empresasImportadas++;
        });

        if (empresasImportadas > 0) {
            await salvarDados();
            renderizarCards();
            if(typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000, icon: 'success', title: `${empresasImportadas} empresas importadas!` });
        }
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
});

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.subKanbanData) {
            const novosDados = (changes.subKanbanData.newValue || {})[processId] || {};
            if (JSON.stringify(empresasData) !== JSON.stringify(novosDados)) {
                empresasData = novosDados;
                renderizarCards();
            }
        }
    });
}

document.getElementById('btnNovaEmpresaModal').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('novaEmpresaAta').value = '';
    document.getElementById('novaEmpresaNome').value = '';
    document.getElementById('novaEmpresaRazao').value = '';
    document.getElementById('novaEmpresaCnpj').value = '';
    document.getElementById('novaEmpresaEmail').value = '';
    const bs = window.bootstrap || bootstrap;
    if (bs) new bs.Modal(document.getElementById('novaEmpresaModal')).show();
});

document.getElementById('btnSalvarNovaEmpresa').addEventListener('click', async () => {
    const ata = document.getElementById('novaEmpresaAta').value.trim();
    const nomeAb = document.getElementById('novaEmpresaNome').value.trim();
    const nomeComp = document.getElementById('novaEmpresaRazao').value.trim();
    const cnpj = document.getElementById('novaEmpresaCnpj').value.trim();
    const email = document.getElementById('novaEmpresaEmail').value.trim();

    if (!ata || !nomeAb) {
        if (typeof Swal !== 'undefined') Swal.fire('Aviso', 'A Ata e o Nome Abreviado / Fantasia são obrigatórios.', 'warning');
        return;
    }

    const id = 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    empresasData[id] = {
        id, nomeAbreviado: nomeAb, nomeCompleto: nomeComp || nomeAb, ata, cnpj, email,
        dataAssinatura: '', status: 'Pendente',
        assinaturaAjuste: false, assinaturaTCN: false // Adicionado estado inicial
    };

    await salvarDados();
    renderizarCards();
    
    const bs = window.bootstrap || bootstrap;
    if (bs) bs.Modal.getInstance(document.getElementById('novaEmpresaModal')).hide();
});

document.getElementById('btnSalvarEdicaoEmpresa').addEventListener('click', async () => {
    if (!currentEmpresaId) return;

    // Salva data
    const inputDataVal = document.getElementById('modalEmpresaDataAssinatura').value;
    let dataFormatada = "";
    if (inputDataVal) {
        const [ano, mes, dia] = inputDataVal.split('-');
        dataFormatada = `${dia}/${mes}/${ano}`;
    }
    empresasData[currentEmpresaId].dataAssinatura = dataFormatada;

    // Salva toggles
    empresasData[currentEmpresaId].assinaturaAjuste = document.getElementById('toggleAssinaturaAjuste').checked;
    empresasData[currentEmpresaId].assinaturaTCN = document.getElementById('toggleAssinaturaTCN').checked;

    await salvarDados();
    renderizarCards();

    const bs = window.bootstrap || bootstrap;
    if (bs) {
        const modalInstance = bs.Modal.getInstance(document.getElementById('empresaModal'));
        if (modalInstance) modalInstance.hide();
    }

    if(typeof Swal !== 'undefined') Swal.fire({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000, icon: 'success', title: 'Salvo com sucesso!'});
});

function fecharMenuLateral() {
    const bs = window.bootstrap || bootstrap;
    if (bs) {
        const offcanvasElement = document.getElementById('sideMenu');
        const offcanvasInstance = bs.Offcanvas.getInstance(offcanvasElement);
        if (offcanvasInstance) offcanvasInstance.hide();
    }
}








// 1. Importar Excel
document.getElementById('btnMenuImportar').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('excelUpload').click();
    fecharMenuLateral();
});

// 2. Gerar Lista
document.getElementById('btnMenuGerarLista').addEventListener('click', () => {
    fecharMenuLateral();
    
    const empresasArray = Object.values(empresasData);
    if (empresasArray.length === 0) {
        if(typeof Swal !== 'undefined') {
            Swal.fire('Aviso', 'Não há empresas cadastradas para gerar a lista.', 'warning');
        } else {
            alert('Não há empresas cadastradas.');
        }
        return;
    }

    empresasArray.sort((a, b) => {
        const ataA = a.ata ? String(a.ata) : '';
        const ataB = b.ata ? String(b.ata) : '';
        return ataA.localeCompare(ataB, undefined, { numeric: true, sensitivity: 'base' });
    });

    let complemento = prompt("Deseja adicionar um complemento ao título? (Deixe em branco se não quiser)\nEx: Pregão 070/2026", "");
    let tituloTabela = `Processo ${processNumber}`;
    if (complemento) tituloTabela += ` - ${complemento}`;

    let htmlConteudo = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Lista de Empresas - ${processNumber}</title>
        <style>
            body { font-family: Calibri, Arial, sans-serif; margin: 20px; color: #000; }
            table { width: auto; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 4px 10px; font-size: 13px; vertical-align: middle; }
            th { text-align: center; background-color: #f2f2f2; font-weight: bold; }
            .header-main { font-size: 16px; font-weight: normal; text-align: center; background-color: #fff; }
            
            .col-ata { text-align: center; font-weight: bold; white-space: nowrap; }
            .col-empresa { text-align: left; white-space: nowrap; }
            .col-data { text-align: center; white-space: nowrap; }
            .col-status { text-align: left; color: #b02a37; font-weight: 600; white-space: nowrap; }
            .col-blank { width: 80px; } 
            
            .btn-imprimir {
                margin-bottom: 20px; padding: 8px 15px; cursor: pointer;
                background-color: #0d6efd; color: white; border: none; border-radius: 4px; font-weight: bold;
            }
            .btn-imprimir:hover { background-color: #0b5ed7; }
            
            @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
            }
        </style>
    </head>
    <body>
        <button class="btn-imprimir no-print" onclick="window.print()">🖨️ Imprimir Lista</button>
        
        <table>
            <thead>
                <tr>
                    <th colspan="5" class="header-main">${tituloTabela}</th>
                </tr>
                <tr>
                    <th>Ata</th>
                    <th>Empresa</th>
                    <th>Data Assinatura</th>
                    <th>Pendência</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
    `;

empresasArray.forEach(empresa => {
        let textoPendencia = "";
        const status = empresa.status || 'Pendente';
        const assAjuste = !!empresa.assinaturaAjuste;
        const assTCN = !!empresa.assinaturaTCN;

        // Regra para empresas que estão no board "Não irá assinar"
        if (status === 'NaoAssinara') {
            textoPendencia = "Não vai Assinar";
        } else if (assAjuste || assTCN) {
            // Regra anterior para verificação de pendências normais de assinatura
            let pendencias = [];
            if (!assAjuste) pendencias.push("Falta assinar o Termo");
            if (!assTCN) pendencias.push("Falta assinar o TCN");
            
            textoPendencia = pendencias.length > 0 ? pendencias.join(" / ") : "";
        }

        // Regra da cor cinza claro para a data se tiver assinatura e faltar o Termo
        let estiloData = "";
        if (empresa.dataAssinatura && !assAjuste && status !== 'NaoAssinara') {
            estiloData = 'style="color: #adb5bd;"';
        }

        htmlConteudo += `
                <tr>
                    <td class="col-ata">${empresa.ata || ''}</td>
                    <td class="col-empresa">${empresa.nomeAbreviado.toUpperCase()}</td>
                    <td class="col-data" ${estiloData}>${empresa.dataAssinatura || ''}</td>
                    <td class="col-status">${textoPendencia}</td>
                    <td class="col-blank"></td>
                </tr>
        `;
    });

    htmlConteudo += `
            </tbody>
        </table>
    </body>
    </html>
    `;

    const novaAba = window.open('', '_blank');
    if (novaAba) {
        novaAba.document.write(htmlConteudo);
        novaAba.document.close();
    } else {
        alert("O navegador bloqueou a abertura da nova guia. Por favor, permita os pop-ups.");
    }
});

// 3. Gerar Cota
document.getElementById('btnMenuGerarCota').addEventListener('click', () => {
    fecharMenuLateral();
    
    const empresasArray = Object.values(empresasData);
    if (empresasArray.length === 0) {
        if(typeof Swal !== 'undefined') {
            Swal.fire('Aviso', 'Não há empresas cadastradas para gerar a cota.', 'warning');
        } else {
            alert('Não há empresas cadastradas.');
        }
        return;
    }

    // 🔥 Ordena as empresas por ordem do número da ata/contrato de forma numérica/alfanumérica
    empresasArray.sort((a, b) => {
        const ataA = a.ata ? String(a.ata) : '';
        const ataB = b.ata ? String(b.ata) : '';
        return ataA.localeCompare(ataB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Processa e mapeia os dados das empresas ordenadas para o formato esperado pela cota
    const empresasParaCota = empresasArray.map(empresa => {
        const statusBoard = empresa.status || 'Pendente';
        const assAjuste = !!empresa.assinaturaAjuste;
        const assTCN = !!empresa.assinaturaTCN;
        let situacaoMapeada = "Não Respondeu";

        if (statusBoard === 'Assinada' && assAjuste && assTCN) {
            situacaoMapeada = "Assinou";
        } else if (statusBoard === 'NaoAssinara') {
            situacaoMapeada = "Não Irá Assinar";
        } else if ((assAjuste && !assTCN) || (!assAjuste && assTCN) || (statusBoard === 'Convocada')) {
             situacaoMapeada = "Não Assinou o Termo";
        } else {
           situacaoMapeada = "Não Respondeu";
        }

        return {
            ata: empresa.ata || "",
            empresa: empresa.nomeCompleto || empresa.nomeAbreviado || "",
            situacao: situacaoMapeada
        };
    });

    const dadosCodificados = encodeURIComponent(JSON.stringify(empresasParaCota));
    const urlCota = `/tools/Cota/cota.html?processNumber=${encodeURIComponent(processNumber)}&empresas=${dadosCodificados}`;
    window.open(urlCota, '_blank');
});

// 4. Copiar E-mails Pendentes (Exclui Assinada e Não irá assinar)
document.getElementById('btnMenuCopiarEmails').addEventListener('click', () => {
    fecharMenuLateral();

    const empresasArray = Object.values(empresasData);
    if (empresasArray.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Aviso', 'Não há empresas cadastradas.', 'warning');
        } else {
            alert('Não há empresas cadastradas.');
        }
        return;
    }

    // 🔥 Ordena as empresas por ordem do número da ata/contrato
    empresasArray.sort((a, b) => {
        const ataA = a.ata ? String(a.ata) : '';
        const ataB = b.ata ? String(b.ata) : '';
        return ataA.localeCompare(ataB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Filtra empresas que NÃO estão nos boards 'Assinada' nem 'NaoAssinara'
    const emailsPendentes = [];
    empresasArray.forEach(empresa => {
        const status = empresa.status || 'Pendente';
        if (status !== 'Assinada' && status !== 'NaoAssinara') {
            if (empresa.email && empresa.email.trim() !== '') {
                const emailTrim = empresa.email.trim();
                if (!emailsPendentes.includes(emailTrim)) {
                    emailsPendentes.push(emailTrim);
                }
            }
        }
    });

    if (emailsPendentes.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Aviso', 'Nenhum e-mail encontrado para as empresas pendentes/convocadas.', 'info');
        } else {
            alert('Nenhum e-mail encontrado.');
        }
        return;
    }

    const textoEmails = emailsPendentes.join('; ');

    navigator.clipboard.writeText(textoEmails).then(() => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 3000,
                icon: 'success',
                title: `${emailsPendentes.length} e-mail(s) copiado(s) em ordem de ata!`
            });
        } else {
            alert('E-mails copiados para a área de transferência!');
        }
    }).catch(err => {
        console.error('Erro ao copiar e-mails: ', err);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Erro', 'Não foi possível copiar os e-mails automaticamente.', 'error');
        }
    });
});