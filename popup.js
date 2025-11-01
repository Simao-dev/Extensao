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
    // 1. Obtém a aba ativa
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. VERIFICAÇÃO CRÍTICA DA URL
    const isChromeRestricted = tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://');
    
    if (isChromeRestricted) {
        alert("Erro: Não é possível capturar a tela em páginas internas do Chrome (como 'chrome://extensions' ou Nova Aba). Por favor, navegue para uma página web normal.");
        window.close();
        return;
    }
    
    // 3. INJETA O SCRIPT DE SELEÇÃO
    injectSelector(tab.id);

    // 4. Fecha o pop-up para que o usuário possa interagir com a tela subjacente
    window.close();
  });

  // Lógica para o botão IMPRIMIR ETIQUETA
  document.getElementById('printLabelButton').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Verifica restrição também para a impressão
    const isChromeRestricted = tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://');

    if (isChromeRestricted) {
        alert("Erro: Não é possível imprimir páginas internas do Chrome. Por favor, navegue para uma página web normal.");
        window.close();
        return;
    }

    // Injeta a função de impressão na aba
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: printCurrentPage
    });
  });
});

// Função a ser injetada na página web para imprimir
function printCurrentPage() {
  window.print();
}


// ESCUTA A MENSAGEM DO SCRIPT DE CONTEÚDO (selector.js)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "areaSelected" && request.coords) {
    const { x, y, width, height } = request.coords;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // CAPTURA A TELA VISÍVEL COMPLETA
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (screenshotUrl) => {
      if (chrome.runtime.lastError) {
        console.error("Erro na captura:", chrome.runtime.lastError.message);
        return;
      }
      
      // ENVIA A URL DA CAPTURA E AS COORDENADAS PARA O CROPPING (no cropper.js)
      cropAndOpen(screenshotUrl, x, y, width, height); 
    });

    return true; 
  }
});