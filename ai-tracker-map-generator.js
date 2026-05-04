/**
 * ai-tracker-map-generator.js
 * Versión: v1.3.0 | Última actualización: 2026-05-02 UTC-6
 * Módulo: Document Generator — MAP + CONTEXT + BACKLOG + Sprint Review + ZIP
 * Proyecto: AI Tracker
 * R-202604-053 | R-202604-086 | R-202605-101
 */

// ─── Helper: sprint de referencia — activo o último cerrado ──────────────────
// B-[pendiente-ID]: el generador se usa post-cierre de sprint — si no hay sprint
// activo, tomar el último sprint cerrado (mayor closedAt) para el Sprint Review.
function _mgActiveSprint() {
  if (typeof getActiveSprints !== 'function') return null;
  const all = getActiveSprints();
  // Primero: sprint activo o abierto
  const active = all.find(s => s.status === 'active' || s.status === 'open');
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
  generatedDocs: {},  // { map, context, backlog, review } — strings generados
  // Sprint Review — marcas de trasciende
  decisionTranscends: {},   // { decId: bool }
  learningTranscends: {},   // { sessId: bool }
};

// ─── Apertura / cierre ───────────────────────────────────────────────────────

function openMapGenerator() {
  _mapGen.files = [];
  _mapGen.previewMd = '';
  _mapGen.generatedDocs = {};
  _mapGen.decisionTranscends = {};
  _mapGen.learningTranscends = {};

  _mgRenderFileList();
  _mgResetPreview();
  _mgUpdateBtn();

  // Inicializar versión
  const vInput = document.getElementById('mg-version-input');
  const fPreview = document.getElementById('mg-filename-preview');
  const prefix = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
  const ver = typeof _effectiveVersion !== 'undefined' ? _effectiveVersion : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v3.1.0.0');
  if (vInput) vInput.value = ver;
  if (fPreview) fPreview.textContent = `${prefix}-MAP_${ver}.md`;

  // Cargar Sprint Review
  _mgLoadSprintReview();

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
}

// ─── Sprint Review — carga de datos ─────────────────────────────────────────

function _mgLoadSprintReview() {
  const proj = typeof getActiveProject === 'function' ? getActiveProject() : null;
  if (!proj) return;

  // Sprint activo
  const activeSprint = _mgActiveSprint();

  const sprintLabel = document.getElementById('mg-review-sprint-label');
  if (sprintLabel) {
    sprintLabel.textContent = activeSprint ? activeSprint.id : '(sin sprint activo)';
  }

  // Decisiones del proyecto
  const decisions = Array.isArray(proj.decisions) ? proj.decisions : [];
  _mgRenderDecisions(decisions);

  // Aprendizajes: campo `learning` o `aprendizaje` de sessions del sprint activo
  const sessions = Array.isArray(proj.sessions) ? proj.sessions : [];
  const sprintSessions = activeSprint
    ? sessions.filter(s => {
        // Buscar sessions que referencian este sprint — via trackerRefs o campo sprint
        return (s.sprintId === activeSprint.id) || _mgSessionInSprint(s, activeSprint.id);
      })
    : sessions.slice(-20); // fallback: últimas 20 si no hay sprint

  // B-202605-226: log de diagnóstico cuando 0 sesiones matchean con sprint activo
  if (activeSprint && !sprintSessions.length && sessions.length) {
    console.warn(`[MapGen] 0 sesiones matchearon sprint ${activeSprint.id} — verificar sprintId en sesiones`);
  }

  _mgRenderLearnings(sprintSessions);
}

function _mgSessionInSprint(sess, sprintId) {
  // B-202605-226: guard — si ITEMS no está en scope, omitir match por trackerRefs sin lanzar error
  if (!sprintId) return false;
  if (sess.sprintId === sprintId) return true;
  const refs = sess.trackerRefs || sess.backlogRefs || [];
  if (!refs.length) return false;
  if (typeof ITEMS === 'undefined') return false;
  return refs.some(code => {
    const item = ITEMS.find(i => i.code === code);
    return item && item.sprint === sprintId;
  });
}

