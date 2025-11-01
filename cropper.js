// Função global chamada do popup.js para recortar e exibir a imagem
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

    // Abre a imagem recortada em uma nova aba
    chrome.tabs.create({ url: croppedUrl });
  };

  image.src = imageUrl;
}