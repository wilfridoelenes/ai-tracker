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
  p1.className = 'phase-bar-step' + (phase === 1 ? ' active' : phase > 1 ? ' done' : '');
  p2.className = 'phase-bar-step' + (phase === 2 ? ' active' : phase > 2 ? ' done' : '');
  p3.className = 'phase-bar-step' + (phase === 3 ? ' saved' : '');
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
          desc:          _it.title  || _it.desc  || '',
          status:        normStatus(_it.status),
          _noStatus:     false,
          effort:        _it.effort != null ? (parseInt(_it.effort) || null) : null,
          area:          _it.area   || '',
          sprint:        _it.sprint || '',
          ac:            Array.isArray(_it.ac) ? _it.ac : [],
          role:          _it.role   || ckptHeaderRole,
          discardReason: _it.reason || '',
          discardRef:    _it.ref    || '',
          blockedBy:     Array.isArray(_it.blockedBy) ? _it.blockedBy : []
        });
      }
      if (_itemError) {
        window[`_itemsJsonError_${id}`] = _itemError;
        tgItems = [];
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
            desc:          _it.title  || _it.desc  || '',
            status:        normStatus(_it.status),
            _noStatus:     false,
            effort:        _it.effort != null ? (parseInt(_it.effort) || null) : null,
            area:          _it.area   || '',
            sprint:        _it.sprint || '',
            ac:            Array.isArray(_it.ac) ? _it.ac : [],
            role:          _it.role   || ckptHeaderRole,
            discardReason: _it.reason || '',
            discardRef:    _it.ref    || '',
            blockedBy:     Array.isArray(_it.blockedBy) ? _it.blockedBy : []
          });
        }
        if (_itemError) {
          window[`_itemsJsonError_${id}`] = _itemError;
          tgItems = []; // reset — no procesar parcialmente
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
  ai._parsed = { title, summary, files, tgItems, isCheckpoint, nextStep, ckptProyecto: ckpt ? (ckpt.proyecto || '') : '' };

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
    if (_btnEl) { _btnEl.disabled = true; _btnEl.className = 'save-btn'; }
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
      if (btn) { btn.disabled = true; btn.className = 'save-btn'; }
      return;
    }

    // R-202604-038 / R-202605-133: validar resultado del parser JSON de ---ITEMS--- o ```json
    // AC-2: JSON inválido → error bloqueante antes de procesar cualquier otra cosa
    const _itemsJsonErr = window[`_itemsJsonError_${id}`];
    if (_itemsJsonErr) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error">&#9940; Bloque de ítems inválido — ${esc(_itemsJsonErr)}.<br><span class="paste-hint">Corrige el JSON antes de procesar. El bloque debe ser un array de objetos con al menos <code>type</code>, <code>code</code> y <code>status</code>.</span></div>`;
      if (btn) { btn.disabled = true; btn.className = 'save-btn'; }
      return;
    }
    // AC-3: no hay bloque ---ITEMS--- → aviso no bloqueante (solo en formato legacy)
    const _hasItemsBlock = _isJsonFmt ? true : text.includes('---ITEMS---');
    const _noItemsWarnKey = `_noItemsWarnSeen_${id}`;
    if (isCheckpoint && !_hasItemsBlock && !window[_noItemsWarnKey]) {
      prev.className = 'preview show';
      prev.innerHTML = `<div class="paste-error" class="paste-error paste-warn">⚠ No se detectaron ítems estructurados — falta el bloque <code>---ITEMS---</code>.<br><span class="paste-hint">El CHECKPOINT se guardará sin ítems. Si tienes ítems P/T/R/B, agrégalos en formato JSON dentro del bloque.</span><br><button class="btn-ghost" class="paste-inline-btn" onclick="window['${_noItemsWarnKey}']=true;parsePaste('${id}')">Continuar sin ítems</button></div>`;
      if (btn) { btn.disabled = true; btn.className = 'save-btn'; }
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
      if (btn) { btn.disabled = true; btn.className = 'save-btn'; }
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
        if (btn) { btn.disabled = true; btn.className = 'save-btn'; }
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
      if (btn) { btn.disabled = true; btn.className = 'save-btn'; }
      if (!_previewAlreadyShowing) showToast('error', `⛔ Proyecto no reconocido: "${esc(_proyectoRaw)}" — corrige el campo`);
      return;
    }

    const itemCount = tgItems.length;
    showToast('success', itemCount
      ? `\u2713 CHECKPOINT v\xE1lido \u2014 ${itemCount} \xEDtem${itemCount !== 1 ? 's' : ''} detectado${itemCount !== 1 ? 's' : ''}`
      : '\u2713 CHECKPOINT v\xE1lido \u2014 listo para guardar', 'success');
  }

  if (btn) { btn.disabled = false; btn.className = title ? 'save-btn ready' : 'save-btn'; }

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
  let itemError = null;

  for (let i = 0; i < parsedJSON.length; i++) {
    const it = parsedJSON[i];
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
      desc:          it.title  || it.desc   || '',
      status:        (typeof normStatus === 'function') ? normStatus(it.status) : it.status,
      _noStatus:     false,
      effort:        it.effort != null ? (parseInt(it.effort) || null) : null,
      area:          it.area   || '',
      sprint:        it.sprint || '',
      ac:            Array.isArray(it.ac) ? it.ac : [],
      role:          it.role   || (ckpt.rol || ''),
      discardReason: it.reason || '',
      discardRef:    it.ref    || '',
      blockedBy:     Array.isArray(it.blockedBy) ? it.blockedBy : []
    });
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
  _standaloneLastParsed = { ckpt, tgItems, raw: text };

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
  const { tgItems, ckpt, raw } = _standaloneLastParsed;

  // AC-4: si no hay ítems, no hacer nada
  if (!tgItems.length) {
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
      showToast('success', `✓ ${tgItems.length} ítem${tgItems.length !== 1 ? 's' : ''} aplicado${tgItems.length !== 1 ? 's' : ''} al backlog`);
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
function _horaUpdate(inputEl, dispEl) {
  if (!dispEl) return;
  const raw = inputEl ? inputEl.value.replace(/\D/g, '') : '';
  const result = interpretHora(raw);
  if (result) {
    dispEl.textContent = result.label;
    dispEl.className = 'hora-disp--valid';
    if (inputEl) inputEl.classList.remove('error');
  } else {
    if (raw.length >= 3) {
      dispEl.textContent = 'hora inválida';
      dispEl.className = 'hora-disp--error';
      if (inputEl) inputEl.classList.add('error');
    } else {
      dispEl.textContent = raw.length ? '...' : '—';
      dispEl.className = 'hora-disp--hint';
      if (inputEl) inputEl.classList.remove('error');
    }
  }
}

// T-202605-430: wrapper para campo hora-{id} en card footer (buildCard)
function parseHora(id) {
  _horaUpdate(
    document.getElementById('hora-' + id),
    document.getElementById('hdisp-' + id)
  );
}

function correctHora(id) {
  _horaUpdate(
    document.getElementById('hora-' + id),
    document.getElementById('hdisp-' + id)
  );
}

function interpretHora(raw) {
  if (!raw) return null;
  let h, m;
  if (raw.length === 1) { h = parseInt(raw); m = 0; }
  else if (raw.length === 2) { h = parseInt(raw); m = 0; }
  else if (raw.length === 3) { h = parseInt(raw.slice(0,1)); m = parseInt(raw.slice(1)); }
  else if (raw.length === 4) { h = parseInt(raw.slice(0,2)); m = parseInt(raw.slice(2)); }
  else return null;
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  const hhmm = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  // B-202604-009: epoch absoluto — próxima ocurrencia futura de esta hora
  const _r = new Date(); _r.setHours(h, m, 0, 0);
  if (_r <= new Date()) _r.setDate(_r.getDate() + 1);
  const epoch = _r.getTime();
  return {h, m, hhmm, label: `${h12}:${String(m).padStart(2,'0')} ${period}`, epoch};
}

function fmt12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return `${h12}:${String(m).padStart(2,'0')} ${p}`;
}

// T-202604-028: fecha relativa
// Acepta timestamp numérico (ms) o string de fecha "3 May. 2026".
// Para timestamps < 24h emite "hace X min" / "hace X h" en lugar de "Hoy".
function relDate(dateStr, ts) {
  if (!dateStr && !ts) return '';

  // — Rama 1: valor numérico (timestamp ms directo) —
  const asNum = typeof dateStr === 'number' ? dateStr
    : (typeof dateStr === 'string' && /^\d{10,13}$/.test(dateStr.trim())) ? parseInt(dateStr) : null;
  if (asNum) {
    const diffMs  = Date.now() - asNum;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin  < 2)  return 'ahora';
    if (diffMin  < 60) return `hace ${diffMin} min`;
    if (diffHrs  < 24) return `hace ${diffHrs} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 6)  return `Hace ${diffDays} días`;
    if (diffDays <= 13) return 'Hace 1 semana';
    if (diffDays <= 27) return `Hace ${Math.floor(diffDays/7)} semanas`;
    if (diffDays <= 45) return 'Hace 1 mes';
    return `Hace ${Math.floor(diffDays/30)} meses`;
  }

  // — Rama 2: string de fecha "3 May. 2026" —
  if (!dateStr) return '';
  const m = dateStr.match(/(\d{1,2})\s+(\w+)\.?\s+(\d{4})/);
  if (!m) return '';
  const months = {ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
  const mon = months[m[2].toLowerCase().replace('.','')];
  if (mon === undefined) return '';
  const d = new Date(parseInt(m[3]), mon, parseInt(m[1]));
  const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  const diff = Math.round((now - d) / 86400000);
  if (diff === 0) {
    // Si el caller pasó el timestamp real, usarlo para precisión sub-24h
    if (ts) {
      const diffMs  = Date.now() - ts;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      if (diffMin < 2)  return 'ahora';
      if (diffMin < 60) return `hace ${diffMin} min`;
      return `hace ${diffHrs} h`;
    }
    return 'Hoy';
  }
  if (diff === 1) return 'Ayer';
  if (diff <= 6) return `Hace ${diff} días`;
  if (diff <= 13) return 'Hace 1 semana';
  if (diff <= 27) return `Hace ${Math.floor(diff/7)} semanas`;
  if (diff <= 45) return 'Hace 1 mes';
  return `Hace ${Math.floor(diff/30)} meses`;
}

function horaKey(e, id) {
  if (e.key === 'Enter') { e.preventDefault(); confirmSave(id); }
}

// T-202604-103: paso de confirmación inline antes de guardar
// T-202604-051: confirmSave llama directamente a saveSession — sin paso intermedio
const _confirmTimers = {};

// T-202604-190: ID de sesión quick a completar — si está seteado, saveSession actualiza en lugar de crear
let _pendingCompleteId = null;
// R-202605-095: abre el panel item-viz con banner bloqueante cuando no hay proyecto seleccionado.
// El botón Guardar queda en estado --btn-blocked hasta que el usuario selecciona proyecto en el card.
// No dispara toast — la advertencia vive completamente dentro del panel.
function _showProjRequiredInPanel(id, parsed, horaResult) {
  const overlay = document.getElementById('item-viz-overlay');
  const confirmBtn = document.getElementById('item-viz-confirm-btn');
  const body = document.getElementById('item-viz-body');
  if (!overlay || !confirmBtn || !body) return;

  // Construir lista de proyectos para el banner
  const projects = (typeof state !== 'undefined' && state.projects) ? state.projects : [];
  const projOptions = projects.map(p =>
    `<option value="${esc(p.id)}">${esc(p.name || p.id)}</option>`
  ).join('');
  const hasProjOptions = projects.length > 0;

  // Banner de advertencia — zona superior del body, estado visual diferenciado
  body.innerHTML = `
    <div class="iviz-proj-required" id="iviz-proj-required-banner" role="alert">
      <div class="iviz-proj-required-icon" aria-hidden="true">⚠</div>
      <div class="iviz-proj-required-content">
        <div class="iviz-proj-required-title">Selecciona un proyecto para continuar</div>
        <div class="iviz-proj-required-desc">La sesión no tiene un proyecto asignado. Elige uno para poder guardar.</div>
        ${hasProjOptions ? `
          <select class="iviz-proj-select" id="iviz-proj-select"
            aria-label="Seleccionar proyecto" aria-required="true">
            <option value="">— Elige un proyecto —</option>
            ${projOptions}
          </select>` : `<div class="iviz-proj-empty">No hay proyectos creados. Crea uno primero desde el panel de Proyectos.</div>`}
      </div>
    </div>`;

  // AC-6: botón bloqueado sin disabled nativo — aria-disabled + clase CSS
  // El click handler hace guard explícito. El botón sigue siendo focusable (Tab/Space/Enter).
  const _newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(_newConfirmBtn, confirmBtn);
  _newConfirmBtn.classList.add('item-viz-confirm-btn--blocked');
  _newConfirmBtn.setAttribute('aria-disabled', 'true');
  _newConfirmBtn.setAttribute('title', 'Selecciona un proyecto para habilitar el guardado');

  let _resolvedProj = null;

  // Listener único en el select — actualiza estado del botón
  const _projSelect = document.getElementById('iviz-proj-select');
  if (_projSelect) {
    _projSelect.addEventListener('change', () => {
      const selId = _projSelect.value;
      _resolvedProj = selId ? (projects.find(p => p.id === selId) || null) : null;
      const banner = document.getElementById('iviz-proj-required-banner');
      if (_resolvedProj) {
        _newConfirmBtn.classList.remove('item-viz-confirm-btn--blocked');
        _newConfirmBtn.removeAttribute('aria-disabled');
        _newConfirmBtn.removeAttribute('title');
        if (banner) banner.classList.add('iviz-proj-required--resolved');
      } else {
        _newConfirmBtn.classList.add('item-viz-confirm-btn--blocked');
        _newConfirmBtn.setAttribute('aria-disabled', 'true');
        _newConfirmBtn.setAttribute('title', 'Selecciona un proyecto para habilitar el guardado');
        if (banner) banner.classList.remove('iviz-proj-required--resolved');
      }
    });
  }

  // Handler de confirmación con guard explícito (AC-6: no depende de disabled nativo)
  _newConfirmBtn.addEventListener('click', () => {
    if (!_resolvedProj) return;
    overlay.classList.add('closing');
    overlay.classList.remove('open');
    setTimeout(() => overlay.classList.remove('closing', 'item-viz--flex'), 220);
    // Sincronizar selector del card para que el estado quede consistente
    const projSelectEl = document.getElementById('sess-proj-' + id);
    if (projSelectEl) { projSelectEl.value = _resolvedProj.id; }
    _doSaveSession(id, getAI(id), parsed, _resolvedProj, horaResult);
  }, { once: true });

  // Abrir panel
  overlay.classList.remove('closing');
  overlay.classList.add('open', 'item-viz--flex');
}

function confirmSave(id) {
  saveSession(id);
}

function cancelConfirmSave(id) {
  // Mantenido por compatibilidad con referencias existentes — no-op
}

// T-202604-295: helper persistente para trigger de descarga de templates
const _TMPL_TRIGGER_KEY = 'template-download-trigger';
function _templateTrigger() {
  return localStorage.getItem(_TMPL_TRIGGER_KEY) || 'session';
}
function toggleTemplateTrigger(val) {
  localStorage.setItem(_TMPL_TRIGGER_KEY, val);
  // Actualizar UI si el toggle está visible
  const r1 = document.getElementById('tmpl-trigger-session');
  const r2 = document.getElementById('tmpl-trigger-sprint');
  if (r1) r1.checked = val === 'session';
  if (r2) r2.checked = val === 'sprint';
}

// T-202604-115: Descargar templates individuales (HTML + CONTEXT + Backlog)
function downloadTemplates() {
  const t = document.getElementById('toast');
  const msg = `Templates listos <button onclick="_doDownloadTemplates();_dismissToast(this.closest('.toast-item'))" class="toast-dl-btn">⬇ Descargar</button>`;
  showToast('download', msg, null, 8000);
}

function _dlTemplatesCancel() {
  // Alias mantenido por compatibilidad — no-op
}

// R-202604-040: genera sección ## Memoria reciente con las últimas 5 sesiones que tengan campos narrativos
function _buildNarrativeMemoryMd() {
  const rows = _getAllSessionsChron();
  const withNarrative = rows.filter(({ sess }) =>
    sess.decision || sess.contexto || sess.bloqueantes || sess.aprendizaje
  ).slice(0, 5);
  if (!withNarrative.length) return '';

  const lines = ['## Memoria reciente', ''];
  withNarrative.forEach(({ sess, ai }) => {
    const aiName = ai ? ai.name : 'IA desconocida';
    lines.push(`### ${sess.date || sess.dateShort || 'Sin fecha'} · ${aiName}`);
    if (sess.title) lines.push(`**Sesión:** ${sess.title}`);
    if (sess.decision)    lines.push(`**Decisión:** ${sess.decision}`);
    if (sess.contexto)    lines.push(`**Contexto:** ${sess.contexto}`);
    if (sess.bloqueantes) lines.push(`**Bloqueantes:** ${sess.bloqueantes}`);
    if (sess.aprendizaje) lines.push(`**Aprendizaje:** ${sess.aprendizaje}`);
    lines.push('');
  });
  lines.push('---', '');
  return lines.join('\n');
}

