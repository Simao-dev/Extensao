// Função auxiliar para injetar o script de seleção
async function injectSelector(tabId) {
  // O script selector.js será executado no contexto da página web
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['selector.js']
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Lógica para o botão CAPTURAR TELA (com seleção de área)
  document.getElementById('captureScreenButton').addEventListener('click', async () => {
    // Obtém a aba ativa
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 1. INJETA O SCRIPT DE SELEÇÃO
    // Este script (selector.js) cuidará da interface de arrastar e selecionar
    injectSelector(tab.id);

    // 2. Fecha o pop-up para que o usuário possa interagir com a tela subjacente
    window.close();
  });

  // Lógica para o botão IMPRIMIR ETIQUETA
  document.getElementById('printLabelButton').addEventListener('click', async () => {
    // Obtém a aba ativa
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Injeta a função de impressão na aba
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: printCurrentPage // Chama a função de impressão nativa
    });
  });
});

// Função a ser injetada na página web para imprimir
function printCurrentPage() {
  // Esta função é executada no contexto da página
  window.print();
}


// 3. ESCUTA A MENSAGEM DO SCRIPT DE CONTEÚDO (selector.js)
// O selector.js envia uma mensagem quando a área é selecionada
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // Verifica se a mensagem é sobre a área selecionada
  if (request.action === "areaSelected" && request.coords) {
    const { x, y, width, height } = request.coords;

    // Obtém a janela (windowId) para tirar a foto
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 4. CAPTURA A TELA VISÍVEL COMPLETA
    // É necessário capturar a tela inteira primeiro
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (screenshotUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Erro na captura:", chrome.runtime.lastError.message);
        return;
      }
      
      // 5. ENVIA A URL DA CAPTURA E AS COORDENADAS PARA O CROPPING
      // A função cropAndOpen está definida no cropper.js
      cropAndOpen(screenshotUrl, x, y, width, height); 
    });

    // É uma boa prática retornar true para indicar que você vai enviar uma resposta de forma assíncrona,
    // embora não seja estritamente necessário neste caso específico, ajuda a evitar warnings.
    return true; 
  }
});