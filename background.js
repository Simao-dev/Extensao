// Ficheiro: background.js - VERSÃO FINAL ESTÁVEL PARA MV3 (CORRIGIDA)

/**
 * Ouve mensagens vindas de outros scripts.
 * Usa o padrão de retornar 'true' para indicar que a resposta (sendResponse) virá de forma assíncrona.
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
        // Retorna false para operações síncronas.
        return false; 
    }

    // ==========================================================
    // AÇÃO 3: RECEBE COORDENADAS E FAZER O RECORTE (do content-script.js)
    // ESTA AÇÃO GERA A IMAGEM E RESPONDE DE VOLTA AO content-script.js
    // ==========================================================
    if (request.type === "CROP_AREA") {
        
        const { x, y, w, h, dpr } = request.data;
        
        if (w < 5 || h < 5) { 
            console.warn("Área de seleção muito pequena. Abortando print.");
            // Envia a resposta de erro...
            sendResponse({ status: 'ERROR', message: 'Área muito pequena' });
            // ...e retorna true para informar ao Chrome que a resposta foi enviada
            // (Mesmo que síncrona, a mensagem é tratada como assíncrona no final do bloco).
            return true; // <-- CORREÇÃO: RETORNA TRUE AQUI
        }
        
        const pixelRatio = dpr || 1;
        const finalX = x * pixelRatio;
        const finalY = y * pixelRatio;
        const finalW = w * pixelRatio;
        const finalH = h * pixelRatio;

        // Inicia o Processo Assíncrono e usa Promises para garantir o sendResponse
        new Promise((resolve, reject) => {
            
            // 3. Tira um "print" da aba visível.
            chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    reject(new Error("Falha na captura: " + chrome.runtime.lastError?.message || "Data URL Vazia."));
                    return;
                }
                
                // 4. Chama a função para recortar a imagem.
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
        
        // Retorna true APENAS para esta mensagem que é assíncrona.
        // O canal de comunicação será fechado após o sendResponse (sucesso ou erro).
        return true; 
    } 

    // ==========================================================
    // AÇÃO 4: ABRIR ABA DE IMPRESSÃO (do content-script.js)
    // ESTA AÇÃO É DISPARADA APÓS O content-script RECEBER A IMAGEM.
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
    
    return false;
});

/**
 * Função Auxiliar: Recorta a Imagem.
 * Esta versão é robusta para o Service Worker (MV3) e usa APIs corretas (fetch, createImageBitmap).
 */
async function cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight) {
    if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error("Dimensões de recorte inválidas.");
    }
    
    // 1. Converte o DataURL (string) em Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // 2. Cria o ImageBitmap a partir do Blob (Método correto para Service Workers)
    const imageBitmap = await createImageBitmap(blob);

    // 3. Cria e configura o OffscreenCanvas
    const canvas = new OffscreenCanvas(cropWidth, cropHeight);
    const ctx = canvas.getContext("2d");

    // 4. Desenha apenas a área selecionada no novo Canvas
    ctx.drawImage(
        imageBitmap,
        cropX, cropY, cropWidth, cropHeight, 
        0, 0, cropWidth, cropHeight 
    );

    // 5. Converte o canvas recortado em Blob
    const croppedBlob = await canvas.convertToBlob({ type: "image/png" });

    // 6. Retorna a DataURL.
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(croppedBlob);
    });
}