window.onload = async function() {
    // VINCULAR BOTÕES
    document.getElementById('GerarMail').addEventListener('click', gerarEmail);
    document.getElementById('copiar_email').addEventListener('click', copiarEmail);
    document.getElementById('selecionar_email').addEventListener('click', selecionarEmail);

    const dataInicioInput = document.getElementById("data_inicio_1");
    const dataFimAutomaticaInput = document.getElementById("data_fim_automatica");
    const dataFimManualCheck = document.getElementById("data_fim_manual_check");
    const dataFimManualInput = document.getElementById("data_fim_manual");

    // Carrega os feriados do Chrome Storage assim que a página abre
    const listaFeriados = await getFeriadosDoStorage();

    // Define a data de início como a data atual
    const hoje = new Date();
    const formatarParaInput = (data) => {
        const z = (n) => (n < 10 ? '0' : '') + n;
        return `${data.getFullYear()}-${z(data.getMonth() + 1)}-${z(data.getDate())}`;
    };
    
    dataInicioInput.value = formatarParaInput(hoje);

    // Calcula a data de fim como exatos 5 dias úteis
    let diasUteis = 0;
    // Setamos 12h00 para evitar bugs de Horário de Verão no JavaScript
    let dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0);
    
    while (diasUteis < 5) {
        dataFim.setDate(dataFim.getDate() + 1);
        const diaSemana = dataFim.getDay();
        const isoDate = formatarParaInput(dataFim);
        const isFeriado = listaFeriados.some(f => f.data === isoDate);
        
        if (diaSemana !== 0 && diaSemana !== 6 && !isFeriado) {
            diasUteis++;
        }
    }
    
    const dataFimFormatadaInput = formatarParaInput(dataFim);
    dataFimAutomaticaInput.value = dataFimFormatadaInput;

    dataFimManualCheck.addEventListener("change", function() {
        if (this.checked) {
            dataFimManualInput.classList.remove("hidden");
            dataFimAutomaticaInput.value = ""; 
            dataFimManualInput.setAttribute("required", "");
        } else {
            dataFimManualInput.classList.add("hidden");
            dataFimManualInput.value = dataFimFormatadaInput; 
            dataFimManualInput.removeAttribute("required");
        }
    });
};

