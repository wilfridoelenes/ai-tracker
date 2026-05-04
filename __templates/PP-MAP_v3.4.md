# PP-MAP_v3.3.md
<!-- Versión: v3.3 | Última actualización: 02/05/2026, 05:02 p.m. UTC-6 | Generado automáticamente -->

# MODULE-MAP — AI-Tracker v3.3

Arquitectura modular — 10 archivos independientes.
Generado: 02/05/2026, 05:02 p.m. UTC-6

---

## Índice de archivos

| Archivo | Tipo | Líneas | Descripción |
|---------|------|--------|-------------|
| `ai-tracker-ai-notes.js` | JS | 7,167 | 430 funciones |
| `ai-tracker-backlog.js` | JS | 6,730 | 415 funciones |
| `ai-tracker-checkpoint.js` | JS | 6,648 | 416 funciones |
| `ai-tracker-command-palette.js` | JS | 745 | 33 funciones |
| `ai-tracker-map-generator.js` | JS | 830 | 48 funciones |
| `ai-tracker-session.js` | JS | 2,815 | 130 funciones |
| `ai-tracker-sprint-project.js` | JS | 1,212 | 78 funciones |
| `ai-tracker-extra.css` | CSS | 15,523 | 149 secciones |
| `ai-tracker.css` | CSS | 7,583 | 44 secciones |
| `index.html` | HTML | 1,981 | 17 secciones |

**Total líneas:** 51,234

---

