// Ficheiro: background.js - VERSÃO COMPLETA COM SUPORTE A POP-UP E DUAS AÇÕES

/**
 * 1. Ouve mensagens vindas de outros scripts (popup.js, content-script.js).
 * Este é agora o ponto de partida central da sua lógica.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // ==========================================================
    // AÇÃO 1: INICIAR A SELEÇÃO DE TELA (do popup.js)
    // ==========================================================
    if (request.action === 'START_PRINT_SELECTION') {
        // Encontra a aba ativa para injetar o content-script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];

            // Verifica se a URL é segura antes de injetar (EVITA ERRO chrome://)
            if (tab && !tab.url.startsWith('chrome://')) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content-script.js']
                });
            } else {
                console.warn("Extensão bloqueada em páginas internas do Chrome.");
            }
        });
        return true;
    }

    // ==========================================================
    // AÇÃO 2: CRIAR ETIQUETA DIGITADA (do popup.js)
    // ==========================================================
    if (request.action === 'START_LABEL_INPUT') {
        // Simplesmente abre a nova aba com o formulário
        chrome.tabs.create({ url: "label_input.html" });
        return true;
    }

    // ==========================================================
    // AÇÃO 3: RECEBER COORDENADAS E FAZER O RECORTE (do content-script.js)
    // ==========================================================
    if (request.type === 'CROP_AREA') {
        const { x, y, w, h, dpr } = request.data;

        // CORREÇÃO DO devicePixelRatio (DPR):
        const pixelRatio = dpr || 1;
        const finalX = x * pixelRatio;
        const finalY = y * pixelRatio;
        const finalW = w * pixelRatio;
        const finalH = h * pixelRatio;

        // 4. Tira um "print" da aba visível.
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) {
                console.error("Não foi possível capturar a aba:", chrome.runtime.lastError?.message);
                return;
            }

            // 5. Chama a função para recortar a imagem, usando as COORDENADAS CORRIGIDAS.
            cropImage(dataUrl, finalX, finalY, finalW, finalH)
                .then(croppedDataUrl => {
                    // 6. Abre a nova aba (print.html)
                    chrome.tabs.create({ url: "print.html" }, (newTab) => {

                        // 7. Envia a imagem recortada após a aba carregar
                        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                            if (tabId === newTab.id && info.status === 'complete') {
                                chrome.tabs.onUpdated.removeListener(listener);

                                chrome.tabs.sendMessage(newTab.id, {
                                    type: 'PRINT_IMAGE',
                                    image: croppedDataUrl
                                });
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error("Erro ao recortar a imagem:", error);
                });
        });

        // Mantém a porta aberta para a resposta assíncrona
        return true;
    }
});

/**
 * Função Auxiliar: Recorta a Imagem.
 * Usa OffscreenCanvas para manipulação de imagem no Service Worker.
 */
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