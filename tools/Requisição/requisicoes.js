if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "../../js/pdf.worker.min.js";
}

const drop = document.getElementById("drop");
const input = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const tabelaRodape = document.getElementById("tabelaRodape");
const statusDiv = document.getElementById("status");
const btnExportar = document.getElementById("exportar");
const btnLimpar = document.getElementById("limpar");
const badgeArquivos = document.getElementById("badgeArquivos");
const listaArquivosDiv = document.getElementById("listaArquivos");

let itensBrutos = [];
let arquivosProcessados = new Set();

drop.addEventListener("dragover", e => {
    e.preventDefault();
    drop.style.background = "#eef5ff";
});

drop.addEventListener("dragleave", () => {
    drop.style.background = "#f8fbff";
});

drop.addEventListener("drop", async e => {
    e.preventDefault();
    drop.style.background = "#f8fbff";
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));

    if (files.length === 0) {
        alert("Envie apenas arquivos PDF.");
        return;
    }
    await processarLotePDFs(files);
});

drop.onclick = () => input.click();

input.onchange = async e => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        await processarLotePDFs(files);
    }
    input.value = "";
};

btnLimpar.onclick = () => {
    itensBrutos = [];
    arquivosProcessados.clear();
    listaArquivosDiv.innerHTML = "";
    preview.innerHTML = "";
    tabelaRodape.innerHTML = "";
    badgeArquivos.innerText = "0 PDFs carregados";
    statusDiv.className = "alert alert-secondary mt-3";
    statusDiv.innerText = "Aguardando arquivos...";
    btnExportar.disabled = true;
};

async function processarLotePDFs(files) {
    statusDiv.className = "alert alert-info mt-3";
    statusDiv.innerText = `Analisando ${files.length} arquivo(s)...`;

    for (const file of files) {
        if (arquivosProcessados.has(file.name)) continue;

        try {
            let extracao = await processarPDFEspacial(file);

            if (extracao.semTexto) {
                console.log(`[${file.name}] PDF sem texto selecionável. Iniciando OCR...`);
                extracao = await processarPDFComOCR(file);
            }

            if (extracao.itens.length > 0) {
                itensBrutos.push(...extracao.itens);
                arquivosProcessados.add(file.name);
                adicionarBadgeArquivo(file.name, extracao.numeroReq);
            } else {
                alert(`Nenhum item encontrado em "${file.name}". Verifique o console (F12).`);
            }
        } catch (erro) {
            console.error("Erro ao ler PDF:", erro);
            alert(`Erro ao processar "${file.name}": ${erro.message}`);
        }
    }

    atualizarInterface();
}

