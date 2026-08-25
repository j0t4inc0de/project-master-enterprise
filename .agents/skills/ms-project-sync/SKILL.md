---
name: ms-project-sync
description: Expert in Microsoft Project and construction Excel spreadsheet interoperability (WBS, predecessors, resources, and cost rates).
---
# MS Project & Construction Excel Interoperability Expert

Use this skill when developing or debugging spreadsheet import/export, WBS hierarchy detection, and MS Project schema mappings:

## Key Guidelines
1. **Intelligent Column Mapping:** Civil construction spreadsheets use diverse naming conventions. Always map flexibly across Spanish and English terms:
   - Name/Task: `Descripción`, `Nombre`, `Partida`, `Tarea`, `Item`, `Activity`
   - Duration: `Duración`, `Dias`, `Plazo`, `Duration`, `Days`
   - Start Date: `Inicio`, `Comienzo`, `Start`, `Fecha Inicio`
   - Predecessors: `Predecesoras`, `Dependencias`, `Vínculos`, `Pred`
   - Level/WBS: `Nivel`, `WBS`, `EDT`, `Jerarquía` (or leading space indentation)
   - Costs/Budget: `Costo`, `Presupuesto`, `Monto`, `Total`, `Rate`
2. **Multi-Sheet Workbook Structure:** Export clean, multi-sheet `.xlsx` files with `Partidas Gantt` and `Pool de Recursos`. Apply standard currency formats (`$#,##0`) and percentage formats (`0%`).
3. **Hierarchy Integrity:** When importing, compute parent WBS levels and ensure subtasks correctly roll up duration, costs, and progress to parent summary phases.
