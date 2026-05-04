# PP-BACKLOG_v3.4.md
<!-- Versión: v3.4 | Última actualización: 2026-05-03 18:32 UTC-6 | App: AI-Tracker-v3.4 -->

---

## Meta

| Campo | Valor |
|---|---|
| Proyecto | AI Tracker |
| Versión del backlog | v3.4 |
| Última actualización | 2026-05-03 18:32 UTC-6 |
| Generado por | TL — exportado desde app |

---

## Estado actual

**Pendientes:** P=4 | R=1 | T=5 (10 total)

---
## Índice de estado

```
T: 481 pendiente | 482 pendiente | 483 pendiente | 484 pendiente | 485 pendiente
R: 115 pendiente
P: 228 pendiente | 237 pendiente | 238 pendiente | 239 pendiente
Contadores: P=239 | T=490 | R=119 | B=277
App: v3.4 — exportado desde tracker
```

---

## Ítems

---

### P-202604-228 · Sprint dedicado — Auditoría responsive iPad + Performance CSS + Prep Vercel + PWA básica
**Priority:** low
**Area:** UX · Responsive · Performance
**Effort:** 3
**Impact:** Medio
**Status:** pendiente
**Role:** UX · Nova
**Version:** futura

Sprint dedicado responsive + PWA básica
**CreatedAt:** 1777543141978
**StatusChangedAt:** 1777543141978

---

### P-202605-237 · Shortcuts de teclado sin hints visibles en acciones frecuentes
**Priority:** medium
**Area:** Global · Header
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**Role:** UX · Nova
**Version:** futura

Shortcuts de teclado sin hints visibles en acciones frecuentes
**CreatedAt:** 1777805675715
**StatusChangedAt:** 1777805675715

---

### P-202605-238 · Secciones colapsadas en Context sin preview de contenido
**Priority:** medium
**Area:** Tab Documentos · Context
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**Role:** UX · Nova
**Version:** futura

Secciones colapsadas en Context sin preview de contenido
**CreatedAt:** 1777805675715
**StatusChangedAt:** 1777805675715

---

### R-202605-115 · Deploy infraestructura — Vercel + Supabase + Git
**Priority:** medium
**Area:** Infraestructura / Deploy
**Effort:** 3
**Impact:** Medio
**Status:** pendiente
**Sprint:** S-22
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] AI Tracker desplegado en Vercel — URL pública funcional
- [ ] Persistencia migrada a Supabase — Firebase eliminado
- [ ] localStorage como fallback offline operativo
- [ ] CI/CD activo — git push a main dispara deploy automático
- [ ] Smoke test aprobado en producción
**CreatedAt:** 1777817163085
**StatusChangedAt:** 1777817163085

---

### T-202605-481 · Setup repo GitHub + estructura de archivos para Vercel
**Priority:** high
**Area:** Infraestructura / Deploy
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**Sprint:** S-22
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] Repo github.com/[user]/ai-tracker creado con rama main
- [ ] Archivos del proyecto commiteados — estructura modular respetada
- [ ] vercel.json configurado para servir index.html como entry point
- [ ] .gitignore excluye node_modules, .env, archivos de sistema
- [ ] Primer deploy en Vercel exitoso desde GitHub
**CreatedAt:** 1777817163085
**StatusChangedAt:** 1777817163085

---

### T-202605-482 · Migrar persistencia Firebase → Supabase
**Priority:** medium
**Area:** Infraestructura / Persistencia
**Effort:** 3
**Impact:** Medio
**Status:** pendiente
**Sprint:** S-22
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] Tabla tracker_state creada en Supabase con campos: id, user_id, key, value (jsonb), updated_at
- [ ] SDK supabase-js cargado via CDN — sin npm, sin build step
- [ ] Todas las llamadas a Firebase reemplazadas por equivalentes Supabase
- [ ] Realtime subscription activa — cambios remotos se reflejan en UI sin reload
- [ ] Firebase SDK eliminado del index.html
**CreatedAt:** 1777817163085
**StatusChangedAt:** 1777817163085

---

### T-202605-483 · Fallback offline — localStorage como capa de respaldo
**Priority:** medium
**Area:** Infraestructura / Persistencia
**Effort:** 2
**Impact:** Medio
**Status:** pendiente
**Sprint:** S-22
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] Si Supabase no está disponible, la app opera en modo offline con localStorage
- [ ] Al reconectar, localStorage sincroniza cambios pendientes a Supabase — last-write-wins
- [ ] Indicador visual de estado de sync: online / offline / sincronizando
- [ ] Sin pérdida de datos en transición offline → online
**CreatedAt:** 1777817163085
**StatusChangedAt:** 1777817163085

---

### T-202605-484 · Variables de entorno Vercel + Supabase keys + CI/CD
**Priority:** high
**Area:** Infraestructura / Deploy
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**Sprint:** S-22
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] SUPABASE_URL y SUPABASE_ANON_KEY declaradas como variables de entorno en Vercel
- [ ] Las keys no están hardcodeadas en ningún archivo del repo
- [ ] Deploy automático activo — git push a main dispara build en Vercel
- [ ] Preview deploys activos en PRs — opcional pero configurado
**CreatedAt:** 1777817163085
**StatusChangedAt:** 1777817163085

---

### T-202605-485 · Smoke test deploy — carga, persistencia, sync
**Priority:** high
**Area:** Infraestructura / QA
**Effort:** 1
**Impact:** Medio
**Status:** pendiente
**Sprint:** S-22
**Role:** FS · Rune
**Version:** futura

### Criterios de aceptación
- [ ] App carga en URL de Vercel sin errores de consola
- [ ] Crear sesión → verificar que persiste en Supabase dashboard
- [ ] Abrir en segundo browser → verificar sync en tiempo real
- [ ] Desconectar red → verificar fallback localStorage operativo
- [ ] Reconectar → verificar sync sin pérdida de datos
**CreatedAt:** 1777817163085
**StatusChangedAt:** 1777817163085

---

### P-202605-239 · Centro de Opciones global — reemplaza menú ··· del header
**Priority:** low
**Area:** Header / Configuración global
**Effort:** 3
**Impact:** Medio
**Status:** pendiente
**Role:** PO · Cael
**Version:** futura

Centro de Opciones global — reemplaza menú ··· del header
**CreatedAt:** 1777831941704
**StatusChangedAt:** 1777831941704


---

## Estadísticas finales

| Métrica | Valor |
|---------|-------|
| Ítems totales | 10 |
| Done | 0 |
| Backlog | 0 |
| App version actual | v3.4 |
| Próxima versión | v3.4 |