function _mgRenderDecisions(decisions) {
  const tbody = document.getElementById('mg-decisions-tbody');
  if (!tbody) return;

  if (!decisions.length) {
    tbody.innerHTML = '<tr class="mg-review-empty"><td colspan="4">Sin decisiones registradas.</td></tr>';
    return;
  }

  const sorted = [...decisions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  tbody.innerHTML = sorted.map(d => {
    const checked = _mapGen.decisionTranscends[d.id] ? 'checked' : '';
    const esc = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<tr class="mg-review-row${checked ? ' mg-review-row--transcends' : ''}" data-id="${d.id}">
      <td class="mg-review-text">${esc(d.text)}</td>
      <td class="mg-review-meta">${esc(d.author || '—')}</td>
      <td class="mg-review-meta">${esc(d.date || '—')}</td>
      <td class="mg-col-trasciende"><label class="mg-trasciende-toggle"><input type="checkbox" ${checked} onchange="_mgToggleDecisionTranscends('${d.id}', this.checked)"><span>Sí</span></label></td>
    </tr>`;
  }).join('');
}

function _mgRenderLearnings(sessions) {
  const tbody = document.getElementById('mg-learnings-tbody');
  if (!tbody) return;

  // Filtrar sessions con campo learning/aprendizaje no vacío
  const withLearning = sessions.filter(s => {
    const txt = s.learning || s.aprendizaje || s.nextStep || '';
    return txt.trim().length > 0;
  });

  if (!withLearning.length) {
    tbody.innerHTML = '<tr class="mg-review-empty"><td colspan="4">Sin aprendizajes registrados en sesiones de este sprint.</td></tr>';
    return;
  }

  const esc = s => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  tbody.innerHTML = withLearning.map(s => {
    const txt = s.learning || s.aprendizaje || s.nextStep || '';
    const checked = _mapGen.learningTranscends[s.id] ? 'checked' : '';
    const dateStr = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
    return `<tr class="mg-review-row${checked ? ' mg-review-row--transcends' : ''}" data-id="${s.id}">
      <td class="mg-review-text">${esc(txt)}</td>
      <td class="mg-review-meta">${esc(s.title ? s.title.slice(0, 40) : '—')}</td>
      <td class="mg-review-meta">${esc(dateStr)}</td>
      <td class="mg-col-trasciende"><label class="mg-trasciende-toggle"><input type="checkbox" ${checked} onchange="_mgToggleLearningTranscends('${s.id}', this.checked)"><span>Sí</span></label></td>
    </tr>`;
  }).join('');
}

function _mgToggleDecisionTranscends(id, val) {
  _mapGen.decisionTranscends[id] = val;
  // Re-render fila para reflejo visual
  const row = document.querySelector(`#mg-decisions-tbody tr[data-id="${id}"]`);
  if (row) row.classList.toggle('mg-review-row--transcends', val);
}

function _mgToggleLearningTranscends(id, val) {
  _mapGen.learningTranscends[id] = val;
  const row = document.querySelector(`#mg-learnings-tbody tr[data-id="${id}"]`);
  if (row) row.classList.toggle('mg-review-row--transcends', val);
}

function _mgSwitchReviewTab(tab, btn) {
  document.querySelectorAll('.mg-review-tab').forEach(b => b.classList.remove('mg-review-tab--active'));
  if (btn) btn.classList.add('mg-review-tab--active');
  const decisionsPanel = document.getElementById('mg-review-decisions');
  const learningsPanel = document.getElementById('mg-review-learnings');
  if (decisionsPanel) decisionsPanel.classList.toggle('mg-review-panel--hidden', tab !== 'decisions');
  if (learningsPanel) learningsPanel.classList.toggle('mg-review-panel--hidden', tab !== 'learnings');
}

// ─── Dropzone ────────────────────────────────────────────────────────────────

let _mgDropzoneInited = false;

function _mgInitDropzone() {
  if (_mgDropzoneInited) return;
  _mgDropzoneInited = true;

  const zone = document.getElementById('mg-dropzone');
  const input = document.getElementById('mg-file-input');
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('mg-drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('mg-drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('mg-drag-over');
    _mgLoadFiles([...e.dataTransfer.files]);
  });
  zone.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    _mgLoadFiles([...input.files]);
    input.value = '';
  });
}

