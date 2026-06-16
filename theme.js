// --- theme.js: Versão Automática com Cores Específicas por Página ---

const THEMES = {
    light: {
        page: "#f5f6fa",
        board: "#e7e7e7",
        card: "#ffffff",
        text: "#333333",
        border: "#6c757d"
    },
    dark: {
        page: "#121212", 
        board: "#565656", 
        card: "#1e1e1e",
        text: "#e0e0e0",
        border: "#fff", 
        input: "#121212"
    }
};

const PAGINAS_COM_BOTAO = [
    'kanban.html'
];

document.getElementById("grupoDoc")
?.classList.add("text-info-emphasis");


function applyGlobalTheme(config) {
    if (!config) return;
    const isDark = config.isDark || false;
    const theme = isDark ? THEMES.dark : THEMES.light;
    const path = window.location.pathname;
    const isKanban = path.includes('kanban.html');

    // Retoma a lógica original: No modo claro, Kanban usa config.page ou az]ul escuro. Outras usam o padrão light.
    const pageBg = isDark ? theme.page : (isKanban ? (config.page || "#3a546e") : theme.page);
    const boardBg = isDark ? theme.board : (config.board || theme.board);

    let styleTag = document.getElementById('global-theme-css');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'global-theme-css';
        document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
        body, html { background-color: ${pageBg} !important; color: ${theme.text} !important; transition: all 0.2s ease; }

      .tag, .tags, .badge, .tag span, .tag div, .badge span {
    background-color: inherit; /* Ou remova o !important das regras globais */
}

        .task, .card, .list-group-item, .app-item { 
            background-color: ${theme.card} !important; 
            color: ${theme.text} !important; 
            box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.4' : '0.08'}) !important;
        }

        
        .board { background-color: ${boardBg} !important; border-radius: 12px !important; }

        ${isDark ? `
             ::placeholder { color: white !important; opacity: 0.8 !important; }
        ::-webkit-input-placeholder { color: white !important; }
        ::-moz-placeholder { color: white !important; }
        :-ms-input-placeholder { color: white !important; }
        input::placeholder, textarea::placeholder { color: white !important; opacity: 0.7; }

            .text-info-emphasis { color: #ddd !important; }
            .text-dark, .text-black, h1, h4, h5, h6, .modal-title, .h4 { color: #ffffff !important; }
            .text-muted, .small { color: #ccc !important; }
            .modal-content { background-color: ${theme.card} !important; border: 1px solid #666 !important; }
            .form-control, .form-select, textarea { background-color: ${theme.input} !important; color: #fff !important; border: 1px solid #666 !important; }
            .btn-close { filter: invert(1); }
            .table { --bs-table-bg: ${theme.card} !important; color: #fff !important; }
            .table td, .table th { background-color: ${theme.card} !important; border-color: #666 !important; }
            .bg-primary, .btn-primary { background-color: #0d2c5e !important;}
            .bg-warning, .btn-warning { background-color: #b98b03 !important;}
            .bg-danger { background-color:#801e28 !important;}
            .bg-white, .btn-white { background-color:#2d2d2d !important}
            .bg-light { background-color:#121212 !important}
            .bg-dark, .btn-dark { background-color:#ddd !important}

.feature-block, [style*="#f1f8ff"] {
    background-color: #1e1e1e !important; 
    border-left-color: #0d6efd !important; /* Mantém a borda visível */
}

/* Garante que blocos ímpares também fiquem escuros */
.feature-block:nth-child(odd) {
    background-color: #252525 !important;
}

/* Ajusta as cores dos textos dentro desses blocos */
.feature-block p, .feature-block h2, .feature-block li {
    color: #e0e0e0 !important;
}
.pg-icon-menu .navbar-nav .dropdown .dropdown-toggle span {
            color: #fff !important;
            }
            .pd-sidebar .navbar-nav .active .dropdown-toggle{
            background-color: #bbbbbb !important;
           
            }
              .pd-sidebar .navbar-nav .active .dropdown-toggle span, .pd-sidebar .navbar-nav .active .dropdown-toggle label{
            
            color: #1a1a1a !important;
            }
            .fa{
            color: #fff;
            }
.dropdown-menu, .meu-menu-flutuante, .tag-floating-menu a, 
.tag-floating-menu > a {
    color: #bbbbbb !important;
}

body .meu-menu-flutuante {
            background-color:#1e1e1e !important;
                border: 1px solid #565656 !important;
}


.linha-documento-grupo.-para-publicacao {
            background-color: #273338 !important;
            color: #bbbbbb !important;
}



div.form-upload, form.form-upload {
                background-color: #1e1e1e !important;
                color:#fff !important;
}
                div.alert-warning{
                background-color:#343127 !important;
                color:#fff;
            border-color: #ffc000;
                }

.site-navbar{
            background-color:#121212 !important;
}

            .custom-select{
               background-color: #1e1e1e !important;
                color:#fff !important;
            }
.login-pf-page, input, #botao-zoio{
            background-color: #121212 !important;
            color:#fff !important;
}

.card-pf {
            background-color:#1e1e1e;
}

[style*="border-left: 6px solid rgb(108, 117, 125)"] {
    border-left-color: #ffffff !important;
}
        
[style*="color:#444A4F"]{
            color:#fff !important;
}
            select option {
    background-color: #121212 ; /* Fundo das opções */
}


/* Animação de entrada */
@keyframes swal2-show {
    0% {
        opacity: 0;
        transform: scale(0.95);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}

/* Ícones (success, error, warning, info, question) */
.swal2-icon {
    display: flex !important;
    align-items: center;
    justify-content: center;
    opacity: 1 !important;
    visibility: visible !important;
    transform: scale(1) !important;
}

/* Ícone SUCCESS */
.swal2-icon.swal2-success {
    border-color: #28a745 !important;
    color: #28a745 !important;
}

/* Ícone ERROR */
.swal2-icon.swal2-error {
    border-color: #dc3545 !important;
    color: #dc3545 !important;
}

/* Ícone WARNING */
.swal2-icon.swal2-warning {
    border-color: #ffc107 !important;
    color: #ffc107 !important;
}

/* Ícone INFO */
.swal2-icon.swal2-info {
    border-color: #0dcaf0 !important;
    color: #0dcaf0 !important;
}

/* Ícone QUESTION */
.swal2-icon.swal2-question {
    border-color: #6f42c1 !important;
    color: #6f42c1 !important;
}

/* Garante que as linhas internas apareçam */
.swal2-success-line-tip,
.swal2-success-line-long,
.swal2-x-mark-line-left,
.swal2-x-mark-line-right {
    background-color: currentColor !important;
}

.situacao-caixa-entrada, .situacao-caixa-entrada span{
        color:#fff !important;
}

.form-control-plaintext{
        color: #fff !important;
    }


            .task-order{
                background-color: #121212;
            }

            .swal2-icon {
    border-width: 4px !important;
}

/* Fix específico para o ícone de ERROR (X) */
.swal2-icon.swal2-error {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
}

/* Força as linhas do X a ficarem centralizadas e visíveis */
.swal2-icon.swal2-error [class^='swal2-x-mark-line'] {
    display: block !important;
    position: absolute !important;
    top: 50% !important; /* Centraliza verticalmente */
    height: 5px !important;
    width: 47px !important;
    background-color: #dc3545 !important;
    margin-top: -2px !important; /* Ajuste fino para o centro real */
}

.swal2-x-mark-line-left {
    left: 17px !important;
    transform: rotate(45deg) !important;
}

.swal2-x-mark-line-right {
    right: 17px !important;
    transform: rotate(-45deg) !important;
}

/* Garante que o ícone de SUCCESS também não quebre */
.swal2-icon.swal2-success [class^='swal2-success-line'] {
    background-color: #28a745 !important;
}
            

            ` : ''}

        #theme-float-btn { position: fixed; bottom: 25px; right: 25px; z-index: 10000; width: 50px; height: 50px; border-radius: 50%; background: #0d6efd; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
        #theme-panel {
             position: fixed; bottom: 85px; right: 25px; z-index: 10000; 
            background: ${isDark ? '#252525' : '#ffffff'}; 
            color: ${isDark ? '#fff' : '#333'};
            padding: 20px; border-radius: 16px; width: 260px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4); 
            display: none; border: 1px solid ${isDark ? '#444' : '#eee'};
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .panel-header { font-weight: 700; font-size: 16px; margin-bottom: 20px; border-bottom: 1px solid ${isDark ? '#444' : '#eee'}; padding-bottom: 10px; }
        .theme-row { margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; }
        .switch-container { position: relative; display: inline-block; width: 42px; height: 24px; }
        .switch-container input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #0d6efd; }
        input:checked + .slider:before { transform: translateX(18px); }

       

