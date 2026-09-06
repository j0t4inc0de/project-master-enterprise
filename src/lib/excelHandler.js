import ExcelJS from 'exceljs';

/**
 * Descarga una plantilla de ejemplo para importación
 */
export const downloadExampleTemplate = async () => {
  const exampleTasks = [
    { id: 1, level: 1, name: '1. Obras Preliminares', duration: 0, startDate: '2026-09-01', predecessors: '', cost: 0, progress: 0 },
    { id: 2, level: 2, name: 'Instalación de Faenas', duration: 5, startDate: '2026-09-01', predecessors: '', cost: 250000, progress: 0 },
    { id: 3, level: 2, name: 'Trazado y Niveles', duration: 3, startDate: '2026-09-08', predecessors: '2', cost: 120000, progress: 0 },
    { id: 4, level: 1, name: '2. Obra Gruesa', duration: 0, startDate: '2026-09-11', predecessors: '', cost: 0, progress: 0 },
    { id: 5, level: 2, name: 'Excavaciones', duration: 8, startDate: '2026-09-11', predecessors: '3', cost: 450000, progress: 0 },
  ];
  const exampleResources = [
    { id: 1, name: 'Cuadrilla de Carpintería', type: 'Trabajo', unit: 'Hrs', initials: 'CARP', group: 'Mano de Obra', capacity: 100, rate: 12000, costPerUse: 0, accrual: 'Prorrateo' },
    { id: 2, name: 'Hormigón H25', type: 'Material', unit: 'm3', initials: 'H25', group: 'Materiales', capacity: 100, rate: 78000, costPerUse: 0, accrual: 'Prorrateo' },
  ];
  await exportProjectToExcel({ projectName: 'Plantilla_Ejemplo_Obra', tasks: exampleTasks, resources: exampleResources });
};

/**
 * Exporta el proyecto completo a un archivo Excel (.xlsx) con formato profesional
 */
