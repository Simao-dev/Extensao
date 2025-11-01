// Lógica de Geração do QR Code (Listener no botão "Gerar QRCODE")
document.querySelector('.generate-qr-code').addEventListener('click', function (){
    var url = document.querySelector('.qr-url').value;
    var size = parseInt(document.querySelector('.qr-size').value, 10); 
    
    // Elementos do HTML
    var qrcodeContainer = document.querySelector('#qrcode-container'); 
    var printButton = document.getElementById('btn-print-qrcode'); 

    // Limpa o conteúdo e ESCONDE o botão de impressão antes de tentar gerar
    qrcodeContainer.innerHTML = ''; 
    printButton.style.display = 'none';

    if (url && size && !isNaN(size)) {
        // Geração do QR Code
        var qrcode = new QRCode(qrcodeContainer, {
            text: url,
            width: size,
            height: size,
            colorDark: "black",
            colorLight: "white",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // MOSTRA o botão de impressão após a geração bem-sucedida
        printButton.style.display = 'block';

    } else {
        // Mensagem de erro caso os campos estejam vazios/inválidos
        qrcodeContainer.innerHTML = 'Preencha a URL/texto e um tamanho válido.'; 
    }
});


// Lógica de Impressão (Listener no botão "Imprimir QR Code")
document.addEventListener('DOMContentLoaded', function() {
    const printButton = document.getElementById('btn-print-qrcode');

    if (printButton) {
        printButton.addEventListener('click', function() {
            const qrContainer = document.querySelector('#qrcode-container');

            if (qrContainer && qrContainer.firstChild) {
                const qrElement = qrContainer.firstChild; 

                let dataUrl = '';

                if (qrElement.tagName === 'CANVAS') {
                    dataUrl = qrElement.toDataURL('image/png');
                } else if (qrElement.tagName === 'IMG') {
                    dataUrl = qrElement.src;
                }
                
                if (dataUrl) {
                    // --- ALTERAÇÃO FEITA AQUI ---
                    // Abre em uma nova guia removendo os parâmetros de altura/largura.
                    const printWindow = window.open('', '_blank'); 
                    
                    // Constrói o HTML da janela de impressão
                    printWindow.document.write('<html><head><title>Imprimir QR Code</title></head><body>');
                    
                    // CSS para centralizar
                    printWindow.document.write('<style>');
                    printWindow.document.write('body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }'); 
                    printWindow.document.write('img { max-width: 100%; max-height: 100%; }');
                    printWindow.document.write('</style>');
                    
                    // Adiciona a imagem usando a Data URL
                    printWindow.document.write(`<img src="${dataUrl}" alt="QR Code para impressão">`);
                    
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    
                    // Inicia o diálogo de impressão
                    printWindow.onload = function() {
                        printWindow.print();
                        // printWindow.close(); 
                    };
                } else {
                    console.error("Não foi possível extrair a URL da imagem do QR Code.");
                }
            }
        });
    }
});