function _doDownloadTemplates() {
  // B-202605-267: usar versión canónica (post-Generator) en lugar de APP_VERSION hardcodeada
  const _ver = (typeof _effectiveVersion !== 'undefined' && _effectiveVersion)
    ? _effectiveVersion
    : (typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'v3.4');

  // Backlog
  _generateBacklogMd(_ver);

  // CONTEXT — enriquecido con sección de memoria narrativa al final
  setTimeout(() => {
    const raw = localStorage.getItem(_tplKey('context-raw'));
    if (raw) {
      // R-202604-040: añadir sección de memoria narrativa al final del CONTEXT exportado
      const narrativeMd = _buildNarrativeMemoryMd();
      const enriched = narrativeMd ? raw.trimEnd() + '\n\n---\n\n' + narrativeMd : raw;
      const b = new Blob([enriched], { type: 'text/markdown' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `${_docPrefix()}-CONTEXT_${_ver}.md`;
      a.click(); URL.revokeObjectURL(u);
    }
  }, 300);

  // HTML-MAP
  setTimeout(() => {
    const raw = localStorage.getItem(_tplKey('html-map-raw'));
    if (raw) {
      const b = new Blob([raw], { type: 'text/markdown' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `${_docPrefix()}-MAP_${_ver}.md`;
      a.click(); URL.revokeObjectURL(u);
    }
  }, 600);

}

// T-202604-061: Changelog interno
const CHANGELOG_KEY = 'ai-tracker-changelog';
const CHANGELOG_MAX = 50;

function _addChangelogEntry(parsed) {
  // estado formato: "YYYY-MM-DD HH:MM UTC-6 — descripción"
  // archivos formato: "AI-Tracker-vX.X.X.X.html, ..."
  const estadoMatch = parsed.estado.match(/^(\d{4}-\d{2}-\d{2}[^\—–-]*?)\s*[—–-]+\s*(.+)$/);
  const fecha = estadoMatch ? estadoMatch[1].trim() : parsed.estado.slice(0, 16);
  const desc  = estadoMatch ? estadoMatch[2].trim() : parsed.estado;

  // extraer versión del campo archivos
  const versionMatch = (parsed.archivos || '').match(/AI-Tracker-(v[\d.]+)\.html/i);
  const version = versionMatch ? versionMatch[1] : APP_VERSION;

  const entry = { version, fecha, desc, titulo: parsed.titulo || '', ts: Date.now() };

  let log = [];
  try { log = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]'); } catch { log = []; }
  log.unshift(entry);
  if (log.length > CHANGELOG_MAX) log = log.slice(0, CHANGELOG_MAX);
  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(log));
}

function openChangelog() {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('changelog-overlay');
  if (!overlay) return;
  const body = document.getElementById('changelog-body');
  if (body) body.innerHTML = _buildChangelogInner();
  overlay.classList.add('open');
}

function _buildChangelogInner() {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]'); } catch { log = []; }

  const rows = log.length ? log.map(e => `
    <div class="chlog-entry">
      <div class="changelog-row-date">
        <span class="chlog-version">${esc(e.version)}</span>
      </div>
      <div class="changelog-row-body">
        ${e.titulo ? `<div class="chlog-title">${esc(e.titulo)}</div>` : ''}
        <div class="chlog-body">${esc(e.desc)}</div>
        <div class="chlog-date">${esc(e.fecha)}</div>
      </div>
    </div>`).join('')
  : `<div class="chlog-empty">Sin entradas aún — se registran al guardar sesiones con bloque CHECKPOINT.</div>`;

  return `
    <div class="modal-title">📋 Changelog</div>
    <div class="changelog-scroll">${rows}</div>
    <div class="modal-actions changelog-actions">
      <button onclick="document.getElementById('changelog-overlay').classList.remove('open')">Cerrar</button>
    </div>`;
}

// Alias legacy — por si hay referencias directas
function _buildChangelogHTML() {
  return `<div class="modal modal--changelog">${_buildChangelogInner()}</div>`;
}

// R-202604-042: genera sección de memoria narrativa reciente para el CONTEXT exportado
// Toma las últimas N sesiones del proyecto activo que tengan al menos un campo narrativo con contenido real
function _buildNarrativeMd() {
  const N = 10;
  const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
  const sessions = (proj && Array.isArray(proj.sessions)) ? proj.sessions : [];
  if (!sessions.length) return '';

  // Filtrar sesiones con al menos un campo narrativo con contenido (distinto a vacío y a 'n/a')
  const _hasContent = (val) => val && val.trim() && val.trim().toLowerCase() !== 'n/a';

  const narrative = sessions
    .slice()
    .reverse() // más recientes primero
    .filter(s => _hasContent(s.decision) || _hasContent(s.contexto) || _hasContent(s.bloqueantes) || _hasContent(s.aprendizaje))
    .slice(0, N);

  if (!narrative.length) return '';

  const _ai = (aiId) => {
    if (typeof getAI === 'function') { const a = getAI(aiId); return a ? a.name : aiId; }
    return aiId || '—';
  };

  const entries = narrative.map(s => {
    const lines = [`**${s.date || s.dateShort || '—'}** · ${_ai(s.aiId)}` + (s.title ? ` · *${s.title}*` : '')];
    if (_hasContent(s.decision))    lines.push(`- **Decisión:** ${s.decision.trim()}`);
    if (_hasContent(s.contexto))    lines.push(`- **Contexto:** ${s.contexto.trim()}`);
    if (_hasContent(s.bloqueantes)) lines.push(`- **Bloqueantes:** ${s.bloqueantes.trim()}`);
    if (_hasContent(s.aprendizaje)) lines.push(`- **Aprendizaje:** ${s.aprendizaje.trim()}`);
    return lines.join('\n');
  }).join('\n\n');

  return `\n---\n\n## Memoria narrativa reciente\n\n${entries}\n`;
}

function buildContextMd(version) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC-6';
  const tracker = getActiveTracker();
  const counters = tracker.counters || { P: 0, T: 0, R: 0, B: 0 };

  // Sprint activo — acepta 'active' y 'open'
  const allSprints = typeof getActiveSprints === 'function' ? getActiveSprints() : [];
  const activeSprint = allSprints.find(s => s.status === 'active' || s.status === 'open') || null;
  const lastClosed  = allSprints.filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0))[0] || null;

  // Archivo principal — nombre real del HTML si está disponible
  const htmlFile = typeof APP_VERSION !== 'undefined'
    ? `AI-Tracker-v${APP_VERSION.replace(/^v/, '')}.html`
    : `AI-Tracker-v${version}.html`;

  // Proyecto activo
  const proj = (typeof getActiveProject === 'function') ? getActiveProject() : null;
  const allProjects = (typeof state !== 'undefined' && state.projects) ? state.projects : [];

  // Todas las sesiones — para bloqueante y decisiones
  const allSessions = [];
  allProjects.forEach(p => (p.sessions || []).forEach(s => allSessions.push({ sess: s, proj: p })));
  allSessions.sort((a, b) => parseInt(b.sess.id || 0) - parseInt(a.sess.id || 0));

  // ── Sección: Estado actual ───────────────────────────────────────────────────
  let estadoSection = `## Estado actual\n\n`;
  estadoSection += `| Campo | Valor |\n|---|---|\n`;
  estadoSection += `| Archivo principal | \`${htmlFile}\` |\n`;
  estadoSection += `| Sprint activo | ${activeSprint ? `${activeSprint.id}${activeSprint.name ? ' · ' + activeSprint.name : ''}` : '—'} |\n`;
  estadoSection += `| Sprint cerrado más reciente | ${lastClosed ? lastClosed.id : '—'} |\n`;
  estadoSection += `| Contadores | P=${counters.P} · T=${counters.T} · R=${counters.R} · B=${counters.B} |\n`;
  const lastBlockerEntry = allSessions.find(({ sess }) => sess.bloqueantes && sess.bloqueantes.trim());
  if (lastBlockerEntry) {
    estadoSection += `| Último bloqueante | ${lastBlockerEntry.sess.bloqueantes.trim()} |\n`;
  }
  estadoSection += `\n`;

  // ── Sección: Stack — estática ────────────────────────────────────────────────
  const stackSection = `## Stack\n\n| Capa | Tecnología |\n|------|-----------|\n| UI | HTML + CSS custom (CSS vars, dark/light theme) |\n| Lógica | Vanilla JS ES6 (sin frameworks, sin build step) |\n| Persistencia | \`localStorage\` — clave \`ai-tracker-v4\` + \`backlog-items\` + \`backlog-meta\` |\n| Sync | Firebase Firestore (opcional) — SDK vía CDN, modo offline automático |\n`;

  // ── Sección: Proyectos registrados ───────────────────────────────────────────
  let projectsSection = `## Proyectos registrados\n\n`;
  if (allProjects.length) {
    projectsSection += `| Proyecto | Estado | Sprints | Sesiones | Ítems |\n|---|---|---|---|---|\n`;
    allProjects.forEach(p => {
      const sprintCount = Array.isArray(p.sprints) ? p.sprints.length : 0;
      const sessCount   = Array.isArray(p.sessions) ? p.sessions.length : 0;
      const itemCount   = (p.tracker && Array.isArray(p.tracker.items)) ? p.tracker.items.length : 0;
      const status      = p.status || 'active';
      projectsSection += `| ${p.name || p.id} | ${status} | ${sprintCount} | ${sessCount} | ${itemCount} |\n`;
    });
  } else {
    projectsSection += `_Sin proyectos registrados._\n`;
  }
  projectsSection += `\n`;

  // ── Sección: Tabs de la app — estática ──────────────────────────────────────
  const tabsSection = `## Tabs de la app\n\n| Tab | ID | Default | Descripción |\n|-----|----|---------|-------------|\n| 🗂 Tracker | \`tab-tracker\` | ✅ activo | Vista principal — Cards / Log / Proyecto |\n| 📁 Proyectos | \`tab-proyectos\` | — | Dashboard de proyectos |\n| 🗃 Documentos | \`tab-backlog\` | — | Sub-tabs: Backlog / HTML-MAP / Context |\n| 📊 Analytics | \`tab-analytics\` | — | Gráfico sesiones/mes + ranking + streaks + heatmap + histograma |\n\n**Radar (\`📡\`):** sidebar global, no un tab. DOM: \`#radar-sidebar\`. Toggled via \`toggleRadarSidebar()\`.\n\n`;

  // ── Sección: localStorage keys activas — estática ───────────────────────────
  const localStorageSection = `## localStorage — keys activas\n\n| Key | Descripción |\n|-----|-------------|\n| \`ai-tracker-v4\` | State principal serializado |\n| \`backlog-items[-{projId}]\` | Array de ítems del Backlog.md importado |\n| \`backlog-meta[-{projId}]\` | \`{ version, updated, importedAt, counters }\` |\n| \`backlog-log\` | Historial de cambios del backlog |\n| \`context-log\` | Log de acciones sobre el Context |\n| \`html-map-log\` | Log de acciones sobre el HTML-MAP |\n| \`html-map-raw[-{projId}]\` | Texto raw del HTML-MAP.md importado |\n| \`html-map-sections[-{projId}]\` | Array de secciones parseadas del HTML-MAP |\n| \`html-map-meta[-{projId}]\` | \`{ file, version, importedAt, total }\` |\n| \`context-raw[-{projId}]\` | Texto raw del CONTEXT.md importado |\n| \`context-sections[-{projId}]\` | Secciones parseadas del CONTEXT (JSON) |\n| \`context-meta[-{projId}]\` | \`{ version, updated, importedAt }\` |\n| \`notes-{projId}\` | Notas rápidas por proyecto |\n| \`active-tab\` | Tab activo al cerrar |\n| \`tracker-view-mode\` | Modo de vista del tab Tracker: \`cards\` \\| \`chrono\` \\| \`project\` |\n| \`backlog-view-mode\` | Modo vista Backlog: plano \\| tree \\| kanban |\n| \`tmp-id-map\` | Mapeo \`{ slug → { code, createdAt } }\`. TTL 24h |\n| \`ai-tracker-changelog\` | Historial interno de cambios (max 50 entradas) |\n\nKeys con sufijo \`-{projId}\` cuando hay proyecto activo (via \`_tplKey(base)\`).\n\n`;

  // ── Sección: Decisiones técnicas registradas ─────────────────────────────────
  // Extraer del proyecto activo — campo decisions
  let decisionsSection = `## Decisiones técnicas registradas\n\n`;
  const projDecisions = (proj && Array.isArray(proj.decisions)) ? proj.decisions : [];
  if (projDecisions.length) {
    // Ordenar por fecha desc, tomar las 20 más recientes
    const sorted = [...projDecisions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 20);
    decisionsSection += `| Fecha | Decisión | Autor |\n|---|---|---|\n`;
    sorted.forEach(d => {
      const fecha  = (d.date || '—').slice(0, 10);
      const texto  = (d.text || '').replace(/\|/g, '\\|').slice(0, 120);
      const autor  = (d.author || '—').replace(/\|/g, '\\|');
      decisionsSection += `| ${fecha} | ${texto} | ${autor} |\n`;
    });
  } else {
    decisionsSection += `_Sin decisiones técnicas registradas en el proyecto activo._\n`;
  }
  decisionsSection += `\n`;

  // ── Sección: Gaps / pendientes sprint activo ─────────────────────────────────
  let gapsSection = `## Gaps / pendientes sprint activo\n\n`;
  if (activeSprint && proj && proj.tracker && Array.isArray(proj.tracker.items)) {
    const sprintItems = proj.tracker.items.filter(i =>
      i.sprint === activeSprint.id && i.status === 'pendiente'
    );
    if (sprintItems.length) {
      gapsSection += `| Ítem | Descripción | Tipo | Effort |\n|---|---|---|---|\n`;
      sprintItems.slice(0, 30).forEach(i => {
        const desc   = (i.title || i.desc || '').replace(/\|/g, '\\|').slice(0, 100);
        const tipo   = i.type || '—';
        const effort = i.effort || '—';
        gapsSection += `| \`${i.code || '[pendiente]'}\` | ${desc} | ${tipo} | ${effort} |\n`;
      });
    } else {
      gapsSection += `_Sin ítems pendientes en el sprint activo._\n`;
    }
  } else {
    gapsSection += `_Sin sprint activo o sin proyecto seleccionado._\n`;
  }
  gapsSection += `\n`;

  // ── Sección: Narrativa operativa ─────────────────────────────────────────────
  const narrativeMd = _buildNarrativeMd ? _buildNarrativeMd() : '';

  return `# CONTEXT — AI Tracker
# CONTEXT.md
<!--
  Versión: ${version}
  Última actualización: ${timestamp}
  Reglas generales: nombre archivo + numeración oficial + CHECKPOINT acumulativo
-->

Versión: ${version}
Última actualización: ${timestamp}
Archivo principal: \`${htmlFile}\`

---

${estadoSection}
---

${stackSection}

---

${projectsSection}
---

${tabsSection}
---

${localStorageSection}
---

${decisionsSection}
---

${gapsSection}
---

## Notas

Documento generado automáticamente desde AI Tracker v${version}.
Importa este archivo en la siguiente sesión.
${narrativeMd}
`;
}

