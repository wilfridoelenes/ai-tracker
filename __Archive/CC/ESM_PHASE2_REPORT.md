# ESM Phase 2 Report

## Modules

### ._locus-backlog-panel.js
- Cross references: 1
- Possible dependencies: locus-backlog-panel

### ._locus-notifications.js
- Cross references: 1
- Possible dependencies: locus-notifications

### ._locus-radar.js
- Cross references: 1
- Possible dependencies: locus-radar

### locus-analytics-charts.js
- Cross references: 6
- Possible dependencies: locus-analytics-core, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell

### locus-analytics-core.js
- Cross references: 6
- Possible dependencies: locus-analytics-charts, locus-analytics-render, locus-sesiones, locus-storage, locus-toast, locus-ui-shell
- Globals: innerWidth, innerHeight, innerHeight

### locus-analytics-digest.js
- Cross references: 3
- Possible dependencies: locus-analytics-core, locus-storage, locus-ui-shell

### locus-analytics-render.js
- Cross references: 8
- Possible dependencies: locus-analytics-charts, locus-analytics-core, locus-analytics-digest, locus-backlog-sprints, locus-sprint, locus-sprint-project, locus-storage, locus-ui-shell
- Globals: _markAnalyticsDirty

### locus-api.js
- Cross references: 12
- Possible dependencies: locus-map-viewer, locus-modals, locus-pulso, locus-radar, locus-sesiones, locus-sesiones-utils, locus-session-parse, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: Locus, Locus, _getActiveProjectFilter, _exportBacklogMd, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus, Locus

### locus-backlog-archive.js
- Cross references: 5
- Possible dependencies: locus-backlog-core, locus-backlog-item, locus-backlog-render, locus-storage, locus-ui-shell

### locus-backlog-core.js
- Cross references: 19
- Possible dependencies: locus-backlog-item, locus-backlog-merge, locus-backlog-panel, locus-backlog-render, locus-backlog-sprints, locus-docs, locus-item-editor, locus-map-generator, locus-map-viewer, locus-modals, locus-notifications, locus-sesiones, locus-sesiones-stats, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: _migrateItemTypes

### locus-backlog-item.js
- Cross references: 13
- Possible dependencies: locus-backlog-core, locus-backlog-merge, locus-backlog-panel, locus-backlog-render, locus-backlog-sprints, locus-docs, locus-item-editor, locus-modals, locus-sesiones, locus-session-parse, locus-storage, locus-toast, locus-ui-shell
- Globals: scrollX, innerWidth, innerWidth, scrollY

### locus-backlog-merge.js
- Cross references: 11
- Possible dependencies: locus-backlog-core, locus-backlog-item, locus-backlog-render, locus-backlog-sprints, locus-docs, locus-sesiones, locus-session-hora, locus-session-save, locus-storage, locus-toast, locus-ui-shell
- Globals: _mdiffToggleSection, _mdiffJumpTo, _mdiffSetItemSprint, _mdiffUpdateConfirmBtn, _mdiffUpdateConfirmBtn, _mdiffToggleSection, _mdiffJumpTo, _mdiffSetItemSprint, _mdiffUpdateConfirmBtn, _mdiffToggleSection, _mdiffJumpTo, _mdiffSetItemSprint, _mdiffUpdateConfirmBtn, _mdiffToggleSection, _mdiffJumpTo, _mdiffSetItemSprint, _pendingTemplateDownload, _pendingTemplateDownload, _pendingTemplateDownload, _pendingTemplateDownload

### locus-backlog-panel.js
- Cross references: 10
- Possible dependencies: locus-backlog-core, locus-backlog-render, locus-backlog-sprints, locus-docs, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: toggleMoreMenu, toggleMoreMenu, toggleMoreMenu

### locus-backlog-render.js
- Cross references: 10
- Possible dependencies: locus-backlog-archive, locus-backlog-core, locus-backlog-item, locus-backlog-sprints, locus-docs, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: _markBacklogListDirty

### locus-backlog-sprints.js
- Cross references: 12
- Possible dependencies: locus-backlog-core, locus-backlog-render, locus-contracts, locus-docs, locus-sesiones, locus-session-hora, locus-session-save, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell

### locus-command-palette.js
- Cross references: 13
- Possible dependencies: locus-backlog-panel, locus-backlog-sprints, locus-item-editor, locus-map-generator, locus-radar, locus-sesiones, locus-sesiones-capture, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: state, state, state, state, closeCommandPalette, openCommandPalette

### locus-contracts.js
- Cross references: 5
- Possible dependencies: locus-backlog-core, locus-modals, locus-storage, locus-toast, locus-ui-shell
- Globals: padEnd, padEnd, _ctrMergeFromItem, renderContratos, _esc, onContratosSearch, clearContratosSearch, openContratoDetail, exportContratosMd, resetContratosData, searchContratos, openResetSessionsModal, closeResetSessionsModal, confirmResetSessions

