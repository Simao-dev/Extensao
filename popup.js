// popup.js

document.addEventListener('DOMContentLoaded', function() {
    
    // === 1. Lógica do Gerador de QR Code (Alternar Visibilidade) ===
    const showQrButton = document.getElementById('btn-show-qr-generator');
    const qrSection = document.getElementById('qr-generator-section');

    if (showQrButton && qrSection) {
        showQrButton.addEventListener('click', function() {
            // Alterna a exibição:
            if (qrSection.style.display === 'none' || qrSection.style.display === '') {
                qrSection.style.display = 'block';
            } else {
                qrSection.style.display = 'none';
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
        handleExtensionAction("START_LABEL_INPUT");
    });
});