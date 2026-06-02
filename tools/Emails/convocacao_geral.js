  window.onload = function() {

    // VINCULAR BOTÕES
    document.getElementById('GerarMail').addEventListener('click', gerarEmail);
    document.getElementById('copiar_email').addEventListener('click', copiarEmail);
    document.getElementById('selecionar_email').addEventListener('click', selecionarEmail);

            const dataInicioInput = document.getElementById("data_inicio_1");
            const dataFimAutomaticaInput = document.getElementById("data_fim_automatica");
            const dataFimManualCheck = document.getElementById("data_fim_manual_check");
            const dataFimManualInput = document.getElementById("data_fim_manual");

            // Define a data de início como a data atual
            const dataAtual = new Date();
            const dataFormatada = dataAtual.toLocaleDateString("pt-BR");
            dataInicioInput.value = dataAtual.toISOString().split('T')[0];

            // Calcula a data de fim como 5 dias úteis a partir da data atual
            let diasUteis = 0;
            let dataFim = new Date(dataAtual);
            while (diasUteis < 4) {
                dataFim.setDate(dataFim.getDate() + 1);
                const diaSemana = dataFim.getDay();
                if (diaSemana !== 0 && diaSemana !== 6) { // 0 = Domingo, 6 = Sábado
                    diasUteis++;
                }
            }
            const dataFimFormatada = dataFim.toLocaleDateString("pt-BR");
            dataFimAutomaticaInput.value = dataFim.toISOString().split('T')[0];


            // Adiciona um ouvinte de evento ao checkbox para mostrar/ocultar o campo de data manual
            dataFimManualCheck.addEventListener("change", function() {
                if (this.checked) {
                    dataFimManualInput.classList.remove("hidden");
                    dataFimAutomaticaInput.value = ""; // Limpa o campo automático
                    dataFimManualInput.setAttribute("required", "");
                } else {
                    dataFimManualInput.classList.add("hidden");
                    dataFimManualInput.value = dataFimFormatada; // Restaura o valor automático
                    dataFimManualInput.removeAttribute("required");
                }
            });
        };

        function gerarEmail() {
            const objeto_termo = document.getElementById('objeto_termo_1').value;
            const modalidade_licitacao = document.getElementById('modalidade_licitacao_1').value;
            const numero_processo = document.getElementById('numero_processo_1').value;
            const data_inicio = document.getElementById('data_inicio_1').value;
            const data_fim_automatica = document.getElementById('data_fim_automatica').value;
            const data_fim_manual_check = document.getElementById('data_fim_manual_check').checked;
            const data_fim_manual = document.getElementById('data_fim_manual').value;
            const data_fim_manual_input = document.getElementById('data_fim_manual').value;
                
            let data_fim = data_fim_automatica; // Valor padrão

            let data_inicio_formatada = converterParaFormatoBrasileiro(data_inicio);
            let data_fim_formatada = converterParaFormatoBrasileiro(data_fim);

            let numeroDiasUteis = 5; // Valor padrão para 5 dias úteis

            if (data_fim_manual_check) {
                if (!data_fim_manual) {
                    alert("Por favor, preencha a data de fim manualmente.");
                    return;
                }
                data_fim = data_fim_manual; // Usa o valor manual se o checkbox estiver marcado

                // Calcula o número de dias úteis entre data_inicio e data_fim_manual
                const inicio = converterDataParaObjeto(data_inicio);
                const fim = converterDataParaObjeto(data_fim_manual);
                numeroDiasUteis = calcularDiasUteis(inicio, fim);
                data_fim_formatada = converterParaFormatoBrasileiro(data_fim_manual_input);
                data_inicio_formatada = converterParaFormatoBrasileiro(data_inicio);

            }



            if (!objeto_termo || !modalidade_licitacao || !numero_processo || !data_inicio || !data_fim) {
                alert("Os campos dos Formulários estão Vazios!.");
            }

            // Determina a saudação com base na hora de São Paulo
            const now = new Date();
            const horaSaoPaulo = now.getHours();
            let saudacao = "Prezados Senhores,";
            if (horaSaoPaulo >= 6 && horaSaoPaulo < 12) {
                saudacao = "Bom dia,";
            } else if (horaSaoPaulo >= 12 && horaSaoPaulo < 18) {
                saudacao = "Boa tarde,";
            } else {
                saudacao = "Boa noite,";
            }
            let emailTexto = `
                
            <p style='margin-right:0cm;margin-left:0cm;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;margin-bottom:18.0pt;'><span style='font-family:"Arial",sans-serif;color:black;'>${saudacao}</span></p><p style='margin-right:0cm;margin-left:0cm;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;margin-bottom:18.0pt;text-align:justify;text-indent:35.45pt;'><span style='font-family:"Arial",sans-serif;color:black;'>Informamos&nbsp;que se encontra a disposi&ccedil;&atilde;o para assinatura&nbsp;</span><span style='font-family:"Arial",sans-serif;'>o&nbsp;<strong>${objeto_termo}</strong>, oriundo de procedimento&nbsp;licitat&oacute;rio, na modalidade <strong> ${modalidade_licitacao}</strong>, no processo <strong>n&ordm;. ${numero_processo}</strong>.</span></p>
<p style='margin-right:0cm;margin-left:0cm;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;margin-bottom:18.0pt;text-align:justify;'><span style='font-family:"Arial",sans-serif;color:black;'>&nbsp;Por gentileza, confirmar possuir <strong><u><span style='font-family:"Arial",sans-serif;'>Certificado de Assinatura Digital e-CPF</span></u></strong> e/ou solicitar em resposta deste e-mail, para que seja disponibilizado o link para a <strong>Assinatura Digital</strong><span style="background:white;"> no prazo m&aacute;ximo de <strong><span style='font-family:"Arial",sans-serif;'>5 (cinco)&nbsp;Dias &Uacute;teis</span></strong>, conforme consta no edital, a contar da data de <strong><span style='font-family:"Arial",sans-serif;'>${data_inicio_formatada}</span></strong> e findar-se em <strong><span style='font-family:"Arial",sans-serif;'>${data_fim_formatada}</span></strong></span></span></p>`;

            const outputDiv = document.getElementById('output_email');
            const emailGeradoDiv = document.getElementById('email_gerado');
            const tituloEmail = document.getElementById('titulo_email');
            const textotitulo =  `Convocação para Assinatura: ${objeto_termo} ${modalidade_licitacao}`;
            tituloEmail.innerHTML =  `<h2><span style='font-size:16px;font-family:"Arial",sans-serif;color:black;'>Convocação para Assinatura: ${objeto_termo} - ${modalidade_licitacao}</span></h2>`;;
salvarDadosGerais({
    objeto_termo,
    modalidade_licitacao,
    numero_processo,
    data_inicio,
    data_fim,
    data_inicio_formatada,
    data_fim_formatada,
    numeroDiasUteis
});
            
           // const link = `<a href="mailto:?subject=${textotitulo}&body=${emailTexto}">tell a friend</a>`;
            outputDiv.innerHTML = emailTexto;
            //outputDiv.innerHTML = link;
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
            if (!objeto_termo || !modalidade_licitacao || !numero_processo || !data_inicio || !data_fim) {
                alert("Os campos dos Formulários estão Vazios!.");
            }
        }

        function selecionarEmail() {
            
            const emailDiv = document.getElementById('output_email');
            const range = document.createRange();
            range.selectNode(emailDiv);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
             if (!objeto_termo || !modalidade_licitacao || !numero_processo || !data_inicio || !data_fim) {
                alert("Os campos dos Formulários estão Vazios!.");
            }   
        }

        function calcularDiasUteis(inicio, fim) {
            let diasUteis = 0;
            let data = new Date(inicio);
            while (data <= fim) {
                const diaSemana = data.getDay();
                if (diaSemana !== 0 && diaSemana !== 6) {
                    diasUteis++;
                }
                data.setDate(data.getDate() + 1);
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

           function converterParaFormatoBrasileiro(dataString) {
            const partes = dataString.split('-');
            if (partes.length === 3) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
            return dataString; // Retorna a string original se não estiver no formato esperado
        }

        function converterDataParaObjeto(dataString) {
            return new Date(dataString);
        }

function salvarDadosGerais(dados) {
    let lista = JSON.parse(localStorage.getItem("emailsGerais")) || [];

    dados.id = Date.now(); // identificador único
    lista.push(dados);

    localStorage.setItem("emailsGerais", JSON.stringify(lista));
}