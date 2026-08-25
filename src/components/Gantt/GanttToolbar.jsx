import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export const GanttToolbar = ({ onGoToToday, onFitZoom }) => {
  const { addTask, autoProgress, setAutoProgress } = useProjectStore();
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

  return (
    <div className="flex flex-col shrink-0 border-b border-slate-700 bg-[#1e293b] shadow-sm z-20">
      {/* Fila 1: Botones de Acción Primarios */}
      <div className="px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => addTask(autoLink)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold shadow flex gap-1.5 items-center transition-colors"
          >
            <i className="fa-solid fa-plus"></i> Añadir Partida Principal
          </button>

          {/* Botón Excel Real (Tarea 2) */}
          <button
            onClick={() => setExcelModalOpen(true)}
            className="bg-emerald-900/50 text-emerald-400 border border-emerald-700/60 hover:bg-emerald-800/60 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
          >
            <i className="fa-solid fa-file-excel"></i> Excel (Importar/Exportar)
          </button>

          <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer bg-slate-800 border border-slate-600 px-3 py-1 rounded hover:bg-slate-700 transition">
            <input
              type="checkbox"
              checked={autoProgress}
              onChange={(e) => setAutoProgress(e.target.checked)}
              className="hidden"
            />
            <i className="fa-solid fa-robot"></i> Cálculo Automático
          </label>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 ml-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoLink}
              onChange={(e) => setAutoLink(e.target.checked)}
              className="accent-blue-500 w-3.5 h-3.5"
            />
            Vincular Secuencialmente
          </label>
        </div>

        {/* Zoom & Vista */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGoToToday}
            className="px-3 py-1 text-xs font-bold bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-600 transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-crosshairs text-blue-400"></i> Ir a Hoy
          </button>

          <button
            onClick={() => setShowLinks(!showLinks)}
            className={`px-3 py-1 text-xs font-bold rounded border transition flex items-center gap-1.5 ${
              showLinks
                ? 'bg-blue-600 border-blue-500 text-white shadow'
                : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-link"></i> Ver Enlaces
          </button>

          <div className="flex bg-slate-800 rounded border border-slate-600 p-[1px]">
            <button
              onClick={() => setZoom(zoom - 4)}
              title="Disminuir Zoom"
              className="px-2 py-0.5 text-slate-400 hover:text-white transition"
            >
              <i className="fa-solid fa-search-minus"></i>
            </button>
            <button
              onClick={onFitZoom}
              title="Ajustar Escala al Ancho de Pantalla"
              className="px-2 py-0.5 text-[9px] font-black uppercase text-blue-400 border-x border-slate-600 hover:text-blue-300 transition"
            >
              Ajustar
            </button>
            <button
              onClick={() => setZoom(zoom + 4)}
              title="Aumentar Zoom"
              className="px-2 py-0.5 text-slate-400 hover:text-white transition"
            >
              <i className="fa-solid fa-search-plus"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Fila 2: Filtros y Búsqueda */}
      <div className="px-4 py-1.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs w-full">
          <i className="fa-solid fa-filter text-blue-400"></i>
          <span className="font-bold text-slate-300 uppercase text-[10px]">Filtros</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar Descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-slate-200 text-[11px] rounded pl-2 pr-6 py-1 outline-none w-52 shadow-inner focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px]"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            )}
          </div>
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
            className="bg-slate-900 border border-slate-600 text-slate-300 text-[11px] rounded px-2 py-1 outline-none cursor-pointer focus:border-blue-500"
          >
            <option value="ALL">📋 Estado: Todos</option>
            <option value="CRITICAL">🔥 Partidas Críticas</option>
            <option value="DELAYED">⚠️ Con Retraso</option>
          </select>
        </div>
      </div>
    </div>
  );
};
