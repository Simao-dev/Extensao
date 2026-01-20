document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    const themeSwitch = document.getElementById('custom-switch');

    function applyTheme() {
        const isDark = !themeSwitch.checked; 

        if (isDark) {
            body.classList.add('dark-mode');
            // SALVA PARA A EXTENSÃO TODA VER
            chrome.storage.local.set({ theme: 'dark' });
        } else {
            body.classList.remove('dark-mode');
            chrome.storage.local.set({ theme: 'light' });
        }
    }

    function initializeTheme() {
        // BUSCA DA EXTENSÃO
        chrome.storage.local.get(['theme'], (result) => {
            if (result.theme === 'dark') {
                themeSwitch.checked = false;
                body.classList.add('dark-mode');
            } else {
                themeSwitch.checked = true;
                body.classList.remove('dark-mode');
            }
        });
    }

    if (themeSwitch) {
        initializeTheme();
        themeSwitch.addEventListener('change', applyTheme);
    }
});


