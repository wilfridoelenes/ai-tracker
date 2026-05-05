# PP-MAP_v3.4.6.md
<!-- Versión: v3.4.6 | Última actualización: 04/05/2026, 09:53 p.m. UTC-6 | Generado automáticamente -->

# MODULE-MAP — AI-Tracker v3.4.6

Arquitectura modular — 10 archivos independientes.
Generado: 04/05/2026, 09:53 p.m. UTC-6

---

## Índice de archivos

| Archivo | Tipo | Líneas | Descripción |
|---------|------|--------|-------------|
| `ai-tracker-ai-notes.js` | JS | 7,384 | 438 funciones |
| `ai-tracker-backlog.js` | JS | 6,682 | 410 funciones |
| `ai-tracker-checkpoint.js` | JS | 7,160 | 443 funciones |
| `ai-tracker-command-palette.js` | JS | 745 | 33 funciones |
| `ai-tracker-map-generator.js` | JS | 1,120 | 60 funciones |
| `ai-tracker-session.js` | JS | 3,004 | 135 funciones |
| `ai-tracker-sprint-project.js` | JS | 1,077 | 70 funciones |
| `env.js` | JS | 4 | 0 funciones |
| `ai-tracker-extra.css` | CSS | 16,560 | 148 secciones |
| `ai-tracker.css` | CSS | 7,647 | 46 secciones |

**Total líneas:** 51,383

---

