export const INIT_RESOURCES = [
  { id: 1, name: 'Cuadrilla Frontend', type: 'Trabajo', unit: 'Hrs', initials: 'DEV', group: 'Mano de Obra', capacity: 100, rate: 15000, costPerUse: 0, accrual: 'Prorrateo' },
  { id: 2, name: 'Servidores Cloud AWS', type: 'Costo', unit: 'Mes', initials: 'AWS', group: 'Infraestructura', capacity: 100, rate: 0, costPerUse: 50000, accrual: 'Inicio' },
  { id: 3, name: 'Hormigón H30', type: 'Material', unit: 'm3', initials: 'H30', group: 'Materiales', capacity: 100, rate: 85000, costPerUse: 12000, accrual: 'Prorrateo' }
];

export const INIT_TASKS = [
  { id: 1, name: 'Fase de Planificación', duration: 0, startDate: '2026-06-01', progress: 0, cost: 0, predecessors: '', resourceId: '', level: 1, startDelay: 0, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' },
  { id: 2, name: 'Levantamiento de Requisitos', duration: 12, startDate: '2026-06-01', progress: 100, cost: 150000, predecessors: '', resourceId: '', level: 2, startDelay: 0, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' },
  { id: 3, name: 'Aprobación de Arquitectura', duration: 2, startDate: '2026-06-17', progress: 100, cost: 240000, predecessors: '2', resourceId: 1, level: 2, startDelay: 0, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' },
  { id: 4, name: 'Instalación de Entornos', duration: 13, startDate: '2026-06-19', progress: 50, cost: 1560000, predecessors: '3', resourceId: 2, level: 2, startDelay: 0, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' },
  { id: 5, name: 'Fase de Desarrollo / Ejecución', duration: 0, startDate: '2026-06-01', progress: 0, cost: 0, predecessors: '', resourceId: '', level: 1, startDelay: 0, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' },
  { id: 6, name: 'Construcción Módulo A', duration: 14, startDate: '2026-06-11', progress: 0, cost: 400026, predecessors: '4', resourceId: 1, level: 2, startDelay: 2, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' },
  { id: 7, name: 'Pruebas Integrales', duration: 13, startDate: '2026-06-17', progress: 20, cost: 375026, predecessors: '6', resourceId: 1, level: 2, startDelay: 0, finishDelay: 0, manualStart: '', manualStatus: 'AUTO' }
];

export const INIT_HOLIDAYS = [
  { date: '2026-06-29', name: 'Feriado Nacional' },
  { date: '2026-07-16', name: 'Día de la Virgen del Carmen' }
];

export const INIT_WORKING_DAYS = {
  1: true, // Lunes
  2: true, // Martes
  3: true, // Miércoles
  4: true, // Jueves
  5: true, // Viernes
  6: true, // Sábado
  0: false // Domingo
};
