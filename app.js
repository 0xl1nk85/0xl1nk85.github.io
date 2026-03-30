document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    // MODIFIED: This now selects ALL buttons with a data-target, including the main paw
    const navButtons = document.querySelectorAll('.nav-bubble[data-target]');
    const backButton = document.getElementById('back-button');
    const contentContainer = document.getElementById('content-container');
    const contentTemplates = document.getElementById('content-templates');
    const themeButtons = document.querySelectorAll('.theme-btn');

    // --- Show the correct content panel ---
    const showContent = (targetPanelId) => {
        const template = contentTemplates.querySelector(`#${targetPanelId}`);
        if (!template) return;

        const contentWrapper = contentContainer.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentContainer.removeChild(contentWrapper);
        }
        
        const newContentWrapper = document.createElement('div');
        newContentWrapper.className = 'content-wrapper';
        newContentWrapper.innerHTML = template.innerHTML;
        contentContainer.prepend(newContentWrapper);

        body.classList.add('content-active');
        contentContainer.scrollTop = 0;
        
        setupTabListeners(newContentWrapper);
        
        // Click-to-Copy Logic
        const copyButton = newContentWrapper.querySelector('#copy-ca-button');
        if (copyButton) {
            const addressSpan = copyButton.querySelector('.ca-address');
            const iconSpan = copyButton.querySelector('.copy-icon');
            const originalText = addressSpan.textContent;

            copyButton.addEventListener('click', () => {
                const addressToCopy = copyButton.dataset.caAddress;
                navigator.clipboard.writeText(addressToCopy).then(() => {
                    addressSpan.textContent = "Copied!";
                    iconSpan.textContent = "✅";
                    copyButton.classList.add('copied');
                    setTimeout(() => {
                        addressSpan.textContent = originalText;
                        iconSpan.textContent = "🐾";
                        copyButton.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy Contract Address:', err);
                    addressSpan.textContent = "Copy Failed";
                });
            });
        }
    };

    // --- Show the main paw navigator ---
    const showNav = () => {
        body.classList.remove('content-active');
    };

    // --- Main Navigation Event Listeners ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            showContent(button.dataset.target);
        });
    });

    backButton.addEventListener('click', showNav);

    // --- Function to handle sub-navigation tabs ---
    function setupTabListeners(container) {
        const tabs = container.querySelectorAll('.tab-btn');
        const subPanels = container.querySelectorAll('.sub-panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                subPanels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                container.querySelector(`#${tab.dataset.subTarget}`).classList.add('active');
            });
        });
    }

    // --- THEME PICKER LOGIC ---
    const applyTheme = (themeName) => {
        body.classList.remove('theme-pink', 'theme-cyan', 'theme-yellow');
        body.classList.add(`theme-${themeName}`);
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
    };

    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const themeName = button.dataset.theme;
            localStorage.setItem('selected-theme', themeName);
            applyTheme(themeName);
        });
    });
    
    const savedTheme = localStorage.getItem('selected-theme') || 'pink';
    applyTheme(savedTheme);

    // --- Landing Page CA Copy Button ---
    const landingCopyBtn = document.getElementById('copy-ca-landing');
    if (landingCopyBtn) {
        landingCopyBtn.addEventListener('click', () => {
            const addr = landingCopyBtn.dataset.caAddress;
            const textSpan = landingCopyBtn.querySelector('.ca-text-landing');
            const iconSpan = landingCopyBtn.querySelector('.copy-icon-landing');
            const originalText = textSpan.textContent;
            navigator.clipboard.writeText(addr).then(() => {
                textSpan.textContent = 'Copied!';
                iconSpan.textContent = '✅';
                landingCopyBtn.classList.add('copied');
                setTimeout(() => {
                    textSpan.textContent = originalText;
                    iconSpan.textContent = '📋';
                    landingCopyBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy Contract Address:', err);
                textSpan.textContent = 'Copy Failed';
            });
        });
    }
});