## ai-tracker-ai-notes.js (7,167 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L2 | `toggleNotes` | UI |
| L14 | `openAvatarModal` | UI |
| L37 | `selectAvatarOption` |  |
| L43 | `confirmAvatarModal` |  |
| L59 | `closeAvatarModal` | UI |
| L66 | `openAddAI` | UI |
| L75 | `confirmAddAI` |  |
| L80 | `duplicate` |  |
| L93 | `confirmClear` |  |
| L99 | `deleteAI` |  |
| L111 | `downloadReport` | Export / Import |
| L116 | `sorted` |  |
| L151 | `downloadGlobalReport` | Export / Import |
| L152 | `activeAIs` |  |
| L154 | `activeAIsWithSess` |  |
| L159 | `totalSess` |  |
| L170 | `aiSess` |  |
| L171 | `sorted` |  |
| L187 | `tgStr` |  |
| L204 | `toggleCardMenu` | UI |
| L213 | `closeCardMenu` | UI |
| L223 | `archiveAI` |  |
| L230 | `toggleArchivedSection` | UI |
| L237 | `showInlineConfirm` | UI |
| L251 | `closeInlineConfirm` | UI |
| L252 | `executeConfirm` |  |
| L265 | `closeModal` | UI |
| L308 | `toggleMoreMenu` | UI |
| L326 | `exportData` | Export / Import |
| L335 | `_gconfirmOpen` | Internal |
| L355 | `_gconfirmClose` | Internal |
| L359 | `_gconfirmOk` | Internal |
| L367 | `purgeOldSessions` |  |
| L371 | `openPurgeModal` | UI |
| L379 | `closePurgeModal` | UI |
| L384 | `toggleBacklogDangerZone` | UI |
| L390 | `openResetBacklogModal` | UI |
| L400 | `closeResetBacklogModal` | UI |
| L405 | `confirmResetBacklog` |  |
| L422 | `toggleSidebarDanger` | UI |
| L428 | `resetContextData` |  |
| L448 | `resetHtmlMapData` |  |
| L468 | `_calcPurgeCount` | Internal |
| L480 | `updatePurgePreview` |  |
| L499 | `confirmPurge` |  |
| L516 | `importData` | Export / Import |
| L532 | `_showImportDiff` | Internal |
| L534 | `incomingSess` |  |
| L536 | `currentNames` |  |
| L537 | `newAIs` |  |
| L538 | `existingAIs` |  |
| L541 | `cur` |  |
| L543 | `curIds` |  |
| L563 | `closeImportDiff` | UI |
| L568 | `confirmImport` |  |
| L574 | `newSess` |  |
| L586 | `openPasteItems` | UI |
| L591 | `closePasteItems` | UI |
| L596 | `piDragOver` |  |
| L600 | `piDragLeave` |  |
| L603 | `piDrop` |  |
| L616 | `_piDetectType` | Internal |
| L628 | `_piParseField` | Internal |
| L636 | `_piParseAC` | Internal |
| L647 | `piParse` |  |
| L703 | `piRenderPreview` |  |
| L715 | `selected` |  |
| L720 | `nNew` |  |
| L721 | `nUpdate` |  |
| L722 | `nWarn` |  |
| L783 | `piToggleCard` |  |
| L791 | `piToggle` |  |
| L794 | `selected` |  |
| L799 | `piEditTitle` |  |
| L800 | `piEditType` |  |
| L801 | `piEditStatus` |  |
| L803 | `piDeleteItem` |  |
| L812 | `piConfirm` |  |
| L813 | `toAdd` |  |
| L829 | `existingIdx` |  |
| L883 | `_refreshParentIdDropdown` | Internal |
| L892 | `rItems` |  |
| L898 | `_activeSprint` | Internal |
| L904 | `openItemEditor` | UI |
| L998 | `_ieAutofillFromPaste` | Internal |
| L1060 | `get` | Utils |
| L1112 | `_ieHighlightAutofilled` | Internal |
| L1124 | `closeItemEditor` | UI |
| L1130 | `confirmItemEditor` |  |
| L1159 | `item` |  |
| L1164 | `collision` |  |
| L1190 | `collision` |  |
| L1297 | `_loadCustomTemplates` | Internal |
| L1306 | `_saveCustomTemplates` | Internal |
| L1314 | `_getAllTemplates` | Internal |
| L1319 | `openTemplatePicker` | UI |
| L1326 | `closeTemplatePicker` | UI |
| L1331 | `_renderTemplatePicker` | Internal |
| L1336 | `predefined` |  |
| L1337 | `custom` |  |
| L1339 | `renderGroup` | Render |
| L1368 | `_applyTemplate` | Internal |
| L1394 | `_deleteCustomTemplate` | Internal |
| L1402 | `saveCurrentItemAsTemplate` | Save / Load |
| L1435 | `toggleTplSavePanel` | UI |
| L1455 | `getNextOccurrence` | Utils |
| L1463 | `_resetExpired` | Internal |
| L1473 | `getCD` | Utils |
| L1519 | `openTagModal` | UI |
| L1527 | `renderTagPicker` | Render |
| L1544 | `renderColorPicker` | Render |
| L1551 | `selectColor` |  |
| L1552 | `toggleTagOnSession` | UI |
| L1562 | `addNewTag` |  |
| L1577 | `openPendPanel` | UI |
| L1582 | `withPending` |  |
| L1599 | `closePendPanel` | UI |
| L1605 | `openStandaloneCheckpoint` | UI |
| L1617 | `closeStandaloneCheckpoint` | UI |
| L1629 | `openDocLog` | UI |
| L1645 | `closeDocLog` | UI |
| L1656 | `_updateDocLogCount` | Internal |
| L1667 | `_renderDocLog` | Internal |
| L1693 | `clearDocLog` |  |
| L1708 | `_toggleSearchScope` | Internal |
| L1714 | `onSearch` | Events |
| L1734 | `_esc` | Internal |
| L1735 | `hlText` |  |
| L1824 | `hasSessMatch` |  |
| L1829 | `matchSessIds` |  |
| L1833 | `match` |  |
| L1992 | `snippet` |  |
| L2035 | `getAnalyticsColor` | Utils |
| L2045 | `setCompareProject` | Utils |
| L2049 | `setCompareProjectA` | Utils |
| L2053 | `setCompareProjectB` | Utils |
| L2057 | `clearComparison` |  |
| L2063 | `setAnalyticsPeriod` | Utils |
| L2074 | `setAnalyticsRange` | Utils |
| L2079 | `setCfProject` | Utils |
| L2080 | `setCfType` | Utils |
| L2083 | `_getPeriodBounds` | Internal |
| L2110 | `_sessInRange` | Internal |
| L2120 | `_periodLabel` | Internal |
| L2135 | `_prevPeriodLabel` | Internal |
| L2154 | `_delta` | Internal |
| L2166 | `_getWeeksInPeriod` | Internal |
| L2175 | `_getIntervalsInPeriod` | Internal |
| L2212 | `lastNMonths` |  |
| L2223 | `getAnalyticsMonths` | Utils |
| L2226 | `fmtMonth` |  |
| L2233 | `sessionYM` |  |
| L2242 | `_parseSpanishDate` | Internal |
| L2261 | `sessionDateKey` |  |
| L2271 | `getTooltip` | Utils |
| L2280 | `showAnalyticsTooltip` | UI |
| L2282 | `total` |  |
| L2303 | `_posTooltip` | Internal |
| L2316 | `hideAnalyticsTooltip` | UI |
| L2324 | `_animateCountUp` | Internal |
| L2334 | `easeOut` |  |
| L2336 | `tick` |  |
| L2368 | `renderProyectos` | Render |
| L2373 | `activeProjects` |  |
| L2374 | `archivedProjects` |  |
| L2378 | `_weekStart` | Internal |
| L2388 | `_projSessions` | Internal |
| L2392 | `_sessThisWeek` | Internal |
| L2400 | `_lastSession` | Internal |
| L2407 | `_trend` | Internal |
| L2412 | `recent` |  |
| L2413 | `prev` |  |
| L2422 | `_relTimeShort` | Internal |
| L2437 | `_backlogStats` | Internal |
| L2445 | `rCodesWithChildren` |  |
| L2446 | `countable` |  |
| L2450 | `total` |  |
| L2451 | `done` |  |
| L2452 | `pending` |  |
| L2453 | `highPending` |  |
| L2454 | `next` |  |
| L2459 | `_typeColor` | Internal |
| L2467 | `_effortDots` | Internal |
| L2472 | `_buildCard` | Internal |
| L2594 | `count` |  |
| L2635 | `lastAI` |  |
| L2709 | `sortedActiveProjects` |  |
| L2718 | `activeCardsHtml` |  |
| L2736 | `_calcProjVelocity` | Internal |
| L2741 | `recent` |  |
| L2746 | `_estimateSprintClose` | Internal |
| L2759 | `_suggestionProj` | Internal |
| L2760 | `candidates` |  |
| L2762 | `scored` |  |
| L2774 | `allHighPending` |  |
| L2810 | `_proyDeleteInline` | Internal |
| L2816 | `_proyDeleteExecute` | Internal |
| L2829 | `_proyAbrir` | Internal |
| L2845 | `_closedItemsInRange` | Internal |
| L2864 | `_openedItemsInRange` | Internal |
| L2882 | `_closedItemsDetailInRange` | Internal |
| L2903 | `_openedItemsDetailInRange` | Internal |
| L2923 | `exportWeeklySummary` | Export / Import |
| L2957 | `fmtDate` |  |
| L2985 | `_wi_fmt` | Internal |
| L3037 | `_runDigestToasts` | Internal |
| L3069 | `blockedCount` |  |
| L3095 | `_buildCumulativeFlowChart` | Internal |
| L3120 | `timestamps` |  |
| L3135 | `buildPoints` | Builder |
| L3165 | `maxVal` |  |
| L3168 | `xOf` |  |
| L3169 | `yOf` |  |
| L3172 | `buildPath` | Builder |
| L3180 | `areaFill` |  |
| L3212 | `yTicks` |  |
| L3217 | `fmtDate` |  |
| L3231 | `sprintLines` |  |
| L3233 | `idx` |  |
| L3304 | `renderAnalytics` | Render |
| L3337 | `_dominantProject` | Internal |
| L3346 | `_activeProjectCount` | Internal |
| L3359 | `_filesKpi` | Internal |
| L3380 | `activeDays` |  |
| L3396 | `_buildBarChart` | Internal |
| L3401 | `projIds` |  |
| L3409 | `intervalData` |  |
| L3419 | `maxTotal` |  |
| L3431 | `yOf` |  |
| L3432 | `xOf` |  |
| L3436 | `_shouldShowLabel` | Internal |
| L3443 | `_intervalLabel` | Internal |
| L3453 | `_intervalTooltipLabel` | Internal |
| L3519 | `legendItems` |  |
| L3535 | `_activeDaysPrev` | Internal |
| L3549 | `_totalPendingItems` | Internal |
| L3568 | `_sparklineForIntervals` | Internal |
| L3573 | `_sparkSessions` | Internal |
| L3574 | `_sparkClosed` | Internal |
| L3575 | `_sparkOpened` | Internal |
| L3576 | `_sparkEfficiency` | Internal |
| L3585 | `_kpiCard` | Internal |
| L3606 | `pts` |  |
| L3652 | `_projMetricsSbs` | Internal |
| L3653 | `files` |  |
| L3658 | `prevFiles` |  |
| L3663 | `days` |  |
| L3664 | `prevDays` |  |
| L3677 | `_sessForProj` | Internal |
| L3696 | `_cmpRow` | Internal |
| L3747 | `_buildCompareSelector` | Internal |
| L3767 | `_cycleTimeData` | Internal |
| L3799 | `avg` |  |
| L3836 | `existing` |  |
| L3873 | `_ctDaysLabel` | Internal |
| L3878 | `_ctTrendHtml` | Internal |
| L3885 | `_ctSparkHtml` | Internal |
| L3888 | `vals` |  |
| L3892 | `pts` |  |
| L3908 | `_ctOutliersHtml` | Internal |
| L4214 | `_getAnalyticsAIs` | Internal |
| L4228 | `renderHeatmap` | Render |
| L4272 | `levelClass` |  |
| L4290 | `firstDay` |  |
| L4299 | `cell` |  |
| L4316 | `labelsHtml` |  |
| L4321 | `legendCells` |  |
| L4353 | `_buildHourlyInsightData` | Internal |
| L4393 | `renderHourly` | Render |
| L4416 | `bars` |  |
| L4430 | `_fmt2` | Internal |
| L4486 | `renderProductivityPatterns` | Render |
| L4498 | `_closedForProj` | Internal |
| L4521 | `_makeEntry` | Internal |
| L4575 | `_peakDow` | Internal |
| L4581 | `_peakHour` | Internal |
| L4588 | `_miniDowBar` | Internal |
| L4600 | `_miniHourBar` | Internal |
| L4617 | `rows` |  |
| L4660 | `renderCheckpointsByProject` | Render |
| L4689 | `_addToProj` | Internal |
| L4737 | `maxTotal` |  |
| L4739 | `rowsHtml` |  |
| L4787 | `exportAnalyticsMd` | Export / Import |
| L4793 | `rows` |  |
| L4795 | `count` |  |
| L4802 | `totalSess` |  |
| L4823 | `monthRows` |  |
| L4861 | `getAIColor` | Utils |
| L4862 | `idx` |  |
| L4867 | `isMobile` |  |
| L4870 | `viewMode` |  |
| L4877 | `setViewMode` | Utils |
| L4883 | `applyViewMode` |  |
| L4916 | `renderProject` | Render |
| L4930 | `sourceAIs` |  |
| L4958 | `scopeAIs` |  |
| L4972 | `uniqueAIs` |  |
| L5002 | `_lastNextStep` | Internal |
| L5084 | `done` |  |
| L5085 | `totalEffort` |  |
| L5086 | `doneEffort` |  |
| L5117 | `_renderCtxPreview` | Internal |
| L5158 | `_buildCtxEl` | Internal |
| L5198 | `typeColor` |  |
| L5249 | `typeColor` |  |
| L5344 | `_renderDecisionsSection` | Internal |
| L5345 | `sorted` |  |
| L5346 | `rowsHtml` |  |
| L5383 | `_projOpenAddDecision` | Internal |
| L5395 | `_projSaveDecision` | Internal |
| L5407 | `dec` |  |
| L5419 | `_projCancelDecision` | Internal |
| L5425 | `_projEditDecision` | Internal |
| L5442 | `_projDeleteDecision` | Internal |
| L5445 | `idx` |  |
| L5455 | `_qnNavToItem` | Internal |
| L5470 | `_projCtxStartEdit` | Internal |
| L5491 | `_projCtxSave` | Internal |
| L5503 | `_projCtxCancelEdit` | Internal |
| L5507 | `_projCtxToggleSec` | Internal |
| L5516 | `_projToggleAIFilter` | Internal |
| L5521 | `_projViewSearchInput` | Internal |
| L5529 | `_toggleProjAnalytics` | Internal |
| L5539 | `renderProjectAnalytics` | Render |
| L5546 | `projAIIds` |  |
| L5547 | `projAIs` |  |
| L5558 | `monthLabels` |  |
| L5560 | `counts` |  |
| L5566 | `barsHtml` |  |
| L5577 | `aiRanks` |  |
| L5580 | `rankHtml` |  |
| L5588 | `daySet` |  |
| L5638 | `downloadProjectReport` | Export / Import |
| L5642 | `projAIIds` |  |
| L5643 | `projAIs` |  |
| L5695 | `toggleProjectSection` | UI |
| L5710 | `restoreDrafts` |  |
| L5735 | `_updateSubTabButtons` | Internal |
| L5744 | `backlogBootstrapped` |  |
| L5812 | `switchSubTab` |  |
| L5834 | `_docsOnboardingSteps` | Internal |
| L5861 | `_renderDocsOnboarding` | Internal |
| L5874 | `doneCount` |  |
| L5893 | `stepsHtml` |  |
| L5913 | `_docsOnboardingAction` | Internal |
| L5919 | `_dismissDocsOnboarding` | Internal |
| L5929 | `_renderTplProjBanner` | Internal |
| L5947 | `importHtmlMap` | Export / Import |
| L5980 | `parseHtmlMapMd` | Parser |
| L6052 | `loadHtmlMap` | Save / Load |
| L6058 | `exportHtmlMapMd` | Export / Import |
| L6094 | `parseContextMd` | Parser |
| L6129 | `importContextMd` | Export / Import |
| L6134 | `_importContextMdFromText` | Internal |
| L6158 | `updateContextBanner` |  |
| L6172 | `renderContextStatus` | Render |
| L6174 | `_importContextMdFromFile` | Internal |
| L6183 | `_dropzoneHandle` | Internal |
| L6199 | `_setContextModified` | Internal |
| L6218 | `_clearContextModifiedBadge` | Internal |
| L6230 | `_setHtmlMapModified` | Internal |
| L6247 | `_clearHtmlMapModifiedBadge` | Internal |
| L6258 | `updateHtmlMapModificationBadge` |  |
| L6276 | `_setBacklogModified` | Internal |
| L6289 | `updateBacklogModificationBadge` |  |
| L6305 | `extractContextSections` |  |
| L6327 | `mergeContextSections` |  |
| L6329 | `_ctxKey` | Internal |
| L6333 | `conflicts` |  |
| L6337 | `names` |  |
| L6361 | `vMatch` |  |
| L6376 | `extractHtmlMapSections` |  |
| L6395 | `mergeHtmlMapSections` |  |
| L6397 | `_mapKey` | Internal |
| L6425 | `renderContext` | Render |
| L6462 | `_renderContextSections` | Internal |
| L6499 | `onContextSearch` | Events |
| L6507 | `clearContextSearch` |  |
| L6515 | `contextShowImport` |  |
| L6522 | `toggleContextSection` | UI |
| L6528 | `renderContextMd` | Render |
| L6537 | `flushTable` |  |
| L6588 | `renderContextInline` | Render |
| L6606 | `_planKey` | Internal |
| L6609 | `savePlan` | Save / Load |
| L6614 | `loadPlan` | Save / Load |
| L6624 | `renderPlan` | Render |
| L6641 | `backlog` |  |
| L6650 | `_statusClass` | Internal |
| L6651 | `_statusLabel` | Internal |
| L6652 | `_liveStatus` | Internal |
| L6653 | `_liveTitle` | Internal |
| L6654 | `_sessIsDone` | Internal |
| L6658 | `_sessIsBlocked` | Internal |
| L6666 | `_connector` | Internal |
| L6674 | `_sessCard` | Internal |
| L6676 | `resolvedItems` |  |
| L6739 | `doneSessions` |  |
| L6740 | `available` |  |
| L6741 | `blocked` |  |
| L6744 | `allCodes` |  |
| L6746 | `doneItems` |  |
| L6808 | `_buildPulsoPlanesHtml` | Internal |
| L6812 | `backlog` |  |
| L6820 | `_liveStatus` | Internal |
| L6827 | `allSessions` |  |
| L6829 | `doneSess` |  |
| L6838 | `activeSprint` |  |
| L6849 | `nextSess` |  |
| L6887 | `_ctrKey` | Internal |
| L6888 | `_ctrLoad` | Internal |
| L6889 | `_ctrSave` | Internal |
| L6912 | `_ctrMergeFromItem` | Internal |
| L6924 | `existing` |  |
| L6947 | `_ctrUpdateBadge` | Internal |
| L6959 | `onContratosSearch` | Events |
| L6967 | `clearContratosSearch` |  |
| L6977 | `_ctrIsRisk` | Internal |
| L6980 | `activeSprints` |  |
| L6982 | `sorted` |  |
| L6988 | `renderContratos` | Render |
| L7047 | `openContratoDetail` | UI |
| L7052 | `_esc` | Internal |
| L7054 | `_renderContratoDetail` | Internal |
| L7061 | `rows` |  |
| L7099 | `exportContratosMd` | Export / Import |
| L7104 | `pad` |  |
| L7142 | `resetContratosData` |  |
| L7151 | `searchContratos` |  |

