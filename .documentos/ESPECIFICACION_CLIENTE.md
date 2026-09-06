# 🏗️ Project Master Enterprise — Especificación y Control de Proyecto

**Cliente:** Ignacio Manríquez (Pañolero de Construcción — INACAP Sede Los Ángeles)  
**Desarrollador:** Juan Erices (We Are Samod)  
**Fecha de Inicio:** 24 de Agosto de 2026  
**Estado Financiero:** 🟢 **Primera Cuota Pagada ($35.000 CLP)** | Saldo pendiente contra entrega: $30.000 CLP (Total: $65.000 CLP)  
**Archivo Base Adjunto:** [`project_master_enterprise_original.html`](./project_master_enterprise_original.html)

---

## 1. 📋 Resumen Ejecutivo del Proyecto

**Project Master Enterprise** es una aplicación web de planificación, programación y control de proyectos orientada al sector de la construcción e ingeniería, concebida como una alternativa ligera, moderna e interactiva a herramientas tradicionales como *Microsoft Project*.

El proyecto fue prototipado inicialmente por **Ignacio Manríquez** utilizando inteligencia artificial durante 2 meses en un archivo HTML monolítico. Al alcanzar el límite técnico de lo que la IA puede gestionar en un archivo único sin conocimientos de programación, Ignacio contactó a Juan Erices tras conocer su trabajo en el tótem institucional *Smartlend* de INACAP.

El encargo consiste en estabilizar, profesionalizar y dotar de capacidades reales de exportación, importación y guardado al sistema para que Ignacio pueda presentarlo formalmente ante directivos de INACAP y profesionales del área de la construcción.

---

## 2. 💬 Registro Histórico de la Conversación (WhatsApp)

A continuación se transcribe la conversación íntegra donde se levantaron los requerimientos y se formalizó el acuerdo de desarrollo:

