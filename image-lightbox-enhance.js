function setupImageLightboxEnhancements() {
    const flyerModal = document.getElementById('flyerModal');
    const modalTargetImg = document.getElementById('modalTargetImg');

    if (!flyerModal || !modalTargetImg) return;

    modalTargetImg.style.cursor = 'zoom-out';
    modalTargetImg.addEventListener('click', (event) => {
        event.stopPropagation();
        flyerModal.classList.remove('active');
    });

    // Delegate the DJ image click so it still works even though that image
    // is created dynamically by djs-schedule-panel.js.
    document.addEventListener('click', (event) => {
        const presentersImage = event.target.closest('#djs-presenters-panel img');
        if (!presentersImage) return;

        event.preventDefault();
        event.stopPropagation();
        presentersImage.style.cursor = 'zoom-in';
        modalTargetImg.src = presentersImage.currentSrc || presentersImage.src;
        flyerModal.classList.add('active');
    }, true);
}

setupImageLightboxEnhancements();
