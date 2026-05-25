// locus-session-parse.js
// Responsabilidad: parseCheckpoint, parsePaste, handlePaste/Input, parsePasteStandalone, saveStandaloneCheckpoint, parsePlanBlock, _tryIngestPlan.
// Dependencias: locus-storage.js · locus-toast.js · locus-session-hora.js

// R-202604-037: tabla canónica de proyectos del ecosistema — editar aquí para agregar nuevos
// La validación en parsePaste() es case-sensitive: 'Locus' es válido, 'locus' no.
// OL-CONTEXT §7: strings canónicos — 'Obsidiana'/'Obsidiana Labs' deprecados · 'ASVAB App' deprecado (→ 'Alisto') · 'AI Tracker' deprecado (→ 'Locus')
const CANONICAL_PROJECTS = ['Obsidian Labs', 'Alisto', 'Content Manager', 'Locus'];

// R-202605-133: parseCheckpoint — path primario JSON puro + path legacy regex
// Path primario: bloque ```json { ... } ``` con schema completo
// Path legacy:   formato Markdown ---CHECKPOINT--- (read-only — CHECKPOINTs históricos)
function parseCheckpoint(text) {
  // ── Path primario: JSON puro ──────────────────────────────────────────────────
  // Detectar bloque ```json ... ``` que contiene el objeto CHECKPOINT
  const _jsonFenceMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (_jsonFenceMatch) {
    let _parsed = null;
    let _jsonErr = null;
    try {
      _parsed = JSON.parse(_jsonFenceMatch[1].trim());
    } catch (e) {
      _jsonErr = e.message || 'JSON inválido';
    }
    if (_jsonErr || !_parsed || typeof _parsed !== 'object' || Array.isArray(_parsed)) {
      // JSON detectado pero inválido — devolver resultado con error marcado
      return {
        titulo: '', proyecto: '', rol: '', resumen: '', archivos: '',
        pItems: '', tItems: '', rItems: '', bItems: '',
        estado: '', decision: '', proximoPaso: '',
        contexto: '', bloqueantes: '', aprendizaje: '',
        isCheckpoint: true,
        _jsonParseError: _jsonErr || 'El bloque ```json no contiene un objeto válido',
        rawCounts: { P: 0, T: 0, R: 0, B: 0 }
      };
    }
    // JSON válido — extraer campos del schema R-202605-133
    const items = Array.isArray(_parsed.items) ? _parsed.items : [];
    // Clasificar ítems por tipo para rawCounts (compatibilidad con preview)
    const _countByType = (t) => items.filter(i => i.type === t).length;
    // Serializar items de vuelta a texto para compatibilidad con buildTGPreview
    // pItems/tItems/rItems/bItems no se usan como fuente de datos — solo para display
    const _typedLines = (t) => items
      .filter(i => i.type === t)
      .map(i => `${i.code}: ${i.title || i.desc || ''}`)
      .join('\n');
    return {
      titulo:       _parsed.title        || '',
      proyecto:     _parsed.project      || '',
      rol:          _parsed.role         || '',
      resumen:      _parsed.summary      || '',
      archivos:     _parsed.files        || '',
      pItems:       _typedLines('P'),
      tItems:       _typedLines('T'),
      rItems:       _typedLines('R'),
      bItems:       _typedLines('B'),
      estado:       '',
      decision:     _parsed.decision     || '',
      proximoPaso:  _parsed.next_step    || '',
      contexto:     _parsed.context      || '',
      bloqueantes:  _parsed.blockers     || '',
      aprendizaje:  _parsed.learning     || '',
      isCheckpoint: true,
      _isJsonFormat: true,
      _rawItems:    items,   // ítems ya parseados — parsePaste los usa directamente
      rawCounts: {
        P: _countByType('P'),
        T: _countByType('T'),
        R: _countByType('R'),
        B: _countByType('B'),
      }
    };
  }

  // ── Path legacy: formato Markdown ---CHECKPOINT--- (read-only) ───────────────
  // Extrae campos del bloque CHECKPOINT en formato:
  // Título: ...
  // Resumen: ... | Archivos: ...
  // P: ...
  // T: ...
  // R: ...
  // B: ...
  // Contadores: P=NNN | T=NNN | R=NNN | B=NNN
  // Estado: ...
  // Decisión: ...
  // Próximo paso: ...
  
  const extractField = (fieldName) => {
    const r = new RegExp(`^\\s*${fieldName}:\\s*(.+?)$`, 'mi');
    const m = text.match(r);
    return m ? m[1].trim() : '';
  };
  
  const titulo = extractField('Título');
  const proyecto = extractField('Proyecto');
  const resumenRaw = extractField('Resumen');
  // Archivos: campo propio (línea independiente) — fallback a sufijo del Resumen
  const archivosPropio = extractField('Archivos');
  const resumenMatch = resumenRaw.match(/^(.+?)\s*(?:\|\s*Archivos:\s*(.+))?$/i);
  const resumen = resumenMatch ? resumenMatch[1].trim() : resumenRaw;
  const archivos = archivosPropio || (resumenMatch ? (resumenMatch[2] || '') : '');
  
  // T-202604-122 fix: capturar TODAS las líneas de cada tipo (no solo la primera)
  // R-202604-029 fix: dos correcciones combinadas:
  //   1. negative lookahead (?![\w]) impide que 'P' capture 'Proyecto:' o 'Próximo paso:'
  //   2. [^\S\n]* en lugar de \s* después de ':' — evita consumir el newline cuando el campo está vacío
  //      (con \s*, 'P:\n' + \s* tragaba el \n y .+ capturaba la línea siguiente)
  const extractAllLines = (fieldName) => {
    const r = new RegExp(`^[^\\S\\n]*${fieldName}(?![\\w]):[^\\S\\n]*(.+)`, 'gmi');
    const results = [];
    let m;
    while ((m = r.exec(text)) !== null) results.push(m[1].trim());
    return results.join('\n');
  };
  const pItems = extractAllLines('P');
  const tItems = extractAllLines('T');
  const rItems = extractAllLines('R');
  const bItems = extractAllLines('B');
  
  const rol = extractField('Rol');
  const estado = extractField('Estado');
  const decision = extractField('Decisión') || extractField('Decision');
  const proximoPaso = extractField('Próximo paso');
  // R-202604-039: campos de memoria narrativa
  const contexto     = extractField('Contexto');
  const bloqueantes  = extractField('Bloqueantes');
  const aprendizaje  = extractField('Aprendizaje');
  
  const _itemLineRe = /(\[pendiente-ID\]|\[tmp:[a-z0-9_-]+\]|[PTRB]-\d{6}-\d{3}(?:-[A-Z]+)?)\s*:?\s*.+/i;
  const _countParseable = (raw) => raw ? raw.split('\n').filter(l => l.trim() && _itemLineRe.test(l.trim())).length : 0;

  return {
    titulo,
    proyecto,
    rol,
    resumen,
    archivos,
    pItems,
    tItems,
    rItems,
    bItems,
    estado,
    decision,
    proximoPaso,
    contexto,
    bloqueantes,
    aprendizaje,
    isCheckpoint: true,
    rawCounts: {
      P: _countParseable(pItems),
      T: _countParseable(tItems),
      R: _countParseable(rItems),
      B: _countParseable(bItems),
    }
  };
}

