# T-202605-068 · T4 · Inventario ES Modules — Import Map
<!-- PP · sprint:PP-S-09 · generado: 2026-05-28 UTC-6 -->

## Resumen

| Métrica | Valor |
|---|---|
| Módulos JS | 42 |
| Guards totales | 479 |
| Importables (tienen módulo dueño) | 343 |
| Globals legítimos (sin módulo dueño) | 109 |
| Módulos sin guards | 5 |

## Orden de ejecución

Ordenado de menor a mayor número de imports a agregar.

| # | Módulo | Guards importables | Guards globals |
|---|---|---|---|
| 1 | `locus-analytics-core.js` | 1 | 0 |
| 2 | `locus-api.js` | 1 | 0 |
| 3 | `locus-item-editor.js` | 2 | 1 |
| 4 | `locus-misc-ui.js` | 2 | 0 |
| 5 | `locus-pulso.js` | 2 | 1 |
| 6 | `locus-sesiones-capture.js` | 3 | 0 |
| 7 | `locus-sesiones-viz.js` | 3 | 1 |
| 8 | `locus-sprint-plan.js` | 3 | 0 |
| 9 | `locus-docs.js` | 4 | 0 |
| 10 | `locus-contracts.js` | 5 | 1 |
| 11 | `locus-sesiones-arranque.js` | 5 | 0 |
| 12 | `locus-session-popup.js` | 5 | 0 |
| 13 | `locus-workers.js` | 6 | 0 |
| 14 | `locus-backlog-panel.js` | 7 | 11 |
| 15 | `locus-notifications.js` | 7 | 2 |
| 16 | `locus-radar.js` | 7 | 0 |
| 17 | `locus-sesiones-utils.js` | 7 | 1 |
| 18 | `locus-backlog-merge.js` | 8 | 0 |
| 19 | `locus-projects.js` | 8 | 2 |
| 20 | `locus-sprint-project.js` | 8 | 2 |
| 21 | `locus-backlog-item.js` | 11 | 7 |
| 22 | `locus-session-save.js` | 11 | 0 |
| 23 | `locus-backlog-core.js` | 13 | 10 |
| 24 | `locus-backlog-sprints.js` | 14 | 7 |
| 25 | `locus-sesiones-stats.js` | 14 | 1 |
| 26 | `locus-sprint.js` | 15 | 11 |
| 27 | `locus-reports.js` | 18 | 0 |
| 28 | `locus-storage.js` | 18 | 6 |
| 29 | `locus-command-palette.js` | 19 | 4 |
| 30 | `locus-session-parse.js` | 20 | 2 |
| 31 | `locus-map-generator.js` | 21 | 2 |
| 32 | `locus-sesiones.js` | 23 | 7 |
| 33 | `locus-ui-shell.js` | 52 | 20 |

## Módulos sin guards (no requieren cambios)

- `locus-analytics-charts.js`
- `locus-analytics-digest.js`
- `locus-analytics-render.js`
- `locus-backlog-archive.js`
- `locus-modals.js`
- `locus-session-hora.js`

## Globals legítimos (guards que se mantienen)

Funciones bajo guard que no tienen módulo dueño en el ecosistema — no se importan, el guard es válido.

