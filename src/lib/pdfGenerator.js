import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera y descarga un informe ejecutivo en PDF de la Carta Gantt o Dashboard
 */
export const exportReportToPDF = async (elementId, projectData, reportType = 'Carta Gantt') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('No se encontró el elemento para exportar a PDF.');
  }

  const { projectName, startDate, statusDate, cpmResult } = projectData;
  const { pSum = {}, evm = {} } = cpmResult || {};

  // Capturar lienzo del elemento HTML
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f172a',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // Crear documento PDF en orientación Horizontal (Landscape)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // 1. Cabecera Institucional
  pdf.setFillColor(15, 23, 42); // #0f172a
  pdf.rect(0, 0, pdfWidth, 24, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Project Master Enterprise — ${reportType}`, 14, 10);

  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184); // #94a3b8
  pdf.text(`Proyecto: ${projectName || 'General'} | Fecha Inicio: ${startDate} | Fecha de Estado: ${statusDate}`, 14, 16);
  pdf.text(`Duración: ${pSum.dur || 0}d | Presupuesto (BAC): $${(pSum.cost || 0).toLocaleString()} | Avance: ${(pSum.prog || 0).toFixed(1)}% | SPI: ${(evm.spi || 1).toFixed(2)}`, 14, 21);

  pdf.setTextColor(59, 130, 246); // #3b82f6
  pdf.text('We Are Samod Enterprise', pdfWidth - 55, 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Emitido: ${new Date().toLocaleDateString('es-CL')}`, pdfWidth - 55, 16);

  // 2. Imagen del Contenido
  const marginY = 28;
  const contentWidth = pdfWidth - 28;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;
  const finalHeight = Math.min(contentHeight, pdfHeight - marginY - 10);

  pdf.addImage(imgData, 'PNG', 14, marginY, contentWidth, finalHeight);

  // 3. Descargar archivo
  const cleanName = (projectName || 'Proyecto').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  pdf.save(`${cleanName}_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