// =========================================================================
// MODO 1: LEITURA NATIVA ESPACIAL (PDF COM TEXTO SELECIONÁVEL)
// =========================================================================
async function processarPDFEspacial(file) {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(buffer).promise;

    let numeroReq = file.name;
    let totalTokens = 0;
    const itensEncontrados = [];
    const regexCodigo = /\b(\d{3}\.\d{5}\.\d{4}\s*[-–—]\s*\d{2})\b/;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        const tokens = content.items
            .map(item => ({
                str: item.str.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim(),
                x: item.transform[4],
                y: item.transform[5]
            }))
            .filter(item => item.str.length > 0);

        totalTokens += tokens.length;
        if (tokens.length === 0) continue;

        const textoBrutoPagina = tokens.map(t => t.str).join(" ");
        const isEmpenhamentoSIAM = /SOLICITACAO DE EMPENHAMENTO|CN-SIAM|CODIGO OBJETO/i.test(textoBrutoPagina);

        if (isEmpenhamentoSIAM) {
            const matchEmp = textoBrutoPagina.match(/Nro\.\s*EMPENHO\s*(\d+)/i) ||
                             textoBrutoPagina.match(/Reserva:\s*(\d+)/i);
            if (matchEmp) numeroReq = `Emp. ${matchEmp[1]}`;

            const itensSIAM = extrairItensSIAMEspacial(tokens, regexCodigo, numeroReq);
            itensEncontrados.push(...itensSIAM);
            continue;
        }

        // --- LAYOUT PADRÃO: REQUISIÇÃO DE SERVIÇO / COMPRA ---
        const matchReq = textoBrutoPagina.match(/REQUISIÇÃO DE (?:SERVIÇO|COMPRA)\s*N[°º.]*:\s*(\d+\s*\/\s*\d{4})/i);
        if (matchReq) numeroReq = matchReq[1].replace(/\s+/g, "");

        const ancoras = tokens
            .filter(t => regexCodigo.test(t.str))
            .map(t => {
                const rawCod = t.str.match(regexCodigo)[1];
                return {
                    rawCodigo: rawCod,
                    codigo: rawCod.replace(/\s+/g, "").replace(/[–—]/g, "-"),
                    x: t.x,
                    y: t.y
                };
            })
            .sort((a, b) => b.y - a.y);

        if (ancoras.length === 0) continue;

        const ultimoY = ancoras[ancoras.length - 1].y;
        const tokenRodape = tokens.find(t =>
            /^(EVERTON SANTOS|DIRETOR DO DPTO|A DESPESA DEVERÁ|Total\s*R\$)/i.test(t.str) &&
            t.y < ultimoY
        );
        const yLimiteInferior = tokenRodape ? tokenRodape.y + 2 : ultimoY - 45;

        for (let i = 0; i < ancoras.length; i++) {
            const atual = ancoras[i];
            const proximo = ancoras[i + 1];

            const yTopo = atual.y + 6;
            const yBase = proximo ? proximo.y + 6 : yLimiteInferior;

            const tokensDescricao = tokens
                .filter(t => t.y <= yTopo && t.y > yBase && t.x >= atual.x - 5 && t.x < 330)
                .sort((a, b) => {
                    if (Math.abs(a.y - b.y) > 3) return b.y - a.y;
                    return a.x - b.x;
                });

            const tokensValores = tokens
                .filter(t => t.y <= yTopo && t.y > yBase && t.x >= 330)
                .sort((a, b) => {
                    if (Math.abs(a.x - b.x) > 15) return a.x - b.x;
                    return b.y - a.y;
                });

            const linhaReconstruida = [...tokensDescricao, ...tokensValores].map(t => t.str).join(" ");
            const parsed = extrairCamposDoBloco(linhaReconstruida, atual.codigo, numeroReq);
            if (parsed) itensEncontrados.push(parsed);
        }
    }

    return {
        semTexto: totalTokens === 0,
        numeroReq,
        itens: itensEncontrados
    };
}

