# PP-MAP_v1.0.5.md
<!-- Versión: v1.0.5 | Actualizado: 29/05/2026, 08:57 AM UTC | Proyecto: PP | Status: sprint_activo -->

## Arquitectura del Proyecto

### /.
- index.html
- locus-analytics-charts.js
- locus-analytics-core.js
- locus-analytics-digest.js
- locus-analytics-render.js
- locus-analytics.css
- locus-api.js
- locus-archive.css
- locus-backlog-archive.js
- locus-backlog-core.js
- locus-backlog-item.css
- locus-backlog-item.js
- locus-backlog-merge.js
- locus-backlog-panel.js
- locus-backlog-render.js
- locus-backlog-sprints.js
- locus-backlog.css
- locus-base.css
- locus-command-palette.js
- locus-contracts.js
- locus-docs.css
- locus-docs.js
- locus-document-generator.css
- locus-item-editor.js
- locus-layout.css
- locus-map-generator.js
- locus-map-viewer.js
- locus-misc-ui.js
- locus-modals.css
- locus-modals.js
- locus-notifications.js
- locus-projects.js
- locus-proyectos.css
- locus-pulso.js
- locus-radar.css
- locus-radar.js
- locus-reports.js
- locus-sesiones-arranque.js
- locus-sesiones-capture.js
- locus-sesiones-card.css
- locus-sesiones-stats.js
- locus-sesiones-utils.js
- locus-sesiones-viz.js
- locus-sesiones.css
- locus-sesiones.js
- locus-session-hora.js
- locus-session-parse.js
- locus-session-popup.js
- locus-session-save.js
- locus-sprint-close.css
- locus-sprint-plan.css
- locus-sprint-plan.js
- locus-sprint-project.js
- locus-sprint-ui.css
- locus-sprint.css
- locus-sprint.js
- locus-storage.js
- locus-toast.js
- locus-ui-shell.js
- locus-workers.js

## index.html
**Líneas:** 1815 · **Size:** high · **Path:** `index.html`

**HTML IDs:** 488

## locus-analytics-charts.js
**Líneas:** 645 · **Size:** medium · **mod:** — · **Changed in:** —

**Exports:** renderHeatmap, _buildHourlyInsightData, renderHourly, renderProductivityPatterns, renderCheckpointsByProject, exportAnalyticsMd

| Función | Área | Calls |
|---------|------|-------|
| L18 · renderHeatmap | Render | count, forEach, getAllSessions, getDate, getDay, keys |
| L62 · levelClass | Internal | find, forEach, getMonth, semana |
| L83 · weekLabel | Internal | find, includes, indexOf, join, levelClass, map |
| L143 · _buildHourlyInsightData | Builder | fill, forEach, getHours, getItem, getTime, hora |
| L157 · allProjects | Internal | forEach, getHours, getItem, getTime, indexOf, max |
| L183 · renderHourly | Render | fill, forEach, getAllSessions, hora, indexOf, map |
| L276 · renderProductivityPatterns | Render | _closedForProj, _getPeriodBounds, forEach, getAllSessions, getItem, getProjectById |
| L288 · _closedForProj | Internal | fill, forEach, getItem, getProjectById, parse |
| L311 · _makeEntry | Internal | _parseSpanishDate, fill, forEach, getDay, getTime, replace |
| L365 · _peakDow | Internal | _miniDowBar, _miniHourBar, _peakHour, indexOf, join, map |
| L371 · _peakHour | Internal | _miniDowBar, _miniHourBar, indexOf, join, map, max |
| L378 · _miniDowBar | Internal | _miniHourBar, join, map, max, padStart, push |
| L390 · _miniHourBar | Internal | _closedForProj, _peakDow, _peakHour, esc, find, join |
| L450 · renderCheckpointsByProject | Render | _addToProj, _sessInRange, fijos, getAllSessions, getDate, getDay |
| L479 · _addToProj | Internal | forEach, getProjectById |
| L577 · exportAnalyticsMd | Save / Load | add, filter, forEach, getAISessions, getAllSessions, getAnalyticsMonths |

## locus-analytics-core.js
**Líneas:** 551 · **Size:** medium · **mod:** 3 · **Changed in:** —

**Exports:** getAnalyticsColor, _getPeriodBounds, _sessInRange, _periodLabel, _prevPeriodLabel, _delta, _getIntervalsInPeriod, getAnalyticsMonths, fmtMonth, sessionYM, _parseSpanishDate, sessionDateKey, getTooltip, _posTooltip, hideAnalyticsTooltip, _animateCountUp, _closedItemsInRange, _openedItemsInRange, exportWeeklySummary

| Función | Área | Calls |
|---------|------|-------|
| L26 · getAnalyticsColor | Utils | _markAnalyticsDirty, clearComparison, getItem, renderAnalytics, setAnalyticsPeriod, setCompareProject |
| L36 · setCompareProject | Utils | _markAnalyticsDirty, clearComparison, forEach, renderAnalytics, setAnalyticsPeriod, setAnalyticsRange |
| L40 · setCompareProjectA | Utils | _markAnalyticsDirty, clearComparison, forEach, renderAnalytics, setAnalyticsPeriod, setAnalyticsRange |
| L44 · setCompareProjectB | Utils | _markAnalyticsDirty, clearComparison, forEach, renderAnalytics, setAnalyticsPeriod, setAnalyticsRange |
| L48 · clearComparison | Internal | _getPeriodBounds, _markAnalyticsDirty, forEach, renderAnalytics, rodantes, setAnalyticsPeriod |
| L54 · setAnalyticsPeriod | Utils | _getPeriodBounds, _markAnalyticsDirty, forEach, getDate, getMilliseconds, renderAnalytics |
| L65 · setAnalyticsRange | Utils | _getPeriodBounds, _markAnalyticsDirty, floor, getDate, getFullYear, getMilliseconds |
| L70 · setCfProject | Utils | _getPeriodBounds, _markAnalyticsDirty, floor, getDate, getFullYear, getMilliseconds |
| L71 · setCfType | Utils | _getPeriodBounds, _markAnalyticsDirty, floor, getDate, getFullYear, getMilliseconds |
| L74 · _getPeriodBounds | Internal | _sessInRange, filter, floor, getDate, getFullYear, getMilliseconds |
| L101 · _sessInRange | Internal | _getPeriodBounds, _parseSpanishDate, _periodLabel, _prevPeriodLabel, filter, floor |
| L111 · _periodLabel | Internal | _getPeriodBounds, _prevPeriodLabel, floor, getDate, getFullYear, getMonth |
| L126 · _prevPeriodLabel | Internal | _delta, _getPeriodBounds, abs, floor, getDate, getFullYear |
| L145 · _delta | Internal | _getIntervalsInPeriod, _getPeriodBounds, _getWeeksInPeriod, abs, round, semanas |
| L157 · _getWeeksInPeriod | Internal | _getIntervalsInPeriod, _getPeriodBounds, getDate, getDay, push, semana |
| L166 · _getIntervalsInPeriod | Internal | _getPeriodBounds, getDate, getDay, push, semana, setDate |
| L203 · lastNMonths | Internal | _parseSpanishDate, fmtMonth, getAnalyticsMonths, getFullYear, getMonth, getTime |
| L214 · getAnalyticsMonths | Utils | _parseSpanishDate, fmtMonth, getFullYear, getMonth, getTime, lastNMonths |
| L217 · fmtMonth | Internal | _parseSpanishDate, getFullYear, getMonth, getTime, match, padStart |
| L224 · sessionYM | Internal | _parseSpanishDate, getFullYear, getMonth, getTime, match, padStart |
| L233 · _parseSpanishDate | Parser | getDate, getFullYear, getMonth, getTime, getTooltip, match |
| L252 · sessionDateKey | Internal | _parseSpanishDate, getDate, getFullYear, getMonth, getTime, getTooltip |
| L262 · getTooltip | Utils | _posTooltip, add, esc, join, map, reduce |
| L271 · showAnalyticsTooltip | UI | _posTooltip, add, esc, getTooltip, join, map |
| L294 · _posTooltip | Internal | _animateCountUp, getTooltip, hideAnalyticsTooltip, now, remove |
| L307 · hideAnalyticsTooltip | UI | _animateCountUp, easeOut, forEach, getTooltip, min, now |
| L315 · _animateCountUp | Internal | Children, easeOut, forEach, min, node, now |
| L325 · easeOut | Internal | Children, forEach, min, node, pow, prefix |
| L327 · tick | Internal | Children, easeOut, forEach, min, node, prefix |
| L359 · _closedItemsInRange | Internal | _openedItemsInRange, forEach, getItem, parse |
| L378 · _openedItemsInRange | Internal | _closedItemsDetailInRange, forEach, getItem, parse |
| L396 · _closedItemsDetailInRange | Internal | _openedItemsDetailInRange, forEach, getItem, parse, push |
| L417 · _openedItemsDetailInRange | Internal | exportWeeklySummary, forEach, getDate, getItem, parse, push |
| L437 · exportWeeklySummary | Save / Load | _closedItemsDetailInRange, _openedItemsDetailInRange, _sessInRange, find, forEach, getAllSessions |

## locus-analytics-digest.js
**Líneas:** 216 · **Size:** low · **mod:** — · **Changed in:** —

| Función | Área | Calls |
|---------|------|-------|
| L8 · _buildCumulativeFlowChart | Builder | filter, forEach, getItem, map, min, parse |
| L48 · buildPoints | Builder | forEach, getDate, getMonth, push, setDate, setHours |
| L81 · xOf | Internal | buildPath, fills, filter, flatMap, join, map |
| L82 · yOf | Internal | buildPath, fills, filter, flatMap, join, map |
| L85 · buildPath | Builder | fills, filter, flatMap, forEach, join, map |
| L102 · allSprints | Internal | filter, flatMap, fmtDate, forEach, from, getDate |
| L130 · fmtDate | Internal | abs, ceil, esc, filter, getDate, getDay |

## locus-analytics-render.js
**Líneas:** 1092 · **Size:** medium · **mod:** — · **Changed in:** —

**Exports:** _markAnalyticsDirty, renderAnalytics

| Función | Área | Calls |
|---------|------|-------|
| L19 · _markAnalyticsDirty | Internal | _getPeriodBounds, _sessInRange, add, contains, fill, getAllSessions |
| L22 · renderAnalytics | Render | _getPeriodBounds, _sessInRange, add, contains, fill, getAllSessions |
| L28 · _cpOpen | Internal | _getPeriodBounds, _sessInRange, add, contains, fill, getAllSessions |
| L62 · _dominantProject | Internal | _activeProjectCount, _closedItemsInRange, _filesKpi, _openedItemsInRange, entries, filter |
| L71 · _activeProjectCount | Internal | _closedItemsInRange, _dominantProject, _filesKpi, _openedItemsInRange, add, filter |
| L84 · _filesKpi | Internal | add, entries, filter, forEach, map, sessionDateKey |
| L121 · _buildBarChart | Builder | _getIntervalsInPeriod, _sessInRange, filter, forEach, getAnalyticsColor, map |
| L161 · _shouldShowLabel | Internal | _intervalLabel, _intervalTooltipLabel, getDate, getDay, getMonth |
| L168 · _intervalLabel | Internal | _intervalTooltipLabel, bezier, getDate, getDay, getMonth, scaleY |
| L178 · _intervalTooltipLabel | Internal | bezier, getDate, getDay, getMonth, scaleY, yOf |
| L219 · barH | Internal | _intervalLabel, _intervalTooltipLabel, _shouldShowLabel, barra, esc, getProjectById |
| L225 · staggerDelay | Internal | _intervalLabel, _shouldShowLabel, barra, esc, getProjectById, join |
| L258 · _kpiEmptyExtra | Internal | _totalPendingItems, filter, globales, map, peor, sesiones |
| L287 · _totalPendingItems | Internal | _closedItemsInRange, _getIntervalsInPeriod, _openedItemsInRange, _sessInRange, _sparklineForIntervals, forEach |
| L306 · _sparklineForIntervals | Internal | _closedItemsInRange, _delta, _getIntervalsInPeriod, _kpiCard, _openedItemsInRange, _prevPeriodLabel |
| L323 · _kpiCard | Internal | _delta, _prevPeriodLabel, join, map, max, min |
| L390 · _projMetricsSbs | Internal | _sessForProj, add, filter, forEach, map, reduce |
| L415 · _sessForProj | Internal | _cmpRow, _delta, _projMetricsSbs, filter, getProjectById |
| L434 · _cmpRow | Internal | _delta |
| L485 · _buildCompareSelector | Builder | _cycleTimeData, esc, filter, forEach, getItem, join |
| L505 · _cycleTimeData | Internal | forEach, getItem, max, parse, push, round |
| L520 · t | Internal | avg, filter, outliers, push, reduce, round |
| L537 · avg | Internal | filter, forEach, getItem, localStorage, outliers, parse |
| L611 · _ctDaysLabel | Internal | _ctSparkHtml, _ctTrendHtml, bueno, join, map, max |
| L616 · _ctTrendHtml | Internal | _ctSparkHtml, bueno, join, map, max, min |
| L623 · _ctSparkHtml | Internal | _ctOutliersHtml, bueno, esc, join, map, max |
| L646 · _ctOutliersHtml | Internal | _ctSparkHtml, _ctTrendHtml, esc, join, map, navigateToItem |
| L737 · _buildForecastData | Builder | filter, flatMap, forEach, getItem, map, parse |
| L748 · type | Internal | entries, filter, flatMap, has, localeCompare, map |
| L789 · type | Internal | _buildForecastData, ceil, map, registrado |
| L814 · _forecastHtml | Internal | join, registrado |
| L1081 · _getAnalyticsAIs | Internal | _getActiveProjectFilter, filter, getProjectById, has, map |

## locus-api.js
**Líneas:** 83 · **Size:** low · **mod:** 5 · **Changed in:** —

## locus-backlog-archive.js
**Líneas:** 334 · **Size:** low · **mod:** — · **Changed in:** —

**Exports:** archiveClosedItems, renderArchivoHistorico, toggleArchivoHistorico, _sprintNum

| Función | Área | Calls |
|---------|------|-------|
| L19 · archiveClosedItems | Internal | _renderHistoricoSection, body, forEach, renderArchivoHistorico, renderBacklogList, renderStats |
| L48 · renderArchivoHistorico | Render | esc, filter, getActiveSprints, getItem, preventDefault, sort |
| L52 · isOpen | Internal | esc, filter, getActiveSprints, getItem, preventDefault, setArchivoView |
| L53 · activeView | Internal | esc, filter, getActiveSprints, getItem, preventDefault, setArchivoView |
| L100 · toggleArchivoHistorico | UI | _renderArchivoBody, add, contains, getItem, remove, setArchivoView |
| L118 · activeView | Internal | _renderArchivoBody, _renderArchivoViewFlat, _renderArchivoViewSprint, add, forEach, getItem |
| L126 · setArchivoView | Utils | _archItemRow, _renderArchivoBody, _renderArchivoViewFlat, _renderArchivoViewSprint, _sprintNum, forEach |
| L136 · _renderArchivoBody | Render | _archItemRow, _renderArchivoViewFlat, _renderArchivoViewSprint, _sprintNum, esc, match |
| L148 · _sprintNum | Internal | _archItemRow, _archSprintEntryHtml, esc, match, repeat, toLowerCase |
| L149 · m | Internal | _archItemRow, _archSprintEntryHtml, esc, match, repeat, toLocaleDateString |
| L155 · _archItemRow | Internal | _archSprintEntryHtml, esc, reduce, repeat, toLocaleDateString, toLowerCase |
| L176 · _archSprintEntryHtml | Internal | _toggleArchSprintEntry, esc, join, map, preventDefault, reduce |
| L211 · _renderArchivoViewSprint | Render | _sprintNum, filter, getActiveSprints, has, legado, map |
| L249 · entryOpen | Internal | _archSprintEntryHtml, _toggleArchSprintEntry, getItem, join, map, preventDefault |
| L258 · legOpen | Internal | _renderArchivoViewFlat, _toggleArchSprintEntry, filter, getItem, join, map |
| L280 · _renderArchivoViewFlat | Render | _archItemRow, _toggleArchSprintEntry, buildBacklogItem, contains, filter, join |
| L296 · _toggleArchSprintEntry | Internal | _sprintNum, contains, filter, getActiveSprints, has, join |

## locus-backlog-core.js
**Líneas:** 1924 · **Size:** high · **mod:** 6 · **Changed in:** —

**Exports:** _skelShow, _skelHide, _openItemEditorSafe, _undoSnapshot, undoBacklog, redoBacklog, _updateUndoUI, toggleCollapseAll, _hasDepsBlocked, _isBlocked, _hasRecentSession, _calcPriority, _calcRelevanceScore, _localStorageUsageRatio, _purgeStaleBacklogCache, loadBacklog, itemType, updateStatusFilterUI, _getNextItemCode, updateBacklogBanner, importBacklog, _getActiveSessionAiId, setItemStatus, _applyDoneStatus, effortDots, _isCountableItem, renderStats, buildItemRefs, _buildRoleChips, _getMiViewRoles, _getMiViewLabel, toggleBacklogFocusMode, _migrateItemTypes

| Función | Área | Calls |
|---------|------|-------|
| L39 · _skelShow | Internal | _skelHide, _tplKey, add, getItem, remove, warn |
| L45 · _skelHide | Internal | _tplKey, getItem, parse, remove, warn |
| L60 · ITEMS | Internal | _tplKey, forEach, getItem, log, parse, setItem |
| L103 · _openItemEditorSafe | Internal | _markBacklogListDirty, _undoSnapshot, _updateUndoUI, error, openItemEditor, parse |
| L112 · _undoSnapshot | Internal | _markBacklogListDirty, _updateUndoUI, parse, pop, push, redoBacklog |
| L119 · undoBacklog | Internal | Deshacer, Rehacer, _markBacklogListDirty, _updateUndoUI, parse, pop |
| L130 · redoBacklog | Internal | Deshacer, Rehacer, _markBacklogListDirty, _updateUndoUI, activo, desc |
| L141 · _updateUndoUI | Internal | Deshacer, Rehacer, activo, desc, getItem, todos |
| L197 · _cvLoad | Internal | _cvSave, add, contains, forEach, from, getItem |
| L200 · _cvSave | Internal | _cvLoad, add, contains, forEach, from, replace |
| L206 · toggleCollapseAll | UI | _cvSave, _markBacklogListDirty, add, contains, forEach, from |
| L228 · toggleBacklogBlockerFilter | UI | _hasDepsBlocked, _markBacklogListDirty, find, renderBacklogList, some, toggle |
| L238 · toggleDepsFilter | UI | _hasDepsBlocked, _isBlocked, _markBacklogListDirty, find, now, renderBacklogList |
| L250 · _hasDepsBlocked | Internal | _hasRecentSession, _isBlocked, find, getAllSessions, hasRecentSession, now |
| L260 · _isBlocked | Internal | _hasRecentSession, getAllSessions, hasRecentSession, includes, now, some |
| L264 · daysSince | Internal | _hasRecentSession, getAllSessions, hasRecentSession, includes, now, some |
| L272 · _hasRecentSession | Internal | _calcPriority, getAllSessions, hasRecentSession, includes, now, some |
| L297 · _calcPriority | Utils | _applyAllPriorities, _getSprintById, caso, forEach |
| L299 · type | Internal | _applyAllPriorities, _calcPriority, _getSprintById, caso, forEach |
| L320 · _applyAllPriorities | Internal | ASIGNADO, _calcPriority, _calcRelevanceScore, _getSprintById, cerrar, forEach |
| L330 · _calcRelevanceScore | Utils | ASIGNADO, _getSprintById, cerrar, floor, itemType, log1p |
| L391 · _recalcAllScores | Internal | _calcRelevanceScore, _sanitizePendingInClosedSprints, filter, forEach, getActiveSprints, getAllSessions |
| L404 · _sanitizePendingInClosedSprints | Internal | filter, forEach, getActiveSprints, has, map, now |
| L453 · _localStorageUsageRatio | Internal | _purgeStaleBacklogCache, _undoSnapshot, filter, getItem, includes, key |
| L465 · _purgeStaleBacklogCache | Internal | _undoSnapshot, filter, includes, irreversible, local, log |
| L493 · purgeAllHistorico | Internal | _gconfirmOpen, _markBacklogListDirty, _normalizeItems, _undoSnapshot, filter, laterales |
| L522 · _normalizeItems | Internal | _blogLog, charAt, forEach, includes, isArray, placeholder |
| L545 · firstChar | Internal | _blogLog, _normalizeStatus, charAt, has, includes, trim |
| L602 · loadBacklog | Save / Load | _loadFromSupabase, _normalizeItems, _sanitizePendingInClosedSprints, _tplKey, cerrados, disponible |
| L644 · itemType | Internal | _markBacklogListDirty, add, clearTypeFilters, has, includes, renderBacklogList |
| L645 · c | Internal | _markBacklogListDirty, add, clearTypeFilters, has, includes, renderBacklogList |
| L652 · clearTypeFilters | Internal | _markBacklogListDirty, add, forEach, has, remove, renderBacklogList |
| L658 · toggleTypeFilter | UI | _markBacklogListDirty, add, forEach, has, remove, renderBacklogList |
| L686 · updateTypeFilterUI | Utils | add, forEach, has, toggle, toggleStatusFilter, updateClearFilterBtn |
| L705 · toggleStatusFilter | UI | _markBacklogListDirty, add, has, remove, renderBacklogList, requestAnimationFrame |
| L729 · updateStatusFilterUI | Utils | _cvSave, _getNextItemCode, add, has, reservedCodes, toggle |
| L744 · toggleVersionCollapse | UI | RegExp, _cvSave, _getNextItemCode, add, forEach, getFullYear |
| L758 · _getNextItemCode | Internal | RegExp, forEach, getFullYear, getMonth, match, padStart |
| L791 · parseBacklogMd | Parser | RegExp, forEach, get, includes, match, split |
| L811 · get | Utils | RegExp, _normalizeStatus, includes, match, split, timestamps |
| L858 · blockingRaw | Internal | Criterios, content, error, filter, get, map |
| L880 · parseBacklogMeta | Parser | _getActiveProjectFilter, add, floor, match, now, relativeImportTime |
| L881 · version | Internal | _getActiveProjectFilter, add, floor, match, now, relativeImportTime |
| L882 · updated | Utils | _getActiveProjectFilter, add, floor, match, now, relativeImportTime |
| L887 · relativeImportTime | Internal | _getActiveProjectFilter, _tplKey, add, floor, getItem, now |
| L904 · updateBacklogBanner | Utils | FileReader, _getActiveProjectFilter, _tplKey, add, getItem, importBacklog |
| L917 · el | Internal | FileReader, error, forEach, importBacklog, log, parseBacklogMd |
| L927 · importBacklog | Save / Load | FileReader, _getNextItemCode, error, findIndex, forEach, includes |
| L1044 · badgeClass | Internal | _getActiveSessionAiId, _isInSession, badgeLabel, find, setItemStatus, statusClass |
| L1049 · badgeLabel | Internal | _getActiveSessionAiId, _isInSession, find, setItemStatus, statusClass, statusLabel |
| L1053 · statusClass | Internal | _confirmDiscard, _getActiveSessionAiId, _isInSession, _resetStatusSelect, find, setItemStatus |
| L1058 · statusLabel | Internal | _confirmDiscard, _confirmRetroceso, _getActiveSessionAiId, _isInSession, _resetStatusSelect, find |
| L1065 · _getActiveSessionAiId | Internal | _confirmDiscard, _confirmRetroceso, _hasDepsBlocked, _isInSession, _resetStatusSelect, filter |
| L1067 · ai | Internal | _confirmDiscard, _confirmRetroceso, _hasDepsBlocked, _isInSession, _resetStatusSelect, filter |
| L1072 · setItemStatus | Utils | _confirmDiscard, _confirmRetroceso, _hasDepsBlocked, _resetStatusSelect, confirm, filter |
| L1093 · pendingBlockers | Internal | _applyStatusChange, _gconfirmOpen, _getActiveSprint, _resetStatusSelect, _showInlineConfirmDone, bloqueante |
| L1128 · _applyStatusChange | Internal | _calcPriority, _effectiveVersion, _getActiveSessionAiId, _recalcAllScores, filter, find |
| L1184 · _resetStatusSelect | Internal | Kanban, _applyDoneStatus, _showInlineConfirmDone, escape, find, forEach |
| L1195 · _showInlineConfirmDone | Internal | Kanban, _applyDoneStatus, _resetStatusSelect, escape, find, lista |
| L1244 · _dismissInlineConfirm | Internal | _applyDoneStatus, _effectiveVersion, _flashStatusConfirmed, add, dispara, escape |
| L1254 · _flashStatusConfirmed | Internal | _applyDoneStatus, _effectiveVersion, _getActiveSessionAiId, _recalcAllScores, add, escape |
| L1265 · _applyDoneStatus | Internal | _effectiveVersion, _getActiveSessionAiId, _recalcAllScores, filter, find, forEach |
| L1320 · effortDots | Internal | _countable, _getActiveProjectFilter, _isCountableItem, contable, filter, getActiveSprints |
| L1327 · _isCountableItem | Internal | _countable, _getActiveProjectFilter, _matchesSearch, filter, getActiveSprints, has |
| L1333 · renderStats | Render | _countable, _getActiveProjectFilter, _isCountableItem, _matchesSearch, filter, forEach |
| L1346 · _q | Internal | _matchesSearch, effort, filter, forEach, has, includes |
| L1452 · buildItemRefs | Builder | _backlogSetSelected, closest, esc, forEach, getAI, getAllSessions |
| L1471 · toggleItemExpand | UI | _backlogSetSelected, clearAllFilters, closeItemPanel, closest, openItemPanel, setItem |
| L1490 · toggleSectionGroup | UI | clearAllFilters, remove, setItem, toggle |
| L1500 · clearAllFilters | Internal | _markBacklogListDirty, remove, renderBacklogList, updateClearFilterBtn, updateEffortFilterUI, updateRoleFilterUI |
| L1530 · _quickAssignEffort | Internal | _markBacklogListDirty, _undoSnapshot, find, has, prompt, renderBacklogList |
| L1546 · toggleEffortFilter | UI | _markBacklogListDirty, add, forEach, has, remove, renderBacklogList |
| L1572 · updateEffortFilterUI | Utils | _blogLog, _markBacklogListDirty, _setBacklogModified, _undoSnapshot, find, forEach |
| L1589 · setItemRole | Utils | _blogLog, _markBacklogListDirty, _setBacklogModified, _undoSnapshot, find, has |
| L1603 · toggleRoleFilter | UI | _markBacklogListDirty, add, forEach, has, renderBacklogList, renderStats |
| L1616 · togglePriorityFilter | UI | _getActiveRoles, _markBacklogListDirty, add, forEach, has, renderBacklogList |
| L1627 · updatePriorityFilterUI | Utils | _buildRoleChips, _getActiveRoles, add, esc, filter, forEach |
| L1633 · updateRoleFilterUI | Utils | _buildRoleChips, _getActiveRoles, add, esc, filter, forEach |
| L1641 · _getActiveRoles | Internal | _buildRoleChips, _markBacklogListDirty, add, esc, filter, forEach |
| L1648 · _buildRoleChips | Builder | _getActiveRoles, _markBacklogListDirty, esc, filter, join, map |
| L1665 · onBacklogSortChange | Events | _getActiveSprint, _getMiViewRoles, _markBacklogListDirty, add, forEach, itemType |
| L1673 · toggleSortDir | UI | _getActiveSprint, _getMiViewLabel, _getMiViewRoles, _markBacklogListDirty, add, forEach |
| L1684 · _getMiViewRoles | Internal | _getActiveSprint, _getMiViewLabel, add, checked, forEach, itemType |
| L1695 · _getMiViewLabel | Internal | Sprints, _getMiViewRoles, _syncViewAriaStates, checked, selected, toggle |
| L1703 · toggleBacklogFooter | UI | Sprints, _syncViewAriaStates, add, checked, selected, setAttribute |
| L1715 · _syncViewAriaStates | Internal | Sprints, add, btn, setAttribute, setItem |
| L1755 · toggleBacklogMikeMode | UI | _getMiViewLabel, _getMiViewRoles, _markBacklogListDirty, _syncViewAriaStates, renderBacklogList, toggle |
| L1782 · toggleBacklogKanbanMode | UI | _markBacklogListDirty, _syncViewAriaStates, renderBacklogList, setItem, toggle, toggleBacklogTreeMode |
| L1803 · toggleBacklogTreeMode | UI | _markBacklogListDirty, _recalcAllScores, _syncViewAriaStates, renderBacklogList, setItem, toggle |
| L1818 · toggleBacklogFocusMode | UI | _markBacklogListDirty, _recalcAllScores, _syncViewAriaStates, renderBacklogList, toggle, toggleBacklogNoAcMode |
| L1837 · toggleBacklogNoAcMode | UI | _markBacklogListDirty, _migrateItemTypes, _normalizeItems, renderBacklogList, saveBacklog, toggle |
| L1854 · _migrateItemTypes | Internal | _normalizeItems, redoBacklog, saveBacklog, toggleBacklogFocusMode, toggleBacklogKanbanMode, toggleBacklogTreeMode |

