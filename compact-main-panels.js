const compactMainPanelsStyle = document.createElement('style');
compactMainPanelsStyle.id = 'compact-main-panels-style';
compactMainPanelsStyle.textContent = `
/* Compact only the three main homepage content cards. */
.columns-container > .col-3 {
    padding: 12px !important;
    gap: 8px !important;
}

.columns-container > .col-3 > .col-title {
    border-bottom: 0 !important;
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
}

.columns-container > .col-3 .inner-feed-wrapper {
    gap: 8px !important;
}

.columns-container > .col-3 .flyer-item {
    padding: 8px !important;
}

.columns-container > .col-3 .flyer-item h4 {
    margin-top: 5px !important;
}

.columns-container > .col-3 .sub-panel-top,
.columns-container > .col-3 .sub-panel-bottom {
    padding-left: 10px !important;
    padding-right: 10px !important;
}
`;
document.head.appendChild(compactMainPanelsStyle);
