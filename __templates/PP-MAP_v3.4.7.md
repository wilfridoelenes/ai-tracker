# PP-MAP_v3.4.7.md
<!-- Versión: v3.4.7 | Última actualización: 05/05/2026, 05:09 a.m. UTC-6 | Generado automáticamente -->

# MODULE-MAP — AI-Tracker v3.4.7

Arquitectura modular — 11 archivos independientes.
Generado: 05/05/2026, 05:09 a.m. UTC-6

---

## Índice de archivos

| Archivo | Tipo | Líneas | Descripción |
|---------|------|--------|-------------|
| `ai-tracker-ai-notes.js` | JS | 7,592 | 446 funciones |
| `ai-tracker-backlog.js` | JS | 7,012 | 437 funciones |
| `ai-tracker-checkpoint.js` | JS | 7,326 | 451 funciones |
| `ai-tracker-command-palette.js` | JS | 745 | 33 funciones |
| `ai-tracker-map-generator.js` | JS | 1,127 | 56 funciones |
| `ai-tracker-session.js` | JS | 3,145 | 138 funciones |
| `ai-tracker-sprint-project.js` | JS | 1,219 | 82 funciones |
| `env.js` | JS | 4 | 0 funciones |
| `ai-tracker-extra.css` | CSS | 16,879 | 151 secciones |
| `ai-tracker.css` | CSS | 7,659 | 46 secciones |
| `index.html` | HTML | 1,989 | 17 secciones |

**Total líneas:** 54,697

---