## ai-tracker-ai-notes.js (7,384 líneas)

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
| L373 | `_gconfirmOpen` | Internal |
| L393 | `_gconfirmClose` | Internal |
| L397 | `_gconfirmOk` | Internal |
| L405 | `purgeOldSessions` |  |
| L409 | `openPurgeModal` | UI |
| L417 | `closePurgeModal` | UI |
| L422 | `toggleBacklogDangerZone` | UI |
| L428 | `openResetBacklogModal` | UI |
| L438 | `closeResetBacklogModal` | UI |
| L443 | `confirmResetBacklog` |  |
| L460 | `toggleSidebarDanger` | UI |
| L466 | `resetContextData` |  |
| L486 | `resetHtmlMapData` |  |
| L506 | `_calcPurgeCount` | Internal |
| L518 | `updatePurgePreview` |  |
| L537 | `confirmPurge` |  |
| L554 | `importData` | Export / Import |
| L571 | `_importCountSessions` | Internal |
| L575 | `_showImportDiff` | Internal |
| L582 | `currentNames` |  |
| L583 | `newAIs` |  |
| L584 | `existingAIs` |  |
| L595 | `sessToAdd` |  |
| L611 | `backupMeta` |  |
| L613 | `localMeta` |  |
| L648 | `closeImportDiff` | UI |
| L653 | `confirmImport` |  |
| L668 | `mergedAIIds` |  |
| L691 | `mergedProjIds` |  |
| L723 | `allCurrentSessIds` |  |
| L727 | `targetProj` |  |
| L744 | `backupMeta` |  |
| L757 | `localMeta` |  |
| L762 | `localMeta` |  |
| L787 | `totalSess` |  |
| L799 | `openPasteItems` | UI |
| L804 | `closePasteItems` | UI |
| L809 | `piDragOver` |  |
| L813 | `piDragLeave` |  |
| L816 | `piDrop` |  |
| L829 | `_piDetectType` | Internal |
| L841 | `_piParseField` | Internal |
| L849 | `_piParseAC` | Internal |
| L860 | `piParse` |  |
| L916 | `piRenderPreview` |  |
| L928 | `selected` |  |
| L933 | `nNew` |  |
| L934 | `nUpdate` |  |
| L935 | `nWarn` |  |
| L996 | `piToggleCard` |  |
| L1004 | `piToggle` |  |
| L1007 | `selected` |  |
| L1012 | `piEditTitle` |  |
| L1013 | `piEditType` |  |
| L1014 | `piEditStatus` |  |
| L1016 | `piDeleteItem` |  |
| L1025 | `piConfirm` |  |
| L1026 | `toAdd` |  |
| L1042 | `existingIdx` |  |
| L1096 | `_refreshParentIdDropdown` | Internal |
| L1105 | `rItems` |  |
| L1111 | `_activeSprint` | Internal |
| L1117 | `openItemEditor` | UI |
| L1215 | `_ieAutofillFromPaste` | Internal |
| L1279 | `get` | Utils |
| L1333 | `_ieHighlightAutofilled` | Internal |
| L1345 | `closeItemEditor` | UI |
| L1351 | `confirmItemEditor` |  |
| L1384 | `item` |  |
| L1389 | `collision` |  |
| L1416 | `collision` |  |
| L1524 | `_loadCustomTemplates` | Internal |
| L1533 | `_saveCustomTemplates` | Internal |
| L1541 | `_getAllTemplates` | Internal |
| L1546 | `openTemplatePicker` | UI |
| L1553 | `closeTemplatePicker` | UI |
| L1558 | `_renderTemplatePicker` | Internal |
| L1563 | `predefined` |  |
| L1564 | `custom` |  |
| L1566 | `renderGroup` | Render |
| L1595 | `_applyTemplate` | Internal |
| L1621 | `_deleteCustomTemplate` | Internal |
| L1629 | `saveCurrentItemAsTemplate` | Save / Load |
| L1662 | `toggleTplSavePanel` | UI |
| L1682 | `getNextOccurrence` | Utils |
| L1690 | `_resetExpired` | Internal |
| L1700 | `getCD` | Utils |
| L1746 | `openTagModal` | UI |
| L1754 | `renderTagPicker` | Render |
| L1771 | `renderColorPicker` | Render |
| L1778 | `selectColor` |  |
| L1779 | `toggleTagOnSession` | UI |
| L1789 | `addNewTag` |  |
| L1804 | `openPendPanel` | UI |
| L1809 | `withPending` |  |
| L1826 | `closePendPanel` | UI |
| L1832 | `openStandaloneCheckpoint` | UI |
| L1844 | `closeStandaloneCheckpoint` | UI |
| L1856 | `openDocLog` | UI |
| L1872 | `closeDocLog` | UI |
| L1883 | `_updateDocLogCount` | Internal |
| L1894 | `_renderDocLog` | Internal |
| L1920 | `clearDocLog` |  |
| L1935 | `_toggleSearchScope` | Internal |
| L1941 | `onSearch` | Events |
| L1961 | `_esc` | Internal |
| L1962 | `hlText` |  |
| L2051 | `hasSessMatch` |  |
| L2056 | `matchSessIds` |  |
| L2060 | `match` |  |
| L2219 | `snippet` |  |
| L2262 | `getAnalyticsColor` | Utils |
| L2272 | `setCompareProject` | Utils |
| L2276 | `setCompareProjectA` | Utils |
| L2280 | `setCompareProjectB` | Utils |
| L2284 | `clearComparison` |  |
| L2290 | `setAnalyticsPeriod` | Utils |
| L2301 | `setAnalyticsRange` | Utils |
| L2306 | `setCfProject` | Utils |
| L2307 | `setCfType` | Utils |
| L2310 | `_getPeriodBounds` | Internal |
| L2337 | `_sessInRange` | Internal |
| L2347 | `_periodLabel` | Internal |
| L2362 | `_prevPeriodLabel` | Internal |
| L2381 | `_delta` | Internal |
| L2393 | `_getWeeksInPeriod` | Internal |
| L2402 | `_getIntervalsInPeriod` | Internal |
| L2439 | `lastNMonths` |  |
| L2450 | `getAnalyticsMonths` | Utils |
| L2453 | `fmtMonth` |  |
| L2460 | `sessionYM` |  |
| L2469 | `_parseSpanishDate` | Internal |
| L2488 | `sessionDateKey` |  |
| L2498 | `getTooltip` | Utils |
| L2507 | `showAnalyticsTooltip` | UI |
| L2509 | `total` |  |
| L2530 | `_posTooltip` | Internal |
| L2543 | `hideAnalyticsTooltip` | UI |
| L2551 | `_animateCountUp` | Internal |
| L2561 | `easeOut` |  |
| L2563 | `tick` |  |
| L2595 | `renderProyectos` | Render |
| L2600 | `activeProjects` |  |
| L2601 | `archivedProjects` |  |
| L2605 | `_weekStart` | Internal |
| L2615 | `_projSessions` | Internal |
| L2619 | `_sessThisWeek` | Internal |
| L2627 | `_lastSession` | Internal |
| L2634 | `_trend` | Internal |
| L2639 | `recent` |  |
| L2640 | `prev` |  |
| L2649 | `_relTimeShort` | Internal |
| L2664 | `_backlogStats` | Internal |
| L2672 | `rCodesWithChildren` |  |
| L2673 | `countable` |  |
| L2677 | `total` |  |
| L2678 | `done` |  |
| L2679 | `pending` |  |
| L2680 | `highPending` |  |
| L2681 | `next` |  |
| L2686 | `_typeColor` | Internal |
| L2694 | `_effortDots` | Internal |
| L2699 | `_buildCard` | Internal |
| L2821 | `count` |  |
| L2862 | `lastAI` |  |
| L2936 | `sortedActiveProjects` |  |
| L2945 | `activeCardsHtml` |  |
| L2963 | `_calcProjVelocity` | Internal |
| L2968 | `recent` |  |
| L2973 | `_estimateSprintClose` | Internal |
| L2986 | `_suggestionProj` | Internal |
| L2987 | `candidates` |  |
| L2989 | `scored` |  |
| L3001 | `allHighPending` |  |
| L3037 | `_proyDeleteInline` | Internal |
| L3043 | `_proyDeleteExecute` | Internal |
| L3056 | `_proyAbrir` | Internal |
| L3072 | `_closedItemsInRange` | Internal |
| L3091 | `_openedItemsInRange` | Internal |
| L3109 | `_closedItemsDetailInRange` | Internal |
| L3130 | `_openedItemsDetailInRange` | Internal |
| L3150 | `exportWeeklySummary` | Export / Import |
| L3184 | `fmtDate` |  |
| L3212 | `_wi_fmt` | Internal |
| L3264 | `_runDigestToasts` | Internal |
| L3296 | `blockedCount` |  |
| L3322 | `_buildCumulativeFlowChart` | Internal |
| L3347 | `timestamps` |  |
| L3362 | `buildPoints` | Builder |
| L3392 | `maxVal` |  |
| L3395 | `xOf` |  |
| L3396 | `yOf` |  |
| L3399 | `buildPath` | Builder |
| L3407 | `areaFill` |  |
| L3439 | `yTicks` |  |
| L3444 | `fmtDate` |  |
| L3458 | `sprintLines` |  |
| L3460 | `idx` |  |
| L3531 | `renderAnalytics` | Render |
| L3564 | `_dominantProject` | Internal |
| L3573 | `_activeProjectCount` | Internal |
| L3586 | `_filesKpi` | Internal |
| L3607 | `activeDays` |  |
| L3623 | `_buildBarChart` | Internal |
| L3628 | `projIds` |  |
| L3636 | `intervalData` |  |
| L3646 | `maxTotal` |  |
| L3658 | `yOf` |  |
| L3659 | `xOf` |  |
| L3663 | `_shouldShowLabel` | Internal |
| L3670 | `_intervalLabel` | Internal |
| L3680 | `_intervalTooltipLabel` | Internal |
| L3746 | `legendItems` |  |
| L3760 | `_kpiEmptyExtra` | Internal |
| L3775 | `_activeDaysPrev` | Internal |
| L3789 | `_totalPendingItems` | Internal |
| L3808 | `_sparklineForIntervals` | Internal |
| L3813 | `_sparkSessions` | Internal |
| L3814 | `_sparkClosed` | Internal |
| L3815 | `_sparkOpened` | Internal |
| L3816 | `_sparkEfficiency` | Internal |
| L3825 | `_kpiCard` | Internal |
| L3846 | `pts` |  |
| L3892 | `_projMetricsSbs` | Internal |
| L3893 | `files` |  |
| L3898 | `prevFiles` |  |
| L3903 | `days` |  |
| L3904 | `prevDays` |  |
| L3917 | `_sessForProj` | Internal |
| L3936 | `_cmpRow` | Internal |
| L3987 | `_buildCompareSelector` | Internal |
| L4007 | `_cycleTimeData` | Internal |
| L4039 | `avg` |  |
| L4076 | `existing` |  |
| L4113 | `_ctDaysLabel` | Internal |
| L4118 | `_ctTrendHtml` | Internal |
| L4125 | `_ctSparkHtml` | Internal |
| L4128 | `vals` |  |
| L4132 | `pts` |  |
| L4148 | `_ctOutliersHtml` | Internal |
| L4456 | `_getAnalyticsAIs` | Internal |
| L4470 | `renderHeatmap` | Render |
| L4514 | `levelClass` |  |
| L4532 | `firstDay` |  |
| L4541 | `cell` |  |
| L4558 | `labelsHtml` |  |
| L4563 | `legendCells` |  |
| L4595 | `_buildHourlyInsightData` | Internal |
| L4635 | `renderHourly` | Render |
| L4658 | `bars` |  |
| L4672 | `_fmt2` | Internal |
| L4728 | `renderProductivityPatterns` | Render |
| L4740 | `_closedForProj` | Internal |
| L4763 | `_makeEntry` | Internal |
| L4817 | `_peakDow` | Internal |
| L4823 | `_peakHour` | Internal |
| L4830 | `_miniDowBar` | Internal |
| L4842 | `_miniHourBar` | Internal |
| L4859 | `rows` |  |
| L4902 | `renderCheckpointsByProject` | Render |
| L4931 | `_addToProj` | Internal |
| L4979 | `maxTotal` |  |
| L4981 | `rowsHtml` |  |
| L5029 | `exportAnalyticsMd` | Export / Import |
| L5035 | `rows` |  |
| L5037 | `count` |  |
| L5044 | `totalSess` |  |
| L5065 | `monthRows` |  |
| L5103 | `getAIColor` | Utils |
| L5104 | `idx` |  |
| L5109 | `isMobile` |  |
| L5113 | `setViewMode` | Utils |
| L5114 | `applyViewMode` |  |
| L5120 | `renderProject` | Render |
| L5134 | `sourceAIs` |  |
| L5162 | `scopeAIs` |  |
| L5176 | `uniqueAIs` |  |
| L5206 | `_lastNextStep` | Internal |
| L5288 | `done` |  |
| L5289 | `totalEffort` |  |
| L5290 | `doneEffort` |  |
| L5321 | `_renderCtxPreview` | Internal |
| L5362 | `_buildCtxEl` | Internal |
| L5402 | `typeColor` |  |
| L5453 | `typeColor` |  |
| L5548 | `_renderDecisionsSection` | Internal |
| L5549 | `sorted` |  |
| L5550 | `rowsHtml` |  |
| L5587 | `_projOpenAddDecision` | Internal |
| L5599 | `_projSaveDecision` | Internal |
| L5611 | `dec` |  |
| L5623 | `_projCancelDecision` | Internal |
| L5629 | `_projEditDecision` | Internal |
| L5646 | `_projDeleteDecision` | Internal |
| L5649 | `idx` |  |
| L5659 | `_qnNavToItem` | Internal |
| L5674 | `_projCtxStartEdit` | Internal |
| L5695 | `_projCtxSave` | Internal |
| L5707 | `_projCtxCancelEdit` | Internal |
| L5711 | `_projCtxToggleSec` | Internal |
| L5720 | `_projToggleAIFilter` | Internal |
| L5725 | `_projViewSearchInput` | Internal |
| L5733 | `_toggleProjAnalytics` | Internal |
| L5743 | `renderProjectAnalytics` | Render |
| L5750 | `projAIIds` |  |
| L5751 | `projAIs` |  |
| L5762 | `monthLabels` |  |
| L5764 | `counts` |  |
| L5770 | `barsHtml` |  |
| L5781 | `aiRanks` |  |
| L5784 | `rankHtml` |  |
| L5792 | `daySet` |  |
| L5842 | `downloadProjectReport` | Export / Import |
| L5846 | `projAIIds` |  |
| L5847 | `projAIs` |  |
| L5899 | `toggleProjectSection` | UI |
| L5914 | `restoreDrafts` |  |
| L5939 | `_updateSubTabButtons` | Internal |
| L5948 | `backlogBootstrapped` |  |
| L6016 | `switchSubTab` |  |
| L6038 | `_docsOnboardingSteps` | Internal |
| L6065 | `_renderDocsOnboarding` | Internal |
| L6078 | `doneCount` |  |
| L6097 | `stepsHtml` |  |
| L6117 | `_docsOnboardingAction` | Internal |
| L6123 | `_dismissDocsOnboarding` | Internal |
| L6133 | `_renderTplProjBanner` | Internal |
| L6151 | `importHtmlMap` | Export / Import |
| L6184 | `parseHtmlMapMd` | Parser |
| L6256 | `loadHtmlMap` | Save / Load |
| L6262 | `exportHtmlMapMd` | Export / Import |
| L6298 | `parseContextMd` | Parser |
| L6333 | `importContextMd` | Export / Import |
| L6338 | `_importContextMdFromText` | Internal |
| L6362 | `updateContextBanner` |  |
| L6376 | `renderContextStatus` | Render |
| L6378 | `_importContextMdFromFile` | Internal |
| L6387 | `_dropzoneHandle` | Internal |
| L6403 | `_setContextModified` | Internal |
| L6422 | `_clearContextModifiedBadge` | Internal |
| L6434 | `_setHtmlMapModified` | Internal |
| L6451 | `_clearHtmlMapModifiedBadge` | Internal |
| L6462 | `updateHtmlMapModificationBadge` |  |
| L6480 | `_setBacklogModified` | Internal |
| L6493 | `updateBacklogModificationBadge` |  |
| L6509 | `extractContextSections` |  |
| L6531 | `mergeContextSections` |  |
| L6533 | `_ctxKey` | Internal |
| L6537 | `conflicts` |  |
| L6541 | `names` |  |
| L6565 | `vMatch` |  |
| L6580 | `extractHtmlMapSections` |  |
| L6599 | `mergeHtmlMapSections` |  |
| L6601 | `_mapKey` | Internal |
| L6629 | `renderContext` | Render |
| L6666 | `_renderContextSections` | Internal |
| L6703 | `onContextSearch` | Events |
| L6711 | `clearContextSearch` |  |
| L6719 | `contextShowImport` |  |
| L6726 | `toggleContextSection` | UI |
| L6732 | `renderContextMd` | Render |
| L6741 | `flushTable` |  |
| L6792 | `renderContextInline` | Render |
| L6810 | `_planKey` | Internal |
| L6813 | `savePlan` | Save / Load |
| L6818 | `loadPlan` | Save / Load |
| L6828 | `renderPlan` | Render |
| L6858 | `backlog` |  |
| L6867 | `_statusClass` | Internal |
| L6868 | `_statusLabel` | Internal |
| L6869 | `_liveStatus` | Internal |
| L6870 | `_liveTitle` | Internal |
| L6871 | `_sessIsDone` | Internal |
| L6875 | `_sessIsBlocked` | Internal |
| L6883 | `_connector` | Internal |
| L6891 | `_sessCard` | Internal |
| L6893 | `resolvedItems` |  |
| L6956 | `doneSessions` |  |
| L6957 | `available` |  |
| L6958 | `blocked` |  |
| L6961 | `allCodes` |  |
| L6963 | `doneItems` |  |
| L7025 | `_buildPulsoPlanesHtml` | Internal |
| L7029 | `backlog` |  |
| L7037 | `_liveStatus` | Internal |
| L7044 | `allSessions` |  |
| L7046 | `doneSess` |  |
| L7055 | `activeSprint` |  |
| L7066 | `nextSess` |  |
| L7104 | `_ctrKey` | Internal |
| L7105 | `_ctrLoad` | Internal |
| L7106 | `_ctrSave` | Internal |
| L7129 | `_ctrMergeFromItem` | Internal |
| L7141 | `existing` |  |
| L7164 | `_ctrUpdateBadge` | Internal |
| L7176 | `onContratosSearch` | Events |
| L7184 | `clearContratosSearch` |  |
| L7194 | `_ctrIsRisk` | Internal |
| L7197 | `activeSprints` |  |
| L7199 | `sorted` |  |
| L7205 | `renderContratos` | Render |
| L7264 | `openContratoDetail` | UI |
| L7269 | `_esc` | Internal |
| L7271 | `_renderContratoDetail` | Internal |
| L7278 | `rows` |  |
| L7316 | `exportContratosMd` | Export / Import |
| L7321 | `pad` |  |
| L7359 | `resetContratosData` |  |
| L7368 | `searchContratos` |  |

