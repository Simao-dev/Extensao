// Ficheiro: print.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.getElementById('printImage');
  const labelDiv = document.getElementById('label-content'); 

  // Lógica 1: Imprimir Imagem (Seleção de Tela)
  if (request.type === 'PRINT_IMAGE' && request.image) {
    // Esconde a div de etiqueta, mostra a imagem
    if (labelDiv) labelDiv.style.display = 'none'; 
    img.style.display = 'block';
    
    img.src = request.image;

    // Quando a imagem terminar de carregar, chame a impressão
    img.onload = () => {
      window.print(); 
    };
  }

  // Lógica 2: Imprimir Etiqueta (Texto Formatado)
  else if (request.type === 'PRINT_LABEL' && request.content) {
    // Esconde a imagem, mostra a div de etiqueta
    img.style.display = 'none'; 
    if (labelDiv) {
        labelDiv.style.display = 'block';
        // Usa innerHTML com <pre> ou simplesmente preenche o textContent
        // O white-space: pre-wrap no label_input.css garante quebras de linha
        labelDiv.textContent = request.content;
    }
    
    // Como é texto, não precisa esperar 'onload', chama a impressão imediatamente
    window.print();
  }
});