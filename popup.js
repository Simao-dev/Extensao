// popup.js

document.addEventListener('DOMContentLoaded', function() {
    
    // === 1. Lógica do Gerador de QR Code (Alternar Visibilidade) ===
    const showQrButton = document.getElementById('btn-show-qr-generator');
    const qrSection = document.getElementById('qr-generator-section');
    const labelSection = document.getElementById('label-input-section'); // NOVO

    // Função auxiliar para alternar a visibilidade de uma seção
    function toggleSection(sectionElement) {
        if (sectionElement.style.display === 'none' || sectionElement.style.display === '') {
            sectionElement.style.display = 'block';
        } else {
            sectionElement.style.display = 'none';
        }
    }

    if (showQrButton && qrSection) {
        showQrButton.addEventListener('click', function() {
            toggleSection(qrSection);
            // Esconde outras seções, se estiverem abertas
            if (labelSection && labelSection.style.display === 'block') {
                 labelSection.style.display = 'none';
            }
        });
    }

    // Função assíncrona para lidar com as ações da extensão
    async function handleExtensionAction(action) {
        // Verifica se a API da extensão está disponível
        if (typeof chrome.runtime === 'undefined' || !chrome.runtime.sendMessage) {
            console.error("Erro: chrome.runtime.sendMessage não está disponível. Recarregue a extensão.");
            return;
        }

        // Envia a mensagem para o background.js
        chrome.runtime.sendMessage({ action: action }, function(response) {
            // Se houver um erro do Chrome API (ex: Service Worker inativo ou erro no destino)
            if (chrome.runtime.lastError) {
                 console.warn(`Erro ao enviar mensagem para background (${action}):`, chrome.runtime.lastError.message);
                 // Se o erro for de conexão, pode ser necessário recarregar o Service Worker.
            }
            // Não faz nada com a resposta, apenas registra
        });
        
        // Fecha o popup após iniciar a ação
        window.close(); 
    }

    // === 2. Lógica para o botão "Imprimir Seleção (Print)" ===
    document.getElementById('btn-print-selection').addEventListener('click', () => {
        handleExtensionAction("START_PRINT_SELECTION");
    });
    
    // === 3. Lógica para o botão "Criar Etiqueta (Digitada)" ===
    document.getElementById('btn-label-input').addEventListener('click', () => {
        // Altera a visibilidade da seção de etiqueta
        if (labelSection) {
            toggleSection(labelSection);
             // Esconde outras seções, se estiverem abertas
            if (qrSection.style.display === 'block') {
                 qrSection.style.display = 'none';
            }
        }
    });

    // ==========================================================
    // === NOVO: 4. Lógica de Impressão de Etiqueta no Popup ===
    // (Migrado de label_input.js)
    // ==========================================================
    const printLabelPopupBtn = document.getElementById('print-label-popup-btn');
    if (printLabelPopupBtn) {
        printLabelPopupBtn.addEventListener('click', () => {
            // 1. Captura os valores dos inputs
            const clientName = document.getElementById('client-name').value;
            const orderNumber = document.getElementById('order-number').value;
            
            const contentDiv = document.getElementById('label-content');
            
            // 2. Formata o texto para a etiqueta
            const formattedText = 
                `CLIENTE: ${clientName}\n` +
                `PEDIDO: ${orderNumber}\n` +
                `---------------------------\n` +
                `IMPRESSO EM: ${new Date().toLocaleDateString('pt-BR')}`;
            
            // 3. Coloca o texto formatado na div de impressão e a exibe (temporariamente)
            contentDiv.textContent = formattedText; 
            contentDiv.style.display = 'block';

            // 4. Chama a janela de impressão
            window.print();

            // 5. Esconde a div de conteúdo de volta (após a impressão ou cancelamento)
            // Fecha o popup após a tentativa de impressão
            setTimeout(() => {
                contentDiv.style.display = 'none';
                window.close(); 
            }, 100); 
        });
    }
});