import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export const ScurveView = () => {
  const { cpmResult } = useProjectStore();
  const { hoverScurve, setHoverScurve } = useUIStore();

  const { evm = {}, scurveData = [] } = cpmResult;

  return (
    <div className="p-8 h-full overflow-auto bg-[#0f172a] custom-scrollbar">
      <div className="max-w-5xl mx-auto bg-[#1e293b] border border-slate-700 p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fa-solid fa-chart-area text-blue-500 mr-3"></i>
          Curva S Acumulada Interactiva (EVM)
        </h2>

        {/* Métricas Resumen */}
        <div className="flex flex-wrap gap-8 mb-6 p-4 bg-slate-900/60 rounded-lg border border-slate-700">
          <div className="text-sm">
            <span className="text-slate-400">Valor Planeado (PV):</span>{' '}
            <span className="text-blue-400 font-bold ml-1">
              ${Math.round(evm.pv || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Valor Ganado (EV):</span>{' '}
            <span className="text-emerald-400 font-bold ml-1">
              ${Math.round(evm.ev || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-slate-400">Índice Desempeño (SPI):</span>{' '}
            <span
              className={`font-bold ml-1 px-2 py-0.5 rounded text-xs ${
                (evm.spi || 1) >= 1 ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' : 'bg-rose-950 text-rose-400 border border-rose-600'
              }`}
            >
              {(evm.spi || 1).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Lienzo SVG de la Curva S */}
        <div
          className="h-[400px] w-full bg-[#09090b] rounded-lg border border-slate-700 relative p-6 shadow-inner"
          onMouseLeave={() => setHoverScurve(null)}
        >
          <svg viewBox="0 0 1000 300" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {/* Líneas de Guía Horizontales */}
            <line x1="0" y1="0" x2="1000" y2="0" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="0" y1="150" x2="1000" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="0" y1="300" x2="1000" y2="300" stroke="#334155" strokeWidth="2" />

            {/* Trazo Curva PV (Azul) */}
            {scurveData.length > 0 && (
              <path
                d={scurveData.reduce((p, d, i) => p + `${i === 0 ? 'M' : 'L'} ${d.x} ${d.pvY}`, '')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              />
            )}

            {/* Trazo Curva EV (Verde punteado) */}
            {scurveData.filter((d) => d.evY !== null).length > 0 && (
              <path
                d={scurveData
                  .filter((d) => d.evY !== null)
                  .reduce((p, d, i) => p + `${i === 0 ? 'M' : 'L'} ${d.x} ${d.evY}`, '')}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray="8,4"
                className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
            )}

            {/* Puntos y Zonas de Hover Interactivas */}
            {scurveData.map((d, i) => {
              const isHov = hoverScurve === i;
              return (
                <g key={i}>
                  {isHov && (
                    <line
                      x1={d.x}
                      y1="0"
                      x2={d.x}
                      y2="300"
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      className="pointer-events-none"
                    />
                  )}
                  <circle
                    cx={d.x}
                    cy={d.pvY}
                    r={isHov ? 8 : 5}
                    fill="#0f172a"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    className="pointer-events-none transition-all"
                  />
                  {d.evY !== null && (
                    <circle
                      cx={d.x}
                      cy={d.evY}
                      r={isHov ? 8 : 5}
                      fill="#0f172a"
                      stroke="#10b981"
                      strokeWidth="3"
                      className="pointer-events-none transition-all"
                    />
                  )}
                  <rect
                    x={d.x - 40}
                    y="0"
                    width="80"
                    height="300"
                    fill="transparent"
                    className="cursor-crosshair outline-none"
                    onMouseEnter={() => setHoverScurve(i)}
                  />
                  <text x={d.x} y={325} className="text-[10px] fill-slate-500 font-bold" textAnchor="middle">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip Flotante */}
          {hoverScurve !== null && scurveData[hoverScurve] && (
            <div
              className="absolute top-4 bg-[#1e293b]/95 border border-slate-500 p-4 rounded-xl shadow-2xl pointer-events-none z-50 w-64 backdrop-blur-md"
              style={{
                left: `calc(40px + ${hoverScurve * 10}%)`,
                transform: hoverScurve > 5 ? 'translateX(-110%)' : 'translateX(10%)',
              }}
            >
              <p className="text-white font-black text-sm border-b border-slate-600 pb-2 mb-3 flex items-center">
                <i className="fa-regular fa-calendar text-blue-400 mr-2"></i>
                {scurveData[hoverScurve].label}
              </p>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-blue-400 font-bold">PV (Valor Planeado)</span>
                <span className="text-white font-black">
                  ${Math.round(scurveData[hoverScurve].pvVal || 0).toLocaleString()}
                </span>
              </div>
              {scurveData[hoverScurve].evVal !== null && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">EV (Valor Ganado)</span>
                  <span className="text-white font-black">
                    ${Math.round(scurveData[hoverScurve].evVal || 0).toLocaleString()}
                  </span>
                </div>
              )}
              {scurveData[hoverScurve].evVal !== null && (() => {
                const ptPv = Number(scurveData[hoverScurve].pvVal) || 0;
                const ptEv = Number(scurveData[hoverScurve].evVal) || 0;
                const ptSpi = ptPv > 0 ? ptEv / ptPv : (ptEv > 0 ? 1 : 1);
                return (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-xs uppercase">SPI (Punto)</span>
                    <span
                      className={`px-2 py-0.5 rounded font-black text-xs ${
                        ptSpi >= 1
                          ? 'bg-emerald-900/50 text-emerald-400'
                          : 'bg-rose-900/50 text-rose-400'
                      }`}
                    >
                      {ptSpi.toFixed(2)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Leyenda de Colores */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded border border-blue-400"></div>
            <span className="text-slate-300 font-bold text-xs">PV (Planificado)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded border border-emerald-400 border-dashed"></div>
            <span className="text-slate-300 font-bold text-xs">EV (Real Acumulado)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