## ai-tracker-backlog.js (6,730 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L5 | `_skelShow` | Internal |
| L11 | `_skelHide` | Internal |
| L13 | `exportContextMd` | Export / Import |
| L28 | `updateHtmlMapBanner` |  |
| L41 | `setHtmlMapFilter` | Utils |
| L51 | `_hmOnSearch` | Internal |
| L56 | `_hmToggleModule` | Internal |
| L64 | `renderHtmlMap` | Render |
| L93 | `isModular` |  |
| L98 | `filtered` |  |
| L100 | `rows` |  |
| L124 | `filesToShow` |  |
| L126 | `fileTypeClass` |  |
| L127 | `fileTypeLabel` |  |
| L128 | `fileShortName` |  |
| L130 | `fileTypeBarColor` |  |
| L134 | `filePills` |  |
| L152 | `_maxFnCount` | Internal |
| L186 | `areasHtml` |  |
| L187 | `areaRows` |  |
| L240 | `ITEMS` |  |
| L277 | `_undoSnapshot` | Internal |
| L284 | `undoBacklog` |  |
| L295 | `redoBacklog` |  |
| L306 | `_updateUndoUI` | Internal |
| L360 | `toggleCollapseAll` | UI |
| L381 | `toggleBacklogBlockerFilter` | UI |
| L391 | `toggleDepsFilter` | UI |
| L403 | `_hasDepsBlocked` | Internal |
| L406 | `dep` |  |
| L413 | `_isBlocked` | Internal |
| L423 | `_hasRecentSession` | Internal |
| L452 | `_calcPriority` | Internal |
| L466 | `_applyAllPriorities` | Internal |
| L476 | `_calcRelevanceScore` | Internal |
| L538 | `_recalcAllScores` | Internal |
| L549 | `_sanitizePendingInClosedSprints` | Internal |
| L595 | `loadBacklog` | Save / Load |
| L629 | `itemType` |  |
| L637 | `clearTypeFilters` |  |
| L643 | `toggleTypeFilter` | UI |
| L671 | `updateTypeFilterUI` |  |
| L690 | `toggleStatusFilter` | UI |
| L713 | `updateStatusFilterUI` |  |
| L726 | `toggleVersionCollapse` | UI |
| L736 | `_getNextItemCode` | Internal |
| L757 | `parseBacklogMd` | Parser |
| L777 | `get` | Utils |
| L842 | `parseBacklogMeta` | Parser |
| L849 | `relativeImportTime` |  |
| L866 | `updateBacklogBanner` |  |
| L879 | `el` |  |
| L889 | `importBacklog` | Export / Import |
| L918 | `idx` |  |
| L1006 | `badgeClass` |  |
| L1011 | `badgeLabel` |  |
| L1015 | `statusClass` |  |
| L1019 | `statusLabel` |  |
| L1025 | `_getActiveSessionAiId` | Internal |
| L1032 | `setItemStatus` | Utils |
| L1033 | `item` |  |
| L1054 | `dep` |  |
| L1083 | `stillBlocked` |  |
| L1085 | `blocker` |  |
| L1114 | `_resetStatusSelect` | Internal |
| L1123 | `effortDots` |  |
| L1130 | `_isCountableItem` | Internal |
| L1131 | `rCodesWithChildren` |  |
| L1136 | `renderStats` | Render |
| L1141 | `isInClosedSprint` |  |
| L1143 | `_countable` | Internal |
| L1145 | `countableItems` |  |
| L1154 | `visible` |  |
| L1179 | `backlogCount` |  |
| L1180 | `done` |  |
| L1182 | `descartadoCount` |  |
| L1186 | `pIdeasCount` |  |
| L1253 | `buildItemRefs` | Builder |
| L1262 | `chips` |  |
| L1272 | `toggleItemExpand` | UI |
| L1291 | `toggleSectionGroup` | UI |
| L1301 | `clearAllFilters` |  |
| L1331 | `toggleEffortFilter` | UI |
| L1357 | `updateEffortFilterUI` |  |
| L1374 | `setItemRole` | Utils |
| L1375 | `item` |  |
| L1388 | `toggleRoleFilter` | UI |
| L1401 | `togglePriorityFilter` | UI |
| L1412 | `updatePriorityFilterUI` |  |
| L1418 | `updateRoleFilterUI` |  |
| L1426 | `_getActiveRoles` | Internal |
| L1433 | `_buildRoleChips` | Internal |
| L1436 | `noneCount` |  |
| L1437 | `chips` |  |
| L1450 | `onBacklogSortChange` | Events |
| L1458 | `toggleSortDir` | UI |
| L1469 | `_getMiViewRoles` | Internal |
| L1480 | `_getMiViewLabel` | Internal |
| L1488 | `toggleBacklogFooter` | UI |
| L1496 | `toggleBacklogMikeMode` | UI |
| L1522 | `toggleBacklogKanbanMode` | UI |
| L1542 | `toggleBacklogTreeMode` | UI |
| L1556 | `toggleBacklogFocusMode` | UI |
| L1574 | `toggleBacklogNoAcMode` | UI |
| L1586 | `toggleChildrenBlock` | UI |
| L1599 | `setItemParent` | Utils |
| L1600 | `item` |  |
| L1611 | `updateClearFilterBtn` |  |
| L1628 | `_chip` | Internal |
| L1632 | `excluded` |  |
| L1668 | `_statusPills` | Internal |
| L1687 | `toggleSprintHealthPanel` | UI |
| L1700 | `toggleClosedSprintsBody` | UI |
| L1705 | `_calcEstimatedVelocity` | Internal |
| L1710 | `sprintData` |  |
| L1711 | `spItems` |  |
| L1712 | `planned` |  |
| L1713 | `real` |  |
| L1717 | `reals` |  |
| L1718 | `avg` |  |
| L1724 | `_buildSprintHealthPanel` | Internal |
| L1738 | `sprintItems` |  |
| L1742 | `doneItems` |  |
| L1746 | `blockedItems` |  |
| L1748 | `totalEffort` |  |
| L1749 | `doneEffort` |  |
| L1786 | `trendRows` |  |
| L1873 | `roadmapGoToSprint` |  |
| L1917 | `_buildSprintSelector` | Internal |
| L1922 | `activeSprint` |  |
| L1923 | `openSprints` | UI |
| L1924 | `closedSprints` | UI |
| L1930 | `total` |  |
| L1931 | `done` |  |
| L1951 | `_buildOption` | Internal |
| L1958 | `total` |  |
| L1959 | `done` |  |
| L2001 | `_blSprintOpen` | Internal |
| L2011 | `activeSprint` |  |
| L2012 | `openSprints` | UI |
| L2013 | `closedSprints` | UI |
| L2015 | `_buildOption` | Internal |
| L2022 | `total` |  |
| L2023 | `done` |  |
| L2070 | `_blSprintClose` | Internal |
| L2083 | `_blSprintSelect` | Internal |
| L2089 | `_blSprintToggleClosed` | Internal |
| L2101 | `_renderSprintRoadmap` | Internal |
| L2113 | `renderBacklogList` | Render |
| L2240 | `filtered` |  |
| L2301 | `pendienteFiltered` |  |
| L2303 | `sorted` |  |
| L2342 | `_sortGroup` | Internal |
| L2352 | `_sortItems` | Internal |
| L2386 | `ideaItems` |  |
| L2387 | `pendienteItems` |  |
| L2435 | `hasAnyItem` |  |
| L2441 | `doneInGroup` |  |
| L2442 | `totalInGroup` |  |
| L2457 | `_sprintAllItems` | Internal |
| L2481 | `doneInGroup` |  |
| L2482 | `totalInGroup` |  |
| L2512 | `_sprintAllItems` | Internal |
| L2514 | `_doneCount` | Internal |
| L2515 | `_descCount` | Internal |
| L2542 | `blockingItems` |  |
| L2719 | `renderArchivoHistorico` | Render |
| L2720 | `historicos` |  |
| L2723 | `isOpen` |  |
| L2724 | `activeView` |  |
| L2768 | `toggleArchivoHistorico` | UI |
| L2786 | `activeView` |  |
| L2794 | `setArchivoView` | Utils |
| L2804 | `_renderArchivoBody` | Internal |
| L2816 | `_renderArchivoViewSprint` | Internal |
| L2817 | `historicos` |  |
| L2823 | `noSprint` |  |
| L2833 | `spItems` |  |
| L2837 | `entryOpen` |  |
| L2861 | `nsOpen` |  |
| L2882 | `_renderArchivoViewFlat` | Internal |
| L2883 | `historicos` |  |
| L2897 | `_toggleArchSprintEntry` | Internal |
| L2928 | `_renderKanban` | Internal |
| L2937 | `_kanbanStatus` | Internal |
| L2946 | `allFiltered` |  |
| L2976 | `_kanbanCard` | Internal |
| L2981 | `dots` |  |
| L3037 | `_kbDrop` | Internal |
| L3053 | `_kbCardClick` | Internal |
| L3056 | `item` |  |
| L3062 | `_attachBacklogDnD` | Internal |
| L3096 | `fromIdx` |  |
| L3097 | `toIdx` |  |
| L3111 | `_inlineEditTitle` | Internal |
| L3114 | `item` |  |
| L3127 | `_commit` | Internal |
| L3137 | `_cancel` | Internal |
| L3152 | `_buildChildrenBlock` | Internal |
| L3154 | `allChildren` |  |
| L3156 | `children` |  |
| L3163 | `doneCount` |  |
| L3167 | `childRows` |  |
| L3205 | `_confirmUnlinkChild` | Internal |
| L3212 | `item` |  |
| L3218 | `_buildItemTimestamps` | Internal |
| L3219 | `_fmt` | Internal |
| L3232 | `_iso` | Internal |
| L3242 | `_buildItemPOriginBlock` | Internal |
| L3244 | `pItem` |  |
| L3254 | `_buildItemOriginBlock` | Internal |
| L3259 | `foundSess` |  |
| L3268 | `_fmtSessDate` | Internal |
| L3305 | `buildBacklogItem` | Builder |
| L3342 | `effortDotsHtml` |  |
| L3368 | `childCount` |  |
| L3369 | `childDoneCount` |  |
| L3508 | `_rLabel` | Internal |
| L3509 | `currentParent` |  |
| L3510 | `ghostOption` |  |
| L3551 | `_classify` | Internal |
| L3556 | `_acRows` | Internal |
| L3557 | `ambig` |  |
| L3602 | `_promoteItem` | Internal |
| L3603 | `item` |  |
| L3638 | `_promoteSelectType` | Internal |
| L3648 | `_promoteConfirm` | Internal |
| L3650 | `originItem` |  |
| L3703 | `_promoteTtoR` | Internal |
| L3704 | `item` |  |
| L3730 | `_promoteTtoRConfirm` | Internal |
| L3731 | `originItem` |  |
| L3782 | `copyItemCode` |  |
| L3807 | `copyItemToClipboard` |  |
| L3809 | `item` |  |
| L3839 | `tagNames` |  |
| L3849 | `_feedback` | Internal |
| L3872 | `toggleAc` | UI |
| L3880 | `setFilter` | Utils |
| L3888 | `onBacklogSearch` | Events |
| L3898 | `clearBacklogSearch` |  |
| L3909 | `updateBacklogFooter` |  |
| L3916 | `countable` |  |
| L3917 | `total` |  |
| L3918 | `pend` |  |
| L3919 | `done` |  |
| L3920 | `pIdeas` |  |
| L3941 | `cnt` |  |
| L3959 | `_isPlaceholderCode` | Internal |
| L3968 | `_findTmpMatch` | Internal |
| L3978 | `common` |  |
| L3988 | `mergeBacklogFromTG` |  |
| L4036 | `existing` |  |
| L4095 | `newBB` |  |
| L4175 | `pParent` |  |
| L4228 | `showMergeDiffPanel` | UI |
| L4262 | `_pill` | Internal |
| L4265 | `_card` | Internal |
| L4285 | `_retrocedoRow` | Internal |
| L4300 | `_discardRow` | Internal |
| L4321 | `_section` | Internal |
| L4334 | `rows` |  |
| L4339 | `rows` |  |
| L4348 | `rows` |  |
| L4357 | `rows` |  |
| L4361 | `rows` |  |
| L4368 | `rows` |  |
| L4372 | `rows` |  |
| L4376 | `ignoredCritical` |  |
| L4377 | `ignoredOk` |  |
| L4379 | `rows` |  |
| L4389 | `rows` |  |
| L4497 | `hasDescartes` |  |
| L4498 | `hasDescartesConRazon` |  |
| L4598 | `_mdiffDoApply` | Internal |
| L4604 | `item` |  |
| L4618 | `item` |  |
| L4688 | `_mdiffKeyHandler` | Internal |
| L4707 | `_showStatusConfirmModal` | Internal |
| L4741 | `_confirmRetroceso` | Internal |
| L4742 | `item` |  |
| L4769 | `_confirmDiscard` | Internal |
| L4770 | `item` |  |
| L4825 | `_applyDiscardBatch` | Internal |
| L4829 | `item` |  |
| L4862 | `_tgStatusToBacklog` | Internal |
| L4867 | `_normalizeStatus` | Internal |
| L4881 | `_isActiveRecently` | Internal |
| L4898 | `_getActiveSprint` | Internal |
| L4902 | `_getSprintById` | Internal |
| L4906 | `_nextSprintId` | Internal |
| L4915 | `_isValidSprintName` | Internal |
| L4920 | `createSprint` | Builder |
| L4948 | `_generateSprintRetroMd` | Internal |
| L4953 | `pad` |  |
| L4959 | `sprintItems` |  |
| L4960 | `doneItems` |  |
| L4961 | `pendItems` |  |
| L4963 | `totalEffort` |  |
| L4964 | `doneEffort` |  |
| L4965 | `pendEffort` |  |
| L4974 | `_itemRow` | Internal |
| L4994 | `spSessions` |  |
| L4999 | `sessRows` |  |
| L5074 | `openSprintRetroView` | UI |
| L5080 | `pad` |  |
| L5127 | `closeSprintRetroOverlay` | UI |
| L5133 | `_openRetroDownloadPrompt` | Internal |
| L5138 | `pad` |  |
| L5178 | `setSprintStatus` | Utils |
| L5227 | `setItemSprint` | Utils |
| L5229 | `item` |  |
| L5243 | `openNewSprintInline` | UI |
| L5263 | `confirmNewSprint` |  |
| L5273 | `editSprintInline` |  |
| L5294 | `confirmEditSprint` |  |
| L5317 | `confirmCloseSprint` |  |
| L5321 | `pendingItems` |  |
| L5322 | `doneItems` |  |
| L5348 | `closeCloseSprintModal` | UI |
| L5355 | `_scmBack` | Internal |
| L5363 | `_scmNext` | Internal |
| L5375 | `_scmBulkApply` | Internal |
| L5387 | `_scmRender` | Internal |
| L5436 | `_scmStep1Html` | Internal |
| L5437 | `totalItems` |  |
| L5438 | `doneCount` |  |
| L5441 | `totalEffort` |  |
| L5442 | `doneEffort` |  |
| L5445 | `doneRows` |  |
| L5452 | `pendRows` |  |
| L5486 | `_scmStep2Html` | Internal |
| L5488 | `activeSp` |  |
| L5503 | `rows` |  |
| L5528 | `_scmStep3Html` | Internal |
| L5529 | `doneCount` |  |
| L5530 | `discardedCount` |  |
| L5533 | `toSprint` |  |
| L5534 | `toUnassign` |  |
| L5535 | `toDiscard` |  |
| L5537 | `itemRow` |  |
| L5545 | `spLabel` |  |
| L5611 | `_scmExecuteClose` | Internal |
| L5632 | `processedCodes` |  |
| L5668 | `createSprintFromGroup` | Builder |
| L5681 | `navigateToItem` |  |
| L5684 | `item` |  |
| L5705 | `_buildItemMentionedIn` | Internal |
| L5708 | `mentions` |  |
| L5713 | `_fmtRel` | Internal |
| L5724 | `rows` |  |
| L5744 | `_buildItemMigratedBlock` | Internal |
| L5755 | `_openMigrateItem` | Internal |
| L5756 | `item` |  |
| L5798 | `_confirmMigrateItem` | Internal |
| L5804 | `item` |  |
| L5842 | `_backlogSetSelected` | Internal |
| L5862 | `item` |  |
| L5904 | `toggleFocusMode` | UI |
| L5916 | `exitFocusMode` |  |
| L5930 | `openItemPanel` | UI |
| L5931 | `item` |  |
| L5956 | `closeItemPanel` | UI |
| L5977 | `_itemPanelEscHandler` | Internal |
| L6000 | `_renderItemPanel` | Internal |
| L6097 | `linkedSessions` |  |
| L6133 | `blockedByPending` |  |
| L6134 | `blockedByDone` |  |
| L6135 | `blockingOthers` |  |
| L6137 | `_depsChip` | Internal |
| L6138 | `dep` |  |
| L6180 | `_buildPanelTimeline` | Internal |
| L6181 | `_fmt` | Internal |
| L6193 | `_iso` | Internal |
| L6270 | `alreadyHasDone` |  |
| L6313 | `rows` |  |
| L6347 | `_idpStartEditTitle` | Internal |
| L6351 | `item` |  |
| L6360 | `_idpSaveTitle` | Internal |
| L6364 | `item` |  |
| L6386 | `_idpCancelTitle` | Internal |
| L6394 | `_idpSetField` | Internal |
| L6395 | `item` |  |
| L6413 | `_itemPanelNotesDirty` | Internal |
| L6420 | `item` |  |
| L6429 | `_idpToggleAc` | Internal |
| L6438 | `_idpToggleHistory` | Internal |
| L6447 | `_idpCopyCode` | Internal |
| L6452 | `_idpMarkDone` | Internal |
| L6454 | `item` |  |
| L6461 | `_idpUnlinkSession` | Internal |
| L6463 | `sess` |  |
| L6468 | `item` |  |
| L6474 | `_idpAddNote` | Internal |
| L6475 | `item` |  |
| L6486 | `_idpAddNote_fromBtn` | Internal |
| L6497 | `_acvToggle` | Internal |
| L6508 | `_acvStartEdit` | Internal |
| L6511 | `item` |  |
| L6526 | `_acvSaveEdit` | Internal |
| L6531 | `item` |  |
| L6541 | `_acvConfirm` | Internal |
| L6542 | `item` |  |
| L6556 | `toggleTmplTriggerPanel` | UI |
| L6568 | `_resetTmplTriggerPanel` | Internal |
| L6579 | `_tryPatch` | Internal |
| L6606 | `updateTabNotifBadges` |  |
| L6638 | `_notifCfgLoad` | Internal |
| L6646 | `_notifCfgSave` | Internal |
| L6650 | `_notifSidebarToggle` | Internal |
| L6662 | `_notifSidebarRender` | Internal |
| L6666 | `rows` |  |
| L6684 | `_notifSidebarToggleType` | Internal |
| L6693 | `_notifSidebarSetThreshold` | Internal |
| L6703 | `_esc` | Internal |

