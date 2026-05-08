# AS-CONTEXT_V0_4.md
<!-- Versión: 0.4 | Última actualización: 2026-05-06 | ASVAB App — fuente de verdad del proyecto -->

---

## 1. Identidad

| Campo | Valor |
|---|---|
| Nombre | ASVAB App |
| Tipo | Web app — producto final monetizable |
| Holding | Obsidian Labs |
| Descripción | App de estudio para hispanohablantes preparándose para el U.S. Army |
| Repo | github.com/wilfridoelenes/asvab-quiz |
| Deploy | Vercel — GitHub auto-deploy |
| Stack | Vite + Firebase Auth + Firestore, ES6 modules con npm |

---

## 2. Estado actual

| Campo | Valor |
|---|---|
| Versión app | v3.2.0.0 |
| Sprint activo | S-04 |
| Fase | S-03 done — S-04 en curso |

---

## 3. Roles

| Rol | Nombre | Función |
|-----|--------|---------|
| PO + BA Transversal | Cael | Refinamiento, criterios de aceptación, backlog |
| FS Transversal | Rune | Implementación frontend, backend, quiz logic |
| UX Transversal | Nova | Diseño visual, componentes quiz, UX |
| QA Transversal | Finn | Testing funcional end-to-end |

---

## 4. Funcionalidades activas

- **4 áreas AFQT activas:** WK (3,499 preguntas) · AR (2,250 preguntas) · MK · PC
- Auth Google
- Gamificación: XP, rangos, badges, streaks, vidas, misiones
- Modos: examen, supervivencia, flashcards, repaso, palabras difíciles
- Estadísticas avanzadas por pregunta / lección / historial
- Themes militares (9), traducción parcial, exam mode, haptic/sound
- Loader dinámico de preguntas por sección con cache IndexedDB
- Manifest por sección — secciones inactive visibles como "Próximamente"
- Import dinámico de category-config slices por sección
- Árbol jerárquico de lecciones con bloqueo secuencial (70% threshold)
- Tipos de lección diferenciados: Warm-Up (L00), Repaso (RA/RB/RC), Bonus Round (BR-NN)
- Gate freemium: ≤30% de preguntas por área en free, pago único desbloquea todo
- Pantalla de pricing con CTA a canal externo (WhatsApp/email) — activación manual por operador
- Firestore Security Rules: isPremium no escribible desde cliente
- Analytics Firebase: login, quiz completado, área iniciada, paywall_shown, pago
- Onboarding nuevo usuario: 3 pasos, explica áreas AFQT, no bloqueable
- UI completamente en español
- AFQT estimado calculado con las 4 áreas

---

## 5. Modelo de pago

Pago único. Canal externo manual (WhatsApp o email). El operador activa `isPremium:true` manualmente via Admin SDK o consola Firebase. R-202604-025 (Stripe directo) está pendiente para Fase 3.

---

## 6. Pendientes

| Ítem | Descripción | Sprint |
|------|-------------|--------|
| T-202604-006 | QA end-to-end pre-lanzamiento | S-03 |
| T-202604-007 | Refactor CSS — extraer de index.html | S-04 |
| T-202604-009 | QA end-to-end pre-lanzamiento (Finn) | S-03 |
| R-202604-011 | Landing page externa | S-03 |
| R-202604-012 | Dashboard de métricas | S-04 |
| R-202604-013 | Notificaciones de racha | S-04 |
| R-202604-014 | Expansión contenido — 9 áreas ASVAB | S-04 |
| R-202604-025 | Integración Stripe real — reemplaza canal externo | Fase 3 |
| P-202604-003 | Preguntas detrás de auth (Firestore/Storage) | pendiente |
| P-202604-004 | paywall.js — violación CSS Purity §15 | S-04 |

---

## 7. Arquitectura