```text
[19/8, 2:11 p.m.] Ignacio Manriquez 🏗️: Lo que pasa es que tengo una propuesta, de una creación de una aplicación de programación y planificación de proyectos, estuve trabajando en ella ya más de 2 meses , y lo que pasa que ahora ya no sé dónde más avanzar , ya que yo no soy informático , la estuve haciendo con la IA, y necesito ver si le puedo agregar más cosas y ver si está bien
[19/8, 2:23 p.m.] Ignacio Manriquez 🏗️: A ok , pero trabajo acá en Inacap los angeles, soy el pañolero de construcción
[19/8, 2:23 p.m.] Ignacio Manriquez 🏗️: Tu número lo saqué de un folleto que tienes en la sede
[19/8, 2:24 p.m.] Jota: ah entiendo perfecto
Debido a que no nos tenemos agregado WhatsApp bloqueó tus audios
[19/8, 2:24 p.m.] Jota: ahora los escucho
[19/8, 2:25 p.m.] Jota: sii soy yo
[19/8, 2:25 p.m.] Jota: el totem llamado smartlend
[19/8, 2:26 p.m.] Ignacio Manriquez 🏗️: Ese mismo 😅
[19/8, 2:26 p.m.] Jota: trabajo de manera independiente ahora, aunque aun atento al totem de inacap
Que creo que no esta operando lamentablemente
[19/8, 2:26 p.m.] Jota: tienen la media joyita ahi juntando polvo
[19/8, 2:28 p.m.] Ignacio Manriquez 🏗️: Si es verdad eso jaja , amigo pero te comentaba , yo estoy creando un proyecto de planificación y programación de proyectos, similar a Microsoft project, lo presente acá pero no me han agarrado mucho , están copados en pega parece jajaja
[19/8, 2:28 p.m.] Ignacio Manriquez 🏗️: Y necesito ver si lo puedo mejorar
[19/8, 2:28 p.m.] Jota: bacan!
[19/8, 2:28 p.m.] Ignacio Manriquez 🏗️: Y ir viendo que más se le podría agregar
[19/8, 2:28 p.m.] Jota: ah entiendo
[19/8, 2:30 p.m.] Jota: lo ideal sería hacer un levantamiento y auditoría funcional de la herramienta
Así documentamos el estado actual (as-is), mapeamos puntos débiles frente a alternativas como MS Project y armamos un backlog priorizado con mejoras de arquitectura, UX y nuevas funcionalidades clave
[19/8, 2:30 p.m.] Ignacio Manriquez 🏗️: Yo no soy programador, ni informático, y me gustaría verlo con alguien que sepa más del tema , por último presentarlo como proyecto junto , obviamente habría que ver bien este proyecto
[19/8, 2:31 p.m.] Ignacio Manriquez 🏗️: Tu no vienes a la sede ya ?
[19/8, 2:31 p.m.] Jota: te puedo ayudar de manera independiente para esto Ignacio
[19/8, 2:31 p.m.] Jota: no puedo presentarlo junto contigo
[19/8, 2:31 p.m.] Jota: ya que no estoy en sede
[19/8, 2:32 p.m.] Jota: desde que me titule solo he ido por el totem, y aun puedo con el debido a que fue mi tesis
[19/8, 2:34 p.m.] Ignacio Manriquez 🏗️: Lo entiendo, pero igual me interesa eso , de hacerlo independiente, por último lo puedo presentar más completo, ya que ahora solo es un HTML
[19/8, 2:37 p.m.] Jota: Si quieres definimos bien el alcance de lo que necesitas y te paso un presupuesto piola para meterme a trabajar en eso
[19/8, 2:42 p.m.] Ignacio Manriquez 🏗️: Sería genial,
[19/8, 2:43 p.m.] Jota: Bacan, mándame lo que tengas (el archivo HTML y cualquier apunte o idea que hayas anotado) para pegarle una mirada. Con eso veo el estado real, calculo el tiempo que me tomaría y te armo una propuesta con los entregables y el presupuesto
[19/8, 2:48 p.m.] Ignacio Manriquez 🏗️: habría que ver si esta todo bien , y que este sincronizado con todo lo otro , cuando uno va agregando tareas a la carta gantt, lo ideal que sea mejor que el project , se supone que deveria ser como la competencia de esto, lo bueno que tiene artas cosas buenas a mi parecer

--- PROPUESTA ENVIADA POR JOTA ---
"Puntos considerados:
1. Estructuración profesional: Pasar el código de un archivo suelto a una arquitectura limpia y rápida (para que no se pegue ni falle al agregar datos).
2. Importación/Exportación real de Excel: Dejar 100% operativo el botón para cargar y descargar partidas en excel de verdad.
3. Corrección de sincronización de la Gantt: Corregir los desfases que ocurren al vincular tareas o mover fechas manuales.
4. Exportación a PDF/Reporte: Generar un botón para descargar la carta Gantt y el resumen del proyecto en PDF listo para imprimir o presentar.
5. Guardado seguro: Que no dependa de la memoria temporal del navegador y puedas guardar tus proyectos en archivos independientes.

Propuesta y Entregables:
* Valor del desarrollo y corrección: 65.000 CLP en dos Cuotas (50% para iniciar el proyecto, y el resto al entregar los 5 puntos terminados).
* Tiempo de entrega: 4 a 5 días hábiles.
* Forma de entrega: Hacemos una reunión por Google Meet donde te muestro todo funcionando en vivo, y te entrego el archivo listo para usar en tu computador y te explico cómo operarlo.

Y como recomendación futura, si te interesa que el sistema quede disponible en internet mediante un link público (como www.ignacio-msproject.com) para que cualquier persona o directivo de INACAP pueda entrar desde su celular o PC sin instalar nada, te puedo comentar las opciones de hosting (en mi servidor que hara que tu proyecto funcione 24/7)."

[24/8] Ignacio Manríquez realiza transferencia de $35.000 CLP (Primera cuota). Proyecto iniciado oficialmente.
```