## locus-backlog-item.js
**Líneas:** 1815 · **Size:** high · **mod:** 9 · **Changed in:** —

**Exports:** _renderKanban, _attachBacklogDnD, buildBacklogItem, setFilter, updateBacklogFooter, _isPlaceholderCode, mergeBacklogFromTG, _normalizeStatus, applyPatchesFromTG

| Función | Área | Calls |
|---------|------|-------|
| L34 · _renderKanban | Render | _kanbanStatus, filter, has, itemType, rgba, trim |
| L43 · _kanbanStatus | Internal | filter, has, includes, itemType, toLowerCase, trim |
| L81 · _kanbanCard | Internal | _hasDepsBlocked, _isActiveRecently, badgeLabel, esc, from, itemType |
| L90 · prioBadge | Internal | _hasDepsBlocked, _isActiveRecently, badgeLabel, esc, forEach |
| L136 · _kbDrop | Internal | _attachBacklogListDelegation, _kbCardClick, _openItemEditorSafe, card, col, drag |
| L152 · _kbCardClick | Internal | _attachBacklogListDelegation, _blListClick, _openItemEditorSafe, card, closest, col |
| L163 · _attachBacklogListDelegation | Internal | _blListClick, _confirmUnlinkChild, closest, copyItemCode, copyItemToClipboard, stopPropagation |
| L274 · _attachBacklogDnD | Internal | add, forEach, not, preventDefault, remove, setData |
| L326 · _inlineEditTitle | Internal | _cancel, _commit, _markBacklogListDirty, _undoSnapshot, find, focus |
| L342 · _commit | Internal | _buildChildrenBlock, _cancel, _markBacklogListDirty, _undoSnapshot, filter, preventDefault |
| L352 · _cancel | Internal | _buildChildrenBlock, _commit, _markBacklogListDirty, filter, has, itemType |
| L367 · _buildChildrenBlock | Builder | badgeClass, badgeLabel, esc, filter, has, itemType |
| L420 · _confirmUnlinkChild | Internal | _buildItemTimestamps, _gconfirmOpen, _markBacklogListDirty, find, floor, renderBacklogList |
| L433 · _buildItemTimestamps | Builder | _fmt, _iso, floor, join, push, toLocaleDateString |
| L463 · _buildItemPOriginBlock | Builder | _buildItemOriginBlock, esc, find, getAI, getAllSessions, navigateToItem |
| L475 · _buildItemOriginBlock | Builder | _fmtSessDate, esc, filter, find, getAI, getAllSessions |
| L486 · aiAvatar | Internal | _fmtSessDate, esc, filter, isArray, join, map |
| L527 · _openStatusPopover | Internal | find, forEach, itemType, join, map, remove |
| L538 · isIdea | Internal | forEach, itemType, join, map, remove, setAttribute |
| L602 · buildBacklogItem | Builder | _quickAssignEffort, esc, faltantes, filter, indexOf, itemType |
| L626 · missingAlert | Internal | badgeLabel, esc, join, map |
| L645 · effortDotsHtml | Internal | _isBlocked, _staleness, badgeLabel, filter, type |
| L654 · prioBadgeHtml | Internal | _isBlocked, _staleness, badgeLabel, filter, find, type |
| L658 · noAcBadge | Internal | _isBlocked, _staleness, esc, filter, find, join |
| L667 · _stalenessData | Internal | _staleness, esc, filter, find, has, join |
| L676 · childBadge | Internal | _isActiveRecently, esc, filter, find, has, join |
| L681 · blockedByItems | Internal | _isActiveRecently, esc, filter, find, has, join |
| L691 · blockingBadge | Internal | _isActiveRecently, _openStatusPopover, _promoteItem, esc, has, pendientes |
| L696 · acReplacedBadge | Internal | _isActiveRecently, _openStatusPopover, _promoteItem, esc, has, pendientes |
| L701 · isActive | Internal | _isActiveRecently, _openStatusPopover, _promoteItem, esc, pendientes, setItemStatus |
| L704 · scopeAddedBadge | Internal | _openStatusPopover, _promoteItem, esc, navigateToItem, pendientes, setItemStatus |
| L710 · _ideaQuickActions | Internal | Subline, _openStatusPopover, _promoteItem, esc, navigateToItem, pendientes |
| L717 · _statusChipHtml | Internal | Subline, _openStatusPopover, esc, find, getActiveSprints, join |
| L730 · _discardReasonHtml | Internal | Subline, esc, find, getActiveSprints, join, navigateToItem |
| L827 · ghostOption | Internal | _acvToggle, _openItemEditorSafe, _rLabel, esc, find, join |
| L868 · _classify | Internal | _acvConfirm, _acvStartEdit, _acvToggle, esc, find, join |
| L919 · _promoteItem | Internal | _promoteConfirm, esc, find, remove |
| L960 · _promoteSelectType | Internal | _getNextItemCode, _promoteConfirm, find, forEach, now, push |
| L970 · _promoteConfirm | Internal | _getNextItemCode, find, now, push, random, slice |
| L1022 · _promoteTtoR | Internal | _promoteTtoRConfirm, add, confirmar, esc, find, focus |
| L1055 · _promoteTtoRConfirm | Internal | _getNextItemCode, find, now, push, random, slice |
| L1104 · copyItemCode | Internal | add, copyItemToClipboard, execCommand, find, remove, select |
| L1129 · copyItemToClipboard | Internal | Notas, find, forEach, join, push, stopPropagation |
| L1162 · t | Internal | _feedback, add, execCommand, find, join, push |
| L1171 · _feedback | Internal | add, contains, execCommand, remove, select, then |
| L1194 · toggleAc | UI | _markBacklogListDirty, add, clearBacklogSearch, contains, forEach, onBacklogSearch |
| L1202 · setFilter | Utils | _markBacklogListDirty, add, clearBacklogSearch, forEach, onBacklogSearch, remove |
| L1210 · onBacklogSearch | Events | _isCountableItem, _markBacklogListDirty, clearBacklogSearch, filter, getActiveSprints, has |
| L1220 · clearBacklogSearch | Internal | _getActiveSprint, _isCountableItem, _markBacklogListDirty, filter, forEach, getActiveSprints |
| L1231 · updateBacklogFooter | Utils | _getActiveSprint, _isCountableItem, filter, forEach, getActiveSprints, has |
| L1281 · _isPlaceholderCode | Internal | _findTmpMatch, filter, forEach, includes, max, split |
| L1290 · _findTmpMatch | Internal | _assignPendingIds, filter, flujo, forEach, includes, map |
| L1295 · haystack | Internal | _assignPendingIds, _getNextItemCode, add, filter, flujo, has |
| L1315 · _assignPendingIds | Internal | _getNextItemCode, add, has, map, mergeBacklogFromTG, parent |
| L1330 · mergeBacklogFromTG | Internal | _assignPendingIds, _undoSnapshot, descartado, existente, forEach, map |
| L1541 · _parentSprint | Internal | _blogLog, find, push, random, slice |
| L1623 · _tgStatusToBacklog | Internal | _hasRecentSession, _normalizeStatus, _staleness, fresh, includes, stale |
| L1628 · _normalizeStatus | Internal | _hasRecentSession, _staleness, floor, fresh, includes, now |
| L1647 · _staleness | Internal | _hasRecentSession, _isActiveRecently, floor, forEach, getAllSessions, includes |
| L1662 · _isActiveRecently | Internal | forEach, getAllSessions, ignorado, includes, manual, now |
| L1696 · applyPatchesFromTG | Internal | _blogLog, _undoSnapshot, find, forEach, has, keys |
| L1710 · existing | Internal | _blogLog, _normalizeStatus, find, forEach, has, keys |

## locus-backlog-merge.js
**Líneas:** 897 · **Size:** medium · **mod:** 4 · **Changed in:** —

**Exports:** showMergeDiffPanel, _confirmRetroceso, _confirmDiscard

| Función | Área | Calls |
|---------|------|-------|
| L27 · showMergeDiffPanel | UI | error, getItem, loadBacklog, mergeBacklogFromTG, onApply, removeItem |
| L59 · _hasCriticalIgnored | Internal | esc, filter, find, getActiveSprints, includes, join |
| L74 · _pill | Internal | _mdiffSetItemSprint, esc, filter, find, getActiveSprints, join |
| L78 · _sprintSelect | Internal | _mdiffSetItemSprint, esc, filter, find, getActiveSprints, join |
| L97 · _card | Internal | _sprintSelect, esc, toUpperCase |
| L98 · typeChar | Internal | _sprintSelect, esc, toUpperCase |
| L119 · _retrocedoRow | Internal | _pill, _sprintSelect, esc, toUpperCase |
| L120 · typeChar | Internal | _pill, _sprintSelect, esc, toUpperCase |
| L141 · _discardRow | Internal | _pill, _sprintSelect, esc, sort, toUpperCase |
| L142 · typeChar | Internal | _pill, _sprintSelect, esc, sort, toUpperCase |
| L168 · ca | Internal | _card, _mdiffToggleSection, _pill, _section, _sortByType, join |
| L169 · cb | Internal | _card, _mdiffToggleSection, _pill, _section, _sortByType, join |
| L174 · _section | Internal | _card, _mdiffToggleSection, _pill, _sortByType, join, map |
| L338 · _mdiffOpenNewSprintForm | Internal | _buildNewSprintForm, _getSprintById, _mdiffPersistSprint, _mdiffRestoreSelect, error, find |
| L341 · _projIdForForm | Internal | _buildNewSprintForm, _getSprintById, _mdiffPersistSprint, _mdiffRestoreSelect, error, forEach |
| L388 · _mdiffRestoreSelect | Internal | _mdiffSetItemSprint, filter, find, forEach, getActiveSprints, setAttribute |
| L425 · _mdiffPersistSprint | Internal | _calcPriority, _getActiveSessionAiId, _getSprintById, _setBacklogModified, find, now |
| L582 · _mdiffDoApply | Internal | _blogLog, find, forEach, now |
| L703 · _mdiffKeyHandler | Internal | _mdiffDoApply, _showStatusConfirmModal, preventDefault, remove |
| L724 · _showStatusConfirmModal | Internal | add, cloneNode, onConfirm, remove |
| L755 · _confirmRetroceso | Internal | _blogLog, _markBacklogListDirty, _setBacklogModified, _showStatusConfirmModal, _undoSnapshot, add |
| L794 · _confirmDiscard | Internal | Referencia, esc, find |
| L861 · _applyDiscardBatch | Internal | _blogLog, _markBacklogListDirty, _setBacklogModified, _undoSnapshot, find, forEach |

## locus-backlog-panel.js
**Líneas:** 1135 · **Size:** medium · **mod:** 6 · **Changed in:** —

**Exports:** _buildItemMentionedIn, _buildItemMigratedBlock, _backlogSetSelected, toggleFocusMode, exitFocusMode, openItemPanel, closeItemPanel

| Función | Área | Calls |
|---------|------|-------|
| L26 · _buildItemMentionedIn | Builder | esc, filter, floor, getAI, getAllSessions, includes |
| L72 · _buildItemMigratedBlock | Builder | _getActiveProjectFilter, _openMigrateItem, esc, filter, find, getProjectById |
| L83 · _openMigrateItem | Internal | _getActiveProjectFilter, esc, filter, find, getProjectById, join |
| L91 · destProjects | Internal | _confirmMigrateItem, add, esc, filter, join, map |
| L130 · _confirmMigrateItem | Internal | _getActiveProjectFilter, _setBacklogModified, _undoSnapshot, assign, find, getProjectById |
| L182 · _backlogSetSelected | Internal | _backlogSpaceHandler, _initBacklogSpaceKey, add, find, forEach, getAttribute |
| L197 · _backlogSpaceHandler | Internal | closest, find, preventDefault, setItemStatus, showToast, undoBacklog |
| L253 · toggleFocusMode | UI | Focus, exitFocusMode, find, openItemPanel, remove, toggle |
| L265 · exitFocusMode | Internal | add, find, openItemPanel, remove |
| L279 · openItemPanel | UI | _renderItemPanel, add, closeItemPanel, find, handler, remove |
| L305 · closeItemPanel | UI | _itemPanelEscHandler, exitFocusMode, remove, toggleBacklogFocusMode |
| L326 · _itemPanelEscHandler | Internal | _renderItemPanel, closeItemPanel, contains, escape, exitFocusMode, itemType |
| L351 · _renderItemPanel | Render | closeItemPanel, esc, itemType, panel |
| L459 · _sessChip | Internal | _idpUnlinkSession, contains, esc, getAI, join, map |
| L506 · allBlockedBy | Internal | _depsChip, esc, filter, find, includes, join |
| L511 · _depsChip | Internal | esc, find, join, map, openItemPanel |
| L519 · depsHtml | Internal | _depsChip, esc, find, join, map, openItemPanel |
| L542 · originChipHtml | Internal | esc, existe, find, openItemPanel |
| L544 · originItem | Internal | _buildPanelTimeline, esc, existe, find, openItemPanel |
| L572 · _buildPanelTimeline | Builder | floor, push, toLocaleDateString, toLocaleString |
| L621 · sub | Internal | getAI, isArray, push |
| L630 · sub | Internal | getAI, push |
| L636 · sub | Internal | getAI, push |
| L746 · _idpStartEditTitle | Internal | _getActiveSessionAiId, _idpSaveTitle, _setBacklogModified, _undoSnapshot, add, find |
| L759 · _idpSaveTitle | Internal | _getActiveSessionAiId, _idpCancelTitle, _setBacklogModified, _undoSnapshot, add, find |
| L785 · _idpCancelTitle | Internal | _getActiveSessionAiId, _idpSetField, _itemPanelNotesDirty, _setBacklogModified, _undoSnapshot, add |
| L793 · _idpSetField | Internal | _getActiveSessionAiId, _itemPanelNotesDirty, _setBacklogModified, _undoSnapshot, find, includes |
| L812 · _itemPanelNotesDirty | Internal | _idpToggleAc, _idpToggleHistory, find, saveBacklog, toggle |
| L828 · _idpToggleAc | Internal | _idpCopyCode, _idpMarkDone, _idpToggleHistory, _renderItemPanel, find, setItemStatus |
| L837 · _idpToggleHistory | Internal | _idpCopyCode, _idpMarkDone, _idpUnlinkSession, _renderItemPanel, filter, find |
| L846 · _idpCopyCode | Internal | _idpAddNote, _idpMarkDone, _idpUnlinkSession, _renderItemPanel, filter, find |
| L851 · _idpMarkDone | Internal | _getActiveSessionAiId, _idpAddNote, _idpUnlinkSession, _renderItemPanel, _setBacklogModified, _undoSnapshot |
| L860 · _idpUnlinkSession | Internal | _getActiveSessionAiId, _idpAddNote, _idpAddNote_fromBtn, _renderItemPanel, _setBacklogModified, _undoSnapshot |
| L873 · _idpAddNote | Internal | _acvToggle, _getActiveSessionAiId, _idpAddNote_fromBtn, _renderItemPanel, _setBacklogModified, _undoSnapshot |
| L885 · _idpAddNote_fromBtn | Internal | _acvStartEdit, _acvToggle, _idpAddNote, contains, find, toggle |
| L896 · _acvToggle | Internal | _acvSaveEdit, _acvStartEdit, contains, esc, find, focus |
| L907 · _acvStartEdit | Internal | _acvSaveEdit, _setBacklogModified, _undoSnapshot, esc, find, focus |
| L925 · _acvSaveEdit | Internal | _acvConfirm, _setBacklogModified, _undoSnapshot, add, find, now |
| L940 · _acvConfirm | Internal | _patchMoreMenuReset, _resetTmplTriggerPanel, add, find, now, saveBacklog |
| L955 · toggleTmplTriggerPanel | UI | _patchMoreMenuReset, _resetTmplTriggerPanel, _tryPatch, add, toggle |
| L967 · _resetTmplTriggerPanel | Internal | _tryPatch, add |
| L978 · _tryPatch | Internal | _initFocusShortcut, _resetTmplTriggerPanel |
| L1009 · _focusShortcutHandler | Internal | _attach, _initExportBacklogBtn, contains, exportBacklogMd, preventDefault, toggleBacklogFocusMode |
| L1034 · _attach | Internal | Panel, _attachIdpDelegation, _idpMarkDone, _onIdpClick, closest, exportBacklogMd |
| L1056 · _onIdpClick | Internal | _idpCopyCode, _idpMarkDone, _idpStartEditTitle, _idpToggleAc, _idpToggleHistory, closest |
| L1100 · _onIdpKeydown | Internal | _idpAddNote, _idpCancelTitle, _idpSaveTitle, _idpToggleAc, _idpToggleHistory, _onIdpBlur |
| L1125 · _onIdpBlur | Internal | _idpSaveTitle, closest |

## locus-backlog-render.js
**Líneas:** 1312 · **Size:** high · **mod:** — · **Changed in:** —

**Exports:** updateClearFilterBtn, _calcEstimatedVelocity, _renderPlanningView, _markBacklogListDirty, renderBacklogList

| Función | Área | Calls |
|---------|------|-------|
| L24 · toggleChildrenBlock | UI | _markBacklogListDirty, _setBacklogModified, _undoSnapshot, add, escape, find |
| L37 · setItemParent | Utils | _markBacklogListDirty, _setBacklogModified, _undoSnapshot, find, has, renderBacklogList |
| L49 · updateClearFilterBtn | Utils | _chip, esc, filter, forEach, has, push |
| L66 · _chip | Internal | esc, filter, forEach, has, push, toggleEffortFilter |
| L106 · _statusPills | Internal | _calcEstimatedVelocity, asignado, cerrados, filter, forEach, getActiveSprints |
| L125 · toggleClosedSprintsBody | UI | _calcEstimatedVelocity, asignado, cerrados, filter, floor, getActiveSprints |
| L130 · _calcEstimatedVelocity | Utils | _sprintVelocityLabel, cerrados, filter, floor, getActiveSprints, map |
| L143 · daysActive | Internal | _calcEstimatedVelocity, _sprintVelocityLabel, activo, filter, floor, map |
| L146 · velPerDay | Internal | _calcEstimatedVelocity, _sprintVelocityLabel, activo, filter, forEach, map |
| L158 · _sprintVelocityLabel | Internal | _calcEstimatedVelocity, activo, add, filter, forEach, getAttribute |
| L163 · velLabel | Internal | _renderSprintRoadmap, activo, add, forEach, getAttribute, has |
| L172 · roadmapGoToSprint | Internal | _markBacklogListDirty, _renderSprintRoadmap, add, forEach, getAttribute, has |
| L218 · _buildSprintOption | Builder | esc, filter, openSprintRetroView, round, stopPropagation, trim |
| L249 · _buildSprintSelector | Builder | esc, filter, find, getActiveSprints, round, trim |
| L303 · _blSprintOpen | Internal | add, filter, find, getActiveSprints, insertAdjacentHTML, join |
| L342 · _blSprintClose | Internal | _blSprintSelect, _blSprintToggleClosed, add, contains, remove, roadmapGoToSprint |
| L355 · _blSprintSelect | Internal | _attachSprintBarDelegation, _blSprintClose, _blSprintToggleClosed, _sprintBarClick, closest, contains |
| L361 · _blSprintToggleClosed | Internal | _attachSprintBarDelegation, _blSprintClose, _blSprintOpen, _sprintBarClick, closest, contains |
| L374 · _attachSprintBarDelegation | Internal | _blSprintClose, _blSprintOpen, _blSprintSelect, _blSprintToggleClosed, _sprintBarClick, _sprintBarKeydown |
| L414 · _attachPlanViewDelegation | Internal | _planDragEnd, _planDragLeave, _planDragOver, _planDragStart, _planDrop, _planViewDragEnd |
| L448 · _renderSprintRoadmap | Render | _buildSprintSelector, _getActiveSprint, _renderPlanningView, add, contains, filter |
| L469 · _renderPlanningView | Render | _getActiveSprint, destino, filter, getActiveSprints, sort, sprint |
| L536 · _planCard | Internal | esc, from, itemType, join, map |
| L618 · _planDragStart | Internal | _planDragEnd, _planDragLeave, _planDragOver, _planDrop, add, find |
| L625 · _planDragEnd | Internal | _getActiveSprint, _planDragLeave, _planDragOver, _planDrop, add, find |
| L631 · _planDragOver | Internal | _getActiveSprint, _planDragLeave, _planDrop, add, derecha, find |
| L638 · _planDragLeave | Internal | _getActiveSprint, _planDrop, derecha, find, preventDefault, remove |
| L642 · _planDrop | Internal | _getActiveSprint, _renderSprintPlanificar, derecha, find, preventDefault, remove |
| L674 · _markBacklogListDirty | Internal | _deferRender, _skelShow, _updateViewBtns, contains, renderBacklogList |
| L677 · renderBacklogList | Render | _deferRender, _markBacklogListDirty, _skelShow, _updateViewBtns, contains, toggle |
| L745 · hasProjects | Internal | _skelHide, openProjPanel, switchTab |
| L957 · _sortGroup | Internal | _sortItems, final, itemType, localeCompare, sort |
| L967 · _sortItems | Internal | final, itemType, localeCompare, sort |
| L1025 · s | Internal | _getSprintById, filter, forEach, getActiveSprints, keys, push |
| L1302 · scopeCount | Internal | has, join, onRendered |

## locus-backlog-sprints.js
**Líneas:** 1799 · **Size:** high · **mod:** 6 · **Changed in:** —

**Exports:** _getActiveSprint, _getSprintById, _buildNewSprintForm, createSprint, openSprintRetroView, setSprintStatus, setItemSprint, editSprintInline, confirmCloseSprint, navigateToItem, renderSprintBurndown, renderSprintItems

| Función | Área | Calls |
|---------|------|-------|
| L22 · _getActiveSprint | Internal | _getSprintById, _nextSprintId, filter, find, getActiveSprints, getProjectById |
| L26 · _getSprintById | Internal | _docPrefix, _nextSprintId, filter, find, getActiveSprints, getProjectById |
| L33 · _nextSprintId | Internal | RegExp, _docPrefix, filter, getActiveSprints, getProjectById, join |
| L43 · m | Internal | RegExp, _docPrefix, _mdiffOpenNewSprintForm, filter, getProjectById, join |
| L79 · _buildNewSprintForm | Builder | _bnsf_syncBtn, _clearSprintFieldErr, _hasActiveSprint, _idIsUnique, _nextSprintId, _suggestReleaseType |
| L88 · _idIsUnique | Internal | _bnsf_cancel, _bnsf_syncBtn, _clearSprintFieldErr, _hasActiveSprint, getActiveSprints, join |
| L94 · _hasActiveSprint | Internal | _bnsf_cancel, _bnsf_syncBtn, _clearSprintFieldErr, esc, getActiveSprints, join |
| L145 · init | Internal | add, find, focus, from, remove, some |
| L167 · rt | Internal | _idIsUnique, _nextSprintId, add, createSprint, find, from |
| L224 · _isValidSprintName | Internal | Major, _effectiveVersion, _suggestReleaseType, _suggestVersionTarget, map, replace |
| L230 · _suggestReleaseType | Internal | Major, _effectiveVersion, _suggestVersionTarget, map, replace, some |
| L248 · _suggestVersionTarget | Internal | _effectiveVersion, _isValidSprintName, _nextSprintId, createSprint, getActiveProject, getProjectById |
| L265 · createSprint | Internal | _getActiveSprint, _getSprintById, _isValidSprintName, _nextSprintId, forEach, getActiveProject |
| L279 · goalTrimmed | Internal | _generateSprintRetroMd, _getActiveSprint, _getSprintById, forEach, getTime, notes |
| L281 · rt | Internal | _generateSprintRetroMd, _getActiveSprint, _getSprintById, forEach, getTime, getUTCDate |
| L282 · vt | Internal | _generateSprintRetroMd, _getActiveSprint, _getSprintById, forEach, getTime, getUTCDate |
| L304 · _generateSprintRetroMd | Internal | _getSprintById, filter, floor, getDate, getFullYear, getMonth |
| L396 · prevMd | Internal | Descartados, filter, getActiveSprints, join, map, round |
| L405 · prevDnom | Internal | Descartados, filter, join, map, round |
| L462 · openSprintRetroView | UI | _docPrefix, _getSprintById, getDate, getFullYear, getMonth, pad |
| L515 · closeSprintRetroOverlay | UI | _docPrefix, _getSprintById, _openRetroDownloadPrompt, add, getDate, getFullYear |
| L521 · _openRetroDownloadPrompt | Internal | _docPrefix, _getSprintById, add, cloneNode, getDate, getFullYear |
| L566 · setSprintStatus | Utils | _getSprintById, directamente, forEach, getActiveSprints, now, push |
| L617 · setItemSprint | Utils | _calcPriority, _getActiveSessionAiId, _getSprintById, _markBacklogListDirty, _setBacklogModified, _undoSnapshot |
| L649 · _syncSprintConfirmBtn | Internal | _buildNewSprintForm, _calcEstimatedVelocity, _markBacklogListDirty, escape, from, global |
| L660 · openNewSprintInline | UI | _buildNewSprintForm, _calcEstimatedVelocity, _markBacklogListDirty, escape, global, onCancel |
| L672 · onConfirm | Events | _clearSprintFieldErr, _markBacklogListDirty, init, insertAdjacentElement, onCancel, renderBacklogList |
| L675 · onCancel | Events | _clearSprintFieldErr, _markBacklogListDirty, add, asociado, init, insertAdjacentElement |
| L698 · _clearSprintFieldErr | Internal | _bnsf_confirm, _markBacklogListDirty, add, asociado, confirmNewSprint, editSprintInline |
| L710 · confirmNewSprint | Internal | _bnsf_confirm, _getSprintById, _markBacklogListDirty, _suggestReleaseType, _suggestVersionTarget, editSprintInline |
| L725 · editSprintInline | Internal | _getSprintById, _suggestReleaseType, _suggestVersionTarget, esc, escape, filter |
| L731 · currentDescriptive | Internal | _suggestReleaseType, _suggestVersionTarget, esc, filter, replace, sprint |
| L775 · confirmEditSprint | Internal | _getSprintById, _isValidSprintName, _markBacklogListDirty, add, remove, renderBacklogList |
| L812 · confirmCloseSprint | Internal | _getSprintById, filter, itemType, reduce, some |
| L855 · closeCloseSprintModal | UI | _scmBack, _scmBulkApply, _scmExecuteClose, _scmNext, _scmRender, remove |
| L861 · _scmBack | Internal | _scmBulkApply, _scmExecuteClose, _scmNext, _scmRender, forEach |
| L869 · _scmNext | Internal | _getSprintById, _scmBulkApply, _scmExecuteClose, _scmRender, forEach |
| L881 · _scmBulkApply | Internal | _getSprintById, _scmRender, add, forEach, remove |
| L893 · _scmRender | Internal | _getSprintById, add, forEach, remove |
| L906 · mappedStep | Internal | add, remove |
| L952 · _scmStep1Html | Internal | esc, filter, join, map, round |
| L987 · releaseRow | Internal | esc, toLowerCase |
| L1046 · _scmStep2Html | Internal | esc, filter, find, getActiveSprints, join, map |
| L1092 · _scmDownloadRetro | Internal | Blob, _docPrefix, _generateSprintRetroMd, _scmStep3Html, click, createObjectURL |
| L1115 · _scmStep3Html | Internal | _getSprintById, esc, filter |
| L1124 · itemRow | Internal | _getSprintById, esc, filter, getActiveSprints, round |
| L1151 · _prevSp | Internal | esc, filter, getActiveSprints, round, sort |
| L1162 · prevDnom | Internal | esc, filter, join, map, round |
| L1293 · _scmExecuteClose | Internal | _getSprintById, forEach, has, map, now |
| L1346 · denominator | Internal | _getSprintById, _openRetroDownloadPrompt, _templateTrigger, createSprintFromGroup, downloadTemplates, getActiveProject |
| L1369 · createSprintFromGroup | Internal | _getSprintById, _markBacklogListDirty, add, escape, find, getActiveProject |
| L1382 · navigateToItem | Internal | add, escape, find, has, remove, renderSprintBurndown |
| L1404 · renderSprintBurndown | Render | _getActiveSprint, add, filter, remove, removeProperty, setAttribute |
| L1427 · spItems | Internal | add, filter, reduce, remove, round, setAttribute |
| L1463 · _updateCloseReadyState | Internal | add, every, filter, remove, renderSprintItems, toggle |
| L1475 · spRs | Internal | _getActiveSprint, add, every, filter, remove, renderSprintItems |
| L1491 · renderSprintItems | Render | _getActiveSprint, activo, add, filter, remove |
| L1534 · _renderSprintSection | Render | _buildSprintItemRow, filter, join, map, toggle |
| L1553 · _buildSprintItemRow | Builder | _escSpr, filter, join |
| L1597 · renderScopeAdded | Render | add, filter, join, map, remove, scope_added |
| L1628 · _buildScopeAddedRow | Builder | _escSpr, find, getDate, getFullYear, getMonth, isArray |
| L1670 · renderSprintWorkers | Render | activo, add, filter, forEach, isArray, remove |
| L1707 · name | Internal | _attachSprintDelegation, _buildWorkerPill, _escSpr, _markBacklogListDirty, _sprintDelegateClick, closest |
| L1714 · _buildWorkerPill | Builder | _attachSprintDelegation, _escSpr, _markBacklogListDirty, _scmDownloadRetro, _sprintDelegateClick, closest |
| L1761 · _attach | Internal | _scmBack, _scmNext, closeCloseSprintModal, closeSprintRetroOverlay, removeAttribute |