// B-202605-517: stub legacy reemplazado — delegación a _generateBacklogContent (ai-tracker-sprint-project.js)
// La función anterior leía tracker.items (schema legacy, solo sesiones) en lugar de ITEMS (backlog global),
// produciendo exports truncados con backlogs de 24+ ítems.
function buildBacklogMd(version) {
  if (typeof _generateBacklogContent === 'function') {
    const { md } = _generateBacklogContent(version);
    return md;
  }
  // Fallback: _generateBacklogContent no disponible (carga parcial de módulos)
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC-6';
  return `# Backlog-v${version}.md\n<!-- Versión: v${version} | Última actualización: ${timestamp} -->\n\n⚠ buildBacklogMd: _generateBacklogContent no disponible — adjunta ai-tracker-sprint-project.js\n`;
}

// R-202604-022: muestra alerta de cuota de localStorage si supera umbrales
function _checkStorageQuota() {
  if (typeof _getLocalStorageUsage !== 'function') return;
  const { usedKB, totalKB, pct } = _getLocalStorageUsage();
  if (pct >= 0.85) {
    showToast('error', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB) — limpia ítems o exporta datos`, null, 8000);
  } else if (pct >= 0.70) {
    showToast('warning', `⚠ localStorage al ${Math.round(pct * 100)}% (${usedKB} KB / ${totalKB} KB)`, null, 6000);
  }
}

function saveSession(id) {
  // B-202605-054: getAI(id) puede devolver null si el worker fue eliminado entre el inicio
  // de la sesión y el guardado (ej: purge concurrente). Sin guard, ai._parsed explota.
  const ai = getAI(id);
  if (!ai) {
    showToast('error', '⚠ No se encontró el worker — recarga la página');
    return;
  }
  const parsed = ai._parsed || {};
  const ta = document.getElementById('ta-' + id);
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  if (!title) {
    showToast('warning', '⚠ El textarea está vacío — pega el resumen de la sesión');
    const ta2 = document.getElementById('ta-' + id);
    if (ta2) { ta2.focus(); ta2.style.setProperty('--input-border-flash', 'var(--red)'); ta2.classList.add('input-border-error'); setTimeout(() => { ta2.classList.remove('input-border-error'); }, 2000); }
    return;
  }

  const horaRaw = (document.getElementById('hora-' + id) || {value:''}).value.replace(/\D/g, '');
  const horaResult = interpretHora(horaRaw);

  // Proyecto: leer del selector del card, con fallback al activo global
  const projSelectEl = document.getElementById('sess-proj-' + id);
  const selectedProjId = projSelectEl ? projSelectEl.value : '';
  const activeProj = (selectedProjId ? (state.projects || []).find(p => p.id === selectedProjId) : null)
    || getActiveProject();
  // R-202605-095: sin proyecto → no abortar con toast. El panel de ítems comunica el problema inline.
  // Si no hay ítems que mostrar en el panel, aún así abrir el panel con solo el banner.
  const _needsProject = !activeProj;
  if (_needsProject) {
    // Marcar el selector con error visual (sin toast)
    if (projSelectEl) { projSelectEl.classList.add('input-outline-error'); setTimeout(() => { projSelectEl.classList.remove('input-outline-error'); }, 2000); }
    // Abrir el panel con banner bloqueante — el usuario debe seleccionar proyecto desde el card
    _showProjRequiredInPanel(id, parsed, horaResult);
    return;
  }

  // P-202604-115: validar campo Proyecto del CHECKPOINT vs proyecto del card
  // Solo aplica a CHECKPOINTs (no a sesiones manuales sin bloque)
  if (parsed.isCheckpoint) {
    const _ckptProj = (parsed.ckptProyecto || '').trim();
    const _cardProjName = (activeProj.name || '').trim();
    const _projMatch = _ckptProj && _cardProjName === _ckptProj;
    const _projMismatch = _ckptProj && !_projMatch;
    const _projMissing = !_ckptProj;

    if (_projMismatch || _projMissing) {
      // Aviso no ignorable — requiere acción explícita: Continuar o Cancelar
      const _msg = _projMissing
        ? `El CHECKPOINT no tiene campo <strong>Proyecto:</strong>.<br>Se guardará en <strong>${esc(_cardProjName)}</strong>.`
        : `El CHECKPOINT declara <strong>${esc(_ckptProj)}</strong> pero el card tiene seleccionado <strong>${esc(_cardProjName)}</strong>.`;
      _showProjMismatchModal({
        msg: _msg,
        onContinue: () => _doSaveSession(id, ai, parsed, activeProj, horaResult)
      });
      return;
    }
  }

  _doSaveSession(id, ai, parsed, activeProj, horaResult);
}

// P-202604-115: modal Continuar/Cancelar para discrepancia de proyecto
function _showProjMismatchModal({ msg, onContinue }) {
  // R-202604-047: shell estático en index.html
  const overlay = document.getElementById('proj-mismatch-overlay');
  if (!overlay) return;
  const msgEl = document.getElementById('proj-mismatch-msg');
  if (msgEl) msgEl.innerHTML = msg;
  overlay.classList.add('open');
  // Reemplazar botón para limpiar handlers acumulados
  const btn = document.getElementById('proj-mismatch-continue');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
      onContinue();
    });
  }
}

// B-202604-116: merge de backlog apuntando al proyecto del card, no al filtro global activo.
// Sobrescribe temporalmente current-project-filter + recarga ITEMS del proyecto destino,
// ejecuta el merge, y restaura el estado anterior (filtro + ITEMS del proyecto original).
// _setActiveProjectFilter no se usa porque tiene side-effects de UI.
function _mergeBacklogWithProject(tgItems, sessId, projId) {
  if (!tgItems || !tgItems.length) return { created:[], updated:[], ignored:[], advanced:[], retroceso:[], discarded:[] };
  const _prevFilter = localStorage.getItem('current-project-filter') || '';
  const _filterChanged = projId && projId !== _prevFilter;
  if (_filterChanged) {
    // Apuntar al proyecto del card y recargar ITEMS correspondientes
    localStorage.setItem('current-project-filter', projId);
    if (typeof loadBacklog === 'function') loadBacklog();
  }
  let result;
  try {
    result = mergeBacklogFromTG(tgItems, sessId);
  } finally {
    if (_filterChanged) {
      // Restaurar filtro original y recargar ITEMS del proyecto original
      if (_prevFilter) localStorage.setItem('current-project-filter', _prevFilter);
      else localStorage.removeItem('current-project-filter');
      if (typeof loadBacklog === 'function') loadBacklog();
    }
  }
  return result;
}

// R-202604-017 + P-202604-115: lógica central de guardado extraída para reutilización
function _doSaveSession(id, ai, parsed, activeProj, horaResult) {
  const ta = document.getElementById('ta-' + id);
  const raw = ta ? ta.value.trim() : '';
  // B-202604-NNN: evitar que marcas de bloque (---CHECKPOINT---, ```) queden como título
  const _rawFallbackLine = raw.split('\n').find(l => { const t = l.trim(); return t && !t.startsWith('---') && !t.startsWith('```'); }) || '';
  const title = parsed.title || _rawFallbackLine.slice(0, 80) || '';
  const tgRefsRaw = parsed.tgItems || [];
  const trackerRefs = tgRefsRaw.map(x => x.code).filter(Boolean);
  const now = new Date();
  const dateShort = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short'});
  const dateFull = now.toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric'}) + ' ' +
                   now.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

  // T-202604-190: si venimos de "Completar sesión", actualizar la sesión quick en lugar de crear una nueva
  const completeTargetId = _pendingCompleteId;
  _pendingCompleteId = null;
  const tgItems = parsed.tgItems || [];

  if (completeTargetId) {
    // Buscar y actualizar la sesión quick existente
    const targetFound = _findSession(completeTargetId);
    if (targetFound) {
      const ts = targetFound.sess;
      ts.title      = title;
      ts.summary    = parsed.summary || ts.summary || '';
      ts.files      = parsed.files   || ts.files   || '';
      ts.nextStep   = parsed.nextStep || ts.nextStep || '';
      // R-202604-039: campos de memoria narrativa
      ts.decision    = parsed.decision    || ts.decision    || '';
      ts.contexto    = parsed.contexto    || ts.contexto    || '';
      ts.bloqueantes = parsed.bloqueantes || ts.bloqueantes || '';
      ts.aprendizaje = parsed.aprendizaje || ts.aprendizaje || '';
      ts.trackerRefs = trackerRefs.length ? trackerRefs : (ts.trackerRefs || []);
      ts.resetAt    = horaResult ? horaResult.label : (ts.resetAt || '');
      ts.quickCapture = false; // AC-3: pasa a sesión completa

      if (horaResult) { ai.status = 'exhausted'; ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
      ai._parsed = {};
      if (_confirmTimers[id]) { clearTimeout(_confirmTimers[id]); delete _confirmTimers[id]; }
      localStorage.removeItem('draft-' + id);
      // R-3: eliminar borrador de Supabase al guardar sesión
      clearTimeout(window['_draftSbTimer_' + id]);
      if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
        _supabase.from('tracker_docs').delete().eq('user_id', _supabaseUser.id).eq('key', 'draft-' + id)
          .then(({ error }) => { if (error) console.warn('[AI Tracker] draft delete Supabase error:', error); });
      }
      const _taClearC = document.getElementById('ta-' + id);
      if (_taClearC) { _taClearC.value = ''; parsePaste(id); }
      exitFocusMode();

      // Merge backlog y contexto igual que flujo normal
      // B-202604-116: usar proyecto del card, no filtro global activo
      // T-202604-201: panel de confirmación diff antes de aplicar el merge
      const _doCompleteFinish = async () => {
        _mergeBacklogWithProject(tgItems, ts.id, activeProj.id);
        // B-202604-XXX: sincronizar trackerRefs con códigos reales post-resolución
        ts.trackerRefs = tgItems.map(x => x.code).filter(c => c && /^[PTRB]-\d{6}-\d{3}/.test(c));
        const contextSections2 = extractContextSections(raw);
        if (contextSections2.length) mergeContextSections(contextSections2, activeProj.id);
        const mapSections2 = extractHtmlMapSections(raw);
        if (mapSections2.length) mergeHtmlMapSections(mapSections2, activeProj.id);
        // R-202604-076 + R-B: plan block — PLAN legacy y EXECUTION-PLAN nuevo
        // B-202605-XXX: usar _tryIngestPlan en lugar de savePlan directo — preserva scope:sprint al guardar scope:sesion
        if (raw.includes('---PLAN---') || raw.includes('---EXECUTION-PLAN---')) _tryIngestPlan(raw);
        await saveImmediate(); render(); renderStats();
        // B-202605-508: actualizar badges de tabs tras guardar sesión
        if (typeof updateTabNotifBadges === 'function') updateTabNotifBadges();
        if (currentTab === 'backlog') renderBacklogList();
        _rebuildLogBody();
        _checkStorageQuota();
        // B-202605-265: _setPhase(id,3) movido dentro de rAF — render() reconstruye el DOM con
        // grid.innerHTML='', los elementos phase-* no existen hasta el siguiente frame
        requestAnimationFrame(() => {
          _setPhase(id, 3);
          // segundo render garantiza sidebar y card con state final estabilizado
          render();
          if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
          // B-202605-XXX: re-limpiar draft después del segundo render() — mismo fix que flujo principal
          localStorage.removeItem('draft-' + id);
          localStorage.removeItem('draft-' + id + '-ts');
          const _dotRaf2 = document.getElementById('draft-' + id);
          if (_dotRaf2) _dotRaf2.className = 'draft-dot';
          const _taRaf2 = document.getElementById('ta-' + id);
          if (_taRaf2 && _taRaf2.value.trim()) { _taRaf2.value = ''; parsePaste(id); }
          const card2 = document.getElementById('card-' + id);
          if (card2) {
            card2.classList.remove('card-flash'); void card2.offsetWidth; card2.classList.add('card-flash');
            setTimeout(() => card2.classList.remove('card-flash'), 650);
            // R-202604-061 AC-1: feedback en botón guardar
            const _sbtn2 = document.getElementById('sbtn-' + id);
            if (_sbtn2) {
              _sbtn2.classList.add('btn--saved');
              setTimeout(() => _sbtn2.classList.remove('btn--saved'), 1800);
            }
          }
        });
        // T-202605-446: detener cronómetro y registrar tiempo total en la sesión
        if (typeof window._stopSessionTimer === 'function') ts.durationMs = window._stopSessionTimer(id) || 0;
        showToast('success', 'Sesión completada ✓');
      };
      if (typeof showMergeDiffPanel === 'function' && tgItems.length) {
        showMergeDiffPanel(tgItems, ts.id, activeProj.id, _doCompleteFinish);
      } else {
        _doCompleteFinish();
      }
      return;
    }
    // Si no se encuentra la sesión target, continuar con flujo normal
  }

  // v3.0.0: sesión va al proyecto activo con aiId
  // R-202604-017 AC-3: ckptProyecto registrado en sesión para trazabilidad en log
  const newSess = {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
    aiId: ai.id,
    title, summary: parsed.summary || '', files: parsed.files || '',
    pending: parsed.pending || '', tags: [],
    nextStep: parsed.nextStep || '',
    trackerRefs,
    ckptProyecto: parsed.ckptProyecto || '',
    // R-202604-039: campos de memoria narrativa
    decision:    parsed.decision    || '',
    contexto:    parsed.contexto    || '',
    bloqueantes: parsed.bloqueantes || '',
    aprendizaje: parsed.aprendizaje || '',
    resetAt: horaResult ? horaResult.label : '',
    // T-202605-446: tiempo cronometrado de la sesión en ms
    durationMs: (typeof window._stopSessionTimer === 'function') ? window._stopSessionTimer(id) : 0,
    dateShort, date: dateFull
  };
  // B-202605-004: newSess NO se persiste aquí. El push de sessions[] y el populate de
  // tracker.items ocurren en _doApplyMergeAndFinish, después de confirmación del panel.
  // Si el usuario cancela, ni sessions[] ni tracker.items quedan con entradas huérfanas.
  const sessId = newSess.id;

  // T-098: merge del TRACKER-GLOBAL al Backlog en memoria (acumulable)
  // T-202604-121: recoger resultado detallado para super toast
  // B-202604-116: usar proyecto del card, no filtro global activo
  // T-202604-201: panel de confirmación diff antes de aplicar el merge
  if (typeof showMergeDiffPanel === 'function' && tgItems.length) {
    showMergeDiffPanel(tgItems, sessId, activeProj.id, () => {
      _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess);
    });
    return;
  }
  // Fallback: merge directo si showMergeDiffPanel no está disponible
  _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess);
}

