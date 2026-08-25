import React, { useRef, useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { GanttToolbar } from './GanttToolbar';
import { GanttTable } from './GanttTable';
import { GanttCanvas } from './GanttCanvas';
import { ExcelModal } from '../Modals/ExcelModal';

export const GanttView = () => {
  const { startDate, statusDate, cpmResult } = useProjectStore();
  const {
    leftWidth,
    setLeftWidth,
    zoom,
    setZoom,
    collapsed,
    searchQuery,
    taskFilter,
    excelModalOpen,
    setExcelModalOpen,
  } = useUIStore();

  const splitRef = useRef(null);
  const tableScrollRef = useRef(null);
  const canvasScrollRef = useRef(null);
  const headerScrollRef = useRef(null);

  const isDragging = useRef(false);
  const syncFromLeft = useRef(false);
  const syncFromRight = useRef(false);

  const actTasks = cpmResult.tasks || [];

  // Filtrado de tareas según búsqueda y estado
  const visibleTasks = useMemo(() => {
    let filtered = actTasks.filter((t) => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (taskFilter === 'CRITICAL' && (!t.crit || t.isP)) return false;
      if (taskFilter === 'DELAYED' && t.manualStatus !== 'Con Retraso') return false;
      return true;
    });

    let res = [];
    let skipLevel = null;
    for (let t of filtered) {
      if (skipLevel !== null) {
        if (t.level > skipLevel) continue;
        else skipLevel = null;
      }
      res.push(t);
      if (collapsed.includes(t.id) && t.isP) {
        skipLevel = t.level;
      }
    }
    return res;
  }, [actTasks, searchQuery, taskFilter, collapsed]);

  // Cálculo de rango de fechas del timeline
  const { minD, tlDays } = useMemo(() => {
    let s = new Date(startDate + 'T00:00:00');
    if (isNaN(s.getTime())) s = new Date();
    s.setDate(s.getDate() - 2);

    let e = new Date((cpmResult.end || startDate) + 'T00:00:00');
    if (isNaN(e.getTime())) e = new Date();
    e.setDate(e.getDate() + 15);

    let arr = [];
    let count = Math.ceil((e - s) / (1000 * 3600 * 24));
    if (isNaN(count) || count < 0 || count > 3000) count = 100;
    for (let i = 0; i <= count; i++) {
      let d = new Date(s);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return { minD: s, tlDays: arr };
  }, [startDate, cpmResult.end]);

  // Manejadores del Splitter Arrastrable
  const onSplitMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', onSplitMouseMove);
    document.addEventListener('mouseup', onSplitMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const onSplitMouseMove = (e) => {
    if (!isDragging.current || !splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    if (pct >= 20 && pct <= 80) {
      setLeftWidth(pct);
    }
  };

  const onSplitMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onSplitMouseMove);
    document.removeEventListener('mouseup', onSplitMouseUp);
    document.body.style.cursor = 'default';
  };

  // Sincronización vertical y horizontal de scroll
  const onTableScroll = (e) => {
    if (syncFromRight.current) {
      syncFromRight.current = false;
      return;
    }
    syncFromLeft.current = true;
    if (canvasScrollRef.current) {
      canvasScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const onCanvasScroll = (e) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
    if (syncFromLeft.current) {
      syncFromLeft.current = false;
      return;
    }
    syncFromRight.current = true;
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Botón Ir a Hoy
  const handleGoToToday = () => {
    if (canvasScrollRef.current) {
      const px =
        Math.max(
          0,
          (new Date(statusDate + 'T00:00:00').getTime() - minD.getTime()) / (1000 * 3600 * 24)
        ) * zoom;
      canvasScrollRef.current.scrollTo({ left: px - 300, behavior: 'smooth' });
    }
  };

  // Botón Ajustar Zoom
  const handleFitZoom = () => {
    if (canvasScrollRef.current) {
      const w = canvasScrollRef.current.clientWidth - 20;
      const calculated = Math.floor(w / Math.max(1, tlDays.length));
      setZoom(Math.max(8, Math.min(60, calculated)));
    }
  };

  return (
    <div id="gantt-main-container" className="flex flex-col h-full w-full overflow-hidden">
      {/* Barra de Herramientas y Filtros */}
      <GanttToolbar onGoToToday={handleGoToToday} onFitZoom={handleFitZoom} />

      {/* Contenedor Dividido: Tabla Gantt + Lienzo SVG */}
      <div ref={splitRef} className="flex flex-1 overflow-hidden w-full relative">
        {/* Lado Izquierdo: Tabla de Partidas */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="flex flex-col border-r border-slate-800 bg-[#1e293b] shrink-0 z-20 overflow-hidden"
        >
          <GanttTable
            tableRef={tableScrollRef}
            onScroll={onTableScroll}
            visibleTasks={visibleTasks}
          />
        </div>

        {/* Separador Arrastrable (Splitter) */}
        <div
          onMouseDown={onSplitMouseDown}
          className="w-[5px] cursor-col-resize bg-slate-700 hover:bg-blue-500 active:bg-blue-400 z-30 shrink-0 flex items-center justify-center transition-colors"
          title="Arrastra para redimensionar tabla y lienzo"
        >
          <div className="w-[2px] h-8 bg-slate-400 rounded-full"></div>
        </div>

        {/* Lado Derecho: Lienzo Gráfico SVG */}
        <GanttCanvas
          canvasScrollRef={canvasScrollRef}
          headerScrollRef={headerScrollRef}
          onScroll={onCanvasScroll}
          visibleTasks={visibleTasks}
          minD={minD}
          tlDays={tlDays}
        />
      </div>

      {/* Modal de Excel */}
      <ExcelModal isOpen={excelModalOpen} onClose={() => setExcelModalOpen(false)} />
    </div>
  );
};
