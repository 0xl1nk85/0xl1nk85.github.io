document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const navButtons = document.querySelectorAll('.nav-bubble[data-target]');
    const backButton = document.getElementById('back-button');
    const contentContainer = document.getElementById('content-container');
    const contentTemplates = document.getElementById('content-templates');

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
        setupLightbox(wrapper);
        setupRoadmap(wrapper);
    };

    const showNav = () => {
        body.classList.remove('content-active');
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => showContent(btn.dataset.target));
    });

    backButton.addEventListener('click', showNav);

    // =====================
    // LANDING CTA BUTTONS
    // =====================
    const showContentWithSub = (panelId, subId) => {
        showContent(panelId);
        if (subId) {
            const wrapper = contentContainer.querySelector('.content-wrapper');
            if (!wrapper) return;
            const tabs = wrapper.querySelectorAll('.tab-btn');
            const panels = wrapper.querySelectorAll('.sub-panel');
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            const targetTab = wrapper.querySelector(`.tab-btn[data-sub-target="${subId}"]`);
            const targetPanel = wrapper.querySelector(`#${subId}`);
            if (targetTab) targetTab.classList.add('active');
            if (targetPanel) targetPanel.classList.add('active');
        }
    };

    document.querySelectorAll('.cta-buy, .cta-join').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const sub = btn.dataset.sub;
            if (target) showContentWithSub(target, sub);
        });
    });

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
    // LIGHTBOX (Meme Gallery)
    // =====================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('.lightbox-img') : null;
    const lightboxDownload = lightbox ? lightbox.querySelector('.lightbox-download') : null;
    const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

    function setupLightbox(container) {
        const items = container.querySelectorAll('.meme-card');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const fullSrc = item.dataset.full;
                if (!fullSrc || !lightbox || !lightboxImg) return;

                lightboxImg.src = fullSrc;
                if (lightboxDownload) {
                    lightboxDownload.href = fullSrc;
                }
                lightbox.classList.add('active');
            });
        });
    }

    if (lightbox && lightboxClose) {
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            lightboxImg.src = '';
            if (lightboxDownload) lightboxDownload.href = '';
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
    // ROADMAP ACCORDION
    // =====================
    function setupRoadmap(container) {
        const phases = container.querySelectorAll('.roadmap-phase');
        phases.forEach(phase => {
            const header = phase.querySelector('.phase-header');
            if (!header) return;

            header.addEventListener('click', () => {
                const isActive = phase.classList.contains('active');
                phases.forEach(p => p.classList.remove('active'));
                if (!isActive) {
                    phase.classList.add('active');
                    setTimeout(() => {
                        phase.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });
        });
    }

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