## ai-tracker-checkpoint.js (6,648 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L9 | `_effectiveVersion` | Internal |
| L20 | `_hasStaleSuggestion` | Internal |
| L29 | `hasInProgress` |  |
| L50 | `_fbSavedConfig` | Internal |
| L68 | `setSyncStatus` | Utils |
| L85 | `_fbUid` | Internal |
| L88 | `_fbRef` | Internal |
| L93 | `_fbSessionsCol` | Internal |
| L98 | `_fbLegacyDoc` | Internal |
| L103 | `handleSyncPillClick` | Events |
| L108 | `signInWithGoogle` |  |
| L126 | `signOutGoogle` |  |
| L171 | `_scrollToCard` | Internal |
| L176 | `navigateToCard` |  |
| L187 | `switchTab` |  |
| L244 | `esc` |  |
| L248 | `_slugify` | Internal |
| L260 | `_loadTmpIdMap` | Internal |
| L276 | `_saveTmpIdMap` | Internal |
| L280 | `_assignPendingIds` | Internal |
| L288 | `_norm` | Internal |
| L290 | `existingTitleMap` |  |
| L360 | `showCheckpointPanel` | UI |
| L372 | `rows` |  |
| L385 | `rows` |  |
| L406 | `_renderCkptDiffPanel` | Internal |
| L412 | `confirmedCount` |  |
| L418 | `retroRows` |  |
| L435 | `discardRows` |  |
| L500 | `item` |  |
| L509 | `item` |  |
| L521 | `appliedRetro` |  |
| L522 | `appliedDiscard` |  |
| L533 | `_ckptDiffCleanup` | Internal |
| L551 | `_renderFieldDiff` | Internal |
| L558 | `removed` |  |
| L559 | `added` |  |
| L560 | `kept` |  |
| L578 | `rows` |  |
| L604 | `rows` |  |
| L618 | `rows` |  |
| L632 | `rows` |  |
| L646 | `rows` |  |
| L672 | `togglePasteHelp` | UI |
| L678 | `_updateCkptReopenBtn` | Internal |
| L684 | `closeCkptPanel` | UI |
| L692 | `_pauseCkptTimer` | Internal |
| L700 | `_resumeCkptTimer` | Internal |
| L721 | `_toastDuration` | Internal |
| L736 | `_toastVisibleCount` | Internal |
| L742 | `_toastRender` | Internal |
| L818 | `_touchResume` | Internal |
| L843 | `showToast` | UI |
| L861 | `_dismissToast` | Internal |
| L873 | `_toastNext` | Internal |
| L883 | `showToastDigest` | UI |
| L895 | `toast` |  |
| L901 | `showToastInline` | UI |
| L931 | `_hideInline` | Internal |
| L941 | `toggleTheme` | UI |
| L946 | `applyTheme` |  |
| L963 | `_saveFlush` | Internal |
| L1029 | `save` | Save / Load |
| L1064 | `saveImmediate` | Save / Load |
| L1072 | `_saveSessions` | Internal |
| L1096 | `_blogLog` | Internal |
| L1105 | `_relTs` | Internal |
| L1114 | `saveBacklog` | Save / Load |
| L1162 | `saveContextDocs` | Save / Load |
| L1194 | `onSearchDispatch` | Events |
| L1223 | `_isV2State` | Internal |
| L1233 | `_migrateV2toV3` | Internal |
| L1238 | `migProj` |  |
| L1270 | `exists` |  |
| L1283 | `existingCodes` |  |
| L1296 | `existingIds` |  |
| L1337 | `_applyStateData` | Internal |
| L1408 | `existingIds` |  |
| L1429 | `clone` |  |
| L1431 | `load` | Save / Load |
| L1459 | `cached` |  |
| L1474 | `_loadFromFirebase` | Internal |
| L1542 | `localSprintMap` |  |
| L1585 | `localIds` |  |
| L1614 | `localCodes` |  |
| L1667 | `_migrateLegacyFirebaseDoc` | Internal |
| L1744 | `checkStorageWarn` |  |
| L1751 | `syncErrored` |  |
| L1769 | `getAI` | Utils |
| L1774 | `getActiveProject` | Utils |
| L1780 | `getProjectSessions` | Utils |
| L1786 | `getAllSessions` | Utils |
| L1797 | `getSessionsByAI` | Utils |
| L1802 | `getProjectForSession` | Utils |
| L1807 | `getActiveTracker` | Utils |
| L1815 | `getActiveSprints` | Utils |
| L1821 | `_projKey` | Internal |
| L1824 | `_tplKey` | Internal |
| L1830 | `countAISessions` |  |
| L1835 | `getLastAISession` | Utils |
| L1844 | `getAISessions` | Utils |
| L1851 | `_findSession` | Internal |
| L1859 | `_findSessionByAI` | Internal |
| L1867 | `updateStats` |  |
| L1882 | `_isInSession` | Internal |
| L1887 | `last` |  |
| L1893 | `renderStatusBar` | Render |
| L1899 | `active` |  |
| L1904 | `sp` |  |
| L1907 | `spDone` |  |
| L1923 | `allCollapsed` |  |
| L1970 | `total` |  |
| L1971 | `done` |  |
| L2013 | `timestamps` |  |
| L2044 | `_notifConfig` | Internal |
| L2056 | `_saveNotifConfig` | Internal |
| L2060 | `_notifReadSet` | Internal |
| L2063 | `_notifSaveRead` | Internal |
| L2070 | `_computeNotifications` | Internal |
| L2076 | `_itemHasRecentSession` | Internal |
| L2240 | `markNotifRead` |  |
| L2248 | `markAllNotifsRead` |  |
| L2259 | `updateTabNotifBadges` |  |
| L2290 | `openNotifConfig` | UI |
| L2298 | `closeNotifConfig` | UI |
| L2303 | `_notifConfigReset` | Internal |
| L2309 | `_renderNotifConfigBody` | Internal |
| L2335 | `_notifConfigSetEnabled` | Internal |
| L2343 | `_notifConfigSetThreshold` | Internal |
| L2355 | `_registerNotifActions` | Internal |
| L2358 | `_notifGoto` | Internal |
| L2365 | `_renderNotifSection` | Internal |
| L2408 | `renderAIStatusBar` | Render |
| L2415 | `openSprintCreateFromSidebar` | UI |
| L2425 | `renderGlobalRadarSidebar` | Render |
| L2432 | `interrupted` |  |
| L2433 | `inSession` |  |
| L2441 | `_buildRsbCard` | Internal |
| L2548 | `spDone` |  |
| L2572 | `itemRows` |  |
| L2665 | `toggleRadarSidebar` | UI |
| L2681 | `_initRadarSidebarState` | Internal |
| L2700 | `toggleCollapseAll` | UI |
| L2701 | `active` |  |
| L2702 | `allCollapsed` |  |
| L2713 | `_trackerSetView` | Internal |
| L2739 | `sess` |  |
| L2750 | `_trackerViewPopulateProjects` | Internal |
| L2759 | `_trackerViewProjChange` | Internal |
| L2773 | `_trackerHistDayRender` | Internal |
| L2797 | `sorted` |  |
| L2836 | `rows` |  |
| L2857 | `_trackerHistDaySelect` | Internal |
| L2888 | `selectTrackerAI` |  |
| L2930 | `_renderTrackerSidebar` | Internal |
| L2931 | `nonArchived` |  |
| L2932 | `inSession` |  |
| L2933 | `available` |  |
| L2934 | `exhausted` |  |
| L2935 | `archived` |  |
| L2937 | `mkRow` |  |
| L2999 | `exHtml` |  |
| L3020 | `_timerKey` | Internal |
| L3022 | `_getTimerData` | Internal |
| L3029 | `_setTimerData` | Internal |
| L3033 | `_clearTimerData` | Internal |
| L3037 | `_timerIsActive` | Internal |
| L3043 | `stopSessionTimer` |  |
| L3053 | `startSessionTimer` |  |
| L3061 | `_formatTimer` | Internal |
| L3069 | `_renderTimerInCard` | Internal |
| L3080 | `_refreshTimerTick` | Internal |
| L3088 | `_timerWidgetHtml` | Internal |
| L3102 | `_computeSuggestionScore` | Internal |
| L3107 | `lastSess` |  |
| L3127 | `recentSess` |  |
| L3135 | `_getSuggestedAI` | Internal |
| L3152 | `_highPendingCount` | Internal |
| L3160 | `_buildSuggestionReason` | Internal |
| L3164 | `lastSess` |  |
| L3177 | `renderSuggestionBanner` | Render |
| L3194 | `dismissSuggestionBanner` |  |
| L3199 | `startSuggestedSession` |  |
| L3216 | `_isMonday` | Internal |
| L3218 | `_getMondayKey` | Internal |
| L3226 | `_weeklyAlreadyDismissed` | Internal |
| L3233 | `_markWeeklyDismissed` | Internal |
| L3237 | `_buildWeeklySummary` | Internal |
| L3244 | `lastWeekSess` |  |
| L3255 | `doneLast` |  |
| L3256 | `pendingNow` |  |
| L3272 | `sp` |  |
| L3274 | `spItems` |  |
| L3275 | `spDone` |  |
| L3285 | `_exportWeeklySummaryMd` | Internal |
| L3305 | `dismissWeeklySummary` |  |
| L3311 | `_maybeShowWeeklySummary` | Internal |
| L3318 | `el` |  |
| L3329 | `render` | Render |
| L3364 | `allActive` |  |
| L3366 | `preferred` |  |
| L3389 | `ai` |  |
| L3399 | `archived` |  |
| L3431 | `buildHoyCard` | Builder |
| L3439 | `sessConHora` |  |
| L3447 | `_availableSinceLabel` | Internal |
| L3514 | `_hoyMarkExhausted` | Internal |
| L3526 | `avgBetweenSessions` |  |
| L3542 | `buildCard` | Builder |
| L3572 | `_buildSessRow` | Internal |
| L3574 | `t` |  |
| L3577 | `tgItems` |  |
| L3636 | `sessThisMonth` |  |
| L3656 | `_projOptions` | Internal |
| L3732 | `sessConHora` |  |
| L3814 | `openQuickCapture` | UI |
| L3826 | `closeQuickModal` | UI |
| L3833 | `quickParseHora` |  |
| L3843 | `quickTitleKey` |  |
| L3848 | `confirmQuickCapture` |  |
| L3905 | `confirmInterruptInline` |  |
| L3919 | `cancelInterruptInline` |  |
| L3928 | `interruptSession` |  |
| L3953 | `dismissInterrupted` |  |
| L3966 | `enterFocusMode` |  |
| L3987 | `exitFocusMode` |  |
| L4001 | `_escCascade` | Internal |
| L4072 | `_hasChordWithG` | Internal |
| L4084 | `_chordDef` | Internal |
| L4208 | `_cur` | Internal |
| L4259 | `_cpHistoryLoad` | Internal |
| L4262 | `_cpHistorySave` | Internal |
| L4265 | `_cpHistoryAdd` | Internal |
| L4272 | `_cpFuzzy` | Internal |
| L4274 | `norm` |  |
| L4287 | `_cpBacklogItems` | Internal |
| L4296 | `_cpCommands` | Internal |
| L4336 | `_cpSessionCommands` | Internal |
| L4364 | `_cpItemCommands` | Internal |
| L4386 | `openCommandPalette` | UI |
| L4396 | `closeCommandPalette` | UI |
| L4401 | `_cpRender` | Internal |
| L4412 | `histIds` |  |
| L4413 | `histCmds` |  |
| L4415 | `rest` |  |
| L4420 | `staticMatches` |  |
| L4444 | `rows` |  |
| L4460 | `_cpHover` | Internal |
| L4467 | `_cpExecute` | Internal |
| L4477 | `_cpKeydown` | Internal |
| L4504 | `_cpInput` | Internal |
| L4535 | `_shortcutsLoad` | Internal |
| L4542 | `_shortcutsSave` | Internal |
| L4547 | `_shortcutKey` | Internal |
| L4549 | `def` |  |
| L4555 | `_shortcutConflict` | Internal |
| L4566 | `_shortcutsRender` | Internal |
| L4579 | `rows` |  |
| L4603 | `_shortcutsStartEdit` | Internal |
| L4604 | `def` |  |
| L4631 | `_shortcutsCaptureKey` | Internal |
| L4643 | `_shortcutsSaveEdit` | Internal |
| L4661 | `conflictDef` |  |
| L4666 | `def` |  |
| L4677 | `_shortcutsResetOne` | Internal |
| L4684 | `restoreDefaultShortcuts` |  |
| L4689 | `openShortcuts` | UI |
| L4698 | `closeShortcuts` | UI |
| L4705 | `openShortcutsRef` | UI |
| L4718 | `rows` |  |
| L4746 | `closeShortcutsRef` | UI |
| L4755 | `_sk` | Internal |
| L4759 | `_saveModalTrigger` | Internal |
| L4764 | `_restoreModalFocus` | Internal |
| L4772 | `_focusFirstInteractive` | Internal |
| L4782 | `_templateTrigger` | Internal |
| L4785 | `_autoDownloadOn` | Internal |
| L4789 | `toggleAutoDownload` | UI |
| L4794 | `_updateAutoDownloadLabel` | Internal |
| L4823 | `_hoyMsUntilReset` | Internal |
| L4831 | `_hoyCountdownLabel` | Internal |
| L4840 | `_hoyGetProjName` | Internal |
| L4849 | `_hoyAvailableSince` | Internal |
| L4857 | `_startHoyTicker` | Internal |
| L4873 | `_stopHoyTicker` | Internal |
| L4879 | `_startSidebarTicker` | Internal |
| L4882 | `exhausted` |  |
| L4912 | `_stopSidebarTicker` | Internal |
| L4917 | `renderProjDots` | Render |
| L4924 | `dots` |  |
| L4927 | `done` |  |
| L4949 | `renderHoy` | Render |
| L4958 | `_wkStart` | Internal |
| L4962 | `_moStart` | Internal |
| L4970 | `sHoy` |  |
| L4971 | `sHoyPrev` |  |
| L4972 | `sSemC` |  |
| L4973 | `sSemP` |  |
| L4974 | `sMesC` |  |
| L4975 | `sMesP` |  |
| L4978 | `_delta` | Internal |
| L4986 | `allSessSorted` |  |
| L4988 | `_lastCkptLabel` | Internal |
| L5003 | `projMonthStats` |  |
| L5010 | `_calcStreak` | Internal |
| L5011 | `dayKeys` |  |
| L5028 | `_peakHour` | Internal |
| L5044 | `completas` |  |
| L5045 | `rapidas` |  |
| L5048 | `_avgPerActiveDay` | Internal |
| L5049 | `dayKeys` |  |
| L5100 | `allAIs` |  |
| L5101 | `interrupted` |  |
| L5103 | `inSession` |  |
| L5163 | `nextExh` |  |
| L5164 | `nextLabel` |  |
| L5187 | `selectAIForQuickCapture` |  |
| L5188 | `available` |  |
| L5233 | `normStatus` |  |
| L5243 | `buildTGPreview` | Builder |
| L5257 | `count` |  |
| L5284 | `openCorrectHora` | UI |
| L5344 | `confirmCorrectHora` |  |
| L5376 | `unlockNowFromCard` |  |
| L5396 | `openQuickNote` | UI |
| L5423 | `closeQuickNote` | UI |
| L5430 | `saveQuickNote` | Save / Load |
| L5437 | `note` |  |
| L5450 | `qnRequestDelete` |  |
| L5455 | `qnCancelDelete` |  |
| L5460 | `qnConfirmDelete` |  |
| L5468 | `_qnRefInput` | Internal |
| L5489 | `_qnSelectAC` | Internal |
| L5495 | `_qnRefKeydown` | Internal |
| L5500 | `_qnTextKeydown` | Internal |
| L5505 | `_qnOverlayClick` | Internal |
| L5510 | `_qnNavToItem` | Internal |
| L5546 | `showMergeDiffPanel` | UI |
| L5578 | `_vizKeyHandler` | Internal |
| L5591 | `_itemVizClose` | Internal |
| L5610 | `_itemVizConfirm` | Internal |
| L5613 | `filtered` |  |
| L5620 | `_itemVizToggleExclude` | Internal |
| L5626 | `_itemVizToggleSinCambios` | Internal |
| L5634 | `_itemVizNavBacklog` | Internal |
| L5648 | `_itemVizRender` | Internal |
| L5656 | `_getBacklogItem` | Internal |
| L5661 | `_isSinCambio` | Internal |
| L5674 | `_mergeResultClass` | Internal |
| L5678 | `_mergeResultLabel` | Internal |
| L5683 | `_fieldDiffChips` | Internal |
| L5696 | `added` |  |
| L5697 | `removed` |  |
| L5710 | `activeItems` |  |
| L5711 | `sinCambioItems` |  |
| L5714 | `userExcluded` |  |
| L5725 | `_buildRow` | Internal |
| L5788 | `activeRows` |  |
| L5791 | `newCount` |  |
| L5792 | `updCount` |  |
| L5802 | `sinCambioRows` |  |
| L5831 | `_vizCopyCode` | Internal |
| L5835 | `_doFlash` | Internal |
| L5863 | `closeArranquePanel` | UI |
| L5868 | `_showArranquePanel` | Internal |
| L5911 | `closedInSess` | UI |
| L5976 | `available` |  |
| L5977 | `inSession` |  |
| L5978 | `exhausted` |  |
| L5981 | `bestAI` |  |
| L5982 | `ta` |  |
| L5983 | `tb` |  |
| L6020 | `_backlogItems` | Internal |
| L6030 | `_liveStatus` | Internal |
| L6031 | `_liveTitle` | Internal |
| L6032 | `_sessScore` | Internal |
| L6038 | `_sessIsDone` | Internal |
| L6053 | `_doneIds` | Internal |
| L6054 | `_isBlocked` | Internal |
| L6060 | `_pendingSessions` | Internal |
| L6070 | `_available` | Internal |
| L6071 | `_blocked` | Internal |
| L6075 | `_others` | Internal |
| L6079 | `_itemPill` | Internal |
| L6083 | `_filePill` | Internal |
| L6157 | `blocker` |  |
| L6237 | `onKey` | Events |
| L6250 | `_calcPulsoDotState` | Internal |
| L6259 | `projData` |  |
| L6261 | `lastTs` |  |
| L6267 | `closed7` | UI |
| L6268 | `closed714` | UI |
| L6285 | `blockerCount` |  |
| L6294 | `closedRecently` | UI |
| L6300 | `totalThisWeek` |  |
| L6301 | `totalLastWeek` |  |
| L6304 | `hasRed` |  |
| L6305 | `hasYellow` |  |
| L6311 | `renderPulsoDot` | Render |
| L6321 | `openPulsoPanel` | UI |
| L6385 | `onKey` | Events |
| L6389 | `closePulsoPanel` | UI |
| L6401 | `_trackerHistPopulateProjects` | Internal |
| L6411 | `_trackerRenderHist` | Internal |
| L6436 | `ai` |  |
| L6443 | `linkedItems` |  |
| L6478 | `_trackerHistFilterChange` | Internal |
| L6485 | `_trackerSelectSess` | Internal |
| L6500 | `_trackerRenderItems` | Internal |
| L6523 | `linkedItems` |  |
| L6566 | `_trackerHistDragStart` | Internal |
| L6572 | `s` |  |
| L6578 | `_trackerHistDragEnd` | Internal |
| L6584 | `_trackerHistAttachDropTargets` | Internal |
| L6607 | `s` |  |
| L6626 | `_trackerSwitchCol` | Internal |

