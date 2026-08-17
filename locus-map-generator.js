// [PP] mod:38 · autor:Rune · 2026-08-16 UTC-6
// TKT-202608-367 (REQ-202608-147): _mgParseHeaderVersion() nueva — extrae la versión declarada
// en la 2ª línea del header interno del MAP recién generado (docs.map). _mgShowPreview() la
// compara contra el nombre de archivo propuesto (variable `version`, de _mgGetVersion() —
// misma fuente ya usada para el filename mostrado en el preview, línea ~1180) y, si difieren,
// agrega un banner no bloqueante (reutiliza .mg-open-sprint-warning/.mg-warn-title/.mg-warn-body/
// .mg-warn-sprint-id de locus-document-generator.css, mod:8, B-202605-071 — sin CSS nuevo) debajo
// del preview existente, sin reemplazarlo ni deshabilitar #mg-confirm-btn. Causa raíz del
// desalineamiento histórico (_PP-map-v1.28.0.md con header v1.27.0, ver _pp-context §8):
// _mgShowPreview() calcula el filename propuesto con _mgGetVersion() (versión efectiva /
// input manual), mientras _generateMap() escribe el header interno con _mgGetMapVersion()
// (version_target del sprint activo) — dos fuentes de versión distintas que _doConfirmGenerate()
// ya reconcilia correctamente para el filename de descarga real (línea ~1302, T-202606-148),
// pero que el preview mostrado antes de confirmar nunca contrastaba. Edge case: si docs.map
// aún no existe o el header no matchea el regex esperado, no se evalúa — sin falso positivo.
// [PP] mod:37 · autor:Rune · 2026-08-05 UTC-6
// TKT1 (REQ ref_id CAEL-0804-01): _mgUpdateStepper() nueva — sincroniza .mg-stepper-step--active/
// --done y #mg-step-badge con el estado real (_mapGen.files.length + estado de #mg-confirm-btn).
// Invocada desde _mgRenderFileList() (cambia al agregar/quitar archivo), _mgResetPreview() (cubre
// apertura vía openMapGenerator y remoción de archivo, que ya llama a esta función) y
// _mgShowPreview() (MAP generado). No_incluye declarado en el TKT: no oculta secciones del
// mg-body, no invalida preview al agregar archivo post-generación (gap preexistente en
// _mgLoadFiles, fuera de scope de este TKT).
// [PP] mod:35 · autor:Rune · 2026-07-30 UTC-6
// TKT2/TKT3/TKT4 (REQ-[pendiente-ID], ref_id CAEL-0730-01): Document Generator queda exclusivo a
// MAP. Retirados de generateDocuments()/_mgShowPreview()/_doConfirmGenerate()/_mgExportAllZip():
// generación y empaquetado de CONTEXT (competía con el flujo manual de __BR-Core §8), BACKLOG y
// BACKLOG-FULL (exportBacklogMd()/exportFullHistoryMd() en locus-backlog-generator.js siguen
// siendo el camino vigente, sin cambio) e Incidentes (Q-INC) (_generateIncidentsMd() en
// locus-incidents-generator.js sigue siendo el camino vigente, sin cambio). Funciones locales
// _generateContext()/_generateBacklog() eliminadas — sin otro consumidor tras el retiro de sus
// call sites. Imports huérfanos retirados: buildBacklogMd, _importContextMdFromText,
// _generateFullHistoryContent, exportBacklogMd/exportContextMd/exportFullHistoryMd,
// _generateIncidentsMd, getProjContext. _mgCanonicalContextName()/_mgCanonicalBacklogName() se
// conservan exportadas — sin confirmación de ausencia de otros consumidores (module-contracts no
// adjunto, TKTs Effort 1 no lo requieren) — quedan sin call site interno, candidatas a limpieza
// en un TKT propio si se confirma que no las usa ningún otro módulo. Fix inline (mismo audit de
// imports, sin relación con este REQ): getAISessions y save (locus-storage.js) no tenían
// consumidor en el archivo — retirados.
// [PP] mod:34 · autor:Rune · 2026-07-30 UTC-6
// TKT1 (REQ-[pendiente-ID], ref_id CAEL-0730-01): _mgLoadFiles() ya no excluye env*.js del
// dropzone — la regex `excluded` y su rejected/toast se retiran; env.js se indexa como
// cualquier otro .js. Cierra el gap registrado en _pp-strategy §7 ("env.js no aparece en el
// índice del MAP actual — no confirmado contra código real, pendiente de verificar por Rune").
// [PP] mod:33 · autor:Rune · 2026-07-25 UTC-6
// TKT-202607-118 (REQ-202607-036 · DISC-202607-039): naming no canónico en exports de CONTEXT y
// BACKLOG — 6 call sites usaban `${prefix}-CONTEXT_v` / `${prefix}-BACKLOG_v` (guion bajo, sin
// prefijo `_` inicial). Agregadas _mgCanonicalContextName()/_mgCanonicalBacklogName() (mismo
// patrón que _mgCanonicalMapName, TKT-202607-094) y reemplazados los 6 call sites: _generateContext()
// (L1234), _mgShowPreview() (L1315-1316), _doConfirmGenerate() (L1464, L1475), _mgExportAllZip()
// (L1556, L1563). Bug adicional corregido en _mgExportAllZip(): BACKLOG se exportaba sin versión
// en el nombre (`${prefix}-BACKLOG.md` — ni siquiera con fallback), pese a que el contenido sí
// usaba _mgGetVersion(). MAP/BACKLOG-FULL/SPRINT-REVIEW fuera de scope — sin cambios.
// [PP] mod:31 · autor:Rune · 2026-07-25 UTC-6
// INC-202607-024 (gap detectado en verificación de Finn sobre el fix mod:30): _generateContext()
// preservaba solo §5/§6 del CONTEXT almacenado — cualquier sección §7+ real (Estado del refactor
// JS, Deuda técnica, Protocolo de parseo, Commands en Locus) se descartaba en silencio al
// regenerar, violando el propio principio citado en mod:30 ("Secciones vacías declaradas — nunca
// se omiten en silencio", _ob-DocStandards). Fix: trailingSectionsBlock captura verbatim todo lo
// que sigue a §6 hasta el final del doc almacenado (Markdown) — reemplaza la emisión fija de
// "## Decisiones e historial" por ese bloque preservado cuando existe; el stub canónico solo se
// genera si no hay Markdown previo del cual derivar (primera generación del proyecto).
// [PP] mod:30 · autor:Rune · 2026-07-25 UTC-6
// INC-202607-025 (_ob-DocStandards §9): _generateSprintReview() generaba un documento standalone
// descargable — pero la Retro no es un doc independiente: la genera Locus automáticamente al
// cerrar sprint, embebida en el Backlog exportado (mismo criterio ya aplicado a _mgBuildPlan()/
// PLAN.md en TKT-202607-052 — feature fuera de la taxonomía vigente). Eliminados: función
// generadora, _mgLoadSprintReview()/_mgRenderDecisions()/_mgRenderLearnings()/_mgSessionInSprint()/
// _mgToggleDecisionTranscends()/_mgToggleLearningTranscends()/_mgSwitchReviewTab(), estado
// decisionTranscends/learningTranscends en _mapGen, reviewChecked en generateDocuments(), entrada
// 'review' en _mgShowPreview() y en fileDefs, listeners de tabs y checkboxes de decisiones/
// aprendizajes. Import getAnyItem retirado — único consumidor era _mgSessionInSprint(), ahora
// eliminada (mismo patrón de import huérfano ya registrado en _pp-context §6). Markup HTML
// correspondiente (checkbox mg-out-review, sección mg-review-section) eliminado en el mismo TKT
// — ver index.html.
// [PP] mod:29 · autor:Rune · 2026-07-24 UTC-6
// Fix inline (triggered_by INC-202607-023, hallazgo de Finn en QA): previewStatusEl.className
// interpolaba inferredStatus directo — con 'sin sprint de referencia' el className se partía
// en 5 tokens inválidos por los espacios (className setter tokeniza por whitespace). Slug
// CSS-safe (espacios → guiones) solo para la clase; textContent conserva el literal completo.
// [PP] mod:28 · autor:Rune · 2026-07-24 UTC-6
// Fix INC-202607-022: sprintIdPattern (_mgChangedIn) ampliado de /[RTB]-\d{6}-\d{3}/g a los
// 6 tipos canónicos — solo matcheaba TKT- por coincidencia de letra inicial, REQ-/INC-/DISC-
// nunca matcheaban. Fix INC-202607-023: _mgInferStatus() ahora declara el literal 'sin sprint
// de referencia' (_ob-DocStandards §8) cuando _mgActiveSprintReal() devuelve null — antes caía
// en 'planning'/'idle' sin distinguir "no hay ningún sprint" de "hay sprint cerrado, sin activo".
// [PP] mod:27 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-100 (REQ-202607-030), corrección Fase 2 tras gap de Finn: htmlIdCount excluye
// atributos terminados en -id= (data-decision-id, data-sprint-id, etc). Lookbehind negativo
// (?<![\w-]) reemplaza el \b anterior — \b matchea frontera letra/no-letra pero no distingue
// guion, por eso 'data-sprint-id=' contaba como 'id=' real. Ver AC4 corregido del TKT.
// [PP] mod:25 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-100 (REQ-202607-030): entrada especial index.html — agrega sprint/autor/HTML IDs
// a la línea de metadatos existente (mismo renglón). autor se extrae del header de identidad
// (misma ventana de 10 líneas que mod, ver _mgParseFile). sprint usa sprint activo o programado
// (active/scheduled) — '—' si ninguno, sin fallback a último cerrado (distinto de
// _mgActiveSprintReal). HTML IDs = conteo de atributos id="..."/id='...' en el archivo. Otro
// .html distinto de index.html conserva el formato genérico sin regresión. Ver AC1-AC3 del TKT.
// [PP] mod:24 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-099 (REQ-202607-030): entrada CSS del MAP agrega línea 'Scope JS:' inmediatamente
// después de Líneas/mod/Size/Changed in — módulos JS de mismo nombre base (stem) que el CSS
// entre los archivos parseados; sin match declara '—'. Ver AC1-AC2 del TKT.
// [PP] mod:23 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-096 (REQ-202607-029): mod ausente en el MAP generado ya no se enmascara como
// mod:1 — declara 'sin-header ⚠️' explícito (OBDS §8). mod real 0 sigue distinguiéndose de
// ausencia (chequeo !== null && !== undefined preexistente, sin cambio de criterio).
// [PP] mod:21 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-095 (REQ-202607-029): línea infra_version del header del MAP ahora lee
// getInfraVersionData() (locus-storage.js) con fallback en cascada a proj.infraVersion y a
// literal de ausencia — ver AC1-AC4 del TKT. Import de getInfraVersionData agregado.
// [PP] mod:20 · autor:Rune · 2026-07-24 UTC-6
// Fix inline (TKT-202607-094): comentario de mod:19 citaba "REQ CAEL-0724-01" — código incorrecto,
// ese ref_id/REQ corresponde a un trabajo distinto (limpieza de import muerto, ver _pp-context §6).
// El trabajo de naming descrito abajo pertenece a REQ-202607-029 / TKT-202607-094 (ref_id de creación:
// CAEL-0724-02). Corregido a los códigos reales — sin cambio de comportamiento.
// [PP] mod:19 · autor:Rune · 2026-07-24 UTC-6
// TKT-202607-094 (REQ-202607-029 · Normalización MAP): naming canónico del archivo/header del MAP unificado
// en _mgCanonicalMapName(prefix, version) → `_${prefix}-map-${version}.md`. Reemplaza el patrón
// `${prefix}-MAP_${version}.md` en 6 call sites: header interno del md, preview inicial del modal,
// preview al soltar .md con versión detectada, entrada 'map' de _mgShowPreview, nombre de descarga
// individual, y nombre dentro del ZIP. No toca CONTEXT/BACKLOG/SPRINT-REVIEW/BACKLOG-FULL — mismo
// patrón de naming incorrecto ahí, fuera de scope de este TKT (ver REQ-202607-029 no_incluye).
// [PP] mod:18 · autor:Rune · 2026-07-20 11:35 UTC-6
// TKT2 (REQ CAEL-0720-01): import _generateIncidentsMd + integración en generateDocuments()/
// _mgShowPreview()/_doConfirmGenerate() — sin versión en el archivo de incidents, ver AC-3.
// TKT-202607-045 (REQ-202607-015): _mgSessionInSprint() usa getAnyItem() en vez de
//   getItems().find() — trackerRefs puede referenciar código ITIL (vive en INCIDENTS).
// TKT-202607-052: eliminado _mgBuildPlan(), planChecked, fileDefs.push de PLAN.md y entrada
// 'plan' del preview array. Reaplicado sobre esta base (mod:14) el fix de TKT-202607-041 —
// import roto de _tryIngestPlan (locus-session-parse.js ya no lo exporta) + bloque de ingesta
// automática con chip sprint-plan:auto-* — porque el mod:15 entregado en esa sesión no estaba
// disponible como archivo real al abrir esta sesión.
// [PP] mod:14 · autor:Rune · 2026-07-05 UTC-6
// TKT1 (limpieza post-rename): comentarios en L3 y L1741 actualizados — locus-backlog-archive.js → locus-backlog-historico.js. Sin cambio de código.
// INC-[pendiente-ID]: regresión detectada post-cierre de REQ-[tmp:req-vocab-historico] — este
// archivo importaba archiveClosedItems() de locus-backlog-historico.js (nombre previo al rename) y quedó fuera del scope
// de TKT2 (archivos declarados no incluían locus-map-generator.js). Import y 2 call sites
// actualizados a migrateClosedItemsToHistorico() / locus-backlog-historico.js — sin cambio
// de comportamiento, mismo contrato.
// [PP] mod:12 · autor:Rune · 2026-07-03 20:10 UTC-6
// INC-[pendiente-ID]: _doConfirmGenerate() ahora async — await migrateClosedItemsToHistorico() en ambos
// call sites (ZIP y fallback). Completa el fix de pérdida de datos de locus-backlog-historico.js:
// la persistencia en storage dedicado debe resolver antes de exponer la descarga al usuario.
/**
 * locus-map-generator.js
 * Versión: v1.3.5 | Última actualización: 2026-07-30 UTC-6 | REQ CAEL-0730-01 (TKT2/3/4): generación de CONTEXT/BACKLOG/Incidentes eliminada — módulo queda exclusivo a MAP
 * Módulo: Document Generator — MAP
 * Proyecto: Locus
 * Renombrado de ai-tracker-map-generator.js
 * R-202604-053 | R-202604-086 | R-202605-101
 */