export const exportProjectToExcel = async (projectData) => {
  const { projectName, tasks = [], resources = [] } = projectData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Project Master Enterprise';
  workbook.created = new Date();

  // 1. Hoja de Partidas / Carta Gantt
  const ganttSheet = workbook.addWorksheet('Partidas Gantt', {
    properties: { tabColor: { argb: 'FF3B82F6' } },
  });

  ganttSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Nivel WBS', key: 'level', width: 12 },
    { header: 'Descripción de la Partida', key: 'name', width: 40 },
    { header: 'Duración (días)', key: 'duration', width: 16 },
    { header: 'Inicio (ES)', key: 'startDate', width: 14 },
    { header: 'Fin (EF)', key: 'endDate', width: 14 },
    { header: 'Predecesoras', key: 'predecessors', width: 15 },
    { header: 'Demora Inicio', key: 'startDelay', width: 14 },
    { header: 'Demora Fin', key: 'finishDelay', width: 14 },
    { header: 'Recurso Asignado', key: 'resource', width: 22 },
    { header: 'Estado', key: 'manualStatus', width: 14 },
    { header: '% Avance', key: 'progress', width: 12 },
    { header: 'Costo ($ CLP)', key: 'cost', width: 16 },
  ];

  // Estilo cabecera
  const headerRow = ganttSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  // Llenar datos de tareas
  tasks.forEach((t) => {
    const res = resources.find((r) => r.id === t.resourceId || String(r.id) === String(t.resourceId));
    const row = ganttSheet.addRow({
      id: t.id,
      level: t.level || 1,
      name: `${'  '.repeat((t.level || 1) - 1)}${t.name}`,
      duration: t.duration || 0,
      startDate: t.ES || t.startDate || '-',
      endDate: t.EF || '-',
      predecessors: t.predecessors || '',
      startDelay: t.startDelay || 0,
      finishDelay: t.finishDelay || 0,
      resource: res ? `${res.name} (${res.initials})` : 'N/A',
      manualStatus: t.manualStatus || 'AUTO',
      progress: (t.progress || 0) / 100,
      cost: t.cost || 0,
    });

    if (t.isP) {
      row.font = { bold: true, color: { argb: 'FFB45309' } };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFDF6B2' },
      };
    }

    row.getCell('progress').numFmt = '0%';
    row.getCell('cost').numFmt = '$#,##0';
  });

  // 2. Hoja de Pool de Recursos
  const resSheet = workbook.addWorksheet('Pool de Recursos', {
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  resSheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Descripción del Recurso', key: 'name', width: 30 },
    { header: 'Tipo', key: 'type', width: 14 },
    { header: 'U.M.', key: 'unit', width: 10 },
    { header: 'Iniciales', key: 'initials', width: 12 },
    { header: 'Grupo', key: 'group', width: 18 },
    { header: 'Capacidad Máx (%)', key: 'capacity', width: 18 },
    { header: 'Tarifa Est. ($/UM)', key: 'rate', width: 18 },
    { header: 'Costo x Uso ($)', key: 'costPerUse', width: 16 },
    { header: 'Acumulación', key: 'accrual', width: 14 },
  ];

  const resHeaderRow = resSheet.getRow(1);
  resHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  resHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF065F46' },
  };
  resHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  resHeaderRow.height = 28;

  resources.forEach((r) => {
    const row = resSheet.addRow({
      id: r.id,
      name: r.name,
      type: r.type,
      unit: r.unit,
      initials: r.initials,
      group: r.group,
      capacity: (r.capacity || 100) / 100,
      rate: r.rate || 0,
      costPerUse: r.costPerUse || 0,
      accrual: r.accrual || 'Prorrateo',
    });

    row.getCell('capacity').numFmt = '0%';
    row.getCell('rate').numFmt = '$#,##0';
    row.getCell('costPerUse').numFmt = '$#,##0';
  });

  // Generar buffer y descargar archivo en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const cleanName = (projectName || 'Proyecto').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  anchor.href = url;
  anchor.download = `${cleanName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const getCellValueAsString = (cell) => {
  if (!cell) return '';
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().split('T')[0];
  }
  if (typeof v === 'object') {
    if (v.error) return '';
    if (Array.isArray(v.richText)) {
      return v.richText.map((t) => t.text || '').join('');
    }
    if (v.result !== undefined && v.result !== null) {
      if (v.result instanceof Date && !isNaN(v.result.getTime())) {
        return v.result.toISOString().split('T')[0];
      }
      return typeof v.result === 'object' ? '' : String(v.result);
    }
    if (v.text) return String(v.text);
  }
  return cell.text || '';
};

const getCellValueAsNumber = (cell, defaultVal = 0) => {
  if (!cell) return defaultVal;
  const v = cell.value;
  if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
  if (typeof v === 'object' && v !== null) {
    if (v.error) return defaultVal;
    if (v.result !== undefined && v.result !== null) {
      if (typeof v.result === 'number') return isNaN(v.result) ? defaultVal : v.result;
      const resStr = String(v.result).replace(/[^0-9.-]+/g, '');
      if (resStr) {
        const num = Number(resStr);
        return isNaN(num) ? defaultVal : num;
      }
    }
  }
  const str = getCellValueAsString(cell);
  const clean = str.replace(/[^0-9.-]+/g, '');
  if (!clean) return defaultVal;
  const num = Number(clean);
  return isNaN(num) ? defaultVal : num;
};

const parseDateString = (rawStr, defaultDate = '2026-06-01') => {
  if (!rawStr || rawStr === '-' || rawStr === 'N/A') return defaultDate;
  const s = rawStr.trim();
  // YYYY-MM-DD o YYYY/MM/DD
  const m1 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m1) {
    return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
  }
  // DD-MM-YYYY o DD/MM/YYYY
  const m2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m2) {
    return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return defaultDate;
};

/**
 * Importa tareas y recursos desde un archivo Excel cargado por el usuario.
 * Soporta hojas 'Partidas Gantt', 'Pool de Recursos' y cualquier planilla
 * de obra libre con datos en columnas no estándar (Smart Fallback).
 */
export const importTasksFromExcel = async (file, defaultStartDate = '2026-06-01') => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  if (!workbook.worksheets || workbook.worksheets.length === 0) {
    throw new Error('El archivo Excel no contiene ninguna hoja de datos.');
  }

  // 1. Identificar hojas de tareas y de recursos
  let taskWorksheet = null;
  let resourceWorksheet = null;

  for (const ws of workbook.worksheets) {
    const name = ws.name.trim().toLowerCase();
    if (!resourceWorksheet && (name.includes('recurso') || name.includes('resource') || name.includes('pool'))) {
      resourceWorksheet = ws;
    } else if (
      !taskWorksheet &&
      (name.includes('partida') || name.includes('gantt') || name.includes('tarea') ||
        name.includes('cronograma') || name.includes('cubica') || name.includes('itemizado') ||
        name.includes('presupuesto') || name.includes('programa') || name.includes('obra'))
    ) {
      taskWorksheet = ws;
    }
  }

  // Fallback: usar la hoja con más filas si no hubo coincidencia por nombre
  if (!taskWorksheet) {
    taskWorksheet = workbook.worksheets.reduce((best, ws) =>
      ws.rowCount > (best?.rowCount ?? 0) ? ws : best, workbook.worksheets[0]);
  }
  if (!resourceWorksheet && workbook.worksheets.length > 1) {
    for (const ws of workbook.worksheets) {
      if (ws !== taskWorksheet) { resourceWorksheet = ws; break; }
    }
  }

  // 2. Parsear Recursos
  const parsedResources = [];
  if (resourceWorksheet) {
    const resHeaderMap = {};
    let headerRowIdx = 0;

    for (let r = 1; r <= Math.min(20, resourceWorksheet.rowCount); r++) {
      const row = resourceWorksheet.getRow(r);
      let found = 0;
      const tmp = {};
      row.eachCell((cell, col) => {
        const val = getCellValueAsString(cell).trim().toLowerCase();
        if (!val) return;
        if (/costo\s*(?:x|por)?\s*uso|costperuse|fijo|costo\s*uso/i.test(val)) { tmp['costPerUse'] = col; found++; }
        else if (/tarifa|rate|precio|tasa|costo\s*(?:hora|\/hora|\/um|unit|est|\.est)/i.test(val)) { tmp['rate'] = col; found++; }
        else if (/descrip|nombre|recurso|glosa/i.test(val)) { tmp['name'] = col; found++; }
        else if (/^(id|código|codigo|n°|nro)$/i.test(val)) { tmp['id'] = col; found++; }
        else if (/tipo|type/i.test(val)) { tmp['type'] = col; found++; }
        else if (/^(u\.?m\.?|um|unidad|unit|medida)$/i.test(val) || /\bu\.?m\.?\b/i.test(val)) { tmp['unit'] = col; found++; }
        else if (/inici|sigla/i.test(val)) { tmp['initials'] = col; found++; }
        else if (/grupo|group/i.test(val)) { tmp['group'] = col; found++; }
        else if (/capacid|max|cap/i.test(val)) { tmp['capacity'] = col; found++; }
        else if (/acumul|devengo|accrual/i.test(val)) { tmp['accrual'] = col; found++; }
      });
      if (found >= 2 || (found >= 1 && tmp['name'])) {
        Object.assign(resHeaderMap, tmp);
        headerRowIdx = r;
        break;
      }
    }

    if (resHeaderMap['name'] || resHeaderMap['id']) {
      let currentResId = 1;
      resourceWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowIdx) return;
        const rawName = resHeaderMap['name'] ? getCellValueAsString(row.getCell(resHeaderMap['name'])) : '';
        if (!rawName || rawName.trim() === '') return;
        const rawId = resHeaderMap['id'] ? getCellValueAsNumber(row.getCell(resHeaderMap['id']), NaN) : NaN;
        const resId = isNaN(rawId) ? currentResId++ : rawId;
        if (resId >= currentResId) currentResId = resId + 1;
        const rawType = resHeaderMap['type'] ? getCellValueAsString(row.getCell(resHeaderMap['type'])).trim() : 'Trabajo';
        const type = rawType.toLowerCase().includes('mat') ? 'Material' : rawType.toLowerCase().includes('cost') ? 'Costo' : 'Trabajo';
        const unit = resHeaderMap['unit'] ? getCellValueAsString(row.getCell(resHeaderMap['unit'])).trim() : (type === 'Trabajo' ? 'Hrs' : 'Un');
        const initials = resHeaderMap['initials'] ? getCellValueAsString(row.getCell(resHeaderMap['initials'])).trim() : rawName.substring(0, 3).toUpperCase();
        const group = resHeaderMap['group'] ? getCellValueAsString(row.getCell(resHeaderMap['group'])).trim() : 'General';
        let capacity = 100;
        if (resHeaderMap['capacity']) {
          const capVal = getCellValueAsNumber(row.getCell(resHeaderMap['capacity']), 100);
          if (!isNaN(capVal) && capVal > 0) capacity = capVal <= 1 ? Math.round(capVal * 100) : capVal;
        }
        const rawRate = resHeaderMap['rate'] ? getCellValueAsNumber(row.getCell(resHeaderMap['rate']), 0) : 0;
        const rawCostPerUse = resHeaderMap['costPerUse'] ? getCellValueAsNumber(row.getCell(resHeaderMap['costPerUse']), 0) : 0;
        const accrual = resHeaderMap['accrual'] ? getCellValueAsString(row.getCell(resHeaderMap['accrual'])).trim() : 'Prorrateo';
        parsedResources.push({
          id: resId, name: rawName.trim(), type,
          unit: unit || 'Hrs', initials: initials || 'REC', group: group || 'General',
          capacity: isNaN(capacity) ? 100 : capacity,
          rate: isNaN(rawRate) ? 0 : rawRate,
          costPerUse: isNaN(rawCostPerUse) ? 0 : rawCostPerUse,
          accrual: ['Inicio', 'Fin'].includes(accrual) ? accrual : 'Prorrateo',
        });
      });
    }
  }

  // 3. Parsear Partidas / Tareas
  // ─── 3a. Detectar fila de cabecera (hasta fila 20) ───────────────────────
  const headerMap = {};
  let taskHeaderRowIdx = 0; // 0 = sin cabecera detectada (modo sin-header)

  for (let r = 1; r <= Math.min(20, taskWorksheet.rowCount); r++) {
    const row = taskWorksheet.getRow(r);
    let found = 0;
    const tmp = {};
    row.eachCell((cell, col) => {
      const val = getCellValueAsString(cell).trim().toLowerCase();
      if (!val) return;
      // Columna de nombre/descripción — patrón específico para evitar falsos positivos con nombres de partidas (ej. 'Obras Provisionales')
      if (
        /^(descrip|nombre|tarea|partida|actividad|glosa|item\s+de|especif)/i.test(val) ||
        /^(obra|trabajo|obras|trabajos)$/i.test(val)
      ) {
        tmp['name'] = col; found++;
      } else if (/^(id|código|codigo|n°|nro|item)$/i.test(val)) {
        tmp['id'] = col; found++;
      } else if (/durac|dias|días|plazo|jornada/i.test(val)) {
        tmp['duration'] = col; found++;
      } else if (/inici|comienzo|start/i.test(val)) {
        tmp['startDate'] = col; found++;
      } else if (/pred|depend|vinc/i.test(val)) {
        tmp['predecessors'] = col; found++;
      } else if (/nivel|wbs|edt/i.test(val)) {
        tmp['level'] = col; found++;
      } else if (/prog|avance|%/i.test(val)) {
        tmp['progress'] = col; found++;
      } else if (/cost|presupuesto|monto|total|precio/i.test(val)) {
        tmp['cost'] = col; found++;
      } else if (/demora\s*in|pos\.?\s*in|pos\s*in/i.test(val)) {
        tmp['startDelay'] = col; found++;
      } else if (/demora\s*fin|pos\.?\s*fin|pos\s*fin/i.test(val)) {
        tmp['finishDelay'] = col; found++;
      } else if (/recurs|resource|responsable/i.test(val)) {
        tmp['resource'] = col; found++;
      } else if (/estado|status/i.test(val)) {
        tmp['manualStatus'] = col; found++;
      }
    });
    // Fila válida: ≥ 2 coincidencias, o ≥ 1 si incluye columna de nombre
    if (found >= 2 || (found >= 1 && tmp['name'])) {
      Object.assign(headerMap, tmp);
      taskHeaderRowIdx = r;
      break;
    }
  }

  // ─── 3b. Smart Fallback: sin cabecera → detectar columnas por contenido ──
  // Planillas de cubicación "en bruto" sin fila de títulos: la primera columna
  // con texto no-numérico de longitud > 1 es el nombre; la primera columna
  // numérica adyacente es el costo.
  if (taskHeaderRowIdx === 0) {
    for (let r = 1; r <= Math.min(taskWorksheet.rowCount, 30); r++) {
      const row = taskWorksheet.getRow(r);
      let nameCol = null;
      let costCol = null;
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        if (nameCol !== null && costCol !== null) return;
        const raw = cell.value;
        if (raw === null || raw === undefined) return;
        const str = getCellValueAsString(cell).trim();
        if (!str) return;
        if (typeof raw === 'string' && isNaN(Number(raw)) && raw.length > 1 && nameCol === null) {
          nameCol = col;
        }
        const numVal = getCellValueAsNumber(cell, NaN);
        if (!isNaN(numVal) && costCol === null && col !== nameCol) {
          costCol = col;
        }
      });
      if (nameCol !== null) {
        headerMap['name'] = nameCol;
        if (costCol !== null) headerMap['cost'] = costCol;
        // taskHeaderRowIdx permanece en 0 → se procesa desde la primera fila
        break;
      }
    }
  }

  // Si aún no hay columna de nombre, el archivo no tiene datos útiles
  if (!headerMap['name']) {
    throw new Error(
      'No se pudo detectar la columna de descripción de partidas. ' +
      'Verifica que el archivo tenga una columna con los nombres de las actividades ' +
      '(Descripción, Nombre, Partida, Glosa, etc.).'
    );
  }

  // ─── 3c. Parsear filas de datos ───────────────────────────────────────────
  const parsedTasks = [];
  const rawIdToNewId = new Map();
  let currentId = 1;

  taskWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= taskHeaderRowIdx) return;

    const rawName = getCellValueAsString(row.getCell(headerMap['name']));
    if (!rawName || rawName.trim() === '') return;

    // Detectar fila "padre/grupo" por fórmula SUM en la columna de costo.
    // Las planillas de cubicación chilenas usan =SUM(...) para totalizar secciones.
    let isSumRow = false;
    if (headerMap['cost']) {
      const v = row.getCell(headerMap['cost']).value;
      if (v && typeof v === 'object' && typeof v.formula === 'string' &&
          v.formula.toUpperCase().startsWith('SUM')) {
        isSumRow = true;
      }
    }

    // Detectar nivel por columna explícita o por indentación de espacios
    let level = 1;
    if (headerMap['level']) {
      level = getCellValueAsNumber(row.getCell(headerMap['level']), 1);
    } else if (isSumRow) {
      level = 1;
    } else {
      const leadingSpaces = rawName.search(/\S|$/);
      if (leadingSpaces >= 4) level = 3;
      else if (leadingSpaces >= 2) level = 2;
    }

    const rawDuration = headerMap['duration']
      ? getCellValueAsNumber(row.getCell(headerMap['duration']), isSumRow ? 0 : 1)
      : (isSumRow ? 0 : 1);
    const rawCost = headerMap['cost'] ? getCellValueAsNumber(row.getCell(headerMap['cost']), 0) : 0;
    const rawProgress = headerMap['progress'] ? getCellValueAsNumber(row.getCell(headerMap['progress']), 0) : 0;
    const progressVal = rawProgress <= 1 && rawProgress > 0
      ? Math.round(rawProgress * 100)
      : Math.min(100, Math.max(0, rawProgress || 0));

    let taskStartDate = defaultStartDate;
    if (headerMap['startDate']) {
      taskStartDate = parseDateString(getCellValueAsString(row.getCell(headerMap['startDate'])), defaultStartDate);
    }

    const predsVal = headerMap['predecessors'] ? getCellValueAsString(row.getCell(headerMap['predecessors'])).trim() : '';

    let assignedResourceId = '';
    if (headerMap['resource']) {
      const rawRes = getCellValueAsString(row.getCell(headerMap['resource'])).trim();
      if (rawRes && rawRes !== 'N/A' && rawRes !== '-') {
        const matched = parsedResources.find(
          (r) =>
            String(r.id) === rawRes ||
            r.initials.toLowerCase() === rawRes.toLowerCase() ||
            rawRes.toLowerCase().includes(r.initials.toLowerCase()) ||
            rawRes.toLowerCase().includes(r.name.toLowerCase())
        );
        if (matched) assignedResourceId = matched.id;
        else {
          const numericResId = parseInt(rawRes);
          if (!isNaN(numericResId)) assignedResourceId = numericResId;
        }
      }
    }

    const rawStatus = headerMap['manualStatus'] ? getCellValueAsString(row.getCell(headerMap['manualStatus'])) : 'AUTO';
    const manualStatus = ['Completada', 'Con Retraso', 'En Plazo', 'Pendiente'].includes(rawStatus) ? rawStatus : 'AUTO';

    const rawId = headerMap['id'] ? getCellValueAsNumber(row.getCell(headerMap['id']), null) : null;
    const assignedId = currentId++;
    if (rawId !== null) rawIdToNewId.set(String(rawId), String(assignedId));

    parsedTasks.push({
      id: assignedId,
      name: rawName.trim(),
      duration: isNaN(rawDuration) ? (isSumRow ? 0 : 1) : Math.max(0, rawDuration),
      startDate: taskStartDate,
      progress: progressVal,
      cost: isNaN(rawCost) ? 0 : rawCost,
      predecessors: predsVal,
      startDelay: headerMap['startDelay'] ? getCellValueAsNumber(row.getCell(headerMap['startDelay']), 0) : 0,
      finishDelay: headerMap['finishDelay'] ? getCellValueAsNumber(row.getCell(headerMap['finishDelay']), 0) : 0,
      resourceId: assignedResourceId,
      level: Math.max(1, Math.min(5, level)),
      isP: isSumRow || (level === 1 && rawDuration === 0),
      manualStart: taskStartDate !== defaultStartDate ? taskStartDate : '',
      manualStatus,
    });
  });

  if (parsedTasks.length === 0) {
    throw new Error('No se encontraron filas con partidas válidas en el archivo.');
  }

  // Remapear predecesores si los IDs del Excel diferían de los asignados
  if (rawIdToNewId.size > 0) {
    parsedTasks.forEach((t) => {
      if (t.predecessors) {
        t.predecessors = String(t.predecessors)
          .split(',')
          .map((p) => p.trim())
          .map((p) => rawIdToNewId.get(p) || p)
          .join(', ');
      }
    });
  }

  return {
    tasks: parsedTasks,
    resources: parsedResources.length > 0 ? parsedResources : null,
  };
};