## ai-tracker-command-palette.js (745 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L17 | `_buildCommandRegistry` | Internal |
| L194 | `_buildDynamicCommands` | Internal |
| L269 | `_getAllBacklogItems` | Internal |
| L281 | `_cpSearchContext` | Internal |
| L327 | `_itemTypeIcon` | Internal |
| L336 | `_fuzzyMatch` | Internal |
| L351 | `_fuzzyScore` | Internal |
| L364 | `_loadRecent` | Internal |
| L370 | `_saveRecent` | Internal |
| L392 | `_el` | Internal |
| L394 | `_cpInput` | Internal |
| L395 | `_cpList` | Internal |
| L396 | `_cpOverlay` | Internal |
| L397 | `_cpRecent` | Internal |
| L403 | `openCommandPalette` | UI |
| L426 | `closeCommandPalette` | UI |
| L439 | `_cpSearch` | Internal |
| L474 | `_cpRenderRecent` | Internal |
| L494 | `_cpRenderResults` | Internal |
| L528 | `_cpItemHtml` | Internal |
| L542 | `_cpHighlight` | Internal |
| L559 | `_cpExecute` | Internal |
| L570 | `_cpExecuteSelected` | Internal |
| L576 | `_cpExecuteRecentByEl` | Internal |
| L580 | `cmd` |  |
| L588 | `_cpKeydown` | Internal |
| L630 | `_cpGlobalKeydown` | Internal |
| L652 | `_cpOnOverlayClick` | Internal |
| L656 | `_cpOnListClick` | Internal |
| L672 | `_cpOnListMouseover` | Internal |
| L686 | `_cpShowToast` | Internal |
| L698 | `_escHtml` | Internal |
| L711 | `initCommandPalette` |  |

