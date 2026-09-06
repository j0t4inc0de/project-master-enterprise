# 🎨 Diseño y Stack — Project Master Enterprise

**Propósito de este documento:** Guía de referencia para mantener la identidad visual de Ignacio durante la migración, y análisis crítico del stack propuesto.

---

## 1. 🎨 Identidad Visual Original (Preservar Exacto)

Ignacio construyó la app con un estilo Dark Enterprise muy definido. **No cambiar nada de esto sin consultar.**

### Paleta de Colores

| Rol | Color | Hex | Clase Tailwind |
|-----|-------|-----|----------------|
| **Fondo principal** | Azul noche muy oscuro | `#0f172a` | `bg-slate-900` |
| **Fondo paneles/tabla** | Gris azulado oscuro | `#1e293b` | `bg-slate-800` |
| **Fondo header / menú activo** | Degradado indigo → negro | `from-indigo-950 to-[#09090b]` | gradient custom |
| **Acento principal / botones** | Azul eléctrico | `#3b82f6` | `bg-blue-600` |
| **Acento resumen proyecto** | Ámbar / naranja | `#f59e0b` | `bg-amber-500` |
| **Tareas críticas / alertas** | Rojo | `#ef4444` | `bg-rose-500` |
| **Tareas completadas** | Verde esmeralda | `#10b981` | `text-emerald-400` |
| **Texto secundario** | Gris azulado | `#94a3b8` | `text-slate-400` |
| **Texto principal** | Blanco grisáceo | `#e2e8f0` | `text-slate-200` |
| **Bordes** | Gris oscuro | `#334155` | `border-slate-700` |
| **Scrollbar track** | `#1e293b` | — | Custom CSS |
| **Scrollbar thumb** | `#475569` | — | Custom CSS |

### Tipografía
- **Familia:** `Inter` (Google Fonts, carga por CDN)
- **Tamaño base:** `text-sm` (14px)
- **Tamaños especiales:** `text-[9px]`, `text-[10px]`, `text-xs` — muy compacto, densidad de información alta
- **Font weight headers:** `font-black` (900) para títulos principales

### Barras de Gantt (Preservar el efecto 3D)
```css
/* Barra normal (azul 3D) */
.bar-3d-blue {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 40%, #2563eb 100%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3);
  border-radius: 3px;
}

/* Barra crítica (roja 3D) */
.bar-3d-red {
  background: linear-gradient(180deg, #f87171 0%, #ef4444 40%, #dc2626 100%);
  box-shadow: 0 2px 4px rgba(220,38,38,0.3), inset 0 1px 1px rgba(255,255,255,0.3);
  border-radius: 3px;
}
```

> ⚠️ **Crítico:** Este gradiente 3D es la "firma visual" que Ignacio más valora. Si se pierde, se pierde la identidad de la app. Replicarlo exactamente en el componente `GanttCanvas.tsx`.

### Elementos Especiales
- **Días no laborales en Gantt:** Fondo con rayas diagonales rojas sutiles (`repeating-linear-gradient` a 45°)
- **Tareas padres/fases:** Barra ámbar delgada (1.5px) con triángulos en los extremos (efecto MS Project)
- **Hitos (duración 0):** Rombo gris rotado 45°, con borde blanco
- **Línea de estado (hoy):** Línea vertical verde esmeralda discontinua con badge "Estado" encima
- **Flechas de precedencia:** SVG gris para tareas normales, rojo para ruta crítica, con marcador de flecha
- **Inputs inline:** Fondo transparente que se activa con borde azul al hacer focus (no son celdas rígidas)

### Iconografía
- **Librería:** Font Awesome 6.4.0 (solid) — `fa-solid fa-*`
- Uso extensivo: cada botón tiene ícono. No mezclar con otra librería.

### Header
```
[Ícono]  Project Master [Enterprise badge]         [Inicio] [Estado] [Fin EAC]    [Tabs]
         Auto-Guardado ●
```
- Degradado oscuro de izquierda a derecha
- Badge "Enterprise" en azul pequeño con texto uppercase tracking-widest
- Badge "Auto-Guardado" con pulso animado (`.animate-pulse`)

### Tabs de Navegación
6 tabs: Dashboard | Red | Gantt | Curva S | Recursos | Calendario
- Tab activo: `bg-blue-600 text-white`
- Tab inactivo: `text-slate-400 hover:bg-slate-800`

---

## 2. 🗂️ Estructura de Componentes para la Migración

Mantener la misma jerarquía visual que ya conoce Ignacio:

```
App
├── Header (fechas + tabs)
├── GanttView
│   ├── Toolbar (botones: añadir, excel, zoom, links)
│   ├── FilterBar (búsqueda + filtros)
│   └── SplitPanel (divisor arrastrable)
│       ├── GanttTable (13 columnas editables)
│       └── GanttCanvas (SVG + barras + flechas)
├── DashboardView (KPIs EVM + donuts)
├── NetworkView (PERT interactivo)
├── ScurveView (Curva S)
├── ResourcesView (tabla con filtros)
└── CalendarView (feriados + días hábiles)
```

---

## 3. ⚠️ Análisis Crítico Profundo — ¿Puede Competir con MS Project?

