document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const navButtons = document.querySelectorAll('.nav-bubble[data-target]');
    const backButton = document.getElementById('back-button');
    const contentContainer = document.getElementById('content-container');
    const contentTemplates = document.getElementById('content-templates');
    const themeButtons = document.querySelectorAll('.theme-btn');

    // =====================
    // NAVIGATION
    // =====================
    const showContent = (targetPanelId) => {
        const template = contentTemplates.querySelector(`#${targetPanelId}`);
        if (!template) return;

        const existing = contentContainer.querySelector('.content-wrapper');
        if (existing) contentContainer.removeChild(existing);

        const wrapper = document.createElement('div');
        wrapper.className = 'content-wrapper';
        wrapper.innerHTML = template.innerHTML;
        contentContainer.prepend(wrapper);

        body.classList.add('content-active');
        contentContainer.scrollTop = 0;

        setupTabListeners(wrapper);
        setupCopyButton(wrapper);
        setupSwapWidgets(wrapper);
        setupLightbox(wrapper);
    };

    const showNav = () => {
        body.classList.remove('content-active');
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => showContent(btn.dataset.target));
    });

    backButton.addEventListener('click', showNav);

    // =====================
    // SUB-TAB NAVIGATION
    // =====================
    function setupTabListeners(container) {
        const tabs = container.querySelectorAll('.tab-btn');
        const panels = container.querySelectorAll('.sub-panel');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const target = container.querySelector(`#${tab.dataset.subTarget}`);
                if (target) target.classList.add('active');
            });
        });
    }

    // =====================
    // COPY TO CLIPBOARD
    // =====================
    function setupCopyButton(container) {
        const copyBtn = container.querySelector('#copy-ca-button');
        if (!copyBtn) return;

        const addressSpan = copyBtn.querySelector('.ca-address');
        const iconSpan = copyBtn.querySelector('.copy-icon');
        const originalText = addressSpan.textContent;

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(copyBtn.dataset.caAddress).then(() => {
                addressSpan.textContent = 'Copied!';
                iconSpan.textContent = '✅';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    addressSpan.textContent = originalText;
                    iconSpan.textContent = '🐾';
                    copyBtn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                addressSpan.textContent = 'Copy Failed';
                setTimeout(() => { addressSpan.textContent = originalText; }, 2000);
            });
        });
    }

    // =====================
    // SWAP WIDGET SWITCHER
    // =====================
    function setupSwapWidgets(container) {
        const providerBtns = container.querySelectorAll('.swap-provider-btn');
        const frames = container.querySelectorAll('.swap-widget-frame');

        if (!providerBtns.length) return;

        // Lazy-load: only load iframe src when provider is first selected
        const loadIframe = (frame) => {
            const iframe = frame.querySelector('.swap-iframe');
            const loading = frame.querySelector('.swap-loading');
            const error = frame.querySelector('.swap-error');

            if (!iframe || iframe.src) return; // already loaded

            const src = iframe.dataset.src;
            if (!src) return;

            if (loading) loading.classList.remove('hidden');
            if (error) error.style.display = 'none';

            iframe.src = src;

            iframe.addEventListener('load', () => {
                if (loading) loading.classList.add('hidden');
            }, { once: true });

            // Timeout: if iframe doesn't load in 15s, show error
            const timeout = setTimeout(() => {
                if (loading && !loading.classList.contains('hidden')) {
                    loading.classList.add('hidden');
                    iframe.style.display = 'none';
                    if (error) error.style.display = 'block';
                }
            }, 15000);

            iframe.addEventListener('load', () => clearTimeout(timeout), { once: true });
        };

        // Retry button handler
        const setupRetry = (frame) => {
            const retryBtn = frame.querySelector('.swap-retry-btn');
            if (!retryBtn) return;

            retryBtn.addEventListener('click', () => {
                const iframe = frame.querySelector('.swap-iframe');
                const loading = frame.querySelector('.swap-loading');
                const error = frame.querySelector('.swap-error');

                if (error) error.style.display = 'none';
                if (iframe) {
                    iframe.style.display = '';
                    iframe.src = '';
                    iframe.removeAttribute('src');
                }

                // Re-trigger load
                setTimeout(() => loadIframe(frame), 100);
            });
        };

        frames.forEach(setupRetry);

        // Switch between providers
        providerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const provider = btn.dataset.provider;

                providerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                frames.forEach(f => f.classList.remove('active'));
                const targetFrame = container.querySelector(`#swap-${provider}`);
                if (targetFrame) {
                    targetFrame.classList.add('active');
                    loadIframe(targetFrame);
                }
            });
        });

        // Load the default (first active) provider
        const activeFrame = container.querySelector('.swap-widget-frame.active');
        if (activeFrame) loadIframe(activeFrame);
    }

    // =====================
    // LIGHTBOX (Meme Gallery)
    // =====================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('.lightbox-img') : null;
    const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

    function setupLightbox(container) {
        const items = container.querySelectorAll('.meme-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const fullSrc = item.dataset.full;
                if (!fullSrc || !lightbox || !lightboxImg) return;
                lightboxImg.src = fullSrc;
                lightbox.classList.add('active');
            });
        });
    }

    if (lightbox && lightboxClose) {
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            lightboxImg.src = '';
        };

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    // =====================
    // THEME PICKER
    // =====================
    const applyTheme = (themeName) => {
        body.classList.remove('theme-pink', 'theme-cyan', 'theme-yellow');
        body.classList.add(`theme-${themeName}`);
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
    };

    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const themeName = btn.dataset.theme;
            localStorage.setItem('selected-theme', themeName);
            applyTheme(themeName);
        });
    });

    const savedTheme = localStorage.getItem('selected-theme') || 'pink';
    applyTheme(savedTheme);

    // =====================
    // LANDING CA COPY BUTTON
    // =====================
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
            }).catch(() => {
                textSpan.textContent = 'Copy Failed';
                setTimeout(() => { textSpan.textContent = originalText; }, 2000);
            });
        });
    }
});
