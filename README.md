# 📊 Project Master Enterprise — Suite Integral de Gestión de Proyectos

> **Plataforma Enterprise de Planificación, Carta Gantt, CPM & EVM a 60 FPS**  
> Desarrollada con React 19, Vite, Tailwind CSS, Zustand y motor CPM de alto rendimiento.

---

## 🌟 Descripción General

**Project Master Enterprise** es una solución web de grado empresarial diseñada para la dirección, planificación y control financiero de proyectos complejos en industrias como **Construcción, Minería, Ingeniería, Telecomunicaciones y Desarrollo de Software**.

Combina la potencia analítica de herramientas tradicionales de escritorio (como MS Project y Primavera P6) con la velocidad, diseño y fluidez de una aplicación web moderna.

---

## 🎯 Filosofía de Ingeniería y Rendimiento (Ponytail Mode)

- **Anti-Overengineering & YAGNI:** Código directo, sin capas de abstracción innecesarias, sin dependencias pesadas y aprovechando las capacidades nativas de la plataforma.
- **Rendimiento a 60 FPS:** 
  - **Sincronización de Scroll pasiva por Refs:** Sincronización vertical entre la tabla de partidas y el lienzo gráfico sin disparar re-renderizados de React ni eventos sintéticos pesados.
  - **Cálculo O(1) de flechas de precedencia SVG:** Mapeo indexado de predecesoras que reduce la complejidad de enlace de $O(N^2)$ a $O(N)$.
  - **Conjunto de feriados O(1) y fechas timezone-safe:** Búsqueda instantánea de días hábiles y fechas sin desfases horarios UTC.
  - **Offloading Asíncrono CPM:** Preparado para cómputo de grafos masivos (>500 tareas) vía Web Worker (`src/workers/cpmWorker.js`).
- **Diseño Dark Enterprise:**
  - Paleta de alto contraste profesional (`#0f172a`, `#1e293b`, `#3b82f6`).
  - Barras 3D con degradados semánticos (`.bar-3d-blue` para tareas en plazo y `.bar-3d-red` para ruta crítica).
  - Tabla de Carta Gantt con 13 columnas completas e indentación visual jerárquica por nivel WBS/EDT.

---

## 🧮 Motor Matemático CPM & EVM

El motor central (`src/lib/cpmEngine.js`) realiza los siguientes cálculos de forma instantánea:

### 1. Método de la Ruta Crítica (CPM - Critical Path Method)
- **Forward Pass (Paso Adelante):** Determina el *Early Start* (ES) y *Early Finish* (EF) considerando la jornada laboral (Lunes a Viernes o Lunes a Sábado), feriados registrados, demoras de inicio (`startDelay`) y de fin (`finishDelay`).
- **Backward Pass (Paso Atrás):** Calcula el *Late Start* (LS) y *Late Finish* (LF) partiendo de la fecha fin del proyecto (EAC). Optimizado mediante mapas de adyacencia de sucesores.
- **Holgura Total (Total Float - TF):** $TF = LS - ES$.
- **Ruta Crítica:** Todas aquellas partidas con holgura $TF \le 0$, destacadas automáticamente en color carmesí/rojo y vinculadas con flechas de precedencia críticas.
- **Detección de Ciclos:** Algoritmo DFS que previene bucles infinitos en dependencias circulares.

### 2. Gestión del Valor Ganado (EVM - Earned Value Management)
- **BAC (Budget at Completion):** Presupuesto total acumulado del proyecto.
- **PV (Planned Value - Valor Planeado):** Costo presupuestado del trabajo programado a la fecha de estado.
- **EV (Earned Value - Valor Ganado):** Costo presupuestado del trabajo realizado según avance real.
- **SPI (Schedule Performance Index):** $SPI = \frac{EV}{PV}$ (Índice de desempeño del cronograma).
- **SV (Schedule Variance):** $SV = EV - PV$ (Varianza de cronograma en valor monetario).

