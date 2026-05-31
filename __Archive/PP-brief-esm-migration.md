# Brief — Migración a ES Modules · Locus
<!-- Fecha: 2026-05-30 | Autor: Cael | Para: Vera (decisión estratégica) -->

---

## Contexto

Locus opera actualmente con JS clásico: 40+ módulos cargados via `<script>` secuenciales en `index.html`. Las dependencias entre módulos no están declaradas explícitamente — el orden de carga en `index.html` es el único mecanismo de garantía. Funciones de módulos externos se acceden con guards `typeof fn === 'function'` en call sites.

El equipo edita y entrega archivos varias veces por semana. A esa frecuencia, el modelo actual genera fricción acumulativa.

---

## Problema

| Síntoma | Causa raíz |
|---|---|
| Guards `typeof fn === 'function'` en 40+ módulos | Dependencias implícitas — el runtime no garantiza disponibilidad |
| Errores silenciosos cuando una función no carga | Sin declaración explícita de dependencia |
| Orden de `<script>` en `index.html` es frágil | Cualquier reordenamiento puede romper módulos sin aviso claro |
| Refactors de funciones públicas son opacos | No hay forma de saber qué módulos consumen qué sin leer el MAP |

---

## Propuesta

Migrar a **ES Modules nativos** — sin bundler, sin build step, sin cambio de stack.

Solo dos cambios estructurales:
1. Agregar `export` a funciones públicas en cada módulo
2. Agregar `import` explícitos al inicio de cada módulo que consume funciones externas
3. Cambiar `<script>` a `<script type="module">` en `index.html`

El browser moderno soporta ESM nativo. Locus no necesita Vite, Webpack ni ningún compilador.

---

## Lo que cambia

| Qué | Estado actual | Con ESM |
|---|---|---|
| Dependencias entre módulos | Implícitas — orden de `<script>` | Explícitas — `import` en el archivo |
| Guards de disponibilidad | `typeof fn === 'function'` en call sites | Eliminados — import garantiza disponibilidad |
| Errores de dependencia | Silenciosos en runtime | Visibles al cargar en consola |
| Refactor de función pública | Opaco — buscar en MAP | Explícito — import roto es visible inmediatamente |
| Build step | Ninguno | Ninguno — ESM nativo en browser |
| Supabase / localStorage / CSS | Sin cambio | Sin cambio |

---

## Lo que requiere decisión

**`window.Locus` en `locus-api.js`** — el contrato público actual expone funciones via global. Con ESM hay dos opciones:

| Opción | Descripción | Trade-off |
|---|---|---|
| Mantener como global | `locus-api.js` sigue exponiendo `window.Locus` | Compatibilidad total, no aprovecha ESM al 100% |
| Migrar a export nombrado | Consumidores importan directamente desde `locus-api.js` | Más limpio, rompe call sites actuales |

Recomendación de Cael: mantener `window.Locus` en una primera fase — reduce el scope de la migración y permite validar ESM antes de tocar el contrato público.

---

## Costo estimado

| Fase | Scope | Effort estimado |
|---|---|---|
| Fase 1 | Agregar `export` a módulos + `import` en consumidores + `type="module"` en `index.html` | Alto — 40+ archivos |
| Fase 2 | Eliminar guards `typeof fn === 'function'` residuales | Medio |
| Fase 3 (opcional) | Migrar `window.Locus` a export nombrado | Medio |

Fase 1 y 2 pueden ir en un sprint. Fase 3 es decisión posterior.

---

## Documentos que se actualizan

| Documento | Sección | Cambio |
|---|---|---|
| `PP-context` §7 | Invariantes de arquitectura | Eliminar regla de guard. Orden de carga pasa a grafo de dependencias |
| `PP-strategy` §6 | Stack técnico | Declarar `type="module"`. Nota crítica de disponibilidad en runtime queda obsoleta |
| `__BR-Execution §2` | Reglas de implementación | Eliminar regla de guard explícito en call sites |
| `OB-STRATEGY §10` | Decisiones registradas | Nueva entrada con fecha y contexto |

---

## Pregunta para Vera

¿Se abre el R de migración ESM en el próximo sprint de Locus, o se registra como P en el backlog para evaluación posterior?