// T-202604-201: segunda mitad de _doSaveSession — ejecutada tras confirmación del panel de diff
async function _doApplyMergeAndFinish(id, ai, parsed, activeProj, horaResult, sessId, tgItems, newSess) {
  // B-202605-004: push atómico — la sesión entra en activeProj.sessions solo aquí,
  // después de que el usuario confirmó el panel MergeDiff (o en el fallback directo).
  // Garantiza que cancelar el panel no deja sesiones huérfanas en el array.
  if (!activeProj.sessions) activeProj.sessions = [];
  if (newSess && !activeProj.sessions.find(s => s.id === newSess.id)) {
    activeProj.sessions.push(newSess);
  }

  // v3.0.0: tracker del proyecto activo — también aquí para atomicidad con sessions[].
  // Sin esto, tracker.items quedaría con sessionId huérfano si el usuario cancela el panel.
  if (!activeProj.tracker) activeProj.tracker = { items: [], counters: { P: 0, T: 0, R: 0, B: 0 } };
  const tracker = activeProj.tracker;
  let newCount = 0, updCount = 0;
  tgItems.forEach(item => {
    const existing = tracker.items.find(x => x.code === item.code);
    if (existing) {
      existing.desc = item.desc; existing.status = item.status; existing.sessionId = sessId;
      updCount++;
    } else {
      const c = tracker.counters;
      const numMatch = item.code.match(/[PTRB]-\d{6}-(\d{3})/);
      if (numMatch) { const num = parseInt(numMatch[1]); if (num >= (c[item.type] || 0)) c[item.type] = num; }
      tracker.items.push({id:'tgi-'+Date.now()+'-'+Math.random().toString(36).slice(2,6), code:item.code, desc:item.desc, status:item.status, sessionId:sessId});
      newCount++;
    }
  });

  const raw = (document.getElementById('ta-' + id) || {}).value || '';
  const mergeResult = _mergeBacklogWithProject(tgItems, sessId, activeProj.id);

  // B-202604-XXX: actualizar trackerRefs con códigos reales post-_assignPendingIds
  // _mergeBacklogWithProject resuelve [pendiente-ID] → código real en tgItems
  // newSess.trackerRefs fue construido antes de esa resolución — se sincroniza aquí
  if (newSess && tgItems.length) {
    newSess.trackerRefs = tgItems.map(x => x.code).filter(c => c && /^[PTRB]-\d{6}-\d{3}/.test(c));
  }

  // T-202604-108: merge de secciones CONTEXT-SECTION si las hay en el paste
  const contextSections = extractContextSections(raw);
  const mergedCtxNames = [];
  if (contextSections.length) {
    contextSections.forEach(s => mergedCtxNames.push(s.header.replace(/^##\s*/, '')));
    mergeContextSections(contextSections, activeProj.id);
  }

  // merge de secciones MAP-SECTION si las hay en el paste
  const mapSections = extractHtmlMapSections(raw);
  if (mapSections.length) mergeHtmlMapSections(mapSections, activeProj.id);

  // R-202604-076 + R-B: parsear y guardar bloque ---PLAN--- / ---EXECUTION-PLAN--- si existe
  // B-202605-XXX: usar _tryIngestPlan en lugar de savePlan directo — preserva scope:sprint al guardar scope:sesion
  if (raw.includes('---PLAN---') || raw.includes('---EXECUTION-PLAN---')) _tryIngestPlan(raw);

  if (horaResult) { ai.status = 'exhausted'; ai.resetTime = horaResult.hhmm; ai.resetEpoch = horaResult.epoch; }
  ai._parsed = {};
  // T-202604-103: limpiar timer de confirmación si quedó activo
  if (_confirmTimers[id]) { clearTimeout(_confirmTimers[id]); delete _confirmTimers[id]; }
  // B-202605-NNN: clearTimeout antes de removeItem — evita que un timer completado justo antes
  // del save haga upsert en Supabase después de que el draft ya fue eliminado de localStorage.
  // El orden incorrecto (removeItem → clearTimeout) dejaba una ventana donde el timer podía
  // leer el draft de localStorage si se disparaba entre ambas líneas.
  clearTimeout(window['_draftSbTimer_' + id]);
  localStorage.removeItem('draft-' + id);
  localStorage.removeItem('draft-' + id + '-ts');
  // R-3: eliminar borrador de Supabase al guardar sesión
  if (typeof _supabase !== 'undefined' && _supabase && typeof _supabaseUser !== 'undefined' && _supabaseUser) {
    _supabase.from('tracker_docs').delete().eq('user_id', _supabaseUser.id).eq('key', 'draft-' + id)
      .then(({ error }) => { if (error) console.warn('[AI Tracker] draft delete Supabase error:', error); });
  }
  const _taClear = document.getElementById('ta-' + id);
  // B-202605-NNN: no llamar parsePaste(id) aquí — parsePaste con ta.value='' puede re-disparar
  // el debounce path y reescribir el draft si hay un oninput pendiente en la cola del browser.
  // El rAF post-render ya limpia el textarea y valida el estado final.
  if (_taClear) { _taClear.value = ''; _taClear.classList.remove('ta-has-items'); }
  exitFocusMode();
  await saveImmediate(); render();
  // R-202604-022: alerta de cuota tras guardar
  _checkStorageQuota();
  // B-007: actualizar stat bar y lista backlog siempre al guardar sesión
  renderStats();
  // B-202604-XXX: actualizar tab Hoy tras guardar CKPT con hora de cierre — sin esto el card no refleja estado exhausted sin refresh manual
  if (currentTab === 'hoy' && typeof renderHoy === 'function') renderHoy();
  if (currentTab === 'backlog') renderBacklogList();
  // R-202604-016: actualizar log card
  _rebuildLogBody();
  // R-003: animar la primera sess-row del card recién guardado
  // B-202605-265: _setPhase(id,3) movido dentro de rAF — render() reconstruye el DOM con
  // grid.innerHTML='', los elementos phase-* no existen hasta el siguiente frame.
  // Segundo render() + renderGlobalRadarSidebar() garantizan sidebar y card actualizados.
  requestAnimationFrame(() => {
    _setPhase(id, 3);
    render();
    if (typeof renderGlobalRadarSidebar === 'function') renderGlobalRadarSidebar();
    // B-202605-XXX: re-limpiar draft después del segundo render() — restoreDrafts() corre
    // al final de render() y puede repoblar el textarea si el draft sobrevivió en localStorage
    // (race entre parsePaste con ta.value='' y un oninput/debounce timer previo).
    localStorage.removeItem('draft-' + id);
    localStorage.removeItem('draft-' + id + '-ts');
    const _dotRaf = document.getElementById('draft-' + id);
    if (_dotRaf) _dotRaf.className = 'draft-dot';
    const _taRaf = document.getElementById('ta-' + id);
    if (_taRaf && _taRaf.value.trim()) { _taRaf.value = ''; parsePaste(id); }
    const card = document.getElementById('card-' + id);
    if (card) {
      const firstRow = card.querySelector('.sess-row');
      if (firstRow) {
        firstRow.classList.remove('fade-slide-in');
        void firstRow.offsetWidth; // forzar reflow para reiniciar animación
        firstRow.classList.add('fade-slide-in');
      }
      // T-085: destello verde en el card al guardar sesión
      card.classList.remove('card-flash');
      void card.offsetWidth;
      card.classList.add('card-flash');
      setTimeout(() => card.classList.remove('card-flash'), 650);
      // R-202604-061 AC-1: feedback en botón guardar
      const _sbtn = document.getElementById('sbtn-' + id);
      if (_sbtn) {
        _sbtn.classList.add('btn--saved');
        setTimeout(() => _sbtn.classList.remove('btn--saved'), 1800);
      }
      // T-202604-410: estado transitorio post-merge en card
      const _hasMergeItems = mergeResult && (
        mergeResult.created.length || mergeResult.advanced.length ||
        mergeResult.updated.length || mergeResult.retroceso.length ||
        mergeResult.discarded.length
      );
      if (_hasMergeItems) {
        const _successBadge = document.createElement('div');
        _successBadge.className = 'card-merge-success-badge';
        const _counts = [];
        if (mergeResult.created.length)  _counts.push(`+${mergeResult.created.length} creado${mergeResult.created.length > 1 ? 's' : ''}`);
        if (mergeResult.advanced.length) _counts.push(`${mergeResult.advanced.length} avanzado${mergeResult.advanced.length > 1 ? 's' : ''}`);
        if (mergeResult.updated.length)  _counts.push(`${mergeResult.updated.length} actualizado${mergeResult.updated.length > 1 ? 's' : ''}`);
        if (mergeResult.retroceso.length) _counts.push(`${mergeResult.retroceso.length} retroceso${mergeResult.retroceso.length > 1 ? 's' : ''}`);
        if (mergeResult.discarded.length) _counts.push(`${mergeResult.discarded.length} descartado${mergeResult.discarded.length > 1 ? 's' : ''}`);
        _successBadge.textContent = '✓ Merge aplicado · ' + _counts.join(' · ');
        card.appendChild(_successBadge);
        requestAnimationFrame(() => _successBadge.classList.add('visible'));
        setTimeout(() => {
          _successBadge.classList.remove('visible');
          setTimeout(() => _successBadge.remove(), 400);
        }, 2600);
      }
    }
  });

  // T-202604-061: registrar entrada en changelog si es CHECKPOINT
  if (parsed.isCheckpoint && parsed.estado) _addChangelogEntry(parsed);

  // T-202604-121: super toast con detalle del merge
  // R-202605-140: proximoPaso y decision abren el panel aunque no haya ítems
  const _ckptProximoPaso = parsed.nextStep  || '';
  const _ckptDecision    = parsed.decision  || '';
  const _isInfoOnly = (v) => !v || v.trim().toLowerCase() === 'n/a';
  const _hasInfoFields = !_isInfoOnly(_ckptProximoPaso) || !_isInfoOnly(_ckptDecision);
  const hasMergeData = mergeResult.created.length || mergeResult.advanced.length || mergeResult.retroceso.length || mergeResult.discarded.length || mergeResult.updated.length || mergeResult.ignored.length || mergedCtxNames.length || _hasInfoFields;
  if (hasMergeData) {
    showCheckpointPanel({ ...mergeResult, contextSections: mergedCtxNames, proximoPaso: _ckptProximoPaso, decision: _ckptDecision });
  }
  const _hasPending = mergeResult.retroceso?.length || mergeResult.discarded?.length;
  const _baseMsg = horaResult ? `Sesión guardada · desbloquea a las ${horaResult.label}` : 'Sesión guardada';
  if (!_hasPending) {
    // T-202604-295: descargar templates solo si trigger es 'session' (default)
    if (_templateTrigger() === 'session') {
      const _dlBtn = `<button onclick="_doDownloadTemplates();_dismissToast(this.closest('.toast-item'))" class="toast-dl-btn">⬇ Templates</button>`;
      showToast('download', _baseMsg + _dlBtn, null, 8000);
    } else {
      showToast('success', _baseMsg);
    }
  } else {
    showToast('success', _baseMsg);
    window._pendingTemplateDownload = true;
  }
}

function toggleStatus(id) {
  const ai = getAI(id);
  ai.status = ai.status === 'available' ? 'exhausted' : 'available';
  if (ai.status === 'available') { ai.resetTime = ''; /* interrupted se limpia solo con dismissInterrupted */ }
  save(); render(); _rebuildLogBody();
}

function toggleShowAll(id) { const ai = getAI(id); ai.showAll = !ai.showAll; save(); render(); }

function openDetail(aiId, sessId) {
  const ai = getAI(aiId);
  const found = _findSessionByAI(aiId, sessId);
  const s = found ? found.sess : null;
  if (!s) return;
  popAIId = aiId; popSessId = sessId;
  
  // T-011: Renderizar avatar en popup
  const popAvatar = document.getElementById('pop-avatar');
  if (popAvatar) {
    popAvatar.innerHTML = ai.avatar ? ai.avatar : AVATAR_LOGOS.default;
  }
  
  document.getElementById('pop-title').textContent = s.title;
  // Restaurar ícono lápiz si fue borrado por edición inline
  const titleWrap = document.getElementById('pop-title-wrap');
  if (titleWrap && !titleWrap.querySelector('.pop-edit-icon')) {
    titleWrap.classList.remove('editing');
    const icon = document.createElement('span');
    icon.className = 'pop-edit-icon'; icon.textContent = '✏';
    titleWrap.appendChild(icon);
  }
  const aiSessAll = getAISessions(aiId);
  const isLastSess = aiSessAll.length > 0 && aiSessAll[aiSessAll.length - 1].id === s.id;
  const showResetField = isLastSess && ai.status === 'available' && !s.resetAt;
  const showCorrectField = isLastSess && ai.status === 'exhausted';
  // T-202604-004: badges en header
  const starBadge = s.starred ? `<span class="pop-header-badge starred">⭐ destacada</span>` : '';
  const quickBadge = s.quickCapture ? `<span class="pop-header-badge quick">⚡ rápida</span>` : '';
  // T-202604-098: badge inReview en popup (solo sesión más reciente)
  const reviewBadge = (s.inReview && isLastSess) ? `<span class="pop-header-badge review">🔍 en revisión</span>` : '';
  document.getElementById('pop-meta').innerHTML = `<span>${s.date}${s.resetAt ? ' · hasta ' + s.resetAt : ''}</span>${starBadge}${quickBadge}${reviewBadge}`;

  // T-087: Sección superior — siempre visible (resumen + pendiente + B-006 reset)
  let topFields = '';
  // T-202604-190: botón "Completar sesión" para sesiones quick
  if (s.quickCapture) {
    topFields += `<div class="popup-section popup-section--sep">
      <button class="btn-primary btn-primary--full" onclick="openCompleteQuickSession('${esc(aiId)}','${esc(s.id)}')">⚡ Completar sesión</button>
    </div>`;
  }
  if (s.summary) topFields += `<div class="popup-section summary"><div class="popup-section-label">Resumen</div><div class="pop-editable popup-section-val" id="pop-field-summary" onclick="startPopupEdit('summary')" title="Editar resumen">${esc(s.summary)}<span class="pop-edit-icon">✏</span></div></div>`;
  if (s.pending) topFields += `<div class="popup-section pending"><div class="popup-section-label">⏳ Pendiente</div><div class="pop-editable popup-section-val" id="pop-field-pending" onclick="startPopupEdit('pending')" title="Editar pendiente">${esc(s.pending)}<span class="pop-edit-icon">✏</span></div></div>`;

  // R-202604-039: campos de memoria narrativa — colapsados, solo si tienen contenido
  const _narrativeFields = [
    { key: 'decision',    label: '🧠 Decisión',    val: s.decision    || '' },
    { key: 'contexto',    label: '📌 Contexto',    val: s.contexto    || '' },
    { key: 'bloqueantes', label: '🚧 Bloqueantes', val: s.bloqueantes || '' },
    { key: 'aprendizaje', label: '💡 Aprendizaje', val: s.aprendizaje || '' },
  ].filter(f => f.val);
  if (_narrativeFields.length) {
    const _narKey = `pop-nar-${sessId}`;
    const _narOpen = sessionStorage.getItem(_narKey) === 'open';
    const _narClass = _narOpen ? ' open' : '';
    const _narBody = _narrativeFields.map(f =>
      `<div class="popup-section popup-section--pt"><div class="popup-section-label">${f.label}</div><div class="popup-section-val popup-section-val--pre">${esc(f.val)}</div></div>`
    ).join('');
    topFields += `<div class="popup-secondary-toggle${_narClass}" id="pop-nar-toggle" onclick="(function(){var k='${_narKey}',o=sessionStorage.getItem(k)==='open';sessionStorage.setItem(k,o?'closed':'open');document.getElementById('pop-nar-toggle').classList.toggle('open',!o);document.getElementById('pop-nar-body').classList.toggle('open',!o);})()">
      <span class="toggle-arrow">▶</span>
      <span>Memoria narrativa</span>
    </div>
    <div class="popup-secondary-body${_narClass}" id="pop-nar-body">${_narBody}</div>`;
  }

  // B-006: campo hora de reset si es última sesión y IA disponible sin hora
  if (showResetField) {
    topFields += `<div class="popup-section" id="pop-reset-section">
      <div class="popup-section-label">⏰ Hora de desbloqueo</div>
      <div class="pop-reset-row">
        <input class="pop-reset-input" id="pop-reset-hora" type="text" maxlength="4" placeholder="--:--"
          oninput="popParseHora()" onkeydown="if(event.key==='Enter')saveResetFromPopup()">
        <div class="pop-reset-disp" id="pop-reset-disp">—</div>
        <button class="btn-primary btn-primary--sm" onclick="saveResetFromPopup()">Marcar agotada</button>
      </div>
    </div>`;
  }

  // B-202604-094: campo corrección de hora si es última sesión y IA está agotada
  if (showCorrectField) {
    const currentLabel = ai.resetTime ? fmt12(ai.resetTime) : '(sin hora)';
    topFields += `<div class="popup-section" id="pop-correct-section">
      <div class="popup-section-label">⏰ Hora de desbloqueo <span class="popup-label-hint">· actual: ${esc(currentLabel)}</span></div>
      <div class="pop-reset-row">
        <input class="pop-reset-input" id="pop-correct-hora" type="text" maxlength="4" placeholder="--:--"
          oninput="popCorrectParseHora()" onkeydown="if(event.key==='Enter')saveCorrectHoraFromPopup()">
        <div class="pop-reset-disp" id="pop-correct-disp">—</div>
        <button class="btn-primary btn-primary--sm" onclick="saveCorrectHoraFromPopup()">Guardar</button>
      </div>
      <div class="popup-hora-hint-wrap">
        <button class="btn-ghost" class="btn-unlock-now" onclick="unlockNowFromPopup()">✅ Desbloquear ahora</button>
      </div>
    </div>`;
  }

  // T-087: Sección media — archivos + tags + trazabilidad — colapsable si está vacía
  let midFields = '';
  if (s.files) {
    const _fileList = s.files.split('|').map(f => f.trim()).filter(Boolean);
    const _filesHtml = _fileList.length > 1
      ? `<ul class="popup-file-list">${_fileList.map(f => `<li>${esc(f)}</li>`).join('')}</ul>`
      : `<div class="popup-section-val mono">${esc(s.files)}</div>`;
    midFields += `<div class="popup-section files"><div class="popup-section-label">📄 Archivos</div>${_filesHtml}</div>`;
  }

  const tgItems = (getActiveTracker().items || []).filter(x => x.sessionId === s.id);
  if (tgItems.length) {
    const rows = tgItems.map(x => `
      <div class="popup-tg-row">
        <span class="popup-tg-badge ${x.code[0]}">${x.code[0]}</span>
        <button class="popup-tg-code popup-tg-code--link" onclick="navigateToBacklogItem('${esc(x.code)}')" title="Ir al ítem en Backlog">${esc(x.code)}</button>
        <span class="popup-tg-desc">${esc(x.desc)}</span>
        <span class="popup-tg-status">${esc(x.status)}</span>
      </div>`).join('');
    midFields += `<div class="popup-section"><div class="popup-section-label">📋 Tracker items</div>${rows}</div>`;
  }

  // T-053: sección de vínculo con backlog
  midFields += `<div class="popup-section" id="pop-refs-section">
    <div class="popup-section-label">🔗 Backlog vinculado</div>
    ${renderBacklogRefs(s)}
  </div>`;

  const tagHtml = (s.tags || []).map(tid => {
    const t = state.tags.find(x => x.id === tid);
    const ci = TAG_COLORS.indexOf(t?.color);
    return t ? `<span class="tag tc-${ci >= 0 ? ci : 0}">${esc(t.name)}</span>` : '';
  }).join('');
  midFields += `<div class="popup-section"><div class="popup-section-label">Etiquetas</div>
    <div class="tag-wrap tag-wrap--mt">${tagHtml}<button class="tag-add-btn" onclick="openTagModal('${aiId}','${sessId}')">+ etiqueta</button></div>
  </div>`;

  // T-087: si sección media tiene contenido no trivial (archivos, tg, refs no vacíos) → mostrar toggle
  const hasMidContent = s.files || tgItems.length > 0;
  // Restaurar estado de colapso guardado por sesión
  const midKey = `pop-mid-${sessId}`;
  const midOpen = sessionStorage.getItem(midKey) !== 'closed';
  const midOpenClass = midOpen ? ' open' : '';

  let midHtml = '';
  if (hasMidContent) {
    midHtml = `<div class="popup-secondary-toggle${midOpenClass}" id="pop-mid-toggle" onclick="togglePopupMid('${sessId}')">
      <span class="toggle-arrow">▶</span>
      <span>Archivos · trazabilidad · etiquetas</span>
    </div>
    <div class="popup-secondary-body${midOpenClass}" id="pop-mid-body">${midFields}</div>`;
  } else {
    // Si no hay contenido extra — mostrar igual pero sin toggle (solo refs/tags)
    midHtml = midFields;
  }

  document.getElementById('pop-fields').innerHTML = topFields + midHtml;
  // ── Preview panel vs modal ────────────────────────────────────────────
  const isDesktop = window.innerWidth > 768;
  if (isDesktop) {
    // Populate preview panel — render IDs directly here so all edit functions work
    const tab = document.getElementById('tab-tracker');
    const preview = document.getElementById('tracker-preview');
    const previewEmpty = document.getElementById('tracker-preview-empty');
    const previewInner = document.getElementById('tracker-preview-inner');
    const previewHeader = document.getElementById('tracker-preview-header');
    const previewBody = document.getElementById('tracker-preview-body');
    const previewFooter = document.getElementById('tracker-preview-footer');

    // Remove active class from all sess-rows
    document.querySelectorAll('.sess-row.preview-active').forEach(el => el.classList.remove('preview-active'));
    // Add active class to current sess-row
    const activeRow = document.querySelector(`.sess-row[data-sess-id="${sessId}"]`);
    if (activeRow) activeRow.classList.add('preview-active');

    // Header — with functional IDs for edit + star update
    // Preview project selector — activo session's project, editable post-registro
    const _previewProjects = (state.projects || []).filter(p => p.status !== 'archived');
    const _previewSessProjId = (() => {
      for (const p of (state.projects || [])) {
        if ((p.sessions || []).some(x => x.id === sessId)) return p.id;
      }
      return '';
    })();
    const _previewProjOpts = _previewProjects.map(p =>
      `<option value="${esc(p.id)}" ${p.id === _previewSessProjId ? 'selected' : ''}>${esc(p.icon || '📁')} ${esc(p.name)}</option>`
    ).join('');
    // T-202605-472: onchange no muta directamente — pide confirm inline antes de aplicar
    const _previewProjSelect = `<select class="paste-proj-select preview-proj-select" id="preview-proj-${sessId}" title="Proyecto de esta sesión" onchange="_previewProjConfirmChange('${aiId}','${sessId}',this)"><option value="">sin proyecto</option>${_previewProjOpts}</select>`;

    previewHeader.innerHTML = `
      <button class="tracker-preview-close" onclick="closePopup()" title="Cerrar">✕</button>
      <div class="popup-header-body">
        <div class="changelog-row-body">
          ${_previewProjSelect}
          <div class="pop-editable pop-editable--mt" id="pop-title-wrap" onclick="startPopupEdit('title')" title="Editar título">
            <span class="popup-title" id="pop-title">${esc(s.title)}</span><span class="pop-edit-icon">✏</span>
          </div>
          <div class="popup-date" id="pop-meta"><span>${s.date}${s.resetAt ? ' · hasta ' + s.resetAt : ''}</span>${s.starred ? '<span class="pop-header-badge starred">⭐ destacada</span>' : ''}${s.quickCapture ? '<span class="pop-header-badge quick">⚡ rápida</span>' : ''}${(s.inReview && isLastSess) ? '<span class="pop-header-badge review">🔍 en revisión</span>' : ''}</div>
        </div>
      </div>`;

    // Body — topFields + midHtml with all functional IDs
    previewBody.innerHTML = topFields + midHtml;

    // Footer — incluye confirm de borrado inline (B-fix: era appendChild a previewInner → overflow:hidden lo ocultaba)
    previewFooter.innerHTML = `
      <div class="popup-footer-row">
        <button class="btn-ghost${s.starred ? ' starred' : ''}" id="pop-star-btn" onclick="starCurrentSession()" title="${s.starred ? 'Quitar destacado' : 'Destacar sesión'}">${s.starred ? '⭐' : '☆'}</button>
        <button class="btn-ghost" class="btn-danger-sm" onclick="openDeleteConfirm()" title="Eliminar sesión">🗑</button>
      </div>
      <div id="pop-delete-confirm" class="pop-delete-confirm">
        <span class="confirm-text">¿Eliminar esta sesión?</span>
        <button class="confirm-no" onclick="closeDeleteConfirm()">Cancelar</button>
        <button class="confirm-yes" onclick="deleteCurrentSession()">Eliminar</button>
      </div>`;

    // Show panel
    previewEmpty.classList.add('hidden');
    previewInner.classList.remove('hidden'); previewInner.classList.add('d-flex');
    tab.classList.add('preview-open');
    preview.scrollTop = 0;
  } else {
    document.getElementById('detail-popup').classList.add('open');
    const starBtn = document.getElementById('pop-star-btn');
    if (starBtn) { starBtn.textContent = s.starred ? '⭐' : '☆'; starBtn.classList.toggle('starred', !!s.starred); starBtn.title = s.starred ? 'Quitar destacado' : 'Destacar sesión'; }
  }
}
function closePopup() {
  document.getElementById('detail-popup').classList.remove('open');
  // Close preview panel
  const tab = document.getElementById('tab-tracker');
  const previewEmpty = document.getElementById('tracker-preview-empty');
  const previewInner = document.getElementById('tracker-preview-inner');
  if (tab) tab.classList.remove('preview-open');
  if (previewEmpty) previewEmpty.classList.remove('hidden');
  if (previewInner) {
    previewInner.classList.add('hidden'); previewInner.classList.remove('d-flex');
    // Remove injected delete confirm so it doesn't duplicate on next open
    const dc = document.getElementById('pop-delete-confirm');
    if (dc && previewInner.contains(dc)) dc.remove();
  }
  document.querySelectorAll('.sess-row.preview-active').forEach(el => el.classList.remove('preview-active'));
  popAIId = null; popSessId = null;
}

// T-202604-190: Completar sesión quick — pre-carga textarea y activa modo update
function openCompleteQuickSession(aiId, sessId) {
  const found = _findSessionByAI(aiId, sessId);
  const s = found ? found.sess : null;
  if (!s || !s.quickCapture) return;

  closePopup();

  // Pre-cargar textarea con datos existentes de la sesión quick
  const ta = document.getElementById('ta-' + aiId);
  if (ta) {
    const lines = [];
    if (s.title)   lines.push('---CHECKPOINT---');
    if (s.title)   lines.push('Título: ' + s.title);
    if (s.summary) lines.push('Resumen: ' + s.summary);
    if (!s.summary) lines.push('Resumen: ');
    lines.push('---FIN-CHECKPOINT---');
    ta.value = lines.join('\n');
    parsePaste(aiId);
    ta.focus();
  }

  // Marcar sesión a actualizar — saveSession lo lee para hacer update en lugar de push
  _pendingCompleteId = sessId;

  // Scroll al card
  const card = document.getElementById('card-' + aiId);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  showToast('info', 'Completando sesión rápida — edita el contenido y guarda');
}
function deleteCurrentSession() {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  if (!found) return;
  found.proj.sessions = found.proj.sessions.filter(s => s.id !== popSessId);
  save(); render(); closePopup(); _rebuildLogBody(); showToast('success', 'Sesión eliminada');
}
// T-087: confirmación inline
function openDeleteConfirm() {
  const el = document.getElementById('pop-delete-confirm');
  if (el) el.classList.add('open');
}
function closeDeleteConfirm() {
  const el = document.getElementById('pop-delete-confirm');
  if (el) el.classList.remove('open');
}
function togglePopupMid(sessId) {
  const toggle = document.getElementById('pop-mid-toggle');
  const body = document.getElementById('pop-mid-body');
  if (!toggle || !body) return;
  const isOpen = body.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
  sessionStorage.setItem(`pop-mid-${sessId}`, isOpen ? 'open' : 'closed');
}
// T-202604-098: Toggle estado inReview en sesión más reciente
function toggleInReview(aiId, sessId) {
  const found = _findSessionByAI(aiId, sessId);
  if (!found) return;
  const s = found.sess;
  // Solo opera en la sesión más reciente de esta IA
  const aiSess = getAISessions(aiId);
  const latestId = aiSess.length > 0 ? aiSess[aiSess.length - 1].id : null;
  if (s.id !== latestId) return;
  s.inReview = !s.inReview;
  save(); render();
}
// T-026: Destacar sesión
function starSession(aiId, sessId) {
  const found = _findSessionByAI(aiId, sessId);
  if (!found) return;
  found.sess.starred = !found.sess.starred;
  save(); render();
}
function starCurrentSession() {
  if (!popAIId || !popSessId) return;
  starSession(popAIId, popSessId);
  // Actualizar botón en popup sin cerrarlo
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  const starBtn = document.getElementById('pop-star-btn');
  if (starBtn && s) { starBtn.textContent = s.starred ? '⭐' : '☆'; starBtn.classList.toggle('starred', !!s.starred); starBtn.title = s.starred ? 'Quitar destacado' : 'Destacar sesión'; }
  // T-202604-004: refrescar badge starred en header
  const metaEl = document.getElementById('pop-meta');
  if (metaEl && s) {
    const starBadge = s.starred ? `<span class="pop-header-badge starred">⭐ destacada</span>` : '';
    const quickBadge = s.quickCapture ? `<span class="pop-header-badge quick">⚡ rápida</span>` : '';
    metaEl.innerHTML = `<span>${s.date}${s.resetAt ? ' · hasta ' + s.resetAt : ''}</span>${starBadge}${quickBadge}`;
  }
  showToast('info', s?.starred ? 'Sesión destacada' : 'Destacado quitado');
}

// B-006: Hora de reset desde popup
function popParseHora() {
  const raw = (document.getElementById('pop-reset-hora') || {value:''}).value.replace(/\D/g,'');
  const disp = document.getElementById('pop-reset-disp');
  if (!disp) return;
  const result = interpretHora(raw);
  if (result) {
    disp.textContent = result.label;
    disp.className = 'hora-disp--valid';
  } else {
    disp.textContent = raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—');
    disp.className = raw.length >= 3 ? 'hora-disp--error' : 'hora-disp--hint';
  }
}

function saveResetFromPopup() {
  if (!popAIId || !popSessId) return;
  const raw = (document.getElementById('pop-reset-hora') || {value:''}).value.replace(/\D/g,'');
  const result = interpretHora(raw);
  const ai = getAI(popAIId);
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!ai || !s) return;
  const horaStr = result ? result.label : '';
  s.resetAt = horaStr;
  if (result) {
    ai.status = 'exhausted';
    ai.resetTime = result.hhmm;
    ai.resetEpoch = result.epoch;
  } else {
    // Sin hora: marcar agotada sin countdown
    ai.status = 'exhausted';
    ai.resetTime = '';
    ai.resetEpoch = null;
  }
  save(); render();
  if (currentTab === 'hoy') renderHoy();
  closePopup();
  showToast('success', result ? `${ai.name} marcada agotada · desbloquea a las ${result.label}` : `${ai.name} marcada agotada`);
}

// Preview panel — cambio de proyecto de sesión ya guardada
// T-202605-472: confirm inline antes de mutar projectId desde el select del detalle de sesión
function _previewProjConfirmChange(aiId, sessId, selectEl) {
  const newProjId  = selectEl.value;
  const prevProjId = (() => {
    for (const p of (state.projects || [])) {
      if ((p.sessions || []).some(x => x.id === sessId)) return p.id;
    }
    return '';
  })();

  if (newProjId === prevProjId) return; // sin cambio real

  const newProj = (state.projects || []).find(p => p.id === newProjId);
  const projName = newProj ? `${newProj.icon || '📁'} ${newProj.name}` : 'sin proyecto';

  // Usar el confirm inline de la app si está disponible, sino confirm nativo como fallback
  if (typeof showToastInline === 'function') {
    // Guardar referencia para confirmar/cancelar
    selectEl.dataset.pendingProj = newProjId;
    selectEl.dataset.prevProj    = prevProjId;
    showToastInline(
      selectEl,
      `¿Mover a ${projName}?`,
      [
        { label: 'Confirmar', cls: 'btn-confirm', cb: () => {
            savePreviewProject(aiId, sessId, newProjId);
            delete selectEl.dataset.pendingProj;
          }
        },
        { label: 'Cancelar',  cls: 'btn-cancel',  cb: () => {
            selectEl.value = prevProjId;
            delete selectEl.dataset.pendingProj;
          }
        }
      ]
    );
  } else {
    // Fallback: confirm nativo
    if (window.confirm(`¿Cambiar proyecto a "${projName}"?`)) {
      savePreviewProject(aiId, sessId, newProjId);
    } else {
      selectEl.value = prevProjId;
    }
  }
}

function savePreviewProject(aiId, sessId, newProjId) {
  if (!newProjId) return;
  const projects = state.projects || [];
  // Encontrar proyecto origen (donde vive la sesión)
  let fromProj = null, sess = null;
  for (const p of projects) {
    const idx = (p.sessions || []).findIndex(x => x.id === sessId);
    if (idx !== -1) { fromProj = p; sess = p.sessions[idx]; break; }
  }
  if (!sess) return;
  const toProj = projects.find(p => p.id === newProjId);
  if (!toProj) return;
  if (fromProj && fromProj.id === newProjId) return; // sin cambio
  // Mover sesión al nuevo proyecto
  if (fromProj) fromProj.sessions = (fromProj.sessions || []).filter(x => x.id !== sessId);
  if (!toProj.sessions) toProj.sessions = [];
  toProj.sessions.push(sess);
  save(); render();
  showToast('success', `Sesión movida a ${esc(toProj.icon || '📁')} ${esc(toProj.name)}`);
}

// B-202604-094: corrección de hora desde popup (IA agotada)
function popCorrectParseHora() {
  const raw = (document.getElementById('pop-correct-hora') || {value:''}).value.replace(/\D/g,'');
  const disp = document.getElementById('pop-correct-disp');
  if (!disp) return;
  const result = interpretHora(raw);
  if (result) {
    disp.textContent = result.label;
    disp.className = 'hora-disp--valid';
  } else {
    disp.textContent = raw.length >= 3 ? 'hora inválida' : (raw.length ? '...' : '—');
    disp.className = raw.length >= 3 ? 'hora-disp--error' : 'hora-disp--hint';
  }
}

function saveCorrectHoraFromPopup() {
  if (!popAIId || !popSessId) return;
  const raw = (document.getElementById('pop-correct-hora') || {value:''}).value.replace(/\D/g,'');
  const result = interpretHora(raw);
  if (!result) { showToast('error', 'Hora inválida — ingresa formato HHMM (ej: 2100)'); return; }
  const ai = getAI(popAIId);
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!ai || !s) return;
  ai.resetTime = result.hhmm;
  ai.resetEpoch = result.epoch;
  s.resetAt = result.label;
  save(); render();
  if (currentTab === 'hoy') renderHoy();
  closePopup();
  showToast('success', `Hora corregida · ${ai.name} desbloquea a las ${result.label}`);
}



function unlockNowFromPopup() {
  if (!popAIId) return;
  const ai = getAI(popAIId);
  if (!ai) return;
  ai.status = 'available';
  ai.resetTime = '';
  ai.resetEpoch = null;
  save(); render();
  if (currentTab === 'hoy') renderHoy();
  closePopup();
  showToast('success', `${ai.name} marcada como disponible`);
}

// Genera el HTML interior de la sección de vínculos en el popup
function renderBacklogRefs(s) {
  const refs = s.trackerRefs || [];
  let html = '';

  // Ítems vinculados — fila con código + descripción + status + desvincular
  if (refs.length) {
    refs.forEach(code => {
      const type = code[0] || '';
      const item = typeof ITEMS !== 'undefined' ? ITEMS.find(i => i.code === code) : null;
      const desc = item ? item.title : '—';
      const status = item ? item.status : '';
      const statusLabel = {'pendiente':'Pendiente','done':'Hecho'}[status] || status;
      html += `<div class="popup-tg-row">
        <span class="popup-tg-badge ${type}">${type}</span>
        <button class="popup-tg-code popup-tg-code--link" onclick="navigateToBacklogItem('${esc(code)}')" title="Ir al ítem en Backlog">${esc(code)}</button>
        <span class="popup-tg-desc">${esc(desc)}</span>
        <span class="popup-tg-status">${esc(statusLabel)}</span>
        <button class="popup-ref-unlink" onclick="unlinkBacklogItem('${esc(code)}')" title="Desvincular">✕</button>
      </div>`;
    });
  } else {
    html += '<div class="popup-ref-empty">Sin ítems vinculados.</div>';
  }

  // Selector — vacío si no hay backlog importado
  if (typeof ITEMS === 'undefined' || !ITEMS.length) {
    html += `<div class="popup-ref-empty">Importa tu <code>Backlog.md</code> para vincular ítems.</div>`;
  } else {
    html += `<input class="popup-ref-search" id="pop-ref-input" type="text" placeholder="Buscar por código o título..." oninput="onPopupRefSearch()" autocomplete="off">`;
    html += `<div class="popup-ref-suggestions" id="pop-ref-suggestions"></div>`;
  }

  return html;
}

// Re-renderiza solo la sección de refs sin cerrar el popup
function refreshPopupRefs() {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;
  const section = document.getElementById('pop-refs-section');
  if (!section) return;
  // Conservar query actual del input
  const inputVal = (document.getElementById('pop-ref-input') || {}).value || '';
  section.innerHTML = '<div class="popup-section-label">🔗 Backlog vinculado</div>' + renderBacklogRefs(s);
  // Restaurar query y re-filtrar
  const inp = document.getElementById('pop-ref-input');
  if (inp) { inp.value = inputVal; onPopupRefSearch(); }
}

// Filtra ITEMS según query y muestra sugerencias en el popup
function onPopupRefSearch() {
  const inp = document.getElementById('pop-ref-input');
  const sugEl = document.getElementById('pop-ref-suggestions');
  if (!inp || !sugEl) return;
  const q = inp.value.toLowerCase().trim();
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  const refs = s ? (s.trackerRefs || []) : [];

  if (!q) { sugEl.innerHTML = ''; return; }

  if (typeof ITEMS === 'undefined') { sugEl.innerHTML = ''; return; }
  const matches = ITEMS.filter(i =>
    !refs.includes(i.code) && (
      i.code.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q)
    )
  ).slice(0, 8);

  if (!matches.length) {
    sugEl.innerHTML = '<div class="popup-ref-empty">Sin resultados.</div>';
    return;
  }

  sugEl.innerHTML = matches.map(i => {
    const type = (i.code[0] || '');
    return `<div class="popup-ref-suggestion" onclick="linkBacklogItem('${esc(i.code)}')">
      <span class="popup-tg-badge ${type}">${type}</span>
      <span class="popup-ref-code">${esc(i.code)}</span>
      <span class="popup-ref-title">${esc(i.title)}</span>
    </div>`;
  }).join('');
}