- `_acvSaveEdit`
- `_assignPendingIds`
- `_attachBacklogListDelegation`
- `_attachPlanViewDelegation`
- `_attachSprintBarDelegation`
- `_blSprintClose`
- `_blSprintOpen`
- `_blSprintSelect`
- `_blSprintToggleClosed`
- `_bnsf_confirm`
- `_buildCurrentSessionCard`
- `_buildPulsoPlanesHtml`
- `_buildSprintHealthPanel`
- `_calcProjVelocity`
- `_confirmUnlinkChild`
- `_dropzoneHandle`
- `_estimateSprintClose`
- `_generateContext`
- `_getCurrentSession`
- `_idpAddNote`
- `_idpAddNote_fromBtn`
- `_idpCancelTitle`
- `_idpCopyCode`
- `_idpMarkDone`
- `_idpSaveTitle`
- `_idpStartEditTitle`
- `_idpToggleAc`
- `_idpToggleHistory`
- `_inlineEditTitle`
- `_kbCardClick`
- `_kbDrop`
- `_mgInferStatus`
- `_planDragEnd`
- `_planDragLeave`
- `_planDragOver`
- `_planDragStart`
- `_planDrop`
- `_promoteSelectType`
- `_refreshMigrationBtnVisibility`
- `_refreshParentIdDropdown`
- `_renderSprintPlanificar`
- `_renderTrackerSidebar`
- `_scmBack`
- `_scmDownloadRetro`
- `_scmNext`
- `_showArranquePanel`
- `_spmActivarExistente`
- `_spmEditar`
- `_spmPickerKey`
- `_spmPickerSelect`
- `_spmReactivar`
- `_spmRegistrar`
- `_spmRetro`
- `_spmToggle`
- `_sptSwitch`
- `_stopHoyTicker`
- `_syncViewAriaStates`
- `_trackerHistAttachDropTargets`
- `_trackerRenderMiniHist`
- `_trackerSelectAI`
- `_trackerSwitchCol`
- `cb`
- `checkStorageWarn`
- `clearAllFilters`
- `clearBacklogSearch`
- `closeArranquePanel`
- `closeAuthModal`
- `closeCloseSprintModal`
- `closeCommandPalette`
- `closePendPanel`
- `closeQuickNote`
- `closeSprintRetroOverlay`
- `confirmEditSprint`
- `copyItemCode`
- `copyItemToClipboard`
- `dismissToast`
- `downloadGlobalReport`
- `exportData`
- `fn`
- `handleSyncPillClick`
- `importData`
- `onBacklogSearch`
- `onRendered`
- `openAuthModal`
- `openChangelog`
- `openCleanProjectModal`
- `openCommandPalette`
- `openDocLog`
- `openMigrateFirebaseModal`
- `openNewSprintInline`
- `openPendPanel`
- `openQuickNote`
- `openStandaloneCheckpoint`
- `renderAIStatusBar`
- `renderHoy`
- `renderProjDots`
- `renderSessionList`
- `searchContratos`
- `toggleBacklogBlockerFilter`
- `toggleBacklogKanbanMode`
- `toggleBacklogMikeMode`
- `toggleBacklogNoAcMode`
- `toggleBacklogTreeMode`
- `toggleContextSection`
- `toggleMoreMenu`
- `toggleSprintHealthPanel`
- `toggleStatusFilter`
- `toggleTemplateTrigger`
- `toggleTmplTriggerPanel`

## Imports necesarios por módulo

Para cada módulo: qué funciones importar y desde qué archivo.

### `locus-analytics-core.js`
Guards importables: 1 · Guards globals (keeper): 0

```js
import { _markAnalyticsDirty } from './locus-analytics-render.js';
```

### `locus-api.js`
Guards importables: 1 · Guards globals (keeper): 0

```js
import { _effectiveVersion } from './locus-storage.js';
```

### `locus-backlog-core.js`
Guards importables: 13 · Guards globals (keeper): 10

```js
import { _normalizeStatus } from './locus-backlog-item.js';
import { _markBacklogListDirty } from './locus-backlog-render.js';
import { _getActiveSprint, renderSprintBurndown, renderSprintItems } from './locus-backlog-sprints.js';
import { openItemEditor } from './locus-item-editor.js';
import { toggleCollapseAll } from './locus-sesiones-stats.js';
import { _blogLog, _effectiveVersion, _loadFromSupabase, getAllSessions, saveBacklog } from './locus-storage.js';
import { showToast } from './locus-toast.js';
```

### `locus-backlog-item.js`
Guards importables: 11 · Guards globals (keeper): 7

```js
import { _applyDoneStatus, _hasRecentSession, _undoSnapshot, renderStats } from './locus-backlog-core.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _normalizeSprint } from './locus-session-parse.js';
import { _blogLog, getAI, getAllSessions, saveBacklog } from './locus-storage.js';
```

### `locus-backlog-merge.js`
Guards importables: 8 · Guards globals (keeper): 0

```js
import { loadBacklog } from './locus-backlog-core.js';
import { _markBacklogListDirty } from './locus-backlog-render.js';
import { _getSprintById } from './locus-backlog-sprints.js';
import { getActiveProject, getActiveSprints } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import { switchSubTab, switchTab } from './locus-ui-shell.js';
```

