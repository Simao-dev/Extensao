// Função global chamada do popup.js para recortar e imprimir a imagem
function cropAndOpen(imageUrl, x, y, width, height) {
  const canvas = document.getElementById('canvasCrop');
  const ctx = canvas.getContext('2d');
  const image = new Image();

  image.onload = () => {
    // 1. Processamento da imagem (Recorte)
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
      image,
      x, y, 
      width, height, 
      0, 0, 
      width, height
    );

    const croppedUrl = canvas.toDataURL('image/png');

    // 2. Abre a imagem recortada em uma nova aba.
    // Usamos a URL de dados como URL para a nova aba.
    chrome.tabs.create({ url: croppedUrl }, (newTab) => {
        
        if (chrome.runtime.lastError) {
             console.error("Erro ao criar a aba para impressão:", chrome.runtime.lastError.message);
             return;
        }

        // 3. INJETAMOS O SCRIPT DE IMPRESSÃO.
        // Usamos uma pequena espera (setTimeout) para dar tempo ao Chrome
        // de renderizar a imagem Base64 na nova aba antes de chamar o print.
        // Embora não seja a solução ideal em programação assíncrona,
        // é a forma mais confiável de fazer isso com uma data URL.

        setTimeout(() => {
            chrome.scripting.executeScript({
                target: { tabId: newTab.id },
                func: () => {
                    // Script a ser executado na nova aba
                    document.body.style.margin = '0'; 
                    document.body.style.display = 'flex'; 
                    document.body.style.justifyContent = 'center';

                    // O Chrome redimensiona automaticamente a imagem Base64, 
                    // mas podemos garantir que ela ocupe o espaço correto na impressão
                    const imgElement = document.querySelector('img');
                    if(imgElement) {
                        imgElement.style.maxWidth = '100%';
                        imgElement.style.height = 'auto';
                    }

                    window.print();
                    
                    // Opcional: Fecha a aba após um breve período de tempo (após o diálogo de impressão fechar)
                    // window.onfocus = () => setTimeout(() => window.close(), 500);
                }
            });
        }, 300); // 300ms geralmente é suficiente para o Chrome renderizar
    });
  };

  image.src = imageUrl;
}