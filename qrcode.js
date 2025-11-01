document.querySelector('.generate-qr-code').addEventListener('click', function (){
    // Captura os valores dos inputs
    var url = document.querySelector('.qr-url').value;
    // Converte o valor de 'size' para um número inteiro
    var size = parseInt(document.querySelector('.qr-size').value, 10); 

    // Referência ao container corrigido
    var qrcodeContainer = document.querySelector('#qrcode-container'); 

    // Limpa o conteúdo antes de gerar um novo QR Code
    qrcodeContainer.innerHTML = ''; 

    if (url && size && !isNaN(size)) {
        var qrcode = new QRCode(qrcodeContainer, {
            text: url,
            width: size,
            height: size,
            colorDark: "black",
            colorLight: "white",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // Mensagem de erro caso os campos estejam vazios/inválidos
        qrcodeContainer.innerHTML = 'Preencha a URL/texto e um tamanho válido.'; 
    }
});

// popup.js

document.addEventListener('DOMContentLoaded', function() {
    // 1. Lógica para mostrar o gerador de QR Code
    const showQrButton = document.getElementById('btn-show-qr-generator');
    const qrSection = document.getElementById('qr-generator-section');

    if (showQrButton && qrSection) {
        showQrButton.addEventListener('click', function() {
            // Alterna a exibição:
            if (qrSection.style.display === 'none' || qrSection.style.display === '') {
                // Se estiver escondido, mostra como um bloco
                qrSection.style.display = 'block';
            } else {
                // Se estiver visível, esconde
                qrSection.style.display = 'none';
            }
        });
    }

    // Se houver outras lógicas de botões (print/etiqueta), elas viriam aqui
});

// Nota: O código de geração do QR Code está no qrcode.js