document.getElementById('btnNotificar').addEventListener('click', () => {
  
  // Enviando a mensagem com título, texto e o link do Processo Digital
  chrome.runtime.sendMessage({ 
    action: "mostrar_notificacao",
    titulo: "Processo Assinado!",
    texto: "O documento foi assinado com sucesso. Clique aqui para ver.",
    link: "https://processodigital.praiagrande.sp.gov.br/" // O link que vai abrir ao clicar!
  }, (resposta) => {
    console.log("Status:", resposta);
  });

});