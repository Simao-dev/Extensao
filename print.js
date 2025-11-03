chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.getElementById('printImage');
  const labelDiv = document.getElementById('label-content'); 

  //1: Imprimir Imagem (Seleção de Tela)
  if (request.type === 'PRINT_IMAGE' && request.image) {
    // 1. Configura a exibição na tela
    if (labelDiv) labelDiv.style.display = 'none'; 
    img.style.display = 'block';
    
    // 2. Define o source
    img.src = request.image;

    // 3.Garante que a imagem seja visível na impressão, 
    img.style.visibility = 'visible'; 
    
    // 4. Quando a imagem terminar de carregar, chame a impressão
    img.onload = () => {
      window.print(); 
    };
  }

  //2: Imprimir Etiqueta (Texto Formatado)
  else if (request.type === 'PRINT_LABEL' && request.content) {
    // 1. Configura a exibição na tela
    img.style.display = 'none'; 
    img.style.visibility = 'hidden'; 
    
    if (labelDiv) {
        labelDiv.style.display = 'block';
        labelDiv.textContent = request.content;
    }
    
    // 2. Chama a impressão para o conteúdo de texto
    window.print();
  }
});