/* Para garantir que o ícone herde */
.text-info-emphasis .glyphicon,
.text-info-emphasis .fa {
    color: inherit !important;
}


        /* ===============================
   SWEETALERT THEME
=============================== */

.swal2-popup {
    background-color: ${isDark ? theme.card : '#ffffff'} !important;
    color: ${isDark ? theme.text : '#212529'} !important;
    border: 1px solid ${isDark ? '#444' : '#ddd'} !important;
    border-radius: 12px !important;
}

            .linha-documento-grupo>.nome{
            width: 60%;
            }
             div.linha-documento-grupo>.tipo{
            width: 15%;
            text-align: center !important;
            }


        `;

   // Remove estilos anteriores para evitar acumulação
        const oldStyle = document.getElementById('ext-dark-theme-global');
        if (oldStyle) oldStyle.remove();

        if (isDark && 
            window.location.href.startsWith('https://processodigital.praiagrande.sp.gov.br/')
            ) {
            const style = document.createElement('style');
        style.id = 'ext-dark-theme-global';

        style.innerHTML = `
/* ===============================
   FORÇA REMOÇÃO DE FUNDO CLARO
=============================== */

/* Remove QUALQUER fundo branco ou #EFEFEF */
* {
    background-image: none !important;
}
/*
*:not(img):not(svg):not(video) {
    background-color: transparent !important;
}
*/

    #tag-floating-menu { 
    background-color: ${isDark ? '#252525' : '#ffffff'} !important; 
    color: ${isDark ? '#fff' : '#333'} !important;
    border: 1px solid ${isDark ? '#444' : '#ccc'} !important;
}
        /* Adicione isso logo abaixo */
