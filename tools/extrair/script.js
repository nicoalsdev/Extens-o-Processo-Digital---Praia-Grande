const drop = document.getElementById("drop")
const input = document.getElementById("fileInput")
const preview = document.getElementById("preview")
let pregaoNumero = "0000"
let dadosExtraidos = []

drop.addEventListener("dragover", e=>{
    e.preventDefault()
})

drop.addEventListener("drop", e=>{
    e.preventDefault()

    const file = e.dataTransfer.files[0]

    if(!file.name.toLowerCase().endsWith(".pdf")){
        alert("Envie um PDF")
        return
    }

    lerPDF(file)
})
drop.onclick = () => input.click()

input.onchange = e => {
    const file = e.target.files[0]
    lerPDF(file)
}

async function lerPDF(file){

    const buffer = await file.arrayBuffer()

    const pdf = await pdfjsLib.getDocument(buffer).promise

    let textoTotal = ""

    for(let i=1;i<=pdf.numPages;i++){

        const page = await pdf.getPage(i)

        const content = await page.getTextContent()

        let lastY;
        let texto = "";

        content.items.forEach(item => {

            if (lastY === item.transform[5] || !lastY) {
                texto += item.str + " ";
            } else {
                texto += "\n" + item.str + " ";
            }

            lastY = item.transform[5];
        });

        textoTotal += texto + "\n";
    }
    console.log(textoTotal)
    extrairDados(textoTotal)

}


function extrairDados(texto){

    const linhas = texto.split("\n")

    let fornecedorAtual = "NÃO IDENTIFICADO"

    dadosExtraidos = []

    linhas.forEach(linha=>{
        const matchPregao = linha.match(/(?:No\. Modalidade:|PREGAO ELETRONICO No\.?)\s*(\d+)/i)

        if (matchPregao && pregaoNumero === "DESCONHECIDO") {
            pregaoNumero = matchPregao[1].padStart(5,"0")
        }
        const matchForn = linha.match(/FORNECEDOR\s*:\s*(\d+\s+[A-Z0-9 .&\-\/]+)/i);

if (matchForn) {
    // Remove os números do início do nome da empresa e remove espaços extras
    fornecedorAtual = matchForn[1].replace(/^\d+\s+/, "").trim();
    return;
}

        const partes = linha.trim().split(/\s+/)

        if(partes.length>=7 && /^\d{3}\.\d{5}\.\d{4}-\d{2}$/.test(partes[1])){

            const unidade = partes[partes.length-3]
            const quantidade = partes[partes.length-4]
            const valor = partes[partes.length-2]

            const descricao = partes.slice(2,-4).join(" ")

            dadosExtraidos.push({
                fornecedor: fornecedorAtual,
                item: partes[0],
                codigo: partes[1],
                descricao,
                unidade,
                quantidade,
                valor
            })
        }
        gerarSwitchFornecedores();

    })
    const status = document.getElementById("status")

    status.className = "alert alert-success"
    status.innerText = `PDF carregado • ${dadosExtraidos.length} itens`;

    const fornchecks = document.getElementById("forncheck");

    fornchecks.classList.remove('d-none');


    mostrarTabela()

}

function gerarSwitchFornecedores(){

    const container = document.getElementById("listaFornecedores")

    const fornecedores = [...new Set(dadosExtraidos.map(d => d.fornecedor))]

    container.innerHTML = ""

    fornecedores.forEach((forn,i)=>{

        const id = "forn_"+i

        container.innerHTML += `
            
        <div class="form-check form-switch">
            <input class="form-check-input forn-switch"
                   type="checkbox"
                   id="${id}"
                   value="${forn}"
                   checked>

            <label class="form-check-label">
                ${forn}
            </label>
        </div>
            
        `
    })

}

function mostrarTabela(){

    let html = ""

    html += `
    <tr class=''>
    <th>Fornecedor</th>
    <th>Item</th>
    <th>Descrição</th>
    <th>Unidade</th>
    <th>Quantidade</th>
    <th>Valor</th>
    </tr>
        </thead>
    `

    dadosExtraidos.forEach(d=>{

        html += `
        <tr class='text-dark'>
        <td>${d.fornecedor}</td>
        <td>${d.item}</td>
        <td>${d.descricao}</td>
        <td>${d.unidade}</td>
        <td>${d.quantidade}</td>
        <td>${d.valor}</td>
        </tr>
        `
    })

    html += "</table>"

    preview.innerHTML = html
}