import { migrateClosedItemsToHistorico } from './locus-backlog-historico.js';
import { itemKind } from './locus-backlog-core.js'; // TKT-D2: itemKind(item) — clasificación Gen2. INC-202607-025: getAnyItem retirado — único consumidor era _mgSessionInSprint(), eliminada junto con el feature Sprint Review
import { editSprintInline } from './locus-backlog-sprints.js';
import { exportHtmlMapMd, importHtmlMap } from './locus-docs.js'; // TKT2 (REQ CAEL-0730-01): _importContextMdFromText retirado — único consumidor era el apply() de CONTEXT en _doConfirmGenerate(). TKT1 (REQ ref_id CAEL-0805-01): _getMapContent retirado — único consumidor era la rama ZIP de _mgExportAllZip()
import { _docPrefix, _effectiveVersion, _tplKey, getActiveProject, getActiveSprints, getInfraVersionData } from './locus-storage.js'; // TKT2/3/4 (REQ CAEL-0730-01): getProjContext retirado — único consumidor era _generateContext(). Fix inline (mismo audit de imports): getAISessions/save ya no tenían consumidor en el archivo — sin relación con este REQ
import { showToast } from './locus-toast.js'; // TKT2 (REQ CAEL-0730-01): showToastInline sin consumidor tras retirar la validación de CONTEXT. Fix inline (mismo audit): toast (bare) tampoco tenía consumidor en el archivo — sin relación con este REQ
import { render } from './locus-sesiones.js';

// ─── Utilidades de módulo ─────────────────────────────────────────────────────
export function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
export function normalize(v) { return String(v || '').replace(/^v/, '').trim(); }

// TKT1 (REQ CAEL-0724-01 · Normalización MAP): naming canónico único del archivo/header del MAP.
// Patrón fuente de verdad: _[PREFIJO]-map-v[X].[Y].[Z].md (__OB-Strategy §5 · _ob-DocStandards §8).
// `version` ya llega con formato vX.Y.Z (ver _mgGetMapVersion/_effectiveVersion) — no se reformatea aquí.
// Único punto de construcción de este nombre en el módulo — todos los call sites del MAP lo consumen.
export function _mgCanonicalMapName(prefix, version) {
  return `_${prefix}-map-${version}.md`;
}

// TKT-202607-118 (REQ-202607-036 · corrección de naming canónico): mismo patrón que
// _mgCanonicalMapName arriba, aplicado a CONTEXT y BACKLOG. __OB-Strategy §5:
// _[PREFIJO]-tipo-v[X].[Y].[Z].md. No toca MAP/SPRINT-REVIEW/BACKLOG-FULL — fuera de scope.
export function _mgCanonicalContextName(prefix, version) {
  return `_${prefix}-context-${version}.md`;
}
export function _mgCanonicalBacklogName(prefix, version) {
  return `_${prefix}-backlog-${version}.md`;
}

// ─── Helper: sprint de referencia — activo o último cerrado ──────────────────
// B-[pendiente-ID]: el generador se usa post-cierre de sprint — si no hay sprint
// activo, tomar el último sprint cerrado (mayor closedAt) para el Sprint Review.
function _mgActiveSprint() {
  const all = getActiveSprints();
  // Sprint activo
  const active = all.find(s => s.status === 'active');
  if (active) return active;
  // Fallback: último sprint cerrado por closedAt desc
  const closed = all
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  return closed[0] || null;
}

// T-202606-148: con la zona sprint-especial eliminada del ecosistema (Q-INC reemplaza esa zona),
// _mgActiveSprintReal queda equivalente a _mgActiveSprint — se conserva como alias
// explícito para no romper los call sites existentes (openMapGenerator, _mgGetMapVersion) que
// ya distinguen semánticamente "sprint con version_target real". INC-202607-025: se retira
// _mgLoadSprintReview de esta lista — eliminada junto con el feature Sprint Review.
function _mgActiveSprintReal() {
  const all = getActiveSprints();
  const active = all.find(s => s.status === 'active');
  if (active) return active;
  // Fallback: último sprint cerrado por closedAt desc
  const closed = all
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  return closed[0] || null;
}

// ─── Estado interno ──────────────────────────────────────────────────────────

const _mapGen = {
  files: [],          // [{ name, size, text }]
  previewMd: '',      // markdown del MAP generado
  generatedDocs: {},  // { map, context, backlog } — strings generados
};

// ─── Apertura / cierre ───────────────────────────────────────────────────────