## ai-tracker-backlog.js (6,682 líneas)

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
| L358 | `_cvLoad` | Internal |
| L361 | `_cvSave` | Internal |
| L367 | `toggleCollapseAll` | UI |
| L389 | `toggleBacklogBlockerFilter` | UI |
| L399 | `toggleDepsFilter` | UI |
| L411 | `_hasDepsBlocked` | Internal |
| L414 | `dep` |  |
| L421 | `_isBlocked` | Internal |
| L433 | `_hasRecentSession` | Internal |
| L447 | `_calcPriority` | Internal |
| L461 | `_applyAllPriorities` | Internal |
| L471 | `_calcRelevanceScore` | Internal |
| L533 | `_recalcAllScores` | Internal |
| L544 | `_sanitizePendingInClosedSprints` | Internal |
| L590 | `loadBacklog` | Save / Load |
| L624 | `itemType` |  |
| L632 | `clearTypeFilters` |  |
| L638 | `toggleTypeFilter` | UI |
| L666 | `updateTypeFilterUI` |  |
| L685 | `toggleStatusFilter` | UI |
| L708 | `updateStatusFilterUI` |  |
| L721 | `toggleVersionCollapse` | UI |
| L732 | `_getNextItemCode` | Internal |
| L753 | `parseBacklogMd` | Parser |
| L773 | `get` | Utils |
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
| L1087 | `stillBlocked` |  |
| L1089 | `blocker` |  |
| L1118 | `_resetStatusSelect` | Internal |
| L1127 | `effortDots` |  |
| L1134 | `_isCountableItem` | Internal |
| L1135 | `rCodesWithChildren` |  |
| L1140 | `renderStats` | Render |
| L1145 | `isInClosedSprint` |  |
| L1147 | `_countable` | Internal |
| L1149 | `countableItems` |  |
| L1158 | `visible` |  |
| L1183 | `backlogCount` |  |
| L1184 | `done` |  |
| L1186 | `descartadoCount` |  |
| L1190 | `pIdeasCount` |  |
| L1257 | `buildItemRefs` | Builder |
| L1266 | `chips` |  |
| L1276 | `toggleItemExpand` | UI |
| L1295 | `toggleSectionGroup` | UI |
| L1305 | `clearAllFilters` |  |
| L1335 | `toggleEffortFilter` | UI |
| L1361 | `updateEffortFilterUI` |  |
| L1378 | `setItemRole` | Utils |
| L1379 | `item` |  |
| L1392 | `toggleRoleFilter` | UI |
| L1405 | `togglePriorityFilter` | UI |
| L1416 | `updatePriorityFilterUI` |  |
| L1422 | `updateRoleFilterUI` |  |
| L1430 | `_getActiveRoles` | Internal |
| L1437 | `_buildRoleChips` | Internal |
| L1440 | `noneCount` |  |
| L1441 | `chips` |  |
| L1454 | `onBacklogSortChange` | Events |
| L1462 | `toggleSortDir` | UI |
| L1473 | `_getMiViewRoles` | Internal |
| L1484 | `_getMiViewLabel` | Internal |
| L1492 | `toggleBacklogFooter` | UI |
| L1500 | `toggleBacklogMikeMode` | UI |
| L1526 | `toggleBacklogKanbanMode` | UI |
| L1546 | `toggleBacklogTreeMode` | UI |
| L1560 | `toggleBacklogFocusMode` | UI |
| L1578 | `toggleBacklogNoAcMode` | UI |
| L1590 | `toggleChildrenBlock` | UI |
| L1603 | `setItemParent` | Utils |
| L1604 | `item` |  |
| L1615 | `updateClearFilterBtn` |  |
| L1632 | `_chip` | Internal |
| L1636 | `excluded` |  |
| L1672 | `_statusPills` | Internal |
| L1691 | `toggleSprintHealthPanel` | UI |
| L1704 | `toggleClosedSprintsBody` | UI |
| L1709 | `_calcEstimatedVelocity` | Internal |
| L1714 | `sprintData` |  |
| L1715 | `spItems` |  |
| L1716 | `planned` |  |
| L1717 | `real` |  |
| L1721 | `reals` |  |
| L1722 | `avg` |  |
| L1728 | `_buildSprintHealthPanel` | Internal |
| L1742 | `sprintItems` |  |
| L1746 | `doneItems` |  |
| L1750 | `blockedItems` |  |
| L1752 | `totalEffort` |  |
| L1753 | `doneEffort` |  |
| L1790 | `trendRows` |  |
| L1877 | `roadmapGoToSprint` |  |
| L1921 | `_buildSprintSelector` | Internal |
| L1926 | `activeSprint` |  |
| L1927 | `openSprints` | UI |
| L1928 | `closedSprints` | UI |
| L1934 | `total` |  |
| L1935 | `done` |  |
| L1955 | `_buildOption` | Internal |
| L1962 | `total` |  |
| L1963 | `done` |  |
| L2005 | `_blSprintOpen` | Internal |
| L2015 | `activeSprint` |  |
| L2016 | `openSprints` | UI |
| L2017 | `closedSprints` | UI |
| L2019 | `_buildOption` | Internal |
| L2026 | `total` |  |
| L2027 | `done` |  |
| L2074 | `_blSprintClose` | Internal |
| L2087 | `_blSprintSelect` | Internal |
| L2093 | `_blSprintToggleClosed` | Internal |
| L2105 | `_renderSprintRoadmap` | Internal |
| L2117 | `renderBacklogList` | Render |
| L2244 | `filtered` |  |
| L2305 | `pendienteFiltered` |  |
| L2307 | `sorted` |  |
| L2346 | `_sortGroup` | Internal |
| L2356 | `_sortItems` | Internal |
| L2390 | `ideaItems` |  |
| L2391 | `pendienteItems` |  |
| L2439 | `hasAnyItem` |  |
| L2445 | `doneInGroup` |  |
| L2446 | `totalInGroup` |  |
| L2461 | `_sprintAllItems` | Internal |
| L2485 | `doneInGroup` |  |
| L2486 | `totalInGroup` |  |
| L2516 | `_sprintAllItems` | Internal |
| L2518 | `_doneCount` | Internal |
| L2519 | `_descCount` | Internal |
| L2546 | `blockingItems` |  |
| L2713 | `archiveClosedItems` |  |
| L2742 | `renderArchivoHistorico` | Render |
| L2743 | `historicos` |  |
| L2746 | `isOpen` |  |
| L2747 | `activeView` |  |
| L2791 | `toggleArchivoHistorico` | UI |
| L2809 | `activeView` |  |
| L2817 | `setArchivoView` | Utils |
| L2827 | `_renderArchivoBody` | Internal |
| L2839 | `_renderArchivoViewSprint` | Internal |
| L2840 | `historicos` |  |
| L2846 | `noSprint` |  |
| L2856 | `spItems` |  |
| L2860 | `entryOpen` |  |
| L2884 | `nsOpen` |  |
| L2905 | `_renderArchivoViewFlat` | Internal |
| L2906 | `historicos` |  |
| L2920 | `_toggleArchSprintEntry` | Internal |
| L2951 | `_renderKanban` | Internal |
| L2960 | `_kanbanStatus` | Internal |
| L2969 | `allFiltered` |  |
| L2999 | `_kanbanCard` | Internal |
| L3004 | `dots` |  |
| L3060 | `_kbDrop` | Internal |
| L3076 | `_kbCardClick` | Internal |
| L3079 | `item` |  |
| L3085 | `_attachBacklogDnD` | Internal |
| L3119 | `fromIdx` |  |
| L3120 | `toIdx` |  |
| L3134 | `_inlineEditTitle` | Internal |
| L3137 | `item` |  |
| L3150 | `_commit` | Internal |
| L3160 | `_cancel` | Internal |
| L3175 | `_buildChildrenBlock` | Internal |
| L3177 | `allChildren` |  |
| L3179 | `children` |  |
| L3186 | `doneCount` |  |
| L3190 | `childRows` |  |
| L3228 | `_confirmUnlinkChild` | Internal |
| L3235 | `item` |  |
| L3241 | `_buildItemTimestamps` | Internal |
| L3242 | `_fmt` | Internal |
| L3261 | `_iso` | Internal |
| L3271 | `_buildItemPOriginBlock` | Internal |
| L3273 | `pItem` |  |
| L3283 | `_buildItemOriginBlock` | Internal |
| L3288 | `foundSess` |  |
| L3297 | `_fmtSessDate` | Internal |
| L3334 | `buildBacklogItem` | Builder |
| L3371 | `effortDotsHtml` |  |
| L3397 | `childCount` |  |
| L3398 | `childDoneCount` |  |
| L3537 | `_rLabel` | Internal |
| L3538 | `currentParent` |  |
| L3539 | `ghostOption` |  |
| L3580 | `_classify` | Internal |
| L3585 | `_acRows` | Internal |
| L3586 | `ambig` |  |
| L3631 | `_promoteItem` | Internal |
| L3632 | `item` |  |
| L3667 | `_promoteSelectType` | Internal |
| L3677 | `_promoteConfirm` | Internal |
| L3679 | `originItem` |  |
| L3732 | `_promoteTtoR` | Internal |
| L3733 | `item` |  |
| L3759 | `_promoteTtoRConfirm` | Internal |
| L3760 | `originItem` |  |
| L3811 | `copyItemCode` |  |
| L3836 | `copyItemToClipboard` |  |
| L3838 | `item` |  |
| L3868 | `tagNames` |  |
| L3878 | `_feedback` | Internal |
| L3901 | `toggleAc` | UI |
| L3909 | `setFilter` | Utils |
| L3917 | `onBacklogSearch` | Events |
| L3927 | `clearBacklogSearch` |  |
| L3938 | `updateBacklogFooter` |  |
| L3945 | `countable` |  |
| L3946 | `total` |  |
| L3947 | `pend` |  |
| L3948 | `done` |  |
| L3949 | `pIdeas` |  |
| L3970 | `cnt` |  |
| L3988 | `_isPlaceholderCode` | Internal |
| L3997 | `_findTmpMatch` | Internal |
| L4007 | `common` |  |
| L4017 | `mergeBacklogFromTG` |  |
| L4043 | `dupExisting` |  |
| L4081 | `existing` |  |
| L4140 | `newBB` |  |
| L4220 | `pParent` |  |
| L4273 | `showMergeDiffPanel` | UI |
| L4307 | `_pill` | Internal |
| L4310 | `_card` | Internal |
| L4330 | `_retrocedoRow` | Internal |
| L4345 | `_discardRow` | Internal |
| L4366 | `_section` | Internal |
| L4379 | `rows` |  |
| L4384 | `rows` |  |
| L4393 | `rows` |  |
| L4402 | `rows` |  |
| L4406 | `rows` |  |
| L4413 | `rows` |  |
| L4417 | `rows` |  |
| L4421 | `ignoredCritical` |  |
| L4422 | `ignoredOk` |  |
| L4424 | `rows` |  |
| L4434 | `rows` |  |
| L4542 | `hasDescartes` |  |
| L4543 | `hasDescartesConRazon` |  |
| L4643 | `_mdiffDoApply` | Internal |
| L4649 | `item` |  |
| L4663 | `item` |  |
| L4733 | `_mdiffKeyHandler` | Internal |
| L4752 | `_showStatusConfirmModal` | Internal |
| L4786 | `_confirmRetroceso` | Internal |
| L4787 | `item` |  |
| L4814 | `_confirmDiscard` | Internal |
| L4815 | `item` |  |
| L4870 | `_applyDiscardBatch` | Internal |
| L4874 | `item` |  |
| L4907 | `_tgStatusToBacklog` | Internal |
| L4912 | `_normalizeStatus` | Internal |
| L4926 | `_isActiveRecently` | Internal |
| L4943 | `_getActiveSprint` | Internal |
| L4947 | `_getSprintById` | Internal |
| L4951 | `_nextSprintId` | Internal |
| L4960 | `_isValidSprintName` | Internal |
| L4965 | `createSprint` | Builder |
| L4993 | `_generateSprintRetroMd` | Internal |
| L4998 | `pad` |  |
| L5004 | `sprintItems` |  |
| L5005 | `doneItems` |  |
| L5006 | `pendItems` |  |
| L5008 | `totalEffort` |  |
| L5009 | `doneEffort` |  |
| L5010 | `pendEffort` |  |
| L5019 | `_itemRow` | Internal |
| L5039 | `spSessions` |  |
| L5044 | `sessRows` |  |
| L5119 | `openSprintRetroView` | UI |
| L5125 | `pad` |  |
| L5172 | `closeSprintRetroOverlay` | UI |
| L5178 | `_openRetroDownloadPrompt` | Internal |
| L5183 | `pad` |  |
| L5223 | `setSprintStatus` | Utils |
| L5274 | `setItemSprint` | Utils |
| L5276 | `item` |  |
| L5290 | `openNewSprintInline` | UI |
| L5310 | `confirmNewSprint` |  |
| L5320 | `editSprintInline` |  |
| L5341 | `confirmEditSprint` |  |
| L5364 | `confirmCloseSprint` |  |
| L5368 | `pendingItems` |  |
| L5369 | `doneItems` |  |
| L5395 | `closeCloseSprintModal` | UI |
| L5402 | `_scmBack` | Internal |
| L5410 | `_scmNext` | Internal |
| L5422 | `_scmBulkApply` | Internal |
| L5434 | `_scmRender` | Internal |
| L5483 | `_scmStep1Html` | Internal |
| L5484 | `totalItems` |  |
| L5485 | `doneCount` |  |
| L5488 | `totalEffort` |  |
| L5489 | `doneEffort` |  |
| L5492 | `doneRows` |  |
| L5499 | `pendRows` |  |
| L5533 | `_scmStep2Html` | Internal |
| L5535 | `activeSp` |  |
| L5550 | `rows` |  |
| L5575 | `_scmStep3Html` | Internal |
| L5576 | `doneCount` |  |
| L5577 | `discardedCount` |  |
| L5580 | `toSprint` |  |
| L5581 | `toUnassign` |  |
| L5582 | `toDiscard` |  |
| L5584 | `itemRow` |  |
| L5592 | `spLabel` |  |
| L5658 | `_scmExecuteClose` | Internal |
| L5679 | `processedCodes` |  |
| L5715 | `createSprintFromGroup` | Builder |
| L5728 | `navigateToItem` |  |
| L5731 | `item` |  |
| L5752 | `_buildItemMentionedIn` | Internal |
| L5755 | `mentions` |  |
| L5760 | `_fmtRel` | Internal |
| L5778 | `rows` |  |
| L5798 | `_buildItemMigratedBlock` | Internal |
| L5809 | `_openMigrateItem` | Internal |
| L5810 | `item` |  |
| L5852 | `_confirmMigrateItem` | Internal |
| L5858 | `item` |  |
| L5896 | `_backlogSetSelected` | Internal |
| L5916 | `item` |  |
| L5958 | `toggleFocusMode` | UI |
| L5970 | `exitFocusMode` |  |
| L5984 | `openItemPanel` | UI |
| L5985 | `item` |  |
| L6010 | `closeItemPanel` | UI |
| L6031 | `_itemPanelEscHandler` | Internal |
| L6054 | `_renderItemPanel` | Internal |
| L6151 | `linkedSessions` |  |
| L6187 | `blockedByPending` |  |
| L6188 | `blockedByDone` |  |
| L6189 | `blockingOthers` |  |
| L6191 | `_depsChip` | Internal |
| L6192 | `dep` |  |
| L6234 | `_buildPanelTimeline` | Internal |
| L6235 | `_fmt` | Internal |
| L6254 | `_iso` | Internal |
| L6331 | `alreadyHasDone` |  |
| L6374 | `rows` |  |
| L6408 | `_idpStartEditTitle` | Internal |
| L6412 | `item` |  |
| L6421 | `_idpSaveTitle` | Internal |
| L6425 | `item` |  |
| L6447 | `_idpCancelTitle` | Internal |
| L6455 | `_idpSetField` | Internal |
| L6456 | `item` |  |
| L6474 | `_itemPanelNotesDirty` | Internal |
| L6481 | `item` |  |
| L6490 | `_idpToggleAc` | Internal |
| L6499 | `_idpToggleHistory` | Internal |
| L6508 | `_idpCopyCode` | Internal |
| L6513 | `_idpMarkDone` | Internal |
| L6515 | `item` |  |
| L6522 | `_idpUnlinkSession` | Internal |
| L6524 | `sess` |  |
| L6529 | `item` |  |
| L6535 | `_idpAddNote` | Internal |
| L6536 | `item` |  |
| L6547 | `_idpAddNote_fromBtn` | Internal |
| L6558 | `_acvToggle` | Internal |
| L6569 | `_acvStartEdit` | Internal |
| L6572 | `item` |  |
| L6587 | `_acvSaveEdit` | Internal |
| L6592 | `item` |  |
| L6602 | `_acvConfirm` | Internal |
| L6603 | `item` |  |
| L6617 | `toggleTmplTriggerPanel` | UI |
| L6629 | `_resetTmplTriggerPanel` | Internal |
| L6640 | `_tryPatch` | Internal |

