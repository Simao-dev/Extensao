// Ficheiro: print.js - VERSÃO CORRIGIDA

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.getElementById('printImage');
  const labelDiv = document.getElementById('label-content'); 

  // Lógica 1: Imprimir Imagem (Seleção de Tela)
  // Verifica se a mensagem é do tipo PRINT_IMAGE e tem o conteúdo da imagem
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
  // Verifica se a mensagem é do tipo PRINT_LABEL e tem o conteúdo do texto
  else if (request.type === 'PRINT_LABEL' && request.content) {
    // Esconde a imagem, mostra a div de etiqueta
    img.style.display = 'none'; 
    if (labelDiv) {
        labelDiv.style.display = 'block';
        labelDiv.textContent = request.content;
    }
    
    // Chama a impressão para o conteúdo de texto
    window.print();
  }
});