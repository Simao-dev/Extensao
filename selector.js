(function() {
    // Verifica se o seletor já existe para evitar duplicatas
    if (document.getElementById('chrome-ext-overlay')) {
        return;
    }

    // Cria a camada de fundo escura
    const overlay = document.createElement('div');
    overlay.id = 'chrome-ext-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        z-index: 99999;
        cursor: crosshair;
    `;
    document.body.appendChild(overlay);

    // Cria o retângulo de seleção
    const selector = document.createElement('div');
    selector.style.cssText = `
        position: absolute;
        border: 2px dashed red;
        background: rgba(255, 255, 255, 0.1);
        pointer-events: none; /* Ignora cliques no retângulo */
        box-sizing: border-box;
    `;
    overlay.appendChild(selector);

    let isSelecting = false;
    let startX, startY;

    // 1. Início da seleção (mousedown)
    overlay.addEventListener('mousedown', (e) => {
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;

        selector.style.left = `${startX}px`;
        selector.style.top = `${startY}px`;
        selector.style.width = '0px';
        selector.style.height = '0px';
        selector.style.display = 'block';
    });

    // 2. Desenho da seleção (mousemove)
    overlay.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const x = Math.min(currentX, startX);
        const y = Math.min(currentY, startY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selector.style.left = `${x}px`;
        selector.style.top = `${y}px`;
        selector.style.width = `${width}px`;
        selector.style.height = `${height}px`;
    });

    // 3. Fim da seleção (mouseup) - Envia as coordenadas
    overlay.addEventListener('mouseup', (e) => {
        if (!isSelecting) return;
        isSelecting = false;

        const rect = selector.getBoundingClientRect();

        // Remove a camada de seleção imediatamente
        overlay.remove();

        // Envia as coordenadas para o popup.js/background script (o pop-up original já se fechou)
        chrome.runtime.sendMessage({
            action: "areaSelected",
            coords: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
            }
        });
    });

})();