### `locus-backlog-panel.js`
Guards importables: 7 · Guards globals (keeper): 11

```js
import { toggleBacklogFocusMode } from './locus-backlog-core.js';
import { exportBacklogMd } from './locus-sprint-project.js';
import { getAI, getAllSessions, save, saveImmediate } from './locus-storage.js';
import { showToast } from './locus-toast.js';
```

### `locus-backlog-sprints.js`
Guards importables: 14 · Guards globals (keeper): 7

```js
import { _isBlocked } from './locus-backlog-core.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { _templateTrigger } from './locus-session-hora.js';
import { _docPrefix, getProjectById } from './locus-sprint-project.js';
import { _effectiveVersion, getAI, getActiveSprints, getAllSessions } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import { esc, switchSubTab, switchTab } from './locus-ui-shell.js';
```

### `locus-command-palette.js`
Guards importables: 19 · Guards globals (keeper): 4

```js
import { toggleFocusMode } from './locus-backlog-panel.js';
import { confirmCloseSprint, navigateToItem } from './locus-backlog-sprints.js';
import { openItemEditor, openTemplatePicker } from './locus-item-editor.js';
import { toggleRadarSidebar } from './locus-radar.js';
import { openQuickCapture } from './locus-sesiones-capture.js';
import { openDetail } from './locus-session-popup.js';
import { _getActiveProjectFilter, exportBacklogMd, openProjPanel, selectProjectFilter } from './locus-sprint-project.js';
import { getActiveProject, getActiveSprints } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import { openShortcutsRef, switchSubTab, switchTab, toggleTheme } from './locus-ui-shell.js';
```

### `locus-contracts.js`
Guards importables: 5 · Guards globals (keeper): 1

```js
import { renderStats } from './locus-backlog-core.js';
import { _focusFirstInteractive, _restoreModalFocus } from './locus-modals.js';
import { _offlineQueuePush, setSyncStatus } from './locus-storage.js';
```

### `locus-docs.js`
Guards importables: 4 · Guards globals (keeper): 0

```js
import { _updateUndoUI } from './locus-backlog-core.js';
import { _mgGetVersion } from './locus-map-generator.js';
import { renderHtmlMap, updateHtmlMapBanner } from './locus-map-viewer.js';
```

### `locus-item-editor.js`
Guards importables: 2 · Guards globals (keeper): 1

```js
import { _restoreModalFocus, _saveModalTrigger } from './locus-modals.js';
```

### `locus-map-generator.js`
Guards importables: 21 · Guards globals (keeper): 2

```js
import { archiveClosedItems } from './locus-backlog-archive.js';
import { editSprintInline } from './locus-backlog-sprints.js';
import { _getMapContent, _importContextMdFromText, exportHtmlMapMd, importHtmlMap } from './locus-docs.js';
import { _tryIngestPlan } from './locus-session-parse.js';
import { buildBacklogMd } from './locus-session-save.js';
import { _docPrefix, _generateFullHistoryContent, exportBacklogMd, exportContextMd, exportFullHistoryMd, getProjContext } from './locus-sprint-project.js';
import { _effectiveVersion, _tplKey, getAISessions, getActiveProject, getActiveSprints } from './locus-storage.js';
import { showToast, showToastInline } from './locus-toast.js';
```

### `locus-misc-ui.js`
Guards importables: 2 · Guards globals (keeper): 0

```js
import { _restoreModalFocus, _saveModalTrigger } from './locus-modals.js';
```

### `locus-notifications.js`
Guards importables: 7 · Guards globals (keeper): 2

```js
import { setFilter } from './locus-backlog-item.js';
import { navigateToItem } from './locus-backlog-sprints.js';
import { renderGlobalRadarSidebar } from './locus-radar.js';
import { navigateToCard } from './locus-sesiones-stats.js';
import { getActiveSprints, getAllSessions } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';
```

### `locus-projects.js`
Guards importables: 8 · Guards globals (keeper): 2

