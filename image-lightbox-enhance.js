function setupImageLightboxEnhancements() {
    const flyerModal = document.getElementById('flyerModal');
    const modalTargetImg = document.getElementById('modalTargetImg');
    if (!flyerModal || !modalTargetImg) return;

    let pointerStart = null;
    let moved = false;
    let suppressClickUntil = 0;

    function closeViewer() {
        if (typeof window.closeFlyerLightbox === 'function') window.closeFlyerLightbox();
        else flyerModal.classList.remove('active');
    }

    // Use native scrolling and native touch pinch-to-zoom. Do not transform,
    // crop, regenerate, or fit tall flyers into a single screen.
    modalTargetImg.draggable = false;
    modalTargetImg.style.cursor = 'zoom-out';
    modalTargetImg.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pointerStart = { x: event.clientX, y: event.clientY };
        moved = false;
    });
    modalTargetImg.addEventListener('pointermove', event => {
        if (!pointerStart) return;
        if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) {
            moved = true;
            suppressClickUntil = Date.now() + 650;
        }
    });
    modalTargetImg.addEventListener('pointerup', () => {
        if (moved) suppressClickUntil = Date.now() + 650;
        pointerStart = null;
    });
    modalTargetImg.addEventListener('pointercancel', () => {
        suppressClickUntil = Date.now() + 650;
        pointerStart = null;
    });
    flyerModal.addEventListener('scroll', () => {
        suppressClickUntil = Date.now() + 350;
    }, { passive: true });
    flyerModal.addEventListener('touchmove', () => {
        suppressClickUntil = Date.now() + 650;
    }, { passive: true });
    modalTargetImg.addEventListener('click', event => {
        event.stopPropagation();
        if (moved || Date.now() < suppressClickUntil) return;
        closeViewer();
    });

    // Keep the original flyer independently clickable, in the existing full-width viewer.
    document.addEventListener('click', event => {
        const presentersImage = event.target.closest('#djs-presenters-panel img');
        if (!presentersImage) return;
        event.preventDefault();
        event.stopPropagation();
        modalTargetImg.src = presentersImage.currentSrc || presentersImage.src;
        flyerModal.classList.add('active');
    }, true);

    const observer = new MutationObserver(() => {
        if (flyerModal.classList.contains('active')) {
            flyerModal.scrollTop = 0;
            flyerModal.scrollLeft = 0;
            moved = false;
            pointerStart = null;
        }
    });
    observer.observe(flyerModal, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && flyerModal.classList.contains('active')) closeViewer();
    });
}
setupImageLightboxEnhancements();