## locus-command-palette.js
**Líneas:** 834 · **Size:** medium · **mod:** 4 · **Changed in:** —

| Función | Área | Calls |
|---------|------|-------|
| L32 · _buildCommandRegistry | Builder | switchTab |
| L246 · _buildDynamicCommands | Builder | _fuzzyMatch, filter, focus, forEach, push, scrollIntoView |
| L277 · projects | Internal | _fuzzyMatch, _getAllBacklogItems, filter, forEach, includes, push |
| L302 · code | Internal | _itemTypeIcon, find, forEach, includes, navigateToItem, push |
| L328 · ai | Internal | _getAllBacklogItems, find, forEach, getActiveProject, getItem, openDetail |
| L353 · _getAllBacklogItems | Internal | _cpSearchContext, _getActiveProjectFilter, forEach, getActiveProject, getItem, normalize |
| L365 · _cpSearchContext | Internal | _getActiveProjectFilter, forEach, getItem, includes, normalize, push |
| L411 · _itemTypeIcon | Internal | _fuzzyMatch, _fuzzyScore, includes, indexOf, normalize, replace |
| L420 · _fuzzyMatch | Internal | _fuzzyScore, _loadRecent, includes, indexOf, normalize, replace |
| L435 · _fuzzyScore | Internal | _loadRecent, _saveRecent, filter, getItem, includes, normalize |
| L448 · _loadRecent | Internal | _el, _saveRecent, filter, getItem, parse, setItem |
| L454 · _saveRecent | Internal | _cpInput, _cpList, _cpOverlay, _cpRecent, _el, _loadRecent |
| L476 · _el | Internal | _buildCommandRegistry, _cpInput, _cpList, _cpOverlay, _cpRecent, add |
| L478 · _cpInput | Internal | _buildCommandRegistry, _cpList, _cpOverlay, _cpRecent, _cpRenderRecent, _cpRenderResults |
| L479 · _cpList | Internal | _buildCommandRegistry, _cpInput, _cpOverlay, _cpRecent, _cpRenderRecent, _cpRenderResults |
| L480 · _cpOverlay | Internal | _buildCommandRegistry, _cpInput, _cpRecent, _cpRenderRecent, _cpRenderResults, _el |
| L481 · _cpRecent | Internal | _buildCommandRegistry, _cpInput, _cpOverlay, _cpRenderRecent, _cpRenderResults, _el |
| L487 · openCommandPalette | UI | _buildCommandRegistry, _cpInput, _cpOverlay, _cpRenderRecent, _cpRenderResults, add |
| L510 · closeCommandPalette | UI | _cpOverlay, _cpRenderRecent, _cpRenderResults, _cpSearch, _fuzzyMatch, _fuzzyScore |
| L523 · _cpSearch | Internal | _buildDynamicCommands, _cpRecent, _cpRenderRecent, _cpRenderResults, _cpSearchContext, _fuzzyMatch |
| L558 · _cpRenderRecent | Internal | _buildCommandRegistry, _cpItemHtml, _cpList, _cpRecent, _cpRenderResults, _escHtml |
| L578 · _cpRenderResults | Internal | _cpItemHtml, _cpList, _escHtml, entries, forEach, push |
| L612 · _cpItemHtml | Internal | _cpHighlight, _cpList, _escHtml, forEach, not, scrollIntoView |
| L626 · _cpHighlight | Internal | _cpExecute, _cpExecuteSelected, _cpList, _saveRecent, action, closeCommandPalette |
| L643 · _cpExecute | Internal | _buildCommandRegistry, _cpExecuteRecentByEl, _cpExecuteSelected, _cpKeydown, _saveRecent, action |
| L654 · _cpExecuteSelected | Internal | _buildCommandRegistry, _cpExecute, _cpExecuteRecentByEl, _cpKeydown, closeCommandPalette, find |
| L660 · _cpExecuteRecentByEl | Internal | _buildCommandRegistry, _cpExecute, _cpHighlight, _cpKeydown, closeCommandPalette, find |
| L672 · _cpKeydown | Internal | _cpExecuteSelected, _cpHighlight, closeCommandPalette, max, min, preventDefault |
| L714 · _cpGlobalKeydown | Internal | _cpKeydown, _cpOnOverlayClick, _cpOverlay, bubble, closeCommandPalette, includes |
| L740 · _cpOnOverlayClick | Internal | _cpExecuteRecentByEl, _cpExecuteSelected, _cpHighlight, _cpOnListClick, _cpOnListMouseover, _cpOverlay |
| L744 · _cpOnListClick | Internal | TOAST, _cpExecuteRecentByEl, _cpExecuteSelected, _cpHighlight, _cpOnListMouseover, closest |
| L760 · _cpOnListMouseover | Internal | TOAST, _cpHighlight, _cpShowToast, _escHtml, closest, not |
| L774 · _cpShowToast | Internal | _cpOverlay, _escHtml, bubble, initCommandPalette, replace, showToast |
| L782 · _escHtml | Internal | _cpInput, _cpOverlay, _cpSearch, bubble, initCommandPalette, replace |
| L795 · initCommandPalette | Internal | _cpInput, _cpList, _cpOverlay, _cpRecent, _cpSearch, bubble |

## locus-contracts.js
**Líneas:** 449 · **Size:** low · **mod:** 7 · **Changed in:** —

**Exports:** padEnd, _ctrMergeFromItem, renderContratos, _esc

| Función | Área | Calls |
|---------|------|-------|
| L26 · _ctrKey | Internal | _ctrLoad, _ctrMergeFromItem, _ctrSave, _tplKey, error, getItem |
| L27 · _ctrLoad | Internal | _ctrKey, _ctrMergeFromItem, _ctrSave, error, getItem, now |
| L28 · _ctrSave | Internal | _ctrKey, _ctrLoad, _ctrMergeFromItem, error, now, padEnd |
| L51 · padEnd | Internal | _ctrLoad, _ctrMergeFromItem, find, forEach, now, push |
| L53 · _ctrMergeFromItem | Internal | _ctrLoad, find, forEach, now, push |
| L88 · _ctrUpdateBadge | Internal | _ctrLoad, clearContratosSearch, keys, onContratosSearch, remove, renderContratos |
| L100 · onContratosSearch | Events | _ctrIsRisk, clearContratosSearch, filter, flatMap, includes, map |
| L108 · clearContratosSearch | Internal | _ctrIsRisk, _ctrLoad, _ctrUpdateBadge, filter, flatMap, includes |
| L118 · _ctrIsRisk | Internal | _ctrLoad, _ctrUpdateBadge, filter, flatMap, includes, map |
| L120 · allSprints | Internal | _ctrLoad, _ctrUpdateBadge, filter, flatMap, includes, map |
| L129 · renderContratos | Render | _ctrLoad, _ctrUpdateBadge, filter, includes, some, toLowerCase |
| L166 · fnCount | Internal | _esc, _renderContratoDetail, filter, join, openContratoDetail, renderContratos |
| L167 · riskCount | Internal | _esc, _renderContratoDetail, filter, join, openContratoDetail, renderContratos |
| L188 · openContratoDetail | UI | _ctrIsRisk, _esc, _renderContratoDetail, filter, includes, join |
| L193 · _esc | Internal | _ctrIsRisk, _renderContratoDetail, filter, includes, join, map |
| L195 · _renderContratoDetail | Render | _ctrIsRisk, _esc, filter, includes, join, map |
| L204 · invariantsHtml | Internal | _esc, join, map |
| L207 · sideEffectsHtml | Internal | _esc, join, map |
| L240 · exportContratosMd | Save / Load | _ctrIsRisk, _ctrLoad, filter, forEach, join, map |
| L283 · resetContratosData | Internal | _ctrKey, _ctrLoad, _ctrUpdateBadge, forEach, includes, openContratoDetail |
| L292 · searchContratos | Internal | _ctrLoad, _focusFirstInteractive, add, closeResetSessionsModal, forEach, includes |
| L310 · openResetSessionsModal | UI | _focusFirstInteractive, _restoreModalFocus, add, closeResetSessionsModal, confirmResetSessions, forEach |
| L321 · closeResetSessionsModal | UI | _restoreModalFocus, confirmResetSessions, forEach, isArray, remove, removeItem |
| L326 · confirmResetSessions | Internal | forEach, isArray, removeItem, setItem, showToast, stringify |

## locus-docs.js
**Líneas:** 1047 · **Size:** medium · **mod:** 8 · **Changed in:** —

**Exports:** _updateSubTabButtons, _renderDocsOnboarding, _renderTplProjBanner, importHtmlMap, _getMapContent, exportHtmlMapMd, _importContextMdFromText, updateContextBanner, updateHtmlMapModificationBadge, _setBacklogModified, updateBacklogModificationBadge, extractContextSections, mergeContextSections, extractHtmlMapSections, mergeHtmlMapSections, renderContext

| Función | Área | Calls |
|---------|------|-------|
| L33 · _updateSubTabButtons | Internal | _tplKey, _updateUndoUI, add, getItem, parse, toggle |
| L120 · _docsOnboardingSteps | Internal | _renderDocsOnboarding, _tplKey, click, getItem, parse, switchSubTab |
| L147 · _renderDocsOnboarding | Render | _dismissDocsOnboarding, _docsOnboardingSteps, filter, getItem, insertBefore, remove |
| L199 · _docsOnboardingAction | Internal | _dismissDocsOnboarding, _docsOnboardingSteps, _renderTplProjBanner, add, getActiveProject, remove |
| L205 · _dismissDocsOnboarding | Internal | _renderTplProjBanner, add, getActiveProject, importHtmlMap, remove, setItem |
| L215 · _renderTplProjBanner | Render | FileReader, _tplKey, add, getActiveProject, importHtmlMap, parseHtmlMapMd |
| L232 · importHtmlMap | Save / Load | FileReader, _blogLog, _setHtmlMapModified, _tplKey, _updateDocLogCount, match |
| L275 · _getMapContent | Internal | Blob, _clearHtmlMapModifiedBadge, _docPrefix, _mgGetVersion, _tplKey, createObjectURL |
| L286 · exportHtmlMapMd | Save / Load | Blob, CONTEXT, _blogLog, _clearHtmlMapModifiedBadge, _docPrefix, _getMapContent |
| L315 · _isContextJson | Internal | isArray, join, map, parse, parseContextJson, push |
| L324 · parseContextJson | Parser | filter, isArray, join, map, parse, push |
| L380 · parseContextMd | Parser | join, match, push, secciones, slice, split |
| L415 · importContextMd | Save / Load | _importContextMdFromText, click, parse, parseContextJson, parseContextMd, picker |
| L420 · _importContextMdFromText | Internal | parse, parseContextJson, parseContextMd, showToast, startsWith, toLocaleString |
| L461 · updateContextBanner | Utils | FileReader, _dropzoneHandle, _importContextMdFromFile, _importContextMdFromText, _tplKey, getItem |
| L477 · renderContextStatus | Render | FileReader, _dropzoneHandle, _importContextMdFromFile, _importContextMdFromText, _setContextModified, importBacklog |
| L479 · _importContextMdFromFile | Internal | FileReader, _dropzoneHandle, _importContextMdFromText, _setContextModified, importBacklog, importHtmlMap |
| L488 · _dropzoneHandle | Internal | FileReader, _importContextMdFromText, _setContextModified, importBacklog, importHtmlMap, preventDefault |
| L504 · _setContextModified | Internal | _clearContextModifiedBadge, add, remove, toLocaleString |
| L523 · _clearContextModifiedBadge | Internal | _clearHtmlMapModifiedBadge, _setHtmlMapModified, add, remove, updateHtmlMapModificationBadge |
| L535 · _setHtmlMapModified | Internal | _clearHtmlMapModifiedBadge, add, getItem, parse, updateHtmlMapModificationBadge |
| L552 · _clearHtmlMapModifiedBadge | Internal | _setBacklogModified, add, getItem, parse, remove, toLocaleString |
| L563 · updateHtmlMapModificationBadge | Utils | _setBacklogModified, getItem, parse, remove, toLocaleString, updateBacklogModificationBadge |
| L581 · _setBacklogModified | Internal | _tplKey, extractContextSections, getItem, parse, remove, toLocaleString |
| L594 · updateBacklogModificationBadge | Utils | _tplKey, exec, extractContextSections, getItem, match, parse |
| L610 · extractContextSections | Internal | _ctxKey, _projKey, _tplKey, exec, filter, getItem |
| L632 · mergeContextSections | Internal | RegExp, _ctxKey, _projKey, _tplKey, esc, filter |
| L681 · extractHtmlMapSections | Internal | RegExp, _mapKey, _projKey, _tplKey, exec, forEach |
| L700 · mergeHtmlMapSections | Internal | RegExp, _blogLog, _mapKey, _projKey, _setHtmlMapModified, _tplKey |
| L730 · renderContext | Render | _isContextJson, _tplKey, getItem, map, parseContextJson, split |
| L777 · _renderContextSections | Render | defecto, esc, filter, forEach, includes, join |
| L800 · openClass | UI | _renderContextSections, add, clearContextSearch, esc, onContextSearch, toggle |
| L814 · onContextSearch | Events | _renderContextSections, add, clearContextSearch, contextShowImport, remove, renderContextMd |
| L822 · clearContextSearch | Internal | _renderContextSections, add, contextShowImport, remove, renderContextMd, split |
| L830 · contextShowImport | Internal | add, filter, forEach, join, map, remove |
| L837 · toggleContextSection | UI | filter, forEach, join, map, renderContextInline, renderContextMd |
| L843 · renderContextMd | Render | filter, forEach, join, map, renderContextInline, replace |
| L852 · flushTable | Internal | esc, filter, forEach, join, map, push |
| L903 · renderContextInline | Render | esc, openDocLog, replace |

## locus-item-editor.js
**Líneas:** 956 · **Size:** medium · **mod:** 4 · **Changed in:** —

**Exports:** closePasteItems, openItemEditor, closeItemEditor, openTemplatePicker

| Función | Área | Calls |
|---------|------|-------|
| L27 · openPasteItems | UI | FileReader, add, closeItemEditor, closePasteItems, openItemEditor, piDragLeave |
| L32 · closePasteItems | UI | FileReader, _piDetectType, add, closeItemEditor, match, piDragLeave |
| L37 · piDragOver | Internal | FileReader, _piDetectType, add, match, piDragLeave, piDrop |
| L41 · piDragLeave | Internal | FileReader, _piDetectType, _piParseField, match, piDrop, piParse |
| L44 · piDrop | Internal | FileReader, RegExp, _piDetectType, _piParseField, match, piParse |
| L57 · _piDetectType | Internal | RegExp, _piParseAC, _piParseField, match, push, replace |
| L69 · _piParseField | Internal | RegExp, _piParseAC, filter, match, piParse, push |
| L77 · _piParseAC | Internal | _piDetectType, _piParseField, filter, piParse, push, remove |
| L88 · piParse | Internal | _piDetectType, _piParseAC, _piParseField, filter, remove, slice |
| L129 · titleMatch | Internal | add, filter, find, piRenderPreview, push, remove |
| L146 · piRenderPreview | Internal | filter, map, remove |
| L226 · piToggleCard | Internal | filter, piConfirm, piDeleteItem, piEditStatus, piEditTitle, piEditType |
| L234 · piToggle | Internal | _tplKey, filter, getItem, parse, piConfirm, piDeleteItem |
| L242 · piEditTitle | Internal | _tplKey, filter, getItem, parse, piConfirm, piDeleteItem |
| L243 · piEditType | Internal | _tplKey, filter, findIndex, getItem, parse, piConfirm |
| L244 · piEditStatus | Internal | _tplKey, filter, findIndex, getItem, parse, piConfirm |
| L246 · piDeleteItem | Internal | _tplKey, filter, findIndex, getItem, parse, piConfirm |
| L255 · piConfirm | Internal | _tplKey, filter, findIndex, getItem, parse, replace |
| L328 · _refreshParentIdDropdown | Internal | _activeSprint, _getActiveSprint, _saveModalTrigger, esc, filter, join |
| L343 · _activeSprint | Internal | _getActiveSprint, _saveModalTrigger, find, openItemEditor, remove, replace |
| L348 · openItemEditor | UI | _saveModalTrigger, find, remove, replace, trim, warn |
| L432 · pasted | Internal | _ieAutofillFromPaste, _refreshParentIdDropdown, add, focus, getData, match |
| L450 · _ieAutofillFromPaste | Internal | filter, forEach, join, map, match, split |
| L514 · get | Utils | Criterios, RegExp, forEach, match, push, split |
| L568 · _ieHighlightAutofilled | Internal | _restoreModalFocus, add, closeItemEditor, confirmItemEditor, forEach, remove |
| L580 · closeItemEditor | UI | _restoreModalFocus, add, confirmItemEditor, focus, remove, showToast |
| L586 · confirmItemEditor | Internal | add, filter, focus, map, remove, replace |
| L612 · parentId | Internal | _getNextItemCode, filter, find, map, split, trim |
| L778 · _loadCustomTemplates | Internal | _getAllTemplates, _renderTemplatePicker, _saveCustomTemplates, add, closeTemplatePicker, getItem |
| L787 · _saveCustomTemplates | Internal | _getAllTemplates, _loadCustomTemplates, _renderTemplatePicker, add, closeTemplatePicker, openTemplatePicker |
| L795 · _getAllTemplates | Internal | _loadCustomTemplates, _renderTemplatePicker, add, closeTemplatePicker, filter, map |
| L800 · openTemplatePicker | UI | _applyTemplate, _deleteCustomTemplate, _getAllTemplates, _renderTemplatePicker, add, closeTemplatePicker |
| L807 · closeTemplatePicker | UI | _applyTemplate, _deleteCustomTemplate, _getAllTemplates, _renderTemplatePicker, filter, map |
| L812 · _renderTemplatePicker | Render | _applyTemplate, _deleteCustomTemplate, _getAllTemplates, filter, map, stopPropagation |
| L820 · renderGroup | Render | _applyTemplate, _deleteCustomTemplate, join, map, stopPropagation, toLowerCase |
| L825 · acCount | Internal | _applyTemplate, _deleteCustomTemplate, _getAllTemplates, find, join, renderGroup |
| L849 · _applyTemplate | Internal | _deleteCustomTemplate, _getAllTemplates, _ieHighlightAutofilled, _loadCustomTemplates, _refreshParentIdDropdown, _renderTemplatePicker |
| L875 · _deleteCustomTemplate | Internal | _loadCustomTemplates, _renderTemplatePicker, _saveCustomTemplates, actual, filter, map |
| L883 · saveCurrentItemAsTemplate | Save / Load | _loadCustomTemplates, _saveCustomTemplates, filter, map, now, push |
| L916 · toggleTplSavePanel | UI | contains, focus, toggle, trim |

## locus-map-generator.js
**Líneas:** 1881 · **Size:** high · **mod:** 7 · **Changed in:** —

**Exports:** esc, normalize, _mgGetVersion

| Función | Área | Calls |
|---------|------|-------|
| L23 · esc | Internal | _mgActiveSprint, cerrado, filter, find, getActiveSprints, normalize |
| L24 · normalize | Internal | _mgActiveSprint, cerrado, filter, find, getActiveSprints, replace |
| L29 · _mgActiveSprint | Internal | filter, find, getActiveSprints, openMapGenerator, sort |
| L55 · openMapGenerator | UI | _docPrefix, _effectiveVersion, _mgActiveSprint, _mgInferStatus, _mgRenderFileList, _mgResetPreview |
| L115 · closeMapGenerator | UI | _mgActiveSprint, _mgLoadSprintReview, _mgRenderDecisions, abort, filter, getActiveProject |
| L125 · _mgLoadSprintReview | Internal | _mgActiveSprint, _mgRenderDecisions, _mgSessionInSprint, filter, getActiveProject, isArray |
| L158 · _mgSessionInSprint | Internal | _mgRenderDecisions, esc, find, localeCompare, map, some |
| L171 · _mgRenderDecisions | Internal | _mgRenderLearnings, esc, filter, join, localeCompare, map |
| L192 · _mgRenderLearnings | Internal | _mgToggleDecisionTranscends, esc, filter, join, map, slice |
| L220 · _mgToggleDecisionTranscends | Internal | _mgInitDropzone, _mgSwitchReviewTab, _mgToggleLearningTranscends, add, forEach, remove |
| L227 · _mgToggleLearningTranscends | Internal | _mgInitDropzone, _mgSwitchReviewTab, abort, add, forEach, remove |
| L233 · _mgSwitchReviewTab | Internal | AbortController, _mgInitDropzone, abort, add, forEach, preventDefault |
| L247 · _mgInitDropzone | Internal | AbortController, _mgLoadFiles, abort, add, click, preventDefault |
| L278 · _mgLoadFiles | Internal | FileReader, _mgRenderFileList, _mgUpdateBtn, endsWith, filter, findIndex |
| L309 · _mgRenderFileList | Internal | _mgRemoveFile, _mgResetPreview, _mgUpdateBtn, join, map, pop |
| L319 · kb | Internal | _mgRemoveFile, _mgRenderFileList, _mgResetPreview, _mgUpdateBtn, archivos, join |
| L332 · _mgRemoveFile | Internal | _generateMap, _mgParseFile, _mgRenderFileList, _mgResetPreview, _mgUpdateBtn, archivos |
| L341 · _mgUpdateBtn | Internal | _generateMap, _mgParseFile, archivos, forEach, match, pop |
| L354 · _mgParseFile | Internal | _mgGuessArea, forEach, match, pop, push, split |
| L409 · _mgGuessArea | Internal | _mgBumpMinor, _mgGetVersion, join, replace, split, startsWith |
| L426 · _mgBumpMinor | Internal | _effectiveVersion, _mgBuildPlan, _mgGetVersion, join, replace, split |
| L441 · _mgGetVersion | Internal | _effectiveVersion, _mgBuildPlan, paralelas, secuenciales, trim |
| L474 · _mgBuildPlan | Internal | _mgActiveSprint, _tplKey, ascendente, filter, find, findIndex |
| L506 · _sprintMatches | Internal | filter, forEach, push, startsWith, trim |
| L548 · itFiles | Internal | add, every, filter, find, forEach, has |
| L549 · itDeps | Internal | add, every, filter, find, forEach, has |
| L645 · generateDocuments | Internal | _mgActiveSprint, showToast, trim |
| L688 · _valItems | Internal | _mgBumpMinor, _mgGetVersion, _tplKey, confirm, confirmMapGenerator, filter |
| L741 · generateMap | Internal | _docPrefix, _generateMap, _mgGetVersion, _mgNow, _mgParseFile, add |
| L745 · _generateMap | Internal | _docPrefix, _mgGetVersion, _mgInferStatus, _mgNow, _mgParseFile, add |
| L757 · version | Internal | _docPrefix, _mgActiveSprint, _mgGetVersion, _mgInferStatus, _mgNow, _mgParseFile |
| L780 · mapStatus | Internal | _mgInferStatus, _mgStripCommentsAndStrings, caller, calls, forEach, join |
| L904 · _mgChangedIn | Internal | _mgSizeSignal, add, descendente, forEach, join, localeCompare |
| L914 · _mgSizeSignal | Internal | _mgChangedIn, add, forEach, map |
| L1014 · _mgEscapeRegExp | Internal | _mgStripCommentsAndStrings, bloque, literales, primero, replace |
| L1020 · _mgStripCommentsAndStrings | Internal | primero |
| L1079 · _mgGetFunctionBody | Internal | _generateContext, _mgInferStatus, abierto, contains, filter, join |
| L1089 · _mgInferStatus | Internal | _generateContext, _mgActiveSprint, _mgGetVersion, contains, filter, getActiveProject |
| L1098 · unassigned | Internal | _generateContext, _mgActiveSprint, _mgGetVersion, _pad, filter, getActiveProject |
| L1105 · _generateContext | Internal | _mgActiveSprint, _mgGetVersion, _pad, getActiveProject, getDate, getFullYear |
| L1110 · _ctxVersion | Internal | _mgGetVersion, _pad, filter, getActiveProject, getDate, getFullYear |
| L1285 · learning | Internal | Maya, Noa, add, has, join, push |
| L1362 · _generateBacklog | Internal | _docPrefix, _generateSprintReview, _mgActiveSprint, _mgGetVersion, _mgNow, _mgSessionInSprint |
| L1363 · ver | Internal | _docPrefix, _generateSprintReview, _mgActiveSprint, _mgGetVersion, _mgNow, _mgSessionInSprint |
| L1369 · _generateSprintReview | Internal | _docPrefix, _mgActiveSprint, _mgGetVersion, _mgNow, _mgSessionInSprint, filter |
| L1376 · version | Internal | _docPrefix, _mgGetVersion, _mgNow, _mgSessionInSprint, filter, isArray |
| L1468 · decision | Internal | _mgNow, _mgResetPreview, _mgShowPreview, replace, slice, toLocaleString |
| L1469 · next | Internal | _mgNow, _mgResetPreview, _mgShowPreview, replace, slice, toLocaleString |
| L1481 · _mgNow | Internal | _docPrefix, _mgGetVersion, _mgResetPreview, _mgShowPreview, filter, toLocaleString |
| L1490 · _mgResetPreview | Internal | _docPrefix, _mgGetVersion, _mgShowPreview, filter, forEach, split |
| L1497 · _mgShowPreview | Internal | _docPrefix, _mgGetVersion, filter, forEach, split, toLocaleString |
| L1563 · confirmMapGenerator | Internal | _doConfirmGenerate, _mgGetVersion, abierto, filter, getActiveSprints, join |
| L1607 · _doConfirmGenerate | Internal | CONTEXT, _docPrefix, _mgActiveSprint, _mgBumpMinor, _mgGetVersion, archivo |
| L1614 · bumpedVer | Internal | CONTEXT, _mgActiveSprint, _mgBumpMinor, _mgGetVersion, archivo, normalize |
| L1726 · _mgApplyBumpedVersion | Internal | Blob, _mgDownload, _mgExportAllZip, click, createObjectURL, global |
| L1743 · _mgDownload | Internal | Blob, _docPrefix, _generateContext, _generateFullHistoryContent, _getMapContent, _mgExportAllZip |
| L1755 · _mgExportAllZip | Internal | JSZip, _docPrefix, _generateContext, _generateFullHistoryContent, _getMapContent, _mgGetVersion |

## locus-map-viewer.js
**Líneas:** 390 · **Size:** low · **mod:** — · **Changed in:** —

**Exports:** parseHtmlMapMd, loadHtmlMap, updateHtmlMapBanner, setHtmlMapFilter, renderHtmlMap

