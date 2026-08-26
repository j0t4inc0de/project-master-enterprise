import { create } from 'zustand';
import { INIT_TASKS, INIT_RESOURCES, INIT_HOLIDAYS, INIT_WORKING_DAYS } from '../lib/constants.js';
import { computeProjectCPM } from '../lib/cpmEngine.js';

const STORAGE_KEY = 'pme_project_v1';
const SAVED_PROJECTS_KEY = 'pme_saved_projects_v1';
const MAX_HISTORY = 20;

const clone = (data) => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch {
      // fallback
    }
  }
  return JSON.parse(JSON.stringify(data));
};

const createSnapshot = (state) => ({
  projectName: state.projectName,
  tasks: clone(state.tasks),
  resources: clone(state.resources),
  holidays: clone(state.holidays),
  startDate: state.startDate,
  statusDate: state.statusDate,
  workingDays: clone(state.workingDays),
  autoProgress: state.autoProgress ?? false,
});

const loadSavedProjectsList = () => {
  try {
    const raw = localStorage.getItem(SAVED_PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error al cargar lista de proyectos:', e);
  }
  return [];
};

const saveProjectsListToStorage = (list) => {
  try {
    localStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error al guardar lista de proyectos:', e);
  }
};

const getInitialState = () => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        projectName: parsed.projectName || 'Nuevo Proyecto',
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        resources: Array.isArray(parsed.resources) ? parsed.resources : [],
        holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
        startDate: parsed.startDate || today,
        statusDate: parsed.statusDate || today,
        workingDays: parsed.workingDays || INIT_WORKING_DAYS,
      };
    }
  } catch (e) {
    console.error('Error al cargar localStorage:', e);
  }

  return {
    projectName: 'Nuevo Proyecto',
    tasks: [],
    resources: [],
    holidays: [],
    startDate: today,
    statusDate: today,
    workingDays: INIT_WORKING_DAYS,
  };
};

const initial = getInitialState();