// Vincula un código de backlog a la sesión actual
function linkBacklogItem(code) {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;
  if (!s.trackerRefs) s.trackerRefs = [];
  if (s.trackerRefs.includes(code)) return;
  s.trackerRefs.push(code);
  // B-246 + B-245: registrar en history[] del ítem con aiId de la sesión
  if (typeof ITEMS !== 'undefined') {
    const item = ITEMS.find(i => i.code === code);
    if (item) {
      if (!item.history) item.history = [];
      item.history.push({ type: 'session-linked', ts: Date.now(), aiId: popAIId, data: { sessId: popSessId } });
    }
  }
  save();
  refreshPopupRefs();
  showToast('success', `${code} vinculado`);
}

// Desvincula un código de backlog de la sesión actual
function unlinkBacklogItem(code) {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;
  s.trackerRefs = (s.trackerRefs || []).filter(c => c !== code);
  // B-246 + B-245: registrar en history[] del ítem con aiId de la sesión
  if (typeof ITEMS !== 'undefined') {
    const item = ITEMS.find(i => i.code === code);
    if (item) {
      if (!item.history) item.history = [];
      item.history.push({ type: 'session-unlinked', ts: Date.now(), aiId: popAIId, data: { sessId: popSessId } });
    }
  }
  save();
  refreshPopupRefs();
  showToast('success', `${code} desvinculado`);
}