export function openMapGenerator() {
  _mapGen.files = [];
  _mapGen.previewMd = '';
  _mapGen.generatedDocs = {};

  _mgRenderFileList();
  _mgResetPreview();
  _mgUpdateBtn();

  // Inicializar versión
  const vInput = document.getElementById('mg-version-input');
  const fPreview = document.getElementById('mg-filename-preview');
  const prefix = _docPrefix();
  const ver = _effectiveVersion();
  if (vInput) vInput.value = ver;
  if (fPreview) fPreview.textContent = _mgCanonicalMapName(prefix, ver);

  // R-202605-147: inferir status al abrir — calculado una sola vez
  let _blItemsForStatus = [];
  try {
    const raw = localStorage.getItem(_tplKey('backlog-items'));
      _blItemsForStatus = raw ? JSON.parse(raw) : [];
  } catch(e) {}
  const _activeSp = _mgActiveSprintReal();
  const inferredStatus = _mgInferStatus(_activeSp, _blItemsForStatus);
  const _now2 = new Date();
  const _pad2 = n => String(n).padStart(2, '0');
  const tsLabel = `${_now2.getFullYear()}-${_pad2(_now2.getMonth()+1)}-${_pad2(_now2.getDate())} ${_pad2(_now2.getHours())}:${_pad2(_now2.getMinutes())}`;
  const spLabel = _activeSp ? _activeSp.id : ((() => {
    const allSp = getActiveSprints();
    const last = allSp.filter(s => s.status === 'closed').sort((a,b)=>(b.closedAt||0)-(a.closedAt||0))[0];
    return last ? last.id : '—';
  })());

  const previewStatusEl = document.getElementById('mg-status-preview');
  const generateBtn = document.getElementById('mg-generate-btn');
  if (previewStatusEl) {
    if (inferredStatus === 'closing') {
      previewStatusEl.textContent = 'Sprint en proceso de cierre. Confirma el cierre antes de generar el CONTEXT.';
      previewStatusEl.className = 'mg-status-preview mg-status-closing';
      if (generateBtn) generateBtn.disabled = true;
    } else {
      // Fix inline (triggered_by INC-202607-023): inferredStatus puede contener espacios
      // ('sin sprint de referencia') — className no admite espacios en un solo token sin
      // partirse en clases separadas. Slug CSS-safe solo para la clase; el texto visible
      // conserva el literal completo.
      const statusSlug = inferredStatus.replace(/\s+/g, '-');
      previewStatusEl.textContent = `Estado inferido: ${inferredStatus} · Sprint: ${spLabel} · Calculado: ${tsLabel}`;
      previewStatusEl.className = `mg-status-preview mg-status-${statusSlug}`;
    }
  }

  const el = document.getElementById('mg-overlay');
  if (!el) return;
  el.classList.add('mg-visible');
  document.body.classList.add('mg-body-lock');

  _mgInitDropzone();
}

function closeMapGenerator() {
  const el = document.getElementById('mg-overlay');
  if (el) el.classList.remove('mg-visible');
  document.body.classList.remove('mg-body-lock');
  _mgDropzoneInited = false; // B-202605-274: permitir re-inicialización en próxima apertura
  if (_mgDropzoneAC) { _mgDropzoneAC.abort(); _mgDropzoneAC = null; } // R2 — limpiar listeners
}

// ─── Dropzone ────────────────────────────────────────────────────────────────

let _mgDropzoneInited = false;
let _mgDropzoneAC = null; // AbortController — limpia listeners al cerrar

function _mgInitDropzone() {
  if (_mgDropzoneInited) return;

  const zone = document.getElementById('mg-dropzone');
  const input = document.getElementById('mg-file-input');
  if (!zone || !input) return;
  _mgDropzoneInited = true;

  // R2 — AbortController: garantiza listeners limpios en reaperturas sucesivas
  if (_mgDropzoneAC) _mgDropzoneAC.abort();
  _mgDropzoneAC = new AbortController();
  const sig = { signal: _mgDropzoneAC.signal };

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('mg-drag-over');
  }, sig);
  zone.addEventListener('dragleave', () => zone.classList.remove('mg-drag-over'), sig);
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('mg-drag-over');
    _mgLoadFiles([...e.dataTransfer.files]);
  }, sig);
  zone.addEventListener('click', () => input.click(), sig);

  input.addEventListener('change', () => {
    _mgLoadFiles([...input.files]);
    input.value = '';
  }, sig);
}

function _mgLoadFiles(fileList) {
  const allowed = ['.js', '.css', '.html'];

  // T-202606-031: si se arrastra un .md con patrón vX.Y.Z en el nombre, extraer versión y popular el input
  // El .md no se agrega a _mapGen.files — solo sirve para poblar el campo versión del header interno
  const mdFiles = fileList.filter(f => f.name.toLowerCase().endsWith('.md'));
  mdFiles.forEach(f => {
    const verMatch = f.name.match(/v(\d+\.\d+(?:\.\d+)*)/i);
    if (verMatch) {
      const vInput = document.getElementById('mg-version-input');
      const fPreview = document.getElementById('mg-filename-preview');
      const prefix = _docPrefix();
      if (vInput) vInput.value = `v${verMatch[1]}`;
      if (fPreview) fPreview.textContent = _mgCanonicalMapName(prefix, `v${verMatch[1]}`);
    }
    // .md sin patrón vX.Y.Z: ignorar silenciosamente — comportamiento actual conservado como fallback (AC edge case)
  });

  const valid = fileList.filter(f => allowed.some(ext => f.name.toLowerCase().endsWith(ext)));
  if (!valid.length) return;

  let pending = valid.length;

  valid.forEach(file => {
    const existingIdx = _mapGen.files.findIndex(f => f.name === file.name);
    const reader = new FileReader();
    reader.onload = e => {
      if (existingIdx !== -1) {
        _mapGen.files[existingIdx] = { name: file.name, size: file.size, text: e.target.result };
        showToast('info', `${file.name} reemplazado — versión anterior descartada`);
      } else {
        _mapGen.files.push({ name: file.name, size: file.size, text: e.target.result });
      }
      pending--;
      if (pending === 0) { _mgRenderFileList(); _mgUpdateBtn(); }
    };
    reader.readAsText(file);
  });
}

// ─── Lista de archivos ───────────────────────────────────────────────────────

function _mgRenderFileList() {
  const list = document.getElementById('mg-file-list');
  if (!list) return;

  if (!_mapGen.files.length) {
    list.innerHTML = '<p class="mg-empty-files">Sin archivos adjuntados</p>';
    _mgUpdateStepper(); // TKT1 (REQ ref_id CAEL-0804-01)
    return;
  }

  list.innerHTML = _mapGen.files.map((f, i) => {
    const kb = (f.size / 1024).toFixed(1);
    const ext = f.name.split('.').pop().toUpperCase();
    const typeClass = { JS: 'mg-tag-js', CSS: 'mg-tag-css', HTML: 'mg-tag-html' }[ext] || '';
    return `
      <div class="mg-file-row">
        <span class="mg-file-tag ${typeClass}">${ext}</span>
        <span class="mg-file-name">${f.name}</span>
        <span class="mg-file-size">${kb} KB</span>
        <button class="mg-file-remove" data-remove-idx="${i}" title="Eliminar">✕</button>
      </div>`;
  }).join('');
  _mgUpdateStepper(); // TKT1 (REQ ref_id CAEL-0804-01)
}

function _mgRemoveFile(idx) {
  _mapGen.files.splice(idx, 1);
  _mgRenderFileList();
  _mgUpdateBtn();
  _mgResetPreview();
}

// ─── Botón Generar ───────────────────────────────────────────────────────────

function _mgUpdateBtn() {
  const btn = document.getElementById('mg-generate-btn');
  if (!btn) return;
  // TKT2/3/4 (REQ CAEL-0730-01): único output es MAP — siempre requiere archivos
  const mapChecked = document.getElementById('mg-out-map')?.checked;
  btn.disabled = mapChecked && _mapGen.files.length === 0;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

// AC-17: _mgParseFile realiza Pasada 1 — construye lista de funciones con área heredada de sección.
// Pasada 2 (exports + calls) se ejecuta en _generateMap() sobre el índice global de todas las funciones.
// T-202606-145 F-02: lee campo mod del header de identidad (primera línea no-import del archivo).
function _mgParseFile(name, text) {
  const ext = name.split('.').pop().toLowerCase();
  const lines = text.split('\n');
  const total = lines.length;
  const entries = [];

  // T-202606-145 F-02: extraer mod del header de identidad
  // El header tiene formato: // [XX] vN.N · sprint:XX-S-NN · mod:N · autor:Rol · timestamp
  // Para ESM el header puede estar después de los imports — buscar en las primeras 10 líneas
  let modValue = null;
  let autorValue = null;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const modMatch = lines[i].match(/\bmod:(\d+)\b/);
    if (modMatch && modValue === null) modValue = parseInt(modMatch[1], 10);
    // TKT-202607-100 (REQ-202607-030): autor del header — misma ventana de 10 líneas que mod.
    // Formato: autor:Nombre — corta en el siguiente espacio o '·', consistente con el resto del header.
    const autorMatch = lines[i].match(/\bautor:([^\s·]+)/);
    if (autorMatch && autorValue === null) autorValue = autorMatch[1];
    if (modValue !== null && autorValue !== null) break;
  }

  if (ext === 'js') {
    // T-202606-021: currentSection eliminado como fallback de Área — causa raíz del Gate de
    // Área inválida en OBDS §8. area = guessed || 'Internal' en los tres paths, sin excepción.
    lines.forEach((line, i) => {
      const lineNum = i + 1;

      // Fix: las 3 regex ahora toleran prefijo 'export' opcional. Antes del fix,
      // una función declarada 'export function foo()' / 'export const foo = () =>' no matcheaba
      // ninguna regex y quedaba completamente invisible en el MAP (ni Internal ni Exports) —
      // no solo mal clasificada. isPublic/usedByIndex no cambian: siguen derivándose de uso
      // cross-módulo real, detectado más abajo en el pipeline (Capa 1/Capa 2), sin relación
      // con el keyword 'export' en sí.
      // TKT (ref_id CAEL-0725-02 · DISC-202607-035): las 3 regex usaban `^\s*` antes de
      // '(?:export\s+)?' — permitía CUALQUIER indentación, no solo su ausencia. Un
      // const/function local anidado dentro del cuerpo de otra función (ej. un helper `pad`
      // redeclarado en 4 funciones distintas del mismo archivo — ver _pp-map-v1.8.0.md,
      // locus-backlog-generator.js/locus-backlog-sprints.js) matcheaba igual que una
      // declaración real de nivel de módulo, porque el parser trabaja línea a línea sin noción
      // de profundidad de anidamiento, y quedaba registrado como entrada propia del MAP en vez
      // de permanecer invisible (correcto: solo la función contenedora es entrada). Fix: `^`
      // sin `\s*` — solo columna 0 matchea. Toda declaración real de nivel de módulo en este
      // proyecto está sin indentar; un helper anidado siempre está indentado ≥2 espacios dentro
      // del cuerpo de su función contenedora. Mismo enfoque basado en línea — no requiere AST,
      // solo corrige el criterio de columna.
      const fnMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/);
      if (fnMatch) {
        // AC-01: área = guessArea → si vacío, 'Internal' — nunca currentSection
        const guessed = _mgGuessArea(fnMatch[1], line);
        const area = guessed || 'Internal';
        entries.push({ line: `L${lineNum}`, fn: fnMatch[1], area, bodyStart: lineNum });
        return;
      }
      const arrowMatch = line.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(?[^)]*\)?\s*=>/);
      if (arrowMatch) {
        const guessed = _mgGuessArea(arrowMatch[1], line);
        const area = guessed || 'Internal';
        entries.push({ line: `L${lineNum}`, fn: arrowMatch[1], area, bodyStart: lineNum });
        return;
      }
      const exprMatch = line.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/);
      if (exprMatch) {
        const guessed = _mgGuessArea(exprMatch[1], line);
        const area = guessed || 'Internal';
        entries.push({ line: `L${lineNum}`, fn: exprMatch[1], area, bodyStart: lineNum });
      }
    });
  } else if (ext === 'css') {
    // T-202606-144: extraer secciones CSS via comentarios de sección
    // Detecta: /* ── Nombre ── */ · /* === Nombre === */ · /* --- Nombre --- */
    lines.forEach((line, i) => {
      const secMatch = line.match(/\/\*\s*[─\-═=]{2,}\s*(.+?)\s*[─\-═=]{2,}\s*\*\//);
      if (secMatch) entries.push({ line: `L${i + 1}`, fn: secMatch[1].trim() });
    });
    // Fallback: sin secciones declaradas → fila única
    if (!entries.length) entries.push({ line: 'L1', fn: '(sin secciones declaradas)' });
  } else if (ext === 'html') {
    lines.forEach((line, i) => {
      const secMatch = line.match(/<!--\s*[═=]{2,}\s*(.+?)\s*[═=]{2,}\s*-->/);
      if (secMatch) entries.push({ line: `L${i + 1}`, fn: secMatch[1].trim(), area: 'Sección' });
    });
  }

  return { name, ext, total, entries, lines, mod: modValue, autor: autorValue };
}

