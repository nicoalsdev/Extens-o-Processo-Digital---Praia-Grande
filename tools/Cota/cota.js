document.addEventListener('DOMContentLoaded', function() {

    // 1. Referências aos elementos do DOM
    const formCota = document.getElementById('cotaForm'); // Certifique-se que o <form> tenha esse ID
    const btnGerar = document.getElementById('btnGerar');
    const inputProcesso = document.getElementById('inputProcesso');

    // 2. Inicialização / Configurações Iniciais
    console.log("Cota JS carregado. Versão 1.0");

    // 3. Event Listeners
    if (formCota) {
        formCota.addEventListener('submit', function(e) {
            e.preventDefault();
            gerarTermoCota();
        });
    }

    // Exemplo de máscara simples para o número do processo (se necessário)
    if (inputProcesso) {
        inputProcesso.addEventListener('input', function(e) {
            // Lógica de máscara aqui se desejar
        });
    }
});


function gerarTermoCota() {
    // Exemplo de uso do SweetAlert2 integrado ao seu projeto
    const processo = document.getElementById('inputProcesso')?.value;

    if (!processo) {
        Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Por favor, informe o número do processo.',
            confirmButtonColor: '#1976d2'
        });
        return;
    }

    // Lógica de processamento (Exemplo)
    Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: `Termo de cota para o processo ${processo} gerado com sucesso.`,
        timer: 2000,
        showConfirmButton: false
    });

    // Aqui você adicionaria a lógica para gerar o PDF ou 
    // preencher o documento baseado nos seus templates.
}


   // Obter referências aos elementos DOM
const processoFisicoRadio = document.getElementById('processo_fisico');
const processoDigitalRadio = document.getElementById('processo_digital');
const processoFisicoInputsDiv = document.getElementById('processo_fisico_inputs');
const processoNumeroInput = document.getElementById('processo_numero');
const processofolhaInput = document.getElementById('processo_folha');
const processoAnoInput = document.getElementById('processo_ano');
const siglaNomeDestinoInput = document.getElementById('sigla_nome_destino');
const siglaNomeDestinoList = document.getElementById('sigla_nome_destino_list');
const sexo = document.getElementById('sexo');
const termoAtaContainer = document.getElementById('termo_ata_container');
const anoTermoAtaInput = document.getElementById('ano_termo_ata');
const gerarDocumentoButton = document.getElementById('gerar-documento');
const documentoPreview = document.getElementById('documento-preview');
const selecionarTextoPreviewButton = document.getElementById('selecionar-texto-preview');
const tipotermo = document.getElementById('tipo_termo_select').value;


function sexot(sexo, direct){
    if(sexo== "Sr."){
        return direct;
    }else{
        if(direct=="Diretor"){
            return "Diretora";
        }else if(direct=="Secretário"){
            return "Secretária";
        }else if(direct=="Subecretário"){
            return "Subsecretária";
        }else if(direct=="Procurador"){
            return "Procuradora";
        }else if(direct=="Secretário Adjunto"){
            return "Secretária Adjunta";
        }
    }
}
                    // Array para autocomplete de "Sigla, Nome e Destino"
const siglaNomeDestinoArray = [
    "SEAD-511, Departamento de Administração, Diretor"
];


                    // Função para formatar a data como DD/MM/YYYY