#tag-floating-menu a, .tag-floating-menu a {
    color: #bbbbbb !important;
}

    /* ===============================
       9. ÍCONES
    =============================== */
/* Ícones padrão */

.fa:hover, 
.glyphicon:hover,
a:hover .fa,
a:hover .glyphicon {
    color: #ffffff !important;
}

a.item:hover .fa,
a.item:hover .glyphicon,
a.item .fa:hover,
a.item .glyphicon:hover {
    color: #1e1e1e !important;
    cursor: pointer;
}

/* Opcional: Adicione uma transição suave para ver o efeito acontecer */
.fa, .glyphicon {
    color: #aaaaaa;
    transition: color 0.2s ease-in-out;
}

/* Sobrescreve quando houver utilitário */
.fa.text-danger,
.glyphicon.text-danger {
    color: #dc3545 !important;
}

.fa.text-success,
.glyphicon.text-success {
    color: #28a745 !important;
}

.fa.text-warning,
.glyphicon.text-warning {
    color: #ffc107 !important;
}

.fa.text-info,
.glyphicon.text-info {
    color: #0dcaf0 !important;
}

/* Elementos principais */
.layout-principal,
#conteudo,
.panel,
.panel-default,
.panel-body,
.well,
.card,
.table,
.navbar,
.container,
.col-md-12,
.col-md-6,
.col-md-4,
.col-lg-12 {
    background-color: #1e1e1e !important;
    background: #1e1e1e !important;
}

.form-group .col-md-12{
            background: #2a2a2a !important;
}

.navbar .container{
            background-color: #1a1a1a !important;
}

/* Se ainda houver inline */
[style*="#fff"],
[style*="#ffffff"],
[style*="#EFEFEF"],
[style*="#efefef"],
[style*="#ededed"],
.modal-header {
    background-color: #1e1e1e !important;
}

[style*="rgb(255, 255, 255)"],
[style*="rgb(245, 245, 245)"],
.cbp_tmlabel_gray .alert-secondary,
[style*="rgb(27, 27, 27)"]
{
        background-color: transparent !important;
        color:#bbbbbb !important;
}
    /* ===============================
       1. FUNDO GLOBAL
    =============================== */

    body,
    html,
    .layout-principal,
    #conteudo,
    .layout-principal-cabecalho,
    [style*="#f5f5f5"],
    [style*="#F5F5F5"],
    [style*="#EFEFEF"],
    [style*="#efefef"] {
        background-color: #121212 !important;
        background: #121212 !important;
        color: #e0e0e0 !important;
    }

    /* ===============================
       2. CARDS / BLOCOS / PAINÉIS
    =============================== */

    .pd-inbox-item,
    .pd-inbox-col-left,
    .panel,
    .panel-default,
    .well,
    .card,
    [style*="#ffffff"],
    [style*="background-color: #fff"],
    [style*="background-color:#fff"],
    .menulido span[lido],
    .cabecalho-pagina,
    .conteudo-pagina,
    .painel-pagina,
        .form-upload,
        .panel-footer,
        .pg-icon-menu .navbar-nav .dropdown-menu > .nav,
        .botao-contornado, .botao-icone
     {
        background-color: #1e1e1e !important;
        background: #1e1e1e !important;
        border-color: #333 !important;
        box-shadow: none !important;
    }



   a.pd-inbox-item:hover , a.pd-inbox-item:hover .menulido span[lido] {
    background-color: #424242 !important;
    }