function _mgGuessArea(fnName, _line) {
  const n = fnName.toLowerCase();
  if (n.startsWith('render')) return 'Render';
  if (n.startsWith('open') || n.startsWith('close')) return 'UI';
  if (n.startsWith('save') || n.startsWith('load')) return 'Save / Load';
  if (n.startsWith('parse')) return 'Parser';
  if (n.startsWith('export') || n.startsWith('import') || n.startsWith('download')) return 'Export / Import';
  if (n.startsWith('show') || n.startsWith('hide') || n.startsWith('toggle')) return 'UI';
  if (n.startsWith('build') || n.startsWith('create') || n.startsWith('make')) return 'Builder';
  if (n.startsWith('get') || n.startsWith('set')) return 'Utils';
  if (n.startsWith('on') || n.startsWith('handle')) return 'Events';
  if (n.startsWith('_')) return 'Internal';
  return '';
}

// ─── Versioning — bump MINOR ─────────────────────────────────────────────────

function _mgBumpMinor(version) {
  // B-202605-228: guard — nunca recibir undefined o string "undefined"
  if (!version || version === 'undefined') version = _mgGetVersion();
  // Soporta: v3.1.0.0, v3.1.0, 3.1.0
  const clean = version.replace(/^v/, '');
  const parts = clean.split('.');
  if (parts.length < 2) return version;
  // MINOR es el segundo segmento
  parts[1] = String(parseInt(parts[1], 10) + 1);
  // Reset de segmentos posteriores a 0
  for (let i = 2; i < parts.length; i++) parts[i] = '0';
  return (version.startsWith('v') ? 'v' : '') + parts.join('.');
}


export function _mgGetVersion() {
  // B-202605-228: rechazar string literal "undefined" — ocurre si la versión no estaba lista al abrir el overlay
  // T-202605-018: input manual del overlay tiene prioridad — resto delega a _effectiveVersion
  const input = document.getElementById('mg-version-input');
  const raw = input ? input.value.trim() : '';
  if (raw && raw !== 'undefined') return raw;
  // R-202605-002: delegar a _effectiveVersion — fuente de verdad canónica de versión
  return _effectiveVersion();
}

// T-202606-148: versión canónica para el MAP — version_target del sprint activo
// T-202606-148 + B-202606-088: version_target del sprint activo — fallback a sprint cerrado más
// reciente (vía _mgActiveSprint), luego a input + toast. El MAP nunca declara n/a.
// B-202606-088: la condición previa exigía status === 'active', lo que descartaba el
// version_target real cuando _mgActiveSprint() ya había caído a su fallback de sprint cerrado —
// el sprint cerrado nunca podía pasar ese chequeo, y el flujo caía al input/_effectiveVersion()
// produciendo n/a. _mgActiveSprintReal() cae al fallback de sprint cerrado cuando no hay
// sprint regular activo.
function _mgGetMapVersion() {
  const activeSp = _mgActiveSprintReal();
  if (activeSp && activeSp.version_target && activeSp.version_target.trim() && activeSp.version_target.trim() !== 'undefined') {
    return activeSp.version_target.trim();
  }
  // Sin sprint activo ni cerrado con version_target real — fallback a input configurable + toast
  const input = document.getElementById('mg-version-input');
  const raw = input ? input.value.trim() : '';
  const fallback = (raw && raw !== 'undefined') ? raw : _effectiveVersion();
  showToast('warning', 'Sin sprint activo ni cerrado con versión real — versión del MAP tomada del campo de versión. Verifica antes de descargar.');
  return fallback || '—';
}

// ─── Generación principal ────────────────────────────────────────────────────