| Función | Área | Calls |
|---------|------|-------|
| L42 · parseHtmlMapMd | Parser | match, modular, slice, split, startsWith, test |
| L111 · loadHtmlMap | Save / Load | _tplKey, add, forEach, getItem, parse, renderHtmlMap |
| L119 · updateHtmlMapBanner | Utils | _hmOnSearch, _tplKey, add, forEach, getItem, parse |
| L134 · setHtmlMapFilter | Utils | _hmOnSearch, _hmToggleModule, completo, dropzone, forEach, renderHtmlMap |
| L144 · _hmOnSearch | Internal | _hmToggleModule, _skelShow, _tplKey, completo, dropzone, getItem |
| L151 · _hmToggleModule | Internal | _skelShow, _tplKey, completo, dropzone, getItem, loadHtmlMap |
| L162 · renderHtmlMap | Render | _dropzoneHandle, _skelHide, _skelShow, _tplKey, add, getItem |
| L231 · activeFile | Internal | endsWith, esc, fileShortName, fileTypeClass, filter, join |
| L325 · emptyMsg | Internal | _hmOnSearch, closest, esc, setHtmlMapFilter |

## locus-misc-ui.js
**Líneas:** 316 · **Size:** low · **mod:** 6 · **Changed in:** —

| Función | Área | Calls |
|---------|------|-------|
| L18 · _esc | Internal | _relTs, _resetExpired, esc, getCD, getDate, getNextOccurrence |
| L19 · _getTagColors | Internal | _relTs, _resetExpired, getCD, getDate, getNextOccurrence, legacy |
| L20 · _getCurrentTab | Internal | _relTs, _resetExpired, floor, getCD, getDate, getNextOccurrence |
| L21 · _renderHoy | Render | _relTs, _resetExpired, floor, getCD, getDate, getNextOccurrence |
| L22 · _relTs | Internal | _resetExpired, floor, getCD, getDate, getNextOccurrence, legacy |
| L25 · getNextOccurrence | Utils | _resetExpired, floor, getCD, getDate, legacy, map |
| L33 · _resetExpired | Internal | floor, getCD, getNextOccurrence, legacy, map, now |
| L43 · getCD | Utils | _resetExpired, floor, forEach, getNextOccurrence, getState, now |
| L90 · openTagModal | UI | _esc, _findSession, _getTagColors, _saveModalTrigger, add, focus |
| L98 · renderTagPicker | Render | _esc, _findSession, _getTagColors, getState, includes, indexOf |
| L115 · renderColorPicker | Render | _findSession, _getTagColors, addNewTag, find, getState, indexOf |
| L122 · selectColor | Internal | _findSession, _getTagColors, addNewTag, find, forEach, getState |
| L123 · toggleTagOnSession | UI | _findSession, _getTagColors, addNewTag, find, forEach, getAISessions |
| L133 · addNewTag | Internal | _esc, _findSession, _getTagColors, closePendPanel, filter, find |
| L148 · openPendPanel | UI | _esc, _restoreModalFocus, add, closePendPanel, filter, forEach |
| L170 · closePendPanel | UI | _restoreModalFocus, add, closeStandaloneCheckpoint, focus, openStandaloneCheckpoint, overlay |
| L176 · openStandaloneCheckpoint | UI | add, closeStandaloneCheckpoint, focus, openDocLog, overlay, remove |
| L188 · closeStandaloneCheckpoint | UI | _renderDocLog, add, closeDocLog, drawer, openDocLog, overlay |
| L200 · openDocLog | UI | _renderDocLog, _restoreModalFocus, _updateDocLogCount, add, closeDocLog, drawer |
| L216 · closeDocLog | UI | _renderDocLog, _restoreModalFocus, _updateDocLogCount, getItem, parse, remove |
| L227 · _updateDocLogCount | Internal | _relTs, _renderDocLog, getItem, map, parse, slice |
| L238 · _renderDocLog | Render | _esc, _relTs, clearDocLog, getAttribute, getItem, join |
| L264 · clearDocLog | Internal | _renderDocLog, _updateDocLogCount, closePendPanel, getAttribute, html, removeItem |

## locus-modals.js
**Líneas:** 117 · **Size:** low · **mod:** 3 · **Changed in:** —

**Exports:** _gconfirmOpen, _gconfirmClose, _gconfirmOk, _saveModalTrigger, _restoreModalFocus, _focusFirstInteractive, closeModal

| Función | Área | Calls |
|---------|------|-------|
| L15 · _gconfirmOpen | Internal | _gconfirmClose, _gconfirmOk, add, contains, focus, remove |
| L36 · _gconfirmClose | Internal | _focusFirstInteractive, _gconfirmOk, _restoreModalFocus, _saveModalTrigger, contains, focus |
| L41 · _gconfirmOk | Internal | _focusFirstInteractive, _restoreModalFocus, _saveModalTrigger, contains, focus, get |
| L51 · _saveModalTrigger | Internal | _focusFirstInteractive, _restoreModalFocus, closeModal, focus, get, not |
| L56 · _restoreModalFocus | Internal | _focusFirstInteractive, closeModal, focus, get, not, remove |
| L64 · _focusFirstInteractive | Internal | _gconfirmClose, _restoreModalFocus, closeModal, focus, not, remove |
| L73 · closeModal | UI | _gconfirmClose, _gconfirmOk, _restoreModalFocus, remove |

## locus-notifications.js
**Líneas:** 413 · **Size:** low · **mod:** 5 · **Changed in:** —

**Exports:** _NOTIF_DEFAULTS, _notifConfig, _notifReadSet, hasRecentSession, _computeNotifications, markNotifRead, markAllNotifsRead, updateTabNotifBadges, openNotifConfig, _notifConfigReset, _notifConfigSetEnabled, _notifConfigSetThreshold, closeNotifConfig, _registerNotifActions, _notifGoto

| Función | Área | Calls |
|---------|------|-------|
| L24 · _notifHistory | Internal | _notifHistoryAdd, getItem, now, parse, push, setItem |
| L28 · _notifHistoryAdd | Internal | _notifConfig, _notifHistory, now, push, setItem, slice |
| L56 · _notifConfig | Internal | _notifReadSet, _notifSaveRead, _saveNotifConfig, assign, forEach, getItem |
| L68 · _saveNotifConfig | Internal | _notifReadSet, _notifSaveRead, concat, forEach, getAllSessions, getItem |
| L72 · _notifReadSet | Internal | _notifSaveRead, concat, forEach, getAllSessions, getItem, getTime |
| L76 · _notifSaveRead | Internal | concat, forEach, getAllSessions, getTime, hasRecentSession, includes |
| L86 · hasRecentSession | Internal | _computeNotifications, _itemHasRecentSession, _notifConfig, concat, forEach, getAllSessions |
| L88 · allSess | Internal | _computeNotifications, _itemHasRecentSession, _notifConfig, concat, forEach, getAllSessions |
| L92 · refs | Internal | _computeNotifications, _itemHasRecentSession, _notifConfig, concat, filter, forEach |
| L106 · _computeNotifications | Internal | _itemHasRecentSession, _notifConfig, filter, find, forEach, hasRecentSession |
| L108 · items | Internal | _itemHasRecentSession, _notifConfig, filter, find, forEach, hasRecentSession |
| L112 · _itemHasRecentSession | Internal | filter, find, forEach, hasRecentSession, includes, navigateToItem |
| L126 · recent | Internal | filter, find, forEach, getActiveSprints, includes, navigateToItem |
| L133 · lbl | Internal | filter, forEach, getActiveSprints, navigateToItem, push, setFilter |
| L145 · allSprints | Internal | filter, forEach, getActiveSprints, map, push, setFilter |
| L168 · allSprintsForInactivo | Internal | _itemHasRecentSession, filter, floor, forEach, getActiveSprints, includes |
| L178 · ageDays | Internal | _itemHasRecentSession, filter, floor, forEach, getActiveSprints, navigateToItem |
| L182 · lbl | Internal | filter, floor, forEach, getActiveSprints, navigateToItem, now |
| L195 · allSprints2 | Internal | filter, forEach, getActiveSprints, now, push, round |
| L227 · ageDays | Internal | _itemHasRecentSession, filter, floor, forEach, getAllSessions, getTime |
| L231 · lbl | Internal | filter, floor, forEach, getAllSessions, getTime, navigateToItem |
| L243 · active | Internal | filter, floor, forEach, getAllSessions, getTime, navigateToCard |
| L246 · allSess | Internal | filter, floor, getAllSessions, getTime, navigateToCard, now |
| L254 · diff | Internal | _computeNotifications, _notifHistoryAdd, find, floor, getTime, markNotifRead |
| L279 · markNotifRead | Internal | _computeNotifications, _notifHistoryAdd, _notifReadSet, _notifSaveRead, add, filter |
| L291 · markAllNotifsRead | Internal | _computeNotifications, _notifHistoryAdd, _notifReadSet, _notifSaveRead, add, filter |
| L304 · updateTabNotifBadges | Utils | _computeNotifications, _notifReadSet, add, filter, forEach, has |
| L305 · notifs | Internal | _computeNotifications, _notifReadSet, add, filter, forEach, has |
| L336 · openNotifConfig | UI | _notifConfig, _notifConfigReset, _notifConfigSetEnabled, _notifConfigSetThreshold, _saveNotifConfig, assign |
| L350 · _notifConfigReset | Internal | _notifConfig, _notifConfigSetEnabled, _notifConfigSetThreshold, _saveNotifConfig, add, assign |
| L355 · _notifConfigSetEnabled | Internal | _notifConfig, _notifConfigSetThreshold, _saveNotifConfig, add, assign, closeNotifConfig |
| L363 · _notifConfigSetThreshold | Internal | _notifConfig, _registerNotifActions, _saveNotifConfig, add, assign, closeNotifConfig |
| L373 · closeNotifConfig | UI | _notifGoto, _registerNotifActions, add, forEach, markNotifRead |
| L390 · _registerNotifActions | Internal | _notifGoto, forEach, markNotifRead |
| L393 · _notifGoto | Internal | markNotifRead |

## locus-projects.js
**Líneas:** 1280 · **Size:** high · **mod:** 5 · **Changed in:** —

**Exports:** renderProyectos

| Función | Área | Calls |
|---------|------|-------|
| L25 · renderProyectos | Render | _getActiveProjectFilter, _projSessions, _weekStart, contains, filter, getDate |
| L29 · _cpOpen | Internal | _getActiveProjectFilter, _projSessions, _sessThisWeek, _weekStart, contains, filter |
| L44 · _weekStart | Internal | _lastSession, _projSessions, _sessThisWeek, _trend, filter, getDate |
| L54 · _projSessions | Internal | _lastSession, _sessThisWeek, _trend, _weekStart, filter, getProjectSessions |
| L58 · _sessThisWeek | Internal | _lastSession, _projSessions, _trend, _weekStart, filter, getTime |
| L66 · _lastSession | Internal | _projSessions, _relTimeShort, _trend, filter, floor, getTime |
| L73 · _trend | Internal | _projSessions, _relTimeShort, filter, floor, getTime, now |
| L82 · delta | Internal | _backlogStats, _projKey, _relTimeShort, filter, floor, getItem |
| L88 · _relTimeShort | Internal | _backlogStats, _projKey, filter, floor, getItem, getTime |
| L103 · _backlogStats | Internal | _projKey, _typeColor, filter, find, getItem, has |
| L125 · _typeColor | Internal | _backlogStats, _buildCard, _effortDots, _lastSession, _sessThisWeek, _trend |
| L133 · _effortDots | Internal | _backlogStats, _buildCard, _lastSession, _sessThisWeek, _trend, esc |
| L138 · _buildCard | Builder | _backlogStats, _lastSession, _sessThisWeek, _trend, esc, floor |
| L402 · _calcProjVelocity | Utils | _backlogStats, _estimateSprintClose, _projSessions, _sessThisWeek, _suggestionProj, filter |
| L412 · _estimateSprintClose | Internal | _backlogStats, _calcProjVelocity, _sessThisWeek, _suggestionProj, filter, getAISessions |
| L425 · _suggestionProj | Internal | _backlogStats, _sessThisWeek, esc, filter, getAISessions, map |
| L437 · totalGlobalSess | Internal | _backlogStats, esc, getAISessions, openProjModal, reduce |
| L476 · _proyDeleteInline | Internal | _getActiveProjectFilter, _proyAbrir, _proyDeleteExecute, _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn |
| L482 · _proyDeleteExecute | Internal | _getActiveProjectFilter, _proyAbrir, _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn, filter |
| L495 · _proyAbrir | Internal | _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn, findIndex, getAIColor, getProjectById |
| L514 · getAIColor | Utils | _getActiveProjectFilter, filter, findIndex, forEach, getProjectById, has |
| L524 · renderProject | Render | _getActiveProjectFilter, filter, forEach, getAISessions, getProjectById, has |
| L541 · filteredAIs | Internal | card, filter, flatMap, forEach, getAISessions, has |
| L689 · sprintItems | Internal | esc, filter, getProjectById, reduce, round, switchSubTab |
| L725 · _renderCtxPreview | Render | join, map, push, renderContextMd, replace, some |
| L766 · _buildCtxEl | Builder | _projCtxCancelEdit, _projCtxSave, _projCtxStartEdit, _renderCtxPreview, esc, focus |
| L800 · candidateItems | Internal | _calcRelevanceScore, _qnNavToItem, esc, filter, join, map |
| L840 · blockedItems | Internal | filter, floor, map, now, sort |
| L904 · _renderDecisionsSection | Render | _projCancelDecision, _projDeleteDecision, _projEditDecision, _projOpenAddDecision, _projSaveDecision, esc |
| L943 · _projOpenAddDecision | Internal | _projSaveDecision, find, focus, getAttribute, getProjectById, isArray |
| L955 · _projSaveDecision | Internal | _projCancelDecision, _renderDecisionsSection, add, find, getAttribute, getProjectById |
| L960 · text | Internal | _projCancelDecision, _projEditDecision, _renderDecisionsSection, add, find, getAttribute |
| L979 · _projCancelDecision | Internal | _projDeleteDecision, _projEditDecision, add, find, findIndex, focus |
| L985 · _projEditDecision | Internal | _projDeleteDecision, _renderDecisionsSection, find, findIndex, focus, getProjectById |
| L988 · dec | Internal | _projDeleteDecision, _qnNavToItem, _renderDecisionsSection, find, findIndex, focus |
| L1002 · _projDeleteDecision | Internal | _projCtxStartEdit, _qnNavToItem, _renderDecisionsSection, escape, findIndex, getProjectById |
| L1015 · _qnNavToItem | Internal | _projCtxCancelEdit, _projCtxSave, _projCtxStartEdit, esc, escape, getProjectById |
| L1030 · _projCtxStartEdit | Internal | _projCtxCancelEdit, _projCtxSave, esc, focus, getProjectById, renderProject |
| L1051 · _projCtxSave | Internal | _projCtxCancelEdit, _projCtxToggleSec, _projToggleAIFilter, _projViewSearchInput, contains, renderProject |
| L1059 · _projCtxCancelEdit | Internal | _projCtxToggleSec, _projToggleAIFilter, _projViewSearchInput, _toggleProjAnalytics, contains, renderProject |
| L1063 · _projCtxToggleSec | Internal | _projToggleAIFilter, _projViewSearchInput, _toggleProjAnalytics, contains, renderProject, renderProjectAnalytics |
| L1072 · _projToggleAIFilter | Internal | _projViewSearchInput, _toggleProjAnalytics, contains, getProjectById, getProjectSessions, renderProject |
| L1077 · _projViewSearchInput | Internal | _toggleProjAnalytics, contains, filter, getProjectById, getProjectSessions, has |
| L1085 · _toggleProjAnalytics | Internal | contains, filter, fmtMonth, getAnalyticsMonths, getProjectById, getProjectSessions |
| L1095 · renderProjectAnalytics | Render | filter, fmtMonth, getAnalyticsMonths, getProjectById, getProjectSessions, has |
| L1194 · downloadProjectReport | Save / Load | filter, forEach, getAI, getProjectById, getProjectSessions, has |
| L1251 · toggleProjectSection | UI | toggle |

## locus-pulso.js
**Líneas:** 330 · **Size:** low · **mod:** 4 · **Changed in:** —

**Exports:** _markPulsoDotDirty, renderPulsoDot, openPulsoPanel, closePulsoPanel

| Función | Área | Calls |
|---------|------|-------|
| L24 · _calcPulsoDotState | Utils | filter, floor, has, map, now, reduce |
| L31 · activeProjects | Internal | activos, filter, floor, has, map, reduce |
| L94 · _buildPulsoPlanesHtml | Builder | _liveStatus, _tplKey, every, filter, flatMap, forEach |
| L95 · projects | Internal | _liveStatus, _tplKey, every, filter, find, flatMap |
| L98 · backlog | Internal | _liveStatus, _tplKey, every, filter, find, flatMap |
| L171 · _markPulsoDotDirty | Internal | _calcPulsoDotState, neutral, now, renderPulsoDot, setAttribute, setItem |
| L174 · renderPulsoDot | Render | _calcPulsoDotState, neutral, now, setAttribute, setItem, stringify |
| L205 · openPulsoPanel | UI | _calcPulsoDotState, esc, map, min, round |
| L287 · onKey | Events | DOM, closePulsoPanel, overlay, remove |
| L297 · closePulsoPanel | UI | _initPulsoHandlers, overlay, remove |
| L321 · _initPulsoHandlers | Internal | closePulsoPanel |

## locus-radar.js
**Líneas:** 714 · **Size:** medium · **mod:** 6 · **Changed in:** —

**Exports:** _markRadarDirty, renderGlobalRadarSidebar, _rsbToggleCollapseAll, rsbFilterAIs, rsbClearSearch, rsbTogglePin, toggleRadarSidebar, _initRadarSidebarState

| Función | Área | Calls |
|---------|------|-------|
| L26 · fmt12 | Internal | _computeNotifications, _fmtNotifTs, _hoyMsUntilReset, _isInSession, _notifReadSet, _registerNotifActions |
| L27 · getCD | Utils | _computeNotifications, _fmtNotifTs, _hoyMsUntilReset, _isInSession, _notifReadSet, _registerNotifActions |
| L28 · _isInSession | Internal | _computeNotifications, _fmtNotifTs, _hoyMsUntilReset, _notifReadSet, _registerNotifActions, _renderNotifSection |
| L29 · _hoyMsUntilReset | Internal | _computeNotifications, _fmtNotifTs, _notifReadSet, _registerNotifActions, _renderNotifSection, filter |
| L33 · _fmtNotifTs | Internal | _computeNotifications, _notifReadSet, _registerNotifActions, _renderNotifSection, filter, getDate |
| L36 · pad | Internal | _computeNotifications, _fmtNotifTs, _notifReadSet, _registerNotifActions, _renderNotifSection, filter |
| L44 · _renderNotifSection | Render | _computeNotifications, _fmtNotifTs, _notifReadSet, _registerNotifActions, filter, has |
| L89 · text | Internal | _fmtNotifTs, _renderCfgPanel, join, openNotifConfig, renderGlobalRadarSidebar, replace |
| L128 · _renderCfgPanel | Render | _notifConfig, join, keys, map |
| L132 · thrInput | Internal | join |
| L165 · _rsbToggleCfg | Internal | _sessionElapsed, floor, getAISessions, getItem, getTime, now |
| L180 · _sessionElapsed | Internal | _sessionTitle, floor, getAISessions, getItem, getTime, now |
| L204 · _sessionTitle | Internal | _buildSessionCard, _projPill, esc, find, getAISessions, getState |
| L213 · _projPill | Internal | _buildSessionCard, esc, find, getAISessions, getState |
| L230 · _buildSessionCard | Builder | _buildAvailableCard, _projPill, esc, fmt12, getAISessions, getHours |
| L248 · _buildAvailableCard | Builder | _projPill, esc, fmt12, getAISessions, getHours, getMinutes |
| L287 · _buildExhaustedCard | Builder | Agotadas, _markRadarDirty, esc, fmt12, getCD, renderGlobalRadarSidebar |
| L310 · _markRadarDirty | Internal | _hoyMsUntilReset, _isInSession, contains, filter, forEach, getAISessions |
| L313 · renderGlobalRadarSidebar | Render | _computeNotifications, _hoyMsUntilReset, _isInSession, _notifReadSet, contains, filter |
| L324 · active | Internal | _computeNotifications, _hoyMsUntilReset, _isInSession, _notifReadSet, _renderNotifSection, calculados |
| L329 · _getSessions | Internal | _computeNotifications, _hoyMsUntilReset, _isInSession, _notifReadSet, _renderNotifSection, calculados |
| L459 · _rsbToggleCollapseAll | Internal | Agotadas, _rsbToggleAgotadas, add, contains, every, forEach |
| L476 · _rsbToggleAgotadas | Internal | forEach, includes, rsbFilterAIs, setItem, toLowerCase, toggle |
| L487 · rsbFilterAIs | Internal | contains, forEach, from, includes, some, toLowerCase |
| L501 · name | Internal | contains, focus, forEach, from, includes, remove |
| L533 · rsbClearSearch | Internal | _applyToastOffset, _rsbIsPinned, getItem, removeProperty, rsbFilterAIs, rsbTogglePin |
| L542 · rsbTogglePin | Internal | _applyToastOffset, _rsbIsPinned, getItem, removeProperty, setItem, setProperty |
| L551 · _rsbIsPinned | Internal | _applyToastOffset, _initRadarSidebarState, getItem, removeProperty, setItem, setProperty |
| L556 · _applyToastOffset | Internal | _initRadarSidebarState, add, getItem, remove, removeProperty, setItem |
| L568 · toggleRadarSidebar | UI | _applyToastOffset, _initRadarSidebarState, add, getItem, remove, setItem |
| L579 · _initRadarSidebarState | Internal | _applyToastOffset, add, contains, getItem, remove |

## locus-reports.js
**Líneas:** 938 · **Size:** medium · **mod:** 5 · **Changed in:** —

**Exports:** downloadReport, _syncCleanProjectBtn

| Función | Área | Calls |
|---------|------|-------|
| L35 · downloadReport | Save / Load | filter, forEach, getAI, getAISessions, getActiveTracker, join |
| L55 · titulo | Internal | Blob, click, createObjectURL, downloadGlobalReport, filter, getAllSessions |
| L56 · resumen | Internal | Blob, click, createObjectURL, downloadGlobalReport, filter, getAllSessions |
| L57 · tgItems | Internal | Blob, click, createObjectURL, downloadGlobalReport, filter, getAllSessions |
| L64 · safeName | Internal | Blob, click, createObjectURL, downloadGlobalReport, filter, forEach |
| L75 · downloadGlobalReport | Save / Load | filter, forEach, getActiveTracker, getAllSessions, localeCompare, showToast |
| L108 · titulo | Internal | Blob, add, click, closeCkptPanel, contains, createObjectURL |
| L109 · resumen | Internal | Blob, add, click, closeCkptPanel, contains, createObjectURL |
| L110 · tgItems | Internal | Blob, add, click, closeCkptPanel, contains, createObjectURL |
| L167 · toggleMoreMenu | UI | _templateTrigger, add, contains, getBoundingClientRect, remove |
| L192 · _closeOnOutside | Internal | add, contains, exportData, forEach, getItem, memoria |
| L207 · exportData | Save / Load | _getActiveProjectFilter, forEach, getItem, memoria, now, parse |
| L253 · purgeOldSessions | Internal | _restoreModalFocus, _saveModalTrigger, add, closePurgeModal, focus, openPurgeModal |
| L257 · openPurgeModal | UI | _focusFirstInteractive, _restoreModalFocus, _saveModalTrigger, add, closePurgeModal, closeResetBacklogModal |
| L265 · closePurgeModal | UI | _focusFirstInteractive, _restoreModalFocus, _saveModalTrigger, add, closeResetBacklogModal, confirmResetBacklog |
| L270 · toggleBacklogDangerZone | UI | _focusFirstInteractive, _restoreModalFocus, _saveModalTrigger, _tplKey, add, closeResetBacklogModal |
| L276 · openResetBacklogModal | UI | _focusFirstInteractive, _restoreModalFocus, _saveModalTrigger, _tplKey, add, closeResetBacklogModal |
| L286 · closeResetBacklogModal | UI | _getActiveProjectFilter, _restoreModalFocus, _tplKey, confirmResetBacklog, from, remove |
| L291 · confirmResetBacklog | Internal | _getActiveProjectFilter, _offlineQueuePush, _tplKey, error, from, removeItem |
| L332 · toggleSidebarDanger | UI | _getActiveProjectFilter, _syncCleanProjectBtn, getProjectById, openCleanProjectModal, toggle |
| L343 · openCleanProjectModal | UI | _getActiveProjectFilter, _saveModalTrigger, add, closeCleanProjectModal, focus, getProjectById |
| L371 · closeCleanProjectModal | UI | _cleanProjectValidate, _getActiveProjectFilter, _restoreModalFocus, _syncCleanProjectBtn, add, remove |
| L378 · _syncCleanProjectBtn | Internal | _cleanProjectValidate, _getActiveProjectFilter, add, confirmCleanProject, remove, setAttribute |
| L388 · _cleanProjectValidate | Internal | _getActiveProjectFilter, add, confirmCleanProject, remove, setAttribute |
| L405 · confirmCleanProject | Internal | _getActiveProjectFilter, _unsubscribeRealtime, add, getProjectById, setAttribute |
| L444 · projObj | Internal | _offlineQueuePush, find, from, push, removeItem |
| L531 · resetContextData | Internal | _gconfirmOpen, _tplKey, _updateSubTabButtons, removeItem, renderContext, resetHtmlMapData |
| L552 · resetHtmlMapData | Internal | _calcPurgeCount, _gconfirmOpen, _tplKey, forEach, getAllSessions, getMonth |
| L573 · _calcPurgeCount | Utils | forEach, getAllSessions, getMonth, getTime, setMonth, updatePurgePreview |
| L585 · updatePurgePreview | Utils | _calcPurgeCount, confirmPurge, filter, forEach, getMonth, getTime |
| L604 · confirmPurge | Internal | Error, FileReader, _calcPurgeCount, _showImportDiff, closePurgeModal, filter |
| L621 · importData | Save / Load | Error, FileReader, _importCountSessions, _showImportDiff, parse, readAsText |
| L638 · _importCountSessions | Internal | _showImportDiff, add, filter, flatMap, forEach, has |
| L642 · _showImportDiff | Internal | _importCountSessions, add, filter, flatMap, forEach, has |
| L668 · newProjects | Internal | entries, filter, forEach, getItem, has, parse |
| L680 · backupMeta | Internal | getItem, parse |
| L682 · localMeta | Internal | parse |
| L717 · closeImportDiff | UI | _restoreModalFocus, add, confirmImport, forEach, has, map |
| L726 · confirmImport | Internal | add, existente, forEach, has, map, now |
| L817 · backupMeta | Internal | ausentes, entries, forEach, getItem, parse, setItem |
| L830 · localMeta | Internal | applyTheme, ausentes, getItem, loadBacklog, local, parse |
| L835 · localMeta | Internal | applyTheme, ausentes, closeImportDiff, getItem, loadBacklog, local |
| L867 · _initReportsListeners | Internal | close, closeCleanProjectModal |

## locus-sesiones-arranque.js
**Líneas:** 456 · **Size:** low · **mod:** 5 · **Changed in:** —

| Función | Área | Calls |
|---------|------|-------|
| L28 · _arranqueItemByCode | Internal | _liveStatus, _liveTitle, _sessIsDone, _tplKey, completa, every |
| L40 · _liveStatus | Internal | _arranqueItemByCode, _isBlocked, _liveTitle, _sessIsDone, completa, every |
| L46 · _liveTitle | Internal | _arranqueItemByCode, _isBlocked, _liveStatus, _sessIsDone, completa, every |
| L52 · _sessIsDone | Internal | _blocked, _isBlocked, _liveStatus, closeArranquePanel, every, filter |
| L66 · _isBlocked | Internal | _blocked, _showArranquePanel, arranque, closeArranquePanel, every, filter |
| L67 · deps | Internal | _blocked, _isBlocked, _showArranquePanel, arranque, closeArranquePanel, every |
| L76 · _blocked | Internal | _isBlocked, _showArranquePanel, arranque, closeArranquePanel, filter, getItem |
| L80 · closeArranquePanel | UI | _showArranquePanel, arranque, filter, getAllSessions, getItem, now |
| L85 · _showArranquePanel | Internal | arranque, filter, getAllSessions, getItem, getTime, now |
| L98 · allProjects | Internal | filter, find, floor, getAllSessions, getTime, now |
| L122 · lastProjObj | Internal | esc, filter, find, includes, join, map |
| L124 · lastAIObj | Internal | esc, filter, find, includes, join, map |
| L139 · t | Internal | esc, find, getTime, join, map, max |
| L176 · t | Internal | esc, filter, getTime, map, max, some |
| L188 · nonArchived | Internal | _hoyCountdownLabel, _hoyMsUntilReset, esc, filter, getTime, map |
| L225 · _activeProj | Internal | _liveStatusLocal, _tplKey, cargado, every, filter, find |
| L231 · _backlogItems | Internal | _liveStatusLocal, _tplKey, cargado, every, forEach, getItem |
| L266 · deps | Internal | _isBlockedLocal, _liveStatusLocal, _sessIsDoneLocal, _sessScoreLocal, esc, every |
| L285 · t | Internal | _liveStatusLocal, esc, filter, join, push, toUpperCase |
| L292 · pendingCodes | Internal | _filePill, _liveStatusLocal, esc, filter, join, map |
| L295 · archivos | Internal | _filePill, esc, filter, join, map, push |
| L346 · pendCount | Internal | _liveStatusLocal, esc, filter, find, has, includes |
| L442 · onKey | Events | add, closeArranquePanel |