```js
import { _calcRelevanceScore } from './locus-backlog-core.js';
import { _getActiveSprint } from './locus-backlog-sprints.js';
import { loadHtmlMap } from './locus-map-viewer.js';
import { relDate } from './locus-session-hora.js';
import { _getActiveProjectFilter, _updateProjBreadcrumb, setProjContext } from './locus-sprint-project.js';
import { switchSubTab } from './locus-ui-shell.js';
```

### `locus-pulso.js`
Guards importables: 2 · Guards globals (keeper): 1

```js
import { switchSubTab, switchTab } from './locus-ui-shell.js';
```

### `locus-radar.js`
Guards importables: 7 · Guards globals (keeper): 0

```js
import { _notifConfigSetEnabled, _notifConfigSetThreshold, markAllNotifsRead, markNotifRead } from './locus-notifications.js';
import { openQuickCapture } from './locus-sesiones-capture.js';
import { navigateToCard } from './locus-sesiones-stats.js';
import { openAddAI } from './locus-workers.js';
```

### `locus-reports.js`
Guards importables: 18 · Guards globals (keeper): 0

```js
import { loadBacklog } from './locus-backlog-core.js';
import { renderBacklogList } from './locus-backlog-render.js';
import { loadHtmlMap, renderHtmlMap, updateHtmlMapBanner } from './locus-map-viewer.js';
import { _focusFirstInteractive, _restoreModalFocus, _saveModalTrigger } from './locus-modals.js';
import { renderGlobalRadarSidebar } from './locus-radar.js';
import { updateStats } from './locus-sesiones-stats.js';
import { render } from './locus-sesiones.js';
import { _templateTrigger } from './locus-session-hora.js';
import { _getActiveProjectFilter, getProjectById } from './locus-sprint-project.js';
import { _offlineQueuePush, _subscribeRealtime, _unsubscribeRealtime, setSyncStatus } from './locus-storage.js';
```

### `locus-sesiones-arranque.js`
Guards importables: 5 · Guards globals (keeper): 0

```js
import { _copyTextSafe } from './locus-sesiones-viz.js';
import { selectTrackerAI } from './locus-sesiones.js';
import { loadPlan } from './locus-sprint-plan.js';
import { _tplKey } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';
```

### `locus-sesiones-capture.js`
Guards importables: 3 · Guards globals (keeper): 0

```js
import { render } from './locus-sesiones.js';
import { openProjPanel } from './locus-sprint-project.js';
import { showToast } from './locus-toast.js';
```

### `locus-sesiones-stats.js`
Guards importables: 14 · Guards globals (keeper): 1

```js
import { _isCountableItem } from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { navigateToItem } from './locus-backlog-sprints.js';
import { openPulsoPanel } from './locus-pulso.js';
import { _markTrackerDirty, render, selectTrackerAI } from './locus-sesiones.js';
import { openDetail } from './locus-session-popup.js';
import { _getActiveProjectFilter, getProjectById } from './locus-sprint-project.js';
import { _effectiveVersion, getActiveProject, getActiveTracker, getAllSessions } from './locus-storage.js';
```

### `locus-sesiones-utils.js`
Guards importables: 7 · Guards globals (keeper): 1

```js
import { _cscardRelTs, render, selectTrackerAI } from './locus-sesiones.js';
import { getAI, getAISessions, getActiveProject } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';
```

### `locus-sesiones-viz.js`
Guards importables: 3 · Guards globals (keeper): 1

```js
import { render } from './locus-sesiones.js';
import { switchSubTab, switchTab } from './locus-ui-shell.js';
```

### `locus-sesiones.js`
Guards importables: 23 · Guards globals (keeper): 7

```js
import { updateTabNotifBadges } from './locus-notifications.js';
import { renderGlobalRadarSidebar } from './locus-radar.js';
import { _updateHeaderProjectLabel, renderStatusBar, updateStats } from './locus-sesiones-stats.js';
import { _renderActiveWorkerChip, renderSuggestionBanner, startSessionTimer } from './locus-sesiones-utils.js';
import { _templateTrigger, relDate } from './locus-session-hora.js';
import { closeLogCard, closePopup, openDetail } from './locus-session-popup.js';
import { getProjectById, openProjModal } from './locus-sprint-project.js';
import { getActiveProject, getActiveTracker, getAllSessions, saveImmediate } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import { renderSetupChecklist } from './locus-ui-shell.js';
import { openAddAI, toggleArchivedSection } from './locus-workers.js';
```

