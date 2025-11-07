chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const img = document.getElementById("printImage");
  const labelDiv = document.getElementById("label-content"); 
  
  // Imprimir Imagem (Seleção)
  if (request.type === "PRINT_IMAGE" && request.image) {
    
    // Configura a exibição na tela
    if (labelDiv) labelDiv.style.display = "none";
    img.style.display = "block"; 
    img.style.margin = ""; 
    img.style.width = "";
    img.style.height = "";
    img.src = request.image;
    img.style.visibility = "visible";
    
    img.onload = () => {
      window.print();
      sendResponse({ status: "Image print initiated" }); 
    };
    
    return true; 
  } 
  
  //  Imprimir Etiqueta (Texto Formatado)
  else if (request.type === "PRINT_LABEL" && request.content) {
    img.style.display = "none";
    img.style.visibility = "hidden";
    if (labelDiv) {
      labelDiv.style.display = "block";
      labelDiv.textContent = request.content;
    }
    
    window.print();
    
    // Envia uma resposta explícita APÓS iniciar a impressão da etiqueta.
    sendResponse({ status: "Label print initiated" }); 
    
    // Retorna true para informar ao Chrome que sendResponse será chamada.
    return true; 
  }
  
  // Se o request não for reconhecido, a função retornará 'undefined' (ou false implicitamente),
});