## ai-tracker-checkpoint.js (7,160 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L10 | `_effectiveVersion` | Internal |
| L21 | `_hasStaleSuggestion` | Internal |
| L30 | `hasInProgress` |  |
| L53 | `setSyncStatus` | Utils |
| L78 | `handleSyncPillClick` | Events |
| L145 | `_offlineQueue` | Internal |
| L150 | `_offlineQueueSave` | Internal |
| L155 | `_offlineQueuePush` | Internal |
| L157 | `idx` |  |
| L164 | `_offlineQueueFlush` | Internal |
| L218 | `_refreshMigrationBtnVisibility` | Internal |
| L223 | `signInWithSupabase` |  |
| L243 | `poll` |  |
| L265 | `signOutSupabase` |  |
| L277 | `openAuthModal` | UI |
| L290 | `closeAuthModal` | UI |
| L296 | `signInWithMagicLink` |  |
| L327 | `getSupabaseUserId` | Utils |
| L334 | `_scrollToCard` | Internal |
| L339 | `navigateToCard` |  |
| L350 | `switchTab` |  |
| L408 | `esc` |  |
| L412 | `_slugify` | Internal |
| L424 | `_loadTmpIdMap` | Internal |
| L440 | `_saveTmpIdMap` | Internal |
| L444 | `_assignPendingIds` | Internal |
| L452 | `_norm` | Internal |
| L454 | `existingTitleMap` |  |
| L524 | `showCheckpointPanel` | UI |
| L536 | `rows` |  |
| L549 | `rows` |  |
| L570 | `_renderCkptDiffPanel` | Internal |
| L576 | `confirmedCount` |  |
| L582 | `retroRows` |  |
| L599 | `discardRows` |  |
| L664 | `item` |  |
| L673 | `item` |  |
| L685 | `appliedRetro` |  |
| L686 | `appliedDiscard` |  |
| L697 | `_ckptDiffCleanup` | Internal |
| L715 | `_renderFieldDiff` | Internal |
| L722 | `removed` |  |
| L723 | `added` |  |
| L724 | `kept` |  |
| L742 | `rows` |  |
| L768 | `rows` |  |
| L782 | `rows` |  |
| L796 | `rows` |  |
| L810 | `rows` |  |
| L836 | `togglePasteHelp` | UI |
| L842 | `_updateCkptReopenBtn` | Internal |
| L848 | `closeCkptPanel` | UI |
| L856 | `_pauseCkptTimer` | Internal |
| L864 | `_resumeCkptTimer` | Internal |
| L885 | `_toastDuration` | Internal |
| L900 | `_toastVisibleCount` | Internal |
| L906 | `_toastRender` | Internal |
| L982 | `_touchResume` | Internal |
| L1007 | `showToast` | UI |
| L1025 | `_dismissToast` | Internal |
| L1037 | `_toastNext` | Internal |
| L1047 | `showToastDigest` | UI |
| L1059 | `toast` |  |
| L1065 | `showToastInline` | UI |
| L1095 | `_hideInline` | Internal |
| L1105 | `toggleTheme` | UI |
| L1110 | `applyTheme` |  |
| L1127 | `_saveFlush` | Internal |
| L1199 | `save` | Save / Load |
| L1238 | `saveImmediate` | Save / Load |
| L1246 | `_saveSessions` | Internal |
| L1277 | `_blogLog` | Internal |
| L1286 | `_relTs` | Internal |
| L1295 | `saveBacklog` | Save / Load |
| L1344 | `saveContextDocs` | Save / Load |
| L1377 | `onSearchDispatch` | Events |
| L1401 | `_isV2State` | Internal |
| L1411 | `_migrateV2toV3` | Internal |
| L1416 | `migProj` |  |
| L1448 | `exists` |  |
| L1461 | `existingCodes` |  |
| L1474 | `existingIds` |  |
| L1515 | `_applyStateData` | Internal |
| L1586 | `existingIds` |  |
| L1607 | `clone` |  |
| L1609 | `load` | Save / Load |
| L1637 | `cached` |  |
| L1656 | `_subscribeRealtime` | Internal |
| L1686 | `_unsubscribeRealtime` | Internal |
| L1693 | `_loadFromSupabase` | Internal |
| L1738 | `localSprintMap` |  |
| L1775 | `localIds` |  |
| L1795 | `blMap` |  |
| L1826 | `docMap` |  |
| L1861 | `checkStorageWarn` |  |
| L1868 | `getAI` | Utils |
| L1873 | `getActiveProject` | Utils |
| L1879 | `getProjectSessions` | Utils |
| L1885 | `getAllSessions` | Utils |
| L1896 | `getSessionsByAI` | Utils |
| L1901 | `getProjectForSession` | Utils |
| L1906 | `getActiveTracker` | Utils |
| L1914 | `getActiveSprints` | Utils |
| L1920 | `_projKey` | Internal |
| L1923 | `_tplKey` | Internal |
| L1929 | `countAISessions` |  |
| L1934 | `getLastAISession` | Utils |
| L1943 | `getAISessions` | Utils |
| L1950 | `_findSession` | Internal |
| L1958 | `_findSessionByAI` | Internal |
| L1966 | `updateStats` |  |
| L1981 | `_isInSession` | Internal |
| L1986 | `last` |  |
| L1992 | `renderStatusBar` | Render |
| L1998 | `active` |  |
| L2003 | `sp` |  |
| L2006 | `spDone` |  |
| L2065 | `total` |  |
| L2066 | `done` |  |
| L2108 | `timestamps` |  |
| L2132 | `_notifHistory` | Internal |
| L2136 | `_notifHistoryAdd` | Internal |
| L2164 | `_notifConfig` | Internal |
| L2176 | `_saveNotifConfig` | Internal |
| L2180 | `_notifReadSet` | Internal |
| L2183 | `_notifSaveRead` | Internal |
| L2193 | `hasRecentSession` |  |
| L2213 | `_computeNotifications` | Internal |
| L2219 | `_itemHasRecentSession` | Internal |
| L2377 | `markNotifRead` |  |
| L2389 | `markAllNotifsRead` |  |
| L2402 | `updateTabNotifBadges` |  |
| L2434 | `openNotifConfig` | UI |
| L2457 | `_notifConfigReset` | Internal |
| L2462 | `_notifConfigSetEnabled` | Internal |
| L2470 | `_notifConfigSetThreshold` | Internal |
| L2482 | `_registerNotifActions` | Internal |
| L2485 | `_notifGoto` | Internal |
| L2492 | `_renderNotifSection` | Internal |
| L2500 | `_fmtNotifTs` | Internal |
| L2503 | `pad` |  |
| L2604 | `_rsbToggleCfg` | Internal |
| L2620 | `renderGlobalRadarSidebar` | Render |
| L2627 | `interrupted` |  |
| L2628 | `inSession` |  |
| L2640 | `_sessionElapsed` | Internal |
| L2665 | `_sessionTitle` | Internal |
| L2673 | `_projPill` | Internal |
| L2689 | `_buildSessionCard` | Internal |
| L2731 | `_buildAvailableCard` | Internal |
| L2772 | `_buildExhaustedCard` | Internal |
| L2788 | `notifSection` |  |
| L2886 | `_rsbToggleAgotadas` | Internal |
| L2896 | `rsbFilterAIs` |  |
| L2943 | `rsbClearSearch` |  |
| L2951 | `rsbTogglePin` |  |
| L2960 | `_rsbIsPinned` | Internal |
| L2965 | `toggleRadarSidebar` | UI |
| L2981 | `_initRadarSidebarState` | Internal |
| L3031 | `toggleCollapseAll` | UI |
| L3032 | `active` |  |
| L3033 | `allCollapsed` |  |
| L3044 | `_trackerSetView` | Internal |
| L3070 | `sess` |  |
| L3082 | `_trackerViewPopulateProjects` | Internal |
| L3093 | `_trackerViewProjChange` | Internal |
| L3111 | `_trackerHistDayRender` | Internal |
| L3135 | `sorted` |  |
| L3174 | `rows` |  |
| L3195 | `_trackerHistDaySelect` | Internal |
| L3224 | `_trackerRenderMiniHist` | Internal |
| L3243 | `aiSessions` |  |
| L3301 | `linkedItems` |  |
| L3356 | `_trackerMiniHistSelect` | Internal |
| L3379 | `_getCurrentSession` | Internal |
| L3381 | `aiSess` |  |
| L3383 | `last` |  |
| L3390 | `_buildCurrentSessionCard` | Internal |
| L3395 | `aiSess` |  |
| L3396 | `sessIndex` |  |
| L3412 | `sessionRows` |  |
| L3458 | `selectTrackerAI` |  |
| L3502 | `_renderTrackerSidebar` | Internal |
| L3503 | `nonArchived` |  |
| L3504 | `inSession` |  |
| L3505 | `available` |  |
| L3506 | `exhausted` |  |
| L3507 | `archived` |  |
| L3509 | `mkRow` |  |
| L3571 | `exHtml` |  |
| L3592 | `_timerKey` | Internal |
| L3594 | `_getTimerData` | Internal |
| L3601 | `_setTimerData` | Internal |
| L3605 | `_clearTimerData` | Internal |
| L3609 | `_timerIsActive` | Internal |
| L3615 | `stopSessionTimer` |  |
| L3625 | `startSessionTimer` |  |
| L3633 | `_formatTimer` | Internal |
| L3641 | `_renderTimerInCard` | Internal |
| L3652 | `_refreshTimerTick` | Internal |
| L3660 | `_timerWidgetHtml` | Internal |
| L3674 | `_computeSuggestionScore` | Internal |
| L3679 | `lastSess` |  |
| L3699 | `recentSess` |  |
| L3707 | `_getSuggestedAI` | Internal |
| L3724 | `_highPendingCount` | Internal |
| L3732 | `_buildSuggestionReason` | Internal |
| L3736 | `lastSess` |  |
| L3749 | `renderSuggestionBanner` | Render |
| L3755 | `dismissSuggestionBanner` |  |
| L3760 | `startSuggestedSession` |  |
| L3777 | `_isMonday` | Internal |
| L3779 | `_getMondayKey` | Internal |
| L3787 | `_weeklyAlreadyDismissed` | Internal |
| L3794 | `_markWeeklyDismissed` | Internal |
| L3798 | `_buildWeeklySummary` | Internal |
| L3805 | `lastWeekSess` |  |
| L3816 | `doneLast` |  |
| L3817 | `pendingNow` |  |
| L3833 | `sp` |  |
| L3835 | `spItems` |  |
| L3836 | `spDone` |  |
| L3846 | `_exportWeeklySummaryMd` | Internal |
| L3866 | `dismissWeeklySummary` |  |
| L3872 | `_maybeShowWeeklySummary` | Internal |
| L3879 | `el` |  |
| L3890 | `render` | Render |
| L3915 | `allActive` |  |
| L3917 | `preferred` |  |
| L3941 | `_sortOrder` | Internal |
| L3946 | `aisToRender` |  |
| L3947 | `ai` |  |
| L3969 | `archived` |  |
| L4005 | `buildHoyCard` | Builder |
| L4013 | `sessConHora` |  |
| L4021 | `_availableSinceLabel` | Internal |
| L4088 | `_hoyMarkExhausted` | Internal |
| L4100 | `avgBetweenSessions` |  |
| L4116 | `buildCard` | Builder |
| L4146 | `_buildSessRow` | Internal |
| L4148 | `t` |  |
| L4151 | `tgItems` |  |
| L4213 | `sessThisMonth` |  |
| L4233 | `_projOptions` | Internal |
| L4242 | `_buildUnlockLabel` | Internal |
| L4322 | `sessConHora` |  |
| L4404 | `openQuickCapture` | UI |
| L4416 | `closeQuickModal` | UI |
| L4423 | `quickParseHora` |  |
| L4433 | `quickTitleKey` |  |
| L4438 | `confirmQuickCapture` |  |
| L4497 | `confirmInterruptInline` |  |
| L4511 | `cancelInterruptInline` |  |
| L4520 | `interruptSession` |  |
| L4545 | `dismissInterrupted` |  |
| L4558 | `enterFocusMode` |  |
| L4579 | `exitFocusMode` |  |
| L4593 | `_escCascade` | Internal |
| L4664 | `_hasChordWithG` | Internal |
| L4676 | `_chordDef` | Internal |
| L4800 | `_cur` | Internal |
| L4851 | `_cpHistoryLoad` | Internal |
| L4854 | `_cpHistorySave` | Internal |
| L4857 | `_cpHistoryAdd` | Internal |
| L4864 | `_cpFuzzy` | Internal |
| L4866 | `norm` |  |
| L4879 | `_cpBacklogItems` | Internal |
| L4888 | `_cpCommands` | Internal |
| L4928 | `_cpSessionCommands` | Internal |
| L4956 | `_cpItemCommands` | Internal |
| L4978 | `openCommandPalette` | UI |
| L4988 | `closeCommandPalette` | UI |
| L4993 | `_cpRender` | Internal |
| L5004 | `histIds` |  |
| L5005 | `histCmds` |  |
| L5007 | `rest` |  |
| L5012 | `staticMatches` |  |
| L5036 | `rows` |  |
| L5052 | `_cpHover` | Internal |
| L5059 | `_cpExecute` | Internal |
| L5069 | `_cpKeydown` | Internal |
| L5096 | `_cpInput` | Internal |
| L5127 | `_shortcutsLoad` | Internal |
| L5134 | `_shortcutsSave` | Internal |
| L5139 | `_shortcutKey` | Internal |
| L5141 | `def` |  |
| L5147 | `_shortcutConflict` | Internal |
| L5158 | `_shortcutsRender` | Internal |
| L5171 | `rows` |  |
| L5195 | `_shortcutsStartEdit` | Internal |
| L5196 | `def` |  |
| L5223 | `_shortcutsCaptureKey` | Internal |
| L5235 | `_shortcutsSaveEdit` | Internal |
| L5253 | `conflictDef` |  |
| L5258 | `def` |  |
| L5269 | `_shortcutsResetOne` | Internal |
| L5276 | `restoreDefaultShortcuts` |  |
| L5281 | `openShortcuts` | UI |
| L5290 | `closeShortcuts` | UI |
| L5297 | `openShortcutsRef` | UI |
| L5310 | `rows` |  |
| L5338 | `closeShortcutsRef` | UI |
| L5347 | `_sk` | Internal |
| L5353 | `_saveModalTrigger` | Internal |
| L5358 | `_restoreModalFocus` | Internal |
| L5366 | `_focusFirstInteractive` | Internal |
| L5376 | `_templateTrigger` | Internal |
| L5379 | `_autoDownloadOn` | Internal |
| L5383 | `toggleAutoDownload` | UI |
| L5388 | `_updateAutoDownloadLabel` | Internal |
| L5417 | `_hoyMsUntilReset` | Internal |
| L5425 | `_hoyCountdownLabel` | Internal |
| L5434 | `_hoyGetProjName` | Internal |
| L5443 | `_hoyAvailableSince` | Internal |
| L5451 | `_startHoyTicker` | Internal |
| L5467 | `_stopHoyTicker` | Internal |
| L5473 | `_startSidebarTicker` | Internal |
| L5476 | `exhausted` |  |
| L5521 | `_stopSidebarTicker` | Internal |
| L5526 | `renderProjDots` | Render |
| L5530 | `renderHoy` | Render |
| L5539 | `_wkStart` | Internal |
| L5543 | `_moStart` | Internal |
| L5551 | `sHoy` |  |
| L5552 | `sHoyPrev` |  |
| L5553 | `sSemC` |  |
| L5554 | `sSemP` |  |
| L5555 | `sMesC` |  |
| L5556 | `sMesP` |  |
| L5559 | `_delta` | Internal |
| L5567 | `allSessSorted` |  |
| L5569 | `_lastCkptLabel` | Internal |
| L5584 | `projMonthStats` |  |
| L5591 | `_calcStreak` | Internal |
| L5592 | `dayKeys` |  |
| L5609 | `_peakHour` | Internal |
| L5625 | `completas` |  |
| L5626 | `rapidas` |  |
| L5629 | `_avgPerActiveDay` | Internal |
| L5630 | `dayKeys` |  |
| L5681 | `allAIs` |  |
| L5682 | `interrupted` |  |
| L5684 | `inSession` |  |
| L5744 | `nextExh` |  |
| L5745 | `nextLabel` |  |
| L5768 | `selectAIForQuickCapture` |  |
| L5769 | `available` |  |
| L5814 | `normStatus` |  |
| L5824 | `buildTGPreview` | Builder |
| L5838 | `count` |  |
| L5865 | `openCorrectHora` | UI |
| L5925 | `confirmCorrectHora` |  |
| L5957 | `unlockNowFromCard` |  |
| L5977 | `openQuickNote` | UI |
| L6004 | `closeQuickNote` | UI |
| L6011 | `saveQuickNote` | Save / Load |
| L6018 | `note` |  |
| L6031 | `qnRequestDelete` |  |
| L6036 | `qnCancelDelete` |  |
| L6041 | `qnConfirmDelete` |  |
| L6049 | `_qnRefInput` | Internal |
| L6070 | `_qnSelectAC` | Internal |
| L6076 | `_qnRefKeydown` | Internal |
| L6081 | `_qnTextKeydown` | Internal |
| L6086 | `_qnOverlayClick` | Internal |
| L6091 | `_qnNavToItem` | Internal |
| L6127 | `showMergeDiffPanel` | UI |
| L6159 | `_vizKeyHandler` | Internal |
| L6172 | `_itemVizClose` | Internal |
| L6191 | `_itemVizConfirm` | Internal |
| L6194 | `filtered` |  |
| L6201 | `_itemVizToggleExclude` | Internal |
| L6207 | `_itemVizToggleSinCambios` | Internal |
| L6215 | `_itemVizNavBacklog` | Internal |
| L6229 | `_itemVizRender` | Internal |
| L6237 | `_getBacklogItem` | Internal |
| L6242 | `_isSinCambio` | Internal |
| L6255 | `_mergeResultClass` | Internal |
| L6259 | `_mergeResultLabel` | Internal |
| L6264 | `_fieldDiffChips` | Internal |
| L6277 | `added` |  |
| L6278 | `removed` |  |
| L6291 | `activeItems` |  |
| L6292 | `sinCambioItems` |  |
| L6295 | `userExcluded` |  |
| L6306 | `_buildRow` | Internal |
| L6369 | `activeRows` |  |
| L6372 | `newCount` |  |
| L6373 | `updCount` |  |
| L6383 | `sinCambioRows` |  |
| L6412 | `_vizCopyCode` | Internal |
| L6416 | `_doFlash` | Internal |
| L6444 | `closeArranquePanel` | UI |
| L6449 | `_showArranquePanel` | Internal |
| L6492 | `closedInSess` | UI |
| L6557 | `available` |  |
| L6558 | `inSession` |  |
| L6559 | `exhausted` |  |
| L6562 | `bestAI` |  |
| L6563 | `ta` |  |
| L6564 | `tb` |  |
| L6601 | `_backlogItems` | Internal |
| L6611 | `_liveStatus` | Internal |
| L6612 | `_liveTitle` | Internal |
| L6613 | `_sessScore` | Internal |
| L6619 | `_sessIsDone` | Internal |
| L6634 | `_doneIds` | Internal |
| L6635 | `_isBlocked` | Internal |
| L6641 | `_pendingSessions` | Internal |
| L6651 | `_available` | Internal |
| L6652 | `_blocked` | Internal |
| L6656 | `_others` | Internal |
| L6660 | `_itemPill` | Internal |
| L6664 | `_filePill` | Internal |
| L6738 | `blocker` |  |
| L6818 | `onKey` | Events |
| L6831 | `_calcPulsoDotState` | Internal |
| L6840 | `projData` |  |
| L6842 | `lastTs` |  |
| L6848 | `closed7` | UI |
| L6849 | `closed714` | UI |
| L6866 | `blockerCount` |  |
| L6875 | `closedRecently` | UI |
| L6881 | `totalThisWeek` |  |
| L6882 | `totalLastWeek` |  |
| L6885 | `hasRed` |  |
| L6886 | `hasYellow` |  |
| L6892 | `renderPulsoDot` | Render |
| L6902 | `openPulsoPanel` | UI |
| L6966 | `onKey` | Events |
| L6970 | `closePulsoPanel` | UI |
| L6982 | `_trackerHistPopulateProjects` | Internal |
| L6992 | `_trackerRenderHist` | Internal |
| L7017 | `ai` |  |
| L7024 | `linkedItems` |  |
| L7059 | `_trackerHistFilterChange` | Internal |
| L7066 | `_trackerSelectSess` | Internal |
| L7079 | `_trackerHistDragStart` | Internal |
| L7085 | `s` |  |
| L7091 | `_trackerHistDragEnd` | Internal |
| L7097 | `_trackerHistAttachDropTargets` | Internal |
| L7120 | `s` |  |
| L7139 | `_trackerSwitchCol` | Internal |

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

