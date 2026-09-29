function installDjsSchedulePanel() {
    const column = document.getElementById('today-schedule-column');
    const timetable = document.getElementById('timetableContainer');
    if (!column || !timetable || column.dataset.djsSchedulePanelReady === '1') return;

    const columnTitle = column.querySelector(':scope > .col-title');
    const restOfWeekButton = document.getElementById('fullscreen-schedule-btn');
    if (!columnTitle) return;

    column.dataset.djsSchedulePanelReady = '1';
    columnTitle.innerHTML = '<span>🎧 DJs & Schedule</span>';

    const presentersPanel = document.createElement('div');
    presentersPanel.id = 'djs-presenters-panel';
    presentersPanel.style.cssText = [
        'flex:1 1 56%',
        'min-height:0',
        'overflow-y:auto',
        'background:rgba(20,20,20,0.4)',
        'padding:10px',
        'border-radius:8px',
        'border:1px solid rgba(255,255,255,0.03)'
    ].join(';');

    const presentersImage = document.createElement('img');
    presentersImage.src = '/src/assets/tellstream-presenters.webp?v=20260929';
    presentersImage.alt = 'Meet the Tellstream DJs';
    presentersImage.style.cssText = 'display:block;width:100%;height:auto;border-radius:6px;';
    presentersPanel.appendChild(presentersImage);

    const schedulePanel = document.createElement('div');
    schedulePanel.id = 'djs-schedule-list-panel';
    schedulePanel.style.cssText = [
        'flex:1 1 44%',
        'min-height:0',
        'overflow:hidden',
        'background:rgba(20,20,20,0.4)',
        'padding:10px 14px 14px',
        'border-radius:8px',
        'border:1px solid rgba(255,255,255,0.03)',
        'display:flex',
        'flex-direction:column',
        'gap:8px'
    ].join(';');

    const scheduleHeader = document.createElement('div');
    scheduleHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;flex-shrink:0;';

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
}

installDjsSchedulePanel();
