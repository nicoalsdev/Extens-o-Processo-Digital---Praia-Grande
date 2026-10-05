const lista = JSON.parse(localStorage.getItem("emailsGerais")) || [];
const tbody = document.getElementById("listaEmails");

// Função para renderizar a tabela
function renderTable() {
    tbody.innerHTML = "";
    
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum e-mail salvo ainda</td></tr>`;
    } else {
        lista.forEach(email => {
            const tr = document.createElement("tr");
            
            // Verifica se o processo já foi prorrogado para desativar ou não o botão
            const btnProrrogar = email.prorrogado 
                ? `<button class="btn btn-sm btn-secondary" disabled title="Já prorrogado">Prorrogado</button>`
                : `<button class="btn btn-sm btn-warning btn-prorrogar" data-id="${email.id}">Prorrogar</button>`;

            tr.innerHTML = `
                <td class='text-dark'>${email.objeto_termo}</td>
                <td class='text-dark'>${email.modalidade_licitacao}</td>
                <td class='text-dark'>${email.numero_processo}</td>
                <td class="text-nowrap">
                    <button class="btn btn-sm btn-success btn-usar" data-id="${email.id}">Usar</button>
                    ${btnProrrogar}
                    <button class="btn btn-sm btn-danger btn-apagar" data-id="${email.id}">Apagar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Renderiza a lista inicial
renderTable();

// ESCUTADOR DE EVENTOS
tbody.addEventListener('click', (event) => {
    // Clique no botão 'Usar'
    if (event.target.classList.contains('btn-usar')) {
        const id = parseInt(event.target.getAttribute('data-id'));
        usarEmail(id);
    }
    
    // Clique no botão 'Apagar'
    if (event.target.classList.contains('btn-apagar')) {
        const id = parseInt(event.target.getAttribute('data-id'));
        apagarEmail(id);
    }
    
    // Clique no botão 'Prorrogar'
    if (event.target.classList.contains('btn-prorrogar')) {
        const id = parseInt(event.target.getAttribute('data-id'));
        prorrogarEmail(id);
    }
});

// Botão de Adicionar
document.getElementById('AddMail').addEventListener('click', () => {
    window.location.href = "convocacao_geral.html";
});

function usarEmail(id) {
    const email = lista.find(e => e.id === id);
    localStorage.setItem("dadosEmailSelecionado", JSON.stringify(email));
    window.location.href = "convocacao_individual.html";
}

function apagarEmail(id) {
    if (!confirm("Deseja realmente apagar este e-mail?")) return;
    const index = lista.findIndex(e => e.id === id);
    if (index !== -1) {
        lista.splice(index, 1);
        localStorage.setItem("emailsGerais", JSON.stringify(lista));
        renderTable(); // Atualiza a tabela dinamicamente
    }
}

// Função para prorrogar a data do e-mail
function prorrogarEmail(id) {
    const email = lista.find(e => e.id === id);
    if (!email) return;

    // Trava de segurança extra caso tentem clicar rapidamente
    if (email.prorrogado) {
        alert("Este processo já foi prorrogado uma vez e não pode ser prorrogado novamente.");
        return;
    }

    // Pega a data final atual (data_fim) para adicionar mais 5 dias úteis
    let data = new Date(email.data_fim + 'T12:00:00'); 
    let diasAdicionados = 0;
    
    // Adicionar 5 dias úteis
    while (diasAdicionados < 5) {
        data.setDate(data.getDate() + 1);
        const diaSemana = data.getDay();
        // 0 = Domingo, 6 = Sábado
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasAdicionados++;
        }
    }

    // Formatar a nova data para DD/MM/YYYY e YYYY-MM-DD
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const novaDataFormatada = `${dia}/${mes}/${ano}`;
    const novaDataPadrao = `${ano}-${mes}-${dia}`;
    
    // Atualiza os dados daquele e-mail com a nova data e ativa a flag "prorrogado"
    email.data_fim = novaDataPadrao;
    email.data_fim_formatada = novaDataFormatada;
    email.numeroDiasUteis = (parseInt(email.numeroDiasUteis) || 5) + 5; 
    email.prorrogado = true; 

    // Salva a lista atualizada no localStorage
    localStorage.setItem("emailsGerais", JSON.stringify(lista));

    // Atualiza a tabela na tela para desativar o botão
    renderTable();

    // Monta o texto desejado e copia
    const textoMensagem = `Boa tarde, \n\nComunico que o prazo para a assinatura fica prorrogado para o dia: ${novaDataFormatada}.`;

    navigator.clipboard.writeText(textoMensagem).then(() => {
        alert(`Prazo prorrogado com sucesso!\n\nOs dados do termo foram atualizados para a nova data final: ${novaDataFormatada}\n\nO texto abaixo foi copiado para sua área de transferência:\n\n${textoMensagem}`);
    }).catch(err => {
        console.error('Falha ao copiar: ', err);
        alert(`Prazo atualizado, mas não foi possível copiar automaticamente.\n\nPor favor, copie o texto manualmente:\n\n${textoMensagem}`);
    });
}