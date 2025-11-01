// Ficheiro: background.js - VERSÃO FINAL E SIMPLIFICADA (Retorna a imagem)

/**
 * Ouve mensagens vindas de outros scripts.
 * Usa o padrão assíncrono para retornar o DataURL da imagem recortada.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // ==========================================================
    // AÇÃO 1: INICIAR A SELEÇÃO DE TELA (do popup.js)
    // ==========================================================
    if (request.action === "START_PRINT_SELECTION") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && !tab.url.startsWith("chrome://")) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content-script.js"],
                });
            } else {
                console.warn("Extensão bloqueada em páginas internas do Chrome.");
            }
        });
        return false; 
    }

    // ==========================================================
    // AÇÃO 3: RECEBE COORDENADAS E FAZER O RECORTE (do content-script.js)
    // ==========================================================
    if (request.type === "CROP_AREA") {
        
        const { x, y, w, h, dpr } = request.data;
        
        if (w < 5 || h < 5) { 
            console.warn("Área de seleção muito pequena. Abortando print.");
            sendResponse({ status: 'ERROR', message: 'Área muito pequena' });
            return false; 
        }
        
        const pixelRatio = dpr || 1;
        const finalX = x * pixelRatio;
        const finalY = y * pixelRatio;
        const finalW = w * pixelRatio;
        const finalH = h * pixelRatio;

        // Retorna uma Promessa. A RESPOSTA (sendResponse) é o DataURL.
        return new Promise((resolve, reject) => {
            
            chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    reject(new Error("Falha na captura"));
                    return;
                }
                
                cropImage(dataUrl, finalX, finalY, finalW, finalH)
                    .then(croppedDataUrl => {
                        if (!croppedDataUrl) {
                            reject(new Error("Recorte retornou URL vazio."));
                            return;
                        }
                        // Resolve a Promessa com o DataURL da imagem.
                        resolve({ status: 'SUCCESS', image: croppedDataUrl });
                    })
                    .catch(reject);
            });
        })
        .then(response => {
            // Envia a resposta de sucesso para o content-script
            sendResponse(response);
        })
        .catch(error => {
            // Envia a resposta de erro para o content-script
            console.error("Erro no processo de CROP_AREA:", error);
            sendResponse({ status: 'ERROR', message: error.message });
        });
        
        // Retorna true APENAS para esta mensagem que é assíncrona
        return true; 
    } 
    
    return false;
});

/**
 * Função Auxiliar: Recorta a Imagem (Versão correta para Service Worker)
 * Permanece inalterada da última correção.
 */
async function cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight) {
    if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error("Dimensões de recorte inválidas.");
    }
    
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
        imageBitmap,
        cropX, cropY, cropWidth, cropHeight, 
        0, 0, cropWidth, cropHeight 
    );

    const croppedBlob = await canvas.convertToBlob({ type: "image/png" });

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(croppedBlob);
    });
}

// NOVO BLOCO DENTRO DO chrome.runtime.onMessage.addListener:

// ==========================================================
// AÇÃO 4: ABRIR ABA DE IMPRESSÃO (do content-script.js)
// ==========================================================
if (request.action === "OPEN_PRINT_TAB") {
    
    // Abre a nova aba (print.html)
    chrome.tabs.create({ url: "print.html" }, (newTab) => {
        const image = request.image;
        
        // Envia a imagem recortada após a aba carregar
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === newTab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener);

                chrome.tabs.sendMessage(newTab.id, {
                    type: "PRINT_IMAGE",
                    image: image, // Usa a imagem enviada pelo content-script
                });
            }
        });
    });
    return false;
}