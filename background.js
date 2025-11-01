// Ficheiro: background.js - VERSÃO COMPLETA COM SUPORTE A POP-UP E DUAS AÇÕES

// ... (Restante do código: AÇÃO 1, AÇÃO 3 e função cropImage) ...

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // ==========================================================
    // AÇÃO 1: INICIAR A SELEÇÃO DE TELA (do popup.js)
    // ==========================================================
    if (request.action === 'START_PRINT_SELECTION') {
        // ... (código para injetar content-script.js) ...
        return true;
    }

    // ==========================================================
    // NOVA AÇÃO: IMPRIMIR ETIQUETA (do popup.js)
    // ==========================================================
    if (request.action === 'START_LABEL_PRINT') {
        const { content } = request.data;
        
        // 1. Abre a nova aba (reutilizando print.html)
        chrome.tabs.create({ url: "print.html" }, (newTab) => {
            
            // 2. Envia o conteúdo da etiqueta após a aba carregar completamente
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === newTab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);

                    // 3. Envia o TEXTO para o print.js
                    chrome.tabs.sendMessage(newTab.id, {
                        type: 'PRINT_LABEL', // Novo tipo de mensagem
                        content: content
                    });
                }
            });
        });
        return true;
    }


    // ==========================================================
    // AÇÃO 3: RECEBER COORDENADAS E FAZER O RECORTE (do content-script.js)
    // ==========================================================
    if (request.type === 'CROP_AREA') {
        // ... (código para recortar imagem e enviar para print.html) ...
        return true;
    }
});

/**
 * Função Auxiliar: Recorta a Imagem.
 * Usa OffscreenCanvas para manipulação de imagem no Service Worker.
 */
async function cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight) {
    // ... (código da função cropImage) ...
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        imageBitmap,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );

    const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
    });
}