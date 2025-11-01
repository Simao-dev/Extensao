// popup.js

document.addEventListener('DOMContentLoaded', function() {
    // 1. Lógica para mostrar o gerador de QR Code
    const showQrButton = document.getElementById('btn-show-qr-generator');
    const qrSection = document.getElementById('qr-generator-section');

    if (showQrButton && qrSection) {
        showQrButton.addEventListener('click', function() {
            // Alterna a exibição:
            // O CSS define display: none;
            // O JavaScript alterna para display: block;
            if (qrSection.style.display === 'none' || qrSection.style.display === '') {
                qrSection.style.display = 'block';
            } else {
                qrSection.style.display = 'none';
            }
        });
    }
});