---

## 3. 🔍 Diagnóstico Técnico del Prototipo Inicial (`project_master_enterprise.html`)

### Fortalezas Funcionales Logradas
* **Algoritmo de Ruta Crítica (CPM):** Cálculo automático de fechas tempranas (*Early Start*, *Early Finish*), fechas tardías (*Late Start*, *Late Finish*) y holgura total (*Total Float*) para determinar partidas críticas.
* **Control de Gestión de Valor Ganado (EVM):** Métricas de desempeño de costos y cronograma según estándar PMBOK:
  * $PV$ (*Planned Value* / Valor Planeado)
  * $EV$ (*Earned Value* / Valor Ganado)
  * $SPI$ (*Schedule Performance Index* / Índice de Desempeño del Cronograma)
  * $SV$ (*Schedule Variance* / Varianza del Cronograma)
  * $BAC$ (*Budget at Completion* / Presupuesto Total) y $EAC$ (*Estimate at Completion* / Estimación a la Conclusión).
* **Visualizaciones Interactivas:**
  * Vista Carta Gantt con tabla de 13 columnas y lienzo con barras visuales y flechas de precedencia SVG.
  * Curva S acumulada interactiva ($PV$ vs $EV$).
  * Diagrama de Red Lógica (PERT) con nodos interconectados.
  * Pool de recursos (Mano de obra, materiales, equipos, tarifas y costos por uso).
  * Calendario de feriados y jornadas laborales configurables (Lunes a Viernes / Lunes a Sábado).

### Puntos Críticos a Resolver
1. **Pérdida de Datos y Aislamiento:** Todo se almacena en el `localStorage` del navegador bajo claves estáticas (`pme_t_v32`, `pme_r_v32`, etc.). Si el usuario limpia cookies, abre modo incógnito o cambia de equipo, pierde todo su trabajo.
2. **Botón de Excel Falso:** El botón *"Subir Excel"* actual es un elemento visual estático sin manejador de eventos ni parser de archivos.
3. **Compilación en el Navegador con Babel:** El HTML carga `@babel/standalone` vía CDN, forzando al navegador a transpilar el código JSX en tiempo de ejecución cada vez que se carga la página, generando lentitud y cuelgues en computadores de gama baja.
4. **Vulnerabilidad a Bucles Cíclicos:** Si dos tareas se referencian mutuamente en sus predecesoras (A depende de B y B de A), el bucle `while(chg && iter < 50)` agota iteraciones y deja estados inconsistentes.
5. **Sin Exportación PDF:** No existe forma de imprimir o exportar la carta Gantt ni el cuadro de mando a un formato estándar de presentación física o digital.

---

## 4. 🎯 Alcance y Entregables Comprometidos

| N° | Entregable | Descripción y Criterio de Aceptación |
|---|---|---|
| **1** | **Estructuración Profesional** | Migración del monolito a un proyecto modular con **React + Vite + TypeScript + Tailwind CSS**. Separación limpia en componentes (`GanttTable`, `GanttCanvas`, `DashboardEVM`, `ScurveChart`, `NetworkDiagram`, `ResourcePool`, `CalendarView`) y librerías de cálculo aisladas. |
| **2** | **Importación / Exportación Real de Excel** | Integración con librería de procesamiento de hojas de cálculo (`xlsx` / `exceljs`) para permitir: <br>• Cargar tareas masivamente desde un archivo `.xlsx` o `.csv`. <br>• Descargar la estructura de partidas y costos en formato Excel formateado. |
| **3** | **Corrección de Sincronización Gantt** | Validación de predecesoras, eliminación de descalces al mover fechas manuales o cambiar duraciones, y detección de dependencias circulares. |
| **4** | **Exportación a PDF / Reporte Ejecutivo** | Integración de exportación a PDF (`jspdf` / `html2canvas` / CSS print layout) para generar un informe ejecutivo de la Gantt y KPIs de avance listo para impresión o envío formal. |
| **5** | **Guardado Seguro Multi-Proyecto** | Capacidad de guardar y abrir proyectos completos en archivos individuales (`.json` / `.pme`), permitiendo al usuario gestionar múltiples obras o cotizaciones sin depender de la memoria temporal del navegador. |

