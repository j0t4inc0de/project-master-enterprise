/**
 * Suite de Pruebas — excelHandler.js
 * Pruebas Funcionales y No Funcionales para Importacion y Exportacion de Excel
 *
 * Cobertura:
 *   exportProjectToExcel  — estructura del workbook, hojas, cabeceras, datos y formato
 *   importTasksFromExcel  — deteccion de hojas, mapeo de columnas, parseo de fechas y predicciones
 *   downloadExampleTemplate — formato de la plantilla de ejemplo
 *   Funciones helpers privadas (via integracion)
 *   Pruebas de rendimiento (no funcionales) — tiempo maximo de ejecucion para proyectos grandes
 *   Pruebas de robustez y borde — archivos vacios, datos corruptos, campos faltantes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { exportProjectToExcel, importTasksFromExcel, downloadExampleTemplate } from "./excelHandler.js";

// Helpers de Test

const makeTasks = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Partida ${i + 1}`,
    duration: (i % 10) + 1,
    level: i % 3 === 0 ? 1 : 2,
    isP: i % 3 === 0,
    ES: "2026-09-01",
    EF: "2026-09-10",
    predecessors: i > 0 ? String(i) : "",
    startDelay: 0,
    finishDelay: 0,
    resourceId: i % 2 === 0 ? 1 : 2,
    manualStatus: "AUTO",
    progress: i * 10,
    cost: (i + 1) * 100000,
  }));

const makeResources = () => [
  { id: 1, name: "Cuadrilla Carpinteria", type: "Trabajo", unit: "Hrs", initials: "CARP", group: "Mano de Obra", capacity: 100, rate: 12000, costPerUse: 0, accrual: "Prorrateo" },
  { id: 2, name: "Hormigon H25", type: "Material", unit: "m3", initials: "H25", group: "Materiales", capacity: 100, rate: 78000, costPerUse: 0, accrual: "Prorrateo" },
];

const bufferToWorkbook = async (buffer) => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
};

const workbookToFile = async (wb, filename = "test.xlsx") => {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  blob.arrayBuffer = async () => buffer;
  blob.name = filename;
  return blob;
};

const setupDomMock = () => {
  const anchor = { href: "", download: "", click: vi.fn() };
  vi.spyOn(document, "createElement").mockReturnValue(anchor);
  vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");
  vi.spyOn(window.URL, "revokeObjectURL").mockReturnValue(undefined);
  return anchor;
};

async function captureExportBuffer(tasks, resources, projectName) {
  vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");
  vi.spyOn(window.URL, "revokeObjectURL").mockReturnValue(undefined);
  vi.spyOn(document, "createElement").mockReturnValue({ href: "", download: "", click: vi.fn() });

  let capturedBuffer = null;
  const origBlob = global.Blob;
  global.Blob = class extends origBlob {
    constructor(parts, opts) {
      super(parts, opts);
      capturedBuffer = parts[0];
    }
  };

  await exportProjectToExcel({ projectName, tasks, resources });
  global.Blob = origBlob;

  if (!capturedBuffer) throw new Error("Buffer de exportacion no capturado");
  return capturedBuffer;
}

// BLOQUE 1: exportProjectToExcel
describe("exportProjectToExcel — Funcionales", () => {
  beforeEach(() => {
    setupDomMock();
  });

  it("genera exactamente 2 hojas: Partidas Gantt y Pool de Recursos", async () => {
    const buffer = await captureExportBuffer(makeTasks(3), makeResources(), "Proyecto Test");
    const wb = await bufferToWorkbook(buffer);
    expect(wb.worksheets).toHaveLength(2);
    expect(wb.worksheets[0].name).toBe("Partidas Gantt");
    expect(wb.worksheets[1].name).toBe("Pool de Recursos");
  });

  it("la hoja Gantt tiene exactamente 13 columnas con cabeceras correctas", async () => {
    const buffer = await captureExportBuffer(makeTasks(2), makeResources(), "Test");
    const wb = await bufferToWorkbook(buffer);
    const sheet = wb.getWorksheet("Partidas Gantt");
    const headers = sheet.getRow(1).values.filter(Boolean);
    expect(headers).toHaveLength(13);
    expect(headers).toContain("ID");
    expect(headers).toContain("Descripci\u00f3n de la Partida");
    expect(headers).toContain("Duraci\u00f3n \(d\u00edas\)");
    expect(headers).toContain("Predecesoras");
    expect(headers).toContain("% Avance");
    expect(headers).toContain("Costo ($ CLP)");
  });

  it("la hoja Pool de Recursos tiene exactamente 10 columnas", async () => {
    const buffer = await captureExportBuffer(makeTasks(1), makeResources(), "Test");
    const wb = await bufferToWorkbook(buffer);
    const sheet = wb.getWorksheet("Pool de Recursos");
    const headers = sheet.getRow(1).values.filter(Boolean);
    expect(headers).toHaveLength(10);
    expect(headers).toContain("Descripci\u00f3n del Recurso");
    expect(headers).toContain("Tarifa Est. ($/UM)");
    expect(headers).toContain("Acumulaci\u00f3n");
  });

  it("exporta el numero correcto de filas de tareas (N tareas = N+1 filas con cabecera)", async () => {
    const tasks = makeTasks(7);
    const buffer = await captureExportBuffer(tasks, makeResources(), "Test");
    const wb = await bufferToWorkbook(buffer);
    const sheet = wb.getWorksheet("Partidas Gantt");
    expect(sheet.rowCount).toBe(tasks.length + 1);
  });

  it("exporta el numero correcto de filas de recursos", async () => {
    const resources = makeResources();
    const buffer = await captureExportBuffer(makeTasks(2), resources, "Test");
    const wb = await bufferToWorkbook(buffer);
    const sheet = wb.getWorksheet("Pool de Recursos");
    expect(sheet.rowCount).toBe(resources.length + 1);
  });

  it("vincula correctamente el nombre del recurso asignado a cada tarea", async () => {
    const tasks = [{ ...makeTasks(1)[0], resourceId: 1 }];
    const buffer = await captureExportBuffer(tasks, makeResources(), "Test");
    const wb = await bufferToWorkbook(buffer);
    const sheet = wb.getWorksheet("Partidas Gantt");
    const resourceCell = sheet.getRow(2).getCell(10).value;
    expect(String(resourceCell)).toContain("Cuadrilla Carpinteria");
    expect(String(resourceCell)).toContain("CARP");
  });

  it("escribe N/A en recurso cuando la tarea no tiene resourceId valido", async () => {
    const task = { ...makeTasks(1)[0], resourceId: undefined };
    const buffer = await captureExportBuffer([task], makeResources(), "Test");
    const wb = await bufferToWorkbook(buffer);
    const resourceCell = wb.getWorksheet("Partidas Gantt").getRow(2).getCell(10).value;
    expect(String(resourceCell)).toBe("N/A");
  });

  it("dispara click() en el anchor para forzar la descarga", async () => {
    const anchor = setupDomMock();
    await exportProjectToExcel({ projectName: "Test", tasks: makeTasks(1), resources: [] });
    expect(anchor.click).toHaveBeenCalledOnce();
  });

  it("revoca la URL del objeto Blob despues de la descarga", async () => {
    await exportProjectToExcel({ projectName: "Test", tasks: makeTasks(1), resources: [] });
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("funciona correctamente con 0 tareas y 0 recursos (proyecto vacio)", async () => {
    const buffer = await captureExportBuffer([], [], "Vacio");
    const wb = await bufferToWorkbook(buffer);
    expect(wb.worksheets).toHaveLength(2);
    expect(wb.getWorksheet("Partidas Gantt").rowCount).toBe(1);
    expect(wb.getWorksheet("Pool de Recursos").rowCount).toBe(1);
  });

  it("las tareas padre (isP=true) tienen fuente en negrita en la hoja Gantt", async () => {
    const tasks = [{ ...makeTasks(1)[0], isP: true }];
    const buffer = await captureExportBuffer(tasks, [], "Test");
    const wb = await bufferToWorkbook(buffer);
    const dataRow = wb.getWorksheet("Partidas Gantt").getRow(2);
    expect(dataRow.font?.bold).toBe(true);
  });

  it("el progreso se almacena como fraccion decimal (0-1) en el Excel", async () => {
    const tasks = [{ ...makeTasks(1)[0], progress: 75 }];
    const buffer = await captureExportBuffer(tasks, [], "Test");
    const wb = await bufferToWorkbook(buffer);
    const progressCell = wb.getWorksheet("Partidas Gantt").getRow(2).getCell(12).value;
    expect(progressCell).toBeCloseTo(0.75, 2);
  });

  it("el campo costo se almacena como numero sin formato de texto", async () => {
    const tasks = [{ ...makeTasks(1)[0], cost: 1500000 }];
    const buffer = await captureExportBuffer(tasks, [], "Test");
    const wb = await bufferToWorkbook(buffer);
    const costCell = wb.getWorksheet("Partidas Gantt").getRow(2).getCell(13).value;
    expect(typeof costCell).toBe("number");
    expect(costCell).toBe(1500000);
  });

  it("la capacidad del recurso se almacena como fraccion decimal (0-1)", async () => {
    const buffer = await captureExportBuffer([], makeResources(), "Test");
    const wb = await bufferToWorkbook(buffer);
    const capCell = wb.getWorksheet("Pool de Recursos").getRow(2).getCell(7).value;
    expect(capCell).toBeCloseTo(1.0, 2);
  });
});

// BLOQUE 2: importTasksFromExcel — Funcionales
describe("importTasksFromExcel — Funcionales", () => {
  const roundTrip = async (tasks, resources, projectName = "Test") => {
    let capturedBuffer = null;
    vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(window.URL, "revokeObjectURL").mockReturnValue(undefined);
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts, opts) {
        super(parts, opts);
        capturedBuffer = parts[0];
      }
    };
    vi.spyOn(document, "createElement").mockReturnValue({ href: "", download: "", click: vi.fn() });
    await exportProjectToExcel({ projectName, tasks, resources });
    global.Blob = origBlob;
    if (!capturedBuffer) throw new Error("Buffer no capturado");
    const file = { arrayBuffer: async () => capturedBuffer, name: `${projectName}.xlsx` };
    return importTasksFromExcel(file, "2026-09-01");
  };

  it("importa el mismo numero de tareas que se exportaron", async () => {
    const tasks = makeTasks(5);
    const result = await roundTrip(tasks, makeResources());
    expect(result.tasks).toHaveLength(tasks.length);
  });

  it("preserva los nombres de las partidas correctamente", async () => {
    const tasks = makeTasks(3);
    const result = await roundTrip(tasks, makeResources());
    result.tasks.forEach((t, i) => {
      expect(t.name).toBe(tasks[i].name);
    });
  });

  it("preserva la duracion de cada partida", async () => {
    const tasks = makeTasks(4);
    const result = await roundTrip(tasks, makeResources());
    result.tasks.forEach((t, i) => {
      expect(t.duration).toBe(tasks[i].duration);
    });
  });

  it("preserva el costo de cada partida", async () => {
    const tasks = [{ ...makeTasks(1)[0], cost: 999999 }];
    const result = await roundTrip(tasks, makeResources());
    expect(result.tasks[0].cost).toBe(999999);
  });

  it("importa los recursos correctamente con nombre y tipo", async () => {
    const resources = makeResources();
    const result = await roundTrip(makeTasks(2), resources);
    expect(result.resources).toHaveLength(resources.length);
    expect(result.resources[0].name).toBe(resources[0].name);
    expect(result.resources[0].type).toBe("Trabajo");
    expect(result.resources[1].type).toBe("Material");
  });

  it("detecta correctamente la hoja Partidas Gantt por nombre", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Inicio (ES)", "Predecesoras"]);
    sheet.addRow([1, "Excavaciones", 5, "2026-09-01", ""]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe("Excavaciones");
  });

  it("detecta correctamente la hoja Pool de Recursos por nombre", async () => {
    const wb = new ExcelJS.Workbook();
    const taskSheet = wb.addWorksheet("Partidas Gantt");
    taskSheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    taskSheet.addRow([1, "Tarea A", 3]);
    const resSheet = wb.addWorksheet("Pool de Recursos");
    resSheet.addRow(["ID", "Descripci\u00f3n del Recurso", "Tipo", "U.M.", "Iniciales", "Grupo", "Capacidad Max (%)", "Tarifa Est. ($/UM)", "Costo x Uso ($)", "Acumulaci\u00f3n"]);
    resSheet.addRow([1, "Operador Grua", "Trabajo", "Hrs", "OPG", "Maq", 1.0, 25000, 0, "Prorrateo"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].name).toBe("Operador Grua");
  });

  it("usa la primera hoja disponible cuando no hay nombre estandar", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("MiPlanilla");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Fundaciones", 10]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe("Fundaciones");
  });

  it("parsea fechas en formato YYYY-MM-DD correctamente", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Inicio (ES)"]);
    sheet.addRow([1, "Obra X", 5, "2026-11-15"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].startDate).toBe("2026-11-15");
  });

  it("parsea fechas en formato DD-MM-YYYY correctamente", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Inicio (ES)"]);
    sheet.addRow(["Fundaciones", 5, "15-11-2026"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].startDate).toBe("2026-11-15");
  });

  it("usa la fecha por defecto cuando el campo de inicio esta vacio o es guion", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Inicio (ES)"]);
    sheet.addRow(["Sin Fecha", 5, "-"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-06-01");
    expect(result.tasks[0].startDate).toBe("2026-06-01");
  });

  it("detecta el nivel WBS por indentacion cuando no hay columna de nivel explícita", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Obra Gruesa", 0]);
    sheet.addRow(["  Excavaciones", 5]);
    sheet.addRow(["    Relleno", 3]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].level).toBe(1);
    expect(result.tasks[1].level).toBe(2);
    expect(result.tasks[2].level).toBe(3);
  });

  it("normaliza avance como porcentaje: valor <= 1 se multiplica por 100", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "% Avance"]);
    sheet.addRow(["Tarea A", 5, 0.75]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].progress).toBe(75);
  });

  it("normaliza avance como porcentaje: valor > 1 se usa directamente", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "% Avance"]);
    sheet.addRow(["Tarea B", 5, 60]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].progress).toBe(60);
  });

  it("asigna IDs secuenciales a las tareas importadas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Tarea 1", 3]);
    sheet.addRow(["Tarea 2", 5]);
    sheet.addRow(["Tarea 3", 2]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it("remapea predecesoras cuando los IDs del Excel difieren de los asignados", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Predecesoras"]);
    sheet.addRow([10, "Tarea A", 5, ""]);
    sheet.addRow([20, "Tarea B", 3, "10"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[1].predecessors).toBe("1");
  });

  it("vincula el recurso por iniciales desde la columna de recurso asignado", async () => {
    const wb = new ExcelJS.Workbook();
    const resSheet = wb.addWorksheet("Pool de Recursos");
    resSheet.addRow(["ID", "Descripci\u00f3n del Recurso", "Tipo", "U.M.", "Iniciales", "Grupo", "Capacidad Max (%)", "Tarifa Est. ($/UM)", "Costo x Uso ($)", "Acumulaci\u00f3n"]);
    resSheet.addRow([1, "Cuadrilla Fierreria", "Trabajo", "Hrs", "FIER", "Mano de Obra", 1, 15000, 0, "Prorrateo"]);
    const taskSheet = wb.addWorksheet("Partidas Gantt");
    taskSheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Recurso Asignado"]);
    taskSheet.addRow([1, "Enfierrado Losa", 5, "Cuadrilla Fierreria (FIER)"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].resourceId).toBe(1);
  });

  it("asigna status AUTO cuando el campo de estado no es un valor valido", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Estado"]);
    sheet.addRow(["Tarea X", 5, "Desconocido"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].manualStatus).toBe("AUTO");
  });

  it("preserva estados validos: Completada, Con Retraso, En Plazo, Pendiente", async () => {
    const statuses = ["Completada", "Con Retraso", "En Plazo", "Pendiente"];
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Estado"]);
    statuses.forEach((s, i) => sheet.addRow([`Tarea ${i + 1}`, 5, s]));
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    result.tasks.forEach((t, i) => {
      expect(t.manualStatus).toBe(statuses[i]);
    });
  });

  it("lanza error cuando el archivo Excel no contiene hojas", async () => {
    const wb = new ExcelJS.Workbook();
    const buffer = await wb.xlsx.writeBuffer();
    const file = { arrayBuffer: async () => buffer, name: "empty.xlsx" };
    await expect(importTasksFromExcel(file, "2026-01-01")).rejects.toThrow("El archivo Excel no contiene ninguna hoja de datos.");
  });

  it("lanza error cuando no hay filas con partidas validas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    const file = await workbookToFile(wb);
    await expect(importTasksFromExcel(file, "2026-01-01")).rejects.toThrow("No se encontraron filas con partidas v\u00e1lidas");
  });

  it("ignora filas con nombre vacio o solo espacios en blanco", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["  ", 5]);
    sheet.addRow(["", 3]);
    sheet.addRow(["Tarea valida", 7]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe("Tarea valida");
  });

  it("normaliza la capacidad del recurso de decimal a porcentaje entero", async () => {
    const wb = new ExcelJS.Workbook();
    const resSheet = wb.addWorksheet("Pool de Recursos");
    resSheet.addRow(["ID", "Descripci\u00f3n del Recurso", "Tipo", "U.M.", "Iniciales", "Grupo", "Capacidad Max (%)", "Tarifa Est. ($/UM)", "Costo x Uso ($)", "Acumulaci\u00f3n"]);
    resSheet.addRow([1, "Carpintero", "Trabajo", "Hrs", "CARP", "MO", 0.80, 10000, 0, "Prorrateo"]);
    const taskSheet = wb.addWorksheet("Gantt");
    taskSheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    taskSheet.addRow(["Tarea A", 3]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.resources[0].capacity).toBe(80);
  });

  it("devuelve resources=null cuando no hay hoja de recursos", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("MiPlanilla");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Tarea A", 3]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.resources).toBeNull();
  });

  it("acepta hoja con nombre Cronograma como hoja de tareas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Cronograma");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Actividad Principal", 8]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks).toHaveLength(1);
  });

  it("acepta hoja con nombre Itemizado como hoja de tareas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Itemizado");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Item A", 4]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks).toHaveLength(1);
  });

  it("clampea el nivel WBS entre 1 y 5", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Nivel WBS"]);
    sheet.addRow(["Nivel 0 invalido", 3, 0]);
    sheet.addRow(["Nivel 99 invalido", 3, 99]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].level).toBeGreaterThanOrEqual(1);
    expect(result.tasks[1].level).toBeLessThanOrEqual(5);
  });

  it("parsea acumulacion Inicio y Fin correctamente; cualquier otro valor resulta en Prorrateo", async () => {
    const wb = new ExcelJS.Workbook();
    const resSheet = wb.addWorksheet("Pool de Recursos");
    resSheet.addRow(["Descripci\u00f3n del Recurso", "Tipo", "Acumulaci\u00f3n"]);
    resSheet.addRow(["Recurso A", "Trabajo", "Inicio"]);
    resSheet.addRow(["Recurso B", "Material", "Fin"]);
    resSheet.addRow(["Recurso C", "Costo", "MalValor"]);
    const taskSheet = wb.addWorksheet("Gantt");
    taskSheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    taskSheet.addRow(["Tarea X", 3]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.resources[0].accrual).toBe("Inicio");
    expect(result.resources[1].accrual).toBe("Fin");
    expect(result.resources[2].accrual).toBe("Prorrateo");
  });
});

// BLOQUE 3: downloadExampleTemplate
describe("downloadExampleTemplate — Funcionales", () => {
  it("genera un xlsx valido con 5 tareas de ejemplo", async () => {
    setupDomMock();
    let capturedBuffer = null;
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts, opts) { super(parts, opts); capturedBuffer = parts[0]; }
    };
    await downloadExampleTemplate();
    global.Blob = origBlob;
    expect(capturedBuffer).not.toBeNull();
    const wb = await bufferToWorkbook(capturedBuffer);
    expect(wb.getWorksheet("Partidas Gantt").rowCount).toBe(6);
  });

  it("la plantilla incluye hoja de recursos con 2 recursos de ejemplo", async () => {
    setupDomMock();
    let capturedBuffer = null;
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts, opts) { super(parts, opts); capturedBuffer = parts[0]; }
    };
    await downloadExampleTemplate();
    global.Blob = origBlob;
    const wb = await bufferToWorkbook(capturedBuffer);
    expect(wb.getWorksheet("Pool de Recursos").rowCount).toBe(3);
  });

  it("el nombre del archivo descargado contiene plantilla_ejemplo_obra", async () => {
    const anchor = setupDomMock();
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(...args) { super(...args); }
    };
    await downloadExampleTemplate();
    global.Blob = origBlob;
    expect(anchor.download).toContain("plantilla_ejemplo_obra");
  });
});

// BLOQUE 4: Rendimiento No Funcional
describe("Rendimiento No Funcional — exportProjectToExcel", () => {
  it("exporta 500 tareas en menos de 5 segundos", async () => {
    setupDomMock();
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(...args) { super(...args); }
    };
    const start = performance.now();
    await exportProjectToExcel({ projectName: "PerfTest500", tasks: makeTasks(500), resources: makeResources() });
    const elapsed = performance.now() - start;
    global.Blob = origBlob;
    console.log(`[PERF] 500 tareas exportadas: ${elapsed.toFixed(0)}ms`);
    expect(elapsed).toBeLessThan(5000);
  });

  it("exporta 1000 tareas en menos de 10 segundos", async () => {
    setupDomMock();
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(...args) { super(...args); }
    };
    const start = performance.now();
    await exportProjectToExcel({ projectName: "PerfTest1000", tasks: makeTasks(1000), resources: makeResources() });
    const elapsed = performance.now() - start;
    global.Blob = origBlob;
    console.log(`[PERF] 1000 tareas exportadas: ${elapsed.toFixed(0)}ms`);
    expect(elapsed).toBeLessThan(10000);
  });
});

describe("Rendimiento No Funcional — importTasksFromExcel", () => {
  it("importa 300 filas en menos de 5 segundos", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Partidas Gantt");
    sheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Predecesoras", "Costo ($ CLP)", "% Avance"]);
    for (let i = 1; i <= 300; i++) {
      sheet.addRow([i, `Partida ${i}`, (i % 20) + 1, i > 1 ? String(i - 1) : "", i * 50000, (i % 100) / 100]);
    }
    const file = await workbookToFile(wb, "perf300.xlsx");
    const start = performance.now();
    const result = await importTasksFromExcel(file, "2026-09-01");
    const elapsed = performance.now() - start;
    console.log(`[PERF] 300 filas importadas: ${elapsed.toFixed(0)}ms`);
    expect(elapsed).toBeLessThan(5000);
    expect(result.tasks).toHaveLength(300);
  });
});

// BLOQUE 5: Robustez y Casos Borde
describe("Robustez — Casos borde en importacion", () => {
  it("tolera celdas con valores null o undefined sin lanzar excepcion", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Costo ($ CLP)"]);
    const row = sheet.addRow(["Tarea con nulos", null, null]);
    row.getCell(2).value = null;
    row.getCell(3).value = null;
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].duration).toBe(1);
    expect(result.tasks[0].cost).toBe(0);
  });

  it("tolera valores de texto donde se esperan numeros", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Costo ($ CLP)"]);
    sheet.addRow(["Tarea texto", "CINCO", "UN MILLON"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks).toHaveLength(1);
    expect(typeof result.tasks[0].duration).toBe("number");
    expect(typeof result.tasks[0].cost).toBe("number");
  });

  it("clampea el progreso al rango 0-100 cuando esta fuera de rango", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "% Avance"]);
    sheet.addRow(["Tarea A", 5, 200]);
    sheet.addRow(["Tarea B", 5, -10]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].progress).toBeLessThanOrEqual(100);
    expect(result.tasks[1].progress).toBeGreaterThanOrEqual(0);
  });

  it("maneja correctamente archivos con filas en blanco intercaladas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)"]);
    sheet.addRow(["Tarea 1", 3]);
    sheet.addRow(["", ""]);
    sheet.addRow(["Tarea 2", 5]);
    sheet.addRow([null, null]);
    sheet.addRow(["Tarea 3", 7]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks).toHaveLength(3);
  });

  it("no genera predecesoras invalidas cuando el campo esta vacio", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Gantt");
    sheet.addRow(["ID", "Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Predecesoras"]);
    sheet.addRow([1, "Tarea independiente", 5, ""]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].predecessors).toBe("");
  });

  it("acepta columna Responsable como sinonimo de Recurso Asignado", async () => {
    const wb = new ExcelJS.Workbook();
    const resSheet = wb.addWorksheet("Pool de Recursos");
    resSheet.addRow(["ID", "Descripci\u00f3n del Recurso", "Tipo", "U.M.", "Iniciales", "Grupo", "Capacidad Max (%)", "Tarifa Est. ($/UM)", "Costo x Uso ($)", "Acumulaci\u00f3n"]);
    resSheet.addRow([1, "Arquitecto", "Trabajo", "Hrs", "ARQ", "Profesional", 1.0, 30000, 0, "Prorrateo"]);
    const taskSheet = wb.addWorksheet("Partidas Gantt");
    taskSheet.addRow(["Descripci\u00f3n de la Partida", "Duraci\u00f3n \(d\u00edas\)", "Responsable"]);
    taskSheet.addRow(["Diseno Arquitectonico", 10, "Arquitecto (ARQ)"]);
    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-01-01");
    expect(result.tasks[0].resourceId).toBe(1);
  });
});
// BLOQUE 6: Regresion — Excel "en bruto" sin cabecera (caso del cliente real)
describe("Smart Fallback — Excel sin cabecera ni columnas estandar", () => {
  it("importa planilla sin fila de cabecera, datos en columna F fila 8 (caso cliente)", async () => {
    // Reproduce exactamente el archivo del cliente: Hoja1, datos en col F desde fila 8
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Hoja1");
    // Usar setCell para asegurar que ExcelJS persista las filas vacias
    sheet.getCell("F8").value = "Obras Provisionales";
    sheet.getCell("G8").value = 11350000;
    sheet.getCell("F9").value = "Instalaciones Provisorias";
    sheet.getCell("G9").value = 500000;
    sheet.getCell("F10").value = "Oficina tecnica";
    sheet.getCell("G10").value = 1200000;

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks.length).toBeGreaterThanOrEqual(2);
    expect(result.tasks.some(t => t.name === "Obras Provisionales")).toBe(true);
    expect(result.tasks.some(t => t.name === "Instalaciones Provisorias")).toBe(true);
  });

  it("importa planilla sin cabecera desde A1 (usuario corto y pego a A1)", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Hoja1");
    sheet.addRow(["Excavaciones y Movimientos de Tierra", 9000000]);
    sheet.addRow(["Escarpe", 1500000]);
    sheet.addRow(["Excavaciones para Cimientos", 3500000]);

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks[0].name).toBe("Excavaciones y Movimientos de Tierra");
    expect(result.tasks[2].cost).toBe(3500000);
  });

  it("detecta filas SUM como partidas padre (isP=true)", async () => {
    // Construir con getCell garantiza que ExcelJS persiste la formula SUM
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Cubicacion");
    sheet.getCell("A1").value = "Obras Preliminares";
    sheet.getCell("B1").value = { formula: "SUM(B2:B3)", result: 700000 };
    sheet.getCell("A2").value = "Instalacion Faenas";
    sheet.getCell("B2").value = 500000;
    sheet.getCell("A3").value = "Transporte";
    sheet.getCell("B3").value = 200000;

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    const parentRow = result.tasks.find(t => t.name === "Obras Preliminares");
    expect(parentRow).toBeDefined();
    expect(parentRow.isP).toBe(true);
    expect(parentRow.duration).toBe(0);
    const childRow = result.tasks.find(t => t.name === "Instalacion Faenas");
    expect(childRow).toBeDefined();
    expect(childRow.isP).toBeFalsy();
  });

  it("importa hoja con nombre Presupuesto como hoja de tareas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Presupuesto");
    sheet.addRow(["Descripcion", "Monto"]);
    sheet.addRow(["Obra Gruesa", 15000000]);
    sheet.addRow(["Estructura", 8000000]);

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks).toHaveLength(2);
  });

  it("importa hoja con nombre Programa como hoja de tareas", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Programa de Obras");
    sheet.addRow(["Actividad", "Plazo (dias)"]);
    sheet.addRow(["Hito de Inicio", 0]);
    sheet.addRow(["Excavaciones", 10]);

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks).toHaveLength(2);
  });

  it("detecta cabecera Glosa como columna de nombre (planillas chilenas)", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Cubicacion");
    sheet.addRow(["Item", "Glosa", "Monto"]);
    sheet.addRow([1, "Fundaciones", 5000000]);
    sheet.addRow([2, "Sobrecimientos", 2000000]);

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].name).toBe("Fundaciones");
    expect(result.tasks[1].cost).toBe(2000000);
  });

  it("detecta hoja mas grande cuando hay multiples hojas sin nombre estandar", async () => {
    const wb = new ExcelJS.Workbook();
    // Hoja pequena
    const sh1 = wb.addWorksheet("Resumen");
    sh1.addRow(["Total Proyecto", 50000000]);

    // Hoja grande con los datos reales
    const sh2 = wb.addWorksheet("Detalle");
    sh2.addRow(["Descripcion de la Partida", "Costo"]);
    for (let i = 1; i <= 20; i++) sh2.addRow([`Partida ${i}`, i * 100000]);

    const file = await workbookToFile(wb);
    const result = await importTasksFromExcel(file, "2026-09-01");
    // Debe haber tomado la hoja con mas filas (Detalle con 21 filas)
    expect(result.tasks).toHaveLength(20);
    expect(result.tasks[0].name).toBe("Partida 1");
  });

  it("lanza error descriptivo cuando no puede detectar ninguna columna de texto", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Solo Numeros");
    sheet.addRow([1, 2, 3]);
    sheet.addRow([4, 5, 6]);

    const file = await workbookToFile(wb);
    await expect(importTasksFromExcel(file, "2026-09-01")).rejects.toThrow(
      "No se pudo detectar"
    );
  });
});
