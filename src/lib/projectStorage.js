/**
 * Módulo de guardado y apertura de proyectos multi-archivo (.json)
 * Soporta File System Access API nativa y fallback automático por Blob.
 */

export const saveProjectToFile = async (projectData) => {
  const { projectName, tasks, resources, holidays, startDate, statusDate, workingDays } = projectData;

  const payload = {
    app: 'Project Master Enterprise',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    projectName: projectName || 'Proyecto Sin Título',
    startDate,
    statusDate,
    workingDays,
    tasks,
    resources,
    holidays,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const cleanName = (projectName || 'proyecto').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const defaultFilename = `${cleanName}_${new Date().toISOString().split('T')[0]}.json`;

  // 1. Intentar con File System Access API (Chrome, Edge, Opera)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [
          {
            description: 'Archivo de Proyecto Master (.json)',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false; // Usuario canceló
      console.warn('Fallback a descarga tradicional:', err);
    }
  }

  // 2. Fallback estándar (Firefox, Safari o permisos denegados)
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
};

export const openProjectFromFile = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return reject(new Error('No se seleccionó ningún archivo.'));

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('El archivo no tiene una estructura de proyecto válida.');
        }

        resolve({
          projectName: parsed.projectName || file.name.replace('.json', ''),
          startDate: parsed.startDate || '2026-06-01',
          statusDate: parsed.statusDate || '2026-06-15',
          workingDays: parsed.workingDays || {},
          tasks: parsed.tasks || [],
          resources: parsed.resources || [],
          holidays: parsed.holidays || [],
        });
      } catch (err) {
        reject(new Error('Error al leer el archivo JSON: ' + err.message));
      }
    };

    input.click();
  });
};
