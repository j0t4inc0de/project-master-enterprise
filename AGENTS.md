# Project Master Enterprise — Guía de Desarrollo para Agentes

## 🎯 Filosofía del Proyecto
- **Ponytail Mode (Anti-Overengineering & YAGNI):** Código limpio, directo y pragmático. Sin abstracciones innecesarias, sin dependencias pesadas y usando funciones nativas siempre que sea posible.
- **Rendimiento a 60 FPS:** El cálculo de CPM y grafos debe ser instantáneo y no bloquear el hilo de renderizado de la UI.
- **Preservación del Diseño de Ignacio:**
  - Tema: Dark Enterprise (`#0f172a`, `#1e293b`, `#3b82f6`).
  - Barras 3D de Gantt: `.bar-3d-blue` para tareas normales y `.bar-3d-red` para ruta crítica.
  - Tabla de Gantt: 13 columnas completas e indentación jerárquica por nivel WBS.
  - Colores semánticos: Verde (`#10b981`) completado, Ámbar (`#f59e0b`) fase padre, Rojo (`#ef4444`) crítico/retraso, Cian (`#06b6d4`) en plazo.

## 🛠️ Stack Tecnológico
- **UI:** React 19 + Vite + Tailwind CSS
- **Estado Global:** Zustand (`projectStore.js`, `uiStore.js`)
- **Motor CPM:** `cpmEngine.js` + Web Worker (`cpmWorker.js`)
- **Excel:** `exceljs` (0 vulnerabilidades)
- **PDF:** `jspdf` + `html2canvas`
- **Iconos:** Font Awesome 6

## 📚 Skills Disponibles en el Proyecto
- `ponytail`: Enfoque senior minimalista y anti-sobreingeniería.
- `ponytail-audit`: Auditoría de código muerto y dependencias prescindibles.
- `gantt-performance`: Optimización de renderizado SVG masivo y sincronización de scroll.
- `ms-project-sync`: Interoperabilidad y mapeo de planillas de construcción con MS Project.
