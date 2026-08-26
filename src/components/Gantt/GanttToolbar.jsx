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
      // Ignorar si el foco está en un input o textarea editable
      const target = e.target;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            // Ctrl + Shift + Z -> Rehacer
            if (!isInput && redo) {
              e.preventDefault();
              redo();
            }
          } else {
            // Ctrl + Z -> Deshacer
            if (!isInput && undo) {
              e.preventDefault();
              undo();
            }
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          // Ctrl + Y -> Rehacer
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
    <div className="flex flex-col shrink-0 border-b border-[#334155] bg-[#0f172a] shadow-md z-20 select-none">
      <div className="px-3 py-1.5 flex flex-wrap items-stretch gap-2.5 overflow-x-auto custom-scrollbar">
        {/* GRUPO 1: EDICIÓN & TAREAS */}
        <div className="flex flex-col justify-between bg-[#1e293b]/80 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 shadow-sm transition-all">
          <div className="flex items-center gap-2 min-h-[32px]">
            {/* Botón + Partida */}
            <button
              onClick={() => addTask(autoLink)}
              title="Añadir una nueva partida principal al final del cronograma (+ Partida)"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm shadow-blue-900/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-circle-plus text-sm"></i>
              <span>+ Partida</span>
            </button>

            {/* Separador vertical sutil */}
            <div className="h-6 w-[1px] bg-slate-700/80 mx-0.5"></div>

            {/* Botones Deshacer y Rehacer */}
            <div className="flex items-center bg-slate-900/70 p-0.5 rounded-md border border-slate-700/80">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Deshacer última acción (Ctrl+Z)"
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  canUndo
                    ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <i className="fa-solid fa-arrow-rotate-left"></i>
                <span className="hidden sm:inline text-[11px]">Deshacer</span>
              </button>

              <button
                onClick={redo}
                disabled={!canRedo}
                title="Rehacer acción deshecha (Ctrl+Y)"
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all border-l border-slate-800 ${
                  canRedo
                    ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <i className="fa-solid fa-arrow-rotate-right"></i>
                <span className="hidden sm:inline text-[11px]">Rehacer</span>
              </button>
            </div>

            {/* Separador vertical sutil */}
            <div className="h-6 w-[1px] bg-slate-700/80 mx-0.5"></div>

            {/* Toggle Auto-Vincular */}
            <label
              title="Auto-Vincular: Conectar automáticamente nuevas tareas con la anterior"
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
                autoLink
                  ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 shadow-inner'
                  : 'bg-slate-900/40 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <input
                type="checkbox"
                checked={autoLink}
                onChange={(e) => setAutoLink(e.target.checked)}
                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <i className="fa-solid fa-link text-[11px] text-blue-400"></i>
              <span>Auto-Vincular</span>
            </label>

            {/* Toggle Auto-Progreso */}
            <label
              title="Auto-Progreso: Cálculo automático de avance físico y estado según fecha de corte y CPM"
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
                autoProgress
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-inner'
                  : 'bg-slate-900/40 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <input
                type="checkbox"
                checked={autoProgress}
                onChange={(e) => setAutoProgress(e.target.checked)}
                className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              <i className="fa-solid fa-robot text-[11px] text-emerald-400"></i>
              <span>Auto-Progreso</span>
            </label>
          </div>

          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400/90 text-center select-none pt-1 border-t border-slate-700/50 mt-1">
            Edición & Tareas
          </span>
        </div>

        {/* GRUPO 2: NAVEGACIÓN & ESCALA */}
        <div className="flex flex-col justify-between bg-[#1e293b]/80 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 shadow-sm transition-all">
          <div className="flex items-center gap-2 min-h-[32px]">
            {/* Botón Ir a Hoy */}
            <button
              onClick={onGoToToday}
              title="Centrar la vista Gantt en la fecha de estado / Hoy"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/80 px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-crosshairs text-sky-400"></i>
              <span>Ir a Hoy</span>
            </button>

            {/* Toggle Ver Enlaces */}
            <button
              onClick={() => setShowLinks(!showLinks)}
              title="Mostrar u ocultar flechas de dependencias entre partidas en el Gantt"
              className={`px-2.5 py-1.5 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                showLinks
                  ? 'bg-blue-600 border-blue-500 text-white shadow-blue-900/40'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600/80 text-slate-300 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-bezier-curve"></i>
              <span>Ver Enlaces</span>
            </button>

            {/* Controles de Zoom */}
            <div className="flex items-center bg-slate-900/80 rounded-md border border-slate-700/80 p-0.5 shadow-inner">
              <button
                onClick={() => setZoom(zoom - 4)}
                title="Disminuir Zoom de Escala Temporal (-4px)"
                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all text-xs active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-magnifying-glass-minus"></i>
              </button>

              <button
                onClick={() => setZoom(24)}
                title={`Nivel de Zoom actual: ${zoomPct}% (${zoom}px/día). Haz clic para restablecer al 100% (24px)`}
                className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300 hover:text-blue-300 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
              >
                {zoomPct}%
              </button>

              <button
                onClick={onFitZoom}
                title="Ajustar Escala Temporal al Ancho Visible de Pantalla"
                className="px-2 py-1 text-[10px] font-black uppercase text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded border-x border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
              >
                <i className="fa-solid fa-arrows-left-right-to-line text-[10px]"></i>
                <span>Ajustar</span>
              </button>

              <button
                onClick={() => setZoom(zoom + 4)}
                title="Aumentar Zoom de Escala Temporal (+4px)"
                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all text-xs active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-magnifying-glass-plus"></i>
              </button>
            </div>
          </div>

          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400/90 text-center select-none pt-1 border-t border-slate-700/50 mt-1">
            Navegación & Escala
          </span>
        </div>

        {/* GRUPO 3: FILTROS */}
        <div className="flex flex-col justify-between bg-[#1e293b]/80 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 shadow-sm transition-all">
          <div className="flex items-center gap-2 min-h-[32px]">
            {/* Buscador de partidas */}
            <div className="relative flex items-center">
              <i className="fa-solid fa-magnifying-glass absolute left-2.5 text-slate-400 text-[11px] pointer-events-none"></i>
              <input
                type="text"
                placeholder="Buscar partida..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                title="Filtrar partidas por nombre en tiempo real"
                className="bg-slate-900/90 border border-slate-700 focus:border-blue-500 text-slate-200 text-xs rounded-md pl-7 pr-6 py-1 outline-none w-44 shadow-inner transition-colors placeholder:text-slate-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Limpiar búsqueda"
                  className="absolute right-2 text-slate-400 hover:text-white text-[11px] p-0.5 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Selector de Filtro */}
            <div className="relative flex items-center">
              <i className="fa-solid fa-filter absolute left-2.5 text-blue-400 text-[11px] pointer-events-none"></i>
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                title="Filtrar partidas según su estado (Todos, Críticas o Retrasadas)"
                className="bg-slate-900/90 border border-slate-700 focus:border-blue-500 text-slate-200 text-xs rounded-md pl-7 pr-2.5 py-1 outline-none cursor-pointer transition-colors font-medium"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="CRITICAL">Partidas Críticas</option>
                <option value="DELAYED">Con Retraso</option>
              </select>
            </div>
          </div>

          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400/90 text-center select-none pt-1 border-t border-slate-700/50 mt-1">
            Filtros
          </span>
        </div>

        {/* GRUPO 4: DATOS & REPORTES */}
        <div className="flex flex-col justify-between bg-[#1e293b]/80 border border-slate-700/80 hover:border-slate-600 rounded-lg px-2.5 py-1.5 shadow-sm transition-all">
          <div className="flex items-center gap-2 min-h-[32px]">
            {/* Botón Excel (Importar/Exportar) */}
            <button
              onClick={() => setExcelModalOpen(true)}
              title="Abrir asistente para Importar o Exportar cronograma a Microsoft Excel (.xlsx)"
              className="bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-emerald-100 hover:text-white border border-emerald-500/40 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <i className="fa-solid fa-file-excel text-sm text-emerald-300"></i>
              <span>Excel (Importar/Exportar)</span>
            </button>
          </div>

          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400/90 text-center select-none pt-1 border-t border-slate-700/50 mt-1">
            Datos & Reportes
          </span>
        </div>
      </div>
    </div>
  );
};
