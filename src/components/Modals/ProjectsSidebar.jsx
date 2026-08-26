import React, { useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { openProjectFromFile } from '../../lib/projectStorage';

export const ProjectsSidebar = () => {
  const {
    projectName,
    tasks,
    cpmResult,
    savedProjects = [],
    loadSavedProject,
    toggleFavoriteProject,
    deleteSavedProject,
    resetProject,
    loadProjectData,
  } = useProjectStore();

  const { projectsDrawerOpen, setProjectsDrawerOpen } = useUIStore();

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && projectsDrawerOpen) {
        setProjectsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [projectsDrawerOpen, setProjectsDrawerOpen]);

  const currentProjectName = (projectName || 'Nuevo Proyecto').trim().toLowerCase();
  const currentSaved = savedProjects.find(
    (p) => p.name.trim().toLowerCase() === currentProjectName
  );
  const isCurrentFavorite = currentSaved ? currentSaved.isFavorite : false;

  const favorites = savedProjects.filter((p) => p.isFavorite);
  const recents = savedProjects.filter((p) => !p.isFavorite);

  const handleOpenJson = async () => {
    try {
      const data = await openProjectFromFile();
      loadProjectData(data);
      setProjectsDrawerOpen(false);
    } catch (err) {
      if (err.message !== 'No se seleccionó ningún archivo.') {
        alert(err.message);
      }
    }
  };

  const handleNew = () => {
    if (
      window.confirm(
        '¿Deseas iniciar un nuevo proyecto en blanco? (Los cambios del proyecto actual están guardados en tu historial).'
      )
    ) {
      resetProject();
      setProjectsDrawerOpen(false);
    }
  };

  const handleSelectProject = (id) => {
    loadSavedProject(id);
    setProjectsDrawerOpen(false);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 select-none transition-all duration-300 ${
        projectsDrawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
      }`}
    >
      {/* Fondo Oscuro con Desenfoque y Transición Suave */}
      <div
        onClick={() => setProjectsDrawerOpen(false)}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          projectsDrawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
      ></div>

      {/* Drawer Lateral Izquierdo con Animación Fluida */}
      <div
        className={`fixed inset-y-0 left-0 w-84 max-w-[85vw] bg-[#1e293b] border-r border-slate-700 shadow-2xl h-full flex flex-col z-50 text-slate-200 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          projectsDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="px-4 py-3.5 border-b border-slate-700 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600/20 border border-blue-500/40 text-blue-400 p-1.5 rounded-md flex items-center justify-center">
              <i className="fa-solid fa-folder-tree text-sm"></i>
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Mis Proyectos</h2>
              <p className="text-[10px] text-slate-400">Favoritos y Recientes</p>
            </div>
          </div>

          <button
            onClick={() => setProjectsDrawerOpen(false)}
            title="Cerrar (Esc)"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Acciones Rápidas */}
        <div className="p-3 border-b border-slate-700/60 bg-slate-900/40 flex items-center gap-2">
          <button
            onClick={handleNew}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-2.5 rounded-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Nuevo</span>
          </button>
          <button
            onClick={handleOpenJson}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-2.5 rounded-md border border-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <i className="fa-solid fa-folder-open text-amber-400 text-[10px]"></i>
            <span>Abrir .json</span>
          </button>
        </div>

        {/* Lista de Secciones con Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {/* SECCIÓN 1: PROYECTO ACTUAL */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 px-1 mb-1.5 block">
              Proyecto Actual
            </span>
            <div className="bg-gradient-to-r from-blue-950/70 to-slate-900 border border-blue-500/50 rounded-lg p-2.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white truncate">
                      {projectName || 'Nuevo Proyecto'}
                    </h3>
                    <span className="bg-blue-600/30 text-blue-300 text-[8px] font-bold px-1 rounded uppercase">
                      Activo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                    <span>
                      {tasks.length} {tasks.length === 1 ? 'partida' : 'partidas'}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      ${(cpmResult?.pSum?.cost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (currentSaved) {
                      toggleFavoriteProject(currentSaved.id);
                    } else {
                      useProjectStore.getState().recalc({}, false);
                      setTimeout(() => {
                        const list = useProjectStore.getState().savedProjects;
                        const curr = list.find(
                          (p) => p.name.trim().toLowerCase() === currentProjectName
                        );
                        if (curr) toggleFavoriteProject(curr.id);
                      }, 50);
                    }
                  }}
                  title={isCurrentFavorite ? 'Quitar de Favoritos' : 'Anclar a Favoritos'}
                  className={`p-1.5 rounded transition-all cursor-pointer ${
                    isCurrentFavorite
                      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                      : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  <i
                    className={`fa-${isCurrentFavorite ? 'solid' : 'regular'} fa-star text-sm`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: FAVORITOS (ANCLADOS) */}
          <div>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <i className="fa-solid fa-star text-[9px]"></i>
                Favoritos ({favorites.length})
              </span>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-700/80 rounded-lg p-3 text-center">
                <p className="text-[11px] text-slate-400 italic">
                  No hay proyectos anclados. Pulsa la estrella ⭐ en cualquier proyecto para tenerlo a mano.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {favorites.map((p) => {
                  const isSelected =
                    p.name.trim().toLowerCase() === currentProjectName;
                  return (
                    <div
                      key={p.id}
                      className={`group border rounded-lg p-2 transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/40 shadow-sm'
                          : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <div
                        onClick={() => handleSelectProject(p.id)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                          <span>{p.taskCount || 0} partidas</span>
                          <span>•</span>
                          <span>{formatTime(p.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleFavoriteProject(p.id)}
                          title="Quitar de favoritos"
                          className="text-amber-400 hover:text-slate-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-star text-xs"></i>
                        </button>
                        <button
                          onClick={() => deleteSavedProject(p.id)}
                          title="Eliminar del historial"
                          className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: RECIENTES */}
          <div>
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <i className="fa-regular fa-clock text-[9px]"></i>
                Recientes ({recents.length})
              </span>
            </div>

            {recents.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-700/80 rounded-lg p-3 text-center">
                <p className="text-[11px] text-slate-400 italic">
                  Tus proyectos abiertos recientemente aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recents.map((p) => {
                  const isSelected =
                    p.name.trim().toLowerCase() === currentProjectName;
                  return (
                    <div
                      key={p.id}
                      className={`group border rounded-lg p-2 transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/40 shadow-sm'
                          : 'bg-slate-900/50 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <div
                        onClick={() => handleSelectProject(p.id)}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-300 group-hover:text-white truncate">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                          <span>{p.taskCount || 0} partidas</span>
                          <span>•</span>
                          <span>{formatTime(p.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleFavoriteProject(p.id)}
                          title="Anclar a favoritos"
                          className="text-slate-600 hover:text-amber-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <i className="fa-regular fa-star text-xs"></i>
                        </button>
                        <button
                          onClick={() => deleteSavedProject(p.id)}
                          title="Eliminar del historial"
                          className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pie del Sidebar */}
        <div className="p-3 border-t border-slate-700/80 bg-slate-900/90 text-center text-[10px] text-slate-400">
          <i className="fa-solid fa-hard-drive text-blue-400 mr-1"></i>
          Almacenamiento Local Seguro
        </div>
      </div>
    </div>
  );
};