---

## 🖥️ Módulos y Vistas del Sistema

1. **📊 Carta Gantt Interactiva:**
   - Tabla WBS de 13 columnas: Edición, Descripción, Duración, Holgura, ES, EF, Predecesoras, Demora Inicio/Fin, Recurso, Estado, % Avance y Costo.
   - Separador arrastrable (Splitter) en tiempo real para ajustar el ancho entre tabla y gráfico.
   - Controles de zoom dinámico, ajuste automático al ancho de pantalla (*Fit Zoom*) e *Ir a Hoy*.
   - Inserción rápida de partidas hermanas o subpartidas hijas con identación WBS y auto-enlace secuencial.
2. **📈 Dashboard Ejecutivo Multi-Industria:**
   - Tarjetas de KPIs en tiempo real: Duración EAC, Presupuesto BAC, Avance Físico %, SPI y SV.
   - Gráfico circular Donut interactivo con estados de partidas (Completadas, En Plazo, Con Retraso).
   - Barras de distribución presupuestaria por tipo de recurso (Mano de Obra, Materiales, Equipos).
3. **🕸️ Diagrama de Red Lógica (PERT):**
   - Visualización de grafos de precedencias con nodos estándar de 6 cuadrantes (ES, Dur, EF, ID/Nombre, LS, Holgura, LF) y flechas de Bézier curvas con ruta crítica iluminada.
4. **📉 Curva S Acumulada Interactiva:**
   - Gráfico vectorial SVG de curvas acumuladas PV vs EV con tooltips flotantes en tiempo real e indicador SPI en cada punto de corte temporal.
5. **👥 Pool de Recursos:**
   - Catálogo de recursos clasificados en *Trabajo*, *Material* y *Costo*.
   - Configuración de unidades de medida (Hrs, m3, Mes), tarifas estándares ($/UM), costo por uso y métodos de acumulación (*Prorrateo, Inicio, Fin*).
   - Filtros de búsqueda instantánea por nombre, tipo, grupo y tipo de acumulación.
6. **📅 Calendario y Excepciones Laborales:**
   - Selector de presets: Jornada Lunes a Viernes vs Jornada Lunes a Sábado (Construcción).
   - Registro de días no laborables y feriados con impacto directo y dinámico en el cálculo de holguras y fechas del proyecto.

---

## 📁 Integración, Importación y Exportación

- **Microsoft Excel (.xlsx):** Exporta e importa libros de trabajo completos con fórmulas, formateo condicional de partidas padre y pool de recursos usando `exceljs`.
- **Informes Ejecutivos en PDF:** Generación en el cliente de informes landscape de alta resolución de la Carta Gantt y Dashboard con cabecera institucional corporativa (`jspdf` + `html2canvas`).
- **Persistencia Local y Archivos .json:** Guardado automático local en `localStorage` y soporte para guardar/abrir archivos `.json` mediante la *File System Access API* nativa del navegador.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Framework UI** | React 19 + Vite |
| **Estilos** | Tailwind CSS + CSS Gradients 3D |
| **Estado Global** | Zustand (`projectStore.js`, `uiStore.js`) |
| **Motor de Cálculo** | `src/lib/cpmEngine.js` + Web Worker (`cpmWorker.js`) |
| **Planillas Excel** | `exceljs` |
| **Generación PDF** | `jspdf` + `html2canvas` |
| **Iconografía** | Font Awesome 6 |
| **Linter Ultrarrápido** | `oxlint` |

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js:** v18.0.0 o superior
- **npm:** v9.0.0 o superior

### Instalación y Ejecución

```bash
# 1. Clonar o ingresar al directorio del proyecto
cd project-master-enterprise

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
npm run dev

# 4. Compilar para producción
npm run build

# 5. Ejecutar linter rápido
npm run lint
```

---

## 📄 Licencia
Privada / Enterprise — Diseñado para gestión y control de proyectos de alto impacto.

