function installDjsSchedulePanel() {
    const column = document.getElementById('today-schedule-column');
    const timetable = document.getElementById('timetableContainer');
    if (!column || !timetable || column.dataset.djsSchedulePanelReady === '1') return;

    const columnTitle = column.querySelector(':scope > .col-title');
    const restOfWeekButton = document.getElementById('fullscreen-schedule-btn');
    if (!columnTitle) return;

    column.dataset.djsSchedulePanelReady = '1';
    columnTitle.innerHTML = '<span>🎧 DJs & Schedule</span>';
    columnTitle.style.cursor = 'pointer';

    const presentersPanel = document.createElement('div');
    presentersPanel.id = 'djs-presenters-panel';
    presentersPanel.className = 'sub-panel-top';
    // Preview is cropped by its panel, not scrolled; tap opens the full scrollable viewer.
    presentersPanel.style.overflow = 'hidden';

    // The current DJ showcase mounts here after the Supabase client is ready.
    // Names come from weekly schedule slots and pictures from dj-logos.
    const loading = document.createElement('div');
    loading.className = 'dj-showcase-preview-loading';
    loading.textContent = 'Loading current DJs…';
    presentersPanel.appendChild(loading);

    const schedulePanel = document.createElement('div');
    schedulePanel.id = 'djs-schedule-list-panel';
    schedulePanel.className = 'sub-panel-bottom';

    const scheduleHeader = document.createElement('div');
    scheduleHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;flex-shrink:0;';

    const scheduleLabel = document.createElement('span');
    scheduleLabel.textContent = "📅 Today's Schedule";
    scheduleLabel.style.cssText = 'font-size:0.85rem;color:#22e532;font-weight:bold;';
    scheduleHeader.appendChild(scheduleLabel);

    if (restOfWeekButton) {
        restOfWeekButton.style.flexShrink = '0';
        scheduleHeader.appendChild(restOfWeekButton);
    }

    schedulePanel.appendChild(scheduleHeader);
    timetable.style.flex = '1';
    timetable.style.minHeight = '0';
    timetable.style.overflowY = 'auto';
    schedulePanel.appendChild(timetable);

    column.appendChild(presentersPanel);
    column.appendChild(schedulePanel);

    schedulePanel.addEventListener('click', () => {
        if (!schedulePanel.classList.contains('expanded')) {
            schedulePanel.classList.add('expanded');
            presentersPanel.classList.add('collapsed');
        }
    });

    columnTitle.addEventListener('click', () => {
        if (schedulePanel.classList.contains('expanded')) {
            schedulePanel.classList.remove('expanded');
            presentersPanel.classList.remove('collapsed');
        }
    });
}

installDjsSchedulePanel();
