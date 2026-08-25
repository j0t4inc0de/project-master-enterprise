import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { isWorkDay } from '../../lib/cpmEngine';

export const GanttCanvas = ({
  canvasScrollRef,
  headerScrollRef,
  onScroll,
  visibleTasks = [],
  minD,
  tlDays = [],
}) => {
  const { resources, startDate, statusDate, workingDays, holidays, cpmResult } = useProjectStore();
  const { zoom, showLinks } = useUIStore();

  const totalWidth = tlDays.length * zoom;
  const statusDatePx = Math.max(0, (new Date(statusDate + 'T00:00:00') - minD) / (1000 * 3600 * 24)) * zoom;

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
            {cpmResult.end && (
              <div
                className="absolute top-2 h-3.5 bg-slate-800 rounded shadow"
                style={{
                  left: `${
                    Math.max(0, (new Date(startDate + 'T00:00:00').getTime() - minD.getTime()) / (1000 * 3600 * 24)) *
                    zoom
                  }px`,
                  width: `${
                    Math.max(
                      1,
                      (new Date(cpmResult.end + 'T00:00:00').getTime() -
                        new Date(startDate + 'T00:00:00').getTime()) /
                        (1000 * 3600 * 24)
                    ) * zoom
                  }px`,
                }}
              ></div>
            )}
          </div>

          {/* Fila de Meses */}
          <div className="h-[16px] flex bg-slate-800 border-b border-slate-700 box-border text-[9px] font-bold text-slate-300">
            {tlDays.reduce((acc, date, i, arr) => {
              const m = date.toLocaleString('es-CL', { month: 'short', year: 'numeric' });
              if (i === 0 || arr[i - 1].getMonth() !== date.getMonth()) {
                const dinM = arr.filter(
                  (d) => d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
                ).length;
                acc.push(
                  <div
                    key={m + i}
                    className="border-r border-slate-700 px-2 flex items-center shrink-0 overflow-hidden"
                    style={{ width: `${dinM * zoom}px` }}
                  >
                    {m}
                  </div>
                );
              }
              return acc;
            }, [])}
          </div>

          {/* Fila de Días */}
          <div className="h-[16px] flex bg-slate-900 box-border">
            {tlDays.map((d, i) => {
              const isWork = isWorkDay(d, workingDays, holidays);
              return (
                <div
                  key={i}
                  className={`border-r border-slate-800 flex flex-col items-center justify-center text-[8px] font-bold ${
                    !isWork ? 'bg-rose-900/20 text-rose-500' : 'text-slate-400'
                  }`}
                  style={{ width: `${zoom}px` }}
                >
                  {zoom > 18 ? <span>{d.getDate()}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Cuerpo del Lienzo con Barras y Flechas */}
      <div
        ref={canvasScrollRef}
        onScroll={onScroll}
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
          {showLinks && (
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

              {visibleTasks.map((t, idx) => {
                if (!t.predecessors || t.isP) return null;
                return String(t.predecessors)
                  .split(',')
                  .map((p) => {
                    const pIdx = visibleTasks.findIndex((x) => x.id === parseInt(p.trim()));
                    if (pIdx === -1) return null;
                    const pr = visibleTasks[pIdx];

                    const pStart = new Date(pr.ES + 'T00:00:00').getTime();
                    const pEnd = new Date(pr.EF + 'T00:00:00').getTime();
                    const cStart = new Date(t.ES + 'T00:00:00').getTime();
                    if (isNaN(pStart) || isNaN(pEnd) || isNaN(cStart)) return null;

                    const endPx =
                      Math.max(
                        0,
                        (pEnd - minD.getTime()) / (1000 * 3600 * 24) + (parseInt(pr.duration) === 0 ? 0 : 1)
                      ) * zoom;
                    const startPx = Math.max(0, (cStart - minD.getTime()) / (1000 * 3600 * 24)) * zoom;

                    const pY = pIdx * 32 + 16;
                    const cY = idx * 32 + 16;

                    let d =
                      startPx >= endPx + 10
                        ? `M ${endPx} ${pY} L ${endPx + 10} ${pY} L ${endPx + 10} ${cY} L ${startPx - 4} ${cY}`
                        : `M ${endPx} ${pY} L ${endPx + 8} ${pY} L ${endPx + 8} ${pY + (cY > pY ? 16 : -16)} L ${
                            startPx - 8
                          } ${pY + (cY > pY ? 16 : -16)} L ${startPx - 8} ${cY} L ${startPx - 4} ${cY}`;

                    const isC = t.crit && pr.crit;
                    return (
                      <path
                        key={`l-${pr.id}-${t.id}`}
                        d={d}
                        fill="none"
                        stroke={isC ? '#ef4444' : '#64748b'}
                        strokeWidth={isC ? '2' : '1.5'}
                        markerEnd={isC ? 'url(#arrcrit)' : 'url(#arr)'}
                        opacity={isC ? 1 : 0.65}
                      />
                    );
                  });
              })}
            </svg>
          )}

          {/* Capa de Fondo (Rayas de Días No Laborales + Línea de Estado) */}
          <div className="absolute inset-y-0 left-0 flex pointer-events-none w-full h-full z-0">
            {tlDays.map((d, i) => {
              const isWork = isWorkDay(d, workingDays, holidays);
              return (
                <div
                  key={i}
                  className={`border-r border-slate-800/30 h-full ${!isWork ? 'bg-non-working' : ''}`}
                  style={{ width: `${zoom}px` }}
                />
              );
            })}

            {/* Línea de Fecha de Estado */}
            <div
              className="absolute top-0 bottom-0 border-l border-dashed border-emerald-500 h-full z-10"
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

              if (isNaN(sT) || isNaN(eT)) {
                return <div key={t.id} className="w-full border-b border-slate-700/50 h-[32px]"></div>;
              }

              const dur = parseInt(t.duration) || 0;
              const left = Math.max(0, (sT - minD.getTime()) / (1000 * 3600 * 24)) * zoom;
              const width = Math.max(1, (eT - sT) / (1000 * 3600 * 24) + (!t.isP && dur === 0 ? 0 : 1)) * zoom;
              const rIni = resources.find((r) => r.id === t.resourceId)?.initials;

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
                      className="absolute w-3.5 h-3.5 bg-slate-500 rotate-45 border-2 border-slate-300 ml-1.5 shadow"
                      style={{ left: `${left}px` }}
                      title={`Hito: ${t.name}`}
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
