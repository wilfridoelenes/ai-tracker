# CONTEXT — AI Tracker
# CONTEXT.md
<!--
  Versión: v3.3
  Última actualización: 2026-05-03 00:02 UTC-6
  Reglas generales: nombre archivo + numeración oficial + CHECKPOINT acumulativo
-->

Versión: v3.3
Última actualización: 2026-05-03 00:02 UTC-6
Archivo principal: `AI-Tracker-v3.2.6.html`

---

## Estado actual

| Campo | Valor |
|---|---|
| Archivo principal | `AI-Tracker-v3.2.6.html` |
| Sprint activo | S-18 |
| Sprint cerrado más reciente | S-17 |
| Contadores | P=227 · T=454 · R=103 · B=207 |


---

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | HTML + CSS custom (CSS vars, dark/light theme) |
| Lógica | Vanilla JS ES6 (sin frameworks, sin build step) |
| Persistencia | `localStorage` — clave `ai-tracker-v4` + `backlog-items` + `backlog-meta` |
| Sync | Firebase Firestore (opcional) — SDK vía CDN, modo offline automático |


---

## Proyectos registrados

| Proyecto | Estado | Sprints | Sesiones | Ítems |
|---|---|---|---|---|
| AI Tracker | active | 20 | 1289 | 509 |
| Content Manager | active | 3 | 198 | 131 |
| ASVAB APP | active | 1 | 94 | 28 |
| Obsidiana Holding | active | 0 | 50 | 10 |


---

## Tabs de la app

| Tab | ID | Default | Descripción |
|-----|----|---------|-------------|
| 🗂 Tracker | `tab-tracker` | ✅ activo | Vista principal — Cards / Log / Proyecto |
| 📁 Proyectos | `tab-proyectos` | — | Dashboard de proyectos |
| 🗃 Documentos | `tab-backlog` | — | Sub-tabs: Backlog / HTML-MAP / Context |
| 📊 Analytics | `tab-analytics` | — | Gráfico sesiones/mes + ranking + streaks + heatmap + histograma |

**Radar (`📡`):** sidebar global, no un tab. DOM: `#radar-sidebar`. Toggled via `toggleRadarSidebar()`.


---

## localStorage — keys activas

| Key | Descripción |
|-----|-------------|
| `ai-tracker-v4` | State principal serializado |
| `backlog-items[-{projId}]` | Array de ítems del Backlog.md importado |
| `backlog-meta[-{projId}]` | `{ version, updated, importedAt, counters }` |
| `backlog-log` | Historial de cambios del backlog |
| `context-log` | Log de acciones sobre el Context |
| `html-map-log` | Log de acciones sobre el HTML-MAP |
| `html-map-raw[-{projId}]` | Texto raw del HTML-MAP.md importado |
| `html-map-sections[-{projId}]` | Array de secciones parseadas del HTML-MAP |
| `html-map-meta[-{projId}]` | `{ file, version, importedAt, total }` |
| `context-raw[-{projId}]` | Texto raw del CONTEXT.md importado |
| `context-sections[-{projId}]` | Secciones parseadas del CONTEXT (JSON) |
| `context-meta[-{projId}]` | `{ version, updated, importedAt }` |
| `notes-{projId}` | Notas rápidas por proyecto |
| `active-tab` | Tab activo al cerrar |
| `tracker-view-mode` | Modo de vista del tab Tracker: `cards` \| `chrono` \| `project` |
| `backlog-view-mode` | Modo vista Backlog: plano \| tree \| kanban |
| `tmp-id-map` | Mapeo `{ slug → { code, createdAt } }`. TTL 24h |
| `ai-tracker-changelog` | Historial interno de cambios (max 50 entradas) |

Keys con sufijo `-{projId}` cuando hay proyecto activo (via `_tplKey(base)`).


---

## Decisiones técnicas registradas

_Sin decisiones técnicas registradas en el proyecto activo._


---

## Gaps / pendientes sprint activo

_Sin ítems pendientes en el sprint activo._


---

## Notas

Documento generado automáticamente desde AI Tracker vv3.3.
Importa este archivo en la siguiente sesión.

