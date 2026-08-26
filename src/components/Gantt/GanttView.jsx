import React, { useRef, useMemo, useEffect } from 'react';
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
  const isSyncingVertical = useRef(false);

  // Filtrado y colapso jerárquico de tareas
  const visibleTasks = useMemo(() => {
    const tasksList = cpmResult.tasks || [];
    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';

    const filtered = tasksList.filter((t) => {
      if (query && !t.name.toLowerCase().includes(query)) {
        return false;
      }
      if (taskFilter === 'CRITICAL' && (!t.crit || t.isP)) return false;
      if (taskFilter === 'DELAYED' && t.manualStatus !== 'Con Retraso') return false;
      return true;
    });

    const res = [];
    let skipLevel = null;
    for (let i = 0; i < filtered.length; i++) {
      const t = filtered[i];
      if (skipLevel !== null) {
        if (t.level > skipLevel) continue;
        skipLevel = null;
      }
      res.push(t);
      if (collapsed.includes(t.id) && t.isP) {
        skipLevel = t.level;
      }
    }
    return res;
  }, [cpmResult.tasks, searchQuery, taskFilter, collapsed]);

  // Cálculo de rango de fechas del timeline (alineado a la semana de inicio para visibilidad inmediata)
  const { minD, tlDays } = useMemo(() => {
    let s = new Date(startDate + 'T00:00:00');
    if (isNaN(s.getTime())) s = new Date();

    // Si hay tareas con fecha más temprana, tomar la fecha más temprana
    if (visibleTasks && visibleTasks.length > 0) {
      const taskStarts = visibleTasks
        .map((t) => t.ES || t.startDate)
        .filter(Boolean)
        .map((dStr) => new Date(dStr + 'T00:00:00').getTime())
        .filter((t) => !isNaN(t));
      if (taskStarts.length > 0) {
        const minTaskStart = new Date(Math.min(...taskStarts));
        if (minTaskStart < s) s = minTaskStart;
      }
    }

    // Comenzar el lunes de la semana de la primera tarea (con margen limpio)
    const dayOfWeek = s.getDay(); // 0: Dom, 1: Lun...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    s.setDate(s.getDate() - diffToMonday);

    // Margen final de 25 días para extender la planificación
    let e = new Date((cpmResult.end || startDate) + 'T00:00:00');
    if (isNaN(e.getTime())) e = new Date(s);
    e.setDate(e.getDate() + 25);

    const arr = [];
    let count = Math.ceil((e - s) / (1000 * 3600 * 24));
    if (isNaN(count) || count < 0 || count > 3000) count = 60;
    for (let i = 0; i <= count; i++) {
      const d = new Date(s);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return { minD: s, tlDays: arr };
  }, [startDate, cpmResult.end, visibleTasks]);

  // Sincronización de Scroll vertical y horizontal a 60 FPS mediante Refs y Event Listeners Pasivos
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const canvasEl = canvasScrollRef.current;
    const headerEl = headerScrollRef.current;

    if (!tableEl || !canvasEl) return;

    let rafId = null;

    const handleTableScroll = () => {
      if (isSyncingVertical.current === 'canvas') return;
      isSyncingVertical.current = 'table';
      canvasEl.scrollTop = tableEl.scrollTop;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        isSyncingVertical.current = null;
      });
    };

    const handleCanvasScroll = () => {
      if (headerEl) {
        headerEl.scrollLeft = canvasEl.scrollLeft;
      }
      if (isSyncingVertical.current === 'table') return;
      isSyncingVertical.current = 'canvas';
      tableEl.scrollTop = canvasEl.scrollTop;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        isSyncingVertical.current = null;
      });
    };

    const handleHeaderScroll = () => {
      if (canvasEl && headerEl) {
        canvasEl.scrollLeft = headerEl.scrollLeft;
      }
    };

    tableEl.addEventListener('scroll', handleTableScroll, { passive: true });
    canvasEl.addEventListener('scroll', handleCanvasScroll, { passive: true });
    if (headerEl) {
      headerEl.addEventListener('scroll', handleHeaderScroll, { passive: true });
    }

    return () => {
      tableEl.removeEventListener('scroll', handleTableScroll);
      canvasEl.removeEventListener('scroll', handleCanvasScroll);
      if (headerEl) {
        headerEl.removeEventListener('scroll', handleHeaderScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Splitter Arrastrable (Redimensión Tabla/Canvas)
  const onSplitMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;

    const onSplitMouseMove = (moveEvent) => {
      if (!isDragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      if (pct >= 20 && pct <= 80) {
        setLeftWidth(pct);
      }
    };

    const onSplitMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onSplitMouseMove);
      window.removeEventListener('mouseup', onSplitMouseUp);
    };

    window.addEventListener('mousemove', onSplitMouseMove);
    window.addEventListener('mouseup', onSplitMouseUp);
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

