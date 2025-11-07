document.addEventListener('DOMContentLoaded', function() {

    //Elementos DOM 
    const generateButton = document.querySelector('.generate-qr-code');
    const qrcodeContainer = document.querySelector('#qrcode-container'); 
    const printButton = document.getElementById('btn-print-qrcode'); 

    // Lógica de Geração do QR Code (Listener no botão "Gerar QRCODE")
    if (generateButton) {
        generateButton.addEventListener('click', function () {
            var url = document.querySelector('.qr-url').value;
            var size = parseInt(document.querySelector('.qr-size').value, 10); 
            
            // Limpa o conteúdo e esconde o botão de impressão antes de tentar gerar
            if (qrcodeContainer) qrcodeContainer.innerHTML = ''; 
            if (printButton) printButton.style.display = 'none';

            if (url && size && !isNaN(size)) {
                // Geração do QR Code (garante que o container existe)
                if (qrcodeContainer && typeof QRCode !== 'undefined') {
                    var qrcode = new QRCode(qrcodeContainer, {
                        text: url,
                        width: size,
                        height: size,
                        colorDark: "black",
                        colorLight: "white",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }
                
                // MOSTRA o botão de impressão após a geração bem-sucedida
                if (printButton) printButton.style.display = 'block';

            } else {
                if (qrcodeContainer) qrcodeContainer.innerHTML = 'Preencha a URL/texto e um tamanho válido.'; 
            }
        });
    }


    // Lógica de Impressão (Listener no botão "Imprimir QR Code")
    if (printButton) {
        printButton.addEventListener('click', function() {
            let qrcodeImg = qrcodeContainer ? qrcodeContainer.querySelector('canvas') || qrcodeContainer.querySelector('img') : null;
            
            if (qrcodeImg) {
                let dataUrl = qrcodeImg.src; 

                // Se for um canvas, precisamos converter para Data URL
                if (qrcodeImg.tagName === 'CANVAS' && typeof qrcodeImg.toDataURL === 'function') {
                    dataUrl = qrcodeImg.toDataURL('image/png');
                }
                
                if (dataUrl) {
                    // Abre em uma nova guia removendo os parâmetros de altura/largura.
                    const printWindow = window.open('', '_blank'); 
                    
                    // Constrói o HTML da janela de impressão
                    printWindow.document.write('<html><head><title>Imprimir QR Code</title></head><body>');
                    
                    // CSS para centralizar
                    printWindow.document.write('<style>');
                    printWindow.document.write('body { display: block; margin: 0; padding: 0; }'); 
                    printWindow.document.write('img { display: block; margin: 0 auto; padding-top: 5mm; }');
                    printWindow.document.write('</style>');
                    
                    // Adiciona a imagem usando a Data URL
                    printWindow.document.write(`<img src="${dataUrl}" alt="QR Code para impressão">`);
                    
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    
                    // Inicia o diálogo de impressão
                    printWindow.onload = function() {
                        printWindow.print();
                    };
                } else {
                    console.error("Não foi possível extrair a URL da imagem do QR Code.");
                }
            } else {
                 console.warn("Nenhum QR Code gerado para imprimir.");
            }
        });
    }
});