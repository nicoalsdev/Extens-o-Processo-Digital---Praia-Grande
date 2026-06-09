  /*
<p style='margin:0cm;margin-bottom:.0001pt;font-size:15px;font-family:"Calibri",sans-serif;'><strong><u><span style='font-size:15px;font-family:"Calibri",sans-serif;color:red;background:yellow;'>Obs.:</span></u></strong><u style="text-align:start;"><span style="font-size:15px;font-family:Calibri;color:red;background:yellow;"> Informamos que nos dias ${data.feriado}<strong><span style='font-family:"Calibri",sans-serif;'>&nbsp;e ${data.ponto},&nbsp;</span></strong> n&atilde;o haver&aacute; expediente administrativo, em raz&atilde;o dos feriados e pontos facultativos, conforme <strong><span style='font-family:"Calibri",sans-serif;'>Lei e&nbsp;</span></strong> <strong><span style='font-family:"Calibri",sans-serif;'>Decretos n&ordm;. 1506/2010 e 8286/2025.</span></strong></span></u></p>

  */


// Variável global para armazenar o texto gerado
let corpoEmailGlobal = "";
let tituloEmailGlobal = "";

window.onload = function () {
    // Vincular os botões aos eventos
    document.getElementById('GerarMail').onclick = gerarEmail;
    document.getElementById('btnCopiar').onclick = copiarEmail;
    document.getElementById('btnSelecionar').onclick = selecionarEmail;

    const dataInicioInput = document.getElementById("data_inicio_1");
    const dataFimAutomaticaInput = document.getElementById("data_fim_automatica");
    const dataFimManualCheck = document.getElementById("data_fim_manual_check");
    const dataFimManualInput = document.getElementById("data_fim_manual");

    // Lógica de carregar dados do localStorage
    const dadosGerais = carregarDadosGerais();
    
    // 1. Sempre resetar os SELECTS para vazio ao carregar
    if (document.getElementById("tipo_termo")) {
        document.getElementById("tipo_termo").value = ""; 
    }
    if (document.getElementById("modalidade_licitacao_1")) {
        document.getElementById("modalidade_licitacao_1").value = "";
    }

    if (dadosGerais) {
        document.getElementById("objeto_termo_1").value = dadosGerais.objeto_termo || "";
        document.getElementById("modalidade_licitacao_2").value = dadosGerais.modalidade_licitacao || "";
        document.getElementById("numero_processo_1").value = dadosGerais.numero_processo || "";

        // 2. LOGICA DA DATA: Se existir data salva, usa ela.
        if (dadosGerais.data_inicio && (dadosGerais.data_fim || dadosGerais.data_fim_automatica)) {
            // Criando a data de hoje no formato YYYY-MM-DD
const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Meses começam em 0
const dia = String(hoje.getDate()).padStart(2, '0');

const dataFormatada = `${ano}-${mes}-${dia}`;
            dataInicioInput.value = dataFormatada;
            // Verifica qual nome de propriedade foi usado no salvamento
            dataFimAutomaticaInput.value = dadosGerais.data_fim || dadosGerais.data_fim_automatica;

        } else {
            // Se NÃO tiver data, faz o cálculo automático
            executarCalculoDataPadrao(dataFormatada, dataFimAutomaticaInput);
        }
    } else {
        // Se não houver dado nenhum no localStorage, calcula data atual
        executarCalculoDataPadrao(dataInicioInput, dataFimAutomaticaInput);
    }

    // Listener do Checkbox de data manual
    dataFimManualCheck.addEventListener("change", function () {
        if (this.checked) {
            dataFimManualInput.classList.remove("hidden");
            dataFimAutomaticaInput.classList.add("hidden");
        } else {
            dataFimManualInput.classList.add("hidden");
            dataFimAutomaticaInput.classList.remove("hidden");
        }
    });
};