## ai-tracker-ai-notes.js (7,592 líneas)

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
| L918 | `piRenderPreview` |  |
| L930 | `selected` |  |
| L935 | `nNew` |  |
| L936 | `nUpdate` |  |
| L937 | `nWarn` |  |
| L998 | `piToggleCard` |  |
| L1006 | `piToggle` |  |
| L1009 | `selected` |  |
| L1014 | `piEditTitle` |  |
| L1015 | `piEditType` |  |
| L1016 | `piEditStatus` |  |
| L1018 | `piDeleteItem` |  |
| L1027 | `piConfirm` |  |
| L1028 | `toAdd` |  |
| L1044 | `existingIdx` |  |
| L1100 | `_refreshParentIdDropdown` | Internal |
| L1109 | `rItems` |  |
| L1115 | `_activeSprint` | Internal |
| L1121 | `openItemEditor` | UI |
| L1219 | `_ieAutofillFromPaste` | Internal |
| L1283 | `get` | Utils |
| L1337 | `_ieHighlightAutofilled` | Internal |
| L1349 | `closeItemEditor` | UI |
| L1355 | `confirmItemEditor` |  |
| L1401 | `item` |  |
| L1406 | `collision` |  |
| L1433 | `collision` |  |
| L1542 | `_loadCustomTemplates` | Internal |
| L1551 | `_saveCustomTemplates` | Internal |
| L1559 | `_getAllTemplates` | Internal |
| L1564 | `openTemplatePicker` | UI |
| L1571 | `closeTemplatePicker` | UI |
| L1576 | `_renderTemplatePicker` | Internal |
| L1581 | `predefined` |  |
| L1582 | `custom` |  |
| L1584 | `renderGroup` | Render |
| L1613 | `_applyTemplate` | Internal |
| L1639 | `_deleteCustomTemplate` | Internal |
| L1647 | `saveCurrentItemAsTemplate` | Save / Load |
| L1680 | `toggleTplSavePanel` | UI |
| L1700 | `getNextOccurrence` | Utils |
| L1708 | `_resetExpired` | Internal |
| L1718 | `getCD` | Utils |
| L1764 | `openTagModal` | UI |
| L1772 | `renderTagPicker` | Render |
| L1789 | `renderColorPicker` | Render |
| L1796 | `selectColor` |  |
| L1797 | `toggleTagOnSession` | UI |
| L1807 | `addNewTag` |  |
| L1822 | `openPendPanel` | UI |
| L1827 | `withPending` |  |
| L1844 | `closePendPanel` | UI |
| L1850 | `openStandaloneCheckpoint` | UI |
| L1862 | `closeStandaloneCheckpoint` | UI |
| L1874 | `openDocLog` | UI |
| L1890 | `closeDocLog` | UI |
| L1901 | `_updateDocLogCount` | Internal |
| L1912 | `_renderDocLog` | Internal |
| L1938 | `clearDocLog` |  |
| L1953 | `_toggleSearchScope` | Internal |
| L1959 | `onSearch` | Events |
| L1979 | `_esc` | Internal |
| L1980 | `hlText` |  |
| L2069 | `hasSessMatch` |  |
| L2074 | `matchSessIds` |  |
| L2078 | `match` |  |
| L2237 | `snippet` |  |
| L2280 | `getAnalyticsColor` | Utils |
| L2290 | `setCompareProject` | Utils |
| L2294 | `setCompareProjectA` | Utils |
| L2298 | `setCompareProjectB` | Utils |
| L2302 | `clearComparison` |  |
| L2308 | `setAnalyticsPeriod` | Utils |
| L2319 | `setAnalyticsRange` | Utils |
| L2324 | `setCfProject` | Utils |
| L2325 | `setCfType` | Utils |
| L2328 | `_getPeriodBounds` | Internal |
| L2355 | `_sessInRange` | Internal |
| L2365 | `_periodLabel` | Internal |
| L2380 | `_prevPeriodLabel` | Internal |
| L2399 | `_delta` | Internal |
| L2411 | `_getWeeksInPeriod` | Internal |
| L2420 | `_getIntervalsInPeriod` | Internal |
| L2457 | `lastNMonths` |  |
| L2468 | `getAnalyticsMonths` | Utils |
| L2471 | `fmtMonth` |  |
| L2478 | `sessionYM` |  |
| L2487 | `_parseSpanishDate` | Internal |
| L2506 | `sessionDateKey` |  |
| L2516 | `getTooltip` | Utils |
| L2525 | `showAnalyticsTooltip` | UI |
| L2527 | `total` |  |
| L2548 | `_posTooltip` | Internal |
| L2561 | `hideAnalyticsTooltip` | UI |
| L2569 | `_animateCountUp` | Internal |
| L2579 | `easeOut` |  |
| L2581 | `tick` |  |
| L2613 | `renderProyectos` | Render |
| L2618 | `activeProjects` |  |
| L2619 | `archivedProjects` |  |
| L2623 | `_weekStart` | Internal |
| L2633 | `_projSessions` | Internal |
| L2637 | `_sessThisWeek` | Internal |
| L2645 | `_lastSession` | Internal |
| L2652 | `_trend` | Internal |
| L2657 | `recent` |  |
| L2658 | `prev` |  |
| L2667 | `_relTimeShort` | Internal |
| L2682 | `_backlogStats` | Internal |
| L2690 | `rCodesWithChildren` |  |
| L2691 | `countable` |  |
| L2695 | `total` |  |
| L2696 | `done` |  |
| L2697 | `pending` |  |
| L2698 | `highPending` |  |
| L2699 | `next` |  |
| L2704 | `_typeColor` | Internal |
| L2712 | `_effortDots` | Internal |
| L2717 | `_buildCard` | Internal |
| L2839 | `count` |  |
| L2880 | `lastAI` |  |
| L2954 | `sortedActiveProjects` |  |
| L2963 | `activeCardsHtml` |  |
| L2981 | `_calcProjVelocity` | Internal |
| L2986 | `recent` |  |
| L2991 | `_estimateSprintClose` | Internal |
| L3004 | `_suggestionProj` | Internal |
| L3005 | `candidates` |  |
| L3007 | `scored` |  |
| L3019 | `allHighPending` |  |
| L3055 | `_proyDeleteInline` | Internal |
| L3061 | `_proyDeleteExecute` | Internal |
| L3074 | `_proyAbrir` | Internal |
| L3090 | `_closedItemsInRange` | Internal |
| L3109 | `_openedItemsInRange` | Internal |
| L3127 | `_closedItemsDetailInRange` | Internal |
| L3148 | `_openedItemsDetailInRange` | Internal |
| L3168 | `exportWeeklySummary` | Export / Import |
| L3202 | `fmtDate` |  |
| L3230 | `_wi_fmt` | Internal |
| L3282 | `_runDigestToasts` | Internal |
| L3314 | `blockedCount` |  |
| L3340 | `_buildCumulativeFlowChart` | Internal |
| L3365 | `timestamps` |  |
| L3380 | `buildPoints` | Builder |
| L3410 | `maxVal` |  |
| L3413 | `xOf` |  |
| L3414 | `yOf` |  |
| L3417 | `buildPath` | Builder |
| L3425 | `areaFill` |  |
| L3457 | `yTicks` |  |
| L3462 | `fmtDate` |  |
| L3476 | `sprintLines` |  |
| L3478 | `idx` |  |
| L3549 | `renderAnalytics` | Render |
| L3582 | `_dominantProject` | Internal |
| L3591 | `_activeProjectCount` | Internal |
| L3604 | `_filesKpi` | Internal |
| L3625 | `activeDays` |  |
| L3641 | `_buildBarChart` | Internal |
| L3646 | `projIds` |  |
| L3654 | `intervalData` |  |
| L3664 | `maxTotal` |  |
| L3676 | `yOf` |  |
| L3677 | `xOf` |  |
| L3681 | `_shouldShowLabel` | Internal |
| L3688 | `_intervalLabel` | Internal |
| L3698 | `_intervalTooltipLabel` | Internal |
| L3764 | `legendItems` |  |
| L3778 | `_kpiEmptyExtra` | Internal |
| L3793 | `_activeDaysPrev` | Internal |
| L3807 | `_totalPendingItems` | Internal |
| L3826 | `_sparklineForIntervals` | Internal |
| L3831 | `_sparkSessions` | Internal |
| L3832 | `_sparkClosed` | Internal |
| L3833 | `_sparkOpened` | Internal |
| L3834 | `_sparkEfficiency` | Internal |
| L3843 | `_kpiCard` | Internal |
| L3864 | `pts` |  |
| L3910 | `_projMetricsSbs` | Internal |
| L3911 | `files` |  |
| L3916 | `prevFiles` |  |
| L3921 | `days` |  |
| L3922 | `prevDays` |  |
| L3935 | `_sessForProj` | Internal |
| L3954 | `_cmpRow` | Internal |
| L4005 | `_buildCompareSelector` | Internal |
| L4025 | `_cycleTimeData` | Internal |
| L4057 | `avg` |  |
| L4094 | `existing` |  |
| L4131 | `_ctDaysLabel` | Internal |
| L4136 | `_ctTrendHtml` | Internal |
| L4143 | `_ctSparkHtml` | Internal |
| L4146 | `vals` |  |
| L4150 | `pts` |  |
| L4166 | `_ctOutliersHtml` | Internal |
| L4474 | `_getAnalyticsAIs` | Internal |
| L4488 | `renderHeatmap` | Render |
| L4532 | `levelClass` |  |
| L4550 | `firstDay` |  |
| L4559 | `cell` |  |
| L4576 | `labelsHtml` |  |
| L4581 | `legendCells` |  |
| L4613 | `_buildHourlyInsightData` | Internal |
| L4653 | `renderHourly` | Render |
| L4676 | `bars` |  |
| L4690 | `_fmt2` | Internal |
| L4746 | `renderProductivityPatterns` | Render |
| L4758 | `_closedForProj` | Internal |
| L4781 | `_makeEntry` | Internal |
| L4835 | `_peakDow` | Internal |
| L4841 | `_peakHour` | Internal |
| L4848 | `_miniDowBar` | Internal |
| L4860 | `_miniHourBar` | Internal |
| L4877 | `rows` |  |
| L4920 | `renderCheckpointsByProject` | Render |
| L4949 | `_addToProj` | Internal |
| L4997 | `maxTotal` |  |
| L4999 | `rowsHtml` |  |
| L5047 | `exportAnalyticsMd` | Export / Import |
| L5053 | `rows` |  |
| L5055 | `count` |  |
| L5062 | `totalSess` |  |
| L5083 | `monthRows` |  |
| L5121 | `getAIColor` | Utils |
| L5122 | `idx` |  |
| L5127 | `isMobile` |  |
| L5131 | `setViewMode` | Utils |
| L5132 | `applyViewMode` |  |
| L5138 | `renderProject` | Render |
| L5152 | `sourceAIs` |  |
| L5180 | `scopeAIs` |  |
| L5194 | `uniqueAIs` |  |
| L5224 | `_lastNextStep` | Internal |
| L5306 | `done` |  |
| L5307 | `totalEffort` |  |
| L5308 | `doneEffort` |  |
| L5339 | `_renderCtxPreview` | Internal |
| L5380 | `_buildCtxEl` | Internal |
| L5420 | `typeColor` |  |
| L5471 | `typeColor` |  |
| L5566 | `_renderDecisionsSection` | Internal |
| L5567 | `sorted` |  |
| L5568 | `rowsHtml` |  |
| L5605 | `_projOpenAddDecision` | Internal |
| L5617 | `_projSaveDecision` | Internal |
| L5629 | `dec` |  |
| L5641 | `_projCancelDecision` | Internal |
| L5647 | `_projEditDecision` | Internal |
| L5664 | `_projDeleteDecision` | Internal |
| L5667 | `idx` |  |
| L5677 | `_qnNavToItem` | Internal |
| L5692 | `_projCtxStartEdit` | Internal |
| L5713 | `_projCtxSave` | Internal |
| L5725 | `_projCtxCancelEdit` | Internal |
| L5729 | `_projCtxToggleSec` | Internal |
| L5738 | `_projToggleAIFilter` | Internal |
| L5743 | `_projViewSearchInput` | Internal |
| L5751 | `_toggleProjAnalytics` | Internal |
| L5761 | `renderProjectAnalytics` | Render |
| L5768 | `projAIIds` |  |
| L5769 | `projAIs` |  |
| L5780 | `monthLabels` |  |
| L5782 | `counts` |  |
| L5788 | `barsHtml` |  |
| L5799 | `aiRanks` |  |
| L5802 | `rankHtml` |  |
| L5810 | `daySet` |  |
| L5860 | `downloadProjectReport` | Export / Import |
| L5864 | `projAIIds` |  |
| L5865 | `projAIs` |  |
| L5917 | `toggleProjectSection` | UI |
| L5932 | `restoreDrafts` |  |
| L5957 | `_updateSubTabButtons` | Internal |
| L5966 | `backlogBootstrapped` |  |
| L6034 | `switchSubTab` |  |
| L6056 | `_docsOnboardingSteps` | Internal |
| L6083 | `_renderDocsOnboarding` | Internal |
| L6096 | `doneCount` |  |
| L6115 | `stepsHtml` |  |
| L6135 | `_docsOnboardingAction` | Internal |
| L6141 | `_dismissDocsOnboarding` | Internal |
| L6151 | `_renderTplProjBanner` | Internal |
| L6169 | `importHtmlMap` | Export / Import |
| L6216 | `_isMapJson` | Internal |
| L6227 | `_extractMapJson` | Internal |
| L6236 | `_parseMapJson` | Internal |
| L6261 | `parseHtmlMapMd` | Parser |
| L6327 | `loadHtmlMap` | Save / Load |
| L6333 | `exportHtmlMapMd` | Export / Import |
| L6386 | `_isContextJson` | Internal |
| L6395 | `parseContextJson` | Parser |
| L6405 | `rows` |  |
| L6429 | `rows` |  |
| L6437 | `rows` |  |
| L6451 | `parseContextMd` | Parser |
| L6486 | `importContextMd` | Export / Import |
| L6491 | `_importContextMdFromText` | Internal |
| L6532 | `updateContextBanner` |  |
| L6548 | `renderContextStatus` | Render |
| L6550 | `_importContextMdFromFile` | Internal |
| L6559 | `_dropzoneHandle` | Internal |
| L6575 | `_setContextModified` | Internal |
| L6594 | `_clearContextModifiedBadge` | Internal |
| L6606 | `_setHtmlMapModified` | Internal |
| L6623 | `_clearHtmlMapModifiedBadge` | Internal |
| L6634 | `updateHtmlMapModificationBadge` |  |
| L6652 | `_setBacklogModified` | Internal |
| L6665 | `updateBacklogModificationBadge` |  |
| L6681 | `extractContextSections` |  |
| L6703 | `mergeContextSections` |  |
| L6705 | `_ctxKey` | Internal |
| L6709 | `conflicts` |  |
| L6713 | `names` |  |
| L6737 | `vMatch` |  |
| L6752 | `extractHtmlMapSections` |  |
| L6771 | `mergeHtmlMapSections` |  |
| L6773 | `_mapKey` | Internal |
| L6801 | `renderContext` | Render |
| L6848 | `_renderContextSections` | Internal |
| L6885 | `onContextSearch` | Events |
| L6893 | `clearContextSearch` |  |
| L6901 | `contextShowImport` |  |
| L6908 | `toggleContextSection` | UI |
| L6914 | `renderContextMd` | Render |
| L6923 | `flushTable` |  |
| L6974 | `renderContextInline` | Render |
| L6992 | `_planKey` | Internal |
| L6996 | `savePlan` | Save / Load |
| L7020 | `loadPlan` | Save / Load |
| L7036 | `renderPlan` | Render |
| L7066 | `backlog` |  |
| L7075 | `_statusClass` | Internal |
| L7076 | `_statusLabel` | Internal |
| L7077 | `_liveStatus` | Internal |
| L7078 | `_liveTitle` | Internal |
| L7079 | `_sessIsDone` | Internal |
| L7083 | `_sessIsBlocked` | Internal |
| L7091 | `_connector` | Internal |
| L7099 | `_sessCard` | Internal |
| L7101 | `resolvedItems` |  |
| L7164 | `doneSessions` |  |
| L7165 | `available` |  |
| L7166 | `blocked` |  |
| L7169 | `allCodes` |  |
| L7171 | `doneItems` |  |
| L7233 | `_buildPulsoPlanesHtml` | Internal |
| L7237 | `backlog` |  |
| L7245 | `_liveStatus` | Internal |
| L7252 | `allSessions` |  |
| L7254 | `doneSess` |  |
| L7263 | `activeSprint` |  |
| L7274 | `nextSess` |  |
| L7312 | `_ctrKey` | Internal |
| L7313 | `_ctrLoad` | Internal |
| L7314 | `_ctrSave` | Internal |
| L7337 | `_ctrMergeFromItem` | Internal |
| L7349 | `existing` |  |
| L7372 | `_ctrUpdateBadge` | Internal |
| L7384 | `onContratosSearch` | Events |
| L7392 | `clearContratosSearch` |  |
| L7402 | `_ctrIsRisk` | Internal |
| L7405 | `activeSprints` |  |
| L7407 | `sorted` |  |
| L7413 | `renderContratos` | Render |
| L7472 | `openContratoDetail` | UI |
| L7477 | `_esc` | Internal |
| L7479 | `_renderContratoDetail` | Internal |
| L7486 | `rows` |  |
| L7524 | `exportContratosMd` | Export / Import |
| L7529 | `pad` |  |
| L7567 | `resetContratosData` |  |
| L7576 | `searchContratos` |  |