| Archivo | Descripción | Líneas |
|---------|-------------|--------|
| `js/app.js` | Bootstrap, auth, manifest + loader | 151 |
| `js/category-config.js` | Taxonomía completa WK + AR (monolito) | 7,458 |
| `js/category-config/ar.js` | Slice AR | 1,459 |
| `js/category-config/index.js` | Re-export monolito (fallback) | 7,459 |
| `js/category-config/mk.js` | Slice MK | 1,854 |
| `js/category-config/pc.js` | Slice PC | 1,494 |
| `js/category-config/wk.js` | Slice WK | 2,699 |
| `js/core/questionsLoader.js` | Loader dinámico + IndexedDB cache | 160 |
| `js/core/firebase.js` | Firebase init | 62 |
| `js/core/state.js` | Estado global, saveUserData | 220 |
| `js/core/nav.js` | Navegación, handleBack | 109 |
| `js/core/feedback.js` | Sonidos, haptic, toasts | 178 |
| `js/core/utils.js` | Insignias, getLevel, XP display | 152 |
| `js/features/settings.js` | Settings, tema militar, fuente | 251 |
| `js/features/badges.js` | Badges, avatares, onboarding | 227 |
| `js/features/paywall.js` | Gate freemium, pricing screen | 168 |
| `js/levels.js` | Rangos, badges array | 91 |
| `js/screens/quiz.js` | Quiz, timer, streak, supervivencia | 824 |
| `js/screens/results.js` | Resultados, examen ASVAB, certificado | 493 |
| `js/screens/home.js` | Home, AFQT, flashcards, misiones | 1,792 |
| `js/screens/category.js` | Árbol jerárquico, subtipos WK | 715 |
| `index.html` | HTML + CSS principal + modales | 1,940 |
| `vite.config.js` | Config Vite | 33 |

**Total líneas:** ~29,989

---

## 8. Esquema de pregunta

```json
{
  "id": "AR-1.1-L00-Q001",
  "section": "ar",
  "category": "ar",
  "lesson": "Warm-Up",
  "difficulty": 2,
  "question": "texto en inglés",
  "options": ["A. opción", "B. opción", "C. opción", "D. opción"],
  "correct_index": 0,
  "explanation": "tip o explicación",
  "_keyword": null,
  "_translation": null,
  "_question_es": null
}
```

`topic`/`subtopic` eliminados del schema — viven solo en `LESSON_META` del category-config. `_keyword/_translation`: string para WK, null para AR/MK/PC. `_question_es`: poblado en AR/MK/PC desde R-202604-002.

---

## 9. Manifest

```json
{
  "generated": "2026-04-22T01:03:00",
  "cm_version": "V7.13.4.12",
  "sections": {
    "wk":  { "url": "public/questions/wk.json", "count": 3499, "hash": "d76ea066", "active": true },
    "ar":  { "url": "public/questions/ar.json", "count": 2250, "hash": "edc04271", "active": true },
    "mk":  { "url": "public/questions/mk.json", "count": 2750, "hash": null,       "active": true },
    "pc":  { "url": "public/questions/pc.json", "count": 2325, "hash": null,       "active": true }
  }
}
```

---

## 10. Decisiones de arquitectura

| Decisión | Detalle |
|----------|---------|
| Bundler | Vite — `npm run dev` / `npm run build` |
| ACTIVE_QUESTIONS | Inicia `[]`; se puebla async tras `loadExtraQuestions()` en auth |
| Preguntas — carga | Fetch dinámico `public/questions/{section}.json` via `questionsLoader.js` |
| Cache preguntas | IndexedDB `asvab-questions-db` v2; invalidación por hash del manifest |
| Manifest | `public/questions.manifest.json` — cargado una vez por sesión en `onAuthStateChanged` |
| category-config slices | Import dinámico lazy en `_renderASVABSection`; cache en `_loadedSlices` |
| Modo Supervivencia | Usa `_survivalLives` locales, NO `prefs.lives` |
| AFQT header | Mini-badge `#afqtHeaderBadge` — calcula con 4 áreas |
| Firestore | `users/{uid}`, debounce 1s via `saveUserData()` |
| isPremium | No escribible desde cliente — solo Admin SDK o consola Firebase |
| Modelo de pago | Canal externo manual (WhatsApp/email); Stripe en Fase 3 (R-025) |
| Deploy | Vercel ← GitHub auto-deploy |
| Bloqueo lecciones | Lección N bloqueada si N-1 < 70% completado |
| Tipos de lección | Warm-Up (L00), Regular (L01+), Repaso (RA/RB/RC), Bonus Round (BR-NN) |
| CSS Purity | Pendiente en paywall.js (P-202604-004 — S-04) |