### locus-docs.js
- Cross references: 8
- Possible dependencies: locus-backlog-core, locus-map-generator, locus-map-viewer, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: _setBacklogModified, _updateSubTabButtons, importHtmlMap, _importContextMdFromText, _getMapContent, exportHtmlMapMd, updateContextBanner, renderContext, extractContextSections, mergeContextSections, extractHtmlMapSections, mergeHtmlMapSections, _renderTplProjBanner, _renderDocsOnboarding, updateHtmlMapModificationBadge, updateBacklogModificationBadge, importContextMd, onContextSearch, clearContextSearch, contextShowImport

### locus-item-editor.js
- Cross references: 8
- Possible dependencies: locus-backlog-core, locus-backlog-item, locus-backlog-render, locus-backlog-sprints, locus-modals, locus-storage, locus-toast, locus-ui-shell
- Globals: clipboardData, openItemEditor, closeItemEditor, openTemplatePicker, closePasteItems, openPasteItems, piParse, piRenderPreview, piToggleCard, piToggle, piEditTitle, piEditType, piEditStatus, piConfirm, piDragOver, piDragLeave, piDrop, confirmItemEditor, saveCurrentItemAsTemplate, toggleTplSavePanel

### locus-map-generator.js
- Cross references: 11
- Possible dependencies: locus-backlog-archive, locus-backlog-sprints, locus-docs, locus-sesiones, locus-session-parse, locus-session-save, locus-sprint, locus-sprint-plan, locus-sprint-project, locus-storage, locus-toast
- Globals: confirm, esc, esc, normalize, normalize, _mgGetVersion, openMapGenerator, closeMapGenerator, generateDocuments, generateMap, confirmMapGenerator, _mgSwitchReviewTab, _mgToggleDecisionTranscends, _mgToggleLearningTranscends, _mgRemoveFile

### locus-map-viewer.js
- Cross references: 5
- Possible dependencies: locus-backlog-core, locus-docs, locus-storage, locus-toast, locus-ui-shell
- Globals: renderHtmlMap, setHtmlMapFilter, updateHtmlMapBanner, loadHtmlMap, parseHtmlMapMd

### locus-misc-ui.js
- Cross references: 7
- Possible dependencies: locus-modals, locus-sesiones, locus-sesiones-stats, locus-session-popup, locus-storage, locus-toast, locus-ui-shell
- Globals: esc, esc, TAG_COLORS, currentTab, renderHoy, renderHoy, _relTs, _relTs, render, render, updateStats, updateStats, renderStatusBar, renderStatusBar, render, render, popAIId, popSessId, render, render

### locus-notifications.js
- Cross references: 7
- Possible dependencies: locus-backlog-item, locus-backlog-sprints, locus-radar, locus-sesiones, locus-sesiones-stats, locus-storage, locus-ui-shell
- Globals: _rsbCfgExpanded, hasRecentSession, _notifReadSet, _computeNotifications, markNotifRead, markAllNotifsRead, _registerNotifActions, _notifGoto, _notifConfig, updateTabNotifBadges, openNotifConfig, closeNotifConfig, _notifConfigReset, _notifConfigSetEnabled, _notifConfigSetThreshold

### locus-projects.js
- Cross references: 11
- Possible dependencies: locus-analytics-core, locus-backlog-core, locus-backlog-sprints, locus-map-viewer, locus-session-hora, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: renderProyectos, renderProject, getAIColor, renderProjectAnalytics, downloadProjectReport, toggleProjectSection, _projOpenAddDecision, _projSaveDecision, _projCancelDecision, _projEditDecision, _projDeleteDecision, _projCtxStartEdit, _projCtxSave, _projCtxCancelEdit, _projCtxToggleSec, _projToggleAIFilter, _projViewSearchInput, _toggleProjAnalytics

### locus-pulso.js
- Cross references: 4
- Possible dependencies: locus-sprint, locus-sprint-plan, locus-storage, locus-ui-shell
- Globals: _markPulsoDotDirty, openPulsoPanel, openPulsoPanel, closePulsoPanel, closePulsoPanel, renderPulsoDot, renderPulsoDot

### locus-radar.js
- Cross references: 8
- Possible dependencies: locus-notifications, locus-sesiones, locus-sesiones-capture, locus-sesiones-stats, locus-storage, locus-toast, locus-ui-shell, locus-workers
- Globals: fmt12, fmt12, getCD, getCD, _isInSession, _isInSession, _hoyMsUntilReset, _hoyMsUntilReset, _markRadarDirty, _rsbToggleCollapseAll, _rsbAutoHideInited, _rsbAutoHideInited, _rsbHandlersInited, _rsbHandlersInited, toggleRadarSidebar, renderGlobalRadarSidebar, _initRadarSidebarState, rsbFilterAIs, rsbClearSearch, rsbTogglePin