## ai-tracker-backlog.js (7,012 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L5 | `_skelShow` | Internal |
| L11 | `_skelHide` | Internal |
| L13 | `exportContextMd` | Export / Import |
| L40 | `updateHtmlMapBanner` |  |
| L53 | `setHtmlMapFilter` | Utils |
| L63 | `_hmOnSearch` | Internal |
| L68 | `_hmToggleModule` | Internal |
| L76 | `renderHtmlMap` | Render |
| L105 | `isModular` |  |
| L110 | `filtered` |  |
| L112 | `rows` |  |
| L136 | `filesToShow` |  |
| L138 | `fileTypeClass` |  |
| L139 | `fileTypeLabel` |  |
| L140 | `fileShortName` |  |
| L142 | `fileTypeBarColor` |  |
| L146 | `filePills` |  |
| L164 | `_maxFnCount` | Internal |
| L198 | `areasHtml` |  |
| L199 | `areaRows` |  |
| L252 | `ITEMS` |  |
| L289 | `_undoSnapshot` | Internal |
| L296 | `undoBacklog` |  |
| L307 | `redoBacklog` |  |
| L318 | `_updateUndoUI` | Internal |
| L370 | `_cvLoad` | Internal |
| L373 | `_cvSave` | Internal |
| L379 | `toggleCollapseAll` | UI |
| L401 | `toggleBacklogBlockerFilter` | UI |
| L411 | `toggleDepsFilter` | UI |
| L423 | `_hasDepsBlocked` | Internal |
| L426 | `dep` |  |
| L433 | `_isBlocked` | Internal |
| L445 | `_hasRecentSession` | Internal |
| L459 | `_calcPriority` | Internal |
| L473 | `_applyAllPriorities` | Internal |
| L483 | `_calcRelevanceScore` | Internal |
| L545 | `_recalcAllScores` | Internal |
| L556 | `_sanitizePendingInClosedSprints` | Internal |
| L602 | `loadBacklog` | Save / Load |
| L641 | `itemType` |  |
| L649 | `clearTypeFilters` |  |
| L655 | `toggleTypeFilter` | UI |
| L683 | `updateTypeFilterUI` |  |
| L702 | `toggleStatusFilter` | UI |
| L725 | `updateStatusFilterUI` |  |
| L738 | `toggleVersionCollapse` | UI |
| L749 | `_getNextItemCode` | Internal |
| L770 | `parseBacklogMd` | Parser |
| L790 | `get` | Utils |
| L859 | `parseBacklogMeta` | Parser |
| L866 | `relativeImportTime` |  |
| L883 | `updateBacklogBanner` |  |
| L896 | `el` |  |
| L906 | `importBacklog` | Export / Import |
| L935 | `idx` |  |
| L1023 | `badgeClass` |  |
| L1028 | `badgeLabel` |  |
| L1032 | `statusClass` |  |
| L1036 | `statusLabel` |  |
| L1042 | `_getActiveSessionAiId` | Internal |
| L1049 | `setItemStatus` | Utils |
| L1050 | `item` |  |
| L1071 | `dep` |  |
| L1104 | `stillBlocked` |  |
| L1106 | `blocker` |  |
| L1135 | `_resetStatusSelect` | Internal |
| L1144 | `effortDots` |  |
| L1151 | `_isCountableItem` | Internal |
| L1152 | `rCodesWithChildren` |  |
| L1157 | `renderStats` | Render |
| L1162 | `isInClosedSprint` |  |
| L1164 | `_countable` | Internal |
| L1166 | `countableItems` |  |
| L1175 | `visible` |  |
| L1199 | `noEffortCount` |  |
| L1202 | `backlogCount` |  |
| L1203 | `done` |  |
| L1205 | `descartadoCount` |  |
| L1209 | `pIdeasCount` |  |
| L1276 | `buildItemRefs` | Builder |
| L1285 | `chips` |  |
| L1295 | `toggleItemExpand` | UI |
| L1314 | `toggleSectionGroup` | UI |
| L1324 | `clearAllFilters` |  |
| L1354 | `_quickAssignEffort` | Internal |
| L1355 | `item` |  |
| L1370 | `toggleEffortFilter` | UI |
| L1396 | `updateEffortFilterUI` |  |
| L1413 | `setItemRole` | Utils |
| L1414 | `item` |  |
| L1427 | `toggleRoleFilter` | UI |
| L1440 | `togglePriorityFilter` | UI |
| L1451 | `updatePriorityFilterUI` |  |
| L1457 | `updateRoleFilterUI` |  |
| L1465 | `_getActiveRoles` | Internal |
| L1472 | `_buildRoleChips` | Internal |
| L1475 | `noneCount` |  |
| L1476 | `chips` |  |
| L1489 | `onBacklogSortChange` | Events |
| L1497 | `toggleSortDir` | UI |
| L1508 | `_getMiViewRoles` | Internal |
| L1519 | `_getMiViewLabel` | Internal |
| L1527 | `toggleBacklogFooter` | UI |
| L1535 | `toggleBacklogMikeMode` | UI |
| L1561 | `toggleBacklogKanbanMode` | UI |
| L1581 | `toggleBacklogTreeMode` | UI |
| L1595 | `toggleBacklogFocusMode` | UI |
| L1613 | `toggleBacklogNoAcMode` | UI |
| L1625 | `toggleChildrenBlock` | UI |
| L1638 | `setItemParent` | Utils |
| L1639 | `item` |  |
| L1650 | `updateClearFilterBtn` |  |
| L1667 | `_chip` | Internal |
| L1671 | `excluded` |  |
| L1707 | `_statusPills` | Internal |
| L1726 | `toggleSprintHealthPanel` | UI |
| L1739 | `toggleClosedSprintsBody` | UI |
| L1744 | `_calcEstimatedVelocity` | Internal |
| L1749 | `sprintData` |  |
| L1750 | `spItems` |  |
| L1751 | `planned` |  |
| L1752 | `real` |  |
| L1756 | `reals` |  |
| L1757 | `avg` |  |
| L1763 | `_buildSprintHealthPanel` | Internal |
| L1777 | `sprintItems` |  |
| L1781 | `doneItems` |  |
| L1785 | `blockedItems` |  |
| L1787 | `totalEffort` |  |
| L1788 | `doneEffort` |  |
| L1831 | `trendRows` |  |
| L1919 | `roadmapGoToSprint` |  |
| L1963 | `_buildSprintSelector` | Internal |
| L1968 | `activeSprint` |  |
| L1969 | `openSprints` | UI |
| L1970 | `closedSprints` | UI |
| L1976 | `total` |  |
| L1977 | `done` |  |
| L1997 | `_buildOption` | Internal |
| L2004 | `total` |  |
| L2005 | `done` |  |
| L2047 | `_blSprintOpen` | Internal |
| L2057 | `activeSprint` |  |
| L2058 | `openSprints` | UI |
| L2059 | `closedSprints` | UI |
| L2061 | `_buildOption` | Internal |
| L2068 | `total` |  |
| L2069 | `done` |  |
| L2116 | `_blSprintClose` | Internal |
| L2129 | `_blSprintSelect` | Internal |
| L2135 | `_blSprintToggleClosed` | Internal |
| L2147 | `_renderSprintRoadmap` | Internal |
| L2168 | `renderBacklogList` | Render |
| L2295 | `filtered` |  |
| L2356 | `pendienteFiltered` |  |
| L2358 | `sorted` |  |
| L2397 | `_sortGroup` | Internal |
| L2407 | `_sortItems` | Internal |
| L2441 | `ideaItems` |  |
| L2442 | `pendienteItems` |  |
| L2490 | `hasAnyItem` |  |
| L2496 | `doneInGroup` |  |
| L2497 | `totalInGroup` |  |
| L2512 | `_sprintAllItems` | Internal |
| L2536 | `doneInGroup` |  |
| L2537 | `totalInGroup` |  |
| L2567 | `_sprintAllItems` | Internal |
| L2569 | `_doneCount` | Internal |
| L2570 | `_descCount` | Internal |
| L2597 | `blockingItems` |  |
| L2764 | `archiveClosedItems` |  |
| L2793 | `renderArchivoHistorico` | Render |
| L2794 | `historicos` |  |
| L2797 | `isOpen` |  |
| L2798 | `activeView` |  |
| L2842 | `toggleArchivoHistorico` | UI |
| L2860 | `activeView` |  |
| L2868 | `setArchivoView` | Utils |
| L2878 | `_renderArchivoBody` | Internal |
| L2890 | `_sprintNum` | Internal |
| L2897 | `_archItemRow` | Internal |
| L2918 | `_archSprintEntryHtml` | Internal |
| L2922 | `effortDone` |  |
| L2953 | `_renderArchivoViewSprint` | Internal |
| L2954 | `historicos` |  |
| L2961 | `recentSprints` |  |
| L2962 | `legacySprints` |  |
| L2965 | `registeredIds` |  |
| L2966 | `noSprint` |  |
| L2969 | `legacySprintIds` |  |
| L2970 | `legacyItems` |  |
| L2975 | `hasData` |  |
| L2987 | `spItems` |  |
| L2991 | `entryOpen` |  |
| L3000 | `legOpen` |  |
| L3022 | `_renderArchivoViewFlat` | Internal |
| L3023 | `historicos` |  |
| L3038 | `_toggleArchSprintEntry` | Internal |
| L3059 | `registeredIds` |  |
| L3060 | `legacyIds` |  |
| L3077 | `_renderKanban` | Internal |
| L3086 | `_kanbanStatus` | Internal |
| L3095 | `allFiltered` |  |
| L3125 | `_kanbanCard` | Internal |
| L3130 | `dots` |  |
| L3186 | `_kbDrop` | Internal |
| L3202 | `_kbCardClick` | Internal |
| L3205 | `item` |  |
| L3211 | `_attachBacklogDnD` | Internal |
| L3245 | `fromIdx` |  |
| L3246 | `toIdx` |  |
| L3260 | `_inlineEditTitle` | Internal |
| L3263 | `item` |  |
| L3276 | `_commit` | Internal |
| L3286 | `_cancel` | Internal |
| L3301 | `_buildChildrenBlock` | Internal |
| L3303 | `allChildren` |  |
| L3305 | `children` |  |
| L3312 | `doneCount` |  |
| L3316 | `childRows` |  |
| L3354 | `_confirmUnlinkChild` | Internal |
| L3361 | `item` |  |
| L3367 | `_buildItemTimestamps` | Internal |
| L3368 | `_fmt` | Internal |
| L3387 | `_iso` | Internal |
| L3397 | `_buildItemPOriginBlock` | Internal |
| L3399 | `pItem` |  |
| L3409 | `_buildItemOriginBlock` | Internal |
| L3414 | `foundSess` |  |
| L3423 | `_fmtSessDate` | Internal |
| L3460 | `buildBacklogItem` | Builder |
| L3483 | `_otherMissing` | Internal |
| L3503 | `effortDotsHtml` |  |
| L3529 | `childCount` |  |
| L3530 | `childDoneCount` |  |
| L3669 | `_rLabel` | Internal |
| L3670 | `currentParent` |  |
| L3671 | `ghostOption` |  |
| L3712 | `_classify` | Internal |
| L3717 | `_acRows` | Internal |
| L3718 | `ambig` |  |
| L3763 | `_promoteItem` | Internal |
| L3764 | `item` |  |
| L3799 | `_promoteSelectType` | Internal |
| L3809 | `_promoteConfirm` | Internal |
| L3811 | `originItem` |  |
| L3864 | `_promoteTtoR` | Internal |
| L3865 | `item` |  |
| L3891 | `_promoteTtoRConfirm` | Internal |
| L3892 | `originItem` |  |
| L3943 | `copyItemCode` |  |
| L3968 | `copyItemToClipboard` |  |
| L3970 | `item` |  |
| L4000 | `tagNames` |  |
| L4010 | `_feedback` | Internal |
| L4033 | `toggleAc` | UI |
| L4041 | `setFilter` | Utils |
| L4049 | `onBacklogSearch` | Events |
| L4059 | `clearBacklogSearch` |  |
| L4070 | `updateBacklogFooter` |  |
| L4077 | `countable` |  |
| L4078 | `total` |  |
| L4079 | `pend` |  |
| L4080 | `done` |  |
| L4081 | `pIdeas` |  |
| L4102 | `cnt` |  |
| L4120 | `_isPlaceholderCode` | Internal |
| L4129 | `_findTmpMatch` | Internal |
| L4139 | `common` |  |
| L4149 | `mergeBacklogFromTG` |  |
| L4175 | `dupExisting` |  |
| L4213 | `existing` |  |
| L4272 | `newBB` |  |
| L4352 | `pParent` |  |
| L4405 | `showMergeDiffPanel` | UI |
| L4439 | `_pill` | Internal |
| L4442 | `_card` | Internal |
| L4462 | `_retrocedoRow` | Internal |
| L4477 | `_discardRow` | Internal |
| L4498 | `_section` | Internal |
| L4511 | `rows` |  |
| L4516 | `rows` |  |
| L4525 | `rows` |  |
| L4534 | `rows` |  |
| L4538 | `rows` |  |
| L4545 | `rows` |  |
| L4549 | `rows` |  |
| L4553 | `ignoredCritical` |  |
| L4554 | `ignoredOk` |  |
| L4556 | `rows` |  |
| L4566 | `rows` |  |
| L4674 | `hasDescartes` |  |
| L4675 | `hasDescartesConRazon` |  |
| L4775 | `_mdiffDoApply` | Internal |
| L4781 | `item` |  |
| L4795 | `item` |  |
| L4865 | `_mdiffKeyHandler` | Internal |
| L4884 | `_showStatusConfirmModal` | Internal |
| L4918 | `_confirmRetroceso` | Internal |
| L4919 | `item` |  |
| L4946 | `_confirmDiscard` | Internal |
| L4947 | `item` |  |
| L5002 | `_applyDiscardBatch` | Internal |
| L5006 | `item` |  |
| L5039 | `_tgStatusToBacklog` | Internal |
| L5044 | `_normalizeStatus` | Internal |
| L5058 | `_isActiveRecently` | Internal |
| L5075 | `_getActiveSprint` | Internal |
| L5079 | `_getSprintById` | Internal |
| L5083 | `_nextSprintId` | Internal |
| L5092 | `_isValidSprintName` | Internal |
| L5099 | `_suggestReleaseType` | Internal |
| L5101 | `hasR` |  |
| L5102 | `hasB` |  |
| L5103 | `hasT` |  |
| L5107 | `hasArch` |  |
| L5117 | `_suggestVersionTarget` | Internal |
| L5133 | `createSprint` | Builder |
| L5169 | `_generateSprintRetroMd` | Internal |
| L5174 | `pad` |  |
| L5180 | `sprintItems` |  |
| L5181 | `doneItems` |  |
| L5182 | `pendItems` |  |
| L5184 | `totalEffort` |  |
| L5185 | `doneEffort` |  |
| L5186 | `pendEffort` |  |
| L5195 | `_itemRow` | Internal |
| L5215 | `spSessions` |  |
| L5220 | `sessRows` |  |
| L5298 | `openSprintRetroView` | UI |
| L5304 | `pad` |  |
| L5351 | `closeSprintRetroOverlay` | UI |
| L5357 | `_openRetroDownloadPrompt` | Internal |
| L5362 | `pad` |  |
| L5402 | `setSprintStatus` | Utils |
| L5453 | `setItemSprint` | Utils |
| L5455 | `item` |  |
| L5469 | `openNewSprintInline` | UI |
| L5479 | `suggestedRt` |  |
| L5510 | `confirmNewSprint` |  |
| L5529 | `editSprintInline` |  |
| L5537 | `spItems` |  |
| L5577 | `confirmEditSprint` |  |
| L5613 | `confirmCloseSprint` |  |
| L5617 | `pendingItems` |  |
| L5618 | `doneItems` |  |
| L5622 | `allSprintItems` |  |
| L5623 | `effortPlanned` |  |
| L5624 | `effortDone` |  |
| L5625 | `effortScopeAdded` |  |
| L5626 | `effortNotDone` |  |
| L5627 | `hasItemsWithoutEffort` |  |
| L5657 | `closeCloseSprintModal` | UI |
| L5664 | `_scmBack` | Internal |
| L5672 | `_scmNext` | Internal |
| L5684 | `_scmBulkApply` | Internal |
| L5696 | `_scmRender` | Internal |
| L5745 | `_scmStep1Html` | Internal |
| L5746 | `doneCount` |  |
| L5761 | `doneRows` |  |
| L5768 | `pendRows` |  |
| L5838 | `_scmStep2Html` | Internal |
| L5840 | `activeSp` |  |
| L5855 | `rows` |  |
| L5880 | `_scmStep3Html` | Internal |
| L5881 | `doneCount` |  |
| L5882 | `discardedCount` |  |
| L5885 | `toSprint` |  |
| L5886 | `toUnassign` |  |
| L5887 | `toDiscard` |  |
| L5889 | `itemRow` |  |
| L5897 | `spLabel` |  |
| L5970 | `_scmExecuteClose` | Internal |
| L5992 | `processedCodes` |  |
| L6045 | `createSprintFromGroup` | Builder |
| L6058 | `navigateToItem` |  |
| L6061 | `item` |  |
| L6082 | `_buildItemMentionedIn` | Internal |
| L6085 | `mentions` |  |
| L6090 | `_fmtRel` | Internal |
| L6108 | `rows` |  |
| L6128 | `_buildItemMigratedBlock` | Internal |
| L6139 | `_openMigrateItem` | Internal |
| L6140 | `item` |  |
| L6182 | `_confirmMigrateItem` | Internal |
| L6188 | `item` |  |
| L6226 | `_backlogSetSelected` | Internal |
| L6246 | `item` |  |
| L6288 | `toggleFocusMode` | UI |
| L6300 | `exitFocusMode` |  |
| L6314 | `openItemPanel` | UI |
| L6315 | `item` |  |
| L6340 | `closeItemPanel` | UI |
| L6361 | `_itemPanelEscHandler` | Internal |
| L6384 | `_renderItemPanel` | Internal |
| L6481 | `linkedSessions` |  |
| L6517 | `blockedByPending` |  |
| L6518 | `blockedByDone` |  |
| L6519 | `blockingOthers` |  |
| L6521 | `_depsChip` | Internal |
| L6522 | `dep` |  |
| L6564 | `_buildPanelTimeline` | Internal |
| L6565 | `_fmt` | Internal |
| L6584 | `_iso` | Internal |
| L6661 | `alreadyHasDone` |  |
| L6704 | `rows` |  |
| L6738 | `_idpStartEditTitle` | Internal |
| L6742 | `item` |  |
| L6751 | `_idpSaveTitle` | Internal |
| L6755 | `item` |  |
| L6777 | `_idpCancelTitle` | Internal |
| L6785 | `_idpSetField` | Internal |
| L6786 | `item` |  |
| L6804 | `_itemPanelNotesDirty` | Internal |
| L6811 | `item` |  |
| L6820 | `_idpToggleAc` | Internal |
| L6829 | `_idpToggleHistory` | Internal |
| L6838 | `_idpCopyCode` | Internal |
| L6843 | `_idpMarkDone` | Internal |
| L6845 | `item` |  |
| L6852 | `_idpUnlinkSession` | Internal |
| L6854 | `sess` |  |
| L6859 | `item` |  |
| L6865 | `_idpAddNote` | Internal |
| L6866 | `item` |  |
| L6877 | `_idpAddNote_fromBtn` | Internal |
| L6888 | `_acvToggle` | Internal |
| L6899 | `_acvStartEdit` | Internal |
| L6902 | `item` |  |
| L6917 | `_acvSaveEdit` | Internal |
| L6922 | `item` |  |
| L6932 | `_acvConfirm` | Internal |
| L6933 | `item` |  |
| L6947 | `toggleTmplTriggerPanel` | UI |
| L6959 | `_resetTmplTriggerPanel` | Internal |
| L6970 | `_tryPatch` | Internal |