## ai-tracker-map-generator.js (830 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L12 | `_mgActiveSprint` | Internal |
| L16 | `active` |  |
| L38 | `openMapGenerator` | UI |
| L68 | `closeMapGenerator` | UI |
| L76 | `_mgLoadSprintReview` | Internal |
| L109 | `_mgSessionInSprint` | Internal |
| L117 | `item` |  |
| L122 | `_mgRenderDecisions` | Internal |
| L131 | `sorted` |  |
| L134 | `esc` |  |
| L144 | `_mgRenderLearnings` | Internal |
| L149 | `withLearning` |  |
| L159 | `esc` |  |
| L173 | `_mgToggleDecisionTranscends` | Internal |
| L180 | `_mgToggleLearningTranscends` | Internal |
| L186 | `_mgSwitchReviewTab` | Internal |
| L199 | `_mgInitDropzone` | Internal |
| L225 | `_mgLoadFiles` | Internal |
| L227 | `valid` |  |
| L250 | `_mgRenderFileList` | Internal |
| L273 | `_mgRemoveFile` | Internal |
| L282 | `_mgUpdateBtn` | Internal |
| L293 | `_mgParseFile` | Internal |
| L332 | `_mgGuessArea` | Internal |
| L349 | `_mgBumpMinor` | Internal |
| L363 | `_mgGetVersion` | Internal |
| L375 | `generateDocuments` |  |
| L409 | `generateMap` |  |
| L413 | `_generateMap` | Internal |
| L415 | `sorted` |  |
| L424 | `parsed` | Parser |
| L425 | `totalLines` |  |
| L461 | `_generateContext` | Internal |
| L499 | `seenMemoria` |  |
| L542 | `_generateBacklog` | Internal |
| L550 | `_generateSprintReview` | Internal |
| L580 | `sorted` |  |
| L583 | `seenDecisions` |  |
| L594 | `allDecisions` |  |
| L610 | `withLearning` |  |
| L661 | `_mgNow` | Internal |
| L670 | `_mgResetPreview` | Internal |
| L677 | `_mgShowPreview` | Internal |
| L702 | `tableStart` |  |
| L703 | `tableEnd` |  |
| L722 | `confirmMapGenerator` |  |
| L801 | `_mgApplyBumpedVersion` | Internal |
| L821 | `_mgDownload` | Internal |