// =========================================================================
// PARSER ESPACIAL PARA SOLICITAÇÃO DE EMPENHAMENTO (CN-SIAM / CONAM)
// =========================================================================
function extrairItensSIAMEspacial(tokens, regexCodigo, numeroReq) {
    const itens = [];
    const ancoras = tokens
        .filter(t => regexCodigo.test(t.str))
        .map(t => {
            const rawCod = t.str.match(regexCodigo)[1];
            return {
                codigo: rawCod.replace(/\s+/g, "").replace(/[–—]/g, "-"),
                x: t.x,
                y: t.y
            };
        })
        .sort((a, b) => b.y - a.y);

    if (ancoras.length === 0) return itens;

    const ultimoY = ancoras[ancoras.length - 1].y;
    const tokenRodape = tokens.find(t =>
        /^(Total do Empenho|Documento assinado|Reserva:)/i.test(t.str) && t.y < ultimoY
    );
    const yLimiteInferior = tokenRodape ? tokenRodape.y + 2 : ultimoY - 40;

    for (let i = 0; i < ancoras.length; i++) {
        const atual = ancoras[i];
        const proximo = ancoras[i + 1];

        const yTopo = atual.y + 8;
        const yBase = proximo ? proximo.y + 8 : yLimiteInferior;

        const tokensBloco = tokens.filter(t => t.y <= yTopo && t.y > yBase);

        // 1. VALOR TOTAL: fica na faixa superior do bloco (próximo ao Y do código), à direita
        const tokensFaixaValor = tokensBloco
            .filter(t => Math.abs(t.y - atual.y) <= 6 && t.x > atual.x)
            .sort((a, b) => a.x - b.x);

        let valorTotal = 0;
        for (const t of tokensFaixaValor) {
            const mVal = t.str.match(/\b([\d.]+,\d{2})\b/);
            if (mVal) {
                valorTotal = numeroBR(mVal[1]);
                break;
            }
        }

        // 2. QUANTIDADE E UNIDADE: ficam na coluna da esquerda (onde está o Empenho/Modalidade)
        const tokensEsquerda = tokensBloco
            .filter(t => t.x < atual.x - 110)
            .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 4) return b.y - a.y;
                return a.x - b.x;
            });

        const esquerdaLimpa = tokensEsquerda
            .map(t => t.str)
            .join(" ")
            .replace(/\b0\d{7,}\b/g, " ")
            .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, " ")
            .replace(/\bPREGAO\s+ELETRO\s+\d+\b/gi, " ")
            .trim();

        const matchQtdUn = esquerdaLimpa.match(/(?:(\d+(?:[.,]\d+)?)[^\w\d]{0,4})?\b(UN|M2|M|KG|CX|PCT|LT|HR|DIA|MES|CJ|JG|RL|FD|SC|GL|TB|FR|PR|SV)\b/i);
        const quantidade = (matchQtdUn && matchQtdUn[1]) ? numeroBR(matchQtdUn[1]) : 0;
        const unidade = matchQtdUn ? matchQtdUn[2].toUpperCase() : "UN";

        // 3. DESCRIÇÃO: pega a faixa central (a partir da coluna Solicitação até antes do Destino)
    const tokensCentro = tokensBloco
            .filter(t => t.x >= atual.x - 110 && t.x <= atual.x + 210 && Math.abs(t.y - atual.y) > 4)
            .sort((a, b) => {
                if (Math.abs(a.y - b.y) > 4) return b.y - a.y;
                return a.x - b.x;
            });

        let descricao = tokensCentro
            .map(t => t.str)
            .join(" ")
            .replace(regexCodigo, " ")
            .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, " ")
            .replace(/\b\d{6}\s*20\d{2}\b/g, " ")
            .replace(/\b20\d{2}\s*\d{6}\b/g, " ")
            .replace(/\b0\d{5}\b/g, " ")
            .replace(/^\s*(UN|M2|M|KG|CX|PCT|LT|HR|DIA|MES|CJ|JG|RL|FD|SC|GL|TB|FR|PR|SV)\b\s*/i, "")
            .replace(/\b(SEAD|SECTUR|COORDENADOR DE|SEDUC|SESAP|SETRANS|SEOB)\b[\s\S]*$/gi, " ")
            .replace(/[|—_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const valorUnitario = quantidade > 0 ? Number((valorTotal / quantidade).toFixed(4)) : 0;

        if (descricao) {
            itens.push({
                requisicao: numeroReq,
                codigo: atual.codigo,
                descricao,
                unidade,
                quantidade,
                valorUnitario,
                valorTotal
            });
        }
    }

    return itens;
}

