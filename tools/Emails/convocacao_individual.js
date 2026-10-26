// Variável global para armazenar o texto gerado
let corpoEmailGlobal = "";
let tituloEmailGlobal = "";

window.onload = async function () {
    // Vincular os botões aos eventos
    document.getElementById('GerarMail').onclick = gerarEmail;
    document.getElementById('btnCopiar').onclick = copiarEmail;
    document.getElementById('btnSelecionar').onclick = selecionarEmail;

    const dataInicioInput = document.getElementById("data_inicio_1");
    const dataFimAutomaticaInput = document.getElementById("data_fim_automatica");
    const dataFimManualCheck = document.getElementById("data_fim_manual_check");
    const dataFimManualInput = document.getElementById("data_fim_manual");

    const dadosGerais = carregarDadosGerais();
    const listaFeriados = await getFeriadosDoStorage();
    
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

        if (dadosGerais.data_inicio && (dadosGerais.data_fim || dadosGerais.data_fim_automatica)) {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0'); 
            const dia = String(hoje.getDate()).padStart(2, '0');

            const dataFormatada = `${ano}-${mes}-${dia}`;
            dataInicioInput.value = dataFormatada;
            dataFimAutomaticaInput.value = dadosGerais.data_fim || dadosGerais.data_fim_automatica;
        } else {
            executarCalculoDataPadrao(dataInicioInput, dataFimAutomaticaInput, listaFeriados);
        }
    } else {
        executarCalculoDataPadrao(dataInicioInput, dataFimAutomaticaInput, listaFeriados);
    }

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

function executarCalculoDataPadrao(inputInicio, inputFim, listaFeriados) {
    const hoje = new Date();
    const formatarParaInput = (data) => {
        const z = (n) => (n < 10 ? '0' : '') + n;
        return `${data.getFullYear()}-${z(data.getMonth() + 1)}-${z(data.getDate())}`;
    };

    inputInicio.value = formatarParaInput(hoje);

    let diasAdicionados = 0;
    // Setamos 12h00 para evitar conflitos de Horário de Verão no JavaScript
    let dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12, 0, 0);
    
    // Conta exatamente 5 dias úteis, pulando feriados
    while (diasAdicionados < 5) {
        dataFim.setDate(dataFim.getDate() + 1);
        const diaSemana = dataFim.getDay();
        const isoDate = formatarParaInput(dataFim);
        const isFeriado = listaFeriados.some(f => f.data === isoDate);
        
        if (diaSemana !== 0 && diaSemana !== 6 && !isFeriado) {
            diasAdicionados++;
        }
    }
    
    inputFim.value = formatarParaInput(dataFim);
}