function _mgLoadFiles(fileList) {
  const allowed = ['.js', '.css', '.html'];
  const valid = fileList.filter(f => allowed.some(ext => f.name.toLowerCase().endsWith(ext)));
  if (!valid.length) return;

  let pending = valid.length;

  valid.forEach(file => {
    if (_mapGen.files.find(f => f.name === file.name)) {
      pending--;
      if (pending === 0) { _mgRenderFileList(); _mgUpdateBtn(); }
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      _mapGen.files.push({ name: file.name, size: file.size, text: e.target.result });
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
        <button class="mg-file-remove" onclick="_mgRemoveFile(${i})" title="Eliminar">✕</button>
      </div>`;
  }).join('');
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
  // Habilitar si hay archivos O si algún output no requiere archivos (CONTEXT, BACKLOG, Review)
  const mapChecked = document.getElementById('mg-out-map')?.checked;
  const needsFiles = mapChecked;
  btn.disabled = needsFiles && _mapGen.files.length === 0;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

function _mgParseFile(name, text) {
  const ext = name.split('.').pop().toLowerCase();
  const lines = text.split('\n');
  const total = lines.length;
  const entries = [];

  if (ext === 'js') {
    lines.forEach((line, i) => {
      const lineNum = i + 1;
      const fnMatch = line.match(/^\s*(?:async\s+)?function\s+(\w+)\s*\(/);
      if (fnMatch) {
        entries.push({ line: `L${lineNum}`, fn: fnMatch[1], area: _mgGuessArea(fnMatch[1], line) });
        return;
      }
      const arrowMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(?[^)]*\)?\s*=>/);
      if (arrowMatch) {
        entries.push({ line: `L${lineNum}`, fn: arrowMatch[1], area: _mgGuessArea(arrowMatch[1], line) });
        return;
      }
      const exprMatch = line.match(/^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function/);
      if (exprMatch) {
        entries.push({ line: `L${lineNum}`, fn: exprMatch[1], area: _mgGuessArea(exprMatch[1], line) });
      }
    });
  } else if (ext === 'css') {
    lines.forEach((line, i) => {
      const secMatch = line.match(/\/\*\s*[═=]{2,}\s*(.+?)\s*[═=]{2,}\s*\*\//);
      if (secMatch) entries.push({ line: `L${i + 1}`, fn: secMatch[1].trim(), area: 'Sección' });
    });
  } else if (ext === 'html') {
    lines.forEach((line, i) => {
      const secMatch = line.match(/<!--\s*[═=]{2,}\s*(.+?)\s*[═=]{2,}\s*-->/);
      if (secMatch) entries.push({ line: `L${i + 1}`, fn: secMatch[1].trim(), area: 'Sección' });
    });
  }

  return { name, ext, total, entries };
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

function _mgGetVersion() {
  // B-202605-228: rechazar string literal "undefined" — ocurre si APP_VERSION no estaba listo al abrir el overlay
  const input = document.getElementById('mg-version-input');
  const raw = input ? input.value.trim() : '';
  if (raw && raw !== 'undefined') return raw;
  // B-202605-266: preferir versión canónica post-Generator (app-version-override) sobre APP_VERSION hardcodeada
  try {
    const stored = localStorage.getItem('app-version-override');
    if (stored && stored.trim() && stored !== 'undefined') return stored;
  } catch(e) {}
  const appVer = typeof APP_VERSION !== 'undefined' ? APP_VERSION : null;
  if (appVer && appVer !== 'undefined') return appVer;
  return 'v3.1.0';
}

// ─── Generador PLAN ──────────────────────────────────────────────────────────
// T-202605-487: _mgBuildPlan() — agrupa ítems del sprint siguiente por rol,
// detecta conflictos de archivo, resuelve deps, emite bloque ---PLAN---.
//
// Casos de prueba inline:
//
// CASO 1 — Solo paralelas (mismo rol, sin archivos en común):
//   ítem A: rol FS, archivos: [a.js]
//   ítem B: rol FS, archivos: [b.css]
//   → 2 sesiones paralelas, depende_de: [] en ambas
//
// CASO 2 — Solo secuenciales (mismo rol, archivos en común):
//   ítem A: rol FS, archivos: [a.js]
//   ítem B: rol FS, archivos: [a.js]
//   → sesión A primero, sesión B depende_de: [id-sesión-A]
//
// CASO 3 — Mixto con deps entre ítems:
//   ítem A: rol FS, archivos: [a.js], deps: []
//   ítem B: rol FS, archivos: [b.js], deps: [código-A]
//   ítem C: rol UX, archivos: [c.css], deps: []
//   → sesión-FS-A y sesión-UX-C paralelas
//   → sesión-FS-B depende_de: [sesión-FS-A] (por dep explícita)

function _mgBuildPlan() {
  // Obtener ítems del sprint siguiente
  const allSprints = (typeof getActiveSprints === 'function') ? getActiveSprints() : [];
  const openSprints = allSprints.filter(s => s.status === 'active' || s.status === 'open');

  // Sprint siguiente: primero después del activo, o el primer open si no hay activo
  const activeSprint = _mgActiveSprint();
  let targetSprint = null;
  if (activeSprint) {
    // Buscar sprint open con id posterior al activo
    const activeIdx = allSprints.findIndex(s => s.id === activeSprint.id);
    targetSprint = allSprints.slice(activeIdx + 1).find(s => s.status === 'active' || s.status === 'open') || null;
  }
  if (!targetSprint && openSprints.length) {
    // Ordenar por id numérico ascendente (S-22 antes que S-23) para tomar el siguiente cronológico
    const sorted = [...openSprints].sort((a, b) => {
      const na = parseInt((a.id || '').replace(/\D/g, '')) || 0;
      const nb = parseInt((b.id || '').replace(/\D/g, '')) || 0;
      return na - nb;
    });
    targetSprint = sorted[0];
  }

  // Leer ítems del backlog
  let backlogItems = [];
  try {
    if (typeof _tplKey === 'function') {
      const raw = localStorage.getItem(_tplKey('backlog-items'));
      backlogItems = raw ? JSON.parse(raw) : [];
    } else if (typeof ITEMS !== 'undefined') {
      backlogItems = ITEMS;
    }
  } catch(e) { backlogItems = []; }

  // Filtrar ítems del sprint objetivo con rol asignado y status pendiente
  const sprintItems = backlogItems.filter(it =>
    it.sprint === (targetSprint ? targetSprint.id : null) &&
    it.role && it.role.trim() &&
    it.status === 'pendiente'
  );

  if (!sprintItems.length) {
    return { planMd: null, warning: 'Sin ítems con rol asignado para el próximo sprint' };
  }

  // Mapa código → ítem para resolver deps
  const itemByCode = {};
  backlogItems.forEach(it => { if (it.code) itemByCode[it.code] = it; });

  // Agrupar por rol
  const byRol = {};
  sprintItems.forEach(it => {
    const rol = it.role.trim();
    if (!byRol[rol]) byRol[rol] = [];
    byRol[rol].push(it);
  });

  // Para cada grupo de rol, construir sesiones respetando conflictos de archivo y deps
  // Estructura de sesión: { id, rol, items: [codes], archivos: [files], depende_de: [sessIds] }
  const sessions = [];
  let sessCounter = 0;

  Object.entries(byRol).forEach(([rol, items]) => {
    // Detectar área de integración para regla fija FS-Integración
    const isIntegration = s => /integra/i.test(s.area || '');

    // Construir sesiones del rol — items se agrupan si no comparten archivos
    // Algoritmo greedy: para cada ítem, asignar a la primera sesión sin conflicto de archivo
    // Si tiene dep a ítem de otra sesión → nueva sesión dependiente
    const rolSessions = []; // [{ id, items, archivos, depende_de_sess: Set }]

    items.forEach(it => {
      const itFiles = (it.archivos || []).map(f => f.toLowerCase());
      const itDeps  = (it.blockedBy || []).filter(Boolean); // deps explícitas de ítem

      // Sesiones que este ítem bloquea por archivo
      const conflictSessIds = new Set();
      rolSessions.forEach(sess => {
        const hasConflict = itFiles.some(f => sess.archivos.has(f));
        if (hasConflict) conflictSessIds.add(sess.id);
      });

      // Sesiones que este ítem requiere por dep explícita (ítem → sesión que contiene ese ítem)
      const depSessIds = new Set();
      itDeps.forEach(depCode => {
        rolSessions.forEach(sess => {
          if (sess.items.includes(depCode)) depSessIds.add(sess.id);
        });
      });

      const allBlockers = new Set([...conflictSessIds, ...depSessIds]);

      if (allBlockers.size === 0) {
        // Buscar sesión existente sin conflicto donde agregar
        const candidate = rolSessions.find(sess =>
          itFiles.every(f => !sess.archivos.has(f)) &&
          (itDeps.length === 0 || itDeps.every(dc => sess.items.includes(dc)))
        );
        if (candidate) {
          candidate.items.push(it.code);
          itFiles.forEach(f => candidate.archivos.add(f));
        } else {
          // Nueva sesión paralela
          sessCounter++;
          const id = `sess-${rol.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${sessCounter}`;
          rolSessions.push({ id, rol, items: [it.code], archivos: new Set(itFiles), depende_de_sess: new Set() });
        }
      } else {
        // Nueva sesión que depende de las sesiones con conflicto
        sessCounter++;
        const id = `sess-${rol.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${sessCounter}`;
        rolSessions.push({ id, rol, items: [it.code], archivos: new Set(itFiles), depende_de_sess: allBlockers });
      }
    });

    rolSessions.forEach(s => sessions.push(s));
  });

  // Regla fija FS-Integración: sesiones FS con área Integración dependen de todas las UX del sprint
  const uxSessIds = sessions
    .filter(s => /UX/i.test(s.rol))
    .map(s => s.id);
  if (uxSessIds.length) {
    sessions
      .filter(s => /FS/i.test(s.rol) && sprintItems.some(it => s.items.includes(it.code) && /integra/i.test(it.area || '')))
      .forEach(s => { uxSessIds.forEach(uid => s.depende_de_sess.add(uid)); });
  }

  // Resolver deps entre items de distintos roles (dep cruzada)
  sessions.forEach(sess => {
    sess.items.forEach(code => {
      const it = itemByCode[code];
      if (!it || !it.blockedBy || !it.blockedBy.length) return;
      it.blockedBy.forEach(depCode => {
        // Buscar sesión (de otro rol) que contenga depCode
        sessions.forEach(other => {
          if (other.id !== sess.id && other.items.includes(depCode)) {
            sess.depende_de_sess.add(other.id);
          }
        });
      });
    });
  });

  // Emitir bloque ---PLAN---
  const sprintId = targetSprint ? targetSprint.id : 'sin-sprint';

  let md = `---PLAN---\n`;
  md += `sprint: ${sprintId}\n`;
  md += `sesiones:\n`;

  sessions.forEach(sess => {
    const archivosArr = [...sess.archivos];
    const depArr      = [...sess.depende_de_sess];
    md += `  - id: ${sess.id}\n`;
    md += `    rol: ${sess.rol}\n`;
    md += `    items: ${sess.items.join(', ')}\n`;
    md += `    archivos: ${archivosArr.length ? archivosArr.join(', ') : '[]'}\n`;
    md += `    depende_de: ${depArr.length ? depArr.join(', ') : '[]'}\n`;
  });

  md += `---PLAN-END---`;

  return { planMd: md, warning: null, sprintId };
}

// ─── Generación principal ────────────────────────────────────────────────────

function generateDocuments() {
  const mapChecked     = document.getElementById('mg-out-map')?.checked;
  const contextChecked = document.getElementById('mg-out-context')?.checked;
  const backlogChecked = document.getElementById('mg-out-backlog')?.checked;
  const reviewChecked  = document.getElementById('mg-out-review')?.checked;
  const planChecked    = document.getElementById('mg-out-plan')?.checked;

  if (!mapChecked && !contextChecked && !backlogChecked && !reviewChecked && !planChecked) {
    if (typeof showToast === 'function') showToast('warning', 'Selecciona al menos un documento a generar.');
    return;
  }
  if (mapChecked && !_mapGen.files.length) {
    if (typeof showToast === 'function') showToast('warning', 'Adjunta archivos para generar el MAP.');
    return;
  }

  const btn = document.getElementById('mg-generate-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }

  _mapGen.generatedDocs = {};

  if (mapChecked)     _mapGen.generatedDocs.map     = _generateMap();
  if (contextChecked) _mapGen.generatedDocs.context  = _generateContext();
  if (backlogChecked) _mapGen.generatedDocs.backlog   = _generateBacklog();
  if (reviewChecked)  _mapGen.generatedDocs.review    = _generateSprintReview();
  if (planChecked) {
    const planResult = _mgBuildPlan();
    if (planResult.warning) {
      if (typeof showToast === 'function') showToast('warning', planResult.warning);
    } else {
      _mapGen.generatedDocs.plan = planResult.planMd;
      _mapGen.generatedDocs._planSprintId = planResult.sprintId;
    }
  }

  // Compatibilidad: _mapGen.previewMd = MAP si se generó
  if (_mapGen.generatedDocs.map) _mapGen.previewMd = _mapGen.generatedDocs.map;

  if (btn) { btn.disabled = false; btn.textContent = 'Generar'; }

  _mgShowPreview(_mapGen.generatedDocs);
}

// Alias para compatibilidad con código que llame generateMap() directamente
function generateMap() { generateDocuments(); }

// ─── Generador MAP ───────────────────────────────────────────────────────────

function _generateMap() {
  const order = { js: 0, css: 1, html: 2 };
  const sorted = [..._mapGen.files].sort((a, b) => {
    const ea = a.name.split('.').pop().toLowerCase();
    const eb = b.name.split('.').pop().toLowerCase();
    return (order[ea] ?? 9) - (order[eb] ?? 9);
  });

  const version = _mgGetVersion();
  const now = _mgNow();
  const prefix = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
  const parsed = sorted.map(f => _mgParseFile(f.name, f.text));
  const totalLines = parsed.reduce((s, p) => s + p.total, 0);

  let md = `# ${prefix}-MAP_${version}.md\n`;
  md += `<!-- Versión: ${version} | Última actualización: ${now} UTC-6 | Generado automáticamente -->\n\n`;
  md += `# MODULE-MAP — AI-Tracker ${version}\n\n`;
  md += `Arquitectura modular — ${parsed.length} archivos independientes.\n`;
  md += `Generado: ${now} UTC-6\n\n---\n\n`;

  md += `## Índice de archivos\n\n`;
  md += `| Archivo | Tipo | Líneas | Descripción |\n`;
  md += `|---------|------|--------|-------------|\n`;
  parsed.forEach(p => {
    const tipo = p.ext.toUpperCase();
    const desc = p.ext === 'js' ? `${p.entries.length} funciones` : `${p.entries.length} secciones`;
    md += `| \`${p.name}\` | ${tipo} | ${p.total.toLocaleString()} | ${desc} |\n`;
  });
  md += `\n**Total líneas:** ${totalLines.toLocaleString()}\n\n---\n\n`;

  parsed.forEach(p => {
    md += `## ${p.name} (${p.total.toLocaleString()} líneas)\n\n`;
    if (!p.entries.length) { md += `_Sin elementos detectados._\n\n`; return; }
    if (p.ext === 'js') {
      md += `| Línea | Función / Constante | Área |\n|-------|---------------------|------|\n`;
      p.entries.forEach(e => { md += `| ${e.line} | \`${e.fn}\` | ${e.area} |\n`; });
    } else {
      md += `| Líneas | Sección |\n|--------|---------|\n`;
      p.entries.forEach(e => { md += `| ${e.line} | ${e.fn} |\n`; });
    }
    md += `\n`;
  });

  return md;
}

// ─── Generador CONTEXT ───────────────────────────────────────────────────────

function _generateContext() {
  const _ctxVersion = _mgGetVersion();
  const proj = typeof getActiveProject === 'function' ? getActiveProject() : null;

  // B-190: preferir contexto almacenado del proyecto (acumula entre sprints)
  // B-202605-227: si storedCtx vacío → buildContextMd como base; Memoria operativa se inyecta igualmente
  const storedCtx = (proj && typeof getProjContext === 'function') ? getProjContext(proj.id) : null;
  let base = storedCtx && storedCtx.trim()
    ? storedCtx
    : (typeof buildContextMd === 'function'
        ? buildContextMd(_ctxVersion)
        : `# CONTEXT generado — buildContextMd no disponible\n`);

  // Guard: base nunca undefined
  if (!base || !base.trim()) {
    base = `# CONTEXT — AI Tracker\nVersión: ${_ctxVersion}\n`;
  }

  const activeSprint = _mgActiveSprint();
  const sprintLabel = activeSprint ? activeSprint.id : 'S-??';

  // Memoria operativa — extraer de sesiones del sprint
  const sessions = proj && Array.isArray(proj.sessions) ? proj.sessions : [];
  const sprintSessions = activeSprint
    ? sessions.filter(s => _mgSessionInSprint(s, activeSprint.id))
    : sessions.slice(-20);

  // B-202605-226: log si 0 sesiones matchean con sprint activo
  if (activeSprint && !sprintSessions.length && sessions.length) {
    console.warn(`[MapGen] _generateContext: 0 sesiones matchearon sprint ${activeSprint.id}`);
  }

  // Extraer entradas previas de ## Memoria operativa del base para preservarlas
  // B-202605-227: regex más permisivo — acepta sección al final del documento sin \n## posterior
  const memMatch = base.match(/^## Memoria operativa\n([\s\S]*?)(?=\n## |\n---\s*$|$)/m);
  const existingLines = memMatch
    ? memMatch[1].split('\n').map(l => l.trim()).filter(l => l.startsWith('['))
    : [];
  const seenMemoria = new Set(existingLines.map(l => l.toLowerCase()));

  // Nuevas entradas del sprint — decisiones (key corregido post B-225)
  const newDecisions = sprintSessions
    .filter(s => s.decision && s.decision.trim())
    .map(s => `[${sprintLabel}] Decisión: ${s.decision.trim()}`)
    .filter(entry => {
      const key = entry.toLowerCase();
      if (seenMemoria.has(key)) return false;
      seenMemoria.add(key);
      return true;
    });

  // Nuevas entradas del sprint — aprendizajes
  const newLearnings = sprintSessions
    .filter(s => (s.aprendizaje || s.learning || '').trim())
    .map(s => `[${sprintLabel}] Aprendizaje: ${(s.aprendizaje || s.learning || '').trim()}`)
    .filter(entry => {
      const key = entry.toLowerCase();
      if (seenMemoria.has(key)) return false;
      seenMemoria.add(key);
      return true;
    });

  const newEntries = [...newDecisions, ...newLearnings];

  // Remover ## Memoria operativa existente del base para reinyectar acumulada
  // B-202605-227: regex más permisivo — cubre caso sección al final sin delimitador posterior
  base = base.replace(/\n## Memoria operativa[\s\S]*?(?=\n## |\n---\s*$|$)/m, '');

  // Reconstruir sección acumulada — B-202605-227: inyectar aunque newEntries esté vacío si hay existingLines
  const allLines = [...existingLines, ...newEntries];
  if (allLines.length) {
    const memoriaSection = `\n\n## Memoria operativa\n\n${allLines.join('\n')}\n`;
    base = base.trimEnd() + memoriaSection;
  }

  return base;
}

// ─── Generador BACKLOG ───────────────────────────────────────────────────────

// B-202605-224: pasar _mgGetVersion() como argumento — sin esto version es undefined en el MD exportado
function _generateBacklog() {
  const version = _mgGetVersion();
  if (typeof buildBacklogMd === 'function') return buildBacklogMd(version);
  return `# BACKLOG generado — buildBacklogMd no disponible\n`;
}

// ─── Generador SPRINT-REVIEW ─────────────────────────────────────────────────

function _generateSprintReview() {
  const proj = typeof getActiveProject === 'function' ? getActiveProject() : null;
  const activeSprint = _mgActiveSprint();

  const sprintId   = activeSprint ? activeSprint.id : 'sin-sprint';
  const sprintName = activeSprint ? (activeSprint.label || activeSprint.id) : '—';
  const version    = _mgGetVersion();
  const now        = _mgNow();
  const prefix     = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';

  let md = `# ${prefix}-SPRINT-REVIEW_${sprintId}.md\n`;
  md += `<!-- Versión: ${version} | Sprint: ${sprintId} | Generado: ${now} UTC-6 -->\n\n`;
  md += `# Sprint Review — ${sprintName}\n\n`;
  md += `Generado: ${now} UTC-6\n\n---\n\n`;

  // Sesiones del sprint — declaradas aquí para uso en Sección 1 (Decisiones) y Sección 2 (Aprendizajes)
  const sessions = proj && Array.isArray(proj.sessions) ? proj.sessions : [];
  const sprintSessions = activeSprint
    ? sessions.filter(s => _mgSessionInSprint(s, activeSprint.id))
    : sessions.slice(-20);

  // B-202605-226: log de diagnóstico cuando 0 sesiones matchean con sprint activo
  if (activeSprint && !sprintSessions.length && sessions.length) {
    console.warn(`[MapGen] 0 sesiones matchearon sprint ${activeSprint.id} — verificar sprintId en sesiones`);
  }

  // Sección 1: Decisiones
  // B-[pendiente-ID]: incluir Decisión: extraída de sesiones del sprint + proj.decisions manuales
  md += `## Decisiones\n\n`;
  const decisions = proj && Array.isArray(proj.decisions) ? proj.decisions : [];
  const sorted = [...decisions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Extraer s.decision de sesiones del sprint — deduplicar por texto
  const seenDecisions = new Set(sorted.map(d => (d.text || '').trim().toLowerCase()));
  const sessionDecisions = sprintSessions
    .filter(s => s.decision && s.decision.trim())
    .filter(s => {
      const key = s.decision.trim().toLowerCase();
      if (seenDecisions.has(key)) return false;
      seenDecisions.add(key);
      return true;
    })
    .map(s => ({ text: s.decision.trim(), author: s.aiName || '—', date: s.dateShort || (s.date ? s.date.slice(0, 10) : '—'), fromSession: true }));

  const allDecisions = [...sorted.map(d => ({ text: d.text || '', author: d.author || '—', date: d.date || '—', id: d.id })), ...sessionDecisions];

  if (!allDecisions.length) {
    md += `_Sin decisiones registradas._\n\n`;
  } else {
    md += `| Decisión | Autor | Fecha | ¿Trasciende? |\n`;
    md += `|----------|-------|-------|-------------|\n`;
    allDecisions.forEach(d => {
      const t = d.id && _mapGen.decisionTranscends[d.id] ? '✓' : '';
      md += `| ${d.text} | ${d.author} | ${d.date} | ${t} |\n`;
    });
    md += `\n`;
  }

  // Sección 2: Aprendizajes
  md += `## Aprendizajes\n\n`;
  const withLearning = sprintSessions.filter(s => (s.learning || s.aprendizaje || s.nextStep || '').trim());

  if (!withLearning.length) {
    md += `_Sin aprendizajes registrados en sesiones de este sprint._\n\n`;
  } else {
    md += `| Aprendizaje | Sesión | Fecha | ¿Trasciende? |\n`;
    md += `|-------------|--------|-------|-------------|\n`;
    withLearning.forEach(s => {
      const txt = s.learning || s.aprendizaje || s.nextStep || '';
      const t = _mapGen.learningTranscends[s.id] ? '✓' : '';
      const dateStr = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
      md += `| ${txt} | ${(s.title || '').slice(0, 50)} | ${dateStr} | ${t} |\n`;
    });
    md += `\n`;
  }

  // Sección 3: Arranque del siguiente sprint — Próximo paso: del CHECKPOINT más reciente
  // E-[pendiente-ID]: reemplaza "Próximos pasos" genérico con el nextStep del último CHECKPOINT del sprint
  md += `## Arranque del siguiente sprint\n\n`;
  const lastWithNextStep = [...sprintSessions]
    .reverse()
    .find(s => s.nextStep && s.nextStep.trim());
  if (lastWithNextStep) {
    md += `${lastWithNextStep.nextStep.trim()}\n\n`;
  } else {
    md += `_Sin próximo paso registrado en el sprint._\n\n`;
  }

  // Sección 4: Histórico de sesiones — tabla completa al final
  // E-[pendiente-ID]: tabla con todas las sesiones del sprint
  md += `## Histórico de sesiones\n\n`;
  if (!sprintSessions.length) {
    md += `_Sin sesiones registradas en este sprint._\n\n`;
  } else {
    md += `| Sesión | AI | Fecha | Decisión | Próximo paso |\n`;
    md += `|--------|-----|-------|----------|--------------|\n`;
    [...sprintSessions].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(s => {
      const fecha = s.dateShort || (s.date ? s.date.slice(0, 10) : '—');
      const decision = (s.decision || '').slice(0, 60).replace(/\|/g, '\\|');
      const next = (s.nextStep || '').slice(0, 60).replace(/\|/g, '\\|');
      md += `| ${(s.title || '').slice(0, 50)} | ${s.aiName || '—'} | ${fecha} | ${decision} | ${next} |\n`;
    });
    md += `\n`;
  }

  md += `---\n\n_Documento generado desde Document Generator — PP AI Tracker._\n`;
  return md;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _mgNow() {
  return new Date().toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function _mgResetPreview() {
  const area = document.getElementById('mg-preview-area');
  if (area) area.innerHTML = '<p class="mg-preview-placeholder">Los documentos generados aparecerán aquí.</p>';
  const confirmBtn = document.getElementById('mg-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = true;
}

function _mgShowPreview(docs) {
  const area = document.getElementById('mg-preview-area');
  if (!area) return;

  const version = _mgGetVersion();
  const prefix = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';

  const items = [
    { key: 'map',     label: 'MAP',          filename: `${prefix}-MAP_${version}.md` },
    { key: 'context', label: 'CONTEXT',       filename: `${prefix}-CONTEXT_${version}.md` },
    { key: 'backlog', label: 'BACKLOG',        filename: `${prefix}-BACKLOG_${version}.md` },
    { key: 'review',  label: 'Sprint Review', filename: `${prefix}-SPRINT-REVIEW_${version}.md` },
    { key: 'plan',    label: 'Plan',          filename: `${prefix}-PLAN_${version}.md` },
  ].filter(i => docs[i.key]);

  let html = `<div class="mg-preview-header"><span class="mg-preview-badge">✓ ${items.length} documento${items.length !== 1 ? 's' : ''} generado${items.length !== 1 ? 's' : ''}</span><span class="mg-preview-version">Versión: ${version}</span></div>`;
  html += `<div class="mg-preview-doc-list">`;
  items.forEach(i => {
    const lines = docs[i.key].split('\n').length;
    html += `<div class="mg-preview-doc-item"><span class="mg-preview-doc-icon">📄</span><span class="mg-preview-doc-name">${i.filename}</span><span class="mg-preview-doc-meta">${lines.toLocaleString()} líneas</span></div>`;
  });
  html += `</div>`;

  // Si hay MAP, mostrar tabla de archivos
  if (docs.map) {
    const mapLines = docs.map.split('\n');
    const tableStart = mapLines.findIndex(l => l.startsWith('| Archivo'));
    const tableEnd   = mapLines.findIndex((l, i) => i > tableStart && l.trim() === '');
    const tableRows  = tableStart >= 0 ? mapLines.slice(tableStart, tableEnd) : [];
    if (tableRows.length > 2) {
      html += `<table class="mg-preview-table"><thead><tr><th>Archivo</th><th>Tipo</th><th>Líneas</th><th>Entradas</th></tr></thead><tbody>`;
      tableRows.slice(2).forEach(row => {
        const cols = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length >= 3) html += `<tr><td>${cols[0]}</td><td>${cols[1]}</td><td>${cols[2]}</td><td>${cols[3] || ''}</td></tr>`;
      });
      html += `</tbody></table>`;
    }
  }

  area.innerHTML = html;
  const confirmBtn = document.getElementById('mg-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

// ─── Confirmar: aplicar al DOM + descargar ZIP ───────────────────────────────

function confirmMapGenerator() {
  const docs = _mapGen.generatedDocs;
  if (!Object.keys(docs).length) return;

  // R-202605-117: guard — no bumpear versión si no hay sprint cerrado previo
  const allSprints = (typeof getActiveSprints === 'function') ? getActiveSprints() : [];
  const hasClosedSprint = allSprints.some(s => s.status === 'closed');
  if (!hasClosedSprint) {
    if (typeof showToast === 'function') {
      showToast('warning', 'Cierra un sprint antes de confirmar el Generator — sin sprint cerrado no se bumpa versión');
    }
    return;
  }

  const version   = _mgGetVersion();
  const prefix    = typeof _docPrefix === 'function' ? _docPrefix() : 'AI';
  const input = document.getElementById('mg-version-input'); 
  const userDeclared = input && input.value.trim() && input.value.trim() !== 'undefined';
  const bumpedVer = userDeclared ? version : _mgBumpMinor(version);
  // Construir tabla de archivos: { filename, content, applyFn? }
  const activeSprint = _mgActiveSprint();
  const sprintId     = activeSprint ? activeSprint.id : 'sin-sprint';

  const fileDefs = [];
  if (docs.map) {
    const name = `${prefix}-MAP_${bumpedVer}.md`;
    fileDefs.push({
      filename: name,
      content:  docs.map,
      apply: () => {
        if (typeof importHtmlMap === 'function') {
          const f = new File([docs.map], name, { type: 'text/markdown' });
          importHtmlMap({ target: { files: [f], value: '' } });
        }
      },
    });
  }
  if (docs.context) {
    const name = `${prefix}-CONTEXT_${bumpedVer}.md`;
    fileDefs.push({
      filename: name,
      content:  docs.context,
      apply: () => {
        if (typeof _importContextMdFromText === 'function') _importContextMdFromText(docs.context);
      },
    });
  }
  if (docs.backlog) {
    // BACKLOG: solo ZIP — no re-importar (round-trip MD→parse puede corromper merge)
    fileDefs.push({ filename: `${prefix}-BACKLOG_${bumpedVer}.md`, content: docs.backlog });
  }
  if (docs.review) {
    fileDefs.push({ filename: `${prefix}-SPRINT-REVIEW_${sprintId}_${bumpedVer}.md`, content: docs.review });
  }
  if (docs.plan) {
    fileDefs.push({ filename: `${prefix}-PLAN_${bumpedVer}.md`, content: docs.plan });
  }

  // Aplicar efectos de DOM antes de generar ZIP
  fileDefs.forEach(d => { if (d.apply) d.apply(); });

  // T-202605-488: ingerir Plan generado automáticamente
  if (docs.plan) {
    const ingested = (typeof _tryIngestPlan === 'function') ? _tryIngestPlan(docs.plan) : false;
    if (ingested) {
      // Guardar metadata de origen automático para chip en renderPlan
      try {
        const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
        if (proj) {
          const metaKey = `ai-tracker-plan-auto-${proj.id}`;
          localStorage.setItem(metaKey, JSON.stringify({ ts: Date.now(), sprintId: docs._planSprintId || '?' }));
        }
      } catch(e) {}
    } else if (typeof showToast === 'function') {
      showToast('warning', 'Plan generado pero no pudo ingresarse automáticamente — copia el bloque manualmente');
    }
  }

  // R-202604-086: reflejar versión bumped en header de PP
  _mgApplyBumpedVersion(bumpedVer);

  // B-[tmp:closed-version]: mover done/descartados al histórico al confirmar bump de versión
  if (typeof archiveClosedItems === 'function') archiveClosedItems();

  // Generar ZIP — usa JSZip si está disponible; fallback a descargas individuales
  const zipName = `${prefix}-SPRINT-PACKAGE_${sprintId}_${bumpedVer}.zip`;

  if (typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    fileDefs.forEach(d => zip.file(d.filename, d.content));
    zip.generateAsync({ type: 'blob' }).then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
    });
  } else {
    // Fallback: descargas individuales
    fileDefs.forEach(d => _mgDownload(d.content, d.filename));
    if (typeof showToast === 'function') showToast('warning', 'JSZip no disponible — descargando archivos por separado');
  }

  closeMapGenerator();
  if (typeof showToast === 'function') {
    showToast('success', `Paquete generado — ${fileDefs.length} documento${fileDefs.length !== 1 ? 's' : ''} · v${bumpedVer}`);
  }
}

// R-202604-086: reflejar versión bumped en el DOM de PP + persistir en localStorage
// Fuente de verdad única: localStorage key 'app-version-override' (declarada en ai-tracker-checkpoint.js).
// ai-tracker-checkpoint.js la lee al arrancar y la usa sobre APP_VERSION.
function _mgApplyBumpedVersion(ver) {
  // 1. Persistir — fuente de verdad para todos los módulos en próximos arranques
  // _APP_VERSION_KEY declarada en ai-tracker-checkpoint.js — usar string literal aquí para evitar redeclaración
  try { localStorage.setItem('app-version-override', ver); } catch(e) {}

  // 2. DOM — title del documento
  document.title = `AI Tracker ${ver}`;

  // 3. DOM — pill de versión en el header global (textContent + tooltip)
  const vpEl = document.getElementById('version-pill');
  if (vpEl) {
    vpEl.textContent = ver;
    vpEl.title = `${ver} · Ver changelog`;
  }

  // 4. DOM — banner de versión en sub-tab Backlog
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
