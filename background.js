// IMPORTAÇÃO DA BIBLIOTECA jsQR 
try {
    importScripts('lib/jsQR.js'); 
} catch (e) {
    console.error("Erro ao carregar jsQR.js no Service Worker:", e);
}

// FUNÇÃO DE DECODIFICAÇÃO 
function decodeQRCode(imageData) {
    if (!self.jsQR) { 
        return "Erro: jsQR não está definido.";
    }

    const code = self.jsQR(
        imageData.data,
        imageData.width,
        imageData.height
    );

    return code ? code.data : null; 
}


// FUNÇÃO DE RECORTAR IMAGEM 
async function cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight) {
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


// FUNÇÃO DE PROCESSAMENTO DO QR CODE
async function processQRCode(dataUrl, cropX, cropY, cropWidth, cropHeight, tabId) {
    const finalX = Math.round(cropX);
    const finalY = Math.round(cropY);
    const finalW = Math.round(cropWidth);
    const finalH = Math.round(cropHeight);

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    createImageBitmap(blob)
        .then(imageBitmap => {
            const canvas = new OffscreenCanvas(finalW, finalH);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                imageBitmap,
                finalX, finalY, finalW, finalH,
                0, 0, finalW, finalH
            );
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = decodeQRCode(imageData);
            
            chrome.tabs.sendMessage(tabId, {
                type: 'QR_CODE_RESULT',
                data: { result: qrResult || "Nenhum QR Code válido encontrado na área selecionada." }
            }, 
            
            () => { 
                if (chrome.runtime.lastError) {
                    console.warn(`Erro (silenciado) ao enviar QR_CODE_RESULT para a tab ${tabId}:`, chrome.runtime.lastError.message);
                }
            });
        })
        .catch(error => {
            console.error("Erro no processamento do QR Code:", error);
            
            chrome.tabs.sendMessage(tabId, {
                type: 'QR_CODE_RESULT',
                data: { result: `Erro ao processar QR Code: ${error.message}` }
            }, () => { 
                if (chrome.runtime.lastError) {
                    console.warn(`Erro (silenciado) ao enviar QR_CODE_RESULT para a tab ${tabId}:`, chrome.runtime.lastError.message);
                }
            });
        });
}


// LISTENERS DE MENSAGENS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // INICIAR SELEÇÃO PARA IMPRESSÃO
    if (request.action === 'START_PRINT_SELECTION') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && !tab.url.startsWith('chrome://')) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['print-selection.js'] 
                });
            } else {
                console.warn("Extensão bloqueada em páginas internas do Chrome.");
            }
        });
        return true;
    }


    // INICIAR SELEÇÃO PARA LEITURA QR CODE
    if (request.action === 'START_QR_READING') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && !tab.url.startsWith('chrome://')) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['qr-selection.js'] 
                });
            } else {
                console.warn("Extensão bloqueada em páginas internas do Chrome.");
            }
        });
        return true;
    }


    // RECEBER ÁREA SELECIONADA DO SCRIPT DE IMPRESSÃO
    if (request.type === 'CROP_AREA') { 
        const tabId = sender.tab.id;
        const { x, y, w, h, dpr } = request.data;
        
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            
            // Lógica de IMPRESSÃO
            cropImage(dataUrl, x * dpr, y * dpr, w * dpr, h * dpr)
            .then(croppedDataUrl => {
                chrome.tabs.create({ url: "print.html" }, (newTab) => {
                    const listener = function(tabId, info) {
                        if (tabId === newTab.id && info.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener);

                            chrome.tabs.sendMessage(newTab.id, {
                                type: 'PRINT_IMAGE',
                                image: croppedDataUrl
                            }, 
                            
                            () => { 
                                if (chrome.runtime.lastError) {
                                    console.error('Erro ao enviar PRINT_IMAGE:', chrome.runtime.lastError.message);
                                }
                            });
                        }
                    };
                    chrome.tabs.onUpdated.addListener(listener);
                });
            })
            .catch(error => {
                console.error("Erro ao recortar a imagem para impressão:", error);
            });
        });
        return true;
    }


    // RECEBER ÁREA SELECIONADA DO SCRIPT DE QR CODE 
    if (request.type === 'QR_AREA_SELECTED') {
        const tabId = sender.tab.id;
        const { x, y, w, h, dpr } = request.data;
        
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            
            // Lógica de LEITURA QR CODE
            processQRCode(dataUrl, x * dpr, y * dpr, w * dpr, h * dpr, tabId);
        });
        return true;
    }


    // IMPRIMIR ETIQUETA 
    if (request.action === 'START_LABEL_PRINT') {
        const { content } = request.data;
        
        chrome.tabs.create({ url: "print.html" }, (newTab) => {
            const listener = function(tabId, info) {
                if (tabId === newTab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    
                    chrome.tabs.sendMessage(newTab.id, {
                        type: 'PRINT_LABEL',
                        content: content
                    }, 
                    //Adiciona callback para evitar "Receiving end does not exist"
                    () => { 
                        if (chrome.runtime.lastError) {
                            console.error('Erro ao enviar PRINT_LABEL:', chrome.runtime.lastError.message);
                        }
                    });
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
        return true;
    }
});