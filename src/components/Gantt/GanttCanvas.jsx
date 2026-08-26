import React, { useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { isWorkDay, toHolidaySet } from '../../lib/cpmEngine';

export const GanttCanvas = ({
  canvasScrollRef,
  headerScrollRef,
  visibleTasks = [],
  minD,
  tlDays = [],
}) => {
  const { resources, startDate, statusDate, workingDays, holidays, cpmResult } = useProjectStore();
  const { zoom, showLinks } = useUIStore();

  const totalWidth = tlDays.length * zoom;
  const minTime = minD ? minD.getTime() : 0;

  // Mapa de recursos para lookup O(1)
  const resourceInitialsMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < resources.length; i++) {
      map.set(resources[i].id, resources[i].initials);
      map.set(String(resources[i].id), resources[i].initials);
    }
    return map;
  }, [resources]);

  // Set de feriados normalizado
  const holidaySet = useMemo(() => toHolidaySet(holidays), [holidays]);

  // Posición X de la fecha de estado
  const statusDatePx = useMemo(() => {
    if (!minTime) return 0;
    const stTime = new Date(statusDate + 'T00:00:00').getTime();
    return Math.max(0, (stTime - minTime) / (1000 * 3600 * 24)) * zoom;
  }, [statusDate, minTime, zoom]);

  // Barra de resumen global del proyecto en cabecera
  const globalSummaryBar = useMemo(() => {
    if (!cpmResult.end || !minTime) return null;
    const sT = new Date(startDate + 'T00:00:00').getTime();
    const eT = new Date(cpmResult.end + 'T00:00:00').getTime();
    const left = Math.max(0, (sT - minTime) / (1000 * 3600 * 24)) * zoom;
    const width = Math.max(1, (eT - sT) / (1000 * 3600 * 24)) * zoom;
    return { left, width };
  }, [startDate, cpmResult.end, minTime, zoom]);

  // Pre-calcular grupos de meses del timeline
  const monthGroups = useMemo(() => {
    const groups = [];
    let currentMonth = null;
    let currentCount = 0;

    for (let i = 0; i < tlDays.length; i++) {
      const d = tlDays[i];
      const m = d.toLocaleString('es-CL', { month: 'short', year: 'numeric' });
      if (currentMonth === null) {
        currentMonth = m;
        currentCount = 1;
      } else if (currentMonth === m) {
        currentCount++;
      } else {
        groups.push({ label: currentMonth, count: currentCount });
        currentMonth = m;
        currentCount = 1;
      }
    }
    if (currentMonth !== null) {
      groups.push({ label: currentMonth, count: currentCount });
    }
    return groups;
  }, [tlDays]);

  // Pre-calcular días no laborales para el timeline
  const dayItems = useMemo(() => {
    return tlDays.map((d) => ({
      date: d.getDate(),
      isWork: isWorkDay(d, workingDays, holidaySet),
    }));
  }, [tlDays, workingDays, holidaySet]);

  // Pre-calcular flechas SVG de dependencias con índice O(1)
  const svgLinks = useMemo(() => {
    if (!showLinks || visibleTasks.length === 0 || !minTime) return [];

    const taskIndexMap = new Map();
    for (let i = 0; i < visibleTasks.length; i++) {
      taskIndexMap.set(visibleTasks[i].id, { task: visibleTasks[i], index: i });
    }

    const links = [];

    for (let idx = 0; idx < visibleTasks.length; idx++) {
      const t = visibleTasks[idx];
      if (!t.predecessors || t.isP) continue;

      const preds = String(t.predecessors).split(',');
      for (let p = 0; p < preds.length; p++) {
        const predId = parseInt(preds[p].trim());
        if (isNaN(predId)) continue;

        const predEntry = taskIndexMap.get(predId);
        if (!predEntry) continue;

        const pr = predEntry.task;
        const pIdx = predEntry.index;

        const pStart = new Date(pr.ES + 'T00:00:00').getTime();
        const pEnd = new Date(pr.EF + 'T00:00:00').getTime();
        const cStart = new Date(t.ES + 'T00:00:00').getTime();
        if (isNaN(pStart) || isNaN(pEnd) || isNaN(cStart)) continue;

        const endPx =
          Math.max(
            0,
            (pEnd - minTime) / (1000 * 3600 * 24) + (parseInt(pr.duration) === 0 ? 0 : 1)
          ) * zoom;
        const startPx = Math.max(0, (cStart - minTime) / (1000 * 3600 * 24)) * zoom;

        const pY = pIdx * 32 + 16;
        const cY = idx * 32 + 16;

        const d =
          startPx >= endPx + 10
            ? `M ${endPx} ${pY} L ${endPx + 10} ${pY} L ${endPx + 10} ${cY} L ${startPx - 4} ${cY}`
            : `M ${endPx} ${pY} L ${endPx + 8} ${pY} L ${endPx + 8} ${pY + (cY > pY ? 16 : -16)} L ${
                startPx - 8
              } ${pY + (cY > pY ? 16 : -16)} L ${startPx - 8} ${cY} L ${startPx - 4} ${cY}`;

        const isC = t.crit && pr.crit;
        links.push({
          key: `l-${pr.id}-${t.id}`,
          d,
          isC,
        });
      }
    }

    return links;
  }, [showLinks, visibleTasks, minTime, zoom]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0f172a] z-10 relative">
      {/* 1. Encabezado de la Línea de Tiempo */}
      <div
        ref={headerScrollRef}
        className="bg-[#1e293b] border-b border-slate-700 shrink-0 overflow-hidden"
        style={{ height: '64px' }}
      >
        <div style={{ width: `${totalWidth}px` }} className="flex flex-col h-full">
          {/* Barra Resumen Global en Gantt Header */}
          <div className="h-[32px] bg-amber-500 border-b border-amber-700 relative box-border">
            {globalSummaryBar && (
              <div
                className="absolute top-2 h-3.5 bg-slate-800 rounded shadow"
                style={{
                  left: `${globalSummaryBar.left}px`,
                  width: `${globalSummaryBar.width}px`,
                }}
              ></div>
            )}
          </div>

          {/* Fila de Meses */}
          <div className="h-[16px] flex bg-slate-800 border-b border-slate-700 box-border text-[9px] font-bold text-slate-300">
            {monthGroups.map((g, i) => (
              <div
                key={i}
                className="border-r border-slate-700 px-2 flex items-center shrink-0 overflow-hidden"
                style={{ width: `${g.count * zoom}px` }}
              >
                {g.label}
              </div>
            ))}
          </div>

          {/* Fila de Días */}
          <div className="h-[16px] flex bg-slate-900 box-border">
            {dayItems.map((d, i) => (
              <div
                key={i}
                className={`border-r border-slate-800 flex flex-col items-center justify-center text-[8px] font-bold shrink-0 ${
                  !d.isWork ? 'bg-rose-900/20 text-rose-500' : 'text-slate-400'
                }`}
                style={{ width: `${zoom}px` }}
              >
                {zoom > 18 ? <span>{d.date}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Cuerpo del Lienzo con Barras y Flechas */}
      <div
        ref={canvasScrollRef}
        className="flex-1 overflow-auto relative custom-scrollbar select-none"
      >
        <div
          className="relative pb-10"
          style={{
            width: `${totalWidth}px`,
            minHeight: `${visibleTasks.length * 32 + 50}px`,
          }}
        >
          {/* Capa SVG de Flechas de Precedencia */}
          {showLinks && svgLinks.length > 0 && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
              <defs>
                <marker
                  id="arr"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                </marker>
                <marker
                  id="arrcrit"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
              </defs>

              {svgLinks.map((link) => (
                <path
                  key={link.key}
                  d={link.d}
                  fill="none"
                  stroke={link.isC ? '#ef4444' : '#64748b'}
                  strokeWidth={link.isC ? '2' : '1.5'}
                  markerEnd={link.isC ? 'url(#arrcrit)' : 'url(#arr)'}
                  opacity={link.isC ? 1 : 0.65}
                />
              ))}
            </svg>
          )}

          {/* Capa de Fondo (Rayas de Días No Laborales + Línea de Estado) */}
          <div className="absolute inset-y-0 left-0 flex pointer-events-none w-full h-full z-0">
            {dayItems.map((d, i) => (
              <div
                key={i}
                className={`border-r border-slate-800/30 h-full shrink-0 ${!d.isWork ? 'bg-non-working' : ''}`}
                style={{ width: `${zoom}px` }}
              />
            ))}

            {/* Línea de Fecha de Estado */}
            <div
              className="absolute top-0 bottom-0 border-l border-dashed border-emerald-500 h-full z-10 pointer-events-none"
              style={{ left: `${statusDatePx}px` }}
            >
              <div className="bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-b absolute top-0 -translate-x-1/2 shadow-lg">
                Estado
              </div>
            </div>
          </div>

          {/* Capa de Barras y Elementos Visuales */}
          <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
            {visibleTasks.map((t) => {
              const sT = new Date(t.ES + 'T00:00:00').getTime();
              const eT = new Date(t.EF + 'T00:00:00').getTime();

              if (isNaN(sT) || isNaN(eT) || !minTime) {
                return <div key={t.id} className="w-full border-b border-slate-700/50 h-[32px]"></div>;
              }

              const dur = parseInt(t.duration) || 0;
              const left = Math.max(0, (sT - minTime) / (1000 * 3600 * 24)) * zoom;
              const width = Math.max(1, (eT - sT) / (1000 * 3600 * 24) + (!t.isP && dur === 0 ? 0 : 1)) * zoom;
              const rIni = resourceInitialsMap.get(t.resourceId);

              return (
                <div
                  key={t.id}
                  className="relative w-full border-b border-slate-700/50 h-[32px] hover:bg-slate-800/20 pointer-events-auto flex items-center transition-colors"
                >
                  {t.isP ? (
                    /* 1. Tarea Padre / Fase WBS (Barra Ámbar con Triángulos) */
                    <div
                      className="absolute z-10 drop-shadow-md"
                      style={{ left: `${left}px`, width: `${width}px`, height: '14px' }}
                    >
                      <div className="w-full h-1.5 bg-amber-500 rounded-sm"></div>
                      <div className="absolute left-0 top-1 w-0 h-0 border-t-[5px] border-t-amber-500 border-r-[5px] border-r-transparent -translate-x-full"></div>
                      <div className="absolute right-0 top-1 w-0 h-0 border-t-[5px] border-t-amber-500 border-l-[5px] border-l-transparent translate-x-full"></div>
                    </div>
                  ) : dur === 0 ? (
                    /* 2. Hito (Rombo Girado 45 Grados) */
                    <div
                      className={`absolute w-3.5 h-3.5 rotate-45 border-2 ml-1.5 shadow transition-all ${
                        t.crit
                          ? 'bg-rose-600 border-rose-300 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          : 'bg-blue-600 border-blue-300'
                      }`}
                      style={{ left: `${left}px` }}
                      title={`Hito: ${t.name}${t.crit ? ' (Crítico)' : ''}`}
                    ></div>
                  ) : (
                    /* 3. Barra 3D Normal o Crítica */
                    <div
                      className={`absolute h-4 rounded-sm flex items-center overflow-hidden transition-all ${
                        t.crit ? 'bar-3d-red' : 'bar-3d-blue'
                      }`}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      title={`${t.name} (${t.duration}d) - ${t.progress}%`}
                    >
                      {/* Relleno de Progreso */}
                      <div
                        className="h-full bg-slate-950/40 border-r border-white/20"
                        style={{ width: `${t.progress || 0}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Etiqueta de Texto al Costado Derecho de la Barra */}
                  <div
                    className="absolute flex items-center gap-1.5 text-[9px] pointer-events-none whitespace-nowrap z-20 font-bold"
                    style={{ left: `${left + width + 8}px` }}
                  >
                    <span className="text-slate-300 drop-shadow">{t.name}</span>
                    {rIni && (
                      <span className="text-blue-400 bg-blue-900/60 border border-blue-500/40 px-1 rounded shadow-sm text-[8px]">
                        {rIni}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