// =========================================================================
// MODO 2: OCR LOCAL VIA TESSERACT.JS (PDF ESCANEADO / IMAGEM)
// =========================================================================
async function processarPDFComOCR(file) {
    if (typeof Tesseract === "undefined") {
        throw new Error("Arquivo '../../js/tesseract.min.js' não encontrado.");
    }

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(buffer).promise;

    let numeroReq = file.name;
    let textoOCRCompleto = "";

    const worker = await Tesseract.createWorker("por", 1, {
        workerPath: "../../js/worker.min.js",
        corePath: "../../js/tesseract-core-simd.wasm.js",
        langPath: "../../js",
        workerBlobURL: false
    });

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        statusDiv.innerText = `Lendo imagem via OCR: "${file.name}" (Página ${pageNum}/${pdf.numPages})...`;

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 3.0 });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Melhora contraste para evitar que linhas da tabela apaguem dígitos pequenos
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const val = lum < 195 ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);

        const { data: { text } } = await worker.recognize(canvas);

        if (!/Verificação de assinatura/i.test(text) || /[0O]{3}\.[0O]{5}\.\d{4}\s*[-–—]\s*\d{2}/.test(text)) {
            textoOCRCompleto += text + "\n";
        }
    }

    await worker.terminate();

    const isEmpenhamentoSIAM = /SOLICITACAO DE EMPENHAMENTO|CN-SIAM|CODIGO OBJETO/i.test(textoOCRCompleto);

    if (isEmpenhamentoSIAM) {
        const matchEmp = textoOCRCompleto.match(/Nro\.\s*EMPENHO\s*(\d+)/i) ||
                         textoOCRCompleto.match(/Reserva:\s*(\d+)/i);
        if (matchEmp) numeroReq = `Emp. ${matchEmp[1]}`;

        return {
            semTexto: false,
            numeroReq,
            itens: extrairItensSIAMOCR(textoOCRCompleto, numeroReq)
        };
    }

    const matchReq = textoOCRCompleto.match(/REQUISIÇÃO DE (?:SERVIÇO|COMPRA)\s*N[°º.]*:\s*(\d+\s*\/\s*\d{4})/i);
    if (matchReq) {
        numeroReq = matchReq[1].replace(/\s+/g, "");
    }

    const textoLimpo = textoOCRCompleto
        .replace(/EVERTON SANTOS MENDES[\s\S]*?(?=ITEM\s+DESCRIÇÃO|Verificação de assinatura|$)/gi, "\n")
        .replace(/Total\s*R\$[\s\S]*$/gi, "");

    const fluxo = textoLimpo.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();
    const blocos = fluxo.split(/(?=\b[0O]{3}\.[0O]{5}\.\d{4}\s*[-–—]\s*\d{2}\b)/g);
    const itensEncontrados = [];

    blocos.forEach(bloco => {
        const b = bloco.trim();
        const matchCod = b.match(/^([0O]{3}\.[0O]{5}\.\d{4}\s*[-–—]\s*\d{2})/);
        if (!matchCod) return;

        const codigo = matchCod[1].replace(/O/g, "0").replace(/\s+/g, "").replace(/[–—]/g, "-");
        const semCodigo = b.substring(matchCod[1].length).trim();

        const parsed = extrairCamposDoBloco(semCodigo, codigo, numeroReq);
        if (parsed) {
            itensEncontrados.push(parsed);
        }
    });

    return {
        semTexto: false,
        numeroReq,
        itens: itensEncontrados
    };
}