### `locus-session-parse.js`
Guards importables: 20 · Guards globals (keeper): 2

```js
import { renderStats } from './locus-backlog-core.js';
import { _isPlaceholderCode, applyPatchesFromTG } from './locus-backlog-item.js';
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { renderBacklogList } from './locus-backlog-render.js';
import { _ctrMergeFromItem } from './locus-contracts.js';
import { extractContextSections, extractHtmlMapSections, mergeContextSections, mergeHtmlMapSections } from './locus-docs.js';
import { showCheckpointPanel } from './locus-sesiones-viz.js';
import { _checkStorageQuota, _mergeBacklogWithProject } from './locus-session-save.js';
import { loadPlan, renderPlan } from './locus-sprint-plan.js';
import { _blogLog, _offlineQueuePush, getActiveProject, getActiveSprints } from './locus-storage.js';
import { showToast } from './locus-toast.js';
```

### `locus-session-popup.js`
Guards importables: 5 · Guards globals (keeper): 0

```js
import { _sessRelTsShared, render } from './locus-sesiones.js';
import { _getActiveProjectFilter } from './locus-sprint-project.js';
import { showToastInline } from './locus-toast.js';
import { switchSubTab } from './locus-ui-shell.js';
```

### `locus-session-save.js`
Guards importables: 11 · Guards globals (keeper): 0

```js
import { loadBacklog } from './locus-backlog-core.js';
import { applyPatchesFromTG } from './locus-backlog-item.js';
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { _markBacklogListDirty } from './locus-backlog-render.js';
import { updateTabNotifBadges } from './locus-notifications.js';
import { _markRadarDirty, renderGlobalRadarSidebar } from './locus-radar.js';
import { _generateBacklogContent } from './locus-sprint-project.js';
import { getAI, getActiveProject, getActiveSprints } from './locus-storage.js';
```

### `locus-sprint-plan.js`
Guards importables: 3 · Guards globals (keeper): 0

```js
import { _offlineQueuePush, _tplKey } from './locus-storage.js';
import { showToast } from './locus-toast.js';
```

### `locus-sprint-project.js`
Guards importables: 8 · Guards globals (keeper): 2

```js
import { loadHtmlMap } from './locus-map-viewer.js';
import { _syncCleanProjectBtn } from './locus-reports.js';
import { _effectiveVersion, _offlineQueuePush, getActiveProject, getActiveSprints, getSupabaseUserId } from './locus-storage.js';
import { switchTab } from './locus-ui-shell.js';
```

### `locus-sprint.js`
Guards importables: 15 · Guards globals (keeper): 11

```js
import { _isBlocked } from './locus-backlog-core.js';
import { openItemPanel } from './locus-backlog-panel.js';
import { _renderPlanningView } from './locus-backlog-render.js';
import { _getActiveSprint, confirmCloseSprint, createSprint, editSprintInline, openSprintRetroView, setSprintStatus } from './locus-backlog-sprints.js';
import { _gconfirmOpen } from './locus-modals.js';
import { renderPlanInto } from './locus-sprint-plan.js';
import { getAI, getActiveSprints, getAllSessions } from './locus-storage.js';
import { showToast } from './locus-toast.js';
```

### `locus-storage.js`
Guards importables: 18 · Guards globals (keeper): 6

```js
import { _localStorageUsageRatio, _migrateItemTypes, _purgeStaleBacklogCache } from './locus-backlog-core.js';
import { _markBacklogListDirty, renderBacklogList } from './locus-backlog-render.js';
import { updateTabNotifBadges } from './locus-notifications.js';
import { _markPulsoDotDirty, renderPulsoDot } from './locus-pulso.js';
import { _markRadarDirty, renderGlobalRadarSidebar } from './locus-radar.js';
import { _markStatusBarDirty, renderStatusBar, updateStats } from './locus-sesiones-stats.js';
import { _markTrackerDirty, render } from './locus-sesiones.js';
import { _getActiveProjectFilter, exportBacklogMd } from './locus-sprint-project.js';
import { showToast } from './locus-toast.js';
```