.cbp_tmtimeline > li:nth-child(odd) .cbp_tmlabel {
    background: #4b4a4a !important;
}
        .cbp_tmtimeline > li:nth-child(odd) .cbp_tmlabel:after {
    border-right-color: #4b4a4a !important;
}

        .cbp_tmtimeline > li .cbp_tmlabel {
        background:#2d2d2d !important;
        }
  .cbp_tmtimeline > li .cbp_tmlabel:after {
    border-right-color: #2d2d2d !important;
}

.cbp_tmtimeline > li .cbp_tmicon {
    box-shadow: 0 0 0 8px #4b4a4a !important;
    background: #2d2d2d !important;
}

    /* ===============================
       3. PANEL HEADING
    =============================== */

    .panel-heading,
    .panel > .panel-heading,
    .bs-searchbox,
        .dropdown-menu,
        .inner
     {
        background-color: #2a2a2a !important;
        color: #f5f5f5 !important;
        border-color: #333 !important;
    }

    /* ===============================
       4. TEXTOS (REMOVE PRETO E AZUL)
    =============================== */

    p,
    b,
    label,
    strong,
    small,
    td,
    th,
    li,
    a,
    h1, h2, h3, h4, h5, h6,
    [style*="color: black"],
    [style*="color:#000"],
    [style*="color: #19196F"],
    [style*="color:#19196F"],
    .botao-contornado, .botao-icone {
        color: #bbbbbb ;
    }
        /* Regra específica para spans */
span:not([class*="tag"]):not([class*="tags"]):not([class*="badge"]) {
    color: #bbbbbb;
}

      .pd-inbox .pd-inbox-col-left {
            padding: 15px 15px 15px 15px;
      }

    body span.data-mensagem{
  color: #fff !important;
    }

    body span.hora-mensagem{
          color: #5f5f5f !important;
    }

   main .cbp_tmtimeline > li .cbp_tmlabel_gray {
    background: #2a2a2a;
    color: #bbbbbb;
    border: 1px solid #a9a9a9;
}

         main .cbp_tmtimeline > li .cbp_tmlabel_gray:after {
            border-right-color: #a9a9a9 !important;
         }

    /* Azul escuro original vira laranja */
    [style*="#19196F"],
    [style*="#19196f"] {
        color: #FFA500 !important;
    }

    /* Links */



        /* Regra específica para spans */
a:not([class*="pd-inbox-item"]) {
    color: #FFA500 ;
}
        /* Regra específica para spans */
span:not([class*="tag"]):not([class*="tags"]):not([class*="badge"]) {
    color: #bbbbbb;
}

    a.btn{
        color: #fff !important;
    }
    a.btn-success:hover,min btn btn-primary:hover {
        background-color: #187318 !important;
        color: #fff !important;
    }
     a.btn-success,min btn btn-primary,button.btn-success {
        background-color: #043f04 !important;
        color: #fff !important;
    }

    a:not([class*="pd-inbox-item"]):hover {
        color: #ffb733 !important;
    }

            

    /* Destaque forte */
    b.title,
    .pd-inbox-item b,
    strong {
        color: #ffffff !important;
    }

    /* ===============================
       5. NAVBAR
    =============================== */

    .navbar,
    .navbar-default,
    .navbar-collapse,
    .navegacao-principal,
    .layout-principal-cabecalho {
        background-color: #1a1a1a !important;
        background-image: none !important;
        border-color: #1a1a1a !important;
    }

    /* ===============================
       6. INPUTS
    =============================== */

    .form-control,
    .bootstrap-select .btn,
    .dropdown-toggle,
    input,
    textarea,
    select {
        background-color: #1a1a1a !important; // Com borda #262626
        color: #ffffff !important;
        border: 1px solid #1a1a1a !important; //Com borda: #444
    }

    input::placeholder,
    textarea::placeholder {
        color: #aaaaaa !important;
    }

    /* ===============================
       7. TABELAS
    =============================== */

    table,
    .table {
        background-color: #1e1e1e !important;
        color: #dddddd !important;
    }

    .table td,
    .table th {
        border-color: #333 !important;
    }

    /* ===============================
       8. BOTÕES
    =============================== */


    .btn-default {
        background-color: #2a2a2a !important;
        border-color: #444 !important;
        color: #fff !important;
    }



    /* ===============================
       10. TOAST
    =============================== */

    #toast {
        background-color: #1e1e1e !important;
        color: #fff !important;
        border: 1px solid #333 !important;
    }