// Função auxiliar para não repetir código de cálculo
function executarCalculoDataPadrao(inputInicio, inputFim) {
    const dataAtual = new Date();
    const offset = dataAtual.getTimezoneOffset();
    const dataLocal = new Date(dataAtual.getTime() - (offset * 60 * 1000));
    
    inputInicio.value = dataLocal.toISOString().split('T')[0];

    let diasUteis = 0;
    let dataFim = new Date(dataAtual);
    while (diasUteis < 4) {
        dataFim.setDate(dataFim.getDate() + 1);
        if (dataFim.getDay() !== 0 && dataFim.getDay() !== 6) diasUteis++;
    }
    
    const dataFimLocal = new Date(dataFim.getTime() - (offset * 60 * 1000));
    inputFim.value = dataFimLocal.toISOString().split('T')[0];
}


        function gerarEmail() {
            const objeto_termo = document.getElementById('objeto_termo_1').value;
            const tipo_termo = document.getElementById('tipo_termo').value;
            const modalidade_licitacaomod = document.getElementById('modalidade_licitacao_1').value;
            const modalidade_licitacaonum = document.getElementById('modalidade_licitacao_2').value;
            const numero_processo = document.getElementById('numero_processo_1').value;
            const nome_representante = document.getElementById('nome_representante').value;
            const link_assinatura = document.getElementById('link_assinatura').value;
            const data_inicio_input = document.getElementById('data_inicio_1').value;
            const data_fim_automatica_input = document.getElementById('data_fim_automatica').value;
            const data_fim_manual_check = document.getElementById('data_fim_manual_check').checked;
            const data_fim_manual_input = document.getElementById('data_fim_manual').value;

            let data_fim = data_fim_automatica_input; // Valor padrão
            let numeroDiasUteis = 5; // Valor padrão para 5 dias úteis
            let data_inicio_formatada = converterParaFormatoBrasileiro(data_inicio_input);
            let data_fim_formatada = converterParaFormatoBrasileiro(data_fim);


            if (data_fim_manual_check) {
                if (!data_fim_manual_input) {
                    alert("Por favor, preencha a data de fim manualmente.");
                    return;
                }
                data_fim = data_fim_manual_input; // Usa o valor manual se o checkbox estiver marcado
                data_fim_formatada = converterParaFormatoBrasileiro(data_fim);
            }

             // Calcula o número de dias úteis entre data_inicio e data_fim
            const inicio = converterDataParaObjeto(data_inicio_input);
            const fim = converterDataParaObjeto(data_fim);
            numeroDiasUteis = calcularDiasUteis(inicio, fim);


            if (!objeto_termo || !modalidade_licitacaonum || !numero_processo || !data_inicio_input || !data_fim || !nome_representante || !link_assinatura) {
                alert("Os Campos Estão Vazios!!!");
            }

            // Determina a saudação com base na hora de São Paulo
            const now = new Date();
            const horaSaoPaulo = now.getHours();
            let saudacao = "Bom dia,";
            if (horaSaoPaulo >= 12 && horaSaoPaulo < 18) {
                saudacao = "Boa tarde,";
            } else if (horaSaoPaulo >= 18) {
                saudacao = "Boa noite,";
            }
            
            const sufixoDias = numeroDiasUteis === 1 ? "dia útil" : "dias úteis";
            let emailTexto = `<p style='margin: 0 0 8pt 0; font-size: 11pt; font-family: Arial, sans-serif;'>${saudacao}</p>
<p style='margin: 0 0 8pt 0; font-size: 11pt;'><span style='font-size: 13px;'>Rogo assinatura digital do(a) senhor(a) <strong>${nome_representante}</strong>, no <strong> ${tipo_termo} ${objeto_termo}</strong>, decorrente de procedimento licitatório, na modalidade ${modalidade_licitacaomod} <strong>${modalidade_licitacaonum}</strong>, Processo Administrativo n&ordm;. <strong>${numero_processo}</strong>, por meio do link:</span></p>
<p style='margin: 0 0 8pt 0; font-size: 11pt;'><a href="${link_assinatura}">${link_assinatura}</a></p>
<p style='margin: 0 0 8pt 0; font-size: 11pt;'><span style='font-size: 13px;'>PRAZO PARA RESTITUI&Ccedil;&Atilde;O: <span style="color:red;">${data_fim_formatada} (${converterNumeroParaTexto(numeroDiasUteis)} ${sufixoDias})</span>.</span></p>




<p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:10.0pt;font-size:11.0pt;'><strong><span style='font-size:12px;font-family:"Arial",sans-serif;color:red;'>ATEN&Ccedil;&Atilde;O:</span></strong><span style='font-size:12px;font-family:"Arial",sans-serif;color:red;'>&nbsp;Solicito que seja encaminhada uma c&oacute;pia simples dos seguintes documentos:</span></p><p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:8.0pt;font-size:11.0pt;'><strong><span style='font-size:12px;font-family:"Arial",sans-serif;color:red;'>- Procura&ccedil;&atilde;o</span></strong><span style='font-size:12px;font-family:"Arial",sans-serif;color:red;'>&nbsp;(se necess&aacute;rio); e</span></p><p style='margin-right:0cm;margin-left:0cm;font-size:16px;font-family:"Calibri",sans-serif;margin-top:0cm;margin-bottom:10.0pt;font-size:11.0pt;'><strong><span style='font-size:12px;font-family:"Arial",sans-serif;color:red;'>- <u>R.G.</u> ou <u>C.N.H.</u></span></strong></p>


<p style='margin:0cm;margin-bottom:.0001pt;font-size:15px;font-family:"Calibri",sans-serif;'><u><span style='font-size:13px;font-family:"Century Gothic",sans-serif;'>Caso n&atilde;o seja poss&iacute;vel realizar a assinatura diretamente pelo link, acesse o mesmo endere&ccedil;o e utilize a op&ccedil;&atilde;o &lsquo;<strong>VERS&Atilde;O DE IMPRESS&Atilde;O&rsquo;.&nbsp;</strong>Fa&ccedil;a o download do arquivo em PDF, assine as folhas <strong>XXX</strong> e <strong>XXX</strong> utilizando o GOV.BR ou Certificado Digital E-CPF, e nos encaminhe o documento assinado em resposta a este e-mail.</span></u></p>
<p style='margin:0cm;margin-bottom:.0001pt;font-size:15px;font-family:"Calibri",sans-serif;'><span style='font-size:13px;font-family:"Century Gothic",sans-serif;'>&nbsp;</span></p>
<p style='margin:0cm;margin-bottom:.0001pt;font-size:15px;font-family:"Calibri",sans-serif;'><span style='font-size:13px;font-family:"Century Gothic",sans-serif;'>Coloco-me &agrave; disposi&ccedil;&atilde;o para mais esclarecimentos.</span></p>
`;
            const outputDiv = document.getElementById('output_email');
            const emailGeradoDiv = document.getElementById('email_gerado');
            const tituloEmail = document.getElementById('titulo_email');
            const processolimpo = numero_processo.replace(/[,.;]/g, "");
            tituloEmail.innerHTML =  `<h2><span style='font-size:16px;font-family:"Arial",sans-serif;color:black;'>Convocação para Assinatura: ${tipo_termo} ${objeto_termo} - ${modalidade_licitacaomod} ${modalidade_licitacaonum} - Processo ${numero_processo}</span></h2>`
            outputDiv.innerHTML = emailTexto;
            emailGeradoDiv.classList.remove('hidden');
        }
        function copiarEmail() {
            const emailTexto = document.getElementById('output_email').innerText;
            navigator.clipboard.writeText(emailTexto).then(() => {
                alert('E-mail copiado para a área de transferência!');
            }).catch(err => {
                console.error('Falha ao copiar: ', err);
                alert('Não foi possível copiar o e-mail. Por favor, selecione e copie manualmente.');
            });
        }

        function selecionarEmail() {
            const emailDiv = document.getElementById('output_email');
            const range = document.createRange();
            range.selectNode(emailDiv);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        }

    function calcularDiasUteis(inicio, fim) {
    // Criamos cópias para não alterar os objetos originais
    let dataInicio = new Date(inicio);
    let dataFim = new Date(fim);

    // Zeramos as horas para garantir uma comparação apenas de datas
    dataInicio.setHours(0, 0, 0, 0);
    dataFim.setHours(0, 0, 0, 0);

    let diasUteis = 0;

    if (dataInicio > dataFim) {
        return 0;
    }

    // O loop deve incluir o dia final (<=)
    while (dataInicio <= dataFim) {
        const diaSemana = dataInicio.getDay();
        // 0 = Domingo, 6 = Sábado
        if (diaSemana !== 0 && diaSemana !== 6) {
            diasUteis++;
        }
        dataInicio.setDate(dataInicio.getDate() + 1);
    }
    return diasUteis;
}

        function converterNumeroParaTexto(numero) {
            const unidades = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
            const dezenas = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
            const centenas = ["cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

            if (numero === 0) return "zero";
            if (numero < 0) return "Número negativo";

            let texto = "";

            if (numero >= 1000) {
                const milhar = Math.floor(numero / 1000);
                texto += converterNumeroParaTexto(milhar) + " mil ";
                numero %= 1000;
            }

            if (numero >= 100) {
                const centena = Math.floor(numero / 100);
                texto += centenas[centena - 1] + " ";
                numero %= 100;
            }

            if (numero >= 20) {
                const dezena = Math.floor(numero / 10);
                texto += (dezena === 2) ? "vinte " :
                         (dezena === 3) ? "trinta " :
                         (dezena === 4) ? "quarenta " :
                         (dezena === 5) ? "cinquenta " :
                         (dezena === 6) ? "sessenta " :
                         (dezena === 7) ? "setenta " :
                         (dezena === 8) ? "oitenta " :
                         (dezena === 9) ? "noventa " : "";
                numero %= 10;
                if (numero > 0) texto += "e ";
            }

            if (numero >= 10 && numero < 20) {
                texto += dezenas[numero - 10] + " ";
                numero = 0;
            }

            if (numero > 0) {
                texto += unidades[numero] + " ";
            }

            return texto.trim();
        }

        function executarCalculoDataPadrao(inputInicio, inputFim) {
    const hoje = new Date();
    
    // Formata YYYY-MM-DD para o input
    const formatarParaInput = (data) => {
        const z = (n) => (n < 10 ? '0' : '') + n;
        return `${data.getFullYear()}-${z(data.getMonth() + 1)}-${z(data.getDate())}`;
    };

    inputInicio.value = formatarParaInput(hoje);

    let diasAdicionados = 0;
    let dataFim = new Date(hoje);
    
    while (diasAdicionados < 4) {
        dataFim.setDate(dataFim.getDate() + 1);
        if (dataFim.getDay() !== 0 && dataFim.getDay() !== 6) {
            diasAdicionados++;
        }
    }
    
    inputFim.value = formatarParaInput(dataFim);
}

        function converterParaFormatoBrasileiro(dataString) {
            const partes = dataString.split('-');
            if (partes.length === 3) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
            return dataString; // Retorna a string original se não estiver no formato esperado
        }

        function converterDataParaObjeto(dataString) {
            const partes = dataString.split('-');
            const ano = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const dia = parseInt(partes[2], 10);
            return new Date(ano, mes, dia);
        }

   function carregarDadosGerais() {
    const dados = localStorage.getItem("dadosEmailSelecionado");
    return dados ? JSON.parse(dados) : null;
}
    