> Objetivo declarado: ser una alternativa moderna y ligera a Microsoft Project.
> Análisis realizado leyendo el código completo del HTML original (850 líneas).

---

### 🟢 Lo que ya es genuinamente bueno (ventajas reales sobre MS Project)

| Feature | Estado en el original | Ventaja vs MS Project |
|---------|----------------------|-----------------------|
| **CPM con ES/EF/LS/LF y holgura real** | ✅ Implementado | MS Project lo tiene pero es opaco. Aquí es visual y transparente. |
| **EVM completo (SPI, SV, PV, EV, BAC, EAC)** | ✅ Implementado | MS Project requiere configuración compleja. Aquí es automático. |
| **Curva S interactiva con tooltips** | ✅ Implementado | En MS Project es estático y requiere exportar a Excel. |
| **Diagrama PERT con nodos ES/EF/LS/LF** | ✅ Implementado | Mismo concepto. |
| **Pool de recursos con tarifa + costo por uso** | ✅ Implementado | Equivalente a MS Project Resource Sheet. |
| **Barras 3D con ruta crítica en rojo** | ✅ Implementado | MS Project lo tiene. Aquí se ve igual de bien. |
| **Jornada configurable + feriados** | ✅ Implementado | Equivalente al Calendar de MS Project. |
| **Funciona en el navegador sin instalación** | ✅ Por diseño | MS Project requiere instalación + licencia $1.000+ USD/año. |
| **Dark mode nativo** | ✅ Por diseño | MS Project no tiene modo oscuro. |
| **Gratis** | ✅ Por diseño | MS Project ~$10 USD/mes. |

**Conclusión parcial: el motor ya está.** El problema no es funcionalidad, sino arquitectura y rendimiento.

---

### 🔴 Problemas Críticos de Arquitectura (lo que impide escalar)

#### Problema #1 — El CPM bloquea el hilo principal (CRÍTICO)

```javascript
// Línea 140 del original:
while(chg && iter<50) {
  chg = false; iter++;
  for(let i=0; i<cmp.length; i++) { ... }
}
```

**El problema:** Este doble bucle corre en el hilo de UI de JavaScript. Con proyectos de 20-30 tareas es imperceptible. Con proyectos de **200-500 tareas** (escala real de construcción), congelará la pantalla por segundos cada vez que el usuario edite cualquier campo.

**Solución para competir:** Mover el CPM a un **Web Worker**. El Worker corre en un hilo separado, nunca congela la UI, y el resultado llega como mensaje asíncrono.

```
Usuario edita duración → App envía datos al Worker → UI sigue respondiendo → Worker calcula CPM → Devuelve resultado → UI actualiza Gantt
```

---

#### Problema #2 — `useMemo` recalcula todo en cada keystroke

```javascript
// El CPM entero está en un useMemo que depende de:
[tasks, startDate, workingDays, holidays, autoProgress, statusDate, resources]
```

Cada vez que el usuario escribe **una letra** en el nombre de una tarea, React recalcula el CPM completo, los 10 puntos de la Curva S, el diagrama PERT y todos los KPIs. Eso es **5 recálculos pesados por letra escrita**.

**Solución:** Separar lo que es "render data" (nombre de tarea) de lo que es "compute data" (CPM). Solo recalcular el CPM cuando cambia duración, fecha, predecesor o recurso — no cuando cambia el nombre.

---

#### Problema #3 — El Diagrama PERT no es arrastrable

```javascript
// Línea 348: posiciones calculadas algorítmicamente, estáticas
let nds=[]; const W=220, H=90, XS=300, YS=130;
```

Los nodos del PERT se posicionan automáticamente pero el usuario no puede moverlos. En MS Project puedes reorganizar el diagrama. Para un proyecto con 50+ tareas, la disposición automática crea cruces de flechas ilegibles.

**Solución:** Agregar drag-and-drop a los nodos del PERT (guardar posiciones `x,y` en el estado del proyecto).

---

#### Problema #4 — Sin multi-proyecto

El original solo puede tener **un proyecto a la vez** en localStorage. MS Project tiene gestión de múltiples proyectos.

**Solución (ya comprometida en el contrato):** El guardado en `.json` individual resuelve esto — cada archivo `.json` es un proyecto independiente.

---

#### Problema #5 — Sin "Deshacer" (Ctrl+Z)

Cualquier acción destructiva (eliminar tarea, cambiar duración) es irreversible. MS Project tiene historial de deshacer de 99 pasos.

**No está en el contrato, pero es un riesgo:** Si Ignacio elimina una tarea por error, pierde el trabajo.

**Solución mínima (rápida):** Mantener un array de snapshots del estado (últimas 10 versiones) y un botón "Deshacer último cambio".

---

### 🛠️ Stack Definitivo para Competir con MS Project