### `locus-ui-shell.js`
Guards importables: 52 · Guards globals (keeper): 20

```js
import { renderAnalytics } from './locus-analytics-render.js';
import { importBacklog, loadBacklog, renderStats, toggleBacklogFocusMode, updateBacklogBanner } from './locus-backlog-core.js';
import { showMergeDiffPanel } from './locus-backlog-merge.js';
import { closeItemPanel, exitFocusMode, openItemPanel } from './locus-backlog-panel.js';
import { renderBacklogList } from './locus-backlog-render.js';
import { navigateToItem } from './locus-backlog-sprints.js';
import { renderContratos } from './locus-contracts.js';
import { _renderDocsOnboarding, _renderTplProjBanner, _updateSubTabButtons, renderContext, updateBacklogModificationBadge, updateHtmlMapModificationBadge } from './locus-docs.js';
import { closeItemEditor, openItemEditor } from './locus-item-editor.js';
import { renderHtmlMap } from './locus-map-viewer.js';
import { _focusFirstInteractive } from './locus-modals.js';
import { openNotifConfig } from './locus-notifications.js';
import { renderProyectos } from './locus-projects.js';
import { closePulsoPanel } from './locus-pulso.js';
import { _markRadarDirty, renderGlobalRadarSidebar } from './locus-radar.js';
import { closeQuickCapture } from './locus-sesiones-capture.js';
import { navigateToCard } from './locus-sesiones-stats.js';
import { _itemVizClose, showCheckpointPanel } from './locus-sesiones-viz.js';
import { _stopSidebarTicker, render } from './locus-sesiones.js';
import { confirmSave, relDate } from './locus-session-hora.js';
import { closePopup, openDetail } from './locus-session-popup.js';
import { renderPlan } from './locus-sprint-plan.js';
import { _getActiveProjectFilter, closeProjModal, closeProjPanel, openProjModal, openProjPanel, selectProjectFilter } from './locus-sprint-project.js';
import { renderSprintTab } from './locus-sprint.js';
import { _saveUserPrefs, getAISessions, getAllSessions, save } from './locus-storage.js';
import { showToast } from './locus-toast.js';
import { openAddAI } from './locus-workers.js';
```

### `locus-workers.js`
Guards importables: 6 · Guards globals (keeper): 0

```js
import { _restoreModalFocus, _saveModalTrigger, closeModal } from './locus-modals.js';
import { render } from './locus-sesiones.js';
import { showToast } from './locus-toast.js';
import { switchTab } from './locus-ui-shell.js';
```

## Exports por módulo

Fuente de verdad de qué exporta cada archivo.

### `locus-analytics-charts.js`
`_buildHourlyInsightData`, `exportAnalyticsMd`, `renderCheckpointsByProject`, `renderHeatmap`, `renderHourly`, `renderProductivityPatterns`

### `locus-analytics-core.js`
`_animateCountUp`, `_closedItemsInRange`, `_delta`, `_getIntervalsInPeriod`, `_getPeriodBounds`, `_openedItemsInRange`, `_parseSpanishDate`, `_periodLabel`, `_posTooltip`, `_prevPeriodLabel`, `_sessInRange`, `exportWeeklySummary`, `fmtMonth`, `getAnalyticsColor`, `getAnalyticsMonths`, `getTooltip`, `hideAnalyticsTooltip`, `sessionDateKey`, `sessionYM`

### `locus-analytics-digest.js`
_(sin exports)_

### `locus-analytics-render.js`
`_markAnalyticsDirty`, `renderAnalytics`

### `locus-api.js`
_(sin exports)_

### `locus-backlog-archive.js`
`_sprintNum`, `archiveClosedItems`, `renderArchivoHistorico`, `toggleArchivoHistorico`

