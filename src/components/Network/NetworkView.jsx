import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { formatD } from '../../lib/cpmEngine';

export const NetworkView = () => {
  const { cpmResult } = useProjectStore();
  const { netNodes = { nds: [], w: 800, h: 600 } } = cpmResult;

  return (
    <div className="p-8 h-full overflow-auto bg-[#09090b] relative custom-scrollbar">
      <h2 className="text-2xl font-bold text-white mb-6 sticky left-0 flex items-center">
        <i className="fa-solid fa-diagram-project text-fuchsia-500 mr-3"></i>
        Diagrama de Red Lógica (PERT)
      </h2>

      <div
        className="relative border border-slate-700 rounded bg-[#0f172a] shadow-inner select-none"
        style={{ width: `${netNodes.w}px`, height: `${netNodes.h}px` }}
      >
        {/* Capa SVG de Flechas de Dependencia Curvas */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="m1"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker
              id="m2"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {netNodes.nds.map((n) => {
            if (!n.predecessors) return null;
            return String(n.predecessors)
              .split(',')
              .map((p) => {
                const pr = netNodes.nds.find((x) => x.id === parseInt(p.trim()));
                if (!pr) return null;
                const isC = n.crit && pr.crit;
                const sx = pr.x + pr.w;
                const sy = pr.y + pr.h / 2;
                const ex = n.x;
                const ey = n.y + n.h / 2;

                return (
                  <path
                    key={`n-${pr.id}-${n.id}`}
                    d={`M ${sx} ${sy} C ${sx + 40} ${sy}, ${ex - 40} ${ey}, ${ex} ${ey}`}
                    fill="none"
                    stroke={isC ? '#ef4444' : '#64748b'}
                    strokeWidth={isC ? '2.5' : '1.5'}
                    markerEnd={isC ? 'url(#m2)' : 'url(#m1)'}
                  />
                );
              });
          })}
        </svg>

        {/* Nodos PERT (6 Campos Clásicos: ES, Dur, EF, ID, Nombre, LS, Holgura, LF) */}
        {netNodes.nds.map((n) => (
          <div
            key={n.id}
            className={`absolute bg-[#1e293b] rounded shadow flex flex-col text-[9px] border-2 z-10 hover:scale-105 transition-transform ${
              n.crit
                ? 'border-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                : 'border-blue-500'
            }`}
            style={{
              left: `${n.x}px`,
              top: `${n.y}px`,
              width: `${n.w}px`,
              height: `${n.h}px`,
            }}
          >
            {/* Fila Superior: ES | Duración | EF */}
            <div className="flex bg-slate-800 border-b border-slate-700 text-slate-300 font-bold">
              <div className="flex-1 text-center py-1 border-r border-slate-700">{formatD(n.ES)}</div>
              <div className="w-9 text-center py-1 text-white bg-slate-700/50">{n.duration}d</div>
              <div className="flex-1 text-center py-1 border-l border-slate-700">{formatD(n.EF)}</div>
            </div>

            {/* Fila Central: ID y Nombre */}
            <div className="flex-1 flex flex-col items-center justify-center p-1 text-center overflow-hidden">
              <span className="text-[8px] text-slate-500 font-bold mb-0.5">ID: {n.id}</span>
              <span className="text-white font-black leading-tight line-clamp-2">{n.name}</span>
            </div>

            {/* Fila Inferior: LS | Holgura TF | LF */}
            <div className="flex bg-slate-800 border-t border-slate-700 text-slate-400 font-bold">
              <div className="flex-1 text-center py-1 border-r border-slate-700">{formatD(n.LS)}</div>
              <div className={`w-9 text-center py-1 font-black ${n.crit ? 'text-rose-400' : 'text-amber-400'}`}>
                {n.TF}d
              </div>
              <div className="flex-1 text-center py-1 border-l border-slate-700">{formatD(n.LF)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