---

## 11. Bridges

| Bridge | De → A | Descripción |
|--------|--------|-------------|
| `window._quizModule` | quiz.js → settings.js | applyFocusMode / stopQuestionTimer |
| `window._showResultsScreen` | results.js → quiz.js | mostrar resultados |
| `window._checkPerfectLesson` | quiz.js (interno) | verificar lección perfecta |
| `window._hideLivesOutsideQuiz` | quiz.js → nav.js | ocultar vidas |
| `window._survivalState` | quiz.js | estado supervivencia |
| `window._sessionXP` | quiz.js → results.js | XP ganado en sesión |
| `window._streakSaveComplete` | home.js → quiz.js | resultado mini-quiz racha |
| `window._onBootcampComplete` | home.js → quiz.js | badge bootcamp_grad |
| `window._getXP` | home.js → index.html | prefs.xp para openRanksModal |
| `window._getInsigniaHTML` | home.js → index.html | insignia para openRanksModal |
| `window._levelsModule` | levels.js (via app.js) | LEVELS/BADGES/ICONS en runtime |
| `window._checkDailyChallenge` | home.js → quiz.js | verificar en pick() |
| `window._checkFieldMissions` | home.js → quiz.js | verificar misiones en pick() |
| `window._updateTodayBestStreak` | home.js → quiz.js | mejor racha del día |
| `window._updateHeaderInsignia` | home.js → cualquier módulo | actualizar header |
| `window._updateAFQTBadge` | home.js → cualquier módulo | badge AFQT header |
| `window.handleBackFromResults` | nav.js | limpia screenQuiz del stack |
| `window.getLessonLocation` | category.js | wrapper de getLessonLocation |
| `window._showLockedToast` | category.js | toast de lección bloqueada |

---

## 12. Backlog

| Tipo | Contadores |
|---|---|
| R | 025 |
| T | 009 |
| P | 004 |
| B | 005 |

**Done:** R001–006 · R008 · R010 · R015 · R017–019 · R021–024 · T001–005 · T008 · B001–005 · P002
**Pendiente S-04:** R011–014 · T006–007 · T009 · P003–004
**Descartado:** R007 · R009 · R016 · R020 · R025 pendiente Fase 3

---

## 13. Dependencias

- P-202604-003 (preguntas detrás de auth) — no tiene dependencias bloqueantes, es mejora de seguridad post-launch
- R-202604-025 (Stripe real) — activa cuando haya datos reales de conversión (Fase 3 trigger: Lena)
- T-202604-009 / T-202604-006 — QA pre-lanzamiento, bloquean go-live

---

## 14. Decisiones

| Fecha | Decisión |
|-------|----------|
| 2026-04-21 | Loader dinámico por sección + IndexedDB cache implementado |
| 2026-04-22 | 4 áreas AFQT activas en manifest |
| 2026-04-28 | Modelo de pago: canal externo manual — Stripe en Fase 3 |
| 2026-04-28 | isPremium no escribible desde cliente — solo Admin SDK |
| 2026-04-28 | Roles legacy (Axis/Rex) reemplazados por Cael/Rune |

---

## 15. Notas de sesión

**2026-04-28 — Actualización de roles y modelo de pago**
- Roles legacy actualizados en tabla de roles
- Modelo de pago canal externo manual documentado

**2026-05-06 — Estandarización de headers con Rune**
- Headers de sección numerados y estandarizados (T-202605-497)
- Holding actualizado de `Obsidiana` a `Obsidian Labs`
- Sección `## 15. Commands` agregada

---

## 16. Commands

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo Vite — `http://localhost:5173` |
| `npm run build` | Genera build de producción en `/dist` |
| `npm run lint` | Lint del proyecto (si configurado en `package.json`) |

> Deploy automático en Vercel al hacer push a la rama principal del repo. No requiere comando manual de deploy.