---

## 5. 🛠️ Arquitectura Técnica Propuesta

```text
project-master-enterprise/
├── public/
│   └── templates/
│       └── plantilla_importacion_tareas.xlsx
├── src/
│   ├── components/
│   │   ├── Header.tsx              // Fechas de proyecto, selector de vistas, navegación
│   │   ├── Gantt/
│   │   │   ├── GanttView.tsx       // Vista contenedora de Gantt
│   │   │   ├── GanttTable.tsx      // Tabla editable (13 columnas: WBS, Dur, Holg, ES, EF, Pred, etc.)
│   │   │   ├── GanttCanvas.tsx     // Lienzo SVG con líneas de tiempo, barras 3D y flechas
│   │   │   └── GanttToolbar.tsx    // Botones: Agregar, Zoom, Filtros, Importar/Exportar
│   │   ├── Dashboard/
│   │   │   ├── DashboardEVM.tsx    // Tarjetas de KPIs (SPI, SV, EAC, BAC) y gráficos de dona
│   │   │   └── CostDistribution.tsx// Desglose por mano de obra, materiales y equipos
│   │   ├── Network/
│   │   │   └── NetworkDiagram.tsx  // Diagrama PERT con nodos ES/EF/LS/LF interactivos
│   │   ├── Scurve/
│   │   │   └── ScurveChart.tsx     // Curva S interactiva con tooltips de Valor Planeado vs Ganado
│   │   ├── Resources/
│   │   │   └── ResourcePool.tsx    // Tabla de recursos con filtros por tipo, grupo y tarifas
│   │   └── Calendar/
│   │       └── CalendarView.tsx    // Configuración de feriados y días laborables
│   ├── lib/
│   │   ├── cpmEngine.ts            // Algoritmo CPM, cálculo de holguras y ruta crítica
│   │   ├── evmCalculations.ts      // Fórmulas matemáticas de Gestión de Valor Ganado
│   │   ├── excelHandler.ts         // Parser e importador/exportador de Excel con xlsx
│   │   ├── pdfGenerator.ts         // Generación de reportes PDF de la carta Gantt y métricas
│   │   └── projectStorage.ts       // Serialización, guardado y carga de archivos de proyecto
│   ├── types/
│   │   └── project.types.ts        // Tipos TypeScript: Task, Resource, Holiday, EVMMetrics, etc.
│   ├── App.tsx                     // Estado central del proyecto y router de pestañas
│   └── main.tsx                    // Punto de entrada React
├── package.json
└── vite.config.ts
```

---

## 6. 🚀 Plan de Entrega y Oportunidades Futuras (Upsell)

1. **Reunión de Entrega (Google Meet):**
   * Demostración en vivo de las 5 funcionalidades operativas.
   * Capacitación breve sobre el uso del importador de Excel y la exportación de PDFs.
   * Entrega del paquete ejecutable / build empaquetado para uso local sin conexión.
   * Cobro del saldo restante ($30.000 CLP).

2. **Propuesta de Hosting en Nube (Servicio Recurrente We Are Samod):**
   * Ofrecerle alojar la aplicación en el servidor `jota-server` bajo un subdominio profesional con certificado SSL (ej: `projectmaster.wearesamod.com` o dominio propio).
   * Modelo de suscripción mensual sugerido: **$10.000 a $15.000 CLP/mes** que incluye disponibilidad 24/7, acceso desde cualquier celular o tablet y respaldos automáticos.