// ── T-202604-025: Edición inline de sesión ──
function startPopupEdit(field) {
  if (!popAIId || !popSessId) return;
  const found = _findSession(popSessId);
  const s = found ? found.sess : null;
  if (!s) return;

  let el, currentVal, inputTag;
  if (field === 'title') {
    el = document.getElementById('pop-title-wrap');
    currentVal = s.title || '';
    inputTag = 'input';
  } else if (field === 'summary') {
    el = document.getElementById('pop-field-summary');
    currentVal = s.summary || '';
    inputTag = 'textarea';
  } else if (field === 'pending') {
    el = document.getElementById('pop-field-pending');
    currentVal = s.pending || '';
    inputTag = 'textarea';
  } else return;

  if (!el || el.classList.contains('editing')) return;
  el.classList.add('editing');

  const rows = inputTag === 'textarea' ? Math.max(3, (currentVal.match(/\n/g)||[]).length + 2) : null;
  const inputEl = document.createElement(inputTag);
  inputEl.className = 'pop-inline-input';
  inputEl.value = currentVal;
  if (inputTag === 'textarea') { inputEl.rows = rows; }

  const hint = document.createElement('div');
  hint.className = 'pop-edit-hint';
  hint.textContent = 'Enter confirma · Escape cancela' + (inputTag === 'textarea' ? ' · Shift+Enter nueva línea' : '');

  el.innerHTML = '';
  el.appendChild(inputEl);
  el.appendChild(hint);
  inputEl.focus();
  if (inputTag === 'input') { inputEl.select(); }

  let done = false;

  function commit() {
    if (done) return; done = true;
    const newVal = inputEl.value.trim();
    if (newVal !== currentVal) {
      s[field] = newVal;
      save();
      render();
      showToast('success', 'Sesión actualizada');
    }
    openDetail(popAIId, popSessId);
  }

  function cancel() {
    if (done) return; done = true;
    openDetail(popAIId, popSessId);
  }

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    else if (e.key === 'Enter' && (inputTag === 'input' || !e.shiftKey)) { e.preventDefault(); commit(); }
  });

  // blur dispara después de keydown — el flag `done` previene doble ejecución
  inputEl.addEventListener('blur', function() {
    setTimeout(() => { if (!done) commit(); }, 150);
  });
}

