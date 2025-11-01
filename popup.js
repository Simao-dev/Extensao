// Ficheiro: popup.js

const menuScreen = document.getElementById("menu-screen");
const inputScreen = document.getElementById("input-screen");
const printSelectionBtn = document.getElementById("btn-print-selection");
const labelInputBtn = document.getElementById("btn-label-input");
const printLabelBtn = document.getElementById("print-label-btn");
const backToMenuBtn = document.getElementById("back-to-menu-btn");

// --- 1. Lógica do Menu ---

// Ação: Botão Imprimir Seleção (continua enviando mensagem para background.js)
printSelectionBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "START_PRINT_SELECTION" });
  window.close(); // Fecha o pop-up
});

// Ação: Botão Criar Etiqueta (muda para a tela de input)
labelInputBtn.addEventListener("click", () => {
  menuScreen.style.display = "none";
  inputScreen.style.display = "block";
});

// Ação: Botão Voltar
backToMenuBtn.addEventListener("click", () => {
  inputScreen.style.display = "none";
  menuScreen.style.display = "block";
});

// --- 2. Lógica de Impressão da Etiqueta ---

printLabelBtn.addEventListener("click", () => {
  const nomeCliente = document.getElementById("client-name").value;
  const numeroPedido = document.getElementById("order-number").value;

  // Constrói o conteúdo da etiqueta
  let contentHTML = `
        <div style="font-family: sans-serif; padding: 5mm; text-align: left;">
            <h3 style="margin: 0 0 10px 0;">Etiqueta de Pedido</h3>
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${nomeCliente}</p>
            <p style="margin: 5px 0;"><strong>Pedido N°:</strong> ${numeroPedido}</p>
            <p style="margin-top: 20px; font-size: 10px;">Gerado em: ${new Date().toLocaleDateString()}</p>
        </div>
    `;

  // 1. Abre a nova aba de impressão (reutilizando print.html)
  chrome.tabs.create({ url: "print.html" }, (newTab) => {
    // 2. Envia o HTML da etiqueta para a nova aba
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === newTab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        // Envia o conteúdo como HTML para o print.js
        chrome.tabs.sendMessage(newTab.id, {
          type: "PRINT_HTML", // Novo tipo de mensagem
          html: contentHTML,
        });

        // Fecha o pop-up após abrir a aba de impressão
        window.close();
      }
    });
  });
});
