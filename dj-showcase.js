import { resolveScheduledDjLabel } from './dj-logo-filename-fix.js?v=20261125-djidentity1';

// TellStream DJ showcase: scheduled presenters and existing on-air images only.
// No hard-coded roster, generated portraits, or dependency on the poster asset.
export function getScheduledPresenterNames(rows, resolveLogoFilename) {
    const days = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    const names = new Map();
    for (const row of rows || []) {
        if (!days.has(String(row.day_of_week || '').trim().toLowerCase())) continue;
        if (!String(row.start_time || '').trim()) continue;

        const raw = String(row.dj_name || '').trim()
            .replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        const words = resolveScheduledDjLabel(raw).split(/\s+/).filter(Boolean);
        // Never create a single-name DJ. Only documented legacy records are repaired.
        if (words.length < 2) continue;
        const name = words.slice(0, 2).join(' ');
        if (/^tellstream(?:\s+non)?$/i.test(name)) continue;

        // Aliases must collapse to one entry sharing the same photograph.
        const filename = resolveLogoFilename(name);
        const key = (filename || name).toLocaleLowerCase('en-GB');
        if (!names.has(key)) names.set(key, name);
    }
    return Array.from(names.values())
        .sort((a, b) => a.localeCompare(b, 'en-GB', { sensitivity: 'base' }));
}

export function initDjsShowcase({ client, resolveLogoFilename }) {
    const button = document.getElementById('djShowcaseOpenButton');
    if (!button || button.dataset.djShowcaseReady === '1') return;
    if (!client || typeof resolveLogoFilename !== 'function') return;

    button.dataset.djShowcaseReady = '1';
    const overlay = document.createElement('div');
    overlay.id = 'djShowcaseOverlay';
    overlay.className = 'dj-showcase-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');
    const dialog = document.createElement('section');
    dialog.className = 'dj-showcase-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'djShowcaseHeading');
    dialog.setAttribute('tabindex', '-1');

    const heading = document.createElement('header');
    heading.className = 'dj-showcase-heading';
    const headingText = document.createElement('div');
    const kicker = document.createElement('div');
    kicker.className = 'dj-showcase-kicker';
    kicker.textContent = 'TELLSTREAM • THE PRESENTERS';
    const h2 = document.createElement('h2');
    h2.id = 'djShowcaseHeading';
    h2.textContent = 'MEET THE DJs';
    const subtitle = document.createElement('p');
    subtitle.className = 'dj-showcase-subtitle';
    subtitle.textContent = 'The people behind the music · Updated from the weekly schedule';
    headingText.append(kicker, h2, subtitle);
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'dj-showcase-close';
    closeButton.setAttribute('aria-label', 'Close DJ showcase');
    closeButton.textContent = '✕';
    heading.append(headingText, closeButton);

    const status = document.createElement('div');
    status.className = 'dj-showcase-status';
    status.setAttribute('aria-live', 'polite');
    const grid = document.createElement('div');
    grid.className = 'dj-showcase-grid';
    dialog.append(heading, status, grid);
    overlay.append(dialog);
    document.body.append(overlay);

    let presenters = [];
    let generation = 0;
    let hasLoaded = false;

    function initials(name) {
        const parts = name.split(/\s+/).filter(Boolean);
        return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('') || '🎧';
    }
    function makePicture(name, small, revision) {
        const frame = document.createElement('span');
        frame.className = small ? 'dj-showcase-small-photo' : 'dj-showcase-photo';
        const placeholder = document.createElement('span');
        placeholder.className = 'dj-showcase-initials';
        placeholder.textContent = initials(name);
        frame.append(placeholder);
        const filename = resolveLogoFilename(name);
        if (filename) {
            const image = document.createElement('img');
            // R2 may override the original, unmodified image on site hosting.
            // Do not show a different DJ's picture if an image is absent.
            image.alt = small ? '' : name + ' — TellStream presenter image';
            image.loading = small ? 'eager' : 'lazy';
            image.decoding = 'async';
            image.addEventListener('load', () => { placeholder.hidden = true; });
            image.addEventListener('error', () => { image.remove(); });
            frame.append(image);
            window.TellStreamR2Media.djImage(filename).then(url => {
                if (url) image.src = url;
                else image.remove();
            }).catch(error => {
                console.warn('[DJ gallery] Picture lookup failed:', error);
                image.remove();
            });
        }
        return frame;
    }
    function render(revision) {
        grid.replaceChildren();

        if (!presenters.length) {
            status.textContent = 'There are currently no regular DJ slots listed.';
            return;
        }
        const count = presenters.length;
        status.textContent = count + ' current presenter' + (count === 1 ? '' : 's') + ' · Weekly schedule';

        for (const name of presenters) {
            const card = document.createElement('article');
            card.className = 'dj-showcase-card';
            const media = document.createElement('div');
            media.className = 'dj-showcase-card-media';
            media.append(makePicture(name, false, revision));
            const title = document.createElement('h3');
            title.className = 'dj-showcase-card-name';
            title.textContent = name;
            const descriptor = document.createElement('div');
            descriptor.className = 'dj-showcase-card-caption';
            descriptor.textContent = 'TELLSTREAM DJ';
            card.append(media, title, descriptor);
            grid.append(card);
        }
    }
    async function refreshRoster() {
        const request = ++generation;
        if (!hasLoaded) {
            status.textContent = 'Reading regular DJ slots…';
        }
        try {
            const response = await client.from('master_schedule')
                .select('dj_name,day_of_week,start_time');
            if (request !== generation) return;
            if (response.error) throw response.error;

            presenters = getScheduledPresenterNames(response.data, resolveLogoFilename);
            hasLoaded = true;
            render(Date.now());
        } catch (error) {
            if (request !== generation) return;
            console.warn('[TellStream DJ showcase] Schedule unavailable:', error);
            if (!hasLoaded) {
                status.textContent = 'Unable to load the current schedule. Please try again.';
            }
        }
    }
    function close() {
        overlay.hidden = true;
        button.focus({ preventScroll: true });
    }
    function open() {
        overlay.hidden = false;
        dialog.scrollTop = 0;
        closeButton.focus({ preventScroll: true });
        refreshRoster();
    }
    button.addEventListener('click', open);
    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) close();
    });
    document.addEventListener('keydown', event => {
        if (!overlay.hidden && event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    });

    // Automatic roster refresh on schedule changes, and fresh data each time
    // a visitor opens the pop-up. No static list to maintain.
    try {
        client.channel('dj-showcase-master-schedule')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'master_schedule'
            }, () => { refreshRoster(); })
            .subscribe();
    } catch (error) {
        console.warn('[TellStream DJ showcase] Realtime unavailable:', error);
    }
    refreshRoster();
}
