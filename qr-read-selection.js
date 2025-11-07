(() => {
  // VERIFICAÇÃO: Se o script já foi injetado
  if (document.getElementById('ss-print-overlay')) {
    return;
  }

  // O overlay semi-transparente que cobre a tela inteira
  const overlay = document.createElement('div');
  overlay.id = 'ss-print-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    cursor: crosshair;
    z-index: 99999998;
  `;
  document.body.appendChild(overlay);

  // A caixa de seleção que o usuário vai desenhar
  const selectionBox = document.createElement('div');
  selectionBox.id = 'ss-print-selection';
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #fff;
    background-color: rgba(255, 255, 255, 0.1);
    visibility: hidden; /* Começa invisível */
    z-index: 99999999;
  `;
  document.body.appendChild(selectionBox);

  // LÓGICA DE SELEÇÃO

  let isDrawing = false;
  let startX = 0;
  let startY = 0;

  // Função para "limpar" tudo (remover elementos e ouvintes)
  const cleanup = () => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
    if (document.body.contains(selectionBox)) document.body.removeChild(selectionBox);
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDrawing = true;
    startX = e.clientX; 
    startY = e.clientY;
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.visibility = 'visible';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    e.stopPropagation();

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  };

  const onMouseUp = (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    e.preventDefault();
    e.stopPropagation();

    const endX = e.clientX;
    const endY = e.clientY;

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    // Pega o "pixel ratio" da tela
    const dpr = window.devicePixelRatio || 1;

    cleanup(); 
    
    // Só envia a mensagem se a seleção tiver um tamanho válido
    if (w > 5 && h > 5) {
      chrome.runtime.sendMessage({
        type: 'QR_CROP_AREA', 
        data: { x, y, w, h, dpr }
      });
    }
  };

  // Permite cancelar a seleção pressionando a tecla 'Escape'
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
    }
  };

  //INICIALIZAÇÃO 
  overlay.addEventListener('mousedown', onMouseDown);
  document.addEventListener('keydown', onKeyDown);

  // Listener para receber o resultado da leitura do Background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'QR_CODE_RESULT') {
          const result = request.data.result;
          
          if (result && result.startsWith('Erro:')) {
               alert(`Erro na leitura do QR Code: ${result.substring(6)}`);
          } else if (result && result.startsWith('Nenhum')) {
               alert(result);
          } else if (result) {
               alert(`QR Code lido com sucesso: ${result}`);

          }
      }
  });

})();