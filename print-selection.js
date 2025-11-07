(() => {
  // VERIFICAÇÃO: Se o script já foi injetado (impede a sobreposição de overlays)
  if (document.getElementById('ss-print-overlay')) {
    return;
  }

  // CÓDIGO DO OVERLAY, SELEÇÃO E LIMPEZA 
  
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
  let startX = 0;
  let startY = 0;

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
    if (e.key === 'Escape' || e.keyCode === 27) {
        cleanup();
    }
  };

  const onMouseDown = (e) => {
    if (e.target !== overlay && e.target !== document.body) return;
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.visibility = 'visible';
    e.preventDefault();
    e.stopPropagation();
  };

  const onMouseMove = (e) => {
    if (!isDrawing) return;
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
    const dpr = window.devicePixelRatio || 1;
    cleanup(); 
    
    if (w > 5 && h > 5) {
      // ENVIA A MENSAGEM COM TIPO EXCLUSIVO PARA IMPRESSÃO
      chrome.runtime.sendMessage({
        type: 'CROP_AREA', 
        data: { x, y, w, h, dpr }
      });
    }
  };

  overlay.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);
  
})();