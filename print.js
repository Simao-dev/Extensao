// Ficheiro: print.js - Versão unificada para Imagem ou HTML

document.addEventListener('DOMContentLoaded', () => {
    const printContent = document.getElementById('print-content');

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        // Recebe a imagem recortada
        if (request.type === 'PRINT_IMAGE') {
            const img = document.createElement('img');
            img.id = 'printImage';
            img.src = request.image;
            
            // O conteúdo da impressão é a imagem
            printContent.innerHTML = '';
            printContent.appendChild(img);
            
            // Chama a janela de impressão
            window.print();
        } 
        
        // NOVO: Recebe o HTML da etiqueta
        else if (request.type === 'PRINT_HTML') {
            // O conteúdo da impressão é o HTML gerado
            printContent.innerHTML = request.html;
            
            // Chama a janela de impressão
            window.print();
        }

        return true;
    });
});