## ai-tracker-map-generator.js (1,120 líneas)

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
| L401 | `_mgBuildPlan` | Internal |
| L404 | `openSprints` | UI |
| L411 | `activeIdx` |  |
| L416 | `sorted` |  |
| L436 | `sprintItems` |  |
| L465 | `isIntegration` |  |
| L479 | `hasConflict` |  |
| L495 | `candidate` |  |
| L569 | `generateDocuments` |  |
| L613 | `generateMap` |  |
| L617 | `_generateMap` | Internal |
| L619 | `sorted` |  |
| L628 | `parsed` | Parser |
| L629 | `totalLines` |  |
| L665 | `_generateContext` | Internal |
| L710 | `seenMemoria` |  |
| L748 | `_injectSection` | Internal |
| L755 | `sortedDec` |  |
| L777 | `gaps` |  |
| L797 | `_generateBacklog` | Internal |
| L805 | `_generateSprintReview` | Internal |
| L835 | `sorted` |  |
| L838 | `seenDecisions` |  |
| L849 | `allDecisions` |  |
| L865 | `withLearning` |  |
| L916 | `_mgNow` | Internal |
| L925 | `_mgResetPreview` | Internal |
| L932 | `_mgShowPreview` | Internal |
| L958 | `tableStart` |  |
| L959 | `tableEnd` |  |
| L978 | `confirmMapGenerator` |  |
| L984 | `hasClosedSprint` |  |
| L1091 | `_mgApplyBumpedVersion` | Internal |
| L1111 | `_mgDownload` | Internal |