function startRename(id) {
  const ai = getAI(id);
  const el = document.getElementById('name-' + id);
  if (!el) return;
  const inp = document.createElement('input');
  inp.className = 'card-name-input'; inp.value = ai.name;
  el.replaceWith(inp); inp.focus(); inp.select();
  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = inp.value.trim();
    if (!newName) {
      showToast('warning', 'El nombre no puede estar vacío');
      render(); return;
    }
    // T-092: validar duplicados case-insensitive (excluir la propia IA)
    const nameLower = newName.toLowerCase();
    const duplicate = state.ais.find(a => a.id !== id && a.name.toLowerCase() === nameLower);
    if (duplicate) {
      showToast('warning', `Ya existe una IA llamada "${duplicate.name}"`);
      render(); return;
    }
    ai.name = newName;
    save(); render();
  };
  const cancel = () => { if (committed) return; committed = true; render(); };
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { inp.removeEventListener('blur', commit); cancel(); }
  });
}


// ── T-031: Notas libres por IA ──
function editNotes(id) {
  const ai = getAI(id);
  const wrap = document.getElementById('notes-wrap-' + id);
  if (!wrap) return;
  const ta = document.createElement('textarea');
  ta.className = 'card-notes-ta';
  ta.value = ai.notes || '';
  ta.placeholder = 'Notas libres sobre esta IA o proyecto...';
  const actions = document.createElement('div');
  actions.className = 'card-notes-actions';
  actions.innerHTML = `
    <button class="card-notes-save" onclick="saveNotes('${id}')">Guardar</button>
    <button class="card-notes-cancel" onclick="cancelNotes('${id}')">Cancelar</button>`;
  wrap.innerHTML = '';
  wrap.appendChild(ta);
  wrap.appendChild(actions);
  // Store textarea ref for save/cancel
  wrap._ta = ta;
  ta.focus();
  // Auto-resize
  ta.addEventListener('input', () => { ta.style.setProperty('--ta-height', 'auto'); ta.style.setProperty('--ta-height', ta.scrollHeight + 'px'); });
}

function saveNotes(id) {
  const ai = getAI(id);
  const wrap = document.getElementById('notes-wrap-' + id);
  if (!wrap || !wrap._ta) return;
  ai.notes = wrap._ta.value.trim();
  save();
  renderNotesDisplay(id);
}

function cancelNotes(id) {
  renderNotesDisplay(id);
}

function renderNotesDisplay(id) {
  const ai = getAI(id);
  const wrap = document.getElementById('notes-wrap-' + id);
  if (!wrap) return;
  const val = ai.notes || '';
  if (val) {
    wrap.innerHTML = `
      <div class="card-notes-text" id="notes-text-${id}" onclick="editNotes('${id}')" title="Click para editar notas">${esc(val)}</div>
      <span class="card-notes-toggle" id="notes-toggle-${id}" onclick="toggleNotes('${id}')"></span>`;
    // Verificar si hay overflow para mostrar toggle
    setTimeout(() => checkNotesOverflow(id), 50);
  } else {
    wrap.innerHTML = `<div class="card-notes-text empty-notes" id="notes-text-${id}" onclick="editNotes('${id}')" title="Agregar notas">+ notas libres</div>`;
  }
}

function checkNotesOverflow(id) {
  const textEl = document.getElementById('notes-text-' + id);
  const toggleEl = document.getElementById('notes-toggle-' + id);
  if (!textEl || !toggleEl) return;
  const isOverflowing = textEl.scrollHeight > textEl.clientHeight + 2;
  toggleEl.classList.toggle('hidden', !isOverflowing); toggleEl.classList.toggle('d-inline-block', isOverflowing);
  if (isOverflowing) toggleEl.textContent = '▾ ver más';
}

// ─── R-202604-016: Log de Sesiones ────────────────────────────────────────────

// Persistencia de filtros
const LOG_FILTER_KEY = 'log-filter-state';
function _saveLogFilters() {
  try {
    localStorage.setItem(LOG_FILTER_KEY, JSON.stringify({
      ai: _logFilterAI,
      type: _logFilterType,
      // proj no se persiste — se toma del filtro global activo
      starred: _logFilterStarred,
    }));
  } catch(e) {}
}
function _loadLogFilters() {
  try {
    const raw = localStorage.getItem(LOG_FILTER_KEY);
    if (!raw) return;
    const f = JSON.parse(raw);
    _logFilterAI      = f.ai      || '';
    _logFilterType    = f.type    || 'all';
    // _logFilterProj se toma del filtro global activo del header — no se persiste
    _logFilterStarred = !!f.starred;
  } catch(e) {}
}

// Estado del log card
let _logFilterAI      = '';     // aiId activo o ''
let _logFilterType    = 'all';  // 'all' | 'session' | 'quick' | 'interrupted'
let _logFilterProj    = '';     // projId activo o ''
let _logFilterStarred = false;  // solo starred
let _logSearch        = '';
let _logScrollHandler = null;   // B-202605-053: referencia de módulo — sobrevive card.innerHTML

// Recopila todas las sesiones de todos los proyectos, cronológicas inversas
function _getAllSessionsChron() {
  const rows = [];
  (state.projects || []).forEach(proj => {
    (proj.sessions || []).forEach(s => {
      const ai = (state.ais || []).find(a => a.id === s.aiId) || null;
      rows.push({ sess: s, proj, ai });
    });
  });
  rows.sort((a, b) => parseInt(b.sess.id) - parseInt(a.sess.id));
  return rows;
}

// Construye la lista de IAs que tienen sesiones (para los pills de filtro)
function _logAIList() {
  const seen = new Map();
  _getAllSessionsChron().forEach(({ ai }) => {
    if (ai && !seen.has(ai.id)) seen.set(ai.id, ai);
  });
  return [...seen.values()];
}

// Tipo de sesión
function _sessType(s) {
  if (s.interrupted) return 'interrupted';
  if (s.quickCapture) return 'quick';
  return 'session';
}

function _sessTypeLabel(s) {
  const t = _sessType(s);
  if (t === 'quick') return 'quick';
  if (t === 'interrupted') return 'interrumpida';
  if (s.starred) return 'destacada';
  return 'sesión';
}

function _sessTypePill(s) {
  const t = _sessType(s);
  if (t === 'quick') return '<span class="log-pill log-pill--quick">⚡ quick</span>';
  if (t === 'interrupted') return '<span class="log-pill log-pill--interrupted">⚡ interrumpida</span>';
  if (s.starred) return '<span class="log-pill log-pill--starred">⭐ destacada</span>';
  return '<span class="log-pill log-pill--normal">sesión</span>';
}