### `locus-backlog-core.js`
`_applyDoneStatus`, `_buildRoleChips`, `_calcPriority`, `_calcRelevanceScore`, `_getActiveSessionAiId`, `_getMiViewLabel`, `_getMiViewRoles`, `_getNextItemCode`, `_hasDepsBlocked`, `_hasRecentSession`, `_isBlocked`, `_isCountableItem`, `_localStorageUsageRatio`, `_migrateItemTypes`, `_openItemEditorSafe`, `_purgeStaleBacklogCache`, `_skelHide`, `_skelShow`, `_undoSnapshot`, `_updateUndoUI`, `buildItemRefs`, `effortDots`, `importBacklog`, `itemType`, `loadBacklog`, `redoBacklog`, `renderStats`, `setItemStatus`, `toggleBacklogFocusMode`, `toggleCollapseAll`, `undoBacklog`, `updateBacklogBanner`, `updateStatusFilterUI`

### `locus-backlog-item.js`
`_attachBacklogDnD`, `_isPlaceholderCode`, `_normalizeStatus`, `_renderKanban`, `applyPatchesFromTG`, `buildBacklogItem`, `mergeBacklogFromTG`, `setFilter`, `updateBacklogFooter`

### `locus-backlog-merge.js`
`_confirmDiscard`, `_confirmRetroceso`, `showMergeDiffPanel`

### `locus-backlog-panel.js`
`_backlogSetSelected`, `_buildItemMentionedIn`, `_buildItemMigratedBlock`, `closeItemPanel`, `exitFocusMode`, `openItemPanel`, `toggleFocusMode`

### `locus-backlog-render.js`
`_calcEstimatedVelocity`, `_markBacklogListDirty`, `_renderPlanningView`, `renderBacklogList`, `updateClearFilterBtn`

### `locus-backlog-sprints.js`
`_buildNewSprintForm`, `_getActiveSprint`, `_getSprintById`, `confirmCloseSprint`, `createSprint`, `editSprintInline`, `navigateToItem`, `openSprintRetroView`, `renderSprintBurndown`, `renderSprintItems`, `setItemSprint`, `setSprintStatus`

### `locus-command-palette.js`
_(sin exports)_

### `locus-contracts.js`
`_ctrMergeFromItem`, `_esc`, `pad`, `renderContratos`

### `locus-docs.js`
`_getMapContent`, `_importContextMdFromText`, `_renderDocsOnboarding`, `_renderTplProjBanner`, `_setBacklogModified`, `_updateSubTabButtons`, `exportHtmlMapMd`, `extractContextSections`, `extractHtmlMapSections`, `importHtmlMap`, `mergeContextSections`, `mergeHtmlMapSections`, `renderContext`, `updateBacklogModificationBadge`, `updateContextBanner`, `updateHtmlMapModificationBadge`

### `locus-item-editor.js`
`closeItemEditor`, `closePasteItems`, `openItemEditor`, `openTemplatePicker`

### `locus-map-generator.js`
`_mgGetVersion`, `esc`, `normalize`

### `locus-map-viewer.js`
`loadHtmlMap`, `parseHtmlMapMd`, `renderHtmlMap`, `updateHtmlMapBanner`

### `locus-misc-ui.js`
_(sin exports)_

### `locus-modals.js`
`_focusFirstInteractive`, `_gconfirmClose`, `_gconfirmOk`, `_gconfirmOpen`, `_restoreModalFocus`, `_saveModalTrigger`, `closeModal`

### `locus-notifications.js`
`_computeNotifications`, `_notifConfig`, `_notifConfigReset`, `_notifConfigSetEnabled`, `_notifConfigSetThreshold`, `_notifGoto`, `_notifReadSet`, `_registerNotifActions`, `closeNotifConfig`, `hasRecentSession`, `markAllNotifsRead`, `markNotifRead`, `openNotifConfig`, `updateTabNotifBadges`

### `locus-projects.js`
`renderProyectos`

### `locus-pulso.js`
`_markPulsoDotDirty`, `closePulsoPanel`, `openPulsoPanel`, `renderPulsoDot`

### `locus-radar.js`
`_initRadarSidebarState`, `_markRadarDirty`, `_rsbToggleCollapseAll`, `renderGlobalRadarSidebar`, `rsbClearSearch`, `rsbFilterAIs`, `rsbTogglePin`, `toggleRadarSidebar`

### `locus-reports.js`
`_syncCleanProjectBtn`, `downloadReport`

### `locus-sesiones-arranque.js`
_(sin exports)_

