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
  if (typeof v === 'object') {
    if (Array.isArray(v.richText)) {
      return v.richText.map((t) => t.text || '').join('');
    }
    if (v.result !== undefined && v.result !== null) {
      return String(v.result);
    }
    if (v.text) return String(v.text);
  }
  return cell.text || '';
};

const getCellValueAsNumber = (cell, defaultVal = 0) => {
  if (!cell) return defaultVal;
  const v = cell.value;
  if (typeof v === 'number') return isNaN(v) ? defaultVal : v;
  const str = getCellValueAsString(cell);
  const clean = str.replace(/[^0-9.-]+/g, '');
  if (!clean) return defaultVal;
  const num = Number(clean);
  return isNaN(num) ? defaultVal : num;
};

/**
 * Importa tareas y recursos desde un archivo Excel cargado por el usuario
 * Soporta hojas 'Partidas Gantt' y 'Pool de Recursos'
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

  // Búsqueda por nombre de hoja
  for (const ws of workbook.worksheets) {
    const name = ws.name.trim().toLowerCase();
    if (!resourceWorksheet && (name.includes('recurso') || name.includes('resource') || name.includes('pool'))) {
      resourceWorksheet = ws;
    } else if (!taskWorksheet && (name.includes('partida') || name.includes('gantt') || name.includes('tarea') || name.includes('cronograma') || name.includes('cubica') || name.includes('itemizado'))) {
      taskWorksheet = ws;
    }
  }

  // Si no se encontraron por nombre, asignar hoja principal
  if (!taskWorksheet) {
    taskWorksheet = workbook.worksheets[0];
  }
  if (!resourceWorksheet && workbook.worksheets.length > 1) {
    for (const ws of workbook.worksheets) {
      if (ws !== taskWorksheet) {
        resourceWorksheet = ws;
        break;
      }
    }
  }

  // 2. Parsear Recursos si existe la hoja correspondiente
  const parsedResources = [];
  if (resourceWorksheet) {
    const resHeaderMap = {};
    let headerRowIdx = 1;

    // Buscar fila de encabezados en las primeras 5 filas
    for (let r = 1; r <= Math.min(5, resourceWorksheet.rowCount); r++) {
      const row = resourceWorksheet.getRow(r);
      let foundHeaders = 0;
      row.eachCell((cell, colNumber) => {
        const val = getCellValueAsString(cell).trim().toLowerCase();
        if (/costo\s*(?:x|por)?\s*uso|costperuse|fijo|costo\s*uso/i.test(val)) {
          resHeaderMap['costPerUse'] = colNumber;
          foundHeaders++;
        } else if (/tarifa|rate|precio|valor|tasa|costo\s*(?:hora|\/hora|\/um|unit|est|\.est)/i.test(val)) {
          resHeaderMap['rate'] = colNumber;
          foundHeaders++;
        } else if (/descrip|nombre|recurso/i.test(val)) {
          resHeaderMap['name'] = colNumber;
          foundHeaders++;
        } else if (/^(id|código|codigo|item|n°|nro)$/i.test(val) || val === 'id') {
          resHeaderMap['id'] = colNumber;
          foundHeaders++;
        } else if (/tipo|type/i.test(val)) {
          resHeaderMap['type'] = colNumber;
          foundHeaders++;
        } else if (/^(u\.?m\.?|um|unidad|unit|medida)$/i.test(val) || /\bu\.?m\.?\b/i.test(val)) {
          resHeaderMap['unit'] = colNumber;
          foundHeaders++;
        } else if (/inici|sigla/i.test(val)) {
          resHeaderMap['initials'] = colNumber;
          foundHeaders++;
        } else if (/grupo|group/i.test(val)) {
          resHeaderMap['group'] = colNumber;
          foundHeaders++;
        } else if (/capacid|max|cap/i.test(val)) {
          resHeaderMap['capacity'] = colNumber;
          foundHeaders++;
        } else if (/acumul|devengo|accrual/i.test(val)) {
          resHeaderMap['accrual'] = colNumber;
          foundHeaders++;
        }
      });
      if (foundHeaders >= 2) {
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
          if (!isNaN(capVal) && capVal > 0) {
            capacity = capVal <= 1 ? Math.round(capVal * 100) : capVal;
          }
        }

        const rawRate = resHeaderMap['rate'] ? getCellValueAsNumber(row.getCell(resHeaderMap['rate']), 0) : 0;
        const rawCostPerUse = resHeaderMap['costPerUse'] ? getCellValueAsNumber(row.getCell(resHeaderMap['costPerUse']), 0) : 0;
        const accrual = resHeaderMap['accrual'] ? getCellValueAsString(row.getCell(resHeaderMap['accrual'])).trim() : 'Prorrateo';

        parsedResources.push({
          id: resId,
          name: rawName.trim(),
          type,
          unit: unit || 'Hrs',
          initials: initials || 'REC',
          group: group || 'General',
          capacity: isNaN(capacity) ? 100 : capacity,
          rate: isNaN(rawRate) ? 0 : rawRate,
          costPerUse: isNaN(rawCostPerUse) ? 0 : rawCostPerUse,
          accrual: ['Inicio', 'Fin'].includes(accrual) ? accrual : 'Prorrateo',
        });
      });
    }
  }

  // 3. Parsear Partidas / Tareas
  const headerMap = {};
  let taskHeaderRowIdx = 1;

  for (let r = 1; r <= Math.min(5, taskWorksheet.rowCount); r++) {
    const row = taskWorksheet.getRow(r);
    let foundHeaders = 0;
    row.eachCell((cell, colNumber) => {
      const val = getCellValueAsString(cell).trim().toLowerCase();
      if (/descrip|nombre|tarea|partida|actividad/i.test(val)) {
        headerMap['name'] = colNumber;
        foundHeaders++;
      } else if (/^(id|código|codigo|item|n°|nro)$/i.test(val) || val === 'id') {
        headerMap['id'] = colNumber;
        foundHeaders++;
      } else if (/durac|dias|días|plazo/i.test(val)) {
        headerMap['duration'] = colNumber;
        foundHeaders++;
      } else if (/inici|comienzo|start/i.test(val)) {
        headerMap['startDate'] = colNumber;
        foundHeaders++;
      } else if (/pred|depend|vinc/i.test(val)) {
        headerMap['predecessors'] = colNumber;
        foundHeaders++;
      } else if (/nivel|wbs|edt/i.test(val)) {
        headerMap['level'] = colNumber;
        foundHeaders++;
      } else if (/prog|avance|%/i.test(val)) {
        headerMap['progress'] = colNumber;
        foundHeaders++;
      } else if (/cost|presupuesto|monto|total/i.test(val)) {
        headerMap['cost'] = colNumber;
        foundHeaders++;
      } else if (/demora\s*in|pos\.?\s*in|pos\s*in/i.test(val)) {
        headerMap['startDelay'] = colNumber;
        foundHeaders++;
      } else if (/demora\s*fin|pos\.?\s*fin|pos\s*fin/i.test(val)) {
        headerMap['finishDelay'] = colNumber;
        foundHeaders++;
      } else if (/recurs|resource|responsable/i.test(val)) {
        headerMap['resource'] = colNumber;
        foundHeaders++;
      } else if (/estado|status/i.test(val)) {
        headerMap['manualStatus'] = colNumber;
        foundHeaders++;
      }
    });
    if (foundHeaders >= 2) {
      taskHeaderRowIdx = r;
      break;
    }
  }

  const parsedTasks = [];
  let currentId = 1;

  taskWorksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= taskHeaderRowIdx) return;

    const rawName = headerMap['name'] ? getCellValueAsString(row.getCell(headerMap['name'])) : '';
    if (!rawName || rawName.trim() === '') return;

    // Detectar nivel por columna explícita o por indentación de espacios / numeración
    let level = 1;
    if (headerMap['level']) {
      level = getCellValueAsNumber(row.getCell(headerMap['level']), 1);
    } else {
      const leadingSpaces = rawName.search(/\S|$/);
      if (leadingSpaces >= 4) level = 3;
      else if (leadingSpaces >= 2) level = 2;
    }

    const rawDuration = headerMap['duration'] ? getCellValueAsNumber(row.getCell(headerMap['duration']), 1) : 1;
    const rawCost = headerMap['cost'] ? getCellValueAsNumber(row.getCell(headerMap['cost']), 0) : 0;
    const rawProgress = headerMap['progress'] ? getCellValueAsNumber(row.getCell(headerMap['progress']), 0) : 0;
    const progressVal = rawProgress <= 1 && rawProgress > 0 ? Math.round(rawProgress * 100) : Math.min(100, Math.max(0, rawProgress || 0));

    const predsVal = headerMap['predecessors'] ? getCellValueAsString(row.getCell(headerMap['predecessors'])).trim() : '';

    // Vincular recurso asignado si existe en parsedResources
    let assignedResourceId = '';
    if (headerMap['resource']) {
      const rawRes = getCellValueAsString(row.getCell(headerMap['resource'])).trim();
      if (rawRes && rawRes !== 'N/A' && rawRes !== '-') {
        // Intentar match con parsedResources por ID, iniciales o nombre
        const matched = parsedResources.find(
          (r) =>
            String(r.id) === rawRes ||
            r.initials.toLowerCase() === rawRes.toLowerCase() ||
            rawRes.toLowerCase().includes(r.initials.toLowerCase()) ||
            rawRes.toLowerCase().includes(r.name.toLowerCase())
        );
        if (matched) {
          assignedResourceId = matched.id;
        } else {
          const numericResId = parseInt(rawRes);
          if (!isNaN(numericResId)) assignedResourceId = numericResId;
        }
      }
    }

    const rawStatus = headerMap['manualStatus'] ? getCellValueAsString(row.getCell(headerMap['manualStatus'])).trim() : 'AUTO';
    const manualStatus = ['Completada', 'Con Retraso', 'En Plazo', 'Pendiente'].includes(rawStatus) ? rawStatus : 'AUTO';

    parsedTasks.push({
      id: currentId++,
      name: rawName.trim(),
      duration: isNaN(rawDuration) ? 1 : Math.max(0, rawDuration),
      startDate: defaultStartDate,
      progress: progressVal,
      cost: isNaN(rawCost) ? 0 : rawCost,
      predecessors: predsVal,
      startDelay: headerMap['startDelay'] ? getCellValueAsNumber(row.getCell(headerMap['startDelay']), 0) : 0,
      finishDelay: headerMap['finishDelay'] ? getCellValueAsNumber(row.getCell(headerMap['finishDelay']), 0) : 0,
      resourceId: assignedResourceId,
      level: Math.max(1, Math.min(4, level)),
      manualStart: '',
      manualStatus,
    });
  });

  if (parsedTasks.length === 0) {
    throw new Error('No se encontraron filas con partidas válidas en el archivo.');
  }

  return {
    tasks: parsedTasks,
    resources: parsedResources.length > 0 ? parsedResources : null,
  };
};

