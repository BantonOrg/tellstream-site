function setupImageLightboxEnhancements() {
    const flyerModal = document.getElementById('flyerModal');
    const modalTargetImg = document.getElementById('modalTargetImg');
    const presentersImage = document.querySelector('#djs-presenters-panel img');

    if (!flyerModal || !modalTargetImg) return;

    modalTargetImg.style.cursor = 'zoom-out';
    modalTargetImg.addEventListener('click', (event) => {
        event.stopPropagation();
        flyerModal.classList.remove('active');
    });

    if (presentersImage) {
        presentersImage.style.cursor = 'zoom-in';
        presentersImage.addEventListener('click', (event) => {
            event.stopPropagation();
            modalTargetImg.src = presentersImage.currentSrc || presentersImage.src;
            flyerModal.classList.add('active');
        });
    }
}

setupImageLightboxEnhancements();
