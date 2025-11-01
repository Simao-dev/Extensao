document.addEventListener('DOMContentLoaded', () => {
  // 1. Lógica para o botão Capturar Tela
  document.getElementById('captureScreenButton').addEventListener('click', () => {
    // Usa a API chrome.tabs.captureVisibleTab para capturar a tela visível.
    chrome.tabs.captureVisibleTab(null, {format: "png"}, (screenshotUrl) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        alert('Erro ao capturar a tela. Tente novamente.');
        return;
      }
      
      // SOLUÇÃO CORRETA:
      // Em vez de usar window.open(screenshotUrl), 
      // usamos chrome.tabs.create para abrir a dataURL em uma nova aba.
      
      chrome.tabs.create({ url: screenshotUrl });
      
    });
  });

  // 2. Lógica para o botão Imprimir Etiqueta (mantenha como estava)
  document.getElementById('printLabelButton').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: printCurrentPage
    });
  });
});

// Função a ser injetada na página web
function printCurrentPage() {
  window.print();
}