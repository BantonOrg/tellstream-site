(() => {
    'use strict';
    // Chutes uses the *existing* lounge radio. Do not create another audio stream.
    const controls = [...document.querySelectorAll('.chutes-radio-remote')];
    if (!controls.length) return;

    if (typeof BroadcastChannel !== 'function') {
        controls.forEach(control => {
            const button = control.querySelector('.chutes-radio-toggle');
            const slider = control.querySelector('.chutes-radio-volume');
            if (button) button.disabled = true;
            if (slider) slider.disabled = true;
            control.title = 'Radio remote controls are not supported in this browser.';
        });
        return;
    }
    const channel = new BroadcastChannel('tellstream_radio_control');
    let playing = false;
    let volume = 0.5;

    function syncUI() {
        controls.forEach(control => {
            const button = control.querySelector('.chutes-radio-toggle');
            const slider = control.querySelector('.chutes-radio-volume');
            if (button) {
                button.textContent = playing ? '⏸️' : '▶️';
                button.setAttribute('aria-label', playing ? 'Pause TellStream radio' : 'Play TellStream radio');
                button.title = playing ? 'Pause TellStream radio' : 'Play TellStream radio';
            }
            if (slider && document.activeElement !== slider) slider.value = String(volume);
        });
    }
    controls.forEach(control => {
        const button = control.querySelector('.chutes-radio-toggle');
        const slider = control.querySelector('.chutes-radio-volume');
        button?.addEventListener('click', () => {
            channel.postMessage({ action: playing ? 'pause' : 'play' });
        });
        slider?.addEventListener('input', () => {
            volume = Math.max(0, Math.min(1, Number(slider.value) || 0));
            controls.forEach(other => {
                const otherSlider = other.querySelector('.chutes-radio-volume');
                if (otherSlider && otherSlider !== slider) otherSlider.value = String(volume);
            });
            channel.postMessage({ action: 'volume', value: volume });
        });
    });
    channel.onmessage = event => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.state === 'playing') playing = true;
        else if (data.state === 'paused') playing = false;
        if (typeof data.volume === 'number' && Number.isFinite(data.volume)) {
            volume = Math.max(0, Math.min(1, data.volume));
        }
        syncUI();
    };

    const requestCurrentState = () => channel.postMessage({ action: 'ping' });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) requestCurrentState();
    });
    // The parent homepage replies with a pong carrying current play/volume state.
    syncUI();
    requestCurrentState();
})();