// T-202604-200: actualiza la mini barra de progreso 3 fases del card
// phase: 1=Pegar (inicial), 2=Confirmar (CHECKPOINT válido), 3=Guardar (sesión persistida)
function _setPhase(id, phase) {
  const p1 = document.getElementById('phase-paste-'   + id);
  const p2 = document.getElementById('phase-confirm-' + id);
  const p3 = document.getElementById('phase-save-'    + id);
  if (!p1 || !p2 || !p3) return;
  p1.className = 'sc-step' + (phase === 1 ? ' active' : phase > 1 ? ' done' : '');
  p2.className = 'sc-step' + (phase === 2 ? ' active' : phase > 2 ? ' done' : '');
  p3.className = 'sc-step' + (phase === 3 ? ' done' : '');
  // aria-current
  [p1,p2,p3].forEach((p,i) => {
    if (phase === i+1) p.setAttribute('aria-current','step');
    else p.removeAttribute('aria-current');
  });
}

// R-202605-046: normalizar campo sprint al ingestar ítems
// Valores centinela → delete item.sprint (campo ausente = canónico para "sin sprint")
// Sprint cerrado → delete item.sprint + advertencia DocLog
function _normalizeSprint(item) {
  const raw = item.sprint;
  // AC-1: centinelas → campo ausente
  if (!raw || raw === 'n/a' || raw === 'N/A' || String(raw).trim() === '') {
    delete item.sprint;
    return;
  }
  // AC-6: sprint cerrado → campo ausente + advertencia DocLog
  if (typeof getActiveSprints === 'function') {
    const allSprints = getActiveSprints(); // B-202605-065: devuelve proj.sprints completo — abiertos y cerrados
    const sprintObj  = allSprints.find(s => s.id === raw);
    if (sprintObj && sprintObj.status === 'closed') {
      if (typeof _blogLog === 'function') {
        _blogLog('sprint-normalizado', item.code || '', `Sprint cerrado normalizado a campo ausente: ${raw}`, 'backlog');
      }
      delete item.sprint;
      return;
    }
  }
  // AC-5: sprint válido — conservar sin modificar
}