## ai-tracker-checkpoint.js (7,326 líneas)

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
| L188 | `payload` |  |
| L232 | `_refreshMigrationBtnVisibility` | Internal |
| L237 | `signInWithSupabase` |  |
| L257 | `poll` |  |
| L279 | `signOutSupabase` |  |
| L291 | `openAuthModal` | UI |
| L304 | `closeAuthModal` | UI |
| L310 | `signInWithMagicLink` |  |
| L341 | `getSupabaseUserId` | Utils |
| L348 | `_scrollToCard` | Internal |
| L353 | `navigateToCard` |  |
| L364 | `switchTab` |  |
| L422 | `esc` |  |
| L426 | `_slugify` | Internal |
| L438 | `_loadTmpIdMap` | Internal |
| L454 | `_saveTmpIdMap` | Internal |
| L458 | `_assignPendingIds` | Internal |
| L466 | `_norm` | Internal |
| L468 | `existingTitleMap` |  |
| L538 | `showCheckpointPanel` | UI |
| L550 | `rows` |  |
| L563 | `rows` |  |
| L584 | `_renderCkptDiffPanel` | Internal |
| L590 | `confirmedCount` |  |
| L596 | `retroRows` |  |
| L613 | `discardRows` |  |
| L678 | `item` |  |
| L687 | `item` |  |
| L699 | `appliedRetro` |  |
| L700 | `appliedDiscard` |  |
| L711 | `_ckptDiffCleanup` | Internal |
| L729 | `_renderFieldDiff` | Internal |
| L736 | `removed` |  |
| L737 | `added` |  |
| L738 | `kept` |  |
| L756 | `rows` |  |
| L782 | `rows` |  |
| L796 | `rows` |  |
| L810 | `rows` |  |
| L824 | `rows` |  |
| L834 | `_isInfoOnly` | Internal |
| L884 | `togglePasteHelp` | UI |
| L891 | `clearPasteTa` |  |
| L900 | `pasteFromClipboard` |  |
| L916 | `_updatePasteTaActions` | Internal |
| L925 | `_updateCkptReopenBtn` | Internal |
| L931 | `closeCkptPanel` | UI |
| L939 | `_pauseCkptTimer` | Internal |
| L947 | `_resumeCkptTimer` | Internal |
| L968 | `_toastDuration` | Internal |
| L983 | `_toastVisibleCount` | Internal |
| L989 | `_toastRender` | Internal |
| L1065 | `_touchResume` | Internal |
| L1090 | `showToast` | UI |
| L1108 | `_dismissToast` | Internal |
| L1120 | `_toastNext` | Internal |
| L1130 | `showToastDigest` | UI |
| L1142 | `toast` |  |
| L1148 | `showToastInline` | UI |
| L1178 | `_hideInline` | Internal |
| L1188 | `toggleTheme` | UI |
| L1193 | `applyTheme` |  |
| L1210 | `_saveFlush` | Internal |
| L1282 | `save` | Save / Load |
| L1321 | `saveImmediate` | Save / Load |
| L1329 | `_saveSessions` | Internal |
| L1360 | `_blogLog` | Internal |
| L1369 | `_relTs` | Internal |
| L1378 | `saveBacklog` | Save / Load |
| L1427 | `saveContextDocs` | Save / Load |
| L1460 | `onSearchDispatch` | Events |
| L1484 | `_isV2State` | Internal |
| L1494 | `_migrateV2toV3` | Internal |
| L1499 | `migProj` |  |
| L1531 | `exists` |  |
| L1544 | `existingCodes` |  |
| L1557 | `existingIds` |  |
| L1598 | `_applyStateData` | Internal |
| L1695 | `existingIds` |  |
| L1716 | `clone` |  |
| L1718 | `load` | Save / Load |
| L1746 | `cached` |  |
| L1765 | `_subscribeRealtime` | Internal |
| L1795 | `_unsubscribeRealtime` | Internal |
| L1802 | `_loadFromSupabase` | Internal |
| L1847 | `localSprintMap` |  |
| L1884 | `localIds` |  |
| L1904 | `blMap` |  |
| L1936 | `docMap` |  |
| L1939 | `_applyDocIfNewer` | Internal |
| L1944 | `localMeta` |  |
| L1969 | `localTs` |  |
| L1997 | `checkStorageWarn` |  |
| L2004 | `getAI` | Utils |
| L2009 | `getActiveProject` | Utils |
| L2015 | `getProjectSessions` | Utils |
| L2021 | `getAllSessions` | Utils |
| L2032 | `getSessionsByAI` | Utils |
| L2037 | `getProjectForSession` | Utils |
| L2042 | `getActiveTracker` | Utils |
| L2050 | `getActiveSprints` | Utils |
| L2056 | `_projKey` | Internal |
| L2059 | `_tplKey` | Internal |
| L2065 | `countAISessions` |  |
| L2070 | `getLastAISession` | Utils |
| L2079 | `getAISessions` | Utils |
| L2086 | `_findSession` | Internal |
| L2094 | `_findSessionByAI` | Internal |
| L2102 | `updateStats` |  |
| L2117 | `_isInSession` | Internal |
| L2122 | `last` |  |
| L2128 | `renderStatusBar` | Render |
| L2146 | `sp` |  |
| L2149 | `spDone` |  |
| L2211 | `total` |  |
| L2212 | `done` |  |
| L2254 | `timestamps` |  |
| L2278 | `_notifHistory` | Internal |
| L2282 | `_notifHistoryAdd` | Internal |
| L2310 | `_notifConfig` | Internal |
| L2322 | `_saveNotifConfig` | Internal |
| L2326 | `_notifReadSet` | Internal |
| L2329 | `_notifSaveRead` | Internal |
| L2339 | `hasRecentSession` |  |
| L2359 | `_computeNotifications` | Internal |
| L2365 | `_itemHasRecentSession` | Internal |
| L2523 | `markNotifRead` |  |
| L2535 | `markAllNotifsRead` |  |
| L2548 | `updateTabNotifBadges` |  |
| L2580 | `openNotifConfig` | UI |
| L2603 | `_notifConfigReset` | Internal |
| L2608 | `_notifConfigSetEnabled` | Internal |
| L2616 | `_notifConfigSetThreshold` | Internal |
| L2628 | `_registerNotifActions` | Internal |
| L2631 | `_notifGoto` | Internal |
| L2638 | `_renderNotifSection` | Internal |
| L2646 | `_fmtNotifTs` | Internal |
| L2649 | `pad` |  |
| L2750 | `_rsbToggleCfg` | Internal |
| L2766 | `renderGlobalRadarSidebar` | Render |
| L2773 | `interrupted` |  |
| L2774 | `inSession` |  |
| L2786 | `_sessionElapsed` | Internal |
| L2811 | `_sessionTitle` | Internal |
| L2819 | `_projPill` | Internal |
| L2835 | `_buildSessionCard` | Internal |
| L2877 | `_buildAvailableCard` | Internal |
| L2918 | `_buildExhaustedCard` | Internal |
| L2934 | `notifSection` |  |
| L3035 | `_rsbToggleAgotadas` | Internal |
| L3045 | `rsbFilterAIs` |  |
| L3092 | `rsbClearSearch` |  |
| L3100 | `rsbTogglePin` |  |
| L3109 | `_rsbIsPinned` | Internal |
| L3114 | `toggleRadarSidebar` | UI |
| L3130 | `_initRadarSidebarState` | Internal |
| L3180 | `toggleCollapseAll` | UI |
| L3181 | `active` |  |
| L3182 | `allCollapsed` |  |
| L3193 | `_trackerSetView` | Internal |
| L3219 | `sess` |  |
| L3231 | `_trackerViewPopulateProjects` | Internal |
| L3242 | `_trackerViewProjChange` | Internal |
| L3260 | `_trackerHistDayRender` | Internal |
| L3284 | `sorted` |  |
| L3323 | `rows` |  |
| L3344 | `_trackerHistDaySelect` | Internal |
| L3373 | `_trackerRenderMiniHist` | Internal |
| L3392 | `aiSessions` |  |
| L3450 | `linkedItems` |  |
| L3505 | `_trackerMiniHistSelect` | Internal |
| L3528 | `_getCurrentSession` | Internal |
| L3530 | `aiSess` |  |
| L3532 | `last` |  |
| L3539 | `_buildCurrentSessionCard` | Internal |
| L3544 | `aiSess` |  |
| L3545 | `sessIndex` |  |
| L3561 | `sessionRows` |  |
| L3607 | `selectTrackerAI` |  |
| L3651 | `_renderTrackerSidebar` | Internal |
| L3652 | `nonArchived` |  |
| L3653 | `inSession` |  |
| L3654 | `available` |  |
| L3655 | `exhausted` |  |
| L3656 | `archived` |  |
| L3658 | `mkRow` |  |
| L3720 | `exHtml` |  |
| L3741 | `_timerKey` | Internal |
| L3743 | `_getTimerData` | Internal |
| L3750 | `_setTimerData` | Internal |
| L3754 | `_clearTimerData` | Internal |
| L3758 | `_timerIsActive` | Internal |
| L3764 | `stopSessionTimer` |  |
| L3774 | `startSessionTimer` |  |
| L3782 | `_formatTimer` | Internal |
| L3790 | `_renderTimerInCard` | Internal |
| L3802 | `ai` |  |
| L3812 | `_refreshTimerTick` | Internal |
| L3820 | `_timerWidgetHtml` | Internal |
| L3834 | `_computeSuggestionScore` | Internal |
| L3839 | `lastSess` |  |
| L3859 | `recentSess` |  |
| L3867 | `_getSuggestedAI` | Internal |
| L3884 | `_highPendingCount` | Internal |
| L3892 | `_buildSuggestionReason` | Internal |
| L3896 | `lastSess` |  |
| L3909 | `renderSuggestionBanner` | Render |
| L3915 | `dismissSuggestionBanner` |  |
| L3920 | `startSuggestedSession` |  |
| L3937 | `_isMonday` | Internal |
| L3939 | `_getMondayKey` | Internal |
| L3947 | `_weeklyAlreadyDismissed` | Internal |
| L3954 | `_markWeeklyDismissed` | Internal |
| L3958 | `_buildWeeklySummary` | Internal |
| L3965 | `lastWeekSess` |  |
| L3976 | `doneLast` |  |
| L3977 | `pendingNow` |  |
| L3993 | `sp` |  |
| L3995 | `spItems` |  |
| L3996 | `spDone` |  |
| L4006 | `_exportWeeklySummaryMd` | Internal |
| L4026 | `dismissWeeklySummary` |  |
| L4032 | `_maybeShowWeeklySummary` | Internal |
| L4039 | `el` |  |
| L4050 | `render` | Render |
| L4075 | `allActive` |  |
| L4077 | `preferred` |  |
| L4101 | `_sortOrder` | Internal |
| L4106 | `aisToRender` |  |
| L4107 | `ai` |  |
| L4129 | `archived` |  |
| L4165 | `buildHoyCard` | Builder |
| L4173 | `sessConHora` |  |
| L4181 | `_availableSinceLabel` | Internal |
| L4248 | `_hoyMarkExhausted` | Internal |
| L4260 | `avgBetweenSessions` |  |
| L4276 | `buildCard` | Builder |
| L4306 | `_buildSessRow` | Internal |
| L4308 | `t` |  |
| L4311 | `tgItems` |  |
| L4373 | `sessThisMonth` |  |
| L4393 | `_projOptions` | Internal |
| L4402 | `_buildUnlockLabel` | Internal |
| L4488 | `sessConHora` |  |
| L4570 | `openQuickCapture` | UI |
| L4582 | `closeQuickModal` | UI |
| L4589 | `quickParseHora` |  |
| L4599 | `quickTitleKey` |  |
| L4604 | `confirmQuickCapture` |  |
| L4663 | `confirmInterruptInline` |  |
| L4677 | `cancelInterruptInline` |  |
| L4686 | `interruptSession` |  |
| L4711 | `dismissInterrupted` |  |
| L4724 | `enterFocusMode` |  |
| L4745 | `exitFocusMode` |  |
| L4759 | `_escCascade` | Internal |
| L4830 | `_hasChordWithG` | Internal |
| L4842 | `_chordDef` | Internal |
| L4966 | `_cur` | Internal |
| L5017 | `_cpHistoryLoad` | Internal |
| L5020 | `_cpHistorySave` | Internal |
| L5023 | `_cpHistoryAdd` | Internal |
| L5030 | `_cpFuzzy` | Internal |
| L5032 | `norm` |  |
| L5045 | `_cpBacklogItems` | Internal |
| L5054 | `_cpCommands` | Internal |
| L5094 | `_cpSessionCommands` | Internal |
| L5122 | `_cpItemCommands` | Internal |
| L5144 | `openCommandPalette` | UI |
| L5154 | `closeCommandPalette` | UI |
| L5159 | `_cpRender` | Internal |
| L5170 | `histIds` |  |
| L5171 | `histCmds` |  |
| L5173 | `rest` |  |
| L5178 | `staticMatches` |  |
| L5202 | `rows` |  |
| L5218 | `_cpHover` | Internal |
| L5225 | `_cpExecute` | Internal |
| L5235 | `_cpKeydown` | Internal |
| L5262 | `_cpInput` | Internal |
| L5293 | `_shortcutsLoad` | Internal |
| L5300 | `_shortcutsSave` | Internal |
| L5305 | `_shortcutKey` | Internal |
| L5307 | `def` |  |
| L5313 | `_shortcutConflict` | Internal |
| L5324 | `_shortcutsRender` | Internal |
| L5337 | `rows` |  |
| L5361 | `_shortcutsStartEdit` | Internal |
| L5362 | `def` |  |
| L5389 | `_shortcutsCaptureKey` | Internal |
| L5401 | `_shortcutsSaveEdit` | Internal |
| L5419 | `conflictDef` |  |
| L5424 | `def` |  |
| L5435 | `_shortcutsResetOne` | Internal |
| L5442 | `restoreDefaultShortcuts` |  |
| L5447 | `openShortcuts` | UI |
| L5456 | `closeShortcuts` | UI |
| L5463 | `openShortcutsRef` | UI |
| L5476 | `rows` |  |
| L5504 | `closeShortcutsRef` | UI |
| L5513 | `_sk` | Internal |
| L5519 | `_saveModalTrigger` | Internal |
| L5524 | `_restoreModalFocus` | Internal |
| L5532 | `_focusFirstInteractive` | Internal |
| L5542 | `_templateTrigger` | Internal |
| L5545 | `_autoDownloadOn` | Internal |
| L5549 | `toggleAutoDownload` | UI |
| L5554 | `_updateAutoDownloadLabel` | Internal |
| L5583 | `_hoyMsUntilReset` | Internal |
| L5591 | `_hoyCountdownLabel` | Internal |
| L5600 | `_hoyGetProjName` | Internal |
| L5609 | `_hoyAvailableSince` | Internal |
| L5617 | `_startHoyTicker` | Internal |
| L5633 | `_stopHoyTicker` | Internal |
| L5639 | `_startSidebarTicker` | Internal |
| L5642 | `exhausted` |  |
| L5687 | `_stopSidebarTicker` | Internal |
| L5692 | `renderProjDots` | Render |
| L5696 | `renderHoy` | Render |
| L5705 | `_wkStart` | Internal |
| L5709 | `_moStart` | Internal |
| L5717 | `sHoy` |  |
| L5718 | `sHoyPrev` |  |
| L5719 | `sSemC` |  |
| L5720 | `sSemP` |  |
| L5721 | `sMesC` |  |
| L5722 | `sMesP` |  |
| L5725 | `_delta` | Internal |
| L5733 | `allSessSorted` |  |
| L5735 | `_lastCkptLabel` | Internal |
| L5750 | `projMonthStats` |  |
| L5757 | `_calcStreak` | Internal |
| L5758 | `dayKeys` |  |
| L5775 | `_peakHour` | Internal |
| L5791 | `completas` |  |
| L5792 | `rapidas` |  |
| L5795 | `_avgPerActiveDay` | Internal |
| L5796 | `dayKeys` |  |
| L5847 | `allAIs` |  |
| L5848 | `interrupted` |  |
| L5850 | `inSession` |  |
| L5910 | `nextExh` |  |
| L5911 | `nextLabel` |  |
| L5934 | `selectAIForQuickCapture` |  |
| L5935 | `available` |  |
| L5980 | `normStatus` |  |
| L5990 | `buildTGPreview` | Builder |
| L6004 | `count` |  |
| L6031 | `openCorrectHora` | UI |
| L6091 | `confirmCorrectHora` |  |
| L6123 | `unlockNowFromCard` |  |
| L6143 | `openQuickNote` | UI |
| L6170 | `closeQuickNote` | UI |
| L6177 | `saveQuickNote` | Save / Load |
| L6184 | `note` |  |
| L6197 | `qnRequestDelete` |  |
| L6202 | `qnCancelDelete` |  |
| L6207 | `qnConfirmDelete` |  |
| L6215 | `_qnRefInput` | Internal |
| L6236 | `_qnSelectAC` | Internal |
| L6242 | `_qnRefKeydown` | Internal |
| L6247 | `_qnTextKeydown` | Internal |
| L6252 | `_qnOverlayClick` | Internal |
| L6257 | `_qnNavToItem` | Internal |
| L6293 | `showMergeDiffPanel` | UI |
| L6325 | `_vizKeyHandler` | Internal |
| L6338 | `_itemVizClose` | Internal |
| L6357 | `_itemVizConfirm` | Internal |
| L6360 | `filtered` |  |
| L6367 | `_itemVizToggleExclude` | Internal |
| L6373 | `_itemVizToggleSinCambios` | Internal |
| L6381 | `_itemVizNavBacklog` | Internal |
| L6395 | `_itemVizRender` | Internal |
| L6403 | `_getBacklogItem` | Internal |
| L6408 | `_isSinCambio` | Internal |
| L6421 | `_mergeResultClass` | Internal |
| L6425 | `_mergeResultLabel` | Internal |
| L6430 | `_fieldDiffChips` | Internal |
| L6443 | `added` |  |
| L6444 | `removed` |  |
| L6457 | `activeItems` |  |
| L6458 | `sinCambioItems` |  |
| L6461 | `userExcluded` |  |
| L6472 | `_buildRow` | Internal |
| L6535 | `activeRows` |  |
| L6538 | `newCount` |  |
| L6539 | `updCount` |  |
| L6549 | `sinCambioRows` |  |
| L6578 | `_vizCopyCode` | Internal |
| L6582 | `_doFlash` | Internal |
| L6610 | `closeArranquePanel` | UI |
| L6615 | `_showArranquePanel` | Internal |
| L6658 | `closedInSess` | UI |
| L6723 | `available` |  |
| L6724 | `inSession` |  |
| L6725 | `exhausted` |  |
| L6728 | `bestAI` |  |
| L6729 | `ta` |  |
| L6730 | `tb` |  |
| L6767 | `_backlogItems` | Internal |
| L6777 | `_liveStatus` | Internal |
| L6778 | `_liveTitle` | Internal |
| L6779 | `_sessScore` | Internal |
| L6785 | `_sessIsDone` | Internal |
| L6800 | `_doneIds` | Internal |
| L6801 | `_isBlocked` | Internal |
| L6807 | `_pendingSessions` | Internal |
| L6817 | `_available` | Internal |
| L6818 | `_blocked` | Internal |
| L6822 | `_others` | Internal |
| L6826 | `_itemPill` | Internal |
| L6830 | `_filePill` | Internal |
| L6904 | `blocker` |  |
| L6984 | `onKey` | Events |
| L6997 | `_calcPulsoDotState` | Internal |
| L7006 | `projData` |  |
| L7008 | `lastTs` |  |
| L7014 | `closed7` | UI |
| L7015 | `closed714` | UI |
| L7032 | `blockerCount` |  |
| L7041 | `closedRecently` | UI |
| L7047 | `totalThisWeek` |  |
| L7048 | `totalLastWeek` |  |
| L7051 | `hasRed` |  |
| L7052 | `hasYellow` |  |
| L7058 | `renderPulsoDot` | Render |
| L7068 | `openPulsoPanel` | UI |
| L7132 | `onKey` | Events |
| L7136 | `closePulsoPanel` | UI |
| L7148 | `_trackerHistPopulateProjects` | Internal |
| L7158 | `_trackerRenderHist` | Internal |
| L7183 | `ai` |  |
| L7190 | `linkedItems` |  |
| L7225 | `_trackerHistFilterChange` | Internal |
| L7232 | `_trackerSelectSess` | Internal |
| L7245 | `_trackerHistDragStart` | Internal |
| L7251 | `s` |  |
| L7257 | `_trackerHistDragEnd` | Internal |
| L7263 | `_trackerHistAttachDropTargets` | Internal |
| L7286 | `s` |  |
| L7305 | `_trackerSwitchCol` | Internal |

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