async function gerarEmail() {
    const objeto_termo = document.getElementById('objeto_termo_1').value;
    const tipo_termo = document.getElementById('tipo_termo').value;
    const modalidade_licitacaomod = document.getElementById('modalidade_licitacao_1').value;
    const modalidade_licitacaonum = document.getElementById('modalidade_licitacao_2').value;
    const numero_processo = document.getElementById('numero_processo_1').value;
    const nome_representante1 = document.getElementById('nome_representante1').value;
    const nome_representante2 = document.getElementById('nome_representante2').value;
    const link_assinatura1 = document.getElementById('link_assinatura1').value;
    const link_assinatura2 = document.getElementById('link_assinatura2').value;
    const data_inicio_input = document.getElementById('data_inicio_1').value;
    const data_fim_automatica_input = document.getElementById('data_fim_automatica').value;
    const data_fim_manual_check = document.getElementById('data_fim_manual_check').checked;
    const data_fim_manual_input = document.getElementById('data_fim_manual').value;
    const incluirTCN = document.getElementById('incluir_tcn').checked;

    let data_fim = data_fim_automatica_input; 
    let numeroDiasUteis = 5; 
    let data_inicio_formatada = converterParaFormatoBrasileiro(data_inicio_input);
    let data_fim_formatada = converterParaFormatoBrasileiro(data_fim);

    const listaFeriados = await getFeriadosDoStorage();

    if (data_fim_manual_check) {
        if (!data_fim_manual_input) {
            alert("Por favor, preencha a data de fim manualmente.");
            return;
        }
        data_fim = data_fim_manual_input;
        data_fim_formatada = converterParaFormatoBrasileiro(data_fim);
    }

    const inicio = converterDataParaObjeto(data_inicio_input);
    const fim = converterDataParaObjeto(data_fim);
    numeroDiasUteis = calcularDiasUteis(inicio, fim, listaFeriados);

    if (!objeto_termo || !modalidade_licitacaonum || !numero_processo || !data_inicio_input || !data_fim || !nome_representante1 || !link_assinatura1) {
        alert("Os Campos Estão Vazios!!!");
        return; 
    }

    const feriadosEncontrados = verificarFeriadosNoPeriodo(data_inicio_input, data_fim, listaFeriados);
    let mensagemFeriadoHtml = gerarTextoFeriados(feriadosEncontrados, 'Century Gothic', '13px');

    const now = new Date();
    const horaSaoPaulo = now.getHours();
    let saudacao = "Bom dia,";
    if (horaSaoPaulo >= 12 && horaSaoPaulo < 18) {
        saudacao = "Boa tarde,";
    } else if (horaSaoPaulo >= 18) {
        saudacao = "Boa noite,";
    }
    
    const sufixoDias = numeroDiasUteis === 1 ? "dia útil" : "dias úteis";
    let emailTexto = `
    <div style='font-family: "Century Gothic", sans-serif; font-size: 13px; color: black; line-height: 1.25;'>
        <style>
            p, ul, ol { margin-top: 0; margin-bottom: 6px; }
            li { margin-bottom: 3px; }
        </style>

        <p>${saudacao}</p>
        
        <p>
            Rogo assinatura digital do(a) senhor(a) <strong>${nome_representante1}</strong>${nome_representante2 ? ` e do(a) senhor(a) <strong>${nome_representante2}</strong>` : ''}, no <strong>${tipo_termo} ${objeto_termo}</strong>${incluirTCN ? ` e no <strong><span style="color: black;">ANEXO LC-01 - TERMO DE CIÊNCIA E DE NOTIFICAÇÃO</span></strong>` : ''}, decorrente de procedimento licitatório, na modalidade ${modalidade_licitacaomod} <strong>${modalidade_licitacaonum}</strong>, Processo Administrativo nº. <strong>${numero_processo}</strong>, por meio dos links:
        </p>
        
        <p style="margin-bottom: 2px;"><a href="${link_assinatura1}">${link_assinatura1}</a></p>
        ${incluirTCN && link_assinatura2 ? `<p style="margin-bottom: 8px;"><a href="${link_assinatura2}">${link_assinatura2}</a></p>` : ''}
        
        <ul style="margin-left: 18px; padding-left: 0;">
            <li>
            Clique nos <em>links</em> acima para acessar o Assinador Digital e escolha uma das opções abaixo:
            <ol type="a" style="margin-left: 18px; padding-left: 0; margin-top: 4px;">
                <li>
                Para enviar via <a href="https://www.gov.br/governodigital/pt-br/identidade/assinatura-eletronica" style="font-family: Arial, sans-serif;">GOV.BR</a>, basta clicar em <strong style="color: #0070C0;">VERSÃO DE IMPRESSÃO</strong>, fazer o <em>download</em> dos arquivos, realizar a assinatura digital de cada um utilizando o portal GOV.BR e nos encaminhar os documentos assinados em resposta a este <em>e-mail</em>.
                </li>
                <li>
                Para controlar com e-CPF, clique em <strong style="color: #2A8232;">ACRESCENTAR ASSINATURA</strong> e siga as instruções na tela.
                </li>
            </ol>
            </li>
        </ul>
        
        <p style="margin-top: 10px;">
            PRAZO PARA RESTITUIÇÃO: <span style="color: red;">${data_fim_formatada} (${converterNumeroParaTexto(numeroDiasUteis)} ${sufixoDias})</span>.
        </p>
        
        <p style="color: red; margin-bottom: 2px;"><strong>ATENÇÃO:</strong></p>
        
        <ul style="color: red; margin-left: 18px; padding-left: 0;">
            <li>
            Em razão do cumprimento das diretrizes da LGPD, os ajustes agora são fracionados <strong style="color: #002060; font-size: 15px;">em dois documentos</strong>: um com o ajuste, outro com o termo de ciência e notificação, exigência do Tribunal de Contas do Estado de São Paulo.
            </li>
            <li>
            Solicite que seja encaminhada uma cópia simples dos seguintes documentos:
            <ul style="margin-left: 18px; padding-left: 0; margin-top: 3px;">
                <li><strong>Procuração</strong> (se necessário).</li>
                <li><strong>Documentos de Identidade</strong> (RG, CNH, etc...)</li>
            </ul>
            </li>
        </ul>
        
        ${mensagemFeriadoHtml}
        
        <p style="margin-top: 10px;">Coloco-me à disposição para mais esclarecimentos.</p>
    </div>
    `;
    
    const outputDiv = document.getElementById('output_email');
    const emailGeradoDiv = document.getElementById('email_gerado');
    const tituloEmail = document.getElementById('titulo_email');
    const processolimpo = numero_processo.replace(/[,.;]/g, "");
    
    tituloEmail.innerHTML = `<h2><span style='font-size:16px;font-family:"Arial",sans-serif;color:black;'>Convocação para Assinatura: ${tipo_termo} ${objeto_termo} - ${modalidade_licitacaomod} ${modalidade_licitacaonum} - Processo ${numero_processo}</span></h2>`;
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
    return new Date(ano, mes, dia, 12, 0, 0);
}

function carregarDadosGerais() {
    const dados = localStorage.getItem("dadosEmailSelecionado");
    return dados ? JSON.parse(dados) : null;
}

// ==========================================
// FUNÇÕES AUXILIARES PARA VERIFICAR FERIADOS
// ==========================================
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