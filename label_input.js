
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('print-label-btn').addEventListener('click', () => {
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
        
        // 3. Coloca o texto formatado na div de impressão
        contentDiv.textContent = formattedText; 
        
        // 4. Chama a janela de impressão
        window.print();
    });
});