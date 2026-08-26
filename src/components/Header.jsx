import React, { useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useUIStore } from '../stores/uiStore';
import { formatD } from '../lib/cpmEngine';
import { saveProjectToFile, openProjectFromFile } from '../lib/projectStorage';
import { exportReportToPDF } from '../lib/pdfGenerator';

export const Header = () => {
  const {
    projectName,
    setProjectName,
    startDate,
    setStartDate,
    statusDate,
    setStatusDate,
    cpmResult,
    tasks,
    resources,
    holidays,
    workingDays,
    loadProjectData,
    resetProject,
  } = useProjectStore();

  const { activeTab, setActiveTab, setProjectsDrawerOpen } = useUIStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { pSum = {} } = cpmResult;

  const tabs = [
    { id: 'dashboard', i: 'fa-chart-pie', l: 'Dashboard' },
    { id: 'network', i: 'fa-diagram-project', l: 'Red' },
    { id: 'gantt', i: 'fa-stream', l: 'Gantt' },
    { id: 'scurve', i: 'fa-chart-area', l: 'Curva S' },
    { id: 'resources', i: 'fa-users', l: 'Recursos' },
    { id: 'calendar', i: 'fa-calendar-alt', l: 'Calendario' },
  ];

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      await saveProjectToFile({
        projectName,
        tasks,
        resources,
        holidays,
        startDate,
        statusDate,
        workingDays,
      });
      useProjectStore.getState().recalc({}, false);
    } catch (err) {
      alert('Error al guardar el proyecto: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenProject = async () => {
    try {
      const data = await openProjectFromFile();
      loadProjectData(data);
    } catch (err) {
      if (err.message !== 'No se seleccionó ningún archivo.') {
        alert(err.message);
      }
    }
  };

  const handleNewProject = () => {
    if (
      window.confirm(
        '¿Estás seguro de crear un nuevo proyecto? Se reiniciarán las partidas actuales si no las has guardado en archivo.'
      )
    ) {
      resetProject();
    }
  };

  const handleExportPDF = async () => {
    try {
      const targetId = activeTab === 'dashboard' ? 'dashboard-container' : 'gantt-main-container';
      const reportName = activeTab === 'dashboard' ? 'Dashboard Ejecutivo' : 'Carta Gantt';
      await exportReportToPDF(
        targetId,
        { projectName, startDate, statusDate, cpmResult },
        reportName
      );
    } catch (err) {
      alert('Error al exportar PDF: ' + err.message);
    }
  };

  return (
    <header className="bg-[#0f172a] border-b border-slate-700/80 px-3 py-1.5 flex flex-wrap items-center justify-between shadow-sm z-30 shrink-0 gap-2 select-none">
      {/* 1. SECCIÓN IZQUIERDA: Marca & Identidad del Proyecto */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setProjectsDrawerOpen(true)}
          title="Abrir Gestor de Proyectos (Favoritos y Recientes)"
          className="bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white p-2 rounded-md shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer group"
        >
          <i className="fa-solid fa-folder-tree text-sm group-hover:scale-110 transition-transform"></i>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            {isEditingTitle ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs font-bold text-white outline-none w-48 shadow-inner"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  onClick={() => setIsEditingTitle(true)}
                  title="Haz clic para renombrar el proyecto"
                  className="text-xs font-black text-white hover:text-blue-300 transition-colors cursor-pointer"
                >
                  {projectName || 'Nuevo Proyecto'}
                </span>
                <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Enterprise
                </span>
                <button
                  onClick={() => setProjectsDrawerOpen(true)}
                  title="Ver Proyectos Guardados"
                  className="text-slate-500 hover:text-amber-400 text-[10px] p-0.5 cursor-pointer transition-colors"
                >
                  <i className="fa-solid fa-angle-down"></i>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-medium">
            {cpmResult.hasCycle && (
              <>
                <span className="text-slate-600">•</span>
                <span className="bg-rose-950/80 border border-rose-600 text-rose-300 font-bold px-1.5 rounded flex items-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  Ciclo Detectado
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN CENTRAL: Pestañas de Navegación (Segmented Control Rectangular) */}
      <nav className="flex bg-slate-900/90 p-0.5 rounded-md border border-slate-700/80 gap-0.5 shadow-inner">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <i className={`fa-solid ${t.i} text-[11px]`}></i>
              <span>{t.l}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. SECCIÓN DERECHA: Fechas del Proyecto & Acciones de Archivo */}
      <div className="flex items-center gap-2">
        {/* Panel Rectangular de Fechas Clave */}
        <div className="flex items-center bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-700/80 shadow-inner text-xs">
          {/* Inicio */}
          <div className="flex flex-col px-1.5 py-0.5">
            <span className="text-[8px] uppercase font-bold text-blue-400 leading-none mb-0.5">
              Inicio
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Fecha de inicio general del proyecto"
              className="bg-transparent text-slate-200 font-bold text-[10px] outline-none cursor-pointer p-0"
            />
          </div>

          <div className="h-5 w-[1px] bg-slate-700"></div>

          {/* Estado */}
          <div className="flex flex-col px-1.5 py-0.5">
            <span className="text-[8px] uppercase font-bold text-emerald-400 leading-none mb-0.5">
              Estado
            </span>
            <input
              type="date"
              value={statusDate}
              onChange={(e) => setStatusDate(e.target.value)}
              title="Fecha de corte / avance actual del proyecto"
              className="bg-transparent text-slate-200 font-bold text-[10px] outline-none cursor-pointer p-0"
            />
          </div>

          <div className="h-5 w-[1px] bg-slate-700"></div>

          {/* Fin EAC */}
          <div className="flex flex-col px-1.5 py-0.5">
            <span className="text-[8px] uppercase font-bold text-amber-400 leading-none mb-0.5">
              Fin (EAC)
            </span>
            <span className="text-slate-200 font-bold text-[10px] leading-tight">
              {pSum.end !== '-' ? formatD(pSum.end) : '-'}
            </span>
          </div>
        </div>

        {/* Acciones de Archivo */}
        <div className="flex items-center bg-slate-900/90 p-0.5 rounded-md border border-slate-700/80 shadow-inner gap-0.5">
          <button
            onClick={handleNewProject}
            title="Crear Nuevo Proyecto en Blanco"
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-file-circle-plus text-sky-400 text-[11px]"></i>
            <span className="hidden xl:inline">Nuevo</span>
          </button>

          <button
            onClick={handleOpenProject}
            title="Abrir Archivo de Proyecto (.json)"
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 border-l border-slate-800 cursor-pointer"
          >
            <i className="fa-solid fa-folder-open text-amber-400 text-[11px]"></i>
            <span className="hidden xl:inline">Abrir</span>
          </button>

          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            title="Guardar Proyecto en Archivo (.json)"
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 border-l border-slate-800 cursor-pointer"
          >
            <i
              className={`fa-solid ${
                isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'
              } text-emerald-400 text-[11px]`}
            ></i>
            <span className="hidden xl:inline">Guardar</span>
          </button>

          <button
            onClick={handleExportPDF}
            title="Exportar Informe Ejecutivo a PDF"
            className="px-2 py-1 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-900 hover:text-white border border-rose-700/50 text-xs font-bold transition-all flex items-center gap-1.5 ml-0.5 cursor-pointer"
          >
            <i className="fa-solid fa-file-pdf text-[11px]"></i>
            <span>PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