## locus-sesiones-capture.js
**Líneas:** 354 · **Size:** low · **mod:** 5 · **Changed in:** —

**Exports:** openQuickCapture, closeQuickCapture

| Función | Área | Calls |
|---------|------|-------|
| L30 · _qcEl | Internal | _qcSetStep, add, display, remove, setAttribute |
| L33 · _qcSetStep | Internal | _qcEl, add, focus, remove, setAttribute |
| L67 · _qcRenderWorkerList | Internal | _qcEl, desbloqueo, esc, filter, join, map |
| L70 · available | Internal | _qcEl, desbloqueo, esc, filter, join, map |
| L83 · openQuickCapture | UI | _qcEl, _qcSetStep, add, desbloqueo, filter, getAI |
| L95 · available | Internal | _qcEl, _qcRenderWorkerList, _qcSetStep, add, filter, forEach |
| L121 · qcSelectWorker | Internal | _qcEl, _qcSetStep, add, closeQuickCapture, confirmQuickCapture, contains |
| L133 · qcHandleNext | Internal | _qcEl, _qcSetStep, closeQuickCapture, confirmQuickCapture, contains, getAI |
| L144 · qcHandleBack | Internal | _horaUpdate, _qcEl, _qcSetStep, closeQuickCapture, closeQuickModal, contains |
| L155 · closeQuickCapture | UI | _horaUpdate, _qcEl, closeQuickModal, confirmQuickCapture, desbloqueo, preventDefault |
| L163 · closeQuickModal | UI | _horaUpdate, _qcEl, add, closeQuickCapture, confirmQuickCapture, desbloqueo |
| L166 · quickParseHora | Internal | _horaUpdate, _qcEl, add, closeQuickCapture, confirmQuickCapture, desbloqueo |
| L176 · quickTitleKey | Internal | _qcEl, add, closeQuickCapture, confirmQuickCapture, focus, getAI |
| L181 · confirmQuickCapture | Internal | _qcEl, add, focus, getAI, interpretHora, now |
| L243 · confirmInterruptInline | Internal | _dotConfirmHandler, add, after, cancelInterruptInline, closeCardMenu, contains |
| L269 · cancelInterruptInline | Internal | _gconfirmOpen, add, getAI, interpretHora, interruptSession, remove |
| L278 · interruptSession | Internal | _gconfirmOpen, add, dismissInterrupted, getAI, interpretHora, render |
| L304 · dismissInterrupted | Internal | closeQuickCapture, closest, eliminada, event, getAI, item |

## locus-sesiones-stats.js
**Líneas:** 338 · **Size:** low · **mod:** 5 · **Changed in:** —

**Exports:** _hasStaleSuggestion, _updateHeaderProjectLabel, _scrollToCard, navigateToCard, updateStats, _isInSession, _markStatusBarDirty, renderStatusBar, toggleCollapseAll

| Función | Área | Calls |
|---------|------|-------|
| L27 · _hasStaleSuggestion | Internal | _effectiveVersion, _getActiveProjectFilter, _updateHeaderProjectLabel, getAISessions, getProjectById, getTime |
| L34 · diffDays | Internal | _effectiveVersion, _getActiveProjectFilter, _updateHeaderProjectLabel, getProjectById, getTime, now |
| L44 · _updateHeaderProjectLabel | Internal | _getActiveProjectFilter, find, getProjectById, remove, removeAttribute, setAttribute |
| L112 · _allItems | Internal | _scrollToCard, add, find, navigateToItem, openItemPanel, remove |
| L138 · _scrollToCard | Internal | _isInSession, filter, focus, getActiveTracker, getAllSessions, navigateToCard |
| L143 · navigateToCard | Internal | _isInSession, filter, focus, getActiveTracker, getAllSessions, reduce |
| L152 · updateStats | Utils | _getActiveSprintStats, _isInSession, filter, find, getActiveProject, getActiveTracker |
| L157 · activeCount | Internal | _getActiveSprintStats, _isInSession, filter, find, getActiveProject, getAllSessions |
| L164 · _isInSession | Internal | _getActiveSprintStats, _markStatusBarDirty, filter, find, getActiveProject, getAllSessions |
| L173 · _getActiveSprintStats | Internal | _markStatusBarDirty, filter, find, getActiveProject, renderStatusBar, round |
| L178 · spItems | Internal | _getActiveSprintStats, _markStatusBarDirty, filter, renderStatusBar, round |
| L192 · _markStatusBarDirty | Internal | _getActiveSprintStats, add, renderStatusBar, toggleSprintHealthPanel |
| L195 · renderStatusBar | Render | _getActiveSprintStats, add, remove, toggleSprintHealthPanel |
| L250 · _items | Internal | _effectiveVersion, _isCountableItem, filter, getActiveProject, getAllSessions, remove |
| L255 · nombre | Internal | _effectiveVersion, _isCountableItem, filter, getAllSessions, remove, slice |
| L285 · titulo | Internal | add, filter, map, openDetail, openPulsoPanel, remove |
| L327 · toggleCollapseAll | UI | _markTrackerDirty, every, filter, forEach, render, save |

## locus-sesiones-utils.js
**Líneas:** 419 · **Size:** low · **mod:** 4 · **Changed in:** —

**Exports:** startSessionTimer, _renderActiveWorkerChip, _buildSuggestionReason, renderSuggestionBanner

| Función | Área | Calls |
|---------|------|-------|
| L19 · _timerKey | Internal | _clearTimerData, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, _setTimerData, _timerIsActive |
| L21 · _getTimerData | Internal | _clearTimerData, _refreshTimerTick, _renderActiveWorkerChip, _setTimerData, _timerIsActive, _timerKey |
| L28 · _setTimerData | Internal | _clearTimerData, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, _timerIsActive, _timerKey |
| L32 · _clearTimerData | Internal | _formatTimer, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, _setTimerData, _timerIsActive |
| L36 · _timerIsActive | Internal | _formatTimer, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, _setTimerData, floor |
| L42 · stopSessionTimer | Internal | _formatTimer, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, _renderTimerInCard, _setTimerData |
| L53 · startSessionTimer | Internal | _formatTimer, _getTimerData, _refreshTimerTick, _renderTimerInCard, _setTimerData, find |
| L61 · _formatTimer | Internal | _getTimerData, _renderTimerInCard, find, floor, getAISessions, now |
| L69 · _renderTimerInCard | Render | _formatTimer, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, find, forEach |
| L81 · ai | Internal | _cscardRelTs, _refreshTimerTick, _renderActiveWorkerChip, _renderTimerInCard, find, forEach |
| L85 · t | Internal | _cscardRelTs, _getTimerData, _refreshTimerTick, _renderActiveWorkerChip, _renderTimerInCard, _timerWidgetHtml |
| L91 · _refreshTimerTick | Internal | _cscardRelTs, _formatTimer, _getTimerData, _renderActiveWorkerChip, _renderTimerInCard, _timerWidgetHtml |
| L112 · _timerWidgetHtml | Internal | _formatTimer, _getTimerData, _renderActiveWorkerChip, add, forEach, now |
| L115 · dotCls | Internal | _formatTimer, _getTimerData, _renderActiveWorkerChip, add, forEach, now |
| L126 · _renderActiveWorkerChip | Render | _getTimerData, _hwcClick, add, floor, forEach, now |
| L155 · _hwcClick | Internal | _computeSuggestionScore, getAISessions, getTime, min, now, reduce |
| L171 · _computeSuggestionScore | Internal | filter, getAISessions, getTime, includes, min, now |
| L181 · daysSince | Internal | _computeSuggestionScore, _getSuggestedAI, filter, getTime, includes, min |
| L189 · highPending | Internal | _computeSuggestionScore, _getSuggestedAI, _highPendingCount, filter, getTime, includes |
| L204 · _getSuggestedAI | Internal | _buildSuggestionReason, _computeSuggestionScore, _highPendingCount, filter, getAISessions, includes |
| L205 · active | Internal | _buildSuggestionReason, _computeSuggestionScore, _highPendingCount, filter, getAISessions, includes |
| L221 · _highPendingCount | Internal | _buildSuggestionReason, add, buildCard, filter, floor, getAISessions |
| L229 · _buildSuggestionReason | Builder | _highPendingCount, add, buildCard, dismissSuggestionBanner, floor, getAISessions |
| L246 · renderSuggestionBanner | Render | _isMonday, _trackerSelectAI, add, buildCard, dismissSuggestionBanner, getDay |
| L252 · dismissSuggestionBanner | Internal | _getMondayKey, _isMonday, _trackerSelectAI, add, getDate, getDay |
| L257 · startSuggestedSession | Internal | _getMondayKey, _isMonday, _trackerSelectAI, _weeklyAlreadyDismissed, dismissSuggestionBanner, getDate |
| L274 · _isMonday | Internal | _buildWeeklySummary, _getMondayKey, _markWeeklyDismissed, _weeklyAlreadyDismissed, anterior, filter |
| L276 · _getMondayKey | Internal | _buildWeeklySummary, _markWeeklyDismissed, _weeklyAlreadyDismissed, anterior, filter, flatMap |
| L284 · _weeklyAlreadyDismissed | Internal | _buildWeeklySummary, _getMondayKey, _markWeeklyDismissed, anterior, cerrados, filter |
| L291 · _markWeeklyDismissed | Internal | _buildWeeklySummary, _getMondayKey, anterior, cerrados, filter, flatMap |
| L295 · _buildWeeklySummary | Builder | anterior, cerrados, entries, filter, flatMap, forEach |
| L301 · allSessions | Internal | cerrados, entries, filter, flatMap, forEach, getAI |
| L344 · _exportWeeklySummaryMd | Internal | Blob, _buildWeeklySummary, _markWeeklyDismissed, add, click, createObjectURL |
| L366 · dismissWeeklySummary | Internal | _buildWeeklySummary, _initHwcHandler, _isMonday, _markWeeklyDismissed, _maybeShowWeeklySummary, _weeklyAlreadyDismissed |
| L374 · _maybeShowWeeklySummary | Internal | _buildWeeklySummary, _initHwcHandler, _isMonday, _weeklyAlreadyDismissed, remove |
| L405 · _bind | Internal | — |

## locus-sesiones-viz.js
**Líneas:** 561 · **Size:** medium · **mod:** 4 · **Changed in:** —

**Exports:** _itemVizClose, _copyTextSafe, showCheckpointPanel, closeCkptPanel

| Función | Área | Calls |
|---------|------|-------|
| L18 · openCorrectHora | UI | add, esc, fmt12, getAI |
| L48 · raw | Internal | add, confirmCorrectHora, interpretHora, not, preventDefault, remove |
| L86 · confirmCorrectHora | Internal | add, getAI, getAISessions, interpretHora, remove, render |
| L117 · unlockNowFromCard | Internal | _showItemVizPanel, getAI, onConfirm, remove, render, renderHoy |
| L141 · _showItemVizPanel | Internal | _itemVizRender, add, find, forEach, onConfirm, remove |
| L151 · bk | Internal | _itemVizConfirm, _itemVizRender, add, find, preventDefault, remove |
| L171 · _vizKeyHandler | Internal | _itemVizClose, _itemVizConfirm, add, preventDefault, remove |
| L173 · tag | Internal | _itemVizClose, _itemVizConfirm, add, preventDefault, remove |
| L183 · _itemVizClose | Internal | _itemVizConfirm, _itemVizToggleExclude, add, filter, has, remove |
| L201 · _itemVizConfirm | Internal | _itemVizClose, _itemVizNavBacklog, _itemVizRender, _itemVizToggleExclude, _itemVizToggleSinCambios, add |
| L210 · _itemVizToggleExclude | Internal | _itemVizClose, _itemVizNavBacklog, _itemVizRender, _itemVizToggleSinCambios, add, escape |
| L216 · _itemVizToggleSinCambios | Internal | _itemVizClose, _itemVizNavBacklog, _itemVizRender, add, escape, remove |
| L224 · _itemVizNavBacklog | Internal | _getBacklogItem, _itemVizClose, _itemVizRender, add, escape, find |
| L238 · _itemVizRender | Internal | _getBacklogItem, find, stringify |
| L245 · _getBacklogItem | Internal | find, stringify |
| L250 · _isSinCambio | Internal | _getBacklogItem, push, stringify |
| L263 · _mergeResultClass | Internal | filter, includes, join, push, stringify |
| L267 · _mergeResultLabel | Internal | _isSinCambio, filter, includes, join, map, push |
| L271 · _fieldDiffChips | Internal | _isSinCambio, filter, has, includes, join, map |
| L310 · _buildRow | Builder | _fieldDiffChips, _getBacklogItem, esc, has, join, map |
| L331 · newBlock | Internal | _fieldDiffChips, _mergeResultClass, _mergeResultLabel, esc, join, map |
| L432 · _copyTextSafe | Internal | _doFlash, _vizCopyCode, add, blur, execCommand, focus |
| L447 · _vizCopyCode | Internal | _copyTextSafe, _doFlash, add, remove, showCheckpointPanel, stopPropagation |
| L451 · _doFlash | Internal | _copyTextSafe, add, remove, showCheckpointPanel, then, writeText |
| L472 · showCheckpointPanel | UI | forEach, replace, toLowerCase, trim |
| L481 · _isInfoOnly | Internal | esc, forEach, replace, toLowerCase, trim |
| L482 · esc | Internal | forEach, replace |
| L549 · closeCkptPanel | UI | remove |

## locus-sesiones.js
**Líneas:** 1439 · **Size:** high · **mod:** 12 · **Changed in:** —

**Exports:** _sessRelTsShared, _cscardRelTs, selectTrackerAI, _markTrackerDirty, render, avgBetweenSessions, _updateAutoDownloadLabel, _hoyMsUntilReset, _hoyCountdownLabel, _stopSidebarTicker

| Función | Área | Calls |
|---------|------|-------|
| L14 · _isInSession | Internal | _sessRelTsShared, fmt12, getCD, relDate |
| L18 · fmt12 | Internal | _sessRelTsShared, floor, getCD, now, relDate, slice |
| L19 · getCD | Utils | _sessRelTsShared, floor, now, relDate, slice, toISOString |
| L41 · _sessRelTsShared | Internal | _sessFixedTs, floor, getTime, now, relDate, slice |
| L68 · _sessFixedTs | Internal | _cscardRelTs, floor, getTime, now, toLocaleDateString, toLocaleTimeString |
| L88 · _cscardRelTs | Internal | Col2, _trackerRenderMiniHist, floor, now |
| L104 · _trackerRenderMiniHist | Internal | _getCurrentSession, activo, filter, getActiveProject, getAllSessions |
| L125 · currentSess | Internal | _getCurrentSession, activo, filter, getActiveProject, relDate, reverse |
| L171 · _localDateKey | Internal | _getCurrentSession, _sessGroup, forEach, getDate, getFullYear, getMonth |
| L182 · _sessGroup | Internal | _getCurrentSession, _localDateKey, filter, forEach, getProjectById, push |
| L198 · _inProgressSess | Internal | _getCurrentSession, _sessFixedTs, esc, filter, getProjectById, meta |
| L200 · _renderRow | Render | _sessFixedTs, esc, filter, getProjectById, meta |
| L221 · metaSep | Internal | _trackerMiniHistSelect, esc, filter, join, stopPropagation |
| L274 · _trackerMiniHistSelect | Internal | _getCurrentSession, _trackerSwitchCol, filter, forEach, getAllSessions, openDetail |
| L295 · _getCurrentSession | Internal | _buildCurrentSessionCard, _getCurrentCheckpoint, filter, find, findIndex, getAllSessions |
| L305 · ai | Internal | _buildCurrentSessionCard, _getCurrentCheckpoint, _getCurrentSession, filter, find, findIndex |
| L316 · _getCurrentCheckpoint | Internal | _buildCurrentSessionCard, _getCurrentSession, esc, filter, findIndex, getAllSessions |
| L318 · _buildCurrentSessionCard | Builder | _getCurrentSession, esc, filter, findIndex, getAllSessions, map |
| L336 · dateLabel | Internal | _trackerMiniHistSelect, esc, join, map, relDate, slice |
| L345 · refPills | Internal | _cscardRelTs, _trackerMiniHistSelect, esc, join, map, slice |
| L346 · t | Internal | _cscardRelTs, _trackerMiniHistSelect, esc, join, stopPropagation, toLowerCase |
| L388 · selectTrackerAI | Internal | _markTrackerDirty, add, closeLogCard, closePopup, remove, render |
| L436 · _renderTrackerSidebar | Render | _isInSession, filter, floor, getAISessions, getDate, getState |
| L443 · mkRow | Internal | esc, floor, getAISessions, getDate, map, max |
| L522 · _markTrackerDirty | Internal | _renderTrackerSidebar, add, contains, getState, remove, render |
| L525 · render | Render | _renderTrackerSidebar, add, contains, getActiveProject, getState, remove |
| L607 · _sortOrder | Internal | _isInSession, add, buildCard, closest, filter, find |
| L640 · csCard | Internal | Archivadas, _buildCurrentSessionCard, _initRadarSidebarState, add, buildCard, filter |
| L685 · buildHoyCard | Builder | _availableSinceLabel, avgBetweenSessions, filter, fmt12, getAISessions, getCD |
| L701 · _availableSinceLabel | Internal | fmt12, getHours, getMinutes, padStart |
| L721 · _availableSinceLabel | Internal | fmt12, getHours, getMinutes, padStart |
| L771 · quickBtn | Internal | _hoyMarkExhausted, _markTrackerDirty, esc, getAI, navigateToCard, openBlindExhaustMode |
| L788 · _hoyMarkExhausted | Internal | _isInSession, _markTrackerDirty, add, cancelBlindExhaustMode, focus, getAI |
| L800 · openBlindExhaustMode | UI | _isInSession, add, blindExhaustHoraInput, cancelBlindExhaustMode, focus, getAI |
| L814 · cancelBlindExhaustMode | Internal | add, blindExhaustHoraInput, blindExhaustHoraKey, confirmBlindExhaust, interpretHora, preventDefault |
| L827 · blindExhaustHoraInput | Internal | HHMM, blindExhaustHoraKey, cancelBlindExhaustMode, confirmBlindExhaust, getAI, interpretHora |
| L841 · blindExhaustHoraKey | Internal | HHMM, _markTrackerDirty, avgBetweenSessions, cancelBlindExhaustMode, confirmBlindExhaust, getAI |
| L846 · confirmBlindExhaust | Internal | HHMM, _markTrackerDirty, avgBetweenSessions, cancelBlindExhaustMode, filter, getAI |
| L868 · avgBetweenSessions | Internal | _isInSession, buildCard, dismissInterrupted, filter, floor, fmt12 |
| L884 · buildCard | Builder | _isInSession, countdown, dismissInterrupted, fmt12, getAISessions, getActiveTracker |
| L914 · _buildSessRow | Builder | entries, esc, filter, find, forEach, getState |
| L915 · tagDots | Internal | entries, esc, filter, find, forEach, getState |
| L928 · noHoraTag | Internal | esc, join, map, openDetail, relDate, slice |
| L929 · refPills | Internal | esc, join, map, openDetail, relDate, slice |
| L946 · extraCls | Internal | _buildSessRow, _buildSuggestionReason, esc, hero, join, map |
| L999 · _activeProjects | Internal | _buildUnlockLabel, _getActiveProjectFilter, _hoyMsUntilReset, esc, filter, floor |
| L1010 · _buildUnlockLabel | Builder | _hoyMsUntilReset, closest, floor, handleInput, handlePaste, padStart |
| L1190 · _trackerHistDragStart | Internal | _trackerHistAttachDropTargets, _trackerHistDragEnd, add, find, forEach, getAllSessions |
| L1202 · _trackerHistDragEnd | Internal | _trackerHistAttachDropTargets, add, find, forEach, getAllSessions, preventDefault |
| L1208 · _trackerHistAttachDropTargets | Internal | add, find, forEach, getAllSessions, preventDefault, relDate |
| L1250 · _trackerSwitchCol | Internal | _autoDownloadOn, _templateTrigger, _trackerInitMobileCol, add, forEach, remove |
| L1273 · _autoDownloadOn | Internal | _hoyMsUntilReset, _initAutoDlLabel, _saveUserPrefs, _templateTrigger, _updateAutoDownloadLabel, map |
| L1277 · toggleAutoDownload | UI | _hoyCountdownLabel, _hoyMsUntilReset, _initAutoDlLabel, _saveUserPrefs, _templateTrigger, _updateAutoDownloadLabel |
| L1284 · _updateAutoDownloadLabel | Internal | _hoyCountdownLabel, _hoyMsUntilReset, _initAutoDlLabel, _templateTrigger, floor, getDate |
| L1299 · _hoyMsUntilReset | Internal | _hoyCountdownLabel, _startSidebarTicker, _stopSidebarTicker, filter, floor, forEach |
| L1306 · _hoyCountdownLabel | Internal | _startSidebarTicker, _stopSidebarTicker, add, filter, floor, forEach |
| L1317 · _startSidebarTicker | Internal | _stopSidebarTicker, add, filter, floor, forEach, getDate |
| L1369 · _stopSidebarTicker | Internal | _trackerSwitchCol, closest, confirmInterruptInline, forEach, sesiones |

## locus-session-hora.js
**Líneas:** 283 · **Size:** low · **mod:** — · **Changed in:** —

**Exports:** _horaUpdate, interpretHora, fmt12, relDate, _showProjRequiredInPanel, confirmSave, _templateTrigger

| Función | Área | Calls |
|---------|------|-------|
| L11 · _horaUpdate | Internal | add, correctHora, footer, interpretHora, parseHora, remove |
| L33 · parseHora | Parser | _horaUpdate, correctHora, getDate, getTime, interpretHora, padStart |
| L40 · correctHora | Internal | _horaUpdate, fmt12, getDate, getTime, interpretHora, map |
| L47 · interpretHora | Internal | fmt12, getDate, getTime, map, padStart, setDate |
| L66 · fmt12 | Internal | floor, map, now, padStart, relDate, split |
| L77 · relDate | Internal | floor, match, now, replace, test, toLowerCase |
| L129 · horaKey | Internal | DOM, _showProjRequiredInPanel, confirmSave, esc, join, map |
| L142 · _showProjRequiredInPanel | Internal | DOM, esc, join, map |
| L152 · projects | Internal | add, cloneNode, esc, focusable, join, map |
| L230 · confirmSave | Internal | Card, Enter, _initTaGuardarShortcut, _taGuardarKeydown, cancelConfirmSave, contextos |
| L234 · cancelConfirmSave | Internal | Card, Enter, _initTaGuardarShortcut, _taGuardarKeydown, contextos, startsWith |
| L281 · _templateTrigger | Internal | getItem |

## locus-session-parse.js
**Líneas:** 1231 · **Size:** high · **mod:** 5 · **Changed in:** —

**Exports:** STATUS_LABELS, _setPhase, _normalizeSprint, parsePaste, _tryIngestPlan

| Función | Área | Calls |
|---------|------|-------|
| L46 · normStatus | Internal | buildTGPreview, filter, forEach, toLowerCase, trim, warn |
| L57 · buildTGPreview | Builder | esc, filter, find, forEach, getActiveTracker |
| L76 · existing | Internal | _levenshtein, deprecado, esc, find, from, getActiveTracker |
| L81 · noAcTag | Internal | _levenshtein, deprecado, esc, from, min, parsePaste |
| L101 · _levenshtein | Internal | _suggestCanonical, forEach, from, match, min, parseCheckpoint |
| L115 · _suggestCanonical | Internal | _levenshtein, forEach, isArray, match, parse, parseCheckpoint |
| L127 · parseCheckpoint | Parser | filter, isArray, match, parse, rawCounts, trim |
| L154 · _countByType | Internal | _typedLines, filter, join, map |
| L157 · _typedLines | Internal | _countByType, filter, join, map |
| L202 · extractField | Internal | RegExp, exec, extractAllLines, join, lookahead, match |
| L222 · extractAllLines | Internal | RegExp, exec, extractField, filter, join, push |
| L244 · _countParseable | Internal | Confirmar, Guardar, Pegar, filter, split, test |
| L274 · _setPhase | Internal | _normalizeSprint, find, forEach, getActiveSprints, removeAttribute, setAttribute |
| L292 · _normalizeSprint | Internal | _blogLog, find, getActiveSprints, includes, parseCheckpoint, parsePaste |
| L312 · parsePaste | Parser | includes, isArray, parseCheckpoint, puro, test |
| L755 · handlePaste | Events | _tryIngestPlan, browsers, completo, focus, getAI, includes |
| L762 · _doParse | Internal | _tryIngestPlan, focus, getAI, includes, parsePaste, trim |
| L792 · handleInput | Events | _tryIngestPlan, filter, getActiveProject, includes, legacy, loadPlan |
| L799 · _tryIngestPlan | Internal | completo, filter, getActiveProject, includes, legacy, loadPlan |
| L852 · parsePasteStandalone | Parser | _tryIngestPlan, getActiveProject, includes, test, trim |
| L1008 · _assignedIds | Internal | _assignPendingIds, buildTGPreview, esc, getActiveProject, includes, now |
| L1017 · saveStandaloneCheckpoint | Save / Load | _mergeBacklogWithProject, applyPatchesFromTG, getActiveProject, muestre, now, showToast |
| L1037 · _doApply | Internal | _mergeBacklogWithProject, _tryIngestPlan, applyPatchesFromTG, closeStandaloneCheckpoint, extractContextSections, extractHtmlMapSections |
| L1127 · parsePlanBlock | Parser | RegExp, _flushSess, match, push, replace, split |
| L1148 · _flushSess | Internal | _flushSprint, filter, map, match, push, replace |
| L1152 · _flushSprint | Internal | _flushSess, filter, map, match, push, replace |

## locus-session-popup.js
**Líneas:** 1368 · **Size:** high · **mod:** 6 · **Changed in:** —

**Exports:** openDetail, closePopup, _getAllSessionsChron, _rebuildLogBody, closeLogCard

