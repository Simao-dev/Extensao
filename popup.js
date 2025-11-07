document.addEventListener('DOMContentLoaded', function() { 
    
    // Elementos DOM 
    const showQrGeneratorButton = document.getElementById('btn-show-qr-generator');
    const printSelectionButton = document.getElementById('btn-print-selection');
    const readQrButton = document.getElementById('btn-read-qrcode'); 
    
    const qrGeneratorSection = document.getElementById('qr-generator-section');
    
    // Função auxiliar para alternar a visibilidade de uma seção
    function toggleSection(sectionElement) {
        if (sectionElement.style.display === 'none' || sectionElement.style.display === '') {
            sectionElement.style.display = 'block';
        } else {
            sectionElement.style.display = 'none';
        }
    }

    // Função de comunicação geral (usada para Imprimir Seleção e Ler QR Code)
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

    // Lógica do Gerador de QR Code (Alternar Visibilidade)
    if (showQrGeneratorButton && qrGeneratorSection) {
        showQrGeneratorButton.addEventListener('click', function() {
            toggleSection(qrGeneratorSection);
        });
    }
    
    // Lógica para o botão "Imprimir Seleção (Print)" 
    if (printSelectionButton) {
        printSelectionButton.addEventListener('click', () => {
            handleExtensionAction("START_PRINT_SELECTION");
        });
    }
    
    // Lógica para o botão "Ler QR Code da Tela"
    if (readQrButton) {
        readQrButton.addEventListener('click', () => {
             handleExtensionAction("START_QR_READING"); 
        });
    }
    
});