## ai-tracker-map-generator.js (1,127 líneas)

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
| L620 | `sorted` |  |
| L629 | `parsed` | Parser |
| L631 | `files` |  |
| L653 | `_generateContext` | Internal |
| L663 | `_pad` | Internal |
| L766 | `seenNotes` |  |
| L803 | `_generateBacklog` | Internal |
| L811 | `_generateSprintReview` | Internal |
| L841 | `sorted` |  |
| L844 | `seenDecisions` |  |
| L855 | `allDecisions` |  |
| L871 | `withLearning` |  |
| L922 | `_mgNow` | Internal |
| L931 | `_mgResetPreview` | Internal |
| L938 | `_mgShowPreview` | Internal |
| L985 | `confirmMapGenerator` |  |
| L991 | `hasClosedSprint` |  |
| L1098 | `_mgApplyBumpedVersion` | Internal |
| L1118 | `_mgDownload` | Internal |

## ai-tracker-session.js (3,145 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L9 | `parseCheckpoint` | Parser |
| L36 | `_countByType` | Internal |
| L39 | `_typedLines` | Internal |
| L84 | `extractField` |  |
| L104 | `extractAllLines` |  |
| L126 | `_countParseable` | Internal |
| L156 | `_setPhase` | Internal |
| L166 | `parsePaste` | Parser |
| L392 | `failed` |  |
| L441 | `_doneNoAc` | Internal |
| L443 | `_codes` | Internal |
| L459 | `_validList` | Internal |
| L525 | `_linked` | Internal |
| L547 | `handlePaste` | Events |
| L554 | `_doParse` | Internal |
| L584 | `handleInput` | Events |
| L591 | `_tryIngestPlan` | Internal |
| L612 | `parsePasteStandalone` | Parser |
| L744 | `saveStandaloneCheckpoint` | Save / Load |
| L764 | `_doApply` | Internal |
| L847 | `parsePlanBlock` | Parser |
| L858 | `_flushSess` | Internal |
| L862 | `_flushSprint` | Internal |
| L869 | `_parseList` | Internal |
| L921 | `_horaUpdate` | Internal |
| L943 | `parseHora` | Parser |
| L950 | `correctHora` |  |
| L957 | `interpretHora` |  |
| L976 | `fmt12` |  |
| L987 | `relDate` |  |
| L1039 | `horaKey` |  |
| L1052 | `_showProjRequiredInPanel` | Internal |
| L1060 | `projOptions` |  |
| L1129 | `confirmSave` |  |
| L1133 | `cancelConfirmSave` |  |
| L1139 | `_templateTrigger` | Internal |
| L1142 | `toggleTemplateTrigger` | UI |
| L1152 | `downloadTemplates` | Export / Import |
| L1158 | `_dlTemplatesCancel` | Internal |
| L1163 | `_buildNarrativeMemoryMd` | Internal |
| L1165 | `withNarrative` |  |
| L1185 | `_doDownloadTemplates` | Internal |
| L1227 | `_addChangelogEntry` | Internal |
| L1247 | `openChangelog` | UI |
| L1256 | `_buildChangelogInner` | Internal |
| L1260 | `rows` |  |
| L1282 | `_buildChangelogHTML` | Internal |
| L1288 | `_buildNarrativeMd` | Internal |
| L1295 | `_hasContent` | Internal |
| L1305 | `_ai` | Internal |
| L1310 | `entries` |  |
| L1322 | `buildContextMd` | Builder |
| L1330 | `activeSprint` |  |
| L1331 | `lastClosed` |  |
| L1355 | `lastBlockerEntry` |  |
| L1410 | `sprintItems` |  |
| L1476 | `buildBacklogMd` | Builder |
| L1534 | `_checkStorageQuota` | Internal |
| L1544 | `saveSession` | Save / Load |
| L1604 | `_showProjMismatchModal` | Internal |
| L1627 | `_mergeBacklogWithProject` | Internal |
| L1651 | `_doSaveSession` | Internal |
| L1658 | `trackerRefs` |  |
| L1698 | `_doCompleteFinish` | Internal |
| L1778 | `existing` |  |
| L1806 | `_doApplyMergeAndFinish` | Internal |
| L1916 | `_isInfoOnly` | Internal |
| L1938 | `toggleStatus` | UI |
| L1945 | `toggleShowAll` | UI |
| L1947 | `openDetail` | UI |
| L2002 | `_narBody` | Internal |
| L2054 | `rows` |  |
| L2071 | `t` |  |
| L2120 | `_previewSessProjId` | Internal |
| L2126 | `_previewProjOpts` | Internal |
| L2170 | `closePopup` | UI |
| L2189 | `openCompleteQuickSession` | UI |
| L2219 | `deleteCurrentSession` |  |
| L2227 | `openDeleteConfirm` | UI |
| L2231 | `closeDeleteConfirm` | UI |
| L2235 | `togglePopupMid` | UI |
| L2244 | `toggleInReview` | UI |
| L2256 | `starSession` |  |
| L2262 | `starCurrentSession` |  |
| L2281 | `popParseHora` |  |
| L2295 | `saveResetFromPopup` | Save / Load |
| L2323 | `_previewProjConfirmChange` | Internal |
| L2325 | `prevProjId` |  |
| L2368 | `savePreviewProject` | Save / Load |
| L2378 | `toProj` |  |
| L2390 | `popCorrectParseHora` |  |
| L2404 | `saveCorrectHoraFromPopup` | Save / Load |
| L2424 | `unlockNowFromPopup` |  |
| L2438 | `renderBacklogRefs` | Render |
| L2446 | `item` |  |
| L2474 | `refreshPopupRefs` |  |
| L2490 | `onPopupRefSearch` | Events |
| L2501 | `matches` |  |
| L2524 | `linkBacklogItem` |  |
| L2534 | `item` |  |
| L2546 | `unlinkBacklogItem` |  |
| L2554 | `item` |  |
| L2566 | `startPopupEdit` |  |
| L2608 | `commit` |  |
| L2620 | `cancel` |  |
| L2636 | `startRename` |  |
| L2644 | `commit` |  |
| L2654 | `duplicate` |  |
| L2662 | `cancel` |  |
| L2672 | `editNotes` |  |
| L2695 | `saveNotes` | Save / Load |
| L2704 | `cancelNotes` |  |
| L2708 | `renderNotesDisplay` | Render |
| L2724 | `checkNotesOverflow` |  |
| L2737 | `_saveLogFilters` | Internal |
| L2747 | `_loadLogFilters` | Internal |
| L2767 | `_getAllSessionsChron` | Internal |
| L2780 | `_logAIList` | Internal |
| L2789 | `_sessType` | Internal |
| L2795 | `_sessTypeLabel` | Internal |
| L2803 | `_sessTypePill` | Internal |
| L2812 | `_buildLogHeader` | Internal |
| L2816 | `aiPills` |  |
| L2833 | `projOptions` |  |
| L2862 | `_buildLogRow` | Internal |
| L2904 | `_rebuildLogBody` | Internal |
| L2914 | `filtered` |  |
| L2937 | `rows` |  |
| L2991 | `_logScrollTop` | Internal |
| L2996 | `scrollToLogCard` |  |
| L3021 | `closeLogCard` | UI |
| L3031 | `setLogFilterAI` | Utils |
| L3037 | `setLogFilterType` | Utils |
| L3043 | `setLogFilterProj` | Utils |
| L3049 | `setLogFilterStarred` | Utils |
| L3056 | `clearLogFilters` |  |
| L3067 | `onLogSearch` | Events |
| L3132 | `navigateToBacklogItem` |  |