async function gerarEmail() {
    const objeto_termo = document.getElementById('objeto_termo_1').value;
    const modalidade_licitacao = document.getElementById('modalidade_licitacao_1').value;
    const numero_processo = document.getElementById('numero_processo_1').value;
    const data_inicio = document.getElementById('data_inicio_1').value;
    const data_fim_automatica = document.getElementById('data_fim_automatica').value;
    const data_fim_manual_check = document.getElementById('data_fim_manual_check').checked;
    const data_fim_manual = document.getElementById('data_fim_manual').value;
        
    let data_fim = data_fim_automatica; // Valor padrão

    let data_inicio_formatada = converterParaFormatoBrasileiro(data_inicio);
    let data_fim_formatada = converterParaFormatoBrasileiro(data_fim);

    // --- VERIFICAÇÃO DE FERIADOS ---
    const listaFeriados = await getFeriadosDoStorage();
    
    let numeroDiasUteis = 5; // Valor padrão

    if (data_fim_manual_check) {
        if (!data_fim_manual) {
            alert("Por favor, preencha a data de fim manualmente.");
            return;
        }
        data_fim = data_fim_manual; 

        // Calcula o número de dias úteis EXCLUINDO feriados e começando a contar do dia seguinte
        const inicio = converterDataParaObjeto(data_inicio);
        const fim = converterDataParaObjeto(data_fim);
        numeroDiasUteis = calcularDiasUteis(inicio, fim, listaFeriados);
        data_fim_formatada = converterParaFormatoBrasileiro(data_fim);
        data_inicio_formatada = converterParaFormatoBrasileiro(data_inicio);
    }

    if (!objeto_termo || !modalidade_licitacao || !numero_processo || !data_inicio || !data_fim) {
        alert("Os campos dos Formulários estão Vazios!.");
        return; 
    }

    const feriadosEncontrados = verificarFeriadosNoPeriodo(data_inicio, data_fim, listaFeriados);
    let mensagemFeriadoHtml = gerarTextoFeriados(feriadosEncontrados, 'Arial', '15px');

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
    <p style='margin-right:0cm;margin-left:0cm;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;margin-bottom:18.0pt;'><span style='font-family:"Arial",sans-serif;color:black;'>${saudacao}</span></p>
    <p style='margin-right:0cm;margin-left:0cm;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;margin-bottom:18.0pt;text-align:justify;text-indent:35.45pt;'><span style='font-family:"Arial",sans-serif;color:black;'>Informamos&nbsp;que se encontra a disposi&ccedil;&atilde;o para assinatura&nbsp;</span><span style='font-family:"Arial",sans-serif;'>o&nbsp;<strong>${objeto_termo}</strong>, oriundo de procedimento&nbsp;licitat&oacute;rio, na modalidade <strong> ${modalidade_licitacao}</strong>, no processo <strong>n&ordm;. ${numero_processo}</strong>.</span></p>
    <p style='margin-right:0cm;margin-left:0cm;font-size:15px;font-family:"Calibri",sans-serif;margin:0cm;margin-bottom:18.0pt;text-align:justify;'><span style='font-family:"Arial",sans-serif;color:black;'>&nbsp;Por gentileza, confirmar possuir <strong><u><span style='font-family:"Arial",sans-serif;'>Certificado de Assinatura Digital e-CPF</span></u></strong> e/ou solicitar em resposta deste e-mail, para que seja disponibilizado o link para a <strong>Assinatura Digital</strong><span style="background:white;"> no prazo m&aacute;ximo de <strong><span style='font-family:"Arial",sans-serif;'>${numeroDiasUteis} (${converterNumeroParaTexto(numeroDiasUteis)})&nbsp;Dias &Uacute;teis</span></strong>, conforme consta no edital, a contar da data de <strong><span style='font-family:"Arial",sans-serif;'>${data_inicio_formatada}</span></strong> e findar-se em <strong><span style='font-family:"Arial",sans-serif;'>${data_fim_formatada}</span></strong></span></span></p>
    ${mensagemFeriadoHtml}`;

    const outputDiv = document.getElementById('output_email');
    const emailGeradoDiv = document.getElementById('email_gerado');
    const tituloEmail = document.getElementById('titulo_email');
    
    tituloEmail.innerHTML = `<h2><span style='font-size:16px;font-family:"Arial",sans-serif;color:black;'>Convocação para Assinatura: ${objeto_termo} - ${modalidade_licitacao}</span></h2>`;
    
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

function calcularDiasUteis(inicio, fim, listaFeriados) {
    // Definimos às 12h00 para evitar conflito de Horário de Verão que "come" um dia
    let dataAtual = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), 12, 0, 0);
    let dataFim = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 12, 0, 0);
    let diasUteis = 0;

    if (dataAtual >= dataFim) return 0;
    
    // Inicia a contagem no dia seguinte ao "data_inicio"
    dataAtual.setDate(dataAtual.getDate() + 1);

    while (dataAtual <= dataFim) {
        const diaSemana = dataAtual.getDay();
        const z = (n) => (n < 10 ? '0' : '') + n;
        const isoDate = `${dataAtual.getFullYear()}-${z(dataAtual.getMonth() + 1)}-${z(dataAtual.getDate())}`;
        
        const isFeriado = listaFeriados.some(f => f.data === isoDate);

        if (diaSemana !== 0 && diaSemana !== 6 && !isFeriado) {
            diasUteis++;
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
    return Math.max(diasUteis, 0);
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
    return dataString;
}

function converterDataParaObjeto(dataString) {
    const partes = dataString.split('-');
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    return new Date(ano, mes, dia, 12, 0, 0); // Sempre 12h00
}

function salvarDadosGerais(dados) {
    let lista = JSON.parse(localStorage.getItem("emailsGerais")) || [];
    dados.id = Date.now();
    lista.push(dados);
    localStorage.setItem("emailsGerais", JSON.stringify(lista));
}

document.getElementById('EnviarEmailFormatado').addEventListener('click', enviarEmailFormatado);

async function enviarEmailFormatado() {
    const emailGeradoDiv = document.getElementById('email_gerado');
    if (emailGeradoDiv.classList.contains('hidden')) {
        alert("Por favor, clique em 'Gerar E-mail' antes de enviar.");
        return;
    }

    const tituloTexto = document.getElementById('titulo_email').innerText;
    const htmlContent = document.getElementById('output_email').innerHTML;
    const textContent = document.getElementById('output_email').innerText;
    const emailsCopiaInput = document.getElementById('emails_copia');
    const emailsCopia = emailsCopiaInput ? emailsCopiaInput.value : "";

    try {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([textContent], { type: 'text/plain' });

        const item = new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
        });
        await navigator.clipboard.write([item]);

        const ccEncoded = encodeURIComponent(emailsCopia.trim());
        const subjectEncoded = encodeURIComponent(tituloTexto.trim());
        const mailtoLink = `mailto:?cc=${ccEncoded}&subject=${subjectEncoded}`;

        window.location.href = mailtoLink;

        setTimeout(() => {
            alert(" O e-mail formatado foi copiado!\n\nQuando a janela do e-mail abrir, cole com 'Ctrl + V'.");
        }, 400);

    } catch (err) {
        console.error('Erro ao copiar HTML formatado:', err);
        alert('Não foi possível copiar o e-mail formatado. Verifique as permissões do navegador.');
    }
}

// ==========================================
// FUNÇÕES AUXILIARES PARA VERIFICAR FERIADOS
// ==========================================

// Extrator recursivo que vai vasculhar o cache atrás da propriedade "date" ou "data" em qualquer formato
function vasculharDatas(obj) {
    let datas = [];
    if (!obj) return datas;
    if (typeof obj !== 'object') return datas;
    
    if (Array.isArray(obj)) {
        obj.forEach(item => datas = datas.concat(vasculharDatas(item)));
        return datas;
    }
    
    if (obj.date || obj.data) {
        datas.push(obj);
    } else {
        Object.values(obj).forEach(val => {
            if (typeof val === 'object') {
                datas = datas.concat(vasculharDatas(val));
            }
        });
    }
    return datas;
}

async function getFeriadosDoStorage() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['gpd_calendario_feriados_cache_v1', 'gpd_calendario_feriados_municipais_v1'], (result) => {
                const processarCarga = (dadosBrutos) => {
                    let obj = dadosBrutos;
                    if (typeof dadosBrutos === 'string') {
                        try { obj = JSON.parse(dadosBrutos); } catch (e) { return []; }
                    }
                    
                    const eventosEncontrados = vasculharDatas(obj);
                    return eventosEncontrados.map(item => {
                        let dataStr = item.date || item.data;
                        if (typeof dataStr === 'string' && dataStr.length >= 10) {
                            dataStr = dataStr.substring(0, 10);
                        } else {
                            return null;
                        }
                        
                        let jsonStr = JSON.stringify(item).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                        let isPF = jsonStr.includes('facultativo');
                        let isFeriado = jsonStr.includes('feriado') || !isPF;
                        
                        return { data: dataStr, isPF: isPF, isFeriado: isFeriado };
                    }).filter(d => d !== null);
                };
                
                const estFed = processarCarga(result.gpd_calendario_feriados_cache_v1);
                const mun = processarCarga(result.gpd_calendario_feriados_municipais_v1);
                resolve([...estFed, ...mun]); 
            });
        } else {
            resolve([]); 
        }
    });
}

function verificarFeriadosNoPeriodo(inicioStr, fimStr, listaFeriados) {
    let feriadosEncontrados = [];
    
    const startParts = inicioStr.split('-');
    let dataAtual = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 12, 0, 0);
    
    const endParts = fimStr.split('-');
    let dataFimDate = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 12, 0, 0);

    while (dataAtual <= dataFimDate) {
        const z = (n) => (n < 10 ? '0' : '') + n;
        let isoDate = `${dataAtual.getFullYear()}-${z(dataAtual.getMonth() + 1)}-${z(dataAtual.getDate())}`;
        
        let eventosDoDia = listaFeriados.filter(f => f.data === isoDate);
        
        if (eventosDoDia.length > 0) {
            feriadosEncontrados.push({
                dataObj: new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate(), 12, 0, 0),
                hasPF: eventosDoDia.some(e => e.isPF),
                hasFeriado: eventosDoDia.some(e => e.isFeriado),
                ano: dataAtual.getFullYear()
            });
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
    return feriadosEncontrados;
}

function gerarTextoFeriados(feriadosEncontrados, fonte, tamanhoFonte) {
    if (feriadosEncontrados.length === 0) return "";

    let formatadas = feriadosEncontrados.map(f => {
        let dia = String(f.dataObj.getDate()).padStart(2, '0');
        let mes = String(f.dataObj.getMonth() + 1).padStart(2, '0');
        let ano = f.dataObj.getFullYear();
        return { dia, mesAno: `${mes}/${ano}`, original: `${dia}/${mes}/${ano}` };
    });

    let textoDias = "";
    if (formatadas.length === 1) {
        textoDias = `no dia ${formatadas[0].original}`;
    } else {
        let mesmoMesAno = formatadas.every(f => f.mesAno === formatadas[0].mesAno);
        if (mesmoMesAno) {
            let dias = formatadas.map(f => f.dia);
            let ultimoDia = dias.pop();
            textoDias = `nos dias ${dias.join(', ')} e ${ultimoDia}/${formatadas[0].mesAno}`;
        } else {
            let originais = formatadas.map(f => f.original);
            let ultimaData = originais.pop();
            textoDias = `nos dias ${originais.join(', ')} e ${ultimaData}`;
        }
    }

    let temFeriado = feriadosEncontrados.some(f => f.hasFeriado);
    let temPF = feriadosEncontrados.some(f => f.hasPF);
    let anosPF = [...new Set(feriadosEncontrados.filter(f => f.hasPF).map(f => f.ano))];

    let motivos = [];
    let leis = [];

    if (temFeriado) {
        motivos.push("feriado");
        leis.push("Lei Estadual nº. 9.497/1997");
    }
    if (temPF) {
        motivos.push("ponto facultativo");
        if (anosPF.includes(2026)) leis.push("Decreto Municipal nº. 8.286/2025");
        if (anosPF.includes(2027)) leis.push("Decreto Municipal nº. 8.511/2026");
    }

    let textoMotivo = motivos.join(" e ");
    let textoLei = leis.join(" e ");
    
    let margemEstilo = fonte === 'Arial' 
        ? "margin-right:0cm;margin-left:0cm;margin:0cm;margin-top:15.0pt;margin-bottom:18.0pt;text-align:justify;" 
        : "margin:0cm;margin-bottom:.0001pt; margin-top: 15px;";
        
    let familyFont = fonte === 'Arial' ? '"Arial",sans-serif' : '"Century Gothic",sans-serif';
    let pFamilyFont = fonte === 'Arial' ? '"Calibri",sans-serif' : '"Century Gothic",sans-serif';

    return `
    <p style='${margemEstilo}font-size:${tamanhoFonte};font-family:${pFamilyFont};'>
        <strong><u><span style='font-size:${tamanhoFonte};font-family:${familyFont};color:red;background:yellow;'>Obs.:</span></u></strong>
        <u style="text-align:start;">
            <span style="font-size:${tamanhoFonte};font-family:${familyFont};color:red;background:yellow;">
                Informo que ${textoDias} não haverá expediente administrativo, em razão do ${textoMotivo}, conforme ${textoLei}.
            </span>
        </u>
    </p>`;
}