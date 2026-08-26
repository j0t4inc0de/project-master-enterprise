import React, { useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export const GanttToolbar = ({ onGoToToday, onFitZoom }) => {
  const {
    addTask,
    autoProgress,
    setAutoProgress,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProjectStore();

  const {
    autoLink,
    setAutoLink,
    showLinks,
    setShowLinks,
    zoom,
    setZoom,
    searchQuery,
    setSearchQuery,
    taskFilter,
    setTaskFilter,
    setExcelModalOpen,
  } = useUIStore();

  // Atajos de teclado para Deshacer (Ctrl+Z) y Rehacer (Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            if (!isInput && redo) {
              e.preventDefault();
              redo();
            }
          } else {
            if (!isInput && undo) {
              e.preventDefault();
              undo();
            }
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          if (!isInput && redo) {
            e.preventDefault();
            redo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Nivel de zoom relativo en porcentaje (24px base = 100%)
  const zoomPct = Math.round((zoom / 24) * 100);

  return (
    <div className="w-full flex shrink-0 border-b border-slate-700/80 bg-[#1e293b] shadow-sm z-20 select-none overflow-x-auto custom-scrollbar">
      {/* SECCIÓN 1: EDICIÓN & TAREAS */}
      <div className="flex-[1.4] min-w-[360px] px-3 py-1.5 flex flex-col justify-between border-r border-slate-700/80 bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
        <div className="flex items-center justify-center gap-2 min-h-[30px]">
          {/* Subgrupo A: Creación & Historial */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => addTask(autoLink)}
              title="Añadir una nueva partida principal al final del cronograma (+ Partida)"
              className="h-7 bg-blue-600 hover:bg-blue-500 text-white px-2.5 rounded text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Partida</span>
            </button>

            <div className="flex items-center bg-slate-900/90 h-7 rounded border border-slate-700/80 p-0.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Deshacer (Ctrl+Z)"
                className={`h-full px-2 rounded text-xs font-bold transition-all flex items-center justify-center ${
                  canUndo
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>

              <div className="h-3.5 w-[1px] bg-slate-700"></div>

              <button
                onClick={redo}
                disabled={!canRedo}
                title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
                className={`h-full px-2 rounded text-xs font-bold transition-all flex items-center justify-center ${
                  canRedo
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-40'
                }`}
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 mx-0.5"></div>

          {/* Subgrupo B: Modos Automáticos */}
          <div className="flex items-center gap-1.5">
            <label
              title="Auto-Vincular: Conectar automáticamente nuevas tareas con la anterior"
              className={`h-7 flex items-center gap-1.5 text-xs font-semibold px-2.5 rounded border cursor-pointer transition-all whitespace-nowrap ${
                autoLink
                  ? 'bg-blue-950/70 border-blue-500/70 text-blue-300 shadow-inner'
                  : 'bg-slate-900/50 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <input
                type="checkbox"
                checked={autoLink}
                onChange={(e) => setAutoLink(e.target.checked)}
                className="accent-blue-500 w-3 h-3 cursor-pointer"
              />
              <i className="fa-solid fa-link text-[10px] text-blue-400"></i>
              <span>Vincular</span>
            </label>

            <label
              title="Auto-Progreso: Cálculo automático de avance físico según fecha de corte"
              className={`h-7 flex items-center gap-1.5 text-xs font-semibold px-2.5 rounded border cursor-pointer transition-all whitespace-nowrap ${
                autoProgress
                  ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-300 shadow-inner'
                  : 'bg-slate-900/50 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <input
                type="checkbox"
                checked={autoProgress}
                onChange={(e) => setAutoProgress(e.target.checked)}
                className="accent-emerald-500 w-3 h-3 cursor-pointer"
              />
              <i className="fa-solid fa-robot text-[10px] text-emerald-400"></i>
              <span>Auto-Progreso</span>
            </label>
          </div>
        </div>

        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center select-none pt-0.5 border-t border-slate-700/40 mt-1 w-full">
          Edición & Tareas
        </span>
      </div>

      {/* SECCIÓN 2: NAVEGACIÓN & ESCALA */}
      <div className="flex-[1.2] min-w-[300px] px-3 py-1.5 flex flex-col justify-between border-r border-slate-700/80 bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
        <div className="flex items-center justify-center gap-2 min-h-[30px]">
          {/* Botón Ir a Hoy */}
          <button
            onClick={onGoToToday}
            title="Centrar la vista Gantt en la fecha de estado"
            className="h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/80 px-2.5 rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <i className="fa-solid fa-crosshairs text-sky-400 text-xs"></i>
            <span>Ir a Hoy</span>
          </button>

          {/* Toggle Ver Enlaces */}
          <button
            onClick={() => setShowLinks(!showLinks)}
            title="Mostrar u ocultar flechas de dependencias en el Gantt"
            className={`h-7 px-2.5 text-xs font-bold rounded border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap ${
              showLinks
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600/80 text-slate-300 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-bezier-curve text-xs"></i>
            <span>Enlaces</span>
          </button>

          {/* Controles de Zoom */}
          <div className="h-7 flex items-center bg-slate-900/90 rounded border border-slate-700/80 p-0.5 shadow-inner">
            <button
              onClick={() => setZoom(zoom - 4)}
              title="Disminuir Zoom (-4px)"
              className="h-full px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all text-xs active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-magnifying-glass-minus"></i>
            </button>

            <button
              onClick={() => setZoom(24)}
              title={`Zoom actual: ${zoomPct}%. Haz clic para restablecer al 100%`}
              className="h-full px-2 text-[10px] font-mono font-bold text-slate-300 hover:text-blue-300 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
            >
              {zoomPct}%
            </button>

            <button
              onClick={onFitZoom}
              title="Ajustar Escala al Ancho Visible"
              className="h-full px-2 text-[10px] font-black uppercase text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded border-x border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-arrows-left-right-to-line text-[9px]"></i>
              <span>Ajustar</span>
            </button>

            <button
              onClick={() => setZoom(zoom + 4)}
              title="Aumentar Zoom (+4px)"
              className="h-full px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all text-xs active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-magnifying-glass-plus"></i>
            </button>
          </div>
        </div>

        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center select-none pt-0.5 border-t border-slate-700/40 mt-1 w-full">
          Navegación & Escala
        </span>
      </div>

      {/* SECCIÓN 3: FILTROS */}
      <div className="flex-[1.1] min-w-[280px] px-3 py-1.5 flex flex-col justify-between border-r border-slate-700/80 bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
        <div className="flex items-center justify-center gap-2 min-h-[30px] w-full">
          {/* Buscador de partidas */}
          <div className="relative flex-1 min-w-[120px] flex items-center">
            <i className="fa-solid fa-magnifying-glass absolute left-2 text-slate-400 text-[10px] pointer-events-none"></i>
            <input
              type="text"
              placeholder="Buscar partida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              title="Filtrar partidas por nombre en tiempo real"
              className="h-7 w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 text-slate-200 text-xs rounded pl-6 pr-5 py-0 outline-none shadow-inner transition-colors placeholder:text-slate-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
                className="absolute right-1.5 text-slate-400 hover:text-white text-[10px] p-0.5 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Selector de Filtro */}
          <div className="relative flex items-center shrink-0">
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              title="Filtrar partidas por estado"
              className="h-7 bg-slate-900/90 border border-slate-700 focus:border-blue-500 text-slate-200 text-xs rounded px-2.5 py-0 outline-none cursor-pointer transition-colors font-medium"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="CRITICAL">Partidas Críticas</option>
              <option value="DELAYED">Con Retraso</option>
            </select>
          </div>
        </div>

        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center select-none pt-0.5 border-t border-slate-700/40 mt-1 w-full">
          Filtros
        </span>
      </div>

      {/* SECCIÓN 4: DATOS & REPORTES */}
      <div className="flex-[0.8] min-w-[190px] px-3 py-1.5 flex flex-col justify-between bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
        <div className="flex items-center justify-center min-h-[30px]">
          {/* Botón Excel (Importar/Exportar) */}
          <button
            onClick={() => setExcelModalOpen(true)}
            title="Importar o Exportar a Microsoft Excel (.xlsx)"
            className="h-7 w-full bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/50 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <i className="fa-solid fa-file-excel text-xs text-emerald-200"></i>
            <span>Excel (Importar / Exportar)</span>
          </button>
        </div>

        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center select-none pt-0.5 border-t border-slate-700/40 mt-1 w-full">
          Datos & Reportes
        </span>
      </div>
    </div>
  );
};
