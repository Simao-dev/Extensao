        // Obter referências aos elementos DOM
        const body = document.body;
        const themeSwitch = document.getElementById('custom-switch');

         // Função para aplicar o tema com base no estado do checkbox.
         // Salva o estado no localStorage para persistência.
       
        function applyTheme() {
           
            const isChecked = themeSwitch.checked;

            if (isChecked) {
               
                body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            } else {
              
                body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            }
        }


        // Inicializa o tema ao carregar a página, checando o localStorage.
        function initializeTheme() {
            const savedTheme = localStorage.getItem('theme');

            if (savedTheme === 'dark') {               
                themeSwitch.checked = false; 
                body.classList.add('dark-mode');
            } else {
                themeSwitch.checked = true;
                body.classList.remove('dark-mode');
            }
        }

        //  Inicializa o tema com base no localStorage
        initializeTheme();

        // Adiciona o listener para o evento 'change' do checkbox
        themeSwitch.addEventListener('change', applyTheme);