document.getElementById("exportar").onclick = async () => {

    // Captura e ordena os fornecedores selecionados em ordem alfabética (localeCompare resolve acentos e numerações corretamente)
    const selecionados = fornecedoresSelecionados().sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

    if(selecionados.length === 0){
        alert("Selecione pelo menos um fornecedor");
        return;
    }

    const agrupar = document.getElementById("agrupar").checked;
    const arquivoUnico = document.getElementById("arquivoUnico").checked;
    const sufixo = agrupar ? "agrupado" : "detalhado";

    // -------------------------------------------------------------
    // MODO 1: EXPORTAR TUDO EM UM ÚNICO ARQUIVO EXCEL
    // -------------------------------------------------------------
    if (arquivoUnico) {
        const wb = XLSX.utils.book_new();
        const linhasMatriz = [];

        selecionados.forEach(fornecedor => {
            let itens = dadosExtraidos.filter(d => d.fornecedor === fornecedor);
            let resultado;

            if (agrupar) {
                const mapa = {};
                itens.forEach(item => {
                    const chave = `${item.codigo}|${item.descricao}|${item.unidade}|${item.valor}`;
                    if (!mapa[chave]) {
                        mapa[chave] = { ...item };
                    } else {
                        mapa[chave].quantidade = numeroBR(mapa[chave].quantidade) + numeroBR(item.quantidade);
                        mapa[chave].item = Math.min(Number(mapa[chave].item), Number(item.item));
                    }
                });
                resultado = Object.values(mapa);
            } else {
                resultado = itens;
            }

            // Título/Cabeçalho do Fornecedor
            linhasMatriz.push([`FORNECEDOR: ${fornecedor}`]);

            // Cabeçalho das Colunas
            linhasMatriz.push(["Item", "Especificação", "Unidade", "Quantidade", "Valor Unitário"]);

            // Linhas de dados
            resultado.forEach(item => {
                linhasMatriz.push([
                    Number(item.item),
                    item.descricao,
                    item.unidade,
                    numeroBR(item.quantidade),
                    numeroBR(item.valor)
                ]);
            });

            // Linhas em branco de espaçamento entre tabelas
            linhasMatriz.push([]);
            linhasMatriz.push([]);
        });

        // Converte a matriz de arrays para a planilha Sheet
        const ws = XLSX.utils.aoa_to_sheet(linhasMatriz);
        XLSX.utils.book_append_sheet(wb, ws, "Quadro Resumo");

        const nomeArquivo = `Quadro Resumo Geral_${sufixo}.xlsx`;
        XLSX.writeFile(wb, nomeArquivo);
        return;
    }

    // -------------------------------------------------------------
    // MODO 2: EXPORTAR EM VÁRIOS ARQUIVOS OU ZIP
    // -------------------------------------------------------------
    const zip = new JSZip();
    let arquivosGerados = 0;

    for (const fornecedor of selecionados) {
        let itens = dadosExtraidos.filter(d => d.fornecedor === fornecedor);
        let resultado;

        if (agrupar) {
            const mapa = {};
            itens.forEach(item => {
                const chave = `${item.codigo}|${item.descricao}|${item.unidade}|${item.valor}`;
                if (!mapa[chave]) {
                    mapa[chave] = { ...item };
                } else {
                    mapa[chave].quantidade = numeroBR(mapa[chave].quantidade) + numeroBR(item.quantidade);
                    mapa[chave].item = Math.min(Number(mapa[chave].item), Number(item.item));
                }
            });
            resultado = Object.values(mapa);
        } else {
            resultado = itens;
        }

        const tabelaFinal = resultado.map(item => ({
            Item: Number(item.item),
            Especificação: item.descricao,
            Unidade: item.unidade,
            Quantidade: numeroBR(item.quantidade),
            "Valor Unitário": numeroBR(item.valor)
        }));

        const ws = XLSX.utils.json_to_sheet(tabelaFinal);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "Itens");

        const nomeLimpo = fornecedor.replace(/[\\/*?:"<>|]/g, "");
        const nomeArquivo = `Quadro Resumo ${nomeLimpo}_${sufixo}.xlsx`;

        const excelBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array"
        });

        zip.file(nomeArquivo, excelBuffer);
        arquivosGerados++;
    }

    if (arquivosGerados === 1) {
        const zipContent = await zip.generateAsync({ type: "blob" });
        const file = Object.keys(zip.files)[0];

        const blob = zip.files[file].async("blob");

        blob.then(b => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(b);
            link.download = file;
            link.click();
        });

        return;
    }

    const conteudo = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(conteudo);
    link.download = `Quadros_Resumo_${pregaoNumero}.zip`;
    link.click();
};

function numeroBR(valor){

    if(typeof valor === "number") return valor

        return Number(
            valor
        .replace(/\./g,"")   // remove separador milhar
        .replace(",",".")    // vírgula vira ponto
        )

}


gerarSwitchFornecedores()

function fornecedoresSelecionados(){

    const switches = document.querySelectorAll(".forn-switch:checked")

    return [...switches].map(el => el.value)

}