## ai-tracker-sprint-project.js (1,219 líneas)

| Línea | Función / Constante | Área |
|-------|---------------------|------|
| L8 | `_docPrefix` | Internal |
| L15 | `_buildCurrentStateMd` | Internal |
| L25 | `pendientes` |  |
| L40 | `lastWithBlocker` |  |
| L54 | `_backlogVersion` | Internal |
| L63 | `_lastClosedSprint` | Internal |
| L65 | `closed` | UI |
| L71 | `exportBacklogMd` | Export / Import |
| L79 | `exportFullHistoryMd` | Export / Import |
| L90 | `_generateFullHistoryBySprintMd` | Internal |
| L93 | `pad` |  |
| L102 | `_sprintNum` | Internal |
| L114 | `sprintsWithData` |  |
| L122 | `_itemRow` | Internal |
| L129 | `_itemRowHeader` | Internal |
| L135 | `spItems` |  |
| L136 | `doneItems` |  |
| L137 | `doneEffort` |  |
| L138 | `totalEffort` |  |
| L161 | `legacyItems` |  |
| L168 | `noSprintItems` |  |
| L212 | `_showExportConfirmModal` | Internal |
| L233 | `_generateBacklogMd` | Internal |
| L239 | `pad` |  |
| L290 | `doneCount` |  |
| L291 | `backlogCount` |  |
| L366 | `_buildIndexLines` | Internal |
| L387 | `_buildItemsMd` | Internal |
| L464 | `_getActiveProjectFilter` | Internal |
| L468 | `_setActiveProjectFilter` | Internal |
| L475 | `_updateProjBreadcrumb` | Internal |
| L479 | `_updateProjFilterBtn` | Internal |
| L499 | `clearProjectFilter` |  |
| L511 | `openProjPanel` | UI |
| L519 | `closeProjPanel` | UI |
| L526 | `renderProjPanel` | Render |
| L559 | `_countProjSessions` | Internal |
| L563 | `selectProjectFilter` |  |
| L587 | `openProjModal` | UI |
| L619 | `closeProjModal` | UI |
| L624 | `cancelProjForm` |  |
| L638 | `_renderProjColorRow` | Internal |
| L646 | `selectProjColor` |  |
| L651 | `confirmProjForm` |  |
| L686 | `_renderProjList` | Internal |
| L695 | `activeProjs` |  |
| L696 | `archivedProjs` |  |
| L698 | `_projRow` | Internal |
| L741 | `editProjInline` |  |
| L761 | `toggleProjArchive` | UI |
| L776 | `deleteProjConfirm` |  |
| L795 | `projDragStart` |  |
| L799 | `projDragEnd` |  |
| L804 | `projDragOver` |  |
| L810 | `projDragLeave` |  |
| L813 | `projDrop` |  |
| L818 | `fromIdx` |  |
| L819 | `toIdx` |  |
| L828 | `getProjectById` | Utils |
| L832 | `getProjectsByAI` | Utils |
| L837 | `getProjContext` | Utils |
| L841 | `setProjContext` | Utils |
| L848 | `getProjBacklog` | Utils |
| L852 | `setProjBacklog` | Utils |
| L864 | `_notesKey` | Internal |
| L868 | `_loadNotes` | Internal |
| L874 | `_saveNotes` | Internal |
| L880 | `_noteId` | Internal |
| L885 | `createNote` | Builder |
| L901 | `editNote` |  |
| L905 | `idx` |  |
| L919 | `deleteNote` |  |
| L923 | `filtered` |  |
| L931 | `getActiveProjectNotes` | Utils |
| L937 | `_filteredAIs` | Internal |
| L981 | `_checkOnboarding` | Internal |
| L991 | `_renderOnboardingSteps` | Internal |
| L1033 | `_onboardingStepAction` | Internal |
| L1038 | `_dismissOnboarding` | Internal |
| L1110 | `cleanupLocalStorage` |  |
| L1142 | `_getLocalStorageUsage` | Internal |
| L1153 | `testLocalStorageQuota` |  |

