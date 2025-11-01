// Ficheiro: print.js - VERSÃO CORRIGIDA E COMPLETA

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.getElementById('printImage');
  const labelDiv = document.getElementById('label-content'); 

  // Lógica 1: Imprimir Imagem (Seleção de Tela)
  if (request.type === 'PRINT_IMAGE' && request.image) {
    // 1. Configura a exibição na tela
    if (labelDiv) labelDiv.style.display = 'none'; 
    img.style.display = 'block';
    
    // 2. Define o source
    img.src = request.image;

    // 3. CORREÇÃO CRÍTICA: Garante que a imagem seja visível na impressão, 
    // forçando a visibilidade para 'visible' para sobrescrever o 
    // 'visibility: hidden' que está no 'body' do label_input.css.
    img.style.visibility = 'visible'; 
    
    // 4. Quando a imagem terminar de carregar, chame a impressão
    img.onload = () => {
      window.print(); 
    };
  }

  // Lógica 2: Imprimir Etiqueta (Texto Formatado)
  else if (request.type === 'PRINT_LABEL' && request.content) {
    // 1. Configura a exibição na tela
    img.style.display = 'none'; 
    // Opcional: Define a visibilidade da imagem para 'hidden' para o caso de impressão
    img.style.visibility = 'hidden'; 
    
    if (labelDiv) {
        labelDiv.style.display = 'block';
        labelDiv.textContent = request.content;
    }
    
    // 2. Chama a impressão para o conteúdo de texto
    // O CSS em label_input.css garante que a etiqueta (#label-content) será visível.
    window.print();
  }
});