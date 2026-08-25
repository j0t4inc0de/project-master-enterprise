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

  const { activeTab, setActiveTab } = useUIStore();
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
    if (window.confirm('¿Estás seguro de crear un nuevo proyecto? Se reiniciarán las partidas actuales si no las has guardado en archivo.')) {
      resetProject();
    }
  };

  const handleExportPDF = async () => {
    try {
      const targetId = activeTab === 'dashboard' ? 'dashboard-container' : 'gantt-main-container';
      const reportName = activeTab === 'dashboard' ? 'Dashboard Ejecutivo' : 'Carta Gantt';
      await exportReportToPDF(targetId, { projectName, startDate, statusDate, cpmResult }, reportName);
    } catch (err) {
      alert('Error al exportar PDF: ' + err.message);
    }
  };

  return (
    <header className="bg-gradient-to-r from-indigo-950 via-[#09090b] to-[#09090b] border-b border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between shadow-md z-30 shrink-0 gap-3">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="bg-slate-800 p-2 rounded border border-slate-600 shadow-inner">
          <i className="fa-solid fa-layer-group text-blue-400 text-base"></i>
        </div>
        <div>
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                autoFocus
                className="bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-sm font-black text-white outline-none w-48"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                title="Haz clic para editar el nombre del proyecto"
                className="text-base font-black text-white flex items-center gap-2 cursor-pointer hover:text-blue-300 transition-colors"
              >
                {projectName || 'Project Master'}{' '}
                <span className="bg-blue-600 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest text-white">
                  Enterprise
                </span>
                <i className="fa-solid fa-pen text-[9px] text-slate-500 hover:text-white"></i>
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center">
              <i className="fa-solid fa-cloud-arrow-up animate-pulse mr-1"></i>Auto-Guardado Local
            </span>
            <span className="text-slate-600 text-[10px]">•</span>
            {cpmResult.hasCycle && (
              <span className="text-[9px] bg-rose-900/60 border border-rose-600 text-rose-300 font-bold px-1.5 rounded flex items-center">
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>Ciclo Detectado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Date Selectors + File Actions + Tab Navigation */}
      <div className="flex items-center gap-3">
        {/* Project Files Actions (Tarea 5) */}
        <div className="flex items-center bg-[#09090b]/90 p-1 rounded-xl border border-slate-700 shadow-inner gap-1">
          <button
            onClick={handleNewProject}
            title="Nuevo Proyecto"
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1"
          >
            <i className="fa-solid fa-file-circle-plus text-sky-400"></i>
            <span className="hidden sm:inline">Nuevo</span>
          </button>
          <button
            onClick={handleOpenProject}
            title="Abrir Proyecto (.json)"
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1 border-l border-slate-700"
          >
            <i className="fa-solid fa-folder-open text-amber-400"></i>
            <span className="hidden sm:inline">Abrir</span>
          </button>
          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            title="Guardar Proyecto en Archivo (.json)"
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1 border-l border-slate-700"
          >
            <i className="fa-solid fa-floppy-disk text-emerald-400"></i>
            <span className="hidden sm:inline">Guardar</span>
          </button>
          <button
            onClick={handleExportPDF}
            title="Exportar Reporte Ejecutivo a PDF (Tarea 4)"
            className="px-2 py-1 rounded bg-rose-900/40 text-rose-300 hover:bg-rose-800 hover:text-white border border-rose-700/50 text-xs font-bold transition flex items-center gap-1 ml-1"
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span className="hidden md:inline">PDF</span>
          </button>
        </div>

        {/* Global Dates Panel */}
        <div className="flex items-center gap-2 bg-[#09090b]/80 p-1.5 rounded-xl border border-slate-700/80 shadow-inner">
          <div className="flex flex-col px-2">
            <span className="text-[7px] uppercase font-black text-blue-400">Inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white font-bold text-[10px] outline-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col px-2 border-l border-slate-600">
            <span className="text-[7px] uppercase font-black text-emerald-400">Estado</span>
            <input
              type="date"
              value={statusDate}
              onChange={(e) => setStatusDate(e.target.value)}
              className="bg-transparent text-white font-bold text-[10px] outline-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col px-2 border-l border-slate-600">
            <span className="text-[7px] uppercase font-black text-amber-400">Fin (EAC)</span>
            <span className="text-white font-bold text-[10px]">
              {pSum.end !== '-' ? formatD(pSum.end) : '-'}
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex bg-[#0f172a] p-1 rounded-xl border border-slate-700 overflow-x-auto gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${t.i}`}></i> {t.l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