## ai-tracker-session.js (3,004 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L6 | `parseCheckpoint` | Parser |
| L19 | `extractField` |  |
| L39 | `extractAllLines` |  |
| L61 | `_countParseable` | Internal |
| L91 | `_setPhase` | Internal |
| L101 | `parsePaste` | Parser |
| L269 | `failed` |  |
| L318 | `_doneNoAc` | Internal |
| L320 | `_codes` | Internal |
| L336 | `_validList` | Internal |
| L402 | `_linked` | Internal |
| L424 | `handlePaste` | Events |
| L431 | `_doParse` | Internal |
| L461 | `handleInput` | Events |
| L468 | `_tryIngestPlan` | Internal |
| L489 | `parsePasteStandalone` | Parser |
| L608 | `saveStandaloneCheckpoint` | Save / Load |
| L628 | `_doApply` | Internal |
| L711 | `parsePlanBlock` | Parser |
| L722 | `_flushSess` | Internal |
| L726 | `_flushSprint` | Internal |
| L733 | `_parseList` | Internal |
| L785 | `_horaUpdate` | Internal |
| L807 | `parseHora` | Parser |
| L814 | `correctHora` |  |
| L821 | `interpretHora` |  |
| L840 | `fmt12` |  |
| L851 | `relDate` |  |
| L903 | `horaKey` |  |
| L916 | `_showProjRequiredInPanel` | Internal |
| L924 | `projOptions` |  |
| L993 | `confirmSave` |  |
| L997 | `cancelConfirmSave` |  |
| L1003 | `_templateTrigger` | Internal |
| L1006 | `toggleTemplateTrigger` | UI |
| L1016 | `downloadTemplates` | Export / Import |
| L1022 | `_dlTemplatesCancel` | Internal |
| L1027 | `_buildNarrativeMemoryMd` | Internal |
| L1029 | `withNarrative` |  |
| L1049 | `_doDownloadTemplates` | Internal |
| L1091 | `_addChangelogEntry` | Internal |
| L1111 | `openChangelog` | UI |
| L1120 | `_buildChangelogInner` | Internal |
| L1124 | `rows` |  |
| L1146 | `_buildChangelogHTML` | Internal |
| L1152 | `_buildNarrativeMd` | Internal |
| L1159 | `_hasContent` | Internal |
| L1169 | `_ai` | Internal |
| L1174 | `entries` |  |
| L1186 | `buildContextMd` | Builder |
| L1194 | `activeSprint` |  |
| L1195 | `lastClosed` |  |
| L1219 | `lastBlockerEntry` |  |
| L1274 | `sprintItems` |  |
| L1340 | `buildBacklogMd` | Builder |
| L1398 | `_checkStorageQuota` | Internal |
| L1408 | `saveSession` | Save / Load |
| L1468 | `_showProjMismatchModal` | Internal |
| L1491 | `_mergeBacklogWithProject` | Internal |
| L1515 | `_doSaveSession` | Internal |
| L1522 | `trackerRefs` |  |
| L1562 | `_doCompleteFinish` | Internal |
| L1642 | `existing` |  |
| L1670 | `_doApplyMergeAndFinish` | Internal |
| L1797 | `toggleStatus` | UI |
| L1804 | `toggleShowAll` | UI |
| L1806 | `openDetail` | UI |
| L1861 | `_narBody` | Internal |
| L1913 | `rows` |  |
| L1930 | `t` |  |
| L1979 | `_previewSessProjId` | Internal |
| L1985 | `_previewProjOpts` | Internal |
| L2029 | `closePopup` | UI |
| L2048 | `openCompleteQuickSession` | UI |
| L2078 | `deleteCurrentSession` |  |
| L2086 | `openDeleteConfirm` | UI |
| L2090 | `closeDeleteConfirm` | UI |
| L2094 | `togglePopupMid` | UI |
| L2103 | `toggleInReview` | UI |
| L2115 | `starSession` |  |
| L2121 | `starCurrentSession` |  |
| L2140 | `popParseHora` |  |
| L2154 | `saveResetFromPopup` | Save / Load |
| L2182 | `_previewProjConfirmChange` | Internal |
| L2184 | `prevProjId` |  |
| L2227 | `savePreviewProject` | Save / Load |
| L2237 | `toProj` |  |
| L2249 | `popCorrectParseHora` |  |
| L2263 | `saveCorrectHoraFromPopup` | Save / Load |
| L2283 | `unlockNowFromPopup` |  |
| L2297 | `renderBacklogRefs` | Render |
| L2305 | `item` |  |
| L2333 | `refreshPopupRefs` |  |
| L2349 | `onPopupRefSearch` | Events |
| L2360 | `matches` |  |
| L2383 | `linkBacklogItem` |  |
| L2393 | `item` |  |
| L2405 | `unlinkBacklogItem` |  |
| L2413 | `item` |  |
| L2425 | `startPopupEdit` |  |
| L2467 | `commit` |  |
| L2479 | `cancel` |  |
| L2495 | `startRename` |  |
| L2503 | `commit` |  |
| L2513 | `duplicate` |  |
| L2521 | `cancel` |  |
| L2531 | `editNotes` |  |
| L2554 | `saveNotes` | Save / Load |
| L2563 | `cancelNotes` |  |
| L2567 | `renderNotesDisplay` | Render |
| L2583 | `checkNotesOverflow` |  |
| L2596 | `_saveLogFilters` | Internal |
| L2606 | `_loadLogFilters` | Internal |
| L2626 | `_getAllSessionsChron` | Internal |
| L2639 | `_logAIList` | Internal |
| L2648 | `_sessType` | Internal |
| L2654 | `_sessTypeLabel` | Internal |
| L2662 | `_sessTypePill` | Internal |
| L2671 | `_buildLogHeader` | Internal |
| L2675 | `aiPills` |  |
| L2692 | `projOptions` |  |
| L2721 | `_buildLogRow` | Internal |
| L2763 | `_rebuildLogBody` | Internal |
| L2773 | `filtered` |  |
| L2796 | `rows` |  |
| L2850 | `_logScrollTop` | Internal |
| L2855 | `scrollToLogCard` |  |
| L2880 | `closeLogCard` | UI |
| L2890 | `setLogFilterAI` | Utils |
| L2896 | `setLogFilterType` | Utils |
| L2902 | `setLogFilterProj` | Utils |
| L2908 | `setLogFilterStarred` | Utils |
| L2915 | `clearLogFilters` |  |
| L2926 | `onLogSearch` | Events |
| L2991 | `navigateToBacklogItem` |  |