// =========================================================================
// PARSER OCR PARA SOLICITAÇÃO DE EMPENHAMENTO (CN-SIAM / CONAM)
// =========================================================================
function extrairItensSIAMOCR(textoOCR, numeroReq) {
    const fluxo = textoOCR
        .replace(/Documento assinado digitalmente[\s\S]*$/gi, "")
        .replace(/Total do Empenho[\s\S]*$/gi, "")
        .replace(/[\x00-\x1F\x7F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const blocos = fluxo.split(/(?=\b[0O]{3}\.[0O]{5}\.\d{4}\s*[-–—]\s*\d{2}\b)/g);
    const itens = [];

    blocos.forEach(bloco => {
        const b = bloco.trim();
        const matchCod = b.match(/^([0O]{3}\.[0O]{5}\.\d{4}\s*[-–—]\s*\d{2})/);
        if (!matchCod) return;

        const codigo = matchCod[1].replace(/O/g, "0").replace(/\s+/g, "").replace(/[–—]/g, "-");
        const resto = b.substring(matchCod[1].length).trim();

        // Valor total aparece antes da data de homologação (DD/MM/AAAA)
        const matchVal = resto.match(/\b([\d.]+,\d{2})\s+\d{2}\/\d{2}\/\d{4}/) ||
                         resto.match(/\b([\d.]+,\d{2})\b/);
        const valorTotal = matchVal ? numeroBR(matchVal[1]) : 0;

        // Procura [Quantidade opcional com possível ruído] + [Unidade]
        const matchQtdUn = resto.match(/(?:(\d+(?:[.,]\d+)?)[^\w\d]{0,4})?\b(UN|M2|M|KG|CX|PCT|LT|HR|DIA|MES|CJ|JG|RL|FD|SC|GL|TB|FR|PR|SV)\b/i);
        if (!matchQtdUn) return;

        const quantidade = matchQtdUn[1] ? numeroBR(matchQtdUn[1]) : 0;
        const unidade = matchQtdUn[2].toUpperCase();

        // Tudo após a Unidade, limpando solicitação e destino
        let descricao = resto.substring(resto.indexOf(matchQtdUn[0]) + matchQtdUn[0].length)
            .replace(/\b\d{6}\s*20\d{2}\b/g, " ")
            .replace(/\b20\d{2}\s*\d{6}\b/g, " ")
            .replace(/\b0\d{5}\b/g, " ")
            .replace(/\b20\d{2}\b/g, " ")
            .replace(/\b(SEAD|SECTUR|COORDENADOR DE|SEDUC|SESAP|SETRANS|SEOB)\b[\s\S]*$/gi, " ")
            .replace(/[|—_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const valorUnitario = quantidade > 0 ? Number((valorTotal / quantidade).toFixed(4)) : 0;

        if (descricao) {
            itens.push({
                requisicao: numeroReq,
                codigo,
                descricao,
                unidade,
                quantidade,
                valorUnitario,
                valorTotal
            });
        }
    });

    return itens;
}

// =========================================================================
// PARSER E LIMPEZA DE DESCRIÇÃO (REQUISIÇÃO DE SERVIÇO/COMPRA)
// =========================================================================
function extrairCamposDoBloco(textoBloco, codigo, numeroReq) {
    let limpo = textoBloco
        .replace(/[\x00-\x1F\x7F]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const regexColunasDireita = /\b(UN|M2|M|KG|CX|PCT|LT|HR|DIA|MES|CJ|JG|RL|FD|SC|GL|TB|FR|PR|SV)\b\s+(\d+(?:[.,]\d+)?)\s+(?:R\$\s*)?([\d.,]+)\s+(?:R\$\s*)?([\d.,]+)/i;
    const matchValores = limpo.match(regexColunasDireita);

    if (matchValores) {
        const unidade = matchValores[1].toUpperCase();
        const quantidade = numeroBR(matchValores[2]);
        const valorUnitario = numeroBR(matchValores[3]);
        const valorTotal = numeroBR(matchValores[4]);

        // 1. Pega apenas a parte da descrição (antes da coluna UNID/QUANT/UNIT/TOTAL)
        let descricao = limpo.replace(matchValores[0], " ").trim();

        // 2. Remove o código pelo padrão numérico
        descricao = descricao
            .replace(/\b\d{3}\.\d{5}\.\d{4}\s*[^\w\s]\s*\d{2}\b/g, " ")
            .replace(/\b\d{3}\.\d{5}\.\d{4}\b/g, " ")
            .trim();

        // 3. Remove SOMENTE a justificativa do rodapé sem apagar a descrição do item 15
        descricao = descricao.replace(/\bLOCA[ÇC][ÃA]O DE ESTRUTURA PARA ATENDER[\s\S]*$/gi, " ");
        descricao = descricao.replace(/\bPARA ATENDER O EVENTO[\s\S]*$/gi, " ");

        // 4. Limpa símbolos soltos e espaços duplos
        descricao = descricao
            .replace(/^[-–—\s]+/, "")
            .replace(/[|—_Π]/g, " ")
            .replace(/\bR\$\s*/g, "")
            .replace(/\s+\d{1,3}$/, "")
            .replace(/\s+/g, " ")
            .trim();

        return {
            requisicao: numeroReq,
            codigo,
            descricao,
            unidade,
            quantidade,
            valorUnitario,
            valorTotal
        };
    }

    return null;
}

// =========================================================================
// CONSOLIDAÇÃO, INTERFACE E EXPORTAÇÃO EXCEL
// =========================================================================
function consolidarItens() {
    const mapa = new Map();

    itensBrutos.forEach(item => {
        const chave = item.codigo;

        if (!mapa.has(chave)) {
            mapa.set(chave, {
                codigo: item.codigo,
                descricao: item.descricao,
                unidade: item.unidade,
                quantidade: item.quantidade,
                valorUnitario: item.valorUnitario,
                valorTotal: item.valorTotal
            });
        } else {
            const existente = mapa.get(chave);
            existente.quantidade += item.quantidade;
            existente.valorTotal += item.valorTotal;
        }
    });

    return Array.from(mapa.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

function atualizarInterface() {
    const consolidados = consolidarItens();

    badgeArquivos.innerText = `${arquivosProcessados.size} PDF(s) carregado(s)`;

    if (consolidados.length === 0) {
        statusDiv.className = "alert alert-warning mt-3";
        statusDiv.innerText = "Nenhum item de requisição encontrado nos arquivos enviados.";
        btnExportar.disabled = true;
        return;
    }

    statusDiv.className = "alert alert-success mt-3";
    statusDiv.innerText = `Consolidação concluída: ${arquivosProcessados.size} requisição(ões) • ${itensBrutos.length} lançamentos • ${consolidados.length} itens únicos.`;
    btnExportar.disabled = false;

    let html = "";
    let somaTotalGeral = 0;
    let somaQuantidadeGeral = 0;

    consolidados.forEach((item, index) => {
        somaTotalGeral += item.valorTotal;
        somaQuantidadeGeral += item.quantidade;

        html += `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.descricao}</td>
                <td class="text-center">${item.unidade}</td>
                <td class="text-end">${formatarNumero(item.quantidade)}</td>
                <td class="text-end">${formatarMoeda(item.valorUnitario)}</td>
                <td class="text-end fw-semibold">${formatarMoeda(item.valorTotal)}</td>
            </tr>
        `;
    });

    preview.innerHTML = html;

    tabelaRodape.innerHTML = `
        <tr>
            <td colspan="3" class="text-end">TOTAL CONSOLIDADO:</td>
            <td class="text-end">${formatarNumero(somaQuantidadeGeral)}</td>
            <td></td>
            <td class="text-end text-success">${formatarMoeda(somaTotalGeral)}</td>
        </tr>
    `;
}

function adicionarBadgeArquivo(nomeArquivo, numeroReq) {
    const badge = document.createElement("span");
    badge.className = "badge bg-secondary p-2";
    badge.innerText = `Req. ${numeroReq} (${nomeArquivo})`;
    listaArquivosDiv.appendChild(badge);
}

btnExportar.onclick = () => {
    const consolidados = consolidarItens();
    if (consolidados.length === 0) return;

    let somaTotalGeral = 0;

    const linhasExcel = consolidados.map((item, idx) => {
        somaTotalGeral += item.valorTotal;
        return {
            "Item": idx + 1,
            "Descrição": item.descricao,
            "Unidade": item.unidade,
            "Quantidade Total": item.quantidade,
            "Valor Unitário": item.valorUnitario,
            "Valor Total": item.valorTotal
        };
    });

    linhasExcel.push({
        "Item": "",
        "Descrição": "TOTAL GERAL CONSOLIDADO",
        "Unidade": "",
        "Quantidade Total": "",
        "Valor Unitário": "",
        "Valor Total": somaTotalGeral
    });

    const ws = XLSX.utils.json_to_sheet(linhasExcel);

    ws["!cols"] = [
        { wch: 6 },
        { wch: 55 },
        { wch: 10 },
        { wch: 18 },
        { wch: 16 },
        { wch: 18 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consolidado Requisições");

    const dataHoje = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Requisicoes_Consolidadas_${dataHoje}.xlsx`);
};

function numeroBR(valor) {
    if (typeof valor === "number") return valor;
    let limpo = valor.trim();

    if (/^\d+\.\d{4}$/.test(limpo)) {
        return Number(limpo);
    }

    return Number(
        limpo
            .replace(/\./g, "")
            .replace(",", ".")
    );
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}

function formatarNumero(valor) {
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
    });
}