### locus-reports.js
- Cross references: 16
- Possible dependencies: locus-backlog-core, locus-backlog-render, locus-docs, locus-map-viewer, locus-modals, locus-radar, locus-sesiones, locus-sesiones-stats, locus-sesiones-viz, locus-session-hora, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell, locus-workers
- Globals: innerWidth, downloadReport, _syncCleanProjectBtn, downloadGlobalReport, toggleMoreMenu, exportData, openPurgeModal, closePurgeModal, toggleBacklogDangerZone, openResetBacklogModal, closeResetBacklogModal, confirmResetBacklog, toggleSidebarDanger, openCleanProjectModal, closeCleanProjectModal, resetContextData, resetHtmlMapData, updatePurgePreview, confirmPurge, importData

### locus-sesiones-arranque.js
- Cross references: 8
- Possible dependencies: locus-pulso, locus-sesiones, locus-sesiones-stats, locus-sesiones-viz, locus-sprint, locus-sprint-plan, locus-storage, locus-ui-shell
- Globals: _isBlocked, _blocked, _liveStatus, _liveTitle, _sessIsDone, _showArranquePanel, closeArranquePanel

### locus-sesiones-capture.js
- Cross references: 10
- Possible dependencies: locus-modals, locus-sesiones, locus-sesiones-stats, locus-session-hora, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell, locus-workers

### locus-sesiones-stats.js
- Cross references: 13
- Possible dependencies: locus-backlog-core, locus-backlog-panel, locus-backlog-sprints, locus-map-generator, locus-notifications, locus-pulso, locus-sesiones, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-ui-shell, locus-workers
- Globals: _updateHeaderProjectLabel, _markStatusBarDirty

### locus-sesiones-utils.js
- Cross references: 3
- Possible dependencies: locus-sesiones, locus-storage, locus-ui-shell
- Globals: _hwcClick, _exportWeeklySummaryMd, dismissWeeklySummary

### locus-sesiones-viz.js
- Cross references: 7
- Possible dependencies: locus-sesiones, locus-sesiones-capture, locus-sesiones-stats, locus-session-hora, locus-storage, locus-toast, locus-ui-shell

### locus-sesiones.js
- Cross references: 15
- Possible dependencies: locus-notifications, locus-radar, locus-reports, locus-sesiones-capture, locus-sesiones-stats, locus-sesiones-utils, locus-session-hora, locus-session-parse, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell, locus-workers
- Globals: _isInSession, _isInSession, fmt12, fmt12, getCD, getCD, innerWidth, _markTrackerDirty, _radarSbInited, _radarSbInited

### locus-session-hora.js
- Cross references: 5
- Possible dependencies: locus-session-parse, locus-session-save, locus-storage, locus-toast, locus-ui-shell

### locus-session-parse.js
- Cross references: 15
- Possible dependencies: locus-backlog-core, locus-backlog-item, locus-backlog-merge, locus-backlog-render, locus-contracts, locus-docs, locus-sesiones, locus-sesiones-viz, locus-session-hora, locus-session-save, locus-sprint, locus-sprint-plan, locus-storage, locus-toast, locus-ui-shell

### locus-session-popup.js
- Cross references: 8
- Possible dependencies: locus-sesiones, locus-session-hora, locus-session-parse, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: popAIId, popSessId, popAIId, popSessId, confirm, onload, addEventListener, render

### locus-session-save.js
- Cross references: 17
- Possible dependencies: locus-backlog-core, locus-backlog-item, locus-backlog-merge, locus-backlog-render, locus-docs, locus-notifications, locus-radar, locus-sesiones, locus-sesiones-viz, locus-session-hora, locus-session-parse, locus-session-popup, locus-sprint, locus-sprint-project, locus-storage, locus-toast, locus-ui-shell
- Globals: _stopSessionTimer, _stopSessionTimer, _stopSessionTimer, _stopSessionTimer, _pendingTemplateDownload

### locus-sprint-plan.js
- Cross references: 4
- Possible dependencies: locus-sprint, locus-storage, locus-toast, locus-ui-shell
- Globals: renderPlan, renderPlanInto, savePlan, loadPlan, togglePlanZoneDone, _liveStatus, _sessIsDone