function formatarData(data) {
    const dataObj = new Date(data);
    const dia = String(dataObj.getDate()).padStart(2, '0');
                    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Meses são indexados de 0
                    const ano = dataObj.getFullYear();
                    return `${dia}/${mes}/${ano}`;
                }

                    // Função para obter o nome do mês por extenso
                function getNomeMes(mes) {
                    const meses = [
                        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ];
                    return meses[mes];
                }

                    // Função para formatar a data por extenso (ex: 23 de Abril de 2025)
                function formatarDataExtenso(data) {
                    const dataObj = new Date(data);
                    const dia = dataObj.getDate();
                    const mes = dataObj.getMonth();
                    const ano = dataObj.getFullYear();
                    const nomeMes = getNomeMes(mes).toLowerCase(); // Garante minúsculas
                    return `${dia} de ${nomeMes} de ${ano}`;
                }


                    // Função para formatar um array para exibição com "e" antes do último item
                function formatArrayForDisplay(arr) {
                    if (arr.length === 0) {
                        return "";
                    } else if (arr.length === 1) {
                        return arr[0];
                    } else {
                        const lastItem = arr[arr.length - 1];
                        const otherItems = arr.slice(0, arr.length - 1).join(', ');
                        return `${otherItems} e ${lastItem}`;
                    }
                }
                    // Função para inicializar o ano atual para "Ano do Termo de Ata"
                function inicializarData() {
                    const dataAtual = new Date();
                    anoTermoAtaInput.value = dataAtual.getFullYear(); // Define o ano atual
                }

                    // Função para adicionar dinamicamente novos campos de "Termo de Ata"
                function adicionarTermoAtaInput() {
                    const novoTermoAtaInput = document.createElement('div');
                    novoTermoAtaInput.className = 'd-flex align-items-center mb-2'; // Classes flex do Bootstrap
                    novoTermoAtaInput.innerHTML = `
                    <input type="text" class="form-control termo-ata-input me-2 rounded" placeholder="Digite o(s) termo(s)">
                    <input type="text" class="form-control termo-empresa-input me-2 rounded" placeholder="Digite o nome da EMPRESA">
                    <button type="button" class="btn btn-danger remover-termo-ata rounded-circle">
                    <i class="fas fa-trash"></i>
                    </button>
                    `;
                    termoAtaContainer.appendChild(novoTermoAtaInput);
                    const removerBotao = novoTermoAtaInput.querySelector('.remover-termo-ata');
                    removerBotao.addEventListener('click', function() {
                    this.parentNode.remove(); // Remove a div pai (input + botão)
                });
                }


                    // Funcionalidade de autocomplete
                function autocomplete(inp, arr) {
                    let currentFocus;
                    inp.addEventListener("input", function(e) {
                        let a, b, i, val = this.value;
                    closeAllLists(); // Fecha quaisquer listas já abertas
                    if (!val) { return false; }
                    currentFocus = -1;
                    a = document.createElement("div");
                    a.setAttribute("id", this.id + "autocomplete-list");
                    a.setAttribute("class", "autocomplete-items");
                    this.parentNode.appendChild(a);

                    for (i = 0; i < arr.length; i++) {
                        const fullItem = arr[i];
                        const parts = fullItem.split(',');
                    const siglaAndNumber = parts[0]; // Ex: "SEAD-511"
                    const description = parts.slice(1).join(','); // Ex: " Departamento de Administração, Diretor"

                    // Extrai a parte numérica da sigla (números no final da string antes da vírgula)
                    const numberMatch = siglaAndNumber.match(/(\d+)$/);
                    let extractedNumber = '';
                    if (numberMatch) {
                        extractedNumber = numberMatch[1];
                    }

                    // Verifica se o valor de entrada (apenas números) corresponde ao início da parte numérica extraída
                    if (val && extractedNumber.startsWith(val)) {
                        b = document.createElement("div");

                    // Encontra o índice onde o número começa na string da sigla
                        const numberStartIndex = siglaAndNumber.lastIndexOf(extractedNumber);
                    const prefix = siglaAndNumber.substring(0, numberStartIndex); // Ex: "SEAD-"
                    const suffix = extractedNumber.substring(val.length); // Ex: "1" se val for "51"

                    // Constrói o HTML com a parte numérica correspondente em negrito
                    b.innerHTML = `${prefix}<strong>${val}</strong>${suffix}${description}`;
                    // Insere um campo de entrada oculto para armazenar o valor completo do array
                    b.innerHTML += "<input type='hidden' value='" + fullItem + "'>";
                    b.addEventListener("click", function(e) {
                    // Insere o valor completo no campo de texto
                        inp.value = this.getElementsByTagName("input")[0].value;
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });
                    // Navegação por teclado para autocomplete
                    inp.addEventListener("keydown", function(e) {
                        let x = document.getElementById(this.id + "autocomplete-list");
                        if (x) x = x.getElementsByTagName("div");
                    if (e.keyCode == 40) { // Seta para baixo
                        currentFocus++;
                        addActive(x);
                    } else if (e.keyCode == 38) { // Seta para cima
                        currentFocus--;
                        addActive(x);
                    } else if (e.keyCode == 13) { // Enter
                        e.preventDefault();
                        if (currentFocus > -1) {
                            if (x) x[currentFocus].click();
                        }
                    }
                });
                    function addActive(x) {
                        if (!x) return false;
                        removeActive(x);
                        if (currentFocus >= x.length) currentFocus = 0;
                        if (currentFocus < 0) currentFocus = (x.length - 1);
                        x[currentFocus].classList.add("autocomplete-active");
                    }
                    function removeActive(x) {
                        for (let i = 0; i < x.length; i++) {
                            x[i].classList.remove("autocomplete-active");
                        }
                    }
                    function closeAllLists(elmnt) {
                    // Fecha todas as listas de autocomplete no documento, exceto a passada como argumento
                        let x = document.getElementsByClassName("autocomplete-items");
                        for (let i = 0; i < x.length; i++) {
                            if (elmnt != x[i] && elmnt != inp) {
                                x[i].parentNode.removeChild(x[i]);
                            }
                        }
                    }
                    // Fecha a lista de autocomplete ao clicar fora
                    document.addEventListener("click", function (e) {
                        closeAllLists(e.target);
                    });
                }


                    // Inicializações
                inicializarData();
                autocomplete(siglaNomeDestinoInput, siglaNomeDestinoArray);

                    // Event listener para os botões de rádio de tipo de processo (físico/digital)
                processoFisicoRadio.addEventListener('change', function() {
                    processoFisicoInputsDiv.style.display = this.checked ? 'block' : 'none';
                });
                processoDigitalRadio.addEventListener('change', function() {
                    processoFisicoInputsDiv.style.display = 'none'; // Garante que esteja oculto quando digital for selecionado
                });

                    // Event listener para adicionar entrada de "Termo de Ata"
                const adicionarTermoAtaButton = termoAtaContainer.querySelector('.adicionar-termo-ata');
                adicionarTermoAtaButton.addEventListener('click', adicionarTermoAtaInput);

                    // Event listener para gerar o documento
                gerarDocumentoButton.addEventListener('click', () => {
                    const tipoProcesso = document.querySelector('input[name="tipo_processo"]:checked').value;
                    const processoNumero = processoNumeroInput.value;
                    const folha_cota = processofolhaInput.value;
                    const processoAno = processoAnoInput.value;
                    const siglaNomeDestino = siglaNomeDestinoInput.value;
                    const tipotermo = tipo_termo_select.value;
                    const lugares = siglaNomeDestino.split(",");
                    const termosAtaInputs = termoAtaContainer.querySelectorAll('.termo-ata-input');
                    const termosEmpresasInputs = termoAtaContainer.querySelectorAll('.termo-empresa-input');
                    const termosAta = Array.from(termosAtaInputs).map(input => input.value).filter(value => value !== "");
                    const termoseEmpresa = Array.from(termosEmpresasInputs).map(input => input.value).filter(value => value !== "");

                    const anoTermoAta = anoTermoAtaInput.value;
                    const itensSelecionados = Array.from(document.querySelectorAll('input[name="itens"]:checked'))
                    .map(checkbox => checkbox.value);
                    const cotaSeguinte = document.getElementById('cota_seguinte').checked;

                    const dataAtual = new Date();
                    const dataFormatadaParaDoc = formatarData(dataAtual); // ex: 23/04/2025
                    const dataExtensoParaDoc = formatarDataExtenso(dataAtual); // ex: 23 de Abril de 2025

                    let processoInfo = '';
                    if (tipoProcesso === 'fisico') {
                        processoInfo = `
                        <p style='margin-top:12.0pt;margin-right:-14.3pt;margin-bottom:8.0pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:70.9pt;line-height:200%;'><span style='font-size:10pt;line-height:200%;font-family:"Bookman Old Style",serif;'>Papel para informa&ccedil;&atilde;o, rubricado como folha n&ordm; <u>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; # <strong><span class="editable" contenteditable="true">${folha_cota}</span></strong> #&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</u></span></p>
                        <p style='margin-top:0cm;margin-right:-14.3pt;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;line-height:normal;'><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>do Processo n&ordm;. <u class=""><strong>&nbsp; &nbsp; ${processoNumero} &nbsp; &nbsp;</strong></u> de <u class=""><strong>&nbsp; &nbsp;${processoAno}</strong></u>, &nbsp;<u class=""><strong>&nbsp; ${dataFormatadaParaDoc}&nbsp;</strong></u> (a) <u>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</u></span></p>
                        <p style='margin-top:0cm;margin-right:-14.3pt;margin-bottom:.0001pt;margin-left:9.0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;text-indent:28.45pt;'><span style='font-size:11px;font-family:"Bookman Old Style",serif;'>Nicolas Leite Araujo</span></p>
                        <p style='margin-top:0cm;margin-right:-14.3pt;margin-bottom:.0001pt;margin-left:9.0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;text-indent:28.45pt;'><span style='font-size:11px;font-family:"Bookman Old Style",serif;'>Agente Administrativo</span></p>
                        <p style='margin-top:0cm;margin-right:-14.3pt;margin-bottom:6.0pt;margin-left:9.0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;text-indent:28.45pt;'><span style='font-size:11px;font-family:"Bookman Old Style",serif;'>RF: 51.735</span></p>
                        `;
                    } else {
                    processoInfo = ``; // Nenhuma informação específica para processo digital
                }

                let termosAtaHTML1 = `
                <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:7.1pt;'><strong><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'><br><br>&Agrave;</span></strong></p>
                <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:7.1pt;'><strong><span  style='font-size:10pt;font-family:"Bookman Old Style",serif;'>${lugares[0] ? lugares[0].trim() : ''}</span></strong></p>
                    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:6.0pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:7.1pt;'><strong><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>` + sexot(sexo,lugares[2]) + `</span></strong></p>
                `;
                let termosAtaHTML2 = `
                <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:35.45pt;'>
                    <span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>Para ci&ecirc;ncia e demais provid&ecirc;ncias de Vossa Senhoria.</span>
                </p>
                <p style='margin-top:0cm;margin-right:11.35pt;margin-bottom:48.0pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:justify;text-indent:35.4pt;'><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>Em <span>${dataExtensoParaDoc}</span>.</span></p>

                <p><br></p>
                <p><br></p>
                <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>Laize Cegarra Elias Magalh&atilde;es</span></strong></p>
                <p style='margin-top:0cm;margin-right:0cm;margin-bottom:12.0pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>Diretora da Divis&atilde;o de Expediente Administrativo</span></strong></p>
                <p style='margin-top:0cm;margin-right:0cm;margin-bottom:12.0pt;margin-left:0cm;font-size:11.0pt;font-family:"Calibri",sans-serif;text-align:center;'><strong><span style='font-size:10pt;font-family:"Bookman Old Style",serif;'>&nbsp;</span></strong></p>
                <p><br></p>
                `;

                let textocota = `<p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>Segue em anexo, sob fls. <span class="editable" contenteditable="true">XXXX</span>`;

                    // Condições para cada item selecionado
                if (itensSelecionados.includes("Email de Convocação")) {
                    textocota += `, e-mail referente à convocação para assinatura`;
                    if (termosAta.length > 1) {
                        textocota += ` dos Termos`;
                    } else {
                        textocota += ` do Termo`;
                    }
                    textocota += `, bem como, sob fls. <span class="editable" contenteditable="true">XXX</span>`;
                }




                if (termosAta.length > 1) {
                    textocota += `, os Termos de ${tipotermo} nº.s `;
                } else {
                    textocota += ` o Termo de ${tipotermo} nº. `;
                }

                textocota +=`${formatArrayForDisplay(termosAta)}/${anoTermoAta}, `;

                if (tipotermo == "CONTRATO"){
                    textocota +=`<strong>“CONTRATO Nº. ${formatArrayForDisplay(termosAta)}/${anoTermoAta}, QUE ENTRE SI CELEBRAM A PREFEITURA DA ESTÂNCIA BALNEÁRIA DE PRAIA GRANDE E `;
                }else{
                    textocota +=`<strong>“TERMO DE ${tipotermo} PARA <span class="editable" contenteditable="true">XXX</span>, QUE ENTRE SI CELEBRAM A PREFEITURA DA ESTÂNCIA BALNEÁRIA DE PRAIA GRANDE E `;
                }

                if (termoseEmpresa.length > 1) {
                    textocota += `AS EMPRESAS `;
                } else {
                    textocota += `A EMPRESA `;
                }

                for (var v = termoseEmpresa.length - 1; v >= 0; v--) {
                    if(v>0){
                        textocota += termoseEmpresa[v] + "; ";
                    }else{
                        textocota += termoseEmpresa[v] + ".";
                    }    
                }

                textocota += "”</strong>";

                if (termosAta.length > 1) {
                    textocota +=`, que foram devidamente registrados em livro competente`;
                } else {
                    textocota +=`, que foi devidamente registrado em livro competente`;
                }

                textocota +=` e sob fls. <span class="editable" contenteditable="true">XXX/XXX</span>, `;


                var x = itensSelecionados.length;

                if (itensSelecionados.includes("Erro de Lançamento SIAM")) {
                    x--;
                }

                if (itensSelecionados.includes("Relatório AUDESP")) {
                    x--;
                }

                if (itensSelecionados.includes("Email de Convocação")) {
                    x--;
                }

                var i = 0;

                if (itensSelecionados.includes("Relatórios")) {
                    i++;
                    if (termosAta.length > 1) {
                        textocota += `Relatórios de Inclusão no sistema SIAM`;
                    } else {
                        textocota += `Relatório de Inclusão no sistema SIAM`;
                    }

                    if(i==x){
                        textocota += ` e `;
                    }else if(i<x){
                        textocota += `, `;  
                    }
                }

                if (itensSelecionados.includes("Comunicação de Fornecimento")) {
                    i++;
                    textocota += `Comunicações de Fornecimento/Serviços`;
                    if(i==x){
                        textocota += ` e `;
                    }else if(i<x){
                        textocota += `, `;  
                    }
                }

                var ncomprovantes = 0;
                if (itensSelecionados.includes("DOM")) {ncomprovantes++;}
                if (itensSelecionados.includes("DOU")) {ncomprovantes++;}
                if (itensSelecionados.includes("DOE")) {ncomprovantes++;}

                if(ncomprovantes>0){
                    i++;
                    if(ncomprovantes>1){
                        textocota += `comprovantes de Publicações `;
                    }else if(ncomprovantes == 1){
                        textocota += `comprovante de Publicação `;
                    }
                    textocota += `do Extrato Contratual `;

                    var ncomp=0;
                    if (itensSelecionados.includes("DOM")) {
                        ncomp++;
                        textocota +=`no Diário Oficial do Município`;
                        if(ncomp==ncomprovantes){
                        }else if(ncomp<ncomprovantes-1){
                            textocota += `, `;
                        }else if(ncomp==ncomprovantes-1){
                            textocota += ` e `;
                        }
                    }

                    if (itensSelecionados.includes("DOU")) {
                        ncomp++;
                        textocota += `no Diário Oficial da União`;
                        if(ncomp==ncomprovantes){
                        }else if(ncomp<ncomprovantes-1){
                            textocota += `, `;
                        }else if(ncomp==ncomprovantes-1){
                            textocota += ` e `;
                        }
                    }

                    if (itensSelecionados.includes("DOE")) {
                        ncomp++;
                        textocota += `no Diário Oficial do Estado`;
                        if(ncomp==ncomprovantes){
                        }else if(ncomp<ncomprovantes-1){
                            textocota += `, `;
                        }else if(ncomp==ncomprovantes-1){
                            textocota += ` e `;
                        }
                    }

                    if(i==x){
                        textocota += ` e `;
                    }else if(i<x){
                        textocota += `, `;  
                    }

                }


                if (itensSelecionados.includes("ERRATA")) {
                    i++;
                    textocota += `Errata`;
                    if(i==x){
                        textocota += ` e `;
                    }else if(i<x){
                        textocota += `, `;  
                    }
                }

                if (itensSelecionados.includes("PORTARIA")) {
                    i++;
                    textocota += `Portaria nº. XXX`;
                    if(i==x){
                        textocota += ` e `;
                    }else if(i<x){
                        textocota += `, `;  
                    }
                }

                if (itensSelecionados.includes("Relatório AUDESP")) {
                    textocota += `
                        Relatório de Inclusão no AUDESP sob Código de ajuste nº. <span class="editable" contenteditable="true">202X00000XXXX</span>
                    `;
                }


                textocota += `.</p>`


                if (itensSelecionados.includes("Erro de Lançamento SIAM")) {
                    textocota += `
                        <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>Informo que não foi possível a inclusão do Termo de Ata nº. ${formatArrayForDisplay(termosAta)}/${anoTermoAta}, conforme mensagem do sistema sob fls. <span class="editable" contenteditable="true">XXX</span>. Sendo assim, solicito a regularização e restituição para que o ajuste seja disponibilizado no SIAM.</p>
                    `;
                }

                if (itensSelecionados.includes("PNPC Não Enviado")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Informo que os ajustes não foram enviados ao Portal Nacional de Contas Públicas (PNPC) conforme mensagem de advertência no Sistema Integrado de Administração (SIAM), em fls. <span class="editable" contenteditable="true">XXX</span>.
                    </p>`;
                }

                if (itensSelecionados.includes("Solicitar Código AUDESP")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Solicito que seja informado o código da licitação no AUDESP para efetivação do cadastro do ajuste, atentando-se ao prazo estabelecido pelo Tribunal de Contas do Estado de São Paulo.
                    </p>`;
                }

                if (itensSelecionados.includes("Erro SIAM Ata")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Informo que não foi possível a inclusão do Termo de Ata nº. ${formatArrayForDisplay(termosAta)}/${anoTermoAta} no Sistema Integrado de Administração de Materiais (SIAM), devido advertência do sistema, conforme fls. <span class="editable" contenteditable="true">XXX</span>. Solicito regularização com posterior devolução para a devida inclusão.
                    </p>`;
                }

                if (itensSelecionados.includes("Erro PNCP")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Comunico que não foi possível a inclusão dos dados dos Termos de Ata no Portal Nacional de Contratações Públicas (PNCP), conforme mensagens do sistema sob fls. <span class="editable" contenteditable="true">XXX/XXX</span>.
                    </p>`;
                }

                if (itensSelecionados.includes("Empresa Não Assinou")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Adicionalmente informo que a empresa <span class="editable" contenteditable="true">XXXXXXXXXXX</span> não se manifestou sobre a assinatura do ajuste, mesmo após a prorrogação do prazo. Face ao exposto, segue para determinações do responsável quanto ao procedimento a ser adotado por esta Divisão.
                    </p>`;
                }

                if (itensSelecionados.includes("Empresa Não Devolveu")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Informo que a empresa <span class="editable" contenteditable="true">XXXXXXXXXXX</span> não restituiu o Termo devidamente assinado. Face ao exposto, segue para determinações do responsável quanto ao procedimento a ser adotado por esta Divisão.
                    </p>`;
                }

                if (itensSelecionados.includes("Empresas Não Assinaram")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Informo que a empresa <span class="editable" contenteditable="true">XXXXXXXXXXX</span> não efetuou a assinatura, conforme resposta via e-mail sob fls. <span class="editable" contenteditable="true">XXX</span>. A empresa <span class="editable" contenteditable="true">XXXXXXXXXXX</span> não se manifestou sobre a assinatura do ajuste, mesmo após a prorrogação do prazo. Face ao exposto, segue para determinações do responsável quanto ao procedimento a ser adotado por esta Divisão.
                    </p>`;
                }

                if (itensSelecionados.includes("MGC Sem Empenho")) {
                    textocota += `
    <p style='margin-top:0cm;margin-right:0cm;margin-bottom:.0001pt;margin-left:0cm;font-size:11.0pt;font-family:"Bookman Old Style",sans-serif;text-align:justify;text-indent:35.45pt;'>
    Informo que o ajuste não foi incluído no MGC – módulo de gestão de contratos, devido à falta de empenho prévio. Portanto, solicito regularização e restituição, atentando-se ao prazo do PNCP.
                    </p>`;
                }

                const cotaSeguinteHTML = cotaSeguinte ? `
                   <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:.0001pt;font-size:11.0pt;margin:0cm;background:white;'><strong><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>&Agrave;</span></strong></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:.0001pt;font-size:11.0pt;margin:0cm;background:white; border-box;font-variant-ligatures: normal;font-variant-caps: normal;orphans: 2;text-align:start;widows: 2;-webkit-text-stroke-width: 0px;text-decoration-thickness: initial;text-decoration-style: initial;text-decoration-color: initial;word-spacing:0px;'><strong><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>SESURB-15</span></strong></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:6.0pt;font-size:11.0pt;background:white; border-box;font-variant-ligatures: normal;font-variant-caps: normal;orphans: 2;text-align:start;widows: 2;-webkit-text-stroke-width: 0px;text-decoration-thickness: initial;text-decoration-style: initial;text-decoration-color: initial;word-spacing:0px;'><strong><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>Sra. Secret&aacute;ria</span></strong></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:6.0pt;font-size:11.0pt;background:white;'><span style='font-size:15px;font-family:"Calibri",sans-serif;color:#212529;'>&nbsp;</span></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:.0001pt;font-size:11.0pt;margin:0cm;text-align:justify;text-indent:35.4pt;background:white; border-box;font-variant-ligatures: normal;font-variant-caps: normal;orphans: 2;widows: 2;-webkit-text-stroke-width: 0px;text-decoration-thickness: initial;text-decoration-style: initial;text-decoration-color: initial;word-spacing:0px;'><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>Para ci&ecirc;ncia e demais provid&ecirc;ncias de V. S&ordf;., os&nbsp;</span><span style='font-size:13px;font-family:"Bookman Old Style",serif;color:#212529;'>Termos de Prorroga&ccedil;&atilde;o Contratual</span><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>, que foram registrados em livro competente.</span></p>
<p style='margin-right:11.35pt;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:48.0pt;font-size:11.0pt;text-align:justify;text-indent:35.4pt;background:white;'><span style='font-size:13px;font-family:"Bookman Old Style",serif;color:#212529;'>Em&nbsp;</span><span style='font-size:15px;font-family:"Calibri",sans-serif;color:#212529;'>29</span><span style='font-size:13px;font-family:"Bookman Old Style",serif;color:#212529;'>&nbsp;de&nbsp;</span><span style='font-size:15px;font-family:"Calibri",sans-serif;color:#212529;'>janeiro</span><span style='font-size:13px;font-family:"Bookman Old Style",serif;color:#212529;'>&nbsp;de&nbsp;</span><span style='font-size:15px;font-family:"Calibri",sans-serif;color:#212529;'>2026</span><span style='font-size:13px;font-family:"Bookman Old Style",serif;color:#212529;'>.</span></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:.0001pt;font-size:11.0pt;margin:0cm;background:white; border-box;font-variant-ligatures: normal;font-variant-caps: normal;orphans: 2;text-align:start;widows: 2;-webkit-text-stroke-width: 0px;text-decoration-thickness: initial;text-decoration-style: initial;text-decoration-color: initial;word-spacing:0px;'><strong><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>AMAURI DA SILVA SANTOS</span></strong></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:.0001pt;font-size:11.0pt;margin:0cm;background:white; border-box;font-variant-ligatures: normal;font-variant-caps: normal;orphans: 2;text-align:start;widows: 2;-webkit-text-stroke-width: 0px;text-decoration-thickness: initial;text-decoration-style: initial;text-decoration-color: initial;word-spacing:0px;'><strong><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>Diretor do Departamento de Administra&ccedil;&atilde;o</span></strong></p>
                    <p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:12.0pt;font-size:11.0pt;background:white; border-box;font-variant-ligatures: normal;font-variant-caps: normal;orphans: 2;text-align:start;widows: 2;-webkit-text-stroke-width: 0px;text-decoration-thickness: initial;text-decoration-style: initial;text-decoration-color: initial;word-spacing:0px;'><strong><span style='font-size:13px;font-family:"Tahoma",sans-serif;color:#212529;'>SEAD-511</span></strong></p> ` : '';

                    // Conteúdo principal do documento  - ${termosAtaHTML1}
                    const documentoHTML = `
                    ${processoInfo}  ${textocota} ${termosAtaHTML2}${cotaSeguinteHTML} 
                    `;

                    documentoPreview.innerHTML = documentoHTML;
                    Swal.fire({
                        icon: 'success',
                        title: 'Documento Gerado!',
                        text: 'O documento foi gerado com sucesso no preview.',
                    });
                });

                    // Event listener para selecionar texto do preview
selecionarTextoPreviewButton.addEventListener('click', () => {
    const range = document.createRange();
                    range.selectNodeContents(documentoPreview); // Usa selectNodeContents para selecionar apenas o conteúdo
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // Opcional: Copiar para a área de transferência após a seleção
                    try {
                        document.execCommand('copy');
                    /* Swal.fire({
                    icon: 'info',
                    title: 'Texto Copiado!',
                    text: 'O texto do preview foi copiado para a área de transferência.',
                    showConfirmButton: false,
                    timer: 1500
                    });
                    */
                    } catch (err) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Falha ao Copiar!',
                            text: 'Não foi possível copiar o texto automaticamente. Por favor, selecione e copie manualmente.',
                        });
                    }
                });