### `locus-sesiones-capture.js`
`closeQuickCapture`, `openQuickCapture`

### `locus-sesiones-stats.js`
`_isInSession`, `_markStatusBarDirty`, `_scrollToCard`, `_updateHeaderProjectLabel`, `navigateToCard`, `renderStatusBar`, `toggleCollapseAll`, `updateStats`

### `locus-sesiones-utils.js`
`_buildSuggestionReason`, `_renderActiveWorkerChip`, `renderSuggestionBanner`, `startSessionTimer`

### `locus-sesiones-viz.js`
`_copyTextSafe`, `_itemVizClose`, `closeCkptPanel`, `showCheckpointPanel`

### `locus-sesiones.js`
`_cscardRelTs`, `_hoyCountdownLabel`, `_hoyMsUntilReset`, `_markTrackerDirty`, `_sessRelTsShared`, `_stopSidebarTicker`, `_updateAutoDownloadLabel`, `render`, `selectTrackerAI`

### `locus-session-hora.js`
`_horaUpdate`, `_showProjRequiredInPanel`, `_templateTrigger`, `confirmSave`, `fmt12`, `interpretHora`, `relDate`

### `locus-session-parse.js`
`_normalizeSprint`, `_setPhase`, `_tryIngestPlan`, `parsePaste`

### `locus-session-popup.js`
`_getAllSessionsChron`, `_rebuildLogBody`, `closeLogCard`, `closePopup`, `openDetail`

### `locus-session-save.js`
`_checkStorageQuota`, `_doSaveSession`, `_mergeBacklogWithProject`, `buildBacklogMd`, `downloadTemplates`, `saveSession`

### `locus-sprint-plan.js`
`_liveStatus`, `_sessIsDone`, `loadPlan`, `renderPlan`, `renderPlanInto`, `savePlan`

### `locus-sprint-project.js`
`_countProjSessions`, `_docPrefix`, `_generateBacklogContent`, `_generateBacklogMd`, `_generateFullHistoryContent`, `_getActiveProjectFilter`, `_getLocalStorageUsage`, `_setActiveProjectFilter`, `_sprintNum`, `_updateProjBreadcrumb`, `_updateProjFilterBtn`, `closeProjModal`, `closeProjPanel`, `exportBacklogMd`, `exportContextMd`, `exportFullHistoryMd`, `getProjContext`, `getProjectById`, `openProjModal`, `openProjPanel`, `pad`, `selectProjectFilter`, `setProjContext`

### `locus-sprint.js`
`renderSprintTab`

### `locus-storage.js`
`_blogLog`, `_effectiveVersion`, `_findSession`, `_findSessionByAI`, `_loadFromSupabase`, `_offlineQueuePush`, `_projKey`, `_resetExpired`, `_saveUserPrefs`, `_shortcutsLoad`, `_shortcutsSave`, `_subscribeRealtime`, `_tplKey`, `_unsubscribeRealtime`, `getAI`, `getAISessions`, `getActiveProject`, `getActiveSprints`, `getActiveTracker`, `getAllSessions`, `getLastAISession`, `getProjectSessions`, `getSupabaseUserId`, `save`, `saveBacklog`, `saveContextDocs`, `saveImmediate`, `setSyncStatus`

### `locus-toast.js`
`_dismissToast`, `_toastNext`, `_toastRender`, `_toastVisibleCount`, `showToast`, `showToastDigest`, `showToastInline`, `toast`

### `locus-ui-shell.js`
`_escCascade`, `applyTheme`, `closeShortcuts`, `esc`, `onSearch`, `onSearchDispatch`, `openShortcuts`, `openShortcutsRef`, `renderSetupChecklist`, `restoreDefaultShortcuts`, `switchSubTab`, `switchTab`, `toggleTheme`

### `locus-workers.js`
`archiveAI`, `closeAvatarModal`, `closeCardMenu`, `closeInlineConfirm`, `confirmAddAI`, `confirmAvatarModal`, `confirmClear`, `deleteAI`, `executeConfirm`, `openAddAI`, `openAvatarModal`, `selectAvatarOption`, `showInlineConfirm`, `toggleArchivedSection`, `toggleCardMenu`
