// Função global chamada do popup.js para recortar e imprimir a imagem
function cropAndOpen(imageUrl, x, y, width, height) {
  const canvas = document.getElementById('canvasCrop');
  const ctx = canvas.getContext('2d');
  const image = new Image();

  image.onload = () => {
    // Define as dimensões do canvas para o tamanho da área selecionada
    canvas.width = width;
    canvas.height = height;

    // Desenha a parte da imagem selecionada no canvas
    // ctx.drawImage(imagem, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    ctx.drawImage(
      image,
      x, y, // Ponto de partida no screenshot (coordenadas da seleção)
      width, height, // Dimensões da área a ser recortada
      0, 0, // Ponto de partida no canvas (0, 0 para recortar no canto)
      width, height // Dimensões no canvas (tamanho final)
    );

    // Converte o canvas recortado em uma nova URL de dados
    const croppedUrl = canvas.toDataURL('image/png');

    // 1. Abre a imagem recortada em uma nova aba (temporária)
    chrome.tabs.create({ url: croppedUrl }, (newTab) => {
        // 2. Após a nova aba ser criada, injetamos o comando de impressão
        if (chrome.runtime.lastError) {
             console.error("Erro ao criar a aba para impressão:", chrome.runtime.lastError.message);
             return;
        }

        // A URL da imagem Base64 é segura para injeção de script
        chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: () => {
                // Remove a margem do body para a impressão ficar mais limpa
                document.body.style.margin = '0'; 
                // Chama o diálogo de impressão
                window.print();
                
                // Opcional: Você pode querer fechar a aba automaticamente
                // setTimeout(window.close, 100); 
            }
        });
    });
  };

  image.src = imageUrl;
}