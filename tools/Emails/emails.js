const lista = JSON.parse(localStorage.getItem("emailsGerais")) || [];
const tbody = document.getElementById("listaEmails");

// Injeta o Modal do Bootstrap no HTML dinamicamente
if (!document.getElementById('modalProrrogacao')) {
    const modalHTML = `
    <div class="modal fade" id="modalProrrogacao" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">E-mail de Prorrogação</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- A tag contenteditable permite que você digite e altere o texto dentro da caixa -->
            <div id="textoModalProrrogacao" contenteditable="true" style="border: 1px solid #ccc; padding: 15px; border-radius: 5px; min-height: 100px; background: #fff; outline: none;"></div>
            <small class="text-muted mt-2 d-block">Você pode editar o texto acima livremente antes de copiar.</small>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            <button type="button" class="btn btn-primary" id="btnCopiarModal">Copiar com Formatação</button>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Configura o evento de copiar o texto do modal com formatação
document.getElementById('btnCopiarModal').addEventListener('click', () => {
    const divTexto = document.getElementById('textoModalProrrogacao');
    
    // Cria uma seleção englobando o HTML para manter a cor e o negrito
    const range = document.createRange();
    range.selectNodeContents(divTexto);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
        document.execCommand('copy');
        alert('Texto copiado para a área de transferência com sucesso!');
    } catch (err) {
        console.error('Falha ao copiar: ', err);
        alert('Não foi possível copiar automaticamente.');
    }
    
    // Limpa a marcação de seleção da tela
    selection.removeAllRanges(); 
});

// Função para renderizar a tabela
function renderTable() {
    tbody.innerHTML = "";
    
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum e-mail salvo ainda</td></tr>`;
    } else {
        lista.forEach(email => {
            const tr = document.createElement("tr");
            
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

// ESCUTADOR DE EVENTOS DA TABELA
tbody.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-usar')) {
        usarEmail(parseInt(event.target.getAttribute('data-id')));
    }
    if (event.target.classList.contains('btn-apagar')) {
        apagarEmail(parseInt(event.target.getAttribute('data-id')));
    }
    if (event.target.classList.contains('btn-prorrogar')) {
        prorrogarEmail(parseInt(event.target.getAttribute('data-id')));
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
        renderTable(); 
    }
}

// Função para prorrogar a data do e-mail
function prorrogarEmail(id) {
    const email = lista.find(e => e.id === id);
    if (!email) return;

    if (email.prorrogado) {
        alert("Este processo já foi prorrogado uma vez e não pode ser prorrogado novamente.");
        return;
    }

    let data = new Date(email.data_fim + 'T12:00:00'); 
    let diasAdicionados = 0;
    
    // Adicionar 5 dias úteis
    while (diasAdicionados < 5) {
        data.setDate(data.getDate() + 1);
        const diaSemana = data.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasAdicionados++;
        }
    }

    // Formatações de data
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const novaDataFormatada = `${dia}/${mes}/${ano}`;
    const novaDataPadrao = `${ano}-${mes}-${dia}`;
    
    // Atualiza o objeto no LocalStorage
    email.data_fim = novaDataPadrao;
    email.data_fim_formatada = novaDataFormatada;
    email.numeroDiasUteis = (parseInt(email.numeroDiasUteis) || 5) + 5; 
    email.prorrogado = true; 
    localStorage.setItem("emailsGerais", JSON.stringify(lista));
    renderTable();

    // Determina a saudação com base na hora
    const horaAtual = new Date().getHours();
    let saudacao = "Bom dia,";
    if (horaAtual >= 12 && horaAtual < 18) {
        saudacao = "Boa tarde,";
    } else if (horaAtual >= 18) {
        saudacao = "Boa noite,";
    }

    // Cria o HTML rico (com cores e fontes)
const textoFormatadoHTML = `
        <p style="margin:0;font:15px Calibri,sans-serif;color:#1F497D">${saudacao}</p>
        <p style="margin:0;font:15px Calibri,sans-serif;color:#1F497D"><br>Comunicado que o prazo para a assinatura fica prorrogado para o dia: <strong style="color:red">${novaDataFormatada}</strong> .</p>
    `;

    // Joga o HTML dentro do modal editável
    const areaTexto = document.getElementById('textoModalProrrogacao');
    areaTexto.innerHTML = textoFormatadoHTML;

    // Aciona o Modal do Bootstrap (que já está na biblioteca do seu arquivo .html)
    const modalElement = document.getElementById('modalProrrogacao');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}