## ai-tracker-session.js (2,815 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L6 | `parseCheckpoint` | Parser |
| L19 | `extractField` |  |
| L39 | `extractAllLines` |  |
| L61 | `_countParseable` | Internal |
| L91 | `_setPhase` | Internal |
| L101 | `parsePaste` | Parser |
| L263 | `failed` |  |
| L312 | `_doneNoAc` | Internal |
| L314 | `_codes` | Internal |
| L330 | `_validList` | Internal |
| L396 | `_linked` | Internal |
| L414 | `handlePaste` | Events |
| L431 | `_tryIngestPlan` | Internal |
| L452 | `parsePasteStandalone` | Parser |
| L571 | `saveStandaloneCheckpoint` | Save / Load |
| L591 | `_doApply` | Internal |
| L674 | `parsePlanBlock` | Parser |
| L685 | `_flushSess` | Internal |
| L689 | `_flushSprint` | Internal |
| L696 | `_parseList` | Internal |
| L748 | `_horaUpdate` | Internal |
| L770 | `parseHora` | Parser |
| L777 | `correctHora` |  |
| L784 | `interpretHora` |  |
| L803 | `fmt12` |  |
| L812 | `relDate` |  |
| L831 | `horaKey` |  |
| L844 | `_showProjRequiredInPanel` | Internal |
| L852 | `projOptions` |  |
| L921 | `confirmSave` |  |
| L925 | `cancelConfirmSave` |  |
| L931 | `_templateTrigger` | Internal |
| L934 | `toggleTemplateTrigger` | UI |
| L944 | `downloadTemplates` | Export / Import |
| L950 | `_dlTemplatesCancel` | Internal |
| L955 | `_buildNarrativeMemoryMd` | Internal |
| L957 | `withNarrative` |  |
| L977 | `_doDownloadTemplates` | Internal |
| L1014 | `_addChangelogEntry` | Internal |
| L1034 | `openChangelog` | UI |
| L1043 | `_buildChangelogInner` | Internal |
| L1047 | `rows` |  |
| L1069 | `_buildChangelogHTML` | Internal |
| L1075 | `_buildNarrativeMd` | Internal |
| L1082 | `_hasContent` | Internal |
| L1092 | `_ai` | Internal |
| L1097 | `entries` |  |
| L1109 | `buildContextMd` | Builder |
| L1117 | `activeSprint` |  |
| L1118 | `lastClosed` |  |
| L1142 | `lastBlockerEntry` |  |
| L1197 | `sprintItems` |  |
| L1263 | `buildBacklogMd` | Builder |
| L1321 | `_checkStorageQuota` | Internal |
| L1331 | `saveSession` | Save / Load |
| L1391 | `_showProjMismatchModal` | Internal |
| L1414 | `_mergeBacklogWithProject` | Internal |
| L1438 | `_doSaveSession` | Internal |
| L1445 | `trackerRefs` |  |
| L1485 | `_doCompleteFinish` | Internal |
| L1559 | `existing` |  |
| L1587 | `_doApplyMergeAndFinish` | Internal |
| L1708 | `toggleStatus` | UI |
| L1715 | `toggleShowAll` | UI |
| L1717 | `openDetail` | UI |
| L1772 | `_narBody` | Internal |
| L1824 | `rows` |  |
| L1841 | `t` |  |
| L1890 | `_previewSessProjId` | Internal |
| L1896 | `_previewProjOpts` | Internal |
| L1939 | `closePopup` | UI |
| L1958 | `openCompleteQuickSession` | UI |
| L1988 | `deleteCurrentSession` |  |
| L1996 | `openDeleteConfirm` | UI |
| L2000 | `closeDeleteConfirm` | UI |
| L2004 | `togglePopupMid` | UI |
| L2013 | `toggleInReview` | UI |
| L2025 | `starSession` |  |
| L2031 | `starCurrentSession` |  |
| L2050 | `popParseHora` |  |
| L2064 | `saveResetFromPopup` | Save / Load |
| L2091 | `savePreviewProject` | Save / Load |
| L2101 | `toProj` |  |
| L2113 | `popCorrectParseHora` |  |
| L2127 | `saveCorrectHoraFromPopup` | Save / Load |
| L2147 | `unlockNowFromPopup` |  |
| L2161 | `renderBacklogRefs` | Render |
| L2169 | `item` |  |
| L2197 | `refreshPopupRefs` |  |
| L2213 | `onPopupRefSearch` | Events |
| L2224 | `matches` |  |
| L2247 | `linkBacklogItem` |  |
| L2257 | `item` |  |
| L2269 | `unlinkBacklogItem` |  |
| L2277 | `item` |  |
| L2289 | `startPopupEdit` |  |
| L2331 | `commit` |  |
| L2343 | `cancel` |  |
| L2359 | `startRename` |  |
| L2367 | `commit` |  |
| L2377 | `duplicate` |  |
| L2385 | `cancel` |  |
| L2395 | `editNotes` |  |
| L2418 | `saveNotes` | Save / Load |
| L2427 | `cancelNotes` |  |
| L2431 | `renderNotesDisplay` | Render |
| L2447 | `checkNotesOverflow` |  |
| L2460 | `_saveLogFilters` | Internal |
| L2470 | `_loadLogFilters` | Internal |
| L2490 | `_getAllSessionsChron` | Internal |
| L2503 | `_logAIList` | Internal |
| L2512 | `_sessType` | Internal |
| L2518 | `_sessTypeLabel` | Internal |
| L2526 | `_sessTypePill` | Internal |
| L2535 | `_buildLogHeader` | Internal |
| L2539 | `aiPills` |  |
| L2556 | `projOptions` |  |
| L2585 | `_buildLogRow` | Internal |
| L2627 | `_rebuildLogBody` | Internal |
| L2637 | `filtered` |  |
| L2654 | `rows` |  |
| L2673 | `_logScrollTop` | Internal |
| L2678 | `scrollToLogCard` |  |
| L2703 | `closeLogCard` | UI |
| L2713 | `setLogFilterAI` | Utils |
| L2719 | `setLogFilterType` | Utils |
| L2725 | `setLogFilterProj` | Utils |
| L2731 | `setLogFilterStarred` | Utils |
| L2737 | `onLogSearch` | Events |
| L2802 | `navigateToBacklogItem` |  |

## ai-tracker-sprint-project.js (1,212 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L8 | `_docPrefix` | Internal |
| L15 | `_buildCurrentStateMd` | Internal |
| L25 | `pendientes` |  |
| L40 | `lastWithBlocker` |  |
| L53 | `_backlogVersion` | Internal |
| L59 | `_lastClosedSprint` | Internal |
| L61 | `closed` | UI |
| L67 | `exportBacklogMd` | Export / Import |
| L75 | `exportFullHistoryMd` | Export / Import |
| L82 | `_showExportConfirmModal` | Internal |
| L103 | `_generateBacklogMd` | Internal |
| L109 | `pad` |  |
| L153 | `doneCount` |  |
| L154 | `backlogCount` |  |
| L224 | `_buildIndexLines` | Internal |
| L245 | `_buildItemsMd` | Internal |
| L321 | `_getActiveProjectFilter` | Internal |
| L325 | `_setActiveProjectFilter` | Internal |
| L332 | `_updateProjBreadcrumb` | Internal |
| L336 | `_updateProjFilterBtn` | Internal |
| L356 | `clearProjectFilter` |  |
| L368 | `openProjPanel` | UI |
| L376 | `closeProjPanel` | UI |
| L383 | `renderProjPanel` | Render |
| L416 | `_countProjSessions` | Internal |
| L420 | `selectProjectFilter` |  |
| L444 | `openProjModal` | UI |
| L476 | `closeProjModal` | UI |
| L481 | `cancelProjForm` |  |
| L495 | `_renderProjColorRow` | Internal |
| L503 | `selectProjColor` |  |
| L508 | `confirmProjForm` |  |
| L543 | `_renderProjList` | Internal |
| L552 | `activeProjs` |  |
| L553 | `archivedProjs` |  |
| L555 | `_projRow` | Internal |
| L598 | `editProjInline` |  |
| L618 | `toggleProjArchive` | UI |
| L633 | `deleteProjConfirm` |  |
| L652 | `projDragStart` |  |
| L656 | `projDragEnd` |  |
| L661 | `projDragOver` |  |
| L667 | `projDragLeave` |  |
| L670 | `projDrop` |  |
| L675 | `fromIdx` |  |
| L676 | `toIdx` |  |
| L685 | `getProjectById` | Utils |
| L689 | `getProjectsByAI` | Utils |
| L694 | `getProjContext` | Utils |
| L698 | `setProjContext` | Utils |
| L705 | `getProjBacklog` | Utils |
| L709 | `setProjBacklog` | Utils |
| L721 | `_notesKey` | Internal |
| L725 | `_loadNotes` | Internal |
| L731 | `_saveNotes` | Internal |
| L737 | `_noteId` | Internal |
| L742 | `createNote` | Builder |
| L758 | `editNote` |  |
| L762 | `idx` |  |
| L776 | `deleteNote` |  |
| L780 | `filtered` |  |
| L788 | `getActiveProjectNotes` | Utils |
| L794 | `_filteredAIs` | Internal |
| L838 | `_checkOnboarding` | Internal |
| L848 | `_renderOnboardingSteps` | Internal |
| L890 | `_onboardingStepAction` | Internal |
| L895 | `_dismissOnboarding` | Internal |
| L901 | `openFbOnboarding` | UI |
| L902 | `saved` | Save / Load |
| L913 | `closeFbOnboarding` | UI |
| L919 | `parseFirebaseConfig` | Parser |
| L957 | `missing` |  |
| L1000 | `fbWizardStep` |  |
| L1010 | `fbWizardConfirm` |  |
| L1028 | `fbWizardApply` |  |
| L1103 | `cleanupLocalStorage` |  |
| L1135 | `_getLocalStorageUsage` | Internal |
| L1146 | `testLocalStorageQuota` |  |

## ai-tracker-extra.css (15,523 líneas)