## env.js (4 líneas)

_Sin elementos detectados._

## ai-tracker-extra.css (16,879 líneas)

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
| L3220 | END R-202605-113 |
| L3224 | R-202604-066: Microinteracciones header |
| L3312 | END R-202604-066 |
| L3314 | R-202604-065: Rediseño header global |
| L3658 | END R-202604-065 |
| L3660 | T-202604-268: QUICK NOTE |
| L3832 | END T-202604-268/270 |
| L3834 | T-202604-269: NOTAS EN VISTA DE PROYECTO |
| L3932 | END T-202604-269 |
| L3934 | T-202604-265: SPRINT HEALTH INDICATOR |
| L4222 | END T-202604-265 |
| L4224 | R-202605-123: Sprint Goal |
| L4285 | END R-202605-123 |
| L4287 | T-202604-263: ÚLTIMA SESIÓN EN CARD DE PROYECTO |
| L4342 | END T-202604-263 |
| L4344 | T-202604-264: ÍTEMS SUGERIDOS EN VISTA PROYECTO |
| L4419 | END T-202604-264 |
| L4421 | B-202604-129: supersedido por R-202605-113 — strip nativo reemplaza expand button |
| L4423 | END B-202604-129 |
| L4425 | T-202604-276: Trend badges — acelerando / desacelerando en Tab Proyectos |
| L4447 | END T-202604-276 |
| L4449 | T-202604-281: Empty states unificados — Tracker, Proyectos, Backlog, Analytics |
| L4499 | END T-202604-281 |
| L4501 | T-202604-284 — Sprint Roadmap |
| L4608 | END T-202604-284 |
| L4610 | T-202604-275: Patrones de productividad |
| L4704 | END T-202604-275 |
| L4706 | T-202604-274: Checkpoints por proyecto |
| L4815 | END T-202604-274 |
| L4817 | T-202604-293: Unified Search Panel |
| L4901 | END T-202604-293 |
| L4903 | T-202604-286: Mencionado en — sección en ítem expandido del Backlog |
| L4950 | END T-202604-286 |
| L4952 | T-202604-287: KANBAN VIEW |
| L5191 | END T-202604-287 |
| L5193 | T-202604-289: Decisiones del proyecto |
| L5414 | END T-202604-289 |
| L5416 | B-202604-XXX: Kanban — listEl no se comprime cuando hay contenido visible |
| L5429 | END B-202604-XXX |
| L5431 | S-CPR: CSS Purity Refactor — utilidades |
| L5566 | END S-CPR: utilidades |
| L5568 | R-202604-036: Merge Diff Panel — viz-* content styles |
| L5780 | END R-202604-036 |
| L5781 | R-202604-046: HTML-MAP filter pills — estado visual diferenciado |
| L5892 | END R-202604-046 |
| L5895 | migrated from index.html <style> block 1 |
| L5896 | T-202604-210: Backup button in header |
| L5932 | T-202604-210: logo-version pill oculto (versión en tooltip) |
| L6148 | R-202604-016: Log Card |
| L6447 | migrated from index.html <style> block 2 |
| L6766 | T-CSS-PURITY: Static inline style= → CSS classes (Phase 2) |
| L6814 | T-CSS-PURITY: card-notes-ta auto-resize via CSS var |
| L6817 | T-CSS-PURITY: proj color dots via --proj-color CSS var |
| L6823 | T-CSS-PURITY: session.js — Fase 2 clases HTML generado |
| L6867 | T-202604-CSS-BACKLOG: CSS Purity — backlog.js static style= → classes |
| L6887 | T-202604-204: Docs Onboarding |
| L6908 | Context Panel |
| L7088 | Analytics V2 |
| L7322 | T-202604-272: Badge Estancado |
| L7334 | T-202604-322: Analytics Legibility |
| L7415 | S-09: Analytics Layout R-069 + T-399/400/403/404/405 |
| L7548 | R-202604-070: Comparación side-by-side |
| L7609 | T-202604-401: KPI color semántico + sparkline |
| L7636 | T-202604-402: KPI row nuevas métricas |
| L7644 | T-202604-406: Patrones productividad — efectividad cruzada |
| L7669 | T-202604-407: Microinteracciones Analytics |
| L7709 | T-202605-454: Insight de horas productivas — accionable desde heatmap |
| L7776 | END T-202605-454 |
| L7778 | T-202605-453: Tiempo promedio pendiente → done |
| L8024 | END T-202605-453 |
| L8026 | T-202604-187: Backlog Styles |
| L8074 | T-202604-323: HtmlMap Bar Styles |
| L8106 | DROPZONE — Importación unificada Backlog / HTML-MAP / Context |
| L8817 | R-202604-071: Merge Diff Panel — rediseño completo two-column |
| L9280 | END R-202604-071 |
| L9282 | R-202605-096: Toast bloqueante → confirmación inline en panel DIFF |
| L9399 | END R-202605-096 |
| L9401 | B-202604-160: 'En curso' status — badge + filtro |
| L9407 | END B-202604-160 |
| L9409 | B-202604-166: Sección 'En curso' en renderBacklogList |
| L9416 | END B-202604-166 |
| L10910 | T-202604-412: Document Generator — estilos migrados de index.html <style> |
| L10949 | END T-202604-412: Document Generator |
| L11184 | END S-07 |
| L11583 | R-202604-069: Analytics layout — ancho completo · zonas visuales definidas |
| L11722 | R-[pendiente-ID]: Unified Merge Diff Panel — retrocesos y descartes inline |
| L11823 | END R-[pendiente-ID]: Unified Merge Diff Panel |
| L11825 | R-202604-077: CKPT Diff Panel Unificado — confirmaciones post-CHECKPOINT |
| L12064 | END R-202604-077 |
| L12066 | R-202604-059: Grid Tracker 3 columnas |
| L12509 | END R-202604-059 |
| L12518 | R-202604-061: Microinteracciones Tracker — S-10 |
| L12606 | END R-202604-061 |
| L12613 | R-202604-062: Layout y visual cards Proyectos |
| L12684 | END R-202604-062 |
| L12686 | R-202604-064: Microinteracciones Proyectos |
| L12735 | END R-202604-064 |
| L12737 | R-202604-063: Funcionalidad Proyectos — estilos de soporte |
| L12815 | END R-202604-063 |
| L12917 | T-202604-414: Panel diff — delta real por campo en actualizaciones |
| L13019 | END T-202604-414 |
| L13021 | R-202604-091: Fusionar en curso con pendiente — decorador visual de actividad |
| L13435 | END R-202604-089 |
| L13502 | END T-202604-416 |
| L13526 | END R-202605-139 |
| L13551 | END T-202604-426 |
| L13559 | R-[tmp:toolbar-backlog-redesign]: Toolbar · Filter Strip · Sprint Selector |
| L14030 | END R-[tmp:toolbar-backlog-redesign] |
| L14032 | [tmp:sprint-header-pills] — status-pill · sprint header badges |
| L14076 | END [tmp:sprint-header-pills] |
| L14078 | B-202605-217 — bl-sprint-trigger-bar-fill: width via CSS var |
| L14082 | END B-202605-217 |
| L14084 | B-202605-218 — SCM modal: clases CSS Purity |
| L14098 | END B-202605-218 |
| L14100 | R-202605-095 — Toast bloqueante → confirmación inline en panel DIFF |
| L14198 | END R-202605-095 |
| L14200 | R-202605-098: Ciclo de vida y representación visual diferenciada — ítems tipo P |
| L14398 | END R-202605-098 |
| L14400 | T-202604-417: Retrospectiva integrada al flujo de cierre |
| L14652 | END T-202604-417 |
| L14769 | T-202605-440: CSS — modal--retro · bl-sprint-retro-btn · sprint-action-retro · is-hidden retro overlay |
| L14774 | END T-202605-440 |
| L15549 | FIN HISTÓRICO UNIFICADO |
| L15551 | T-202605-452: Flujo acumulativo — ítems entrando vs saliendo |
| L15717 | FIN T-202605-452 |
| L15737 | FIN T-202604-423 |
| L16306 | R-202605-104: Jerarquía visual sección Ideas — indentado exclusivo padre-hijo |
| L16353 | END R-202605-104 |
| L16534 | T-202605-479 — iPad 768–1024px breakpoint |
| L16565 | END T-202605-479 |
| L16567 | T-202605-478 — 2560px ultrawide: contenedores de contenido |
| L16587 | END T-202605-478 |
| L16773 | END macOS FIDELITY |

