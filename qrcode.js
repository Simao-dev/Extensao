document.querySelector('.generate-qr-code').addEventListener('click', function (){
    // Captura os valores dos inputs
    var url = document.querySelector('.qr-url').value;
    // Converte o valor de 'size' para um número inteiro
    var size = parseInt(document.querySelector('.qr-size').value, 10); 

    // Referência ao NOVO container
    var qrcodeContainer = document.querySelector('#qrcode-container'); 

    // Limpa o conteúdo do container antes de gerar um novo QR Code
    qrcodeContainer.innerHTML = ''; 

    // Garante que a URL/texto não está vazia e que o tamanho é um número válido (opcional, mas boa prática)
    if (url && size && !isNaN(size)) {
        var qrcode = new QRCode(qrcodeContainer, {
            text: url, // Usa a variável 'url' (não precisa de template string)
            width: size, // Usa a variável 'size' (como número)
            height: size, // Usa a variável 'size' (como número)
            colorDark: "black",
            colorLight: "white",
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // Opcional: Mostra uma mensagem se os inputs estiverem vazios
        qrcodeContainer.innerHTML = 'Preencha a URL/texto e um tamanho válido.'; 
    }
});