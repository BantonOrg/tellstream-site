function setupImageLightboxEnhancements() {
    const flyerModal = document.getElementById('flyerModal');
    const modalTargetImg = document.getElementById('modalTargetImg');
    if (!flyerModal || !modalTargetImg) return;

    const pointers = new Map();
    let scale = 1, offsetX = 0, offsetY = 0;
    let pinchDistance = 0, pinchScale = 1, lastPointer = null;
    let gestureMoved = false, suppressClickUntil = 0;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const distance = ([a, b]) => Math.hypot(a.x - b.x, a.y - b.y);

    function draw() {
        const maxX = Math.max(0, (modalTargetImg.clientWidth * scale - modalTargetImg.clientWidth) / 2);
        const maxY = Math.max(0, (modalTargetImg.clientHeight * scale - modalTargetImg.clientHeight) / 2);
        offsetX = clamp(offsetX, -maxX, maxX);
        offsetY = clamp(offsetY, -maxY, maxY);
        modalTargetImg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }

    function resetZoom() {
        pointers.clear();
        scale = 1; offsetX = 0; offsetY = 0;
        pinchDistance = 0; pinchScale = 1;
        lastPointer = null; gestureMoved = false;
        draw();
    }

    modalTargetImg.draggable = false;
    modalTargetImg.style.cursor = 'zoom-out';
    modalTargetImg.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
        if (event.pointerType !== 'mouse') modalTargetImg.setPointerCapture(event.pointerId);
        if (pointers.size === 2) {
            pinchDistance = distance([...pointers.values()]);
            pinchScale = scale;
            gestureMoved = true;
        } else if (pointers.size === 1) {
            lastPointer = {x: event.clientX, y: event.clientY};
            gestureMoved = false;
        }
    });
    modalTargetImg.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId)) return;
        const old = pointers.get(event.pointerId);
        pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
        if (pointers.size === 2) {
            const newDistance = distance([...pointers.values()]);
            if (pinchDistance > 0) scale = clamp(pinchScale * newDistance / pinchDistance, 1, 5);
            gestureMoved = true;
            draw();
        } else if (pointers.size === 1 && scale > 1) {
            offsetX += event.clientX - old.x;
            offsetY += event.clientY - old.y;
            if (Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) > 5) gestureMoved = true;
            draw();
        }
    });
    const endPointer = event => {
        pointers.delete(event.pointerId);
        if (gestureMoved) suppressClickUntil = Date.now() + 500;
        if (pointers.size < 2) pinchDistance = 0;
        if (!pointers.size) lastPointer = null;
    };
    modalTargetImg.addEventListener('pointerup', endPointer);
    modalTargetImg.addEventListener('pointercancel', endPointer);
    modalTargetImg.addEventListener('click', event => {
        event.stopPropagation();
        if (Date.now() < suppressClickUntil) return;
        if (typeof window.closeFlyerLightbox === 'function') window.closeFlyerLightbox();
        else flyerModal.classList.remove('active');
    });

    // Event flyers already launch this viewer. The presenter image is created
    // dynamically, so attach its opening action by delegation.
    document.addEventListener('click', event => {
        const presentersImage = event.target.closest('#djs-presenters-panel img');
        if (!presentersImage) return;
        event.preventDefault();
        event.stopPropagation();
        modalTargetImg.src = presentersImage.currentSrc || presentersImage.src;
        flyerModal.classList.add('active');
    }, true);

    // New images always open at the fit-to-screen size.
    const observer = new MutationObserver(() => {
        if (flyerModal.classList.contains('active')) resetZoom();
    });
    observer.observe(flyerModal, {attributes: true, attributeFilter: ['class']});
}

setupImageLightboxEnhancements();
