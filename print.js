chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.image) {
    const img = document.getElementById('printImage');
    img.src = request.image;

    // Quando a imagem terminar de carregar, chame a impressão
    img.onload = () => {
      window.print(); // <-- A MÁGICA ACONTECE AQUI
    };
  }
});