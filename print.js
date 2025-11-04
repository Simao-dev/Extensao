chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.getElementById('printImage');
  const labelDiv = document.getElementById('label-content'); 

  //Imprimir Imagem (Seleção de Tela)
  if (request.type === 'PRINT_IMAGE' && request.image) {
    // Configura a exibição na tela
    if (labelDiv) labelDiv.style.display = 'none'; 
    img.style.display = 'block';
    img.style.margin = '5px';
    img.src = request.image;
    img.style.visibility = 'visible'; 
    img.onload = () => {
      window.print(); 
    };
  }

  // Imprimir Etiqueta (Texto Formatado)
  else if (request.type === 'PRINT_LABEL' && request.content) {
    img.style.display = 'none'; 
    img.style.visibility = 'hidden';  
    if (labelDiv) {
        labelDiv.style.display = 'block';
        labelDiv.textContent = request.content;
    }
    window.print();
  }
});