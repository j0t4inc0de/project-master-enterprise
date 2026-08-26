import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatD } from './cpmEngine';

/**
 * Genera y descarga un informe ejecutivo profesional en PDF
 * Utiliza tablas vectoriales nativas para la Carta Gantt y captura HD para el Dashboard.
 */
export const exportReportToPDF = async (projectData, reportType = 'Carta Gantt') => {
  const {
    elementId,
    isDashboard = false,
    projectName,
    startDate,
    statusDate,
    cpmResult = {},
    tasks = [],
    resources = [],
  } = projectData;

  const { pSum = {}, evm = {} } = cpmResult;
  const cleanProjectName = projectName || 'Nuevo Proyecto';

  // 1. CASO DASHBOARD: Captura gráfica HD optimizada para ocupar la página
  if (isDashboard && elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('No se encontró el contenedor del Dashboard para exportar.');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#09090b',
      logging: false,
      windowWidth: 1400,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

    // Cabecera Ejecutiva
    pdf.setFillColor(15, 23, 42); // #0f172a
    pdf.rect(0, 0, pdfWidth, 24, 'F');
    pdf.setFillColor(59, 130, 246); // #3b82f6
    pdf.rect(0, 24, pdfWidth, 1, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Project Master Enterprise - ${reportType}`, 12, 9);

    pdf.setFontSize(8.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Proyecto: ${cleanProjectName} | Fecha Inicio: ${startDate} | Fecha de Estado: ${statusDate}`,
      12,
      15
    );
    pdf.text(
      `Duración: ${pSum.dur || 0}d | Presupuesto (BAC): $${(Number(pSum.cost) || 0).toLocaleString()} | Avance: ${(Number(pSum.prog) || 0).toFixed(1)}% | SPI: ${(Number(evm.spi) || 1).toFixed(2)}`,
      12,
      20
    );

    pdf.setTextColor(59, 130, 246);
    pdf.text('We Are Samod Enterprise', pdfWidth - 50, 9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Emitido: ${new Date().toLocaleDateString('es-CL')}`, pdfWidth - 50, 15);

    // Ajuste de imagen maximizada en el espacio restante
    const marginY = 28;
    const marginX = 10;
    const maxW = pdfWidth - marginX * 2;
    const maxH = pdfHeight - marginY - 10;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const renderW = canvas.width * ratio;
    const renderH = canvas.height * ratio;
    const posX = marginX + (maxW - renderW) / 2;

    pdf.addImage(imgData, 'PNG', posX, marginY, renderW, renderH);

    const filename = `${cleanProjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    return;
  }

  // 2. CASO CARTA GANTT / CRONOGRAMA: Generación Vectorial Nativa con autoTable (100% nítida y a página completa)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

  // Mapa de nombres de recursos
  const resourceMap = new Map();
  resources.forEach((r) => {
    resourceMap.set(String(r.id), r.name || r.initials);
    resourceMap.set(r.id, r.name || r.initials);
  });

  // Preparar filas de partidas (con indentación limpia 100% compatible con estándar PDF)
  const taskRows = (cpmResult.tasks && cpmResult.tasks.length > 0 ? cpmResult.tasks : tasks).map(
    (t) => {
      const isPhase = Boolean(t.isP);
      const isMilestone = Number(t.duration) === 0 && !isPhase;
      const indentPrefix = t.level > 1 ? '    '.repeat(t.level - 1) + '- ' : '';
      const nameFormatted = isPhase ? `[FASE] ${t.name}` : `${indentPrefix}${t.name}`;
      const resName = t.resourceId ? resourceMap.get(String(t.resourceId)) || `Recurso #${t.resourceId}` : '-';

      let estado = 'En Plazo';
      if (t.manualStatus && t.manualStatus !== 'AUTO') {
        estado = t.manualStatus;
      } else if (Number(t.progress) >= 100) {
        estado = 'Completada';
      } else if (t.crit && !isPhase) {
        estado = 'Crítica';
      }

      return {
        raw: t,
        id: t.id,
        name: nameFormatted,
        dur: isMilestone ? 'Hito (0d)' : `${Number(t.duration) || 0} d`,
        tf: isPhase ? '-' : `${t.TF !== undefined ? t.TF : 0} d`,
        es: formatD(t.ES || t.startDate),
        ef: formatD(t.EF || t.startDate),
        pred: t.predecessors || '-',
        resource: resName,
        status: estado,
        prog: `${(Number(t.progress) || 0).toFixed(0)}%`,
        cost: `$${(Number(t.cost) || 0).toLocaleString()}`,
        isPhase,
        isCrit: Boolean(t.crit && !isPhase),
      };
    }
  );

  // Fila 0 de Resumen Global (sin caracteres especiales que causen £)
  const summaryRow = [
    '',
    'RESUMEN PROYECTO GLOBAL',
    `${pSum.dur || 0} d`,
    '-',
    formatD(pSum.start),
    formatD(pSum.end),
    'Global',
    'Todos',
    pSum.prog >= 100 ? 'Completado' : 'En Curso',
    `${(Number(pSum.prog) || 0).toFixed(0)}%`,
    `$${(Number(pSum.cost) || 0).toLocaleString()}`,
  ];

  const tableBody = [
    summaryRow,
    ...taskRows.map((r) => [
      r.id,
      r.name,
      r.dur,
      r.tf,
      r.es,
      r.ef,
      r.pred,
      r.resource,
      r.status,
      r.prog,
      r.cost,
    ]),
  ];

  // Configuración y Renderizado con autoTable
  autoTable(pdf, {
    head: [
      [
        '#',
        'Descripción de la Partida',
        'Dur.',
        'Holg.',
        'Inicio (ES)',
        'Fin (EF)',
        'Pred.',
        'Recurso',
        'Estado',
        '% Av.',
        'Costo ($)',
      ],
    ],
    body: tableBody,
    startY: 28,
    margin: { top: 28, left: 10, right: 10, bottom: 12 },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [241, 245, 249], // #f1f5f9
      fillColor: [15, 23, 42], // #0f172a
      lineColor: [51, 65, 85], // #334155
      lineWidth: 0.1,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // #1e293b
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      lineColor: [71, 85, 105],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 16 },
      7: { halign: 'left', cellWidth: 32 },
      8: { halign: 'center', cellWidth: 22 },
      9: { halign: 'center', cellWidth: 17 },
      10: { halign: 'right', cellWidth: 26 },
    },
    alternateRowStyles: {
      fillColor: [24, 33, 50],
    },
    didParseCell: (data) => {
      // Estilo para Fila 0 (Resumen Global)
      if (data.row.index === 0) {
        data.cell.styles.fillColor = [217, 119, 6]; // #d97706 (Ámbar)
        data.cell.styles.textColor = [15, 23, 42]; // #0f172a (Negro)
        data.cell.styles.fontStyle = 'bold';
        return;
      }

      // Identificar si la fila corresponde a una Fase Padre o Tarea Crítica
      const taskIndex = data.row.index - 1;
      const taskItem = taskRows[taskIndex];

      if (taskItem) {
        if (taskItem.isPhase) {
          data.cell.styles.fillColor = [30, 58, 95]; // Azul Fase
          data.cell.styles.textColor = [253, 230, 138]; // Ámbar Claro
          data.cell.styles.fontStyle = 'bold';
        } else if (taskItem.isCrit) {
          if (data.column.index === 3) {
            data.cell.styles.textColor = [248, 113, 113]; // Rojo Crítico en Holgura
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index === 8) {
            data.cell.styles.textColor = [248, 113, 113]; // Rojo en Estado
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    didDrawPage: (data) => {
      // Cabecera Vectorial Repetida en cada Página
      pdf.setFillColor(15, 23, 42); // #0f172a
      pdf.rect(0, 0, pdfWidth, 24, 'F');
      pdf.setFillColor(59, 130, 246); // Línea azul divisoria
      pdf.rect(0, 24, pdfWidth, 1, 'F');

      // Título e Identidad
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Project Master Enterprise - ${reportType}`, 10, 9);

      // Subtítulo y Fechas
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Proyecto: ${cleanProjectName} | Fecha Inicio: ${startDate} | Fecha de Estado: ${statusDate}`,
        10,
        15
      );
      pdf.text(
        `Duración Total: ${pSum.dur || 0}d | Presupuesto (BAC): $${(Number(pSum.cost) || 0).toLocaleString()} | Avance Físico: ${(Number(pSum.prog) || 0).toFixed(1)}% | SPI: ${(Number(evm.spi) || 1).toFixed(2)}`,
        10,
        20
      );

      // Marca de Agua y Emisión (Derecha)
      pdf.setTextColor(59, 130, 246);
      pdf.setFont('helvetica', 'bold');
      pdf.text('We Are Samod Enterprise', pdfWidth - 55, 9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Emitido: ${new Date().toLocaleDateString('es-CL')}`, pdfWidth - 55, 15);
      pdf.text(`Página ${data.pageNumber}`, pdfWidth - 55, 20);

      // Pie de Página Inferior
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        'Project Master Enterprise | Software de Planificacion y Control de Obras | Documento Oficial',
        10,
        pdfHeight - 5
      );
    },
  });

  // Guardar archivo PDF descargable
  const filename = `${cleanProjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cronograma_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
};