// TKT2/TKT3/TKT4 (REQ CAEL-0730-01): CONTEXT/BACKLOG/Incidentes retirados — el generador
// produce exclusivamente MAP. Retirada la validación de campos obligatorios de CONTEXT
// (T-202605-504) — sin objeto una vez que CONTEXT no se genera desde este módulo.
function generateDocuments() {
  const mapChecked = document.getElementById('mg-out-map')?.checked;

  if (!mapChecked) {
    showToast('warning', 'Selecciona MAP para generar.');
    return;
  }
  if (!_mapGen.files.length) {
    showToast('warning', 'Adjunta archivos para generar el MAP.');
    return;
  }

  const btn = document.getElementById('mg-generate-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }

  // B-202605-XXX: calcular versión bumpeada una sola vez antes de generar
  // — el generador recibe bumpedVer para que preview y archivo sean consistentes
  const currentVer = _mgGetVersion();
  const input = document.getElementById('mg-version-input');
  const userDeclared = input && input.value.trim() && input.value.trim() !== 'undefined';
  const bumpedVer = userDeclared ? currentVer : _mgBumpMinor(currentVer);

  _mapGen.generatedDocs = {};
  _mapGen.generatedDocs._bumpedVer = bumpedVer; // B-202605-496: fuente de verdad para confirmMapGenerator()

  _mapGen.generatedDocs.map = _generateMap(bumpedVer);

  // Compatibilidad: _mapGen.previewMd = MAP si se generó
  if (_mapGen.generatedDocs.map) _mapGen.previewMd = _mapGen.generatedDocs.map;

  if (btn) { btn.disabled = false; btn.textContent = 'Generar'; }

  _mgShowPreview(_mapGen.generatedDocs);
}

// Alias para compatibilidad con código que llame generateMap() directamente
function generateMap() { generateDocuments(); }

// ─── Generador MAP ───────────────────────────────────────────────────────────

function _generateMap(ver) {
  // R-202605-137: produce JSON puro — parseable con JSON.parse sin regex
  // T-202605-491: incluye campo status en objeto raíz — coherencia con CONTEXT
  // B-202605-494: acepta ver como parámetro; fallback a _mgGetVersion() si no se pasa
  // [pendiente-ID]: AC-17/18/19 — dos pasadas para exports + calls cruzados
  const order = { js: 0, css: 1, html: 2 };
  const sorted = [..._mapGen.files].sort((a, b) => {
    const ea = a.name.split('.').pop().toLowerCase();
    const eb = b.name.split('.').pop().toLowerCase();
    return (order[ea] ?? 9) - (order[eb] ?? 9);
  });

  const version = _mgGetMapVersion(); // T-202606-148: version_target del sprint activo — fallback a input + toast
  const now = _mgNow();
  const project = _docPrefix();

  // Pasada 1 — parsear todos los archivos y construir índice global de funciones
  // AC-17: índice global { fnName → [fileName, ...] } (un nombre puede existir en múltiples archivos)
  const parsed = sorted.map(f => _mgParseFile(f.name, f.text));
  const fnIndex = {}; // { fnName → Set<fileName> }
  parsed.forEach(p => {
    if (p.ext !== 'js') return;
    p.entries.forEach(e => {
      if (!fnIndex[e.fn]) fnIndex[e.fn] = new Set();
      fnIndex[e.fn].add(p.name);
    });
  });

  // T-202605-491: inferir status — reutiliza _mgInferStatus() de R-202605-147
  let _blItemsForMap = [];
  try {
    const raw = localStorage.getItem(_tplKey('backlog-items'));
      _blItemsForMap = raw ? JSON.parse(raw) : [];
  } catch(e) {}
  const _activeSpForMap = _mgActiveSprintReal();
  const mapStatus = _mgInferStatus(_activeSpForMap, _blItemsForMap);

  // Nombres de archivos en el MAP para validar calls (AC-12: solo archivos presentes en el MAP)
  const mapFileNames = new Set(parsed.map(p => p.name));

  // Pasada 2 — detectar referencias cruzadas para poblar exports y calls simultáneamente
  // AC-17: índice global ya construido en Pasada 1
  // AC-18: exports y calls se derivan del mismo recorrido en Pasada 2
  // AC-05: detección en dos capas — cuerpo de función + 3 líneas previas
  // AC-11: exports granular — solo funciones referenciadas en el cuerpo del caller (sin comentarios/strings)
  // AC-19: si el mismo nombre existe en múltiples archivos, calls incluye todos

  // exportsMap: { fileName → Set<fnName> } — funciones de este archivo referenciadas desde otros
  // callsMap:   { fileName → Map<fnName, Set<calledFileName>> } — por función, archivos a los que llama
  const exportsMap = {};
  const callsMap   = {}; // { callerFileName → Map<fnName, Set<targetFileName>> }

  parsed.forEach(p => {
    if (!exportsMap[p.name]) exportsMap[p.name] = new Set();
    if (!callsMap[p.name])   callsMap[p.name]   = new Map();
  });

  // Pre-calcular texto limpio (sin comentarios ni strings) de cada archivo para AC-11
  const cleanTextCache = {};
  parsed.forEach(p => {
    if (p.ext === 'js') {
      cleanTextCache[p.name] = _mgStripCommentsAndStrings(p.lines.join('\n'));
    }
  });

  // Para cada función de cada archivo caller, determinar calls y contribuir a exports
  parsed.forEach(callerFile => {
    if (callerFile.ext !== 'js') return;
    const callerName = callerFile.name;
    const callerLines = callerFile.lines;
    const callerEntries = callerFile.entries;

    callerEntries.forEach((entry, idx) => {
      // AC-05: cuerpo = desde 3 líneas antes de la declaración hasta inicio de siguiente función
      const nextEntry = callerEntries[idx + 1];
      const nextBodyStart = nextEntry ? nextEntry.bodyStart : null;
      const fnBodyRaw = _mgGetFunctionBody(callerLines, entry.bodyStart, nextBodyStart, 3);
      // AC-11: texto limpio para exports (sin comentarios ni strings)
      const fnBodyClean = _mgStripCommentsAndStrings(fnBodyRaw);

      const callsForFn = new Set();

      parsed.forEach(targetFile => {
        if (targetFile.name === callerName) return; // no auto-referencia
        if (targetFile.ext !== 'js') return;
        const targetName = targetFile.name;
        if (!mapFileNames.has(targetName)) return; // AC-12

        let referencesTarget = false;

        // Capa 1: referencia explícita al nombre de archivo en el cuerpo (raw, incluyendo comentarios/imports)
        // AC-05 Capa 1: nombre de archivo en el cuerpo completo de la función + 3 líneas previas
        const baseName = targetName.replace(/\.js$/i, '');
        const explicitRef = new RegExp(
          '(?:import|require|from|//|/\\*).*?' + _mgEscapeRegExp(baseName),
          'i'
        );
        if (explicitRef.test(fnBodyRaw)) {
          referencesTarget = true;
        }

        // Capa 2: fallback — nombres de funciones del target en el cuerpo limpio del caller
        // AC-05 Capa 2: nombres de funciones conocidas del MAP como fallback
        if (!referencesTarget) {
          for (const tEntry of targetFile.entries) {
            if (tEntry.fn && tEntry.fn.length > 2) {
              const fnCallRegex = new RegExp('\\b' + _mgEscapeRegExp(tEntry.fn) + '\\s*\\(', '');
              if (fnCallRegex.test(fnBodyClean)) {
                referencesTarget = true;
                break;
              }
            }
          }
        }

        if (referencesTarget) {
          callsForFn.add(targetName);

          // AC-11: exports granular — solo las funciones de targetFile referenciadas
          // en el cuerpo limpio de esta función caller (no todas las funciones del target)
          targetFile.entries.forEach(tEntry => {
            if (!tEntry.fn || tEntry.fn.length <= 2) return;
            const fnCallRegex = new RegExp('\\b' + _mgEscapeRegExp(tEntry.fn) + '\\s*\\(', '');
            if (fnCallRegex.test(fnBodyClean)) {
              exportsMap[targetName].add(tEntry.fn);
            }
          });

          // AC-19: si el mismo nombre de función existe en múltiples archivos,
          // calls incluye todos los archivos donde ese nombre existe.
          // Capa 2 pudo matchear por nombre de función que existe en varios archivos —
          // garantizar que callsForFn incluye todos los archivos con ese nombre.
          for (const tEntry of targetFile.entries) {
            if (tEntry.fn && tEntry.fn.length > 2) {
              const fnCallRegex = new RegExp('\\b' + _mgEscapeRegExp(tEntry.fn) + '\\s*\\(', '');
              if (fnCallRegex.test(fnBodyClean) && fnIndex[tEntry.fn]) {
                fnIndex[tEntry.fn].forEach(ambigFile => {
                  if (ambigFile !== callerName && mapFileNames.has(ambigFile)) {
                    callsForFn.add(ambigFile);
                  }
                });
              }
            }
          }
        }
      });

      // AC-09: siempre emitir calls por función (vacío [] si ninguno)
      callsMap[callerName].set(entry.fn, callsForFn);
    });
  });

  // AC-07: changed_in — ID del sprint más reciente en comentarios, null si ninguno
  // AC-10: si no hay IDs → changed_in: null, campo siempre presente
  // INC-202607-022: patrón anterior /[RTB]-\d{6}-\d{3}/g era Gen1 — solo matcheaba 'T-' dentro
  // de 'TKT-' por coincidencia de letra inicial+guion; REQ-/INC-/DISC- (y PRB-/CHG-) nunca
  // matcheaban. Reemplazado por los 6 tipos canónicos de __BR-Ecosystem §4.
  const sprintIdPattern = /(?:REQ|TKT|DISC|INC|PRB|CHG)-\d{6}-\d{3}/g;

  // AC-06: Construir changed_in por archivo
  function _mgChangedIn(fileLines) {
    const text = fileLines.join('\n');
    const matches = text.match(sprintIdPattern);
    if (!matches || !matches.length) return null;
    // Ordenar descendente (YYYYMM-NNN lexicográfico) y tomar el más reciente
    const sorted = [...new Set(matches)].sort((a, b) => b.localeCompare(a));
    return sorted[0];
  }

  // AC-07: size_signal — low < 500, medium 500–2000, high > 2000
  function _mgSizeSignal(lines) {
    if (lines < 500) return 'low';
    if (lines <= 2000) return 'medium';
    return 'high';
  }

  // TKT-202607-100 (REQ-202607-030): sprint activo o programado (abierto/scheduled) — '—' si
  // no hay ninguno de los dos, aunque exista historial de sprints cerrados. Distinto de
  // _mgActiveSprintReal(), que hace fallback al último sprint cerrado — ese fallback no aplica
  // al AC de este TKT ("sin sprint abierto ni programado").
  function _mgHtmlMetaSprintId() {
    const all = getActiveSprints();
    const sp = all.find(s => s.status === 'active' || s.status === 'scheduled');
    return sp ? sp.id : null;
  }

  // Construir array files con todos los campos nuevos
  const files = parsed.map(p => {
    // AC-11: exports sin duplicados — solo funciones realmente referenciadas desde otros archivos
    const exportsArr = p.ext === 'js'
      ? [...(exportsMap[p.name] || new Set())]
      : [];

    // AC-04 + AC-09 + AC-12: calls a nivel archivo — unión de todos los archivos llamados por cualquier función
    // (para mantener el campo calls de nivel archivo como antes, compatibilidad de schema)
    const fileLevelCalls = new Set();
    if (p.ext === 'js' && callsMap[p.name]) {
      callsMap[p.name].forEach(fileSet => fileSet.forEach(f => fileLevelCalls.add(f)));
    }
    const callsArr = [...fileLevelCalls];

    // AC-06 + AC-10
    const changedIn = _mgChangedIn(p.lines);

    // AC-07
    const sizeSignal = _mgSizeSignal(p.total);

    return {
      name: p.name,
      type: p.ext,
      lines: p.total,
      mod: p.mod !== null ? p.mod : null,   // T-202606-145 F-02: del header de identidad; null si ausente
      autor: p.autor !== null ? p.autor : null, // TKT-202607-100 (REQ-202607-030): del header de identidad; null si ausente
      // TKT-202607-100 (REQ-202607-030), corrección Fase 2 (gap de Finn): el atributo global id=
      // debe distinguirse de cualquier atributo compuesto terminado en -id= (data-decision-id,
      // data-sprint-id, data-learning-id — ya presentes en index.html real del proyecto). Lookbehind
      // negativo excluye letra/dígito/guion inmediatamente antes de 'id' — solo cuenta 'id' como
      // nombre completo de atributo, precedido por espacio o inicio de etiqueta.
      htmlIdCount: p.ext === 'html' ? (p.lines.join('\n').match(/(?<![\w-])id\s*=\s*["'][^"']*["']/g) || []).length : null,
      exports: exportsArr,          // AC-03
      calls: callsArr,              // AC-04 nivel archivo
      changed_in: changedIn,        // AC-06
      size_signal: sizeSignal,      // AC-07
      functions: p.entries.map(e => {
        // AC-04/AC-05: calls a nivel función — archivos a los que esta función llama
        let fnCalls = [];
        if (p.ext === 'js' && callsMap[p.name] && callsMap[p.name].has(e.fn)) {
          fnCalls = [...callsMap[p.name].get(e.fn)];
        }
        // R3-T2: isPublic — true si la función es referenciada desde otros módulos (exportsMap)
        const isPublic = p.ext === 'js'
          ? (exportsMap[p.name] || new Set()).has(e.fn)
          : false;
        return {
          line: e.line,
          name: e.fn,
          area: e.area,               // AC-01: nunca vacío — 'Internal' como default
          calls: fnCalls,             // AC-04/AC-05: archivos llamados por esta función
          isPublic                    // R3: true = API pública, false = internal
        };
      })
    };
  });

  // R-202605-137 (rev): output Markdown — una sección ## por archivo, tabla de funciones por sección
  // AC-1: un archivo .md — bloque ```json eliminado
  // AC-2: sección ## nombre-archivo.ext por cada archivo
  // AC-3: cada sección incluye líneas totales · size_signal · changed_in
  // AC-4: tabla | Función | Área | Calls | por archivo JS
  // AC-5: exports como línea **Exports:** fn1, fn2 si existen
  // AC-6: CSS con solo metadata, HTML con tabla de secciones sin columna Calls
  // AC-7: campos version/updated/project/status en cabecera del archivo
  // R3: JS separado en subsecciones ### Exports y ### Internal
  // R2: funciones públicas incluyen columna Used by

  // R2-T1: construir índice inverso { fnName → Set<callerFileName> }
  // Para cada función pública de cada módulo, determinar qué módulos la invocan
  const usedByIndex = {}; // { fnName → Set<callerFileName> }
  files.forEach(callerFile => {
    if (callerFile.type !== 'js') return;
    callerFile.functions.forEach(fn => {
      if (!fn.calls || !fn.calls.length) return;
      fn.calls.forEach(targetFileName => {
        const targetFile = files.find(f => f.name === targetFileName);
        if (!targetFile) return;
        targetFile.functions.forEach(tFn => {
          if (!tFn.isPublic) return;
          if (!usedByIndex[tFn.name]) usedByIndex[tFn.name] = new Set();
          usedByIndex[tFn.name].add(callerFile.name);
        });
      });
    });
  });

  let md = `# ${_mgCanonicalMapName(project, version)}\n`;
  md += `<!-- Versión: ${version} | Actualizado: ${now} UTC-6 | Proyecto: ${project} | Status: ${mapStatus} -->\n`;
  // TKT-202607-095 (REQ-202607-029): segunda línea de header — infra_version leído desde
  // getInfraVersionData() (locus-storage.js) en vez de proj.infraVersion — proj.infraVersion es
  // solo el número agregado, sin las 4 sub-versiones que el formato canónico exige (OB-Strategy §5b).
  // Formato canónico: <!-- **infra_version: [N]** | BR-Core v[X] · BR-Ecosystem v[X] · BR-Execution v[X] · OB-Strategy v[X] -->
  // Fallback en cascada, la línea es siempre la 3ª del header, sin excepción:
  //   1. infraVersionData completo → línea con sufijo de las 4 sub-versiones; sub-versión individual
  //      ausente → 'v—' en su posición, sin omitir el segmento ni truncar la línea.
  //   2. sin infraVersionData pero proj.infraVersion con número real → línea parcial ya vigente
  //      (solo número, sin sufijo) — comportamiento previo, conservado como fallback.
  //   3. sin ningún dato → literal de ausencia (comportamiento previo, sin regresión).
  const _ivData = getInfraVersionData();
  if (_ivData && _ivData.infraVersion) {
    const _svFmt = k => (_ivData[k] ? `v${_ivData[k]}` : 'v—');
    md += `<!-- **infra_version: ${_ivData.infraVersion}** | BR-Core ${_svFmt('brCore')} · BR-Ecosystem ${_svFmt('brEcosystem')} · BR-Execution ${_svFmt('brExecution')} · OB-Strategy ${_svFmt('obStrategy')} -->\n`;
  } else {
    const _ivProj = getActiveProject();
    const _ivRaw = (_ivProj && _ivProj.infraVersion) ? String(_ivProj.infraVersion).trim() : '';
    if (_ivRaw) {
      md += `<!-- **infra_version: ${_ivRaw}** -->\n`;
    } else {
      md += `<!-- infra_version: no declarada en proyecto -->\n`;
    }
  }
  md += '\n';

  // TKT-202607-098 (REQ-202607-029): índice de módulos separado por categoría, antes de las
  // secciones ## por archivo. AC1: ### JS Modules (N) / ### CSS Files (M), lista plana
  // alfabética por categoría. AC2: categoría con 0 archivos se omite por completo — sin
  // encabezado vacío. AC3: módulo JS con literal 'deprecated' (case-insensitive) en su
  // comentario de header (misma ventana de 10 líneas que ya usa la extracción de mod, arriba)
  // lleva sufijo ' ⚠️ deprecated'. AC4: index.html (type 'html') nunca entra a ninguna de las
  // dos listas — por construcción, solo se listan archivos type 'js'/'css'.
  const _mgDeprecatedRe = /deprecated/i;
  const _mgDeprecatedSet = new Set();
  parsed.forEach(p => {
    if (p.ext !== 'js') return;
    const headerWindow = p.lines.slice(0, 10).join('\n');
    if (_mgDeprecatedRe.test(headerWindow)) _mgDeprecatedSet.add(p.name);
  });

  const jsModuleNames = files.filter(f => f.type === 'js').map(f => f.name).sort((a, b) => a.localeCompare(b));
  const cssFileNames  = files.filter(f => f.type === 'css').map(f => f.name).sort((a, b) => a.localeCompare(b));

  if (jsModuleNames.length) {
    md += `### JS Modules (${jsModuleNames.length})\n\n`;
    jsModuleNames.forEach(name => {
      md += `- ${name}${_mgDeprecatedSet.has(name) ? ' ⚠️ deprecated' : ''}\n`;
    });
    md += '\n';
  }
  if (cssFileNames.length) {
    md += `### CSS Files (${cssFileNames.length})\n\n`;
    cssFileNames.forEach(name => { md += `- ${name}\n`; });
    md += '\n';
  }

  files.forEach(f => {
    const changedStr = f.changed_in ? f.changed_in : '—';
    // TKT-202607-096 (REQ-202607-029): mod ausente (null/undefined) ya no se enmascara como '1' —
    // declara 'sin-header ⚠️' explícito (OBDS §8). mod real 0 se distingue de ausencia — mismo
    // chequeo !== null && !== undefined ya vigente, solo cambia el valor del else branch.
    const modStr = f.mod !== null && f.mod !== undefined ? String(f.mod) : 'sin-header ⚠️';
    md += `## ${f.name}\n`;
    let metaLine = `**Líneas:** ${f.lines} · **mod:** ${modStr} · **Size:** ${f.size_signal} · **Changed in:** ${changedStr}`;
    // TKT-202607-100 (REQ-202607-030): index.html — sprint/autor/HTML IDs agregados a la MISMA
    // línea de metadatos (no línea nueva) · AC2: otro .html distinto de index.html mantiene el
    // formato genérico ya vigente, sin estos campos.
    if (f.type === 'html' && f.name === 'index.html') {
      const sprintId = _mgHtmlMetaSprintId();
      const autorStr = f.autor !== null && f.autor !== undefined ? f.autor : '—';
      const idsStr = f.htmlIdCount !== null && f.htmlIdCount !== undefined ? String(f.htmlIdCount) : '0';
      metaLine += ` · **sprint:** ${sprintId || '—'} · **autor:** ${autorStr} · **HTML IDs:** ${idsStr}`;
    }
    md += metaLine + '\n';

    if (f.type === 'css') {
      // TKT-202607-099 (REQ-202607-030): Scope JS — módulos JS de mismo sufijo (nombre base,
      // sin extensión) que el archivo CSS, entre los archivos parseados en esta sesión. Sin
      // match → '—'. Campo descriptivo, no prescriptivo (ver _Locus-module-contracts §4 —
      // anti-pattern "Lógica de negocio en módulos CSS").
      const cssStem = f.name.replace(/\.css$/i, '');
      const scopeJsNames = files
        .filter(x => x.type === 'js' && x.name.replace(/\.js$/i, '') === cssStem)
        .map(x => x.name)
        .sort((a, b) => a.localeCompare(b));
      md += `**Scope JS:** ${scopeJsNames.length ? scopeJsNames.join(', ') : '—'}\n`;
    }
    md += '\n';

    if (f.type === 'js') {
      // R3-T3: separar en públicas e internas
      const publicFns   = f.functions.filter(fn => fn.isPublic);
      const internalFns = f.functions.filter(fn => !fn.isPublic);

      // ### Exports — solo si hay funciones públicas
      if (publicFns.length) {
        md += `### Exports\n\n`;
        md += `| Función | Área | Calls | Used by |\n`;
        md += `|---------|------|-------|---------|\n`;
        publicFns.forEach(fn => {
          const callsStr  = fn.calls && fn.calls.length ? fn.calls.join(', ') : '—';
          const usedBySet = usedByIndex[fn.name];
          const usedByStr = usedBySet && usedBySet.size ? [...usedBySet].sort().join(', ') : '—';
          md += `| ${fn.line} · ${fn.name} | ${fn.area} | ${callsStr} | ${usedByStr} |\n`;
        });
        md += '\n';
      }

      // ### Internal
      if (internalFns.length) {
        md += `### Internal\n\n`;
        md += `| Función | Área | Calls |\n`;
        md += `|---------|------|-------|\n`;
        internalFns.forEach(fn => {
          const callsStr = fn.calls && fn.calls.length ? fn.calls.join(', ') : '—';
          md += `| ${fn.line} · ${fn.name} | ${fn.area} | ${callsStr} |\n`;
        });
        md += '\n';
      }

    } else if (f.type === 'html') {
      // HTML — tabla de secciones sin columna Calls
      if (f.functions && f.functions.length) {
        md += `| Línea | Sección / Selector |\n`;
        md += `|-------|--------------------|\n`;
        f.functions.forEach(fn => {
          md += `| ${fn.line} | ${fn.name} |\n`;
        });
        md += '\n';
      }
    } else if (f.type === 'css') {
      // T-202606-144: tabla Línea|Sección para entradas CSS
      md += `| Línea | Sección |\n`;
      md += `|-------|----------|\n`;
      f.functions.forEach(fn => {
        md += `| ${fn.line} | ${fn.name} |\n`;
      });
      md += '\n';
    }
    // CSS: tabla Línea|Sección — HTML: tabla Línea|Sección/Selector (R1)
  });

  return md.trimEnd() + '\n';
}

// Helper: escapar caracteres especiales de RegExp
function _mgEscapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// AC-11: eliminar comentarios de línea (//), bloque (/* */), y strings literales (' " `) del texto
// para que exports no cuente menciones en comentarios ni dentro de strings.
function _mgStripCommentsAndStrings(text) {
  // Orden: strings primero (para no confundir // dentro de un string), luego comentarios
  let out = '';
  let i = 0;
  const len = text.length;
  while (i < len) {
    // String comilla doble
    if (text[i] === '"') {
      i++;
      while (i < len && text[i] !== '"') {
        if (text[i] === '\\') i++; // escape
        i++;
      }
      i++; // cierre
      continue;
    }
    // String comilla simple
    if (text[i] === "'") {
      i++;
      while (i < len && text[i] !== "'") {
        if (text[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // Template literal
    if (text[i] === '`') {
      i++;
      while (i < len && text[i] !== '`') {
        if (text[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // Comentario de bloque /* */
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < len && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    // Comentario de línea //
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < len && text[i] !== '\n') i++;
      continue;
    }
    out += text[i];
    i++;
  }
  return out;
}

// AC-04/AC-05: extraer texto de cuerpo de función + N líneas previas a la declaración.
// bodyStartLine: número de línea 1-based de la declaración.
// allLines: array de strings (las líneas del archivo).
// nextBodyStart: número de línea 1-based de la siguiente función (o fin de archivo).
// prevLines: cuántas líneas previas incluir (AC-05 especifica 3).
function _mgGetFunctionBody(allLines, bodyStartLine, nextBodyStart, prevLines) {
  const start = Math.max(0, bodyStartLine - 1 - prevLines); // índice 0-based, incluyendo N previas
  const end   = nextBodyStart ? nextBodyStart - 1 : allLines.length; // índice 0-based exclusivo
  return allLines.slice(start, end).join('\n');
}
// ─── Generador CONTEXT ───────────────────────────────────────────────────────

// R-202605-147: inferir status operativo del proyecto
// Tabla: SCM modal activo → closing · sprint abierto (con o sin ítems) → active
//        sin sprint + ítems sin asignar → planning · sin sprint + backlog vacío → idle
// TKT-D2: 'icebox' eliminado — no tiene equivalente en BR-Core §6 Gen2; 'idle' no colisiona con Q-Backlog/Q-DISC
function _mgInferStatus(activeSp, blItems) {
  // closing: SCM modal visible
  const scmModal = document.getElementById('close-sprint-modal');
  // B-202605-035: criterio canónico de visibilidad — clase modal--open. Eliminados: style.display y aria-hidden.
  if (scmModal && scmModal.classList.contains('modal--open')) {
    return 'closing';
  }
  // INC-202607-023: sin activeSp (ni sprint activo ni cerrado existe) — _mgActiveSprintReal()
  // solo devuelve null en ese caso exacto (hace fallback al último cerrado si existe alguno).
  // _ob-DocStandards §8 exige el literal 'sin sprint de referencia' en el campo Status del
  // header — antes caía en 'planning'/'idle' según el backlog, nunca en este literal.
  if (!activeSp) return 'sin sprint de referencia';
  if (activeSp.status === 'active') return 'active';
  // Sin sprint activo (pero hay al menos un sprint cerrado como referencia) — decidir por backlog
  const unassigned = (blItems || []).filter(i =>
    i.status === 'pendiente' && (!i.sprint || i.sprint === '' || i.sprint === 'n/a' || i.sprint === 'futura')
  );
  if (unassigned.length > 0) return 'planning';
  return 'idle'; // TKT-D2: era 'icebox' — sin sprint activo y backlog sin ítems pendientes sin asignar
}

// TKT2/TKT3/TKT4 (REQ CAEL-0730-01): _generateContext()/_generateBacklog() eliminadas —
// sin consumidor tras el retiro de sus call sites en generateDocuments()/_mgShowPreview()/
// _doConfirmGenerate()/_mgExportAllZip(). CONTEXT sigue el flujo manual de __BR-Core §8;
// BACKLOG usa buildBacklogMd() (locus-session-save.js) vía exportBacklogMd() del backlog
// list, sin relación con este módulo.

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _mgNow() {
  return new Date().toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Preview ─────────────────────────────────────────────────────────────────

// TKT1 (REQ ref_id CAEL-0804-01): estado del stepper — función pura sobre el estado vigente.
// AC1: sin archivos → paso 1 activo. AC2: con archivos y sin preview generado (confirm-btn
// deshabilitado) → paso 2 activo, paso 1 done. AC3: con preview generado (confirm-btn
// habilitado) → paso 3 activo, paso 2 done. AC4: se recalcula desde cero en cada llamada —
// la remoción de un archivo (que ya invoca _mgResetPreview) retrocede el paso automáticamente
// sin necesitar lógica de reversión dedicada. AC de error: sin #mg-stepper/#mg-step-badge en
// el DOM → return silencioso, no bloquea el resto del flujo.
function _mgUpdateStepper() {
  const steps = document.querySelectorAll('.mg-stepper-step');
  const badge = document.getElementById('mg-step-badge');
  if (!steps.length || !badge) return;

  const hasFiles = _mapGen.files.length > 0;
  const confirmBtn = document.getElementById('mg-confirm-btn');
  const hasPreview = !!(confirmBtn && !confirmBtn.disabled);
  const current = hasPreview ? 3 : (hasFiles ? 2 : 1);

  steps.forEach((stepEl, idx) => {
    const stepNum = idx + 1;
    stepEl.classList.remove('mg-stepper-step--active', 'mg-stepper-step--done');
    if (stepNum < current) stepEl.classList.add('mg-stepper-step--done');
    if (stepNum === current) stepEl.classList.add('mg-stepper-step--active');
    if (stepNum === current) stepEl.setAttribute('aria-current', 'step');
    else stepEl.removeAttribute('aria-current');
  });

  badge.textContent = String(current);
  badge.setAttribute('aria-label', `Paso ${current} de 3`);
}

function _mgResetPreview() {
  const area = document.getElementById('mg-preview-area');
  if (area) area.innerHTML = '<p class="mg-preview-placeholder">Los documentos generados aparecerán aquí.</p>';
  const confirmBtn = document.getElementById('mg-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;
  _mgUpdateStepper(); // TKT1 (REQ ref_id CAEL-0804-01)
}

// TKT-202608-367 (REQ-202608-147): extrae la versión declarada en la 2ª línea del header
// interno del MAP recién generado — formato `<!-- Versión: vX.Y.Z | Actualizado: ... -->`
// (ver _generateMap(), línea ~871). Devuelve null si el contenido no está disponible o el
// header no matchea el formato esperado — nunca fuerza un valor por defecto que produciría
// un falso positivo/negativo en la comparación.
function _mgParseHeaderVersion(mapContent) {
  if (!mapContent) return null;
  const m = mapContent.match(/^<!-- Versión:\s*(\S+)\s*\|/m);
  return m ? m[1] : null;
}

function _mgShowPreview(docs) {
  const area = document.getElementById('mg-preview-area');
  if (!area) return;

  const version = _mgGetVersion();
  const prefix = _docPrefix();

  // TKT2/TKT3/TKT4 (REQ CAEL-0730-01): entradas context/backlog/incidents retiradas — el
  // generador solo produce MAP.
  const items = [
    { key: 'map', label: 'MAP', filename: _mgCanonicalMapName(prefix, version) },
  ].filter(i => docs[i.key]);

  let html = `<div class="mg-preview-header"><span class="mg-preview-badge">✓ ${items.length} documento${items.length !== 1 ? 's' : ''} generado${items.length !== 1 ? 's' : ''}</span><span class="mg-preview-version">Versión: ${version}</span></div>`;
  html += `<div class="mg-preview-doc-list">`;
  items.forEach(i => {
    const lines = docs[i.key].split('\n').length;
    html += `<div class="mg-preview-doc-item"><span class="mg-preview-doc-icon">📄</span><span class="mg-preview-doc-name">${i.filename}</span><span class="mg-preview-doc-meta">${lines.toLocaleString()} líneas</span></div>`;
  });
  html += `</div>`;

  // R-202605-137 (rev): Si hay MAP en Markdown, mostrar tabla de archivos parseando secciones ##
  if (docs.map) {
    try {
      const mapLines = docs.map.split('\n');
      const mapFiles = [];
      let currentFile = null;
      let fnCount = 0;
      mapLines.forEach(line => {
        const h2 = line.match(/^## (\S+\.(js|css|html))\s*$/i);
        if (h2) {
          if (currentFile) { currentFile.entries = fnCount; mapFiles.push(currentFile); }
          currentFile = { name: h2[1], type: h2[2].toLowerCase(), lines: 0, size: '' };
          fnCount = 0;
          return;
        }
        if (currentFile) {
          const meta = line.match(/\*\*Líneas:\*\*\s*(\d+)\s*·\s*\*\*Size:\*\*\s*(\S+)/);
          if (meta) { currentFile.lines = parseInt(meta[1], 10); currentFile.size = meta[2]; }
          // contar filas de tabla (excluir cabecera y separador)
          if (line.startsWith('|') && !line.match(/^\|\s*[-:]+/) && !line.match(/^\|\s*(Función|Línea|Área|Sección)/i)) {
            fnCount++;
          }
        }
      });
      if (currentFile) { currentFile.entries = fnCount; mapFiles.push(currentFile); }

      if (mapFiles.length) {
        html += `<table class="mg-preview-table"><thead><tr><th>Archivo</th><th>Tipo</th><th>Líneas</th><th>Size</th><th>Entradas</th></tr></thead><tbody>`;
        mapFiles.forEach(f => {
          html += `<tr><td>${f.name}</td><td>${f.type.toUpperCase()}</td><td>${(f.lines||0).toLocaleString()}</td><td>${f.size}</td><td>${f.entries}</td></tr>`;
        });
        html += `</tbody></table>`;
      }
    } catch(e) {
      html += `<div class="mg-preview-error">⚠ Error al parsear MAP Markdown: ${e.message}</div>`;
    }
  }

  // TKT-202608-367 (REQ-202608-147): banner no bloqueante si el nombre de archivo propuesto
  // (`version`, de _mgGetVersion()) no coincide con la versión escrita en el header interno
  // del MAP recién generado (docs.map, calculada internamente vía _mgGetMapVersion() en
  // _generateMap()). Se agrega debajo del preview existente — no lo reemplaza, no deshabilita
  // #mg-confirm-btn. Edge case: docs.map ausente o header sin match → no se evalúa.
  if (docs.map) {
    const headerVer = _mgParseHeaderVersion(docs.map);
    if (headerVer && headerVer !== version) {
      html += `
        <div class="mg-open-sprint-warning">
          <p class="mg-warn-title">⚠ Nombre de archivo y header no coinciden</p>
          <p class="mg-warn-body">El nombre propuesto es <span class="mg-warn-sprint-id">${_mgCanonicalMapName(prefix, version)}</span>, pero el header interno del MAP declara <span class="mg-warn-sprint-id">${headerVer}</span>. Puedes generar de todos modos — verifica la versión antes de subir el archivo al proyecto.</p>
        </div>`;
    }
  }

  area.innerHTML = html;
  const confirmBtn = document.getElementById('mg-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
  _mgUpdateStepper(); // TKT1 (REQ ref_id CAEL-0804-01)
}

function confirmMapGenerator() {
  const docs = _mapGen.generatedDocs;
  if (!Object.keys(docs).length) return;

  // R-202605-117: guard — no bumpear versión si no hay sprint cerrado previo
  const allSprints = getActiveSprints();
  const hasClosedSprint = allSprints.some(s => s.status === 'closed');
if (!hasClosedSprint) {
  // B-[pendiente-ID]: warning no bloqueante — MAP y demás documentos se descargan
  // sin sprint cerrado. Solo el bump de versión requiere sprint cerrado.
  // Si no hay sprint cerrado → usar versión actual sin bumpear.
  showToast('warning', 'Sin sprint cerrado — archivos descargados con versión actual sin bumpear');
  docs._bumpedVer = _mgGetVersion(); // sobreescribir: no bumpear sin sprint cerrado
  // No hacer return — continuar con _doConfirmGenerate()
}

  // B-202605-071: warning no bloqueante si hay sprints sin cerrar
  // El MAP puede generarse con sprint abierto (snapshot del estado actual), pero el usuario
  // debe confirmar explícitamente que entiende que el sprint no está cerrado.
  const openSprints = allSprints.filter(s => s.status === 'active');
  if (openSprints.length > 0) {
    const area = document.getElementById('mg-preview-area');
    if (area) {
      const sprintList = openSprints.map(s => `<span class="mg-warn-sprint-id">${s.id}</span>`).join(', ');
      const sprintLabel = openSprints.length === 1
        ? `El sprint ${sprintList} no está cerrado.`
        : `Los sprints ${sprintList} no están cerrados.`;
      area.innerHTML = `
        <div class="mg-open-sprint-warning">
          <p class="mg-warn-title">⚠ Sprint sin cerrar</p>
          <p class="mg-warn-body">${sprintLabel} El MAP reflejará el estado actual, no el estado final del sprint.</p>
          <div class="mg-warn-actions">
            <button class="mg-warn-btn mg-warn-btn--confirm" data-mg-action="confirm-generate">Generar de todos modos</button>
            <button class="mg-warn-btn mg-warn-btn--cancel" data-mg-action="reset-preview">Cancelar</button>
          </div>
        </div>`;
      return;
    }
    // Sin área de preview disponible — continuar igualmente (fallback silencioso mejor que bloqueo)
  }

  _doConfirmGenerate();
}

// INC-[pendiente-ID]: async — permite await migrateClosedItemsToHistorico() en ambos call sites internos
// (ZIP y fallback de descarga individual). Antes disparaba la promesa sin esperarla ("ahora
// awaited" declarado en el header de locus-backlog-historico.js pero nunca aplicado aquí —
// corregido en esta entrega). Dos callers, ambos fire-and-forget sobre el resultado
// (confirmMapGenerator línea ~1735, botón data-mg-action="confirm-generate" línea ~1990) —
// ninguno depende del valor de retorno, una función async en ambos casos es válida.
async function _doConfirmGenerate() {
  const docs = _mapGen.generatedDocs;
  if (!Object.keys(docs).length) return;

  const prefix    = _docPrefix();
  // B-202605-496: usar bumpedVer de generateDocuments() — evita recálculo independiente
  // Si no está disponible (flujo inesperado) — fallback al comportamiento anterior
  const bumpedVer = (docs._bumpedVer && docs._bumpedVer !== 'undefined')
    ? docs._bumpedVer
    : _mgBumpMinor(_mgGetVersion());

  // TKT2/TKT3/TKT4 (REQ CAEL-0730-01): validación de versión de CONTEXT (T-202605-504 AC4) y
  // fileDefs de context/backlog/incidents retirados — el generador solo produce MAP.

  // Construir tabla de archivos: { filename, content, applyFn? }
  const fileDefs = [];
  if (docs.map) {
    const mapVer = _mgGetMapVersion(); // T-202606-148: nombre del archivo MAP coincide con header interno
    const name = _mgCanonicalMapName(prefix, mapVer);
    fileDefs.push({
      filename: name,
      content:  docs.map,
      apply: () => {
        const f = new File([docs.map], name, { type: 'text/markdown' });
          importHtmlMap({ target: { files: [f], value: '' } });
      },
    });
  }
  // B-202605-275: efectos DOM (importHtmlMap) se aplican DESPUÉS de confirmar generación exitosa
  // B-202605-493: _mgApplyBumpedVersion y migrateClosedItemsToHistorico también se difieren — sin mutación de estado si la descarga falla
  // TKT1 (REQ ref_id CAEL-0805-01): rama JSZip retirada — fileDefs solo contiene MAP desde
  // TKT2/TKT3/TKT4 de REQ CAEL-0730-01, comprimir un único archivo no aporta valor y JSZip
  // fallaba de forma consistente en el entorno del founder. Descarga directa incondicional,
  // mismo orden de efectos que la rama fallback previa (descarga → apply → versión → persistencia).
  fileDefs.forEach(d => _mgDownload(d.content, d.filename));
  fileDefs.forEach(d => { if (d.apply) d.apply(); });
  _mgApplyBumpedVersion(bumpedVer); // B-202605-493: diferido post-descarga
  await migrateClosedItemsToHistorico(); // INC-[pendiente-ID]: awaited — persistencia debe completarse antes del toast de éxito

  closeMapGenerator();
  showToast('success', `Paquete generado — ${fileDefs.length} documento${fileDefs.length !== 1 ? 's' : ''} · v${bumpedVer}`);
}
// R-202605-002: _mgApplyBumpedVersion — solo actualiza DOM, no persiste en localStorage
function _mgApplyBumpedVersion(ver) {

  // 1. DOM — title del documento
  document.title = `Locus ${ver}`;

  // 2. DOM — pill de versión en el header global (textContent + tooltip)
  const vpEl = document.getElementById('version-pill');
  if (vpEl) {
    vpEl.textContent = ver;
    vpEl.title = `${ver} · Ver changelog`;
  }

  // 3. DOM — banner de versión en sub-tab Backlog
  const bmetaEl = document.getElementById('bmeta-version');
  if (bmetaEl) bmetaEl.textContent = ver;
}

function _mgDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// R-202605-146: Descargar todos los documentos exportables en un ZIP
// TKT2/TKT4 (REQ CAEL-0730-01): BACKLOG, BACKLOG-FULL y CONTEXT retirados — exportBacklogMd()/
// exportFullHistoryMd() (locus-backlog-generator.js) siguen siendo el camino vigente para esos
// dos, sin cambio; CONTEXT sigue el flujo manual de __BR-Core §8. Esta función queda exclusiva
// a MAP, consistente con el resto del módulo. Nota de gap encontrado al retirar: el call site de
// CONTEXT aquí invocaba _generateContext() sin argumento — la firma real exige `ver`, hubiera
// producido un CONTEXT con versión resuelta por fallback interno en vez del valor de este
// bloque; sin impacto ahora que el call site se retira junto con el resto de CONTEXT.
// TKT1 (REQ ref_id CAEL-0805-01): rama JSZip retirada — el generador solo produce MAP desde
// TKT2/TKT3/TKT4 de REQ CAEL-0730-01, comprimir un único archivo no aporta valor y JSZip
// fallaba de forma consistente en el entorno del founder. fileDefs/_getMapContent() solo
// alimentaban la rama ZIP — exportHtmlMapMd() ya es la fuente de exportación individual y
// maneja su propio caso de contenido ausente, mismo comportamiento que la rama fallback previa.
export function _mgExportAllZip() {
  exportHtmlMapMd();
  showToast('info', 'MAP descargado');
}

// T-202605-032: addEventListener — migración desde onclick inline en index.html
document.addEventListener('DOMContentLoaded', function () {
  const btnOpen     = document.getElementById('btn-generate-map');
  const btnClose    = document.getElementById('mg-close-btn');
  const btnGenerate = document.getElementById('mg-generate-btn');
  const btnCancel   = document.getElementById('mg-cancel-btn');
  const btnConfirm  = document.getElementById('mg-confirm-btn');

  if (btnOpen)     btnOpen.addEventListener('click', openMapGenerator);
  if (btnClose)    btnClose.addEventListener('click', closeMapGenerator);
  if (btnGenerate) btnGenerate.addEventListener('click', generateDocuments);
  if (btnCancel)   btnCancel.addEventListener('click', closeMapGenerator);
  if (btnConfirm)  btnConfirm.addEventListener('click', confirmMapGenerator);

  // T-202605-036: event delegation — migración de handlers on* en templates dinámicos

  // AC3 — file list: onclick remove button → _mgRemoveFile
  const fileList = document.getElementById('mg-file-list');
  if (fileList) {
    fileList.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-remove-idx]');
      if (btn) _mgRemoveFile(parseInt(btn.dataset.removeIdx, 10));
    });
  }

  // AC4 — preview area: onclick confirm/cancel en warning de sprint sin cerrar
  // Contenedor padre estable (existe desde carga inicial, no se destruye entre aperturas)
  const mgOverlay = document.getElementById('mg-overlay');
  if (mgOverlay) {
    mgOverlay.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-mg-action]');
      if (!btn) return;
      if (btn.dataset.mgAction === 'confirm-generate') _doConfirmGenerate();
      if (btn.dataset.mgAction === 'reset-preview') _mgResetPreview();
      if (btn.dataset.mgAction === 'edit-sprint') {
        closeMapGenerator();
        const spId = btn.dataset.sprintId;
        setTimeout(() => { editSprintInline(spId); }, 100);
      }
    });
  }
});

// ── Exposición pública — T-202605-068 ───────────────────────────────────────
// ── window.* — solo para compatibilidad con locus-api.js (T6) ────────────────
