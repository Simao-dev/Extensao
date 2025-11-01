(() => {
    // VERIFICAÇÃO: Se o script já foi injetado, não faça nada.
    if (document.getElementById("ss-print-overlay")) {
        return;
    }

    // --- CRIAÇÃO DOS ELEMENTOS VISUAIS ---

    // O overlay semi-transparente que cobre a tela inteira
    const overlay = document.createElement("div");
    overlay.id = "ss-print-overlay";
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
    const selectionBox = document.createElement("div");
    selectionBox.id = "ss-print-selection";
    selectionBox.style.cssText = `
        position: fixed;
        border: 2px dashed #fff;
        background-color: rgba(255, 255, 255, 0.1);
        visibility: hidden; /* Começa invisível */
        z-index: 99999999;
    `;
    document.body.appendChild(selectionBox);

    // --- LÓGICA DE SELEÇÃO (MOUSE) ---

    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    // Função para "limpar" tudo (remover elementos e ouvintes)
    const cleanup = () => {
        if (overlay.parentNode === document.body) {
            document.body.removeChild(overlay);
        }
        if (selectionBox.parentNode === document.body) {
            document.body.removeChild(selectionBox);
        }
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("keydown", onKeyDown);
    };

    // Função chamada quando o usuário pressiona o mouse
    const onMouseDown = (e) => {
        // Previne a página de fazer coisas como selecionar texto
        e.preventDefault();
        e.stopPropagation();

        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        // Posiciona a caixa de seleção e a torna visível
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = "0px";
        selectionBox.style.height = "0px";
        selectionBox.style.visibility = "visible";

        // Adiciona os ouvintes de movimento e de "soltar" o mouse
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    // Função chamada quando o usuário move o mouse (enquanto pressionado)
    const onMouseMove = (e) => {
        if (!isDrawing) return;

        e.preventDefault();
        e.stopPropagation();

        const currentX = e.clientX;
        const currentY = e.clientY;

        // Calcula a posição (left, top) e o tamanho (width, height)
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
    };

    // Função chamada quando o usuário solta o mouse
    const onMouseUp = (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        e.preventDefault();
        e.stopPropagation();

        const endX = e.clientX;
        const endY = e.clientY;

        // Calcula as coordenadas finais do retângulo
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const w = Math.abs(endX - startX);
        const h = Math.abs(endY - startY);

        // Pega o "pixel ratio" da tela (para telas Retina/4K)
        const dpr = window.devicePixelRatio || 1;

        // Remove os elementos visuais da página
        cleanup();

        // Só envia a mensagem se a seleção tiver um tamanho válido
        if (w > 5 && h > 5) {
            // 4. ENVIA A MENSAGEM PARA O BACKGROUND.JS E AGUARDA A IMAGEM RECORTADA
            chrome.runtime.sendMessage({
                type: "CROP_AREA",
                data: { x, y, w, h, dpr },
            }, (response) => {
                
                // Verifica se houve erro de comunicação
                if (chrome.runtime.lastError) {
                    console.error("Erro na comunicação com background:", chrome.runtime.lastError.message);
                    alert("Erro ao tentar capturar a tela. Tente novamente.");
                    return;
                }

                // Verifica se a resposta foi bem-sucedida
                if (response && response.status === 'SUCCESS' && response.image) {
                    
                    // A imagem foi gerada com sucesso. Envia uma nova mensagem para o background
                    // instruindo-o a abrir a aba de impressão e enviar a imagem.
                    chrome.runtime.sendMessage({
                        action: 'OPEN_PRINT_TAB',
                        image: response.image
                    });
                    
                } else if (response && response.status === 'ERROR') {
                    // Trata o erro de recorte (área muito pequena, falha na captura, etc.)
                    alert("Falha no recorte da imagem: " + response.message);
                } else {
                     alert("Erro desconhecido durante o recorte.");
                }
            });
        }
    };

    // Permite cancelar a seleção pressionando a tecla 'Escape'
    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            cleanup();
        }
    };

    // --- INICIALIZAÇÃO ---

    // Adiciona o ouvinte inicial de "mousedown" ao overlay
    overlay.addEventListener("mousedown", onMouseDown);
    // Adiciona o ouvinte para a tecla 'Escape'
    document.addEventListener("keydown", onKeyDown);
})();