| Función | Área | Calls |
|---------|------|-------|
| L20 · toggleStatus | UI | _findSessionByAI, _rebuildLogBody, getAI, getAISessions, openDetail, popup |
| L27 · toggleShowAll | UI | _findSessionByAI, esc, getAI, getAISessions, openDetail, popup |
| L29 · openDetail | UI | _findSessionByAI, esc, getAI, getAISessions, popup, visible |
| L45 · reviewBadge | Internal | esc, filter, getItem, join, map, visible |
| L116 · tgItems | Internal | esc, filter, find, getActiveTracker, getState, indexOf |
| L134 · tagHtml | Internal | esc, find, getItem, getState, indexOf, join |
| L182 · _previewProjects | Internal | esc, filter, getState, inline, join, map |
| L183 · _previewSessProjId | Internal | esc, getState, inline, join, map, some |
| L315 · closePopup | UI | _findSessionByAI, add, contains, forEach, openCompleteQuickSession, remove |
| L334 · openCompleteQuickSession | UI | _findSessionByAI, closePopup, focus, join, parsePaste, push |
| L364 · deleteCurrentSession | Internal | _findSession, _findSessionByAI, _rebuildLogBody, add, closeDeleteConfirm, closePopup |
| L372 · openDeleteConfirm | UI | _findSessionByAI, add, closeDeleteConfirm, getAISessions, remove, render |
| L376 · closeDeleteConfirm | UI | _findSessionByAI, getAISessions, remove, render, save, setItem |
| L380 · togglePopupMid | UI | _findSessionByAI, getAISessions, render, save, setItem, starCurrentSession |
| L389 · toggleInReview | UI | _findSession, _findSessionByAI, getAISessions, render, save, starCurrentSession |
| L401 · starSession | Internal | _findSession, _findSessionByAI, interpretHora, popParseHora, render, replace |
| L407 · starCurrentSession | Internal | _findSession, interpretHora, popParseHora, replace, showToast, starSession |
| L426 · popParseHora | Internal | _findSession, getAI, interpretHora, replace, saveResetFromPopup |
| L427 · raw | Internal | _findSession, getAI, interpretHora, replace, saveResetFromPopup |
| L440 · saveResetFromPopup | Save / Load | _findSession, _previewProjConfirmChange, closePopup, getAI, interpretHora, render |
| L442 · raw | Internal | _findSession, _previewProjConfirmChange, closePopup, getAI, getState, interpretHora |
| L468 · _previewProjConfirmChange | Internal | find, getState, savePreviewProject, showToastInline, some |
| L470 · prevProjId | Internal | find, getState, savePreviewProject, showToastInline, some |
| L479 · newProj | Internal | confirm, find, getState, savePreviewProject, showToastInline |
| L513 · savePreviewProject | Save / Load | esc, filter, find, findIndex, getState, interpretHora |
| L519 · idx | Internal | esc, filter, find, findIndex, interpretHora, popCorrectParseHora |
| L535 · popCorrectParseHora | Internal | HHMM, _findSession, closePopup, getAI, interpretHora, render |
| L536 · raw | Internal | HHMM, _findSession, closePopup, getAI, interpretHora, render |
| L549 · saveCorrectHoraFromPopup | Save / Load | HHMM, _findSession, closePopup, getAI, interpretHora, render |
| L551 · raw | Internal | HHMM, _findSession, closePopup, getAI, interpretHora, render |
| L569 · unlockNowFromPopup | Internal | closePopup, esc, find, forEach, getAI, render |
| L583 · renderBacklogRefs | Render | esc, find, forEach |
| L619 · refreshPopupRefs | Internal | _findSession, forEach, navigateToBacklogItem, onPopupRefSearch, renderBacklogRefs, unlinkBacklogItem |
| L627 · inputVal | Internal | _findSession, forEach, navigateToBacklogItem, onPopupRefSearch, renderBacklogRefs, toLowerCase |
| L646 · onPopupRefSearch | Events | _findSession, esc, filter, includes, map, slice |
| L671 · type | Internal | _findSession, esc, find, forEach, includes, join |
| L685 · linkBacklogItem | Internal | _findSession, filter, find, includes, now, push |
| L707 · unlinkBacklogItem | Internal | _findSession, filter, find, now, push, refreshPopupRefs |
| L727 · startPopupEdit | Internal | _findSession, add, contains, match, max |
| L769 · commit | Internal | cancel, getAI, openDetail, preventDefault, render, save |
| L781 · cancel | Internal | commit, focus, getAI, openDetail, preventDefault, replaceWith |
| L797 · startRename | Internal | blur, find, focus, getAI, getState, insensitive |
| L805 · commit | Internal | blur, cancel, editNotes, find, getAI, getState |
| L823 · cancel | Internal | blur, editNotes, esc, focus, getAI, preventDefault |
| L833 · editNotes | Internal | cancelNotes, esc, focus, getAI, saveNotes, setProperty |
| L861 · saveNotes | Save / Load | cancelNotes, checkNotesOverflow, editNotes, esc, getAI, renderNotesDisplay |
| L870 · cancelNotes | Internal | checkNotesOverflow, editNotes, esc, getAI, renderNotesDisplay, toggleNotes |
| L874 · renderNotesDisplay | Render | checkNotesOverflow, editNotes, esc, getAI, toggle, toggleNotes |
| L897 · checkNotesOverflow | Internal | _loadLogFilters, _saveLogFilters, getItem, parse, setItem, stringify |
| L910 · _saveLogFilters | Internal | _loadLogFilters, getItem, parse, setItem, stringify |
| L920 · _loadLogFilters | Internal | _getAllSessionsChron, find, forEach, getItem, getState, parse |
| L941 · _getAllSessionsChron | Internal | _logAIList, _sessType, _sessTypeLabel, find, forEach, getState |
| L945 · ai | Internal | _getAllSessionsChron, _logAIList, _sessType, _sessTypeLabel, find, forEach |
| L954 · _logAIList | Internal | _getAllSessionsChron, _sessType, _sessTypeLabel, _sessTypePill, forEach, has |
| L963 · _sessType | Internal | _buildLogHeader, _logAIList, _sessTypeLabel, _sessTypePill, card, getState |
| L969 · _sessTypeLabel | Internal | _buildLogHeader, _logAIList, _sessType, _sessTypePill, card, esc |
| L977 · _sessTypePill | Internal | _buildLogHeader, _logAIList, _sessType, card, esc, getState |
| L986 · _buildLogHeader | Builder | _logAIList, esc, getState, join, map |
| L988 · projList | Internal | esc, getState, join, map |
| L1038 · _buildLogRow | Builder | _sessRelTsShared, _sessTypePill, esc, join, map, slice |
| L1047 · refs | Internal | _sessRelTsShared, esc, join, map, slice |
| L1085 · _rebuildLogBody | Internal | _getActiveProjectFilter, _getAllSessionsChron, _sessType, filter, includes, toLowerCase |
| L1148 · filtersWarnClass | Internal | forEach, replace, setLogFilterAI, setLogFilterProj, setLogFilterType |
| L1219 · _logScrollTop | Internal | _rebuildLogBody, add, remove, requestAnimationFrame, scrollIntoView, scrollTo |
| L1224 · scrollToLogCard | Internal | _rebuildLogBody, add, closeLogCard, remove, requestAnimationFrame, scrollIntoView |
| L1249 · closeLogCard | UI | _rebuildLogBody, _saveLogFilters, add, remove, setLogFilterAI, setLogFilterProj |
| L1259 · setLogFilterAI | Utils | _rebuildLogBody, _saveLogFilters, clearLogFilters, setLogFilterProj, setLogFilterStarred, setLogFilterType |
| L1265 · setLogFilterType | Utils | _rebuildLogBody, _saveLogFilters, clearLogFilters, setLogFilterProj, setLogFilterStarred |
| L1271 · setLogFilterProj | Utils | _rebuildLogBody, _saveLogFilters, clearLogFilters, onLogSearch, setLogFilterStarred |
| L1277 · setLogFilterStarred | Utils | _loadLogFilters, _rebuildLogBody, _saveLogFilters, clearLogFilters, onLogSearch, render |
| L1284 · clearLogFilters | Internal | _loadLogFilters, _rebuildLogBody, _saveLogFilters, onLogSearch, render |
| L1295 · onLogSearch | Events | _loadLogFilters, _rebuildLogBody, closeLogCard, contains, render, secundario |
| L1356 · navigateToBacklogItem | Internal | add, escape, remove, scrollIntoView, switchSubTab, switchTab |

## locus-session-save.js
**Líneas:** 883 · **Size:** medium · **mod:** 4 · **Changed in:** —

**Exports:** downloadTemplates, buildBacklogMd, _checkStorageQuota, saveSession, _mergeBacklogWithProject, _doSaveSession

| Función | Área | Calls |
|---------|------|-------|
| L31 · toggleTemplateTrigger | UI | _buildNarrativeMemoryMd, _dlTemplatesCancel, _doDownloadTemplates, _getAllSessionsChron, downloadTemplates, filter |
| L41 · downloadTemplates | Save / Load | _buildNarrativeMemoryMd, _dlTemplatesCancel, _doDownloadTemplates, _getAllSessionsChron, filter, forEach |
| L45 · _dlTemplatesCancel | Internal | _buildNarrativeMemoryMd, _doDownloadTemplates, _getAllSessionsChron, filter, forEach, join |
| L50 · _buildNarrativeMemoryMd | Builder | _doDownloadTemplates, _generateBacklogMd, _getAllSessionsChron, filter, forEach, join |
| L72 · _doDownloadTemplates | Internal | Blob, _buildNarrativeMemoryMd, _docPrefix, _generateBacklogMd, _tplKey, click |
| L112 · _addChangelogEntry | Internal | _buildChangelogInner, add, getItem, match, now, openChangelog |
| L120 · versionMatch | Internal | _buildChangelogInner, add, getItem, map, match, now |
| L132 · openChangelog | UI | _buildChangelogInner, add, esc, getItem, join, map |
| L143 · _buildChangelogInner | Builder | _buildChangelogHTML, esc, getItem, join, map, parse |
| L169 · _buildChangelogHTML | Builder | _ai, _buildChangelogInner, _buildNarrativeMd, _hasContent, contenido, filter |
| L175 · _buildNarrativeMd | Builder | _ai, _hasContent, contenido, filter, getAI, getActiveProject |
| L178 · sessions | Internal | _ai, _hasContent, contenido, filter, getAI, isArray |
| L182 · _hasContent | Internal | _ai, buildContextMd, filter, getAI, join, map |
| L192 · _ai | Internal | _hasContent, buildContextMd, filter, find, getAI, getActiveSprints |
| L209 · buildContextMd | Builder | filter, find, forEach, getActiveProject, getActiveSprints, getActiveTracker |
| L228 · allProjects | Internal | ES6, Firestore, custom, find, forEach, isArray |
| L258 · itemCount | Internal | CONTEXT, Radar, _tplKey, activo, cambios, forEach |
| L276 · projDecisions | Internal | filter, forEach, isArray, localeCompare, replace, slice |
| L284 · fecha | Internal | filter, forEach, isArray, replace, slice |
| L285 · texto | Internal | filter, forEach, isArray, replace, slice |
| L286 · autor | Internal | filter, forEach, isArray, replace, slice |
| L303 · desc | Internal | _buildNarrativeMd, replace, slice |
| L366 · buildBacklogMd | Builder | _checkStorageQuota, _generateBacklogContent, _getLocalStorageUsage, disponible, getAI, guardado |
| L378 · _checkStorageQuota | Internal | _getLocalStorageUsage, add, bloque, find, focus, getAI |
| L388 · saveSession | Save / Load | add, bloque, find, focus, getAI, getActiveProject |
| L409 · horaRaw | Internal | CHECKPOINTs, _showProjRequiredInPanel, add, find, getActiveProject, interpretHora |
| L415 · activeProj | Internal | CHECKPOINTs, _doSaveSession, _showProjMismatchModal, _showProjRequiredInPanel, add, esc |
| L431 · _ckptProj | Internal | _doSaveSession, _showProjMismatchModal, add, esc, trim |
| L432 · _cardProjName | Internal | _doSaveSession, _showProjMismatchModal, add, esc, trim |
| L454 · _showProjMismatchModal | Internal | _buildPatchTgItems, add, cloneNode, forEach, isArray, map |
| L478 · _buildPatchTgItems | Builder | _mergeBacklogWithProject, anterior, assign, find, forEach, getItem |
| L480 · base | Internal | _mergeBacklogWithProject, anterior, assign, find, forEach, getItem |
| L500 · _mergeBacklogWithProject | Internal | _doSaveSession, bloque, find, getItem, loadBacklog, mergeBacklogFromTG |
| L524 · _doSaveSession | Internal | _findSession, bloque, filter, find, map, slice |
| L582 · _doCompleteFinish | Internal | _checkStorageQuota, _markBacklogListDirty, _markRadarDirty, _mergeBacklogWithProject, _rebuildLogBody, _setPhase |
| L648 · _allSessForGroup | Internal | _stopSessionTimer, filter, now, random, slice |
| L650 · _sessionGroupId | Internal | _stopSessionTimer, now, random, slice |
| L705 · _doApplyMergeAndFinish | Internal | MergeDiff, _mergeBacklogWithProject, find, forEach, match, now |
| L733 · raw | Internal | _mergeBacklogWithProject, _tryIngestPlan, applyPatchesFromTG, extractContextSections, extractHtmlMapSections, filter |
| L863 · _isInfoOnly | Internal | _doDownloadTemplates, _templateTrigger, showCheckpointPanel, showToast, toLowerCase, trim |

## locus-sprint-plan.js
**Líneas:** 493 · **Size:** low · **mod:** 5 · **Changed in:** —

**Exports:** _liveStatus, _sessIsDone, savePlan, loadPlan, renderPlanInto, renderPlan

| Función | Área | Calls |
|---------|------|-------|
| L14 · _getItemByCode | Internal | _liveStatus, _sessIsDone, _tplKey, every, forEach, getItem |
| L24 · _liveStatus | Internal | _getItemByCode, _sessIsDone, anteriores, every, nuevos |
| L30 · _sessIsDone | Internal | _getItemByCode, anteriores, every, nuevos |
| L61 · _planKey | Internal | _migratePlanKeys, includes, key, push, slice, startsWith |
| L66 · _migratePlanKeys | Internal | getItem, includes, key, push, setItem, slice |
| L130 · savePlan | Save / Load | _loadFromSupabase, _offlineQueuePush, _planKey, directo, from, getItem |
| L154 · loadPlan | Save / Load | _planKey, _planSavedAt, _planZoneDoneCollapsed, directo, getItem, isArray |
| L168 · _planSavedAt | Internal | _planKey, _planZoneDoneCollapsed, getItem, isArray, parse, setItem |
| L182 · _planZoneDoneCollapsed | Internal | getItem, legacy, parse, renderPlanInto, sesion, setAttribute |
| L191 · togglePlanZoneDone | UI | _buildPlanContent, _planZoneDoneCollapsed, legacy, renderPlan, renderPlanInto, sesion |
| L209 · renderPlanInto | Render | _buildPlanContent, getActiveProject, getItem, loadPlan, renderPlan |
| L215 · renderPlan | Render | _buildPlanContent, getActiveProject, getDate, getHours, getItem, getMinutes |
| L221 · _buildPlanContent | Builder | _planSavedAt, getActiveProject, getDate, getHours, getItem, getMinutes |
| L260 · backlog | Internal | _liveStatus, _tplKey, every, filter, forEach, getItem |
| L277 · _sessIsBlocked | Internal | _liveStatus, _liveTitle, _sessIsDone, every, filter, forEach |
| L278 · deps | Internal | _liveStatus, _liveTitle, _sessIsDone, every, filter, forEach |
| L287 · _connector | Internal | _liveStatus, _liveTitle, _sessIsDone, esc, filter, join |
| L295 · _sessCard | Internal | _liveStatus, _liveTitle, _sessIsDone, esc, filter, join |
| L299 · archivos | Internal | esc, filter, join, map, round |
| L300 · dependeDe | Internal | esc, filter, join, map, round |
| L306 · depsHtml | Internal | esc, filter, join, map, round |
| L351 · _activeSprintIds | Internal | _liveStatus, _sessIsBlocked, _sessIsDone, filter, flatMap, forEach |

## locus-sprint-project.js
**Líneas:** 1595 · **Size:** high · **mod:** 13 · **Changed in:** —

**Exports:** pad, _sprintNum, _docPrefix, exportBacklogMd, exportFullHistoryMd, _generateFullHistoryContent, _generateBacklogContent, _generateBacklogMd, _getActiveProjectFilter, _setActiveProjectFilter, _updateProjBreadcrumb, _updateProjFilterBtn, openProjPanel, closeProjPanel, _countProjSessions, selectProjectFilter, openProjModal, closeProjModal, getProjectById, getProjContext, setProjContext, _getLocalStorageUsage, exportContextMd

| Función | Área | Calls |
|---------|------|-------|
| L37 · pad | Internal | _buildCurrentStateMd, _docPrefix, _sprintNum, filter, forEach, getActiveProject |
| L38 · _sprintNum | Internal | _buildCurrentStateMd, _docPrefix, filter, forEach, getActiveProject, getState |
| L46 · _docPrefix | Internal | _buildCurrentStateMd, entries, filter, forEach, getActiveProject, getState |
| L58 · _buildCurrentStateMd | Builder | entries, filter, find, forEach, getState, join |
| L93 · _backlogVersion | Internal | _docPrefix, _effectiveVersion, _generateBacklogMd, _generateFullHistoryBySprintMd, _lastClosedSprint, _showExportConfirmModal |
| L101 · _lastClosedSprint | Internal | _backlogVersion, _docPrefix, _generateBacklogMd, _generateFullHistoryBySprintMd, _showExportConfirmModal, exportBacklogMd |
| L108 · exportBacklogMd | Save / Load | _backlogVersion, _docPrefix, _generateBacklogMd, _generateFullHistoryBySprintMd, _generateSprintsContent, _generateSprintsExportMd |
| L116 · exportFullHistoryMd | Save / Load | _backlogVersion, _docPrefix, _generateFullHistoryBySprintMd, _generateSprintsContent, _generateSprintsExportMd, _showExportConfirmModal |
| L128 · exportSprintsMd | Save / Load | _backlogVersion, _docPrefix, _generateSprintsContent, _generateSprintsExportMd, _showExportConfirmModal, filter |
| L136 · _generateSprintsContent | Internal | _docPrefix, filter, getActiveProject, getActiveSprints, getState, getTime |
| L147 · allSprints | Internal | filter, forEach, getTime, isArray, primero, reduce |
| L155 · _itemRow | Internal | filter, forEach, getDate, getFullYear, getMonth, getTime |
| L168 · _itemRowHeader | Internal | filter, forEach, getDate, getFullYear, getMonth, join |
| L203 · retroBlock | Internal | _itemRow, _itemRowHeader, filter, join, map, reduce |
| L271 · _generateSprintsExportMd | Internal | Blob, _docPrefix, _generateFullHistoryContent, _generateSprintsContent, click, createObjectURL |
| L292 · _generateFullHistoryContent | Internal | _docPrefix, _sprintNum, completos, effort, filter, getActiveProject |
| L312 · allSprints | Internal | _sprintNum, completos, effort, filter, getTime, isArray |
| L326 · _itemRow | Internal | filter, forEach, getDate, getFullYear, getMonth, getTime |
| L339 · _itemRowHeader | Internal | _itemRow, filter, forEach, getDate, getFullYear, getMonth |
| L371 · retroBlock | Internal | _itemRow, _itemRowHeader, filter, has, join, map |
| L426 · _generateFullHistoryBySprintMd | Internal | Blob, _docPrefix, _generateFullHistoryContent, _showExportConfirmModal, add, click |
| L440 · _showExportConfirmModal | Internal | _buildSprintActivoMd, add, cloneNode, find, getState, isArray |
| L465 · _buildSprintActivoMd | Builder | _generateBacklogContent, _tplKey, find, getActiveProject, getItem, getState |
| L467 · sprints | Internal | _generateBacklogContent, _tplKey, find, getActiveProject, getItem, getState |
| L489 · _generateBacklogContent | Internal | _lastClosedSprint, _tplKey, filter, filtro, find, getActiveProject |
| L509 · activeSprint | Internal | counters, filter, find, forEach, getActiveTracker, keys |
| L609 · _generateBacklogMd | Internal | Blob, _buildIndexLines, _docPrefix, _generateBacklogContent, _tplKey, click |
| L632 · _buildIndexLines | Builder | forEach, join, keys, legibilidad, localeCompare, map |
| L665 · _buildItemsMd | Builder | find, getState, includes, join, map, parse |
| L671 · _area | Internal | find, forEach, includes, join, parse, trim |
| L679 · _sprintObj | Internal | find, forEach, join, parse |
| L739 · active | Internal | _projListDragEndHandler, _projListDragLeaveHandler, _projListDragOverHandler, _projListDragStartHandler, _setActiveProjectFilter, archived |
| L755 · _projListDragStartHandler | Internal | _getActiveProjectFilter, _projListDragEndHandler, _projListDragLeaveHandler, _projListDragOverHandler, _projListDropHandler, _setActiveProjectFilter |
| L759 · _projListDragEndHandler | Internal | _getActiveProjectFilter, _projListDragLeaveHandler, _projListDragOverHandler, _projListDropHandler, _setActiveProjectFilter, _syncCleanProjectBtn |
| L763 · _projListDragOverHandler | Internal | _getActiveProjectFilter, _projListDragLeaveHandler, _projListDropHandler, _setActiveProjectFilter, _syncCleanProjectBtn, _updateHeaderProjectLabel |
| L767 · _projListDragLeaveHandler | Internal | _getActiveProjectFilter, _projListDropHandler, _setActiveProjectFilter, _syncCleanProjectBtn, _updateHeaderProjectLabel, _updateProjBreadcrumb |
| L771 · _projListDropHandler | Internal | _getActiveProjectFilter, _setActiveProjectFilter, _syncCleanProjectBtn, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn |
| L776 · _getActiveProjectFilter | Internal | _setActiveProjectFilter, _syncCleanProjectBtn, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn, esc |
| L780 · _setActiveProjectFilter | Internal | _getActiveProjectFilter, _syncCleanProjectBtn, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn, add |
| L789 · _updateProjBreadcrumb | Internal | _getActiveProjectFilter, _updateProjFilterBtn, add, clearProjectFilter, esc, getProjectById |
| L793 · _updateProjFilterBtn | Internal | _getActiveProjectFilter, _setActiveProjectFilter, add, clearProjectFilter, esc, getProjectById |
| L820 · clearProjectFilter | Internal | _renderTplProjBanner, _setActiveProjectFilter, add, closeProjPanel, getState, loadBacklog |
| L832 · openProjPanel | UI | _countProjSessions, _getActiveProjectFilter, add, closeProjPanel, filter, forEach |
| L840 · closeProjPanel | UI | _countProjSessions, _getActiveProjectFilter, esc, filter, forEach, getState |
| L847 · renderProjPanel | Render | _countProjSessions, _getActiveProjectFilter, esc, filter, forEach, getState |
| L852 · projects | Internal | _countProjSessions, _projPanelDelegate, closest, esc, filter, forEach |
| L895 · _countProjSessions | Internal | _renderTplProjBanner, _setActiveProjectFilter, closeProjPanel, getProjectById, getProjectSessions, loadBacklog |
| L899 · selectProjectFilter | Internal | _renderProjColorRow, _renderProjList, _renderTplProjBanner, _setActiveProjectFilter, closeProjPanel, getProjectById |
| L923 · openProjModal | UI | _renderProjColorRow, _renderProjList, getProjectById, indexOf |
| L958 · closeProjModal | UI | _colorRowDelegate, _renderProjColorRow, cancelProjForm, closest, join, map |
| L964 · cancelProjForm | Internal | _colorRowDelegate, _renderProjColorRow, closest, join, map, selectProjColor |
| L980 · _renderProjColorRow | Render | _colorRowDelegate, add, closest, confirmProjForm, getState, join |
| L992 · selectProjColor | Internal | _renderProjColorRow, add, confirmProjForm, getProjectById, getState, remove |
| L997 · confirmProjForm | Internal | _renderProjList, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn, add, closeProjModal |
| L999 · name | Internal | _renderProjList, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn, add, closeProjModal |
| L1005 · emoji | Internal | _renderProjList, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn, closeProjModal, getProjectById |
| L1006 · notes | Internal | _renderProjList, _updateHeaderProjectLabel, _updateProjBreadcrumb, _updateProjFilterBtn, closeProjModal, getProjectById |
| L1030 · prefix | Internal | _renderProjList, _toggleProjArchivedSection, _updateProjBreadcrumb, _updateProjFilterBtn, cancelProjForm, filter |
| L1042 · _toggleProjArchivedSection | Internal | _countProjSessions, _projRow, _renderProjList, esc, filter, getItem |
| L1049 · _renderProjList | Render | _countProjSessions, _projRow, esc, filter, getState |
| L1062 · _projRow | Internal | _countProjSessions, esc, getItem, join, map |
| L1100 · _projListClickDelegate | Internal | _toggleProjArchivedSection, closest, deleteProjConfirm, drop, editProjInline, getProjectById |
| L1126 · editProjInline | Internal | _getActiveProjectFilter, _renderProjColorRow, _setActiveProjectFilter, focus, getProjectById, indexOf |
| L1146 · toggleProjArchive | UI | _countProjSessions, _gconfirmOpen, _getActiveProjectFilter, _renderProjList, _setActiveProjectFilter, _updateProjBreadcrumb |
| L1161 · deleteProjConfirm | Internal | _countProjSessions, _gconfirmOpen, _getActiveProjectFilter, _renderProjList, _setActiveProjectFilter, _updateProjBreadcrumb |
| L1181 · projDragStart | Internal | add, findIndex, forEach, getState, preventDefault, projDragEnd |
| L1185 · projDragEnd | Internal | _renderProjList, add, findIndex, forEach, getState, helpers |
| L1190 · projDragOver | Internal | _renderProjList, add, find, findIndex, forEach, getProjectById |
| L1196 · projDragLeave | Internal | _renderProjList, filter, find, findIndex, getProjectById, getProjectsByAI |
| L1199 · projDrop | Internal | _renderProjList, filter, find, findIndex, getProjContext, getProjectById |
| L1215 · getProjectById | Utils | _notesKey, filter, find, getProjContext, getProjectsByAI, getState |
| L1220 · getProjectsByAI | Utils | _loadNotes, _notesKey, filter, getItem, getProjContext, getProjectById |
| L1226 · getProjContext | Utils | _loadNotes, _notesKey, _saveNotes, getItem, getProjectById, parse |
| L1230 · setProjContext | Utils | _loadNotes, _notesKey, _saveNotes, from, getItem, getProjectById |
| L1242 · _notesKey | Internal | _loadNotes, _noteId, _offlineQueuePush, _saveNotes, from, getItem |
| L1246 · _loadNotes | Internal | _noteId, _notesKey, _offlineQueuePush, _saveNotes, from, getItem |
| L1252 · _saveNotes | Internal | _getActiveProjectFilter, _loadNotes, _noteId, _notesKey, _offlineQueuePush, createNote |
| L1271 · _noteId | Internal | _getActiveProjectFilter, _loadNotes, _saveNotes, createNote, editNote, findIndex |
| L1276 · createNote | Internal | _getActiveProjectFilter, _loadNotes, _noteId, _saveNotes, editNote, findIndex |
| L1292 · editNote | Internal | _getActiveProjectFilter, _loadNotes, _saveNotes, deleteNote, filter, findIndex |
| L1310 · deleteNote | Internal | _filteredAIs, _getActiveProjectFilter, _loadNotes, _saveNotes, activo, filter |
| L1322 · getActiveProjectNotes | Utils | _filteredAIs, _getActiveProjectFilter, _loadNotes, activo, filter, getProjectById |
| L1328 · _filteredAIs | Internal | _getActiveProjectFilter, _sprintProjectUIInit, add, completos, filter, forEach |
| L1476 · _getLocalStorageUsage | Internal | getItem, init, toFixed, updateProgress |
| L1524 · _generateContextContent | Internal | Blob, _blogLog, _docPrefix, _effectiveVersion, _showExportConfirmModal, _tplKey |
| L1537 · exportContextMd | Save / Load | Blob, _blogLog, _generateContextContent, _showExportConfirmModal, click, createObjectURL |

## locus-sprint.js
**Líneas:** 799 · **Size:** medium · **mod:** 7 · **Changed in:** —

**Exports:** renderSprintTab

