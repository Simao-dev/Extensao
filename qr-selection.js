(() => {
  if (document.getElementById('ss-print-overlay')) return;

chrome.runtime.onMessage.addListener(function qrCodeResultListener(request) {
    if (request.type === 'QR_CODE_RESULT' && request.data) {
        cleanup();
        
        // BUSCA O TEMA SALVO PELO POPUP
        chrome.storage.local.get(['theme'], (result) => {
            const isDark = (result.theme === 'dark');
            // CHAMA O SEU MODAL PASSANDO O TEMA
            showCustomModal(request.data.result, isDark);
        });

        chrome.runtime.onMessage.removeListener(qrCodeResultListener);
    }
});

  //FUNÇÃO DO MODAL CUSTOMIZADO 
  function showCustomModal(text, isDarkMode) {
    const modalId = 'qr-result-modal';
    if (document.getElementById(modalId)) return;

    // Definição de cores baseada no tema
    const bgColor = isDarkMode ? '#374151' : '#ffffff';
    const textColor = isDarkMode ? '#f9fafb' : '#333333';
    const borderColor = isDarkMode ? '#4b5563' : '#ddd';
    const titleColor = isDarkMode ? '#e5e7eb' : '#4b185a';
    const inputBg = isDarkMode ? '#4b5563' : '#f9f9f9';

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${bgColor};
    color: ${textColor};
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    z-index: 100000000;
    width: 350px;
    font-family: sans-serif;
    text-align: center;
    border: 1px solid ${borderColor};
  `;

    modal.innerHTML = `
    <h3 style="margin: 0 0 15px; color: ${titleColor};">Resultado do QR Code</h3>
    <textarea readonly style="
      width: 95%;
      height: 40px;
      margin-bottom: 15px;
      padding: 10px;
      border: 1px solid ${borderColor};
      border-radius: 6px;
      resize: none;
      font-family: monospace;
      background: ${inputBg};
      color: ${textColor};
    ">${text}</textarea>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button id="copy-qr-btn" style="padding: 8px 15px; cursor: pointer; background: #8b5cf6; color: white; border: none; border-radius: 4px;">Copiar</button>
      <button id="close-qr-btn" style="padding: 8px 15px; cursor: pointer; background: #6c757d; color: white; border: none; border-radius: 4px;">Fechar</button>
    </div>
  `;

    document.body.appendChild(modal);

    // Lógica dos botões (igual à anterior)
    document.getElementById('copy-qr-btn').onclick = () => {
      navigator.clipboard.writeText(text);
      document.getElementById('copy-qr-btn').innerText = 'Copiado!';
    };
    document.getElementById('close-qr-btn').onclick = () => modal.remove();
  }
  //  FIM DA FUNÇÃO DO MODAL 

  // LÓGICA DE SELEÇÃO VISUAL 
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

  const selectionBox = document.createElement('div');
  selectionBox.id = 'ss-print-selection';
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #fff;
    background-color: rgba(255, 255, 255, 0.1);
    visibility: hidden; 
    z-index: 99999999;
  `;
  document.body.appendChild(selectionBox);

  let isDrawing = false;
  let startX = 0, startY = 0;

  function cleanup() {
    const overlay = document.getElementById('ss-print-overlay');
    const selectionBox = document.getElementById('ss-print-selection');
    if (overlay) overlay.remove();
    if (selectionBox) selectionBox.remove();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      chrome.runtime.onMessage.removeListener(qrCodeResultListener);
      cleanup();
    }
  };

  const onMouseDown = (e) => {
    if (e.target !== overlay && e.target !== document.body) return;
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.visibility = 'visible';
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
    const left = Math.min(startX, e.clientX);
    const top = Math.min(startY, e.clientY);
    const width = Math.abs(e.clientX - startX);
    const height = Math.abs(e.clientY - startY);
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  };

  const onMouseUp = (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    if (w > 5 && h > 5) {
      chrome.runtime.sendMessage({
        type: 'QR_AREA_SELECTED',
        data: {
          x: Math.min(startX, e.clientX),
          y: Math.min(startY, e.clientY),
          w, h,
          dpr: window.devicePixelRatio || 1
        }
      });
    } else {
      chrome.runtime.onMessage.removeListener(qrCodeResultListener);
      cleanup();
    }
  };

  overlay.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);
})();