## ai-tracker-sprint-project.js (1,077 líneas)

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
| L322 | `_getActiveProjectFilter` | Internal |
| L326 | `_setActiveProjectFilter` | Internal |
| L333 | `_updateProjBreadcrumb` | Internal |
| L337 | `_updateProjFilterBtn` | Internal |
| L357 | `clearProjectFilter` |  |
| L369 | `openProjPanel` | UI |
| L377 | `closeProjPanel` | UI |
| L384 | `renderProjPanel` | Render |
| L417 | `_countProjSessions` | Internal |
| L421 | `selectProjectFilter` |  |
| L445 | `openProjModal` | UI |
| L477 | `closeProjModal` | UI |
| L482 | `cancelProjForm` |  |
| L496 | `_renderProjColorRow` | Internal |
| L504 | `selectProjColor` |  |
| L509 | `confirmProjForm` |  |
| L544 | `_renderProjList` | Internal |
| L553 | `activeProjs` |  |
| L554 | `archivedProjs` |  |
| L556 | `_projRow` | Internal |
| L599 | `editProjInline` |  |
| L619 | `toggleProjArchive` | UI |
| L634 | `deleteProjConfirm` |  |
| L653 | `projDragStart` |  |
| L657 | `projDragEnd` |  |
| L662 | `projDragOver` |  |
| L668 | `projDragLeave` |  |
| L671 | `projDrop` |  |
| L676 | `fromIdx` |  |
| L677 | `toIdx` |  |
| L686 | `getProjectById` | Utils |
| L690 | `getProjectsByAI` | Utils |
| L695 | `getProjContext` | Utils |
| L699 | `setProjContext` | Utils |
| L706 | `getProjBacklog` | Utils |
| L710 | `setProjBacklog` | Utils |
| L722 | `_notesKey` | Internal |
| L726 | `_loadNotes` | Internal |
| L732 | `_saveNotes` | Internal |
| L738 | `_noteId` | Internal |
| L743 | `createNote` | Builder |
| L759 | `editNote` |  |
| L763 | `idx` |  |
| L777 | `deleteNote` |  |
| L781 | `filtered` |  |
| L789 | `getActiveProjectNotes` | Utils |
| L795 | `_filteredAIs` | Internal |
| L839 | `_checkOnboarding` | Internal |
| L849 | `_renderOnboardingSteps` | Internal |
| L891 | `_onboardingStepAction` | Internal |
| L896 | `_dismissOnboarding` | Internal |
| L968 | `cleanupLocalStorage` |  |
| L1000 | `_getLocalStorageUsage` | Internal |
| L1011 | `testLocalStorageQuota` |  |

## env.js (4 líneas)

_Sin elementos detectados._

## ai-tracker-extra.css (16,560 líneas)

