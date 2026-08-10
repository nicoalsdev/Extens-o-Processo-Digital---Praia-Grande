(() => {
    'use strict';

    /*
     * ============================================================
     * CONFIGURAÇÕES
     * ============================================================
     */

    // true  = mostra "1 de 10 — Nome do documento"
    // false = não mostra essa informação
    const MOSTRAR_INFO_DOCUMENTO = false;


    /*
     * ============================================================
     * PROTEÇÃO CONTRA DUPLA INJEÇÃO
     * ============================================================
     */

    if (window.__extNavegacaoPDFAdicionarDocumentos) {
        return;
    }

    window.__extNavegacaoPDFAdicionarDocumentos = true;


    /*
     * ============================================================
     * VARIÁVEIS
     * ============================================================
     */

    let documentos = [];
    let indiceAtual = -1;
    let painelAtual = null;


    /*
     * ============================================================
     * COLETAR DOCUMENTOS
     * ============================================================
     */

    function coletarDocumentos() {

        documentos = [];

        const linhas = document.querySelectorAll(
            '.linha-documento-grupo'
        );

        linhas.forEach((linha) => {

            const inputURL = linha.querySelector(
                'input[name="url"][dado-visualizacao]'
            );

            const inputNome = linha.querySelector(
                'input[name="nome"][dado-visualizacao]'
            );

            const inputPaginas = linha.querySelector(
                'input[name="paginas"][dado-visualizacao]'
            );

            if (!inputURL || !inputURL.value) {
                return;
            }

            documentos.push({
                linha: linha,

                url: inputURL.value.trim(),

                nome: inputNome
                    ? inputNome.value.trim()
                    : 'Documento',

                paginas: inputPaginas
                    ? inputPaginas.value.trim()
                    : ''
            });
        });

        console.log(
            '[Navegação PDF] Documentos encontrados:',
            documentos.length
        );

        return documentos;
    }


    /*
     * ============================================================
     * ENCONTRAR PAINEL DO VISUALIZADOR
     * ============================================================
     */

    function encontrarPainelVisualizador() {

        const paineis = document.querySelectorAll(
            '.pd-painel-visualizador'
        );

        for (const painel of paineis) {

            const iframe = painel.querySelector(
                '.pd-visualizador-frame'
            );

            if (!iframe) {
                continue;
            }

            const rect =
                painel.getBoundingClientRect();

            if (
                rect.width > 0 &&
                rect.height > 0
            ) {
                return painel;
            }
        }

        return null;
    }


    /*
     * ============================================================
     * ESTILO
     * ============================================================
     *
     * As setas ficam semelhantes às do visualizador original:
     *
     * - menores
     * - discretas
     * - sem o bloco preto grande
     * - centralizadas verticalmente
     */

    function criarEstilo() {

        if (
            document.getElementById(
                'ext-navegacao-pdf-style'
            )
        ) {
            return;
        }

        const style =
            document.createElement('style');

        style.id =
            'ext-navegacao-pdf-style';

        style.textContent = `

            /*
             * Container das setas
             */
            #ext-navegacao-pdf {

                position: absolute !important;

                top: 0 !important;
                left: 0 !important;

                width: 100% !important;
                height: 100% !important;

                pointer-events: none !important;

                z-index: 999999 !important;
            }


            /*
             * Botões
             */
            #ext-navegacao-pdf .ext-pdf-btn {

                position: absolute !important;

                top: 50% !important;

                transform: translateY(-50%) !important;

                width: 40px !important;
                height: 60px !important;

                padding: 0 !important;

                border: 0 !important;

                border-radius: 4px !important;

                background: rgba(0, 0, 0, .20) !important;

                color: #fff !important;

                font-family: Arial, sans-serif !important;

                font-size: 32px !important;

                font-weight: 300 !important;

                line-height: 60px !important;

                text-align: center !important;

                cursor: pointer !important;

                pointer-events: auto !important;

                z-index: 1000000 !important;

                opacity: .75 !important;

                transition:
                    opacity .15s ease,
                    background .15s ease !important;
            }


            /*
             * Hover
             */
            #ext-navegacao-pdf .ext-pdf-btn:hover {

                opacity: 1 !important;

                background: rgba(0, 0, 0, .45) !important;
            }


            /*
             * Esquerda
             */
            #ext-pdf-btn-anterior {

                left: 8px !important;
            }


            /*
             * Direita
             */
            #ext-pdf-btn-seguinte {

                right: 8px !important;
            }


            /*
             * Botão desabilitado
             */
            #ext-navegacao-pdf .ext-pdf-btn:disabled {

                opacity: .15 !important;

                cursor: default !important;

                pointer-events: none !important;
            }


            /*
             * Informação do documento
             *
             * Só aparece quando
             * MOSTRAR_INFO_DOCUMENTO = true
             */
            #ext-pdf-info {

                position: absolute !important;

                left: 50% !important;

                bottom: 10px !important;

                transform: translateX(-50%) !important;

                padding: 5px 10px !important;

                border-radius: 4px !important;

                background: rgba(0, 0, 0, .55) !important;

                color: #fff !important;

                font-family: Arial, sans-serif !important;

                font-size: 12px !important;

                line-height: 16px !important;

                max-width: 70% !important;

                white-space: nowrap !important;

                overflow: hidden !important;

                text-overflow: ellipsis !important;

                pointer-events: none !important;

                z-index: 1000000 !important;
            }

        `;

        document.head.appendChild(style);
    }


    /*
     * ============================================================
     * CRIAR BOTÕES
     * ============================================================
     */

    function criarBotoes(painel) {

        if (!painel) {
            return;
        }

        /*
         * Se já existem, apenas atualiza.
         */
        const existente =
            painel.querySelector(
                '#ext-navegacao-pdf'
            );

        if (existente) {

            painelAtual = painel;

            atualizarBotoes();

            return;
        }

        criarEstilo();

        const body =
            painel.querySelector(
                '.panel-body'
            );

        if (!body) {

            console.log(
                '[Navegação PDF] Panel-body não encontrado.'
            );

            return;
        }

        body.style.position = 'relative';


        /*
         * Container
         */
        const navegacao =
            document.createElement('div');

        navegacao.id =
            'ext-navegacao-pdf';


        /*
         * ========================================================
         * BOTÃO ANTERIOR
         * ========================================================
         */

        const anterior =
            document.createElement('button');

        anterior.type =
            'button';

        anterior.id =
            'ext-pdf-btn-anterior';

        anterior.className =
            'ext-pdf-btn';

        anterior.title =
            'Documento anterior';

        anterior.setAttribute(
            'aria-label',
            'Documento anterior'
        );

        anterior.innerHTML =
            '&#10094;';


        /*
         * ========================================================
         * BOTÃO SEGUINTE
         * ========================================================
         */

        const seguinte =
            document.createElement('button');

        seguinte.type =
            'button';

        seguinte.id =
            'ext-pdf-btn-seguinte';

        seguinte.className =
            'ext-pdf-btn';

        seguinte.title =
            'Documento seguinte';

        seguinte.setAttribute(
            'aria-label',
            'Documento seguinte'
        );

        seguinte.innerHTML =
            '&#10095;';


        /*
         * ========================================================
         * INFORMAÇÃO
         * ========================================================
         */

        let info = null;

        if (MOSTRAR_INFO_DOCUMENTO) {

            info =
                document.createElement('div');

            info.id =
                'ext-pdf-info';
        }


        /*
         * ========================================================
         * EVENTOS
         * ========================================================
         */

        anterior.addEventListener(
            'click',
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                navegar(-1);
            }
        );


        seguinte.addEventListener(
            'click',
            function(event) {

                event.preventDefault();
                event.stopPropagation();

                navegar(1);
            }
        );


        /*
         * ========================================================
         * MONTAR
         * ========================================================
         */

        navegacao.appendChild(
            anterior
        );

        navegacao.appendChild(
            seguinte
        );

        if (info) {

            navegacao.appendChild(
                info
            );
        }

        body.appendChild(
            navegacao
        );

        painelAtual =
            painel;

        atualizarBotoes();

        console.log(
            '[Navegação PDF] Setas adicionadas.'
        );
    }


    /*
     * ============================================================
     * ATUALIZAR BOTÕES
     * ============================================================
     */

    function atualizarBotoes() {

        if (!painelAtual) {
            return;
        }

        const anterior =
            painelAtual.querySelector(
                '#ext-pdf-btn-anterior'
            );

        const seguinte =
            painelAtual.querySelector(
                '#ext-pdf-btn-seguinte'
            );

        const info =
            painelAtual.querySelector(
                '#ext-pdf-info'
            );


        /*
         * Se não existe documento atual
         */
        if (
            indiceAtual < 0 ||
            indiceAtual >= documentos.length
        ) {
            return;
        }


        /*
         * ========================================================
         * BOTÃO ANTERIOR
         * ========================================================
         */

        if (anterior) {

            anterior.disabled =
                indiceAtual <= 0;
        }


        /*
         * ========================================================
         * BOTÃO SEGUINTE
         * ========================================================
         */

        if (seguinte) {

            seguinte.disabled =
                indiceAtual >=
                documentos.length - 1;
        }


        /*
         * ========================================================
         * INFORMAÇÃO
         * ========================================================
         */

        if (
            MOSTRAR_INFO_DOCUMENTO &&
            info
        ) {

            const documento =
                documentos[indiceAtual];

            info.textContent =
                `${indiceAtual + 1} de ${documentos.length} — ${documento.nome}`;

            info.title =
                documento.nome;
        }
    }


    /*
     * ============================================================
     * NAVEGAR
     * ============================================================
     */

    function navegar(direcao) {

        if (!painelAtual) {
            return;
        }

        const novoIndice =
            indiceAtual + direcao;

        if (
            novoIndice < 0 ||
            novoIndice >= documentos.length
        ) {
            return;
        }

        const documento =
            documentos[novoIndice];

        if (!documento) {
            return;
        }

        const iframe =
            painelAtual.querySelector(
                '.pd-visualizador-frame'
            );

        if (!iframe) {

            console.log(
                '[Navegação PDF] iframe não encontrado.'
            );

            return;
        }


        /*
         * Atualiza índice
         */
        indiceAtual =
            novoIndice;


        /*
         * Troca PDF
         */
        iframe.src =
            documento.url;


        /*
         * Atualiza nome
         */
        const nome =
            painelAtual.querySelector(
                '[nome]'
            );

        if (nome) {

            nome.textContent =
                documento.nome;
        }


        /*
         * Atualiza páginas
         */
        const paginas =
            painelAtual.querySelector(
                '[paginas]'
            );

        if (paginas) {

            paginas.textContent =
                documento.paginas;
        }


        atualizarBotoes();

        console.log(
            '[Navegação PDF] Documento:',
            novoIndice + 1,
            documento.nome
        );
    }


    /*
     * ============================================================
     * ESPERAR VISUALIZADOR
     * ============================================================
     */

    function esperarVisualizador(
        indice,
        tentativa = 0
    ) {

        /*
         * 30 tentativas x 100ms
         * = aproximadamente 3 segundos
         */
        if (tentativa >= 30) {

            console.log(
                '[Navegação PDF] Visualizador não encontrado.'
            );

            return;
        }


        const painel =
            encontrarPainelVisualizador();


        if (painel) {

            console.log(
                '[Navegação PDF] Visualizador encontrado.'
            );

            painelAtual =
                painel;

            indiceAtual =
                indice;

            criarBotoes(
                painel
            );

            atualizarBotoes();

            return;
        }


        setTimeout(
            () => {

                esperarVisualizador(
                    indice,
                    tentativa + 1
                );

            },
            100
        );
    }


    /*
     * ============================================================
     * CLIQUE EM VISUALIZAR
     * ============================================================
     */

    document.addEventListener(
        'click',
        function(event) {

            const botao =
                event.target.closest(
                    'a[visualizar="dado-visualizacao"]'
                );

            if (!botao) {
                return;
            }


            /*
             * Linha do documento
             */
            const linha =
                botao.closest(
                    '.linha-documento-grupo'
                );

            if (!linha) {

                console.log(
                    '[Navegação PDF] Linha não encontrada.'
                );

                return;
            }


            /*
             * Atualiza documentos
             */
            coletarDocumentos();


            /*
             * URL do documento clicado
             */
            const inputURL =
                linha.querySelector(
                    'input[name="url"][dado-visualizacao]'
                );

            if (!inputURL) {

                console.log(
                    '[Navegação PDF] URL não encontrada.'
                );

                return;
            }


            /*
             * Identifica índice
             */
            indiceAtual =
                documentos.findIndex(
                    documento =>
                        documento.url ===
                        inputURL.value.trim()
                );


            console.log(
                '[Navegação PDF] Documento clicado:',
                indiceAtual
            );


            if (indiceAtual < 0) {

                return;
            }


            /*
             * Espera o visualizador original
             * abrir.
             */
            esperarVisualizador(
                indiceAtual
            );

        },
        false
    );


    /*
     * ============================================================
     * TECLADO
     * ============================================================
     */

    document.addEventListener(
        'keydown',
        function(event) {

            if (!painelAtual) {
                return;
            }


            if (
                !document.body.contains(
                    painelAtual
                )
            ) {

                painelAtual = null;

                return;
            }


            /*
             * Não interfere em campos.
             */
            const ativo =
                document.activeElement;

            if (
                ativo &&
                (
                    ativo.tagName === 'INPUT' ||
                    ativo.tagName === 'TEXTAREA' ||
                    ativo.tagName === 'SELECT' ||
                    ativo.isContentEditable
                )
            ) {
                return;
            }


            /*
             * Esquerda
             */
            if (
                event.key === 'ArrowLeft'
            ) {

                event.preventDefault();

                navegar(-1);
            }


            /*
             * Direita
             */
            if (
                event.key === 'ArrowRight'
            ) {

                event.preventDefault();

                navegar(1);
            }

        },
        false
    );


    /*
     * ============================================================
     * INICIALIZAÇÃO
     * ============================================================
     */

    function iniciar() {

        console.log(
            '[Navegação PDF] Extensão carregada.'
        );

        criarEstilo();
    }


    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            iniciar,
            {
                once: true
            }
        );

    } else {

        iniciar();
    }

})();