Considerando rendimiento, limpieza, escalabilidad Y el plazo de 4-5 días:

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Framework** | React 18 | Mismo que el original. Cero reescritura de JSX. |
| **Bundler** | Vite | Elimina Babel en navegador = carga 10x más rápida. |
| **Lenguaje** | JavaScript (ES2022) | Sin overhead de TypeScript para el plazo dado. |
| **Estilos** | Tailwind CSS | Migración 1:1 de clases existentes. |
| **Estado** | **Zustand** | Más simple que Redux, más potente que useState puro para un estado complejo como este. Permite slices separados por feature. |
| **CPM Engine** | **Web Worker** | El cálculo CPM/EVM/Curva S corre fuera del hilo UI. |
| **Iconos** | **Font Awesome 6 (npm)** | Mismo que el original, sin CDN externo. |
| **Excel** | **xlsx (SheetJS)** | Parser e importador. Agregar headers MS Project-compatibles. |
| **PDF** | **html2canvas + jspdf** | Captura la Gantt exactamente como se ve. |
| **Guardado** | **JSON files** (File System Access API) | `showSaveFilePicker()` / `showOpenFilePicker()` — guardado nativo de archivos sin instalación, funciona en Chrome/Edge. |
| **Drag PERT** | **@dnd-kit/core** | Ligero, accesible, sin dependencias extra. |

**Costo en librerías nuevas:** Zustand (1.1KB), @dnd-kit (13KB), xlsx (ya estaba), html2canvas + jspdf (~140KB). Todo pequeño.

---

### 📐 Arquitectura de Estado con Zustand

En lugar de un App.jsx monolítico, el estado se organiza en stores independientes pero conectados:

```
stores/
├── projectStore.js    → tasks, resources, holidays, startDate, statusDate
├── uiStore.js         → activeTab, zoom, leftWidth, collapsed, filters
├── cpmStore.js        → resultado del CPM (solo lectura, actualizado por Web Worker)
└── historyStore.js    → snapshots para Ctrl+Z (opcional pero recomendado)
```

**Ventaja:** La Gantt puede subscribirse solo a `cpmStore` y `uiStore`. No re-renderiza cuando cambia el nombre de una tarea en `projectStore`.

---

### 🗂️ Estructura de Archivos Final (Pragmática)

```
project-master-enterprise/
├── public/
│   └── plantilla_importacion.xlsx
├── src/
│   ├── workers/
│   │   └── cpmWorker.js          ← CPM + EVM + Curva S (hilo separado)
│   ├── stores/
│   │   ├── projectStore.js
│   │   └── uiStore.js
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── GanttView.jsx         ← Tabla + Canvas (scroll sync intacto)
│   │   ├── DashboardView.jsx
│   │   ├── NetworkView.jsx       ← PERT con drag
│   │   ├── ScurveView.jsx
│   │   ├── ResourcesView.jsx
│   │   └── CalendarView.jsx
│   ├── lib/
│   │   ├── excel.js              ← importar/exportar xlsx
│   │   ├── pdf.js                ← html2canvas + jspdf
│   │   └── storage.js            ← File System Access API
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

**Total: ~15 archivos vs el monolito de 850 líneas.** Mantenible, escalable, cada feature en su lugar.

---

### 🚀 Hoja de Ruta para Convertirlo en Producto Real

Si Ignacio quiere llevarlo más lejos después de la entrega:

| Fase | Feature | Impacto |
|------|---------|---------|
| **Post-entrega** | Alojarlo en `projectmaster.wearesamod.com` | Acceso desde cualquier lugar, upsell recurrente |
| **v1.1** | Multi-usuario con cuentas (Supabase Auth) | Equipos de obra pueden ver el mismo proyecto |
| **v1.2** | Historial de cambios (log de quién editó qué) | Feature enterprise real |
| **v1.3** | Importar `.mpp` de MS Project | El mayor diferenciador posible |
| **v2.0** | App de escritorio con Tauri (Rust) | Sin browser, sin internet, más rápido |


---

## 4. 📌 Notas de Implementación Críticas

1. **Preservar el scroll sync:** La sincronización entre tabla y canvas usa `useRef` con flags `syncL` / `syncR`. No fragmentar `GanttView.jsx` en sub-componentes sin probar esto exhaustivamente.

2. **CPM al Web Worker primero:** Antes de migrar cualquier otra cosa, mover el algoritmo CPM al Worker. Es el cambio de mayor impacto en rendimiento.

3. **Los colores de estado son semánticos y Ignacio los conoce:** `emerald` = completado, `rose` = retrasado/crítico, `cyan` = en plazo, `amber` = partida/fase. No cambiarlos.

4. **La Gantt tiene 13 columnas con anchos exactos definidos en `<colgroup>`:** Respetarlos al píxel. Cambiar proporciones rompe la experiencia visual ya conocida por Ignacio.

5. **Font Awesome via npm (no CDN):** `@fortawesome/fontawesome-svg-core` + `@fortawesome/free-solid-svg-icons` + `@fortawesome/react-fontawesome`.

6. **File System Access API:** `showSaveFilePicker()` funciona en Chrome y Edge pero **no en Firefox**. Documentar esto al entregar. Fallback: descarga normal con `<a download>`.

7. **El Excel de importación debe detectar columnas automáticamente:** Buscar headers como `Descripción`, `Duración`, `Inicio`, `Fin`, `Predecesoras` (y variantes en español). Hacerlo case-insensitive.