## ai-tracker.css (7,659 líneas)

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
| L7623 | END R-202605-099 |
| L7625 | R[tmp:magic-link-auth]: Auth modal — Google + Magic link |
| L7658 | END R[tmp:magic-link-auth] |

## index.html (1,989 líneas)

| Líneas | Sección |
|--------|---------|
| L23 | SPLASH PEPE |
| L36 | HEADER COMPARTIDO |
| L136 | RADAR SIDEBAR GLOBAL |
| L174 | TAB TRACKER |
| L306 | TAB BACKLOG |
| L563 | TAB ANALYTICS |
| L568 | TAB PROYECTOS |
| L573 | OVERLAYS / MODALES (Tracker) |
| L605 | T-011: AVATAR SELECTOR MODAL |
| L722 | T-202604-009: ONBOARDING PRIMER USO |
| L1054 | R-202604-047: STATIC MODAL SHELLS |
| L1310 | FIN R-202604-047 STATIC MODAL SHELLS |
| L1312 | T-202604-419: COMMAND PALETTE |
| L1324 | FIN T-202604-419 COMMAND PALETTE |
| L1395 | DOC LOG DRAWER |
| L1481 | DOCUMENT GENERATOR OVERLAY — R-202604-053 · UX R-202605-102 |
| L1626 | AI STATUS BAR — DEPRECATED T-202604-254 |