/* ===============================
   POPOVERS & TOOLTIPS THEME
=============================== */
/* Modo Claro (Default) */
/* POPOVERS E TOOLTIPS - Definidos aqui para ter prioridade */
        .popover, .popover .popover-content, #filtroPrioridade StatusPopover{ 

            background-color:  #2d2d2d  !important; 
            border: 1px solid  #555 !important; 
            opacity: 1 !important; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important;
            color: #fff !important;
        }
        .popover-header { 
            background-color: #333 !important; 
            color: #fff !important; 
        }
        .popover-body { color: #eee !important; background-color: transparent !important; }

        .tooltip-inner { 
            background-color: ${isDark ? '#444' : '#000'} !important; 
            color: #fff !important; 
            border: 1px solid ${isDark ? '#666' : 'transparent'} !important;
            opacity: 1 !important;
        }

        /* Setas do Popover */
        .bs-popover-auto[data-popper-placement^=top] > .popover-arrow::after { border-top-color: ${isDark ? '#2d2d2d' : '#fff'} !important; }
        .bs-popover-auto[data-popper-placement^=bottom] > .popover-arrow::after { border-bottom-color: ${isDark ? '#2d2d2d' : '#fff'} !important; }
/* Ajustes para Modo Escuro */
            ${isDark ? `


    /* Tooltips (Dicas curtas) */
    .tooltip-inner {
        background-color: #444 !important;
        color: #fff !important;
        border: 1px solid #666 !important;
    }
    .bs-tooltip-auto[data-popper-placement^=top] .tooltip-arrow::before, 
    .bs-tooltip-top .tooltip-arrow::before { border-top-color: #444 !important; }


.alert-info{
        background-color:#073045 !important;
}

#aba-recebidos, #aba-enviados, ul.pd-docs-tabs > li > a {
 background-color:#121212 !important;
}

#aba-enviados.active, #aba-recebidos.active, ul.pd-docs-tabs > li > a.active{
         background-color:#2a2a2a !important;    
}

        .pg-panel-header{
            border-bottom: 1px solid #000 !important;
            background-color:#121212 !important;
        }

        .pg-panel-body{
        background-color:#2a2a2a !important;
        }

    .pg-table{border: none;}

        .pg-table-container{
        background-color: #121212; 
     border-top: 1px solid #000; 
     border-right: 1px solid #000; 
     border-left: 1px solid #000; 
     border-bottom: 1px solid #000; 

        }

.tab-pane{ background-color:#1e1e1e  !important;}

body .pg-panel-header .pg-buttons > a > span,
body .pg-panel-header .pg-buttons > a.pg-icons{
        color: #ffffff !important;
        opacity: 1 !important;
    }
.pd-inbox-col-right, .pd-inbox-col-left, .pd-inbox-item-left, .pd-inbox-item-right,.navegacao-principal-menu, .html, .body {
    background-color: #121212 !important;
}


.btn-info{
    background-color: #073045 !important;   
    color:#bbbbbb;
}


               .panel-heading .btn-container .btn-info{
                background-color: #2a2a2a !important;
                color: #bbbbbb !important;
               }

                     .panel-heading .btn-container .btn-info:hover{
                background-color: #bbbbbb !important;
                color: #2a2a2a !important;
               }

.panel-heading .btn-container .btn-info:hover span, .panel-heading .btn-container .btn-info:hover i  {
    background-color: #bbbbbb !important;
    color: #2a2a2a !important;
  }
              


    .pg-text-container .pg-text-middle > a.btn{
                border:none !important;
        background-color: #2a2a2a !important; //#073045
        border-color: #2a2a2a !important;
        color:#bbbbbb;
    }

div .pg-pagination ul.pagination.nav > li.active > a, .pg-pagination.active{
    background-color: #073045 !important;
}

    div .pg-pagination ul.pagination.nav > li > a:hover{
    background-color: #304651 !important;
}

.nav-tabs>li.active>a, .nav-tabs>li.active>a:focus, .nav-tabs>li.active>a:hover {
    color: #fff;
    cursor: default;
    background-color: #fff;
    border: 1px solid #ddd;
    border-bottom-color: transparent;
}

    .conteudo-aba-processo {
    background: #1e1e1e !important; 
    border: none;
    }

footer.layout-principal-rodape.rodape.simples {
    background-color: #111111 !important;
}


.modal .modal-dialog .modal-content .modal-body {
                background-color: #1e1e1e !important;
                color:#fff !important;
}

.link-anexo{
                background-color:#453f3f;
}


.pg-info, .pg-panel-footer {
    position: relative;
    padding: 14px 14px 14px 56px;
    margin-bottom: 10px;
    margin-left: 3px;
    margin-right: 3px;
    min-height: 50px;
    border: 1px solid #1212125c !important;
    background-color: #2a2a2a !important;
    box-shadow: 0 2px 2px rgba(0, 0, 0, .175);
}

.pg-panel {
    border: 0px solid #efefef;
}
                ` : ''}
            `;

            document.head.appendChild(style);
        }
    }

    function createThemeControls() {
        const path = window.location.pathname;
        const deveMostrarBotao = PAGINAS_COM_BOTAO.some(pg => path.includes(pg));
        if (!deveMostrarBotao || document.getElementById('theme-float-btn')) return;

        const isKanban = path.includes('kanban.html');
        const btn = document.createElement('button');
        btn.id = 'theme-float-btn';
        btn.innerHTML = '🎨';
        document.body.appendChild(btn);

        const panel = document.createElement('div');
        panel.id = 'theme-panel';
        panel.innerHTML = `
        <div class="panel-header">Personalização</div>

        <div id="kanban-controls" style="display: ${isKanban ? 'block' : 'none'}">
            <label style="display:block; font-size:11px; margin-bottom:5px; opacity:0.6;">COR DO FUNDO</label>
            <input type="color" id="theme-page-color" class="form-control" style="height:38px; width:100%; border-radius:8px; margin-bottom:12px" value='#3a546e'>
            <label style="display:block; font-size:11px; margin-bottom:5px; opacity:0.6;">COR DO BOARD</label>
            <input type="color" id="theme-board-color" class="form-control" style="height:38px; width:100%; border-radius:8px; margin-bottom:12px" value='#e7e7e7'>
        </div>
        `;
        document.body.appendChild(panel);

        btn.onclick = (e) => {
            e.stopPropagation();
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        };

    // Salva automaticamente ao mudar qualquer valor
        const saveTheme = () => {
            const config = {
                isDark: document.getElementById('theme-dark-switch').checked,
                page: isKanban ? document.getElementById('theme-page-color').value : undefined,
                board: isKanban ? document.getElementById('theme-board-color').value : undefined
            };
            chrome.storage.local.set({ customTheme: config });
        };

        chrome.storage.local.get(['customTheme'], (res) => {
            const config = res.customTheme || {};
            const darkSwitch = document.getElementById('theme-dark-switch');
            
         const darkModeToggle = document.getElementById('gridCheck'); // Ou o ID que você usa
if (darkModeToggle) {
    darkModeToggle.checked = statusDoTema; 
}
            
            darkSwitch.onchange = saveTheme;

            if (isKanban) {
                const pageInput = document.getElementById('theme-page-color');
                const boardInput = document.getElementById('theme-board-color');
                pageInput.value = config.page || "#3a546e";
                boardInput.value = config.board || "#e7e7e7";
                
                pageInput.oninput = saveTheme;
                boardInput.oninput = saveTheme;
            }
        });

    // Fecha o painel se clicar fora
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== btn) panel.style.display = 'none';
        });
    }

// --- theme.js (Ajuste Final) ---

// Função unificada para aplicar o tema baseada no objeto de config
    function refreshTheme() {
        chrome.storage.local.get(['userSettings', 'customTheme'], (data) => {
        // Tenta pegar de 'customTheme' ou 'userSettings'
            const isDark = data.customTheme?.isDark || data.userSettings?.darkMode || false;
            applyGlobalTheme({ isDark: isDark });
        });
    }

// Escuta mensagens para trocar o tema em tempo real
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'toggleTheme') {
            applyGlobalTheme({ isDark: request.darkMode });
        }
    });

// Inicialização corrigida
    function init() {
    refreshTheme(); // Carrega o estado atual ao abrir a página
    createThemeControls();
    
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.customTheme || changes.userSettings) {
            refreshTheme();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
