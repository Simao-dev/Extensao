// popup.js

document.addEventListener('DOMContentLoaded', function() {
    
    // === Elementos ===
    const showQrButton = document.getElementById('btn-show-qr-generator');
    const qrSection = document.getElementById('qr-generator-section');
    const labelSection = document.getElementById('label-input-section');
    const printLabelPopupBtn = document.getElementById('print-label-popup-btn');

    // Função auxiliar para alternar a visibilidade de uma seção
    function toggleSection(sectionElement) {
        if (sectionElement.style.display === 'none' || sectionElement.style.display === '') {
            sectionElement.style.display = 'block';
        } else {
            sectionElement.style.display = 'none';
        }
    }

    // Função de comunicação geral (usada apenas para Imprimir Seleção)
    async function handleExtensionAction(action) {
        if (typeof chrome.runtime === 'undefined' || !chrome.runtime.sendMessage) {
            console.error("Erro: chrome.runtime.sendMessage não está disponível.");
            return;
        }

        chrome.runtime.sendMessage({ action: action }, function(response) {
            if (chrome.runtime.lastError) {
                 console.warn(`Erro ao enviar mensagem para background (${action}):`, chrome.runtime.lastError.message);
            }
        });
        
        // Fecha o popup após iniciar a ação de seleção de tela
        window.close(); 
    }

    // === 1. Lógica do Gerador de QR Code (Alternar Visibilidade) ===
    if (showQrButton && qrSection) {
        showQrButton.addEventListener('click', function() {
            toggleSection(qrSection);
            if (labelSection && labelSection.style.display === 'block') {
                 labelSection.style.display = 'none';
            }
        });
    }
    
    // === 2. Lógica para o botão "Imprimir Seleção (Print)" ===
    document.getElementById('btn-print-selection').addEventListener('click', () => {
        handleExtensionAction("START_PRINT_SELECTION");
    });
    
    // === 3. Lógica para o botão "Criar Etiqueta (Digitada)" (Alterna formulário) ===
    document.getElementById('btn-label-input').addEventListener('click', () => {
        if (labelSection) {
            toggleSection(labelSection);
            if (qrSection.style.display === 'block') {
                 qrSection.style.display = 'none';
            }
        }
    });

    // ==========================================================
    // === 4. Lógica de Impressão de Etiqueta (Envia para o Background) ===
    // ==========================================================
    if (printLabelPopupBtn) {
        printLabelPopupBtn.addEventListener('click', () => {
            // 1. Captura os valores dos inputs
            const clientName = document.getElementById('client-name').value;
            const orderNumber = document.getElementById('order-number').value;
            
            // 2. Formata o texto para a etiqueta
            const formattedText = 
                `CLIENTE: ${clientName}\n` +
                `PEDIDO: ${orderNumber}\n` +
                `---------------------------\n` +
                `IMPRESSO EM: ${new Date().toLocaleDateString('pt-BR')}`;
            
            // 3. ENVIA a mensagem para o background.js para iniciar a impressão na nova aba
            chrome.runtime.sendMessage({
                action: 'START_LABEL_PRINT', // Nova ação
                data: {
                    content: formattedText // Conteúdo formatado a ser impresso
                }
            }, function() {
                 if (chrome.runtime.lastError) {
                    console.error('Erro ao enviar mensagem para background.js:', chrome.runtime.lastError.message);
                 }
                 // 4. Fecha o popup
                 window.close();
            });
        });
    }
});