| Función | Área | Calls |
|---------|------|-------|
| L21 · _spEl | Internal | _isBlocked, _sprintDaysLabel, _sprintIsBlocked, _sprintItemHtml, _sprintReleaseClass, floor |
| L23 · _sprintDaysLabel | Internal | _isBlocked, _sprintIsBlocked, _sprintItemHtml, _sprintReleaseClass, floor, toLowerCase |
| L33 · _sprintReleaseClass | Internal | _isBlocked, _sprintIsBlocked, _sprintItemHtml, filter, hijos, toLowerCase |
| L41 · _sprintIsBlocked | Internal | _isBlocked, _sprintItemHtml, filter, hijos |
| L46 · _sprintItemHtml | Internal | _sprintIsBlocked, filter, hijos |
| L83 · _sptSwitch | Internal | _renderSprintItems, _renderSprintPlanificar, forEach, renderPlanInto, setAttribute, toggle |
| L87 · active | Internal | _renderSprintItems, _renderSprintPlanificar, charAt, filter, renderPlanInto, setAttribute |
| L101 · _renderSprintPlanificar | Render | _renderSprintItems, _spEl, _sprintIsBlocked, charAt, filter, join |
| L111 · _renderSprintItems | Render | _spEl, _sprintIsBlocked, charAt, filter, join, map |
| L181 · _renderSprintWorkers | Render | _spEl, add, filter, forEach, getAI, getAllSessions |
| L191 · sprintItemCodes | Internal | _renderSprintScopeAdded, _spEl, add, filter, forEach, getAI |
| L218 · _renderSprintScopeAdded | Render | _spEl, add, filter, map, startsWith, toLocaleDateString |
| L241 · typeKey | Internal | _spEl, contains, join, remove, renderSprintTab, toLocaleDateString |
| L258 · renderSprintTab | Render | _getActiveSprint, _spEl, _spmUpdateButtons, add, contains, remove |
| L262 · _cpOpen | Internal | _getActiveSprint, _spEl, _spmUpdateButtons, add, contains, remove |
| L353 · _spmIsCollapsed | Internal | _spmGetUnregisteredSprintId, _spmSetCollapsed, _spmToggle, contains, forEach, getActiveSprints |
| L357 · _spmSetCollapsed | Internal | _spmGetUnregisteredSprintId, _spmToggle, contains, forEach, getActiveSprints, has |
| L362 · _spmToggle | Internal | _spmGetUnregisteredSprintId, _spmSetCollapsed, contains, forEach, getActiveSprints, has |
| L375 · _spmGetUnregisteredSprintId | Internal | _getActiveSprint, _spmRegistrar, createSprint, forEach, getActiveSprints, has |
| L392 · _spmRegistrar | Internal | Error, _gconfirmOpen, _getActiveSprint, _spmGetUnregisteredSprintId, createSprint, renderSprintTab |
| L398 · doRegister | Internal | Error, _gconfirmOpen, createSprint, renderSprintTab, replace, setSprintStatus |
| L435 · _spmReactivar | Internal | _spmEditar, _spmRetro, openSprintRetroView, remove, renderSprintTab, setSprintStatus |
| L443 · _spmRetro | Internal | _spmEditar, editSprintInline, openSprintRetroView, remove, renderBacklogList |
| L450 · _spmEditar | Internal | _spmCancelEdit, editSprintInline, forEach, remove, renderBacklogList, stopImmediatePropagation |
| L487 · _spmCancelEdit | Internal | _spmActivarExistente, add, directamente, existente, filter, getActiveSprints |
| L502 · _spmActivarExistente | Internal | _spmPickerClose, _spmPickerOpen, filter, getActiveSprints, renderSprintTab, setSprintStatus |
| L524 · _spmPickerOpen | Internal | _spmPickerClose, add, join, map, setAttribute |
| L580 · _spmPickerSelect | Internal | _spmPickerClose, _spmPickerKey, focus, from, max, min |
| L587 · _spmPickerKey | Internal | _spmPickerClose, _spmPickerSelect, focus, from, max, min |
| L609 · _spmPickerClose | Internal | _spmGetUnregisteredSprintId, _spmUpdateButtons, getActiveSprints, map, remove, some |
| L623 · _spmUpdateButtons | Internal | _spmGetUnregisteredSprintId, add, getActiveSprints, map, remove, some |

## locus-storage.js
**Líneas:** 1504 · **Size:** high · **mod:** 6 · **Changed in:** —

**Exports:** _effectiveVersion, setSyncStatus, _shortcutsLoad, _shortcutsSave, _offlineQueuePush, getSupabaseUserId, save, saveImmediate, _blogLog, saveBacklog, saveContextDocs, _subscribeRealtime, _unsubscribeRealtime, _resetExpired, _loadFromSupabase, getState, _projKey, _tplKey, getAI, getActiveProject, getProjectSessions, getAllSessions, getActiveTracker, getActiveSprints, getLastAISession, getAISessions, _findSession, _findSessionByAI, _saveUserPrefs

| Función | Área | Calls |
|---------|------|-------|
| L24 · _getActiveProjectFilter | Internal | _exportBacklogMd, exportBacklogMd |
| L29 · exportBacklogMd | Save / Load | _exportBacklogMd |
| L68 · _effectiveVersion | Internal | OAuth, createClient, filter, getActiveSprints, sort, test |
| L81 · SUPABASE_URL | Internal | closeAuthModal, createClient, onAuthStateChange, setSyncStatus, split, test |
| L82 · SUPABASE_KEY | Internal | _loadFromSupabase, closeAuthModal, createClient, onAuthStateChange, setSyncStatus, split |
| L156 · setSyncStatus | Utils | add, handleSyncPillClick, openAuthModal, remove, signInWithSupabase, signOutSupabase |
| L171 · name | Internal | _saveUserPrefs, _shortcutsLoad, _shortcutsSave, add, getItem, handleSyncPillClick |
| L181 · handleSyncPillClick | Events | _loadTmpIdMap, _saveUserPrefs, _shortcutsLoad, _shortcutsSave, getItem, openAuthModal |
| L192 · _shortcutsLoad | Internal | _loadTmpIdMap, _saveUserPrefs, _shortcutsSave, forEach, getItem, keys |
| L199 · _shortcutsSave | Internal | _loadTmpIdMap, _saveTmpIdMap, _saveUserPrefs, forEach, from, getItem |
| L206 · _loadTmpIdMap | Internal | _offlineQueuePush, _saveTmpIdMap, forEach, from, getItem, keys |
| L222 · _saveTmpIdMap | Internal | _offlineQueuePush, _offlineQueueSave, from, getItem, parse, setItem |
| L242 · _offlineQueue | Internal | _offlineQueueFlush, _offlineQueuePush, _offlineQueueSave, findIndex, getItem, now |
| L247 · _offlineQueueSave | Internal | _offlineQueueFlush, _offlineQueuePush, findIndex, now, push, setItem |
| L252 · _offlineQueuePush | Internal | _offlineQueueFlush, _offlineQueueSave, _saveFlush, findIndex, now, push |
| L264 · _offlineQueueFlush | Internal | _offlineQueueSave, _saveFlush, from, getItem, parse, saveBacklog |
| L288 · payload | Internal | _saveSessions, find, from, getItem, parse, toISOString |
| L298 · proj | Internal | _saveSessions, find, from, getItem, parse, toISOString |
| L304 · map | Internal | _saveUserPrefs, from, getItem, parse, toISOString, upsert |
| L318 · notes | Internal | _offlineQueueSave, _saveUserPrefs, from, parse, push, setSyncStatus |
| L363 · _refreshMigrationBtnVisibility | Internal | add, open, popup, setSyncStatus, showToast, signInWithOAuth |
| L370 · signInWithSupabase | Internal | open, popup, setSyncStatus, showToast, signInWithOAuth, test |
| L409 · signOutSupabase | Internal | finally, focus, includes, saveImmediate, setSyncStatus, showToast |
| L420 · signInWithMagicLink | Internal | add, focus, includes, remove, setSyncStatus, showToast |
| L451 · getSupabaseUserId | Utils | _saveFlush, from, map, saveImmediate, setSyncStatus, toISOString |
| L463 · _saveFlush | Internal | _saveSessions, from, ignore, map, push, setSyncStatus |
| L543 · save | Save / Load | _markPulsoDotDirty, _markRadarDirty, _markStatusBarDirty, error, removeItem, renderGlobalRadarSidebar |
| L605 · saveImmediate | Save / Load | _offlineQueuePush, _saveFlush, _saveSessions, error, from, map |
| L612 · _saveSessions | Internal | _offlineQueuePush, error, from, map, slice, toISOString |
| L644 · _blogLog | Internal | _localStorageUsageRatio, _purgeStaleBacklogCache, _relTs, floor, getItem, now |
| L653 · _relTs | Internal | _getActiveProjectFilter, _localStorageUsageRatio, _purgeStaleBacklogCache, _tplKey, floor, getItem |
| L662 · saveBacklog | Save / Load | _getActiveProjectFilter, _localStorageUsageRatio, _purgeStaleBacklogCache, _tplKey, error, getItem |
| L673 · items | Internal | _getActiveProjectFilter, _tplKey, error, getItem, parse, removeItem |
| L758 · saveContextDocs | Save / Load | _getActiveProjectFilter, _tplKey, from, getItem, localStorage, setItem |
| L819 · _subscribeRealtime | Internal | _loadFromSupabase, _unsubscribeRealtime, channel, log, subscribe |
| L849 · _unsubscribeRealtime | Internal | _loadFromSupabase, _resetExpired, getTime, map, now, removeChannel |
| L859 · _resetExpired | Internal | _loadFromSupabase, getTime, main, map, now, resolve |
| L875 · _loadFromSupabase | Internal | _applyStateData, _resetExpired, forEach, from, main, maybeSingle |
| L987 · _itemsRef | Internal | _migrateItemTypes, _tplKey, forEach, fromEntries, getItem, getTime |
| L1011 · _applyDocIfNewer | Internal | _tplKey, applyFn, getItem, getTime, parse, setItem |
| L1015 · localMeta | Internal | _applyDocIfNewer, _tplKey, applyFn, getItem, getTime, parse |
| L1040 · localTs | Internal | getItem, getTime, isArray, max, parse, reduce |
| L1053 · localMap | Internal | getItem, getTime, isArray, max, parse, reduce |
| L1070 · localNotes | Internal | _updateAutoDownloadLabel, getItem, getTime, parse, setItem, stringify |
| L1083 · localTs | Internal | _updateAutoDownloadLabel, getItem, getTime, replace, setItem, stringify |
| L1113 · aiExists | Internal | _markTrackerDirty, getItem, getTime, render, renderHoy, setItem |
| L1164 · getState | Utils | _applyStateData, forEach, log, some |
| L1166 · _applyStateData | Internal | forEach, log, some |
| L1252 · clone | Internal | _applyStateData, _initApp, _resetExpired, error, forEach, getItem |
| L1262 · load | Save / Load | _applyStateData, _resetExpired, clone, error, forEach, getItem |
| L1286 · cached | Internal | _initApp, _renderAfterAuth, checkAuth, getItem, load, memoria |
| L1296 · _initApp | Internal | _markTrackerDirty, _renderAfterAuth, checkAuth, load, memoria, openAuthModal |
| L1301 · checkAuth | Internal | _markTrackerDirty, _renderAfterAuth, openAuthModal, render, then, updateTabNotifBadges |
| L1323 · _renderAfterAuth | Render | _getActiveProjectFilter, _loadFromSupabase, _markPulsoDotDirty, _markTrackerDirty, _projKey, _tplKey |
| L1341 · _projKey | Internal | _getActiveProjectFilter, _tplKey, activo, find, forEach, getAI |
| L1344 · _tplKey | Internal | _getActiveProjectFilter, activo, find, flatMap, forEach, getAI |
| L1349 · getAI | Utils | _getActiveProjectFilter, activo, filter, find, flatMap, forEach |
| L1352 · getActiveProject | Utils | _getActiveProjectFilter, filter, flatMap, forEach, getAllCheckpoints, getAllSessions |
| L1358 · getProjectSessions | Utils | activo, filter, find, flatMap, forEach, getActiveTracker |
| L1364 · getAllSessions | Utils | activo, filter, find, flatMap, forEach, getActiveProject |
| L1374 · getAllCheckpoints | Utils | activo, countAISessions, filter, find, getActiveProject, getActiveSprints |
| L1377 · getSessionsByAI | Utils | activo, countAICheckpoints, countAISessions, filter, find, getActiveProject |
| L1382 · getProjectForSession | Utils | _getActiveProjectFilter, activo, countAICheckpoints, countAISessions, filter, find |
| L1387 · getActiveTracker | Utils | _getActiveProjectFilter, activo, countAICheckpoints, countAISessions, filter, getActiveProject |
| L1395 · getActiveSprints | Utils | _getActiveProjectFilter, activo, countAICheckpoints, countAISessions, filter, getAICheckpoints |
| L1401 · countAISessions | Internal | _findSession, _getActiveProjectFilter, activo, countAICheckpoints, filter, find |
| L1405 · countAICheckpoints | Internal | _findCheckpoint, _findSession, _getActiveProjectFilter, activo, countAISessions, filter |
| L1408 · getLastAISession | Utils | _findCheckpoint, _findSession, _findSessionByAI, _getActiveProjectFilter, activo, filter |
| L1417 · getAISessions | Utils | _findCheckpoint, _findCheckpointByAI, _findSession, _findSessionByAI, _getActiveProjectFilter, filter |
| L1423 · getAICheckpoints | Utils | PREFS, _findCheckpoint, _findCheckpointByAI, _findSession, _findSessionByAI, _saveUserPrefs |
| L1426 · _findSession | Internal | PREFS, _findCheckpoint, _findCheckpointByAI, _findSessionByAI, _saveUserPrefs, _shortcutsLoad |
| L1428 · sess | Internal | PREFS, _findCheckpoint, _findCheckpointByAI, _findSession, _findSessionByAI, _saveUserPrefs |
| L1434 · _findCheckpoint | Internal | PREFS, _findCheckpointByAI, _findSession, _findSessionByAI, _saveUserPrefs, _shortcutsLoad |
| L1437 · _findSessionByAI | Internal | PREFS, _findCheckpointByAI, _offlineQueuePush, _saveUserPrefs, _shortcutsLoad, find |
| L1439 · sess | Internal | PREFS, _findCheckpointByAI, _findSessionByAI, _offlineQueuePush, _saveUserPrefs, _shortcutsLoad |
| L1445 · _findCheckpointByAI | Internal | PREFS, _findSessionByAI, _offlineQueuePush, _saveFlush, _saveUserPrefs, _shortcutsLoad |
| L1449 · _saveUserPrefs | Internal | _initStorageListeners, _offlineQueuePush, _saveFlush, _shortcutsLoad, from, getItem |
| L1478 · _initStorageListeners | Internal | closeAuthModal, signInWithMagicLink, signInWithSupabase |

## locus-toast.js
**Líneas:** 287 · **Size:** low · **mod:** — · **Changed in:** —

**Exports:** _toastVisibleCount, _toastRender, showToast, _dismissToast, _toastNext, showToastDigest, toast, showToastInline

| Función | Área | Calls |
|---------|------|-------|
| L20 · _toastDuration | Internal | _toastRender, _toastVisibleCount, filter, from, min, replace |
| L24 · len | Internal | _isHtml, _toastRender, _toastVisibleCount, esc, filter, from |
| L35 · _toastVisibleCount | Internal | _isHtml, _toastRender, esc, filter, from, setAttribute |
| L41 · _toastRender | Internal | _dismissToast, _isHtml, esc, setAttribute, stopPropagation, test |
| L120 · _touchResume | Internal | _dismissToast, _toastDuration, firma, manual, now, preventDefault |
| L145 · showToast | UI | _dismissToast, _toastDuration, _toastNext, _toastRender, _toastVisibleCount, add |
| L163 · _dismissToast | Internal | _toastNext, _toastRender, _toastVisibleCount, add, queue, remove |
| L175 · _toastNext | Internal | _toastRender, _toastVisibleCount, isArray, shift, showToast, showToastDigest |
| L183 · showToastDigest | UI | global, isArray, showToast, showToastInline, toast |
| L195 · toast | Internal | getBoundingClientRect, getComputedStyle, global, isArray, remove, setProperty |
| L198 · showToastInline | UI | getBoundingClientRect, getComputedStyle, global, isArray, remove, setAttribute |
| L230 · _hideInline | Internal | add, forEach, remove, stopPropagation |
| L260 · _outsideHandler | Internal | _hideInline, add, contains, getBoundingClientRect |

## locus-ui-shell.js
**Líneas:** 1300 · **Size:** high · **mod:** 6 · **Changed in:** —

**Exports:** esc, switchTab, switchSubTab, toggleTheme, applyTheme, onSearchDispatch, onSearch, renderSetupChecklist, _escCascade, restoreDefaultShortcuts, openShortcuts, closeShortcuts, openShortcutsRef

| Función | Área | Calls |
|---------|------|-------|
| L41 · esc | Internal | confirm, focus, getItem, replace, switchTab |
| L58 · switchTab | Internal | add, closeItemPanel, closePopup, confirm, contains, focus |
| L134 · switchSubTab | Internal | _renderDocsOnboarding, _renderTplProjBanner, _updateSubTabButtons, forEach, loadBacklog, renderAIStatusBar |
| L163 · toggleTheme | UI | Search, applyTheme, dispatch, getState, onSearch, onSearchDispatch |
| L170 · applyTheme | Internal | Search, _toggleSearchScope, dispatch, onSearch, onSearchDispatch, remove |
| L182 · onSearchDispatch | Events | Search, _toggleSearchScope, getState, onSearch, remove, toLowerCase |
| L199 · _toggleSearchScope | Internal | _getActiveProjectFilter, getState, hlText, onSearch, remove, render |
| L206 · onSearch | Events | RegExp, _esc, _getActiveProjectFilter, getState, hlText, remove |
| L208 · q | Internal | RegExp, _esc, _getActiveProjectFilter, coincidentes, filter, hlText |
| L222 · _activeProjId | Internal | RegExp, _esc, _getActiveProjectFilter, coincidentes, filter, forEach |
| L228 · hlText | Internal | RegExp, _esc, coincidentes, filter, find, forEach |
| L237 · aiMatches | Internal | filter, find, forEach, includes, push, slice |
| L254 · t | Internal | filter, find, includes, push, slice, some |
| L258 · ai | Internal | filter, find, includes, push, slice, some |
| L269 · noteMatches | Internal | delegation, filter, includes, map, searchContratos, some |
| L270 · textHit | Internal | delegation, filter, includes, map, searchContratos, some |
| L277 · backlogMatches | Internal | delegation, filter, forEach, includes, join, map |
| L279 · titleHit | Internal | delegation, filter, forEach, includes, join, map |
| L280 · codeHit | Internal | delegation, filter, forEach, includes, join, map |
| L281 · acHit | Internal | delegation, filter, forEach, includes, join, map |
| L286 · projMatches | Internal | delegation, filter, forEach, includes, join, map |
| L295 · contratoMatches | Internal | delegation, forEach, grid, includes, join, map |
| L321 · notesMatch | Internal | filter, forEach, getAISessions, has, includes, map |
| L374 · dateLabel | Internal | Notas, forEach, hlText, relDate, slice |
| L397 · dateLabel | Internal | Contratos, _esc, forEach, hlText, relDate, slice |
| L440 · typeChar | Internal | Proyectos, _esc, charAt, forEach, hlText |
| L463 · sessCount | Internal | Contexto, _esc, find, forEach, hlText, includes |
| L517 · _scbDismissed | Internal | _scbDismiss, _scbStep, add, contains, getItem, remove |
| L521 · _scbDismiss | Internal | _scbDismissed, _scbStep, add, contains, getState, remove |
| L531 · _scbStep | Internal | _scbDismissed, add, contains, getAllSessions, getState, remove |
| L543 · renderSetupChecklist | Render | _scbDismissed, _scbStep, add, getAllSessions, getState, remove |
| L549 · workerDone | Internal | _scbStep, add, getAllSessions, remove |
| L550 · projectDone | Internal | _scbStep, add, contains, getAllSessions, remove |
| L551 · itemDone | Internal | _scbCollapse, _scbStep, add, contains, getAllSessions, remove |
| L592 · _scbExpand | Internal | _saveUserPrefs, _scbCollapse, _scbOnStepComplete, _scbStepAction, add, contains |
| L602 · _scbCollapse | Internal | _saveUserPrefs, _scbOnStepComplete, _scbStepAction, contains, openAddAI, openProjModal |
| L610 · _scbOnStepComplete | Internal | _escCascade, _saveUserPrefs, _scbCollapse, _scbStepAction, closeShortcutsRef, contains |
| L621 · _scbStepAction | Internal | _escCascade, _itemVizClose, closeCommandPalette, closeItemEditor, closeItemPanel, closePendPanel |
| L634 · _escCascade | Internal | _itemVizClose, check, closeCommandPalette, closeItemEditor, closeItemPanel, closePendPanel |
| L912 · _shortcutKey | Internal | _shortcutConflict, _shortcutsLoad, _shortcutsRender, find, forEach, push |
| L920 · _shortcutConflict | Internal | _shortcutsLoad, _shortcutsRender, entries, fijos, forEach, map |
| L931 · _shortcutsRender | Internal | _shortcutsLoad, entries, fijos, forEach, map, push |
| L977 · _shortcutsStartEdit | Internal | _shortcutsCaptureKey, _shortcutsLoad, _shortcutsSaveEdit, find, focus, select |
| L1012 · _shortcutsCaptureKey | Internal | _shortcutConflict, _shortcutsRender, _shortcutsSaveEdit, find, letra, manualmente |
| L1023 · _shortcutsSaveEdit | Internal | _shortcutConflict, _shortcutsLoad, _shortcutsRender, _shortcutsSave, find, letra |
| L1055 · _shortcutsResetOne | Internal | _focusFirstInteractive, _saveUserPrefs, _shortcutsLoad, _shortcutsRender, _shortcutsSave, add |
| L1062 · restoreDefaultShortcuts | Internal | _focusFirstInteractive, _saveUserPrefs, _shortcutKey, _shortcutsRender, _sk, add |
| L1068 · openShortcuts | UI | _focusFirstInteractive, _shortcutKey, _shortcutsRender, _sk, add, btn |
| L1077 · closeShortcuts | UI | _shortcutKey, _sk, add, btn, closeShortcutsRef, forEach |
| L1084 · openShortcutsRef | UI | _shortcutKey, _sk, btn, closeShortcuts, closeShortcutsRef, forEach |
| L1085 · closeShortcutsRef | UI | _shortcutKey, _sk, btn, closeShortcuts, forEach, replace |
| L1088 · _sk | Internal | _shortcutKey, btn, forEach, replace, switchSubTab, switchTab |

## locus-workers.js
**Líneas:** 361 · **Size:** low · **mod:** 5 · **Changed in:** —

**Exports:** openAvatarModal, selectAvatarOption, confirmAvatarModal, closeAvatarModal, openAddAI, confirmAddAI, confirmClear, deleteAI, toggleCardMenu, closeCardMenu, archiveAI, toggleArchivedSection, showInlineConfirm, closeInlineConfirm, executeConfirm

| Función | Área | Calls |
|---------|------|-------|
| L40 · openAvatarModal | UI | _saveModalTrigger, add, confirmAvatarModal, entries, find, forEach |
| L61 · selectAvatarOption | Internal | _restoreModalFocus, add, closeAvatarModal, confirmAvatarModal, forEach, getAI |
| L68 · confirmAvatarModal | Internal | _restoreModalFocus, _saveModalTrigger, add, closeAvatarModal, getAI, openAddAI |
| L83 · closeAvatarModal | UI | _restoreModalFocus, _saveModalTrigger, add, confirmAddAI, find, focus |
| L91 · openAddAI | UI | _saveModalTrigger, add, closeModal, confirmAddAI, find, focus |
| L101 · confirmAddAI | Internal | closeModal, confirmClear, find, focus, getAI, getAISessions |
| L126 · confirmClear | Internal | auto, deleteAI, filter, getAI, getAISessions, render |
| L133 · deleteAI | Internal | _closeCardMenuPortal, abierto, auto, contains, filter, forEach |
| L137 · hasSessionsInProjects | Internal | _closeCardMenuPortal, abierto, auto, contains, filter, forEach |
| L153 · toggleCardMenu | UI | CSS, _closeCardMenuPortal, abierto, add, contains, forEach |
| L197 · _cardMenuScrollCleanup | Internal | _closeCardMenuPortal, closeCardMenu, focus, remove |
| L205 · _closeCardMenuPortal | Internal | _cardMenuScrollCleanup, closeCardMenu, closest, focus, forEach, remove |
| L225 · closeCardMenu | UI | _closeCardMenuPortal, archiveAI, closest, forEach, getAI, render |
| L248 · archiveAI | Internal | closeInlineConfirm, closest, executeConfirm, forEach, getAI, remove |
| L256 · toggleArchivedSection | UI | closeInlineConfirm, closest, esc, executeConfirm, forEach, remove |
| L265 · showInlineConfirm | UI | closeInlineConfirm, closest, esc, executeConfirm, forEach, remove |
| L287 · closeInlineConfirm | UI | executeConfirm, filter, forEach, getAI, option, remove |
| L292 · executeConfirm | Internal | closeInlineConfirm, filter, forEach, getAI, option, render |

## locus-analytics.css
**Líneas:** 3748 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-analytics.css |
| L3 | Versión: 2.0 | Selectores consolidados — T2 |
| L5 | === locus-analytics-render.js === |
| L8 | === locus-analytics-charts.js === |
| L11 | === locus-analytics-core.js === |
| L14 | === locus-backlog-sprints.js === |
| L17 | ══ TAB-ANALYTICS ══ |
| L19 | locus-analytics.css |
| L21 | Versión: 1.0 | Última actualización: 2026-05-11 | Analytics V2, KPIs, heatmap, forecast, patrones productividad, sprint health, sprint roadmap |
| L23 | ══ TAB-ANALYTICS ══ |
| L97 | Tooltip SVG premium (AC3) |
| L180 | legacy compat — keep old classes non-breaking |
| L193 | T-047: Range toggle |
| L444 | T-043 Ranking |
| L445 | T-044 Racha |
| L514 | T-046 Export btn |
| L532 | T-042: Heatmap |
| L593 | legítimo: JS setea opacity inline por nivel de actividad — :hover override necesita !important */ transform: scale(1.25); |
| L653 | T-045: Histograma por hora |
| L698 | T-051: progreso por versión |
| L737 | T-202604-048: R→T children block |
| L822 | B-006: Campo hora de reset en popup |
| L850 | T-077: Botón proyectos en header |
| L883 | T-077: Panel lateral de proyectos |
| L1033 | T-086: Barra de estado sobre el grid |
| L1070 | T-097: botón colapsar/expandir todo |
| L1083 | T-202604-181: info chips en status bar |
| L1118 | T-085: Feedback visual en card al guardar sesión |
| L1141 | T-085: cardFlash reemplazado por cardFlashPremium en FASE 2 |
| L1143 | ══ FASE 2 — PREMIUM CARD SYSTEM ══ |
| L1145 | Card base upgrade |
| L1150 | ─ card-header-premium: layout row ─ |
| L1159 | ─ Avatar col ─ |
| L1216 | Pulse ring — only on available |
| L1247 | ─ Identity block ─ |

## locus-archive.css
**Líneas:** 435 · **Size:** low · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-archive.css |
| L6 | === locus-backlog-archive.js === |
| L9 | ══════════════════════════════════════════════════════════════════════ |
| L15 | ── badge-status-historico ─────────────────────────────────────────── |
| L17 | B-202605-229: clase emitida por statusClass('historico') + statusLabel |
| L31 | ── Contenedor principal ───────────────────────────────────────────── |
| L33 | ── Header ─────────────────────────────────────────────────────────── |
| L100 | ── View tabs (Por sprint / Lista plana) ────────────────────────────── |
| L141 | ── Body ────────────────────────────────────────────────────────────── |
| L152 | ── Views ───────────────────────────────────────────────────────────── |
| L162 | ── View: Por sprint — accordion ───────────────────────────────────── |
| L247 | ── Empty state ─────────────────────────────────────────────────────── |
| L257 | ── Read-only treatment ─────────────────────────────────────────────── |
| L259 | Escopado a #arch-historico-body — buildBacklogItem sin modificación. |
| L270 | Drag handle — sin sentido en archivo |
| L275 | Selects (status, rol, sprint, R padre) — no mutables |
| L283 | Effort dots — apagados, no interactivos |
| L295 | Priority badge — dato legible, no clickeable |
| L300 | Botones de acción — ocultos en archivo |
| L308 | Activity dot — sin sentido en archivo |
| L313 | Inline edit title — desactivado |
| L318 | ── R-202605-124: effort entregado en header de sprint ─────────────── |
| L333 | ── R-202605-124: bloque legado pre-S-23 ───────────────────────────── |
| L346 | ── R-202605-124: lista compacta de ítems en el Archivo Histórico ──── |
| L435 | ══ FIN HISTÓRICO UNIFICADO ══════════════════════════════════════════ |

## locus-backlog-item.css
**Líneas:** 3608 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-backlog-item.css |
| L2 | Última actualización: 2026-05-24 | Proyecto: Locus | Scope: IDP · Merge Diff · CSS Purity backlog |
| L4 | === locus-backlog-item.js === |
| L7 | ═══ T-202604-165: buildBacklogItem() premium ═══ |
| L9 | Type block — elemento dominante |
| L74 | Item container override |
| L80 | Header layout |
| L94 | Title column |
| L136 | Subline |
| L192 | Collapse arrow |
| L202 | Header right |
| L262 | Effort dots header |
| L305 | Body |
| L327 | Meta grid |
| L387 | Effort small display inside meta |
| L434 | R-202605-024: Motivo de descarte — sección editable en IDP |
| L556 | END R-202605-024 |
| L558 | AC block |
| L638 | Missing fields |
| L646 | Footer |
| L670 | === locus-backlog-item.js === |
| L673 | ══ T-202604-202: View mode pills — Cards / Proyecto ══ |
| L706 | ══ END T-202604-202 ══ |
| L709 | === locus-backlog-panel.js === |
| L712 | ═══ R-202604-015: Item Detail Panel — two-column backlog layout ═══ |
| L714 | Wrapper que contiene backlog-list + panel |
| L723 | La lista se estrecha cuando el panel está abierto |
| L730 | Item Detail Panel |
| L760 | Header |
| L838 | Meta pills |
| L863 | Sections |
| L894 | Notes |
| L924 | Sessions |
| L983 | T-202604-415: AC siempre visible, posición protagonista |
| L1035 | Timeline |