| Líneas | Sección |
|--------|---------|
| L1465 | END OF UX/UI REDESIGN |
| L1624 | TAB SCROLL PROGRESS BAR |
| L1646 | T-202604-164: Modal animations — scale-in/out + backdrop blur + button states |
| L1914 | END T-202604-164 |
| L1916 | DOC LOG DRAWER |
| L2052 | END DOC LOG DRAWER |
| L2054 | AI STATUS BAR |
| L2205 | END AI STATUS BAR |
| L2207 | T-202604-178: Copy item button |
| L2240 | T-202604-216: Skeleton rows — renderBacklogList / renderAnalytics / renderHtmlMap |
| L2283 | END T-202604-216 |
| L2285 | T-202604-218: Sidebar → strip horizontal en mobile (<600px) |
| L2417 | END T-202604-218 |
| L2419 | T-202604-233: Toast — mobile responsive (≤560px) — actualizado T-202604-221 |
| L2430 | END T-202604-233 |
| L2432 | T-202604-221: Toast inline — anclado al elemento que detona la acción |
| L2530 | END T-202604-221 toast inline |
| L2532 | R-202605-113: RADAR SIDEBAR GLOBAL — Jerarquía, auto-hide Dock, cards por estado |
| L3215 | END R-202605-113 |
| L3219 | R-202604-066: Microinteracciones header |
| L3307 | END R-202604-066 |
| L3309 | R-202604-065: Rediseño header global |
| L3653 | END R-202604-065 |
| L3655 | T-202604-268: QUICK NOTE |
| L3827 | END T-202604-268/270 |
| L3829 | T-202604-269: NOTAS EN VISTA DE PROYECTO |
| L3927 | END T-202604-269 |
| L3929 | T-202604-265: SPRINT HEALTH INDICATOR |
| L4217 | END T-202604-265 |
| L4219 | T-202604-263: ÚLTIMA SESIÓN EN CARD DE PROYECTO |
| L4274 | END T-202604-263 |
| L4276 | T-202604-264: ÍTEMS SUGERIDOS EN VISTA PROYECTO |
| L4351 | END T-202604-264 |
| L4353 | B-202604-129: supersedido por R-202605-113 — strip nativo reemplaza expand button |
| L4355 | END B-202604-129 |
| L4357 | T-202604-276: Trend badges — acelerando / desacelerando en Tab Proyectos |
| L4379 | END T-202604-276 |
| L4381 | T-202604-281: Empty states unificados — Tracker, Proyectos, Backlog, Analytics |
| L4431 | END T-202604-281 |
| L4433 | T-202604-284 — Sprint Roadmap |
| L4540 | END T-202604-284 |
| L4542 | T-202604-275: Patrones de productividad |
| L4636 | END T-202604-275 |
| L4638 | T-202604-274: Checkpoints por proyecto |
| L4747 | END T-202604-274 |
| L4749 | T-202604-293: Unified Search Panel |
| L4833 | END T-202604-293 |
| L4835 | T-202604-286: Mencionado en — sección en ítem expandido del Backlog |
| L4882 | END T-202604-286 |
| L4884 | T-202604-287: KANBAN VIEW |
| L5123 | END T-202604-287 |
| L5125 | T-202604-289: Decisiones del proyecto |
| L5346 | END T-202604-289 |
| L5348 | B-202604-XXX: Kanban — listEl no se comprime cuando hay contenido visible |
| L5361 | END B-202604-XXX |
| L5363 | S-CPR: CSS Purity Refactor — utilidades |
| L5498 | END S-CPR: utilidades |
| L5500 | R-202604-036: Merge Diff Panel — viz-* content styles |
| L5712 | END R-202604-036 |
| L5713 | R-202604-046: HTML-MAP filter pills — estado visual diferenciado |
| L5824 | END R-202604-046 |
| L5827 | migrated from index.html <style> block 1 |
| L5828 | T-202604-210: Backup button in header |
| L5864 | T-202604-210: logo-version pill oculto (versión en tooltip) |
| L6080 | R-202604-016: Log Card |
| L6379 | migrated from index.html <style> block 2 |
| L6698 | T-CSS-PURITY: Static inline style= → CSS classes (Phase 2) |
| L6746 | T-CSS-PURITY: card-notes-ta auto-resize via CSS var |
| L6749 | T-CSS-PURITY: proj color dots via --proj-color CSS var |
| L6755 | T-CSS-PURITY: session.js — Fase 2 clases HTML generado |
| L6799 | T-202604-CSS-BACKLOG: CSS Purity — backlog.js static style= → classes |
| L6819 | T-202604-204: Docs Onboarding |
| L6840 | Context Panel |
| L7020 | Analytics V2 |
| L7254 | T-202604-272: Badge Estancado |
| L7266 | T-202604-322: Analytics Legibility |
| L7347 | S-09: Analytics Layout R-069 + T-399/400/403/404/405 |
| L7480 | R-202604-070: Comparación side-by-side |
| L7541 | T-202604-401: KPI color semántico + sparkline |
| L7568 | T-202604-402: KPI row nuevas métricas |
| L7576 | T-202604-406: Patrones productividad — efectividad cruzada |
| L7601 | T-202604-407: Microinteracciones Analytics |
| L7641 | T-202605-454: Insight de horas productivas — accionable desde heatmap |
| L7708 | END T-202605-454 |
| L7710 | T-202605-453: Tiempo promedio pendiente → done |
| L7956 | END T-202605-453 |
| L7958 | T-202604-187: Backlog Styles |
| L8006 | T-202604-323: HtmlMap Bar Styles |
| L8038 | DROPZONE — Importación unificada Backlog / HTML-MAP / Context |
| L8749 | R-202604-071: Merge Diff Panel — rediseño completo two-column |
| L9212 | END R-202604-071 |
| L9214 | R-202605-096: Toast bloqueante → confirmación inline en panel DIFF |
| L9331 | END R-202605-096 |
| L9333 | B-202604-160: 'En curso' status — badge + filtro |
| L9339 | END B-202604-160 |
| L9341 | B-202604-166: Sección 'En curso' en renderBacklogList |
| L9348 | END B-202604-166 |
| L10842 | T-202604-412: Document Generator — estilos migrados de index.html <style> |
| L10881 | END T-202604-412: Document Generator |
| L11116 | END S-07 |
| L11515 | R-202604-069: Analytics layout — ancho completo · zonas visuales definidas |
| L11654 | R-[pendiente-ID]: Unified Merge Diff Panel — retrocesos y descartes inline |
| L11755 | END R-[pendiente-ID]: Unified Merge Diff Panel |
| L11757 | R-202604-077: CKPT Diff Panel Unificado — confirmaciones post-CHECKPOINT |
| L11996 | END R-202604-077 |
| L11998 | R-202604-059: Grid Tracker 3 columnas |
| L12441 | END R-202604-059 |
| L12450 | R-202604-061: Microinteracciones Tracker — S-10 |
| L12538 | END R-202604-061 |
| L12545 | R-202604-062: Layout y visual cards Proyectos |
| L12616 | END R-202604-062 |
| L12618 | R-202604-064: Microinteracciones Proyectos |
| L12667 | END R-202604-064 |
| L12669 | R-202604-063: Funcionalidad Proyectos — estilos de soporte |
| L12747 | END R-202604-063 |
| L12849 | T-202604-414: Panel diff — delta real por campo en actualizaciones |
| L12951 | END T-202604-414 |
| L12953 | R-202604-091: Fusionar en curso con pendiente — decorador visual de actividad |
| L13367 | END R-202604-089 |
| L13434 | END T-202604-416 |
| L13459 | END T-202604-426 |
| L13467 | R-[tmp:toolbar-backlog-redesign]: Toolbar · Filter Strip · Sprint Selector |
| L13938 | END R-[tmp:toolbar-backlog-redesign] |
| L13940 | [tmp:sprint-header-pills] — status-pill · sprint header badges |
| L13984 | END [tmp:sprint-header-pills] |
| L13986 | B-202605-217 — bl-sprint-trigger-bar-fill: width via CSS var |
| L13990 | END B-202605-217 |
| L13992 | B-202605-218 — SCM modal: clases CSS Purity |
| L14006 | END B-202605-218 |
| L14008 | R-202605-095 — Toast bloqueante → confirmación inline en panel DIFF |
| L14106 | END R-202605-095 |
| L14108 | R-202605-098: Ciclo de vida y representación visual diferenciada — ítems tipo P |
| L14306 | END R-202605-098 |
| L14308 | T-202604-417: Retrospectiva integrada al flujo de cierre |
| L14560 | END T-202604-417 |
| L14677 | T-202605-440: CSS — modal--retro · bl-sprint-retro-btn · sprint-action-retro · is-hidden retro overlay |
| L14682 | END T-202605-440 |
| L15335 | FIN HISTÓRICO UNIFICADO |
| L15337 | T-202605-452: Flujo acumulativo — ítems entrando vs saliendo |
| L15503 | FIN T-202605-452 |
| L15523 | FIN T-202604-423 |
| L16092 | R-202605-104: Jerarquía visual sección Ideas — indentado exclusivo padre-hijo |
| L16139 | END R-202605-104 |
| L16320 | T-202605-479 — iPad 768–1024px breakpoint |
| L16351 | END T-202605-479 |
| L16353 | T-202605-478 — 2560px ultrawide: contenedores de contenido |
| L16373 | END T-202605-478 |
| L16559 | END macOS FIDELITY |

## ai-tracker.css (7,647 líneas)

| Líneas | Sección |
|--------|---------|
| L2 | VARIABLES |
| L238 | SHARED — Reset, body, header, tabs, botones, toast, search |
| L310 | FASE 3-A — Tab bar premium |
| L787 | T-011: AVATARS |
| L857 | TAB-TRACKER — Sidebar + Detail layout |
| L1083 | LOG CARD |
| L1429 | SESIONES — Filas, indicadores, show-all |
| L1485 | TRACKER GLOBAL — Panel, items, add-row |
| L1559 | TAGS — Pills, picker modal, colores |
| L1589 | PANELES — Pendientes, inline-confirm, popup detalle, modal add-AI |
| L2248 | TAB-BACKLOG |
| L2714 | TAB-BACKLOG — Stats, toolbar, items, versiones |
| L3591 | TAB-ANALYTICS |
| L3733 | Analytics KPI cards (B-202604-145) |
| L3869 | END Analytics KPI cards |
| L3987 | T-036: MOBILE RESPONSIVE (<600px) |
| L4615 | FASE 2 — PREMIUM CARD SYSTEM |
| L5086 | TAB PROYECTOS — Dashboard v2 |
| L5432 | T-202604-285: Contexto rico por proyecto |
| L5503 | END T-202604-285 |
| L5505 | T-202604-165: buildBacklogItem() premium |
| L5882 | T-202604-202: View mode pills — Cards / Proyecto |
| L5911 | END T-202604-202 |
| L5913 | R-202604-015: Item Detail Panel — two-column backlog layout |
| L6260 | END R-202604-015 |
| L6262 | R-202604-015 Sesión 2 — editable title + meta grid |
| L6361 | END R-202604-015 Sesión 2 |
| L6363 | T-202604-307 — Quick actions · Timeline notes · Session unlink |
| L6448 | END T-202604-307 |
| L6450 | §15 CSS Purity — sprint-project migration |
| L6480 | END §15 CSS Purity — sprint-project |
| L6482 | §15 CSS Purity — checkpoint.js parte 1 |
| L6536 | END §15 CSS Purity — checkpoint.js parte 1 |
| L6537 | §15 CSS Purity — checkpoint.js parte 2 |
| L6731 | END §15 CSS Purity — checkpoint.js parte 2 |
| L6733 | §15 CSS Purity — ai-notes.js |
| L6800 | END §15 CSS Purity — ai-notes.js |
| L6814 | §15 CSS Purity — backlog.js migration |
| L6851 | END §15 CSS Purity — backlog.js migration |
| L6853 | §15 CSS Purity — session.js migration |
| L6916 | END §15 CSS Purity — session.js migration |
| L7204 | END B-202604-117: Toast system |
| L7206 | R-202605-099: Toolbar · Filter Strip · Sprint Bar |
| L7611 | END R-202605-099 |
| L7613 | R[tmp:magic-link-auth]: Auth modal — Google + Magic link |
| L7646 | END R[tmp:magic-link-auth] |