function parsePaste(id) {
  const ta = document.getElementById('ta-' + id);
  const text = ta ? ta.value : '';
  // R-202605-133: detectar CHECKPOINT en formato JSON puro (```json) o Markdown legacy
  const isCheckpoint = text.includes('---CHECKPOINT---') || /```json\s*\{/.test(text);

  let title = '', summary = '', files = '', nextStep = '', bloqueantesRaw = '', tgItems = [], ckpt = null;
  if (isCheckpoint) {
    ckpt = parseCheckpoint(text);
    title = ckpt.titulo;
    summary = ckpt.resumen;
    files = ckpt.archivos;
    nextStep = ckpt.proximoPaso;
    bloqueantesRaw = ckpt.bloqueantes || '';

    // R-202605-133: si parseCheckpoint detectó error en el bloque ```json, marcar error bloqueante
    if (ckpt._jsonParseError) {
      window[`_itemsJsonError_${id}`] = ckpt._jsonParseError;
    }
    // R-202605-133: si el CHECKPOINT es JSON puro, los ítems ya están en ckpt._rawItems — no buscar ---ITEMS---
    else if (ckpt._isJsonFormat) {
      delete window[`_itemsJsonError_${id}`];
      const _rawItems = Array.isArray(ckpt._rawItems) ? ckpt._rawItems : [];
      const _validTypes    = ['P', 'T', 'R', 'B'];
      const _validStatuses = ['done', 'pendiente', 'descartado'];
      const ckptHeaderRole = ckpt.rol || '';
      let _itemError = null;
      for (let _i = 0; _i < _rawItems.length; _i++) {
        const _it = _rawItems[_i];
        // R-202605-062: patch — instrucción de operación, no tipo de ítem
        if (_it.type === 'patch') {
          if (!_it.code || _isPlaceholderCode(_it.code)) {
            // AC-7: patch sobre código placeholder → ignorar + advertencia DocLog
            if (typeof _blogLog === 'function') _blogLog('patch-ignorado', _it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (_it.code || '(vacío)'), 'backlog');
          } else {
            window[`_patchItems_${id}`] = window[`_patchItems_${id}`] || [];
            window[`_patchItems_${id}`].push(_it);
          }
          continue;
        }
        if (!_it.type || !_it.code || !_it.status) {
          _itemError = `Ítem [${_i}]: faltan campos obligatorios (type, code, status). Recibido: ${JSON.stringify(_it)}`;
          break;
        }
        if (!_validTypes.includes(_it.type)) {
          _itemError = `Ítem [${_i}]: type inválido "${_it.type}". Valores válidos: P · T · R · B`;
          break;
        }
        if (!_validStatuses.includes(_it.status)) {
          _itemError = `Ítem [${_i}]: status inválido "${_it.status}". Valores válidos: done · pendiente · descartado`;
          break;
        }
        tgItems.push({
          type:          _it.type,
          code:          _it.code,
          title:         _it.title  || _it.desc  || '',
          desc:          _it.title  || _it.desc  || '',
          status:        normStatus(_it.status),
          _noStatus:     false,
          effort:        _it.effort != null ? (parseInt(_it.effort) || null) : null,
          area:          _it.area   || '',
          sprint:        _it.sprint,
          ac:            Array.isArray(_it.ac) ? _it.ac : [],
          role:          _it.role   || ckptHeaderRole,
          discardReason: _it.discard_reason || _it.reason || '',
          discardRef:    _it.ref    || '',
          blockedBy:     Array.isArray(_it.blockedBy) ? _it.blockedBy : [],
          parentId:      _it.parentId || null
        });
        // R-202605-046: normalizar sprint a campo ausente si es centinela o sprint cerrado
        _normalizeSprint(tgItems[tgItems.length - 1]);
      }
      if (_itemError) {
        window[`_itemsJsonError_${id}`] = _itemError;
        tgItems = [];
        delete window[`_patchItems_${id}`];
      } else {
        if (typeof _ctrMergeFromItem === 'function') {
          _rawItems.forEach(it => { if (it.contract) _ctrMergeFromItem(it.code || '[pendiente-ID]', it.contract); });
        }
      }
    }
    // Path legacy: ---ITEMS--- / ---ITEMS-END---
    else {
    // R-202604-038: parser JSON estructurado — bloque ---ITEMS--- / ---ITEMS-END---
    // El parser regex de texto libre fue eliminado. Los ítems P/T/R/B se ingresan
    // exclusivamente via bloque JSON. parseCheckpoint() conserva pItems/tItems/rItems/bItems
    // para mostrar texto legible en preview, pero no alimentan tgItems.
    const _itemsBlockMatch = text.match(/---ITEMS---\s*([\s\S]*?)\s*---ITEMS-END---/);
    const _hasItemsBlock = !!_itemsBlockMatch;
    if (_hasItemsBlock) {
      let _parsedJSON = null;
      let _jsonError = null;
      try {
        // Limpiar posibles backtick-fences si el usuario los incluyó accidentalmente
        const _jsonRaw = _itemsBlockMatch[1].replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        _parsedJSON = JSON.parse(_jsonRaw);
      } catch (e) {
        _jsonError = e.message || 'JSON inválido';
      }
      if (_jsonError || !Array.isArray(_parsedJSON)) {
        // Error bloqueante — JSON inválido o no es array
        // Se acumula en _itemsJsonError para emitirlo en la sección de validaciones
        window[`_itemsJsonError_${id}`] = _jsonError || 'El bloque ---ITEMS--- no contiene un array JSON válido';
      } else {
        // Validar y construir tgItems desde el array JSON
        const _validTypes   = ['P', 'T', 'R', 'B'];
        const _validStatuses = ['done', 'pendiente', 'descartado'];
        const ckptHeaderRole = ckpt ? (ckpt.rol || '') : '';
        let _itemError = null;
        for (let _i = 0; _i < _parsedJSON.length; _i++) {
          const _it = _parsedJSON[_i];
          // R-202605-062: patch — instrucción de operación, no tipo de ítem
          if (_it.type === 'patch') {
            if (!_it.code || (typeof _isPlaceholderCode === 'function' && _isPlaceholderCode(_it.code))) {
              if (typeof _blogLog === 'function') _blogLog('patch-ignorado', _it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (_it.code || '(vacío)'), 'backlog');
            } else {
              window[`_patchItems_${id}`] = window[`_patchItems_${id}`] || [];
              window[`_patchItems_${id}`].push(_it);
            }
            continue;
          }
          // AC-5: campos obligatorios
          if (!_it.type || !_it.code || !_it.status) {
            _itemError = `Ítem [${_i}]: faltan campos obligatorios (type, code, status). Recibido: ${JSON.stringify(_it)}`;
            break;
          }
          // AC-6: type válido
          if (!_validTypes.includes(_it.type)) {
            _itemError = `Ítem [${_i}]: type inválido "${_it.type}". Valores válidos: P · T · R · B`;
            break;
          }
          // AC-7: status válido
          if (!_validStatuses.includes(_it.status)) {
            _itemError = `Ítem [${_i}]: status inválido "${_it.status}". Valores válidos: done · pendiente · descartado`;
            break;
          }
          // Construir objeto compatible con mergeBacklogFromTG (sin cambios en esa función)
          tgItems.push({
            type:          _it.type,
            code:          _it.code,
            title:         _it.title  || _it.desc  || '',
            desc:          _it.title  || _it.desc  || '',
            status:        normStatus(_it.status),
            _noStatus:     false,
            effort:        _it.effort != null ? (parseInt(_it.effort) || null) : null,
            area:          _it.area   || '',
            sprint:        _it.sprint,
            ac:            Array.isArray(_it.ac) ? _it.ac : [],
            role:          _it.role   || ckptHeaderRole,
            discardReason: _it.discard_reason || _it.reason || '',
            discardRef:    _it.ref    || '',
            blockedBy:     Array.isArray(_it.blockedBy) ? _it.blockedBy : [],
            parentId:      _it.parentId || null
          });
          // R-202605-046: normalizar sprint a campo ausente si es centinela o sprint cerrado
          _normalizeSprint(tgItems[tgItems.length - 1]);
        }
        if (_itemError) {
          window[`_itemsJsonError_${id}`] = _itemError;
          tgItems = []; // reset — no procesar parcialmente
          delete window[`_patchItems_${id}`];
        } else {
          delete window[`_itemsJsonError_${id}`];
          // R-202604-075: extraer campo contract de cada ítem y aplicar a Contratos de Módulo
          if (typeof _ctrMergeFromItem === 'function') {
            _parsedJSON.forEach(it => {
              if (it.contract) _ctrMergeFromItem(it.code || '[pendiente-ID]', it.contract);
            });
          }
        }
      }
    } else {
      delete window[`_itemsJsonError_${id}`];
    }
    } // end path legacy else
  }

  const ai = getAI(id);
  // R-202605-062: propagar patches acumulados en window[_patchItems_${id}] a _parsed
  const _pendingPatches = window[`_patchItems_${id}`] || [];
  delete window[`_patchItems_${id}`];
  ai._parsed = { title, summary, files, tgItems, patchItems: _pendingPatches, isCheckpoint, nextStep, ckptProyecto: ckpt ? (ckpt.proyecto || '') : '' };

  // Calcular discrepancia raw vs parseado
  let rawTotal = 0, parsedTotal = tgItems.length;
  if (isCheckpoint && ckpt && ckpt.rawCounts) {
    rawTotal = Object.values(ckpt.rawCounts).reduce((a, b) => a + b, 0);
  }
  const _discrepancy = rawTotal > 0 && rawTotal !== parsedTotal ? { raw: rawTotal, parsed: parsedTotal } : null;

  const cc = document.getElementById('cc-' + id);
  if (cc) {
    const len = text.length;
    cc.textContent = len > 0 ? `${len} caracteres` : '';
    cc.className = len > 2000 ? 'char-counter warn' : 'char-counter';
  }

  // T-088: feedback visual paste-wrap según validez del checkpoint
  const wrap = ta ? ta.closest('.paste-wrap') : null;
  if (wrap) {
    if (isCheckpoint && title) {
      wrap.classList.add('paste-wrap--valid');
    } else {
      wrap.classList.remove('paste-wrap--valid');
    }
  }
  // T-202604-200: fase 2 si CHECKPOINT válido con título, fase 1 si no
  _setPhase(id, (isCheckpoint && title) ? 2 : 1);

  const draftKey = 'draft-' + id;
  if (text.trim()) {
    try {
      localStorage.setItem(draftKey, text);
    } catch (e) {
      // B-202605-NNN: QuotaExceededError — storage lleno. El draft no se guarda
      // pero el render del preview continúa sin interrupciones.
      if (typeof _checkStorageQuota === 'function') _checkStorageQuota();
    }
    // R-3: persistir borrador en Supabase con debounce para no saturar en cada keystroke
    clearTimeout(window['_draftSbTimer_' + id]);
    window['_draftSbTimer_' + id] = setTimeout(() => {
      if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
        const savedText = localStorage.getItem(draftKey);
        if (savedText) {
          _supabase.from('tracker_docs').upsert(
            [{ user_id: _supabaseUser.id, key: draftKey, value: { text: savedText, savedAt: new Date().toISOString() }, updated_at: new Date().toISOString() }],
            { onConflict: 'user_id,key' }
          ).then(({ error }) => {
            if (error && typeof _offlineQueuePush === 'function') _offlineQueuePush({ type: 'draft', aiId: id });
          });
        }
      }
    }, 3000); // 3s debounce — no escribe en cada keystroke
    const dot = document.getElementById('draft-' + id);
    if (dot) dot.className = 'draft-dot visible';
  } else {
    localStorage.removeItem(draftKey);
    const dot = document.getElementById('draft-' + id);
    if (dot) dot.className = 'draft-dot';
    if (wrap) wrap.classList.remove('paste-wrap--valid');
    // B-202604-195: reset completo al vaciar el textarea
    // Limpiar errores JSON, flags de warning no bloqueante y toast activo
    delete window[`_itemsJsonError_${id}`];
    delete window[`_noItemsWarnSeen_${id}`];
    delete window[`_rolFieldWarnSeen_${id}`];
    delete window[`_doneNoAcWarnSeen_${id}`];
    if (typeof dismissToast === 'function') dismissToast();
    // Resetear preview, botón y ta-has-items al estado inicial
    const _prevEl = document.getElementById('prev-' + id);
    if (_prevEl) { _prevEl.className = 'preview'; _prevEl.innerHTML = ''; }
    const _btnEl = document.getElementById('sbtn-' + id);
    if (_btnEl) { _btnEl.disabled = true; _btnEl.className = 'sc-save'; }
    const _taEl = document.getElementById('ta-' + id);
    if (_taEl) _taEl.classList.remove('ta-has-items');
    ai._parsed = { title: '', summary: '', files: '', tgItems: [], isCheckpoint: false, nextStep: '', ckptProyecto: '' };
    return;
  }

  const btn = document.getElementById('sbtn-' + id);
  const prev = document.getElementById('prev-' + id);
  if (text.trim()) {
    // R-202605-133: en formato JSON puro no existe ---FIN-CHECKPOINT--- ni ---ITEMS---
    const _isJsonFmt = !!(ckpt && ckpt._isJsonFormat);
    const hasFin = _isJsonFmt ? true : text.includes('---FIN-CHECKPOINT---');
    // T-202605-435: CHECKPOINT de transición — si campo WIP: presente y Resumen: ausente,
    // inferir summary como 'WIP' para no bloquear la validación.
    const hasWip = /^\s*WIP\s*:/mi.test(text);
    const effectiveSummary = summary || (hasWip ? 'WIP' : '');
    const checks = [
      { test: !isCheckpoint,      msg: 'Falta el bloque de apertura <code>---CHECKPOINT---</code> o el bloque <code>```json</code>.' },
      { test: !title,             msg: 'Falta el campo <code>T\xEDtulo:</code> / <code>title</code> dentro del bloque.' },
      { test: !effectiveSummary,  msg: 'Falta el campo <code>Resumen:</code> / <code>summary</code> dentro del bloque.' },
      { test: !hasFin,            msg: 'Falta el cierre <code>---FIN-CHECKPOINT---</code>.' },
    ];
    const failed = checks.find(c => c.test);
    if (failed) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">\u26A0 Formato inv\xE1lido \u2014 ${failed.msg}</div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }

    // R-202604-038 / R-202605-133: validar resultado del parser JSON de ---ITEMS--- o ```json
    // AC-2: JSON inválido → error bloqueante antes de procesar cualquier otra cosa
    const _itemsJsonErr = window[`_itemsJsonError_${id}`];
    if (_itemsJsonErr) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">&#9940; Bloque de ítems inválido — ${esc(_itemsJsonErr)}.<br><span class="paste-hint">Corrige el JSON antes de procesar. El bloque debe ser un array de objetos con al menos <code>type</code>, <code>code</code> y <code>status</code>.</span></div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }
    // AC-3: no hay bloque ---ITEMS--- → aviso no bloqueante (solo en formato legacy)
    const _hasItemsBlock = _isJsonFmt ? true : text.includes('---ITEMS---');
    const _noItemsWarnKey = `_noItemsWarnSeen_${id}`;
    if (isCheckpoint && !_hasItemsBlock && !window[_noItemsWarnKey]) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error" class="paste-error paste-warn">⚠ No se detectaron ítems estructurados — falta el bloque <code>---ITEMS---</code>.<br><span class="paste-hint">El CHECKPOINT se guardará sin ítems. Si tienes ítems P/T/R/B, agrégalos en formato JSON dentro del bloque.</span><br><button class="btn-ghost" class="paste-inline-btn" onclick="window['${_noItemsWarnKey}']=true;parsePaste('${id}')">Continuar sin ítems</button></div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }
    if (window[_noItemsWarnKey]) delete window[_noItemsWarnKey];

    // T-202604-350: CONTEXT-SECTION eliminado del modelo — parser no lo busca ni procesa.
    // T-202604-351: CHECKPOINTs históricos con CONTEXT-SECTION pasan en silencio — degradación silenciosa.

    // Base Rules V2.0.1 §11: campo Rol: obligatorio — aviso no bloqueante si ausente
    // No retroactivo: CHECKPOINTs históricos sin Rol: pasan con aviso
    const _hasRolField = /^\s*Rol\s*:/m.test(text);
    const _rolWarnKey  = `_rolFieldWarnSeen_${id}`;
    if (isCheckpoint && !_hasRolField && !window[_rolWarnKey]) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error" class="paste-error paste-warn">⚠ Falta el campo <code>Rol:</code> en el CHECKPOINT.<br><span class="paste-hint">Formato esperado: <code>Rol: FS · Mike</code>. El paste funcionará igual sin este campo.</span><br><button class="btn-ghost" class="paste-inline-btn" onclick="window['${_rolWarnKey}']=true;parsePaste('${id}')">Procesar de todas formas</button></div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      return;
    }
    if (window[_rolWarnKey]) delete window[_rolWarnKey];

    // T-202605-436: ítems done sin AC — aviso no bloqueante
    // AC-1: solo ítems con status done y ac vacío o ausente
    // AC-2: aviso lista los códigos afectados — no genérico
    // AC-3: ítems pendiente o descartado sin AC no generan aviso
    const _doneWarnKey = `_doneNoAcWarnSeen_${id}`;
    if (isCheckpoint && !window[_doneWarnKey]) {
      const _doneNoAc = tgItems.filter(it => it.status === 'done' && (!it.ac || it.ac.length === 0));
      if (_doneNoAc.length > 0) {
        const _codes = _doneNoAc.map(it => `<code>${esc(it.code)}</code>`).join(', ');
        prev.className = 'preview show';
        prev.innerHTML = `<div class="paste-error paste-warn">⚠ ${_doneNoAc.length} ítem${_doneNoAc.length !== 1 ? 's' : ''} marcado${_doneNoAc.length !== 1 ? 's' : ''} como done sin criterios de aceptación: ${_codes}.<br><span class="paste-hint">Un ítem done sin AC no es verificable. Agrega AC antes de marcar como done, o continúa si es intencional.</span><br><button class="btn-ghost paste-inline-btn" onclick="window['${_doneWarnKey}']=true;parsePaste('${id}')">Continuar de todas formas</button></div>`;
        if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
        return;
      }
    }
    if (window[_doneWarnKey]) delete window[_doneWarnKey];

    // R-202604-037: validar Proyecto: contra tabla de strings canónicos
    // AC-1: tabla interna CANONICAL_PROJECTS editable al top del archivo
    // AC-2: valor no canónico → error bloqueante — muestra valor recibido + lista de válidos
    // AC-4: vacío → aviso no bloqueante (comportamiento actual preservado)
    // AC-5: validación case-sensitive
    const _proyectoRaw = isCheckpoint ? (ckpt ? (ckpt.proyecto || '').trim() : '') : '';
    if (isCheckpoint && _proyectoRaw && !CANONICAL_PROJECTS.includes(_proyectoRaw)) {
      const _validList = CANONICAL_PROJECTS.map(p => `<code>${esc(p)}</code>`).join(' · ');
      // B-202605-078: suprimir toast si el preview inline ya muestra este mismo error
      const _previewAlreadyShowing = prev.classList.contains('show') && prev.innerHTML.includes('paste-error');
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">⛔ CHECKPOINT inválido — <code>Proyecto:</code> contiene un valor no reconocido: <strong>${esc(_proyectoRaw)}</strong>.<br><span class="paste-hint">Valores válidos (case-sensitive): ${_validList}. Corrige el campo <code>Proyecto:</code> antes de procesar.</span></div>`;
      if (btn) { btn.disabled = true; btn.className = 'sc-save'; }
      if (!_previewAlreadyShowing) showToast('error', `⛔ Proyecto no reconocido: "${esc(_proyectoRaw)}" — corrige el campo`);
      return;
    }

    // G-04: parse exitoso → silencio. El preview renderizado es la confirmación.
    // Toast solo en error (ver bloque de validaciones previo).
  }

  if (btn) { btn.disabled = false; btn.className = title ? 'sc-save ready' : 'sc-save'; }

  // T-409: atenuar textarea cuando hay ítems detectados en fase CONFIRMAR
  const _ta409 = document.getElementById('ta-' + id);
  if (_ta409) {
    if (tgItems.length > 0) {
      _ta409.classList.add('ta-has-items');
    } else {
      _ta409.classList.remove('ta-has-items');
    }
  }

  if (title || summary) {
    // P-202604-115: pill de proyecto del CHECKPOINT con indicador de coincidencia
    const _ckptProj = ckpt ? (ckpt.proyecto || '') : '';
    const _cardProjEl = document.getElementById('sess-proj-' + id);
    const _cardProjId = _cardProjEl ? _cardProjEl.value : '';
    const _cardProj = _cardProjId ? (state.projects || []).find(p => p.id === _cardProjId) : null;
    const _cardProjName = _cardProj ? _cardProj.name : '';
    let _projPillHTML = '';
    if (isCheckpoint) {
      if (_ckptProj) {
        const _match = _cardProjName && _cardProjName.trim() === _ckptProj.trim();
        const _pillColor = _match ? 'var(--green)' : 'var(--accent)';
        const _pillBg = _match ? 'rgba(46,204,120,0.12)' : 'rgba(248,113,50,0.12)';
        const _pillBorder = _match ? 'rgba(46,204,120,0.3)' : 'rgba(248,113,50,0.3)';
        const _icon = _match ? '✓' : '⚠';
        _projPillHTML = `<div class="ckpt-proj-pill" style="--pill-bg:${_pillBg};--pill-color:${_pillColor};--pill-border:${_pillBorder};">${_icon} Proyecto: ${esc(_ckptProj)}</div>`;
      } else {
        _projPillHTML = `<div class="ckpt-pill ckpt-pill--warn">⚠ Sin campo Proyecto</div>`;
      }
    }
    prev.className = 'preview show';
    prev.innerHTML = `
      <div class="ckpt-badges-row">
        <div class="ckpt-pill ckpt-pill--ok">\u2713 CHECKPOINT</div>
        ${_projPillHTML}
      </div>
      ${title ? `<div class="preview-title">${esc(title)}</div><hr class="preview-divider">` : ''}
      ${summary ? `<div class="preview-summary">${esc(summary)}</div>` : ''}
      ${files ? `<div class="preview-files">\U0001F4C4 ${esc(files)}</div>` : ''}
      ${nextStep ? `<div class="preview-next-step"><span class="preview-next-label">Próximo paso</span> ${esc(nextStep)}</div>` : ''}
      ${(() => {
        if (!bloqueantesRaw) return '';
        const _bVal = bloqueantesRaw.trim();
        if (_bVal.toLowerCase() === 'n/a') {
          return `<div class="preview-bloqueantes preview-bloqueantes--ok"><span class="preview-next-label">Bloqueantes</span> <span class="preview-bloqueantes-val">n/a</span></div>`;
        }
        // Detectar referencia a ítem: ID real (P/T/R/B-YYYYMM-NNN) o [tmp:slug] o [pendiente-ID]
        const _itemRefRe = /([PTRB]-\d{6}-\d{3}(?:-[A-Z]+)?|\[tmp:[a-z0-9_-]+\]|\[pendiente-ID\])/gi;
        const _refs = _bVal.match(_itemRefRe);
        if (_refs) {
          const _linked = _bVal.replace(_itemRefRe, m => `<span class="preview-bloqueantes-ref">${esc(m)}</span>`);
          return `<div class="preview-bloqueantes preview-bloqueantes--ref"><span class="preview-next-label">Bloqueantes</span> <span class="preview-bloqueantes-val">${_linked}</span></div>`;
        }
        // Texto libre — aviso de formato esperado
        return `<div class="preview-bloqueantes preview-bloqueantes--warn"><span class="preview-next-label">Bloqueantes</span> <span class="preview-bloqueantes-val">${esc(_bVal)}</span><span class="preview-bloqueantes-hint"> · esperado: ID de ítem o n/a</span></div>`;
      })()}
      ${buildTGPreview(tgItems, _discrepancy)}`;
    // T-409: scroll preview-tg into view when items detected
    if (tgItems.length > 0) {
      requestAnimationFrame(() => {
        const _tgEl = prev.querySelector('.preview-tg');
        if (_tgEl) _tgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  } else {
    prev.className = 'preview';
  }
}
// B-202605-NNN: flag para que oninput no corra antes de que el browser
// inserte el texto del paste. onpaste lo activa; se limpia tras el setTimeout.
const _pasteInFlight = {};

function handlePaste(id) {
  // Llamado desde onpaste — marcar que hay un paste en vuelo y diferir
  // B-202605-NNN: 150ms en lugar de 60ms — algunos browsers (Chrome) insertan
  // el texto del clipboard después de los 60ms originales, dejando ta.value vacío
  // cuando parsePaste corre y provocando reset completo (preview en blanco).
  // Si ta.value todavía está vacío al ejecutar, se reintenta una vez a 300ms.
  _pasteInFlight[id] = true;
  const _doParse = () => {
    delete _pasteInFlight[id];
    const ta = document.getElementById('ta-' + id);
    if (ta && !ta.value.trim()) {
      // Texto aún no insertado — reintentar una vez más
      _pasteInFlight[id] = true;
      setTimeout(() => {
        delete _pasteInFlight[id];
        parsePaste(id);
        const ai = getAI(id);
        if (ai && ai._parsed && ai._parsed.title) {
          const horaEl = document.getElementById('hora-' + id);
          if (horaEl) horaEl.focus();
        }
        if (ta && (ta.value.includes('---PLAN---') || ta.value.includes('---EXECUTION-PLAN---'))) _tryIngestPlan(ta.value);
      }, 150);
      return;
    }
    parsePaste(id);
    const ai = getAI(id);
    if (ai && ai._parsed && ai._parsed.title) {
      const horaEl = document.getElementById('hora-' + id);
      if (horaEl) horaEl.focus();
    }
    // R-202604-085 + R-B: detectar ---PLAN--- o ---EXECUTION-PLAN--- embebido en el CHECKPOINT pegado
    if (ta && (ta.value.includes('---PLAN---') || ta.value.includes('---EXECUTION-PLAN---'))) _tryIngestPlan(ta.value);
  };
  setTimeout(_doParse, 150);
}

function handleInput(id) {
  // Llamado desde oninput — ignorar si hay un paste en vuelo (el setTimeout lo cubrirá)
  if (_pasteInFlight[id]) return;
  parsePaste(id);
}

// R-202604-085 + R-B: ingesta de ---PLAN--- o ---EXECUTION-PLAN--- desde cualquier texto
function _tryIngestPlan(text) {
  const hasLegacy = text && text.includes('---PLAN---');
  const hasNew    = text && text.includes('---EXECUTION-PLAN---');
  if (!hasLegacy && !hasNew) return false;
  if (typeof parsePlanBlock !== 'function' || typeof savePlan !== 'function') return false;
  const incoming = parsePlanBlock(text);
  if (!incoming || !incoming.length) return false;
  const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
  if (!proj) return false;

  // R-202605-153: merge por scope — preservar sprints del otro scope en localStorage
  // Si el CHECKPOINT trae solo scope:sesion → conservar los scope:sprint existentes, y viceversa.
  // Planes legacy (---PLAN--- sin scope) se tratan como scope:sprint.
  const incomingHasSesion = incoming.some(sp => sp.scope === 'sesion');
  const incomingHasSprint = incoming.some(sp => sp.scope !== 'sesion');

  let merged = incoming;
  if (typeof loadPlan === 'function') {
    const existing = loadPlan(proj.id) || [];
    if (incomingHasSesion && !incomingHasSprint) {
      // Solo scope:sesion entrante — conservar scope:sprint existente
      const keepSprint = existing.filter(sp => sp.scope !== 'sesion');
      merged = [...incoming, ...keepSprint];
    } else if (incomingHasSprint && !incomingHasSesion) {
      // Solo scope:sprint entrante — conservar scope:sesion existente
      const keepSesion = existing.filter(sp => sp.scope === 'sesion');
      merged = [...keepSesion, ...incoming];
    }
    // Si trae ambos scopes → reemplazar completo (el CHECKPOINT es fuente de verdad total)
  }

  savePlan(proj.id, merged);
  const hasSesion = merged.some(sp => sp.scope === 'sesion');
  const label = hasNew
    ? (incomingHasSesion && !incomingHasSprint
        ? '✓ Execution Plan importado — sesión activa actualizada'
        : incomingHasSprint && !incomingHasSesion
          ? '✓ Execution Plan importado — plan de sprint actualizado'
          : '✓ Execution Plan importado — plan completo actualizado')
    : '✓ Plan importado — ' + incoming.length + ' sprint(s)';
  if (typeof showToast === 'function') showToast('success', label);
  if (typeof renderPlan === 'function') renderPlan();
  return true;
}

// B-202604-138: flujo de CHECKPOINT standalone — merge de ítems sin sesión de IA
// AC-1: pasa por showMergeDiffPanel igual que el flujo de sesión
// AC-2: avances de status muestran el panel antes de aplicarse
// AC-3: retrocesos y descartes siguen requiriendo confirmación en showCheckpointPanel
// AC-4: si no hay tgItems el panel no aparece

let _standaloneLastParsed = null;

function parsePasteStandalone() {
  const ta  = document.getElementById('standalone-ckpt-ta');
  const prev = document.getElementById('standalone-ckpt-prev');
  const btn  = document.getElementById('standalone-ckpt-btn');
  if (!ta || !prev || !btn) return;

  const text = ta.value.trim();
  _standaloneLastParsed = null;

  if (!text) {
    prev.innerHTML = '';
    btn.disabled = true;
    return;
  }

  // Reutilizar parseCheckpoint para extraer campos y validar estructura
  // R-202605-133: parseCheckpoint detecta JSON puro o Markdown legacy automáticamente
  // T-202605-524: EXECUTION-PLAN standalone — sin CHECKPOINT envolvente
  // Si el texto contiene solo un bloque ---EXECUTION-PLAN--- sin CHECKPOINT, procesarlo directamente
  const _hasEP  = text.includes('---EXECUTION-PLAN---');
  const _hasCKP = text.includes('---CHECKPOINT---') || /```json\s*\{/.test(text);
  if (_hasEP && !_hasCKP) {
    const _epResult = (typeof _tryIngestPlan === 'function') ? _tryIngestPlan(text) : false;
    if (_epResult) {
      prev.innerHTML = '<div class="ckpt-pill ckpt-pill--ok ckpt-pill--mb">✓ Execution Plan aplicado</div>';
      btn.disabled = true; // sin ítems de backlog — nada más que confirmar
    } else {
      // _tryIngestPlan falló — proyecto no activo o bloque inválido
      const _activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
      if (!_activeProj) {
        prev.innerHTML = '<div class="paste-error">⚠ Selecciona un proyecto activo antes de aplicar el Execution Plan.</div>';
      } else {
        prev.innerHTML = '<div class="paste-error">⚠ Bloque <code>---EXECUTION-PLAN---</code> inválido o sin sprint activo.<br><span class="paste-hint">Verifica que el bloque incluya <code>sprint:</code> o que haya un sprint activo en el proyecto.</span></div>';
      }
      btn.disabled = true;
    }
    return;
  }

  const ckpt = parseCheckpoint(text);

  // Validación: bloque de apertura (cualquier formato)
  if (!ckpt || !ckpt.isCheckpoint || !ckpt.titulo) {
    prev.innerHTML = '<div class="paste-error">⚠ Falta el bloque <code>---CHECKPOINT---</code> o el bloque <code>```json</code>, o falta el campo <code>Título:</code> / <code>title</code>.</div>';
    btn.disabled = true;
    return;
  }

  // R-202605-133: error de parseo JSON — bloqueante
  if (ckpt._jsonParseError) {
    prev.innerHTML = `<div class="paste-error">&#9940; Bloque <code>\`\`\`json</code> inválido — ${esc(ckpt._jsonParseError)}.<br><span class="paste-hint">Corrige el JSON antes de aplicar.</span></div>`;
    btn.disabled = true;
    return;
  }

  // Validación: cierre (solo formato legacy)
  const _isJsonFmt = !!ckpt._isJsonFormat;
  if (!_isJsonFmt && !text.includes('---FIN-CHECKPOINT---')) {
    prev.innerHTML = '<div class="paste-error">⚠ Falta el cierre <code>---FIN-CHECKPOINT---</code>.</div>';
    btn.disabled = true;
    return;
  }

  // R-202605-133: en formato JSON puro, ítems ya están en ckpt._rawItems
  let parsedJSON = null;
  let jsonError  = null;

  if (_isJsonFmt) {
    parsedJSON = Array.isArray(ckpt._rawItems) ? ckpt._rawItems : [];
  } else {
    // Parsear bloque ---ITEMS---
    const _itemsBlockMatch = text.match(/---ITEMS---\s*([\s\S]*?)\s*---ITEMS-END---/);
    if (!_itemsBlockMatch) {
      prev.innerHTML = '<div class="paste-error" class="paste-error paste-warn">⚠ No se detectó bloque <code>---ITEMS---</code>.<br><span class="paste-hint">El bloque es obligatorio en el flujo standalone.</span></div>';
      btn.disabled = true;
      return;
    }
    try {
      const raw = _itemsBlockMatch[1].replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      parsedJSON = JSON.parse(raw);
    } catch (e) {
      jsonError = e.message || 'JSON inválido';
    }
  }
  if (jsonError || !Array.isArray(parsedJSON)) {
    prev.innerHTML = `<div class="paste-error">⛔ Bloque <code>---ITEMS---</code> inválido — ${esc(jsonError || 'no es un array JSON válido')}.<br><span class="paste-hint">Corrige el JSON antes de aplicar.</span></div>`;
    btn.disabled = true;
    return;
  }

  const _validTypes    = ['P', 'T', 'R', 'B'];
  const _validStatuses = ['done', 'pendiente', 'descartado'];
  const tgItems = [];
  const patchItems = []; // R-202605-062: patches separados de ítems normales
  let itemError = null;

  for (let i = 0; i < parsedJSON.length; i++) {
    const it = parsedJSON[i];
    // R-202605-062: patch — instrucción de operación, no tipo de ítem
    if (it.type === 'patch') {
      if (!it.code || (typeof _isPlaceholderCode === 'function' && _isPlaceholderCode(it.code))) {
        if (typeof _blogLog === 'function') _blogLog('patch-ignorado', it.code || '', 'Patch ignorado: código placeholder no patcheable. code: ' + (it.code || '(vacío)'), 'backlog');
      } else {
        patchItems.push(it);
      }
      continue;
    }
    if (!it.type || !it.code || !it.status) {
      itemError = `Ítem [${i}]: faltan campos obligatorios (type, code, status).`;
      break;
    }
    if (!_validTypes.includes(it.type)) {
      itemError = `Ítem [${i}]: type inválido "${it.type}". Válidos: P · T · R · B`;
      break;
    }
    if (!_validStatuses.includes(it.status)) {
      itemError = `Ítem [${i}]: status inválido "${it.status}". Válidos: done · pendiente · descartado`;
      break;
    }
    tgItems.push({
      type:          it.type,
      code:          it.code,
      title:         it.title  || it.desc   || '',
      desc:          it.title  || it.desc   || '',
      status:        (typeof normStatus === 'function') ? normStatus(it.status) : it.status,
      _noStatus:     false,
      effort:        it.effort != null ? (parseInt(it.effort) || null) : null,
      area:          it.area   || '',
      sprint:        it.sprint,
      ac:            Array.isArray(it.ac) ? it.ac : [],
      role:          it.role   || (ckpt.rol || ''),
      discardReason: it.reason || '',
      discardRef:    it.ref    || '',
      blockedBy:     Array.isArray(it.blockedBy) ? it.blockedBy : []
    });
    // R-202605-046: normalizar sprint a campo ausente si es centinela o sprint cerrado
    _normalizeSprint(tgItems[tgItems.length - 1]);
  }

  if (itemError) {
    prev.innerHTML = `<div class="paste-error">⛔ ${esc(itemError)}</div>`;
    btn.disabled = true;
    return;
  }

  // R-202604-075: extraer campo contract de cada ítem y aplicar a Contratos de Módulo
  if (typeof _ctrMergeFromItem === 'function') {
    parsedJSON.forEach(it => {
      if (it.contract) _ctrMergeFromItem(it.code || '[pendiente-ID]', it.contract);
    });
  }

  // R-202604-085 + R-B: detectar ---PLAN--- o ---EXECUTION-PLAN--- embebido en el CHECKPOINT standalone
  if (text.includes('---PLAN---') || text.includes('---EXECUTION-PLAN---')) _tryIngestPlan(text);

  // Éxito — guardar parsed y habilitar botón
  _standaloneLastParsed = { ckpt, tgItems, patchItems, raw: text };

  const _assignedIds = (typeof _assignPendingIds === 'function') ? _assignPendingIds(tgItems) : 0;
  const previewHtml = (typeof buildTGPreview === 'function') ? buildTGPreview(tgItems, null) : '';
  prev.innerHTML = `
    <div class="ckpt-pill ckpt-pill--ok ckpt-pill--mb">✓ CHECKPOINT · ${tgItems.length} ítem${tgItems.length !== 1 ? 's' : ''}</div>
    <div class="sa-ckpt-desc">${esc(ckpt.titulo)}</div>
    ${previewHtml}`;
  btn.disabled = tgItems.length === 0 && !text.includes('---PLAN---') && !text.includes('---EXECUTION-PLAN---');
}

function saveStandaloneCheckpoint() {
  if (!_standaloneLastParsed) return;
  const { tgItems, patchItems, ckpt, raw } = _standaloneLastParsed;

  // AC-4: si no hay ítems ni patches, no hacer nada
  if (!tgItems.length && !(patchItems && patchItems.length)) {
    if (typeof showToast === 'function') showToast('warning', '⚠ Sin ítems para aplicar');
    return;
  }

  // Proyecto activo
  const activeProj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
  if (!activeProj) {
    if (typeof showToast === 'function') showToast('warning', '⚠ Selecciona un proyecto antes de aplicar');
    return;
  }

  // sessId sintético — no crea sesión real, solo referencia para mergeBacklogFromTG
  const syntheticSessId = 'standalone-' + Date.now();

  const _doApply = () => {
    const mergeResult = (typeof _mergeBacklogWithProject === 'function')
      ? _mergeBacklogWithProject(tgItems, syntheticSessId, activeProj.id)
      : { created:[], updated:[], ignored:[], advanced:[], retroceso:[], discarded:[] };

    // R-202605-062: aplicar patches después del merge de ítems normales
    if (patchItems && patchItems.length && typeof applyPatchesFromTG === 'function') {
      const patchResult = applyPatchesFromTG(patchItems, syntheticSessId);
      // Incorporar patches al mergeResult para que el panel diff los muestre (AC-10)
      if (patchResult.patched && patchResult.patched.length) {
        mergeResult.updated = [...(mergeResult.updated || []), ...patchResult.patched];
      }
    }

    // Merge CONTEXT-SECTION / MAP-SECTION si hay
    if (typeof extractContextSections === 'function') {
      const ctxSections = extractContextSections(raw);
      if (ctxSections.length && typeof mergeContextSections === 'function') {
        mergeContextSections(ctxSections, activeProj.id);
      }
    }
    if (typeof extractHtmlMapSections === 'function') {
      const mapSections = extractHtmlMapSections(raw);
      if (mapSections.length && typeof mergeHtmlMapSections === 'function') {
        mergeHtmlMapSections(mapSections, activeProj.id);
      }
    }
    // R-202604-076 + R-B: plan block — PLAN legacy y EXECUTION-PLAN nuevo
    // B-202605-XXX: usar _tryIngestPlan en lugar de savePlan directo — preserva scope:sprint al guardar scope:sesion
    if (raw.includes('---PLAN---') || raw.includes('---EXECUTION-PLAN---')) _tryIngestPlan(raw);

    closeStandaloneCheckpoint();

    if (typeof renderBacklogList === 'function') renderBacklogList();
    if (typeof renderStats === 'function') renderStats();

    // Mostrar resultado en panel CHECKPOINT igual que el flujo sesión
    const hasMergeData = mergeResult.created.length || mergeResult.advanced.length ||
      mergeResult.retroceso.length || mergeResult.discarded.length ||
      mergeResult.updated.length || mergeResult.ignored.length;
    // B-202604-164: el panel diff (showCheckpointPanel) ya comunica el resultado —
    // el toast adicional causaba duplicado. Si no hay merge data → toast como fallback.
    if (hasMergeData && typeof showCheckpointPanel === 'function') {
      showCheckpointPanel(mergeResult);
    } else if (typeof showToast === 'function') {
      const _total = tgItems.length + (patchItems ? patchItems.length : 0);
      showToast('success', `✓ ${_total} ítem${_total !== 1 ? 's' : ''} aplicado${_total !== 1 ? 's' : ''} al backlog`);
    }
    _standaloneLastParsed = null;
  };

  // AC-1+2: pasar por showMergeDiffPanel — muestra panel de confirmación antes de aplicar
  if (typeof showMergeDiffPanel === 'function') {
    closeStandaloneCheckpoint();
    showMergeDiffPanel(tgItems, syntheticSessId, activeProj.id, _doApply);
  } else {
    _doApply();
  }
}




// R-202604-076 + R-B: parser de bloque ---PLAN--- / ---EXECUTION-PLAN---
// Backward compatible: ---PLAN--- se trata como scope 'sprint' implícito
// Nuevo: ---EXECUTION-PLAN--- agrega campo scope por sección (sprint | sesion)
//
// Formato ---EXECUTION-PLAN--- (nuevo):
// ---EXECUTION-PLAN---
// scope: sprint
// sprint: S-24
// sesiones:
//   - id: slug-unico
//     rol: FS · Rune
//     items: [R-202605-XXX]
//     archivos: [ai-tracker-session.js]
//     depende_de: []
// scope: sesion
// sesiones:
//   - id: sesion-activa
//     rol: FS · Rune
//     items: [R-202605-XXX]
//     archivos: []
//     depende_de: []
// ---EXECUTION-PLAN-END---
//
// Formato ---PLAN--- legacy (backward compat — scope 'sprint' implícito):
// ---PLAN---
// sprint: S-XX · Nombre
// sesiones:
//   - id: slug
//     rol: FS · Rune
//     items: [R-202604-054]
//     archivos: []
//     depende_de: []
// ---PLAN-END---
function parsePlanBlock(text) {
  // Detectar formato nuevo o legacy
  const isNew    = /---EXECUTION-PLAN---/.test(text);
  const startTag = isNew ? '---EXECUTION-PLAN---' : '---PLAN---';
  const endTag   = isNew ? '---EXECUTION-PLAN-END---' : '---PLAN-END---';

  const reBody = new RegExp(
    startTag.replace(/[-]/g, '\\-') + '\\s*([\\s\\S]*?)\\s*' + endTag.replace(/[-]/g, '\\-')
  );
  const match = text.match(reBody);
  if (!match) return null;

  const body  = match[1];
  const lines = body.split('\n');

  const sprints     = [];
  let currentSprint = null;
  let currentSess   = null;
  let inSesiones    = false;
  let pendingScope  = 'sprint'; // scope del próximo sprint — default backward compat

  const _flushSess = () => {
    if (currentSess && currentSprint) currentSprint.sessions.push(currentSess);
    currentSess = null;
  };
  const _flushSprint = () => {
    _flushSess();
    if (currentSprint) sprints.push(currentSprint);
    currentSprint = null;
    inSesiones    = false;
  };

  const _parseList = str => {
    const s = str.trim();
    if (!s || s === '[]') return [];
    return s.replace(/^\[|\]$/g, '').split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
  };

  for (const rawLine of lines) {
    const line    = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) continue;

    // scope: sprint | sesion — solo en formato nuevo
    if (isNew) {
      const scopeM = trimmed.match(/^scope\s*:\s*(sprint|sesion)$/i);
      if (scopeM) {
        if (currentSprint) _flushSprint();
        pendingScope = scopeM[1].toLowerCase();
        continue;
      }
    }

    // sprint: S-XX  o  sin-sprint:
    const sprintM    = trimmed.match(/^sprint\s*:\s*(.+)$/i);
    const sinSprintM = trimmed.match(/^sin-sprint\s*:$/i);
    if (sprintM || sinSprintM) {
      _flushSprint();
      currentSprint = {
        id:       sprintM ? sprintM[1].trim() : null,
        scope:    isNew ? pendingScope : 'sprint',
        sessions: []
      };
      inSesiones = false;
      continue;
    }

    // sesiones: — puede aparecer sin sprint declarado (scope sesion directo)
    if (/^sesiones\s*:$/i.test(trimmed)) {
      if (!currentSprint) {
        _flushSprint();
        currentSprint = { id: null, scope: isNew ? pendingScope : 'sprint', sessions: [] };
      }
      inSesiones = true;
      continue;
    }

    if (!inSesiones || !currentSprint) continue;

    // Nueva sesión
    if (/^-\s+id\s*:/.test(trimmed)) {
      _flushSess();
      const idM = trimmed.match(/^-\s+id\s*:\s*(.+)$/i);
      currentSess = { id: idM ? idM[1].trim() : '', rol: '', items: [], archivos: [], depende_de: [] };
      continue;
    }

    if (!currentSess) continue;

    const rolM      = trimmed.match(/^rol\s*:\s*(.+)$/i);
    const itemsM    = trimmed.match(/^items?\s*:\s*(.*)$/i);
    const archivosM = trimmed.match(/^archivos?\s*:\s*(.*)$/i);
    const dependeM  = trimmed.match(/^depende_de\s*:\s*(.*)$/i);

    if (rolM)      { currentSess.rol        = rolM[1].trim();           continue; }
    if (itemsM)    { currentSess.items      = _parseList(itemsM[1]);    continue; }
    if (archivosM) { currentSess.archivos   = _parseList(archivosM[1]); continue; }
    if (dependeM)  { currentSess.depende_de = _parseList(dependeM[1]);  continue; }
  }
  _flushSprint();

  return sprints.length ? sprints : null;
}

// T-202605-430: componente reutilizable de hora — aplica en guardar sesión, sesiones rápidas y correctHora