// Renderiza el header del log card (pills IA + pills tipo + buscador + contador)
function _buildLogHeader(total, filtered) {
  const aiList = _logAIList();
  const projList = (state.projects || []);

  const aiPills = aiList.map(ai => {
    const active = _logFilterAI === ai.id ? ' log-ai-pill--active' : '';
    const color = ai.color ? ai.color : '';
    // B-202605-020: color aplicado como data-color — nunca interpolado como atributo sin nombre
    const colorAttr = color ? `data-color="${esc(color)}" style="--ai-pill-color:${esc(color)}"` : '';
    return `<button class="log-ai-pill${active}" ${colorAttr} onclick="setLogFilterAI('${ai.id}')" title="${esc(ai.name)}">${esc(ai.name)}</button>`;
  }).join('');

  const typePills = [
    { key: 'all',         label: 'Todas' },
    { key: 'session',     label: 'Sesión' },
    { key: 'quick',       label: 'Quick' },
    { key: 'interrupted', label: 'Interrumpida' },
  ].map(({ key, label }) =>
    `<button class="log-type-pill${_logFilterType === key ? ' log-type-pill--active' : ''}" onclick="setLogFilterType('${key}')">${label}</button>`
  ).join('');

  const starredPill = `<button class="log-type-pill${_logFilterStarred ? ' log-type-pill--active' : ''}" onclick="setLogFilterStarred()" title="Solo destacadas">⭐</button>`;

  const projOptions = projList.map(p =>
    `<option value="${esc(p.id)}"${_logFilterProj === p.id ? ' selected' : ''}>${esc((p.icon || '📁') + ' ' + p.name)}</option>`
  ).join('');
  const projSelect = projList.length
    ? `<select class="log-proj-select" onchange="setLogFilterProj(this.value)">
        <option value="">Todos los proyectos</option>
        ${projOptions}
       </select>`
    : '';

  const countLabel = filtered < total ? `${filtered} / ${total}` : `${total}`;

  return `
    <div class="log-card-header">
      <div class="log-card-title-row">
        <span class="log-card-title">📋 Log de sesiones</span>
        <span class="log-card-count" id="log-count">${countLabel}</span>
        <button class="log-card-close" onclick="closeLogCard()" title="Cerrar (ESC)">✕</button>
      </div>
      <input class="log-search-input" id="log-search-input" type="text" placeholder="🔍 Buscar título o resumen…"
        value="${esc(_logSearch)}" oninput="onLogSearch()" autocomplete="off">
      <div class="log-filters-row">
        <div class="log-ai-pills" id="log-ai-pills">${aiPills || '<span class="log-hint">Sin sesiones</span>'}</div>
        <div class="log-type-pills">${typePills}${starredPill}</div>
      </div>
    </div>`;
}

// Renderiza una fila del log
function _buildLogRow({ sess, proj, ai }) {
  if (!ai) return '';
  const color = ai.color || 'var(--accent)';
  const aiName = ai.name || '—';
  const projName = proj ? (proj.icon || '📁') + ' ' + proj.name : '';
  const summarySnippet = sess.summary ? esc(sess.summary.slice(0, 120)) + (sess.summary.length > 120 ? '…' : '') : '';
  const typePill = _sessTypePill(sess);

  // trackerRefs pills
  const refs = (sess.trackerRefs || []);
  const refPills = refs.length
    ? refs.slice(0, 4).map(code => {
        const t = code[0]; // P T R B
        const cls = t === 'T' ? 'log-ref--t' : t === 'P' ? 'log-ref--p' : t === 'R' ? 'log-ref--r' : t === 'B' ? 'log-ref--b' : '';
        return `<button class="log-ref log-ref--link ${cls}" onclick="event.stopPropagation();navigateToBacklogItem('${esc(code)}')" title="Ir al ítem en Backlog">${esc(code)}</button>`;
      }).join('') + (refs.length > 4 ? `<span class="log-ref log-ref--more">+${refs.length - 4}</span>` : '')
    : '';

  // quickCapture indicator
  const qcBadge = sess.quickCapture ? '<span class="log-qc-badge" title="Quick capture">⚡</span>' : '';

  // R-202605-162: timestamp relativo bajo el título — usa helper compartido
  const tsLabel = (typeof _sessRelTsShared === 'function') ? _sessRelTsShared(sess) : (sess.dateShort || '');
  const tsMeta = tsLabel ? `<span class="log-row-ts">${esc(tsLabel)}</span>` : '';

  return `
    <div class="log-row" id="log-row-${esc(sess.id)}" onclick="openDetail('${esc(ai.id)}','${esc(sess.id)}')" title="Ver detalle">
      <div class="log-row-left">
        <span class="log-ai-dot" style="--ai-dot-color:${color}"></span>
      </div>
      <div class="log-row-body">
        <div class="log-row-top">
          <span class="log-ai-name" style="--ai-name-color:${color}">${esc(aiName)}</span>
          ${projName ? `<span class="log-proj-name">${esc(projName)}</span>` : ''}
          ${typePill}
          ${qcBadge}
          <span class="log-row-date">${esc(sess.dateShort || '')}</span>
        </div>
        <div class="log-row-title">${esc(sess.title)}</div>
        ${tsMeta ? `<div class="log-row-ts-line">${tsMeta}</div>` : ''}
        ${summarySnippet ? `<div class="log-row-summary">${summarySnippet}</div>` : ''}
        ${refPills ? `<div class="log-row-refs">${refPills}</div>` : ''}
      </div>
    </div>`;
}

// Construye y actualiza el cuerpo del log card
function _rebuildLogBody() {
  const card = document.getElementById('log-card');
  if (!card) return;

  // Proyecto activo siempre del filtro global del header
  const activeProjId = (typeof _getActiveProjectFilter === 'function') ? _getActiveProjectFilter() : '';

  const all = _getAllSessionsChron();
  const q = _logSearch.toLowerCase();

  const filtered = all.filter(({ sess, ai, proj }) => {
    if (_logFilterAI && (!ai || ai.id !== _logFilterAI)) return false;
    if (activeProjId && (!proj || proj.id !== activeProjId)) return false;
    if (_logFilterStarred && !sess.starred) return false;
    if (_logFilterType !== 'all') {
      if (_logFilterType === 'session' && _sessType(sess) !== 'session') return false;
      if (_logFilterType === 'quick' && !sess.quickCapture) return false;
      if (_logFilterType === 'interrupted' && !sess.interrupted) return false;
    }
    if (q && !sess.title.toLowerCase().includes(q) && !(sess.summary || '').toLowerCase().includes(q) &&
        !(sess.decision || '').toLowerCase().includes(q) && !(sess.contexto || '').toLowerCase().includes(q) &&
        !(sess.bloqueantes || '').toLowerCase().includes(q) && !(sess.aprendizaje || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const hasSearch = !!q;
  const hasFilterAI = !!_logFilterAI;
  const hasFilterProj = !!activeProjId;
  const hasFilterStarred = !!_logFilterStarred;
  const hasFilterType = _logFilterType !== 'all';
  const hasActiveFilter = hasSearch || hasFilterAI || hasFilterProj || hasFilterStarred || hasFilterType;

  const header = _buildLogHeader(all.length, filtered.length);
  const rows = filtered.map(r => _buildLogRow(r)).join('');

  // B-256: empty state diferenciado por causa
  let emptyHtml = '';
  if (!filtered.length) {
    if (!all.length) {
      // Causa (a): nunca hubo sesiones
      emptyHtml = `<div class="log-empty log-empty--never">
        <span class="log-empty-icon">📋</span>
        <span class="log-empty-msg">Sin sesiones registradas</span>
        <span class="log-empty-hint">Pega un CHECKPOINT en la card de una IA para registrar tu primera sesión.</span>
      </div>`;
    } else if (hasSearch) {
      // Causa (c): búsqueda sin coincidencias
      emptyHtml = `<div class="log-empty log-empty--search">
        <span class="log-empty-icon">🔍</span>
        <span class="log-empty-msg">Sin resultados para «${esc(q)}»</span>
        <button class="log-empty-cta" onclick="clearLogFilters()">Limpiar búsqueda</button>
      </div>`;
    } else {
      // Causa (b): filtros activos sin resultados
      emptyHtml = `<div class="log-empty log-empty--filter">
        <span class="log-empty-icon">⚠️</span>
        <span class="log-empty-msg">Sin sesiones con los filtros activos</span>
        <button class="log-empty-cta" onclick="clearLogFilters()">Limpiar filtros</button>
      </div>`;
    }
  }

  // B-257: marcar pills/controles con advertencia cuando filtros activos producen cero resultados
  // Se aplica post-render via clase en el header — _rebuildLogBody re-inyecta el header completo
  // La clase log-filters-row--warn se aplica al wrapper de filtros cuando hay cero resultados con filtros activos
  const filtersWarnClass = (!filtered.length && hasActiveFilter && all.length) ? ' log-filters-row--warn' : '';

  const body = filtered.length ? rows : emptyHtml;
  const scrollTopBtn = `<button class="log-scroll-top hidden" id="log-scroll-top" onclick="_logScrollTop()" title="Ir al inicio">↑</button>`;

  // Inyectar warn class en log-filters-row post-render
  const headerWithWarn = filtersWarnClass
    ? header.replace('class="log-filters-row"', `class="log-filters-row${filtersWarnClass}"`)
    : header;

  card.innerHTML = `${headerWithWarn}<div class="log-card-body" id="log-body">${body}</div>${scrollTopBtn}`;

  // Scroll-to-top button visibility
  // B-202605-053: variable de módulo _logScrollHandler — card.innerHTML destruye #log-body en cada
  // render, por lo que guardar la referencia en el elemento DOM deja el handler huérfano.
  const logBody = document.getElementById('log-body');
  const scrollBtn = document.getElementById('log-scroll-top');
  if (logBody && scrollBtn) {
    if (_logScrollHandler) {
      logBody.removeEventListener('scroll', _logScrollHandler);
    }
    _logScrollHandler = () => {
      scrollBtn.classList.toggle('hidden', logBody.scrollTop <= 120);
      scrollBtn.classList.toggle('d-flex', logBody.scrollTop > 120);
    };
    logBody.addEventListener('scroll', _logScrollHandler, { passive: true });
  }
}

function _logScrollTop() {
  const body = document.getElementById('log-body');
  if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToLogCard(highlightSessId) {
  if (currentTab !== 'tracker') switchTab('tracker');

  const grid = document.getElementById('grid');
  const detailEmpty = document.getElementById('tracker-detail-empty');
  const card = document.getElementById('log-card');

  if (grid) grid.classList.add('hidden');
  if (detailEmpty) detailEmpty.classList.add('hidden');
  if (card) card.classList.remove('hidden');

  _rebuildLogBody();

  requestAnimationFrame(() => {
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (highlightSessId) {
      const row = document.getElementById('log-row-' + highlightSessId);
      if (row) {
        row.classList.add('log-row--highlight');
        setTimeout(() => row.classList.remove('log-row--highlight'), 1800);
      }
    }
  });
}

function closeLogCard() {
  const grid = document.getElementById('grid');
  const detailEmpty = document.getElementById('tracker-detail-empty');
  const card = document.getElementById('log-card');

  if (card) card.classList.add('hidden');
  if (grid) grid.classList.remove('hidden');
  if (detailEmpty) detailEmpty.classList.remove('hidden');
}

function setLogFilterAI(aiId) {
  _logFilterAI = _logFilterAI === aiId ? '' : aiId;
  _saveLogFilters();
  _rebuildLogBody();
}

function setLogFilterType(type) {
  _logFilterType = type;
  _saveLogFilters();
  _rebuildLogBody();
}

function setLogFilterProj(projId) {
  _logFilterProj = projId;
  _saveLogFilters();
  _rebuildLogBody();
}

function setLogFilterStarred() {
  _logFilterStarred = !_logFilterStarred;
  _saveLogFilters();
  _rebuildLogBody();
}

// B-256: reset completo de filtros del log — CTA del empty state
function clearLogFilters() {
  _logFilterAI      = '';
  _logFilterType    = 'all';
  _logFilterStarred = false;
  _logSearch        = '';
  _saveLogFilters();
  const inp = document.getElementById('log-search-input');
  if (inp) inp.value = '';
  _rebuildLogBody();
}

function onLogSearch() {
  const inp = document.getElementById('log-search-input');
  _logSearch = inp ? inp.value : '';
  _rebuildLogBody();
}

// Hook: parchear render() global para que siempre reconstruya el log card.
// Se ejecuta tras window.onload, momento en que todos los módulos JS ya están cargados.
window.addEventListener('load', function() {
  // Restaurar filtros persistidos
  _loadLogFilters();

  const _origRender = typeof render === 'function' ? render : null;
  if (_origRender) {
    window.render = function() {
      _origRender.apply(this, arguments);
      _rebuildLogBody();
    };
  }

  // Cerrar log card al navegar a una IA
  const _origNav = typeof navigateToCard === 'function' ? navigateToCard : null;
  if (_origNav) {
    window.navigateToCard = function() {
      closeLogCard();
      _origNav.apply(this, arguments);
    };
  }

  // ESC para cerrar log card
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const card = document.getElementById('log-card');
      if (card && !card.classList.contains('hidden')) {
        closeLogCard();
      }
    }
  });

  // Click fuera del log card cierra — usar captura en el card para detener propagación interna
  document.addEventListener('click', function(e) {
    const card = document.getElementById('log-card');
    if (!card || card.classList.contains('hidden')) return;
    // Si el target ya fue removido del DOM (ej: _rebuildLogBody hizo innerHTML), no cerrar
    if (!document.contains(e.target)) return;
    // Si el click fue dentro del log-card, no cerrar
    if (card.contains(e.target)) return;
    // El log card vive dentro de #tracker-detail — solo cerrar si click fuera de ese contenedor
    const container = document.getElementById('tracker-detail') || card.parentElement;
    if (container && !container.contains(e.target)) {
      // Verificar que no sea el botón que abre el log
      const logBtn = document.querySelector('.tsb-log-btn');
      if (logBtn && logBtn.contains(e.target)) return;
      closeLogCard();
    }
  });

  // Ocultar log card por defecto al iniciar
  const card = document.getElementById('log-card');
  if (card) card.classList.add('hidden');

  _rebuildLogBody();
});

// R-202604-021: Navegar a un ítem del backlog por código
function navigateToBacklogItem(code) {
  if (!code) return;
  switchTab('backlog');
  if (typeof switchSubTab === 'function') switchSubTab('backlog');
  // Esperar a que el tab y la lista rendericen antes de scrollear
  setTimeout(() => {
    const el = document.querySelector(`.bitem[data-code="${CSS.escape(code)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('bitem--nav-highlight');
    setTimeout(() => el.classList.remove('bitem--nav-highlight'), 1800);
  }, 120);
}
