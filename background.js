// Ficheiro: background.js

/**
 * 1. Ouve o clique no ícone da extensão na barra de ferramentas.
 */
chrome.action.onClicked.addListener((tab) => {
  // 2. Injeta o 'content-script.js' na aba ativa.
  // Este script será responsável por permitir ao usuário selecionar a área.
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js']
  });
});

/**
 * 3. Ouve mensagens vindas de outros scripts (como o content-script).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Verifica se é a mensagem que esperamos do content-script com as coordenadas
  if (request.type === 'CROP_AREA') {
    const { x, y, w, h } = request.data;

    // 4. Tira um "print" da aba visível.
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      // Verifica se houve erro na captura
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("Não foi possível capturar a aba:", chrome.runtime.lastError?.message);
        return;
      }

      // 5. Chama a função para recortar a imagem.
      // Esta função é assíncrona, por isso usamos .then()
      cropImage(dataUrl, x, y, w, h)
        .then(croppedDataUrl => {
          // 6. Abre a nova aba (print.html) para pré-visualização
          chrome.tabs.create({ url: "print.html" }, (newTab) => {
            
            // 7. ENVIA A IMAGEM RECORTADA:
            // Precisamos esperar a nova aba carregar completamente
            // antes de tentar enviar a imagem para ela.
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === newTab.id && info.status === 'complete') {
                // Remove o "ouvinte" para não ser executado múltiplas vezes
                chrome.tabs.onUpdated.removeListener(listener);
                
                // Envia a imagem recortada para o script 'print.js'
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

    // Retorna 'true' para indicar que a resposta será enviada de forma assíncrona.
    // Isso mantém a porta de comunicação aberta.
    return true;
  }
});

/**
 * Função Auxiliar: Recorta a Imagem
 * Usa OffscreenCanvas para funcionar dentro do Service Worker (background.js).
 * * @param {string} dataUrl - A imagem da tela inteira em Base64.
 * @param {number} cropX - Coordenada X do recorte.
 * @param {number} cropY - Coordenada Y do recorte.
 * @param {number} cropWidth - Largura do recorte.
 * @param {number} cropHeight - Altura do recorte.
 * @returns {Promise<string>} - A nova imagem recortada em Base64.
 */
async function cropImage(dataUrl, cropX, cropY, cropWidth, cropHeight) {
  // Converte o dataUrl (Base64) para um Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Cria um ImageBitmap a partir do Blob (eficiente em workers)
  const imageBitmap = await createImageBitmap(blob);

  // Cria um "canvas" fora da tela (Offscreen) com o tamanho do recorte
  const canvas = new OffscreenCanvas(cropWidth, cropHeight);
  const ctx = canvas.getContext('2d');

  // Desenha *apenas* a porção da imagem que queremos no canvas
  // Sintaxe: drawImage(imagem, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(
    imageBitmap,
    cropX,      // Ponto X inicial na *imagem de origem*
    cropY,      // Ponto Y inicial na *imagem de origem*
    cropWidth,  // Largura da *área de origem*
    cropHeight, // Altura da *área de origem*
    0,          // Ponto X inicial no *canvas de destino* (sempre 0)
    0,          // Ponto Y inicial no *canvas de destino* (sempre 0)
    cropWidth,  // Largura no *canvas de destino*
    cropHeight  // Altura no *canvas de destino*
  );

  // Converte o canvas recortado de volta para um Blob
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

  // Converte o Blob recortado de volta para um dataUrl (Base64)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(croppedBlob);
  });
}