## locus-backlog.css
**Líneas:** 5509 · **Size:** high · **mod:** 3 · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | [PP] v1.2.3 · sprint:PP-S-09 · mod:3 · autor:Rune · 2026-05-28 UTC-6 |
| L2 | locus-backlog.css |
| L4 | Versión: 2.3 | Última actualización: 2026-05-25 | Backlog items, toolbar, filter strip, sprint bar, kanban, planificación, ideas, empty states |
| L6 | T-202604-059: sección descartados en backlog |
| L38 | T-202604-055: backlog log |
| L39 | Confirmación retroceso/descarte |
| L161 | Inline confirm |
| L187 | .btn-danger — consolidado en locus-overrides.css §2B |
| L189 | === locus-backlog-core.js === |
| L192 | === locus-backlog-render.js === |
| L195 | === locus-backlog-item.js === |
| L198 | ══ TAB-BACKLOG ══ |
| L206 | B-1007: Analytics tab padding — consistente con otros tabs |
| L208 | T-202605-477: max-width ultrawide — tab proyectos |
| L233 | ══ TAB-BACKLOG — Stats, toolbar, items, versiones ══ |
| L293 | Nivel 1: progress — prominente, full width |
| L331 | T-202604-358: descartados — discreto en card de avance |
| L370 | Nivel 2: chips de tipo — accionables, compactos |
| L429 | B-202604-146: chip explícito de reset "✕ Todos" — aparece solo cuando hay filtro parcial |
| L443 | Cuando todos están activos = estado neutro "sin filtro": chips al 65% de opacidad, |
| L474 | Label indicando estado neutro |
| L551 | Nivel 3: prioridad + esfuerzo — compacto, horizontal, una sola fila |
| L620 | T-202604-357: active state — mismo patrón que tipo y esfuerzo |
| L632 | Esfuerzo: mini-stat-cards |
| L671 | T-202604-065: filter-sort-bar consolidated |
| L978 | T-sprints: sprint activo y acciones |
| L1000 | T-202604-004: ítems dentro de sprint activo — diferenciación visual |
| L1010 | P-202604-098: historial sprints cerrados |
| L1111 | R-202605-007: .sprint-actions · .sprint-action-btn y familia eliminados — header solo lectura |
| L1123 | border-left por tipo |
| L1184 | segunda línea colapsada |
| L1374 | T-202605-040: en-revision — reutiliza variables de en-curso/en-progreso |
| L1393 | T-202604-050: campos obligatorios effort/area/ac |
| L1466 | R-202605-178: modificador — margen superior para empty states dentro de contenedores con scroll |
| L1554 | T-202604-058: barra de progreso global del backlog |

## locus-base.css
**Líneas:** 484 · **Size:** low · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-base.css |
| L4 | === visual-only — sin módulo JS propietario === |
| L6 | Versión: 1.5 | Última actualización: 2026-05-22 | Variables, reset, temas dark/light, tipografía global |
| L7 | Cluster A — tokens fantasma resueltos: --purple/*-dim/*-border, --blue-dim/border declarados; |
| L13 | ══ VARIABLES ══ |
| L15 | ── Tipografía ── |
| L20 | ── Escala tipográfica ── |
| L32 | ── Escala display — stat numbers, headings de sección ── |
| L39 | ── Espaciado / Radios ── |
| L52 | ── Aliases de radio — retrocompatibilidad ── |
| L59 | ── Transiciones premium ── |
| L71 | ── R-202605-179: token canónico de microinteracciones ── |
| L74 | ── Aliases de fuente — retrocompatibilidad ── |
| L80 | ── Escala de z-index ── |
| L113 | ── Breakpoints responsive ── |
| L118 | ── Layout global ── |
| L119 | .header-inner: 52px + border-bottom 1px = 53px total |
| L122 | ── A3: Tokens de espaciado — independientes de tema ── |
| L128 | ══════════════════════════════════════════════════════════ |
| L136 | ── DARK THEME OVERRIDE ── |
| L163 | ── Estado insession (púrpura) — Cluster A ── |
| L168 | ── T-202605-033: Tokens de color nuevos ── |
| L178 | severity colors |
| L203 | ── Variables de uso extendido ── |
| L211 | ── Aliases Cluster A — tokens fantasma mapeados a canónicos ── |
| L219 | ── Aliases --color-* para componentes migrados ── |
| L233 | ── A3: Tokens semánticos sin declarar — resueltos ── |
| L234 | Acento |
| L242 | Semánticos de estado |
| L257 | Fondos semánticos |
| L267 | Superficies alias |
| L274 | Bordes alias |
| L280 | Numérico raw |
| L284 | ── LIGHT THEME OVERRIDE ── |
| L311 | ── Estado insession (púrpura) — Cluster A ── |

## locus-docs.css
**Líneas:** 656 · **Size:** medium · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-docs.css |
| L2 | Versión: 1.0 | Última actualización: 2026-05-25 | Estilos HTML-MAP y Context — extraídos de locus-backlog.css (T-202605-112) |
| L4 | === locus-map-viewer.js === |
| L7 | === locus-docs.js === |
| L10 | T-202604-048: HTML-MAP view |
| L161 | ── Module.Map — árbol modular ── |
| L233 | R-202604-046: individual pills idle when 'Todos' is active — subtle deemphasis |
| L243 | B-202604-140: light theme — pill Todos.active fill perceptible sobre --bg blanco |
| L493 | T-202604-048: Context placeholder |
| L517 | T-202604-102: Context vivo |
| L531 | T-202604-108: Context navegable por secciones |
| L543 | T-202604-108: badge modificado en sub-tab |
| L561 | T-202604-108: alerta conflicto context |
| L580 | ── Variantes de tipo hmfilter-pill (extraídas de R-202604-046) ── |
| L589 | Pills por tipo de archivo — color de borde en estado no-seleccionado para identificación |
| L627 | ══ END R-202604-046 ══ |
| L629 | ── mm-bar: barra de progreso de módulo ── |
| L651 | ── prefers-reduced-motion: pulse-dot ── |

## locus-document-generator.css
**Líneas:** 872 · **Size:** medium · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-document-generator.css |
| L2 | Versión: 1.0 | Última actualización: 2026-05-24 18:00 UTC-6 | Estilos del Document Generator (map generator overlay) — extraído de locus-proyectos.css (R-202605-036) |
| L4 | ══ MAP GENERATOR OVERLAY — R-202605-102 ══ |
| L50 | ── Header ── |
| L74 | Badge de paso en header |
| L116 | ── Stepper ── |
| L187 | ── Body ── |
| L381 | ── Dropzone ── |
| L442 | ── File list ── |
| L457 | JS inyecta .mg-file-item |
| L514 | ── Preview area ── |
| L535 | ── Ritual hint ── |
| L562 | ── Footer ── |
| L574 | ── Generate button + hint ── |
| L611 | ── Filename preview ── |
| L622 | ── B-202605-071: Warning sprint sin cerrar — no bloqueante ── |
| L689 | END MAP GENERATOR OVERLAY — R-202605-102 |
| L692 | ══ R-202605-146: Export strip — sección fija al pie del Document Generator ══ |
| L748 | ══ END R-202605-146 ══ |
| L751 | mg-body-lock — overflow:hidden en body al abrir overlay del map generator (locus-map-generator.js) |
| L756 | mg-status-preview — elemento base de status en map generator (locus-map-generator.js) |
| L771 | mg-status-closing — modificador de color en status preview (locus-map-generator.js) |
| L779 | ══ T-202604-412: Document Generator — selectores auxiliares ══ |
| L780 | Migrado desde locus-backlog-item.css — T-202605-086 |
| L869 | ══ END T-202604-412: Document Generator — selectores auxiliares ══ *//* === locus-map-generator.js === |

## locus-layout.css
**Líneas:** 2377 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-layout.css |
| L3 | Versión: 2.1 | Última actualización: 2026-05-22 | Selectores compartidos consolidados — T-202605-031 |
| L5 | shared — fuente canónica: locus-layout.css |
| L8 | ══ SHARED — Reset, body, header, tabs, botones, toast, search ══ |
| L10 | locus-layout.css |
| L12 | Versión: 1.0 | Última actualización: 2026-05-12 | Header, tabs, search, sync, botones compartidos, scroll progress, breadcrumb, responsive |
| L14 | ══ SHARED — Reset, body, header, tabs, botones, toast, search ══ |
| L21 | Header shared |
| L84 | R [pendiente-ID]: grillo ocupa exactamente el alto del header — height 100% de .header-inner (52px), overflow:hidden en header lo contiene |
| L100 | Splash screen Pepe |
| L248 | Header actions |
| L256 | === locus-command-palette.js === |
| L259 | R-202605-014: hdr-search-trigger — trigger permanente de Command Palette |
| L316 | R-202605-006: Pill ⌘K — Command Palette trigger |
| L389 | [pendiente-ID]: theme toggle — regla base completada |
| L411 | T-202604-163: theme toggle como elemento de diseño de primer nivel |
| L460 | [pendiente-ID]: Panel pendientes — trigger en header |
| L514 | Shared buttons |
| L543 | Tab-specific header buttons (visibility toggled by JS) |
| L548 | === locus-checkpoint-stats.js === |
| L551 | ══ R-202605-167: Breadcrumb interactivo en logo area — proyecto › sprint › ítem ══ |
| L553 | La estructura de tres segmentos siempre está en el DOM; |
| L572 | Reset button |
| L584 | Foco visible — no suprimir outline |
| L593 | Segmento 1 — proyecto: text-primary weight 700 |
| L607 | B-202605-518: sin proyecto activo → text-secondary |
| L612 | Segmento 2 — sprint: text-secondary weight 400 |
| L626 | Segmento 3 — ítem: text-tertiary weight 400, overflow ellipsis |
| L639 | Clase de visibilidad — aplicada por JS |
| L644 | ══ END R-202605-167 ══ |
| L646 | ══ T-202605-002: Sprint pill wrap — segundo hijo de .logo-project-label ══ |
| L660 | ══ END T-202605-002 ══ |
| L663 | ── HEADER REDESIGN ── |
| L674 | C — Header full-width · contenido con max-width alineado |
| L697 | ── SEARCH REDESIGN ── |

## locus-modals.css
**Líneas:** 4264 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-modals.css |
| L3 | Versión: 2.1 | Última actualización: 2026-05-22 | T-202605-033: hex hardcodeados → tokens semánticos |
| L5 | === locus-toast.js === |
| L8 | Toast shared |
| L10 | ── Toast stack system ── |
| L50 | AC-4: sombra reforzada en dark |
| L55 | AC-4: sombra con color en light para separar del fondo blanco |
| L165 | AC-1: t-info — borde más visible, fondo diferenciado de surface2 |
| L190 | AC-3: title override — tipos con fondo tintado usan el color del tipo para el title |
| L232 | AC-4: light theme — fondos más sólidos para tipos tintados |
| L249 | ── T-202604-226: Progress bar auto-dismiss ── |
| L462 | === locus-misc-ui.js === |
| L465 | ══ TAGS — Pills, picker modal, colores ══ |
| L650 | toast title color: inherit — ver regla en toast base section |
| L652 | Import toast — estilos para HTML enriquecido generado en backlog.js |
| L701 | ── toast-progress-bar |
| L711 | ── toast-duraciones |
| L725 | ── toast-aria |
| L747 | ═══ END B-202604-117: Toast system ═══ |
| L749 | === locus-storage.js === |
| L752 | ══ R[tmp:magic-link-auth]: Auth modal — Google + Magic link ══ |
| L818 | ══ END R[tmp:magic-link-auth] ══ |
| L820 | === locus-tracker.js === |
| L823 | ══ Bloqueo ciego — agotar IA sin sesión ══ |
| L856 | modo inline activo — bloquear campos normales |
| L949 | ── TG PANEL ── |
| L951 | ── PEND PANEL ── |
| L953 | ── MODAL REDESIGN ── |
| L955 | ── HISTORY HEADER ── |
| L957 | ── SHOW ALL BUTTON ── |
| L965 | ── SESSION INDICATORS ── |
| L967 | ── QUICK MODAL ── |
| L969 | ── SPLASH SCREEN ── |
| L971 | T-202604-396: splash-name oculto cuando el logo JPG incluye wordmark |
| L976 | T-202604-396: logo agrandado para mostrar wordmark del JPG |

## locus-proyectos.css
**Líneas:** 4045 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-proyectos.css |
| L3 | Versión: 2.0 | Selectores consolidados — T3 |
| L5 | === locus-projects.js === |
| L8 | === locus-sprint-project.js === |
| L11 | ═══ TAB PROYECTOS — Dashboard v2 ═══ |
| L13 | Top bar |
| L15 | locus-proyectos.css |
| L17 | Versión: 1.0 | Última actualización: 2026-05-11 | Cards proyectos, vista proyecto, doc generator, merge diff, dropzone, context panel, HTML-MAP, planificación |
| L19 | ═══ TAB PROYECTOS — Dashboard v2 ═══ |
| L21 | Top bar |
| L60 | Card |
| L146 | T-379: animaciones de entrada / salida / pulse para cards de proyectos |
| L181 | Buttons |
| L227 | T-202604-318: inline delete confirm en card proyecto |
| L244 | Metrics row |
| L320 | Activity dots |
| L337 | Next item footer |
| L392 | Empty |
| L408 | ── Radar Stats Grid (Tab Hoy) ─────────────────────────────────────── |
| L477 | ── Radar Footer ────────────────────────────────────────────────────── |
| L501 | ── Tab Hoy: scroll container fix — T-202604-303 altura completa ───── |
| L617 | Active state on sess-row when selected |
| L623 | === locus-projects.js === |
| L626 | ═══ T-202604-285: Contexto rico por proyecto ═══ |
| L738 | Secciones colapsables |
| L791 | ═══ END T-202604-285 ═══ |
| L793 | === locus-sprint-project.js === |
| L796 | ═══ §15 CSS Purity — sprint-project migration ═══ |
| L798 | Export confirm modal |
| L814 | Project filter button — clear span |
| L822 | Project panel — empty state |
| L830 | proj-all-row separator variant (used in panel) |
| L847 | Project archived toggle button |
| L859 | Input validation flash |
| L864 | ═══ END §15 CSS Purity — sprint-project ═══ |

## locus-radar.css
**Líneas:** 1649 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-radar.css |
| L2 | Versión: 1.3 | Última actualización: 2026-05-13 | B1 fondo explícito sidebar · B2 auto-init JS (ver nota) · B3 pin icon dual SVG |
| L4 | ══ R-202605-113: RADAR SIDEBAR GLOBAL — Jerarquía, auto-hide Dock, cards por estado ══ |
| L6 | ── Variables radar ── |
| L22 | ── Sidebar base — background y borde explícitos (Bug 1) ── |
| L35 | Colapsado: solo strip visible de 14px en el borde derecho |
| L40 | ── Strip clickeable (borde visible cuando colapsado) ── |
| L54 | indicador visual del strip |
| L69 | Cuando expandido, el strip no intercepta clicks en el contenido |
| L74 | ── Header ── |
| L84 | Fila 1: título + botones |
| L92 | Fila 2: pills de estado (inyectados por JS en #rsb-hdr-counts) |
| L111 | T-202605-495: círculo ::before eliminado — reemplazado por botón PIN |
| L135 | ── SEARCH — siempre visible, sticky debajo del header ── |
| L211 | Deprecated: .rsb-hidden → usar .is-hidden (clase canónica del sistema) |
| L212 | .rsb-hidden { display: none !important; } |
| L222 | ── Scroll area ── |
| L240 | ── Section dividers ── |
| L275 | Caret para secciones colapsables |
| L297 | Header extra de sección Agotadas — contador + próxima |
| L308 | ── Cards — base ── |
| L342 | Estado — accent bar izquierdo |
| L353 | ── Card internals ── |
| L399 | ── En sesión — info expandida ── |
| L432 | Botón CKPT directo — un click desde card En sesión |
| L456 | ── Agotadas — compact one-liner ── |
| L481 | ── Exhausted countdown ── |
| L498 | ── Available checkpoint button ── |
| L526 | ── Interrupted badge ── |
| L537 | ── Pill proyecto ── |
| L560 | ── Badges ── |
| L587 | Header counts — R-202605-138: contadores en fila 2 |
| L612 | disponible |
| L622 | agotada |
| L632 | en sesión — pulse |

## locus-sesiones-card.css
**Líneas:** 489 · **Size:** low · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-tracker-card.css |
| L2 | Versión: 1.0 | Última actualización: 2026-05-25 | Estilos del rediseño AI Card (sc-*) — extraído de locus-tracker.css |
| L4 | === locus-tracker.js === |
| L7 | === locus-tracker-utils.js === |
| L10 | ══════════════════════════════════════════════════════════════════ |
| L14 | ── sc-header ── |
| L39 | ── sc-avatar ── |
| L57 | ── sc-project ── |
| L68 | ── sc-badge — estado activo con dot animado ── |
| L98 | ── sc-sprint-id ── |
| L109 | ── sc-menu-btn — reemplaza card-dot-btn en el header ── |
| L141 | ── B-202605-020: card-dot-menu dropdown ── |
| L218 | ── END B-202605-020 ── |
| L220 | ── sc-stats — grid de 3 columnas ── |
| L258 | ── sc-stepper — 3 estados: pending / active / done ── |
| L328 | ── sc-preview-block — paso 2: preview del CHECKPOINT ── |
| L345 | ── sc-success-state — paso 3: feedback inline de éxito ── |
| L378 | ── sc-notes — toggle de notas colapsadas ── |
| L424 | ── sc-footer ── |
| L436 | ── sc-unlock — campo de hora de desbloqueo en footer ── |
| L458 | ── sc-save — botón guardar sesión ── |
| L489 | ══ END REDISEÑO AI CARD — sc-* ══ |

## locus-sesiones.css
**Líneas:** 7576 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-tracker.css |
| L3 | Versión: 2.2 | Última actualización: 2026-05-13 | log-* migrado desde locus-radar.css |
| L5 | === locus-workers.js === |
| L8 | ══ T-011: AVATARS ══ |
| L30 | .avatar-modal.open — canónico en locus-modals.css |
| L50 | === locus-tracker.js === |
| L53 | === locus-tracker-utils.js === |
| L56 | ══ TAB-TRACKER — Sidebar + Detail layout ══ |
| L64 | Sidebar |
| L87 | Detail panel |
| L89 | R-202605-005 · consolidado desde locus-overrides.css |
| L95 | B-202604-XXX: reducido de 1.5rem a 0.75rem top |
| L99 | B-fix: scroll para llegar al botón Guardar cuando el card es alto |
| L102 | T-202604-320: card ocupa ancho disponible |
| L105 | T-202604-320-b: cuando preview abierto, card llena el espacio — sin gap muerto |
| L119 | R-202604-068 AC-2: "no selection" empty state |
| L128 | R-202604-068 AC-1: "Sin IAs" empty state — pasos + botón primario |
| L158 | Sidebar footer — anclado al fondo |
| L168 | LOG toggle button in sidebar footer — fila propia |
| L269 | Modo log expandido — cuando el card AI está oculto |
| L360 | Grid — kept for archived section inside detail |
| L367 | tracker-status-bar: now lives inside tracker-detail, always renderable |
| L369 | Card |
| L371 | === locus-workers.js === |
| L374 | === locus-tracker.js === |
| L377 | ══ card-header-premium — header premium de cards de IA ══ |
| L378 | Reemplaza la zona visual de .card-strip en cards que usan renderCard() |
| L388 | ── Avatar column ── |
| L432 | Pulse ring — solo en available |
| L460 | ── Identity column ── |
| L493 | ── Status pill — base + estados ── |
| L495 | R-202605-005 · consolidado desde locus-overrides.css |
| L519 | Status dot animado dentro del pill |
| L545 | ── Right column — acciones ── |
| L599 | ══ END card-header-premium ══ |

## locus-sprint-close.css
**Líneas:** 1095 · **Size:** medium · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-sprint-close.css |
| L9 | ══ B-202605-218 — SCM modal: clases CSS Purity ══ |
| L26 | ══ END B-202605-218 ══ |
| L28 | ══ T-202604-417: Retrospectiva integrada al flujo de cierre ══ |
| L30 | ── Paso 4 — dentro del sprint-close-dialog ── |
| L174 | ── Sprint cerrado badge — clickeable ── |
| L184 | ── Panel de retrospectiva de sprint cerrado ── |
| L213 | ══ END T-202604-417 ══ |
| L215 | ── T-202604-417 · Complementos de implementación ── |
| L217 | modal--retro: variante ancha para vista de retrospectiva guardada |
| L223 | sprint-retro-body: pre con MD — visible solo en modo vista |
| L250 | sprint-retro-notes: textarea readonly — visible solo en modo vista |
| L267 | En modo vista ambos elementos se muestran |
| L273 | En modo vista (prompt post-cierre) ocultamos el texto descriptivo simple |
| L278 | scm-retro-notes-block: bloque de notas en step 3 del modal de cierre |
| L285 | scm-retro-notes-ta hereda estilos de scm-retro-textarea |
| L312 | bl-sprint-retro-btn: botón "retro" en sprint selector dropdown |
| L314 | sprint-action-retro: variante del sprint-action-btn para retro |
| L325 | ── END T-202604-417 · Complementos ── |
| L327 | ══ R-202605-129: Retro enriquecida — paso 3 del modal de cierre de sprint ══ |
| L329 | Panel contenedor |
| L338 | Header del panel |
| L355 | Botón descargar MD |
| L376 | Body del panel |
| L384 | Fila clave-valor |
| L411 | Effort inline |
| L431 | Porcentaje de entrega |
| L454 | Fila comparativa sprint anterior |
| L501 | Release tags inline |
| L533 | Listas mini de ítems |
| L577 | Zona de notas en el panel |
| L583 | Título de sección movimientos |
| L593 | ══ END R-202605-129 ══ |
| L595 | ══ T-202605-440: CSS — modal--retro · bl-sprint-retro-btn · sprint-action-retro · is-hidden retro overlay ══ |
| L597 | .is-hidden centralizado en locus-base.css CSS-04 — esta declaración es redundante |

## locus-sprint-plan.css
**Líneas:** 1332 · **Size:** high · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-sprint-plan.css |
| L2 | Versión: 1.0 | Última actualización: 2026-05-25 00:00 UTC-6 | Pulso del ecosistema + Contratos de módulo + Sub-tab Plan |
| L3 | === locus-pulso.js === |
| L6 | ───────────────────────────────────────────────────────────────────────────── |
| L10 | Dot button en el header |
| L29 | Dot semántico |
| L57 | Animación de pulso — solo para yellow y red |
| L77 | Overlay del panel |
| L96 | Panel |
| L114 | Header del panel |
| L147 | Cuerpo del panel |
| L157 | Secciones |
| L177 | Barra de velocidad |
| L198 | Filas de proyecto |
| L243 | Bloqueantes |
| L269 | Sprints sin movimiento |
| L276 | Empty state |
| L284 | === locus-contracts.js === |
| L287 | ════════════════════════════════════════════════════════════════════ |
| L305 | Ítems revisados recientemente — oculta el toggle para reducir ruido |
| L409 | Clasificación: visual / funcional / datos |
| L529 | END R-202604-074 |
| L531 | R-202604-075: CONTRATOS DE MÓDULO |
| L580 | Layout — dos columnas |
| L601 | Fila de módulo en la lista |
| L669 | Empty state |
| L717 | Detalle de módulo |
| L753 | Función row |
| L834 | END R-202604-075 |
| L836 | === locus-sprint-plan.js === |
| L839 | R-202604-076: Sub-tab Plan — estilos |
| L841 | ════════════════════════════════════════════════════════════════════ |
| L885 | T-202605-511: chip 'activo' — sprint con status === active en state.sprints |
| L895 | plan-sprint-progress — legacy span (sesiones) — mantenido por compat |
| L902 | T-202605-459: Barra de progreso por ítems |

## locus-sprint-ui.css
**Líneas:** 478 · **Size:** low · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-sprint-ui.css |
| L2 | Versión: 1.1 | Última actualización: 2026-05-25 | Locus — Vista Planificación + EXECUTION-PLAN UI — extraído de locus-proyectos.css via R-202605-040 |
| L4 | === locus-backlog-render.js === |
| L7 | ══ R-202605-130: Vista Planificación — drag & drop backlog → sprint ══ |
| L9 | — Contenedor principal — |
| L30 | — Header de la vista — |
| L75 | — Layout dos columnas — |
| L84 | — Columna base — |
| L106 | — Header de columna — |
| L136 | Columna derecha — header con acento sutil |
| L147 | — Medidor de effort (columna derecha) — |
| L179 | Línea de umbral — velocidad promedio = 100% |
| L202 | — Cuerpo de la columna — |
| L213 | — Estado vacío en columna — |
| L223 | — Separador central con flecha — |
| L238 | — Card de ítem — |
| L274 | — Header de card: tipo · código · prio · dots — |
| L308 | — Dots de effort — |
| L329 | — Título de card — |
| L343 | — Banner sin sprint destino — |
| L356 | ══ T-202605-509: Toggle colapso/expansión zona --done en Plan ══ |
| L358 | .is-hidden como utilitaria global — toggle via classList, sin style.display en JS |
| L387 | ══ END T-202605-509 ══ |
| L389 | === locus-sprint-plan.js === |
| L392 | ════════════════════════════════════════════════════════════════════ |
| L398 | ── Contenedor de scope — sección sesion y sección sprint ── |
| L409 | ── Header de scope ── |
| L431 | Sesión activa — label con acento visual |
| L441 | Sprint — label neutro |
| L452 | ── Empty states por scope ── |
| L460 | Estado de error aislado por sección — bloque malformado |
| L466 | ── Badge de truncamiento de sesión ── |
| L478 | END R-B: EXECUTION-PLAN |

## locus-sprint.css
**Líneas:** 763 · **Size:** medium · **mod:** — · **Changed in:** —

| Línea | Sección |
|-------|---------|
| L1 | locus-sprint.css |
| L2 | Versión: 1.1 | Última actualización: 2026-05-25 | Tab Sprint — header, burndown, ítems, scope added, workers, trigger de cierre, subtab nav |
| L3 | Migrado desde locus-backlog.css — T-202605-065 |
| L4 | Carga: después de locus-backlog.css en index.html |
| L6 | === locus-sprint.js === |
| L9 | === locus-sprint-plan.js === |
| L12 | === locus-backlog-sprints.js === |
| L15 | ══ T-202605-057: Tab Sprint — header sticky ══ |
| L80 | ══ END T-202605-057 ══ |
| L82 | ══ T-202605-058: Tab Sprint — burndown barra ══ |
| L128 | T-202605-062: fill verde cuando sprint listo para cerrar |
| L138 | ══ END T-202605-058 ══ |
| L140 | ══ T-202605-044: Tab Sprint — lista de Rs por estado ══ |
| L211 | Fila de ítem R |
| L302 | Child progress pill — Ts hijos |
| L310 | Sección vacía dentro de spi-section-body |
| L318 | ══ END T-202605-044 ══ |
| L320 | ══ T-202605-060: Tab Sprint — sección scope added ══ |
| L430 | ══ END T-202605-060 ══ |
| L432 | ══ T-202605-061: Tab Sprint — sección workers vinculados ══ |
| L482 | ══ END T-202605-061 ══ |
| L484 | ══ T-202605-062: Tab Sprint — trigger de cierre ══ |
| L525 | ══ END T-202605-062 ══ |
| L527 | ══ R-202605-043: Subtab nav — Ítems / Plan ══ |
| L587 | Paneles de contenido — ocupan el espacio disponible |
| L602 | Contenedor interno del plan |
| L617 | ══ R-202605-006: Sección Gestión del sprint ══ |
| L704 | ══ R-202605-008: Picker inline de sprint — empty state ══ |
| L750 | Botón en estado activo mientras el picker está abierto |
| L763 | ══ END R-202605-008 ══ |