| Líneas | Sección |
|--------|---------|
| L1459 | END OF UX/UI REDESIGN |
| L1618 | TAB SCROLL PROGRESS BAR |
| L1640 | T-202604-164: Modal animations — scale-in/out + backdrop blur + button states |
| L1908 | END T-202604-164 |
| L1910 | DOC LOG DRAWER |
| L2046 | END DOC LOG DRAWER |
| L2048 | AI STATUS BAR |
| L2199 | END AI STATUS BAR |
| L2201 | T-202604-178: Copy item button |
| L2234 | T-202604-216: Skeleton rows — renderBacklogList / renderAnalytics / renderHtmlMap |
| L2277 | END T-202604-216 |
| L2279 | T-202604-218: Sidebar → strip horizontal en mobile (<600px) |
| L2411 | END T-202604-218 |
| L2413 | T-202604-233: Toast — mobile responsive (≤560px) — actualizado T-202604-221 |
| L2424 | END T-202604-233 |
| L2426 | T-202604-221: Toast inline — anclado al elemento que detona la acción |
| L2524 | END T-202604-221 toast inline |
| L2526 | T-202604-254: RADAR SIDEBAR GLOBAL |
| L2780 | END T-202604-254 |
| L2782 | T-202604-392: rsb-card — pill proyecto + badge estado |
| L2818 | END T-202604-392 |
| L2820 | T-202604-394: contadores por estado en header Radar |
| L2838 | END T-202604-394 |
| L2840 | T-202604-395: empty state Radar sin IAs |
| L2869 | END T-202604-395 |
| L2871 | R-202604-066: Microinteracciones header |
| L2959 | END R-202604-066 |
| L2961 | R-202604-065: Rediseño header global |
| L3291 | END R-202604-065 |
| L3293 | T-202604-268: QUICK NOTE |
| L3462 | END T-202604-268/270 |
| L3464 | T-202604-269: NOTAS EN VISTA DE PROYECTO |
| L3562 | END T-202604-269 |
| L3564 | T-202604-265: SPRINT HEALTH INDICATOR |
| L3852 | END T-202604-265 |
| L3854 | T-202604-263: ÚLTIMA SESIÓN EN CARD DE PROYECTO |
| L3909 | END T-202604-263 |
| L3911 | T-202604-264: ÍTEMS SUGERIDOS EN VISTA PROYECTO |
| L3986 | END T-202604-264 |
| L3988 | B-202604-129: Radar sidebar expand button — visible solo cuando colapsado |
| L4019 | END B-202604-129 |
| L4021 | T-202604-276: Trend badges — acelerando / desacelerando en Tab Proyectos |
| L4043 | END T-202604-276 |
| L4045 | T-202604-281: Empty states unificados — Tracker, Proyectos, Backlog, Analytics |
| L4095 | END T-202604-281 |
| L4097 | T-202604-284 — Sprint Roadmap |
| L4204 | END T-202604-284 |
| L4206 | T-202604-275: Patrones de productividad |
| L4300 | END T-202604-275 |
| L4302 | T-202604-274: Checkpoints por proyecto |
| L4411 | END T-202604-274 |
| L4413 | T-202604-293: Unified Search Panel |
| L4497 | END T-202604-293 |
| L4499 | T-202604-286: Mencionado en — sección en ítem expandido del Backlog |
| L4546 | END T-202604-286 |
| L4548 | T-202604-287: KANBAN VIEW |
| L4787 | END T-202604-287 |
| L4789 | T-202604-289: Decisiones del proyecto |
| L5010 | END T-202604-289 |
| L5012 | B-202604-XXX: Kanban — listEl no se comprime cuando hay contenido visible |
| L5025 | END B-202604-XXX |
| L5027 | S-CPR: CSS Purity Refactor — utilidades |
| L5162 | END S-CPR: utilidades |
| L5164 | R-202604-036: Merge Diff Panel — viz-* content styles |
| L5376 | END R-202604-036 |
| L5377 | R-202604-046: HTML-MAP filter pills — estado visual diferenciado |
| L5488 | END R-202604-046 |
| L5491 | migrated from index.html <style> block 1 |
| L5492 | T-202604-210: Backup button in header |
| L5528 | T-202604-210: logo-version pill oculto (versión en tooltip) |
| L5744 | R-202604-016: Log Card |
| L5998 | migrated from index.html <style> block 2 |
| L6294 | T-CSS-PURITY: Static inline style= → CSS classes (Phase 2) |
| L6342 | T-CSS-PURITY: card-notes-ta auto-resize via CSS var |
| L6345 | T-CSS-PURITY: proj color dots via --proj-color CSS var |
| L6351 | T-CSS-PURITY: session.js — Fase 2 clases HTML generado |
| L6395 | T-202604-CSS-BACKLOG: CSS Purity — backlog.js static style= → classes |
| L6415 | T-202604-204: Docs Onboarding |
| L6436 | Context Panel |
| L6616 | Analytics V2 |
| L6849 | T-202604-272: Badge Estancado |
| L6861 | T-202604-322: Analytics Legibility |
| L6942 | S-09: Analytics Layout R-069 + T-399/400/403/404/405 |
| L7075 | R-202604-070: Comparación side-by-side |
| L7136 | T-202604-401: KPI color semántico + sparkline |
| L7163 | T-202604-402: KPI row nuevas métricas |
| L7171 | T-202604-406: Patrones productividad — efectividad cruzada |
| L7196 | T-202604-407: Microinteracciones Analytics |
| L7236 | T-202605-454: Insight de horas productivas — accionable desde heatmap |
| L7303 | END T-202605-454 |
| L7305 | T-202605-453: Tiempo promedio pendiente → done |
| L7551 | END T-202605-453 |
| L7553 | T-202604-187: Backlog Styles |
| L7600 | T-202604-323: HtmlMap Bar Styles |
| L7632 | DROPZONE — Importación unificada Backlog / HTML-MAP / Context |
| L8343 | R-202604-071: Merge Diff Panel — rediseño completo two-column |
| L8806 | END R-202604-071 |
| L8808 | R-202605-096: Toast bloqueante → confirmación inline en panel DIFF |
| L8925 | END R-202605-096 |
| L8927 | B-202604-160: 'En curso' status — badge + filtro |
| L8933 | END B-202604-160 |
| L8935 | B-202604-166: Sección 'En curso' en renderBacklogList |
| L8942 | END B-202604-166 |
| L10420 | T-202604-412: Document Generator — estilos migrados de index.html <style> |
| L10459 | END T-202604-412: Document Generator |
| L10694 | END S-07 |
| L11081 | R-202604-069: Analytics layout — ancho completo · zonas visuales definidas |
| L11220 | R-[pendiente-ID]: Unified Merge Diff Panel — retrocesos y descartes inline |
| L11321 | END R-[pendiente-ID]: Unified Merge Diff Panel |
| L11323 | R-202604-077: CKPT Diff Panel Unificado — confirmaciones post-CHECKPOINT |
| L11562 | END R-202604-077 |
| L11564 | R-202604-059: Grid Tracker 3 columnas |
| L11973 | END R-202604-059 |
| L11982 | R-202604-061: Microinteracciones Tracker — S-10 |
| L12070 | END R-202604-061 |
| L12077 | R-202604-062: Layout y visual cards Proyectos |
| L12148 | END R-202604-062 |
| L12150 | R-202604-064: Microinteracciones Proyectos |
| L12199 | END R-202604-064 |
| L12201 | R-202604-063: Funcionalidad Proyectos — estilos de soporte |
| L12279 | END R-202604-063 |
| L12385 | T-202604-414: Panel diff — delta real por campo en actualizaciones |
| L12487 | END T-202604-414 |
| L12489 | R-202604-091: Fusionar en curso con pendiente — decorador visual de actividad |
| L12903 | END R-202604-089 |
| L12970 | END T-202604-416 |
| L12995 | END T-202604-426 |
| L13003 | R-[tmp:toolbar-backlog-redesign]: Toolbar · Filter Strip · Sprint Selector |
| L13474 | END R-[tmp:toolbar-backlog-redesign] |
| L13476 | [tmp:sprint-header-pills] — status-pill · sprint header badges |
| L13520 | END [tmp:sprint-header-pills] |
| L13522 | B-202605-217 — bl-sprint-trigger-bar-fill: width via CSS var |
| L13526 | END B-202605-217 |
| L13528 | B-202605-218 — SCM modal: clases CSS Purity |
| L13542 | END B-202605-218 |
| L13544 | R-202605-095 — Toast bloqueante → confirmación inline en panel DIFF |
| L13642 | END R-202605-095 |
| L13644 | R-202605-098: Ciclo de vida y representación visual diferenciada — ítems tipo P |
| L13842 | END R-202605-098 |
| L13844 | T-202604-417: Retrospectiva integrada al flujo de cierre |
| L14096 | END T-202604-417 |
| L14213 | T-202605-440: CSS — modal--retro · bl-sprint-retro-btn · sprint-action-retro · is-hidden retro overlay |
| L14218 | END T-202605-440 |
| L14717 | FIN HISTÓRICO UNIFICADO |
| L14719 | T-202605-452: Flujo acumulativo — ítems entrando vs saliendo |
| L14885 | FIN T-202605-452 |
| L14905 | FIN T-202604-423 |
| L15474 | R-202605-104: Jerarquía visual sección Ideas — indentado exclusivo padre-hijo |
| L15521 | END R-202605-104 |

## ai-tracker.css (7,583 líneas)

| Líneas | Sección |
|--------|---------|
| L2 | VARIABLES |
| L229 | SHARED — Reset, body, header, tabs, botones, toast, search |
| L300 | FASE 3-A — Tab bar premium |
| L777 | T-011: AVATARS |
| L847 | TAB-TRACKER — Sidebar + Detail layout |
| L1069 | LOG CARD |
| L1415 | SESIONES — Filas, indicadores, show-all |
| L1469 | TRACKER GLOBAL — Panel, items, add-row |
| L1543 | TAGS — Pills, picker modal, colores |
| L1573 | PANELES — Pendientes, inline-confirm, popup detalle, modal add-AI |
| L2232 | TAB-BACKLOG |
| L2685 | TAB-BACKLOG — Stats, toolbar, items, versiones |
| L3562 | TAB-ANALYTICS |
| L3704 | Analytics KPI cards (B-202604-145) |
| L3840 | END Analytics KPI cards |
| L3958 | T-036: MOBILE RESPONSIVE (<600px) |
| L4586 | FASE 2 — PREMIUM CARD SYSTEM |
| L5057 | TAB PROYECTOS — Dashboard v2 |
| L5403 | T-202604-285: Contexto rico por proyecto |
| L5474 | END T-202604-285 |
| L5476 | T-202604-165: buildBacklogItem() premium |
| L5853 | T-202604-202: View mode pills — Cards / Proyecto |
| L5882 | END T-202604-202 |
| L5884 | R-202604-015: Item Detail Panel — two-column backlog layout |
| L6231 | END R-202604-015 |
| L6233 | R-202604-015 Sesión 2 — editable title + meta grid |
| L6332 | END R-202604-015 Sesión 2 |
| L6334 | T-202604-307 — Quick actions · Timeline notes · Session unlink |
| L6419 | END T-202604-307 |
| L6421 | §15 CSS Purity — sprint-project migration |
| L6451 | END §15 CSS Purity — sprint-project |
| L6453 | §15 CSS Purity — checkpoint.js parte 1 |
| L6507 | END §15 CSS Purity — checkpoint.js parte 1 |
| L6508 | §15 CSS Purity — checkpoint.js parte 2 |
| L6702 | END §15 CSS Purity — checkpoint.js parte 2 |
| L6704 | §15 CSS Purity — ai-notes.js |
| L6771 | END §15 CSS Purity — ai-notes.js |
| L6785 | §15 CSS Purity — backlog.js migration |
| L6822 | END §15 CSS Purity — backlog.js migration |
| L6824 | §15 CSS Purity — session.js migration |
| L6887 | END §15 CSS Purity — session.js migration |
| L7175 | END B-202604-117: Toast system |
| L7177 | R-202605-099: Toolbar · Filter Strip · Sprint Bar |
| L7582 | END R-202605-099 |

## index.html (1,981 líneas)

| Líneas | Sección |
|--------|---------|
| L18 | SPLASH PEPE |
| L31 | HEADER COMPARTIDO |
| L129 | RADAR SIDEBAR GLOBAL |
| L142 | TAB TRACKER |
| L299 | TAB BACKLOG |
| L568 | TAB ANALYTICS |
| L573 | TAB PROYECTOS |
| L578 | OVERLAYS / MODALES (Tracker) |
| L610 | T-011: AVATAR SELECTOR MODAL |
| L727 | T-202604-009: ONBOARDING PRIMER USO |
| L1138 | R-202604-047: STATIC MODAL SHELLS |
| L1314 | FIN R-202604-047 STATIC MODAL SHELLS |
| L1316 | T-202604-419: COMMAND PALETTE |
| L1328 | FIN T-202604-419 COMMAND PALETTE |
| L1399 | DOC LOG DRAWER |
| L1485 | DOCUMENT GENERATOR OVERLAY — R-202604-053 · UX R-202605-102 |
| L1629 | AI STATUS BAR — DEPRECATED T-202604-254 |

