import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { exportProjectToExcel, importTasksFromExcel, downloadExampleTemplate } from '../../lib/excelHandler';

export const ExcelModal = ({ isOpen, onClose }) => {
  const { projectName, tasks, resources, holidays, startDate, statusDate, workingDays, setTasks, setResources } =
    useProjectStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'append'

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await downloadExampleTemplate();
      setSuccessMsg('¡Plantilla de ejemplo descargada exitosamente!');
    } catch (err) {
      setErrorMsg('Error al descargar plantilla: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await exportProjectToExcel({
        projectName,
        tasks,
        resources,
        holidays,
        startDate,
        statusDate,
        workingDays,
      });
      setSuccessMsg('¡Archivo Excel exportado exitosamente!');
    } catch (err) {
      setErrorMsg('Error al exportar: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const result = await importTasksFromExcel(file, startDate);
      const importedTasks = Array.isArray(result) ? result : (result.tasks || []);
      const importedResources = Array.isArray(result) ? null : result.resources;

      // Cargar o anexar Recursos si están presentes en el Excel
      if (importedResources && importedResources.length > 0) {
        if (importMode === 'replace') {
          setResources(importedResources);
        } else {
          const currentRes = resources;
          const offsetResId = Math.max(...currentRes.map((r) => r.id), 0);
          const existingNames = new Set(currentRes.map((r) => r.name.toLowerCase().trim()));
          const newRes = [];
          importedResources.forEach((r, idx) => {
            if (!existingNames.has(r.name.toLowerCase().trim())) {
              newRes.push({ ...r, id: offsetResId + idx + 1 });
            }
          });
          if (newRes.length > 0) {
            setResources([...currentRes, ...newRes]);
          }
        }
      }

      // Cargar o anexar Tareas
      if (importMode === 'replace') {
        setTasks(importedTasks);
        setSuccessMsg(
          `Se importaron ${importedTasks.length} partidas${
            importedResources && importedResources.length > 0
              ? ` y ${importedResources.length} recursos del Pool`
              : ''
          } exitosamente (reemplazando los datos anteriores).`
        );
      } else {
        const currentTasks = tasks;
        const offsetId = Math.max(...currentTasks.map((x) => x.id), 0);
        const renumbered = importedTasks.map((t, idx) => ({ ...t, id: offsetId + idx + 1 }));
        setTasks([...currentTasks, ...renumbered]);
        setSuccessMsg(
          `Se anexaron ${renumbered.length} nuevas partidas${
            importedResources && importedResources.length > 0
              ? ` y se actualizaron los recursos`
              : ''
          } al proyecto actual.`
        );
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-file-excel text-emerald-400"></i>
            Integración con Microsoft Excel
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <i className="fa-solid fa-times text-lg"></i>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/60 border border-rose-600 text-rose-300 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-base"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-xs p-3 rounded-lg mb-4 flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-base"></i>
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Opción 1: Exportar a Excel */}
          <div className="bg-slate-900/60 border border-slate-700/80 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <i className="fa-solid fa-file-export text-blue-400"></i>
              1. Descargar Partidas en Excel
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Genera un libro con las hojas <strong>Partidas Gantt</strong> y <strong>Pool de Recursos</strong> formateado con fórmulas y estilos.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow"
              >
                <i className="fa-solid fa-download"></i>
                {isLoading ? 'Generando...' : 'Descargar Archivo .xlsx'}
              </button>
              <button
                onClick={handleDownloadTemplate}
                disabled={isLoading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-bold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow"
                title="Descargar una plantilla en blanco con partidas de ejemplo"
              >
                <i className="fa-solid fa-file-lines text-amber-400"></i>
                Plantilla de Ejemplo
              </button>
            </div>
          </div>

          {/* Opción 2: Importar desde Excel */}
          <div className="bg-slate-900/60 border border-slate-700/80 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <i className="fa-solid fa-file-import text-emerald-400"></i>
              2. Cargar Partidas desde Excel / CSV
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Sube tu planilla de obra. Detectaremos automáticamente las columnas de descripción, duración, predecesoras y costos.
            </p>

            <div className="flex items-center gap-4 mb-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="accent-blue-500"
                />
                <span>Reemplazar proyecto actual</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={(e) => setImportMode(e.target.value)}
                  className="accent-blue-500"
                />
                <span>Anexar al final</span>
              </label>
            </div>

            <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer shadow">
              <i className="fa-solid fa-upload"></i>
              <span>{isLoading ? 'Procesando...' : 'Seleccionar Archivo Excel (.xlsx)'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
