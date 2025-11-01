// Ficheiro: background.js

/**
 * 1. Ouve o clique no ícone da extensão na barra de ferramentas.
 * Este é o ponto de partida para a sua extensão.
 */
chrome.action.onClicked.addListener((tab) => {
  // 2. Injeta o 'content-script.js' na aba ativa.
  // Este script é responsável por permitir ao usuário selecionar a área.
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js']
  });
});

/**
 * 3. Ouve mensagens vindas de outros scripts (como o content-script).
 * Aqui é onde o content-script envia as coordenadas da seleção.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Verifica se a mensagem contém a área de recorte que esperamos
  if (request.type === 'CROP_AREA') {
    const { x, y, w, h, dpr } = request.data; 

    // CORREÇÃO DO devicePixelRatio (DPR):
    // Multiplica as coordenadas do CSS (content-script) pelo DPR para obter 
    // as coordenadas de pixel *reais* do dispositivo, necessárias para o recorte.
    const pixelRatio = dpr || 1; // Garante que seja 1.0 se for indefinido
    const finalX = x * pixelRatio;
    const finalY = y * pixelRatio;
    const finalW = w * pixelRatio;
    const finalH = h * pixelRatio;
    
    // 4. Tira um "print" da aba visível.
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      // Verifica se houve erro na captura
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("Não foi possível capturar a aba:", chrome.runtime.lastError?.message);
        return;
      }

      // 5. Chama a função assíncrona para recortar a imagem, usando as COORDENADAS CORRIGIDAS.
      cropImage(dataUrl, finalX, finalY, finalW, finalH)
        .then(croppedDataUrl => {
          // 6. Abre a nova aba (print.html) para pré-visualização e impressão.
          chrome.tabs.create({ url: "print.html" }, (newTab) => {
            
            // 7. ENVIA A IMAGEM RECORTADA:
            // Ouve o evento de atualização da aba para garantir que 'print.html'
            // esteja totalmente carregado antes de enviar a imagem.
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === newTab.id && info.status === 'complete') {
                // Remove o ouvinte para não ser executado em futuras atualizações
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Envia a imagem recortada para o script 'print.js' dentro da nova aba.
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

    // Retorna 'true' para manter o canal de comunicação aberto (operação assíncrona).
    return true;
  }
});

/**
 * Função Auxiliar: Recorta a Imagem.
 * Usa OffscreenCanvas e createImageBitmap para manipulação de imagem eficiente 
 * dentro do Service Worker do Chrome (background.js).
 * @param {string} dataUrl - A imagem da tela inteira em Base64.
 * @param {number} cropX - Coordenada X do recorte (já corrigida pelo DPR).
 * @param {number} cropY - Coordenada Y do recorte (já corrigida pelo DPR).
 * @param {number} cropWidth - Largura do recorte (já corrigida pelo DPR).
 * @param {number} cropHeight - Altura do recorte (já corrigida pelo DPR).
 * @returns {Promise<string>} - A nova imagem recortada em Base64.
 */
async function cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight) {
  // 1. Converte o dataUrl (Base64) para um Blob para ser processado
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // 2. Cria um ImageBitmap a partir do Blob
  const imageBitmap = await createImageBitmap(blob);

  // 3. Cria um "canvas" fora da tela (OffscreenCanvas) com o tamanho do recorte
  const canvas = new OffscreenCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');

  // 4. Desenha *apenas* a porção da imagem que queremos no canvas (o recorte)
  // drawImage(imagem, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    imageBitmap,
    cropX,      // Ponto X inicial na imagem de origem
    cropY,      // Ponto Y inicial na imagem de origem
    cropWidth,  // Largura da área de origem
    cropHeight, // Altura da área de origem
    0,          // Ponto X inicial no canvas de destino (0,0)
    0,          // Ponto Y inicial no canvas de destino (0,0)
    cropWidth,  // Largura no canvas de destino
    cropHeight  // Altura no canvas de destino
  );

  // 5. Converte o canvas recortado de volta para um Blob (tipo png)
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

  // 6. Converte o Blob recortado de volta para um dataUrl (Base64) para envio
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(croppedBlob);
  });
}