export const useProjectStore = create((set, get) => ({
  projectName: initial.projectName,
  tasks: initial.tasks,
  resources: initial.resources,
  holidays: initial.holidays,
  startDate: initial.startDate,
  statusDate: initial.statusDate,
  workingDays: initial.workingDays,
  autoProgress: false,

  // Lista de proyectos guardados (Favoritos & Recientes)
  savedProjects: loadSavedProjectsList(),

  // Historial de Undo / Redo
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  // Resultado CPM computado
  cpmResult: computeProjectCPM({
    tasks: initial.tasks,
    resources: initial.resources,
    holidays: initial.holidays,
    startDate: initial.startDate,
    statusDate: initial.statusDate,
    workingDays: initial.workingDays,
    autoProgress: false,
  }),

  // Recalcular CPM y persistir
  recalc: (updates = {}, recordHistory = true) => {
    const state = get();
    let past = state.past || [];
    let future = state.future || [];

    if (recordHistory) {
      const prevSnapshot = createSnapshot(state);
      past = [...past, prevSnapshot];
      if (past.length > MAX_HISTORY) {
        past = past.slice(past.length - MAX_HISTORY);
      }
      future = [];
    }

    const current = { ...state, ...updates };
    const cpmResult = computeProjectCPM({
      tasks: current.tasks,
      resources: current.resources,
      holidays: current.holidays,
      startDate: current.startDate,
      statusDate: current.statusDate,
      workingDays: current.workingDays,
      autoProgress: current.autoProgress,
    });

    // Actualizar lista de proyectos recientes/guardados
    const savedList = loadSavedProjectsList();
    const currentName = current.projectName || 'Nuevo Proyecto';
    const now = new Date().toISOString();
    const taskCount = (current.tasks || []).length;
    const totalCost = cpmResult?.pSum?.cost || 0;

    let updatedList;
    const existingIdx = savedList.findIndex((p) => p.name.trim().toLowerCase() === currentName.trim().toLowerCase());
    if (existingIdx >= 0) {
      const isFav = savedList[existingIdx].isFavorite || false;
      savedList[existingIdx] = {
        ...savedList[existingIdx],
        name: currentName,
        isFavorite: isFav,
        updatedAt: now,
        taskCount,
        totalCost,
        data: {
          projectName: currentName,
          tasks: clone(current.tasks),
          resources: clone(current.resources),
          holidays: clone(current.holidays),
          startDate: current.startDate,
          statusDate: current.statusDate,
          workingDays: clone(current.workingDays),
        },
      };
      updatedList = [...savedList];
    } else if (taskCount > 0) {
      const newEntry = {
        id: `p_${Date.now()}`,
        name: currentName,
        isFavorite: false,
        updatedAt: now,
        taskCount,
        totalCost,
        data: {
          projectName: currentName,
          tasks: clone(current.tasks),
          resources: clone(current.resources),
          holidays: clone(current.holidays),
          startDate: current.startDate,
          statusDate: current.statusDate,
          workingDays: clone(current.workingDays),
        },
      };
      updatedList = [newEntry, ...savedList].slice(0, 15);
    } else {
      updatedList = savedList;
    }
    saveProjectsListToStorage(updatedList);

    set({
      ...updates,
      cpmResult,
      past,
      future,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      savedProjects: updatedList,
    });

    // Guardar en localStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          projectName: current.projectName,
          tasks: current.tasks,
          resources: current.resources,
          holidays: current.holidays,
          startDate: current.startDate,
          statusDate: current.statusDate,
          workingDays: current.workingDays,
        })
      );
    } catch (e) {
      console.error('Error al guardar en localStorage:', e);
    }
  },

  // Acciones de Undo / Redo
  undo: () => {
    const { past, future } = get();
    if (!past || past.length === 0) return;

    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot = createSnapshot(get());
    const newFuture = [currentSnapshot, ...future].slice(0, MAX_HISTORY);

    const cpmResult = computeProjectCPM({
      tasks: previousSnapshot.tasks,
      resources: previousSnapshot.resources,
      holidays: previousSnapshot.holidays,
      startDate: previousSnapshot.startDate,
      statusDate: previousSnapshot.statusDate,
      workingDays: previousSnapshot.workingDays,
      autoProgress: previousSnapshot.autoProgress,
    });

    set({
      projectName: previousSnapshot.projectName,
      tasks: previousSnapshot.tasks,
      resources: previousSnapshot.resources,
      holidays: previousSnapshot.holidays,
      startDate: previousSnapshot.startDate,
      statusDate: previousSnapshot.statusDate,
      workingDays: previousSnapshot.workingDays,
      autoProgress: previousSnapshot.autoProgress,
      cpmResult,
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (!future || future.length === 0) return;

    const nextSnapshot = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot = createSnapshot(get());
    const newPast = [...past, currentSnapshot].slice(-MAX_HISTORY);

    const cpmResult = computeProjectCPM({
      tasks: nextSnapshot.tasks,
      resources: nextSnapshot.resources,
      holidays: nextSnapshot.holidays,
      startDate: nextSnapshot.startDate,
      statusDate: nextSnapshot.statusDate,
      workingDays: nextSnapshot.workingDays,
      autoProgress: nextSnapshot.autoProgress,
    });

    set({
      projectName: nextSnapshot.projectName,
      tasks: nextSnapshot.tasks,
      resources: nextSnapshot.resources,
      holidays: nextSnapshot.holidays,
      startDate: nextSnapshot.startDate,
      statusDate: nextSnapshot.statusDate,
      workingDays: nextSnapshot.workingDays,
      autoProgress: nextSnapshot.autoProgress,
      cpmResult,
      past: newPast,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },

  // Gestión de Favoritos & Proyectos Guardados
  toggleFavoriteProject: (id) => {
    const list = loadSavedProjectsList();
    const updated = list.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    saveProjectsListToStorage(updated);
    set({ savedProjects: updated });
  },

  toggleCurrentFavorite: () => {
    const { projectName } = get();
    const list = loadSavedProjectsList();
    const existing = list.find((p) => p.name.trim().toLowerCase() === projectName.trim().toLowerCase());
    if (existing) {
      get().toggleFavoriteProject(existing.id);
    }
  },

  deleteSavedProject: (id) => {
    const list = loadSavedProjectsList();
    const updated = list.filter((p) => p.id !== id);
    saveProjectsListToStorage(updated);
    set({ savedProjects: updated });
  },

  loadSavedProject: (id) => {
    const list = loadSavedProjectsList();
    const target = list.find((p) => p.id === id);
    if (target && target.data) {
      get().recalc(
        {
          projectName: target.data.projectName || target.name,
          tasks: clone(target.data.tasks || []),
          resources: clone(target.data.resources || []),
          holidays: clone(target.data.holidays || []),
          startDate: target.data.startDate || new Date().toISOString().split('T')[0],
          statusDate: target.data.statusDate || target.data.startDate,
          workingDays: clone(target.data.workingDays || INIT_WORKING_DAYS),
          past: [],
          future: [],
          canUndo: false,
          canRedo: false,
        },
        false
      );
    }
  },

  // Setters básicos
  setProjectName: (projectName) => get().recalc({ projectName }),
  setStartDate: (startDate) => get().recalc({ startDate }),
  setStatusDate: (statusDate) => get().recalc({ statusDate }),
  setWorkingDays: (workingDays) => get().recalc({ workingDays }),
  setAutoProgress: (autoProgress) => get().recalc({ autoProgress }),

  // Acciones de Tareas
  setTasks: (tasks) => get().recalc({ tasks }),

  updateTask: (id, field, value) => {
    const parsedVal = ['duration', 'startDelay', 'finishDelay'].includes(field)
      ? value === ''
        ? ''
        : Math.max(0, parseInt(value))
      : field === 'cost' || field === 'progress'
      ? isNaN(Number(value))
        ? 0
        : Number(value)
      : value;

    const newTasks = get().tasks.map((t) => (t.id === id ? { ...t, [field]: parsedVal } : t));
    get().recalc({ tasks: newTasks });
  },

  addTask: (autoLink = true) => {
    const { tasks, startDate } = get();
    const newId = Math.max(...tasks.map((x) => x.id), 0) + 1;
    const prevTask = tasks[tasks.length - 1];
    const newPred = autoLink && prevTask ? String(prevTask.id) : '';

    const newTask = {
      id: newId,
      name: 'Nueva Partida Principal',
      duration: 1,
      startDate,
      progress: 0,
      cost: 0,
      predecessors: newPred,
      startDelay: 0,
      finishDelay: 0,
      resourceId: '',
      level: 1,
      manualStart: '',
      manualStatus: 'AUTO',
    };

    get().recalc({ tasks: [...tasks, newTask] });
  },

  insertTask: (targetId, type = 'S', autoLink = true) => {
    const { tasks, startDate } = get();
    const idx = tasks.findIndex((x) => x.id === targetId);
    if (idx === -1) return;

    const target = tasks[idx];
    const newId = Math.max(...tasks.map((x) => x.id), 0) + 1;
    let newLevel = target.level;
    let newPred = '';
    let insertIdx = idx + 1;

    if (type === 'C') {
      newLevel++;
      while (insertIdx < tasks.length && tasks[insertIdx].level > target.level) insertIdx++;
      if (autoLink && insertIdx > idx + 1) newPred = String(tasks[insertIdx - 1].id);
    } else if (type === 'S') {
      while (insertIdx < tasks.length && tasks[insertIdx].level > target.level) insertIdx++;
      if (autoLink) newPred = String(target.id);
    }

    const arr = [...tasks];
    arr.splice(insertIdx, 0, {
      id: newId,
      name: 'Nueva Partida',
      duration: 1,
      startDate,
      progress: 0,
      cost: 0,
      predecessors: newPred,
      startDelay: 0,
      finishDelay: 0,
      resourceId: '',
      level: newLevel,
      manualStart: '',
      manualStatus: 'AUTO',
    });

    get().recalc({ tasks: arr });
  },

  deleteTask: (id) => {
    const newTasks = get().tasks.filter((x) => x.id !== id);
    get().recalc({ tasks: newTasks });
  },

  indentTask: (id) => {
    const { tasks } = get();
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx > 0 && tasks[idx].level <= tasks[idx - 1].level) {
      const arr = [...tasks];
      const children = [];
      let j = idx + 1;
      while (j < arr.length && arr[j].level > tasks[idx].level) {
        children.push(j);
        j++;
      }
      arr[idx].level++;
      children.forEach((cIdx) => arr[cIdx].level++);
      get().recalc({ tasks: arr });
    }
  },

  outdentTask: (id) => {
    const { tasks } = get();
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx >= 0 && tasks[idx].level > 1) {
      const arr = [...tasks];
      const children = [];
      let j = idx + 1;
      while (j < arr.length && arr[j].level > tasks[idx].level) {
        children.push(j);
        j++;
      }
      arr[idx].level--;
      children.forEach((cIdx) => arr[cIdx].level--);
      get().recalc({ tasks: arr });
    }
  },

  // Acciones de Recursos
  setResources: (resources) => get().recalc({ resources }),

  addResource: () => {
    const { resources } = get();
    const newId = Math.max(...resources.map((r) => r.id), 0) + 1;
    const newRes = {
      id: newId,
      name: 'Nuevo Recurso',
      type: 'Trabajo',
      unit: 'Hrs',
      initials: 'NR',
      group: 'General',
      capacity: 100,
      rate: 0,
      costPerUse: 0,
      accrual: 'Prorrateo',
    };
    get().recalc({ resources: [...resources, newRes] });
  },

  updateResource: (id, field, value) => {
    const parsedVal = ['capacity', 'rate', 'costPerUse'].includes(field) ? parseInt(value) || 0 : value;
    const newResources = get().resources.map((r) => (r.id === id ? { ...r, [field]: parsedVal } : r));
    get().recalc({ resources: newResources });
  },

  deleteResource: (id) => {
    const newResources = get().resources.filter((r) => r.id !== id);
    get().recalc({ resources: newResources });
  },

  // Acciones de Calendario y Feriados
  setHolidays: (holidays) => get().recalc({ holidays }),

  addHoliday: (holiday) => {
    const newHolidays = [...get().holidays, holiday].sort((a, b) => new Date(a.date) - new Date(b.date));
    get().recalc({ holidays: newHolidays });
  },

  deleteHoliday: (dateStr) => {
    const newHolidays = get().holidays.filter((h) => h.date !== dateStr);
    get().recalc({ holidays: newHolidays });
  },

  // Cargar proyecto completo (desde archivo o template)
  loadProjectData: (projectData) => {
    get().recalc(
      {
        projectName: projectData.projectName || 'Proyecto Importado',
        tasks: clone(projectData.tasks || []),
        resources: clone(projectData.resources || []),
        holidays: clone(projectData.holidays || []),
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        statusDate: projectData.statusDate || projectData.startDate,
        workingDays: clone(projectData.workingDays || INIT_WORKING_DAYS),
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
      },
      false
    );
  },

  resetProject: () => {
    localStorage.removeItem(STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    get().recalc(
      {
        projectName: 'Nuevo Proyecto',
        tasks: [],
        resources: [],
        holidays: [],
        startDate: today,
        statusDate: today,
        workingDays: INIT_WORKING_DAYS,
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
      },
      false
    );
  },

  loadDemoProject: () => {
    get().recalc(
      {
        projectName: 'Construcción Edificio Central',
        tasks: clone(INIT_TASKS),
        resources: clone(INIT_RESOURCES),
        holidays: clone(INIT_HOLIDAYS),
        startDate: '2026-06-01',
        statusDate: '2026-06-15',
        workingDays: clone(INIT_WORKING_DAYS),
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
      },
      true
    );
  },
}));