### locus-sprint-project.js
- Cross references: 17
- Possible dependencies: locus-analytics-render, locus-backlog-core, locus-backlog-item, locus-backlog-render, locus-docs, locus-item-editor, locus-map-viewer, locus-modals, locus-projects, locus-reports, locus-sesiones, locus-sesiones-stats, locus-session-popup, locus-sprint, locus-storage, locus-toast, locus-ui-shell
- Globals: _updateHeaderProjectLabel, _updateHeaderProjectLabel, _updateHeaderProjectLabel, _updateHeaderProjectLabel, _updateHeaderProjectLabel, _updateHeaderProjectLabel, getProjectById, _getActiveProjectFilter, pad, pad, _sprintNum, exportBacklogMd, openProjPanel, selectProjectFilter, _docPrefix, getProjContext, exportFullHistoryMd, _generateFullHistoryContent, exportContextMd, _countProjSessions

### locus-sprint.js
- Cross references: 9
- Possible dependencies: locus-backlog-core, locus-backlog-panel, locus-backlog-render, locus-backlog-sprints, locus-modals, locus-sesiones, locus-sprint-plan, locus-storage, locus-toast
- Globals: renderSprintTab, _renderSprintItems, _renderSprintWorkers, _renderSprintScopeAdded, _sptSwitch, _renderSprintPlanificar, _spmToggle, _spmRegistrar, _spmReactivar, _spmRetro, _spmEditar, _spmCancelEdit, _spmActivarExistente, _spmPickerSelect, _spmPickerKey, _spmPickerClose, _spmUpdateButtons

### locus-storage.js
- Cross references: 12
- Possible dependencies: locus-api, locus-backlog-core, locus-backlog-render, locus-notifications, locus-pulso, locus-radar, locus-sesiones, locus-sesiones-stats, locus-sprint, locus-sprint-project, locus-toast, locus-ui-shell
- Globals: _getActiveProjectFilter, _getActiveProjectFilter, Locus, _exportBacklogMd, _exportBacklogMd, Locus, Locus, __ENV, SUPABASE_URL, __ENV, SUPABASE_ANON_KEY, addEventListener, addEventListener, location, open, location, location, addEventListener

### locus-toast.js
- Cross references: 2
- Possible dependencies: locus-api, locus-ui-shell
- Globals: innerWidth, showToast, showToastDigest, showToastInline, _toastRender, _dismissToast, _toastNext, toast

### locus-ui-shell.js
- Cross references: 28
- Possible dependencies: locus-analytics-render, locus-backlog-core, locus-backlog-merge, locus-backlog-panel, locus-backlog-render, locus-backlog-sprints, locus-contracts, locus-docs, locus-item-editor, locus-map-generator, locus-map-viewer, locus-modals, locus-notifications, locus-projects, locus-pulso, locus-radar, locus-sesiones, locus-sesiones-capture, locus-sesiones-stats, locus-sesiones-viz
- Globals: confirm, focusActiveId, _gChordPending, _gChordTimer, _gChordTimer, _gChordPending, _gChordPending, _gChordPending, _gChordTimer, focusActiveId, focusActiveId, focusActiveId, _lastCheckpointResult, esc, switchTab, switchSubTab, toggleTheme, applyTheme, openShortcutsRef, renderSetupChecklist

### locus-workers.js
- Cross references: 8
- Possible dependencies: locus-map-generator, locus-modals, locus-sesiones, locus-sesiones-capture, locus-sesiones-stats, locus-storage, locus-toast, locus-ui-shell
- Globals: openAddAI, confirmAddAI, confirmClear, deleteAI, archiveAI, toggleArchivedSection, toggleCardMenu, closeCardMenu, showInlineConfirm, closeInlineConfirm, executeConfirm, openAvatarModal, selectAvatarOption, confirmAvatarModal, closeAvatarModal

## Critical Candidates

- locus-api.js -> HIGH COUPLING (12)
- locus-backlog-core.js -> HIGH COUPLING (19)
- locus-backlog-item.js -> HIGH COUPLING (13)
- locus-backlog-merge.js -> HIGH COUPLING (11)
- locus-backlog-panel.js -> HIGH COUPLING (10)
- locus-backlog-render.js -> HIGH COUPLING (10)
- locus-backlog-sprints.js -> HIGH COUPLING (12)
- locus-command-palette.js -> HIGH COUPLING (13)
- locus-map-generator.js -> HIGH COUPLING (11)
- locus-projects.js -> HIGH COUPLING (11)
- locus-reports.js -> HIGH COUPLING (16)
- locus-sesiones-capture.js -> HIGH COUPLING (10)
- locus-sesiones-stats.js -> HIGH COUPLING (13)
- locus-sesiones.js -> HIGH COUPLING (15)
- locus-session-parse.js -> HIGH COUPLING (15)
- locus-session-save.js -> HIGH COUPLING (17)
- locus-sprint-project.js -> HIGH COUPLING (17)
- locus-sprint.js -> HIGH COUPLING (9)
- locus-storage.js -> HIGH COUPLING (12)
- locus-ui-shell.js -> HIGH COUPLING (28)