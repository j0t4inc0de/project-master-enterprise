import ExcelJS from 'exceljs';

/**
 * Exporta el proyecto completo a un archivo Excel (.xlsx) con formato profesional
 */
export const exportProjectToExcel = async (projectData) => {
  const { projectName, tasks = [], resources = [], startDate, statusDate } = projectData;

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
    const res = resources.find((r) => r.id === t.resourceId);
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

/**
 * Importa tareas desde un archivo Excel cargado por el usuario
 */
export const importTasksFromExcel = async (file, defaultStartDate = '2026-06-01') => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('El archivo Excel no contiene ninguna hoja de datos.');
  }

  // Identificar encabezados en la fila 1
  const headerMap = {};
  const firstRow = worksheet.getRow(1);
  firstRow.eachCell((cell, colNumber) => {
    const val = String(cell.value || '').trim().toLowerCase();
    if (val.includes('id') || val.includes('código') || val.includes('item')) headerMap['id'] = colNumber;
    else if (val.includes('descrip') || val.includes('nombre') || val.includes('tarea') || val.includes('partida')) headerMap['name'] = colNumber;
    else if (val.includes('durac') || val.includes('dias') || val.includes('plazo')) headerMap['duration'] = colNumber;
    else if (val.includes('inici') || val.includes('comienzo') || val.includes('start')) headerMap['startDate'] = colNumber;
    else if (val.includes('pred') || val.includes('depend') || val.includes('vinc')) headerMap['predecessors'] = colNumber;
    else if (val.includes('nivel') || val.includes('wbs') || val.includes('edt')) headerMap['level'] = colNumber;
    else if (val.includes('prog') || val.includes('avance') || val.includes('%')) headerMap['progress'] = colNumber;
    else if (val.includes('cost') || val.includes('presupuesto') || val.includes('monto')) headerMap['cost'] = colNumber;
    else if (val.includes('demora in') || val.includes('pos.in')) headerMap['startDelay'] = colNumber;
    else if (val.includes('demora fin') || val.includes('pos.fin')) headerMap['finishDelay'] = colNumber;
  });

  const parsedTasks = [];
  let currentId = 1;

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Omitir cabecera

    const rawName = headerMap['name'] ? row.getCell(headerMap['name']).text : '';
    if (!rawName || rawName.trim() === '') return;

    // Detectar nivel por espacios o columna explícita
    let level = 1;
    if (headerMap['level']) {
      level = parseInt(row.getCell(headerMap['level']).value) || 1;
    } else {
      const leadingSpaces = rawName.search(/\S|$/);
      if (leadingSpaces >= 4) level = 3;
      else if (leadingSpaces >= 2) level = 2;
    }

    const durationVal = headerMap['duration'] ? parseInt(row.getCell(headerMap['duration']).value) : 1;
    const rawCost = headerMap['cost'] ? Number(String(row.getCell(headerMap['cost']).value).replace(/[^0-9.-]+/g, '')) : 0;
    const rawProgress = headerMap['progress'] ? Number(String(row.getCell(headerMap['progress']).value).replace(/[^0-9.-]+/g, '')) : 0;
    const progressVal = rawProgress <= 1 && rawProgress > 0 ? Math.round(rawProgress * 100) : Math.min(100, Math.max(0, rawProgress || 0));

    const predsVal = headerMap['predecessors'] ? String(row.getCell(headerMap['predecessors']).value || '').trim() : '';

    parsedTasks.push({
      id: currentId++,
      name: rawName.trim(),
      duration: isNaN(durationVal) ? 1 : Math.max(0, durationVal),
      startDate: defaultStartDate,
      progress: progressVal,
      cost: isNaN(rawCost) ? 0 : rawCost,
      predecessors: predsVal,
      startDelay: headerMap['startDelay'] ? parseInt(row.getCell(headerMap['startDelay']).value) || 0 : 0,
      finishDelay: headerMap['finishDelay'] ? parseInt(row.getCell(headerMap['finishDelay']).value) || 0 : 0,
      resourceId: '',
      level: Math.max(1, Math.min(4, level)),
      manualStart: '',
      manualStatus: 'AUTO',
    });
  });

  if (parsedTasks.length === 0) {
    throw new Error('No se encontraron filas con partidas válidas en el archivo.');
  }

  return parsedTasks;
};
