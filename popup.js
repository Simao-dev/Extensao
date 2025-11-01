// Ficheiro: popup.js

document.getElementById('btn-print-selection').addEventListener('click', () => {
    // 1. Envia a mensagem para o Service Worker (background.js)
    chrome.runtime.sendMessage({ action: 'START_PRINT_SELECTION' });
    
    // 2. Fecha o pop-up imediatamente
    window.close();
});

document.getElementById('btn-label-input').addEventListener('click', () => {
    // 1. Envia a mensagem para o Service Worker (background.js)
    chrome.runtime.sendMessage({ action: 'START_LABEL_INPUT' });
    
    // 2. Fecha o pop-up imediatamente
    window.close();
});